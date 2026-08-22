# Eight backdrops measured — draft §5 metadata and what the pixels say

Eight approved 1536×1024 backdrops, measured off the pixels, one JSON per facing
beside this file. **Nothing here is a shipped `backdrops/<loc>/<facing>.meta.json`
and nothing consumes it.** Only `design/plan-draft/measured/` was written.

| facing | image | file |
|---|---|---|
| study/N | `backdrops/source/study-N/cand-2.png` (the selected candidate, not cand-1) | `study-N.json` |
| study/E | `backdrops/source/study-E/cand-1.png` | `study-E.json` |
| study/S | `backdrops/source/study-S/cand-1.png` | `study-S.json` |
| study/W | `backdrops/source/study-W/cand-1.png` | `study-W.json` |
| hall/N | `backdrops/source/passage-N/cand-1.png` | `hall-N.json` |
| hall/E | `backdrops/source/passage-E/cand-1.png` | `hall-E.json` |
| hall/S | `backdrops/source/passage-S/cand-1.png` | `hall-S.json` |
| hall/W | `backdrops/source/passage-W/cand-1.png` | `hall-W.json` |

`hall` is the fixture's room id for what the plan calls the CROSS PASSAGE.

## How to re-run it

```
cd <repo root>
python3 design/plan-draft/measured/measure.py          # writes the 8 JSONs + _raw.json
python3 design/plan-draft/measured/summary_tables.py   # prints every table below
```

`measure_lib.py` holds the primitives (Sobel, step profiles, the vanishing-point
vote, the tint normalisation); `measure.py` holds the per-facing configuration
and the arithmetic; `summary_tables.py` reprints the tables from `_raw.json` so
the prose can be diffed against the data rather than retyped. numpy + PIL only.
Runtime about 90 s. Deterministic: the vote's pixel subsample is seeded.

---

## 0. THE CONTROL — does this pipeline reproduce the study/N draft?

Yes — four of the seven exactly, two more within a single pixel, and the
seventh is the number the whole set turns out to argue about. This pipeline was built and its rules fixed against the *method*
in `study-N-meta-draft.json`, not against its answers; nothing was tuned after
comparing.

| quantity | draft | measured here | delta |
|---|---|---|---|
| `wall_ceiling_line_y_px` | 81 | **81** | **0** |
| `wall_floor_line_y_px` | 776 | **777** | **+1** |
| `horizon_y_px` | 490 | **498** | **+8** |
| `corner_x0_px` | 147 | **142** | **−5** |
| `corner_x1_px` | 1388 | **1389** | **+1** |
| fireplace opening | 341..550, 209 px | **341..550, 209 px** | **0 px** |
| `px_per_m_at_wall` | 232.222 | **232.222** | **0** |

Where the three non-zero deltas come from, in full:

**Floor, +1 px.** Both readings are inside the same one-pixel shadow seam at the
foot of the skirting. Row means over x 600..1300 run 775 → 24.6, 776 → 22.5,
**777 → 3.8**, 778 → 18.0. The draft calls 776 "the first floorboard"; this
pipeline places the line on the darkest row of the seam, 777. Same feature, one
row apart, 0.004 m.

**Corners, −5 / +1 px.** The right corner agrees with the draft's 4× zoom read
of the vertical edge (1390) to the pixel. On the left the ceiling-line step
strength at row 81 runs 138 → 7, 140 → 9, **142 → 21**, 144 → 41, 148 → 53
against a mid-wall reference of 70.4: the transition is soft over ~6 px and this
pipeline's threshold (25 % of the mid-wall step, sustained 10 columns) fires at
the first column of the ramp while the draft's eye picked a column further in.
The independent vertical-edge witness lands at 140. The corner is real and it is
at 140–147; the span is 1247 px against the draft's 1241, 0.5 %.

