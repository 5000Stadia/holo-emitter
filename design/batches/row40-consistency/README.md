# Row 40 — legacy room-consistency audit

[HUMAN, 2026-08-24, verbatim]: "Still getting rooms with wall/ceiling mismatches" — "Mismatches as in different from other walls".

Rows 36 and 38 cure this by construction for walls painted from here on. The 95 already-promoted paintings were rolled independently and had never been measured against each other. This is that measurement — deterministic, no model in the loop: `design/plan-draft/measured/room_consistency.py`, report in `design/plan-draft/measured/room_consistency.json`.

Each facing's own meta places its ceiling and floor lines; the columns strictly inside the two declared corners are ceiling above the one and floor below the other, so four bands - ceiling, upper wall, lower wall, floor - cut out with no perspective bookkeeping. Each band is resampled to 150 px/m, cut into 0.30 m tiles of WORLD, and described by the MEDIAN tile, so a window or a doorway cannot decide that a wall changed; the columns a carrier is declared on are dropped outright first.

Per band, two facings are compared on **colour** - distance in (log R/G, log B/G), where the exposure has already cancelled - and **contrast** - the ratio of median tile log-luma gradient. D is the length of that weighted pair (colour at 0.14 per step, contrast at 0.4 per doubling), so D ~ 1 is one plainly noticeable step. **Brightness and histogram spread are measured and printed but carry no weight**, which is not a preference: the sweep below found every configuration that weighted brightness scored worse than the same one with it at zero. A room scores its WORST pairwise D over its worst band. **Cut: D > 3.75.**

The outlier is chosen by CLUSTERING the room's facings on that band - two facings join when they agree within the cut - and not by distance from the room's median, because a room can split two against two and then the median is a place no facing stands. A room with no majority has every facing returned and is marked **all**.

## Rooms, worst first

| # | room | facings | worst band | D | worst pair | brightness x | colour | spread | contrast x | outlier | verdict |
|---|------|---------|-----------|---|-----------|------------|--------|--------|------------|---------|---------|
| 1 | guest_chamber | ENSW | wall_upper | **8.96** | S-W | x4.33 | 1.095 | 1.000 | x3.36 | SW | mismatched |
| 2 | platform | ENSW | floor | **8.48** | E-N | x2.95 | 0.361 | 1.000 | x9.39 | E | mismatched |
| 3 | platform_far | ENSW | wall_lower | **6.40** | S-W | x2.70 | 0.246 | 0.714 | x5.51 | **all** (EW/NS) | mismatched |
| 4 | closet_chamber | ENSW | wall_upper | **5.67** | S-W | x1.08 | 0.342 | 0.572 | x4.13 | W | mismatched |
| 5 | treatment_room | ENSW | wall_lower | **4.98** | N-S | x1.02 | 0.024 | 0.250 | x3.97 | S | mismatched |
| 6 | reception | ENSW | wall_upper | **4.43** | E-W | x1.14 | 0.054 | 0.545 | x3.40 | E | mismatched |
| 7 | back_office | ENSW | wall_upper | **4.34** | E-S | x1.40 | 0.165 | 0.111 | x3.18 | S | mismatched |
| 8 | booking_hall | ENSW | wall_upper | **4.15** | E-S | x1.28 | 0.059 | 0.312 | x3.14 | S | mismatched |
| 9 | master_bedchamber | ENSW | ceiling | **4.14** | E-N | x3.31 | 0.088 | 0.528 | x3.11 | N | mismatched |
| 10 | garden_room | ENSW | wall_lower | **3.90** | E-W | x1.62 | 0.217 | 0.375 | x2.70 | W | mismatched |
| 11 | long_gallery | ENS | floor | **3.62** | E-S | x5.51 | 0.495 | 0.845 | x1.24 | — | consistent |
| 12 | dining_parlour | ENSW | ceiling | **3.28** | N-W | x10.51 | 0.448 | 0.558 | x1.22 | — | consistent |
| 13 | kitchen | ESW | ceiling | **2.87** | S-W | x1.29 | 0.380 | 0.333 | x1.30 | — | consistent-incomplete |
| 14 | great_hall | NS | wall_upper | **2.75** | N-S | x2.15 | 0.256 | 0.667 | x1.77 | — | consistent |
| 15 | servants_hall | NSW | wall_upper | **2.75** | N-W | x1.12 | 0.165 | 0.455 | x1.99 | — | consistent-incomplete |
| 16 | solar | ENSW | wall_lower | **2.68** | N-W | x1.29 | 0.185 | 0.533 | x1.91 | — | consistent |
| 17 | noodle_bar | ENSW | wall_upper | **2.14** | S-W | x4.50 | 0.189 | 0.708 | x1.59 | — | consistent-incomplete |
| 18 | ward | ENSW | floor | **2.12** | E-W | x1.12 | 0.265 | 1.000 | x1.31 | — | consistent-incomplete |
| 19 | buttery_pantry | ENSW | ceiling | **2.07** | S-W | x1.18 | 0.057 | 0.154 | x1.75 | — | consistent-incomplete |
| 20 | library | EN | ceiling | **1.94** | E-N | x4.55 | 0.271 | 0.667 | x1.03 | — | consistent-incomplete |
| 21 | back_stair_head | NS | wall_upper | **1.72** | N-S | x1.20 | 0.158 | 0.678 | x1.43 | — | consistent-incomplete |
| 22 | back_stair | NW | wall_upper | **1.68** | N-W | x1.94 | 0.062 | 0.597 | x1.57 | — | consistent-incomplete |
| 23 | study | NW | wall_upper | **1.68** | N-W | x1.01 | 0.148 | 0.331 | x1.43 | — | consistent |
| 24 | stair_landing | EN | wall_lower | **1.31** | E-N | x1.08 | 0.115 | 0.294 | x1.33 | — | consistent |
| 25 | muniment_room | EW | wall_lower | **1.17** | E-W | x1.06 | 0.109 | 0.242 | x1.27 | — | consistent-incomplete |

