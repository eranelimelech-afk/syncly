import test from "node:test";
import assert from "node:assert/strict";

import { withRates, validatePosts, ALL_FIELDS } from "./schema.js";
import { mapMedia, flattenInsights } from "./instagram.js";
import { parseCsv, parseFanvue, toDay, attributeSubs } from "./fanvue.js";
import { createStore } from "./local.js";
import { mergePosts } from "./merge.js";
import { loadPosts } from "./index.js";
import { buildHistory } from "../history.js";

const media = (id, over = {}) => ({
  id, timestamp: "2026-07-08T19:30:00+0000",
  media_product_type: "REELS", media_type: "VIDEO", caption: "Still here.", ...over,
});
const insights = (o) => ({ data: Object.entries(o).map(([name, value]) => ({ name, values: [{ value }] })) });
const fullMetrics = (id, over = {}) => ({
  ...mapMedia(media(id), insights({
    reach: 10000, shares: 60, saved: 200, follows: 70, profile_visits: 300, ig_reels_avg_watch_time: 44,
  })), ...over,
});
const record = (id, over = {}) => ({
  id, world: "hotels", purpose: "lifestyle", format: "reel", hook: "cut",
  slot: "evening", mode: "social", clue: "one", qa: 92, line: "Still here.", ...over,
});

test("the seeded source still satisfies the canonical schema", () => {
  validatePosts(buildHistory("vane"), "seeded");
});

test("every source produces the identical field set", async () => {
  const seeded = (await loadPosts({ source: "seeded" })).posts[0];
  const store = createStore([record("q1", { igMediaId: "m1" })]);
  const live = mergePosts({ records: store.all(), metrics: [fullMetrics("m1")] }).posts[0];
  const keys = (o) => Object.keys(o).filter((k) => ALL_FIELDS.includes(k)).sort();
  assert.deepEqual(keys(live), keys(seeded));
  assert.deepEqual(keys(seeded), [...ALL_FIELDS].sort());
});

test("validatePosts rejects a NaN that would poison every average", () => {
  assert.throws(() => validatePosts([{ ...withRates({ ...record("a"), reach: 0, shares: 0, saves: 0, follows: 0, visits: 0, subs: 0, watch: null, day: "1.1" }), reach: NaN }], "x"),
    /non-finite "reach"/);
});

test("rates survive a post with zero reach instead of emitting NaN", () => {
  const p = withRates({ reach: 0, shares: 3, saves: 1, follows: 2, subs: 1 });
  for (const k of ["saveRate", "sharePer1k", "followPer1k", "subPer1k"]) {
    assert.equal(p[k], 0, `${k} should be 0, got ${p[k]}`);
  }
});

test("mapMedia reads Meta's field names, not ours", () => {
  const p = mapMedia(media("m1"), insights({ reach: 100, saved: 9, profile_visits: 12, follows: 4 }));
  assert.equal(p.saves, 9);   // API says "saved"
  assert.equal(p.visits, 12); // API says "profile_visits"
  assert.equal(p.follows, 4);
});

test("watch time is null for non-reels, not zero", () => {
  assert.equal(mapMedia(media("m1", { media_product_type: "FEED", media_type: "IMAGE" }), insights({})).watch, null);
  assert.equal(mapMedia(media("m1")).watch !== null, true);
});

test("format comes from what was published, not what was planned", () => {
  const store = createStore([record("q1", { igMediaId: "m1", format: "carousel" })]);
  const out = mergePosts({ records: store.all(), metrics: [fullMetrics("m1")] });
  assert.equal(out.posts[0].format, "reel");
});

test("missing insight values default to 0 rather than undefined", () => {
  assert.equal(flattenInsights({ data: [{ name: "reach", values: [] }] }).reach, 0);
  assert.equal(mapMedia(media("m1"), { data: [] }).reach, 0);
});

test("an untagged post is withheld from analysis and reported", () => {
  const store = createStore([record("q1", { igMediaId: "m1", world: undefined })]);
  const out = mergePosts({ records: store.all(), metrics: [fullMetrics("m1")] });
  assert.equal(out.posts.length, 0);
  assert.equal(out.problems.untagged.length, 1);
  assert.match(out.problems.untagged[0].gaps.join(), /world/);
});

test("a post published outside the system is surfaced, never silently dropped", () => {
  const out = mergePosts({ records: [], metrics: [fullMetrics("stranger")] });
  assert.equal(out.posts.length, 0);
  assert.equal(out.problems.orphanMetrics[0].igMediaId, "stranger");
});

test("a prepared but unpublished item is not counted as a zero-reach post", () => {
  const out = mergePosts({ records: [record("q1")], metrics: [] });
  assert.equal(out.posts.length, 0);
  assert.equal(out.problems.notPublished.length, 1);
});

test("linkMedia refuses to relink a record to a different media", () => {
  const store = createStore([record("q1")]);
  store.linkMedia("q1", "m1", "2026-07-08");
  assert.equal(store.get("q1").igMediaId, "m1");
  store.linkMedia("q1", "m1", "2026-07-08"); // idempotent
  assert.throws(() => store.linkMedia("q1", "m2"), /already linked/);
  assert.throws(() => store.linkMedia("nope", "m3"), /unknown record/);
});

