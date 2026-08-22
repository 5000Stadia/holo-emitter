# Row 20 — the lens

Plan for spec-list row 20. The row's target and its done live in `design/intention.md`; nothing is
copied here.

---

## 0. The one sentence

Everything a facing draws today comes out of a `px_per_m_at_wall` pinned at **96**. This row
deletes that pin and derives the same field from a pinned **focal length** —
`px_per_m_at_wall = FOCAL_PX / camera_wall_m`, `FOCAL_PX = 1024` — and moves the standpoints that
the new lens makes untenable. Nothing else about the projection changes: `horizon_y` stays 0.48
(it *is* the lens shift and stays one), the eye height stays the ruled interim 1.60 m,
`px_per_m_at_bottom` stays 332.8.

## 1. What becomes true that is not true today

**(a) The model becomes exactly a pinhole, and §5's recorded incoherence dies.** Blueprint §5's
[AI, row 2] note records a "known incoherence, with numbers": a pinhole through the wall endpoint
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
both endpoints satisfy it once `px_per_m_at_wall = f/camera_wall_m` and
`px_per_m_at_bottom = (image_h − horizon_px)/eye`. `scaleAtDepth(d) = px_per_m_at_wall · cam/(cam−d)`
reduces to `f/(cam−d)` = `f`/distance. The two cameras become one; the note in §5 is rewritten to
say so rather than left describing a defect that no longer exists.

**(b) Every facing gets the same lens and a different scale.** Today the implied focal length runs
187 px → 2014 px across the manor (a factor of 11, a 4 mm fisheye to a 47 mm normal); the shipped
study is an **8 mm / 131.5°** view. After this row every facing is 1024 px / 73.7° / 24 mm. That
is what kills Kabe's `+`-junction symptom, and it is the row's whole point.

**(c) Walls wider than the frame run past it.** Under a pinned scale a wide wall had to be
*clipped* (which is what `WIDE_VIEW_POLICIES` exists to avoid); under a pinned lens it simply
extends past the frame, as in life. So §12.5's clause (i) — *the wall in view fits the frame* — is
false by design and has to be replaced rather than kept.

**(d) The nearest visible floor is one number everywhere: 3.077 m.**
`nearest_floor = FOCAL_PX / px_per_m_at_bottom = 1024/332.8`, independent of the standpoint. This
is the row's **named residue**, recorded and not fixed (see §9).

**(e) Two facings show no floor at all, honestly.** The wall's foot is in frame only when
`camera_wall_m ≥ 1.60/(1 − horizon_y) = 3.077 m`. The cross passage is **2.60 m deep**, so
`hall/N` and `hall/S` put their wall-floor line *below* the frame at any standpoint inside the
room. This is correct — standing 2.15 m from a wall on a 24 mm lens at 1.60 m eye height you see
that wall from 0.48 m to 2.63 m and no floor — and it forces §6 below.

## 2. The numbers this row must land on

Targets, from `design/batches/perspective-preview/README.md` (frames Kabe approved):

| frame | camera_wall_m | px/m at wall | corners | floor % of frame |
|---|---|---|---|---|
| `01d` study/N at the threshold | **4.35** | **235.4** | **127 / 1409** | **15.2 %** |
| `02b` hall/E | **6.00** | **170.7** | 546 / 990 — both in | 25.3 % |

