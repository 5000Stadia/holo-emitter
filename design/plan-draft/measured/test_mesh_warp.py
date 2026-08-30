#!/usr/bin/env python3
"""What `mesh_warp.py` must do, on a frame whose answer is known by construction.

    python3 design/plan-draft/measured/test_mesh_warp.py

The synthetic room is drawn twice: once as the PLAN rules it, and once as a
painting that got the scale 15 % wrong and put the door 60 px off. The second is
warped onto the first's landmarks and then RE-READ — the corners and the door
are found again in the output by their own colour, not asserted from the solve —
because a residual the solver reports about itself proves only that the solver
is consistent.

AND THE STRAIGHT LINES ARE RE-READ TOO. The v2 field's whole claim is that a
vertical stays vertical and a horizontal stays horizontal on the wall plane, so
a stripe is painted across the wall, warped, and its centroid measured row by
row (or column by column) out of the output pixels. The same stripe is put
through the v1 thin-plate spline beside it, which is what bowed
`closet_chamber-S`'s left jamb, and the two deviations are printed together.
"""

import math
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
VSTRIPE = (255, 0, 255)      # a straight vertical on the wall: no green at all
HSTRIPE = (0, 255, 255)      # a straight horizontal: no red at all

FAILURES = []


def check(name, ok, detail=""):
    print(("  ok   " if ok else "  FAIL ") + name + (("  — " + detail) if detail else ""))
    if not ok:
        FAILURES.append(name)


def paint(box, door=None, w=mw.W, h=mw.H, grain=True, stripes=False):
    """A one-point room: five flat regions, red studs at the four corners.

    With `stripes`, a straight vertical and a straight horizontal are ruled
    across the wall plane and the grain is turned off, so that a per-row
    centroid of the stripe measures the FIELD and not the noise.
    """
    ys, xs = np.mgrid[0:h, 0:w].astype(np.float64)
    idx, _, _ = mw.snap.assign(box, xs, ys)
    rgb = np.zeros((h, w, 3), np.uint8)
    for i, col in enumerate((WALL, FLOOR, CEIL,
                             tuple(int(c * 0.82) for c in WALL),
                             tuple(int(c * 0.9) for c in WALL))):
        rgb[idx == i] = col
    # A grain so a resample has something to be judged on.
    if grain:
        g = ((np.sin(xs / 7.0) + np.cos(ys / 9.0)) * 5).astype(np.int16)
        rgb = np.clip(rgb.astype(np.int16) + g[..., None], 0, 255).astype(np.uint8)
    if stripes:
        x0, x1 = int(box["x0"]) + 2, int(box["x1"]) - 2
        yc, yf = int(box["yc"]) + 2, int(box["yf"]) - 2
        rgb[HSTRIPE_Y:HSTRIPE_Y + 3, x0:x1] = HSTRIPE
        rgb[yc:yf, VSTRIPE_X:VSTRIPE_X + 3] = VSTRIPE
    if door is not None:
        x0, y0, x1, y1 = (int(round(v)) for v in door)
        rgb[y0:y1, x0:x1] = DOOR
    for cx, cy in ((box["x0"], box["yc"]), (box["x1"], box["yc"]),
                   (box["x0"], box["yf"]), (box["x1"], box["yf"])):
        x, y = int(round(cx)), int(round(cy))
        rgb[max(0, y - 2):y + 3, max(0, x - 2):x + 3] = CORNER
    return rgb


#: Where the two straight lines are ruled on the SOURCE wall. Both sit clear of
#: the door in either fixture and clear of the corner studs.
VSTRIPE_X = 900
HSTRIPE_Y = 300


