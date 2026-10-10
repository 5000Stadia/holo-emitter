# Fresh-eyes audit, 2026-10-10

An outside look at a fresh build: how long each part of the load takes, and what a player would notice first.
Written without the team's opinions: I read code and measured, but not the team's design notes or reviews.

## Top 5 most glaring quality problems (ranked by how much they hurt the first impression)

1. **The rooms are empty.** About 6 pieces of furniture a room and almost no small things; a 75 m² kitchen holds 7.
   It reads as a house before the removal men arrive, not one lived in. `img/fresh-eyes-2026-10-10/manor-kitchen.jpg`
2. **From outside, every window is a black hole.** The house looks gutted from any distance; nothing gives the
   glass a sky to reflect. `img/fresh-eyes-2026-10-10/manor-out_side.jpg`
3. **No grass.** The ground is a flat green picture at walking height; no blades, tufts, weeds or worn edges.
   `img/fresh-eyes-2026-10-10/manor-out_ground.jpg`
4. **People are painted busts on a beam of light.** Flat, legless, soft-faced at talking distance on a phone, and
   the street has no one at all. `img/fresh-eyes-2026-10-10/case_phone-francis_side.jpg`, `street-s40.jpg`
5. **Rooms are black where they should be dim.** No bounced light: panelling and stairs go to black while window
   reveals glow white; on a phone two-thirds of the hall is dark. `img/fresh-eyes-2026-10-10/manor-stair.jpg`,
   `case_phone-hall_phone.jpg`

Next in line: the fire is orange cones (`manor-hall_east.jpg`); the sky is a flat gradient (`manor-fix-hill.jpg`);
and the manor shows a still loading screen for 7.5-8.5 s (12.6-15 s on emulated 4G), frozen for 5 s of it.

Machine: AMD Ryzen 7 1700 (8 cores), AMD Radeon RX 460-class GPU, Linux, headless Chromium (Playwright).
Pages served locally by `python3 -m http.server` (no compression, no HTTP/2: see "What I could not test").

## The standard I judge against (written before looking at any screenshot)

A player who opens a 1660 manor on a phone will compare it, without meaning to, to these:

1. **The Room series** (Fireproof Games, phones, 2012-2018). Ornate period interiors on a phone. The bar for
   *materials* (wood grain you can read, brass that shines, worn edges) and *lighting* (warm pools of lamplight,
   deep soft shadow, nothing flat-lit). Few objects, each one rich.
2. **Kingdom Come: Deliverance** (Warhorse, 2018). The bar for a *believable historic place*: rooms full of the
   right clutter, streets with mud, grass, weeds, carts, people going about their day. Desktop-only, so the
   ceiling, not the floor.
3. **Genshin Impact** (miHoYo, phones). The bar for *outdoors on a phone*: dense grass that moves, trees with
   real canopies, a sky with clouds and a sun, distance haze, all at 30-60 fps on a mid phone.
4. **Shadows of Doubt** (ColePowered, 2023). The nearest cousin: a *procedurally generated* city with murder
   cases. It shows what a generator can make feel lived-in: every flat has someone's things, every person has a
   face, a job and a route. It is stylized (chunky voxels), and gets away with it because it is consistent.

What "good" means, dimension by dimension:

| Dimension | Good looks like |
|---|---|
| Lighting | Light has a source you can see (window, fire, candle). Rooms are not evenly lit; corners fall into shadow; sunlit floor patches under windows. No black walls where light should bounce. |
| Materials | Every surface reads as what it is at 1-2 m: oak, plaster, flagstone, brick. No visible tiling repeat, no stretched or smeared texture, no plastic sheen on wood or stone. |
| Ground and vegetation | Outdoors, no bare flat-coloured ground. Grass with blades or at least tufts near the eye, wear along paths, weeds at wall bases, trees with leaf canopies (not lollipops). |
| Scale and clutter | Doors, chairs, steps feel human-sized. Rooms hold what was used there (a kitchen has pots, a study papers). No empty rooms, no floating or sunken objects. |
| People | Suspects have bodies and faces that hold up at talking distance, stand on the floor, face you. A street has people. |
| Sky and atmosphere | A sky with variation (clouds, sun glow), haze into distance, time of day felt. |
| Edges and aliasing | No crawling stair-step edges on thin lines (beams, railings, window bars) while turning; no flicker where two surfaces overlap (z-fighting); no light leaking through wall joins. |
| Phone UI | Text readable at arm's length on a 390-wide screen; touch targets at least 44 px; controls do not cover what you need to see. |
| Load | Something to look at within ~3 s; walkable within ~10 s on a phone on 4G; nothing freezes the page for more than ~100 ms once you can move. |

