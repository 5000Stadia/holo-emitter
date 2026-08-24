# Row 36 — Assembly from established pieces

Row 36 of `design/intention.md`. The target and its done clauses live there; this spec carries the
library's shape, the composition engine, the packet types the emitter gains, the numbers the four
orphaned t4 returns produced when they were finally scored, the validation that is real versus the
validation that is trivial, and the interfaces to rows 37, 35 and 25 — spec'd, not built.

**Status: PLAN ONLY. Nothing built, nothing dispatched, nothing promoted.**

---

## 0. What reshaped this plan while it was being written

Four Captain rulings landed mid-plan. Each is a section below rather than a rewrite, but two of them
move the row's foundation and the plan says so up front:

1. **Row 37, light as a layer** — pieces are NEUTRAL ALBEDO; illumination is a runtime pass. The
   library's *form* changes (§1.5) and the whole light-continuity problem I was going to solve leaves
   this row (§2.6, §6.1).
2. **Row 37's full model — carriers leave the backdrop.** Windows, fireplaces, candle-holders and
   exterior doors become library sprites placed by the plan. Walls paint PLAIN. This is the single
   biggest change to the arithmetic (§8) and it is what makes the row's headline claim true rather
   than optimistic.
3. **The bottom-of-frame smear** — measured in §3.3; the diagnosis I was handed is confirmed for
   exactly 2 of 54 walls and the mechanism the Captain most likely saw is a different one, named
   with its line number.
4. Row 36's own second motivation (per-room style incoherence) is quantified in §5.2.

---

## 1. THE TEXTURE LIBRARY

### 1.1 What a texture is

**An orthographic tile in surface-metre coordinates, plus a manifest record.** Not a crop of a
painting — a rectified patch of one physical surface, stored so that "how many pixels is a metre of
this material" is a number, and so that any view of that material can be drawn by sampling it.

This is `row35_snap.py` run backward and it reuses that file's own math with no second copy. The snap
maps *target image → surface parameters → source image*. Harvest stops at the middle:
*surface metres → surface parameters → source image*. The same `region_matrix`, the same five
`REGIONS`, the same `image()`/`params()`.

I confirmed the mapping empirically before planning against it (a scratch probe on a representative
declared facing: 4.5 m wall, 2.8 m storey, camera 4.0 m, eye 1.183 m, 240 px/m):

| region | surface parameters | metres recovered | pixels of frame |
|---|---|---|---|
| `wall` | `(u, h)` | u 0…4.500 across, h 0…2.800 up | 726,432 |
| `floor` | `(u, t)` | u 0…4.500, depth-from-wall 0…1.182 m | 156,794 |
| `ceiling` | `(u, t)` | u 0…4.500, depth-from-wall 0…1.496 m | 319,183 |
| `left` / `right` | `(h, t)` | depth-from-wall 0…1.188 m, h 0…2.800 | 185,705 / 184,750 |

Zero unplaced pixels. **The visible floor and returns are shallow** — about 1.2 m out from the wall
before the frame runs out — which bounds how much material any one facing actually demands and is
why re-projection costs so little (§2.3).

### 1.2 Typed by the room voice's own material string

`tools/room-voices.mjs` already declares, per voice, the exact material of `walls`, `ceiling` and
`floor`. That string **is** the type key. Counted across every facing this plan reaches (script:
resolve `voiceFor` for all 88 facings, collect distinct slot strings):

| slot | distinct materials |
|---|---|
| walls | 12 |
| ceiling | 8 (two voices are outdoor and carry `ceiling: null`) |
| floor | 12 |
| **total** | **32** |

**Thirty-two surface materials cover the entire twenty-two-room manor.** All 14 voices are reached;
none falls through a fallback.

**28 of the 32 have at least one already-promoted wall to harvest from.** The four that do not are
`cross_passage`'s walls, ceiling and floor, and `hall_state`'s floor — because `hall` and
`great_hall` have zero promoted facings between them. Those four are the swatch ask (§1.6).

Typed id: `<slot>/<voice-family-slug>` — e.g. `floor/wide-worn-oak-floorboards`,
`ceiling/aged-parchment-plaster`, `wall/dark-hand-finished-oak-panelling`. The slug is derived from
the material string by a pure function, never typed, so two voices sharing a string share a texture
by construction (which is exactly why `parlour_wainscot` and `parlour_armorial` collapse to one).

### 1.3 Where the table lives, and why it is not a new file

`MATERIALS` is a **new export of `tools/room-voices.mjs`**, keyed by the material string, carrying
what a voice's prose cannot: `{ id, slot, tiling, harvest }`. No existing voice field changes, so
`room-voices.spec.mjs` stays green untouched.

- **Completeness is derived, not typed** (the felt lesson of row 11): a test walks `VOICES` and
  asserts every non-null `walls`/`ceiling`/`floor` string has a `MATERIALS` entry. A future map that
  invents a room type must add a voice, and the moment it does, the test demands its material record.
  That is clause 6's acceptance test — *does the next map get this for free?* — answered
  mechanically rather than by intention.
- **Crossing to Python the way the corpus already does it.** `MEASURED_BAND` is authored in JS and
  reaches `row23_lib` as data in a sidecar. Same here: `node tools/room-voices.mjs --emit-materials`
  writes `library/textures/materials.json`, the Python assembler reads that, and a staleness test
  byte-compares a fresh emit against the committed file — the same shape as the two bake staleness
  tests in `fixtures.spec.mjs`.

`tiling` per material: `{ axis: "u" | "v" | "both", module_m, mirror }`. Directional material
(floorboards, panelling, joists) tiles by **translation along the grain at a material module** —
board 0.25 m, panel 0.80 m, joist 0.90 m — so a repeat lands on a joint and never mid-board, and
**mirrors across** the grain. Isotropic material (plaster, flags, gravel, brick) mirror-tiles both
ways. The modules are craft numbers and the manifest says so out loud beside them, per row 35's
precedent with its two budgets.

### 1.4 Harvest — each texture from a promoted wall Kabe has seen live

The row requires it and the plan holds to it. For material `T` in slot `S`:

1. **Pick the source facing.** Every promoted facing whose voice declares `T` for slot `S` is a
   candidate. Ranked by the criteria in §1.5; the winner is recorded with its reason, so "why this
   wall" is in the manifest and not in a transcript.
2. **Build the source box** from the *promoted meta*, which already carries every number
   the box needs: `box(corner_x0_px, corner_x1_px, floor_line_y·H − storey·ppm, floor_line_y·H,
   W/2, horizon_y·H)`. Refuse via `row35_snap.box_refusal` — the same construction, the same
   refusal.
3. **Choose the harvest window** in surface metres — a rectangle in `(u_m, v_m)` that is
   (a) inside the region's visible parameter range, (b) clear of every carrier
   (`meta.openings`, plus `facingCarriers` for hearths/windows/stairs) dilated by a stated margin,
   (c) clear of the anchor band for a wall's *field* harvest, and (d) above the resolution floor
   (§1.7).
