#!/usr/bin/env node
/**
 * Compares each agents/personas/<id>/IDENTITY.md with the locked bible.
 * Reports gaps in Hebrew. Fixes nothing — the bible is never edited from code,
 * and IDENTITY.md is fixed by hand.
 *
 *   npm run agents:check
 *
 * Visual lock  -> BIBLE in src/data/bible.js (lookEn, palette, age, locked,
 *                 the "אין לשנות" row) and the wardrobe via lexicon.js, the
 *                 bible's own English projection (asserted in sync on import).
 * Mix targets  -> WORLD[*].target in src/data/dimensions.js — the quotas the
 *                 bible assigns per content world. bible.js itself holds none.
 *                 Also cross-checked against heartbeat.json pillar_targets.
 *
 * Always exits 0: this is a report, not a gate.
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { BIBLE, PERSONAS } from "../src/data/bible.js";
import { WORLD } from "../src/data/dimensions.js";
import { wardrobeEn } from "../src/data/lexicon.js";
import { AGENT_IDS } from "../src/lib/agents.js";
import { PILLAR_MAP } from "./export-agent-state.mjs";
import { personaDir, section, loadHeartbeatConfig } from "../agents/runtime/lib.mjs";

/** Personas whose bible is locked in bible.js. Today: Romy Vane only. */
const LOCKED = new Set(["vane"]);

const norm = (s) => s.toLowerCase().replace(/\s+/g, " ").trim();
const field = (body, name) => {
  const m = body.match(new RegExp(`^- ${name}:\\s*(.*)$`, "mi"));
  return m ? m[1].trim() : null;
};
const listUnder = (body, name) => {
  const lines = body.split("\n");
  const i = lines.findIndex((l) => new RegExp(`^- ${name}:\\s*$`, "i").test(l));
  if (i === -1) return null;
  const out = [];
  for (const l of lines.slice(i + 1)) {
    const m = l.match(/^\s+- (.*)$/);
    if (!m) break;
    out.push(m[1].trim());
  }
  return out;
};
const diff = (want, got) => ({
  missing: want.filter((w) => !got.includes(w)),
  extra: got.filter((g) => !want.includes(g)),
});

