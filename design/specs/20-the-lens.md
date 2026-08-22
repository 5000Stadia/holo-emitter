# Row 20 — the lens

Plan for spec-list row 20, **revision 2** (revision 1 went to a plan critic and came back NOT PASS
on nineteen findings; this revision answers all of them, and the six that are decisions the
documents reserve went to the Navigator as a fork before this was written). The row's target and
its done live in `design/intention.md`; nothing is copied here.

---

## 0. The one sentence

Everything a facing draws today comes out of a `px_per_m_at_wall` pinned at **96**. This row
deletes that pin and derives the same field from a pinned **focal length** —
`px_per_m_at_wall = FOCAL_PX / cameraDistance(meta)`, `FOCAL_PX = 1024` — and stands back the
standpoints the new lens makes untenable. `horizon_y` stays 0.48, the eye height stays the ruled
interim 1.60 m, `px_per_m_at_bottom` stays 332.8: those three are what make the build reproduce
the frames Kabe approved, and moving any of them would move the approved look.

## 1. What becomes true that is not true today

**(a) The model becomes exactly a pinhole, and §5's recorded incoherence dies.** Blueprint §5's
[AI, row 2] note records a *"known incoherence, with numbers"*: a pinhole through the wall endpoint
implies ≈333 px/m at frame bottom where §5's example pins 210, and *"the scale lerp's implied
vanishing line sits at y ≈ 0.32, not the authored `horizon_y` 0.48 — entity foreshortening and the
authored horizon follow two different cameras."*

Under a pinned lens they are one camera, provably. A floor point at distance `d` from the
standpoint draws at `y = horizon_px + f·eye/d` and at scale `f/d`, so

```
scale(y) = (y − horizon_px) / eye
```

— **linear in y, and zero exactly at the authored horizon.** §5's own lerp between
`(floor_line_y, px_per_m_at_wall)` and `(image_h, px_per_m_at_bottom)` is that same line, because
both endpoints satisfy it once `px_per_m_at_wall = f/cam` and
`px_per_m_at_bottom = (image_h − horizon_px)/eye`. `scaleAtDepth(d) = px_per_m_at_wall · cam/(cam−d)`
reduces to `f/(cam−d)` = `f`/distance. The two cameras become one; §5's note is rewritten to say so
rather than left describing a defect that no longer exists.

**(b) Every facing gets the same lens and its own scale.** Today the implied focal length runs
187 px → 2014 px across the manor (a factor of 11, a 4 mm fisheye to a 47 mm normal); the shipped
study is an **8 mm / 131.5°** view. After this row every facing is 1024 px / 73.7° / 24 mm.

**(c) Walls wider than the frame run past it.** Under a pinned scale a wide wall had to be
*clipped* (which is what `WIDE_VIEW_POLICIES` exists to avoid); under a pinned lens it extends past
the frame, as in life. §12.5's clause (i) — *the wall in view fits the frame* — is therefore false
by design and is replaced rather than kept (§7.1).

**(d) The nearest visible floor is one number everywhere: 3.077 m.** *[SUPERSEDED by §14's measured
camera — it is 2.2295 m. The reasoning below stands; the number does not.]*
`nearest_floor = FOCAL_PX / px_per_m_at_bottom = eye / (1 − horizon_y)`, independent of standpoint.
See §9.1 — this is the row's largest named cost and the plan's first revision got its repair wrong.

**(e) Two facings show no floor and no ceiling, honestly and permanently.** The wall's foot is in
frame only when `camera_wall_m ≥ eye/(1 − horizon_y) = 3.077 m`, and at 24 mm you see
`tan(25.63°) + tan(27.47°) ≈ 1.00` metres of wall per metre of distance. The cross passage is
**2.60 m deep**, so from anywhere inside it `hall/N` and `hall/S` show wall from 0.48 m to 2.63 m:
no floor line, no ceiling line, corners 1137 px outside the frame. This is correct, it is
unavoidable at this lens, and it is a look consequence Kabe has not seen — §7.2 and §12 say what
the row does about it.

**(f) Objects near the wall draw larger, by a different factor per facing.** Wall scale goes
96 → **235.4** (study N/S, ×2.45), **250.4** (study E/W, ×2.61), **476.3** (hall N/S, ×4.96),
**170.7** (hall E/W, ×1.78). One number for the manor would be false; row 4's assets are judged
per facing.

## 2. The numbers this row must land on

Targets, from `design/batches/perspective-preview/README.md` — the frames Kabe approved:

| frame | camera_wall_m | px/m at wall | corners | floor % of frame |
|---|---|---|---|---|
| `01d` study/N at the threshold | **4.35** | **235.4** | **127 / 1409** | **15.2 %** |
| `02b` hall/E | **6.00** | **170.7** | 546 / 990 — both in | 25.3 % |

