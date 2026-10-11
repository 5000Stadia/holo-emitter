# Grass: prior art and a design for R69

Read-only pass, 2026-10-11, for R69 ("Ground that grows").
- Code was read from the repos (`gh`) and from the r186 build on jsDelivr; papers from their PDFs.
- Ideas are free to use; code is taken only under a licence.
- **Adopt** = take the idea, or MIT/BSD code with credit. **Adapt** = reshape it for our engine.
- Costs are the source's own; mine are marked as estimates.

## Sources

**1. Ghost of Tsushima: Wohllaib, "Procedural Grass in Ghost of Tsushima", GDC 2021**
- **Link:** <https://gdcvault.com/play/1027214/>. The slides are paywalled; the numbers come via <https://tigerabrodi.blog/what-we-can-learn-from-grass-in-ghost-of-tsushima-renders> and GodotGrass.
- **Licence:** proprietary; ideas only.
- **Technique:**
  - Blades are cubic Béziers (4 points), generated per tile in compute from hashes.
  - Culling runs cheapest first (distance, frustum, occlusion, no type, zero height); survivors are drawn instanced and indirect.
  - LOD: 15 vertices near, 7 far, with the near shape morphing toward the far one. Far tiles are twice the size at the same count, so 3 of 4 near blades drop toward the boundary. A short blade spends its spare 8 vertices on a second blade.
  - Voronoi clumps share height, facing, colour and bend. Wind is a scrolling noise field.
  - Shading: normals tilt across the width ("rounding"), edge-on blades widen in view space, and backlight gives translucency.
- **Cost:** about 83k blades in about 2.5 ms on PS4 (secondary source, unverified).
- **Verdict:** **adopt** the design as our template. **Adapt** the per-frame compute (design point 3).

