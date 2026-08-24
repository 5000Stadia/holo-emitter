# Row 34 — The breakout evolution run

Row 34 of `design/intention.md`. The target and its done clauses live there; this spec carries the
variant space, the probe walls and why they are those two, the roll budget declared before anything
is dispatched, the fitness the existing instrument computes, and **every selection rule, written
down before generation 1 returns** — the discipline `assignment.json` established at row 23 and the
one thing that makes an evolutionary search evidence rather than a story told afterwards.

**Status: MACHINERY AND GENERATION-1 PACKETS BUILT. NOTHING DISPATCHED.** Dispatch is the
Navigator's act (§9), and the generation-1 packets sit emitted and unsent until it is taken.

---

## 0. What this experiment is, and what it cannot say

## 0a. The governing frame, and the fence around it

**Ruled mid-allocation [HUMAN, 2026-08-24, verbatim, and now in row 34 itself]:** *"Visual reference
for visual orientation generalities, text for well defined articulation of anchored requirements and
detail of the reference generalizations."*

That is a **division of labour** and the row's space carries it as its own arm — `v7`
CROSS-REFERENCED (§1): Image 2 kept and asked for orientation only, every anchored number in words,
and each of those words naming the element of Image 2 it articulates.

**And it is also the reading lens.** The report orders the arms along one axis — how much of the
anchored precision the *image* is asked to carry — so the conclusion reads as **where does precision
belong**, not as which recipe won (§5.6a).

**The fence, ruled the same day [HUMAN, verbatim]: *"Yeah but test my direction against our tests as
well."*** So:

- `v7` runs on terms **byte-identical** to every other arm: the same 2 rolls per wall, the same
  opaque ids, the same blind detector configuration, the same pre-committed selection rules, the
  same arm-versus-control comparison at the same α.
- **It gets no structural advantage anywhere.** It is not seeded into generation 2 by name, it has
  no survival guarantee, and it is not weighted in any ordering. The only arm with a standing seat
  is the **control**, which is the yardstick and never a candidate for the crown.
- `row34_fitness.py` may name **no arm id but the control's**, and `evolution.spec.mjs` asserts that
  structurally: an arm literal in the scorer is a finding.
- The report must be able to print *"the cross-referenced frame lost to `<arm>` by N at p < X"* as
  plainly as the reverse, and one of the planted-fixture cases in §8 makes `v7` the loser
  specifically to prove the scorer says so.
- **The spectrum's ruled midpoint is a position on the spectrum, not a privileged one.** `v7` versus
  `v2` is named as the run's sharpest *comparison* (§5.6a) because the two put every number in the
  text and differ only in whether the words are bound to the image — that is a reporting focus and
  it changes no score.

---

## 0. What this experiment is, and what it cannot say

**This is a prompting-technique experiment on one failing quantity.** Kabe's hypothesis, verbatim in
the row: *"what is likely to produce the best result is the exact words that identify with precision
the image in text form because image generation uses that as a primary channel and the image, as
reference is often only ingested for visual conceptual differential elements."* The row-23 matrix
never ran a text-primacy arm at all — all three of its techniques carried the same camera paragraph
and varied only what the *image* said — so the hypothesis has never been in front of a number.

**The quantity is the admissible horizon**, and it is chosen because it is the one the corpus has
already convicted: 58 of 85 manor walls held on it at the production run, and after row 32's
instrument 42 still hold, 21 of them under `unfitted-horizon`. Every one of those walls **passes the
camera gate**. So the thing that is failing is not scale, not the floor line, not the corners — it
is whether the two side-wall returns read as receding surfaces that converge somewhere a level
camera's eye could be. That is a *drawing* property, and it is exactly the property a sentence might
move where a box could not.

**Supporting evidence already in the ledger, and it is what this row is built on:** box labels alone
never separated the row-23 techniques (p = 1.0), while the eye-line SENTENCE added to the production
composer at row 32 promoted three walls at once. Words moved what boxes did not. This row asks
whether that was a one-off or a direction.

**What it cannot say, stated before any number exists:**

1. **It is a screen, not a crown.** Two rolls per variant per wall is four pooled rolls per variant.
   §5.4 computes the minimum detectable effect from that n and prints it beside every table: at
   generation 1, with six arm-versus-control comparisons Holm-corrected at a family-wise α = 0.10,
   the tightest step is 0.0167 and the ONLY result that clears it is a clean sweep — 4 of 4
   admissible against a control at 0 of 4, whose exact one-sided Fisher p is 1/70 = 0.0143. The next
   best conceivable result, 3 of 4 against 0 of 4, is p = 0.243 and does not come close. Nothing
   weaker will be called a separation, and the scorer says so in its own string rather than in this
   paragraph.
