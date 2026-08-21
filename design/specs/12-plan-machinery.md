# Row 12 — the manor plan machinery

Plan for spec-list row 12. The target and its done clause live in the spec list; nothing is
copied here.

Ground truth is `design/plan-draft/` as approved by Kabe on 2026-08-21 (blueprint §4b's approval
note and its four rulings). Every metre comes from `draw_plan.py`'s literals; none is re-invented.

*Revision 4. Three examination rounds: 43 plan findings, then 39, then 25 artifact findings from
a critic that measured the plan against the approved sheets pixel by pixel and neutralised all 68
`push(` sites in the validator one at a time. What changed is named where it changed; what was
declined is answered in §9, because a decline that is not written down is indistinguishable from
a miss.*

**The four the artifact critic found by breaking things**, each now guarded: the corners were a
private copy of the u-mapping rather than a call to `groundplane.xAtScale`; the committed PNGs
were verified by nothing, so the pre-row-12 sheet could be dropped in and pass the whole suite;
the sheet's legend typed its three wall thicknesses while `plan.wall_thickness` sat unread; and an
emptied `objects[]` baked green. §5 and §3 say what each became.

---

## 1. What inverts

Blueprint §4b shape item 10 inverts the artifact order: **`plan.json` becomes the source and the
schematic becomes a derived render.** Four pieces and one acceptance:

| piece | file |
|---|---|
| the document | `fixtures/demo-study/plan.json` |
| the validator | `tools/validate-plan.mjs` — pure `validatePlan` / `planWarnings` + thin CLI, called by the bake |
| the projection | `tools/plan-projection.mjs` — pure functions + thin CLI, through `src/groundplane.js` |
| the derived render | `design/plan-draft/draw_plan.py`, reading `plan.json` |

**The acceptance:** the derived render's *drawn geometry* — every `<rect>`, `<line>`, `<path>` and
`<circle>` on both sheets — hashes to exactly what the approved sheets hashed to, and
`standpoints.tsv` byte-equals the approved file. Nothing in the extraction moved a millimetre of
what Kabe looked at.

Two caption strings did move, deliberately, and §5 says why.

---

## 2. `fixtures/demo-study/plan.json`

### 2.1 How it is populated, and how anyone can re-derive it

Rooms, walls, openings, windows, fireplaces, stairs and standpoints come from `draw_plan.py`'s
literals by a mechanical extraction. Object footprints are the one thing the drawing does not
hold — it draws no furniture — and they are **inverse-projected from the shipped `staging.json`**.

That inverse is not a throwaway script: it is `plan-projection.inverseProjectPlacement`, exported
and tested, and its three inputs are named because `u` means nothing without them — the shipped
`staging.json`, the §6 record, and **`GRID_META` from `src/renderer.js`**, which is the meta the
renderer resolves for these two rooms and therefore the only wall `u` can be spanning. A test
re-derives all four footprints and requires them to equal `plan.json`.
*(Fixes F3, F25: the meta source is named, `renderer.js` is listed as an input, and the numbers
are re-derivable by a committed function rather than by a script nobody kept.)*

Where the two routes disagree — `door1` — **the drawing wins**, because the drawing is what Kabe
approved, and the disagreement is reported rather than smoothed over (§4.4).

### 2.2 Shape

```jsonc
{
  "schema": "holo-emitter-plan/0.1",
  "version": 1,                     // shape item 11's version stamp
  "units": "m", "north": "+y",
  "standpoint_stand_back": 0.25,    // law (a)'s one rule, one home
  "entrance": "entrance_approach",  // what reachability is measured from
  "wall_thickness": { "exterior": 0.6, "interior": 0.35, "garden": 0.45 },
  "outline": [[0,0], …],            // law (b): the one exterior outline
  "floors":  [ { "id": "ground", "level": 0 }, { "id": "upper", "level": 1 } ],
  "wall_bands": [ { "id": "W0", "kind": "exterior|partition|garden",
                    "floors": ["ground","upper"], "rect": {…} }, … ],
  "rooms": [
    { "id": "study", "floor": "ground", "name": "STUDY", "type": "enclosed",
      "rect": { "x0": 24.95, "x1": 30.4, "y0": 9.6, "y1": 14.4 },
      "archetype": "chamber",          // §4b's ROOM TYPE TEMPLATE — a different
                                       // vocabulary from the facing geometry type
      "facings": { "N": { "type": "enclosed", "standpoint_source": "rule",
                          "standpoint": { "x": 27.674999999999997, "y": 10.8 },
                          "wall_line": 14.4, "camera_wall_m": 3.6,
                          "wall_width_m": 5.45 }, … } } ],
  "openings": [ { "id": "op13", "kind": "door|open_edge", "floor": "ground",
                  "axis": "EW", "rect": {…}, "joins": ["study","hall"],
                  "entity": "door1" }, … ],
  "windows":    [ { "floor": "ground", "rect": {…} }, … ],
  "fireplaces": [ { "floor": "ground", "room": "study", "rect": {…} }, … ],
  "stairs": [ { "id": "great_stair", "kind": "straight", "treads": 17,
                "rect": {…}, "joins": ["great_stair_hall","stair_landing"],
                "up": "N", "down": "S" }, … ],
  "objects": [ { "id": "desk1", "floor": "ground", "room": "study",
                 "footprint": { "x0": 26.689, "x1": 27.989, "y0": 13.85, "y1": 14.4 },
                 "attachment": "floor_against", "source": "inverse-projected" }, … ]
}
```