4. **Sample.** A regular grid in surface metres at `tile_ppm`, mapped through
   `image(box, region, p, q)`, bilinear. Deterministic; no model.
5. **Neutralise** (§1.5) and write the tile and its record.

**Wall fabric is harvested as three banded tiles, not one, and this is load-bearing.** The instrument
measures scale off the voice's anchor at exactly 0.95 m. A wall tiled from one patch at an arbitrary
vertical phase would either lose the anchor or repeat it at wrong heights. So a wall fabric is:

| band | vertical extent | tiles |
|---|---|---|
| `dado` | floor → 0.95 m − half the anchor's own depth | horizontally only |
| `anchor` | the anchor strip at 0.95 m, harvested at its true height | horizontally only |
| `field` | above the anchor → storey | horizontally only |

Vertical position is fixed in metres, so **the anchor lands at 0.95 m on every assembled wall by
construction.** That makes measurability a property of the assembly, exactly as blueprint §11's
wainscot ruling made it a property of the wall specification. Skirting and cornice, where a voice has
them, are further bands by the same rule.

### 1.5 Neutral albedo — what row 37 changes about harvesting

Row 37 rules that pieces carry material, not illumination. The promoted corpus was painted lit, so
every candidate harvest region carries baked light. Three things follow:

- **Source ranking prefers evenly-lit, carrier-free regions.** For each candidate window, fit a
  low-frequency luminance field (heavy blur, σ ≥ ¼ of the window's short side) and measure its
  dynamic range as a percentage of its own mean, plus the chroma drift across it. Rank ascending.
  A firelit hearth wall's field will be large and it will lose to a plaster ceiling away from the
  fire, which is the intended outcome and is decided by a number rather than by my guess about which
  looks flat.
- **De-lighting is division, and the amount removed is the disclosure.** The tile is stored as
  albedo = pixels ÷ fitted field, and `flattened_pct` records how much had to come out. A tile that
  needed a lot of flattening is suspect: division amplifies noise in the dark end and cannot recover
  a region that was in deep shadow.
- **The neutrality bar is derived from the corpus, not chosen.** Measure `flattened_pct` over every
  candidate window in the corpus, print the distribution, and set the admission bar at the corpus's
  own best quartile — *as neutral as the best quarter of what we already have* — recorded with its
  clock so row 37 can move it with evidence. No free parameter enters. This is row 23's
  no-free-parameters discipline applied to a new quantity.

**Honest limit, named:** de-lighting removes a real gradient. A floor genuinely brightens toward a
window, and the flattened tile no longer knows that. Row 37's pass is what puts it back, and until
that pass exists an assembled room will read flat. §4.4's capture set shows Kabe both states for
exactly this reason.

### 1.6 The swatch ask — a new packet type, and the cheapest one in the project

Where no promoted wall can supply a material neutrally — the 4 named in §1.2, plus any material whose
best candidate fails the neutrality bar — the library asks for a **flat material swatch**:
orthographic, frontal, even sourceless light, no perspective, no carriers, no shadow, square crop.

`node tools/make-scaffold.mjs --emit-swatch --material <id>`. It is a genuinely new packet type and
the extension point is settled: a new `--emit-swatch` branch in `main()` beside `--emit-manor`, an
`emitSwatch()` beside `emitContentScaffold` (the worked precedent for a bolted-on packet type with
its own image composition, its own prompt suffix and its own `PACKET.md`), and — per `emitFinal`'s
own precedent — **a new id-map file, never an edit to `assignment.json`**, whose blob
`scaffold.spec.mjs` asserts has never changed.

A swatch is the easiest thing an image generator does: no camera, no geometry, no room. It is
also reusable forever and across buildings, which is the whole of clause 6.

**A second, exceptional packet type — `--emit-flat`, one physical wall, frontal, no returns.** Under
the carriers-leave-the-backdrop ruling most walls no longer need their own painting at all, so this
is the exception path, retained because the Captain may rule that a particular wall (built-in
joinery, a painted overmantel) deserves its own elevation. Its meta is an ordinary §5 meta with
`corner_x0_px`/`corner_x1_px` null and `storey_height_m` null, which the existing machinery already
turns into exactly the ask we want: `frameGeometry().bounded === false`, no returns, no ceiling line,
the anchor spanning the full frame. **No change to `frame-language.mjs` is needed.**

*The one gate `--emit-flat` needs that does not exist:* a generator asked for a flat elevation will
add perspective anyway. Refuse it by fitting the anchor row separately in the left and right thirds
and requiring the two to agree — reusing row 35's `MIN_RAMP_SLOPE` reasoning (a line that moves less
than one pixel across the span it was fitted over is level) rather than inventing a threshold.

