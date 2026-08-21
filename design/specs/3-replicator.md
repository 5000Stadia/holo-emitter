# Spec row 3 — plan

Row 3 in `design/intention.md`'s spec list. Target and done live there; nothing is copied here.

Revision 3. Two plan-critique rounds found the same four families twice over, so per the family
rule at the head of *The loop* this revision stops patching instances and puts each family's
architecture on the table first (§A–§D). §§1–16 are the plan those decisions produce. §17 disposes
of every individual finding from both rounds.

Built to blueprint §4b rule 1: **every stage is an importable pure function and the CLI is a thin
wrapper**. "Pure" is used strictly — no file I/O, no network, no clock, no RNG, no mutation of
arguments, same value for the same inputs. All decoding, encoding and writing happens in the CLI
layer.

---

# The four families

## §A — Calibration authority: no hard gate may be calibrated on the corpus it judges

*Found twice: round 1 F3 ("the pinning basis is circular"), round 2 F1, F2, F9, F10.* Round 1 said
the thresholds had no citable basis; revision 2 answered by measuring the corpus and citing it.
Round 2 is right that this answer **is** the disease — §9.4's own words are "a gate tuned until the
corpus passes is no gate", and a commit boundary between *measuring* the corpus and *running* it is
not the boundary that rule names.

**The architecture.** Every threshold in `contract.json` declares one of exactly three
authorities, and the file says which:

1. **`contract`** — it follows from something the orientation contract itself asserts, or from the
   algebra of compositing. Example: a correctly antialiased edge is a coverage-weighted blend, so
   its composited brightness sits about halfway between ground and object; the bound is that
   arithmetic plus a slack, not a fitted number.
2. **`control`** — it is measured on **constructed** images whose ground truth is known by
   construction: a synthetic sprite with a halo of known width, a synthetic solid lit from a known
   direction, a synthetic legged object with a known stance. Constructed controls are independent
   of the corpus, and the same constructions are the suite's negative controls, so the number and
   the test that exercises it come from one artifact.
3. **`observed`** — it is a corpus measurement. **An `observed` threshold may not gate.** It is
   reported and nothing else.

**Consequence, stated so "both desks pass gates" is read at its true strength:** no hard gate in
this pipeline is calibrated on the corpus. Where a quantity is genuinely only knowable from real
art, it is reported in the record and in the closing report, and the closing report names it as
uncertified.

**Second half of the same family (round 2 F10): absolute pixel counts do not survive a 10× source
range.** The contract admits sources from 128 px of content (a takeable) to 1254 px (the corpus).
So every spatial parameter becomes a **rule evaluated per image**, with the rule frozen rather than
its output:

| parameter | rule | corpus desk | a 128-px takeable |
|---|---|---|---|
| `matte.tolerance` | `clip(k_sigma × border_sigma + drift, min, max)` | ~8 | ~8 |
| `matte.edge_erode_px` | `clip(round(content_h × erode_fraction), 1, 3)` | 2 | 1 |
| `matte.hole_min_area_px` | `max(4, (content_h × hole_side_fraction)²)` | ~84 | ~4 |
| `matte.rgb_bleed_px` | `clip(round(content_h × bleed_fraction), 1, 4)` | 2 | 1 |
| `gates.holes.min_area_px` | the same rule as the matte's | ~84 | ~4 |

The frozen things are `k_sigma`, `erode_fraction`, `hole_side_fraction`, `bleed_fraction` and the
clamps — each `contract`- or `control`-authorised. `matte.tolerance` in particular is no longer a
number at all: the contract asserts "perfectly plain seamless uniform mid-grey background", so the
ground's own noise is measurable from the border of every image, and the rule reads it there.

## §B — What the record certifies: measured evidence for every named quality

*Found twice: round 1 F7–F17, round 2 F3, F7, F8, F16, F17, F18.* Round 1 said the record asserted
what the qualities ride on instead of witnessing it; revision 2 fixed `footprint` and `light` and
left temperature, pitch, shadow and contact-as-drawn still unwitnessed.

**The architecture.** Row 2's clause — *a record cannot lie about its own image* — generalizes from
`px`/`base`/`footprint` to the five decomposed qualities. The emitted record carries a
**`measured`** block holding the sprite's own evidence for each, **whether or not a gate acts on
it**, because the source image is superseded at row 4 and these numbers cannot be reconstructed
afterwards:

| quality | measured field | gate |
|---|---|---|
| 1 one light — direction | `measured.light.{estimate_deg, deviation_deg, third_tilt}` | (e) warn |
| 1 one light — temperature | `measured.chroma.{mean_rgb, mean_chromaticity, mean_saturation, warm_cool_index}` | none — **named as uncertified** |
| 2 contact | `measured.contact.{bottom_two_rows, contact_band, chosen, agreement}` | (f) |
| 4 one hand — edge | `measured.edge.{rim_lift_dark, rim_lift_light, expected_lift}` | (a4) |
| 5 camera has feet — scale | `measured.geometry.{content_px, draw_height_px, dims_cross_check}` | dims warn |
| 5 camera has feet — pitch | **absent** — named as unmeasured, rides on Kabe's eye at row 4 | none |
| — baked studio shadow | `measured.ground_toned_fraction` | (h) |

Two of the gaps are new gates this family produces:

