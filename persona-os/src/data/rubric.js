/**
 * QA rubric — the checks, their categories and their points.
 * Counts are never hardcoded in the UI; derive them from ALL_ITEMS / RUBRIC / BLOCKERS.
 * Every item MUST carry `src`: the bible clause that produced it.
 * `blocker: true` locks the approve button regardless of total score.
 */
export const RUBRIC = [
  { key: "identity", he: "נעילת זהות", max: 25, items: [
    { id: "face",     he: "מבנה פנים, צורת עיניים ומיקום נמשים זהים לרפרנס", pts: 10, blocker: true, src: "אין לשנות" },
    { id: "features", he: "גבות מלאות, אף ישר וצר, שפתיים בגוון ורוד",        pts: 5,  src: "מראה קבוע" },
    { id: "skin",     he: "גוון עור זית חם ופרופורציות גוף עקביות",           pts: 5,  src: "אין לשנות" },
    { id: "hair",     he: "שיער חום כהה מאוד, ארוך וגלי",                     pts: 5,  src: "אין לשנות" }]},
  { key: "real", he: "אנטומיה ואמינות", max: 20, items: [
    { id: "anatomy",   he: "ידיים, אצבעות ואנטומיה תקינות",     pts: 8, blocker: true, src: "כללי הפקה 2" },
    { id: "texture",   he: "מרקם עור אמיתי, ללא ריטוש פלסטי",   pts: 6, src: "מראה קבוע" },
    { id: "realphoto", he: "תחושת צילום אמיתי, לא רנדר",        pts: 6, src: "כללי הפקה 5" }]},
  { key: "cont", he: "המשכיות", max: 15, items: [
    { id: "room",   he: "המשכיות חדר, נוף ותאורה בתוך הרצף",  pts: 5, src: "כללי הפקה 3" },
    { id: "wear",   he: "לבוש תואם לשעת היום ולטבלת הלבוש",   pts: 5, src: "לבוש" },
    { id: "object", he: "חפץ שהופיע קודם נשאר זהה",           pts: 5, src: "כללי עלילה" }]},
  { key: "brand", he: "מותג וסגנון", max: 20, items: [
    { id: "palette", he: "פלטת צבעים בתוך שחור/שמנת/בורדו/זהב/פחם", pts: 5, src: "צבעי המותג" },
    { id: "gold",    he: "תכשיטים זהב עדין בלבד",                    pts: 4, src: "לבוש" },
    { id: "logo",    he: "ללא לוגואים בולטים או מותג אמיתי ללא גילוי", pts: 4, src: "מה לעולם לא" },
    { id: "mode",    he: "מצב צילום נכון — Social Native כברירת מחדל", pts: 4, src: "סגנון צילום" },
    { id: "dignity", he: "ללא ילדותיות, הגזמה או וולגריות",          pts: 3, src: "מה לעולם לא" }]},
  { key: "plot", he: "עלילה, קול ומטרה", max: 10, items: [
    { id: "oneclue", he: "רמז אחד בלבד בפריים",                          pts: 3, blocker: true, src: "סמלים חוזרים" },
    { id: "voice",   he: "משפטים קצרים, ללא התלהבות, כמעט ללא אימוג׳ים", pts: 3, src: "צורת דיבור" },
    { id: "purpose", he: "מטרה אחת מתוך החמש מוגדרת מראש",               pts: 2, src: "המדריך · שלב 8" },
    { id: "ending",  he: "מסתיים בשאלה או בחיתוך לפני ההסבר",            pts: 2, src: "כללי עלילה" }]},
  { key: "tech", he: "טכני ומדיניות", max: 10, items: [
    { id: "ratio",    he: "יחס 9:16 לסטורי/ריל או 4:5 לפיד",       pts: 3, src: "כללי הפקה 7" },
    { id: "disclose", he: "גילוי AI בהתאם לדרישות הפלטפורמה",      pts: 4, blocker: true, src: "כללי הפקה 8" },
    { id: "ref",      he: "נבדק מול רפרנס קיים בגיליון הזהות",     pts: 3, blocker: true, src: "המדריך · שלב 2" }]},
];

export const ALL_ITEMS = RUBRIC.flatMap((g) => g.items.map((i) => ({ ...i, group: g.key })));

/** Hard blockers. A blocker locks the approve button no matter how high the score is. */
export const BLOCKERS = ALL_ITEMS.filter((i) => i.blocker);

/** Checks and points belonging to one rubric group, for headers that describe it. */
export const groupStats = (key) => {
  const g = RUBRIC.find((x) => x.key === key);
  return { checks: g.items.length, max: g.max, blockers: g.items.filter((i) => i.blocker).length };
};

export const GATE_TEXT = {
  cleared: "עבר — ממתין לאישורך",
  hold: "עצור — נדרשים תיקונים",
  blocked: "חסום",
  approved: "אושר ונקבע",
};
