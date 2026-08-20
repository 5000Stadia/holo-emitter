# holo-emitter — architecture

Written for the fresh session that boards from it. Read `design/method.md` — it names what your
seat reads — then `design/intention.md`, then `design/playbook.md` and `design/blueprint.md`.
This file holds what is true of the built thing that those documents do not say.

## What exists (rows 1–2: shell, grid, entities, full world behaviour on placeholders)

```
index.html                      scene canvas 1536×1024 + overlay + chevrons + narration log +
                                inventory strip + go-fade veil + boot/fault surfaces +
                                bootstrap (point→meaning, click→intent, hover)
src/renderer.js                 pure draw §7 steps 1–6; layout / apertures / stamp / hitTest
                                exports; grid mode; GRID_META; facing glyph
src/harness.js                  turn/toggle/take/go; intent → validate → mutate → envelope →
                                redraw; enumerateNarrationDomain
src/groundplane.js              scale(y) ↔ y, depth→y, xAtU/xAtScale, placeHost — the one home
                                of §4/§5 placement (§5 + the pinhole completion), UMD
src/placeholders.js             procedural placeholder library: complete §6 records + painters
src/inventory.js                inventory strip: a projection of held_by relations
fixtures/demo-study/*.json      world / staging / narration / viewstate (§3–4; truth)
fixtures/demo-study/fixture.js  GENERATED from the .json files (see the bake)
tools/bake-fixtures.mjs         the bake — calls the validator and refuses an invalid fixture
tools/validate-fixtures.mjs     fixture validator (§12.9 + truth/presentation split), ESM
tests/playwright/               config + helpers + specs; run: npx playwright test -c tests/playwright
```

Not built yet: the replicator (row 3), real backdrops and sprites (row 4+). Nothing exists under
`backdrops/`, `library/`, or `library-src/`. Rows 7–9 (storefront sweep, fullscreen, speaker
layer) are chrome work; row 7 runs first.

## The file:// constraint and the bake

Chromium blocks `fetch`/XHR and ES-module loading for `file://` pages (opaque origin), and §12.7
requires running from `file://`. So:

- **Fixtures are baked, not fetched.** The `.json` files under `fixtures/demo-study/` are the one
  home of fixture truth. `tools/bake-fixtures.mjs` embeds their raw text verbatim as a JS
  expression into the committed sibling `fixture.js` (`window.HOLO_FIXTURE`). Edit the JSON →
  `node tools/bake-fixtures.mjs` → reload. The bake is **byte-deterministic** (no timestamps; a
  content fingerprint instead) because the staleness test re-bakes to scratch and byte-compares
  against the committed file. **The bake is the validator's enforcement locus**: it calls
  `validate()` and refuses to bake an invalid fixture (extending row 1's boot-viewstate refusal),
  so a hand-edited fixture cannot ship between suite runs; the suite also runs the validator
  directly. The bake still refuses a boot viewstate naming no location/facing, and the bootstrap
  re-checks at boot.
- **Accepted deviation** against "the picture never lies about it": a person who edits the JSON
  and reloads without re-baking sees the old document. Mitigations — the staleness test, the
  GENERATED header, the README note, and the page's chrome status line showing the bake
  fingerprint. `file://` allows no more; eliminated only when a served mode exists.
- **All `src/` files are classic scripts** attaching to `window.HOLO` — no ES modules. Each
  carries a two-line UMD guard so Node can `require` the same file the browser runs. The guards
  are now exercised: `tools/validate-fixtures.mjs` imports `groundplane.js` and
  `placeholders.js` records via `createRequire` (§12.8's no-re-derivation rule, met by import).

## The placeholder library (`src/placeholders.js`)

Procedural, not files: a `file://` page drawing a `file://` image taints the canvas in Chromium
and every hash test reads the canvas back (`data:` URIs do not taint — **row 4's route is a
bake**, `tools/bake-library.mjs`, embedding `library/` PNGs as data:-URI records; the renderer
contract below does not move). `HOLO.placeholders.records` is plain JSON-clean data (a validator
finding otherwise); `build(document)` — DOM document, used only for `createElement("canvas")`;
Node callers pass none and get records-only — returns the **library object the renderer binds
to**, the binding output contract of row 4's bake:

```
library[id] = {
  record,                          // the complete §6 record
  images: {
    body: <canvas>,                // sprite.png equivalent (trimmed RGBA)
    parts: { <part_id>: <canvas> },
    states: { open: { image: <canvas>,        // swap archetypes only; body IS the closed state
                      extent: { x0, x1 } } }, // drawn bottom-opaque extent, body pixel space
    thumb: <canvas>                // takeables only, 128×128
  }
}
```

`images.parts` keys come from `record.parts[].id` and `images.states` keys from
`record.states_images` keys — **derived from the record, never beside it** (a mechanisms.spec
assert witnesses the key equality). `extent` is computed at build time from the state image's own
bottom-two-rows alpha ≥ 128 scan, offset by `origin.x` — presentation data derived from pixels,
not record truth; **row 4's bake must reproduce these derived extents**, and its output is
gated by a **deserialization-equivalence test** (on-disk `record.json` + PNGs → exactly this
bound shape), not prose. The record contract is exercised at V1 **as shape, not as file
format** — no `library/<id>/record.json` (de)serialization runs until row 4's bake, and record
image **path strings are unvalidated until then** (the procedural library has no files to point
at; the bake owns path resolution).

**Minted token** `attachment: "anchored"` for anchor-hosted takeables (key, notebook, coin) — a
§6 completion, [AI]-tagged note in blueprint §6: row 3's `--attachment` CLI and row 4's records
must emit it for anchor-hosted takeables or the shipped validator goes red on their arrival (the
validator requires `anchor_on` staging for exactly these).

**A record cannot lie about its own image.** §9.2 defines `px`, `anchors.base` and
`anchors.footprint` by derivation from the matted pixels — the image's own size, the midpoint of
the bottom-extreme opaque pixels, and their x-extent — and nothing witnessed any of them: the
validator bounds-checked anchors against the *declared* `px`, and every shadow-geometry assertion
took its expected width from `anchors.footprint`, the field the renderer reads. The binding ran
one way. mechanisms.spec derives all three from the built body image and asserts them against the
record, for every record. What it caught immediately: the coin declared a footprint across its
whole width, where a disc touches the ground on a band, so its contact pool drew twice as wide as
its contact. What it would have caught: an inflated `px.w` makes a band of the shelf answer "take
the coin" (the page sizes a takeable's tolerance rectangle from `record.px`), and a narrowed
footprint draws a chair's pool at a third of the width of its painted feet — both with the whole
suite green. §12.5's independence rule had been applied to scale and not to these. **Row 4's bake
inherits the clause** when the images arrive as PNGs.

**Every sprite carries the horizontal half of `UL45`.** The painters shade top faces lighter than
vertical ones — the elevation half, and the half that was there. The direction was not: measured
per-third mean luminance came out exactly symmetric on four of the eight sprites and *brighter on
the right* for the desk, while every record declared `"light": "UL45"` as truth. `build()` now
applies a deterministic per-pixel ramp across each image's own width (+8% at the left edge, −8%
at the right) to the body, its parts and its state images alike — a part lit differently from the
body it slides out of is the divergence the whole-composite tint pass exists to prevent, one
layer earlier. No canvas gradient object (those rasterise differently across engines, which is
why the painters forbid them); alpha untouched. mechanisms.spec measures the per-third tilt on
every shipped image — the V1 counterpart of gate §9.4e's Sobel bright-side estimate, which is
what row 4's generated sprites answer to.

**Desk body carries the cut cavity** (mirroring real §9.3 ingest): the body painter paints a
darkened recess where the drawer front sits at closed; the drawer face exists only in the part
image. A body with the face baked in would pass §12.3/§12.8 while showing a second immobile
drawer behind the slid part — mechanisms.spec asserts the body/part luminance ratio.

**Legibility cheats, honest at row 4**: key 0.12 m and coin 0.06 m are toy-scaled for V1
legibility, and even so they land at ≈22 × 14 px and ≈6 × 6 px on screen — findable by a hand
only because the page's pointing carries a tolerance ring, and not findable by *eye* at all.
Row 4's asset scale probe is the real fix. They are not §12.5 calibration entities, so no gate
is softened.

**The desk's drawer travels far enough to clear its own cavity** (`slide.dy` 0.24): children draw
after their host's parts (§7 step 3), so an open drawer front that overlaps the cavity puts the
revealed key *on the face* of the drawer instead of inside it. A heights.spec clause holds the
key's whole drawn rect above the open front's top edge — the geometry row 4's key-in-cavity probe
inherits.

## The swap-state contract (door), for row 3's ingester

Pinned at row 2, [AI]-tagged note in blueprint §9.3b (per-image trim — [HUMAN] §9.3 stage 1
untouched — with the rejected union-canvas alternative named there so Kabe sees both routes):

- `states_images` entries are objects, `{ "open": { "image": …, "origin": { x, y } } }`, where
  `origin` is the state image's top-left in **closed-sprite (body) pixel space** — the §6
  `parts[].origin` precedent applied to states. The single `anchors` block stays the closed
  state's. **`origin` IS the registration** between two independently generated state images;
  row 3 must solve the determination step for real pairs (keep the door frame in frame as the
  registration datum, or a manual `--state open:IMG --state-origin x,y` flag) — the problem is
  stated, not solved, here.
- **Closed-frame alignment gate**, replacing §9.3b's base-midpoint clause (unsatisfiable by the
  very open state §11 mandates — a near-flat leaf moves its bottom midpoint to the hinge side):
  (i) `origin.y + state image height` agrees with the body's bottom edge within 2% of body
  height; (ii) the state's rect lies within the body canvas bounds. Clause (ii) is true of M0's
  door and **not general** — an open state exceeding the closed bbox (a raised chest lid) needs
  a licensed exception. A mechanisms.spec case computes both from record + pixels. Row 2's green
  is **consistency of the placeholder with its own record, never validation against real
  generated pairs**.
