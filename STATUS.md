# Row 43 — the threshold is geometry, the band is a trust region, the confidence can fall

The predecessor left three failures written down honestly. They are fixed, and
nothing else was touched. `design/plan-draft/measured/aperture_trace.py`,
`test_aperture_trace.py` (9 cases, all pass), 31 promoted door walls swept,
26 ms median / 38 ms worst, `design/batches/aperture-trace/store.json`.

## Rule 1 — the threshold is geometry, not paint

At the foot of a doorway the room beyond is lit: its floor catches the same key
light this room's does, so the "dark inside" cue inverts and a tracer looking
for a void follows the far floor up into the opening. There is no paint at a
threshold to trace. The bottom of an aperture in a wall is **where that wall
meets its floor** — `floor_line_y * image_h_px` on every promoted wall, the
warp's or the plan's floor line on a candidate — so the bottom side is no longer
traced at all, it is SET. In the cost matrix every bottom sample is given one
allowed offset, `floor_line_y - rect_bottom`, and the smoothness term is
switched off at the two junctions where the traced jambs meet it
(`LAM_AT_THRESHOLD = 0`) so a sill 30 px below the prior cannot drag the jambs'
feet 30 px sideways with it. The bottom side's fitted line is then exactly the
floor line, and the existing corner machinery does the rest: **a jamb's foot is
the intersection of its own fitted line with the floor line**, a point no sample
sits on. Before, the traced sill wandered a median 15 px and a worst 55 px off
the prior's bottom; now it is on the floor line by construction, and on the four
walls where the void's dark run stopped well short of it — `back_office/W` +26,
`noodle_bar/E` +21, `garden_room/S` +29, `closet_chamber/S` +32 px — the sill
moved down onto the floor rather than up onto the far room's floorboards.

## Rule 2 — the band is a trust region, bounded by ABSOLUTE contrast

Every cost in the pass was in units of the wall's own contrast, which is a
ratio of a wall's evidence to itself: divide a 20-level step by a 20-level
contrast and it scores like a 90-level step on a lit wall, so the loop bought a
moulding eighty px away for a hair's difference. The function, stated
(`_trust_region`): let `A` be the wall's void-to-frame step **in levels of
255**, taken as `max(|frame − void|, p75 of a_i)` — the ring-and-centre medians,
and the upper quartile of what the prior's own perimeter measures, because a
prior can be wrong over a third of its perimeter without the wall being dim and
a prior displaced clean off the aperture measures nothing at all. Then

    trust     = clip((A − 12) / (48 − 12), 0, 1) ** 2
    band_eff  = 4 + (band − 4) · trust                      # a hard cutoff, px
    hold_i    = clip((a_i − 8) / (25 − 8), 0, 1)
    w_prior_i = W_PRIOR · (1 + 8·(1 − trust) + 10·hold_i)   # charged per px / band

`a_i` is THE PRIOR'S OWN GRIP: the strongest step within 8 px of offset 0 whose
inside is still within 18 levels of the void. In levels, not in ratio — a prior
displaced onto the wall/reveal arris sits on a step as strong as the aperture's
and it is not the aperture's, and only the absolute distance from the void says
so. Where the prior stands on real paint, leaving it must be paid for; where it
stands on nothing — which is the whole reason this file exists — it is free to
go and find the edge. That one number is what separates `buttery_pantry/S`'s
50 px onto the real reveal (the prior stands on 4.6 levels there: nothing) from
`muniment_room/E`'s 33 px onto a moulding (the prior stands on 27). Worked:
`muniment_room/E` has A = 32, trust = 0.31, band 60 → 21 px, and where it used
to wander hold = 1 so `w_prior_i` = 4.1 and the excursion cannot be bought;
`buttery_pantry/S` has A = 43 (its ring says 23, its own perimeter says 43),
trust = 0.74, band stays open at 45, and its 50 px is still there.
The four named walls' worst offsets: 33 → 12, 59 → 4, 35 → 27, 52 → 6 px.

**And arched is now a shape, not a size.** `closet_chamber/S` stood 60 px off
its own chord and was called arched; what it was standing on was a moulding.
The verdict now asks four things of the head's deviation from its own chord —
convex (nothing dips inward), monotone curvature (single-signed over ≥85% of the
head, so an arc bends the same way everywhere and a flat-jump-flat head does
not), bulk (≥45% of samples raised past a quarter of the sagitta; a half-round
scores 0.85, a 100 px slot over a fifth of the width scores 0.37), and circular
(a fitted circle with residual ≤ max(2 px, 0.05 r) whose own sagitta over this
chord matches the measured one). All four, or it is straight.

## Rule 3 — a confidence that can fall

    wall_confidence = evidence × licence          (over the traced sides only —
                                                   the threshold is set geometry
                                                   and has no opinion)
    evidence = mean_i clip(absolute step under the loop / 30 levels, 0, 1)
    licence  = 1 / (1 + (E / 14)²)
    E        = rms_i of  hold_i · max(|offset_i|, |free_i|)

`free_i` is what the evidence ALONE would have chosen over the whole requested
band. It has to be there: rule 2's trust region now holds the bad walls in
place, and a confidence that only saw where the loop ended up would read that
restraint as a good trace. Weighted by `hold_i`, following a bad prior onto the
real reveal costs nothing and being tempted off good paint costs everything.

## The 31 walls, and what flipped

