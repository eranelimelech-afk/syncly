import { WORLD, PURPOSE, FORMAT, HOOK, SLOT, MODE, CLUES, defaultPurpose, purposesFor } from "../data/dimensions.js";

/**
 * TEMPORARY seeded generator. Replace with real sources — see docs/ROADMAP.md step 1.
 * Keep the returned post shape identical when swapping in real data, so every
 * analysis in lib/recommend.js and the lift view keeps working:
 *   { id, day, world, purpose, format, hook, slot, mode, clue, qa,
 *     reach, shares, saves, follows, visits, subs, watch,
 *     saveRate, sharePer1k, followPer1k, subPer1k }
 */

function rng(seed) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const wpick = (r, dict) => {
  const ks = Object.keys(dict);
  if (!dict[ks[0]].target) return ks[Math.floor(r() * ks.length)];
  let x = r(), acc = 0;
  for (const k of ks) { acc += dict[k].target; if (x <= acc) return k; }
  return ks[ks.length - 1];
};

export const LINES = {
  hotels: ["Third room this week. Same coffee order.", "The lobby remembers me. I don't remember why.", "Checked in at two. Nobody asked for a card."],
  morning: ["Linen shirt. Cold floor. No plans until noon.", "I woke up before the city did.", "Coffee, window, silence. In that order."],
  fitness: ["Black, minimal, nothing to prove.", "Forty minutes. No music.", "The body keeps its own schedule."],
  scenery: ["Left the room for this.", "The view was not in the listing.", "Six hours of road for eleven minutes of light."],
  dining: ["One drink. That was the plan.", "Table for one, set for two.", "The waiter didn't bring a menu."],
  community: ["Would you have opened it?", "Which one would you have kept?", "Tell me I'm wrong."],
  room707: ["Still here.", "I didn't book this room.", "The envelope was already on the desk."],
};

export function buildHistory(personaId) {
  const r = rng(personaId === "vane" ? 7071 : personaId === "maya" ? 9017 : 3305);
  const out = [];
  for (let i = 0; i < 30; i++) {
    const world = wpick(r, WORLD), format = wpick(r, FORMAT), hook = wpick(r, HOOK), slot = wpick(r, SLOT);
    const mode = r() > 0.26 ? "social" : "editorial";
    const clue = r() > 0.55 ? "one" : r() > 0.25 ? "none" : "many";
    // Pick from what the world can honestly carry, not from all five purposes.
    const options = purposesFor(world);
    const purpose = r() > 0.68 ? options[Math.floor(r() * options.length)] : defaultPurpose(world);
    const qa = Math.round(60 + r() * 39);
    const boost = 1 + (qa - 80) / 180;
    const m = (k) => WORLD[world][k] * PURPOSE[purpose][k] * FORMAT[format][k] * HOOK[hook][k] * SLOT[slot][k] * MODE[mode][k] * CLUES[clue][k];
    const nz = () => 0.8 + r() * 0.42;
    const reach = Math.round(7200 * m("reach") * boost * nz());
    const shares = Math.round(reach * 0.0062 * m("share") * nz());
    const saves = Math.round(reach * 0.021 * m("save") * nz());
    const follows = Math.round(reach * 0.0074 * m("follow") * boost * nz());
    const visits = Math.round(reach * 0.036 * m("follow") * nz());
    const subs = Math.max(0, Math.round(visits * 0.021 * m("sub") * nz()));
    const d = new Date(2026, 6, 8 + i * 1.5);
    out.push({
      id: `${personaId}-${i}`, day: `${d.getDate()}.${d.getMonth() + 1}`,
      world, purpose, format, hook, slot, mode, clue, qa,
      reach, shares, saves, follows, visits, subs, line: LINES[world][i % 3],
      watch: format === "reel" ? Math.round(33 + (mode === "social" ? 11 : 0) * nz()) : null,
      saveRate: 0, sharePer1k: 0, followPer1k: 0, subPer1k: 0,
    });
  }
  out.forEach((p) => {
    p.saveRate = (p.saves / p.reach) * 100;
    p.sharePer1k = (p.shares / p.reach) * 1000;
    p.followPer1k = (p.follows / p.reach) * 1000;
    p.subPer1k = (p.subs / p.reach) * 1000;
  });
  return out;
}
