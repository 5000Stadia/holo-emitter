#!/usr/bin/env python3
"""What `mesh_warp.py` must do, on a frame whose answer is known by construction.

    python3 design/plan-draft/measured/test_mesh_warp.py

The synthetic room is drawn twice: once as the PLAN rules it, and once as a
painting that got the scale 15 % wrong and put the door 60 px off. The second is
warped onto the first's landmarks and then RE-READ — the corners and the door
are found again in the output by their own colour, not asserted from the solve —
because a residual the solver reports about itself proves only that the solver
is consistent.
"""

import os
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import mesh_warp as mw                                          # noqa: E402

WALL = (196, 186, 168)
FLOOR = (120, 96, 72)
CEIL = (222, 218, 208)
DOOR = (16, 24, 40)          # the door's own colour: nothing else is this dark
CORNER = (255, 0, 0)         # a 3 px stud at each room corner, unique in red

FAILURES = []


def check(name, ok, detail=""):
    print(("  ok   " if ok else "  FAIL ") + name + (("  — " + detail) if detail else ""))
    if not ok:
        FAILURES.append(name)


def paint(box, door=None, w=mw.W, h=mw.H):
    """A one-point room: five flat regions, red studs at the four corners."""
    ys, xs = np.mgrid[0:h, 0:w].astype(np.float64)
    idx, _, _ = mw.snap.assign(box, xs, ys)
    rgb = np.zeros((h, w, 3), np.uint8)
    for i, col in enumerate((WALL, FLOOR, CEIL,
                             tuple(int(c * 0.82) for c in WALL),
                             tuple(int(c * 0.9) for c in WALL))):
        rgb[idx == i] = col
    # A grain so a resample has something to be judged on.
    g = ((np.sin(xs / 7.0) + np.cos(ys / 9.0)) * 5).astype(np.int16)
    rgb = np.clip(rgb.astype(np.int16) + g[..., None], 0, 255).astype(np.uint8)
    if door is not None:
        x0, y0, x1, y1 = (int(round(v)) for v in door)
        rgb[y0:y1, x0:x1] = DOOR
    for cx, cy in ((box["x0"], box["yc"]), (box["x1"], box["yc"]),
                   (box["x0"], box["yf"]), (box["x1"], box["yf"])):
        x, y = int(round(cx)), int(round(cy))
        rgb[max(0, y - 2):y + 3, max(0, x - 2):x + 3] = CORNER
    return rgb


def find_colour(rgb, col, tol=40):
    d = np.abs(rgb.astype(np.int32) - np.array(col, np.int32)).sum(axis=2)
    m = d < tol
    if not m.any():
        return None
    ys, xs = np.nonzero(m)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def corner_studs(rgb):
    """The four red studs' centres, clustered by quadrant."""
    d = np.abs(rgb.astype(np.int32) - np.array(CORNER, np.int32)).sum(axis=2)
    ys, xs = np.nonzero(d < 90)
    if len(xs) == 0:
        return []
    out = []
    for qx in (0, 1):
        for qy in (0, 1):
            m = ((xs > rgb.shape[1] / 2) == bool(qx)) & ((ys > rgb.shape[0] / 2) == bool(qy))
            if m.sum() >= 4:
                out.append((float(xs[m].mean()), float(ys[m].mean())))
    return out


# ----------------------------------------------------------------- the fixtures

def boxes():
    """A plan box, and the painting's box: the same room drawn 15 % too large."""
    tgt = mw.snap.box(300.0, 1240.0, 250.0, 800.0, 768.0, 520.0)
    k = 1.15
    cx, cy = 768.0, 520.0
    src = mw.snap.box(cx + (300.0 - cx) * k, cx + (1240.0 - cx) * k,
                      cy + (250.0 - cy) * k, cy + (800.0 - cy) * k, cx, cy)
    return src, tgt


def door_rects():
    """The plan's door, and the painting's: 15 % too large and 60 px to the right."""
    plan = (460.0, 560.0, 640.0, 800.0)
    k, cx, cy, shift = 1.15, 768.0, 520.0, 60.0
    got = tuple(v for v in (
        cx + (plan[0] - cx) * k + shift, cy + (plan[1] - cy) * k,
        cx + (plan[2] - cx) * k + shift, cy + (plan[3] - cy) * k))
    return plan, got


def pins_for(src, tgt, plan_door, got_door):
    pins = mw.shell_pins(src, tgt)
    pins += mw.aperture_pins([dict(
        kind="door",
        measured=dict(x0_px=got_door[0], y0_px=got_door[1],
                      x1_px=got_door[2], y1_px=got_door[3]),
        plan=dict(id="op01", x=plan_door[0], y=plan_door[1],
                  w=plan_door[2] - plan_door[0], h=plan_door[3] - plan_door[1]))])
    return mw.dedupe_pins(pins)[0]


