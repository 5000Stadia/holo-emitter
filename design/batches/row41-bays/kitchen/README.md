# Row 41 — kitchen, laid out as fitted bays

**Rendered from commit `236c1262627a`.** The capture script is committed beside these frames (`design/plan-draft/measured/row41_batch.py`) and the layout itself is `row41_bays.py` — an artifact nobody can regenerate is not derived, it is just a file.

## What to look at first

The `seam-*.png` pairs, and in each one the **corner**: there is a whole stile in the angle and a completed bay on each side of it. `seam-*-row36.png` is the same corner as row 36 built it — a panel cut by the corner and a mirror fold in the middle of the wall.

## The layout, per wall

Deterministic from the wall's own width and the material's bay module: `n = max(1, floor(W/m + 0.5))`, bay width `W/n` **exactly**, a stile in every boundary including both corners. An opening takes whole bays; the snap column is how far each edge of it moved to get there, and the hole is then cut between the STILES so a corner bay's opening does not take the corner stile with it.

| wall | W (m) | module m | bays n | bay width (m) | stile (m) | openings, and how far each snapped |
|---|---|---|---|---|---|---|
| N | 8.000 | 0.80 | 10 | 0.8000 | 0.110 | door bays 1-2, -0.200 / +0.400 m (0.600 m total) |
| E | 8.650 | 0.80 | 11 | 0.7864 | 0.110 | window bays 3-4, -0.041 / +0.032 m (0.073 m total); window bays 9-10, -0.323 / +0.000 m (0.323 m total) |
| S | 8.000 | 0.80 | 10 | 0.8000 | 0.110 | hearth bays 3-6, -0.100 / +0.100 m (0.200 m total); **window at 4.00-5.50 m REFUSED** — its bays are already taken -- a door outranks a hearth outranks a window, and within a kind the wider opening wins |
| W | 8.650 | 0.80 | 11 | 0.7864 | 0.110 | window bays 2-2, +0.323 / -0.391 m (0.714 m total); door bays 5-6, -0.318 / +0.255 m (0.573 m total); **window at 3.75-5.25 m REFUSED** — its bays are already taken -- a door outranks a hearth outranks a window, and within a kind the wider opening wins |

## Where the pieces came from

HARVESTED: the wood face and the three horizontal members (plinth, chair rail, cornice), each cut at a RULED height off this room's own promoted painting, de-lit by row 36's own `delight`. DRAWN: every member's SHAPE and position, from the bay layout — there is no stile in any painting at the metre a fitted layout puts one.

- **frame**: `measured` — the material record declares none, so the frame was proved off the painting itself: a chair rail at the ruled 0.95 m (3.3 sd) and 4 grooves at 0.718 m mean spacing (`kitchen/W`)
- **material of record**: `wall/plain-limewash-to-floor` — **and that name is wrong, which row 41 records rather than fixes.** The material this room is bound to declares no joinery; its own promoted paintings measurably carry a chair rail and periodic panel joints. The binding lives in `tools/room-voices.mjs` and belongs to the voice table and to row 40's room-consistency work, not here; row 41 lays the wall out as what its pixels are and says so.

## The corner check

`row36_crossfacing.py --room kitchen --bays` runs this as a gate. For every corner, the bay boundary nearest that corner on each of the two walls must lie AT it, within one stile width.

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
room kitchen
  floor    facings ENSW         outside the room by 0.000000 m
      N  x  31.004.. 38.996   y   5.233..  9.008
      E  x  35.473.. 39.000   y   0.613..  9.237
      S  x  31.004.. 38.996   y   0.842..  4.617
      W  x  31.000.. 34.527   y   0.613..  9.237
  ceiling  facings ENSW         outside the room by 0.000000 m
      N  x  31.002.. 38.998   y   5.907..  9.077
      E  x  36.147.. 38.954   y   0.630..  9.220
      S  x  31.002.. 38.998   y   0.773..  3.943
      W  x  31.046.. 33.853   y   0.630..  9.220
  the same wall, seen twice:
    kitchen/N      left  is the wall of kitchen/W       return u [24.659, 25.807]  wall u [24.662, 33.287]  overlap 1.144 m
    kitchen/N      right is the wall of kitchen/E       return u [15.549, 16.641]  wall u [8.012, 16.637]  overlap 1.088 m
    kitchen/E      left  is the wall of kitchen/N       return u [7.767, 7.953]  wall u [0.045, 7.955]  overlap 0.186 m
    kitchen/E      right is the wall of kitchen/S       return u [16.697, 16.823]  wall u [16.695, 24.605]  overlap 0.125 m
    kitchen/S      left  is the wall of kitchen/E       return u [15.493, 16.641]  wall u [8.012, 16.637]  overlap 1.144 m
    kitchen/S      right is the wall of kitchen/W       return u [24.659, 25.751]  wall u [24.662, 33.287]  overlap 1.088 m
    kitchen/W      left  is the wall of kitchen/S       return u [16.697, 16.883]  wall u [16.695, 24.605]  overlap 0.186 m
    kitchen/W      right is the wall of kitchen/N       return u [7.827, 7.953]  wall u [0.045, 7.955]  overlap 0.125 m
```