Derived here and checked against those: `floor_line_y = horizon_y + eye/camera_wall_m`, so
study/N = 0.4800 + 1.60/4.35 = **0.84781** (868.2 px; the README's measured floor line is y 868),
ceiling at 868.2 − 2.8×235.402 = **209.1** (README: y 209), floor share **15.22 %**.
hall/E = 0.48 + 1.60/6.00 = **0.74667** (764.6 px), ceiling **286.7** (README: y 287), floor share
**25.33 %**. Both reproduce the approved frames exactly — which is the evidence that the build's
arithmetic *is* the preview's and not a second one that nearly agrees.

The eight-facing table the build lands on (f = 1024, eye 1.60, horizon 0.48, storey 2.8):

| facing | type | camera_wall_m | source | px/m | wall px | corners | floor line px | ceiling y | side-wall share |
|---|---|---|---|---|---|---|---|---|---|
| study/N | enclosed | 4.35 | threshold | 235.402 | 1282.9 | 126.5 / 1409.5 | 868.2 | 209.0 | 16.5 % |
| study/E | enclosed | 4.09 | rule | 250.367 | 1201.8 | 167.1 / 1368.9 | 892.1 | 191.1 | 21.8 % |
| study/S | enclosed | 4.35 | threshold | 235.402 | 1282.9 | 126.5 / 1409.5 | 868.2 | 209.0 | 16.5 % |
| study/W | enclosed | 4.09 | rule | 250.367 | 1201.8 | 167.1 / 1368.9 | 892.1 | 191.1 | 21.8 % |
| hall/N | enclosed | 2.15 | threshold | 476.279 | 3810.2 | −1137 / 2673 — out | 1253.6 (below frame) | −80 (above frame) | 0 % |
| hall/E | corridor | 6.00 | rule | 170.667 | 443.7 | 546.1 / 989.9 | 764.6 | 286.7 | 71.1 % |
| hall/S | enclosed | 2.15 | threshold | 476.279 | 3810.2 | out | 1253.6 | −80 | 0 % |
| hall/W | corridor | 6.00 | rule | 170.667 | 443.7 | 546.1 / 989.9 | 764.6 | 286.7 | 71.1 % |

**Where the tests' literals come from, and it is not the implementation.** §12.5 requires per-facing
expected values by independent test-side arithmetic. The two inputs are `wall_width_m` and
`camera_wall_m`, and after this row `standpoints.tsv` — the file §12.5 names as that independent
source — is regenerated by the very code under test. So `helpers.mjs`'s `LIT.FACINGS` carries the
two numbers **typed from this table**, the table is derived here from the room rects and the rule
in §3 by hand, and every other expected value (`px/m`, corners, floor line, ceiling, nearest floor)
is computed test-side from those two by `LIT.facing()` — never imported, never read from
`projection.md`. `plan.spec` continues to cross-check the metas against `standpoints.tsv` as a
second, dependent witness and says in its own name that it is one.

## 3. The standpoint rule

### 3.1 The fork, and the reading this builds

Blueprint §10's ruling says *"Standpoints move to the thresholds (shape item 9's own convention)"*.
Two facts make the literal reading untenable, and both are [HUMAN] artifacts:

1. Kabe approved `02b`, which is the cross passage's east view **at 6.00 m** — its existing
   `standpoint_stand_back` 0.25 rule distance, not its threshold (7.55 m).
2. Under the literal reading `study/E` stands at 5.00 m, its 4.80 m wall draws 983 px, and its
   side-wall share reaches **36 %** — past the bound §7.2 sets for a facing that is not a corridor.

So the rule below is a **conditional**, and that is a narrowing of a [HUMAN]-tagged sentence. It was
carried to the Navigator before this revision and **ratified**: the conditional reading is the
ruling, and the two approved frames are its evidence — Kabe blessed `02b` at the drawn standpoint
and `01d` at the threshold, which is the conditional stated in pictures. The rule is written below
with both frames cited as what it rests on.

### 3.2 The rule, and where its criterion comes from

> A facing that views a **continuous** wall stands back to the **far side of the room** — a body's
> clearance off the wall behind it — **when, and only when, its own wall cannot be seen corner to
> corner from the drawn rule standpoint with a band of side wall beside each corner.** Otherwise
> the drawn rule standpoint stands. A facing that views no continuous wall — an `open` facing,
> whose far line is a horizon nobody stands across from, or a part-built view with no two corners
> — keeps the rule.

**Named for what it is.** Shape item 9 carries two halves: *"you view a wall from across the room"*
and *"you arrive IN the door"*. This rule is the first half. On `study/N` the wall behind you is the
south wall with its two windows and no door at all, so calling the position a doorway would be
false; where the room's door **is** on the opposite wall the two halves coincide, which is item 9's
own observation and not something this rule needs. The stored token is `threshold` because that is
the blueprint's word for it, and the plan document defines it in the sentence above.

**The criterion comes from the frame Kabe approved, not from this row.** Research §8.2 reserves
*"must a room show both of its corners?"* to Kabe — *"the one genuine fork in this document"* — and
blueprint §7 reserves the edge-corner half the same way. Rather than invent a margin, the bound is
read off `01d`, the frame he approved and which the preview README describes as *"both corners in
view … with a band of side wall standing beside each one, so the room reads as a room rather than
as a wall that happens to end"*: that frame draws its wall across **83.5 %** of the frame width. So

> **the viewed wall may occupy at most five sixths of the frame width** (83.3 %, a 128 px band of
> side wall each side)

is the fit test, and its provenance is an approved artifact. Any margin from ~64 px to ~130 px
selects the same standpoints on this manor, so the answer is not sensitive to the exact figure —
which is stated because it is the honest defence of a number a builder chose the *form* of.

**Ratified by the Navigator as the INTERIM criterion**, with its extraction provenance recorded:
five sixths is read off `01d`'s measured 83.5 %, and **the camera row 4's approved backdrop measures
supersedes it**, exactly as blueprint §5 rules for everything else about the camera. The plan
document carries the fraction so a redline recomputes standpoints from it rather than from a number
buried in a tool.

### 3.3 Mechanically

With `K = standpoint_stand_back` (0.25) and `C = standpoint_threshold_clearance_m` (**0.45**, new
to the plan document, in metres like every other number in it — a person cannot stand with their
eye in the wall plane, and 0.45 m is what `01d` was rendered at):

```
rule_d        = measuredDistance(ruleStandpoint(rect, facing, K))
fits(d)       = wall_width_m × FOCAL_PX ≤ (5/6) × canvasW × d
threshold_pt  = the room-axis point C metres in from the wall opposite the viewed one
camera_wall_m = fits(rule_d) ? rule_d : max(rule_d, measuredDistance(threshold_pt))
```

`standpoint_source` becomes a **three-token set — `rule | threshold | drawn`** —
and `--rebuild-facings` recomputes `rule` and `threshold` from the rects and leaves `drawn` where it
was put, so §4b item 9's deliberately-placed standpoints stay expressible and the rebuild stays a
byte no-op on an unedited plan (a test asserts that, as today).

**Totality.** `deriveMeta` must be total over all three facing types, so:
`px_per_m_at_wall = FOCAL_PX / groundplane.cameraDistance(meta)`, and `cameraDistance` already reads
`camera_wall_m ?? camera_far_m` and throws on a meta naming neither. An `open` facing's scale is
therefore quoted at its far line, which is the only plane it has; the threshold branch does not
apply to it (there is no wall behind you to stand across from that the far line measures against).
A `wall_continuous: false` facing has no two corners, so `fits()` has no wall to fit and it keeps
the rule.