2. **Both probe walls carry the same camera.** They differ in wall width and carrier load and in
   nothing else (§2). That removes scale as a confound *between* the probes and it means generation
   1 says nothing whatever about walls at other scales. The fold-back re-run over the hold family
   is what tests that, and until it runs the winner is a winner on two walls at 155.15 px/m.
3. **The `text_painted` disqualifier does not exist.** `design/specs/23-plan.md` §5.4 lists
   `text_painted`, `room_empty`, `chair_rail_legible`, `corners_in_frame` and `floor_line_in_frame`
   as flags; **P0 never built any of them** — `grep -rn text_painted` over the whole tree returns
   the plan text and nothing else. This row adds NO detector (the brief forbids it), so the honest
   disqualifier set is what the instrument actually emits: `measurement_withheld`, which is a fact
   about us and counts against nothing. What replaces the missing flag is a gate on the *ask*:
   every arm's prompt must carry the no-lettering constraint, `prompt_lint.py` runs over every
   emitted prompt, and `evolution.spec.mjs` asserts the constraint is present in all six arms. A
   painted label would therefore be a *silent* failure in this round's numbers, and the batch says
   so rather than letting a reader assume a guard that is not there.

---

## 1. The variant space, generation 1

**An arm is a setting of three channels, not a paragraph.** Every arm below is a committed composer
function in `tools/evolution-arms.mjs` — `ARMS[id].prompt(ctx)` — and none of its text is
hand-written for a wall: every number in every arm comes from the facing's own meta, the plan's own
carriers and `src/groundplane.js`'s own functions, so an arm re-emits with the plan when the plan
moves. The three channels are what recombination in §6 crosses:

| channel | settings |
|---|---|
| `text_geometry` | `production` · `exhaustive` · `minimal` · `cross_referenced` |
| `image` | `none` · `scaffold_primary` · `scaffold_demoted` · `scaffold_orienting` · `edge` |
| `camera_language` | `production` · `exhaustive` · `none` · `cross_referenced` |

| id | name | text | image | camera | one line |
|---|---|---|---|---|---|
| `v1` | TEXT-ONLY-PRECISION | exhaustive | none | exhaustive | No layout image at all — the style seed alone — and the entire geometry as exhaustive precise text: every carrier in pixel columns AND metres, floor line, ceiling line, corner columns, chair-rail row, and the camera constructed verbally down to the row the returns converge on. |
| `v2` | TEXT-PRIMARY | exhaustive | scaffold_demoted | exhaustive | `v1`'s text byte-for-byte, plus the scaffold attached and explicitly demoted — *"Image 2 is a rough spatial sketch; the text governs every number"* — so the arm isolates whether the image helps or interferes when the words already carry the geometry. |
| `v3` | CONTROL | production | scaffold_primary | production | The current production technique, `manorPrompt` verbatim: labelled scaffold as Image 2, the room's voice, the row-32 eye-line sentence. It is the yardstick and it is re-rolled fresh in every generation. |
| `v4` | SCAFFOLD-PRIMARY-MINIMAL-TEXT | minimal | scaffold_primary | none | The inverse of `v1`: the rich labelled scaffold carries everything and the words are three sentences (plus the three header lines `prompt_lint.py` requires, which is stated rather than smuggled — see §1.1). |
| `v5` | EDGE-SCAFFOLD | production | edge | production | `v3`'s prompt text exactly, but for the one line naming what Image 2 is; Image 2 is the scaffold re-drawn as high-contrast black-on-white line art — no dim metre grid, no facing glyph, no legend, ink only where geometry is. |
| `v6` | CAMERA-LANGUAGE | production | scaffold_primary | exhaustive | `v3` plus the exhaustive verbal perspective-construction paragraph and nothing else — the single-channel test of the row's own hypothesis against the standing production ask. |
| `v7` | CROSS-REFERENCED | cross_referenced | scaffold_orienting | cross_referenced | **The governing frame's own arm** (§0a): Image 2 declared as orientation only — what is where, how the surfaces sit, how much of the frame each takes, *"not measured and not to scale"* — and a block that walks it element by element, naming each mark as a viewer sees it and then articulating it exactly: *"the boxed opening at the far right of Image 2 is the door: its opening is exactly 1.00 m wide … columns 710 to 865, head at row 399"*. The image is never asked to carry a number; the text never re-describes the layout the image already shows. |

**The design is a factorial skeleton, deliberately.** `v5` and `v6` each move ONE channel off the
control, so a win by either is attributable. `v4` moves two in the opposite direction. `v1` and
`v2` move `text_geometry` and `camera_language` together, because those two are the two halves of
Kabe's one hypothesis and splitting them would spend four rolls proving something the row does not
ask; `v1` against `v2` is then a clean single-channel read on the image.

