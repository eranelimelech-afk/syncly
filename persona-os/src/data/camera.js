/**
 * CAMERA MOVE LIBRARY — imported from the AI Video Bootcamp camera catalogue.
 * See docs/SOURCES.md for provenance of every field.
 *
 * Two things make this library useful rather than decorative:
 *
 * 1. `note` — the specific way a video model breaks this move. The catalogue's
 *    whole argument is that a camera prompt fails when it leaves a decision to
 *    the model, so each note names the decision you must not leave open.
 * 2. `fit` — whether the move belongs to Romy at all. This is NOT a taste call:
 *    every move carries `src`, the bible clause that decides it, exactly like a
 *    QA check does. A move marked `off` contradicts the locked character; using
 *    it needs an amendment, not a preference.
 *
 * `angles` lists the reference angles the move demands from the identity sheet.
 * A move that turns the face needs profile coverage or the model invents one —
 * that is the `ref` hard blocker expressed as a production constraint.
 */

/** The six slots. A camera prompt that leaves one empty hands that decision to the model. */
export const SLOTS = [
  { key: "movement", he: "תנועה", note: "שם התנועה ועל מה היא רוכבת — רייל, כתף, מנוף, רחפן" },
  { key: "start",    he: "פתיחה", note: "פריים נעול, או כבר בתנועה מהפריים הראשון" },
  { key: "speed",    he: "עקומת מהירות", note: "האצה, בנייה, האטה, קבוע, אלים או זוחל" },
  { key: "framing",  he: "מה נשאר יציב", note: "מה לא זז בזמן שכל השאר משתנה" },
  { key: "end",      he: "פריים סיום", note: "הפריים האחרון והחזקה בו, או יציאה בתוך תנועה" },
  { key: "time",     he: "זמן", note: "זמן אמת ללא סלואו מושן — או בדיוק מה מאט, ולא יותר" },
];

export const CAM_GROUPS = {
  still:  { he: "המצלמה במקום", en: "The Camera Stays Put" },
  dist:   { he: "קרוב ורחוק",   en: "Closer and Further" },
  past:   { he: "חולפת על פני",  en: "Traveling Past" },
  around: { he: "סביב",         en: "Around" },
  track:  { he: "עוקבת",        en: "Tracking" },
  human:  { he: "מצלמת יד",     en: "The Human Camera" },
  air:    { he: "אוויר",        en: "The Air" },
  imposs: { he: "הבלתי אפשרי",  en: "The Impossible" },
};

/** Bible clauses that decide fit. Kept as ids so the reason is traceable, not asserted. */
const VOICE_SLOW = "צורת דיבור · קצב מעט איטי, לא מתלהבת";
const VOICE_INTIMATE = "צורת דיבור · קול נמוך, רגוע ואינטימי";
const PLOT_CUT = "כללי עלילה · מסתיים בחיתוך לפני ההסבר";
const PLOT_ONE = "כללי עלילה · פרט אחד לפרק";
const NEVER_LOUD = "מה לעולם לא · ילדותיות או הבעות מוגזמות";
const LOOK_LOCK = "מראה קבוע · אין לשנות";
const PROD_REAL = "כללי הפקה · תחושת צילום אמיתי, לא רנדר";