test("CSV parser handles quotes, embedded commas and CRLF", () => {
  const rows = parseCsv('date,subscribers,note\r\n2026-07-08,12,"a, ""b"", c"\r\n');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].subscribers, "12");
  assert.equal(rows[0].note, 'a, "b", c');
});

test("dates normalise to the app's day format", () => {
  assert.equal(toDay("2026-07-08"), "8.7");
  assert.equal(toDay("garbage"), null);
});

test("subs attach only where attribution is real", () => {
  const f = parseFanvue("date,subscribers\n2026-07-08,12\n2026-07-09,10\n");
  const posts = [
    { id: "a", day: "8.7", igMediaId: "m1" },
    { id: "b", day: "9.7", igMediaId: "m2" },
    { id: "c", day: "9.7", igMediaId: "m3" },
  ];
  const { posts: out, unattributed } = attributeSubs(posts, f);
  assert.equal(out.find((p) => p.id === "a").subs, 12, "one post that day -> attributed");
  assert.equal(out.find((p) => p.id === "b").subs, 0, "two posts that day -> not split");
  assert.equal(out.find((p) => p.id === "c").subs, 0);
  assert.equal(unattributed.reduce((s, u) => s + u.subs, 0), 10, "the remainder is reported");
});

test("an export carrying a media reference attributes exactly", () => {
  const f = parseFanvue("date,subscribers,media_id\n2026-07-09,10,m3\n");
  const { posts: out, unattributed } = attributeSubs(
    [{ id: "b", day: "9.7", igMediaId: "m2" }, { id: "c", day: "9.7", igMediaId: "m3" }], f);
  assert.equal(out.find((p) => p.id === "c").subs, 10);
  assert.equal(unattributed.length, 0);
});

test("live source refuses to run without the local records", async () => {
  await assert.rejects(() => loadPosts({ source: "live" }), /needs a local record store/);
});

test("live source joins metrics, tags and subs end to end", async () => {
  const store = createStore([
    record("q1", { igMediaId: "m1" }),
    record("q2", { igMediaId: "m2", world: "room707", purpose: "curiosity" }),
  ]);
  const rows = [
    { media: media("m1"), insights: insights({ reach: 10000, shares: 60, saved: 200, follows: 70, profile_visits: 300, ig_reels_avg_watch_time: 44 }) },
    { media: media("m2", { timestamp: "2026-07-09T21:00:00+0000" }), insights: insights({ reach: 5000, shares: 90, saved: 150, follows: 60, profile_visits: 200, ig_reels_avg_watch_time: 51 }) },
  ];
  const fetchImpl = async () => ({ ok: true, json: async () => rows });
  const out = await loadPosts({
    source: "live", store, fetchImpl,
    fanvueCsv: "date,subscribers\n2026-07-09,25\n",
  });
  assert.equal(out.posts.length, 2);
  const q2 = out.posts.find((p) => p.id === "q2");
  assert.equal(q2.subs, 25, "single post that day gets the subs");
  assert.equal(q2.followPer1k, 12, "60 follows / 5000 reach * 1000");
  assert.equal(q2.subPer1k, 5);
  assert.equal(out.problems.orphanMetrics.length, 0);
  validatePosts(out.posts, "live-e2e");
});

test("a failing backend surfaces the status instead of returning empty data", async () => {
  const store = createStore([record("q1", { igMediaId: "m1" })]);
  const fetchImpl = async () => ({ ok: false, status: 401 });
  await assert.rejects(() => loadPosts({ source: "live", store, fetchImpl }), /returned 401/);
});

// --- lift analysis sample floor -------------------------------------------
import { analyseLift, MIN_N } from "../recommend.js";
import { DIMS } from "../../data/dimensions.js";

const post = (over) => withRates({
  id: over.id, day: "1.1", world: "hotels", purpose: "lifestyle", format: "reel",
  hook: "cut", slot: "evening", mode: "social", clue: "one", qa: 90,
  reach: 1000, shares: 10, saves: 10, follows: 10, visits: 10, subs: 1, line: "", watch: null,
  ...over,
});

test("a cell below the sample floor is marked, not silently trusted", () => {
  const posts = [
    ...Array.from({ length: 20 }, (_, i) => post({ id: `a${i}`, clue: "one" })),
    ...Array.from({ length: 2 }, (_, i) => post({ id: `b${i}`, clue: "many", follows: 900 })),
  ];
  const dim = analyseLift(posts, DIMS.filter((d) => d.key === "clue"), "followPer1k")[0];
  const many = dim.rows.find((r) => r.v === "many");
  const one = dim.rows.find((r) => r.v === "one");
  assert.equal(many.n, 2);
  assert.equal(many.low, true, "a two-post cell must be flagged");
  assert.equal(one.low, false, "a twenty-post cell must not be");
  assert.ok(many.lift > 100, "the flagged cell is exactly the kind that shouts loudest");
});

test("MIN_N is the documented floor", () => {
  assert.equal(MIN_N, 5);
  const posts = Array.from({ length: MIN_N }, (_, i) => post({ id: `c${i}` }));
  const dim = analyseLift(posts, DIMS.filter((d) => d.key === "clue"), "followPer1k")[0];
  assert.equal(dim.rows.find((r) => r.v === "one").low, false, "exactly MIN_N clears the floor");
});