**`v7` against `v2` is the sharpest comparison in the generation, and it is a comparison and not a
score.** Both put every anchored number in the text. They differ in one thing: `v7`'s words are
**bound** to the image element by element, so there is nothing for the two channels to disagree
about; `v2`'s words run **beside** the image and a disagreement is settled by a precedence rule
(*"the text governs every number"*). That is the division-of-labour ruling tested against the
unbound form of the same split. Both are compared to the control on identical terms and neither is
weighted (§0a).

### 1.1 What `v4`'s "three sentences" honestly means

`prompt_lint.py` is a standing gate, not this row's to suspend: a prompt with no `Gate anchor:` line
is refused before an image exists, and refusing it is right — hall/N and hall/S came back
unmeasurable twice for exactly that. So `v4` carries the three structural header lines every prompt
in this project carries (`Use case:`, `Asset type:`, `Gate anchor:`) and its *body* is three
sentences. It is named MINIMAL-TEXT and not NO-TEXT, and §5.6's report repeats the distinction, so
nobody later reads a "no text" arm into a result that had four hundred characters of header.

### 1.2 What `v5`'s image is, and the guarantee it does not carry

Row 23 §7.1 hashes the scaffold against the live `#scene` buffer: the picture a painter is given is
provably the picture a player will see. **`v5`'s edge scaffold does not carry that guarantee**, and
the manifest says so on its face. It is a line drawing composed from the facing's *declared*
geometry — corner columns, floor line row, ceiling line row, the two return junctions computed
through `groundplane.xAtScale` / `yAtScale` exactly as `renderer.js`'s `drawGrid` computes them,
the chair-rail row, and each carrier rect from `scaffoldRects` — and `evolution.spec.mjs`
recomputes every one of those coordinates independently from `groundplane` and `facingCarriers`,
which is the same independent recomputation §7.5 does for the shipped scaffold. **If `v5` wins,
folding it into the emitter requires re-establishing the §7.1-equivalent guarantee first**; that is
a named condition on the fold-back in §7, not an afterthought.

---

## 2. The probe walls, and why these two

Both are drawn from `design/batches/row23-scaffold/manor/run-state.json`'s **`unfitted-horizon`**
subset — 21 walls, every one of them camera-PASS and horizon-held, which is the definition of a
wall that fails on exactly the quantity this row measures.

**The screen that picked them, run over all 21 and printed in the batch:** corners in frame; floor,
rail and ceiling brackets in frame; every stamped carrier in frame; camera verdict PASS; and the
count of `_absent` entries in the wall's own reading. Two walls survive with the fewest faults.

### `guest_chamber/E` — the only zero-fault wall in the hold family

| | |
|---|---|
| voice | `bedchamber`, anchor `chair_rail`, interior, upper floor |
| wall | 6.45 m, corner columns **267.64 … 1268.36** (span 1000.73 px) |
| camera | 155.152 px/m at the wall plane, 6.6 m standpoint, focal 1024 px |
| floor line row | 709.64 · ceiling line row 275.22 · chair-rail row 562.25 |
| **declared horizon row** | **526** |
| brackets | floor ±14.68 px · rail ±11.79 px · ceiling ±34.75 px |
| carriers | **none** |
| its held reading | camera **PASS** (focal −0.27 %, eye +5.92 %), `_absent` **empty**, best convergence **σ 71.6 px** against a ±14.68 px licence |

**Why it is the pick.** It is the single wall in the whole hold family where *everything the
instrument reads passes* and the horizon is the only failing quantity — a clean single failure with
nothing else in the frame to explain it. And it carries **no carrier at all**, so the carrier arm —
which §5.4 of the row-23 plan already records as structurally unread on panelled walls — cannot
confound the reading. What is left in the picture is the wall, the two returns and the anchor: the
row's hypothesis with nothing else in it.

### `garden_room/E` — the nearest miss, and the opposite return geometry

| | |
|---|---|
| voice | `garden_parlour`, anchor `chair_rail`, interior |
| wall | 3.55 m, corner columns **492.61 … 1043.39** (span 550.79 px) |
| camera | 155.152 px/m, 6.6 m standpoint, focal 1024 px — **identical to `guest_chamber/E`** |
| floor line row | 709.64 · ceiling line row 275.22 · chair-rail row 562.25 |
| **declared horizon row** | **526** |
| brackets | floor ±14.68 px · rail ±11.79 px · ceiling ±34.75 px |
| carriers | one door, `op09`, 1.40–2.40 m, 1.00 m wide, stamped **709.82 … 864.97** px, head 2.00 m at row 399.34 |
| its held reading | camera **PASS** (focal −0.95 %, eye +5.55 %), best convergence **σ 33.3 px** against the same ±14.68 px licence |

