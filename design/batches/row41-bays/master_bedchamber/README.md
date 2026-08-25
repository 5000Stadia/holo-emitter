# Row 41 — master_bedchamber, laid out as fitted bays

**Rendered from commit `236c1262627a`.** The capture script is committed beside these frames (`design/plan-draft/measured/row41_batch.py`) and the layout itself is `row41_bays.py` — an artifact nobody can regenerate is not derived, it is just a file.

## What to look at first

The `seam-*.png` pairs, and in each one the **corner**: there is a whole stile in the angle and a completed bay on each side of it. `seam-*-row36.png` is the same corner as row 36 built it — a panel cut by the corner and a mirror fold in the middle of the wall.

## The layout, per wall

Deterministic from the wall's own width and the material's bay module: `n = max(1, floor(W/m + 0.5))`, bay width `W/n` **exactly**, a stile in every boundary including both corners. An opening takes whole bays; the snap column is how far each edge of it moved to get there, and the hole is then cut between the STILES so a corner bay's opening does not take the corner stile with it.

| wall | W (m) | module m | bays n | bay width (m) | stile (m) | openings, and how far each snapped |
|---|---|---|---|---|---|---|
| N | 8.800 | 0.80 | 11 | 0.8000 | 0.110 | hearth bays 1-3, -0.100 / +0.300 m (0.400 m total); door bays 4-5, -0.200 / +0.400 m (0.600 m total) |
| E | 7.600 | 0.80 | 9 | 0.8444 | 0.110 | window bays 2-2, +0.289 / -0.067 m (0.356 m total); window bays 6-6, +0.167 / -0.189 m (0.356 m total) |
| S | 8.800 | 0.80 | 11 | 0.8000 | 0.110 | window bays 3-4, +0.000 / +0.100 m (0.100 m total); window bays 7-8, -0.300 / -0.200 m (0.500 m total) |
| W | 7.600 | 0.80 | 9 | 0.8444 | 0.110 | window bays 4-5, -0.322 / -0.133 m (0.456 m total) |

## Where the pieces came from

HARVESTED: the wood face and the three horizontal members (plinth, chair rail, cornice), each cut at a RULED height off this room's own promoted painting, de-lit by row 36's own `delight`. DRAWN: every member's SHAPE and position, from the bay layout — there is no stile in any painting at the metre a fitted layout puts one.

- **frame**: `declared`
- **material of record**: `wall/oak-wainscot-with-hangings`, field `wall/hangings-tapestry`

## The corner check

`row36_crossfacing.py --room master_bedchamber --bays` runs this as a gate. For every corner, the bay boundary nearest that corner on each of the two walls must lie AT it, within one stile width.

```
E|N      left   this E gap 0.000000 m   next N gap 0.000000 m   bar 0.110 m   PASS
E|S      right  this E gap 0.000000 m   next S gap 0.000000 m   bar 0.110 m   PASS
N|W      left   this N gap 0.000000 m   next W gap 0.000000 m   bar 0.110 m   PASS
N|E      right  this N gap 0.000000 m   next E gap 0.000000 m   bar 0.110 m   PASS
S|E      left   this S gap 0.000000 m   next E gap 0.000000 m   bar 0.110 m   PASS
S|W      right  this S gap 0.000000 m   next W gap 0.000000 m   bar 0.110 m   PASS
W|S      left   this W gap 0.000000 m   next S gap 0.000000 m   bar 0.110 m   PASS
W|N      right  this W gap 0.000000 m   next N gap 0.000000 m   bar 0.110 m   PASS
```

## The honest labels

- **The WALLS are real**, cut from this room's own promoted paintings and de-lit by row 36's own `delight`. **The floors and ceilings are still V1 placeholder art** — their swatches have not returned — so nothing here is promotable and the frames carry `_promotable: false`.
- These are the **assembler's own frames**, not the scene canvas as the page draws it.
- `*-albedo.png` is the neutral piece as the library stores it. `*-lit.png` is the same frame under row 36's **minimal bake-time lighting stub**, which row 37 replaces. **Judge the architecture on the lit frames and the material on the albedo ones.**

## The turn, as arithmetic (unchanged from row 36)

```
room master_bedchamber
  floor    facings ENSW         outside the room by 0.000000 m
      N  x   0.607..  9.393   y   3.523..  8.180
      E  x   5.273..  9.316   y   0.603..  8.197
      S  x   0.607..  9.393   y   0.620..  5.277
      W  x   0.684..  4.727   y   0.603..  8.197
  ceiling  facings ENSW         outside the room by 0.000000 m
      N  x   0.607..  9.393   y   4.197..  8.004
      E  x   5.947..  9.316   y   0.602..  8.198
      S  x   0.607..  9.393   y   0.796..  4.603
      W  x   0.684..  4.053   y   0.602..  8.198
  the same wall, seen twice:
    master_bedchamber/N left  is the wall of master_bedchamber/W  return u [25.221, 26.483]  wall u [25.236, 32.764]  overlap 1.247 m
    master_bedchamber/N right is the wall of master_bedchamber/E  return u [15.178, 16.379]  wall u [8.836, 16.364]  overlap 1.186 m
    master_bedchamber/E left  is the wall of master_bedchamber/N  return u [7.267, 8.773]  wall u [0.043, 8.757]  overlap 1.490 m
    master_bedchamber/E right is the wall of master_bedchamber/S  return u [16.427, 17.88]  wall u [16.443, 25.157]  overlap 1.437 m
    master_bedchamber/S left  is the wall of master_bedchamber/E  return u [15.117, 16.379]  wall u [8.836, 16.364]  overlap 1.247 m
    master_bedchamber/S right is the wall of master_bedchamber/W  return u [25.221, 26.422]  wall u [25.236, 32.764]  overlap 1.186 m
    master_bedchamber/W left  is the wall of master_bedchamber/S  return u [16.427, 17.933]  wall u [16.443, 25.157]  overlap 1.490 m
    master_bedchamber/W right is the wall of master_bedchamber/N  return u [7.32, 8.773]  wall u [0.043, 8.757]  overlap 1.437 m
```
