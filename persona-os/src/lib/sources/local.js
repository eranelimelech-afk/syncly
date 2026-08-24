/**
 * The half of a post that only this system knows: the seven tagging dimensions,
 * the QA score, and the ig_media_id that ties it to what Instagram measured.
 *
 * Instagram cannot supply any of it. A post that loses its local record loses
 * every dimension the lift view and the recommendation engine compare against —
 * so this record is written when the item is prepared, and the media id is
 * stamped on it the moment publishing returns one. See docs/INSTAGRAM.md.
 *
 * Persistence itself is ROADMAP step 2. The store is an interface here with a
 * memory implementation, so the adapters can be finished and tested before the
 * storage decision is made.
 */

import { DIMS } from "../../data/dimensions.js";

const DIM_KEYS = DIMS.map((d) => d.key);

/** A local record is only usable for analysis once it carries every dimension. */
export function validateRecord(r) {
  const problems = [];
  if (!r.id) problems.push("no id");
  for (const k of DIM_KEYS) {
    if (!r[k]) problems.push(`missing dimension "${k}"`);
  }
  if (typeof r.qa !== "number") problems.push("no qa score");
  return problems;
}

export function createStore(initial = []) {
  const rows = new Map(initial.map((r) => [r.id, { ...r }]));
  return {
    all: () => [...rows.values()],
    get: (id) => rows.get(id),
    put(record) {
      rows.set(record.id, { ...rows.get(record.id), ...record });
      return rows.get(record.id);
    },
    /**
     * Stamps the media id returned by publishing. This is the only moment the
     * join can be created — after this, matching would fall back to timestamp
     * and caption, which collides the first day two posts go out.
     */
    linkMedia(id, igMediaId, publishedAt) {
      const r = rows.get(id);
      if (!r) throw new Error(`cannot link media to unknown record "${id}"`);
      if (r.igMediaId && r.igMediaId !== igMediaId) {
        throw new Error(`record "${id}" is already linked to media ${r.igMediaId}`);
      }
      return this.put({ ...r, igMediaId, publishedAt });
    },
    linked: () => [...rows.values()].filter((r) => r.igMediaId),
    unlinked: () => [...rows.values()].filter((r) => !r.igMediaId),
  };
}
