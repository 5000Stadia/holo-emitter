# The warp exit — builder, stopped at the clause-10 cap

`route_exit` now has ONE door, and it is a correction rather than a judgement:
the audit's "sensor, not judge" and Kabe's "correct, don't re-ask", made the
default route. The old chain (row 35's snap -> row 36's void repair -> row 32's
tolerance ruling) is behind `--legacy-exits` for one release.

## What the door does

`exit: warped` — `mesh_warp.warp_wall` on the candidate, the frame to
`backdrops/source-warped/<loc>-<F>/warped.png` with its record and its ask
(`warp.json`, `warped.prompt.txt`) beside it; the WARPED frame re-measured into
round `meshwarp` (a full reading, not a re-pointed one: the warp moves the
camera numbers, so the old reading describes a picture that no longer exists);
promotion on `--camera-source declared`, because the painting was MOVED onto that
camera rather than excused for missing it; and the correction's own numbers on
the meta at `measured_room.warp` = `{pins, residuals, worst_segment,
revealed_px}` — recorded, never gated.

Refusals are the warp's three and nothing else — `landmark_unreadable`,
`aperture_count`, `aperture_order`. Those are content misses (the painting does
not show what the plan rules), so they re-ask, carrying the clause as the
correction. Everything the old chain refused on — reveal budget, stretch budget,
a horizon the ruler disagrees with — is a number in the record now.

`promote-backdrop.mjs`: a document carrying `_warp` licenses the declared camera
without the suspect-painting family fence, and does NOT wear `suspect_perspective`
or `tolerance_ruling` — a warped painting's perspective was corrected, not
excused. `validate-fixtures.mjs` checks that pair by name
(`[warp:meta.warp_record_incomplete]`, `[warp:meta.warped_not_suspect]`).

`mesh_warp.py`'s sweep moved to `meshwarp-sweep/` so a round directory
(`^[a-z0-9]+$`) and an experiment's evidence cannot land on one path.

## The clocked run — `--warp-held`, 21 held walls, 0 promoted

The route runs end to end; the store did not move, and the two reasons are
measured, not guessed:

| how many | what stopped it |
| --- | --- |
| 7 | `[row39:stair.ask_unreadable]` and its neighbours — the promotion could not read the ask beside the warped frame. FIXED after the run: the candidate's `.prompt.txt` is now copied beside `warped.png`. Not re-run. |
| 6 | the SCALE band: the re-measured warped frame reads e.g. `great_hall/E` at 841.4 px against the ruled 1024 ±8%. The warp pins the shell onto the declared box, and the ruler still reads the painting's own module off the result. **This is the open clause** — either the anchor's target column is not being pinned, or the scale gate must read the warped frame through the same map. It is the next builder's first measurement. |
| 5 | `meshwarp.aperture_count` / `landmark_unreadable` on walls with a real content miss — correct behaviour, and they re-ask with their clause. |
| 5 | open facings (`entrance_court/N`, `/W`, `privy_garden/E`, `/W`, `entrance_approach/N`): no ceiling line, no room corners. A guard added AFTER the run skips them, so their run-state corrections still carry a landmark clause from the pre-guard pass; the next sweep re-decides them. |

Nothing was published, and the bake ran once (over nothing, since nothing
promoted).

## Tests

`design/plan-draft/measured/test_warp_exit.py` (7 cases, new): a held wall leaves
through `exit: warped` and promotes on the declared camera in the warp's round;
the record reaches both the document and the run state; a warp refusal re-asks
with its clause and leaves no file behind; a promotion refusal does NOT buy a
roll; `--legacy-exits` and the module flag still route through the snap; once per
candidate, and `force` for `--warp-held`. Also green: `test_mesh_warp.py`,
`test_row40_supersede.py` (26), and the loop's dry pass.

---

# Row 44 step 0 — builder 2, stopped at the clause-10 cap

Builder 1's STATUS named three things remaining. All three are done or started;
what is left is named below precisely enough to need no part of this
conversation (clause 6).

## Done

**1. `prompt_lint.py` reads the active pack.** It typed the ruler table as nine
tuples of one house's vocabulary and four refusal word lists as literals. All of
it is `world.json`'s now, reached through a new `design/plan-draft/measured/pack.py`
— the Python twin of `tools/pack.mjs`: same `--pack` / `HOLO_PACK` / `manor`
resolution, same three refusals (no ruler; a room with no voice, by name; a voice
naming an undefined anchor), plus `Pack.refusal()`, `Pack.convention()` and
`Pack.why()` which refuse by name rather than defaulting. The refusal PROSE moved
with the lists: every clause message now quotes the pack's own `_why` instead of
naming privy_garden, oak panelling or a c.1660 house. `row23_run.py`'s one
outside caller reads `prompt_lint.interior_fabric()` rather than a module global.

**2. `packs/_probe/`** — ABYSSAL SURVEY STATION KEEL-9, an invented idiom sharing
no word with the manor. Two rooms (`wet_lab`, `pump_gallery`), 8 facings, one
pressure hatch between them, one pressure port each. Its ruler is a **welded
gasket band at 1.20 m above the deck** — a named continuous horizontal at a
stated height, which is the audit's own step-1 problem answered in another
language. Its own era sentence, medium sentence, conventions, ruler table,
refusal word lists and paths.

