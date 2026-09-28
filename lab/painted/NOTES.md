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

# v2 of the zero-asset room (P cycles painted → v1 → v2)

v1 is frozen in `procedural-v1.js`, exactly as first shown for grading. v2 lives in
`procedural.js` and applies holo-emitter-codex's ranked critique:

1. **Light, shaped like bounced light.** A softer sun, dimmer sky in the glass,
   and broad warm area lights where the room hands light back: the floor, the
   sunlit patch under the windows, the ceiling, and the north wall. Stronger
   GTAO. The levels are matched to the paintings' luminance percentiles
   (p10/p50/p90) at the four painting poses: painted N 8/27/64 against v2 7/22/60.
   The south view is still brighter (22 against 30 at p50). This is analytic
   light, not computed GI.
2. **Quieter materials.** Oak normal contrast is down and the oak is matte; the
   floor is less glossy; glass is dimmer. World-space grime is scuffed low on the
   walls with smoke under the ceiling.
3. **The chimney-piece rebuilt.** Dressed limestone in ashlar: jamb courses and
   a three-stone lintel, bevelled, each block its own tone, set in a mortar bed
   so the joints read, with weathering blots and a soot plume over the opening.
   The opening has a moulded border (hollow chamfer, fillet, bead). The frieze is
   carved in real relief (a displaced grid) between fillets, with carved rosette
   bosses and a deeper shelf.

`compare-painted-v1-v2.jpg` shows painted, v1 and v2, in four matched views.

# Zone-matched light (tools/zones.mjs)

`node tools/zones.mjs muniment_room --code v2` renders the painted shell and
the code room from each painting's exact camera. It splits every view into
zones using the code room's own instance IDs: ceiling, target wall, left and
right returns, floor near and far, windows, doors, fireplace. It then compares
low-pass luminance per zone and writes `zones/v2/zones.json` and `zones.png`
(red = code too bright, blue = too dark).

What it found that the eye had not:
- The floor was a fifth of the painting's value.
- The bounce rig was named backwards: the light called "ceiling bounce" hangs at
  the ceiling facing down, so it lights the floor. It was being dimmed to calm the
  ceiling.
- The walls sat 15–50 % bright, a material fault, not a light one: the oak is
  now 0.84 of the first pass, and the floorboards are lighter and greyed.

Code-to-painted ratios now (1.0 = a match):

| pose | ceiling | target wall | left return | right return | doors | fireplace | floor near/far |
|---|---|---|---|---|---|---|---|
| N | 0.89 | 1.00 | 1.03 | 0.66 | – | 1.04 | 0.84 / 1.28 |
| E | 0.89 | 0.99 | 0.74 | 0.65 | 0.98 | 0.96 | 0.92 / 0.98 |
| S | 1.15 | 1.14 | 1.47 | 0.80 | – | – | 1.22 / 1.49 |
| W | 0.94 | 1.29 | 0.76 | 0.53 | 0.89 | 0.63 | 1.04 / 1.28 |

The residue is pose-dependent: the same wall reads bright from one side and
dark from the other. Part of that is the four paintings disagreeing with each
other, since each was lit on its own. The next gain is a proper light bake,
not more hand levels.

# The light bake (lab/painted/gi.js)

v2's indirect light is computed. 75 probes on a 5×3×5 grid each render a small
cube map of the room as it is lit (sun, the sky seen in the glass, the window
light). Each capture becomes 9 spherical-harmonic coefficients in a float
texture, and every standard material adds the trilinear blend of its 8 nearest
probes as indirect diffuse light. A second pass re-captures with the first
bounce on. It hooks into the same shader chain as the patina, so nothing is lost.

What it showed: physically, a dark panelled room lit by two windows is very
high-contrast. The window wall goes black against the glass and the side walls
drop away. The painting is lit as the eye adapts to such a room, evenly
readable. So v2 keeps the computed bounce for direction and plausibility (light
pooling where it lands, darker corners and undersides) and adds a measured
fill (hemisphere 0.3, a softened version of the zone-matched softboxes) as the
eye's adaptation. `?gi=0` shows v2 without the bake.

Cost: 75 probes × 6 faces × 2 bounces ≈ 900 small renders at load. About 35 s on
this CPU-only machine (SwiftShader); on a real GPU, an estimated 1–3 s. The
bake belongs to the room and can be cached with it.
