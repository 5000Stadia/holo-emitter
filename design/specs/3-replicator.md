# Spec row 3 — plan

Row 3 in `design/intention.md`'s spec list. Target and done live there; nothing is copied here.

Built to blueprint §4b rule 1: **every stage is an importable pure function and the CLI is a thin
wrapper**. "Pure" is used strictly here — a stage function performs no file I/O, opens no network,
reads no clock or RNG, mutates none of its arguments, and returns the same value for the same
inputs. All decoding, encoding and writing happens in the CLI layer. A future live host imports
the same functions and feeds them decoded frames instead of files (§4b rules 1 and 5).

---

## 1. Environment, and the one command

`python3` 3.12.3, `numpy` 1.26.4 (installed at plan time via `apt-get install python3-numpy` —
it was absent), `Pillow` 10.2.0 (already present). No other dependency, ever: `pip` is PEP-668
blocked on this machine, and the blueprint pins PIL + numpy only.

The documented one command, headless, from the repo root:

```
python3 -m unittest discover -s replicator/tests -t . -v
```

`-t .` puts the repo root on `sys.path`, so `replicator` imports as a package. This goes in the
README beside the Playwright command and in `design/architecture.md`.

## 2. Files

```
replicator/
  __init__.py         package marker (empty)
  contract.py         load + validate contract.json -> dict; threshold accessors (pure)
  matte.py            stage 1
  anchors.py          stage 2
  parts.py            stage 3
  states.py           stage 3b
  thumbs.py           stage 3c
  gates.py            stage 4 (a-e)
  record.py           stage 5 (the §6 dict)
  pipeline.py         ingest_sprite(...) -> IngestResult; pure, in-memory, no I/O
  maskgen.py          scripted polygon -> mask array (pure) + thin CLI
  synth.py            deterministic constructed source images, incl. the negative controls
  ingest.py           the CLI: argparse -> decode -> pipeline -> encode -> write
  contract.json
  tests/              unittest modules, one per stage plus the cross-cutting ones
```

Blueprint §2's layout names `replicator/ingest.py`, `contract.json` and `tests/`; the extra
modules are an addition, not a contradiction — §4b rule 1 requires the stages to be importable
somewhere, and a single file holding both the stages and the CLI cannot demonstrate that the CLI
is thin. `design/architecture.md` records the split and §2's layout gains the directory listing.

Images cross module boundaries as **`numpy.ndarray`, shape (H, W, 4), dtype uint8, RGBA,
straight (non-premultiplied) alpha**. Masks cross as `(H, W)` bool. This is the one internal
representation; PIL appears only in `ingest.py` (decode/encode), `maskgen.py`'s rasteriser and
`parts.py`'s cavity blur.

## 3. Contract (`replicator/contract.json`), authored before the corpus runs

§10's blocks verbatim, plus two new blocks. Three deviations from §10's literal text, each with
its reason — the standing license, and both are cases where §10's prose has been overtaken by a
later dated ruling elsewhere in the same blueprint:

1. **`prompt_block` says "camera at 1.6m eye height"; `camera.eye_height_m` in the same object
   says 1.83.** The intention's quality 5 names the contract's eye height as "6 ft, pitched
   slightly down, per Kabe's 2026-08-20 ruling" — 1.83 m. The JSON field was updated by that
   ruling and the prose sentence was not. The authored contract says 1.83 m in both places, and
   blueprint §10's shown JSON is corrected in the closing commit with an `[AI, row 3]` note.
2. **`backdrop_block`'s light clause is superseded.** §10 shows "overcast diffuse daylight
   through any window, no visible sun shafts"; blueprint §11 marks exactly that phrasing
   *superseded 2026-08-20 by Kabe's look reference* — warm practicals against a cool window — and
   says the real light design lands in Kabe's probe loop. Authoring the superseded phrase into
   the file every backdrop prompt appends would hard-code a look Kabe has already ruled against.
   The authored `backdrop_block` therefore carries §10's geometry and framing clauses verbatim
   and replaces the light clause with one that (a) keeps the invariant the renderer depends on —
   one dominant key per frame, its direction and colour named by that facing's own prompt sheet —
   and (b) forbids the tells §10's `negative_block` already forbids (rim light, vignette, sun
   shafts across the floor). This is the block's authoring, which §10 assigns to row 3.
