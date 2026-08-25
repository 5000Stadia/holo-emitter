#!/usr/bin/env python3
"""Row 42 — where the PAINTING put the window, measured off the pixels.

    python3 design/plan-draft/measured/window_measure.py --facing solar/S \
        --round manor --candidate backdrops/source/solar-S/row23-1a2b3c4d.png

    python3 design/plan-draft/measured/window_measure.py --calibrate

WHY THIS EXISTS, and it is row 27's argument with a different opening in it.
[HUMAN, 2026-08-24, verbatim] "after the fact detect the door location on the
image and put the effective door geometry in the images doorframe? Same with
stairs, maybe Windows? Then we can have door assets and window assets we
literally place in the door frame". Doors already govern from the painting
(`door_measure.py`, row 27) and flights do (row 39). A window did not: nothing
in the pipeline knew where one was, so a casement sprite placed from the PLAN
would stand beside the painted window exactly as the clickable hole once stood
beside the painted door — the defect the Captain found by walking the building.

WHAT IS MEASURED, AND WHY BRIGHTNESS ALONE IS NOT ENOUGH.

A painted window in this corpus is the reverse of a painted doorway: a doorway
is a dark void against a lit wall, a window is a lit opening against a darker
one. So the column statistic is the same and the inequality is turned round,
which is why the threshold sweep lives in `measure_lib.maximally_stable_runs`
and both detectors read it rather than each keeping a copy.

Turned round, though, the statistic is much less discriminating. A doorway's
void is the darkest thing on a wall by a wide margin; a bright rectangle is not
rare at all — a limewashed panel catching the light, a plastered overmantel, the
lit half of a wall beside a hearth. Measured over the whole store the wall
median runs 17–59 and the brightest column in the sill/head band runs 144–218 on
walls WITH a window and 144–166 on two walls WITHOUT one. Brightness alone
cannot separate those.

WHAT ONLY A WINDOW HAS IS THE LEADED LATTICE. This building's glazing is §11's
leaded lights: small quarries in a came grid, roughly 0.08–0.25 m across, so a
window's light is crossed by a FINE PERIODIC set of edges in both directions and
a bright piece of wall is not. That is the discriminator, and it is measured as
periodicity rather than as edge count on purpose: a rough plaster field has
plenty of fine edges and no period at all, while a leaded light's edges repeat.
The reading carries the score, both axes of it, and the quarry pitch it found,
so a refusal downstream can be read rather than guessed at.

THE VERTICAL BAND IS THE PLAN'S, and this file borrows it rather than deciding
it. `tools/room-voices.mjs` rules every window in the manor with its sill 0.90 m
and its head 2.00 m above the floor (`WINDOW_SILL_M`, `WINDOW_HEAD_M`), the
scaffold stamps that band, and every ask names it — so a window is looked for
between those two lines at the wall's own scale and nowhere else. Restated here
because Python cannot import it; if that ruling moves, this constant moves with
it and `windows.spec.mjs` is what says so.

WHAT THIS FILE DOES NOT DECIDE, exactly as `door_measure.py` does not. It does
not know the plan, it does not know which window is which, and it refuses
nothing on the grounds of what the building rules — those are
`tools/promote-backdrop.mjs`'s, which is where the plan lives and where the
promotion is granted or held. This file emits every glazed opening it can see
with the evidence for each, and says nothing else.
"""
import argparse
import json
import os
import re
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, HERE)

import measure_lib as ml  # noqa: E402  (path is set above)

#: The plan's window band, in metres above the floor line at the wall plane.
#: ONE HOME AND IT IS NOT THIS ONE: `tools/room-voices.mjs` carries
#: `WINDOW_SILL_M` / `WINDOW_HEAD_M` and composes every ask from them, and
#: `tools/make-scaffold.mjs`'s `CONVENTION` stamps the same two lines on the
#: diagram. This is the reading side of that same sentence, restated because
#: Python cannot import a `.mjs`; `windows.spec.mjs` asserts the three agree.
WINDOW_SILL_M = 0.90
WINDOW_HEAD_M = 2.00

#: The body of a window, as a fraction of the sill-to-head span. The column
#: statistic is taken between these two so that neither the head's own moulding
#: and the shadow under it nor the sill and its reflected light enter it. A
#: window has to be glazed over the middle 70 % of its own opening to count.
BODY_LO, BODY_HI = 0.15, 0.85

