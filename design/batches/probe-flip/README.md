# Row 4 probe — the first composited frame, and why no sprite shipped

Four captures of the study looking north, drawn by the shipped `src/renderer.js` onto the
Kabe-approved backdrop `backdrops/source/study-N/cand-2.png`, with the three generated probe
sprites matted by the shipped replicator pipeline. §12.6 capture spec: the `#scene` element alone,
native 1536×1024, cold `file://` load, Chromium, `body.capture` (no chrome), nothing hovered,
nothing focused.

**The headline, first, because it changes what these frames are.** *All three probe sprites fail
hard gates.* The ingester wrote nothing: `library/` is untouched and still holds row 3's corpus
desk. The frames below were made by running the same pure pipeline (`replicator/pipeline.py`,
unmodified) and compositing what it produced anyway — because the probe exists for Kabe's eye and
a matte that fails a gate is exactly the thing worth looking at. **Nothing here is a shipped
asset.** Every gate number is in `gate-evidence/`.

| file | what it is |
|---|---|
| `01-study-N-composite.png` | the composite — desk and chair placed at the fixture's staged plan positions, drawer closed, key unknown and undrawn |
| `02-study-N-backdrop-only.png` | the flip mate — the same call with the renderer's own `backdrop_only` option, so the pair differs in nothing but the sprites |
| `03-study-N-drawer-open-key.png` | drawer open, key revealed in the cavity, as the demo actually stages it |
| `04-study-N-drawer-open-key-chair-lifted.png` | **diagnostic, not a flip frame** — the same world with `chair1` lifted out, because at the staged `u` the chair stands in front of the cavity and hides most of the key |

The pair is honest: `01` and `02` differ in **65,652 pixels**, all inside one box, x 1127→1433,
y 564→914 — the sprites and their contact pools and nothing else. The composite renders
byte-identically twice (SHA-256 `7d387c0d…`). Zero network requests on the whole run.

---

## 1. What was measured off cand-2, against what was nominal

Full workings, and how each number was found, in `design/plan-draft/study-N-meta-draft.json`.
Nominal was 24 mm equivalent, camera 4.35 m from the wall, eye 1.83 m, pitched slightly down.

| | nominal / plan | **measured** | delta |
|---|---|---|---|
| `px_per_m_at_wall` | 235.4 (24 mm at 4.35 m) | **232.22** | −1.35 % |
| `camera_wall_m` | 4.35 | **4.41** | +1.37 % |
| **eye height** | **1.83 m** | **1.232 m** | **−0.598 m, −32.7 %** |
| **pitch** | **slightly down** | **none — principal point 22 px *above* frame centre** | wrong sign |
| storey height | 2.8 m (plan) | 2.993 m | +6.9 % |
| wall width in view | 5.45 m (plan, study N) | 5.344 m | −1.94 % |
| `horizon_y` | 0.48 (project canonical) | 0.4785 | −0.3 % |
| `floor_line_y` | 0.63 (grid canonical at eye 1.60) | 0.7578 | +0.128 of frame |
| nearest visible floor | 3.077 m (the 24 mm preview) | **2.362 m** | **−0.72 m** |
| `key_dir` | `UL` (contract) | left, and **below** | fails UL |

**Three things in that table matter more than the rest.**

**The camera is a metre and a quarter off the floor, not six feet.** Measured, not guessed: a
vanishing-point vote over Sobel gradients, run separately on three disjoint regions that share no
pixels — the floor below y 789 votes (768, 486), the ceiling above y 74 votes (754, 498), the two
side-wall bands vote (748, 516). The wall–floor line is at y 776 (the strong step at y 742 is the
*skirting cap*, not the floor; confirmed at 4× zoom and independently by the hearth slab's back
edge at y 775). 776 − 490 = 286 px of eye height, and at 232.2 px/m that is 1.232 m. The generator
was asked for 1.83 m and drew 1.23 m.

**And that disobedience is good for the picture.** The frame-bottom floor cut — the intention's
fifth quality, *the camera has feet* — comes in to **2.36 m** where every 24 mm preview frame this
project has drawn put it at 3.08 m. §10's residue for row 4 reads *"the nearest visible floor sits
at ~3 m under any honest lens — the feet return via lens-shift and near-surface anchoring at the
probe."* They returned by the camera simply being lower. It is worth deciding whether to keep the
low camera on the remaining seven backdrops rather than correcting toward 1.83 m.

