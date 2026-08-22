/**
 * ENGINE REGISTRY — capability data, not a recommendation.
 *
 * docs/DECISIONS.md #1 is open, and this file is built so it stays open. The
 * system never picks an engine. It states what a shot needs and reports which
 * engines can carry it, so the choice is made on capability rather than on
 * whichever guide was read most recently.
 *
 * Capabilities were read from the live model catalogue on 22.8.2026, not from
 * the course PDFs — those are already out of date. Re-read the catalogue before
 * trusting a row: this list moves faster than the rest of the codebase.
 */

export const CATALOGUE_READ = "22.8.2026";

export const STAGE_KIND = {
  image: { he: "מנוע תמונה", note: "בונה את פריים הפתיחה. הבסיס לכל השאר" },
  video: { he: "מנוע וידאו", note: "מוסיף תנועה לפריים שכבר נעול" },
  edit:  { he: "עריכה בתוך הפריים", note: "משנה משהו בתוך חומר קיים" },
  finish:{ he: "גימור", note: "הגדלה, ניקוי, סנכרון שפתיים — אחרי שהשוט קיים" },
};

/** Capabilities a shot can require. Each maps to a real constraint. */
export const CAPS = {
  startFrame: { he: "פריים פתיחה", why: "נועל הרכב, לבוש, תאורה וזהות לפני שיש תנועה" },
  endFrame:   { he: "פריים סיום",  why: "מכוון את הקליפ לקומפוזיציה סופית מסוימת" },
  omniRef:    { he: "רפרנס תמונה", why: "כמה רפרנסים בו זמנית — הדרך היחידה לשמור זהות כשהפנים מסתובבות" },
  videoRef:   { he: "רפרנס וידאו", why: "העברת תנועה או סגנון מקליפ קיים" },
  audioRef:   { he: "רפרנס אודיו", why: "בניית הסצנה סביב מה שנאמר" },
  multiShot:  { he: "רב־שוט", why: "חיתוכי מצלמה בתוך גנרציה אחת במקום תפירה ידנית" },
  timedSeq:   { he: "רצף מתוזמן", why: "שליטה לפי חותמות זמן במקום לתת למודל לנחש" },
  lipSync:    { he: "סנכרון שפתיים", why: "נדרש רק כשהדמות מדברת בפריים" },
  nativeAudio:{ he: "אודיו מובנה", why: "סאונד בגנרציה במקום שכבה נפרדת בעריכה" },
  inVideoEdit:{ he: "עריכה בתוך הווידאו", why: "הסרה, החלפה או שינוי תאורה בחומר שכבר נוצר" },
  extend:     { he: "הארכת סצנה", why: "המשך הקליפ מעבר לאורך המקסימלי בגנרציה אחת" },
  identityId: { he: "זהות שמורה", why: "מזהה דמות קבוע אצל הספק — לא רק רפרנסים לכל קריאה" },
};

/**
 * `lock` records the bible's standing on an engine. Only the video stage is
 * actually locked; the image stage never was — see the note on the Nano Banana
 * family below.
 */
