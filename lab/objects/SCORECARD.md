# Asset approaches — scorecard (liner-3 writing-room chair, 2026-09-02)

One reference: `library-src/chair-liner-1934-side/source.png` (painted by the seat, 1254², flat grey; the second source — the first failed the replicator's ground gates). Same chair through every approach, placed by the same rule (writing room, against the west wall), seen in the same page: https://5000stadia.github.io/holo-emitter/lab/room3d/ (V = third-person camera, Q/E turn).

**Navigator's grading criteria** (0–5 each, stated so Kabe can disagree with the weighting):
- *Look*: does it read as the reference chair at walking distance, from any angle?
- *Footprint*: bytes per asset in the library and in the page.
- *Cost*: LLM tokens and wall-clock per asset after setup; setup counted once.
- *Determinism*: same input → same asset; verifiable by a gate.
- *Editability*: can the asset be changed without regenerating (parts, materials, dims).

**Grading link** (opens on the west wall, walker hidden): https://5000stadia.github.io/holo-emitter/lab/room3d/?face=W&view=contract&x=2.6&y=3.6

Times are wall clock from this session's commit and task timestamps; "setup" is one-off, "per asset" is what the next chair would cost.

| # | approach | setup | per asset | footprint | LLM cost / asset | gate | Navigator grade | **Kabe's grade** |
|---|---|---|---|---|---|---|---|---|
| 0 | rooms from plan.json (engine geometry, colours sampled from paintings) | ~25 min build (23:50–00:15) + ~40 min of viewer/mobile fixes across the day | 0 (a new plan is free) | 15 KB page | 0 | plan validate | Look 3 · Footprint 5 · Cost 5 · Determinism 5 · Editability 5 | |
| 1 | sprite billboard (seat paints → replicator gates → billboard) | pipeline pre-existed | ~20 min (order 17:19 → landed 17:39, one regenerate on ground gates) | 60 KB sprite | 0 (the seat's own subscription) | replicator (11 gates) | Look 1 (Doom-style, rejected by Kabe on sight) · Footprint 4 · Cost 4 · Determinism 4 · Editability 1 | rejected: "2d rotation doom/duke nukem kind of bs" |
| 2 | img2threejs (agent writes procedural Three.js from the image, 5 build passes + render review, run by an opus subagent) | 5 min install | **100 min** (17:57–19:37), 319 tool calls; 2 of 6 correction loops used | 257 KB of JS (5,412 tris, 15 meshes, 4 materials, 0 textures); 15 pivots/12 sockets/colliders included | **575k tokens** measured (its README estimates 80–180k) | its own gates: IoU 0.859, aspect Δ 0.049, scale Δ 0.035, colour ΔE 13.8, part coverage 0/0 | Look **4** (clean, correct proportions, lipping, ferrules, curved back; no veneer figure — stylized rather than painted) · Footprint 3 · Cost 1 (an hour and half a million tokens per piece) · Determinism 3 (an agent loop; gated but not repeatable bit-for-bit) · Editability 4 (named parts, pivots, materials in code) | **3/5** "good" (Kabe, 2026-09-02 19:55) — **tossed** 22:40 on cost ("Ugh toss that out"): a table would cost the same again, ~60–75 min and 350–450k tokens; skill uninstalled, factory kept in the library for the record, off the wall |
| 3 | TripoSR on CPU (single image → mesh) | ~65 min of install fights (no CUDA: marching-cubes shim; a GL import; trimesh vs numpy 2) | **~2 min** per asset on this CPU (22 s model + 40 s marching cubes + export; the first run's 18 min was weight download and first-run compile) | 1.5 MB raw (75,744 tris, vertex colours, no texture); decimated to 24k for the page | 0 | `tools/mesh-gate.py` (shape err 0.32 of 0.35 allowed: the blob is chunkier than the declared chair) | Look **3.5** (reads as the reference at 3 m: curved sycamore back, tapered legs, seat pad — soft and slightly blobby, vertex colours dull the blue, no ferrules) · Footprint 3 (480 KB decimated) · Cost 4 (2 min CPU, 0 tokens) · Determinism 4 (same image → same mesh; gate) · Editability 1 (a fused mesh) | **4/5** "pretty great" (Kabe, 2026-09-02 19:55) |
| 4 | primitive JSON (LLM-Primitives' representation; the Navigator authored 14 primitives from the image in one pass, the engine builds them: taper on legs, a curve on the back) | 3 min engine support (builder for cube/cylinder/sphere + taper/curve) | **3 min** authoring (18:53–18:56 incl. the engine work); next chair ≈ 2 min | **2.9 KB** JSON; ~1,400 triangles | ~3k tokens, one pass, no review loop | schema + declared dims (loader fits nothing: authored at scale) | Look **2.5** (reads as the chair from 3 m: sycamore back, blue pad, tapered ebony legs, ferrules; boxy up close, no veneer figure, no rolled top yet) · Footprint 5 · Cost 5 · Determinism 5 · Editability 5 — the small-footprint winner unless the look fails Kabe's eye | **2/5** "pretty rough" (Kabe, 2026-09-02 19:55) |

**All three on the wall, 19:50** (A left, B middle, C right at the grading link). Navigator's read from the grading camera: A is the cleanest and most *designed* (crisp lipping, ferrules, proper taper; reads a touch wide); B is the most *photographic* (soft, believable, colours muddied by vertex shading; would take a texture from a better mesh model); C is the honest sketch. Ranked by the criteria's total: C 22.5 · B 15.5 · A 15 · sprite 14 — but Look alone ranks A 4 · B 3.5 · C 2.5, and Look is the Captain's column.

**Kabe's grades (19:55): B 4 · A 3 · C 2.** The Captain's eye ranks the photographic mesh above the clean code and the sketch well below both — the opposite order to my Look column on A/B. Lesson recorded: generated-mesh softness reads as *real* to him; procedural crispness reads as *designed*; hand primitives read as *rough*. So the look tier is B's family (single-image mesh models), and the small-footprint question becomes whether a mesh-derived primitive set (B → PrimitiveAnything) can hold a 3, not whether hand primitives can.

**Recommendation for the pipeline** (revised after the grades): rooms from the plan (0); every visible piece through a single-image mesh model (B's family: TripoSR here, Hunyuan3D-2 mini / TRELLIS.2 on a GPU box for texture and sharpness); PrimitiveAnything on those meshes only where the footprint must shrink and only if the result grades ≥ 3; parametric families for bulk at distance; no img2threejs (tossed on cost); objects that must move wait for a cheaper code path. No hand-authored primitives, no billboards.

Candidates found by search, queued behind A/B (2026-09-02 19:05):

| # | approach | what it needs | why it matters |
|---|---|---|---|
| 5 | PrimitiveAnything (SIGGRAPH 2025, Tencent/Tsinghua; code + weights released, GPL-3, free Hugging Face Space) | a mesh in (TripoSR's GLB), CUDA locally or the public Space via gradio_client | LLM-Primitives' representation with zero LLM tokens: mesh → primitive assembly, human-like decompositions. Chain B → 5 gives the 2 KB asset from the generated mesh instead of from my hand |
| 6 | Infinigen Indoors (Princeton, BSD; 79 procedural generators, 17 of them furniture, constraint-based arrangement DSL) | Blender + the infinigen package, CPU is fine | the parametric-family tier already exists as open source: seeded chairs/tables/sofas exported to OBJ/FBX with no ML and no LLM; also a constraint solver for placement |

Not run (recorded for the ranking): Modly / Hunyuan3D-2 mini (needs a GPU we don't have); Meshy / Nova3D (hosted, credits + key — Kabe's call); LL3M (research, commercial APIs, Blender); Chat-Edit-3D++ (scene editing, not asset generation).
