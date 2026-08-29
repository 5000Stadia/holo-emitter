# Row 42b — the window detector against a human label

Brief: `design/audit/window-detector-memo-2026-08-29.txt`, steps 1–5.

## 1. The two window-test harness regressions

- `test_window_measure.py::test_the_ruled_band_matches_the_one_the_asks_name`
  scraped `WINDOW_SILL_M = <literal>` out of `tools/room-voices.mjs`, which no
  longer declares them — it reads them from `packs/<name>/world.json`'s
  `world.conventions`. The case now asks node for the export itself (with the
  pack file as the fallback), so it is still an assertion across the language
  boundary and not a regex on a file that moved.
- `tests/playwright/windows.spec.mjs::promoteMeta` staged `tools src fixtures
  index.html` into its scratch tree and ran the real promotion there; the
  promotion reaches the active pack through `tools/pack.mjs`, so every staged
  case died on a missing `packs/`. `packs` is now staged with the rest.

`python3 design/plan-draft/measured/test_window_measure.py` — 9/9 green.

## 2. The corpus and the evaluator

`design/plan-draft/measured/window_labels.json` — 80 frames, 48 windows, 46
frames with none: every promoted wall in `backdrops/` (63 manor + 8
cyberpunk-2) and all 9 `servants_hall/E` candidates. Each rectangle is the
INNER GLAZED APERTURE, read by eye off the picture at 1/3 scale on a 128 px
grid and multiplied back. `_how` in the file says it in full.

`design/plan-draft/measured/window_eval.py` scores the detector against it:
order-preserving assignment (not nearest-centre), paired within 0.35 m of
centre, false positives, false negatives, median centre error in metres.

## 3–4. Before / after

                             before         after
    labelled windows         48             48
    paired                   32             35
    false positives          12             9
    false negatives          16             13
    median centre error m    0.059          0.056
    p95 centre error m       0.187          0.187
    walls with exact count   69             70

Acceptance: `back_office/E` and `noodle_bar/S` are now read; `dining_parlour/W`
and `garden_room/N` (lattice 0.143 / 0.142) are read; `great_hall/S`'s left
pair are proposed for the first time. NOT MET on `servants_hall/E`: the wall
still reads one candidate whose centre is 0.53 m off the window, because a
bright field of plaster beside the light is merged into it — the head/sill
agreement now asked of every merge does not separate them there. It is a
proposal-stage defect on that wall and is the first thing the next pass owes.

## 5. Untouched

`tools/promote-backdrop.mjs` (windows stay recorded in `window_evidence`, never
gated) and `mesh_warp.py`. The memo's greedy nearest-centre pairing lives in
`mesh_warp.py:558-589` and so was out of scope here; the order-preserving
assignment in this row is the evaluator's own.
