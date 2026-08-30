#!/usr/bin/env python3
"""Row 43 — the aperture tracer, held against apertures whose truth is known.

    python3 design/plan-draft/measured/test_aperture_trace.py

Every frame here is SYNTHESISED, so the answer is arithmetic rather than
opinion: a lit wall, a frame with a reveal, and a void behind it, drawn at
coordinates this file chooses. That is the only way to say "within 2 px" about a
corner — on a painted wall there is no number to be within 2 px of, which is why
the store sweep reports deviation from the PRIOR and this file reports deviation
from the TRUTH.

The four cases are the four things the ruling asks of the tracer: it reproduces
a rectangle, it follows an arch, it recovers from a prior that is wrong, and it
gives the same answer twice inside a second.
"""
import os
import sys
import time

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import aperture_trace as at  # noqa: E402

W, H = 1536, 1024
WALL, JAMB, VOID = 150.0, 96.0, 8.0

_fails = []


def check(name, cond, detail=""):
    print(("  ok   " if cond else "  FAIL ") + name + (("  " + detail) if detail else ""))
    if not cond:
        _fails.append(name)


def _noise(shape, seed):
    return np.random.default_rng(seed).normal(0.0, 2.0, shape)


def straight_door(x0, y0, x1, y1, reveal=28, seed=1):
    """A lit wall, a `reveal`-wide lit jamb/head band, and a dark void inside.

    The band OUTSIDE the aperture is the reveal — brighter than the wall, as a
    reveal catching the key light is — so that the frame's outer arris carries a
    step as big as the aperture's own. A tracer that takes "the strongest edge"
    lands on the outer arris; only one that also asks what is INSIDE the step
    lands on the aperture.
    """
    L = np.full((H, W), WALL) + _noise((H, W), seed)
    L[max(0, y0 - reveal):y1 + reveal, max(0, x0 - reveal):x1 + reveal] = JAMB
    L[y0:y1, x0:x1] = VOID
    return L + _noise((H, W), seed + 1)


def arched_door(x0, y0_spring, x1, y1, reveal=24, seed=3):
    """The same, with a half-round head springing at `y0_spring`.

    The void is the rectangle below the springing plus the half-disc above it;
    the reveal is the same shape grown by `reveal`, so the arc has a lit band
    over it exactly as the jambs do.
    """
    r = (x1 - x0) / 2.0
    cx, cy = (x0 + x1) / 2.0, float(y0_spring)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float64)
    d = np.hypot(xx - cx, yy - cy)

    def shape(g):
        box = ((xx >= x0 - g) & (xx <= x1 + g) & (yy >= cy) & (yy <= y1 + g))
        cap = (d <= r + g) & (yy < cy)
        return box | cap

    L = np.full((H, W), WALL) + _noise((H, W), seed)
    L[shape(reveal)] = JAMB
    L[shape(0.0)] = VOID
    return L + _noise((H, W), seed + 1), (cx, cy, r)


def case_a_rectangle():
    print("(a) a rectangular void with a lit frame -> four corners, head straight")
    x0, y0, x1, y1 = 600, 300, 820, 760
    L = straight_door(x0, y0, x1, y1)
    r = at.trace_aperture(L, (x0, y0, x1, y1), band=60)
    truth = [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]
    devs = [float(np.hypot(c[0] - t[0], c[1] - t[1]))
            for c, t in zip(r["corners"], truth)]
    check("four corners within 2 px of the truth", max(devs) <= 2.0,
          "max %.2f px  (%s)" % (max(devs), ", ".join("%.2f" % d for d in devs)))
    check("the head reads straight", r["head_kind"] == "straight",
          "sagitta %.1f px" % r["head_sagitta_px"])
    check("every sample is confident", min(r["confidence"]) > 0.3,
          "min %.2f mean %.2f" % (min(r["confidence"]), r["mean_confidence"]))
    # the loop, not just its corners
    poly = np.array(r["polygon"])
    inside = ((poly[:, 0] >= x0 - 2) & (poly[:, 0] <= x1 + 2) &
              (poly[:, 1] >= y0 - 2) & (poly[:, 1] <= y1 + 2))
    check("no sample wanders off the aperture", bool(inside.all()))


