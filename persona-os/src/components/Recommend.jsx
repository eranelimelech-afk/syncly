import React, { useMemo } from "react";
import { WORLD, PURPOSE, FORMAT, HOOK, SLOT, MODE } from "../data/dimensions.js";
import { LADDER } from "../data/bible.js";
import { recommend } from "../lib/recommend.js";

export default function Recommend({ posts, onQueue }) {
  const e = useMemo(() => recommend(posts), [posts]);
  return (
    <>
      <p className="note">המנוע מצליב ארבעה דברים: המכסה בביבליה מול מה שפורסם, חלוקת חמש המטרות, ביצועי העבר של כל ערך, וזמן הצינון של הסמלים. הקריטריון הוא עוקבים חדשים ל־1,000 חשיפות.</p>

      <h2>חלוקת מטרות <em>×ביצועים מול ממוצע הדמות</em></h2>
      <div className="card" style={{ padding: "10px 14px" }}>
        {e.purposes.map((p) => (
          <div className="quota" key={p.k}>
            <div className="qname">{p.he}</div>
            <div className="qtrack"><div style={{ position: "absolute", top: 0, bottom: 0, insetInlineStart: 0,
              width: Math.min(p.actual * 250, 100) + "%", borderRadius: 4,
              background: p.perf >= 1 ? "rgba(78,155,118,.45)" : "rgba(190,76,61,.4)" }} /></div>
            <div className="mono" style={{ width: 42, textAlign: "left", fontSize: 11.5, color: "#8C9099" }}>{(p.actual * 100).toFixed(0)}%</div>
            <div className={"mono " + (p.perf >= 1 ? "up" : "down")} style={{ width: 46, textAlign: "left", fontSize: 11.5 }}>×{p.perf.toFixed(2)}</div>
          </div>))}
        <div className="alert warn" style={{ marginTop: 8 }}><span>⚠</span><div>
          Lifestyle הוא הנפח הגדול ביותר ומייצר הכי מעט עוקבים. הביבליה מקצה לו רוב מוחלט מהתוכן — זה הפער
          המבני הכי גדול בין הביבליה למה שעובד בפועל. ראה docs/DECISIONS.md סעיף 2.</div></div>
      </div>

      <h2>פער מול המכסה <em>הקו הלבן הוא היעד</em></h2>
      <div className="card" style={{ padding: "10px 14px" }}>
        {e.worlds.map((w) => (
          <div className="quota" key={w.w}>
            <div className="qname">{w.he}</div>
            <div className="qtrack">
              <div style={{ position: "absolute", top: 0, bottom: 0, insetInlineStart: 0, borderRadius: 4,
                width: Math.min(w.actual * 250, 100) + "%",
                background: w.deficit > 0.03 ? "rgba(217,160,63,.5)" : "rgba(78,155,118,.45)" }} />
              <div className="qtarget" style={{ insetInlineStart: Math.min(w.target * 250, 100) + "%" }} />
            </div>
            <div className="mono" style={{ width: 90, textAlign: "left", fontSize: 11.5, color: "#8C9099" }}>{(w.actual * 100).toFixed(0)}% / {(w.target * 100).toFixed(0)}%</div>
            <div className={"mono " + (w.perf >= 1 ? "up" : "down")} style={{ width: 46, textAlign: "left", fontSize: 11.5 }}>×{w.perf.toFixed(2)}</div>
          </div>))}
      </div>

      <h2>שבעת הפוסטים הבאים <em>מומלץ · טרם הופק · טרם אושר</em></h2>
      <div className="card">
        {e.plan.map((r) => (
          <div className="rec" key={r.i}>
            <div className="rnum">{r.i}</div>
            <div className="rbody">
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>{r.he}{r.isPlot && r.ep ? ` — פרק ${r.ep.n}: ${r.ep.he}` : ""}</div>
              <div className="tags">
                <span className="tag" style={{ color: "#B99A5B", borderColor: "#B99A5B55" }}>{PURPOSE[r.purpose].he}</span>
                <span className="tag">{FORMAT[r.format].he}</span>
                <span className="tag">{SLOT[r.slot].he}</span>
                <span className="tag">{MODE[r.mode].he}</span>
                <span className="tag">{HOOK[r.hook].he}</span>
                <span className="tag">רמז: {r.sym.he}</span>
              </div>
              <div className="cap">{r.line}</div>
              <div className="rwhy">
                למה זה: {r.deficit > 0 ? `פיגור של ${(r.deficit * 100).toFixed(0)} נקודות אחוז מול המכסה` : "העולם במכסה"} ·
                ביצועי עבר ×{r.perf.toFixed(2)} · הסמל לא הופיע {r.sym.last} ימים (צינון {r.sym.cool}) ·
                מכפיל צפוי ×{r.lift.toFixed(2)} על עוקבים חדשים
              </div>
            </div>
          </div>))}
      </div>
      <div className="acts" style={{ border: 0, paddingInline: 0 }}>
        <button className="btn" onClick={onQueue}>שלח את השבעה לצנרת ההפקה</button>
        <span className="hint">גם המלצות עוברות את אותו שער. אין קיצור דרך.</span>
      </div>

      <h2>עלילת Room 707 <em>5% מהתוכן · פרט אחד לפרק</em></h2>
      <div className="card" style={{ padding: "12px 14px" }}>
        {!e.nextEp && <div className="alert gold"><span>◈</span><div>כל פרקי הסולם פורסמו. הביבליה לא מייצרת פרקים מעצמה — הוסף פרקים ל־LADDER כדי להמשיך את העלילה.</div></div>}
        {LADDER.map((l) => (
          <div className="crow" key={l.n}>
            <span className="dot" style={{ background: l.done ? "#4E9B76" : l.n === e.nextEp?.n ? "#B99A5B" : "#3A3F47" }} />
            <span className="ctxt" style={{ color: l.done ? "#5B616C" : "#EBE6DC" }}>פרק {l.n} — {l.he}</span>
            <span className="hint">{l.done ? "פורסם" : l.n === e.nextEp?.n ? "הבא בתור" : "נעול"}</span>
          </div>))}
        <div className="alert gold" style={{ marginTop: 12 }}><span>◈</span><div>
          העלילה היא 5% מהתוכן ומייצרת ×{WORLD.room707.follow.toFixed(1)} עוקבים חדשים לכל חשיפה. זה הפער
          הכי גדול במערכת — ולכן הביבליה אוסרת לשרוף אותו כל יום.</div></div>
      </div>
    </>
  );
}
