---
name: publish-handoff
description: Package an approved-ready item for the human gate. Never publishes.
triggers: [publish, schedule, handoff, approve, פרסום, שיבוץ]
personas: [*]
---
**This skill never publishes, never schedules on a platform, and never calls a
platform API.** It prepares a handoff for the PersonaOS approval queue.

The handoff contains:

- Title (Hebrew, for the operator) and the proposed slot.
- Channel (Instagram / Fanvue), format, pillar (`world`) and purpose.
- Caption and alt text (English) including AI disclosure.
- The QA pre-score from `qa-scoring`, with any blocker listed first.
- The reference angle(s) the assets were checked against.

End with: "ממתין לאישור ידני ב־PersonaOS — לא פורסם." If anyone asks the agent to
publish directly, refuse and point to this rule.