def case_b_arch():
    print("(b) a half-round head -> the loop follows the arc, head reads arched")
    x0, x1, y1 = 640, 780, 760
    spring = 420
    L, (cx, cy, rad) = arched_door(x0, spring, x1, y1)
    # the prior a void detector would hand over: the void's own bounding box,
    # whose top is the crown of the arch.
    prior = (x0, int(round(cy - rad)), x1, y1)
    r = at.trace_aperture(L, prior, band=int(rad) + 20)
    poly = np.array(r["polygon"])
    head = poly[np.array(r["side"]) == 0]
    # every head sample must sit on the arc. THE LAST SAMPLE EITHER SIDE IS
    # EXCUSED, and the reason is geometry rather than tolerance: at the
    # springing the arc runs PARALLEL to the search ray, so the ray crosses it
    # at a grazing angle and the offset that best explains the pixels is not
    # well determined. The springing itself is recovered from the jamb's
    # departure instead, which is what the corner test below checks.
    err = np.abs(np.hypot(head[:, 0] - cx, head[:, 1] - cy) - rad)
    on_arc = head[:, 1] <= cy + 1.0
    well = on_arc & (np.abs(head[:, 0] - cx) <= 0.95 * rad)
    check("the head samples sit on the arc within 3 px",
          float(np.max(err[well])) <= 3.0,
          "max %.2f px over %d samples" % (float(np.max(err[well])), int(well.sum())))
    check("even the grazing samples at the springing stay within 5 px",
          float(np.max(err[on_arc])) <= 5.0,
          "max %.2f px over all %d" % (float(np.max(err[on_arc])), int(on_arc.sum())))
    check("head_kind is arched", r["head_kind"] == "arched",
          "sagitta %.1f px, %.3f of width" % (r["head_sagitta_px"],
                                              r["head_sagitta_ratio"]))
    jamb = poly[(np.array(r["side"]) == 1) & (poly[:, 1] > cy + 20)]
    check("the jambs stay on the reveal",
          float(np.max(np.abs(jamb[:, 0] - x1))) <= 2.0,
          "max %.2f px" % float(np.max(np.abs(jamb[:, 0] - x1))))
    tl, tr, br, bl = [np.array(c) for c in r["corners"]]
    check("the upper corners are the springings, not the crown",
          max(abs(tl[0] - x0), abs(tr[0] - x1)) <= 3.0
          and max(abs(tl[1] - cy), abs(tr[1] - cy)) <= 6.0,
          "TL %.1f,%.1f TR %.1f,%.1f against springing y=%.0f"
          % (tl[0], tl[1], tr[0], tr[1], cy))
    check("the lower corners are the threshold's",
          max(abs(bl[0] - x0), abs(br[0] - x1),
              abs(bl[1] - y1), abs(br[1] - y1)) <= 2.0,
          "BL %.1f,%.1f BR %.1f,%.1f" % (bl[0], bl[1], br[0], br[1]))


def case_c_bad_prior():
    print("(c) a prior 40 px off -> the loop still lands on the true edge")
    x0, y0, x1, y1 = 600, 300, 820, 760
    L = straight_door(x0, y0, x1, y1)
    worst = 0.0
    for dx, dy in ((40, 0), (-40, 0), (0, 40), (0, -40), (28, 28), (-28, -28)):
        prior = (x0 + dx, y0 + dy, x1 + dx, y1 + dy)
        r = at.trace_aperture(L, prior, band=60)
        truth = [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]
        devs = [float(np.hypot(c[0] - t[0], c[1] - t[1]))
                for c, t in zip(r["corners"], truth)]
        worst = max(worst, max(devs))
        check("prior offset (%+d,%+d) recovers within 3 px" % (dx, dy),
              max(devs) <= 3.0, "max %.2f px" % max(devs))
    print("      worst over the six offsets: %.2f px" % worst)


def case_d_determinism_and_speed():
    print("(d) determinism, and the time on a 1536x1024 wall")
    x0, y0, x1, y1 = 600, 300, 820, 760
    L = straight_door(x0, y0, x1, y1)
    t = time.time()
    r1 = at.trace_aperture(L, (x0, y0, x1, y1), band=60)
    ms1 = (time.time() - t) * 1000.0
    t = time.time()
    r2 = at.trace_aperture(L, (x0, y0, x1, y1), band=60)
    ms2 = (time.time() - t) * 1000.0
    check("the same pixels give the same polygon", r1["polygon"] == r2["polygon"])
    check("the same pixels give the same corners", r1["corners"] == r2["corners"])
    check("under 1000 ms at 1536x1024", max(ms1, ms2) < 1000.0,
          "%.0f ms, %.0f ms" % (ms1, ms2))
    t = time.time()
    at.trace_aperture(L, (x0, y0, x1, y1), band=110)
    print("      a 110 px band (an arch's worth): %.0f ms" % ((time.time() - t) * 1000.0))


def case_e_closed_loop():
    print("(e) the loop is closed and single-valued by construction")
    x0, y0, x1, y1 = 600, 300, 820, 760
    L = straight_door(x0, y0, x1, y1)
    r = at.trace_aperture(L, (x0, y0, x1, y1), band=60)
    P = np.array(r["polygon"])
    check("n points out for n samples in", len(P) == r["n_samples"])
    gap = float(np.hypot(*(P[0] - P[-1])))
    step = float(np.max(np.hypot(np.diff(P[:, 0]), np.diff(P[:, 1]))))
    check("the last point closes onto the first", gap <= 2.0 * step,
          "gap %.2f px, longest step %.2f px" % (gap, step))