`absC` levels, `band` the trust region in px, `maxof`/`was` the worst traced-side
offset now and before, `exc` the grip-weighted excursion realised-or-wanted,
`conf`/`wasCf` the new per-wall confidence and the old mean sample confidence.

    room                 F  id       absC trust band maxof  was  exc  wasCf  conf  head      flags
    back_office          W  door01   51.9  1.00   60    21    21  8.1   0.80  0.72  straight  sill +26
    back_stair           W  op11     37.6  0.51   32    27    35 15.0   0.90  0.42  straight  KNOWN-BAD, crosses 0.5
    buttery_pantry       N  op16     33.7  0.36   24     5    43  1.8   0.96  0.52  straight
    buttery_pantry       S  op15     43.0  0.74   45    45    57  5.9   0.86  0.69  straight  Kabe's frame, 50 px kept
    closet_chamber       S  op20     41.0  0.65   40     4    59 33.5   0.86  0.13  straight  KNOWN-BAD, head arched->straight, sill +32
    dining_parlour       E  op03     15.0  0.01    4     4    51  6.0   1.00  0.23  straight  crosses 0.5
    dining_parlour       N  op06     19.5  0.04    6     6    60  3.0   1.00  0.38  straight  crosses 0.5
    entrance_court       E  op02     82.3  1.00   60     3     3  1.6   0.72  0.99  straight
    garden_room          E  op09     44.0  0.79   48     5    42 25.2   0.84  0.23  straight  crosses 0.5
    garden_room          S  op08     53.8  1.00   60     6    52 27.9   0.83  0.18  straight  KNOWN-BAD, crosses 0.5, sill +29
    great_hall           N  op10     21.0  0.06    8     3    45  0.8   0.91  0.49  straight  crosses 0.5
    great_hall           S  op01     15.7  0.01    5     5    10  2.4   0.80  0.35  straight  head arched->straight, crosses 0.5
    great_stair_hall     E  op04     40.7  0.64   40     4    23 10.0   0.91  0.60  straight
    guest_chamber        N  op20     58.2  1.00   60     6     6  4.9   0.80  0.86  straight
    guest_chamber        S  op19     28.0  0.20   15    13    13  4.4   0.90  0.58  straight
    kitchen              W  op02     65.2  1.00   60     5     5  5.7   0.90  0.81  straight
    library              E  op05     46.0  0.89   54    23    31  5.5   0.92  0.74  straight
    library              N  op08     36.3  0.46   30     5    19  4.9   0.96  0.70  straight
    master_bedchamber    N  op18     30.1  0.25   18     3    17  4.9   0.77  0.54  straight
    muniment_room        E  op25     32.1  0.31   21    12    33 20.4   0.89  0.27  straight  KNOWN-BAD, crosses 0.5
    muniment_room        W  op22     40.7  0.64   40    14    35  3.8   0.95  0.73  straight
    noodle_bar           E  door01   62.3  1.00   60     4     5  2.9   0.83  0.96  straight  sill +21
    privy_garden         S  op10     37.2  0.49   31    12    35  6.7   0.66  0.48  straight  head arched->straight, crosses 0.5
    servants_hall        S  op16    103.2  1.00   60     5     5  1.8   0.63  0.96  straight
    servants_hall        W  op12    135.8  1.00   60    24    24  0.8   0.85  1.00  straight
    servants_hall        W  op17     97.8  1.00   60     7     7  0.7   0.65  0.98  straight
    solar                E  op23     47.5  0.97   59    16    16  2.7   0.90  0.88  straight
    solar                E  op22     28.5  0.21   16    10    10  3.5   0.86  0.63  straight
    solar                W  op21     51.0  1.00   60    12    12  6.0   0.74  0.83  straight
    stair_landing        E  op21     43.9  0.78   48    24    30 12.3   0.84  0.54  straight
    stair_landing        N  op19     55.7  1.00   60     4    26 10.4   0.93  0.62  straight  head arched->straight

The four named walls score **0.42, 0.13, 0.18, 0.27** — all below 0.5, and the
nine walls that score above 0.8 are the nine whose loops sit on the paint
(`entrance_court/E` 0.99, `servants_hall` ×3 0.96/0.98/1.00, `noodle_bar/E`
0.96, `solar/E` op23 0.88, `guest_chamber/N` 0.86, `solar/W` 0.83,
`kitchen/W` 0.81). Ten walls now score below 0.5, six more than the four named:
`dining_parlour` ×2 and `great_hall/S` are walls whose absolute void-to-frame
step is 15–20 levels and on which no tracer should claim anything;
`garden_room/E`, `great_hall/N`, `privy_garden/S` were tempted 42/45/35 px onto
neighbouring paint and are being held there. That is the confidence doing its
job, not a regression.

Four heads flipped `arched` → `straight` — `closet_chamber/S`, `great_hall/S`,
`privy_garden/S`, `stair_landing/N`. Every one of them was an excursion with a
sagitta, not an arc; none of the 31 promoted door walls is arched, and the
synthetic half-round still reads arched at sagitta 0.334 of width with a circle
residual of 0.21 px.

## Where it is still not good enough, said plainly

`buttery_pantry/S` keeps its 50 px onto the real reveal at the head, but its
right jamb zigzags back to the void's edge over the middle third, because an
open door leaf stands in the opening and its edge is a real step. The loop is
following real paint both times; nothing in one wall's luminance says which of
the two lines is the jamb. `back_stair/W` is still 27 px out at its worst — its
absolute contrast is 38, high enough to leave the band at 32 px, and the prior's
grip where it moves is only 15 levels. It scores 0.42 and should be read as a
refusal rather than a measurement. And the threshold now trusts
`floor_line_y` completely: if a wall's declared floor line is wrong, the sill is
wrong with it, silently. Nothing is wired into promotion, the warp or the
renderer, by ruling.
