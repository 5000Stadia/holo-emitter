# Row 40 — legacy room-consistency audit

[HUMAN, 2026-08-24, verbatim]: "Still getting rooms with wall/ceiling mismatches" — "Mismatches as in different from other walls".

Rows 36 and 38 cure this by construction for walls painted from here on. The 57 already-promoted paintings were rolled independently and had never been measured against each other. This is that measurement — deterministic, no model in the loop: `design/plan-draft/measured/room_consistency.py`, report in `design/plan-draft/measured/room_consistency.json`.

Each facing's own meta places its ceiling and floor lines; the columns strictly inside the two corners are ceiling above the ceiling line and floor below the floor line, so four bands cut out with no perspective bookkeeping. Per band the facings are compared on mean Lab (dE76), a coarse 4x4x4 Lab histogram (half-L1) and Sobel texture energy normalised to 150 px/m. D = dE/5 + hist/0.25 + |log2 texture ratio|, so D ~ 1 is one noticeable step. A room scores its WORST pairwise D over its worst band. **Cut: D > 3.75** (calibrated below).

## Rooms, worst first

| # | room | facings | worst band | D | worst pair | brightness x | colour | spread | contrast x | outlier | verdict |
|---|------|---------|-----------|---|-----------|------------|--------|--------|------------|---------|---------|
| 1 | guest_chamber | ENSW | wall_upper | **8.96** | S-W | x4.33 | 1.095 | 1.000 | x3.36 | SW | mismatched |
| 2 | garden_room | ENW | wall_upper | **6.21** | N-W | x1.18 | 0.341 | 0.271 | x4.87 | W | mismatched |
| 3 | master_bedchamber | ENSW | ceiling | **4.47** | N-W | x9.90 | 0.190 | 0.631 | x3.26 | **all** (EW/NS) | mismatched |
| 4 | servants_hall | ENSW | ceiling | **3.90** | N-S | x59.52 | 0.238 | 1.000 | x2.65 | N | mismatched |
| 5 | closet_chamber | ENW | wall_upper | **3.86** | E-W | x1.40 | 0.421 | 1.000 | x1.95 | W | mismatched |
| 6 | long_gallery | ENS | floor | **3.62** | E-S | x5.51 | 0.495 | 0.845 | x1.24 | — | consistent |
| 7 | dining_parlour | ENSW | ceiling | **3.28** | N-W | x10.51 | 0.448 | 0.558 | x1.22 | — | consistent |
| 8 | kitchen | ESW | ceiling | **2.87** | S-W | x1.29 | 0.380 | 0.333 | x1.30 | — | consistent-incomplete |
| 9 | solar | ENSW | wall_lower | **2.68** | N-W | x1.29 | 0.185 | 0.533 | x1.91 | — | consistent |
| 10 | stair_landing | EN | ceiling | **2.12** | E-N | x1.46 | 0.142 | 0.460 | x1.68 | — | consistent |
| 11 | buttery_pantry | ENSW | ceiling | **2.07** | S-W | x1.18 | 0.057 | 0.154 | x1.75 | — | consistent-incomplete |
| 12 | library | EN | ceiling | **1.94** | E-N | x4.55 | 0.271 | 0.667 | x1.03 | — | consistent-incomplete |
| 13 | back_stair_head | NS | wall_upper | **1.72** | N-S | x1.20 | 0.158 | 0.678 | x1.43 | — | consistent-incomplete |
| 14 | back_stair | NW | wall_upper | **1.68** | N-W | x1.94 | 0.062 | 0.597 | x1.57 | — | consistent-incomplete |
| 15 | study | NW | wall_upper | **1.68** | N-W | x1.01 | 0.148 | 0.331 | x1.43 | — | consistent |
| 16 | muniment_room | EW | wall_lower | **1.17** | E-W | x1.06 | 0.109 | 0.242 | x1.27 | — | consistent-incomplete |

## Not comparable

| room | why |
|------|-----|
| entrance_approach | 0 promoted facing(s) with usable geometry — nothing to compare against |
| great_stair_hall | 1 promoted facing(s) with usable geometry — nothing to compare against |
| privy_garden | 0 promoted facing(s) with usable geometry — nothing to compare against |

## Facings the instrument could not read

Reported, never skipped — production law leaves no gate that cannot fail.