3. **`style_block` is untouched** — the placeholder string §10 shows, verbatim, extracted at
   row 4.

New blocks, both required by the row text ("thresholds PINNED in `contract.json` BEFORE the
corpus runs"):

```
"gates": {
  "halo":   { "edge_bg_distance_min": 18.0, "edge_interior_saturation_ratio_min": 0.55 },
  "holes":  { "tolerance": 26, "min_area_px": 12 },
  "resolution": { "min_content_height_px": 512, "min_content_height_px_takeable": 128 },
  "state_diff": { "max_mean_abs": 1.0, "max_pixels_over": 0, "pixel_over_threshold": 8 },
  "light":  { "max_deviation_deg": 30.0 }          // warn only
},
"ingest": {
  "matte": { "tolerance": 14, "hole_min_area_px": 8, "feather_px": 1, "rgb_bleed_px": 2 },
  "cavity": { "darken": 0.45, "blur_radius_px": 6 },
  "thumb":  { "size_px": 128, "content_px": 112 },
  "period": { "earliest": 1640, "latest": 1700, "region": "England" }
}
```

Every threshold is pinned at plan time from the synthetic corpus in `synth.py` and from the
placeholder library's own measured values (the cavity `0.45` is `src/placeholders.js`'s recess
factor, and mechanisms.spec's body/part luminance ratio < 0.7 is what it has to keep satisfying).
**No threshold moves after the real corpus arrives.** If a corpus image fails, the failure is
reported as a failure and the fix is the image or a named, reasoned, documented contract change
committed as its own visible act — never a silent retune. The plan says this here so the artifact
critic can check the git history for it.

`contract.py` validates the file on load: required keys present, thresholds numeric and in range,
`light.key` a known token. A malformed contract is a hard error naming the key — the gates cannot
run on defaults, because a gate reading a default nobody pinned is the "gate tuned until the
corpus passes" failure wearing different clothes.

## 4. Stage 1 — matte (`matte.py`)

`matte(src_rgb, *, tolerance, hole_min_area_px, feather_px, rgb_bleed_px) -> MatteResult`
with `MatteResult = (rgba: ndarray, trim_offset: (x, y), bg_color: (r,g,b), stats: dict)`.

1. **Background colour** = per-channel median of the 1-px border ring of the source (§9.1).
2. **Similarity mask** = Euclidean RGB distance to `bg_color` ≤ `tolerance` (vectorised).
3. **Outer background** = the connected component(s) of the similarity mask reachable from any
   border pixel, 4-connected. Implemented as a scanline span fill over the boolean mask seeded
   from every similar border pixel — deterministic, no dependence on PIL's flood-fill internals,
   and O(pixels). (`ImageDraw.floodfill` was the alternative; it seeds from one point and
   compares against that seed's value, so it would need the image padded with a synthetic frame,
   and its behaviour is an implementation detail of Pillow rather than of this pipeline.)
4. **Enclosed holes.** The similarity-mask components *not* reached in step 3 are enclosed
   background-coloured regions inside the silhouette (the leg gaps). Components with area ≥
   `hole_min_area_px` are punched to alpha 0; smaller ones are left opaque (a 3-px speck of
   near-grey inside an oak panel is noise, not a leg gap) and their count is reported in `stats`.
5. **Feather 1 px, inward only.** The outermost ring of *object* pixels (opaque pixels 4-adjacent
   to a transparent one) gets alpha = 255 × (3×3 mean of the binary object mask). Interior stays
   255, transparent stays 0. Feathering outward would extend the silhouette over pixels that are
   literally the background colour — manufacturing the halo gate (a) exists to catch.
6. **Premultiplied-safe RGB.** Transparent pixels carry no source colour: RGB is bled outward
   from the opaque region by `rgb_bleed_px` iterations of "mean of opaque 4-neighbours", and set
   to that bleed elsewhere; fully-isolated transparent pixels get `bg_color`-free black. Under
   bilinear filtering or a premultiply/unpremultiply round trip this cannot fringe with the grey
   ground. The semi-alpha ring keeps its *source* RGB (that is the pixel evidence gate (a)
   reads); colour decontamination of that ring is explicitly not v1.
7. **Trim** to the alpha > 0 bbox. `trim_offset` is the bbox's top-left in source coordinates and
   is returned, not swallowed — every later stage that speaks source coordinates (manual anchor
   flags, part masks, state registration) translates through it.

*Two-tolerance design, stated because it is what makes gate (b) able to fail:* the matte uses
`ingest.matte.tolerance` (14) and gate (b) re-hunts enclosed regions at the looser
`gates.holes.tolerance` (26). A leg gap whose interior is a slightly graded grey escapes the
matte's net and is caught by the gate's wider one. If both used one number, gate (b) could never
go red by construction, which is a green light pretending to be a gate.

## 5. Stage 2 — anchors (`anchors.py`)

`derive_anchors(rgba) -> {"base": {...}, "footprint": {...}}`, and
`apply_manual_regions(anchors, regions, trim_offset, px) -> anchors`.

The geometric derivation follows the convention row 2 pinned and mechanisms.spec witnesses
(`tests/playwright/mechanisms.spec.mjs`, "px, base and footprint are what the pixels say they
are") **exactly**, because the ingester's records must satisfy that same witness at row 4:

- `bottom` = the highest-index row containing a pixel with alpha ≥ 128 (after trim this is
  `H - 1`).
- `x0..x1` = the inclusive x-extent of alpha ≥ 128 pixels across rows `bottom-1` and `bottom`.
- `base = { x: (x0 + x1 + 1) / 2, y: bottom + 1 }` — so `base.y` is the image's own bottom edge.
- `footprint = { x0: x0, x1: x1 + 1 }` — **x1 exclusive**, matching the derived value that spec
  compares against.

Manual regions arrive as `--anchor surface_top:x0,y0,x1,y1`, repeatable. **They are given in
source-image pixel space** — the operator measures on the image they can open — and the ingester
translates them by `trim_offset` into sprite space, which is what §6 stores. The CLI prints the
trim offset and both rectangles so the translation is visible. A region that lands outside the
trimmed canvas, or with `x0 ≥ x1` / `y0 ≥ y1`, is a hard error naming the region and both
rectangles; it is never clamped, because a clamped anchor is a record lying about where a thing
is. Region names are free-form (the validator only bounds-checks them), but `surface_top` and
`drawer_cavity` carry the §6/§9.3b semantics and `drawer_cavity` means *where contents are
visible when open*, in body pixel space.

VLM auto-detection is v2: `anchors.py` exposes `detect_regions(rgba, ask)` where `ask` is an
injected `(prompt, schema) -> json` callable, defaulting to `None` → raises `NotImplementedError`
naming §9.2 v2. The seam exists (§4b rule 5) and nothing calls it.

## 6. Stage 3 — parts (`parts.py`)

`cut_part(body_rgba, mask, *, darken, blur_radius) -> (part_rgba, part_origin, body_with_cavity)`.

- The mask PNG must be the **same dimensions as the source image**; it is translated by
  `trim_offset` like everything else. A size mismatch is a hard error naming both sizes — a mask
  authored against a different canvas silently cuts the wrong pixels.
- Mask semantics: luminance ≥ 128 (or alpha ≥ 128 where the PNG has alpha) is "part".
- The part image is `body_rgba` where mask, alpha = body alpha ∧ mask, trimmed to its own bbox;
  `origin` is that bbox's top-left **in body pixel space**, which is the §6 `parts[].origin`
  contract and what the renderer adds to the host's placement.
- **Cavity inpaint:** in the body, the masked region is filled by iterative neighbour-average
  propagation inward from the region's boundary ring (content-aware in the cheap sense §9.3
  licenses), then Gaussian-blurred at `blur_radius_px`, then multiplied by `cavity.darken`
  (0.45). Body alpha inside the cavity stays as it was — the drawer hole is not a hole in the
  desk. This mirrors `src/placeholders.js`'s recess exactly, and a unit test asserts the same
  body/part mean-luminance ratio (< 0.7) that mechanisms.spec asserts on the placeholders.
- `slide` comes from the CLI as `--slide dx,dy,scale_open` and is **paired positionally with the
  most recent `--part`**; a `--part` with no `--slide` is a hard error (there is no honest
  default travel for a drawer nobody measured). `states` defaults to `{"closed": 0.0,
  "open": 1.0}`, which is the two-state pin the shipped validator enforces.
- Multiple parts are supported (loop); M0 uses one.

**Scripted polygon masks** (`maskgen.py`) — the row text's "agents have no hands to draw":
`polygon_mask((w, h), [(x, y), ...]) -> bool ndarray` (pure; PIL `ImageDraw.polygon` rasteriser,
deterministic) and `rect_mask((w, h), x0, y0, x1, y1)`. Thin CLI:
`python3 -m replicator.maskgen --size WxH --poly x,y x,y ... --out mask.png`, and `--rect`. The
ingester consumes the PNG this writes — the same file §9.3 names, no private channel.

## 7. Stage 3b — two-state (`states.py`)

`prepare_state(state_src, body_matte, *, name, origin_override) -> StateResult`.

The open image runs through stage 1 with the same contract values. **The registration problem
§9.3b leaves open is solved as follows**, and both halves are implemented:

- **Default — shared-source-canvas registration.** Two state images generated from one prompt
  sheet arrive on the same canvas with the object in the same place; §11's own device (the door
  frame stays in frame) is what holds that true. So
  `origin = state_trim_offset - body_trim_offset`, computed exactly from the two independent
  trims. This requires the two *source* images to have identical dimensions: if they do not, it
  is a hard error telling the operator to supply the override, never a guess.
