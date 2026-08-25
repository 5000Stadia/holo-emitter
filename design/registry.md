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
| B-GREEN2 | 4 staleness cases after the origin merge (fixtures:126, material-origin:291/453, plan:2595) → green | building |
| B-REGISTER | the clean prompt register g5 (Kabe: "that prompt seems like a mess") as an evolution arm against g4, with/without the coordinate appendix | building |
| B-BAYS | row 41: walls laid out as fitted bays (stiles in the corners, frame completes, fields filled inside the frame) — replaces row 36's tiled walls after Kabe's flip | building |

## Recently landed (for "issue with…" back-reference)

| handle | what landed |
|---|---|
| L-ORIGIN | row 40 origin: rooms were ASKED from two material tables (pre/post voice table; idempotent emit never re-asked) — one home for materials, `--audit-materials` observer, `material.voice_stale` refusal, Image 1 = the room's own wall or nothing |
| L-SUPERSEDE | the loop's supersede route: a room's consistency rolls judged as one set, snap on camera miss, stands on ≥10% improvement; bedchamber ×4, servants_hall/N, garden_room/W went through it |
| L-GREEN | merged main back to 1896/0 after the four merges; rule adopted: `npm test` runs in a checkout SVC-LOOP does not write (a worktree), never in the loop's tree |
| L-CONSISTENCY | row 40: per-room consistency measure (brightness weight zero) + forced edge-seeded re-asks naming the ruling materials; 9 packets dispatched |
| L-IMAGE1 | row 40, Kabe's ruling: **Image 1 is never a wall from another room**. Proven cause - `privy_garden/N` was asked for "weathered ashlar and brick, open sky" and came back with the study seed's oak wainscot round a garden; 7 of 19 plain-glass window walls carry the seed's shields while `great_hall`, the one room allowed arms, carries less. `styleImageFor` picks the room's own agreeing wall whose ask was its ruling, or attaches NOTHING and carries the medium in words (29 of 88 get a picture, 59 get none). Glass named positively; the sentence arguing with Image 1 spoken only where one exists |
| L-ORIGIN | row 40's cause, not its symptom: the five rooms' facings were COMMISSIONED from different materials (`4efd69d` 03:54 archetype composer -> `e0f02b6` 11:03 voice table, re-emitting 13 walls only; `--emit-manor` skips a painted facing, so the correction could not reach the store). Cure: one home for a manor ask's materials (`materialParts`), the blankness sentence stripped of its second fabric, `materialProvenance()` + `--audit-materials` as the observer that did not exist, `[row40:material.voice_stale]` on the promotion, `material_legacy.json` as the closing ledger (36 open), `--emit-consistency --from-ask` |
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

## References for Kabe's eye

| handle | what |
|---|---|
| R-KITCHEN-FLIP | the kitchen made both ways (painted whole vs row-36 assembly), facing by facing with corner seams: https://claude.ai/code/artifact/7be98489-7244-4381-8f6f-080215070e30 |

## How to use it

"Issue with SVC-LOOP" / "B-STAIRS taking too long" / "L-DOORS broke something in
the library" — any of these lands the issue on exactly one desk. For product
defects with no obvious handle, name the room and facing ("great_hall/N") — every
wall is itself an id the whole pipeline resolves.

## Restart discipline

A host restart kills tmux and the session cron. Recovery is one command (`tools/services.sh up`) plus resuming in-flight builders by handle; merged builders' worktrees are pruned so nothing loose survives a restart unowned. 2026-08-24: 13 merged worktrees pruned, 3 in-flight kept. Second restart the same day: two builders' transcripts lost but their branches held 15 and 8 commits — continuation builders took the branches over; the rule is COMMIT SMALL, the branch is the memory.