- **Swap-state contact shadow** (a completion of [HUMAN] §7 step 6, flag class
  informative-with-reason — its letter paints a full-width shadow under an edge-on sliver): for
  a non-closed state, centre = the drawn extent's midpoint, rx = extent span × f / 2 — from
  `images.states[state].extent`, never the closed `base`/`footprint`.
- **`drawer_cavity` semantics**: contents sit where they are visible when *open*, in body pixel
  space — row 3's manual anchor flagging and row 4's key-in-cavity probe inherit this one
  convention.
- **The open leaf, and the gap beside it, read on the same screen side (viewer-left leaf,
  viewer-right gap) from both rooms** — geometrically impossible in fiction, a consequence of
  §11's own symmetric-leaf device, the M0 mirror ban, and `states_images.open.origin.x = 0`. The
  leaf half follows from §11; the *gap* half is a record-side presentation choice, and making it
  per-facing would need somewhere in `staging.json` to say which side the leaf swings — a §4
  schema addition, so a [HUMAN] call. Kabe can reverse either at row 4 (e.g. by authorizing four
  state images); inherited by row 4's batch note. Reversal of the swap contract generally is a
  **new-row decision with real blast radius** (open-state art direction, drawn-extent shadow,
  row 4's prompt sheet).

## Ground plane (`src/groundplane.js`)

Row 1's scale↔y and u-mapping stand; row 2 added depth→y and **one home for placement**:

- **`CAMERA_WALL_M = 3.5` joins grid canonical meta** (amending row 1's "GRID_K is not meta"
  note: GRID_K is now derived, `px_per_m_at_wall × camera_wall_m`). Depth functions read
  `meta.camera_wall_m ?? CAMERA_WALL_M` — the §5 meta schema grows a per-facing `camera_wall_m`
  when measured backdrops arrive (the `wall_x0_px` precedent; both are named extension points).
- `scaleAtDepth(d, meta) = px_per_m_at_wall × cam / (cam − d)` (pinhole anchored at the wall;
  `depth_m` is metres from the wall toward the camera); `yAtDepth = yAtScale ∘ scaleAtDepth`;
  `xAtScale(u, s, meta, w) = w/2 + (u − 0.5) × wall_width_m × s`, with
  `xAtU(u, y, …) = xAtScale(u, scaleAtY(y), …)` — one formula, two entry points.
- **`placeHost(placement, record, meta, canvasW)` is the one home of §4/§5 placement**, returning
  baseline, scale, `f`, `baseX`, `drawX/Y` and the footprint x-span and vertical span.
  `renderer.layout` and `tools/validate-fixtures.mjs` both call it, which is what binds the
  static overlap check to the pixels the renderer draws. Importing the *scale* functions while
  re-deriving the placement layer above them satisfied the row text's letter and defeated it:
  break placement in the renderer and the validator still reported the named pairs overlapping.
  validator.spec now displaces `placeHost` at runtime and requires the verdict to move with it.
- Placement classes: `floor_against` baseline at `yAtDepth(dims_m.d)`; `floor_free` at
  `yAtDepth(depth_m)`; `wall_mounted` at `floor_line_y·image_h − v × px_per_m_at_wall` (**`v` is
  metres above the wall floor line** — a §4 completion; `u`,`t` are normalized, `v` is not) **at
  wall scale** — a hung object takes `px_per_m_at_wall` at any `v`, because the ground-plane lerp
  describes the floor and reading it at a raised baseline shrank the object by the amount it was
  raised (30% at v = 1.0). Both shipped door placements sit at `v: 0`, where the two readings
  coincide, so only heights.spec's raised case can tell them apart.
- `anchor_on` children land at the diagonal lerp through the host's transform at the **host's
  baseline** scale, draw immediately after their host and its parts, and (for `in` contents)
  require host open + content known, clipped to the transformed **region the staging names** —
  shadow, body, and tint all clipped. Chains are walked transitively: a child may host a child,
  because the harness's reachability walk already recurses and a two-hop child the renderer
  dropped was an object you could take that was never on screen.
- **The depth model and §5's horizon device are now one camera.** `scaleAtDepth` is the pinhole
  completion of [HUMAN] §5's "inverse lerp" sentence (both readings are laid out in blueprint
  §5's [AI] note); `yAtScale` is §5's own linear lerp. They agree exactly — and only — when
  `px_per_m_at_bottom` is `(image_h − horizon_y·image_h) / 1.6`, which for a 1536×1024 grid is
  **332.8**. Grid canonical meta carries that value instead of §5's example 210. At 210 the two
  disagreed and the lerp won: every floor object was drawn at the right size for a depth its feet
  did not occupy (desk 31 px low, chair 86), and §12.5 could not see it because a height check
  reads scale on both sides. heights.spec now carries a clause that checks **feet against the
  horizon device** by independent arithmetic, so a scale-only agreement can never pass again.
  Changing an [AI] adoption, not a [HUMAN] value: §7's grid-canonical list took §5's *example*
  numbers wholesale, and §5's block itself is untouched — it illustrates the schema for meta that
  row 4 measures per backdrop.
- **Still open, and it is Kabe's**: 16 m of wall in frame at 3.5 m is a ~133° view against §10's
  `focal_mm: 50` (≈40°). Blueprint **§7's row-2 amendment is the one place grid-canonical meta is
  stated**, and §5's row-2 note carries the question with its arithmetic, saying per bullet which
  of §5's example numbers the shipped grid still uses — the two documents disagreed about
  `wall_width_m` for a while, and a [HUMAN] question stated against numbers that were not
  shipping is worse than no question. The answer gates a **named quality**, not only row 4's meta
  authoring: at 96 px/m a 1.3 m desk draws 125 px in a 1536 px frame whatever art row 4 produces,
  so *standing somewhere, not looking at a diagram* rides on it. Rows 3 and 7 consume nothing
  from it.

## Renderer

`HOLO.renderer.render(target, world, staging, library, backdrops, viewstate, options) → target` —
pure: inputs only, no module state, no time, no randomness; equal inputs paint equal pixels.
New pure exports beside it: `layout(world, staging, library, meta, viewstate)` → the draw list
(one home for placement; the bootstrap uses it for hit tests); `apertures(...)` → the wall
openings of the exits the player is facing (below); `stamp(ctx, entry, options)` → one layout
entry's own pixels, no tint, no shadow, no clip, which both the render's composite step and the
page's hover outline go through so the highlight traces exactly what was drawn; and
`hitTest(layoutResult, library, px, py)` → topmost entity whose **drawn** pixels have alpha ≥ 16
at the point, walking the draw list back-to-front — parts and state images included, clip
regions applied, **contact shadows never hit regions**, bounding boxes never decide a hit.
**§7's "alpha bounds" is read per-pixel**, deliberately: a bbox reading would misroute clicks
between the staged overlapping pairs, whose boxes intersect by design. Two thresholds, two
reasons: hits at ≥ 16 (a feathered matte edge should catch a click), §12.8 overlap masks at
≥ 128 (occlusion is claimed only of solid pixels) — inherited as such at row 4.

Draw algorithm (§7 steps): backdrop/grid → collect entities staged on the facing (directly or
via `anchor_on` host chain), **skip unknown and held** → sort hosts by baseline ascending, ties
by entity id → per host: contact shadow → body (swap archetypes draw `states_images[state]`,
where **closed resolves to the body image itself** — the record carries only `open`) → parts at
state-interpolated offsets → tint → `anchor_on` children. Tint is per-entity on an offscreen
canvas holding the **whole composite** (body + parts at offsets): `multiply` toward `key_tint`
at `TINT_ALPHA = 0.18`, alpha restored with `destination-in` — an untinted drawer face on a
tinted desk is the divergence this prevents. **The alpha channel is then copied back byte for
byte** from the untinted composite, bounded to the entity's drawn rect. Re-clipping with
`destination-in` — the obvious way — multiplies the two alphas and so *squares* every partial
alpha: a 128 edge pixel came back at 76, and at zero tint at 64. Placeholder art is hard-edged
and showed nothing, but §9.1's matting feathers 1 px, so every matted edge arriving at rows 3–4
would have lost half its alpha and hardened into exactly the cut-out silhouette the flip test
exists to catch. It also made §12.8's tint clause — cited by name in the row's done text — pass
with the tint switched off, because the squaring alone changed the pixels. mechanisms.spec
renders a deliberately feathered probe sprite through the real renderer and compares the alpha
profile tinted against untinted; hash inequality cannot see this. Contact shadow: radial-gradient ellipse under
`base`, rx = footprint span × f / 2 (§7's width, unchanged), **ry = max(0.3·rx, 4 px)**, peak
alpha 0.35, skipped when `airborne`; swap states use the drawn extent (above). The ry floor is
why the candlestick has a pool at all — a pure ratio gave a 0.16 m footprint a three-pixel
hairline whose upper half hid behind its own feet, and the `min(rx, …)` cap is why the coin's is
not a vertical smear. mechanisms.spec measures peak darkening, spread and area **per object
against its own footprint**, twice: on a lit fill (the mechanism's strength, and where row 4's
floors will live) and **on the grid floor the product actually draws** (the picture a V1 visitor
sees). The previous shape of this check was satisfied by any non-zero shadow — a peak of 0.03,
invisible on any floor, passed everything — and then by a lit fill the product never renders. A staged entity with no library record is a **hard throw** — the validator
guarantees resolution; the bootstrap catches render-path throws into a product-voiced fault
state ("The projection wavers; the pattern will not resolve.") with the developer detail on
`console.error`, and clears the scene, the hover overlay and the cursor so the page stops
vouching for a picture it can no longer draw.

Options (§7's debug-switch license, all exercised by §12.8): `tint:false`, `shadows:false`,
`parts:false` (t = 0), `backdrop_only:true`, `no_backdrop:true` (entities composite onto
transparency — what lets heights/mechanisms read entity alpha bounds at all), `part_t:{id:t}`
mid-states. Equal inputs still hash equal.

Grid mode keeps row 1's shape (product, not placeholder; canonical meta as data; facing glyph as
stroked polylines, never `fillText`) and gained two things at row 2. The u-domain maps u ∈ [0,1]
across the central `wall_width_m` with cx centre-by-default (768); real measured backdrops grow
`wall_x0_px` at row 4.

- **Doorways.** `apertures(world, staging, library, meta, viewstate)` returns the wall opening of
  every exit on the facing, derived from `locations[].exits` and the leaf's own §4 wall placement
  through `placeHost` — never from coordinates in truth, and **knowledge-filtered like every
  other read of the world** (an unknown door leaves no hole). Grid mode fills the opening and
  strokes a jamb, **inside the backdrop layer** where §11 puts it: a doorway exists whether or
  not its leaf is shut, the shut leaf occludes it exactly, and a §12.6 flip pair must not differ
  by a hole in the wall. Without it an opened door revealed unbroken wall and then teleported you
  through it, and `go` had no target but the edge-on sliver of the swung leaf. Row 4's real
  backdrops paint their own opening, so **the painted opening must coincide with the leaf's
  placement rectangle** — the page's `go` target is that rectangle (blueprint §11 carries this as
  the constraint on the prompt sheets).
- **The facing glyph stands clear of any opening.** Centred, it landed inside the doorway (and
  behind the shut leaf), which is where the two door facings became the same picture: study/E and
  hall/W differed in 267 of 1.5 M pixels, open or shut, so walking through the door and looking
  back showed you 99.98% of the room you left. §7 gives the glyph the job of making facings
  visually distinct; mechanisms.spec now requires those two facings to differ by thousands of
  pixels in both door states.
- **The floor carries enough luminance for the pool to clear the visibility bar** (`#2c3542`,
  still darker than the wall; peak alpha 0.45). Row 1's `#0b0e13` left 19/255 to take, so a pool
  could darken it by 6; the first correction reached 46 and ~16 — still under the 20-level bar
  §12.8's magnitude clause sets, which made that bar arithmetically unreachable in the mode the
  demo ships, while the clause that ran measured against a synthetic fill four times brighter
  than the real floor. Between them the named quality was certified by nothing. Both clauses now
  set the same bar, and the shipped-floor one measures **per channel**, over **every grounded
  object present** — the `anchor_on` children included, whose pools are derived rather than read
  off a footprint and whose §7 clause ("an on-surface object with no grounding is a sticker") had
  no magnitude gate at all.
- **The glyph carries real ink and not much voice** — 1.5 m tall at wall scale, stroke weight
  `gh/18`, alpha 0.45. `turn` is silent by design (§8 gives it no narration key), so on a bare
  facing the glyph is the entire response to pressing an arrow key, and at 1 m and 3 px it moved
  426 of 1.57 M pixels: no response at all on a phone. geometry.spec requires a bare-facing turn
  to move more than 1200. The alpha is the other half of the same problem — at 0.9 the letter was
  the most legible object in every frame, and a room with a label on the wall is a diagram. Pixel
  count is what makes a turn visible; loudness is not.
- **The jamb stands proud of the leaf**, because a doorway is wider than the door in it. Drawn
  flush the leaf covered it exactly, and a shut door was a plank on unbroken wall — "a doorway
  exists whether or not its leaf is shut" true of the code and invisible in the picture.
- **The opening shows the space beyond**, not a panel painted on the wall: the far room's ground
  plane continues through it — a darker wall, its floor line riding higher (it is one room
  further off), and the grid's own transverse device carrying on across the gap, all derived from
  the same meta the grid is drawn from. A flat fill with a jamb read as a framed dark picture
  hung where the doorway is: the flattest thing in the frame, in the one place the two-room
  premise most needs depth.

## Harness and envelope

`HOLO.harness.create(fixture)` deep-copies world/staging/narration/viewstate; the harness owns
viewstate at runtime (`viewstate.json` is boot-only — exactly `{location, facing}`).
`dispatch(intent)` carries `turn`, `toggle`, `take`, `go`. Validation precedence is
load-bearing — **the unknown check runs first, so no refusal ever leaks the existence of an
unknown entity** — and reachability requires **every host in an entity's `anchor_on` chain to be
known too**. The renderer reaches an anchored child only through its host, so an unknown host
means the child was never drawn; without the same filter here the harness took a notebook off a
desk the player had never been shown, with a success envelope and an inventory tile for something
that had never been on screen. `stagedKeys` itself stays knowledge-blind, because the §12.9
enumeration is about what a fixture can emit, not what one player currently knows. Outcome vocabulary: `open`, `open_reveal` (first open of a container adds its
unknown `in`-contents to knowledge — the reveal — one `knowledge_add` event per content),
`closed`, `taken`, `arrive`, and refusals `refused_unknown` / `refused_static` /
`refused_fixed` / `refused_held` / `refused_unreachable` / `refused_contained` /
`refused_closed` / (turn) `refused`. Events: toggle → `state` (+ `knowledge_add`); take →
`relation_add`/`relation_remove`; go → the row-1 `view` event. Redraw fires iff events are
non-empty; refusals are `events: []` + a narration line + **no redraw**. Valid `turn` is silent
(no narration key, outside the domain — the carve-out is explicit); valid `go` narrates arrival.

`toggle` **steps along the entity's own declared `states`**, never a hardcoded open/closed flip:
the flip would write an entity a state absent from its own list, silently, with a success
envelope and a narration line for a state it was not in. M0 pins exactly `["closed","open"]` —
§7's swap rule reads "closed" as the body image, the outcome vocabulary and the narration keys
are named for them — and the validator enforces that pin, so the assumption is checkable rather
than implicit; widening it is a new row.

**The transport seam.** An intent this module cannot read at all — an unknown `type`, a missing
`entity`/`exit`, a malformed `turn`, `null` — is answered, not swallowed. §8's rule is "no events
AND a refusal line", and a silent envelope broke the second half; the wire, not the world, is
what failed, so the line is the product-voiced fault line and the detail goes to `console.error`,
and it is **outside the §12.9 domain** (nothing in a fixture emits it). Unreachable from the
shipped UI — every affordance builds a well-formed intent — so it lives with §12.1's licensed
API-level cases. It matters because this envelope format is the future websocket wire format.

Narration lookup: `${intent}.${target}.${outcome}` falling back to `${intent}.*.${outcome}`. A
missing line fails loudly in the product's voice ("The pattern falters; the words do not come."
on the pane, key on `console.error`) — unreachable while the validator holds; the loud form is
for hand-edited bakes.

