# Row 34 — the breakout evolution run

GENERATION 3 — 16 rolls, 4 arms, 2 walls, 2 rolls each

| arm | wall | adm | cam | d_horizon_px | d_horizon_any_px | sigma_best_px | withheld |
|---|---|---|---|---|---|---|---|
| g1 | garden_room/E | 1/2 | 2/2 | 4.0 | 445.05 | 44.14 | 0 |
| g1 | guest_chamber/E | 2/2 | 1/2 | 24.1 | 24.1 | 0.94 | 0 |
| g2 | garden_room/E | 2/2 | 2/2 | 16.75 | 16.75 | 0.77 | 0 |
| g2 | guest_chamber/E | 1/2 | 2/2 | 7.0 | 10.45 | 29.78 | 0 |
| g3 | garden_room/E | 0/2 | 1/2 | None | 214.45 | 127.59 | 0 |
| g3 | guest_chamber/E | 2/2 | 2/2 | 21.1 | 21.1 | 0.96 | 0 |
| g4 | garden_room/E | 1/2 | 1/2 | 22.1 | 126.45 | 14.38 | 0 |
| g4 | guest_chamber/E | 2/2 | 2/2 | 10.1 | 10.1 | 0.81 | 0 |

## Pooled, against the reference arm `g1`

Reference: **g1** — the declared control ran no cells in this generation - an ablation may legitimately run none - so the reference is the first arm in the id map's own order, which the generation's plan fixed before any candidate existed.

| arm | adm k/n | control k/n | margin | Fisher p | Holm thr | clears | split | separates |
|---|---|---|---|---|---|---|---|---|
| g2 | 3/4 | 3/4 | +0 | 0.785714 | 0.033333 | no | yes | no |
| g3 | 2/4 | 3/4 | -1 | 0.928571 | 0.100000 | no | yes | no |
| g4 | 3/4 | 3/4 | +0 | 0.785714 | 0.050000 | no | no | no |

MIN DETECTABLE EFFECT AT THIS N: 4 of 4 against 0 of 4 (margin +4, Fisher p 0.014286, Holm's tightest step 0.033333)

HEADLINE: NO SEPARATION

## Which register the geometry is written in

| figures | appearance | arm | adm k/n | d_horizon_px | reads |
|---|---|---|---|---|---|
| coordinates | no | g1 | 3/4 | 19.0 | the geometry as picture coordinates - the register that led both earlier generations |
| fractions | no | g2 | 3/4 | 7.0 | the same geometry as shares of the frame - no attributed evidence either way, so this is the first measurement of it |
| coordinates | yes | g4 | 3/4 | 13.0 | what the finished picture looks like, with the coordinates attached |
| none | yes | g3 | 2/4 | 21.1 | what the finished picture looks like, and no geometry figures at all |

This generation's cells are comparable TO EACH OTHER and NOT to earlier generations: the prompt-hygiene corrections moved under all of its arms at once, so any difference from an earlier table confounds the ablation with the hygiene.

PROMPTING EXHAUSTED CHECK: best measured rate 0.75 (g1). At that rate the verify-and-retry loop clears 95% of a hold family in 3 ask(s). If this generation named no arm that beats the incumbent under the standing discipline, prompting is exhausted and the residual routes to that loop and to the Captain's look - not to a fourth generation.

NOTE: the camera column is SECONDARY. Every arm asks for the same camera and all 21 hold-family walls already pass it, so a camera separation would be evidence about camera behaviour and not about the manipulation (row 23 §5.5, and it governs here).

NOTE: the instrument has no text_painted detector — 23-plan §5.4 named the flag and P0 never built it, and this row adds no detector. A painted label is a SILENT pass in these numbers. What guards the ask instead is prompt_lint.py plus a suite case asserting the no-lettering constraint is in every arm's prompt.

NOTE: the minimal-text arm is MINIMAL, not none: three body sentences plus the three header lines prompt_lint.py requires of every prompt in this project.

On a null: production law clause 5 — a change moving neither accuracy nor speed "is apparatus, and apparatus must argue for its life or be removed". A null across every generation puts this row's own machinery on trial, and this report says so in those words rather than burying it.