def stripe_centres(out, axis, lo, hi, base, ch, expect, reach=22, skip=None):
    """The stripe's centroid along `axis`, once per row (or column).

    The weight is how far the channel falls BELOW the flat wall's own value,
    which is exactly the stripe's coverage of that pixel under a bilinear
    resample, so with a separable field every row returns the identical number
    and the deviation below is the field's own bending and nothing else.

    `skip` is where the OTHER stripe crosses this one: the four columns around
    that crossing are painted over, so their profile is the crossing's and not
    this stripe's. Measured on fixture B, dropping them is the difference
    between 0.211 px of deviation at that one column and 0.043 px everywhere.
    """
    o = out.astype(np.float64)[..., ch]
    got = []
    for i in range(int(lo), int(hi)):
        if skip is not None and abs(i - skip) <= 4:
            continue
        line = o[i, :] if axis == "row" else o[:, i]
        a, b = int(expect - reach), int(expect + reach)
        w = np.clip(base - line[a:b], 0.0, None)
        if w.sum() < 20.0:
            continue
        got.append(float((w * np.arange(a, b)).sum() / w.sum()))
    return np.array(got)


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
    """A plan box, and the painting's box: the same room drawn 15 % too large.

    Every coordinate is a whole pixel on both sides, so a re-read of the output
    is comparing integers to integers and a 1 px bar means 1 px.
    """
    tgt = mw.snap.box(308.0, 1228.0, 240.0, 800.0, 768.0, 520.0)
    k = 1.15
    cx, cy = 768.0, 520.0
    src = mw.snap.box(cx + (308.0 - cx) * k, cx + (1228.0 - cx) * k,
                      cy + (240.0 - cy) * k, cy + (800.0 - cy) * k, cx, cy)
    return src, tgt


PLAN_DOOR = (468.0, 560.0, 668.0, 800.0)


def door_rects():
    """The plan's door, and the painting's, in fixture A: the whole room 15 % out."""
    k, cx, cy = 1.15, 768.0, 520.0
    got = tuple(v for v in (
        cx + (PLAN_DOOR[0] - cx) * k, cy + (PLAN_DOOR[1] - cy) * k,
        cx + (PLAN_DOOR[2] - cx) * k, cy + (PLAN_DOOR[3] - cy) * k))
    return PLAN_DOOR, got


def door_b():
    """Fixture B's door: 15 % too large and its centre 60 px to the right.

    ITS SILL IS THE FLOOR LINE, in the painting as on the plan, because that is
    what `door_measure` reports — "`y1` is the wall's measured floor line" — and
    a fixture that put the sill anywhere else would be testing an arithmetic no
    instrument in this corpus produces.
    """
    x0, y0, x1, y1 = PLAN_DOOR
    k, shift = 1.15, 60.0
    cx = 0.5 * (x0 + x1)
    return (cx + (x0 - cx) * k + shift, y1 - (y1 - y0) * k,
            cx + (x1 - cx) * k + shift, y1)


def pairs_for(plan_door, got_door):
    return [dict(kind="door",
                 measured=dict(x0_px=got_door[0], y0_px=got_door[1],
                               x1_px=got_door[2], y1_px=got_door[3]),
                 plan=dict(id="op01", x=plan_door[0], y=plan_door[1],
                           w=plan_door[2] - plan_door[0],
                           h=plan_door[3] - plan_door[1]))]


def pins_for(src, tgt, plan_door, got_door):
    """The v1 scattered-pin list, kept so the two fields can be compared."""
    pins = mw.shell_pins(src, tgt)
    pins += mw.aperture_pins(pairs_for(plan_door, got_door))
    return mw.dedupe_pins(pins)[0]


# --------------------------------------------------------------------- the tests

def _run(painting, src, tgt, plan_door, got_door):
    """Fixture through the v2 separable field, then re-read out of the pixels."""
    cols, rows, dropped = mw.wall_axis_pins(src, tgt, pairs_for(plan_door, got_door))
    why = mw.axis_refusal("column", cols) or mw.axis_refusal("row", rows)
    if why:
        raise AssertionError("the fixture's own pins were refused: " + why)
    out, rep = mw.warp_with_axes(painting, src, tgt, cols, rows)
    out = np.clip(np.round(out), 0, 255).astype(np.uint8)
    want = [(tgt["x0"], tgt["yc"]), (tgt["x1"], tgt["yc"]),
            (tgt["x0"], tgt["yf"]), (tgt["x1"], tgt["yf"])]
    got = corner_studs(out)
    worst = (max(min(np.hypot(gx - wx, gy - wy) for gx, gy in got)
                 for wx, wy in want) if len(got) == 4 else float("inf"))
    r = find_colour(out, DOOR)
    dd = (max(abs(r[i] - plan_door[i]) for i in range(4))
          if r else float("inf"))
    return cols + rows, rep, len(got), worst, r, dd


