#!/usr/bin/env python3
"""THE MESH WARP — pin the painting's own corners onto the plan's, and let the
rest of the picture come along smoothly.

    python3 design/plan-draft/measured/mesh_warp.py --facing library/S \\
        --candidate backdrops/source/library-S/row23-4a2e1e8a.png \\
        --out /tmp/library-S.png --json /tmp/library-S.json

    python3 design/plan-draft/measured/mesh_warp.py --sweep-held

[HUMAN, 2026-08-28, verbatim] "Can we just build something to identify the
corners of the door/window/room and snap/skew them into their spot without much
distortion?"

WHY THIS EXISTS BESIDE `row35_snap.py`, AND WHAT IT DOES DIFFERENTLY
--------------------------------------------------------------------
The snap is a RIGID instrument. It cuts the frame into five planes and moves
each by the one homography that carries the painted box onto the declared box.
That is exact for the shell and it is blind to everything inside it: a door
painted 200 px from where the plan rules it, on a wall whose corners and floor
line are already right, comes out of the snap still 200 px off, because no
motion of the wall PLANE moves a rectangle within that plane. The snap also
refuses — on `reveal_budget` and `stretch_budget` — pictures the page could
use: 40 camera-PASS rolls in this manor were turned away by the instrument
rather than by the painting.

This tool is the audit's "sensor, not judge". It reads landmarks, it reads
targets, it moves the landmarks onto the targets, and it refuses on exactly two
things — a landmark that cannot be read at all, and an aperture COUNT that is
wrong. A wrong count is a CONTENT miss: the painting does not show what the
plan rules, and no amount of moving pixels puts a door there. Everything else
is reported as a number and shipped, because the manor's 122 camera failures
are 114 cases of pure SCALE jitter (±10–18 %, unbiased) — which is a similarity
correction, not a repaint.

THE LANDMARKS AND THEIR TARGETS
-------------------------------
LANDMARKS come off the painting, and every one of them is a reading some
existing instrument already took:

  * the four room corners — the two returns crossed with the floor and ceiling
    lines — out of `row35_snap.source_box`, which is `row23_lib`'s own
    measurement of the frame and re-detects nothing;
  * the floor and ceiling line endpoints, taken where each of the four return
    rays leaves the frame;
  * each door rectangle `door_measure.measure_openings` finds, four corners
    apiece;
  * each window rectangle `window_measure.measure_windows` finds, likewise.

TARGETS come off the plan at the DECLARED camera — `corner_x0_px`,
`corner_x1_px`, `floor_line_y`, the ceiling line at the ruled storey, the
horizon — and the door and window rectangles `tools/plan-projection.mjs`
projects, fetched through `plan_apertures.mjs` so that no second implementation
of `xAtScale` can drift from the renderer's.

The four shell corners pair box-to-box. The line endpoints pair through the
five-plane map the snap already owns: an endpoint is chosen in the TARGET frame
and carried back to its exact source point by `row35_snap.map_points`, so the
shell of this warp agrees with the snap's shell by construction rather than by
tolerance. Apertures pair by KIND and NEAREST CENTRE, comparing each measured
centre after the shell map has carried it across — a door 200 px off the plan
in the raw frame is 200 px off after the shell moves too, and that gap is
precisely what this tool closes. Plan apertures nothing in the painting answers
to are REPORTED, never invented.

THE WARP
--------
A THIN-PLATE SPLINE through every pin, evaluated over the whole target frame,
target-to-source, so the result is a plain resampling and needs no
scattered-data inversion. The spline is the surface of least bending energy
that passes through all the pins, which is exactly "pins each landmark to its
target and interpolates minimally between": a landmark's disagreement with its
neighbours is paid for across the entire frame rather than absorbed in a few
score pixels around it.

That last clause is the whole of the choice. Moving Least Squares
(Schaefer, Mcmillan & Yu 2006) is implemented here too and is available as
`--warp similarity|rigid|affine`; its similarity form is a pure rotation and
uniform scale about a moving centroid, which cannot shear, and it is the right
tool when the pins agree. But its `1/d^2` weighting is LOCAL, and on the
synthetic door — 15 % too large and 60 px out of place inside a wall that is
already right — it pays for the 60 px inside a couple of hundred pixels: a
2.6x worst-case stretch, and a jamb still 16 px off target. The spline puts the
same door within 0 px at 3.5x worst-case and 1.02x median, and on a pure scale
error (the manor's actual failure: +-10-18 % unbiased, 114 of 122) it
reproduces the correction exactly at 0.87x. Widening the MLS reach smooths the
field but stops it hitting its pins, which is the one thing it may not do.

Both are exact at the pins: `f(p_i) = q_i` to floating point, which
`test_mesh_warp.py` checks for all four modes.

MARGIN AND REVEAL
-----------------
A source with more field than the declared frame is used: the extra band is
centred and the landmarks are offset into it. Where the warp still reaches past
the source, the sample is folded back into the nearest 24 px band by a
mirror-repeat rather than clamped, so an over-reach reads as an echo of the
adjacent wall and never as a smeared hard edge. Every such pixel is counted and
reported as `revealed_px`; NOTHING refuses on it. The reveal is the honest cost
of a correction and the Navigator prices it, not this file.

WHAT THIS DOES NOT DO
---------------------
It does not promote, it does not write the store, and it does not move the run
state. It writes a PNG and a record beside it and prints a table. Wiring a
verdict to a promotion is the Navigator's.
"""

import argparse
import hashlib
import json
import os
import subprocess
import sys
import time

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, HERE)

import row35_snap as snap                                       # noqa: E402
import door_measure                                             # noqa: E402
import window_measure                                           # noqa: E402
from measure_lib import load                                    # noqa: E402

#: The declared frame. Same numbers `row35_snap` states, and for the same
#: reason: it is the canvas the scaffold projects onto.
W, H = snap.W, snap.H

