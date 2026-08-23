#!/usr/bin/env python3
"""Row 27 — where the PAINTING put the way through, measured off the pixels.

    python3 design/plan-draft/measured/door_measure.py --facing library/E \
        --round manor --candidate backdrops/source/library-E/row23-780b6a83.png

WHY THIS EXISTS. Row 23's matrix proved the painter ignores position labels: a
door is painted at its reflex, near enough the wall's middle, wherever the plan
rules it. Until this file the promoted meta's `openings` came from the PLAN
projected through the meta — so on every door-bearing manor wall the painted
door and the clickable hole stood apart, and blueprint §11's law ("the painted
opening must coincide with the click target") was false on twenty-two shipped
walls at once. The Captain found it by walking the building: "library door
doesnt match up", "Multiple doors dont match up".

The standing ruling this obeys is §11's click-coincidence plus the row-22
precedent — blueprint §5 makes the approved image the geometric authority and
the plan amends to the painting. So ON A PROMOTED WALL THE PAINTED DOOR
GOVERNS, and this file is the instrument that says where it is. The WORLD does
not move: `hall -> kitchen` is still `hall -> kitchen`. Only the rectangle on
the picture moves.

WHAT IS MEASURED, AND WHY IT IS THE VOID AND NOT THE EDGES.

A painted doorway in this corpus is a hole you see through: the space beyond is
unlit relative to the wall plane, so the opening reads as a dark, near-textureless
region running from the floor line up to a lintel. That void is what the
renderer composites the destination room into (`drawThroughOpening`), and it is
what a player aims at. It is therefore the thing to measure.

The alternative — the strongest pair of vertical edges — was tried first, here
and at row 23, and it is the trap `measure.py`'s own `read_opening` warns
about: a stone-cased opening presents TWO rectangles (the near face in the wall
plane and the reveal one wall-thickness behind), the architrave presents a
third, and a generic edge detector takes whichever carries the bigger step. On
the control frame below, edge refinement moved a reading that was already
correct to 1 px out to 47 px out, onto the outer moulding. The void has no such
ambiguity: there is one of it.

THE CONTROL. `study/E` cand-6 — the standing-eye wave's own reading, taken by
hand off one-pixel luminance profiles and recorded in
`design/plan-draft/measured/cand6/study-E.json` as `opening_x0_px` 673,
`opening_x1_px` 860. This detector reads 673..861 on that frame with nothing
about it in its inputs. `tests/playwright/doors.spec.mjs` holds that as a case,
so a change here that moves the control is a red test rather than a quieter
corpus.

WHAT THIS FILE DOES NOT DECIDE. It does not know the plan, it does not know
which opening is which, and it refuses nothing on the grounds of what the
building rules — every one of those is `tools/promote-backdrop.mjs`'s, which is
where the plan lives and where the promotion is granted or held. This file
emits every candidate way-through it can see, with the geometry of each and the
evidence for it, and says nothing else. Two reasons: a detector that knows the
answer it is looking for finds it (row 23's first draft scored a 217 px miss as
a 17 px hit that way), and the guards that hold a wall have to be readable in
one place beside the promotion they hold.
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

#: Blueprint §11's ruled door opening, height half. The same constant lives in
#: `tools/plan-projection.mjs` as `DOOR_OPENING_HEIGHT_M`, which is the
#: projection side of the same sentence; this side needs it only to say which
#: BAND OF ROWS a door's body occupies, never to size anything.
DOOR_OPENING_HEIGHT_M = 2.00

#: The body of a door, as a fraction of that height above the floor line. The
#: column statistic is taken between these two so that neither the lintel and
#: its shadow (the top) nor the threshold, the floorboards running through it
#: and the near reveal's foot (the bottom) enter it. A void has to be a void
#: over the middle 70 % of a door to count as one here.
BODY_LO, BODY_HI = 0.15, 0.85

#: The narrowest run of columns this detector will ENUMERATE, in metres at the
#: wall's own scale. It is deliberately BELOW the narrowest thing the promotion
#: will accept as a doorway (half of §11's ruled 1.00 m): a reading that is too
#: narrow to be a door must arrive at the guard and be refused there by name,
#: not vanish inside the detector and arrive as silence.
MIN_ENUMERATED_M = 0.40

#: A way through is a way a PERSON walks through, so its head stands between
#: this and the room's own ruled storey height. Under 1.40 m it is a recess, a
#: dark panel or a fireplace mouth, not a doorway; over the storey it is not in
#: the room at all. Both are facts about doors rather than about this corpus.
MIN_HEAD_M = 1.40

#: How many distinct thresholds a candidate's width must survive unchanged
#: (within STABLE_TOL of its own median) to be enumerated. Three is the
#: smallest number that is a run rather than a coincidence.
MIN_STABILITY = 3
STABLE_TOL = 0.05


def _runs(mask, min_len):
    """Contiguous True runs of `mask` at least `min_len` long, as [lo, hi)."""
    out, start = [], None
    for i, on in enumerate(mask):
        if on and start is None:
            start = i
        elif not on and start is not None:
            if i - start >= min_len:
                out.append((start, i))
            start = None
    if start is not None and len(mask) - start >= min_len:
        out.append((start, len(mask)))
    return out


def _body_profile(L, floor_y, ppm):
    """v(x): the median luminance of each column over a door's body rows.

    The median rather than the mean because a single bright pixel — a hinge, a
    highlight on a floorboard seen through the hole — must not lift a column
    out of the void.
    """
    h = DOOR_OPENING_HEIGHT_M * ppm
    y0 = int(round(max(0, floor_y - BODY_HI * h)))
    y1 = int(round(min(L.shape[0] - 1, floor_y - BODY_LO * h)))
    if y1 - y0 < 8:
        return None, (y0, y1)
    return np.median(L[y0:y1, :], axis=0), (y0, y1)


def _stable_dark_runs(v, x0, x1, minw):
    """Every maximally stable dark run in v[x0:x1], with its stability.

    THE THRESHOLD IS NOT CHOSEN, IT IS SWEPT. A single darkness cut cannot be
    honest across this corpus: `library/E` reads its void at 3 and `study/E`
    reads its own at 12, because one is a black passage and the other has a lit
    floor a few metres behind it. So every cut from 1 to the wall's own median
    luminance is taken in turn — the wall's median is the ceiling because past
    it "darker than the wall" stops meaning anything — the runs at each are
    collected, and the ones that keep the SAME EDGES over many cuts are the
    features. A panel groove or a shadowed corner drifts with the cut; a hole
    in a wall does not.

    That is 1-D maximal stability (the idea behind MSER), and it is chosen for
    the property that matters here: nothing in it knows what width it is
    looking for, so a wall whose painted door is the wrong size still reads at
    the size it was painted, and the guard downstream can see that.
    """
    top = float(np.median(v[x0:x1]))
    groups = []
    for t in range(1, max(2, int(round(top)) + 1)):
        mask = np.zeros(len(v), bool)
        mask[x0:x1] = v[x0:x1] < t
        for a, b in _runs(mask, minw):
            centre = (a + b) / 2.0
            found = None
            for g in groups:
                pa, pb = g["spans"][-1]
                # the same feature grown or shrunk, not a different one: each
                # contains the other's midpoint
                if (pa < centre < pb) or (a < (pa + pb) / 2.0 < b):
                    found = g
                    break
            if found is None:
                groups.append({"spans": [(a, b)], "ts": [t]})
            else:
                found["spans"].append((a, b))
                found["ts"].append(t)
    out = []
    for g in groups:
        widths = np.array([b - a for a, b in g["spans"]], float)
        med = float(np.median(widths))
        stable = [(s, t) for s, t in zip(g["spans"], g["ts"])
                  if abs((s[1] - s[0]) - med) <= STABLE_TOL * med]
        if len(stable) < MIN_STABILITY:
            continue
        span, t_rep = stable[len(stable) // 2]
        out.append({"span": span, "t": t_rep, "stability": len(stable),
                    "t_lo": stable[0][1], "t_hi": stable[-1][1]})
    out.sort(key=lambda z: z["span"][0])
    return out, top


def _head(L, span, t, floor_y, ppm, storey_m):
    """The row the void's head sits on, refined onto the lintel's own step.

    The threshold that found the columns finds the head too — the void ends
    where the frame's soffit begins — and the answer is then moved to the
    strongest horizontal step within +/- 0.10 m of it, because a threshold
    crossing lands wherever the shadow under the lintel fades and a step lands
    on the lintel. On the control frame that refinement is worth 9 px of 448.
    """
    a, b = span
    inset = int(round(0.10 * (b - a)))
    cols = L[:, a + inset:b - inset]
    if cols.shape[1] < 3:
        return None
    r = np.median(cols, axis=1)
    body_mid = int(round(floor_y - 0.5 * DOOR_OPENING_HEIGHT_M * ppm))
    if body_mid < 1 or body_mid >= len(r) or not r[body_mid] < t:
        return None
    y = body_mid
    while y > 0 and r[y - 1] < t:
        y -= 1
    half = int(round(0.10 * ppm))
    lo, hi = max(1, y - half), min(len(r) - 2, y + half)
    if hi > lo:
        step = np.abs(r[lo + 1:hi + 1] - r[lo - 1:hi - 1])
        y = lo + int(np.argmax(step))
    head_m = (floor_y - y) / ppm
    if not (MIN_HEAD_M <= head_m <= storey_m):
        return None
    return y, head_m


def measure_openings(png_path, corner_x0, corner_x1, floor_y, ppm, storey_m):
    """Every painted way-through this frame shows, left to right.

    Returns `(candidates, note)`. A candidate is the rectangle at the WALL
    PLANE: `x0`/`x1` are the void's own stable edges, `y1` is the wall's
    measured floor line — the convention `measure.py`'s hand reading used, and
    the one the plan projects to — and `y0` is the head.

    An empty list is a fact about the frame and not an error: a wall whose
    way-through cannot be found here is a wall that is not promotable, which is
    the row-26 defect painted rather than projected, and the caller says so.
    """
    rgb = ml.load(png_path)
    L = ml.luma(rgb)
    H, W = L.shape
    v, body = _body_profile(L, floor_y, ppm)
    if v is None:
        return [], ("this frame gives a door's body fewer than 8 rows to be "
                    "measured over, so there is no column statistic to take")
    x0 = int(max(0, corner_x0 if corner_x0 is not None else 0))
    x1 = int(min(W, corner_x1 if corner_x1 is not None else W))
    if x1 - x0 < 32:
        return [], ("the measured corners leave %d px of wall band, which is "
                    "narrower than any doorway" % (x1 - x0))
    minw = int(round(MIN_ENUMERATED_M * ppm))
    runs, wall_median = _stable_dark_runs(v, x0, x1, minw)
    out = []
    for g in runs:
        a, b = g["span"]
        head = _head(L, g["span"], g["t"], floor_y, ppm, storey_m)
        if head is None:
            continue
        y, head_m = head
        out.append({
            "x0_px": int(a), "x1_px": int(b),
            "y0_px": int(y), "y1_px": int(round(floor_y)),
            "width_px": int(b - a), "width_m": round((b - a) / ppm, 3),
            "centre_px": round((a + b) / 2.0, 1),
            "head_m": round(head_m, 3),
            "void_luminance": round(float(np.median(v[a:b])), 2),
            "wall_luminance": round(wall_median, 2),
            "threshold": g["t"], "threshold_span": [g["t_lo"], g["t_hi"]],
            "stability": g["stability"],
        })
    note = {
        "method": ("the maximally stable dark run in each column's median "
                   "luminance over the middle %d%% of a ruled door's height, "
                   "with the head moved onto the lintel's own step; nothing "
                   "here is told what width to look for"
                   % round(100 * (BODY_HI - BODY_LO))),
        "body_rows": [int(body[0]), int(body[1])],
        "wall_band_px": [x0, x1],
        "wall_median_luminance": round(wall_median, 2),
        "min_enumerated_px": minw,
        "min_head_m": MIN_HEAD_M,
        "storey_m": storey_m,
        "candidates_before_head_test": len(runs),
    }
    return out, note


# ------------------------------------------------------------------- the CLI

def ruled_storey(plan, loc):
    room = next((r for r in plan.get("rooms", []) if r["id"] == loc), None)
    if room is None:
        return None
    fl = next((f for f in plan.get("floors", []) if f["id"] == room.get("floor")), None)
    return fl.get("storey_height_m") if fl else None


def patch(doc_path, png_path, loc, plan):
    """Read the doors off `png_path` and write them into the measurement doc.

    THE READING GOES IN THE MEASUREMENT, NOT IN THE PROMOTION. `promotion_doc`
    in `row23_lib.py` states the rule this obeys: every field the promotion
    tool reads is a value the measurement already took off the frame that
    passed the gate, so re-running the promotion cannot produce a number
    nobody measured. A door read at promotion time would be exactly that
    number — and `fixtures.spec`'s staleness case, which re-derives every
    promoted meta by running the tool again, would be re-deriving a
    measurement instead of a document.
    """
    doc = json.load(open(doc_path))
    mp = doc.get("_measured_px") or {}
    ppm = doc.get("px_per_m_at_wall")
    floor_y = mp.get("wall_floor_line_y_px")
    storey = ruled_storey(plan, loc)
    if ppm is None or floor_y is None or storey is None:
        raise SystemExit("door_measure refused: %s carries no scale, no floor "
                         "line or names a room the plan does not rule" % doc_path)
    found, note = measure_openings(png_path, mp.get("corner_x0_px"),
                                   mp.get("corner_x1_px"), floor_y, ppm, storey)
    mp["openings"] = found
    doc["_measured_px"] = mp
    doc["_openings_read"] = note
    with open(doc_path, "w") as fh:
        json.dump(doc, fh, indent=2)
        fh.write("\n")
    return found, note


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--facing", required=True, help="<loc>/<F>")
    ap.add_argument("--round", default="", help="the measurement round's directory")
    ap.add_argument("--candidate", default="",
                    help="the png; taken off the doc's own header when omitted")
    ap.add_argument("--plan", default=os.path.join(ROOT, "fixtures", "demo-study", "plan.json"))
    ap.add_argument("--doc", default="",
                    help="write the reading into THIS document instead of the "
                         "round's own — a caller measuring against a copy, so "
                         "that reading a control frame cannot edit the corpus "
                         "it is being checked against")
    a = ap.parse_args()
    loc, facing = a.facing.split("/")
    doc_path = a.doc or os.path.join(HERE, *( [a.round] if a.round else [] ),
                                     "%s-%s.json" % (loc, facing))
    if not os.path.exists(doc_path):
        raise SystemExit("door_measure refused: no measurement at " + doc_path)
    png = a.candidate
    if not png:
        doc = json.load(open(doc_path))
        m = re.search(r"(backdrops/\S+?\.png)", str(doc.get("_what_this_is", "")))
        if not m:
            raise SystemExit("door_measure refused: %s does not name the image "
                             "it was measured off; pass --candidate" % doc_path)
        png = m.group(1)
    plan = json.load(open(a.plan))
    found, note = patch(doc_path, os.path.join(ROOT, png), loc, plan)
    print("%s: %d painted way(s) through, off %s" % (a.facing, len(found), png))
    print("  %s" % note["method"])
    for f in found:
        print("    x %4d..%4d (%.2f m, %d px)  head %.2f m  y %d..%d  "
              "void %.1f against a %.1f wall, stable over cuts %d..%d"
              % (f["x0_px"], f["x1_px"], f["width_m"], f["width_px"], f["head_m"],
                 f["y0_px"], f["y1_px"], f["void_luminance"], f["wall_luminance"],
                 f["threshold_span"][0], f["threshold_span"][1]))
    if not found:
        print("    none — this wall's way through cannot be found in its own paint")


if __name__ == "__main__":
    main()
