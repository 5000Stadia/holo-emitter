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