**3. Load-bearing constants moved**, by file:

| file | what it stopped typing |
|---|---|
| `design/plan-draft/measured/prompt_lint.py` | `RULERS` (9 tuples), `INTERIOR_FABRIC`, `PANELLING`, `ARMORIAL_LINE`, `ENTITLED_TO_ARMS`, and the theme prose in five findings |
| `design/plan-draft/measured/measure.py` | `CHAIR_RAIL_M = 0.95` → `RULER_M` from the pack (31 uses), `"name": "chair_rail"` → `RULER_KIND`, `ROW23_BATCH` |
| `design/plan-draft/measured/row23_lib.py` | `CHAIR_RAIL_M = 0.95` → `RULER_M` (5 uses), the bare `rail_above / 0.95`, the batch-path sentence |
| `design/plan-draft/measured/row23_run.py` | `MANOR`/`MANIFEST`/`STATE`/`RETRIES_FILE` → `BATCH` from `paths.batch_dir`, `OUT` → `paths.readings_dir`, `PLAN` → the pack's plan |
| `tools/promote-backdrop.mjs` | the `fixtures/demo-study/plan.json` default, `RULED_DOOR_M` → `conventions.door_width_m` (added to both packs) |
| `tools/proof-pack.mjs` | gained `--prove-refusals` (below) |

## Proved

- **88 of 88 byte-identical.** `node tools/proof-pack.mjs --pack manor` after
  every file: **0 files differ** against the pre-move tree.
- **Manor lint unmoved.** `prompt_lint.py` over the whole store: **28 of 504**,
  the pre-existing historical baseline, before and after. Over the pack's own 88
  asks: **0 of 88 refused**.
- **The probe composes and lints.** Verbatim:
  `proof-pack: pack \`_probe\`, 8 facings written to …` /
  `ruler gasket_band at 1.2 m above the deck` /
  `era   circa-2190 abyssal survey station` /
  `none of 6 forbidden word(s) appears in any of the 8 asks` (exit 0), and
  `0 of 8 prompt(s) refused.  [pack: _probe]` under `HOLO_PACK=_probe`.
- **The ruler refusal is an instrument, not a claim.**
  `node tools/proof-pack.mjs --pack _probe --prove-refusals` copies the pack
  beside itself, deletes `ruler` from the copy's `world.json`, and requires BOTH
  loaders to refuse it by name. Both do; exit 0 only when both do (clause 11).
- `node --check` clean on both touched `.mjs`; every touched `.py` parses and
  imports.

## Remaining

1. **`window_measure.py`** — `WINDOW_SILL_M = 0.90` / `WINDOW_HEAD_M = 2.00`
   (lines 79–80) are `conventions.window_sill_m` / `window_head_m` in both packs
   already. Left alone ONLY because `test_window_measure.py:207` asserts the
   literal by regex over the source text; moving the constants means rewriting
   that assertion to compare against the pack, and that is a test change this
   builder ran out of cap to verify.
2. **`src/placeholders.js` (66 hits)** — NOT MOVED, and here is the ruling it
   needs. Its manor words are overwhelmingly **sprite ids and nouns** (`oak-desk`,
   `wainscot-panel`): library DATA, not engine, and clause 8's line is what the
   ENGINE BRANCHES ON. The move that is actually owed is the small set the code
   TESTS: any `if (id.includes("oak"))` / era string it composes (lines 152, 154,
   904 are era sentences; 303 is a path). Those are engine; the id table is a
   library and belongs beside the pack, not inside `src/`. Next builder: grep for
   the branches, move those, leave the table.
3. **The rest of `packs/INVENTORY.md`** — `style-seed.mjs`, `edge-seed.mjs`,
   `plan-projection.mjs`, `validate-plan.mjs`, `validate-fixtures.mjs`,
   `emit-evolution.mjs`, `evolution-arms.mjs`, the two `grant-*.mjs`, and the
   measured Python `row35_snap.py`, `row41_bays.py`, `room_consistency.py`,
   `door_measure.py`, `derived.py`, `timings_report.py`, `row32_holdout.py`.
4. **One engine string still names the theme**: `make-scaffold.mjs`'s
   `armorialLine()` and `frame-language.mjs`'s negative glass sentence type
   "armorial shield, crest, badge, monogram, motto". The RATION is the pack's
   (`refusals.rationed_line` / `entitled_to_rationed`); the SENTENCE is not yet.
   It costs the byte-identity proof to move, so it wants its own commit with the
   proof re-run.
5. **The full playwright suite has not been run** (clause 10 runs it once at
   merge). `tests/playwright/room-voices.spec.mjs` shells out to `prompt_lint.py`
   and is the one that matters first.

## Cap

Builder 2 stopped at the 40-turn ceiling of clause 10, in the order its brief
set: lint → probe → constants → proof after each.