**Applied to the manor this moves 42 of 88 facings**, all of them backwards; it moves none where
`threshold_d < rule_d`. Four of the moved standpoints land inside built carriers — `study/S` and
`muniment_room/S` in their own chimney breasts, `back_stair/N` and `back_stair_head/N` on the
stair flight. That is an absurdity this row would be introducing, so **the threshold point is
pulled forward to clear any fireplace, stair or wall band it would otherwise stand in**, and a
validator clause makes a standpoint inside one a finding (§7.3, `row20:plan.standpoint_clear`).
`study/S` therefore stands at the breast's near face less the clearance: **camera_wall_m 3.85**,
not 4.35 — its own number, and the reason is drawn on the plan. (This is a narrow slice of row 19's
carrier work, taken because this row is what makes it reachable; row 19's scope is otherwise
untouched.)

**This is a drawn change.** Standpoints, their distances and `standpoint_source` are inside
`draw_plan.py`'s `DRAWN_KEYS`, so the drawn digest moves, the sheets re-render, and `approval.lock`
is re-anchored — see §12 for exactly what that stamp will and will not be allowed to claim.

## 4. The lens constant

- **Authored home:** `replicator/contract.json` `camera.focal_mm` — **50 → 24**, blueprint §10's
  [HUMAN] home for the generation camera, which the ruling moves. `prompt_block` and
  `backdrop_block` say "50mm" in prose and are corrected in the same change, because a backdrop
  generated at 50 mm and projected at 24 mm is the defect this row exists to remove. Nothing else
  in `replicator/` is touched — but `contract.identity()` hashes the **camera** block too
  (`camera.turn_deg` is an input to the `dims` verdict), so the corpus desk's record cites a
  contract that has changed and is **re-emitted by its own documented invocation**. A record left
  claiming conformance to a contract it no longer matches is exactly what that digest exists to
  prevent, and `architecture.md` carried a sentence saying the camera was outside it, which was
  false.
- **Code home:** `src/groundplane.js` — `FOCAL_MM = 24`, `FRAME_W_MM = 36`, `FOCAL_PX = 1024`
  (the frame is exactly the 36×24 mm format, so `FOCAL_MM × 1536/36` is exact), plus
  `pxPerMAtWall(d)` and `focalPx(meta)`. It is the module both the browser and Node already import
  for the ground plane.
- **The binding that can fail:** `assertRuledLens()` in `tools/plan-projection.mjs`, the twin of
  `assertRuledEye()` — it reads `replicator/contract.json` and refuses when `camera.focal_mm` is not
  `FOCAL_MM`. Called from the bake beside `assertRuledEye`, and cased in the ledger.

**"One lens per room" — the reading, and why.** The phrase admits (a) one global `FOCAL_PX`, whose
consequence is that turning inside a room never changes the lens; or (b) a per-room focal length,
constant across that room's four facings. This builds **(a)**, for three reasons that are in the
documents rather than in a preference: blueprint §10's ruling gives `f` as **one number** —
*"f = 1024 px on the 1536-frame"* — and the per-room clause as its consequence, *"so turning never
changes the body"*; research §9.5 argues (b) explicitly and against it — *"It does not license
varying the lens in this project… A varying lens without a hand on it is precisely the current
bug"*; and (b) does not rescue the cross passage anyway, which would need `f < 616` (a 103° view,
past every boundary the research found) to put its own floor in frame. The blueprint gains the
sentence, so a reader gets the same answer from the document.

**Rounding.** `camera_wall_m` is stored at the drawn two decimals and the standpoint exactly, so
`px_per_m_at_wall × cameraDistance` is `FOCAL_PX` only up to floating point. Every clause on it
carries a relative tolerance of 1e-9, and the meta's `px_per_m_at_wall` is computed from the
**stored two-decimal** distance — one rounding home, the same one the drawing prints.

## 5. What is deleted, and what that costs

`WIDE_VIEW_POLICIES`, `DEFAULT_WIDE_VIEW_POLICY`, `needsWideView`, `pinnedWallInFrame`, the
`camera: "pinned"|"wide"` and `wide_view_policy` meta fields, and the bake's refusal-on-wide.
Reason (research §8.5): both readings of the wide-view licence exist only to stop wide walls being
clipped by a pinned scale; a pinned lens does not clip, so the fork has no subject.

