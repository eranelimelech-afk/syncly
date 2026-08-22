/**
 * Reference library coverage. The QA check `ref` is a hard blocker:
 * no valid reference for the required angle means no approval.
 *
 * Material created before the bible was locked on 21.8.2026 was BINNED on
 * 22.8.2026 — see docs/DECISIONS.md #3. It is recorded in ARCHIVED rather than
 * deleted, so the decision stays auditable, but it no longer counts as coverage.
 * Those angles now read 0, which is what they were worth: `stale` references
 * already failed the check while still looking like partial coverage.
 */
export const SHOTS = [
  { id: "portrait", he: "Portrait",             note: "פנים מלאות, אור טבעי",                    have: 4, need: 4 },
  { id: "threeq",   he: "Three Quarter View",   note: "45 מעלות לשני הצדדים",                    have: 3, need: 4 },
  { id: "side",     he: "Side Profile",         note: "פרופיל מלא, שני צדדים",                   have: 0, need: 2 },
  { id: "full",     he: "Full Body",            note: "פרופורציות גוף לנעילה",                   have: 0, need: 3 },
  { id: "expr",     he: "Different Expressions",note: "שקט, חיוך קל, מבט ישיר, הפתעה מאופקת",    have: 2, need: 6 },
  { id: "outfit",   he: "Different Outfits",    note: "חמשת מצבי הלבוש בביבליה",                 have: 2, need: 5 },
  { id: "loc",      he: "Different Locations",  note: "לובי, סוויטה, בר, מרפסת, מסדרון, ספא",    have: 0, need: 6 },
  { id: "light",    he: "Different Lighting",   note: "בוקר, שעת זהב, לילה, מלאכותי",            have: 2, need: 4 },
];

/**
 * What was binned, and why. Kept so nobody re-adds it by accident and so the
 * coverage drop on 22.8 has an explanation attached to it.
 */
export const ARCHIVED = [
  { shot: "full", count: 1, on: "22.8.2026",
    why: "נוצר לפני נעילת הביבליה. חסם 6 תנועות מצלמה בזמן שנספר ככיסוי חלקי" },
  { shot: "loc", count: 3, on: "22.8.2026",
    why: "נוצר לפני נעילת הביבליה. חסם 6 תנועות מצלמה בזמן שנספר ככיסוי חלקי" },
];

export const ARCHIVE_NOTE =
  "נגנז ב־22.8 — הביבליה ננעלה ב־21.8 והחליפה את המיצוב הקודם. אימות מול מראה שננעל אתמול " +
  "יקר יותר מייצור מחדש, ומשאיר ספק בכל נכס שנגזר מהרפרנס.";

/** Coverage, counting only what is actually usable. */
export const coverage = () => {
  const have = SHOTS.reduce((a, s) => a + Math.min(s.have, s.need), 0);
  const need = SHOTS.reduce((a, s) => a + s.need, 0);
  return { have, need, pct: Math.round((have / need) * 100) };
};

/** What has to be produced, largest gap first. */
export const missingShots = () =>
  SHOTS.filter((s) => s.have < s.need)
    .map((s) => ({ ...s, gap: s.need - s.have }))
    .sort((a, b) => b.gap - a.gap);
