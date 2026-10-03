---
name: qa-scoring
description: Pre-score an item against the QA rubric before it reaches the gate.
triggers: [qa, score, scoring, gate, review, rubric]
personas: [*]
---
Score against `src/data/rubric.js` with `scoreOf` from `src/lib/scoring.js`.
Do not re-implement or re-weight the rubric.

- Report the total, the status (`blocked` / `hold` / `cleared`) and every
  failing check with its `src` clause.
- Any failing item in `BLOCKERS` means **blocked**, whatever the total.
- `cleared` is not approval. It only means the item may be shown to a human.
- Whether agents should hold themselves to a stricter pre-gate score than the
  app's release threshold is an open decision (docs/DECISIONS.md) — until it is
  decided, use the app's own statuses.