**The brief's calibration reference was wrong, and the pixels say so.** The measurement was asked
for against *"a period fireplace opening ~1.4 m wide."* The opening measures **209 px** across
(inner stone jamb to inner stone jamb, stable over y 600→720). At 1.4 m that gives 149.3 px/m,
which makes the room **4.66 m** floor-to-ceiling and puts the mantel shelf **1.96 m** off the
floor. At **0.90 m** — a chamber fireplace, which is what cand-2 depicts — the storey is 2.99 m
and the mantel shelf is 1.40 m, and the same scale is reached independently by the ruled 24 mm
lens at the nominal standpoint (235.4 px/m, 1.35 % away). **The adopted reference is the fireplace
opening at 0.90 m**, and the 1.4 m figure is refuted rather than quietly dropped.

**The corners are real and they are symmetric.** 147 and 1388, midpoint 767.5 against a frame
centre of 768 — the camera is square to the wall and unrolled. The wall–ceiling line is dead
horizontal at y 81 across the whole span. One consequence for the Navigator: `px_per_m_at_wall ×
wall_width_m` = 1241 px, **81 % of the canvas, not the canvas width** — §5's row-2 amendment
asserts that product ≈ canvas width on any meta, and that clause is false of the first honestly
measured backdrop, whose corners are both in frame. The corner span *is* the u-domain under row
11's model, so the clause wants to become "corner span".

**The light does not read UL.** The dominant practical is the hearth at (451, 696): left of centre,
yes — but **206 px below the measured horizon**. Gate (e)'s own Sobel bright-side estimator, run on
the frame, returns 83.8° against the 115.5° a constructed UL45 control gives, and −91.9° on the
wall band alone. The left-third-minus-right-third luminance is **−13.16** on the whole frame and
−4.49 on the wall band, against the **+2.0** that `mechanisms.spec.mjs`'s light clause and gate
(e)'s `min_third_tilt` both require. The sign is negative because there are two lights, not one:
the fire is a warm local practical at lower-left, while the frame's broad illumination rises to the
right (wall band mean luminance 7.8 at x 147 → 38.7 at x 1187; floor 32 at x 0 → 122 at x 1408).
`key_tint` was measured off the firelit ceiling bounce and is **#c8a681**; the same normalisation
gives **#c88042** for the floor immediately in front of the hearth (far warmer) and **#c8bdbc** for
the right-hand floor (neutral), so a single `key_tint` for this facing is already a compromise
between two lights.

---

## 2. Gate results, with numbers

Every run is `--check` on the shipped ingester with no code changed. Exit 2 on all three — the
ingester's "regenerate the source" code. Full reports in `gate-evidence/ingest-report-*.json`.

### desk-joined-oak-1660 — 13 checks (sliding), **4 hard failures**

```
python3 -m replicator.ingest library-src/probe/desk-joined-oak-1660.png \
  --id desk-joined-oak-1660 --noun "joined oak writing desk" --archetype sliding \
  --attachment floor_against --height-m 0.78 --width-m 0.89 --depth-m 0.55 --view-side left \
  --part drawer_front:MASK.png --slide=-0.04,0.1094,1.04 \
  --anchor surface_top:60,205,1180,300 --check
```

| id | verdict | measured |
|---|---|---|
| **g** over-matte | **FAIL** | silhouette moves **10.36 %** of its area across a ±25 % tolerance sweep (limit 2.00 %) |
| **b** holes | **FAIL** | **14** enclosed ground-coloured regions remain, largest **631 px** (tolerance 70.4, min area 83) |
| **h** shadow | **FAIL** | **16.38 %** of opaque pixels are ground-toned and sit below the object's own lowest solid pixel — 94,584 px of matted-in studio shadow |
| **slide** | **FAIL** | at full travel only **59 %** of the open part still lies against the carcass (floor 80 %) |
| a halo | ok | a2 0.9417, a3 1.0324, a4 −0.0495 dark / 0.0100 light |
| c resolution | ok | content bbox 905 px against a floor of 512 |
| d state diff | ok | mean abs 0.0003, 0 px over threshold |
| open_state | ok | the open part clears the cavity |
| thumb, dims | ok | dims ratio 0.9712 |
| f contact | warn | contact band spans **19.8×** the bottom-two-rows extent; footprint 0→475 of 500, **95 % of the sprite width** |
| e light | warn | bright-side −45.9°, **161.4° from** the UL45 control's 115.5° |
| part_mask | report | worst edge 0.79 (left); the fit's own residuals are ≤ 1.8 px on every edge — see the overlay |

