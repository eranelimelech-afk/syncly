import { ALL_ITEMS, RUBRIC } from "../data/rubric.js";

export function initChecks(fails) {
  const s = {};
  ALL_ITEMS.forEach((i) => (s[i.id] = !fails.includes(i.id)));
  return s;
}

/**
 * Returns { total, groups, blockers, status }.
 * status: blocked (any blocker, or < 70) | hold (70-84) | cleared (85+).
 * "cleared" still requires an explicit human approval click.
 */
export function scoreOf(checks) {
  let total = 0;
  ALL_ITEMS.forEach((i) => { if (checks[i.id]) total += i.pts; });
  const blockers = ALL_ITEMS.filter((i) => i.blocker && !checks[i.id]);
  const groups = RUBRIC.map((g) => ({
    key: g.key, he: g.he, max: g.max,
    got: g.items.reduce((a, i) => a + (checks[i.id] ? i.pts : 0), 0),
  }));
  const status = blockers.length ? "blocked" : total >= 85 ? "cleared" : total >= 70 ? "hold" : "blocked";
  return { total, groups, blockers, status };
}
