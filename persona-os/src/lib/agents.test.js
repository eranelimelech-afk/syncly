import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { selectSkills } from "../../agents/runtime/assemble.mjs";
import { runChecks } from "../../agents/runtime/heartbeat.mjs";
import { validateState, loadStateExample, listPersonas } from "../../agents/runtime/lib.mjs";
import { buildState } from "../../scripts/export-agent-state.mjs";
import { AGENT_IDS } from "./agents.js";
import { parseReport } from "./heartbeat.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

test("a room 707 reel loads the episode, reel, QA and handoff skills — nothing else", () => {
  const names = selectSkills("romy-vane", "room 707 episode reel").map((c) => c.skill.name).sort();
  assert.deepEqual(names, ["publish-handoff", "qa-scoring", "reel-production", "room707-episode"]);
});

test("room707-episode is Romy Vane's only", () => {
  const names = selectSkills("maya-voss", "room 707 episode reel").map((c) => c.skill.name);
  assert.ok(!names.includes("room707-episode"));
  assert.ok(names.includes("publish-handoff"));
});

test("every persona's export matches its state.example.json and is marked seed", () => {
  for (const [pid, agentId] of Object.entries(AGENT_IDS)) {
    const state = buildState(pid, new Date("2026-10-03T12:00:00Z"));
    assert.deepEqual(validateState(state, loadStateExample(agentId)), [], agentId);
    assert.equal(state.source, "seed");
    assert.ok(!("credits" in state), "credits has no source yet and must be omitted");
  }
  assert.deepEqual(Object.values(AGENT_IDS).sort(), listPersonas());
});

test("validateState rejects keys the example does not have", () => {
  const ex = loadStateExample("romy-vane");
  const bad = { ...buildState("vane"), likes: 5 };
  assert.match(validateState(bad, ex).join(), /state\.likes/);
});

test("heartbeat skips checks without data or threshold instead of inventing them", () => {
  const r = runChecks(
    { persona: "x", source: "seed", exported_at: "", posts: [] },
    { pillar_targets: {}, thresholds: { post_gap_max_days: 2, credits_min_balance: null } },
    new Date("2026-10-03"),
  );
  assert.deepEqual(r.alerts, []);
  assert.ok(r.skipped.some((s) => s.startsWith("credits")));
  assert.ok(r.skipped.some((s) => s.startsWith("pillar_mix")));
});

test("report parser reads status and alerts", () => {
  const r = parseReport("---\npersona: romy-vane\nstatus: ALERT\nsource: seed\n---\n\n# H\n\n## התראות\n\n- [post_gap] x\n\n## מצב\n\n- a\n");
  assert.equal(r.status, "ALERT");
  assert.deepEqual(r.alerts, ["[post_gap] x"]);
  assert.deepEqual(r.info, ["a"]);
});

/**
 * Hard rule: nothing publishes automatically. Fail the suite if any code path
 * gains a call to a publishing endpoint or tool.
 */
test("no code calls a publishing API", () => {
  const PUBLISH = /media_publish|\/media\b[^\n]*method:\s*["']POST|tiktok_(prepare_)?publish|publish_website|content_publishing(?!_limit)|execute_action/;
  const dirs = ["src", "server", "scripts", "agents/runtime"];
  const files = [];
  const walk = (d) => {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(m?js|jsx)$/.test(f) && !p.endsWith("agents.test.js")) files.push(p);
    }
  };
  dirs.forEach((d) => walk(join(ROOT, d)));
  const hits = files.filter((f) => PUBLISH.test(readFileSync(f, "utf8")));
  assert.deepEqual(hits, []);
});