## What I saw, against that standard (visual pass)

Shots are in `design/audit/img/fresh-eyes-2026-10-10/`. Desktop shots are 1280x800 at 1x; phone shots are a
390x844 screen at 3x (the page draws them at 1x and the browser scales up, as it would on a real phone).
Backend in every shot: WebGPU (checked from `window.__eng.backend`).

1. **Rooms are nearly empty.** The kitchen of a 1660 gentry house holds a table and one press: no hearth in view,
   no pots, spits, dressers, sacks, herbs, no work going on. The great hall holds one long table, two benches, a chest,
   one candlestick. The Room and Kingdom Come fill every surface; here the eye finds bare floor and bare wall in every
   room I visited. Counted from `window.__manor.things`: 217 things in 34 rooms, about 6 a room, nearly all furniture.
   The 75 m² kitchen has 7 (hearth, table, press, form, two tubs, chest); the 75 m² south bedchamber has 5. Almost
   no small things anywhere: no dishes, pots, tools, cloth, papers on the study table. (The kitchen hearth exists;
   it was not in view from either end of the room.) Shot: `manor-kitchen.jpg`, `manor-hall_east.jpg`.
2. **No grass: the ground is a flat green picture.** Up close the lawn is one smeared texture; no blades, no tufts,
   no weeds at the wall foot, no wear, no edges where lawn meets gravel (they blend like paint). At walking height
   this is the first thing a player compares to any modern game. Shot: `manor-out_ground.jpg`, `manor-fix-field.jpg`.
3. **Windows are black holes from outside.** Every window on the house front and sides reads as a solid black
   rectangle with a cross in it: no glass, no reflection of sky, no glimpse in. The glass material is dark and
   35% metallic, and nothing in any page gives it something to reflect (no `scene.environment` anywhere in
   `lab/` or `src/`), so a metallic surface renders near-black (`src/make/manor.js:111-118`). From any distance the
   house looks abandoned or burnt out. Shot: `manor-out_side.jpg`, `manor-fix-hill.jpg`.
4. **People are painted busts floating on a beam of light.** The suspects are a flat portrait (head and shoulders,
   no legs) over a glowing holodeck disc and cone. It is a deliberate fiction, but at talking distance on a phone it
   reads as a cut-out, the faces are soft, and from the side the flatness shows. Nothing in the reference works
   looks like this; Shadows of Doubt's crude people still have bodies. Shot: `case_phone-start.jpg`,
   `case_phone-francis_side.jpg`.
