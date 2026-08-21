/**
 * Reference library coverage. The QA check `ref` is a hard blocker:
 * no valid reference for the required angle means no approval.
 * `stale: true` = created before the bible was locked on 21.8.2026.
 */
export const SHOTS = [
  { id: "portrait", he: "Portrait",             note: "פנים מלאות, אור טבעי",                    have: 4, need: 4, stale: false },
  { id: "threeq",   he: "Three Quarter View",   note: "45 מעלות לשני הצדדים",                    have: 3, need: 4, stale: false },
  { id: "side",     he: "Side Profile",         note: "פרופיל מלא, שני צדדים",                   have: 0, need: 2, stale: false },
  { id: "full",     he: "Full Body",            note: "פרופורציות גוף לנעילה",                   have: 1, need: 3, stale: true },
  { id: "expr",     he: "Different Expressions",note: "שקט, חיוך קל, מבט ישיר, הפתעה מאופקת",    have: 2, need: 6, stale: false },
  { id: "outfit",   he: "Different Outfits",    note: "חמשת מצבי הלבוש בביבליה",                 have: 2, need: 5, stale: false },
  { id: "loc",      he: "Different Locations",  note: "לובי, סוויטה, בר, מרפסת, מסדרון, ספא",    have: 3, need: 6, stale: true },
  { id: "light",    he: "Different Lighting",   note: "בוקר, שעת זהב, לילה, מלאכותי",            have: 2, need: 4, stale: false },
];

export const STALE_NOTE = "נוצר לפני נעילת הביבליה ב־21.8 — צריך רענון מול המראה הנוכחי";
