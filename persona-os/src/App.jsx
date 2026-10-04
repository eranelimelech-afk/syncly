import React, { useState, useMemo, useEffect } from "react";
import { PERSONAS } from "./data/bible.js";
import { QUEUE } from "./data/queue.js";
import { ALL_ITEMS, RUBRIC, BLOCKERS } from "./data/rubric.js";
import { EXPERIMENTS } from "./data/experiments.js";
import { loadPosts, SOURCES } from "./lib/sources/index.js";
import { store } from "./lib/store/index.js";
import { initChecks } from "./lib/scoring.js";

import Bible from "./components/Bible.jsx";
import IdentitySheet from "./components/IdentitySheet.jsx";
import ControlRoom from "./components/ControlRoom.jsx";
import GateCard from "./components/GateCard.jsx";
import HookLab from "./components/HookLab.jsx";
import Recommend from "./components/Recommend.jsx";
import PromptStudio from "./components/PromptStudio.jsx";
import Schedule from "./components/Schedule.jsx";
import Performance from "./components/Performance.jsx";
import LiftView from "./components/LiftView.jsx";
import ShotRoom from "./components/ShotRoom.jsx";
import Pipeline from "./components/Pipeline.jsx";

const TABS = [
  { id: "bible", he: "ביבליה" },
  { id: "ref", he: "גיליון זהות" },
  { id: "room", he: "מרכז בקרה" },
  { id: "gate", he: "שער אישורים", counter: "pending" },
  { id: "lab", he: "מעבדת ניסויים", counter: "amends" },
  { id: "next", he: "המלצות המשך" },
  { id: "prompts", he: "תבניות פרומפט" },
  { id: "shot", he: "חדר צילום" },
  { id: "pipe", he: "צנרת הפקה" },
  { id: "plan", he: "לוח פרסום" },
  { id: "perf", he: "ביצועים" },
  { id: "work", he: "מה עובד" },
];

/** Tabs that require a locked bible. Only Romy Vane has one today. */
/**
 * Which source feeds the app. Stays "seeded" until an account is connected —
 * "live" needs the backend route and the local record store. docs/INSTAGRAM.md.
 */
const SOURCE = "seeded";

const BIBLE_ONLY = ["bible", "ref", "prompts", "lab", "shot"];

