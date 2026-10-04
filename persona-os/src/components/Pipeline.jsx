import React from "react";
import { PHASES, CRAFT, EXCLUDED } from "../data/pipeline.js";
import { STAGES } from "../data/queue.js";
import { Alert } from "./ui.jsx";

/**
 * The production pipeline with exit criteria per phase. ROADMAP step 3.
 * An item may not advance while an exit condition is unanswered — that is the
 * whole point: generating is step three of six, not step one.
 */
export default function Pipeline({ queue, qa }) {
  const atStage = (i) => (queue || []).filter((q) => q.stage === i && !qa?.[q.id]?.decision).length;
  return (
    <>
      <p className="note">
        הכשל הנפוץ אינו פרומפט חלש אלא ייצור לפני שהוחלט משהו. לכן לכל שלב יש תנאי יציאה — מה חייב
        להיות נכון לפני שהפריט מתקדם. השער הוא השלב האחרון, לא הראשון שבו חושבים על איכות.
      </p>
      {PHASES.map((p, i) => {
        const n = p.stages.reduce((a, s) => a + atStage(s), 0);
        const craft = CRAFT.filter((c) => c.phase === p.id);
        return (
          <div className="card" key={p.id} style={{ marginBottom: 10 }}>
            <div style={{ padding: "12px 15px" }}>
              <div className="btop">
                <span className="rnum">{i + 1}</span>
                <span className="bkey" style={{ fontSize: 14 }}>{p.he} <span style={{ color: "#5B616C", fontWeight: 400 }}>· {p.en}</span></span>
                {n > 0 && <span className="tag" style={{ color: "#D9A03F", borderColor: "#D9A03F55" }}>{n} בתור</span>}
                <span className="src">{p.stages.map((s) => STAGES[s]).join(" · ")}</span>
              </div>
              <div className="bval">{p.goal}</div>
              <div style={{ marginTop: 9 }}>
                {p.exit.map((e) => (
                  <div className="crow" key={e}>
                    <span className="dot" style={{ background: "#3A3F47" }} />
                    <span className="ctxt">{e}</span>
                  </div>))}
              </div>
              <div className="alert warn" style={{ marginTop: 9 }}><span>⚠</span><div><b>המלכודת:</b> {p.trap}</div></div>
              {craft.length > 0 && (
                <div style={{ marginTop: 9 }}>
                  {craft.map((c) => (
                    <div className="crow" key={c.he}>
                      <span className="ctxt" style={{ color: "#8C9099", fontSize: 12 }}>· {c.he}</span>
                      <span className="src">{c.src}</span>
                    </div>))}
                </div>)}
            </div>
          </div>);
      })}

      <h2>כללי מלאכה שלא נכנסו לרובריקה</h2>
      <Alert kind="gold" icon="◈">
        הכללים שמופיעים למעלה ליד כל שלב מגיעים ממדריכי הפלטפורמה, לא מהביבליה. הם מוצגים כייעוץ
        ולא כבדיקות נקודות — קידום של אחד מהם לרובריקה משנה את חלוקת ה־100 נקודות, וזו החלטה שלך.
      </Alert>

      <h2>מה המערכת לא תעשה <em>נרשם כדי שלא ייכנס בדלת האחורית</em></h2>
      <div className="card" style={{ padding: "8px 14px" }}>
        {EXCLUDED.map((e) => (
          <div className="crow" key={e.he}>
            <span style={{ color: "#CE7C6B", fontSize: 12.5, flex: 1 }}>✕ {e.he}</span>
            <span className="hint">{e.why}</span>
          </div>))}
        <div className="hint" style={{ padding: "8px 0 4px" }}>
          חלק מהחומר שנלמד ממליץ על הטקטיקות האלה. כולן מזייפות מעורבות או עוקפות אכיפה, וכולן
          סותרות את הסעיף שקובע שגילוי נאות הוא חוסם קשיח. לא מימשתי אותן ולא אממש.
        </div>
      </div>
    </>
  );
}