**A returned flat wall or swatch is stored as a texture.** The library therefore holds two kinds of
tile — TYPED (a reusable material) and UNIQUE (one physical wall's elevation) — and the assembler
consumes them identically. That unification is what keeps the composition engine small.

### 1.7 Resolution, tiling to the view's need, and the frame-bottom requirement

**A correction to the direction I was given, on measurement.** `px_per_m_at_bottom` is not coarser
than `px_per_m_at_wall`; across the 54 promoted metas it is **1.26× to 9.41× finer** (median 2.48×).
Floor near the camera is magnified, so the nearest floor is the *finest* demand in the frame, not the
coarsest. The conclusion the direction reached is right and the reason is the opposite one.

Measured over the promoted corpus:

| quantity | min | median | max |
|---|---|---|---|
| `px_per_m_at_wall` | 42.1 | 160.0 | 337.9 |
| `px_per_m_at_bottom` | 354.2 | 411.9 | **503.3** |
| bottom ÷ wall | 1.258 | 2.482 | 9.412 |
| floor band below the floor line (px) | 102 | 301 | 445 |
| `nearest_floor_m` | 1.824 | 2.542 | 2.903 |

**Floor tiles are therefore stored at 512 px/m** — a craft number, stated as one, with its evidence:
the corpus's largest demand is 503.3 px/m and 512 is the next power of two. Wall and ceiling tiles
are stored at the largest demand their own slot makes, computed and recorded rather than assumed.

**Textures tile to whatever the view needs, so the frame bottom is real material by construction and
never an extension.** That is the third motivation's cure, and it is structural: there is no code
path in the assembler that repeats a border pixel, because every output pixel resolves to a surface
coordinate and every surface coordinate resolves into a tile modulo its period.

**The honest limit on resolution.** A source floor is seen at a grazing angle: in the §1.1 probe its
across-surface resolution ran 274–480 px/m while its along-depth resolution ran only 93–126 px/m. A
tile stored isotropically at 512 px/m is therefore interpolating along one axis. So the record carries
`harvest_ppm_across` and `harvest_ppm_along` **separately and truthfully**, and the assembler flags
any target demanding more than 1.5× a tile's *true* resolution on either axis. Where the flag fires
often for a material, that material is a swatch candidate — which is the cheapest fix in the project
and the reason the swatch path exists.

### 1.8 Storage and manifest

```
library/textures/
  materials.json                     emitted from room-voices.mjs; staleness-tested
  manifest.json                      every tile, its source, its numbers
  <slot>/<type-id>/
    tile.png                         the orthographic albedo tile
    tile.json                        this tile's record
    source-window.png                the source frame with the harvest window drawn on it
```

`tile.json`, and the same fields aggregated in `manifest.json`:

```
id, slot, material            the verbatim voice string this types
band                          dado | anchor | field | null, for wall fabrics
source_facing                 "<loc>/<F>" — a PROMOTED wall
source_png, source_sha256     the exact bytes harvested, digest-pinned like every reading
source_meta_sha256
region                        wall | floor | ceiling
window_u_m, window_v_m        the harvest rectangle in surface metres
why_this_source               the ranking that chose it, with its numbers
tile_ppm, size_px, span_m
harvest_ppm_across, harvest_ppm_along        the TRUE resolution, both axes
tiling                        { axis, module_m, mirror }   from MATERIALS
neutrality                    { field_range_pct, chroma_drift, flattened_pct, bar, admitted }
carriers_avoided              which painted-in carriers the window was cut around
harvested_at_commit
```

`source_sha256` is not decoration: `promote-backdrop.mjs` refuses a reading whose candidate digest
has moved (a critic once repainted a candidate in place and the old numbers shipped). The library
inherits that discipline — a tile whose source bytes moved is a finding.

### 1.9 Interim honesty: painted-in carriers during the transition

The 54 promoted walls have their carriers painted in. Two consequences, both stated rather than
discovered:

- **No harvest window may cross a painted-in carrier.** The carrier-free rule of §1.4 step 3 is
  what enforces it, and `carriers_avoided` records what was dodged. A wall that is *all* carrier
  (a window range down a gallery) yields no window and loses the ranking.
- **The transition state is per wall and the ruling is the Captain's**, exactly as row 37 rules the
  lit-legacy question. Until a wall is repainted plain, its carriers stay painted and no carrier
  sprite is placed on it; once repainted, its carriers come from the sprite library and the wall
  carries none. The two states coexist in one manor and the record says which each wall is in — a
  `carriers: "painted" | "sprite"` field on the meta, defaulting to `painted` so the 54 need no
  edit. **This row does not repaint any wall and does not decide any of these per-wall calls.**

---

## 2. ASSEMBLY

### 2.1 The engine

`design/plan-draft/measured/row36_assemble.py`, beside `row35_snap.py` and importing it, so the
five-plane math has exactly one home.

```
python3 .../row36_assemble.py --harvest-all [--out library/textures]
python3 .../row36_assemble.py --assemble <loc>/<F> --out <png> [--acceptance]
python3 .../row36_assemble.py --sweep <status,...>
python3 .../row36_assemble.py --emit-crossfacing <room>      the turn agreement samples
python3 .../row36_assemble.py --synthetic-acceptance         ground truth, no image on disk
```

For one target facing:

1. **The declared box.** Built from `deriveMeta(plan, loc, facing)` — the plan's own geometry.
   This is why the assembled facing is on-geometry by construction, and §4.1 is honest about what
   that does and does not prove.
2. `assign(tgt, x, y)` for every output pixel → region + `(p, q)` → surface metres.
3. Paint each region from its source (§2.2–§2.4).
4. Write `backdrops/source-assembled/<room>-<F>/assembled.png`.
5. Measure it, write the reading to `design/plan-draft/measured/row36asm/<loc>-<F>.json`.
6. `tools/promote-backdrop.mjs --round row36asm --candidate backdrops/source-assembled/...`.

**Step 4 is not optional and I nearly got it wrong.** `fixtures.spec.mjs:125` reconstructs every
promoted wall's promotion command *from the meta itself* and byte-compares the result — so an
assembled facing must be a file on disk that `camera_id` names, with a committed reading whose
`_what_this_is` contains that path and whose `_source_sha256` is that file's digest. **There is no
side door into the store.** Row 35 already walked this exact path: `guest_chamber/E` and
`servants_hall/W` are promoted today from `backdrops/source-snapped/`, and `snap.spec.mjs:254–304`
is the working template for staging it in a scratch tree.

### 2.2 Floors and ceilings — anchored in room-world, which is the whole cure

Kabe's second motivation is *"I have one room as you turn ceiling floor and wall change."* The cure is
one line of design:

> **Every surface is sampled in ROOM-WORLD coordinates, never in frame coordinates.**

A floor pixel's `(u_m along the wall, depth-from-wall)` converts through the room's rect and the
facing's compass orientation into plan `(x, y)` in metres, and *that* is what indexes the tile. Two
facings of one room that show the same physical patch of floor therefore sample the same tile
coordinates — not approximately, identically. Board direction, joint phase and pattern continue
around the turn because they were never per-facing quantities. Ceilings likewise.

The tile's origin and axis are per room, derived from the room rect (origin at `(x0, y0)`, grain axis
along the room's long side unless the voice's `tiling` names otherwise) and recorded on the meta.

**Determinism.** Where a tile is smaller than the room and phase jitter is used to break the
wallpaper read, the jitter is seeded by the *room id*, never by the facing — so it is one field per
room, identical from all four sides, and §12.2's identical-inputs-identical-hash holds. A
facing-seeded jitter would silently reintroduce the very disease this row cures; the test asserts
the room seed and not merely that rendering is repeatable.

### 2.3 Side returns — the neighbour's promoted facing-plane, re-projected

For target facing `F` of room `R`, the left and right returns are physical walls of `R` — the walls
that `R`'s other facings paint frontally. Where that neighbour is promoted:

`return pixel → (depth-from-wall, height) → plan (x, y, z) → the neighbour wall's own surface
coordinates (metres along the wall from its corner, height above its floor) → the neighbour's box,
wall region → its image pixel.`

Both ends are `region_matrix` evaluations, so the composition is a plane-to-plane homography and it
is exact. The room rects are axis-aligned and every facing carries `standpoint`, `wall_line`,
`wall_width_m` and `camera_wall_m`, so every metre in that chain comes from the plan.

Where the neighbour is **not** promoted, the return is the room voice's wall fabric — tiled in the
same room-world along-wall coordinates the neighbour's own facing wall will use when it is
assembled. So the two agree in advance, and painting the neighbour later does not move the return's
phase.

