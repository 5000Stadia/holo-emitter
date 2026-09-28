# lab/painted: the painting is the texture

The 3D rooms in `lab/room3d` and `lab/office` throw the painted facings away and
keep only their median colours. This lab keeps the paintings. A facing is
one-point perspective, so its back wall is a flat rectangle square to the
camera, and a crop of that rectangle is the wall's texture, exactly. Floor and
ceiling are flat too: each texel is carried through the facing's pinhole camera
(principal point = vanishing point, focal from the meta, scale from the back
wall's width) and sampled where it lands.

Open `lab/painted/?room=muniment_room`. Keys `1`–`4` stand you where each
painting was painted from; `G` ghosts the painting over the render.

## Pipeline, per room

1. `measure.json`: the back-wall rectangle on each facing (x0, x1, ceiling
   and floor rows), read off gridded 2x zooms. The facing metas' corner and
   floor numbers were off by up to 40 px on this room (N's floor line). The
   vanishing point comes from `tools/paint-calibrate.py` (LSD segments +
   RANSAC over floorboards and side-wall mouldings). The automatic back-wall
   finder in that tool is not reliable yet; the hand read is the authority.
2. `tools/paint-shell.py measure.json` (about 1 min on CPU) writes the four
   wall crops, the projected floor and ceiling, the doorway views, the
   projected hearth, and `shell.json`.
3. `index.html` builds the shell from `shell.json`: wall planes notched for
   doorways, the chimney-piece as reliefs standing proud with the painting on
   their face, a firebox recess, passages behind doors with the painted view
   set at their far end.

No model, no prompt, zero LLM cost per room once measured.

## What the paintings disagree on, and the ruling taken

- **Floorboards.** N paints its boards running N-S; S, E and W paint them E-W.
  The floor takes E and W. S is left out because its window sheen reads as a
  puddle once you walk. The middle, which no painting sees, is mirrored along
  the boards so every board line runs unbroken.
- **Ceiling.** The centre is unseen by all four paintings. It is filled with
  the painted plaster's median colour plus code-made grain matched to the
  paint's own, and blended into the painted ring.
- **Room size.** Each facing implies slightly different proportions (storey
  2.96–3.33 m). The room is 4.85 × 4.87 × 3.1 m and each wall crop stretches
  to fit it.

## Limits seen

- Lighting is baked into the paintings, which is right for walls. Sheen on
  the floor is view-dependent and would lie; that is why S is dropped.
- Up close the walls are about 2.5 px/cm and go soft at arm's length.
  An upscale pass is the fix.
- Measuring is manual (about 5 min a room at the gridded zooms). Making the
  calibrate tool reliable is what lets this scale to the other 30+ rooms.

## Time

Built 2026-09-28, about 25 min wall-clock from go to walkable, including
the calibration detour.

# The zero-asset build (press P)

`procedural.js` builds the same room from `muniment_room/schematic.json` alone.
It uses no mesh, texture file or prompt. Press `P` in the page to flip
between the two; the `1`–`4` poses work in both. `compare-painted-vs-code.jpg`
shows four matched views, painted on the left and code on the right.

What the library is:
- **Schematic** (1.2 KB): the room's size, plus each wall's elements (chimney-piece,
  doors, windows) in metres in that wall's own frame.
- **Style** (`STYLE` in procedural.js, a few hundred bytes): the heights of skirting,
  dado, frieze and cornice; stile, rail and bay widths; and the profiles, each a list
  of (offset, depth) points: fielded panel, architrave, skirting, dado rail,
  cornice, mantel shelf.
- **Geometry**: one routine, `loft`, sweeps a profile along any path by offsetting
  the path per profile point, which mitres every corner. The same routine builds
  panels (closed rectangles), architraves (open U paths) and the chamfered
  four-centred arch. Panels are laid out by subtracting openings from each zone
  and dividing what is left into bays; overmantel and over-door panels fill
  whatever an opening leaves above it.
- **Materials**: generated on load from periodic noise. Quarter-sawn oak with
  latewood lines, ray fleck and figure; E-W floorboards cut from the same oak;
  lime plaster; limestone; sooted brick; carved vine frieze; leaded quarries with
  a shield of arms. Every panel and member takes its own cut of timber and its
  own tone.
- **Light**: a low sun through the south windows (shadow-mapped), an area light
  in each window's glass, hemisphere fill, a warm floor bounce, and screen-space
  ambient occlusion (GTAO). Levels were tuned so the code room's brightness
  matches the paintings at the painting poses.

Build time in the browser: about 2.5 s, most of it growing the oak. Size:
procedural.js is about 35 KB of code, and nothing else is fetched.

Not yet: a real light bake. Indirect light is a fill, not computed, so corners
and undersides are brighter and flatter than the paintings. The fireplace is
the weakest part: the stone is flat and the carving is simple. The next step is
a path-traced "stand still" mode, or a baked lightmap.

# What painting over the code room would need (step 2, not set up)

The Codex seat was reached through AgentPost, which is retired, and the Codex
Remote bridge is gone. To paint over a render and project the paint back, we
need an image model that takes a structure guide (a depth or edge map from the
code room) and returns a painting that matches it. The options:

- **A hosted Flux or SDXL depth-ControlNet endpoint** (fal.ai, Replicate):
  seconds per image, about $0.03–0.06 each, about 4 per room. Needs an API key
  from Kabe and a spending decision.
- **OpenAI gpt-image with the render as an edit reference**: follows structure
  more loosely, about $0.04–0.19 an image. Needs a key.
- **A local model**: this machine has no GPU, so minutes to hours per image on
  CPU. Not practical without a GPU box.

The code side is ready for any of them: the page knows every camera exactly,
so a painting of a known view projects back with no hand-measuring.

# The render packet (for a structure-preserving paintover)

`node tools/render-packet.mjs muniment_room --scales 1,2` renders the zero-asset
room from each painting's camera at an exact 1536×1024 (and a 3072×2048
master). `tools/render-packet.py` then writes, per
`muniment_room/packet/<scale>x/<F>/`:

- **Colour:** `beauty_lit`, `beauty_neutral` (even hemisphere fill, no cast
  shadows, no AO), `albedo`.
- **Data:** `depth_u16` (euclidean metres × 1000, 0 = no hit) and
  `depth_preview`; `normal_camera_u16` (camera space, +X right, +Y up, +Z toward
  the viewer).
- **Edges:** `edges`, `edges_silhouette`, `edges_crease`.
- **IDs:** `material_id`, `instance_id`, and `id-map.json` (RGB → instance, material,
  owning facing). Every mesh the build makes is named, e.g. `N/chimneypiece/7`,
  `S/window_sw/glass2`.
- **Ownership masks:** `owner.png`; for the order N → E → S → W (lead N),
  `editable_mask` (this facing's own surfaces), `preserve_mask` (surfaces of
  facings painted earlier) and `later_mask`. Floor and ceiling texels belong to
  the nearest wall.
- **Camera:** `camera.json` has position, quaternion, look-at and up, both
  FOVs, focal px, principal point, near/far, the world-from-camera, view and
  projection matrices (row-major, plus three.js column-major), tone mapping and
  colour space per pass, the depth and normal decode rules, room size, and the
  sha256 of the schematic, procedural.js and the page.

It takes about 2.5 min for both scales; the packet is gitignored
(1x ≈ 50 MB, 2x ≈ 160 MB). The contract is holo-emitter-codex's, 2026-09-28.