Six shape decisions the critics forced:

- **An object is a footprint rect, not a point** (F22). The plan holds the metres the object
  occupies, so a collision is checkable from the plan alone without the sprite library; the
  validator cross-checks the rect against the record's `dims_m`, and refuses when records are
  *not* supplied (r2 F22): the only thing binding a plan footprint to the object it claims to be
  must not be optional.
- **`source` is a closed vocabulary**, `drawing | inverse-projected` (F24), so a later
  re-derivation knows machine-readably which values it may regenerate.
- **`standpoint_source` is `rule` or `drawn`** (F30). Law (a)'s K rule is checked where the plan
  claims it, and a deliberately-placed standpoint stays expressible — §4b item 9 puts several
  standpoints in the great hall and the long gallery, and a schema that forbade them would have to
  be reopened by the row that builds them. What is checked *always* is the measurement:
  `camera_wall_m` equals the distance from the stored standpoint to the line it views.
- **Precision is deliberate and mixed, with a reason** (below).
- **`archetype` is a separate field from `type`** (r2 F13). `type` is §5's facing geometry
  (enclosed / open / corridor); `archetype` is §4b's room *type template* — the production
  recipe Kabe's "per room modular consistent design so creation is snappy" asks for, and what
  §4b item 6's backdrop-template tier keys on. Merging them left that tier nothing to key on.
  Chamber / hall / corridor / service / stair / open, [AI] packaging of the drawn roster.
- **No pixel lives in the plan** (r2 F23, F24). A key whitelist refuses any world fact
  (`states`, `knowledge`, `relations`, `takeable`, `sprite`) and any unknown key, the same shape
  `validate-fixtures.mjs` uses on the other two documents; and `canvas_w_px` is gone — a canvas
  width is a pixel, and it is the consumer's parameter now.

### 2.3 Precision, because the drawing is a projection of these numbers

`camera_wall_m` and `wall_width_m` are stored **at the drawn precision, two decimals** — law (a)
says the number printed beside the standpoint *is* `camera_wall_m`, so the document holds that
number. Storing the raw double instead would be worse than untidy: the long gallery's 18.2249999…
and 18.225 are different doubles that print differently, and the document would render a drawing
that disagreed with the approved one.

Standpoints are stored **exactly**, unrounded. Rounding them to 9 dp moved six label positions on
the sheet by 0.01 px, because `X(29.0375)` lands exactly on a two-decimal boundary. Object
footprints are rounded to 9 dp: nothing draws them.

### 2.4 What does not go in

`plan.json` is the spatial document; `draw_plan.py` keeps everything about the *picture* — label
nudges, colours, stroke weights, hatch patterns, artboard extents, titles, legend copy, the ★'s
hand-placed position, the footnotes. A number that moves a *room* goes in the plan; a number that
moves a *label* does not. And `world.json` gains nothing: the plan is presentation-side, so truth
still holds no coordinate.

### 2.5 The one correction the extraction makes

`DOORS_U`'s last entry — the opening in the W2 band at y 11.0–12.0 — was labelled *Solar ↔ Long
Gallery* and geometrically joins **Muniment Room ↔ Long Gallery** (the Solar's east wall is at
x 24.6; that opening is at x 30.4). The two names are never drawn, so the derived render is
byte-identical either way and the correction changes no pixel Kabe approved. Recorded in
`design/plan-draft/projection.md` §7 — which outlives this file — as well as in the final report,
because an agent changed what an approved artifact says (F43).

---

## 3. `tools/validate-plan.mjs` — the standing validator

ESM. `validatePlan(plan, world?, records?) → findings[]` and `planWarnings(plan, records?,
world?) → warnings[]`, both pure; a thin CLI prints both and exits 1 on any finding. Wired into
the bake's refusal path like the fixture validator — and the plan is **required**, not optional
(F28): a missing `plan.json` refuses the bake rather than passing in silence.

`plan.json` is deliberately **not** added to the baked `FILES`. The page does not read the plan,
so baking it would move `fixture.js`'s bytes and fingerprint for nothing.

### 3.1 Findings block; warnings do not — and why that split exists

Three statements are true of this plan and cannot be fixed inside this row without moving
something a human approved: the desk's footprint overlaps the study's chimney breast, the
entrance approach's north view is a wall with a 20.4 m gap in it, and the kitchen's great
fireplace has no flue above it. A validator that refused those would refuse the approved plan; a
validator that could not see them would be the reason nobody ever found them. So they are
**computed** by `planWarnings` over the committed document, printed by the CLI and by the bake,
and carried into `projection.md` §6. *(F4, F21, F27: the collision is produced by a check, not by
hand arithmetic in a file that gets deleted.)*

