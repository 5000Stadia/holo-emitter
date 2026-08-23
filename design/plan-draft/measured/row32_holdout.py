#!/usr/bin/env python3
"""Row 32's holdout: predict, blind, the corners the old instrument read.

    python3 design/plan-draft/measured/row32_holdout.py

THE VALIDATION IS A HOLDOUT AND THIS FILE IS WHY IT IS ONE. A corner detector
built to free 58 held walls has no ground truth on those walls — that is what
holding them means. It has ground truth on the walls the OLD instrument read
and on the study controls, and those are the only walls it may be graded on:
the new rule predicts each one without being told the answer, and the error is
printed per wall rather than summarised, because a median hides the wall that
went 400 px wrong.

TWO SETS, AND THEY ANSWER DIFFERENT QUESTIONS.

  the study controls   `study/N` and `study/W` at cand-2 carry corners that are
                       COMMITTED — 142/1389 and 142/1388, confirmed by the two
                       walls' own symmetry (1388-142 against 1247, the same
                       room read twice). They are the only truth in the corpus
                       that is not another detector's opinion, and they are
                       plaster-ceilinged, which is the case the old rule was
                       built for. A new rule that moves them has broken the
                       thing it was extending.
  the promoted manor   the 19 walls the production run promoted with a reading
                       on file. Their corners are the old instrument's answer,
                       not ground truth — where the two rules differ, the table
                       says so and neither is assumed right. What this set
                       actually tests is REPRODUCTION: does the horizon the new
                       corners hand the row-20 ramp come back at the same row?
                       That is the number the promotion ships, and it is the
                       column to read.
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, HERE)

import measure                                             # noqa: E402
import row23_lib                                           # noqa: E402
from measure_lib import load, luma                         # noqa: E402

MANOR = os.path.join(ROOT, "design", "batches", "row23-scaffold", "manor")

#: The committed cand-2 corners. `design/plan-draft/measured/cand3/…` and
#: `measure.py`'s own study/N notes carry the reproduction test these came from.
CONTROLS = {"study/N": (142, 1389), "study/E": (171, 1365),
            "study/W": (142, 1388), "study/S": (179, 1355)}


def _picks():
    return dict(pick_floor=measure.pick_floor,
                module_in_bands=measure.module_in_bands,
                pick_ceiling=measure.pick_ceiling,
                find_corners_recession=measure.find_corners_recession,
                ceiling_ramp_vp=measure.ceiling_ramp_vp,
                horizon_votes=measure.horizon_votes,
                light=measure.light, EYE_RANGE=measure.EYE_RANGE)


def control_row(fac):
    """A study control, through measure.py's own cand-2 config and windows."""
    cfg = measure.CFG[fac]
    L = luma(load(os.path.join(ROOT, cfg["src"])))
    ceil_y, _, _ = measure.pick_ceiling(L, cfg)
    floor_y, _, _ = measure.pick_floor(L, cfg)
    old0, old1, _ = measure.find_corners_cand2(L, ceil_y)
    new0, new1, ev = measure.find_corners_recession(
        L, ceil_y, floor_y, 0.51376953125 * measure.H)
    want0, want1 = CONTROLS[fac]
    return dict(key=fac, want=(want0, want1), old=(old0, old1),
                new=(new0, new1), r2=(ev["left_fit_r2"], ev["right_fit_r2"]))


