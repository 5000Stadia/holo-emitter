# Row 23 — The scaffold experiments

Row 23 of `design/intention.md`. The target and its done clauses live there; this spec carries the
design, the numbers already measured, the rules fixed **before** any candidate exists, and the
constraints a builder must not walk past.

**Status: plan ACCEPTED at the third planning round; P0 BUILT.** The row was amended at
`1d15e62` to run the matrix on TWO walls, exercising the costed §12.2 option. What P0 built is
`tools/make-scaffold.mjs`, its stroked glyph table, the sidecars, the pre-committed brackets for
both walls, the label pass, the batch's top-level PNGs, `tests/playwright/scaffold.spec.mjs`
(§7.1–7.9, §7.13) and `replicator/contract.json`'s one ruled camera sentence. Every number this
plan predicted was reproduced by the running code and is marked BUILT where it was.

**Third and final planning round.** The first draft's foundation stood and its decision layer did
not; the second draft's decision layer was arithmetically wrong in its error rate and *structurally
blind to the thing the row varies*. That second failure cannot be engineered away on this wall, and
§5.5 says so in numbers rather than trying once more. **The row takes the sanctioned fallback: the
matrix reports numbers, and the recipe is chosen by explicit, labelled judgment on the table plus
Kabe's look.** N2 becomes a stated limitation, §12.2 costs the one route that would remove it, and
the Navigator owns that call.

---

## 0. What this experiment is, and what it cannot say

**This is an obedience experiment.** The scaffold stamps the hearth where `plan.json` draws it.
Blueprint §5 makes the approved *image* the geometric authority and row 22 exists to move the plan
onto the painting, so **the position this row asks for is one the project has already ruled wrong**.
What the matrix measures is *whether a request method gets obeyed*, never *which method paints the
better room*. No candidate from this round is ever promoted (§10).

**On `study/N` it cannot cleanly say even that, which is why the row runs on two walls.** The gate's PASS verdict is a *pure camera* verdict, and
every cell of the matrix carries the same camera paragraph, so any rule built on admitted counts is
blind to the manipulation the row is testing. The one number that does reflect the manipulation is
carrier obedience, and on this wall it is weak for a reason no metric can fix: the plan's hearth box
centre sits **4.7 px** from the wall centre, so *obeying the label* and *centring a hearth by reflex*
are nearly the same act. §5.5 carries the arithmetic; §12.2 carries the wall that would fix it.

**`study/E` is the wall that can say it** [row amended 2026-08-23]. Its plan door sits **1.100 m**
off the wall's cross-axis centre; the standing-eye wave measured the painting putting that door
**dead centre** — `opening_x0..x1` 673…860 against a corner midpoint of 768.0, 1.5 px off centre.
So on that wall obedience and reflex are **opposite acts**, not nearly the same one, and the door
detector already exists as a tier-1 ruler where `study/N`'s stone-case moulding detector does not
exist at all. Its camera reference is **its own cand-6 reading** — focal 835.2 px, eye 1.138 m —
stated as such wherever it appears and never conflated with the Kabe-ruled reference.

So the row's deliverable is **the table and the honest separation statistics beside it**, with
`study/E`'s carrier arm as the headline discriminator, and the recommended recipe is a judgment
made in the open, with its basis named.

---

## 1. The ground truth, measured, before anything is asked for

Every literal below is **read at run time** by the scorer, never typed (F36) — row 22 will move some
of them. They are printed here as what those reads return today.

**The camera** — `design/plan-draft/measured/cand5ref/study-N.json`, off
`backdrops/source/study-N/cand-5-reference.png`, by `measure.py --round cand5ref`:

| quantity | value |
|---|---|
| `px_per_m_at_wall` | 188.421 |
| implied focal | **819.6 px** at the drawn 4.35 m |
| eye height | **1.183 m** |
| horizon y (ceiling-ramp fit) | 526.1 (residuals 0.30 / 0.29 px over 61 columns a side) |
| floor line y | 749 |
| corners | 188 … 1351 (span 1163 px = **6.172 m** painted against a ruled 5.45 m) |
| chair-rail | 179 px above the floor line → y 570, at a ruled 0.95 m |
| fireplace **opening** | 379 … 550 |
| ceiling line y | 118 (storey 3.349 m painted against a ruled 2.80 m) |

*(F8) The opening measures 171 px by subtraction where the JSON records 172 — an
inclusive/exclusive off-by-one, 0.908 m against 0.913 m. Recorded, not reconciled; §5.4 makes the
firebox a cross-ruler that votes on nothing.*

**The carrier disagreement.** `backdrops/study/N.meta.json` records the plan's hearth breast at
`plan_px [565.4, 980]` against a painted firebox at `[379, 550]`, `centre_delta_px −308.2`. Row 22
measures the painted stone case's outer mouldings at **0.756 and 2.023 m** along the wall — 1.27 m
wide, centred on 1.39 m; from the left corner at the reference's own ruler, **330.4 … 569.2 px**.

**`study/E`'s ground truth, and it is a different KIND of ground truth.** Its reading is
`measured/cand6/study-E.json` — an ADMITTED candidate, not a Kabe-ruled reference: `px_per_m_at_wall`
204.211, implied focal **835.2 px** at the drawn 4.09 m (+1.9 %), eye **1.138 m** (−3.8 %), floor line
758, corners 188…1348 (span 1160 px = 5.68 m painted against a ruled 4.80), chair-rail 194 px above
the floor line, and the painted door opening at **673…860**. It is admitted-but-held, and the reason
it is held is this row's probe: *"the painting puts the doorway dead centre of frame and the approved
plan puts it 1.11 m to the right."*

**A verification anchor that is not a coincidence.** `groundplane.yAtHeight(0, 0.95, meta)` on the
promoted meta returns **570.0**, and the reference's measured `dado_rail_y_px` is **570**. If that
does not hold when the generator is built, the generator is wrong before any image is made.

---

## 2. The scaffold generator

### 2.1 What it is

`tools/make-scaffold.mjs` — a capture-path Playwright script in the idiom of
`design/batches/*/capture.mjs`, but a **production tool**, because the manor run reuses it on 86
more facings.

```
node tools/make-scaffold.mjs <location>/<facing> --out <dir>
        [--camera page|derived]      default: page
        [--verify]                   render at the page's own options, for §7.1
        [--emit-packet <technique>]  the recommended recipe, after this row (§8)
```

Per facing: `<loc>-<facing>-frame.png`, `<loc>-<facing>-scaffold.png`, and
`<loc>-<facing>.scaffold.json` — the sidecar, carrying the meta and its origin, the standpoint and
`camera_wall_m`, the plan's drawn digest from `design/plan-draft/approval.lock`, the SHA-256 of
`src/renderer.js` and `src/groundplane.js`, every stamped rect in scene px with the metres and the
anchoring it came from, both horizontal spaces (§2.5), every pre-committed detector bracket (§5.2),
and the git commit. A scaffold whose sidecar digest no longer matches the tree is **stale** and the
tool names the document that moved.

