# Row 43 — the far room's floor runs to the threshold

## The rule

Through an opening, the far room's frame is placed by one scale
`k = dDest / (dHere + beyond_m)` with the two horizons coincident, so its bottom
row lands at `dy + dh` — on `noodle_bar/E` that is row 736 while the doorway's
own foot is row 774. Row 25 filled those 38 rows with one number, the mean of
the far frame's bottom band, and a flat slab laid exactly where two floors are
supposed to meet is the grey divider the Captain saw. It is floor, and where a
floor is is something the pinhole already knows: each composite row `y` in the
strip draws a floor point `focalPx(meta) / scaleAtY(y, meta)` from THIS camera;
the far camera stands `D − dDest` in front of this one (the same `D` that `k`
comes from), so the same point is `depth_here − (D − dDest)` from it, and the
row that depth draws at in the far frame is `yAtScale(fDest / depth_far,
destMeta)`. Sample the far frame's floor there, take columns through the same
`dx`/`k` the frame itself was placed by, and the strip becomes the far room's own
floor arriving at the doorway. The side strips take the far frame's own outer
band continued outward at each row — its floor line arriving at the floor line,
its ceiling junction at the ceiling junction — and the two LOWER corners are the
strip's row carried on out through that band, so each corner agrees with both
edges it joins. The upper corners keep row 25's colour reading: this transform
carries no ceiling height, so above the far frame there is no depth to run a row
back along.

**The clamp is the geometry, not a fallback.** A strip exists at all only when
`k·(H − horizon) < ty − horizon`. Run that condition through the depth
conversion and it says the strip's own floor is always nearer to the far camera
than the far frame's nearest floor row, unless the far WALL were nearer than
that row — impossible. So whenever there is a strip to fill, the floor it wants
is floor no camera in the document photographed, and the honest continuation is
the far frame's LAST floor row carried along its recession, column by column, as
`mesh_warp.py` fills a reveal. What is claimed is the far floor's colour AT EACH
COLUMN, which the far painting holds; what is not claimed is detail nobody drew.

Pure in world + staging + meta (§12.2): every term is read off the two metas and
the measured opening. No randomness, no sampling of the composite.

## What changed

- `src/renderer.js` — `throughFloorMap(meta, destMeta, aperture)` (exported for
  the row's case) and the fill inside `drawThroughOpening`: four of row 25's
  eight `bandMean` rectangles replaced.
- `tests/playwright/throughview.spec.mjs` — new, six cases.
- `tests/playwright/guards.spec.mjs` — `renderer.through_view_corners` moved to
  the two call sites the corners now live at.
- `design/batches/throughview/` — `capture.mjs` and its before/after pictures.

## What I saw

`?world=cyberpunk-2`, `noodle_bar` facing E. Before: 37 strip rows each holding
**one** colour, luminance spread 0 — a flat light-grey slab with a hard
horizontal edge across the bottom of the doorway, plainly a divider at 1x.
After: 37 rows each holding **95** colours, spread 42.9 — the far room's own
diamond-plate floor, tone-matched to the floor above it, running down to the
doorway's foot. The divider is gone. Honestly: the far floor reads continuous in
tone and column rhythm, but because the source is one row repeated, the plate's
dots stop and the last 37 rows read as fine vertical combing on close
inspection. That is the ceiling of what the corpus can say — no camera
photographed that floor — and the structural cure (a destination view derived at
the OPENING's axis) is still `design/architecture.md`'s, not this row's.

## Tests

- `throughview.spec.mjs` — 6 passed.
- `walkthrough` + `nav-walkthrough` + `doors` — 59 passed.
- `guards.spec.mjs` — all six `renderer.through_view*` ledger cases pass. Six
  other guards cases fail (`door.painted_overlap`, `window.unpainted`,
  `window.painted_width`, "a window reading that agrees with the drawing
  promotes clean", and the two ledger-grammar cases) — **verified pre-existing**
  by stashing this row's diff and re-running them on the untouched tree.

## Not done

The bottom-strip floor fill has no ledger clause of its own; it is guarded by
`throughview.spec.mjs`'s "not a constant" case, which goes red if the block is
deleted. A `renderer.through_view_floor` token would be the tidier home for it.
