# Row 36 — Assembly from established pieces

Row 36 of `design/intention.md`. The target and its done clauses live there; this spec carries the
library's shape, the composition engine, the packet types the emitter gains, the numbers the four
orphaned t4 returns produced when they were finally scored, the validation that is real versus the
validation that is trivial, and the interfaces to rows 37, 35, 25 and B-FLIGHT — spec'd, not built.

**Status: PLAN, SECOND REVISION. Nothing built, nothing dispatched, nothing promoted.**

---

## 0. What this revision changed, and why

The first revision failed its plan critic on three structural blocks. All three are settled below by
Navigator ruling, and in two of them **the ruling invited arithmetic that then went further than the
ruling did.** Both cases are recorded as findings rather than quietly absorbed:

- **F3/F4 → §1.6.** Floors cannot be harvested; the ruling said so and told me to re-verify ceilings
  under the corrected depths. I did. **Ceilings fail the same test as floors** (0 of 51 facings
  clear the demand; 3 of 51 are even isotropic within 1.5×). So the harvest lane keeps **walls
  only**, and the swatch count rises from 4 to 21. The ruling's own words were *"where the numbers
  support it"*; they do not.
- **F1 → §5.1.** The honest customer set is **9 facings, not 31** — all door-only. Twelve more are
  gated behind the carrier sprite families, twelve behind B-FLIGHT, one is a vista.
- **F2 → §2.7.** Row 36 builds a minimal bake-time lighting stub; what promotes is the LIT bake.
- **F7 → §5.2.** The demonstration moves to a room that actually exercises the mechanism, and the
  headline metric moves to one that can fail.

Numbers reproduced from the first revision are unchanged unless marked. Everything re-measured for
this revision is marked **[re-measured]**.

**Findings F8–F11, F13, F15–F18 and F21–F24 reached me as bare identifiers with no accompanying
text.** They are not addressed below and I have not guessed at them — see §11.

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

### 1.2 What the corpus actually supplies — the measurement that decides the whole library

**[re-measured]** The first revision's resolution figures came from one synthetic box and were wrong
about the thing that matters. This revision builds each of the 54 promoted facings' own box from its
own meta (51 succeed; `entrance_approach` E/S/W carry no `px_per_m_at_wall`/storey and are vistas
anyway, §1.9) and measures, per region, the visible surface extent and the **local resolution along
each of that surface's two axes**:

| region | visible extent, axis 1 (m) | visible extent, axis 2 (m) | res axis 1 (px/m) | res axis 2 (px/m) | **anisotropy** |
|---|---|---|---|---|---|
| | min / med / max | min / med / max | min / med / max | min / med / max | min / med / max |
| **wall** | 3.2 / 7.0 / 11.8 | 2.6 / 3.4 / 8.5 | 55.8 / **161.1** / 337.9 | 55.8 / **161.1** / 337.9 | **1.0 / 1.0 / 1.0** |
| **floor** | 3.2 / 7.0 / 11.8 | 0.6 / **3.8** / 15.6 | 242.0 / 294.0 / 388.9 | 117.7 / 150.4 / 219.7 | 1.5 / **2.0** / 2.2 |
| **ceiling** | 3.2 / 7.0 / 11.8 | 0.1 / **1.6** / 8.8 | 64.5 / 203.6 / 346.4 | 31.3 / 117.5 / 214.1 | 1.4 / **1.8** / 2.2 |
| left return | 0.4 / 1.4 / 13.0 | 2.6 / 3.4 / 8.6 | 112.9 / 197.0 / 450.3 | 67.8 / 135.8 / 297.0 | 1.1 / 1.4 / 1.8 |
| right return | 0.3 / 1.2 / 12.9 | 2.6 / 3.4 / 8.6 | 114.5 / 194.8 / 369.8 | 68.4 / 135.4 / 270.2 | 1.1 / 1.4 / 1.7 |

Three things fall straight out of this table and they determine everything below.

**(a) The facing wall's map is a similarity — anisotropy is exactly 1.000 on all 51.** That is not a
coincidence and not a tolerance: it is row 35's own design ruling, which preserves the painted
proportions precisely so that the wall's own map carries no aspect change. **Walls harvest
perfectly.**

**(b) Floors and ceilings are grazing surfaces and cannot be harvested.** To store an isotropic tile
at T px/m the source must supply ≥ T on *both* axes. The demand — the largest resolution any target
view asks of that surface across the corpus — against the best isotropic supply:

| surface | demand | best isotropic supply | median supply | facings clearing demand ÷ 1.5 | facings isotropic within 1.5× |
|---|---|---|---|---|---|
| floor | 485 px/m | 220 px/m | 150 px/m | **0 of 51** | **1 of 51** |
| ceiling | 359 px/m | 214 px/m | 117 px/m | **0 of 51** | **3 of 51** |

Not a marginal failure. **Zero facings** clear the demand for either surface, and a floor harvest is
median 2.0× anisotropic — it would be interpolating one axis by a factor of two while claiming to be
material. The first revision's 1.5× flag would have fired on every single harvest, which is the
critic's F3/F4 and it is arithmetically correct.

**(c) My first-revision visible depths were ~3× too shallow.** I probed one synthetic facing at
240 px/m; the corpus median is 161 px/m, so real walls occupy less of the frame and far more floor
shows — median visible floor depth **3.8 m**, not 1.18 m. Every claim that rested on "the visible
floor is shallow" is withdrawn.

### 1.3 The library split that follows

| slot | count | lane | why |
|---|---|---|---|
| **wall fabrics** | 12 | **HARVEST** (11) + swatch (1) | anisotropy 1.000; 11 have a promoted source, `cross_passage` does not |
| **ceilings** | 8 | **SWATCH** (8) | 0 of 51 clear demand |
| **floors** | 12 | **SWATCH** (12) | 0 of 51 clear demand |
| | **32** | **11 harvested, 21 swatch asks** | |

**Thirty-two surface materials cover the entire twenty-two-room manor** — resolved by running
`voiceFor` over all 88 facings and collecting distinct slot strings. All 14 voices are reached; none
falls through a fallback. That count is unchanged from the first revision; what changed is which lane
each material takes.

Typed id: `<slot>/<material-slug>`, the slug derived from the material string by a pure function,
never typed, so two voices sharing a string share a texture by construction (which is why
`parlour_wainscot` and `parlour_armorial` collapse to one).

### 1.4 Where the table lives, and why it is not a new file

`MATERIALS` is a **new export of `tools/room-voices.mjs`**, keyed by the material string, carrying
what a voice's prose cannot: `{ id, slot, lane, tiling, harvest, scale_contract }`. No existing voice
field changes, so `room-voices.spec.mjs` stays green untouched.

- **Completeness is derived, not typed** (the felt lesson of row 11): a test walks `VOICES` and
  asserts every non-null `walls`/`ceiling`/`floor` string has a `MATERIALS` entry. A future map that
  invents a room type must add a voice, and the moment it does the test demands its material record.
  That is clause 6's acceptance test — *does the next map get this for free?* — answered
  mechanically rather than by intention.
- **Crossing to Python the way the corpus already does it.** `MEASURED_BAND` is authored in JS and
  reaches `row23_lib` as data in a sidecar. Same here: `node tools/room-voices.mjs --emit-materials`
  writes `backdrops/textures/materials.json`, the Python assembler reads it, and a staleness test
  byte-compares a fresh emit against the committed file — the shape of the two existing bake
  staleness tests in `fixtures.spec.mjs`.

