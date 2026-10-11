# Grassworks: what its public docs disclose

**Source:** https://grassworks.techredux.co/docs (v1.1.0), all 26 pages, fetched 2026-10-11. The pages are server-rendered HTML. Raw copies and text extracts are in `docs/`.
- I also read the landing page's text and its changelog, and the demo page's HTML labels, in `site/`.
- I did not open any JS, shader or asset.
- Everything below is in my own words. Where a point is my **inference** rather than their statement, it says so.

**Overall:** the docs explain the API and how to author with it. They say nothing about the implementation. There are **no cost numbers, no phone guidance, and no statement of whether culling runs on the GPU or the CPU**. The useful finds are the architecture's outline, the default values, the twelve presets, and two LOD tricks named in the changelog.

## Platform and setup (getting-started, api/configuration)
- Built for three.js 0.185.0 on `WebGPURenderer` only. The landing FAQ says it can run on three's WebGL fallback, but it is not tuned for that.
- You create it with `Grassworks.create({camera, scene, renderer, terrain, tileSize, maxDistance})`. The canonical example uses tileSize 25 and maxDistance 200 on a 1000×1000 plane.
- Each frame you call `update(timer)`, which runs the tile, interaction and LOD work.
- Shadow defaults: grass does **not cast** shadows but **does receive** them (castShadow false, receiveShadow true).
- **Scale note:** in their units blades are 1.4–3.25 tall, so their whole world is scaled up. We would rescale every number to metres.

## Grass types (grass/types, grass/atlas, grass/blade)
- **Blade:** procedural geometry, one mesh per blade, with presets.
  - Parameters: width, height, stiffness, baseBend and baseBendScale.
  - Stiffness does two jobs: it resists bending, and it sets how visibly the blade's segments crease when it bends. So the bend is applied per segment along the blade's length.
  - baseBend is a resting curve applied before any wind. baseBendScale spreads that curve's direction across blades (low means aligned, high means scattered).
  - An optional `useBladeTexture` overlays detail on top of the shader colours rather than replacing them.
- **Billboard:** a two-triangle quad textured from an N×M atlas. The default atlas is 2×2.
  - Each instance picks one atlas cell, so the atlas is the palette. Their example is a 4×4 atlas holding 10 grasses and 6 flowers, which gives mixed ground cover from one system.
  - `useTextureColor` uses the art's own colours. Otherwise the shader tints the quad with the grass colour ramp.
  - The landing page frames Billboard as the light option for large areas.
- The type can be switched at runtime without rebuilding. Width and height are shared by both types.