**Horizon, +8 px — and this is not a rounding difference, it is the finding.**
Region by region the vote gives floor (778, **496**), ceiling (766, **500**),
side walls (710, **527**); the draft's three were (768, 486), (754, 498),
(748, 516). Floor and ceiling agree within 10 and 2 px. The adopted value
differs because of the adoption rule: the draft adopts 490, this pipeline adopts
the edge-pixel-weighted mean of the three regions, 498, so that a thin dark side
band cannot outvote 30,000 floor edges.

One methodological departure, and it is necessary. The raw vote is captured by
degenerate edges: an exactly vertical edge is perpendicular to the ray from
*every* point on its own column and so votes for a whole line of candidates. Run
unfiltered on study/N's side-wall bands the vote returns **x = 52** — the panel
stiles, not a vanishing point. Discarding edges whose tangent lies within 15° of
horizontal or vertical fixes it (side walls then vote 710, 527, near the draft's
748, 516). Without that filter no side-wall number in this set is meaningful.

**And there is a sharper instrument than the vote, which the draft does not
run.** The side walls meet the ceiling along lines parallel to the view axis, so
they converge on the principal point, which lies on the horizon. Fitted robustly
over the 61 columns outside each corner they give residuals of **0.29–0.34 px**
— and they put study/N's horizon at **y 524**, 26 px below the vote. See §F below.

---

## 1. The whole set

Bold cells are the load-bearing ones. Everything with `_px` in it was read off
the pixels; the only assumed quantities in the table are the three calibration
sizes, and column `conf` says how much to trust each.

### A. Everything measured

| facing | source | ceil y | floor y | horizon y | horizon x | corner x0 | corner x1 | corner span px | corner mid | dado rail y | rail above floor px | calibration_px | ceiling-ramp VP (x,y) | ramp resid px |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `study/N` | study-N/cand-2.png | 81 | 777 | **498** | 773 | 142 | 1389 | 1247 | 765.5 | 563 | 214 | 209 | 757.8, 524.4 | 0.30 / 0.29 |
| `study/E` | study-E/cand-1.png | 110 | 778 | **514** | 798 | 171 | 1365 | 1194 | 768.0 | 570 | 208 | 470 | 749.8, 536.6 | 0.30 / 0.29 |
| `study/S` | study-S/cand-1.png | 103 | 731 | **442** | 761 | 179 | 1355 | 1176 | 767.0 | 554 | 177 | 177 | 774.4, 503.3 | 0.30 / 0.30 |
| `study/W` | study-W/cand-1.png | 82 | 777 | **465** | 753 | 142 | 1385 | 1243 | 763.5 | 563 | 214 | 214 | 767.9, 531.5 | 0.29 / 0.29 |
| `hall/N` | passage-N/cand-1.png | 64 | 812 | **425** | 776 | **null** | **null** | - | - | 582 | 230 | 230 | - | - |
| `hall/E` | passage-E/cand-1.png | 237 | 677 | **496** | 770 | 592 | 942 | 350 | 767.0 | 541 | 136 | 136 | 771.4, 448.8 | 0.30 / 0.34 |
| `hall/S` | passage-S/cand-1.png | 46 | 880 | **503** | 796 | **null** | **null** | - | - | 620 | 260 | 260 | - | - |
| `hall/W` | passage-W/cand-1.png | 293 | 649 | **490** | 757 | 576 | 945 | 369 | 760.5 | 527 | 122 | 272 | 759.9, 476.6 | 0.29 / 0.33 |

### B. Everything derived

