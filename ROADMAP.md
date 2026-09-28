holo-emitter: a Myst-like browser world you walk through, built from generated paintings and code, where one world document is the truth and the picture is its projection.

Rows are the project's own work units (`design/intention.md` "The spec list"; detail in `design/architecture.md` under each row's heading). Handles like L-PACK are in `design/registry.md`.

## M1 — The M0 demo: two rooms, four facings, a drawer that opens, a key you did not know existed

- [x] R1 Static shell, holodeck grid, entities and full world behaviour on placeholders; the drawer and key work (rows 1–2; architecture "What exists (rows 1–2…)")
- [x] R2 The replicator is the ingester: gates, masks, two-state registration (row 3; architecture "The replicator (`replicator/`)")
- [x] R3 Storefront speaks to the player; fullscreen; keyboard and assistive access (rows 7, 8, 10; `design/batches/row7-storefront/`, architecture "index.html chrome")
- [ ] R4 Real M0 sprites (desk, drawer, key, coin) produced and ingested; the placeholders retired (row 4; architecture "What row 4 inherits — the list")
- [ ] R5 Integration and acceptance: every blueprint §12 check passes; README GIF (row 5; `design/blueprint.md` §12–13)
- [ ] R6 Published, plus the blind comparison of §12.10 (row 6; blueprint §12.10)

## M2 — The painted manor: 22 rooms, walkable, painted wall by wall

- [x] R7 The room has corners, a ceiling and a type; one lens; where the body stands (rows 11, 20, 26; architecture "The room…(row 11)", "The lens (row 20)")
- [x] R8 The manor is a document; walkable end to end: 56 exits, stairs you climb, open thresholds, passages that keep orientation, the "where am I" readout (rows 12, 13, 15, 19, 24, 25; architecture "The manor walkable (rows 15 and 19)", "The stair a player can use (row 25)")
- [x] R9 A painting promoted onto a wall; the painted door governs travel (rows 21, 27; architecture "The painted promotion (row 21)", "The painted door governs (row 27)")
- [x] R10 The production composer: ink-on-paper scaffold, clean g5 register (rows 23, 34, 43; architecture "The register production composes (row 43)")
- [x] R11 Room consistency: edge-seeded seams, the lead wall, walls as bays, painted windows and placed leaves, material voices (rows 29, 38, 40, 41, 42; architecture under each row)
- [x] R12 Instruments: boarded-ceiling horizon, pipeline stopwatch, the snap, flight attachment (rows 32, 33, 35, 39)
- [x] R13 Paintings served per wall by URL; the critical path cut from 45 MB to 1.4 MB (row 45; registry L-DELIVERY)
- [~] R14 Live builders to land or close: the floor-line reader, the traced aperture as THE aperture, the warp as the one exit (registry "Live builders": B-FLOOR, B-TRACE-WIRE, B-WIRE)
- [ ] R15 Fix the crash in `deepViewOf`/`sameWallImageFor` on `entrance_court/S` (`STATUS.md` "Found, and NOT fixed here")
- [ ] R16 Open rows: the voice sweep never leaves the study (14), verification completeness from emit sites (18), a leaf a frame can eat (28) (`design/intention.md` spec list)
- [ ] R17 The plan amends to the painting (the hearth); waits on your redline (row 22; `design/intention.md`)
- [ ] R18 Verdicts owed by you: five AWAITING KABE batches and eight `+` junctions (`design/approvals.log`; architecture "The `+` junction guard finds eight")

## M3 — Any location is a pack

- [x] R19 A location is a folder of data; the engine reads the pack (row 44 step 0; `packs/INVENTORY.md`, registry L-PACK)
- [x] R20 Packs beyond the manor: probe station, cyberpunk, hospital, underground, liner (`packs/`; registry RUN-HOSPITAL, L-LONGROOM)
- [x] R21 The deep-view standard, the through-view threshold, run walls, the facing playbook (registry L-DEEPDRAFT, L-THRESHOLD, L-RUNWALL, L-PLAYBOOK; `design/playbook-facings.md`)
- [ ] R22 One-command pipeline: `build packs/<name>`, `--reask`, `--rebuild`, derived standpoints, parallel painters (`design/audit/two-room-proof-2026-08-29.md` "What is still not clean")
- [ ] R23 Registry brought current: RUN-HOSPITAL finished 12/12; SVC-SITE is up again (`design/registry.md`)

## M4 — Engine rooms and the object catalogue

- [x] R24 Rooms as engine geometry from the plan, walkable in 3D (`lab/room3d/`)
- [x] R25 Objects catalogue-first: text retrieval from Sketchfab/Objaverse, a TripoSR-generated mesh on a miss, grounded and gated; graded (`lab/catalogue/ENGINE.md`, `lab/objects/SCORECARD.md`)
- [x] R26 Placement by wants: wall, corner, pair, around; a back wants a solid wall (`lab/catalogue/ENGINE.md` "Wants")
- [x] R27 The Scranton office as a pack, furnished on demand in 109 s (`packs/office-1`, `TIMELINE.md`)

## M5 — Painted shells and the zero-asset library

- [x] R28 The painting is the texture: the muniment room walkable from its four facings; you graded it "Phenomenal" (`lab/painted/NOTES.md`)
- [?] R29 The same room from its schematic with zero assets; P flips between the two (`lab/painted/procedural.js`, NOTES "The zero-asset build")
- [ ] R30 A reliable calibration tool, so painted shells scale to the other 30+ rooms without hand-measuring (`tools/paint-calibrate.py`; NOTES "Limits seen")
- [ ] R31 A real light bake for the code room: a path-traced "stand still" mode or baked lightmaps (NOTES "Not yet")
- [~] R32 Paint over the code room, then project it back, with holo-emitter-codex as the painter: the render packet is built to its contract; the painting waits on your yes to image spend (NOTES "The render packet", "What painting over the code room would need")
- [ ] R33 An upscale pass so painted walls hold up at arm's length (NOTES "Limits seen")

## Later

- [ ] R34 pattern-buffer and construct behind the envelope: replica conformance (row 17; `design/intention.md` "What we're making", blueprint §4b)
- [ ] R35 The drawer and the key in the walkable 3D rooms: furniture you can open and things you can take (blueprint §3; row 2's behaviour carried over)
- [ ] R36 The catalogue as a project of its own: a local index, CLIP re-rank, licences, serving (`lab/catalogue/ENGINE.md` "The catalogue as a project of its own", "What stays open")
- [ ] R37 A GPU-class mesh model for thin-featured hero objects (Hunyuan3D, TRELLIS); the held oak desk (`lab/objects/SCORECARD.md` "Recommendation"; `library/promoted.json`)
- [ ] R38 The full wants solver, seeded and prioritised (`lab/catalogue/ENGINE.md` "Wants")
- [ ] R39 Light as a layer (row 37; `design/specs/36-plan.md` §6.1)
- [ ] R40 The speaker layer (row 9) and iOS fullscreen (row 16) (`design/intention.md`)
- [ ] R41 The register driven by the playbook's tags; deep facings composed at draw time (registry L-PLAYBOOK; `design/audit/deep-view-scenarios-2026-08-30.md`)
- [ ] R42 Test Build 2: the coaching inn (row 31; `design/audit/two-room-proof-2026-08-29.md`)
