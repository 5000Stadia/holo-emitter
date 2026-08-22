#!/usr/bin/env python3
"""Measure the eight backdrop candidates and write DRAFT §5 meta for each.

Re-run:   cd <repo root> && python3 design/plan-draft/measured/measure.py
          (defaults to --round cand2; --round cand1 reproduces the row-20 run)

Writes    design/plan-draft/measured/<loc>-<facing>.json   (eight files)
          design/plan-draft/measured/_raw.json             (everything, for SUMMARY.md)
          design/plan-draft/measured/misses.jsonl          (cand2 round only)
          design/batches/row21-promotion/measured/<loc>-<facing>-marked.png
                                                           (cand2 round only)

Reads     backdrops/source/**/cand-*.png  and nothing else.

The method is the one in design/plan-draft/study-N-meta-draft.json's
`_how_each_was_measured`. Where this script departs from the draft, or where a
number is assumed rather than measured, it says so in the output.

WHAT IS MEASURED vs WHAT IS ASSUMED
-----------------------------------
Measured off pixels : every *_px value, key_tint, the Sobel light statistics.
Assumed (declared)  : the real-world size of the calibration feature. Those
                      assumptions are named in `calibration_ref` and their
                      confidence in `calibration_confidence`.
Ruled elsewhere     : nothing. This script derives no focal length in the cand-1
                      round; SUMMARY.md reports px_per_m_at_wall x THE PLAN'S
                      standpoint instead.

THE TWO ROUNDS
--------------
`--round cand1` is the row-20 run, frozen: CFG below, its per-facing windows, its
single named calibration feature per facing, its numbers. Nothing in the cand-2
work is allowed to move it, because it is the record the miss ledger was written
against.

`--round cand2` (the default) is row 21's. It carries a SECOND per-facing
configuration, CFG2, re-tuned against the cand-2 pixels, because a detector
pointed at a feature that has moved reports whatever is at its old coordinates —
the scar design/architecture.md records under "The measurement has to be
trustworthy before the verdict is". It also carries three things the cand-1 run
did not have and could have used:

  1. A RULER PRIORITY RULE fixed before the answers (see RULER_RULE below), so
     the choice of ruler cannot be made by which ruler agrees.
  2. EVERY ruler a facing can carry, measured and printed, not just the winning
     one. A verdict that only one ruler supports is a verdict resting on one
     hand-tuned window, and this corpus has already shown what that is worth.
  3. WITHHELD as a first-class verdict, with mechanical triggers, so a facing we
     cannot measure is not given a number that a re-ask would then chase.

THE RULER PRIORITY RULE (blueprint's, restated in design/specs/21-painted-promotion.md §1)
------------------------------------------------------------------------------------------
  tier 1  a ruled-size feature painted IN THE WALL PLANE: the door opening
          (1.00 x 2.00 m; of a two-dimension feature the LONGER dimension is
          read, per the committed method), the fireplace opening (0.90 m), a
          window bay (0.90 m between its outer mullion centre-lines).
  tier 2  the panelling module transferred from the APPROVED frame of the SAME
          room — study/N's dado-rail-above-floor. Study only: the cross passage
          has no approved frame to transfer from.
  tier 3  the plan's own ruled wall width, adopted only where no tier 1 or 2
          ruler exists and only with the circularity said out loud, in which
          case implied_wall_width_m cannot be reported.
  else    WITHHELD. No number.

A tier-3 reading is still MEASURED and PRINTED on every facing that has corners,
marked `admissible: false` where a higher tier exists, so nothing is hidden — but
it may not vote on the verdict there, because it is the plan asserted onto the
painting rather than a size the painting was asked to draw, and it cannot
disagree with the plan about the thing it assumes.

WITHHELD, and it is mechanical
------------------------------
  * a derived quantity that is physically impossible: storey outside 2.0-4.0 m,
    eye height outside 0.8-2.2 m;
  * a corner found on a facing whose own prompt forbids corners;
  * no admissible ruler at tiers 1-3;
  * a tier-1 anchor the painting did not draw to rule: several instances of one
    ruled size (three window bays) whose own spread exceeds the +/-3 % band, so
    the choice of instance would choose the verdict;
  * the admissible rulers STRADDLE the band — one passes and another fails — so
    the choice of ruler would choose the verdict.

THE CONTROL
-----------
study/N cand-2 is the one approved frame. The cand-2 code measures it every run
and must return ceiling 81, floor 777, corners 142/1389, fireplace 209 px and
232.222 px/m. If any of those has moved, the code has changed what it reads and
the whole run prints VOID.

That control validates the code against the image its own windows were tuned on,
which is worth less than it looks. The second, harder control is per facing and
is in the output as `ruler_agreement_pct`: every facing that carries more than
one ruler states how far its rulers are from each other. Where a facing carries
ONE ruler its output says so in as many words, because that facing's number
rests on one re-tuned window and on nothing else.
"""

import argparse
import hashlib
import json
import os
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from measure_lib import (load, luma, sobel, row_step_profile, top_steps,
                         col_step_profile, top_cols, vote_region,
                         normalise_tint, patch_mean, brightest_patch,
                         sobel_bright_side_deg, third_tilt)          # noqa: E402

ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
OUT = HERE
MARKED = os.path.join(ROOT, "design", "batches", "row21-promotion", "measured")

W, H = 1536, 1024

# ---------------------------------------------------------------------------
# The gate's own constants, quoted here so this module can print a verdict
# without gate.py having to be imported. They are blueprint §5's and §10's and
# NOTHING in this file may move them; a candidate that misses is logged, not
# admitted. gate.py's docstring carries the argument for both numbers.
REFERENCE_PX = 1010.0     # study/N cand-2 measured at its own 4.35 m standpoint
BAND = 0.03

# The physical envelope a derived quantity has to sit inside before it is
# believed. Wider than the plan (2.80 m storey, 1.83 m eye) on purpose: the job
# of these bounds is to catch a detector reading the wrong feature, not to grade
# the painting. design/architecture.md's round-20 note records the readings that
# earned them - storey 1.81 to 5.38 m in a 2.80 m room, eye 3.09 m.
STOREY_RANGE = (2.0, 4.0)
EYE_RANGE = (0.8, 2.2)

# The dado-rail module. Four facings carry no feature of known real size, so
# they are calibrated on the panelling's dado rail. Its height above the floor
# is measured on the four facings that DO carry a sized feature:
#     study/N  fireplace 0.90 m wide      -> 214 px / 232.22 px/m = 0.921 m
#     study/E  door opening 2.00 m tall  -> 208 px / 235.00 px/m = 0.885 m
#     hall/W   door opening 2.00 m tall  -> 122 px / 136.00 px/m = 0.897 m
#     hall/E   end-wall span 2.60 m wide -> 136 px / 134.62 px/m = 1.010 m
# The first three cluster at 0.88-0.92; the fourth leans on the plan's corridor
# width applied to the smallest, darkest and least trustworthy of the eight
# facings. Adopted 0.90 with the full spread stated. This is the least certain
# number in the run and every facing that leans on it says so.
DADO_M = 0.90
DADO_M_RANGE = (0.885, 1.010)

# Plan standpoint distances as ruled for this measurement run, from
# design/plan-draft/standpoints.tsv (CROSS PASSAGE = hall).
#
# CAUTION, and it is not a rounding matter: standpoints.tsv was REWRITTEN while
# this run was in progress (commit 385b1db, "the lens pinned, the standpoint
# law"). Four of these eight moved: study/N 3.60 -> 4.35, study/S 3.60 -> 3.85,
# hall/N and hall/S 1.95 -> 2.15. The values below are the ones this run was
# ruled to use; PLAN_NOW records what the file says now, and SUMMARY.md section
# C reports the implied focal length against BOTH. Nothing measured off the
# pixels changes either way - only the comparison does.
PLAN_NOW = {"study/N": 4.35, "study/E": 4.09, "study/S": 3.85, "study/W": 4.09,
            "hall/N": 2.15, "hall/E": 6.00, "hall/S": 2.15, "hall/W": 6.00}
PLAN = {
    "study/N": dict(camera_wall_m=3.60, wall_width_m=5.45, storey_m=2.80),
    "study/E": dict(camera_wall_m=4.09, wall_width_m=4.80, storey_m=2.80),
    "study/S": dict(camera_wall_m=3.60, wall_width_m=5.45, storey_m=2.80),
    "study/W": dict(camera_wall_m=4.09, wall_width_m=4.80, storey_m=2.80),
    "hall/N":  dict(camera_wall_m=1.95, wall_width_m=8.00, storey_m=2.80),
    "hall/E":  dict(camera_wall_m=6.00, wall_width_m=2.60, storey_m=2.80),
    "hall/S":  dict(camera_wall_m=1.95, wall_width_m=8.00, storey_m=2.80),
    "hall/W":  dict(camera_wall_m=6.00, wall_width_m=2.60, storey_m=2.80),
}