### 3.2 The five promoted checks (`draw_plan.py`'s self-checks, become law)

1. **Tiling** — per floor, rooms plus partitions equal the interior gross area exactly. Gross is
   derived in-document: the outline's polygon area minus the exterior bands' own footprint, so a
   redline that moves an exterior wall moves the target with it (F26). Rooms may not overlap wall
   bands.
2. **Overlap** — no two spaces on a floor share area, open spaces included (F12; the drawing
   checked interior rooms only).
3. **Every door joins two spaces** — and *the two it names*: each opening lies inside a wall band
   and the rooms geometrically abutting its two sides are exactly its `joins`. The drawing checked
   only that the names matched *some* room, which is why the mislabelled upper door survived
   approval.
4. **Reachability** — every space on both floors is walkable from `entrance`, through openings,
   open edges and stairs. All three edge kinds are in the document, so the adjacency the drawing
   patched in at check time is gone.
5. **Standpoint derivability** — law (a), in two parts: `camera_wall_m` always equals the measured
   standpoint-to-wall-line distance at the drawn precision, and the standpoint sits where the K
   rule puts it wherever `standpoint_source` says `rule`.

### 3.3 Law (b), which had no witness at all (F9)

The drawing held law (b) by being *checkable by eye* — the heavy black outline. After this row the
drawing is derived and a future host emits the plan, so the law needs a mechanism:

- an `open` facing must have **no built structure between its standpoint and its far line**, and
  none standing **on** that line either — ground that runs open cannot run into a wall;
- a facing of an outdoor space that claims a wall must have one: an exterior or garden band
  standing on the line it views;
- **the outline and the wall bands must agree** — every edge of the outline is the outer face of an
  exterior band, because §4b makes the outline "the single source of every outdoor wall" and two
  hand-typed statements of one geometry drift (F11);
- how *much* of the view is walled is a warning, not a finding, and the derived meta carries the
  answer (§4.2).

Only exterior and garden bands count as built structure an outdoor space can see — the garden wall
is the one further built structure Kabe ruled in on 2026-08-21.

### 3.4 Licensed strengthenings, each with its reason

Carriers lie in walls (a window floating in a room becomes a backdrop prompt at row 4, where
nothing can catch it); chimney stacks are continuous upward (a hearth on nothing is a flue that
does not exist) with the downward direction as a warning; the facing-type vocabulary by name, with
`far_line` present exactly on `open` facings; ids unique across rooms, bands, openings, stairs and
objects; stairs straight and opposite (ruling (4) left the fiction-demands-a-turn exception
unspent); object footprints inside their room and clear of wall bands, and matching the record's
`dims_m` when records are supplied.

### 3.5 The world cross-check

Closes a named open item in `design/architecture.md`: *"'direction of travel' is prose today —
nothing yet checks that the hall actually lies east of the study in any geometric sense."*

- every exit's `via` resolves to a plan opening whose `joins` is exactly `{from, to}`;
- `exit.facing` is the facing on which the `from` room **sees that opening** — read off the
  opening's own normal and which side of it the room lies on, never a centre-to-centre bearing.
  That distinction is not academic: the cross passage's kitchen door lies *south* of it but *west*
  of its centre, so a bearing rule is wrong on this very plan and green at M0, and row 15 is where
  it would have detonated (F18). A test asserts exactly that case.
- `exit.arrive_facing === exit.facing` — blueprint §3's orientation law, geometric now. The
  finding names that a future turn-demanding exit is a new-row decision that reopens this
  check (F19).