- **Override — `--state-origin open:x,y`**, in closed-sprite (body) pixel space, for pairs whose
  sources do not share a canvas.

`states_images` is emitted as row 2 bound it: `{"open": {"image": "states/open.png", "origin":
{"x":…, "y":…}}}`. Each state image is trimmed per image (stage 1 untouched). The single
`anchors` block stays the closed state's. **`extent` is deliberately not written into the
record** — architecture.md defines it as build-time presentation data derived from the state
image's own bottom-two-rows alpha ≥ 128 scan offset by `origin.x`, reproduced by row 4's bake.
Writing it into the record would create a second home for a derived fact.

**The alignment gate**, in the closed frame, per §9.3b as amended (the base-midpoint clause is
deleted for swap sprites):
 (i) `|origin.y + state_h − body_h| ≤ 0.02 × body_h`;
 (ii) `origin.x ≥ 0`, `origin.y ≥ 0`, `origin.x + state_w ≤ body_w`, `origin.y + state_h ≤
 body_h`.
Both hard-fail with the measured numbers printed. Clause (ii)'s non-generality (a raised chest
lid exceeds the closed bbox) is repeated in the failure message so the operator meets the known
exception at the moment it bites, rather than in a document.

Gate (d) does not run on swap sprites; gate (e) runs on both images and reports both.

