import React from "react";
import { SHOTS, ARCHIVED, ARCHIVE_NOTE, coverage, missingShots } from "../data/identitySheet.js";
import { BIBLE } from "../data/bible.js";
import { Kpi } from "./ui.jsx";

export default function IdentitySheet() {
  const { have, need, pct } = coverage();
  const missing = missingShots();
  const toShoot = missing.reduce((a, s) => a + s.gap, 0);
  const archivedBy = Object.fromEntries(ARCHIVED.map((a) => [a.shot, a]));
  return (
    <>
      <p className="note">
        המדריך אומר שהטעות הגדולה היא להתחיל מפרומפט של תמונה. לכן זה החדר השני אחרי הביבליה: ספריית רפרנסים
        שכל תמונה וכל וידאו נבדקים מולה. בדיקת ה־QA "נבדק מול רפרנס קיים" היא חוסם — אין רפרנס, אין אישור.
      </p>
      <div className="grid g4" style={{ marginBottom: 14 }}>
        <Kpi lbl="כיסוי רפרנסים" val={`${pct}%`} sub={`${have} מתוך ${need} זוויות`} tone={pct > 70 ? "up" : "down"} />
        <Kpi lbl="זוויות חסרות לגמרי" val={SHOTS.filter((s) => s.have === 0).length} sub="חוסמות הפקה" tone="down" />
        <Kpi lbl="רפרנסים לייצור" val={toShoot} sub="רשימת הצילומים בפועל" tone="down" />
        <Kpi lbl="ננעל" val={BIBLE.locked} sub="כל רפרנס ישן ממנו חשוד" />
      </div>
      <div className="grid g2">
        {SHOTS.map((s) => {
          const pct = Math.min((s.have / s.need) * 100, 100);
          const c = s.have === 0 ? "#BE4C3D" : pct >= 100 ? "#4E9B76" : "#D9A03F";
          return (
            <div className="shot" key={s.id}>
              <div className="btop"><span className="bkey">{s.he}</span><span className="mono" style={{ color: c, fontSize: 12 }}>{s.have}/{s.need}</span></div>
              <div className="bval">{s.note}</div>
              <div className="shotbar"><div style={{ height: "100%", width: pct + "%", background: c, borderRadius: 2 }} /></div>
              {archivedBy[s.id] && <div className="hint" style={{ color: "#8C9099", marginTop: 6 }}>
                🗑 {archivedBy[s.id].count} נגנזו ב־{archivedBy[s.id].on} — {archivedBy[s.id].why}</div>}
              {s.have === 0 && <div className="hint" style={{ color: "#CE7C6B", marginTop: 6 }}>⛔ אין רפרנס — כל נכס שיישען על הזווית הזו ייחסם בשער</div>}
            </div>
          );
        })}
      </div>
      <h2>רשימת הצילומים <em>{toShoot} רפרנסים · הפער בין המצב לבין מה שהמערכת דורשת</em></h2>
      <div className="card" style={{ padding: "8px 14px" }}>
        {missing.map((s) => (
          <div className="crow" key={s.id}>
            <span className="dot" style={{ background: s.have === 0 ? "#BE4C3D" : "#D9A03F" }} />
            <span className="ctxt">{s.he}</span>
            <span className="hint">{s.note}</span>
            <span className="mono cpts">×{s.gap}</span>
          </div>))}
      </div>

      <div className="alert warn" style={{ marginTop: 14 }}>
        <span>🗑</span>
        <div><b>מה נגנז.</b> {ARCHIVE_NOTE} סך הכל {ARCHIVED.reduce((a, x) => a + x.count, 0)} רפרנסים
        ב־{ARCHIVED.length} זוויות. הכיסוי ירד כתוצאה מזה — אבל הוא לא באמת ירד, הוא רק הפסיק להיראות
        גבוה ממה שהיה. רפרנס stale נכשל בבדיקה גם קודם, הוא פשוט נספר ככיסוי חלקי.</div>
      </div>
    </>
  );
}
