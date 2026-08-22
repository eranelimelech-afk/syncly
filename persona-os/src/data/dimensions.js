/**
 * The seven tagging dimensions. Multipliers encode observed effect sizes and
 * drive both the seeded history generator and the lift analysis.
 * `target` = the quota the bible assigns to that content world.
 */

export const WORLD = {
  hotels:    { he: "מלונות וחיי יוקרה", target: .30, reach: 1.30, share: 1.05, save: 1.25, follow: .95, sub: .90 },
  morning:   { he: "שגרה אישית ובוקר",  target: .20, reach: .92,  share: .85,  save: 1.05, follow: 1.20, sub: 1.35 },
  fitness:   { he: "כושר ויוגה",         target: .15, reach: 1.45, share: .70,  save: .70,  follow: .60,  sub: .55 },
  scenery:   { he: "נופים ונסיעות",      target: .15, reach: 1.25, share: 1.35, save: 1.10, follow: .70,  sub: .60 },
  dining:    { he: "יציאות ומסעדות",     target: .10, reach: .95,  share: .95,  save: 1.40, follow: 1.00, sub: 1.05 },
  community: { he: "קהילה ושאלות",       target: .05, reach: .70,  share: .75,  save: .65,  follow: 1.15, sub: 1.10 },
  room707:   { he: "עלילת Room 707",     target: .05, reach: 1.10, share: 2.20, save: 2.05, follow: 2.60, sub: 2.80 },
};

/** Five post purposes. */
export const PURPOSE = {
  authority:   { he: "Authority — מלמדת משהו",     reach: 1.00, share: 1.15, save: 1.60, follow: 1.30, sub: 1.10 },
  curiosity:   { he: "Curiosity — גורמת להמשיך",   reach: 1.35, share: 1.30, save: 1.10, follow: 1.45, sub: 1.40 },
  lifestyle:   { he: "Lifestyle — בתוך העולם שלה", reach: 1.15, share: .90,  save: .95,  follow: .75,  sub: .80 },
  story:       { he: "Story — משהו אישי",          reach: .95,  share: 1.25, save: 1.20, follow: 1.50, sub: 1.60 },
  participate: { he: "Community — מזמינה להשתתף",  reach: .70,  share: .80,  save: .60,  follow: 1.10, sub: 1.00 },
};

export const FORMAT = {
  reel:     { he: "ריל 9:16",   reach: 1.5,  share: 1.35, save: .85,  follow: 1.15, sub: .95 },
  carousel: { he: "קרוסלה 4:5", reach: .74,  share: .90,  save: 1.85, follow: 1.25, sub: 1.35 },
  still:    { he: "תמונה 4:5",  reach: .68,  share: .70,  save: .80,  follow: .75,  sub: .72 },
};

export const HOOK = {
  question:    { he: "מסתיים בשאלה",     reach: 1.05, share: 1.10, save: 1.00, follow: 1.25, sub: 1.10 },
  cut:         { he: "חיתוך לפני ההסבר", reach: 1.12, share: 1.40, save: 1.35, follow: 1.55, sub: 1.50 },
  statement:   { he: "הצהרה שקטה",       reach: 1.00, share: .85,  save: .90,  follow: .80,  sub: .78 },
  observation: { he: "תצפית יבשה",       reach: .96,  share: .95,  save: 1.15, follow: 1.05, sub: 1.05 },
};

export const SLOT = {
  morning: { he: "07:00–09:00", reach: .86,  share: .90,  save: .90,  follow: .82,  sub: .78 },
  noon:    { he: "12:00–14:00", reach: .95,  share: .95,  save: 1.00, follow: .95,  sub: .95 },
  evening: { he: "19:00–21:00", reach: 1.30, share: 1.20, save: 1.15, follow: 1.35, sub: 1.45 },
  night:   { he: "22:00–00:00", reach: 1.06, share: 1.05, save: 1.05, follow: 1.22, sub: 1.32 },
};

