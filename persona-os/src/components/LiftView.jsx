import React, { useState, useMemo } from "react";
import { DIMS, METRICS } from "../data/dimensions.js";
import { analyseLift } from "../lib/recommend.js";
import { fmt } from "./ui.jsx";

export default function LiftView({ posts }) {
  const [metric, setMetric] = useState("followPer1k");
  const analysis = useMemo(() => analyseLift(posts, DIMS, metric), [posts, metric]);
  const flat = analysis.flatMap((d) => d.rows.map((r) => ({ ...r, dim: d.he }))).sort((a, b) => b.lift - a.lift);
  const mName = METRICS.find((m) => m.key === metric).he;
  return (
    <>
      <p className="note">כל פוסט מתויג בשבעה ממדים. כל ערך מושווה לממוצע הדמות. החלף מדד ותראה איך אותו תוכן נראה הפוך לגמרי.</p>
      <div className="selrow">{METRICS.map((m) => (
        <button key={m.key} className={"sbtn " + (metric === m.key ? "on" : "")} onClick={() => setMetric(m.key)}>{m.short}</button>))}</div>
      <div className="grid g2">
        <div className="card" style={{ padding: 14 }}><h3 style={{ color: "#4E9B76" }}>מרים את {mName}</h3>
          {flat.slice(0, 3).map((r, i) => (
            <div key={i} style={{ fontSize: 12.5, padding: "5px 0", borderBottom: i < 2 ? "1px dashed #1F252D" : 0 }}>
              <b>{r.he}</b> <span style={{ color: "#5B616C" }}>· {r.dim}</span>
              <span className="mono up" style={{ float: "left" }}>+{r.lift.toFixed(0)}%</span></div>))}</div>
        <div className="card" style={{ padding: 14 }}><h3 style={{ color: "#BE4C3D" }}>מוריד את {mName}</h3>
          {flat.slice(-3).reverse().map((r, i) => (
            <div key={i} style={{ fontSize: 12.5, padding: "5px 0", borderBottom: i < 2 ? "1px dashed #1F252D" : 0 }}>
              <b>{r.he}</b> <span style={{ color: "#5B616C" }}>· {r.dim}</span>
              <span className="mono down" style={{ float: "left" }}>{r.lift.toFixed(0)}%</span></div>))}</div>
      </div>
      {analysis.map((d) => (
        <div key={d.key}>
          <h2>{d.he} <em>ממוצע הדמות: {d.base < 10 ? d.base.toFixed(2) : fmt(d.base)}</em></h2>
          <div className="card" style={{ padding: "8px 14px" }}>
            {d.rows.map((r) => {
              const w = Math.min(Math.abs(r.lift), 120) / 2.4;
              const pos = r.lift >= 0;
              return (
                <div className="lrow" key={r.v}>
                  <div className="lname">{r.he} <span className="mono" style={{ color: "#5B616C", fontSize: 10.5 }}>n={r.n}</span></div>
                  <div className="ltrack"><div className="lmid" />
                    <div className="lfill" style={{ [pos ? "right" : "left"]: "50%", width: w + "%",
                      background: pos ? "rgba(78,155,118,.75)" : "rgba(190,76,61,.75)" }} /></div>
                  <div className={"lval mono " + (pos ? "up" : "down")}>{pos ? "+" : ""}{r.lift.toFixed(0)}%</div>
                </div>);
            })}
          </div>
        </div>))}
    </>
  );
}