| facing | calibration feature | conf | px/m at wall | px/m at bottom | eye height m | storey m | nearest floor m | implied camera m | plan camera m | implied wall width m | plan wall m | key_tint | key_dir |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `study/N` | fireplace opening 0.90 m wide | MEDIUM-HIGH | **232.22** | 437.8 | **1.201** | **2.997** | 2.339 | 4.41 | 3.60 | 5.37 | 5.45 | `#c89663` | L-BELOW |
| `study/E` | door opening 2.00 m tall | HIGH | **235.00** | 454.0 | **1.123** | **2.843** | 2.256 | 4.36 | 4.09 | 5.08 | 4.80 | `#c88f5e` | R-BELOW |
| `study/S` | dado rail 0.90 m above floor | LOW | **196.67** | 396.1 | **1.469** | **3.193** | 2.585 | 5.21 | 3.60 | 5.98 | 5.45 | `#c8a88e` | C-ABOVE |
| `study/W` | dado rail 0.90 m above floor | MEDIUM-LOW | **237.78** | 426.0 | **1.312** | **2.923** | 2.404 | 4.31 | 4.09 | 5.23 | 4.80 | `#c8986f` | L-BELOW |
| `hall/N` | dado rail 0.90 m above floor | MEDIUM-LOW | **255.56** | 395.5 | **1.514** | **2.927** | 2.589 | 4.01 | 1.95 | - | - | `#c8b6a2` | R-ABOVE |
| `hall/E` | dado rail 0.90 m above floor | LOW | **151.11** | 440.8 | **1.198** | **2.912** | 2.323 | 6.78 | 6.00 | 2.32 | 2.60 | `#c8baa6` | C-ABOVE |
| `hall/S` | dado rail 0.90 m above floor | MEDIUM-LOW | **288.89** | 399.2 | **1.305** | **2.887** | 2.565 | 3.54 | 1.95 | - | - | `#c8baa8` | L-ABOVE |
| `hall/W` | door opening 2.00 m tall | HIGH | **136.00** | 456.8 | **1.169** | **2.618** | 2.242 | 7.53 | 6.00 | 2.71 | 2.60 | `#c88953` | C-BELOW |

### C. Implied focal length

| facing | px/m at wall | standpoint AS RULED FOR THIS RUN m | px/m x that | vs 1024 px | standpoint IN standpoints.tsv NOW m | px/m x that | vs 1024 px |
|---|---|---|---|---|---|---|---|
| `study/N` | 232.22 | 3.60 | **836** | -18.4 % | 4.35 | **1010** | -1.4 % |
| `study/E` | 235.00 | 4.09 | **961** | -6.1 % | 4.09 | **961** | -6.1 % |
| `study/S` | 196.67 | 3.60 | **708** | -30.9 % | 3.85 | **757** | -26.1 % |
| `study/W` | 237.78 | 4.09 | **973** | -5.0 % | 4.09 | **973** | -5.0 % |
| `hall/N` | 255.56 | 1.95 | **498** | -51.3 % | 2.15 | **549** | -46.3 % |
| `hall/E` | 151.11 | 6.00 | **907** | -11.5 % | 6.00 | **907** | -11.5 % |
| `hall/S` | 288.89 | 1.95 | **563** | -45.0 % | 2.15 | **621** | -39.3 % |
| `hall/W` | 136.00 | 6.00 | **816** | -20.3 % | 6.00 | **816** | -20.3 % |

as ruled: spread 498..973 px, mean 783, sd 166

against standpoints.tsv as it stands now: spread 549..1010 px, mean 824, sd 159

`px_per_m_at_wall × implied_camera_wall_m` is 1024 by construction, so the
columns above are `px_per_m_at_wall ×` **the plan's** standpoint instead. Read
them as: *how far the drawn camera is from where the plan stands it, expressed
as a lens.*

**`standpoints.tsv` was rewritten while this run was in progress** — commit
385b1db, "the lens pinned, the standpoint law" — and four of the eight moved:
study/N 3.60 → 4.35, study/S 3.60 → 3.85, hall/N and hall/S 1.95 → 2.15. The
measurement was ruled against the first set, so both are reported. Nothing read
off the pixels changes; only the comparison does. The per-facing JSONs carry
both in `_plan`.

**Every one of the eight is short of 1024 on either standpoint set, i.e. every
wall is drawn smaller — further away — than the plan stands the camera.** Two
families, and the new standpoints narrow the gap without closing it:

- **The study is close, and `study/N` is now nearly exact.** Against the new
  4.35 m standpoint `study/N` gives **1010 px, 1.4 % from 1024** — the pinned
  lens and this backdrop agree. `study/E` and `study/W` are 5–6 % short on
  either set. Only `study/S` is badly out (708 / 757 px), and its scale is the
  set's least certain (§5).