## Not comparable

| room | why |
|------|-----|
| entrance_approach | 0 promoted facing(s) with usable geometry — nothing to compare against |
| entrance_court | 0 promoted facing(s) with usable geometry — nothing to compare against |
| great_stair_hall | 1 promoted facing(s) with usable geometry — nothing to compare against |
| privy_garden | 0 promoted facing(s) with usable geometry — nothing to compare against |

## Facings the instrument could not read

Reported, never skipped — production law leaves no gate that cannot fail.

| facing | facing_type | missing | why |
|--------|-------------|---------|-----|
| entrance_approach/E | open | storey_height_m, corner_x0_px, corner_x1_px | meta declares no storey_height_m, corner_x0_px, corner_x1_px, so the ceiling/floor lines and the facing-wall columns cannot be placed |
| entrance_approach/S | open | storey_height_m, corner_x0_px, corner_x1_px | meta declares no storey_height_m, corner_x0_px, corner_x1_px, so the ceiling/floor lines and the facing-wall columns cannot be placed |
| entrance_approach/W | open | storey_height_m, corner_x0_px, corner_x1_px | meta declares no storey_height_m, corner_x0_px, corner_x1_px, so the ceiling/floor lines and the facing-wall columns cannot be placed |
| entrance_court/E | enclosed | storey_height_m | meta declares no storey_height_m, so the ceiling/floor lines and the facing-wall columns cannot be placed |
| entrance_court/S | open | storey_height_m, corner_x0_px, corner_x1_px | meta declares no storey_height_m, corner_x0_px, corner_x1_px, so the ceiling/floor lines and the facing-wall columns cannot be placed |
| library/W | enclosed | — | no band survived the frame: ceiling band gave 3 tiles of 0.30 m (needs 8) - too little material to describe; wall_upper band gave 4 tiles of 0.30 m (needs 8) - too little material to describe; wall_lower band gave 4 tiles of 0.30 m (needs 8) - too little material to describe; floor band gave 3 tiles of 0.30 m (needs 8) - too little material to describe |
| muniment_room/N | enclosed | — | no band survived the frame: ceiling band gave 1 tiles of 0.30 m (needs 8) - too little material to describe; wall_upper band gave 4 tiles of 0.30 m (needs 8) - too little material to describe; wall_lower band gave 4 tiles of 0.30 m (needs 8) - too little material to describe; floor band gave 1 tiles of 0.30 m (needs 8) - too little material to describe |
| muniment_room/S | enclosed | — | no band survived the frame: ceiling band gave 0 tiles of 0.30 m (needs 8) - too little material to describe; wall_upper band gave 0 tiles of 0.30 m (needs 8) - too little material to describe; wall_lower band gave 0 tiles of 0.30 m (needs 8) - too little material to describe; floor band gave 0 tiles of 0.30 m (needs 8) - too little material to describe |
| privy_garden/N | enclosed | storey_height_m | meta declares no storey_height_m, so the ceiling/floor lines and the facing-wall columns cannot be placed |
| privy_garden/S | enclosed | storey_height_m | meta declares no storey_height_m, so the ceiling/floor lines and the facing-wall columns cannot be placed |
| servants_hall/E | enclosed | — | no band survived the frame: ceiling band gave 2 tiles of 0.30 m (needs 8) - too little material to describe; wall_upper band gave 4 tiles of 0.30 m (needs 8) - too little material to describe; wall_lower band gave 4 tiles of 0.30 m (needs 8) - too little material to describe; floor band gave 2 tiles of 0.30 m (needs 8) - too little material to describe |

## The distribution the cut was read off

Every (room, band) spread in the store, worst first:

