# Plan — spec row 2

Built against row 2 of the spec list in `design/intention.md`. Row 1's `design/architecture.md`
is the boarding document; everything it pins (the bake, UMD guards, the u-domain mapping, the
envelope journal, grid meta as data) is assumed, not restated. This plan pins every decision the
row leaves open, so parallel builders produce one coherent artifact.

## 1. Placeholder delivery: procedural, in-page, complete §6 records

Loose PNG files are the wrong carrier at this row: a `file://` page that draws a `file://` image
onto the scene canvas taints it in Chromium, and every hash test reads the canvas back. (`data:`
URIs do not taint — so **row 4's route is a bake**, a `tools/bake-library.mjs` sibling of the
fixture bake that embeds `library/` PNGs as data:-URI records; the renderer contract below does
not move. The row's own text mandates procedural placeholders regardless.) So the placeholder
library is **procedural**: `src/placeholders.js` (classic script + UMD guard, like all of `src/`)
carries, for each of the eight sprite ids named in `world.json`:

- a complete §6 `record` object — schema `sprite/0.1`, id, noun, archetype, attachment
  (**anchor-hosted takeables carry `"attachment": "anchored"`** — a minted §6 token, on its honest ground: not that §6
  makes the field mandatory (it doesn't say), but that a total `attachment` function over
  records keeps the validator and row 3's `--attachment` CLI total, and omission would be a
  second, silent convention; the validator requires
  `anchor_on` staging for exactly these — and the token **joins the §6/§9 contract via the
  same [AI]-tagged blueprint note as the plan's other completions and §11's close list**, so
  row 3's `--attachment` and row 4's records inherit it rather than colliding with the shipped
  validator), `dims_m`,
  `view_side: "left"`, `light: "UL45"`, period, `anchors` (`base`, `footprint`, plus
  `surface_top`/`drawer_cavity` where staging references them), `parts` (desk only),
  `states_images` (door only: `{ "open": { "image": "states/open.png", "origin": {…} } }` per
  the swap contract below — `sprite.png` is the closed state), `takeable`, `airborne`,
  `"thumb": "thumb.png"` on takeables, and
  `provenance: { source: "procedural-placeholder", tool: "placeholders-v1" }`. Path strings are
  kept in records for contract fidelity even though pixels are procedural — the renderer never
  reads the paths; it reads the image table below.
- a painter that draws the sprite into a canvas, deterministically (flat fills and strokes only,
  no text, no randomness, no time).

`HOLO.placeholders.records` is plain data (Node-`require`-able — the validator reads it, and it
must survive a JSON round-trip: `JSON.parse(JSON.stringify(records))` deep-equals, a validator
finding otherwise, so the shape row 4 must serialize is JSON-clean now);
`HOLO.placeholders.build(document)` — the argument is **the DOM document, used only for
`createElement("canvas")`** (Node callers pass none and get records-only; no filtering by
fixture happens here) — returns the **library object** the renderer binds to —
**derived from the record, never beside it**: `images.parts` keys come from `record.parts[].id`
and `images.states` keys from `record.states_images` keys (plus the closed→body rule), and a
mechanisms.spec assert witnesses the key equality for every record, so `states_images` cannot
ship as a decorative field nothing reads:

```
library[id] = {
  record,                          // the §6 record
  images: {
    body: <canvas>,                // sprite.png equivalent (trimmed RGBA)
    parts: { <part_id>: <canvas> },
    states: { open: { image: <canvas>,        // swap archetypes only; body IS the closed state
                      extent: { x0, x1 } } }, // drawn bottom-opaque extent, body pixel space
    thumb: <canvas>                // takeables only, 128×128
  }
}
```

**Swap-state pixel-space contract, pinned — the parts precedent applied to states, preserving
[HUMAN] §9.3 stage 1 untouched**: every state image is **trimmed per image, exactly as §9.3
stage 1 says**, and registers to the closed sprite the way a part does — the record's
`states_images` entry is an object, `{ "open": { "image": "states/open.png", "origin":
{ "x": …, "y": … } } }`, where `origin` is the state image's top-left in **closed-sprite (body)
pixel space** (§6's `parts[].origin` is the existing precedent for exactly this: an
independently-cut image registered to the body). The single `anchors` block stays what it is —
the closed state's, serving staging position and the closed shadow — and needs no second
geometry. The renderer draws a non-closed state at the host transform offset by `origin·f`.
This route deviates from **no [HUMAN] text**: `states_images` and §9.3b are [AI]-authored, and
changing the entry from a path string to `{image, origin}` is ordinary completion, recorded in
an [AI]-tagged note in blueprint §9.3b at close. The rejected alternative — one shared
union-trim canvas for both states, which would have deviated from [HUMAN] stage-1 trim and
hidden the registration problem inside authored pixels — is named in the same note so Kabe
sees both routes; nothing here waits on an answer, because the built route overrules nothing
human-tagged.

**Registration is now explicit, not hidden**: `origin` *is* the registration between two
independently generated state images. Row 3's note names the determination step — the
open-state generation keeps the door frame in frame as the registration datum, or the origin
is a manual flag like the v1 anchor regions (`--state open:IMG --state-origin x,y`) — so row 3
boards with the problem stated, never the illusion of a solution. Row 2's placeholder authors
`origin` directly, like every other record value.

**The swap alignment gate, redefined in the closed frame** (amending [AI] §9.3b, same note):
§9.3b's letter — per-image `base` midpoints agreeing within 2% of width — is **unsatisfiable
by the very open state §11 mandates** (a leaf swung near-flat moves its bottom-pixel midpoint
to the hinge side by ~a third of the sprite width; only a leaf floating mid-doorway could
pass). The gate becomes, judged in closed-sprite pixel space: (i) the state's bottom edge,
`origin.y + state image height`, agrees with the body's bottom edge within 2% of body height
(vertical registration — both stand on the same floor); (ii) the state's rect,
`origin + image bounds`, lies **within the body canvas bounds** (the leaf never leaves the
doorway — non-vacuous here, unlike a union frame, because the closed body is an independent
referent). **These clauses ARE the swap gate, full stop** — the base-x midpoint clause is
deleted for swap sprites, with no per-sprite discriminator to get wrong (sliding-part
alignment lives in gate (d), which never applied to swap sprites) — and the note says plainly
that the replacement trades the old clause's letter for clauses the mandated open state can
satisfy. Scope, for row 3's note: clause (ii) is true of M0's door (a leaf swings inside its
doorway) and **not general** — an open state whose silhouette exceeds the closed bbox (a
raised chest lid) needs a licensed exception, and row 3 boards knowing that, not by repeating
§9.3b's unsatisfiable-by-mandate mistake one level up. A mechanisms.spec case computes both from the record and the state image's pixels and
asserts them; prose claims witness nothing. Where the open leaf hangs *within* the doorway is
record truth (`origin`), authored here, judged by eyes at rows 4–5 — the gate checks
registration sanity, and row 2's green is **consistency of the placeholder with its own
record, never validation of the gate against real generated pairs**; the row-3 note says that
too.

The placeholder's open sliver sits at the **viewer-left edge** (origin.x = 0) — and since the
one unmirrored image draws on both facings, the leaf reads on the same screen side from both
rooms, geometrically impossible in fiction: a consequence of §11's own symmetric-leaf device,
named here, carried in the close record as a decision Kabe can reverse at row 4 (e.g. by
authorizing four state images), and inherited by row 4's batch note (which already names the
hinge-asymmetry risk).

**Swap-sprite contact shadow, pinned — and channeled like the plan's other completions**
(§7 step 6's "ellipse at `base`, width = footprint span" is Kabe's letter, and applying it to
a near-edge-on sliver paints a full-width shadow under nothing — so this is a step-6 completion
for swap states, carried in the same [AI]-tagged blueprint note at close, reason given): for a
non-closed state the shadow derives from the **drawn state's** bottom-opaque x-extent — computed deterministically from the state image at
library build time, offset by `origin`, carried as `images.states[state].extent = { x0, x1 }` **in body
pixel space, exactly as the shape block above prints it** (one name, one space — closed states
use `footprint` as ever) — never
from the closed-state `base`/`footprint`, which would paint a full-width shadow under a
near-edge-on sliver. Row 4's bake reproduces these derived extents (presentation data derived
from pixels, not record truth).

