import React from "react";
import { RUBRIC, ALL_ITEMS, GATE_TEXT } from "../data/rubric.js";
import { WORLD, PURPOSE } from "../data/dimensions.js";
import { PERSONAS } from "../data/bible.js";
import { STAGES } from "../data/queue.js";
import { scoreOf } from "../lib/scoring.js";
import { SegBar } from "./ui.jsx";

export default function GateCard({ item, state, onToggle, onApprove, onReject, expanded, onExpand }) {
  const p = PERSONAS.find((x) => x.id === item.persona);
  const s = scoreOf(state.checks);
  const status = state.decision === "approved" ? "approved" : state.decision === "rejected" ? "blocked" : s.status;
  const color = status === "cleared" ? "#4E9B76" : status === "hold" ? "#D9A03F" : status === "approved" ? "#B99A5B" : "#BE4C3D";
  return (
    <div className="card qitem">
      <div className="qhead">
        <div className="thumb" style={{ background: p.tint }}>{item.format === "reel" ? "▶" : item.format === "carousel" ? "❐" : "▣"}</div>
        <div className="qmeta">
          <div className="qtitle">{item.title}</div>
          <div className="tags">
            <span className="tag" style={{ color: p.color, borderColor: p.color + "55" }}>{p.name}</span>
            <span className="tag">{item.channel}</span>
            <span className="tag">{WORLD[item.world].he}</span>
            <span className="tag" style={{ color: "#B99A5B", borderColor: "#B99A5B55" }}>{PURPOSE[item.purpose].he}</span>
            <span className="tag">{item.when}</span>
          </div>
          <div className="cap">{item.caption}</div>
          <div className="hint" style={{ marginTop: 7 }}>שלב בצנרת: {STAGES[item.stage]} · נבדק מול רפרנס <b>{item.refShot}</b></div>
          <SegBar groups={s.groups} />
        </div>
        <div className="total">
          <div className="n" style={{ color }}>{s.total}</div>
          <div className="d">QA / 100</div>
          <div style={{ marginTop: 8 }}><span className={"gate " + status}>{GATE_TEXT[status]}</span></div>
        </div>
      </div>

      {state.decision !== "approved" && (
        <div style={{ padding: "0 15px 12px" }}>
          {s.blockers.length ? (
            <div className="alert bad"><span>⛔</span><div>
              <b>חוסם קשיח מהביבליה — אי אפשר לאשר עד שזה מתוקן.</b><br />
              {s.blockers.map((b) => b.he).join(" · ")}<br />
              <span style={{ opacity: 0.85 }}>{item.notes}</span></div></div>
          ) : s.total < 85 ? (
            <div className="alert warn"><span>⚠</span><div>{item.notes} אפשר לאשר בכל זאת, אבל הפוסט נכנס לתחתית הציונים.</div></div>
          ) : (
            <div className="alert ok"><span>✓</span><div>{item.notes}</div></div>
          )}
        </div>
      )}

      {expanded && (
        <div className="checks">
          {RUBRIC.map((g) => {
            const got = g.items.reduce((a, i) => a + (state.checks[i.id] ? i.pts : 0), 0);
            return (
              <div className="cgroup" key={g.key}>
                <div className="cgtitle"><span>{g.he}</span><span className="mono">{got}/{g.max}</span></div>
                {g.items.map((i) => (
                  <div className="crow" key={i.id}>
                    <button className={"cbox " + (state.checks[i.id] ? "pass" : "fail")} onClick={() => onToggle(i.id)} aria-label={i.he}>
                      {state.checks[i.id] ? "✓" : "✕"}</button>
                    <span className={"ctxt " + (state.checks[i.id] ? "" : "off")}>{i.he}</span>
                    <span className="src">{i.src}</span>
                    {i.blocker && !state.checks[i.id] && <span className="blocker">חוסם</span>}
                    <span className="cpts mono">{state.checks[i.id] ? i.pts : 0}/{i.pts}</span>
                  </div>))}
              </div>);
          })}
        </div>
      )}

      <div className="acts">
        <button className="btn sm" onClick={onExpand}>{expanded ? "סגור בדיקות" : `פתח את ${ALL_ITEMS.length} הבדיקות`}</button>
        {state.decision === "approved" ? <span className="hint">אושר על ידך · נכנס ללוח ל{item.when}</span>
          : state.decision === "rejected" ? <span className="hint">הוחזר לתיקון · לא יפורסם</span>
          : (<>
              <button className="btn go" disabled={s.blockers.length > 0} onClick={onApprove}>אשר ושבץ</button>
              <button className="btn no" onClick={onReject}>החזר לתיקון</button>
              {s.blockers.length > 0 && <span className="hint">האישור נעול עד שכל החוסמים מסומנים כתוקנו</span>}
            </>)}
      </div>
    </div>
  );
}
