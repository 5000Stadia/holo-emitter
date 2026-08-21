# Spec row 3 — plan

Row 3 in `design/intention.md`'s spec list. Target and done live there; nothing is copied here.

Revision 2, after the plan critic's F1–F36. The disposition of every finding is at the end.

Built to blueprint §4b rule 1: **every stage is an importable pure function and the CLI is a thin
wrapper**. "Pure" is used strictly — a stage function performs no file I/O, opens no network,
reads no clock or RNG, mutates none of its arguments, and returns the same value for the same
inputs. All decoding, encoding and writing happens in the CLI layer. A future live host imports
the same functions and feeds them decoded frames instead of files (§4b rules 1 and 5).

**What governs this plan beyond the mechanics.** The intention's bar for this row — *"gates in
blueprint §9.4 are the floor; a sprite that passes gates but fails the flip test has failed"* —
means every gate here must be justified at the viewpoint the flip test uses, not at the viewpoint
that is convenient to measure. Three of the decisions below (edge erosion, the composited-rim
clause, the ground-contact footprint) exist only because that question was asked, and each is
backed by a measurement taken during this planning pass on the real corpus, quoted inline.

---

## 0. Corpus, characterised — before any threshold is frozen

`library-src/corpus/` landed during the planning pass (commit `fd12619`, the standing asset
seat's lane). It holds `desk-corpus-1.png` / `desk-corpus-2.png` with their `.prompt.txt`
siblings. **Characterisation, measured, before any number in §3 is pinned:**

| | desk-corpus-1 | desk-corpus-2 (teardrop pulls → `desk-joined-oak-1660`) |
|---|---|---|
| source size | 1254×1254 RGB | 1254×1254 RGB |
| border median (bg) | (129, 128, 128) | (144, 144, 143) |
| border per-channel σ | ≤ 1.02 | ≤ 1.22 |
| bg drift corner→corner | ≤ 1.9 levels | ≤ 2.6 levels |
| content bbox after matte | 1065×815 | 1148×919 |
| enclosed grey regions | 4 real gaps (86817, 31179, 27958, 436 px), then nothing above 13 px | 4 real gaps (63102, 15623, 13448, 4812 px), then nothing above 11 px |
| left-third − right-third luminance (opaque) | **+0.96** | **+0.11** |
| Sobel bright-side angle vs UL45 (135°) | 86.8° → dev 48.2° | 90.1° → dev 44.9° |

The prompts show both were generated **to the orientation contract**, not before it: "camera eye at
1.83 metres (6 feet), pitched slightly downward about 8 degrees", "50mm", "front three-quarter
view turned exactly 30 degrees toward viewer-left", "one single soft key light from the upper-left
at 45 degrees", "perfectly plain seamless uniform mid-grey studio background", "all drawers closed
and fully seated", "no cast shadow on the background". So gate (c) (≥512 px content height: 815
and 919, both clear), the matte's border-median assumption (σ ≤ 1.3, drift ≤ 2.6) and the framing
assumptions are all satisfied *by measurement* rather than by hope.

**The one place the corpus does not honour the contract is light.** The measured horizontal tilt
is +0.96 and +0.11 luminance levels; `tests/playwright/mechanisms.spec.mjs`'s shipped clause
("every sprite carries the horizontal half of `UL45`") demands **> 2**. Both desks therefore
*will* warn on gate (e), and row 4's bake will meet that Playwright clause going red the day a
real sprite replaces a placeholder. That is a finding to hand forward, not a threshold to soften
— see §3's freeze rule and §14's fork.

---

## 1. Environment, and the one command

`python3` 3.12.3, `numpy` 1.26.4, `Pillow` 10.2.0. `numpy` was absent and was installed with
`sudo apt-get install -y python3-numpy`; `pip` is PEP-668 blocked on this machine. No other
dependency, ever — the blueprint pins PIL + numpy only.

The documented one command, headless, from the repo root:

```
python3 -m unittest discover -s replicator/tests -t . -v
```

`-t .` puts the repo root on `sys.path`; `replicator/tests/__init__.py` is required or discovery
refuses the directory (verified). `replicator/tests/__init__.py` imports numpy and PIL inside a
try/except and raises a message naming the apt command if either is missing, so a fresh worktree
meets an instruction rather than a traceback. **README and `design/architecture.md` carry both the
install line and the test line.**

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
  gates.py            stage 4 (a-g)
  record.py           stage 5 (the §6 dict)
  preview.py          the dark-ground composite at reference draw scale (pure)
  pipeline.py         ingest_sprite(...) -> IngestResult; pure, in-memory, no I/O
  maskgen.py          scripted polygon -> mask array (pure) + thin CLI
  synth.py            deterministic constructed images, incl. every negative control
  ingest.py           the CLI: argparse -> decode -> pipeline -> encode -> write
  contract.json
  masks/<id>/<part>.png        committed part masks (ingest inputs, maskgen output)
  tests/__init__.py + test modules
