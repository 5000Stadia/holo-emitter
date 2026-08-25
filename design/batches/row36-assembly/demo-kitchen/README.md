# Row 36 — kitchen assembled from established pieces

**Rendered from commit `09ad2563b12d`.** The capture script is committed beside these frames (`design/plan-draft/measured/row36_batch.py`) — an artifact nobody can regenerate is not derived, it is just a file.

## What to look at first

The `seam-*.png` pairs. Each one is the right edge of one facing butted to the left edge of the next, which are **the same physical wall seen from two standpoints**. Either the material continues across the join or it does not, and that is the whole of the row's claim.

`seam-*-promoted.png` is the same corner from the paintings the store holds today, so this is a before and after rather than an assertion.

## The honest labels

- **V1 PLACEHOLDER ART.** The floor and ceiling tiles are drawn from each material's own tiling spec, not painted, because their swatches are dispatched and have not returned. The geometry is real; the material is not. Nothing here is promotable and the frames carry `_promotable: false`.
- These are the **assembler's own frames**, not the scene canvas as the page draws it. The §12.6 capture comes when the swatches land and the pieces are promotable.
- `*-albedo.png` is the neutral piece as the library stores it. `*-lit.png` is the same frame under the **minimal bake-time lighting stub** — ambient plus a radial falloff per plan source. It is deliberately crude and row 37 replaces it. **Judge the architecture on the lit frames and the material on the albedo ones**; judging a neutral room for looking flat would be judging it for obeying row 37.

## The turn, as arithmetic

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