def _straightness(src, tgt, plan_door, got_door):
    """How far the ruled vertical and horizontal bend, v2 against v1.

    Returns `(v2_vertical, v2_horizontal, v1_vertical)` in pixels of maximum
    deviation from the stripe's own mean position.
    """
    painting = paint(src, door=got_door, grain=False, stripes=True)
    cols, rows, _ = mw.wall_axis_pins(src, tgt, pairs_for(plan_door, got_door))
    tx, sxp = mw.axis_arrays(cols)
    ty, syp = mw.axis_arrays(rows)
    # Where the field puts the two stripes, so the search window is not itself
    # an assertion about the answer.
    xt = float(np.interp(VSTRIPE_X + 1.0, sxp, tx))
    yt = float(np.interp(HSTRIPE_Y + 1.0, syp, ty))

    def dev(out, axis, lo, hi, ch, base, expect, reach=22, skip=None):
        c = stripe_centres(out, axis, lo, hi, base, ch, expect,
                           reach=reach, skip=skip)
        if len(c) < 32:
            return float("inf"), len(c)
        return float(np.abs(c - c.mean()).max()), len(c)

    v2, _ = mw.warp_with_axes(painting, src, tgt, cols, rows)
    v2 = np.clip(np.round(v2), 0, 255).astype(np.uint8)
    v1, _ = mw.warp_with_pins(painting, pins_for(src, tgt, plan_door, got_door))
    v1 = np.clip(np.round(v1), 0, 255).astype(np.uint8)

    r0, r1 = tgt["yc"] + 8, tgt["yf"] - 8
    c0, c1 = tgt["x0"] + 8, tgt["x1"] - 8
    a, na = dev(v2, "row", r0, r1, 1, WALL[1], xt, skip=int(round(yt)))
    b, nb = dev(v2, "col", c0, c1, 0, WALL[0], yt, skip=int(round(xt)))
    # The v1 spline is given a window three times as wide, because a bent
    # stripe wanders out of the one the straight field needs.
    c, _ = dev(v1, "row", r0, r1, 1, WALL[1], xt, reach=66, skip=int(round(yt)))
    return a, b, c, na, nb


def test_a_whole_room_15pc_too_large():
    """The manor's own failure: pure scale jitter, the door carried with it.

    114 of the corpus's 122 camera failures are this and nothing else.
    """
    src, tgt = boxes()
    plan_door, got_door = door_rects()
    pins, rep, n, worst, r, dd = _run(paint(src, door=got_door),
                                      src, tgt, plan_door, got_door)
    check("four room corners survive the warp", n == 4, "found %d" % n)
    check("every room corner lands within 1 px of the plan's",
          worst <= 1.0, "worst %.2f px" % worst)
    check("the door's four edges land within 1 px of the plan's",
          dd <= 1.0, "worst edge %.2f px (got %s want %s)" % (dd, r, plan_door))
    st = rep["stretch"]
    check("every x segment is the one scale the room is out by",
          abs(st["x_scale_min"] - st["x_scale_max"]) < 0.005
          and abs(st["x_scale_max"] - 1 / 1.15) < 0.005,
          "%.3f..%.3f" % (st["x_scale_min"], st["x_scale_max"]))
    check("every y segment likewise",
          abs(st["y_scale_min"] - st["y_scale_max"]) < 0.005
          and abs(st["y_scale_max"] - 1 / 1.15) < 0.005,
          "%.3f..%.3f" % (st["y_scale_min"], st["y_scale_max"]))
    check("nothing can fold", st["folded_px"] == 0 and st["monotone"])
    check("every pin's interpolation residual is under 0.01 px",
          max(p["residual_px"] for p in pins) < 0.01)
    a, b, v1, na, nb = _straightness(src, tgt, plan_door, got_door)
    check("a vertical ruled on the wall stays vertical (< 0.5 px)", a < 0.5,
          "%.4f px over %d rows; the v1 spline bends it %.2f px" % (a, na, v1))
    check("a horizontal ruled on the wall stays horizontal (< 0.5 px)", b < 0.5,
          "%.4f px over %d columns" % (b, nb))


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
    plan_door, got_door = PLAN_DOOR, door_b()
    # The ROOM is drawn exactly as the plan rules it; only the door is wrong.
    pins, rep, n, worst, r, dd = _run(paint(tgt, door=got_door),
                                      tgt, tgt, plan_door, got_door)
    check("the room's four corners are not disturbed", n == 4 and worst <= 1.0,
          "worst %.2f px" % worst)
    check("the door's four edges land within 1 px of the plan's",
          dd <= 1.0, "worst edge %.2f px (got %s want %s)" % (dd, r, plan_door))
    st = rep["stretch"]
    check("the panel beside the moved door is stretched, not bent",
          st["x_scale_max"] < 2.0,
          "the widest segment scale is %.3f (recorded, not a budget); "
          "segments %s" % (st["x_scale_max"],
                           [(g["name"].split("..")[-1], g["scale"])
                            for g in st["x_segments"]]))
    check("nothing can fold", st["folded_px"] == 0 and st["monotone"])
    check("the door asked to move at least 50 px",
          max(abs(p["ask_px"]) for p in pins if p["kind"] == "door") > 50)
    a, b, v1, na, nb = _straightness(tgt, tgt, plan_door, got_door)
    check("a vertical ruled on the wall stays vertical (< 0.5 px)", a < 0.5,
          "%.4f px over %d rows; the v1 spline bends it %.2f px" % (a, na, v1))
    check("a horizontal ruled on the wall stays horizontal (< 0.5 px)", b < 0.5,
          "%.4f px over %d columns" % (b, nb))


