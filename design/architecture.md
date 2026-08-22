# holo-emitter — architecture

Written for the fresh session that boards from it. Read `design/method.md` — it names what your
seat reads — then `design/intention.md`, then `design/playbook.md` and `design/blueprint.md`.
This file holds what is true of the built thing that those documents do not say.

## What exists (rows 1–2: shell, grid, entities, full world behaviour on placeholders)

*Row 11 changed what a facing's geometry IS. The grid draws a bounded room now — corners, side-wall
returns, a ceiling at the storey height, a floor that stops where the room does — from a §5 meta
derived per facing out of `fixtures/demo-study/plan.json`. Read* The room, and what a facing's meta
is *below before anything
that mentions `GRID_META`: it is the unplanned-facing fallback now, not the geometry of any facing
the demo draws.*

```
index.html                      boots ?world=<id> (default nav-manor) + scene canvas 1536×1024 +
                                overlay + chevrons + narration log +
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
design/surface-strings.md       every string the surface can show — the audit voice.spec parses
fixtures/demo-study/*.json      world / staging / narration / viewstate (§3–4; truth) — FURNISHED
fixtures/nav-manor/*.json       the same four, EMPTY: the painted walkable world the link boots
fixtures/nav-manor/plan.ref     one line: the plan this fixture is projected from (no second copy)
backdrops/<loc>/<facing>.png    a PROMOTED painting + its measured .meta.json (row 21; study/N)
backdrops/baked.js              GENERATED: the promoted paintings as data: URIs (tools/bake-backdrops.mjs)
tools/promote-backdrop.mjs      candidate + measurement -> backdrops/<loc>/<facing>.{png,meta.json}
design/plan-draft/measured/     measure.py --round cand1|cand2|cand3 | gate.py [--round cand3] |
                                prompt_lint.py | misses.jsonl (every round, keyed) | cand3/
fixtures/demo-study/plan.json   the manor in metres (§4b) — the spatial source, presentation-side
fixtures/demo-study/fixture.js  GENERATED from the .json files (see the bake; the plan is NOT baked)
tools/bake-fixtures.mjs         the bake — calls both validators and refuses an invalid fixture
tools/validate-fixtures.mjs     fixture validator (§12.9 + truth/presentation split), ESM
tools/validate-plan.mjs         plan validator (the two schematic laws + the world cross-check), ESM
tools/plan-projection.mjs       plan + facing -> staging and §5 meta geometry, through groundplane
design/plan-draft/              the schematic, DERIVED from plan.json + the projection report
tests/playwright/               config + helpers + specs; run: npx playwright test -c tests/playwright
```

Not built yet: real sprites and the remaining seven backdrops (row 4), row 9 (the speaker layer).
**The manor is walkable** — row 15 grew the navigation world from two rooms to all twenty-two, and
*The manor walkable (rows 15 and 19)* below is its account. **The replicator is built** — row 3 shipped the ingester, `replicator/` holds it,
and *The replicator (`replicator/`), and what row 4 inherits* below is its account; a sentence here
said otherwise for several rows and it was wrong. `library/` holds exactly one ingested record —
`desk-joined-oak-1660`, the corpus desk — and **the page does not read it**: no bake binds
`library/` yet, the procedural `src/placeholders.js` record of the same id is authoritative until
row 4's, and this file said "nothing exists under `library/`" while three of its files sat in git.
`backdrops/` holds the asset
seat's candidates and, since row 21, ONE promoted painting (`backdrops/study/N.png` +
`.meta.json`) — read *The painted promotion (row 21)* below before anything that mentions a
backdrop. Rows 7, 8, 10, 13, 20 and 21 are closed; the open list is `design/intention.md`'s spec
table, which is the one home of what is left.

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
  GENERATED header, the README note, and the **bake fingerprint printed to the console at boot**
  (row 7 moved it off the product face: a fingerprint and a shell command were the project talking
  to itself where a stranger reads it). **What that move costs, on the record:** the console is a
  weaker channel than a visible footer, because a visitor never opens one — so the mitigation now
  reaches only someone who already suspects a stale bake. The consequence worth naming is that a
  bad deploy **reads as atmosphere**: every fault surface is in-fiction, so a stranger cannot tell
  a broken page from an intended mood. Nothing automatic watches the public link; what catches a
  stale bake is the staleness test, which runs in the suite the Navigator runs before pushing.
  `file://` allows no more — the page cannot detect its own staleness at runtime with zero network
  calls; eliminated only when a served mode exists.
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

## The replicator (`replicator/`), and what row 4 inherits

Row 3 built the ingester. `python3 -m replicator.ingest IMAGE …` turns one generated image into
`library/<id>/{sprite.png, record.json, parts/*.png, states/*.png, thumb.png}`.

**Install and run:**

```
sudo apt-get install -y python3-numpy python3-pil     # pip is PEP-668 blocked here
python3 -m unittest discover -s replicator/tests -t . -v
```

182 tests, ~6¼ minutes. `-t .` puts the repo root on `sys.path`; `replicator/tests/__init__.py`
must exist or discovery refuses the directory, and it raises a message naming the apt line if
either dependency is missing.

### The clause ledger (`replicator/tests/test_clause_guards.py`)

Row 3's last examination round found one family behind five separate blocking findings: **every fix
for a previous blocker landed in the artifact and none of them landed as a check.** The
carcass-backing floor, the overshoot bound, the stored-resolution cap, the already-matted-source
guard and the drawer-cavity disagreement error could each be replaced by `if False:` with the whole
suite green. The fixes were real; nothing held them there.

The ledger is that family's architecture, and its rule is:

> A fix for a named finding arrives with a case that fails on **that clause alone**, and asserts
> the clause **by name** — not the gate id it shares with five other clauses, and not "some hard
> gate went red".

Two things make it structural rather than a habit. Gates with several clauses now report
`measured["clauses_failed"]`, so a case can name what fired; and `SlideClauseLedger` declares the
six clauses the slide gate carries, trips each one in isolation, and asserts that the set it
managed to trip is exactly the declared set — so a seventh clause added without a case shows up as
an absence rather than as silence. Every case in the module was written by breaking the code it
guards and watching it go red, and the five mutations above were re-run afterwards: all five are
now caught.

The same round moved four hard gates' thresholds — `alignment`, `thumb`, `dims`, and the slide
gate's `scale_open` rails — out of module literals and into `contract.json`, because
`contract.identity()` hashes only `gates` + `ingest` + `classes`: a record's
`provenance.contract.thresholds_sha256` did not move when any of them changed, so "traceable to the
exact threshold set that admitted it" was false. `REQUIRED_GATES` now lists them, and a contract
missing one is a `ContractError`.

### The shape (blueprint §4b rule 1)

Every stage is an importable pure function — no file I/O, no clock, no RNG, no mutation of
arguments. `pipeline.ingest_sprite(...)` runs all of them in memory and returns every artifact
plus the gate report; `ingest.py` decodes, calls it **once**, and writes. A test byte-compares the
pure pipeline's output against the CLI's files, so the thinness is witnessed rather than asserted.
A live host imports `pipeline` and feeds it decoded frames; nothing needs rewriting.

`imaging` (primitives) · `matte` · `anchors` · `parts` · `states` · `thumbs` · `gates` · `preview`
· `record` · `pipeline` · `contract` · `maskgen` · `synth` · `ingest`.

### Calibration authority — the rule that governs every threshold

**No hard gate is calibrated on the corpus it judges.** Every block in `contract.json` declares an
`authority`:

- `contract` — it follows from something the orientation contract asserts, or from the algebra of
  compositing;
- `control` — it is measured on **constructed** images in `synth.py` whose ground truth is known by
  construction;
- `observed` — a corpus measurement. **`contract.py` refuses to load a contract where an
  `observed` threshold gates.** Observed numbers are reported and nothing else.

Each block also carries a `basis` string naming the construction or derivation. `contract.py`
refuses a block without one. `_freeze` says which blocks are frozen, against what, and who may
amend each; `classes` is the amendment path — a threshold may be extended for an object class no
control covered, when a control of that class lands in the same commit, and may **never** move
because a real arriving image failed. That fork is the Navigator's.

`contract.identity()` hashes the gate, ingest, classes AND **camera** blocks into
`provenance.contract.thresholds_sha256`, so a record is traceable to the exact threshold set that
admitted it — a version string alone does not move when `classes` does, and `camera.turn_deg` is an
input to the `dims` verdict. **Row 20 is the first row to move that digest from the camera side**:
changing `camera.focal_mm` from 50 to 24 invalidated the corpus desk's record, which was re-emitted
by the documented invocation rather than left claiming conformance to a contract that had changed.
A sentence here used to say the digest covered only gates/ingest/classes; it did not.

### Per-image rules, not pixel counts

