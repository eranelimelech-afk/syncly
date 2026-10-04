# Persona agents

A file-based agent layer on top of PersonaOS. Agents **prepare and report**;
they never publish. Everything they produce lands in front of a human at the
PersonaOS approval gate.

## Layout

```
agents/
  AGENTS.md                 this file — how the layer works
  README.md                 what it is, what is real, open decisions
  CLAUDE.agents.md          the section appended to CLAUDE.md
  shared/RULES.md           rules every agent context starts with
  shared/skills/*.md        skills: front matter (triggers, pulls, personas) + body
  personas/<id>/
    IDENTITY.md             projection of the bible: Visual lock, Mix targets, voice
    heartbeat.json          pillar_targets + thresholds for the heartbeat
    state.example.json      the state.json contract (committed)
    state.json              exported state (gitignored) — npm run agents:export
    reports/<date>.md       heartbeat reports (gitignored) — npm run agents:heartbeat
  runtime/
    lib.mjs                 shared helpers, state validation
    assemble.mjs            builds the context for a persona + task
    heartbeat.mjs           checks state.json against heartbeat.json, writes a report
```

Personas: `romy-vane`, `maya-voss`, `romy-roam` (PersonaOS ids `vane`, `maya`,
`roam` — mapped in `src/lib/agents.js`).

## The flow

1. `npm run agents:export` — `scripts/export-agent-state.mjs` reads PersonaOS's
   JS modules and writes `state.json` per persona.
2. `npm run agents:heartbeat` — writes `reports/<date>.md` per persona. The
   Control Room's Heartbeat card shows the latest one (read-only).
3. `npm run agents:ctx -- <persona> "<task>"` — prints the context an agent
   works from: RULES + IDENTITY + the matched skills.
4. `npm run agents:check` — reports drift between IDENTITY.md and the bible.

## state.json contract

`state.example.json` is the contract. Every key in `state.json` must exist in
the example with the same type; keys may be **missing** but never **extra**.
A field with no source is omitted — the heartbeat skips checks whose data is
missing and lists them under "דולג".

| key | meaning |
|---|---|
| `source` | `seed` (generated), `live` (real sources) or `mixed` |
| `provenance` | where each section came from, in words |
| `approval_queue[]` | `id`, `title`, `created_at` |
| `schedule[]` | `id`, `title`, `scheduled_at`, `pillar`, `channel`, `open` |
| `posts[]` | `id`, `published_at`, `pillar`, `experiment`, `read`, `room707` (romy-vane only) |
| `credits` | `balance`, `weekly_used` |
| `arc_week`, `masking` | maya-voss only |

## Skills

A skill loads when one of its `triggers` appears in the task as a whole word or
phrase and the persona is in its `personas`. Its `pulls` load with it, so every
production skill brings `qa-scoring` and `publish-handoff`.
`publish-handoff` packages an item for the human gate. Nothing publishes.