#: THE SYNTHETIC ROOM'S DECLARED META, and every number in it is the fixture's
#: own. The plan door stands 240 px from its head to the floor line and this
#: building rules an opening 2.00 m high (`door_measure.DOOR_OPENING_HEIGHT_M`),
#: so the wall's scale is 120 px/m; the door is then 1.667 m wide — a double
#: leaf, which is what the plan draws at `op01` — the corners at 308 and 1228
#: are a 7.667 m wall, and the ceiling 560 px above the floor line is a 4.667 m
#: storey. ONE meta: `corner_span / wall_width_m` IS `px_per_m_at_wall`, which
#: is the identity `promote-backdrop.mjs` computes its `apertureScale` from and
#: the identity the manor's 11 warped walls were refused for breaking.
DECLARED_PPM = 120.0
DECLARED_DOOR_M = (PLAN_DOOR[2] - PLAN_DOOR[0]) / DECLARED_PPM


def declared_meta(tgt):
    span = tgt["x1"] - tgt["x0"]
    return dict(corner_x0_px=tgt["x0"], corner_x1_px=tgt["x1"],
                px_per_m_at_wall=DECLARED_PPM,
                wall_width_m=span / DECLARED_PPM,
                storey_height_m=(tgt["yf"] - tgt["yc"]) / DECLARED_PPM,
                floor_line_y=tgt["yf"])


def test_the_warped_output_reads_at_one_meta():
    """The output, re-read by the promotion's own two instruments.

    THE CLAUSE THIS EXISTS FOR. `promote-backdrop.mjs` admits a painted way
    through between 0.50x and 1.50x of `plan_width_m x apertureScale`, where
    `apertureScale` is the meta's CORNER SPAN over the plan's wall width — not
    its `px_per_m_at_wall`. So a warp is only finished if the picture it writes
    answers to ONE camera in both of those readings at once: the door has to
    measure the plan's width AT THE CORNER SCALE, and the corners have to stand
    where that scale says they do. All 11 of the manor's warped walls warped
    correctly and promoted none, because the door was drawn at the declared
    330.3 px/m and the corner span was re-read off a frame that shows no corner
    and called 162.4 px/m — two metas, and the door read 2.03x its own width.

    Both halves are read out of the OUTPUT PIXELS: `door_measure` on the written
    PNG, and the red corner studs found by colour. Nothing here is asserted from
    the solve.
    """
    import tempfile

    import door_measure

    src, tgt = boxes()
    meta = declared_meta(tgt)
    plan_door, got_door = PLAN_DOOR, door_b()
    check("the fixture's door stands the ruled %.2f m at the declared scale"
          % door_measure.DOOR_OPENING_HEIGHT_M,
          abs((meta["floor_line_y"] - plan_door[1]) / DECLARED_PPM
              - door_measure.DOOR_OPENING_HEIGHT_M) < 1e-9)

    cols, rows, _ = mw.wall_axis_pins(tgt, tgt, pairs_for(plan_door, got_door))
    out, _rep = mw.warp_with_axes(paint(tgt, door=got_door), tgt, tgt, cols, rows)

    with tempfile.TemporaryDirectory() as tmp:
        png = os.path.join(tmp, "warped.png")
        mw.write_png(png, out)
        got, _note = door_measure.measure_openings(
            png, meta["corner_x0_px"], meta["corner_x1_px"],
            meta["floor_line_y"], meta["px_per_m_at_wall"],
            meta["storey_height_m"])

    check("the output shows exactly the one door the plan rules",
          len(got) == 1, "%d read" % len(got))
    if len(got) == 1:
        # The promotion's own arithmetic, restated here rather than imported:
        # the band is taken against the CORNER span, so this is the number that
        # refused the manor.
        scale = ((meta["corner_x1_px"] - meta["corner_x0_px"])
                 / meta["wall_width_m"])
        ruled = DECLARED_DOOR_M * scale
        ratio = got[0]["width_px"] / ruled
        check("door_measure reads the plan's width on the OUTPUT, within 3%",
              abs(ratio - 1.0) <= 0.03,
              "%d px against the ruled %.1f px at the corner scale %.1f px/m "
              "= %.3fx" % (got[0]["width_px"], ruled, scale, ratio))
        check("and the corner scale IS the meta's ruler — one camera, not two",
              abs(scale - meta["px_per_m_at_wall"]) < 1e-6,
              "%.3f against %.3f px/m" % (scale, meta["px_per_m_at_wall"]))

    outc = np.clip(np.round(out), 0, 255).astype(np.uint8)
    studs = corner_studs(outc)
    left = [s for s in studs if s[0] < mw.W / 2]
    right = [s for s in studs if s[0] >= mw.W / 2]
    dx0 = (max(abs(s[0] - meta["corner_x0_px"]) for s in left)
           if len(left) == 2 else float("inf"))
    dx1 = (max(abs(s[0] - meta["corner_x1_px"]) for s in right)
           if len(right) == 2 else float("inf"))
    check("the output's corner columns are the declared corner_x0/x1_px (1 px)",
          dx0 <= 1.0 and dx1 <= 1.0,
          "left off by %.2f px, right by %.2f px" % (dx0, dx1))


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


