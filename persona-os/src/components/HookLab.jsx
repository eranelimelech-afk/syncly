import React from "react";
import { EXPERIMENTS } from "../data/experiments.js";

/**
 * A winning experiment produces an amendment PROPOSAL. It never writes to the
 * bible. Approval is manual — that is the rule that protects the character.
 */
export default function HookLab({ amend, onAmend }) {
  return (
    <>
      <p className="note">
        לא מנסים להיות ויראליים, בונים מערכת ניסויים. לכל ניסוי יש השערה, משתנה אחד שמשתנה, ומדד הכרעה
        שנקבע מראש. כאן זה מחובר לביבליה — ניסוי שמנצח מציע תיקון, ורק אתה מאשר אותו.
      </p>
      {EXPERIMENTS.map((e) => {
        const max = Math.max(...e.variants.map((v) => v.v || 0));
        const st = amend[e.id] || e.amendState;
        return (
          <div className="card" key={e.id} style={{ marginBottom: 12 }}>
            <div style={{ padding: "13px 15px" }}>
              <div className="btop">
                <span className="bkey" style={{ fontSize: 14 }}>{e.q}</span>
                <span className="tag" style={e.status === "running"
                  ? { color: "#D9A03F", borderColor: "#D9A03F55" }
                  : { color: "#4E9B76", borderColor: "#4E9B7655" }}>
                  {e.status === "running" ? "רץ עכשיו" : "הוכרע"}</span>
              </div>
              <div className="bval"><b>השערה:</b> {e.hypo}</div>
              <div className="tags"><span className="tag">משתנה: {e.variable}</span><span className="tag">מדד הכרעה: {e.metric}</span></div>
              <div style={{ marginTop: 10 }}>
                {e.variants.map((v) => (
                  <div className="var" key={v.t}>
                    <div className="vtag" style={v.win ? { borderColor: "#4E9B76", color: "#4E9B76" } : {}}>{v.t}</div>
                    <span style={{ flex: 1, fontSize: 12.5, color: v.win ? "#EBE6DC" : "#8C9099" }}>{v.he}</span>
                    <div className="ltrack" style={{ maxWidth: 210 }}>
                      {v.v != null && <div style={{ position: "absolute", top: 3, bottom: 3, insetInlineStart: 0,
                        width: (v.v / max) * 100 + "%", borderRadius: 3,
                        background: v.win ? "rgba(78,155,118,.75)" : "rgba(140,144,153,.35)" }} />}
                    </div>
                    <span className="mono" style={{ width: 46, textAlign: "left", fontSize: 12,
                      color: v.v == null ? "#5B616C" : v.win ? "#4E9B76" : "#8C9099" }}>{v.v == null ? "—" : v.v}</span>
                  </div>))}
              </div>
              <div className="alert gold" style={{ marginTop: 10 }}><span>◈</span><div>{e.verdict}</div></div>
            </div>
            {e.amend && (
              <div className="acts">
                <span style={{ flex: 1, fontSize: 12.5 }}><b>הצעת תיקון לביבליה:</b> {e.amend}</span>
                {st === "kept" ? <span className="hint">הכלל הקיים אושר — אין שינוי</span>
                  : st === "accepted" ? <span className="hint" style={{ color: "#4E9B76" }}>נכנס לביבליה על ידך</span>
                  : st === "rejected" ? <span className="hint" style={{ color: "#BE4C3D" }}>נדחה — הביבליה לא השתנתה</span>
                  : (<>
                      <button className="btn go" onClick={() => onAmend(e.id, "accepted")}>הכנס לביבליה</button>
                      <button className="btn no" onClick={() => onAmend(e.id, "rejected")}>דחה</button>
                    </>)}
              </div>)}
          </div>);
      })}
      <div className="alert ok"><span>◎</span><div>
        <b>הכלל שמגן על הדמות.</b> הביבליה קובעת ששינוי מהותי נעשה רק בהחלטה מפורשת שלך. לכן ניסוי מוצלח לא
        משנה שום דבר בעצמו — הוא רק מייצר הצעה שמחכה לך כאן. זה מה שמונע מהדמות להישחק אחרי כל תמונה שהצליחה.</div></div>
    </>
  );
}