```

Blueprint §2's layout names `replicator/ingest.py`, `contract.json` and `tests/`; the extra
modules are an addition, not a contradiction — §4b rule 1 requires the stages to be importable
somewhere, and one file holding both the stages and the CLI cannot demonstrate the CLI is thin.
`masks/` is named because the mask PNG is a real ingest input that must survive so the ingest is
re-runnable (the row's own "the ingester consumes the same mask PNG §9.3 names"). §2's layout
listing is brought true in the closing commit.

Images cross module boundaries as **`numpy.ndarray`, shape (H, W, 4), dtype uint8, RGBA,
straight (non-premultiplied) alpha**; masks as `(H, W)` bool. PIL appears only in `ingest.py`
(decode/encode), `maskgen.py`'s rasteriser, `parts.py`'s cavity blur and `thumbs.py`'s resample.

## 3. Contract (`replicator/contract.json`), authored before the corpus runs

### 3.1 What "pinned" means here, and what it forbids

Every threshold below carries a **`basis` string in the file itself**, naming the artifact it was
derived from — the shipped placeholder library, the §0 corpus characterisation, or a constructed
control measured during this planning pass. A threshold with no citable basis is a guess wearing a
provenance claim, which is what the row's anti-tuning device exists to prevent.

`contract.json` is committed **in its own commit, before the corpus is ingested**, so the git
history shows the freeze. After that commit:

- A hard-gate failure on a corpus image is **reported as a failure**. It is never answered by
  moving a number.
- The two outcomes are named, and the choice is the **Navigator's, not the builder's**: either the
  row's done clause moves (the failing desk is a corpus-only source that row 4 supersedes anyway),
  or the asset seat regenerates it under the contract. A builder holding a choice between a
  documented retune and an unclosable row retunes; that fork is therefore routed out of this seat
  by name.
- Gate (e) is warn-only by §9.4's own text, and the corpus *will* warn (§0). **Reading pinned for
  this row:** "passes gates" = every hard gate green; a gate-(e) warning is recorded and does not
  block. It is carried in three places so it cannot be lost — the emitted record's
  `light_measured` block, `design/architecture.md`'s row-4 inheritance section, and this row's
  closing report. The intention's asset-lane rule ("on gate-(e) light warnings: regenerate once,
  then flag the sprite in the flip batch") governs row 4's autonomous lane; this row's corpus is
  explicitly corpus-only and superseded, so regeneration here would spend a generation on an asset
  that is thrown away.

### 3.2 §10's blocks — three deviations, each with its reason

1. **Eye height: 1.83 m, in both prose blocks.** §10's `prompt_block` says "camera at 1.6m eye
   height" while `camera.eye_height_m` in the same object says 1.83; the intention's quality 5
   names the contract's eye height as "6 ft, pitched slightly down, per Kabe's 2026-08-20 ruling".
   The JSON field was updated by that ruling and the prose was not. **Both `prompt_block` and
   `backdrop_block` carry 1.83 m** — the corpus prompts already do, which is what a working asset
   seat had to conclude too.
2. **Pitch appears in the prose.** `camera.pitch_deg: -8` governs how an arriving image looks and
   appears in neither block. A sprite generated level and composited into a room shot at −8°
   will not foreshorten its top surface like the floor it stands on — the "looking at a diagram"
   failure quality 5 names. Both blocks gain "pitched approximately 8 degrees downward" (again,
   what the corpus prompts already say).
3. **`backdrop_block`'s light clause.** §10 shows "overcast diffuse daylight through any window,
   no visible sun shafts"; §11 marks that phrasing **superseded 2026-08-20 by Kabe's look
   reference** — warm practicals against a cool window — and says the real light design lands in
   Kabe's probe loop. Authoring the superseded phrase into the file every backdrop prompt appends
   would hard-code a look Kabe has ruled against. The authored clause instead **separates
   direction from colour**, which is what makes the two live readings coherent:
   - *Direction is pinned across the set:* "a single dominant key reading from the upper-left of
     frame on every facing". §5 already authors `key_dir: "UL"` on every M0 facing precisely so
     screen-space key matches sprite `UL45`, and §1's non-goals forbid relighting beyond tint —
     so a facing keyed from elsewhere would give quality 1 ("Every sprite shares the backdrop's
     key direction") no way to be true.
   - *Colour and quality come from the facing:* "its colour and quality from that facing's own
     practicals — firelight, lamp and candle warm against cool daylight from any leaded window".
     That is what §11's supersession is actually about, and it is what `key_tint` carries per
     facing.
   **This is a look-bearing resolution and therefore not the builder's alone.** It is written into
   the contract, marked `[AI, row 3]` in `design/architecture.md`, and carried to the Navigator in
   the closing report as a direction question for Kabe **before row 4's prompt sheets are
   written** — which is the playbook's own rule ("better to get my ok on the visual directions as
   they form then after the fact") and is upstream of any generation, so nothing is locked.
4. **`style_block` is untouched** — the placeholder string §10 shows, verbatim, extracted at row 4.

**Named and not fixed here:** §5's `horizon_y` device and §12.5's assertion still read 1.6 m. That
is backdrop-meta arithmetic in row 4's lane (§5 says the measurement procedure is row 4's to
write), and changing it here would edit a gate this row does not run. It is in the closing report
as an inconsistency for the Navigator, with the note that a 1.83 m camera and a 1.6 m horizon
formula cannot both be right and quality 5 rides on the answer.

### 3.3 The new blocks

`schema` stays `"orientation-contract/0.1"` — the orientation contract proper is unchanged. The
new blocks carry their own version, `"ingest_schema": "replicator-ingest/0.1"`, and the record's
provenance records both, so a record can be traced to the threshold set that admitted it.

```
"gates": {
  "halo": {
    "edge_bg_distance_min": 18.0,
    "inner_band_saturation_ratio_min": 0.55,
    "inner_band_bg_distance_ratio_min": 0.55,
    "composited_rim_lift_ratio_max": 0.65,
    "basis": "..."
  },
  "holes":      { "tolerance": 26, "min_area_px": 64, "basis": "..." },
  "resolution": { "min_content_height_px": 512, "min_content_height_px_takeable": 128 },
  "state_diff": { "max_mean_abs": 1.0, "pixel_over_threshold": 8, "max_pixels_over": 64 },
  "light":      { "max_deviation_deg": 45.0, "min_third_tilt": 2.0 },
  "contact":    { "min_footprint_fraction": 0.25, "contact_band_fraction": 0.20 },
  "over_matte": { "conservative_tolerance": 5, "max_area_loss_fraction": 0.08,
                  "max_erode_loss_fraction": 0.05 },
  "part_mask":  { "boundary_darkness_ratio_max": 0.90 }
},
"ingest": {
  "matte": { "tolerance": 14, "hole_min_area_px": 64, "edge_erode_px": 2,
             "feather_px": 1, "rgb_bleed_px": 2 },
  "cavity": { "darken": 0.45, "blur_radius_px": 6 },
  "thumb":  { "size_px": 128, "content_px": 112, "filter": "LANCZOS" },
  "preview": { "ground_rgb": [28, 20, 14], "draw_height_px": 75 },
  "period": { "earliest": 1640, "latest": 1700, "region": "England" }
}
```

**Basis for each number, all measured in this planning pass:**

- `matte.tolerance` **14** — corpus border σ ≤ 1.3 and corner-to-corner drift ≤ 2.6 levels (§0);
  14 is ~5σ above the noise and ~5× the drift, and the object's nearest opaque pixels sit 50–66
  levels from the ground. Measured: the object bbox moves by ≤ 1 px between tolerance 10 and 20 on
  both images, so the value is not on a knife edge.
- `matte.hole_min_area_px` / `gates.holes.min_area_px` **64** — an 8×8 px hole in a ≥512 px-tall
  sprite is the smallest gap anyone drew. Corpus confirms it is nowhere near a boundary: the real
  leg gaps are 4 812–86 817 px and the next component down is 13 px (§0). The gate's `min_area_px`
  equals the matte's deliberately, so a region the matte declined to punch is also beneath the
  gate's notice; the gate's power comes from its **looser tolerance** (26 vs 14), which is what
  lets it catch a gap whose interior is a graded grey the matte's net missed. Gate (b) seeds its
  flood from the border **and from every transparent pixel**, so the tolerance-26 fringe around an
  already-punched hole is reached and is not counted — without that, every real image would fail.
- `matte.edge_erode_px` **2** — see §4.5. Measured: composited over a dark ground at draw scale,
  the rim's brightness lift over the ground falls from **0.836** of the interior's lift (no
  erosion — a visible light rim, confirmed by eye) to **0.245** (erode 2). Area cost 2.1 %.
- `gates.halo.composited_rim_lift_ratio_max` **0.65** — a correctly antialiased edge is a
  coverage-weighted blend, so its expected lift is ≈ 0.5 of the interior's; 0.65 is that plus
  slack. The un-eroded corpus sits at 0.836 and fails; the shipped (eroded) matte sits at 0.245.
- `gates.halo.edge_bg_distance_min` **18** — corpus semi-alpha ring sits at 51–66 from the ground
  colour; a constructed grey-halo control sits at 37.7, so this clause alone does **not** catch
  that control, which is why the inner-band clauses exist.
- `gates.halo.inner_band_*_ratio_min` **0.55** — the depth-2..4 px band's mean saturation and mean
  ground-distance, each relative to the deep interior (depth > 10). Corpus: **0.86 / 0.90** and
  **1.08 / 1.09**. Constructed grey-halo control: **0.047** and **0.288**. The ratio form (rather
  than an absolute saturation floor) is what keeps an honestly grey object — M0's iron key and
  silver coin — from false-failing; the distance clause is what still carries signal when the
  object has no saturation at all.
- `gates.light.max_deviation_deg` **45** and `min_third_tilt` **2.0** — the Sobel bright-side
  estimate carries a systematic pull toward 90° for any top-lit object (a constructed correctly
  UL45-lit solid measures 115.5°, not 135°), so 45 is the angle band that admits a genuinely UL45-lit sprite;
  `min_third_tilt` is **exactly the shipped mechanisms.spec clause** (left third minus right third
  mean luminance over alpha ≥ 250, must exceed 2), so a gate-(e) pass at ingest predicts that
  Playwright clause rather than disagreeing with it. Corpus measures 0.96 and 0.11 → both warn.
- `gates.contact.min_footprint_fraction` **0.25** — see §5.2. The corpus desk's §9.2-derived
  footprint is **27 px of 1148 (0.024)**; its real ground contact spans **33 → 1098 (0.928)**.
- `gates.over_matte.*` — `conservative_tolerance` 5 is just above the corpus border noise; a
  silhouette that loses more than 8 % of its area between tolerance 5 and tolerance 14 is being
  eaten, not matted.
- `cavity.darken` **0.45** — `src/placeholders.js`'s recess factor, so the ingested body satisfies
  the same mechanisms.spec body/part luminance ratio (< 0.7) the placeholders do.
- `thumb.filter` **LANCZOS** — see §8; measured by looking.
- `preview.draw_height_px` **75** — §5's own arithmetic: 0.78 m at `px_per_m_at_wall` 96 = 75 px
  in the 1536 px frame (at `px_per_m_at_bottom` 210 it is 164 px). 75 is the harsher of the two
  and is where the rim clause is judged.
- `state_diff.max_pixels_over` **64** — zero is unachievable on a pipeline that feathers, blurs
  and composites; 64 pixels over a channel diff of 8, on sprites of ~10⁶ px, is four orders of
  magnitude below a real leak, and a leaked inpaint moves tens of thousands.

`contract.py` validates on load: required keys present, thresholds numeric and in range, every
threshold block carrying its `basis`. A malformed contract is a hard error naming the key — the
gates never fall back to defaults, because a gate reading a default nobody pinned is the tuned
gate wearing different clothes.

## 4. Stage 1 — matte (`matte.py`)

`matte(src_rgb, *, tolerance, hole_min_area_px, edge_erode_px, feather_px, rgb_bleed_px)
-> MatteResult(rgba, trim_offset, bg_color, stats)`.

1. **Background colour** = per-channel median of the 1-px border ring (§9.1). If any border pixel
   is *not* within tolerance of that median by more than a small fraction of the ring, the object
   touches the border or the ground is not seamless — hard error naming the contract clause
   (`framing.margin`, "full object centered"), never a bitten silhouette.
2. **Similarity mask** = Euclidean RGB distance to `bg_color` ≤ `tolerance`.
3. **Outer background** = components of that mask reachable from any border pixel, 4-connected,
   by a scanline span fill (deterministic; ~0.3 s on the 1254² corpus, measured). PIL's
   `ImageDraw.floodfill` was the alternative and was rejected: it seeds from one point against
   that seed's own value, so it needs a synthetic padding frame, and its behaviour is a Pillow
   implementation detail rather than this pipeline's.
4. **Enclosed holes.** Similarity components not reached in step 3, area ≥ `hole_min_area_px`, are
   punched to alpha 0; smaller ones stay opaque (they are object pixels that happen to match the
   ground, not gaps) and are counted in `stats`.
5. **Edge erosion, `edge_erode_px` = 2.** The generator antialiases the object against the grey
   seamless, so the outermost 1–3 px of the silhouette are *already* a blend of oak and ground —
   opaque in any matte, and a light rim when composited over a dark room. Eroding the silhouette
   inward by 2 px drops that band. Measured effect in §3.3; **looked at**, both ways, at the real
   draw scale. Guard: if erosion removes more than `max_erode_loss_fraction` (5 %) of the object
   area, hard error — a thin object (a key shaft) must not be eaten by its own edge treatment.
   Corpus cost: 2.1 %.
6. **Feather 1 px, inward only.** The outermost ring of the eroded object gets
   alpha = 255 × (3×3 mean of the binary mask). Feathering outward would extend the silhouette
   over literal ground pixels — manufacturing the halo gate (a) exists to catch.
7. **Ring decontamination.** For semi-alpha pixels, unmix against the sampled ground:
   `F = clip((C − (1−α)·B) / α)`. Cheap, exact for the compositing model that produced the pixel,
   and it means the feather carries object colour rather than a ground blend.
8. **Premultiplied-safe RGB.** Transparent pixels carry object colour bled outward by
   `rgb_bleed_px` (2) iterations of "mean of opaque 4-neighbours"; anything further out is zero.
   Under bilinear filtering — and the sprite is drawn at ~6–12× downscale, §3.3 — this is what
   stops a black or grey fringe appearing at draw time.
9. **Trim** to the alpha > 0 bbox. `trim_offset` is returned, not swallowed: every later stage
   that speaks source coordinates translates through it.

*Two-tolerance design* (matte 14, gate (b) 26) is what lets gate (b) fail at all; §3.3 explains
the seeding rule that keeps it from failing on every real image.

## 5. Stage 2 — anchors (`anchors.py`)

### 5.1 What is pixel-derived

- `px` = the matted body's own size.
- `bottom` = highest-index row with a pixel at alpha ≥ 128 (after trim, `H − 1`);
  `base.y = bottom + 1`, i.e. the image's own bottom edge.
- The **bottom-two-rows x-extent** `[x0, x1]` (alpha ≥ 128 across rows `bottom−1` and `bottom`),
  computed exactly as `tests/playwright/mechanisms.spec.mjs`'s "px, base and footprint are what the
  pixels say they are" computes it — inclusive `x0`, **exclusive** `x1 + 1`.

### 5.2 Ground contact is not the bottom two rows, and the record must not pretend it is

Measured on the real corpus desk: the bottom-two-rows extent is **[246, 273] — 27 px of a 1148 px
sprite (2.4 %)**, because in a three-quarter view the nearest ball foot is the lowest pixel and
the other three feet sit 160+ px higher up the image. The desk's actual ground contact spans
**[33, 1098] (92.8 %)**. `anchors.footprint` is what the renderer draws the contact pool from and
what `base.x` centres it on, so taking §9.2's derivation literally on generated art gives the
desk a contact pool 3 % of the width of its own feet — against a named quality that reads
"**Every** grounded object darkens the ground under it… nothing sits on a floor without it."

The blueprint already anticipates this. §9.2's v2 clause is Kabe's, verbatim: *"on ingest an llm
looks at it and identifies the rear points that touch the ground"* — the rear ground contacts are
named as the thing a model will have to find, precisely because geometry does not give them. So:

- **`base.x` and `anchors.footprint` are ground-contact quantities**, operator-flagged at v1 via
  `--footprint x0,x1` (source pixel space, translated by `trim_offset`), with the VLM callable as
  the v2 route §9.2 already names.
- **The geometric derivation stays, as the default and as a reported cross-check.** When
  `--footprint` is given, `base.x` = the flagged footprint's midpoint and the geometric values are
  reported in `provenance.derived` beside it.
- **Gate (f), contact plausibility** (hard, for `floor_against` / `floor_free`): the recorded
  footprint must span ≥ `min_footprint_fraction` (0.25) of `px.w`, must contain the bottom-two-rows
  extent, and must lie inside the alpha bbox. The ingester also reports a **contact-band estimate**
  — the x-extent of columns whose lowest opaque row lies within `contact_band_fraction` (0.20) of
  the bottom — to give the operator a measured starting point ([33, 1098] on the corpus desk,
  which is right). The estimate is *reported*, never silently written: on a squat object the band
  is the whole silhouette and the coin's lesson runs the other way.
- **This is an amendment to §9.2's letter** and it changes what `mechanisms.spec`'s pixel-truth
  clause can assert for real art: `px` and `base.y` stay pixel-identical, while `footprint` and
  `base.x` become *contained-and-plausible* rather than *equal to the bottom-two-row extent*. It
  is written into blueprint §9.2 as an `[AI, row 3]` note in the closing commit — the form row 2
  used for its §9.3b amendments, reversible by Kabe as a new-row decision — and carried to the
  Navigator in the closing report. Row 2's green witnesses a placeholder desk deliberately painted
  with "a floor-level stretcher rail opaque across the leg span for the bottom 8 % of rows"; that
  authoring choice is exactly what real generated art does not make.

### 5.3 Manual regions

`--anchor surface_top:x0,y0,x1,y1`, repeatable, **in source-image pixel space** — the operator
measures on the image they can open — translated by `trim_offset` into sprite space. The CLI
prints the offset and both rectangles. A region outside the trimmed canvas, or inverted, is a hard
error naming the region and both rectangles; never clamped, because a clamped anchor is a record
lying about where a thing is.

`drawer_cavity` is a special case and is handled in §6.3.

VLM auto-detection is v2: `detect_regions(rgba, ask)` where `ask` is an injected
`(prompt, schema) -> json` callable, defaulting to `None` → `NotImplementedError` naming §9.2 v2.
The seam exists (§4b rule 5); nothing calls it.

## 6. Stage 3 — parts (`parts.py`, `maskgen.py`)

### 6.1 The mask, and where its numbers come from

`polygon_mask((w, h), [(x, y), …]) -> bool` and `rect_mask(...)`, pure, PIL `ImageDraw.polygon`
rasteriser. Thin CLI: `python3 -m replicator.maskgen --size WxH --poly x,y x,y … --out PATH`.

**The determination procedure for the vertices**, which is the hard half of "agents have no hands
to draw":
1. The drawer front's corners are read off the source image by measurement — a grid overlay at a
   known crop origin, printed and read, not eyeballed at full-image scale. The measured
   quadrilateral for the corpus desk's lower-left drawer, in source coordinates, is recorded in
   `design/architecture.md` with the exact `maskgen` command, so the ingest is re-runnable.
2. The mask is **checked against the drawer's real edges**, because gate (d) at closed cannot
   tell a mask that follows the reveal gap from one 15 px inside it. A joined drawer front is
   bounded by a dark reveal gap on every side, so: sample the mean luminance of the mask's own
   boundary ring and of the part's interior; a mask sitting on the reveal has a
   `boundary/interior` ratio below `part_mask.boundary_darkness_ratio_max` (0.90). Reported
   always; **hard fail** above it. A mask nudged inward until gate (d) goes green fails this one.
3. The mask is committed at `replicator/masks/<id>/<part>.png`. It is an ingest input, not an
   output, so it lives in the replicator's lane rather than in `library/` (which row 4's bake
   reads) or in `library-src/` (the asset seat's, read-only to this row).

### 6.2 The cut and the cavity

- The mask PNG must match the **source** image's dimensions; a mismatch is a hard error naming
  both sizes. Mask semantics: luminance ≥ 128, or alpha ≥ 128 where present.
- The part image is `body` where mask, alpha = body alpha ∧ mask, trimmed to its own bbox;
  `origin` = that bbox's top-left **in body pixel space**.
- **Cavity inpaint:** the masked region is filled by iterative neighbour-average propagation
  inward from its boundary ring, Gaussian-blurred at `blur_radius_px`, then multiplied by
  `cavity.darken` (0.45). Body alpha inside the cavity is unchanged — the drawer hole is not a
  hole in the desk. Measured on the corpus desk: cavity mean luminance 19.1 vs part mean 45.9, a
  ratio of 0.42, comfortably under the 0.7 that mechanisms.spec asserts for the placeholders.

### 6.3 `slide`, `drawer_cavity`, and what makes the part *work*

Done says the desk lands "with working `drawer_front`", and nothing in §9's five gates ever looks
at the open state. Three additions close that:

- **`--slide dx,dy,scale_open` stays an operator flag** (it is one in §9's CLI) and is
  **checked**, not trusted. The ingester computes `min_dy_clearance` — the smallest `dy` for which
  the open front's top edge clears the cavity's bottom, i.e.
  `origin.y + dy·px.h ≥ cavity.y1` — and **hard-fails** when the supplied `dy` is below it. This
  is the row-2 lesson (`slide.dy` 0.24 was chosen so the revealed key draws *inside* the cavity
  rather than on the drawer's face) turned into a check instead of a literal to copy. The computed
  minimum is printed, so the operator's number has a derived reference. `sign(dx)` is warned
  against `view_side` (a viewer-left three-quarter object pulls its drawer toward screen-left).
- **`drawer_cavity` is not measured off the closed image** — the cavity is behind the drawer
  front and is not on it. It is **derived**: the closed part rect displaced along the slide
  vector, so the recorded region is where contents are *visible when open*, which is row 2's
  pinned convention. A `--anchor drawer_cavity:` flag is still accepted (the row's done names
  "manually-flagged anchor regions", and the flag is how the operator's judgement enters); when
  both exist, a flagged cavity that contradicts the clearance relation is a **hard error**, not a
  silent overwrite. Corpus desk: flagged, and the derived value witnesses it.
- **An open-state test**: the pipeline composites body + part at `t = 1` in memory and asserts
  the cavity rect is not covered by the part. A drawer that only works closed fails here.

Multiple parts are supported; each `--slide` pairs with the most recent `--part`, and a `--part`
with no `--slide` is a hard error.

## 7. Stage 3b — two-state (`states.py`)

The open image runs through stage 1 with the same contract values.

**Registration.** §7 of revision 1 proposed deriving `origin` from the two trim offsets. The plan
critic is right that this is unsound: `framing.margin` is "full object centered", so each image is
centred on *its own* silhouette and the trim-offset difference encodes the silhouette difference,
not where the door is. §9.3b's own suggestion (keep the door frame in frame as the registration
datum) exists because centring destroys the datum. So:

- **`--state-origin open:x,y` is required**, in closed-sprite (body) pixel space. There is no
  silent default.
- A `--state-datum x0,y0,x1,y1` route (a rect present in both images, e.g. the door frame) is the
  named v2 improvement and is **not built** — stated as deferred rather than pretended.

**The alignment gate**, in the closed frame, per §9.3b as amended at row 2 (the base-midpoint
clause is deleted for swap sprites):
- (i) hard: `|origin.y + state_h − body_h| ≤ 0.02 × body_h`;
- (ii) hard: `origin.x ≥ 0`, `origin.y ≥ 0`, `origin.x + state_w ≤ body_w`,
  `origin.y + state_h ≤ body_h`. Its non-generality (a raised chest lid exceeds the closed bbox)
  is repeated in the failure message, so the known exception meets the operator when it bites.
- (iii) warn: the state rect's horizontal centre versus the body's, reported in body-width
  fractions.
- **x registration is not geometrically verifiable in v1 and this is said out loud**, in the
  gate's own report and in `design/architecture.md`: clause (ii) bounds it, clause (iii) surfaces
  a gross displacement, and correctness rides on the operator's datum and Kabe's eye at row 4's
  batch. Row 3 exercises the gate on constructed pairs only — M0's real door pair does not exist
  until row 4 — and says so rather than letting a synthetic pair built to the same assumption
  stand in for validation.

`states_images` is emitted as row 2 bound it: `{"open": {"image": "states/open.png",
"origin": {"x": …, "y": …}}}`. Each state image is trimmed per image (stage 1 untouched); the
single `anchors` block stays the closed state's. **`extent` is not written into the record** —
architecture.md defines it as build-time presentation data the row-4 bake derives; a second home
for a derived fact is what the "one home" rule forbids.

Requiring `--state-origin` means row 4 will generally set `origin.x ≠ 0`, which changes the
consequence architecture.md records ("the open leaf, and the gap beside it, read on the same
screen side from both rooms" follows from `origin.x = 0`). That is a [HUMAN] call per
architecture.md; it is written into the architecture note and into the closing report rather than
changed by accident.

Gate (d) does not run on swap sprites; gate (e) runs on both images and reports both.

## 8. Stage 3c — thumbs (`thumbs.py`)

`make_thumb(rgba, *, size_px, content_px, filter)`. Content bbox scaled so its longest side is 112
px, centred on a transparent 128 px square.

§9.3c says "content-bbox-centred **crop**, 128px"; a 128 px crop of a 919 px desk is a patch of
oak, so this scales instead — declared as a deviation with that reason.

**Filter: LANCZOS, chosen by looking.** Revision 1 said nearest-neighbour for determinism; the
plan critic was right that the argument was wrong, and the picture settles it: at the ~8×
decimation a real sprite needs, nearest-neighbour drops the teardrop pulls and the reveal gaps and
leaves an inventory tile that reads as noise, while LANCZOS gives a legible desk. Both are
deterministic. The RGB bleed of §4.8 is what keeps the resample from pulling transparent black
into the edges.

`--takeable` emits it and sets `takeable`/`thumb`. Gate: a takeable record without a square 128 px
thumb is a hard fail; so is a non-takeable that carries one.

## 9. Stage 4 — gates (`gates.py`)

`run_gates(artifacts, contract) -> [GateResult(id, severity, passed, measured, threshold,
message)]`. Pure: reads in-memory artifacts and the contract dict, returns findings, prints
nothing. **Every gate reports its measured value whether it passes or fails**, so a green gate is
auditable and a threshold nowhere near being exercised is visible.

- **(a) halo — four clauses, any one fails.**
  - a1 `edge_bg_distance_min`: mean RGB distance of the semi-alpha ring from the sampled ground
    ≥ 18.
  - a2 `inner_band_saturation_ratio_min`: mean saturation of the depth-2..4 px band ≥ 0.55 × the
    deep interior's (depth > 10).
  - a3 `inner_band_bg_distance_ratio_min`: the same band's mean ground-distance ≥ 0.55 × the deep
    interior's — the clause that still carries signal on an object with no saturation at all.
  - a4 **composited-rim**: the matte is composited by `preview.py` over the pinned dark ground at
    the pinned draw height (75 px), and the rim's brightness lift over the ground must be ≤ 0.65 of
    the interior's lift. This is the clause that answers the flip test's own question — the ring's
    appearance *over a dark room*, which is where a halo becomes a sticker and where a gate
    calibrated against mid-grey cannot see it.
  §9.4's letter is "mean saturation of border-adjacent semi-alpha pixels must not read grey".
  Taken alone as an absolute saturation floor it **false-fails an honestly grey object**, and M0's
  takeables are an iron key and a silver coin. The four clauses keep the intent and add the
  viewpoint. **This changes a [HUMAN] gate definition**, so it is written into blueprint §9.4 as
  an `[AI, row 3]` amendment — the form row 2 used at §9.3b, reversible by Kabe as a new-row
  decision — and carried to the Navigator as a fork in the closing report. The blueprint does not
  keep saying the thing the code no longer does.
- **(b) holes.** Enclosed regions of the final body at tolerance 26, area ≥ 64, still at alpha > 0
  → fail. Flood seeded from the border *and every transparent pixel* (§3.3).
- **(c) min resolution.** Content bbox height ≥ 512 px, or ≥ 128 px when `--takeable`.
- **(d) state diff.** Parts only. `composite(body_with_cavity + part @ closed)` versus the matted
  original *before* inpainting, measured **outside** the part's closed mask over pixels either
  calls opaque. Fails above `max_mean_abs` (1.0) or `max_pixels_over` (64 pixels exceeding a
  channel diff of 8).
- **(e) light — warn only.** Two reported measures: the Sobel bright-side angle (masked to the
  interior, eroded 4 px so the silhouette boundary — the strongest gradient in any matte, pointing
  everywhere at once — contributes nothing) against UL45's 135°, and the **left-third-minus-
  right-third mean luminance over alpha ≥ 250**, which is the shipped mechanisms.spec measure. A
  warning never blocks, and both numbers land in the record's `light_measured` block.
- **(f) contact plausibility** — §5.2. Hard for floor-attached records.
- **(g) over-matte** — hard. The silhouette is re-matted at `conservative_tolerance` (5); if the
  shipped matte's object area is more than `max_area_loss_fraction` (8 %) below it, the matte is
  eating the object rather than the ground. Plus the erosion guard of §4.5. Nothing in §9.4 hunts
  a bitten silhouette, and a key with its shaft matted away reads as a broken sticker while
  exiting zero.

**Behaviour.** The pipeline runs to completion in memory and gates run before anything is written.
On any hard failure the CLI writes **nothing** and exits non-zero with the numbered report on
stderr; `library/<id>/` is never left half-built. `--check` runs everything and writes nothing
regardless of outcome — which is how the second corpus desk is verified without minting an orphan
record for row 4's bake to trip over.

### The §9.4 negative control, and one per gate

`synth.py` holds `negative_control_halo()` — the §9.4 control, an object on mid-grey with a soft
grey halo built to survive the matte's tolerance and land in the ring. A test asserts the pipeline
fails gate (a) on it and that the CLI exits non-zero and writes no files. It is reachable by hand:
`python3 -m replicator.synth --case halo --out /tmp/nc.png`.

`synth.py` carries one constructed must-fail image **per hard gate** — halo (a), enclosed grey
hole outside matte tolerance (b), undersized (c), leaked inpaint (d), sliver footprint (f), object
within tolerance of the ground (g), misregistered two-state pair (alignment), and a wrong-light
image for (e) that must still *emit* while recording the deviation. §9.4 names one; making it
eight is what turns "every gate goes red when you break what it guards" into something the suite
runs rather than something a report claims.

## 10. Stage 5 — record (`record.py`)

The §6 record as row 2 bound it — the shape `src/placeholders.js` carries and
`tools/validate-fixtures.mjs` checks.

- `px`, `base.y` pixel-derived; `base.x`/`footprint` per §5.2.
- `attachment`: `floor_against`, `floor_free`, `wall_mounted`, and the row-2 minted `anchored`.
  Any other token is a hard error listing the four.
- `archetype`: `static`, `sliding`, `swap`. A test reads the shipped `src/placeholders.js` records
  through node and asserts this vocabulary covers exactly the archetypes the shipped library uses,
  so the ingester and the running demo cannot drift apart silently. `--part` without `sliding`, or
  `--state` without `swap`, is a hard error.
- **`dims_m`: all three from the operator.** Revision 1 derived `w` or `d` from the pixels through
  the contract's camera; the plan critic is right to refuse that — blueprint §5 says in terms that
  the project camera is unsettled (the pinhole/lerp incoherence, the 133° implied FOV, "whatever
  the room Kabe loves turns out to have"), and `dims_m` is what §12.5 measures rendered height
  against. So `--height-m`, `--width-m`, `--depth-m` are all required for non-takeables, sourced
  from period reference, and the pixel arithmetic survives only as a **warn-only cross-check that
  never writes**: it reports the drawn width implied by the record versus the drawn width in the
  image. The corpus desk at §6's authored dims (0.78 / 1.30 / 0.55) will warn — the generated desk
  is proportionally narrower than those numbers — and that warning is information for row 4, which
  is where the honest dimensions and the camera are settled together.
- **`light` carries its own contradiction.** `light` = `contract.light.key`, per §6, *and* the
  record gains a top-level **`light_measured`** block: `{estimate_deg, expected_deg,
  deviation_deg, third_tilt, agrees_with_declared}`. Architecture.md's clause — *a record cannot
  lie about its own image* — was applied at row 2 to `px`, `base` and `footprint` and not to
  `light`, which is the field the "one light" quality rides on; the row-2 finding was literally
  "every record declared `light: "UL45"` as truth" while the pixels said otherwise. A reader of
  the emitted record now cannot take the declaration on faith, because `agrees_with_declared:
  false` sits beside it. `[AI, row 3]`, a §6 completion in the same form as `px`.
- `period` from flags, defaulting to the contract's `ingest.period`. `view_side` from `--view-side`
  defaulting to `contract.camera.side`. `airborne` from `--airborne`. `source` from `--source`
  defaulting to `generated`.
- `provenance` = `{source, tool: "replicator-ingest-v1", contract: {schema, ingest_schema},
  gates: {every measured value}, derived: {geometric base/footprint, contact-band estimate,
  min_dy_clearance, dims cross-check}}`.
- Emitted JSON is sorted-key, 2-space, LF, trailing newline — byte-deterministic, so a re-ingest
  of the same image yields the same bytes and a diff means something changed.

Written layout: `library/<id>/sprite.png`, `record.json`, `parts/<part>.png`, `states/<name>.png`,
`thumb.png`, and `preview.png` (§9 a4's composite, so a human can look without running anything).
Existing files are overwritten; **files under `library/<id>/parts/` and `states/` that the new
record does not name are deleted**, so a re-ingest with fewer parts leaves no orphan for row 4's
bake to find. Nothing outside `library/<id>/` is ever written.

## 11. The CLI (`ingest.py`) is thin

`main(argv) -> int`: parse → decode with PIL → `contract.load()` → **one** call to
`pipeline.ingest_sprite(...)` → if all hard gates pass and `--check` was not given, encode and
write → report → exit code. No stage logic here, and a test proves it rather than asserting it:
the pure pipeline is run on in-memory arrays and its encoded outputs are byte-compared against the
files the CLI writes for the same inputs.

Exit codes: `0` pass (warnings allowed), `2` gate failure, `3` bad usage or malformed input.
Human report on stderr; `--report PATH` writes JSON; `--json` puts the report on stdout and
nothing else — blueprint's CLI hierarchy (machine-readable on stdout, friendly on stderr).

**The report's JSON shape is pinned here**, because the asset seat's autonomous lane keys on it
(`Where it goes`: "on gate-(e) light warnings: regenerate once, then flag") and exit 0 covers
pass-with-warnings:

```
{ "tool": "replicator-ingest-v1",
  "contract": { "schema": …, "ingest_schema": … },
  "id": …, "source": …, "written": [paths] | [],
  "ok": bool, "exit_code": int,
  "gates": [ { "id": "a"…"g"|"alignment"|"thumb",
               "severity": "hard"|"warn", "passed": bool,
               "measured": {…}, "threshold": {…}, "message": str } ],
  "warnings": [gate ids], "failures": [gate ids],
  "derived": { … the provenance.derived block … } }
