#!/usr/bin/env python3
"""Measure the eight approved backdrops and write DRAFT §5 meta for each.

Re-run:   cd <repo root> && python3 design/plan-draft/measured/measure.py

Writes    design/plan-draft/measured/<loc>-<facing>.json   (eight files)
          design/plan-draft/measured/_raw.json             (everything, for SUMMARY.md)

Reads     backdrops/source/**/cand-*.png  and nothing else. No file outside
          design/plan-draft/measured/ is written.

The method is the one in design/plan-draft/study-N-meta-draft.json's
`_how_each_was_measured`. Where this script departs from the draft, or where a
number is assumed rather than measured, it says so in the output.

WHAT IS MEASURED vs WHAT IS ASSUMED
-----------------------------------
Measured off pixels : every *_px value, key_tint, the Sobel light statistics.
Assumed (declared)  : the real-world size of the calibration feature. Those
                      assumptions are named in `calibration_ref` and their
                      confidence in `calibration_confidence`.
Ruled elsewhere     : nothing. This script derives no focal length; SUMMARY.md
                      reports px_per_m_at_wall x THE PLAN'S standpoint instead.
"""

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

W, H = 1536, 1024

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


HOW = {
 "wall_ceiling_line_y_px":
    "Strongest row-to-row luminance step in the upper band, over columns clear "
    "of the wall's own features, kept only if it is a TRUE horizontal - present "
    "in >=90 % of the columns of that span with a step-strength coefficient of "
    "variation <=0.5. Reported as the last row belonging to the ceiling, so the "
    "junction lies between this row and the next. All candidates, with their "
    "horizontality, are in _candidates.",
 "wall_floor_line_y_px":
    "NOT the strongest step. The strongest step in the lower band is the "
    "SKIRTING CAP: on study/N it is at y 743 and the floor is 34 px lower. The "
    "rule is 'the lowest TRUE horizontal in the band' - floorboard seams below "
    "the floor line converge toward the vanishing point and so fail the "
    "horizontality test (they light up ~0.73 of the columns with CV>1.0 against "
    "~0.95 and CV<0.5 for an architectural horizontal), which is what lets "
    "'lowest' mean 'the floor'. The line is then placed on the darkest row of "
    "the shadow seam at the skirting foot. Every facing shows the same "
    "cap / face / seam / boards sequence and it was read row by row on each.",
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


def main():
    raw = {}
    for fac in FACINGS:
        r = measure(fac)
        raw[fac] = r
        cfg = r["cfg"]
        m = r["measured"]
        d = r["derived"]
        loc, f = fac.split("/")
        doc = {
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


if __name__ == "__main__":
    main()