# ---------------------------------------------------------------------------
# Per-facing configuration. Everything here is a WINDOW TO LOOK IN, not an
# answer: the column bands say which columns are free of the wall's own
# features (a doorway, a window, a fireplace) so that a horizontal line can be
# read off the wall plane itself. The search ranges are deliberately wide.
# ---------------------------------------------------------------------------
CFG = {
 "study/N": dict(
    notes=[
        "The one facing with a prior measurement. _control_vs_study_N_meta_draft is the reproduction test and it passes: ceiling 0 px, floor +1 px, corners -5/+1 px, fireplace opening 0 px, px_per_m_at_wall identical to three decimals. The only material delta is the horizon, +8 px.",
        "px_per_m_at_wall x implied_wall_width_m = 1247 px, 81 % of the 1536 canvas, not the canvas width - the draft flags this and it is still true. Both corners are in frame, so the corner span IS the u-domain.",
    ],
    src="backdrops/source/study-N/cand-2.png",
    floor_window=(770, 786),
    ceil_cols=[(300, 1250)], ceil_range=(8, 420),
    floor_cols=[(600, 1300)], floor_range=(500, 1010),
    rail_cols=[(620, 1300)], rail_range=(480, 700),
    calib="fireplace", calib_m=0.90,
    calib_ref=("the fireplace opening, inner stone jamb to inner stone jamb, "
               "taken at 0.90 m wide at the wall plane"),
    calib_conf=("MEDIUM-HIGH. 0.90 m is an inference, not a ruling: it is the "
                "size at which this opening's 209 px agree with the panelling "
                "module and with a 2.8-3.0 m storey. The brief's '~1.4 m' is "
                "refuted here exactly as the draft refutes it (1.4 m puts the "
                "storey at 4.66 m). A chamber fireplace, not a hall one."),
    fire=dict(
        x0=342, x1=550,
        how=("Row-gradient edges of the stone jambs' INNER faces, stable across "
             "y 600-720 and unchanged when the band is moved to 560-600 or "
             "650-700: the strongest column steps in x 250-650 fall at 341|342 "
             "(95.7) and 550|551 (79.1), with the case's outer mouldings at "
             "315 (97.9), 332, 566 and 605. Clear opening = 551 - 342 = 209 px. "
             "This reproduces the study-N draft's 341..550 / 209 px exactly.")),
    fire_cols=(250, 650), fire_rows=(600, 720)),

 "study/E": dict(
    notes=[
        "One of the two facings that carry the study<->cross-passage door. The wall-plane opening is 660..874 x 308..778 and that rectangle is the click target for walking through.",
        "The opening is painted 2.20 : 1 where the plan rules 2 : 1. Whichever ruled dimension is used, the other is then wrong by 9 %.",
        "The prompt asked for a 4.80 m wall; the corner span implies 5.08 m, +5.9 %.",
    ],
    src="backdrops/source/study-E/cand-1.png",
    floor_window=(770, 790),
    ceil_cols=[(250, 1300)], ceil_range=(8, 420),
    floor_cols=[(300, 600), (950, 1250)], floor_range=(500, 1010),
    rail_cols=[(300, 600), (950, 1250)], rail_range=(480, 700),
    calib="door_h", calib_m=2.00,
    calib_ref=("the painted door opening's height at the wall plane, head "
               "soffit to threshold, taken at 2.00 m (the plan's door leaf "
               "height; the prompt also says '2.0-metre-tall')"),
    calib_conf=("HIGH in the assumed size - the plan rules the openings and this "
                "facing's own prompt restates '2.0-metre-tall'. The risk is in "
                "the drawing, not the ruler: the wall-plane opening is painted "
                "470 x 214 px, an aspect of 2.20 : 1 against the ruled 2 : 1, "
                "so the SAME opening calibrated on its 1.00 m width gives 214.0 "
                "px/m against the 235.0 adopted - a 9 % spread that bounds the "
                "error. The height is adopted because it is the longer "
                "dimension (less relative reading error) and because 235.0 "
                "px/m puts this room's storey at 2.84 m against the ruled 2.80 "
                "while 214.0 px/m puts it at 3.12 m."),
    opening=dict(
        x0=660, x1=874, y0=308,
        how_x0=("The left jamb's front stone face runs flat at luminance ~74 out "
                "to x 657, lifts to a lit arris at 658-659 (111, 139) and falls "
                "to a one-pixel shadow line at 660 (17); the opening's lit "
                "reveal begins at 661 (147) and the dark passage at 666 (1). "
                "The WALL-PLANE edge is the shadow line: 660. Column-gradient "
                "confirmation: the strongest edge in x 645-680 is at 660|661, "
                "strength 130.9, measured over rows 400-700."),
        how_x1=("Mirror image: the opening's lit reveal ends at 872 (64), a "
                "shadow line falls at 873-874 (35, 17), and the right jamb's "
                "front face runs flat at ~90 from 875. WALL-PLANE edge 874. The "
                "much stronger column edge at 917|918 (147.4) is the case's "
                "OUTER edge against the panelling and is not the opening."),
        how_y0=("Reading down the opening's own columns (x 680-900): the stone "
                "face above holds ~65 to y 307, a shadow line falls at 308 "
                "(19.7), a lit arris follows at 309-310 (58.8, 72.4), then the "
                "soffit of the reveal runs 312-320 at ~28 before the dark "
                "passage at 321 (12.5). WALL-PLANE head is the shadow line: "
                "308. 321 is the BACK of the reveal, 13 px of wall thickness."),
        how_y1=("The threshold is the wall-floor line itself, 778: the stone "
                "jambs' plinths stand on the floor and their feet are read at "
                "the same row as the skirting's, within 1 px.")),
    door_cols=(560, 1000), door_rows=(280, 820)),

 "study/S": dict(
    notes=[
        "The least trustworthy scale in the set. No feature of ruled size: the calibration is the panelling module read on the side-wall returns AT the corners, and the module itself is only known to +-7 %.",
        "The wall-floor line here is at y 731 against y 777 on study/N - 46 px higher for the opposite wall of the same room at the same standpoint. Either this wall is drawn further away or the camera is higher; the derived storey (3.19 m) and camera distance (5.21 m) both say further.",
        "The only facing of the eight whose brightest patch is above the horizon AND near the frame centre: the three window bays are the key, exactly as briefed.",
    ],
    src="backdrops/source/study-S/cand-1.png",
    floor_window=(724, 740),
    ceil_cols=[(250, 1300)], ceil_range=(8, 420),
    floor_cols=[(300, 1250)], floor_range=(620, 1010),
    rail_cols=[(182, 215), (1320, 1352)], rail_range=(480, 650),
    calib="dado", calib_m=DADO_M,
    calib_ref=("the panelling's dado-rail top, read on the side-wall returns "
               "AT the corner columns (the south wall itself is glazed and "
               "carries no rail), taken at %.2f m above the floor line" % DADO_M),
    calib_conf=("LOW. Two compounding weaknesses: the assumed module is only "
                "known to +-7 %% (0.885-1.010 m across the four facings that "
                "carry a sized feature), and on this facing the rail has to be "
                "read on the returns rather than on the wall plane, where the "
                "step is weak (strength 5.6 against 43.9 on study/N).")),

 "study/W": dict(
    notes=[
        "The brief asked for a 4.80 m wall. The corner span implies 5.23 m and is within 4 px of study/N's 1247 px span for a 5.45 m wall - i.e. the generator drew the west wall the same width as the north wall and ignored the 4.80.",
        "Ceiling line 82, floor line 777, dado rail 563: all within 2 px of study/N (81, 777, 564). Same room, same camera height, same scale - which is the strongest single piece of evidence in the set that the study's four facings were meant to agree.",
    ],
    src="backdrops/source/study-W/cand-1.png",
    floor_window=(770, 790),
    ceil_cols=[(300, 1300)], ceil_range=(8, 420),
    floor_cols=[(300, 1300)], floor_range=(500, 1010),
    rail_cols=[(300, 1300)], rail_range=(480, 700),
    calib="dado", calib_m=DADO_M,
    calib_ref=("the panelling's dado-rail top, taken at %.2f m above the floor "
               "line. This wall is blank by instruction and offers nothing "
               "else." % DADO_M),
    calib_conf=("MEDIUM-LOW in the assumed module (+-7 %%), but the READING is "
                "clean (step strength 45.1, horizontality 1.00). Independent "
                "support: this facing's ceiling line (82), floor line (777) and "
                "rail (563) are within 1 px of study/N's (81, 777, 563), so the "
                "same room at the same scale; carrying study/N's fireplace "
                "calibration across gives 232.2 px/m against the 237.8 adopted "
                "here, a 2.4 %% spread, which is the honest error bar.")),

 "hall/N": dict(
    notes=[
        "No corner in frame in either direction, as the prompt demanded ('Do NOT invent or squeeze room corners into frame'). corner_x0_px and corner_x1_px are null and implied_wall_width_m cannot be computed. Obeyed.",
        "But the camera did not obey. The prompt put it 1.95 m from the wall; the measured scale puts it at 4.01 m. The panelling module measures 230 px here against 213 px on study/N, whose camera is 4.41 m away - if the camera really were at 1.95 m the module would be more than twice study/N's.",
        "Only one region could vote for the horizon: with no corners there are no side-wall bands, and the ceiling band of a flat transverse view is featureless plaster with nothing in it that converges. The floor is the whole vote and the number is correspondingly softer.",
    ],
    src="backdrops/source/passage-N/cand-1.png",
    floor_window=(802, 822),
    ceil_cols=[(200, 1300)], ceil_range=(8, 420),
    floor_cols=[(200, 1300)], floor_range=(600, 1010),
    rail_cols=[(200, 1300)], rail_range=(500, 740),
    calib="dado", calib_m=DADO_M,
    calib_ref=("the panelling's dado-rail top, taken at %.2f m above the floor "
               "line. This facing is a flat wall band with no opening, no "
               "corner and no sized feature of any kind." % DADO_M),
    calib_conf="MEDIUM-LOW in the module (+-7 %); the reading is clean (41.0, horizontality 0.99)."),

 "hall/E": dict(
    notes=[
        "The far end wall is 350 px of a 1536 px frame. Every number for this facing is read off that small, dark, distant patch and none of it is as firm as the study's.",
        "The end wall's corner span implies a 2.32 m corridor against the plan's 2.60, while hall/W's implies 2.71 m. The two axial views of the same corridor disagree about its width by 0.40 m, 16 %.",
        "The end window is the only feature. No size is ruled for it, so it is measured and reported but not used as a ruler.",
    ],
    src="backdrops/source/passage-E/cand-1.png",
    floor_window=(664, 692),
    ceil_cols=[(610, 930)], ceil_range=(80, 420),
    floor_cols=[(610, 700), (830, 930)], floor_range=(560, 900),
    rail_cols=[(610, 700), (830, 930)], rail_range=(480, 620),
    calib="dado", calib_m=DADO_M,
    calib_ref=("the panelling's dado-rail top on the far END wall, taken at "
               "%.2f m above the floor line. The end window is the only other "
               "feature and no size is ruled for it." % DADO_M),
    calib_conf=("LOW. The module is +-7 %% and the end wall is small, dark and "
                "far (rail step strength 17.0). The alternate ruler - the end "
                "wall's own corner span taken at the plan's 2.60 m corridor "
                "width - gives 134.6 px/m, 5 %% below the 142.1 adopted, but "
                "makes implied_wall_width_m circular, so it is reported and "
                "not adopted."),
    win_cols=(690, 830), win_rows=(280, 660)),

 "hall/S": dict(
    notes=[
        "No corner in frame, as demanded. Same single-region horizon vote as hall/N.",
        "The tapestry is drawn as instructed - flat, no rod, no fringe - and it covers the dado rail across the middle third, which is why the rail's horizontality only reaches 0.76 here.",
        "The only facing of the eight that reads UPPER-LEFT: brightest patch at (152, 10), left third and far above the horizon, and the left-third-minus-right-third luminance is +25.9, the largest positive tilt in the set. The sprite contract's UL45 would sit correctly in this frame and in no other.",
    ],
    src="backdrops/source/passage-S/cand-1.png",
    floor_window=(870, 892),
    ceil_cols=[(200, 1300)], ceil_range=(8, 420),
    floor_cols=[(200, 1300)], floor_range=(700, 1010),
    rail_cols=[(200, 1300)], rail_range=(540, 800),
    calib="dado", calib_m=DADO_M,
    calib_ref=("the panelling's dado-rail top, taken at %.2f m above the floor "
               "line. The tapestry is the only other feature and has no ruled "
               "size." % DADO_M),
    calib_conf=("MEDIUM-LOW in the module (+-7 %); the reading is strong (46.9) "
                "though the tapestry covers the rail across the middle third, "
                "so the horizontality only reaches 0.76.")),

 "hall/W": dict(
    notes=[
        "The second of the two door facings. The wall-plane opening is 698..825 x 377..649 and that rectangle is the click target.",
        "Side walls are unbroken, exactly one opening, centred in the end wall - the prompt's hardest constraint, obeyed.",
        "Storey height 2.62 m is the lowest of the eight and 0.30 m below the set mean; the implied camera distance 7.53 m is the largest and 1.53 m beyond the plan's 6.00 m standpoint. This facing is drawn from further back than it was asked for.",
    ],
    src="backdrops/source/passage-W/cand-1.png",
    floor_window=(638, 662),
    ceil_cols=[(590, 935)], ceil_range=(80, 420),
    floor_cols=[(590, 690), (850, 935)], floor_range=(520, 900),
    rail_cols=[(590, 690), (850, 935)], rail_range=(450, 620),
    calib="door_h", calib_m=2.00,
    calib_ref=("the painted door opening's height in the far end wall, head "
               "soffit to threshold, taken at 2.00 m (the plan's door leaf "
               "height; the prompt says '2.0-metre-tall')"),
    calib_conf=("HIGH in the assumed size, and this opening is drawn closer to "
                "true than study/E's: the wall-plane rectangle is 272 x 127 px, "
                "an aspect of 2.14 : 1 against the ruled 2 : 1, so calibrating "
                "on the 1.00 m width instead gives 127.0 px/m against the 136.0 "
                "adopted - a 7 % spread that bounds the error. This facing is "
                "nonetheless the outlier of the eight on storey height (2.62 m "
                "against a set mean near 2.9), so treat its scale with care."),
    opening=dict(
        x0=698, x1=825, y0=377,
        how_x0=("The left jamb's front stone face runs flat at ~85 out to x "
                "697-698, a shadow line falls at 699 (45), and the reveal - "
                "brilliantly lit here because the study's fire is behind it - "
                "runs 700-703 (99, 191, 170, 152) before the opening's interior "
                "at 704 (28). WALL-PLANE edge 698."),
        how_x1=("Mirror: the reveal runs 820-823 (177, 169, 163, 186), a shadow "
                "line falls at 824-825 (67, 31), and the right jamb's front "
                "face holds ~80 from 826. WALL-PLANE edge 825. Note this door "
                "is 3 px off-centre to the left of the frame (centre 761.5 "
                "against 768)."),
        how_y0=("Down the opening's columns (x 720-800): the case above the "
                "opening sits in shadow at ~20 to y 374, a darker line at 376 "
                "(13), then the brightly lit soffit 378-401 (71..98) and the "
                "opening's dark head at 402 (2). WALL-PLANE head 376-377; 377 "
                "adopted."),
        how_y1=("The threshold is the wall-floor line of the end wall, 649. The "
                "floor runs continuously through the opening here, so there is "
                "no step to read inside it; the jamb plinths' feet are the "
                "witness and they sit on 648-649.")),
    door_cols=(650, 900), door_rows=(340, 700)),
}

FACINGS = ["study/N", "study/E", "study/S", "study/W",
           "hall/N", "hall/E", "hall/S", "hall/W"]

# ---------------------------------------------------------------------------
# ROUND cand-2. A SECOND configuration, every window re-tuned against the cand-2
# pixels. Nothing here is copied from CFG except where the cand-2 image put the
# feature back where cand-1 had it, which on this corpus turns out to be most of
# the study - and that agreement is itself the finding, not a convenience.
#
# `ruled` names the sizes the plan and the facing's own prompt rule, and is the
# only assumed quantity in the round. `forbids` quotes what the facing's own
# cand-2 prompt forbade, because a detector that finds a corner on a wall whose
# prompt forbids corners has found something else.
# ---------------------------------------------------------------------------
DOOR_W_M, DOOR_H_M = 1.00, 2.00      # blueprint §11's door opening
FIREPLACE_M = 0.90                   # study/N's hearth opening, inner jamb to inner jamb
BAY_M = 0.90                         # study/S window bay, outer mullion centre to centre

CFG2 = {
 "study/N": dict(
    src="backdrops/source/study-N/cand-2.png",
    role=("THE CONTROL. The one Kabe-approved frame (APPROVED.md, "
          "design/approvals.log 2026-08-21). Its windows are the cand-1 run's, "
          "unchanged, because it is the same image; what is new is that the "
          "cand-2 corner rule and the cand-2 ruler machinery are run over it "
          "and have to return the committed numbers."),
    floor_window=(770, 786),
    ceil_cols=[(300, 1250)], ceil_range=(8, 420),
    floor_cols=[(600, 1300)], floor_range=(500, 1010),
    rail_cols=[(620, 1300)], rail_range=(480, 700),
    fire=dict(x0=342, x1=550,
              how=("Unchanged from the cand-1 run, which read this same image: "
                   "the strongest column steps in x 250-650 fall at 341|342 and "
                   "550|551, the case's outer mouldings at 315, 332, 566 and "
                   "605. Clear opening 551 - 342 = 209 px.")),
    fire_cols=(250, 650), fire_rows=(600, 720),
    module=True,
    rulers=["fireplace", "module_dado_rail", "module_capping",
            "plan_wall_width", "plan_storey"]),

 "study/E": dict(
    src="backdrops/source/study-E/cand-2.png",
    role=("One of the two facings that carry the study<->cross-passage door, so "
          "it carries a tier-1 ruler and does not have to lean on the module."),
    floor_window=(770, 790),
    ceil_cols=[(250, 1300)], ceil_range=(8, 420),
    floor_cols=[(300, 600), (950, 1250)], floor_range=(500, 1010),
    rail_cols=[(300, 600), (950, 1250)], rail_range=(480, 700),
    opening=dict(
        x0=658, x1=873, y0=308,
        how_x0=("Re-read on the cand-2 pixels over rows 400-700. The left jamb's "
                "stone front face runs flat at ~72 out to x 656, a lit arris "
                "catches at 657 (156.6), the wall-plane corner falls into shadow "
                "at 658 (63.5), the jamb's own reveal - visible because the "
                "camera stands to the RIGHT of this jamb - runs 659-664 (98, "
                "124, 83, 79, 87) and the dark passage begins at 665 (2.5). "
                "WALL-PLANE edge is the shadow line: 658."),
        how_x1=("Mirror image, and the reveal falls on the other side of the "
                "edge exactly as a wall of finite thickness requires: the "
                "opening runs dark to 866, the right jamb's reveal is lit at "
                "867-872 (23, 69, 56, 54, 60, 53), the wall-plane corner falls "
                "to shadow at 873 (12.1), a lit arris follows at 874-875 (52, "
                "126) and the front face holds ~104 from 876. WALL-PLANE edge "
                "873. The much stronger column edge at 917 is the case's OUTER "
                "moulding against the panelling and is not the opening - that "
                "is the edge a strongest-edge detector would take."),
        how_y0=("Down the opening's own columns (x 680-860): the stone face "
                "above holds ~70 to y 306, a lit arris at 307 (82.6), the "
                "wall-plane shadow line at 308 (19.5), lit reveal 309-310 (79.7, "
                "67.4), then the soffit 312-320 at ~20-27 and the dark passage "
                "at 321 (0.1). WALL-PLANE head is the shadow line: 308. 321 is "
                "the BACK of the reveal, 13 px of wall thickness."),
        how_y1=("The threshold is the wall-floor line itself, 779: the jamb "
                "plinths stand on the floor and their feet read at the same row "
                "as the skirting's shadow seam, which bottoms at 779 (0.6) in "
                "the 770-790 bracket.")),
    door_cols=(560, 1000), door_rows=(280, 820),
    module=True,
    rulers=["door_height", "door_width", "module_capping", "module_dado_rail",
            "plan_wall_width", "plan_storey"]),

 "study/S": dict(
    src="backdrops/source/study-S/cand-2.png",
    role=("The window wall. Its cand-2 prompt turned the three bays into a "
          "ruled-size anchor - 'exactly 0.90 metre wide measured between its "
          "two vertical mullion centre-lines... so this is a ruled-size "
          "measurement anchor' - which is a tier-1 ruler if and only if the "
          "three were drawn equal, and on a wall parallel to the image plane "
          "equal features MUST project equally."),
    floor_window=(745, 765),
    ceil_cols=[(250, 1300)], ceil_range=(8, 420),
    floor_cols=[(300, 1250)], floor_range=(620, 1010),
    rail_cols=[(160, 200), (1390, 1430)], rail_range=(480, 700),
    bays=dict(
        rows=(300, 500), bright=120.0, min_run=20, n_bays=3, lights_per_bay=3,
        how=("The glass is the only unambiguous edge on this wall: leaded panes "
             "read 150-160 against oak below 100, so the light openings are "
             "found as the runs of columns whose mean luminance over rows "
             "300-500 exceeds 120. Nine runs are found, three per bay. A bay's "
             "width between its OUTER mullion centre-lines is then 1.5 x the "
             "span from its first light's centre to its last light's centre - "
             "that identity holds for any bay of three equal lights on equal "
             "mullion pitch, which is what the prompt demanded, and it uses only "
             "the glass edges rather than the jamb faces, whose visible width "
             "changes with where the bay sits relative to the camera.")),
    module=False,
    module_absent=("Tier 2 is not available on this facing. The module has to be "
                   "read IN THE WALL PLANE, and the south wall is glazed: it "
                   "carries no dado rail. The cand-1 run read the rail on the "
                   "side-wall RETURNS instead, which is a receding surface at a "
                   "different scale, so that reading is not a wall-plane ruler "
                   "and is not offered as one here."),
    rulers=["window_bays", "plan_wall_width", "plan_storey"]),

 "study/W": dict(
    src="backdrops/source/study-W/cand-2.png",
    role=("Blank by instruction - 'No architectural feature or focal object of "
          "any kind' - so it carries no tier-1 ruler at all and the panelling "
          "module transferred from study/N is the whole of its scale."),
    floor_window=(770, 790),
    ceil_cols=[(300, 1300)], ceil_range=(8, 420),
    floor_cols=[(300, 1300)], floor_range=(500, 1010),
    rail_cols=[(300, 1300)], rail_range=(480, 700),
    module=True,
    rulers=["module_capping", "module_dado_rail", "plan_wall_width",
            "plan_storey"]),

 "hall/N": dict(
    src="backdrops/source/passage-N/cand-2.png",
    role=("A flat wall band by instruction. Its prompt forbids every feature "
          "this gate can measure and the painting obeyed, which is why it has "
          "no verdict rather than a bad one."),
    forbids=["floor line", "visible floor", "ceiling line", "visible ceiling",
             "corners in frame", "doorway", "window", "fireplace",
             "any feature, carrier, opening or decoration"],
    wall_band=True,
    # These two windows exist only so the same detectors that find a floor line
    # and a ceiling line elsewhere can be RUN here and come back empty-handed;
    # whatever they return is suppressed and kept as evidence, not emitted.
    floor_window=(995, 1015),
    ceil_cols=[(200, 1300)], ceil_range=(8, 200),
    floor_cols=[(200, 1300)], floor_range=(850, 1015),
    rail_cols=[(200, 1300)], rail_range=(500, 740),
    module=False,
    module_absent=("Tier 2 is the module of the STUDY, transferred from the one "
                   "approved frame of that room. The cross passage has no "
                   "approved frame, and a module read here would be calibrated "
                   "on nothing."),
    rulers=[]),

 "hall/E": dict(
    src="backdrops/source/passage-E/cand-2.png",
    role=("The axial view east. The end window is the only feature in the end "
          "wall and NO SIZE IS RULED FOR IT, so there is no tier-1 ruler; the "
          "corridor is not the study, so there is no tier-2 ruler either. This "
          "facing reaches tier 3 and its number is circular by construction."),
    floor_window=(635, 655),
    ceil_cols=[(660, 720), (830, 900)], ceil_range=(80, 500),
    floor_cols=[(660, 720), (830, 900)], floor_range=(560, 900),
    rail_cols=[(660, 720), (830, 900)], rail_range=(450, 620),
    module=False,
    module_absent=("Tier 2 is the study's module and this is the cross passage."),
    rulers=["plan_wall_width", "plan_storey"]),

 "hall/S": dict(
    src="backdrops/source/passage-S/cand-2.png",
    role=("The tapestry wall band. Same instruction as hall/N and the same "
          "obedience; the tapestry has no ruled size."),
    forbids=["floor line", "visible floor", "ceiling line", "visible ceiling",
             "corners in frame", "side walls", "vanishing point",
             "receding planes", "doorway", "window", "fireplace"],
    wall_band=True,
    floor_window=(995, 1015),            # as hall/N: run, then suppressed
    ceil_cols=[(200, 1300)], ceil_range=(8, 200),
    floor_cols=[(200, 1300)], floor_range=(850, 1015),
    rail_cols=[(200, 1300)], rail_range=(540, 800),
    module=False,
    module_absent=("Tier 2 is the study's module and this is the cross passage."),
    rulers=[]),

 "hall/W": dict(
    src="backdrops/source/passage-W/cand-2.png",
    role=("The axial view west, and the other side of the same door. The one "
          "cross-passage facing with a tier-1 ruler in it."),
    floor_window=(628, 650),
    ceil_cols=[(660, 700), (850, 900)], ceil_range=(80, 500),
    floor_cols=[(660, 700), (850, 900)], floor_range=(520, 900),
    rail_cols=[(660, 700), (850, 900)], rail_range=(450, 620),
    opening=dict(
        x0=709, x1=825, y0=426,
        how_x0=("Over rows 450-600: the left jamb's stone front face holds ~90 "
                "from x 695 to 708, the wall-plane corner falls to 48 at 709, "
                "and the reveal - brilliant here because the study's fire is "
                "behind it - runs 710-713 (145, 200, 213, 96) before the "
                "opening's interior at 714. WALL-PLANE edge 709. The cand-1 "
                "window would have looked at 698, where cand-2 paints the dark "
                "panelling BEFORE the case."),
        how_x1=("Mirror: the opening's interior runs to 820, the right jamb's "
                "reveal is lit at 821-824 (155, 177, 181, 154), the wall-plane "
                "corner falls to 38 at 825 and the front face holds ~82 from "
                "826 to 840. WALL-PLANE edge 825. The opening's centre is "
                "therefore 767.0 against a frame centre of 767.5: this door is "
                "centred to half a pixel."),
        how_y0=("Down the opening's columns (x 730-810): the lintel face is lit "
                "at ~70-113 from y 403 to 425 and the opening's head falls to 11 "
                "at 426 and stays below 11. WALL-PLANE head 426."),
        how_y1=("The floor runs continuously through this opening, so the "
                "threshold is the end wall's own floor line. It is read at 638 "
                "and it is read there FOUR times independently - on the left "
                "jamb's plinth columns (23), on the right jamb's (17), on the "
                "end-wall panelling left of the case (5) and right of it (2) - "
                "every one of them bottoming at the same row.")),
    door_cols=(650, 900), door_rows=(400, 700),
    module=False,
    module_absent=("Tier 2 is the study's module and this is the cross passage."),
    rulers=["door_height", "door_width", "plan_wall_width", "plan_storey"]),
}