5. **Rooms are too dark, and dark in the wrong places.** The panelled rooms render near-black (the great stair,
   the hall's upper walls), while the plaster window reveals glow almost white. Light only comes straight from the
   sun, one hemisphere fill and a few pooled window lights; there is no bounced light, so a room never fills with
   the soft daylight a 1660 room with big windows would have. On a phone the top two-thirds of the hall view is
   black. Shot: `manor-stair.jpg`, `case_phone-hall_phone.jpg`.
6. **The fire is orange cones.** Flames are seven-sided cones (`src/make/manor.js:388-390`) that scale up and down.
   Next to a carefully modelled chimneypiece they look like a toy. Shot: `manor-hall_east.jpg`.
7. **The London street has no people at all, and its gutter is a black stripe.** The street is the strongest
   scene (jettied fronts, signs, stalls, cobbles, sunlight) but it is empty: no one walking, no cart, no animal,
   no litter. The central kennel renders as a pure black band. Cobbles are a flat texture with no relief, so at
   a low sun they read as painted. Shot: `street-s40.jpg`.
8. **The sky is a flat gradient.** No clouds, no sun disc, no glow toward the sun. Outdoors it is half the frame.
   Shot: `manor-fix-hill.jpg`.
9. **The house is a box on a lawn.** No garden, outbuildings, stables, walls with weathering, paths worn to the
   doors, or people. Trees are good at distance but there are no shrubs or hedgerow undergrowth near the eye.
   The house's flank in shadow is flat dark with no detail. Shot: `manor-fix-hill.jpg`.
10. **The forest page is a field.** `lab/scale/forest.html` starts in a clearing; distant trees are dark
    cone-shaped cards, and the ground is the same flat texture. It is a scale test and reads as one. Shot:
    `forest-start.jpg`.

Smaller things a player would notice:
- On a phone, the first hint ("stick on the left to walk…") sits in the middle of the screen over the suspect's
  body for 7 s, and the opening narration box holds the top fifth of the screen for up to 24 s
  (`lab/manor/index.html` sayNext). Together they cover the first thing you are meant to look at.
- The phone draws at 1x on a 3x screen (`src/make/render.js:17`, `STEPS = PHONE ? [1, …]`). Edges and text on
  objects are visibly soft compared with the crisp UI on top. A deliberate trade for speed; on the GPU here the
  phone tier cost only 3.8 ms a frame, so there is room to try 1.5x.
- The tapestry (great chamber, banqueting house) reads as wallpaper with floating leaves on black, not woven cloth.
- Outdoors the room label still says "ground floor".
- The street and forest pages show a developer stats box by default.
- Edges: in stills, beams, rails and balusters are clean at desktop (4x MSAA is on). I judged edges from stills
  only, not from video while turning, so crawling on fine lines (the leaded lattices) is untested.
- No z-fighting, floating or sunken furniture spotted in the rooms I visited; placement is clean.

## Build timing (measured)

How: Playwright, headless Chromium 145, WebGPU on Vulkan (the backend was checked each run). "Cold" is a new browser
profile each run (empty cache, empty storage). "Warm" is the same profile reloaded after one discarded visit. Three
runs each; the table gives the median and, in brackets, the lowest and highest. Times are milliseconds from the
start of navigation. "Walkable" is when the page sets `window.__ok` (first frame drawn, input live). Stages come
from the page's own `performance.mark("holo:…")` calls (`src/make/render.js:24`). Long tasks are main-thread
blocks over 50 ms (PerformanceObserver). Phone = 390x844 screen, 3x density, touch, mobile user agent: this
emulates the phone's *screen and tier*, not its CPU or GPU (both are this desktop's).

Note: some warm runs overlapped my screenshot runs on the same GPU, so warm spreads are wider than they should be;
medians are the safer read.

### The manor (`lab/manor/`) and its variants, desktop 1280x800

| Page | Load | Walkable | Modules + renderer ready | House build (one task) | Build to ground tiles | First frame (shader compile) | Longest main-thread block | Transferred |
|---|---|---|---|---|---|---|---|---|
| manor | cold | 7447 (7270-7458) | 384 (368-391) | 4999 (4921-5051) | 790 (765-798) | 1253 (1188-1253) | 4919 (4857-4993) | 1726 KB, 100 requests |
| manor | warm | 7458 (7379-9373) | 251 (241-269) | 5053 (4930-5149) | 829 (814-836) | 1266 (1225-3333)* | 4996 (4870-5092) | 0 KB (all cached) |
| `?case=case-1660` | cold | 8477 (8462-10806) | 401 (362-676) | 5322 (5275-5351) | 1361 (1338-1372) | 1421 (1415-3430) | 5249 (5215-5298) | 2014 KB, 102 |
| `?case=case-1660` | warm | 8607 (8004-9421) | 256 (253-273) | 5563 (5075-6071) | 1301 (1282-1547) | 1464 (1387-1542)* | 5505 (5015-5998) | 0 KB |
| `?nofurn=1` | cold | 7669 (6679-11012) | 1279 (378-1380) | 3490 (2648-3596) | 2111 (1471-2352) | 1322 (1298-4021) | 3418 (2590-4661) | 1726 KB |
| `?nofurn=1` | warm | 6900 (4748-11987) | 252 (219-543) | 2454 (2354-2542) | 956 (812-1567) | 2851 (1325-7742)* | 3321 (2298-8193)* | 0 KB |
| `?plan=banqueting` | cold | 6442 (6242-8667) | 399 (343-1080) | 765 (753-781) | 3191 (2936-3595)† | 2193 (1659-3638) | 2686 (2068-4094) | 1726 KB |
| `?plan=banqueting` | warm | 7911 (3598-10696) | 700 (268-729) | 711 (694-860) | 814 (685-1054) | 5681 (1947-8047)* | 6088 (2343-8448)* | 0 KB |
| `?plan=alice-hall` | cold | 5750 (4304-7261) | 1269 (403-1486) | 289 (270-555) | 2495 (2342-4143)† | 1266 (1073-1709) | 1270 (1108-1713) | 1759 KB |
| `?plan=alice-hall` | warm | 1858 (1792-2572) | 273 (247-312) | 287 (269-302) | 251 (231-275) | 975 (966-1819) | 978 (968-1822) | 0 KB |

