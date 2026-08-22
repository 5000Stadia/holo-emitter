# Row 21 — the painted promotion

Plan for spec-list row 21. The target and its done clause live in `design/intention.md`; nothing is
copied here.

## What this row stands on, verified

- `design/plan-draft/measured/` — `measure.py` (cand-1 configs for seven facings, cand-2 for
  `study/N`), `measure_lib.py`, `gate.py`, eight per-facing JSONs, `miss-ledger.json` from the
  round-20 hand run. Re-runnable, numpy + PIL only.
- `backdrops/source/<facing>/cand-2.png` — eight 1536×1024 candidates, each with its
  `cand-2.prompt.txt`. `study/N`'s is Kabe-approved (`APPROVED.md`, `design/approvals.log`
  2026-08-21).
- `tools/plan-projection.mjs` `metaForFacing` already resolves tier 1 =
  `backdrops/<loc>/<facing>.meta.json` and no such file exists yet; `tools/validate-fixtures.mjs`
  already carries `META_KEYS` including `measured` and `openings`, and the
  `[row20:meta.one_lens_measured]` arm that judges a measured meta against the ±3 % band.
- `src/renderer.js` `render` already draws `entry.image` when the backdrops map carries one, and
  `apertures()` derives every opening from a staged leaf.
- Nothing under `backdrops/<location>/` exists; `index.html` builds its backdrops map with metas
  and no images.

## 1. The gate, and the ledger it owes

**Extend `measure.py` to the cand-2 arrivals** as a second per-facing configuration block
(`CFG2`), selected by `--round cand2` (the default; `--round cand1` keeps the committed cand-1
run reproducible). The windows are re-tuned per image, because a detector pointed at a moved
feature reports whatever is at its old coordinates — the round-20 scar.

**The ruler is chosen by a rule fixed before the answer, not by which answer agrees.** Priority,
written into the module and printed in every facing's output:

1. a **ruled-size feature painted in the wall plane** — the door opening (1.00 × 2.00 m), the
   fireplace opening (0.90 m), a window bay (0.90 m between its outer mullion centre-lines: the
   sizes the plan rules and the facing's own prompt restates. Of a two-dimension feature the
   longer dimension is read, per the committed method;
2. where the facing carries none, the **panelling module transferred from the approved frame of
   the same room** — `study/N`'s dado-rail-above-floor, 213 px at 232.222 px/m ⇒ 0.9172 m;
3. where neither exists, the **plan's own ruled wall width**, adopted only with the circularity
   said out loud (`implied_wall_width_m` cannot then be reported);
4. otherwise **WITHHELD** — no number.

**A reading is withheld, not reported, when it cannot decide the verdict.** Three triggers, each
mechanical: a derived quantity that is physically impossible (storey outside 2.0–4.0 m, eye
outside 0.8–2.2 m, a corner on a facing whose own prompt forbids one); no ruler at tier 1–3; or
**a tier-1 anchor the painting did not draw to rule** — three bays that must be equal on a wall
parallel to the image plane and are not, so the ruler's own spread exceeds the ±3 % band and the
choice of bay would choose the verdict.

**The control runs every time.** `study/N` cand-2 is measured by the same code and must return
232.222 px/m and the committed ceiling/floor/corner/fireplace pixels; a run whose control has
moved prints its verdicts as void.

Then `gate.py` unchanged over the re-measured JSONs, per-facing PASS/FAIL/WITHHELD with numbers.

**`design/plan-draft/measured/misses.jsonl`** — one JSON object per line, beside the gates, per the
production law: `facing`, `candidate`, `gate`, `measured` (the ruler, its pixels, px/m, the implied
focal), `target`, `delta_pct`, `verdict`, `trust`, `why` (the diagnosed cause, not a restatement of
the delta), `correction` (the arithmetic a re-ask carries), `status` (`open` until its cause is
baked in), `baked_in` (null, or the commit that made the cause impossible). The existing
`miss-ledger.json` is the round-20 prose record and is superseded by this file, which is
machine-readable; it is deleted in the same commit rather than left as a second home.

**The re-asks are the Navigator's.** This row sends the fail list with per-facing deltas over
SendMessage to `main` and tasks no mailbox.

The expected shape, from the measurement already done by hand at plan time (the run is what rules):
seven candidates, none admitted, three of them WITHHELD for want of a ruler the prompt itself
forbade. The row therefore promotes `study/N` and leaves seven facings on the grid, which is what
the done clause provides for.

## 2. Promotion

`backdrops/study/N.png` — a byte copy of the approved `cand-2.png` (`cmp` asserts it), the §2
layout's artifact. `backdrops/study/N.meta.json` — a complete §5 record, every `_px` value from
the measurement:

- `floor_line_y`, `horizon_y` (the **ceiling-ramp** intersection, which the Navigator ruled at
  row 20 over the vanishing-point vote), `px_per_m_at_wall`, `px_per_m_at_bottom`,
  `corner_x0_px`/`corner_x1_px`, `key_tint`, `key_dir`, `calibration_ref`, `calibration_px`
  — measured;
- `wall_width_m`, `camera_wall_m`, `storey_height_m`, `facing_type` — the plan's, because a wall's
  width and a standpoint's distance are building facts the drawing rules and the painting must
  answer to (`design/plan-draft/projection.md`'s own authority table);
- `measured: true`, `provisional: false`, `focal_px`, `nearest_floor_m`, `camera_id`, `backdrop`,
  `wall_continuous`, `wall_segments`, `openings: []` (this facing paints no doorway).

The meta is written by a committed generator, `tools/promote-backdrop.mjs`, so it is derived from
the measurement rather than typed — and re-running it is a byte no-op, asserted by test.

**The page has to have the pixels without a network call.** `tools/bake-backdrops.mjs` writes
`backdrops/baked.js` — `window.HOLO_BACKDROPS = { "study/N": { src: "data:image/png;base64,…" } }`
— from the promoted PNGs only. A `file://` page drawing a `file://` image taints the canvas in
Chromium and every hash test reads the canvas back; a `data:` URI does not. The bake is
byte-deterministic and its staleness is tested exactly as the fixture bake's is. Cost, stated
because the production law asks for numbers: one facing is 3.4 MB of base64 for a 2.6 MB PNG, so
eight would be ~27 MB — the JPEG lever is named as residue for the row that promotes the rest, with
the fidelity question it opens.

`index.html` decodes each baked image before the first paint and puts it in the backdrops map
beside the meta the bake already writes. A decode failure takes the existing product-voiced fault
path, not a silent grid.

## 3. The navigation boot fixture, and the doorway as a building fact

`fixtures/nav-manor/` — `world.json` (the two locations, their facings, the two exits, **no
entities**), `staging.json` (no placements), `narration.json`, `viewstate.json`, `plan.ref` (the
repo-relative path of the plan it is projected from — the manor plan has one home and this fixture
does not copy it; the bake refuses a fixture with neither `plan.json` nor `plan.ref`).

`index.html` boots it by default — that is what the live link serves — and takes `?world=<id>` to
boot any baked fixture. `helpers.appUrl` appends `?world=demo-study`, so every existing spec keeps
the world it was written against, and this row's own specs open the bare URL, which is the one a
visitor opens.

**A doorway with no leaf is architecture.** `deriveMeta` emits `openings[]` for every plan opening
on the facing — `{ via, x, y, w, h }` in scene px, the x-extent projected through
`groundplane.xAtScale` from the plan's own rect and the height the ruled 1.00 × 2.00 m door
opening gives at wall scale, standing on the floor line — and a measured backdrop's meta carries
the same field read off its pixels. `apertures()` then resolves, per exit:

1. the staged leaf's placement rectangle where the world stages one — unchanged, and still
   knowledge-filtered, because a leaf is an entity;
2. otherwise the facing meta's opening for that `via` — a building fact, and **not**
   knowledge-filtered, because the wall has a hole in it whatever the player knows and a painted
   backdrop shows it either way.

`handleGo` refuses on a leaf that is not open, as now, and permits passage through an opening no
entity fills. The fixture validator gains the clause that keeps that from being a typo's escape
hatch: an exit's `via` must resolve **either** to a transition entity staged where the exit names
it (the existing clause) **or** to an opening the facing's meta carries; naming neither is a
finding. Ledger case per arm, tokens `[row21:exit.via_unfilled]` and
`[row21:meta.opening_missing]`.

## 4. Through an opening, the destination room

The row's one real rendering task, and one device serves painted and grid alike: inside every
aperture the renderer draws **the destination facing's own picture** — its baked image if it has
one, else its grid drawn from its own meta — scaled by `d_dest / (d_here + d_dest)` about the
opening's centre with the two horizons aligned, clipped to the opening, and dimmed. The
destination facing is the exit's `arrive_facing` in the room it leads to: what you see through the
door is what you will be looking at when you have walked through it.

It is drawn inside step 1, with the backdrop, because a doorway is building content and a §12.6
flip pair must not differ by what is behind a door. The destination is drawn **without its own
apertures**, so looking through one door never draws a second; that is a stated narrowing, not an
oversight. `renderer.render` needs no new input: the backdrops map it already receives holds every
facing's meta and image.

Ledger case `[row21:aperture.through_view]`, broken in a staged tree and measured in the picture:
with the mechanism removed the opening returns to near-black, so the case measures the luminance
and the pixel-difference inside the opening rect against the destination's own frame. The
round-20 number this replaces is on the record — 69,120 near-black pixels, 4.4 % of `study/E`.

If it exceeds the budget, the dimmed-slice half ships alone and the scaled-to-depth device is
recorded as residue.

## 5. What is checked

- §12.2 (determinism) and §12.8 (mechanisms) green on the painted meta, both engines — including
  the grid-mode clause, which now has a painted facing beside it to be distinguished from.
- §12.5's (ii) — corners measured off the image against `wall_width_m × px_per_m_at_wall` — is the
  clause that has had no subject since row 11 wrote it; `study/N` is its first, at 1247 px against
  1265.6 (1.5 %). Its (v) arm (drawn metre lines) is scoped to the facings that still draw a grid,
  because a painted facing draws none, and the scoping is asserted rather than left to a
  coincidence.
- The walkthrough at navigation scope: the bare URL boots, all four study facings turn, the door
  is walked through in both directions, and the arrival is the room the document names — by real
  clicks and keys, at desktop and at 390×844.
- `design/batches/row21-promotion/` — `capture.mjs` committed beside the frames, re-rendered
  byte-identical by `plan.spec` per the row-20 pattern: every painted facing, the four grid study
  facings for the pair, and one through-doorway frame. Captured before the close. The README
  carries the round-20 residue this row inherits as its named questions — the turning translation
  (2.38 m per 90° press) and the doorway void it closes — in the product's voice where a player
  would read it.
- `design/approvals.log` gains this batch's `pending` entry, and `plan.spec`'s row-20 `pending`
  requirement becomes a **positive** assertion against that file: the gate retires when the ledger
  records a verdict, not when a directory stops existing. That is round-7 finding G2's root, named
  in `design/architecture.md` as row 21's.

## Edges — what this must not touch

- **`world.json` gains no coordinate.** The opening rect is meta, derived from the plan; truth
  names an exit and the thing that fills it.
- **No `plan.json` edit.** The drawn digest is anchored to the plan Kabe signed; the door
  opening's 1.00 × 2.00 m is blueprint §11's ruling and lives in the projection module with its
  citation, not as a new plan field that would move the approval stamp.
- **No threshold moves to admit a candidate.** The ±3 % band and its 1010 px reference are
  blueprint §5's; a candidate that misses is logged, not admitted.
- **`design/specs/`, `design/intention.md` rows other than 21, and `replicator/` are not this
  row's.** The asset seat's lane (`backdrops/source/`) is written only by the promotion copy into
  `backdrops/<loc>/`.
- **The demo fixture's world is unchanged** — the furnished study is what §12.1 walks, and this
  row adds a second world beside it rather than editing it.
- Sprites, the flip test, and row 4's assets are not touched; the painted world is empty by
  design, which is what keeps a placeholder plank off a painted wall.

## Rounds

Low gear, two examination rounds budgeted; a third is flagged to the Navigator before it opens.
