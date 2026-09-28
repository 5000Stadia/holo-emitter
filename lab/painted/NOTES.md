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
