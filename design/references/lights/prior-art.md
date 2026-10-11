# Many lights, cheaply, with no pop: prior art (2026-10-11)

This is a read-only pass. three.js facts come from the r186 source itself: npm three@0.186.1 on jsDelivr and the GitHub tag r186. All three.js code is MIT, © three.js authors. The engine and game entries are ideas only. Context in the repo: `src/make/lightpool.js` already ranks lights by size×base/d², with hysteresis (`keep` 1.5), 0.6 s fades, an in-frame gate (`seen`) and `share`.

## 1. three.js r186's own many-light support

- **TiledLighting / TiledLightsNode no longer exist.** They were in r170–r183 and were removed by r185. Two addons replaced them (checked against the jsDelivr file lists for 0.170, 0.180, 0.183, 0.185 and 0.186.1).
- **ClusteredLighting** (`examples/jsm/lighting/ClusteredLighting.js`, `tsl/lighting/ClusteredLightsNode.js`, example `webgpu_lights_clustered.html`). It does Forward+ clustered shading: 32 px tiles × 24 exponential Z slices, up to 1024 lights and 64 per cluster.
  - **Each frame:** the CPU sorts the lights by view Z and uploads a data texture. A compute pass then runs one thread per cluster (1080p ≈ 60×33×24 ≈ 47k threads). Each fragment loops over its cluster's list, with an early break and a range cutoff.
  - **Limits:** it takes only `PointLight`s with `castShadow` false. Shadow casters, spots and RectAreaLights go down the normal per-material path. A light with `distance` 0 lands in every cluster, so lights need a finite range.
  - **No WebGL2 fallback.** It needs `renderer.compute` and a storage buffer (`attributeArray`) read in the fragment shader, and the example throws "No WebGPU support". The cluster buffer is rebuilt when the canvas is resized.
  - **Fit:** adapt, desktop WebGPU only. It is worth having for a street with dozens of lanterns, but it cannot be the only path, because our phones and the fallback need another one.
  - Links: https://github.com/mrdoob/three.js/blob/r186/examples/jsm/tsl/lighting/ClusteredLightsNode.js · https://threejs.org/examples/webgpu_lights_clustered.html
- **DynamicLighting** (`lighting/DynamicLighting.js`, `tsl/lighting/DynamicLightsNode.js`, example `webgpu_lights_dynamic.html`).
  - It batches point, spot, directional and hemisphere lights into `uniformArray`s. Each fragment loops over a uniform `count`. Defaults are 16 point, 16 spot, 8 directional and 4 hemisphere.
  - Adding or removing lights does **not recompile materials**. There is no culling: every lit fragment loops over every active light.
  - Shadow casters, projected spots and RectAreaLights are not batched.
  - It uses only uniforms, so by construction it should run on the WebGL2 backend too. The example does not gate on WebGPU, but I have not checked it on a device.
  - **Fit:** adopt it as the uniform container for real slots on both renderers. It replaces "fixed pool so nothing recompiles" with a mechanism three.js supports. The cost grows linearly, so keep it to about 8–16 lights on phones.
  - Link: https://github.com/mrdoob/three.js/blob/r186/examples/jsm/tsl/lighting/DynamicLightsNode.js
- **RectAreaLight** uses LTC lookups for every fragment. It is the most expensive analytic light, and neither batching path above takes it. For street windows seen from outside it is overkill: keep it for interior daylight only.
- **LightProbeGrid** (r186), already used in `src/make/light.js`. It bakes one grid per light group, and each group is then scaled by a weight at no cost. This is the right base for "lantern or window off/on" indirect light. `LightProbeGridWebGL.js` exists for the fallback.
- **Other r186 addons that help:** `objects/LensflareMesh.js` (WebGPU flare sprites), `geometries/DecalGeometry.js` (projected decals), and `webgpu_volume_lighting*` (raymarched volumetric light, which is too expensive for phones).

## 2. Ranking which lights get real slots