**`slide` has no satisfying value on this desk, and that is a fact about the generation.** The
clearance bound needs `dy ≥ 0.1094`; the carcass-backing floor of 0.80 needs `dy ≤ 0.065`. The two
windows do not overlap. Swept at `dx` 0: backing is 1.000 at dy 0.03, 0.905 at 0.05, 0.721 at 0.08,
**0.552 at the 0.1094 minimum**, 0.085 by dy 0.20. This is the same family as
`architecture.md`'s inherited residue 12 — a shallow frieze drawer over open leg space with only a
thin rail beneath it. The frames use `dy 0.1094` (minimum clearance) so Kabe can see what the
failure looks like; `04` is where to look.

**Gate (f)'s warning is downstream of gate (h)'s failure.** The matted-in shadow widens the contact
band to 95 % of the sprite, so the renderer draws its contact pool across almost the whole desk.
The pool does fire — rendering with `shadows:false` changes 16,011 px, max channel delta 95 — but
it is drawn from a footprint the shadow invented.

### chair-joined — 9 checks (static), **2 hard failures**

| id | verdict | measured |
|---|---|---|
| **g** | **FAIL** | silhouette moves **4.93 %** (limit 2.00 %) |
| **b** | **FAIL** | **29** regions, largest **11,252 px** (min area 129) |
| a, c, **h**, thumb, dims | ok | h is clean at 0.608 %; dims ratio 0.9265 |
| f | warn | contact band 12.8× the bottom-two-rows extent |
| e | warn | bright-side 57.7°, **57.8° from** 115.5° |

### key-iron — 9 checks (static, takeable, airborne), **3 hard failures**

| id | verdict | measured |
|---|---|---|
| **g** | **FAIL** | silhouette moves **4.90 %** (limit 2.00 %) |
| **b** | **FAIL** | **50** regions, largest **1,756 px** (min area 32) |
| **h** | **FAIL** | **14.81 %** — 27,997 px of matted-in studio shadow |
| a, c, f, thumb, dims | ok | dims ratio 1.0256 |
| e | warn | bright-side −82.6°, 161.9° off; third tilt 1.89 against the 2.0 the shipped clause needs |

### What the three failures actually are — looked at, not only measured

`gate-evidence/desk-gate-b-and-h.png`, `chair-gate-b.png`, `key-gate-b-and-h.png` composite each
matte over a light ground and paint **red** where gate (b) says a region remains and **blue** where
gate (h) says a shadow was matted in.

- **(h) is a true positive and it is the loudest defect in the batch.** The blue on the desk is a
  broad lake of studio-grey pooled under and to the left of the feet, spanning most of the sprite's
  width. It is not an artefact of the measure: you can see it in `01` and `04` as a flat mid-grey
  puddle on a dark oak floor. The three prompts all asked for *"a very soft tight contact hint
  directly beneath the feet"* while `negative_block` forbids *"cast shadow on background"* — **the
  prompt sheets contradict the contract**, and the generator did what the prompt said. That is a
  prompt fix, not a generation lottery.
- **(b) is, on this art, mostly a false positive worth reporting as such.** The red is not missed
  gaps. On the chair it is the *warm highlight on the lit back panel*; on the desk it is the *brass
  drop-pulls* and highlights on the turned stretcher. Gate (b) re-hunts at 2.2 × the matte's
  tolerance — 70.4 here — and these sources' lit oak lands inside 70.4 RGB units of their own
  studio grey, which on the chair is a dark ground (border median 99, against the corpus desk's
  116). The gate is doing what it was written to do; the sources are what changed. **Threshold
  authority is the Navigator's** and the contract's own amendment rule says a threshold may never
  move because a real arriving image failed — so this is reported, not worked around.
