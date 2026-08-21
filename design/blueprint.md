# holo-emitter — blueprint

*Authored by Kabe [HUMAN] as `SPEC-M0.md`, before the front door; adopted verbatim as the blueprint. The build order lives as rows in `design/intention.md` — the spec list is the one home of targets. §12 below is the final end-to-end checklist that Done measures against.*

---

# SPEC — holo-emitter Demo (M0) + replicator Ingester v1

**Project:** holo-emitter (runtime renderer/client) + replicator (build-time asset pipeline) · **Version:** 0.2 · **Status:** ready for implementation · **Scope:** static browser demo (navigation, open/close, take) plus the build-time sprite ingester. No LLM calls at runtime. No pattern-buffer/Construct dependency — compatible shapes only.

---

## 1. Overview

Two deliverables:

1. **holo-emitter** — a static, browser-hosted, Myst-like scene client. Two rooms, four facings each. The player turns, moves through a door, opens/closes a desk drawer, and takes items into an inventory. Rendered as generated backdrops + composited sprites, driven entirely by a fixture document. Hostable on GitHub Pages with zero backend.
2. **The replicator (ingester v1)** — a Python CLI that turns a source image into a library sprite: alpha-matted PNG + a metadata record (anchors, attributes, placement rules).

**What M0 proves:** the compositing reads as one image (flip test); state changes are pixel-consistent; knowledge-frame rendering works (the key does not exist on screen until revealed); the document is the sole truth (leave, return, the drawer's contents persist).

**Naming.** The runtime client is **holo-emitter** (the device that projects the pattern); the build-time asset pipeline is **the replicator** (the device that fabricates objects from a description). Both sit beside **pattern-buffer** (truth store) and **construct** (drama engine) in the 5000Stadia family; this repo depends on neither. Unestablished space renders as the holodeck grid — in-fiction and literal.

**Explicit non-goals for M0:** zones/depth occlusion, WebGL, relighting beyond tint, creatures, the prompt/eval agent loop, automatic part decomposition, any network calls, any pattern-buffer import.

---

## 2. Repo layout

```
holo-emitter/
  index.html
  src/
    renderer.js        # pure draw: (document, library, viewstate) -> canvas
    harness.js         # intents -> document mutation -> envelope -> renderer
    groundplane.js     # screen-y <-> scale mapping
    inventory.js       # inventory strip UI
  fixtures/
    demo-study/
      world.json       # TRUTH  (entities, relations, states, knowledge, topology)
      staging.json     # PRESENTATION (facing assignment, u positions)
      narration.json   # authored prose per (intent, entity, outcome)
      viewstate.json   # [AI] BOOT VIEWSTATE only ({location, facing}) — the harness owns
                       # viewstate at runtime; this is neither truth nor staging, and the
                       # row-2 validator checks it holds nothing but those two keys
      fixture.js       # [AI] GENERATED from the sibling .json files by tools/bake-fixtures.mjs
                       # and committed — file:// pages cannot fetch JSON (§12.7), so truth is
                       # baked in; the .json files stay the sole truth and a staleness test
                       # byte-compares a fresh bake
  tools/
    bake-fixtures.mjs  # [AI] the fixture bake (byte-deterministic); package.json, lockfile
                       # and .gitignore are ambient tooling, not layout
  library/
    <sprite-id>/
      sprite.png       # RGBA, trimmed
      record.json
      parts/<part>.png # e.g. drawer_front.png
  backdrops/
    <location>/<facing>.png        # A-N.png ... B-W.png
    <location>/<facing>.meta.json  # floor line + scale calibration
    source/                        # [AI] asset-seat lane: candidates + <facing>.prompt.txt
  library-src/                     # [AI] asset-seat lane: sprite source images + per-asset
                                   # prompt.txt — committed, so every sprite's generating prompt
                                   # is on file and a wrong sprite is a prompt fix + regeneration
replicator/
  ingest.py            # CLI, python 3.11+, PIL + numpy only — a THIN wrapper
  contract.json        # the orientation contract + pinned gate thresholds (versioned)
  imaging.py matte.py anchors.py parts.py states.py thumbs.py gates.py
  preview.py record.py pipeline.py contract.py maskgen.py synth.py
                       # [AI, row 3] every stage an importable pure function (§4b rule 1);
                       # pipeline.ingest_sprite is the one entry point the CLI calls
  masks/<id>/<part>.png + .json   # [AI, row 3] committed part masks and their fitted recipe
  tests/
tests/
  playwright/          # render-hash + scripted-walkthrough tests
```

**Rule:** `world.json` never contains pixel/screen coordinates. `staging.json` never contains world facts. The renderer is the only place they meet.

---

## 3. Snapshot document — `world.json` (schema `holo-emitter/0.1`)

```json
{
  "schema": "holo-emitter/0.1",
  "locations": [
    { "id": "study", "facings": ["N","E","S","W"],
      "exits": [ { "id": "door_study_hall", "from": "study", "facing": "E",
                   "to": "hall", "arrive_facing": "E", "via": "door1" } ] },
    { "id": "hall", "facings": ["N","E","S","W"],
      "exits": [ { "id": "door_hall_study", "from": "hall", "facing": "W",
                   "to": "study", "arrive_facing": "W", "via": "door1" } ] }
  ],
  "entities": [
    { "id": "desk1",    "sprite": "desk-joined-oak-1660", "location": "study",
      "states": ["closed","open"], "state": "closed" },
    { "id": "key1",     "sprite": "key-iron",      "takeable": true },
    { "id": "note1",    "sprite": "notebook-vellum", "takeable": true },
    { "id": "chair1",   "sprite": "chair-joined",  "location": "study" },
    { "id": "door1",    "sprite": "door-plank",    "location": "study",
      "states": ["closed","open"], "state": "closed", "transition": true },
    { "id": "stick1",   "sprite": "candlestick-brass", "location": "hall" },
    { "id": "shelf1",   "sprite": "shelf-oak",     "location": "hall" },
    { "id": "coin1",    "sprite": "coin-silver",   "takeable": true }
  ],
  "relations": [
    ["in",  "key1",  "desk1"],
    ["on",  "note1", "desk1"],
    ["on",  "coin1", "shelf1"]
  ],
  "knowledge": {
    "player": ["desk1","note1","chair1","door1","stick1","shelf1","coin1"]
  }
}
```

Notes:
- `key1` is **absent from `knowledge.player`** at start. It exists in truth, not in the player's world.
- An entity's position in the world is expressed **only** by relations (`in`, `on`) or by `location` + staging. Never coordinates here.
- [AI] The hall exit and `shelf1` above are Navigator completions of the v0.2 sketch ("...mirror
  of above..."): `door1` is one entity joining both rooms — the study's E-facing exit and the
  hall's W-facing exit share it `via`, and its state is one fact seen from two sides.
- **Passage maintains orientation [HUMAN, 2026-08-20]:** "when you walk through the door you
  should maintain your directional orientation." Every exit's `arrive_facing` continues the
  direction of travel — walk east, arrive facing east — so the block above is written to agree:
  `door_study_hall` arrives facing **E**, `door_hall_study` arrives facing **W** (row 13, which
  flipped both to match this ruling in `fixtures/demo-study/world.json` — the block had briefly
  shown the pre-ruling values with a note explaining the mismatch; that note is now moot and the
  block itself is the agreement). The rule governs all future exits unless the world's own
  fiction demands a turn — the schema carries no field naming that exception yet, since M0's two
  single-exit rooms never need one; a future exit that does is a new-row decision, not one this
  note can pre-authorize.
- Static-demo caveat: the full document ships to the client, so "hidden" is honesty-by-convention here. In integrated mode (later), knowledge filtering happens host-side before emission; the client never receives unknown entities. Nothing in the renderer may depend on reading unknown entities — treat them as absent.

## 4. Staging — `staging.json`

```json
{
  "schema": "holo-emitter-staging/0.1",
  "placements": {
    "desk1":  { "facing": "study/N", "attachment": "floor_against", "u": 0.42, "mirror": false },
    "chair1": { "facing": "study/N", "attachment": "floor_free",    "u": 0.52, "depth_m": 1.2 },
    "door1":  [ { "facing": "study/E", "attachment": "wall_mounted", "u": 0.50, "v": 0.0 },
                { "facing": "hall/W",  "attachment": "wall_mounted", "u": 0.50, "v": 0.0 } ],
    "note1":  { "anchor_on": "desk1.surface_top", "t": 0.35 },
    "key1":   { "anchor_on": "desk1.drawer_cavity", "t": 0.5 },
    "shelf1": { "facing": "hall/N",  "attachment": "floor_against", "u": 0.30, "mirror": false },
    "stick1": { "facing": "hall/N",  "attachment": "floor_free", "u": 0.36, "depth_m": 0.9 },
    "coin1":  { "anchor_on": "shelf1.surface_top", "t": 0.6 }
  }
}
```

- `u` ∈ [0,1] across the facing's wall width. `t` ∈ [0,1] along a host anchor region.
- [AI] A placement may be an array: the entity draws on every facing named (door1's two faces are
  one truth, one state). `mirror: true` is forbidden in M0 — mirroring flips the baked key light
  to upper-right and breaks one-light; the staging validator rejects it. Each room stages at least
  one object-object overlap, named: study `chair1`×`desk1`, hall `stick1`×`shelf1` — exact u/depth
  values carry the license: change them if it makes the product better, and say why. Exercised at
  row 2: `stick1`'s `depth_m` is 0.75 in the shipped staging. The example above says 0.9, which
  also overlaps — an earlier note here claimed the spans stand clear at 0.9 and that is simply
  false through the shipped `groundplane.js`, so the reason is composition, not satisfiability: at
  0.4 the candlestick's base sits *inside* the bookcase plinth and the pair shows the mechanism
  without the quality, and at 0.75 it stands on the floor in front of the case with its upper body
  crossing it — column-before-building. Row 4's real asset needs only h ≥ ~0.11 m. The `u` values move with grid canonical
  `wall_width_m` (below), each keeping its metre offset from the wall centre. `v` on wall-mounted placements is **metres above the wall
  floor line** (`u`, `t` are normalized; `v` is not), and a wall-mounted placement takes wall
  scale at any `v` — the ground-plane lerp describes the floor, so reading it at a raised
  baseline shrinks a hung object by the amount it was raised [AI, row 2].
- Objects placed `anchor_on` derive position, scale, and draw order from their host — they have no independent u/v.

## 4b. The overhead plan — spatial source [HUMAN, 2026-08-20]

"2d overhead map geometry should be made first, then translated to the 3d holo-emitter." The
spatial source of a location is a 2D overhead plan — `fixtures/<fixture>/plan.json`: room
outline in metres, wall segments with what each carries (door openings, windows, fireplace),
object footprint positions, and the per-facing camera standpoint. The bake **derives** from it,
by projection through the ruled camera: staging's `u` and `depth_m`, and the meta geometry
fields (`camera_wall_m`, `wall_width_m`, corner positions). Hand-authored staging spatial values
become generated ones; the validator asserts staging ≡ plan projection. The truth/presentation
split stands exactly as written: the plan is presentation-side — `world.json` still never holds
a coordinate. The plan drawing itself is visual direction: it goes to Kabe as an image for OK
before anything derives from it. (What this buys beyond authoring sanity: facings can never
disagree about where a thing stands, row 11's corners and §5's geometry fields stop being
hand-measured guesses, and an overhead minimap later is a render of an artifact that already
exists.)

**The plan is a manor [HUMAN, 2026-08-21]:** "we should map a 2 story building with many rooms,
basically design a nice manor with appropriate rooms, courtyard, outdoor etc. and have per room
modular consistent design so creation is snappy." The overhead plan describes the full c.1660
English manor — Navigator's proposed roster, Kabe's to redline at the row-12 drawing: ground
floor great hall, study (the existing room, sited here), library, dining parlour, kitchen,
screens passage (the existing "hall"); upper floor long gallery (corridor type), master
bedchamber, guest chamber, solar; grounds: central courtyard (open type), walled garden (open),
entrance approach; stairs as exits between floors, the orientation law governing them.
`plan.json` gains floors; rooms carry a **type template** (chamber/hall/corridor/open) so every
room is the same modular recipe — plan polygon + wall carriers + the one style seed → four
prompt sheets → Kabe's pick loop → measured meta → sprite set — "per room modular consistent
design so creation is snappy." Unestablished rooms ship as holodeck grid with their typed
geometry, so the whole manor walks before it is painted (row 15); establishing a room is
production, not architecture. M0's §12 acceptance is unchanged — two furnished rooms prove the
engine; the manor proves it scales.
Two schematic laws [HUMAN, 2026-08-21]: **(a)** "Make sure the schematic of the space reflect
the distance from user to wall line" — the drawn plan marks every facing's standpoint and its
measured distance to the wall line it views; `camera_wall_m` is read off the drawing, never
invented at meta-authoring time, and corner positions derive from those drawn distances.
**(b)** "outdoor walls are only present as represented by exterior building walls" — open-type
spaces contain no invented enclosures: a wall seen from the courtyard or grounds exists only
where the manor's exterior wall actually stands in the plan; where no building stands, the
ground runs open to its far line. The building's one exterior outline is the single source of
every outdoor wall.

**Live-ingestion shape [HUMAN, 2026-08-21]:** "the methodology for going from a many location
description via something like pattern buffer / construct projector to overhead map to rooms
with elements should be structured for future live ingestion... consider the most efficient way
to make the sprites live during play even if we dont build for this here preferably live." The
considered shape [AI], binding as structure only — M0 builds none of it live:
1. *Every derivation is an importable pure function; every CLI a thin wrapper* — plan→staging
   projection, the bake, each replicator stage. Live mode is then a transport change (documents
   over the envelope wire instead of files), never a rewrite. Row 3 builds ingest.py to this rule.
2. *plan.json is the interchange document* a future host emits — its schema stays
   derivable-complete (types, wall carriers, drawn distances all in-document; no hand-only step).
3. *Materialization ladder:* grid silhouette → instant procedural archetype placeholder (the §6
   record renders before any art exists) → gate-passed generated sprite swapping in by library
   update — the renderer's purity makes the swap a frame's new input. Gate failure keeps the
   placeholder and retries; play never blocks. Latency is absorbed by the fiction: an
   unestablished room IS the holodeck grid, and establishing around the player is the product
   working, not loading.
4. *The library is the pattern buffer's material store* [HUMAN, 2026-08-21: "on successful
   creation does an asset get indexed into a library by short description (period, style, size,
   etc) so that on future map creations elements can be pulled from the library instead of
   recreated if it meets the criteria?" — yes, by design]: every gate-passed record IS its index
   entry — noun, archetype, period range/region, dims_m, light, attachment are §6 fields already;
   from row 4's emission the record also carries `style` (the fingerprint of the style_block
   generation that produced it), because a period- and size-correct asset from a different style
   seed would pass every other criterion and still break "one hand" on composite. Future map
   creation queries the library first (noun/archetype + period overlap + dims tolerance + style
   compatibility) and generates only on a miss; no separate index to drift — the records are the
   catalog.
5. The replicator's injected VLM callable (§9.2 v2) is the live anchor-detection hook.

## 5. Backdrop metadata — `<facing>.meta.json`

```json
{
  "floor_line_y": 0.63,
  "px_per_m_at_wall": 96,
  "px_per_m_at_bottom": 210,
  "wall_width_m": 4.2,
  "key_tint": "#c8b489",
  "image_h_px": 1024,
  "horizon_y": 0.48,
  "key_dir": "UL",
  "calibration_ref": "door frame, 2.0 m at wall plane",
  "calibration_px": 192
}
```

- [AI, row 2] **`camera_wall_m`** is a §5 field: the camera-to-wall distance the depth model
  divides by (`scaleAtDepth(d) = px_per_m_at_wall × cam / (cam − d)`). Grid canonical meta carries
  3.5; a facing meta that omits it inherits that constant, which is why it is named here rather
  than left implicit in code — row 4 measures it per backdrop alongside the rest, and a silent
  fallback would mean every real facing quietly assumed 3.5 whatever the backdrop was generated
  at. Its measurement procedure is row 4's to write with the others.
- [AI, row 2] The optional **`wall_x0_px`** extension point (a measured wall origin for an
  uncentred wall) is named the same way; grid mode centres by default.
- Values normalized to image height where marked; calibrate by hand per backdrop against
  `calibration_ref` — every facing names one known-height feature (door facings use the door,
  2.0m at the wall plane; the others name a paneling module, window sill, or similar) [AI].
- [AI] `key_dir` is the authored screen-space key direction — "UL" on every M0 facing: backdrops
  are generated so the key reads from upper-left everywhere, matching sprite contract UL45 (gate
  §9.4e covers sprites only; backdrops never pass the ingester, so this field is their light
  contract). `horizon_y` is the authored horizon at camera eye height 1.6m; acceptance asserts
  |`horizon_y` − (`floor_line_y` − 1.6·`px_per_m_at_wall`/`image_h_px`)| ≤ 0.02 — the
  camera-has-feet gate, independent of the calibration it feeds.
- [AI] Calibration is auditable against pixels, not just self-consistent: `calibration_px` is the
  measured pixel height of `calibration_ref` in the actual image, and acceptance asserts
  `px_per_m_at_wall` ≈ `calibration_px` / ref height in metres (±3%). A meta whose numbers cannot
  be traced to the image fails.
- [AI] **Viewport geometry, pinned.** Backdrops are generated at 1536×1024 (3:2, a native
  `gpt-image-1` size) and map 1:1 onto a fixed 1536×1024 logical canvas — no crop, no letterbox
  inside the canvas; the page contain-fits the canvas within the window (amended at row 1 from
  "fit the window width" [AI, standing license]: width-only scaling put the frame-bottom floor
  cut — the camera-has-feet device — below the fold on 16:9 screens). The floor runs to the
  bottom edge of frame (the frame-bottom cut is the camera-has-feet device). Flip pairs and all
  hash tests capture the canvas element only — never window chrome — so pairs differ in nothing
  but the composited sprites.
- **Ground-plane function:** for baseline screen-y between `floor_line_y` (depth = wall) and 1.0 (depth = nearest), scale = lerp(`px_per_m_at_wall`, `px_per_m_at_bottom`). `floor_against` objects sit exactly on `floor_line_y` offset by their own depth; `floor_free` objects convert `depth_m` → baseline-y by inverse lerp.
- [AI, row 2 — **a completion of the sentence above, flagged to Kabe as a blocking question,
  answerable before row 4's meta authoring**] "Inverse lerp" admits two readings: (a) depth→scale
  is itself a lerp in depth; (b) "inverse lerp" names only the final scale→y inversion, fed by a
  depth model the sentence does not fix. Reading (b) was built, with a pinhole model:
  `scaleAtDepth(d) = px_per_m_at_wall × camera_wall_m / (camera_wall_m − d)`, where
  `camera_wall_m` = 3.5 joins grid canonical meta (per-facing values arrive with measured
  backdrops, alongside the `wall_x0_px` extension point for uncentred walls). Known incoherence,
  with numbers: a single pinhole through the wall endpoint implies ≈333 px/m at frame bottom
  where this section pins 210, and the scale lerp's implied vanishing line sits at y ≈ 0.32, not
  the authored `horizon_y` 0.48 — entity foreshortening and the authored horizon follow two
  different cameras. The composite is an approximation no real camera produces; reconciliation
  is row 4's meta-authoring work, and §12.5's row-2 green witnesses implementation-against-model,
  never model-against-intent. Reversal cost: groundplane, heights.spec, and the grid transverse
  math rework in a new row.
- [AI, row 2 — **the fork above, stated in full; this is the blocking question for Kabe, and it
  is about the numbers in this section, not about the code that implements them.** Read it as
  being about §5's EXAMPLE block: the grid the demo ships has since been given a self-consistent
  meta of its own, described in §7's row-2 amendment, and where the two differ that is said
  below.] The example values above cannot all be true of one camera:
  - **The wall in frame is not `wall_width_m` wide.** 1536 px at `px_per_m_at_wall` 96 is
    **16.0 m** of wall across the frame; this section's example says 4.2. Since `u ∈ [0,1]` spans
    `wall_width_m`, staging could only address the **central 26%** of every facing.
    *Not true of the shipped grid*: §7's amendment sets grid-canonical `wall_width_m` to 16.0,
    the wall the grid actually draws, and §12.5 asserts `px_per_m_at_wall × wall_width_m ≈ canvas
    width` on any meta — the gate row 4's eight measured metas inherit. What that fixes is a meta
    contradicting its own frame; what it does not touch is the question below.
  - **It is not a 50 mm lens.** 96 px/m at 3.5 m implies a 336 px focal length on a 1536 px
    frame: a **133° horizontal field of view**, against §10's `focal_mm: 50` (≈40°).
  - **The floor line and the horizon fix `px_per_m_at_wall` at 96.** `floor_line_y` 0.63 minus
    `horizon_y` 0.48 is 0.15 × 1024 = 153.6 px, and that gap *is* the 1.6 m eye height — so
    96 px/m is exactly what the two authored y-values force. The three numbers are mutually
    consistent; it is `wall_width_m` and `focal_mm` that they contradict.
  - **The consequence for a named quality.** At `camera_wall_m` 3.5 with this section's example
    `px_per_m_at_bottom` of 210, the nearest visible floor is 1.9 m in front of the viewer: the
    frame bottom would cut the floor two paces away, not at your feet. *Not true of the shipped
    grid*: §7's amendment sets 332.8, the value §5's own horizon device implies, and the nearest
    floor is 1.01 m. What remains is the field of view below, and its consequence for apparent
    size: at 96 px/m a 1.3 m desk draws 125 px in a 1536 px frame whatever art row 4 produces,
    so *standing somewhere, not looking at a diagram* rides on the answer to this question and
    not only on row 4's meta authoring.
  - **The general result**, worth having before row 4's prompt sheets are written: with a level
    camera at 1.6 m in a 3:2 frame, the wall–floor line is only in frame when the wall in view
    is wider than ~4.8 m. A c.1660 study wall of 4.2 m and a visible floor cannot both happen
    with a level camera — one of *tilt the camera down*, *stand further back*, or *accept a very
    wide view* has to give, and which one is a look decision.

  **Nothing in this section was changed.** These are [HUMAN] values here and in §10, and an agent
  does not overrule a human-tagged decision. What §7's row-2 amendment changes is §7's own [AI]
  adoption of them as *grid-canonical* meta — a synthesized backdrop whose meta must at least be
  consistent with the picture it draws — and it is enumerated there. **Ruled in direction, 2026-08-20 [HUMAN]:** "The geometry
  elements should be determined by the orientation of the approved initial image generation."
  The approved image is the geometric authority: the probe backdrop Kabe approves is measured
  (horizon, floor line, scale, corners), its implied camera becomes the project camera — written
  here, into the other seven prompt sheets, and back into grid-canonical meta so grid rooms and
  generated rooms agree — and the horizon assertion checks each backdrop's self-consistency and
  its agreement with the *approved* camera, never a pre-authored one. §10's `focal_mm: 50` is
  the prompt sheet's starting point, not a gate. What remains open until the probe: nothing an
  agent decides — the camera is whatever the room Kabe loves turns out to have. Rows 7 and 3
  consume nothing from this.
  **Refined 2026-08-20 [HUMAN], with a supplied look reference:** "we should be a bit higher as a
  view angle looking down at about a 6ft height. For better visual presentation." §10's camera is
  now eye 1.83 m (6 ft), pitch −8° starting point — superseding the earlier [HUMAN] 1.6 m — and
  the reference's near-field lesson is recorded: the frame bottom may be anchored by a near
  *surface* (the reference's paper-strewn desk), not only floor — the camera-has-feet device
  through furniture. The reference image is Kabe's; it belongs in `design/references/` when Kabe
  places the file (pending, non-blocking).
  **Reference read with limits, 2026-08-20 [HUMAN notes, verbatim]:** "its oil painting style
  though and our final should be a finer resolution, stylization ok but thats a bit much" — the
  reference rules *feel* (light, depth, density, elevation), never finish: the style_block
  extracted at the probe aims for finer-resolution rendering with moderate stylization, not
  heavy oil impasto. And "the back wall isnt strait on it had a look at the corner of the
  room…. Which we should consider what looks best at the edges in a room to show the beginning
  of the next wall kind of thing" — each enclosed facing's backdrop shows the *beginnings of the
  adjacent walls* at the frame edges (wall returns at the corners), the same device row 11 gives
  the grid; how much return looks best is settled by Kabe's eye in the probe loop, then written
  into the prompt sheets and the measured `corner_x*_px` fields.
  **Style ruled, 2026-08-20 [HUMAN]: "fine oil realism,"** approved on two supplied references —
  a realist river landscape (signed Petriv, 2013) and a high-finish painted Parisian arcade.
  What the pair pins for the style_block: realist oil painting at high finish — crisp detail,
  smooth blended brushwork, true perspective, believable light and reflections, painterly warmth
  with **no visible impasto and no stylized distortion**. This supersedes "moderate stylization"
  as the finish target; the study reference still rules mood and light. The two references also
  happen to exemplify the open (landscape) and corridor (arcade) facing types beside the study's
  enclosed — one style across all three geometries. The reference images are other artists'
  works: they live in the conversation record and are **never committed** to this public
  repository; the style_block's written descriptors are their carrier here.
  **Seed picked, 2026-08-21 [HUMAN]: "Warm"** — of the seat's three generated candidates, ref 1
  (warm practicals, intimate wall, desk-edge anchor) is the approved style seed, installed at
  `design/references/style-seed-warm.png` (ours, committable). The probe's style_block
  extraction starts from it; warmth is the ruled temperament.
- Backdrops **contain no interactable or takeable objects** — those are always sprites. Author backdrop prompts accordingly (empty desk-less walls). This removes the clean-plate problem from M0 entirely.

**The room has corners — and a facing may have no wall at all [HUMAN, 2026-08-20]:** "the
horizontal corner of the room needs to be determined in location based on the distance expected
between the player and that wall" — and "the system account for no wall, if we are for example,
outside. Or wall like vertical geometry, like you would see in looking down an alley between two
buildings." So facing geometry is typed, not assumed: **enclosed** (facing wall, two corners),
**open** (no facing wall — ground runs to a far line/horizon), **corridor** (side planes
converging, open centre — the alley). The meta schema gains `camera_wall_m` (player-to-far-plane
distance) and corner positions (`corner_x0_px`, `corner_x1_px` — measured from the image for
generated backdrops; computed from `camera_wall_m` + `wall_width_m` + the ruled camera for the
grid), meaningful per type. The staging u-domain spans corner to corner where corners exist —
supersedes the centre-by-default 16 m wall. M0's two rooms are all-enclosed; the schema and
`groundplane.js` must simply not hard-wire a facing wall's existence, so open and corridor
facings are a meta entry later, not a renderer rewrite. Row 11 owns the grid half; row 4's meta
authoring owns the measured half.

## 6. Sprite record — `record.json`

```json
{
  "schema": "sprite/0.1",
  "id": "desk-joined-oak-1660",
  "noun": "joined oak writing desk",
  "archetype": "sliding",
  "attachment": "floor_against",
  "dims_m": { "h": 0.78, "w": 1.30, "d": 0.55 },
  "view_side": "left",
  "light": "UL45",
  "period": { "earliest": 1640, "latest": 1700, "region": "England" },
  "anchors": {
    "base":          { "x": 512, "y": 940 },
    "footprint":     { "x0": 96, "x1": 928 },
    "surface_top":   { "x0": 150, "y0": 210, "x1": 880, "y1": 260 },
    "drawer_cavity": { "x0": 300, "y0": 400, "x1": 700, "y1": 470 }
  },
  "parts": [
    { "id": "drawer_front", "image": "parts/drawer_front.png",
      "origin": { "x": 268, "y": 356 },
      "slide": { "dx": -0.18, "dy": 0.22, "scale_open": 1.07 },
      "states": { "closed": 0.0, "open": 1.0 } }
  ],
  "takeable": false,
  "airborne": false,
  "provenance": { "source": "generated", "tool": "manual-cut-v0" }
}
```

- All anchor coordinates in **sprite pixel space** of `sprite.png`.
- `slide` values are fractions of sprite width/height; state interpolates 0→1 along them, with `scale` lerped to `scale_open` (parallax cheat for a drawer coming toward camera).
- `view_side: left` = object turned 30° with its left side toward viewer. Renderer mirrors the sprite (and negates slide dx) when staging says `mirror: true`.
- Takeables additionally carry `"thumb": "thumb.png"` (square, for the inventory strip).
- [AI, row 2] Each record carries **`px: { w, h }`** — the body image's own pixel dimensions.
  A real `record.json` has `sprite.png` beside it to measure; the Node-side validator has no
  image to open, and the anchor-bounds arm has to know the canvas an anchor is supposed to lie
  inside. Row 3's ingester writes it from the matted image; row 4's bake must reproduce it.
- [AI, row 2] `attachment` gains a third token, **`"anchored"`**, for anchor-hosted takeables
  (key, notebook, coin): a total `attachment` function over records keeps the validator and the
  ingester's `--attachment` flag total, and omission would be a second, silent convention. The
  shipped validator requires `anchor_on` staging for exactly these — row 3's ingester and row 4's
  records must emit it for anchor-hosted takeables or they go red on arrival.

## 7. Renderer behavior (`renderer.js`)

Pure function per frame: `(world, staging, library, backdropMeta, viewstate) → canvas`. No state of its own. Canvas 2D only.

[AI] Three clarifications with the standing license (change if it makes the product better, say why):
- **The canvas never animates in M0.** No time input; part states render at their settled values
  (mid-state interpolation exists as an explicit renderer input, used by tests); the `go` fade is
  DOM chrome over the canvas, never canvas drawing — so §12.2's hash-per-settled-step is
  well-defined and the renderer stays pure. Myst itself snaps between stills; the anchor licenses
  this.
- **Debug/test switches are renderer inputs**, not hidden state: an options argument can disable
  tint, contact shadows, or part interpolation, and select backdrop-only — this is what §12.8
  drives, and purity is preserved because equal inputs still hash equal.
- **The holodeck grid is a product mode, not placeholder art**: when a facing has no backdrop
  asset, the renderer draws the procedural holodeck grid (in-fiction unestablished space). Row 1
  builds it as that mode; real backdrops later occlude it but never delete it. Grid mode supplies
  **canonical meta** — enumerated in the row-2 amendment below, which is its one home — so the
  ground-plane function is defined without backdrop assets, and it draws a small in-fiction
  **facing glyph** (N/E/S/W on the grid wall) so facings are visually distinct and `turn` is
  observable.
  [AI, amended at row 2 — completions of this bullet, all [AI]-on-[AI]; §5's own example block is
  untouched:]
  - **Grid-canonical meta, in full, and stated nowhere else:** `floor_line_y` 0.63,
    `px_per_m_at_wall` 96, **`px_per_m_at_bottom` 332.8**, **`wall_width_m` 16.0**, `horizon_y`
    0.48, `key_dir` "UL", `key_tint` `#c8b489` (deliberately non-identity so the §12.8 tint
    assertion is satisfiable on grid backdrops), `image_h_px` 1024, `calibration_ref` "wall grid
    module, 1.0 m at the wall plane", `calibration_px` 96, at 1536×1024; `camera_wall_m` 3.5 by
    the §5 fallback. The two bold values are the corrections to §5's example block, each with its
    reason below; §5's own block stays as Kabe's illustration of the schema, to be measured per
    backdrop at row 4, and §5's row-2 note says per bullet which of its numbers the shipped grid
    still uses. Both documents said different things about `wall_width_m` for a commit, which is
    how a [HUMAN] question came to be stated against numbers that were not shipping.
  - **`px_per_m_at_bottom` is 332.8 in grid canonical meta, not §5's example 210.** The grid is
    synthesized rather than measured, so its meta has to be self-consistent, and §5 states the
    floor twice: as the scale lerp, and as the horizon device that gives `horizon_y` its meaning.
    Both are linear in (y, scale) and both pass through (floor line, `px_per_m_at_wall`); the
    horizon device fixes the other end at `(image_h − horizon_y·image_h) / 1.6` = 332.8. At 210
    they disagreed and the lerp won: every floor object was drawn at the right size for a depth
    its feet did not occupy. §12.5 gains a clause checking **feet against the horizon device**,
    since a height check reads scale on both sides and cannot see this.
  - **`wall_width_m` is 16.0 in grid canonical meta, not §5's example 4.2.** The grid draws
    1536 px of wall at 96 px/m, so the wall in frame IS 16 m, and 4.2 made the meta contradict
    its own picture: `u ∈ [0,1]` spans `wall_width_m` (§4), so the document could address only
    the central 403 px of the frame and nothing could see it, because both sides of every §12.5
    assertion read the same meta. §12.5 gains the one clause that reaches outside a meta —
    `px_per_m_at_wall × wall_width_m ≈ canvas width`, plus §5's own calibration audit — which
    row 4's eight measured metas inherit. The staged `u` values moved with it under §4's own
    license, each keeping its metre offset from the wall centre, so the composition is unchanged.
    This settles nothing about the field of view: 16 m of wall at 3.5 m is a ~133° view against
    §10's 50 mm, and that stays §5's open question for Kabe.
  - **The grid draws the doorway.** Openings for the exits on the facing are derived from
    `locations[].exits` and the leaf's own §4 wall placement — never from coordinates in truth,
    and knowledge-filtered like every other read — and drawn in the backdrop layer, where §11
    puts them. A doorway exists whether or not its leaf is shut; the shut leaf occludes it
    exactly. The facing glyph stands clear of any opening, because centred it landed inside the
    doorway and the two door facings became the same picture.
  - **The grid floor carries enough luminance for a contact shadow to take some of it away.** At
    a near-black floor the *contact* quality is true of the code and invisible in the picture,
    and this is a product mode, not placeholder art.
- **Swap-archetype draw rule**: for sprites carrying `states_images`, draw step 4's body image is
  `states_images[state]` — whole-image swap, no parts, all other steps unchanged.
- **Hover highlight lives on a separate overlay canvas** (chrome, like the fade): the scene
  canvas hash is cursor-independent; flip pairs and all hash tests capture the scene canvas only.

Draw order:
1. Backdrop for `viewstate.location/facing`.
2. Entities assigned to this facing (via staging or via host chain), **filtered by knowledge**: skip any entity not in `knowledge.player`. Skip any entity with a `held_by` relation to the player.
3. Sort by baseline screen-y ascending (farther first). `anchor_on` children draw immediately after their host, after the host's parts.
4. For each entity: resolve position (§5 math), scale = dims_m.h × groundplane(baseline_y) → px, draw body, then parts at state-interpolated offsets.
5. Container contents (`in` relation) draw only when host `state == "open"` **and** content is known — positioned in the host's `drawer_cavity` region, clipped to it.
6. Per-sprite tint: multiply toward `key_tint` at fixed low alpha (single constant for M0). Contact shadow: soft ellipse at `base`, width = footprint span × ground scale, skipped when `airborne`. [AI] `anchor_on` children receive the same contact treatment scaled to their footprint, drawn on the host surface — an on-surface object with no grounding is a sticker.
   [AI, row 2] The ellipse's *depth* carries a floor as well as a ratio: a pure ratio gives a
   small footprint (the 0.16 m candlestick) a two-pixel hairline whose upper half hides behind
   its own feet, which is not a pool at a contact point. Width stays exactly this section's.
   And the check on it is quantitative — measured darkening and spread per object against its own
   footprint, on a floor with luminance to lose — because "the shadow changed some pixel" is
   satisfied by a shadow nobody can see.

Interaction regions = each drawn entity's screen-space alpha bounds (parts included). Cursor over region → highlight (subtle outline). Click → emit intent to harness. Edge chevrons / arrow keys → `turn`. Clicking an open exit door → `go`.

[AI, row 2 — a completion of the sentence above] **The doorway and its leaf are two targets.**
"Clicking an open exit door → `go`" read as one target sends every click on an open leaf to
`go`, and then no pointer path can ever close a door again — `toggle → closed` stays authored,
narrated, in the §12.9 domain, and unreachable by any player. So: a point resolves to the exact
pixel of a drawn entity first, then to an open doorway it falls inside, then to a widening
tolerance ring for targets too small to hit exactly. Clicking *through* the opening is `go`;
clicking the leaf is `toggle`. The tolerance ring is chrome — the alpha regions above are
unchanged — and it comes last so it cannot eat the opening; it exists because a hand cannot hit
an exact-pixel region a few pixels across.

## 8. Harness + envelope (`harness.js`)

Intents (complete list): `turn(dir)`, `go(exit_id)`, `toggle(entity_id)`, `take(entity_id)`.

Loop: intent → validate against world (is it a state entity? takeable? known? reachable in this facing?) → mutate the in-memory world copy → emit an **envelope** → renderer redraws → narration line appended from `narration.json`. [AI] `turn` mutates only viewstate and is silent (no narration key); `go` narrates arrival; the narration schema keys world-mutating intents and refusals only. The turn intent still flows intent→envelope→redraw from row 1 on — there is no second, harness-bypassing path to move the view.

```json
{ "turn_id": 7, "intent": { "type": "toggle", "entity": "desk1" },
  "events": [
    { "type": "state",         "entity": "desk1", "to": "open" },
    { "type": "knowledge_add", "entity": "key1" }
  ],
  "narration": "The drawer resists, then gives. Inside, an iron key." }
```

Rules:
- First `toggle → open` of a container adds its unknown contents to knowledge (`knowledge_add`). This is the reveal.
- `take` requires: takeable, known, and (if contained) host open. Effect: add `["held_by", id, "player"]`, remove `in`/`on` relation. Inventory strip re-renders from `held_by` relations — it is a projection too.
- `go` requires the door state `open`; plays a fade (DOM chrome, not canvas — §7 [AI]), sets `viewstate` to target location + `arrive_facing`.
- Invalid intents emit an envelope with no events and a refusal narration line. The picture never changes when the world doesn't.
- [AI, row 2] That rule has two halves and the second is the easy one to drop: a frame this
  transport cannot read *at all* — an unknown `type`, a missing `entity`/`exit`, a malformed
  `turn` — must still answer. The wire failed, not the world, so the line is the product-voiced
  fault line rather than a fixture-authored refusal, and it is outside §12.9's domain (nothing in
  a fixture emits it). Unreachable from the shipped UI; it matters because this envelope format
  is the future websocket wire format and a malformed frame from Construct must not vanish.
- [AI, row 2] `toggle` steps along the entity's **own declared `states`**, never a hardcoded
  open/closed flip — which would write an entity a state absent from its own list, silently and
  with a success envelope. M0 pins exactly `["closed","open"]` (the §7 swap rule reads "closed"
  as the body image; the outcome vocabulary and narration keys are named for them) and the
  fixture validator enforces the pin, so the assumption is checkable rather than implicit.
- The envelope format is the future websocket wire format. The harness is a stand-in for the Construct transport server (holo-emitter later ships as a Construct transport; this module boundary is that seam); keep it in its own module with no renderer internals.

## 9. Ingester v1 (`replicator/ingest.py`)

CLI:
```
python ingest.py IMAGE --id desk-joined-oak-1660 --noun "joined oak writing desk" \
  --archetype sliding --attachment floor_against --height-m 0.78 --view-side left \
  [--part drawer_front:PATH_TO_MASK.png --slide=-0.18,0.22,1.07] \
  [--state open:PATH_TO_OPEN_STATE_IMAGE.png] [--takeable] [--out library/]
```

[AI, row 3 — the CLI as built, so this block does not describe one that does not exist:]
```
python3 -m replicator.ingest IMAGE --id … --noun … --archetype … --attachment … \
  --height-m H --width-m W --depth-m D [--view-side left] \
  [--part ID:MASK.png --slide=dx,dy,scale_open] \
  [--anchor NAME:x0,y0,x1,y1] [--footprint x0,x1] \
  [--state NAME:IMG --state-datum x0,y0,x1,y1 | --state-origin NAME:x,y] \
  [--takeable] [--airborne] [--source S] [--object-class C] \
  [--out library/] [--preview-dir DIR] [--report R.json] [--check] [--json]
```
`--width-m` and `--depth-m` are required and come from period reference: §5 says the project camera
is unsettled, so deriving a persisted world dimension through it would put an unsupported number in
the record; the pixel arithmetic survives as a warn-only cross-check in `measured.dims_cross_check`.
`--anchor` and `--footprint` are given in **source image** coordinates and translated by the trim
offset. `--check` runs everything, writes nothing, and exits the code it would have exited. Exit
codes partition by who must act: 0 pass (warnings allowed), 2 regenerate the source, 3 fix the
invocation, 4 the contract file itself is wrong.

Stages (all automatic unless noted):
1. **Matte.** Background = border-sampled grey (median of 1-px border). Flood-fill from all borders on ±tolerance → outer background. Then find enclosed regions matching background color inside the silhouette → punch as holes (leg gaps). Feather 1px. Trim to content bbox. Output premultiplied-safe RGBA.
2. **Anchors.** `base` = midpoint of bottom-extreme opaque pixels (bottom 2 rows). `footprint` = x-extent of those pixels.
   [AI, amended at row 3 — the contract as built, reversible by Kabe as a new-row decision, in the
   same form as §9.3b's row-2 amendments:] **`footprint` and `base.x` are ground-contact facts, not
   bottom-row facts.** Measured on the corpus desk, the bottom-two-rows extent is **27 px of 1144**
   — the nearest ball foot in a three-quarter view — while the desk's real ground contact spans
   **24 → 1106**. `footprint` is what the renderer draws every grounded object's contact pool from,
   against a quality that reads "nothing sits on a floor without it", so taking this sentence
   literally on generated art gives a desk a pool 2% of the width of its own feet. The ingester
   derives both from the **contact band** (columns whose lowest opaque pixel lies within
   `band_fraction` of the content height of the bottom), carries the bottom-two-rows value beside
   it in `measured.contact`, and accepts a `--footprint x0,x1` override. `px` and `base.y` are
   unchanged and stay pixel-identical. Row 4's bake inherits the clause re-expressed: `footprint`
   *contains* the bottom-two-rows extent and lies inside the canvas, rather than equalling it.
   This section's own v2 sentence — Kabe's, below — names exactly this problem, which is why the
   amendment reads as its v1 form rather than as a departure. `surface_top` / cavity regions: **manual for v1** — flags `--anchor surface_top:x0,y0,x1,y1` (VLM auto-detect is v2, stubbed behind an injected `(prompt, schema) -> json` callable, same convention as pattern-buffer). The v2 shape, in Kabe's words [HUMAN, 2026-08-19]: "on ingest an llm looks at it and identifies the rear points that touch the ground, or the appropriate zones it exist in in relation to the background or anchor locations in relation to other objects (envelope anchor to desk top for example)" — the callable receives the matted sprite and returns the §6 anchor regions as schema-validated JSON; v1's geometric `base`/`footprint` stays as the deterministic cross-check on whatever the model claims.
3. **Parts.** v1 takes a hand-drawn mask PNG per part; ingester cuts the part, inpaints the cavity with darkened content-aware fill (PIL blur-fill acceptable — cavity quality bar is low), records origin, writes both PNGs.
3b. [AI] **Two-state (swap archetypes — the door leaf).** `--state open:IMG` runs the second image through stage 1 and records it as `states_images.open` beside `sprite.png` (the closed state). Gate (d) does not apply to swap sprites; gate (e) applies to both images. Contract note: a state-variant source prompt replaces "all moving parts closed and fully seated" with the named state ("door leaf fully open"), all other blocks unchanged.
   [AI, amended at row 2 — the contract as built, reversible by Kabe as a new-row decision, never
   a proposal gating row 3's boarding:]
   - **`states_images` entries are objects**, `{ "open": { "image": "states/open.png", "origin":
     { "x": …, "y": … } } }`, where `origin` is the state image's top-left in **closed-sprite
     (body) pixel space** — the `parts[].origin` precedent applied to states. Each state image is
     trimmed per image, exactly as stage 1 says (no [HUMAN] text touched); the single `anchors`
     block stays the closed state's. The rejected alternative — one shared union-trim canvas for
     both states — would have deviated from stage-1 trim and hidden the registration problem
     inside authored pixels; it is named here so both routes are visible. `origin` **is** the
     registration between two independently generated state images: row 3 must solve the
     determination step for real pairs (keep the door frame in frame as the registration datum,
     or a manual `--state-origin x,y` flag beside the v1 anchor flags) — the problem is stated,
     not solved.
   - **The alignment gate, redefined in the closed frame**: the original clause here — per-image
     `base` midpoints agreeing within 2% of width — is unsatisfiable by the very open state §11
     mandates (a leaf swung near-flat moves its bottom-pixel midpoint to the hinge side by ~a
     third of the sprite width). The gate is now, judged in closed-sprite pixel space:
     (i) `origin.y` + state image height agrees with the body's bottom edge within 2% of body
     height; (ii) the state's rect lies within the body canvas bounds. These clauses ARE the swap
     gate — the base-midpoint clause is deleted for swap sprites. Clause (ii) is true of M0's
     door and **not general**: an open state whose silhouette exceeds the closed bbox (a raised
     chest lid) needs a licensed exception. Row 2's green witnesses consistency of the
     placeholder with its own record, never validation against real generated pairs.
   - **Swap-state contact shadow** (a completion of §7 step 6's [HUMAN] ellipse-at-base formula,
     flag class informative-with-reason: its letter paints a full-width shadow under a near
     edge-on sliver): for a non-closed state the shadow derives from the drawn state's
     bottom-opaque x-extent, computed from the state image at library build time and carried as
     `images.states[state].extent = { x0, x1 }` in body pixel space — never the closed
     `base`/`footprint`. Row 4's library bake reproduces these derived extents.
   - **`drawer_cavity` semantics**: contents sit where they are visible when *open*, in body
     pixel space — v1 manual anchor flagging and row 4's key-in-cavity probe inherit this one
     convention.
3c. [AI] **Thumbs.** `--takeable` auto-emits `thumb.png`: square, content-bbox-centred crop, 128px. Gate: every takeable record carries a square thumb.
4. **Gates (hard fail unless noted).** [AI: gate thresholds are pinned in `contract.json` *before* the corpus runs, and the test suite carries a negative control — an image constructed to fail (grey halo on grey ground) that must demonstrably fail; a gate tuned until the corpus passes is no gate.] (a) halo: mean saturation of border-adjacent semi-alpha pixels must not read grey (report + fail); (b) holes: enclosed background-colored regions remaining at alpha>0 → fail; (c) min resolution: content bbox ≥ 512px tall for furniture, ≥ 128px for takeables; (d) **state diff**: composite(body+part@closed) vs original — pixel diff outside part mask must be ≈0 → fail; (e) light direction (Sobel-based bright-side estimate) vs contract `UL45` → **warn only**, record deviation.

   [AI, amended at row 3 — the gate set as built, reversible by Kabe as a new-row decision:]
   **The ingester runs fifteen checks, not five**, and what a single run emits depends on the
   sprite: **nine** for a static one, **thirteen** for a sliding one, **thirteen** for a swap (a
   swap runs (a) and (e) twice — once on the body, once on the open-state image — and each
   verdict names its image in its own id, as `a[states.NAME]`). The
   full set is (a)-(h), `alignment`, `registration`, `slide`, `open_state`, `thumb`, `dims`, and
   `part_mask` — of which `part_mask` carries no verdict (see below) and (e) and `dims` warn.
   "Passes gates" downstream means every **hard** check in the set the sprite's own archetype
   invokes. Beyond (a)–(e): **(f) contact** — the footprint the contact pool is drawn from is a sound
   derivation, hard, floor-attached only; **(g) over-matte** — the matte is not eating the object,
   measured as the silhouette's sensitivity to a ±25% tolerance sweep, hard (nothing in the original
   five hunts a *bitten* silhouette, and a key with its shaft matted away exits zero while reading
   as broken); **(h) shadow** — no cast shadow welded into the silhouette, hard (`negative_block`
   forbids one and generators produce them anyway; the matte keeps a soft ground shadow as opaque
   object pixels and every other gate accepts it); **alignment** and **registration** for two-state
   sprites; **slide** and **open_state** for parts (nothing in the original five ever looks at the
   open state, so a part cut perfectly and travelling to the wrong place passes everything);
   **thumb**; **dims**, warn-level, comparing the declared width against the drawn one; and
   **part_mask**, which is **reported with no verdict** — on constructed art it separates a correct
   mask from a displaced one perfectly, and on the corpus desk the ordering inverts, so it cannot
   carry one.

   **`slide` is the check the row's own asset needed.** A drawer must clear its recess *and* stay
   against its carcass. With only the clearance bound in force the corpus desk shipped with its
   open drawer 79 body px below the recess — at the real 89 px draw height, clear of the cavity and
   straddling the stretchers, reading as a plank lying on the floor while every other gate stayed
   green. The bound that catches it is measured from the body's own pixels: the fraction of the
   travelled part that still lands on opaque carcass.

   **Clause (a) as built.** Its letter — "mean saturation of border-adjacent semi-alpha pixels must
   not read grey" — taken as an absolute saturation floor **false-fails an honestly grey object**,
   and M0's takeables are an iron key and a silver coin. As built it is three ratio clauses plus a
   composited-rim clause judged over a dark ground and a light one at real draw scale, which is the
   only one that can see a halo that appears in the room rather than on the studio grey. The rim
   clause needs no fitted number: straight-alpha compositing fixes what a correct edge pixel must
   composite to, so the normalized residual is zero for a correct edge whatever the colours are.

   **Calibration authority.** No hard threshold is calibrated on the corpus it judges: every block
   in `contract.json` declares `contract`, `control` or `observed` authority with a `basis`, and an
   `observed` threshold is refused at load time. `design/architecture.md`'s replicator section holds
   the whole scheme.
5. **Emit** `record.json` (schema §6), populated from flags + derivations; `provenance.tool = "replicator-ingest-v1"`.

Test corpus: the two existing 1660s desk generations. Both must pass matting + gates; the second (teardrop pulls) becomes `desk-joined-oak-1660`.

## 10. Orientation contract (`replicator/contract.json`)

```json
{ "schema": "orientation-contract/0.1",
  "camera": { "view": "front-three-quarter", "turn_deg": 30, "side": "left",
              "eye_height_m": 1.83, "pitch_deg": -8, "focal_mm": 50 },
  "light":  { "key": "UL45", "quality": "soft", "fill": "even" },
  "framing": { "background": "seamless mid-grey", "margin": "full object centered",
               "states": "all moving parts closed", "props": "none" },
  "prompt_block": "Front-three-quarter view turned 30 degrees to viewer-left, shot at 50mm, camera at 1.6m eye height, object centered and fully in frame, single soft key light from upper left at 45 degrees with even fill, plain mid-grey seamless background, sharp focus edge to edge, all moving parts closed and fully seated, panel and drawer edges clearly delineated with visible reveal gaps, nothing resting on or in front of the object, no props, no scene",
  "negative_block": "cast shadow on background, dramatic lighting, rim light, vignette, depth of field, cropped, background scenery, props",
  "style_block": "AUTHORED AT ROW 4 PROBE — extracted from the Kabe-approved study/N backdrop and written here before any sprite generation: palette (named hexes), medium (e.g. painterly gouache vs photoreal), grain/texture character, period rendering descriptors. Every backdrop AND sprite prompt appends it; the sprite hand reads this file and nothing else for style.",
  "backdrop_block": "AUTHORED AT ROW 3 with this file [AI]: the room-scale counterpart of prompt_block — interior view at 1.6m eye height, 50mm, 1536x1024, single soft key reading from upper-left of frame, overcast diffuse daylight through any window, no visible sun shafts, floor running to the bottom edge of frame, no furniture, no props, door frame/opening only where the section 11 wall map places one. Per-facing wall-map specifics live in the row 4 prompt sheets; this block is what every backdrop prompt appends." }
```

Every generated sprite and backdrop prompt appends the relevant block. Ingester gate (e) checks arrivals against `light.key`.

[AI, row 3] **The authored file at `replicator/contract.json` is the home; the JSON above shows its
shape.** Three differences in the file, each with its reason recorded there: `prompt_block` and
`backdrop_block` say **1.83 m** (Kabe's 2026-08-20 six-foot ruling, which `camera.eye_height_m`
already carried while the prose did not) and name the **−8° pitch** (a sprite generated level will
not foreshorten its top surface like the floor it stands on); and `backdrop_block` does **not**
carry §10's placeholder light clause, because §11 marks that phrasing superseded by Kabe's look
reference and says the real light design lands in his probe loop — so the block states the
constraint that matters (one dominant key per frame, its direction and colour recorded in that
facing's own meta) and is marked `status: "provisional"` in the file. It carries an open fork for
Kabe: **if `key_dir` varies per facing, one sprite set cannot match every room**, since a sprite
bakes one light and §1's non-goals forbid relighting beyond tint. That must be answered before row
4's prompt sheets are written. The file also carries the gate thresholds §9.4 pins, each with its
authority and basis. `style_block` is untouched.

## 11. Assets to produce (complete list)

Backdrops (8 + meta): Study N/E/S/W, Hall N/E/S/W. One style: c. 1660 English interior, oak paneling, leaded windows; consistent key light; **no furniture, no props** in any backdrop; the exit walls contain a door *frame/opening* only (door leaf is a sprite).

[AI] **Wall maps** (authored so four generations depict one room; standing license applies):
- *Study* — N: paneled wall with stone fireplace; E: the door opening to the hall; S: leaded
  windows; W: blank oak paneling with wainscot.
- *Hall* — N: paneled wall (shelf1 stands against it); W: the door opening to the study; E:
  leaded window at the far end; S: tapestry on paneling.
- **World light [superseded 2026-08-20 by Kabe's look reference]:** the earlier "overcast diffuse,
  no sun shafts" was an [AI] simplification to keep one screen-space key plausible; Kabe's
  reference rules the feel instead — warm practicals (fire, lamp, candle) against a cool window.
  The real light design lands in Kabe's probe loop; each approved backdrop's `key_dir` and
  `key_tint` are *measured from that image* per facing, and sprites are tinted and lit to match
  the facing they stand in. The one-light quality is unchanged — it now means "one light *per
  frame*, the backdrop's own" rather than one global direction.
- **Cross-facing coherence** (corners continue, paneling module repeats, one room reads) is judged
  by Kabe inside the backdrop generation loop — the human eye at generation time is the gate — and
  re-checked on the batched eight-facing screenshot set, per room, at row 4.
- **The door leaf is authored visually symmetric** — plain plank leaf, centred iron ring pull, no
  visible hinge asymmetry — so the one face image is honest from both rooms (mirror is banned and
  a two-faced leaf would need it, or four state images §11 does not authorize). The **open**-state
  source is prompted with the leaf swung near-flat to the wall, close to edge-on, so hinge side
  stays unreadable; the §12.6 batch names this known asymmetry risk so a fail there is a prompt
  fix, not a surprise. [AI, row 2] The *gap* beside the open leaf is on the same screen side from
  both rooms too, which §11's symmetry device does not cover: the leaf's origin is fixed in the
  record. Making it per-facing needs somewhere in §4 to say which side the leaf swings — a
  schema addition, so Kabe's call, carried into row 4's batch note with the leaf question.
- [AI, row 2] **The painted door opening must coincide with the door leaf's §4 placement
  rectangle.** The page's "walk through" target is that rectangle, computed from the leaf's
  placement; grid mode draws its own opening there, and a real backdrop paints one. If the two
  diverge, the picture shows a doorway in one place and accepts the click in another. This is a
  constraint on row 4's per-facing prompt sheets and on the wall-map measurement, not a renderer
  setting.

Sprites (7): desk (with drawer_front part) · key (takeable) · notebook (takeable) · coin (takeable) · chair · candlestick · door leaf (hinged: two-state = closed image + open image for M0, no decomposition needed — swap, don't slide). Shelf may be baked into a Hall backdrop **only if nothing interactable sits on it — but coin1 sits on it, so shelf1 is a sprite too** (8th sprite, static; id `shelf-oak` [AI]).

## 12. Acceptance (all must pass)

1. **Scripted walkthrough (Playwright):** turn×4 → click chair1 (UI-emittable refusal: envelope with no events, refusal narration, scene-canvas hash unchanged) → toggle desk open → assert key visible → take key → assert inventory has key, cavity empty → toggle desk closed → toggle door1 open → go to hall (arrives facing the direction of travel, away from the door) → turn back to face the door and assert it renders open from the hall side → take coin → go back to study (arrives facing the direction of travel, away from the door) → turn back to face the door and assert it is still open — persistence → toggle desk open → assert key still absent, notebook still present. Document assertions after every step. [AI: door-toggle steps and refusal coverage are completions — the v0.2 script walked through a door it never opened, and no acceptance exercised "the picture never changes when the world doesn't". The walkthrough acts through **real pointer and keyboard events** — clicks on drawn entities' alpha hit-regions, chevron clicks, arrow keys — never by calling the harness directly, and asserts the hover highlight (overlay canvas) once; the interaction layer has no other gate. Refusals the UI cannot emit — `go` through a closed door (a closed door click is a toggle), `take key1` while unknown (undrawn, unclickable) — are covered by **harness-level unit tests** beside the walkthrough: a licensed exception that tests the harness API directly, with the same three asserts, adding no product affordance.] [AI, row 13: the two "turn back" steps are the passage-maintains-orientation ruling's consequence — arrival no longer faces the door, so persistence can only be read from the picture by deliberately turning to the door's own facing; each turn-back is checked against a reference captured **before** the passage (the room just left, captured live, for the return trip; a solo render of the pre-departure world for the outbound one), never against a same-run re-render of whatever the live world holds after crossing, which would agree with itself even if crossing silently reset the door.]
2. **Determinism:** identical fixture + viewstate rendered twice → identical canvas hash. Full walkthrough replayed → identical hash sequence.
3. **State isolation:** toggling desk changes pixels only within the drawer part + cavity bounds (diff mask check).
4. **Knowledge:** before first open, `key1` appears in zero frames — and the filter is exercised positively [AI]: render, through the pure renderer, a doctored fixture with `desk1` open and `key1` absent from `knowledge.player`; the cavity region must hash-equal the empty-cavity reference — which is a **same-run render** of the fixture with `key1` deleted from `entities`, never a stored golden image. (A closed-drawer-only check never touches the filter — a renderer that ignores knowledge entirely would pass it.)
5. **Geometric:** each floor entity's rendered height within ±5% of dims_m through the ground-plane fn (measured on 3 calibration entities per room — any staged entity with known `dims_m` qualifies, wall-mounted included: the hall's census is shelf1, stick1, door1 [AI]). [AI] Plus the camera-has-feet gates per backdrop: the §5 horizon consistency assertion and the §5 pixel-audit of `calibration_px` hold on all eight facings, and the audit is not self-graded: a fresh agent re-measures `calibration_ref` from the image alone on at least one facing per room — **the agent picks which facings, never the builder** — and must agree within tolerance. Height checks derive the expected value from the meta by independent arithmetic (literals for grid canonical meta) and measure the actual from rendered alpha bounds — never from the renderer's own computed scale, which would make the test a tautology. Backdrop `key_dir` gets a warn-level pixel estimate (the gate-(e) Sobel bright-side reused), recorded per facing — warn-only; the authored light reads are gated by Kabe's eye and the flip test.
6. **Flip test (human):** for each facing, composite vs backdrop-only, 3 seconds each; grader (agent rubric + Kabe) marks any object that reads as a sticker. Zero stickers to pass. [AI] The agent rubric is the intention's five decomposed qualities — one light, contact, occlusion chains, one hand, the camera has feet — applied per object. **One capture spec everywhere** (probe, this test, §12.10): the scene canvas element at native 1536×1024, Playwright element screenshot, cold `file://` load, no chrome, no hover — downscaled or windowed captures soften exactly the halo tells this test exists to catch. The batch enumerates **state-variant pairs** beyond the eight defaults: study/N with drawer open and key revealed; the door open *and* closed from both rooms. The batch also carries the full narration transcript — prose taste is Kabe's call here. [AI, with the standing license] Four facings (study S/W, hall E/S) are deliberately bare — Myst has bare walls too — so their pairs assert composite==backdrop exactly (an honest nothing-drawn check) and their "standing somewhere" rides on backdrop taste alone; the batch says so to Kabe rather than hiding it.
7. **Static hosting:** the demo runs from `file://` and from GitHub Pages with zero network requests after load.
8. [AI] **Compositing mechanisms fire (placeholder-testable):** rendering with tint, contact shadows, or part interpolation disabled must produce a different canvas hash than the full pipeline (each mechanism asserted separately); a mid-state part render differs from both end states; the staged overlap pairs (`chair1`×`desk1`, `stick1`×`shelf1`) render with intersecting **opaque pixels** (alpha above threshold — one entity genuinely occludes part of the other; touching bounding boxes do not pass); and a viewstate whose facing has no backdrop asset renders the procedural holodeck grid, deterministically (§7 grid mode). This is what catches a silently absent §7 mechanism before the expensive human moment.
9. [AI] **Narration coverage:** every (intent × entity × outcome) triple the harness can emit — enumerated statically from the fixture (every entity is clickable, so `take note1`, `toggle chair1`, hall-side door toggles and all refusal outcomes are in the domain), not just the walkthrough's path — resolves to a non-empty, non-placeholder line in `narration.json`.
10. [AI] **Criterion-anchored comparison (at Done):** our eight facing composites set beside anchor stills (Myst, Riven, Machinarium routes in the intention), all captures normalized to a common size and format first — honesty note: a grader can usually still identify which is which (era, medium), so this is *criterion-anchored*, not truly blind; the anchor-randomized A/B labels and the grader not being told which verdict unblocks anything are the mitigations. A fresh agent judges the five decomposed qualities item by item against **per-quality observable loss criteria authored at row 3's close — before any backdrop or composite exists — and frozen thereafter**, which live at **`design/comparison-criteria.md`** [AI, row 3: written in frame-only vocabulary so the same criterion applies to an anchor still and to ours; dry-run once against the Riven and Machinarium stills and one of our own frames before freezing, and the three errors that dry run found are recorded in it], so they cannot be tuned to the produced composites. Kabe judges "standing somewhere", running the played anchors themselves. A tie closes a quality; any loss allocates a new spec row that blocks Done. Beside it runs the playbook's escape hatch for criteria blindness: **one fresh critic with a deliberately empty brief** — "use this; say everything wrong", no intention, no qualities — on the running demo. Disposition rule: an empty-brief finding that impeaches a §12 gate or a named quality allocates a row that **blocks Done**; all other findings file as non-blocking rows.

## 13. Deliverable

The repo above, green on §12, plus a 20-second GIF of walkthrough step 1 for the README. The GIF is a first-class deliverable, not an afterthought.