**(F37, N14) Comparisons are on RGBA buffers; PNGs are decoded to buffers, never compared as bytes.**
`plan.spec`'s render-lock case records why browser-encoded PNG bytes cannot be regenerated. §7.4
therefore decodes the committed PNG and compares pixel buffers — which is not a re-encode comparison
and is stated as such. This also names the divergence from §12.6's capture spec: that spec is an
element screenshot of `#scene` for consumption-camera artifacts, and a scaffold is not one.

### 2.2 How the frame is the shipped frame

Cold `file://` load of `index.html?world=nav-manor`, wait on `HOLO_APP.paints > 0`, then in the page:
drop the facing's `image` if it has one (the page's own documented behaviour for a painting that will
not decode is "drop it and draw the grid", and the meta survives, so a promoted wall yields a
scaffold at its own painted camera); render into a detached 1536 × 1024 canvas via
`window.HOLO.renderer.render(...)`; read the pixels back with `getImageData`.

**(F1) `nav-manor` stages no objects, so no aperture carries a leaf** and every aperture draws its
destination — `study/E` at `beyond_m` 8.6, `hall/W` at 6.05. A scaffold must not show the room beyond
a doorway, so the two renders are separated and both claims are checked separately:

- **scaffold render:** `{ backdrop_only: true, no_through: true }`
- **verification render (`--verify`):** `{}` — byte-for-byte the page's own option set
- **§7.1** hashes the verification render against the live `#scene` buffer — identical options.
- **§7.2** asserts the option delta lies wholly inside that facing's aperture rects.

**(F1b) `backdrop_only` is vacuous on `nav-manor`** — nothing is staged, as `guards.spec` records —
so it changes no pixel there. Kept as belt-and-braces for a future staged world, and said to be so
rather than credited with work it is not doing.

**The facing glyph rides along.** The grid draws a 0.35 m stroked letter at the eye line; it is
shipped content, both techniques carry it equally, the prompt names it (§4.1), and the measurement
gains a `text_painted` flag (§5.4).

### 2.3 The derived-camera scaffold is an injection (F5)

The page never holds a derived meta for a **promoted** facing, and `deriveMeta` is a node-only ESM
module the browser never loads.

- **`--camera page`** takes the meta the page holds — measured on a promoted facing, already derived
  on an unpainted one. This is what a player's build resolves, and **§7.1 hash-verifies this column
  only.**
- **`--camera derived`** computes the meta in node and **injects** it before rendering. The renderer
  is the shipped one; the meta is one the page would never hold for that facing. Labelled an
  injection in the sidecar, the table and the batch.

**The injection is proved faithful where the native answer exists (§7.3):** on `study/E`, whose page
meta *is* the derived meta, the injected and native paths must produce identical buffers. The critic
confirmed they agree to 0.0000 %.

### 2.4 The label pass

A second pass over the verified frame. `plan-projection.facingCarriers` gives kind, `from_m`, `to_m`,
`width_m`, `u`; `openingsForFacing` gives door rects.

**(F18) Labels use a stroked polyline glyph table, not `fillText`.** `renderer.js` establishes the
law — `GLYPHS` exists as stroked polylines *because* font rasterisation is environment-fragile — and
a `fillText` scaffold cannot answer to a re-render test on any machine but the one that made it.
**(N8) The declared glyph set is `A–Z`, `0–9`, space, `.`, `-`, `·`, `%`, `×`**, and **every label
string is restricted to it** — the second draft's labels used an em dash the table would not have
carried. A test asserts every emitted label character is in the set, so a future label cannot
silently fall back.

*Fallback if the table is judged too much work:* lock-binding, as `render.lock` ties each sheet PNG
to its SVG. Rejected as primary because the manor run makes 86 of these and 86 hand-maintained
hashes is 86 chances for a stale entry to lie quietly.

### 2.5 One horizontal space, and the renderer is its authority (F13, F7, N6, N7)

Two mappings exist and the second draft mixed them:

- **Aperture space** — `groundplane.xAtScale`, spanning `u ∈ [0,1]` across the **corner span**
  (1163 px on `study/N`). A door's click target lives here and §11 requires the painted opening to
  coincide with it.
- **Ruler space** — `wallCentrePx + (m − wall_width_m/2) × px_per_m_at_wall`.

**Every metric mark is stamped in ruler space, and the authority is the renderer itself, not only the
gate.** `drawGrid` already draws its own metre lines at `wallCentrePx + m × px_per_m_at_wall` — so a
carrier stamped in ruler space lands **on the grid lines in its own scaffold**, and one stamped in
aperture space would drift off them. The gate's agreement is the second reason, not the first: the
second draft's firebox tick, drawn at corner-span scale, spanned 192 px, which the gate reads as
**1.019 m** against a declared 0.90 m — a candidate obeying to the pixel would have failed by 13.2 %.

**(N6) That mapping is anchored at the wall CENTRE, and the choice is worth stating.** The ruled
5.45 m is centred inside the painted 6.172 m span, leaving 0.36 m of painted wall unaccounted at each
end. A corner-anchored stamp (`corner_x0 + m × ppm`) would put the hearth's left edge at 498.9 px
where centre-anchoring puts it at 566.9 — **68 px apart, 21 % of the carrier arm's own scale**. The
choice is centre-anchoring because that is what `drawGrid` does, and the sidecar records the anchor
by name so no later reader has to infer it. **The plan's datum is the wall's left end**; §0 and §2.6
describe positions in that datum and the stamp maps it centre-anchored — the second draft's
"from the left of the view" was loose about which, and this sentence is the fix.

**(N7) Where the two spaces diverge, and the paragraph the manor run is owed.** The divergence is a
property of a *measured* meta whose painted wall is wider than the ruled one, so it exists on exactly
the two promoted walls: **`study/N` at 13.25 %** (6.172 / 5.45) and **`study/W` at 26.0 %**
(6.048 / 4.80). Neither carries a door, so the one case where the two spaces genuinely conflict —
a door whose click target is in aperture space and whose ruled width is scored in ruler space — is
**unexercised today and arrives with `study/E`'s promotion**. `study/W`'s 26 % is exercised silently
by §7.1 and §7.4 every run and is named here so it is not mistaken for an untested path. The manor
run needs a ruling on that conflict before the first door-bearing wall is promoted; this row does not
own it, and §12.6 carries it.

Vertical extents — a plan view is a horizontal section holding no vertical dimension anywhere:

