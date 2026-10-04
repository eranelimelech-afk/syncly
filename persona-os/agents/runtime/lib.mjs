/**
 * Shared helpers for the agent runtime. No dependencies, Node only.
 *
 * Nothing in agents/ publishes, schedules or calls any platform API. The
 * runtime reads files, assembles context and writes reports — that is all.
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const AGENTS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
export const PERSONAS_DIR = join(AGENTS_DIR, "personas");
export const SKILLS_DIR = join(AGENTS_DIR, "shared", "skills");

export const personaDir = (id) => join(PERSONAS_DIR, id);

export function listPersonas() {
  return readdirSync(PERSONAS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(PERSONAS_DIR, d.name, "heartbeat.json")))
    .map((d) => d.name)
    .sort();
}

export function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function readJsonIfExists(path) {
  return existsSync(path) ? readJson(path) : null;
}

export const loadHeartbeatConfig = (id) => readJson(join(personaDir(id), "heartbeat.json"));
export const loadStateExample = (id) => readJson(join(personaDir(id), "state.example.json"));
export const loadState = (id) => readJsonIfExists(join(personaDir(id), "state.json"));

/**
 * Minimal front matter: `key: value` lines between two `---` fences.
 * A value wrapped in [] is read as a comma-separated list.
 */
export function parseFrontMatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: text };
  const meta = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([\w-]+):\s*(.*)$/);
    if (!kv) continue;
    const raw = kv[2].trim();
    meta[kv[1]] = raw.startsWith("[") && raw.endsWith("]")
      ? raw.slice(1, -1).split(",").map((s) => s.trim()).filter(Boolean)
      : raw;
  }
  return { meta, body: m[2] };
}

export function loadSkills() {
  return readdirSync(SKILLS_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => {
      const { meta, body } = parseFrontMatter(readFileSync(join(SKILLS_DIR, f), "utf8"));
      return {
        name: meta.name ?? f.replace(/\.md$/, ""),
        description: meta.description ?? "",
        triggers: meta.triggers ?? [],
        pulls: meta.pulls ?? [],
        personas: meta.personas ?? ["*"],
        body: body.trim(),
      };
    });
}

/** Returns the markdown body under `## <heading>` up to the next `## `. */
export function section(markdown, heading) {
  const lines = markdown.split("\n");
  const start = lines.findIndex((l) => l.trim().toLowerCase() === `## ${heading}`.toLowerCase());
  if (start === -1) return null;
  const end = lines.findIndex((l, i) => i > start && /^## /.test(l));
  return lines.slice(start + 1, end === -1 ? undefined : end).join("\n").trim();
}

/**
 * Checks a state object against the persona's state.example.json.
 *
 * The example is the contract: every key in the state must exist in the
 * example at the same path with the same JSON type. Keys may be missing — a
 * field with no source yet is omitted, never invented — but never extra.
 * Array items are checked against the example's first item.
 */
export function validateState(state, example) {
  const problems = [];
  const typeOf = (v) => (v === null ? "null" : Array.isArray(v) ? "array" : typeof v);
  const walk = (val, ex, path) => {
    const t = typeOf(val), et = typeOf(ex);
    if (t !== et) { problems.push(`${path}: expected ${et}, got ${t}`); return; }
    if (t === "array") {
      if (ex.length === 0) { if (val.length) problems.push(`${path}: example has no item shape`); return; }
      val.forEach((item, i) => walk(item, ex[0], `${path}[${i}]`));
    } else if (t === "object") {
      for (const k of Object.keys(val)) {
        if (!(k in ex)) problems.push(`${path}.${k}: not in state.example.json`);
        else walk(val[k], ex[k], `${path}.${k}`);
      }
    }
  };
  walk(state, example, "state");
  for (const k of ["persona", "source", "exported_at"]) {
    if (!(k in state)) problems.push(`state.${k}: required`);
  }
  return problems;
}

export const DAY_MS = 24 * 60 * 60 * 1000;

export function isoDate(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
