# holo-emitter — architecture

Written for the fresh session that boards from it. Read `design/method.md` — it names what your
seat reads — then `design/intention.md`, then `design/playbook.md` and `design/blueprint.md`.
This file holds what is true of the built thing that those documents do not say.

## What exists (row 1: static shell + backdrop layer)

```
index.html                      scene canvas 1536×1024 + overlay canvas + chevrons + bootstrap
src/renderer.js                 pure draw; grid mode; GRID_META; facing glyph
src/harness.js                  turn only; intent → validate → envelope → redraw
src/groundplane.js              scale(y) ↔ y mapping (§5), UMD
fixtures/demo-study/*.json      world / staging / narration / viewstate (§3–4; truth)
fixtures/demo-study/fixture.js  GENERATED from the .json files (see the bake)
tools/bake-fixtures.mjs         the bake
tests/playwright/               config + helpers + specs; run: npx playwright test -c tests/playwright
```

Not built yet: entities and draw steps 2–6 (row 2 — with `inventory.js`, the fixture validator,
narration prose, `go`/`toggle`/`take`, refusal narration), the replicator (row 3), real backdrops
and sprites (row 4+). Nothing exists under `backdrops/`, `library/`, or `library-src/`.

## The file:// constraint and the bake

Chromium blocks `fetch`/XHR and ES-module loading for `file://` pages (opaque origin), and §12.7
requires running from `file://`. So:

- **Fixtures are baked, not fetched.** The `.json` files under `fixtures/demo-study/` are the one
  home of fixture truth. `tools/bake-fixtures.mjs` embeds their raw text verbatim as a JS
  expression into the committed sibling `fixture.js` (`window.HOLO_FIXTURE`). Edit the JSON →
  `node tools/bake-fixtures.mjs` → reload. The bake is **byte-deterministic** (no timestamps; a
  content fingerprint instead) because the staleness test re-bakes to scratch and byte-compares
  against the committed file.
- **Accepted deviation** against "the picture never lies about it": a person who edits the JSON
  and reloads without re-baking sees the old document. Mitigations — the staleness test, the
  GENERATED header, the README note, and the page's chrome status line showing the bake
  fingerprint (an edit that took effect visibly moves it). `file://` allows no more; eliminated
  only when a served mode exists.
- **All `src/` files are classic scripts** attaching to `window.HOLO` — no ES modules. Each
  carries a two-line UMD guard (`module.exports` when present) so Node can `require` the same
  file the browser runs; row 2's validator imports `groundplane.js` this way (§12.8: never a
  re-derivation). The UMD guards are untested until that import exists.

## Renderer

`HOLO.renderer.render(target, world, staging, library, backdrops, viewstate, options) → target` —
pure: inputs only, no module state, no time, no randomness; equal inputs paint equal pixels. The
signature is §7's tuple completed [AI]: `target` added (a pure function needs somewhere to draw),
`options` is §7's own debug-switch license (unused until row 2's §12.8 switches), `backdrops`
maps `"location/facing" → {image, meta}` (empty until row 4 — every facing takes the grid).

