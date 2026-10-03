# Persona agents — README

Built 3.10.2026 inside PersonaOS. The original `persona-os-agents.zip` was not
available, so this layer was written from the task spec: same layout
(`AGENTS.md`, `shared/`, `personas/`, `runtime/`), same commands, but the
schemas (`state.example.json`, `heartbeat.json`, skill front matter) are this
implementation's own. If the zip turns up, diff it against this before
replacing anything.

## What is real

| part | status |
|---|---|
| runtime (assemble, heartbeat), skills, rules | real |
| romy-vane IDENTITY.md | real — checked against the bible by `agents:check` |
| maya-voss, romy-roam IDENTITY.md | stubs — no locked bible exists for them |
| state.json | real export of PersonaOS data — but posts are **seed** data |
| heartbeat thresholds | **proposed** values, see below |

## Open decisions

1. **Credit budgets.** `credits_min_balance` and `credits_weekly_budget` are
   `null` in every `heartbeat.json`, and the export omits `credits` until
   Higgsfield is connected. Needed: a weekly budget and a floor per persona.
2. **QA pass score for agents.** The app clears an item at 85
   (`src/lib/scoring.js`). Should agents hand off only above a stricter
   pre-gate score, or use the app's statuses as-is? Today: as-is.
3. **Heartbeat thresholds.** Every number in `heartbeat.json → thresholds` is
   a proposed starting value: queue ≤ 4 pending and ≤ 48h old; ≥ 5 scheduled
   items in the next 7 days (3 for Maya and Roam); ≤ 2 days between posts;
   pillar drift ≤ 10 points over the last 30 posts; Room 707 every 14–28 days
   (14 = the bible's cooldown on the 707 symbol); ≤ 5 unread; ≥ 10% of posts
   in an experiment.
4. **Maya's five content engines.** Maya has no locked bible and no pillar
   targets. Her `pillar_targets` are empty until the five engines are named
   and weighted — and `arc_week` / `masking` get their meaning from that same
   decision.