**Why it is the pick.** Two reasons, and the second is the important one.

1. **It is the nearest miss among clean walls** — 2.27× the licence where `guest_chamber/E` is
   4.88×. A probe that is hopeless everywhere reports 0-of-4 for every arm and separates nothing;
   a probe that is nearly there is where a real improvement crosses the threshold and shows up as a
   *rate*. The pair therefore spans the failure severity rather than sampling one point of it.
2. **The two walls differ in precisely the quantity under test.** The camera is the same to the
   last decimal, so the ask is the same row 526 and the bracket is the same ±14.68 px — and the
   *returns* are not: `guest_chamber/E` gives the instrument 267.6 px of return on each side and
   `garden_room/E` gives it **492.6 px**, nearly double the run of junction to fit a line to. The
   horizon is fitted on exactly those junctions. A technique that wins on both has won across the
   return geometry that decides the measurement, and one that wins on only one is reported as
   `SPLIT` and never crowned (§5.5).

**Its one non-horizon miss is the universal one.** `garden_room/E`'s reading carries `_absent` = 1
and the entry reads *"the door: the choice of edge pair would choose the verdict"* — the carrier
detector refusing to choose between two admissible pairs. That refusal is a documented property of
the arm on any panelled wall (23-plan §5.4: *"the edge-pair arm is unread on all 24 rolls"*), not a
fact about this wall, and it does not touch the camera verdict or the horizon. So the diagnosis
stays single.

**Both probes are held at four attempts and their retry budget is spent**, which is why using them
costs the manor run nothing: the sweep has already stopped asking for them.

---

## 3. The roll budget, declared before dispatch

| generation | arms | walls | rolls per arm per wall | images | fires when |
|---|---|---|---|---|---|
| 1 | 7 | 2 | 2 | **28** | on the Navigator's dispatch |
| 2 | 7 | 2 | 2 | **28** | always — a screen that stops at one generation is not an evolution |
| 3 | at most 3 (winner, runner-up, control) | 2 | 2 | **12** | ONLY on §5.5's confirmation condition |

**Generations: 3 maximum. Total roll budget: 68 images worst case, 56 if generation 3 is not
spent.** No arm, no wall and no generation may be added without a new row: this table is the
declaration the row's done clause asks for, and `row34_fitness.py` refuses to plan a generation
that would exceed it.

**This total is a re-declaration and it is said out loud.** The first draft of this plan declared
six arms, 24 images a generation and **60** worst case. The governing frame ruled mid-build (§0a)
added `v7`, which is a seventh arm at 2 rolls × 2 walls — **+4 per generation, +8 over the two
screening generations**. The new totals above are declared **before anything is emitted**, which is
what the row's done clause asks for; the superseded figures are recorded here rather than
overwritten, because a budget that changes quietly is not a declared budget.

The seat rides the existing subscription, so the cost is wall-clock and seat sessions, not money.

---

## 4. Where returns land, and the blinding

Row 23 §5.1's discipline, unchanged and re-instantiated for this row's own files. **No path carries
an arm.**

| what | path |
|---|---|
| the packets | `design/batches/row34-evolution/gen1/<loc>-<facing>/<arm>/` |
| the three images per wall | `design/batches/row34-evolution/gen1/<loc>-<facing>/{frame,scaffold,edge}.png` |
| the sidecar | `design/batches/row34-evolution/gen1/<loc>-<facing>/sidecar.json` |
| the manifest | `design/batches/row34-evolution/manifest.json` |
| **the id → cell map** | `design/batches/row34-evolution/assignment.json` |
| returned candidates | `backdrops/source/<loc>-<facing>/row34-<id>.png` |
| each roll's prompt | `backdrops/source/<loc>-<facing>/row34-<id>.prompt.txt` |
| readings | `design/plan-draft/measured/row34/<id>.json` |
| the report | `design/batches/row34-evolution/REPORT.md` |

`<id>` is an opaque 8-hex token over `row34|<generation>|<wall>|<arm>|<roll>`, carrying neither the
arm nor the wall in the path. `assignment.json` maps id → `{generation, wall, arm, roll}` for all
28 generation-1 rolls, is **committed before any candidate exists**, and `evolution.spec.mjs`
asserts its blob has never changed since the commit that introduced it — `git log --diff-filter=A`,
blob immutability, exactly row 23 §7.8's mechanism.

**What it blinds and what it cannot.** It blinds the measuring hand and the detector configuration:
`cfg_from_sidecar` is a function of the WALL's geometry and every arm on one wall is measured
through byte-identical windows, by construction rather than by discipline. It cannot blind the
generating hand, which is holding the packet. That is inherent and is not claimed away.

**Generation 2's assignment is a SECOND file**, `assignment-gen2.json`, written when generation 2 is
planned — never an edit, for row 23 §12's reason: a map that can be appended to after the readings
exist is not the discipline it claims to be.