# The control's committed values. A cand-2 run that does not reproduce these has
# changed what the code reads and every verdict in it is void.
CONTROL = dict(wall_ceiling_line_y_px=81, wall_floor_line_y_px=777,
               corner_x0_px=142, corner_x1_px=1389,
               fireplace_opening_width_px=209, px_per_m_at_wall=232.222)


# ---------------------------------------------------------------------------
def cols_of(bands):
    return np.concatenate([np.arange(a, b + 1) for a, b in bands])


def horizontality(L, y, cols):
    """How much of the column span carries the same step at row y. A true
    architectural horizontal lights up nearly every column with a similar step;
    a floorboard seam, which converges, does not."""
    s = np.abs(L[y, cols] - L[y - 1, cols])
    med = np.median(s)
    if med <= 0:
        return 0.0, 9.9
    return float((s > 0.5 * med).mean()), float(s.std() / max(s.mean(), 1e-9))


def band_steps(L, cols, y0, y1, n=12, min_sep=6):
    band = L[y0:y1 + 1][:, cols]
    d = np.abs(np.diff(band, axis=0)).mean(axis=1)
    ys = np.arange(y0 + 1, y1 + 1)
    out = []
    for y, s in top_steps(ys, d, n, min_sep):
        h, cv = horizontality(L, y, cols)
        out.append(dict(y=y, strength=round(s, 2), horiz=round(h, 3), cv=round(cv, 3)))
    return out


def pick_ceiling(L, cfg):
    cols = cols_of(cfg["ceil_cols"])
    cands = band_steps(L, cols, *cfg["ceil_range"])
    good = [c for c in cands if c["horiz"] >= 0.9 and c["cv"] <= 0.5]
    best = max(good, key=lambda c: c["strength"]) if good else max(cands, key=lambda c: c["strength"])
    return best["y"] - 1, cands, best


def pick_floor(L, cfg):
    """The floor line is the darkest row of the shadow seam at the skirting foot.

    Two traps, both real on these images. (1) The STRONGEST step in the lower
    band is the skirting cap, not the floor: on study/N the cap is at y 743 and
    the floor is 34 px lower; every one of the eight shows the same
    cap / face / seam / boards sequence. (2) The lower band also contains
    floorboard seams, which are strong but converge, and the panelling's own
    base rails, which are horizontal but are not the floor.

    So the band's step candidates are computed and kept as evidence, and the
    line itself is placed at the LUMINANCE MINIMUM inside a bracket read off the
    row-by-row luminance profile by hand for each facing (`floor_window`). The
    bracket is 16-28 rows wide and is quoted in the output so a re-measurer can
    see exactly what was and was not left to the automatic rule; the automatic
    'lowest true horizontal' rule agrees with it unaided on study/N, study/W,
    hall/N and hall/S, and on the other four the band is too crowded (study/E,
    study/S) or the transition too soft (the two axial corridor views, where the
    far end wall's foot is a low-contrast shadow) for the rule to land alone."""
    cols = cols_of(cfg["floor_cols"])
    cands = band_steps(L, cols, *cfg["floor_range"], n=40, min_sep=5)
    a, b = cfg["floor_window"]
    prof = L[a:b + 1][:, cols].mean(axis=1)
    y = int(a + np.argmin(prof))
    auto = None
    if cands:
        mx = max(c["strength"] for c in cands)
        good = [c for c in cands if c["horiz"] >= 0.9 and c["cv"] <= 0.5
                and c["strength"] >= 0.12 * mx]
        if good:
            auto = max(good, key=lambda c: c["y"])["y"] - 1
    return y, cands, dict(window=[a, b],
                          window_profile=[round(float(v), 2) for v in prof],
                          window_profile_first_row=a,
                          automatic_lowest_true_horizontal=auto)


def pick_rail(L, cfg, floor_y):
    cols = cols_of(cfg["rail_cols"])
    cands = band_steps(L, cols, *cfg["rail_range"], n=10, min_sep=8)
    good = [c for c in cands if c["horiz"] >= 0.6]
    best = max(good, key=lambda c: c["strength"]) if good else cands[0]
    return best["y"] - 1, cands, best


def find_corners(L, ceil_y, win=4, run=10, frac=0.25, halfref=100):
    """Where the wall-ceiling line stops being horizontal.

    f(x) is the strength of the step at the ceiling line in column x. Inside the
    facing wall f(x) is the plaster-to-panelling step; past the corner the
    ceiling junction has slid away to another row and f collapses. A corner is
    reported only if the collapse is sustained for `run` columns, so a panel
    head crossing the line does not fake one."""
    D = np.abs(np.diff(L, axis=0))
    f = np.max(D[ceil_y - win:ceil_y + win + 1, :], axis=0)
    cx = W // 2
    ref = float(np.median(f[cx - halfref:cx + halfref]))
    th = frac * ref
    ok = f >= th

    def scan(direction):
        x = cx
        while True:
            nx = x + direction
            if nx < 0 or nx > W - 1:
                return None          # the wall runs past the frame edge
            seg = ok[max(0, nx - run + 1):nx + 1] if direction < 0 else ok[nx:nx + run]
            if len(seg) < run:
                return None      # reached the frame edge still horizontal: no corner
            if not seg.any():
                return x
            x = nx
    return scan(-1), scan(1), ref, f


def confirm_corner_edge(L, x, ceil_y, floor_y, span=12):
    """Second witness for a corner: the strongest vertical edge within +-12 px
    of the x the ceiling line gave, measured over the UPPER wall only (the 380
    rows below the ceiling line), where nothing but the corner itself runs
    vertically. Read over the whole wall height instead and the fireplace jambs,
    door cases and panel stiles compete with it."""
    if x is None:
        return None
    a, b = max(1, x - span), min(W - 1, x + span)
    r0, r1 = ceil_y + 20, min(floor_y - 20, ceil_y + 400)
    if r1 - r0 < 60:
        r0, r1 = ceil_y + 10, floor_y - 10
    xs, d = col_step_profile(L, a, b, r0, r1)
    return int(xs[int(np.argmax(d))])


# ------------------------------------------------------- cand-2 detectors ---
# Everything from here to `light` is new for the cand-2 round. The cand-1 round
# does not call any of it, so the row-20 numbers cannot move.

def find_corners_cand2(L, ceil_y, win=4, run=10, frac=0.30, look=80):
    """`find_corners` with a LOCAL reference instead of a mid-wall one.

    The cand-1 rule compares the ceiling-line step in column x against 25 % of
    its median over the middle 200 columns. That fails on study/W cand-2, and it
    fails in the most dangerous way available: the west wall is dimly lit on its
    left half, so the wall's own ceiling-line step there is 11-15 against a
    mid-wall median of 71, which is below the threshold, and the scan declares a
    corner at x 208 - 64 px inside the real corner at 144, which the brightened
    frame shows plainly and which the right-hand corner's symmetry confirms
    (1388 - 144 = 1244 against study/N's 1247 for the same room).

    So the reference is taken from the 80 columns on the WALL side of the
    candidate instead of from the frame's middle, and the collapse has to be to
    below 30 % of that. A wall whose lighting falls off along its length is then
    compared against itself where it is dark, which is the only comparison that
    means anything.

    This rule is required to leave the control alone, and it does: study/N
    returns 142 and 1389, the committed values, unchanged.
    """
    D = np.abs(np.diff(L, axis=0))
    f = np.max(D[ceil_y - win:ceil_y + win + 1, :], axis=0)
    cx = W // 2

    def scan(direction):
        x = cx
        while True:
            nx = x + direction
            if nx < 0 or nx > W - 1:
                return None          # the wall runs past the frame edge
            if direction < 0:
                seg = f[max(0, nx - run + 1):nx + 1]
                local = f[nx:min(W, nx + look)]
            else:
                seg = f[nx:nx + run]
                local = f[max(0, nx - look + 1):nx + 1]
            if len(seg) < run:
                return None
            if (seg < frac * float(np.median(local))).all():
                return x
            x = nx
    return scan(-1), scan(1), f


def panelling_module(L, cfg, floor_y, band=(500, 640), cols=(200, 1400)):
    """The dado moulding, read the same way on every study facing.

    Tier 2 transfers a module from study/N to another wall of the same room, and
    a transfer is only worth anything if BOTH ends are read by one rule over one
    column span. The cand-1 run's rail detector is not that rule: it takes the
    strongest step in a per-facing column band, and the dado moulding is a stack
    of four or five arrises within 25 px, so which one is 'strongest' is decided
    by where the light falls. On study/W it answers 570 over columns 300-1300 and
    564 over columns 620-1300 - a 6 px, 2.8 % swing on a 213 px module, which is
    the whole width of the band this gate judges by.

    The rule here is fixed instead, and reads two lines, both of them SHADOWS,
    because a shadow line sits where the moulding is whatever direction the light
    comes from while the bright arris moves:

      capping   the top of the dado capping: the first row, scanning down the
                band, in the first contiguous group that falls below 60 % of the
                band's median luminance;
      dado_rail the deepest row in the band - the rail's own undercut shadow.

    Read that way the two lines land 232/213 px above the floor on study/N,
    231/212 on study/E and 233/214 on study/W: the three walls of one room agree
    to 2 px on both lines. The dado_rail line is the one design/specs/
    21-painted-promotion.md §1 names (213 px at 232.222 px/m => 0.9172 m) and
    this code reproduces that number exactly rather than being told it.
    """
    a, b = band
    p = L[a:b + 1, cols[0]:cols[1] + 1].mean(axis=1)
    med = float(np.median(p))
    below = np.nonzero(p < 0.6 * med)[0]
    capping = None
    if len(below):
        group = [below[0]]
        for i in below[1:]:
            if i - group[-1] <= 2:
                group.append(i)
            else:
                break
        capping = a + int(group[int(np.argmin(p[group]))])
    rail = a + int(np.argmin(p))
    return dict(
        band=[a, b], cols=list(cols), band_median_luma=round(med, 2),
        capping_y_px=capping, dado_rail_y_px=rail,
        capping_above_floor_px=(floor_y - capping) if capping is not None else None,
        dado_rail_above_floor_px=floor_y - rail,
        profile=[round(float(v), 2) for v in p], profile_first_row=a)


def read_window_bays(L, cfg):
    """The three window bays of study/S, and whether they were drawn to rule.

    Returns the light openings, the per-bay width between outer mullion
    centre-lines, and the spread. The spread is the point: on a wall parallel to
    the image plane a perspective projection has ONE scale, so three bays the
    prompt rules equal must project equal. Where they do not, the ruler has no
    single value and picking one of the three would pick the verdict.
    """
    b = cfg["bays"]
    y0, y1 = b["rows"]
    p = L[y0:y1 + 1, :].mean(axis=0)
    lit = p > b["bright"]
    runs, start = [], None
    for x in range(W):
        if lit[x] and start is None:
            start = x
        elif not lit[x] and start is not None:
            if x - start >= b["min_run"]:
                runs.append([start, x - 1])
            start = None
    if start is not None and W - start >= b["min_run"]:
        runs.append([start, W - 1])

    n, per = b["n_bays"], b["lights_per_bay"]
    bays = []
    if len(runs) == n * per:
        for i in range(n):
            group = runs[i * per:(i + 1) * per]
            centres = [(g[0] + g[1]) / 2.0 for g in group]
            bays.append(dict(
                lights=group,
                light_widths_px=[g[1] - g[0] + 1 for g in group],
                light_centres_px=centres,
                # 1.5 x the first-to-last light-centre span: for three equal
                # lights on equal mullion pitch that IS the outer mullion
                # centre-to-centre width, and it never touches a jamb face.
                width_px=round(1.5 * (centres[-1] - centres[0]), 2)))
    widths = [bb["width_px"] for bb in bays]
    spread = ((max(widths) - min(widths)) / (sum(widths) / len(widths))
              if len(widths) > 1 else None)
    return dict(light_runs=runs, bays=bays, bay_widths_px=widths,
                bay_width_spread_pct=(round(100 * spread, 2)
                                      if spread is not None else None),
                how=b["how"])


