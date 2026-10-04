import React from "react";
import { BIBLE } from "../data/bible.js";
import { groupStats } from "../data/rubric.js";

export default function Bible() {
  const look = groupStats("identity");
  return (
    <>
      <p className="note">זה מה שהמערכת קוראת לפני כל החלטה. כל שורה מזינה משהו: בדיקה בשער, מכסה במנוע ההמלצות, קצב בעלילה או שדה בתבנית הפרומפט. התגית הזהובה ליד כל בדיקה מצביעה חזרה על הסעיף שילד אותה.</p>
      <div className="quote">{BIBLE.line}</div>

      <h2>זהות <em>ננעל {BIBLE.locked}</em></h2>
      <div className="card">{BIBLE.identity.map(([k, v, u]) => (
        <div className="brule" key={k}><div className="btop"><span className="bkey">{k}</span><span className="src">{u}</span></div><div className="bval">{v}</div></div>))}</div>

      <h2>מראה קבוע <em>{look.checks} בדיקות · {look.max} נקודות · {look.blockers} חוסם קשיח</em></h2>
      <div className="card">{BIBLE.look.map(([k, v]) => (
        <div className="brule" key={k}><div className="bkey">{k}</div><div className="bval">{v}</div></div>))}</div>

      <h2>פלטה ולבוש</h2>
      <div className="grid g2">
        <div className="card" style={{ padding: 14 }}>
          <h3>צבעי המותג</h3>
          {BIBLE.palette.map(([hex, he]) => (
            <div key={hex} style={{ fontSize: 12.5, padding: "4px 0" }}>
              <span className="swatch" style={{ background: hex }} />{he}{" "}
              <span className="mono" style={{ color: "#5B616C", fontSize: 11 }}>{hex}</span>
            </div>))}
          <div className="bval" style={{ marginTop: 8 }}>צבעים חזקים או ניאוניים אינם חלק מהזהות.</div>
        </div>
        <div className="card" style={{ padding: 14 }}>
          <h3>לבוש לפי שעה</h3>
          {BIBLE.wardrobe.map(([k, v]) => (
            <div key={k} style={{ fontSize: 12.5, padding: "4px 0" }}><b>{k}:</b> <span style={{ color: "#8C9099" }}>{v}</span></div>))}
        </div>
      </div>

      <h2>קול ודיבור</h2>
      <div className="grid g2">
        <div className="card" style={{ padding: 14 }}><h3>כללים</h3>
          {BIBLE.voice.rules.map((r) => (<div key={r} style={{ fontSize: 12.5, color: "#8C9099", padding: "3px 0" }}>· {r}</div>))}</div>
        <div className="card" style={{ padding: 14 }}><h3>דוגמאות מאושרות</h3>
          {BIBLE.voice.samples.map((s) => (<div className="cap" key={s} style={{ marginTop: 6 }}>{s}</div>))}</div>
      </div>

      <h2>מה Romy לעולם לא עושה</h2>
      <div className="card" style={{ padding: "12px 14px" }}>
        {BIBLE.never.map((n) => (<div key={n} style={{ fontSize: 12.5, color: "#CE7C6B", padding: "3px 0" }}>✕ {n}</div>))}</div>

      <h2>כללי עלילה</h2>
      <div className="card" style={{ padding: "12px 14px" }}>
        {BIBLE.plot.map((n) => (<div key={n} style={{ fontSize: 12.5, color: "#8C9099", padding: "3px 0" }}>· {n}</div>))}</div>
    </>
  );
}