## 8. Stage 3c — thumbs (`thumbs.py`)

`make_thumb(rgba, *, size_px, content_px) -> ndarray`. Content bbox scaled so its longest side is
`content_px` (112), nearest-neighbour, centred on a transparent `size_px` (128) square. Nearest
neighbour, not bilinear: it is deterministic across Pillow builds and it cannot invent
semi-transparent pixels along the edge, which would walk straight into gate (a) on the thumb.
Mirrors `src/placeholders.js`'s `makeThumb` so the inventory strip's V1 and V2 look the same
size. `--takeable` emits it, sets `record.takeable = true` and `record.thumb = "thumb.png"`. The
thumb gate: a takeable record without a square `size_px` thumb is a hard fail; a non-takeable
that somehow carries one is also a hard fail (a record that lies the other way).

## 9. Stage 4 — gates (`gates.py`)

`run_gates(artifacts, contract) -> [GateResult]`, `GateResult = (id, severity, passed, measured,
threshold, message)`. Pure: it reads the in-memory artifacts and the contract dict, returns
findings, prints nothing. Every gate reports its measured value whether it passes or fails, so a
green gate is auditable and a threshold that is nowhere near being exercised is visible.

- **(a) halo.** Two clauses over the semi-alpha ring (0 < alpha < 255), both pinned, either
  fails:
  - a1 `edge_bg_distance_min` — mean Euclidean RGB distance of ring pixels from the sampled
    `bg_color` must be ≥ 18. A halo is precisely an edge that reads as the ground.
  - a2 `edge_interior_saturation_ratio_min` — mean HSV saturation of the ring must be ≥ 0.55 ×
    the mean saturation of a 2-px band just inside the ring.
  §9.4's letter is "mean saturation of border-adjacent semi-alpha pixels must not read grey".
  Taken alone as an absolute saturation floor that clause **false-fails an honestly grey object**
  — and M0's takeables are an iron key and a silver coin. a2 keeps the clause's intent (the edge
  washed toward grey *relative to the object*) without punishing an object that is grey
  throughout; a1 is what actually catches a grey halo on grey ground, including on a grey object.
  Recorded as an `[AI]` deviation with this reason in architecture.md.