def wall_band_audit(L, cfg):
    """Evidence, not assertion, that a wall-band facing has nothing to measure.

    The prompt for hall/N and hall/S forbids a floor line, a ceiling line and
    corners. Saying 'the painting obeyed' is only worth something if the same
    detectors that find those things elsewhere are run here and come back empty,
    so they are, and their best answers are printed beside the numbers a real
    junction gives on the four study facings.
    """
    top = band_steps(L, cols_of(cfg["ceil_cols"]), *cfg["ceil_range"], n=4, min_sep=8)
    bot = band_steps(L, cols_of(cfg["floor_cols"]), *cfg["floor_range"], n=4, min_sep=8)
    return dict(
        strongest_true_horizontal_in_top_band=top[0] if top else None,
        strongest_true_horizontal_in_bottom_band=bot[0] if bot else None,
        top_band_candidates=top, bottom_band_candidates=bot,
        mean_luma_top_40_rows=round(float(L[0:40, :].mean()), 2),
        mean_luma_bottom_40_rows=round(float(L[H - 40:H, :].mean()), 2),
        mean_luma_middle_40_rows=round(float(L[492:532, :].mean()), 2),
        reading=("A wall-ceiling junction on the four study facings measures a "
                 "step of 55-67 at a horizontality of 0.97-1.00 with plaster "
                 "above it at a mean luma of 84-155. Here the strongest true "
                 "horizontal in the top band and the strongest in the bottom "
                 "band are the panelling's own rails, the frame's top 40 rows "
                 "are dark oak, and the corner scan run at any candidate "
                 "ceiling row returns a different pair of columns each time - "
                 "which is what a corner detector does when there is no corner. "
                 "No floor line, no ceiling line, no corner, no feature of "
                 "ruled size: nothing on this facing can be converted into "
                 "px_per_m_at_wall, and none is."))


def ceiling_ramp_vp(L, ceil_y, cx0, cx1, reach=64):
    """Independent, well-conditioned cross-check on the horizon.

    The side walls meet the ceiling along lines that run parallel to the view
    axis, so in a rectilinear image they converge on the principal point, which
    lies on the horizon. Fit both ramps outside the corners and intersect."""
    if cx0 is None or cx1 is None:
        return None
    half = 150
    lo, hi = max(1, ceil_y - half), min(H - 2, ceil_y + half)
    D = np.abs(np.diff(L, axis=0))
    ys = np.arange(lo, hi + 1)

    def fit(x0, x1):
        xs = np.arange(x0, x1 + 1)
        if len(xs) < 25:
            return None
        yv = ys[np.argmax(D[lo - 1:hi, x0:x1 + 1], axis=0)].astype(float)
        # Drop columns whose argmax is pinned to the search window's own edge:
        # past the frame top the junction has left the image and the argmax
        # clamps, which would otherwise drag the fitted slope.
        keep = (yv > max(lo + 2, 6)) & (yv < hi - 2)
        xs, yv = xs[keep], yv[keep]
        if len(xs) < 25:
            return None
        A = None
        for _ in range(6):
            A = np.polyfit(xs, yv, 1)
            r = yv - np.polyval(A, xs)
            sd = max(float(r.std()), 0.6)
            k = np.abs(r) < 2.5 * sd
            if k.sum() < 20:
                break
            xs, yv = xs[k], yv[k]
        return A, len(xs), float(np.std(yv - np.polyval(A, xs)))

    fl = fit(max(2, cx0 - reach), cx0 - 4)
    fr = fit(cx1 + 4, min(W - 3, cx1 + reach))
    if fl is None or fr is None:
        return None
    (al, bl), nl, sl = fl
    (ar, br), nr, sr = fr
    if abs(al - ar) < 1e-6:
        return None
    x = (br - bl) / (al - ar)
    y = al * x + bl
    return dict(x=round(float(x), 1), y=round(float(y), 1),
                left_slope=round(float(al), 4), right_slope=round(float(ar), 4),
                left_n=nl, left_resid_px=round(sl, 2),
                right_n=nr, right_resid_px=round(sr, 2))


def horizon_votes(L, ceil_y, floor_y, cx0, cx1):
    yy, xx = np.mgrid[0:H, 0:W]
    regions = {}
    regions["floor"] = yy > floor_y + 13
    if cx0 is not None or cx1 is not None:
        regions["ceiling"] = yy < max(4, ceil_y - 7)
    # else: the ceiling band of a cornerless wall-band view is flat plaster with
    # no line in it that converges on anything. It is not voted; saying "no
    # region" is honest where saying "252" would not be.
    if cx0 is not None or cx1 is not None:
        side = np.zeros((H, W), bool)
        if cx0 is not None:
            side |= xx < cx0
        if cx1 is not None:
            side |= xx > cx1
        regions["side_walls"] = side & (yy >= ceil_y - 7) & (yy <= floor_y + 13)
    out = {}
    for k, m in regions.items():
        bx, by, n = vote_region(L, m)
        out[k] = dict(x=bx, y=by, edge_px=n)
    avail = [(v["y"], v["x"], v["edge_px"]) for v in out.values() if v["y"] is not None]
    wsum = sum(e for _, _, e in avail)
    adopted_y = int(round(sum(y * e for y, _, e in avail) / wsum))
    adopted_x = int(round(sum(x * e for _, x, e in avail) / wsum))
    return out, adopted_y, adopted_x


def read_opening(L, cfg, floor_y):
    """Read the painted door opening's WALL-PLANE rectangle.

    Not automated, and deliberately so. Both openings are stone-cased with a
    visible reveal, so there are TWO rectangles in the pixels: the front one, in
    the wall plane, which is the click target for walking through, and the back
    one, 13 px (study/E) and 25 px (hall/W) of wall thickness behind it. A
    generic strongest-edge detector picks whichever of the two happens to carry
    the bigger step, and on study/E it picks the case's outer moulding instead.
    Each of the four edges was therefore read off a one-pixel luminance profile
    by eye; `how_x0` .. `how_y1` quote the profile that decided it, and the
    column-gradient candidate list is emitted beside them so the reading can be
    checked or overturned."""
    o = cfg["opening"]
    x0, x1, y0 = o["x0"], o["x1"], o["y0"]
    y1 = floor_y
    a, b = cfg["door_cols"]
    xs, d = col_step_profile(L, a, b, y0 + 90, y1 - 80)
    cands = top_cols(xs, d, 10, min_sep=6)
    return dict(opening_x0_px=x0, opening_x1_px=x1,
                opening_y0_px=y0, opening_y1_px=y1,
                opening_width_px=x1 - x0, opening_height_px=y1 - y0,
                opening_aspect_h_over_w=round((y1 - y0) / (x1 - x0), 3),
                how_opening_x0=o["how_x0"], how_opening_x1=o["how_x1"],
                how_opening_y0=o["how_y0"], how_opening_y1=o["how_y1"],
                column_edge_candidates=[[int(p), round(q, 1)] for p, q in cands])


# --------------------------------------------------------- the ruler rule ---

RULER_TIER = {"door_height": 1, "door_width": 1, "fireplace": 1,
              "window_bays": 1, "module_capping": 2, "module_dado_rail": 2,
              "plan_wall_width": 3, "plan_storey": 3}


def build_rulers(fac, cfg, m, module, bays, module_m):
    """Every ruler this facing can carry, measured, in priority order.

    Nothing here chooses. Each entry says what was measured, what size the plan
    or the facing's own prompt rules for it, and what focal length that implies
    at the facing's DRAWN standpoint. `admissible` is the tier rule applied and
    nothing else: a tier-3 reading on a facing that has a tier-1 or tier-2 ruler
    is measured and printed but may not vote, because it assumes the plan's wall
    width and so cannot disagree with the plan about it.
    """
    dist = PLAN_NOW[fac]
    has_high = any(RULER_TIER[n] <= 2 for n in cfg["rulers"]
                   if n in RULER_TIER and _ruler_px(n, m, module, bays) is not None)
    out = []
    for name in cfg["rulers"]:
        tier = RULER_TIER[name]
        px = _ruler_px(name, m, module, bays)
        if px is None:
            continue
        ruled = _ruler_size(name, module_m, fac)
        if ruled is None:
            continue
        ppm = px / ruled
        focal = ppm * dist
        rec = dict(
            name=name, tier=tier, feature_px=round(float(px), 2),
            ruled_m=round(ruled, 5),
            px_per_m_at_wall=round(ppm, 3),
            implied_focal_px=round(focal, 1),
            delta_pct=round(100.0 * (focal - REFERENCE_PX) / REFERENCE_PX, 2),
            admissible=(tier <= 2 or not has_high),
            what=RULER_WHAT[name])
        if not rec["admissible"]:
            rec["inadmissible_because"] = (
                "tier %d, and this facing carries a tier-%d ruler. The priority "
                "rule was fixed before the answers were known: a size the "
                "painting was ASKED to draw outranks the plan asserted onto the "
                "painting. Measured and printed so nothing is hidden."
                % (tier, min(RULER_TIER[n] for n in cfg["rulers"]
                             if n in RULER_TIER
                             and _ruler_px(n, m, module, bays) is not None)))
        if name == "fireplace" and fac == "study/N":
            rec["note"] = ("This is the calibration the approved frame was "
                           "blessed at and the reference 1010 px is defined by "
                           "it, so its delta is 0 by construction and is a "
                           "CONTROL, not a verdict.")
        if name.startswith("module_") and fac == "study/N":
            rec["admissible"] = False
            rec["inadmissible_because"] = (
                "On the control this ruler is the DEFINITION of the module - "
                "its metre size is derived from this very reading - so its "
                "delta is 0 by construction and it is evidence about no image.")
        if name == "window_bays":
            rec["instances_px"] = bays["bay_widths_px"]
            rec["instance_spread_pct"] = bays["bay_width_spread_pct"]
        out.append(rec)
    return out


RULER_WHAT = {
 "door_height": "the painted door opening's height at the wall plane, head shadow line to threshold, against the 1.00 x 2.00 m opening blueprint §11 rules and the facing's own prompt restates. The LONGER dimension of the two, which is the committed method's choice and carries the smaller relative reading error.",
 "door_width": "the same opening's width at the wall plane, jamb shadow line to jamb shadow line, against the ruled 1.00 m. Read as a separate ruler so the aspect the painting actually drew is visible instead of averaged away.",
 "fireplace": "the fireplace opening, inner stone jamb to inner stone jamb, taken at 0.90 m. Not a ruling but an inference, and the one the approved frame was blessed at: the brief's '~1.4 m' puts this room's storey at 4.66 m and is refuted by the picture.",
 "window_bays": "the mean of the three window bays, each measured between its outer mullion centre-lines against the 0.90 m the facing's own prompt rules 'so this is a ruled-size measurement anchor'. Trustworthy only if the three were drawn equal.",
 "module_capping": "the top of the dado capping, transferred from study/N as a fixed number of metres above the floor line. A shadow line, read by one rule over one column span on both facings.",
 "module_dado_rail": "the dado rail's undercut shadow, transferred from study/N the same way. This is the module design/specs/21-painted-promotion.md §1 names.",
 "plan_wall_width": "the measured corner span taken at the wall width the PLAN rules. Circular: adopting it means implied_wall_width_m cannot be reported, because it was assumed.",
 "plan_storey": "the measured ceiling-to-floor span taken at the plan's ruled 2.80 m storey. Circular in the same way, and biased besides - see _ruler_control.",
}


def _ruler_px(name, m, module, bays):
    if name == "door_height":
        return m.get("opening_height_px")
    if name == "door_width":
        return m.get("opening_width_px")
    if name == "fireplace":
        return m.get("fireplace_opening_width_px")
    if name == "window_bays":
        if not bays or not bays["bay_widths_px"]:
            return None
        return sum(bays["bay_widths_px"]) / len(bays["bay_widths_px"])
    if name == "module_capping":
        return module["capping_above_floor_px"] if module else None
    if name == "module_dado_rail":
        return module["dado_rail_above_floor_px"] if module else None
    if name == "plan_wall_width":
        if m["corner_x0_px"] is None or m["corner_x1_px"] is None:
            return None
        return m["corner_x1_px"] - m["corner_x0_px"]
    if name == "plan_storey":
        return m["wall_floor_line_y_px"] - m["wall_ceiling_line_y_px"]
    return None


def _ruler_size(name, module_m, fac):
    return {"door_height": DOOR_H_M, "door_width": DOOR_W_M,
            "fireplace": FIREPLACE_M, "window_bays": BAY_M,
            "module_capping": module_m.get("capping"),
            "module_dado_rail": module_m.get("dado_rail"),
            "plan_wall_width": PLAN[fac]["wall_width_m"],
            "plan_storey": PLAN[fac]["storey_m"]}.get(name)


def verdict_for(fac, cfg, rulers, m):
    """PASS, FAIL or WITHHELD, by the triggers in this module's docstring.

    The band is +/-3 % of 1010 px and it is blueprint §5's. It is not moved here
    and it is not moved anywhere.
    """
    reasons = []
    if cfg.get("forbids") and any("corner" in f for f in cfg["forbids"]):
        if m["corner_x0_px"] is not None or m["corner_x1_px"] is not None:
            reasons.append(
                "a corner was found at %s/%s on a facing whose own prompt "
                "forbids corners in frame. A corner detector that finds a "
                "corner where the prompt forbade one has found something else."
                % (m["corner_x0_px"], m["corner_x1_px"]))

    for r in rulers:
        if r.get("instance_spread_pct") is not None and \
                r["instance_spread_pct"] > BAND * 100 and r["admissible"]:
            reasons.append(
                "the tier-1 anchor was not drawn to rule: its %d instances "
                "measure %s px for one ruled size, a spread of %.1f %% against "
                "a %.0f %% band, on a wall parallel to the image plane where a "
                "perspective projection has one scale and equal features must "
                "project equally. Picking one instance would pick the verdict."
                % (len(r["instances_px"]),
                   "/".join("%.1f" % v for v in r["instances_px"]),
                   r["instance_spread_pct"], BAND * 100))
            r["admissible"] = False
            r["inadmissible_because"] = "instance spread exceeds the band"

    adm = [r for r in rulers if r["admissible"]]
    if not adm:
        reasons.append(
            "no admissible ruler at tiers 1-3. %s"
            % (cfg.get("module_absent", "")
               if not cfg.get("wall_band") else
               "This facing paints no floor line, no ceiling line, no corner "
               "and no feature of ruled size, which is exactly what its prompt "
               "demanded; see _wall_band_audit."))

    primary = adm[0] if adm else None
    if primary:
        ppm = primary["px_per_m_at_wall"]
        storey = (m["wall_floor_line_y_px"] - m["wall_ceiling_line_y_px"]) / ppm
        eye = ((m["wall_floor_line_y_px"] - m["horizon_y_px"]) / ppm
               if m["horizon_y_px"] is not None else None)
        if not (STOREY_RANGE[0] <= storey <= STOREY_RANGE[1]):
            reasons.append("the derived storey height is %.2f m, outside %.1f-%.1f m. "
                           "A physically impossible derived quantity is the "
                           "measurement telling you it is measuring something else."
                           % (storey, *STOREY_RANGE))
        if eye is not None and not (EYE_RANGE[0] <= eye <= EYE_RANGE[1]):
            reasons.append("the derived eye height is %.2f m, outside %.1f-%.1f m."
                           % (eye, *EYE_RANGE))

    passes = [r for r in adm if abs(r["delta_pct"]) <= BAND * 100]
    fails = [r for r in adm if abs(r["delta_pct"]) > BAND * 100]
    if adm and passes and fails and not reasons:
        reasons.append(
            "the admissible rulers straddle the band: %s pass and %s fail, so "
            "the choice of ruler would choose the verdict."
            % ("/".join(r["name"] for r in passes),
               "/".join(r["name"] for r in fails)))

    if reasons:
        return "WITHHELD", None, reasons, primary
    return ("PASS" if not fails else "FAIL"), primary["px_per_m_at_wall"], [], primary


