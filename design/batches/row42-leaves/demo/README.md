# Row 42 (3) — a leaf and a casement, in the frames the paintings drew

Reproduce every image here with `node design/batches/row42-leaves/demo/capture.mjs`.
Nothing was retouched and nothing was posed: the script walks the manor from its
boot standpoint by real exits, faces the wall, and toggles one entity.

## The sprites are REAL now, and what that changed

These captures were first taken with procedural placeholder art. Both painter
asks have been answered and both returns are ingested — `library/door-leaf-plank-oak-v1/`
and `library/casement-leaded-v1/`, written by `python3 -m replicator.ingest`,
promoted in `library/promoted.json`, baked for the page by
`tools/bake-library.mjs`. The **closed** state of each picture below is that
sprite; the geometry is unchanged, because the geometry was never the sprite's.

| | placeholder | ingested |
|---|---|---|
| leaf | 180 × 400 procedural, `light: "UL45"` | **171 × 384**, `light: "neutral"` |
| casement | 280 × 220 procedural | **481 × 384**, `light: "neutral"` |

`neutral` is row 37's rule [HUMAN, 2026-08-24, verbatim: *"all panels meed to
have no light source and there should be a light lighting shader over the top
regarding light sources"*], which both asks carry: the leaf is lit by the scene
it is placed in, so no key ramp is multiplied over it.

**The OPEN state of each is still the placeholder's**, and that is the ask's own
ruling rather than a shortcut: *"Second state is a follow-up ask and NOT part of
this one: the placeholder's own open state ships until then."* The replicator
agrees from the other side — it refuses to declare a state it has no second
generation for, and its registration gate derives the open state's origin by
correlating a datum present in BOTH sources, so an open state manufactured from
the closed one would be a typed number wearing a certificate. It is named on the
merged record as `provenance.residual_placeholder`, and it is what the grey
sliver in `*-open.png` is. The next roll of each ask is what replaces it.

## The door — `op22`, the solar to the muniment room

Both sides of this doorway are promoted, and both measured it off their own
paintings, so ONE leaf is fitted to TWO different painted rectangles:

| facing | painted rectangle | the plan would have put the leaf | leaf drawn |
|---|---|---|---|
| `solar/E` | 975, 382 · **139 × 261** | 1056.2, 451.4 · 86.2 × 261 | fills the painted one |
| `muniment_room/W` | 592, 276 · **218 × 533** | 536.1, 303.7 · 227.4 × 533 | fills the painted one |

The two rooms drew the same doorway 139 px and 218 px across because they stand
at different distances from it. That is the row's whole sentence: a leaf is not
drawn at a size, it is drawn **in a hole**, and the painting says where the hole
is.

| file | what it shows |
|---|---|
| `door-solar-E-closed.png` | the leaf fills the painted doorway; the muniment room does not show through it |
| `door-solar-E-open.png` | the leaf swung to its hinge side, a sliver at the viewer-left of the same frame, the room beyond visible past it |
| `door-muniment_room-W-*.png` | the same two states of the same leaf, from the other room |
| `*-page.png` | the same states as a visitor sees the whole page |

The second doorway on `solar/E` — `op23`, to the back stair head — carries no
leaf, and it is in the picture as what it is: an unfilled opening with the next
room showing through. One wall, both kinds, side by side.

## The casement — `win10`, the kitchen's east light

**Captured from a throwaway tree, and this is why.** `promote-backdrop.mjs`
writes `meta.windows` only where the measurement carries a window reading, and
no measurement taken before row 42 has one — `design/plan-draft/measured/window_calibration.json`
is the list of the 33 walls the clause cannot yet see. The seat that built part
(3) does not write to `backdrops/`, so `capture.mjs` stages a copy of the tree
and runs the real pipeline on it, in order:

```
kitchen/E: 1 glazed opening(s), off backdrops/source/kitchen-E/row23-94a463ee.png
    x  868..1101 (1.33 m, 233 px)  y 394..586  light 169.8 against a 26.4 wall,
    lattice 0.493 (x 0.308 y 0.678, pitch 0.063/0.114 m), confidence 0.91

promoted kitchen/E: backdrops/source/kitchen-E/row23-94a463ee.png -> backdrops/kitchen/E.png
meta.windows = [{"id":"win10","kind":"window","x":868,"y":394,"w":233,"h":192,
                 "sill_m":0.9,"head_m":2,"measured":true}]
```

Every number in those two pictures is measured off the kitchen's own painting.
The only thing that happened somewhere else is the write.

| file | what it shows |
|---|---|
| `casement-kitchen-E-closed.png` | the leaded casement fitted to the measured light, its quarries over the painting's own glass |
| `casement-kitchen-E-open.png` | swung to its hinge side; the glass it uncovered is darkened, and no outside view is invented |

On the committed tree the same page draws **no casement at all** on that wall,
which is the row's stated edge rather than a defect: a casement placed from the
plan onto paint nobody has measured is exactly the sprite-on-blank-wall the
promotion's own `window.unpainted` clause refuses, so the renderer refuses it
too. The document holds the entity; the picture waits for the measurement.

## What the page said, walking it

- solar/E, open → closed: *"You pull the plank door to. The iron ring settles
  against the boards and the room beyond is shut away."*
- kitchen/E, closed → open: *"The leaded casement swings inward and the kitchen
  takes a breath of outside air."*
- no console errors on any of the three walks.

## The survey that picked this doorway, and the four walls it flagged

Every measured door rectangle in the store, against the dark run its own
painting draws through the middle of that rectangle's height:

| wall | measured w | painted run | ratio |
|---|---|---|---|
| 23 of the 27 | — | — | **0.94–1.02** |
| `great_hall/S` op01 | 80 px | 123 px | **0.65** |
| `buttery_pantry/S` op15 | 166 px | 85 px | **1.95** |
| `dining_parlour/N` op06 | 87 px | 52 px | **1.67** |
| `privy_garden/S` op10 | 88 px | 73 px | **1.21** |

`op22` is one of the 23 that agree, which is why the demo stands there. The four
that do not are a ROW 27 reading to look at, not a part-(3) defect: this row
places the leaf in whatever rectangle the measurement gives it, and on
`great_hall/S` that rectangle is two thirds of the doorway the painter drew — so
the leaf is a plank standing inside a wider hole. The first capture of this demo
was taken there and shows exactly that; it is recorded here rather than kept,
because a demo of the mechanism should not be a picture of an upstream miss.
The instrument is `design/plan-draft/measured/door_measure.py`; the four walls
above are the list to re-read.
