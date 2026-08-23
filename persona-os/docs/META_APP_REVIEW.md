# הגשה ל־Meta App Review

הצוואר הארוך ביותר בפרויקט: כשבועיים עד חודש **לכל הרשאה**, כל אחת עם הקלטת מסך
נפרדת. זה לא חוסם שום דבר אחר — ולכן צריך להתחיל אותו לפני שהכל מוכן, לא אחרי.

## תנאי סף

- חשבון אינסטגרם **Business או Creator**. חשבון אישי לא נתמך.
- אפליקציה ב־Meta for Developers מסוג Business.
- מדיניות פרטיות בכתובת ציבורית, וכתובת למחיקת נתוני משתמש.
- החשבון צריך 100 עוקבים ומעלה כדי שנתוני דמוגרפיה יוחזרו. שאר המדדים לא תלויים בזה.

## איזה מסלול

| | Instagram Login | Facebook Login |
|---|---|---|
| דף פייסבוק | לא נדרש | נדרש, מקושר |
| מתאים ל | דמות בודדת בלי נוכחות בפייסבוק | ניהול כמה נכסים |

**המלצה: Instagram Login.** אין דף פייסבוק לרומי ואין סיבה ליצור אחד רק כדי לעבור
אימות.

## ההרשאות שצריך, ורק הן

הכלל שחוזר בכל התיעוד: בקשה של הרשאות מיותרות היא הסיבה השכיחה לדחייה.

| הרשאה | למה היא נדרשת אצלנו | בלעדיה |
|---|---|---|
| `instagram_business_basic` | זיהוי החשבון ורשימת המדיה | אין על מה להצביע |
| `instagram_business_manage_insights` | `reach`, `shares`, `saved`, `follows`, `profile_visits`, זמן צפייה בריל | אין ניתוח ביצועים בכלל |
| `instagram_business_content_publish` | לפרסם אחרי לחיצת ״אשר ושבץ״ — וזה מה שמחזיר את `ig_media_id` | אפשר לעבוד, אבל הצימוד חוזר להתאמה שברירית |

**אל תבקש** `instagram_business_manage_messages` או `manage_comments`. המערכת לא
נוגעת בתגובות ובהודעות, ובקשה שלהן תגרור שאלות שאין להן תשובה בהדגמה.

## מה להראות בהקלטה, לכל scope

הבודק צריך לראות משתמש אמיתי מתחבר ומקבל ערך מההרשאה. שלוש הקלטות נפרדות.

**`instagram_business_basic`**
1. מסך התחברות, בחירת חשבון ה־Business
2. חזרה לאפליקציה — שם החשבון והמדיה מופיעים
3. מסך ההרשאות שהמשתמש אישר

**`instagram_business_manage_insights`**
1. אותה התחברות
2. מסך ״ביצועים״ נטען עם מדדים אמיתיים לכל פוסט
3. מסך ״מה עובד״ — להסביר בקול שזה ניתוח פנימי ליוצר על התוכן שלו עצמו

**`instagram_business_content_publish`**
1. פריט בתור עם ציון QA וחוסם דולק — **להראות שכפתור האישור נעול**
2. תיקון הבדיקה, הכפתור נפתח
3. לחיצה על ״אשר ושבץ״ והפוסט יוצא

הנקודה השלישית היא הנכס הכי חזק בהגשה: היא מראה ששום דבר לא מתפרסם בלי אישור
אנושי מפורש. זו בדיוק השאלה שבודק שואל על הרשאת פרסום.

## נוסח לשדה ההסבר

> PersonaOS is a private publishing control room for a single Instagram creator
> account. Before anything is published, each item passes a 22-check quality
> review with five hard blockers that lock the approve button regardless of
> score; publishing only happens after an explicit human approval click. There
> is no automatic posting and no scheduling without approval.
>
> Insights are read for the connected account's own media only, and are used
> to show the account owner which of their own content performs best. No data
> about any other account, and no data about individual viewers, is requested,
> stored or displayed.

## מה יידחה

- לבקש הרשאת פרסום ולהראות הדגמה שמפרסמת אוטומטית. אצלנו זה לא רלוונטי — הביבליה
  אוסרת auto-publish והשער מדגים את זה — אבל שווה לומר את זה בקול בהקלטה.
- הקלטה של מסכי mockup במקום האפליקציה האמיתית.
- מדיניות פרטיות שהיא דף ריק או קישור שבור.
- הרשאות שלא מודגמות בהקלטה.

## סדר פעולות

1. לפתוח את האפליקציה ב־Meta for Developers — **היום**. שאר הסעיפים יכולים לחכות.
2. להעלות מדיניות פרטיות ונקודת מחיקת נתונים.
3. לחבר את חשבון ה־Business ולקבל טוקן פיתוח.
4. לבנות את הראוט — כבר קיים ב־`server/instagram.js`, צריך רק את המשתנים:
   `IG_USER_ID`, `IG_ACCESS_TOKEN`.
5. להריץ במצב פיתוח עם החשבון שלך, לוודא שהמדדים חוזרים.
6. להקליט את שלוש ההקלטות ולהגיש.

השלב שלוקח זמן הוא 6. השלבים 1–2 לוקחים שעה וצריכים לקרות עכשיו.