Derived here and checked against those: `floor_line_y = horizon_y + eye/camera_wall_m`, so
study/N = 0.4800 + 1.60/4.35 = **0.84781** (868.2 px; the README's measured floor line is y 868),
ceiling at 868.2 − 2.8×235.4 = **209.1** (README: y 209), floor share (1024−868.2)/1024 = **15.22 %**.
hall/E = 0.48 + 1.60/6.00 = **0.74667** (764.6 px), ceiling 764.6 − 2.8×170.667 = **286.7**
(README: y 287), floor share **25.33 %**. Both reproduce the approved frames exactly, which is the
evidence that the build's arithmetic *is* the preview's arithmetic and not a second one that
nearly agrees.

Full eight-facing table the build lands on (f = 1024, eye 1.60, horizon 0.48, storey 2.8):

| facing | type | camera_wall_m | source | px/m | wall px | corners | floor_line_y px | ceiling y | side-wall share |
|---|---|---|---|---|---|---|---|---|---|
| study/N | enclosed | 4.35 | threshold | 235.402 | 1282.9 | 126.6 / 1409.4 | 868.2 | 209.1 | 16.5 % |
| study/E | enclosed | 4.09 | rule | 250.367 | 1201.8 | 167.1 / 1368.9 | 892.1 | 191.1 | 21.8 % |
| study/S | enclosed | 4.35 | threshold | 235.402 | 1282.9 | 126.6 / 1409.4 | 868.2 | 209.1 | 16.5 % |
| study/W | enclosed | 4.09 | rule | 250.367 | 1201.8 | 167.1 / 1368.9 | 892.1 | 191.1 | 21.8 % |
| hall/N | enclosed | 2.15 | threshold | 476.279 | 3810.2 | −1137 / 2673 — out | 1253.6 (below frame) | −80 (above frame) | 0 % |
| hall/E | corridor | 6.00 | rule | 170.667 | 443.7 | 546.1 / 989.9 | 764.6 | 286.7 | 71.1 % |
| hall/S | enclosed | 2.15 | threshold | 476.279 | 3810.2 | out | 1253.6 | −80 | 0 % |
| hall/W | corridor | 6.00 | rule | 170.667 | 443.7 | 546.1 / 989.9 | 764.6 | 286.7 | 71.1 % |

Every one of these is recomputed by the build and asserted; the table is what the plan commits to,
not a substitute for the assertion.

## 3. The standpoint rule, stated as a rule

The blueprint's ruling is *"Standpoints move to the thresholds (shape item 9's own convention)"*.
Shape item 9's convention is **you view a wall from across the room**. Two facts constrain how
literally that can be applied:

1. Kabe's approved `02b` is the cross passage's east view **at 6.00 m**, which is its existing
   `standpoint_stand_back` 0.25 rule distance, not its threshold (7.55 m). So a rule that moved
   *every* facing to its threshold would contradict a frame he approved.
2. Standing further back than needed buys nothing and costs the read: at 2.08 m the passage's
   2.60 m end wall would fill 83 % of the frame and the corridor would stop reading as a corridor,
   which is the same defect the row exists to kill, in the other direction.

So the rule as built, **[AI], under the [HUMAN] ruling and bounded by the two approved frames**:

> A facing that views a wall stands at the **threshold** — 0.45 m in from the wall opposite the one
> it views — **when, and only when, its own wall cannot be seen corner to corner from the drawn
> rule standpoint.** Otherwise the drawn rule standpoint stands. A facing that views no wall (an
> `open` facing, whose far line is a horizon and not a plane you can stand across from) keeps the
> rule.

