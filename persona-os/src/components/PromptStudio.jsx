import React, { useState } from "react";
import { PROMPTS } from "../data/prompts.js";

export default function PromptStudio() {
  const [open, setOpen] = useState("anchor");
  return (
    <>
      <p className="note">
        התבניות לא נכתבות ביד. הן נבנות מהביבליה — המראה, הפלטה, טבלת הלבוש וכללי הקול מוזרקים לתוכן
        אוטומטית, כך שאי אפשר לשלוח לרינדור פרומפט שסותר את הדמות.
      </p>
      <div className="alert bad" style={{ marginBottom: 14 }}>
        <span>⛔</span>
        <div><b>התנגשות שכדאי להכריע.</b> המדריך ממליץ על Nano Banana לתמונות, Kling 3.0 לווידאו ו־HeyGen
        לדיבור. אתה נעלת קודם Seedance בלבד ואמרת מפורשות לא nano_banana_2. התבניות כאן ניטרליות ועובדות
        בכל מנוע — אבל צריך להחליט אם הנעילה נשארת. ראה docs/DECISIONS.md.</div>
      </div>
      {PROMPTS.map((p) => (
        <div className="card" key={p.id} style={{ marginBottom: 10 }}>
          <div className="acts" style={{ borderTop: 0, borderBottom: open === p.id ? "1px solid var(--line)" : 0 }}>
            <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700 }}>{p.he}</span>
            <span className="src">{p.src}</span>
            <button className="btn sm" onClick={() => setOpen(open === p.id ? null : p.id)}>{open === p.id ? "סגור" : "פתח"}</button>
          </div>
          {open === p.id && <div style={{ padding: "12px 15px" }}><div className="cap" style={{ marginTop: 0 }}>{p.text}</div></div>}
        </div>))}
    </>
  );
}
