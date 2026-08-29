# mesh_warp — status at the builder's cap (2026-08-29, v2: the separable wall)

`design/plan-draft/measured/mesh_warp.py`, `plan_apertures.mjs`,
`test_mesh_warp.py`. Nothing is promoted; the store and `run-state.json` are
untouched. `--sweep-held` writes only into this directory.

## The defect this round closed

v1 pinned every landmark and let a THIN-PLATE SPLINE fill in between them. On
`closet_chamber-S` the door landed exactly where the plan rules it and ITS LEFT
JAMB CURVED: ~150 px of sideways correction, and the spline paid for part of it
by bending the moulding. `garden_room-S` bowed its cornice the same way. Both
are in `git show HEAD~1` if you want to see them again.

The fix is not more smoothing and it is not more pins. It is that ON THE WALL
PLANE THE FIELD IS NOW SEPARABLE AND PIECEWISE-LINEAR:

    x' = f(x)  through the pinned COLUMNS — left corner, each aperture's left
               and right edge, right corner
    y' = g(y)  through the pinned ROWS — ceiling line, each aperture's head and
               sill, floor line

Because x and y are independent, a vertical CANNOT come out bent and a
horizontal CANNOT come out bowed: the field has no freedom left to do it with.
Only the spacing between pins changes, so a 150 px move is paid for by
stretching the flat panel beside the door — never by bending it.

`--warp plane` is the default. `tps` and the three moving-least-squares modes
are still there for comparison.

## Off the wall plane, and the seams

The floor, the ceiling and the two returns keep `row35_snap`'s five-plane
homographies unchanged. They are made to AGREE with the wall by
re-parameterising each region's wall-junction parameter through the same `f`
(floor and ceiling) or `g` (the two returns) before it reaches the homography,
so the junction row lands column-for-column and the return's inner edge lands
row-for-row on the wall's corner column. At the seam the two fields are then
equal to floating point — `test_the_seams_are_continuous` samples 0.01 px each
side of all four junctions and measures a 0.023 px step across a 0.02 px stride.

What is left is a kink in the RATE, and that is the whole job of the 24 px band
(`SEAM_BLEND_PX`): measured perpendicular OUTWARD from the wall rectangle, the
field cross-fades by `smoothstep` from the wall's own map (linearly extended
past its last pin) into the region's homography — weight 1 ON the seam, 0 at
24 px out. So the junction leaves the wall at the wall's own rate and eases into
the plane's, which is C1 across it. THE BAND LIES ENTIRELY OUTSIDE THE WALL
RECTANGLE, which is why the straightness above is a property and not a
tolerance.

## Kept

Margin-aware mirror fill and `revealed_px` (nothing refuses on it); the
aperture-count refusal; the CLI; `--sweep-held`. The Jacobian report is
replaced by the per-segment scales it was trying to say —
`stretch.x_segments` / `y_segments`, one `target_px / source_px` per strip,
above 1 stretched and below 1 squeezed. They are the same quantity v1's
`max_local_stretch` measured (`1/sigma_min` of a target-to-source map is
`max(scale_x, scale_y)`), read off the pins instead of off a finite difference.

## A third refusal, named

`meshwarp.aperture_order`. Sorted by target, the sources must strictly
increase; if they do not, the painting has its apertures in a different ORDER
along the wall than the plan rules them, which is a content miss of the same
family as a missing door. The refusal names both pins. A segment under 1 px of
source (`MIN_SEGMENT_PX`) refuses with them — that asks for a hair of paint to
be magnified into a plank. Neither fires anywhere on this corpus.

## Measured, this corpus (`--sweep-held`, 2026-08-29)

11 of 24 held walls warp and 13 refuse — the same walls, the same clauses and
the same reasons as v1. Nothing was gained or lost in coverage; what changed is
what the 11 look like.

| facing | v1 max stretch | v2 worst segment | v1 fold | reveal v1 → v2 |
|---|---|---|---|---|
| closet_chamber/S | 1.261 | 1.210 (the door strip) | 0 | 0 → 0 |
| garden_room/S | 1.435 | 1.362 (cornice-to-head band) | 0 | 0 → 0 |
| great_stair_hall/W | 35933.6 | 2.337 | 2456 px | 513333 → 433553 |
| stair_landing/W | 4.983 | 2.482 | 0 | 65005 → 129024 |
| back_stair/E | 2.963 | 1.602, and 0.321 squeezed | 0 | 109920 → 82545 |
| great_hall/E | 0.811 | 0.796 | 0 | 832787 → 752443 |

The worst case falls on every wall measured, and A FOLD IS NOW IMPOSSIBLE: a
monotone separable map cannot turn the picture over, which is what the two
worst walls were doing to absorb a window 2.3x narrower than the plan rules it.
They now pay it as a 2.34x stretch of the window strip and a 0.58x/0.42x
squeeze of the wall either side — a legible price on a flat field instead of a
fold. `back_stair/E` is the loudest: the wall left of its door is squeezed to a
THIRD of its painted width, which is honest arithmetic and worth a look before
that one ships. `stair_landing/W` is the one wall whose reveal doubles.

## Seen with my own eyes

`closet_chamber-S.png`: the left jamb is a straight vertical from lintel to
floor, the wainscot panel beside it is a rectangle with straight stiles and a
straight top rail, the dado rail runs straight across the full width and
through the doorcase, and the cornice is straight. The v1 bow is gone, not
reduced. The wall left of the door is stretched 1.06 and the door strip 1.21;
neither is visible in the panelling.

`garden_room-S.png`: the cornice is dead straight across the frame where v1 had
a visible wave in its right half. Jambs, architrave, dado rail and wainscot
panels are all straight; the tile grout on the floor reads straight and
converging, and the wall-to-floor junction shows no step where the 24 px band
sits.

## Tests (`python3 design/plan-draft/measured/test_mesh_warp.py`, all pass)

* A — whole room 15 % too large: corners 0.00 px, door edges 0.00 px, every
  segment scale 0.870 (the one error the room is out by), residual 0.
* B — door 15 % too large and its centre 60 px right, in a room already
  correct: corners 0.50 px (the corner stud's own centroid, in a panel squeezed
  to 0.78), door edges 0.00 px, widest segment 1.155.
* Straightness, re-read from the OUTPUT PIXELS: a ruled vertical and a ruled
  horizontal on the wall deviate 0.0000 px over 535 rows / 895 columns in both
  fixtures. THE SAME STRIPE THROUGH THE v1 SPLINE BENDS 26.60 px on fixture B.
  That number is the defect, measured.
* Crossed pins refuse by name and name both pins; the seams are continuous;
  the v1 fixtures (pairing, mirror fold, MLS pin-exactness) are unchanged.

## Untried

Windows carry a sill AND a head, so a wall with several at different heights
pins several rows; no wall in this corpus has two. A wall whose apertures
genuinely disagree in order with the plan has never been seen, so
`meshwarp.aperture_order` has fired only in the fixture.