| carrier | horizontal | vertical | authority |
|---|---|---|---|
| door | `openingsForFacing` rect (aperture space) | same rect, 2.00 m head | **ruled** — §11 |
| fireplace | plan breast, ruler space | floor line → 1.60 m | **scaffold convention, declared** |
| — its firebox | tick pair, 0.90 m at 188.421 px/m | — | ruled size, **cross-ruler only** |
| window | plan extent, ruler space | sill 0.90 m → head 2.00 m | **scaffold convention, declared** |
| chair-rail | corner to corner | `yAtHeight(0, 0.95, meta)` | **ruled** — §11's universal anchor |

Every scaffold's legend states which marks are ruled, which are conventions, and which space each is
in. Only ruled quantities are scored — `cross_rulers_do_not_vote`, applied one step earlier.

### 2.6 What `study/N`'s scaffold is

One plan carrier: a fireplace, **1.65 – 3.85 m from the wall's left end** (the plan's datum), 2.20 m
wide, `u 0.504587`. No door, no window. So:

- the shipped grid frame at the page's meta — floor line y 749, ceiling y 221, corners 188 and 1351,
  both returns, the metre grid, the stroked `N`;
- one labelled box at **x 566.9 … 981.5** (414.5 px = exactly 2.20 m at 188.421 px/m, centre-anchored),
  floor line up to 1.60 m, carrying `FIREPLACE` and `BREAST 2.20 M · FIREBOX 0.90 M`, the firebox a
  tick pair 169.6 px apart;
- one full-width line at **y 570**: `WAINSCOT CHAIR-RAIL 0.95 M ABOVE FLOOR - GATE ANCHOR`;
- the legend, bottom-left, clear of the wall plane.

The box agrees with the meta's own `plan_px [565.4, 980]` to 1.5 px. **BUILT** — the generator
prints `fireplace ruler 566.9..981.5 px (2.20 m)`, floor y 749, chair-rail y 570, corners 188..1351,
focal 819.6 px at 4.35 m, and `scaffold.spec` recomputes every one of them from `facingCarriers` and
`groundplane` rather than from the tool.

**(a) The scaffold's ceiling is the ruled storey**, y 221 against the reference's painted y 118 —
0.55 m apart. Correct behaviour, and it means the ceiling line **may not be scored**: scoring it
would fail a candidate for obeying the scaffold.

**(b) (F34) That instruction is a confound on the eye reading, and the batch says so.** Eye height
comes from the ceiling-ramp fit. The ramp intersection is geometrically invariant to ceiling
*height* — lines parallel to the view axis converge at the principal point whatever height they run
at — so the confound is smaller than it looks. What moves is the fit's **conditioning**: a lower
ceiling gives shorter ramps over different columns. Each roll's ramp residuals and column counts
print beside its eye reading.

### 2.6b What `study/E`'s scaffold is — the non-blind probe

`study/E` carries **one plan carrier**: the door `op13`, 3.00 – 4.00 m from the wall's left end,
1.00 m wide, `u 0.729167`. It is not promoted, so the page holds only its DERIVED meta (a 1024 px
lens); its scaffold therefore uses §2.3's injection with the **cand-6 reading**, the mechanism
§7.3 proves faithful on this exact facing.

- the shipped grid frame at that reading's camera — floor line y 758, ceiling y 121, corners 188
  and 1348, both returns, the metre grid, the stroked `E`;
- one labelled box at **x 890.5 … 1094.7** (204.2 px = exactly 1.00 m at 204.211 px/m), running
  from the floor line up to the ruled 2.00 m head at **y 349.6**, carrying `DOOR` and
  `OPENING 1.00 M × 2.00 M HIGH`;
- the chair-rail at **y 564.0**, against that facing's own measured 194 px above its floor line;
- the legend, naming the camera as `MEASURED READING CAND6 - INJECTED, ADMITTED NOT PROMOTED`, so
  nobody reading the scaffold can mistake it for the Kabe-ruled reference.

**Why this wall discriminates, as a number rather than as an argument.** The painted reflex door is
673…860; the stamped box is 890.5…1094.7. **They overlap by 0 px.** `scaffold.spec` asserts the
overlap is under 15 % of the box width and that the painted centre is within 6 px of the wall
centre — so the reflex is demonstrably a CENTRING, and the only way to score on this arm is to put
the door where the label is. On `study/N` the equivalent overlap is near total.

**What it still cannot say.** `study/E` has no Kabe-ruled camera, so its camera arm is scored
against its own admitted reading and is weaker evidence than `study/N`'s. The two walls answer
different halves: `study/N` carries the camera ground truth, `study/E` carries the carrier
discrimination. Neither carries both, and the batch says so rather than averaging them.

---

## 3. Roll counts

The seat rides the existing subscription, so the cost is wall-clock and seat sessions, not money.

**Four rolls per technique; every technique runs its full four.** The first-roll early stop is
deleted by the Navigator's ruling: a stop taken on the first three images is optional stopping
decided on the data, and it makes any margin guard degenerate at n = 1.

Why four: the ledger's clock is a pass rate, and n = 4 gives 25 % granularity where n = 2 gives 50 %.
Roll-to-roll scatter here is large — cand-6's admitted walls sat at +1.9 % and −3.9 % focal while its
failures ran to +25.6 % — so a between-technique difference means nothing without a within-technique
spread, and `measure.py` already prints *"ONE RULER ONLY — direction, not magnitude"* wherever a
verdict rests on one reading.