- **(g) is a true statement about the sources' backgrounds.** All three studio sweeps carry
  measurable grain (border σ 3.3–5.4) and a soft luminance gradient (corner-patch spread 7.1, 8.6
  and 16.4 levels). σ that size drives the matte's computed tolerance to its contract ceiling of
  32, and the contract's own basis says *"above 32 an oak brown starts to fall inside the net."*
  Dark oak on a mid-grey sweep at tolerance 32 is exactly the case. The prompts already forbade
  gradient and vignette; the generations have both.

---

## 3. Records: `view_angle_deg` and `style` went to a sidecar

The shipped `sprite/0.1` record built by `replicator/record.py` has **no field for either** —
`build()` takes a fixed argument list and `turn_deg` reaches it only from `contract.json`'s
`camera.turn_deg`. Nothing was patched. The two blueprint-§10 facts ride in
`library/<id>/probe-meta.json` beside the record:

```json
{ "view_angle_deg": -17, "style": "style-seed-warm-2026-08-21" }
```

desk −17, chair −12, key 0. Those files do not exist yet, because **the ingester wrote nothing**;
the sidecars are written by the same step that writes the records, when a generation passes.

Two consequences found by doing it, both for the Navigator:

1. **The ingester has no `--turn-deg` flag.** §10's per-placement view-angle ruling makes the turn
   a per-sprite fact, but `measured.dims_cross_check` — the only automated check for
   comparison-criteria's scale tell T5.3 — always judges the drawn width at the contract's fixed
   30°. The desk was generated at 17° and the chair at 12°; both were judged at 30°.
2. **`contract.json`'s `style_block` is still the row-3 placeholder text.** It was not authored
   here: the camera block is another builder's lane this run and the file was left alone entirely.
   The probe prompts carry the style seed's descriptors inline instead
   (`library-src/probe/*.prompt.txt`).

---

## 4. My own verification eye on the composite — where it reads as a sticker

One pass, hard, against the intention's five decomposed qualities. No critic round; Kabe's eye is
this probe's examiner.

**Halo / edge quality — clean, and this is the good news.** Gate (a) passes on all three, including
its a4 composited-rim clause judged over a dark ground and a light one at real draw scale
(−0.0495 dark / 0.0100 light on the desk, limit 0.30/0.45). Zoomed 3× into `01`, the desk's and
chair's silhouettes carry no bright rim against the dark panelling and no hardened cut-out edge
against the lit floor. The turned legs and the stretcher read as feathered oak, not as die-cut
shapes. **This is the one quality the batch clearly wins.**

**Contact — failed, and failed loudly.** Not by absence: the renderer's pool fires (16,011 px, max
channel delta 95, box x 1157→1433, y 793→914). It fails because the **matted-in studio shadow sits
on top of it**. In a 400×250 window around the desk's feet, **31.9 % of pixels** read as
ground-toned mid-grey — a flat, hard-edged, scalloped puddle of studio floor lying on painted oak
floorboards, catching none of the boards' grain and none of the firelight. If Kabe marks one thing
a sticker it will be this, and it is the same object in `01`, `03` and `04`. Look at the left front
foot of the desk in `04`: the grey extends a foot and a half beyond the object in world terms and
stops at a scallop.

**One light — failed, and the honest version is narrower than it first looked.** The sprites carry
a soft studio key with even fill; gate (e) puts the desk 161.4° and the key 161.9° from the UL45
control. Measured in frame, the sprite pixels average luminance 53.4 against 47.1 for the backdrop
pixels they replace and 53.1 for the surrounding floor and wall — so they are *not* globally
brighter than their surroundings, and I nearly wrote that they were. Where it does break is the
**upward-facing surfaces**: the desk's top strip averages **54.9 against 34.7 for the wall behind
it at the same rows**, a 58 % lift with no source in the room to justify it, and the chair's crest
rail does the same. The tint pass does fire (49,854 px, max channel delta 22 at `TINT_ALPHA` 0.18)
but 22 levels cannot carry a light direction, and §1's non-goals forbid relighting beyond it. Then
the backdrop's own key is not UL either (§1 above), so even a contract-perfect UL45 sprite would
not have matched this room.

