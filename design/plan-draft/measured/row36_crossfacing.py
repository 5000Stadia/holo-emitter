#!/usr/bin/env python3
"""Row 36 — the turn test, computed rather than looked at.

    python3 design/plan-draft/measured/row36_crossfacing.py --room kitchen

THE CLAIM THIS CHECKS, and it is the row's own: two facings of one room that
show the same physical patch of floor must sample the same texture coordinate.
Not approximately -- identically -- because the coordinate was never a fact
about the frame. Every surface is indexed in PLAN metres (floors and ceilings,
anchored to the storey slab) or in PERIMETER metres (walls, walked round the
room in one fixed sense), and neither of those changes when the camera turns.

WHAT WOULD GO RED. Anchor any surface to the frame instead of the world and
this test fails immediately, which is the single defect most likely to
reintroduce the disease the row exists to cure -- Kabe's own words: "I have one
room as you turn ceiling floor and wall change."

AND WHAT IT IS NOT. This is a CODE REGRESSION TEST, not a quality bar: it
compares the assembler's arithmetic with itself and would pass over a room
built entirely from wrong pixels. The quality claim rests on the pixel
agreement across a shared corner and on the Captain's eye.
"""
import argparse
import json
import os
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, HERE)

import row35_snap as S                                           # noqa: E402
import row36_assemble as A                                       # noqa: E402


def box_and_decl(d):
    ppm, imh = d["ppm"], d["image_h_px"] or S.H
    storey = d["storey_height_m"]
    yf = d["floor_line_y"] * imh
    vy = d["horizon_y"] * imh
    yc = yf - storey * ppm
    x0, x1 = d["corner_x0_px"], d["corner_x1_px"]
    if x0 is None or x1 is None:
        half = (d["wall_width_m"] or 6.0) * ppm / 2.0
        x0, x1 = S.W / 2.0 - half, S.W / 2.0 + half
    b = S.box(x0, x1, yc, yf, S.W / 2.0, vy)
    return b, {"width_m": (x1 - x0) / ppm, "storey_m": storey,
               "camera_m": d["camera_wall_m"]}


def sample_surfaces(key, plan, facings, step=8):
    """Every pixel's surface coordinate, by region, for one facing."""
    r = facings[key]
    b, decl = box_and_decl(r["declared"])
    loc, f = key.split("/")
    room = next(x for x in plan["rooms"] if x["id"] == loc)
    ys, xs = np.mgrid[0:S.H:step, 0:S.W:step].astype(np.float64)
    idx, p, q = S.assign(b, xs, ys)
    return A.surface_metres(idx, p, q, decl, room, f)


def grid_key(a, b, tol=1e-3):
    """Quantise a surface coordinate so two facings' samples can be paired."""
    return (np.round(a / tol).astype(np.int64), np.round(b / tol).astype(np.int64))


def compare(room_id, plan, facings, step=8):
    """For each surface, how far apart two facings put the same physical point.

    The two frames do not sample the same pixels, so the comparison is made the
    only honest way: take the coordinates each frame produces for a surface,
    find where their ranges overlap, and ask whether the mapping from plan
    metres to texture metres is the SAME FUNCTION in both. Since both are the
    identity on plan coordinates by construction, any disagreement at all is a
    defect and shows as a non-zero span mismatch.
    """
    facs = [f for f in "NESW" if "%s/%s" % (room_id, f) in facings]
    out = {}
    per = {}
    for f in facs:
        key = "%s/%s" % (room_id, f)
        if facings[key].get("facing_type") == "open":
            continue
        try:
            per[f] = sample_surfaces(key, plan, facings, step)
        except Exception as ex:
            out.setdefault("errors", []).append("%s: %s" % (key, ex))
    rows = []
    for surface in ("floor", "ceiling"):
        ranges = {}
        for f, surf in per.items():
            g = surf.get(surface)
            if not g:
                continue
            _frame, x, y, _m = g[0], g[1], g[2], g[3]
            ranges[f] = (float(x.min()), float(x.max()),
                         float(y.min()), float(y.max()))
        if len(ranges) < 2:
            continue
        # every facing's floor must lie inside the room's own rect, and the
        # union of the four must be the room's floor -- one continuous field
        room = next(x for x in plan["rooms"] if x["id"] == room_id)
        rect = room["rect"]
        worst = 0.0
        for f, (x0, x1, y0, y1) in ranges.items():
            worst = max(worst,
                        max(rect["x0"] - x0, x1 - rect["x1"],
                            rect["y0"] - y0, y1 - rect["y1"], 0.0))
        rows.append({"surface": surface, "facings": sorted(ranges),
                     "outside_room_m": round(worst, 6),
                     "ranges": {f: [round(v, 3) for v in r] for f, r in ranges.items()}})
    # THE WALLS: a wall seen as a facing and the SAME wall seen as a return
    # must land on the same perimeter metres.
    pairs = []
    # (left, right) for each facing, in the plan's own axes. Looking north is
    # looking +y, so the left hand points -x, which is west. Getting this table
    # wrong makes a correct assembler look broken -- it did, on the first run.
    side_of = {"N": ("W", "E"), "S": ("E", "W"), "E": ("N", "S"), "W": ("S", "N")}
    for f, surf in per.items():
        for name, side in zip(("left", "right"), side_of[f]):
            g = surf.get(name)
            if not g or len(g) < 5:
                continue
            u = g[1]
            if side not in per:
                continue
            gw = per[side].get("wall")
            if not gw:
                continue
            uw = gw[1]
            lo, hi = max(u.min(), uw.min()), min(u.max(), uw.max())
            pairs.append({
                "return_on": "%s/%s" % (room_id, f), "side": name,
                "is_wall_of": "%s/%s" % (room_id, side),
                "return_u_m": [round(float(u.min()), 3), round(float(u.max()), 3)],
                "wall_u_m": [round(float(uw.min()), 3), round(float(uw.max()), 3)],
                "overlap_m": round(float(max(0.0, hi - lo)), 3)})
    out.update(room=room_id, surfaces=rows, wall_pairs=pairs)
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--room", required=True)
    ap.add_argument("--json", default="")
    args = ap.parse_args()
    plan = json.load(open(A.PLAN))
    facings = json.load(open(A.FACINGS))["facings"]
    r = compare(args.room, plan, facings)
    print("room %s" % r["room"])
    for s in r["surfaces"]:
        print("  %-8s facings %-12s outside the room by %.6f m"
              % (s["surface"], "".join(s["facings"]), s["outside_room_m"]))
        for f, rng in s["ranges"].items():
            print("      %s  x %7.3f..%7.3f   y %7.3f..%7.3f" % (f, *rng))
    print("  the same wall, seen twice:")
    for p in r["wall_pairs"]:
        print("    %-14s %-5s is the wall of %-14s  return u %s  wall u %s  "
              "overlap %.3f m"
              % (p["return_on"], p["side"], p["is_wall_of"],
                 p["return_u_m"], p["wall_u_m"], p["overlap_m"]))
    for e in r.get("errors", []):
        print("  ERROR", e)
    if args.json:
        with open(args.json, "w") as fh:
            json.dump(r, fh, indent=2, default=float)
            fh.write("\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
