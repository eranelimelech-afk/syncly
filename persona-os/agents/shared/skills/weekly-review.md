---
name: weekly-review
description: Read the latest heartbeat and propose next week's mix.
triggers: [weekly, week, heartbeat, mix, סיכום]
personas: [*]
---
Start from the latest report in `reports/`. If the state is `"source": "seed"`,
say so in the first line and do not draw performance conclusions.

- Pillar drift: which pillars are over or under target, over how many posts.
- Respect `MIN_N = 5`: no conclusion about a cell with fewer than 5 posts.
- Rank by new followers per 1,000 reach, never by raw reach.
- Propose next week's slots as a list for the operator. Do not schedule them.