- **(b) holes.** Enclosed regions of the *final* body, at `gates.holes.tolerance` (26) and
  ≥ `min_area_px` (12), still carrying alpha > 0 → fail, reporting count and largest area.
- **(c) min resolution.** Content bbox height ≥ 512 px, or ≥ 128 px when `--takeable`.
- **(d) state diff.** Only for records with parts. `composite(body_with_cavity + part @ closed)`
  versus the matted original *before* inpainting; the diff is measured **outside the part's
  closed mask**, over pixels either image calls opaque. Fails if mean absolute channel diff >
  `max_mean_abs` (1.0) or if any pixel exceeds `pixel_over_threshold` (8) — i.e. the inpaint may
  not have leaked outside the part it was cut for, and the part may not have been cut from
  somewhere other than where it is put back.
- **(e) light direction — warn only.** Sobel over the object's luminance, masked to the interior
  (opaque, eroded 2 px so the matte edge itself contributes nothing — the silhouette boundary is
  the strongest gradient in any matted sprite and it points everywhere at once). The estimate is
  the |gradient|-weighted mean gradient vector, which points from dark toward light; the angle is
  compared to `UL45` (upper-left, i.e. `(-1, -1)` in image coordinates with y downward). Reports
  the deviation in degrees; warns above `max_deviation_deg` (30). Never blocks. The deviation is
  written into the record at `provenance.gates.light_deviation_deg` and, for two-state sprites,
  per image.

