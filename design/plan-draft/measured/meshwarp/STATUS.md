# mesh_warp — status at the builder's cap (2026-08-28)

`design/plan-draft/measured/mesh_warp.py`, `plan_apertures.mjs`,
`test_mesh_warp.py`. Nothing is promoted; the store and `run-state.json` are
untouched. `--sweep-held` writes only into this directory.

## What it does

Landmarks off the painting (four room corners and the floor/ceiling line
endpoints via `row35_snap.source_box` + `map_points`; every door rect from
`door_measure.measure_openings`; every window rect from
`window_measure.measure_windows`) are paired by kind and nearest centre to
targets off the plan at the declared camera (`corner_x0/x1_px`,
`floor_line_y`, the ruled ceiling, and the door/window rects projected by
`tools/plan-projection.mjs` through `plan_apertures.mjs`). A thin-plate spline
through those pins is evaluated target-to-source over the whole declared frame
and resampled; over-reach folds into a mirrored 24 px band and is counted.

Two refusals only: `meshwarp.landmark_unreadable` and
`meshwarp.aperture_count`. Stretch and reveal are REPORTED, never refused on.

## Measured, this corpus

* 11 of 24 held walls warp. 13 refuse: 5 open facings with no storey (no
  ceiling line to pin), 2 with unreadable anchors, 1 whose corner reading is
  0.09x the declared span, 5 content misses (a door or window the plan rules
  and the painting does not show).
* Synthetic A (whole room 15 % too large — the manor's real failure, 114 of
  122): corners 0.71 px, door 1.0 px, max stretch 0.870, no fold.
* Synthetic B (room right, door 15 % too large and 60 px off): corners 0.00 px,
  door 0.00 px, median stretch 1.016, max 3.461, no fold.
* TPS against MLS-similarity on synthetic B: door 0 px vs 16 px, max stretch
  3.46 vs 24.9. TPS is the default for that reason.

## The open defect, seen with my own eyes

On `closet_chamber-S.png` and `garden_room-S.png` the door lands where the plan
rules it and the flat wall, dado and floor read straight and undistorted — but
THE DOOR'S LEFT JAMB IS VISIBLY BOWED. The correction is ~150 px of sideways
motion and the spline spends it partly on the moulding itself, curving a line
that must be straight. `garden_room/S` bows its cornice the same way.

The fix is not more smoothing: it is to hold the jamb STRAIGHT by pinning it as
a segment (raise `APERTURE_EDGE_SAMPLES`, currently 2, along the vertical sides
only) so the bend is pushed out into the flat wall field where nothing is
straight to begin with. Untried — the builder hit its turn cap here.

`great_stair_hall/W` and `stair_landing/W` warp with max stretch 35934 and 4.98
because their painted window is ~2.3x narrower than the plan rules it; the
`folded_px` field in each record names how much of that is an actual fold.
