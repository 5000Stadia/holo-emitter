# Prior art: earthwalker17/map-of-middle-earth (studied 2026-10-07, read only, never run)

Kabe pointed to this repository: "how another Claude model handled middle earth in 3JS".

## What it is

- A three.js r186 diorama of Middle-earth: a 1600 × 960 km map on a slab, viewed with orbit controls. You can't walk it. Its real deliverable is an offline-rendered film.
- The terrain is baked from real GIS data in Python, then layered with stamps.
- Nothing is generated at runtime, nothing streams, and there was no phone work.
- Performance: about 45–68 ms a frame on an integrated GPU.

## Safety and licence

- **Code:** MIT (`LICENSE`). Credit it if any of it is ported.
- **Data:** the geography data is third-party and permission-gated. It is fetched, never committed, and its terms don't pass to us.
- **Textures and fonts:** CC0 and OFL.
- **What I found:** nothing suspicious in the browser code. `tools/host.ts` kills processes on Windows and must never be run.

## Its answers, against ours

| Topic | Theirs | Ours | Take? |
|---|---|---|---|
| Where places are | authored data: `places.json` (id, kind, position, footprint, parent, region), `regions.geojson` (soft polygons, `softKm` edges), `looks.json` (one look per region) | plan types per place; no map | the form, when Kabe's framework calls for a map |
| Blending looks | `LookField`: one world-position weight field (multi-scale domain warp) feeds ground palette, haze, grade and field fringe; `ecotone` per region, so vague borders dither and feature-bound ones (forests, Mordor) stay sharp | not built (`looks.js` has no place-chosen or blended look) | yes: one weight function every consumer reads, with sharpness per border |
| Landmarks | `defineLandmark({...})`: stamps, kit, lights, trees, exclusion circles, tree-height caps, declared then realised by shared systems; validators for overlaps | plan types and kinds; the house's pad in terrain.js is a stamp in all but name | yes: places declare their stamps and exclusions as data |
| Terrain LOD | CDLOD with vertex morphing, one instanced draw, positions in a TSL position node (`src/terrain/cdlod.ts`, 93 lines) | quadtree tiles with skirts, in a render bundle | later, if seams show: port the morph (MIT) |
| Vegetation | a pure function of (seed, cell, data), 32 km chunks, a far "canopy shell" texture once instances retire | trees along field boundaries per tile, impostors | the canopy shell, later, for far woods |
| Haze | a TSL aerial-perspective fog node with height falloff and regional haze | plain `Fog` | the idea, when outdoor looks blend |
| Fields | `fieldWeightAt`: one function feeds hedgerow placement and the terrain's colour | `fields.js` owns boundaries; the ground's colour ignores fields | yes: field use should tint the ground too |
| Working with AI | a constitution file, a rolling state document, at most 2 agents in worktrees, "never accept subagent output unseen", blind A/B, pixel-hash locks, a perf gate | colony's method | already alike |

## Rejected

- The GIS bake and its fixed, finite world.
- A global baked look texture, which can't stream.
- The film machinery.
- The orbit-only camera, the TypeScript kit, the two uber-materials, and the Windows tooling.

## For Kabe's open question: a framework for joined places

Their answer, which holds only for a fixed world, has three parts:
1. A small authored map of places and soft regions in world coordinates.
2. One weight function w(x, y) that every look and scatter consumer reads.
3. Places that declare their stamps and exclusions; on conflict a rule decides who wins ("rivers win").

What they never answer is placing places dynamically, generating them on demand, and streaming them. They place every position by hand, in kilometres.
