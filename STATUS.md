# The reveal fill extends each surface along its own recession

Brief: [HUMAN, 2026-08-29, verbatim, on `backdrops/back_office/S.png`] "back
office S has the edge effect where it stretches off the screen. Visually when
this is used, it doesn't stretch the edge off in the continuous direction that
the angles of the room already go. It should stretch into the direction of the
edge for example. The bottom right edge should be stretched to the bottom right
edge in the top right edge should be stretched to the top right edge. If this is
skewed in this way, it will at least look better than the alternative directions
that they are being skewed."

## 1. The rule

A revealed pixel — one whose target-to-source coordinate lands past the painted
extent — is not a stray coordinate. It lies on a NAMED surface, and that surface
has two axes of its own. A receding plane's image is `V + U/q`: every point of
it at depth `q` sits on the ray from the convergence `V` in the fixed direction
`U` that its across-wall parameter names, and `s = 1/q` is how far out along
that ray. So the fill keeps the pixel's plane and its ACROSS parameter untouched
and clamps only its DEPTH, to `1/s_max`, where `s_max` is the ray-box exit of
that plane's own receding line against the painted extent (`ray_exit`). The last
painted texel of the surface is therefore extended along the receding line it
already sits on: a return continues out to its own side edge, the floor's
bottom-corner region continues toward the bottom corner, and every straight line
of the painting that recedes stays that same straight line out to the frame. On
the wall plane, whose axes are the frame's own, the same rule is the coordinate
clamp. The extension cross-fades into the paint over `FILL_FADE_PX = 24` px
measured DOWN THE RECESSION — `s` turned into picture by the length of that
plane's own seam ray — and not perpendicular to the frame edge; a plane with
nothing revealed on it is not faded at all. Nothing is mirrored: `warp_with_axes`
now samples through `resample_clamped`. The v1 scattered-pin fields (`tps`, the
three MLS modes) know of no surfaces, so they keep `mirror_fold` and say so.

## 2. What did not change

The pins, the separable wall-plane field and the seam blend are untouched — the
new `plane_field_and_fill` is the old `wall_plane_field` with the fill computed
alongside it, and `wall_plane_field` is now a two-value wrapper on it.
`max_residual_px` is 0.0 on both proof frames, the four seam checks still read
0.023 px across a 0.02 px step, and `revealed_px` on `back_office/S` is 76800
under both fills — the same field, priced the same way, filled differently.

## 3. The tests

`python3 design/plan-draft/measured/test_mesh_warp.py` — all checks pass, 9
cases. New: `test_the_reveal_continues_the_return`, a room drawn 15 % too large
about the convergence with four stripes ruled ALONG the right return (constant
`p`, which on a return is a straight line of the image through the convergence).

    the right return is revealed by at least 80 px      101 px, from x=1435
    every column still shows exactly the four stripes   4, 4, 4, 4
    each stripe's row at the frame edge is the row its
      junction lines extrapolate to                     worst 0.313 px
    the stripes run into the revealed band as straight
      lines (fitted to the paint, read in the band)     worst 0.218 px
    no column of the revealed band is its own mirror    []

## 4. The proof — `design/batches/warp-fill/`

`back_office/S` (cyberpunk-2, `row23-7fc68c04.png`): 76800 px revealed, 122653
px carrying some fill, 70454 px changed against the mirror (4.5 % of the frame).
BEFORE: at the left frame edge the skirting and the dado rail hit the edge and
break into a sharp chevron, and the foam grid doubles back on itself — the
zigzag Kabe named. AFTER: the same rails run straight into the edge and off it,
and the band beyond is a directional streak drawn down the recession toward the
bottom-left corner. At the top right the return streaks up-right to the corner
and the ceiling junction leaves the frame straight. It reads as the room
continuing. The honest cost is that the extended band IS a streak — the foam
grid's own texture does not survive in it, and the floor plate's dot rows are
drawn out into lines — but it goes the way the room goes and no line kinks.

`garden_room/S` (manor, `row23-ab42bebe.png`): `revealed_px` 0. This facing is
wider than the lens, so the declared corners fall outside the frame, no return
is in shot and the warp never asks for a pixel beyond the painted extent. The
before and after frames are the same picture. An honest null: this frame had
nothing for the fill to do, and the second proof Kabe asked for does not
demonstrate the change.
