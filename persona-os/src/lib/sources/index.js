import { buildHistory } from "../history.js";
import { validatePosts } from "./schema.js";
import { fetchMedia } from "./instagram.js";
import { parseFanvue } from "./fanvue.js";
import { mergePosts, describeProblems } from "./merge.js";

/**
 * Chooses where posts come from. Every source returns the identical shape, so
 * nothing downstream knows or cares which one is active.
 *
 * `seeded` stays the default until a real account is connected — it lets the
 * whole app be developed and demonstrated with no credentials. See
 * docs/INSTAGRAM.md and ROADMAP step 1.
 */
export const SOURCES = {
  seeded: { he: "מחולל מקומי", real: false },
  live: { he: "אינסטגרם + פאנביו", real: true },
};

export async function loadPosts({
  source = "seeded",
  persona = "vane",
  store,
  fanvueCsv,
  since,
  until,
  base,
  fetchImpl,
} = {}) {
  if (source === "seeded") {
    return { posts: validatePosts(buildHistory(persona), "seeded"), problems: null, notes: [] };
  }
  if (source !== "live") throw new Error(`unknown source "${source}"`);
  if (!store) throw new Error('source "live" needs a local record store — the tags live there, not in the API');

  const metrics = await fetchMedia({ base, since, until, fetchImpl });
  const fanvue = fanvueCsv ? parseFanvue(fanvueCsv) : null;
  const { posts, problems } = mergePosts({
    records: store.all(), metrics, fanvue, personaId: persona,
  });
  return { posts, problems, notes: describeProblems(problems) };
}

export { mergePosts, describeProblems } from "./merge.js";
export { createStore } from "./local.js";
export { parseFanvue, parseCsv } from "./fanvue.js";
export { mapMedia, METRICS } from "./instagram.js";