**Occlusion chains — passes.** Draw order sorts `desk1` (baseline 817) behind `chair1` (baseline
883) and the chair genuinely occludes the desk's right end with opaque pixels, not touching
bounding boxes. In `03` the same rule works against the row: the chair also occludes the drawer
cavity and hides most of the revealed key, which is why `04` exists. That is a **staging** finding
for the fixture, not a compositing one — `desk1` at u 0.844 and `chair1` at u 0.834 put the chair
into the desk's side rather than at its front.

**Scale and the camera's feet — passes on the numbers, and is worth a look anyway.** The desk draws
207 px tall at a ground-plane scale of 265.5 px/m, which is 0.780 m against a declared 0.78; the
chair draws 319 px at 319.1 px/m, 1.000 m against a declared 1.00. Both derived from the meta by
independent arithmetic, not read off the renderer. What the numbers do not say: the desk is
**1.016 m wide as drawn**, not the 1.30 m the prompt asked for. The generator honoured the
proportion it drew (500 × 384 px) rather than the two dimensions it was given, exactly as the
corpus desk did at row 3 (`architecture.md` residue 10). Standing in the room it reads as a small
side table beside a full-size chair, and the room has a lot of empty wall.

**The open drawer — borderline, and the gate called it.** In `04` the front is clearly pulled out
of a dark recess and the key is legibly inside that recess, which is the risky surface this probe
was built for and it works better than row 3's desk could have. But the front hangs *below* the
carcass with the leg and stretcher visible through the gap where it used to be, and there are no
drawer sides — it reads more like a front that has dropped than a drawer that has slid. That is the
59 % carcass backing, seen.

**Two smaller things.** The sprites' oak reads cooler than the panelling and warmer than the floor —
R/B ratio 1.46 for the tinted sprite pixels against 1.89 for the wall behind and 1.08 for the floor
beside — so a single `key_tint` pull cannot land them on both, which is quality 1's temperature
half exactly as `architecture.md` residue 3 predicted. And `note1` was dropped from the probe world entirely — it
has no probe generation, and a procedural vellum notebook on a painted desk would have been a
sticker of my own making rather than one of the row's.

---

## 5. What is not here

- **`library/` gained nothing.** The ingester refuses to write on a hard failure ("the library
  directory is never left half-built"), and that refusal was respected. `library/desk-joined-oak-1660`
  is still row 3's corpus desk, pre-`style_block`, and the probe desk does **not** supersede it yet.
- The fitted drawer mask and its sidecar are in `gate-evidence/desk-drawer_front-mask.{png,json}`
  rather than in `replicator/masks/desk-joined-oak-1660/`, which is outside this run's write fence.
  The invocation that made them, re-runnable:

  ```
  python3 -m replicator.maskgen --size 1254x1254 \
    --fit-hint 344 380 1095 327 1095 465 344 517 \
    --fit-source library-src/probe/desk-joined-oak-1660.png \
    --out replicator/masks/desk-joined-oak-1660/drawer_front.png \
    --sidecar replicator/masks/desk-joined-oak-1660/drawer_front.json \
    --overlay library-src/probe/desk-joined-oak-1660.png --overlay-out overlay.png
  ```

  Worst-edge fit residual 1.22 px RMS, 1.82 px max. The overlay is
  `gate-evidence/desk-drawer-mask-overlay.png` and it was looked at.
- The frames were made by a throwaway, uncommitted Playwright script using the preview technique of
  `design/batches/perspective-preview`: the shipped page loaded from `file://`, `cand-2` and the
  measured meta injected as `HOLO_APP.backdrops["study/N"]`, the three matted sprites injected as
  `HOLO_APP.library` entries in the shape `src/placeholders.js` documents, and
  `HOLO.renderer.render` called with the page's own harness world. Nothing in `src/`, `tests/`,
  `fixtures/`, `tools/` or `replicator/` was modified, and `design/plan-draft/` and this directory
  are the only paths written.
