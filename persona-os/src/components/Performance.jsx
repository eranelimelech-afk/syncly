import React, { useState } from "react";
import { WORLD, PURPOSE, FORMAT, CLUES } from "../data/dimensions.js";
import { fmt } from "./ui.jsx";

export default function Performance({ posts }) {
  const [sort, setSort] = useState("reach");
  const rows = [...posts].sort((a, b) => b[sort] - a[sort]);
  const hi = posts.filter((p) => p.qa >= 85);
  const lo = posts.filter((p) => p.qa < 70);
  const avg = (s, k) => (s.length ? s.reduce((a, p) => a + p[k], 0) / s.length : 0);
  const gap = ((avg(hi, "reach") - avg(lo, "reach")) / Math.max(avg(lo, "reach"), 1)) * 100;
  const gapF = ((avg(hi, "followPer1k") - avg(lo, "followPer1k")) / Math.max(avg(lo, "followPer1k"), 0.01)) * 100;
  return (
    <>
      <div className="alert ok" style={{ marginBottom: 14 }}><span>◎</span><div>
        <b>השער מצדיק את עצמו.</b> פוסטים עם ציון QA 85 ומעלה קיבלו בממוצע <span className="mono">{gap.toFixed(0)}%</span> יותר
        חשיפה ו־<span className="mono">{gapF.toFixed(0)}%</span> יותר עוקבים חדשים ל־1,000 חשיפות מפוסטים מתחת ל־70.</div></div>
      <div className="selrow">
        {[["reach", "חשיפה"], ["shares", "שיתופים"], ["saves", "שמירות"], ["follows", "עוקבים"], ["subs", "מנויים"], ["qa", "QA"]].map(([k, he]) => (
          <button key={k} className={"sbtn " + (sort === k ? "on" : "")} onClick={() => setSort(k)}>מיין לפי {he}</button>))}
      </div>
      <div className="card scroll">
        <table>
          <thead><tr>
            <th>תאריך</th><th>עולם</th><th>מטרה</th><th>פורמט</th><th>רמזים</th><th>QA</th>
            <th>חשיפה</th><th>שיתופים</th><th>שמירות</th><th>צפייה</th><th>עוקבים</th><th>מנויים</th>
          </tr></thead>
          <tbody>{rows.map((p) => (
            <tr key={p.id}>
              <td className="mono">{p.day}</td>
              <td>{WORLD[p.world].he}</td>
              <td style={{ fontSize: 11.5, color: "#B99A5B" }}>{PURPOSE[p.purpose].he.split(" — ")[0]}</td>
              <td>{FORMAT[p.format].he}</td>
              <td style={{ fontSize: 11.5, color: p.clue === "many" ? "#BE4C3D" : p.clue === "one" ? "#B99A5B" : "#5B616C" }}>{CLUES[p.clue].he}</td>
              <td className="mono" style={{ fontWeight: 600, color: p.qa >= 85 ? "#4E9B76" : p.qa >= 70 ? "#D9A03F" : "#BE4C3D" }}>{p.qa}</td>
              <td className="mono">{fmt(p.reach)}</td>
              <td className="mono">{fmt(p.shares)}</td>
              <td className="mono">{fmt(p.saves)}</td>
              <td className="mono">{p.watch ? p.watch + "%" : "—"}</td>
              <td className="mono">{fmt(p.follows)}</td>
              <td className="mono">{p.subs}</td>
            </tr>))}</tbody>
        </table>
      </div>
    </>
  );
}
