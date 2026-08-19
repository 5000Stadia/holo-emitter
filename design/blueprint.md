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
  library/
    <sprite-id>/
      sprite.png       # RGBA, trimmed
      record.json
      parts/<part>.png # e.g. drawer_front.png
  backdrops/
    <location>/<facing>.png        # A-N.png ... B-W.png
    <location>/<facing>.meta.json  # floor line + scale calibration
replicator/
  ingest.py            # CLI, python 3.11+, PIL + numpy only
  contract.json        # the orientation contract (versioned)
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
                   "to": "hall", "arrive_facing": "W", "via": "door1" } ] },
    { "id": "hall", "facings": ["N","E","S","W"], "exits": [ "...mirror of above..." ] }
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
- Static-demo caveat: the full document ships to the client, so "hidden" is honesty-by-convention here. In integrated mode (later), knowledge filtering happens host-side before emission; the client never receives unknown entities. Nothing in the renderer may depend on reading unknown entities — treat them as absent.

## 4. Staging — `staging.json`

```json
{
  "schema": "holo-emitter-staging/0.1",
  "placements": {
    "desk1":  { "facing": "study/N", "attachment": "floor_against", "u": 0.42, "mirror": false },
    "chair1": { "facing": "study/N", "attachment": "floor_free",    "u": 0.62, "depth_m": 1.2 },
    "door1":  { "facing": "study/E", "attachment": "wall_mounted",  "u": 0.50, "v": 0.0 },
    "note1":  { "anchor_on": "desk1.surface_top", "t": 0.35 },
    "key1":   { "anchor_on": "desk1.drawer_cavity", "t": 0.5 },
    "stick1": { "facing": "hall/N",  "attachment": "floor_free", "u": 0.3, "depth_m": 2.0 },
    "coin1":  { "anchor_on": "shelf1.surface_top", "t": 0.6 }
  }
}
```

- `u` ∈ [0,1] across the facing's wall width. `t` ∈ [0,1] along a host anchor region.
- Objects placed `anchor_on` derive position, scale, and draw order from their host — they have no independent u/v.

## 5. Backdrop metadata — `<facing>.meta.json`

```json
{
  "floor_line_y": 0.63,
  "px_per_m_at_wall": 96,
  "px_per_m_at_bottom": 210,
  "wall_width_m": 4.2,
  "key_tint": "#c8b489"
}
```

- Values normalized to image height where marked; calibrate by hand per backdrop (measure the door: 2.0m tall at the wall plane).
- **Ground-plane function:** for baseline screen-y between `floor_line_y` (depth = wall) and 1.0 (depth = nearest), scale = lerp(`px_per_m_at_wall`, `px_per_m_at_bottom`). `floor_against` objects sit exactly on `floor_line_y` offset by their own depth; `floor_free` objects convert `depth_m` → baseline-y by inverse lerp.
- Backdrops **contain no interactable or takeable objects** — those are always sprites. Author backdrop prompts accordingly (empty desk-less walls). This removes the clean-plate problem from M0 entirely.

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

## 7. Renderer behavior (`renderer.js`)

Pure function per frame: `(world, staging, library, backdropMeta, viewstate) → canvas`. No state of its own. Canvas 2D only.

Draw order:
1. Backdrop for `viewstate.location/facing`.
2. Entities assigned to this facing (via staging or via host chain), **filtered by knowledge**: skip any entity not in `knowledge.player`. Skip any entity with a `held_by` relation to the player.
3. Sort by baseline screen-y ascending (farther first). `anchor_on` children draw immediately after their host, after the host's parts.
4. For each entity: resolve position (§5 math), scale = dims_m.h × groundplane(baseline_y) → px, draw body, then parts at state-interpolated offsets.
5. Container contents (`in` relation) draw only when host `state == "open"` **and** content is known — positioned in the host's `drawer_cavity` region, clipped to it.
6. Per-sprite tint: multiply toward `key_tint` at fixed low alpha (single constant for M0). Contact shadow: soft ellipse at `base`, width = footprint span × ground scale, skipped when `airborne`.

Interaction regions = each drawn entity's screen-space alpha bounds (parts included). Cursor over region → highlight (subtle outline). Click → emit intent to harness. Edge chevrons / arrow keys → `turn`. Clicking an open exit door → `go`.

## 8. Harness + envelope (`harness.js`)

Intents (complete list): `turn(dir)`, `go(exit_id)`, `toggle(entity_id)`, `take(entity_id)`.

Loop: intent → validate against world (is it a state entity? takeable? known? reachable in this facing?) → mutate the in-memory world copy → emit an **envelope** → renderer redraws → narration line appended from `narration.json`.

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
- `go` requires the door state `open`; plays a fade, sets `viewstate` to target location + `arrive_facing`.
- Invalid intents emit an envelope with no events and a refusal narration line. The picture never changes when the world doesn't.
- The envelope format is the future websocket wire format. The harness is a stand-in for the Construct transport server (holo-emitter later ships as a Construct transport; this module boundary is that seam); keep it in its own module with no renderer internals.

## 9. Ingester v1 (`replicator/ingest.py`)