`enumerateNarrationDomain(world, staging)` is exported beside `create`, sharing the dispatcher's
outcome vocabulary — the validator **imports** it (never a re-derivation at the §12.9 seam), and
validator.spec cross-checks it constructively: one doctored-fixture probe per triple through the
real harness, both directions (every scored key in the domain, and the union of scored keys
equals the domain exactly — 37 members on the shipped fixture: 34 specific + 3 `refused_unknown`
wildcards; `turn.*.refused` is an authoring duty witnessed by a doctored one-facing unit test,
not a domain member, since no shipped location has < 2 facings).

**Narration honesty**: validator-enforced as four machine-checked clauses — (a) every domain
triple except the four wildcard outcomes resolves through an entity-specific key; (b) exactly
the four wildcard keys exist (`toggle/take/go.*.refused_unknown`, `turn.*.refused`) and no other
`*` key; (c) entity-specific `refused_unknown` is a finding (the narration layer carries no
oracle — one shared line for nonexistent and not-yet-known targets); (d) success lines pairwise
distinct globally, and duplicate refusal lines across entities a finding. The
contents-agnostic `open` line (it fires with the key still inside *and* after it is taken) and
the 1660 register are **authoring discipline, gated by Kabe's transcript read at row 5**, not
machine checks. Refusal lines never assert visibility (precedence can refuse a target that is
out of view).