export const ENGINES = [
  // ---------- IMAGE — builds the start frame and the reference library -------
  { id: "nano_banana_pro", name: "Nano Banana Pro", vendor: "Google", kind: "image",
    caps: ["omniRef"], maxRes: "4k",
    strong: ["איכות גבוהה", "ריבוי זוויות לאותה דמות", "רינדור טקסט"],
    weak: [],
    lock: "לא נאסר. האיסור בביבליה נוסח על nano_banana_2 — מודל אחר במשפחה" },
  { id: "nano_banana_2", name: "Nano Banana 2", vendor: "Google", kind: "image",
    caps: ["omniRef"], maxRes: "4k",
    strong: ["מהיר", "פוטוריאליסטי"],
    weak: [],
    lock: "**אסור במפורש בביבליה**" },
  { id: "nano_banana_2_lite", name: "Nano Banana 2 Lite", vendor: "Google", kind: "image",
    caps: ["omniRef"], maxRes: "1k", strong: ["זול ומהיר"], weak: ["רזולוציה נמוכה"], lock: null },
  { id: "nano_banana", name: "Nano Banana", vendor: "Google", kind: "image",
    caps: ["omniRef"], maxRes: "1k", strong: ["תקציבי"], weak: [], lock: null },
  { id: "soul_cast", name: "Soul Cast", vendor: "Higgsfield", kind: "image",
    caps: ["identityId"], maxRes: "—",
    strong: ["זהות דמות עקבית כשירות ייעודי", "בדיוק מה שגיליון הזהות מנסה לפתור ידנית"],
    weak: ["16:9 בלבד"], lock: null },
  { id: "soul_2", name: "Higgsfield Soul 2.0", vendor: "Higgsfield", kind: "image",
    caps: ["omniRef", "identityId"], maxRes: "2k",
    strong: ["UGC ריאליסטי", "אופנה ואדיטוריאל", "Soul-ID לדמות קבועה"],
    weak: [], lock: null },
  { id: "seedream_v5_pro", name: "Seedream 5.0 Pro", vendor: "Bytedance", kind: "image",
    caps: ["omniRef"], maxRes: "2k",
    strong: ["עריכה לפי הוראה", "inpaint נקודתי"], weak: [], lock: null },
  { id: "seedream_v4_5", name: "Seedream 4.5", vendor: "Bytedance", kind: "image",
    caps: ["omniRef"], maxRes: "6k", strong: ["רזולוציה גבוהה מאוד", "שליטה מדויקת"], weak: [], lock: null },
  { id: "gpt_image_2", name: "GPT Image 2", vendor: "OpenAI", kind: "image",
    caps: ["omniRef"], maxRes: "4k", strong: ["רינדור טקסט", "עריכה"], weak: [], lock: null },
  { id: "flux_2", name: "FLUX.2", vendor: "Black Forest Labs", kind: "image",
    caps: ["omniRef"], maxRes: "2k", strong: ["היצמדות לפרומפט"], weak: [], lock: null },
  { id: "kling_omni_image", name: "Kling O1 Image", vendor: "Kling", kind: "image",
    caps: ["omniRef"], maxRes: "2k", strong: ["פוטוריאליזם"], weak: [], lock: null },
  { id: "cinematic_studio_2_5", name: "Cinema Studio Image 2.5", vendor: "Higgsfield", kind: "image",
    caps: ["omniRef"], maxRes: "4k", strong: ["סטילס קולנועיים"], weak: [], lock: null },
  { id: "soul_location", name: "Soul Location", vendor: "Higgsfield", kind: "image",
    caps: [], maxRes: "—", strong: ["סביבות ומיקומים — הזווית שהכי חסרה בגיליון"], weak: [], lock: null },

  // ---------- VIDEO — animates a locked frame --------------------------------
  { id: "seedance_2_5", name: "Seedance 2.5", vendor: "Bytedance", kind: "video", maxSec: 30,
    caps: ["startFrame", "endFrame", "omniRef", "videoRef", "audioRef", "nativeAudio", "inVideoEdit", "extend", "timedSeq"],
    strong: ["עד 30 שניות — כפול מכל השאר", "omni reference", "עריכה והארכה באותו מנוע"],
    weak: ["חדש יותר מהגרסה שהביבליה נעלה"],
    lock: "הביבליה נעלה את Seedance 2.0. זו גרסה מאוחרת יותר" },
  { id: "seedance_2_0", name: "Seedance 2.0", vendor: "Bytedance", kind: "video", maxSec: 15,
    caps: ["startFrame", "endFrame", "omniRef", "videoRef", "audioRef", "nativeAudio", "inVideoEdit", "timedSeq", "extend"],
    strong: ["זהות עקבית", "4K", "משחק ורגש"],
    weak: ["חסימות מדיניות בחלק מעריכות הפעולה"],
    lock: "**נעול בביבליה כמנוע הווידאו**" },
  { id: "seedance_2_0_mini", name: "Seedance 2.0 Mini", vendor: "Bytedance", kind: "video", maxSec: 15,
    caps: ["startFrame", "endFrame", "omniRef", "videoRef", "audioRef", "nativeAudio"],
    strong: ["זול ומהיר לניסויים"], weak: ["720p מקסימום"], lock: null },
  { id: "seedance1_5", name: "Seedance 1.5 Pro", vendor: "Bytedance", kind: "video", maxSec: 12,
    caps: ["startFrame", "endFrame", "nativeAudio"], strong: ["תנועה אמינה"], weak: ["בלי omni reference"], lock: null },
  { id: "kling3_0", name: "Kling v3.0", vendor: "Kling", kind: "video", maxSec: 15,
    caps: ["startFrame", "endFrame", "multiShot", "lipSync", "nativeAudio", "videoRef"],
    strong: ["רב־שוט מובנה", "סנכרון שפתיים", "העברת תנועה"],
    weak: ["גליצ׳ים בשניות האחרונות", "כל חיתוך צריך כ־3 שניות"], lock: null },
  { id: "kling3_0_turbo", name: "Kling 3.0 Turbo", vendor: "Kling", kind: "video", maxSec: 15,
    caps: ["startFrame"], strong: ["מהיר וזול"], weak: ["פריים פתיחה בלבד"], lock: null },
  { id: "kling2_6", name: "Kling 2.6", vendor: "Kling", kind: "video", maxSec: 10,
    caps: ["startFrame", "nativeAudio"], strong: ["פיזיקה"], weak: ["בלי פריים סיום"], lock: null },
  { id: "veo3_1", name: "Google Veo 3.1", vendor: "Google", kind: "video", maxSec: 8,
    caps: ["startFrame", "nativeAudio"],
    strong: ["האיכות הקולנועית הגבוהה ביותר", "ריאליזם"],
    weak: ["8 שניות מקסימום", "בלי רפרנסים — בעיה לנעילת זהות"], lock: null },
  { id: "veo3_1_lite", name: "Veo 3.1 Lite", vendor: "Google", kind: "video", maxSec: 8,
    caps: ["startFrame", "endFrame"], strong: ["תקציבי לאצוות"], weak: ["8 שניות"], lock: null },
  { id: "veo3", name: "Google Veo 3", vendor: "Google", kind: "video", maxSec: 8,
    caps: ["startFrame", "nativeAudio"], strong: ["אמין"], weak: ["בלי רפרנסים"], lock: null },
  { id: "minimax_h3", name: "MiniMax H3", vendor: "MiniMax", kind: "video", maxSec: 15,
    caps: ["startFrame", "endFrame", "omniRef", "videoRef", "audioRef"],
    strong: ["2K", "רפרנסים מכל הסוגים"], weak: [], lock: null },
  { id: "minimax_hailuo", name: "MiniMax Hailuo 2.3", vendor: "MiniMax", kind: "video", maxSec: 10,
    caps: ["startFrame", "endFrame"], strong: ["פיזיקה טבעית", "הבעות פנים"], weak: ["בלי רפרנסים"], lock: null },
  { id: "wan2_7", name: "Wan 2.7", vendor: "Wan", kind: "video", maxSec: 15,
    caps: ["startFrame", "endFrame", "audioRef", "nativeAudio"],
    strong: ["עקביות דמות", "אודיו מסונכרן"], weak: [], lock: null },
  { id: "wan2_6", name: "Wan 2.6", vendor: "Wan", kind: "video", maxSec: 15,
    caps: ["omniRef", "videoRef", "audioRef"], strong: ["משקולות פתוחות"], weak: ["סגנוני, ניסיוני"], lock: null },
  { id: "flux_3_video", name: "FLUX 3 Video", vendor: "Black Forest Labs", kind: "video", maxSec: 20,
    caps: ["startFrame", "endFrame", "omniRef", "videoRef", "nativeAudio", "extend"],
    strong: ["עד 20 שניות", "המשכת וידאו", "סטוריבורד רב־פריימים"], weak: [], lock: null },
  { id: "grok_video_v15", name: "Grok Video 1.5", vendor: "xAI", kind: "video", maxSec: 15,
    caps: ["startFrame", "omniRef", "audioRef"], strong: ["פיזיקה", "תנועת מצלמה"], weak: ["בפריוויו"], lock: null },
  { id: "cinematic_studio_3_0", name: "Cinema Studio Video 3.0", vendor: "Higgsfield", kind: "video", maxSec: 15,
    caps: ["startFrame", "endFrame", "nativeAudio"], strong: ["4K", "ז׳אנר קולנועי"], weak: [], lock: null },
  { id: "cinematic_studio_video_v2", name: "Cinema Studio Video 2", vendor: "Higgsfield", kind: "video", maxSec: 12,
    caps: ["startFrame", "endFrame", "multiShot", "nativeAudio"],
    strong: ["רב־שוט עם שליטה בכל חיתוך", "speed ramp"], weak: ["12 שניות"], lock: null },
  { id: "happy_horse_video", name: "Happy Horse", vendor: "Happy Horse", kind: "video", maxSec: 15,
    caps: ["startFrame"], strong: [], weak: ["פריים פתיחה בלבד"], lock: null },

  // ---------- EDIT — changes something inside existing footage ---------------
  { id: "gemini_omni", name: "Gemini Omni Flash", vendor: "Google", kind: "edit", maxSec: 10,
    caps: ["omniRef", "videoRef", "inVideoEdit", "nativeAudio"],
    strong: ["הסרת אובייקטים", "החלפת רקע ותאורה", "שינוי מיקום מצלמה בדיעבד"],
    weak: ["משנה אלמנטים ברקע שלא ביקשת — חובה לבדוק את הקליפ מחדש", "סנכרון שפתיים נוטה לסטות"],
    lock: null },
  { id: "flux_kontext", name: "Flux Kontext", vendor: "Black Forest Labs", kind: "edit",
    caps: ["omniRef"], strong: ["עריכה מודעת הקשר", "העברת סגנון"], weak: ["תמונה בלבד"], lock: null },

  // ---------- FINISH — after the shot exists ---------------------------------
  { id: "sync_so", name: "Sync Lipsync 3", vendor: "Sync", kind: "finish",
    caps: ["lipSync"], strong: ["סנכרון שפתיים כשלב נפרד — פותר דיבור בלי לוותר על מנוע הווידאו"], weak: [], lock: null },
  { id: "topaz_video", name: "Topaz Video", vendor: "Topaz", kind: "finish",
    caps: [], strong: ["הגדלה עד 2160p", "אינטרפולציית פריימים"], weak: [], lock: null },
  { id: "bytedance_video_upscale", name: "Bytedance Video Upscale", vendor: "Bytedance", kind: "finish",
    caps: [], strong: ["הגדלה ל־4K", "פריסט ל־AIGC"], weak: [], lock: null },
  { id: "video_deflicker", name: "Video Deflicker", vendor: "Higgsfield", kind: "finish",
    caps: [], strong: ["מנקה הבהוב — תקלה נפוצה בחומר מיוצר"], weak: [], lock: null },
];

/**
 * Which engines can carry a shot that needs these capabilities.
 * Never sorted by preference — that is the open decision.
 */
export function enginesFor(needs, kind) {
  return ENGINES
    .filter((e) => !kind || e.kind === kind)
    .map((e) => {
      const missing = needs.filter((n) => !e.caps.includes(n));
      return { ...e, missing, eligible: missing.length === 0 };
    })
    .sort((a, b) => (b.eligible - a.eligible) || (b.caps.length - a.caps.length));
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

/**
 * When no single video engine covers the shot, a missing capability can often be
 * bought back as a second pass — lip sync after the fact, an edit engine for a
 * change inside the frame. Returns a rescue for each gap, or null where none
 * exists and the shot genuinely has to be split.
 */
export function coverGaps(missing) {
  return missing.map((cap) => {
    const by = ENGINES.filter((e) => (e.kind === "finish" || e.kind === "edit") && e.caps.includes(cap));
    return { cap, by, covered: by.length > 0 };
  });
}

/** Engines that clear a duration, for the "no engine fits" case. */
export const longestVideo = () =>
  ENGINES.filter((e) => e.kind === "video").sort((a, b) => (b.maxSec ?? 0) - (a.maxSec ?? 0))[0];
