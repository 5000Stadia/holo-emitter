# Row 34 — the breakout evolution run

GENERATION 1 — 18 rolls, 3 arms, 6 walls, 1 rolls each

| arm | wall | adm | cam | d_horizon_px | d_horizon_any_px | sigma_best_px | withheld |
|---|---|---|---|---|---|---|---|
| g4-production | entrance_court/S | 0/0 | 0/0 | None | None | None | 1 |
| g4-production | garden_room/E | 0/1 | 0/1 | None | None | None | 0 |
| g4-production | great_hall/S | 1/1 | 0/1 | 378.0 | 378.0 | 0.0 | 0 |
| g4-production | great_stair_hall/W | 1/1 | 1/1 | 39.3 | 39.3 | 4.89 | 0 |
| g4-production | guest_chamber/E | 0/1 | 1/1 | None | 370.6 | 63.99 | 0 |
| g4-production | master_bedchamber/N | 1/1 | 0/1 | 47.3 | 47.3 | 1.04 | 0 |
| g5 | entrance_court/S | 0/0 | 0/0 | None | None | None | 1 |
| g5 | garden_room/E | 1/1 | 0/1 | 18.0 | 18.0 | 1.15 | 0 |
| g5 | great_hall/S | 0/1 | 1/1 | None | 173.8 | 65.73 | 0 |
| g5 | great_stair_hall/W | 1/1 | 1/1 | 21.9 | 21.9 | 0.8 | 0 |
| g5 | guest_chamber/E | 0/1 | 1/1 | None | 1165.4 | 1098.88 | 0 |
| g5 | master_bedchamber/N | 1/1 | 1/1 | 199.2 | 199.2 | 12.97 | 0 |
| g5-noappendix | entrance_court/S | 0/0 | 0/0 | None | None | None | 1 |
| g5-noappendix | garden_room/E | 1/1 | 0/1 | 12.9 | 12.9 | 4.37 | 0 |
| g5-noappendix | great_hall/S | 1/1 | 1/1 | 100.6 | 100.6 | 1.07 | 0 |
| g5-noappendix | great_stair_hall/W | 1/1 | 1/1 | 60.1 | 60.1 | 6.42 | 0 |
| g5-noappendix | guest_chamber/E | 1/1 | 1/1 | 41.9 | 41.9 | 1.08 | 0 |
| g5-noappendix | master_bedchamber/N | 0/1 | 1/1 | None | 331.5 | 19.76 | 0 |

## Pooled, against the reference arm `g4-production`

Reference: **g4-production** — the declared control, which ran cells in this generation.

| arm | adm k/n | control k/n | margin | Fisher p | Holm thr | clears | split | separates |
|---|---|---|---|---|---|---|---|---|
| g5 | 3/5 | 3/5 | +0 | 0.738095 | 0.100000 | no | yes | no |
| g5-noappendix | 4/5 | 3/5 | +1 | 0.500000 | 0.050000 | no | yes | no |

MIN DETECTABLE EFFECT AT THIS N: 4 of 5 against 0 of 5 (margin +4, Fisher p 0.023810, Holm's tightest step 0.050000)

HEADLINE: NO SEPARATION

NOTE: the camera column is SECONDARY. Every arm asks for the same camera and all 21 hold-family walls already pass it, so a camera separation would be evidence about camera behaviour and not about the manipulation (row 23 §5.5, and it governs here).

NOTE: the instrument has no text_painted detector — 23-plan §5.4 named the flag and P0 never built it, and this row adds no detector. A painted label is a SILENT pass in these numbers. What guards the ask instead is prompt_lint.py plus a suite case asserting the no-lettering constraint is in every arm's prompt.

NOTE: the minimal-text arm is MINIMAL, not none: three body sentences plus the three header lines prompt_lint.py requires of every prompt in this project.

On a null: production law clause 5 — a change moving neither accuracy nor speed "is apparatus, and apparatus must argue for its life or be removed". A null across every generation puts this row's own machinery on trial, and this report says so in those words rather than burying it.

