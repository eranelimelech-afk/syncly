import React from "react";
import { SCHEDULE_DAYS } from "../data/queue.js";

export default function Schedule({ approved }) {
  return (
    <>
      <p className="note">משבצת שלא אושרה נשארת ריקה. המערכת לא מפרסמת דבר בכוחות עצמה — היא שומרת את המקום ומזכירה מה חסר.</p>
      <div className="card">
        {SCHEDULE_DAYS.map((d) => (
          <div className="day" key={d.he}>
            <div className="dhead"><b>{d.he}</b><span style={{ color: "#5B616C", fontSize: 11 }}>{d.slots.length} משבצות</span></div>
            {d.slots.map((s, i) => {
              const open = s.need === "open";
              const ok = !open && approved[s.need] === "approved";
              const rej = !open && approved[s.need] === "rejected";
              return (
                <div className="slot" key={i}>
                  <span className="time mono">{s.t}</span>
                  <span className="dot" style={{ background: open ? "#3A3F47" : rej ? "#BE4C3D" : ok ? "#4E9B76" : "#D9A03F" }} />
                  <span style={{ flex: 1, fontSize: 13, color: open ? "#5B616C" : "inherit" }}>{s.title}</span>
                  <span className="pill" style={s.ch === "Fanvue" ? { color: "#8A79E0", borderColor: "#8A79E055" } : {}}>{s.ch}</span>
                  <span style={{ fontSize: 11.5, width: 100, textAlign: "left",
                    color: open ? "#5B616C" : rej ? "#BE4C3D" : ok ? "#4E9B76" : "#D9A03F" }}>
                    {open ? "טרם הופק" : rej ? "הוחזר לתיקון" : ok ? "מאושר לפרסום" : "ממתין לאישורך"}</span>
                </div>);
            })}
          </div>))}
      </div>
    </>
  );
}