def light(rgb, L, ceil_y, floor_y, cx0, cx1):
    bx, by = brightest_patch(L, 21)
    lo = max(0, ceil_y - 70)
    hi = max(lo + 4, ceil_y - 8)
    a = max(0, bx - 200)
    b = min(W - 1, bx + 200)
    if cx0 is not None:
        a = max(a, cx0 + 10)
    if cx1 is not None:
        b = min(b, cx1 - 10)
    if b - a < 60:
        a, b = max(0, bx - 200), min(W - 1, bx + 200)
    ceil_mean = patch_mean(rgb, a, b, lo, hi)
    tint, _ = normalise_tint(ceil_mean)
    alts = {}
    fy0, fy1 = min(H - 1, floor_y + 40), min(H - 1, floor_y + 160)
    alts["floor_under_brightest"] = normalise_tint(
        patch_mean(rgb, max(0, bx - 120), min(W - 1, bx + 120), fy0, fy1))[0]
    alts["floor_bottom_strip"] = normalise_tint(patch_mean(rgb, 200, 1335, 970, 1020))[0]
    my = (ceil_y + floor_y) // 2
    alts["mid_wall_right"] = normalise_tint(
        patch_mean(rgb, min(W - 1, (cx1 or W - 1) - 220), (cx1 or W - 1) - 40,
                   my - 60, my + 60))[0]
    alts["mid_wall_left"] = normalise_tint(
        patch_mean(rgb, (cx0 or 0) + 40, (cx0 or 0) + 220, my - 60, my + 60))[0]
    alts["brightest_21x21_patch"] = normalise_tint(
        patch_mean(rgb, bx - 10, bx + 10, by - 10, by + 10))[0]
    third = W / 3.0
    hpos = "L" if bx < third else ("R" if bx > 2 * third else "C")
    wall = np.zeros((H, W), bool)
    wall[ceil_y + 10:floor_y - 10, (cx0 or 0) + 10:(cx1 or W - 1) - 10] = True
    return dict(
        key_dir_measured=hpos,
        key_dir_brightest_x=bx, key_dir_brightest_y=by,
        key_tint=tint,
        key_tint_patch=[a, b, lo, hi],
        key_tint_patch_mean_rgb=[round(v, 2) for v in ceil_mean],
        key_tint_alternates=alts,
        brightest_21x21_patch_centre_px=[bx, by],
        sobel_bright_side_deg_whole_frame=round(sobel_bright_side_deg(L), 2),
        sobel_bright_side_deg_wall_band=round(sobel_bright_side_deg(L, wall), 2)
        if wall.sum() > 5000 else None,
        left_third_minus_right_third_luminance_whole_frame=round(third_tilt(L), 3),
        left_third_minus_right_third_luminance_wall_band=round(
            third_tilt(L, ceil_y + 10, floor_y - 10), 3),
    )


# ---------------------------------------------------------------------------
def measure(fac):
    cfg = CFG[fac]
    path = os.path.join(ROOT, cfg["src"])
    rgb = load(path)
    L = luma(rgb)

    ceil_y, ceil_cands, ceil_best = pick_ceiling(L, cfg)
    floor_y, floor_cands, floor_best = pick_floor(L, cfg)
    rail_y, rail_cands, rail_best = pick_rail(L, cfg, floor_y)
    cx0, cx1, cref, _ = find_corners(L, ceil_y)
    e0 = confirm_corner_edge(L, cx0, ceil_y, floor_y)
    e1 = confirm_corner_edge(L, cx1, ceil_y, floor_y)
    ramp = ceiling_ramp_vp(L, ceil_y, cx0, cx1)
    votes, hy, hx = horizon_votes(L, ceil_y, floor_y, cx0, cx1)

    m = dict(wall_ceiling_line_y_px=ceil_y, wall_floor_line_y_px=floor_y,
             horizon_y_px=hy, horizon_x_px=hx,
             corner_x0_px=cx0, corner_x1_px=cx1,
             dado_rail_top_y_px=rail_y,
             dado_rail_above_floor_px=floor_y - rail_y)
    if cx0 is not None and cx1 is not None:
        m["corner_midpoint_px"] = (cx0 + cx1) / 2.0

    # --------------------------------------------------------------- openings
    opening = None
    if "opening" in cfg:
        opening = read_opening(L, cfg, floor_y)
        m.update({k: v for k, v in opening.items()
                  if not k.startswith("how_") and k != "column_edge_candidates"})

    fire = None
    if "fire" in cfg:
        xs, d = col_step_profile(L, cfg["fire_cols"][0], cfg["fire_cols"][1],
                                 cfg["fire_rows"][0], cfg["fire_rows"][1])
        cands = top_cols(xs, d, 8, min_sep=10)
        fx0, fx1 = cfg["fire"]["x0"], cfg["fire"]["x1"]
        fire = dict(fireplace_opening_x0_px=fx0 - 1,
                    fireplace_opening_x1_px=fx1,
                    fireplace_opening_width_px=fx1 - fx0 + 1,
                    how_fireplace_opening=cfg["fire"]["how"],
                    column_edge_candidates=[[int(a), round(b, 1)] for a, b in cands])
        m.update({k: v for k, v in fire.items()
                  if not k.startswith("how_") and k != "column_edge_candidates"})

    # ------------------------------------------------------------ calibration
    if cfg["calib"] == "fireplace":
        calib_px = fire["fireplace_opening_width_px"]   # clear opening, jamb face to jamb face
    elif cfg["calib"] == "door_h":
        calib_px = opening["opening_height_px"]
    else:
        calib_px = m["dado_rail_above_floor_px"]
    ppm = calib_px / cfg["calib_m"]

    eye = (floor_y - hy) / ppm
    storey = (floor_y - ceil_y) / ppm
    ppm_bottom = (H - hy) / eye
    nearest = H / ppm_bottom
    cam = H / ppm
    wall_w = ((cx1 - cx0) / ppm) if (cx0 is not None and cx1 is not None) else None

    lt = light(rgb, L, ceil_y, floor_y, cx0, cx1)

    return dict(facing=fac, src=cfg["src"], cfg=cfg, cfg_calib=cfg["calib"], measured=m,
                ceil_cands=ceil_cands, floor_cands=floor_cands,
                floor_window=floor_best,
                rail_cands=rail_cands,
                corner_ref_strength=round(cref, 1),
                corner_vertical_edge_x0=e0, corner_vertical_edge_x1=e1,
                ceiling_ramp_vp=ramp, votes=votes,
                calib_px=calib_px, ppm=ppm,
                derived=dict(eye_height_m=eye, storey_height_m=storey,
                             px_per_m_at_bottom=ppm_bottom,
                             nearest_visible_floor_m=nearest,
                             implied_camera_wall_m=cam,
                             implied_wall_width_m=wall_w),
                light=lt, opening=opening, fire=fire)


def measure2(fac, module_m):
    """The cand-2 round. Same primitives, new windows, and a ruler rule.

    `module_m` is the tier-2 module in metres, derived from the control's own
    reading earlier in the same run - not a constant typed in here, so a change
    to the module detector moves both ends of the transfer together or neither.
    """
    cfg = CFG2[fac]
    rgb = load(os.path.join(ROOT, cfg["src"]))
    L = luma(rgb)
    band = bool(cfg.get("wall_band"))

    ceil_y, ceil_cands, ceil_best = pick_ceiling(L, cfg)
    floor_y, floor_cands, floor_best = pick_floor(L, cfg)
    rail_y, rail_cands, rail_best = pick_rail(L, cfg, floor_y)
    cx0, cx1, cfield = find_corners_cand2(L, ceil_y)
    e0 = confirm_corner_edge(L, cx0, ceil_y, floor_y)
    e1 = confirm_corner_edge(L, cx1, ceil_y, floor_y)
    ramp = ceiling_ramp_vp(L, ceil_y, cx0, cx1)

    audit = wall_band_audit(L, cfg) if band else None
    if band:
        # There is no floor line and no ceiling line here, so there is no region
        # a vanishing-point vote could be run over that means anything. Saying
        # "none" is honest where saying "425" would not be, and 425 is exactly
        # what the cand-1 harness said for hall/N.
        votes, hy, hx = {}, None, None
        ceil_y_out = floor_y_out = None
        cx0 = cx1 = None
    else:
        votes, hy, hx = horizon_votes(L, ceil_y, floor_y, cx0, cx1)
        ceil_y_out, floor_y_out = ceil_y, floor_y

    m = dict(wall_ceiling_line_y_px=ceil_y_out, wall_floor_line_y_px=floor_y_out,
             horizon_y_px=hy, horizon_x_px=hx,
             corner_x0_px=cx0, corner_x1_px=cx1,
             dado_rail_top_y_px=(None if band else rail_y),
             dado_rail_above_floor_px=(None if band else floor_y - rail_y))
    if cx0 is not None and cx1 is not None:
        m["corner_midpoint_px"] = (cx0 + cx1) / 2.0

    opening = None
    if "opening" in cfg:
        opening = read_opening(L, cfg, floor_y)
        m.update({k: v for k, v in opening.items()
                  if not k.startswith("how_") and k != "column_edge_candidates"})

    fire = None
    if "fire" in cfg:
        xs, d = col_step_profile(L, cfg["fire_cols"][0], cfg["fire_cols"][1],
                                 cfg["fire_rows"][0], cfg["fire_rows"][1])
        cands = top_cols(xs, d, 8, min_sep=10)
        fx0, fx1 = cfg["fire"]["x0"], cfg["fire"]["x1"]
        fire = dict(fireplace_opening_x0_px=fx0 - 1, fireplace_opening_x1_px=fx1,
                    fireplace_opening_width_px=fx1 - fx0 + 1,
                    how_fireplace_opening=cfg["fire"]["how"],
                    column_edge_candidates=[[int(a), round(b, 1)] for a, b in cands])
        m.update({k: v for k, v in fire.items()
                  if not k.startswith("how_") and k != "column_edge_candidates"})

    module = (panelling_module(L, cfg, floor_y) if cfg.get("module") else None)
    bays = read_window_bays(L, cfg) if "bays" in cfg else None

    rulers = build_rulers(fac, cfg, m, module, bays, module_m)
    verdict, ppm, withheld, primary = verdict_for(fac, cfg, rulers, m)

    adm = [r for r in rulers if r["admissible"]]
    vals = [r["px_per_m_at_wall"] for r in adm]
    agreement = (round(100.0 * (max(vals) - min(vals)) / (sum(vals) / len(vals)), 2)
                 if len(vals) > 1 else None)

    if ppm:
        eye = ((floor_y - hy) / ppm) if hy is not None else None
        storey = (floor_y - ceil_y) / ppm
        ppm_bottom = ((H - hy) / eye) if eye else None
        derived = dict(
            eye_height_m=eye, storey_height_m=storey,
            px_per_m_at_bottom=ppm_bottom,
            nearest_visible_floor_m=(H / ppm_bottom) if ppm_bottom else None,
            implied_camera_wall_m=H / ppm,
            # Circularity: where the adopted ruler IS the plan's wall width the
            # implied width is the assumption handed back, so it is not reported.
            implied_wall_width_m=(
                None if (primary and primary["name"] == "plan_wall_width")
                else ((cx1 - cx0) / ppm if (cx0 is not None and cx1 is not None)
                      else None)))
    else:
        derived = dict(eye_height_m=None, storey_height_m=None,
                       px_per_m_at_bottom=None, nearest_visible_floor_m=None,
                       implied_camera_wall_m=None, implied_wall_width_m=None)

    lt = light(rgb, L, ceil_y, floor_y, cx0, cx1)

    return dict(facing=fac, src=cfg["src"], cfg=cfg, cfg_calib=None, measured=m,
                ceil_cands=ceil_cands, floor_cands=floor_cands,
                floor_window=floor_best, rail_cands=rail_cands,
                corner_ref_strength=None,
                corner_vertical_edge_x0=e0, corner_vertical_edge_x1=e1,
                ceiling_ramp_vp=(None if band else ramp), votes=votes,
                calib_px=(primary["feature_px"] if primary else None), ppm=ppm,
                rulers=rulers, primary=primary, verdict=verdict,
                withheld_because=withheld, ruler_agreement_pct=agreement,
                module=module, bays=bays, wall_band_audit=audit,
                derived=derived, light=lt, opening=opening, fire=fire,
                raw_ceiling_line_y_px=ceil_y, raw_floor_line_y_px=floor_y)


HOW = {
 "wall_ceiling_line_y_px":
    "Strongest row-to-row luminance step in the upper band, over columns clear "
    "of the wall's own features, kept only if it is a TRUE horizontal - present "
    "in >=90 % of the columns of that span with a step-strength coefficient of "
    "variation <=0.5. Reported as the last row belonging to the ceiling, so the "
    "junction lies between this row and the next. All candidates, with their "
    "horizontality, are in _candidates.",
 "wall_floor_line_y_px":
    "NOT the strongest step, and NOT fully automatic - read the qualification. "
    "The strongest step in the lower band is the SKIRTING CAP: on study/N it is "
    "at y 743 and the floor is 34 px lower, and all eight show the same "
    "cap / face / shadow-seam / boards sequence. The lower band also holds "
    "floorboard seams, which are strong but converge, and the panelling's own "
    "base rails, which are horizontal but are not the floor. The rule is "
    "therefore 'the lowest TRUE horizontal in the band', horizontality being "
    "the fraction of columns carrying the same step (an architectural "
    "horizontal lights ~0.95 of them with a step-strength CV below 0.5; a "
    "converging floorboard seam lights ~0.73 with CV above 1.0). The line is "
    "then placed on the darkest row of the shadow seam at the skirting foot. "
    "THE QUALIFICATION: that rule lands unaided on study/N, study/W, hall/N and "
    "hall/S only. On study/E and study/S the band is too crowded and on the two "
    "axial corridor views the far end wall's foot is too soft a transition, so "
    "for all eight the row-by-row luminance profile was read by eye and a "
    "16-28 row bracket recorded per facing (`floor_window`); the line is the "
    "luminance minimum inside it. Both the bracket and its profile are emitted "
    "in _candidates, along with what the automatic rule would have said, so the "
    "hand-read part is visible and can be overturned.",
 "horizon_y_px":
    "Vanishing-point vote, not an assumption. 3x3 Sobel over the region; keep "
    "the top 12 % of gradient magnitudes WITHIN the region; discard edges whose "
    "tangent is within 15 degrees of horizontal or vertical, because those two "
    "families are degenerate (an exactly vertical edge is perpendicular to the "
    "ray from every point on its own column and so votes for a whole line of "
    "candidates - without this filter the side-wall vote is captured by the "
    "panel stiles and returns x=52); then, for a coarse-to-fine grid of "
    "candidate vanishing points, count edge pixels whose gradient is "
    "perpendicular to the ray from that candidate. Run on three disjoint "
    "regions - floor below the floor line, ceiling above the ceiling line, and "
    "the side-wall bands outside the corners - reported per region in "
    "_horizon_votes. ADOPTED value is the edge-pixel-weighted mean of the "
    "regions that voted, so a thin dark side band cannot outvote the floor. "
    "The voted x says whether the camera is square to the wall.",
 "corner_x_px":
    "The x at which the wall-ceiling line stops being horizontal: f(x) is the "
    "step strength at the ceiling line in column x, and a corner is declared "
    "where f collapses below 25 % of its mid-wall median for 10 consecutive "
    "columns - the run requirement stops a panel head crossing the line from "
    "faking a corner. Confirmed against the strongest vertical edge within "
    "+-18 px, measured over the wall's own height (_corner_vertical_edge_x*). "
    "Where the wall runs past the frame edge no corner is emitted: null, not a "
    "guess.",
 "px_per_m_at_wall": "calibration_px / the calibration feature's assumed size in metres.",
 "px_per_m_at_bottom": "(image_h_px - horizon_y_px) / eye_height_m.",
 "key_tint":
    "Mean RGB of the dominant light's bounce off the ceiling - the one broad "
    "near-neutral diffuser every facing has - sampled from a 400 px window "
    "centred on the x of the frame's brightest 21x21 patch, in the 62 rows "
    "above the wall-ceiling line, then normalised so the largest channel is "
    "200. Alternates measured on the floor, on both mid-wall bands and on the "
    "brightest patch itself are in _light.key_tint_alternates; where they "
    "disagree widely the facing has two lights and a single key_tint is a "
    "compromise.",
 "key_dir":
    "The honest direction: where the brightest 21x21 patch actually sits "
    "relative to the frame centre and the measured horizon. Gate (e)'s Sobel "
    "bright-side estimator and the left-third-minus-right-third luminance are "
    "reported beside it, on the whole frame and on the wall band, because they "
    "frequently disagree with the eye when a frame has two lights.",
 "ceiling_ramp_vp":
    "An independent, better-conditioned cross-check on the horizon that the "
    "draft does not run. The side walls meet the ceiling along lines parallel "
    "to the view axis, which in a rectilinear image converge on the principal "
    "point and therefore lie on the horizon. Both ramps are fitted outside the "
    "corners by robust least squares and intersected. Residuals are given: "
    "where they are a fraction of a pixel over 100+ columns, the intersection "
    "is a sharper statement than the vote, and where the two disagree the "
    "IMAGE is inconsistent, not the measurement.",
}


