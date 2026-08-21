# Row 11 — plan

Row 11 in `design/intention.md`. The target and its done live there; this file says how it gets
built, what it must not touch, and what outside it feels the change.

---

## 0. What this row inherits, and the one thing it must not re-derive

`design/architecture.md`'s *The plan machinery* says what row 11 takes from row 12:
`corner_x0_px` / `corner_x1_px`, `facing_type`, `wall_segments`, and §12.5's amended
frame-filling clause. All four come out of `tools/plan-projection.mjs`'s `deriveMeta`, which
reads `fixtures/demo-study/plan.json` — the approved drawing, as a document.

**Import, never re-derive.** The corner positions, the camera distance and the wall width are
`deriveMeta`'s output. This row adds no second arithmetic for any of them: the renderer, the
validator, the bake and the page all read one derived meta per facing. The one place a second
statement of the geometry is legitimate is the test side, where §12.5's independence rule
*requires* it — and there it is written as literals taken off `projection.md` §4's table, not as
an import.

---

## 1. The camera, and the horizon gate

Row 11's text places the corners "from camera_wall_m, wall width, and the ruled camera (eye
1.83 m)". That sentence resolves `projection.md` §7's near-miss by construction, and it is the
honest resolution rather than a widened tolerance:

Blueprint §5's camera-has-feet assertion is
`|horizon_y − (floor_line_y − eye·px_per_m_at_wall/image_h_px)| ≤ 0.02`. Grid canonical meta was
authored at eye 1.60 m and row 3 propagated Kabe's six-foot ruling into the assertion, leaving a
residual of 0.0216 against a 0.02 tolerance — failing by 0.0016, with `heights.spec` still
implementing the old 1.6 and the suite therefore green while the blueprint was not.

**The fix is to derive every meta at the ruled eye height and let `floor_line_y` follow.**
`deriveMeta` already computes `floor_line_y = horizon_y + eye·px_per_m_at_wall/image_h_px`, so at
eye 1.83 the residual is exactly 0 — not "inside tolerance", zero, because the derivation and the
gate are the same equation. `px_per_m_at_bottom` follows from §5's own horizon device:
`(image_h_px − horizon_y·image_h_px)/eye` = 290.9726775956284.

Consequences, all named rather than absorbed:

- `floor_line_y` moves 0.63 → **0.6515625** and `px_per_m_at_bottom` 332.8 → **290.9726775956284**.
  Every grid pixel moves. Licensed by the approved-drawing authority in the row text.
