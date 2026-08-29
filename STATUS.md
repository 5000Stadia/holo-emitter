# Row 44 step 0 — builder 1, stopped at the clause-10 cap

Two commits on this worktree. What follows is what is done, what is proved, and
what the second builder inherits — named precisely enough that it needs no part
of this conversation (clause 6).

## Done

**The inventory.** `packs/INVENTORY.md`. One grep pass, 957 hits across 44
files, classified mechanically: 62 path constants, 477 vocabulary constants, 31
anchor heights, 17 era/medium sentences, 32 fixture paths, 338 comment-only.
619 load-bearing. Per-file line numbers are in the file.

**The pack format.** `packs/manor/` — `pack.json`, `plan.json` (copied from
`fixtures/demo-study/plan.json`), `voices.json` (14 voices, 5 anchors, 36
materials, `MATERIAL_BINDING`, `MATERIAL_PART_OF_KEY`, `SAID_BEFORE`, exported
by `tools/export-pack.mjs` with a lossless round-trip check), `world.json` (era
sentence, medium sentence, the ruler `chair_rail` at 0.95 m above the floor, the
sill/head/door/light conventions, the lint's ruler table, the refusal word lists
and the redacted-correction sentence, and the batch / fixture / store / readings
directories and the viewer's world query).

**The loader.** `tools/pack.mjs` — `loadPack(name)`, `activePack()`,
`activePackName()`; `--pack <name>` / `--pack=<name>`, else `HOLO_PACK`, else
`manor`. Three refusals, all made before an image can exist:

1. a pack whose `world.json` declares no `ruler` (or no `kind`, or a
   non-positive `height_m`, or a kind its `voices.json` does not define);
2. a room in the plan that resolves to no voice — **refused with the room named**,
   never defaulted into another world's materials;
3. a voice naming an anchor the pack does not define.

**What reads the pack now.**

| file | what it stopped declaring |
|---|---|
| `tools/room-voices.mjs` | `VOICES`, `ANCHORS`, `ROOM_VOICE`, `ARCHETYPE_FALLBACK`, `TYPE_FALLBACK`, `MATERIALS`, `MATERIAL_BINDING`, `SAID_BEFORE`, `MATERIAL_PART_OF_KEY`, `ANCHOR_M`, `WINDOW_SILL_M`, `WINDOW_HEAD_M`, `LIGHT_MODULE_M`, `INTERIOR_FABRIC`, `REDACTED_CORRECTION`, and the four carrier-frame literals. 1555 lines → 957; the reasoning stayed, the table left. |
| `tools/make-scaffold.mjs` | 25 substitutions: `CHAIR_RAIL_M`, `DOOR_HEAD_M`, 9 plan paths, 4 batch dirs, 5 `?world=nav-manor` queries, the two stamped chair-rail fallbacks (now the pack's `RULED_ANCHOR`), and `g4ManorPrompt`'s two era sentences. |
| `tools/frame-language.mjs` | the era sentence in both shapes it is stated, the `Gate anchor:` ruled height, and the whole medium sentence. |

## Proved

- **88 prompts byte-identical.** `tools/proof-pack.mjs` walks every facing the
  pack's plan holds, derives the camera with `deriveMeta` (deterministic, no
  browser, no model — clause 7), composes the production ask through
  `manorPrompt`, and writes one file per facing. Run on the pre-move code
  (`git stash`) and on the moved code: **88 of 88 identical, 0 differing, no
  file only on one side.** That is the move proved as a move.
- **Lint clean.** `python3 design/plan-draft/measured/prompt_lint.py <the 88>` →
  **0 of 88 refused.** (The bare `prompt_lint.py` over the whole store reports 28
  of 504 refused; that is the pre-existing historical baseline — `cand-6` asks
  with no `Gate anchor:` line — and is untouched by this work, which changed no
  prompt file and no lint clause.)
- `node --check` clean on every touched `.mjs`; `resolveAll` on the pack's plan
  resolves all 88 facings with **0 fallbacks**; `assertMaterialsComplete` passes;
  re-running `tools/export-pack.mjs` through the new loader leaves
  `voices.json` byte-identical (the round trip closes).

## Remaining — for the second builder

1. **`design/plan-draft/measured/prompt_lint.py` does not read the pack yet.**
   Everything it needs is already authored in `packs/manor/world.json`:
   `rulers[]` (the `RULERS` table: `match`, `size_m`, `name`),
   `refusals.interior_fabric` (= its `INTERIOR_FABRIC`),
   `refusals.panelling` (= `PANELLING`), `refusals.rationed_line`
   (= `ARMORIAL_LINE`), `refusals.entitled_to_rationed` (= `ENTITLED_TO_ARMS`).
   It needs a small Python twin of `tools/pack.mjs` (same three refusals, same
   `--pack` / `HOLO_PACK` / `manor` resolution) and `re.compile(...)` over those
   strings. The regex sources in `world.json` were copied verbatim, so the lint's
   behaviour must not change — assert that by re-running it over the store and
   getting the same 28 of 504.
2. **`packs/_probe/` is not written.** Row 44's acceptance needs a synthetic
   two-room pack in another idiom that validates, emits 8 lint-clean packets
   naming none of `manor`, `oak`, `wainscot`, `1660`, `chair rail`, `heraldry`,
   and is REFUSED when its ruler is removed. The instrument for both halves is
   already here: `node tools/proof-pack.mjs --pack _probe --out <dir> --forbid
   "manor,oak,wainscot,1660,chair rail,heraldry"` exits 1 on any offence, and
   deleting `ruler` from its `world.json` must make `loadPack` refuse. For the
   contrast: the manor's own 88 asks contain 183 "manor", 176 "oak", 156
   "wainscot", 176 "1660", 112 "chair-rail". The probe's ruler is the audit's
   own step-1 problem — a named continuous horizontal at a stated height that a
   painter will draw and `row23_lib.py` can find; `world.json`'s `rulers[]`
   already whitelists a door head at 2.00 m.
3. **The remaining constants**, all listed with line numbers in
   `packs/INVENTORY.md`: `promote-backdrop.mjs` (plan path default),
   `style-seed.mjs` (readings dir, plan path), `edge-seed.mjs`,
   `plan-projection.mjs`, `validate-plan.mjs`, `validate-fixtures.mjs`,
   `emit-evolution.mjs`, `evolution-arms.mjs`, the two `grant-*.mjs`, and the
   measured Python (`measure.py`, `row23_lib.py`, `row23_run.py`, `row35_snap.py`,
   `row41_bays.py`, `room_consistency.py`, `window_measure.py`,
   `door_measure.py`, `derived.py`, `timings_report.py`).
4. **Left deliberately.** `make-scaffold.mjs`'s legacy single-room study arms
   (its `--emit-study` / g1 prompt text around the old lines 1577–1793) still
   type the manor's materials; they are control arms no emitter dispatches, and
   moving them would have risked the byte-identity proof for no measured gain.
   `join(ROOT, "design", "batches", "row23-scaffold")` — the row directory
   without `/manor` — was left alone on purpose: it names a ROW, not a location.
   Comment-only hits (338) were left: clause 8 forbids the theme in code, and a
   docblock narrating why a clause exists is history.

## Cap

Builder 1 stopped at the 40-turn ceiling of production law clause 10 with the
priority order its brief set: inventory → pack files →
make-scaffold/frame-language/room-voices → proof. `prompt_lint.py` and the probe
were the next two items and are the second builder's first two.
