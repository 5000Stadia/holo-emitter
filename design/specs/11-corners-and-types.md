# Row 11 — plan (revision 2)

Row 11 in `design/intention.md`. The target and its done live there; this file says how it gets
built, what it must not touch, and what outside it feels the change.

Revision 2 answers the first plan critique (35 findings, 26 marked blocking) and carries the
Navigator's fork ruling of this run. **§0 is the authority ledger** — the critique's largest single
family was a plan that cited its licences loosely, so every change of scope below names the
sentence that authorizes it, quoted as it stands, before anything else.

---

## 0. Authorities — who said what, quoted

Nothing in this plan is licensed by inference. Where this row moves something a previous row's
documents assign elsewhere, the sentence that moves it is here.

**A1 — the row's own text** [HUMAN, 2026-08-20], `design/intention.md` row 11: *"grid mode draws a
bounded room - corner verticals and side-wall returns placed from camera_wall_m, wall width, and
the ruled camera - and groundplane.js/the validator learn the corner-bounded u-domain plus the
enclosed/open/corridor facing type field (M0 ships enclosed only; the others must be a meta entry
later, not a renderer rewrite)."*

**A2 — the Navigator's handoff for this row** (the seat that holds the intention and answers
forks), verbatim: *"grid mode renders a bounded room — corner verticals and side-wall returns
placed from the plan's camera_wall_m + wall width + the ruled camera (eye 1.83m)"*; *"The shipped
study/hall grid rooms re-derive their geometry from plan.json's projection — this WILL move shipped
pixels (the endless 16m wall becomes the study's real 5.45m walls with corners; the door re-sites
~1.1m south per the approved drawing, projection.md §1) — that change is licensed by the human's
schematic approval; make the grid geometry agree with the drawing he approved."*; *"Resolve the
horizon-gate near-miss (projection.md §7) honestly in the re-derived meta rather than widening the
tolerance."*; *"Update every hash/geometry test that encoded the old endless-wall grid."*
This is the authority for three things the earlier revision mis-sourced: **the eye height in the
ruled camera**, **the staging adoption**, and **`door1`'s re-siting** — which is `projection.md`
§0's question 2 and is answered here by the Navigator, not closed as a side effect.

**A3 — the schematic approval** [HUMAN, 2026-08-21], blueprint §4b: *"Redline returned,
2026-08-21 [HUMAN] — THE SCHEMATIC IS APPROVED ('aproval on the schematic')."* This is what makes
the plan's metres the geometry the grid must agree with.

**A4 — the six-foot ruling** [HUMAN, 2026-08-20], blueprint §5: *"we should be a bit higher as a
view angle looking down at about a 6ft height. For better visual presentation."* — encoded at §10
as `eye_height_m: 1.83`, `pitch_deg: -8`. §5's camera-has-feet assertion was propagated to 1.83 at
row 3 and grid canonical was never moved to match; `architecture.md` records the residual as live
and names row 4 as owner of the *measured* camera. A2 rules that this row resolves it in the
re-derived meta. **What this row adopts is the eye height and nothing else** — see §1.