#: The narrowest run of columns this detector will ENUMERATE, in metres at the
#: wall's own scale. It is a floor on ONE LIGHT and not on one window, because
#: the lights are enumerated first and joined across their mullions after: the
#: muniment room's heraldic windows are two lights of 0.33 m apiece, and a floor
#: set at a third of a metre made both of them invisible. It is also deliberately
#: far below the narrowest thing the promotion will accept, so a reading too
#: narrow to be a window arrives at the guard and is refused there by name
#: rather than vanishing inside the detector and arriving as silence.
MIN_ENUMERATED_M = 0.20

#: How many distinct thresholds a candidate's width must survive unchanged to be
#: enumerated. Three is the smallest number that is a run and not a coincidence.
MIN_STABILITY = 3
STABLE_TOL = 0.05

#: WHAT A WINDOW IN THIS BUILDING CAN BE, vertically, and the clamp the measured
#: head and sill are held inside. The plan rules 0.90-2.00 m and the paintings
#: draw taller than that, so a reading is allowed to run out to these and no
#: further: a light whose "head" reaches a bright ceiling or whose "sill" reaches
#: a lit floor is not a window that was found, it is a threshold that escaped.
MIN_HEAD_M, MAX_HEAD_M = 1.20, 2.80
MIN_SILL_M, MAX_SILL_M = 0.20, 1.60

#: A leaded quarry's pitch, in metres, as the lags the periodicity is looked for
#: over. §11's glazing is small quarries in a came grid; below 0.04 m is canvas
#: texture and above 0.30 m is a mullion or a glazing bar, which is a different
#: (and much coarser) period than the one that says "leaded light".
QUARRY_LO_M, QUARRY_HI_M = 0.04, 0.30

#: A MULLION IS NOT A WALL. §11's windows are mullioned: a 1.40 m opening in
#: this manor is painted as two or three lights with a stone bar between them,
#: so the column profile of ONE window is two or three bright runs separated by
#: a narrow dark one. Runs whose gap is no wider than this are the same opening
#: and are merged before anything is scored. Measured on the store, the widest
#: painted mullion is well under a quarter of a metre and the narrowest gap
#: between two SEPARATE windows is over a metre, so nothing here is close.
MULLION_MAX_M = 0.25

#: The lattice floor. A candidate whose periodicity score is under this is a
#: bright piece of wall, not a window. Calibrated on the store, and the
#: calibration is in the row's own report: at this floor the detector pairs 30
#: of the 41 windows the plan rules on promoted walls and finds 2 the plan does
#: not, against 31 and 4 with the lattice test switched off entirely. See the
#: `--calibrate` table, and `test_window_measure.py`'s synthetic cases, which
#: hold a plain bright rectangle on one side of it and a leaded one on the other.
LATTICE_MIN = 0.20

#: THE LIFT — how much brighter than its wall the light is — and on this store it
#: is the STRONGER of the two discriminators, which is worth saying plainly
#: rather than leaving the lattice to carry a weight it does not. Over all 24
#: promoted window walls and the 30 promoted walls the plan rules no window on,
#: a merged candidate on a WINDOW wall lifts 78-147 above its wall median and one
#: on a wall with no window lifts 21-85. Two numbers are used because they fail
#: differently: a wall in strong sunlight can lift, and a dim window in a dark
#: room can be crossed by a lattice; only a leaded light does both.
#:
#: `SWEEP_LIFT` is the floor on ENUMERATION and is deliberately far below
#: `ADMIT_LIFT`, which is the floor on being called a window. A candidate
#: between them is reported as rejected WITH its numbers, because a window the
#: painting drew too dimly must arrive at the guard as a reading nobody could
#: use and not as silence.
#:
#: SAID PLAINLY, BECAUSE THE ROW ASKED FOR THE LATTICE TO BE THE DISCRIMINATOR
#: AND ON THIS STORE IT IS THE JUNIOR ONE: the lift does most of the separating
#: (54-147 against 21-85), and the lattice removes two of the four bright pieces
#: of wall the lift alone lets through, at the cost of one painted window. Both
#: are kept because they fail differently and row 37 is about to change what a
#: painted wall's brightness means — when illumination becomes a runtime pass
#: over neutral backdrops, the lift will stop separating and the lattice, which
#: is a fact about the GLAZING rather than about the light on it, will not.
SWEEP_LIFT = 12.0
ADMIT_LIFT = 60.0