export default function App() {
  const [persona, setPersona] = useState("vane");
  const [tab, setTab] = useState("bible");
  const [expanded, setExpanded] = useState("q1");
  // Gate decisions and amendment rulings are persisted — they were being lost on
  // every refresh, and they are the record of what a human actually approved.
  const [amend, setAmend] = useState(() => store.get().amendments);
  const [qa, setQa] = useState(() => {
    const saved = store.get().qa;
    const s = {};
    QUEUE.forEach((q) => (s[q.id] = saved[q.id] ?? { checks: initChecks(q.fails), decision: null }));
    return s;
  });

  // Posts now come through the source layer, so the seam that will carry real
  // Instagram data is the same one the generator runs through. docs/INSTAGRAM.md.
  const [feed, setFeed] = useState({ posts: [], notes: [], loading: true, error: null });
  useEffect(() => {
    let cancelled = false;
    setFeed((f) => ({ ...f, loading: true }));
    loadPosts({ source: SOURCE, persona })
      .then((r) => !cancelled && setFeed({ ...r, loading: false, error: null }))
      .catch((e) => !cancelled && setFeed({ posts: [], notes: [], loading: false, error: e.message }));
    return () => { cancelled = true; };
  }, [persona]);
  const posts = feed.posts;
  const queue = QUEUE.filter((q) => q.persona === persona);
  const pending = queue.filter((q) => !qa[q.id].decision).length;
  const p = PERSONAS.find((x) => x.id === persona);
  const openAmends = EXPERIMENTS.filter((e) => e.amend && !e.amendState && !amend[e.id]).length;

  const totals = useMemo(() => {
    const t = posts.reduce((a, x) => ({
      reach: a.reach + x.reach, shares: a.shares + x.shares, follows: a.follows + x.follows,
      visits: a.visits + x.visits, subs: a.subs + x.subs, qa: a.qa + x.qa,
    }), { reach: 0, shares: 0, follows: 0, visits: 0, subs: 0, qa: 0 });
    return { ...t, qaAvg: posts.length ? Math.round(t.qa / posts.length) : 0 };
  }, [posts]);

  const persistQa = (next) => { store.setQa(next); return next; };
  const toggle = (qid, item) =>
    setQa((s) => persistQa({ ...s, [qid]: { ...s[qid], checks: { ...s[qid].checks, [item]: !s[qid].checks[item] } } }));
  const decide = (qid, d) => setQa((s) => persistQa({ ...s, [qid]: { ...s[qid], decision: d } }));
  const approvedMap = Object.fromEntries(Object.entries(qa).map(([k, v]) => [k, v.decision]));
  const counters = { pending, amends: openAmends };

  return (
    <div>
      <div className="top">
        <div className="topin">
          <div className="brand"><b>PersonaOS</b><span>BIBLE-LOCKED PUBLISHING</span></div>
          <div className="psel">
            <button className="pchip" title={`נשמר ב־${store.driverName}`}
              onClick={() => { if (confirm("לאפס את כל ההחלטות והאישורים השמורים?")) { store.reset(); location.reload(); } }}>
              איפוס החלטות
            </button>
            {PERSONAS.map((x) => (
              <button key={x.id} className={"pchip " + (persona === x.id ? "on" : "")} onClick={() => setPersona(x.id)}>
                <span className="dot" style={{ background: x.color }} />{x.name}
              </button>))}
          </div>
        </div>
        <div className="wrap" style={{ paddingBottom: 0 }}>
          <div className="nav">
            {TABS.map((t) => {
              const c = t.counter ? counters[t.counter] : 0;
              return (
                <button key={t.id} className={"navb " + (tab === t.id ? "on" : "")} onClick={() => setTab(t.id)}>
                  {t.he}{c ? <span className="cnt">{c}</span> : null}
                </button>);
            })}
          </div>
        </div>
      </div>

      <div className="wrap">
        {feed.loading ? (
          <div className="card empty" style={{ marginTop: 20 }}>טוען נתונים…</div>
        ) : feed.error ? (
          <div className="card empty" style={{ marginTop: 20, color: "#CE7C6B" }}>
            נכשלה טעינת הנתונים: {feed.error}
          </div>
        ) : persona !== "vane" && BIBLE_ONLY.includes(tab) ? (
          <div className="card empty" style={{ marginTop: 20 }}>
            אין ביבליה נעולה עבור {p.name}. נעל אותה כדי שהשער, גיליון הזהות ותבניות הפרומפט יוכלו לעבוד.
          </div>
        ) : (
          <>
            {tab === "bible" && (<><h2 style={{ marginTop: 20 }}>{p.name} — Character Bible <em>{p.lane}</em></h2><Bible /></>)}
            {tab === "ref" && (<><h2 style={{ marginTop: 20 }}>גיליון זהות <em>ספריית הרפרנסים שכל נכס נבדק מולה</em></h2><IdentitySheet /></>)}
            {tab === "lab" && (<><h2 style={{ marginTop: 20 }}>מעבדת ניסויים <em>השערה · משתנה אחד · מדד הכרעה מראש</em></h2>
              <HookLab amend={amend} onAmend={(id, v) => { store.setAmendment(id, v); setAmend((s) => ({ ...s, [id]: v })); }} /></>)}
            {tab === "prompts" && (<><h2 style={{ marginTop: 20 }}>תבניות פרומפט <em>נבנות מהביבליה, לא נכתבות ביד</em></h2><PromptStudio /></>)}
            {tab === "shot" && (<><h2 style={{ marginTop: 20 }}>חדר צילום <em>תנועת מצלמה · זוויות רפרנס · מנוע</em></h2><ShotRoom /></>)}
            {tab === "pipe" && (<><h2 style={{ marginTop: 20 }}>צנרת הפקה <em>שישה שלבים · תנאי יציאה לכל שלב</em></h2><Pipeline queue={queue} qa={qa} /></>)}

            {tab === "room" && (
              <ControlRoom persona={p} posts={posts} queue={queue} qa={qa} totals={totals} openAmends={openAmends}
                source={SOURCES[SOURCE]} notes={feed.notes}
                onOpenItem={(id) => { setTab("gate"); setExpanded(id); }} onOpenLab={() => setTab("lab")} />)}

            {tab === "gate" && (<>
              <h2 style={{ marginTop: 20 }}>שער אישורים <em>{ALL_ITEMS.length} בדיקות · {RUBRIC.length} קטגוריות · {BLOCKERS.length} חוסמים קשיחים</em></h2>
              <p className="note">שום דבר לא מתפרסם לפני שאתה לוחץ אשר. הציון הוא המלצה; החוסמים הם החלטה — כשאחד דולק, כפתור האישור נעול גם אם הציון גבוה.</p>
              {queue.map((q) => (
                <GateCard key={q.id} item={q} state={qa[q.id]} expanded={expanded === q.id}
                  onExpand={() => setExpanded(expanded === q.id ? null : q.id)}
                  onToggle={(i) => toggle(q.id, i)}
                  onApprove={() => decide(q.id, "approved")}
                  onReject={() => decide(q.id, "rejected")} />))}
              {queue.length === 0 && <div className="card empty">אין פריטים בתור עבור {p.name}.</div>}
            </>)}

            {tab === "next" && (<><h2 style={{ marginTop: 20 }}>המלצות המשך</h2><Recommend posts={posts} onQueue={() => setTab("gate")} /></>)}
            {tab === "plan" && (<><h2 style={{ marginTop: 20 }}>לוח פרסום</h2><Schedule approved={approvedMap} /></>)}
            {tab === "perf" && (<><h2 style={{ marginTop: 20 }}>ביצועים לפי פוסט</h2><Performance posts={posts} /></>)}
            {tab === "work" && (<><h2 style={{ marginTop: 20 }}>מה עובד ומה לא</h2><LiftView posts={posts} /></>)}
          </>
        )}
      </div>
    </div>
  );
}
