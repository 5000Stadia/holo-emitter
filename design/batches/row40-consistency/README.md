# Row 40 — legacy room-consistency audit

[HUMAN, 2026-08-24, verbatim]: "Still getting rooms with wall/ceiling mismatches" — "Mismatches as in different from other walls".

Rows 36 and 38 cure this by construction for walls painted from here on. The 57 already-promoted paintings were rolled independently and had never been measured against each other. This is that measurement — deterministic, no model in the loop: `design/plan-draft/measured/room_consistency.py`, report in `design/plan-draft/measured/room_consistency.json`.

Each facing's own meta places its ceiling and floor lines; the columns strictly inside the two declared corners are ceiling above the one and floor below the other, so four bands - ceiling, upper wall, lower wall, floor - cut out with no perspective bookkeeping. Each band is resampled to 150 px/m, cut into 0.30 m tiles of WORLD, and described by the MEDIAN tile, so a window or a doorway cannot decide that a wall changed; the columns a carrier is declared on are dropped outright first.

Per band, two facings are compared on **colour** - distance in (log R/G, log B/G), where the exposure has already cancelled - and **contrast** - the ratio of median tile log-luma gradient. D is the length of that weighted pair (colour at 0.14 per step, contrast at 0.4 per doubling), so D ~ 1 is one plainly noticeable step. **Brightness and histogram spread are measured and printed but carry no weight**, which is not a preference: the sweep below found every configuration that weighted brightness scored worse than the same one with it at zero. A room scores its WORST pairwise D over its worst band. **Cut: D > 3.75.**

The outlier is chosen by CLUSTERING the room's facings on that band - two facings join when they agree within the cut - and not by distance from the room's median, because a room can split two against two and then the median is a place no facing stands. A room with no majority has every facing returned and is marked **all**.

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

## The repair route

Folded into the generation method, per production-law clause 6. `node tools/make-scaffold.mjs --emit-consistency` reads this report and cuts ONE re-ask packet per outlier facing into `design/batches/row23-scaffold/manor/retries.json`, in the shape the seat and the sweep already read. Nothing here dispatches and nothing here touches `run-state.json`.

Two things make the re-ask FORCED rather than nudged. First, the correction names the room's RULING materials - walls, ceiling and floor, plus the rank of a bedchamber's hangings - resolved from `tools/room-voices.mjs` through the plan's own room id, and instructs the painter to use those and nothing else. The ruling does not come from the other walls, because the other walls are what is in dispute: guest_chamber's majority is itself the half that disobeys the bedchamber voice. Second, an edge seed may only be cut from a facing this report puts inside the room's AGREEING majority - seeding an outlier off another outlier is how a wrong material spreads round a room instead of being replaced - and a room with no majority carries no strip at all and stands on the ruling alone.

| wall | packet | band | D | seeded from | ruling wall material |
|------|--------|------|---|-------------|----------------------|
| `closet_chamber/W` | `closet_chamber-W/retry-1` | wall_upper | 3.86 | closet_chamber/N | oak wainscot to chair height with wall hangings above it, those hangin... |
| `garden_room/W` | `garden_room-W/retry-1` | wall_upper | 6.21 | garden_room/N | light-toned oak wainscot to chair height below limewashed plaster... |
| `guest_chamber/S` | `guest_chamber-S/retry-4` | wall_upper | 8.96 | guest_chamber/E | oak wainscot to chair height with wall hangings above it, those hangin... |
| `guest_chamber/W` | `guest_chamber-W/retry-1` | wall_upper | 8.96 | guest_chamber/N | oak wainscot to chair height with wall hangings above it, those hangin... |
| `master_bedchamber/E` | `master_bedchamber-E/retry-1` | ceiling | 4.47 | _none - no majority to trust_ | oak wainscot to chair height with wall hangings above it, those hangin... |
| `master_bedchamber/N` | `master_bedchamber-N/retry-6` | ceiling | 4.47 | _none - no majority to trust_ | oak wainscot to chair height with wall hangings above it, those hangin... |
| `master_bedchamber/S` | `master_bedchamber-S/retry-4` | ceiling | 4.47 | _none - no majority to trust_ | oak wainscot to chair height with wall hangings above it, those hangin... |
| `master_bedchamber/W` | `master_bedchamber-W/retry-1` | ceiling | 4.47 | _none - no majority to trust_ | oak wainscot to chair height with wall hangings above it, those hangin... |
| `servants_hall/N` | `servants_hall-N/retry-1` | ceiling | 3.90 | servants_hall/W | plain limewashed plaster carried straight down to the floor, unbroken ... |

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

