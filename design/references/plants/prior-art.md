# Plants beyond grass: prior art (read-only pass, 2026-10-11)

Sources fetched and read: HZD slides (full), Lane & Prusinkiewicz PDF (text), Benes 2004 (abstract). The rest are abstracts, docs or press. Anything "recalled" is from memory, not checked. Licence tags: MIT code may be borrowed with credit; everything else is ideas only.

## A. Placement science

**Deussen et al. 1998** (<https://algorithmicbotany.org/papers/ecosys.sig98.html>), ideas only. Distribution by hand, by simulation, or both; approximate instancing for rendering. ADOPT: the framing that simulation output is only a density source that placement reads. REJECT: running the sim.

**Lane & Prusinkiewicz 2002** (<https://www.algorithmicbotany.org/papers/eco.gi2002.html>), ideas only. Read in full. Two families:
- Local-to-global (L-system simulation): self-thinning, where a dominated plant dies with probability 1 - shade tolerance; succession (fast, shade-intolerant species are overtaken by slow, tolerant ones); propagation (seeds fall near the parent, which is what makes clusters).
- Global-to-local: a density map plus a "deformation kernel". Each placed plant multiplies the probability field around it by a radial kernel (promote, inhibit, or short-range inhibit then promote). Species pairs use a kernel matrix.

ADOPT: the kernel idea as stamped footprints. A big plant writes "inhibit r<r0, promote r0..r1" into the habitat map at generation; the kernel matrix becomes a tiny per-species-pair table. REJECT: the iterative sampling (their runs took minutes on 2002 hardware).

**Benes & Soto 2004, clustering** (<https://www.cs.purdue.edu/cgvlab/www/resources/papers/Benes-2004-Clustering_in_virtual_plant_ecosystems.pdf>), ideas only. Clusters are units, and plants inside a cluster survive more often. ADOPT: clusters as a field (below), not per-plant sowing.


**Gain et al. EcoBrush 2017** (<https://diglib.eg.org/items/70e40ede-02cf-4508-b502-46605624ae76/full>). A database of simulated ecosystems indexed by terrain factors (sunlight, moisture, slope, temperature), interpolated for any terrain. ADOPT: the indexing idea (species suitability is a function of a handful of terrain factors). We hold the table as hand-authored niche curves. REJECT: the simulated database and its brushes.

**Kapp et al. 2020** (<https://perso.liris.cnrs.fr/egalin/Articles/2020-ecolearn.pdf>). Canopy first, then an understorey layer conditioned on it. ADOPT: strict top-down layer order.

**Makowski 2019** (<https://wp.faculty.wmi.amu.edu.pl/papers/Makowski.etal-2019-Synthetic-Silviculture.pdf>), **Ecoclimates 2022** (<https://history.siggraph.org/?p=117929>), **Bradbury 2015** (<https://studios.disneyresearch.com/?p=31648>). Per-plant growth simulation, with the last adding microclimate (forest-edge effects). REJECT as methods: hours of compute, per-plant meshes. ADOPT the finding in the first two: edges and canopy gaps are what make planting read as natural.

**Procedural Urban Forestry** (<https://arxiv.org/pdf/2008.05567>). Variable-radius Poisson-disk placement with random, boundary and cluster modes. Confirms our three needs (edge placement, clumps, per-species radii).

**Point-process statistics** (Neyman-Scott/Thomas; Cox processes). A clustered pattern equals a Poisson pattern whose intensity is itself random and smooth. That is exactly "density x clump field" in our rank scheme, so we do not need parent/offspring positions at all. ADOPT.

## B. Shipped and engine practice

**Horizon Zero Dawn, van Muijden, GDC 2017** (<https://www.guerrilla-games.com/media/News/Files/GDC2017_VanMuijden_GPUBasedProceduralPlacementInHorizonZeroDawn.pdf>), proprietary, ideas only. Read:
- World data is 2D maps. Placement masks are 1 m, variance maps 2 m, ecotope ids 2 m, erosion/flow/cavity 0.5 m, about 4 MB/km².
- Ecotopes list asset weights per layer (trees, bushes, undergrowth).
- Each layer: density map, then dither against a fixed blue-noise pattern ("even-spread thresholds, maximise 2D distance"), then placement. Pattern scaled to the footprint.
- Collision is solved by *layered dithering*. Same-footprint assets share one pattern and take disjoint threshold bands via a two-sided test. Different footprints would need GPU read-back, which they avoid.
- Result: 500+ assets, 100k+ objects, about 250 µs average GPU.

ADOPT the whole of it; it is already our grass method. The one new piece for us is two-sided threshold bands for species competition.

**Far Cry 5, Carrier, GDC 2018** (<https://blog.playstation.com/2018/03/22/the-procedural-world-generation-of-far-cry-5/>), press only; slides not found. Species "fight for the ground where they can thrive"; recipes react to terrain; humidity shows in the grass; north-facing slopes hold forest. ADOPT the winner-takes-the-cell competition and the habitat-driven recipe. REJECT Houdini offline baking.


**Unreal Procedural Foliage Spawner** (<https://docs.unrealengine.com/4.26/API/Runtime/Foliage/UProceduralFoliageSpawner/index.html>). Tile-based simulation with a unique-tiles pool and overlap. Recalled per-type fields: collision radius, shade radius, shade tolerance, spread distance and variance, seeds per step, max age, overlap priority. ADOPT those as our species schema. REJECT the simulation. **PCG** (<https://dev.epicgames.com/documentation/unreal-engine/procedural-content-generation-framework-node-reference-in-unreal-engine>): Self Pruning drops overlapping points by extent, randomised when radii are alike; filters on slope, height and layer weight. ADOPT slope/height/weight filters as niche axes.

**Godot Scatter (MIT)** (<https://github.com/HungryProton/scatter>) and **Spatial Gardener (MIT)** (<https://github.com/dreadpon/godot_spatial_gardener>): editor-time modifier stacks and brush painting. Ideas only; GDScript, wrong target. The modifier-stack shape matches our data-driven species rules.

**Wang-tile blue noise, Kopf 2006** (<https://johanneskopf.de/publications/blue_noise>) and **variable-radius Poisson disk, Mitchell 2012** (<https://dcmpx.remotevs.com/ca/cccg/2012/PL/papers/paper15.pdf>), ideas only. Kopf: deterministic, constant memory, density by arbitrary function, any region regenerable. It is the escape hatch if our rotated/mirrored 4 m tiles show repeats at shrub scale. ADOPT only if needed; shrubs are sparse enough that hash jitter on a lattice will do.

## C. Rendering many plants on a phone

- **agargaro/instanced-mesh** (<https://github.com/agargaro/instanced-mesh>, MIT, pushed 2026-10-06): per-instance frustum culling, BVH, distance LOD swaps, shadow LOD. Does not say it supports WebGPU. Ideas only unless a safety pass shows it runs on r186 WebGPU; our chunk-culled draws already do the job.
- **agargaro/octahedral-impostor** (<https://github.com/agargaro/octahedral-impostor>, MIT, last push 2025-11): 200k trees via mesh LOD to meshoptimizer-reduced to impostor at 100 m+. Candidate for shrub far-LOD code, but we must check WebGPU/TSL support first. Our own trees already use impostors.
- **Codrops "False Earth"** (<https://tympanus.net/codrops/?p=109307>): world position as seed for each blade's shape and colour, grid cells snapping with the camera. Same as our hash-from-address; confirms it.
- **scottstts Threejs-Awesome-Graphics-Agent-Skills** (<https://github.com/scottstts/Threejs-Awesome-Graphics-Agent-Skills>, MIT) lists a "culled procedural flower field" skill; its files were not opened. Safety pass and read before any use.
- Our own Grassworks measurement (README): alpha-tested cards cost as much as blades on phones. So flower heads should be small opaque geometry, not cut-out textures.

## Recommended design (extends the grass design)

1. **One ground map, more channels.** Keep the 0.25 m grass map. Add a 1 m habitat map (RGBA8 x2) from the generator: moisture (hollow index + flow accumulation + ditch/spring distance), shade (canopy and north-wall stamps), edge distance (two-pass chamfer from walls, hedges, paths, building bases), disturbance (wear, mown, grazed, dug), soil (smooth noise, lime to acid). Same masks as grass; HZD uses 1 m for this.
2. **Species are data**: layer; niche as a trapezoid per channel; abundance; clump scale and strength; size range; height; season window; kernel row (inhibit/promote vs other species); model id. About 20 for a 1660 Midlands manor (hawthorn, hazel, elder, bramble, dog rose; nettle, cow parsley, dock; buttercup, daisy, cowslip, red campion, foxglove).
3. **Suitability** = product of niche responses x abundance, per species, per cell, at generation. Not per frame.
4. **Competition by layered dithering.** Per layer, cells share one blue-noise point set with a rank. Species take disjoint bands of the rank axis, sized by relative suitability, so overlap is impossible and no read-back is needed. Rank once, threshold everywhere: low tiers are subsets.
5. **Clumps come from the address**: a Cox process. Density is multiplied by a clump field made of hashed lattice parents (scale per species, 3-30 m), with a Gaussian falloff and a floor, stretched along the wall, contour or path tangent for drifts and hedge-bottom bands. No stored parents; the same address gives the same clump on every machine. Big plants stamp Lane-style kernels (inhibit then promote) into the map at generation: seedlings ring a hawthorn, nothing grows under it.
6. **Layers, top-down**: canopy (existing trees) stamps shade and litter; shrubs (1 m map, individual models, collision radius from the footprint check); herbs and flowers (0.5 m); grass last. Edges get a hashed ecotone width, so the mown-to-rough boundary is ragged and steps from mown to tussock to nettle to bramble to hedge.
7. **Shrubs**: instanced near models of at most about 300 triangles, then octahedral or 2-card impostors, then a ground-shader blob tint, one draw per species per band, culled by the 8 m grass chunks.
8. **Flowers ride the grass draw.** A hash-chosen fraction of tall blades carry a small opaque head (a 6-triangle fan, no alpha); colour per clump. Beyond about 12 m (phone) the heads become speckles in the ground shader, using the same rank function. No new draw.
9. **Wind**: the shared function; flowers sway with their clump; shrubs sway only at the tips.
10. **Budget to verify** (estimates, not measured): about 0.5 ms phone for shrubs and flowers on top of the 2 ms for grass, so about 2.5 ms of 33 ms; at most 400 shrubs and 20k heads in view; habitat map under 2 MB per 128 m tile. Checks at generation: nothing in footprints or on paths, every species in its niche.