MANOR = snap.MANOR
STATE = snap.STATE
PLAN = snap.PLAN
READINGS = os.path.join(HERE, "manor")
OUTDIR = os.path.join(HERE, "meshwarp")
APERTURES_MJS = os.path.join(HERE, "plan_apertures.mjs")

#: THE MIRROR BAND. How deep a strip is folded back where the warp reaches past
#: the source. 24 px on this corpus is about 0.15 m of painted wall at a near
#: facing's scale — wide enough that a limewash or a plaster grain repeats
#: without a visible seam, narrow enough that nothing structural (a window
#: mullion, a door jamb) can be duplicated into the frame.
MIRROR_BAND_PX = 24

#: The MLS falloff exponent, and the softening that keeps the weight finite at
#: a pin. `alpha = 1` is Schaefer's default and gives `1/d^2` influence.
MLS_ALPHA = 1.0
MLS_EPS = 1e-8

#: How near two aperture centres must be, in metres along the wall, to be the
#: same aperture. A door is at least 0.40 m wide (`door_measure`) and the manor
#: never rules two apertures closer than a bay, so a metre and a half of slack
#: pairs generously without ever crossing a bay. Pairing is greedy-nearest and
#: this is only the outer bound on a match.
PAIR_MAX_M = 1.5

#: How far the painted corner span may differ from the span the declared camera
#: draws before the reading stops being a reading of THIS room's corners. The
#: honest corrections on this corpus run 0.65x to 1.55x — the whole of the
#: ±10–18 % scale jitter plus the corner detector's own slop — and the one
#: reading that is not a room at all comes in at 0.09x. 2.5 sits between them
#: with room to spare on both sides.
CORNER_SPAN_RATIO = 2.5

#: The two named refusals. Nothing else in this file returns a refusal.
LANDMARK_REFUSAL = "meshwarp.landmark_unreadable"
COUNT_REFUSAL = "meshwarp.aperture_count"


# --------------------------------------------------------------- the MLS core