**What it costs, and why it is cheap.** The return's local resolution along its own depth axis, at
the corner, is `half_width_px ÷ camera_wall_m`; toward the frame edge it rises as `(camera/z)²`. On
a facing whose wall spans most of the frame the visible return is about 1.2 m deep (§1.1) and the
demand runs roughly 1.0–2.0× the neighbour's frontal resolution — inside budget. On a wall wide
enough to fill the frame the returns are zero pixels and the question does not arise. **The build
measures it per facing rather than trusting this paragraph**, with `row35_snap.magnification`'s
Jacobian restricted to the tile's true resolution, and refuses over a stated budget with its number,
the way row 35 refuses.

### 2.4 The facing wall

Under the carriers-leave-the-backdrop ruling, in decreasing order of preference:

| case | source | model calls |
|---|---|---|
| the wall is plain fabric (the general case now) | the voice's banded wall fabric, room-world anchored | 0 |
| this physical wall already has a promoted frontal painting | harvest its wall region as a UNIQUE elevation tile and re-project | 0 |
| the Captain rules this wall deserves its own elevation | `--emit-flat`, one plain frontal wall | 1, once, ever |
| the material itself is missing from the library | `--emit-swatch` | 1, once, ever, reused everywhere |

Carriers — windows, fireplaces, candle-holders, exterior doors — are **not** painted here. They are
library sprites placed by the plan (§6.2).

### 2.5 Seams

Two different claims, and the plan keeps them apart because they need different proofs.

**Within a frame — algebra, already proven.** Two of the five regions share an edge exactly where
one parameter is pinned, and along that edge both parameterisations name the same physical line, so
both matrices evaluate to the same image point. `row35_snap.seam_samples` already emits both
mappings of every shared edge so a test computes the disagreement instead of being told there is
none. Assembly inherits this unchanged and `assembly.spec.mjs` re-runs it on assembled boxes.

**Across frames — construction, and this is the row's own claim.** Two tests, one cheap and
decisive, one expensive and honest:

- **The coordinate agreement test.** For each adjacent facing pair of a room, sample N points on the
  shared physical surface (wall, floor, ceiling) from both frames and assert the room-world
  coordinates agree to < 1e-6. This is arithmetic, runs in milliseconds, and is the test that would
  go red if anyone ever anchored a texture to a frame instead of to the room.
- **The pixel agreement test.** Re-project facing A's right-return region into facing B's frame and
  measure per-pixel agreement over the overlap. **The tolerance is not chosen**: the control is a
  double-resample of the same source through the identity, measured on the same frame, and the bar
  is that cross-facing disagreement does not exceed it by more than the resampling the two paths
  differ by. No band is invented.

### 2.6 Light continuity — which has left this row

Under row 37 the pieces are neutral and illumination is a separate pass, so there is no
one-key-law-across-pieces problem for row 36 to solve. What row 36 owes is stated in §6.1.

The one thing that does *not* leave: a re-projected neighbour wall is not neutralised, because it is
that wall's own material and its own baked light. During the transition a room can therefore hold
neutral tiles beside lit re-projections. **The assembler measures and reports the luminance and tint
step across each corner seam per assembled facing**, and the bar to beat is the corpus's own current
adjacent-facing disagreement — which is Kabe's finding (b)/(c) turned into a number (§5.2). Clause 5:
the improvement clocks, or it is not one.

### 2.7 The honest limits, all of them, in one place

1. **A texture harvested at one scale re-projected far off it** — §1.7's true-resolution flag, with
   its measured budget.
2. **Repetition.** A tiled floor cannot show the one worn patch by the hearth, and a 14.6 m great
   hall floor drawn from a 1.2 m tile is twelve repeats. The cure for *"walls don't match"* must not
   become *"everything is identical"* — Kabe has already caught repetition once, on the window
   (finding (b)). Mitigations: harvest the largest window the source allows; mirror across the grain;
   room-seeded phase; a slow low-frequency modulation. **This is the risk most likely to lose at the
   flip test and the capture set puts it in front of Kabe deliberately** (§4.4).
3. **De-lighting removes real light** (§1.5) and cannot recover deep shadow.
4. **Approximate re-projection can destroy the junction the horizon instrument reads** — this is not
   speculation, it is what the t4 evidence shows (§3.2).
5. **An assembled facing passes the instrument nearly by construction** (§4.1).
6. **Page weight.** `backdrops/baked.js` is 35.7 MB for 54 paintings, ~660 KB each, and
   `fixtures/nav-manor/fixture.js` is another 417 KB. Assembly makes all 88 facings *generable*;
   painting all 88 takes the page past ~58 MB. Not this row's to fix, and named because assembly is
   what makes it reachable.

---

## 3. THE FIRST EVIDENCE — the four orphaned t4 returns, scored

### 3.1 The scoring, and a defect found while doing it

The four content-scaffold returns dispatched on the row-23 NULL trigger —
`b912746e`, `f8c180d2`, `ad04dc51`, `0cbdea31`, all on `study/N`, recorded in
`design/plan-draft/measured/row23/assignment-2.json` — were painted, never measured. Repo-wide they
appear in exactly three files: their `PACKET.md`, that assignment record, and four backfilled
`generate.roll` lines in the timings ledger. No reading, no score, no ledger entry.

**`measure.py --round row23` cannot run today.** It passes
`dict(pick_floor=…, module_in_bands=…)` as its `picks`, and rows 32/35 grew `measure_candidate` a
promotion half that reads `picks["EYE_RANGE"]`. It dies on `KeyError: 'EYE_RANGE'` at
`row23_lib.py:598`. That is why nobody scored these: **the instrument path that produced the other
24 readings rotted, and no test covers it.** The one-line fix (pass the full picks set, as all three
other callers do) is in this row's build, with a case that goes red without it.

I scored all 20 of `study/N`'s returns through the standing instrument with the full picks, against
the Kabe-ruled `cand5ref` reference, joining technique to id at table time. Nothing was written into
the repo.

### 3.2 The numbers

| tech | n | camera PASS | hold families | median \|Δfocal\| % | median \|Δeye\| % | carrier found |
|---|---|---|---|---|---|---|
| lens (unassigned in `assignment.json`) | 4 | 3 | 0 | 3.91 | 1.47 | 0/4 |
| t1 frame only | 4 | 2 | 1 | 7.27 | 5.55 | 0/4 |
| t2 labelled scaffold | 4 | 2 | 1 | 8.10 | 4.88 | 0/4 |
| t3 scaffold + prose | 4 | 3 | 0 | 4.47 | 4.51 | 0/4 |
| **t4 content-scaffold** | **4** | **4** | **3** | **4.75** | **3.20** | **0/4** |

Per roll: `b912746e` PASS, focal 764.7 (−6.70 %), eye 1.166 (−1.47 %), `suspect-painting`;
`f8c180d2` PASS, 805.9 (−1.67 %), 1.219 (+3.07 %), `unfitted-horizon`; `ad04dc51` PASS, 796.7
(−2.79 %), 1.222 (+3.33 %), no hold; `0cbdea31` PASS, 755.5 (−7.82 %), 1.255 (+6.05 %),
`unfitted-horizon`. All four lean `ask` on the carrier hypothesis.