def _body_rows(shape_h, floor_y, ppm):
    """The rows a window's glazing occupies, per the plan's sill and head."""
    y_head = floor_y - WINDOW_HEAD_M * ppm
    y_sill = floor_y - WINDOW_SILL_M * ppm
    span = y_sill - y_head
    # Measured UP from the sill, which is `door_measure`'s own idiom read on
    # this band instead of on the floor-to-head one.
    y0 = int(round(max(0, y_sill - BODY_HI * span)))
    y1 = int(round(min(shape_h - 1, y_sill - BODY_LO * span)))
    return y0, y1


def _body_profile(L, floor_y, ppm):
    """v(x): the median luminance of each column over a window's glazing rows.

    The median rather than the mean because one came, one dark quarry or one
    bar of a glazing grid must not pull a column out of the light — the same
    argument `door_measure` makes for the opposite reason.
    """
    y0, y1 = _body_rows(L.shape[0], floor_y, ppm)
    if y1 - y0 < 8:
        return None, (y0, y1)
    return np.median(L[y0:y1, :], axis=0), (y0, y1)


def _stable_bright_runs(v, x0, x1, minw):
    """Every maximally stable BRIGHT run in v[x0:x1], with its stability.

    The floor on the sweep is the wall's own median: below it, "lighter than
    the wall" stops meaning anything, exactly as "darker than the wall" does
    above the median on the door side. The sweep itself is
    `measure_lib.maximally_stable_runs`, shared with `door_measure.py`.
    """
    base = float(np.median(v[x0:x1]))
    top = float(np.max(v[x0:x1]))
    lo = int(round(base + SWEEP_LIFT))
    hi = int(round(top))
    if hi <= lo:
        return [], base
    out = ml.maximally_stable_runs(
        v, x0, x1, minw, range(lo, hi), "bright",
        min_stability=MIN_STABILITY, stable_tol=STABLE_TOL)
    return out, base