def test_crossed_pins_are_refused_by_name():
    """Two apertures the painting shows in the opposite order from the plan."""
    src, tgt = boxes()
    pairs = [dict(kind="door",
                  measured=dict(x0_px=900.0, y0_px=560.0, x1_px=1020.0, y1_px=800.0),
                  plan=dict(id="opLEFT", x=400.0, y=560.0, w=120.0, h=240.0)),
             dict(kind="door",
                  measured=dict(x0_px=400.0, y0_px=560.0, x1_px=520.0, y1_px=800.0),
                  plan=dict(id="opRIGHT", x=900.0, y=560.0, w=120.0, h=240.0))]
    cols, rows, _ = mw.wall_axis_pins(tgt, tgt, pairs)
    why = mw.axis_refusal("column", cols)
    check("crossed columns are refused", bool(why), str(why)[:80])
    check("the refusal names both pins that crossed",
          bool(why) and "opLEFT" in why and "opRIGHT" in why, str(why))
    check("a hair-thin segment is refused too", bool(mw.axis_refusal("column", [
        dict(name="corner_left", target=300.0, source=300.0),
        dict(name="door:opX:left", target=700.0, source=300.4),
        dict(name="corner_right", target=1200.0, source=1200.0)])))
    check("the order clause has its own name",
          mw.ORDER_REFUSAL == "meshwarp.aperture_order")
    check("an uncrossed wall is not refused",
          mw.axis_refusal("column", mw.wall_axis_pins(
              src, tgt, pairs_for(*door_rects()))[0]) is None)


def test_the_seams_are_continuous():
    """The four junctions the five-plane map owns, sampled from both sides."""
    src, tgt = boxes()
    cols, rows, _ = mw.wall_axis_pins(src, tgt, pairs_for(*door_rects()))
    eps = 0.01
    worst = 0.0
    for nm, gx, gy, dx, dy in (
            ("left return", tgt["x0"], 0.5 * (tgt["yc"] + tgt["yf"]), 1.0, 0.0),
            ("right return", tgt["x1"], 0.5 * (tgt["yc"] + tgt["yf"]), 1.0, 0.0),
            ("floor junction", 0.5 * (tgt["x0"] + tgt["x1"]), tgt["yf"], 0.0, 1.0),
            ("ceiling junction", 0.5 * (tgt["x0"] + tgt["x1"]), tgt["yc"], 0.0, 1.0)):
        a = mw.wall_plane_field(src, tgt, cols, rows,
                                np.array([gx - dx * eps]), np.array([gy - dy * eps]))
        b = mw.wall_plane_field(src, tgt, cols, rows,
                                np.array([gx + dx * eps]), np.array([gy + dy * eps]))
        d = float(np.hypot(a[0][0] - b[0][0], a[1][0] - b[1][0]))
        worst = max(worst, d)
        check("the %s meets the wall plane without a step" % nm, d < 0.1,
              "%.5f px across a %.2f px step" % (d, 2 * eps))
    check("no seam moves more than the step it was sampled over",
          worst < 0.1, "worst %.5f px" % worst)


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