def mls_field(px, py, qx, qy, gx, gy, mode="similarity"):
    """Moving-least-squares deformation of `(gx, gy)`, pins `p` onto sources `q`.

    `p` are the TARGET positions and `q` the SOURCE positions, so the field
    returned is the target-to-source map a resampler wants. `f(p_i) == q_i` to
    floating point at every pin, for every mode.

    Shapes: `p*`/`q*` are (N,), `g*` are any matching shape, and the result has
    the shape of `g*`.
    """
    p = np.stack([np.asarray(px, float), np.asarray(py, float)], axis=1)
    q = np.stack([np.asarray(qx, float), np.asarray(qy, float)], axis=1)
    n = p.shape[0]
    if n == 0:
        raise ValueError("a moving-least-squares field needs at least one pin")
    shape = np.shape(gx)
    v = np.stack([np.asarray(gx, float).ravel(),
                  np.asarray(gy, float).ravel()], axis=1)          # (M, 2)

    ox = np.empty(v.shape[0], float)
    oy = np.empty(v.shape[0], float)
    # Chunked so the (M, N) weight block never has to exist all at once: a
    # 1536x1024 frame against 40 pins is 63 M doubles in one piece.
    step = max(1, int(4_000_000 // max(n, 1)))
    for a in range(0, v.shape[0], step):
        vv = v[a:a + step]                                          # (m, 2)
        d2 = ((vv[:, None, :] - p[None, :, :]) ** 2).sum(axis=2)     # (m, N)
        w = 1.0 / np.power(d2 + MLS_EPS, MLS_ALPHA)
        ws = w.sum(axis=1, keepdims=True)
        pstar = (w[:, :, None] * p[None, :, :]).sum(axis=1) / ws
        qstar = (w[:, :, None] * q[None, :, :]).sum(axis=1) / ws
        ph = p[None, :, :] - pstar[:, None, :]                       # (m, N, 2)
        qh = q[None, :, :] - qstar[:, None, :]
        V = vv - pstar                                               # (m, 2)
        if mode == "affine":
            # M = (sum w ph^T ph)^-1 (sum w ph^T qh), solved per point.
            A = np.einsum("mn,mni,mnj->mij", w, ph, ph)
            B = np.einsum("mn,mni,mnj->mij", w, ph, qh)
            A = A + np.eye(2)[None, :, :] * 1e-9
            M = np.linalg.solve(A, B)                                # (m, 2, 2)
            out = qstar + np.einsum("mi,mij->mj", V, M)
        else:
            zp = ph[..., 0] + 1j * ph[..., 1]                        # (m, N)
            zq = qh[..., 0] + 1j * qh[..., 1]
            zv = V[:, 0] + 1j * V[:, 1]                              # (m,)
            mu = (w * (np.abs(zp) ** 2)).sum(axis=1)
            num = (w * zq * np.conj(zp)).sum(axis=1)
            S = np.where(mu > 0, num / np.where(mu > 0, mu, 1.0), 1.0 + 0j)
            if mode == "rigid":
                mag = np.abs(S)
                S = np.where(mag > 0, S / np.where(mag > 0, mag, 1.0), 1.0 + 0j)
            z = qstar[:, 0] + 1j * qstar[:, 1] + zv * S
            out = np.stack([z.real, z.imag], axis=1)
        ox[a:a + step] = out[:, 0]
        oy[a:a + step] = out[:, 1]
    return ox.reshape(shape), oy.reshape(shape)


def tps_field(px, py, qx, qy, gx, gy):
    """Thin-plate-spline deformation, pins `p` onto sources `q`.

    THE MINIMAL INTERPOLANT, and the reason this is the default rather than the
    moving-least-squares field beside it. Both pin every landmark exactly; they
    differ in what they do between the pins, and that difference is the whole
    of "without much distortion".

    MLS weights a pin by `1/d^2`, so a pin's disagreement with its neighbours is
    absorbed within a few score pixels of it. A door painted 60 px from where
    the plan rules it therefore costs a 2.6x local stretch: the picture is
    compressed hard on one side of the door and pulled hard on the other, over
    the ~200 px to the next landmark. Widening that reach smooths the field but
    stops it hitting its pins, which is the one thing it may not do.

    A thin-plate spline instead minimises the integral bending energy over the
    WHOLE plane subject to hitting every pin, so the same 60 px is paid for
    across the entire frame: on the synthetic room that is a 1.11x worst-case
    stretch instead of 2.64x, at the same pin-exactness. The solve is a
    `(N+3) x (N+3)` linear system, N being the pin count, which for a wall's
    dozen-to-thirty landmarks costs nothing.
    """
    p = np.stack([np.asarray(px, float), np.asarray(py, float)], axis=1)
    q = np.stack([np.asarray(qx, float), np.asarray(qy, float)], axis=1)
    n = p.shape[0]
    if n < 3:
        return mls_field(px, py, qx, qy, gx, gy, mode="similarity")

    def U(r2):
        return np.where(r2 > 0, 0.5 * r2 * np.log(np.maximum(r2, 1e-300)), 0.0)

    d2 = ((p[:, None, :] - p[None, :, :]) ** 2).sum(axis=2)
    K = U(d2)
    P = np.concatenate([np.ones((n, 1)), p], axis=1)                # (n, 3)
    L = np.zeros((n + 3, n + 3))
    L[:n, :n] = K
    L[:n, n:] = P
    L[n:, :n] = P.T
    rhs = np.zeros((n + 3, 2))
    rhs[:n] = q
    # A hair of ridge on the kernel block only: a pin list with two coincident
    # points makes `L` singular, and `dedupe_pins` is what keeps that from
    # happening — this is the belt to that brace and is small enough (1e-8
    # against a kernel of order 1e5) to leave interpolation exact to floating
    # point.
    L[:n, :n] += np.eye(n) * 1e-8
    sol = np.linalg.solve(L, rhs)
    w, a = sol[:n], sol[n:]

    shape = np.shape(gx)
    v = np.stack([np.asarray(gx, float).ravel(),
                  np.asarray(gy, float).ravel()], axis=1)
    out = np.empty((v.shape[0], 2))
    step = max(1, int(4_000_000 // max(n, 1)))
    for i in range(0, v.shape[0], step):
        vv = v[i:i + step]
        r2 = ((vv[:, None, :] - p[None, :, :]) ** 2).sum(axis=2)
        out[i:i + step] = (U(r2) @ w
                           + a[0][None, :] + vv @ a[1:])
    return out[:, 0].reshape(shape), out[:, 1].reshape(shape)


def field(px, py, qx, qy, gx, gy, mode="tps"):
    """The deformation field, by name. `tps`, or an MLS mode."""
    if mode == "tps":
        return tps_field(px, py, qx, qy, gx, gy)
    return mls_field(px, py, qx, qy, gx, gy, mode=mode)


def mirror_fold(c, lo, hi, band=MIRROR_BAND_PX):
    """Coordinates outside `[lo, hi]`, folded into the nearest `band` px strip.

    Continuous at the border (a sample exactly on it stays on it) and periodic
    beyond it, so an over-reach reads as the adjacent strip echoed rather than
    as the border pixel smeared. Returns `(folded, depth)` where `depth` is how
    far outside the range the request was — the reveal, in pixels.
    """
    c = np.asarray(c, float)
    below = np.maximum(lo - c, 0.0)
    above = np.maximum(c - hi, 0.0)
    depth = below + above
    period = 2.0 * band

    def tri(d):
        u = np.mod(d, period)
        return np.where(u <= band, u, period - u)

    out = np.where(below > 0, lo + tri(below), c)
    out = np.where(above > 0, hi - tri(above), out)
    return out, depth


def resample(rgb, sx, sy, band=MIRROR_BAND_PX):
    """Bilinear resample of `rgb` at `(sx, sy)`, folding over-reach in a mirror.

    Returns `(pixels, revealed)` — `revealed` is the boolean mask of samples
    that fell outside the source at all.
    """
    h, w = rgb.shape[:2]
    fx, dx = mirror_fold(sx, 0.0, w - 1.0, band)
    fy, dy = mirror_fold(sy, 0.0, h - 1.0, band)
    revealed = (dx > 0) | (dy > 0)
    x0 = np.floor(fx).astype(np.int64)
    y0 = np.floor(fy).astype(np.int64)
    tx = (fx - x0)[..., None]
    ty = (fy - y0)[..., None]
    x0 = np.clip(x0, 0, w - 1)
    y0 = np.clip(y0, 0, h - 1)
    x1 = np.clip(x0 + 1, 0, w - 1)
    y1 = np.clip(y0 + 1, 0, h - 1)
    a = rgb[y0, x0].astype(np.float64)
    b = rgb[y0, x1].astype(np.float64)
    c = rgb[y1, x0].astype(np.float64)
    d = rgb[y1, x1].astype(np.float64)
    top = a + (b - a) * tx
    bot = c + (d - c) * tx
    return top + (bot - top) * ty, revealed


def local_stretch(sx, sy):
    """How much SOURCE detail each output pixel is asked to magnify.

    The Jacobian of the target-to-source map by central difference; a source
    neighbourhood is magnified by the reciprocal of a singular value, so the
    resampling cost is `1 / sigma_min`. Reported at the maximum and at the
    99.9th percentile, because one pixel at a pin's singularity is not a
    picture-wide fact and the percentile is.
    """
    j11 = np.gradient(sx, axis=1)
    j12 = np.gradient(sx, axis=0)
    j21 = np.gradient(sy, axis=1)
    j22 = np.gradient(sy, axis=0)
    s = j11 ** 2 + j12 ** 2 + j21 ** 2 + j22 ** 2
    det = np.abs(j11 * j22 - j12 * j21)
    disc = np.sqrt(np.maximum(s * s - 4 * det * det, 0.0))
    smin = np.sqrt(np.maximum((s - disc) / 2.0, 0.0))
    smax = np.sqrt(np.maximum((s + disc) / 2.0, 0.0))
    mag = 1.0 / np.maximum(smin, 1e-6)
    # A FOLD IS THE ONE FAILURE A NUMBER MUST NAME. Where the determinant turns
    # over, the map has doubled the picture back on itself and the pixels there
    # are not a stretched reading of the source but a mirror of one. It happens
    # when two pins a few score pixels apart pull hard in opposite directions —
    # a painted window 2.3x narrower than the plan rules it, beside a wall edge
    # that barely moves. It is a fact about the disagreement, not about the
    # solver, so it is counted and reported rather than smoothed away.
    signed = j11 * j22 - j12 * j21
    folded = signed <= 0
    return dict(
        max_local_stretch=round(float(mag.max()), 3),
        p999_local_stretch=round(float(np.percentile(mag, 99.9)), 3),
        median_local_stretch=round(float(np.median(mag)), 3),
        max_local_compression=round(float((1.0 / np.maximum(smax, 1e-6)).min()), 3),
        folded_px=int(folded.sum()),
        folded_fraction=round(float(folded.mean()), 5))


# --------------------------------------------------------------- the pin list

def _rect_corners(x0, y0, x1, y1):
    return [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]


def _exit_point(vx, vy, cx, cy, w, h):
    """Where the ray from `(vx, vy)` through `(cx, cy)` leaves the `w x h` frame.

    The ray is followed FORWARD only — away from the convergence — so a floor
    corner's endpoint is down-frame and a ceiling corner's is up-frame, which is
    the direction the return actually recedes towards the viewer.
    """
    dx, dy = cx - vx, cy - vy
    if abs(dx) < 1e-9 and abs(dy) < 1e-9:
        return None
    best = None
    for lo, hi, d, o in ((0.0, w - 1.0, dx, vx), (0.0, h - 1.0, dy, vy)):
        if abs(d) < 1e-9:
            continue
        for edge in (lo, hi):
            t = (edge - o) / d
            if t < 1.0:
                continue
            x, y = vx + t * dx, vy + t * dy
            if -0.5 <= x <= w - 0.5 and -0.5 <= y <= h - 0.5:
                if best is None or t < best[0]:
                    best = (t, x, y)
    if best is None:
        return None
    return best[1], best[2]


def shell_pins(src_box, tgt_box, offset=(0.0, 0.0)):
    """The room's own pins: four corners, four line endpoints, four edge mids.

    Every pin is a point of the TARGET frame paired with the point of the
    SOURCE frame that the five-plane map already says is the same physical
    place, so the shell of this warp is the snap's shell sampled at twelve
    points and cannot disagree with it.
    """
    ox, oy = offset
    pins = []

    def pair(name, kind, tx, ty):
        sx, sy, idx = snap.map_points(src_box, tgt_box,
                                      np.array([float(tx)]), np.array([float(ty)]))
        if not np.isfinite(sx[0]) or not np.isfinite(sy[0]):
            return
        pins.append(dict(name=name, kind=kind,
                         target=[round(float(tx), 2), round(float(ty), 2)],
                         source=[round(float(sx[0]) + ox, 2),
                                 round(float(sy[0]) + oy, 2)]))

    tx0, tx1 = tgt_box["x0"], tgt_box["x1"]
    tyc, tyf = tgt_box["yc"], tgt_box["yf"]
    for nm, x, y in (("corner_left_ceiling", tx0, tyc),
                     ("corner_right_ceiling", tx1, tyc),
                     ("corner_left_floor", tx0, tyf),
                     ("corner_right_floor", tx1, tyf)):
        pair(nm, "room_corner", x, y)
    for nm, x, y in (("floor_line_left_end", tx0, tyf),
                     ("floor_line_right_end", tx1, tyf),
                     ("ceiling_line_left_end", tx0, tyc),
                     ("ceiling_line_right_end", tx1, tyc)):
        e = _exit_point(tgt_box["vx"], tgt_box["vy"], x, y, W, H)
        if e is not None:
            pair(nm, "line_end", e[0], e[1])
    for nm, x, y in (("wall_edge_top", 0.5 * (tx0 + tx1), tyc),
                     ("wall_edge_bottom", 0.5 * (tx0 + tx1), tyf),
                     ("wall_edge_left", tx0, 0.5 * (tyc + tyf)),
                     ("wall_edge_right", tx1, 0.5 * (tyc + tyf))):
        pair(nm, "wall_edge", x, y)
    return pins


def _centre_in_target(src_box, tgt_box, rect):
    """A measured rectangle's centre, carried into the target frame by the shell."""
    cx = 0.5 * (rect["x0_px"] + rect["x1_px"])
    cy = 0.5 * (rect["y0_px"] + rect["y1_px"])
    ax, ay, _ = snap.forward(src_box, tgt_box,
                             np.array([float(cx)]), np.array([float(cy)]))
    if np.isfinite(ax[0]) and np.isfinite(ay[0]):
        return float(ax[0]), float(ay[0])
    return cx, cy


def pair_apertures(kind, measured, planned, src_box, tgt_box, ppm_t):
    """Greedy nearest-centre pairing of measured rectangles onto plan rectangles.

    Returns `(pairs, unpaired_plan, unpaired_source)`. Nothing is invented: a
    plan aperture with no measured answer comes back in `unpaired_plan`, and a
    measured rectangle with no plan counterpart comes back in `unpaired_source`
    and is never pinned — the plan is what a target has to come from.
    """
    cand = []
    for i, m in enumerate(measured):
        cx, cy = _centre_in_target(src_box, tgt_box, m)
        for j, pl in enumerate(planned):
            px = pl["x"] + 0.5 * pl["w"]
            py = pl["y"] + 0.5 * pl["h"]
            cand.append((abs(cx - px), i, j, cy, py))
    cand.sort(key=lambda t: (t[0], t[1], t[2]))
    used_m, used_p, pairs = set(), set(), []
    for d, i, j, cy, py in cand:
        if i in used_m or j in used_p:
            continue
        if d > PAIR_MAX_M * ppm_t:
            continue
        used_m.add(i)
        used_p.add(j)
        pairs.append(dict(kind=kind, measured=measured[i], plan=planned[j],
                          centre_gap_px=round(float(d), 1)))
    return (pairs,
            [planned[j].get("id", "plan#%d" % j)
             for j in range(len(planned)) if j not in used_p],
            [dict(centre_px=round(0.5 * (measured[i]["x0_px"] + measured[i]["x1_px"]), 1),
                  width_px=measured[i]["width_px"])
             for i in range(len(measured)) if i not in used_m])


#: How many extra pins to lay along each side of an aperture, between its
#: corners. FOUR CORNERS ALONE LET THE SIDE BULGE: the interpolant is free
#: between its pins, and on the synthetic door — 15 % too large and 60 px off —
#: a jamb halfway down bows 4 px out of line while both its ends sit exactly on
#: target. One pin per side pulls that to under 2 px. It is not a smoothing
#: knob: every added pin is a point of the SAME two rectangles, read off the
#: same two measurements, so nothing is invented by adding them. Two per side
#: takes the synthetic door's worst jamb from 4.0 px to 0.0 px.
APERTURE_EDGE_SAMPLES = 2


def aperture_pins(pairs, offset=(0.0, 0.0), edge_samples=APERTURE_EDGE_SAMPLES):
    """A paired aperture's outline, measured rectangle onto plan rectangle.

    Four corners, plus `edge_samples` evenly spaced points along each side.
    """
    ox, oy = offset
    pins = []

    def side(a, b, n):
        """`n` interior points of the segment `a`->`b`, plus its start."""
        return [(a[0] + (b[0] - a[0]) * i / (n + 1.0),
                 a[1] + (b[1] - a[1]) * i / (n + 1.0)) for i in range(n + 1)]

    for k, pr in enumerate(pairs):
        m, pl = pr["measured"], pr["plan"]
        s = _rect_corners(m["x0_px"], m["y0_px"], m["x1_px"], m["y1_px"])
        t = _rect_corners(pl["x"], pl["y"], pl["x"] + pl["w"], pl["y"] + pl["h"])
        names = ("tl", "tr", "br", "bl")
        for e in range(4):
            ss = side(s[e], s[(e + 1) % 4], edge_samples)
            tt = side(t[e], t[(e + 1) % 4], edge_samples)
            for i, ((sxx, syy), (txx, tyy)) in enumerate(zip(ss, tt)):
                nm = names[e] if i == 0 else "%s+%d" % (names[e], i)
                pins.append(dict(
                    name="%s:%s:%s" % (pr["kind"], pl.get("id", "#%d" % k), nm),
                    kind=pr["kind"],
                    target=[round(float(txx), 2), round(float(tyy), 2)],
                    source=[round(float(sxx) + ox, 2), round(float(syy) + oy, 2)]))
    return pins


def dedupe_pins(pins, min_sep=2.0):
    """Drop a pin whose TARGET already has one within `min_sep` px.

    Two pins at the same place pulling to different sources is the one way a
    moving-least-squares field can fold, and the shell can produce it honestly:
    a wall whose corner sits on the frame edge has its corner and its line
    endpoint at the same point. First pin wins, which puts the corners ahead of
    the endpoints and the shell ahead of the apertures — the order they are
    built in.
    """
    kept, drop = [], []
    for p in pins:
        tx, ty = p["target"]
        if any((tx - k["target"][0]) ** 2 + (ty - k["target"][1]) ** 2
               < min_sep * min_sep for k in kept):
            drop.append(p["name"])
            continue
        kept.append(p)
    return kept, drop


# ------------------------------------------------------------ the plan's side

def plan_apertures(key, plan_path=None):
    """The plan's doors and windows on `loc/F`, through `plan_apertures.mjs`."""
    loc, facing = key.split("/")
    plan_path = plan_path or PLAN
    out = subprocess.run(
        ["node", APERTURES_MJS, plan_path, loc, facing],
        capture_output=True, text=True, cwd=ROOT, timeout=120)
    if out.returncode != 0:
        return dict(ok=False, why=("the plan projection refused %s: %s"
                                   % (key, (out.stderr or "").strip()[:200])))
    try:
        return json.loads(out.stdout.strip().splitlines()[-1])
    except Exception as ex:
        return dict(ok=False, why="the plan projection printed no JSON: %s" % ex)


def target_box_from_plan(declared, src_box, ppm_source):
    """The box the DECLARED camera draws, out of the scaffold's own numbers.

    THE VERTICAL IS ALWAYS THE PLAN'S. The floor line and the ruled storey are
    determinate for every facing and the apertures are projected against them,
    so a shell that used the painted storey would fight its own pins.

    THE HORIZONTAL IS THE PLAN'S ONLY WHERE THE CAMERA CAN SEE IT, and this is
    the correction the first sweep of this file paid for. Most manor facings
    are wider than the lens: `solar/N` declares its corners at x -77 and 1613,
    which is 77 px off each side of a 1536 px frame. On such a wall the frame
    shows no corner at all, so whatever `find_corners_recession` returned is a
    recession breakpoint and NOT the room's corner — and pinning it to an
    off-frame plan corner asks for a 2.2x magnification to fix an 8 % scale
    error. `closet_chamber/S` did exactly that.

    Where both declared corners fall inside the frame the painting can be held
    to them. Where either does not, the target keeps `row35_snap.target_box`'s
    convention instead: the painted width crossed at the DECLARED scale, about
    the wall's own centre. That still carries the whole of the scale
    correction — `k = ppm_target / ppm_source` is the measured error and
    nothing else — while claiming nothing about a corner nobody drew.
    """
    ppm = declared["ppm"]
    yf = declared["floor_px"]
    yc = yf - declared["storey_m"] * ppm
    cx0, cx1 = declared.get("corner_x0"), declared.get("corner_x1")
    seen = (cx0 is not None and cx1 is not None
            and 0.0 <= cx0 <= W - 1.0 and 0.0 <= cx1 <= W - 1.0)
    if seen:
        x0, x1, how = cx0, cx1, "the declared corners, both inside the frame"
    else:
        k = ppm / ppm_source
        half = 0.5 * (src_box["x1"] - src_box["x0"]) * k
        x0 = declared["wall_centre_x"] - half
        x1 = declared["wall_centre_x"] + half
        how = ("the painted width at the declared scale (k=%.4f): the declared "
               "corners sit at %.0f and %.0f, outside a %d px frame, so this "
               "wall shows no corner to hold" % (k, cx0 if cx0 is not None else float("nan"),
                                                 cx1 if cx1 is not None else float("nan"), W))
    b = snap.box(x0, x1, yc, yf, declared["principal_x"], declared["horizon_px"])
    bad = snap.box_refusal(b)
    if bad:
        return None, None, "the declared camera does not see this room: " + bad
    return b, dict(horizontal=how, corners_in_frame=bool(seen),
                   ppm_source=round(float(ppm_source), 3),
                   ppm_target=round(float(ppm), 3),
                   scale_k=round(float(ppm / ppm_source), 4)), None


# ------------------------------------------------------------ reading a candidate

def reading_for(candidate, key, side, cfg, ref):
    """The gate's own reading of this frame — from the cache if it is there.

    `design/plan-draft/measured/manor/<id>.json` is keyed by the candidate's own
    id, which is the filename's hash, so a cached reading is the reading of THIS
    file and re-measuring it would only cost the two minutes row 30 cut.
    """
    base = os.path.basename(candidate)
    ident = base.replace("row23-", "").rsplit(".", 1)[0]
    cached = os.path.join(READINGS, ident + ".json")
    if os.path.exists(cached):
        try:
            d = json.load(open(cached))
            if d.get("_measured_px") is not None:
                d["_cache"] = os.path.relpath(cached, ROOT)
                return d
        except Exception:
            pass
    d = snap.measure(os.path.join(ROOT, candidate), side, cfg, ref)
    d["_cache"] = None
    return d


def measured_apertures(png_path, src_box, reading, declared):
    """Every door and window the painting shows, as rectangles at the wall plane."""
    ppm = reading.get("px_per_m_at_wall")
    yf = float((reading.get("_measured_px") or {})["wall_floor_line_y_px"])
    storey = (src_box["yf"] - src_box["yc"]) / ppm
    doors, dnote = door_measure.measure_openings(
        png_path, src_box["x0"], src_box["x1"], yf, ppm, storey)
    wins, wnote = window_measure.measure_windows(
        png_path, src_box["x0"], src_box["x1"], yf, ppm, storey)
    return doors, wins, dict(
        door_note=dnote if isinstance(dnote, str) else dnote.get("method"),
        window_note=wnote if isinstance(wnote, str) else wnote.get("method"),
        source_storey_m=round(float(storey), 3),
        source_ppm=round(float(ppm), 3))


# --------------------------------------------------------------- the warp itself

def warp_with_pins(rgb, pins, mode="tps", band=MIRROR_BAND_PX):
    """Resample `rgb` onto the declared frame so every pin's source lands on its target."""
    px = np.array([p["target"][0] for p in pins], float)
    py = np.array([p["target"][1] for p in pins], float)
    qx = np.array([p["source"][0] for p in pins], float)
    qy = np.array([p["source"][1] for p in pins], float)
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float64)
    sx, sy = field(px, py, qx, qy, xs, ys, mode=mode)
    out, revealed = resample(rgb, sx, sy, band=band)
    # The interpolation residual: how far the field puts each pin's target off
    # its own source. It is a property of the solve, not of the picture, and it
    # is written down so that a pin that failed to take cannot hide.
    fx, fy = field(px, py, qx, qy, px, py, mode=mode)
    for p, a, b in zip(pins, fx, fy):
        p["residual_px"] = round(float(np.hypot(a - p["source"][0],
                                                b - p["source"][1])), 3)
        p["ask_px"] = round(float(np.hypot(p["source"][0] - p["target"][0],
                                           p["source"][1] - p["target"][1])), 1)
    report = dict(local_stretch=local_stretch(sx, sy),
                  revealed_px=int(revealed.sum()),
                  revealed_fraction=round(float(revealed.mean()), 5),
                  warp_mode=mode, mirror_band_px=band, pin_count=len(pins))
    return out, report


def sha256(path):
    return hashlib.sha256(open(path, "rb").read()).hexdigest()


def warp_wall(key, candidate, mode="tps", plan_path=None):
    """Warp one manor facing. Returns `(rgb_or_None, record)`.

    Two refusals and no others: a landmark that cannot be read, and an aperture
    count the painting does not answer.
    """
    t0 = time.time()
    e, side, cfg, ref, declared = snap.wall_context(key)
    png = os.path.join(ROOT, candidate)
    rec = dict(facing=key, candidate=candidate, warp_mode=mode,
               declared_frame=[W, H], verdict=None, why=None)
    if not os.path.exists(png):
        rec.update(verdict="refused", clause=LANDMARK_REFUSAL,
                   why="the candidate is not on disk: " + candidate)
        return None, rec
    rec["sha256"] = sha256(png)

    ap = plan_apertures(key, plan_path)
    if not ap.get("ok"):
        rec.update(verdict="refused", clause=LANDMARK_REFUSAL,
                   why="the plan gives this facing no geometry: " + str(ap.get("why")))
        return None, rec

    # AN OPEN FACING HAS NO ROOM CORNERS TO PIN. The manor's five exterior
    # approaches (`entrance_court/N`, `privy_garden/E`, ...) are scaffolded
    # without a storey height because there is no ceiling over them, so the
    # four landmarks this tool is named for do not exist. That is a landmark
    # refusal and not a failure: it says the instrument does not apply here.
    if declared.get("storey_m") is None:
        rec.update(verdict="refused", clause=LANDMARK_REFUSAL, why=(
            "this facing is %s and the scaffold gives it no storey height, so "
            "it has no ceiling line and no room corners to pin"
            % (declared.get("facing_type") or "open")))
        return None, rec

    reading = reading_for(candidate, key, side, cfg, ref)
    rec["reading_cache"] = reading.get("_cache")
    rec["before"] = dict(camera_verdict=reading.get("verdict"),
                         delta_focal_pct=reading.get("delta_focal_pct"),
                         delta_eye_pct=reading.get("delta_eye_pct"),
                         hold_family=(reading.get("_promotion") or {}).get("hold_family"))

    declared_src = dict(declared)
    src_box, notes, why = snap.source_box(reading, declared_src, "auto")
    if src_box is None:
        rec.update(verdict="refused", clause=LANDMARK_REFUSAL,
                   why="the room's own corners cannot be read: " + str(why))
        return None, rec
    rec["source_notes"] = notes

    tgt_box, tnotes, why = target_box_from_plan(
        declared, src_box, reading["px_per_m_at_wall"])
    if tgt_box is None:
        rec.update(verdict="refused", clause=LANDMARK_REFUSAL, why=why)
        return None, rec
    # THE CORNERS HAVE TO BE THE ROOM'S. `find_corners_recession` returns the
    # strongest level-break in each half-frame whether or not a corner is what
    # made it, and on `back_stair/S` it returns two breaks 139 px apart — 0.50 m
    # of wall at that frame's own scale, narrower than the door beside it — on a
    # wall the plan rules 1508 px wide. Pinning that asks for a 10.8x
    # magnification of a strip and calls it a room. A span this far from the one
    # the declared camera draws is not the room's corners, so the landmark has
    # not been found and this refuses by that name rather than shipping a smear.
    span_s = float(src_box["x1"] - src_box["x0"])
    span_t = float(tgt_box["x1"] - tgt_box["x0"])
    if span_t > 0 and not (1.0 / CORNER_SPAN_RATIO <= span_s / span_t <= CORNER_SPAN_RATIO):
        rec.update(verdict="refused", clause=LANDMARK_REFUSAL, why=(
            "the painted corners span %.0f px where the declared camera draws "
            "%.0f (%.2fx, outside the %.1fx a corner reading may differ by), so "
            "what was read is a recession break and not this room's corners"
            % (span_s, span_t, span_s / span_t, CORNER_SPAN_RATIO)))
        return None, rec
    rec["target_notes"] = tnotes
    rec["source_box"] = {k: round(float(v), 2) for k, v in src_box.items()}
    rec["target_box"] = {k: round(float(v), 2) for k, v in tgt_box.items()}

    rgb = load(png)
    hs, ws = rgb.shape[:2]
    ox, oy = (ws - W) / 2.0, (hs - H) / 2.0
    rec["source_size"] = [int(ws), int(hs)]
    rec["margin_px"] = [round(ox, 1), round(oy, 1)]

    doors, wins, anote = measured_apertures(png, src_box, reading, declared)
    rec["aperture_notes"] = anote
    ppm_t = declared["ppm"]
    dpairs, dplan_un, dsrc_un = pair_apertures(
        "door", doors, ap.get("openings") or [], src_box, tgt_box, ppm_t)
    wpairs, wplan_un, wsrc_un = pair_apertures(
        "window", wins, ap.get("windows") or [], src_box, tgt_box, ppm_t)
    rec["apertures"] = dict(
        doors=dict(plan=len(ap.get("openings") or []), measured=len(doors),
                   paired=len(dpairs), unpaired_plan=dplan_un,
                   unpaired_source=dsrc_un),
        windows=dict(plan=len(ap.get("windows") or []), measured=len(wins),
                     paired=len(wpairs), unpaired_plan=wplan_un,
                     unpaired_source=wsrc_un))

    missing = [("door", i) for i in dplan_un] + [("window", i) for i in wplan_un]
    if missing:
        rec.update(verdict="refused", clause=COUNT_REFUSAL, why=(
            "content miss: the plan rules %s on %s and the painting shows none "
            "of them (doors %d/%d, windows %d/%d) — no motion of pixels puts an "
            "aperture where nothing was painted"
            % (", ".join("%s %s" % (k, i) for k, i in missing), key,
               len(doors), len(ap.get("openings") or []),
               len(wins), len(ap.get("windows") or []))))
        return None, rec

    pins = shell_pins(src_box, tgt_box, offset=(ox, oy))
    pins += aperture_pins(dpairs + wpairs, offset=(ox, oy))
    pins, dropped = dedupe_pins(pins)
    rec["pins_dropped_as_duplicate"] = dropped
    if len(pins) < 4:
        rec.update(verdict="refused", clause=LANDMARK_REFUSAL, why=(
            "only %d landmark(s) survived the shell map, which is fewer than the "
            "four corners a room has" % len(pins)))
        return None, rec

    out, wr = warp_with_pins(rgb, pins, mode=mode)
    rec["pins"] = pins
    rec.update(wr)
    rec["verdict"] = "warped"
    rec["seconds"] = round(time.time() - t0, 2)
    return out, rec


def write_png(path, arr):
    os.makedirs(os.path.dirname(os.path.abspath(path)) or ".", exist_ok=True)
    Image.fromarray(np.clip(np.round(arr), 0, 255).astype(np.uint8)).save(path)


def _emit(path, obj):
    os.makedirs(os.path.dirname(os.path.abspath(path)) or ".", exist_ok=True)
    with open(path, "w") as fh:
        json.dump(obj, fh, indent=1, sort_keys=False)
        fh.write("\n")


# ------------------------------------------------------------------- the sweep

def held_walls(statuses=("held", "retry", "parked")):
    state = json.load(open(STATE))["walls"]
    return sorted((k, v) for k, v in state.items()
                  if v.get("status") in statuses and v.get("candidate"))


def sweep_held(mode="tps", outdir=None, statuses=("held", "retry", "parked")):
    """Every wall the manor loop is holding, warped into `meshwarp/`.

    It writes nothing into the store and moves nothing in the run state. What it
    produces is the evidence: how many held walls have a readable room and a
    matching aperture count, what each correction costs in stretch and reveal,
    and which ones are content misses that no warp can reach.
    """
    outdir = outdir or OUTDIR
    rows = []
    for key, st in held_walls(statuses):
        slug = key.replace("/", "-")
        t0 = time.time()
        try:
            out, rec = warp_wall(key, st["candidate"], mode=mode)
        except Exception as ex:                        # one bad wall is one row
            rows.append(dict(facing=key, verdict="error", why=str(ex)[:200],
                             seconds=round(time.time() - t0, 2)))
            continue
        rec["status"] = st.get("status")
        rec["hold_family"] = st.get("hold_family")
        if out is not None:
            write_png(os.path.join(outdir, slug + ".png"), out)
            rec["out_png"] = os.path.relpath(os.path.join(outdir, slug + ".png"), ROOT)
        _emit(os.path.join(outdir, slug + ".json"), rec)
        rows.append(_row(rec))
    _emit(os.path.join(outdir, "sweep.json"),
          dict(mode=mode, statuses=list(statuses), walls=len(rows), rows=rows))
    return rows


def _row(rec):
    b = rec.get("before") or {}
    ap = rec.get("apertures") or {}
    ls = rec.get("local_stretch") or {}
    return dict(
        facing=rec["facing"],
        status=rec.get("status"),
        hold=rec.get("hold_family") or b.get("hold_family"),
        d_focal=b.get("delta_focal_pct"),
        d_eye=b.get("delta_eye_pct"),
        pins=rec.get("pin_count") or len(rec.get("pins") or []),
        doors="%d/%d" % ((ap.get("doors") or {}).get("paired", 0),
                         (ap.get("doors") or {}).get("plan", 0)),
        windows="%d/%d" % ((ap.get("windows") or {}).get("paired", 0),
                           (ap.get("windows") or {}).get("plan", 0)),
        max_stretch=ls.get("max_local_stretch"),
        p999_stretch=ls.get("p999_local_stretch"),
        revealed_px=rec.get("revealed_px"),
        verdict=(rec.get("verdict") if rec.get("verdict") != "refused"
                 else "refused(%s)" % (rec.get("clause") or "?")),
        why=(rec.get("why") or "")[:96])


TABLE = ("facing", "status", "hold", "d_focal", "d_eye", "pins", "doors",
         "windows", "max_stretch", "p999_stretch", "revealed_px", "verdict")


def print_table(rows, stream=sys.stdout):
    cols = list(TABLE)
    wide = {c: max(len(c), *(len(_cell(r.get(c))) for r in rows)) if rows else len(c)
            for c in cols}
    stream.write("  ".join(c.ljust(wide[c]) for c in cols) + "\n")
    stream.write("  ".join("-" * wide[c] for c in cols) + "\n")
    for r in rows:
        stream.write("  ".join(_cell(r.get(c)).ljust(wide[c]) for c in cols) + "\n")
    for r in rows:
        if r.get("verdict", "").startswith("refused") or r.get("verdict") == "error":
            stream.write("  %s: %s\n" % (r["facing"], r.get("why")))


def _cell(v):
    if v is None:
        return "-"
    if isinstance(v, float):
        return "%.2f" % v
    return str(v)


# --------------------------------------------------------------------- the CLI

def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--facing", help="loc/F, e.g. library/S")
    ap.add_argument("--candidate", help="the painted frame to warp")
    ap.add_argument("--out", help="where the warped png goes")
    ap.add_argument("--json", dest="json_out", help="where the record goes")
    ap.add_argument("--warp", dest="mls", default="tps",
                    choices=("tps", "similarity", "rigid", "affine"),
                    help="tps is the minimal-bending interpolant and the default; "
                         "the three moving-least-squares modes are kept for "
                         "comparison and for a wall whose pins are few")
    ap.add_argument("--plan", default=None)
    ap.add_argument("--sweep-held", action="store_true")
    ap.add_argument("--statuses", default="held,retry,parked")
    ap.add_argument("--outdir", default=None)
    a = ap.parse_args(argv)

    if a.sweep_held:
        rows = sweep_held(mode=a.mls, outdir=a.outdir,
                          statuses=tuple(s for s in a.statuses.split(",") if s))
        print_table(rows)
        n = sum(1 for r in rows if r.get("verdict") == "warped")
        print("\n%d of %d held walls warped; %d refused."
              % (n, len(rows), len(rows) - n))
        return 0

    if not a.facing or not a.candidate:
        ap.error("--facing and --candidate are required without --sweep-held")
    out, rec = warp_wall(a.facing, a.candidate, mode=a.mls, plan_path=a.plan)
    if a.json_out:
        _emit(a.json_out, rec)
    if out is None:
        print("refused(%s): %s" % (rec.get("clause"), rec.get("why")))
        return 1
    if a.out:
        write_png(a.out, out)
    print_table([_row(rec)])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