---

## 5. Fitness — the existing instrument, and no new detector

Every number below is read out of a reading `row23_lib.measure_candidate` already produces. Nothing
in this row measures a pixel that the manor run's own instrument does not already measure.

### 5.0 The three files, and what each may touch

| file | what it does | what it may not do |
|---|---|---|
| `design/plan-draft/measured/row34_run.py` | measures whatever landed, through `row23_lib` | promote, bake, publish, write under `backdrops/`, open the manor run's state |
| `design/plan-draft/measured/row34_fitness.py` | scores, applies §5.4, writes the report, breeds the next generation | **name any arm id at all** — every id, the control's included, is read out of `assignment.json` |
| `design/plan-draft/measured/row34_fixtures.py` | writes synthetic readings with a known answer, for §8 | write into the real readings directory (it refuses) |

### 5.1 The runner

`design/plan-draft/measured/row34_run.py`. It reads `design/batches/row34-evolution/manifest.json`
and `assignment.json`, builds `side` / `cfg` / `ref` from the manifest entry exactly as
`row23_run.sweep` does, calls `row23_lib.cfg_from_sidecar` and `row23_lib.measure_candidate` with
`measure.py`'s own injected detector rules, and writes `design/plan-draft/measured/row34/<id>.json`.

**It is sweep-independent, and that is a fence rather than a happy accident.** It never opens
`design/batches/row23-scaffold/manor/manifest.json`, `run-state.json` or `retries.json`; it never
promotes, never bakes, never publishes, and writes nothing under `backdrops/` or `design/batches/`.
`evolution.spec.mjs` asserts both halves — structurally (neither row-34 tool names a manor-run path)
and behaviourally (the three manor files are hashed before and after a run and must be unmoved).
The manor sweep is symmetrically blind to this row: its arrival scan matches `^row23-[0-9a-f]{8}\.png$`
and its sweep iterates its own manifest's rolls, so `row34-` files in the same source directories
are invisible to it.

### 5.2 The primary — the admissible horizon

Per roll, from `reading["_promotion"]`:

- **`admissible`** — `ramp is not None`. The row-20 ruled instrument fitted the two side-wall
  junctions and the fit passed `_admissible`'s three tests: its own error bar inside the standing
  licence, the convergence inside the picture, and the convergence between this frame's own ceiling
  and floor lines. **No band moves and none may.**
- **`d_horizon_px`** — `|ramp.y − declared_row|`, the declared row being
  `round(horizon_y × image_h_px)` = **526** on both probes. Defined only where `admissible`.
- **`d_horizon_any_px`** and **`sigma_best_px`** — over `ceiling_rows_tried`, the candidate with the
  smallest `sigma_y_px`: how far off the ask the best fit landed, and how sharp it was. Both exist
  in every reading already. They are **reported diagnostics and step-2/step-3 tie-breaks only**
  (§5.4), never the primary, because a fit outside the licence is not a horizon.

### 5.3 The secondary, and the disqualifiers

- **Secondary: `camera_pass`** — `verdict == "PASS"`. It is secondary and not primary because every
  arm asks for the same camera and all 21 hold-family walls already pass it; a camera separation
  here would be evidence about camera behaviour and not about the manipulation, which is row 23
  §5.5's sentence and it governs this row too.
- **Disqualifier, unchanged: `WITHHELD` / `kind == "measurement_withheld"`** — a fact about us
  (a frame that is not 1536 × 1024, a bracket outside the frame, no readable column band). It
  **counts against nothing and is excluded from every denominator**, keeping the wave's meaning
  exactly.
- **`ABSENT` / `scaffold_feature_absent`** is NOT a disqualifier: it is in the denominator and
  scores `admissible = false`, correctly — a frame whose floor line or chair-rail is out of band
  gives the instrument no scale, and with no scale there is no horizon.
- **`text_painted` does not exist in the instrument** (§0, item 3). No detector is added. The
  no-lettering constraint is gated on the ask instead, and the report prints the gap.

### 5.4 The separation discipline — row 23's, and every rule fixed now

**The comparison is always arm-versus-control**, pooled over the two probe walls (4 rolls per arm),
with the per-wall counts printed beside the pooled ones.

1. **Test:** one-sided **Fisher's exact test**, computed exactly (`math.comb`, no approximation),
   on the 2 × 2 of admissible-vs-not for the arm against the control.
2. **Multiplicity:** **Holm–Bonferroni** over the six arm-vs-control comparisons, at a family-wise
   **α = 0.10 for a screening generation** (1 and 2) and **α = 0.05 for the confirmation
   generation** (3), where at most two comparisons run. Every arm enters that family on identical
   terms; there is no arm the correction skips (§0a).