**Totals, with the second wall folded in.** Three techniques × 4 rolls × **two walls** = **24
stage-1 rolls**, plus **4** for the lens arm (`study/N` only — it is the wall with the Kabe-ruled
camera, and the fork is about that camera), = **28**. Conditionals: **8** for the run-off (§5.6,
the Navigator's spend at P3) and **4** for technique (4) (§4.5, NULL-only). Worst case **40**;
expected 28.

The +12 is the cost the row's amendment names, and what it buys is the only arm in this design that
can see the manipulation.

---

## 4. The technique packets

### 4.0 The style reference is already ruled (F32)

`design/approvals.log`, **2026-08-21 | style seed | "Warm" | 1982bff**, committed at
`design/references/style-seed-warm.png`. **Image 1 is that file, in every packet, without argument.**
CP-23A presents it as the standing default and asks Kabe to confirm it *for the manor run*, which is
a different question from re-opening the seed. It is never a `study/N` frame: a style reference of
the wall under test lets every technique "adhere" by copying the answer.

### 4.0b The control

Techniques (1) and (2) carry **byte-identical prompt text** but for the two declared lines below;
§7.6 asserts the diff.

### 4.1 Technique (1) — scaffold alone + style ref

**Images:** `1` = `design/references/style-seed-warm.png`; `2` = `study-N-frame.png`.

```
Use case: historical-scene
Asset type: gameplay backdrop for the study north wall, circa-1660 English manor
Input images: Image 1 is the exact reference for painted style, medium, materials,
  palette, period detail and light quality. Image 2 is a geometric layout diagram of
  the wall to be painted: it is a technical drawing, not artwork to imitate.
Primary request: Paint the north wall of an empty circa-1660 English manor study,
  matching Image 1's finish and Image 2's geometry exactly.
Gate anchor: the wainscot chair-rail above the floor, 0.95 m.
Camera and composition: 1536x1024 landscape. Reproduce Image 2's camera exactly. The
  camera is level, with zero upward or downward tilt. The wall-floor line, the two
  room corners, the side-wall returns at left and right, and the amount of visible
  floor all land where Image 2 puts them, to the pixel. One metre of wall at the wall
  plane spans 188 pixels.
Architecture and measurement anchors: A clearly legible wainscot chair-rail runs
  continuously corner to corner at exactly 0.95 m above the floor, on every exposed
  wall surface including the side-wall returns. The stone Tudor fireplace's firebox
  opening is exactly 0.90 m wide. Make both dimensions physically coherent and
  unmistakable in the architecture.
Materials and period detail: dark hand-finished oak wall panelling, aged
  parchment-toned plaster ceiling, wide worn oak floorboards, pale carved stone Tudor
  fireplace surround, brick-lined firebox, a small lively lit wood fire.
Style and lighting: as Image 1 - fine oil realism with tactile brush detail, deep warm
  browns, cool ambient light from the right, localized amber firelight from the
  fireplace, gentle natural falloff.
Constraints: the room is completely empty of furniture, loose props, people and
  clutter. Image 2 contains grid lines, a large letter and annotation text; these are
  diagram marks identifying the wall, and the painted room contains no line, letter,
  word, number, label, watermark or border of any kind.
```

`Gate anchor:` satisfies `prompt_lint.py`'s chair-rail ruler at 0.95 m; nothing here forbids the
floor, forbids corners, or forbids a camera correction it also asks for.

**Fork 3, RULED by the Navigator and executed in this row:** `replicator/contract.json`'s
`backdrop_block` still says 1.83 m eye and 24 mm against the standing camera's measured 1.183 m and
819.6 px lens. **That one camera sentence is amended in this row, citing the "B" ruling** — the
sentence dies in the same change that makes it false. Nothing else in `contract.json` moves.

### 4.2 Technique (2) — scaffold with labelled carriers

**Images:** `1` = the same seed; `2` = `study-N-scaffold.png`. Technique (1)'s prompt plus exactly
two lines, which are the whole difference:

- `Input images:` gains — *"Image 2's boxed labels mark where a named feature belongs: paint that
  feature inside its box, filling it. The labels themselves are instructions and are never
  painted."*
- `Architecture and measurement anchors:` gains — *"The fireplace stands where Image 2's FIREPLACE
  box stands, its stone breast filling that box's width."*

### 4.3 Technique (3) — scaffold + style + text variants

Same two images; the variable is prose. Four rolls as **two variants × two rolls**, so a variant is
separable from roll noise. **(F33)** Both speak in the scaffold's register, with every number
computed by the packet emitter from the sidecar and none typed:

- **V-A, measurement-forward.** *"The fireplace breast begins 2.01 m from the left corner and ends
  4.21 m from it, on a wall measuring 6.17 m corner to corner as Image 2 draws it — 33 % to 68 % of
  the wall's width."*
- **V-B, scene-forward.** *"The stone fireplace stands just left of the wall's centre, its breast
  projecting half a metre into the room, with a broad clear expanse of panelling to its right."*

### 4.4 What every packet carries

`design/batches/row23-scaffold/packets/t<k>/`: `style-seed-warm.png`, `scaffold.png`, `prompt.txt`,
`PACKET.md` — attach order, roll count, **the exact opaque return ids for its rolls** (§5.1), and the
seat's standing fence (write only under `backdrops/`, never `src/`, never `design/`).

### 4.5 Technique (4) — content-scaffold, NULL-triggered only (F41)

Blueprint §11b says the matrix gains technique (4); the row's text enumerates three. It is dispatched
**only where §5.5 records no separation at all** — the second draft's "or too thin" escape hatch is
deleted. *What it would be:* the labelled scaffold with its left return replaced by a projected slice
of `backdrops/study/W.png` and floor/ceiling swatches from the room's own approved pixels. *Why it is
half-buildable:* `study/E` is unpromoted and still grid, so the right return cannot inherit real
pixels, and §11b's typed material library does not exist. 4 rolls, measured identically, the
half-inheritance recorded on its own row.

---

## 5. The measurement

### 5.1 Where returns land, and the blinding (N4)

**Return paths carry no technique.** The second draft's `row23-t<k>-r<n>.png` defeated its own
blinding in the filename.

| what | path |
|---|---|
| the two scaffolds, committed | `design/batches/row23-scaffold/study-{N,E}-{frame,scaffold}.png` |
| their sidecars | `design/batches/row23-scaffold/study-{N,E}.scaffold.json` |
| returned candidates | `backdrops/source/study-{N,E}/row23-<id>.png` |
| each roll's prompt | `backdrops/source/study-{N,E}/row23-<id>.prompt.txt` |
| the id → cell map | `design/plan-draft/measured/row23/assignment.json` |
| readings | `design/plan-draft/measured/row23/<id>.json` |
| marked frames | `design/batches/row23-scaffold/measured/<id>-marked.png` |

`<id>` is an opaque 8-hex token carrying **neither the technique nor the wall**. `assignment.json`
maps id → `{wall, technique, variant, roll, camera}` for all 24 stage-1 rolls and the 4 lens rolls,
is **committed before any candidate is measured**, and is the only map; the join happens at table
time. §7.8 asserts its blob has never changed since the commit that introduced it.

**What this blinds and what it cannot.** It blinds the measuring hand and the detector
configuration, which is where a free parameter could bend the result. It cannot blind the generating
hand, which is holding the packet. That is inherent and is not claimed away.

**What this does and does not blind, said plainly:** it blinds the *measuring* hand and the detector
configuration, which is where a free parameter could bend the result. It cannot blind the
*generating* hand, which is holding the packet and knows which technique it is running. That is
inherent and is not claimed away.

`prompt_lint.py` walks every `*.prompt.txt` under `backdrops/source/<dir>/`, so every row-23 prompt
is linted the moment it lands. The pre-rule prompts are grandfathered and refused; row 23's are not.

### 5.2 The harness, and every bracket pre-committed (F11, N3)

`measure.py` gains `--round row23`, `gate.py` gains `--round row23`, both on the standing-eye wave's
machinery: the reference read from `measured/cand5ref/study-N.json` and never typed; the band the
standing ±8 % on focal **and** eye, because *"a round that could bring its own band would be a corpus
moving the law"*; the declared chair-rail the one voting ruler with everything else in
`_cross_rulers`; `wave_control()` every run, VOID if it has moved; marked frames per roll.

**`CFG_ROW23` is a function, not a table** — no per-roll literal exists, and §7.7 asserts it
structurally. **(N3) And the bracket widths, which are the real free parameter, are each derived
from the standing licence and written into every sidecar before any image exists. BUILT — these are
the numbers the generator emitted:**

| bracket | derivation | `study/N` | `study/E` |
|---|---|---|---|
| `floor_window` | ±8 % of the floor-to-horizon separation, which is `eye × px_per_m_at_wall` | ±17.83 px | ±18.59 px |
| `rail_band` | ±8 % of the anchor's own height above the floor line | ±14.32 px | ±15.52 px |
| `ceiling_band` | ±8 % of the ceiling-to-floor span | ±42.21 px | ±45.74 px |
| `carrier_window` | the stamped box dilated by **this wall's own measured reflex-versus-plan separation** | ±324.4 px | ±226.1 px |
| `rail_columns` | the wall columns clear of every carrier | derived | derived |

An unstated bracket width silently sets the answer: a legible feature three pixels outside a
hand-chosen window is a measurement failure that would be scored as disobedience. Every width above
is the ±8 % the standing law already licenses, propagated through a geometry the scaffold declares,
so there is nothing left to choose — and §7.7 recomputes each one from `MEASURED_BAND` and the meta
alone, so a hand cannot widen one without the suite noticing.

**The carrier tolerances are read from the corpus, never typed.** `study/N`'s 324.4 px is the
approved reference's stone case (row 22's 0.756 and 2.023 m, from the left corner at that painting's
own ruler) against the stamped box; `study/E`'s 226.1 px is the cand-6 painting's door opening
against its stamped box. Row 22 moving `study/N`'s hearth moves its tolerance with it, which a typed
number would not do.