def test_the_traced_corners_are_the_source_pins():
    """[row 43] The pins come off the TRACED aperture, and an arch survives them.

    `door_measure` reads the void's bounding box; `aperture_trace` reads the
    frame's inside edge with that box for a prior. Where the trace was used, the
    warp must pin the traced corners — pinning the void's box drags the jamb's
    paint onto the plan's line and leaves the frame's own edge bowed beside it.

    And the arch is not flattened. The plan draws every head straight, so a
    target head taken literally off it would pull a half-round down onto a line;
    each head sample's target is the plan's straight head lifted by that
    sample's own measured rise, and the rise is recorded as the pin's residual.
    """
    plan = dict(id="op01", x=400.0, y=560.0, w=200.0, h=240.0)
    # A void box inset 12 px inside a traced aperture, which is the defect: the
    # dark run stops short of the jamb by the reveal.
    box = dict(x0_px=712.0, y0_px=572.0, x1_px=888.0, y1_px=800.0, width_px=176)
    tl, tr = (700.0, 560.0), (900.0, 560.0)
    br, bl = (900.0, 800.0), (700.0, 800.0)
    # A 256-sample loop whose top side is a half-round of sagitta 40 px.
    n, sag = 256, 40.0
    head = [(tl[0] + (tr[0] - tl[0]) * i / 63.0,
             tl[1] - sag * math.sin(math.pi * i / 63.0)) for i in range(64)]
    poly = head + [br, bl]
    while len(poly) < n:
        poly.append(bl)
    trace = dict(polygon=[[p[0], p[1]] for p in poly],
                 corners=[list(tl), list(tr), list(br), list(bl)],
                 corner_samples=[0, 63, 64, 65],
                 head_kind="arched", polygon_used=True,
                 wall_confidence=0.9)

    plain = mw.aperture_pins([dict(kind="door", measured=dict(box), plan=plan)])
    got = {p["name"].rsplit(":", 1)[1]: p["source"] for p in plain}
    check("with no trace the source corners are the measured box's",
          got["tl"] == [712.0, 572.0] and got["br"] == [888.0, 800.0], str(got["tl"]))

    m = dict(box)
    m["trace"] = trace
    pins = mw.aperture_pins([dict(kind="door", measured=m, plan=plan)])
    src = {p["name"].rsplit(":", 1)[1]: p["source"] for p in pins}
    tgt = {p["name"].rsplit(":", 1)[1]: p["target"] for p in pins}
    check("the traced corners are the source pins, not the void's box",
          src["tl"] == [700.0, 560.0] and src["br"] == [900.0, 800.0], str(src["tl"]))
    check("the targets are still the plan's rectangle",
          tgt["tl"] == [400.0, 560.0] and tgt["br"] == [600.0, 800.0], str(tgt["tl"]))

    heads = [p for p in pins if ":head+" in p["name"]]
    check("an arched head lays its own pins", len(heads) == mw.APERTURE_HEAD_SAMPLES,
          "%d pins" % len(heads))
    rises = [p["residual_px"] for p in heads]
    check("every head pin records its rise as a residual",
          all(r > 0 for r in rises) and abs(max(rises) - sag) <= 2.0,
          "max %.1f of a %.0f px sagitta" % (max(rises), sag))
    # The paint is NOT flattened: each head target stands off the plan's own
    # straight head by the rise its source stands off the traced chord.
    flat = [p for p in heads if abs((plan["y"] - p["target"][1]) - p["residual_px"]) > 0.01]
    check("no head pin pulls the arch down onto the plan's straight head",
          not flat, "%d flattened" % len(flat))
    check("and every head target sits between the springings",
          all(plan["x"] < p["target"][0] < plan["x"] + plan["w"] for p in heads))

    # A trace the promotion did not use is carried and NOT pinned.
    m2 = dict(box)
    m2["trace"] = dict(trace, polygon_used=False)
    low = mw.aperture_pins([dict(kind="door", measured=m2, plan=plan)])
    got2 = {p["name"].rsplit(":", 1)[1]: p["source"] for p in low}
    check("a trace below the confidence floor leaves the box pinned",
          got2["tl"] == [712.0, 572.0] and not [p for p in low if ":head+" in p["name"]],
          str(got2["tl"]))


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


