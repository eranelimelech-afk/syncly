import { BIBLE, SYMBOLS } from "./bible.js";

/**
 * ENGLISH PROJECTION OF THE BIBLE.
 *
 * The UI is Hebrew; the character's own content is English. The bible stores
 * wardrobe and symbols in Hebrew only, and the bible is not edited from code —
 * so this file is a projection, never a second source of truth. It is keyed to
 * the bible's own ordering and asserts alignment at import time, so if the
 * bible gains or loses a row this fails loudly instead of drifting silently.
 */

const WARDROBE_EN = [
  "oversized white linen shirt",
  "clean minimal black activewear",
  "jeans with a tank top, blazer or a summer dress",
  "black, deep burgundy, cream or silver eveningwear",
  "delicate gold jewellery only, no visible logos",
];

const SYMBOL_EN = {
  s707: "the number 707",
  env: "a deep burgundy envelope",
  key: "an antique key",
  linen: "the white linen shirt",
  dress: "the black dress",
  coffee: "a coffee cup by the window",
  gaze: "one direct, quiet look to camera",
};

if (WARDROBE_EN.length !== BIBLE.wardrobe.length) {
  throw new Error(
    `lexicon out of sync: bible has ${BIBLE.wardrobe.length} wardrobe rows, lexicon has ${WARDROBE_EN.length}`
  );
}
const missing = SYMBOLS.filter((s) => !SYMBOL_EN[s.id]).map((s) => s.id);
if (missing.length) throw new Error(`lexicon missing English for symbols: ${missing.join(", ")}`);

export const wardrobeEn = (i) => WARDROBE_EN[i];
export const symbolEn = (id) => SYMBOL_EN[id];