**Hard-fail behaviour:** the pipeline runs to completion in memory and gates run before anything
is written. On any hard failure the CLI writes **nothing at all** and exits non-zero with the
numbered gate report on stderr; `library/<id>/` is never left half-built. `--report PATH` writes
the same report as JSON for a caller (the asset seat's autonomous lane at row 4 reads it).

### The §9.4 negative control

`synth.py` holds `negative_control_halo()` — a deterministic constructed image, an object on
mid-grey with a soft grey halo feathered around it, built so the halo survives the matte's
tolerance and lands in the semi-alpha ring. `replicator/tests/test_negative_control.py` asserts
the full pipeline **fails gate (a)** on it and that the CLI exits non-zero and writes no files.
It is also reachable by hand: `python3 -m replicator.synth --case halo --out /tmp/nc.png`, so a
critic can run the shipped ingester on it without reading the test.

`synth.py` carries one constructed must-fail image **per hard gate** — halo (a), enclosed grey
hole outside matte tolerance (b), undersized (c), leaked inpaint / mis-cut part (d), misregistered
two-state pair (alignment gate) — plus a wrong-light image for (e) that must still *emit* while
recording the deviation. §9.4 names one negative control; making it five is what turns "every gate
goes red when you break what it guards" into a test the suite runs rather than a claim a report
makes.

## 10. Stage 5 — record (`record.py`)

Emits the §6 record as row 2 bound it — the shape `src/placeholders.js` carries and
`tools/validate-fixtures.mjs` checks: `schema` `"sprite/0.1"`, `id`, `noun`, `archetype`,
`attachment`, `dims_m {h,w,d}`, `px {w,h}`, `view_side`, `light`, `period`, `anchors`, `parts?`,
`states_images?`, `takeable`, `airborne`, `thumb?`, `provenance`.

- `px` is the matted body's own size; `anchors.base`/`footprint` are derived from its pixels
  (§5 above). Architecture's **"a record cannot lie about its own pixels"** clause is inherited
  by construction: these three are computed, never taken from a flag, and a unit test re-derives
  all three from the written PNG with an independent implementation and compares.
- `attachment` vocabulary: `floor_against`, `floor_free`, `wall_mounted`, and the row-2 minted
  **`anchored`** for anchor-hosted takeables. Any other token is a hard error listing the four.
- `archetype`: `static`, `sliding`, `swap`. `--part` without `sliding`, or `--state` without
  `swap`, is a hard error — an archetype that disagrees with the artifacts beside it is the
  §7 draw path picking the wrong branch.
- `dims_m`. `--height-m` is required. The validator requires all three of `h`, `w`, `d` to be
  numbers > 0, so neither may be omitted or null. Rather than invent them: the operator gives
  `--width-m` **or** `--depth-m`, and the ingester **derives the other from the pixels and the
  contract's camera geometry** — at `turn_deg` 30, the drawn width of a box footprint is
  `w·cos30 + d·sin30`, and the drawn width in metres is `px.w / (px.h / h)`. Given one, the other
  follows. Given both, the pair is checked against the pixels and a disagreement over 15% is a
  **warn** with both numbers printed (a three-quarter view of a non-box object legitimately
  deviates). Given neither, hard error naming both flags. A derivation that comes out ≤ 0 is a
  hard error — the declared width contradicts the image, which is a real signal, not a number to
  clamp.
- `period` from `--period-earliest/--period-latest/--period-region`, defaulting to the contract's
  `ingest.period` block (1640/1700/England — M0's material world, one home).
- `light` = `contract.light.key`. `view_side` = `--view-side`, defaulting to `contract.camera.side`.
- `airborne` = `--airborne` (default false).
- `provenance` = `{"source": "generated", "tool": "replicator-ingest-v1", "contract_schema": …,
  "gates": {…measured values, including the (e) deviation…}}`. Extra provenance keys are already
  precedent (`src/placeholders.js` carries two).
- Emitted JSON is sorted-key, 2-space, LF, trailing newline — byte-deterministic, so a re-ingest
  of the same image produces the same bytes and a diff means something changed.

Written layout: `library/<id>/sprite.png`, `record.json`, `parts/<part>.png`, `states/<name>.png`,
`thumb.png`. `--out` defaults to `library/`. Existing files are overwritten (row 4 supersedes
this row's desk through the same gates); nothing outside `library/<id>/` is ever written, and
nothing is deleted.

## 11. The CLI (`ingest.py`) is thin

`main(argv) -> int`: parse → open the named files with PIL and convert to ndarray → call
`contract.load()` → call `pipeline.ingest_sprite(...)` (one call, everything else is arguments) →
if all hard gates pass, encode and write → print the report → return the exit code. No stage
logic lives here, and the test suite proves it rather than asserting it: a test runs
`pipeline.ingest_sprite` on in-memory arrays and byte-compares its encoded outputs against the
files the CLI writes for the same inputs.

Exit codes: `0` pass (warnings allowed), `2` gate failure, `3` bad usage / malformed input.
Human report on stderr, machine report via `--report PATH`, stdout stays quiet unless `--json`
is passed (in which case stdout is the report and nothing else) — blueprint's CLI decision
hierarchy: on stdout machine-readable beats friendly, on stderr friendly beats machine-readable.

## 12. Tests (`replicator/tests/`)

stdlib `unittest`, no third-party runner. Every image input is constructed in `synth.py`; no
binary fixtures are committed. Modules:

- `test_matte.py` — background sampling; tolerance behaviour; a donut punches its hole; a 3-px
  speck does not; the feather ring exists and is inward (no alpha > 0 pixel is bg-coloured);
  transparent RGB carries no ground colour; trim is exact and `trim_offset` correct.
- `test_anchors.py` — base/footprint on a shape with a narrow foot (the coin lesson: footprint is
  the bottom-row extent, not the full width); manual regions translate by `trim_offset`;
  out-of-canvas and inverted regions are errors; `detect_regions` raises without a callable.
- `test_parts.py` / `test_maskgen.py` — cut, origin, part alpha ⊆ body alpha, cavity mean
  luminance < 0.7 × part mean luminance, mask-size mismatch error, polygon rasterisation
  determinism.
- `test_states.py` — shared-canvas registration is exact; the override wins when given; the
  alignment gate passes a true pair and fails a misregistered one on each clause separately.
- `test_thumbs.py` — 128×128, content centred, takeable-only, thumb recorded.
- `test_gates.py` — each of a–e green on a clean synthetic sprite, then **red on its own negative
  control**, one test per gate; (e) stays warn-only and still emits.
- `test_negative_control.py` — §9.4's named control fails, end to end, and writes nothing.
- `test_record.py` — full §6 field set; JSON-clean round trip; attachment/archetype vocabularies;
  dims derivation and its failure modes; byte-determinism of two runs.
- `test_pixel_truth.py` — px, base and footprint re-derived from the *written PNG* by an
  independent implementation of mechanisms.spec's own algorithm, compared to the record.
- `test_bound_shape.py` — **deserialization equivalence.** Reads the emitted `record.json` + PNGs
  from disk and builds the row-2 bound library shape (`{record, images:{body, parts, states:{
  image, extent}, thumb}}`), asserting `images.parts` keys equal `record.parts[].id`,
  `images.states` keys equal `record.states_images` keys, and `extent` computed from the state
  image's bottom-two-rows alpha ≥ 128 offset by `origin.x`. Then it shells out to `node` and runs
  the **shipped** `tools/validate-fixtures.mjs` `validate()` over `fixtures/demo-study` with the
  emitted desk record substituted for the placeholder `desk-joined-oak-1660`, asserting zero
  findings. That is the real arrival test: the record row 4 will ship has to survive the
  validator the demo already runs.
- `test_cli.py` — CLI equals pure pipeline byte for byte; exit codes; nothing written on gate
  failure; `--report` JSON shape.
- `test_contract.py` — the shipped `contract.json` loads, carries §10's blocks and both new ones,
  and a malformed contract is an error naming the key.

The synthetic desk in `synth.py` is built to the same authoring conventions as the placeholder
desk (drawer front on a body that gets a cavity, a stretcher rail at the foot) at ≥ 512 px tall
so gate (c) is met, and the synthetic door pair to the swap contract. They are stand-ins for the
corpus, not replacements: the corpus run is a separate, reported act.

## 13. The corpus, and `desk-joined-oak-1660`

`library-src/corpus/` does not exist at plan time. Order of work: contract → stages → tests →
then the corpus when it lands. When it lands: run both desk generations through the shipped
ingester unchanged, with the thresholds already committed; the teardrop-pull desk is ingested as
`desk-joined-oak-1660` into `library/` with `--part drawer_front:…` from a scripted polygon mask
and manual `--anchor surface_top:…` and `--anchor drawer_cavity:…` flags measured off the source.
The commands used are recorded verbatim in `design/architecture.md` so row 4 can re-run them.
`library-src/` is the asset seat's lane: **read only**, never written by this row.

If the corpus is still absent when the structure and tests are green, that is reported as a
result — the row's done clause names the desks, and a desk that does not exist cannot be
ingested. The `library/` artifact would then be missing and the row cannot close; the honest act
is to say so rather than to substitute a synthetic desk for it.

The intention's row 4 says the probe desk **supersedes** this one. So this desk is emitted
honestly and not preciously: no hand-tuning of thresholds to flatter it, no pixel surgery, and
its gate report goes in the final message whatever it says.

## 14. `design/comparison-criteria.md` — §12.10's per-quality loss criteria

Authored in this row, before any backdrop or composite exists, and frozen. One section per
decomposed quality (one light; contact; occlusion chains; one hand; the camera has feet), each
stating:

- **The judged population**, explicitly — per object present, per grounded object, per staged
  overlap pair, per facing-with-objects, or per facing. §12.6 licenses four facings (study S/W,
  hall E/S) to be deliberately bare, and their pairs assert composite == backdrop exactly. So:
  contact and occlusion are judged **per object / per pair present**, and a bare facing
  contributes zero to their populations — it can neither lose them nor win them. One light and
  one hand are judged per facing **that has at least one object**. The camera has feet is judged
  **per facing, all eight**, because it is a property of the frame and its horizon and a bare
  facing carries it fully.
- **The observable tell** — what the grader must be able to see and name, in the §12.6 capture
  (scene canvas, native 1536×1024, cold `file://`, no chrome, no hover), citing the capture file
  and the object id.
- **The comparison rule** — when ours loses, when it ties. Two shapes: a *rate* rule (marked
  members ÷ population, ours loses if it exceeds the anchor's by more than one member) and a
  *contradiction* rule (a single instance of a named contradiction the anchor never shows loses
  the quality outright). Occlusion carries a third: **zero pairs in the whole set is a loss, not
  a vacuous win** — a build with nothing overlapping anything has not met the quality, it has
  avoided being judged on it.
- The tie rule from the method (*a tie is not a loss and closes the quality*), and §12.10's own
  honesty note that this is criterion-anchored, not blind.

The document says at its head that it is frozen at row 3's close and that changing a criterion
after a composite exists is a visible, dated, reasoned act — the whole point of authoring it now.

## 15. Edges — what this must not touch, and what feels it

**Must not touch.** `src/`, `index.html`, `fixtures/`, `tests/playwright/`, `tools/` — row 3 adds
no product behaviour and the Playwright suite must stay green **unmodified**. `backdrops/` and
`library-src/` are the asset seat's lane (`library-src/corpus/` is readable input only). No
AgentPost mailbox. No other spec row.

**Feels the change.**
- `library/` comes into existence. Nothing in the running demo reads it yet — row 2's library is
  procedural, and architecture.md fixes row 4's bake (`tools/bake-library.mjs`) as the route from
  files to the page. Adding a `library/` directory changes no rendered pixel, so the Playwright
  suite is unaffected; `test_bound_shape.py` is where the two worlds meet.
- `tools/validate-fixtures.mjs` is *read and executed* by `test_bound_shape.py`, never modified.
  If the emitted record makes it go red, the record is wrong, not the validator.
- `design/blueprint.md` §2's layout listing and §10's shown JSON are brought true in the closing
  commit (the contract file becomes the home; §10 shows it).
- `design/architecture.md` gains the replicator section row 4's builder boards from: the module
  map, the pure-function seam, the pinned thresholds and *why* each is where it is, the two
  documented deviations (gate (a)'s two clauses, `dims_m` derivation), the exact corpus commands,
  and what row 4 inherits (the bake reproduces `extent` and `px`; the probe desk overwrites this
  one through the same gates).
- `README.md` gains the replicator's one command and one paragraph for the stranger — in the
  product's voice, no method vocabulary.

**Risks named up front.**
- *Border-median background sampling fails on a source whose object touches the border.* The
  contract's `framing.margin` is "full object centered", so a touching object is a contract
  violation; the ingester detects it (object pixels in the border ring after flood fill) and
  fails loudly rather than matting a bitten silhouette.
- *Gate (a) on a genuinely grey object* — handled by the two-clause design above; the residual
  risk is that a grey object on grey ground with a *real* halo passes a1 because its own grey
  is far enough from the ground's. Named, not solved, in v1.
- *The two-state registration default assumes a shared source canvas.* If row 4's generations do
  not honour it, the override flag is the route and the gate is what notices.
- *A corpus image that fails a gate.* The response is the image or a reasoned contract change,
  never a silent retune — see §3.