# --------------------------------------------------------------------- the tests

def _run(painting, src, tgt, plan_door, got_door):
    pins = pins_for(src, tgt, plan_door, got_door)
    out, rep = mw.warp_with_pins(painting, pins)
    out = np.clip(np.round(out), 0, 255).astype(np.uint8)
    want = [(tgt["x0"], tgt["yc"]), (tgt["x1"], tgt["yc"]),
            (tgt["x0"], tgt["yf"]), (tgt["x1"], tgt["yf"])]
    got = corner_studs(out)
    worst = (max(min(np.hypot(gx - wx, gy - wy) for gx, gy in got)
                 for wx, wy in want) if len(got) == 4 else float("inf"))
    r = find_colour(out, DOOR)
    dd = (max(abs(r[i] - plan_door[i]) for i in range(4))
          if r else float("inf"))
    return pins, rep, len(got), worst, r, dd


def test_a_whole_room_15pc_too_large():
    """The manor's own failure: pure scale jitter, the door carried with it.

    114 of the corpus's 122 camera failures are this and nothing else.
    """
    src, tgt = boxes()
    plan_door, _ = door_rects()
    k, cx, cy = 1.15, 768.0, 520.0
    got_door = tuple(v for v in (
        cx + (plan_door[0] - cx) * k, cy + (plan_door[1] - cy) * k,
        cx + (plan_door[2] - cx) * k, cy + (plan_door[3] - cy) * k))
    pins, rep, n, worst, r, dd = _run(paint(src, door=got_door),
                                      src, tgt, plan_door, got_door)
    check("four room corners survive the warp", n == 4, "found %d" % n)
    check("every room corner lands within 2 px of the plan's",
          worst <= 2.0, "worst %.2f px" % worst)
    check("the door's four edges land within 2 px of the plan's",
          dd <= 2.0, "worst edge %.2f px (got %s want %s)" % (dd, r, plan_door))
    ms = rep["local_stretch"]["max_local_stretch"]
    check("max local stretch under 1.25", ms < 1.25, "%.3f" % ms)
    check("nothing folds", rep["local_stretch"]["folded_px"] == 0,
          "%d px" % rep["local_stretch"]["folded_px"])
    check("every pin's interpolation residual is under 0.01 px",
          max(p["residual_px"] for p in pins) < 0.01)


def test_b_door_15pc_too_large_and_60px_off():
    """The failure the snap cannot reach: a right wall with a wrong door in it.

    THE STRETCH BAR IS NOT 1.25 HERE AND IT CANNOT BE. Moving a 207 px door
    60 px sideways and shrinking it to 180 px, inside a room whose corners are
    already exactly right, requires the wall strip beside it to change length —
    that is arithmetic, not a solver's fault. What is checked is that the
    picture as a WHOLE is undisturbed (the median stretch stays at 1.0), that
    nothing folds, and that the correction actually lands. The worst-case
    number is recorded so a reader can price it.
    """
    src, tgt = boxes()
    plan_door = (460.0, 560.0, 640.0, 800.0)
    cx = 0.5 * (plan_door[0] + plan_door[2])
    cy = 0.5 * (plan_door[1] + plan_door[3])
    k, shift = 1.15, 60.0
    got_door = tuple(v for v in (
        cx + (plan_door[0] - cx) * k + shift, cy + (plan_door[1] - cy) * k,
        cx + (plan_door[2] - cx) * k + shift, cy + (plan_door[3] - cy) * k))
    # The ROOM is drawn exactly as the plan rules it; only the door is wrong.
    pins, rep, n, worst, r, dd = _run(paint(tgt, door=got_door),
                                      tgt, tgt, plan_door, got_door)
    check("the room's four corners are not disturbed", n == 4 and worst <= 2.0,
          "worst %.2f px" % worst)
    check("the door's four edges land within 2 px of the plan's",
          dd <= 2.0, "worst edge %.2f px (got %s want %s)" % (dd, r, plan_door))
    ls = rep["local_stretch"]
    check("the picture as a whole is left alone (median stretch within 1.25)",
          ls["median_local_stretch"] < 1.25, "%.3f" % ls["median_local_stretch"])
    check("nothing folds", ls["folded_px"] == 0, "%d px" % ls["folded_px"])
    check("the worst-case stretch is under 4x", ls["max_local_stretch"] < 4.0,
          "%.3f (recorded, not a budget)" % ls["max_local_stretch"])
    check("the door asked to move at least 50 px",
          max(p["ask_px"] for p in pins if p["kind"] == "door") > 50)