### 3.3 What it says, and what it does not

- **t4 is the only arm on this wall to pass the camera gate 4 of 4**, and it has the best median eye
  deviation of the four techniques. Directionally, inheriting real neighbour pixels for the left
  return, floor and ceiling did not hurt the camera.
- **It is not a separation and the plan says so before anyone quotes it.** 4-of-4 against t2's
  2-of-4 at n = 4 is Fisher p ≈ 0.43. This is exactly what row 23 found for every other arm at this
  n, and row 34 then spent 68 rolls confirming that this corpus does not separate at these sample
  sizes. **No recipe is crowned by these four numbers.**
- **The instrument's resolution on this wall is coarse enough to tie.** `f8c180d2` (t4) and
  `7432e756` (t3) return byte-different images (digests confirmed) and *identical* readings —
  805.9 px, 1.219 m. Both anchors landed on the same integer rows. A tie between two different
  paintings bounds what any camera-arm comparison on this wall can resolve.
- **The warning, and it is the useful half.** Three of t4's four carry a horizon hold family against
  t3's zero. The t4 packet says plainly that its return was *"column-sliced, not a full homography …
  an approximation"* — and an approximate return is exactly the thing that would leave a
  ceiling/side-wall junction that `ceiling_ramp_vp` cannot fit. **Row 36's re-projection is a true
  homography and must be measured against precisely this failure**: the acceptance run reports the
  fitted ramp slopes and hold family for every assembled facing, and a rise in `unfitted-horizon`
  against the t4 baseline is a finding, not a curiosity.
- The carrier edge detector resolved nothing on any of the 20, which confirms blueprint §11b(c)'s
  record rather than adding to it.

These numbers go into `misses.jsonl` under a `row36-t4` round in the build, which is where the row's
done clause wants them.

### 3.4 The bottom-of-frame smear, measured

I measured the smear signature — trailing frame-bottom rows whose row-to-row mean absolute change is
under 1/255 — across all 54 promoted paintings. **Edge extension has exactly zero row-to-row change
by construction, so this test cannot be fooled by a dark floor.**

**Only 2 of 54 show it, and they are precisely the two snapped-and-promoted walls:**
`guest_chamber/E` (26 flat rows) and `servants_hall/W` (21). Every other painting: 0.

So the diagnosis I was handed — *edge-extension fill wherever a painting's floor stops short* — is
**confirmed for the snap's reveal budget and refuted as a description of the other 52 walls.** The
Captain said *"many of the rooms"*, and two is not many, so I looked for the mechanism he actually
saw:

> `src/renderer.js:1310` — `ctx.drawImage(off, 0, H - 1, W, 1, dx, dy + dh, dw, bot)`

**The destination frame's last row, stretched downward, inside every through-doorway.** Row 25(d)
already measured this class: a through-view composite is 22–38 % destination and the rest edge
extension, with single-pixel-derived blocks totalling 17 % of the picture. **47 of the manor's walls
carry a door**, so this is visible on most of the building — which fits *"many of the rooms"* exactly,
and fits the Captain's own next sentence: *"we need to address this with proper size source images
which I trust we will have when we assble panels."* A destination view that can be **assembled at the
extent the hole demands** needs no edge extension at all.

Two consequences, both stated honestly:

- Assembly cures the class by construction wherever it composes (§1.7).
- **The through-view fix is row 25's, not this row's.** Row 25's done clause already owns it. Row 36
  supplies the capability and §6.3 specs the interface. I am not building it here.
- **A live-capture census is act 1 of the build**, over all 88 facings as the page draws them, so the
  claim is measured where Kabe was looking rather than on the source PNGs where I could reach it
  today.

---

## 4. VALIDATION

### 4.1 The instrument is a regression check, not a quality bar, and the plan says so first

An assembled facing is constructed at the geometry the plan declares, so the camera gate is
near-tautological. This is not a guess — every one of the 14 `row35snap` readings, which are the same
kind of constructed geometry, reports `delta_focal_pct: 0.0`, `delta_eye_pct: -0.0`, no hold family,
where the `manor` round ran 252 PASS / 91 FAIL / 4 WITHHELD on generated frames.

Worse, two of the instrument's detectors **cannot fail by construction**: `pick_floor` returns
`argmin` over the floor bracket and `module_in_bands` returns `argmin` over the rail band, so both
always return a row. On a surface with no real anchor they return a texture seam and call it 0.95 m.

So the plan states the bar plainly: **the instrument proves no bug; it does not prove quality.** What
it can still genuinely fail, and what the acceptance run therefore reports per facing:

| detector | can it fail on an assembly? | what it needs |
|---|---|---|
| `find_corners_recession` | **yes** | oblique structure on the returns — which projection creates automatically, because the fabric is tiled in surface metres and *then* projected |
| `ceiling_ramp_vp` | **yes** | ≥25 usable junction columns each side; this is the t4 warning (§3.3) |
| `carrier_edges` | yes | resolvable edge pairs; unread on this corpus already |
| `door_measure` | **yes** | a dark, textureless void ≥0.40 m wide with a head 1.40 m–storey |
| `pick_floor`, `module_in_bands` | **no — always return a row** | nothing; this is why §1.4's banded fabric must actually paint the anchor at 0.95 m |

**And a real conflict with row 37 that must be settled in the contract, not discovered.** `pick_floor`
reads a *luminance minimum* at the wall's foot — a contact shadow. A neutral-albedo assembly has no
contact shadow, so on a neutral frame that detector reads noise. Therefore: **the instrument measures
the LIT output, not the neutral albedo**, and row 37's pass must produce the contact darkening at the
wall foot. That is not a concession — it is intention quality #2 (*Contact*), and it means the
lighting pass is what makes the assembly measurable. §6.1 carries it as a contract line.

### 4.2 The real bar 1 — the flip test on turning

The row's own done clause. Beyond §2.5's two agreement tests:

- **Same-surface identity across the turn.** For each fully-assembled room, capture all four facings
  and assert that every physical surface appearing in two of them is derived from the same tile at
  the same room-world coordinates — reported as a table, per room, per surface.
- **The corner strip comparison, as a picture.** For each adjacent pair, a side-by-side of A's
  right-edge strip and B's left-edge strip, which depict the same physical wall. Kabe judges the
  seam; the test measures it.

### 4.3 The real bar 2 — Kabe's eye

Per the playbook, direction is surfaced before it is locked and verification is batched. This row
produces both: the material-voice tile sheet goes to Kabe as *direction* when the library first
exists, and the assembled rooms go as a *batch*.