3. **Minimum margin:** the arm must also beat the control by **≥ 2 admissible rolls** of its 4. A
   one-roll margin at n = 4 is inside the noise the row-23 arithmetic already convicted.
   **And at generation 1's n this clause does no independent work, which is said rather than
   implied:** the only result that clears Holm at all is 4 of 4 against 0 of 4, whose margin is 4,
   so Holm is strictly the tighter guard. The clause is kept because it is the one that survives a
   change in n — the pooled n of a confirmation generation is where it becomes binding — and the
   suite tests it as a unit (`separates()`), because no fixture at this n can reach it.
4. **The scorer prints its own power.** `min_detectable_effect()` enumerates every possible
   (arm k, control k) pair at this n and prints the smallest margin that could clear step 2 — so
   the run's own weakness is a number in the report and not a claim in this file. At generation 1
   that number is **4 of 4 against 0 of 4**: a clean sweep and nothing less. The scorer recomputes
   it from the actual arm count, so adding an arm tightens Holm and the printed floor moves with it
   rather than staying at a figure this file typed.
5. **NO CROWN FROM NOISE.** If no arm clears steps 1–3, the generation's headline is the scorer's
   own string **`NO SEPARATION`**, and generation 2 is seeded by §6's declared null branch — never
   by whichever number happened to look best. `evolution.spec.mjs` asserts the report's headline is
   the string the scorer emitted for the state the numbers are in, so a judgment can never be
   printed as a measurement (row 23 §7.10).
6. **`SPLIT` is not a win.** An arm that clears pooled but loses to the control on one of the two
   walls is labelled `SPLIT` and carries forward as a generation-2 entrant, never as a winner.

### 5.5 The confirmation generation, and what a crown costs

**A screen never crowns.** Generation 3 fires on exactly one condition: **generation 2 produced a
separating arm that is not the control**. It re-rolls that arm, the runner-up and the control on
fresh rolls, and its verdict is scored **on those fresh rolls only** — row 23 §5.6's option (b),
because carrying the selecting rolls forward is what made the second draft's advertised error rate
wrong in the direction that flattered it. Pooling generation 2's rolls with generation 3's for the
winner is forbidden and the scorer refuses it.

**The winner is folded into the emitter only after generation 3 passes**, and the fold-back is the
row's done clause, not this plan's: the winning composer becomes `manorPrompt`'s replacement, the
hold family is re-run with it, and the result is reported with its number.

### 5.6 The report

`row34_fitness.py` writes `design/batches/row34-evolution/REPORT.md` and prints the same table:

```
GENERATION 1 — 28 rolls, 7 arms, 2 walls, 2 rolls each
arm  wall              adm  cam  d_horizon_px  sigma_best_px  withheld
v1   guest_chamber/E   ?/2  ?/2      ...            ...          0
...
POOLED   arm  adm k/n   control k/n   margin   Fisher p   Holm   verdict
MIN DETECTABLE EFFECT AT THIS N: <computed>
HEADLINE: <NO SEPARATION | SEPARATION: v_ | SPLIT: v_>
NOTE: this round has no text_painted detector; a painted label is a silent pass here.
NOTE: v4 is MINIMAL-TEXT, not no-text: three body sentences plus three lint-required header lines.
```

### 5.6a The spectrum, which is how the table is read

**The Captain's frame is the lens (§0a), so the report's second table is not a league table.** It
orders every arm along one axis — how much of the anchored precision the *image* is asked to carry —
and reads the fitness against that ordering, so the finding is a statement about **where precision
belongs**:

```
PRECISION LIVES IN ...     arm  bound?    adm k/n   d_horizon_px
  the image                v4   -
  the image (line art)     v5   -
  both, loosely            v3   loose      <-- the control
  both, loosely            v6   loose
  the text                 v7   BOUND      <-- the ruled division of labour
  the text                 v2   unbound
  the text (no image)      v1   none
HEADLINE PAIRING  v7 (bound) vs v2 (unbound): same precision location, opposite binding.
```

**And the report must be able to say either thing as plainly.** *"The Captain's cross-referenced
frame lost to `<arm>` by N at p < X"* and *"the cross-referenced frame beat the control by N at
p < X"* are the same sentence with different values in it, printed by the same code path. §8's
planted fixtures include a case where `v7` is the loser precisely so that path is exercised before
any real candidate exists.

---

## 6. The evolution — recombination, committed before generation 1 returns

`row34_fitness.py --plan-generation-2` is a **deterministic function of generation 1's readings**.
It takes no argument that could steer it and it is written now, before a single candidate exists.

