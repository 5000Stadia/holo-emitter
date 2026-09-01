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
| B-FLOOR | theme-neutral floor-line reader — capped at ba0a323 on `floor-line-witnesses`: reader + 14 tests green, NOT wired (corner witness spurious; manor regression 4/61); STATUS.md on the branch names the two next steps | capped, awaiting builder 2 |
| RUN-HOSPITAL | the three-room hospital pack (`packs/hospital-3`, reception ↔ treatment room ↔ ward, handrail ruler 0.90 m): 12 packets emitted 2026-08-30 02:00, painter typed-in via its pane, loop `tmux hospital-loop`; every step and hang-up logged in `design/batches/hospital-3/STEPS.md` | painting |
| B-TRACE-WIRE | the traced aperture polygon becomes THE aperture: promotion writes meta.openings[].polygon (+confidence, head_kind), the warp pins its corners, the page clips the through-view and fits the leaf to it; a low-confidence trace falls back to the rectangle, recorded — capped | building |
| B-WIRE | warp wired as the one exit (merged); first held-wall passes promoted 0: ask file fixed, lens band no longer judges a warped frame; remaining: the warp's targets are in the painting's space, not the declared camera's (door reads 2.03× plan width after warp) — closure builder capped | building (closure) |

## Recently landed (for "issue with…" back-reference)