**Every batch names the commit its frames were rendered from and the capture script is committed
beside them** — row 20's scar, and the one defect this project has called its worst. The batch also
carries the row-33 clock.

### 4.4 The capture set proposed for Kabe

One capture spec everywhere, §12.6's: the scene canvas at native 1536×1024, Playwright element
screenshot, cold `file://`, no chrome, no hover.

1. **The turning set** — one re-assembled room, all four facings in turn order, before and after.
   The row's headline: floor, ceiling and every corner continue around the turn.
2. **The corner strips** — four adjacent-pair strips from that room, before and after.
3. **Both lighting states** — the same assembled room raw-neutral and under a first-cut lighting
   pass, however crude. **The look judgment must be of the architecture, not of the flatness**, and
   without both frames Kabe would be shown a flat room and asked whether assembly works.
4. **The repetition sheet** — the largest assembled floor and the largest assembled ceiling, whole
   frame, so the tiling is judged where it is most likely to read as wallpaper (§2.7 item 2). This
   one is put in front of him deliberately because it is where I expect to lose.
5. **The bottom band** — the worst bottom-smear facing before and after, cropped to the bottom
   quarter and also shown whole.
6. **The tile sheet** — every harvested texture as a flat swatch with its source facing named on it,
   so *"each texture's source wall cited"* is something Kabe can see rather than read.
7. **The honest nothing** — one facing the assembler refused, with its number.

---

## 5. TARGETS

### 5.1 First customers — the unpainted and held facings

From `design/batches/row23-scaffold/manor/run-state.json` (85 walls; 54 promoted on disk once
`study/N` and `study/W`, which predate the sweep, are counted):

| status | n | hold families |
|---|---|---|
| `promoted` | 52 | 35 clean, 10 `unfitted-horizon`, 7 `suspect-painting` |
| `held` | 18 | 9 `unfitted-horizon`, 4 `suspect-painting`, 3 `promotion-refused`, 2 `standpoint-out-of-frame` |
| `retry` | 9 | `promotion-refused` |
| `parked` | 4 | `camera-miss`, retry cap spent |
| `admitted-not-promoted` | 2 | `fenced-m0-row4` — `hall/E`, `hall/W`, routed to row 4, not failures |

**31 facings are held, retrying or parked** — those are assembly's first customers, plus the three
the manifest skipped. Two rooms have zero promoted facings and are therefore the sharpest test of
assembly from an empty start: **`great_hall`** (1 parked, 1 retry, 2 held) and **`hall`** (2 held,
2 fenced) — and they are also the two rooms whose voices supply 4 of the 32 materials the library
cannot harvest (§1.2). They are the same problem seen twice, and the swatch ask is the one answer.

**Order of attack:** the 8 genuinely featureless walls first (§8), because they need no ask at all;
then the held/retry facings of rooms whose voices are already harvestable; then `great_hall` and
`hall` behind their four swatches.

**Adjacent, and explicitly not mine to route.** `design/batches/row35-snap/sweep.json` reports 12
walls that re-measure completely clean after the snap, of which only 2 are promoted; ten sit with
their readings already on disk in `design/plan-draft/measured/row35snap/`. That is a promotion the
Navigator sequences, not an assembly. I name it because **promoting those ten would add ten more
bottom-smeared frames** (§3.4) — which is worth knowing before the routing is taken.

### 5.2 The demonstration — the worst turn-inconsistent room

Kabe's finding (c): *"as I keep turning left the world shrinks in one place."* I measured the spread
of `px_per_m_at_bottom` — the scale at which each facing draws the floor at the viewer's feet, which
is the quantity that reads as the room changing size — across every fully-promoted room:

| room (all 4 facings promoted) | floor-scale spread | focal spread | eye spread | painted storey spread |
|---|---|---|---|---|
| **`buttery_pantry`** | **21.52 %** | 78.9 px | 0.404 m | 0.195 m |
| `dining_parlour` | 18.35 % | 27.8 px | 0.385 m | 0.917 m |
| `master_bedchamber` | 15.76 % | 22.6 px | 0.280 m | 0.523 m |
| `solar` | 15.19 % | 37.2 px | 0.214 m | 0.755 m |
| `servants_hall` | 8.59 % | 38.9 px | 0.147 m | 0.797 m |
| `muniment_room` | 5.07 % | 80.9 px | 0.240 m | 0.338 m |
| `guest_chamber` | 4.56 % | 32.0 px | 0.078 m | 0.314 m |

**`buttery_pantry` is the demonstration room.** Worst on the quantity Kabe's own sentence names —
its four facings disagree about the size of their own floor by 21.5 %, and about the eye height by
0.40 m. It is re-assembled from established pieces at **zero model calls**: each wall's elevation is
harvested from its own promoted frontal painting, and floor, ceiling and both returns are rebuilt
world-anchored. Four frames that share one floor, one ceiling and four walls, each identical from
every angle.

*(Row 29's own citation of `muniment_room` at −7.0 %…+0.9 % is a different quantity — promoted focal
band — and this table does not contradict it; on floor scale that room is sixth of seven.)*

**Second demonstration, offered:** `dining_parlour`, second-worst at 18.35 % *and* carrying the one
rationed armorial shield, so it shows the assembly on a room with something to look at. Kabe's call
which he'd rather see; the plan builds `buttery_pantry` and offers the second.

---

## 6. INTERFACES — spec'd, not built

### 6.1 What row 36 needs FROM row 37

The two rows co-design, so the contract is written once here and once there.

**What row 36 gives row 37:**

- `albedo` — the assembled neutral frame, an ordinary promoted `backdrops/<loc>/<F>.png`.
- **The five-plane geometry, at no new cost.** The box is already fully derivable from the shipped
  §5 meta: `(corner_x0_px, corner_x1_px, floor_line_y·H − storey_height_m·px_per_m_at_wall,
  floor_line_y·H, W/2, horizon_y·H)`. Row 37 re-runs `assign()` in JS and gets per-pixel plane id and
  surface metres. **No new meta field is needed for this** and none is proposed.
- **Where the plan's light sources land in this frame** — the one thing only the assembler computes
  cheaply, because it already converts every pixel to room-world. Proposed meta addition:
  `light_sources: [{ kind: "hearth"|"window"|"opening"|"candle", id, plane, u_m, v_m, x_px, y_px,
  w_px, h_px, distance_m, facing_side }]`, derived from `plan.fireplaces`, `plan.windows` and
  `plan.openings`. `facing_side` carries whether the source is in front of or behind the viewer,
  which is what the Captain's *"a lit fireplace on the left … I turn around it may illuminate the
  right side slightly better"* needs.
- `neutral: true|false` on the meta, so the pass knows whether to light a frame or pass a legacy lit
  one through; and `carriers: "painted"|"sprite"` (§1.9).

**What row 36 needs back:**