**(N3) So the ledger gains a kind rather than lying with an existing one.** `measurement_withheld`
keeps the wave's meaning exactly — *we* cannot measure — and is used only when the detector cannot
run at all (a frame that is not 1536 × 1024, a moved control). A feature absent from its
licence-derived bracket is a new kind, **`scaffold_feature_absent`**: *"the feature the scaffold
declares is not present within the band the standing licence allows."* Only the new kind counts
against a cell; `measurement_withheld` counts against nothing and stops the round.

### 5.3 The ledger extensions (F20–F22)

`write_misses` keys carried dispositions by **facing**, and every roll shares `study/N`, so the
existing carry collides sixteen ways; and a PASS is not a miss. Two minimal extensions, each with its
reason in the code:

1. **The carry key becomes `(round, facing, candidate)`**, falling back to `facing` where a line has
   no `candidate`. Legacy behaviour is unchanged; rolls stop overwriting one another's `status` /
   `baked_in`.
2. **`_record: "roll"` joins `"miss"` in the round-owned rewrite set.** A PASS emits `"roll"`; a FAIL
   or an absent feature emits `"miss"` with its kind. Without the extension a `"roll"` line falls
   into the "every other record survives" branch and accumulates stale duplicates on every re-run.

**One round string, `"row23"`,** with `technique`, `variant`, `roll` and `camera` as fields.

**(F17) The clock says out loud that it is not like-for-like.** The wave's 0-of-7, 0-of-7, 2-of-7 are
*seven walls at one roll each*; row 23's are *four rolls of each of two walls*. The `clock` record carries
`_not_comparable_because`, and the batch repeats it, because a number set beside another number reads
as comparable whatever the prose says.

### 5.4 The three measured components, per wall (F27, F12, F14, N5)

**The second draft's `d_horizon` and `d_floor` are deleted** — an invented band filed under BAND6's
authority. An absolute image row has no band derivable from the licence, and the floor-horizon
separation is algebraically `eye × px_per_m_at_wall` (749 − 526.1 = 222.9 = 1.183 × 188.421,
exactly), so scoring it would triple-count. Absolute horizon, floor, ceiling and corners are
**measured, printed, and vote on nothing**.

**The carrier arm is on edges, not centre, and it is measured per wall.** A centre arm cannot
discriminate on `study/N` — the box centre (774.2) sits 4.7 px from the wall centre, so a
reflex-centred hearth scores near-perfect without reading a label. Edges coincide with nothing:

| | | scaffold asks | painted reflex | displacement |
|---|---|---|---|---|
| **`study/N`** | hearth left | 566.9 | 330.4 | 236.5 px |
| | hearth right | 981.5 | 569.2 | 412.3 px |
| | | | tolerance | **324.4 px** |
| **`study/E`** | door left | 890.5 | 673 | 217.5 px |
| | door right | 1094.7 | 860 | 234.7 px |
| | | | tolerance | **226.1 px** |

`d_carrier_edges = mean(|x_left − scaffold_left|, |x_right − scaffold_right|)`, in pixels, each
against its own wall's tolerance — the reflex-versus-plan separation that wall has already been
measured to produce, under the identical measure, read at run time and never typed. 1.0 means
"obeyed the box"; 0.0 means "did no better than the ask that carried no label at all".

**The two walls are not equally informative, which is the whole reason there are two.** On
`study/E` the reflex rect and the stamped rect **do not overlap at all** (673…860 against
890.5…1094.7) and the reflex is demonstrably a centring — §7 asserts both, as numbers. On
`study/N` they overlap almost entirely. So **`study/E`'s arm is the headline discriminator** and
`study/N`'s is reported beside it as the weaker corroboration it is.

**(N13) The detector story differs by wall, and that difference IS the argument for the second
wall.** `study/E`'s door opening is an existing tier-1 ruler with existing detection
(`opening_x0_px`, `opening_y0_px`, `column_edge_candidates`). `study/N`'s stone-case outer moulding
has **no detector in the corpus at all** — its fireplace edges are hand-typed per facing — and a
blind window for it would span 1063 px of a 1163 px wall. No reliability is pre-committed for that
and none is claimed: where the moulding cannot be found, `study/N`'s arm is absent for that roll
and N5's rule applies.

| component | unit | target | tolerance | authority |
|---|---|---|---|---|
| `d_focal` | fraction, signed | 819.6 px | 0.08 | the standing band, `gate.py` `BAND6` |
| `d_eye` | fraction, signed | 1.183 m | 0.08 | the standing band |
| `d_hearth_edges` | px, unsigned | the scaffold's box edges | 324.4 px | the reference's own miss |

**Cross-rulers, printed, voting on nothing:** firebox width, ceiling line, corners, painted wall
width. The firebox is explicitly among them, which is the other half of §2.5's fix — with nothing
scoring it, the two-rulers problem has no victim.

**Flags:** `chair_rail_legible`, `corners_in_frame`, `floor_line_in_frame`, `text_painted`,
`room_empty`. `text_painted` is a **disqualifier**: it does not enter the index and the roll is not
admitted.

```
adherence_raw = 1 - mean( |d_focal|/0.08, |d_eye|/0.08, |d_carrier_edges|/tolerance )
adherence_pct = 100 x max(0, adherence_raw)          # presentation only
```