**An arm is its channel triple** (§1). A **crossing** of two arms takes each of the three channel
settings from one parent or the other; a crossing that reproduces an arm that already exists is
skipped; crossings are enumerated in a fixed order (parent order by rank, then channel index) so
the output is reproducible from the readings alone.

**No arm has a seat by name.** The only standing entrant is the **control**, and it is there as the
yardstick rather than as a candidate: every generation re-rolls it fresh, because a control measured
once and reused across generations turns drift into signal. Everything else earns its place from the
readings. `evolution.spec.mjs` asserts the scorer names no arm id but the control's, so a privileged
arm cannot be smuggled in as a literal (§0a).

**Branch A — SEPARATION.** Winners are ordered by (pooled admissible rate, then smallest median
`d_horizon_px`, then smallest median `sigma_best_px`, then arm index — fully deterministic
including an all-equal tie). Generation 2 is: **the control**, **W1**, **W2 if there is one**, then
the crossings of W1 with each other generation-1 arm, **round-robin in rank order** — one crossing
from each partner before a second from any — until seven arms are filled. Round-robin and not
partner-by-partner because taking every crossing of the winner with the first partner fills a
generation with five variations on one pair, which is a narrower search than the one that found the
winner. Each crossing's id carries its channel mask, so five crossings of one pair are five rows a
reader can tell apart.

**Branch B — NO SEPARATION.** Generation 2 is: **the control**, then the two arms ranked highest on
the step-2/step-3 continuous quantities (median `d_horizon_any_px`, then median `sigma_best_px`),
each **amplified** by its own declared mutation, then the crossings of those two, then the arm
furthest along the §5.6a **spectrum** from the leader — the opposite end of the image-carries-all →
text-carries-all axis, measured as a distance on that axis rather than as "the worst arm", which is
a different thing and would breed from failure. A branch-B generation may come out **under** the
declared budget when the leading arms are near-identical and their crossings are already in the
pool; under is fine and over is refused.

**The mutation ladder, declared per arm, and it is the only place an arm's text may grow:**

| arm | amplification |
|---|---|
| `v1`, `v2` | the geometry text gains the per-return junction table: both endpoints of each return's floor junction and ceiling junction, in columns and rows, computed through `groundplane` |
| `v4` | the scaffold gains the return junction lines drawn as ruled marks with their own labels; the body stays three sentences |
| `v5` | the edge drawing gains stroke-weight hierarchy: junctions heavy, carriers medium, the anchor light |
| `v6` | the camera paragraph gains the row-by-row construction of both returns, stated as an instruction to draw rather than as a description |
| `v7` | the cross-reference block gains a named element for every mark Image 2 draws that it does not yet name — the metre grid, the facing glyph, the legend — each stated as an orientation mark carrying no measurement |
| `v3` | none — the control is never mutated. It is the yardstick. |

**Branch C — a generation whose readings are all WITHHELD** is not a null; it is a broken run. The
whole table is still computed and printed — a reader needs the withheld column that convicts it —
and only the headline changes, to `RUN BROKEN: every reading is withheld`. The scorer refuses to
plan a generation from it, because breeding from no evidence is worse than stopping.

**A crossing is a channel triple, not a composer.** `--plan-generation-2` produces the *recipe*, and
an arm it emits marked `needs_composer` names a channel combination `tools/evolution-arms.mjs` does
not implement yet. Writing that composer is the mechanical follow-on when generation 1 returns; what
matters — and what the plan fixes now — is that its channel triple was **decided by the rule and not
chosen afterwards**.

---

## 7. Fold-back, and what it costs

Production law clause 6: a correction lands in the emitter, never in a per-run paragraph. So the
winner rewrites `manorPrompt` and the hold family re-runs with it, per the row's own done clause.
Two named conditions ride on that:

- **If `v5` wins**, the §7.1-equivalent guarantee must be re-established for the edge drawing before
  it becomes the production Image 2 (§1.2). A picture a painter is given that is not provably the
  picture a player sees is a regression in a property this project has already paid for.
- **If nothing wins**, production law clause 5 applies to this row's own apparatus exactly as row 23
  applied it to `make-scaffold.mjs`: a change moving neither accuracy nor speed *"is apparatus, and
  apparatus must argue for its life or be removed"*. The report says so in those words.

---

## 8. Verification

`tests/playwright/evolution.spec.mjs`, chromium (a claim about node composers, a python scorer and
one canvas has no second engine):

1. **Every arm composes for both probe walls, and `prompt_lint.py` accepts all fourteen prompts.**
   Run against the real lint, the real composer, both walls, all seven arms.