**Which document owns what** (F20): `world.json` is the home of topology *truth*; the plan is
presentation-side and holds the *geometry*. The plan may be partial — a world can name a location
before the plan has drawn it (§4b item 3's ladder puts a conjured room on screen as grid first) —
so an unplanned location is a **warning** and its exits are outside what the plan can judge. Row
15 is where world's topology is authored *from* the plan; the cross-check is what keeps them
honest in the meantime.

---

## 4. `tools/plan-projection.mjs` — the projection

ESM, pure functions, thin CLI. Imports `src/groundplane.js` and `src/renderer.js`'s `GRID_META`
through their UMD guards via `createRequire` — imported, never re-derived.

### 4.1 The camera is an argument, and this row picks nothing (F1, F2)

Two cameras are in the documents and they are not the same. The **grid camera** the demo ships
(`GRID_META`: eye 1.60 m, level) is the only camera this project has drawn a pixel with. The
**contract camera** blueprint §10 rules for generation is eye **1.83 m** with **−8° pitch** —
Kabe's six-foot ruling, whose home is `replicator/contract.json`. And blueprint §5 rules that
neither is final: *"The geometry elements should be determined by the orientation of the approved
initial image generation."*

So `deriveMeta` takes a camera. It defaults to the grid camera, because that is the one that
reproduces today's pixels, and `projection.md` §5 prints what the contract camera would give
instead — floor line, bottom scale, nearest floor — with **pitch named as unmodelled and
measured**: at the study's implied focal length an −8° pitch moves the horizon 47 px, 0.046 of
frame height, against an authored `horizon_y` of 0.48. `groundplane.js` has no pitch term and
adding one would move every shipped pixel. This is a fork carried up, not a decision taken.

The eye height is derived back out of `GRID_META`, and the plan is explicit that this makes
`deriveMeta`'s pinned case an **identity, not evidence** (F2). The check that can actually fail is
`assertCameraConsistent`: §5 states the floor twice — as the scale lerp and as the horizon device
— and they agree only for one `px_per_m_at_bottom`. A test doctors `GRID_META` and watches it go
red.

Everything else derives:

```
camera_wall_m / camera_far_m = the facing's drawn distance     (law (a))
wall_width_m                 = the facing's drawn wall width   (law (a))
px_per_m_at_wall             = the camera's pinned scale, or canvasW / wall_width_m (§4.3)
floor_line_y                 = horizon_y + eye_m · px_per_m_at_wall / image_h_px
px_per_m_at_bottom           = (image_h_px − horizon_y·image_h_px) / eye_m
corner_x0/x1_px              = the wall's ends in frame — null unless ONE CONTINUOUS wall
                               spans the view
facing_type, backdrop        = the typed geometry row 11 consumes; "vista" on open facings
```

**`camera_wall_m` and `camera_far_m` are two fields, not one** (F14). An `open` facing views a
drawn ground line with no surface on it; handing that number to a depth model that expects a wall
plane puts a horizon where a wall goes. An open facing carries `camera_far_m` and `far_line` and
no `camera_wall_m` at all, plus `backdrop: "vista"` — which is ruling (1)'s scenic-vista extension
made into a field row 4's prompt sheets can read (F15).

### 4.2 Law (b) reaches the meta (F10)

The entrance approach's north view is 32.00 m of which **20.4 m is the open court mouth**, with
the hall front 9 m further back — the drawing's own note says so. A meta that emitted one
continuous 32 m wall with corners at the frame edges would be inventing the manor's front
elevation, which is precisely what law (b) forbids.

So `deriveMeta` emits `wall_segments` — the built structure across the view, in view-relative
metres — and emits corners **only where one continuous wall spans the view**. On this plan exactly
one facing is segmented, and `projection.md` §3 names it with its gap. Whether such a facing should
be typed `enclosed` at all is Kabe's to rule.

### 4.3 The wide-view camera (F13)

Kabe's ruling (3): *open and corridor deep-views take their own wider camera, enclosed flat views
keep the pinned frame.* The pinned frame holds exactly 16.0 m of wall.

A compound trigger reading the room's type **and** the width was built first and dropped: it gave
the privy garden's two flat 4.16 m views the wide camera while withholding it from the long
gallery's 18.22 m deep views, contradicting the sentence's own vocabulary in both directions. What
ships reads the one quantity the license was granted about — **a facing whose wall in view is wider
than the frame holds takes the wider camera**, `px_per_m_at_wall` becoming `canvas / wall_width_m`
so the wall fills the frame instead of being clipped, which was the alternative the ruling
declined.

Ten facings take it. `projection.md` §4 lists them, says that six are `enclosed` *facings* and that
the gallery's two `corridor` facings do not qualify, and says what changes under each other reading
— so the redline lands on numbers rather than on a paragraph.

### 4.4 Reproduction, and what the agreements are worth (F5, F6)

Blueprint §4b asks the validator to assert *staging ≡ plan projection*. It does:
`stagingDivergence` compares every directly-staged placement against the projection under the meta
the renderer resolves, and **the bake refuses on any divergence that is not the one named
divergence** — a named entry that quietly starts agreeing refuses the bake too, so the allowlist
cannot rot.

The done clause's "reproduces … or the differences are shown" resolves to **shown**, and the
report says plainly what the agreements are worth:

- `desk1`, `chair1`, `shelf1`, `stick1` agree **definitionally** — their footprints came out of
  this same staging. The assertion is a binding guard against a later edit to either side, and it
  is not evidence about the plan.
- `door1` on `hall/W` agrees at u 0.5 and that is **also not evidence**: at offset 0 from the wall
  centre, u is 0.5 under any `wall_width_m` at all.
- `door1` on `study/E` is the one row carrying information, and it **disagrees**: the approved
  drawing sites it 1.1 m south of the study's east-wall centre, where the staging centres it.

The report also shows what moves under the plan's own meta — every `u`, and every object's drawn
size, because `camera_wall_m` moves with it (`stick1` grows 28%) (F40).

**Nothing in `fixtures/demo-study/staging.json` changes.** The shipped demo's pixels are pinned.

### 4.5 What the pinned scale costs, computed (r2 F1, F2)

Blueprint §7 pins `px_per_m_at_wall` at 96 and law (a) supplies standpoint distances from 1.95 m
to 15.30 m. This is the row that runs those two together across 88 facings, so it is the row that
has to say what comes out:

- **The lens is not one lens.** `px_per_m_at_wall × camera_wall_m` runs 187 px to 2014 px. The
  visible consequence is that `floor_line_y` is identical on every pinned facing whatever the
  room's size — the great hall and the study are the same picture with different corners.
- **The floor cut is not at your feet.** The intention's fifth quality is *"the camera has feet …
  Riven's rails are cut by the frame bottom at your own feet"*. The shipped study cuts at 1.04 m;
  fifteen facings cut at more than twice that, up to 6.05 m in the entrance court.

Both are emitted per facing (`focal_px`, `nearest_floor_m`), tabulated in `projection.md` §6, and
pinned by tests. Neither is fixed here: a cap on the standpoint rule changes the drawing Kabe
approved, and pinning the lens instead of the scale is §5's open field-of-view question. *(A
first cut of `nearest_floor_m` returned the depth from the wall rather than the distance from the
viewer — the complement — and read 2.56 m where the shipped grid cuts at 1.04 m. The critic's own
arithmetic is what exposed it; the fix carries an assertion against recurrence.)*

