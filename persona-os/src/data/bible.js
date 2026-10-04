/**
 * THE LOCKED CHARACTER BIBLE — single source of truth.
 * Locked 21.8.2026. Do not edit programmatically.
 * Every QA check, quota, plot beat and prompt template derives from this file.
 */

export const PERSONAS = [
  { id: "vane", name: "Romy Vane", color: "#B99A5B", lane: "Luxury Hotel & Travel · אינסטגרם ← פאנביו", tint: "linear-gradient(150deg,#3A2228,#171B21)" },
  { id: "maya", name: "Maya Voss", color: "#5B9DD9", lane: "אינסטגרם ← פאנביו", tint: "linear-gradient(150deg,#20405C,#171B21)" },
  { id: "roam", name: "Romy Roam", color: "#4E9B76", lane: "אינסטגרם בלבד", tint: "linear-gradient(150deg,#234A3A,#171B21)" },
];

export const BIBLE = {
  locked: "21.8.2026",
  line: "Some rooms are booked. Others are waiting.",
  age: 25,
  identity: [
    ["הגדרה", "Luxury Hotel & Travel Creator", "מנוע ההמלצות"],
    ["גיל דמותי", "25 — אישה בוגרת", "בדיקת חשיפה"],
    ["שפה וקהל", "אנגלית · ארה״ב", "בדיקת קופי"],
    ["בידול", "זהות מסתורית וסיפור מתמשך סביב חדרים, מפתחות ומעטפות", "קצב העלילה"],
    ["גילוי נאות", "מצוין בעדינות בביו שזו דמות וירטואלית", "חוסם קשיח"],
  ],
  lookEn:
    "warm olive skin, natural freckles across the nose and cheeks, dark brown almond-shaped eyes, " +
    "full dark brows, straight narrow nose, naturally full pink lips, very dark brown long wavy hair, " +
    "athletic natural feminine build, real skin texture with subtle imperfections",
  look: [
    ["פנים", "עור בגוון זית חם · נמשים טבעיים על האף והלחיים · עיניים חומות כהות בצורת שקד · גבות כהות ומלאות · אף ישר וצר · שפתיים מלאות בגוון ורוד"],
    ["שיער", "חום כהה מאוד, ארוך וגלי"],
    ["גוף", "נשי, אתלטי וטבעי · מרקם עור אמיתי ללא ריטוש"],
    ["אין לשנות", "מבנה פנים · צורת עיניים · מיקום הנמשים · גוון עור · פרופורציות · אורך וצבע שיער"],
  ],
  palette: [
    ["#0F1216", "שחור"], ["#EBE6DC", "שמנת"], ["#FFFFFF", "לבן מלון"],
    ["#8A2733", "בורדו עמוק"], ["#B99A5B", "זהב מעומעם"], ["#3A3F47", "אפור פחם"],
  ],
  wardrobe: [
    ["בוקר במלון", "חולצת פשתן לבנה גדולה"],
    ["כושר", "שחור מינימליסטי ונקי"],
    ["יום", "ג׳ינס, גופייה, בלייזר או שמלת קיץ"],
    ["ערב", "שחור, בורדו, שמנת או כסף"],
    ["תכשיטים", "זהב עדין בלבד · ללא לוגואים בולטים"],
  ],
  voice: {
    rules: [
      "משפטים קצרים", "קול נשי נמוך, רגוע ואינטימי", "קצב מעט איטי עם הפסקות",
      "לא מתלהבת, לא נשמעת כמו פרסומת", "כמעט ללא אימוג׳ים", "הומור יבש", "שאלות ישירות",
    ],
    samples: ["Still here.", "I didn't book this room.", "One drink. That was the plan.", "Would you have opened it?"],
  },
  never: [
    "ילדותיות או הבעות מוגזמות", "תוכן וולגרי", "התחננות לעוקבים", "עשרות האשטגים",
    "מידע אישי מפורט מדי", "תמונות אקראיות מחוץ לעולם שלה", "הצגת מלון או מותג אמיתי ללא גילוי",
  ],
  plot: [
    "אין הסבר מלא", "כל פרק מוסיף פרט אחד בלבד", "Room 707 לא מופיע מדי יום",
    "לא משנים עיר או מלון באמצע רצף", "אור, חדר, לבוש ושיער עקביים בתוך אותו יום",
    "חפץ שהופיע נשאר זהה", "כל פרק מסתיים בשאלה או בחיתוך לפני ההסבר",
  ],
};

/** Recurring symbols. `cool` = cooldown in days. Bible rule: one clue at a time. */
export const SYMBOLS = [
  { id: "s707", he: "המספר 707", last: 11, cool: 14 },
  { id: "env", he: "מעטפה בורדו", last: 6, cool: 12 },
  { id: "key", he: "מפתח עתיק", last: 19, cool: 12 },
  { id: "linen", he: "חולצת פשתן לבנה", last: 3, cool: 6 },
  { id: "dress", he: "שמלה שחורה", last: 9, cool: 8 },
  { id: "coffee", he: "קפה ליד חלון", last: 2, cool: 5 },
  { id: "gaze", he: "מבט ישיר ושקט", last: 5, cool: 6 },
];

/** Plot ladder — one new detail per episode. Never skip ahead. */
export const LADDER = [
  { n: 1, he: "מעטפה בורדו על השולחן, לא נפתחת", done: true },
  { n: 2, he: "מפתח עתיק בכיס המעיל", done: true },
  { n: 3, he: "ההזמנה רשומה על שם אחר", done: false },
  { n: 4, he: "משקה מחכה בבר בלי שהזמינה", done: false },
  { n: 5, he: "צ׳ק־אאוט שאושר מראש", done: false },
  { n: 6, he: "הודעה קצרה, ללא חתימה", done: false },
];