```
  8.96  guest_chamber        wall_upper
  8.48  platform             floor
  7.47  platform             wall_upper
  6.40  platform_far         wall_lower
  5.82  platform_far         wall_upper
  5.67  closet_chamber       wall_upper
  4.98  treatment_room       wall_lower
  4.43  reception            wall_upper
  4.34  back_office          wall_upper
  4.15  booking_hall         wall_upper
  4.14  master_bedchamber    ceiling
  4.10  platform             wall_lower
  3.90  garden_room          wall_lower
  3.62  long_gallery         floor
  3.56  master_bedchamber    wall_upper
  3.35  closet_chamber       wall_lower
  3.28  dining_parlour       ceiling
  3.27  back_office          wall_lower
  2.98  long_gallery         wall_upper
  2.97  garden_room          floor
  2.93  reception            wall_lower
  2.93  platform_far         floor
  2.87  kitchen              ceiling
  2.84  booking_hall         wall_lower
  2.84  master_bedchamber    wall_lower
  2.75  great_hall           wall_upper
  2.75  closet_chamber       floor
  2.75  servants_hall        wall_upper
  2.72  garden_room          ceiling
  2.69  back_office          floor
  2.69  master_bedchamber    floor
  2.68  solar                wall_lower
  2.67  long_gallery         wall_lower
  2.55  dining_parlour       wall_lower
  2.50  garden_room          wall_upper
  2.46  solar                wall_upper
  2.41  great_hall           ceiling
  2.30  treatment_room       wall_upper
  2.14  noodle_bar           wall_upper
  2.12  ward                 floor
  2.07  buttery_pantry       ceiling
  2.06  guest_chamber        ceiling
  2.04  ward                 wall_lower
  2.04  buttery_pantry       wall_lower
  2.03  great_hall           floor
  2.00  buttery_pantry       floor
  2.00  ward                 wall_upper
  1.99  servants_hall        wall_lower
  1.94  library              ceiling
  1.88  booking_hall         floor
  1.76  long_gallery         ceiling
  1.75  dining_parlour       floor
  1.72  back_stair_head      wall_upper
  1.71  great_hall           wall_lower
  1.69  servants_hall        ceiling
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
  1.37  noodle_bar           wall_lower
  1.37  library              wall_upper
  1.31  stair_landing        wall_lower
  1.17  muniment_room        wall_lower
  1.12  buttery_pantry       wall_upper
  1.07  kitchen              wall_lower
  1.04  noodle_bar           floor
  1.02  servants_hall        floor
  0.94  closet_chamber       ceiling
  0.81  muniment_room        wall_upper
  0.81  library              wall_lower
  0.73  stair_landing        floor
  0.63  stair_landing        ceiling
  0.59  reception            ceiling
  0.57  library              floor
  0.53  study                wall_lower
  0.51  reception            floor
  0.41  back_stair_head      wall_lower
  0.23  study                ceiling
  0.21  stair_landing        wall_upper
```

## The repair route

Folded into the generation method, per production-law clause 6. `node tools/make-scaffold.mjs --emit-consistency` reads this report and cuts ONE re-ask packet per outlier facing into `design/batches/row23-scaffold/manor/retries.json`, in the shape the seat and the sweep already read. Nothing here dispatches and nothing here touches `run-state.json`.

Two things make the re-ask FORCED rather than nudged. First, the correction names the room's RULING materials - walls, ceiling and floor, plus the rank of a bedchamber's hangings - resolved from `tools/room-voices.mjs` through the plan's own room id, and instructs the painter to use those and nothing else. The ruling does not come from the other walls, because the other walls are what is in dispute: guest_chamber's majority is itself the half that disobeys the bedchamber voice. Second, an edge seed may only be cut from a facing this report puts inside the room's AGREEING majority - seeding an outlier off another outlier is how a wrong material spreads round a room instead of being replaced - and a room with no majority carries no strip at all and stands on the ruling alone.