function checkVisual(body, gaps) {
  const locked = field(body, "Locked");
  if (locked !== BIBLE.locked) gaps.push(`תאריך נעילה: IDENTITY="${locked ?? "חסר"}", ביבליה="${BIBLE.locked}"`);

  const age = Number(field(body, "Age"));
  if (age !== BIBLE.age) gaps.push(`גיל: IDENTITY=${field(body, "Age") ?? "חסר"}, ביבליה=${BIBLE.age}`);

  const look = field(body, "Look");
  if (!look) gaps.push("Look: חסר");
  else {
    const d = diff(BIBLE.lookEn.split(",").map(norm), look.split(",").map(norm));
    if (d.missing.length) gaps.push(`Look: חסרים מאפיינים מהביבליה — ${d.missing.join(" | ")}`);
    if (d.extra.length) gaps.push(`Look: מאפיינים שלא בביבליה — ${d.extra.join(" | ")}`);
  }

  const palette = (field(body, "Palette") ?? "").match(/#[0-9a-f]{6}/gi)?.map((h) => h.toUpperCase()) ?? [];
  const d = diff(BIBLE.palette.map(([h]) => h.toUpperCase()), palette);
  if (d.missing.length) gaps.push(`פלטה: חסרים ${d.missing.join(", ")}`);
  if (d.extra.length) gaps.push(`פלטה: צבעים שלא בביבליה ${d.extra.join(", ")}`);

  const wardrobe = listUnder(body, "Wardrobe");
  if (!wardrobe) gaps.push("לבוש: חסר");
  else {
    const want = BIBLE.wardrobe.map((_, i) => norm(wardrobeEn(i)));
    const w = diff(want, wardrobe.map(norm));
    if (w.missing.length) gaps.push(`לבוש: חסרות שורות מהביבליה — ${w.missing.join(" | ")}`);
    if (w.extra.length) gaps.push(`לבוש: שורות שלא בביבליה — ${w.extra.join(" | ")}`);
  }

  // The "never change" row is Hebrew in the bible; compare item counts only.
  const neverRow = BIBLE.look.find(([k]) => k === "אין לשנות");
  const want = neverRow ? neverRow[1].split("·").length : 0;
  const got = (field(body, "Never change") ?? "").split(";").filter((s) => s.trim()).length;
  if (want !== got) gaps.push(`"אין לשנות": בביבליה ${want} פריטים, ב־IDENTITY ${got}`);
}

function checkMix(body, agentId, gaps) {
  const rows = [...body.matchAll(/^\|\s*([a-z0-9_]+)\s*\|\s*(\d+(?:\.\d+)?)%\s*\|/gim)];
  const got = Object.fromEntries(rows.map((r) => [r[1], Number(r[2]) / 100]));
  if (!rows.length) { gaps.push("יעדי תמהיל: אין טבלה ב־IDENTITY.md"); return; }
  const bible = Object.fromEntries(Object.entries(WORLD).map(([w, v]) => [PILLAR_MAP[w], v.target]));
  for (const [k, t] of Object.entries(bible)) {
    if (!(k in got)) gaps.push(`תמהיל: ה־pillar "${k}" (${Math.round(t * 100)}%) חסר ב־IDENTITY`);
    else if (Math.abs(got[k] - t) > 1e-9) gaps.push(`תמהיל: ${k} — IDENTITY ${Math.round(got[k] * 100)}%, ביבליה ${Math.round(t * 100)}%`);
  }
  for (const k of Object.keys(got)) if (!(k in bible)) gaps.push(`תמהיל: "${k}" ב־IDENTITY ולא בביבליה`);
  const sum = Object.values(got).reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 1) > 1e-9) gaps.push(`תמהיל: סכום היעדים ב־IDENTITY הוא ${Math.round(sum * 100)}%, לא 100%`);

  const hb = loadHeartbeatConfig(agentId).pillar_targets ?? {};
  for (const [k, t] of Object.entries(bible)) {
    if (!(k in hb)) gaps.push(`heartbeat.json: חסר יעד ל־"${k}"`);
    else if (Math.abs(hb[k] - t) > 1e-9) gaps.push(`heartbeat.json: ${k} = ${Math.round(hb[k] * 100)}%, ביבליה ${Math.round(t * 100)}%`);
  }
}

let total = 0;
for (const p of PERSONAS) {
  const agentId = AGENT_IDS[p.id];
  console.log(`\n■ ${p.name} (${agentId ?? "אין מזהה סוכן"})`);
  if (!agentId) { console.log("  ✗ אין מיפוי ב־AGENT_IDS"); total++; continue; }
  const path = join(personaDir(agentId), "IDENTITY.md");
  if (!existsSync(path)) { console.log("  ✗ IDENTITY.md חסר"); total++; continue; }
  const md = readFileSync(path, "utf8");
  const visual = section(md, "Visual lock");
  const mix = section(md, "Mix targets");

  if (!LOCKED.has(p.id)) {
    console.log("  ⚠ אין ביבליה נעולה לדמות הזו ב־bible.js — אין מול מה לבדוק.");
    console.log(`    Visual lock ב־IDENTITY: ${visual?.split("\n")[0]?.replace(/^- /, "") ?? "חסר"}`);
    console.log(`    Mix targets ב־IDENTITY: ${mix?.split("\n")[0]?.replace(/^- /, "") ?? "חסר"}`);
    if (visual && !/NOT LOCKED/i.test(visual)) { console.log("  ✗ IDENTITY מציג נעילה ויזואלית בלי ביבליה מאחוריה"); total++; }
    continue;
  }

  const gaps = [];
  if (!visual) gaps.push('סעיף "Visual lock" חסר');
  else checkVisual(visual, gaps);
  if (!mix) gaps.push('סעיף "Mix targets" חסר');
  else checkMix(mix, agentId, gaps);

  if (!gaps.length) console.log("  ✓ אין פערים — Visual lock ויעדי התמהיל תואמים לביבליה");
  else gaps.forEach((g) => console.log(`  ✗ ${g}`));
  total += gaps.length;
}
console.log(`\nסה״כ פערים: ${total}${total ? " — לתקן ב־IDENTITY.md, לא בביבליה" : ""}`);
