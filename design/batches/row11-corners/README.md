# Row 11 batch — the room has corners

**Delivery, not a gate.** The gate for this row is `design/batches/row11-direction/`, which asks
Kabe four questions about the look before it is locked. This directory is the other half: every
facing the row changed, so the change is on the record whatever the answers turn out to be.

**Unapproved.** Delete this directory when the verdict lands; anything approved graduates to
`design/references/` with its V-stage.

Fourteen captures — the eleven states after, plus three of the same frames before, for the pairs
worth seeing side by side. Scene canvas element alone at native 1536×1024, cold `file://` load,
Chromium, no chrome, no hover: §12.6's capture spec, the same frame every hash test and the flip
test read. Grid-mode placeholder art (V1); nothing here is judged on finish.

| File | State |
|---|---|
| `01-study-N` | boot — the desk, the chair, the notebook |
| `02-study-E-door-closed` | the door wall, leaf shut |
| `03-study-S` | bare |
| `04-study-W` | bare |
| `05-hall-N` | the bookcase, the candlestick, the coin |
| `06-hall-E` | bare — and the deepest view in the demo |
| `07-hall-S` | bare |
| `08-hall-W-door-closed` | the door wall from the passage side |
| `09-study-E-door-open` | the leaf swung, the opening walkable |
| `10-hall-W-door-open` | the same door from the other room |
| `11-study-N-drawer-open-key` | the drawer open, the key revealed |
| `*-BEFORE` | `01`, `06` and `09` as they were at the parent commit (e58e3f7) — note the desk in `01-BEFORE` sits in the middle of the wall, which is where the fireplace is |

## What changed, and what licenses it

Every facing took its geometry from `fixtures/demo-study/plan.json` — the drawing Kabe approved on
2026-08-21 ("aproval on the schematic", blueprint §4b). The endless 16 m wall that every facing
shared is gone; each room now shows the wall its own plan gives it, ending in two corners, with the
side walls running back toward the viewer.

| facing | wall in view | you stand | corners at |
|---|---|---|---|
| study N, S | 5.45 m | 3.60 m | 506.4, 1029.6 |
| study E, W | 4.80 m | 4.09 m | 537.6, 998.4 |
| hall N, S | 8.00 m | 1.95 m | 384.0, 1152.0 |
| hall E, W | 2.60 m | 6.00 m | 643.2, 892.8 |

Three other things moved with it, each on a stated authority:

- **The door re-sited ~1.1 m.** `door1` on `study/E` now stands where the approved drawing puts it —
  1.1 m south of that wall's centre — where the fixture used to centre it. `design/plan-draft/
  projection.md` §1 carried this as the one disagreement between the fixture and the drawing;
  the fixture moved to the drawing, not the other way round.
- **The camera's eye height is the ruled six feet.** [HUMAN, 2026-08-20] §10's 1.83 m, which the
  grid had never adopted — it was authored at 1.6 m and quietly failed blueprint §5's own
  camera-has-feet gate. The consequence is not all good and it is the direction package's question
  1: the floor's near edge moves *out* on six of the eight facings, because §10's −8° pitch is
  modelled by nothing and it is the half that would pull it back.
- **The candlestick moved 0.25 m nearer the bookcase**, under blueprint §4's standing licence with
  the reason recorded on the object itself. The passage's real 1.95 m standpoint makes perspective
  much stronger than the 3.5 m the demo used to assume; at its old position the authored overlap
  fell to 48 crossing pixels against §12.8's floor of 50. It measures 332 now. §12.8's floor was
  not touched.

## How much of each frame changed, and why all of it is licensed

Every pixel of the grid layer moved, because the grid layer *is* the geometry. Measured against the
parent commit:

| facing | pixels changed | of frame |
|---|---|---|
| `01-study-N` | 904,305 | 57.5 % |
| `02-study-E-door-closed` | 1,006,196 | 64.0 % |
| `03-study-S` | 882,490 | 56.1 % |
| `04-study-W` | 966,146 | 61.4 % |
| `05-hall-N` | 652,404 | 41.5 % |
| `06-hall-E` | 1,246,313 | 79.2 % |
| `07-hall-S` | 626,031 | 39.8 % |
| `08-hall-W-door-closed` | 1,257,348 | 79.9 % |
| `09-study-E-door-open` | 1,005,369 | 63.9 % |
| `10-hall-W-door-open` | 1,255,292 | 79.8 % |
| `11-study-N-drawer-open-key` | 904,660 | 57.5 % |

The two corridor facings change most (80 %) because they change most: a 2.60 m wall at 6.00 m fills
a sixth of the frame and the converging side walls fill the rest. `hall/N` and `hall/S` change least
because their 8.00 m wall is closest to the 16 m one they replace.

**A percentage is not evidence that a change was intended**, so the row does not rely on one. What
holds these frames is a committed test that predicts, per facing, the corner columns, the floor
line, the eye line, the foreshortened floor rows and every staged entity's baseline and drawn
height — from literals typed by hand off the approved `standpoints.tsv`, not from the code that
draws them — and measures each off the render. A geometry change nobody intended goes red on the
facing it broke.

## Known, and in front of you rather than at the probe

- **The desk and chair moved out of the study's chimney breast**, and that is why `01` and `11` look
  different from anything you have seen before: the desk was standing with 91% of its footprint
  inside the fireplace. Interim, on the Navigator's ruling — the direction package's question 7 is
  where you settle it — and the plan refuses that class of placement now instead of noting it.
- **The grid paints no fireplaces, windows or side-wall doorways.** Five of these eight frames show
  plain wall where the building's own plan holds something: the study's fireplace is 2.2 m of the
  north wall in `01`, `03` has two windows, `06` has one dead centre, and the passage's north and
  south walls each carry a door. Sixteen more appear edge-on in the side walls. Nothing walkable is
  lost — every door still works from the facing it is on — and it is far less wrong than the old
  picture, which had no side walls at all. Row 4's painted backdrops are where they arrive; the full
  list is computed from the plan and held by a test, so none of them can quietly go missing.
- **The rooms have no ceiling.** The corners run off the top of frame: the plan carries no room
  height. That is the direction package's question 2, with a rendered pair.