```

`test_cli.py` asserts every key by name and asserts `warnings` contains `"e"` for a wrong-light
input, which is the exact predicate the asset lane will evaluate.

## 12. Tests (`replicator/tests/`)

stdlib `unittest`. Every image input is constructed in `synth.py`; no binary fixtures committed.

- `test_matte.py` — background sampling; object-touches-border error; tolerance behaviour; donut
  punches its hole; a 3-px speck does not; erosion drops the contaminated band and its guard fires
  on a thin object; feather is inward (no alpha > 0 pixel reads as ground); decontamination moves
  ring colour away from the ground; transparent RGB carries object colour, not ground; trim exact;
  `trim_offset` correct.
- `test_anchors.py` — `px`/`base.y`/bottom-two-rows extent against an independent implementation
  of mechanisms.spec's algorithm; the ground-contact flag path; the contact-band estimate on a
  legged synthetic (wide) and on a squat disc (narrow — the coin's lesson, the other way);
  out-of-canvas and inverted regions are errors; `detect_regions` raises without a callable.
- `test_parts.py` / `test_maskgen.py` — cut, origin, part alpha ⊆ body alpha, cavity/part
  luminance ratio, mask-size mismatch error, boundary-darkness check green on a reveal-following
  mask and red on one pulled inside, polygon rasterisation determinism.
- `test_slide.py` — `min_dy_clearance` derivation; a `dy` below it hard-fails; the open-state
  composite leaves the cavity uncovered; `dx` sign warn; a flagged `drawer_cavity` contradicting
  the clearance relation is an error.
- `test_states.py` — `--state-origin` required; alignment clauses (i) and (ii) each fail
  separately on constructed pairs; clause (iii) warns on a displaced pair; the "x is not verified"
  message is present in the report.
- `test_thumbs.py` — 128×128, content centred, takeable-only, thumb recorded, non-takeable with a
  thumb rejected.
- `test_gates.py` — each of a–g green on a clean synthetic sprite, then **red on its own
  constructed control**, one test per gate and per halo clause; (e) stays warn-only and still
  emits.
- `test_negative_control.py` — §9.4's named control fails end to end and writes nothing.
- `test_record.py` — full §6 field set; JSON-clean round trip; vocabularies; `dims_m` required and
  the cross-check warning; `light_measured` present and honest on a wrong-light input;
  byte-determinism of two runs; orphan `parts/` files removed on re-ingest.
- `test_bound_shape.py` — **split in two, per the critic's F27.**
  *(a) Row 3's question:* the emitted `record.json` + PNGs read back from disk and assembled into
  the row-2 bound library shape (`{record, images:{body, parts, states:{image, extent}, thumb}}`),
  asserting `images.parts` keys equal `record.parts[].id`, `images.states` keys equal
  `record.states_images` keys, and `extent` computed from the state image's bottom-two-rows
  alpha ≥ 128 offset by `origin.x`. Then the **shipped** `tools/validate-fixtures.mjs` `validate()`
  is run through node over a **minimal fixture the test authors in a temp directory**, staging the
  emitted record alone — so the validator's record-level clauses (px, anchor bounds, attachment
  vocabulary and agreement, thumb-on-takeable, state coverage) are genuinely applied to the record
  this row mints, with no coupling to the demo fixture's composition. If a minimal fixture proves
  entangled with §12.9's narration enumeration beyond a reasonable authoring cost, the declared
  fallback is to run `validate()` over the demo fixture with the record substituted and assert
  that **no finding names this record or its fields** — weaker, and it would be said out loud.
  *(b) Not row 3's question:* whether this record, placed in the demo fixture's composition,
  preserves that fixture's staged overlap spans is row 4's — the record's `dims_m` and footprint
  move the projected spans, `fixtures/` is outside this row's fence, and a synthetic desk
  dimensioned to match the placeholder would pass by construction and witness nothing. Stated in
  the test file and in architecture.md rather than fudged.
- `test_cli.py` — CLI equals pure pipeline byte for byte; exit codes; nothing written on gate
  failure or under `--check`; the report JSON's every key.
- `test_contract.py` — the shipped `contract.json` loads; §10's blocks present; every threshold
  block carries a `basis`; a malformed contract errors naming the key.
- `test_vocabularies.py` — archetype and attachment vocabularies against the shipped
  `src/placeholders.js` records, read through node.

## 13. The corpus run, and the one look

Order: contract committed → stages → tests green → **then** the corpus, with the thresholds
already frozen in git history.

1. `desk-corpus-2.png` (teardrop pulls) → `library/desk-joined-oak-1660/`, with the drawer mask
   from `replicator/masks/`, `--anchor surface_top:…`, `--anchor drawer_cavity:…`,
   `--footprint …`, `--slide …`, `--height-m 0.78 --width-m 1.30 --depth-m 0.55`.
2. `desk-corpus-1.png` → **`--check` only.** Done requires both generations to "pass matting and
   gates"; only one is named as a library asset, and ingesting the other under an invented id
   would mint an orphan record for row 4's bake and the fixture validator to find. Its full gate
   report goes in the closing message.
3. **The one look.** `preview.png` — the emitted sprite composited over the pinned dark ground at
   the real draw height — is produced by the pipeline and **looked at by the builder**, and what
   it shows is reported. Every other verification surface in this row is synthetic images and
   numbers, and the playbook's consumption-camera rule plus this row's own bar say a sprite nobody
   looked at where its user stands has not been examined. This is a scratch composite, not a
   product route: `src/`, `index.html`, `fixtures/` and `tools/` are untouched. The full flip test
   is row 5's, against real backdrops; what this substitutes for is the attribution question — a
   sticker edge found at row 4 can be traced back to the matte because the matte was already seen
   against a dark ground here.

The intention's row 4 says the probe desk **supersedes** this one. So the desk is emitted
honestly, not preciously: no threshold moves to flatter it, no pixel surgery, and its gate report
goes into the final message whatever it says — including the gate-(e) warning §0 already predicts.

## 14. `design/comparison-criteria.md` — §12.10's per-quality loss criteria

Authored in this row, before any backdrop or composite exists, and frozen. Its head says so and
says that changing a criterion afterwards is a visible, dated, reasoned edit, never one made
during a grading pass.

Four properties the plan critic's F23–F25 require, and which govern the drafting:

- **Every population and every tell is statable from a frame alone**, by a grader who has never
  read this project's documents — because §12.10 sets our composites beside Myst, Riven and
  Machinarium stills, and a criterion phrased in `staging.json` vocabulary ("staged overlap
  pairs", "objects present" by entity id) is judgeable on one side of the comparison only.
  Populations are therefore written as things a stranger can count in a picture: *"each discrete
  object standing in the space, distinct from the walls, floor and fixed architecture"*.
- **Every rule is arithmetic the grader can execute**, written once with a worked example on
  concrete numbers inside the document. The rate rule is fixed to one form and shown:
  `marked_ours − marked_anchor × (pop_ours ÷ pop_anchor) > 1`.
- **Every criterion carries a worked example of a build that loses it.** A criterion nobody can
  fail satisfies the done clause exactly and guarantees "no quality lost" at row 6 by
  construction, while §12.10 is the gate that blocks Done.
- **The bare-facing license is handled per population, not per criterion.** A frame with no
  objects contributes nothing to the contact, occlusion or one-hand populations — it can neither
  lose nor win them — and is fully in the camera-has-feet population. **An empty population is not
  a pass**: if the whole set contains no overlapping object pair, occlusion is *lost*, because a
  build with nothing overlapping anything has not met the quality, it has avoided being judged on
  it.

The document is read by the artifact critic before this row closes — it is the definition of
Kabe's own named bar, and one author plus one plan critic is otherwise the whole examination it
will ever get. Blueprint §12.10 gains a pointer to it in the closing commit, so it is findable
from its one home rather than from a deleted spec file's git history.

## 15. Edges — what this must not touch, and what feels it

**Must not touch.** `src/`, `index.html`, `fixtures/`, `tests/playwright/`, `tools/` — row 3 adds
no product behaviour and the Playwright suite must stay green **unmodified** (baseline measured
this pass: 554 passed, Chromium and Firefox). `backdrops/` and `library-src/` are the asset seat's
lane; `library-src/corpus/` is readable input only. No AgentPost mailbox. No other spec row.

**Feels the change.**
- `library/` comes into existence. Nothing in the running demo reads it yet (row 2's library is
  procedural; architecture.md fixes row 4's `tools/bake-library.mjs` as the route from files to
  the page), so no rendered pixel moves and the Playwright suite is unaffected.
- `tools/validate-fixtures.mjs` and `src/placeholders.js` are *read and executed* by tests, never
  modified.
- `design/blueprint.md`: §2's layout listing, §10's shown JSON, §12.10's pointer, and two `[AI,
  row 3]` amendment notes — gate (a)'s clauses at §9.4 and the ground-contact footprint at §9.2 —
  each naming what changed, why, and that Kabe can reverse it as a new-row decision, in the form
  row 2 used at §9.3b.
- `design/architecture.md` gains the replicator section row 4's builder boards from: module map,
  the pure-function seam, every pinned threshold with its basis, the four documented deviations,
  the exact `maskgen` and `ingest` commands, and what row 4 inherits — the bake reproduces `extent`
  and `px`; the probe desk overwrites this one through the same gates; mechanisms.spec's light
  clause will go red on a real sprite; the pixel-truth clause splits for `footprint`/`base.x`;
  `states_images.open.origin.x ≠ 0` changes a documented presentation consequence.
- `README.md` gains the replicator's install line and one command, and one paragraph for the
  stranger — product voice, no method vocabulary.

**Risks named up front.**
- *Gate (a) on a genuinely grey object with a real halo* — a1 may pass because the object's own
  grey is far from the ground's; a2/a3/a4 are the nets. Named, not eliminated.
- *Edge erosion on thin features* — the 5 % area guard is the only protection, and a very thin
  takeable could still lose a shaft edge. Row 4's key and coin are the first real test; the guard
  reports its number every run.
- *Two-state x registration is not verified by geometry.* Stated in the gate report, not papered
  over.
- *A corpus image failing a hard gate* — the fork is the Navigator's, with the two outcomes named
  in §3.1.

## 16. Out of scope, declared

§4b rules 3 and 4 — the materialization ladder and content-addressed keying by
noun/archetype/period/style — are structure the row does not build. Row 3's scope is rule 1 (pure
stages, thin CLI) and rule 5 (the VLM seam). Named here so nobody reads their absence as an
oversight.

---

## 17. Disposition of the plan critic's findings

**Fixed.** F1 (§0 — corpus located, committed by the asset seat, characterised). F2 (§0 —
characterised *before* §3 pins anything; the prompts show it was generated to the contract).
F3 (§3.3 — every threshold carries a measured basis in the file). F4 (§3.1 — the fork is named as
the Navigator's, with both outcomes). F5 (§9, §13 — `--check`; the second desk verified, not
minted). F6 (§3.1 — reading pinned, deviation carried in three places). F7 (§6.3 — clearance check
plus an open-state composite test). F8 (§6.3 — `min_dy_clearance` derived and enforced). F9 (§6.3 —
cavity derived from part + slide; a contradicting flag is an error). F10 (§6.1 — measurement
procedure, boundary-darkness check, mask committed). F11 (§10 — all three dims from the operator;
the pixel arithmetic is a warn-only cross-check). F12 (§10 — `light_measured` carries the
contradiction). F13 (§5.2 — ground-contact footprint, gate (f), amendment recorded). F14 (§9(g) —
over-matte gate plus control). F15 (§4.5, §9 a4 — erosion measured and looked at; the rim clause is
judged over a dark ground). F16 (§13.3 — the one look, reported). F17 (§3.3, §9 a4 — draw scale
pinned and used). F18 (§3.2 — 1.83 m in both blocks). F19 (§3.2 — pitch in both blocks). F20 (§3.2
— direction pinned, colour per facing, carried to Kabe before prompt sheets). F21 (§9 — blueprint
§9.4 amended in the same commit, `[AI, row 3]`, reversible by Kabe, carried as a fork). F22 (§3.3 —
`ingest_schema`). F23/F24/F25/F26 (§14). F27 (§12 — the arrival test split, with a declared
fallback). F28 (§8 — LANCZOS, decided by looking). F29 (§11 — report shape pinned and tested).
F30 (§6.1 — `replicator/masks/`, commands recorded). F31 (§7 — `--state-origin` required; x
unverified and said so; clause (iii) added). F32 (§7 — recorded and carried). F33 (§3.3 — 64, with
its basis). F34 (§10, §12 — vocabulary cross-checked against the shipped records). F35 (§1 —
install line in README and architecture; the test package raises a message, not a traceback).
F36 (§10 — `--source`, orphan cleanup; §16 — rules 3/4 declared out of scope).

**Nothing is declined.** Two are fixed by *stating* rather than solving, which is the honest
answer and is marked as such in the artifact itself: two-state x registration (F31) and the
demo-fixture composition question (F27b).