- The frame-bottom floor cut — the intention's *"the camera has feet"* — moves **outward**, from
  1.01 m to 1.19 m on `study/N`, because a taller *level* camera sees the floor start further
  away. The pitch that would pull it back in (§10's −8°) is unmodelled by `groundplane.js` and
  stays unmodelled here (adding a pitch term is a whole-project pixel move with no measured
  camera to aim at — §5 rules that row 4's approved backdrop is where the real camera comes
  from). This row **does not** silently improve the number by keeping `floor_line_y` at 0.63 and
  moving `horizon_y` to 0.4584 instead: `horizon_y` is the authored horizon and `floor_line_y` is
  where the wall meets the floor, which is the derived quantity. The direction of the derivation
  is row 12's and stays.
  Two facings gain feet rather than losing them: `hall/N` and `hall/S` stand 1.95 m off their
  wall, so their floor cuts at **0.64 m** — nearer than anything the demo has shown.
- `GRID_CAMERA` in `plan-projection.mjs` is derived back out of `GRID_META`, so it becomes the
  ruled camera automatically and `projection.md` §7 collapses to "grid and contract cameras now
  differ only in the unmodelled pitch". The report is generated; it regenerates.

**What this does not settle**, and is still Kabe's: the field of view. Pinning the scale at
96 px/m across standpoint distances from 1.95 m to 6.00 m means a different implied focal length
per facing (187 px on `hall/N`, 576 px on `hall/E`), and an authored `horizon_y` of 0.48 on a
frame whose centre is 0.5 implies a small per-facing pitch the model does not carry. Both are
§5's open question and `projection.md` §§5–7 carry them with numbers. This row moves neither.

---

## 2. The typed-geometry model — one drawing, three types

§5 types a facing `enclosed` (facing wall, two corners), `open` (no facing wall, ground to a far
line) or `corridor` (side planes converging, open centre). The row's promise is that open and
corridor are "a meta entry later, not a renderer rewrite". The way to keep that promise is to
stop treating them as three drawings:

> **The wall in view is a list of bands.** Corner verticals stand at every band edge. Where the
> view has no band, the ground runs past to the far line. Side-wall returns are drawn where —
> and only where — one continuous band spans the whole view, because that is what having two
> corners *means*.

- **enclosed / corridor with a continuous wall** — one band spanning the view; two corners; two
  side-wall returns. This is what M0 ships.
- **open** — zero bands; no corners; no returns; the vista band replaces the wall above the far
  line. `deriveMeta` already emits `backdrop: "vista"` and `camera_far_m` instead of
  `camera_wall_m` for these.
- **segmented** (`wall_continuous: false`) — the bands `wall_segments` names, each with its own
  two corner verticals, vista between them. Nothing in M0 ships this; the entrance approach's
  north view is the plan's one instance and it is row 15's to walk.

So there is one code path with a data-driven band list, and the type field selects data, never a
branch in the drawing algorithm. That is the checkable form of "wall-existence is not hard-wired".

**Corridor lands in M0 whether or not the row's parenthetical expects it, and this is worth
flagging to the Navigator rather than absorbing.** The row text says "M0 ships enclosed only".
Re-deriving the shipped rooms from the approved plan makes `hall/E` and `hall/W` **`corridor`**
facings — the cross passage's two ends — because that is what the drawing Kabe approved says the
hall is. `door1` stands on one of them. Under the model above that costs nothing: a corridor's
end wall is a band like any other, and what makes the view read as a corridor is arithmetic
already in the plan (2.60 m of wall at 6.00 m, so the side returns fill most of the frame). The
row's promise is *strengthened* — corridor arrives as a meta entry, exactly as promised, and the
renderer is not rewritten for it. But the row's own sentence is now false, so the blueprint and
the spec-list row say what actually ships.

---

## 3. The drawing, precisely

All of it in `src/renderer.js`, grid mode only. A real backdrop image still occludes the grid and
this row does not touch that path.

Given a resolved meta, let `pxW = px_per_m_at_wall`, `floorY = floor_line_y·image_h_px`,
`sBottom = px_per_m_at_bottom`, and `X(u, s) = groundplane.xAtScale(u, s, meta, canvasW)`.

**Regions.** For a facing with one continuous band and corners `cL = corner_x0_px`,
`cR = corner_x1_px`:

- *facing wall* — `x ∈ [cL, cR]`, `y ∈ [0, floorY]`.
- *side-wall/floor junctions* — the straight lines from `(cL, floorY)` to `(X(0, sBottom), H)`
  and from `(cR, floorY)` to `(X(1, sBottom), H)`. These are the two extreme floor longitudinals
  the grid already draws; they now carry major weight, because they are the wall-floor line of
  the side walls.
- *side walls* — everything outside the polyline {vertical at `cL` above `floorY`} ∪ {left
  junction below it}, and its mirror on the right.
- *floor* — between the junctions, below `floorY`.

**Paint.** Facing wall keeps `WALL_BASE`; the floor keeps `FLOOR_BASE` (unchanged, so §12.8's
contact-pool luminance bar is untouched); the two side walls take their own bases, the
viewer-left one darker and the viewer-right one lighter than the facing wall. That is the
one-light quality applied to the room's own geometry — with a key from upper-left, a return whose
face turns toward the key is brighter — and it is what makes a corner read even where no line
falls on it. Flat rect/path fills only, never a canvas gradient object (engine rasterisation;
the existing key falloff and the sprite painters already carry this rule).

**Lines.**
- Facing-wall metre verticals and horizontals: clipped to the facing wall, so they stop at the
  corners instead of running the width of the frame.
- **Corner verticals**: `cL` and `cR` from `y = 0` to `floorY`, at `ALPHA_MAJOR`. There is no
  ceiling to stop at — the plan carries no vertical datum (`architecture.md` names row 4 as its
  owner), so the corner runs off the top of frame, which is also what standing in a room looks
  like.
- Side-wall verticals: at each 0.5 m of depth `d ∈ (0, nearest]`, `x = X(0, scaleAtDepth(d))`,
  from `yAtDepth(d)` up to `y = 0`.
- Side-wall horizontals: straight lines through `(X(0, s), yAtScale(s) − h·s)` for each metre
  `h`, clipped to the side-wall region — they fan from the corner exactly as the floor
  longitudinals do.
- Floor longitudinals: only the metre lines inside the room (the extremes are the junctions).
  Today they fan across the whole frame, including floor the room does not have.
- Floor transverse lines: clipped to the floor region.

**The facing glyph** stays on the facing wall and must now also stay *between the corners*. The
existing dodge (left of an opening, else right) cannot satisfy that on `hall/W`, where a 1.0 m
door sits in the middle of a 2.60 m wall: both dodges land outside the corner. So the candidate
order becomes left-of-opening → right-of-opening → **above the opening**, and a candidate is
taken only if its rect lies inside the band and clears every opening. `hall/W` takes the third.

**Fallback (`GRID_META`, corners null).** A facing the plan does not hold keeps today's drawing —
endless wall, no corners, no returns — because a room whose extent is unknown must not claim two
corners. This is the honest state of unestablished space, and it is the only path in which the
16.0 m `wall_width_m` survives.

---

## 4. `groundplane.js` — the corner-bounded u-domain

Three changes, all small, all in the one home of §4/§5 placement:

1. **`u` spans corner to corner where corners exist.** `xAtScale` currently reads
   `canvasW/2 + (u − 0.5)·wall_width_m·s`. It becomes
   `wallCentrePx(meta, canvasW) + (u − 0.5)·wallSpanPxAtWall(meta)·(s / px_per_m_at_wall)`, where
   the centre and span come from the corners when the meta carries them, from `wall_x0_px` when
   §5's uncentred-wall extension point is used, and from `canvasW/2` + `wall_width_m·px_per_m_at_wall`
   otherwise. **On every meta this project can currently produce the value is identical** — the
   corners are `xAtScale(0)` and `xAtScale(1)` at wall scale by construction — so this moves no
   pixel by itself; what it buys is that the u-domain and the corner verticals are the same
   arithmetic rather than two that agree today. Row 2 paid twice for the other shape, and row 12's
   critic caught it a third time in `deriveMeta`.
2. **The depth anchor is typed.** `scaleAtDepth` reads `meta.camera_wall_m ?? CAMERA_WALL_M`, so
   an open facing's meta — which deliberately carries no `camera_wall_m` — silently gets 3.5 m,
   which in a 20.4 m courtyard is nonsense (`architecture.md` names this trap). It becomes
   `camera_wall_m ?? camera_far_m ?? CAMERA_WALL_M`: for an open facing the far line *is* the
   depth anchor, which is exactly what makes the same drawing code work for it.
3. **`uDomain(meta, s, canvasW)`** is exported: `{ x0, x1 }`, the room's own wall at that scale.
   The renderer clips with it, the validator checks placements against it, and `deriveMeta` keeps
   calling `xAtScale` as it already does.

`placeHost` is unchanged in shape; its `baseX` moves only because the meta it is handed moved.

---

## 5. The meta schema, and what the validator now refuses

`tools/validate-fixtures.mjs` gains a meta-schema arm and three wall-existence clauses. Each one
is written so that breaking it goes red on that clause alone (`architecture.md`'s clause-ledger
rule, brought over from the replicator).

**Schema (every meta the fixture resolves, derived or measured):**
- `facing_type ∈ {enclosed, open, corridor}` — required.
- `enclosed`/`corridor` carry `camera_wall_m > 0` and no `camera_far_m`; `open` carries
  `camera_far_m > 0` and **no** `camera_wall_m` (the different name is the mechanism — a missing
  field with a fallback is invisible, a differently-named one forces the consumer to handle it).
- `corner_x0_px` and `corner_x1_px` are both null or both numbers with `x0 < x1`.
- §12.5 clause **(i)**: `0 ≤ corner_x0_px` and `corner_x1_px ≤ canvas width` — the canvas is the
  thing outside every meta, so this is where the old `px_per_m_at_wall × wall_width_m ≈ canvas
  width` clause's reach survives. Clause (ii) is row 4's, on a measured backdrop; clause (iii)
  says (ii) holds by construction on a synthesized one. All three go into blueprint §12.5 beside
  the clause they replace, as `architecture.md` already drafted them.
- `wall_continuous: false` ⇒ corners null and `wall_segments` non-empty; `open` ⇒ corners null,
  `wall_segments` empty, `backdrop: "vista"`.

**Wall existence, against staging** — "staging never addresses wall that does not exist":
- A `wall_mounted` placement on an `open` facing is a finding. You cannot hang a door on a
  horizon.
- A `wall_mounted` placement's projected x-span must lie inside a wall band (inside the corners
  where the wall is continuous; inside a named segment where it is not).