**Stated straight, because revision 1 got this wrong:** this **supersedes** Kabe's ruling (3), it
does not satisfy it. Ruling (3) granted open and corridor deep views *"their own wider camera"*;
under the pinned lens `hall/E` goes from an implied 106.3° to 73.7° — **narrower** — and no facing
is wider than any other. **The authority for the supersession is Kabe's own later act on the same
subject** (Navigator's ruling): `02b` *is* the 24 mm `hall/E` frame — a corridor deep view, narrower
than ruling (3) licensed — and *"full steam ahead"* approved it. The licence died by his approval of
the narrower picture. Recorded in the blueprint in those words and **named in the batch README as a
record, not a question**.

## 6. The hall's furniture has to move — forced, not chosen

`shelf1` and `stick1` are staged on `hall/N`, whose derived meta has no floor in frame (§1e). Their
baselines project to y 1377 and y 1484 on a 1024-px frame, and **the existing fixture-validator
clause already refuses them**: `scaleAtDepth(depth) ≤ px_per_m_at_bottom` is exactly "the object's
feet are inside the visible floor", and at 476.3 px/m the shelf computes 553.5 and the candlestick
620.6 against a bound of 332.8. The bake will not emit the fixture. So the move is forced by a guard
that already has teeth, not by this plan's judgement — and no standpoint inside a 2.60 m room fixes
it, and `horizon_y` is not this row's to move (§9.1).

**Where they go: `hall/E`**, the passage's 2.60 m east end wall seen from 6.00 m, where the floor
runs from 3.077 m to 6.00 m *[2.2295 m under §14's measured camera]*. The footprints, authored here rather than left to the build:

| object | plan footprint (m) | attachment | depth from wall | distance | scale | drawn |
|---|---|---|---|---|---|---|
| `shelf1` | x 38.70–39.00, y 10.65–11.65 | floor_against | 0.30 | 5.70 | 179.65 px/m | 201×323 px at x 622–824, baseline y 778.9 |
| `stick1` | x 38.50–38.66, y 10.92–11.08 | floor_free (`depth_m` 0.50) | 0.50 | 5.50 | 186.18 px/m | 30×102 px at x 734–764, baseline y 789.5 |

The candlestick stands 0.20 m in front of the press and 0.25 m to its right, crossing it over
92 rows of a 30-px-wide stem — comfortably past §12.8's floor of 50 intersecting opaque pixels, and
the count is measured in the build rather than predicted here. Draw order is right by baseline
(789.5 after 778.9). **The quality bar this recomposition has to clear is not the pixel count**: the
pair exists for quality 3, *column-before-building*, and at 6.00 m the two baselines separate by
~11 px where the tuned `hall/N` composition separated them by ~137. The build measures the crossing
and looks at the frame; if the pair reads as two objects side by side rather than one in front of
the other, the composition moves again (the candlestick forward, the press deeper) before the frame
is batched.

**What it costs, stated as decisions:**

- Blueprint §11's hall wall map moves the press from N to E. That is a **direction-setting
  artifact** under playbook §3.4 — *"wall maps … surfaced to Kabe as images for OK before it is
  locked or built against"* — and this row builds it first and batches it after. **The authority is
  a standing delegation** [HUMAN, in the record, relayed by the Navigator]: *"Standing rule, place
  things where they make sense in the room."* Placement is delegated to sensible judgement, the
  validator's refusal makes the move forced besides, and his eye overrules a sentence per object
  cheaply. §11's hall map is rewritten [AI] citing that delegation, and the frame is in the batch.
  Side-wall placement seen from the corridor views was considered and declined: an object on a wall
  other than the one a facing views is §4b item 9's multi-facing presence, which the projection does
  not derive until row 15, so it would be a schema change rather than a placement.
- `hall/E` carries a **1.00 m window at u 0.5**, drawn content Kabe approved and not an agent's to
  move. A 1.0 m wide, 1.8 m tall press cannot stand clear of it on a 2.60 m wall. The plan has no
  vertical datum (`architecture.md`: row 4 owns it), so nothing checks or draws the collision at
  V1; row 4's hall/E prompt sheet must either set the sill above the press's head or Kabe re-sites
  the window in his own drawing. Recorded as row-4 inheritance and named in the batch.
- §12.6's four deliberately-bare facings become **study S/W, hall N/S** (was hall E/S). [AI], with
  the standing licence.
- It **closes** a known limit rather than opening one: `architecture.md` records that every passage
  now arrives on a bare facing and *"the only thing that visibly changes is the door leaving the
  frame"*. Arrival into the hall is `hall/E`; after this it carries the press, the candlestick and
  the coin.
- `world.json` is untouched (no truth moves); `coin1` follows its host.
- `plan.objects[]` gains two re-sited footprints with their reasons — un-drawn content, second
  digest only.

**`chair1` does not move.** Revision 1 proposed changing its depth on a miscomputation of the
contact ellipse's offset (`SHADOW_DY × rx × ryF`, not `× rx`). Recomputed: at depth 1.20 its pool
centres at y **1023.6** on a 1024-px frame — the peak is in frame by 0.4 px, the whole upper half of
the pool is drawn, and §12.8's quantitative contact clause has real teeth on it for the first time.
The approved `01d` composition is reproduced unchanged, and the 0.4 px is named as residue (§9.5).
The desk's pool is not clipped at all (centre y 942.5, ry 56.6): revision 1's "~8 px clip" came from
the same wrong offset and is withdrawn.

## 7. The verification work

### 7.1 §12.5's frame clauses

Clause **(i)** (*the wall in view fits the frame*, plus its null-corner half) is **retired**, because
a pinned lens makes it false by design. Retiring it retires the three ledger mechanisms that carried
it — `meta.frame_fits_left`, `meta.frame_fits_right`, `meta.frame_fits_uncornered` — which is
narrowing a claim that stopped being true, in the form `architecture.md` prescribes for exactly
that. What stands in its place:

- **(i′) one lens.** `px_per_m_at_wall × cameraDistance(meta) = FOCAL_PX` on every meta the fixture
  resolves, within 1e-9 relative. **Said out loud, because the ledger's own scar demands it: on a
  DERIVED meta this holds by construction and cannot fail** — the same status blueprint §7 already
  records for the horizon clause. It has content on a **measured** meta (row 4's, where
  `px_per_m_at_wall` is measured off the image and `camera_wall_m` is read off the drawing) and on
  any hand-authored one; at V1 it is a schema clause, not a gate, and this row says so rather than
  counting it as green.
- **(v) the falsifiable half, in pixels.** What actually binds a meta to the canvas at V1 is the
  render: the grid draws its own metre module on the wall, so **the drawn spacing of the facing
  wall's vertical metre lines is measured and must equal `px_per_m_at_wall`**, and the drawn corner
  columns must equal the meta's, on every facing where they are in frame. Pixels against arithmetic
  — which is where the original clause's force lived, and it survives the model change.
- **(vi) corner honesty.** A corner vertical is drawn **iff** its computed x lies inside
  `[0, canvasW]` — measured off the render on all eight facings. That is the done clause *"corners
  appear exactly when honestly in frame"* made into pixels, and it is what carries `hall/N` and
  `hall/S`: the assertion there is that **no** corner column exists anywhere in the frame.

(ii) stands, with a stated behaviour it did not have: **where a corner falls outside the frame there
is nothing to measure**, so (ii) applies to corners in frame and row 4's metas carry computed
corners for the rest — the measured-against-arithmetic force survives only where a corner is
visible, and row 4 inherits that sentence. (iii) said *"only (i) has content"*; with (i) gone it
says instead that on a synthesized backdrop the corners are computed, so (ii) holds by construction
and the content is (v)'s pixel measurement. (iv) — `image_h_px` is the canvas — is unchanged.

### 7.2 The `+` junction guard, at two levels

The symptom is *"every direction is a corridor … like a + shape"*. Revision 1 measured only the
share of the frame taken by side-wall return, and the critic was right that a facing showing
**nothing but wall** scores 0 % and sails through. So two clauses, at two levels:

- **Per facing — the corridor read.** Every facing **not** typed `corridor` shows **< 1/3** of the
  frame as return (built: 0 %, 16.5 %, 21.8 %); every facing typed `corridor` shows **> 1/2** (built:
  71.1 %). Today the same measurements give 66 % for `study/N` and 84 % for `hall/E` — one band, no
  separation, which is why every direction reads the same. Computed from the meta and, separately,
  read off the render.
- **Per room — the room read.** Every room must have at least one facing that shows the room it is
  in: a corner in frame, or the wall-floor line in frame, or the wall-ceiling line in frame. The
  study passes on all four facings; the cross passage passes on E and W and fails on N and S, which
  is what being in a 2.60 m passage looks like. The guard is per room because that is the honest
  unit — the passage reads as a passage, and it reads as a passage from the two facings a player
  arrives and travels on.
- **And the facings that show none of the three are enumerated as a plan warning**, printed by the
  bake and carried into `projection.md` and the batch — the same idiom as the three existing
  warnings that *"cannot be fixed without moving something a human approved"*. Hiding two flat walls
  inside a green suite is exactly what a warning exists to prevent.

Ratified by the Navigator, with the observation that a close wall filling the frame **is** what
standing close looks like, and that the painted passage N/S backdrops the asset seat has delivered
show exactly this — Kabe has them in hand.

### 7.3 Ledger cases (the emit-site discipline)

Every new or changed mechanism arrives with a case in `tests/playwright/guards.spec.mjs` that fails
on **that clause alone**, names it by a stable `[row20:<name>]` token, is registered in the declared
`MECHANISMS` list, and asserts the tripped set **equals** `[name]`:

| token | mechanism | how the case breaks it |
|---|---|---|
| `row20:meta.one_lens` | a resolved meta whose `px_per_m_at_wall × camera distance ≠ FOCAL_PX` | doctor one meta field |
| `row20:plan.standpoint_source` | `standpoint_source` is one of the three tokens, and a `threshold` standpoint stands where the rule in §3.3 puts it | doctor a plan facing |
| `row20:plan.standpoint_stands_back` | a facing whose wall does not fit from its rule standpoint must not still claim `rule` | doctor a plan facing's source |
| `row20:plan.standpoint_clear` | a standpoint inside a fireplace, a stair flight or a wall band is a finding | doctor a plan standpoint |
| `row20:bake.refuses_foreign_lens` | the bake refuses a facing whose derived meta is not at `FOCAL_PX` (replaces `bake.refuses_wide_camera`) | doctor `FOCAL_PX` in a staged tree |
| `row20:bake.refuses_lens_drift` | `assertRuledLens` — contract `focal_mm` must be 24 | doctor a staged `replicator/contract.json` |
| `row20:renderer.corner_honesty` | corners are drawn exactly when in frame | remove the corner clip in a staged tree, measure the picture |
| `row20:renderer.glyph_cap` | the glyph's frame-fraction cap (§8) | delete the cap in a staged tree, measure the drawn glyph |

**AMENDED BY §14 — the table above is the plan, and the build differs from it in three ways, each
recorded rather than quietly dropped.** Built: `meta.one_lens`, `plan.standpoint_source`,
`plan.standpoint_branch` (which the table does not name — the token had to split, because one
token tagging two emit sites is the failure this ledger exists to prevent),
`plan.standpoint_stands_back`, `plan.standpoint_clear`, `plan.room_reads` (§7.2's per-room guard,
built as a hard clause after an artifact critic found it missing) and `bake.refuses_lens_drift`.
NOT built: `bake.refuses_foreign_lens`, which turned out to be `meta.one_lens` reached through the
bake and so a mechanism no case could isolate — narrowed rather than widened;
`renderer.corner_honesty` and `renderer.glyph_cap`, whose mechanisms are cased in
`mechanisms.spec` and `geometry.spec` as measured claims about the picture rather than as ledger
deletions. The glyph is 0.35 m of wall with no cap at all, and its size is measured off the render
against that number — a cap in frame fractions would have made it chrome wearing the wall's
clothes.

**What the completeness scan can and cannot see, stated rather than assumed.** Row 18 — the row that
makes the scan read every emit site — is unbuilt. The existing scan reads
`tools/validate-fixtures.mjs` and `tools/validate-plan.mjs` only. This row **extends it to
`tools/plan-projection.mjs` and `tools/bake-fixtures.mjs`**, which is two lines and covers every one
of its own document-side tokens; the renderer's tokens remain covered by `MECHANISMS` + a
registered case and **not** by a source scan, exactly as row 11's are, and that residue stays row
18's. Saying which half is scanned and which is on trust is the point.

### 7.4 The scored pass, before anything changes

Playbook §3.5 — *"For any large pass: write the scoring criteria BEFORE changing anything… At least
one critic reviews without knowing which version is newer"* — applies to this row more than to any
row so far. The criteria, written now and frozen:

1. Does this frame read as a room you are standing in, or as a wall you are facing?
2. Can you tell where the room ends?
3. Do the objects sit on the floor, or float on it?
4. Does the room look like the size the plan says it is (study 5.45 × 4.80 m, passage 8.00 × 2.60 m)?
5. Turning from this facing to the next, does it feel like one body turning in one room?
6. Is there anything in the frame that reads as a diagram rather than a place?

`design/batches/row20-lens/` carries **before/after pairs** of all eight facings, and a fresh
comparator with no knowledge of the project scores each criterion on both, unlabelled and
randomised, before the row closes. A criterion the new frames lose is a finding, not a note.

### 7.5 Everything else recomputed rather than re-blessed

`helpers.mjs`'s `LIT` (the master table), `heights.spec` (per-facing literals; the census moves to
`hall/E`), `geometry.spec` (the drawn floor line and horizon per facing — and on `hall/N`/`hall/S`,
where there is no drawn floor line, the falsifiable half becomes the drawn metre module against
`px_per_m_at_wall` plus the drawn eye line, and the coverage narrowing is recorded, not papered
over), `mechanisms.spec` (corner literals on eight facings, the two-term corridor ordering, the
overlap pairs, contact strength and spread per object, the lighting samples re-pointed inside the
new corners, and the "a corner does NOT move with the standpoint distance" case **inverted** —
under a pinned lens it does, which is what blueprint §5's [HUMAN] sentence asked for and row 11
could not deliver), `plan.spec` (derived-meta arithmetic, the `standpoints.tsv` cross-check, the
byte-identity at the new `APPROVAL_COMMIT`, the lens-varies case inverted to one-lens),
`validator.spec`, `walkthrough.spec` (the hall's coin is on the arrival facing now, and the
doctored corridor fixture's aligned door has to be re-derived: at 250.4 px/m the study door's
opening spans x 931–1156 and `hall/E`'s wall runs 546–990, so the aligned point is the 931–990
overlap and the second door's `u` follows from it), `determinism`, `knowledge`, `isolation`,
`turning`, `keyboard`, `voice`, `fixtures`, `shell`, `fullscreen`. Both engines, whole suite.

## 8. Renderer consequences

- **The facing glyph is capped, and its status changes.** It is *"1.5 m tall at wall scale"*; wall
  scale now runs 170 → 476 px/m, so on `hall/N` a 1.5 m mark is **714 px — 70 % of the frame
  height**, and a room with a metre-high letter filling it is a diagram. It becomes
  `min(1.5 m at wall scale, 0.14 × frame height)`. *[BUILT DIFFERENTLY, per §14: a frame-fraction cap
  makes the mark chrome wearing the wall's clothes, so what shipped is a flat 0.35 m at wall scale —
  60 to 167 px, bigger where the wall is closer, which is what paint on a wall does.]* **What that
  costs, said plainly:** on facings where the cap binds, the glyph is a frame-relative mark rather
  than something painted on the wall, which is not what §7 calls it. It is V1 signage that real
  backdrops replace, the cap keeps it from becoming the loudest object in the room, and the
  blueprint sentence is amended to say which it is.
- **Floor line below the frame and ceiling above it must not crash or lie.** Traced by hand through
  `drawGrid` for `hall/N`: the wall base fills the frame, the floor rect is degenerate, the floor
  grid clips to nothing, the return loops break on their first step, the corner verticals fall
  outside, and the ceiling line work is already gated on `wallTop > 0`. Confirmed by rendering, not
  by reading — a case asserts the picture is wall + metre lines + eye line + glyph and that nothing
  paints floor.

## 9. Residue this row records and does not fix

1. **SUPERSEDED BY §14's measured camera: it is 2.2295 m, not 3.077 m.** What follows was
   computed at the interim 1.60 m eye and the 0.48 horizon, before the approved backdrops were
   measured and their own camera adopted (eye 1.08775 m, horizon 524.4/1024). The BOUND below is
   the part that stays true, and it is why the quality is still not delivered: no lens shift at
   this focal length reaches a viewer's feet, because its infimum is the eye height itself.
   **The nearest visible floor is 3.077 m on every facing, and no lens shift brings it to your
   feet.** `nearest_floor = eye / (1 − horizon_y)`, so at f = 1024 its infimum over every horizon a
   picture can use is **the eye height itself, 1.60 m** — 0.45 gives 2.91 m, 0.42 gives 2.76 m, 0.31
   gives 2.32 m. Revision 1 booked this loss against "lens shift at row 4" and that arithmetic does
   not work; the critic was right. What is true: shift is a **partial** lever whose numbers are
   above, and the intention's fifth quality names its own second carrier — *"Kabe's reference
   anchors the same way through a near desk surface"* — so at f = 1024 the frame bottom is anchored
   by a near **surface**, not by floor. Both belong to row 4's measured camera, which can also carry
   §10's pitch half. `horizon_y` is not moved **in this row** because the frames Kabe approved were
   rendered at 0.48 and moving it would move the approved look; that is a sequencing decision, not a
   judgement that the lever is unavailable. First question in the batch.
2. **`hall/N` and `hall/S` show no floor, no ceiling and no corners** (§1e). Honest at 24 mm in a
   2.60 m room; caught by the per-room room-read guard and enumerated as a plan warning, not hidden.
3. **Objects draw larger by a different factor per facing** — ×1.78 to ×4.96 (§1f). Row 4's asset
   scale is judged per facing, not against one number.
4. **Sprites do not stretch.** Research §8.6: a real 24 mm lens elongates an off-axis object by up
   to 1.35× and a pasted sprite will not; `chair1` sits 37.2° off axis. §12.5's ±5 % height check
   assumes no stretch. Row 4's prompt sheets are where it is matched or ignored deliberately.
5. **WITHDRAWN — computed from a wrong shadow offset, and the lower camera settled it anyway:
   the chair's pool is bounded by y 616–920, about 104 px inside the frame.** What follows was
   the claim. **`chair1`'s contact pool centres 0.4 px inside the frame.** The peak is drawn and the clause has
   teeth, but the margin is a fact about the geometry rather than a choice; if row 4's assets move
   it, the clause goes red on the object that broke, which is what it is for.
6. **Turning translates the body further than before.** Threshold standpoints put the study's N and
   S standpoints **3.90 m apart in a 4.80 m room** (2.40 m today), study E/W 2.73 m, hall E/W
   4.00 m. The ruling's own words are *"one lens per room so turning never changes the body"*: this
   row fixes the lens half and worsens the position half, and `architecture.md` already carries the
   family as an open camera-has-feet defect. Multi-standpoint rooms (§4b item 9) are row 15's, and
   this is the number that will decide them. In the batch.
7. **The eye/pitch axis is untouched and still disagrees.** §10 rules eye 1.83 m with −8° pitch for
   generation; the renderer draws at 1.60 m level. A backdrop generated at 1.83 m and projected at
   1.60 m mis-sites the horizon by ~15 px; one generated at −8° and projected level mis-sites it by
   `f·tan 8° = 144 px`. That is the same class of defect this row removes on the focal axis, on an
   axis this row is not licensed to move. Row 4's prompt-sheet line is therefore handed on as
   *"24 mm"* only — **not** as "camera level", which research §8.2 offers explicitly as *"a proposal
   for Kabe"*. In the batch.
8. **The one real plan/staging divergence is magnified.** `door1` on `study/E` sits 1.1 m south of
   the east wall's centre on the approved drawing and centred in `staging.json`; at 250.4 px/m that
   disagreement is **275 px** of picture, against 106 px today. It is `projection.md` §0's question
   2 and Kabe's; this row makes it visible rather than resolving it. In the batch.
9. **The rooms read larger than their metres** (research §5.2), by a factor no reachable lens
   removes and uniform across all 88 facings.

## 10. Edges — what this must not touch, and what outside it feels the change

**Must not touch:** `backdrops/`, `library-src/`, `replicator/ingest.py` and every pipeline stage,
any other spec row, any AgentPost mailbox. No push. `world.json`. §10's `eye_height_m` and
`pitch_deg` — [HUMAN], and untouched.
**AMENDED BY §14:** this fence originally also held `horizon_y`, the 1.60 m interim eye height and
`px_per_m_at_bottom`, on the ground that the frames Kabe approved were rendered at them. All three
MOVED, under the Navigator's ruling that blueprint §5's approved-image authority governs once the
approved image exists and is measured. The consequence the fence was protecting is real and is now
a batch question: the composition of `01d` and `02b` is not the composition that ships.

**Feels the change:** row 4 (measured metas at 24 mm; prompt sheets get the focal only; §12.5 (ii)
is still the clause with teeth and still does not exist until a backdrop is measured; the feet
residue, the hall/E window, the pitch axis and the per-facing scale factors are all row 4's);
row 15 (the whole manor's new standpoints, the threshold rule, and residue 9.6); rows 18 and 19
(eight more tokens; row 19's carrier work partly reached here for standpoints only);
`design/plan-draft/` (two SVGs, two PNGs, `standpoints.tsv`, `render.lock`, `approval.lock`,
`projection.md`); `design/batches/row20-lens/`.

## 11. Order of work

1. Lens constants in `groundplane.js`; `GRID_META` derived from them in `renderer.js` — the
   **unplanned-facing fallback in full**, since blueprint §7 is its one home and every number moves:
   camera distance **4.0 m** (was 3.5 — chosen so the derived values stay exact decimals a human can
   check, which `geometry.spec` requires of the blueprint's own text), `px_per_m_at_wall` **256**,
   `floor_line_y` **0.88**, `px_per_m_at_bottom` **332.8**, `wall_width_m` **16.0** (no longer "the
   wall the frame holds" — now deliberately wider than the frame, so nothing about an unplanned
   facing reads as a claim that its wall ends), `calibration_ref` unchanged and `calibration_px`
   **256**, so §5's calibration audit still passes on its own pixels; `horizon_y` 0.48, `image_h_px`
   1024, `facing_type` null, corners null.
2. `plan-projection.mjs`: the camera carries `focal_px`; `deriveMeta` derives the scale;
   `assertRuledLens`; delete the wide-view machinery; the standpoint rule in `--rebuild-facings`.
3. `validate-plan.mjs`: the three-token `standpoint_source`, the threshold clause, the
   standpoint-clear clause.
4. `plan.json`: `standpoint_threshold_clearance_m`, every facing rebuilt, the two hall objects
   re-sited with their reasons.
5. `staging.json` + re-bake; `contract.json`'s camera and prompt prose.
6. Renderer: the glyph cap; render and look at the no-floor facings.
7. `validate-fixtures.mjs`: (i′), the retirement of (i)'s three clauses.
8. Re-render the sheets; re-anchor `approval.lock` and `APPROVAL_COMMIT` under §12's constraint;
   regenerate `projection.md`.
9. Tests: recompute every literal; the ledger cases; the two `+`-junction guards; both engines.
10. Documents brought true: blueprint §5/§7/§10/§11/§12.5/§12.6/§12.8, `architecture.md`, the README
    line about the plan, `design/plan-draft/README.md`'s redline recipe.
11. Capture the batch, score it against §7.4's criteria with a fresh comparator, commit — and then
    **stop**. The row does not close here; see §13.

## 13. The close holds for Kabe

**Ruled by the Navigator, and it changes this row's shape:** row 20's done clause gains a hold —
**the close and the push wait for Kabe's word on the batch**, exactly as row 11 did. The reason is
the one this row cannot argue with: it changes every pixel a player sees, so it is a taste gate, and
the playbook's *"any row that changes what the player sees carries in its done 'the human has
approved consumption-camera screenshots'"* governs. The row's done clause in `design/intention.md`
is amended to carry it (Navigator's packaging, cited to that ruling), and the row and this spec file
stay in place until his word lands. What this builder does: build fully, batch fully, commit the
work, **hold**, and report both hashes and the batch path. Nothing is pushed.

## 12. The approval stamp, and the batch

**What the stamp may claim.** `architecture.md`: the stamp asserts *Kabe approved this DRAWING*, and
re-anchoring is deliberately manual because *"an agent that could move them could approve its own
drawing."* Kabe approved two rendered **frames** of two facings; after this row the sheets show new
standpoints for 42 facings across two floors. So the lock is re-anchored as the handoff instructs,
**and it gains a scope line the sheet prints on its own face**: which approval the anchor rests on
(the 2026-08-21 preview frames `01d`/`02b` and *"full steam ahead"*), what the anchor covers
(standpoint markers and their distances, moved by a stated rule), and that the redrawn sheets
themselves are in `design/batches/row20-lens/` awaiting his eye. A stamp that says APPROVED without
saying of what would be the picture lying about the document. The lock must still trip on any other
drawn change, proved by a test that moves a wall and reads UNAPPROVED REVISION off the sheet.

**The batch carries its questions**, because a batch of eight frames with four live forks in it and
no question is a batch nobody can answer: the feet residue (9.1), the two wall-only passage facings
(9.2), the hall wall-map move and its window (§6), the standpoint reading and the corner criterion
(§3.1–3.2), the wide-view supersession (§5), the turning translation (9.6), the pitch axis (9.7),
`door1`'s magnified divergence (9.8), the redrawn sheets, and the before/after pairs §7.4 scores.
Four facings are bare, so their pairs assert composite == backdrop exactly and the batch says so.
The approved frames join `design/references/` with their V-stage when Kabe's verdict lands.

---

## 14. Revision 3 — what was actually built, and where the row stands

Revision 2 was written before two things arrived: the plan critic's second pass, and the eight
approved backdrops. Both moved the row, and this section is the difference rather than a rewrite.

**Built and green — 1090 tests, both engines.** The lens is pinned at `FOCAL_PX` 1024 in
`src/groundplane.js`, bound to §10's `camera.focal_mm` by `assertRuledLens` and refused at the
bake. Every meta derives its scale from it. The standpoint law is `standpointFor` in
`tools/validate-plan.mjs`, one home for the validator, the rebuild and the drawing; 42 of the
manor's 88 standpoints moved, `study/N` to the approved 4.35 m and `hall/E` staying at the
approved 6.00 m. The wide-view machinery is deleted and the supersession recorded. §12.5 (i) is
retired with its three ledger mechanisms and replaced by (i′) one lens, (v) the drawn metre module
measured against the meta, and (vi) corner honesty in both directions. The `+` junction guard
measures side-wall share and separates 5.6–21.8 % from 71.1 % where the pinned scale had one band
at 66–84 %. Eight new ledger mechanisms, each with an isolated case, and the completeness scan
extended to the two tools this row's document-side clauses emit from.

**Corrections the second plan critic forced, each of which was a real error:** `study/S` stands at
3.85 m, not 4.35 — the chimney breast is behind you on that facing and you cannot back into it, so
the threshold pulls forward and the law falls back to the drawn standpoint where even that is
inside masonry; the fit test is *the frame*, not an invented margin, and the five-sixths criterion
is gone with the need for it; the `~8 px` desk-pool clip and the `chair1` move were both computed
from a wrong shadow offset and are withdrawn; the residue's claim that lens shift would restore the
feet was arithmetically impossible and is replaced by the bound that makes it so.

**The painted world is held, and why.** The eight approved backdrops were measured
(`design/plan-draft/measured/`, re-runnable, control reproducing the row-4 probe's own read). They
imply **eight different focal lengths, 498 px to 1010 px against the ruled 1024** — the defect this
row removes, arriving from the asset side. `study/N` lands 1.4 % away, so the approved picture and
the pinned lens are one camera; the passage's paintings depict a room 4.01 m and 3.54 m deep where
the plan says 2.60. The Navigator ruled (c): the seven regenerate through the asset seat with the
camera enforced, `gate.py` is their acceptance gate at ±3 % of 1010 px, and the law is not widened
to admit the corpus. The three sub-rulings that came with it — the ceiling-ramp horizon, the
approved camera as the project's, the measured door rectangle as the click target with width ruling
and aspect warn-only — are applied and in the documents.

**The one fork an agent may not decide, and it is the batch's first question.** Adopting the
approved camera put the eye at 1.08775 m — 3 ft 7 in — where intention quality 5 names *"6 ft"* in
Kabe's own words. Both cannot be true. The batch puts it to him as two worlds rather than two
numbers: KEEP THE PICTURE, in which the intention's parenthetical amends to the measured camera and
the 6-ft ruling is recorded as superseded by his own approved image under §5's authority chain; or
ENFORCE SIX FEET, in which every backdrop regenerates with the eye fought upward against a generator
that has drawn about four feet on all eight asks, for an unknown number of re-rolls. The Navigator
recommends the first, because the quality's substance is consistency of eye height and rooms that
read right and measurement delivers both, while the number was a means to *"better visual
presentation"*. **`design/intention.md` is untouched pending his word** — the amendment is his to
authorise, not a consequence an agent may apply.

**Two residue items sharpened after the build, both in the batch.** The turning translation
(§9 item 6) measured out at 2.38 m per 90° press against 1.81 m before, and it is now recorded
BESIDE the standpoint law in `architecture.md` as that law's known cost, with the mitigation path
named: multi-standpoint rooms make body positions explicit instead of derived, and node travel
absorbs what free-look cannot. The black seen through an open door — 4.4 % of the frame, magnified
6.8× because the lens magnified the doorway — is not this row's to fix and is queued as a row
candidate the Navigator allocates on this row's close: *through an opening, the destination room's
content shows*. It ships as honest interim, named in the batch README in those words.

**Round 4 of the artifact critic returned NOT PASS on seven blocking findings, and the family was
one family.** Every one of them was a statement that had stopped being true and nothing was reading:
the batch's eleven captures were rendered before the facing glyph was resized and were pictures of
code that no longer ran; its two schematics still printed a drift notice the live sheets had
dropped; the approval stamp ran off the sheet's own right edge and ended mid-word, in the live
sheets too; `projection.md` printed `undefined` in the camera column of all 88 rows because this row
deleted the field while `plan.spec` separately asserted its absence; and ten more statements about
the camera — in the shipped renderer's own trailing comments, in the test-side literals file, in
`architecture.md` and in this spec — still described the pre-adoption camera. Plus `meta.one_lens`,
the row's headline mechanism, had a second arm that a critic widened to 0.99 with the whole suite
green, because the measured arm's tolerance was a literal agreeing with no document and no case
reached it.

**The lesson the row is closing on, and it is not "check the documents".** Every one of those
survived because the thing that could have caught it was comparing an artifact TO ITSELF. The
report byte-equalled a fresh run of its own generator. The batch had no relationship to the code at
all. The stamp was one unwrapped `<text>` and SVG does not measure. The ledger's completeness was
derived, but only over the arm its case happened to reach. So the fixes are all the same shape —
give each claim a second, independent reader: `CAPTURE-SRC` plus a committed `capture.mjs` so the
batch is regenerable and goes red when `src/` or `index.html` outruns it; a byte-equality between
the batch's schematics and the live sheets; a pixel measurement of the stamp band that fails when
ink reaches the margin, with `fit_size_px` refusing rather than overflowing and the glyph-advance
table regenerated from the font it claims; content assertions on the report that its own generator
cannot satisfy by being self-consistent; a second token and a second case for the measured lens arm,
with its band sourced from `gate.py`'s own two literals in the other language; and the scanned file
set derived from the directory instead of typed.

**What the row still owes, in order:** the seven regenerated backdrops through the gate; their
promotion to `backdrops/<loc>/<facing>.png` with measured metas; the navigation boot fixture and
the doorway-as-a-building-fact that an empty painted room needs to be walkable; the batch of the
eight painted facings; and Kabe's word, which closes and pushes.
