# R46 digest: look packages, seams and streaming (facts only, 2026-10-07)

## What R46 must do (ROADMAP.md, R46)

"Look packages, seams and streaming: the manor's approach opening onto a hillside package and a London street package, blended by world position at natural boundaries, neighbouring places built while you stand in one room, every stage timed."

M6 is one of three milestones that pause for the person's eye. That pause comes after R46.

## The goal it serves (ROADMAP.md Vision)

- "A manor leads out onto a hillside, and its drive leads into a London street, with no seams and no loading screens."
- "Places are built live, in code, from a description of them: a period and a place set the look, a plan sets the rooms, and the world assembles around you in seconds as you walk."
- "Space that hasn't been established yet shows as the holodeck grid."
- "Leave a room and come back, and it's exactly as you left it."
- "Each look is authored once for its period and place; after that, building a place costs seconds and no AI calls."

## The person's words on outdoors and streaming

From design/production/digest-2026-10-05.md:13,18-19 and lab/PRODUCTION-NOTES.md:32,41.

- Influences and factions apply to streets and hillsides.
- "Majestic Hills".
- Streaming means "fully rendered … your room and each connected space … 2 locations away in every direction being the live work".
- 2026-10-06, on what to prepare for: build for the outdoors. Nothing should assume "inside a house". The story's required items come first.
- 2026-10-06: checks are generation-time arithmetic in milliseconds, never run in play. Exceptions are declared as data.
- 2026-10-06: fix sources systemically, never one fault at a time.
- Earlier: a uniform outer-wall offset was rejected; the footprint follows the plan's outline.

## Decided already (design documents)

**lab/WORLDSPRING.md:11**
- Terrain, noise and look blends are evaluated in world coordinates, so seams agree by construction.
- A sample is a function of the global lattice index, never of an origin plus a local offset.
- Rooms and places are keyed and built in any order with the same result. Caches are keyed by the world's hash.

**design/production/plan.md §5**
- There are four commitment levels:
  - *exists*: coarse facts, on demand;
  - *planned*: "a blueprint, two rings out, in workers";
  - *built*: "geometry, for your room and every connected one";
  - *committed*: sealed when first seen.
- "Far things are cheap stand-ins. Terrain is a height function of world position, shared by the walker and the picture, built in tiles with levels of detail."
- Play never waits: a missing part stands as holodeck grid.

**Elsewhere**
- plan.md:40: "Looks are per period and place … cached on the device, GPU texture synthesis as goal."
- plan.md:65: "the same blend by world position makes seams between looks soft".
- design/perf/plan.md:68: log depth outdoors; distant things become impostors or merged chunks.
- design/perf/plan.md:74-77: textures come from a worker pool cached by recipe hash; geometry is built in workers; "Room 0 compiled first, then the rest streamed nearest first".
- design/perf/links-review.md:212: SharedArrayBuffer needs COOP/COEP headers, which GitHub Pages (the host) can't set. Use plain Workers with transferable arrays.
- design/perf/links-review.md:45: TSL node builds stall 0.4–0.9 s at load on a desktop.

**Engine rules (agreed 2026-10-06, measured in the fps lab)**
- three.js r186 WebGPURenderer, with WebGL 2 as fallback.
- Render bundles for static content, which are 9–21× faster. The manor still uses them only on request, because they drop some wall meshes.
- One InstancedMesh per kind, and materials shared by role.
- A still sun's shadow map is drawn once, and only big things cast shadows.
- Log depth outdoors, ordinary depth indoors.
- No GTAO.

## What exists (read from the code, 2026-10-07)