- **Every directly-staged placement's footprint x-span lies inside the room at its own scale** —
  `uDomain(meta, place.s)`. A floor object standing past the side wall is outside the room, and
  today nothing sees it: `u ∈ [0,1]` plus "the rect intersects the canvas" was the whole net, and
  both were satisfied by a 16 m wall nobody had.

**Meta resolution has one home and three tiers**, used identically by the renderer (through the
baked metas), the page, the validator and the bake: a measured `backdrops/<loc>/<facing>.meta.json`
if one exists → the plan's `deriveMeta` if the plan holds the room → `GRID_META`. The
unreadable-meta finding row 2 wrote stays where it is.

---

## 6. The bake, the fixture, and the staging adoption

- `tools/bake-fixtures.mjs` computes the derived meta for every `location/facing` the world names
  and the plan holds, and emits them into `fixture.js` as `window.HOLO_FIXTURE.metas`. The bake
  stays byte-deterministic (a pure function of `plan.json` + the world). `plan.json` itself stays
  unbaked — the page still does not read it. The fingerprint's input gains the metas, so a plan
  edit that changes geometry moves the fingerprint, which it should.
- `index.html` builds its `backdrops` map from `metas` as `{ meta }` entries with no `image`.
  The renderer's existing resolution (`entry.meta ?? GRID_META`) and `metaFor` already do the
  right thing, so this is wiring, not a renderer change. Row 4's images drop into the same map.