- **The pass must produce contact darkening at the wall foot**, because `pick_floor` reads it and the
  instrument otherwise cannot measure an assembled facing (§4.1). This is quality #2 and it is the
  hinge between the two rows.
- **A ruling on `key_dir`/`key_tint` for neutral frames.** `promote-backdrop.mjs` derives both from
  the measurement's `_light`, and on a flat frame they are meaningless. Either the promotion tolerates
  and marks a neutral frame, or the pass writes them. Row 36 hits this first and does not decide it.
- The ambient key per §7's one-key law is row 37's; row 36 records nothing about it.

**Two new meta keys means `META_ALLOWED` in `tools/validate-fixtures.mjs` grows**, and unknown keys
are a hard refusal (`[row11:meta.unknown_key]`). Named so it is not discovered at bake time.

### 6.2 The sprite-library interface — named, not built

The libraries divide cleanly: **row 36 holds SURFACES** (wall fabrics, floors, ceilings);
**the §6 sprite library holds CARRIERS** (the window family, the fireplace family, candle-holders,
door leaves). Those are the row-4 replicator lane's output and **this row builds none of them**.

The interface already exists and needs nothing invented: a carrier sprite is placed exactly as
staging places furniture, from the plan's own `openings`/`windows`/`fireplaces` rects converted to
wall-local metres by `facingCarriers` — the same function the scaffold already stamps from. Doors
already have their aperture and click machinery (§11, row 27). What assembly owes is that a plain
assembled wall leaves the carrier's footprint *undecorated*, which it does by construction because
it never paints one.

**This retires the repeated-window disease structurally.** Kabe's finding (b) — *"this same window
everywhere? With the ensignias on it?"* — was answered at row 29 by varying the *ask* (bay counts
from the plan, glazing variation, rationed heraldry). Under the sprite rule it is answered by
construction instead: one window family, plan-placed, variant-varied per instance, and the wall
behind it carries no window at all. Row 29's variety machinery becomes the sprite family's variant
axis rather than a per-wall prompt paragraph.

### 6.3 What rows 35 and 25 get from row 36

- **Row 35, the snap's reveal budget.** Once a room has an assembled floor and ceiling, the snap's
  bottom-reveal should fill from the room's own texture rather than repeating a border pixel. That
  turns the 100 px reveal budget from a refusal into a fill, and it would retire the smear on
  `guest_chamber/E` and `servants_hall/W` (§3.4). One interface line, spec'd here, built by whoever
  the Navigator sequences.
- **Row 25(d), the through-view.** A destination view assembled at the extent the aperture demands
  removes the edge extension entirely. Row 25's done clause already owns the choice; row 36 supplies
  the capability.

---

## 7. PROMPT IMPLICATIONS — every place the ask changes

Row 37 takes the lighting language out of the ask and the carrier rule takes the carriers out. Every
site, flagged; **this row changes none of them without row 37's build, and the list is the handoff.**

**`tools/make-scaffold.mjs`, the production composer `manorPrompt`:**

| line | text | change |
|---|---|---|
| 1394 | *"Image 1 is the exact reference for painted MEDIUM, palette, light quality"* | drop *light quality* |
| 1452 | *"Overhead is open sky … and daylight falls from it onto everything"* (outdoor branch) | neutral rewrite |
| 1461–1462 | *"…deep warm browns, cool ambient light, gentle natural falloff."* | the ambient key leaves |
| the carrier block (`CARRIER_SENTENCE`, `windowLines`, the fireplace ticks) | | carriers leave the ask entirely |

**The experiment composer `promptFor` / `TECHNIQUES`** (lines 1043, 1083, 1106–1107) carries *"a
small lively lit wood fire"* and *"cool ambient light from the right, localized amber firelight"*.
These are row 23/34 experiment fixtures and `evolution.spec.mjs` pins arm text byte-identically —
**changing them would move a closed experiment's record**, so they stay and are marked historical.

**`tools/make-scaffold.mjs:2225`**, the t4 suffix — *"the same oak, the same boards, the same plaster,
the same light"* — is superseded by this row: assembly inherits pixels rather than asking a painter
to match them.

**`tools/frame-language.mjs:419–421`**, the stair-void — *"deep unlit shadow … no light source beyond
the end of the stair"* — is describing a VOID, not a light. It stays, said as absence of material
rather than absence of light.

**`design/references/style-seed-warm.png`** is Kabe's approved seed and it *is* a lighting reference —
its name says so. Under row 37 it either gains a neutral sibling or its light is explicitly
disclaimed in the ask. **Swapping a Kabe-approved artifact is his call, not an agent's**, and this
row carries the question rather than answering it.

**`prompt_lint.py`** gains the clause that makes the rule impossible to forget: an ask carrying
lighting language, or naming a carrier, is refused before an image exists — clause 6's remedy, a
cause baked in algorithmically. That clause belongs to row 37's build; row 36 states it so the seam
is not lost.

---

## 8. THE GENERATION-COUNT ARITHMETIC, with evidence

**The row's own figure does not survive contact with the plan, and the true figure is better.**

The row says *"~88 full frames to ~30 unique walls."* Counting the plan: 88 facings, 80 `enclosed`,
4 `corridor`, 4 `open`. Attributing every `opening`, `window`, `fireplace` and `stair` to its wall by
rect coincidence: **76 walls carry at least one carrier, 8 are genuinely featureless, 4 are open.**
So there is no reading of "unique walls" that yields 30 for this building — under the old rule it is
84. **I flag that as a false assumption** (§10, FA-1).

Under the rules as they now stand — carriers are sprites, walls are plain fabric, floors and
ceilings are typed textures — the count is not walls at all. It is **materials**:

| | today | under assembly |
|---|---|---|
| full frames asked | 88 | **0** |
| rolls actually spent to promote 54 walls | **232** `generate.roll` records, **median 42 min each** (`timings.jsonl`, n=232, p50 2516 s, p90 4802 s) | — |
| distinct surface materials the whole manor needs | — | **32** |
| of those, harvestable from already-promoted walls | — | **28** |
| **new model calls to finish the manor's surfaces** | — | **4 swatches** |
| unique wall elevations, if the Captain rules any deserve one | — | 0 required; each is 1 call, once, ever |
| carrier sprites | painted into 76 walls, 4× over | ~4 families, row 4's lane |
| everything else | — | arithmetic: `snap.wall` runs at **11.9 s median** (n=51) and assembly is the same order |

