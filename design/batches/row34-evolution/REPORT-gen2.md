# Row 34 — the breakout evolution run

GENERATION 2 — 24 rolls, 6 arms, 2 walls, 2 rolls each

| arm | wall | adm | cam | d_horizon_px | d_horizon_any_px | sigma_best_px | withheld |
|---|---|---|---|---|---|---|---|
| v3 | garden_room/E | 1/2 | 2/2 | 13.9 | 512.45 | 55.59 | 0 |
| v3 | guest_chamber/E | 1/2 | 2/2 | 14.6 | 1522.75 | 91.24 | 0 |
| v2A | garden_room/E | 0/2 | 2/2 | None | 311.35 | 129.76 | 0 |
| v2A | guest_chamber/E | 1/2 | 2/2 | 22.8 | 16.75 | 45.34 | 0 |
| v6A | garden_room/E | 2/2 | 2/2 | 33.15 | 33.15 | 1.34 | 0 |
| v6A | guest_chamber/E | 1/2 | 1/2 | 11.3 | 26.6 | 51.55 | 0 |
| v2xv6m2 | garden_room/E | 0/2 | 1/2 | None | 186.5 | 85.91 | 0 |
| v2xv6m2 | guest_chamber/E | 2/2 | 2/2 | 32.0 | 32.0 | 0.91 | 0 |
| v2xv6m4 | garden_room/E | 0/2 | 2/2 | None | 504.25 | 84.97 | 0 |
| v2xv6m4 | guest_chamber/E | 1/2 | 1/2 | 37.9 | 27.1 | 14.1 | 0 |
| v4 | garden_room/E | 1/2 | 2/2 | 450.0 | 486.9 | 34.41 | 0 |
| v4 | guest_chamber/E | 0/2 | 2/2 | None | 491.3 | 18.87 | 0 |

## Pooled, against the reference arm `v3`

Reference: **v3** — the declared control, which ran cells in this generation.

| arm | adm k/n | control k/n | margin | Fisher p | Holm thr | clears | split | separates |
|---|---|---|---|---|---|---|---|---|
| v2A | 1/4 | 2/4 | -1 | 0.928571 | 0.033333 | no | yes | no |
| v6A | 3/4 | 2/4 | +1 | 0.500000 | 0.020000 | no | no | no |
| v2xv6m2 | 2/4 | 2/4 | +0 | 0.757143 | 0.025000 | no | yes | no |
| v2xv6m4 | 1/4 | 2/4 | -1 | 0.928571 | 0.050000 | no | yes | no |
| v4 | 1/4 | 2/4 | -1 | 0.928571 | 0.100000 | no | yes | no |

MIN DETECTABLE EFFECT AT THIS N: 4 of 4 against 0 of 4 (margin +4, Fisher p 0.014286, Holm's tightest step 0.020000)

HEADLINE: NO SEPARATION

## Where does precision belong

[HUMAN, 2026-08-24] "Visual reference for visual orientation generalities, text for well defined articulation of anchored requirements and detail of the reference generalizations."

| precision lives in | bound? | arm | adm k/n | d_horizon_px | reads |
|---|---|---|---|---|---|
| image | - | v4 | 1/4 | 450.0 | the image carries everything; the words are three sentences |
| shared | loose | v3 | 2/4 | 14.25 | production: the image is asked for the camera to the pixel and the text restates some of it |
| shared | loose | v6A | 3/4 | 29.2 | v6 amplified: the returns constructed row by row as an instruction to draw |
| shared | scoped | v2xv6m4 | 1/4 | 37.9 | the camera in the text and the carriers still on the image, with the image demoted for the camera alone |
| both | full | v2xv6m2 | 2/4 | 32.0 | both channels at full strength: every number in the text AND the scaffold left primary |
| text | unbound | v2A | 1/4 | 22.8 | v2 amplified: the junction table and the wall's own metre grid, in figures |

NOTE: the camera column is SECONDARY. Every arm asks for the same camera and all 21 hold-family walls already pass it, so a camera separation would be evidence about camera behaviour and not about the manipulation (row 23 §5.5, and it governs here).

NOTE: the instrument has no text_painted detector — 23-plan §5.4 named the flag and P0 never built it, and this row adds no detector. A painted label is a SILENT pass in these numbers. What guards the ask instead is prompt_lint.py plus a suite case asserting the no-lettering constraint is in every arm's prompt.

NOTE: the minimal-text arm is MINIMAL, not none: three body sentences plus the three header lines prompt_lint.py requires of every prompt in this project.

On a null: production law clause 5 — a change moving neither accuracy nor speed "is apparatus, and apparatus must argue for its life or be removed". A null across every generation puts this row's own machinery on trial, and this report says so in those words rather than burying it.