| Source | What it does | Fit |
|---|---|---|
| Unity built-in forward | The brightest directional light and lights marked "Important" are per-pixel. The rest go per-pixel "in order of decreasing brightness" up to Pixel Light Count, then up to **4 per-vertex**, then all the rest as **SH**. [docs](https://docs.unity3d.com/2019.4/Documentation/Manual/RenderTech-ForwardRendering.html) | **Adopt** the tiers: real slot, then a cheap analytic tier, then probes/SH. The per-object ranking is what causes pop, so rank once per frame from the view. |
| Unity URP forward | 1 main light + 8 additional per object. Additional lights per camera: 256 on desktop, **32 on mobile**, 16 on GLES3. Forward+ lifts the per-object limit. [docs](https://docs.unity3d.com/6000.0/Documentation/Manual/urp/lighting/light-limits-in-urp.html) | A budget reference point. |
| Godot 4 | Mobile renderer: **8 omni + 8 spot per mesh**, 256 + 256 per view, fixed. Forward+: 512 clustered elements. Each light has **Distance Fade** settings (Begin, Length, Shadow): it fades over Begin→Begin+Length and is then not sent to the shader at all. "Larger values give smoother fade, for fast camera movement." [docs](https://docs.godotengine.org/en/stable/tutorials/3d/lights_and_shadows.html) | **Adopt** fading by distance, not by timer. A fade tied to the player's own movement reads as perspective. A timed fade reads as a lamp switching on. |
| Unreal | `Max Draw Distance` and `Max Distance Fade Range` work like Godot's fade ([API](https://dev.epicgames.com/documentation/unreal-engine/API/Runtime/Engine/ULightComponent)). A forum report says they failed on mobile movable lights. On the mobile forward light grid, Meta's Quest notes give **32 dynamic local lights** by default, and a uniform path capped at 8 that was 10–15% faster on Quest 3 ([Meta](https://developers.meta.com/horizon/documentation/unreal/po-fork-engine-perf)). The "ProxyLight" plugin on Fab swaps lights past the draw distance for **decals** to hide the pop-out ([Fab](https://www.fab.com/listings/83ffc3d7-0436-433a-9ce4-e83edb03b47a)). | Ideas only. A light pool replaced by a decal is our stand-in tier. |
| PlayCanvas (MIT) | Clustered omni and spot lights, light data in **textures**, so it runs on **WebGL2**. No recompiles. On by default since 1.56. A forum user reports **2–3 ms for 50–60 point lights** (device not given). Shadows go through an atlas. [manual](https://developer.playcanvas.com/user-manual/graphics/lighting/clustered-lighting/) | Shows that a texture-based light grid works on WebGL2. **Adapt** it as a static world-space grid (see the design below). |
| Babylon.js 9 (Apache-2.0) | `ClusteredLightContainer` works on **both WebGPU and WebGL2**. One report says it fails on Firefox WebGPU (a WGSL pointer extension). [announcement](https://blogs.windows.com/windowsdeveloper/2026/03/26/announcing-babylon-js-9-0) | Second proof that clustering on WebGL2 is feasible. |
| GTA V (Courrèges study) | Distant street lights are instanced **32×32 sprite quads**, tens of thousands of them batched. The real light takes over only up close. [study](https://www.adriancourreges.com/blog/2015/11/02/gta-v-graphics-study-part-2/) | **Adopt** the idea: the lamp's glow is always drawn, and only the light it casts changes tier. |
| Doom 2016 / KCD | Doom uses clustered forward ([Courrèges](https://www.adriancourreges.com/blog/2016/09/09/doom-2016-graphics-study/)). KCD is SVOGI plus many lights that cast no shadows ([DSOGaming](https://www.dsogaming.com/mods/kingdom-come-deliverance-2-mod-enhances-global-illumination)). I found no public talk on how KCD culls lights, and none on Dishonored's night streets. | Only shows that most lights in shipped games cast no shadow. |

**Hysteresis and cross-fades.** Our `keep` 1.5 margin and smoothstep fade are standard. The engines above add two things:
- They fade by distance band, not by time.
- **Pop is a mismatch problem, not a timing problem.** If the stand-in gives the same diffuse as the real light, the handover needs no fade at all. The fade only has to hide the specular highlight appearing.

For the score, weight what is on screen as well as what reaches the player. A cheap version: the light's influence sphere projected to screen radius × its intensity × the fraction inside the frustum, so a lamp pool lighting the far end of the street can outrank one behind the player's shoulder.

## 3. Stand-ins for lights without a slot, and the matched handover

- **Glow on the source (emissive + sprite).** This is GTA's way. A camera-facing additive quad, depth-tested, with a minimum on-screen size so it doesn't shimmer away under MSAA, and soft fade where it meets geometry. It costs almost nothing when instanced. We have no bloom, so the halo sprite has to do that job. **Adopt.**
- **Fog in-scattering around lamps.** For a point light in uniform fog, single scattering has a closed form: the integral along the view ray of 1/(t² + 2bt + c) gives an atan. See [Sun et al. 2005](https://www.cs.columbia.edu/CAVE/projects/scattering_model/scattering_model.php) and the derivation attributed to Macklin ([notes](https://scrapbox.io/shivaduke-cg/Fog)).
  - Cheap use: run it per pixel only inside the halo sprite's quad, for that sprite's own lamp. That is one atan per covered pixel.
  - Full per-pixel fog loops over many lamps cost too much on phones.
  - **Adapt** (ideas; the papers are not code).
- **Light-pool decals.** The ProxyLight idea, and three's `DecalGeometry` (MIT). In a forward renderer an additive decal cannot read the surface albedo. Multiplying the frame by itself (dst×L) gives almost nothing on a near-black night surface.
  - So the pool is better computed **inside the surface material** (the next bullet) than as a blended decal.
  - **Adapt the idea, reject the blend.**
- **Analytic "unslotted lights" tier, diffuse only** (the equivalent of Unity's per-vertex/SH tier). Lanterns and window pools are static, so at generation:
  - Build a **world-space XZ grid** (e.g. 4 m cells). Each cell lists the lamps whose range reaches it, up to about 8. Store it in a data texture.
  - Each street material looks up its cell and sums Lambert × (the same distance falloff as `PointLight`) for the lamps in it. Skip any lamp whose "has slot" weight is 1.
  - This works on WebGL2 and WebGPU alike (no compute), recompiles nothing, and costs one texture fetch plus k cheap terms per pixel.
  - Per-vertex is the cheaper variant, but our walls are large quads, so it would need subdividing near lamps. **Adopt (grid), reject (per-vertex).**
- **Lightmaps / vertex bake for static lights.** This is Unity's Baked Indirect / Shadowmask idea, with realtime direct light and specular up close and baked light beyond ([docs](https://docs.unity3d.com/Manual/lighting-mode.html)). PlayCanvas bakes lightmaps at runtime on WebGL ([blog](https://blog.playcanvas.com/runtime-lightmap-generation-for-webgl)). It is the best quality per millisecond, but every place generated live needs a bake step and UV2. **Later**, if the analytic tier looks too clean because it has no occlusion.
- **Probes per light group (R68).** Gives the lantern's or window's bounce light, scaled by a per-group weight. Indirect light never changes tier, so it never pops. **Adopt (planned).**
- **Matched handover.** Each lamp has a weight w ∈ [0,1].
  - The real slot draws with intensity w×I. The stand-in tier draws the same lamp's diffuse with (1−w)×I, using the same falloff, the same colour and the same physical units.
  - Diffuse is then identical at every w. Only specular and shadow fade in.
  - Drive w from distance or screen rank (the Godot style), not from a timer.
  - The check is cheap and runs at generation: render a probe surface at w = 0 and at w = 1, and the diffuse difference must be about 0.

## 4. Night exteriors

- **Moon:** one dim, cool directional light with static shadows (our fps-lab rule), plus a low blue-grey hemisphere or sky fill so that silhouettes and roof lines read. Fill "keeps the darkest areas just above black" ([guide](https://bugnet.io/blog/how-to-fix-night-scene-too-dark-no-fill-light)).
  - Real moonlight is about 0.1 lux, against roughly 20,000 lux for daylight sky ([Frostbite PBR slides](https://blog.selfshadow.com/publications/s2014-shading-course/frostbite/s2014_pbs_frostbite_slides.pdf) for sky; the moon figure is from a secondary source). So set exposure for the lamp pools, not for the moon.
- **Day-for-night that isn't flat:** reduce contrast and brightness, desaturate, and blue-shift the dim end (scotopic). Keep the lamp pools warm and saturated ([Thompson, Shirley & Ferwerda 2002](https://users.cs.utah.edu/docs/techreports/2000/pdf/UUCS-00-016.pdf); [Jensen et al., Night Rendering](https://graphics.ucsd.edu/~henrik/papers/night/)).
  - In our pipeline this is a few TSL ops in the tone-mapping node: a luminance-weighted blend toward a blue grey below a threshold. It adds no pass.
  - Readability comes from contrast between warm pools and the cool moon, plus glow sprites marking every source, even far ones.
- **Phone budgets people report:**
  - URP mobile: 32 lights per camera, 8 per object.
  - Godot mobile: 8+8 per mesh.
  - Quest UE light grid: 32, with a uniform path capped at 8.
  - PlayCanvas: 2–3 ms for about 55 clustered lights (device unknown).
  - three.js forum: MeshStandardMaterial "becomes very expensive with many lights" (a discourse.threejs.org reply surfaced by search; I did not pin the thread).

  Read together: about **4–8 real lights on phones and 16+ on desktop**, with everything else as stand-ins.

## Recommended layered design

1. **Every source always shows itself:** emissive mesh plus an instanced halo sprite with the analytic fog in-scatter inside its quad. This never changes tier, so a lamp at the far end of the street is visibly lit from the start.
2. **Real slots come from `DynamicLighting`** (r186, uniform arrays, no recompile, both renderers): phones about 4 point lights, desktop about 16. `ClusteredLighting` is an optional upgrade on desktop WebGPU only. RectAreaLights stay for interior daylight windows only.
3. **Rank once per frame** from the view: irradiance at the player plus how much of the lit footprint is on screen, with the existing `keep` hysteresis and `seen` gate. The pool's slot-assignment logic stays, but it now drives weights in a DynamicLighting array instead of a fixed set of lights.
4. **Analytic diffuse tier for everything without a slot:** a static world-space XZ lamp grid built at generation (data texture, ≤8 lamps per cell). It is evaluated in the street and facade materials, so it works on WebGL2 and WebGPU alike.
5. **Matched handover:** per lamp, real = w×I and stand-in = (1−w)×I, with the same falloff and units. Diffuse never changes, and only specular and shadow fade in. Drive w by distance band (Godot/UE style), not by timer. This replaces `share` for exteriors.
6. **R68 probes per light group** for bounce light (lanterns as one group per street segment, windows per house). Scaled by weight, never re-baked, never popping.
7. **Moon:** one directional light with static shadow, plus a cool hemisphere fill. Expose for the lamp pools, and keep the moon at a few percent of pool level.
8. **Scotopic blue-shift and desaturation in the tone-mapping node** for the dim range. Warm pools stay saturated, which gives readability without flatness, at zero extra passes.
9. **Generation-time checks (ms arithmetic):**
   - Every lamp lands in the grid cells its range reaches.
   - No cell overflows.
   - At w = 0 and w = 1, diffuse at sample points is equal within a tolerance.
10. **Later, only if needed:** baked lightmap/vertex occlusion for the analytic tier, if the pools look too clean without any shadowing.
