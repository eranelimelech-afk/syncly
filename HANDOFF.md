# DESK — Prompt Terminal · מסמך מסירה (Handoff)

מסמך זה מסביר במלואו את האפליקציה שנבנתה, כדי שמפתח או סוכן אחר יוכל להמשיך
לתחזק ולפתח אותה ללא הקשר נוסף. נכתב ב‑19/06/2026.

---

## 1. מה זו האפליקציה

**DESK — Prompt Terminal** הוא מחולל פרומפטים לסוחרים. ממשק בעברית, RTL, עיצוב כהה
בסגנון "שולחן מסחר". יש 10 תבניות פרומפט (כל אחת במסך נפרד), כאשר placeholders בסוגריים
כמו `[sector or stock]` הופכים לפקדים אינטראקטיביים (צ'יפים לבחירה מרובה + שדה טקסט חופשי).
את הפרומפט המורכב אפשר להעתיק (COPY) או להריץ מול מודל שפה (▶ הרץ) ולקבל תשובה בזרימה.

**מקור:** האפליקציה התחילה כקובץ HTML יחיד ("artifact" של Claude) שקרא ישירות ל‑
`api.anthropic.com` מהדפדפן — דבר שעובד רק בתוך ה‑sandbox של Claude. הומר לאפליקציה
הניתנת לפריסה אמיתית עם backend שמחזיק את מפתח ה‑API בצד שרת.

---

## 2. ריפו וענף

- **Repo:** `eranelimelech-afk/syncly`
- **Branch:** `claude/app-build-from-files-v1qukf`
- **Stack:** Node.js (שרת `http` מובנה, ללא framework) + frontend וניל (HTML/CSS/JS, ללא build step). תלות יחידה: `@anthropic-ai/sdk`.

---

## 3. מבנה הקבצים

```
syncly/
├── server.js            # שרת Node: סטטי + /api/run (SSE) + /api/sectors
├── public/
│   ├── index.html       # כל ה-frontend (HTML+CSS+JS בקובץ אחד)
│   └── formats.json     # 10 התבניות + בנקי האופציות + fallback לסקטורים
├── package.json         # scripts + dependency (@anthropic-ai/sdk)
├── package-lock.json    # lockfile (נדרש ל-npm ci בפריסה)
├── .env.example         # תבנית למשתני סביבה
├── .gitignore           # מתעלם מ-.env, node_modules וכו'
├── Dockerfile           # image לפריסה (node:22-alpine, non-root)
├── .dockerignore
├── render.yaml          # blueprint לפריסה ב-Render
├── README.md            # תיעוד משתמש/מפתח
└── HANDOFF.md           # המסמך הזה
```

---

## 4. ארכיטקטורה וזרימת נתונים

```
דפדפן (public/index.html)
   │
   ├── GET /formats.json ──────► טוען את התבניות ובונה את ה-UI (boot())
   ├── GET /api/sectors ───────► דירוג חי של סקטורים (פאנל "טופ 5")
   └── POST /api/run ──────────► שולח את הפרומפט; מקבל תשובה בזרימה (SSE)
                                   │
                              server.js
                                   │  מחזיק ANTHROPIC_API_KEY (סוד, צד שרת בלבד)
                                   └──► Anthropic Messages API (client.messages.stream)
```

**עיקרון מפתח:** מפתח ה‑API **לעולם** לא מגיע לדפדפן. כל קריאה למודל עוברת דרך
`server.js`, שקורא את המפתח ממשתנה הסביבה.

---

## 5. ה-Backend (`server.js`)

שרת `http` מובנה של Node. שלושה תחומי אחריות:

### א. הגשת קבצים סטטיים
מגיש את `public/` (ברירת מחדל `/` → `index.html`). כולל הגנת path‑traversal
(לא ניתן לצאת מחוץ ל‑`public/`).

### ב. `POST /api/run` — הרצת פרומפט בזרימה (SSE)
- **בקשה:** `{ "prompt": "..." }` (JSON). ולידציה: prompt חובה, עד 8000 תווים, גוף עד 100KB.
- **תגובה:** Server‑Sent Events (`Content-Type: text/event-stream`). כל אירוע בשורת `data:`:
  - `{ "type": "delta", "text": "..." }` — קטע טקסט נוסף מהמודל
  - `{ "type": "error", "error": "..." }` — שגיאה (הודעה גנרית ללקוח; השגיאה המלאה נרשמת רק ב‑log)
  - `{ "type": "done" }` — סיום תקין
- משתמש ב‑`client.messages.stream(...)` עם `system prompt` שמורה למודל לענות בעברית,
  תמציתי, וכ"תוכן חינוכי בלבד — לא ייעוץ השקעות".
- **ביטול אוטומטי:** אם הדפדפן מתנתק (`req.on('close')`), הבקשה ל‑API מבוטלת
  (`stream.abort()`) כדי לא לבזבז טוקנים. זה מה שמאפשר את כפתור "עצור" בצד הלקוח.

### ג. `GET /api/sectors` — פיד סקטורים חי
- מדרג את 5 סקטור‑ה‑ETF המובילים לפי תשואת ~3 חודשים.
- מקור: **Yahoo Finance chart API** (חינמי, ללא מפתח) — `query1.finance.yahoo.com/v8/finance/chart/{ETF}?range=3mo&interval=1d`.
- רשימת ה‑ETFs ממופה לשמות הסקטורים בעברית עם הערה ערוכה לכל אחד (`SECTOR_ETFS`).
- **Cache:** בזיכרון, שעה אחת (`SECTORS_TTL_MS`).
- **Fallback:** אם הפיד לא זמין (אין רשת יוצאת / שגיאה) — מחזיר רשימה סטטית (`STATIC_TOP_SECTORS`)
  עם `live: false`, כך שה‑UI תמיד עובד.
- **תגובה:** `{ "live": bool, "asOf": "YYYY-MM-DD"|null, "topSectors": [{name, perf, note, tag}, ...] }`

**משתני סביבה (כולם אופציונליים חוץ מהמפתח):**

| משתנה | ברירת מחדל | תפקיד |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | **חובה** ל‑/api/run. נשמר בצד שרת בלבד. |
| `ANTHROPIC_MODEL` | `claude-opus-4-8` | המודל שבו משתמשים. |
| `ANTHROPIC_MAX_TOKENS` | `2048` | מקס' טוקני פלט לתשובה. |
| `PORT` | `3000` | פורט HTTP (פלטפורמות אירוח מזריקות אותו). |

---

## 6. ה-Frontend (`public/index.html`)

קובץ יחיד: HTML + CSS + JS וניל. אין תלויות חיצוניות, אין build.

**זרימת אתחול:** `boot()` → טוען `formats.json` → בונה `FORMATS` (מרחיב טוקני אופציות) →
מאתחל state → בונה תפריט → `render()` → `loadSectors()` (פיד חי, מרנדר מחדש כשמוכן).

**פונקציות מרכזיות:**
- `boot()` — אתחול אסינכרוני (טעינת JSON + סקטורים).
- `render()` — בונה מסך פורמט (צ'יפים, פאנל סקטורים, כרטיס פרומפט).
- `paintPrompt()` / `plainPrompt()` — מרכיבים את מחרוזת הפרומפט (מחליפים `{key}` בערכים שנבחרו).
- `runPrompt()` — שולח ל‑`/api/run`, קורא את ה‑SSE, מרנדר טקסט בזרימה. כולל כפתור עצירה (`AbortController`).
- `copyPrompt()` — מעתיק ללוח.
- `mdLite()` — Markdown → HTML מינימלי לתצוגת התשובה.
- היסטוריה: `loadHist()/saveHist()/startHistory()/finishHistory()/renderHistory()/restoreHistory()/exportHistory()`.

**State:** `state[formatId][fieldKey] = [ערכים שנבחרו]`. נשמר בזיכרון בלבד (לא מתמשך מעבר ל‑session,
חוץ מההיסטוריה).

---

## 7. סכמת `public/formats.json` (התבניות — ניתנות לעריכה ללא קוד)

```jsonc
{
  "banks": {
    "SECTORS": ["Energy", ...],   // רשימות אופציות לצ'יפים
    "STOCKS":  ["NVDA", ...],
    "STRATS":  ["Swing Trading", ...]
  },
  "topSectorsFallback": [ {name, perf, note, tag}, ... ],  // משמש כשהפיד החי לא זמין
  "formats": [
    {
      "id": 1,
      "title": "Market Analysis",   // שם אנגלי (breadcrumb)
      "he": "ניתוח שוק",            // כותרת עברית (תפריט + מסך)
      "lede": "...",                // תיאור קצר
      "template": "Analyze ... focusing on {sel}. ...",  // המחרוזת; {key} = placeholder
      "fields": [
        {
          "key": "sel",                       // תואם ל-{sel} בתבנית
          "label": "סקטור או מניה",
          "ph": "[sector or stock]",          // טקסט ה-placeholder כשריק
          "options": ["@SECTORS", "@STOCKS"], // טוקנים מתרחבים לבנקים; או רשימה מפורשת
          "free": true,                       // מאפשר שדה טקסט חופשי
          "multi": true,                      // בחירה מרובה
          "sectorTop": true                   // מציג את פאנל "טופ 5 סקטורים"
        }
      ]
    }
    // ... 10 פורמטים
  ]
}
```

**טוקני אופציות:** `@SECTORS` / `@STOCKS` / `@STRATS` ב‑`options` מתרחבים אוטומטית
לרשימות מתוך `banks`. אפשר גם לתת רשימה מפורשת של מחרוזות (כמו בפורמט 9). 
**להוספת/עריכת פורמט:** עורכים את `formats.json` בלבד — אין צורך לגעת בקוד.

---

## 8. 4 שדרוגים שהוטמעו (מעבר להמרת ה-backend)

1. **תשובות Streaming** — `/api/run` מזרים SSE; הפלט מופיע טוקן‑אחר‑טוקן.
2. **פיד סקטורים חי** — `/api/sectors` עם Yahoo Finance + cache + fallback.
3. **היסטוריית הרצות** — נשמרת ב‑`localStorage` (עד 30); מסך "היסטוריה" עם שחזור/מחיקה.
4. **תבניות חיצוניות** — `formats.json` (ניתן לעריכה ע"י לא‑מפתחים).

**ועוד שניים:**
- **כפתור עצירה** — ▶ הרץ הופך ל‑⏹ עצור בזמן זרימה; עצירה שומרת את החלק שהתקבל.
- **ייצוא היסטוריה** — כפתור "⬇ ייצא JSON" מוריד את כל ההיסטוריה כקובץ.

---

## 9. הפעלה מקומית

דרישה: Node.js 18+ (נבדק על 22).

```bash
git clone -b claude/app-build-from-files-v1qukf https://github.com/eranelimelech-afk/syncly.git
cd syncly
npm install
export ANTHROPIC_API_KEY="sk-ant-..."   # המפתח שלך
npm start                                # → http://localhost:3000
```

ללא מפתח: האפליקציה נטענת, COPY ופאנל הסקטורים עובדים, אבל ▶ הרץ יחזיר שגיאה.

---

## 10. פריסה

האפליקציה ללא build step ומאזינה ל‑`PORT` — רצה בכל מקום שמריץ Node.
**תמיד מגדירים `ANTHROPIC_API_KEY` כסוד בפלטפורמה — לעולם לא בקוד.**

- **Docker:** `docker build -t desk . && docker run -p 3000:3000 -e ANTHROPIC_API_KEY="..." desk`
- **Render:** New → Blueprint → בחירת הריפו (יש `render.yaml`) → הגדרת המפתח ב‑Environment.
- **Railway:** Deploy from GitHub → הוספת `ANTHROPIC_API_KEY` ב‑Variables.
- **Fly.io:** `fly launch --no-deploy` → `fly secrets set ANTHROPIC_API_KEY="..."` → `fly deploy`.

פירוט מלא: `README.md` סעיף Deploy.

---

## 11. אבטחה — נקודות חשובות

- **מפתח ה‑API נשמר בצד שרת בלבד** (משתנה סביבה). הדפדפן קורא רק ל‑`/api/run`.
- **`.env` ב‑`.gitignore`** — לא נכנס ל‑git לעולם.
- **שגיאות מהמודל** נרשמות ב‑log בצד שרת; ללקוח מוחזרת הודעה גנרית בלבד (לא חושף פנימיות).
- **הגנת path‑traversal** בהגשת קבצים סטטיים.
- **לקח מהפיתוח:** אם מפתח נחשף אי‑פעם (למשל הודבק בטעות בצ'אט/issue) — **לבטל ולסובב אותו מיד**
  ב‑console.anthropic.com. הריפו נסרק ואומת כנקי ממפתחות אמיתיים (רק placeholders מסוג `sk-ant-...`).

---

## 12. מה נבדק

- ולידציית JSON של `formats.json` ובדיקת syntax של `server.js` וה‑JS המוטמע.
- הגשת `/`, `/formats.json`, `/api/sectors` (החזיר נתונים חיים אמיתיים).
- `/api/run`: ולידציה (400), פתיחת ערוץ SSE, ואירוע error מבוקר ללא מפתח.
- `npm ci --omit=dev` (פקודת ה‑build של ה‑Docker/Render) + הפעלה ב‑`NODE_ENV=production`.
- **לא נבדק חי:** קריאת מודל אמיתית (לא היה מפתח בסביבת הפיתוח) — נתיב הזרימה
  נבדק עד שלב קריאת ה‑SDK בלבד. עם מפתח תקין הזרימה תעבוד מקצה לקצה.

---

## 13. רעיונות להמשך (לא הוטמעו)

- `fly.toml` מוכן מראש / GitHub Action ל‑deploy אוטומטי.
- ייבוא היסטוריה (כרגע רק ייצוא).
- אימות/הגבלת קצב (rate limiting) על `/api/run` לפני חשיפה ציבורית.
- החלפת ה‑system prompt או ה‑disclaimer לפי דרישות רגולציה בפרודקשן.
- הרחבת רשימת ה‑ETFs / שינוי חלון הזמן בפיד הסקטורים.

---

## 14. סיכום קצר לסוכן

> אפליקציית Node + frontend וניל. `server.js` מגיש את `public/` וחושף `/api/run`
> (SSE streaming מול Claude, מפתח בצד שרת) ו‑`/api/sectors` (פיד ETF חי + fallback).
> התבניות ב‑`public/formats.json`. הפעלה: `npm install` → `export ANTHROPIC_API_KEY=...`
> → `npm start` → `localhost:3000`. פריסה: Docker / Render (`render.yaml`) / Railway / Fly.
> כלל ברזל: המפתח רק כסוד סביבה, אף פעם לא בקוד.
