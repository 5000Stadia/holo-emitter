# The registry — stable handles for Kabe's reference

[HUMAN, 2026-08-24]: "Internal IDs, so I can reference them to you when there's an issue."

Cite any handle below and the Navigator resolves it. Rows are already their own ids
("row 25"); this file adds the running machinery and live builders. The Navigator
keeps it current at every board change; reports cite these handles.

## Standing services (always-on)

| handle | what it is | where it lives |
|---|---|---|
| SVC-LOOP | the manor sweep loop: measures arrivals, promotes, bakes | tmux `manor-loop` |
| SVC-SEAT | the painter (Codex image seat) | tmux `holoemitter-assets` |
| SVC-WATCH | the baton watchdog: who owes the next action, nudges stalls | tmux `seat-watch`, writes `baton.json` |
| SVC-TICK | the Navigator's 2-hour performance sampler | session cron |
| SVC-SITE | the live site + one-command publisher | `tools/publish-site.sh` |
| SVC-UP | the idempotent bring-up after ANY restart: starts only what is absent, never a duplicate | `tools/services.sh up` (status/down too) |

## Live builders (change often — the Navigator updates on spawn/land)

| handle | task | state |
|---|---|---|
| B-ORIGIN | row 40 origin hunt: why one room's four asks painted as two rooms — prompt diffs → producing lines → fix in the composer + a same-room-same-sentences test | building |
| B-GREEN | merged main's suite: 24 failures across 9 specs after today's four merges → green with the right fixes | building |

## Recently landed (for "issue with…" back-reference)

| handle | what landed |
|---|---|
| L-CONSISTENCY | row 40: per-room consistency measure (brightness weight zero) + forced edge-seeded re-asks naming the ruling materials; 9 packets dispatched |
| L-ROUTING | the loop's standing exits: snap → void-repair (round row36doors) → tolerance → grid, once-per-sweep validation, pass-age liveness |
| L-ASSEMBLY | row 36: material library, harvester, lighting stub (world-addressed), assembler, door-void painter, kitchen demo |
| L-STAIRS | row 25: every drawn flight pixel answers a tap both directions (12 facings; 2.25M px that answered nothing now do); the sky-walks-you question on entrance_court/S sits in its batch for Kabe |
| L-FLIGHT | row 39: painted staircases attached into promoted metas at the meta's own camera; back_stair/W and back_stair_head/S promoted through it |
| L-SEAMS | row 38: edge-seeded generation — adjacency, 10% seed strips, seam metric |
| L-OVERLAY | the `study · N` corner readout (whereami) |
| L-SNAP | row 35: planar rectification + eye retarget |
| L-TOLERANCE | the declared-camera suspect promotions (12 walls) |
| L-VOICES | per-room material voices + heraldry ration |
| L-DOORS | row 27: painted doors govern click targets |
| L-GATE | row 26: the manor's gate doors + 56th exit |
| L-RECIPE | row 34: the g4 prompt register (evolution run) |

## How to use it

"Issue with SVC-LOOP" / "B-STAIRS taking too long" / "L-DOORS broke something in
the library" — any of these lands the issue on exactly one desk. For product
defects with no obvious handle, name the room and facing ("great_hall/N") — every
wall is itself an id the whole pipeline resolves.

## Restart discipline

A host restart kills tmux and the session cron. Recovery is one command (`tools/services.sh up`) plus resuming in-flight builders by handle; merged builders' worktrees are pruned so nothing loose survives a restart unowned. 2026-08-24: 13 merged worktrees pruned, 3 in-flight kept. Second restart the same day: two builders' transcripts lost but their branches held 15 and 8 commits — continuation builders took the branches over; the rule is COMMIT SMALL, the branch is the memory.