def lit_threshold_door(x0, y0, x1, y1, floor_y, lit=118.0, reveal=26, seed=11):
    """A doorway whose room BEYOND is lit — the failure the threshold rule fixes.

    The void is dark from `y0` down to `floor_y - 70`, and from there to the
    floor line it is the FAR ROOM'S FLOOR, lit at `lit`. That is what a doorway
    looks like: you see through it onto a floor catching the same key light this
    room's does. A void detector's dark run therefore stops 70 px short of the
    sill, and a tracer looking for "dark inside" climbs the far floor to meet it.
    """
    L = np.full((H, W), WALL) + _noise((H, W), seed)
    L[max(0, y0 - reveal):int(floor_y) + reveal, max(0, x0 - reveal):x1 + reveal] = JAMB
    L[y0:int(floor_y), x0:x1] = VOID
    L[int(floor_y) - 70:int(floor_y), x0:x1] = lit          # the room beyond
    L[int(floor_y):int(floor_y) + 40, :] = 132.0            # this room's floor
    return L + _noise((H, W), seed + 1)


def low_contrast_door(x0, y0, x1, y1, step=15.0, moulding=80, seed=21):
    """A dark panelled door: a 15/255 step, and a MOULDING 80 px outside it.

    The moulding is a dark line on the wall, so the step at its outer arris is
    bigger than the aperture's own AND has something as dark as the void inside
    it — which is exactly the trap `muniment_room/E` and `closet_chamber/S` fell
    into. Nothing about the picture in units of its own contrast can tell the
    moulding from the jamb; only the absolute smallness of the step can.
    """
    wall = 135.0
    void = wall - step
    L = np.full((H, W), wall) + _noise((H, W), seed)
    L[y0:y1, x0:x1] = void
    for xs in (x0 - moulding - 6, x1 + moulding):
        L[y0 - moulding - 6:y1 + moulding + 6, xs:xs + 6] = void - 2.0
    L[y0 - moulding - 6:y0 - moulding, x0 - moulding - 6:x1 + moulding + 6] = void - 2.0
    return L + _noise((H, W), seed + 1)


def notched_door(x0, y0, x1, y1, notch=100, reveal=24, seed=31):
    """A straight-headed door with a boxy slot 100 px tall above its middle.

    The slot is genuinely part of the void, so the trace SHOULD follow it — the
    loop is right and the head still is not an arch. Sagitta alone cannot tell
    the two apart, which is why `closet_chamber/S` was called arched off a
    moulding; shape can.
    """
    L = np.full((H, W), WALL) + _noise((H, W), seed)
    cx = (x0 + x1) // 2
    nx0, nx1 = cx - (x1 - x0) // 5, cx + (x1 - x0) // 5
    L[max(0, y0 - notch - reveal):y1 + reveal, x0 - reveal:x1 + reveal] = JAMB
    L[max(0, y0 - notch - reveal):y0, nx0 - reveal:nx1 + reveal] = JAMB
    L[y0:y1, x0:x1] = VOID
    L[y0 - notch:y0, nx0:nx1] = VOID
    return L + _noise((H, W), seed + 1)


def case_f_threshold_is_geometry():
    print("(f) a lit room beyond -> the bottom side IS the floor line, not a trace")
    x0, x1 = 600, 820
    y0, floor_y = 300, 760
    L = lit_threshold_door(x0, y0, x1, floor_y, floor_y)
    prior = (x0, y0, x1, floor_y - 70)          # the void's dark run, 70 px short

    bad = at.trace_aperture(L, prior, band=90)
    P = np.array(bad["polygon"])
    bot = P[np.array(bad["side"]) == 2]
    check("without a floor line the sill is missed (this is the failure)",
          abs(float(np.median(bot[:, 1])) - floor_y) > 20.0,
          "traced sill y %.1f against the true %d" % (float(np.median(bot[:, 1])), floor_y))

    r = at.trace_aperture(L, prior, band=90, floor_line_y=floor_y)
    P = np.array(r["polygon"])
    bot = P[np.array(r["side"]) == 2]
    check("the bottom side IS the floor line",
          float(np.max(np.abs(bot[:, 1] - floor_y))) <= 0.5,
          "max %.2f px off y=%d over %d samples"
          % (float(np.max(np.abs(bot[:, 1] - floor_y))), floor_y, len(bot)))
    check("it is reported as geometry, not as a trace",
          r["threshold"]["kind"] == "floor_line" and not r["threshold"]["clamped"],
          "%s at y=%.1f" % (r["threshold"]["kind"], r["threshold"]["y_px"]))
    tl, tr, br, bl = [np.array(c) for c in r["corners"]]
    check("the jamb feet sit ON the floor line",
          max(abs(bl[1] - floor_y), abs(br[1] - floor_y)) <= 1.0,
          "BL y %.2f BR y %.2f" % (bl[1], br[1]))
    check("and at the jambs' own columns, within 2 px",
          max(abs(bl[0] - x0), abs(br[0] - x1)) <= 2.0,
          "BL x %.2f (want %d), BR x %.2f (want %d)" % (bl[0], x0, br[0], x1))
    check("the head and jambs are still traced to the truth",
          max(abs(tl[0] - x0), abs(tr[0] - x1),
              abs(tl[1] - y0), abs(tr[1] - y0)) <= 2.0,
          "TL %.1f,%.1f TR %.1f,%.1f" % (tl[0], tl[1], tr[0], tr[1]))