- **`fixtures/demo-study/staging.json` adopts the projected spatial values.** This is what
  `blueprint` §4b asks for ("hand-authored staging spatial values become generated ones") and
  what row 12 deliberately deferred to the row that could absorb a pixel move. Under the new
  metas: `desk1` u 0.479 → 0.4383, `chair1` 0.5052 → 0.5153, `shelf1` 0.4475 → 0.3950,
  `stick1` 0.4632 → 0.4264, `door1@hall/W` unchanged at 0.5, and **`door1@study/E` 0.5 → 0.7292**
  — the ~1.1 m re-siting the approved drawing calls for. `depth_m` values are already the plan's.
  `KNOWN_DIVERGENCES` in `plan-projection.mjs` empties, and the bake's own "listed as a known
  divergence but now agrees" refusal is what forces that in the same commit.
- `stagingDivergence`'s default meta becomes per-facing (`metaForFacing`), replacing
  `shippedMeta()`. Zero divergences after adoption, on every row of the table — and the report
  says, as it already does, which of those agreements are definitional and which carry
  information. Only `door1@study/E` ever carried information, and it now agrees because the
  staging moved to the drawing, not because the drawing moved.

Composition consequences to look at rather than assume: `stick1` grows 28 % (67 → 86 px) and
`shelf1` 8 %, because `hall/N`'s camera is 1.95 m rather than the fallback 3.5 m. The
`stick1`×`shelf1` and `chair1`×`desk1` overlap pairs must still intersect in **opaque** pixels
(§12.8) and must still read as column-before-building rather than as a base plate inside a
plinth (§4's own license, and the reason `stick1` sits at 0.75). If the pair degrades, the fix is
`stick1`'s plan footprint — a plan edit is a redline with a regeneration step and an approval
lock, so it is a fork for the Navigator, not something this row does quietly.

---

## 7. Tests

Every existing check that encoded the endless wall moves. The rule from `architecture.md` holds
throughout: **a guard that stays green when what it guards is deleted is a finding**, and every
new clause below is written by breaking the mechanism and watching it go red.

- **`helpers.mjs` `LIT`/`MATH` become per-facing.** `LIT.facing(loc, f)` returns the literals for
  that facing — `wall_width_m` and `camera_wall_m` written out from `projection.md` §4's table,
  plus the shared eye 1.83, horizon 0.48, 96 px/m, 1536×1024. Still §12.5-independent: literals,
  never an import, and now literals of the *drawing* rather than of one global wall.
- **`geometry.spec`**: the horizon clause runs at 1.83 and must be exact, not merely inside
  tolerance; the frame-filling test becomes §12.5's three clauses; the grid scans gain corner
  positions and the side-wall junctions, measured off rendered pixels against test-side
  arithmetic; the "documents state the shipped meta" test covers the new fields.
- **`heights.spec`**: every literal moves; the census keeps its six entities; the horizon-device
  clause on feet runs per facing.
- **New (`geometry.spec`)**: *the room reads as a room* — corner verticals present at
  `corner_x0_px`/`corner_x1_px` ± 1 px on all four study facings and all four hall facings, the
  facing-wall grid stopping at them, and the side-wall junction lines running to the frame edge
  or bottom where the arithmetic says. And *the corners move with the plan*: a doctored plan with
  a wider study puts them where the wider room says, so the test cannot pass on a hard-coded pair.
- **New (`geometry.spec`)**: *typed geometry is data, not a branch* — a synthesized `open` meta
  (`deriveMeta` on `entrance_court/S`) and a synthesized segmented meta (`entrance_approach/N`)
  both render without a facing wall and without inventing one, through the shipped renderer. This
  is the check that makes "open and corridor are a meta entry, not a renderer rewrite" a fact
  rather than a claim.
- **`validator.spec`**: one red case per new clause, each failing on that clause alone.
- **`mechanisms.spec`**: overlap pairs, tint/shadow/part switches, doorway derivation and the
  two-door-facings-differ clause all re-run on the new geometry; the opaque-overlap thresholds
  are unchanged and must still pass on the moved placements.
- **`plan.spec`**: `GRID_CAMERA` is now the ruled camera; `assertCameraConsistent` still green;
  the derived-render byte-identity against the approval commit is **untouched**, because
  `plan.json` does not change — that is the reason this row re-derives instead of redlining.
- **`determinism` / `walkthrough` / `isolation` / `knowledge` / `voice` / `shell` / `keyboard` /
  `fullscreen`**: no literal changes expected beyond any that encode canvas geometry; all must be
  green on both engines. §12.2's within-run identity and §12.8's mechanism clauses are the two
  the row's done names, and both are re-run rather than re-derived.
- The suite carries no stored goldens, so no hash literal exists to update — but the row moves
  the canvas, so the **cross-commit canvas check** `architecture.md` lists as an open limit is
  done by hand at this close (capture the hash sequence at the parent commit and after, and
  report that every changed frame is a changed frame *on purpose*).

---

## 8. Documents brought true in the same change

- **`design/blueprint.md`** — §5's corner/type paragraph gains what was built (the band model,
  the typed depth anchor, the schema fields and their required/forbidden pairings); §7's
  grid-canonical amendment restates `GRID_META` at the ruled camera with its new fields and says
  it is now the *unplanned-facing fallback*, not the geometry of the shipped rooms; §12.5 carries
  clauses (i)/(ii)/(iii) in place of the frame-filling equality; §5's row-2 note says which of its
  example numbers the shipped rooms now use (none — they are measured off the plan).
