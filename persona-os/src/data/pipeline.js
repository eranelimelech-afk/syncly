/**
 * PRODUCTION PIPELINE — ROADMAP step 3 ("STAGES defined but not managed").
 *
 * The workflow guide's argument is that generating is step three of six, and
 * that most failures are people generating before they have decided anything.
 * So every stage here carries `exit`: what must be true before the item may
 * advance. An item cannot reach the QA gate with an unanswered exit condition.
 *
 * The existing STAGES list in queue.js is the same pipeline at finer grain;
 * `stages` below maps each workflow phase onto those stage indices so the queue
 * keeps working unchanged.
 */

export const PHASES = [
  {
    id: "idea", he: "רעיון", en: "Idea", stages: [0],
    goal: "להגדיר מה מיוצר ולמי, לפני שנפתח כלי כלשהו",
    exit: [
      "מה בדיוק מיוצר — פורמט, אורך, יחס",
      "לאן זה הולך — אינסטגרם או פאנביו",
      "איזו אחת מחמש המטרות זו",
      "מה זה אמור לגרום לצופה להרגיש",
    ],
    trap: "״משהו מגניב״ אינו רעיון. רעיון מעורפל מייצר פרומפט מעורפל.",
  },
  {
    id: "chat", he: "פיתוח וכתיבה", en: "Chat", stages: [1, 2],
    goal: "לפתח את הרעיון, לבנות את ההוק והתסריט ואת הפרומפטים — לפני שנשרף קרדיט",
    exit: [
      "הוק שעובד בשלוש השניות הראשונות גם בלי סאונד",
      "תסריט בקול של הביבליה — משפטים קצרים, בלי התלהבות",
      "פרומפט תמונה ופרומפט וידאו כתובים ומאושרים",
      "הוגדר מראש איזה סמל יחיד נמצא בפריים",
    ],
    trap: "לבקש ״תן לי פרומפט״ במקום לתת הקשר, מטרה, קהל, סגנון ומה להימנע ממנו.",
  },
  {
    id: "ref", he: "רפרנס", en: "Reference", stages: [3],
    goal: "לוודא שקיימות הזוויות שהשוט הזה דורש בגיליון הזהות",
    exit: [
      "כל זווית שהתנועה דורשת קיימת ונוצרה אחרי נעילת הביבליה",
      "כשהפנים מסתובבות — יש כיסוי פרופיל, אחרת המודל ימציא פנים",
    ],
    trap: "השלב שהכי מדלגים עליו. בדיקת ה־QA ref היא חוסם קשיח בדיוק בגלל זה.",
  },
  {
    id: "image", he: "תמונה", en: "Image", stages: [4],
    goal: "לייצר את פריים הפתיחה. התמונה היא הבסיס — אם היא חלשה, הווידאו יהיה חלש",
    exit: [
      "עקבי מול שאר הסצנות באותו רצף",
      "תאורה תואמת למצב הרוח ולשעת היום",
      "יחס נכון לפלטפורמה",
      "נראה אמיתי — בלי ברק פלסטי ובלי מראה AI מובהק",
    ],
    trap: "לקפוץ ישר לווידאו. תמונות זולות ומהירות לתיקון, וידאו לא.",
  },
  {
    id: "refine", he: "ליטוש והגדלה", en: "Refine", stages: [4],
    goal: "לתקן בעיות נקודתיות ולהגדיל רזולוציה לפני שמוסיפים תנועה",
    exit: [
      "ידיים, פנים ופרטים קטנים תוקנו",
      "הוגדל — לווידאו יש יותר פיקסלים לעבוד איתם",
    ],
    trap: "אם הקומפוזיציה, הדמות או הזווית שגויות — לחזור לשלב הפרומפט. לא ללטש בסיס שבור.",
  },
  {
    id: "video", he: "וידאו", en: "Video", stages: [5, 6],
    goal: "להוסיף תנועה לפריים שכבר נעול",
    exit: [
      "שש משבצות התנועה מלאות — תנועה, פתיחה, מהירות, מסגור, סיום, זמן",
      "תנועת נושא אחת ותנועת מצלמה אחת. לא יותר",
      "המנוע שנבחר תומך בכל מה שהשוט דורש",
    ],
    trap: "לתאר מחדש את כל התמונה בפרומפט הווידאו. המודל רואה את התמונה — תאר מה קורה.",
  },
  {
    id: "edit", he: "עריכה וסאונד", en: "Edit & Post", stages: [7],
    goal: "להרכיב, להוסיף סאונד ולארוז",
    exit: [
      "השנייה הראשונה חזקה",
      "סאונד סביבתי — בלי סאונד הסצנה מרגישה ריקה",
      "ייצוא 1080p ב־30fps",
    ],
    trap: "לייצא ב־4K 60fps. הפלטפורמה מורידה את האיכות מיד והתוצאה נראית גרוע יותר.",
  },
  {
    id: "gate", he: "שער QA", en: "Gate", stages: [8],
    goal: "הבדיקות, הציון והחלטת האישור",
    exit: ["אין חוסם דולק", "אישור אנושי מפורש"],
    trap: "אין. זה השלב שלא מדלגים עליו לעולם.",
  },
];

