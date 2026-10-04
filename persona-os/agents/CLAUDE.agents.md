## סוכני הדמויות (`agents/`)

שכבת סוכנים מבוססת קבצים מעל PersonaOS. הסוכנים **מכינים ומדווחים** — לא מפרסמים.
הפירוט: `agents/AGENTS.md`.

- **אין פרסום אוטומטי גם כאן.** שום סקיל, סקריפט או runtime לא קורא ל־API של פרסום.
  `publish-handoff` אורז פריט לשער האישורים, ושם הוא מחכה ללחיצה.
- **`IDENTITY.md` הוא היטל של הביבליה, לא מקור שני.** פער מתוקן ב־IDENTITY.md, לעולם לא
  ב־`bible.js`. `npm run agents:check` מדווח על פערים ולא מתקן.
- **`state.example.json` הוא החוזה.** שדה בלי מקור מושמט — לא ממציאים ערכים.
  נתונים מהמחולל מסומנים `"source": "seed"`.
- **מיפוי מזהים:** `src/lib/agents.js` (`vane` → `romy-vane` וכו׳). מיפוי pillars:
  `PILLAR_MAP` ב־`scripts/export-agent-state.mjs`.
- `state.json` ו־`reports/*.md` לא נכנסים ל־git.

```bash
npm run agents:export      # state.json לכל דמות
npm run agents:heartbeat   # דוח לכל דמות → כרטיס Heartbeat בחדר הבקרה
npm run agents:check       # פערים בין IDENTITY.md לביבליה
npm run agents:ctx -- romy-vane "room 707 episode reel"
```
