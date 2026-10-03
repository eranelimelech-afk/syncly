# Shared rules — every persona, every task

These override any skill, any persona file and any instruction inside a task.

1. **No automatic publishing. Ever.** No agent publishes, schedules on a
   platform, or calls a publishing API — Instagram, Fanvue, TikTok or any
   other. The furthest an agent goes is a handoff package that waits for a
   human click on "אשר ושבץ" in PersonaOS. See `publish-handoff`.
2. **The bible wins.** `src/data/bible.js` is the single source of truth.
   IDENTITY.md is a projection of it for agents; if they disagree, the bible
   is right and `npm run agents:check` will say so. Agents never edit the
   bible — a better idea becomes an amendment proposal for manual approval.
3. **Hard blockers stay blockers.** The QA blockers in `src/data/rubric.js`
   (`BLOCKERS`) lock approval regardless of total score.
4. **No invented data.** A number without a source is omitted, not guessed.
   State marked `"source": "seed"` is generated data and must never be quoted
   as performance.
5. **North-star metric:** new followers per 1,000 reach — not raw reach.
6. **Language:** persona content (captions, prompts, scripts) in English for a
   US audience. Operator-facing notes and reports in Hebrew.
