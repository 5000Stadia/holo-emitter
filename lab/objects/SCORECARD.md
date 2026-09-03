# Asset approaches — scorecard (liner-3 writing-room chair, 2026-09-02)

One reference: `library-src/chair-liner-1934-side/source.png` (painted by the seat, 1254², flat grey; the second source — the first failed the replicator's ground gates). Same chair through every approach, placed by the same rule (writing room, against the west wall), seen in the same page: https://5000stadia.github.io/holo-emitter/lab/room3d/ (V = third-person camera, Q/E turn).

**Navigator's grading criteria** (0–5 each, stated so Kabe can disagree with the weighting):
- *Look*: does it read as the reference chair at walking distance, from any angle?
- *Footprint*: bytes per asset in the library and in the page.
- *Cost*: LLM tokens and wall-clock per asset after setup; setup counted once.
- *Determinism*: same input → same asset; verifiable by a gate.
- *Editability*: can the asset be changed without regenerating (parts, materials, dims).

Times are wall clock from this session's commit and task timestamps; "setup" is one-off, "per asset" is what the next chair would cost.

| # | approach | setup | per asset | footprint | LLM cost / asset | gate | Navigator grade | **Kabe's grade** |
|---|---|---|---|---|---|---|---|---|
| 0 | rooms from plan.json (engine geometry, colours sampled from paintings) | ~25 min build (23:50–00:15) + ~40 min of viewer/mobile fixes across the day | 0 (a new plan is free) | 15 KB page | 0 | plan validate | Look 3 · Footprint 5 · Cost 5 · Determinism 5 · Editability 5 | |
| 1 | sprite billboard (seat paints → replicator gates → billboard) | pipeline pre-existed | ~20 min (order 17:19 → landed 17:39, one regenerate on ground gates) | 60 KB sprite | 0 (the seat's own subscription) | replicator (11 gates) | Look 1 (Doom-style, rejected by Kabe on sight) · Footprint 4 · Cost 4 · Determinism 4 · Editability 1 | rejected: "2d rotation doom/duke nukem kind of bs" |
| 2 | img2threejs (agent writes procedural Three.js from the image, 8 gated passes) | 5 min install | running since 17:57 (subagent) | (pending) | ~80–180k tokens by its own estimate | its own render-review gates | (pending) | |
| 3 | TripoSR on CPU (single image → mesh) | ~50 min of install (no CUDA; marching-cubes shim) | (pending: inference running) | (pending, expect a few MB GLB) | 0 | `tools/mesh-gate.py` | (pending) | |
| 4 | primitive JSON (LLM-Primitives' representation; the Navigator authored 14 primitives from the image in one pass, the engine builds them: taper on legs, a curve on the back) | 3 min engine support (builder for cube/cylinder/sphere + taper/curve) | **3 min** authoring (18:53–18:56 incl. the engine work); next chair ≈ 2 min | **2.9 KB** JSON; ~1,400 triangles | ~3k tokens, one pass, no review loop | schema + declared dims (loader fits nothing: authored at scale) | Look **2.5** (reads as the chair from 3 m: sycamore back, blue pad, tapered ebony legs, ferrules; boxy up close, no veneer figure, no rolled top yet) · Footprint 5 · Cost 5 · Determinism 5 · Editability 5 — the small-footprint winner unless the look fails Kabe's eye | |

Candidates found by search, queued behind A/B (2026-09-02 19:05):

| # | approach | what it needs | why it matters |
|---|---|---|---|
| 5 | PrimitiveAnything (SIGGRAPH 2025, Tencent/Tsinghua; code + weights released, GPL-3, free Hugging Face Space) | a mesh in (TripoSR's GLB), CUDA locally or the public Space via gradio_client | LLM-Primitives' representation with zero LLM tokens: mesh → primitive assembly, human-like decompositions. Chain B → 5 gives the 2 KB asset from the generated mesh instead of from my hand |
| 6 | Infinigen Indoors (Princeton, BSD; 79 procedural generators, 17 of them furniture, constraint-based arrangement DSL) | Blender + the infinigen package, CPU is fine | the parametric-family tier already exists as open source: seeded chairs/tables/sofas exported to OBJ/FBX with no ML and no LLM; also a constraint solver for placement |

Not run (recorded for the ranking): Modly / Hunyuan3D-2 mini (needs a GPU we don't have); Meshy / Nova3D (hosted, credits + key — Kabe's call); LL3M (research, commercial APIs, Blender); Chat-Edit-3D++ (scene editing, not asset generation).
