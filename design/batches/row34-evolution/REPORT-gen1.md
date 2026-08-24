# Row 34 — the breakout evolution run

GENERATION 1 — 28 rolls, 7 arms, 2 walls, 2 rolls each

| arm | wall | adm | cam | d_horizon_px | d_horizon_any_px | sigma_best_px | withheld |
|---|---|---|---|---|---|---|---|
| v1 | garden_room/E | 2/2 | 2/2 | 34.3 | 34.3 | 7.74 | 0 |
| v1 | guest_chamber/E | 0/2 | 1/2 | None | 997.9 | 682.54 | 0 |
| v2 | garden_room/E | 1/2 | 1/2 | 10.7 | 115.45 | 29.68 | 0 |
| v2 | guest_chamber/E | 2/2 | 1/2 | 13.6 | 13.6 | 0.99 | 0 |
| v3 | garden_room/E | 0/2 | 2/2 | None | 1406.65 | 78.55 | 0 |
| v3 | guest_chamber/E | 1/2 | 2/2 | 10.1 | 47.55 | 59.89 | 0 |
| v4 | garden_room/E | 0/2 | 2/2 | None | 401.75 | 34.94 | 0 |
| v4 | guest_chamber/E | 0/2 | 1/2 | None | 241.9 | 12.9 | 0 |
| v5 | garden_room/E | 0/2 | 2/2 | None | 1166.7 | 123.96 | 0 |
| v5 | guest_chamber/E | 1/2 | 1/2 | 10.2 | 604.75 | 510.25 | 0 |
| v6 | garden_room/E | 2/2 | 2/2 | 10.05 | 10.05 | 0.76 | 0 |
| v6 | guest_chamber/E | 1/2 | 2/2 | 23.3 | 199.3 | 12.63 | 0 |
| v7 | garden_room/E | 0/2 | 2/2 | None | 775.35 | 113.61 | 0 |
| v7 | guest_chamber/E | 0/2 | 1/2 | None | 194.3 | 135.65 | 0 |

## Pooled, against the reference arm `v3`

Reference: **v3** — the declared control, which ran cells in this generation.

| arm | adm k/n | control k/n | margin | Fisher p | Holm thr | clears | split | separates |
|---|---|---|---|---|---|---|---|---|
| v1 | 2/4 | 1/4 | +1 | 0.500000 | 0.025000 | no | yes | no |
| v2 | 3/4 | 1/4 | +2 | 0.242857 | 0.016667 | no | no | no |
| v4 | 0/4 | 1/4 | -1 | 1.000000 | 0.050000 | no | yes | no |
| v5 | 1/4 | 1/4 | +0 | 0.785714 | 0.033333 | no | no | no |
| v6 | 3/4 | 1/4 | +2 | 0.242857 | 0.020000 | no | no | no |
| v7 | 0/4 | 1/4 | -1 | 1.000000 | 0.100000 | no | yes | no |

MIN DETECTABLE EFFECT AT THIS N: 4 of 4 against 0 of 4 (margin +4, Fisher p 0.014286, Holm's tightest step 0.016667)

HEADLINE: NO SEPARATION

## Where does precision belong

[HUMAN, 2026-08-24] "Visual reference for visual orientation generalities, text for well defined articulation of anchored requirements and detail of the reference generalizations."

| precision lives in | bound? | arm | adm k/n | d_horizon_px | reads |
|---|---|---|---|---|---|
| image | - | v4 | 0/4 | None | the image carries everything; the words are three sentences |
| image | - | v5 | 1/4 | 10.2 | the image carries everything, redrawn as line art; production text |
| shared | loose | v3 | 1/4 | 10.1 | production: the image is asked for the camera to the pixel and the text restates some of it |
| shared | loose | v6 | 3/4 | 19.1 | production plus the verbal camera construction; both channels carry the camera |
| text | bound | v7 | 0/4 | None | THE RULED DIVISION: the image orients, the text articulates it element by element |
| text | unbound | v2 | 3/4 | 10.7 | the text carries every number standalone; the image is attached and demoted |
| text | none | v1 | 2/4 | 34.3 | the text carries everything; there is no layout image at all |

HEADLINE PAIRING — v7 (bound) 0/4 against v2 (unbound) 3/4. with every anchored number in the text either way, does binding the words to the image element by element beat running them beside it under a precedence rule

NOTE: the camera column is SECONDARY. Every arm asks for the same camera and all 21 hold-family walls already pass it, so a camera separation would be evidence about camera behaviour and not about the manipulation (row 23 §5.5, and it governs here).

NOTE: the instrument has no text_painted detector — 23-plan §5.4 named the flag and P0 never built it, and this row adds no detector. A painted label is a SILENT pass in these numbers. What guards the ask instead is prompt_lint.py plus a suite case asserting the no-lettering constraint is in every arm's prompt.

NOTE: the minimal-text arm is MINIMAL, not none: three body sentences plus the three header lines prompt_lint.py requires of every prompt in this project.

On a null: production law clause 5 — a change moving neither accuracy nor speed "is apparatus, and apparatus must argue for its life or be removed". A null across every generation puts this row's own machinery on trial, and this report says so in those words rather than burying it.