- **The two axial corridor views** (`hall/E` 907, `hall/W` 816) are 11 % and
  20 % short — the end wall is drawn from 6.8 m and 7.5 m against the ruled
  6.00 m.
- **The two transverse passage views** (`hall/N` 498/549, `hall/S` 563/621) are
  the worst in the set by a wide margin. The prompt stood the camera **1.95 m**
  from an 8 m wall (the file now says 2.15 m); the pixels put it at **4.01 m**
  and **3.54 m**. Those two frames are not close-up transverse views at all —
  they are ordinary room views of a panelled wall. See §4 item 3.

### D. Eye height

| facing | `study/N` | `study/E` | `study/S` | `study/W` | `hall/N` | `hall/E` | `hall/S` | `hall/W` |
|---|---|---|---|---|---|---|---|---|
| m | 1.201 | 1.123 | 1.469 | 1.312 | 1.514 | 1.198 | 1.305 | 1.169 |

min 1.123 (`study/E`), max 1.514 (`hall/N`), spread 0.391 m, mean 1.287, sd 0.133, asked for 1.83


**Eye height is the intention's "consistent eye height", and across eight
independent generations it is consistent to ±0.20 m around 1.29 m — and not one
of them is the 1.83 m every prompt asked for.** Spread 0.391 m, 30 % of the
mean. The row-4 probe found study/N at 1.232 m and asked whether to keep the low
camera on the remaining seven; the answer from the pixels is that the generator
kept it without being told, on all seven, every time, and never once got within
0.30 m of 1.83.

The spread is not evenly distributed, and most of it is an artefact of *which
horizon you believe* rather than of the drawing. Recomputed on the ceiling-ramp
horizon of §F instead of the vote, the study's four facings give **1.088, 1.027,
1.158, 1.032 m — a spread of 0.131 m instead of 0.346 m, 2.6× tighter.** If a
single eye height has to be written into the project, the ramp horizon is the
better basis and the number is close to **1.05 m**.

### E. Storey height

| facing | `study/N` | `study/E` | `study/S` | `study/W` | `hall/N` | `hall/E` | `hall/S` | `hall/W` |
|---|---|---|---|---|---|---|---|---|
| m | 2.997 | 2.843 | 3.193 | 2.923 | 2.927 | 2.912 | 2.887 | 2.618 |

min 2.618 (`hall/W`), max 3.193 (`study/S`), spread 0.576 m, mean 2.912, sd 0.149, asked for 2.80


**Storey height is the set's best-behaved number.** Seven of the eight sit
between 2.84 and 3.19 m, six of them within 0.09 m of 2.92 m, against a ruled
2.80 m — so the generator drew a room about **4 % taller** than briefed and drew
it that way consistently. Unlike eye height, storey height does not depend on
the horizon at all (it is two horizontal lines and the scale), so this column is
the cleanest evidence in the file that the eight images share a scale.

