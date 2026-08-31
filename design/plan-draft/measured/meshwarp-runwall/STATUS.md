# run walls in the warp — status at the builder's cap (2026-08-30)

Branch `run-wall-instruments`, worktree only. Nothing is promoted; the store,
`run-state.json` and every main-checkout file are untouched. This directory
holds the four proof warps and nothing that a promotion reads.

## What a run wall is, and why both instruments refused it

`platform/N`, `platform/S`, `platform_far/N`, `platform_far/S` on
`packs/underground-2` are the long sides of a 12.8 m room. The painting shows
ONE corner — the closed end — and the wall running flat off the other frame
edge: no second corner, no second return, and past the open side the ceiling
line stays HORIZONTAL because there is nothing there to ramp. The scaffold says
so: `tools/plan-projection.mjs` `runSpanOf` puts `corner_x0_px`/`corner_x1_px`
at the ends of the RUN, so one of them lands metres outside a 1536 px frame
(platform/N: 85.3 and 2816.0, `wall_run_m` 12.8 against `wall_width_m` 6.4).

Both instruments assumed two corners and two returns:

1. THE HORIZON FIT holds these frames as `unfitted-horizon` /
   `suspect-painting` — it fits BOTH ceiling ramps and the open side's is
   horizontal (`left_slope 0.0000`). That routing is CORRECT and is unchanged:
   the hold sends the wall to the warp, and inside the warp `ramp_refusal`
   says the same thing in its own words and the box falls back to the declared
   principal point, which is where a run wall's convergence belongs.
2. THE WARP refused `meshwarp.landmark_unreadable` — "the declared camera does
   not see this room: the convergence sits at x 768.0 and this frame's wall
   runs 843.3..2058.0". `target_box_from_plan` saw two off-frame corners, fell
   back to the painted width about `wall_centre_x` (1450.7, the RUN's midpoint,
   not the bay's), and drew a box the principal point was outside of. THIS is
   what this round fixed.

## What was added

`row35_snap.run_wall(declared)` reads the run off the declared meta: exactly
one corner inside the frame, plus `wall_run_m` (or, for a manifest that
predates the field, a corner span at least `RUN_WALL_MIN_RATIO` = 1.25x the
declared `wall_width_m`). It returns None for all 85 manor facings, all 12
hospital-3, all 8 cyberpunk-2 and the 8 non-run underground-2 facings — the run
branch fires on a run meta or not at all.

`row35_snap.run_source_corners` then places the box from THE ONE CORNER AND THE
RULER: `px_per_m_at_wall` is `dado_rail_above_floor_px / RULER_M`, so the open
end is the corner plus the run's visible metres at the painting's own scale. No
second corner is needed and none is looked at — whatever
`find_corners_recession` returned on the open side is a recession break and is
ignored rather than pinned.

`mesh_warp.target_box_from_plan` holds the real corner where the plan rules it
and CLAMPS THE OPEN END TO THE FRAME EDGE. That is the same physical place the
source box's open edge names, so the wall map is the one the off-frame corners
would have given — with no pin outside the picture. `wall_axis_pins` takes the
column names, and a run wall's open column is recorded `run_end_left` /
`run_end_right`, kind `run_end`, so no reader of the record thinks a corner was
found there.

Refusals stay refusals by name: where the ONE corner cannot be read,
`source_box` returns and the warp refuses `meshwarp.landmark_unreadable`,
saying the run's metres and which side the corner should have been on.

## The four, warped

    facing           candidate   x scale   y scale   corner ask   revealed
    platform/N       ab082589    1.071     1.075     -15.7 px     0.31 %
    platform/S       614418d6    1.169     1.009      -8.3 px     2.75 %
    platform_far/N   de93168c    0.996     1.097     +28.7 px     2.51 %
    platform_far/S   0fa71f22    1.067     1.062     -74.7 px     0.07 %

All four monotone, `folded_px` 0, `max_residual_px` 0.0, one x segment and one
y segment each (these walls carry no plan aperture). The x scale is the whole
of the correction and it is `ppm_declared / ppm_painted` exactly, which is what
a run wall's span ratio can only be.

## Undone

* The horizon fit itself is untouched. A run wall still lands as
  `unfitted-horizon` / `suspect-painting` and reaches the warp through the hold
  route. Teaching `measure.py` to fit ONE ramp and read the other side as
  horizontal would let these frames pass the camera on their own terms; nothing
  here needs it, because the warp's convergence is the declared one either way.
* No new guard on the single corner. `corner_ask_px` is RECORDED (-74.7 px is
  the worst of the four, 0.37 m) and nothing refuses on it. The old
  `CORNER_SPAN_RATIO` guard still fires, but on a run wall it is a test of the
  ruled scale and not of a corner disagreement, and it now says so.
* `test_row40_supersede` has two failures on this branch. They are on `main`
  too, with `mesh_warp.py`/`row35_snap.py` checked out from `main` — pre-existing
  and nothing to do with run walls.