**No outdoors in `src/`**
- There is no terrain, no outdoor look, no workers and no streaming.
- Open rooms (the manor's forecourt, `type:"open"`) are skipped by the builder, the walker and the specs.
- `scene.background` is a flat colour, with one directional sun and a hemisphere light.
- The house's outside is `plan.outline`. Its faces are the carve's stone (`src/make/carve.js`).

**Build costs**
- Everything is built up front, synchronously, on the main thread:
  - the manor's 35 rooms: about 4.6–4.8 s;
  - walkable: about 7–11 s;
  - the shared procedural texture kit: about 5.6 s of that.
- An older kit (lab/house/house.js) built the nearest rooms first, then the rest via `setTimeout(0)`.

**Showing and sealing**
- `manor.visibleFrom(room)` shows the room you stand in and two doorways deep, through open doors and stairs. Only what is visible is drawn; nothing is built later.
- The world document (`src/make/world.js`) seals a place's inputs when first seen (`seal(key, inputs)`, with a hash and the generator version). The manor seals its whole plan under one key.

**Looks**
- `src/make/looks.js` `lookC1660` has about 38 material roles, all indoor (no stone, grass, gravel or slate as roles).
- A page hard-codes its look. Nothing chooses a look by place, and nothing blends two.
- `src/make/influence.js` `blend()` is a weighted average of traits with no position.

**Walking, placing and checks**
- The walker (`src/make/walk.js`) stands on the plan's floors and stairs.
- The claim grid (`src/make/claims.js`) is per floor, with layers floor / stand / wall / over and cells of 0.1 m, or set by the plan.
- The placer (`src/make/place.js`) places kinds by declared rules: anchor, must, prefer, layer.
- Generation checks:
  - plan checks, about 45 ms;
  - soundness rules, walking with each of a place's bodies, about 0.4 s;
  - reachability, `src/make/reach.js`;
  - placement passage, about 1–2 ms a test;
  - all at generation, never in play.

**The forest scale test (lab/scale/forest.html, lab/RECEIPTS.md:534-554)**
- A 1 km² hillside with 87,370 trees, built in about 0.4 s.
- Impostors drawn as one static instanced draw per kind, folded away within 90 m (60 m on phones) by a TSL position node.
- Near trees rebuilt from a 16 m grid every 4 m walked.
- A 120 m sun shadow box that follows you, and fog.
- WebGPU 140 fps (p99 8.7 ms), 11 draws, 2.8 million triangles.

**The fps lab (lab/RECEIPTS.md:587-604, RX 460)**

| Case | three.js | Godot |
|---|---|---|
| 5,000 street objects, separate | 23 fps | 35 fps |
| … in a render bundle | 330 fps | – |
| … instanced per type | 1,342 fps | 658 fps |
| … instanced, with shadows | 559 fps | 525 fps |

- Log depth holds a 5 km scene at no measurable cost.
- Ordinary depth breaks 5 cm façade detail at distance.

**Alice (R49, 2026-10-06)**
- The garden beyond the little door is seen, but not entered. Entering it was deferred to R46.

## Prior art (a read-only pass, 2026-10-07; licences noted)

- **Terrain LOD**
  - CDLOD (Strugar; MIT): a quadtree of regular grids, morphing between levels, no stitching.
  - DRIFTWING (three.js r184, WebGPU/WebGL2):
    - terrain generated in workers and handed over as transferable buffers;
    - ring LOD with skirts and pooled chunk meshes;
    - one seeded generator shared by the worker and the main thread, for collision.
    - Licence not found, so ideas only.
  - Terrain3D (Godot; MIT): non-contiguous regions streamed in, splatting, foliage instancing.
  - Phone budget from procedural-landscapes-threejs (MIT): about 500k vertices and 4–8 visible chunks.
- **Determinism**
  - Integer hashing, PCG by Reed: `state = in*747796405u + 2891336453u; …`, with `Math.imul` and `>>> 0`.
  - `+ - * / sqrt` are exact IEEE everywhere, but `Math.sin/cos/exp/pow` may differ between engines.
  - Ground and placement must not come from GPU compute (float results are not guaranteed bit-exact). The GPU is for looks only.
  - Seeded-noise npm packages often default to `Math.random`.
- **Blending by position**
  - Simple-Biome-Blending (KdotJPG; Unlicense): weights summing to 1 that vary continuously, so a border is a ramp between what each biome makes alone.
  - Blend parameters (height, ground colour, scatter density), not finished geometry.
  - Townscaper settles hard constraints first and decorates after.
  - Wave Function Collapse (MIT): its own documentation says streaming and boundaries need special handling, and contradictions occur.
- **Streets**
  - CGA shape grammars (Müller et al. 2006, the basis of CityEngine): split, repeat, component split, stochastic rule choice. A street becomes a sequence of lot widths, each a frontage type split into storeys and bays, with jetties as per-storey offsets.
  - No JS façade generator was found worth porting.
- **Scatter**
  - Poisson-disc sampling (Bridson) run per cell, seeded by `hash(cell, seed)`, so a chunk can be generated alone.
  - Hedgerows as instanced strips along a spline.
  - GPU culling (toji/webgpu-bundle-culling, MIT) needs compute; the WebGL 2 fallback would need per-chunk bounds.
- **Streaming**
  - Generate in workers, send transferable arrays, upload on the main thread in time-sliced pieces (2–4 ms a frame on phones).
  - `requestIdleCallback` is only a hint and is not Baseline.
  - First-frame stutter comes from geometry and texture upload, not only shader compile. Pre-warm hidden, then show.
  - `renderer.compileAsync` and `initTexture` exist.
  - OffscreenCanvas rendering in workers: rejected.

## Period facts (design/outdoor/research-1660.md)

Sourced or chosen, and tagged in the file; several primary sources were unreachable (its §0 lists them).

**The seat and its forecourt**
- Limestone with gritstone dressings, under grey-green stone-slate roofs (Eyam Hall, 1671-76; Beauchief Hall, 1671).
- The forecourt, on Beauchief's model:
  - a stone wall about 2.4 m high with rubble coping;
  - ashlar piers with pyramid-on-balls finials;
  - a pair of wrought-iron gates with an overthrow;
  - a low front wall with iron railing, and segmental steps to the door.

**The grounds**
- Sourced: walled garden compartments, orchards, a bowling green, a dovecote, fishponds.
- Avenues are documented only from about 1700. A short elm or lime avenue is chosen.
- The service courts stand to the side.

**The hillside**
- Irregular dry-stone walls and hawthorn-quickset closes, beside unhedged ridge-and-furrow strips (4.6–20 m wide, up to about 0.6 m high).
- Sheep, ricks, thorn scrub, and bare thin-soiled tops.

**The lane**
- Unmetalled, 4–5 m wide, rutted 0.2–0.3 m.
- Hollowed into the slope where it climbs.
- Statute labour by the parish.
- Turnpikes began only in 1663, in Hertfordshire, Cambridgeshire and Huntingdonshire; none in the Midlands yet.

**London before the Fire (1666)**
- Main streets 9–12 m between fronts (chosen).
- Houses of 3–5 storeys, with jetties of about 0.45–0.6 m a storey.
- Plots 4.5–6 m wide.
- Storeys 2.6–3.2 m (the 1667 Act).
- Oak weathered silver-grey (no evidence of black paint before the 19th century), with panels limewashed cream, ochre and pink.
- Clay tile roofs (thatch banned in the City since 1212) under sea-coal smoke.
- Pebble paving with a central kennel.
- The 1662 Act's posts and stoops, its rules on rubbish, and lanterns at doors until 9 pm.
- Shop shutters that fold up into a pent roof, and stall boards that fold down.
- No downpipes: water falls from the eaves.
- Large painted or gilded signs on iron brackets, "nearly cross[ing]" narrow streets (c.1698).
- Cheapside's conduits: the Standard and the Eleanor Cross.
- After 1667: brick, no jetties, wider streets.

**Where town met country**
- Holborn Bars: posts, rails and a chain, where tolls were taken from carts.
- Temple Bar before 1672: a timber house across the street with a narrow gateway.
- Gray's Inn Lane: houses thinning into fields toward Highgate.

## The questions R46 must answer (open)

1. **Where the places stand in one world.** A Midlands seat and a London street are about 150 km apart. The vision joins them ("its drive leads into a London street").
2. **What the ground is.** How a walkable outdoor ground (a height function), the house's carved solid, and the claim grid and walker that rooms use fit together, including the forecourt and the house's outside faces.
3. **What a look package is.** The data that describes a place's look and content (ground, scatter, buildings, materials), and how two are blended across a boundary by world position without seams.
4. **How a street is generated.** How a London street is made from rules (lots and frontages) within the existing kinds-and-parts system, and how far it can be entered (doors and shops) versus seen.
5. **What gets built when, and where.**
   - Which places or tiles are built, planned or only coarse, given "your room and each connected space … 2 locations away".
   - How building leaves the main thread (workers, transfer, time-sliced upload) without hitches, on phones too.
   - How the world document seals outdoor ground when first seen.
6. **What is checked at generation**, outdoors, in milliseconds: reachability, slopes a body can walk, seams agreeing, and the same result in any build order.
7. **What R46 must deliver for the person's walk-through**, and what can wait.

