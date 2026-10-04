import React from "react";

export const fmt = (n) => Math.round(n).toLocaleString("en-US");

export const Kpi = ({ lbl, val, sub, tone }) => (
  <div className="card kpi">
    <div className="lbl">{lbl}</div>
    <div className="val">{val}</div>
    {sub && <div className={"sub " + (tone || "")}>{sub}</div>}
  </div>
);

export const SegBar = ({ groups }) => (
  <div className="sbar">
    {groups.map((g) => {
      const pct = (g.got / g.max) * 100;
      const c = pct >= 90 ? "#4E9B76" : pct >= 70 ? "#D9A03F" : "#BE4C3D";
      return (
        <div className="seg" key={g.key}>
          <div className="segbar"><div className="segfill" style={{ width: pct + "%", background: c }} /></div>
          <div className="seglbl">{g.he} <span className="mono">{g.got}/{g.max}</span></div>
        </div>
      );
    })}
  </div>
);

export const Alert = ({ kind = "gold", icon = "◈", children }) => (
  <div className={"alert " + kind}><span>{icon}</span><div>{children}</div></div>
);
