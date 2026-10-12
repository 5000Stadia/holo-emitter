# The three.js examples, read against our architecture (2026-10-11)

**Kabe:** "Have you considered the examples here and gone through them to see how any can improve our architecture either by making our current system more elegant or implementing improved methods or quality? https://threejs.org/examples/"

**How it was done:**
- All 607 examples, r186, in three read-only passes. Each pass worked from one brief: our engine, our rules and ten open problems.
- Every source was fetched. About 140 were read in full, and the rest judged from imports and comments.
- Nothing was run. Every "try" below means a measured trial first, phone first.

**What we already use:** `compileAsync` (src/make/warm.js), `ClusteredLighting`, `LightProbeGrid`, `DynamicLighting`, `BundleGroup`, reversed and log depth, instanced sprites, and the Direct pipeline (no post chain).

## Worth doing, by the item they serve

| # | From the examples | What it gives us | Item | Verdict |
|---|---|---|---|---|
| 1 | Quantised, welded vertices (`webgl_buffergeometry_uint`; r186 `WebGPUAttributeUtils` maps Int8/Int16/Uint16 normalised to snorm8x4 and unorm16; works on WebGL2 too) | A vertex from 32–44 B to ~20 B, and a quad from 6 vertices to 4 indexed: well under half of the ~220 MB upload and of phone memory | R65, phones | **try**: changes vertex values below what the eye sees; judged by pixel stills, your call |
| 2 | Region texture updates (`webgpu_textures_partialupdate`: `renderer.copyTextureToTexture(src, dst, null, at)`) | The 2880² floor (33 MB plus mips) streamed in tiles behind a low-detail placeholder, not one spike before the first frame | R65 | **try** |
| 3 | The Inspector (`renderer.inspector = new Inspector()`: timeline of pipelines, programs, textures) | Shows which of our 51 programs compile and when: the first frame's 1–1.4 s | R65 | **try now** (a dev tool, no look change) |
| 4 | Light-probe baking done better (`webgpu_generator_city`, `_lightprobes_sponza`, `_complex`) | Bake against a box proxy, not the 5 M-vertex house; a few probes a frame (no load hitch); per-room grids with `falloff`, so no light leaks through walls | R68 | **try** |
| 5 | Stateless GPU particles (`webgpu_particles`, `webgpu_tsl_galaxy`: `SpriteNodeMaterial`, per-instance `range()`, `time`, one draw; WebGL2 too) | Rain, snow, dust and embers derived from the address, with no simulation | weather (gated), R69 | **adopt the pattern** when weather opens |
| 6 | Rain and snow stopped at the first surface (`webgpu_compute_particles_rain`, `_snow`) | A height map we build on the CPU at generation; no readback | weather (gated) | **try** then |
| 7 | Flames as one TSL sprite (`webgpu_tsl_vfx_flames`: cellular noise, gradient ramp, billboarded) and soft smoke (`webgpu_particles_soft`) | Fire that reads as fire, near and far | R69 | **try** |
| 8 | Tinted shadows through glass (`webgpu_shadowmap_opacity`, `webgpu_caustics`: `shadowMap.transmitted`, `castShadowNode`) | Coloured window light through leaded glass, drawn once into our static maps | R68 | **try** on one window |
| 9 | Height fog (`webgpu_fog_height`: `fog(color, exponentialHeightFogFactor(...))`) | Valley and ground mist in the shader, with no pass. It is also tidier than our plain `THREE.Fog` | R69 | **try** |
| 10 | Sky and its light (`webgpu_sky` `SkyMesh` plus `PMREMGenerator.fromScene`); room reflections (`webgpu_materials_envmaps_bpcem`, one static box-projected cube per room) | A sky dome that drops into our hour's look values; polished floors and glass that reflect the room (the manor has no environment today) | R68, R69 | **try** outdoors first |
| 11 | Supersampling only when the view is still (`webgl_postprocessing_taa`'s accumulate, about 30 lines of ours) | Crisp still frames. Moving frames pay nothing, which fits render-on-change and our no-TAA rule | look | **try** |
| 12 | Soft shadows as a TSL filter (`shadow.filterNode`; PCSS from `webgl_shadowmap_pcss`) | Contact-hardening penumbrae from our static maps; plain PCF stays for phones | look | **try**, desktop tier |
| 13 | `PositionalAudio` (HRTF, cone, filters) | The sound source. Occlusion through rooms and doors we compute at generation from the room graph (gain plus a lowpass per source) | sound (gated) | **adopt** then |
| 14 | Sun shadows in two cascades (`webgpu_lights_sunlight`) and tiled shadow arrays (`TileShadowNode`) | Finer shadows over the street and forecourt; indoors stays static | outdoors | **try** outdoors |
| 15 | Volumetric light (`webgpu_volume_lighting`, rect lights, a quarter-resolution march) | Shafts through windows, haze glow | R68 | **try**, desktop first: needs a post chain |

## For people (Photonic, M8)

- **Skinning:** per-instance compute skinning, one pass reused by shadow and colour (`webgpu_skinning_instancing_individual`), with body variety from bone scales and morphs. Its CPU `AnimationMixer` per instance won't hold 300; bake a bone palette per gait.
- **Animation:**
  - `SkeletonUtils.retargetClip` for shared gaits;
  - `makeClipAdditive` for breathing or talking over a walk;
  - `CCDIKSolver` for reach and gaze, close tier only;
  - visemes via `morphTargetInfluences`, which work on WebGPU.
- **The dialogue face:** a second scene in a viewport (`setViewport`, `setScissor`) keeps the room drawn behind it.

## Noted, not now

- **Too heavy for a phone, or needs a deferred chain:** KTX2 (needs a Basis encoder in our texture workers; measure the encode first), SSGI, VXGI, OIT, SSR, contact shadows, deferred rendering, MRT, and the volume fire sim.
- **Against a rule:**
  - GPU picking by readback;
  - `webgl_simple_gi` (per-vertex GI by readback; our probe grid does it by arithmetic);
  - TAA/TRAA (needs velocity);
  - CSM redrawn every frame.
- **Not for us:**
  - `BatchedMesh`: it saves CPU culling, not draws, on r186 WebGPU, and can't skin.
  - The physics engines: wasm, and our doors run through `works.js`.
  - `games_fps`: triangle-soup collision, worse than our claim grid.
  - FSR1: only below 0.7 render scale, and it needs a post chain.
  - The file loaders.

## What it says about our architecture

- **The base holds.** three r186 already gives us the pieces our rules call for (clustered lights, probe grids, bundles, async compile), and we use them. The examples didn't show a design we should replace.
- **The biggest unused levers are about data size, not new effects:** vertex formats (1) and streamed textures (2). Both go straight at R65's upload and at phone memory.
- **Most quality gains are cheap by our own rules.** They're static, done at generation, with no post pass, and they fit the items already planned: tinted window shadows, probe bake, height fog, sky, still-view supersampling, soft static shadows.