| wall | packet | band | D | seeded from | ruling wall material |
|------|--------|------|---|-------------|----------------------|
| `back_stair_head/N` | `back_stair_head-N/retry-1` | materials | 1.00 | _none - no majority to trust_ | limewashed plaster above a plain boarded oak dado of square-edged boar... |
| `back_stair_head/S` | `back_stair_head-S/retry-4` | materials | 1.00 | _none - no majority to trust_ | limewashed plaster above a plain boarded oak dado of square-edged boar... |
| `back_stair/N` | `back_stair-N/retry-1` | materials | 1.00 | _none - no majority to trust_ | limewashed plaster above a plain boarded oak dado of square-edged boar... |
| `back_stair/W` | `back_stair-W/retry-4` | materials | 1.00 | _none - no majority to trust_ | limewashed plaster above a plain boarded oak dado of square-edged boar... |
| `buttery_pantry/E` | `buttery_pantry-E/retry-1` | materials | 1.00 | _none - no majority to trust_ | rough limewashed plaster over stone, carried straight down to the floo... |
| `buttery_pantry/N` | `buttery_pantry-N/retry-1` | materials | 1.00 | _none - no majority to trust_ | rough limewashed plaster over stone, carried straight down to the floo... |
| `buttery_pantry/S` | `buttery_pantry-S/retry-1` | materials | 1.00 | _none - no majority to trust_ | rough limewashed plaster over stone, carried straight down to the floo... |
| `buttery_pantry/W` | `buttery_pantry-W/retry-1` | materials | 1.00 | _none - no majority to trust_ | rough limewashed plaster over stone, carried straight down to the floo... |
| `closet_chamber/E` | `closet_chamber-E/retry-1` | materials | 2.00 | closet_chamber/N | oak wainscot to chair height with wall hangings above it, those hangin... |
| `closet_chamber/W` | `closet_chamber-W/retry-1` | wall_upper | 3.86 | closet_chamber/N | oak wainscot to chair height with wall hangings above it, those hangin... |
| `closet_chamber/W` | `closet_chamber-W/retry-2` | materials | 2.00 | closet_chamber/N | oak wainscot to chair height with wall hangings above it, those hangin... |
| `garden_room/W` | `garden_room-W/retry-1` | wall_upper | 6.21 | garden_room/N | light-toned oak wainscot to chair height below limewashed plaster... |
| `great_hall/N` | `great_hall-N/retry-4` | materials | 1.00 | _none - no majority to trust_ | dark oak wall panelling in fielded bays with a carved frieze above it,... |
| `great_hall/S` | `great_hall-S/retry-4` | materials | 1.00 | _none - no majority to trust_ | dark oak wall panelling in fielded bays with a carved frieze above it,... |
| `guest_chamber/E` | `guest_chamber-E/retry-6` | materials | 2.00 | guest_chamber/S | oak wainscot to chair height with wall hangings above it, those hangin... |
| `guest_chamber/N` | `guest_chamber-N/retry-6` | materials | 2.00 | _none - no majority to trust_ | oak wainscot to chair height with wall hangings above it, those hangin... |
| `guest_chamber/S` | `guest_chamber-S/retry-4` | wall_upper | 8.96 | guest_chamber/E | oak wainscot to chair height with wall hangings above it, those hangin... |
| `guest_chamber/W` | `guest_chamber-W/retry-1` | wall_upper | 8.96 | guest_chamber/N | oak wainscot to chair height with wall hangings above it, those hangin... |
| `guest_chamber/W` | `guest_chamber-W/retry-2` | materials | 2.00 | guest_chamber/S | oak wainscot to chair height with wall hangings above it, those hangin... |
| `kitchen/E` | `kitchen-E/retry-1` | materials | 1.00 | _none - no majority to trust_ | rough limewashed plaster over stone, carried straight down to the floo... |
| `kitchen/S` | `kitchen-S/retry-1` | materials | 1.00 | _none - no majority to trust_ | rough limewashed plaster over stone, carried straight down to the floo... |
| `kitchen/W` | `kitchen-W/retry-4` | materials | 1.00 | _none - no majority to trust_ | rough limewashed plaster over stone, carried straight down to the floo... |
| `long_gallery/E` | `long_gallery-E/retry-1` | materials | 1.00 | _none - no majority to trust_ | plain oak wainscot below limewashed plaster, with a moulded oak cornic... |
| `long_gallery/N` | `long_gallery-N/retry-6` | materials | 1.00 | _none - no majority to trust_ | plain oak wainscot below limewashed plaster, with a moulded oak cornic... |
| `long_gallery/S` | `long_gallery-S/retry-4` | materials | 1.00 | _none - no majority to trust_ | plain oak wainscot below limewashed plaster, with a moulded oak cornic... |
| `master_bedchamber/E` | `master_bedchamber-E/retry-1` | ceiling | 4.47 | _none - no majority to trust_ | oak wainscot to chair height with wall hangings above it, those hangin... |
| `master_bedchamber/N` | `master_bedchamber-N/retry-6` | ceiling | 4.47 | _none - no majority to trust_ | oak wainscot to chair height with wall hangings above it, those hangin... |
| `master_bedchamber/S` | `master_bedchamber-S/retry-4` | ceiling | 4.47 | _none - no majority to trust_ | oak wainscot to chair height with wall hangings above it, those hangin... |
| `master_bedchamber/W` | `master_bedchamber-W/retry-1` | ceiling | 4.47 | _none - no majority to trust_ | oak wainscot to chair height with wall hangings above it, those hangin... |
| `privy_garden/N` | `privy_garden-N/retry-4` | materials | 1.00 | _none - no majority to trust_ | a garden wall of weathered red brick in English bond on a coursed ston... |
| `privy_garden/S` | `privy_garden-S/retry-6` | materials | 1.00 | _none - no majority to trust_ | a garden wall of weathered red brick in English bond on a coursed ston... |
| `servants_hall/E` | `servants_hall-E/retry-1` | materials | 2.00 | servants_hall/N, servants_hall/S | plain limewashed plaster carried straight down to the floor, unbroken ... |
| `servants_hall/E` | `servants_hall-E/retry-2` | materials | 2.00 | _none - no majority to trust_ | plain limewashed plaster carried straight down to the floor, unbroken ... |
| `servants_hall/E` | `servants_hall-E/retry-3` | materials | 2.00 | _none - no majority to trust_ | plain limewashed plaster carried straight down to the floor, unbroken ... |
| `servants_hall/E` | `servants_hall-E/retry-4` | materials | 2.00 | _none - no majority to trust_ | plain limewashed plaster carried straight down to the floor, unbroken ... |
| `servants_hall/E` | `servants_hall-E/retry-5` | wall_lower | 3.89 | servants_hall/N, servants_hall/S | plain limewashed plaster carried straight down to the floor, unbroken ... |
| `servants_hall/N` | `servants_hall-N/retry-1` | ceiling | 3.90 | servants_hall/W | plain limewashed plaster carried straight down to the floor, unbroken ... |
| `servants_hall/W` | `servants_hall-W/retry-6` | materials | 2.00 | _none - no majority to trust_ | plain limewashed plaster carried straight down to the floor, unbroken ... |
| `servants_hall/W` | `servants_hall-W/retry-7` | materials | 2.00 | _none - no majority to trust_ | plain limewashed plaster carried straight down to the floor, unbroken ... |
| `servants_hall/W` | `servants_hall-W/retry-8` | materials | 2.00 | _none - no majority to trust_ | plain limewashed plaster carried straight down to the floor, unbroken ... |
| `servants_hall/W` | `servants_hall-W/retry-9` | materials | 1.00 | _none - no majority to trust_ | plain limewashed plaster carried straight down to the floor, unbroken ... |
| `solar/E` | `solar-E/retry-1` | materials | 1.00 | _none - no majority to trust_ | dark oak wall panelling in fielded bays with a carved frieze above it,... |
| `solar/N` | `solar-N/retry-1` | materials | 1.00 | _none - no majority to trust_ | dark oak wall panelling in fielded bays with a carved frieze above it,... |
| `solar/S` | `solar-S/retry-4` | materials | 1.00 | _none - no majority to trust_ | dark oak wall panelling in fielded bays with a carved frieze above it,... |
| `solar/W` | `solar-W/retry-1` | materials | 1.00 | _none - no majority to trust_ | dark oak wall panelling in fielded bays with a carved frieze above it,... |
| `stair_landing/E` | `stair_landing-E/retry-1` | materials | 2.00 | stair_landing/N | oak wainscot to chair height below limewashed plaster... |
| `study/N` | `study-N/retry-1` | materials | 2.00 | _none - no majority to trust_ | dark hand-finished oak wall panelling... |
| `study/W` | `study-W/retry-1` | materials | 2.00 | _none - no majority to trust_ | dark hand-finished oak wall panelling... |