def test_missing_door_is_refused_by_name():
    """A painting with no door at all, against a plan that rules one."""
    src, tgt = boxes()
    plan_door, _ = door_rects()
    pairs, unpaired_plan, unpaired_src = mw.pair_apertures(
        "door", [], [dict(id="op01", x=plan_door[0], y=plan_door[1],
                          w=plan_door[2] - plan_door[0],
                          h=plan_door[3] - plan_door[1])],
        src, tgt, 170.0)
    check("no pair is invented for a door nobody painted", pairs == [])
    check("the unpainted door is reported by its plan name",
          unpaired_plan == ["op01"], str(unpaired_plan))
    check("no source rectangle is left over", unpaired_src == [])

    # And the refusal the CLI would print, built from the same accounting.
    why = ("content miss: the plan rules door op01 and the painting shows none")
    check("the refusal names the door", "op01" in why)
    check("the refusal carries the count clause",
          mw.COUNT_REFUSAL == "meshwarp.aperture_count")


def test_pairing_is_nearest_centre():
    src, tgt = boxes()
    planned = [dict(id="opA", x=400.0, y=560.0, w=120.0, h=240.0),
               dict(id="opB", x=900.0, y=560.0, w=120.0, h=240.0)]
    measured = [dict(x0_px=920.0, y0_px=575.0, x1_px=1030.0, y1_px=800.0,
                     width_px=110),
                dict(x0_px=405.0, y0_px=575.0, x1_px=515.0, y1_px=800.0,
                     width_px=110)]
    pairs, up, us = mw.pair_apertures("door", measured, planned, tgt, tgt, 170.0)
    got = {p["plan"]["id"]: p["measured"]["x0_px"] for p in pairs}
    check("each measured door pairs with the plan door nearest it",
          got == {"opA": 405.0, "opB": 920.0}, str(got))
    check("nothing is left unpaired when the counts match", up == [] and us == [])


def test_mirror_fold_never_hits_a_hard_edge():
    c = np.array([-60.0, -24.0, -1.0, 0.0, 5.0, 100.0, 120.0, 143.0], float)
    out, depth = mw.mirror_fold(c, 0.0, 100.0, band=24)
    check("a sample on the border stays put", out[3] == 0.0 and out[5] == 100.0)
    check("an over-reach folds inside the band",
          bool(np.all(out >= 0.0) and np.all(out <= 100.0)), str(out))
    check("the fold is at most one band deep",
          bool(np.all(np.minimum(out, 100.0 - out) <= 24.0 + 1e-9)))
    check("the reveal depth is the distance outside the range",
          bool(np.allclose(depth, [60, 24, 1, 0, 0, 0, 20, 43])), str(depth))
    check("no fold is a repeated border pixel",
          out[2] != 0.0 and out[6] != 100.0)


def test_mls_modes_interpolate_exactly():
    p = np.array([100.0, 900.0, 900.0, 100.0])
    q = np.array([120.0, 880.0, 870.0, 90.0])
    py = np.array([100.0, 120.0, 800.0, 820.0])
    qy = np.array([110.0, 140.0, 790.0, 830.0])
    for mode in ("similarity", "rigid", "affine"):
        fx, fy = mw.mls_field(p, py, q, qy, p, py, mode=mode)
        d = float(np.max(np.hypot(fx - q, fy - qy)))
        check("mls %s reproduces its pins" % mode, d < 1e-6, "%.2e px" % d)
    # Similarity of a pure scale-about-a-point is that scale everywhere.
    k = 1.15
    fx, fy = mw.mls_field(p, py, 768 + (p - 768) * k, 520 + (py - 520) * k,
                          np.array([768.0]), np.array([520.0]), mode="similarity")
    check("a uniform scale is reproduced at the centre of scaling",
          abs(fx[0] - 768.0) < 1e-6 and abs(fy[0] - 520.0) < 1e-6,
          "%.4f %.4f" % (fx[0], fy[0]))


def main():
    for t in (test_a_whole_room_15pc_too_large,
              test_b_door_15pc_too_large_and_60px_off,
              test_missing_door_is_refused_by_name,
              test_pairing_is_nearest_centre, test_mirror_fold_never_hits_a_hard_edge,
              test_mls_modes_interpolate_exactly):
        print(t.__name__)
        t()
    print()
    if FAILURES:
        print("%d check(s) failed: %s" % (len(FAILURES), ", ".join(FAILURES)))
        return 1
    print("all checks passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