- **Gate (h), baked cast shadow.** `negative_block` forbids "cast shadow on the background" and
  generators produce them anyway; a soft shadow on the seamless is further than tolerance from the
  border median, so the matte keeps it as **opaque object pixels** and every other gate accepts it —
  gate (f) is even *rewarded* by the widened footprint. The sprite then carries its studio shadow
  into a room lit by another key, which is the sticker tell produced by the gate set rather than
  caught by it. (h) measures the fraction of opaque pixels that are ground-toned (near the ground's
  hue, desaturated, luminance between a floor and the ground's own) and fails above a
  `control`-authorised bound.
- **Gate (a4) becomes two-sided and two-grounded.** Judging "brightness lift over a near-black
  ground" catches a light rim and is blind to a dark one, which is exactly as much a cut-out tell
  against a lit plaster wall or a leaded window. The clause now composites over a **dark** and a
  **light** reference ground and bounds `|measured lift − expected lift|` in either direction,
  where the expected lift is the coverage algebra of §A authority 1.

And the family's honest residue, written into the closing report rather than papered over:

- **Quality 1 ends this row certified by nothing on real art.** Gate (e) is warn-only by §9.4's
  [HUMAN] text and both corpus desks warn (third tilt 0.96 and 0.11 against the shipped
  `mechanisms.spec` clause's 2.0). Row 2's placeholders only satisfy that clause because `build()`
  paints a synthetic ±8 % ramp; a real PNG gets no ramp. Making the gate hard would overrule a
  [HUMAN] "warn only" — so the fork goes to the Navigator, with the three options named (is the
  generator capable of a directional key at all; does §9.4e become hard; does the ramp move into the
  ingester), and the closing report says plainly that no automated check of quality 1 survives this
  row.
- **Quality 2's pool is one hull ellipse per object.** The renderer draws one ellipse from
  `footprint`; the intention says "Machinarium pools occlusion at **every contact point**". A
  four-footed desk gets one pool across its stance. Carrying per-foot contact spans is a §6 schema
  change and therefore Kabe's, not this row's — so it is written into `design/architecture.md` and
  the closing report as a named, deliberate M0 residue rather than a quality certified by a width
  check.

## §C — Look-bearing decisions do not become effective by silence

*Found twice: round 1 F20, F21, round 2 F11, F12, F13.* The playbook [HUMAN, 2026-08-20] governs
where it places the human differently from *The loop*: "better to get my ok on the visual
directions as they form then after the fact", and direction-setting artifacts are surfaced *before*
they are locked or built against.

**The architecture.** Row 3 produces three classes of artifact and treats them differently:

1. **Frozen mechanism** — thresholds, rules, record shape. Builder's, closed by gates and tests.
2. **Provisional direction** — `backdrop_block`. Written into `contract.json` **carrying its own
   `status: "provisional"` field naming what is unanswered**, so nothing downstream can mistake it
   for a ruling. Row 4's first act is authoring `style_block` from Kabe's approved study/N; the
   provisional flag makes his answer to the backdrop block part of that same moment, upstream of any
   generation.
3. **Craft choices with a visible result** — the edge treatment (erosion depth) and the thumb
   filter. These are frozen for the row, and the row emits a **contact sheet** image showing the
   alternatives side by side with the shipped choice marked, batched for Kabe with the closing
   report. Cheap, does not block the row, and puts the human eye on a decision every future sprite
   inherits.

And the block's own content stops re-imposing a light §11 superseded. Revision 2 pinned "a single
dominant key reading from the upper-left of frame on every facing"; §11 says the quality "now means
'one light *per frame*, the backdrop's own' rather than one global direction", and §11's own wall
maps put a fireplace on study/N and windows on study/S, where an upper-left key is not obviously
achievable. So the authored clause states the **constraint that actually matters** — one dominant
key per frame, whose screen direction and colour are that facing's own and are recorded in that
facing's meta as `key_dir` / `key_tint`, with composited objects lit and tinted to the facing they
stand in — and leaves the direction itself to the probe loop.

That opens a real fork, which goes to the Navigator rather than being closed here: **if `key_dir`
varies per facing, one sprite set cannot match every room**, because sprites carry one baked `light`
and §1's non-goals forbid relighting beyond tint. Either M0 pins one screen-space key across the
eight facings (what §5's `key_dir: "UL"` already authors, and what makes one sprite set honest), or
sprites gain per-facing variants. That is a look decision with a build cost and it is Kabe's.

**The exemption's premise.** The intention grants rows 1–3 an explicit human-licensed exemption
from per-row screenshot approval because they "change nothing Kabe judges as look". This plan
authors a prose block that steers eight generations and freezes an edge treatment every sprite
inherits. The closing report says so, so the Navigator can correct the premise rather than have it
silently consumed.

## §D — The comparison criteria are drafted, dry-run, and only then frozen

*Found twice: round 1 F23–F26, round 2 F19–F22.* Revision 2 supplied four meta-properties and one
arithmetic rule; a plan critic cannot examine a document that does not exist, and the rule it did
pin lets a build with stickers win.

**The architecture.**

1. **The criteria are drafted in full and committed before the corpus is ingested**, so the author
   has not just spent an hour looking at our first real composite. Order is fixed in §13.
2. **They are dry-run before the freeze**, against one frame that is not ours and one that is, with
   the outcomes recorded in the document as the freeze's evidence. A criterion that marks nothing on
   both sides, or everything on both, is not a criterion. This seat cannot open the commercial
   anchors, so the not-ours frame is `design/references/style-seed-warm.png` — a real interior with
   objects in it, and the very image the corpus was generated against — and the document says that
   is what was used and what it therefore does and does not prove.
3. **The rate rule becomes scale-invariant and cannot be won by emptiness.** Revision 2's
   `marked_ours − marked_anchor × (pop_ours ÷ pop_anchor) > 1` lets a one-object frame carry a
   marked sticker and tie, and makes a build safer by deleting objects — the opposite incentive to
   quality 3. The rule is now a comparison of **rates** with a tie band of one member of the larger
   population:

   ```
   rate = marked ÷ population
   ours loses  ⟺  rate_ours − rate_anchor  >  1 ÷ max(pop_ours, pop_anchor)
   ```

   One object, marked, against an anchor at 1-in-10: `1.0 − 0.1 = 0.9 > 0.1` — loses. Forty
   objects, six marked, same anchor: `0.15 − 0.1 = 0.05 > 0.025` — loses. Five marked: `0.025`,
   not greater than `0.025` — tie.
4. **The object/architecture test is symmetric.** A door leaf is architecture on both sides; a
   freestanding piece of furniture or a portable item is an object on both sides. Written as a test
   a stranger applies without knowing which build is which.

---

# The plan

## 0. Corpus, characterised — reported, never used to calibrate

`library-src/corpus/` landed during planning (commit `fd12619`, the standing asset seat's lane):
`desk-corpus-1.png` / `desk-corpus-2.png` with `.prompt.txt` siblings. Under §A these numbers are
**`observed`**: they are reported and no hard gate is set from them.

| | desk-corpus-1 | desk-corpus-2 (teardrop pulls → `desk-joined-oak-1660`) |
|---|---|---|
| source | 1254×1254 RGB | 1254×1254 RGB |
| border median | (129, 128, 128) | (144, 144, 143) |
| border per-channel σ | ≤ 1.02 | ≤ 1.22 |
| corner-to-corner drift | ≤ 1.9 levels | ≤ 2.6 levels |
| content bbox | 1065×815 | 1148×919 |
| enclosed grey regions | 4 real gaps (86817…436 px), nothing else above 13 px | 4 real gaps (63102…4812 px), nothing else above 11 px |
| left−right third luminance | +0.96 | +0.11 |
| Sobel bright-side deviation | 48.2° | 44.9° |

Both prompts were written to the orientation contract — 1.83 m eye, 8° down, 50 mm, 30° viewer-left,
UL45 key, seamless mid-grey, all drawers closed, no cast shadow. So the framing and resolution
assumptions hold by measurement. **The one place the corpus does not honour the contract is light**,
and §B names what that costs.

## 1. Environment, and the one command

`python3` 3.12.3, `numpy` 1.26.4, `Pillow` 10.2.0. `numpy` was installed with
`sudo apt-get install -y python3-numpy`; `pip` is PEP-668 blocked here. No other dependency.

```
python3 -m unittest discover -s replicator/tests -t . -v
```

`-t .` puts the repo root on `sys.path`; `replicator/tests/__init__.py` is required or discovery
refuses the directory (verified), and it raises a message naming the apt command if numpy or PIL is
missing, so a fresh worktree meets an instruction rather than a traceback. README and
`design/architecture.md` carry both lines. The exact interpreter and library versions are recorded
in every record's `provenance.environment`, because §10's byte-determinism claim holds within one
pinned environment and is not a claim about Pillow's future.

## 2. Files

```
replicator/
  __init__.py  imaging.py  contract.py  matte.py  anchors.py  parts.py  states.py
  thumbs.py  gates.py  preview.py  record.py  pipeline.py  maskgen.py  synth.py  ingest.py
  contract.json
  masks/<id>/<part>.png          committed part masks (maskgen output, ingest input)
  tests/__init__.py + test modules
```

Blueprint §2's layout names `ingest.py`, `contract.json` and `tests/`; the rest is an addition §4b
rule 1 requires (stages must be importable, and one file holding stages and CLI cannot show the CLI
is thin). §2's listing is brought true in the closing commit.

Images cross module boundaries as `(H, W, 4)` uint8 RGBA, straight alpha; masks as `(H, W)` bool.

## 3. Contract (`replicator/contract.json`)

### 3.1 Authority, freeze scope, and the amendment path

Every threshold block carries `authority` (`contract` | `control` | `observed`) and `basis`. Every
top-level block carries `frozen` and `amendable_by`:

| block | frozen | amendable by |
|---|---|---|
| `gates`, `ingest` | at row 3's close, against the constructed controls | the Navigator, as a visible reasoned commit — see below |
| `camera`, `light`, `framing`, `prompt_block`, `negative_block` | no — provisional prose | row 4, after the probe (§5: "the camera is whatever the room Kabe loves turns out to have") |
| `backdrop_block` | no — `status: "provisional"` | Kabe, at row 4's prompt-sheet moment |
| `style_block` | no — placeholder | row 4, per §10 |

**The amendment path, defined, because the freeze without one produces the retune it forbids.**
Two things that look alike are not: *tuning* is moving a number so an image that failed passes;
*extension* is a class the controls never covered. The corpus is two renders of a large opaque
rectilinear desk, and `contract.json` will govern an iron key, a silver coin, a vellum notebook, a
thin-stemmed candlestick, a chair with thin members, a plank door and a bookcase. So:

- A threshold may be **extended per object class** — the contract carries an optional
  `classes: { takeable: {…}, thin: {…} }` override map, empty at row 3 — when a *constructed
  control of that class* demonstrates the base value is wrong for it. The control lands in
  `synth.py` in the same commit. That is not tuning: the evidence is constructed, not the artifact
  being judged.
- A threshold may **never** be moved because a real arriving image failed. That fork is the
  Navigator's, with the two outcomes named: the image is regenerated, or the row's target moves —
  and if a target moves, the closing report states which image failed which gate at what measured
  value, so the record shows what was narrowed rather than only that it closed.

### 3.2 §10's blocks — deviations, each with its reason

1. **Eye height 1.83 m in both prose blocks.** §10's `prompt_block` says 1.6 m while
   `camera.eye_height_m` in the same object says 1.83; the intention's quality 5 names 6 ft per
   Kabe's 2026-08-20 ruling. The corpus prompts already say 1.83.
2. **Pitch in the prose.** `camera.pitch_deg: -8` governs how an arriving image looks and appears
   in neither block. Both gain "pitched approximately 8 degrees downward".
3. **`backdrop_block`, provisional.** Per §C: geometry and framing clauses from §10 verbatim; the
   superseded "overcast diffuse daylight … no visible sun shafts" replaced by the constraint that
   matters — one dominant key per frame, its screen direction and colour that facing's own and
   recorded in its meta as `key_dir`/`key_tint`, composited objects lit and tinted to it — plus a
   `status` field naming the open fork (one global screen key versus per-facing keys) as Kabe's.
4. **`style_block` untouched** — §10's placeholder verbatim, extracted at row 4.

**Named and not fixed here:** §5's `horizon_y` device and §12.5's assertion still read 1.6 m. That
is backdrop-meta arithmetic in row 4's lane, and a 1.83 m camera with a 1.6 m horizon formula cannot
both be right while quality 5 rides on the answer. It goes to the Navigator in the closing report.

### 3.3 The blocks, with authorities

```
"ingest_schema": "replicator-ingest/0.1",
"gates": {
  "halo": { "authority": "control|contract", …
            "edge_bg_distance_min", "inner_band_saturation_ratio_min",
            "inner_band_bg_distance_ratio_min",
            "rim_lift_expected", "rim_lift_tolerance",
            "rim_grounds": { "dark": [28,20,14], "light": [196,188,172] } },
  "holes":      { "authority": "contract", "tolerance_multiplier", "min_area_rule" },
  "resolution": { "authority": "contract", 512 / 128 — §9.4(c) verbatim },
  "state_diff": { "authority": "control", … },
  "light":      { "authority": "control", "expected_deg", "max_deviation_deg",
                  "min_third_tilt" },
  "contact":    { "authority": "control", "band_fraction", "disagreement_warn_ratio" },
  "over_matte": { "authority": "control", … },
  "shadow":     { "authority": "control", "max_ground_toned_fraction", … },
  "part_mask":  { "authority": "control", "min_within_3px_fraction" (warn) }
},
"ingest": { "matte": { rules of §A, not pixel counts }, "cavity", "thumb", "preview", "period" },
"classes": {}
```

Three calibrations that changed because of §A, and are the substance of round 2's F2 and F7:

- **Gate (e)'s reference angle is the estimator's own response to a known-correct input, not 135°.**
  A Sobel bright-side estimate has a systematic pull toward 90° for any top-lit object: a
  constructed correctly-UL45-lit solid measures **115.5°**, not 135°. Revision 2 answered by
  widening the band to ±45°, which admits everything from directly-overhead to horizontal-left and
  leaves the gate with no content on the one quality it exists for. `expected_deg` is now measured
  from a family of constructed UL45 controls and `max_deviation_deg` from their dispersion, both
  `control`-authorised, and the band must reject the constructed top-lit and upper-right controls or
  the gate declares itself non-discriminating in its own report.
- **Gate (a4) is two-grounded and two-sided.** `rim_lift_expected` is the coverage algebra
  (`contract` authority): a correctly antialiased edge composites to about half the object's lift
  over the ground. The clause bounds `|lift − expected|` over both a dark and a light reference
  ground, so a dark fringe from over-erosion or bleed undershoot fails exactly as a light halo does.
- **Gate (f) no longer needs an operator.** See §5.2: the footprint is *derived* from the contact
  band automatically, so the gate judges a derivation rather than an operator's typing, and the
  autonomous sprite lane the intention promises stays possible.

## 4. Stage 1 — matte (`matte.py`)

Order: sample the ground (border median) → refuse a source whose object touches the border
(`framing.margin` is "full object centered") → **compute this image's tolerance from its own border
statistics by the frozen rule** → similarity mask → scanline span fill from all borders → punch
enclosed regions above the scale-relative minimum → erode the contaminated boundary band → feather
1 px inward → decontaminate the ring by unmixing against the ground → bleed object colour outward
into transparency → trim, returning `trim_offset`.

Two of these carry their reasons:

- **Erosion.** The generator antialiases the object against the grey seamless, so the outermost
  1–3 px of the silhouette are already a blend, opaque in any matte and a light outline over a dark
  room. Measured and **looked at**: composited at draw scale over a dark ground, the rim's lift
  falls from 0.836 of the interior's (a rim visible by eye) to 0.245 at 2 px, for 2.1 % of area. The
  guard hard-errors above `max_erode_loss_fraction` so a thin object is never eaten; §3.1's `classes`
  map is the path for a class where the base depth is wrong.
- **Two-tolerance holes.** Gate (b) re-hunts at a looser multiple of the matte's own computed
  tolerance and seeds its flood from the border **and every transparent pixel**, so the fringe
  around an already-punched hole is reached and not counted. Without that seeding every real image
  fails; without the looser tolerance the gate cannot fail at all.

## 5. Stage 2 — anchors (`anchors.py`)

### 5.1 Pixel facts

`px`, and the bottom-extreme opaque row that fixes `base.y = bottom + 1`, derived exactly as the
shipped `mechanisms.spec.mjs` case "px, base and footprint are what the pixels say they are"
derives them (inclusive `x0`, exclusive `x1 + 1`), so a record this ingester writes and that test
reads agree by construction.

### 5.2 Ground contact is derived, not typed

Measured on the corpus desk: the bottom-two-rows extent is **27 px of 1148 (2.4 %)** — the nearest
ball foot — while the real ground contact spans **33 → 1098 (92.8 %)**. `footprint` is what the
contact pool is drawn from, against a quality that reads "nothing sits on a floor without it".

`footprint` is therefore **derived from the contact band**: the x-extent of columns whose lowest
opaque pixel lies within `band_fraction` of the content height of the bottom-most opaque row. On a
legged three-quarter object this finds all the feet (33 → 1098 on the desk); on a squat disc it
stays narrow, which is the coin's lesson running the other way. `base.x` is the band's midpoint,
so base and footprint agree and the pool is centred where the object stands.

`--footprint x0,x1` overrides in source coordinates. Gate (f) judges the derivation:
**hard-fail** on a degenerate band (no columns, or a span under one pixel); **warn** when the band
and the bottom-two-rows extent disagree by more than `disagreement_warn_ratio`, reporting both — the
warning is the visible sign that a judgement was made, and it is where an operator override earns
its place. `band_fraction` is `control`-authorised from constructed legged and squat objects with
known stances, never from the desk.

**This amends §9.2's letter**, and the amendment is written into blueprint §9.2 as an `[AI, row 3]`
note in the closing commit — the form row 2 used at §9.3b, reversible by Kabe as a new-row decision.
§9.2's own v2 clause is Kabe's and names exactly this problem: "an llm looks at it and identifies
the rear points that touch the ground". Row 2's green witnesses a placeholder desk deliberately
painted with a stretcher rail opaque across the leg span for its bottom 8 % of rows; real generated
art makes no such authoring choice, so `mechanisms.spec`'s pixel-truth clause is re-expressed for
real art as *`footprint` contains the bottom-two-rows extent and lies inside the alpha bbox*,
while `px` and `base.y` stay pixel-identical.

### 5.3 Manual regions

`--anchor NAME:x0,y0,x1,y1`, repeatable, **in source coordinates** (the operator measures on the
image they can open), translated by `trim_offset`. Outside the canvas or inverted is a hard error
naming both rectangles — never a clamp, because a clamped anchor is a record lying about where a
thing is. `drawer_cavity` is handled in §6.3. VLM detection is the v2 seam (`detect_regions(rgba,
ask)`), present and uncalled.

## 6. Stage 3 — parts (`parts.py`, `maskgen.py`)

### 6.1 The mask and its vertices

`polygon_mask` / `rect_mask` are pure; the CLI writes the mask PNG §9.3 names and, with
`--overlay`, the mask drawn over its source for the eye.

**Vertex determination, fixed as one procedure so a different agent reproduces it.** Round 2 is
right that "read a grid overlay" is a hand-read mask wearing a ruler. The procedure is:
1. A coarse rectangle is given (`--part-hint x0,y0,x1,y1`, source coordinates) — the only human
   input, and it needs no precision.
2. The four edges are **fitted programmatically**: for sample columns across the hint, the darkest
   pixel within a search window around the hint's top and bottom edges is the reveal gap; a
   least-squares line through those minima is the edge. Left and right edges are fitted the same way
   over rows. The polygon is the four fitted lines' intersections.
3. `maskgen` writes the vertices **and the fitted residuals** into a sidecar
   `replicator/masks/<id>/<part>.json`, which is the single home for both the numbers and the
   invocation; `design/architecture.md` points at it rather than copying it, and a test re-runs the
   fit from the hint and byte-compares the mask — the staleness lesson rows 1–2 already paid for
   with `fixture.js`.

The adherence check becomes **per-edge**, not a mean over the whole ring: a mask correct on three
sides and 15 px out on the fourth averages to a pass, and gate (d) at closed cannot see it either
because the over-cut pixels are covered by the part. Warn-level with the per-edge numbers reported —
measured on the corpus desk the fitted mask scores 0.51 of samples within 3 px against 0.24–0.27 for
masks displaced 20–30 px, which discriminates but not sharply enough to block on.

### 6.2 Cut and cavity

Mask must match the source's dimensions (mismatch is a hard error naming both). Part image = body
where mask, alpha = body alpha ∧ mask, trimmed; `origin` = its bbox top-left in body pixel space.
Cavity = boundary-propagated fill, Gaussian blur, × `cavity.darken` (0.45 — `src/placeholders.js`'s
own recess factor, so the ingested body satisfies the same `mechanisms.spec` body/part luminance
ratio the placeholders do). Measured on the corpus desk: cavity 19.1 against part 45.9, ratio 0.42
against a 0.7 bar.

### 6.3 `slide`, `drawer_cavity`, and what makes the part *work*

- **`--slide dx,dy,scale_open` is an operator flag (as in §9's CLI) and is checked.** The ingester
  computes `min_dy_clearance` — the smallest `dy` for which the open front's top edge clears the
  cavity — and hard-fails below it. Row 2's lesson turned into a check: `slide.dy` 0.24 was chosen
  so the revealed key draws *inside* the cavity rather than on the drawer's face, because children
  draw after their host's parts. `sign(dx)` is warned against `view_side`.
- **`drawer_cavity` is derived and the derived value is what the record carries.** The cavity is
  behind the drawer front and is not on the closed image, so it cannot be measured there. A
  `--anchor drawer_cavity:` flag is accepted (the done clause names "manually-flagged anchor
  regions" and this is where operator judgement enters); when both exist, **the flagged value is
  written if it agrees with the derived one within `cavity_agreement_tolerance` (a fraction of the
  part's height), and a disagreement beyond it is a hard error naming both rectangles.** "Contradicts"
  is that inequality, not a word.
- **An open-state check**: the pipeline composites body + part at `t = 1` and asserts the cavity is
  not covered. A drawer that only works closed fails here — nothing in §9.4 ever looks at the open
  state.

## 7. Stage 3b — two-state (`states.py`)

`--state-origin NAME:x,y` is **required**, in closed-sprite pixel space; there is no sound default,
because `framing.margin` centres each image on its own silhouette so the difference of two trim
offsets encodes the silhouette difference, not where the door stands.

**Its measurement procedure is written into `design/architecture.md` at the same resolution as
§6.1's**, because row 4 inherits a required flag: pick a datum visible in both images (the door
frame's inner jamb corner, which §11's own prompt keeps in frame), read its position in each
matted, trimmed image, and `origin = datum_closed − datum_open`. The datum-matching automation is
named as v2 and not built.

Alignment gate, per §9.3b as row 2 amended it (the base-midpoint clause deleted for swap sprites):
(i) hard — `|origin.y + state_h − body_h| ≤ 0.02 × body_h`; (ii) hard — the state rect lies inside
the body canvas, with its non-generality (a raised chest lid) repeated in the failure message;
(iii) warn — horizontal centre deviation. **x registration is not verified by geometry in v1 and the
gate says so in its own report.** Row 3 exercises this on constructed pairs only; M0's real door
pair does not exist until row 4, and the plan says that rather than letting a synthetic pair built
to the same assumption stand in for validation.

`states_images` as row 2 bound it: `{"open": {"image": …, "origin": {x, y}}}`. `extent` is **not**
written — architecture.md defines it as build-time presentation data row 4's bake derives.
Requiring `--state-origin` means row 4 will generally set `origin.x ≠ 0`, changing the consequence
architecture.md records (the open leaf and its gap reading on the same screen side from both rooms);
that is a [HUMAN] call and goes into the architecture note and the closing report.

## 8. Stage 3c — thumbs (`thumbs.py`)

Content bbox scaled so its longest side is 112 px, centred on a transparent 128 px square. §9.3c
says "crop"; a 128 px crop of a 919 px desk is a patch of oak, so this scales — a declared
deviation. Filter **LANCZOS, decided by looking**: at the ~8× decimation a real sprite needs,
nearest-neighbour drops the teardrop pulls and the reveal gaps and leaves a tile that reads as
noise. Both are deterministic; the contact sheet of §C class 3 carries the comparison to Kabe.

## 9. Stage 4 — gates (`gates.py`)

Every gate reports its measured value whether it passes or fails.

| id | severity | what it guards |
|---|---|---|
| a | hard | the edge does not read as the ground — four clauses, a4 two-grounded and two-sided |
| b | hard | enclosed ground-coloured regions remaining |
| c | hard | content bbox ≥ 512 px (≥ 128 px takeable) |
| d | hard | cutting a part and putting it back changes nothing else |
| e | **warn** | light direction, per §9.4's [HUMAN] "warn only" |
| f | hard | the contact-band derivation is not degenerate (+ warn on disagreement) |
| g | hard | the matte is not eating the object |
| h | hard | no baked studio shadow welded to the silhouette |
| alignment | hard | two-state closed-frame registration |
| thumb | hard | thumb present exactly when takeable, square |
| slide | hard | declared travel clears the cavity |
| open_state | hard | the open part does not cover the cavity |
| part_mask | warn | the mask boundary sits on the reveal gaps, per edge |

**All twelve are written into blueprint §9.4 in the closing commit**, in the `[AI, row 3]`
reversible form — after this row, "passes gates" means twelve things and §9.4 must be the document
that says so, or every downstream sentence using the phrase means something the blueprint does not
define.

Behaviour: everything runs in memory, gates run before anything is written. On a hard failure the
CLI writes nothing **into `library/<id>/`** — `--report PATH` is explicitly exempt, because a failure
report is the artifact the autonomous lane most needs. `--check` runs everything, writes nothing
into the library, and **exits with the same code it would have exited with had it written**, so
"passes gates" under `--check` means what it says.

**Exit codes partition by who must act** (the autonomous lane branches on them):
`0` pass, warnings allowed · `2` content failure — regenerate the source (gate failures, the
object touching the border, the erosion guard, a baked shadow) · `3` invocation failure — fix the
command (bad flags, mask size mismatch, out-of-canvas anchor, unknown vocabulary, cavity
disagreement) · `4` contract failure — the contract file itself is malformed.

**Controls.** `synth.py` carries a constructed must-fail image for every hard gate and every halo
clause — the §9.4 negative control (grey halo on grey ground) named among them and reachable by hand
as `python3 -m replicator.synth --case halo --out /tmp/nc.png` — plus the *calibration* controls §A
authority 2 requires (UL45-lit, top-lit and upper-right-lit solids; legged and squat objects with
known stances; a shadowed source). §9.4 names one control; making it a family is what turns "every
gate goes red when you break what it guards" into something the suite runs.

**And one adversarial input the gates' author did not construct.** Every other case is written by
the same hand from the same reading, which is the failure the method exists to prevent. So the suite
also perturbs a **corpus** image mechanically — a shadow composited beneath it, a gamma shift, a
resample to 256 px — and asserts the gates respond. The perturbations are mechanical and known;
the gates' assumptions had no say in them.

## 10. Stage 5 — record (`record.py`)

The §6 record as row 2 bound it, plus §B's `measured` block and `provenance.environment`.

- `px`, `base.y` pixel-derived; `base.x`/`footprint` from §5.2.
- `attachment`: `floor_against`, `floor_free`, `wall_mounted`, `anchored`. `archetype`: `static`,
  `sliding`, `swap`. **Both vocabularies live in `contract.json`** — one home — with a test that
  cross-checks the shipped `src/placeholders.js` records against it, reading the placeholders
  without making them the authority (they are replaced at row 4).
- **`dims_m`: all three from the operator.** Deriving them through the camera is refused: §5 says in
  terms that the project camera is unsettled. The pixel arithmetic survives as a **warn-only
  cross-check that never writes**, and its warning is carried into the record and named in the
  closing report as a defect of this asset — it is what the public repository holds until row 4.
- **`light`** = `contract.light.key` per §6, beside `measured.light` carrying the contradiction
  (`agrees_with_declared: false`), so no reader can take the declaration on faith. The row-2 finding
  was literally "every record declared `light: "UL45"` as truth" while the pixels said otherwise.
- `provenance` = `{source, tool: "replicator-ingest-v1", contract: {schema, ingest_schema},
  environment: {python, numpy, pillow}, gates: […], derived: {…}}`.
- Emitted JSON sorted-key, 2-space, LF, trailing newline. **The determinism claim is scoped**: the
  record JSON is byte-deterministic; the PNGs are byte-deterministic within one recorded
  environment, and `provenance.environment` is what makes that checkable rather than assumed.

Written into `library/<id>/`: `sprite.png`, `record.json`, `parts/<part>.png`, `states/<name>.png`,
`thumb.png`. **`preview.png` and the contact sheet go to `--preview-dir`, outside the library**, and
default to a scratch path — blueprint §2 defines `library/<id>/` as the sprite's shipped contents
and row 4's bake reads it. Orphan `parts/` and `states/` files the new record does not name are
deleted; nothing outside `library/<id>/` is written except where `--report`/`--preview-dir` name it.

**Two records for one id.** `src/placeholders.js` will carry a `desk-joined-oak-1660` whose
footprint is the bottom-two-rows extent and whose `dims_m` proportions differ from the ingested
desk's pixels. The architecture note states which is authoritative during rows 3–4 (the procedural
one — the demo binds to it and row 4's bake is what switches) and that the id is knowingly
double-homed until then.

## 11. The CLI (`ingest.py`) is thin

`main(argv) -> int`: parse → decode → `contract.load()` → **one** call to
`pipeline.ingest_sprite(...)` → write on pass → report → exit code. A test proves it rather than
asserting it: the pure pipeline is run on in-memory arrays and its encoded outputs are byte-compared
against the files the CLI writes.

The report JSON's shape is pinned here (the autonomous lane keys on it, and exit 0 covers
pass-with-warnings): `tool`, `contract`, `environment`, `id`, `source`, `written`, `ok`,
`exit_code`, `gates[] {id, severity, passed, measured, threshold, message}`, `warnings[]`,
`failures[]`, `derived`, `measured`. `test_cli.py` asserts every key by name and asserts
`warnings` contains `"e"` for a wrong-light input, which is the exact predicate the lane evaluates.

## 12. Tests (`replicator/tests/`)

stdlib `unittest`; every image constructed in `synth.py`; no binary fixtures committed.

`test_matte`, `test_anchors`, `test_parts`, `test_maskgen` (including the fit-from-hint
re-derivation byte-compare), `test_slide`, `test_states`, `test_thumbs`, `test_gates` (each gate and
each halo clause green on a clean control and red on its own), `test_calibration` (the constructed
controls that authorise the thresholds actually separate — a gate whose control cannot fail is
reported as non-discriminating), `test_perturbed_corpus` (§9's independent adversarial inputs),
`test_negative_control`, `test_record`, `test_cli`, `test_contract` (authorities and bases present,
freeze fields present), `test_vocabularies`, and:

**`test_bound_shape`, split.** *(a) Row 3's question:* the emitted `record.json` + PNGs read back
from disk into the row-2 bound library shape, asserting `images.parts` keys equal
`record.parts[].id`, `images.states` keys equal `record.states_images` keys, and `extent` computed
from the state image's bottom-two-rows alpha ≥ 128 offset by `origin.x`; then the **shipped**
`tools/validate-fixtures.mjs` `validate()` run through node over a **minimal fixture authored in a
temp directory**, staging the emitted record alone, so the validator's record-level clauses apply to
this row's record with no coupling to the demo fixture's composition. Declared fallback if a minimal
fixture proves entangled with §12.9's narration enumeration: run over the demo fixture with the
record substituted and assert no finding names this record or its fields — weaker, and said out
loud. *(b) Not row 3's question:* whether this record preserves the demo fixture's staged overlap
spans is row 4's — `fixtures/` is outside this fence and a synthetic desk dimensioned to match the
placeholder would pass by construction and witness nothing.

## 13. Order of work, and the one look

1. **`design/comparison-criteria.md` drafted, dry-run and committed** (§D, §14) — before any corpus
   image is ingested and before any composite of ours exists.
2. `contract.json` committed, with authorities, bases and freeze fields.
3. Stages, controls, tests green.
4. `desk-corpus-2.png` → `library/desk-joined-oak-1660/` with its fitted mask, `--anchor
   surface_top`, `--slide`, `--height-m 0.78 --width-m 1.30 --depth-m 0.55`.
5. `desk-corpus-1.png` → **`--check`, with the same flag set** (its own fitted mask from its own
   hint, its own anchors and the same dims), so "both desk generations pass matting and gates" means
   the same gate set for both. The closing report names any gate either desk was not subjected to.
6. **The one look.** `preview.py` writes the sprite composited at real draw height (75 px, from §5's
   own arithmetic: 0.78 m at 96 px/m in a 1536 px frame) over dark and light grounds, **with the
   contact pool and footprint span drawn** so quality 2 is looked at and not only width-checked.
   The builder looks and reports what it shows.

**What the look is not.** It is not the product's renderer. Row 2 found that the renderer's
`destination-in` re-clip squared partial alpha — "every matted edge arriving at rows 3–4 would have
lost half its alpha and hardened into exactly the cut-out silhouette the flip test exists to catch"
— and this sprite is the first genuinely feathered edge in the project. So the row **also** runs
that edge through the real draw path: a throwaway Playwright page in the critic's own worktree that
loads `src/renderer.js` unmodified, binds a library object holding the emitted PNGs in the row-2
bound shape, and renders one frame with tint and contact shadow over the grid floor. `src/`,
`index.html`, `fixtures/` and `tools/` are read, never written; the page is scratch. If that proves
impossible inside this row's fence, the closing report says no evidence exists about how this sprite
composites until row 4, rather than letting a lone sprite on near-black stand in for it.

The intention's row 4 says the probe desk **supersedes** this one, so the desk is emitted honestly:
no threshold moves to flatter it, no pixel surgery, and its full gate report goes into the closing
message whatever it says.

## 14. `design/comparison-criteria.md`

Drafted in full per §D, dry-run against `design/references/style-seed-warm.png` (a real interior
with objects, not ours) and one current frame of ours, with both outcomes recorded in the document
as the freeze's evidence. Populations stated in frame-only vocabulary; the symmetric
object/architecture test; the rate rule of §D.3 worked on numbers; a worked losing build per
criterion; the bare-facing license handled per population, with occlusion's empty set a **loss**
rather than a vacuous tie. Blueprint §12.10 gains a pointer to it in the closing commit.

## 15. Edges

**Must not touch.** `src/`, `index.html`, `fixtures/`, `tests/playwright/`, `tools/` — read and
executed by tests, never modified; the Playwright suite stays green unmodified (baseline this pass:
554 passed, Chromium and Firefox). `backdrops/` and `library-src/` are the asset seat's;
`library-src/corpus/` is readable input only. No AgentPost mailbox. No other spec row.

**Feels the change.** `library/` comes into existence (nothing in the demo reads it until row 4's
bake, so no rendered pixel moves). `design/blueprint.md`: §2's layout, §10's shown JSON, §12.10's
pointer, and `[AI, row 3]` amendment notes at §9.4 (all twelve gates) and §9.2 (the ground-contact
footprint). `design/architecture.md` gains the replicator section row 4 boards from: module map, the
pure-function seam, the calibration-authority rule, the per-class amendment path, the
`--state-origin` measurement procedure, the mask-fit procedure, and everything row 4 inherits — the
bake reproduces `extent` and `px`; the probe desk overwrites this one through the same gates;
`mechanisms.spec`'s light clause goes red on a real sprite; the pixel-truth clause re-expressed for
`footprint`/`base.x`; the one-hull-ellipse contact residue; the double-homed id. `README.md` gains
the install line, the one command and one paragraph in the product's voice.

**Risks named.** Gate (a) on a genuinely grey object with a real halo — a1 may pass and a2/a3/a4 are
the nets. Erosion on very thin features — the guard reports its number every run and `classes` is
the path. Two-state x registration unverified by geometry. A corpus image failing a hard gate — the
fork is the Navigator's per §3.1.

## 16. Out of scope, declared

§4b rules 3 and 4 — the materialization ladder and content-addressed keying — are structure this row
does not build; its scope is rule 1 (pure stages, thin CLI) and rule 5 (the VLM seam).

---

## 17. Disposition of both critique rounds

**Round 2, blocking.** F1 §A · F2 §3.3 (estimator-response reference, control-sized band) ·
F3 §B residue + Navigator fork · F4 §9 (all twelve gates into §9.4) · F5 §5.2 (footprint derived,
lane stays autonomous) · F6 §13.5 (same flag set, same gate set, named in the report) · F7 §3.3
(two grounds, two-sided) · F8 §B gate (h) · F9 §3.1 (per-class amendment path) · F10 §A (rules, not
pixel counts) · F11 §C (block states the per-facing constraint, not a global key) · F12 §C
(`status: provisional`, cannot become effective by silence) · F13 §C (exemption premise carried to
the Navigator) · F15 §13 (the real draw path, or the absence of evidence stated) · F16 §B (contact
drawn in the preview; the one-hull-ellipse residue named) · F17 §B (`measured.chroma`) · F19/F20/
F21/F22 §D · F23 §3.1 (freeze scope table) · F31 §7 (measurement procedure written).

**Round 2, observations.** F14 §3.1 (frozen vs provisional in the file) · F18 §B (pitch named
unmeasured) · F24 §9 (exit codes partition by who must act) · F25 §9 (report exempt from the write
ban) · F26 §9 (`--check` exits the code it would have) · F27 §6.1 (per-edge) · F28 §6.1 (one home
plus a re-derivation byte-compare) · F29 §6.1 (fitted, not read) · F30 §6.3 (agreement tolerance,
derived value written) · F32 §10 (double-homed id named) · F33 §10 (the dims warning is a named
defect of this asset) · F34 §10 (`preview.png` leaves the library) · F35 §10/§12 (vocabulary's home
is the contract) · F36 §9 (mechanically perturbed corpus inputs) · F37 §10 (`provenance.environment`,
determinism scoped) · F38 §3.1 (if the target moves, the report says what failed).

**Round 1** was disposed of in revision 2; §A–§D supersede several of those answers, and where they
do, this revision's text governs.

**Nothing is declined.** Four things are fixed by *stating* rather than solving, and each says so in
the artifact itself: two-state x registration, the demo-fixture composition question, quality 1
uncertified on real art, and M0's one-hull-ellipse contact.