export const MODE = {
  social:    { he: "Social Native",    reach: 1.12, share: 1.05, save: .95,  follow: 1.10, sub: 1.05 },
  editorial: { he: "Luxury Editorial", reach: .86,  share: .95,  save: 1.35, follow: .92,  sub: 1.15 },
};

export const CLUES = {
  one:  { he: "רמז אחד בפריים", reach: 1.08, share: 1.25, save: 1.30, follow: 1.40, sub: 1.35 },
  none: { he: "ללא רמז",        reach: .98,  share: .90,  save: .90,  follow: .85,  sub: .85 },
  many: { he: "יותר מרמז אחד",  reach: .90,  share: .72,  save: .70,  follow: .62,  sub: .60 },
};

export const DIMS = [
  { key: "purpose", he: "מטרת הפוסט",   dict: PURPOSE },
  { key: "world",   he: "עולם תוכן",    dict: WORLD },
  { key: "format",  he: "פורמט",        dict: FORMAT },
  { key: "hook",    he: "סגירת הפוסט",  dict: HOOK },
  { key: "slot",    he: "שעת פרסום",    dict: SLOT },
  { key: "mode",    he: "מצב צילום",    dict: MODE },
  { key: "clue",    he: "צפיפות רמזים", dict: CLUES },
];

/** North-star metric is followPer1k. Do not default sorting to raw reach. */
export const METRICS = [
  { key: "reach",       he: "חשיפה",                       short: "חשיפה" },
  { key: "sharePer1k",  he: "שיתופים ל־1,000 חשיפות",      short: "שיתופים" },
  { key: "saveRate",    he: "שיעור שמירות",                short: "שמירות" },
  { key: "followPer1k", he: "עוקבים חדשים ל־1,000 חשיפות", short: "עוקבים חדשים" },
  { key: "subPer1k",    he: "מנויים ל־1,000 חשיפות",       short: "מנויים" },
];

/**
 * Which purposes each content world can genuinely serve, and which it defaults to.
 *
 * This used to map five of seven worlds to `lifestyle`, which is where the 90%
 * Lifestyle share came from — and it contradicted the bible. The differentiator
 * clause reads "זהות מסתורית וסיפור מתמשך סביב חדרים, מפתחות ומעטפות": the rooms
 * ARE the story. A hotel post defaulting to Lifestyle was the code disagreeing
 * with the source of truth, so the bible wins.
 *
 * Purpose is a per-post choice, not a property of a world. `can` is the honest
 * set; `def` is only what to reach for when nothing else decides. Every entry
 * carries `src`, the bible clause behind it — same discipline as a QA check.
 * No world quota changed: this moves nothing between worlds.
 */
export const WORLD_PURPOSE = {
  hotels:   { def: "story", can: ["story", "curiosity", "lifestyle", "authority"],
              src: "בידול · סיפור מתמשך סביב חדרים, מפתחות ומעטפות" },
  morning:  { def: "lifestyle", can: ["lifestyle", "story"],
              src: "מראה קבוע · שגרת בוקר במלון" },
  fitness:  { def: "lifestyle", can: ["lifestyle", "authority"],
              src: "לבוש · כושר שחור מינימליסטי — אין כאן עלילה" },
  scenery:  { def: "lifestyle", can: ["lifestyle", "curiosity", "story"],
              src: "הגדרה · Luxury Hotel & Travel Creator" },
  dining:   { def: "story", can: ["story", "curiosity", "lifestyle"],
              src: "צורת דיבור · ״One drink. That was the plan.״" },
  community:{ def: "participate", can: ["participate", "authority"],
              src: "צורת דיבור · שאלות ישירות" },
  room707:  { def: "curiosity", can: ["curiosity", "story"],
              src: "כללי עלילה · פרט אחד לפרק" },
};

/** The purpose to reach for when nothing else decides. */
export const defaultPurpose = (world) => WORLD_PURPOSE[world].def;

/** Every purpose this world can honestly carry. */
export const purposesFor = (world) => WORLD_PURPOSE[world].can;

/** Can this world carry that purpose without contradicting the bible? */
export const worldCan = (world, purpose) => WORLD_PURPOSE[world].can.includes(purpose);