### 4.6 What row 4 gets from this row

**Per-facing carriers** (r2 F14, F38) — `facingCarriers` returns what each facing's wall holds,
in view-relative metres and in §4's own `u` domain. This is what a prompt sheet is made of, and
it is what makes blueprint §11's wall maps checkable instead of arguable: all eight facings of
the two existing rooms are compared against §11 mechanically, and the two that disagree are
**D4** — the cross passage's buttery and kitchen doors — arriving with numbers rather than as a
paragraph. Then `view_angle_deg` per placement (F31) — blueprint §10 [HUMAN, 2026-08-21] says a sprite's
generation request derives its view angle from the plan, "computable once row 12's plan exists".
`projectPlacement` computes it and `projection.md` §2 tabulates it. And `facingsContaining` (F32),
the primitive §4b item 9's variant manifest enumerates; the manifest itself belongs to row 4's bulk
step, which owns the worklist and the library index it diffs against, and this plan says so rather
than leaving "row 12 onward" to be read two ways.

---

## 5. `design/plan-draft/` — the derived render

`draw_plan.py` reads `fixtures/demo-study/plan.json` (`--plan PATH` to override). Its self-checks
are **deleted**, not kept: they were promoted to `tools/validate-plan.mjs`, and two copies of a
check is the second home this project refuses. It calls the validator and refuses to draw an
invalid plan, so a redline still cannot silently break the plan; with no `node` it says so and
refuses rather than drawing unchecked.

**Two caption strings changed, and the acceptance survives it.** The sheet said *"DRAFT for
redline"* on a drawing that has been approved, and a footnote credited checks to "the drawing
script" after they moved. Both were false sentences in a live artifact. They are in `<text>`
elements, so the standing guard is the one that matters: the **geometry hash** — every drawn
element with text stripped — equals the approved sheets', and `standpoints.tsv`, which is pure
geometry and no prose, byte-equals the approved file. A further test moves a room and requires the
geometry hash to move with it, so the guard is not a decoration (F35, F36).

The PNGs are regenerated and committed, and they are the artifact the human gate actually runs on
— so "not byte-comparable" is not the same as "unverified", which is what a first cut of this row
made them. They are the SVG rasterised by the system browser at 2×, so their bytes cannot be
regenerated for comparison; but the SVG they came from can be. `render.sh` writes
`design/plan-draft/render.lock` recording, per artboard, the SHA-256 of the SVG it rasterised and
of the PNG it produced, and a test reads it: a redline that runs `draw_plan.py` and forgets
`render.sh` leaves a PNG whose recorded source no longer matches the committed SVG, and a swapped
or hand-edited PNG no longer matches its own hash. Before that lock existed, dropping the
pre-row-12 PNG in place passed all seventy-nine plan tests.

The sheet's legend prints three measurements — 0.60 m, 0.35 m, 0.45 m — and they were typed into
`draw_plan.py` while the plan's own `wall_thickness` was loaded and never read. They render from
the document now, keyed by wall-band kind so the legend and the validator share one vocabulary,
and every band's thickness is checked against the number the sheet prints.

`design/plan-draft/README.md` is brought true — derived render, redline route, the four rulings —
and **keeps D4 open** (F33): whether `hall/N` and `hall/S` get door openings prompted into them is
still Kabe's call, and the four rulings of 2026-08-21 did not reach it. Saying otherwise would
retire a live question.

---

## 6. Where the open questions go (F7, F34)

A builder cannot show anything to Kabe; the Navigator carries forks. What this row can do is put
every unanswered question somewhere that outlives the spec file, and name them in the handoff:

