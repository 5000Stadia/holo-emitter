# Row 27 — the aperture on the painted door

The Captain, walking the painted manor on 2026-08-24: **"library door doesnt match up"**,
**"Multiple doors dont match up."**

## What the pictures show

`before/` and `after/` hold the same ten frames, captured to §12.6's spec (the scene canvas
alone, 1536×1024, cold `file://` load, no chrome, no hover), reached by real intents walked out
of `world.json`'s own exits. Each frame comes in two files:

- `<loc>-<F>.png` — what a player sees.
- `<loc>-<F>-aperture.png` — the same frame with the page's own `go` rectangles outlined in red,
  taken from `HOLO_APP.apertureList()`.

The outline is not only a click target. On a painted facing the renderer composites the
**destination room** into that rectangle (`drawThroughOpening`), so where it sits is paint. In
`before/library-E-aperture.png` the great hall's grid is pasted onto solid oak panelling half a
metre to the left of the door the picture draws; in `after/library-E-aperture.png` it fills the
door. That gap is 0.513 m of wall — the whole of the Captain's sentence, measured.

| frame | before | after |
| --- | --- | --- |
| `library/E` | plan rect `892,403 173×295` | measured `947,294 169×404` — 0.513 m across |
| `muniment_room/W` | `524,304 251×505` | `592,276 218×533` — 0.235 m |
| `solar/E` | `432,451` and `1039,451` | `408,382` and `975,382` |
| `solar/W` | `401,451 114×194` | `420,382 157×263` |
| `dining_parlour/E` | `673,409 160×312` | `715,376 92×345` |
| `back_stair/W`, `buttery_pantry/N`, `buttery_pantry/S` | plan rects | measured |
| `library/S`, `great_hall/W` | painted, door projected | **demoted to grid** |

The last row is the honest half. `library/S` paints a doorway with a lit room behind it and
`great_hall/W` paints two doors 93 px wide at 9.3 m of wall; neither survives the instrument, so
neither is promotable, and both now render as the holodeck grid — which is what unestablished
space renders as and is true, where a painted wall with its door somewhere else is not. Their
reasons are in `design/batches/row23-scaffold/manor/run-state.json`.

## How to redraw them

    node design/batches/row27-doors/capture.mjs <outDir> [appRoot] [loc/F,loc/F,…]

`appRoot` defaults to this repository, so a frame can be redrawn from the build that drew it.