## Colour and shading (grass/appearance, grass/parameters)
- **Three-colour model:**
  - A vertical gradient from baseColor (#354d12) to tipColor (#82c007).
  - A third variationColor (#13a300) scattered over the field through a noise field. colorVariationIntensity sets how much, and colorNoiseScale sets the cluster size.
- **sheen** (default 0.25): a gloss that grows toward the tip, meant to read dry versus wet.
- **aoIntensity** (default 1): darkens the base of each blade. This is fake ground-contact AO with no AO pass.
- Translucency, normals and specular models are **not disclosed**.

## Variation (grass/variation)
- Height and width each get a jitter around their base value (heightVariationIntensity, widthVariationIntensity).
- Colour uses a noise-driven mix toward variationColor. In the presets, colorNoiseScale is sometimes 0, which means per-blade random with no clusters.

## Wind (grass/wind-and-simulation)
- Four parameters: windIntensity, windDirection (radians; presets use 0, π and −1.18), windNoiseScale and simulationSpeed.
- windNoiseScale controls gust size. Their doc says a higher value gives *larger* coherent groups, so it acts as a wavelength rather than a frequency.
- simulationSpeed scrolls the field independently of direction.
- **Inference:** a scrolling 2D noise field sampled at each blade's root drives a bend in the wind direction. The word "simulation" suggests the field may be integrated over time rather than evaluated purely from the clock.
- Preset intensities run from 0.025 (Buffalo Grass) to 2 (Default), so the useful range is wide.

## Terrain: placement and height (terrain, setup-and-capture, grass-maps, terrain-painter)
- **Supported terrain:** a single height field (one height per x,z). Spheres and overhangs are not supported. Any material works.
- **Capture:** at start-up the terrain mesh, already at its final transform and visible, is captured from above into a height representation. Placement then reads that capture, not the mesh vertices, so a coarse mesh does not mean coarse placement.
  - If the terrain moves or changes, `refreshTerrain()` captures it again.
  - **Inference:** this is an orthographic top-down render of the terrain into a height texture, which the vertex or compute stage samples to put each blade's root on the ground.
- **Grass map:** a grayscale image laid over the terrain's 0–1 UVs.
  - Black means full-height grass, white means none, and greys mean shorter grass.
  - So **one channel controls both coverage and height**. Below some threshold a blade is dropped, and above it the blade's height scales.
  - With no map, the whole terrain is grassed. Square images are recommended.
- **Terrain Painter:** an in-scene brush that edits the grass map.
  - Brush size is in world units. Paint and erase use a grey value. There is no soft falloff.
  - It has flipU/flipV fixes and works from a blank map or refines an existing one.
  - While painting it locks the area to one fixed LOD (low by default), so the result can be judged with no LOD switching.
  - Edits fire a `grassmapchange` event.

## Interaction (interaction, api/configuration)
- A **camera-following interaction map** is a render target centred on the camera.
  - Default size is `maxDistance/2` world units, so 100 units for the canonical setup.
  - Default resolution is 256², about 0.39 units per texel at that size.
  - Each registered influence object is stamped into it **as a sphere**, not as its mesh. Their examples are tyres and feet.
- **Recovery:** `influenceRecoverySpeed` defaults to 0.99 and must lie between 0 and 1. **Inference:** it is a per-frame multiplier that decays the map back toward upright, which gives trails that fade.
  - The 1.1.0 changelog lists "influence consistency and recovery" fixes. If this is a per-frame multiplier, it would need correcting for frame rate.
- Influences are unlimited; a debug plane shows coverage.

## LOD (performance/lod, changelog)
- **Four bands:** high, medium, low and veryLow. Each has a distance (normalised to maxDistance), a density (multiplier on instances per tile) and a detail (blade segment count).

| LOD | Distance | Density | Detail |
|---|---|---|---|
| high | 0.6 | 4 | 4 |
| medium | 0.7 | 2 | 2 |
| low | 0.9 | 1 | 1 |
| veryLow | 1.0 | 1 | 1 |

- At maxDistance 200 these defaults give: full detail to 120, half to 140, then quarter-density single-segment blades to 200.
- Detail means nothing for Billboard, which is always a quad.
- **Transitions:**
  - `lodTransitionWidth` (0.01 normalised, about 2 units) blends between bands.
  - `lodEndTransitionWidth` (0.08, about 16 units) fades the far edge into a **circle**, so the square tile grid never shows at the horizon.
- **Changelog 1.1.0:**
  - "spatial dithering for smoother transitions between LOD levels" (a dithered cross-fade, not alpha blending).
  - The LOD geometry generator was reworked to give **consistent distribution across levels**, and this fixed the LOD pop-in.
  - **Inference:** each lower LOD's blades are a subset of the higher LOD's positions (nested sampling), so when density drops, blades vanish in place rather than reshuffling.

## Tiling and culling (performance/tiling-and-culling, performance, debugging)
- The world is cut into tiles of `tileSize` world units. A tile grid follows the camera and moves whole tiles when the camera crosses a boundary, which fires a `tileupdate` event. This gives "infinite" grass with no grass stored for the whole world.
- Their stated trade-off: small tiles give finer culling and LOD but more management and **draw-call** overhead; large tiles do the opposite. So **each tile is its own draw.**
- `getStats()` reports visible/culled tiles, tiles per LOD and blades; debug boxes outline tiles.
- **Inference:** culling is per tile, against the frustum, on the CPU. Each LOD is one instanced mesh per tile. There is no mention of compute or indirect draws, so nothing suggests per-blade GPU culling.
- **Demo quality tiers:** Performance, Balanced, High, Ultra, plus a pixel-ratio control. The values are not public.

## Presets (presets)
There are twelve, all Blade.
- **Species presets:** Kentucky Bluegrass, Perennial Ryegrass, Tall Fescue, Sheep Fescue, Bermuda, Buffalo and Switchgrass.
- **Stylised presets:** Default, Patchy, Ghost of Tsushima, Fantasy Emerald and Golden Prairie.
- Every preset sets five values: width/height/stiffness/bend, wind, colour ramp, sheen/AO, and variation. The full matrix is in `docs/presets.txt` and is a useful tuning reference. Patterns:
  - **Real species** use low wind (0.025–0.16), small noise cells (noise scale 1.45–2.4, which by their definition means localised flutter), sheen 0.11–0.52 and AO 0.57–1.
  - **The cinematic looks** use high wind with very large gust cells (Ghost of Tsushima: intensity 1.21, noise scale 0.12, height variation 1.28, width variation 0.2, colour noise 0). Golden Prairie gets its look from a gold ramp (#725f20 to #ecca41), almost no bend, AO 0.37 and no colour variation.
  - **Patchy:** height variation 1.5, a brown variation colour (#8a6c00) and colour noise 0. It is the "worn lawn" look.

## Authoring loop (runtime-gui, api/methods)
Live GUI -> `toJSON()` -> `applyConfig()`; every setter is live; nine lifecycle events (tileupdate, lodchange, terrainrefresh...).

## What a WebGPU/TSL grass system needs
Distilled from the above, with my inferences filling the gaps they don't document.

1. **Ground capture.** Render the terrain's height once (and again when it changes) into a top-down height texture. Placement and conforming read this texture, never the mesh.
   - For us the generator already knows the ground, so we can write the field directly at generation time.
2. **Coverage/height field.** One grayscale channel controls both: a threshold drops blades and the rest scales their height. Paths, clearings and worn edges come from this map.
   - Our generator can paint it from the layout (paths, doorsteps, wall bases, tree drip-lines), which the R69 "worn edges" item needs.
3. **Camera-following tile ring.** A grid of fixed-size tiles moves with the camera. Each tile is drawn as one instanced mesh per LOD, and tiles are culled against the frustum on the CPU.
   - Blade attributes come from a hash of world position, so a tile that is reused redraws the same grass.
4. **Nested-density LOD.** Use 3–4 bands with density multipliers (4/2/1/1) and segment counts (4/2/1/1). Lower bands keep a subset of the higher bands' blades, so blades never reshuffle.
   - Cross-fade between bands with a screen-space dither (alpha-to-coverage or discard) over a short width.
   - Fade the outer edge radially (about 8% of the range) so the far edge is a circle.
5. **Blade vertex stage (TSL).** Each blade is a segmented strip that tapers to its tip.
   - A per-blade hash sets height, width, a resting bend direction and colour.
   - Bend each segment progressively, with stiffness shaping the curve. Add wind from a scrolling 2D noise sampled at the root, plus the interaction offset.
6. **Billboard alternative.** An atlas-cell quad per instance, mixing grass, flowers and weeds for distant or cheap ground cover.
7. **Shading.** Use a gradient from base to tip, a noise-clustered third colour, gloss toward the tip and a darkened base (fake AO).
   - Grass receives shadows but does not cast them.
8. **Interaction map.** A small render target that follows the camera (256², about half the view range). Stamp a sphere for each actor (feet, wheels) into it, and decay it every frame toward zero, corrected for frame rate.
   - The blade vertex stage reads the map as a push direction plus amount.
9. **Diagnostics.** Tile/LOD/blade counters and tile boxes, for our receipts.
10. **Upgrade they don't have.** For phones, move per-blade frustum and distance culling into a compute pass with indirect draws. Their docs show only per-tile culling, and give no phone figures at all.