\* the middle warm run of every page came up on **WebGL 2, not WebGPU**, by design (see inefficiency 4); those
runs make the high end of the warm spread. † for the small places this stage is the first visit's textures being
drawn in the worker pool (about 3 s); on a warm visit they come from the workers' cache.

Manor, phone tier (`?case=case-1660`): walkable cold 8322 (8175-8409), warm 8046 (7992-8099); house build 5292
(5236-5362), the same as desktop because the CPU is the same. GPU memory 165 MB textures (desktop 434 MB).

### The other places

| Page | Load | Walkable | Longest block | Transferred | Page's own build figure |
|---|---|---|---|---|---|
| `lab/scale/street.html` desktop | cold | 1411 (1274-2082) | 609 (567-611) | 509 KB, 21 requests | street 566-611 (plan 31, geometry ~480) |
| street desktop | warm | 1125 (1068-1278) | 508 (465-517) | 0 KB | 464-517 |
| street phone | cold | 1567 (1549-3880) | 562 (540-858) | 509 KB | 478-561 |
| `lab/scale/forest.html` desktop | cold | 833 (794-903) | 140 (120-195) | 330 KB, 5 requests | placed 277-322, built 393-434 |
| forest desktop | warm | 684 (637-759) | 134 (114-207) | 0 KB | 381-440 |
| forest phone | cold | 804 (794-885) | 117 (115-142) | 330 KB | 412-463 |

The street and forest are fast. The manor is the problem.

### Where the manor's 5 s build goes (CPU profile, `?case=case-1660`, one cold load, 0.5 ms sampling)

Profiling slows code a little (the profiled load took ~10 s); read these as shares.

| Inclusive time | What | Where |
|---|---|---|
| 5994 ms | the whole house build | `src/make/manor.js:155` buildManor |
| 3121 ms | building things (furniture, doors, fittings) | `src/make/build.js:25` buildThing |
| 2225 ms | placing furniture in rooms (includes measuring kinds) | `src/make/place.js:42` placeRoom |
| 1897 ms | lifting faces that lie on the same plane (anti-flicker) | `src/make/coplanar.js:70` settleFaces, called from `build.js:104,116`, `manor.js:264,472,532` |
| 1160 ms + 343 ms | building a spare copy of a kind just to measure its size / door swing | `src/make/manor.js:168` sizeOf, `:174` sweptOf |
| 1017 ms | walls | `lab/painted/procedural.js:392` buildWall |
| 740 ms | the four suspects (portraits painted in code, each painted twice) | `lab/manor/index.html:328,330` portrait/faceOf, `src/make/sitter.js:247` |
| 647 ms | merging each room's meshes | `src/make/manor.js:516` merge |
| 1545 ms | first frame (pipelines, uploads) | `src/make/render.js:89` frame |

(These overlap: a spare copy built by sizeOf also runs settleFaces.)

### Network, emulated 4G (150 ms round trip, 9 Mbps), `?case=case-1660`, cold, 2 runs

Renderer ready at 3742-3799 ms (vs ~400 locally); walkable at 12587-15091 ms (vs ~8470). The ~100 separately
fetched modules cost about 3.4 s of round trips before any building starts.

### Frames once walkable

- Headless frames are capped at 60 Hz. Walking: p95 gap 17-33 ms. Turning a full circle: p95 33 ms (30 fps) on the
  manor at desktop size; 17 ms at the phone tier.