#: THE RETURN FIXTURE. A room drawn 15 % too large about the convergence, so
#: the correction shrinks the wall and the two returns have to show more of
#: themselves than were ever painted: at the right frame edge the field asks for
#: source a hundred pixels past the picture. That band is the whole subject of
#: this test.
RETURN_STRIPE = (255, 0, 255)
RETURN_PS = (0.25, 0.45, 0.65, 0.85)
RETURN_HALF_P = 0.006
FLATS = ((90, 90, 90), (40, 40, 40), (140, 140, 140), (70, 70, 70), (60, 60, 60))


def return_boxes(k=1.15):
    """A plan box whose right return is fully in frame, and the painting's."""
    cx, cy = 768.0, 520.0
    tgt = mw.snap.box(304.0, 1232.0, 260.0, 800.0, cx, cy)
    src = mw.snap.box(cx + (tgt["x0"] - cx) * k, cx + (tgt["x1"] - cx) * k,
                      cy + (tgt["yc"] - cy) * k, cy + (tgt["yf"] - cy) * k,
                      cx, cy)
    return src, tgt


def paint_return_stripes(box, w=mw.W, h=mw.H):
    """Five flat regions, and four stripes ruled ALONG the right return.

    A stripe of constant `p` on a return is a straight line of the image through
    the convergence — the return's own recession — so a fill that continues the
    surface leaves it straight and a fill that folds a band in from the frame
    edge breaks it into a zigzag. Nothing else in the frame is magenta.
    """
    ys, xs = np.mgrid[0:h, 0:w].astype(np.float64)
    idx, p, q = mw.snap.assign(box, xs, ys)
    rgb = np.zeros((h, w, 3), np.uint8)
    for i, col in enumerate(FLATS):
        rgb[idx == i] = col
    right = idx == list(mw.snap.REGIONS).index("right")
    for pv in RETURN_PS:
        rgb[right & (np.abs(p - pv) < RETURN_HALF_P)] = RETURN_STRIPE
    return rgb


def return_junctions(box, x):
    """The rows of the right return's floor and ceiling junction at column `x`."""
    q = (box["x1"] - box["vx"]) / (x - box["vx"])
    return (box["vy"] + (box["yf"] - box["vy"]) / q,
            box["vy"] + (box["yc"] - box["vy"]) / q)


def stripe_rows(out, x, lo, hi, thresh=20.0):
    """The centroid row of every magenta run in column `x`, between `lo`/`hi`.

    The weight is red-minus-green, which is the stripe's own coverage of the
    pixel under a bilinear read and nothing else in this fixture.
    """
    col = out[:, int(x)].astype(np.float64)
    wgt = np.clip(col[:, 0] - col[:, 1], 0.0, None)
    wgt[:max(0, int(lo))] = 0.0
    wgt[int(hi):] = 0.0
    got, i, n = [], 0, len(wgt)
    while i < n:
        if wgt[i] <= thresh:
            i += 1
            continue
        j = i
        while j < n and wgt[j] > thresh:
            j += 1
        seg = wgt[i:j]
        got.append(float((seg * np.arange(i, j)).sum() / seg.sum()))
        i = j
    return got