**2. al-ro, WebGL grass** (<https://al-ro.github.io/projects/grass/>)
- **Licence:** the GitHub copy has no licence file; the CodePen copy is MIT under CodePen's terms. Ideas only unless the code comes from the pen.
- **Technique:**
  - 100k instanced alpha-textured blades of 4 segments (10k on phones), on a 215 m patch that wraps around the camera.
  - Wind from two sines.
  - Translucency in two terms: diffuse `−N·L` and forward `pow(dot(−L,V),16)`. Roots darkened.
- **Cost:** none published.
- **Verdict:** **adopt** the translucency and root darkening. **Reject** the alpha-textured blades.

**3. Bruno Simon, folio-2025, `World/Grass.js`** (<https://github.com/brunosimon/folio-2025>)
- **Licence:** MIT.
- **Technique:**
  - three WebGPU/TSL. **One triangle per blade**: 78,400 blades in one mesh on a grid that wraps around the camera (`mod`).
  - The triangle faces the camera, height comes from Perlin noise, and wind moves the tip only.
  - Colour is **the terrain's own colour node**, with the normal straight up, so grass and ground light the same.
  - Blades the mask excludes are pushed 100 m up.
  - Trails: a 512² render target over 40 m.
- **Cost:** no figures; it ships and runs on phones.
- **Verdict:** **adopt** the shared ground/grass colour and the one-triangle far band. **Adapt** the wrapped grid.

**4. SimonDev, Quick_Grass** (<https://github.com/simondevyoutube/Quick_Grass>)
- **Licence:** MIT.
- **Technique:**
  - 10 m patches of 3,072 blades, frustum-culled on the CPU.
  - 14 vertices within 15 m, 4 vertices out to 100 m. Blades placed from a world-position hash.
  - Rounding: two normals at ±0.3π, blended across the width.
  - View thickening: `easeOut(1−v·n,4)·smoothstep(0,0.2,v·n)`.
  - Normals lean toward "up" with distance, and AO scales with density.
- **Cost:** none published.
- **Verdict:** **adopt** the rounding, the thickening and the patch culling. They are the clearest MIT versions of the Ghost of Tsushima tricks.

**5. James Smyth, three-grass-demo** (MIT)
- 100k sine-wind blades in one geometry, with a scrolling cloud-shadow texture.
- **Verdict:** **reject** the grass. The cloud-shadow scroll may suit a later mood pass.

**6. Nitash Biswas, grass-shader-glsl** (no licence)
- R3F, 400k instanced blades, 7 or 3 segments.
- **Verdict:** **reject**; it adds nothing beyond source 4.

**7. Matthew Kissinger, threejs-field-grass, 2026** (<https://github.com/matthew-kissinger/threejs-field-grass>)
- **Licence:** MIT. It is pre-1.0, so it needs a safety pass before any code is taken.
- **Technique:**
  - TSL on r185, one material for both WebGPU and WebGL2.
  - Deterministic stratified scatter with **prefix-safe quality tiers**: a lower tier is just the first N.
  - Tufts of 7 blades × 3 segments; 126k blades in one draw.
  - Normals lifted toward the sky. Wind in three **rotated** octaves, so it never forms sine bands.
  - Body wakes on a CPU `DataTexture` at 0.5 m cells, recovering monotonically to exactly zero.
- **Cost:** none published.
- **Verdict:** **adopt** the tiers, the rotated octaves and the CPU wake texture.

**8. tigerabrodi/grass-webgpu, r184 TSL** (no licence)
- Its post-mortem lessons:
  - drive the colour ramp from `uv().y`, not `vertexIndex` (which bands);
  - mirror only the sideways rounding on back faces, never the whole normal (which turns blades black);
  - keep the palette narrow;
  - fullness is half count and half width, thickening and dark ground beneath.
- **Verdict:** **adopt** the lessons, as ideas.

**9. Official three.js r186 examples** (MIT)
- `webgpu_struct_drawindirect`: `IndirectStorageBufferAttribute`, `setIndirect` and atomic instance counts.
- `webgpu_compute_*` and `webgpu_instance_*`.
- **Checked in the build:** it has `instancedArray`, `atomicAdd`, `uniform().onObjectUpdate`, `alphaToCoverage` and `drawIndexedIndirect`.
- **The WebGL2 fallback** computes by transform feedback with no atomics. It ignores indirect counts, and its draw path never reads `getIndirect()`, so it draws every instance.
- **Verdict:** **adopt** compute and indirect drawing as an optional WebGPU path, never the baseline.

**10. Jahrmann and Wimmer, "Responsive Real-Time Grass Rendering for General 3D Scenes", I3D 2017** (<https://www.cg.tuwien.ac.at/research/publications/2017/JAHRMANN-2017-RRTG/>)
- **Licence:** paper © ACM; demo BSD-3.
- **Technique:**
  - Quadratic Bézier blades. Gravity, recovery, wind and sphere collisions move the tip in compute.
  - A collision strength η suppresses recovery, so trampled grass stays down.
  - Culls:
    - orientation (`0.9 > |dir_c·dir_b|`);
    - frustum;
    - distance, by levels that drop `id mod n`, so ids must be spatially sorted;
    - occlusion against the previous depth buffer.
  - Hardware tessellation.
- **Cost:** GTX 780M, 503k blades: 165k drawn after culling at 17.9 ms; 28.6 ms without culling.
- **Verdict:** **adopt** the orientation cull, index thinning and "stays trampled". **Reject** per-blade physics and tessellation (WebGPU has none).

**11. Horizon Zero Dawn: van Muijden, "GPU-Based Procedural Placement", GDC 2017** (<https://www.guerrilla-games.com/read/gpu-based-procedural-placement-in-horizon-zero-dawn>)
- **Licence:** proprietary; ideas only.
- **Technique:**
  - Placement is deterministic and **locally stable**.
  - Density maps are discretised by an **ordered dither pattern**: fixed points per tile, each with a threshold; a point is placed if the density exceeds its threshold.
  - Layers that share a footprint stack their densities ("layered dithering").
- **Cost:** about 10 µs to generate and about 7 µs to place per dispatch; about 250 µs average GPU load.
- **Verdict:** **adopt** as our placement rule. Masks, quality tiers and determinism become one test.

**12. Acerola, Grass** (<https://github.com/GarrettGunnell/Grass>)
- **Licence:** MIT, with the author's note "reference, don't use".
- Chunked compute buffers, GPU frustum culling with stream compaction, chunk LOD, noise wind.
- **Verdict:** **adapt** the chunk LOD.

**13. Unity mobile: ColinLeung-NiloCat, URP DrawMeshInstancedIndirect** (<https://github.com/ColinLeung-NiloCat/UnityURP-MobileDrawMeshInstancedIndirectExample>)
- **Licence:** MIT.
- CPU cell culling, then a compute cull, then one indirect draw. Lighting is per vertex. Bending comes from a top-down R8 trail target.
- **Cost:** 10M instances in the scene at 50–60 fps on an Adreno 612 (125 m draw distance), and 30 fps on an Adreno 506 (75 m). The author: "performance mainly affected by visible grass count".
- **Verdict:** **adopt**. It is the best evidence that phones carry blade grass when lighting is per vertex.

**14. Unreal Landscape Grass, Kodeco interactive grass, Breath of the Wild, Fortnite**
- **Links:** <https://dev.epicgames.com/documentation/en-us/unreal-engine/grass-quick-start-in-unreal-engine>, <https://www.kodeco.com/6314-creating-interactive-grass-in-unreal-engine-4>.
- Unreal places instances from layer weights with a seed per component, and fades by dithering between cull distances. Trails come from a vector field written into a top-down render target.
- No primary source found for Breath of the Wild's or Fortnite's trails; the write-ups all describe the same render-target method.
- **Verdict:** **adopt** the cull-distance fade.

**15. Teleoperator, our bank item 4** (no licence)
- Clump cards on a 1.6 m grid within 46 m, fading at 28–44 m, casting no shadow; the ground shader paints tufts beyond.
- **Verdict:** **adopt** the bands and the ground tufts. **Reject** cards near the camera.

**16. Grassworks, Tech Redux** (proprietary, obfuscated)
- **Verdict:** **reject** for code. See `study-docs.md` for what its docs disclose.

**Phones.**
- **Cards cost more than they look.** Phone GPUs save work by drawing in tiles and skipping hidden pixels; a shader that uses `discard` loses that saving, and stacked cards overdraw.
- **Opaque blades** keep the saving and get free MSAA edges. Cards would need `alphaToCoverage` plus sharpened mips.
- **Grass at half resolution** breaks MSAA edges and needs a composite pass. **Reject.**
- **The phone levers:** per-vertex lighting (13), one-triangle outer blades (3), prefix thinning (7, 11), a capped pixel ratio, and a matched ground colour (3).

## Recommended design (TSL, r186)

**1. Placement.**
- **The ground map:** at generation, the ground generator rasterises an RGBA8 map at 0.25 m per texel (1024² ≈ 256 m, 4 MB). Channels:
  - density;
  - type (lawn, meadow or weed);
  - height scale;
  - wear.
- **What shapes it:** paths and gravel walks, wall feet, furniture and building footprints, and tree shade, as soft-edged polygons and bands.
  - Wear thins and shortens grass toward paths.
  - Wall feet favour weeds.
- **The blade test:** blades come from a fixed blue-noise tile, 4 m wide with about 600 points, each with a rank threshold, seeded once. A blade exists if `density × tierScale > threshold`.
  - **Deterministic and locally stable:** editing a mask never reshuffles the neighbours.
  - **Phones** get a strict subset of the desktop blades.
- **No per-blade storage:** blade attributes are hashes of the world point. Storing them would mean about 9M blades at lawn density.
- **Generation check:** the map reads zero inside every footprint. This is millisecond arithmetic, beside the soundness checks.

**2. Blades and LOD bands.**
- **The shape:** each blade is a cubic Bézier. Its handles carry lean, bend and facing from a Voronoi clump (0.6–1.2 m across).
  - Lawn blades are 5–15 cm tall, meadow blades 25–60 cm.
  - Weeds use a second profile.
- **The bands** (desktop / phone):

  | Band | Range | Geometry | Blades kept |
  |---|---|---|---|
  | Near | 0–8 m / 0–5 m | 11 vertices | all |
  | Mid | 8–20 m / 5–12 m | 5 vertices | 1 in 4, widened ×1.8 |
  | Far | 20–40 m / 12–25 m | 1 triangle | meadow and weeds only |

  Lawn goes sub-pixel at about 12 m, so the ground shader takes it from there.
- **The handover:** over the last 20% of each band, dropped blades shrink to nothing and kept blades morph onto the coarser band's shape. The silhouette is identical at the handover.
- **Thickening:** edge-on blades widen in view space, as in source 4.

**3. Culling.**
- **The baseline, on both backends:**
  - The grounds split into 8 m chunks. The CPU frustum-tests about 100 of them (under 0.05 ms) and picks each one's band.
  - Each visible chunk is one instanced draw (about 30–60 in all). The chunk's origin reaches the shader by `uniform().onObjectUpdate`.
  - Per blade, the vertex shader maps `instanceIndex` to its dither point and tests density, the distance fade and orientation (source 10).
  - A failing blade collapses to a degenerate triangle, so it costs only vertex work.
- **Optional, on WebGPU only:**
  - A compute pass writes the surviving ids into an `instancedArray` with `atomicAdd`.
  - The draw then becomes `drawIndexedIndirect` through `IndirectStorageBufferAttribute`.
  - Add it only if measurement shows it pays. It might save 30–50% of vertex work near the house.

**4. Wind.**
- One wind function, shared with the trees and hedges (Teleoperator item 7).
- Three rotated octaves of value noise, scrolled downwind, with a gust envelope.
- It bends the tip handle, and the clump's facing swings together. Each blade adds a small flutter by its hash.
- It depends on position and time only, so shadows and colour agree with the motion.

**5. Interaction trail.**
- **The texture:** an RG8 `DataTexture`, 128² cells at 0.25 m, covering 32 m around the player. It is addressed toroidally, so it is never recopied.
- **The CPU's part:** it stamps each footstep's direction and strength, and decays the field linearly to zero over about 6 s. That is a 32 KB upload and behaves identically on both backends.
- **The vertex shader's part:** it samples the field at the root, then pushes the tip down and away and darkens the blade slightly.
- **Lasting wear** lives in the ground map, not here.

**6. Shading.** Per vertex on phones; per pixel on the near band on desktop.
- **Colour:** a ramp from `uv().y`, a clump tint, and a small hue jitter. Keep the palette narrow.
- **Normals:**
  - rounding at ±0.3π, with only the sideways term mirrored on back faces;
  - a lift toward the ground normal with distance.
- **Translucency:** `max(0,−N·L)` plus `pow(saturate(V·−L),8)`, weighted toward the tip.
- **Specular:** weak and broad, toward the tip, gone by about 15 m. This avoids sparkle under MSAA without TAA.
- **Root AO,** scaled by density.
- **Shadows:** the blade receives the static shadow, sampled once at the root. It casts none.

**7. The far field.**
- The ground shader calls **the blades' own colour function**: base, clump tint, type and wear. The band edge then equals the blades' mean colour.
- It paints tufts, dry patches and mowing stripes, each averaged over the pixel's width (Teleoperator item 1).
- Blades shrink into it over 4–8 m.

**8. Phone tier.**
- `tierScale` 0.5, with the phone band edges above.
- 7-vertex near blades and one-triangle mid blades.
- Lighting per vertex only, no specular, translucency kept.
- Pixel ratio capped at 1.5, with 4× MSAA.

**9. Expected cost.** These are my estimates from counts; measure them and record them in `lab/RECEIPTS.md`.

| Target | Visible blades | Vertices | Estimated grass cost |
|---|---|---|---|
| Desktop, discrete GPU | about 40–60k | about 0.35M | 0.6–1.0 ms |
| Desktop, integrated GPU | about 40–60k | about 0.35M | 1.5–2 ms |
| Phone, mid-range Adreno or A14 | about 15–20k | about 0.1M | 1.5–2.5 ms of 33 |

- **On desktop, pixels matter too:** grass fills about 1M pixels, and its thin triangles shade each pixel 2–3 times.
- **CPU:** under 0.1 ms per frame.
- **Load:** the ground-map raster takes tens of ms, and nothing is downloaded.
- **Benchmarks:**
  - Ghost of Tsushima: about 2.5 ms for 83k blades on PS4.
  - Source 13: 10M instances at 30 fps on an Adreno 506.