The one outlier is **`hall/W` at 2.618 m**, 0.30 m below the set mean and the
only facing under 2.80. Its calibration is a HIGH-confidence one (the door
opening's ruled 2.00 m height), so this is a statement about the drawing: the
west end wall of the passage is painted short. The alternate calibration on the
door's 1.00 m width would give 2.80 m exactly — which is the size of the aspect
error in that opening, not a reason to prefer the other ruler.

### F. Horizon, region by region

| facing | floor vote (x,y,edge px) | ceiling vote | side-wall vote | adopted y | ceiling-ramp VP y | ramp - vote px | ramp - vote m of eye |
|---|---|---|---|---|---|---|---|
| `study/N` | 778, 496, 30000 | 766, 500, 7790 | 710, 527, 1675 | **498** | 524.4 | +26 | +0.114 |
| `study/E` | 826, 516, 30000 | 734, 507, 11316 | 756, 518, 2508 | **514** | 536.6 | +23 | +0.096 |
| `study/S` | 756, 423, 30000 | 772, 479, 12682 | 760, 499, 2127 | **442** | 503.3 | +61 | +0.312 |
| `study/W` | 748, 452, 30000 | 770, 503, 8241 | 760, 525, 1574 | **465** | 531.5 | +66 | +0.280 |
| `hall/N` | 776, 425, 28450 | - | - | **425** | - | - | - |
| `hall/E` | 770, 532, 30000 | 774, 455, 25929 | 752, 491, 6145 | **496** | 448.8 | -47 | -0.312 |
| `hall/S` | 796, 503, 18357 | - | - | **503** | - | - | - |
| `hall/W` | 756, 503, 30000 | 760, 469, 16067 | 740, 457, 1691 | **490** | 476.6 | -13 | -0.099 |


The vote's x column is the squareness test and it passes everywhere: adopted x
runs 753–798 against a frame centre of 768, and the corner midpoints run
760.5–768.0. **Every camera is square to its wall and unrolled.**

**The biggest single finding in this run: the frames are not internally
consistent about their own horizon.** On the six facings with corners in frame,
two independent measurements of the same vanishing point disagree by up to
**66 px**:

- the **vote**, over Sobel edges in three disjoint regions, as the draft lays
  down; and
- the **ceiling-ramp intersection**, which fits the two side-wall/ceiling
  junctions outside the corners and intersects them. Those junctions are lines
  parallel to the view axis, so they must converge on the principal point, which
  must lie on the horizon. The fits are not marginal — **residuals of 0.29 to
  0.34 px over 61 columns per side, on all six** — which makes this the single
  sharpest geometric statement available in any of these images.

The two disagree by **+26, +23, +61, +66, −47 and −13 px**. That is 0.10 to
0.31 m of eye height. Both are honest measurements of the same pixels, so what
they prove is that **the generator's ceiling geometry and its floor geometry do
not share a vanishing point** — the frames are painted, not projected. `study/W`
is the worst: its ceiling says 531 and its floor says 452.

The vote is *adopted* in the JSONs because it is the method the draft rules and
because it draws on three disjoint regions. The ramp figure is recorded on every
facing in `_horizon_votes.ceiling_ramp_intersection` and in `_flags`, and on the
evidence of §D above — where it makes the study's four eye heights agree 2.6×
better — **the Navigator should consider making the ramp the adopted rule.**

### G. Light

| facing | brightest 21x21 px | key_tint | floor alt | mid-wall L alt | mid-wall R alt | sobel bright-side deg | third tilt frame | third tilt wall |
|---|---|---|---|---|---|---|---|---|
| `study/N` | 451, 696 | `#c89663` | `#c8a083` | `#c87d39` | `#c8b5ad` | 86.8 | -13.53 | -2.66 |
| `study/E` | 1525, 996 | `#c88f5e` | `#c8a184` | `#c87b3c` | `#c8b6ad` | 107.2 | -5.11 | -0.34 |
| `study/S` | 774, 242 | `#c8a88e` | `#c8a79c` | `#c8bbb6` | `#c8bab6` | 125.5 | +3.03 | +1.69 |
| `study/W` | 10, 992 | `#c8986f` | `#c8a084` | `#c5bfc8` | `#c87635` | 106.8 | +14.43 | +4.12 |
| `hall/N` | 1374, 10 | `#c8b6a2` | `#c8936a` | `#c87025` | `#c5c1c8` | 97.5 | -16.52 | -13.04 |
| `hall/E` | 769, 316 | `#c8baa6` | `#c8ae9c` | `#c8c5c1` | `#c8c6c4` | 126.5 | -1.74 | -4.13 |
| `hall/S` | 152, 10 | `#c8baa8` | `#c89775` | `#c1bfc8` | `#c86115` | 86.3 | +25.94 | +25.39 |
| `hall/W` | 814, 536 | `#c88953` | `#c89c79` | `#c86f2f` | `#c86c27` | 121.2 | +3.68 | +4.40 |

`key_tint` is the mean RGB of the dominant light's bounce off the ceiling — the
one broad near-neutral diffuser every facing has — sampled from a 400 px window
centred on the x of the brightest 21×21 patch, in the 62 rows above the
wall–ceiling line, normalised so the largest channel is 200. Alternates on the
floor and on both mid-wall bands are in each JSON's
`_light.key_tint_alternates`.

**A single `key_tint` per facing is a compromise on six of the eight**, and the
alternates say by how much. `study/W`'s two mid-wall bands are `#c5bfc8` (cool
blue-grey, left) and `#c87635` (hot orange, right) — the same wall, one wall,
two lights, 60 units of red apart. `hall/S` runs `#c1bfc8` against `#c86115`.
`study/N` runs `#c87d39` against `#c8b5ad`, which is the two-light reading the
row-4 probe already recorded.

