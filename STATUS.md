# Row 43 — the traced polygon IS the aperture, end to end

One change in four places, all of it behind one field: `meta.openings[i].polygon_used`.

## The meta shape

`tools/promote-backdrop.mjs` runs `aperture_trace.py` on every MEASURED door,
with `door_measure`'s rectangle as the prior and this wall's own
`floor_line_y × image_h_px` as the threshold, and writes onto the opening:

    { id, kind, via, x, y, w, h, beyond_m, beyond_offset_m, measured,
      polygon: [[x, y], ...256],      // image px, closed by construction
      corners: [[x, y] × 4],          // tl, tr, br, bl
      head_kind: "straight" | "arched",
      trace_confidence: 0.0…1.0,      // the trace's own wall_confidence
      polygon_used: true | false }

`x/y/w/h` are the POLYGON'S BOUNDING BOX where it is used and the measured
rectangle where it is not. Below `TRACE_MIN_CONFIDENCE` (0.5) the loop is
recorded and not used — `polygon_used: false` — because a wall whose door the
old instrument reads perfectly well is not a wall to refuse. A projected
(unmeasured) opening is not traced at all. Where the tracer cannot run
(no numpy/Pillow) the promotion says so on stderr and ships the rectangle.

## The warp

`mesh_warp.measured_apertures` now traces every door it measures and carries the
reading on the rectangle as `trace`; `aperture_pins` takes the four TRACED
corners as its source pins in place of the void box's, and the plan's rectangle
is still the target. An arched head lays `APERTURE_HEAD_SAMPLES` (5) extra pins:
each head sample's target is the plan's straight head LIFTED BY THAT SAMPLE'S
OWN RISE, so the arc arrives with its shape intact and its chord where the plan
puts it, and the rise rides on the pin as `residual_px` (the sagitta at the
crown). The plan draws no arch; the warp does not erase one.

## The page

* `groundplane.aperturePoly(opening)` — the one home of "does the polygon
  govern". `openingFor` already returned the whole record, so the polygon
  travels beside `x/y/w/h` and no rectangle reader notices.
* `renderer.apertures()` carries `poly` (the hole's shape) and sets `polys` (the
  hit region) to `[poly]` where a flight's own rings do not already win, so
  `apertureHolds`'s point-in-polygon test and the halo outline both move onto
  the loop.
* The through-view clips with `apertureClipPath` — `ctx.clip()` on the traced
  path, `ctx.rect` where there is none.
* The leaf sprite still fits the bounding box, which is now the aperture's.

## The two re-promotions (temp copy of the store, re-run byte-identical)

    buttery_pantry/S  op15    w 166 → 215 (+49)   x 247 → 243   conf 0.69  straight
    noodle_bar/E      door01  h 434 → 455 (+21)   w 205 → 212   conf 0.96  straight
                              x 666 → 662

No other meta field moved on either wall. `buttery_pantry/S` is the 50 px case
the trace file names: the void's dark run stopped 49 px short of the reveal, and
that width was clickable wall.

## Cases

`test_mesh_warp.py` — `test_the_traced_corners_are_the_source_pins` (8 checks:
the fallback, the traced corners, the unchanged targets, the arch's five pins,
their residuals, that none of them flattens the arch, and that a trace below the
floor leaves the box pinned).
`doors.spec.mjs` — the page's `go` target is the polygon: a point inside the
bounding box and outside the loop is wall, to the resolver AND to a real click.
`throughview.spec.mjs` — three cases: the doctored polygon's box IS the
rectangle, the far room fills that box without one, and with one it stops at the
loop and changes nothing inside it.

## Open

* `buttery_pantry/S` cannot be re-promoted through today's row-40 material
  clause — its ask predates the `service` voice and `material_legacy.json` is
  empty. The temp-store run above admitted it by writing the ledger line
  `--seal-legacy` would have written for it. That is a fact about the corpus,
  not about this row; the wall needs re-asking.
* No wall in the store traces an ARCHED head today (both re-promotions read
  `straight`), so the arch path is covered by construction in
  `test_mesh_warp.py` and by no painting yet.
* The store itself is untouched: nothing under `backdrops/` was written.
