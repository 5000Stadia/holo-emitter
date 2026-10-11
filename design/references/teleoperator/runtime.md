# Teleoperator: how it runs fast

Line numbers refer to `app.pretty.js`. Ideas only, in our own words; no code taken.

## The architecture (Q1)

- **three.js is the scene graph; a hand-written WebGPU renderer draws it.** `MindblownRenderer` (28622) stands in for `WebGLRenderer`, stubbing `state`, `xr` and `properties` so three's loaders and composer still work (28636-28700). It walks `scene.traverseVisible` each frame (33219).
- **Fallback:** if WebGPU fails it hands every call to a real `THREE.WebGLRenderer` (28732-28760). The game still refuses to start without WebGPU (99311), so the fallback is for the platform's other games.
- **Why custom:** it adds passes three's WebGPURenderer doesn't give them:
  - a cached static shadow map;
  - clustered lights in a compute pass (33762);
  - GTAO, SSR and TAA;
  - ocean FFT and sky LUTs in compute (24482);
  - reflections drawn at reduced detail;
  - WGSL vertex stages for wind, walking and wheels (26548-26640).
- **Bind groups by update rate:**
  - group 0: per frame;
  - group 1: per object, one large uniform buffer read through a dynamic offset (31447);
  - group 2: per pass;
  - group 3: per material.
- **Not used:** `drawIndirect`, GPU culling and multi-draw. Culling is a CPU test of each mesh's sphere against the frustum (33242). The speed comes from caching, skipping unchanged work, and instancing.

## Techniques, ranked by value to us

### 1. Limbs posed in the vertex shader (M8 R60/R61): adapt, may replace baked animation textures

- **What:** walkers are lofted in code (`Gc` 39855), each body part offset 8 m along x so the vertex shader knows which part it is. The shader turns each part about its joints (hip, knee, shoulder, elbow), blending across knee and elbow.
- **Per-person data:** phase, cadence and pose (walk, leap, phone, photo, seated, performer) ride in the instance matrix's unused fourth row, cleared before use (comment at 26571, `sfWalk`).
- **Draws:** one `InstancedMesh` per body type and LOD (24 or 6 segments). Street pedestrians are capped at 150 (93245).
- **Why it works:**
  - no bones, skinning or animation texture;
  - the CPU only writes a matrix per person;
  - every pass computes the same pose, so shadows match.
- **Fit:** R61 asks for "movement made in code from age and build", and this delivers it: a child's quick steps or an old man's stoop become shader parameters, not baked clips.
  - MakeHuman's mesh is continuous, not split into parts. Adapt by keeping each vertex's dominant bone and weight, and computing about 12 joint rotations in the shader from per-instance gait data.
  - Measure it against VAT in R60's 300-person phone test.

### 2. Shadow maps split by what moves (R50, R64): adapt

- **What:** three sun maps.
  - **Static:** redrawn only when its key changes (light matrix + caster-set hash + an epoch that rises when a static caster moves; 33583-33620).
  - **Movers:** cars and people, every frame (33622).
  - **Near:** a tight map around the player (33634).
- **Snapping:** the light's centre snaps to whole texels, and a slack radius lets small camera moves reuse the map (33188).
- **Phones:** static redraws are capped at two a second (`sunCacheMs` 500, 99404).
- **Fit:** we already draw a still sun's map once (86 → 136 fps). Two things to add:
  - a movers map, so NPCs don't force the house's map to redraw;
  - texel snapping, once the sun's frustum follows the player on the London street.

### 3. Autogfx: benchmark, then shed effects, then resolution (R50): adapt

- **Benchmark (`H5` 93033):** after 90 warm frames it takes medians of frame gaps and GPU time over 3.5 s.
  - It counts as CPU-bound if the GPU takes under half the frame.
  - Below 24 fps → Mobile; below 40 fps or GPU over 14 ms → Performance (93099-93110).
  - Our run: 51.3 fps, GPU 50.5 ms → Performance.
- **What each tier changes:**

| Setting | By tier |
|---|---|
| Pixel ratio | safe 0.2·dpr (max 0.6); mobile 0.42·dpr (max 1.25); perf 1; high 1.75; ultra 2 |
| Shadow map | 512 / 1024 / 2048 / 4096 |
| SSR | off on perf; 90 m, or 160 m on ultra |
| Traffic | car cap per tier |
| Frame cap | 30 fps below desktop, 60 on desktop |

- **Lite tiers** also turn off the depth prepass, AO, TAA, the near shadow and planar reflections (99403).
- **"Mobile, 19 fps while driving":** six 1-second windows in a row under 24 fps step the tier down once, but only if resolution is already at its floor or the frame is CPU-bound. A cooldown follows (93073-93092).
- **Dynamic resolution (99300):** it reacts to lateness (time behind schedule), not raw fps.
  - **Desktop:** it first sheds SSR and planar reflections, then the near shadow and AO (`s_` 100308). Only then does it scale resolution by √(budget/frame), clamped to ×0.6–×0.9.
  - **Phones:** it steers on GPU time against 40% of the frame budget.