2. **The control is production, checked in a form that can fail.** The obvious assertion —
   `ARMS.v3.prompt(ctx)` equals `manorPrompt(...)` — compares a function with itself, because the
   control *is* that call; it is true whatever production does, including when production drifts,
   which is the one thing it was meant to catch. It was written that way, found unfailable under a
   deliberate mutation of `manorPrompt`, and replaced by two checks that do fail: the control's
   composer must be a **single delegation** (it can never quietly become a transformation carrying
   a copy of production's text), and **every committed prompt on disk must equal what its composer
   returns today** — which goes red the moment `manorPrompt` moves, verified by mutation.
3. **The declared diffs are the whole difference.** `v2`'s text is `v1`'s plus exactly the declared
   demotion lines; `v5`'s text is `v3`'s but for exactly the declared substitution set (the lines
   that say what Image 2 *is*, all of which move when it becomes a line drawing); `v6`'s text is
   `v3`'s plus exactly the camera paragraph. Asserted as line diffs, row 23 §7.6's mechanism.
3b. **`v7` says what the frame ruled.** Its Image-2 declaration contains the orientation words and
   no instruction to reproduce a number from the image; every carrier the plan draws on the wall is
   named in its cross-reference block with its metres AND its pixel columns; and its element names
   are derived (`positionWord` off the box centre), never typed.
4. **The exhaustive geometry is the plan's, recomputed independently.** Every column, row and metre
   `v1` states is recomputed in the test from `facingCarriers`, `deriveMeta` and `groundplane` —
   never through the composer's own helper — including the return junction endpoints, which are
   recomputed the way `drawGrid` computes them.
5. **The no-lettering constraint is present in all seven arms** (§0, item 3), and every stamped
   label character is in the declared glyph set.
6. **`assignment.json` has never changed since it was added** — introducing commit found with
   `git log --diff-filter=A`, blob compared. Return paths match the opaque-id grammar and contain
   no arm token and no wall token.
7. **The fitness computation, on synthetic readings with a planted winner and a planted null.**
   Fixture sets are written to a temporary directory and scored by the real `row34_fitness.py`:
   *(a)* one where a single arm sweeps 4 of 4 against a control at 0 of 4 — the scorer must name
   that arm and print `SEPARATION`; *(b)* one where every arm sits at 2 of 4 — the scorer must print
   `NO SEPARATION` and name no winner. Both must be detected, and the planted-null case is the one
   that matters: it is the check that this row cannot crown from noise.
7b. **`v7` planted as the loser** (§0a's fence). A third fixture set puts `v1` at 4 of 4 and `v7` at
   0 of 4, and the report must name `v1` as the separation and print the cross-referenced arm's loss
   in the same table with the same columns. A framing that could only announce a win would be a
   finding.
8. **The margin rule and the Holm rule each have a case that fails without them** — an arm at 3 of 4
   against 2 of 4 must NOT separate, and the delete-green form of that is asserted.
8b. **The scorer names no arm at all.** A structural scan of `row34_fitness.py` for arm-id literals
   finds none — not even the control's, which is read out of `assignment.json`'s `_control`. This
   is the mechanical half of §0a's fence, and it is stricter than that section promised: there is
   no place in the scorer where a privileged arm could be written down.
8c. **The breeding is deterministic and its ids are unique.** `--plan-generation-2` over the same
   fixture twice produces byte-identical output, no two planned arms share an id, and the branch-B
   "opposite extreme" is the arm furthest along the §5.6a spectrum from the leader.
9. **The manor run is untouched.** Structural: no row-34 source names `manor/manifest.json`,
   `run-state.json` or `retries.json`. Behavioural: the three files' SHA-256 are unmoved across a
   real `row34_run.py` invocation.
10. **The whole suite green**, both engines, nothing else modified.

---

## 9. Kabe's gate, and the Navigator's act

**Dispatch is the Navigator's**, and it holds. This row builds the machinery and the generation-1
packets and stops there. What the Navigator carries to Kabe, if it carries anything, is that the
row spends up to 60 rolls of seat time on two walls the sweep has already given up on, to answer a
question he asked in his own words — and the answer may be `NO SEPARATION`, which is a result and
is recorded as one.

---

## 10. What does not move

- **No renderer change.** `src/renderer.js`, `src/groundplane.js`, `src/placeholders.js`,
  `index.html` untouched.
- **No new detector, no band, no bracket, no threshold.** `row23_lib.py`, `measure.py`, `gate.py`
  and `prompt_lint.py` are read and never edited by this row.
- **No manor state.** `manifest.json`, `run-state.json`, `retries.json` under
  `design/batches/row23-scaffold/manor/` are never opened by a row-34 tool.
- **No promotion, no bake, no publish.** No row-34 candidate enters `backdrops/<loc>/`.
- **No plan change.** `fixtures/demo-study/plan.json` is read as the tree holds it.
- **`tools/make-scaffold.mjs` is imported, not edited.** The control arm calls its `manorPrompt`, so
  the control cannot drift from production by a copy going stale.