`tiling` per material: `{ axis, module_m, mirror }`. Directional material (floorboards, panelling,
joists) tiles by **translation along the grain at a material module** — board 0.25 m, panel 0.80 m,
joist 0.90 m — so a repeat lands on a joint and never mid-board, and **mirrors across** the grain.
Isotropic material (plaster, flags, gravel, brick) mirror-tiles both ways. These modules are craft
numbers and the manifest says so beside them, per row 35's precedent with its two budgets.

### 1.5 Harvest — wall fabrics only, each from a promoted wall Kabe has seen live

For wall material `T`:

1. **Pick the source facing.** Every promoted facing whose voice declares `T` for `walls` is a
   candidate, ranked by §1.7; the winner is recorded with its reason, so *why this wall* is in the
   manifest and not in a transcript.
2. **Build the source box** from the promoted meta:
   `box(corner_x0_px, corner_x1_px, floor_line_y·H − storey·ppm, floor_line_y·H, W/2, horizon_y·H)`,
   refused via `row35_snap.box_refusal` — the same construction, the same refusal.
3. **Choose the harvest window** in surface metres: inside the wall region, clear of every carrier
   (`meta.openings` plus `facingCarriers`) dilated by a stated margin, clear of the anchor band for a
   field harvest, and outside the firelight exclusion (§1.7).
4. **Sample** a regular grid in surface metres through `image(box, "wall", p, q)`, bilinear.
   Deterministic; no model.
5. **Neutralise** (§1.7) and write the tile and its record.

**Wall fabric is harvested as three banded tiles, not one, and this is load-bearing.** The instrument
measures scale off the voice's anchor at exactly 0.95 m. A wall tiled from one patch at an arbitrary
vertical phase would either lose the anchor or repeat it at wrong heights. So:

| band | vertical extent | tiles |
|---|---|---|
| `dado` | floor → 0.95 m − half the anchor's depth | horizontally only |
| `anchor` | the anchor strip at 0.95 m, harvested at its true height | horizontally only |
| `field` | above the anchor → storey | horizontally only |

Vertical position is fixed in metres, so **the anchor lands at 0.95 m on every assembled wall by
construction** — measurability as a property of the assembly, exactly as blueprint §11's wainscot
ruling made it a property of the wall specification. Skirting and cornice, where a voice has them,
are further bands by the same rule.

### 1.6 The swatch ask — now the library's main intake

**21 of the 32 materials are swatch asks**: all 12 floors, all 8 ceilings, and `cross_passage`'s wall
fabric. Orthographic, frontal, even sourceless light, no perspective, no carriers, no shadow.

`node tools/make-scaffold.mjs --emit-swatch --material <id>`. Extension point settled: a new branch
in `main()` beside `--emit-manor`, an `emitSwatch()` beside `emitContentScaffold` (the worked
precedent for a bolted-on packet type with its own image composition, prompt suffix and `PACKET.md`),
and — per `emitFinal`'s own precedent — **a new id-map file, never an edit to `assignment.json`**,
whose blob `scaffold.spec.mjs` asserts has never changed.

**The scale contract (F6) — a swatch with no ruler is unusable and the ask must carry one.** Every
swatch names a ruled physical feature and a count, so px/m is derivable from the returned image
alone, by arithmetic and not by measurement:

> *"Wide oak floorboards laid vertically, each board exactly 0.25 m wide, exactly 8 boards spanning
> the image edge to edge."* → `px_per_m = 1536 ÷ (8 × 0.25) = 384 px/m`.

The feature is the material's own module from `MATERIALS.tiling.module_m`, so the contract is derived
from the same table that governs tiling and cannot drift from it. A returned swatch is verified by
counting the feature — the module's period is exactly what a 1-D autocorrelation of the swatch
recovers — and a swatch whose recovered period misses the declared one by more than a stated
tolerance is refused with its number rather than admitted at a guessed scale. This is the one gate
the swatch lane needs and it replaces the flat-wall levelness gate as the primary check.

**Banded walls need a banded swatch form.** A wall-fabric swatch is not a square tile: it is a **full
elevation of exactly one storey height** with the voice's anchor at exactly 0.95 m, which the
assembler slices into the three bands of §1.5. Its scale contract is the storey itself — the ruled
height every manor room already has — plus the anchor's position within it, so it carries two rulers
rather than one.

**A second, exceptional packet type — `--emit-flat`, one physical wall, frontal, no returns.** Under
the carriers-are-sprites ruling most walls no longer need their own painting, so this is the
exception path, retained because the Captain may rule that a particular wall (built-in joinery, a
painted overmantel) deserves its own elevation. Its meta is an ordinary §5 meta with
`corner_x0_px`/`corner_x1_px` null and `storey_height_m` null, which the existing machinery already
turns into exactly the ask we want: `frameGeometry().bounded === false`, no returns, no ceiling line,
the anchor spanning the full frame. **No change to `frame-language.mjs` is needed.** Its levelness
gate: fit the anchor row separately in the left and right thirds and require agreement, reusing row
35's `MIN_RAMP_SLOPE` reasoning rather than inventing a threshold.