**Desk body carries the cut cavity, pinned** (mirroring real §9.3 ingest, where the part is cut
from the body and the cavity inpainted): the desk **body painter paints a darkened recess**
(opaque, oak darkened ×0.45) where the drawer front sits at closed — the drawer face exists
**only** in the part image. A body with the face baked in would pass §12.3 and §12.8 while
showing a second, immobile drawer behind the slid part. Distinguishing assert (mechanisms.spec):
mean luminance of the body canvas inside the part's closed rect < 0.7 × mean luminance of the
part canvas.

**Record table** (dims_m; authoring scale 200 px/m furniture, 400 px/m takeables; every painter
fills its canvas to the trimmed content bounds — top and bottom rows opaque — because §12.5
measures rendered alpha bounds against `dims_m.h`):

| id | archetype | attachment | dims h×w×d (m) | extras |
|---|---|---|---|---|
| desk-joined-oak-1660 | sliding | floor_against | 0.78×1.30×0.55 | `drawer_front` part (slide dx −0.10, dy 0.14, scale_open 1.06, states closed 0/open 1); `surface_top` and `drawer_cavity` anchor regions — the cavity is authored where the **open** drawer interior sits, since contents draw only when open; heavy legs and a floor-level stretcher rail (period joinery, and the chair×desk opaque overlap lands on them) |
| chair-joined | static | floor_free | 1.05×0.60×0.55 | wainscot form: solid back panel (the overlap needs opaque chair-top pixels) |
| door-plank | swap | wall_mounted | 2.00×0.90×0.05 | two-state: closed = full plank leaf, centred iron ring pull, visually symmetric (one face honest from both rooms); open = the leaf swung near-flat, a ~0.25 m-wide full-height edge-on sliver, its own trimmed image registered at `origin.x = 0` (viewer-left; hinge side unreadable in period detail, per §11's known risk) — **the doorway aperture is transparent**, the scene behind shows through (grid wall at V1; a matted row-4 asset behaves identically). Per-image trim + `origin` registration per the swap contract above; alignment per the closed-frame swap gate, witnessed by a test computing it from record and pixels — never asserted in prose |
| shelf-oak | static | floor_against | 1.80×1.00×0.30 | back-panelled bookcase (solid where the stick overlaps); `surface_top` region on a board front edge at ~1.2 m |
| candlestick-brass | static | floor_free | 0.55×0.16×0.16 | floor-standing candlestick. The stick1×shelf1 overlap is achieved by the **actually-licensed lever**: staging `depth_m` 0.9 → 0.4 (§4 verbatim: "exact u/depth values carry the license: change them if it makes the product better, and say why" — why: at depth 0.9 the projected spans share no screen rows and §12.8's opaque-overlap clause cannot pass; at 0.4 they share ≈48 rows, the stick stands clear of the shelf's 0.3 m footprint, draws in front, and row 4's real asset needs only h ≥ ~0.11 m — no constraint on the art worth naming) |
| key-iron | static | anchored | 0.12×0.20×0.02 | takeable, thumb; slightly toy-scaled for V1 legibility in the cavity — row 4's real asset re-fits scale at the probe |
| notebook-vellum | static | anchored | 0.22×0.16×0.03 | takeable, thumb; propped upright (a flat-lying 3 cm book is invisible at scene scale) |
| coin-silver | static | anchored | 0.06×0.06×0.005 | takeable, thumb; a large medallion for the same V1-legibility reason |

Palette (one hand, muted, UL45): oak `#6b4a2f`/`#8a6a45`, iron `#3a3d42`, brass `#a98836`,
vellum `#d8c9a3`; top faces lightest, viewer-left faces mid, right/front darkest; 1 px darker
outline. Exact anchor pixel values are authored in the records by the placeholder builder and are
self-consistent data — tests and the validator read them from the record, never guess them.

## 2. Ground-plane math, completed (`src/groundplane.js`)

Row 1 pinned scale↔y and the u-mapping; entity placement needs depth→y. Pinned now:

- **`CAMERA_WALL_M = 3.5`** — the camera-to-facing-wall distance, one home in `groundplane.js`
  [AI, standing license]. It is the meaning row 1's `GRID_K` already had implicitly
  (`GRID_K = px_per_m_at_wall × 3.5 = 336`); the renderer's grid keeps drawing from the same
  number so grid transverse lines and entity depth math agree. Architecture.md's "GRID_K is not
  meta" note is amended at close: it is now derived, `meta.px_per_m_at_wall × camera_wall_m`.
  **Row-4 extension point, named now**: each real backdrop has its own implied camera distance,
  so the depth functions read `meta.camera_wall_m ?? CAMERA_WALL_M` — the §5 meta schema grows a
  per-facing `camera_wall_m` field when measured backdrops arrive (the `wall_x0_px` precedent),
  and 3.5 is the grid-canonical default, not a global forever.
  **Channel**: §5 is Kabe-authored [HUMAN] and never defines depth→scale, so the pinhole model
  is a completion of [HUMAN] text — it travels the same human-visible, reversible channel as
  the §9.3b note: an **[AI]-tagged completion note in blueprint §5 itself** at close, beside
  the architecture.md record. And said plainly for the close: §12.5's V1 green witnesses
  **implementation-against-model**, not model-against-intent — the model itself is gated by
  Kabe's eye at row 4, when measured backdrops exist to disagree with it.
- `scaleAtDepth(depth_m, meta)` = `px_per_m_at_wall × camera_wall_m / (camera_wall_m − depth_m)`
  — pinhole scaling anchored at the wall; `depth_m` is metres from the wall toward the camera.
- `yAtDepth(depth_m, meta)` = `yAtScale(scaleAtDepth(depth_m, meta), meta)` — §5's "inverse lerp".
- `xAtU(u, y, meta, canvasW)` = `canvasW/2 + (u − 0.5) × wall_width_m × scaleAtY(y, meta)` — the
  row-1 pinned mapping, homed here because the validator's overlap check must import it (§12.8's
  no-re-derivation rule) and the renderer must use the same function.

Placement rules (renderer and validator both compute through these functions):

- `floor_against`: baseline depth = `dims_m.d` (§5: "offset by their own depth" — the base/front
  contact line sits the object's own depth in front of the wall). `baseline_y = yAtDepth(dims_m.d)`.
- `floor_free`: `baseline_y = yAtDepth(depth_m)`.
- `wall_mounted`: `baseline_y = floor_line_y·image_h − v × px_per_m_at_wall` (v in metres above
  the wall floor line); scale at the wall.
- Screen height = `dims_m.h × scaleAtY(baseline_y)`; the sprite draws at
  `f = height_px / image_h_of_sprite`, positioned so `anchors.base` maps to
  `(xAtU(u, baseline_y), baseline_y)`.
- `anchor_on` children: host anchor region `(x0,y0,x1,y1)` in host sprite px; child base lands at
  the diagonal lerp `(lerp(x0,x1,t), lerp(y0,y1,t))` through the host's transform. Child scale
  uses the **host's baseline** ground scale (`child dims_m.h × scaleAtY(host baseline)` — this is
  exactly "derive scale from the host"). Children draw immediately after their host, after the
  host's parts; contents (`in` relation) additionally require host `state == "open"` and content
  known, and are clipped to the transformed cavity region.

## 3. Renderer (`src/renderer.js`) — §7 steps 2–6

Signature unchanged. New pure exports beside `render`:

- `layout(world, staging, library, meta, viewstate)` → the draw list: per drawn entity
  `{ id, x, y, f, baseline_y, images..., clip? }` in draw order. `render` consumes it (one home
  for placement); the bootstrap uses it for hit tests and hover.
- `hitTest(layoutResult, library, px, py)` → topmost entity id whose **drawn** pixels have
  alpha ≥ 16 at the point (generous on purpose: a feathered matte edge should still catch a
  click; the §12.8 overlap masks use ≥ 128 because occlusion is claimed only of solid pixels —
  two constants, two reasons, inherited as such at row 4) — parts and state images included,
  and clip regions applied (a cavity
  content is hittable only where it is actually painted; invisible pixels are never clickable);
  **contact shadows are never hit regions** (blueprint §7's "alpha bounds" is read per-pixel
  over body/parts/state images only — the floor in front of the desk is floor, not desk) —
  walking the draw list back-to-front. Bounding boxes alone never decide a hit.

Draw algorithm (§7 steps, order pinned):

1. Backdrop or grid (row 1, unchanged).
2. Collect entities staged on `location/facing` directly or via `anchor_on` host chain; **skip
   unknown** (not in `knowledge.player`) and skip `held_by` player. A staged entity whose sprite
   id has no library record is a **hard throw** — the validator guarantees resolution; silent
   skips would let the picture lie. The bootstrap catches render-path throws into a
   product-voiced fault state in DOM chrome — the narration pane shows, verbatim, "The projection wavers; the pattern will not resolve." (true with zero
   prior frames — a boot-time fault must not claim a "last true frame" that never painted) — developer detail on `console.error`,
   per the standing voice rule ("in every state including errors"); a hand-edited bake must
   not yield a silently frozen canvas. The new chrome carries **no labels and no empty-state
   text**: the narration pane boots empty and the inventory strip renders no tiles and no
   words when nothing is held — bare surfaces, so no method vocabulary can leak (the
   close-time enumeration covers these empty states too).
3. Sort hosts by baseline_y ascending; ties break by entity id (determinism). Each host draws:
   contact shadow → body (for swap archetypes: `images.states[state].image`, **where the closed state
   resolves to the body image itself** — the record's `states_images` carries only `open`;
   indexing `states_images["closed"]` literally is the bug this sentence forbids) → parts
   at state-interpolated offsets (part t from entity state via `part.states`, overridable per
   entity by `options.part_t[id]`; `slide` fractions of sprite w/h, scale lerped to
   `scale_open`) → tint pass → then its `anchor_on` children (shadow → body → tint, **all three passes clipped** for
   cavity contents — the child's shadow must not escape the cavity either).
4. Tint (§7 step 6): per-entity, on an offscreen canvas holding the entity's **whole composite —
   body (or state image) plus its parts at their interpolated offsets** — `multiply`-composite
   `key_tint` at `TINT_ALPHA = 0.18`, restore alpha with `destination-in`, blit once. One
   constant; an untinted drawer face on a tinted desk is exactly the divergence this sentence
   exists to prevent.
5. Contact shadow: radial-gradient ellipse under `base`, rx = footprint span × f / 2, ry = 0.18·rx,
   peak alpha 0.35; skipped when `airborne`; **for non-closed swap states, centre = the drawn
   extent's midpoint and rx = extent span × f / 2 (§1's swap-shadow rule — the renderer
   contract states it, not just a test bullet)**; `anchor_on` children get the same treatment on the
   host surface.

Options (renderer inputs, §7's license — what §12.8 drives): `{ tint: false }` skips step 4,
`{ shadows: false }` skips step 5, `{ parts: false }` forces every part to t = 0,
`{ backdrop_only: true }` stops after step 1, `{ no_backdrop: true }` skips step 1 (entities
composite onto transparency — this is what lets heights.spec and mechanisms.spec read entity
alpha bounds at all; without it every pixel over the opaque grid has alpha 255),
`{ part_t: { id: t } }` renders mid-states. Equal inputs still hash equal. Every switch is
exercised by a row-2 spec — none ships as an untested scaffold (`backdrop_only` gets its
one-line assert: hash-equals a render of the same viewstate with all entities deleted).

## 4. Harness (`src/harness.js`) — toggle, take, go, refusal narration

Validation precedence per intent (order is load-bearing — the unknown check runs first so no
refusal ever leaks the existence of an unknown entity):

- **toggle e**: e exists in world AND in `knowledge.player`? else `refused_unknown`. Has states?
  else `refused_static`. Staged (directly or via host chain) on the current location/facing? else
  `refused_unreachable`. Then flip state → outcome `open`/`closed`; a `toggle → open` that adds
  unknown `in`-contents to knowledge (the reveal) has outcome `open_reveal` and appends one
  `knowledge_add` event per revealed content.
- **take e**: exists AND known? else `refused_unknown`. Takeable? else `refused_fixed`. Already
  `held_by` player? `refused_held`. Reachable this facing (via host chain)? else
  `refused_unreachable`. Contained (`in`) with host not open? `refused_contained`. Then: add
  `["held_by", e, "player"]`, remove its `in`/`on` relation → outcome `taken`.
- **go x** (x an exit id): exit exists in world? else `refused_unknown`. `from` is the current
  location and `facing` the current facing? else `refused_unreachable`. Via-door state `open`?
  else `refused_closed`. Then set viewstate to `to`/`arrive_facing` → outcome `arrive`.
- **turn**: unchanged from row 1, silent when valid; a refused turn now carries the
  `turn.*.refused` line (closing §8's letter; unreachable in this fixture, unit-tested on a
  doctored one-facing world).

Envelope events (extending row 1's `view`): toggle → `{ type: "state", entity, to }` (+
`{ type: "knowledge_add", entity }`); take → `{ type: "relation_add", rel }` and
`{ type: "relation_remove", rel }`; go → the row-1 `view` event. Redraw fires iff events are
non-empty. Refusals: envelope with `events: []`, a `narration` line, **no redraw** — and the
bootstrap's paint counter (below) lets tests assert *no paint*, closing row 1's known limit that
hash comparison cannot tell no-redraw from an identical redraw.

Narration lookup: key `${intent}.${target}.${outcome}`, falling back to `${intent}.*.${outcome}`.
A missing line must fail loudly but **in the product's voice on the rendered surface** (the
intention's standing voice rule [HUMAN, 2026-08-19]: developer speech goes to the console):
the narration pane shows a product-voiced fault line — "The pattern falters; the words do not
come." — while `console.error` carries the missing key for the developer. Never silently blank
(the validator makes this unreachable; the loud console form is for the day someone hand-edits
a bake). All other strings row 2 puts on the rendered surface are product speech already —
narration lines, inventory nouns — and are enumerated at close against the voice rule; the
pre-existing status-line and BOOT ERROR strings are row 7's named work, not this row's to
worsen or to fix. Valid `turn` has no narration; valid `go` narrates arrival (§8).

**The emittable-domain enumeration lives in `harness.js`** — an exported
`enumerateNarrationDomain(world, staging)` beside `create`, sharing the same outcome vocabulary
and precedence constants the dispatcher uses — and the validator **imports** it through the UMD
guard, exactly as it imports `groundplane.js`: never a re-derivation of the harness's rules at
the seam §12.9 measures. Cross-check with teeth (validator.spec): exhaustively dispatch every
intent × target pair through the real harness and assert every envelope's resolved narration
key falls inside the enumerated domain and resolves to a line — drift between dispatcher and
enumeration goes red in the suite, not on screen. **Probe protocol, constructive — one probe
per enumerated triple, never a shared live harness**: for each triple the spec builds a minimal
doctored fixture and a fresh harness on it, dispatches exactly once, and scores that envelope.
The construction rule reaches every triple by design: viewstate = the target's staged
location/facing (any *other* facing for `refused_unreachable` probes; the exit's own facing for
`go` probes); desk1/door1 states as the outcome requires (`refused_contained`: key1 known via
doctored knowledge, not held, desk closed; `refused_closed`/`arrive`: at the exit's facing with
door1 closed/open); `held_by` relations installed (and the `in`/`on` relation removed) for
`refused_held` probes; knowledge doctored where the probe requires an entity known. **Both
directions**: every scored envelope's key inside the enumerated domain, *and* the union of
scored keys equals the enumerated domain exactly (on this fixture: the 37 members §5 itemizes —
`turn.*.refused` is an authoring duty witnessed by its own doctored-fixture unit test, not a
domain member here) — a triple the construction cannot reach is a red finding, never a silent
skip. Valid `turn` envelopes carry no narration key and stand outside the domain — the
carve-out is explicit.

## 5. Narration prose (`fixtures/demo-study/narration.json`)

Real authored lines, c. 1660 study register (the blueprint's example is the bar). Honesty rules:

- **The four wildcard keys, exactly**: `toggle.*.refused_unknown`, `take.*.refused_unknown`,
  `go.*.refused_unknown`, `turn.*.refused` (the turn refusal's outcome name is `refused` — it is
  a can't-turn-that-way case, not an unknown-target case). `refused_unknown` exists **only** as
  its per-intent wildcard, one line shared by nonexistent and not-yet-known targets — the
  narration layer carries no oracle. The validator rejects any entity-specific `refused_unknown`
  key and requires all four wildcards.
- `open` vs `open_reveal` are distinct outcomes so the drawer's plain re-open never claims the
  key is inside after it is taken. The spec's example line is `toggle.desk1.open_reveal`.
  **Plain `open` must be authored contents-agnostic**: it fires both with the known key still
  inside (drawn in the cavity) and after the key is taken, so its prose may describe the drawer
  and never the contents — "the drawer stands open, empty" would lie half the time.
- **Refusal lines may fire with the entity out of view** (the §4 precedence makes
  `toggle chair1` from the hall a `refused_static`): no refusal line may assert visibility —
  never "you see the chair"; the chair's oak is stubborn wherever you stand.
- **Wildcard policy, one reading**: the four wildcard keys above are the **only** legal `*`
  keys — every other (intent × entity × outcome) triple in the domain, refusals included,
  requires its **entity-specific** key, and the validator rejects any other `*` key it finds.
  (The lookup's `${intent}.*.${outcome}` fallback exists in code solely so the four legal
  wildcards resolve; it is not a license to author more.) Per-entity refusal prose is the point
  of §12.9's full domain — the chair's refusal is a §12.1 walkthrough moment; author it.
- Success outcomes (`open`, `open_reveal`, `closed`, `taken`, `arrive`) additionally must be
  pairwise distinct lines — **globally**, across all ten success keys, not merely within an
  outcome class. **Entity-specific refusal lines carry the same floor**: identical strings
  across entities are a validator finding (per-entity refusal prose is the point of requiring
  entity-specific keys; six copies of one sentence would make the requirement decorative).

Domain membership vs authoring duty, one reading: **the enumerated domain is fixture-relative
and, on the shipped fixture, is exactly 34 specific triples + the 3 `refused_unknown`
wildcards = 37 members**. `turn.*.refused` is *not* a domain member here (no location has
< 2 facings, so the harness cannot emit it on this fixture) — it is an **authoring duty**:
§6.6(b) requires all four wildcard keys to exist, and the turn-refusal line's witness is the
doctored one-facing harness unit test, outside the domain equality. The §4 cross-check's
exact-equality therefore scores 37 probes. The 34, itemized on the shipped fixture — toggle: `refused_static`×6, `refused_unreachable`×2 (desk1, door1),
`open`×2, `open_reveal`×1, `closed`×2; take: `refused_fixed`×5, `refused_held`×3,
`refused_unreachable`×3, `refused_contained`×1, `taken`×3; go: `arrive`×2, `refused_closed`×2,
`refused_unreachable`×2. Every line non-empty, ≥ 10 characters, free of placeholder tokens.

## 6. Fixture validator (`tools/validate-fixtures.mjs`)

ESM tool, same shape as the bake (`--fixture-dir` flag); exports `validate(fixtureDir, records)`
returning a findings list (empty = pass) plus a CLI wrapper (exit 1 with numbered findings).
**Enforcement locus, pinned**: the bake calls `validate()` and refuses to bake an invalid
fixture — extending row 1's own precedent (the bake already refuses a bad boot viewstate), so
a hand-edited fixture cannot ship between suite runs; the suite additionally runs the validator
directly (validator.spec exercises red cases via the module import and in-memory mutations, so
no invalid tree ever needs baking).
Imports `src/groundplane.js` and `src/placeholders.js` records via `createRequire` — the UMD
guards' first real consumer. Checks:

1. **Truth/presentation split by key whitelist.** `world.json`: locations
   `{id, facings, exits{id, from, facing, to, arrive_facing, via}}`, entities
   `{id, sprite, location?, states?, state?, takeable?, transition?}`, relations,
   knowledge, schema — any other key (and any `u`/`x`/`y`/`px`-like coordinate) fails.
   `airborne` is **not** a world key — blueprint §3 has no such entity key and §6 homes it on
   the sprite record, where the contact shadow (presentation) reads it; `airborne` smuggled
   into an entity is a validator.spec red-mutation case.
   `staging.json`: a placement is a facing-placement object
   `{facing, attachment, u, v?, depth_m?, mirror?}`, an anchor placement `{anchor_on, t}`, **or
   an array of facing-placement objects** (§4's multi-facing license — `door1` in the shipped
   fixture; anchor placements never come in arrays) — any world-fact key (`state`, `states`,
   `takeable`, relations…) fails anywhere. The world whitelist is **exactly §3's keys** —
   `airborne` stays on the sprite record where §6 puts it (it drives the contact shadow:
   presentation), never in truth.
   **Numeric domains**: `u`, `t`, `v` (metres ≥ 0) and `depth_m` are validated by value, not
   just by name — `u, t ∈ [0,1]`; `depth_m ≥ 0` and small enough that the projected baseline
   stays on canvas (`scaleAtDepth ≤ px_per_m_at_bottom`, which also bounds it away from the
   `camera_wall_m` singularity); record `dims_m` all positive.
   **Placement↔truth consistency**: a staged facing's location must equal the entity's
   `location` (transition entities excepted: their staged locations must be exactly the
   locations whose exits name them `via`); every known entity must be staged, anchor-hosted, or
   held — an entity the document places that the picture never draws is the picture lying by
   omission.
2. **`viewstate.json` holds exactly `{location, facing}`** and they resolve in `world.json`.
3. **`mirror: true` rejected** (§4 — mirroring breaks one-light).
4. **All refs resolve — scope: fixture-internal and record-internal cross-refs.** Staged ids →
   world entities; `facing` strings → location/facing pairs; entity `sprite` → a library record;
   `anchor_on` host and its named anchor region → the host's record; exits' `via`/`to`; relation
   and knowledge ids. Stateful entities' `state` ∈ `states`; world states covered by the record
   (part `states` keys, or `states_images` ∪ {closed} for swap archetypes); every takeable
   record carries a thumb. **Anchor sanity**: `base`, `footprint`, and every anchor region lie
   inside the sprite canvas bounds with `x0 < x1` (and `y0 < y1`), and `drawer_cavity` lies
   inside the body bounds — wrong anchor data on the geometrically unchecked entities must not
   flow through every gate. Record-internal **image path strings are not checked at this row**
   (the procedural library has no files to point at); the row-4 library bake owns path
   resolution when files exist.
5. **Static overlap pairs** (`chair1`×`desk1` on study/N, `stick1`×`shelf1` on hall/N — §4's
   named pairs): co-staged on one facing, and their projected screen x-spans **and y-spans**
   intersect, computed through the imported `groundplane.js` functions and record
   dims/base/footprint — never a re-derivation. Meta resolution, pinned for row 4's sake: the
   staged facing's backdrop meta when one exists, grid canonical otherwise — the same
   resolution the renderer applies, so the validator's red/green stays meaningful when
   measured metas arrive. **Span formulas, exact**: x-span = the screen x of `footprint.x0`
   and `footprint.x1` through the entity transform (drawX + f·x); y-span =
   `[baseline − dims_m.h × scaleAtY(baseline), baseline]`. The y-span check is a deliberate strengthening
   beyond the row's "u-span intersection" [AI, standing license]: x-spans can intersect while
   the sprites share no screen rows, and a vacuous overlap would defeat the check's purpose.
   Pixel truth stays §12.8's; this catches a staging edit that parts the pair before a human
   ever renders it.
6. **§12.9 narration coverage**: enumerate the emittable (intent × target × outcome) domain from
   the fixture — every entity is clickable, both exits, all refusal outcomes, `open_reveal` only
   where unknown contents exist, turn refusal only if some location has < 2 facings — and
   require every triple to resolve to a non-empty, non-placeholder line under the §4 lookup.
   **The enumeration is imported from `harness.js`** (§4's `enumerateNarrationDomain`) — the
   validator never re-derives precedence. **The machine-checked honesty rules of plan §5,
   enumerated as validator findings**: (a) **every** domain triple except the four wildcard
   outcomes must resolve through an **entity-specific** key (plan §5's one-reading policy:
   wildcard resolution of any other triple is a finding, success or refusal); (b) the four
   wildcard keys must exist, and no other `*` key may; (c) any entity-specific
   `refused_unknown` key is a finding; (d) entity-specific success lines must be pairwise
   distinct globally across all success keys. **Non-placeholder, defined**: a line fails if it is
   empty after trim, shorter than 10 characters, equal to its key, or matches
   `/(TODO|TBD|FIXME|XXX|lorem|placeholder|⟦)/i`.

## 7. Chrome (`index.html`, `src/inventory.js`)

- **Click → intent** (bootstrap): scene-canvas coords via bounding-box ratio; `hitTest` on the
  current layout; entity e maps to — the open exit door on this facing → `go(exit.id)`; takeable
  → `take(e)`; otherwise → `toggle(e)` (a closed door click is a toggle; a chair click is the
  §12.1 UI-emittable refusal). **A click that hits nothing dispatches nothing** — no envelope,
  no narration, no paint; dead space is dead, as in the anchor's own stills, and "input event"
  in the journal arithmetic means a dispatched intent, so the row-1 framing holds.
- **Hover**: mousemove → `hitTest` → alpha-bbox outline stroked on the `#overlay` canvas
  (row 1's scaffold, first used), cleared when nothing is under the cursor **and cleared on
  every scene paint** — a keyboard turn with the cursor stationary must not leave the previous
  facing's outline glowing over the new scene (the overlay lies outside the hash tests, so
  discipline, not hashes, keeps it honest); `cursor: pointer` over a hit. Scene hash stays
  cursor-independent.
- **Inventory strip** (`src/inventory.js`, classic script + UMD): renders `#inventory` from
  `held_by` relations — a projection, re-rendered on every envelope; one tile per held item
  (thumb canvas copy, `data-entity`, noun as title).
- **Narration log**: `#narration`, scrollable, auto-scrolled, appended from envelope narration;
  the full transcript stays derivable from `harness.envelopes`.
- **The `go` fade**: `#veil`, a DOM overlay (opacity transition, ~400 ms, `pointer-events:
  none`), never canvas drawing; carries `chrome` so capture mode hides it.
- **Subscriber topology, pinned**: the harness keeps **one** subscriber — the bootstrap's scene
  painter, invoked only on non-empty events — and `HOLO_APP.paints` counts exactly those
  invocations (the no-redraw-on-refusal assert becomes exact: refusals leave `paints`
  untouched). Narration and inventory are **not** subscribers: every input handler calls
  `dispatch` and hands the returned envelope to one synchronous `updateChrome(envelope)`
  (narration append, inventory re-render); the boot `redraw()` also renders chrome's initial
  state. Refusal envelopes reach chrome (their line must show) without touching the scene.
- All new chrome carries class `chrome`. The bottom chrome (narration + inventory + status)
  grows the stage's vertical reserve from 3rem to 9.6rem; `shell.spec` expectations update, and
  the capture-spec viewport grows to 1536×1200 so the canvas still displays native-size.
- Chevron eclipse check (architecture's row-2 constraint): at each entity's **own baseline
  scale** the staged set projects inside roughly x ∈ [611, 846] (plan-time arithmetic over the
  record table); chevrons occupy < 62 px at each edge — no hit region is eclipsed, and the
  clickability sweep's `elementFromPoint` is the shipped witness, not this arithmetic.

## 8. Tests (all under `tests/playwright/`, mapping the done clauses)

**Viewport for every pointer-driven spec, pinned**: 1536×1200 — the canvas displays at scale 1,
so canvas pixels are CSS pixels and a 6 px coin is a clickable 6 px target; at Playwright's
default 1280×720 the contain-fit would shrink it below reliable integer-coordinate clicking.

New specs:

- `walkthrough.spec.mjs` — **§12.1** exactly as scripted, through real pointer/keyboard events
  only. **The full input-event sequence, pinned** (turns included — §12.2 clause 2 makes the
  exact sequence load-bearing): boot study/N → ArrowRight ×4 (the turn cycle, back to N) →
  click chair1 (envelope 0 events, refusal narration in `#narration`, scene hash unchanged,
  paints unchanged) → click desk1 (toggle open, `open_reveal`; key visible: scene ≠ same-run
  render with key1 deleted) → click key1 (take; inventory tile present; **cavity empty,
  operationalized**: the transformed cavity region hash-equals the same region in the same-run
  key1-deleted render) → click
  desk1 (close) → ArrowRight (N→E) → click door1 (closed: toggle open) → click door1 (open exit:
  go) → hall/W arrival; **door renders open from the hall side, operationalized**: the scene
  hash-equals the same-run direct render of the current world *and* differs from the same-run
  render doctored to door1 closed → **click the right chevron** (W→N — §12.1's own letter names
  chevron clicks among the real pointer events, so one turn in the pinned sequence is a chevron,
  witnessing that chevrons still turn with the hit-testing pointer layer live) → click coin1
  (take; **the scene-side half witnessed too**: post-take hall/N scene hash-equals the same-run
  coin1-deleted render — the unclipped `on`-relation removal, not just the clipped cavity one)
  → ArrowLeft (N→W) → click door1 (go) → study/E; door still open (the same two-sided
  doctored-render assert) → ArrowLeft (E→N) →
  click desk1 (open, plain `open`); key absent (scene hash-equals the same-run key1-deleted
  render), notebook present (scene **differs** from the same-run note1-deleted render — the
  same operationalization as its neighbours), **and the inventory strip
  still shows exactly its two tiles (key1, coin1), **each tile's canvas getImageData hash-equals
  its own entity's thumb canvas** (in-page pixel hash, the suite's own discipline — never an
  element screenshot; a strip drawing every tile from one thumb is a lie with the right
  `data-entity`), tile order following `held_by` relation order in the world document (truth
  decides; the test asserts it) — the held half of "exactly as you left it" asserted after the return
  trip, not only at the taking; and the hall's half witnessed render-side: a same-run direct
  render of hall/N hash-equals the coin1-deleted render (the coin is gone from the shelf, not
  just present in the strip)** — documented assertions after every step. §12.1's "document assertions after every step" is read as *write the assertions
  down* — and the cheaper stronger reading is taken too: after every world-mutating step the
  walkthrough also asserts the truth document itself (the toggled entity's state, the relations
  set, the knowledge set), so a stray extra mutation surfaces at the step that caused it. The
  hover-overlay assert runs once (overlay non-blank over desk, blank off it) **plus the
  staleness case §7 names: with the cursor left stationary over the desk, one keyboard turn —
  the overlay must be blank after the paint** (an outline for an entity no longer there is the
  overlay lying about the scene); **plus the knowledge-honesty case: pre-reveal, hover and a
  click at the key's future cavity position resolve to desk1, never key1 — blank of any
  key-shaped outline, no dispatch naming key1** (knowledge honesty is load-bearing on every
  surface, and the overlay sits outside all hashes); **plus outline identity: the overlay's
  inked pixels lie within the hovered entity's alpha bbox + pad, and hovering chair1 yields
  different overlay bounds than hovering desk1** (a fixed wrong rectangle is the overlay
  naming the wrong thing). Click
  coords come from in-page `layout`/`hitTest` scaled to CSS coords, **except the chair-refusal
  click, whose point is derived by test-side independent arithmetic** (§5 literals +
  `CAMERA_WALL_M` + record dims) and pinned to land **inside the chair×desk intersection box**
  where the test verifies from both solo-render alpha masks that chair AND desk are opaque —
  the painter contract guarantees the chair back panel opaque over the middle 60% of its
  trimmed width for its top-third rows, so the point has a pinned home, not a guess. The
  refusal envelope must name **chair1** — one real click that witnesses front-to-back hit
  resolution at a deliberately staged overlap pixel (a hitTest returning the farther desk
  would open the drawer and fail the no-events assert), so a shared layout/hit bug cannot
  agree with itself everywhere. **§12.4 zero-frames**: at every pre-reveal
  step, scene hash equals the same-run key1-deleted render. **§12.2 clause 2**: the whole script
  runs twice in fresh pages; the two hash sequences are identical.
- `harness-refusals.spec.mjs` — §12.1's licensed harness-level unit tests (API dispatch, same
  three asserts + world-JSON deep-equal + paints): `go` through the closed door, `take key1`
  while unknown, plus `refused_static`, `refused_fixed`, `refused_held`, `refused_contained`,
  `refused_unreachable` per intent, wildcard unknown-id refusals, and the doctored one-facing
  turn refusal.
- `isolation.spec.mjs` — **§12.3**: toggle desk **both directions** (closed→open and
  open→closed, each diffed against its predecessor); every differing pixel confined to the
  union of the drawer part's closed and open screen rects plus the cavity region (computed from
  record values + the §2 placement math in the test) with 2 px pad — **and each direction's
  diff intersects the drawer part's travel rect outside the cavity region** (non-empty alone
  would be satisfied by the key appearing/hiding in the cavity while a frozen drawer never
  moves — the diff must be attributable to the part).
- `knowledge.spec.mjs` — **§12.4 positive filter**: doctored fixture, desk open, key1 present in
  entities but absent from knowledge → cavity region hash-equals the same-run render with key1
  deleted from entities. Never a stored golden.
- `heights.spec.mjs` — **§12.5 rendered-height clause**: study desk1/chair1/door1, hall
  shelf1/stick1/door1; expected = `dims_m.h ×` the §5 lerp at the §2 baseline, computed in the
  test from §5 literals and `CAMERA_WALL_M = 3.5` as literals (independent arithmetic — the test
  re-implements the math, never imports groundplane); actual = alpha-bounds height of a solo
  render (entity-only doctored world, `no_backdrop: true`, shadows off) — never the renderer's
  scale. ±5%. **Plus position, not just scale** (a shared `xAtU` bug self-agrees everywhere a
  test asks the code where things are): for one entity per attachment type — desk1
  (floor_against), chair1 (floor_free), door1 (wall_mounted) — the solo render's alpha-bounds
  are also checked horizontally and vertically: base-anchor screen x within ±2 px of the test's
  own `xAtU` arithmetic, bottom alpha row within ±2 px of the test's own baseline arithmetic.
  **Plus the open-door geometric gate** (a swap state must not just change pixels, it must land
  right): door1 with state `open`, same solo render, alpha-bounds height within ±5% of 2.0 m at
  wall scale and bottom row at the floor line, on **both** facings — a mis-scaled or
  mis-positioned open leaf cannot ride a hash-changed assert to row 4. **Plus the `anchor_on`
  placement class** (the fourth class, all new math — host-region diagonal lerp, host-baseline
  scale, host transform): note1 (the unclipped case) gets the same treatment — solo render with
  desk1 open, alpha-bounds height within ±5% of `0.22 × scaleAtY(desk baseline)` and base
  position within ±2 px of the test's own re-implementation of the diagonal-lerp-through-host-
  transform arithmetic — so a mostly-clipped, mis-scaled, or mis-lerped child cannot hide
  behind a one-pixel "visible" assert. **And key1 — the intention's centrepiece — gets the same
  treatment in the clipped case**: solo render with desk1 open and key1 known; the key's opaque
  pixels inside the transformed cavity number ≥ 200; alpha-bounds height within ±5% of
  `0.12 × scaleAtY(desk baseline)` (the painter contract authors the cavity tall enough to
  contain the key at rendered scale, so the height is measurable unclipped); position within
  ±2 px of the test's own diagonal-lerp arithmetic. The reveal must land right, not merely
  differ by a pixel.
- `mechanisms.spec.mjs` — **§12.8**: tint / shadows / parts each disabled → hash differs from
  the full pipeline (asserted separately, on a scene where each fires — and **the parts scene
  is a harness-toggled world state** (desk1 toggled open through `dispatch`), never a
  `part_t`-override render, so a broken world-state→part-t mapping cannot hide behind the
  override input); **the drawer moves through toggle alone**: with key1 **deleted from entities** (not merely
  unknown — a first open would reveal it and the key's appearance could masquerade as the
  drawer's motion), `toggle desk1` changes the scene hash, and the diff intersects the drawer
  part's travel rect **outside the cavity region** — the part is provably the mover; drawer at
  `part_t = 0.5` differs from both end states; both named pairs overlap in **opaque pixels
  with a magnitude floor** (solo-render alpha masks at threshold 128 intersect in ≥ 50 pixels —
  bounding boxes never pass, and neither does one grazing pixel left by a staging nudge);
  **record→images derivation witnessed**: for every library record, `Object.keys(images.parts)`
  equals the record's part ids and `Object.keys(images.states)` equals its `states_images` keys
  (closed→body rule aside); **draw order
  asserted, not implied**: at an intersection pixel of each named pair, the composite equals the
  nearer entity's solo render (chair over desk, stick over shelf) — a reversed baseline sort
  must go red here, not at row 4's human moment; the desk body-recess assert from §1 (the body
  must not carry a baked drawer face); **contact-shadow geometry, not just firing**: for one
  entity per attachment type **plus one `anchor_on` child (note1, on the host surface — the
  fourth placement class)**, the shadows-only diff (shadow-on vs shadow-off render) has bounds
  centred within tolerance of the test's own base-anchor arithmetic and spanning no wider than
  footprint × ground scale + pad — shadow placement is ground-plane math and "must not survive
  to row 4" wrong; door toggle changes the scene hash on study/E **and** hall/W;
  `backdrop_only` hash-equals an entity-free render; grid facings render deterministically
  (row 1's structural-scan definition stands); **tint direction, not just firing — sampled on
  all three composite classes**: a flat-fill **body** pixel, a **part** pixel (drawer front, in
  a harness-toggled open state), and a **state-image** pixel (open door leaf) each equal the
  computable multiply-toward-`key_tint` at `TINT_ALPHA = 0.18` within ±2 per channel — a
  builder who tints bodies only, the exact divergence §3 step 4 names, goes red here rather
  than at row 4 (light *taste* stays with Kabe's eye, per the intention; this checks
  arithmetic, not beauty); **thumbs are content, not slots**: each takeable's thumb canvas has
  ≥ 500 opaque pixels and the three thumb hashes are pairwise distinct; **clickability sweep**:
  every staged entity, on its staged facing, receives a real pointer click at a rendered-alpha
  point **where its own solo mask is ≥ 128 and every nearer-baseline entity's solo mask is
  < 16** (hittable by the strict standard, unoccluded by the generous one) (the
  selection rule — the point comes from mask arithmetic, not from asking `hitTest`;
  independence from the hit path is carried by the walkthrough's arithmetic-pinned chair
  click), CSS-mapped, `elementFromPoint` confirming no chrome eclipses it, and the resulting
  envelope names it — **a fresh page per entity**, so a probe that takes or
  toggles never contaminates the next probe's world — notebook, candlestick, and shelf cannot
  ship dead hit regions just because the walkthrough never needed them (**key1 is excluded** —
  undrawn at boot; its click coverage is the walkthrough's take-key click; **door1 is swept on
  both its staged facings**); **the door
  round-trip**: on study/E, toggle open (hash A ≠ closed hash) then toggle closed — a narrated,
  harness-emittable success outcome no walkthrough step reaches — and the scene hash returns
  exactly to the original closed hash (the swap draws both directions); **the swap-door
  alignment gate witnessed from pixels — the two closed-frame clauses exactly as §1 pins them,
  which is the single home of the gate; this bullet is a pointer, not a second description** —
  plus: the open state's shadow span matches its drawn extent offset by `origin`, not the
  closed footprint.
- `validator.spec.mjs` — **§12.9 + the validator's own teeth**: `validate()` green on the repo
  fixtures; red (with the right finding) on each mutation class — coordinate in world, fact in
  staging, `airborne` on an entity, extra viewstate key, `mirror: true`, dangling
  sprite/anchor/exit refs, out-of-domain numeric (`u: 1.7`, `depth_m` past the singularity),
  staging↔location contradiction, known entity staged nowhere, parted overlap pair, missing
  narration key, placeholder-token line, wildcard-resolved success outcome, entity-specific
  `refused_unknown`, duplicate success lines, a specific key outside the enumerated domain
  (stray prose for a world that doesn't exist — `toggle.ghost.open` — is a finding). Plus the
  §4 cross-check **exactly as §4 pins it and nowhere else** (constructive per-triple probes,
  fresh harness per probe, both directions — §4's paragraph is the single home of that
  protocol; this bullet is a pointer, not a second description). Plus the enforcement locus itself witnessed: a scratch-tree case where
  an invalid fixture **fails to bake** (nonzero exit, finding on stderr) — the declared
  bake-refusal hook must demonstrably exist. Plus the two fault surfaces,
  witnessed by row 1's own scratch-tree doctored-bake pattern: a bake hand-edited to drop a
  narration line renders the product-voiced fault line with the key on `console.error`; one
  hand-edited to dangle a sprite id renders the product-voiced fault state in chrome, never a
  silently frozen canvas.

Row-1 specs adjusted, not weakened: `helpers.mjs` `renderDirect` builds the placeholder library
(entities now draw); `geometry.spec` re-points its grid-structure scans at a bare facing
(study/S) so it keeps testing pure grid; `shell.spec` reserve/viewport numbers per §7 above, and
its stale "scaled to window width" title dies. §12.2 clause 1 (identical fixture+viewstate twice
→ identical hash) lives in `determinism.spec` and is **extended, not inherited**: it must render
twice-and-compare **across two fresh `file://` page loads** (not one page rendering twice —
fresh loads also witness placeholder build-order determinism), at minimum: the entity-laden
boot facing, study/E with door1 open (a swap state), and one `part_t = 0.5` mid-state render —
the states clause 2's settled walkthrough path never covers.

## 9. Execution decomposition (file-disjoint; parallel builders, critics in worktrees)

| Piece | Files | Depends on |
|---|---|---|
| groundplane additions | `src/groundplane.js` | — (built first, by the assembler) |
| placeholders | `src/placeholders.js` | record table §1 |
| renderer | `src/renderer.js` | §2 functions, §1 library shape |
| harness | `src/harness.js` | §4 (self-contained) |
| narration prose | `fixtures/demo-study/narration.json` | §5 vocabulary |
| validator | `tools/validate-fixtures.mjs` | §6, groundplane, records |
| chrome + assembly | `index.html`, `src/inventory.js`, bake | everything above |
| tests | `tests/playwright/*` | the assembled whole |

Each fanned-out piece gets a fresh artifact critic in its own detached worktree after assembly;
the assembled whole gets its own. The one integration risk — interface drift between pieces — is
carried by this plan being the single home of every interface; a builder who needs to deviate
reports the deviation rather than absorbing it.

## 10. Risks, named

- **Overlap margins are thin** (chair×desk shares tens of rows). §4's license covers nudging
  u/depth values if §12.8's opaque-pixel check wants more; any nudge is recorded with its reason.
- **Takeable placeholder dims are legibility-cheated** (key 0.12, coin 0.06); honest at row 4.
  They are not §12.5 calibration entities, so no gate is softened.
- **Grid backdrops behind an open door**: the open-state aperture shows grid wall, not the far
  room. Correct for V1 — unestablished space is the grid, in-fiction — and row 4's backdrops own
  the far-room read.
- **Accepted V1 interaction consequences, said out loud**: input stays live during the go
  fade (`#veil` is pointer-events: none; a click through the fade dispatches into the arrived
  room — Myst's own snap-cut tolerance, accepted rather than gated); the `go` click target for an open
  door is the ~0.25 m leaf sliver (the aperture is transparent and hits nothing), and once an
  exit door stands open no pointer path can close it (open exit door click means `go` — §7's own
  mapping); `toggle door1 → closed` stays harness-emittable and narrated. Both follow from
  blueprint §7/§8 text; they surface at row 5's human pass as decisions, not surprises.
- **Takeable placeholder screen sizes**: key ≈14 px, coin ≈6 px tall at their staged scales —
  clickable by computed coordinates, marginal for a human cursor; the metre-value cheat buys
  little, and the real fix is row 4's asset scale probe ("takeable scale" is that row's named
  concern). Accepted V1 residue.
- **Chromium is the witnessed engine** (unchanged from row 1); one manual Firefox `file://`
  smoke after assembly. Row 2's painterly passes (radial-gradient shadows,
  `multiply`/`destination-in` composites, fractional-scale `drawImage`) are deterministic
  within that engine — which is all §12.2's letter witnesses; cross-platform hash stability is
  an accepted residue, same scope as row 1's engine note.
- **Row-1 known limits, scoped explicitly**: closed by this row — the refusal-vs-identical-
  redraw ambiguity (paint counter) and the stale shell-test title. Out of scope, still open,
  restated at close — the WebSocket construction-vs-handshake guard hole (row 2 adds no network
  seam) and BOOT ERROR's quiet styling (row 2 adds no boot path).

## 11. What architecture.md must carry at close (obligations on later rows die if they live only here)

- Row 3: the swap-state **`{image, origin}` contract** (per-image trim kept — no [HUMAN] text
  touched — with `origin` as the explicit registration, the parts precedent), the **closed-frame
  alignment gate** that replaces §9.3b's base-midpoint clause, and the **origin-determination
  step** row 3 must solve for real generated pairs (frame-in-frame prompt datum or a manual
  `--state-origin` flag) — one [AI]-tagged note in blueprint §9.3b, naming the rejected
  union-canvas route so Kabe sees both, and presenting row 2's green gate test as consistency
  of the placeholder with its own record, never validation against real pairs; and the
  **`drawer_cavity` semantics** — contents sit where they are visible when open, in body pixel space — so row
  3's manual anchor flagging and row 4's key-in-cavity probe inherit one convention, not a
  coin-flip.
- Row 4: the `{record, images}` **library-object envelope shape, verbatim** — including the
  per-state drawn-extent data the swap shadow reads — as the binding output contract of the
  row-4 `bake-library.mjs`, **witnessed by a deserialization-equivalence test** (on-disk
  `record.json` + PNGs → exactly the bound shape), not just "reproduce this shape" in prose.
  The `states_images` path convention (`states/open.png`) is arbitrary until row 3's emit
  format decides it; the bake follows row 3.
- `CAMERA_WALL_M = 3.5` **joins grid canonical meta** (amending the row-1 "GRID_K is not meta"
  note). The pinhole depth model is a **completion** of §5's [HUMAN] "inverse lerp" sentence,
  never a supersession: the blueprint §5 [AI] note must present **both readings** — (a)
  depth→scale itself a lerp in depth, (b) "inverse lerp" naming only the final yAtScale
  inversion, which the pinhole feeds — and record that (b) was built, pending Kabe's
  confirmation, **as a named gate on row 4's meta authoring** (row 4 measures per-facing meta
  against a depth model; measuring against an unconfirmed model is the fork this note exists
  to close), not a note beside it. The note also carries the **canonical-meta incoherence,
  with numbers**: the §5 scale lerp and a single pinhole camera at `horizon_y = 0.48`
  disagree (a pinhole through the wall endpoint implies ≈333 px/m at frame bottom where the
  meta pins 210; the lerp's implied vanishing line sits at y ≈ 0.32, not 0.48) — the composite
  model is an approximation no real camera produces, entity foreshortening and the authored
  horizon follow two different cameras, and row 4's measured metas will collide with it:
  **reconciliation is row 4's meta-authoring work, named now**. Reversal cost of the pinhole
  choice: groundplane, heights.spec, and the grid's transverse math rework in a new row.
- **The depth-model completion of [HUMAN] §5 is flagged to Kabe as a blocking question at
  this row's close** — answerable before row 4's meta authoring (rows 7 and 3 run first and
  neither consumes it) — and the close record presents §12.5's green as settling nothing about
  the model. The swap-state contract's trim/registration/gate half touches only [AI]
  text and its note is informative. Its **shadow half is a second [HUMAN]-text completion**
  (§7 step 6's ellipse-at-base/footprint formula, completed for swap states because its letter
  paints a full-width shadow under an edge-on sliver): flag class **informative-with-reason**,
  assigned explicitly — nothing downstream builds on it before row 4 sees pixels, unlike the
  depth model, whose blocking flag guards row 4's meta authoring; Kabe can raise its class in
  one word.
- The validator's overlap-check meta resolution (staged facing's meta, else grid canonical).
- The minted `attachment: "anchored"` token (a §6 completion, [AI]-tagged note in the
  blueprint): row 3's ingester and row 4's records must emit it for anchor-hosted takeables or
  the shipped validator goes red on their arrival.
- The stick1 staging change (`depth_m` 0.9 → 0.4, §4's own license, reason in §1's record
  table); **`v` is metres above the wall floor line** (a §4 completion — `u, t` are normalized,
  `v` is not; recorded so row 4's staging author cannot re-read it); record image **path strings are unvalidated until the row-4 library bake**
  (data:-URI route) resolves them; the §5 meta schema's named extension points (`wall_x0_px`,
  `camera_wall_m`).
- §12.1's "document assertions after every step" was read as: write the assertions down, plus
  truth-document asserts after every world-mutating step; turn steps are covered by clause 2's
  hash-sequence identity — the reading is recorded, not silent.
- Honesty of the close record itself: the §5 narration honesty rules are validator-enforced
  only as the four machine-checked clauses (§6.6 a–d); the contents-agnostic `open` line and
  the 1660 register are authoring discipline, gated by Kabe's transcript read at row 5.
- The record contract is exercised at V1 **as shape, not as file format** — no
  `library/<id>/record.json` (de)serialization runs until row 4's bake.
- The licensed strengthenings beyond the row text (y-span overlap check, `no_backdrop` switch,
  paint counter, open-door geometric gate, body-recess assert, per-step document asserts,
  position checks in heights.spec), each with its reason; the **surface-string enumeration**
  for this row's new strings (narration lines, inventory nouns, the product-voiced narration
  fault line) against the standing voice rule, with the pre-existing status/BOOT strings
  pointed at row 7; the open door's same-side-from-both-rooms read presented as **a decision
  Kabe can reverse at row 4** (e.g. by authorizing four state images), not as settled —
  **including the per-pixel reading of §7's "alpha bounds"** (a bbox reading would misroute clicks between the staged
  overlapping pairs, whose boxes intersect by design; the go-target sliver and the
  no-pointer-path-to-close consequences in §10 follow from it) — and the open door's
  same-side-from-both-rooms consequence (§1).
- The swap-gate asserts sit in their own mechanisms.spec test case, isolated — but the
  authoritative reversal-cost statement is §1's and only §1's: a reversal is a **new-row
  decision with real blast radius** (open-state art direction, drawn-extent shadow, row 4's
  prompt sheet), of which the isolated test case is merely the test-side portion. **Status,
  one reading**: the swap-state contract and closed-frame gate are **amended now and built —
  reversible by Kabe as a new-row decision**, never a proposal that gates row 3's boarding;
  the note informs, states the reversal cost, and presents row 2's green as consistency of
  the placeholder with its own record, not validation of the gate against real pairs.