**`key_dir` reads UL on exactly one of the eight.** Only `hall/S` puts its
brightest patch in the left third *and* above the horizon, and it is also the
only facing with a large positive third-tilt (+25.9 against the +2.0 that
`mechanisms.spec.mjs`'s light clause and gate (e)'s `min_third_tilt` require).
Four facings pass the +2.0 clause (`study/S` +3.0, `study/W` +14.4, `hall/S`
+25.9, `hall/W` +3.7); **four fail it**, and `hall/N` fails it hardest at −16.5.
Gate (e)'s Sobel bright-side estimator returns 86–127° across the set against
the 115.5° a constructed UL45 control gives; on no facing does it and the
brightest-patch reading tell the same story, because most of these frames have
two lights and the statistics average them.

---

## 2. The door between the study and the cross passage

Two facings paint it, and they are the two sides of the same door. **No other
facing of the eight paints a doorway** — checked on all eight: `study/N` has a
fireplace, `study/S` three window bays, `study/W` and `hall/N` blank panelling,
`hall/E` an end window, `hall/S` a tapestry. Nothing that could be mistaken for
an opening, and nothing that needed measuring and was not measured.

| | `study/E` (study side) | `hall/W` (passage side) |
|---|---|---|
| `opening_x0_px` | **660** | **698** |
| `opening_x1_px` | **874** | **825** |
| `opening_y0_px` (head) | **308** | **377** |
| `opening_y1_px` (threshold) | **778** | **649** |
| width / height px | 214 × 470 | 127 × 272 |
| aspect, ruled 2 : 1 | 2.196 : 1 | 2.142 : 1 |
| at that facing's px/m | 0.91 m × 2.00 m | 0.93 m × 2.00 m |
| centre x vs frame centre 768 | 767.0 | 761.5 |

**These are the WALL-PLANE rectangles, and that distinction is load-bearing.**
Both openings are stone-cased with a visible reveal, so there are two rectangles
in the pixels: the front one, in the wall plane, and a back one 13 px
(`study/E`) and 25 px (`hall/W`) behind it. A generic strongest-edge detector
picks whichever carries the bigger step — on `study/E` it picks the case's
*outer* moulding at x 918, which is 44 px outside the opening. Every edge was
therefore read off a one-pixel luminance profile and the profile that decided it
is quoted verbatim in each JSON (`_measured_px.how_opening_x0` … `how_opening_y1`).
In short:

- **`study/E` x0 = 660** — the left jamb's front face holds luminance ≈74 to
  x 657, lifts to a lit arris at 658–659 (111, 139), falls to a one-pixel shadow
  line at **660** (17); the lit reveal runs 661–665 and the dark passage begins
  at 666. **x1 = 874** — mirror: reveal ends 872, shadow line 873–874 (35, 17),
  right jamb's front face holds ≈90 from 875. **y0 = 308** — stone face above
  holds ≈65 to y 307, shadow line at **308** (19.7), lit arris 309–310, soffit
  312–320 at ≈28, dark passage from 321. **y1 = 778** — the jamb plinths stand
  on the wall–floor line, read independently at 778.
- **`hall/W` x0 = 698** — front face ≈85 to 697–698, shadow line 699 (45),
  firelit reveal 700–703 (99, 191, 170, 152), opening interior 704. **x1 = 825**
  — reveal 820–823, shadow line 824–825 (67, 31), face ≈80 from 826. **y0 = 377**
  — the case above sits in shadow ≈20 to y 374, darker line at 376 (13), lit
  soffit 378–401, opening's dark head 402. **y1 = 649** — the floor runs
  continuously through this opening so there is no step inside it; the plinths'
  feet sit on the end wall's floor line, 649.

