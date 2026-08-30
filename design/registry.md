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
| SVC-SITE | the live site + one-command publisher — DOWN since the repo became PRIVATE (GitHub Pages needs a paid plan on a private repo; the API refuses to recreate the site); Kabe's call: public repo, or another host | `tools/publish-site.sh` |
| SVC-UP | the idempotent bring-up after ANY restart: starts only what is absent, never a duplicate | `tools/services.sh up` (status/down too) |

## Live builders (change often — the Navigator updates on spawn/land)

| handle | task | state |
|---|---|---|
| B-TRACE-WIRE | the traced aperture polygon becomes THE aperture: promotion writes meta.openings[].polygon (+confidence, head_kind), the warp pins its corners, the page clips the through-view and fits the leaf to it; a low-confidence trace falls back to the rectangle, recorded — capped | building |
| B-WIRE | warp wired as the one exit (merged); first held-wall passes promoted 0: ask file fixed, lens band no longer judges a warped frame; remaining: the warp's targets are in the painting's space, not the declared camera's (door reads 2.03× plan width after warp) — closure builder capped | building (closure) |

## Recently landed (for "issue with…" back-reference)

| handle | what landed |
|---|---|
| L-TRACE | aperture inside-edge tracer (aperture_trace.py): rectangle prior → normal-band search → cyclic DP closed loop; threshold = floor line; contrast-bounded trust region; arched only as a real shape; confidence that sees failure; 26 ms/wall |
| L-DELIVERY | paintings served per wall (backdrops/served/<loc>/<F>.jpg) by URL: current facing first, neighbours after first paint, visible loading state; critical path 45.3 MB → 1.44 MB; the pixel bundle is gone |
| L-SEAM | through-view: the far room's floor is sampled at each strip row's own depth and carried along its recession to the threshold; side strips continue the far frame's own band; the grey divider is gone (noodle_bar/E) |
| L-FILL | the warp's reveal fill extends each surface along its own receding line, cross-fading down the recession (no mirror, no chevron) |
| L-WINDOW | window detector on the seat's memo: 80-frame labelled corpus + evaluator; 2-D rectangle evidence, lift demoted; paired 32→35, FP 12→9, FN 16→13; servants_hall/E still a named miss (proposal merge) |
| L-WARP | mesh_warp.py: room + aperture corners pinned to the plan; wall plane separable piecewise-linear (no straight line bends: 0.00 px), five-plane homographies off-plane with C1 seams; margin-aware mirror fill; refusals by name (landmark_unreadable, aperture_count, aperture_order) |
| L-PACK | row 44 step 0: the location is a pack — packs/manor + packs/_probe ("abyssal survey station"), tools/pack.mjs + measured/pack.py, engine reads the pack (voices, lint, measure, promote, loop); manor 88/88 byte-identical; remainder listed in STATUS.md | 
| L-VOUCH | vouching follows the material: `current`/`refined`/`split-ask`/`stale-material` per facing, refinements declared in `SAID_BEFORE`; servants_hall N/S/W vouched (35 of 61 store-wide), Image 1 resolves for 41 of 88 |
| L-INK | the scaffold as ink on paper (paper ground, ink junctions, outline+hatch boxes; grid-v1 kept for committed sheets); the register names it as a line drawing; harness count clause (doors/windows painted vs ruled); 2×2 trial batch at design/batches/scaffold-ink |
| L-SEEDMASK | the own-room style image is derived: apertures and hearths filled from the wall's own fabric (mirror + cross-fade + relight, verified by the door/window instruments), so Image 1 carries materials/palette/light and no architecture; 27 seeds, flights refused |
| L-DRIFT | `derived.py`: every derived artifact registered with its invalidator; the sweep derives → validates → bakes through one door; `--derive-check` guards the publish; the 8 store-drift suite cases read freshness through one helper (suite 2020/0) |
| L-INGEST | the row-42 sprites ingested through the replicator (checkerboard keyed to alpha by detected tone + 22 px tile; 99.5% of the cames intact); `library/` is read by the page for the first time via bake-library + promoted.json |
| L-LEAVES | row 42 (3): door leaves and window casements placed in the MEASURED frames, open/closed in the document, a shut door refuses travel, a window never travels; placeholder sprites + two painter asks (dispatched) |
| L-PROD | row 43: the clean register (g5, no coordinates) is the one production composer; g4 declared as control; register tag per packet; per-register camera rate in the timings report; reconciled with row 42's lead ordering |
| L-LEAD | row 42 (1)+(2): one lead wall per room, the other three wait for it and take it as Image 1 + edge strips (the standing order now honours depends_on); windows measured off the painting (33/41 paired, median 0.64 m) with `window.unpainted` / `window.painted_width` clauses |
| L-REGISTER | the g5 register trial: 18 rolls, no separation on admissibility, camera 5/5 without the coordinate block, materials right with no style image → row 43 |
| L-BAYS | row 41: walls as fitted bays — n bays dividing W exactly, a stile in every corner (16 corner gaps at 0.000 m), openings snapped to whole bays; kitchen + bedchamber proof batches |
| L-ORIGIN | row 40 origin: rooms were ASKED from two material tables (pre/post voice table; idempotent emit never re-asked) — one home for materials, `--audit-materials` observer, `material.voice_stale` refusal, Image 1 = the room's own wall or nothing |
| L-SUPERSEDE | the loop's supersede route: a room's consistency rolls judged as one set, snap on camera miss, stands on ≥10% improvement; bedchamber ×4, servants_hall/N, garden_room/W went through it |
| L-GREEN | merged main back to 1896/0 after the four merges; rule adopted: `npm test` runs in a checkout SVC-LOOP does not write (a worktree), never in the loop's tree |
| L-CONSISTENCY | row 40: per-room consistency measure (brightness weight zero) + forced edge-seeded re-asks naming the ruling materials; 9 packets dispatched |
| L-IMAGE1 | row 40, Kabe's ruling: **Image 1 is never a wall from another room**. Proven cause - `privy_garden/N` was asked for "weathered ashlar and brick, open sky" and came back with the study seed's oak wainscot round a garden; 7 of 19 plain-glass window walls carry the seed's shields while `great_hall`, the one room allowed arms, carries less. `styleImageFor` picks the room's own agreeing wall whose ask was its ruling, or attaches NOTHING and carries the medium in words (27 of 88 get a derived picture, 51 none, 10 refused). Glass named positively; the sentence arguing with Image 1 spoken only where one exists |
| L-ORIGIN | row 40's cause, not its symptom: the five rooms' facings were COMMISSIONED from different materials (`4efd69d` 03:54 archetype composer -> `e0f02b6` 11:03 voice table, re-emitting 13 walls only; `--emit-manor` skips a painted facing, so the correction could not reach the store). Cure: one home for a manor ask's materials (`materialParts`), the blankness sentence stripped of its second fabric, `materialProvenance()` + `--audit-materials` as the observer that did not exist, `[row40:material.voice_stale]` on the promotion, `material_legacy.json` as the closing ledger (29 open), `--emit-consistency --from-ask` |
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
