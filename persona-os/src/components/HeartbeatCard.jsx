import React from "react";
import { agentIdOf } from "../lib/agents.js";
import { latestReports } from "../lib/heartbeat.js";

/**
 * Read-only view of the latest heartbeat report. Reports are written by
 * `npm run agents:heartbeat` and bundled at build time; there are no action
 * buttons here by design — the heartbeat reports, the operator decides.
 */
const REPORTS = latestReports(
  import.meta.glob("../../agents/personas/*/reports/*.md", { query: "?raw", import: "default", eager: true })
);

export default function HeartbeatCard({ personaId }) {
  const r = REPORTS[agentIdOf(personaId)];
  const alerting = r?.status === "ALERT" && r.alerts.length > 0;
  return (
    <>
      <h2>Heartbeat <em>{r ? `דוח אחרון · ${r.date}` : "אין דוח"}</em>
        {r?.source === "seed" && (
          <span className="tag" style={{ color: "#D9A03F", borderColor: "#D9A03F55" }}>נתוני seed</span>)}
      </h2>
      <div className="card" style={{ padding: "10px 14px" }}>
        {!alerting ? (
          <div className="alert ok" style={{ marginTop: 0 }}><span>●</span><div>
            <b>SILENT – אין התראות</b>
            {!r && <div style={{ color: "#8C9099" }}>לא נמצא דוח. הרץ npm run agents:export ואז npm run agents:heartbeat.</div>}
          </div></div>
        ) : (
          <div className="alert warn" style={{ marginTop: 0 }}><span>⚠</span><div>
            <b>{r.alerts.length} התראות</b>
            <div style={{ marginTop: 4 }}>{r.alerts.map((a) => {
              const [, key, text] = a.match(/^\[([\w]+)\]\s*(.*)$/) ?? [null, null, a];
              return (
                <div key={a} style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                  {key && <span className="mono tag" style={{ color: "inherit" }}>{key}</span>}
                  <span>{text}</span>
                </div>);
            })}</div>
          </div></div>
        )}
        {r?.info.length > 0 && (
          <div style={{ marginTop: 8, fontSize: 12, color: "#8C9099", lineHeight: 1.7 }}>
            {r.info.map((i) => <div key={i}>{i}</div>)}
          </div>)}
        {r?.skipped.length > 0 && (
          <div style={{ marginTop: 6, fontSize: 11, color: "#5B616C" }}>
            {r.skipped.length} בדיקות דולגו — חסרים נתונים או ספים: {r.skipped.map((s) => s.split(":")[0]).join(", ")}
          </div>)}
      </div>
    </>
  );
}