def _periodicity(profile, lo_lag, hi_lag):
    """The strongest normalised autocorrelation of `profile` in a lag window.

    A leaded light's edge profile repeats at the quarry pitch; a plaster field's
    does not repeat at all. So what is scored is not how many edges there are —
    rough plaster has plenty — but whether they come back.
    """
    n = len(profile)
    lo_lag = max(2, int(lo_lag))
    hi_lag = min(int(hi_lag), n // 2)
    if hi_lag <= lo_lag:
        return 0.0, 0
    p = np.asarray(profile, float)
    p = p - p.mean()
    denom = float(np.dot(p, p))
    if denom <= 1e-9:
        return 0.0, 0
    best, best_lag = 0.0, 0
    for lag in range(lo_lag, hi_lag + 1):
        r = float(np.dot(p[:-lag], p[lag:])) / denom
        if r > best:
            best, best_lag = r, lag
    return best, best_lag


def lattice(L, x0, x1, y0, y1, ppm):
    """How much this rectangle looks like glass in a came grid.

    Both axes, because a lattice is a GRID: the quarries repeat across the light
    and up it, and something that repeats in one direction only is a run of
    boards or a bank of shelves.

    THE SCORE IS THE MEAN OF THE TWO, AND THE ALTERNATIVE WAS MEASURED RATHER
    THAN ARGUED. The strict reading — the WEAKER axis, so a candidate must show
    a period both ways — was tried first and is too strict on this corpus: a
    light seen at a shallow angle has its vertical cames compressed towards the
    sampling limit, and a legacy painting draws leading softly. Over the store,
    scoring the weaker axis at the same floor loses NINE painted windows to
    remove one false positive, while the mean loses one and removes two. Both
    axes are reported separately beside the score, so a reading that is stripes
    rather than a grid can still be seen for what it is.
    """
    if x1 - x0 < 8 or y1 - y0 < 8:
        return {"score": 0.0, "x": 0.0, "y": 0.0, "pitch_x_m": None,
                "pitch_y_m": None, "edge_energy": 0.0}
    patch = L[y0:y1, x0:x1]
    gx = np.abs(patch[:, 2:] - patch[:, :-2])
    gy = np.abs(patch[2:, :] - patch[:-2, :])
    col = gx.mean(axis=0)          # a vertical came shows here
    row = gy.mean(axis=1)          # a horizontal one here
    sx, lx = _periodicity(col, QUARRY_LO_M * ppm, QUARRY_HI_M * ppm)
    sy, ly = _periodicity(row, QUARRY_LO_M * ppm, QUARRY_HI_M * ppm)
    return {
        "score": round((sx + sy) / 2.0, 4),
        "x": round(sx, 4), "y": round(sy, 4),
        "pitch_x_m": round(lx / ppm, 3) if lx else None,
        "pitch_y_m": round(ly / ppm, 3) if ly else None,
        "edge_energy": round(float(gx.mean() + gy.mean()) / 2.0, 2),
    }


def _merge_lights(runs, ppm):
    """One window's lights, joined across their mullions.

    A window in this building is mullioned, so its column profile is two or
    three bright runs with a narrow dark bar between them. Left as they are,
    every reading would be a third of a window wide and the guard downstream
    would refuse a correctly painted wall for being too narrow. Runs closer
    together than a mullion are therefore one opening, and the merged record
    keeps the lights it was made of so a reader can see what was joined.
    """
    gap = MULLION_MAX_M * ppm
    out = []
    for g in runs:
        a, b = g["span"]
        if out and a - out[-1]["span"][1] <= gap:
            prev = out[-1]
            prev["span"] = (prev["span"][0], b)
            prev["lights"].append([int(a), int(b)])
            prev["stability"] = max(prev["stability"], g["stability"])
            prev["t"] = min(prev["t"], g["t"])
            prev["t_lo"] = min(prev["t_lo"], g["t_lo"])
            prev["t_hi"] = max(prev["t_hi"], g["t_hi"])
            continue
        out.append({"span": (a, b), "lights": [[int(a), int(b)]],
                    "t": g["t"], "t_lo": g["t_lo"], "t_hi": g["t_hi"],
                    "stability": g["stability"]})
    return out


def _extent(L, span, t, floor_y, ppm, body):
    """The head and the sill this window was actually PAINTED at.

    The plan's 0.90-2.00 m band is where a window is looked FOR; it is not where
    a window IS. Every overlay of this detector's first pass showed the same
    thing - the painter draws these openings taller than the band, heads above
    2.00 m and sills at or below 0.90 - and a casement sprite placed in the ruled
    band would sit inside the painted frame with glass showing above and below
    it, which is row 42's own defect one aperture along.

    So the band bounds the SEARCH and the light's own edges give the answer: the
    threshold that found the columns finds the head and the sill too, walked out
    from the middle of the band. Clamped to what a window in this building can
    be, so that a light running into a bright ceiling cannot swallow the wall.
    """
    a, b = span
    inset = int(round(0.15 * (b - a)))
    cols = L[:, a + inset:b - inset] if b - a > 2 * inset + 2 else L[:, a:b]
    if cols.shape[1] < 3:
        return None
    r = np.median(cols, axis=1)
    mid = (body[0] + body[1]) // 2
    if mid < 1 or mid >= len(r) or not r[mid] > t:
        return None
    # A TRANSOM IS NOT THE HEAD, and the same argument the mullion merge makes
    # across the light: a stone transom or a heavy came reads as a dark row
    # inside a window, so a walk that stops at the first dark row stops at the
    # transom and calls it the head. The overlays showed exactly that on the
    # muniment room's two heraldic windows. So the walk steps OVER a dark band
    # no thicker than a bar and stops at one thicker than that.
    bar = max(1, int(round(MULLION_MAX_M * ppm)))

    def walk(start, step):
        y = start
        while True:
            n = y + step
            if n < 0 or n > len(r) - 1:
                return y
            if r[n] > t:
                y = n
                continue
            probe = n
            jumped = None
            for _ in range(bar):
                probe += step
                if probe < 0 or probe > len(r) - 1:
                    break
                if r[probe] > t:
                    jumped = probe
                    break
            if jumped is None:
                return y
            y = jumped

    top = walk(mid, -1)
    bot = walk(mid, +1)
    head_m = (floor_y - top) / ppm
    sill_m = (floor_y - bot) / ppm
    if not (MIN_HEAD_M <= head_m <= MAX_HEAD_M):
        return None
    if not (MIN_SILL_M <= sill_m <= MAX_SILL_M):
        return None
    return int(top), int(bot), round(head_m, 3), round(sill_m, 3)


def measure_windows(png_path, corner_x0, corner_x1, floor_y, ppm, storey_m=None):
    """Every glazed opening this frame shows, left to right.

    Returns `(candidates, note)`. A candidate is the rectangle at the WALL
    PLANE: `x0`/`x1` are the light's own stable edges and `y0`/`y1` are the
    plan's head and sill lines projected at this wall's scale — the vertical
    band is ruled, not read, because the plan rules it and the painting is only
    asked where along the wall the window stands.

    An empty list is a fact about the frame and not an error: a wall whose
    window cannot be found here is a wall the promotion will refuse by name,
    which is the caller's business and not this file's.
    """
    rgb = ml.load(png_path)
    L = ml.luma(rgb)
    H, W = L.shape
    v, body = _body_profile(L, floor_y, ppm)
    if v is None:
        return [], ("this frame gives a window's glazing fewer than 8 rows to be "
                    "measured over, so there is no column statistic to take")
    x0 = int(max(0, corner_x0 if corner_x0 is not None else 0))
    x1 = int(min(W, corner_x1 if corner_x1 is not None else W))
    if x1 - x0 < 32:
        return [], ("the measured corners leave %d px of wall band, which is "
                    "narrower than any window" % (x1 - x0))
    minw = int(round(MIN_ENUMERATED_M * ppm))
    runs, wall_median = _stable_bright_runs(v, x0, x1, minw)
    lights = [dict(g) for g in runs]
    merged = _merge_lights(lights, ppm)
    y_head = int(round(max(0, floor_y - WINDOW_HEAD_M * ppm)))
    y_sill = int(round(min(H - 1, floor_y - WINDOW_SILL_M * ppm)))
    out, rejected = [], []
    for g in merged:
        a, b = g["span"]
        lat = lattice(L, a, b, body[0], body[1], ppm)
        lit = float(np.median(v[a:b]))
        ext = _extent(L, (a, b), g["t"], floor_y, ppm, body)
        rec = {
            "x0_px": int(a), "x1_px": int(b),
            "y0_px": ext[0] if ext else y_head,
            "y1_px": ext[1] if ext else y_sill,
            "head_m": ext[2] if ext else WINDOW_HEAD_M,
            "sill_m": ext[3] if ext else WINDOW_SILL_M,
            "vertical": ("measured" if ext else
                         "the plan's ruled band; this light's own head and sill "
                         "could not be walked out of it"),
            "width_px": int(b - a), "width_m": round((b - a) / ppm, 3),
            "centre_px": round((a + b) / 2.0, 1),
            "height_m": round((ext[2] - ext[3]) if ext else
                              (WINDOW_HEAD_M - WINDOW_SILL_M), 3),
            "lights": g["lights"],
            "light_luminance": round(lit, 2),
            "wall_luminance": round(wall_median, 2),
            "lift": round(lit - wall_median, 2),
            "threshold": g["t"], "threshold_span": [g["t_lo"], g["t_hi"]],
            "stability": g["stability"],
            "lattice": lat,
        }
        why = []
        if lit - wall_median < ADMIT_LIFT:
            why.append("its light stands only %.1f above a %.1f wall, under the %.0f a "
                       "painted window lifts on this store"
                       % (lit - wall_median, wall_median, ADMIT_LIFT))
        if lat["score"] < LATTICE_MIN:
            why.append("its light is not crossed by a repeating lattice in both "
                       "directions: %.3f against the %.2f a leaded light scores"
                       % (lat["score"], LATTICE_MIN))
        if why:
            rec["rejected"] = "bright, but " + "; and ".join(why)
            rejected.append(rec)
        else:
            rec["confidence"] = round(min(1.0, (lat["score"] / 0.6) * 0.5 +
                                          min(1.0, (lit - wall_median) / 120.0) * 0.5), 3)
            out.append(rec)
    note = {
        "method": ("the maximally stable BRIGHT run in each column's median "
                   "luminance over the middle %d%% of the plan's %.2f-%.2f m "
                   "window band, admitted only where the light is crossed by a "
                   "repeating lattice in both directions and lifts clear of its "
                   "own wall; a window's lights are joined across their "
                   "mullions; nothing here is told what width to look for"
                   % (round(100 * (BODY_HI - BODY_LO)),
                      WINDOW_SILL_M, WINDOW_HEAD_M)),
        "body_rows": [int(body[0]), int(body[1])],
        "wall_band_px": [x0, x1],
        "window_band_px": [y_head, y_sill],
        "wall_median_luminance": round(wall_median, 2),
        "min_enumerated_px": minw,
        "lattice_min": LATTICE_MIN,
        "admit_lift": ADMIT_LIFT,
        "sweep_lift": SWEEP_LIFT,
        "mullion_max_m": MULLION_MAX_M,
        "lights_before_merge": len(runs),
        "candidates_after_merge": len(merged),
        "rejected": rejected,
    }
    return out, note


# ------------------------------------------------------------------- the CLI

def patch(doc_path, png_path, loc, plan):
    """Read the windows off `png_path` and write them into the measurement doc.

    THE READING GOES IN THE MEASUREMENT, NOT IN THE PROMOTION, for the reason
    `door_measure.patch` states in full: every field the promotion tool reads is
    a value the measurement already took off the frame that passed the gate, so
    re-running the promotion cannot produce a number nobody measured.
    """
    doc = json.load(open(doc_path))
    mp = doc.get("_measured_px") or {}
    ppm = doc.get("px_per_m_at_wall")
    floor_y = mp.get("wall_floor_line_y_px")
    if ppm is None or floor_y is None:
        raise SystemExit("window_measure refused: %s carries no scale or no "
                         "floor line" % doc_path)
    found, note = measure_windows(png_path, mp.get("corner_x0_px"),
                                  mp.get("corner_x1_px"), floor_y, ppm)
    mp["windows"] = found
    doc["_measured_px"] = mp
    doc["_windows_read"] = note
    with open(doc_path, "w") as fh:
        json.dump(doc, fh, indent=2)
        fh.write("\n")
    return found, note


def _plan_windows(plan, loc, facing):
    """What the plan rules for this facing, in view metres — the calibration's
    other column. Read out of the plan the way `facingCarriers` reads it."""
    room = next((r for r in plan.get("rooms", []) if r["id"] == loc), None)
    if room is None:
        return []
    fc = (room.get("facings") or {}).get(facing)
    if not fc:
        return []
    NORMAL = {"N": ("y", 1), "E": ("x", 1), "S": ("y", -1), "W": ("x", -1)}
    RIGHT = {"N": ("x", 1), "E": ("y", -1), "S": ("x", -1), "W": ("y", 1)}
    naxis, nsign = NORMAL[facing]
    saxis = "x" if naxis == "y" else "y"
    lo, hi = room["rect"][saxis + "0"], room["rect"][saxis + "1"]
    ralong = RIGHT[facing][1] if RIGHT[facing][0] == saxis else 0
    out = []
    for w in plan.get("windows", []):
        if w.get("floor") != room.get("floor"):
            continue
        r = w["rect"]
        if not (r[saxis + "0"] >= lo - 1e-6 and r[saxis + "1"] <= hi + 1e-6):
            continue
        near = r[naxis + "0"] if nsign > 0 else r[naxis + "1"]
        if abs(near - fc["wall_line"]) > 1e-6:
            continue
        a = (r[saxis + "0"] - lo) if ralong > 0 else (hi - r[saxis + "0"])
        b = (r[saxis + "1"] - lo) if ralong > 0 else (hi - r[saxis + "1"])
        out.append((min(a, b), max(a, b)))
    out.sort()
    return out


def _assign(ruled, got):
    """Which painted light is which ruled window, order-preserving.

    THE SAME CONSTRUCTION `tools/promote-backdrop.mjs` USES FOR DOORS, and for
    the same reason: windows keep their order along a wall however far the
    painter slides them, so the assignment is the increasing run of candidates
    that costs the least total displacement — found by dynamic programming
    rather than by a nearest-neighbour walk, which can cross two windows over
    each other on a wall that carries four.

    This copy is the REPORT's; the promotion's is the authority and is the one
    that writes a meta. They are stated to be the same construction and the
    calibration table is what would show it if they ever were not.
    """
    n, k = len(ruled), len(got)
    cr = [((a + b) / 2.0) for a, b in ruled]
    cg = [((a + b) / 2.0) for a, b in got]
    INF = float("inf")
    cost = [[INF] * (k + 1) for _ in range(n + 1)]
    back = [[-1] * (k + 1) for _ in range(n + 1)]
    for j in range(k + 1):
        cost[0][j] = 0.0
    for i in range(1, n + 1):
        for j in range(i, k + 1):
            c = cost[i - 1][j - 1] + abs(cg[j - 1] - cr[i - 1])
            skip = cost[i][j - 1]
            if c <= skip:
                cost[i][j], back[i][j] = c, j - 1
            else:
                cost[i][j], back[i][j] = skip, back[i][j - 1]
    take = [None] * n
    if n <= k and cost[n][k] < INF:
        j = k
        for i in range(n, 0, -1):
            take[i - 1] = back[i][j]
            j = back[i][j]
    elif k:
        # FEWER LIGHTS THAN WINDOWS. The promotion refuses that wall by name and
        # asks for nothing more; the REPORT still wants to say which of the
        # ruled windows were painted and how far off they landed, so the same
        # order-preserving assignment is run the other way round and the
        # unmatched ruled windows are left showing a dash.
        rev = _assign([got[i] for i in range(k)], ruled) if k <= n else []
        used = 0
        by_ruled = {}
        for gi, (_gm, rm, _dw) in enumerate(rev):
            if rm is None:
                continue
            for ri, c in enumerate(cr):
                if abs(c - rm) < 1e-9 and ri not in by_ruled.values():
                    by_ruled[gi] = ri
                    break
        for gi, ri in by_ruled.items():
            take[ri] = gi
            used += 1
    out = []
    for i, (a, b) in enumerate(ruled):
        p = take[i]
        if p is None:
            out.append(((a + b) / 2.0, None, None))
        else:
            ga, gb = got[p]
            out.append(((a + b) / 2.0, (ga + gb) / 2.0, (gb - ga) - (b - a)))
    return out


def calibrate(plan, only=None):
    """The whole store's window walls, plan against painting. [row 42]

    The same shape as row 27's door log: what the drawing rules, what the
    painting shows, and how far apart their centres are in metres — because
    metres is the unit a sprite is placed in and pixels is not.
    """
    rows, misses = [], []
    for room in plan.get("rooms", []):
        for facing in sorted((room.get("facings") or {}).keys()):
            key = "%s/%s" % (room["id"], facing)
            if only and key not in only:
                continue
            ruled = _plan_windows(plan, room["id"], facing)
            metap = os.path.join(ROOT, "backdrops", room["id"], "%s.meta.json" % facing)
            png = os.path.join(ROOT, "backdrops", room["id"], "%s.png" % facing)
            if not (ruled or os.path.exists(metap)):
                continue
            if not os.path.exists(metap) or not os.path.exists(png):
                continue
            meta = json.load(open(metap))
            ppm = meta.get("px_per_m_at_wall")
            floor_y = meta.get("floor_line_y", 0) * meta.get("image_h_px", 1024)
            if not ppm:
                continue
            found, note = measure_windows(png, meta.get("corner_x0_px"),
                                          meta.get("corner_x1_px"), floor_y, ppm)
            # The comparison is made in APERTURE space — the corner span a
            # placed sprite lives in (row 27's ruling) — not in the ruler.
            cx0 = meta.get("corner_x0_px")
            cx1 = meta.get("corner_x1_px")
            width_m = meta.get("wall_width_m") or 0
            if cx0 is None or cx1 is None or not width_m:
                ap = ppm
                origin = 0.0
            else:
                ap = (cx1 - cx0) / width_m
                origin = cx0
            got = [((f["x0_px"] - origin) / ap, (f["x1_px"] - origin) / ap) for f in found]
            pairs = _assign(ruled, got)
            rows.append({"key": key, "ruled": ruled, "found": got, "pairs": pairs,
                         "note": note})
            if len(got) != len(ruled):
                misses.append((key, len(ruled), len(got)))
    return rows, misses


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--facing", default="", help="<loc>/<F>")
    ap.add_argument("--round", default="", help="the measurement round's directory")
    ap.add_argument("--candidate", default="",
                    help="the png; taken off the doc's own header when omitted")
    ap.add_argument("--plan", default=os.path.join(ROOT, "fixtures", "demo-study", "plan.json"))
    ap.add_argument("--doc", default="",
                    help="write the reading into THIS document instead of the "
                         "round's own")
    ap.add_argument("--calibrate", action="store_true",
                    help="print the whole store's window walls, plan against painting")
    ap.add_argument("--write", default="",
                    help="with --calibrate, also write the table as JSON to this path")
    a = ap.parse_args()
    plan = json.load(open(a.plan))

    if a.calibrate:
        only = [a.facing] if a.facing else None
        rows, misses = calibrate(plan, only)
        print("%-24s %5s %5s  %s" % ("facing", "plan", "seen", "per window: plan m / seen m / dist m / dw m"))
        n_pair = n_close = 0
        dists = []
        for r in rows:
            cells = []
            for (pm, gm, dw) in r["pairs"]:
                if gm is None:
                    cells.append("%.2f/  -  " % pm)
                    continue
                d = abs(gm - pm)
                dists.append(d)
                n_pair += 1
                if d <= 0.35:
                    n_close += 1
                cells.append("%.2f/%.2f/%+.2f/%+.2f" % (pm, gm, gm - pm, dw))
            print("%-24s %5d %5d  %s" % (r["key"], len(r["ruled"]), len(r["found"]),
                                         "  ".join(cells)))
        if dists:
            ds = sorted(dists)
            print("\n%d window(s) paired; median centre distance %.3f m, "
                  "p90 %.3f m, worst %.3f m; %d of %d within 0.35 m"
                  % (len(ds), ds[len(ds) // 2], ds[int(0.9 * (len(ds) - 1))], ds[-1],
                     n_close, n_pair))
        for key, want, got in misses:
            print("  COUNT %s: the plan rules %d, the painting shows %d" % (key, want, got))
        if a.write:
            doc = {
                "_what_this_is":
                    "[row 42] Every promoted wall the plan rules a window on, read off "
                    "its own painting by window_measure.py, against what the drawing "
                    "rules. The centre distance is in metres at the wall's APERTURE "
                    "scale (row 27's ruling: the space a placed target lives in is the "
                    "corner span, not the ruler), because metres is the unit a sprite is "
                    "placed in and pixels is not.",
                "_why_it_is_committed":
                    "promote-backdrop.mjs writes meta.windows only where the measurement "
                    "carries a window reading, and no measurement taken before this row "
                    "has one. This file is the list of walls that clause cannot yet see; "
                    "row23_run.py runs window_reading on every reading from here on, so "
                    "the list can only shrink.",
                "instrument": {
                    "lattice_min": LATTICE_MIN, "admit_lift": ADMIT_LIFT,
                    "sweep_lift": SWEEP_LIFT, "mullion_max_m": MULLION_MAX_M,
                    "min_enumerated_m": MIN_ENUMERATED_M,
                    "window_band_m": [WINDOW_SILL_M, WINDOW_HEAD_M],
                    "quarry_pitch_m": [QUARRY_LO_M, QUARRY_HI_M],
                },
                "paired": len(dists),
                "median_centre_distance_m": round(ds[len(ds) // 2], 3) if dists else None,
                "within_0_35_m": n_close, "of": n_pair,
                "count_mismatches": [
                    {"facing": k, "ruled": w, "painted": g} for k, w, g in misses],
                "walls": [
                    {"facing": r["key"],
                     "ruled_m": [[round(a, 3), round(b, 3)] for a, b in r["ruled"]],
                     "painted_m": [[round(a, 3), round(b, 3)] for a, b in r["found"]],
                     "pairs": [{"plan_centre_m": round(pm, 3),
                                "painted_centre_m": None if gm is None else round(gm, 3),
                                "distance_m": None if gm is None else round(gm - pm, 3),
                                "width_delta_m": None if dw is None else round(dw, 3)}
                               for pm, gm, dw in r["pairs"]]}
                    for r in rows if r["ruled"] or r["found"]],
            }
            with open(a.write, "w") as fh:
                json.dump(doc, fh, indent=2)
                fh.write("\n")
            print("\nwritten %s" % a.write)
        return

    if not a.facing:
        raise SystemExit("window_measure refused: --facing <loc>/<F> or --calibrate")
    loc, facing = a.facing.split("/")
    doc_path = a.doc or os.path.join(HERE, *([a.round] if a.round else []),
                                     "%s-%s.json" % (loc, facing))
    if not os.path.exists(doc_path):
        raise SystemExit("window_measure refused: no measurement at " + doc_path)
    png = a.candidate
    if not png:
        doc = json.load(open(doc_path))
        m = re.search(r"(backdrops/\S+?\.png)", str(doc.get("_what_this_is", "")))
        if not m:
            raise SystemExit("window_measure refused: %s does not name the image "
                             "it was measured off; pass --candidate" % doc_path)
        png = m.group(1)
    found, note = patch(doc_path, os.path.join(ROOT, png), loc, plan)
    print("%s: %d glazed opening(s), off %s" % (a.facing, len(found), png))
    print("  %s" % note["method"])
    for f in found:
        lat = f["lattice"]
        print("    x %4d..%4d (%.2f m, %d px)  y %d..%d  light %.1f against a %.1f wall, "
              "lattice %.3f (x %.3f y %.3f, pitch %s/%s m), confidence %.2f"
              % (f["x0_px"], f["x1_px"], f["width_m"], f["width_px"],
                 f["y0_px"], f["y1_px"], f["light_luminance"], f["wall_luminance"],
                 lat["score"], lat["x"], lat["y"], lat["pitch_x_m"], lat["pitch_y_m"],
                 f["confidence"]))
    for f in note["rejected"]:
        print("    x %4d..%4d  REJECTED — %s" % (f["x0_px"], f["x1_px"], f["rejected"]))
    if not found:
        print("    none — this wall shows no glazed opening in its own paint")


if __name__ == "__main__":
    main()