The contract admits sources from 128 px of content (a takeable at gate (c)'s floor) to well over
1000. So the matte's tolerance is **computed from each image's own ground** — the contract asserts a
seamless uniform mid-grey, so its noise is measurable on the border — and erosion depth, hole
minimum area and bleed width scale with the content bbox. The frozen things are the rule
coefficients.

### The fifteen checks (nine on a static sprite, thirteen on a sliding one, thirteen on a swap)

A swap sprite runs thirteen *lines* over thirteen *ids*: (a) and (e) each run twice, once on the
body and once on the open-state image, and the state-image runs carry it in the id —
`a[states.open]`, `e[states.open]`. They printed as bare `a` and `e`, so the board could not say
which verdict was about which picture and the record's edge evidence described the state image
while claiming to describe the sprite. `test_clause_guards.py::GateTally` asserts each archetype's
tally against a real run, so this heading cannot drift from the code again.

| id | severity | guards |
|---|---|---|
| a | hard | the edge does not read as the ground — three clauses (see below) |
| dims | warn | the declared width agrees with the drawn one |
| b | hard | enclosed ground-coloured regions remaining |
| c | hard | content bbox ≥ 512 px (≥ 128 px takeable) — §9.4(c) verbatim |
| d | hard | cutting a part and putting it back changes nothing else |
| e | **warn** | light direction — §9.4(e)'s [HUMAN] "warn only" |
| f | hard | the contact-band derivation is sound (+ warn on disagreement) |
| g | hard | the matte is not eating the object |
| h | hard | no baked studio shadow welded to the silhouette |
| alignment | hard | two-state closed-frame registration |
| registration | hard | the typed `--state-origin` agrees with a datum in both images |
| slide · open_state | hard | the travel opens the recess **and stays on the carcass** |
| thumb | hard | thumb present exactly when takeable, square |
| part_mask | **report, no verdict** | mask-boundary adherence per edge — see below |

Blueprint §9.4 carries the `[AI, row 3]` amendment note listing all fifteen — after this row
"passes gates" means every hard check the sprite's own archetype invokes, and §9.4 has to be the
document that says so.

**`slide`'s carcass bound is the check the row's own asset needed**, and it is the one finding
worth carrying forward whole. A drawer must clear its recess *and* stay against its carcass. With
only the clearance bound, the corpus desk shipped with its open drawer 79 body px below the recess:
at the real 89 px draw height that is clear of the cavity, straddling the stretchers, reading as a
plank lying on the floor — and twelve green gates said nothing, because the recess *was* uncovered
and the part *was* on the canvas. The bound comes from the body's own pixels: the fraction of the
travelled part that still lands on opaque carcass, floor 0.80.

**Two consequences for row 4, both found by looking:**
- On `desk-corpus-2` exactly one travel satisfies both bounds (`dy` 0.08). At that travel the
  exposed strip of recess is ~5 px at draw scale — **too small to reveal the key row 4's probe
  must show inside it**. The probe's prompt sheet needs a desk with deeper drawers, or the key
  revealed on a pulled-out drawer's floor rather than through the gap above it.
- `desk-corpus-1`'s lower drawer satisfies **neither** bound at any travel — its front is too tall
  for the space beneath it — so its part is the top-middle drawer, which has carcass under it all
  the way. Which drawer a desk can open is a property of the generation, and the prompt sheet is
  where it is decided.

**Gate (a).** §9.4's letter is "mean saturation of border-adjacent semi-alpha pixels must not read
grey". As an absolute saturation floor that false-fails an honestly grey object, and M0's takeables
are an iron key and a silver coin. The clauses are ratios of a depth-2..4 px band to the deep
interior, plus **a4**: the composited **coverage residual** over a dark ground and a light one at
real draw scale. a4 needs no fitted number — straight-alpha compositing says a rim pixel of coverage
`a` over ground `G` against local interior `L` lands at `a·L + (1−a)·G`, so the normalized residual
is zero for a correct edge whatever the colours are. Known limit, stated: a ~2 px generator
antialias band scores about 0.10 and passes, which is why the **matte erodes it** rather than this
gate catching it.

**Gate (h)** keys on *position*, not tone: the share of opaque pixels that are ground-toned **and
sit below the lowest non-ground-toned pixel in their own column**. A uniformly grey object scores
zero by construction. An earlier tone-fraction draft would have hard-failed the key, the coin and
the candlestick by material.

**Gate (g)** measures tolerance sensitivity — `|A(0.75t) − A(1.25t)| / A(t)` — rather than
comparing against a fixed conservative tolerance. At tolerance 5 the corpus's own ground noise
stopped the flood fill and the "conservative" silhouette swallowed the frame.

### `footprint` and `base.x` are ground-contact facts — an amendment to §9.2

Measured on the corpus desk, and these are the numbers the emitted record carries — the one home
for them is `library/desk-joined-oak-1660/record.json`'s `measured.contact`, and any figure quoted
elsewhere is a copy that can go stale: §9.2's bottom-two-rows derivation gives a span of a few dozen
pixels — the nearest ball foot alone — where the real ground contact spans nearly the whole sprite
width. `footprint` is what the renderer draws
every grounded object's contact pool from, against a quality that reads "nothing sits on a floor
without it". So:

- `px` and `base.y` stay **pixel-identical** to what `mechanisms.spec.mjs` derives.
- `footprint` and `base.x` come from the **contact band** — the x-extent of columns whose lowest
  opaque pixel lies within `band_fraction` of the content height of the bottom. `--footprint x0,x1`
  overrides. Both derivations are carried in `measured.contact` so the judgement is visible.
- **Row 4 inherits a re-expressed clause, and it covers `base.x` too:** for real art, `footprint`
  *contains* the bottom-two-rows extent and lies inside the canvas — it does not equal it — and
  `base.x` is the footprint's midpoint, lying inside the object's own alpha bounds. Both are
  asserted by `replicator/tests/test_gates.py::BaseXIsAGroundContactFact`, not only written here.
  **`base.x` is a placement change, not only a shadow one:** `groundplane.placeHost` computes
  `drawX = baseX − f·base.x`, so a desk whose `base.x` moves from the nearest foot (258) to the
  stance midpoint (565) is drawn ~30 px further along a 1536 canvas than staging authored against
  the old convention expects. Row 4's bake either moves the staged `u` values with it or accepts
  the shift knowingly. Row 2's green witnesses a placeholder
  desk deliberately painted with a stretcher rail opaque across the leg span for its bottom 8 % of
  rows; generated art makes no such authoring choice.

Blueprint §9.2 carries the `[AI, row 3]` note. §9.2's own v2 clause is Kabe's and names this exact
problem: *"an llm looks at it and identifies the rear points that touch the ground"*.

### `drawer_cavity`, and a tautology that was removed

`drawer_cavity` is the **part's own closed rect** — the region the cut removed and the inpaint
filled. An earlier draft derived it as "the closed rect minus the travelled front", which reads
well and is a tautology: the clearance check then computed its own threshold from the very `slide`
it was checking and could not fail for any value. The clearance bound is now
`ingest.cavity.clearance_fraction` (0.5) of the recess, independent of `slide`. A flagged
`--anchor drawer_cavity:` is written when it agrees with the derived rect within
`agreement_tolerance_fraction`, and a disagreement beyond it is a hard error naming both.

### Two-state registration

`--state-datum x0,y0,x1,y1` names a feature present in **both** source images (the door frame's
inner jamb). The ingester locates it in the open image by normalized cross-correlation and derives
`origin` from it; `--state-origin` overrides and is then checked against the derived value **in both
axes**. This is what gives the alignment gate content: its clause (i) has exactly one satisfying
`origin.y`, so an operator who never opens the images and simply subtracts passes it every time.

**Measurement procedure for row 4's door**, at the same resolution as the mask fit: pick a rect
containing an edge — a flat patch has no variance to correlate on and is refused by name — that is
visible in both generated images, and pass it as `--state-datum` in the **closed** source's
coordinates. Nothing else is needed; the origin is derived.

Requiring registration means row 4 will generally set `states_images.open.origin.x ≠ 0`, which
changes the consequence recorded above (the open leaf and its gap reading on the same screen side
from both rooms). That is a [HUMAN] call and is in row 3's closing report.

### Masks

`replicator/masks/<id>/<part>.png` with a `.json` sidecar holding the fitted vertices, the hint they
came from, and the per-edge residuals. The only human input is a **coarse hint** — four numbers for
a rectangle or eight for a quadrilateral; the four edges are then fitted to the dark reveal gaps the
contract's `prompt_block` requires the image to contain. A test re-runs the fit from the hint and
compares, so the mask and its recipe cannot drift apart.

The corpus desk's invocation, re-runnable:

```
python3 -m replicator.maskgen --size 1254x1254 \
  --fit-hint 356 660 756 650 756 769 356 784 \
  --fit-source library-src/corpus/desk-corpus-2.png \
  --out replicator/masks/desk-joined-oak-1660/drawer_front.png \
  --sidecar replicator/masks/desk-joined-oak-1660/drawer_front.json \
  --overlay library-src/corpus/desk-corpus-2.png --overlay-out /tmp/overlay.png
```

Known sensitivity: on the corpus desk, moving the hint's top-right corner by 10 px moves the fitted
top edge by about 12 px. The fit is reproducible from a recorded hint; it is not insensitive to one.
The `--overlay` image is the evidence, and it is what was looked at.

### The corpus run

```
python3 -m replicator.ingest library-src/corpus/desk-corpus-2.png \
  --id desk-joined-oak-1660 --noun "joined oak writing desk" \
  --archetype sliding --attachment floor_against \
  --height-m 0.78 --width-m 0.81 --depth-m 0.55 --view-side left \
  --part drawer_front:replicator/masks/desk-joined-oak-1660/drawer_front.png \
  --slide=-0.03,0.08,1.04 --anchor surface_top:350,235,900,275 \
  --preview-dir /tmp/prev --report /tmp/desk2.json
```

`desk-corpus-1` runs the same way with `--check` and its own mask. `replicator/tests/test_corpus.py`
runs both through the same check set as a committed test, so the row's headline claim is not an
account.

**This block has one home and it is not this document.** The values live in
`replicator/tests/test_corpus.py` (`DIMS`, `SLIDE`, `DESKS`), and
`test_corpus.py::DocumentedInvocation` parses the fenced block above and asserts every flag in it
matches. A stale copy here was how the row's one re-runnable instruction came to name
`--slide=-0.10,0.24,1.06` and `--width-m 1.30` — a travel that hard-fails on two clauses and a width
30% from the desk's own pixels — while the shipped record carried different numbers entirely. A
fresh session boards from this block, so a drift in it is a drift in the only route back to the
asset.

### What row 4 inherits — the list

1. **The probe desk supersedes this one.** Re-ingest and overwrite `desk-joined-oak-1660` through
   the same gates. The current desk is a corpus-only source generated before `style_block` existed.
2. **`mechanisms.spec.mjs`'s light clause will go red** the day a real sprite replaces a
   placeholder. Both corpus desks measure a left-third-minus-right-third luminance of **+0.14 and
   −1.77** against the shipped clause's **> 2**, and the Sobel bright-side estimate is 22–35° off
   the constructed UL45 control's response. Row 2's placeholders only satisfy that clause because
   `build()` paints a synthetic ±8 % ramp; a real PNG gets no ramp. Gate (e) is warn-only by §9.4's
   [HUMAN] text, so **no automated check of the intention's "one light" quality survives row 3 on
   real art.** The fork is in the closing report.
3. **Quality 1's temperature half has no mechanism at all**, not merely no gate: `measured.chroma`
   records the sprite's white balance, §7's tint is one constant pull toward the facing's
   `key_tint`, and §1's non-goals forbid relighting beyond it. A sprite arriving warm of contract
   stays warm of every facing it stands in.
4. **Contact is one hull ellipse per object.** The renderer draws one ellipse across `footprint`;
   the intention says "Machinarium pools occlusion at **every contact point**". Carrying per-foot
   contact spans is a §6 schema change and therefore Kabe's. Named residue, not a certified quality.
5. **The bake reproduces `extent` and `px`.** `extent` is deliberately *not* in the record —
   build-time presentation data, derived from the state image's own bottom-two-rows alpha ≥ 128 scan
   offset by `origin.x`.
6. **Stored resolution and the runtime downscale.** `ingest.output.max_content_height_px` is
   **384**, a little over 4× the ~89 px the desk is actually drawn at. It was 1024, which left the
   desk stored at 914 px and downscaled ~10× by the browser's own resampler at draw time: measured
   through the real draw path, that carried **6.6× the placeholder's high-frequency energy** in the
   same region — reveal gaps became dashed lines and the brass pulls became specks. Storing near
   draw scale moves the filtering into the ingest, where LANCZOS does it once and well. Gate (c)'s
   512 floor is untouched because it judges the **arriving** source, per §9.4(c), not what is
   stored — conflating the two would either forbid storing near draw scale or hollow out the gate.
   The remaining lever, if row 4 wants a closer camera, is `imageSmoothingQuality` on the bake's
   draw path.
7. **The edge survives the renderer, and the drawer opens.** Row 2 found that the `destination-in`
   re-clip squared partial alpha and would have hardened every matted edge into a cut-out. The
   emitted sprite — the first genuinely feathered edge in this project — was bound into the running
   page and drawn through `src/renderer.js` unmodified, closed and open: no rim, no hardened
   silhouette, and the drawer reads as sliding out of its recess. That check is not automated; it
   was done by hand and looked at, and row 4's bake is where it becomes a test. **Residual, measured
   through that same path:** the sprite still carries about 2.3× the placeholder's high-frequency
   energy in the same region (4.87 against 2.15) — down from 6.6× before the storage policy
   changed. The remaining lever is `imageSmoothingQuality` on the bake's draw path, and it is
   row 4's.
8. **The id is double-homed** until the bake: `src/placeholders.js` carries a procedural
   `desk-joined-oak-1660` whose footprint is the bottom-two-rows extent and whose proportions differ
   from the ingested desk's pixels. The **procedural one is authoritative** for rows 3–4; the bake is
   what switches.
9. **`backdrop_block` is provisional** and carries the open fork for Kabe: one screen-space key
   across the eight facings, or per-facing keys and per-facing sprite variants.
10. **The corpus desk is a small desk, and the record now says so.** It shipped once at
    `--width-m 1.30` — blueprint §6's *example* value — while drawing 0.977 m wide, a ratio of 0.70
    and comparison-criteria's own tell T5.3. It is re-declared at **0.81 × 0.55 × 0.78**, read off
    the picture, and `dims` is green at ratio 1.001. The consequence to expect and not be surprised
    by: the renderer scales by height, so this desk draws **111 px wide beside the 160 px
    placeholder it replaces**. That is a fact about the source art, not about the record, and the
    probe desk of point 1 is where it is fixed — by generating a desk of the size the room wants.
11. **A part's carcass backing is measured at native size.** `parts.carcass_backing` places the
    travelled part without applying `slide.scale_open`, while `open_state_composite` and the
    renderer both scale it. At the corpus desk's 1.04 the difference is under a pixel, so the bound
    holds; at a larger `scale_open` the bound would be measuring a rectangle the picture does not
    draw. Named residue.
12. **The open drawer's exposed recess is ~30 body px — about 7 px at the 89 px draw height.**
    Row 4 must reveal a key inside it. It cannot, at this size, on this desk. The probe desk needs
    a drawer whose recess survives the draw scale, and choosing it is a generation-time decision,
    not an ingest-time one.
13. **Two flags are still under-checked.** With two `--part`s, one `--anchor drawer_cavity` is
    compared against *each* part's derived cavity and the last part wins the anchor; and a
    `--state-origin` naming a state that does not exist is silently discarded. Both are
    single-part/single-state-safe today and both are real traps for row 4's batch.

## The room, and what a facing's meta is (row 11)

**Three tiers, one resolution rule, used by four consumers.** A facing's §5 meta is a measured
`backdrops/<loc>/<facing>.meta.json` if one exists (row 21 promoted the first, `study/N`), else the plan's derived meta
(`tools/plan-projection.mjs` `metaForFacing`/`deriveMeta`), else `GRID_META`. The bake computes the
middle tier for every facing the world names and writes it into `fixture.js` as
`HOLO_FIXTURE.metas`; `index.html` turns that into the renderer's `backdrops` map as `{ meta }`
entries with no image, so the renderer's own `entry.meta ?? GRID_META` already does the right thing
and row 4's images drop into the same map. The fixture validator reads the same derivation, and
`HOLO_APP.metaFor` exposes the page's resolution so a test does not ask `GRID_META` about geometry
the picture is not drawn with.

**`GRID_META` is the unplanned-facing fallback.** It carries `facing_type: null` and null corners on
purpose: a room whose extent nobody has drawn must not claim two corners, so it draws the unbounded
16 m wall it always drew. Its numbers moved with the camera (below) and nothing else about it did.

**SUPERSEDED BY ROW 20 — read *The lens (row 20)* below; kept for the reasoning, corrected for the facts.** The drawing camera is MEASURED now (eye 1.08775 m, horizon 524.4/1024, `px_per_m_at_wall` derived from the pinned lens), which is what row 11's interim was waiting for. What follows describes the state row 11 shipped.

**Two eye heights, two jobs, and the metas derive from the drawing one.** `INTERIM_EYE_M` = 1.60 m
is what this project draws at — [HUMAN 2026-08-21], ruled against a rendered pair — so
`floor_line_y` is 0.63 and `px_per_m_at_bottom` 332.8, and §5's camera-has-feet gate is asserted at
1.60 too. `RULED_EYE_M` = 1.83 m is §10's GENERATION camera, whose authored home is
`replicator/contract.json` and which `assertRuledEye` pins to that file; backdrops are prompted at
it, no pixel here is drawn at it. What row 11 fixed was not the number but the fact that there were
two of them pretending to be one: grid canonical was authored at 1.6, §5's gate had been propagated
to 1.83, and the shipped meta failed the blueprint's own assertion by 0.0016 while the suite stayed
green on a test that still said 1.6. Now the height is a named constant the metas derive FROM — the
term from outside the meta that lets `assertCameraConsistent` fail at all, where row 12 derived it
back OUT of `GRID_META` and said in its own comment that this made the agreement an identity.
**Why the interim.** Row 11 drew 1.83 for one commit and put both frames to Kabe. §10's ruling has
two halves, eye 1.83 m and a −8° pitch, and **the pitch is modelled by nothing** — 49 px of horizon
at the study's implied focal length. Taking the height without it pushes the frame-bottom floor cut
OUTWARD on six of eight shipped facings (study N/S 1.19 m, study E/W 1.35 m, hall E/W **1.98 m**;
hall N/S improve to 0.64 m), which is a move against the intention's fifth quality by the very
ruling that was made to serve it. So the six-foot ruling returns whole with row 4's measured camera,
which can carry the pitch. `px_per_m_at_wall` and `horizon_y` never moved, so §5's field-of-view
question is untouched either way.

**The wall in view is a list of bands, and that is the whole typed-geometry model.** `wallBands`
returns no band for an `open` facing, `wall_segments`' bands for a discontinuous one, and one
spanning band otherwise. Corner verticals stand at every band edge; returns are drawn only where the
meta knows the two corners of a single full-span band (`bounded`). So `enclosed`, `corridor` and
`open` select data, never a branch in the drawing — which is the checkable form of row 11's promise
that the other two types are "a meta entry later, not a renderer rewrite".

**Nothing hangs on a wall that is not there, and the read is in ONE place.** Blueprint §5 law (b)
gives a `wall_mounted` entity no wall to hang on where no band is built, and row 11's first pass put
that guard on `apertures` alone: the hole vanished and the plank stayed — 11,415 opaque pixels of
door standing in open void, hit-tested, hover-highlighted and toggleable. The leaf, the opening, the
hit region and the keyboard control are four code paths reading one document, so the guard is in
`layout`, which `hitTest`, the page's resolver and the controls all walk, and `apertures` asks the
same question of the same bands. The check is per OPENING, not per facing: on a part-built view the
opening must fall inside a band that is actually built, which is law (b) at the resolution the law
is written at — and that half had no case until a critic widened its tolerance and watched the whole
suite stay green.

**What the drawing does, region by region.** Above the floor line: the void base, then each band's
wall over it. Below: the floor base, then the two returns painted over both halves of their own
region (they span above and below the floor line). The return polygon is TRACED rather than
assembled from a polygon that self-intersects — the wall-floor junction leaves the frame through the
SIDE on a wide room (`study/N`: x 0 at y ≈ 1007) and through the BOTTOM on a narrow one (`hall/E`:
x 390 at y 1024), and one polygon has to handle both. Facing-wall metre lines are clipped to their
band; the returns carry verticals at each half-metre of depth and horizontals fanning from the
corner; floor longitudinals are only the metre lines inside the room and the transverse lines are
clipped to the floor the room actually has. The returns are drawn on **past the floor's own last
depth** — `px_per_m_at_bottom` is where the FLOOR leaves the frame, not where the wall beside you
stops — because stopping there left a corridor's lower corners as unlined slabs that read as void.
The eye line stays full width: a level camera's horizon is one line across every surface.

**One lighting model, and the returns are the half that could have been backwards.** A per-plane
facing tone first, then the existing frame-wide `key_tint` falloff over it. With the key at
upper-left the LEFT return's face turns away and the RIGHT return's turns toward it, so left is
darker than the facing wall and right is lighter — the same statement the sprite painters make with
their across-width ramp. `mechanisms.spec` checks both halves, because either alone can be satisfied
while the picture contradicts itself: the falloff's direction WITHIN each plane, and the return
ordering ACROSS them. That case used to sample x 40–340 against x 1196–1496, which after the corners
are the two returns rather than the wall, so it is re-pointed inside the facing wall.

**The glyph has a third candidate now.** It stands on the largest band in view and must lie inside
it; candidates are left of an opening, right of it, then ABOVE it. `hall/W` is why the third exists:
a 1.0 m door in the middle of a 2.60 m corridor end wall leaves no room beside it and both sideways
dodges land outside a corner. Where there is no band at all (`open`) it is centred on the view — the
`turn` response must survive every facing type, since §8 gives `turn` no narration key.

**Corridor is not nominal after this row, and not enclosed wearing a label.** The approved plan types
the cross passage's two ends `corridor` and `door1` stands on one, so M0 ships enclosed AND corridor.
What separates them is arithmetic already in the drawing rather than a second code path — and row 11
claimed that twice before writing the test, which the artifact critic caught. `geometry.spec` asserts
it now, on **two** terms, because one is not enough: return share alone is `1 − wall_width_m/16`, a
re-expression of width that reads no depth at all, so a 2.60 m wall at 1 m and at 6 m give the same
number. Beside it runs the metres of side wall in view — the depth at which the return leaves the
frame — which is the term that reads the standpoint. The corridor facings exceed every enclosed one
on both: 84 % of frame against the study's 66 %, and 4.02 m of side wall against 2.37 m. And the
same claim is read off the render as well as computed test-side, so the type cannot become a label
the drawing ignores. §5's "open centre" is the deep view between converging planes; a passage with
no end wall at all is the `open` type, which the same bands already draw.

**SUPERSEDED BY ROW 20: the corner DOES move with the standpoint distance now, which is what blueprint §5's [HUMAN] sentence asked for and the pinned scale could not give.** The paragraph below is row 11's, kept because its arithmetic is the argument row 20 acted on.

**What the corners make visible and do not settle.** 5.45 m at 96 px/m is 523 px of a 1536 px frame,
so two thirds of a study frame is side wall — an implied ~131° view against §10's 50 mm. Row 11
changed no scale. And under the pinned scale the corner's x is `768 ± wall_width_m × 96 / 2`, so
`camera_wall_m` cancels and two rooms with the same wall at different distances get pixel-identical
corners — where blueprint §5's [HUMAN] sentence asks the corner to be located "based on the distance
expected between the player and that wall". A pinned LENS would move it with distance and put no
corner in frame at these sizes (50 mm is a 2133 px focal; the study's wall would draw 3230 px).
**Ruled [HUMAN 2026-08-21]: the fixed scale stood for the grid era — and the grid era ended at row 20, when Kabe ruled the researched lens in ("full steam ahead").** What follows was true until then: the corner-as-a-fact-about-
the-wall is what ships; row 4's approved backdrop answers the model for good, which is blueprint
§5's law already. The bounded-room look and the corner treatment in row 11's frames are approved as
shipped. `mechanisms.spec` pins the current model with a case that says so, so a silent change of
model goes red.

**The grid draws no carriers, and the omission is COMPUTED from the plan rather than counted by
hand.** `apertures` derives openings from `locations[].exits` on the facing being drawn; §11 gives
the carriers to row 4's painted backdrops and §4b item 9 gives multi-facing presence to row 15. So a
doorway, a window or a hearth the plan holds in view is painted as plain wall. That is defensible —
the grid is §7's unestablished space, and it is far LESS divergence than the endless wall it
replaces, which ran one room's north wall across the whole frame and drew no side walls at all.
**What is not defensible is claiming the omission is smaller than it is**, and row 11's first
enumeration did: written by hand from `world.json`'s exits it listed three door slivers in the
returns. Computed from the plan's own carriers it is **five of eight facings on the wall the player
is looking at** — the study's fireplace is 2.20 m of a 5.45 m wall, `hall/E`'s window is dead centre
of a 2.60 m end wall, `study/S` has two windows, and the passage's north and south walls each carry
a door the world does not name — plus **sixteen** more on the returns. `geometry.spec` computes both
lists from `plan.json` and pins them, so a carrier the plan gains cannot quietly become blank wall.
The returns' list is attributed BY WALL LINE, so a carrier belonging to the room on the other side
of a shared wall is counted too: an upper bound, which is the honest side to be wrong on for an
omission ledger.

**A ceiling, drawn where the document asks for one — and it now asks.** `plan.floors[].storey_height_m`
is optional in the schema and **both shipped floors carry 2.8 m** [HUMAN 2026-08-21, ruled against
the rendered pair], so every enclosed and corridor facing draws its ceiling. `storeyHeight` returns
null for an `open`-typed room: the courtyard and the gardens sit on the `ground` floor like every
other room, and a floor-level height would hand them a 2.8 m ceiling over open sky — nothing would
draw it (the ceiling is inside the renderer's `bounded` branch and an open facing has no corners)
but the meta would be making a claim the document does not hold. The field stays optional because a
facing no plan holds has no floor to read one off. It lives on the plan rather than in the renderer
so that it is settable by a document — schema, validator clause and its own ledger cases. It exists
because a room bounded left and right and unbounded upward reads as a
shaft — at the pinned scale the frame holds 6.95 m of wall above the floor line against a c.1660
storey of 2.6–3.0 m. 2.8 m is period-plausible and sits under §4's standing licence, not a
measurement; row 4's approved backdrop may move it. **It is un-drawn content for the approval
stamp**: a plan view is a horizontal section and draws no vertical dimension, so `draw_plan.py`'s
`DRAWN_FLOOR_KEYS` keeps storey height out of the drawn digest — which stays byte-identical to the
plan Kabe signed — and the second digest reports it on the sheet's own face. The ceiling is line
work: its
wall-ceiling line, the two junctions, its own fan and its own transverse set, clipped to the room
exactly as the floor's are and carried to the scale at which the CEILING leaves the frame rather
than the one at which the floor does — row 11 used the floor's and the ceiling stopped 209 px down,
leaving the nearest fifth of the frame empty in the pair a human is asked to judge it by.
It has no plane FILL, and that is the narrowing rather than an omission — the fill was `#080a0e`
over a void base of `#080b10`, which measured through the real draw path moved nothing a detector
could name.

**The depth band a room can stage in narrows with its camera.** The validator bounds `depth_m` by
`scaleAtDepth ≤ px_per_m_at_bottom`; at `hall/N`'s 1.95 m standpoint the maximum legal depth is
**1.307 m**, where the 3.5 m fallback allowed 2.49. A placement legal yesterday can be a finding
today, and any future object in that room composes inside 1.3 m — row 4 and row 15 inherit that as a
composition limit, not only as a legality bound.

## The lens (row 20) — what changed, and what it is bound to

**The project pins a LENS, not a scale.** Until row 20 every facing drew at
`px_per_m_at_wall` 96 whatever its standpoint distance, so the implied focal
length — `px_per_m_at_wall × camera_wall_m` — ran 187 px to 2014 px across the
manor: a 4 mm fisheye in the cross passage, a 47 mm normal in the entrance
court, eleven different lenses in one building. That is the arithmetic behind
Kabe's symptom, verbatim: *"the demo first room looks like every direction is a
corridor….. That looks like a cross junction of long hall rooms or something and
user is in the middle. Like a + shape."*

Now `px_per_m_at_wall = FOCAL_PX / cameraDistance(meta)` with `FOCAL_PX` = 1024,
which is 24 mm on the 36×24 mm format this 1536×1024 frame exactly is (hFOV
73.7°). Three unrelated authorities converge there and the research at
`design/plan-draft/perspective-research.md` has the workings: Presto Studios'
own released interior camera at 70.6°, architectural photography's stated
ceiling at 73.7°, and the study's own north wall requiring 74.2°.

**Where the number lives, and what binds it.** `src/groundplane.js` holds
`FOCAL_MM` 24, `FRAME_W_MM` 36 and the derived `FOCAL_PX`; `replicator/
contract.json`'s `camera.focal_mm` is blueprint §10's [HUMAN] home for the
millimetres; `assertRuledLens` in `tools/plan-projection.mjs` refuses when they
differ and the bake calls it beside `assertRuledEye`. Two files agreeing is not
a binding — the check that fires when they stop is.

**The model collapses to one pinhole, and §5's recorded incoherence dies with
it.** A floor point at distance `d` draws at `y = horizon_px + f·eye/d` and at
scale `f/d`, so `scale(y) = (y − horizon_px)/eye`: linear in y and zero exactly
at the authored horizon. §5's lerp and §5's horizon device had been one camera
PER FACING since row 11; what row 20 changes is that it is the same camera on
every facing. `scaleAtDepth` reduces to `f / distance`.

**The drawing camera is MEASURED now.** `groundplane.DRAWING_EYE_M` = 1.08775 m
and `HORIZON_Y` = 524.4/1024, read off the approved study/N backdrop rather than
authored — blueprint §5 [HUMAN, 2026-08-20] rules that the geometry is
determined by the orientation of the approved image generation, and row 11's
1.60 m was named an interim awaiting exactly that. §10's ruled 1.83 m is
untouched: it is the GENERATION camera, it is what backdrops are prompted at,
and the generator did not honour it. The lower camera is what returns the
intention's fifth quality — the frame-bottom floor cut comes in to **2.23 m**
where every 24 mm preview frame drew 3.08 m and the fisheye it replaces drew
1.04 m.

**WHICH horizon, and it was ruled on evidence rather than adopted by default.**
Two instruments measure it and they disagree by up to 66 px across the eight
approved backdrops: a vanishing-point vote over Sobel gradients, and a robust
fit of the two side-wall/ceiling junctions — lines parallel to the view axis,
which must therefore converge ON the horizon. The Navigator ruled the ramp fit:
0.29–0.34 px residual over 61 columns a side against a vote whose three regions
scatter by 30 px, and adopting it makes the study's four independently
generated frames agree about their eye height **2.6× better** (spread 0.131 m
against 0.346 m). Nothing was regenerated for it. The measurement is
`design/plan-draft/measured/`, re-runnable, numpy and PIL only, and its control
reproduces the probe's own read of `study/N` — ceiling line and fireplace
opening exactly, floor line within a pixel, `px_per_m_at_wall` exactly.

### The standpoint law

Blueprint §10's ruling is *"Standpoints move to the thresholds"*. Two [HUMAN]
artifacts make the literal reading untenable and the Navigator ratified the
conditional in their light: Kabe approved preview frame `02b`, the passage's
east view at its DRAWN rule distance of 6.00 m, and `01d`, the study's north
view at its THRESHOLD of 4.35 m. The two frames together are the conditional,
stated in pictures:

> A facing that views a wall stands back to the far side of the room — a body's
> clearance (`plan.standpoint_threshold_clearance_m`, 0.45 m) off the wall
> behind it — when, and only when, its own wall does not fit the frame from the
> drawn standpoint. Otherwise the drawn standpoint stands. An `open` facing
> keeps the rule: its far line is a horizon and there is nothing to stand
> across from.

`standpointFor` in `tools/validate-plan.mjs` is its one home, called by the
validator, by `--rebuild-facings` and (through the plan) by the drawing.
`standpoint_source` gained a third token, `threshold`, beside `rule` and
`drawn`. Forty-two of the manor's eighty-eight standpoints moved, all backward.

Two things the law has to handle and does: **masonry**. A threshold walks into
the deep interior of a room, which is where hearths and stair flights are, and
four of the manor's would have landed inside one. The point pulls forward to
clear anything attached to the wall behind it (`study/S` therefore stands at
3.85 m, not 4.35 — you cannot back into your own chimney breast), and where the
pulled-forward point is STILL inside masonry — a stair flight that fills its own
room, which the manor has two of — the drawn standpoint keeps the facing. A rule
that cannot be satisfied gives way rather than producing an absurdity it then
reports. `plan.standpoint_clear` is the clause that refuses one anyway, hard for
a `threshold` standpoint (an agent computed it) and a warning for a `rule` or
`drawn` one (the drawing carries it). A standpoint in masonry takes
**precedence** over the branch and placement clauses: one fault, one finding,
which is what lets the ledger isolate it.

**The law's known cost, named here beside the law rather than only in the
residue list**: standing back moves the body. One 90° arrow press now carries the
viewer 2.38 m across a 4.80 m study where it carried 1.81 m before, and the
passage's E↔W standpoints are 4.00 m apart. The ruling this law serves says *"one
lens per room so turning never changes the body"* — the lens half is delivered
and the position half is measurably worse, and the trade was taken knowingly:
without it neither approved preview frame reproduces. **The mitigation path is
recorded and is not a lens change**: §4b item 9's multi-standpoint rooms make
body positions EXPLICIT — several named standpoints per room, each with its own
drawn distance — rather than implicit in a rule that derives one position from a
wall's fit; and the fiction of travelling between nodes absorbs the displacement
that free-look cannot hide. Residue item 3 carries the full table of numbers.

### What §12.5 lost, and what stands in its place

**Clause (i) is retired** — *the wall in view fits the frame*, and its
null-corner half with it, along with the three ledger mechanisms that carried
them (`meta.frame_fits_left`, `_right`, `_uncornered`). Under a pinned lens a
wall wider than the frame runs past it, exactly as in life: the cross passage's
8.00 m north wall seen from 2.15 m is 3810 px of wall in a 1536 px frame and its
corners are 1137 px outside. Keeping the clause would refuse the honest picture.
It is narrowed, not softened.

**(i′) ONE LENS** replaces it: `px_per_m_at_wall × cameraDistance(meta)` is
`FOCAL_PX`. Its status is said out loud, because this project has paid five
times for gates that cannot fail — **on a derived meta it holds by construction
and is a schema clause, not evidence; on a measured backdrop meta it is evidence
and can fail**, because the scale is read off the painting and the distance off
the approved drawing.

**(v) the falsifiable half at V1, in pixels.** What actually binds a meta to the
canvas now is the render: `geometry.spec` measures the drawn spacing of the
facing wall's own vertical metre lines and requires it to equal
`px_per_m_at_wall` within 2 px, on every facing. Pixels against arithmetic —
where the original clause's force lived, surviving the model change.

**(vi) corner honesty.** A corner vertical is drawn iff its computed x lies
inside the canvas — measured off the render on all eight facings, in both
directions. `hall/N` and `hall/S` assert that NO corner column exists anywhere
in the frame; the other six assert the detector finds the corner that is there,
so a renderer that stopped drawing corners could not pass by saying "no".

### The `+` junction guard

The symptom made measurable: the share of the frame taken by side-wall RETURN
rather than by the wall you are facing. Under the pinned scale `study/N`
measured 66 % and `hall/E` 84 % — one band, no separation, which is why every
direction read the same. Now: study 5.6–21.8 %, passage ends 71.1 %, passage
long walls 0 % (their wall is wider than the frame). Two clauses, at two levels:
no facing of a room that is not a corridor may show more side wall than facing
wall, and every study facing is under a third. Row 11's relative two-term
corridor ordering is kept beside them.

### What a facing shows, and two that show a wall

`hall/N` and `hall/S` show **no floor line, no ceiling line and no corner**, and
this is correct rather than a defect: the passage is 2.60 m deep, at this lens
you see roughly one metre of wall per metre of distance, and from anywhere
inside it the wall's foot falls below the frame — **by 18.5 px at the 2.15 m
standpoint**, which is a small margin and is stated as one: about 0.04 m of eye
height would put floor back in view, so this facing's "shows a wall, correctly"
reading is a fact about the camera as much as about the room. Nothing
can be staged on them either — the shipped depth bound `scaleAtDepth ≤
px_per_m_at_bottom` refuses any placement at any depth — which is what forced
`shelf1` and `stick1` onto `hall/E` (the reasons are on the plan objects). The
census is a plan warning rather than a hidden fact.

### Residue, named

1. **The nearest visible floor is 2.23 m on every facing in the manor**, and it
   is `eye / (1 − horizon_y)` when `f` equals the frame height, as it does here.
   Its infimum over any usable horizon is the EYE HEIGHT itself, so no lens
   shift at this focal length puts the cut at a viewer's feet — the intention's
   fifth quality's second carrier, *"Kabe's reference anchors the same way
   through a near desk surface"*, is what closes the rest, and it belongs to the
   row that stages a near surface. **And that carrier is currently forbidden by
   a guard**: the depth bound above refuses any placement nearer than the
   nearest visible floor, which is exactly the near-surface device. Whoever
   builds it needs the bound to admit an object whose feet are out of frame but
   whose surface is in it.
2. **Objects near the wall draw larger by a different factor per facing** —
   ×1.78 on the passage's ends, ×2.45 and ×2.61 in the study, ×4.96 on the
   passage's long walls. One number for the manor would be false.
3. **Turning translates the body further than before, and the number that
   matters is the 90° one.** The study's standpoints are N (27.675, 10.05),
   E (26.3125, 12.0), S (27.675, 13.45), W (29.0375, 12.0): **one arrow press
   moves the viewer 2.38 m or 1.99 m**, a 180° turn 3.40 m, and the passage's
   E↔W 4.00 m. Before this row the same 90° turns moved 1.81 m and the 180° one
   2.40 m, so the row made this measurably worse. A player performs the 90°
   turn and never the 180° one directly, so that is the number to shrink. The ruling's own words are *"one
   lens per room so turning never changes the body"*: the lens half is fixed and
   the position half is worse. §4b item 9's multi-standpoint rooms were handed to row 15 here and
   row 15 DECLINED them by Navigator ruling, on the ground that multiplying or moving standpoints is
   drawn content and ends at a human redline exactly as row 22 does; what row 15 owes them instead is
   the evidence, and *The manor walkable* carries it.
4. **The eye/pitch axis is untouched and still disagrees.** §10 rules eye 1.83 m
   with −8° pitch for generation and the renderer draws at the measured
   1.08775 m level. A backdrop generated at −8° and projected level mis-sites the horizon
   by `f·tan 8°` = 144 px. Same class of defect as the focal one, on an axis
   this row is not licensed to move.
5. **`door1`'s plan/staging divergence is CLOSED, and this row is where the
   stale sentence saying otherwise was caught.** Row 11 adopted the
   projection's own values into `staging.json`, so `door1` on `study/E` is
   staged at u 0.729166 — 1.100 m off the east wall's centre, exactly where the
   drawing sites it — and `stagingDivergence` reports nothing. An artifact
   critic found the sentence still claiming a 275 px disagreement.
6. **Sprites do not stretch.** A real 24 mm lens elongates an off-axis object by
   up to 1.35× and a pasted sprite will not; `chair1` sits 37.2° off axis.
7. **The rooms read larger than their metres**, by a factor no reachable lens
   removes and uniform across every facing.

### A batch is an artifact of the code, and it answers for itself

The frames a human is asked to rule on are the only artifact in this project with no compiler, no
test and no reader between them and his eye — and row 20 shipped a batch that had gone stale two
commits after it was captured, because a two-line glyph resize repainted every frame and nothing
could see it. A blind comparator and an artifact critic both spent a full pass scoring a build that
no longer existed.

The first fix named the capture commit in the batch README and asked git whether `src/` had moved
past it. That failed for the reason this project keeps re-learning: **a guard that reads a string
out of the document it guards is satisfied by editing the string** — and the string was already
wrong, naming a commit two changes later than the capture, while the test was green. It also bound
nothing about the pictures, so copying one frame over another left the whole suite green.

What ships instead: `design/batches/<row>/capture.mjs` is committed beside the frames, and
`plan.spec` runs it into a temporary directory and requires every frame back byte-identical. **This
is not a stored golden** — §12.6 forbids those and re-rendering against a kept file would be one.
Nothing is stored; the comparison is against what the code draws at this moment, and it is available
only because the capture path is deterministic (same intents, cold `file://` load, `body.capture`,
nothing hovered or focused). It also asserts that every frame the script produces IS in the batch,
so one cannot be quietly dropped from the set a human is shown. **Any future batch copies this
shape**, and an artifact nobody can regenerate is not derived — it is just a file.

### The measurement has to be trustworthy before the verdict is

Row 20's backdrop gate learned this on live work. `design/plan-draft/measured/measure.py` carries a
per-facing configuration — fixed pixel windows and a named calibration feature with an assumed real
size — hand-tuned to each candidate image. Pointed at a NEW candidate without re-tuning, every
detector searches a fixed band for a feature that has moved and reports whatever is at those
coordinates. On the second round of backdrops it derived storey heights of 1.81 m to 5.38 m in a
2.80 m room, an eye height of 3.09 m, and two corners on a facing whose own prompt forbids them.

**A derived quantity that is physically impossible is the measurement telling you it is measuring
something else**, and the rule the row adopted is that such a facing gets a WITHHELD verdict in the
miss ledger rather than a number. The temptation is the other way: three ad-hoc measurements of one
facing gave 740, 1027 and 111 px, and any of them could have been quoted. What settles it is a
CONTROL — run the same method on `study/N`, whose answer is known to be 1010 px, and it returned 49.
**An agent measuring a picture several ways until one agrees with its expectation is this project's
oldest defect wearing a lab coat**, and the control is the cheapest thing that stops it.

### Found by the artifact critic, kept as known limits

- **`stageWithout` fires on TEXT, not behaviour.** A renderer ledger case throws when its marker
  string is absent, so a harmless reformat of `src/renderer.js` turns the ledger red while a real
  defect that leaves the marker intact does not. It is the price of breaking a mechanism by
  deleting its own line, and it is worth knowing before anyone tidies that file.
- **`meta.one_lens` cannot fail on anything this project produces.** `deriveMeta` computes the
  scale from the lens, so the clause holds by construction and its ledger case hand-doctors a
  meta. What carries the content at V1 is §12.5 (v) — the drawn metre module measured against the
  meta — and (i′) becomes evidence the day a MEASURED backdrop meta ships.
- **`standpoint_source: "drawn"` is an unguarded opt-out.** Writing that one string exempts a
  facing from the standpoint law entirely, with no finding; only law (a) (the printed distance is
  the measured one) survives. It is §4b item 9's escape hatch for multi-standpoint rooms and it is
  also the one word an agent can type to move where a player stands without a check noticing.
- **The byte-compare baseline is a commit this row's builder made.** `plan.spec`'s derived-render
  test answers "has the drawing left what the builder drew", not "…what Kabe approved". The
  `pending` line on the sheet's own face is the mitigation, and the batch does not leave the tree
  until his word lands — but the distinction is the lock's whole purpose and it is named rather
  than smoothed over.
- **Turning right in the study empties it.** The desk, chair and notebook stand on the north wall
  and appear in no other facing; §4b item 9's multi-facing presence is row 15's. This predates row
  20, and row 20 sharpens it: a room that now reads as a bounded room with corners and a ceiling
  makes an empty adjacent wall read as a fault rather than as a convention.
- **Open a door and you look through it into black.** The aperture is a hole in the wall with
  nothing behind it — 69,120 near-black pixels, 4.4 % of the frame, on `study/E`, against about
  10,000 under the pinned scale. The lens magnified it 6.8× because it magnified the doorway. What
  belongs behind it is the next room's own painted wall; it is the painted world's to close and it
  is in the row's batch.
- **The coin is a 2.7 CSS-px target on a phone**, with about 11 px of reachable area against a
  44 px platform minimum, and a near-miss silently takes the bookcase instead. `index.html`
  attributed this to "the apparent-size consequence of the open camera question" — row 20 closed
  that question and the defect stands, improved from 7 px to 11 px. It is now a question about how
  big the objects are, which is the asset lane's.

### Where row 20 stopped, and why there

**The row closed at the LENS boundary — its original scope, and the whole of it.** The lens is
pinned, the standpoints moved, the sheets redrawn, the gates recomputed, and nine rounds of
examination are spent on exactly that. Two things that grew onto the row late did NOT close with
it and were not built: promoting the painted backdrops into the world, and the doorway that shows
the next room instead of black. They are **row 21**, allocated at this close.

**What the row owed when it stopped, in order, so the list is not reconstructed from memory:** the
seven regenerated backdrops through `gate.py` (0 of 7 admitted at the close — three study facings
measured and short by 4.6 %, 5.1 % and 24.2 %, four passage facings WITHHELD because the harness
returned an impossible room, all of it in `design/plan-draft/measured/miss-ledger.json`); their
promotion to `backdrops/<loc>/<facing>.png` with measured metas; the navigation boot fixture and
the doorway-as-a-building-fact an empty painted room needs to be walkable; a batch of the painted
facings. Every one of those is row 21.

**Kabe's word on `design/batches/row20-lens/` is still outstanding.** The row's own done clause
made his verdict the close, and this close does not pretend to have it: the batch stays in the
tree with every question it carries — the eye height, the two long-wall facings, the turning
translation, the schematics' stamp — and it rides with row 21, which re-batches over the painted
world. `design/approvals.log` carries the entry, reading `pending-close`; `approval.lock`'s
`pending` line and the batch directory are one switch, and while it is on the sheets keep printing
what the approval does not cover. The scored pass's population error is ruled and recorded in
`design/comparison-criteria.md` and in the batch's own `comparison.md`; what the comparators
measured stands, and what they *verdicted* per facing does not.

### What row 20 hands on, and to whom

The spec list is the one home of targets and this row may not edit another row's
text, so the hand-offs are recorded here where they survive its close:

- **The asset lane** — the eight approved backdrops are measured
  (`design/plan-draft/measured/`, re-runnable) and they imply **eight different
  focal lengths**, 498 px to 1010 px against the ruled 1024. `study/N` — the one
  Kabe's probe approved — lands 1.4 % away, so the measurement CONFIRMS the
  ruling; the disagreement is concentrated in the passage, whose north and south
  paintings depict a room 4.01 m and 3.54 m deep against a plan that says 2.60.
  Promoting them at true geometry is a fork with three answers; the Navigator
  ruled (c) — the seven regenerate with the camera enforced, `gate.py` is their
  acceptance gate at ±3 % of 1010 px, and the law is not widened to admit the
  corpus. **Row 21 carries the promotion**, one admitted facing at a time.
- **The measurement also found**: the frames disagree with themselves about
  their own horizon (ceiling geometry and floor geometry give vanishing points
  up to 66 px apart, the ceiling-ramp fit being far the sharper at 0.3 px
  residual); the camera is ~1.2 m on all eight where 1.83 m was asked for every
  time; and the painted door is measured at 660..874 × 308..778 on `study/E` and
  698..825 × 377..649 on `hall/W` but painted at 2.20:1 and 2.14:1 against a
  ruled 2:1, so its two ruled dimensions disagree by 9 % and 7 % about that
  facing's scale.
- **The doorway wants to become a fact about the BUILDING rather than about a
  leaf sprite** — a meta carrying its own measured opening, with the aperture
  derived from it where no leaf is staged. That makes §11's *"the painted
  opening must coincide with the click target"* true by construction instead of
  by prompt discipline, and it is what an empty painted room needs in order to
  be walkable. Ratified in principle; unbuilt.
- **Allocated at row 20's close as part of row 21**: *through an opening, the
  destination room's content shows*. The picture must not say VOID where a room stands, which makes it
  product truth rather than polish, and the lens sharpened it — the black through
  an open door went from about 10,000 px to 69,120 px, 4.4 % of the frame,
  because magnifying the doorway magnified what is behind it. It boards from the
  integration/sprite phase and it wants the meta-carried opening above. **What
  row 20 shipped is honest interim, not a defect hidden**: what the code draws
  today is a dark aperture, and the batch README says so in those words rather
  than letting a reviewer discover it. **BUILT AT ROW 21**, with the destination
  drawn through `render` itself so a painted room and a drawn one arrive by one
  path.
- **Rows 18 and 19**: eight more ledger tokens, and row 19's carrier work partly
  reached here for standpoints only (`plan.standpoint_clear`).

## The painted promotion (row 21) — one wall, two worlds, and a doorway with a room behind it

**One wall of eight is painted, and that is the row's whole corpus.** `study/N` — the frame Kabe
approved on 2026-08-21 — is promoted to `backdrops/study/N.png` with a measured
`backdrops/study/N.meta.json`. The other seven candidates were measured and none was admitted; the
verdicts and their diagnosed causes are below. Everything else about the row follows from that one
promotion and from what an empty painted room needs in order to be walkable.

### The gate, and what it refused

`design/plan-draft/measured/measure.py --round cand2` (the default; `--round cand1` still
reproduces the committed cand-1 run byte-for-byte) measures all eight candidates, and `gate.py`
prints the verdict: a candidate is admitted when its `px_per_m_at_wall` times its own DRAWN
standpoint distance lands within ±3 % of `study/N`'s measured 1010 px.

```
facing      standpt       px/m     TARGET   focal px   verdict
hall/E         6.00      88.85      168.3        533   FAIL  -47.2%
hall/N         2.15          -      469.8          -   WITHHELD
hall/S         2.15          -      469.8          -   WITHHELD
hall/W         6.00     106.00      168.3        636   FAIL  -37.0%
study/E        4.09     235.50      246.9        963   FAIL   -4.6%
study/N        4.35     232.22      232.2       1010   PASS
study/S        3.85          -      262.3          -   WITHHELD
study/W        4.09     233.22      246.9        954   FAIL   -5.6%
```

**WITHHELD IS NOT FAIL AND MAY NOT BE QUOTED AS ONE.** A FAIL is a fact about a painting and
carries a delta the asset seat can act on. A WITHHELD is a fact about our own measurement — nothing
in that frame can be turned into a scale — and carries `blocked_on` instead of a re-ask, because a
re-ask sent against a number nobody could measure sends the seat chasing a defect that is on our
side. `gate.py` prints them differently and `misses.jsonl` types them (`generation_miss` /
`measurement_withheld`); a null `px_per_m_at_wall` is what a withheld facing writes, and reading
that as a zero is the failure this distinction exists to prevent.

**The ruler is chosen by a rule fixed before the answer.** Tier 1 is a ruled-size feature painted in
the wall plane (a door opening at 1.00 × 2.00 m, the fireplace at 0.90 m, a window bay at 0.90 m);
tier 2 is the panelling module transferred from the approved frame of the SAME room; tier 3 is the
plan's own ruled wall width, adopted only with the circularity said out loud. Every ruler a facing
admits is measured and recorded in its JSON, a FAIL is issued only where EVERY admissible ruler
fails, and where the rulers straddle the band the verdict is WITHHELD — because then the choice of
ruler would choose the verdict. That is what makes the control mean something: `study/N` measured by
the same code returns its committed numbers exactly (ceiling 81, floor 777, corners 142/1389,
fireplace 209 px, 232.222 px/m), which proves the code reads what it always read, and the
per-facing cross-ruler agreement is what says whether a RE-TUNED window is looking at the feature it
names. `design/batches/row21-promotion/measured/<loc>-<facing>-marked.png` is each frame with every
line the measurement used drawn on it — a ruler lying on nothing is visible to a human in one look
and to no amount of JSON.

**Numbers this row overturned in the round-20 record**, all of them by re-measuring: `study/W`'s
left corner was 208 under the cand-1 corner rule and is 144 (the 25 %-of-mid-wall threshold fails on
a dimly lit wall half; the cand-2 rule uses a local reference and reproduces the control exactly);
`study/S`'s three window bays are 235.5 / 255.0 / 235.5 px, not the 20 % spread first read by hand;
`hall/W`'s jambs are 709/825, the 709 being the wall-plane corner where the hand read the reveal's
inner edge.

### The miss ledger, and the two causes now refused before an image is made

`design/plan-draft/measured/misses.jsonl` — one JSON object per line, header first, seven entries —
supersedes `miss-ledger.json`, which is deleted: the machine-readable file is the one home.
`design/production-law.md` clause 2 is what it answers to, and clause 3 is why
`design/plan-draft/measured/prompt_lint.py` exists. Two causes, both properties of the PROMPTS
rather than of the generator, both mechanical:

- **The prompt contradicted itself about the camera.** Five of the seven carry `Avoid: changing the
  camera scale` in one paragraph and *"move the camera closer until the wall spans about 1346 px"*
  in the next. The negative won every time — `study/E` and `study/W` came back corner-for-corner
  identical to the round before them (1194 px and 1246 px), and `study/E`'s door head sits at y 308
  in both rounds.
- **The prompt left the gate nothing to measure.** `hall/N` and `hall/S` were prompted with *"NO
  floor line … NO corners in frame"* on a wall with *"no feature, carrier, opening, or
  decoration"*. The paintings obeyed perfectly and are unmeasurable by construction.

The lint refuses a prompt carrying either, and requires every prompt to declare its own
`Gate anchor: <feature>, <size> m`. Measured over this round: 5 of 7 contradict, 7 of 7 declare no
anchor, 2 of 7 ask for a frame the gate can never measure. **It is not yet clocked as an
improvement and says so** — the metric is the FIRST-ROLL PASS RATE, its baseline is 0 of 7, and the
next round is what says whether these clauses moved it. Blueprint §11 carries the rule as product
law; the lint is its enforcement.

### The promoted meta, and what is measured versus what is the building's

`tools/promote-backdrop.mjs --facing study/N --candidate <png>` writes both files and is the only
way a painting gets into `backdrops/<loc>/`. It **refuses a candidate the gate did not admit**, in
the validator's own words, so "admitted" is decided by the measurement and never by whoever ran the
promotion. It is a generator, not a hand: re-running it is a byte no-op, and re-measuring and
re-running it moves the meta with the measurement. That is also what makes the promotion cheap to
reverse if the camera A/B on `design/approvals.log`'s open line ever picks the standing eye.

Measured off the painting: `floor_line_y` (777 px), `horizon_y` (the **ceiling-ramp** intersection,
524.4 px — the instrument the Navigator ruled at row 20, not the vanishing-point vote's 498),
`px_per_m_at_wall` 232.222, the corners 142/1389, `key_tint`, `key_dir`, `calibration_ref/px`.
Taken from the plan: `wall_width_m` 5.45, `camera_wall_m` 4.35, `storey_height_m`, `facing_type`,
`wall_segments`, and where the doorways stand. `measured: true`, `provisional: false`.

**What that costs and what it buys.** The measured scale is 1.35 % under what the ruled lens at the
drawn 4.35 m would give (235.402), so promoting a facing moves its corners ~16 px and every drawn
height on it by that fraction. `LIT.MEASURED` in `tests/playwright/helpers.mjs` carries those
numbers, typed by hand from the committed meta exactly as the standpoints are typed from the
approved sheet, and `LIT.derivedFacing` still returns what the lens alone implies — a painted facing
has two answers and a reader has to be able to name which one it means. `projection.md`'s facing
table is judged against the DERIVED one, because that report is the plan's projection and not a
description of a painting.

**Two lenses in one room, and it is named rather than hidden**: the study's north wall is now on the
measured 1010 px camera while its other three are on the ruled 1024 px one. That is 1.4 %, it is
inside the band blueprint §5 admits, and it is the shape of the defect row 20 removed arriving one
facing at a time. It closes when the room is wholly painted; until then a room may be half-promoted
and this paragraph is the record that it was a decision.

### The room the painting depicts is not quite the room the plan rules, and that is WARN-TIER

`study/N` paints a **3.00 m storey against a ruled 2.80** and a **5.37 m wall against a ruled
5.45**; `study/E` and `study/W` draw the room's east and west walls 5.07 m and 5.34 m wide against
a ruled 4.80. The promoted meta records both halves — the plan's numbers in the fields the renderer
reads, the painting's own in `measured_room`, which nothing reads — and `gate.py` prints them under
a `warn` heading that never touches its exit code.

**Ruled WARN-TIER by the Navigator, 2026-08-22, on three grounds**: a per-facing MEASURED meta
already reconciles scale and sprites, so nothing composited missizes (px_per_m is read off the
painting, not assumed); the plan stays truth for topology; and the cross-facing disagreement at the
corners is below perception at this V-stage. It may not become a failing clause until it has been
clocked against the production law's fifth clause. **What it is for meanwhile**: a camera re-ask
that fixes only the camera keeps every one of these, so the number has to be visible when the next
round is judged.

### `key_dir` on a painted facing is what the painting does, not what §5 hoped

The promoted meta carries `key_dir: "L-BELOW"`, not §5's `"UL"`. The brightest patch in the approved
frame is the hearth fire — left of centre and below the horizon — and that is the light a sprite
standing in that room has to match. Writing `"UL"` would have told row 4's sprite lane to light
against the painting. Nothing in the renderer reads the field; the sprite lane does.

### Two worlds, and which one the link boots

`index.html` boots `?world=<id>`, defaulting to **`nav-manor`** — the painted, walkable, EMPTY
world: the manor's two rooms, four facings each, no entities at all. The furnished demo world is at
`?world=demo-study`, and the README names that link, because the storefront is ruled mute and a
query parameter nothing names is a room with no door. [Navigator ruling, 2026-08-22, on the human's
own milestone direction — *"just do empty rooms for now… master the schematic to empty room
navigation first"* — with the interactable showcase returning as the sprite phase's first live
push.]

The bake registers each world under its directory name in `window.HOLO_FIXTURES`; `HOLO_FIXTURE` is
set by the PAGE to the world it actually booted, so that name means the world on screen rather than
whichever script tag came last. An unknown `?world=` boots nothing and takes the existing
product-voiced boot surface — a page that boots something other than what it was asked for is the
picture lying about the document. `tests/playwright/helpers.mjs`'s `appUrl` appends
`?world=demo-study` so every spec written before this row keeps the world it was written against;
`navUrl` is the bare URL and `nav-walkthrough.spec.mjs` is what walks it.

**A fixture may carry `plan.ref`** — one line naming the plan it is projected from — instead of its
own `plan.json`. The manor plan has one home and the navigation fixture does not copy it. The bake
refuses a fixture with neither, and `resolvePlanPath` in `tools/validate-fixtures.mjs` is the one
home of that resolution.

**The bake resolves the MEASURED tier now.** It used to bake `metaForFacing` from
`plan-projection.mjs`, which knows only tiers 2 and 3 — so a promoted painting's own geometry
reached the validator and never reached the page, and the picture would have been drawn with
numbers nobody measured. The bake calls the validator's `metaForFacing`, which is the one home of
the three-tier rule.

**The paintings reach the page as data: URIs.** A `file://` page drawing a `file://` image taints
the canvas in Chromium and every hash test reads the canvas back. `tools/bake-backdrops.mjs` writes
`backdrops/baked.js` from the PROMOTED pngs only — never from `backdrops/source/`, because a
candidate is not a backdrop until it is gated. The page puts each decoded image in a hidden
`#backdrop-store` **in the document**, so the browser's own load event waits for it and the first
frame is of the painting rather than a grid that flips a frame later. Two consequences worth
knowing: the boot handler's "nothing of this place can be shown" is deferred to the LOAD event now
rather than to the next task, because a healthy page has painted nothing at the next task; and a
painting that will not decode drops to the grid with the detail on the console, which is the same
accepted deviation as a stale bake and has the same mitigation. **Cost, measured**: 2.6 MB of PNG
becomes 3.4 MB of base64, so eight facings would be ~27 MB of JavaScript parsed before the first
paint. The lever for the row that promotes the rest is a lossy encode (a q92 JPEG is about a
seventh), and taking it means deciding whether the flip test may judge a picture the repository does
not hold. Named here rather than sprung on that row.

### The doorway is a fact about the building

Until this row the only thing that knew where a doorway was in the picture was the door LEAF's §4
placement — so a room with no leaf staged in it had no doorway at all, which is exactly what an
empty painted room is. `deriveMeta` emits `openings[]` per facing now: `{ id, via, x, y, w, h,
beyond_m, beyond_offset_m }` in scene pixels, the x-extent through `groundplane.xAtScale` from the
plan's own opening rect at WALL scale (the near face — the face a player aims at and the face the
leaf's placement is computed at), and the height from blueprint §11's ruled 2.00 m door opening.
That constant lives in `plan-projection.mjs` as `DOOR_OPENING_HEIGHT_M` **because the plan carries
no vertical datum** and adding one would move the drawn digest of the plan Kabe approved.

`apertures()` resolves per exit, in this order and no other:

1. the staged leaf's placement rectangle where the world holds a leaf — unchanged, and still
   knowledge-filtered, because a leaf is an entity and a door the player has not been told about
   must leave no hole;
2. otherwise the facing meta's opening for that `via` — a building fact, and **not**
   knowledge-filtered, because the wall has the hole whether or not the player knows anything and a
   painted backdrop shows it either way. Filtering it would make the picture contradict the painting
   it is drawn from.

The discriminator is whether the WORLD holds an entity of that id, not whether one is staged, so the
demo world's knowledge-filter case is untouched. `handleGo` refuses on a leaf that is not open and
permits passage through an opening no entity fills; `resolve` in `index.html` returns `doorway` for
an unfilled opening (without this the painted world had a hole in its wall, a `go` the harness would
have honoured, and no pointer path to it); the keyboard go-control follows the same rule, so an
empty painted room is not walkable by mouse alone. A typo in `via` cannot become a way through a
blank wall: the fixture validator refuses an exit whose `via` resolves to neither a staged
transition entity nor an opening the facing's meta carries (`[row21:exit.via_unfilled]`), and one
whose opening is off the frame (`[row21:exit.opening_offscreen]`).

**A meta carries every door the plan puts on that facing, and the renderer cuts a hole only where
the WORLD says there is a way through.** The cross passage's north wall carries `op15` and its south
wall `op14`. **Neither is named by an exit of the DEMO world**, which is the two-room fixture this
paragraph was written about; the manor world walks through `op15` and cannot walk through `op14`
(its own standpoint cannot see it — see *The manor walkable*). In the demo world they appear in the
meta as geometry with `via: null`
and are painted as plain wall, which is row 11's omission census unchanged (`geometry.spec` computes
that list from the plan and pins it, so a carrier the plan gains cannot quietly become blank wall).
Neither reading of the alternative is available: cutting them would show void through a doorway the
document cannot walk you through, and dropping them from the meta would lose the fact that the
building has them.

`enumerateNarrationDomain` no longer enumerates `go.<exit>.refused_closed` where no leaf exists —
the predicate is the one `handleGo` reads, so the navigation world is not asked to author a line for
a refusal it cannot emit.

### Through an opening, the destination room — never void

The row's one real rendering task. What stood here was a dark fill: **92,061 pixels of the study's
own doorway darker than luminance 12, and none now** (`backdrop_only`, the meta opening's own rect).
That is the picture saying VOID where the document holds a passage, which makes it product truth
rather than polish.

One device serves painted and synthesized facings alike, because it draws the destination through
`render` itself: the destination facing's own picture — its painting if it has one, its grid if it
does not, and whatever the document stands in it — scaled and clipped into the opening. Three things
decide the transform, and all three come from documents:

- **the scale** is `d_dest / (d_here + beyond_m)`: the destination's own wall stands that far from
  THIS camera and its painting draws that wall at `d_dest`. It is NOT the ratio of the two
  standpoint distances, which assumes the far camera stands in the doorway and draws the next room
  **26 % too large** — 6.00/(4.09+6.00) against 6.00/12.69.
- **the horizontal placement** is the destination's own view axis, `beyond_offset_m` to the side of
  this one, at the far wall's own scale.
- **the vertical placement** is horizon onto horizon. Both cameras are level and at one eye height,
  so a floor point at any distance lands on the same row in both frames — which is what stops the
  sill reading as a step.

The far room is smaller than the hole it is seen through, so its frame does not cover the opening;
its edges are extended into the remainder rather than left as void, because the floor beyond does
continue toward you and a hard edge where a picture ran out would be a claim nobody made. It is
dimmed to 58 % (`THROUGH_DIM` 0.42), which is a look decision made by a constant and goes to Kabe in
the batch as one.

**What it costs, measured** (unthrottled, through `renderer.render` directly, mean of ten):
`study/E` with an open door draws in **63.9 ms** against **12.9 ms** with `no_through` — an extra
full-frame render of the destination, which is exactly what it is. The painted `study/N` draws in
32.9 ms. Per turn, not per frame, and the page repaints only on a non-empty envelope; the fix if it
ever matters is the same one the per-entity offscreen canvases want — bound the scratch to the
rect that is actually used, here the opening rather than the frame. Named rather than optimised,
because nothing in the shipped page is paced by it.

**A shut door shows no room**: the leaf is a sprite with its own alpha and does not fill its
placement rectangle to the pixel, so a lit room drawn behind a closed leaf leaks around its edges.
**`no_through` stops the recursion at one room** — looking through a door never draws the door
beyond it — and it is also the switch the ledger case flips to measure the void the device replaced.
Every other option is inherited by the inner render, so a flip pair's backdrop-only half is
backdrop-only on both sides of the wall.

**What guards it is geometric, not dark.** "Never void" is met by any non-black fill, so a check
that measured darkness would pass a destination pasted at any scale at all. `geometry.spec` predicts
the passage's far corner at x 961.7 and its floor line at y 612.2 from four typed numbers — the
study's standpoint distance, the 8.60 m between the two wall lines, the passage's ruled 2.60 m
width, and its axis offset of 1.10 m — and measures both off the render. The wrong transform puts
that corner at x 1012, a fifth of the opening away.

**Named limits.** The destination is a frame drawn from ANOTHER standpoint, so only its scale,
its axis and its horizon are made true: the parallax within it is the destination camera's, not
this one's. Nothing is drawn through two doorways deep. Both are consequences of pasting a frame
rather than re-projecting a room, and re-projecting one needs geometry no §5 meta carries.

### What the tests now say about a painted facing, and where the two branches part

Every clause that reads the GRID's own structure is scoped by `meta.measured`, and the scoping is
asserted rather than assumed:

- §12.8's grid clause moved to `study/W` — until a painting existed it could not discriminate, since
  every facing rendered the grid — and gained its converse: a facing WITH a backdrop asset renders
  the painting, measured as a different picture from the grid the same facing would draw.
- §12.5's camera-has-feet test branches: a painted facing has no drawn metre module, so what runs on
  it is **(ii)** — the corners MEASURED off the image against `wall_width_m × px_per_m_at_wall`,
  1247 px against 1265.6, a 1.5 % residual inside the ±3 % the calibration audit allows — plus the
  same camera-has-feet residual read off the painting's own floor line, found at y 777 by luminance
  step. Clause (ii) had had no subject since row 11 wrote it.
- `mechanisms.spec`'s per-facing corner test SKIPS a painted facing, visibly, rather than returning
  early.
- `heights.spec`'s wall-plane identity is an equality on a derived facing (it is one statement
  written twice) and a half-thousandth-of-a-pixel agreement on a painted one, where the floor line
  is read off the painting and the eye height comes from outside it.
- `guards.spec`'s four doctored-meta cases moved from `study/N` to `study/W`: doctoring the derived
  map cannot reach a facing whose meta is resolved from a file, so those cases had gone
  green-by-absence.
- `stageTree` and `stagePlanTree` copy `backdrops/` (never `source/`): the metas are a bake input and
  `baked.js` is a script the page loads, so a staged tree without them bakes a different fixture and
  fires the missing-module fault.

### The row-20 batch, and the gate that retires on a verdict

`design/batches/row20-lens/`'s eleven AFTER frames are pictures **today's build does not draw** —
six of them moved when `study/N` was painted and the doorway gained a room behind it. Re-capturing
them would replace evidence a human has not ruled on with evidence he has never seen, so they are
re-rendered from `ROW20_COMMIT` (`b0422ac`, the row-20 closing commit) exactly as that batch's own
BEFORE frames are re-rendered from the build before the lens. Its `capture.mjs` gained
`?world=demo-study` — the world it always captured, now asked for by name.

**Round 7's G2 is closed.** The `pending` gate no longer retires when a directory stops existing: an
entry in `design/approvals.log` whose last column reads `pending-close` or `-` is a gate that has
had no word, and `plan.spec` requires that while such an entry stands, the batch it names is in the
tree with pictures in it AND `approval.lock` carries its `pending` line. Retiring the gate means
writing down what a human actually said and the commit he said it against — a claim about a person,
which is the one thing an agent cannot satisfy by deleting a file. Row 21's own batch has its entry,
reading AWAITING.

### A live player finding, and the one word that answers it

[HUMAN, 2026-08-22, verbatim, on the current link]: *"Demo door puts me in a room without a return
door but otherwise ok."*

The return door is drawn and works — `hall/W` renders it correctly and the walk back is one click.
What was missing is that **his own orientation law puts the door behind you on arrival**: passage
maintains orientation, so you walk east and arrive facing east, with the way back at your shoulder
and nothing saying so. A player reads a room with no door in it.

Both arrival lines gained the peripheral sense (§4b shape item 9's doctrine — what the body knows
that the frame does not show): *"…The door stands open behind you."* in the furnished world, where
a leaf stands in that opening, and *"…The doorway stands open behind you."* in the painted
navigation world, where the opening is the building's and no leaf fills it. Two worlds, two
narration files, one word apart — which is why `voice.spec`'s audit byte-equality reads BOTH files
now and requires every line of each to be enumerated.

**What it does not do, and the honest limit**: the line is spoken once, at arrival. A player who
turns twice and forgets is not told again, and the picture still shows a bare wall on three of the
four facings of an empty room. The full answer is a turn-around affordance or a compass, and
neither is this row's.

### What round 2 changed, after an artifact critic took it apart

Fifteen blocking findings and ten observations. What they moved, in the order a reader would want
them:

- **The picture and the plan disagree about where the study's hearth is, by 1.41 m** — the approved
  drawing puts the chimney breast at 1.65–3.85 m along the north wall, the approved painting puts
  its fireplace opening at 0.87–1.78 m. The gate could not see it: it asks whether a candidate was
  painted at the project's CAMERA and never whether the room in the picture is the room the plan
  draws. `promote-backdrop.mjs` now measures every in-view carrier against its plan position and
  records it in the meta (`measured_room.carriers`), and `geometry.spec` holds the number so it
  cannot move unnoticed.
  **RULED at the row-21 close (Navigator, 2026-08-22): the PLAN amends to the painting**, and it
  lands as **row 22** rather than inside this one — that row's spec-list entry carries the whole
  cascade and its done clause ends at Kabe's glance, not at a green suite. The wall map's hearth was [AI]-drafted; the
  painting's position is what Kabe approved with his own eye (`design/approvals.log`, 2026-08-21)
  and blueprint §5 makes the approved image the geometric authority. The rectangle is the painted
  stone CASE — 1.27 m wide centred at 1.39 m, its outer mouldings measured at 0.756 and 2.023 m —
  and NOT the 0.87–1.78 m opening the first report quoted, because a 0.91 m breast around a 0.91 m
  opening is impossible. What it costs, priced before it was scheduled: moving the carrier takes
  `study/S`'s standpoint back from 3.85 m to its threshold 4.35 m, because that standpoint is
  pulled forward TO CLEAR THIS HEARTH — and with it go the derived meta, the drawn distance,
  `standpoints.tsv`, the gate's own re-ask target for that facing (262.3 → 232.2 px/m), the
  test-side literal in `helpers.mjs`, `projection.md` and `measure.py`'s comparison table. The
  drawn digest moves too, so the sheets print UNAPPROVED REVISION until `approval.lock` and
  `APPROVAL_COMMIT` are re-anchored — and the re-anchor is not an agent's to take on the ledger's
  say-so alone: the re-rendered sheet goes to Kabe for a one-glance redline approval, which is
  where the method says a redline ends. **Nothing is staged on that wall until it lands** — row 4's
  first backdrop is this one.
- **`null >= 0` is `true`**, so the guard meant to silence a doorway with no known "beyond" never
  fired and the far room drew 3.1× too large instead. A finite-number test now, with a throw rather
  than a silent fallback on a non-finite value.
- **The through-view filled a cross, not a rectangle** — the four corners of an opening stayed void,
  1.6 % of an opening on a facing the demo does not ship and 53 % with the destination 40 m away.
  Eight edge draws now, four of them corners.
- **The painted arm of the through-view had no subject and no case.** `study/N` is the only painting
  and it carries no doorway, so the branch could be deleted whole with the suite green. A
  `mechanisms.spec` case builds the state the product reaches the day a doorway facing is admitted —
  the baked painting bound to `study/E`, no leaf in the world — and `renderer.through_view_painted`
  is its ledger token.
- **§12.5's clauses never touched the one measured meta.** `geometry.spec` built its metas from
  `deriveMeta`; the file the page renders with was judged by none of them, and a critic set
  `calibration_px` to 999 and `focal_px` to 1500 with the suite green. That loop resolves through
  the validator's own three-tier `metaForFacing` now, and a measured meta answers to the measured
  band, its own calibration audit (the size is parsed out of `calibration_ref`'s sentence), and both
  derived fields.
- **The corners in §12.5 (ii) are found in the picture**, by a test-side re-implementation of §5's
  own rule, rather than read from the same typed literals as the scale.
- **`nearest_floor_m` had a second formula** — `eye / (1 − horizon_y)`, true only when the focal
  length equals the frame height — and wrote 2.2295 where the project's one definition gives 2.1994.
  Through `nearestFloorM` now.
- **Two staleness tests that did not exist**: the promoted meta must byte-equal a fresh run of
  `promote-backdrop.mjs` (which holds all fifteen of its fields at once — a critic edited four of
  them with the suite green), and `backdrops/baked.js` must byte-equal a fresh bake.
- **`measure.py` erased the ledger's own close-out.** `baked_in` and `status` are the hand's, not
  the script's, and are carried forward per facing across a re-measurement. Each entry names the
  clauses that apply to IT, and `commit` is null with the reason in the record rather than the prose
  string it carried.
- **The prompt lint had no test and no discrimination.** It has both: synthetic prompts prove each
  clause refuses what it names and passes what obeys it, and the corpus count is asserted (5 of 7
  contradict, 8 of 8 declare no anchor, 2 of 7 ask for an unmeasurable frame) rather than quoted.
  The committed prompts are grandfathered — they are the evidence for the rule, and the round they
  produced is its 0-of-7 baseline.
- **The page held its first frame for 19 seconds on a slow phone link.** 3.4 MB of base64 per wall,
  and nothing on the surface while it arrived. The bake encodes at q92 now — 525 kB, a mean channel
  delta of 1.77 of 255, printed into the generated file per painting — and first paint on the same
  rate-limited link is **3.7 s**. The PNG stays the promoted artifact and the flip test's subject;
  what ships to a browser is that encode of it. The remaining silence belongs to row 9's intro.
- **A closed approvals entry must cite a commit that exists.** Deleting the gate was caught;
  fabricating a verdict was not.
- **The phone assertion was the convenient viewpoint.** `scene.height > 100` passes at a size that
  leaves the painting unreadable; it is now the contain-fit the layout allows, with the 31 %-of-screen
  share stated as the look question it is.
- **The `key_dir` fork is CLOSED**, under blueprint §10's own recorded disposition and the
  Navigator's ruling of 2026-08-22: a facing whose MEASURED key defies UL rules its own staged
  sprites' light, as one more dimension of the variant manifest, and UL45 remains the default for a
  facing that is unmeasured or neutral-keyed. `study/N` measures L-BELOW — the hearth fire — so its
  sprite set generates fire-lit. `replicator/contract.json`'s `_backdrop_block_status` carries the
  fork rewritten as closed with the authority chain in it; nothing else in that file moved and its
  identity digest is unchanged.
- **Two comments that said the opposite of their code** — the through-view's account of destination
  entities (they ARE drawn, knowledge-filtered by the world), and a dead `worldFault` branch whose
  narration line could never be reached.

Findings recorded rather than fixed: the "never void" measurement clears its own threshold by about
1.1 luminance units of 255 (a change to `THROUGH_DIM` would flip the metric, and the geometric
clauses beside it are what carry the claim); two doorways deep the second opening is still drawn as
its dark fill; the measurement JSON still presents the superseded vanishing-point horizon beside the
ramp fit the promotion adopts; and in the empty painted world a screen-reader user hears nothing at
all on seven of eight facings, which is row 10's surface meeting row 9's silence and belongs to
neither of them alone.

### The camera A/B closed while this row was closing: B, the standing eye

[HUMAN, 2026-08-22]: **"B"** — `design/approvals.log`'s entry at `c900f66` carries it with its
grounds, interaction visibility over mood. `backdrops/source/study-N/cand-4-standing-eye.png` is
the frame that won.

**This row's promotion stands exactly as built** [Navigator, 2026-08-22]. It was designed
provisional against precisely this outcome and the promotion is a committed script, so the swap is
a re-run against a new candidate rather than a rewrite. What changes is the PRODUCTION RUN that
follows: the standing-eye wave regenerates the study and passage walls together with the manor's,
all against `cand-4` as the camera reference, and **no cand-3 candidate promotes** — that round is
recipe validation (does the scale-and-anchor discipline transfer?) rather than an admission gate.

**SUPERSEDED BY THE STANDING-EYE WAVE — read *The standing-eye wave* below.
The asset seat did not repaint against `cand-4`; it generated
`cand-5-reference`, which unites the approved painting's finish with the
standing-eye camera, and THAT frame is what the wave measured. Everything in
the paragraph below is row 21's account of the un-re-tuned `cand-4` run, kept
because its three readings are what the wave's first step answered — and it
answered them: re-tuned against `cand-5-reference`, the ruled ceiling-ramp
instrument resolves at a 0.30 px residual, the two rulers agree to 1.43 %, and
an eye height of 1.183 m WAS issued.**

**What the production run's first step is, and what the harness says when it is pointed at
`cand-4`.** Its measured eye height becomes `DRAWING_EYE_M`'s target, and the gate gains an
eye-height band around that measured value on the same ±3 % idiom the focal uses; the focal band
itself (1010 px) is eye-independent and stands. The harness was run over `cand-4` at the row's
close, with every detector window left where the cand-2 round put it — the un-re-tuned run this
project has a scar about, done deliberately and read as such. **NO EYE HEIGHT IS ISSUED**, and the
three readings that say why are the production run's starting point:

- **the ruled horizon instrument does not resolve.** The ceiling-ramp fit — ruled at row 20 over
  the vanishing-point vote — returns y 86 on `cand-4` against a ceiling line detected at y 120,
  where on the approved frame the same code returns 524.4 exactly.
- **the superseded instrument does resolve, and answers absurdly.** The vote puts the horizon at
  y 541, which with the fireplace ruler makes `cand-4`'s eye **0.99 m** — *lower* than the same
  instrument's reading of the low-eye frame it replaces (1.20 m). A standing-eye frame that
  measures shorter than the frame it stands in for is the measurement telling you it is measuring
  something else.
- **the two rulers straddle.** The fireplace opening is where it was — jambs at 342 and 554, 213 px
  of a ruled 0.90 m → **236.7 px/m**, a 1029 px lens at the drawn 4.35 m, **+1.9 %** and inside the
  band — while the wainscot rail measures 180 px above the floor against the approved room's 213, a
  20 % disagreement. The likely reading is that the camera is right and the joinery moved; a likely
  reading is not a measurement, and this is the WITHHELD class's own trigger.

The re-tune, the eye measurement and the band are the production run's first step, with the numbers
above as its starting point rather than its answer.

### The cand-3 round: the universal anchor, gated, and what it clocked

Blueprint §11 gained a ruling at this row — **the wainscot chair-rail stands at exactly 0.95 m
above the floor on every panelled wall in the manor** — so that being measurable is a property of
the WALL SPECIFICATION rather than of whichever feature a prompt happened to ask for, which is what
the WITHHELD class had been telling us. The seven walls were repainted under it as `cand-3`, and
`measure.py --round cand3` + `gate.py --round cand3` are that round's gate. **Nothing in it
promotes**, decided before the numbers were: Kabe's B routes every wall through the standing-eye
wave, so cand-3 is recipe validation.

Three things about the instrument are deliberate and are what make the table mean anything.
**One ruler** — the declared anchor and nothing else, because the cand-2 tier-1 rulers were read by
eye off cand-2 pixels and those coordinates are not measurements of another image. **Nothing
re-tuned** — every detector window is the cand-2 one, because the round's own question is whether
the recipe puts the features where the approved composition has them. **The anchor has to look like
itself** — a chair-rail is a moulding stack, a capping shadow above the rail's undercut, 0.082 m
apart on the approved frame; one line, or two a quarter-metre apart, is not a wainscot and the
reading is withheld rather than issued. The control holds: the approved frame through the cand-3
code returns its committed floor line (777) and rail (213 px above it) to the pixel.

The result: **0 of 7 admitted, the same as cand-2**, which is the one number strictly comparable
across the two rounds because the instruments differ on purpose. `study/E` and `study/W` measure
−7.5 % and −6.6 % — the camera still did not move as far as it was asked to, in the same direction
and by about the same amount. `hall/E` and `hall/W` paint one moulding line where the anchor is
two. `study/S` paints two 0.27 m apart. And `hall/N` and `hall/S` **declare the anchor and then
forbid the floor it is measured above**, so they are withheld a second time under the very rule
written to stop it — that cause is now `prompt_lint.py`'s third clause
(`row21:prompt.anchor_datum_forbidden`).

**The lint refused all seven compliant prompts on a comma, and that is the round's sharpest
finding about our own side.** Its `Gate anchor:` parser required the metres to follow one; the seat
wrote *"at exactly 0.95m above the floor, running the full wall"*; so the round meant to test the
rule was generated against a tool that rejected obedience to it, and the tool's 25-of-25 refusal
count read as discrimination when it was noise. **A gate that refuses compliant work teaches the
seat nothing**, and it is the failure mode nobody looks for because it produces no false green. The
parser reads the metres wherever they stand on the line now, and 5 of the 8 cand-3 prompts pass.

**So `prompt_lint.py` is still apparatus and has still not clocked as an improvement**, which is
production law clause 5's own verdict on it: the first-roll pass rate is unmoved at 0 of 7. What
the round did buy is a third named cause and a working parser, both cited in `misses.jsonl`, whose
entries now carry a `round` field — a run rewrites only its own round's lines and carries the
others through verbatim, because "the pass rate rising over time" is a claim about rounds beside
each other and a ledger that kept one round could not carry it.

### What round 4 changed: twelve guards that were not guarding anything

A scoped adversary was pointed at every check this row added or changed, with one instruction —
delete or weaken what each guards and confirm it goes red. Twelve did not, and the pattern across
them is worth more than the list: **five of the thirteen repairs the round before had made left the
next escape open.** The families:

- **Two of the row's three target clauses rested on nothing.** `misses.jsonl` — the production law's
  own artifact, required by the row text — was read by no test at all and could be deleted with the
  suite green. And `measure.py`, 1400 lines of it changed in this row, was executed by no test: a
  critic moved the CONTROL, the committed pixel values that void every verdict in a run when they
  shift, and nothing noticed. Both are derived now: the ledger's entry set, verdicts, kinds and
  deltas are taken from a live `gate.py` run and must agree with it, and each round's corpus must
  byte-equal a fresh `measure.py --round <r> --out <scratch>` (which is what `--out` is for, and
  what a round writing over another round's home made impossible before).
- **Every refusal in `promote-backdrop.mjs` was uncased** — all six, including round 3's own
  `_source_sha256` fix — because the only test that ran the tool promoted the one candidate that
  passes everything. There is a case per refusal now, each asserting the tool's own words.
- **A clause with several arms emits one token from one site**, so both completeness checks pass
  while a case exercises a single arm. `meta.building_fields` compared six fields and was cased on
  one; `meta.opening_rect` had four arms and was cased on one; `exit.opening_offscreen` refused four
  edges and was cased on one. `everyArm` in `guards.spec` asserts each arm trips the clause BY
  ITSELF.
- **A mechanism with no subject in either shipped world can be deleted whole.** The painted-opening
  arm of the promotion and the non-finite `beyond_m` throw both had none. The subjects are built now
  — `study/E` promoted in a scratch tree at a scale the band admits, and an opening whose meta says
  something that is not a distance.
- **A hand-typed list beside two derived ones.** Round 3 derived the world set from the tree in
  `fixtures.spec` and `guards.spec` and left `voice.spec`'s typed: a critic added a third world
  whose narration read *"Player entered room hall. Debug build 7."*, baked it, and the audit — the
  one check whose subject is what a player can be shown — never opened it.
- **A gate can lie in the other direction too.** Round 3 made an EMPTY `gate.py` stdout red; a
  WRONG one stayed green, and a critic had it print a WITHHELD facing as `FAIL -100.0%` — the exact
  confusion the WITHHELD class exists to prevent, since a FAIL is a fact about a painting and
  carries a re-ask. Two guards now catch it: the ledger must agree with the gate's verdicts, and
  both tables the batch quotes to Kabe are compared line for line with what the tool prints.

**And one product defect, found by looking rather than by mutating**: `?world=` was matched by an
unanchored pattern, so `?world=nav-manor.evil` booted the painted world and `?world=demo-study.evil`
the furnished one — a page booting something other than what it was asked for, which is the one
thing that paragraph in `index.html` says it must never do. The test written for it only ever asked
for ids made entirely of the characters the pattern's own class admits, so **the grammar was its own
alibi**. It reads to the end of the parameter now.

### Residue, named

1. **Seven walls are unadmitted and the world shows grid on them.** That is the materialization
   fiction doing what it says, and the README says so in the player's voice — but a room in two
   materials (fine oil realism on one wall, holodeck grid on three) is a LOOK, and the look is
   Kabe's. It is question 6 in the batch.
2. **The painted world is empty.** Nothing in it can be picked up, opened or refused, so the
   intention's *contact* and *occlusion chains* have no subject in the thing the link serves. The
   batch says so rather than letting an empty room read as a passing one.
3. **The near-field anchor is still missing.** Residue item 1 of row 20 stands: the nearest visible
   floor is 2.23 m on every facing and the near-surface device that would close *the camera has
   feet* is still forbidden by the depth bound. The first painted frame is where a human first asks
   "am I standing somewhere", and it has no near anchor in it.
4. **`backdrops/baked.js` is a second copy of the pixels**, 3.4 MB beside a 2.6 MB PNG, both
   committed to a public repository forever. The staleness test is the mitigation for their
   agreement; the size is the fork named above.
5. **CLOSED, AND EXECUTED: the camera A/B is answered — B, the standing eye** (`design/approvals.log`, 964188d), and the wave that carries it is *The standing-eye wave* below. The number this item left open — the measured eye height — is **1.183 m**, off `cand-5-reference` rather than `cand-4`.
   The promotion stands as built and `backdrops/study/N.png` is the last wall this project will
   ever stand at the low eye; the standing-eye wave supersedes it in the production run. What
   remains open is not the ruling but its number: `cand-4`'s measured eye height, which the
   un-re-tuned harness will not issue (above).
6. **`prompt_lint.py` is apparatus, and the next round has now clocked it: UNMOVED.** First-roll
   pass rate 0 of 7 at cand-2 and 0 of 7 at cand-3. Production law clause 5 presumes a change that
   moves neither accuracy nor speed is not an improvement, so this one has to argue for its life at
   the standing-eye wave or be removed. It gained a third clause and a parser that no longer
   refuses obedience, which is a reason to expect better and not evidence of it.
7. **The plan and the painting still disagree about the hearth, and the fix is allocated.** The
   number is held by test so it cannot drift; **row 22** is the execution row and its full cascade
   is written into its spec-list entry. Nothing is staged on the study's north wall until it lands.
8. **What the adversary found and this row did not fix**, each recorded rather than smoothed over:
   - **A human gate still retires on a sentence an agent can write.** `design/approvals.log`'s
     verdict column must be quoted, must not read as a placeholder, and must cite a commit that
     exists — but a plausible quotation closes the gate, and for the row-20 entry the same edit also
     switches off both of its batch cases. The ledger is a claim about a person and no check can
     make it true; what it buys is that the claim has to be made explicitly. The representation that
     would close it is the ledger-wiring work `design/plan-draft/approval.lock` already names.
   - **Three silent `return false` paths in `drawThroughOpening`** (no backdrops map, no destination
     entry, a `cameraDistance` throw) have no subject in either shipped world, so "never void" is
     conditional on none of them firing and nothing says so.
   - **`validator.spec`'s typed `MEASURED` px/m map is bound only through band membership**: a wrong
     value inside the band moves nothing. The corpus it copies is re-derived by the measurement
     staleness cases now, which is the stronger binding, and this copy should go to it.
   - **The three through-view ledger cases measure states no shipped world reaches** — a 900 px arch
     onto a room 12 m off, a fabricated three-room chain, a null `beyond_m`. They are genuinely red
     on deletion; their correctness is asserted against the test's own construction until row 15's
     manor makes those states ordinary.
   - **The prompt lint's clauses are phrase lists, one case per phrase — DEFERRED TO THE CLOCK, and
     the deferral is written where the fix would be** [Navigator ruling at the close]. Three gaps
     are recorded as `known_gaps_deferred_to_the_clock` inside every `baked_in` block that names
     `prompt_lint.py` in `design/plan-draft/measured/misses.jsonl`: every alternative in `RULERS`,
     `FORBIDS_ALL_FEATURES`, `FORBIDS_FLOOR` and `CORRECTION` can be deleted with one case still
     green; the datum clause is defeated by four ordinary paraphrases, one of which is the
     hall/N–hall/S failure wearing a *valid* anchor (a door-height anchor beside "NO floor line"
     trips nothing at all, though a door's height is measured from the floor); and the cand-3 corpus
     is linted by no test, so the "0 of 7, unmoved" clock claim has no reader. **The grounds are
     production law clause 5's own empiricism** — this lint is unclocked apparatus, we author the
     prompts it lints, and deepening apparatus before its first clock is polishing the thing the law
     says must first prove itself. **The trigger is in the ledger entries**: the standing-eye wave's
     first-roll pass rate disappointing, or any generation round showing a lint miss, promotes all
     three to a fix round.

### What round 5 changed: the half a human reads

Round 4 made the measurement executed rather than trusted; the adversary's next pass found that the
half a human READS was still unheld, and that is the family worth carrying forward:

- **A guard that reads only as far as the document it checks is a guard the document controls.**
  The batch's quoted gate table was compared by slicing the tool's output to the length of the
  quote, so DELETING the last row made the two agree — and Kabe would have been shown a gate table
  with a failing wall missing, by the guard written to stop a stale one. The comparison runs to the
  end of the tool's own table now and asserts the line counts match.
- **The ledger below its four checked fields was free text.** The ruler, its pixels, the scale and
  the re-ask arithmetic were all unheld: a critic renamed the ruler "moon", gave it 9999 px, and
  wrote "nonsense, px/m, whatever" as the correction, green. The `measured` block is compared to the
  round's own corpus JSON (it is a copy of it), and the correction is parsed back into numbers and
  checked against the gate's target — because "with delta re-asks" in the row's target IS that
  sentence. The header is read too, which it was not.
- **The marked frames answered to nothing.** Eight PNGs of every line the measurement used, which
  this file calls the answer to *"a ruler lying on nothing is visible to a human in one look and to
  no amount of JSON"* — deletable whole with the suite green, because the byte-compare filtered
  `.json` and `--out` sent the fresh ones elsewhere. They are byte-compared like the readings now.
- **`THROUGH_DIM` was guarded by a photograph.** 0.42 → 0.10, the dim effectively gone, and only the
  batch's pixel comparison went red — which any builder silences by re-capturing. It has a measured
  reader bound to the sentence Kabe reads: the batch says the room beyond is "dimmed to 58 % of its
  own brightness", that number is parsed out of his own document, and the render is measured against
  it in both directions. Measured at the opening's CENTRE, because the reveals are drawn over the
  far room undimmed and a mean over the whole aperture reads 69 %.
- **The completeness scan's scope was wrong three times, one level out each time** — a file list,
  then one directory, then two directories read non-recursively (a tool in `tools/lib/` and a lint
  in `design/plan-draft/` were both invisible). It walks `src/`, `tools/`, `replicator/` and
  `design/plan-draft/` to the bottom now. What is not walked is `tests/` and the design documents,
  and that exclusion is on a different axis from the hole: a test is not an emit site.
- **Two fields of an opening were typed by nothing.** `x/y/w/h` had four arms; `beyond_m` and
  `beyond_offset_m` — the two the through-view transform is computed from — had no clause, so a
  document whose depth is the string "eight point six" shipped and the renderer's own throw was the
  first thing to notice, at paint time, on the player's screen. `[row21:meta.opening_beyond]`, six
  arms, including the half-an-answer case: an opening that knows its depth must know its offset.
- **A promoted opening's vertical half was unasserted**, so the head and sill of a painted doorway
  could come from the projection while the meta declared `measured: true`.
- **A duplicate net was narrowed rather than widened.** `bake-fixtures.mjs` collected meta findings
  and refused on them, but the validator it runs a few lines later emits the same finding first — so
  no case could ever have been written for it. It is gone, and `fixtures.spec` holds the sentence
  instead: an unreadable promoted meta stops the bake, and a candidate under `backdrops/source/`
  never reaches the page.

### Residue the row closes with: the adversary's last pass, deferred to the clock

A final scoped pass at `62e8414` verified every fix of the two rounds before it — the marked-frame
byte-compare, the both-direction gate-table compare, the isolated `--out`, and the reasoning behind
deleting the bake's duplicate refusal (`metaForFacing` emits exactly one finding, and the validator
the bake runs re-resolves the same metas and emits it first, so the second refusal was unreachable).
It then found **nine more blockers, every one the same family one layer deeper**, and the Navigator
ruled the boundary at the row's close: one recheck, then close, because the founding-law-critical
surface — the two gate tables, the marked frames, and everything a human is shown in the direction
gates — is now genuinely held, and **what remains is apparatus self-consistency, which is exactly
what the clock-deferral mechanism exists for**.

They are recorded, verbatim and machine-readable, as `_record: "apparatus_gap"` lines in
`design/plan-draft/measured/misses.jsonl`, each with the grounds and this promotion trigger: **they
fix as a batch the first time the ledger machinery is load-bearing for a real decision — the
standing-eye wave's first re-ask cycle — and S2 and S3 are named FIRST in that batch, because a
deferral ledger nobody reads is the one irony the production law cannot carry.** In short:

- **S1** — the re-ask's TARGET scale is a free number as long as the correction sentence agrees with
  it: nothing anchors `target.target_px_per_m_at_wall` to the gate's own printed TARGET column, so
  the asset seat can be sent to 300 px/m where the gate wants 168.3 with every assertion agreeing
  with itself.
- **S2** — the deferral records themselves are unread: deleting `baked_in` from every entry, and
  with it all seven deferral blocks, leaves the suite green.
- **S3** — `status` can be flipped to `closed` with no cause baked in, which is production law
  clause 3's whole subject.
- **S4** — five more ledger fields are free text, `rulers[]` among them — the list this file calls
  *"what says whether a RE-TUNED window is looking at the feature it names"* — and it can be
  deleted whole.
- **S5** — the token scan's roots miss `design/batches/row21-promotion/capture.mjs`, a script the
  suite itself executes. Fourth level of the same hole.
- **S6** — the batch's evidence directory may hold marked frames no run produced (the compare is
  one-directional).
- **S7** — `SUMMARY.md` is closed both ways in section A only; the tool prints rows in sections B–G
  that a reader takes as measured.
- **S8** — `staging.pair_half_missing`, minted this round, has four arms and one case, and did not
  use the `everyArm` helper this round built for exactly that.
- **S9** — the batch's prose numbers still have no reader: the 92,061-pixel void count the row's
  "never void" headline rests on, and the lint's own 5-of-8 discrimination count. The cand-3 corpus
  is linted by no test, so that sentence has no way to be true or false.
- **S10** (not blocking) — a tightening that would REFUSE a legal document passes unnoticed:
  `beyond_offset_m` is signed (a doorway left of the view axis is negative) and no shipped opening
  exercises the permission. The same shape as the comma that refused seven compliant prompts.
- **S11** (the builder's own, examined by no critic) — `index.html` decodes `?world=` inside a try
  whose catch leaves the DEFAULT world standing, so a malformed escape boots the painted world in
  silence. The same class as the prefix match that was fixed.

**One thing was fixed rather than recorded, because the record depended on it**: `write_misses`
wiped every `apparatus_gap` line on the first re-measurement — round 2's own finding (a generator
destroying the law's evidence) arriving one record type later. Every record that is not a miss or
the header is carried through verbatim now.

### What row 21 hands on, and to whom

The spec list is the one home of targets and a closing row may not edit another row's text, so the
hand-offs live here.

- **Row 22 — the plan amends to the painting.** Allocated at this close with its full cascade in
  its own row text. It is the first thing the asset lane needs, because nothing may be staged on
  the study's north wall until the carrier and `study/S`'s standpoint have moved.
- **The production run (row 4's bulk step) inherits three things.** The standing-eye wave — every
  wall regenerated against `cand-4-standing-eye`, which supersedes the promoted low-eye `study/N`.
  The **re-tune** of `measure.py`'s detector windows against that frame, which is its first step
  and without which no eye height can be issued (above). And the **encode fork**: eight facings of
  q92 JPEG data: URI is the lever, and taking it means deciding whether the flip test may judge a
  picture the repository does not hold.
- **The asset seat inherits a lint that now discriminates** and three named causes, one of which
  (an anchor declared above a floor the frame forbids) it has already committed twice. The prompt
  sheets for the wave are written against `prompt_lint.py`, and a prompt it refuses does not go out.
- **Row 4's sprite lane inherits `key_dir: "L-BELOW"` on `study/N`** — that facing's sprites
  generate fire-lit, per §10's own disposition — and the two decomposed qualities the painted world
  cannot exercise at all, *contact* and *occlusion chains*, which have no subject until objects
  land.
- **Row 15 inherited the through-view's named limits, and discharged the third**: the three
  fabricated ledger cases now stand beside a manor where fifty-five doorways exercise the device for
  real, and `manor.spec` asserts that none of `drawThroughOpening`'s three silent `return false`
  paths fires anywhere in the building. What still stands: nothing is drawn two doorways deep, and the
  destination's parallax is the destination camera's. Both are consequences of pasting a frame
  rather than re-projecting a room, and the manor is where a second doorway in view becomes
  ordinary — the ledger case for the recursion stop is built on exactly that world.
- **The batch waits on Kabe.** `design/batches/row21-promotion/` stays in the tree with its entry
  in `design/approvals.log` reading AWAITING, and the row-20 batch rides with it; `plan.spec`
  requires both to be there while their entries are open. The row's own done clause is delivery to
  the Navigator, so the close does not pretend to hold his word.

## The standing-eye wave — the camera the manor is painted at now

**[HUMAN 2026-08-22, `design/approvals.log` at 964188d]: "B".** The camera A/B
closed on the standing eye, and that ruling is what this section records the
execution of. It supersedes row 21's promoted low-eye `study/N` and it moves
four numbers this whole project is built on.

### The reference is a frame, and it is READ rather than admitted

`design/plan-draft/measured/measure.py --round cand5ref` measures
`backdrops/source/study-N/cand-5-reference.png` and writes ONE file,
`measured/cand5ref/study-N.json`, whose `_reference_set` block is the standing
camera:

```
px_per_m_at_wall  188.421      anchor: the chair-rail, 179 px above the floor at a ruled 0.95 m
implied focal     819.6 px     at study/N's drawn 4.35 m standpoint
eye height        1.183 m      floor line 749 minus the ceiling-ramp horizon 526.1, over 188.421
horizon           y 526.1      ceiling-ramp intersection, residual 0.30 / 0.29 px over 61 columns a side
floor line        y 749        the darkest row of the shadow seam at the skirting foot
corners           188 .. 1351
storey            3.349 m      PAINTED, against the plan's ruled 2.80 — warn tier
```

There is no band over it. A reference is not a candidate.

**What carries it, and nothing types it twice**: `src/groundplane.js`'s
`DRAWING_EYE_M` (1.183) and `HORIZON_Y` (526.1/1024);
`tools/validate-fixtures.mjs`'s `MEASURED_REFERENCE_PX` (819.6) and
`MEASURED_BAND` (0.08); `gate.py --round cand6`, which **loads the reference
off that JSON rather than stating it**; and the three promoted metas.
`validator.spec` binds the band to `gate.py`'s `BAND6` and the reference to the
JSON, so widening one alone goes red.

### The eye rose 0.095 m and the LENS widened 20 %, and that is the headline

Row 20 measured 1.08775 m and a 1010 px lens off the low-eye frame. The
standing-eye frame measures **1.183 m and 819.6 px**. The eye moved 8.8 %; the
focal length moved **−19 %**. So the frame shows more floor because the
generator answered "standing adult eye" with a WIDER LENS, not with a higher
camera — the horizon sits at 35.3 % of the painted wall's height where the
low-eye frame put it at 36.3 %. Measured against the ruled 2.80 m storey rather
than the painted 3.35, the camera is standing at **0.99 m**.

**The consequence to expect and not be surprised by:** a painted facing now
draws at 819.6 px where an unpainted one draws at the ruled 1024 px — 20 %,
where row 21's two-lenses-in-one-room note recorded 1.4 %. It closes when the
manor is wholly painted, and until then it is the largest divergence this
project carries. §10's ruled 24 mm lens and `replicator/contract.json`'s
`camera.focal_mm` are UNTOUCHED: that field is [HUMAN] and moving it would
invalidate the contract identity digest and the corpus record with it.

### The adopted ruler is the anchor the prompt declares, and only it

Every cand-6 prompt and the reference's own carry one `Measurement anchor:`
line — blueprint §11's universal wainscot chair-rail at 0.95 m — so the camera
verdict is computed from that line on all eight frames. One instrument across
the corpus AND the reference, because a reference read with a different ruler
puts that instrument's offset into every delta in the table.

**Every other ruled feature is measured, printed, and votes on nothing.** They
are in each document's `_cross_rulers` with their own implied focal length and
their disagreement with the anchor. On the reference the fireplace opening
(172 px at a ruled 0.90 m → 191.11 px/m) agrees with the chair-rail to
**1.43 %**, which is the cross-check that says the anchor is looking at what it
names. On `study/E` the door opening reads 224.0 px/m from its head and 188.0
from its jambs against the chair-rail's 204.21 — an 18 % span — because the
painting drew a 0.92 × 2.19 m door against a ruled 1.00 × 2.00. That is a fact
about **the room the painting depicts**, which the Navigator ruled WARN-TIER on
2026-08-22, and folding it into the camera verdict would fail a wall for its
joinery. Under the cand-2 straddle rule `study/E` would be WITHHELD instead;
`_ruler_policy.counterfactual` in every document says so, because the policy was
written after the frames were measured and that is the honest form of the
admission.

### The band is ±8 % on BOTH halves, and it is an [AI] licence with a clock

A cand-6 wall is admitted when its implied focal length AND its eye height land
within ±8 % of the reference's. Grounds: 8 % of a focal length is below the
just-noticeable difference for a focal-length change across a film cut, which is
the perceptual quantity the band stands in for — a player turning between two
walls of one room is exactly a cut. The cand-2 band was ±3 %, twice the residual
between the approved painting and the ruled lens, and it admitted 0 of 7 twice.

**The clock is a record in `misses.jsonl`** (`_record: "clock"`), carrying the
rate at every round and the trigger: cand-2 **0 of 7**, cand-3 **0 of 7**,
cand-6 **2 of 7**. *If a wave admits ~0 again the band and the approach are
re-examined and NOT widened a second time* — a second widening would be the
corpus moving the law, which `gate.py`'s own header refuses. `plan.spec` reads
the clock, so a licence without one goes red.

### The gate table, and what it refused

```
facing      standpt       px/m     TARGET   focal px     eye m    dfocal      deye   verdict
hall/E         6.00     171.58      136.6       1030    1.2653    +25.6%     +7.0%   FAIL
hall/N         2.15     301.05      381.2        647         -    -21.0%         -   FAIL
hall/S         2.15          -      381.2          -         -         -         -   WITHHELD
hall/W         6.00     161.05      136.6        966    1.3343    +17.9%    +12.8%   FAIL
study/E        4.09     204.21      200.4        835    1.1380     +1.9%     -3.8%   PASS
study/S        3.85          -      212.9          -         -         -         -   WITHHELD
study/W        4.09     192.63      200.4        788    1.1488     -3.9%     -2.9%   PASS
```

**A FAIL is issued even where the eye half could not be read** (`hall/N`, which
paints no corners and so has no ceiling ramp): the camera is wrong either way
and the re-ask is the same one. A focal length INSIDE the band with no eye
height is a WITHHELD, because admission is on both halves and half a
measurement admits nothing.

**Both WITHHELDs are the same cause and it is the anchor, not the camera.**
`study/S` paints a window-seat sill 0.68 m above the floor where the chair-rail
is ruled at 0.95, and the two moulding lines the detector finds stand 0.245 m
apart; `hall/S` paints one moulding line where a wainscot is two (0.044 m).
Neither is a wainscot, so no scale is issued and no re-ask is sent against a
number nobody could measure. Their cross-rulers are recorded: `study/S`'s three
window bays measure 221.2 / 233.2 / 220.5 px at a ruled 0.90 m — a 5.7 % spread
on three features one prompt ruled equal — implying 250.0 px/m and a 962 px lens,
+17.4 %.

**What the round clocked, and what it does not prove.** The first-roll pass rate
moved 0 → 0 → 2 of 7. Three things changed in one step — the anchor discipline,
the camera reference and the band — so the movement cannot be attributed to
`prompt_lint.py` alone, and the `clock` record says so in as many words. What
did visibly land: the two facings that had declared an anchor above a floor
their own prompt forbade now paint a floor line, which is the lint's third
clause taking effect in the corpus.

### Every detector window is RE-TUNED, which is the opposite of cand-3

`CFG_WAVE` in `measure.py` holds them, per facing, with the rule that placed
them: the module band starts BELOW the facing's own feature (a window head, a
tapestry's frame, a fireplace mantel) so the first contiguous dark group
scanning down is the chair-rail's capping and not that feature's shadow, and
the columns are the wall-plane columns clear of it. The cand-3 round refused to
re-tune on purpose — its question was whether the recipe puts a feature where
the approved composition has it — and this round's question is what the camera
IS, which cannot be read through a window pointed at where a feature used to be.

`module_in_bands` is `panelling_module`'s rule over column BANDS instead of one
span, because `hall/W`'s end wall is 490–630 and 890–1050 with a lit doorway
between them and a single span puts the doorway's own light into the band
median.

**The control is the row-21 promotion frame through this round's code**: the
reference is new and cannot be its own control, so `backdrops/source/study-N/
cand-2.png` goes through `pick_floor` and `module_in_bands` every run and must
return floor line 777 and the chair rail 213 px above it. If it moves, the
reference set is VOID and the run says so.

### Two walls are promoted; the third is ADMITTED AND HELD, and that is a ruling

`study/N` ← `cand-5-reference` and `study/W` ← `cand-6`, through
`tools/promote-backdrop.mjs`, which gained `--round <dir>` so it can read a
round's own directory (`measured/` itself stays the default and is still the
cand-2 round's home) and a `measured_round` field in the meta so a promotion
can be RE-DERIVED from the meta alone — `fixtures.spec`'s staleness case runs
the tool again and byte-compares, and without the round it read the cand-2
corpus, a different painting's numbers.

**`study/E` passed the gate at +1.9 % focal and −3.8 % eye and is NOT in the
world.** It was promoted, the consequence was looked at, and the promotion was
reversed. The reason is the second carrier disagreement below: the painting
puts the study's doorway **dead centre of frame** and the approved plan puts it
**1.11 m to the right**, and `apertures()` resolves a facing that has a staged
LEAF through the leaf's placement rectangle — which is authored off the plan.
So the furnished world cut its hole at x 942–1126 while the painting drew its
door at 673–860: a hole in the paint beside a painted door that does not open,
which is §11's *"the painted opening must coincide with the click target"*
false by 1.11 m. Three tests found it from three directions (the through-view
transform, the doorway's own darkness, the walkthrough's open-door check) and
none of them could have if the wall had not been promoted.

**What it is NOT is a camera failure**, and the distinction matters for the
re-ask: nothing about `study/E`'s camera is wrong. What is wrong is that two
approved documents disagree about where a door is, and blueprint §5 makes the
painting the geometric authority — so **the plan is the document that moves**,
exactly as row 22 already rules for the hearth. `study/E` promotes the day that
row lands, by re-running the tool. Nothing else about it changes.

**`study/E` also exposed a gap before it came back out**, and the fix stands:
it is the first painted facing with a doorway in it, so it is the first meta a
promotion has ever written an opening into — the only promoted wall until now
being the study's hearth wall. Promoted against row 15's in-flight
`meta.opening_kind` clause, the bake refused it: the projection emitted an
opening's `kind` and the promotion dropped it. `promote-backdrop.mjs` carries
the field across now, like the two `beyond_*` metres beside it. Row 15 is not
in this commit, so the key is absent from every meta written here exactly as it
was before; the line is what makes the two agree the day that row lands.

**The carrier disagreements the promotion prints**: the plan centres the
study's chimney breast at 772.7 px and the painting puts its fireplace at
464.5 — **1.64 m apart**, where row 21 measured 1.41 m against the low-eye
frame, so **row 22's cascade grew rather than shrank**. And `op13`, the
study↔passage doorway, 1.11 m — the one above. `geometry.spec` pins both per
facing, by kind, so neither can move unnoticed.

### What the wave hands on

- **`study/E` is admitted and waiting on row 22.** It is the cheapest wall in
  the manor to land: the painting is done and gated, and what it needs is a
  plan amendment a human has to redline.
- **Four walls re-ask**, with their deltas and their target scales in
  `misses.jsonl`: `hall/E` +25.6 %, `hall/W` +17.9 %, `hall/N` −21.0 %, and
  `study/S` +17.4 % from its bays (recorded as a cross-ruler, since its verdict
  is WITHHELD). The corridor pair are the interesting ones — both drew their end
  wall too LARGE, in the same direction and by a similar amount, which is the
  same signature the study pair showed at cand-2 and cand-3 in the other
  direction.
- **Two walls need their anchor drawn before they can be gated at all**:
  `study/S` and `hall/S`. The re-ask is not a camera re-ask and must not be sent
  as one.
- **The plan/painting doorway disagreement joins the hearth in row 22's
  cascade.**
- **The two-lens divergence is 20 % now**, not 1.4 %, and it is the biggest
  open question this wave raises for the Navigator: either the manor finishes
  painting at 819.6 px and the ruled 24 mm lens becomes a generation-side
  fiction, or the wave re-asks every wall against the ruled 1024 px and the
  reference is regenerated. That fork is not an agent's.
## The manor walkable (rows 15 and 19) — twenty-two rooms, and the two other ways through a building

**The navigation world is the whole manor now.** `fixtures/nav-manor/` holds 22 locations × 4
facings and **55 exits**, projected from the same `fixtures/demo-study/plan.json` through its
`plan.ref`. Nothing is staged in it: it is the manor with nothing in it, which is what the bare link
serves. The furnished demo world at `?world=demo-study` is untouched — §12's acceptance is two
furnished rooms and the row text says so.

### What an exit's `via` names, and where that lookup lives

Row 21 made a doorway a fact about the building carried by the facing's meta, and matched an exit to
it by the entity that fills it. Exactly ONE of the manor's 26 openings carries an `entity` (`op13` →
`door1`), and neither of its stairs ever will, so 24 door openings, the court mouth and both flights
were unaddressable. Giving every opening an `entity` was refused: `openings` is inside
`draw_plan.py`'s `DRAWN_KEYS`, so 25 new fields move the drawn digest of the drawing Kabe approved
and demand a human redline for a change no human asked for.

So an exit names the thing it passes through, and a hole in a wall has a name of its own.
`groundplane.openingFor(meta, via)` is the ONE home of the rule, resolving in this order and no
other: an opening/threshold/flight whose `via` equals it (a leaf's id), then one whose **`id`**
equals it (the plan's own name). The renderer and the fixture validator both call it;
`validator.spec` **displaces it at runtime** and requires the aperture list AND the validator's
verdict to move with it, which is the binding row 12 had to build for `placeHost` after "imports the
scale functions and re-derives the layer above them" satisfied a row's letter and defeated it.

`crossCheckWorld` in `tools/validate-plan.mjs` is **not** a second implementation and must not be
read as one: `openingFor` resolves a META (scene pixels, one facing); `crossCheckWorld` resolves the
PLAN (metres, both sides of an opening). Two documents, two questions, and `plan.spec` asserts they
agree on the shipped corpus.

**The cost, chosen rather than inherited.** `world.json` — the home of topology truth, and the
document §4b item 11 says a host emits over the wire — cannot now be resolved without the plan
revision that names `op07`. The alternative, an exit naming only its two rooms with the opening
derived, was rejected because two rooms can share more than one opening (a solver-authored plan
will) and the derivation would then live in the renderer instead of in the document. The coupling is
one-directional: a rename is caught by `[row21:exit.via_unfilled]`.

### A stair is a fact about the building, and the grid draws the flight

`deriveMeta` emits `meta.stairs[]` for every flight whose room is this one and whose travel axis is
this facing — `up` out of the lower room (`joins[0]`), `down` out of the upper. Every field's
source: `id`, `treads` and the run/width extents from `plan.stairs[]`; `rise_m` from the LOWER
room's floor's `storey_height_m`, one definition true from both ends; `u0/u1` and
`depth_near_m/depth_far_m` the plan rect in the view's own terms; `x/y/w/h`, `poly`, `floor_poly`
and `well_poly` those metres projected. **The named limit**: the plan carries no vertical datum, so
`rise_m` is a storey height and not a measured rise — floor structure is unmodelled, exactly as
`treads` is checked against a 10–30 band because there is no rise to check it against.

**The projection of a raised point is new camera math and it has one home**: `groundplane.yAtHeight
(depthM, heightM, meta)` = `yAtScale(scaleAtDepth(d)) − h·scaleAtDepth(d)`, which under the pinned
lens is `horizon + (eye − h)·f/d`. Everything before this row sat on the ground: `yAtDepth` is the
floor, and a `wall_mounted` object's height is read at WALL scale. `manor.spec` predicts every
tread's y test-side from the plan's own numbers and measures it off the render — §12.5 (v)'s own
shape, pixels against arithmetic — and `guards.spec`'s `renderer.stair_flight` case removes the
drawing and watches the ink go.

**Its consequence, and the row's first plan guessed it backwards**: a tread ABOVE eye height draws
ABOVE the horizon, and the spacing between equal steps WIDENS toward the top. A staircase painted
flat on the floor does the opposite, and "the top treads are a few pixels apart" was that mistake
written down. The test asserts both halves.

**Two things are drawn and they answer two different views.** The footprint on the FLOOR is the
flight's own plan position — the well seen from above, the ground under the steps seen from below —
and it is all that survives on a descending flight: from `stair_landing/S` every one of its visible
steps draws below y 1399 on a 1024 px canvas, and only the well it opens in the floor is in the
picture. The tread NOSES are the flight itself; on `great_stair_hall/N` they run from the frame
bottom to y ≈ 174.

**A flight does not run into an unbroken ceiling.** That top tread lands ~13 px above this room's
ceiling line, so without a well the picture would show a staircase disappearing into a plane the
document has no aperture in — the inverse of "never void", one storey up. The plan cannot express a
floor opening and this row may not add a field to it, so the well is DERIVED: the flight's footprint
lifted to the storey height, and the ceiling's line work (its wall-ceiling line, junctions, fan and
transverse set) is clipped out of it with an even-odd path. A stairwell is a hole in the ceiling, and
the ceiling is line work, so the hole costs one clip and no new appearance.

**`up`/`down` are anchored to the drawing as far as a plan view can anchor them.**
`[row15:plan.stair_directions]` requires the flight rect's LONGER axis to be the axis they name —
the run of a flight is the direction it travels, and that is drawn content. What cannot be anchored
is which END is the top, because the two rooms a flight joins are stacked and have identical rects.
Named, not discovered. Both shipped flights pass: `great_stair` runs 4.8 m N–S against 1.6 m across
with `up: "N"`; `back_stair_flight` 4.6 m E–W against 1.1 m with `up: "E"`.

**A flight IS an aperture**, so the hit region, the hover halo, the page's `go` resolver and row 10's
keyboard control read one list. Its hit region is its OUTLINE, not its bounding box: a flight is a
quad on a receding plane and a rectangle round it answers "climb the stair" for a click on the bare
floor beside it — the overshoot this resolver has been wrong in before. `apertures` carries `poly`
and `index.html`'s `resolve` tests the point inside it.

**A flight appears on one facing of its room and on no other**, which is row 11's omission census
gaining its largest member. It is in the census and in the batch, and multi-facing presence for
building fabric is §4b item 9's.

### An open threshold is the absence of a wall, and it is walkable

`op_court_mouth` (`kind: "open_edge"`, 20.4 m) is the only way between the entrance approach and the
entrance court, so without it one plan room is unreachable. `meta.openings` entries carry
`kind: "door" | "threshold"` (`[row15:meta.opening_kind]`), because the renderer's two branches are
opposites and a missing kind would take the door branch and cut a jamb into open ground.

**The rectangle is the ground beyond the mouth**: everything past a threshold lies on the ground
plane, and on a level camera the ground plane runs from the threshold's own line up to the horizon
and no further. So the rect is the mouth's width at the mouth's own distance, from the horizon down
to the ground at the mouth — 1068 × 57 px on `entrance_approach/N`, full-width × 165 px on
`entrance_court/S`. No constant and no cap chosen by hand.

**One mark, and it is a line on the ground.** Law (b) forbids an invented enclosure where no
building stands, so there is no jamb, no reveal, no soffit and no fill — but a 20.4 m `go` target on
featureless ground is the same defect the flights are drawn to avoid. What the law permits is a line
on the ground, which the grid already rules every half metre, so the threshold draws its own: the
line where this space ends and the next begins, at the position the plan holds. **On the approach's
side it is coincident with the wall-floor line** (the mouth stands on that facing's own wall line),
so the mark there is the floor line and the two band ends beside it; on the court's side the mouth is
6.75 m in front of a far line 26.75 m off and the line is the only thing that draws it. The ledger
case measures the court's side for that reason.

**No through-view, stated as a choice**: what lies beyond an outdoor mouth is a vista, and blueprint
§4b ruling (1) gives the vista to a generated backdrop; a frame pasted into the gap would make an
[AI] appearance the established look. `beyond_m: null` is how the meta says so.

**`apertures` inverts the band test for it.** A doorway needs a band to be a hole in; a threshold
needs the absence of one, or it is a way through a standing wall. One law, two directions —
`spannedByBand` and `crossesAnyBand`.

### What the world owes the plan, and the one way through no standpoint can see

Row 12's cross-check binds every exit the world names to the plan and says nothing about an opening
the plan DRAWS and the world never opens. Two clauses close that:

- `[row15:exit.opening_unwalked]` — an opening or a flight must be walkable in BOTH directions
  whenever the world names BOTH rooms it joins. The demo world names two of the manor's rooms and
  stays green as a consequence of that rule rather than by an exception carved for it.
- `[row15:world.rooms_unreachable]` — a breadth-first walk from the boot viewstate reaches every
  room the world names. Connectivity is not implied by the clause above.

**The exemption is computed, not carved.** `waysThrough` in `tools/plan-projection.mjs` is the one
home of both lists, and a way whose opening falls WHOLLY off the frame from the standpoint that
would view it is exempt — because `[row21:exit.opening_offscreen]` refuses a `go` target nobody can
reach, and requiring an exit through it would force that clause to be widened. The manor has exactly
one: **`op14`, `hall → kitchen`**. The cross passage is 8.00 m long, the pinned lens shows 3.2 m of
it from the drawn standpoint, and the kitchen's door lands 185 px past the right edge. So the manor
has 55 exits and not 56, the kitchen is entered from the entrance court instead, and the bake prints
the exemption as a plan warning every time. §4b item 9's multi-standpoint rooms are its fix and they
are drawn content.

**The reverse direction is unaffected**: `kitchen/N` sees the same opening at 476 px/m and
`door_kitchen_hall` walks. A passage that works one way and not the other is ugly and it is honest —
from the middle of the passage you cannot see that door.

### Reachability is a hand, not a graph

`world.rooms_unreachable` is satisfied by connectivity while a phone player cannot hit a door.
Measured at 390×844 over all 55 exits: **29 are under the 44 CSS px platform minimum**, 10 under 24,
and the narrowest is 17 × 34 — the entrance court's flanks, whose standpoint stands 15.30 m off its
own wall. Three things follow and none of them is a widened tolerance:

1. **The pointing tolerance ring reaches an aperture.** §7's amendment is "a widening tolerance ring
   for targets too small to hit exactly", and `resolve` applied it to takeables and to a leaf but
   never to an opening. It applies to any aperture now, LAST of all so it eats nothing, and among
   candidates the SMALLEST wins so a 20 m court mouth cannot claim the margin round a small door.
2. **The worst case is pinned** in `manor.spec`, per exit and at the phone width, in absolute terms.
3. **The cause is Kabe's.** `standpoint_stand_back` has no cap; the 88 distances run 2.15 m to
   26.75 m, median 6.60, with 11 over 12 m and 10 over 15 m. The distribution is in the batch.

### The double-click echo guard is armed by a CLICK now, not by a travel

Found by the manor's own walkthrough, which is the first route that drives the keyboard and the
pointer one after the other: `lastGo` was set inside `dispatch` on ANY successful `go`, so pressing
Enter on a go-control and then clicking a doorway within 400 ms had the click silently swallowed — a
pointer guard eating a gesture no pointer made. `dispatch` clears the window for every intent (which
is what "any other intent ends it" always meant); the canvas click handler arms it after a click that
actually travelled. The guard's own cost is unchanged and is now measured rather than assumed: two
doorway clicks inside 400 ms are one gesture, and `nav-walkthrough`'s manor route waits the window
out between click legs because a test that clicks its way round a manor as fast as the harness will
take it is not a player.

### Row 19 — carrier clearance completed, and where each clause lives

- `[row19:plan.object_clear_of_standpoints]` — a footprint covering any standpoint of its own room.
  **The artifact critic's own construction**, and the reason a clean-validated plan once returned
  `scale_px_per_m: -1152`.
- `[row19:plan.object_clear_of_thresholds]` — a footprint in a door's or an open edge's own rect. A
  doorway is floor a player crosses.
- `[row19:plan.object_projects_finitely]` — **in `projectPlacement`, at the site that produces the
  number**, not beside the document. `-1152` is FINITE, so the row's own words are narrower than the
  defect they cite; the bound is finite AND positive. A plan-side version is either vacuous or wrong
  on the approved corpus: the study's standpoints stand the viewer LEVEL with the desk and the chair,
  off to one side and out of frame, so those two footprints straddle the camera depth on facings
  nobody projects them onto. A clause refusing that would refuse the approved plan; one narrowed to
  objects across the viewing axis is unreachable, because an object across the axis at camera depth
  necessarily covers the standpoint and the clause above fires first.
- `[row19:staging.wall_mounted_over_storey]` — `v` plus the record's own height above the facing's
  declared storey. **The critic's second construction** — a 2.0 m door in a 1.85 m room.
- `[row19:meta.opening_over_storey]` — the same bound on the building: a door opening's ruled 2.00 m
  head above a floor whose `storey_height_m` is less than that.

**Two of the five still have no subject in either shipped world** and it is said plainly rather than
counted as manor coverage: clause 4 needs staging (the nav world has none; the demo world's door is
2.00 m in a 2.80 m storey) and clause 5 needs a floor under 2.00 m. Their evidence is a doctored
document plus a boundary case.

**PRECEDENCE, written before the ledger cases were constructed**, extending row 20's rule that a
standpoint in masonry takes precedence over the branch and placement clauses. One object can be in a
hearth ON a standpoint straddling a threshold, and the ledger requires each case to trip its clause
and nothing else — so without a stated order the cases get built by picking constructions that
happen not to collide, which is the author proving the case he wrote:

> `plan.standpoint_clear` → `object_clear_of_standpoints` → `object_clear_of_carriers` →
> `object_clear_of_stairs` → `object_clear_of_thresholds` → `objects_do_not_share_floor`

The first fault is the one that explains the rest.

**`facingsContaining` gained the baseline test**, which is where row 19's finding lands on the
shipped corpus: §4b item 9's own words are "an object belongs to every facing whose view CONTAINS
it", and an object the viewer stands level with belongs to no picture from that standpoint however
much of its footprint overlaps the band. Without it the variant manifest would have asked row 4 for
a chair at −3413 px/m. `planWarnings` counts the excluded pairs — `desk1` on `study/W`, `chair1` on
`study/S` — so the exclusion is printed rather than silent.

### What the manor's own tests hold (`tests/playwright/manor.spec.mjs`)

Every claim is per facing over all 88, and its expected side comes from OUTSIDE the derivation it
checks — `design/plan-draft/standpoints.tsv`, the sheet Kabe signed, which `plan.spec`
byte-compares against the approval commit. Typing 88 rows of literals into `helpers.mjs` would be a
second copy of a fact this project already keeps once.

- every derived meta's distance, width and type against the approved sheet, and the ruled lens on
  all 88;
- **the omission census per facing**, keyed by facing rather than totalled: a total is satisfied by
  the right numbers over the wrong walls and cannot say which room went blank, which is the
  weakening row 11 paid for;
- **law (b) rendered on every facing, not sampled** — the document-side check has been per facing
  since row 20's round 4 found it gated on the ROOM, and sampling the rendered half would put that
  shape straight back. Read as a CONTRAST rather than against a colour, because the frame-wide key
  falloff multiplies every base tone: where the meta holds a band the wall is measurably brighter
  than the gap beside it, an open facing's sky is darker than its ground, and a corner column is
  drawn where the meta says one is and nowhere else;
- **the `+` junction guard manor-wide**, whose MEMBERSHIP is pinned — not "there are warnings" but
  these eight and no others (below);
- the ways through and the one exemption;
- the flight's treads predicted and measured;
- never-void through all 55 doorways, with the open-destination exemption stated;
- **"leave a room and return"** measured where it can fail: in `nav-manor` — no entities, empty
  knowledge, a viewstate of exactly `{location, facing}` — a hash identity across a round trip
  cannot fail and is §12.2 restated. So it runs in a staged tree carrying the demo world's entities
  and staging merged into the manor's topology, walks eighteen exits across both floors, and asserts
  that the CHANGED state survives: the door left open is open, and the picture of the room it stands
  in is the picture it was;
- **§12.8's switches counted honestly**: `tint`, `shadows`, `parts` and `part_t` are per-entity and
  produce an identical picture on an empty facing, so what discriminates on a stair, a threshold or
  an open facing is `no_backdrop` and `backdrop_only` — two, not six.

### The `+` junction guard finds eight, and they are Kabe's to rule

`garden_room/E,W` and `closet_chamber/E,W` at 64 %, `entrance_court/E,W` at 61 %,
`privy_garden/E,W` at 76 % — every one a narrow room viewed along its long axis from a standpoint
the approved drawing places. A WARNING, on this document's own precedent: a validator that refused
them would refuse the plan Kabe signed, and one that could not see them is why nobody would find
them. Printed by the bake, carried into `projection.md` §10, batched.

### Residue, named

1. **An outdoor wall has no top.** `storeyHeight` returns null for an `open`-typed room, so the
   privy garden's and the entrance court's walls draw from the floor line to the frame edge with
   corner verticals to match. The plan holds no outdoor wall height and adding one is a DRAWN field.
   The row renders what the document holds and puts a walled-garden facing in the batch as its own
   question. Under-specification, named — not a height the picture claims.
2. **The facing glyph is now on every wall in the product.** Row 20 sized it against "a room with a
   label on the wall is a diagram"; after this row nearly the whole product is bare facings. Shipped
   unchanged, with a frame in the batch, because re-judging it is a look call.
3. **Wayfinding has no owner.** No compass, no map, no 180° turn; the arrival line is spoken once
   and a player who turns twice is not told again; §4b notes the plan makes a minimap "a render of an
   artifact that already exists". At 22 rooms this stops being a limit and becomes the design.
   Allocated as its own row rather than absorbed here.
4. **The screen-reader silence covers ~86 of 88 facings now.** Row 21 recorded it on seven of eight;
   this row multiplies it and hands it to **row 10** with its new size named in that row's text.
5. **Arrival is still at the far side of the destination room.** §4b item 9's [HUMAN] *"you arrive
   IN the door"* is deferred by Navigator ruling (above); what this row owes it is the evidence, and
   the arrival displacement per exit is in the batch.
6. **112 lines of arrival and refusal prose are held by a distinctness test they satisfy by
   construction.** Every line names both rooms, so pairwise distinctness proves nothing about taste.
   The whole transcript is in the batch as `TRANSCRIPT.md` for a human to read in one sitting.
7. **A turn costs half a second on a slow phone, on the worst facing, and here are the numbers.**
   Row 21's through-view is a full extra render of the destination per open doorway, and the manor
   is the first world where one facing carries two. Measured through `renderer.render` directly at
   390×844, mean of five, with the destination drawn:

   | facing | ×1 | ×4 CPU | ×6 CPU |
   |---|---|---|---|
   | `great_hall/W` — two doorways | 74.4 ms | 276.2 ms | **538.9 ms** |
   | `great_stair_hall/N` — a doorway and a flight | 44.0 ms | 140.5 ms | 218.1 ms |
   | `back_stair/E` — a doorway and a rising flight | 37.9 ms | 138.4 ms | 246.5 ms |
   | `study/N` — the painting, nothing through it | 1.3 ms | 3.6 ms | 12.6 ms |

   Per TURN, not per frame, and the page repaints only on a non-empty envelope. The flight's line
   work is not the cost — `study/N` draws a painting in 1.3 ms and `back_stair/E` draws a flight and
   one destination in 37.9 — the per-doorway full-frame scratch is, exactly as row 21's own bullet
   already said. The fix is the same one that bullet names and this row did not take: bound the
   scratch to the opening's own rect rather than the frame, which must not move a hash. **Cold first
   paint at 390×844 from `file://` is 395 ms** with 149 kB of manor fixture and the one painting's
   base64 beside it.
8. **`design/batches/row21-promotion/` is NOT touched by this row, and the reason changed under
   it.** The manor world names `op15` as an exit, so the cross passage's north wall gains a sliver
   of doorway and `08-hall-N.png` is a picture today's build does not draw. When this row began,
   that batch re-rendered against TODAY's build and the honest act was to re-capture the frame. The
   standing-eye wave changed the rule while this row was in flight: that batch now re-renders from
   `ad82ede`, its own closing commit, exactly as row 20's does — because it is evidence a human has
   not ruled on, and re-capturing would replace evidence he has never seen. So the frame stays as it
   was, the batch answers to the build that drew it, and this row moves nothing in it. The
   re-capture was made and then undone; it is written here because "we changed a picture Kabe was
   waiting on and then changed it back" is the kind of thing a reader should not have to reconstruct
   from git.

## Ground plane (`src/groundplane.js`)

Row 1's scale↔y and u-mapping stand; row 2 added depth→y and **one home for placement**:

- **`CAMERA_WALL_M` is the unplanned-facing fallback's own camera distance — 4.0 m since row 20, 3.5 before it** (amending
  row 1's "GRID_K is not meta" note: GRID_K is derived, `px_per_m_at_wall × camera_wall_m`).
  **[Row 11] It is no longer a default for anyone else.** `cameraDistance(meta)` reads
  `camera_wall_m ?? camera_far_m` and THROWS on a meta naming neither: the old `?? CAMERA_WALL_M`
  tail handed a 20.4 m courtyard a 3.5 m wall distance in silence, which is exactly the trap the
  two field names exist to prevent.
- **[Row 11] The u-domain is corner to corner where corners exist.** `xAtScale` reads its centre
  and span from `corner_x0_px`/`corner_x1_px` when the meta carries them, from `wall_x0_px` next,
  and from `canvasW/2` + `wall_width_m × px_per_m_at_wall` last. On every meta this project can
  produce the value is identical — the corners ARE `xAtScale(0|1)` at wall scale by construction —
  so it moves no pixel by itself; what it buys is that the corner verticals the renderer draws and
  the `u` the staging addresses are ONE arithmetic. `uDomain(meta, s, canvasW)` is the exported
  form. It is **not** a render-time clamp that slides an out-of-room object back inside: a picture
  that quietly moves what the document placed is the same lie as one that ignores it, so it clips
  the GRID's own wall/floor/return drawing and an out-of-room placement is a validator finding
  while the entity is drawn whole. Where corners are null the domain spans `wall_width_m` with no
  clamp, and `wall_segments` says where the building is — the stated rule, not a fallthrough.
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
- **CLOSED BY ROW 20.** This bullet recorded that pinning the SCALE gave every facing its own
  lens — the study's 5.45 m wall at 3.60 m a **~131.5°** view, the cross passage's 8.00 m at
  1.95 m **~152.6°**, its 2.60 m end wall at 6.00 m **~106.3°**, all against §10's then-`focal_mm:
  50`. Kabe ruled the researched lens in on 2026-08-21 and every facing is 73.7° now. The two
  consequences below are what the row acted on and are kept for that reason. Two consequences row 11 made
  visible and did not create: turning once in the passage swings the lens 46° and the near floor
  edge 1.34 m under a viewer who has not moved, so the "facing geometry" half of the
  camera-has-feet quality is not consistent across a turn; and under the pinned SCALE the corner's
  x is `768 ± wall_width_m × 96 / 2`, so `camera_wall_m` cancels and two rooms with the same wall
  at different standpoints get pixel-identical corners — which is not what blueprint §5's [HUMAN]
  sentence asks for. Put to Kabe with rendered frames as the direction package's questions 3, 4 and
  5, the answer was that **the fixed scale stands** and the model is settled for good by the
  approved backdrop of row 4, which is §5's law already — so no agent picks it and no document may
  say it is still open. It still gates a **named quality**, not only row 4's meta authoring. Rows 3
  and 7 consume nothing from it.

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
- **The ground carries the same key the sprites do.** Every sprite is UL45-shaded and every pool
  is thrown down-right, and for a while they stood on a wall and floor of *exactly* uniform
  luminance at every x — shaded objects on an unshaded ground, the flip test's failure in
  miniature, in a mode §7 calls product and not placeholder art, whose meta declares
  `key_dir: "UL"`. A stepped falloff in `key_tint` from the upper left, in flat rect fills rather
  than a canvas gradient object (engine rasterisation), tiled on exact integer boundaries —
  overlapping cells paint a pixel twice and turn a smooth falloff into a corduroy 17 levels deep.
  It touches no `GRID_META` number: this is paint, not geometry.
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
- **The glyph carries real ink and not much voice** — 0.35 m tall at wall scale since row 20
  (1.5 m was a row-2 number chosen against a FIXED 96 px/m; under a pinned lens wall scale runs
  170→476 px/m and 1.5 m drew 714 px, 70 % of the frame — a metre-high letter filling a room is
  the diagram Kabe named), stroke weight
  `gh/18`, alpha 0.45. `turn` is silent by design (§8 gives it no narration key), so on a bare
  facing the glyph is the entire response to pressing an arrow key, and at 1 m and 3 px it moved
  426 of 1.57 M pixels: no response at all on a phone. geometry.spec requires a bare-facing turn
  to move more than 1200. The alpha is the other half of the same problem — at 0.9 the letter was
  the most legible object in every frame, and a room with a label on the wall is a diagram. Pixel
  count is what makes a turn visible; loudness is not.
- **The jamb stands proud of the leaf**, because a doorway is wider than the door in it. Drawn
  flush the leaf covered it exactly, and a shut door was a plank on unbroken wall — "a doorway
  exists whether or not its leaf is shut" true of the code and invisible in the picture.
- **The opening carries the wall's own thickness**: a reveal down each inside edge and a soffit
  across the top, the near jamb face catching the same upper-left key as everything else. Three
  attempts, and the two that failed are the useful part. A flat fill with a jamb read as a framed
  dark picture hung where the doorway is. A *raised* far floor line read as a room one step
  deeper than the `go` delivers — the picture saying what the document does not. And putting that
  line at this room's own floor line was truthful and drew **nothing**: the aperture rect is the
  leaf's placement rectangle, whose bottom is the leaf's baseline, which for a `wall_mounted`
  leaf at `v: 0` is exactly `floor_line_y · image_h_px`, so the fill had zero height and every
  transverse line fell below the clip — and the check written for it passed on the jamb's own
  bottom stroke, a test asserting a device that draws no pixels. A doorway's thickness is inside
  the rect by construction, needs no room below the baseline, and claims nothing about the room
  beyond. The guard reads the reveal columns and is verified red without them.

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

## The plan machinery (`fixtures/demo-study/plan.json`, `tools/validate-plan.mjs`, `tools/plan-projection.mjs`)

Blueprint §4b, shape item 10: **the plan document is the source and the schematic is a derived
render.** Row 12 built that inversion. Four artifacts and one direction of flow:

```
fixtures/demo-study/plan.json     the manor in metres: 2 floors, 22 spaces, wall bands with
                                  their carriers, openings, stairs, per-facing standpoints,
                                  object footprints. Schema holo-emitter-plan/0.1, version 1.
tools/validate-plan.mjs           validatePlan() / planWarnings(), pure + thin CLI. Called by
                                  the bake, by the CLI, and by the drawing script.
tools/plan-projection.mjs         deriveMeta / projectPlacement / projectEntity /
                                  inverseProjectPlacement / stagingDivergence /
                                  facingsContaining / report, pure + thin CLI.
design/plan-draft/                the derived render: draw_plan.py reads plan.json and writes
                                  the two SVGs and standpoints.tsv; render.sh rasterises;
                                  projection.md is generated by plan-projection --write.
design/plan-draft/approval.lock   the sha256 of the plan Kabe approved, and the date. The
                                  sheet's provenance line is computed from it, so a redrawn
                                  sheet says UNAPPROVED REVISION until a human re-anchors it.
design/plan-draft/render.lock     which SVG each committed PNG was rasterised from, and the
                                  PNG's own hash. Written by render.sh.
```

**What the plan is and is not.** It is presentation-side — `world.json` still holds no
coordinate, and the truth/presentation split is untouched. `world.json` remains the home of
topology *truth*; the plan holds the *geometry*, and the cross-check binds them. The plan may be
partial: a world can name a location before the plan draws it (§4b item 3's ladder puts a
conjured room on screen as grid first), so an unplanned location is a warning and its exits are
outside what the plan can judge. Row 15 authored the manor's topology FROM the plan and added the
half that was missing — a completeness clause, so the two documents cannot disagree by omission
either.

**Findings block, warnings do not.** Three things are true of the approved plan and cannot be
fixed without moving something a human approved — the desk's footprint overlaps the study's
chimney breast, the entrance approach's north view is a wall with a 20.4 m gap in it, and the
kitchen's great fireplace has no flue above it. `planWarnings` computes them from the committed
document; the CLI and the bake print them; `design/plan-draft/projection.md` §10 carries them.
A validator that refused them would refuse the approved plan; one that could not see them would
be why nobody ever found them.

**The bake's refusal path grew three doors.** `tools/bake-fixtures.mjs` now refuses when
`plan.json` is missing (not optional — a mis-pathed plan would otherwise pass in silence), when
`validatePlan` finds anything, and when the shipped staging stops equalling the plan projection
anywhere outside the one named divergence. `plan.json` is deliberately **not** among the baked
`FILES`: the page does not read it, so baking it would move `fixture.js`'s bytes and fingerprint
for nothing.

**Law (a) is mechanical now.** `camera_wall_m` is stored at the drawn two decimals — the number
printed beside the standpoint *is* `camera_wall_m` — and the validator asserts it equals the
measured standpoint-to-wall distance. `standpoint_source` is `rule` or `drawn`: the K = 0.25
stand-back is checked where the plan claims it, and a deliberately-placed standpoint stays
expressible for §4b item 9's multi-standpoint rooms. **Precision is deliberate and mixed:**
standpoints are stored *exactly* (rounding them to 9 dp moved six labels on the sheet by 0.01 px,
because `X(29.0375)` lands on a two-decimal boundary); the two distances are stored at drawn
precision (18.2249999… and 18.225 are different doubles that print differently, and the document
must render the drawing the human approved); object footprints are rounded to 9 dp because
nothing draws them.

**Law (b) has a witness for the first time, and it runs on every facing.** It used to be held by
the heavy black outline being checkable *by eye*. Now, for **every facing of every room**, the
facing's declared TYPE is checked against what the wall bands actually build, in both directions:
an `open` facing may have no band of any kind between its standpoint and its far line, none
standing on that line, and its far line must fall outside the outline; an `enclosed` or
`corridor` facing must have some band standing on the line it views. Plus: every edge of the
outline must be the outer face of an exterior band, because §4b makes the outline the single
source of every outdoor wall and two hand-typed statements of one geometry drift.

The gate is on the FACING, not the room. Round 4 found it gated on `room.type === "open"`, which
left the whole interior unguarded in both directions — the study's north facing could be typed
`open` with a far line driven 12 m through the manor's north range (a vista prompt for §11's
stone-fireplace wall, at row 4, with nothing left to catch it), and a partition could be deleted
with the two rooms grown to meet and both facings still claiming a wall. `ALL_WALL_KINDS`
throughout, not `BUILT_KINDS`: an interior facing sees partitions, and for an outdoor space the
stronger set costs nothing since no partition stands outdoors. The garden wall is the one further
built structure Kabe ruled in on 2026-08-21, and `BUILT_KINDS` survives as the narrower set for
anything that needs "what an outdoor space can see" specifically.

Law (b) also reaches the meta. `deriveMeta` emits `wall_segments` — the built structure across
the view in view-relative metres — and emits `corner_x0_px`/`corner_x1_px` **only where one
continuous wall spans the view**. The entrance approach's north view is 32.00 m of which 20.4 m
is the open court mouth; a meta with corners at the frame edges there would be inventing the
manor's front elevation.

**The camera is an argument, and row 11 made it a named constant.** `deriveMeta(plan, room,
facing, { camera })` defaults to `GRID_CAMERA`, which carries the DRAWING eye height
`INTERIM_EYE_M` = 1.60 m [HUMAN 2026-08-21] rather than one derived back out of `GRID_META`. Row
12's arrangement made the pinned case an **identity, not evidence** and said so; the arrow is now
the other way round — the eye height is an input, the metas derive from it, and
`assertCameraConsistent` compares a meta against a number it did not supply, so it can fail.
`CONTRACT_CAMERA` is §10's generation camera and differs from `GRID_CAMERA` in two fields on
purpose: the ruled 1.83 m eye, held for row 4's measured camera, and the −8° pitch, which nothing
models. Pitch is unmodelled by everything here —
`groundplane.js` has no pitch term and adding one moves every shipped pixel — and its magnitude
is printed rather than left silent: 49 px of horizon shift at the study's implied focal length.

**CLOSED BY ROW 11 — the live inconsistency row 12 could not fix.** Row 3 propagated Kabe's
six-foot ruling into blueprint §5's camera-has-feet assertion; grid canonical was authored against
1.6 m and had not moved, so the gate failed by 0.0016 while `heights.spec` still implemented 1.6
and the suite stayed green — the blueprint was red and nothing said so. What closes it is ONE eye
height, derived from and asserted at: every meta comes from `INTERIM_EYE_M` and the gate is applied
at the same number, so the residual is 0 by construction. Row 11 first closed it at §10's 1.83 m,
which moved shipped pixels the wrong way for the quality the ruling served, and Kabe ruled the
1.60 m frame back in as the interim — the residual is 0 either way, because what makes it 0 is that
there is one height and not two. `plan.spec`'s case says so: the gate passes at 1.60 and §10's
generation camera fails on the shipped meta. The falsifiable half sits on terms outside the
derivation — the contract's eye height, checked by `assertRuledEye`, and the pixels themselves
(`geometry.spec` measures the drawn floor line and drawn horizon per facing). §10's other half, the
−8° pitch, is what the ruled height is waiting for; see *The room, and what a facing's meta is*.

**The wide-view camera** [AI, under Kabe's ruling (3)]: a facing whose wall in view exceeds the
16.0 m the pinned frame holds takes `px_per_m_at_wall = 1536 / wall_width_m`, so the wall fills
the frame instead of being clipped — the alternative the ruling declined. Ten facings take it. A
compound trigger that also read the room's or the facing's type was built first and dropped: it
contradicted the ruling's own vocabulary in both directions. Where a redline would land is in
`projection.md` §5.

**The one field both documents hold is bound.** `attachment` lives in `staging.json` (§4's
token) and in `plan.objects[]` (which scale the footprint's baseline is projected at).
`stagingDivergence` now refuses when they disagree. Before, they could differ silently and the
failure was worse than a stale duplicate: the projection used the PLAN's token to pick its scale
while the report printed STAGING's, and the depth comparison — the only other thing that could
have noticed — is skipped whenever the shipped placement carries no `depth_m`, which is exactly
the wall-mounted case.

**Plan-only validation is legitimate, and says what it could not check.** §4b item 2 makes this
a document a host emits with no world beside it. `validatePlan(plan)` with no world passes;
`validatePlan(plan, world)` with a world but no §6 records still refuses, because a caller that
had them and withheld them skipped an available check. Either way `planWarnings` prints how many
footprints went un-cross-checked, so the weaker run is never silently weaker. `node
tools/validate-plan.mjs --no-world` is the plan-only case and exits 0.

**What the projection reproduces.** `stagingDivergence` compares every directly-staged placement
against the projection under the meta the renderer resolves. Five of six agree and **the count is
worth almost nothing**, which the report says out loud: four of the five agree definitionally
(their plan footprints were inverse-projected from that same staging by
`inverseProjectPlacement`, which is committed and tested precisely so those numbers are
re-derivable), and the fifth is at offset 0 where `u` is 0.5 under any wall width. The one row
carrying information is `door1` on `study/E`, and it **disagrees**: the approved drawing sites it
1.1 m south of the study's east-wall centre where the staging centres it. That is the row's
answer to "reproduces … or the differences are shown". Nothing in `staging.json` moved.

**The derived render's acceptance.** Re-rendering `plan.json` reproduces the approved sheets'
drawn geometry exactly — the SHA-256 of each SVG with every `<text>` element stripped equals what
the approved file hashed to, and `standpoints.tsv` (pure geometry, no prose) byte-equals the
approved file. Two caption strings did change, because they had become false: an approved sheet
called itself a draft, and a footnote credited checks that moved into the validator. The geometry
hash is what survives caption edits, and a test moves a room to prove the hash is not a
decoration. The **PNGs are not byte-compared**: they are the SVG rasterised by the system browser
at 2×, so their bytes are environment-dependent. They were byte-stable across a re-render on this
machine (same Chrome), which is recorded here rather than asserted; what is asserted is that each
PNG is its own artboard at exactly 2×.

**ADOPTED AT ROW 11.** §4b asks that "hand-authored staging spatial values become generated ones".
Row 12 built the projection, the assertion and the diff and deliberately did not adopt, naming row
15 or row 4 as the row that could absorb the pixel move. Row 11 is that row, on the Navigator's
handoff and under blueprint §4b's [HUMAN] schematic approval: `staging.json` now carries the
projection's own values — `desk1` 0.479 → 0.4383, `chair1` 0.5052 → 0.5153, `shelf1` 0.4475 →
0.3950, `stick1` 0.4632 → 0.4264 with `depth_m` 0.75 → 0.50, and `door1@study/E` 0.5 → 0.7292, the
~1.1 m re-siting the approved drawing calls for. Adoption was not optional even had it been
unlicensed: `u` is normalized across `wall_width_m`, so keeping 0.479 on a 5.45 m wall would put
the desk at a different metre offset from the one the plan draws, and the bake's divergence check
refuses that.
**What the agreement is worth, after adoption: nothing, about the plan.** All six rows now agree
definitionally where before exactly one carried information. The guard still catches a later edit
to either side, and `plan.spec` says so in the case's own name.
**What adoption absorbed, and what row 11 then had to undo.** The four furniture footprints were
inverse-projected out of the OLD 16 m-wall staging, so adopting their projection kept each object at
a metre offset nobody had authored as metres. One of them was not merely unauthored but wrong:
`desk1` stood with **91 % of its footprint (0.65 of 0.715 m²) inside the study's chimney breast**, on
the facing row 4 generates first and the one the drawer, the key reveal and the chair×desk pair all
happen on. It had been a `planWarnings` entry since row 12 — a warning nobody had to act on, because
row 12 could not tell "a human approved this and an agent may not change it" from "an agent placed
this badly". Furniture an agent inverse-projected is the second kind. So the check is a hard clause
now (`plan.object_clear_of_carriers`, with `…_of_stairs` and `objects_do_not_share_floor` beside
it), and the desk moved east along the north wall, clear of the hearth, on the Navigator's ruling
and under §4's standing licence. It was an interim awaiting the direction package's question 6, and
that question is answered: **`08a` — the north wall east of the hearth — is the shipped position,
confirmed by Kabe's blessing of the package** [HUMAN 2026-08-21], not pending anything.
`chair1` moved with it, and by the amount that KEEPS THE PAIR rather than by
the same metres: the two draw at different scales (144 and 113 px/m), so preserving their metre
offset would have opened their screen gap from 50 px to 118 and broken the authored occlusion chain.
Both footprints carry their reason on the object. The same paragraph applies to §4b
item 10's **solver**: this row builds the document, the validators and the derived render — the
grammar and the solver that would author a plan from a description are not built here and have
no owner yet.

**The lens, and the floor at your feet — BOTH CLOSED BY ROW 20, and this is what they were.** Two
consequences of blueprint §7's pinned *scale* (96 px/m) meeting law (a)'s drawn standpoint
distances, computed at row 12 for the first time and acted on at row 20. The implied focal length — `px_per_m_at_wall × camera_wall_m` — runs 187 px to
2014 px across the manor, so it is a different lens per facing and `floor_line_y` comes out
identical on every pinned facing whatever the room's size. And the frame-bottom floor cut, which
the intention's fifth quality calls *the camera has feet*, sits 1.04 m out in the study and more
than twice that on fifteen facings, up to 6.05 m in the entrance court. Neither is this row's
invention and neither is an agent's to fix — a cap on the standpoint rule would change the
drawing Kabe approved, and pinning the lens instead of the scale is §5's open field-of-view
question. `cameraFeetReport` computes both, `projection.md` §6 carries them, and `plan.spec`
pins the numbers.

**Open facings have no wall plane, and `groundplane` has a trap.** `scaleAtDepth` reads
`meta.camera_wall_m ?? CAMERA_WALL_M`, so a meta without that field silently gets 3.5 m — which
in a 20.4 m courtyard is nonsense. That is why an `open` facing's derived meta carries
`camera_far_m` and **no `camera_wall_m` at all**, and why the field name is different rather
than merely differently-valued: the fallback makes a missing wall distance invisible, and a
different name makes it a `undefined` a consumer has to handle. What an open facing's
`px_per_m_at_wall`, `floor_line_y` and u-domain mean against a vista with no surface is **not
settled by this row** — it is row 4's, with the vista backdrop.

**What forces a consumer to branch.** A facing whose view is part building and part open ground
carries `wall_continuous: false` and **null corners**. Nothing can compute a corner-to-corner
u-domain from a null, so row 11's clamp has to branch; where corners are null the u-domain spans
`wall_width_m` with no clamp, and `wall_segments` says where the building actually is. That is
the mechanism standing between law (b) and a prompt sheet that invents the manor's front
elevation across the entrance court's 20.4 m mouth.

**What the approval covers, and what it does not.** Kabe approved the *drawing*. `plan.json`
carries content no image has shown him: the four object footprints (the drawing draws no
furniture), the ten-facing wide-camera assignment, the `camera_far_m` split, the room
archetypes, and the corrected door label. The drawn geometry is anchored to the approval commit
by test; the semantic fields are not, and each is anchored differently — `joins` is re-derived
geometrically from the rects, `facing_type`/`camera_wall_m`/`wall_width_m` are checked against
the approved `standpoints.tsv`, and room ids, `entrance`, opening `kind` and stair `up`/`down`
have only the code's own mutation tests. Naming that is the honest state; re-showing the plan is
the Navigator's to arrange.

**Three vocabularies, kept apart.** `facings[].type` is the *facing geometry* type §5 defines
(enclosed / open / corridor) and is the one law (b) checks against the bands. `rooms[].type`
draws from the same three tokens but says something else: **what kind of space this is** —
`open` means outdoors, and it is what the tiling's interior set, `wallSegments`' band kinds and
the drawing's fill all read. The two need not agree, and on this plan they often do not: all
four of the privy garden's facings are `enclosed` (it is walled on every side) while the room is
`open`; two of the cross passage's four are `enclosed` while the room is `corridor`. Only the
facing's type is a claim about a view. `rooms[].archetype` is the third — §4b's *room type
template*, the production recipe, "per room modular consistent design so creation is snappy":
chamber / hall / corridor / service / stair / open. A corridor-type room may be a stair; an
enclosed room may be a hall. §4b item 6's backdrop-template tier keys on the archetype, and
merging any two of the three would have left something with nothing to key on. The archetypes
are [AI] packaging of the drawn roster and are redlineable.

**`corridor` was nominal at row 12 and is not after row 11.** §5 defines it as *"side planes
converging, open centre"*, and the derived meta still emits no side-plane FIELDS — a corridor
facing gets the same `camera_wall_m`/`wall_width_m` pair an enclosed one does. What discharges it
is that the renderer now draws the side planes those two numbers already imply: at `hall/E`'s
2.60 m wall seen from 6.00 m the returns fill 84 % of the frame and 5.03 m of side wall is in view,
against `study/N`'s 66 % and 2.37 m. `mechanisms.spec` asserts that ordering, so the type means
something measurable rather than being a label. See *The room, and what a facing's meta is*.

**What the schema cannot express, deliberately.** Rooms are axis-aligned rects, so no L-shaped
room exists (the building's outline is a polygon; rooms are not). Facings are exactly four per
room, keyed inside the room, so §4b item 9's multi-standpoint rooms — which name the great hall
and the long gallery specifically — need a re-keying NO ROW OWNS YET: row 15 declined it (above,
and in *The manor walkable*), because a facing re-keying moves drawn content. `standpoint_source:
"drawn"` exists so a deliberately-placed standpoint stays expressible in the meantime, and
`plan.spec` exercises that branch rather than leaving it a promise. The K = 0.25 stand-back has
no cap, which is what produces the 15.30 m and 18.22 m distances above; a cap would be a rule for
the document, with one home like `standpoint_stand_back`, and it is Kabe's to set. And §4b item
9's *"you arrive IN the door"* is not what K places: a viewing standpoint a quarter of the room
in is not a threshold, and separating arrival from viewing is row 15's.

**Which number the projection consumes.** `camera_wall_m` at its stored two decimals — the drawn
number — not the exact standpoint-to-line distance. The two differ by at most 5 mm and the
validator asserts the stored one is the correct rounding of the exact one, so there is one
answer rather than two that nearly agree. `stagingDivergence` runs at `STAGING_TOLERANCE` 1e-9,
derived in the module and driven from both sides by a test.

**Still missing from the document, with owners.** There is **no vertical datum**: `stairs[].treads`
is checked against a sanity band (10–30) and not against a storey rise, because the plan carries
no storey height — and row 11's corner verticals, §4's `v`, and row 4's ceiling/sill/head prompts
all need one. Row 4 owns it, with the measured backdrop. The plan also carries **no style seed**,
so §4b item 6's backdrop-template tier has an archetype to key on and nothing to key it *to*;
that is row 4's `style_block`. And two things on the approved sheet are worth knowing before
anyone measures off it: each axis's two opposite facings **share one dashed leader** with an
arrowhead at either end, so which printed distance belongs to which arrow is resolved only by the
legend; and the ★ marking `door1` is hand-placed 0.72 m north of the opening it marks, to clear
the travel arrows.

**Practicalities a fresh session needs.** The plan is a **required** bake input, so any path that
stages a fixture tree must carry a `plan.json`; the suite's `stageTree` copies `fixtures/`
wholesale, which is why every existing staging path already does. And `plan.spec` shells out to
`python3` for the derived-render cases and **fails rather than skips** when it is missing — the
byte-identity of the derived render against the approved drawing is this row's acceptance, and an
acceptance that opts out on some machines is not one.

**What the artifact critic's mutations changed, and what they proved.** Four defects it found by
breaking things, each now guarded: `corner_x0_px`/`corner_x1_px` were a private copy of the
u-mapping rather than a call to `groundplane.xAtScale` (displacing the function moved `u` and
left the corners where they were — the exact shape row 2 paid for twice); the committed PNGs were
verified by nothing, so dropping in the pre-row-12 sheet passed the whole suite (`render.sh` now
writes `design/plan-draft/render.lock`, recording which SVG each PNG was rasterised from and what
it hashed to, and a test reads it); the sheet's legend typed its three wall thicknesses while
`plan.wall_thickness` sat unread (the legend renders from the document now, keyed by band kind,
and every band's thickness is checked against it); and an emptied `objects[]` baked green, because
a staged entity with no plan position warned instead of refusing — it refuses now when the plan
holds the room, and warns only when it does not.

**The viewed wall is not always one plane.** A chimney breast stands proud of it, so on eleven
facings — `study/N` among them, which is §11's fireplace wall and row 4's probe backdrop — part
of the view is nearer than `camera_wall_m`. `wallRelief` reports it in the same view-relative
terms as `wall_segments`. The number itself does not move: law (a) measures to the wall *line*
and the drawing prints that. What changes is that a prompt sheet has the relief beside it instead
of finding it in a picture. A hearth on another of the room's walls is an object in the view, not
relief on the plane, and belongs to that wall's own `facingCarriers`.

**Stairs are exits, and the cross-check knows it.** `exit.via` resolves against openings by
`entity` *and* against stairs by id; a stair exit's facing is checked against the flight's own
`up`/`down` rather than a wall normal. Without that, row 15's first stair exit would have been
refused by the row that was supposed to enable it.

**[Row 11] The approval stamp's input is the DRAWN content, and the un-drawn remainder has its own
digest.** `draw_plan.py`'s `DRAWN_KEYS` names what the sheets draw — walls, outline, openings,
windows, fireplaces, stairs, floors, rooms, and the document's own header fields — and
`plan_digests()` hashes that and the remainder separately. `approval.lock` records both. The stamp
keys on the drawn digest and still fires on ANY change to it. A change to the remainder (which is
`objects[]` today) prints on the sheet's own face — "Content the sheet does not draw has changed
since then (sha …); the drawing is unaffected" — so narrowing the input removed a false alarm
without removing the record. The reason is that the stamp asserts *Kabe approved this DRAWING*, and
*What the approval covers, and what it does not* above already said the four object footprints were
outside it; hashing them anyway made a value blueprint §4's standing licence lets an agent move read
as a demand for human re-approval. Row 11's one plan edit leaves the drawn digest byte-identical to
the plan Kabe signed, which is what proves it touched nothing he saw. Re-anchoring after a real
redline is still two manual steps and still deliberately manual.

**A redline has a regeneration step.** `node tools/plan-projection.mjs --rebuild-facings` recomputes
every facing block from the room rects and `standpoint_stand_back` — a pure function of them
wherever `standpoint_source` is `rule`. On the committed plan it is a byte no-op, which a test
asserts; a `drawn` standpoint stays where it was put and only its measurement is refreshed.
Without it, moving one wall meant restating four facings by hand and the README printed a recipe
that was not one.

**And a redline ends at a human, not at a green suite.** After the five commands the suite is
still RED on purpose: `plan.spec` byte-compares the derived SVG geometry and `standpoints.tsv`
against the git blobs at `APPROVAL_COMMIT`, so a redline breaks the gate that says a human signed
this drawing. The redrawn sheet says so on its own face — the provenance line under the title is
computed from `design/plan-draft/approval.lock`, which records the sha256 of the plan Kabe
approved and the date, so a sheet drawn from any other document prints **UNAPPROVED REVISION**
with that document's short hash, and one drawn with `--skip-validate` prints that nothing checked
it. Re-anchoring is two manual steps (the lock's hash, then `APPROVAL_COMMIT`) and they are
manual on purpose: an agent that could move them could approve its own drawing. The full order is
in `design/plan-draft/README.md`.

**[Row 20] What that byte-comparison normalises away is the sheet's HEADER BAND, and the band is
read off each sheet rather than named by a marker.** The title, the subtitle, the provenance stamp
and the full-width rule under them are chrome: the stamp shrinks to fit the column, wraps to a
second line when the lock's `pending` clause grows, and pushes the rule down when it does — and
none of that is the drawing Kabe approved. `plan.spec`'s `geometryOnly` therefore drops every
`<text>` and the header rule, located by pattern in whichever sheet it is handed. The first version
instead dropped elements carrying a `sheet-chrome` class that `draw_plan.py` had just started
emitting, which is a normalisation only ONE side of the comparison can satisfy: the approved blob
in git predates the class, so the rule survived on one side and vanished on the other and four
cases went red claiming the approved geometry had moved when nothing drawn had moved at all. The
reflex repair — walk `APPROVAL_COMMIT` forward to the commit carrying the new file — is the one
that must not be taken, because an anchor an agent re-points whenever the artifact moves proves
nothing about the artifact. **A frozen comparison is normalised on both sides or not at all, and
its anchor moves only when the drawing moves and a human has said yes to the new one.**

**Picture data keyed by document ids has a fallback, and the artboard has a refusal.**
`STAIR_LABEL_POS` is keyed by stair id; renaming a stair in a perfectly valid plan used to kill
the render with a raw `KeyError`, so it now falls back to the flight's own centre and says so on
stderr. Artboard extents are still picture literals, but `fit_check` now refuses — naming the
room and the edge — rather than drawing a building off the canvas in silence. §4b item 2 makes
this a document a host emits, and a valid document must never produce a stack trace.

**What later rows take.** Row 11 took `corner_x0_px`/`corner_x1_px`, `facing_type`,
`wall_segments` and §12.5's amended clause and is closed. Row 4: `camera_wall_m` per facing, the wide-camera
parameters, `backdrop: "vista"` on open facings (ruling (1)'s scenic vista), and `view_angle_deg`
per placement, which blueprint §10 says is "computable once row 12's plan exists" — it is, and
`projection.md` §2 tabulates it. Row 15: the room and exit topology, and the multi-standpoint
schema extension §4b item 9 describes. `facingsContaining` is the primitive item 9's variant
manifest enumerates; the manifest belongs to row 4's bulk step, which owns the worklist.

**§12.5's frame-filling clause, amended.** §7's row-2 amendment gave §12.5 `px_per_m_at_wall ×
wall_width_m ≈ canvas width`, written when grid-canonical `wall_width_m` *was* the wall in frame.
This row produces metas where it is false by design (`study/N` is 96 × 5.45 = 523 px against a
1536 px canvas), and row 11's done clause requires §12.5 green. The clause generalizes to
**three** clauses, written into the blueprint beside the clause they replace. The first draft
here was the single equality `corner_x1_px − corner_x0_px = wall_width_m × px_per_m_at_wall`;
it was dropped because it turns the one clause that reaches OUTSIDE a meta into a
self-consistency check — both sides read the same meta, which is precisely the failure §7's
row-2 amendment was written to end. What stands instead:

- **(i)** the wall in view fits the frame — `0 ≤ corner_x0_px` and `corner_x1_px ≤ canvas
  width`. The canvas is the thing outside every meta, so this is where the original clause's
  reach survives.
- **(ii)** on a **measured** backdrop the corners are measured off the image, and
  `corner_x1_px − corner_x0_px` must equal `wall_width_m × px_per_m_at_wall` within the
  calibration audit's tolerance — pixels against arithmetic, which is where the original
  clause's force lived.
- **(iii)** on a synthesized (grid) backdrop the corners are computed, so (ii) holds by
  construction and only (i) has content.

Row 11 boards from here, so the shape matters: (ii) is the clause with teeth and it does not
exist until row 4 measures a backdrop.

**The one [AI] correction to an approved artifact.** The upper-floor opening in the W2 band at
y 11.0–12.0 was labelled *Solar ↔ Long Gallery* in the drawing's source and geometrically joins
**Muniment Room ↔ Long Gallery** (the Solar's east wall is at x 24.6; the opening is at x 30.4).
The names were never drawn, so the render is byte-identical either way. Found by the promoted
validator on its first run; recorded in `projection.md` §9.

## index.html chrome

Row 1's stage contain-fit stands, with a `max(320px, …)` floor on the width — the bare calc went
to zero below ~154 px of viewport height and the page rendered literally nothing. The bottom
chrome (narration log + inventory strip + status line) grew the vertical reserve from 3rem to
**9.6rem**; the capture/pointer viewport is **1536×1200** so the canvas displays at native scale
(canvas px = CSS px). That is the *convenient* viewport, and saying so is the point: it is where
small targets are easiest to hit, so the pointer specs that pin it are not evidence about any
other window size, and the clickability sweep runs at 1366×768 and 1920×1080 as well. All
*visible* chrome carries class `chrome` and hides under `body.capture` (§12.6's element-screenshot
seam, tested) — rows 8 and 10 add three exceptions, each with its own reason: `#fullscreen-toggle`
and `#entity-controls`'s buttons carry `chrome` too (so they hide under capture like everything
else), but `#overlay` itself has never carried the class (true since row 1) and stays visible under
capture regardless. That was harmless while only the mouse could paint into it (capture tooling
does not hover), but row 10's keyboard focus halo paints there without a mouse at all — a §12.6
capture taken while a control is focused is measurably not identical to the parent-commit capture
(an artifact critic measured a byte-different, larger-alpha `#scene` screenshot). Not fixed here:
either capture mode must clear `focusTarget` and repaint, or `#overlay` must gain `class="chrome"`
too. Whoever automates a batch capture should blur before shooting until one of those lands.
Chevron geometry eclipses no entity hit region — the clickability sweep's `elementFromPoint` is
the shipped witness, and that guard is scoped to `.chevron` by name with a pinned zone count of
two. Row 8's fullscreen button is a second `pointer-events`-enabled control over the stage (empty
on every shipped facing, swept by hand) that the same guard does not see; row 10's own entity/go
controls are pointer-events:none and cannot occlude a click by construction, unlike the button. A
later row generalizing this guard should enumerate every stage-overlaying control with
`pointer-events` enabled, not `.chevron` by name.

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
- **The order is §7's, and it is load-bearing in both directions**: the exact drawn pixel, then
  an open doorway the point falls inside, then the tolerance ring — *last*, "so it cannot eat the
  opening". Running the ring second put the open leaf's margin inside the aperture, and the
  smaller the screen the more it took: 46% of the visible gap on a phone answered "shut the door"
  to a player trying to walk through it, with a test of ours pinning that in place. The one
  exception, which is the ring's whole purpose, sits *inside* step 1: a target clearly smaller
  than what is exactly under the point — the key over the desk it lies in, the coin over the
  shelf board.
- **Among candidates within the margin, the smallest rect wins** — not the first in draw order.
  A host draws before its anchored child, so returning the first at distance 0 handed the key's
  own pixels to the desk underneath (at phone scale the desk is itself "small"), and the
  forgiveness written for the key never reached it: 12 CSS px² of reachable area, and a tap three
  pixels off centre dispatched `toggle desk1`, shutting the drawer over the reveal.
- **Pointing tolerance** applies to **any target too small to hit exactly**, not only takeables.
  §7's amendment says "a widening tolerance ring for targets too small to hit exactly", and
  scoping it to `takeable` restored the blueprint's own named failure on a phone: the open leaf
  draws 6 CSS px wide and is the ONLY pointer path from open back to closed, so
  `toggle door1 → closed` was authored, narrated, a member of the §12.9 domain, and unreachable
  by a finger. A candidate wins only when it is **clearly smaller in drawn area** than whatever
  is exactly under the point — an absolute CSS threshold alone is not enough, because at phone
  scale everything is small and the desk then claimed a margin and answered for the chair in
  front of it. It is chrome, never the renderer: the alpha regions are untouched. The margin is
  in **CSS pixels at the current display scale** — a margin in canvas pixels is a
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
  `go` never reaches the veil, so a shut door does not flash. A blanket 520 ms lock on the only way
  between rooms, cleared by nothing, once dropped a well-formed intent with no envelope and no
  refusal line and made *walk in, look back, walk out* impossible; it was also why §12.2's replay
  clause was red on Firefox while Chromium, being slower on that path, stayed green. **A double-click
  echo is swallowed, travel is not**: a 400 ms window (`lastGo`, `DOUBLE_CLICK_MS` in `index.html`)
  swallows the second click of a real double-click when — and only when — that click also resolves
  to `r.kind === "doorway"` within the window; every other click clears it. **[Row 13, corrected at
  the second artifact-critic pass]** Before row 13, `arrive_facing` turned the player to face back
  at the doorway they had just come through, putting it under the very pixel they just clicked, so
  an accidental double-click walked them through and straight back behind a veil they never saw
  past — the guard was written for that. Passage now maintaining orientation (blueprint §3) does
  retire that *specific* coincidence on M0's two single-exit rooms (arrival faces away from the
  door just used), and the first cut of this row read that as the guard's whole justification and
  deleted it, reasoning "no fixture this project can ship reintroduces the coincidence." **That
  reasoning was false, and the second-pass artifact critic proved it in one double-click**: the
  guard was never scoped to "the same doorway" (`r.kind === "doorway"` matches *any* doorway the
  second click resolves to), and a corridor whose next room's own door sits on the facing you
  arrive with — exactly what "continues the direction of travel" produces one hop later — puts a
  *different* doorway under that second click. Continuing-direction-of-travel makes this *more*
  likely in a corridor, not less, since every arrival now faces forward into whatever the next room
  offers on that same facing. The guard is restored (not re-deleted), the reasoning in `index.html`
  and here is corrected, and `tests/playwright/walkthrough.spec.mjs` gains "the double-click guard
  against a corridor's aligned doorway" — a doctored third room chained off the shipped hall,
  driven with a real double-click — proving both halves (the swallow, and that it releases once the
  window passes) against a deletion of either. M0 itself has no corridor to build this against
  without doctoring, but **rows 11 and 12 build toward corridor-typed facings** (blueprint §5's
  `enclosed`/`open`/`corridor` field), so the risk this guard covers stops being hypothetical the
  day either lands; whoever builds them should read this paragraph before touching `index.html`'s
  click resolver.
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
- **A refusal repeated in a row does not repeat on screen**, and nothing about the repetition
  reaches the surface: a count in the fiction's voice is a string about the message stream, in
  the one place that speaks only about the world — and it would be composed at runtime, where an
  audit built from source literals would never find it. Every envelope still fires.
- **The chrome measures its own reserve.** The stage reserved 9.6rem against a chrome of 8.8, so
  the picture was ~9 px shorter and ~13 px narrower than the layout's budget allowed at every
  height-bound viewport. It is 8.8rem both ways now, asserted from the stylesheet and from the
  rendered boxes. The unit is `svh`, not `vh`: on iOS Safari `100vh` excludes the toolbars, and
  in phone landscape this layout has 9 px of slack — Safari is the one engine this build has
  never run on, so it gets the unit that cannot be wrong rather than a measurement nobody here
  can take.
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
- **Surface strings have their own home: `design/surface-strings.md`** — the complete enumeration
  of what this page can put in front of a person, in every state, with each string's audience
  verdict. It is **test input**, not illustration: `tests/playwright/voice.spec.mjs` parses its
  fenced blocks, so an edit to it is a code-class change and **a row that adds, changes or removes
  a surface or console string extends it in the same commit** or the suite is red. Read it before
  writing any string a player can see.
- **The status band is gone** (row 7). It printed the fixture bake fingerprint and a re-bake
  command on the product face — the project talking to itself where a stranger reads it, which is
  what Kabe caught on the live link. The fingerprint went to `console.info` at boot; the one
  genuine fault it also carried, a boot viewstate the world does not hold, is now a product-voiced
  line in the narration pane. **Why not keep the band for that fault:** the bake refuses an invalid
  boot viewstate and the bootstrap re-checks, so the condition arises only from a hand-edited or
  corrupted `fixture.js` — a developer-caused condition, and one does not get a permanent element
  of the product face while every healthy visitor pays a reserved strip for it. The chrome reserve
  is **7.6rem** (narration 4.2 + inventory 3.4), so the picture is larger at every height-bound
  viewport. Two known limits closed with it: the band's sub-AA contrast, and BOOT ERROR's wording
  and quiet styling.
  **The two branches of that fault differ, and only testing found it:** a bad *location* leaves
  `nextFacing` with nothing, so every arrow press is refused aloud, forever; a bad *facing* is
  recovered by the first arrow press, because `RING.indexOf` misses and the first candidate is a
  facing the room really has. Both are product-voiced; only the first repeats.
- **`body.capture .chrome` carries `!important`**, because `#inventory { display: flex }` outranks
  it by ID specificity — the documented invariant "all chrome hides under `body.capture`" was
  false for the strip, and the only reason no §12.6 capture was ever wrong is that the strip sits
  below the stage and never overlapped the scene canvas.
- **Accepted V1 interaction consequences** (from blueprint §7/§8 text; row 5's human pass sees
  them as decisions, not surprises): input stays live during the go fade; a double-click on a
  shut door opens it and walks through in one gesture, because the same point means "toggle"
  before the click and "travel" after it.

## Tests

`npx playwright test -c tests/playwright` (or `npm test`) — headless, all pages from `file://`;
suite-wide no-network guard and in-page SHA-256 canvas hashing as at row 1; no stored goldens;
tests that edit fixtures stage a scratch tree and re-bake there.

**Two engines, both running everything.** Not decoration: §12.2's replay clause was red on Firefox
for a real product reason — a travel guard swallowing the replay's second passage — while a
Chromium-pinned suite stayed green, and four boot-fallback guards were inert there because
`page.route` does not intercept `file://` off Chromium (they delete the module from a staged tree
now). Running all of it is safe because **no test compares a hash to a literal**: every hash
assertion is a within-run identity, and everything else is an alpha-bounds or luminance
measurement. Sub-pixel rasterisation does differ between engines — accepted residue — and no test
reads it. Restricting the second engine to "behaviour" specs left §12.3, §12.4, §12.5 and §12.8
on one renderer, including the clause the intention singles out. WebKit will not launch on this
machine and is unverified by anyone — the likeliest engine for a phone visitor at the public
link.

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
**row 11: the two corners located by brightness centroid on all eight facings against per-facing
literals** (the committed replacement for the hand-run cross-commit canvas check — on a row where
every frame moves, "every changed pixel changed on purpose" discriminates nothing and a per-frame
prediction does), corners following a wall width no room in the manor has, the pinned-scale
corner/standpoint independence pinned as §5's open question, typed geometry rendering `open` and
segmented metas with no wall through the shipped renderer, and one lighting model checked in both
directions (the falloff within each plane, the return ordering across them);
`placeHost` agreeing with the layout entry; and the six mechanisms that were present but
unguarded — cavity clip cutting, alpha hit regions, silhouette ink inside a hole, the open
door's shadow following the drawn sliver); `validator` (green on repo fixtures, red per mutation
class, the §12.9 cross-check, the bake-refusal witness, both fault surfaces, and the
placement-binding guard that displaces `groundplane.placeHost` at runtime and requires the
verdict to move). `voice` (row 7: the product-voice rule made checkable — it **parses
`design/surface-strings.md`**, so the audit and the guard are one object. The audit's own
integrity: legal verdicts from a closed vocabulary, `OPEN` only where `QUESTIONS` names the row, a
non-empty adjudicator per row, `COUNT:` equal to the rows parsed, and a parser that **hard-fails**
on an unreadable row rather than dropping a string from the required set. Then: `observed: no`
derived from `world.json`'s `takeable` rather than written by hand; the audit's copies byte-equal
`narration.json` and the bound library; a sink census by pattern over every surface write, with
comments stripped so the file's own prose about `fillText` is not read as a violation; no
`UNUSED_SINKS`; no stylesheet `content:`; `GLYPHS` exactly the enumerated canvas marks; a runtime
DOM sweep — text nodes, `::before`/`::after` content and every naming attribute, **no visibility
and no `aria-hidden` filter** — across boot, every facing, tiles held, refusals, coalescing,
capture mode, two widths, both broken-boot branches, four missing modules, a render fault, an
unreadable intent, a missing narration key, a missing noun and scripts-off; every narration line
read back off the real pane; the console witness present with the fingerprint `fixture.js` holds
and absent from the surface; no method speech in any console literal; and the pane's whole-row
guard at 320 px and 200% zoom, which is where `shell.spec`'s "half a row of type" scar moved when
the status band was deleted — the scar is general and rows 8–10 add chrome);
`plan` (row 12, extended at row 11: the plan document, its validator's mutation cases, the orientation
law made geometric, the camera, the derived meta by test-side arithmetic AND against the approved
`standpoints.tsv`, the staging↔projection divergence, the three groundplane import bindings, the
bake's new refusals, and the derived render's byte-identity — it shells out to `python3`, and
fails rather than skips when it is missing, because that byte-identity is row 12's acceptance;
**row 21** adds the two batches' re-render, the approvals-ledger gate, the prompt lint's
discrimination cases, and at the close the cand-3 round's membership claim — *nothing is admitted* —
its control against the committed promotion, and a line-for-line comparison of **both gate tables
the batch quotes to Kabe** against what `gate.py` prints today, because a quoted table is a second
copy of a fact and this row already shipped one that had drifted by a space);
`determinism` extends §12.2 clause 1 across two fresh page loads (boot facing,
swap state, one `part_t = 0.5` mid-state); `geometry` (row 11: §5's horizon device on the fallback
meta at the RULED eye height, the ruled eye asserted against `replicator/contract.json`, §12.5's
frame clauses (i)–(iv) over every meta the fixture can resolve, **the camera-has-feet gate measured
from the drawn floor line and drawn horizon on all eight facings** — the clause that can fail where
reading the derivation back cannot — and the grid scans re-pointed per facing);
`shell` carries the new reserve/viewport numbers (row 1's stale "window width" title is dead);
`nav-walkthrough` (row 21: the world the BARE URL boots, which no other spec opens — the painting on
screen and not a grid, four facings by real arrow keys, the doorway clicked through in both
directions, dead space still dead in an empty world, and the same two things in a hand at 390×844
with the opening measured in CSS pixels against the 44 px platform minimum).

**A GUARD'S TEETH ARE PROVEN BY A CRITIC FAILING TO BREAK IT, NOT BY ITS AUTHOR WATCHING ONE
MUTATION GO RED.** [felt, row 11] This is the fourth bite of the same family on this project and the
sentence is the scar. Row 11 built the ledger below, verified it by disabling one function and
watching ten cases go red, and reported the family closed. The next artifact critic took it apart in
four ways: the completeness check compared two hand-typed lists to each other, so deleting a whole
case left it green; the clause tokens were coarser than the clauses, so four unexercised arms could
be deleted in one edit; it asserted membership and never exclusivity, so "fails on that clause
alone" was prose; and six more mechanisms it never named survived deletion with 1032 tests green.
The author's mutation proves the case he wrote. Only a critic's proves the ones he did not.

**THE CLAUSE LEDGER IS THE STANDING REQUIREMENT** (row 11, on the Navigator's ruling, after this
family cost a round for the third time on this project). Row 3 answered it on the Python side with
`replicator/tests/test_clause_guards.py`; `tests/playwright/guards.spec.mjs` is the same shape on
the browser side. **Any new validator arm, and any new renderer mechanism, arrives with a case in
the ledger** — a case that fails on that clause alone and names it, plus an entry in the ledger's
declared `MECHANISMS` list, so a mechanism added without a case shows up as an absence rather than
as silence. **Four things make it work, and the first ledger had only the second:**
1. **Completeness is derived, not typed.** `ledgerCase(name, body)` registers each case as it is
   defined, and the completeness test compares `MECHANISMS` against the cases that EXIST. Delete a
   case and its name disappears from the set.
2. **One token, one arm.** Every clause carries a stable `[row11:<name>]` token in the finding it
   emits, so a case names what fired rather than matching prose someone will reword — and a test
   reads the tokens out of the validator SOURCE and requires each to tag exactly one emit site and
   to be declared. A clause added without a name is as invisible as a mechanism added without a
   case. **And the count is CROSS-FILE, which row 20 learned the hard way.** The scan originally
   counted emit sites per file, so once the clause set grew past one validator the same token in
   two different files passed a rule whose entire purpose is that one token means one place. A
   case naming that token then proves nothing about which of the two fired — the exclusivity in
   (3) stays intact while the evidence under it quietly does not. **Whenever the scan's set of
   source files grows, the dedup has to be over their union and never per member.**
3. **Exclusivity, not membership.** A case asserts the tripped set EQUALS `[name]`. Isolating the
   clause is what makes the case evidence about it; row 11's first ledger asserted only that the
   name was among the clauses that fired, and three of its cases were tripping a second.
4. **Renderer mechanisms are broken in a staged tree and measured in the picture**, because a
   document cannot reach them. A document-side case doctors an input instead.
This is not a habit to remember — it is the shape the next row copies. **A mechanism whose deletion
a case cannot measure is a claim to narrow, not a guard to widen**: row 11 removed the ceiling's
plane fill for exactly that reason — `#080a0e` over a void base of `#080b10` moved nothing a
detector could name, so the fill was a mechanism nobody could see and a case nobody could write.

**A CASE PROVES A CLAUSE FIRES; ONLY A BOUNDARY TEST PINS ITS NUMBER.** Row 20 paid for this twice
in consecutive critic rounds on the same clause. `meta.one_lens` carried `meta.measured ? 0.05 :
1e-9`; a critic widened `0.05` to `0.99`, the fix split the token and bound the measured half to the
asset gate, and the next critic widened the DERIVED half from `1e-9` to `0.1` — 10⁸ — with the whole
suite green. The ledger case could not see either, and the reason is structural: a case doctors its
input far outside the tolerance to prove the clause fires at all, so it stays red under any widening
short of its own delta. **A tolerance is a separate claim from the clause that applies it, and it
needs its own reader: one assertion that a deviation just outside is refused, one that a deviation
just inside is not.** Phrase both in ABSOLUTE terms — the row's first attempt asserted `TOL × 4` is
refused, which is true for every value of `TOL`, so the test moved with the number it was pinning
and survived the exact widening it was written to catch. And where the tolerance decides membership
of a real corpus, assert the MEMBERSHIP: not "the band is 3 %" but "the band still admits exactly
the one backdrop blueprint §5 admits."

**And a third round found the same clause's other arm unpinned in the same way.** The MEASURED
band's boundary case derived its own edges from `MEASURED_BAND`, so it was true for any band wider
than two pixels: a critic moved the constant and `gate.py`'s copy of it to 0.001 and to 0.037 and
the case passed both times — at 0.001 the gate silently refuses every regeneration the asset seat
can produce, at 0.037 it admits `study/W` at −3.7 % un-regenerated. Blueprint §5's ruled *"within
±3 % of 1010 px"* now has a reader that is not a copy of itself: the case parses the number out of
the blueprint sentence that rules it. **Where a number is ruled in prose, read the prose — a second
literal agreeing with the first is one edit away from agreeing with nothing.**

**[Row 20, round 6] A SWITCH THAT TURNS OFF THE GUARD AND ITS MITIGATION TOGETHER IS NOT A
MITIGATION.** Round 5 moved the `AWAITING HIS EYE ON` requirement out of `approval.lock` and onto
`design/batches/row20-lens/`'s existence, reasoning that a directory leaving the tree is
human-visible where a deleted line is not. Four cases then opened with `if (!existsSync(dir))
return`, so one `rm -r` reported four passes: the AWAITING requirement, the frame re-render, the
BEFORE frames and the schematic byte-equality all went quiet in the same command. **The batch and
the lock's `pending` line are one switch now** — each asserts the other, so neither retires alone —
and the gated cases skip VISIBLY instead of returning a pass they did not earn. Two rules come out
of it, and they generalize past this row: **a guard's off-switch must not also be the off-switch of
what it guards**, and **an early `return` in a test is a green tick; use a visible skip.**

**A scope line has to be read against its subject, not against a length.** The `pending` clause was
held by `length > 20` plus the stamp printing it, so a critic set it to *"the sheet border and the
scale bar"*: both sheets printed `AWAITING HIS EYE ON: the sheet border and the scale bar.` and
everything stayed green while the standpoint markers — the drawn content the whole anchor rests on
by inference — folded silently under APPROVED. Deleting the line was caught; narrowing it to a lie
was not. It is now read against `standpoints.tsv`'s delta from `SEEN_SHEET_COMMIT`, the last sheets
a human looked at directly: each drawn family that actually moved must be named in the clause, and
a clause naming nothing that moved is a claim about nothing.

**And naming is not asserting — the round-7 turn of the same screw.** That first repair demanded
the moved family be NAMED, which is a word-presence test, and a critic negated it inside the
guard's own vocabulary: `pending  the standpoint distances and the wall widths are exactly as he
approved them; nothing on this sheet needs his eye` printed on both sheets with every case green.
Round 5 could be defeated by naming the wrong subject; round 6 could be defeated by naming the
right subject and denying it, which is worse, because the failure reads as compliance. **So no
sentence of anyone's carries the claim any more.** The clause is DERIVED — which family moved, on
how many facings — its home is `scopeFromDelta` in `plan.spec`, and `approval.lock` carries a
byte-checked copy the way `render.lock` carries a hash. The general rule, and it is the last one
this row learned: **a claim a person authors is a claim a person can negate; where a guard can
compute the claim, it must, and the document holds the computed string rather than a description
of it.**

**A picture guard proves the picture is CURRENT, not that it is of what its name says.** The batch
re-render byte-compares eleven frames against a fresh capture — but `capture.mjs` is both the
definition and the comparison, so renaming a row of `FRAMES` is green by construction. The script
already prints the viewstate it reached per frame; the guard reads that line now and requires
`06-hall-E.png` to have been captured at `hall/E`. **And its filter excluded the other eight
pictures entirely**: `!f.includes("BEFORE")` left the batch's before/after halves — the pair the
README tells Kabe to open first — bound to nothing, which is round 5's own finding surviving inside
round 5's own fix. Those cannot be re-rendered by today's code, so `capture.mjs` takes the tree to
draw from: `git archive` the last pre-lens build (`ff095d9`) into a temp directory, point the script
at it, and the eight come back byte-identical. **A "before" picture answers for itself by being
re-drawn from the build that drew it** — no stored digest, nothing read out of the document guarded.

**A composition ruled by eye needs a measured reader or it is held by nothing.** Round 5 moved the
`hall/E` candlestick because a critic looked at the frame and saw it standing ON the press; the fix
was correct and was guarded by no test at all — reverting the two fixture numbers and re-running the
two generators restored the failing arrangement with the whole suite green, and the existing
opaque-overlap case was green at both positions, because crossing a silhouette is what a thing
BEHIND another does too. What separates the two readings is the drop between the two drawn bases, so
that is what `mechanisms.spec` measures, with an ABSOLUTE floor (40 px, against the fix's 68 and the
failure's 7) rather than one derived from the shipped `depth_m`.

**A derived grammar is only as derived as its last typed character class.** The completeness scan
derives its file set from `tools/` and its row prefix from the sources, and left the token BODY as
`[a-z_.]+` — so `[row21:meta.brandNew]` is not an undeclared token, it is not a token at all, and
both completeness checks are silent about it. Anything shaped like a token must now PARSE as one,
or it is a finding by itself. **And the matcher that finds them carries no typed constants of its
own**: the first version was `/\[row\d*:?([^\]\n]{0,80})…/` and a critic escaped it twice, once
with an uppercase prefix and once with a 94-character body — each escape the exact shape the case
was written to close, one level out. It is `/\[row\d/gi` now, the opening shape alone, and the rest
of the line is the case's problem rather than the pattern's. **The last step was the digit, and row
21 paid for leaving it recorded rather than fixed.** This paragraph used to say `[row:meta.noDigit]`,
`[rowXX:meta.foo]` and a tag assembled at runtime were "not a way anyone would write an emit tag" —
and a critic wrote one, `` `[row${ZZROW}:meta.zz_sneaky]` ``, inside `validate-fixtures.mjs` itself,
landing back in the neither-declared-nor-undeclared state the case exists to abolish. **What
separates a tag from prose is not a digit but a SPACE**: this codebase annotates with `[Row 21]` and
`[row 21, round 3]` everywhere and tags with `[row21:name]`, so the hunt is `/\[row(?![ \t])/gi` —
`[row` not followed by whitespace — and everything it finds must parse. A recorded hole is a hole.

**AND A DERIVED SET CAN BE DERIVED FROM THE WRONG PLACE.** The same scan read `tools/` because that
was where every emit site had been; row 21 then minted three clauses in
`design/plan-draft/measured/prompt_lint.py` — a validator like any other, refusing an artifact
before it is made rather than after — and every completeness check in `guards.spec` was silent about
them, including when a critic appended a fourth. `EMITTING_DIRS` names the directories and derives
the files within each, and the four `prompt.*` clauses are declared mechanisms with ledger cases
like every other clause. `prompt.unmeasurable_by_design` is the one case that asserts a PAIR: its
own precondition is that the prompt has no usable anchor, which is another clause's finding, so
what makes it evidence is the discrimination beside it — the same forbidding frame with a ruler in
it trips neither.

**Findings recorded rather than fixed, and here is why.**

- **`approval.lock`'s `undrawn` digest is stale, and every sheet prints so.** Row 20 moved
  `stick1`'s footprint — undrawn content, under §4's standing licence — so both sheets carry
  *"Content the sheet does not draw has changed since then (sha 0987ac56); the drawing is
  unaffected."* That is the designed behaviour, not a defect: the lock's own rule is that `undrawn`
  re-anchors **with** `plan`, and `plan` has not moved because no drawn content changed. Nothing
  reads `undrawn` in the suite, so its staleness is visible only on the sheet's face — degraded
  visibility rather than blindness, since the printed sha is the *current* digest and moves when the
  undrawn content moves again. It is also, incidentally, what pushed the provenance stamp onto a
  second line and so caused four cases to go red at 44630f3. **The next redline re-anchors both.**
- **The header band holds two stamp lines and refuses a third**, with about 240 characters of
  `pending` clause left before it refuses. The refusal is correct — the alternative is printing over
  the plan — but the incentive is wrong way round: the one clause whose job is completeness about
  what a human has *not* seen is the clause that breaks the render when it grows. The band is a
  layout number, not a ruled one, and the honest fix is for it to grow with the stamp. Left for the
  row that next touches the sheet. `wrap_px` also drops to a flat 8 pt the moment it wraps, where
  two lines at a fitted size would fit the column. *(Round-7 critic, G4: the ink band that measures
  the stamp derives its BOTTOM from the rule's y and leaves its top a literal 140. If the stamp's
  first line ever moved up, the band would clip it and ink from the second line would keep the case
  green — the same kind of number at the other end of the same window.)*
- **[Round 7, G2] Retiring the whole gate is still reachable by removal, and nothing in the tree
  records whether Kabe's word ever landed.** Delete `pending`, re-run `draw_plan.py` and
  `render.sh`, `rm -r design/batches/row20-lens/`: 568 passed, 5 skipped, 0 failed, both sheets
  printing a bare `APPROVED 2026-08-21` over a drawing nobody has seen. The coupling made it twice
  as expensive to switch off and made the skips visible, which is real, but the shape is unchanged:
  the row's own target — *"the row closes on Kabe's word on that batch"* — has no representation any
  check can read. **The representation is coming and it is not this row's to build**: the Navigator
  stood up **`design/approvals.log` at `078aee0`** — a committed ledger of every human gate verdict
  with its date, his verbatim word, its scope and the commit it was given against, and the row-20
  batch's own entry sits in it reading `pending-close`. That file is G2's root. The lock's
  requirement becomes a POSITIVE assertion against it — the gate retires when the ledger records a
  verdict, not when a directory stops existing — and **wiring this check to that file was row 21's**;
  **DONE THERE**: `plan.spec` reads the ledger's batch entries, and while one is open the batch it
  names must be in the tree with pictures in it and the lock must carry its `pending` line.
- **[Round 7, G5] Nothing distinguishes an agent editing blueprint §5's number from Kabe ruling
  it.** Moving `MEASURED_BAND`, `gate.py`'s `BAND` and the blueprint sentence together is green, and
  correctly so: the blueprint is the ruling document and reading the law from it is the right
  architecture. Recorded because the parse also makes that sentence's exact markdown
  (`**±3 % of 1010 px**`) load-bearing without the blueprint saying so, and because the same
  approvals ledger is what would eventually distinguish the two edits.
- **[Round 7, H1] A derived caption reproduces an error as faithfully as a truth.** The first
  derived clause counted over the whole manor and said *"of the 88 facings this sheet draws"*, while
  `manor-ground` draws 56 and `manor-upper` 32 — so both sheets printed a number that was false for
  the paper in the reader's hands, and the byte-check guaranteed the lock reproduced it. Deriving a
  claim removes the author's ability to negate it; it does not make the claim true, and for one
  commit it removed everyone's ability to notice. **The words are scoped to the manor now, so they
  are true wherever they are printed** — the alternative, a per-sheet count off the `floor` column,
  stays available and is what to reach for if the clause ever names something a sheet holds only
  part of.
- **[Round 8, J1] A pattern enumerating one phrasing cannot hold prose, and the last repair was
  one.** `approval.lock`'s commentary carried a *"Forty-two of the manor's eighty-eight standpoints
  moved"* that was no baseline's answer; the repair put the computed number into the prose and
  asserted every `/(\d+) of the manor's (\d+) facings/` in the file against it — and a critic typed
  the original false sentence straight back in, in words and with the noun *standpoints*, green,
  along with three other phrasings. The row's own signature defect at its narrowest: a guard written
  against one literal that does not match the literal that caused it. **So the prose states no count
  at all and points at the clause.** The number lives exactly once, where it is computed, and when
  prose states no number there is no number for prose to get wrong — which is the argument the
  `pending` line itself won on. [Ruled by the Navigator at the row-20 close, 2026-08-22, on the
  critic's own first constraint; no verification round follows a deletion whose safety is that there
  is nothing left to be wrong.] The general form, and it is the last thing this row learned:
  **prefer deleting the second copy of a fact to writing a guard that compares the two.**
- **[Round 8, J2] A guard satisfied by its own subject is not a check.** The same repair asserted
  that `approval.lock` states at least one facing count — satisfied by the `pending` line the scan
  ran over, so its only failing state was one the byte-equality three lines above already caught. It
  went with the rest of the machinery.
- **[Round 7] `walkthrough.spec`'s highlight-stall case is timing-sensitive on Firefox.** It failed
  once during a 2.8-minute run of a suite that normally takes 1.6, on a machine loaded by a parallel
  capture, and passed alone and in two clean full runs after. Pre-existing, outside row 20, recorded
  because a red suite was seen and a green one must not be reported in its place.
- **[Round 7, G6] The batch README's BEFORE column of *"the symptom, as a number"* is unread.**
  `geometry.spec` asserts the after values and says honestly of the before ones that they are
  *"quoted here as the before, not asserted"* — but the batch quotes them to Kabe in a table. The
  archive-an-old-tree-and-render pattern that round 6 built for the BEFORE frames is exactly what
  would bind them, and it now exists. Low severity: the code claims nothing the batch does not.

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
sides and cannot see a floor that puts feet at the wrong depth). The stick1 staging change rides §4's own
license, and its value has moved twice. Row 2 tried 0.9 (clear of shelf1 through the shipped
`groundplane.js` — a note here once said otherwise and was wrong) and 0.4 (base plate inside the
bookcase plinth: the mechanism without the quality), and shipped **0.75**. **Row 11 moved it to
0.50**, and the value's home is `plan.json`'s object entry now rather than `staging.json`: giving
the cross passage its own drawn 1.95 m standpoint strengthened the perspective enough that at 0.75
the candlestick dropped nearly clear of the case — 48 crossing opaque pixels against §12.8's floor
of 50. At 0.50 it measures 332. Row 4's real asset needs only h ≥ ~0.11 m.

Witnessed engines: **both, over everything.** `playwright.config.mjs` has run chromium and firefox
across the whole suite since row 2 — the "Firefox smoke after assembly" this line used to describe
is long superseded, and saying otherwise understated what the suite covers. WebKit is unwitnessed on this
machine. Row 2's painterly passes (radial-gradient shadows, `multiply`/`destination-in`,
fractional-scale `drawImage`) are deterministic within the witnessed engine — all §12.2's
letter requires; cross-platform hash stability is accepted residue.

Known limits, still open (row 1's list, updated):
- **Every passage now arrives on a bare facing, and — at V1, measured — the only thing that visibly
  changes is the door leaving the frame.** Row 13's orientation fix means both arrival facings
  (study/W, hall/E) are among §12.6's four deliberately bare facings — nothing composited, no door
  in frame. Measured on the shipped grid: `study/E` (door open, about to leave) to `hall/E`
  (arrival) differs by 23,946 of 1,572,864 pixels (1.52%), and `hall/W`→`study/W` differs by 23,587
  — in both cases every changed pixel is the door itself leaving frame; `hall/E` is 99.91% identical
  to plain `hall/S` (the 1,348-pixel difference is the facing glyph alone). Pre-row-13 arrival was
  not better in magnitude (`study/E`→`hall/W` changed only 6,951 px, the glyph alone) but it was at
  least *uninformative* rather than *actively misleading* — a player who clicks a door and watches
  it vanish, with the veil as the only other signal something happened, reads "the door I clicked
  disappeared," not "I am in another room." This is a V1-only property (real backdrops at row 4
  make the two facings wholly different pictures) but V1 is what the public link serves today, and
  it is worth a specific line — not just "the room is emptier" — in row 5's §12.6 batch to Kabe:
  the sharper claim is that the passage currently reads as the door vanishing, not as a room
  change, and no non-scene signal exists to say otherwise (the scene canvas may not carry one —
  §12.6's hash/capture spec — so any fix is chrome, narration, or Kabe accepting it as V1 residue
  that real backdrops resolve). Reversing a passage also costs two turns with no turn-around
  affordance (§7 has `turn` but no 180°) — accepted as the ruling's direct consequence.
  *Closed by row 12:* "direction of travel" was prose — nothing checked that the hall actually lay
  east of the study in any geometric sense. `tools/validate-plan.mjs`'s world cross-check reads
  each exit's facing off the plan opening's own wall normal and refuses the bake when the fixture
  disagrees; see *The plan machinery* below.
- **Row 13 needs a human visual gate, and does not yet have it.** `design/playbook.md`, read in full
  only at this row's second artifact-critic pass (a gap in what this row was handed, named so the
  next row's brief closes it): "any row that changes what the player sees carries in its done 'the
  human has approved consumption-camera screenshots' … the human's yes closes it." The bullet above
  measures exactly such a change (1.5% of pixels, all of it the door leaving frame). A first attempt
  at closing this row treated it as gate-exempt "by analogy to row 11" — an agent resolving a
  human-scoped question by analogy, which the method does not license, and which a second
  artifact-critic pass correctly rejected. **This is now recorded where it survives the row's own
  close**, since a first correction attempt lived only in `design/specs/13-passage-orientation.md`
  and vanished the moment that file was slated for deletion — the same failure mode twice. The
  actual gate: `design/intention.md`'s row 13 done clause carries the screenshot-approval condition
  directly (see the spec list), the batch itself is committed at `design/batches/
  row13-passage-orientation/` (eleven captures + a README, the same convention row 7's batch used —
  unapproved, deleted once the verdict lands) and mirrored as an Artifact for a laid-out read, and
  the row stays in the spec list — not closed, not deleted from here — until that yes lands.
  Whoever closes this row does so only after confirming that approval, never by re-deriving an
  exemption from this paragraph.
- **`entryRect` — the chrome's idea of an entity's rectangle — ignores parts, and `drawnRect` in
  the renderer does not.** The hover halo sizes its scratch from `entryRect` and then stamps body
  *and* parts into it, and the pointing tolerance measures from the same rect, so a part that
  travels outside the body rect loses its halo and its forgiveness. Not reachable with the
  shipped record — the drawer stays inside the desk's canvas — and nothing goes red if it
  becomes reachable: widening `slide.dx` to −0.55 leaves the whole suite green. **Row 3's
  ingester and row 4's records set `slide` from real art, so this is the row where it stops
  being latent.** The fix is one home for the union (part travel at both ends, swap origin,
  clip), with a check that binds a protruding part to a halo that still traces it.
- **On touch there is no affordance signal at all.** The hover silhouette is the only thing that
  says anything can be touched, and the compatibility hover after a tap is deliberately
  suppressed (otherwise every tap left a permanent halo). This is discoverability, not size, so
  row 8's chrome work and the [HUMAN] apparent-size question do not answer it; whatever does must
  live on the overlay canvas or in DOM chrome, because the scene hash and §12.6's capture rule
  are untouchable.
- **`enumerateNarrationDomain` omits `take.<id>.refused_contained` when the `in`-host declares no
  states, and `handleTake` can emit it.** The fixture validator fences that world, so no fixture
  reaches it — but this module is the stand-in for the Construct transport and the envelope is
  the future wire format, and a world arriving over the wire is not validated. The enumeration's
  predicate should read the condition `handleTake` reads.
- **No favicon**, so the public link's tab carries a generic globe and the browser asks for
  `/favicon.ico`. Zero requests after load on `file://` is intact and measured; this is the one
  request row 6's Pages check will see.
- The network guard's WebSocket half fires only on a successful handshake (construction-vs-
  handshake hole; row 2 added no network seam). Hardening constraint unchanged: detect
  construction via an `addInitScript` shim.
- **Nothing on the surface tells a visitor that anything can be touched** except the hover
  highlight, which touch devices do not have; and the V1 legibility cheats leave the coin at
  ≈6 logical px. Row 9 allocates the intro that would say so; row 4's asset scale probe is the
  real fix for the second half.
- Closed by row 8: **the `vh` fallback beneath `svh`** (a preceding `vh` declaration in `#stage`'s
  width calc, so an engine with neither `svh` nor `dvh` support degrades to the row-1-safe
  behaviour instead of dropping the whole rule).
- **The favicon, sharpened** (was: "no favicon, the one request row 6's Pages check will see"). A
  browser requests `/favicon.ico` regardless, so on Pages the *absence* is itself a post-load
  request, and row 6's done clause requires zero. **Owner: row 6**, which must ship an icon or
  declare an inline `data:` one. Whether §12.7's "zero requests after load" even reaches a
  browser-initiated favicon fetch is **Kabe's to rule** — this is not a request an agent may
  license away against a standing *never do*.
- **Narration arriving over the wire is unguarded.** Blueprint §8 makes the envelope the future
  websocket wire format and its `narration` string goes straight to the pane, so a wire-delivered
  line naming a module would land on the surface. Out of row 7's domain because no transport ships
  in M0 (and `updateChrome` already refuses a non-string); owner is the row that builds the
  transport.
- **The narration pane is a log, and a log is a readout.** It accumulates, so a player who has
  acted five times reads a transcript stacked under the picture — which touches "standing
  somewhere, not looking at a diagram". Chrome *form* rather than a string, so row 7 left it; it
  is in that row's batch to Kabe and in `design/surface-strings.md`'s `QUESTIONS`.
- **Text painted into art is inside the surface-string domain and cannot be swept.** A book spine
  or a tapestry motto in a generated backdrop is a string the surface shows a player, in nobody's
  authored voice. None exists at V1. **Row 4's prompt sheets are the only place it can be
  prevented.**
- **What the deploy serves is wider than what the page renders.** Pages serves `main` root, so
  every design document — this one, and `design/surface-strings.md` — is fetchable at the public
  link, dense with method vocabulary. Nothing on the page links to them, and row 7's domain is
  what `index.html` renders; but the complaint that created that row was framed as *what a stranger
  at the alpha link can read*, so the boundary is recorded rather than assumed, and it is in
  `QUESTIONS`.
- **No committed cross-commit canvas guard** (narrowed by row 11). Row 7 proved the canvas did not
  move by capturing the hash sequence at the parent commit and again after, with a harness
  deliberately not committed (the suite carries no goldens by design). Nothing in the committed
  suite can detect a canvas change caused by CHROME work, and rows 8 and 10 kept the promise by
  hand; row 9 still owes it. What row 11 added covers the geometry half instead: every facing's
  corner columns, floor line, eye line, transverse rows and each staged entity's baseline and
  drawn height are now PREDICTED from per-facing literals and measured off the render, so a
  geometry change that nobody intended goes red on the facing it broke. On a row where every frame
  moves for a stated reason, that is the only witness worth having — "every changed pixel changed
  on purpose" discriminates nothing.
- **Per-turn repaint cost, and row 21 added to it.** A facing with an open doorway now renders the
  destination room into a full-frame offscreen as well: `study/E` measures 63.9 ms against 12.9 ms
  with the device off, unthrottled and through `render` directly. Same shape as the bullet below —
  a full-frame scratch where a rect would do — and the same fix.
- **Per-turn repaint cost.** `render` allocates two full 1536×1024 offscreen canvases per entity
  per frame (composite, then tint), which measures ≈270 ms at 4× CPU throttling and ≈410 ms at
  6× on the furnished study facing. Row 11 added the returns' line work and two clip paths per
  frame, and measured the two facings that bound it rather than one: through `renderer.render`
  directly at 4× / 6× CPU throttling, the furnished `study/N` runs **127 / 179 ms** and the bare
  `hall/E` — the most return area in the fixture (84 % of frame) and its deepest camera — runs
  **6 / 9 ms**. So the returns are not the cost; the per-entity offscreen canvases are, exactly as
  this bullet already said. (The 270/410 ms above was measured through the page's own turn path,
  not through `render` alone, so the two numbers are not comparable and row 11 claims no
  improvement — only that it added no measurable cost.) Bounding the scratch to each entity's drawn rect is the fix
  and it must not move a hash; left alone at V1 deliberately, since every §12.2 guarantee is
  pinned to the current pixel output.
- **Corrected: the stage was never actually top-aligned on a phone** by the time this bullet was
  last touched — the page is vertically centred (see "index.html chrome" above,
  `justify-content: center`), measured directly at 390×844: 231 px above the stage, 231 px below
  it once the 121.6 px chrome reserve is accounted for. This sentence used to claim otherwise and
  attributed the fix to row 8; row 8 closed without needing to touch it, because there was nothing
  live left to fix. What is still true and still open: at 3840×2160 the fixed 1536×1024 backing
  store upscales and softens (no `devicePixelRatio` handling — adding it would move every hash,
  worth naming before row 4's halo-sensitive flip test). No row owns this yet.
- **WebKit is unverified by anyone** — it will not launch on this machine, and Safari/iOS is the
  likeliest engine for a phone visitor at the public link. Firefox was checked by hand and
  diverges only in anti-aliasing (max channel delta ~36 on grid strokes and the shadow
  gradient), so cross-engine geometry is sound where it could be tested.
- Closed by row 2: the refusal-vs-identical-redraw ambiguity (paint counter) and the stale
  shell-test title.
- Closed by row 13 (second pass): the double-click echo guard's coverage gap. A first pass deleted
  it as untestable residue on a false claim that no fixture could re-trigger it; the second pass
  restored it, corrected the claim, and gave it a real test against a doctored corridor — see
  *Harness and envelope*'s `go` veil bullet above.
- Closed by row 13: `arrive_facing` driving the post-`go` viewstate had no test of its own once the
  validator began enforcing `arrive_facing === facing` (the two fields became indistinguishable on
  any fixture the project can ship) — `tests/playwright/harness-refusals.spec.mjs` now proves it at
  the harness level, against a doctored world built directly against the API, bypassing the
  validator by construction.
