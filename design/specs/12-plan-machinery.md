# Row 12 — the manor plan machinery

Plan for spec-list row 12. The target and its done clause live in the spec list; nothing is
copied here.

Ground truth for everything below is `design/plan-draft/` as approved by Kabe on 2026-08-21
(blueprint §4b's approval note, four rulings). `draw_plan.py`'s metre literals are the source of
every number; none is re-invented here.

---

## 1. What inverts

Blueprint §4b shape item 10 inverts the artifact order: **`plan.json` becomes the source and the
schematic becomes a derived render.** So the row has four pieces and one acceptance:

| piece | file |
|---|---|
| the document | `fixtures/demo-study/plan.json` |
| the validator | `tools/validate-plan.mjs` (pure `validatePlan` + thin CLI), called by the bake |
| the projection | `tools/plan-projection.mjs` (pure functions + thin CLI), through `src/groundplane.js` |
| the derived render | `design/plan-draft/draw_plan.py`, reading `plan.json`, byte-identical output |

**The acceptance:** the derived render of `plan.json` byte-equals the SVGs and the TSV Kabe
approved. If a single byte moves, the extraction lost something.

---

## 2. `fixtures/demo-study/plan.json`

### 2.1 How it is populated

Mechanically, by a throwaway extraction script that imports `draw_plan.py` and writes its own
literals out as JSON at full double precision (Python `json.dump` round-trips a double exactly, so
the derived render reads back the identical values and formats them identically). The extraction
script is **not committed** — it is scaffolding, and the proof that it was faithful is the
byte-identical render, not a second copy of the numbers.

Object footprints are the one thing `draw_plan.py` does not hold. They are **inverse-projected
from the shipped `staging.json` through `src/groundplane.js`'s own u-mapping** (§4.3 below), which
is mechanical from two committed artifacts and invents nothing. Where that route and the drawing
disagree — `door1` — **the drawing wins**, because the drawing is what Kabe approved.

### 2.2 Shape

```jsonc
{
  "schema": "holo-emitter-plan/0.1",
  "version": 1,                      // shape item 11's version stamp
  "units": "m",
  "north": "+y",                     // the drawing's convention, stated once
  "standpoint_stand_back": 0.25,     // draw_plan.py's K — law (a)'s one rule, one home
  "wall_thickness": { "exterior": 0.6, "interior": 0.35, "garden": 0.45 },
  "outline": [[0,0], …],             // law (b): the one exterior outline
  "floors": [ { "id": "ground", "level": 0 }, { "id": "upper", "level": 1 } ],
  "wall_bands": [ { "id": "W0", "kind": "exterior", "floors": ["ground","upper"],
                    "rect": {…} }, … ],
  "rooms": [
    { "id": "study", "floor": "ground", "name": "STUDY", "type": "enclosed",
      "rect": { "x0": 24.95, "x1": 30.4, "y0": 9.6, "y1": 14.4 },
      "facings": {
        "N": { "type": "enclosed", "standpoint": { "x": 27.675, "y": 10.8 },
               "wall_line": 14.4, "camera_wall_m": 3.6, "wall_width_m": 5.45,
               "note": "" }, … } } ],
  "openings": [
    { "id": "op_study_hall", "kind": "door", "floor": "ground", "axis": "EW",
      "rect": {…}, "joins": ["study","hall"], "entity": "door1" }, … ],
  "windows":    [ { "floor": "ground", "rect": {…} }, … ],
  "fireplaces": [ { "floor": "ground", "room": "study", "rect": {…} }, … ],
  "stairs": [ { "id": "great_stair", "kind": "straight", "treads": 17,
                "rect": {…}, "joins": ["great_stair_hall","stair_landing"],
                "up": "N" }, … ],
  "objects": [ { "id": "desk1", "floor": "ground", "room": "study",
                 "x": 27.339, "y": 13.85, "attachment": "floor_against",
                 "source": "inverse-projected from staging.json" }, … ]
}
```

Room ids: `study` and `hall` are the two M0 rooms (the STUDY and the CROSS PASSAGE), so
`world.json`'s location ids resolve straight into the plan. The other twenty rooms take slugs of
their drawn names.

### 2.3 What does **not** go in

The truth/presentation split governs here too, one level up: `plan.json` is the spatial document;
`draw_plan.py` keeps everything that is about the *picture* — label nudges (`lnudge`, `lnudgex`,
`lone`, `lab`), colours, stroke weights, hatch patterns, artboard extents and margins, titles,
legend copy, the ★ marker's hand-placed position, the per-artboard footnotes. A number that
changes where a *room* is goes in the plan; a number that changes where a *label* is does not.
And `world.json` gains nothing: the plan is presentation-side, so truth still holds no coordinate.

### 2.4 The one correction the extraction makes

`DOORS_U`'s last entry — the opening in the W2 band at y 11.0–12.0 — is labelled *Solar ↔ Long
Gallery* and geometrically joins **Muniment Room ↔ Long Gallery** (the Solar's east wall is at
x 24.6; this opening is at x 30.4). The two names are never drawn — `draw_plan.py` uses them only
in its own reachability check — so the corrected `joins` changes **no pixel** of the approved
drawing, and the byte-identity acceptance still holds. Recorded as an [AI] correction of a
non-visible datum, named in the final report; the promoted validator is what found it, on its
first run.

Everything else in the drawing checks clean: all 25 openings sit inside a wall band, all 24+29
windows sit inside a wall band, every one of the 11 fireplaces lies inside exactly one room, and
every upper fireplace stands on a ground one.

---

## 3. `tools/validate-plan.mjs` — the standing validator

ESM, exports `validatePlan(plan, world?)` → array of finding strings (empty = pass); thin CLI
prints numbered findings and exits 1 — the shape `tools/validate-fixtures.mjs` already uses, and
the shape blueprint §4b rule 1 requires (importable pure function, CLI a wrapper, so live mode is
a transport change).

**Wired into the bake's refusal path** exactly like the fixture validator: `tools/bake-fixtures.mjs`
reads `<fixtureDir>/plan.json` when it exists, runs `validatePlan(plan, world)`, and refuses to
bake on any finding. `plan.json` is **not** added to the baked `FILES` list — the page does not
read the plan at M0, and adding it would move `fixture.js`'s bytes and its fingerprint, which the
row forbids.

### 3.1 The five promoted checks (`draw_plan.py`'s self-checks, become law)

1. **Tiling** — per floor, the enclosed rooms plus the interior partitions equal the interior
   gross area exactly (west wing 8.8 × 24.3 + east wing 8.0 × 24.3 + central range 20.4 × 9.3),
   to 1e-9. The gross figure is derived from the wall bands in-document, not typed.
2. **Overlap** — no two non-open rooms on a floor share area.
3. **Every door joins two spaces** — and, strengthened, joins *the two it names*: each opening's
   rect lies inside a wall band (an `open_edge` excepted), and the rooms geometrically abutting
   its two sides are exactly its `joins`. `draw_plan.py` only checked that the names matched
   *some* room, which is why the mislabelled upper door survived approval.
4. **Reachability** — every room on both floors is reachable on foot from `entrance_approach`,
   through openings, open edges and stairs. All three edge kinds are in-document, so the
   hand-added adjacency `draw_plan.py` patched in at check time disappears.
5. **Standpoint-distance derivability** — every stored standpoint and `camera_wall_m` recomputes
   from the room rect, `standpoint_stand_back`, and the facing's wall line, to 1e-9. This is law
   (a) made mechanical: nothing downstream may invent a `camera_wall_m`, and nothing upstream may
   type one that the geometry does not produce.

### 3.2 Licensed strengthenings, each with its reason

- **Carriers lie in walls** — every window rect inside a wall band with at least one interior side
  on its floor; every fireplace rect inside exactly one room. A window floating in a room is a
  wall map that will be prompted into a backdrop at row 4.
- **Stack continuity** — every upper fireplace stands on a ground one. The drawing's own README
  asserts this in prose; a sentence a check can hold true should be held true.
- **Facing-type vocabulary** — `enclosed | open | corridor` by name, per room and per facing; an
  `open` facing must carry a far line, an `enclosed` facing must not.
- **Ids unique** across rooms, openings and stairs (the fixture validator paid for this one).

### 3.3 The world cross-check (`validatePlan(plan, world)`)

Closes a named open item in `design/architecture.md`: *"'direction of travel' is prose today —
nothing yet checks that the hall actually lies east of the study in any geometric sense."*

- every `world.locations[].id` resolves to a plan room, and its `facings` are a subset of the
  plan room's facings;
- every exit's `via` entity resolves to a plan opening whose `joins` is exactly
  `{exit.from, exit.to}`;
- `exit.facing` is the compass direction from the `from` room's centre toward that opening —
  so the study's exit is E because the passage really is east of it;
- `exit.arrive_facing === exit.facing` — blueprint §3's orientation law, now geometric rather
  than prose.

---

## 4. `tools/plan-projection.mjs` — the projection

ESM, pure functions, thin CLI. Imports `src/groundplane.js` and `src/renderer.js`'s `GRID_META`
through their UMD guards via `createRequire` — **imported, never re-derived**, the rule row 2
already paid for.

### 4.1 `deriveMeta(plan, roomId, facing, { camera })` → the §5 meta geometry fields

One camera, stated once, with no invented constant — every input is read off grid-canonical meta
or off the drawing:

```
EYE_M            = (GRID_META.floor_line_y − GRID_META.horizon_y) · image_h_px / px_per_m_at_wall
                                                                              // = 1.6 m
camera_wall_m    = the facing's drawn standpoint distance          // law (a): read off the drawing
wall_width_m     = the facing's drawn wall width
px_per_m_at_wall = PINNED (GRID_META's 96)      … enclosed rooms, and any facing that fits
                 = CANVAS_W / wall_width_m      … the wide-view camera (§4.2)
floor_line_y     = horizon_y + EYE_M · px_per_m_at_wall / image_h_px
px_per_m_at_bottom = (image_h_px − horizon_y · image_h_px) / EYE_M            // the horizon device
corner_x0/x1_px  = CANVAS_W/2 ∓ (wall_width_m / 2) · px_per_m_at_wall         // null on open facings
```

Self-check that makes this trustworthy rather than plausible: fed the pinned camera, `deriveMeta`
reproduces grid-canonical meta exactly — `floor_line_y` 0.63, `px_per_m_at_bottom` 332.8,
`horizon_y` 0.48 — which is why the eye height is *derived from* `GRID_META` instead of typed.

### 4.2 The wide-view camera, under the standing license [AI]

Kabe's ruling (3): *open and corridor deep-views take their own wider camera, enclosed flat views
keep the pinned frame.* At the pinned 96 px/m a 1536 px frame holds exactly 16.0 m of wall.
Applied where the type demands and nowhere else:

> A facing takes the wider camera when its room's type is `open` or `corridor` **and** its
> `wall_width_m` exceeds the 16.0 m the pinned frame holds. Its `px_per_m_at_wall` becomes
> `CANVAS_W / wall_width_m`, so the drawn wall exactly fills the frame; everything else follows
> from the formulas above. Every `enclosed`-type room keeps the pinned frame.

The two halves of the trigger never conflict on this plan, and that is worth stating: **every
facing on the manor wider than 16.0 m belongs to an open- or corridor-type room** — entrance
court and privy garden (20.40), long gallery (24.30), entrance approach (32.00 and 20.00). No
enclosed room ever asks for it. Ten facings take it; the other seventy-eight keep the pinned frame.

Residue to name rather than decide (it is §5's open field-of-view question, and Kabe's):
`px_per_m_at_wall × camera_wall_m` is the implied focal length, and it differs per facing under a
pinned *scale* — 336 px pinned, 508 px on the entrance court's north view. The pinned frame is a
pinned scale, not a pinned lens. Nothing in this row decides that.

### 4.3 `projectPlacement(plan, objectId, roomId, facing, meta)` → `{ u, depth_m, … }`

The plan holds an object's ground-contact centre in metres. For facing *F*, screen-right is the
world direction 90° clockwise from *F* (`right(N)=+x, right(E)=−y, right(S)=−x, right(W)=+y`), and
the viewed wall line is the facing's own.

```
depth_m = signed distance from the wall line to the object, toward the camera
u       = solved through groundplane.xAtScale, not by a private formula:
            s       = groundplane.scaleAtDepth(depth_m, meta)
            centre  = groundplane.xAtScale(0.5, s, meta, CANVAS_W)
            targetX = centre + offset_m · s
            x0, x1  = groundplane.xAtScale(0, …), groundplane.xAtScale(1, …)
            u       = (targetX − x0) / (x1 − x0)
```

Every screen quantity flows through `groundplane`. That is the point: displace
`groundplane.xAtScale` at runtime and the projected `u` has to move, the same binding
`validator.spec` already enforces on `placeHost` — and a test does exactly that (§6). The
projection also returns the full `groundplane.placeHost` result for the object, so the pixel layer
is imported whole.

`floor_against` placements carry no `depth_m` in staging; the projection reports the plan-measured
wall distance and flags a mismatch against the record's `dims_m.d` — an object recorded as against
the wall has to be sited at its own depth from it.

### 4.4 Reproduction, honestly

The row's done clause licenses either an exact reproduction or a committed diff table. **The
expected verdict is the diff table**, and the reason has to be stated plainly or the round-trip
looks like evidence it is not:

- The four free-standing objects (`desk1`, `chair1`, `shelf1`, `stick1`) were inverse-projected
  from the shipped staging, so their reproduction under grid-canonical meta is **definitional**.
  The test that asserts it is a *binding guard* — it catches a later edit to either side — not
  evidence about the plan.
- `door1` comes from the drawing independently. On `hall/W` it reproduces the shipped `u` of 0.5
  exactly: the approved opening is dead centre of the cross passage's west wall. On `study/E` it
  does not — the drawing sites it 1.1 m south of the study's east-wall centre, where the staging
  centres it.
- Under the **plan's own** meta (real wall widths instead of grid-canonical 16.0 m) every `u`
  moves, because `u` spans `wall_width_m`. The metre offsets from the wall centre are preserved
  exactly; only the denominator changes.

The table goes to `design/plan-draft/projection.md`, generated by the CLI and byte-compared by a
staleness test, so it cannot go stale the way a hand-written table would.

**Nothing in `fixtures/demo-study/staging.json` changes.** The shipped demo's pixels are pinned;
the projection is a second opinion this row writes down, not a rewrite of the first.

### 4.5 One thing the plan makes visible that nothing could see before

Sited in plan metres, `desk1`'s footprint (x 26.69–27.99, y 13.85–14.40) overlaps the study's
chimney breast (x 26.60–28.80, y 13.90–14.40): the desk stands in the fireplace. It is invisible
at V1 because the grid draws no hearth. Reported, not fixed — moving it would change the shipped
demo's pixels, which this row must not do. It belongs to row 4's prompt sheets and row 15.

---

## 5. `design/plan-draft/draw_plan.py` — the derived render

Same file, same output, different input: the metre literals are replaced by a read of
`fixtures/demo-study/plan.json` (`--plan PATH` to override). Drawing order is preserved by
preserving array order in the document, since SVG element order is byte-visible.

`render.sh` is unchanged; the PNGs are regenerated and committed.

The self-checks at the bottom of `draw_plan.py` are **deleted** rather than kept — they have been
promoted to `tools/validate-plan.mjs`, and two copies of a check is exactly the second home this
project refuses. The script instead calls the validator (`node tools/validate-plan.mjs`) and
refuses to draw an invalid plan, so a redline still cannot silently break the plan; if Node is
absent it says so and refuses rather than drawing unchecked.

`design/plan-draft/README.md` is brought true: it describes the drawing as derived, points the
redline route at `plan.json`, and its four open questions become the four rulings' answers.

---

## 6. Tests — `tests/playwright/plan.spec.mjs`

Pure-Node specs in the Playwright runner, the way `fixtures.spec.mjs` and `validator.spec.mjs`
already are. Every guard below was written to be verified by breaking what it guards.

1. **Validator green** on the committed plan, and green through the CLI.
2. **Red per mutation class**, one case per check in §3.1 and §3.2: overlapping rooms; a room
   resized so tiling fails; an opening repointed to a room it does not touch; an opening moved out
   of its wall band; a door deleted so a room is unreachable; a perturbed `camera_wall_m`; a
   moved standpoint; a window floating in a room; an upper fireplace with no stack under it; a
   duplicate id; an `open` facing with no far line.
3. **Bake refusal** — a staged tree whose `plan.json` is invalid makes `tools/bake-fixtures.mjs`
   exit non-zero, and `fixture.js` is not written.
4. **Derived-render staleness** — `draw_plan.py` into a scratch directory; the two SVGs and the
   TSV byte-equal the committed files.
5. **The approved drawing is pinned by hash** — SHA-256 literals for the two SVGs, recorded with
   the commit that carried Kabe's approval. The project's "no hash literals" rule is about
   *canvas* hashes across engines; a file on disk has no engine, and this is the one assertion
   that ties the derived render to the artifact a human actually looked at.
6. **PNG shape** — each PNG is exactly 2× its SVG artboard. Byte-comparing the PNGs is
   deliberately *not* done: they are rasterised by the system Chrome, so their bytes are
   environment-dependent (they are byte-stable on this machine and that is recorded, not
   asserted). The SVG is the guarded derived artifact; the PNG is its picture.
7. **Meta geometry by independent arithmetic** — test-side literals only, per §12.5's
   independence rule: `study/N` (3.60 / 5.45 / 96 / 0.63 / corners 506.4 and 1029.6),
   `entrance_court/N` (wide: 1536/20.4, its own floor line, corners at 0 and 1536),
   `long_gallery/E` (wide), `cross_passage/E` (corridor, deep, still pinned). Plus:
   `deriveMeta` on a pinned facing equals `GRID_META`'s geometry fields.
8. **Projection round-trip** — the five placements that reproduce, at the exact shipped values;
   `door1`/`study/E` asserted at its differing value, so the diff cannot drift silently.
9. **Import binding** — displace `groundplane.xAtScale` at runtime and require the projected `u`
   to move; displace `placeHost` and require the projected pixels to move. A projection that
   re-derived the math would stay green.
10. **Projection report freshness** — the CLI's output byte-equals `design/plan-draft/projection.md`.
11. **Plan ↔ world agreement** — `validatePlan(plan, world)` green on the repo pair, and red when
    an exit's `arrive_facing` is flipped, when an exit's `facing` disagrees with the plan geometry,
    and when `via` names an opening joining other rooms.
12. **Shipped fixture untouched** — `fixture.js` byte-equals its committed self after a fresh bake
    (the existing staleness test already does this; the new plan step must not disturb it).

---

## 7. Edges

**Must not touch:** `src/renderer.js`, `src/harness.js`, `index.html`, `tests/playwright/walkthrough.spec.mjs`,
`replicator/` (another row's builder is live in that tree — this row stages by explicit path and
never `git add -A`), `fixtures/demo-study/{world,staging,narration,viewstate}.json`, and
`fixtures/demo-study/fixture.js`. M0's baked values and the demo's pixels do not move in this row.

**Feels the change:** `tools/bake-fixtures.mjs` (one new refusal), `design/plan-draft/` (source
inverted, README brought true), `design/architecture.md` (gains the plan-machinery section; loses
the "direction of travel is prose today" open item), `README.md` (the plan is a thing a stranger
can now regenerate).

**Consumed by later rows, so the seams are named here:** row 11 takes `corner_x0_px`/`corner_x1_px`
and the facing type field, and inherits the tension that §12.5's `px_per_m_at_wall × wall_width_m ≈
canvas width` clause is a grid-canonical property — true only while the wall fills the frame, and
false the moment a real 5.45 m wall does not. Row 4 takes `camera_wall_m` per facing and the
wide-camera parameters. Row 15 takes the room/exit topology.