| facing | facing_type | missing | why |
|--------|-------------|---------|-----|
| entrance_approach/E | open | storey_height_m, corner_x0_px, corner_x1_px | meta declares no storey_height_m, corner_x0_px, corner_x1_px, so the ceiling/floor lines and the facing-wall columns cannot be placed |
| entrance_approach/S | open | storey_height_m, corner_x0_px, corner_x1_px | meta declares no storey_height_m, corner_x0_px, corner_x1_px, so the ceiling/floor lines and the facing-wall columns cannot be placed |
| entrance_approach/W | open | storey_height_m, corner_x0_px, corner_x1_px | meta declares no storey_height_m, corner_x0_px, corner_x1_px, so the ceiling/floor lines and the facing-wall columns cannot be placed |
| library/W | enclosed | — | no band survived the frame: ceiling band gave 3 tiles of 0.30 m (needs 8) - too little material to describe; wall_upper band gave 4 tiles of 0.30 m (needs 8) - too little material to describe; wall_lower band gave 4 tiles of 0.30 m (needs 8) - too little material to describe; floor band gave 3 tiles of 0.30 m (needs 8) - too little material to describe |
| muniment_room/N | enclosed | — | no band survived the frame: ceiling band gave 1 tiles of 0.30 m (needs 8) - too little material to describe; wall_upper band gave 4 tiles of 0.30 m (needs 8) - too little material to describe; wall_lower band gave 4 tiles of 0.30 m (needs 8) - too little material to describe; floor band gave 1 tiles of 0.30 m (needs 8) - too little material to describe |
| muniment_room/S | enclosed | — | no band survived the frame: ceiling band gave 0 tiles of 0.30 m (needs 8) - too little material to describe; wall_upper band gave 0 tiles of 0.30 m (needs 8) - too little material to describe; wall_lower band gave 0 tiles of 0.30 m (needs 8) - too little material to describe; floor band gave 0 tiles of 0.30 m (needs 8) - too little material to describe |
| privy_garden/N | enclosed | storey_height_m | meta declares no storey_height_m, so the ceiling/floor lines and the facing-wall columns cannot be placed |
| privy_garden/S | enclosed | storey_height_m | meta declares no storey_height_m, so the ceiling/floor lines and the facing-wall columns cannot be placed |

## The distribution the cut was read off

Every (room, band) spread in the store, worst first:

```
  8.96  guest_chamber        wall_upper
  6.21  garden_room          wall_upper
  4.47  master_bedchamber    ceiling
  4.22  master_bedchamber    wall_upper
  3.90  servants_hall        ceiling
  3.89  servants_hall        wall_lower
  3.86  closet_chamber       wall_upper
  3.85  garden_room          wall_lower
  3.69  closet_chamber       wall_lower
  3.62  long_gallery         floor
  3.36  servants_hall        wall_upper
  3.28  dining_parlour       ceiling
  3.02  master_bedchamber    wall_lower
  2.98  long_gallery         wall_upper
  2.87  kitchen              ceiling
  2.73  closet_chamber       floor
  2.68  solar                wall_lower
  2.67  long_gallery         wall_lower
  2.55  dining_parlour       wall_lower
  2.53  servants_hall        floor
  2.53  closet_chamber       ceiling
  2.46  solar                wall_upper
  2.42  garden_room          ceiling
  2.17  master_bedchamber    floor
  2.12  stair_landing        ceiling
  2.07  buttery_pantry       ceiling
  2.06  guest_chamber        ceiling
  2.04  buttery_pantry       wall_lower
  2.00  buttery_pantry       floor
  1.94  library              ceiling
  1.80  stair_landing        wall_upper
  1.76  long_gallery         ceiling
  1.75  dining_parlour       floor
  1.72  back_stair_head      wall_upper
  1.68  back_stair           wall_upper
  1.68  study                wall_upper
  1.66  guest_chamber        floor
  1.62  guest_chamber        wall_lower
  1.59  solar                floor
  1.57  solar                ceiling
  1.48  kitchen              wall_upper
  1.47  kitchen              floor
  1.46  study                floor
  1.44  back_stair           wall_lower
  1.43  dining_parlour       wall_upper
  1.37  library              wall_upper
  1.21  stair_landing        floor
  1.17  muniment_room        wall_lower
  1.12  garden_room          floor
  1.12  buttery_pantry       wall_upper
  1.07  kitchen              wall_lower
  0.99  stair_landing        wall_lower
  0.81  muniment_room        wall_upper
  0.81  library              wall_lower
  0.57  library              floor
  0.53  study                wall_lower
  0.41  back_stair_head      wall_lower
  0.23  study                ceiling
```


