import { BIBLE, SYMBOLS } from "../data/bible.js";
import { SHOTS } from "../data/identitySheet.js";
import { moveById, SLOTS } from "../data/camera.js";
import { needsOf, enginesFor } from "../data/engines.js";
import { wardrobeEn, symbolEn } from "../data/lexicon.js";

/**
 * Builds one shot from a camera move plus a scene, and reports what would stop
 * it from being produced.
 *
 * The prompt is assembled from the six slots so no slot is left for the model to
 * decide, and the identity line is injected from the bible rather than typed, so
 * a shot prompt cannot contradict the character. Same rule as data/prompts.js.
 */

export const LOCATIONS = [
  { id: "lobby",    en: "the hotel lobby",            he: "לובי" },
  { id: "suite",    en: "the suite",                  he: "סוויטה" },
  { id: "bar",      en: "the hotel bar",              he: "בר" },
  { id: "balcony",  en: "the balcony",                he: "מרפסת" },
  { id: "corridor", en: "the seventh floor corridor", he: "מסדרון קומה 7" },
];

export const LIGHTS = [
  { id: "morning", en: "soft morning light",       he: "בוקר רך" },
  { id: "golden",  en: "golden hour light",        he: "שעת זהב" },
  { id: "night",   en: "warm low night lighting",  he: "לילה חם" },
];

/** Wardrobe comes from the bible table, not from a list typed here. */
export const OUTFITS = BIBLE.wardrobe.map(([he, v], i) => ({ id: "w" + i, he, hint: v, en: wardrobeEn(i) }));

/** Reference coverage for one angle, straight from the identity sheet. */
function angleState(id) {
  const s = SHOTS.find((x) => x.id === id);
  if (!s) return { id, he: id, ok: false, reason: "זווית לא מוגדרת בגיליון" };
  if (s.have === 0) return { ...s, ok: false, reason: "אין רפרנס כלל" };
  if (s.have < s.need) return { ...s, ok: true, warn: `כיסוי חלקי ${s.have}/${s.need}` };
  return { ...s, ok: true };
}

export function buildShot({ moveId, location, light, outfit, symbolId, speaks = false, multiShot = false, seconds = 8 }) {
  const move = moveById(moveId);
  const loc = LOCATIONS.find((l) => l.id === location) || LOCATIONS[0];
  const lig = LIGHTS.find((l) => l.id === light) || LIGHTS[0];
  const out = OUTFITS.find((o) => o.id === outfit) || OUTFITS[0];
  const sym = SYMBOLS.find((s) => s.id === symbolId) || SYMBOLS[0];

  const angles = move.angles.map(angleState);
  const blocked = angles.filter((a) => !a.ok);

  const needs = needsOf({ move, speaks, multiShot, seconds });
  const engines = enginesFor(needs, "video");

  // The six slots. Each line answers one decision so the model answers none.
  const slots = {
    movement: `${move.en.toLowerCase()}, ${camRig(move)}`,
    start: move.g === "track" ? "already moving on frame one, the shot picks her up mid-step"
                              : "begin on a locked frame, hold one beat, then ease into the move",
    speed: move.fit === "core" ? "slow, even, controlled ease-in and a gentle ease-out"
                               : "controlled, with a clear ease-in and ease-out",
    framing: "keep facial identity, freckle placement, eye shape, hair length and skin tone constant throughout",
    end: `settle on ${move.g === "dist" ? "a close, still frame" : "a stable final composition"} and hold — cut before any explanation`,
    time: `real time, normal speed, no slow motion. ${seconds}s`,
  };

  const prompt = [
    `Subject: the reference character, identity unchanged throughout.`,
    `Identity: ${BIBLE.lookEn}.`,
    ``,
    ...SLOTS.map((s) => `${cap(s.key)}: ${slots[s.key]}`),
    ``,
    `Scene: ${loc.en}, ${lig.en}. Wardrobe: ${out.en}. Delicate gold jewellery only, no visible logos.`,
    `Single visual clue in frame: ${symbolEn(sym.id)}. Nothing else that reads as a clue.`,
    `Photography: natural, social-native, real skin texture, no beauty filter, no plastic sheen.`,
    `Avoid: facial morphing, body distortion, extra fingers, frozen mannequin face, neon or saturated colour.`,
  ].join("\n");

  return { move, loc, lig, out, sym, angles, blocked, needs, engines, prompt, slots };
}

const cap = (s) => s[0].toUpperCase() + s.slice(1);

/** What the move physically rides on — the first half of the movement slot. */
function camRig(move) {
  if (move.g === "still") return "camera locked on a tripod";
  if (move.g === "dist") return move.id.includes("zoom") ? "camera fixed in place, optical zoom only" : "camera on rails";
  if (move.g === "track" || move.g === "past") return "camera on rails, matched to her pace";
  if (move.g === "around") return "camera on a curved track around her";
  if (move.g === "human") return "carried by a camera operator walking with her";
  if (move.g === "air") return "camera on a crane";
  return "camera rig unconstrained";
}

/** Symbols whose cooldown has elapsed. Bible rule: one clue at a time. */
export const readySymbols = () => SYMBOLS.filter((s) => s.last >= s.cool);
