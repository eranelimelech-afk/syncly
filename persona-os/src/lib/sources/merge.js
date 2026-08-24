import { withRates, validatePosts } from "./schema.js";
import { validateRecord } from "./local.js";
import { attributeSubs } from "./fanvue.js";

/**
 * Joins the two halves of a post: what Instagram measured, and what only this
 * system knows. See docs/INSTAGRAM.md.
 *
 * The join key is ig_media_id. Everything that fails to join is reported rather
 * than dropped — a silently discarded post understates reach, and a silently
 * untagged one would quietly bias every lift number toward whatever did tag.
 */
export function mergePosts({ records, metrics, fanvue, personaId = "vane" }) {
  const byMedia = new Map(metrics.map((m) => [m.igMediaId, m]));
  const claimed = new Set();

  const joined = [];
  const problems = { untagged: [], unmeasured: [], orphanMetrics: [], notPublished: [] };

  for (const r of records) {
    if (!r.igMediaId) { problems.notPublished.push({ id: r.id, title: r.title }); continue; }

    const m = byMedia.get(r.igMediaId);
    if (!m) { problems.unmeasured.push({ id: r.id, igMediaId: r.igMediaId }); continue; }
    claimed.add(r.igMediaId);

    const gaps = validateRecord(r);
    if (gaps.length) { problems.untagged.push({ id: r.id, igMediaId: r.igMediaId, gaps }); continue; }

    joined.push({
      id: r.id,
      day: m.day,
      world: r.world, purpose: r.purpose, hook: r.hook,
      slot: r.slot, mode: r.mode, clue: r.clue,
      // Format is measured, not declared: what actually went out wins over what
      // was planned, because that is what the numbers below belong to.
      format: m.format,
      qa: r.qa,
      reach: m.reach, shares: m.shares, saves: m.saves,
      follows: m.follows, visits: m.visits, watch: m.watch,
      line: r.line ?? m.line,
      subs: 0,
      igMediaId: m.igMediaId,
      channel: r.channel,
    });
  }

  for (const m of metrics) {
    if (!claimed.has(m.igMediaId)) {
      problems.orphanMetrics.push({ igMediaId: m.igMediaId, day: m.day, reach: m.reach });
    }
  }

  const withSubs = fanvue
    ? attributeSubs(joined, fanvue)
    : { posts: joined, unattributed: [] };

  const posts = withSubs.posts
    .map(withRates)
    .sort((a, b) => (a.igMediaId < b.igMediaId ? -1 : 1));

  validatePosts(posts, `merge:${personaId}`);
  return { posts, problems: { ...problems, unattributedSubs: withSubs.unattributed } };
}

/** One-line summaries of anything the join could not account for. */
export function describeProblems(p) {
  const out = [];
  if (p.notPublished.length) out.push(`${p.notPublished.length} פריטים הוכנו אך טרם פורסמו — אין להם מדדים`);
  if (p.unmeasured.length) out.push(`${p.unmeasured.length} פוסטים פורסמו אך לא חזרו מהחלון שנשלף`);
  if (p.untagged.length) out.push(`${p.untagged.length} פוסטים חסרי תיוג — לא ייכנסו לניתוח עד שיושלמו`);
  if (p.orphanMetrics.length) out.push(`${p.orphanMetrics.length} פוסטים באינסטגרם ללא רשומה מקומית — פורסמו מחוץ למערכת`);
  if (p.unattributedSubs.length) {
    const n = p.unattributedSubs.reduce((a, x) => a + x.subs, 0);
    out.push(`${n} מנויי פאנביו לא יוחסו לפוסט — הייצוא ברמת יום`);
  }
  return out;
}