- **Meta flows as data**: render resolves `meta = backdrops[key]?.meta ?? GRID_META` and the grid
  draws from that resolved object, never inline literals — one home feeds grid now and entity
  math at row 2. `GRID_META` (exported on the renderer) is the §7 canonical grid meta; tests
  assert against §5 literals, never the constant (§12.5's independence rule).
- **Grid mode is product, not placeholder**: unestablished space renders as the holodeck grid;
  real backdrops later occlude it, never delete it. Geometry: wall from y=0 to the floor line
  (0.63·1024 ≈ 645), metre lines at wall scale (96 px) both axes; floor from the floor line to
  the frame bottom (the frame-bottom cut is the camera-has-feet device), longitudinal lines
  fanning wall-scale → bottom-scale, transverse lines at 0.5 m depth steps via depth → scale =
  `GRID_K`/d → y through `groundplane.js`. `GRID_K` = 336 px·m is a grid-drawing constant [AI,
  standing license], not meta: any k satisfies the meta's lerp endpoints; 336 yields three
  legible transverse lines. The **eye line** at `horizon_y` (0.48·1024 ≈ 491 — exactly 1.6 m
  above the floor line at wall scale) draws brighter, with the floor line, at alpha 0.55; minor
  lines 0.25; all strokes `key_tint` over the flat base colours; positions snapped to
  half-integer pixel centres so 1 px strokes fill exact rows (hash-stable across rasterisers).
- **Facing glyph**: N/E/S/W, 1 m tall at wall scale, centred on the wall at the eye line, drawn
  as hand-authored stroked polylines — never `fillText`, whose per-platform rasterisation would
  make hash tests fragile. The glyph carries facing only: same-facing renders of the two rooms
  hash-equal today, and become distinct when entities arrive (row 2).
- **The u-domain screen mapping, pinned for row 2**: u ∈ [0,1] spans the central `wall_width_m`
  metres; x(u, y) = cx + (u − 0.5)·wall_width_m·scale(y), with **cx centre-by-default** (768).
  Real measured backdrops need not have a centred wall: the §5 meta schema will then grow a
  wall-origin field (e.g. `wall_x0_px`) — row 4 meets this here, not in a misplaced sprite. Grid
  drawn beyond the u-domain is licit unestablished space, not placeable wall.
- **No canvas animation** (§7): no time input; the `go` fade (future) and hover highlight are
  chrome — hover lives on the separate `#overlay` canvas (`pointer-events: none`, untouched
  until row 2 draws highlights on it), so the scene-canvas hash is cursor-independent.

## Harness and envelope

`HOLO.harness.create(fixture)` deep-copies world/staging/narration/viewstate; the harness owns
viewstate at runtime (`fixtures/*/viewstate.json` is boot-only — exactly `{location, facing}`).
`dispatch(intent)` carries **only `turn`**. The turn ring: fixed compass N→E→S→W; `right` steps
forward, `left` backward; a facing absent from the location's `facings` list is skipped. Inputs:
ArrowLeft / left chevron ‹ → `turn left`; ArrowRight / right chevron › → `turn right`.

Envelope for a valid turn — `turn` is silent, no narration field (§8):
`{ turn_id, intent, events: [{ type: "view", location, facing }] }`. The `view` event type is
row-1 authorship [AI], revisable at row 2 when world-mutating events arrive. Invalid intents
append `{ turn_id, intent, events: [] }` and trigger **no redraw**. The §8 refusal *narration*
half is deferred [AI]: row 2 authors it with the prose, and §12.9 (narration coverage over the
full emittable domain, refusal outcomes included) is the clause that closes the debt.

The **boot paint** is `harness.redraw()` — the harness invoking its own subscriber once with the
current viewstate, no envelope (nothing intended, nothing changed) — so the envelope journal's
length equals the input-event count exactly. "No harness-bypassing view path" means: nothing but
`dispatch` changes viewstate; nothing but the harness's subscriber triggers a paint. The journal
(`harness.envelopes`) is asserted against input counts and hash changes in the tests. The
envelope format is the future websocket wire format; `harness.js` holds no renderer internals.

## index.html chrome

The stage scales the 1536×1024 canvas stack to the window width (§5). Chrome — chevrons and the
bake-fingerprint status line — carries class `chrome` and hides under `body.capture`
(`display: none`): §12.6's capture spec is a Playwright *element screenshot* of the scene canvas,
and overlapping DOM appears in element screenshots, so capture tooling sets that class. Tested
now (capture spec test), not first in a row-4 human batch. **Constraint for row 2**: chevron
geometry must not eclipse entity hit regions — an entity whose alpha region reaches the frame
edge would lose clicks to a DOM button; §12.1's real-pointer walkthrough will meet this.

## Tests

`npx playwright test -c tests/playwright` (or `npm test`) — Chromium, headless, all pages loaded
from `file://`. Suite-wide fixtures: every page carries a no-network guard (§12.7 first half) and
in-page helpers (`window.__T`). Hashes are SHA-256 via WebCrypto over `getImageData` bytes of the
scene canvas — in-page, pixel-exact, immune to PNG encoders and CSS scaling (`file://` is a
secure context in Chromium). Geometry tests derive expected rows from §5 literals by independent
arithmetic (never from `GRID_META` or the renderer's math) and scan pixels with blend-tolerant
predicates. §12.8's grid clause is defined as determinism **plus** the structural scans — "not
blank" can never satisfy it. Tests that edit fixtures stage a scratch copy of the tree and
re-bake there; the repo tree is never mutated. No stored golden images anywhere.

Scaffolds shipped ahead of need, untested until their row: overlay canvas drawing (row 2 hover),
the `backdrops` map parameter (row 4), the UMD guards (row 2 validator import).