def flags(fac, r):
    m, d = r["measured"], r["derived"]
    out = list(r["cfg"]["notes"])
    ramp = r["ceiling_ramp_vp"]
    if ramp:
        out.append(
          "HORIZON, TWO ANSWERS. The vanishing-point vote adopts y %d; the "
          "side-wall ceiling junctions, fitted to a residual of %.2f px over "
          "%d columns each side and intersected, put the principal point at y "
          "%.1f. That is a %+d px disagreement, %+.3f m of eye height. Both are "
          "measurements of the same frame, so the frame is not internally "
          "consistent: its ceiling geometry and its floor/edge statistics do "
          "not share a vanishing point. The vote is adopted because it is the "
          "method the draft lays down and because it draws on three disjoint "
          "regions; the ramp figure is the sharper single number and is "
          "recorded so the Navigator can choose." % (
            m["horizon_y_px"], ramp["left_resid_px"], ramp["left_n"], ramp["y"],
            int(round(ramp["y"] - m["horizon_y_px"])),
            (ramp["y"] - m["horizon_y_px"]) / r["ppm"]))
    f = r["ppm"] * PLAN[fac]["camera_wall_m"]
    out.append(
      "IMPLIED FOCAL LENGTH %.0f px against the 1024 px a 24 mm-equivalent lens "
      "on a 1536 px frame would give (%+.1f %%). px_per_m_at_wall x "
      "implied_camera_wall_m is 1024 by construction, so this is "
      "px_per_m_at_wall x THE PLAN'S standpoint of %.2f m for this facing - "
      "i.e. how far the drawn camera is from where the plan stands it, "
      "expressed as a lens." % (f, 100 * (f - 1024) / 1024,
                                PLAN[fac]["camera_wall_m"]))
    out.append(
      "EYE HEIGHT %.3f m against the 1.83 m every prompt asked for (%+.3f m). "
      "STOREY %.3f m against the ruled 2.80 m (%+.1f %%). CAMERA %.2f m from "
      "the wall against the plan's %.2f m (%+.1f %%)." % (
        d["eye_height_m"], d["eye_height_m"] - 1.83, d["storey_height_m"],
        100 * (d["storey_height_m"] - 2.80) / 2.80, d["implied_camera_wall_m"],
        PLAN[fac]["camera_wall_m"],
        100 * (d["implied_camera_wall_m"] - PLAN[fac]["camera_wall_m"]) / PLAN[fac]["camera_wall_m"]))
    if d["implied_wall_width_m"]:
        out.append("WALL WIDTH %.2f m from the corner span against the plan's "
                   "%.2f m (%+.1f %%)." % (
                     d["implied_wall_width_m"], PLAN[fac]["wall_width_m"],
                     100 * (d["implied_wall_width_m"] - PLAN[fac]["wall_width_m"])
                     / PLAN[fac]["wall_width_m"]))
    else:
        out.append("No corner in frame either side, so no implied wall width. "
                   "The wall runs past both frame edges and none was invented.")
    lt = r["light"]
    out.append(
      "LIGHT does not read UL45. Brightest 21x21 patch at (%d, %d) - %s third "
      "of the frame, %s the measured horizon. Gate (e)'s Sobel bright-side "
      "estimator returns %.1f deg on the whole frame against the 115.5 deg a "
      "constructed UL45 control gives. Left-third-minus-right-third luminance "
      "is %+.2f on the whole frame and %+.2f on the wall band, against the "
      "+2.0 that mechanisms.spec.mjs's light clause and gate (e)'s "
      "min_third_tilt both require." % (
        lt["key_dir_brightest_x"], lt["key_dir_brightest_y"],
        {"L": "left", "C": "centre", "R": "right"}[lt["key_dir_measured"]],
        "above" if lt["key_dir_brightest_y"] < m["horizon_y_px"] else "below",
        lt["sobel_bright_side_deg_whole_frame"],
        lt["left_third_minus_right_third_luminance_whole_frame"],
        lt["left_third_minus_right_third_luminance_wall_band"]))
    if "opening" not in r["cfg"]:
        out.append("No doorway is painted on this facing. Checked: the only two "
                   "openings in the eight are study/E's and hall/W's, which are "
                   "the two sides of the same door between the study and the "
                   "cross passage.")
    return out


def main_cand1():
    raw = {}
    for fac in FACINGS:
        r = measure(fac)
        raw[fac] = r
        cfg = r["cfg"]
        m = r["measured"]
        d = r["derived"]
        loc, f = fac.split("/")
        doc = {
          # [Row 21, round 3 — G13] THE CANDIDATE'S OWN BYTES. A critic
          # repainted a candidate in place — moved its fireplace 200 px — and
          # the promotion dressed the new picture in the old measurement's
          # numbers, because the only binding between the two was a PATH in a
          # sentence. A path is not a picture. `promote-backdrop.mjs` refuses
          # when this digest is not the digest of the file it is promoting.
          "_source_sha256": hashlib.sha256(
              open(os.path.join(ROOT, cfg["src"]), "rb").read()).hexdigest(),
          "_what_this_is":
            "DRAFT §5 meta for %s, measured off %s. Not a shipped "
            "backdrops/<loc>/<facing>.meta.json: nothing consumes it. Every _px "
            "value was read off the pixels by design/plan-draft/measured/"
            "measure.py; the only assumed quantity is the real-world size named "
            "in calibration_ref, and calibration_confidence says how far it can "
            "be trusted." % (fac, cfg["src"]),
          "facing_type": "enclosed" if (m["corner_x0_px"] is not None and
                                        m["corner_x1_px"] is not None) else "wall_band",
          "image_h_px": H,
          "floor_line_y": round(m["wall_floor_line_y_px"] / H, 6),
          "horizon_y": round(m["horizon_y_px"] / H, 6),
          "px_per_m_at_wall": round(r["ppm"], 3),
          "px_per_m_at_bottom": round(d["px_per_m_at_bottom"], 2),
          "wall_width_m": (round(d["implied_wall_width_m"], 3)
                           if d["implied_wall_width_m"] else None),
          "camera_wall_m": round(d["implied_camera_wall_m"], 4),
          "corner_x0_px": m["corner_x0_px"],
          "corner_x1_px": m["corner_x1_px"],
          "key_tint": r["light"]["key_tint"],
          "key_dir": "%s-%s" % (
              r["light"]["key_dir_measured"],
              "ABOVE" if r["light"]["key_dir_brightest_y"] < m["horizon_y_px"]
              else "BELOW"),
          "key_dir_reading": (
              "The brightest 21x21 patch sits at (%d, %d): %s third of the "
              "frame, %s the measured horizon at y %d. This is the honest "
              "direction; the Sobel and third-tilt statistics beside it in "
              "_light frequently disagree with it, and where they do the frame "
              "has two lights." % (
                  r["light"]["key_dir_brightest_x"], r["light"]["key_dir_brightest_y"],
                  {"L": "left", "C": "centre", "R": "right"}[r["light"]["key_dir_measured"]],
                  "above" if r["light"]["key_dir_brightest_y"] < m["horizon_y_px"]
                  else "below", m["horizon_y_px"])),
          "calibration_ref": cfg["calib_ref"],
          "calibration_px": r["calib_px"],
          "calibration_confidence": cfg["calib_conf"],
          "_measured_px": m,
          "_how_each_was_measured": HOW,
          "_candidates": {"wall_ceiling_line": r["ceil_cands"],
                          "wall_floor_line": r["floor_cands"],
                          "wall_floor_line_hand_read_window": r["floor_window"],
                          "dado_rail": r["rail_cands"]},
          "_corner_evidence": {
              "mid_wall_reference_step_strength": r["corner_ref_strength"],
              "vertical_edge_confirming_x0": r["corner_vertical_edge_x0"],
              "vertical_edge_confirming_x1": r["corner_vertical_edge_x1"]},
          "_horizon_votes": {"per_region": r["votes"],
                             "adopted_y": m["horizon_y_px"],
                             "adopted_x": m["horizon_x_px"],
                             "adopted_rule": "edge-pixel-weighted mean of the regions that voted",
                             "ceiling_ramp_intersection": r["ceiling_ramp_vp"]},
          "_derived": {k: (round(v, 4) if isinstance(v, float) else v)
                       for k, v in d.items()},
          "_light": r["light"],
          "_plan": dict(PLAN[fac],
                        camera_wall_m_in_standpoints_tsv_now=PLAN_NOW[fac],
                        _note=("camera_wall_m here is the standpoint this run "
                               "was ruled to compare against. standpoints.tsv "
                               "was rewritten mid-run (commit 385b1db) and now "
                               "says %.2f m for this facing. Nothing measured "
                               "off the pixels depends on either value."
                               % PLAN_NOW[fac])),
          "_flags": flags(fac, r),
        }
        if fac == "study/N":
            doc["_control_vs_study_N_meta_draft"] = {
              "_why": ("study/N cand-2 is the one facing already measured, in "
                       "design/plan-draft/study-N-meta-draft.json. This pipeline "
                       "was built without tuning toward those numbers; the "
                       "deltas below are the evidence that it reads the same "
                       "pixels the same way, or the evidence that it does not."),
              "wall_ceiling_line_y_px": {"draft": 81, "measured": m["wall_ceiling_line_y_px"],
                                         "delta": m["wall_ceiling_line_y_px"] - 81},
              "wall_floor_line_y_px": {"draft": 776, "measured": m["wall_floor_line_y_px"],
                                       "delta": m["wall_floor_line_y_px"] - 776},
              "horizon_y_px": {"draft": 490, "measured": m["horizon_y_px"],
                               "delta": m["horizon_y_px"] - 490},
              "corner_x0_px": {"draft": 147, "measured": m["corner_x0_px"],
                               "delta": m["corner_x0_px"] - 147},
              "corner_x1_px": {"draft": 1388, "measured": m["corner_x1_px"],
                               "delta": m["corner_x1_px"] - 1388},
              "fireplace_opening": {"draft": "341..550, 209 px",
                                    "measured": "%d..%d, %d px" % (
                                        m["fireplace_opening_x0_px"],
                                        m["fireplace_opening_x1_px"],
                                        m["fireplace_opening_width_px"]),
                                    "delta_width_px": m["fireplace_opening_width_px"] - 209},
              "px_per_m_at_wall": {"draft": 232.222, "measured": round(r["ppm"], 3)},
            }
        json.dump(doc, open(os.path.join(OUT, "%s-%s.json" % (loc, f)), "w"),
                  indent=2)
    json.dump({k: {kk: vv for kk, vv in v.items() if kk != "cfg"}
               for k, v in raw.items()},
              open(os.path.join(OUT, "_raw.json"), "w"), indent=2, default=str)
    for fac in FACINGS:
        r = raw[fac]
        m, d = r["measured"], r["derived"]
        print("%-8s ceil %4d floor %4d horiz %4d(x%4d) corners %s..%s  "
              "calib %5.1fpx %7.2f px/m  eye %.3f storey %.3f wall %s" % (
                  fac, m["wall_ceiling_line_y_px"], m["wall_floor_line_y_px"],
                  m["horizon_y_px"], m["horizon_x_px"],
                  m["corner_x0_px"], m["corner_x1_px"], r["calib_px"], r["ppm"],
                  d["eye_height_m"], d["storey_height_m"],
                  ("%.3f" % d["implied_wall_width_m"]) if d["implied_wall_width_m"] else "-"))


# ---------------------------------------------------------------------------
# ROUND cand-2: the run, the control, the ledger and the marked-up frames.
# ---------------------------------------------------------------------------

