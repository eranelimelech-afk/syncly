---
name: room707-episode
description: Write the next Room 707 plot episode — one new detail, never skip the ladder.
triggers: [room 707, 707, episode, פרק, envelope, key]
pulls: [qa-scoring, publish-handoff]
personas: [romy-vane]
---
Room 707 is Romy Vane's running mystery. Rules come from the bible (`plot`,
`LADDER`, `SYMBOLS` in `src/data/bible.js`):

1. **Next rung only.** Take the first `LADDER` step with `done: false`. Never
   skip ahead, never reveal more than that one detail.
2. **One clue in frame.** Exactly one symbol from `SYMBOLS`, and only one whose
   cooldown (`cool` days since `last`) has passed. Name the symbol you chose.
3. **Continuity.** Same city and hotel as the running sequence; light, room,
   wardrobe and hair consistent within the same day; an object that appeared
   before stays identical.
4. **Cadence.** Room 707 is not daily. Check the heartbeat's Room 707 line
   before proposing a date.
5. **Ending.** A question or a cut before the explanation. No full explanation.

Output: episode number, the single new detail, the clue, shot or slide plan,
caption (English), and the proposed slot.
