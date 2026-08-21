import React from "react";
import { SHOTS, STALE_NOTE } from "../data/identitySheet.js";
import { BIBLE } from "../data/bible.js";
import { Kpi } from "./ui.jsx";

export default function IdentitySheet() {
  const have = SHOTS.reduce((a, s) => a + Math.min(s.have, s.need), 0);
  const need = SHOTS.reduce((a, s) => a + s.need, 0);
  const stale = SHOTS.filter((s) => s.stale);
  return (
    <>
      <p className="note">
        המדריך אומר שהטעות הגדולה היא להתחיל מפרומפט של תמונה. לכן זה החדר השני אחרי הביבליה: ספריית רפרנסים
        שכל תמונה וכל וידאו נבדקים מולה. בדיקת ה־QA "נבדק מול רפרנס קיים" היא חוסם — אין רפרנס, אין אישור.
      </p>
      <div className="grid g4" style={{ marginBottom: 14 }}>
        <Kpi lbl="כיסוי רפרנסים" val={`${Math.round((have / need) * 100)}%`} sub={`${have} מתוך ${need} זוויות`} tone={have / need > 0.7 ? "up" : "down"} />
        <Kpi lbl="זוויות חסרות לגמרי" val={SHOTS.filter((s) => s.have === 0).length} sub="חוסמות הפקה" tone="down" />
        <Kpi lbl="רפרנסים לרענון" val={stale.length} sub="נוצרו לפני נעילת הביבליה" tone="down" />
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
              {s.stale && <div className="hint" style={{ color: "#D9A03F", marginTop: 6 }}>⚠ {STALE_NOTE}</div>}
              {s.have === 0 && <div className="hint" style={{ color: "#CE7C6B", marginTop: 6 }}>⛔ אין רפרנס — כל נכס שיישען על הזווית הזו ייחסם בשער</div>}
            </div>
          );
        })}
      </div>
      <div className="alert warn" style={{ marginTop: 14 }}>
        <span>⚠</span>
        <div><b>שים לב לפער אמיתי.</b> הרפרנסים ל־Full Body ול־Locations נוצרו כשהדמות עוד הייתה שחקנית פוקר.
        הביבליה מ־21.8 שינתה עולם, לבוש ופלטה — אז הם לא תקפים לבדיקת פרופורציות ולא לבדיקת המשכיות מיקום.
        זה מה שחוסם את פריט היוגה בתור.</div>
      </div>
    </>
  );
}