- **`design/architecture.md`** — the grid-drawing internals, the corner-bounded u-domain, the
  meta-resolution tiers, the staging adoption and what it cost, the corridor arrival, and the
  updated open-limits list (the horizon-gate inconsistency it records as live is closed by this
  row and the entry says so).
- **`design/plan-draft/projection.md`** — regenerated; §0's question 1, §5, §6 and §7 change
  because the camera did.
- **`README.md`** — checked; it describes what the demo is and the one command, and gains nothing
  unless a sentence about the picture has become false.
- **`design/intention.md`** — row 11 deleted, in the state-only closing commit, per *How we work*.

---

## 9. Edges — what this row must not touch

- `replicator/`, `backdrops/`, `library-src/`, `library/` — other seats' lanes and other rows'
  work. The asset seat's mailbox is not this row's to write to.
- **`fixtures/demo-study/plan.json` is not edited.** The approval lock and `plan.spec`'s
  byte-identity against the approval commit are what make the drawing an approved artifact; this
  row consumes it and never redlines it. If the geometry it produces is wrong, that is a fork for
  the Navigator and a redline with its own regeneration step, not an edit here.
- `world.json` gains nothing — no coordinate has ever lived there and none arrives now. The plan
  is presentation-side and stays so.
- No other spec row's work: rows 4, 9, 14, 15, 16, 17 are untouched. Row 15 inherits the walkable
  manor; row 4 inherits the measured half of the corner fields and clause (ii).
- No chrome, no narration, no new surface string — `design/surface-strings.md` should need no
  entry, and if the row somehow produces one, it is extended in the same commit or `voice.spec`
  is red.
- Nothing is pushed.

## 10. What outside this row feels the change

- **Row 4** — its eight measured metas inherit the schema, clause (ii), and the corner fields; its
  prompt sheets now have `camera_wall_m`, the wall width and the corner positions per facing
  rather than a 16 m wall; and the wall-return device Kabe asked for at the frame edges
  ("the beginnings of the adjacent walls") is now what the grid already draws, so the two agree.
- **Row 15** — the manor walks on this row's typed drawing; every unestablished room renders from
  its own derived meta.
- **Row 5's §12.6 batch** — every capture in it moves. The batch for this row goes to
  `design/batches/row11-corners/` before the close.
- **The public link** — the demo's rooms stop being an endless wall. `design/playbook.md` §3.4
  makes that a human-gate class of change; the row's done clause as written does not carry the
  screenshot condition, and the Navigator's handoff rules the batch delivery rather than a gate.
  That disagreement is named here rather than resolved by an agent, and it is in the closing
  report.
