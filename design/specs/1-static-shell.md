# Plan — spec row 1

Target: spec row **1** in `design/intention.md` (the row text and done clauses live there; this
plan restates neither). Blueprint sections in play: §2 (layout), §3–4 (fixtures), §5 (viewport,
meta, ground-plane), §7 (renderer, grid mode, no animation, overlay canvas), §8 (harness,
envelope), §12.2 first clause, §12.7 first half, §12.8 grid-determinism clause. V1: placeholder
look; nothing here is judged as look by Kabe.

## The one real constraint this row must solve

The demo must run from `file://` (§12.7) — and Chromium blocks `fetch`/XHR and ES-module loading
for `file://` pages (opaque origin, CORS). So:

1. **Fixtures cannot be fetched at runtime.** The `.json` files under `fixtures/demo-study/`
   remain the one home of fixture truth (§2 rule, method's one-home rule). A committed, generated
   sibling `fixtures/demo-study/fixture.js` (produced by `node tools/bake-fixtures.mjs`) embeds
   each `.json` file's raw text verbatim as a JS expression assigning `window.HOLO_FIXTURE`
   — JSON text is valid JS expression syntax, so the bake is byte-faithful and deterministic.
   A test re-bakes into scratch and byte-compares against the committed file, so a stale bake
   fails the suite with the fix named ("run node tools/bake-fixtures.mjs"). "Fixture-editable"
   therefore means: edit the `.json`, run the bake, reload. Drift is made as loud as `file://`
   allows: `fixture.js` opens with an unmissable GENERATED header naming the bake command and the
   `.json` files as the sole truth, README and architecture say the same, and the bake is the one
   named command. Load-time loudness (critique F9): the page shows a small chrome line with the
   baked content's fingerprint and the re-bake command — an edit that took effect visibly changes
   the fingerprint; a fingerprint that did not move after an edit is the staleness signal. A
   timestamp was considered and rejected: the bake must be byte-deterministic or T11's re-bake
   byte-compare fails on every run. Chrome, hidden by the `capture` class, never canvas. The remaining
   stale-bake window is an **accepted deviation** against "the picture never lies about it",
   recorded in `architecture.md` as such — mitigated (staleness test, header, README, chrome
   line), not eliminated; `file://` allows no more. Layout deviations from §2's pinned tree —
   `fixture.js` AND `tools/bake-fixtures.mjs` — are recorded as one strictly additive [AI]
   amendment in the blueprint's §2 layout itself, in the same commit (no existing §2 text
   altered; surfaced at the close), so the row-2 validator author meets them in the layout, not
   by surprise; `package.json`/lockfile/`.gitignore` are ambient tooling, named non-layout in the
   same note.
   - Alternatives rejected: runtime `fetch` (dead on `file://` in Chromium); inlining fixtures
     into `index.html` (same bake problem, worse home); a local server (defeats §12.7's premise);
     browser flags like `--allow-file-access-from-files` (works only in the test harness, not for
     a person double-clicking `index.html`).
2. **All `src/` files are classic scripts**, attaching to a `window.HOLO` namespace; no ES
   modules. `groundplane.js` (and any other file row 2's validator must import from Node) carries
   a two-line UMD guard (`module.exports` when present) so Node can `require` the same file the
   renderer uses — §12.8's "never a re-derivation" seam is kept open now, not retrofitted.

## Files added

```
index.html                      scene canvas 1536×1024 + overlay canvas + chevrons + bootstrap
src/renderer.js                 pure draw; grid mode; canonical meta constant; facing glyph
src/harness.js                  turn only; intent → validate → envelope → redraw
src/groundplane.js              scale(y) lerp + inverses (§5), UMD
fixtures/demo-study/world.json      §3 example, verbatim
fixtures/demo-study/staging.json    §4 example, verbatim
fixtures/demo-study/viewstate.json  {"location":"study","facing":"N"} — exactly two keys
fixtures/demo-study/narration.json  schema id + empty map (see below)
fixtures/demo-study/fixture.js      generated (committed; staleness-tested; §2 layout amended [AI])
tools/bake-fixtures.mjs         the bake
tests/playwright/               config + specs (below)
package.json / package-lock.json    @playwright/test pinned; .gitignore for node_modules etc.
```

`src/inventory.js` is **not** created: row 2 builds the inventory strip; an empty file would be a
lie in the layout. `narration.json` ships as `{"schema":"holo-emitter-narration/0.1","lines":{}}`
— §2 lists the file and row 1's only intent (`turn`) is silent by §8, so an empty map is the
honest schema-complete state; row 2 authors the keyed prose and may revise the inner shape [AI].

## Renderer

`HOLO.renderer.render(target, world, staging, library, backdrops, viewstate, options)` — pure:
inputs only, no module state, no `Date`/`Math.random`/globals; draws onto the passed canvas and
returns it. This is a completion of §7's tuple [AI]: a target canvas is added (a pure function
still needs somewhere to draw), `options` is §7's own debug-switch license, and `backdropMeta`
becomes a map `"loc/facing" → {image, meta}` because §7's tuple has no home for backdrop images;
accepted in full now so the signature does not shift at row 2. `backdrops` is **empty at row 1**, so
every facing takes the grid branch — which is the product mode for unestablished space, not a
stub: real backdrops later occlude it, never delete it. **Meta flows as data** (critique F10):
the render resolves `meta = backdrops["loc/facing"]?.meta ?? GRID_META` and the grid draws from
that resolved meta object, never from inline literals — one home structurally feeds grid now and
entities at row 2; tests still assert literals, never the constant.

**Grid mode**, all geometry derived from the canonical meta (§7: floor_line_y 0.63,
px_per_m_at_wall 96, px_per_m_at_bottom 210, wall_width_m 4.2, key_tint `#c8b489`, image_h_px
1024; horizon_y 0.48, key_dir "UL" complete the §5 shape). The canonical meta lives as **one
exported constant in `renderer.js`** (`HOLO.renderer.GRID_META`); tests assert against literals,
never against the constant (§12.5's independence rule, applied early). Drawing:

- Dark ground (`#0b0e13`-family solid), grid lines stroked in `key_tint` (`#c8b489`) at pinned
  alphas — minor lines 0.25, major lines (floor line, eye line) 0.55 — over the flat base colours;
  one formula, no eyeballed blends (critique F5). Flat fills and strokes only — no gradients, no time input, no randomness. All
  line positions are computed then snapped to half-integer pixel centres (`Math.round(v) + 0.5`)
  so 1 px strokes fill exact pixel rows/columns — crisp, rasteriser-independent, and scannable by
  the tests without antialiasing guesswork.
- **Extent and the u-domain, pinned.** The grid fills the whole 1536×1024 frame — unestablished
  holodeck space is boundless, so wall and floor lines run edge to edge and no dead margins
  exist (the diagram-in-a-void reading is out). Within that, the placement domain is pinned for
  row 2 to inherit without reinterpretation: **u ∈ [0,1] maps to the central `wall_width_m` span,
  x(u, y) = cx + (u − 0.5) · wall_width_m · scale(y)**, where cx is the wall span's screen centre
  — **centre-by-default: cx = 768 unless the meta says otherwise** (critique F6). On canonical
  grid meta: at the wall plane u=0 is x≈566.4, u=1 is x≈969.6; at deeper baselines the span
  widens with scale(y). Real measured backdrops at row 4 need not have a centred wall — the meta
  schema will then grow a wall-origin field (e.g. `wall_x0_px`), named now in `architecture.md`
  so row 4 meets it in the design, not in a misplaced sprite. The grid drawn beyond the u-domain
  is licit unestablished space, not placeable wall.
- **Wall**: from y=0 to the floor line at `floor_line_y`·1024 ≈ 645; vertical lines every 96 px
  (1 m at wall) centred on x=768 across the full width, horizontal lines every 96 px up from the
  floor line. The line at `horizon_y`·1024 ≈ 491 — exactly 1.6 m above the floor line at wall
  scale — is drawn brighter: the eye line, the camera-has-feet statement in-fiction. (Identity
  check: 0.63 − 1.6·96/1024 = 0.48, the §5 horizon assertion, exact on canonical meta.)
- **Floor**: from the floor line to the frame bottom (the frame-bottom cut is the
  camera-has-feet device, §5). Longitudinal lines fan from wall x = 768 + m·96 to bottom
  x = 768 + m·210 for every integer metre m whose line intersects the frame (canvas-clipped),
  full width. Transverse lines at 0.5 m depth steps: adopt k = 336 px·m (depth at wall =
  336/96 = 3.5 m, at frame bottom = 336/210 = 1.6 m), map depth → scale = k/d → screen-y by
  `groundplane.js`'s inverse lerp — expected rows, from literals: d=3.0 → y≈698, d=2.5 → y≈773,
  d=2.0 → y≈884. Lines bunch toward the wall: true foreshortening, driven by the same
  ground-plane function entities will use. k is a grid-drawing constant [AI, standing license],
  not meta: it renders the meta, it does not extend it; any k satisfies the meta's two lerp
  endpoints, and 336 is chosen only because it yields a legible line count (three transverse
  lines), nothing deeper.
- **Facing glyph**: N/E/S/W centred on the wall at the eye line, **1 m tall at wall scale
  (96 px)** — in-fiction signage, small against the 1024 px frame, per §7's "small". Drawn as
  **stroked polyline paths, not `fillText`** — font rasterisation varies across platforms and
  would make the hash tests environment-fragile; four hand-authored letterforms are
  deterministic everywhere. The glyph carries facing only (rooms may legitimately hash-equal per
  the done clause).

Draw order beyond the backdrop layer (§7 steps 2–6) is row 2; row 1's renderer draws step 1 only.

## Harness

`HOLO.harness.create(fixture)` copies world/staging/viewstate; `dispatch(intent)` supports
**only** `turn`, validates `dir ∈ {left, right}`, increments `turn_id`, emits an envelope, and
notifies the registered redraw subscriber. **The turn ring and its authority, pinned:** the fixed
compass ring N→E→S→W governs; `turn right` steps forward along it (N→E), `turn left` steps
backward (N→W); a facing absent from the location's `facings` list in `world.json` is skipped
(identical outcomes on the M0 fixture, but the authority is named). **Input mapping, pinned:**
ArrowLeft and the left chevron ‹ emit `turn left`; ArrowRight and the right chevron › emit
`turn right` — and the tests assert inverse-ness, not just change. Envelope for a valid turn
(§8 shape; `turn` is silent, no narration field):
`{ turn_id, intent, events: [{ type: "view", location, facing }] }` — the `view` event type is
row-1 authorship [AI], revisable at row 2 when world-mutating events arrive; it exists so a valid
turn is distinguishable from a refusal. Invalid intents (unknown type, bad dir) emit
`{ turn_id, intent, events: [] }` and trigger **no redraw** — the picture never changes when the
world doesn't. §8 gives refusals a narration line; row 1 defers that half (no narration prose
exists yet, `turn` is silent, and no UI-emittable refusal exists) — deferred, not decided
against, tagged [AI] like the `view` event; row 2 adds refusal narration with §12.9. The harness
keeps an envelope journal (`harness.envelopes`) — it is already stateful by design, and the
interactive tests assert the input-count ↔ envelope-count ↔ hash-change correspondence on it, so
"no bypassing path" is tested, not just read: arrow keys, chevrons, and nothing else call
`dispatch`; nothing else touches viewstate.

## index.html

Scene canvas `#scene` (width/height attributes 1536×1024), overlay canvas `#overlay` stacked
above it (same internal size, `pointer-events: none`, untouched this row — it exists so the §7
hover rule's home is real from the start), CSS scales the stack to window width (§5). Edge
chevrons: two DOM buttons (‹ ›) over the canvas edges — chrome, never canvas. Because §12.6's
capture spec (rows 4–5) is a Playwright *element screenshot* of the scene canvas and overlapping
DOM appears in element screenshots, all chrome that overlaps the canvas is hideable now: a
`capture` class on `<body>` hides it via CSS, and the capture tooling sets that class — the
layout decision is made where the layout is laid. Keyboard: ArrowLeft/ArrowRight → `turn`
left/right (mapping pinned above). Bootstrap is a small inline script: read
`window.HOLO_FIXTURE`, create harness, subscribe redraw → `render`, wire inputs, then call
`harness.redraw()` once — **the boot paint, pinned** (critique F4): the harness invokes its own
subscriber with the current viewstate; no envelope is emitted (nothing was intended, nothing
changed), so journal length equals input-event count exactly, and the hash-change ↔ envelope
correspondence is measured from the post-boot baseline. "No harness-bypassing view path" means
precisely: nothing but `dispatch` ever changes viewstate, and nothing but the harness's
subscriber ever triggers a paint. A chrome status line (bake timestamp + re-bake command, per
above; fingerprint, not timestamp — the bake is byte-deterministic) sits under the canvas,
hidden by `capture` like all chrome. No logic lives inline beyond wiring.

## Tests (`tests/playwright/`, Chromium, headless, `file://`)

Config `tests/playwright/playwright.config.mjs`; command: `npx playwright test -c
tests/playwright`. Hash = SHA-256 via WebCrypto over `getImageData` bytes of the scene canvas,
computed in-page (`file://` is a secure context in Chromium; pixel-exact, native-speed, immune
to PNG-encoder and CSS-scaling concerns). A helper
stages a scratch copy of the tree (index.html, src/, fixtures/) so a test can edit
`viewstate.json`, re-bake, and boot — the repo tree is never mutated by tests.

- **T0 (suite-wide fixture)**: a request listener attached to **every page the suite opens**
  fails the run on any `http(s)` request (critique F7) — §12.7's first half guards all tests, not
  one.
- **T1 shell**: cold `file://` load; scene canvas is 1536×1024 and non-blank; the displayed
  canvas's bounding box fits the viewport width with aspect preserved at two window sizes
  (§5's display half, critique F13).
- **T2 interactive cycling, study**: boot study/N; three ArrowRight turns; the four scene hashes
  pairwise distinct; a fourth turn returns to the first hash (the cycle closes). **Direction is
  pinned, not just change**: ArrowRight then ArrowLeft returns to the starting hash; the envelope
  journal's facing sequence for the script R,R,L is asserted to be E,S,E; right chevron's facing
  matches ArrowRight's, left chevron's matches ArrowLeft's (both chevron paths real and correctly
  signed). Journal discipline: after the script, journal length equals the number of input
  events, and every hash change in the run pairs with exactly one new envelope.
- **T3 interactive cycling, hall**: scratch copy with `viewstate.json` = hall/W, re-baked; same
  cycling check — the boot-into-each-room clause, exercised the fixture-editable way.
- **T4 direct render, both rooms**: in-page direct `render` calls for all 8 room×facing
  viewstates; each rendered twice → hash-stable; study/N direct hash equals the booted study/N
  hash (the page path adds nothing). Same-facing cross-room equality is recorded, not asserted
  either way (licensed by the done clause).
- **T5 §12.2 first clause**: two separate cold loads of identical fixture+viewstate → identical
  scene hash.
- **T6 §12.8 grid clause**: a viewstate whose facing has no backdrop asset (all of them, this
  row) renders the grid deterministically — repeat-render hash-equal — **and structurally the
  grid** (critique F11): the clause's green is defined as T6 plus T10's structural scans (T6
  runs the shared geometry-predicate helper T10 uses — floor line, eye line, transverse rows —
  so "not blank" alone can never satisfy §12.8's grid clause).
- **T7 purity**: same inputs rendered into two different canvases in one page → equal hashes;
  render is called twice with the same arguments object untouched (inputs not mutated).
- **T8 no animation**: hash, wait 600 ms with no input, hash again — identical (§7 no-time rule).
- **T9 envelope discipline**: each valid turn appends exactly one envelope with one `view` event;
  `dispatch({type:"turn",dir:"up"})` and `dispatch({type:"go"})` append envelopes with zero
  events and leave the scene hash unchanged (§8 refusal rule, harness-level).
- **T10 camera-has-feet geometry**: literal arithmetic |0.48 − (0.63 − 1.6·96/1024)| ≤ 0.02
  (§5 assertion on canonical meta, derived independently — literals, not `GRID_META`); pixel
  scans (±1-row band, blend-tolerant predicate: differs from ground colour beyond threshold)
  find line pixels on the floor-line row (y≈645) and eye-line row (y≈491), and find the eye-line
  row brighter than an adjacent plain-wall row; **foreshortening is asserted, not assumed**:
  expected transverse-line rows computed in the test from §5 literals and k=336 (y≈698, 773,
  884) each contain line pixels, and their successive gaps strictly decrease toward the wall —
  a uniformly-spaced or groundplane-ignorant floor fails; the wall region differs between
  facings (the glyph is really on the wall) while the floor region hash-matches across facings
  (the glyph carries facing, nothing else moved).
- **T11 bake staleness**: re-bake to scratch; byte-compare with the committed `fixture.js`.
- **T12 fixture shape**: `viewstate.json` holds exactly `location` and `facing`; `world.json`
  and `staging.json` parse and carry their §3/§4 schema ids. (The full coordinate/fact split
  check is row 2's validator — deferred, not asserted here; critique F8.)
- **T13 capture class** (critique F12): the chevrons' rects overlap the scene canvas's rect;
  with `capture` on `<body>` they compute to `display: none` and an element screenshot of the
  scene canvas differs from the capture-off screenshot only where chrome overlapped — asserted
  as: capture-on element screenshot equals itself across the class toggle cycle and differs from
  capture-off. The §12.6 capture spec's chrome-hiding is exercised now, not first in Kabe's
  row-4 batch.

## Docs, in the same commits

`design/architecture.md` rewritten to board a fresh session: module map, the `file://`/bake
constraint, its staleness test, and the **accepted stale-bake deviation** (critique F9), the
namespace/UMD pattern, the canonical-meta home and meta-as-data flow, the boot-paint mechanism,
the turn envelope shape and its [AI] provenance (the deferred refusal-narration half of §8 named
against §12.9, the clause that closes it at row 2 — critique F16), the facing ring and input
mapping, the u-domain screen mapping with the centre-by-default caveat and the future
wall-origin meta field (critique F6), the `capture` chrome-hiding class, the constraint that
chevron geometry must not eclipse entity hit regions at row 2 (critique F15), which shipped
scaffolds are untested until which row (critique F3: overlay canvas → row 2 hover; `backdrops`
map param → row 4; UMD guard → row 2 validator import), and what does not exist yet (entities,
`go`/`toggle`/`take`, library, replicator, real backdrops, inventory.js). `README.md`: how to
run (open `index.html` from `file://`), the one test command, the fixture-edit → bake note; no
method vocabulary. The "Nothing runs yet" line dies when it becomes false. Blueprint §2 layout
gains the `fixture.js` and `tools/bake-fixtures.mjs` lines, strictly additive, tagged [AI],
surfaced at the close.

**The close**: per the method's *How we work* first bullet ("A pass closes the work in one
commit — … the row deleted from the spec list, and `design/specs/<n>-<slug>.md` deleted with
it"), the closing commit is a state-only successor to the examined one — design documents
brought true, row 1 deleted from the spec list (Next ID stays 7), this file deleted — never
code. Pushing is the Navigator's act, not this seat's; the intention already records that the
front-door scaffold travels with row 1's first close.

## Out of scope, guarded

No entities drawn, no narration prose, no `inventory.js`, no replicator code, nothing under
`backdrops/` or `library-src/` (other seats' lanes), no canvas animation, no second view path.