- GPU time per frame (page's perf card, WebGPU timestamps, this RX 460-class GPU): **desktop 21.3 ms** at
  1280x800 with 8 window lights and 4x MSAA; **phone tier 3.8 ms** (390x844 at 1x, 3 window lights, half textures).
- CPU per frame in `render()`: 9.8 ms desktop, 5.6 ms phone tier (perf card). In a 12 s walk-and-turn profile,
  `updateMatrixWorld` alone took 940 ms: the house's meshes recompute their matrices every frame though they never
  move (the street and hillside freeze theirs, `src/make/street.js:677`; the manor does not).
- Freezes after arrival: in 1 of 3 cold case loads a 1480 ms block came while turning, and the perf card's worst
  frame since walkable was 1540 ms (desktop) and 1375 ms (phone tier). The warm-up that compiles rooms ahead
  (`src/make/warm.js`) had not finished 13 s after arrival (12 rooms left) because it pauses while you move, so
  early walking meets uncompiled rooms. Cause of the single 1.5 s block: inferred, not proven.

## Top 5 inefficiencies

1. **The house is rebuilt from nothing on every visit, in one 5 s block.** Measured: one long task of
   4.9-5.3 s in every manor run, cold and warm alike; warm loads are no faster than cold (7458 vs 7447 ms). During
   it the page cannot even repaint its "raising the house" text. Cause: `buildManor` (`src/make/manor.js:155`)
   runs synchronously after the plan is sealed, and nothing it makes is kept. Likely gain: if built geometry were
   stored after the first build (or made at authoring and fetched), a warm manor would be walkable in about 2.5 s
   (renderer 0.25 + cached textures + tiles 0.8 + first frame 1.3, from the alice-hall warm numbers); splitting the
   build per room with yields would at least keep the page alive.
2. **The anti-flicker pass runs at load, twice over.** Measured: 1.9 s, about a third of the profiled build.
   Cause: `settleFaces` runs on every thing as it is built (`src/make/build.js:104,116`), then again on every room
   after merging (`src/make/manor.js:532`), re-checking faces already settled. A kind with the same settings gives
   the same result every time. Likely gain: 1-1.5 s by settling each kind once at authoring (or caching by kind +
   settings) and keeping only the room pass, limited to where things touch walls.
3. **Spare copies of furniture are built just to measure them.** Measured: 1.16 s (sizeOf) + 0.34 s (sweptOf).
   Cause: when a kind's data does not give its size, `src/make/manor.js:168-185` builds a whole probe copy and
   takes its box, and builds another to sweep its doors. These are fixed per kind and settings. Likely gain:
   about 1.5 s (partly overlapping with 2) from a size table written at authoring.
4. **Every second visit is forced onto the slower WebGL 2 backend.** Measured: the middle warm run of all five
   manor-family pages and the street came up on WebGL; there the first frame took 3.3 s instead of 1.25 s (manor)
   and up to 8 s (banqueting, one 8.4 s block). Cause: `src/make/render.js:28-29` tries WebGPU on visit 1, WebGL on
   visit 2, then keeps the faster, comparing the median frame gap (`render.js:73-74`), which is capped by the
   screen's refresh on any capable device, so the trial cannot tell them apart and the player pays for it. Likely
   gain: 2-8 s on a returning player's second visit; skip the trial where WebGPU starts, or compare GPU timestamps.
5. **About 100 separate files before anything starts.** Measured: 100 requests (89 of them this project's own
   unbundled modules, plus 1.2 MB of three.js from a CDN and a 307 KB area-light table) — 0.4 s locally but 3.8 s on
   emulated 4G, taking walkable from 8.5 s to 12.6-15.1 s. Likely gain: about 3 s on a phone network from one
   bundled, minified file (or at least `modulepreload` hints), which costs no runtime work.

Also worth doing, smaller:
- **First visit draws its textures in code** (~3 s in the worker pool: banqueting 2.96 s cold vs 0.09 s warm,
  alice-hall 2.27 vs 0.08). Hidden behind the build in the manor, exposed in small places. Authored, compressed
  images would remove it.
- **GPU memory**: 428-434 MB of textures and 196 MB of geometry on desktop (the floor texture alone is drawn at
  2880 px a side, per the comment at `lab/painted/procedural.js:340`); 165 + 193 MB on the phone tier. Geometry is
  large because rooms merge into non-indexed copies (`src/make/manor.js:523`; inferred cause). A tablet with a short
  side of 900 px or more gets the desktop tier (`src/make/device.js:6`).
- **Portraits painted twice** per suspect (full and face crop, `lab/manor/index.html:328,330`), 0.65 s at load.
- **Matrices recomputed every frame** for a still house (above): roughly 1 ms a frame on this CPU, more on a phone.
- **Desktop GPU cost** 21 ms a frame on a modest GPU: 8 rectangle area lights shade every pixel of every lit
  material; that is the knob (the phone tier's 3 lights cost 3.8 ms).

## Inherent limits of the system (what the approach can't currently make, or always gets wrong)

These come from how things are built, not from one bad asset. Each would need a new mechanism, not a tweak.

1. **No bounced light and no reflections.** Lighting is the sun, one hemisphere fill, a fixed pool of 3-8
   rectangle window lights and 3 point lights (`lab/manor/index.html:171-183`). The manor uses no light probe, no
   baked light map, no ambient occlusion, and no page has an environment map. (A probe-grid bounce-light module
   exists, `src/make/light.js`, but only `lab/brief/` uses it.) So: dark wood rooms go black instead of
   warm-dim; corners and undersides never darken softly; glass, brass, pewter and polished oak reflect nothing and
   look flat or black (the outside windows). Every room built by the generator inherits this. The Room, the bar for
   interiors, is mostly baked light and reflection probes; a generator could bake per room at build time or at
   authoring (that probe grid, per room, looks like the cheapest first step).
2. **The catalogue is furniture-scale only.** The placer (`src/make/place.js`) fills a room from kinds that each
   declare a footprint; it places a handful per room. There is no layer for small things (on tables, shelves,
   hooks, floors) and no "use" story per room (a meal half-laid, a kitchen mid-work). Rooms will read empty
   however good each piece is. Shadows of Doubt solves this with per-room clutter sets keyed to the occupant.
3. **Ground is a texture, not a surface.** Grass, gravel and the street's cobbles are image textures on a smooth
   mesh (`src/make/terrain-mesh.js:67-92`): no blades, no relief, no detail meshes near the eye, no blending at
   edges. Any outdoor scene built this way will look like a 2005 game at eye height. The fix is a scattered
   near-camera detail layer (instanced grass cards or blades within ~20 m, pebbles, weeds at wall bases), which
   the hillside's tile system could host.
4. **People cannot be bodies yet.** The only person is a painted portrait on a card (`src/make/presence.js`).
   There is no rig, no body, no animation, no crowd. A street, a market, servants at work: none can exist. (The
   roadmap's M8 "people from place", placed today, is aimed at exactly this; I did not read its plan.)
5. **Everything is built on the player's device at every load.** The world document seals the plan
   (`localStorage`), but the meshes are rebuilt from scratch every visit: about 5 s of one blocked main thread
   on this desktop CPU, so warm loads are no faster than cold ones (see timing). As places get bigger and fuller
   (point 2), load time grows with them, on the slowest devices. A built place needs to be cacheable
   (geometry stored after the first build, or made at authoring and fetched).
6. **Flat surfaces in the house.** The manor's wood, plaster and stone are drawn in code as colour only: no normal,
   bump or roughness maps in `lab/painted/procedural.js` or `src/make/manor.js` (the street does use normal maps).
   Panelling and flags look printed when the light grazes them. And the street's cobbles, despite normal maps,
   still read flat at eye height (`street-s40.jpg`).

## What I could not test, and how sure I am

- **A real phone.** The phone runs emulate the screen (390x844, 3x, touch) and the page's phone tier, on this
  desktop's CPU and GPU. A phone's GPU is weaker and its CPU is between this desktop's and much slower: a mid-range
  Android's single-core speed is roughly this Ryzen 1700's, a budget one slower, recent iPhones faster. So the 5 s
  build is a floor for mid phones, not a ceiling. GPU frame cost on a phone is unknown from here; the 3.8 ms here
  is an RX 460-class desktop GPU. The page's own perf card (`?perf=1`) on a real phone would settle both.
- **Safari / iOS.** Not tested at all (WebGPU support and memory limits differ; 360 MB of GPU memory on the phone
  tier is worth watching on iOS).
- **The published site.** I served the repo with `python3 -m http.server` (no compression, HTTP/1.0). GitHub Pages
  compresses and uses HTTP/2, which helps bandwidth, but not the depth of the module import chain.
- **Motion.** Visual judgement is from stills; shimmer, crawling edges and pop-in while moving are not judged.
- **Gameplay.** I did not play the case through; I judged the look and the load, not the story or the puzzles.
- **Coverage.** About 25 views of the manor, phone and desktop, 6 of the street, 3 of the forest, 1 each of
  alice-hall and the banqueting house. Rooms I did not visit may be fuller.

Confidence: high on the timings (3 runs each, tight spreads, stages from the page's own marks, causes located by
CPU profile); high on problems 1-3 (seen in every view and confirmed in code); medium-high on 4-5 (people are a
known deliberate stand-in; darkness depends on the display and would look a little better on a bright phone
screen). Gains in the inefficiency list are estimates from the measured shares, not tested changes.

Scripts and raw data (not in the repo): `/media/k/Blank/holo-emitter-scratch/fresh-eyes-2026-10-10/`
(`load.mjs` + `load.jsonl` for timings, `prof.mjs` + `prof-case.cpuprofile` for the build profile, `shots/` for all
screenshots).