| handle | what landed |
|---|---|
| L-CAUSES | the issue-cause ledger and its five classes (identity-poor caches, theme-in-code, two homes for one truth, concurrent writers, live-state mutation): `design/audit/issue-causes-2026-08-30.md` — Kabe's 'take note of when issues came up and why' |
| L-DEEPDRAFT | the deep-view standard (Kabe's mechanism, verbatim in `tools/deep-draft.py`): the close painting shrunk UNIFORMLY at true proportion (a circle stays a circle), mechanical stretch filler at the margins, and one image-gen pass to recreate the picture — centre kept exactly, filler replaced with the room continuing. Replaces the warp's anisotropic pinning (the ovalled disc) and the derived collage for deep facings |
| L-LONGROOM | the long-room laws (underground-2): rooms counted in unit boxes; a facing views the first ruled line across its full-width open edges; a crossed edge is neither carrier, threshold nor missing hole; the deep facing is itself the way on (up arrow / `way_` exits); a deep view's Image 1 is the SAME WALL promoted, with the camera move in metres; a side wall's corners extend to its RUN's ends (`runSpanOf`) and the register says the flat wall runs off screen |
| L-RUNWALL | run-wall instruments landed: one in-frame corner + the ruled anchor read a wall that runs off the frame; the open side is a recorded `run_end`, never a pin; the warp's readings cache reads the PACK's dir (the shared-readings owed item closed); four proof walls at 0.0 px residual |
| L-PLAYBOOK | the facing-situation playbook (Kabe's ruling): `tools/playbook.mjs` `situationsOf` — 17 tags derived from the emitter's own functions, overlays compose, absences yield no tag; per-pack report (`--pack`), PACKET/manifest stamped `Situations:`, `design/playbook-facings.md` the index (code is the authority); next row: the register reads one instruction block per tag |
| L-DEEPVIEW | deterministic deep-view assembler landed (`deep_view.py`, 18 tests): merged; regeneration awaits the run walls' promotion — the uniform pinhole is the cure for the warp's anisotropic disc squish |
| L-THRESHOLD | through-view threshold, THE STANDARD (Kabe, 2026-08-30, after nine looks): far room to the leaf's plane (`PASSAGE_SHARE` 0.5 of `depth_m`), this room's floor solid to the floor line, the seam one 1 px row of randomized-transparency darkening (`SEAM_LINE_SHADE` 0.11, coordinate hash — deterministic) under a 0.55 px blur (`SEAM_LINE_BLUR_PX`); `SEAM_STYLE` "line" (hard/blur/dither/soft remain selectable); `depth_m` flows plan → promotion → meta, validator-checked |
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

## L-ENVELOPE (2026-08-30)
An anisotropic mapping ovals round-drawn objects no matter how it is achieved — smooth resample and evenly-distributed blended-line insertion move the shape's envelope identically; only the texture of the skew differs. Measured: reference disc 63x74 copied to 63x75 by the painter (perfect obedience), oval preserved. Therefore no shape-bearing reference is ever mapped anisotropically; corrections to geometry ride as drawn guide lines and words, never as pixel mappings. Supersedes nothing; closes the oval investigation of L-DEEPDRAFT.

## L-FRAME (2026-08-30)
Kabe's frame recipe, verbatim: "It should just shrink while maintaining aspect ratio then simulate the geometry to the edges and ask to fill in the gaps. Maybe cut off the corner edges in the original and just overlay the correct corner geometry as reference lines to fix." Content and geometry never mixed in one mapping: content at ONE uniform scale (a circle stays a circle), the source's wrong-camera junctions cut off, the DECLARED geometry drawn as ink guide lines to the frame edges, the painter completes. `tools/deep-draft.py --frame`; wired as the deep facing's Image 1 in `attachStyle`. First round: four complete rooms, discs 0.96–0.99; span still painted wide (the zoom-in bias) — the measured miss now rides re-asks as words.

## B-SWEEPORDER (owed, 2026-08-30)
The sweep exits a wall on its first routable roll by index; a warp-exit roll 1 beats an unread camera-PASS roll 2 (platform_far/W measured case). Owed: measure every arrival for the wall, prefer a measured PASS over any warp exit, warp only when no roll passes.

## L-TRUESHAPE (2026-08-30)
Once a deep wall has a warp round, the next ask's Image 1 is the warp's own output — architecture geometry-exact and full-frame — and the ask inverts: keep every line of architecture and the framing exactly, redraw every OBJECT in its true shape (a circle stays a circle). Composes the day's two proven behaviours: the painter re-normalizes shapes unless ordered to copy exactly, and a full-frame reference leaves nothing to zoom into. Measured: platform/E held span to −1.4% and its live disc healed to 0.939 round. Scope note on the reroll research: the words lever fixes material scale, not composition — the measured-miss sentence left span at 51–53% wide.

## L-CLOSE (2026-08-30)
Kabe, verbatim: "the smear should not need to be done to that extent after the image generation. Before is fine for reference but after it hopefully is geometrically CLOSE." The warp is a reference-maker, not a finisher: it may finish a painting only inside a small budget (every stretch scale within 0.93–1.075 and revealed fraction ≤ 0.08 — `_exit_warp`'s CLOSE gate); beyond that it only teaches — its frame and its `revealed.png` mask (saved by `mesh_warp` at the resample sites) become the next ask's reference, with every smeared pixel CUT to plain ground and the declared geometry ruled through (`deep-draft --true_shape`). Nothing the painter can copy is ever the warp's own fill.

## R-DEEPBOX (2026-08-30, finding)
Six painter rounds on the two underground deep walls falsified every reference treatment for holding the room box: uniform shrunk draft (+33%), corrected-previous (copied exactly), frame guide lines (+26-37%), measured-miss words (+51-53%), cut margins (+33%), full-frame blur-in-place (+33%/59% revealed). Constants measured across all rounds: camera/material scale reliably PASSes; object shapes are teachable (a squeezed 0.75 reference repainted at 0.95 under the object-true clause); the box recomposes by ~25-35% whenever the facing is a deep view. The residual is architectural. Two exits: (A) waive L-CLOSE for deep facings — the warp finishes them, discs land ~0.8, edges healable by one blur+regen pass; (B) deep facings stop being paintings — the renderer composes them at draw time from the promoted CLOSE wall's art inside the declared geometry, shape-true by construction, the same machinery that already draws door through-views. B kills the failure class and spends zero further rolls; the close art is already promoted and measured.


## G-PREP — the standard grow construction (2026-08-31)

[Kabe, verbatim]: "Let's lock this process in as the standard because that
corner alignment was so clean on the first try."

The straight-in grow (1x1 -> 2x1, and by extension any depth extension) is
built as a COVER-FIT PREP GUIDE (deep-draft.py grow3), superseding grow's
vp-ray/snap construction and grow2's line-draw:

1. DETECT, image-first: the 1x1's four corner lines found on the raw painting
   alone (candidate grid over slope x height, edge energy x cross-line fabric
   contrast, mirrored pairs, one shared eye row, measured-row bands, seam-hug
   launch, per-corner misfit reported).
2. CORRECT: our wireframe lines run through the DETECTED close corners toward
   the declared vp; deep corners at the declared depth ratio.
3. COVER-FIT, locked scale only (L-ENVELOPE by construction): each plane cut
   along its detected lines, uniformly scaled to the minimal size covering its
   own FRONT footprint bounded by the corrected lines, cropped at those lines.
   Never scaled to cover the far section. Back wall cover-fits the deep rect
   the same way. The middle ring stays pale wireframe gap with the
   close-to-deep corner lines drawn.
4. ASK: the fill pass FINISHES the prep guide (minimalAskText prep branch) -
   Image 1 is never framed as a style reference of another wall.

Amendments to earlier constructions remain in force where they still apply:
lights are after-assets; no dado mid-lines; molding rides the wall side.


**Amendment to G-PREP (2026-08-31, Kabe)**: "we really need to make sure...
we don't have any back wall top or bottom corner elements show up in the back
of the floor or ceiling generated image in the front 1x1 portion of the guide
image... completely eliminates the chance that there is unique horizontal
artifacting that shows up in the middle of the room." And: "This risk also
exists if there was bottom corner molding as well."

Implementation: every element edge that abuts the removed back wall or the
ring is CLIPPED before the cover scale — ceiling source stops 28px above the
detected wall-top junction, floor source starts 28px below the detected floor
junction (top and bottom molding alike), side-wall sources stop 10px short of
the vertical corner — and the locked-scale cover-up refills the difference
with the plane's own texture. Deterministic; no synthesis. Also: the deep
rect is the DECLARED geometry (declared close corners scaled toward the vp),
so the guide's far wall and the promotion instruments agree about its size;
the ring lines run detected-launch -> declared-stop.


**G-PREP r2 LOCKED with the mid-artifact guard (2026-08-31)** [Kabe, verbatim]:
"Now that is quite clean, let's lock this in as the standard methodology with
a guard to make sure we are eliminating that particular risk of mid artifact."
grow3 now refuses fail-closed any assembled guide whose front ceiling or floor
mid-span carries a row-coherent horizontal edge band (max row gradient over
5x the band median); a breach writes only a .breach debug copy. The clips
prevent; the guard proves.


## G-CHAIN — the deep-view landing chain (2026-09-01, proven on platform/E)

Generation owns texture; mechanics own geometry; the mechanics run AFTER
generation, never before (mechanical pre-fill from thin slivers manufactures
garbage - the noodle v4 lesson, Kabe: "the ceiling isn't a ceiling").

The chain: (1) PAINT free - the C-recipe prep guide coaxes a beautiful long
room at whatever depth the painter samples; (2) RECTIFY - the warp pins the
painting's own landmarks onto the declared camera (the warp teaches);
(3) ENHANCE - one roll on the rectified frame re-naturalizes the surface;
(4) the warp of the enhance roll lands inside the CLOSE budget and FINISHES
(platform/E: stretch 1.068, reveal 4.9%, residuals 0.00px - measured-path
promotion, attempts 14). Each pass shrinks the painter's deviation until the
gate accepts. Known cost: mild anisotropy on circular marks (the disc reads
slightly oval).


## Amendment — uniform-only rectification (2026-09-01, Kabe's ruling)

[Kabe]: "Yes uniform only." The warp exit's wall plane moves by ONE uniform
scale and a per-axis translation, refit by pooled least squares over every
pin — never a different stretch per axis. L-ENVELOPE applied to the exit
itself: a circle stays a circle, always; residual mismatch surfaces as reveal
margins for the enhance pass, and the instruments judge the uniform
compromise as-is. (mesh_warp.py plane mode; platform/E re-promoted at
isotropic 1.0137, reveal 7.7%.)
