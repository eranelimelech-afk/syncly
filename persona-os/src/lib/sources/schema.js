/**
 * The canonical post shape. Every source must produce exactly this.
 *
 * ROADMAP step 1 says to keep the schema identical so the analyses keep working,
 * so that promise is enforced here rather than trusted: `validatePosts` runs in
 * dev and throws on the first source that drifts.
 */

/** Fields a source must supply. */
export const RAW_FIELDS = [
  "id", "day", "world", "purpose", "format", "hook", "slot", "mode", "clue",
  "qa", "reach", "shares", "saves", "follows", "visits", "subs", "line", "watch",
];

/** Fields derived from the raw ones. Never supplied by a source. */
export const DERIVED_FIELDS = ["saveRate", "sharePer1k", "followPer1k", "subPer1k"];

export const ALL_FIELDS = [...RAW_FIELDS, ...DERIVED_FIELDS];

const NUMERIC = ["qa", "reach", "shares", "saves", "follows", "visits", "subs", ...DERIVED_FIELDS];

/**
 * Adds the per-1000 fields. Reach can legitimately be zero on a post that never
 * left the account, so guard the division rather than emitting NaN — a NaN here
 * poisons every average downstream.
 */
export function withRates(p) {
  const per = (n) => (p.reach > 0 ? (n / p.reach) * 1000 : 0);
  return {
    ...p,
    saveRate: p.reach > 0 ? (p.saves / p.reach) * 100 : 0,
    sharePer1k: per(p.shares),
    followPer1k: per(p.follows),
    subPer1k: per(p.subs),
  };
}

export function validatePosts(posts, sourceName) {
  const fail = (msg) => { throw new Error(`source "${sourceName}": ${msg}`); };
  if (!Array.isArray(posts)) fail("did not return an array");
  posts.forEach((p, i) => {
    const at = `post ${i} (${p?.id ?? "no id"})`;
    for (const f of ALL_FIELDS) if (!(f in p)) fail(`${at} is missing "${f}"`);
    for (const f of NUMERIC) {
      if (typeof p[f] !== "number" || !Number.isFinite(p[f])) fail(`${at} has non-finite "${f}": ${p[f]}`);
    }
    // watch is null for anything that is not a reel — that is meaningful, not missing.
    if (p.watch !== null && typeof p.watch !== "number") fail(`${at} has invalid "watch": ${p.watch}`);
  });
  const ids = new Set(posts.map((p) => p.id));
  if (ids.size !== posts.length) fail("duplicate post ids");
  return posts;
}