Ranking and medians use **`raw`**, unclamped, because the clamp collapses every bad roll to a tie at
zero and destroys the ordering. **(N5) A roll whose carrier term is absent has no index at all** and
is listed in its own column with its reason. Averaging the two surviving terms would reward exactly
the rolls whose obedience could not be verified; imputing a worst case would invent a number. Every
technique's summary prints **"indexed j of admitted k"** so the shrinkage is visible rather than
folded into a mean. `k` counts camera admission; the index counts fully-measured rolls; both are
printed, and §5.5 says why neither can be promoted to a verdict on its own.

**(N13) And the hearth detector is the reason this arm is fragile, stated with its size.** The corpus
has *no* moulding detector — its fireplace edges are hand-typed per facing. A blind detector's window
must be the scaffold box ± the arm's own tolerance, which spans **1063 px of a 1163 px wall**: in
effect "find a stone case anywhere on this wall", across panelling, a chair-rail crossing it, a lit
firebox and a brick lining. **No reliability can be pre-committed for that**, and this plan does not
claim one. The arm is built and reported; it is not made to carry a decision.

### 5.5 What the numbers can and cannot decide — the row's central finding

**The blindness, first, because it governs everything after it.** Gate-PASS `k` is a pure camera
verdict and all four cells carry the same camera paragraph, so **no rule built on `k` can see the
manipulation.** Sharpening such a rule with more rolls sharpens the wrong instrument. The only number
that reflects the manipulation is `d_hearth_edges`, and on this wall:

- the scaffold's box centre is **4.7 px** from the wall centre, so obeying and reflex-centring are
  nearly the same act;
- a realistic no-label reflex already scores **0.78 – 0.85** on the edge arm, so the live dynamic
  range is about **0.75 → 1.00** — smaller than the camera scatter sitting in the same index;
- the arm vanishes on any roll whose moulding the detector cannot find (§5.4), which is the rolls
  whose obedience is least certain.

That is a property of the **wall**, not of the metric, and no scoring redesign removes it.