**88 full frames → 32 material asks for the whole building, of which 28 are already paid for, leaving
4.** And for the next building (row 31's Test Build 2), if it shares this material vocabulary: **zero**
— which is clause 6's acceptance test answered with a number.

The evidence for each figure: 88/80/4/4 and 76/8/4 from the plan by script; 32/28/4 from
`room-voices.mjs` resolved over every facing; 232 rolls and 2516 s from the committed timings ledger;
54 promoted from the store; 11.9 s from row 35's own clock.

**Two honesties about this table.** First, it counts *asks*, not quality — 4 swatches that come back
wrong are 4 more swatches. Second, the 28 "already paid for" are only free if their harvest windows
clear the neutrality bar (§1.5) and the carrier-free rule (§1.9); every one that fails converts to a
swatch, and the build reports the conversion count rather than assuming zero.

---

## 9. BUILD ORDER, TESTS, EDGES

### 9.1 Order

1. Fix `measure.py --round row23`'s picks; land the t4 readings into `misses.jsonl` as `row36-t4`.
2. Live-capture smear census over all 88 facings (§3.4).
3. `MATERIALS` + `--emit-materials` + the completeness and staleness tests.
4. The harvester; the neutrality distribution printed; the tile sheet to Kabe as *direction*.
5. `--emit-swatch` for the 4 (and any conversions).
6. The assembler: floors and ceilings first (the turn cure), then returns, then walls.
7. `buttery_pantry` re-assembled; the batch.
8. The held/retry facings.
9. `--emit-flat` last, only if the Captain rules a wall needs it.

Gears: 1–3 are mechanical (sub-Opus work). 4, 6 and the tests are the load-bearing build.

### 9.2 `tests/playwright/assembly.spec.mjs`

Modelled on `snap.spec.mjs`, which is the right template because it proves a construction rather than
a verdict:

- **seams** — both regions' mapping of every shared edge, computed in the test from the tool's
  emitted numbers, so a construction that came apart shows as a distance.
- **cross-facing coordinate agreement** — §2.5, arithmetic, the test that catches frame-anchoring.
- **cross-facing pixel agreement** — §2.5, against a resampling control, no invented band.
- **synthetic acceptance** — a room assembled from planted tiles at a KNOWN geometry, read by the
  standing instrument; the precedent is `row35_snap._read_planted`, which is the existing working
  answer to *measure a frame that is in no manifest*.
- **the anchor lands at 0.95 m** — the banded-fabric claim, measured on the assembled pixels, red if
  a band is tiled vertically.
- **the room seed, not the facing seed** — phase jitter identical across four facings.
- **refusals** — over-stretch and missing-material refuse with their numbers, and each carries its
  own `[row36:...]` clause token, one token, one emit site, per the ledger discipline.
- **a real click** on a door of an assembled wall, promoted into a scratch store, the way
  `snap.spec.mjs:254–304` does it.
- **the delete-green cases** — one per named mechanism, so `guards.spec.mjs` can hold the arms.

### 9.3 Edges — what this must not touch

- **No runtime code and no page bytes.** Assembly is build-time Python; its output is an ordinary
  promoted painting. `src/` is untouched.
- **No band moved, no bracket widened, nothing re-derived.** `MEASURED_BAND` stays where it is
  authored.
- **No promotion clause changed.** A snapped wall was not automatically promotable and neither is an
  assembled one; the door, stair and vista refusals stand.
- **`assignment.json` is never edited** — new packet types write new id-map files.
- **No wall repainted, no per-wall legacy call taken** (§1.9).
- Feels the change: `validate-fixtures.mjs` (`META_ALLOWED`), both bakes, `fixtures.spec.mjs`'s two
  staleness tests, `room-voices.spec.mjs`, `guards.spec.mjs`.
- **`geometry.spec.mjs:173` hardcodes `MEASURED_REFERENCE_PX`** rather than calling
  `measuredLensBand(meta.camera_reference)`. It passes today only because both LIT-measured walls are
  `"measured"`. Promoting a `"ruled"` wall into `study/` or `hall/` turns it red — and `hall/E` and
  `hall/W` are on my target list. Named now.

### 9.4 Clock

Full suite: **1648 passed / 70 skipped, 8.9 min** on this tree, green before I started. Inner loop
for this row is `fixtures.spec.mjs` on chromium alone — both staleness tests, all 54 walls
re-promoted and re-encoded — at **43 s**. One full suite at the end, per the handoff.

Per clause 5, every change lands with its before/after: harvest and assemble times on the row-33
clock, the hold-family rate against the t4 baseline, the adjacent-facing floor-scale spread before
and after (§5.2), and the smear census before and after.

---

## 10. FALSE ASSUMPTIONS AND CORRECTIONS FOUND

**FA-1 — "~88 full frames to ~30 unique walls" does not hold for this building.** 76 of 88 walls
carry a carrier and 8 are featureless; under the pre-sprite rule the figure is 84, not 30. Under the
carriers-are-sprites rule the right unit is not walls at all but the **32 surface materials** (§8),
which is a far stronger claim than the row makes. The done clause asks for the arithmetic *with
evidence* and does not fix the number, so this is a correction rather than a conflict — but the row's
prose should be amended so nobody quotes 30.

**FA-2 — `px_per_m_at_bottom` is finer than `px_per_m_at_wall`, not coarser** (1.26–9.41×, median
2.48×). The direction I was given reached the right requirement — the tile needs the resolution of
the *nearest* floor — by the opposite reasoning (§1.7).

**FA-3 — the bottom-smear diagnosis is right about a mechanism that affects 2 of 54 walls, and the
one the Captain most likely saw is `renderer.js:1310`**, the through-doorway edge extension, live on
the ~47 walls that carry a door (§3.4). Both are named; the fix for the second is row 25's.

**FA-4 — the row-23 measurement path is broken and no test covers it.** `measure.py --round row23`
dies on `KeyError: 'EYE_RANGE'`. This is why the t4 orphans were never scored, and it is a
gates-that-cannot-fail sighting of a different shape: not a guard that cannot go red, but an
instrument path that cannot run and that nothing noticed (§3.1).

**FA-5 — "an assembled facing passes the instrument (it should trivially)" is true and the plan
treats it as a warning rather than a reassurance.** Two detectors cannot fail at all, and the
`row35snap` readings show constructed geometry scoring exactly 0.0/−0.0. The instrument is a
regression check here; the bars are the turn test and Kabe's eye (§4.1).

**FA-6 — a neutral-albedo frame has no contact shadow, so `pick_floor` cannot measure it.** The
instrument must run on the LIT output, which makes row 37's pass load-bearing for row 36's own
acceptance (§4.1, §6.1). This one is a genuine cross-row dependency and it was not in either row's
text before this plan.

**FA-7 — the t4 evidence carries a warning, not an endorsement.** 4-of-4 at n=4 is p ≈ 0.43, two
different paintings tie on the instrument, and three of the four carry a horizon hold family against
t3's zero — which is exactly the failure an approximate return would cause (§3.3).

**Observation, not an assumption** — `design/batches/row35-snap/sweep.json`'s ten clean-but-unpromoted
walls are a promotion the Navigator routes; promoting them adds ten bottom-smeared frames unless the
§6.3 interface lands first (§5.1).