/**
 * Craft and technical rules taken from the platform guides. These are NOT QA
 * checks — promoting any of them into the scored rubric changes the 100 points
 * and is a decision for the owner, not for code. They are shown as pre-flight
 * advice attached to the phase that owns them.
 */
export const CRAFT = [
  { phase: "chat",  he: "הקליפ הראשון לא ארוך משלוש שניות — אחרי זה גוללים", src: "TikTok Secrets 17" },
  { phase: "chat",  he: "זמן צפייה הוא המדד המוביל. נטישה בשנייה השנייה משנה את הפוסט הבא", src: "TikTok Secrets 6" },
  { phase: "chat",  he: "טקסט על המסך מאריך צפייה — מי שקורא עדיין צופה", src: "TikTok Secrets 10" },
  { phase: "image", he: "אותה תמונה ממוזערת בסגנון קבוע שומרת על עמוד אחיד", src: "TikTok Secrets 12" },
  { phase: "video", he: "אל תשים דיאלוג חשוב בשניות האחרונות — שם מודלים נוטים לגליץ׳", src: "Kling 3.0 §8" },
  { phase: "video", he: "אחרי עריכה בתוך הפריים — בדוק את הקליפ מחדש. מודלים משנים דברים שלא ביקשת", src: "AI Video Editing" },
  { phase: "edit",  he: "1080p ב־30fps. 4K ב־60fps יורד באיכות מיד", src: "TikTok Secrets 13" },
  { phase: "edit",  he: "עד שני האשטגים — הביבליה מחמירה מהמדריך שמתיר ארבעה", src: "צורת דיבור · הביבליה גוברת" },
  { phase: "gate",  he: "שעת פרסום קבועה מבודדת את המשתנה הנבדק", src: "TikTok Secrets 1 · ראה הערה" },
];

/**
 * Practices found in the source material that this system will not implement.
 * Recorded so they are not quietly added later as "growth features".
 * Every one of them fabricates engagement or evades platform enforcement, and
 * every one contradicts the bible clause that disclosure is a hard blocker.
 */
export const EXCLUDED = [
  { he: "חשבונות משנה שמגיבים על הפוסטים שלך כדי לביים ויכוח", why: "זיוף מעורבות · הפרת תנאי שימוש" },
  { he: "סינון מילות מפתח כדי לנפח ספירת תגובות", why: "מניפולציה על האלגוריתם" },
  { he: "שתילת טעות מכוונת כדי לדוג תגובות מתקנות", why: "הטעיית הקהל · סותר ״לא נשמעת כמו פרסומת״" },
  { he: "החלפת מיקום או מכשיר כדי לעקוף אכיפה", why: "עקיפת אכיפה · מסכן את החשבון" },
  { he: "חילופי תגובות מתואמים בין יוצרים", why: "מעורבות מבוימת" },
];