export const MOVES = [
  // GROUP 1 — the camera stays put
  { id: "static", en: "Static Shot", he: "שוט נעול", g: "still", fit: "core", src: VOICE_INTIMATE,
    angles: ["portrait"], note: 'בלי "no camera movement, hold the same framing" המודל כמעט תמיד מוסיף ריחוף איטי.' },
  { id: "pan", en: "Pan", he: "פאן", g: "still", fit: "core", src: VOICE_SLOW,
    angles: ["threeq"], note: "תן לפאן יעד. פאן בלי מטרה הופך לריחוף." },
  { id: "tilt", en: "Tilt", he: "טילט", g: "still", fit: "core", src: VOICE_SLOW,
    angles: ["full", "portrait"], note: "שמור את הטילט על ציר אחד. מסלול פאן־טילט מעורב על פנים מעוות גיאומטריה." },
  { id: "whip", en: "Whip Pan", he: "וויפ פאן", g: "still", fit: "off", src: NEVER_LOUD,
    angles: ["threeq"], note: "תמיד וויפ אל עבר משהו. בלי יעד המודל מסתובב אל כלום." },

  // GROUP 2 — closer and further
  { id: "dollyin", en: "Dolly In", he: "דולי פנימה", g: "dist", fit: "core", src: PLOT_CUT,
    angles: ["portrait"], note: '"slow push-in" לבד מגדיר רק קצב — המודל ימציא את הפתיחה ואת הסיום. מלא את שתי המשבצות.' },
  { id: "dollyout", en: "Dolly Out · the Reveal", he: "דולי החוצה · חשיפה", g: "dist", fit: "core", src: PLOT_ONE,
    angles: ["full", "loc"], note: "לחשיפה — תאר אל מה הפריים נפתח. המידע החדש הוא השוט." },
  { id: "zoom", en: "Zoom In / Out", he: "זום", g: "dist", fit: "edge", src: PROD_REAL,
    angles: ["portrait"], note: 'אמור "camera stays in a fixed position", אחרת המודל מערבב זום ודולי לתנועה מוכלאת.' },
  { id: "slowzoom", en: "Slow Zoom", he: "זום איטי", g: "dist", fit: "core", src: VOICE_SLOW,
    angles: ["portrait"], note: "הזום הבטוח ביותר לפנים — בלי פרלקסה שום דבר לא מתעוות." },
  { id: "fastzoom", en: "Fast Zoom", he: "זום מהיר", g: "dist", fit: "off", src: VOICE_SLOW,
    angles: ["portrait"], note: "ככל שהזום מהיר יותר, כך המודל דוחף את כל השאר לסלואו מושן. משבצת הזמן עושה כאן עבודה אמיתית." },
  { id: "crashin", en: "Crash Zoom In", he: "קראש זום פנימה", g: "dist", fit: "off", src: NEVER_LOUD,
    angles: ["portrait"], note: "נחת את הקראש על תו חזק — עיניים, ידיים, חפץ — אחרת הקפיצה נקראת כתקלה." },
  { id: "crashout", en: "Crash Zoom Out", he: "קראש זום החוצה", g: "dist", fit: "off", src: NEVER_LOUD,
    angles: ["full"], note: "תאר מה הרחב חושף. ההלם הוא בהקשר החדש, לא בתנועה." },

  // GROUP 3 — traveling past
  { id: "truck", en: "Truck", he: "טראק", g: "past", fit: "edge", src: PROD_REAL,
    angles: ["loc"], note: "טראק ארוך דורש סביבה עקבית — תאר את החלל, אחרת המודל ממציא גיאומטריה חדשה באמצע." },
  { id: "slider", en: "Slider", he: "סליידר", g: "past", fit: "core", src: VOICE_SLOW,
    angles: ["loc"], note: "שים משהו אמיתי בחזית — הפרלקסה היא כל הפואנטה של התנועה." },
  { id: "pedestal", en: "Pedestal", he: "פדסטל", g: "past", fit: "edge", src: VOICE_SLOW,
    angles: ["full"], note: 'אמור "no tilt". בלי זה המודל מערבב פדסטל וטילט לעקומה.' },
  { id: "pushpast", en: "Push Past", he: "מעבר על פני", g: "past", fit: "core", src: PLOT_ONE,
    angles: ["loc"], note: "החזית חייבת לצאת מהפריים לגמרי. חזית שחצתה חצי נקראת כתקלה." },

  // GROUP 4 — around
  { id: "arc", en: "Arc", he: "קשת", g: "around", fit: "core", src: LOOK_LOCK,
    angles: ["threeq", "side"], note: "רבע וחצי סיבוב שומרים על הזהות הרבה יותר טוב ממעגל מלא — במיוחד בשוט קרוב." },
  { id: "orbit", en: "Orbit", he: "אורביט", g: "around", fit: "edge", src: LOOK_LOCK,
    angles: ["threeq", "side", "portrait"], note: "אורביט מלא הוא המקום שבו פנים נמסות. ככל שהשוט רחב יותר, המעגל בטוח יותר." },
  { id: "spiral", en: "Spiral", he: "ספירלה", g: "around", fit: "off", src: NEVER_LOUD,
    angles: ["threeq", "side"], note: "סיבוב מלא אחד לכל היותר. ספירלה מעבר ל־360° מאבדת את הגיאומטריה." },

  // GROUP 5 — tracking
  { id: "behind", en: "Follow From Behind", he: "עוקבת מאחור", g: "track", fit: "core", src: PLOT_CUT,
    angles: ["full"], note: "עקיבה מתחילה כדין בתוך תנועה — זה טבעה. הסיום עדיין דורש החלטה." },
  { id: "revtrack", en: "Reverse Tracking", he: "עקיבה הפוכה", g: "track", fit: "core", src: LOOK_LOCK,
    angles: ["portrait"], note: "העקיבה היציבה ביותר לפנים — חוסר התנועה היחסי מגן על הזהות." },
  { id: "sidetrack", en: "Side Tracking", he: "עקיבה מהצד", g: "track", fit: "edge", src: LOOK_LOCK,
    angles: ["side"], note: "עקיבה מהצד היא שוט הפרופיל — תאר את שכבות הרקע, הן נושאות את תחושת המהירות." },
  { id: "lowtrack", en: "Low Tracking Shot", he: "עקיבה נמוכה", g: "track", fit: "edge", src: PLOT_ONE,
    angles: ["full"], note: '"face never shown" היא הוראת מסגור שהמודל מכבד — השתמש בה, אל תקווה.' },
  { id: "vehicle", en: "Vehicle Tracking", he: "עקיבת רכב", g: "track", fit: "off", src: PROD_REAL,
    angles: ["loc"], note: 'עגן את המצלמה ("from a chase car alongside") — שוטי רכב לא מעוגנים מרחפים.' },
  { id: "chase", en: "Chase Shot", he: "שוט מרדף", g: "track", fit: "off", src: NEVER_LOUD,
    angles: ["full"], note: "רעידה כאוטית קבועה הורגת את זה — לתיקונים חייבות להיות סיבות: פנייה, מכשול, מעידה." },

  // GROUP 6 — the human camera
  { id: "handheld", en: "Handheld Shot", he: "מצלמת יד", g: "human", fit: "core", src: PROD_REAL,
    angles: ["portrait", "threeq"], note: 'תאר את האדם שנושא אותה, לא "רעידות" — מודלים עושים בני אדם טוב יותר מרעד מופשט.' },
  { id: "snapzoom", en: "Reactive Snap Zoom", he: "סנאפ זום תגובתי", g: "human", fit: "edge", src: PROD_REAL,
    angles: ["portrait"], note: "המילה documentary נושאת את כל החבילה: משקל, עיכוב, בלור, פוקוס מאוחר." },
  { id: "snorricam", en: "Snorricam", he: "סנוריקאם", g: "human", fit: "off", src: NEVER_LOUD,
    angles: ["portrait"], note: "המילה rigidly היא הקובעת — בלעדיה תקבל שוט יד של פנים, לא סנוריקאם." },

  // GROUP 7 — the air
  { id: "crane", en: "Crane Up / Down", he: "מנוף", g: "air", fit: "edge", src: PLOT_ONE,
    angles: ["full", "loc"], note: '"keep her in frame as the camera climbs" היא השורה שהופכת את זה למנוף ולא לתעופה משם.' },
  { id: "drone", en: "Drone Shot", he: "רחפן", g: "air", fit: "edge", src: PROD_REAL,
    angles: ["loc"], note: "תן לטיסה קו לעקוב אחריו — כביש, נהר, קו חוף — אחרת הרחפן משוטט." },
  { id: "flythru", en: "Fly-Through", he: "מעבר דרך", g: "air", fit: "off", src: PROD_REAL,
    angles: ["loc"], note: "הפתח חייב להיחצות במלואו — גבולות שנחצו בחצי הם הכשל הנפוץ ביותר." },
  { id: "fpv", en: "FPV Dive", he: "צלילת FPV", g: "air", fit: "off", src: NEVER_LOUD,
    angles: ["loc"], note: "האופק המוטה הוא החתימה — FPV מאוזן הוא סתם רחפן מהיר." },

  // GROUP 8 — the impossible
  { id: "dollyzoom", en: "Dolly Zoom", he: "דולי זום", g: "imposs", fit: "off", src: PROD_REAL,
    angles: ["portrait"], note: '"keep her exact size constant" היא שורת העוגן — היא מה שמכריח את המודל להריץ את שתי התנועות.' },
  { id: "macroexit", en: "Macro Exit", he: "יציאת מאקרו", g: "imposs", fit: "off", src: PLOT_ONE,
    angles: ["loc"], note: "נקודת פתיחה מיקרו ברורה אחת, תשלום עולמי ברור אחד — מעברים מעורפלים מאבדים את הצופה בין הסקאלות." },
  { id: "probe", en: "Probe Lens Shot", he: "עדשת פרוב", g: "imposs", fit: "off", src: PROD_REAL,
    angles: ["loc"], note: "סביבות עם מרקם עוזרות — מסלול מעורפל הופך לרעש מופשט." },
  { id: "bullet", en: "Bullet Time", he: "בולט טיים", g: "imposs", fit: "off", src: NEVER_LOUD,
    angles: ["threeq", "side"], note: "ההקפאה חייבת להיות מוחלטת. אלמנט אחד שנסחף שובר את כל האשליה." },
  { id: "gravity", en: "Gravity Roll", he: "גלגול כבידה", g: "imposs", fit: "off", src: NEVER_LOUD,
    angles: ["loc"], note: "הסביבה צריכה גיאומטריה ברורה — מסדרונות וחדרים עובדים, נופים פתוחים מאבדים את הגלגול." },
  { id: "infzoom", en: "Infinite Zoom", he: "זום אינסופי", g: "imposs", fit: "off", src: PLOT_ONE,
    angles: ["loc"], note: "שני עולמות לקליפ לכל היותר — לצלילות ארוכות שרשר קליפים, ותפור בתוך הפריים הכי כהה." },
];

export const FIT = {
  core: { he: "בקול של הדמות", tone: "up" },
  edge: { he: "אפשרי בזהירות", tone: "" },
  off:  { he: "סותר את הביבליה", tone: "down" },
};

export const byFit = (f) => MOVES.filter((m) => m.fit === f);
export const moveById = (id) => MOVES.find((m) => m.id === id);