def manor_rows():
    manifest = json.load(open(os.path.join(MANOR, "manifest.json")))
    state = json.load(open(os.path.join(MANOR, "run-state.json")))["walls"]
    ent = {e["key"]: e for e in manifest["entries"]}
    by_cand = {}
    for name in os.listdir(os.path.join(HERE, "manor")):
        if not name.endswith(".json"):
            continue
        d = json.load(open(os.path.join(HERE, "manor", name)))
        if "candidate" in d:
            by_cand[d["candidate"]] = d
    picks = _picks()
    rows = []
    for key, st in sorted(state.items()):
        if st.get("status") != "promoted" or not st.get("candidate"):
            continue
        old = by_cand.get(st["candidate"])
        if old is None or old.get("_promotion") is None:
            continue
        e = ent.get(key)
        if e is None or e.get("skipped"):
            continue
        side = {"facing": key,
                "meta_used": {"px_per_m_at_wall": e["px_per_m_at_wall"],
                              "camera_wall_m": e.get("camera_wall_m"),
                              "image_h_px": 1024,
                              "floor_line_y": e.get("floor_line_y", 0.7857),
                              "horizon_y": e.get("horizon_y", 0.51377),
                              "corner_x0_px": e.get("corner_x0_px"),
                              "corner_x1_px": e.get("corner_x1_px"),
                              "storey_height_m": e.get("storey_height_m"),
                              "wall_width_m": e.get("wall_width_m"),
                              "facing_type": e.get("type")},
                "brackets": e["brackets"], "stamped": e["stamped"], "outputs": {}}
        cfg = row23_lib.cfg_from_sidecar(side)
        ref = dict(focal_px=e["implied_focal_px"], eye_m=1.183,
                   horizon_y_px=1024 * 0.51377, band=0.08,
                   source="the wall's own manifest entry",
                   authority="the meta the page holds for this facing")
        new = row23_lib.measure_candidate(
            os.path.join(ROOT, st["candidate"]), side, cfg, ref, picks)
        rows.append(dict(key=key, old=old["_promotion"],
                         new=new.get("_promotion"), ppm=old["px_per_m_at_wall"],
                         floor_y=(new.get("_measured_px") or {}).get(
                             "wall_floor_line_y_px")))
    return rows


def main():
    print("ROW 32 HOLDOUT — the new corner rule, predicting blind\n")
    print("A. the study controls (committed corners, plaster ceilings)")
    print("   %-9s %11s %11s %11s   %s" %
          ("facing", "committed", "old rule", "row-32 rule", "err"))
    worst = 0
    for fac in sorted(CONTROLS):
        if fac not in measure.CFG:
            continue
        r = control_row(fac)
        d0 = None if r["new"][0] is None else r["new"][0] - r["want"][0]
        d1 = None if r["new"][1] is None else r["new"][1] - r["want"][1]
        for d in (d0, d1):
            if d is not None:
                worst = max(worst, abs(d))
        print("   %-9s %5s %5s %5s %5s %5s %5s   %+5s %+5s" %
              (r["key"], r["want"][0], r["want"][1], r["old"][0], r["old"][1],
               r["new"][0], r["new"][1], d0, d1))
    print("   worst control error: %d px\n" % worst)

    print("B. the promoted manor walls (old instrument's corners; the column "
          "that matters is dHORIZON)")
    print("   %-21s %11s %11s %11s | %9s %9s %8s" %
          ("facing", "old corners", "row-32", "dCORNER",
           "old horiz", "row-32", "dHORIZON"))
    ce, he = [], []
    for r in manor_rows():
        o, n = r["old"], r["new"]
        if n is None:
            print("   %-21s  no reading" % r["key"])
            continue
        d0 = None if n["corner_x0_px"] is None else n["corner_x0_px"] - o["corner_x0_px"]
        d1 = None if n["corner_x1_px"] is None else n["corner_x1_px"] - o["corner_x1_px"]
        oy = (o.get("ramp") or {}).get("y")
        ny = (n.get("ramp") or {}).get("y")
        dh = (ny - oy) if (oy is not None and ny is not None) else None
        for d in (d0, d1):
            if d is not None:
                ce.append(abs(d))
        if dh is not None:
            he.append(abs(dh))
        print("   %-21s %5s %5s %5s %5s %+5s %+5s | %9s %9s %8s" %
              (r["key"], o["corner_x0_px"], o["corner_x1_px"],
               n["corner_x0_px"], n["corner_x1_px"], d0, d1,
               "%.1f" % oy if oy is not None else "-",
               "%.1f" % ny if ny is not None else "-",
               "%+.1f" % dh if dh is not None else "-"))
    if ce:
        ce.sort()
        print("   corner  |err| median %.1f px, p90 %.1f px, max %d px (n=%d)"
              % (ce[len(ce) // 2], ce[int(0.9 * len(ce))], ce[-1], len(ce)))
    if he:
        he.sort()
        print("   horizon |err| median %.1f px, p90 %.1f px, max %.1f px (n=%d)"
              % (he[len(he) // 2], he[int(0.9 * len(he))], he[-1], len(he)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
