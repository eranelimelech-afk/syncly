#!/usr/bin/env node
/**
 * HEARTBEAT — reads a persona's state.json, compares it with the thresholds in
 * heartbeat.json and writes reports/<date>.md. Reports, never acts.
 *
 *   node agents/runtime/heartbeat.mjs all
 *   node agents/runtime/heartbeat.mjs romy-vane [--now 2026-10-03T09:00]
 *
 * Every check is skipped — and listed as skipped — when either its data or its
 * threshold is missing. A field with no source is not an alert, and a
 * threshold that is still an open decision (null) is not a default.
 *
 * Status is SILENT when there are no alerts, ALERT otherwise.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import {
  listPersonas, loadHeartbeatConfig, loadState, loadStateExample, validateState,
  personaDir, DAY_MS, isoDate,
} from "./lib.mjs";

const pct = (x) => `${Math.round(x * 100)}%`;
const days = (ms) => Math.floor(ms / DAY_MS);
const has = (v) => v !== undefined && v !== null;

export function runChecks(state, config, now) {
  const t = config.thresholds ?? {};
  const alerts = [], skipped = [], info = [];
  const skip = (check, why) => skipped.push(`${check}: ${why}`);
  const need = (check, data, ...keys) => {
    if (!has(data)) { skip(check, "אין נתונים ב־state.json"); return false; }
    const missing = keys.filter((k) => !has(t[k]));
    if (missing.length) { skip(check, `סף לא הוגדר (${missing.join(", ")}) — החלטה פתוחה`); return false; }
    return true;
  };

  // 1 · Approval queue size
  const queue = state.approval_queue;
  if (need("queue_size", queue, "queue_max_pending")) {
    info.push(`תור אישורים: ${queue.length} פריטים`);
    if (queue.length > t.queue_max_pending) {
      alerts.push(`[queue_size] ${queue.length} פריטים ממתינים לאישור — מעל הסף (${t.queue_max_pending})`);
    }
  }

  // 2 · Approval queue age — needs created_at on the items
  if (has(queue) && queue.length && queue.every((q) => !has(q.created_at))) {
    skip("queue_age", "לפריטים בתור אין created_at");
  } else if (need("queue_age", queue, "queue_max_age_hours")) {
    const old = queue.filter((q) => has(q.created_at) && now - new Date(q.created_at) > t.queue_max_age_hours * 3600e3);
    if (old.length) {
      alerts.push(`[queue_age] ${old.length} פריטים ממתינים יותר מ־${t.queue_max_age_hours} שעות: ${old.map((q) => q.id).join(", ")}`);
    }
  }

  // 3 · Schedule coverage ahead
  const schedule = state.schedule;
  if (need("schedule_ahead", schedule, "schedule_horizon_days", "schedule_min_items")) {
    const horizon = now.getTime() + t.schedule_horizon_days * DAY_MS;
    const ahead = schedule.filter((s) => { const at = new Date(s.scheduled_at).getTime(); return at >= now && at <= horizon; });
    const filled = ahead.filter((s) => !s.open);
    const open = ahead.filter((s) => s.open);
    info.push(`לו״ז ב־${t.schedule_horizon_days} הימים הקרובים: ${filled.length} משובצים, ${open.length} פנויים`);
    if (filled.length < t.schedule_min_items) {
      alerts.push(`[schedule_ahead] רק ${filled.length} פריטים משובצים ב־${t.schedule_horizon_days} הימים הקרובים — מתחת לסף (${t.schedule_min_items})`);
    }
    if (open.length) alerts.push(`[schedule_open] ${open.length} משבצות פנויות בטווח — לא יתמלאו לבד`);
  }

  // 4 · Gap since the last post
  const posts = state.posts;
  if (has(posts) && posts.length === 0) {
    skip("post_gap", "אין פוסטים");
  } else if (need("post_gap", posts, "post_gap_max_days")) {
    const last = Math.max(...posts.map((p) => new Date(p.published_at).getTime()));
    const gap = days(now - last);
    info.push(`פוסט אחרון: ${isoDate(new Date(last))} (לפני ${gap} ימים)`);
    if (gap > t.post_gap_max_days) {
      alerts.push(`[post_gap] ${gap} ימים בלי פוסט — מעל הסף (${t.post_gap_max_days})`);
    }
  }

  // 5 · Pillar mix vs targets
  const targets = config.pillar_targets ?? {};
  if (!Object.keys(targets).length) {
    skip("pillar_mix", "אין יעדי תמהיל ב־heartbeat.json — החלטה פתוחה");
  } else if (has(posts) && posts.length && need("pillar_mix", posts, "pillar_window_posts", "pillar_drift_max")) {
    const window = [...posts].sort((a, b) => new Date(b.published_at) - new Date(a.published_at)).slice(0, t.pillar_window_posts);
    const counts = {};
    for (const p of window) counts[p.pillar] = (counts[p.pillar] ?? 0) + 1;
    const unknown = Object.keys(counts).filter((k) => !(k in targets));
    if (unknown.length) alerts.push(`[pillar_unknown] pillars שלא מופיעים ב־pillar_targets: ${unknown.join(", ")}`);
    const rows = [];
    for (const [k, target] of Object.entries(targets)) {
      const actual = (counts[k] ?? 0) / window.length;
      rows.push(`${k} ${pct(actual)}/${pct(target)}`);
      if (Math.abs(actual - target) > t.pillar_drift_max) {
        alerts.push(`[pillar_mix] ${k}: ${pct(actual)} בפועל מול יעד ${pct(target)} (סטייה מותרת ${pct(t.pillar_drift_max)}, ${window.length} פוסטים אחרונים)`);
      }
    }
    info.push(`תמהיל (בפועל/יעד): ${rows.join(" · ")}`);
  }

  // 6 · Room 707 cadence — only where posts carry the flag
  if (has(posts) && posts.some((p) => has(p.room707))) {
    if (need("room707", posts, "room707_min_gap_days", "room707_max_gap_days")) {
      const eps = posts.filter((p) => p.room707).map((p) => new Date(p.published_at).getTime()).sort((a, b) => a - b);
      if (!eps.length) {
        alerts.push("[room707] אין אף פרק Room 707 בהיסטוריה");
      } else {
        const tight = eps.slice(1).filter((e, i) => days(e - eps[i]) < t.room707_min_gap_days).length;
        const since = days(now - eps[eps.length - 1]);
        info.push(`Room 707: ${eps.length} פרקים, האחרון לפני ${since} ימים`);
        if (tight) alerts.push(`[room707] ${tight} פרקים צפופים — פחות מ־${t.room707_min_gap_days} ימים מהפרק הקודם`);
        if (since > t.room707_max_gap_days) alerts.push(`[room707] ${since} ימים בלי פרק — מעל הסף (${t.room707_max_gap_days})`);
      }
    }
  } else if (has(t.room707_min_gap_days)) {
    skip("room707", "לפוסטים אין סימון room707");
  }

  // 7 · Unread posts
  if (has(posts) && posts.some((p) => has(p.read))) {
    if (need("unread", posts, "unread_max")) {
      const unread = posts.filter((p) => p.read === false).length;
      if (unread > t.unread_max) alerts.push(`[unread] ${unread} פוסטים שלא נקראו — מעל הסף (${t.unread_max})`);
    }
  } else skip("unread", "לפוסטים אין שדה read");

  // 8 · Experiment share
  if (has(posts) && posts.some((p) => has(p.experiment))) {
    if (need("experiments", posts, "experiment_min_share")) {
      const share = posts.filter((p) => p.experiment).length / posts.length;
      if (share < t.experiment_min_share) alerts.push(`[experiments] ${pct(share)} מהפוסטים בניסוי — מתחת לסף (${pct(t.experiment_min_share)})`);
    }
  } else skip("experiments", "לפוסטים אין שדה experiment");

  // 9 · Credits
  const credits = state.credits;
  if (!has(credits)) skip("credits", "אין נתוני קרדיטים ב־state.json");
  else {
    if (has(credits.balance) && need("credits_balance", credits, "credits_min_balance") && credits.balance < t.credits_min_balance) {
      alerts.push(`[credits_balance] יתרה ${credits.balance} — מתחת לסף (${t.credits_min_balance})`);
    }
    if (has(credits.weekly_used) && need("credits_weekly", credits, "credits_weekly_budget") && credits.weekly_used > t.credits_weekly_budget) {
      alerts.push(`[credits_weekly] ניצול שבועי ${credits.weekly_used} — מעל התקציב (${t.credits_weekly_budget})`);
    }
  }

  // 10 · Maya arc flags — reported as-is; their semantics are an open decision
  if ("arc_week" in (config.persona_fields ?? {}) || "masking" in (config.persona_fields ?? {})) {
    if (has(state.arc_week)) info.push(`arc_week: ${state.arc_week}`);
    else skip("arc_week", "אין arc_week ב־state.json");
    if (has(state.masking)) {
      info.push(`masking: ${state.masking}`);
      if (state.masking === true) alerts.push("[masking] דגל masking פעיל — לבדוק ידנית לפני כל אישור");
    } else skip("masking", "אין דגל masking ב־state.json");
  }

  return { alerts, skipped, info };
}

export function renderReport(id, state, result, now) {
  const status = result.alerts.length ? "ALERT" : "SILENT";
  const lines = [
    "---",
    `persona: ${id}`,
    `generated_at: ${now.toISOString()}`,
    `status: ${status}`,
    `alerts: ${result.alerts.length}`,
    `source: ${state?.source ?? "none"}`,
    "---",
    "",
    `# Heartbeat · ${id} · ${isoDate(now)}`,
    "",
  ];
  if (state?.source === "seed") {
    lines.push("> **נתוני seed — לא נתונים אמיתיים.** הפוסטים מגיעים מהמחולל ב־src/lib/history.js.", "");
  }
  lines.push("## התראות", "");
  lines.push(...(result.alerts.length ? result.alerts.map((a) => `- ${a}`) : ["SILENT – אין התראות"]), "");
  if (result.info.length) lines.push("## מצב", "", ...result.info.map((i) => `- ${i}`), "");
  if (result.skipped.length) lines.push("## דולג", "", ...result.skipped.map((s) => `- ${s}`), "");
  return { status, text: lines.join("\n") };
}

export function heartbeat(id, now = new Date()) {
  const config = loadHeartbeatConfig(id);
  const state = loadState(id);
  let result;
  if (!state) {
    result = { alerts: ["[no_state] אין state.json — הרץ npm run agents:export"], skipped: [], info: [] };
  } else {
    const problems = validateState(state, loadStateExample(id));
    if (problems.length) throw new Error(`${id}: state.json does not match state.example.json\n  ${problems.join("\n  ")}`);
    result = runChecks(state, config, now);
  }
  const report = renderReport(id, state, result, now);
  const dir = join(personaDir(id), "reports");
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${isoDate(now)}.md`);
  writeFileSync(file, report.text + "\n");
  return { ...report, file };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const nowIdx = args.indexOf("--now");
  const now = nowIdx >= 0 ? new Date(args.splice(nowIdx, 2)[1]) : new Date();
  const target = args[0];
  if (!target) {
    console.error("usage: heartbeat.mjs <persona-id|all> [--now <iso>]");
    process.exit(2);
  }
  const ids = target === "all" ? listPersonas() : [target];
  let failed = false;
  for (const id of ids) {
    try {
      const r = heartbeat(id, now);
      console.log(r.text);
      console.log(`→ ${r.file}\n`);
    } catch (e) {
      failed = true;
      console.error(`✗ ${e.message}\n`);
    }
  }
  process.exit(failed ? 1 : 0);
}