**Both openings are painted with the wrong aspect** — 2.20 : 1 and 2.14 : 1
against the plan's 2 : 1. The height is adopted as the ruler in both (the longer
dimension, and each prompt says "2.0-metre-tall"), which makes the drawn widths
0.91 m and 0.93 m rather than the ruled 1.00 m. Calibrating on the width instead
would move `study/E` to 214.0 px/m (−9 %) and `hall/W` to 127.0 px/m (−7 %).
That spread is the honest error bar on those two facings' whole scale.

---

## 3. Where a room's two views of the same wall disagree

Nothing in this set is literally the same wall seen twice — each facing looks at
a different wall. What the plan *does* make identical is opposite walls' widths,
so that is the test:

| pair | plan width | implied from corner span | disagreement |
|---|---|---|---|
| `study/N` (5.37 m) vs `study/S` (5.98 m) | both 5.45 m | 1247 px and 1176 px | **0.61 m, 11 %** — and study/S is the wider despite the *narrower* span, because its scale is the set's least certain |
| `study/E` (5.08 m) vs `study/W` (5.23 m) | both 4.80 m | 1194 px and 1243 px | **0.15 m, 3 %** — but **both are 6–9 % over the ruled 4.80 m** |
| `hall/E` (2.32 m) vs `hall/W` (2.71 m) | both 2.60 m | 350 px and 369 px | **0.39 m, 16 %** — the two axial views of one corridor cannot agree how wide it is |
| `hall/N` vs `hall/S` | 8.00 m | no corners in frame | not measurable, correctly |

The `study/E` / `study/W` row is the interesting one. Their two corner spans are
1194 and 1243 px — and `study/N`'s span for a **5.45 m** wall is 1247 px. **The west wall's span comes within 4 px of the north wall's although the plan
makes it 0.65 m narrower.** `study/W` also matches `study/N` to within 1 px on its
ceiling line (82 vs 81), floor line (777 vs 777) and dado rail (563 vs 563).
Those two frames are the same camera in the same room pointed at two walls the
plan says are different sizes, and the generator drew them the same size.

---

## 4. Where the generator ignored the brief

In descending order of how much it matters.

**1. Eye height, on all eight.** Asked for 1.83 m every time; drew 1.12–1.51 m,
mean 1.29 m. Never within 0.30 m. The row-4 probe found this on `study/N` and
called it "good for the picture" because it brings the frame-bottom floor cut in
to 2.36 m. It is now confirmed as the generator's settled habit across eight
independent generations: `nearest_visible_floor_m` runs **2.24–2.59 m** on all
eight, where the project's 24 mm previews put it at 3.08 m. *The camera has feet*
on every one of these frames.

**2. The camera stands too far back, on all eight** (§C). Worst on the two
transverse passage views.

**3. `hall/N` and `hall/S` are not close transverse views.** Both prompts said
1.95 m from the wall and "do NOT invent or squeeze room corners into frame". The
second instruction was obeyed perfectly — no corner in frame either side, so
`corner_x0_px` and `corner_x1_px` are **null** in both JSONs and no wall width
was invented. The first was not: the measured standpoints are **4.01 m** and
**3.54 m**. The tell is direct and needs no calibration at all — the panelling's
dado module measures 230 px on `hall/N` and 214 px on `study/N`, whose camera is
4.41 m away. At a genuine 1.95 m the module would be more than twice `study/N`'s.

**4. `study/W`'s wall is the wrong width** (§3), and `study/S`'s room reads
0.5 m deeper than `study/N`'s from the same standpoint: its wall–floor line sits
at y 731 against y 777 for the opposite wall of the same room.

**5. The light contract is not met on four of eight** (§G). The `key_dir` UL45
that `mechanisms.spec.mjs` and gate (e) expect is present on `hall/S` alone.