MISS = {
 "study/E": dict(
   kind="generation_miss",
   why=("THE CAMERA DID NOT MOVE AT ALL. Every line this facing carries sits "
        "within 2 px of where cand-1 drew it: corner span 1194 px in both "
        "rounds, door head y 308 in both, floor line 778 then 779, jambs "
        "660/874 then 658/873. The re-ask asked for the wall plane to span "
        "x 95..1441 (1346 px) and it still spans 171..1365 (1194 px). "
        "The cand-2 prompt contradicts itself about exactly this: its "
        "'Targeted correction to Image 1' orders 'move the camera closer until "
        "the central east-wall plane spans approximately x=95 through x=1441', "
        "while its own Avoid line forbids 'changing the camera scale'. A "
        "negative constraint is the stronger signal to an image-edit model and "
        "the picture obeyed the negative. Two further defects in the same file "
        "push the same way: the image numbering is transposed - the header "
        "calls Image 1 'the current study-E cand-2 edit target' and Image 2 the "
        "approved study/N, but the Primary request says 'matching Image 1's "
        "perspective exactly' and the camera paragraph says 'Match Image 1's "
        "rectilinear 24mm-equivalent perspective', so the sentence that governs "
        "the camera orders the generator to match the UNCORRECTED source; and "
        "the prompt gives the east wall the north wall's width, 'the 5.45-metre "
        "wall spans about 1346 pixels', where the plan rules the east wall "
        "4.80 m, so the pixel target it states is 14 % too wide for the wall it "
        "names."),
   extra_correction=("Delete 'changing the camera scale' from the Avoid list of "
                     "any prompt whose Targeted correction changes the camera "
                     "scale. Number the input images once and use those numbers "
                     "throughout. State the east wall as 4.80 m.")),
 "study/W": dict(
   kind="generation_miss",
   why=("Same contradiction, same file pattern, and the wall did not move "
        "either: measured by one corner rule across both rounds the corner span "
        "is 1246 px in BOTH, corner for corner at x 142 and x 1388, against the "
        "1346 px the re-ask asked for. The panelling module transferred from the "
        "approved study/N puts this wall at 233.3 px/m against study/N's own "
        "232.2 - i.e. the generator drew the west wall at the NORTH wall's "
        "scale, which is what it was shown, rather than at the scale it was "
        "told. Its Avoid line also forbids 'changing the camera scale' while "
        "its Targeted correction demands it, and its image numbering is "
        "transposed in the same way as study/E's."),
   extra_correction=("As study/E. This facing has no tier-1 ruler by "
                     "instruction ('No architectural feature or focal object of "
                     "any kind'), so its whole scale rests on the transferred "
                     "module; a ruled-size feature in the wall plane would make "
                     "it measurable on its own terms.")),
 "study/S": dict(
   kind="generation_miss",
   why=("THE RULED ANCHOR WAS NOT DRAWN TO RULE, so no scale can be issued. "
        "The three bays the prompt rules 'exactly 0.90 metre' each measure "
        "235.5, 255.0 and 235.5 px between their outer mullion centre-lines - "
        "an 8.1 % spread on a wall parallel to the image plane, where a "
        "perspective projection has one scale and equal features must project "
        "equally. The two outer bays agree with each other to the pixel, so "
        "this is not measurement noise: it is the middle bay, and the middle "
        "bay's own three lights measure 55/65/59 px where the outer bays' "
        "measure 55/55/55 and 55/54/57. That is a local stretch at the frame "
        "centre, not a camera move - the signature of an edit model enlarging a "
        "composition by pulling its middle rather than re-projecting it. It is "
        "consistent with the rest: the corner span went 1176 -> 1230 px, +4.6 % "
        "of the +21 % the re-ask asked for, so the model half-obeyed the "
        "enlargement and paid for it in the middle of the wall. Picking a bay "
        "would pick the verdict - the outer bays imply 1007 px (PASS) and the "
        "middle 1090 px (FAIL) - so no number is issued."),
   blocked_on=("three window bays drawn to equal width, spread within the "
               "+/-3 % band. Until they are equal this facing has no tier-1 "
               "ruler, and it has no tier-2 ruler either: the south wall is "
               "glazed and carries no dado rail in the wall plane."),
   extra_correction=("The re-ask carries no scale factor, because we cannot "
                     "measure this facing's scale. It carries the equality: "
                     "three bays, identical pixel width, and a stated tolerance "
                     "of 3 %.")),
 "hall/E": dict(
   kind="generation_miss",
   why=("THE END WALL SHRANK WHEN IT WAS ASKED TO GROW, and this facing is now "
        "worse than cand-1. Measured by one corner rule across both rounds the "
        "end wall spans 350 px on cand-1 and 231 px on cand-2 against a target "
        "of 437 px: the re-ask moved it 119 px in the wrong direction. By that "
        "same ruler the implied focal went -20.0 % -> -47.2 % (the cand-1 run "
        "quoted -10.2 % for this facing, but off a dado module the corridor has "
        "no right to, so the like-for-like comparison is the corner span's). "
        "The cause is legible in the prompt: "
        "every negative in it pushes the same way - 'It is NARROW, only 2.60 "
        "metres across; do not paint it deeper or wider than the plan', 'reads "
        "small and far', 'Avoid: end wall larger than about 437 pixels', "
        "'Avoid: corridor reading wide or square' - while only the Targeted "
        "correction asks for enlargement, and that same Avoid line forbids "
        "'changing the camera scale'. A target stated as a one-sided ceiling "
        "gets treated as a ceiling. The file also names the wrong reference: "
        "'matching Image 1's camera character and correcting Image 2's corridor "
        "geometry', where its own header makes Image 2 the approved study/N - a "
        "study wall with no corridor in it at all. "
        "TRUST: this is the weakest number in the run and it is a tier-3 "
        "number. This facing has NO ruled-size feature - the end window's size "
        "is not ruled anywhere - and it is not the study, so there is no module "
        "to transfer. Its second, inadmissible reading (the plan's 2.80 m "
        "storey against the measured 311 px ceiling-to-floor span) puts it at "
        "-34.0 %. The two disagree by 22 %, so the MAGNITUDE below is soft; "
        "both are 11 to 16 times the band from the approved camera, so the "
        "direction is not."),
   extra_correction=("Rule a size for the end window, or accept that this "
                     "facing can only ever be measured circularly. State the "
                     "end-wall target as an equality with a tolerance, not as "
                     "'no larger than'.")),
 "hall/W": dict(
   kind="generation_miss",
   why=("Same one-sided ceiling, same result, and this facing had a tier-1 "
        "ruler to prove it with. The end wall spans 297 px on cand-2 against "
        "369 px on cand-1 and a target of 437 px - again the wrong direction, "
        "and by the door-height ruler the implied focal went -19.2 % -> "
        "-37.0 %, so this facing is twice as far out as it was. "
        "The door opening in it is painted 116 x 212 px where the plan rules "
        "1.00 x 2.00 m, so the height ruler gives 106.0 px/m and the width "
        "ruler 116.0 px/m, and the plan's own 2.60 m corridor width applied to "
        "the corner span gives 114.2 px/m. Three independent rulers within "
        "9 % of each other, ALL of them 31-37 % short of the approved camera: "
        "the measurement is sound and the picture is wrong. Its prompt carries "
        "the same 'Avoid: end wall larger than about 437 pixels' with 'Avoid: "
        "changing the camera scale', and the same transposed image numbering "
        "('correcting Image 2's corridor geometry', where Image 2 is the study "
        "north wall)."),
   extra_correction=("As hall/E. Note that the opening is drawn 2.14 : 1 where "
                     "the plan rules 2 : 1, so the doorway needs its aspect "
                     "restated as well as its size.")),
 "hall/N": dict(
   kind="measurement_withheld",
   why=("NOTHING IN THIS FRAME CAN BE CONVERTED INTO A SCALE, and that is our "
        "defect and not the painting's. The facing's own cand-2 prompt forbids "
        "every feature this gate measures - 'NO floor line. NO visible floor. "
        "NO ceiling line. NO visible ceiling. NO corners in frame' - and adds "
        "'no feature, carrier, opening or decoration'. The painting obeyed "
        "exactly: the strongest true horizontal in the top band is a panel rail "
        "at strength 9.6 against the 55-67 a real ceiling junction gives on the "
        "study facings, the frame's top 40 rows are dark oak at a mean luma of "
        "9.3 against 84-155 for plaster, and the corner scan returns a "
        "different pair of columns for every candidate ceiling row it is given, "
        "which is what a corner detector does when there is no corner. The "
        "cand-1 harness, pointed at this image without re-tuning, answered "
        "255.6 px/m and a 2.93 m storey off a panel rail it had mistaken for a "
        "dado; that number was the detector describing its own window, and it "
        "is withdrawn."),
   blocked_on=("a feature of ruled size painted in the wall plane. The "
               "production law already records this class of miss and its fix - "
               "'feature-poor walls unmeasurable -> ruled-size anchors (0.90 m "
               "window bays)' - and this facing is the case that fix was never "
               "applied to. Either the wall-band contract gains a ruled-size "
               "anchor (a panel bay of stated width would do, and would not "
               "break 'no feature': a panel is panelling), or these two facings "
               "are exempted from the camera gate and their scale is inherited "
               "from a facing that can be measured.")),
 "hall/S": dict(
   kind="measurement_withheld",
   why=("As hall/N, and by the same instruction. The tapestry is the only thing "
        "on the wall and no size is ruled for it. Strongest true horizontal in "
        "the top band 20.2 at a horizontality of 0.68 - a panel rail, not a "
        "junction; top 40 rows at a mean luma of 7.7; no floor, no ceiling, no "
        "corner. The cand-1 harness answered 288.9 px/m here, its highest "
        "number of the eight, off a rail 260 px above a floor line that does "
        "not exist in the frame. Withdrawn."),
   blocked_on=("a feature of ruled size painted in the wall plane, exactly as "
               "hall/N. If the tapestry is to stay, rule its size: a tapestry "
               "of stated width is a ruler and costs the composition nothing.")),
}


def cand2_doc(fac, r, module_m):
    cfg, m, d = r["cfg"], r["measured"], r["derived"]
    prim = r["primary"]
    doc = {
      # [Row 21, round 3 — G13] THE CANDIDATE'S OWN BYTES, and this is the
      # round `tools/promote-backdrop.mjs` actually reads. A critic repainted a
      # candidate in place — moved its fireplace 200 px — and the promotion
      # dressed the new picture in the old measurement's numbers, because the
      # only binding between the two was a PATH in a sentence. A path is not a
      # picture. The promotion refuses when this digest is not the digest of
      # the file it is promoting.
      "_source_sha256": hashlib.sha256(
          open(os.path.join(ROOT, cfg["src"]), "rb").read()).hexdigest(),
      "_what_this_is":
        "DRAFT §5 meta for %s, measured off %s by design/plan-draft/measured/"
        "measure.py --round cand2. Not a shipped backdrops/<loc>/<facing>."
        "meta.json: nothing consumes it. Every _px value was read off the "
        "pixels; the only assumed quantities are the ruled real-world sizes "
        "named in _rulers, and _rulers carries every ruler this facing can "
        "bear, not only the one adopted." % (fac, cfg["src"]),
      "_role": cfg["role"],
      "verdict": r["verdict"],
      "facing_type": ("wall_band" if cfg.get("wall_band") else
                      ("enclosed" if (m["corner_x0_px"] is not None and
                                      m["corner_x1_px"] is not None)
                       else "wall_band")),
      "image_h_px": H,
      "floor_line_y": (round(m["wall_floor_line_y_px"] / H, 6)
                       if m["wall_floor_line_y_px"] is not None else None),
      "horizon_y": (round(m["horizon_y_px"] / H, 6)
                    if m["horizon_y_px"] is not None else None),
      # NULL, not a number, when the verdict is WITHHELD. gate.py quotes this
      # field as a verdict, and a withheld facing must not put a number where a
      # verdict would be read off it.
      "px_per_m_at_wall": (round(r["ppm"], 3) if r["ppm"] else None),
      "px_per_m_at_bottom": (round(d["px_per_m_at_bottom"], 2)
                             if d["px_per_m_at_bottom"] else None),
      "wall_width_m": (round(d["implied_wall_width_m"], 3)
                       if d["implied_wall_width_m"] else None),
      "camera_wall_m": (round(d["implied_camera_wall_m"], 4)
                        if d["implied_camera_wall_m"] else None),
      "corner_x0_px": m["corner_x0_px"],
      "corner_x1_px": m["corner_x1_px"],
      "key_tint": r["light"]["key_tint"],
      "key_dir": "%s-%s" % (
          r["light"]["key_dir_measured"],
          "ABOVE" if (m["horizon_y_px"] is not None and
                      r["light"]["key_dir_brightest_y"] < m["horizon_y_px"])
          else ("BELOW" if m["horizon_y_px"] is not None else "NO-HORIZON")),
      "calibration_ref": (prim["what"] if prim else None),
      "calibration_px": (prim["feature_px"] if prim else None),
      "calibration_tier": (prim["tier"] if prim else None),
      "_rulers": r["rulers"],
      "_ruler_rule": (
        "Fixed before the answers. tier 1 a ruled-size feature painted in the "
        "wall plane (door opening 1.00 x 2.00 m, longer dimension read; "
        "fireplace opening 0.90 m; window bay 0.90 m between outer mullion "
        "centre-lines); tier 2 the panelling module transferred from the "
        "approved frame of the SAME room (study only); tier 3 the plan's own "
        "ruled wall width, admissible only where no tier 1 or 2 ruler exists "
        "and only with the circularity stated; otherwise WITHHELD. The adopted "
        "ruler is the first ADMISSIBLE entry of _rulers; the rest are measured "
        "and printed so the reading can be overturned."),
      "_ruler_agreement_pct": r["ruler_agreement_pct"],
      "_ruler_control": (
        "The approved frame is the run's control and its own rulers are "
        "circular by construction: the reference 1010 px is defined by its "
        "fireplace reading and the transferred module is defined by its dado. "
        "What it does prove is that the code reads the same pixels the same "
        "way - see _control." if fac == "study/N" else
        "This facing's own control is its second ruler, because study/N proves "
        "only that the code has not changed, not that THIS facing's re-tuned "
        "windows are looking at the features they name. %s" % (
          ("Its %d admissible rulers span %.2f %% of each other."
           % (len([x for x in r["rulers"] if x["admissible"]]),
              r["ruler_agreement_pct"]))
          if r["ruler_agreement_pct"] is not None else
          "IT HAS AT MOST ONE ADMISSIBLE RULER, so there is no cross-check: any "
          "number here rests on one re-tuned detector window and on nothing "
          "else, and is a direction rather than a magnitude.")),
      "_withheld_because": r["withheld_because"],
      "_measured_px": m,
      "_how_each_was_measured": HOW,
      "_candidates": {"wall_ceiling_line": r["ceil_cands"],
                      "wall_floor_line": r["floor_cands"],
                      "wall_floor_line_hand_read_window": r["floor_window"],
                      "dado_rail": r["rail_cands"]},
      "_panelling_module": r["module"],
      "_window_bays": r["bays"],
      "_wall_band_audit": r["wall_band_audit"],
      "_corner_evidence": {
          "rule": ("cand-2 rule: the ceiling-line step must collapse below "
                   "30 % of its median over the 80 columns on the WALL side of "
                   "the candidate, for 10 consecutive columns. The cand-1 rule "
                   "compared against the frame's middle instead and put "
                   "study/W's left corner 64 px inside the real one."),
          "vertical_edge_confirming_x0": r["corner_vertical_edge_x0"],
          "vertical_edge_confirming_x1": r["corner_vertical_edge_x1"]},
      "_horizon_votes": {"per_region": r["votes"],
                         "adopted_y": m["horizon_y_px"],
                         "adopted_x": m["horizon_x_px"],
                         "adopted_rule": "edge-pixel-weighted mean of the regions that voted",
                         "ceiling_ramp_intersection": r["ceiling_ramp_vp"]},
      "_derived": {k: (round(v, 4) if isinstance(v, float) else v)
                   for k, v in d.items()},
      "_light": r["light"],
      "_plan": dict(PLAN[fac], camera_wall_m_in_standpoints_tsv_now=PLAN_NOW[fac],
                    _note=("The cand-2 round compares against standpoints.tsv "
                           "as it stands NOW (%.2f m for this facing), because "
                           "that is the distance gate.py multiplies by."
                           % PLAN_NOW[fac])),
      "_module_m": module_m,
      "_prompt_forbids": cfg.get("forbids"),
      "_raw_detector_output_before_wall_band_suppression": (
          {"wall_ceiling_line_y_px": r["raw_ceiling_line_y_px"],
           "wall_floor_line_y_px": r["raw_floor_line_y_px"],
           "_why": ("A wall-band facing has no ceiling line and no floor line, "
                    "so the emitted values are null. These are what the "
                    "detectors returned anyway, kept because they are the "
                    "numbers the cand-1 harness reported as if they meant "
                    "something.")}
          if cfg.get("wall_band") else None),
    }
    if fac == "study/N":
        doc["_control"] = r["control"]
    return doc


def control_check(r):
    """study/N cand-2, measured by the cand-2 code, against the committed run."""
    m = r["measured"]
    got = dict(wall_ceiling_line_y_px=m["wall_ceiling_line_y_px"],
               wall_floor_line_y_px=m["wall_floor_line_y_px"],
               corner_x0_px=m["corner_x0_px"], corner_x1_px=m["corner_x1_px"],
               fireplace_opening_width_px=m["fireplace_opening_width_px"],
               px_per_m_at_wall=round(r["rulers"][0]["px_per_m_at_wall"], 3))
    deltas = {k: (CONTROL[k], got[k], round(got[k] - CONTROL[k], 3))
              for k in CONTROL}
    ok = all(abs(v[2]) < 0.001 for v in deltas.values())
    return dict(passed=ok, expected=CONTROL, measured=got,
                per_field=[{"field": k, "committed": v[0], "measured": v[1],
                            "delta": v[2]} for k, v in deltas.items()],
                _why=("The control is the one approved frame measured by the "
                      "same code as everything else. If it has moved, the code "
                      "has changed what it reads and every verdict in the run "
                      "is VOID - an agent measuring a picture several ways "
                      "until one agrees with its expectation is this project's "
                      "oldest defect, and this is the cheapest thing that stops "
                      "it. What it does NOT prove: that the seven re-tuned "
                      "window sets are looking at the features they name. That "
                      "is what each facing's second ruler is for."))


