# Deep-view processing, both exits — step breakdown (2026-08-30)

[Kabe]: "detail breakdown each processing step for both scenarios so I can
logically track whats going on in processing." Context: R-DEEPBOX (registry) —
six rounds falsified every reference treatment for the deep-view room box;
camera scale and object shapes are teachable, the box is not (~25–35%
recomposition, constant). L-CLOSE holds both deep walls on grid.

## Shared front end (both scenarios, standing today)

S1. PLAN — packs/<pack>/plan.json: rooms as box-unit rectangles, walls,
    openings, depth_m.
S2. DECLARED CAMERA — deriveMeta (tools/plan-projection.mjs): plan → corner
    columns 475.43/1060.57, floor row 634.26, horizon 526.1, px_per_m 91.43,
    storey. Pure projection; no pixels involved.
S3. PACKET — make-scaffold --emit-manor: scaffold.png (declared geometry),
    Image 1 (style/same-wall), edge seed, prompt.txt (g5 register).
S4. PAINT — the seat generates → backdrops/source/<wall>/row23-<id>.png.
S5. READ — row35_snap, byte-keyed: floor line, dado rail (1.20 m ruler) →
    implied focal/eye → camera verdict (±8%).
S6. ROUTE — row23_run sweep: measured promote / exit (warp) / grid.
S7. PROMOTE → BAKE → PUBLISH — backdrops/<loc>/<f>.png + meta → fixtures →
    gh-pages.
S8. DRAW — src/renderer.js: standpoint painting; door through-views draw the
    next room's painting inside the threshold (thresholdY law, 1-px seam,
    2-deep).

The scenarios differ only at S6–S7 for DEEP facings.

## Scenario A — warp finishes deep facings (waive L-CLOSE for the class)

A1. Deep packet: Image 1 = full-frame reference (warp of best prior roll,
    revealed zones blurred in place); ask pins framing + objects-true.
A2. Painter roll → candidate.
A3. Reading: camera PASS (material scale is reliable — measured constant).
A4. Snap the candidate's own landmarks: corners/ceiling/floor land 25–35%
    wide/tall (the constant recomposition).
A5. WARP (mesh_warp, plane): piecewise per-axis resample pins painted
    landmarks onto declared ones → warped.png (0.0 px residuals),
    revealed.png (mask of pixels the mapping reached past the source),
    record with per-segment stretch scales.
A6. REVEAL FILL: plane-recession extension + 24 px fade = the edge smear.
A6b. Optional cosmetic, zero rolls: deterministically blur the revealed zones
    of the finished art in place — soft-focus edges instead of streaks.
A7. Re-measure the warped frame; promote (gate waived for the class).
A8. Bake/publish/draw unchanged.

Cost/residual: geometry exact; objects oval ~0.75–0.85 (the painter's
anisotropic recomposition squeezed back — unfixable after the fact per
L-ENVELOPE); edges smeared or soft. Repeats for every future deep wall.
Tonight's two walls promote with zero new rolls.

## Scenario B — deep facings are composed, not painted (recommended)

B1. The manifest marks the facing `composed` — the emitter SKIPS it. No
    packet, no roll, no painter, ever. The failure class is deleted.
B2. Sources gate (already exists — sameWallImageFor's): the CLOSE wall must be
    promoted. It is: measured, disc 105x105 = 1.000.
B3. FAR WALL: close painting's wall box scaled UNIFORMLY by
    k = ppm_deep/ppm_close, placed at the declared box. Shape-true by
    construction; same-wall identity exact by definition.
B4. SIDE SWEEPS: near/far cells' side-wall promoted paintings projected onto
    their planes in recession (per-column homography strips toward the
    vanishing point — mesh_warp's plane math run FORWARD from true textures).
    The anisotropy here is legitimate perspective: receding planes foreshorten.
B5. CEILING/FLOOR: the same forward plane-recession from the paintings' own
    ceiling/floor bands; junctions land exactly on declared lines; seam-blend
    as in through-views.
B6. REGISTER: the composed frame is stored as the facing's painting with
    composed_from + source shas + instrument stamp. No reading — it is a
    derivation from already-measured inputs (derived-seed doctrine): recorded,
    not judged. validate-fixtures learns the meta fields.
B7. REFRESH: sha-chained to sources — re-promote a close wall and the deep
    frame rebuilds (reading-cache doctrine, applied to composition).
B8. Bake/publish/draw unchanged — the client still draws one png.

Cost/residual: zero rolls forever; disc round and box exact by construction.
Build: one tool (compose-deep), reusing run_span_of + plane math +
deep_view.py's assembler. Open risk is visual only: projected side sweeps are
stretched real texture — geometrically correct recession, flatter than painted
art; the same region the painter kept miscomposing, and the through-view
seam/fade machinery applies.

## Why the choice tilts B

Six rounds proved the painter cannot be taught the deep box while everything B
needs — the close art — is already measured and true. A manages the defect on
every wall; B removes the step where the defect is born.