Mechanically, with `K = standpoint_stand_back` (0.25), `C = standpoint_threshold_clearance_m`
(0.45, new to the plan document — a person cannot stand with their eye in the wall plane), and a
corner margin `M` of 1/24 of the frame (64 px, so a corner that lands *on* the frame edge with no
side wall beside it does not count as "in frame" — the approved `01d` is described as *"both
corners in view … with a band of side wall standing beside each one, so the room reads as a room
rather than as a wall that happens to end"*):

```
rule_d       = (1 − K) × room_depth
fits(d)      = wall_width_m × FOCAL_PX ≤ (canvasW − 2M) × d
threshold_d  = room_depth − C
camera_wall_m = fits(rule_d) ? rule_d : max(rule_d, threshold_d)
standpoint_source = "rule" | "threshold"   (which branch produced it)
```

Applied to the two M0 rooms this yields exactly §2's table, and it is *why* study/N moves and
hall/E does not: the study's 5.45 m wall needs 74.2° and 24 mm supplies 73.7°, so it misses from
3.60 m by seven pixels; the passage's 2.60 m end wall is comfortably inside the frame from 6.00 m.
It applies to all 22 spaces, so the sheets redraw for the whole manor.

**This is a drawn change.** `standpoints`, their distances and `standpoint_source` are in
`draw_plan.py`'s `DRAWN_KEYS`, so the drawn digest moves, the sheets re-render, and
`approval.lock` is re-anchored with a comment citing Kabe's 2026-08-21 approval of preview frames
`01d`/`02b` and *"full steam ahead"*. The lock must keep tripping on any OTHER drawn change —
proved by a test that moves a wall and watches the stamp print UNAPPROVED REVISION.

## 4. The lens constant, and where it lives

- **Authored home:** `replicator/contract.json` `camera.focal_mm` — **50 → 24**, blueprint §10's
  [HUMAN] home for the generation camera, which the ruling moves. `prompt_block` and
  `backdrop_block` say "50mm" in prose and are corrected in the same change, because a backdrop
  generated at 50 mm and projected at 24 mm is the defect this row exists to remove. Nothing else
  in `replicator/` is touched; `contract.identity()` hashes only `gates`/`ingest`/`classes`, so no
  emitted record's `thresholds_sha256` moves.
- **Code home:** `src/groundplane.js` — `FOCAL_PX = 1024`, `FRAME_W_MM = 36`, `FOCAL_MM = 24`
  (the frame is exactly the 36×24 mm format, so `FOCAL_PX = FOCAL_MM × 1536/36` is exact), plus
  `pxPerMAtWall(d) = FOCAL_PX/d` and `focalPx(meta) = px_per_m_at_wall × cameraDistance(meta)`.
  It is the module both the browser and Node already import for the ground plane, so the lens has
  one home rather than one per consumer.
- **The binding that can fail:** `assertRuledLens()` in `tools/plan-projection.mjs`, the twin of
  the existing `assertRuledEye()` — it reads `replicator/contract.json` and refuses when
  `camera.focal_mm` is not `FOCAL_MM`. Called from the bake and cased in the ledger. Without it
  the pin is a number two files happen to share.

## 5. What is deleted

`WIDE_VIEW_POLICIES`, `DEFAULT_WIDE_VIEW_POLICY`, `needsWideView`, `pinnedWallInFrame`, the
`camera: "pinned"|"wide"` and `wide_view_policy` meta fields, and the bake's refusal-on-wide.
Reason (research §8.5): both readings of Kabe's wide-view licence exist only to stop wide walls
being clipped by a pinned scale; a pinned lens does not clip, so the fork has no subject. The
`projection.md` §5 section that tabulated the ten-facing disagreement goes with it, replaced by
one paragraph recording that the question dissolved and why. Kabe's ruling (3) itself is not
overruled — it granted a wider camera where the pinned frame could not hold the wall, and the
pinned lens grants that everywhere by construction.

## 6. The hall's furniture has to move, and this is the only forced product change

`shelf1` and `stick1` are staged on `hall/N`. Under the ruled lens that facing shows **no floor**
(§1e): the shelf's baseline lands at y 1377 and the candlestick's at y 1484 on a 1024-px frame.
The shelf survives as a top fragment; **the candlestick is entirely below the frame**, so blueprint
§12.8's named hall overlap pair (`stick1`×`shelf1`) renders zero intersecting pixels and the
intention's third quality has no witness in that room. No standpoint inside a 2.60 m room fixes it,
and `horizon_y` is not available as a lever (it is the lens shift and stays one).

So both move to **`hall/E`**, the passage's 2.60 m east end wall seen from 6.00 m — where the floor
runs from 3.08 m to 6.00 m and both objects stand comfortably inside it. Under blueprint §4's
standing licence, with the reason recorded on the plan objects and in `architecture.md`.

What that costs and buys, stated so it is a decision and not a side effect:

- Blueprint §11's hall wall map moves the shelf from N to E (it is [AI] with the standing licence).
  The map's leaded window at the passage's far end moves to the S wall in the same edit, so a
  1.8 m bookcase is not prompted in front of a window at row 4.
- §12.6's four deliberately-bare facings become **study S/W, hall N/S** (was hall E/S). Also [AI].
- It **closes a known limit** rather than opening one: `architecture.md` records that every passage
  now arrives on a bare facing and *"the only thing that visibly changes is the door leaving the
  frame"*. Arrival into the hall is `hall/E`; after this move the arrival view carries the
  bookcase, the candlestick and the coin.
- `world.json` is untouched (no truth moves — `shelf1.location` is still `hall`), and `coin1`
  follows its host by `anchor_on`.
- `plan.objects[]` gains the two new footprints. That is un-drawn content: the second digest moves,
  the drawn digest does not care, and the sheets draw no furniture.

`chair1`'s `depth_m` also moves (1.20 → a value in the 0.9–1.0 band, fixed by measurement) for the
same class of reason: at 1.20 m it stands 3.15 m from the standpoint, 7 cm inside the nearest
visible floor, and its **contact pool falls off the bottom of the frame** — "every grounded object
darkens the ground under it" would be true of the code and invisible in the picture. Same standing
licence, same recording discipline, and the chair×desk overlap is re-measured rather than assumed.

## 7. The verification work

### 7.1 §12.5's frame clauses, honestly recomputed

Clause **(i)** (*the wall in view fits the frame*, plus its null-corner half) is **retired** and
replaced, because a pinned lens makes it false by design. What replaces it keeps the property that
made it worth having — a term from **outside** the meta, so the clause is not a self-consistency
check:

- **(i′) one lens.** `px_per_m_at_wall × cameraDistance(meta) = FOCAL_PX`, on every meta the
  fixture can resolve. `FOCAL_PX` comes from `groundplane.js` and is pinned to
  `replicator/contract.json` by `assertRuledLens`, so both terms are outside the meta.
- **(v) corner honesty.** A corner vertical is drawn **iff** its computed x lies inside
  `[0, canvasW]` — measured off the render on all eight facings, which is the done clause
  *"corners appear exactly when honestly in frame"* made into pixels.

(ii) (measured backdrops: corners vs arithmetic within the calibration tolerance) and (iv)
(`image_h_px` is the canvas) stand unchanged; (iii) is restated for the derived metas.

### 7.2 The `+` junction guard — the row's signature test

The symptom is *"every direction is a corridor … like a + shape"*. The measurable form: the share
of the frame taken by **side-wall return** rather than by the wall you are facing. Computed from
the meta and, separately, read off the render by the corner-column measurement `mechanisms.spec`
already performs:

- every facing **not** typed `corridor` shows **< 1/3** of the frame as return (built values:
  0 %, 16.5 %, 21.8 %);
- every facing typed `corridor` shows **> 1/2** (built value: 71.1 %).

Today's values are 66 % for `study/N` and 84 % for `hall/E` — one band, no separation, which is
precisely why every direction reads the same. Row 11's existing two-term corridor assertion
(return share plus metres of side wall in view) is kept and its literals recomputed; this clause is
the new half that fails when a *non*-corridor starts reading as one.

### 7.3 Ledger cases (the emit-site discipline, `architecture.md`'s standing sentence)

Every new or changed mechanism arrives with a case in `tests/playwright/guards.spec.mjs` that
fails on **that clause alone**, names it by a stable `[row20:<name>]` token, is registered in the
declared `MECHANISMS` list, and asserts the tripped set **equals** `[name]`:

| token | mechanism | how the case breaks it |
|---|---|---|
| `row20:one_lens` | a resolved meta whose `px_per_m_at_wall × camera distance ≠ FOCAL_PX` is a finding | doctor one meta field in a staged tree |
| `row20:ruled_lens` | `assertRuledLens` — contract `focal_mm` must be 24, and the bake refuses | doctor a staged `replicator/contract.json` |
| `row20:threshold_standpoint` | a facing whose wall does not fit from the rule standpoint must claim `threshold`, and one that claims it must stand there | doctor a plan facing's standpoint / source |
| `row20:contact_pool_in_frame` | a floor placement whose contact-pool centre falls outside the canvas is a finding | doctor a staged placement's `depth_m` |
| `row20:corner_honesty` | corners are drawn exactly when in frame | disable the renderer's corner clip in a staged tree, measure the picture |
| `row20:corridor_read` | the return-share separation above | doctor a facing's type / width in a staged tree, measure the picture |
| `row20:glyph_cap` | the facing glyph's frame-fraction cap (§8) | delete the cap in a staged tree, measure the glyph's drawn height |

Renderer mechanisms are broken in a staged tree and measured in the picture; document-side
mechanisms doctor an input. The final artifact-critic round is instructed explicitly to try to
defeat these additions and to say in writing whether it failed.

### 7.4 Everything else that has to be recomputed rather than re-blessed

`heights.spec` (per-facing literals typed independently, never imported), `geometry.spec` (drawn
floor line and drawn horizon per facing — and on `hall/N`/`hall/S` the assertion becomes *the floor
line is honestly below the frame*, predicted and confirmed, rather than skipped), `mechanisms.spec`
(corner literals on all eight facings, corridor ordering, overlap pairs, contact strength and
spread per object, tint, draw order, clickability), `plan.spec` (derived meta arithmetic, the
approved-`standpoints.tsv` cross-check, the derived render's byte identity at the **new**
`APPROVAL_COMMIT`), `validator.spec`, `walkthrough.spec` (the hall's coin is now on the arrival
facing, so the scripted turn sequence changes), `determinism`, `knowledge`, `isolation`,
`turning`, `keyboard`, `voice`, `fixtures`, `shell`, `fullscreen`. Both engines, whole suite.

## 8. Two small renderer consequences

- **The facing glyph is capped.** It is *"1.5 m tall at wall scale"*; wall scale now runs 170 →
  476 px/m, so on `hall/N` a 1.5 m mark is **714 px — 70 % of the frame height**, and a room with a
  metre-high letter filling it is a diagram. The glyph becomes
  `min(1.5 m at wall scale, 0.14 × frame height)` — 143 px, the size it draws at today — with the
  reason recorded and a ledger case. `geometry.spec`'s ">1200 changed pixels on a bare-facing turn"
  bar is re-verified against the capped glyph.
- **Floor line below the frame and ceiling above it must not crash or lie.** Traced by hand through
  `drawGrid` for `hall/N`: the wall base fills the frame, the floor rect is degenerate, the floor
  grid clips to nothing, the return loops break on their first step, the corner verticals fall
  outside, and the ceiling line work is already gated on `wallTop > 0`. Confirmed by rendering, not
  by reading — a case asserts the picture is wall + metre lines + eye line + glyph, and that
  nothing paints floor.

## 9. Residue this row records and does not fix

1. **The nearest visible floor is 3.077 m on every facing** — a lens property, `FOCAL_PX /
   px_per_m_at_bottom`, unchanged by any standpoint. The intention's fifth quality (*"Riven's rails
   are cut by the frame bottom at your own feet"*) is not delivered by this row. It returns at row 4
   through lens **shift** (`horizon_y`, which this row deliberately does not move) and near-surface
   anchoring — Kabe's own reference anchors the frame bottom through a desk surface, and blueprint
   §5 records that. Written into `architecture.md` and named in the batch to Kabe.
2. **`hall/N` and `hall/S` show no floor and no corners.** Honest at 24 mm in a 2.60 m room; the
   room reads as "a wall close in front of you", which it is.
3. **The desk's contact pool is clipped by ~8 px at the frame bottom** on `study/N`. `floor_against`
   depth is the record's own `d`, not a staged value, so it is not moveable without moving the
   standpoint; the pool's centre and upper half are in frame and the clause is written at the
   centre for that reason.
4. **Objects draw about 2.5× larger** than today near the wall. Expected (a metre of wall is 2.5×
   the pixels); it makes the V1 legibility cheats less bad, not worse, and row 4's asset scale probe
   is still where apparent size is settled.
5. **`chair1` stands 3.4 m out on a 4.35 m standpoint** — the study is nearly full at 24 mm and
   there is little floor to compose in. Named for row 4.

## 10. Edges — what this must not touch, and what outside it feels the change

**Must not touch:** `backdrops/`, `library-src/`, `replicator/ingest.py` and every pipeline stage
(`contract.json`'s camera block and the two prompt blocks' focal prose only), any other spec row,
any AgentPost mailbox. No push. `world.json` (no truth moves). `horizon_y`, the 1.60 m interim eye
height, `px_per_m_at_bottom`, and §10's `eye_height_m`/`pitch_deg` — all [HUMAN] and all outside
this row's ruling.

**Feels the change, outside the row:**

- **Row 4** inherits: the measured-backdrop metas must be authored at 24 mm; the prompt sheets get
  *"24 mm lens, camera level, eye height 1.83 m"*; §12.5 clause (ii) is still the clause with teeth
  and still does not exist until a backdrop is measured; the feet residue (§9.1) is row 4's to
  close; `view_angle_deg` values in `projection.md` §2 all move with the standpoints.
- **Row 15** inherits the whole manor's new standpoints and the threshold rule.
- **Rows 18 and 19** are unaffected in scope but their ledger/clearance work now has seven more
  tokens and a `standpoint_source` token to cover.
- **`design/plan-draft/`** re-renders wholesale: two SVGs, two PNGs, `standpoints.tsv`,
  `render.lock`, `approval.lock`, `projection.md`.
- **`design/batches/row20-lens/`** — eight fully-composited facing captures at the §12.6 capture
  spec, committed **before** the closing commit.

## 11. Order of work

1. Lens constants in `groundplane.js`; `GRID_META` derived from them in `renderer.js`.
2. `plan-projection.mjs`: camera carries `focal_px`; `deriveMeta` derives the scale;
   `assertRuledLens`; delete the wide-view machinery; the threshold rule in `--rebuild-facings`.
3. `validate-plan.mjs`: `standpoint_source: "threshold"`, the threshold clause, `camera_wall_m`
   rounding unchanged.
4. `plan.json`: `standpoint_threshold_clearance_m`, every facing rebuilt, the two hall objects
   re-sited, `chair1`'s depth.
5. `staging.json` + re-bake; `contract.json`'s camera.
6. Renderer: glyph cap; verify the no-floor facings render honestly.
7. `validate-fixtures.mjs`: clause (i′), (v)'s document half, the contact-pool clause.
8. Re-render the sheets; re-anchor `approval.lock` and `APPROVAL_COMMIT`; regenerate
   `projection.md`.
9. Tests: recompute every literal; add the ledger cases and the `+`-junction guard; both engines.
10. Documents brought true: blueprint §5/§7/§10/§11/§12.5/§12.6/§12.8, `architecture.md`, README if
    it carries a number.
11. Batch the eight facings; commit. Then the close.
