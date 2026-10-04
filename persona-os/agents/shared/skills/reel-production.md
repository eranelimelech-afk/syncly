---
name: reel-production
description: Plan a 9:16 reel from hook to edit, inside the persona's visual lock.
triggers: [reel, reels, video, ריל]
pulls: [qa-scoring, publish-handoff]
personas: [*]
---
Produce a reel plan, not a reel. Output, in order:

1. **Hook (0–2s).** Face first — the Hook Lab result (e1) says the face stops
   the scroll; the symbol enters after second 2.
2. **Shot list.** 3–6 shots, each with: camera move from `src/data/camera.js`
   (never a move marked `fit: off`), the reference angle it needs from the
   identity sheet, and duration. If `src/lib/shot.js` reports the shot as
   `blocked` (missing reference), say so and stop — do not substitute.
3. **On-screen text and caption** in the persona's voice (English).
4. **Ending:** a question or a cut before the explanation.
5. **Engine note:** which engine the plan assumes. The engine choice is an open
   decision (docs/DECISIONS.md §1) — state the assumption, do not decide it.