CLI:
```
python ingest.py IMAGE --id desk-joined-oak-1660 --noun "joined oak writing desk" \
  --archetype sliding --attachment floor_against --height-m 0.78 --view-side left \
  [--part drawer_front:PATH_TO_MASK.png --slide=-0.18,0.22,1.07] \
  [--takeable] [--out library/]
```

Stages (all automatic unless noted):
1. **Matte.** Background = border-sampled grey (median of 1-px border). Flood-fill from all borders on ±tolerance → outer background. Then find enclosed regions matching background color inside the silhouette → punch as holes (leg gaps). Feather 1px. Trim to content bbox. Output premultiplied-safe RGBA.
2. **Anchors.** `base` = midpoint of bottom-extreme opaque pixels (bottom 2 rows). `footprint` = x-extent of those pixels. `surface_top` / cavity regions: **manual for v1** — flags `--anchor surface_top:x0,y0,x1,y1` (VLM auto-detect is v2, stubbed behind an injected `(prompt, schema) -> json` callable, same convention as pattern-buffer).
3. **Parts.** v1 takes a hand-drawn mask PNG per part; ingester cuts the part, inpaints the cavity with darkened content-aware fill (PIL blur-fill acceptable — cavity quality bar is low), records origin, writes both PNGs.
4. **Gates (hard fail unless noted).** (a) halo: mean saturation of border-adjacent semi-alpha pixels must not read grey (report + fail); (b) holes: enclosed background-colored regions remaining at alpha>0 → fail; (c) min resolution: content bbox ≥ 512px tall for furniture, ≥ 128px for takeables; (d) **state diff**: composite(body+part@closed) vs original — pixel diff outside part mask must be ≈0 → fail; (e) light direction (Sobel-based bright-side estimate) vs contract `UL45` → **warn only**, record deviation.
5. **Emit** `record.json` (schema §6), populated from flags + derivations; `provenance.tool = "replicator-ingest-v1"`.

Test corpus: the two existing 1660s desk generations. Both must pass matting + gates; the second (teardrop pulls) becomes `desk-joined-oak-1660`.

## 10. Orientation contract (`replicator/contract.json`)

```json
{ "schema": "orientation-contract/0.1",
  "camera": { "view": "front-three-quarter", "turn_deg": 30, "side": "left",
              "eye_height_m": 1.6, "focal_mm": 50 },
  "light":  { "key": "UL45", "quality": "soft", "fill": "even" },
  "framing": { "background": "seamless mid-grey", "margin": "full object centered",
               "states": "all moving parts closed", "props": "none" },
  "prompt_block": "Front-three-quarter view turned 30 degrees to viewer-left, shot at 50mm, camera at 1.6m eye height, object centered and fully in frame, single soft key light from upper left at 45 degrees with even fill, plain mid-grey seamless background, sharp focus edge to edge, all moving parts closed and fully seated, panel and drawer edges clearly delineated with visible reveal gaps, nothing resting on or in front of the object, no props, no scene",
  "negative_block": "cast shadow on background, dramatic lighting, rim light, vignette, depth of field, cropped, background scenery, props" }
```

Every generated sprite and backdrop prompt appends the relevant block. Ingester gate (e) checks arrivals against `light.key`.

## 11. Assets to produce (complete list)

Backdrops (8 + meta): Study N/E/S/W, Hall N/E/S/W. One style: c. 1660 English interior, oak paneling, leaded windows; consistent key light; **no furniture, no props** in any backdrop; the E walls contain a door *frame/opening* only (door leaf is a sprite).

Sprites (7): desk (with drawer_front part) · key (takeable) · notebook (takeable) · coin (takeable) · chair · candlestick · door leaf (hinged: two-state = closed image + open image for M0, no decomposition needed — swap, don't slide). Shelf may be baked into a Hall backdrop **only if nothing interactable sits on it — but coin1 sits on it, so shelf1 is a sprite too** (8th sprite, static).

## 12. Acceptance (all must pass)

1. **Scripted walkthrough (Playwright):** turn×4 → toggle desk → assert key visible → take key → assert inventory has key, cavity empty → toggle desk closed → go to hall → take coin → return to study → toggle desk open → assert key still absent, notebook still present. Document assertions after every step.
2. **Determinism:** identical fixture + viewstate rendered twice → identical canvas hash. Full walkthrough replayed → identical hash sequence.
3. **State isolation:** toggling desk changes pixels only within the drawer part + cavity bounds (diff mask check).
4. **Knowledge:** before first open, `key1` appears in zero frames (hash equality of open-cavity region vs empty-cavity reference is sufficient).
5. **Geometric:** each floor entity's rendered height within ±5% of dims_m through the ground-plane fn (measured on 3 calibration entities per room).
6. **Flip test (human):** for each facing, composite vs backdrop-only, 3 seconds each; grader (agent rubric + Kabe) marks any object that reads as a sticker. Zero stickers to pass.
7. **Static hosting:** the demo runs from `file://` and from GitHub Pages with zero network requests after load.

## 13. Deliverable

The repo above, green on §12, plus a 20-second GIF of walkthrough step 1 for the README. The GIF is a first-class deliverable, not an afterthought.
