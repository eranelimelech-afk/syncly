/** Items awaiting human approval. Nothing here publishes without an explicit click. */
export const STAGES = ["רעיון", "הוק", "תסריט", "רפרנס", "תמונה", "וידאו", "קול", "עריכה", "שער QA"];

export const QUEUE = [
  { id: "q1", persona: "vane", title: "ריל — מסדרון קומה 7, אחרי חצות", channel: "Instagram",
    format: "reel", world: "room707", purpose: "curiosity", when: "היום 22:40", stage: 8,
    caption: "I didn't book this room. The key was already warm.",
    refShot: "Three Quarter View", fails: ["oneclue", "object"],
    notes: "בפריים אחד מופיעים גם המעטפה, גם המפתח וגם המספר 707. הביבליה קובעת רמז אחד בכל פעם. בנוסף המפתח שינה צורה מול הרצף של אתמול." },
  { id: "q2", persona: "vane", title: "קרוסלה — בוקר בסוויטה, חולצת פשתן", channel: "Instagram",
    format: "carousel", world: "morning", purpose: "lifestyle", when: "מחר 08:00", stage: 8,
    caption: "Linen shirt. Cold floor. No plans until noon.",
    refShot: "Portrait", fails: [],
    notes: "עובר נקי. שבע שקופיות ב־4:5, Social Native, זהב עדין בלבד, רמז יחיד — קפה ליד החלון." },
  { id: "q3", persona: "vane", title: "ריל — סט יוגה על המרפסת", channel: "Instagram",
    format: "reel", world: "fitness", purpose: "lifestyle", when: "מחר 07:30", stage: 8,
    caption: "Forty minutes. No music. 💪🔥 Tag someone who needs this!!",
    refShot: "Full Body", fails: ["voice", "dignity", "ending", "ref"],
    notes: "הכיתוב לא בקול שלה. בנוסף הרפרנס היחיד ל־Full Body נוצר לפני נעילת הביבליה — אין מול מה לבדוק פרופורציות." },
  { id: "q4", persona: "vane", title: "תמונה — בר המלון, כוס שכבר מחכה", channel: "Instagram",
    format: "still", world: "dining", purpose: "story", when: "מחר 20:15", stage: 8,
    caption: "One drink. That was the plan.",
    refShot: "Portrait", fails: ["disclose", "palette"],
    notes: "חסר תיוג AI בכיתוב וב־alt. ניאון כחול ברקע יוצא מהפלטה הנעולה." },
  { id: "q5", persona: "vane", title: "סט לפאנביו — צ׳ק־אאוט שאושר מראש", channel: "Fanvue",
    format: "carousel", world: "room707", purpose: "story", when: "יום ה׳ 21:00", stage: 8,
    caption: "The desk said I was already checked out. I never asked.",
    refShot: "Portrait", fails: ["hair", "texture"],
    notes: "השיער קצר בשתי שקופיות והעור מרוטש מדי — שובר את נעילת הזהות ואת תחושת הצילום האמיתי." },
];

/** Calendar. An unapproved slot stays empty — the system never fills it itself. */
export const SCHEDULE_DAYS = [
  { he: "היום · ו׳ 21.8", slots: [{ t: "22:40", title: "ריל — מסדרון קומה 7", ch: "Instagram", need: "q1" }] },
  { he: "מחר · ש׳ 22.8", slots: [
    { t: "07:30", title: "ריל — סט יוגה על המרפסת", ch: "Instagram", need: "q3" },
    { t: "08:00", title: "קרוסלה — בוקר בסוויטה", ch: "Instagram", need: "q2" },
    { t: "20:15", title: "תמונה — בר המלון", ch: "Instagram", need: "q4" }] },
  { he: "א׳ 23.8", slots: [{ t: "21:00", title: "סט לפאנביו — צ׳ק־אאוט מראש", ch: "Fanvue", need: "q5" }] },
  { he: "ב׳ 24.8", slots: [{ t: "20:00", title: "משבצת פנויה — המלצה 1 בתור", ch: "Instagram", need: "open" }] },
];
