#!/usr/bin/env node
/**
 * ASSEMBLE — builds the working context for one persona and one task:
 * shared rules + the persona's IDENTITY.md + the skills the task calls for.
 *
 *   node agents/runtime/assemble.mjs romy-vane "room 707 episode reel"
 *
 * Skill selection is deterministic: a skill is loaded when one of its
 * `triggers` appears in the task as a whole word or phrase, and it is allowed
 * for the persona. Loading a skill also loads everything in its `pulls`, so
 * any production skill always brings the QA gate and the human handoff with it.
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { AGENTS_DIR, personaDir, listPersonas, loadSkills } from "./lib.mjs";

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function selectSkills(personaId, task, skills = loadSkills()) {
  const byName = new Map(skills.map((s) => [s.name, s]));
  const allowed = (s) => s.personas.includes("*") || s.personas.includes(personaId);
  const text = task.toLowerCase();
  const chosen = [];
  const add = (s, why) => {
    if (!s || !allowed(s) || chosen.some((c) => c.skill.name === s.name)) return;
    chosen.push({ skill: s, why });
    for (const p of s.pulls) {
      if (!byName.has(p)) throw new Error(`skill "${s.name}" pulls unknown skill "${p}"`);
      add(byName.get(p), `נמשך על ידי ${s.name}`);
    }
  };
  for (const s of skills) {
    const hit = s.triggers.find((t) => new RegExp(`(^|[^\\p{L}\\p{N}])${escape(t.toLowerCase())}($|[^\\p{L}\\p{N}])`, "u").test(text));
    if (hit) add(s, `trigger: "${hit}"`);
  }
  return chosen;
}

export function assemble(personaId, task) {
  if (!listPersonas().includes(personaId)) {
    throw new Error(`unknown persona "${personaId}" — known: ${listPersonas().join(", ")}`);
  }
  const identityPath = join(personaDir(personaId), "IDENTITY.md");
  const identity = existsSync(identityPath) ? readFileSync(identityPath, "utf8").trim() : "";
  const rules = readFileSync(join(AGENTS_DIR, "shared", "RULES.md"), "utf8").trim();
  const chosen = selectSkills(personaId, task);

  const out = [
    `# Context · ${personaId}`,
    "",
    `Task: ${task}`,
    `Skills: ${chosen.map((c) => c.skill.name).join(", ") || "(none)"}`,
    "",
    rules,
    "",
    identity,
    "",
    ...chosen.flatMap(({ skill }) => [`# Skill · ${skill.name}`, "", skill.body, ""]),
  ];
  return { skills: chosen, text: out.join("\n") };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [personaId, ...rest] = process.argv.slice(2);
  const task = rest.join(" ").trim();
  if (!personaId || !task) {
    console.error('usage: assemble.mjs <persona-id> "<task>"');
    process.exit(2);
  }
  try {
    const { skills, text } = assemble(personaId, task);
    console.error(`Loaded ${skills.length} skills:`);
    for (const { skill, why } of skills) console.error(`  · ${skill.name}  (${why})`);
    console.error("");
    console.log(text);
  } catch (e) {
    console.error(`✗ ${e.message}`);
    process.exit(1);
  }
}