def case_g_low_contrast_trust_region():
    print("(g) a 15/255 step with a moulding 80 px out -> the loop stays put")
    x0, y0, x1, y1 = 600, 300, 820, 760
    L = low_contrast_door(x0, y0, x1, y1)
    r = at.trace_aperture(L, (x0, y0, x1, y1), band=100, floor_line_y=y1)
    off = np.abs(np.array(r["offsets"]))[np.array(r["side"]) != 2]
    check("the wall is read as low absolute contrast",
          r["abs_contrast_l"] < 25.0 and r["trust"] < 0.1,
          "A %.1f levels, trust %.3f -> band %d px of %d asked"
          % (r["abs_contrast_l"], r["trust"], r["band_eff_px"], r["band_px"]))
    check("the evidence alone would have gone to the moulding",
          r["free_excursion_px"] >= 60,
          "the free choice reaches %d px" % r["free_excursion_px"])
    check("the loop stays within 5 px of the prior",
          int(off.max()) <= 5, "max %d px" % int(off.max()))
    check("and the confidence says so", r["wall_confidence"] < 0.5,
          "%.2f (evidence %.2f x licence %.2f)"
          % (r["wall_confidence"], r["conf_evidence"], r["conf_licence"]))


def case_h_arched_must_be_an_arc():
    print("(h) arched is a SHAPE: an arc reads arched, a 100 px slot does not")
    x0, x1, y1 = 640, 780, 760
    spring = 420
    La, (cx, cy, rad) = arched_door(x0, spring, x1, y1)
    ra = at.trace_aperture(La, (x0, int(round(cy - rad)), x1, y1),
                           band=int(rad) + 20, floor_line_y=y1)
    check("the half-round head still reads arched", ra["head_kind"] == "arched",
          "sagitta %.1f px, circle rms %.2f px, bulk %.2f"
          % (ra["head_sagitta_px"], ra["head_arc"]["rms_px"],
             ra["head_arc"]["bulk_frac"]))

    nx0, ny0, nx1, ny1 = 600, 400, 820, 760
    Ln = notched_door(nx0, ny0, nx1, ny1, notch=100)
    rn = at.trace_aperture(Ln, (nx0, ny0, nx1, ny1), band=120, floor_line_y=ny1)
    check("the 100 px excursion is really there and really taken",
          rn["max_offset_px"] >= 80, "max offset %d px" % rn["max_offset_px"])
    check("a straight head with a 100 px excursion does NOT read arched",
          rn["head_kind"] == "straight",
          "sagitta %.1f px (%.2f of width) — %s"
          % (rn["head_sagitta_px"], rn["head_sagitta_ratio"],
             ", ".join("%s=%s" % (k, rn["head_arc"][k]) for k in
                       ("convex", "monotone_curvature", "bulk_frac", "circular"))
             if rn["head_arc"] else "no circle fitted"))


def case_i_per_wall_time():
    print("(i) under 100 ms a wall, which is the bar this has to keep")
    x0, y0, x1, y1 = 600, 300, 820, 760
    L = straight_door(x0, y0, x1, y1)
    worst = 0.0
    for band in (60, 90, 110):
        t = time.time()
        at.trace_aperture(L, (x0, y0, x1, y1), band=band, floor_line_y=y1)
        worst = max(worst, (time.time() - t) * 1000.0)
    check("under 100 ms per wall at every band", worst < 100.0,
          "worst %.0f ms over bands 60/90/110" % worst)



def main():
    for fn in (case_a_rectangle, case_b_arch, case_c_bad_prior,
               case_d_determinism_and_speed, case_e_closed_loop,
               case_f_threshold_is_geometry, case_g_low_contrast_trust_region,
               case_h_arched_must_be_an_arc, case_i_per_wall_time):
        fn()
    print()
    if _fails:
        print("%d FAILED: %s" % (len(_fails), "; ".join(_fails)))
        raise SystemExit(1)
    print("all aperture_trace cases pass")


if __name__ == "__main__":
    main()
