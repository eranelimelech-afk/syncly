import { BIBLE } from "../data/bible.js";
import { SHOTS, missingShots } from "../data/identitySheet.js";
import { wardrobeEn } from "../data/lexicon.js";
import { MOVES } from "../data/camera.js";

/**
 * Turns the reference gap into a shot list with a ready prompt for each frame.
 *
 * Engine-neutral on purpose. The prompts carry no model-specific syntax, so the
 * open engine decision in docs/DECISIONS.md #1 does not block producing them —
 * it only decides where they get pasted.
 *
 * Every prompt is assembled from the bible: the identity line, the palette and
 * the wardrobe are injected, never typed. Same rule as data/prompts.js.
 */

const ANGLE_EN = {
  portrait: "a straight-on portrait, head and shoulders",
  threeq: "a three-quarter view",
  side: "a full side profile",
  full: "a full-body frame, head to feet, showing complete body proportions",
  expr: "a close portrait carrying one specific expression",
  outfit: "a three-quarter framing that shows the full outfit",
  loc: "a medium-wide frame that reads the location as well as the person",
  light: "a portrait lit by one specific light condition",
};

const VARIANT_EN = {
  "מבט ישר למצלמה": "looking straight into the lens",
  "רבע פנייה קלה": "a slight quarter turn of the head",
  "סנטר מעט מורם": "chin slightly raised",
  "סנטר מעט מונמך": "chin slightly lowered",
  "45° ימינה": "turned 45 degrees to her right",
  "45° שמאלה": "turned 45 degrees to her left",
  "45° ימינה, מבט למצלמה": "turned 45 degrees to her right, eyes back to the lens",
  "45° שמאלה, מבט הצידה": "turned 45 degrees to her left, looking off-frame",
  "פרופיל ימין מלא": "a full right profile, nose line clearly readable",
  "פרופיל שמאל מלא": "a full left profile, nose line clearly readable",
  "עמידה חזיתית, גוף מלא": "standing, facing camera, full body in frame",
  "עמידה בפרופיל, גוף מלא": "standing in profile, full body in frame",
  "ישיבה, גוף מלא": "seated, full body in frame",
  "שקט, ניטרלי": "a quiet, neutral expression",
  "חיוך קל ומאופק": "a small restrained smile",
  "מבט ישיר ושקט": "a direct, still look to camera",
  "הפתעה מאופקת": "restrained surprise, barely registered",
  "מחשבה, מבט הצידה": "thinking, eyes off to the side",
  "הומור יבש, זווית פה אחת": "dry humour, one corner of the mouth only",
  "לובי המלון": "the hotel lobby",
  "סוויטה": "the suite",
  "בר המלון": "the hotel bar",
  "מרפסת": "the balcony",
  "מסדרון קומה 7": "the seventh floor corridor",
  "ספא": "the spa",
  "בוקר רך": "soft morning light",
  "שעת זהב": "golden hour light",
  "לילה חם": "warm low night lighting",
  "תאורה מלאכותית של מלון": "the hotel's own artificial lighting",
};

const PALETTE_EN = "black, cream, hotel white, deep burgundy, muted gold, charcoal";

/** Which camera moves this angle unblocks — the reason to shoot it first. */
export function unblockedBy(angleId) {
  return MOVES.filter((m) => m.fit !== "off" && m.angles.includes(angleId));
}

function promptFor(shot, variantHe, variantEn) {
  const isRef = true;
  return [
    `Reference frame for a locked character. This image will be used to verify every future asset, so identity accuracy matters more than composition.`,
    ``,
    `Subject: ${BIBLE.lookEn}. Age ${BIBLE.age}.`,
    `Framing: ${ANGLE_EN[shot.id]} — ${variantEn}.`,
    shot.id === "outfit" ? `Wardrobe: ${variantEn}. Delicate gold jewellery only, no visible logos.`
      : `Wardrobe: neutral, ${PALETTE_EN}. Delicate gold jewellery only, no visible logos.`,
    shot.id === "loc" ? `Location: ${variantEn}, luxury hotel context.`
      : `Background: plain and unobtrusive; the frame exists to read the person.`,
    shot.id === "light" ? `Lighting: ${variantEn}.` : `Lighting: even natural light, no hard shadows across the face.`,
    `Photography: natural capture, real skin texture with visible pores and the freckles intact, no beauty filter, no retouching, no plastic sheen.`,
    ``,
    `Hold constant: face structure, eye shape, freckle placement, skin tone, body proportions, hair length and colour.`,
    `Avoid: stylisation, heavy makeup, distorted hands, extra fingers, neon or saturated colour, any logo, any second person.`,
    isRef ? `Do not add a narrative prop or visual clue — this is a reference, not a post.` : ``,
  ].filter(Boolean).join("\n");
}

/** The full shot list: one entry per frame that has to be produced. */
export function refShotList() {
  const out = [];
  for (const shot of missingShots()) {
    // Wardrobe variants come from the bible so the list cannot drift from it.
    const variants = shot.variants ?? BIBLE.wardrobe.map(([he]) => he);
    // Only the missing tail needs shooting; what exists already counts.
    const todo = variants.slice(shot.have);
    for (const v of todo) {
      const en = VARIANT_EN[v] ?? wardrobeOf(v);
      out.push({
        id: `${shot.id}-${variants.indexOf(v)}`,
        angle: shot.id, angleHe: shot.he, variantHe: v,
        unblocks: unblockedBy(shot.id).length,
        prompt: promptFor(shot, v, en),
      });
    }
  }
  // Shoot the angles that free the most camera moves first.
  return out.sort((a, b) => b.unblocks - a.unblocks);
}

/** Wardrobe rows are Hebrew in the bible; the lexicon holds their English. */
function wardrobeOf(he) {
  const i = BIBLE.wardrobe.findIndex(([label]) => label === he);
  return i >= 0 ? wardrobeEn(i) : he;
}

/** Coverage if this whole list were produced. */
export const afterList = () => {
  const need = SHOTS.reduce((a, s) => a + s.need, 0);
  return { have: need, need, pct: 100 };
};
