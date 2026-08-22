/**
 * Fanvue has no public API, so subscribers arrive as an exported CSV.
 *
 * The honest problem: the export is per DAY, and the app models `subs` per POST.
 * On a day with one post the attribution is unambiguous. On a day with several
 * it is not, and splitting the number evenly would invent per-post data that
 * nobody measured — which then feeds subPer1k and the recommendation engine.
 *
 * So: attribute only where attribution is real, and report the remainder as
 * unattributed rather than smearing it across posts.
 */

/** Minimal CSV reader: quoted fields, escaped quotes, CRLF. No dependency. */
export function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  if (!rows.length) return [];
  const head = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1)
    .filter((r) => r.some((c) => c.trim() !== ""))
    .map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? "").trim()])));
}

const num = (v) => { const n = Number(String(v).replace(/[^0-9.-]/g, "")); return Number.isFinite(n) ? n : 0; };

/** "2026-07-08" or "8/7/2026" -> "8.7", matching the post `day` format. */
export function toDay(value) {
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (iso) return `${Number(iso[3])}.${Number(iso[2])}`;
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) return `${d.getDate()}.${d.getMonth() + 1}`;
  return null;
}

/**
 * Turns a Fanvue export into subscriber counts.
 *
 * Recognised columns: `date` (required), `subscribers` / `subs` / `new_subscribers`,
 * and optionally `media_id` or `post_id` — if the export ever carries a post
 * reference, attribution becomes exact and the ambiguity below disappears.
 */
export function parseFanvue(text) {
  const byDay = new Map();
  const byMedia = new Map();
  for (const r of parseCsv(text)) {
    const day = toDay(r.date ?? r.day ?? "");
    if (!day) continue;
    const n = num(r.subscribers ?? r.subs ?? r.new_subscribers ?? r.count ?? 0);
    const mediaId = r.media_id || r.post_id || null;
    if (mediaId) byMedia.set(mediaId, (byMedia.get(mediaId) ?? 0) + n);
    else byDay.set(day, (byDay.get(day) ?? 0) + n);
  }
  return { byDay, byMedia };
}

/**
 * Attaches subscribers to posts. Returns the posts plus what could not be
 * attributed, so the gap is visible instead of silently zero.
 */
export function attributeSubs(posts, { byDay, byMedia }) {
  const postsByDay = new Map();
  for (const p of posts) {
    if (!postsByDay.has(p.day)) postsByDay.set(p.day, []);
    postsByDay.get(p.day).push(p);
  }

  const unattributed = [];
  const out = posts.map((p) => ({ ...p, subs: byMedia.get(p.igMediaId) ?? 0 }));
  const byId = new Map(out.map((p) => [p.id, p]));

  for (const [day, total] of byDay) {
    const onDay = (postsByDay.get(day) ?? []).filter((p) => p.channel !== "instagram-only");
    if (onDay.length === 1) {
      byId.get(onDay[0].id).subs += total;
    } else {
      unattributed.push({
        day, subs: total,
        reason: onDay.length === 0
          ? "אין פוסט ביום הזה"
          : `${onDay.length} פוסטים באותו יום — הייחוס אינו חד־משמעי`,
      });
    }
  }
  return { posts: out, unattributed };
}