**(N1) And the second draft's own arithmetic was wrong in the direction that flatters it.** Its
run-off advertised 0.099; the true two-sided rate at n = 8 is **0.198**, and the full two-stage
procedure with the selecting rolls carried forward is **0.164** worst-case — not the 2.5 % the
primary clause advertised. Restructured to score **only fresh rolls** (the critic's option (b)), a
two-way n = 4 test at margin ≥ 3, k ≥ 3 has a true **7.0 %** two-sided false-separation rate, and its
honest end-to-end power is:

| p of the better technique (others at 0.286) | P(selected) | P(wins fresh) | end-to-end |
|---|---|---|---|
| 0.60 | 0.919 | 0.177 | **0.163** |
| 0.75 | 0.973 | 0.324 | **0.315** |
| 0.90 | 0.996 | 0.520 | **0.517** |
| 1.00 | 1.000 | 0.676 | **0.676** |

A technique that passes the camera gate *every time* against a 2-in-7 field is separated two thirds
of the time — on a statistic that cannot see the labels anyway.

**So the row takes the sanctioned fallback, and the crown is deleted rather than weakened.** No
clause anywhere in this plan converts a number into a recipe.

**What the second wall changes here, and what it does not.** It does **not** restore a crown clause
— the row's amendment says so and this plan carries none. What it changes is what the separation
report can be about: `study/E`'s carrier arm is a quantity the techniques actually move, so the
report's **headline** is that arm, with the camera arm reported beside it under the sentence that
governs it. If `study/E`'s arm separates the techniques overwhelmingly, the labelled judgment gets
to be easy; that is what the twelve extra rolls buy, and it is the honest form of the thing a crown
clause could not do.

**What replaces it: the SEPARATION REPORT.** The scorer prints, for whatever ordering the table
shows, the exact probability of an ordering at least that extreme under "all cells identical" — a
closed-form binomial computation over the observed `k` values, plus the same for the median
`adherence_raw` ordering by permutation. It is a **reported statistic, not an authority**, and it is
printed with the sentence that governs its reading: *the camera separation is evidence about camera
behaviour and not about labels, because every cell asked for the same camera.*

**And the recipe is chosen by explicit, labelled judgment**: the Navigator's, argued in the batch from
the table, the separation report, the carrier column with its indexed-of-admitted count, and Kabe's
look. The batch names it **"recommended recipe — Navigator's judgment, AWAITING KABE"**, never "the
winner". §7.10 asserts that the batch's own headline is the string the scorer emits for the state the
numbers are in, so a judgment cannot be dressed as a measurement.

**(N9) Ordering is defined for every degenerate case**, because a report that cannot rank is not a
report: a technique with no indexed roll has no median and ranks below every technique that has one;
ties among no-median techniques break by technique index; a 3-vs-0 comparison against a rival with no
median is reported as "no comparison available on the index" rather than as a win.

### 5.6 The run-off, retained and retargeted (Fork 5, RULED)

The Navigator keeps the run-off licensed. It is retained under the critic's option (b) — **scored on
fresh rolls only** — and retargeted to what it can honestly buy: **resolution for the judgment**, not
a crown. 4 fresh rolls each on the two techniques the table separates most (entrants by highest `k`,
then highest median `adherence_raw`, then technique index — **(N9)** fully deterministic including an
all-zero tie). Cost **8 rolls**. Its separation report prints the true **7.0 %** rate, and the batch
states that the run-off cannot cure the blindness in §5.5 — it narrows a camera comparison, and the
Navigator may decline to spend it for exactly that reason.

### 5.7 The table

```
id      cam   focal px  dfocal   eye m   deye  hearth L    R   d_edges  adh_raw  flags  verdict
a3f1c20 page     ...     ...      ...    ...     ...      ...    ...      ...     ...    PASS
...
SUMMARY t1: admitted k of 4 | indexed j of k | median adh_raw | min-max | absent n | text-painted n
SEPARATION REPORT: ordering <...>; P(>= this extreme | all cells identical) = <rate>
                   camera separation is evidence about camera behaviour, not about labels
RECOMMENDED RECIPE: <technique> - Navigator's judgment on the table and the look - AWAITING KABE
```

---

## 6. The 20 % lens gap fork

`design/batches/standing-eye-wave/README.md` question 6: a painted facing draws at 819.6 px where an
unpainted one draws the ruled 1024 — and *"This one is not an agent's to take."*

| | `--camera page` | `--camera derived` (injected, §2.3) |
|---|---|---|
| implied focal | 819.6 px | 1024.0 px |
| `px_per_m_at_wall` | 188.421 | 235.402 |
| corners | 188 … 1351 | 126.5 … 1409.5 |
| floor line y | 749 | 804.6 |
| chair-rail y | 570 | 580.9 |

Phase A's twelve rolls run `--camera page`. Phase B adds **4 rolls** at `--camera derived` under the
technique §5.6's deterministic entrant rule ranks first — never a hand-pick, including where nothing
separated. Every roll records `scaffold_camera`, `scaffold_declared_focal_px`, `measured_focal_px`,
and **both** `delta_vs_scaffold_pct` and `delta_vs_reference_pct`.

Both decision quantities are medians **over the derived-camera rolls** — the four images actually
shown a 1024 px camera (F23; the second draft's `r_meas` re-tested obedience to a camera those rolls
were already shown):

- `q_scaffold` = median `|delta_vs_scaffold_pct|` — *did it follow the camera it was shown?*
- `q_reference` = median `|delta_vs_reference_pct|` — *did it land on 819.6 anyway?*

| | finding | recommendation |
|---|---|---|
| `q_scaffold ≤ 0.08` | it follows a commanded camera | the ruled 1024 lens is reachable; the manor can paint to it and the reference regenerates |
| `q_scaffold > 0.08`, `q_reference ≤ 0.08` | it landed on 819.6 despite being shown 1024 | 819.6 is what this hand paints; closing the gap means moving `FOCAL_PX` |
| neither | it obeyed nothing | **AMBIGUOUS**; no law moves |

**(F24)** The undefined "spreads overlap" clause is deleted; this structure needs no spread quantity.
**(F25) Branch 1 is a test, not a forecast** — the whole wave (0/7, 0/7, 2/7) is evidence this hand
does not hit a commanded lens, so branch 1 firing would be a genuine surprise.

**Every branch produces a recommendation and closes nothing.** Moving `FOCAL_PX` moves every shipped
pixel; regenerating the reference re-opens a frame Kabe ruled on with the word "B".

---

## 7. Verification — BUILT

`tests/playwright/scaffold.spec.mjs`, 15 cases, chromium (a claim about a node tool and one canvas
has no second engine). The full suite is **1355 passed / 29 skipped, both engines**.

**Two of these cases have already earned their keep by going red on real defects during P0**, which
is the only evidence that a check can fail: the confinement case (item 4) caught the legend box
overhanging its own declared rect by six pixels, and the frame case (item 1) caught a route replay
that had silently compared `study/E` against `study/N` — the same class of error the second draft's
option mismatch would have been.

1. **The scaffold is the frame the player sees.** `tests/playwright/scaffold.spec.mjs`, chromium: for
   `study/N`, `study/W` (measured) and `study/E`, `hall/E`, `hall/W` (native derived) — hash the live
   `#scene` `getImageData` against the generator's `--verify` render at identical `{}` options.
   **`--camera page` only** (§2.3).
2. **The option delta is only apertures.** The diff between the `--verify` and scaffold buffers lies
   inside that facing's aperture rects, **(N10) taken from `HOLO_APP.apertureList` and dilated by
   1 px** — the renderer clips at fractional edges and antialiasing lands one pixel outside an
   undilated rect. Real on `study/E` and `hall/W`, where 8.6 m and 6.05 m of destination are drawn.
3. **The injection is faithful.** On `study/E` the injected `--camera derived` path and the native
   path produce identical buffers (confirmed: 0.0000 %).
4. **The committed scaffolds re-render byte-identical** — frame and labelled scaffold both, since
   §2.4 uses stroked glyphs. **(N14)** The committed PNG is decoded to a buffer and buffers are
   compared; this is not a PNG-bytes comparison.
5. **The stamped rects are the plan's, computed independently** — from `facingCarriers` and
   `groundplane`, never via the tool's own function. Pins chair-rail y **570.0**, the hearth box
   **566.9 … 981.5**, the box at exactly 2.20 m at the meta's `px_per_m_at_wall`, and the
   **centre anchoring** (a corner-anchored stamp would put the left edge at 498.9 and must go red).
   **(F35)** Also `study/E`'s door rect and `hall/E`'s window rect — label paths this row never
   dispatches and the manor run depends on. **(N8)** And every emitted label character is in the
   declared glyph set.
6. **The prompts pass the lint**, and techniques 1 and 2 differ by exactly the two declared lines.
7. **(F11, N3) The measurement is blind and its brackets are pre-committed.** `CFG_ROW23` carries no
   per-roll literal, asserted structurally; every bracket in a sidecar equals the §5.2 derivation
   recomputed by the test; return paths match the opaque-id grammar and contain no technique token.
8. **(N11) `assignment.json` has never changed since it was added** — the test finds its introducing
   commit with `git log --diff-filter=A` and asserts that commit's blob equals the current blob, so
   the map cannot be edited after the readings exist. Blob immutability, not commit ordering.
9. **(F19) Delete-green that breaks what the check guards.** Both must turn §7.1 red: *(a)* change
   `drawGrid` — drop the ceiling line — and confirm the generator moves with it; *(b)* replace the
   generator's call into `window.HOLO.renderer.render` with a local reimplementation drawing a
   plausible frame. A one-pixel meta perturbation tests the comparator, not the guard.
10. **The batch's headline is the scorer's string** for the state the numbers are in, and the
    separation report's rate is the scorer's computation — so a judgment cannot be printed as a
    measurement, and a rate cannot be typed.
11. **The gate table is what `gate.py --round row23` prints**, line for line.
12. **The round re-runs byte-identical**, joining the existing per-round loop, marked frames included;
    running `--round row23` twice leaves every non-row23 line byte-identical with no duplication.
13. **(F31) The row-26 handshake goes stale mechanically.** A test reads `design/intention.md`'s spec
    table and asserts every `PENDING_ROWS` row id is still an **open row**. When row 26 closes and the
    entries survive, the suite goes red.
14. **The whole suite green**, both engines, nothing else modified.

**On a null separation.** Recording it satisfies the row's done clause, and the consequence is stated
in the batch rather than buried: production-law clause 5 says a change moving neither accuracy nor
speed *"is apparatus, and apparatus must argue for its life or be removed."* A null result puts
`tools/make-scaffold.mjs` on trial, and the batch says so in those words.

---

## 8. The recipe, written as executable method

- `tools/make-scaffold.mjs --emit-packet <technique>` emits, for any facing, the scaffold, the prompt
  with that facing's own carriers and camera substituted from its sidecar, and the `PACKET.md`. That
  is the manor run's dispatch unit.
- Blueprint §11b gains **one paragraph** naming the recommendation with its numbers — **and (F40)
  naming what it means**: obedience to a request, measured against a hearth position §5 already rules
  wrong, on a wall where obedience and reflex nearly coincide, chosen by labelled judgment rather than
  by a decision rule. A later reader must not find a recommended recipe and infer either that the room
  it painted was right or that a number chose it.
- `design/architecture.md` gains the machinery: the generator, the one horizontal space and its
  renderer authority, the injection, the pre-committed brackets, the blinding, the round, the
  separation report, the sidecar and the staleness rule.
- **(F38)** The repo README gains one line for the tool beside the `tools/` commands it already
  documents.

---

## 9. Kabe's gates

**CP-23A — before any packet is dispatched. It HOLDS the dispatch.** One message carrying, as images:
`design/references/style-seed-warm.png` presented as the **standing approved seed**; `study/N`'s bare
frame and labelled scaffold; `cand-5-reference.png` for comparison. It asks two things: does the warm
seed still govern for the manor run, and does the labelled scaffold look like an instruction he would
want a painter to follow. The build proceeds while it is open; the packets do not go out.

**CP-23B — the matrix batches to Kabe with the table.** The row's output is a **recommendation** and
the 86-facing run does not start until he has looked. **(F29)** Geometry columns cannot see a room
that reads as a diagram obeyed, so the batch carries a **look surface**: every admitted candidate at
full 1536 × 1024 beside `cand-5-reference.png`, plus one frame per technique whatever its verdict. It
also carries the blindness finding (§5.5), the ceiling confound (§2.6b), the obedience framing (§0),
and the not-like-for-like note on the clock (§5.3).

**(F30, N12) Two mechanical requirements, met from P0 rather than P5:**

- The approvals entry carries its **date column**, because `plan.spec` splits on `|` and reads
  `col[1]` as the scope: `2026-08-23 | row-23 scaffold matrix + style direction
  (design/batches/row23-scaffold) | AWAITING KABE | -`.
- **The batch directory holds PNGs at its top level from the moment the gate opens** — the bare frame
  and the labelled scaffold land there at **P0**, before CP-23A, because the open-gate test reads that
  directory non-recursively and CP-23A is when the entry goes in. The look surface joins them at P5.

Fallback if Kabe is silent: the Navigator proceeds on the standing seed, records the decision as [AI]
with its reason, and the batch says so.

---

## 10. What does not move

- **No renderer change.** `src/renderer.js`, `src/groundplane.js`, `src/placeholders.js`,
  `index.html` untouched.
- **No meta change and no promotion.** `backdrops/study/*.meta.json` and `backdrops/baked.js`
  untouched; `promote-backdrop.mjs` is not run; no row-23 candidate enters `backdrops/study/`.
- **No plan change.** `fixtures/demo-study/plan.json` untouched; the scaffold reads it as the tree
  holds it and records its drawn digest.
- **No law change.** `FOCAL_PX`, `MEASURED_REFERENCE_PX`, `MEASURED_BAND`, `DERIVED_LENS_TOL`,
  `assertRuledLens`, `assertRuledEye` — none move, and §5.2 and §5.4 derive every band and every
  bracket from the standing licence rather than inventing one.
- **No other round re-measured**; `misses.jsonl` gains only `round: "row23"` lines.
- **No sheet re-render and no `approval.lock` re-anchor.**
- **Three deliberate, named exceptions:** §5.3's two `write_misses` extensions, §5.2's new ledger
  kind, and §4.1's ruled amendment of `contract.json`'s one camera sentence.

### Sequencing against row 26

Row 26 slides `hall/N` and `hall/S` standpoints only; the study is untouched. Two mechanisms: every
sidecar records the plan's drawn digest and a mismatched scaffold is refused as stale; and
`PENDING_ROWS = { "hall/N": 26, "hall/S": 26 }` refuses those facings by name, with **§7.13 turning
the suite red if row 26 closes without deleting the entries**. Row 23 exercises the generator on
`study/*`, `hall/E` and `hall/W` only. Path note: the renderer key `hall/*` maps to
`backdrops/source/passage-*`.

---

## 11. Order of work

| phase | what | needs | rolls |
|---|---|---|---|
| P0 | generator, glyph table, sidecar, brackets, label pass, top-level PNGs, §7.1–7.9, §7.13; `contract.json`'s one sentence | — | 0 |
| CP-23A | seed + scaffold look to Kabe | **holds dispatch** | 0 |
| P1 | `assignment.json` committed (both walls); t1/t2/t3 dispatched at full n = 4 on `study/N` AND `study/E` | CP-23A closed | 24 |
| P2 | measure, score, table, separation report | P1 | 0 |
| P3 | run-off, if the Navigator spends it (§5.6) | P2 | 8 |
| P4 | lens arm at `--camera derived`, `study/N` only — it is the wall with the Kabe-ruled camera | P2 | 4 |
| P5 | batch README, look surface, ledger clock, §8's recipe, §11b paragraph | P3, P4 | 0 |
| CP-23B | the batch to Kabe — recommendation, AWAITING his look | P5 | 0 |
| P6 (conditional) | technique (4), only where nothing separated | P5 | 4 |

---

## 12. Forks — the Navigator's rulings, recorded

**All six are ruled.** They are kept here rather than deleted because the reasoning behind each is
what a later reader needs, and because two of them are still live constraints on later rows.

1. **Technique count — RULED.** The row now reconciles itself with §11b: technique (4) is dispatched
   only on a NULL RESULT after the run-off, and §8's blueprint paragraph carries the reconciling
   sentence at the close.
2. **The wall — RULED AND EXERCISED** at `1d15e62`: the matrix runs on two walls, `study/E` joining
   at +12 rolls as the non-blind carrier probe. The decision structure did not change; the
   separation report gained a headline discriminator. §2.6b and §5.4 carry what it became.
3. **`contract.json`'s camera sentence — RULED AND DONE IN THIS ROW.** `backdrop_block` said 1.83 m
   eye pitched 8° at 24 mm; it now says 1.183 m and level, citing the "B" ruling, with
   `_backdrop_block_camera_amendment` recording what moved and what deliberately did not (the sprite
   camera's 1.83 m and −8°, and `focal_mm` 24, which `assertRuledLens` still pins).
4. **Row 22 sequencing — RULED:** matrix first, so `study/N`'s 324.4 px of carrier headroom survives.
5. **The run-off — RULED:** licensed, fresh-only, true 7.0 % rate, and the spend decision is the
   Navigator's at P3.
6. **The aperture/ruler conflict — ALLOCATED as row 27**, 2026-08-23. Row 23 does not rule it; what
   it owes is the one-paragraph statement of where the divergence lives, which §2.5 carries and the
   batch repeats: it exists only on a measured meta whose painting is wider than the plan rules —
   `study/N` 13.25 %, `study/E` 18.34 %, `study/W` 26.0 % — and the two promoted walls carry no door,
   so the conflict is unexercised today and arrives with `study/E`'s promotion.

### Still open, and carried forward

1. **The lens fork stays Kabe's** (§6). Row 23 supplies numbers to the standing-eye wave's open
   question 6; it does not answer it, and neither branch of §6.3 is an agent's to take.
2. **Row 27** owns the aperture/ruler ruling before any door-bearing wall is promoted.
3. **§5.5's blindness is not cured, only bounded.** `study/E` gives the report an arm the techniques
   move; it does not give the row a rule that turns a number into a recipe, and nothing in this plan
   pretends otherwise.