## The fixture validator (`tools/validate-fixtures.mjs`)

ESM; exports `validate(fixtureDir, records)` → findings list (empty = pass) + CLI (exit 1).
Checks: truth/presentation split by key whitelist (world = exactly §3's keys — `airborne` lives
on the sprite record where §6 puts it, it drives presentation; staging placements are
facing-placement objects, anchor placements, or arrays of facing-placements per §4's
multi-facing license); numeric domains by value (`u,t ∈ [0,1]`, `v ≥ 0`, `depth_m ≥ 0` and
bounded away from the `camera_wall_m` singularity via `scaleAtDepth ≤ px_per_m_at_bottom`);
placement↔truth consistency (staged facing's location = entity's location, transition entities
staged exactly where exits name them `via`; every known entity staged, anchored, or held);
viewstate exactly `{location, facing}`; `mirror:true` rejected; all refs resolve (sprites,
anchors, exits, relations, knowledge, states covered by the record, thumbs on takeables, anchor
regions inside canvas bounds); the named overlap pairs statically (projected x-spans **and
y-spans** intersect — the y-span check is a licensed strengthening: x-spans can intersect while
sharing no screen rows — **through `groundplane.placeHost`, the renderer's own placement**, meta
resolved as the renderer resolves it: **the staged facing's backdrop meta when one exists, grid
canonical otherwise**; **entity ids unique** (duplicates resolve — twice, so every `find`-by-id
downstream silently picks one, and a world with two `desk1`s drew the desk closed and open at
once, both clickable); **an `in` host declaring an `"open"` state** (a container that cannot open
never draws its contents, refuses `take` as contained, and is invisible to the §12.9 arm because
the enumerator is built from the same predicate that makes the triple disappear — so an ordinary
authoring slip showed the player the transport's fault line); **the §4 attachment vocabulary by
name** (an unknown token used to surface as "the span formulas do not support these values",
sending the reader to the record instead of the typo); **`v` only on `wall_mounted`**; **every
directly-staged placement's projected rect intersecting the canvas** (`u ∈ [0,1]` and a legal
depth are not the same as being in the picture: the u-mapping spans `wall_width_m` at the
placement's own scale, so a floor_free object at 1.2 m runs from x −400 to 1936, and only the two
named overlap pairs would have noticed); and a meta file that exists but cannot be read is a
finding rather than a silent fall back to grid canonical (falling back would check the fixture against a wall the
renderer will not draw, and report success); M0's two-state `["closed","open"]` pin; and §12.9
coverage over the imported enumeration with the four honesty clauses; and **the record's §6
`attachment` agreeing with its §4 placement's** — row 3's ingester writes the record token from a
CLI flag and row 4 authors the staging, different hands, and the renderer silently obeys the
staging one, so a desk whose record says `floor_against` could be staged `floor_free` and drawn
at a depth its own record contradicts. The truth-side
coordinate-key walk is the only net under `knowledge`, whose sub-keys are open, so it matches the
shapes a coordinate actually wears (`screen_x`, `wall_x`, `origin_y`, `bbox`, `extent`, `width`…)
rather than the bare letters `x`/`y`.

*Untested path, and why:* `metaForFacing`'s unreadable-meta finding needs a malformed file under
`backdrops/`, which is the asset seat's lane and not this seat's to write into. Row 4 is the
first row that has real metas to read, and it inherits the duty of covering it.

## index.html chrome

Row 1's stage contain-fit stands, with a `max(320px, …)` floor on the width — the bare calc went
to zero below ~154 px of viewport height and the page rendered literally nothing. The bottom
chrome (narration log + inventory strip + status line) grew the vertical reserve from 3rem to
**9.6rem**; the capture/pointer viewport is **1536×1200** so the canvas displays at native scale
(canvas px = CSS px). That is the *convenient* viewport, and saying so is the point: it is where
small targets are easiest to hit, so the pointer specs that pin it are not evidence about any
other window size, and the clickability sweep runs at 1366×768 and 1920×1080 as well. All chrome
carries class `chrome` and hides under `body.capture` (§12.6's element-screenshot seam, tested).
Chevron geometry eclipses no entity hit region — the clickability sweep's `elementFromPoint` is
the shipped witness.

- **One resolver decides what a point means**: a **takeable whose own drawn rectangle (plus a
  4 CSS px margin) contains the point**, then the exact drawn pixel, then an open doorway the
  point is inside, then nothing. Dead space is dead.
  This shape took three tries and the two failures are worth keeping, because they are opposite
  and the same test battery passed both. **Too little**: a ring of sampled offsets returning the
  first non-null hit widened nothing for the key and the coin — at every offset around them the
  hit is the desk or the shelf underneath, so the coin's reachable region was 34 pixels with the
  ring and 34 without, and a miss on the revealed key dispatched `toggle desk1`, shutting the
  drawer over the reveal the player had just earned. **Too much**: giving a takeable the ring's
  own 22 CSS px reach made it outrank whatever it rested on, and since a CSS margin is several
  canvas pixels at phone scale, the notebook then answered clicks on the drawer, on the chair,
  and on bare wall 85 px away — there was no point on the desk that opened the drawer at all.
  The bound is the takeable's own extent because that is what a player aims at; a click on the
  drawer's face is a click on the drawer, however small the notebook above it happens to be.
- **Click → intent**: doorway → `go`; takeable → `take`; anything else → `toggle` (a shut door's
  leaf covers its own opening, so clicking a shut doorway toggles it; a chair click is the §12.1
  UI-emittable refusal). **A click that resolves to nothing dispatches nothing** — dead space is
  dead, and "input event" in the journal arithmetic means a dispatched intent. The doorway and
  the leaf being two targets is what gives the door a way back: every click on an open exit door
  used to dispatch `go`, so no pointer path could ever close one again, and the authored
  `toggle.door1.closed` line was unreachable by any player.
- **Pointing tolerance** is chrome, never the renderer: the alpha regions are untouched. The
  margin is in **CSS pixels at the current display scale** — a margin in canvas pixels is a
  different product at every window size — and the candidacy test is a **distance to the
  takeable's drawn rectangle**, because a six-pixel coin slips between discrete ring radii.
  What it buys is exactly one thing: a click on a see-through pixel *inside* a takeable means
  the takeable, not the host drawn behind it. **The named residue**: at phone scale the coin
  draws under two CSS pixels and a finger cannot hit it. That is apparent size — the open camera
  question — and no pointing rule can fix it; row 4's asset scale is where it is settled.
  The battery asks **the shipped resolver, in both directions, at phone, laptop and desktop
  widths**: inside a takeable's rectangle means the takeable; the drawer face means the desk; the
  chair means the chair; bare wall and bare floor mean nothing. Only the forward direction
  existed once, which is how the overshoot above shipped — and every pointer spec before that ran
  only at 1536×1200, the single viewport where the canvas displays at scale 1 and a CSS margin
  equals a canvas pixel.
- **Hover**: a **silhouette** outline on the `#overlay` canvas — the entity's own drawn pixels
  stamped through `renderer.stamp`, smeared one ring outward, tinted, interior punched back
  out — cleared when nothing is under the cursor **and on every scene paint** (a stale outline is
  the overlay lying about the scene); `cursor: pointer` over anything the resolver claims,
  doorways included. A rectangle around the sprite frame reads as an editor selecting an asset,
  takes in empty space and crosses whatever stands behind, and this highlight is the only thing
  on screen telling a player that anything here can be touched. The doorway's highlight is the
  opening's own edge — there is no silhouette to trace, the shape *is* the rectangle in the wall.
  Scene hash stays cursor-independent. The overlay is **re-resolved against the last pointer
  position after every paint**, not merely cleared: clearing alone made an entity's only
  affordance vanish at the moment it was clicked. On touch it is cleared and the **next
  compatibility `mousemove` is spent rather than drawn** — the real order on a touch device is
  pointerdown → pointerup → mousemove → mousedown → mouseup → click, so a clear on `pointerup`
  alone is undone immediately, and every tap left a permanent halo around the last thing touched.
  A test built from hand-written events in a convenient order was green over that for a while; it
  drives `page.touchscreen.tap` in a `hasTouch` context now, which is the only way to be sure the
  order is the browser's and not the test's. The scratch
  canvases are sized to the hovered entity, not to the frame: full-frame they cost ~93 ms per
  pointer sample and dropped the page to ~10 fps whenever the cursor was over anything.
- **Subscriber topology**: the harness keeps **one** subscriber — the scene painter, invoked
  only on non-empty events — and `HOLO_APP.paints` counts exactly those invocations (closing
  row 1's known limit: the no-redraw-on-refusal assert is now exact, not hash-inferred).
  Narration and inventory are not subscribers: every input handler calls `dispatch` and hands
  the returned envelope to one synchronous `updateChrome`.
- **The `go` veil** (`#veil`, DOM chrome, `pointer-events: none`) blacks out **in the same task as
  the repaint**, holds ~140 ms, then fades the arrival up over 0.38 s. Order is the whole point
  and it was backwards: adding a fade-in class after the harness had already moved and repainted
  showed the player the destination at full brightness and *then* blacked them out. A refused
  `go` never reaches the veil, so a shut door does not flash. **A double-click echo is swallowed,
  travel is not**: `arrive_facing` puts the doorway you came through under the very pixel you just
  clicked, so an accidental double-click walked you through and straight back behind a veil you
  never saw past. The guard is a 400 ms window ended by **any** other intent — the first version
  was a blanket 520 ms lock on the only way between rooms, cleared by nothing, which dropped a
  well-formed intent with no envelope and no refusal line and made *walk in, look back, walk out*
  impossible. It was also why §12.2's replay clause was red on Firefox while Chromium, being
  slower on that path, stayed green.
- **Boot and fault surfaces.** A handler registered before any module loads — depending on
  nothing that could fail — answers a script that never arrives, and `<noscript>` answers a
  browser that will not run them; both speak as the product, with the detail on `console.error`,
  and the noscript case also hides the chevrons, which otherwise look live and are not. Without
  this a partial load over the public link left a black page whose entire text was two chevrons.
  A render fault clears the scene, the overlay and the cursor before narrating: keeping the last
  frame while the world has moved is the same lie as the picture moving when the world has not.
  `paints` counts completed paints, not attempts, so a fault cannot read as a repaint.
- **The page resolves meta per facing** exactly as the renderer does, rather than pinning
  `GRID_META` at boot. It resolves to the same object today (nothing fills `backdrops`), but a
  boot-pinned constant means picture and affordances use different geometry the day a facing
  carries its own meta at row 4 — which is the picture/affordance divergence this row exists to
  close.
- **The narration pane scrolls to the top of the newest line**, not to its own bottom: at a phone
  width a message taller than the box had its first line sheared off above the pane, and the
  narration is the entire product voice.
- **The stage's degenerate-case floor is 120 px**, not 320: at 320 it bound for any viewport under
  367 px tall — every phone in landscape — and added 20 px of scroll where the plain contain-fit
  fitted exactly. Guarded at five sizes, portrait and landscape, including one below the
  degenerate threshold where the page is allowed to scroll but not to be empty.
- **The narration pane is 4.2rem and its newest line always starts flush at the top.** At 3.2rem
  an arrival line wrapped to two rows at phone width and the pane permanently showed one message
  plus a horizontally sliced fragment of the previous one, ascenders cut mid-glyph — the whole
  product voice arriving broken. The room came from the inventory strip's and status line's
  padding, not from §5's 9.6rem chrome budget. A pane's worth of scroll room hangs below the last
  paragraph (on the content, so the box does not grow), because otherwise the scroll clamps at
  the end of the content and the top edge lands mid-line whatever the pane's height.
- **Inventory tiles carry the record's `noun` as an `aria-label`**, not only as a hover `title`:
  a canvas has no text content and touch has no hover, so `title` alone names the tile to nobody
  who is not using a mouse.
- **The page is vertically centred.** Stage and chrome are both fixed heights, so on anything
  taller the remainder is dead space, and top-aligned it all pooled below — 38% of a phone screen
  empty under a small picture. `body.capture` drops the centring, because §12.6 wants the scene
  element captured at exactly 1536×1024 and a flex-centred stage lands on a fractional y, which
  rounds an element screenshot to 1025 px tall. All chrome is hidden in capture mode anyway.
- **Surface strings, enumerated against the voice rule** [HUMAN]: narration lines, the two fault
  lines and the boot line are product speech; inventory tiles carry the record noun as `title`;
  the narration pane boots empty and the inventory strip renders no tiles and no words when
  nothing is held — bare surfaces, no method vocabulary. The pre-existing status-line and BOOT
  ERROR strings are **row 7's named work**: Kabe wrote that row himself after catching them on
  the live link, and the intention sequences it to run immediately after this row's closing
  commit.
- **Accepted V1 interaction consequences** (from blueprint §7/§8 text; row 5's human pass sees
  them as decisions, not surprises): input stays live during the go fade; a double-click on a
  shut door opens it and walks through in one gesture, because the same point means "toggle"
  before the click and "travel" after it.

## Tests

`npx playwright test -c tests/playwright` (or `npm test`) — headless, all pages from `file://`;
suite-wide no-network guard and in-page SHA-256 canvas hashing as at row 1; no stored goldens;
tests that edit fixtures stage a scratch tree and re-bake there.

**Two engines.** Chromium runs everything; **Firefox runs the behaviour specs** (walkthrough,
determinism, harness, refusals, turning). That is not decoration: §12.2's replay clause was red
on Firefox for a real product reason — a travel guard swallowing the replay's second passage —
while the Chromium-pinned suite stayed green, and four boot-fallback guards were inert there
because `page.route` does not intercept `file://` off Chromium (they delete the module from a
staged tree now). Hash **values** are never compared across engines; clause 1 is a within-run
identity and stays one. WebKit will not launch on this machine and is unverified by anyone —
the likeliest engine for a phone visitor at the public link.

Pointer-driven specs pin viewport 1536×1200, which is the **convenient** viewport — the canvas
displays at scale 1 there, so a CSS margin equals a canvas pixel and small targets are easiest to
hit. Nothing that runs only there is evidence about any other window size; the pointing battery
runs at phone, laptop and desktop widths for exactly that reason. Specs → done clauses: `walkthrough` (§12.1 by real pointer/keyboard
events only, with same-run doctored-render operationalizations of every visibility claim,
truth-document asserts after every world-mutating step, the arithmetic-pinned chair-refusal
click at a chair×desk intersection pixel, hover-overlay asserts including the pre-reveal
knowledge case, §12.4 zero-frames at every pre-reveal step, and §12.2 clause 2 replay);
`harness-refusals` (§12.1's licensed API-level unit tests: every refusal outcome + the doctored
one-facing turn refusal); `isolation` (§12.3 both directions, diff confined to part travel ∪
cavity and attributable to the part); `knowledge` (§12.4 positive filter, same-run reference);
`heights` (§12.5: expected values by independent test-side arithmetic from §5 literals +
`CAMERA_WALL_M` as literals — never imported; actual from solo-render alpha bounds; plus
position per attachment class, `wall_mounted` at v ≠ 0, **feet against the horizon device**, the
open-door geometric gate on both facings, the `anchor_on` class via note1, the revealed key's
in-cavity geometry and its clearance above the open drawer front); `mechanisms` (§12.8: each
switch fires; harness-toggled parts scene; drawer provably the mover; opaque-pixel overlaps
≥ 50 px at threshold 128; draw order at intersection pixels; body-recess; shadow geometry per
attachment class + anchor_on; door toggle changes the hash on both facings and round-trips
exactly; tint arithmetic sampled on body, part, and state-image pixels; thumbs are content,
pairwise distinct; the clickability sweep, fresh page per entity, `elementFromPoint` confirming
no chrome eclipse, plus small takeables aimed at centre-of-object on two ordinary window sizes;
the swap alignment gate from pixels; measured contact strength and spread per object; doorways
from the document and their knowledge filter; the two door facings being different pictures;
`placeHost` agreeing with the layout entry; and the six mechanisms that were present but
unguarded — cavity clip cutting, alpha hit regions, silhouette ink inside a hole, the open
door's shadow following the drawn sliver); `validator` (green on repo fixtures, red per mutation
class, the §12.9 cross-check, the bake-refusal witness, both fault surfaces, and the
placement-binding guard that displaces `groundplane.placeHost` at runtime and requires the
verdict to move). `determinism` extends §12.2 clause 1 across two fresh page loads (boot facing,
swap state, one `part_t = 0.5` mid-state); `geometry`'s grid scans re-pointed at bare study/S;
`shell` carries the new reserve/viewport numbers (row 1's stale "window width" title is dead).

**A check that stays green when what it guards is deleted is a finding**, and this row learned it
twice: the first fix pass shipped five mechanisms held by nothing. Every guard listed above was
verified by reverting the mechanism it names and watching it go red. A corollary the row also
paid for: **a guard has to ask the shipped code, not the piece the shipped code calls.** The
doorway check consulted `apertures` directly, so moving the tolerance ring ahead of the doorway
in the page's resolver — the exact defect the ordering was written against — left the whole suite
green. It asks `HOLO_APP.resolve` now.

The suite's timeout is 90 s, not Playwright's 30 s default: several §12.8 cases render the full
1536×1024 canvas a dozen times and read every pixel back, which runs 30–40 s on a loaded machine
and turned "green" into "green when the machine is quiet".

**§12.1's "document assertions after every step" was read as**: write the assertions down, plus
truth-document asserts after every world-mutating step; turn steps are covered by clause 2's
hash-sequence identity.

**Licensed strengthenings beyond the row text**, each with its reason in the plan history:
y-span overlap check (vacuous x-only overlap defeats the check), `no_backdrop` switch (alpha
bounds unreadable over an opaque grid), paint counter (exact no-redraw), open-door geometric
gate (a swap state must land right, not just differ), body-recess assert, per-step document
asserts, position checks in heights (a shared `xAtU` bug self-agrees everywhere a test asks the
code where things are), and the horizon-device clause on feet (a height check reads scale on both
sides and cannot see a floor that puts feet at the wrong depth). The stick1 staging change
(`depth_m` 0.9 → 0.4) rides §4's own license: it stands well clear of shelf1 at 0.9 and overlaps
it at 0.4. It ships at **0.75**: at 0.4 the candlestick's base plate sat inside the bookcase
plinth and the pair read as interpenetration — demonstrating the mechanism (§12.8's intersecting
opaque pixels) without demonstrating the quality it exists for. At 0.75 it stands on the floor in
front of the case with its upper body crossing it: column-before-building. Row 4's real asset
needs only h ≥ ~0.11 m.

Witnessed engines: Chromium (the suite) and a Firefox `file://` smoke after assembly (boot
paint, desk click → open → reveal narration, no console errors); WebKit is unwitnessed on this
machine. Row 2's painterly passes (radial-gradient shadows, `multiply`/`destination-in`,
fractional-scale `drawImage`) are deterministic within the witnessed engine — all §12.2's
letter requires; cross-platform hash stability is accepted residue.

Known limits, still open (row 1's list, updated):
- The network guard's WebSocket half fires only on a successful handshake (construction-vs-
  handshake hole; row 2 added no network seam). Hardening constraint unchanged: detect
  construction via an `addInitScript` shim.
- BOOT ERROR's quiet styling and its wording (row 7's sweep owns the strings themselves).
- **Nothing on the surface tells a visitor that anything can be touched** except the hover
  highlight, which touch devices do not have; and the V1 legibility cheats leave the coin at
  ≈6 logical px. Row 9 allocates the intro that would say so; row 4's asset scale probe is the
  real fix for the second half.
- **No keyboard or assistive path to entities.** Only the chevrons are focusable; the canvas has
  no `tabindex`, role or accessible name, and `#narration` is not a live region. A keyboard-only
  player can turn forever and never open the drawer. Not covered by any allocated row — the
  Navigator should decide whether it gets one.
- **Per-turn repaint cost.** `render` allocates two full 1536×1024 offscreen canvases per entity
  per frame (composite, then tint), which measures ≈270 ms at 4× CPU throttling and ≈410 ms at
  6× on the furnished study facing. Bounding the scratch to each entity's drawn rect is the fix
  and it must not move a hash; left alone at V1 deliberately, since every §12.2 guarantee is
  pinned to the current pixel output.
- **On a phone the stage is top-aligned** and 40–60% of the viewport is empty below the chrome;
  at 3840×2160 the fixed 1536×1024 backing store upscales and softens (no `devicePixelRatio`
  handling — adding it would move every hash, which is worth naming before row 4's
  halo-sensitive flip test). Row 8 owns the presentation.
- **WebKit is unverified by anyone** — it will not launch on this machine, and Safari/iOS is the
  likeliest engine for a phone visitor at the public link. Firefox was checked by hand and
  diverges only in anti-aliasing (max channel delta ~36 on grid strokes and the shadow
  gradient), so cross-engine geometry is sound where it could be tested.
- Closed by row 2: the refusal-vs-identical-redraw ambiguity (paint counter) and the stale
  shell-test title.
