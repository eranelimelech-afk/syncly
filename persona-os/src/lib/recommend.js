import { WORLD, PURPOSE, FORMAT, HOOK, SLOT, defaultPurpose, purposesFor } from "../data/dimensions.js";
import { SYMBOLS, LADDER } from "../data/bible.js";
import { LINES } from "./history.js";

/**
 * Recommendation engine. Crosses four inputs:
 *   1. bible quota vs what was actually published
 *   2. the five-purpose split
 *   3. measured past performance per dimension value
 *   4. symbol cooldown (bible: one clue at a time)
 * North star is followPer1k — NOT raw reach. Changing this changes the
 * character's whole trajectory; see CLAUDE.md.
 */
export const NORTH = "followPer1k";

export function recommend(posts, count = 7) {
  const n = posts.length;
  const base = posts.reduce((a, p) => a + p[NORTH], 0) / n;
  // Same sample floor the lift view uses. A purpose measured on two posts must
  // not steer the next seven — it would swing the plan on noise, and the plan is
  // what gets produced. Below the floor the value falls back to the average,
  // which makes it neutral rather than persuasive.
  const avgBy = (key, val) => {
    const s = posts.filter((p) => p[key] === val);
    return s.length >= MIN_N ? s.reduce((a, p) => a + p[NORTH], 0) / s.length : base;
  };
  const measured = (key, val) => posts.filter((p) => p[key] === val).length >= MIN_N;
  // Only values with enough posts behind them may win "best".
  const bestOf = (key, dict) => {
    const ks = Object.keys(dict).filter((v) => measured(key, v));
    if (!ks.length) return Object.keys(dict)[0];
    return ks.map((v) => ({ v, s: avgBy(key, v) })).sort((a, b) => b.s - a.s)[0].v;
  };

  const bestFormat = bestOf("format", FORMAT);
  const bestSlot = bestOf("slot", SLOT);
  const bestHook = bestOf("hook", HOOK);
  const bestPurpose = bestOf("purpose", PURPOSE);

  const worlds = Object.keys(WORLD)
    .map((w) => {
      const actual = posts.filter((p) => p.world === w).length / n;
      return { w, he: WORLD[w].he, target: WORLD[w].target, actual, deficit: WORLD[w].target - actual, perf: avgBy("world", w) / base };
    })
    .sort((a, b) => (b.deficit * 3 + (b.perf - 1)) - (a.deficit * 3 + (a.perf - 1)));

  const purposes = Object.keys(PURPOSE).map((k) => ({
    k, he: PURPOSE[k].he, actual: posts.filter((p) => p.purpose === k).length / n, perf: avgBy("purpose", k) / base,
  }));

  const syms = [...SYMBOLS].sort((a, b) => (b.last - b.cool) - (a.last - a.cool));
  const nextEp = LADDER.find((l) => !l.done);

  const plan = [];
  for (let i = 0; i < count; i++) {
    const w = worlds[i % Math.min(worlds.length, 5)];
    const sym = syms[i % syms.length];
    const isPlot = w.w === "room707" || (i === 3 && !!nextEp);
    // Within a world, prefer the purpose that world can carry AND that has
    // measured best. Falls back to the world's default. This is where the remap
    // pays: a hotel post is no longer Lifestyle by default.
    const options = purposesFor(w.w);
    const ranked = options
      .filter((p) => measured("purpose", p))
      .map((p) => ({ p, s: avgBy("purpose", p) }))
      .sort((a, b) => b.s - a.s);
    const purpose = isPlot
      ? "curiosity"
      : options.includes(bestPurpose) && i % 3 === 1 ? bestPurpose
      : ranked.length ? ranked[0].p
      : defaultPurpose(w.w);
    const format = w.w === "community" ? "still" : w.w === "fitness" ? "reel" : bestFormat;
    const slot = w.w === "morning" || w.w === "fitness" ? "morning" : bestSlot;
    const mode = w.w === "hotels" || w.w === "dining" ? "editorial" : "social";
    const lift = WORLD[w.w].follow * PURPOSE[purpose].follow * FORMAT[format].follow * SLOT[slot].follow * HOOK[bestHook].follow * 1.4;
    plan.push({
      i: i + 1, w: w.w, he: w.he, purpose, format, slot, mode, hook: bestHook, sym,
      isPlot, ep: isPlot ? nextEp : null,
      line: isPlot ? LINES.room707[i % 3] : LINES[w.w][i % 3],
      deficit: w.deficit, perf: w.perf, lift,
    });
  }
  return { worlds, purposes, plan, nextEp, bestPurpose };
}

/**
 * Below this many posts a cell is noise, not a reading. Thirty posts spread over
 * seven dimensions leaves most cells with two to four posts, and a two-post cell
 * will happily report a 66% swing. Cells under the floor are still shown — the
 * gap is information — but they are marked and kept off the headline board so a
 * fluke cannot be mistaken for a finding.
 */
export const MIN_N = 5;

/** Lift analysis: each value vs the persona average, for any metric. */
export function analyseLift(posts, dims, metric) {
  const base = posts.reduce((a, p) => a + p[metric], 0) / posts.length;
  return dims.map((d) => ({
    ...d, base,
    rows: Object.keys(d.dict).map((v) => {
      const s = posts.filter((p) => p[d.key] === v);
      if (!s.length) return null;
      const avg = s.reduce((a, p) => a + p[metric], 0) / s.length;
      // A metric can legitimately be zero across every post (e.g. Fanvue
      // subscribers for an Instagram-only persona). Without this, lift is NaN.
      const lift = base === 0 ? 0 : ((avg - base) / base) * 100;
      return { v, he: d.dict[v].he, n: s.length, lift, low: s.length < MIN_N };
    }).filter(Boolean).sort((a, b) => b.lift - a.lift),
  }));
}
