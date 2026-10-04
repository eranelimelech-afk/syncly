#!/usr/bin/env node
/**
 * Writes agents/personas/<id>/state.json for every persona, from the data
 * PersonaOS holds today. Node-only: every source below is a pure JS module.
 *
 *   npm run agents:export
 *
 * What is NOT exported, and why (omitted, never invented):
 *   - approval_queue[].created_at — queue.js has only `when`, a planned slot.
 *   - posts[].experiment, posts[].read — no source links posts to experiments
 *     or tracks reading.
 *   - credits — no source until Higgsfield is connected.
 *   - arc_week, masking (maya-voss) — no source.
 *   - gate decisions — they live in the browser's localStorage (personaos.v1)
 *     and are invisible to Node, so every QUEUE item is exported as pending.
 *
 * Posts come from the seeded generator, so every file is marked
 * "source": "seed" at the top.
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { PERSONAS } from "../src/data/bible.js";
import { WORLD } from "../src/data/dimensions.js";
import { QUEUE, SCHEDULE_DAYS } from "../src/data/queue.js";
import { buildHistory } from "../src/lib/history.js";
import { AGENT_IDS } from "../src/lib/agents.js";
import {
  personaDir, loadHeartbeatConfig, loadStateExample, validateState,
} from "../agents/runtime/lib.mjs";

/**
 * PersonaOS WORLD key -> heartbeat.json pillar_targets key.
 * Today the names are identical; the table exists so a rename on either side
 * is one line here instead of a silent mismatch. Checked against both sides
 * below — an unmapped world fails the export.
 */
export const PILLAR_MAP = {
  hotels: "hotels",
  morning: "morning",
  fitness: "fitness",
  scenery: "scenery",
  dining: "dining",
  community: "community",
  room707: "room707",
};

/**
 * queue.js and history.js write dates as "d.m" with no year. Both describe
 * 2026: history.js builds them with `new Date(2026, …)`, and the schedule's
 * weekday letters (ו׳ 21.8 = Friday) only match 2026. The weekday is checked
 * so a future edit to the data cannot silently land in the wrong year.
 */
const YEAR = 2026;
const HE_WEEKDAY = { "א׳": 0, "ב׳": 1, "ג׳": 2, "ד׳": 3, "ה׳": 4, "ו׳": 5, "ש׳": 6 };
const pad = (n) => String(n).padStart(2, "0");

function parseDayMonth(text) {
  const m = text.match(/(\d{1,2})\.(\d{1,2})/);
  if (!m) throw new Error(`no d.m date in "${text}"`);
  const d = Number(m[1]), mo = Number(m[2]);
  const date = new Date(YEAR, mo - 1, d);
  const wd = Object.keys(HE_WEEKDAY).find((k) => text.includes(k));
  if (wd && HE_WEEKDAY[wd] !== date.getDay()) {
    throw new Error(`weekday ${wd} does not match ${d}.${mo}.${YEAR}`);
  }
  return `${YEAR}-${pad(mo)}-${pad(d)}`;
}

const mapPillar = (world) => {
  if (!(world in PILLAR_MAP)) throw new Error(`world "${world}" has no entry in PILLAR_MAP`);
  return PILLAR_MAP[world];
};

function checkPillarMap(agentId) {
  const unmapped = Object.keys(WORLD).filter((w) => !(w in PILLAR_MAP));
  if (unmapped.length) throw new Error(`WORLD keys missing from PILLAR_MAP: ${unmapped.join(", ")}`);
  const targets = Object.keys(loadHeartbeatConfig(agentId).pillar_targets ?? {});
  if (!targets.length) return;
  const mapped = new Set(Object.values(PILLAR_MAP));
  const orphan = targets.filter((k) => !mapped.has(k));
  if (orphan.length) throw new Error(`${agentId}: pillar_targets keys with no PersonaOS world: ${orphan.join(", ")}`);
}

export function buildState(personaId, exportedAt = new Date()) {
  const agentId = AGENT_IDS[personaId];
  const queue = QUEUE.filter((q) => q.persona === personaId);
  const byId = new Map(queue.map((q) => [q.id, q]));

  const schedule = [];
  for (const day of SCHEDULE_DAYS) {
    const date = parseDayMonth(day.he);
    for (const slot of day.slots) {
      const at = `${date}T${slot.t}`;
      if (slot.need === "open") {
        // An open slot belongs to whoever owns the rest of the calendar —
        // queue.js keeps a single calendar, and every filled slot is this persona's.
        if (!queue.length) continue;
        schedule.push({ id: `open-${at}`, title: slot.title, scheduled_at: at, channel: slot.ch, open: true });
        continue;
      }
      const item = byId.get(slot.need);
      if (!item) continue;
      schedule.push({ id: item.id, title: slot.title, scheduled_at: at, pillar: mapPillar(item.world), channel: slot.ch, open: false });
    }
  }

  const posts = buildHistory(personaId).map((p) => {
    const out = { id: p.id, published_at: parseDayMonth(p.day), pillar: mapPillar(p.world) };
    if (agentId === "romy-vane") out.room707 = p.world === "room707";
    return out;
  });

  return {
    persona: agentId,
    source: "seed",
    exported_at: exportedAt.toISOString(),
    provenance: {
      approval_queue: "module:src/data/queue.js (QUEUE) — gate decisions live in localStorage and are not visible here; every item is exported as pending",
      schedule: "module:src/data/queue.js (SCHEDULE_DAYS) — sample data",
      posts: "seed:src/lib/history.js — generated, not real",
      credits: "none — omitted until Higgsfield is connected",
    },
    approval_queue: queue.map((q) => ({ id: q.id, title: q.title })),
    schedule,
    posts,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let failed = false;
  for (const p of PERSONAS) {
    const agentId = AGENT_IDS[p.id];
    try {
      if (!agentId) throw new Error(`persona "${p.id}" has no entry in AGENT_IDS`);
      checkPillarMap(agentId);
      const state = buildState(p.id);
      const problems = validateState(state, loadStateExample(agentId));
      if (problems.length) throw new Error(`does not match state.example.json:\n  ${problems.join("\n  ")}`);
      const file = join(personaDir(agentId), "state.json");
      writeFileSync(file, JSON.stringify(state, null, 2) + "\n");
      console.log(`✓ ${agentId}: ${state.approval_queue.length} בתור · ${state.schedule.length} בלו״ז · ${state.posts.length} פוסטים (seed) → ${file}`);
    } catch (e) {
      failed = true;
      console.error(`✗ ${agentId ?? p.id}: ${e.message}`);
    }
  }
  process.exit(failed ? 1 : 0);
}