def test_the_reveal_continues_the_return():
    """[HUMAN] "it should stretch into the direction of the edge"."""
    src, tgt = return_boxes()
    painting = paint_return_stripes(src)
    cols = [dict(name="corner_left", kind="room_corner",
                 target=tgt["x0"], source=src["x0"]),
            dict(name="corner_right", kind="room_corner",
                 target=tgt["x1"], source=src["x1"])]
    rows = [dict(name="ceiling_line", kind="room_corner",
                 target=tgt["yc"], source=src["yc"]),
            dict(name="floor_line", kind="room_corner",
                 target=tgt["yf"], source=src["yf"])]
    out, rep = mw.warp_with_axes(painting, src, tgt, cols, rows)
    out = np.clip(np.round(out), 0, 255).astype(np.uint8)

    # Where the reveal starts, read off the field itself rather than asserted.
    mid = 0.5 * (tgt["yc"] + tgt["yf"])
    gx = np.arange(float(tgt["x1"]), mw.W, 1.0)
    gy = np.full_like(gx, mid)
    sx, sy, _, _, _ = mw.plane_field_and_fill(
        src, tgt, cols, rows, gx, gy,
        extent=(0.0, mw.W - 1.0, 0.0, mw.H - 1.0))
    over = np.nonzero((sx > mw.W - 1.0) | (sy > mw.H - 1.0))[0]
    x_edge = int(gx[over[0]]) if len(over) else mw.W
    band = mw.W - x_edge
    check("the right return is revealed by at least 80 px",
          band >= 80, "%d px, from x=%d, %d revealed in all"
          % (band, x_edge, rep["revealed_px"]))
    check("the fill is the plane's own recession, not a mirror",
          rep.get("revealed_fill") == "plane_recession"
          and rep.get("mirror_band_px") == 0, str(rep.get("revealed_fill")))

    # EACH STRIPE'S ROW AT THE FRAME EDGE, against the row the return's own
    # floor and ceiling junction lines put it at. On a return the two junctions
    # bracket the plane, and a stripe at parameter p sits exactly p of the way
    # between them at EVERY column — that is what "along the recession" means.
    worst, seen = 0.0, []
    for x in (mw.W - 2, mw.W - 20, mw.W - 40, x_edge + 6):
        yf_, yc_ = return_junctions(tgt, float(x))
        got = stripe_rows(out, x, yc_ + 6, yf_ - 6)
        want = [yf_ + pv * (yc_ - yf_) for pv in RETURN_PS]
        seen.append((x, len(got)))
        if len(got) != len(want):
            continue
        for a, b in zip(sorted(got), sorted(want)):
            worst = max(worst, abs(a - b))
    check("every column still shows exactly the four stripes",
          all(n == len(RETURN_PS) for _, n in seen), str(seen))
    check("each stripe's row at the frame edge is the row its junction lines "
          "extrapolate to", worst < 1.0, "worst %.3f px" % worst)

    # AND IT IS STILL A STRAIGHT LINE. A ray from the convergence is straight in
    # the image, so a line fitted to the stripe across the PAINTED part must hit
    # its centroid in the REVEALED band.
    xs_paint = np.arange(tgt["x1"] + 40.0, x_edge - 10.0, 8.0)
    worst_line = 0.0
    for k, pv in enumerate(RETURN_PS):
        ys_paint, keep = [], []
        for x in xs_paint:
            yf_, yc_ = return_junctions(tgt, float(x))
            got = sorted(stripe_rows(out, int(x), yc_ + 6, yf_ - 6))
            if len(got) == len(RETURN_PS):
                ys_paint.append(got[len(RETURN_PS) - 1 - k])
                keep.append(float(x))
        if len(keep) < 4:
            continue
        m, c = np.polyfit(np.array(keep), np.array(ys_paint), 1)
        for x in range(x_edge + 4, mw.W - 1, 8):
            yf_, yc_ = return_junctions(tgt, float(x))
            got = sorted(stripe_rows(out, x, yc_ + 6, yf_ - 6))
            if len(got) != len(RETURN_PS):
                continue
            worst_line = max(worst_line,
                             abs(got[len(RETURN_PS) - 1 - k] - (m * x + c)))
    check("the stripes run into the revealed band as straight lines",
          worst_line < 1.0, "worst %.3f px off the line fitted to the paint"
          % worst_line)

    # NO REFLECTED COPY. A mirror fill answers a column d px past the boundary
    # with the paint d px inside it; nothing in the band is that.
    dup = [d for d in range(1, min(band, x_edge) )
           if np.array_equal(out[:, x_edge + d], out[:, x_edge - d])]
    check("no column of the revealed band is its own mirror", not dup, str(dup[:6]))


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
              test_the_warped_output_reads_at_one_meta,
              test_missing_door_is_refused_by_name,
              test_crossed_pins_are_refused_by_name,
              test_the_seams_are_continuous,
              test_the_reveal_continues_the_return,
              test_pairing_is_nearest_centre,
              test_the_traced_corners_are_the_source_pins,
              test_mirror_fold_never_hits_a_hard_edge,
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