**6. `hall/E` is the weakest image in the set.** Its far end wall is 350 px of a
1536 px frame, dark and distant; every number for it is soft, and its 440 px of
storey against `hall/W`'s 356 px for the same corridor at the same nominal
standpoint is the largest unexplained geometric disagreement in the run.

**What the generator got right, and it is worth saying.** Every camera is square
and unrolled (§F). Storey height is consistent to ±0.15 m across eight
independent generations (§E). Both cornerless facings are honestly cornerless.
Both doorways are openings with no leaf, as instructed. The panelling module
holds to ±7 % across all eight, which is why the four featureless facings can be
calibrated at all.

---

## 5. What is assumed, and how much of this rests on it

Three facings' scale rests on a **ruled** size (the plan's door opening, the
plan's corridor width). One rests on an **argued** size — `study/N`'s fireplace
at 0.90 m, the draft's refutation of the brief's 1.4 m, which this run
re-verified: the opening is 209 px, and at 1.4 m that would make the storey
4.66 m. **Four rest on a transferred module and are the weak part of this file.**

The module is the panelling's dado-rail top above the floor. Measured on the
four facings that carry a sized feature it comes out:

| facing | rail px | that facing's px/m | module m |
|---|---|---|---|
| `study/N` | 214 | 232.22 (fireplace 0.90 m) | 0.921 |
| `study/E` | 208 | 235.00 (door 2.00 m) | 0.885 |
| `hall/W` | 122 | 136.00 (door 2.00 m) | 0.897 |
| `hall/E` | 136 | 134.62 (end span 2.60 m) | 1.010 |

**Adopted 0.90 m, spread 0.885–1.010, i.e. ±7 %.** `study/S`, `study/W`,
`hall/N`, `hall/S` and `hall/E` inherit that ±7 % directly into their
`px_per_m_at_wall` and hence into every metre in their rows.
`calibration_confidence` in each JSON says so in words, and `study/S` is marked
LOW twice over: it has no rail on its own glazed wall, so the rail had to be read
on the side-wall returns at the corner columns where the step strength is 5.6
against 43.9 on `study/N`. **If any number in this file is wrong, `study/S`'s
scale is the first place to look**, and its 3.19 m storey and 5.98 m wall are
both consistent with its px/m being 8–10 % low.

---

## 6. The four things that matter most

1. **The eight frames do not agree with themselves about their own horizon.**
   Ceiling geometry and floor geometry give different vanishing points on all six
   facings where both can be measured, by up to 66 px — and the ceiling-ramp fit,
   at 0.3 px residual, is far the sharper of the two. Adopting it instead of the
   vote makes the study's four eye heights agree 2.6× better. That is a rule the
   Navigator can change today, on evidence, without regenerating anything.
2. **The camera is a metre and a quarter off the floor on every one of the
   eight, and 1.83 m was asked for every time.** The intention's consistent eye
   height exists — 1.29 ± 0.13 m by the vote, 1.05 ± 0.05 m over the study by the
   ramps — it is simply not the height the briefs name. Decide which number the
   project keeps before any sprite is scaled against it.
3. **The door rectangle is measured and it is 660..874 × 308..778 on `study/E`
   and 698..825 × 377..649 on `hall/W`** — wall-plane rectangles, every edge read
   off a one-pixel profile that is quoted in the JSON. Both are painted with the
   wrong aspect (2.20 : 1 and 2.14 : 1 against 2 : 1), so the two ruled
   dimensions of the same opening disagree by 9 % and 7 % about that facing's
   scale. Pick which dimension rules before the click target ships.
4. **`hall/N` and `hall/S` are not the frames that were ordered.** They obeyed
   the hard instruction (no corners invented) and ignored the camera: 4.01 m and
   3.54 m from the wall against a ruled 1.95 m, which is why their implied focal
   lengths are 498 and 563 px against 1024. Every other facing is 5–20 % off; those
   two are 45–51 % off, and a shelf sprite placed on `hall/N`'s quiet middle band
   will be sized against a wall that is twice as far away as the plan believes.