**A5 — the fork ruling of this run** (Navigator, in writing, cited as the fork's authority): the
approval lock's input is narrowed to the drawn content, and `stick1`'s plan depth moves 0.75 → 0.50
under blueprint §4's standing licence. Quoted where it is executed, §6.

**A6 — the human visual gate, ruled** (Navigator, same message): *"The playbook screenshot-gate
exemption is MINE, explicitly: batch-as-delivery stands for this row under the human's
checkpoints-inform law; his verdict on your corner batch routes as rows. You are not re-deriving
that exemption — I own it here in writing."* `design/playbook.md` §3.4 and `design/intention.md`'s
spec-list preamble both put a screenshot gate on a row that changes what the player sees; row 13
paid for an agent deriving an exemption by analogy. This row does not derive one — it cites A6.

**A7 — the standing value licence** [HUMAN], blueprint's own rule: *"Exact values are welcome,
always with this license written next to them: change it if it makes the product better, and say
why."* §4 repeats it for staging's `u`/`depth_m`. Row 12 moved the home of those values into
`plan.json` without moving the licence.

**A8 — what the approval does and does not cover**, `design/architecture.md`: *"Kabe approved the
drawing. `plan.json` carries content no image has shown him: the four object footprints (the
drawing draws no furniture) …"*

Everything below cites these by tag.

---

## 1. The camera: what moves, what does not, and what stays open

**The scale does not move.** `px_per_m_at_wall` stays 96 and `horizon_y` stays 0.48 — blueprint §7's
grid-canonical values, unchanged since row 2. The field-of-view question §5 carries for Kabe is
therefore untouched by this row, and the arithmetic is worth stating because corners are what make
it *visible* for the first time: 5.45 m of study wall at 96 px/m is 523 px of a 1536 px frame, so
after this row roughly two-thirds of a study frame is side wall, an implied ~131° view against
§10's `focal_mm: 50` (≈40°).

**The row's done clause is what forces that, and it cannot be avoided inside this row.** At §10's
50 mm the focal length on a 1536 px frame is 768/tan(19.8°) ≈ 2133 px, so `px_per_m_at_wall` at the
study's 3.60 m would be 593 and the 5.45 m wall would draw 3230 px — **wider than the frame, with
neither corner in it**. "Two visible corners" and a 50 mm lens are not simultaneously satisfiable
at these room sizes. So the grid keeps the pinned scale it has always drawn with, the wide view is
the arithmetic consequence, and §5's open question is carried to Kabe unchanged — with this number
beside it, and with a rendered frame in the batch so the question is asked against a picture rather
than against a paragraph.

**The eye height moves, and only the eye height.** Per A2 and A4, every derived meta is computed at
eye 1.83 m. `deriveMeta` already computes `floor_line_y = horizon_y + eye·px_per_m_at_wall/image_h_px`
and `px_per_m_at_bottom = (image_h_px − horizon_y·image_h_px)/eye`, so:

- `floor_line_y` 0.63 → **0.6515625**
- `px_per_m_at_bottom` 332.8 → **290.9726775956284**

**The pitch is not adopted, and that is a loss this row reports rather than absorbs.** A4's sentence
is *"a bit higher … looking down"* and §10 encodes both halves. `groundplane.js` has no pitch term;
adding one is a whole-project pixel move with no measured camera to aim at, and §5 rules the real
camera is measured off row 4's approved backdrop. So this row takes the half §5's own
camera-has-feet device can express and leaves the half it cannot, **with the magnitude printed**:
at the study's implied focal length of 346 px an −8° pitch moves the horizon down 49 px, 0.047 of
frame height (`projection.md` §7 computes it; nothing here re-derives it). The consequence is
directional and against a named quality — pitch would pull the floor cut *in*, and taking the
height alone pushes it *out* — so the row's report says so in those words and the residue stays
row 4's.

**Every shipped facing's floor cut, before and after.** The first revision reported one facing and
called two others an improvement; six of eight get worse. `d = camera_wall_m × px_per_m_at_wall /
px_per_m_at_bottom` — the distance in front of the viewer at which the floor first appears:

| facing | camera_wall_m | today (cam 3.5, pb 332.8) | after (pb 290.97) | Δ |
|---|---|---|---|---|
| study/N, study/S | 3.60 | 1.01 | **1.19** | +0.18 |
| study/E, study/W | 4.09 | 1.01 | **1.35** | +0.34 |
| hall/N, hall/S | 1.95 | 1.01 | **0.64** | −0.37 |
| hall/E, hall/W | 6.00 | 1.01 | **1.98** | +0.97 |

`hall/E` is one of the two arrival facings under row 13's orientation law and `hall/W` carries
`door1`; both start their floor almost two metres out. That is the drawn standpoint rule meeting the
pinned scale — `projection.md` §6 already names it across the manor and calls the fix "not an
agent's" (a cap on the standpoint rule would change the approved drawing; pinning the lens is §5's
open question). This row makes it visible on two shipped facings, names it, puts the frames in the
batch, and changes neither the drawing nor the scale.

**The horizon gate, and why "green" here witnesses less than it looks like.** Blueprint §5's
assertion is `|horizon_y − (floor_line_y − eye·px_per_m_at_wall/image_h_px)| ≤ 0.02`. On a meta
`deriveMeta` produced, this is the derivation's own equation read backwards: the residual is 0 by
construction and the clause **cannot fail for any camera**. Saying "§12.5 green" over that would be
the identity-not-evidence failure `architecture.md` already names once. So:

- the clause is kept, and the blueprint records **in the same breath** that on a *synthesized* meta
  it holds by construction and has content only on a *measured* one (row 4's) — the same honesty
  §12.5's clause (iii) already carries for the corner equality;
- and the row adds the check that **can** fail, with a term from outside the derivation: the eye
  height the derivation runs at is asserted equal to `replicator/contract.json`'s
  `camera.eye_height_m` — a different document, authored from A4, which no part of the projection
  writes. Drift either way goes red.
- `assertCameraConsistent` (already called by the bake) keeps its job on `GRID_META`: edit one of
  its four numbers alone and the horizon device stops agreeing with the scale lerp.

---

## 2. The typed-geometry model — bands, and one drawing

§5 types a facing `enclosed` (facing wall, two corners), `open` (no facing wall — ground to a far
line) or `corridor` (side planes converging, open centre). The way to keep the row's promise that
open and corridor are "a meta entry later, not a renderer rewrite" is to stop treating them as three
drawings:

> **The wall in view is a list of bands.** Corner verticals stand at every band edge. Where the view
> has no band, no wall is drawn. Side-wall returns are drawn where — and only where — one continuous
> band spans the whole view, because that is what having two corners *means*.

| case | bands | corners | returns |
|---|---|---|---|
| `enclosed` / `corridor`, `wall_continuous: true` | one, spanning the view | two | two |
| `enclosed` / `corridor`, `wall_continuous: false` | `wall_segments` | one pair per band | none |
| `open` | none | none | none |
| unplanned facing (`facing_type: null`) | one, unbounded | none | none |

**Corridor is not nominal after this row, and it is not enclosed wearing a label.** §5 defines it as
*"side planes converging, open centre"*; `architecture.md` records that row 12 left it "nominal" —
the derived meta emits no side-plane fields and a corridor got the same `camera_wall_m` /
`wall_width_m` pair an enclosed facing does. What discharges it is not a new field but the returns:
the *proportion of the frame the converging side planes occupy* is already fully determined by the
plan's own two numbers, and it separates the types cleanly.

| facing | type | wall in view | camera | frame occupied by the returns |
|---|---|---|---|---|
| study/N | enclosed | 5.45 m | 3.60 m | 66 % |
| hall/N | enclosed | 8.00 m | 1.95 m | 50 % |
| hall/E, hall/W | **corridor** | 2.60 m | 6.00 m | **84 %** |

So `hall/E` is a view down a passage whose end wall is a sixth of the frame and whose side planes
are the rest — §5's alley, from the drawing's arithmetic, through one code path. **The row asserts
this rather than claiming it**: a test computes the return share per facing from independent
literals and requires the corridor facings' share to exceed every enclosed facing's. If that
ordering ever fails, the type has stopped meaning anything and the check says so.

**Corridor ships in M0, against the row's own parenthetical.** Re-deriving the shipped rooms from
the approved drawing (A3) makes `hall/E` and `hall/W` corridor facings — the cross passage's two
ends — and `door1` stands on one of them. Ruled by the Navigator this run: the promise is
*discharged, not broken*, and what actually ships is written into the blueprint's parenthetical as
an **[AI]-tagged amendment beside the [HUMAN] sentence, never inside it** (`design/playbook.md`
§5.1's scar). The spec-list row is the Navigator's text and is not edited by this seat; it leaves
the list at the close in any case.

**`open` gets no invented look.** `architecture.md` is explicit that what an open facing's
`px_per_m_at_wall`, `floor_line_y` and u-domain *mean* against a vista is "not settled by this row —
it is row 4's", and ruling (1)'s scenic vista is a generated backdrop. So this row draws, for an
open facing, exactly what its type asserts and nothing more: **the ground, and no wall** — no
corner verticals, no wall grid, no invented sky band, no gradient standing in for a vista. The
region above the far line is the grid's unestablished void, which is what it already is wherever no
wall is drawn. No M0 facing is open; the case exists so the renderer does not hard-wire a wall, and
its test asserts absence (no facing wall, no corners) rather than blessing an appearance.

---

## 3. The drawing, precisely

All of it in `src/renderer.js`, grid mode only. A real backdrop image still occludes the grid and
this row does not touch that path.

Let `pxW = px_per_m_at_wall`, `floorY = floor_line_y·image_h_px`, `sBottom = px_per_m_at_bottom`,
and `X(u, s) = groundplane.xAtScale(u, s, meta, canvasW)`.

**Regions**, for a facing with one continuous band and corners `cL`, `cR`:

- *facing wall* — `x ∈ [cL, cR]`, `y ∈ [0, floorY]`.
- *side-wall/floor junctions* — the straight lines `(cL, floorY) → (X(0, sBottom), H)` and
  `(cR, floorY) → (X(1, sBottom), H)`. These are the two extreme floor longitudinals the grid
  already draws; they now carry major weight, being the wall-floor line of the returns. On a wide
  room the junction leaves the frame through the *side* (study/N: x = 0 at y ≈ 1007); on a narrow
  one through the *bottom* (hall/E: x = 390 at y = 1024). Both are the same clipped polygon.
- *returns* — everything outside the polyline {vertical at `cL` above `floorY`} ∪ {left junction
  below it}, and its mirror.
- *floor* — between the junctions, below `floorY`.

**One lighting model, stated once.** The first revision had two devices fighting: the existing
stepped `key_tint` falloff makes the frame's upper-left brightest, and new return tones would make
the left darkest. The model is **ambient falloff × a per-plane facing factor**, in that order:

- each plane takes a base tone — facing wall `WALL_BASE`, floor `FLOOR_BASE` (both unchanged, so
  §12.8's contact-pool luminance bar is untouched), the **viewer-left return darker and the
  viewer-right return lighter**, because with a key at upper-left the left return's face turns away
  from it and the right return's turns toward it. This is the same statement the sprite painters
  make with their ±8 % across-width ramp, applied to the room's own geometry;
- then the existing falloff paints over the whole frame, unchanged, as it does today.

Checked as one model, not two: *within* each plane (facing wall, each return, floor) the falloff
still reads left-brighter and top-brighter; *across* planes the right return reads brighter than the
left. `mechanisms.spec`'s existing "the ground carries the same key the sprites do" case samples
x 40–340 against x 1196–1496 — which after this row are the two returns, not the wall — so it is
re-pointed inside the facing wall and gains the cross-plane clause.

**Lines.**
- Facing-wall metre verticals and horizontals: clipped to the facing wall, stopping at the corners.
- **Corner verticals**: at `cL` and `cR`, `y = 0` to `floorY`, at `ALPHA_MAJOR`, weight 2.
- Return verticals: at each 0.5 m of depth, `x = X(0 | 1, scaleAtDepth(d))`, from `yAtDepth(d)` up.
- Return horizontals: straight lines through `(X(·, s), yAtScale(s) − h·s)` per metre `h`, fanning
  from the corner exactly as the floor longitudinals do.
- Floor longitudinals: only the metre lines inside the room. Floor transverse lines: clipped to the
  floor region. The **eye line stays full width** — a level camera's horizon is one line across
  every surface — and the floor line becomes the room's own continuous wall-floor line (the band's
  foot plus the two junctions).

**The returns are featureless, and what that omits is named and pinned.** They are traceable to
bands the plan holds (the room's own side walls), but the grid draws no opening in them: `apertures`
derives openings from `locations[].exits` **on the facing being drawn**, and multi-facing presence
is §4b item 9's, assigned to row 15. The omission is computable, so it is computed rather than
asserted away — the visible extent of a return runs from the corner to whichever comes first, the
frame edge or the nearest floor depth, and any exit opening inside that extent is a doorway the
picture does not show:

| facing | return | exit opening in view | drawn |
|---|---|---|---|
| study/S | left (the east wall) | `door1`, the full 1.00 m | blank wall |
| hall/N | left (the west wall) | `door1`, 0.18 m sliver at the frame edge | blank wall |
| hall/S | right (the west wall) | `door1`, 0.18 m sliver at the frame edge | blank wall |
| all others | — | none | — |

**Nothing interactive is denied** — the harness requires the exit's own facing, so no `go` target is
lost and no click changes meaning — and this is strictly *less* divergence than today, where the
picture runs the north wall across the whole frame and the side walls do not exist at all. But it
is a wall feature the document holds and the picture does not, so: a committed test enumerates the
list above and pins it, so a new omission cannot appear silently; the blueprint records it with
row 15 as owner; and it goes to Kabe in the batch as a named question, his verdict routing as rows
per A6.

**The facing glyph** stays in-fiction signage and now has a rule for every case: it is placed on
the largest band in view, at the eye line, and must lie inside that band and clear every opening —
candidates in order **left of the opening → right of it → above it**; where there is no band
(`open`) it is centred on the view at the eye line. `hall/W` is why the third candidate exists: a
1.0 m door in the middle of a 2.60 m wall leaves no room beside it, and both dodges land outside a
corner. `geometry.spec`'s existing bare-facing clause (a turn must move > 1200 px) is re-run on
every shipped facing and extended to a synthesized `open` meta, so no facing type loses its only
response to an arrow key.

**Unplanned facings (`facing_type: null`) keep today's drawing** — one unbounded band, no corners,
no returns — because a room whose extent is unknown must not claim two corners. Their *pixels* move
with the eye height like everything else; the earlier revision said "keeps today's drawing" without
that qualification and contradicted its own §1.

---

## 4. `groundplane.js`

1. **`u` spans corner to corner where corners exist.** `xAtScale` becomes
   `wallCentrePx(meta, canvasW) + (u − 0.5)·wallSpanPxAtWall(meta)·(s / px_per_m_at_wall)`, with
   centre and span read from the corners when present, from `wall_x0_px` when §5's uncentred-wall
   extension point is used, and from `canvasW/2` + `wall_width_m·px_per_m_at_wall` otherwise. On
   every meta this project can produce today the value is identical — the corners *are*
   `xAtScale(0|1)` at wall scale by construction — so this moves no pixel by itself; what it buys is
   that the u-domain and the corner verticals are one arithmetic. Row 2 paid for the other shape
   twice and row 12's critic caught it a third time.
2. **`uDomain(meta, s, canvasW) → { x0, x1 }`** — the room's own wall at that scale, exported. The
   renderer clips with it and the validator checks placements against it. **Where corners are null
   it returns the `wall_width_m` span with no clamp**, and that is the stated rule rather than a
   fallthrough: an unplanned or segmented facing has no corner to clamp to, and `wall_segments` is
   what says where the building is.
   Note the row text's "clamps corner-to-corner" is read as *the domain is corner-to-corner* — the
   mapping's endpoints are the corners, and the validator refuses staging that leaves the room. It
   is **not** a render-time clamp that silently slides an out-of-room object back inside: a picture
   that quietly moves what the document placed is the same lie as a picture that ignores it.
3. **The depth anchor is typed, with no silent tail.** `scaleAtDepth` reads
   `meta.camera_wall_m ?? meta.camera_far_m`; a meta carrying neither is an error, not a default
   3.5 m. `architecture.md` names that fallback as the trap the field naming exists to prevent, and
   the first revision reinstated it. `CAMERA_WALL_M` survives as the named home of `GRID_META`'s own
   value and stops being an implicit default for everyone else.

`placeHost` is unchanged in shape; its outputs move only because the meta it is handed moved.

---

## 5. The meta schema, and what the validator refuses

`tools/validate-fixtures.mjs` gains a meta arm. Every clause is written so that breaking it goes red
on that clause alone (`architecture.md`'s clause-ledger rule, brought over from the replicator).

**A resolved meta must be a complete §5 record.** The renderer resolves `entry.meta ?? GRID_META`,
so the moment a facing carries a partial meta the fallback is never consulted and an `undefined`
reaches the paint: `key_tint` drives both the per-sprite tint and the grid's own key falloff and is
deliberately non-identity so §12.8's tint clause is satisfiable; `image_h_px` is in the ground-plane
arithmetic; `horizon_y` is the left-hand side of §5's own gate. So `deriveMeta` emits the full §5
field set — including `calibration_ref` / `calibration_px`, which for a synthesized facing are the
grid's own metre module, as `GRID_META` already declares — and the validator **refuses any resolved
meta missing a required §5 field**, rather than letting one drift in.

**Typed fields.**
- `facing_type ∈ {enclosed, open, corridor}` or `null` (the unplanned facing — a fourth §5 type is
  not invented). Every facing the plan holds must carry a non-null one.
- `enclosed`/`corridor` carry `camera_wall_m > 0` and no `camera_far_m`; `open` carries
  `camera_far_m > 0` and **no** `camera_wall_m` — the different name is the mechanism.
- `corner_x0_px`/`corner_x1_px` both null or both numbers with `x0 < x1`; and the partition is
  total: `wall_continuous: true` ⇒ corners present and `wall_segments` spans the view;
  `wall_continuous: false` ⇒ corners null and `wall_segments` non-empty; `open` ⇒ corners null and
  `wall_segments` empty; `facing_type: null` ⇒ corners null, no `wall_segments` key.
- `provisional`, `camera_id` and `wide_view_policy` ride every derived meta. `projection.md` §5
  keeps two live wide-view readings that disagree on ten facings and says `fits` is the default
  "only because nothing consumes a derived meta yet". This row makes something consume them, so the
  **bake asserts every emitted meta is `camera: "pinned"`** — no shipped facing takes the wide
  camera — and refuses otherwise, which is what forces a ruling before a wide facing can ship. The
  `provisional` flag is carried, not stripped, and the close report says so.

**§12.5's frame clause, for every meta and not only cornered ones.** The old
`px_per_m_at_wall × wall_width_m ≈ canvas width` reached outside the meta; clauses (i)–(iii) as
drafted in `architecture.md` leave null-corner metas with nothing that does. So the clause set is:
**(i)** the wall in view fits the frame — with corners, `0 ≤ corner_x0_px` and
`corner_x1_px ≤ canvasW`; without them, `wall_width_m × px_per_m_at_wall ≤ canvasW`; **(ii)** on a
measured backdrop the corners are measured off the image and `corner_x1_px − corner_x0_px` equals
`wall_width_m × px_per_m_at_wall` within the calibration audit's tolerance — pixels against
arithmetic, row 4's; **(iii)** on a synthesized backdrop (ii) holds by construction and only (i) has
content; plus **(iv)** `image_h_px` equals the canvas height. The canvas is the term no meta
supplies, and after this row every meta the fixture can resolve is reached by at least one clause
carrying it.

**Wall existence, against staging** — "staging never addresses wall that does not exist":
- a `wall_mounted` placement on an `open` facing is a finding — you cannot hang a door on a horizon;
- a `wall_mounted` placement's projected x-span must lie inside a band (inside the corners where the
  wall is continuous, inside a named segment where it is not);
- **every directly-staged placement's footprint x-span lies inside the room at its own scale**
  (`uDomain(meta, place.s)`). A floor object standing past the return is outside the room, and
  nothing sees it today: `u ∈ [0,1]` plus "the rect intersects the canvas" was the whole net, and
  both were satisfied by a 16 m wall nobody had.

**Meta resolution has one home and three tiers**, used identically by the renderer (through the
baked metas), the page, the validator and the bake: a measured `backdrops/<loc>/<facing>.meta.json`
→ the plan's `deriveMeta` → `GRID_META`. Row 2's unreadable-meta finding stays where it is.

**The depth-legality band narrows and the row says which values change class.** The validator bounds
`depth_m` by `scaleAtDepth ≤ px_per_m_at_bottom`; with `px_per_m_at_bottom` at 290.97 and
`hall/N`'s `camera_wall_m` at 1.95 the maximum legal depth there is **1.307 m** (it was 2.49 m).
`stick1` at 0.50 sits well inside; the number goes in the report and in `architecture.md`, because a
placement that is legal today can become a finding tomorrow.

---

## 6. The plan document, the lock, and the staging adoption

### 6a. The approval lock's input, narrowed (A5)

The Navigator's ruling, quoted: *"(4) is not a weakening of the human gate — it is correcting the
gate's input to match its meaning. The stamp asserts 'Kabe approved this drawing.' Kabe saw and
approved walls, outline, openings, stairs, standpoints, room polygons/labels/types — the sheets draw
no furniture, and architecture.md already records that the approval does not cover the
inverse-projected [AI] object footprints. Narrow `approval.lock`'s input to exactly the drawn
content (walls, exterior outline, openings, stairs, standpoints with distances, room
geometry/labels/types). The lock must still fire on ANY change to those. Add a red case proving a
moved wall still trips it, and a case proving a moved footprint does not."*

So `design/plan-draft/draw_plan.py` hashes a **canonical digest of the drawn content** instead of
the whole file; `approval.lock` records that digest, its comment says what the input is, why it was
narrowed, and that the change of value is a change of input and **not** a re-approval; and
`plan.spec` gains the two cases the ruling names — a moved wall trips the stamp, a moved object
footprint does not. `APPROVAL_COMMIT`'s byte-comparisons of the derived SVG geometry and
`standpoints.tsv` are untouched, and both still pass, because objects are not drawn.

### 6b. `stick1`'s depth, under A7

The Navigator's ruling, quoted: *"set `stick1`'s plan depth 0.75 → 0.50 under blueprint §4's
standing license, with the why recorded where the value lives: the cross passage's honest 1.95 m
camera strengthens perspective, and the candlestick must stand nearer the shelf to preserve the
authored occlusion chain (intention quality 3) — 0.50 measured 332 opaque px against the 50 floor.
Do NOT touch §12.8's floor."*

The measured evidence, through the shipped renderer with the adopted staging and the new metas
(alpha ≥ 128 both sides, the §12.8 method): today 284 px; at depth 0.75 under the new meta **48** —
below the floor of 50, so the pair would have failed; sweep 0.60 → 220, 0.50 → **332**, 0.45 → 348,
0.35 → 368. `chair1`×`desk1` is unaffected (3970 → 4351). **§12.8's floor of 50 does not move** —
tuning a gate until the corpus passes is refused, and the same threshold guards row 4's real assets.
`architecture.md`'s scar applies and is honoured: at `depth_m` 0.4 this pair once "demonstrated the
mechanism … without the quality it exists for", so the pass condition is a **looked-at frame**, in
the batch, not the pixel count alone.

### 6c. Adoption, the bake, and the fixture

- `tools/bake-fixtures.mjs` derives the meta for every `location/facing` the world names and the
  plan holds, and emits them into `fixture.js` as `window.HOLO_FIXTURE.metas`; byte-deterministic, a
  pure function of `plan.json` + the world. `plan.json` stays unbaked — the page does not read it.
  The fingerprint's input gains the metas, so a plan edit that changes geometry moves it.
- `index.html` builds `backdrops` from `metas` as `{ meta }` entries with no `image`, and exposes
  `metaFor` on `HOLO_APP` so the test helpers stop reaching for `GRID_META` on facings that no
  longer use it (three helpers do today, which would put the hover, the hit test and the aperture
  point on different geometry from the picture).
- **`staging.json` adopts the projected values** (A2). Under the new metas: `desk1` 0.479 → 0.4383,
  `chair1` 0.5052 → 0.5153, `shelf1` 0.4475 → 0.3950, `stick1` 0.4632 → 0.4264 with `depth_m`
  0.75 → 0.50, `door1@hall/W` unchanged at 0.5, `door1@study/E` 0.5 → **0.7292**. Adoption is not
  optional even if it were unlicensed: `u` is normalized across `wall_width_m`, so keeping 0.479 on
  a 5.45 m wall would put the desk at a different metre offset from the one the plan draws, and the
  bake's divergence check refuses it.
- `KNOWN_DIVERGENCES` empties, and the bake's "listed as a known divergence but now agrees" refusal
  is what forces that in the same commit. **After adoption the staging↔plan assertion carries no
  information about the plan at all** — all six rows agree definitionally, where before exactly one
  carried information — and `projection.md` says so in its own words rather than reporting six
  agreements as evidence.

---

## 7. Tests

`architecture.md`'s rule holds throughout: **a guard that stays green when what it guards is deleted
is a finding**, and every clause below is written by breaking the mechanism and watching it go red.

**The independent side is independent of `deriveMeta`, and can disagree with it.** The first
revision proposed typing the literals out of `projection.md` §4 — a *generated* document produced by
the very function under test, which is the same self-agreement §12.5's independence rule exists to
stop. Instead `helpers.mjs` gains `LIT.facing(loc, f)` whose two per-facing numbers
(`wall_width_m`, `camera_wall_m`) are **typed by hand from the approved `standpoints.tsv`** — a
human-approved artifact that `plan.spec` already byte-compares against `APPROVAL_COMMIT` — and whose
camera literals (eye 1.83, horizon 0.48, 96 px/m, 1536×1024) are typed from blueprint §10 and §7.
Everything else the tests need is computed test-side. A `deriveMeta` that starts lying goes red.

- **`geometry.spec`** — the horizon clause at 1.83 (with the eye height cross-checked against
  `replicator/contract.json`, the term outside the derivation); §12.5's clauses (i)–(iv); the grid
  scans re-pointed to measure inside the regions that now exist rather than across a frame-wide
  wall; the "documents state the shipped meta" test extended to the new fields.
- **New, and it replaces the hand-run cross-commit check** — *the room is where the arithmetic says*:
  for all eight shipped facings, the corner columns, the floor-line row, the eye row, the junction
  exit points and each staged entity's baseline and drawn height are **predicted test-side and
  measured from rendered pixels**. On a row where every frame moves, "every changed pixel changed on
  purpose" discriminates nothing; a per-frame prediction does. And *the corners move with the plan*:
  a doctored plan with a wider study puts them where the wider room says, so the test cannot pass on
  a hard-coded pair.
- **New** — *typed geometry is data, not a branch*: a synthesized `open` meta (`entrance_court/S`)
  and a synthesized segmented meta (`entrance_approach/N`) render through the shipped renderer with
  no facing wall and no invented corners; and the corridor/enclosed return-share ordering of §2.
- **New** — *the returns' omission list is pinned* (§3's table), so a new blank-drawn doorway cannot
  appear silently.
- **`validator.spec`** — one red case per new clause, each failing on that clause alone.
- **`plan.spec`** — the narrowed lock, with the ruling's two cases; `GRID_CAMERA` now the ruled eye
  height; `assertCameraConsistent` still green; the derived-render byte-identity against
  `APPROVAL_COMMIT` untouched, which is why this row re-derives instead of redlining.
- **`heights.spec`, `mechanisms.spec`** — every literal moves; the census keeps its six entities;
  overlap pairs, tint/shadow/part switches, doorway derivation and the two-door-facings clause all
  re-run on the new geometry with **no threshold moved**.
- **Enumerated, because the first revision predicted "no changes" here and was wrong**: the
  walkthrough's arithmetic-pinned chair-refusal click sits at a `chair1`×`desk1` intersection pixel
  and both move; the clickability sweep aims at object centres and all six move; `door1` moves
  1.1 m on `study/E`; `knowledge.spec` and `helpers.mjs` pass `GRID_META` into `layout` and
  `apertures` on facings that no longer resolve to it. Each is re-pointed at the resolved meta, not
  at a new literal.
- **Cost is measured, not assumed**: the returns add per-metre lines and two clip paths per frame,
  against `architecture.md`'s recorded ≈270 ms per turn at 4× CPU throttle. The row measures the new
  figure on the furnished study facing and records it; a regression beyond the recorded budget is
  reported rather than shipped silently.
- Both engines, whole suite.

---

## 8. Documents brought true in the same change

- **`design/blueprint.md`** — §5's corner/type paragraph gains an **[AI]-tagged amendment beside**
  the [HUMAN] text (never inside it): the band model, the typed depth anchor with no fallback, the
  schema fields and their required/forbidden pairings, and what actually ships (corridor included).
  §7's grid-canonical amendment restates `GRID_META` at the ruled eye height, with its new
  `facing_type: null` and null corners, and says it is now the *unplanned-facing fallback*. §12.5
  carries clauses (i)–(iv) and the sentence that the horizon clause holds by construction on a
  synthesized meta. §4b records the lock's narrowed input and its authority.
- **`design/architecture.md`** — grid-drawing internals, the corner-bounded u-domain, the meta
  resolution tiers and the complete-meta refusal, the staging adoption and what it cost, the
  featureless-return omission list with row 15 as owner, the narrowed depth-legality band, the
  measured repaint cost, and the open-limits list updated (the horizon-gate inconsistency it records
  as live is closed here and the entry says so).
- **`design/plan-draft/projection.md`** — regenerated; §0's questions 1 and 2 are answered, with
  their authorities named (A2, A4), and the rest stay open. `design/plan-draft/README.md`'s
  still-open list is corrected to match.
- **`README.md`** — checked; it gains nothing unless a sentence about the picture has become false.
- **`design/intention.md`** — row 11 deleted in the state-only closing commit, per *How we work*.

---

## 9. Edges — what this row must not touch

- `replicator/` (read-only: `contract.json`'s eye height is a cross-check term), `backdrops/`,
  `library-src/`, `library/`, and every AgentPost mailbox.
- **`plan.json`'s drawn content is not edited.** The one edit is `objects[].stick1`'s footprint,
  under A5 + A7, which no sheet draws; the drawn geometry, the outline, the openings, the stairs and
  the standpoints are untouched and their byte-identity against `APPROVAL_COMMIT` is what proves it.
- `world.json` gains nothing — no coordinate has ever lived there and none arrives now.
- The `[HUMAN]`-tagged spec-list row is not rewritten by this seat.
- §12.8's thresholds, §12.5's tolerances and every gate constant stay where they are.
- No new surface string; `design/surface-strings.md` should need no entry, and if the row produces
  one it is extended in the same commit or `voice.spec` is red.
- Nothing is pushed.

## 10. What outside this row feels the change

- **Row 4** — inherits the schema, clause (ii), the corner fields, and per-facing `camera_wall_m`,
  wall widths and corner positions for its prompt sheets; the wall-return device Kabe asked for at
  the frame edges is now what the grid draws, so grid rooms and generated rooms have one device to
  agree on. It also inherits the two residues this row prints rather than fixes: the unmodelled
  pitch, and the floor cut on the four facings where it moves outward.
- **Row 15** — the manor walks on this row's typed drawing; the featureless-return omission list is
  its multi-facing-presence work.
- **Kabe, through the batch** (A6) — the corner/return look, the ~131° view rendered rather than
  described, blueprint §7's unspent wide-camera edge-corner decision with a rendered example, the
  ceiling-less wall, and the three doorways a return draws blank. His verdict routes as rows.
- **The public link** — the demo's rooms stop being an endless wall.
