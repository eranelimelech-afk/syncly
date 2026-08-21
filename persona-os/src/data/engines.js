/**
 * ENGINE REGISTRY — capability data, not a recommendation.
 *
 * docs/DECISIONS.md #1 is still open, and this file is deliberately built so it
 * stays open. The system never picks an engine. It states what a shot needs and
 * which engines can carry it, so the decision is made on capability instead of
 * on whichever guide was read most recently.
 *
 * The one thing the guides do settle: the lock "Seedance only, explicitly not
 * nano_banana_2" compares tools from two different stages. Nano Banana is an
 * IMAGE model that builds the start frame; Seedance is a VIDEO model that
 * animates it. The documented workflow runs Image -> Video, so both stages need
 * an engine and neither choice forces the other. See docs/DECISIONS.md.
 */

export const STAGE_KIND = {
  image: { he: "מנוע תמונה", note: "בונה את פריים הפתיחה. הבסיס לכל השאר" },
  video: { he: "מנוע וידאו", note: "מוסיף תנועה לפריים שכבר נעול" },
  edit:  { he: "עריכה בתוך הפריים", note: "משנה משהו בתוך חומר קיים" },
};

/** Capabilities a shot can require. Each maps to a real constraint in the guides. */
export const CAPS = {
  startFrame: { he: "פריים פתיחה", why: "נועל הרכב, לבוש, תאורה וזהות לפני שיש תנועה" },
  endFrame:   { he: "פריים סיום",  why: "מכוון את הקליפ לקומפוזיציה סופית מסוימת" },
  omniRef:    { he: "Omni Reference", why: "כמה רפרנסים בו זמנית — הדרך היחידה לשמור זהות כשהפנים מסתובבות" },
  multiShot:  { he: "רב־שוט", why: "חיתוכי מצלמה בתוך גנרציה אחת במקום תפירה ידנית" },
  timedSeq:   { he: "רצף מתוזמן", why: "שליטה לפי חותמות זמן במקום לתת למודל לנחש את הרצף" },
  lipSync:    { he: "סנכרון שפתיים", why: "נדרש רק כשהדמות מדברת בפריים" },
  inVideoEdit:{ he: "עריכה בתוך הווידאו", why: "הסרה, החלפה או שינוי תאורה בחומר שכבר נוצר" },
  extend:     { he: "המשכת סצנה", why: "ייצוא הפריים האחרון כפריים פתיחה של הקליפ הבא" },
};

export const ENGINES = [
  {
    id: "seedance2", name: "Seedance 2.0", kind: "video", maxSec: 15,
    caps: ["startFrame", "omniRef", "timedSeq", "extend", "inVideoEdit"],
    strong: ["משחק ורגש", "תנועה ופעולה", "נאמנות לחומר המקור בעריכה"],
    weak: ["חסימות מדיניות בחלק מעריכות הפעולה", "נטייה למרקמים חלקים ורוויה יתר בשינוי אווירה"],
    lock: "נעול בביבליה כמנוע הווידאו",
  },
  {
    id: "kling3", name: "Kling 3.0", kind: "video", maxSec: 15,
    caps: ["startFrame", "endFrame", "omniRef", "multiShot", "lipSync"],
    strong: ["רב־שוט מובנה עם חיתוכי מצלמה", "עד 7 רפרנסים לזהות", "רגש ואינטראקציה"],
    weak: ["גליצ׳ים בשניות האחרונות — אל תשים שם דיאלוג חשוב", "כל חיתוך צריך כ־3 שניות מינימום"],
    lock: null,
  },
  {
    id: "geminiOmni", name: "Gemini Omni", kind: "edit", maxSec: null,
    caps: ["inVideoEdit", "startFrame"],
    strong: ["הסרת אובייקטים", "החלפת רקע ותאורה", "שינוי מיקום מצלמה בדיעבד"],
    weak: ["משנה אלמנטים ברקע שלא ביקשת — חובה לבדוק את הקליפ פריים אחר פריים", "סנכרון שפתיים נוטה לסטות"],
    lock: null,
  },
  {
    id: "nanoBananaPro", name: "Nano Banana Pro", kind: "image", maxSec: null,
    caps: ["startFrame"],
    strong: ["פריימי פתיחה", "ריטוש נקודתי", "ריבוי זוויות לאותה דמות"],
    weak: ["הביבליה שוללת במפורש את nano_banana_2 — לא ברור אם השלילה חלה על Pro"],
    lock: "שנוי במחלוקת — ראה DECISIONS #1",
  },
  {
    id: "gptImage2", name: "GPT Image 2.0", kind: "image", maxSec: null,
    caps: ["startFrame"],
    strong: ["פריימי פתיחה", "עריכת תמונה ממוקדת"],
    weak: [],
    lock: null,
  },
];

/**
 * Which engines can carry a shot that needs these capabilities.
 * Returns every engine of the right kind, marked eligible or not, plus what it
 * is missing. It never sorts by preference — that is the open decision.
 */
export function enginesFor(needs, kind) {
  return ENGINES
    .filter((e) => !kind || e.kind === kind)
    .map((e) => {
      const missing = needs.filter((n) => !e.caps.includes(n));
      return { ...e, missing, eligible: missing.length === 0 };
    });
}

/** Capabilities a shot requires, derived from what the shot actually is. */
export function needsOf({ move, speaks, multiShot, seconds }) {
  const needs = ["startFrame"];
  // A move that turns the face past three-quarter cannot hold identity from one
  // reference. This is the identity lock expressed as an engine requirement.
  if (move && move.angles.includes("side")) needs.push("omniRef");
  if (speaks) needs.push("lipSync");
  if (multiShot) needs.push("multiShot");
  if (seconds > 8) needs.push("timedSeq");
  return [...new Set(needs)];
}