**A returned swatch or flat wall is stored as a texture.** The library holds TYPED tiles (reusable
material) and UNIQUE tiles (one physical wall's elevation), and the assembler consumes them
identically. That unification is what keeps the composition engine small.

### 1.7 Neutrality — the rule, the gate, and what division cannot do (F5)

Row 37 rules that pieces carry material, not illumination. Swatches are neutral by their ask.
Harvested wall fabric is not: the promoted corpus was painted lit.

**Firelit sources are excluded by RULE, not by ranking.** A harvest window whose centre lies within a
stated radius of a lit hearth in the plan is refused outright. Ranking a firelit wall down still
admits it when nothing better exists, and *nothing better exists* is exactly the situation where a
bad tile does the most damage. The radius is derived from the stub's own falloff (§2.7) — the
distance at which the hearth term drops below the ambient — so one number governs both the exclusion
and the relighting, and moving it moves both.

**De-lighting is per-channel division, because luminance division cannot remove a tint.** This is the
critic's F5 and it is correct: dividing a warm-cast region by a scalar luminance field leaves the
cast untouched. So the fitted low-frequency field is fitted and divided **per channel**, which does
remove the cast. Its cost is stated: per-channel division also flattens real low-frequency *material*
colour, so a wall whose oak genuinely darkens along its length comes back more uniform than it is.
That cost is why the firelight rule is primary and division is residual cleanup, not the other way
round.

**The bar has two halves and both are derived.**

- `flattened_pct` — how much luminance had to come out. Division amplifies noise in the dark end and
  cannot recover deep shadow.
- `chroma_drift` — the residual per-channel spread after division, which is what F5 says must be
  gated and was not.

For each: measure the distribution over every candidate window in the corpus and set the admission
bar at the corpus's own best quartile — *as neutral as the best quarter of what we already have* —
**and beneath it an absolute floor**, because a corpus-relative bar admits the best of a bad set. The
floor's derivation: the residual cast a piece may carry is bounded by the tint difference the
renderer's own `key_tint` pull already applies to sprites, which is a number the contract states — a
piece drifting further than that would be visibly a different material from a sprite standing on it.
Both numbers are printed with their clock so row 37 can move them with evidence. No free parameter
enters.

**Honest limit, named:** de-lighting removes a real gradient. A wall genuinely brightens toward a
window, and the flattened tile no longer knows that. Row 37's pass — and until then §2.7's stub — is
what puts it back.

### 1.8 Resolution, and tiling to the view's need

**A correction to the direction I was given, carried forward from revision 1.** `px_per_m_at_bottom`
is not coarser than `px_per_m_at_wall`; across the 54 promoted metas it is **1.26× to 9.41× finer**
(median 2.48×). Floor near the camera is magnified, so the nearest floor is the *finest* demand in
the frame. The requirement I was given is right; the reason is the opposite one.

Corpus figures: `px_per_m_at_wall` 42.1 / 160.0 / 337.9; `px_per_m_at_bottom` 354.2 / 411.9 / 503.3;
floor band below the floor line 102 / 301 / 445 px; `nearest_floor_m` 1.824 / 2.542 / 2.903.

**Floor swatches are asked at 512 px/m** — a craft number with its evidence: the corpus's largest
demand measured two ways is 485 px/m (§1.2) and 503.3 px/m (`px_per_m_at_bottom` max), and 512 is the
next power of two above both. Ceiling swatches at 384 px/m against a 359 px/m demand. Wall tiles at
the largest demand their own slot makes. **Because they are asked rather than harvested, the swatch
lane simply delivers these**, which is the whole reason the ruling moved them.

**Textures tile to whatever the view needs, so the frame bottom is real material by construction and
never an extension.** That is the third motivation's cure, and it is structural: no code path in the
assembler repeats a border pixel, because every output pixel resolves to a surface coordinate and
every surface coordinate resolves into a tile modulo its period.

**The return re-projection's demand, checked against real supply.** **[re-measured]** Returns demand
median 197 px/m along depth and 136 px/m along height (max 450 / 297); wall fabric supplies median
161 px/m isotropic (max 338). So the median demand-to-supply ratio is ≈1.2× and the corpus worst
≈1.33× — inside a 1.5× flag, which is the one place the first revision's optimism survived contact
with the numbers. The build measures it per facing pair with `row35_snap.magnification`'s Jacobian
rather than trusting this paragraph, and refuses over budget with its number.

### 1.9 Storage and manifest (F19)

**Textures live outside `library/`.** `library/` is the replicator's sprite output and a texture is
not a sprite; textures are painted surfaces, so they live with the painted surfaces:

```
backdrops/textures/
  materials.json                     emitted from room-voices.mjs; staleness-tested
  manifest.json                      every tile, its source, its numbers
  <slot>/<material-id>/
    tile.png                         the orthographic albedo tile
    tile.json                        this tile's record
    source-window.png                harvested tiles only: the source frame with the window drawn on it
```

`tile.json`, aggregated in `manifest.json`:

```
id, slot, material            the verbatim voice string this types
lane                          harvest | swatch
band                          dado | anchor | field | null
source_facing                 harvested: "<loc>/<F>", a PROMOTED wall
source_png, source_sha256     digest-pinned, like every reading
source_meta_sha256
packet_id, prompt_sha256      swatch: the ask that produced it
region, window_u_m, window_v_m
why_this_source               the ranking that chose it, with its numbers
scale_contract                { feature, module_m, count, declared_ppm, recovered_ppm, residual }
tile_ppm, size_px, span_m
harvest_ppm_across, harvest_ppm_along        the TRUE resolution, both axes
anisotropy
tiling                        { axis, module_m, mirror }
neutrality                    { flattened_pct, chroma_drift, bar, floor, admitted, firelight_excluded }
carriers_avoided
harvested_at_commit
```

`source_sha256` is not decoration: `promote-backdrop.mjs` refuses a reading whose candidate digest
has moved. The library inherits that discipline — a tile whose source bytes moved is a finding.

### 1.10 Vistas are excluded from assembly, stated (F20)

An `open` facing has no wall plane, no ceiling and no side walls, so there are no five planes to
compose. `row35_snap._snap_once` already refuses them in exactly these terms and the assembler
refuses them the same way, with the same sentence. A vista's geometry belongs to row 29a's far-line
ruler, and **row 38 now owns outdoor seam continuity by sequential seeded generation** — a different
mechanism for a different problem. The three `entrance_approach` facings that carry no
`px_per_m_at_wall` at all (§1.2) are vistas and this is why.

### 1.11 Interim honesty: painted-in carriers during the transition

The 54 promoted walls have their carriers painted in. Two consequences, both stated rather than
discovered:

- **No harvest window may cross a painted-in carrier** (§1.5 step 3); `carriers_avoided` records what
  was dodged. A wall that is *all* carrier (a window range down a gallery) yields no window and loses
  the ranking.
- **The transition state is per wall and the ruling is the Captain's**, exactly as row 37 rules the
  lit-legacy question. A `carriers: "painted" | "sprite"` field on the meta, defaulting to `painted`
  so the 54 need no edit. **This row repaints no wall and takes no per-wall call.**

---

## 2. ASSEMBLY

### 2.1 The engine

`design/plan-draft/measured/row36_assemble.py`, beside `row35_snap.py` and importing it, so the
five-plane math has exactly one home.

```
python3 .../row36_assemble.py --harvest-all [--out backdrops/textures]
python3 .../row36_assemble.py --assemble <loc>/<F> --out <png> [--light] [--acceptance]
python3 .../row36_assemble.py --sweep <status,...>
python3 .../row36_assemble.py --emit-crossfacing <room>
python3 .../row36_assemble.py --synthetic-acceptance
```

For one target facing:

1. **The declared box** from `deriveMeta(plan, loc, facing)` — the plan's own geometry. This is why
   the assembled facing is on-geometry by construction, and §4.1 is honest about what that does and
   does not prove.
2. `assign(tgt, x, y)` for every output pixel → region + `(p, q)` → surface metres.
3. Paint each region (§2.2–§2.5).
4. Write `backdrops/source-assembled/<room>-<F>/albedo.png`.
5. **Light it** (§2.7) → `lit.png`. **This is the promotion candidate.**
6. Measure the lit frame; write the reading to `design/plan-draft/measured/row36asm/<loc>-<F>.json`.
7. `tools/promote-backdrop.mjs --round row36asm --candidate backdrops/source-assembled/…/lit.png`.

**Steps 4–7 are not optional.** `fixtures.spec.mjs:125` reconstructs every promoted wall's promotion
command *from the meta itself* and byte-compares the result, so an assembled facing must be a file on
disk that `camera_id` names, with a committed reading whose `_source_sha256` is that file's digest.
**There is no side door into the store.** Row 35 walked this exact path: `guest_chamber/E` and
`servants_hall/W` are promoted today from `backdrops/source-snapped/`, and `snap.spec.mjs:254–304` is
the working template for staging it in a scratch tree.

### 2.2 Floors and ceilings — anchored to the FLOOR SLAB (F14)

Kabe's second motivation is *"I have one room as you turn ceiling floor and wall change."* The cure:

> **Every surface is sampled in GLOBAL PLAN coordinates in metres, never in frame coordinates —
> and for floors and ceilings the anchor is the FLOOR SLAB, not the room.**

A floor pixel's `(u_m along the wall, depth-from-wall)` converts through the room rect and the
facing's compass orientation into plan `(x, y)`, and *that* indexes the tile — with the tile origin
and grain axis fixed **per storey** (`plan.floors[].id`, `ground` / `upper`), not per room.

Two consequences, and the second is the critic's F14:

- Two facings of one room showing the same floor sample identical tile coordinates — not
  approximately, identically. Board direction, joint phase and pattern continue around the turn
  because they were never per-facing quantities.
- **Two adjacent rooms on one storey sharing a floor material have continuous grain across the
  threshold**, because they share the slab's origin. Where the material *changes* at a threshold the
  seam is a real material change and honest — a flagged kitchen meeting a boarded parlour should show
  a joint. The record says which of the two any given threshold is, so a seam is never a surprise.

**Wall fabric origin (F12) — reading B, stated.** A wall belongs to one room's interior, so its
horizontal origin is **the room rect's `(x0, y0)` corner, with the along-wall coordinate walked
around the room's perimeter in a fixed rotational sense** (clockwise viewed from above). Phase is
then a continuous function of perimeter distance, so panelling meets correctly at every internal
corner and the choice is a rule rather than a per-wall decision.

**Determinism.** Where phase jitter breaks a wallpaper read, it is seeded by the **slab id for floors
and ceilings and the room id for walls** — never by the facing. A facing-seeded jitter would silently
reintroduce the very disease this row cures. §12.2 holds, and the test asserts the seed's *scope*,
not merely that rendering repeats.

### 2.3 Side returns — the neighbour's promoted facing-plane, re-projected

For target facing `F` of room `R`, the returns are physical walls of `R` that `R`'s other facings
paint frontally. Where the neighbour is promoted:

`return pixel → (depth-from-wall, height) → plan (x, y, z) → the neighbour wall's own surface
coordinates → the neighbour's box, wall region → its image pixel.`

Both ends are `region_matrix` evaluations, so the composition is a plane-to-plane homography and it
is exact. Room rects are axis-aligned and every facing carries `standpoint`, `wall_line`,
`wall_width_m` and `camera_wall_m`, so every metre comes from the plan.

Where the neighbour is not promoted, the return is the room's wall fabric, tiled in the same
perimeter coordinate the neighbour's own facing wall will use when assembled — so the two agree in
advance and painting the neighbour later does not move the return's phase.

Cost: §1.8's measured 1.2× median, 1.33× corpus worst.

### 2.4 The facing wall, and the door void the assembler paints (F1)

| case | source | model calls |
|---|---|---|
| plain fabric (the general case now) | the voice's banded wall fabric, perimeter-anchored | 0 |
| this physical wall has a promoted frontal painting | harvest its wall region as a UNIQUE elevation tile and re-project | 0 |
| the Captain rules this wall deserves its own elevation | `--emit-flat` | 1, once, ever |
| the material is missing from the library | `--emit-swatch` | 1, once, ever, reused everywhere |

**The assembler paints the door void itself, from plan geometry.** This is the F1 ruling and it is
arithmetic, not generation. A plain assembled wall would otherwise trip row 27's promotion clause —
the plan rules a way through and the painting shows none — which is precisely what refused
`great_hall/N` and `library/S` after the snap.

The construction: an unlit rectangular void at the plan's own aperture rect, converted to wall-local
metres by `facingCarriers` and drawn into the assembled frame through the wall region's own map at
the declared geometry. **The standing unlit-door doctrine already says the void should be dark** —
row 27's own lesson, that `door_measure.py`'s blind spot is a *lit* doorway — so painting it dark is
obeying the doctrine rather than bending it. Three things follow by construction rather than by
tolerance:

- `door_measure.py` reads a maximally-stable dark run and will find this rect, because the assembler
  drew it as one: dark, textureless, ≥0.40 m wide, head between 1.40 m and the storey.
- **The click target coincides with the painted door by construction**, which is row 27's whole
  question — the aperture rect and the painted void are the same rectangle, computed once.
- The acceptance run re-measures the void and compares the read-back rect to the drawn one. That
  comparison is §5.3's headline metric because it can genuinely fail.

Carriers other than doors — windows, hearths, candle-holders — are **not** painted. They are library
sprites placed by the plan (§6.2), which is why walls carrying them are not yet customers (§5.1).

### 2.5 Seams

Two different claims needing different proofs.

**Within a frame — algebra, already proven.** Two regions share an edge exactly where one parameter
is pinned, and along that edge both parameterisations name the same physical line, so both matrices
evaluate to the same image point. `row35_snap.seam_samples` already emits both mappings of every
shared edge so a test computes the disagreement instead of being told there is none. Assembly
inherits it unchanged and re-runs it on assembled boxes.

**Across frames — construction, and this is the row's own claim.**

- **The coordinate agreement test.** For each adjacent facing pair, sample N points on the shared
  physical surface from both frames and assert the plan-metre coordinates agree to < 1e-6.
  Arithmetic, milliseconds, and the test that goes red the day anyone anchors a texture to a frame.
- **The pixel agreement test.** Re-project facing A's right-return region into B's frame and measure
  per-pixel agreement over the overlap. **The tolerance is not chosen**: the control is a
  double-resample of the same source through the identity, measured on the same frame, and the bar is
  that cross-facing disagreement does not exceed it by more than the resampling the two paths differ
  by. No band is invented.

### 2.6 Flights are not assembly's, stated (F1)

A wall whose view draws a staircase carries a `flights` entry, and row 32's flight clause refuses a
promoted meta that has none. The assembler cannot paint a flight — it is a solid standing on the
floor, not a surface — so:

- **The assembled wall takes its meta `stairs` from B-FLIGHT's attachment machinery.** That work is
  in flight and **its branch is not in this repository yet** (no `*flight*` branch exists at
  `5dd7d1c`); its interface is consumed, not defined, here.
- **Its painted flight arrives later as a sprite**, in rows 4/37's lane.
- **Until both land, stair-bearing walls are not assembly customers.** Twelve facings, enumerated in
  §5.1.

### 2.7 The lighting stub — bake-time, and what promotes (F2)

`design/plan-draft/measured/row36_light.py`, imported by the assembler and runnable standalone.
**Never `src/`** — §9.3's fence survives, and this is a bake-time tool exactly like the snap.

- Ambient key at the room's level, plus a per-source radial falloff from the plan's own hearth and
  window positions, draped by each source's distance and side relative to the facing.
- Crude is fine. Deterministic, seeded, pure in (world, staging, meta, plan).
- **The assembly emits both. `albedo.png` is the library's asset; `lit.png` is what promotes.**

**The stub's output contract — the interface row 37 inherits, and it is set by what the promotion
path already needs, not by taste.** `promote-backdrop.mjs` derives `key_tint` and `key_dir` from the
measurement's `_light`, and `row23_lib`'s detectors read light rather than material, so the stub
must produce all four of:

1. **Contact darkening at every plane junction**, because `pick_floor` reads a luminance *minimum* at
   the wall's foot. Without it that detector reads noise on a neutral frame — this is the deadlock
   F2 names, and the contact shadow is also intention quality #2, so the fix and the quality are the
   same act.
2. **A resolvable step at the wall/ceiling junction**, so `pick_ceiling` and `ceiling_ramp_vp` have
   an edge to fit.
3. **A dominant direction**, so `key_dir` means something rather than being an artefact of a flat
   field.
4. **A stable `key_tint`** over the tint patch.

Row 37 replaces the stub with the runtime pass and **inherits exactly this contract**; a pass that
satisfies it is drop-in, and one that does not breaks promotion rather than merely looking different.

### 2.8 The honest limits, all of them, in one place

1. **Floors and ceilings cannot be harvested** (§1.2) — hence 21 swatch asks. The swatch lane's own
   risk is that a swatch comes back at the wrong scale, which §1.6's scale contract gates.
2. **Repetition.** A tiled floor cannot show the one worn patch by the hearth, and an 8.7 m kitchen
   floor from a 1.5 m tile is many repeats. The cure for *"walls don't match"* must not become
   *"everything is identical"* — Kabe has caught repetition once already, on the window (finding
   (b)). Mitigations: ask the largest swatch the frame allows; mirror across the grain; slab-seeded
   phase; slow low-frequency modulation. **This is the risk most likely to lose at the flip test and
   the capture set puts it in front of Kabe deliberately** (§4.4).
3. **Per-channel de-lighting flattens real material colour** (§1.7) and cannot recover deep shadow.
4. **Approximate re-projection can destroy the junction the horizon instrument reads** — not
   speculation; it is what the t4 evidence shows (§3.3).
5. **An assembled facing passes the instrument nearly by construction** (§4.1).
6. **The lighting stub is crude by design** and a room lit by it is not a room lit by row 37.
7. **Page weight.** `backdrops/baked.js` is 35.7 MB for 54 paintings, ~660 KB each. Assembly makes
   all 88 facings generable; painting all 88 takes the page past ~58 MB. Not this row's to fix, and
   named because assembly is what makes it reachable.

---

## 3. THE FIRST EVIDENCE — the four orphaned t4 returns, scored

*(Unchanged from revision 1; the critic reproduced these numbers.)*

### 3.1 The scoring, and a defect found while doing it

The four content-scaffold returns dispatched on the row-23 NULL trigger — `b912746e`, `f8c180d2`,
`ad04dc51`, `0cbdea31`, all on `study/N`, recorded in
`design/plan-draft/measured/row23/assignment-2.json` — were painted, never measured.

**`measure.py --round row23` cannot run today.** It passes
`dict(pick_floor=…, module_in_bands=…)` as its `picks`, and rows 32/35 grew `measure_candidate` a
promotion half that reads `picks["EYE_RANGE"]`. It dies on `KeyError: 'EYE_RANGE'` at
`row23_lib.py:598`. **That is why nobody scored these: the instrument path that produced the other 24
readings rotted, and no test covers it.** The one-line fix (pass the full picks set, as all three
other callers do) is in this row's build, with a case that goes red without it.

I scored all 20 of `study/N`'s returns with the full picks against the Kabe-ruled `cand5ref`
reference, joining technique to id at table time. Nothing was written into the repo.

### 3.2 The numbers

| tech | n | camera PASS | hold families | median \|Δfocal\| % | median \|Δeye\| % | carrier found |
|---|---|---|---|---|---|---|
| lens (unassigned) | 4 | 3 | 0 | 3.91 | 1.47 | 0/4 |
| t1 frame only | 4 | 2 | 1 | 7.27 | 5.55 | 0/4 |
| t2 labelled scaffold | 4 | 2 | 1 | 8.10 | 4.88 | 0/4 |
| t3 scaffold + prose | 4 | 3 | 0 | 4.47 | 4.51 | 0/4 |
| **t4 content-scaffold** | **4** | **4** | **3** | **4.75** | **3.20** | **0/4** |

Per roll: `b912746e` PASS, 764.7 px (−6.70 %), 1.166 m (−1.47 %), `suspect-painting`; `f8c180d2`
PASS, 805.9 (−1.67 %), 1.219 (+3.07 %), `unfitted-horizon`; `ad04dc51` PASS, 796.7 (−2.79 %), 1.222
(+3.33 %), no hold; `0cbdea31` PASS, 755.5 (−7.82 %), 1.255 (+6.05 %), `unfitted-horizon`.

### 3.3 What it says, and what it does not

- **t4 is the only arm on this wall to pass the camera gate 4 of 4**, with the best median eye
  deviation of the four techniques.
- **It is not a separation and the plan says so before anyone quotes it.** 4-of-4 against t2's 2-of-4
  at n = 4 is Fisher p ≈ 0.43. Row 34 then spent 68 rolls confirming this corpus does not separate at
  these sample sizes. **No recipe is crowned by these four numbers.**
- **The instrument ties two different paintings.** `f8c180d2` (t4) and `7432e756` (t3) have different
  digests and identical readings — 805.9 px, 1.219 m. Both anchors landed on the same integer rows.
  That bounds what any camera-arm comparison on this wall can resolve.
- **The warning, and it is the useful half.** Three of t4's four carry a horizon hold family against
  t3's zero. The t4 packet says plainly that its return was *"column-sliced, not a full homography …
  an approximation"* — exactly the thing that leaves a junction `ceiling_ramp_vp` cannot fit. **Row
  36's re-projection is a true homography and must be measured against precisely this failure**: the
  acceptance run reports fitted ramp slopes and hold family for every assembled facing, and a rise in
  `unfitted-horizon` against this baseline is a finding.
- The carrier edge detector resolved nothing on any of the 20, confirming blueprint §11b(c).

These go into `misses.jsonl` under a `row36-t4` round, which is where the done clause wants them.

### 3.4 The bottom-of-frame smear, measured

Smear signature — trailing frame-bottom rows whose row-to-row mean absolute change is under 1/255.
Edge extension has exactly zero row-to-row change by construction, so the test cannot be fooled by a
dark floor.

**Only 2 of 54 show it, and they are precisely the two snapped-and-promoted walls:**
`guest_chamber/E` (26 flat rows) and `servants_hall/W` (21). Every other painting: 0.

The diagnosis I was handed is **confirmed for the snap's reveal budget and refuted as a description
of the other 52 walls.** The Captain said *"many of the rooms"*, so I looked for the mechanism he
actually saw:

> `src/renderer.js:1310` — `ctx.drawImage(off, 0, H - 1, W, 1, dx, dy + dh, dw, bot)`

**The destination frame's last row, stretched downward, inside every through-doorway.** Row 25(d)
measured this class already: a through-view composite is 22–38 % destination and the rest edge
extension, with single-pixel-derived blocks totalling 17 % of the picture. **47 of the manor's walls
carry a door**, which fits *"many of the rooms"* — and fits his next sentence: *"we need to address
this with proper size source images which I trust we will have when we assble panels."*

- Assembly cures the class by construction wherever it composes (§1.8).
- **The through-view fix is row 25's, not this row's.** §6.3 specs the interface.
- **A live-capture census is act 1 of the build**, over all 88 facings as the page draws them, so the
  claim is measured where Kabe was looking.

---

## 4. VALIDATION

### 4.1 The instrument is a regression check, not a quality bar

An assembled facing is constructed at the declared geometry, so the camera gate is
near-tautological — every one of the 14 `row35snap` readings, the same kind of constructed geometry,
reports `delta_focal_pct: 0.0`, `delta_eye_pct: -0.0`, no hold family, where the `manor` round ran
252 PASS / 91 FAIL / 4 WITHHELD on generated frames.

Worse, two detectors **cannot fail by construction**: `pick_floor` returns `argmin` over the floor
bracket and `module_in_bands` returns `argmin` over the rail band, so both always return a row. On a
surface with no real anchor they return a texture seam and call it 0.95 m.

**The instrument proves no bug; it does not prove quality.** What can still genuinely fail, and what
the acceptance run reports per facing:

| detector | can it fail on an assembly? | what it needs |
|---|---|---|
| `door_measure` | **yes** | the painted void (§2.4) — and this is the headline metric |
| `find_corners_recession` | **yes** | oblique structure on the returns, which projection creates automatically |
| `ceiling_ramp_vp` | **yes** | ≥25 usable junction columns each side; the t4 warning, and the stub's contract item 2 |
| `carrier_edges` | yes | resolvable edge pairs; unread on this corpus already |
| `pick_floor`, `module_in_bands` | **no — always return a row** | nothing; hence §1.5's banded fabric and the stub's contract item 1 |

### 4.2 The real bar 1 — the flip test on turning

Beyond §2.5's two agreement tests:

- **Same-surface identity across the turn.** For each assembled room, capture all four facings and
  assert every physical surface appearing in two of them derives from the same tile at the same plan
  coordinates — reported as a table, per room, per surface.
- **The corner strip comparison, as a picture.** For each adjacent pair, a side-by-side of A's
  right-edge strip and B's left-edge strip, which depict the same physical wall. The test measures
  the seam; Kabe judges it.

### 4.3 The real bar 2 — Kabe's eye

The material tile sheet goes to Kabe as *direction* when the library first exists; the assembled
rooms go as a *batch*. **Every batch names the commit its frames were rendered from and the capture
script is committed beside them** — row 20's scar, this project's worst named defect. The batch
carries the row-33 clock.

### 4.4 The capture set proposed for Kabe

One capture spec everywhere, §12.6's: scene canvas at native 1536×1024, Playwright element
screenshot, cold `file://`, no chrome, no hover.

1. **The turning set** — the demo room, all four facings in turn order, before and after.
2. **The corner strips** — four adjacent-pair strips, before and after.
3. **Both lighting states** — the assembled room raw-neutral and under the stub. The look judgment
   must be of the architecture, not of the flatness.
4. **The repetition sheet** — the largest assembled floor and ceiling, whole frame, judged where
   tiling is most likely to read as wallpaper. Put in front of him deliberately because it is where I
   expect to lose.
5. **The painted door** — the assembled void beside the plan aperture and a real click landing.
6. **The bottom band** — the worst bottom-smear facing before and after.
7. **The tile sheet** — every texture as a flat swatch with its source or its packet named on it, so
   *"each texture's source wall cited"* is something Kabe can see rather than read.
8. **The honest nothing** — one facing the assembler refused, with its number.

---

## 5. TARGETS

### 5.1 The honest customer set — 9, not 31 (F1)

**[re-measured]** A facing is a customer only if it is genuinely unpromoted **and** its wall trips no
clause the assembler cannot satisfy. Attributing every plan carrier to its wall and crossing that
with `run-state.json` and the store:

| bucket | n | why |
|---|---|---|
| already promoted | 54 | not customers |
| **CUSTOMERS — door-only, unpromoted, no flight, no vista** | **9** | buildable now, complete |
| gated: carriers beyond a door (window / hearth) | 12 | assemblable, but would ship without those features until the sprite families land — Kabe's look call, not a gate |
| gated: flight in the room | 12 | B-FLIGHT's lane (§2.6) |
| excluded: vista | 1 | §1.10 |

The nine, with their run-state status:

`closet_chamber/S` (parked) · `garden_room/S` (held) · `great_hall/E` (parked) · `great_hall/W`
(retry) · `hall/N` (held) · `hall/S` (held) · `hall/W` (admitted-not-promoted) · `kitchen/N` (held) ·
`study/E` (not in run-state)

**The first revision's "31 first customers" is withdrawn.** It counted every held/retry/parked facing
without asking whether an assembled wall could clear promotion, which is exactly the deliverable
collapse F1 names. It also proposed attacking "the 8 featureless walls" first — **all 8 are already
promoted**, so that order of attack was empty.

**Order of attack, rebuilt.** `great_hall` and `hall` have **zero promoted facings between them**, so
they can harvest neither their own wall elevations nor their returns, and they are the same two rooms
whose voices supply the materials the corpus cannot harvest (§1.3). They go last, behind their
swatches. So:

1. `kitchen/N`, `study/E`, `garden_room/S`, `closet_chamber/S` — each in a room with three or two
   promoted facings, so returns re-project from real pixels.
2. `hall/N`, `hall/S`, `hall/W`, `great_hall/E`, `great_hall/W` — behind the `cross_passage` and
   `hall_state` swatches.

### 5.2 The demonstration — a room that exercises the mechanism (F7)

**`kitchen` is the demonstration room**, and `buttery_pantry` — the first revision's choice — is
withdrawn. Buttery is fully promoted, so all four of its walls would be *harvested lit elevations*
re-projected onto declared geometry: it would prove the snap, not the assembly. It exercises no plain
wall, no painted void, no swatch floor and no stub.

`kitchen` exercises every mechanism the row claims:

| mechanism | how kitchen exercises it |
|---|---|
| a **plain assembled wall** | `kitchen/N`, unpromoted, held, door-only |
| the **painted door void** | `kitchen/N` carries a door and nothing else |
| **re-projected returns from promoted neighbours** | E and W are both promoted |
| **swatch floor and ceiling under the stub** | `service` voice: large worn stone flags, smoke-darkened joists |
| **the repetition risk, at its worst** | 8.0 × 8.7 m — the largest floor among the candidates |
| **harvested wall fabric** | `service` walls, harvestable, anisotropy 1.000 |

Second candidate offered for Kabe's choice: **`study/E`** — the row-23 probe wall with the richest
prior measurement in the project (its cand-6 reading is a stated reference, its door detector is a
tier-1 ruler, and its plan-vs-reflex carrier separation is measured at 224.6 px), and the wall row 27
names as the one that forces the aperture-versus-ruler ruling. Its room has two promoted facings, so
one return re-projects and one comes from fabric — which exercises both return paths in one frame.

### 5.3 The headline metric, which can fail (F7)

**The first revision's headline — adjacent-facing floor-scale spread — is withdrawn as a headline.**
It is guaranteed to go to zero: all four facings are built at the declared geometry, so the metric
cannot fail and therefore cannot be evidence. It is kept as *diagnosis* only, because it is what
identifies the disease:

| room (all 4 facings promoted) | floor-scale spread | eye spread |
|---|---|---|
| `buttery_pantry` | 21.52 % | 0.404 m |
| `dining_parlour` | 18.35 % | 0.385 m |
| `master_bedchamber` | 15.76 % | 0.280 m |
| `solar` | 15.19 % | 0.214 m |
| `servants_hall` | 8.59 % | 0.147 m |
| `muniment_room` | 5.07 % | 0.240 m |
| `guest_chamber` | 4.56 % | 0.078 m |

**The headline metric is the door-void round trip**, and it can fail in three independent ways:

> The assembler draws the void at the plan's aperture; `door_measure.py` re-reads it off the lit
> frame; the read-back rect is compared to the drawn rect; and a real pointer click in a real browser
> is checked to land inside it.

It fails if the void is drawn wrong, if the lighting stub washes it out so the dark-run detector
cannot resolve it, or if the aperture and ruler spaces diverge the way row 27 says they can. Beside
it, two more that can fail: **the hold-family rate on the acceptance re-measure** against §3.2's t4
baseline (corners and ramp are real detectors on assembled pixels), and **the cross-facing pixel
agreement** against its resampling control (§2.5).

### 5.4 Adjacent, and explicitly not mine to route

`design/batches/row35-snap/sweep.json` reports 12 walls that re-measure completely clean after the
snap, of which only 2 are promoted. That is a promotion the Navigator sequences, not an assembly. I
name it because **promoting those ten would add ten more bottom-smeared frames** (§3.4) unless
§6.3's interface lands first.

---

## 6. INTERFACES — spec'd, not built

### 6.1 Row 37

**What row 36 gives row 37:** the neutral `albedo.png` per facing and every tile in
`backdrops/textures/`; the five-plane geometry at no new cost, since the box is already derivable
from the shipped §5 meta as
`(corner_x0_px, corner_x1_px, floor_line_y·H − storey_height_m·px_per_m_at_wall, floor_line_y·H,
W/2, horizon_y·H)` — row 37 re-runs `assign()` in JS and gets per-pixel plane id and surface metres,
**with no new meta field for this**; the stub and its output contract (§2.7), which row 37's runtime
pass inherits; and `light_sources: [{ kind, id, plane, u_m, v_m, x_px, y_px, w_px, h_px,
distance_m, facing_side }]`, derived from `plan.fireplaces`, `plan.windows` and `plan.openings` —
the one thing only the assembler computes cheaply, because it already converts every pixel to plan
coordinates. `facing_side` carries whether a source is in front of or behind the viewer, which is
what the Captain's *"a lit fireplace on the left … I turn around it may illuminate the right side
slightly better"* needs.

**What row 36 needs back:** the four contract items of §2.7, and a ruling on `key_dir`/`key_tint`
derivation for stub-lit and neutral frames. Row 36 hits that and does not decide it.

**Meta additions** — `neutral`, `carriers`, `light_sources` — mean `META_ALLOWED` in
`tools/validate-fixtures.mjs` grows, and unknown keys are a hard refusal
(`[row11:meta.unknown_key]`). Named so it is not discovered at bake time.

### 6.2 The sprite library

**Row 36 holds SURFACES** (wall fabrics, floors, ceilings); **the §6 sprite library holds CARRIERS**
(the window family, the fireplace family, candle-holders, door leaves). Those are the row-4
replicator lane's output and **this row builds none of them**. The interface exists already: a carrier
sprite is placed exactly as staging places furniture, from the plan's own rects via `facingCarriers`
— the same function the scaffold already stamps from.

**This retires the repeated-window disease structurally.** Kabe's finding (b) — *"this same window
everywhere?"* — was answered at row 29 by varying the *ask*. Under the sprite rule it is answered by
construction: one window family, plan-placed, variant-varied per instance, and the wall behind it
carries no window at all. Row 29's variety machinery becomes the sprite family's variant axis.

**The twelve gated facings of §5.1 are the customers this unlocks**, which is the cleanest measure of
what that lane is worth.

### 6.3 Rows 35, 25 and B-FLIGHT

- **Row 35's reveal budget.** Once a room has assembled floor and ceiling textures, the snap's
  bottom-reveal fills from the room's own material rather than repeating a border pixel — turning the
  100 px budget from a refusal into a fill, and retiring the smear on `guest_chamber/E` and
  `servants_hall/W`.
- **Row 25(d)'s through-view.** A destination assembled at the extent the aperture demands removes
  the edge extension entirely. Row 25's done clause owns the choice; row 36 supplies the capability.
- **B-FLIGHT.** Consumed, not defined (§2.6). Its branch is not in this repository at `5dd7d1c`, so
  the build checks for it before touching the twelve stair facings and does not block on it.

---

## 7. PROMPT IMPLICATIONS — every place the ask changes

Row 37 takes the lighting language out and the carrier rule takes the carriers out. Every site
flagged; **this row changes none of them without row 37's build, and the list is the handoff.**

**`tools/make-scaffold.mjs`, the production composer `manorPrompt`:**

| line | text | change |
|---|---|---|
| 1394 | *"Image 1 is the exact reference for painted MEDIUM, palette, light quality"* | drop *light quality* |
| 1452 | *"Overhead is open sky … and daylight falls from it onto everything"* | neutral rewrite |
| 1461–1462 | *"…deep warm browns, cool ambient light, gentle natural falloff."* | the ambient key leaves |
| the carrier block (`CARRIER_SENTENCE`, `windowLines`, fireplace ticks) | | carriers leave the ask entirely |

**The experiment composer `promptFor` / `TECHNIQUES`** (1043, 1083, 1106–1107) carries *"a small
lively lit wood fire"* and *"cool ambient light from the right, localized amber firelight"*. These are
row 23/34 experiment fixtures and `evolution.spec.mjs` pins arm text byte-identically — **changing
them would move a closed experiment's record**, so they stay, marked historical.

**`make-scaffold.mjs:2225`**, the t4 suffix — *"the same oak, the same boards, the same plaster, the
same light"* — is superseded: assembly inherits pixels rather than asking a painter to match them.

**`frame-language.mjs:419–421`**, the stair-void — *"deep unlit shadow … no light source beyond the
end of the stair"* — describes a VOID, not a light. It stays, said as absence of material.

**`design/references/style-seed-warm.png`** is Kabe's approved seed and it *is* a lighting reference —
its name says so. Under row 37 it either gains a neutral sibling or its light is explicitly
disclaimed. **Swapping a Kabe-approved artifact is his call**, and this row carries the question
rather than answering it.

**`prompt_lint.py`** gains the clause that makes the rule impossible to forget: an ask carrying
lighting language, or naming a carrier, is refused before an image exists. That clause belongs to row
37's build; row 36 states it so the seam is not lost.

---

## 8. THE GENERATION-COUNT ARITHMETIC, restated honestly

The Navigator has already corrected the row's own `~30 unique walls` figure at `16d3a61`. This
revision corrects **my** figure the same way: the first revision said 4 new model calls. **It is 21**,
because floors and ceilings cannot be harvested (§1.2).

| | today | under assembly |
|---|---|---|
| full frames asked | 88 | **0** |
| rolls actually spent to promote 54 walls | **232** `generate.roll` records, **median 42 min** (`timings.jsonl`, n=232, p50 2516 s, p90 4802 s) | — |
| distinct surface materials the manor needs | — | **32** |
| harvested from already-promoted walls | — | **11** (wall fabrics; anisotropy 1.000) |
| **new model calls — swatches** | — | **21** (12 floors, 8 ceilings, 1 wall fabric) |
| unique wall elevations, if the Captain rules any deserve one | — | 0 required; 1 call each, once, ever |
| carrier sprites | painted into 76 walls, 4× over | ~4 families, row 4's lane |
| everything else | — | arithmetic; `snap.wall` runs at **11.9 s median** (n=51) and assembly is the same order |

**88 full frames and 232 rolls → 21 swatch asks**, each trivial for a generator, each reusable
forever and across buildings. For the next building (row 31's Test Build 2), if it shares this
material vocabulary: **zero** — clause 6's acceptance test answered with a number.

Evidence: 88/80/4/4 facings and 76/8/4 carrier attribution from the plan by script; 32 / 11 / 21 from
`room-voices.mjs` resolved over every facing crossed with §1.2's anisotropy test; 232 rolls and
2516 s from the committed timings ledger; 54 promoted from the store; 11.9 s from row 35's clock.

**Three honesties.** It counts *asks*, not quality — 21 swatches that come back wrong are 21 more
swatches. The 11 harvests are only free if their windows clear §1.7's neutrality bar and firelight
rule; each failure converts to a swatch, and the build reports the conversion count rather than
assuming zero. And the swatch count rising from 4 to 21 is not a cost the row discovered — it is the
first revision's error being corrected.

---

## 9. BUILD ORDER, TESTS, EDGES

### 9.1 Order

1. Fix `measure.py --round row23`'s picks; land the t4 readings into `misses.jsonl` as `row36-t4`.
2. Live-capture smear census over all 88 facings (§3.4).
3. `MATERIALS` + `--emit-materials` + the completeness and staleness tests.
4. The wall harvester; the neutrality and anisotropy distributions printed; the tile sheet to Kabe as
   *direction*.
5. `--emit-swatch` with its scale contract; the 21 asks; the period-recovery gate.
6. The lighting stub (§2.7) against its four contract items.
7. The assembler: floors and ceilings first (the turn cure), then returns, then plain walls, then the
   painted door void.
8. `kitchen/N` assembled and promoted; the demo room's four facings; the batch.
9. The remaining eight customers, `hall` and `great_hall` last.
10. `--emit-flat` only if the Captain rules a wall needs it.

Gears: 1–3 are mechanical. 4–7 are the load-bearing build.

### 9.2 `tests/playwright/assembly.spec.mjs`

Modelled on `snap.spec.mjs`, which proves a construction rather than a verdict:

- **seams** — both regions' mapping of every shared edge, computed in the test from emitted numbers.
- **cross-facing coordinate agreement** — §2.5; the test that catches frame-anchoring.
- **cross-facing pixel agreement** — §2.5, against a resampling control, no invented band.
- **cross-threshold floor continuity** — F14: two adjacent rooms sharing a slab and a material agree
  on grain and phase at the threshold.
- **synthetic acceptance** — a room assembled from planted tiles at a KNOWN geometry, read by the
  standing instrument; precedent `row35_snap._read_planted`, the existing answer to *measure a frame
  that is in no manifest*.
- **the anchor lands at 0.95 m** — red if a band is tiled vertically.
- **the swatch scale contract** — a swatch whose recovered period misses its declared module is
  refused.
- **seed scope** — slab seed for floors, room seed for walls, never facing.
- **the painted door void** — drawn rect versus read-back rect, plus a real click, per §5.3.
- **the stub's four contract items** — each asserted on a stub-lit assembled frame.
- **refusals** — over-stretch, missing material, vista, flight-bearing wall: each with its number and
  its own `[row36:…]` clause token, one token, one emit site.
- **the delete-green cases** — one per named mechanism, so `guards.spec.mjs` can hold the arms.

### 9.3 Edges — what this must not touch

- **No runtime code and no page bytes.** Assembly and the lighting stub are build-time; output is an
  ordinary promoted painting. `src/` is untouched — the F2 ruling preserves this fence explicitly.
- **No band moved, no bracket widened.** `MEASURED_BAND` stays where it is authored.
- **No promotion clause changed.** A snapped wall was not automatically promotable and neither is an
  assembled one; the door, stair and vista refusals stand — §2.4 and §2.6 satisfy them rather than
  relaxing them.
- **`assignment.json` is never edited** — new packet types write new id-map files.
- **No wall repainted, no per-wall legacy call taken** (§1.11).
- Feels the change: `validate-fixtures.mjs` (`META_ALLOWED`), both bakes, `fixtures.spec.mjs`'s two
  staleness tests, `room-voices.spec.mjs`, `guards.spec.mjs`.
- **`geometry.spec.mjs:173` hardcodes `MEASURED_REFERENCE_PX`** rather than calling
  `measuredLensBand(meta.camera_reference)`. It passes today only because both LIT-measured walls are
  `"measured"`. Promoting a `"ruled"` wall into `study/` or `hall/` turns it red — and `study/E`,
  `hall/N`, `hall/S` and `hall/W` are all on my customer list. Named now.

### 9.4 Clock

Full suite: **1648 passed / 70 skipped, 8.9 min**, green before I started. Inner loop is
`fixtures.spec.mjs` on chromium alone — both staleness tests, all 54 walls re-promoted and
re-encoded — at **43 s**. One full suite at the end.

Per clause 5 every change lands with its before/after: harvest, swatch and assemble times on the
row-33 clock; the hold-family rate against §3.2's t4 baseline; the door-void round-trip result; the
smear census before and after.

---

## 10. FALSE ASSUMPTIONS AND CORRECTIONS

Carried from revision 1, still standing:

**FA-1** — the row's `~88 full frames to ~30 unique walls` does not hold; 76 of 88 walls carry a
carrier and 8 are featureless. **Folded into the row by the Navigator at `16d3a61`.**

**FA-2** — `px_per_m_at_bottom` is finer than `px_per_m_at_wall`, not coarser (§1.8).

**FA-3** — the bottom-smear diagnosis is right about a mechanism affecting 2 of 54 walls; the one the
Captain most likely saw is `renderer.js:1310` (§3.4).

**FA-4** — `measure.py --round row23` is broken and no test covers it (§3.1).

**FA-5** — the instrument passing an assembled facing is a warning, not a reassurance (§4.1).

**FA-6** — a neutral frame has no contact shadow, so `pick_floor` cannot measure it. **Settled by the
F2 ruling**: the stub supplies it, the lit bake promotes, and the contact shadow is also intention
quality #2 (§2.7).

**FA-7** — the t4 evidence carries a warning, not an endorsement (§3.3).

New in this revision, all three from my own first draft:

**FA-8** — **floors and ceilings cannot be harvested from this corpus.** 0 of 51 facings clear the
demand for either; a floor harvest is median 2.0× anisotropic (§1.2). My first revision proposed
harvesting both and would have shipped interpolated material calling itself measured.

**FA-9** — **my visible-depth figures were ~3× too shallow**, because I probed one synthetic box at
240 px/m against a corpus median of 161 px/m (§1.2c). Every claim resting on "the visible floor is
shallow" is withdrawn.

**FA-10** — **the customer set was 31 and is 9**, and the proposed order of attack — "the 8
featureless walls first" — was empty, because all 8 are already promoted (§5.1).

---

## 11. WHAT I COULD NOT ADDRESS

The relay carried full rulings for **F1, F2, F3+F4, F5, F6, F7, F12, F14, F19 and F20**, all
addressed above. It also directed me to fold **F8, F9, F10, F11, F13, F15, F16, F17, F18, F21, F22,
F23 and F24** *"as the critic states them"* — but the critic's report was not included in the relay,
is not committed anywhere in the repository, and I hold no mailbox seat to fetch it from.

**Thirteen findings are therefore unaddressed, and I have not guessed at their content.** Inventing
what a critic said in order to appear to have answered it is the one failure mode a plan critic
cannot catch, because the fabricated answer reads exactly like a real one. **The plan is not ready
for licence until those thirteen are folded in**; send the report text and they go into this revision.