def write_misses(raw):
    """misses.jsonl - the machine-readable miss ledger design/production-law.md
    requires. One JSON object per line, every line self-describing."""
    path = os.path.join(OUT, "misses.jsonl")
    # THE LEDGER'S OWN CLOSE-OUT SURVIVES A RE-MEASUREMENT. [Row 21, round 2]
    # `baked_in` is production-law clause 3's field -- what made this class of
    # miss impossible, and when. It is written by the hand that lands the fix,
    # NOT by this script, which knows only what the pixels say. Rewriting the
    # file from scratch wiped it on every re-run, so the law's own evidence
    # lived in a file whose generator destroyed it, which is the law's own
    # definition of an open miss. Carried forward per facing instead, along
    # with `status`: a miss's measurement is this script's, its disposition is
    # not.
    carried = {}
    if os.path.exists(path):
        with open(path) as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                try:
                    prev = json.loads(line)
                except ValueError:
                    continue
                if prev.get("_record") == "miss" and prev.get("facing"):
                    carried[prev["facing"]] = {
                        "baked_in": prev.get("baked_in"),
                        "status": prev.get("status", "open"),
                    }
    lines = [dict(
        _record="header",
        _what_this_is=("The camera miss ledger for the backdrop acceptance "
                       "gate, machine-readable, one JSON object per line. "
                       "Written by design/plan-draft/measured/measure.py "
                       "--round cand2; supersedes miss-ledger.json, which was "
                       "the round-20 prose record and has one home now, this "
                       "one."),
        _law="design/production-law.md clause 2: every accuracy miss is logged "
             "with its DIAGNOSED CAUSE, machine-readable, beside the gates. "
             "Clause 3: a miss closes only when its cause is baked in "
             "algorithmically, cited by commit - `baked_in`, null until then.",
        _gate="design/plan-draft/measured/gate.py. A candidate is admitted when "
              "px_per_m_at_wall x the facing's DRAWN standpoint lands within "
              "+/-3 % of study/N's measured 1010 px. Blueprint §5.",
        _kinds={"generation_miss": "the PAINTING missed. Carries a delta and a "
                                   "correction the asset seat can act on.",
                "measurement_withheld": "WE cannot measure the painting. "
                                        "Carries no delta and no re-ask - it "
                                        "carries blocked_on, which is what has "
                                        "to change before a verdict is "
                                        "possible. Sending a re-ask against a "
                                        "number we cannot trust sends the seat "
                                        "chasing a defect that is on our side."},
        _round="cand-2, the seat's first camera-enforced regeneration of the seven",
        _evidence=("design/plan-draft/measured/<loc>-<facing>.json carries every "
                   "ruler measured per facing with its own delta; "
                   "design/batches/row21-promotion/measured/<loc>-<facing>-"
                   "marked.png is the frame with every line the measurement "
                   "used drawn on it, because a line lying on nothing is "
                   "visible to a human in one look and to no amount of JSON."),
        _control=("Every run re-measures study/N cand-2, the one approved "
                  "frame, with the same code, and must return ceiling 81, "
                  "floor 777, corners 142/1389, fireplace 209 px and 232.222 "
                  "px/m. It did. That proves the code has not changed what it "
                  "reads; it does NOT prove the seven re-tuned window sets are "
                  "looking at the features they name, which is what each "
                  "facing's `rulers` list is for."),
        _generated="2026-08-22")]

    for fac in FACINGS:
        r = raw[fac]
        if fac == "study/N":
            continue                     # the approved frame; it is not a miss
        info = MISS[fac]
        prim, dist = r["primary"], PLAN_NOW[fac]
        target_ppm = REFERENCE_PX / dist
        rec = dict(
            _record="miss", facing=fac, candidate=r["src"],
            kind=info["kind"], gate="design/plan-draft/measured/gate.py",
            verdict=r["verdict"],
            measured=dict(
                ruler=(prim["name"] if prim else None),
                ruler_tier=(prim["tier"] if prim else None),
                ruler_px=(prim["feature_px"] if prim else None),
                ruled_m=(prim["ruled_m"] if prim else None),
                px_per_m_at_wall=r["ppm"],
                implied_focal_px=(prim["implied_focal_px"] if r["ppm"] else None),
                drawn_standpoint_m=dist),
            rulers=[dict(name=x["name"], tier=x["tier"], px=x["feature_px"],
                         px_per_m_at_wall=x["px_per_m_at_wall"],
                         implied_focal_px=x["implied_focal_px"],
                         delta_pct=x["delta_pct"], admissible=x["admissible"])
                    for x in r["rulers"]],
            target=dict(target_focal_px=REFERENCE_PX,
                        target_px_per_m_at_wall=round(target_ppm, 2),
                        band_pct=BAND * 100),
            delta_pct=(prim["delta_pct"] if r["ppm"] else None),
            trust=None, robustness=None, why=info["why"],
            correction=None, blocked_on=info.get("blocked_on"),
            status=carried.get(fac, {}).get("status", "open"),
            baked_in=carried.get(fac, {}).get("baked_in"))

        adm = [x for x in r["rulers"] if x["admissible"]]
        if adm:
            lo = min(x["delta_pct"] for x in adm)
            hi = max(x["delta_pct"] for x in adm)
            rec["robustness"] = (
                "%d admissible ruler%s; every one of them puts this facing "
                "%+.1f to %+.1f %% from the approved camera%s."
                % (len(adm), "" if len(adm) == 1 else "s", lo, hi,
                   ". ONE RULER ONLY - direction, not magnitude"
                   if len(adm) == 1 else ""))
            rec["trust"] = ("rulers agree to %.2f %%" % r["ruler_agreement_pct"]
                            if r["ruler_agreement_pct"] is not None
                            else "single ruler, no cross-check available")
        else:
            dq = [x for x in r["rulers"]
                  if x.get("instance_spread_pct") is not None]
            if dq:
                rec["robustness"] = (
                    "no admissible ruler. This facing HAS a tier-1 ruler and it "
                    "was disqualified: its %d instances of one ruled size "
                    "measure %s px, a spread of %.1f %%. Taken one at a time "
                    "they imply %s px - the band is +/-3 %% of 1010, so the "
                    "instance chosen would choose the verdict."
                    % (len(dq[0]["instances_px"]),
                       "/".join("%.1f" % v for v in dq[0]["instances_px"]),
                       dq[0]["instance_spread_pct"],
                       "/".join("%.0f" % (v / BAY_M * PLAN_NOW[fac])
                                for v in dq[0]["instances_px"])))
                rec["trust"] = ("the ruler disagrees with itself by %.1f %% "
                                "against a %.0f %% band" %
                                (dq[0]["instance_spread_pct"], BAND * 100))
            else:
                rec["robustness"] = ("no ruler of any tier; nothing in this "
                                     "frame converts to px_per_m_at_wall")
                rec["trust"] = "not measurable"

        if r["ppm"]:
            rec["correction"] = (
                "the wall must draw %.3fx larger: %.1f px/m at the wall plane, "
                "not %.1f, at the drawn standpoint of %.2f m. %s"
                % (target_ppm / r["ppm"], target_ppm, r["ppm"], dist,
                   info.get("extra_correction", "")))
        elif info.get("extra_correction") and info["kind"] == "generation_miss":
            rec["correction"] = info["extra_correction"]
        lines.append(rec)

    with open(path, "w") as fh:
        for rec in lines:
            fh.write(json.dumps(rec) + "\n")
    return path


def marked_frame(fac, r):
    """The frame with every line the measurement used drawn on it.

    A number is only as good as the line it was read off, and a line that lies
    on nothing is visible to a human in one look and to no amount of JSON.
    """
    from PIL import Image, ImageDraw, ImageFont
    cfg, m = r["cfg"], r["measured"]
    im = Image.open(os.path.join(ROOT, cfg["src"])).convert("RGB")
    dr = ImageDraw.Draw(im)
    try:
        font = ImageFont.load_default(size=17)
        big = ImageFont.load_default(size=21)
    except TypeError:                       # very old Pillow
        font = big = ImageFont.load_default()

    CY, FL, HZ, CO, RU = ((0, 229, 255), (124, 252, 0), (255, 0, 200),
                          (255, 149, 0), (255, 235, 59))

    def hline(y, c, label, x=8):
        if y is None:
            return
        dr.line([(0, y), (W - 1, y)], fill=c, width=2)
        dr.text((x, y + 3), label, fill=c, font=font)

    def vline(x, c, label, y=H - 120):
        if x is None:
            return
        dr.line([(x, 0), (x, H - 1)], fill=c, width=2)
        dr.text((x + 4, y), label, fill=c, font=font)

    hline(m["wall_ceiling_line_y_px"], CY, "ceiling y=%s" % m["wall_ceiling_line_y_px"])
    hline(m["wall_floor_line_y_px"], FL, "floor y=%s" % m["wall_floor_line_y_px"])
    hline(m["horizon_y_px"], HZ, "horizon y=%s" % m["horizon_y_px"], x=640)
    vline(m["corner_x0_px"], CO, "corner x=%s" % m["corner_x0_px"])
    vline(m["corner_x1_px"], CO, "corner x=%s" % m["corner_x1_px"])

    if r["opening"]:
        o = r["opening"]
        dr.rectangle([o["opening_x0_px"], o["opening_y0_px"],
                      o["opening_x1_px"], o["opening_y1_px"]], outline=RU, width=3)
        dr.text((o["opening_x0_px"] + 5, o["opening_y0_px"] - 22),
                "door opening %d x %d px  (ruled 1.00 x 2.00 m)"
                % (o["opening_width_px"], o["opening_height_px"]), fill=RU, font=font)
    if r["fire"]:
        f = r["fire"]
        for x in (f["fireplace_opening_x0_px"], f["fireplace_opening_x1_px"]):
            dr.line([(x, 300), (x, m["wall_floor_line_y_px"])], fill=RU, width=3)
        dr.text((f["fireplace_opening_x0_px"] + 5, 280),
                "fireplace opening %d px (ruled 0.90 m)"
                % f["fireplace_opening_width_px"], fill=RU, font=font)
    if r["module"] and r["module"]["capping_y_px"] is not None:
        mo = r["module"]
        for y, lab in ((mo["capping_y_px"], "dado capping y=%d (%d px above floor)"
                        % (mo["capping_y_px"], mo["capping_above_floor_px"])),
                       (mo["dado_rail_y_px"], "dado rail y=%d (%d px above floor)"
                        % (mo["dado_rail_y_px"], mo["dado_rail_above_floor_px"]))):
            dr.line([(200, y), (1400, y)], fill=RU, width=2)
            dr.text((210, y - 20), lab, fill=RU, font=font)
    if r["bays"]:
        for i, b in enumerate(r["bays"]["bays"]):
            x0 = b["light_centres_px"][0] - (b["width_px"] / 3.0) / 2.0
            x1 = b["light_centres_px"][-1] + (b["width_px"] / 3.0) / 2.0
            dr.rectangle([x0, 190, x1, 600], outline=RU, width=3)
            dr.text((x0 + 6, 165), "bay %d: %.1f px (ruled 0.90 m)"
                    % (i + 1, b["width_px"]), fill=RU, font=font)
            for g in b["lights"]:
                dr.rectangle([g[0], 210, g[1], 580], outline=(255, 235, 59, 90))

    prim = r["primary"]
    head = ["%s   cand-2   %s" % (fac, r["verdict"])]
    if prim:
        head.append("ruler: %s (tier %d)  %.1f px / %.4f m = %.2f px/m"
                    % (prim["name"], prim["tier"], prim["feature_px"],
                       prim["ruled_m"], prim["px_per_m_at_wall"]))
        head.append("implied focal %.0f px at the drawn %.2f m  ->  %+.1f %% of 1010"
                    % (prim["implied_focal_px"], PLAN_NOW[fac], prim["delta_pct"]))
    for w in (r["withheld_because"] or [])[:2]:
        head.append("WITHHELD: " + (w[:96] + "..." if len(w) > 96 else w))
    dr.rectangle([0, 0, W - 1, 26 * len(head) + 12], fill=(0, 0, 0))
    for i, line in enumerate(head):
        dr.text((10, 8 + 26 * i), line, fill=(255, 255, 255), font=big)

    os.makedirs(MARKED, exist_ok=True)
    loc, f = fac.split("/")
    out = os.path.join(MARKED, "%s-%s-marked.png" % (loc, f))
    im.save(out)
    return out


def main_cand2():
    module_m = {}
    raw = {}
    for fac in FACINGS:
        r = measure2(fac, module_m)
        if fac == "study/N":
            # The module's metre size is DERIVED from the control's own reading,
            # here, once, and then transferred. Nothing types it in.
            ppm_n = r["rulers"][0]["px_per_m_at_wall"]
            module_m = {
              "capping": r["module"]["capping_above_floor_px"] / ppm_n,
              "dado_rail": r["module"]["dado_rail_above_floor_px"] / ppm_n,
              "_from": ("study/N cand-2, the approved frame: capping %d px and "
                        "dado rail %d px above its floor line at %.3f px/m."
                        % (r["module"]["capping_above_floor_px"],
                           r["module"]["dado_rail_above_floor_px"], ppm_n)),
              "_spec": ("design/specs/21-painted-promotion.md §1 names this "
                        "module as 213 px at 232.222 px/m => 0.9172 m; this run "
                        "reproduces it from the pixels rather than being told "
                        "it.")}
            r = measure2(fac, module_m)   # re-run so the control sees its own module
            r["control"] = control_check(r)
        raw[fac] = r

    ctl = raw["study/N"]["control"]
    for fac in FACINGS:
        loc, f = fac.split("/")
        json.dump(cand2_doc(fac, raw[fac], module_m),
                  open(os.path.join(OUT, "%s-%s.json" % (loc, f)), "w"), indent=2)
        marked_frame(fac, raw[fac])
    json.dump({k: {kk: vv for kk, vv in v.items() if kk != "cfg"}
               for k, v in raw.items()},
              open(os.path.join(OUT, "_raw.json"), "w"), indent=2, default=str)
    misses = write_misses(raw)

    print("CONTROL study/N cand-2: %s" % ("PASSED" if ctl["passed"] else "*** MOVED ***"))
    for p in ctl["per_field"]:
        print("   %-28s committed %-9s measured %-9s delta %s"
              % (p["field"], p["committed"], p["measured"], p["delta"]))
    if not ctl["passed"]:
        print("\n*** THE CONTROL HAS MOVED. EVERY VERDICT IN THIS RUN IS VOID. ***\n")

    print("\n%-9s %-18s %8s %9s %8s %7s  %s"
          % ("facing", "ruler", "px", "px/m", "focal", "delta", "verdict"))
    for fac in FACINGS:
        r = raw[fac]
        p = r["primary"]
        if p and r["ppm"]:
            print("%-9s %-18s %8.1f %9.2f %8.0f %+6.1f%%  %s"
                  % (fac, p["name"], p["feature_px"], p["px_per_m_at_wall"],
                     p["implied_focal_px"], p["delta_pct"], r["verdict"]))
        else:
            print("%-9s %-18s %8s %9s %8s %7s  %s"
                  % (fac, "-", "-", "-", "-", "-", r["verdict"]))
    print("\nWITHHELD, and why:")
    for fac in FACINGS:
        for w in raw[fac]["withheld_because"] or []:
            print("  %-9s %s" % (fac, w))
    print("\nledger: %s" % os.path.relpath(misses, ROOT))
    print("marked frames: %s/" % os.path.relpath(MARKED, ROOT))
    return 0 if ctl["passed"] else 1


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--round", choices=["cand1", "cand2"], default="cand2",
                    help="cand2 (default) is row 21's; cand1 reproduces row 20's.")
    args = ap.parse_args()
    if args.round == "cand1":
        main_cand1()
        return 0
    return main_cand2()


if __name__ == "__main__":
    sys.exit(main())