- **GPU timestamps:** read only every 16th frame (33560).
- **Fit:** our controller only steps resolution. Three additions are cheap:
  - the shedding ladder, run before resolution drops;
  - the every-16th-frame timestamp, so a CPU-bound frame never lowers resolution;
  - a one-time warm benchmark that picks the tier.

### 4. Time-sliced streaming with look-ahead priority (R65): adapt

- **Budget:** city work gets 2.5 ms of wall time per frame (`uo` 83362). Generators yield every 250 buildings or 48 facades.
- **Priority:** distance minus half the distance along the direction of travel, so what lies ahead loads first (83372).
- **Distance bands (82404, 54677):**
  - 256 m chunks in 4×4 tiles;
  - near buildings within 520 m;
  - merged far tiles up to 5.2 km;
  - roads up to 2.7 km.
- **Hysteresis:** meshes are dropped 400-600 m past their load distance. Visibility is rechecked every 0.2 s.
- **Fit for R65:** after the first frame, build out-of-view rooms in 2-3 ms slices, nearest first, so "walkable" arrives sooner with the look unchanged.
- **Caution:** their own load isn't a model: ready at 37.8 s, with a 10.8 s city index.

### 5. Distance-tiered instance pools, grouped by cell (R60, R64): adapt

- **Props (77300-77420):** one `InstancedMesh` per 315 m cell, kind and material part, with a per-instance tint. Each cell group is shown or hidden as a whole by distance (77670).
- **Vegetation pools (77600):** near and mid pools of fixed size. Trees are promoted by distance, and their far copy is hidden with a zero-scale matrix. A full pool warns and falls back a tier.
- **Far trees (`A8` 79040):** 61,640 cross-quad impostors from one atlas, per 630 m chunk, built in 4 ms slices (182 ms in all).
- **Grass:** fades by screen-space dither between 28 and 44 m, with no blending (79160).
- **Shadow-only copies:** fading foliage gets a separate mesh that only casts shadows (77408).
- **Cars:**
  - traffic beyond 70 m switches to a far LOD set (92138);
  - parked cars fill detailed pools within 60 and 170 m (77440).
- **Draw counts:** none are logged. The city is 395 top-level meshes over 1,407 chunks.
- **Fit:** fixed pools per LOD, hiding with a zero matrix and culling by cell group is simpler than InstancedMesh2's per-instance BVH and may be enough. Test both in R60.

### 6. Phone tier from the GPU name (R50): adopt

- **What:** if the adapter reports Adreno, Mali, PowerVR, or Apple with touch, and the device has under 8 GB of memory, the game drops to the mobile tier and reloads (99388).
- **Mobile tier settings:**
  - textures capped at 1024 px;
  - CPU geometry copies dropped after upload (99396);
  - no depth prepass;
  - 30 fps cap.
- **Fit:** our `PHONE` test (coarse pointer plus screen size) misses tablets with phone GPUs.

### 7. 2D hash-grid collision (R62, R64): adopt when crowds need it

- **What:** `x5` (84941) keeps a uniform 24 m grid keyed by a prime-XOR hash.
  - Shapes are 2D (circle, oriented box, box, polygon) with an optional height slab.
  - Shapes over 2 km go on a short list of their own.
- **Bodies:** dynamic bodies are listed separately. Parked cars sleep until they are hit. Physics runs at a fixed 120 Hz (85020).
- **Scale:** 342k colliders, and a query touches only a few cells.
- **Fit:** a few dozen lines, and the arithmetic takes milliseconds. Use it for NPC avoidance.

### 8. Skipping unchanged per-object work: reject the mechanism, keep the principle

- **Dirty slots:** per-object uniforms are rewritten only when the matrix changed. Dirty slots merge into contiguous uploads (33468).
- **Bundle cache:** draws are hashed into content-addressed render bundles, so a change re-records only its own bundle. Bundles unused for 360 frames are evicted (31379).
- **Fit:** three's `BundleGroup` already covers our static merged meshes. Keep moving things few and instanced.

### 9. Smaller items

- **Async pipelines:** built with `createRenderPipelineAsync` and prewarmed (31955), as our `warm.js` does.
- **Reflection LOD:** a quarter-detail index buffer from meshoptimizer, used only in reflections (31522). Later, if we add mirrors or water.
- **Ids in mantissa bits:** a wheel's id sits in the low mantissa bits of `position.x`, and the shader spins it (26585). Adapt for doors, shutters and hanging signs.
- **Static animals:** the 181 sea lions are merged into the pier mesh and cost nothing at runtime (39043).
- **Decode workers:** eight workers decode textures off the main thread. This applies to R65.
