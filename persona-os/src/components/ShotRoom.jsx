import React, { useState, useMemo } from "react";
import { MOVES, CAM_GROUPS, SLOTS, FIT } from "../data/camera.js";
import { CAPS, coverGaps, longestVideo, CATALOGUE_READ } from "../data/engines.js";
import { SYMBOLS } from "../data/bible.js";
import { buildShot, LOCATIONS, LIGHTS, OUTFITS } from "../lib/shot.js";
import { Alert } from "./ui.jsx";

/**
 * Shot Room. Picks a camera move, then reports what would stop the shot:
 * a missing reference angle, an engine that cannot carry it, or a move that
 * contradicts the bible. The prompt is assembled, never typed.
 */
export default function ShotRoom() {
  const [moveId, setMoveId] = useState("slowzoom");
  const [location, setLocation] = useState("corridor");
  const [light, setLight] = useState("night");
  const [outfit, setOutfit] = useState("w3");
  const [symbolId, setSymbolId] = useState("env");
  const [speaks, setSpeaks] = useState(false);
  const [multiShot, setMultiShot] = useState(false);
  const [seconds, setSeconds] = useState(8);
  const [showAll, setShowAll] = useState(false);

  const shot = useMemo(
    () => buildShot({ moveId, location, light, outfit, symbolId, speaks, multiShot, seconds }),
    [moveId, location, light, outfit, symbolId, speaks, multiShot, seconds]
  );
  const eligible = shot.engines.filter((e) => e.eligible);
  const visible = showAll ? MOVES : MOVES.filter((m) => m.fit !== "off");

  return (
    <>
      <p className="note">
        פרומפט מצלמה נכשל כשהוא משאיר החלטה למודל. שש המשבצות הן ההחלטות האלה. בחר תנועה — המערכת
        מרכיבה את הפרומפט מהביבליה, בודקת אילו זוויות רפרנס התנועה דורשת, ואומרת לך אילו מנועים
        מסוגלים לשאת אותה. היא לא בוחרת מנוע. זו החלטה פתוחה.
      </p>

      <h2>תנועת מצלמה <em>{showAll ? `כל ${MOVES.length} התנועות` : `${visible.length} תנועות שתואמות את הביבליה, מתוך ${MOVES.length}`}</em>
        <button className="btn sm" style={{ marginInlineStart: "auto" }} onClick={() => setShowAll(!showAll)}>
          {showAll ? "הסתר תנועות שסותרות את הביבליה" : "הצג גם תנועות שסותרות את הביבליה"}
        </button>
      </h2>
      <div className="selrow">
        {visible.map((m) => (
          <button key={m.id} className={"sbtn " + (moveId === m.id ? "on" : "")} onClick={() => setMoveId(m.id)}
            style={m.fit === "off" ? { borderColor: "rgba(190,76,61,.4)", color: "#CE7C6B" } : {}}>
            {m.he}
          </button>))}
      </div>

      <div className="card" style={{ padding: "12px 14px", marginBottom: 14 }}>
        <div className="btop">
          <span className="bkey" style={{ fontSize: 14 }}>{shot.move.he} <span style={{ color: "#5B616C", fontWeight: 400 }}>· {shot.move.en}</span></span>
          <span className={"tag " + FIT[shot.move.fit].tone}
            style={shot.move.fit === "off" ? { color: "#CE7C6B", borderColor: "rgba(190,76,61,.4)" }
                 : shot.move.fit === "core" ? { color: "#4E9B76", borderColor: "#4E9B7655" } : {}}>
            {FIT[shot.move.fit].he}</span>
          <span className="src">{shot.move.src}</span>
        </div>
        <div className="bval"><b>איך המודל שובר את זה:</b> {shot.move.note}</div>
      </div>

      {shot.move.fit === "off" && (
        <Alert kind="bad" icon="⛔">
          <b>התנועה הזו סותרת את הביבליה.</b> הסעיף שקובע: {shot.move.src}. אפשר להפיק אותה, אבל זה
          שינוי אופי — הדרך הנכונה היא ניסוי במעבדה שמייצר הצעת תיקון, לא החלטה כאן.
        </Alert>
      )}

      <h2>הסצנה</h2>
      <div className="grid g2">
        <div className="card" style={{ padding: "10px 14px" }}>
          {[["מיקום", location, setLocation, LOCATIONS],
            ["תאורה", light, setLight, LIGHTS],
            ["לבוש", outfit, setOutfit, OUTFITS]].map(([he, val, set, list]) => (
            <div className="crow" key={he}>
              <span className="ctxt" style={{ flex: "0 0 60px" }}>{he}</span>
              <div className="selrow" style={{ margin: 0, flex: 1 }}>
                {list.map((o) => (
                  <button key={o.id} className={"sbtn " + (val === o.id ? "on" : "")} onClick={() => set(o.id)}>{o.he}</button>))}
              </div>
            </div>))}
        </div>
        <div className="card" style={{ padding: "10px 14px" }}>
          <div className="crow">
            <span className="ctxt" style={{ flex: "0 0 60px" }}>רמז</span>
            <div className="selrow" style={{ margin: 0, flex: 1 }}>
              {SYMBOLS.map((s) => (
                <button key={s.id} className={"sbtn " + (symbolId === s.id ? "on" : "")} onClick={() => setSymbolId(s.id)}
                  title={`הופיע לפני ${s.last} ימים · צינון ${s.cool}`}
                  style={s.last < s.cool ? { color: "#D9A03F", borderColor: "rgba(217,160,63,.35)" } : {}}>
                  {s.he}</button>))}
            </div>
          </div>
          {shot.sym.last < shot.sym.cool && (
            <div className="hint" style={{ color: "#D9A03F", marginTop: 6 }}>
              ⚠ הסמל הופיע לפני {shot.sym.last} ימים והצינון הוא {shot.sym.cool}. הביבליה קובעת רמז אחד בכל פעם — שרוף אותו ותאבד אותו.
            </div>)}
          <div className="crow" style={{ marginTop: 8 }}>
            <span className="ctxt" style={{ flex: "0 0 60px" }}>אורך</span>
            <div className="selrow" style={{ margin: 0, flex: 1 }}>
              {[5, 8, 12, 15].map((n) => (
                <button key={n} className={"sbtn " + (seconds === n ? "on" : "")} onClick={() => setSeconds(n)}>{n}s</button>))}
            </div>
          </div>
          <div className="crow">
            <span className="ctxt" style={{ flex: "0 0 60px" }}>דורש</span>
            <div className="selrow" style={{ margin: 0, flex: 1 }}>
              <button className={"sbtn " + (speaks ? "on" : "")} onClick={() => setSpeaks(!speaks)}>דיבור בפריים</button>
              <button className={"sbtn " + (multiShot ? "on" : "")} onClick={() => setMultiShot(!multiShot)}>כמה חיתוכי מצלמה</button>
            </div>
          </div>
        </div>
      </div>

      <h2>זוויות רפרנס שהתנועה דורשת <em>בדיקת ה־ref היא חוסם קשיח</em></h2>
      <div className="card" style={{ padding: "8px 14px" }}>
        {shot.angles.map((a) => (
          <div className="crow" key={a.id}>
            <span className="dot" style={{ background: a.ok ? (a.warn ? "#D9A03F" : "#4E9B76") : "#BE4C3D" }} />
            <span className={"ctxt " + (a.ok ? "" : "off")}>{a.he}</span>
            <span className="hint">{a.reason || a.warn || "מכוסה"}</span>
            <span className="mono cpts">{a.have ?? 0}/{a.need ?? "?"}</span>
          </div>))}
        {shot.blocked.length > 0 && (
          <Alert kind="bad" icon="⛔">
            <b>השוט הזה ייחסם בשער.</b> {shot.blocked.map((b) => b.he).join(" · ")} — {shot.blocked[0].reason}.
            תנועה שמסובבת את הפנים בלי כיסוי פרופיל מאלצת את המודל להמציא פנים, וזה בדיוק מה שנעילת הזהות אוסרת.
          </Alert>)}
      </div>

      <h2>מנועים שמסוגלים לשאת את השוט <em>{shot.engines.length} מנועי וידאו · נקרא מהקטלוג ב־{CATALOGUE_READ} · המערכת לא בוחרת</em></h2>
      <div className="card" style={{ padding: "8px 14px" }}>
        <div className="tags" style={{ marginBottom: 6 }}>
          {shot.needs.map((n) => (<span className="tag" key={n} title={CAPS[n].why}>{CAPS[n].he}</span>))}
        </div>
        {shot.engines.map((e) => (
          <div className="crow" key={e.id}>
            <span className="dot" style={{ background: e.eligible ? "#4E9B76" : "#BE4C3D" }} />
            <span className={"ctxt " + (e.eligible ? "" : "off")}>{e.name}</span>
            {e.lock && <span className="src" style={e.lock.includes("אסור") ? { color: "#CE7C6B", borderColor: "rgba(190,76,61,.4)" } : undefined}>{e.lock.replace(/\*\*/g, "")}</span>}
            <span className="hint">{e.eligible ? "תומך בכל מה שהשוט דורש" : "חסר: " + e.missing.map((c) => CAPS[c].he).join(", ")}</span>
          </div>))}
        {eligible.length === 0 && (() => {
          const closest = shot.engines[0];
          const gaps = coverGaps(closest.missing);
          const rescued = gaps.filter((g) => g.covered);
          const stuck = gaps.filter((g) => !g.covered);
          return (
            <Alert kind="warn" icon="⚠">
              <b>אף מנוע וידאו לא מכסה את הכל בגנרציה אחת.</b> הכי קרוב: {closest.name}.
              {rescued.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  ניתן להשלים במעבר שני: {rescued.map((g) => `${CAPS[g.cap].he} → ${g.by.map((e) => e.name).join(" / ")}`).join(" · ")}
                </div>)}
              {stuck.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  אין השלמה ל־{stuck.map((g) => CAPS[g.cap].he).join(", ")} — פצל לשני שוטים או ותר על הדרישה.
                </div>)}
              {seconds > (longestVideo().maxSec ?? 0) && (
                <div style={{ marginTop: 6 }}>הארוך ביותר הוא {longestVideo().name} ב־{longestVideo().maxSec} שניות.</div>)}
            </Alert>);
        })()}
      </div>

      <h2>שש המשבצות</h2>
      <div className="card" style={{ padding: "8px 14px" }}>
        {SLOTS.map((s) => (
          <div className="brule" key={s.key}>
            <div className="btop"><span className="bkey">{s.he}</span><span className="src">{s.note}</span></div>
            <div className="bval" style={{ direction: "ltr", textAlign: "left" }}>{shot.slots[s.key]}</div>
          </div>))}
      </div>

      <h2>הפרומפט</h2>
      <div className="card" style={{ padding: "12px 15px" }}>
        <div className="cap" style={{ marginTop: 0 }}>{shot.prompt}</div>
        <div className="hint" style={{ marginTop: 8 }}>
          נבנה מהביבליה — שורת הזהות, הלבוש והרמז מוזרקים, לא נכתבים. אי אפשר לשלוח מכאן פרומפט שסותר את הדמות.
        </div>
      </div>
    </>
  );
}