## What was looked at, and what was seen

The cut is not a round number picked for looking sensible. Twelve rooms were opened as contact sheets — every promoted facing of the room side by side — and labelled by eye before any weight was chosen. Then every configuration of the instrument (column inset, tile size, the four terms' divisors, band-to-band against contrast-to-contrast) was scored by how many of the 36 mismatch-vs-match pairs it ordered correctly.

**The six rooms that are plainly not one room:**

- **garden_room** — N and E are limewashed plaster over a wainscot with a stone flag floor. W is oak panelling from cornice to skirting over a wood board floor. It is two different rooms sharing a name.
- **servants_hall** — N and E are full-height dark oak panelling under a plastered ceiling. S and W are pale limewash with a plain rail, under exposed dark joists, over brick. The panelled pair is a parlour; the limewashed pair is the servants' hall the voice actually rules.
- **master_bedchamber** — the room Kabe named. N and S hang verdure tapestry above the wainscot; E and W are panelled top to bottom. Two against two, which is why it is reported as having no majority.
- **guest_chamber** — S has a deep red hanging above the wainscot; N, E and W are panelled. Note that S is the one obeying the bedchamber voice and the other three are not, so the majority here is WRONG — which is exactly why the repair's ruling comes from the plan and not from a vote.
- **closet_chamber** — N is plaster above the wainscot, E and W are panelled.
- **stair_landing** — N's ceiling is pale plaster, E's is dark boarded oak. The walls and floor agree well.

**The six that plainly are one room:** study (oak panelling, oak boards, parchment plaster, on both facings); kitchen (E/S/W all oak panelling over oak boards under plaster); buttery_pantry (four oak-panelled facings, N simply darker); solar (four facings of panelling over stone flags — the exposure varies a lot and the material does not); muniment_room (four panelled facings); long_gallery (oak wainscot below limewash under dark beams, on all three).

**What the pictures decided.** The first cut of this instrument compared mean CIE-Lab and ranked long_gallery, solar and kitchen ABOVE master_bedchamber and garden_room. It was reading the exposure. Lab's L* goes as the cube root of luminance, so a change of exposure scales it and no subtraction undoes that; the second cut moved to log-luminance and log channel ratios, where exposure is an additive offset that the facing's own reference removes exactly. The third finding was the decisive one and it came out of the sweep rather than out of an argument: **brightness should carry no weight at all.** Every configuration that weighted it scored worse than the same configuration with it at zero. That is row 37's law arrived at from the other end — a wall beside a window is not a different wall.

**The known miss, logged rather than hidden** (production law clause 2): stair_landing scores 2.12 and sits well below the cut, though a human plainly sees its two ceilings differ. Its two facings differ mostly in how dark the ceiling is, which is the one axis this instrument was calibrated to ignore, and its declared ceiling line sits far enough from the painted one that the two bands are not sampling the same surface. Recorded in `design/plan-draft/measured/misses.jsonl`. Raising the brightness weight enough to catch it costs three false positives, which is a worse trade for a repair route that spends a model call per flag.


---

# The ORIGIN — what actually caused it

[HUMAN, 2026-08-24, verbatim]: "Make sure we're not just fixing it. We need to hunt down the cause, determine its origin and bake in the consistent solution."

Everything above measures PIXELS. This section is the hunt for the cause behind them, and it ends
somewhere the pixels only implied: **the five rooms were not painted badly and their prompts did not
drift. Their facings were commissioned, verbatim, from different materials.**

Every candidate ever rolled has its exact prompt on disk beside it
(`backdrops/source/<room>-<F>/<id>.prompt.txt`), and every promoted meta names the candidate it was
promoted from. Reading the two together recovers the ask behind every painting in the store.

## Three commits, seven hours apart

| when | commit | what it did |
|------|--------|-------------|
| 2026-08-23 03:54 | `4efd69d` | the manor run emits **85 packets**. The composer keyed materials on `room.archetype` and fell through to the panelled-parlour default, so a bedchamber, a garden parlour, a kitchen and the servants' hall were each asked for *"dark hand-finished oak wall panelling, aged parchment-toned plaster ceiling, wide worn oak floorboards"*. |
| 2026-08-23 11:03 | `e0f02b6` | row 29 lands the voice table — and re-emits **thirteen** walls under it (`6ad03c7`). |
| 2026-08-23 14:16 | `d223961` | the sweep re-asks **27** held walls; those carry the voice. |

`--emit-manor` is idempotent **by existence** — its own `_reuse_rule` says so: *"a promoted backdrop,
a candidate already on disk, or a spent retry budget removes a facing from the order."* So the voice
correction could not reach any facing that was already painted or already had rolls. From 11:03
onward, **whether a facing spoke its room's voice was decided by whether it happened to need a
re-ask** — a camera property deciding a room property. Four walls of one room, rolled independently,
landed on both sides of that line.

## The five rooms, facing by facing

The divergent sentence is verbatim from each promoted candidate's own prompt sidecar.

| room | facing | the material sentence its painting was asked from | verdict |
|------|--------|--------------------------------------------------|---------|
| **guest_chamber** | S | `oak wainscot to chair height with wall hangings above it. Overhead: a plain lime-plastered ceiling. Underfoot: wide oak floorboards. Hangings: hangings of dull red worsted say…` | the voice |
| | N, E, W | `dark hand-finished oak wall panelling, aged parchment-toned plaster ceiling, wide worn oak floorboards.` | pre-row-29 default |
| **master_bedchamber** | N, S | `oak wainscot to chair height with wall hangings above it. Overhead: a plain lime-plastered ceiling. Underfoot: wide oak floorboards. Hangings: a full set of woven tapestry hangings…` | the voice |
| | E, W | `dark hand-finished oak wall panelling, aged parchment-toned plaster ceiling, wide worn oak floorboards.` | pre-row-29 default |
| **servants_hall** | S, W | `plain limewashed plaster carried straight down to the floor, unbroken by any timber lining, joinery or moulding. Overhead: plain exposed oak joists with boards between them. Underfoot: a floor of worn red brick laid on edge.` | the voice |
| | N, E | `dark hand-finished oak wall panelling, aged parchment-toned plaster ceiling, wide worn oak floorboards.` | pre-row-29 default |
| **garden_room** | N, E | `light-toned oak wainscot to chair height below limewashed plaster. Overhead: a plain lime-plastered ceiling. Underfoot: a floor of square stone paviours.` | the voice |
| | W | `dark hand-finished oak wall panelling, aged parchment-toned plaster ceiling, wide worn oak floorboards.` | pre-row-29 default |
| **closet_chamber** | N | `oak wainscot to chair height with wall hangings above it. Overhead: a plain lime-plastered ceiling. Underfoot: wide oak floorboards. Hangings: plain hangings of undyed wool serge…` | the voice |
| | E, W | `dark hand-finished oak wall panelling, aged parchment-toned plaster ceiling, wide worn oak floorboards.` | pre-row-29 default |

It matches the pixel measure facing for facing, including the thing that looked strangest in it:
`guest_chamber`'s pixel majority is N/E/W and it is the half that is **wrong**, because S is the one
facing that got the bedchamber voice. That is why the repair's ruling comes from the plan and never
from a vote — and the ask audit reaches the same answer from the other direction, since S is also
the only facing of that room whose ASK was the ruling.

## What was checked and ruled out

Named here because a cause found is only as good as the causes eliminated.

| suspect | verdict |
|---------|---------|
| **the style seed** — did the packets attach different Image 1 bytes? | **ruled out by measurement.** All 170 `style-seed-warm.png` copies under `design/batches/` are byte-identical to `design/references/style-seed-warm.png` (one sha256). Now a standing test. |
| **`voiceFor` answering differently per facing** | **ruled out.** It returns one voice for all four facings of every interior room. The only per-facing split is outdoor, by design — an open side has no wall on it — and it is exempted by name. |
| **a correction carried into a re-ask naming a foreign material** | **ruled out.** Exactly one correction in `run-state.json` names a material word: `privy_garden/N`'s, which is Kabe's own veto, and `REDACTED_CORRECTION` already exists to stop it being quoted back at the painter. |
| **the row-38 edge seed seeding off a wrong neighbour** | **ruled out by date.** Row 38 postdates every painting in these five rooms; not one was seeded. |
| **the row-34 evolution arm (`g4`) leaking into production** | **ruled out.** No promoted facing here came from an evolution packet. The only trace of `g4` is the label rename (`Materials and period detail:` → `Materials/textures:`), which is prose and not a material — `garden_room/E` and `garden_room/N` carry the two labels and the identical fabric. |
| **the painter disobeying an identical prompt** | **ruled out, and this is the strongest single finding.** Every facing asked for the generic fabric came back panelled; every facing asked for its room's voice came back in that voice. The asks explain the split completely and leave nothing for disobedience to account for. Prompt STRENGTH is not the issue here — prompt CONTENT was. |
| **`walls_with_openings`** | **real, and correct.** It differs per facing only outdoors, where the plan draws carriers on one side of a court and not another. Declared, not accidental. |
| **`voice.blank`** | **REAL, live at HEAD, and fixed here.** See below. |

## The second origin: `voice.blank`

The same disease one level down, and it had nothing to do with row 29. A facing carrying **no
carrier** got an extra sentence — *"it is `voice.blank`"* — composed per voice. In `hall_state` and
`great_chamber` that string named a different fabric from `voice.walls`:

```
walls: dark oak wall panelling in fielded bays with a carved frieze above it, lime-plastered wall head
blank: unbroken oak wainscot under a carved frieze
```

So a blank facing of the great hall or the solar was told **panelling** in one sentence and
**wainscot** in another, while its carrier-bearing neighbours were told only panelling — a per-FACING
property deciding a per-ROOM one. Row 36's `MATERIAL_BINDING` already binds `blank` and `walls` here
to one texture id, so the words were the only thing dissenting.

## Where the cure lives (production law clause 6)

Nothing below is in an artifact, and nothing below needs this conversation in context.

1. **Emitter — one home for a material sentence.** `make-scaffold.materialParts` / `materialLines`
   compose every material sentence a manor ask states, in both the indoor and outdoor branches, and
   `manorPrompt` calls them. The auditor and the promotion gate ask the same function, so the
   emitter and the gate cannot describe two different rooms and agree with each other about it.
2. **Emitter — the blankness sentence carries no fabric of its own.** It points at the shared
   `Materials/textures` line, and the two divergent `blank` strings were corrected to name the
   fabric their `walls` names.
3. **Instrument — `materialProvenance()`, and `--audit-materials`.** For every promoted facing it
   recovers the ask its painting was actually made from (through `askTextFor`, so a row-35 snapped
   candidate resolves through the roll it was rectified from) and compares it with the ask this
   composer writes for that room **today**. Deterministic, no pixels, no browser, no model. Because
   it recomputes the ruling from `room-voices.mjs` on every run, **the instant anyone corrects the
   voice table, every wall painted under the old one goes visibly stale** — which is exactly the
   observer that did not exist on 2026-08-23 at 11:03. It writes
   `design/plan-draft/measured/material_provenance.json` and exits non-zero on any room that is not
   current.
4. **Gate — `promote-backdrop.mjs` holds the door.** `[row40:material.voice_stale]` refuses a
   candidate whose own ask never named its room's ruled materials; `[row40:material.ask_unreadable]`
   refuses one whose ask cannot be read at all. Both are registered in the clause ledger with a case
   that goes red on that clause alone. It is a **no-op by construction** on any packet this emitter
   cuts, because the sentences it looks for come from the same `rulingSentences` the emitter composes
   with.
5. **Repair route — `--emit-consistency --from-ask`.** The forced re-ask can now be sourced from the
   asks instead of the pixels, which is strictly earlier (the pixel measure cannot speak until every
   facing of a room is painted) and strictly stronger on seeding: a strip may be cut only from a
   facing whose **own ask was the ruling**, where the pixel route trusts the pixel majority.
   `guest_chamber` is the case that separates them.

## The legacy ledger, and what stays open

36 of the 61 promoted paintings were made from an ask that does not name their room's ruled
materials. Refusing them all would refuse the corpus rather than the defect, so
`design/plan-draft/measured/material_legacy.json` admits them — **as a ledger, not an exemption**: an
entry admits one facing from **one exact candidate**, a re-ask produces a new candidate id that is
not in the file, so the list can only shrink, and a wall nobody repairs stays visible with its own
`why` instead of passing silently. Each entry names the command that closes it.

## What the audit sees that the pixel measure cannot

| finding | pixel measure | ask audit |
|---------|---------------|-----------|
| the five mismatched rooms | 5 of 5 | 5 of 5 |
| **stair_landing** — logged OPEN above, invisible to a colour-and-contrast metric because its two ceilings differ almost purely in brightness | miss (2.12, rank 10, under the cut) | **caught**: N was asked for *"a plain lime-plastered ceiling"*, E for a *"boarded ceiling"* |
| the rooms labelled plainly ONE room by eye | correctly consistent | **0 false flags** — kitchen, buttery_pantry, solar, muniment_room and long_gallery all come back as one ask, and so does dining_parlour |
| **study** — the sixth room on that list | correctly consistent (its two facings look alike) | **split**, and correctly: its promoted pair predates the manor composer entirely and the two were written by hand, differently. N says `Materials and period detail: dark hand-finished oak paneling…`; W says `Style and materials: Match Image 1 exactly: dark hand-finished oak paneling…` — a different heading, a different sentence, and US-spelt "paneling" in both, where the voice rules "panelling". Two facings that happen to agree are not two facings that were asked the same thing |
| a room painted **consistently to a superseded voice** | invisible — it looks like one room, because it is one room | **8 rooms**, including `kitchen` and `buttery_pantry`: 7 promoted facings of oak panelling in a scullery, which is [HUMAN, 2026-08-24, verbatim] *"is every room in this house parlor walls?"* still standing in the store |
| a promoted painting whose ask cannot be recovered | invisible | **1** (`entrance_court/S`), reported rather than skipped |

Guarded by `tests/playwright/material-origin.spec.mjs` (the 88-facing room-invariance sweep, the
blankness clause, the style-seed identity, the audit against the pixel measure's own corpus, the
seeding rule, and the ledger's honesty) and by the two clause-ledger cases in `guards.spec.mjs`.

---

# The SECOND origin — Image 1, and the ruling that removes it

[HUMAN, 2026-08-24, verbatim]: "So why do we give it the reference image of the study? I think it biases it too much. I mean I know why that window with the botched insignias is every window generated for example."

Tested rather than assumed, and he is right — though not about the five rooms.

## What Image 1 was

Every manor packet ever cut attached the same file as Image 1: `design/references/style-seed-warm.png`, one sha256 (`a5df7a68…`) across all **170** copies on disk. It is a painting of **the study**: dark oak fielded panelling on every surface, a leaded window carrying **four painted heraldic shields**, a lit fire, furniture, books, a rug, candles. Every one of those is a thing the words then have to argue with.

## Evidence 1 — it overrode the words outright

`privy_garden/N`, roll `row23-1b134204`. Its ask says, in full:

> `Materials and period detail: weathered ashlar and brick, open sky above, packed earth and stone paving underfoot.`

It names **no wood at all**. The painting has **dark oak fielded wainscot running round an outdoor garden wall under open sky**. Image 1 is the only place in that packet where fielded oak panelling exists, so it is where the panelling came from. That picture is what Kabe vetoed as *"exterior garden has interior wall outside"* — and this names the file it came out of.

## Evidence 2 — the shields, counted

Of the **19** promoted facings the plan gives a window and whose voice rules **plain** glass, **7 (37 %)** carry saturated, daylight-bright coloured glass their ask never asked for. The control is what makes it evidence rather than an impression: `great_hall` — the one room period practice and this project's own heraldry ration allow arms in quantity — scores **71 px** and **20 px**, *less coloured glass than nine of the rooms forbidden it entirely*. The shields went everywhere except the room entitled to them.

Worst offenders: `long_gallery/E` (1210 px), `master_bedchamber/E` (938), `muniment_room/S` (832), `library/W` (525), `guest_chamber/W` (509), `closet_chamber/E` (422), `master_bedchamber/W` (305).

**Stated honestly, because it bounds the claim:** all seven were painted from asks that predate row 29 and carry **no plain-glass refusal at all** — the "Windows:" paragraph did not exist when they were rolled. So the store cannot tell us whether the words alone would have beaten the seed. That experiment has never been run. The ruling below removes the need to run it.

*(A first cut of this measure counted saturated pixels over the whole frame and flagged `guest_chamber/S`, which has no window at all — its saturation is the dull red worsted hanging its own ask asked for. The measure is therefore restricted to facings the plan draws a window on, and to daylight-bright pixels, which is glass rather than firelit fabric.)*

## What Image 1 was NOT

**It is not the origin of the five mismatched rooms.** Those split exactly on the archetype/voice date, facing for facing, and wherever an ask named a fabric far from the seed's, **the painting followed the ask**: `servants_hall` S/W came back limewash over brick under exposed joists; `garden_room` N/E light wainscot over paviours; `master_bedchamber` N/S tapestry hangings; `guest_chamber/S` a deep red worsted hanging, which is as far from a panelled study as this house goes. Two diseases, two causes. The seed owns the second one.

## The ruling, folded into the emitter

**Image 1 is never a wall from another room.** `styleImageFor(plan, key)` decides, and `manorPrompt` calls it itself so every emit path gets the rule without remembering it:

- **Where the room has a wall it can vouch for**, that wall is Image 1, with its role stated in words: *"Image 1 is a painting of ANOTHER WALL OF THIS SAME ROOM… the reference for this room's materials, its paint medium, its palette and its light, and for nothing else: how many openings this wall carries, where they stand and every dimension of them come from Image 2 and the words below."*
- **Where it has none, no style image is attached at all.** The packet says so in its first sentence and in its attach line, and the medium goes into words at a picture's resolution — oil, alla prima on a warm ground, impasto in the lit passages, thin scumbled shadow, the palette, the falloff, and *"it is a painting, and the brush is visible in it."*

**Two conditions, and the second is row 40's own.** The pixel measure must put that wall inside the room's **agreeing majority**, *and* the ask audit must say that wall's **own ask was this room's ruling**. `guest_chamber` is why the second is not redundant: its pixel majority is N/E/W, all three commissioned from the panelled-parlour default, and the one facing asked for the bedchamber voice is S — the *outlier*. A rule trusting the pixel vote alone would hand the next roll a photograph of the wrong room and call it evidence. So guest_chamber gets **no** picture, and master_bedchamber (two against two, no majority) gets none either.

As the store stands: **29 of 88 facings resolve an Image 1; 59 get none.** Every one of the 29 is a wall of its own room.

**The glass is now named positively**, because the seed can no longer supply it: *"Every light is glazed edge to edge with small plain diamond quarries of faintly greenish crown glass, each quarry a plain lozenge of clear glass and nothing else…"*, followed, where the ration is zero, by *"…no armorial shield, crest, badge, monogram, motto or insignia of any kind appears in any window here. This room is not entitled to arms and has none."* The sentence that argues with Image 1 is spoken **only where an Image 1 exists to argue with** — a prompt that mentions "the window in Image 1" when no Image 1 is attached has just described a window nobody asked for.

*One deviation from the instruction, stated rather than taken silently:* the ruling said "plain rectangular quarries". The quarry is named **diamond** here, because the lozenge quarry is the c.1660 leaded form the voice table's own period notes rule and a rectangular quarry is a later one. The substance asked for — the glass named explicitly and positively, in words, since no picture supplies it — is done.

Image 2 (the scaffold) and the row-38 edge strips are untouched.

Guarded by five cases in `tests/playwright/material-origin.spec.mjs`: no facing is ever given another room's wall or its own; the wall picked is one the room agrees on *and* one whose ask was the ruling; the prompt and the attach line never disagree about what Image 1 is, and no manor ask names `style-seed-warm` again; a packet with no Image 1 still carries the medium; and a plain-glass room is told what *is* in every quarry, not only what is not.
