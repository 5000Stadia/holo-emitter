# The manor from its plan, in code: what it costs

Kabe asked (2026-09-28) to measure how long it takes to build a location
this way, to plan production and near-real-time use. These are the numbers.
The whole manor was built from `packs/manor`'s plan (22 rooms on two floors, 26
openings, 48 windows, 11 fireplaces, 2 stairs) with the muniment room's kit and
no image of any kind.

## Machine time (headless Chromium with SwiftShader, i.e. CPU only; a real GPU draws faster)

| stage | time |
|---|---|
| compile the plan into every wall's elements (topology/schematic) | **1.5 ms** for all 22 rooms |
| procedural materials (oak, floor tile, plaster, limewash, stone, flags, brick, grass, gravel) | **2.0 s**, once per style |
| geometry: walls, panelling, openings, windows, chimney breasts and pieces, façades, stairs | **3.3 s** (≈ 150 ms a room) |
| merge by material (3,044 parts → 397 draw calls) | **0.4 s** |
| lighting setup (one sun, sky fill, a four-window rig that follows you) | **1–2 ms** |
| page load to first frame, including shader compiles | **8.0 s** |
| **edit one room and rebuild it** (e.g. taller windows) | **0.49–0.52 s**; its next frame 50–60 ms, or ~2.7 s when new shaders compile |

Per room, at runtime: about 0.15 s of geometry. The plan compile is effectively free.

## My time (Claude, wall-clock)

| step | time |
|---|---|
| the muniment room, first zero-asset build (v1), including tuning against the paintings | ≈ 1.5 h |
| v2 of the room (the twin's critique: light, materials, chimney-piece) | ≈ 45 min |
| **the whole manor**: kit refactor, plan compiler, house builder, walker with stairs, façades, three fix passes | **22 min** (09:13 → 09:35) |

The expensive part is the **style**: profiles, materials and light, authored
once per period or theme. After that, a new location that follows a plan costs
seconds of machine time and no model calls. A new *kind* of element (a stair
type, a bay window, a gallery screen) costs minutes of my time, once. After
that it is a function every plan can call.

LLM cost is not metered from inside a session. The manor step was about twenty
tool calls of code and review. The style work before it was several times that.

## What the plan does not yet say, so the kit guessed

- Door heights, window sills and heads (2.2 m, 0.95 m, 2.45 m); a chimney-piece's
  proportions, scaled from the breast's width.
- Style by archetype: service rooms are limewashed with flag floors; the hall
  has flags; everything else has oak panelling and boards.
- The exterior: an ashlar face wherever a building stands across a court, and a
  garden wall elsewhere. There is no roof.

## Open

- Light is analytic (sun, sky fill, a per-room rig), not computed GI, and big
  rooms read dark.
- One style for the whole house: rooms differ by plan, archetype and fireplace,
  not yet by character.
- The rooms are empty. Furnishing (catalogue or code-built objects) is the next layer.