- **`design/plan-draft/projection.md` §0** — a generated list of the seven things needing Kabe,
  each with its numbers, byte-compared by a staleness test so it cannot go stale;
- **`design/architecture.md`** — the plan-machinery section, for the session that boards next;
- **`design/blueprint.md` §4b** — the row's outcome note, and the §12.5 amendment below;
- **the final report** — named for relay.

---

## 7. §12.5's frame-filling clause, amended here (F16, r2 F8, F9)

Blueprint §7's row-2 amendment gave §12.5 the clause `px_per_m_at_wall × wall_width_m ≈ canvas
width`, written when grid-canonical `wall_width_m` **was** the wall in frame. This row produces
metas where it is false by design — `study/N` is 96 × 5.45 = 523 px against a 1536 px canvas — and
row 11's done clause requires §12.5 green, so leaving it as an inherited tension would hand row 11
a done it cannot reach.

The first draft of the amendment replaced it with `corner_x1_px − corner_x0_px = wall_width_m ×
px_per_m_at_wall`, which reads both sides out of the same meta wherever corners are computed —
turning "the one clause that reaches outside a meta" into a self-consistency check that a meta
claiming a 5.45 m wall over a 16 m backdrop would pass. The amendment as written keeps the
outside anchor: **(i)** the wall fits the frame, `0 ≤ corner_x0_px` and `corner_x1_px ≤ canvas
width` — the canvas being the thing outside every meta; **(ii)** on a *measured* backdrop the
corners are measured off the image and their span must equal `wall_width_m × px_per_m_at_wall`
within the calibration audit's tolerance — pixels against arithmetic, which is where the
original clause's force lived; **(iii)** on the synthesized grid, (ii) holds by construction.

Two consequences are named for row 11 rather than assumed: a wide-view facing's corners sit
exactly **on** the frame edge, which reads as *not visible* against row 11's "two visible
corners" — either the wide camera takes a margin or edge corners count, and it is a look
decision; and a facing with null corners has a u-domain spanning `wall_width_m` with no clamp.
It is written into the blueprint beside the clause it replaces, not left in a file that gets
deleted.

---

## 8. Tests — `tests/playwright/plan.spec.mjs`

Pure-Node specs in the Playwright runner, like `fixtures.spec` and `validator.spec`. 105 cases
per engine.

1. **Shape** — schema, version, the 22 spaces, the two M0 rooms sited, validator green, CLI green.
2. **Thirty-three mutations, one per check**, each required to go red with a matching message —
   overlap, tiling, room-in-wall, door mis-joined, door joining a room that does not exist, door
   outside a wall, reachability through a door and through the stairs, `camera_wall_m` typed, a
   moved standpoint, a wrong `wall_width_m`, `far_line` missing and `far_line` where it must not
   be, both halves of law (b), outline drift, a floating window, a fireplace in no room, a broken
   stack, a duplicate id, a bent stair, a stair on one floor, an object outside its room, an
   object whose footprint contradicts its record, a bad `source`, a bad `entrance`, a missing
   version. Plus the unmutated plan, so the battery is not a tautology.
3. **The orientation law**, geometrically: green on the shipped pair; red on a flipped
   `arrive_facing`, a wrong `facing`, an unknown `via`; and **the off-axis door case** that a
   centre-to-centre bearing gets wrong.
4. **The camera**: the grid camera is imported not typed; `assertCameraConsistent` green, and red
   on a doctored `GRID_META`; the contract camera drives nothing.
5. **The plan holds no world fact and no pixel**; the canvas is the consumer's parameter; the
   two vocabularies (`type`, `archetype`) stay apart.
6. **What each facing carries**, against blueprint §11's wall maps — all eight facings of the two
   existing rooms, with exactly `hall/N` and `hall/S` disagreeing, which is D4.
7. **The pinned scale's two costs**: the lens spread, `floor_line_y` identical across pinned
   facings, and the frame-bottom floor cut measured from the viewer (with the wall-relative
   complement asserted against, since that was the bug).
8. **Both wide-view readings** computable and disagreeing on ten facings; every derived meta
   `provisional` and naming its camera and policy.
9. **Meta geometry by independent arithmetic** — test-side literals for `study/N`, `hall/E`,
   `entrance_court/N` and `/S`, `entrance_approach/N`; the wide-camera set enumerated; and the one
   genuinely independent check (F29): **all 88 facings against the approved `standpoints.tsv`**,
   a separate artifact rather than this code's own arithmetic.
10. **The projection**: the tolerance driven from both sides; exactly one named divergence and no unplanned placement; `door1`'s
   disagreement pinned at the drawing's 1.1 m; the four inverse-projections re-derived; anchored
   entities throw rather than get invented positions; view angles; `facingsContaining`.
11. **Import binding**: displace `xAtScale`, `scaleAtDepth` and `placeHost` at runtime and require
   the projection and the inverse to move with them. A projection that re-derived the math stays
   green and fails these.
12. **The bake path**: plus a `GRID_META` that stops satisfying §5's horizon device;: an invalid plan refuses and writes nothing; a **missing** plan refuses; a
   staging value that walks away from the plan refuses; a world that contradicts the plan's
   geometry refuses; and the shipped `fixture.js` is byte-identical after a fresh bake.
13. **The derived render**: `python3` present (fail, never skip — F37); a re-render in a scratch
    tree byte-equals the committed SVGs and TSV; the render refuses an invalid plan; the geometry
    and the TSV compared **against the approved blobs read out of git at the approval commit**,
    not against literals a builder could edit in the same commit (r2 F21); only the two caption
    strings differ from those blobs; the geometry hash moves when a room moves; each PNG is its
    artboard at 2×.
14. **The report** is byte-fresh and still carries every question it raises.

---

## 9. What the second critic found that this row declines, and why

Answering these is not optional: a decline nobody wrote down is a miss.

- **"The derivation runs backwards from what the row asks"** (r2 F5). Correct, and deliberate.
  §4b wants hand-authored staging values to become generated ones; adopting them moves the
  shipped demo's pixels, which this row's fence forbids. Row 12 builds the projection, the
  assertion and the diff; **adoption is row 15's or row 4's**, and whoever takes it also takes
  §12.6's captures, the hash tests and `heights.spec`'s literals. Named in `architecture.md` so
  it survives this file. The same paragraph names §4b item 10's **solver** as unbuilt and
  unowned.
- **"The camera is the unruled one"** (r2 F3). The projection takes the camera as an argument,
  defaults to the only one this project has drawn a pixel with, marks every derived meta
  `provisional: true` with its `camera_id`, and prints the ruled camera's numbers beside it.
  Deriving on §10's 1.83 m would emit metas that no shipped pixel agrees with and would still be
  wrong, because §5 rules that the real camera is measured off row 4's approved backdrop.
- **"A [HUMAN] ruling is not an agent's to contradict"** (r2 F10). Agreed, which is why the
  wide-view trigger is no longer a single reading: both `fits` and `ruling` are computable,
  `projection.md` §5 prints the ten facings they disagree on, and every meta says which produced
  it. `fits` is the default because nothing consumes a derived meta and it leaves no wall
  clipped. When Kabe rules, the loser is deleted.
- **"The approval covers a subset"** (r2 F18, F19). True and unresolvable by a builder. What the
  approval anchors and what it does not is enumerated in `architecture.md`, field by field, and
  carried up.
- **"`python3` becomes a hard suite dependency"** (r2 F26) and **"a required plan affects every
  staging path"** (r2 F25). Both accepted and declared — in the README, in `architecture.md`, and
  in the test's own first case. `stageTree` copies `fixtures/` wholesale, which is why every
  existing path already carries a plan.
- **"`corridor` is nominal"** (r2 F29), **"rooms are rects"** (r2 F30), **"K has no cap"**
  (r2 F28), **"K is not the threshold"** (r2 F27). All true; all named in `architecture.md` with
  the row that owns each. None is fixable without changing the approved drawing or a schema §4b
  hands to row 15.
- **"The row's close condition is unstated"** (r2 F20). Not the builder's to set — the row text
  is the Navigator's. Named in the handoff.

### Round 4 (artifact critic, second pass) — what was taken and what was not

**Taken and fixed**, each verified by breaking it:

- **F1** law (b) gated on the ROOM's type, leaving every interior facing unguarded in both
  directions. The gate now runs per FACING on all 88, with `ALL_WALL_KINDS`, plus a new clause
  that an `open` facing's far line must fall outside the outline. Three red cases added, one per
  direction the critic demonstrated.
- **F2** `windows[]`, `fireplaces[]` and `floors[]` had no key whitelist. They do now; five red
  cases, including the critic's own `sprite` / `knowledge` / `takeable` / `u_px` payloads.
- **F3** about a quarter of the validator had no red case. Every one now does: **113 `push(`
  sites neutralised one at a time, 0 survivors**, verified twice (before, to reproduce the
  critic's finding; after, to prove the fix). That added ~40 mutations and a world-side table —
  the whole stairs-as-exits branch, all three arms, plus the three object warnings.
- **F4** the report's sections ran 0–7, 10, 8, 9 and almost every pointer resolved wrong. §10 is
  moved to the end so the headings are in order; every pointer corrected in `projection.md`,
  `blueprint.md`, `architecture.md` and the draft README. Two tests now hold it: `(§N)`
  self-references must resolve, and the three outliving documents' `projection.md §N` citations
  must exist, with §0's question count computed rather than typed.
- **F5** `architecture.md` stated §12.5's amendment as the single-equality draft §7 had rejected.
  Rewritten to the three clauses the blueprint carries, with the reason the equality was dropped.
- **F6** the sheet hard-coded "APPROVED 2026-08-21". The stamp is now computed from
  `design/plan-draft/approval.lock`; a sheet drawn from any other document prints UNAPPROVED
  REVISION with its hash, and `--skip-validate` prints that nothing checked it. Byte-identical
  on the approved plan, so the committed SVGs did not move.
- **F7** the top-level README's three-command recipe failed on first use. It has the
  `--rebuild-facings` step now, and says why it is not optional.
- **F8** the documented redline left the suite red with nothing saying so. The draft README now
  names the re-approval gate as a sixth, human step, in order, including how `APPROVAL_COMMIT`
  and the lock are re-anchored. The two colliding tests now derive their target from the
  document (`shiftPartyWall` finds the first party wall two rooms exactly span), and `python()`
  surfaces the script's stderr instead of "Command failed".
- **F9** a valid plan could crash the render. `STAIR_LABEL_POS` has a fallback, and artboard
  extents refuse by name (`fit_check`) instead of drawing off-canvas in silence.
- **F10** `attachment` had two homes and nothing bound them. `stagingDivergence` refuses on
  disagreement.
- **F11** degenerate geometry validated. Positive extent is required for rooms, bands, stairs,
  windows, fireplaces, footprints and doors; an `open_edge` may be flat across its own axis only.
- **F12** (half) `cameraFeetReport`'s reference was `deriveMeta("study","N")` (1.0385 m) where
  the sentence it anchors is about the shipped pixels (1.0096 m, `groundplane`'s 3.5 m fallback).
  Corrected, and the report now says which camera the number comes from.
- **F17, F18, F19** each a statement that was wrong or missing rather than a mechanism: the one
  facing where `wall_width_m` means "view" and not "wall" is now named in §4 with what it drives;
  `architecture.md` describes `rooms[].type` as what it IS (is this space outdoors) rather than
  as the facing vocabulary, and names all three vocabularies; `view_angle_deg`'s sign is stated
  in §2 against §10's `view_side`, which is its opposite by construction.
- **F20** `--no-world` called the approved plan invalid. Plan-only validation now passes and
  `planWarnings` says which check did not run; a world WITH objects and no records still refuses.

**Declined, with reasons:**

- **F12's count.** The finding's arithmetic is wrong and the numbers say so: a *smaller*
  reference gives a *smaller* limit, so the over-limit set can only grow. GREAT HALL and SOLAR
  N/S sit at 2.0106 m, below **both** limits (2×1.0096 = 2.0192; 2×1.0385 = 2.0770). The set is
  15 against either reference, and 15 is what the report and the test say. The reference number
  itself was wrong and is fixed.
- **F13's contradiction.** "`door1` is seen at 15.05° from the study and 0.00° from the hall"
  does not contradict §11 — §11 bans a MIRROR and asks for one image; two viewing angles on one
  object seen from two rooms is what a plan is for, and §2 tabulates both. The half of F13 that
  was real — the question list was prose checked against itself — is taken: the pointers are now
  mechanically checked and §0's count is computed.
- **F14** (the inversion is half-built; no meta is written anywhere). True, stated, and outside
  the fence: the row text forbids moving the shipped demo's pixels, and adopting derived meta
  moves them. This is r2 F5's decline restated with more evidence, and the unallocated adoption
  row is already named in `architecture.md` for the Navigator.
- **F15** (the gate ran on a drawing with no furniture). True. Drawing furniture changes the
  sheet Kabe approved, which needs a new gate — the thing this row is not allowed to fake. The
  one consequence a human would have caught is computed and printed instead: `planWarnings` says
  the desk stands 0.65 m² inside the study's chimney breast, and §0 carries it as question 6.
- **F16** (collinear standpoint leaders read as double-headed). A drawing change to the sheet a
  human approved, for legibility rather than truth. Recorded for the next redline.

## 10. Edges

**Must not touch:** `src/renderer.js`, `src/harness.js`, `index.html`,
`tests/playwright/walkthrough.spec.mjs`, `replicator/` (another row's builder is live in that
tree — stage by explicit path, never `git add -A`), and
`fixtures/demo-study/{world,staging,narration,viewstate}.json` and `fixture.js`. M0's baked values
and the demo's pixels do not move.

**Feels the change:** `tools/bake-fixtures.mjs` (three new refusals and a warning channel),
`design/plan-draft/` (source inverted, README brought true, `projection.md` added),
`design/architecture.md` (gains the plan-machinery section; loses the "direction of travel is
prose today" open item), `design/blueprint.md` (§4b outcome note, §12.5 amendment), `README.md`.
`tools/validate-fixtures.mjs` is untouched and unaffected — it reads named files, and the new
sibling in the fixture directory is invisible to it (F39).

**Consumed by later rows:** row 11 takes `corner_x0_px`/`corner_x1_px`, `facing_type`,
`wall_segments` and the §12.5 amendment. Row 4 takes `camera_wall_m` per facing, the wide-camera
parameters, `backdrop: "vista"`, and `view_angle_deg`. Row 15 takes the room and exit topology,
and owns the multi-standpoint schema extension §4b item 9 describes.
