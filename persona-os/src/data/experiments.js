/**
 * Hook Lab. One hypothesis, one variable, one decision metric fixed in advance.
 * A winning experiment produces an AMENDMENT PROPOSAL only — it never edits
 * the bible by itself. Approval is manual, by design.
 */
export const EXPERIMENTS = [
  { id: "e1", status: "done", q: "מה עוצר גלילה בשלוש השניות הראשונות?",
    hypo: "פתיחה עם פנים תעצור יותר מפתיחה עם חפץ, למרות שהחפץ משרת את המסתורין.",
    variable: "מה מופיע בפריים הראשון", metric: "retention 3s",
    variants: [{ t: "A", he: "פנים, מבט ישיר", v: 68, win: true }, { t: "B", he: "מעטפה בורדו על השולחן", v: 41 }, { t: "C", he: "מסדרון ריק", v: 34 }],
    verdict: "פנים ניצחו בפער של 66% מול החפץ. המסתורין עובד בשנייה השלישית, לא בראשונה.",
    amend: "פריים ראשון: פנים. הסמל נכנס אחרי שנייה 2.", amendState: null },
  { id: "e2", status: "done", q: "כמה רמזים אפשר לשים בפריים אחד?",
    hypo: "שני רמזים יעבירו יותר מידע ויעלו שמירות.",
    variable: "מספר הסמלים בפריים", metric: "עוקבים ל־1,000",
    variants: [{ t: "A", he: "רמז אחד", v: 9.4, win: true }, { t: "B", he: "שני רמזים", v: 5.1 }, { t: "C", he: "ללא רמז", v: 6.2 }],
    verdict: "ההשערה הופרכה. שני רמזים גרועים אפילו מאפס רמזים — עומס הורג את הסקרנות.",
    amend: "הכלל הקיים בביבליה מאושר בנתונים. אין שינוי.", amendState: "kept" },
  { id: "e3", status: "done", q: "איך לסגור פוסט עלילתי?",
    hypo: "שאלה ישירה תייצר יותר תגובות מחיתוך פתאומי.",
    variable: "סגירת הפוסט", metric: "עוקבים ל־1,000",
    variants: [{ t: "A", he: "חיתוך לפני ההסבר", v: 11.8, win: true }, { t: "B", he: "שאלה ישירה", v: 8.9 }, { t: "C", he: "הצהרה שקטה", v: 5.4 }],
    verdict: "השאלה מייצרת תגובות, החיתוך מייצר עוקבים. שני דברים שונים.",
    amend: "פוסט עלילתי נסגר בחיתוך. שאלה נשמרת לפוסטי קהילה בלבד.", amendState: null },
  { id: "e4", status: "running", q: "אורך ריל אופטימלי לעלילה?",
    hypo: "8 שניות יחזיקו טוב יותר מ־20 בגלל צפיות חוזרות.",
    variable: "אורך הקליפ", metric: "watch-through",
    variants: [{ t: "A", he: "8 שניות", v: 71 }, { t: "B", he: "15 שניות", v: 52 }, { t: "C", he: "20 שניות", v: null }],
    verdict: "וריאנט C טרם פורסם. אין הכרעה.", amend: null, amendState: null },
];
