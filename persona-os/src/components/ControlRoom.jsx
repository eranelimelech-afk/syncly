import React from "react";
import { scoreOf } from "../lib/scoring.js";
import { Kpi, fmt } from "./ui.jsx";

/**
 * Placeholder conversion rates for the two funnel stages the generator does not
 * produce. They disappear with real sources — see docs/ROADMAP.md step 1.
 */
const CLICK_RATE = 0.23;   // profile visits -> link clicks
const FREE_RATE = 3.2;     // paying subscribers -> free signups above them

/**
 * A funnel stage can never be wider than the stage above it. The free-signup
 * count is interpolated from the paying subscribers below it, so without a clamp
 * a persona with strong subscriber multipliers renders a stage at >100% of its
 * own parent. Clamping here keeps the shape honest for generated and real data alike.
 */
function buildFunnel(totals) {
  const rows = [
    ["חשיפה", totals.reach],
    ["כניסות לפרופיל", totals.visits],
    ["קליקים לקישור", Math.round(totals.visits * CLICK_RATE)],
    ["הרשמות חינם", Math.round(totals.subs * FREE_RATE)],
    ["מנויים משלמים", totals.subs],
  ];
  let ceiling = Infinity;
  return rows.map(([he, raw], i) => {
    const v = Math.min(raw, ceiling);
    const prev = i === 0 ? null : ceiling;
    ceiling = v;
    return { he, v, prev };
  });
}

export default function ControlRoom({ persona, posts, queue, qa, totals, openAmends, onOpenItem, onOpenLab }) {
  const pending = queue.filter((q) => !qa[q.id].decision);
  return (
    <>
      <h2 style={{ marginTop: 20 }}>{persona.name} <em>{persona.lane} · {posts.length} פוסטים ב־45 הימים האחרונים</em></h2>
      <div className="grid g4">
        <Kpi lbl="חשיפה מצטברת" val={fmt(totals.reach)} sub="אורגני" />
        <Kpi lbl="שיתופים" val={fmt(totals.shares)} sub={`${((totals.shares / totals.reach) * 1000).toFixed(1)} ל־1,000 חשיפות`} />
        <Kpi lbl="עוקבים חדשים" val={fmt(totals.follows)} sub={`${((totals.follows / totals.reach) * 1000).toFixed(1)} ל־1,000 חשיפות`} />
        <Kpi lbl="ציון QA ממוצע" val={totals.qaAvg} sub={totals.qaAvg >= 85 ? "מעל סף השחרור" : "מתחת לסף השחרור (85)"} tone={totals.qaAvg >= 85 ? "up" : "down"} />
      </div>

      <h2>מה דורש ממך החלטה</h2>
      {pending.length === 0 && openAmends === 0 ? <div className="card empty">אין פריטים ממתינים.</div> : (
        <div className="card" style={{ padding: "6px 14px" }}>
          {pending.map((q) => {
            const s = scoreOf(qa[q.id].checks);
            return (
              <div className="lrow" key={q.id} style={{ borderBottom: "1px dashed #1F252D" }}>
                <span className="dot" style={{ background: s.blockers.length ? "#BE4C3D" : s.total >= 85 ? "#4E9B76" : "#D9A03F" }} />
                <span style={{ flex: 1, fontSize: 13 }}>{q.title}</span>
                <span className="mono" style={{ fontSize: 12, color: "#8C9099" }}>{q.when}</span>
                <span className="mono" style={{ width: 34, textAlign: "left", fontWeight: 600 }}>{s.total}</span>
                <button className="btn sm" onClick={() => onOpenItem(q.id)}>פתח</button>
              </div>);
          })}
          {openAmends > 0 && (
            <div className="lrow">
              <span className="dot" style={{ background: "#B99A5B" }} />
              <span style={{ flex: 1, fontSize: 13 }}>{openAmends} הצעות תיקון לביבליה ממתינות להכרעה</span>
              <button className="btn sm" onClick={onOpenLab}>פתח</button>
            </div>)}
        </div>)}

      <h2>משפך אינסטגרם ← פאנביו <em>45 יום</em></h2>
      <div className="card" style={{ padding: 16 }}>
        {buildFunnel(totals).map(({ he, v, prev }, i, arr) => (
          <div key={he} style={{ marginBottom: i < arr.length - 1 ? 10 : 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
              <span>{he}</span>
              <span className="mono">{fmt(v)}{prev ? <span style={{ color: "#5B616C" }}> · {((v / prev) * 100).toFixed(1)}%</span> : null}</span>
            </div>
            <div style={{ height: 9, background: "#191E26", borderRadius: 3 }}>
              <div style={{ height: "100%", borderRadius: 3, width: Math.max((v / totals.reach) * 100, 0.6) + "%",
                background: "linear-gradient(90deg,#8A2733,#B99A5B)" }} /></div>
          </div>))}
      </div>
    </>
  );
}
