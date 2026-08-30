#!/usr/bin/env python3
"""Row 43 — the aperture is the INSIDE EDGE of its frame, traced off the paint.

    python3 design/plan-draft/measured/aperture_trace.py \
        --image backdrops/noodle_bar/E.png --rect 666,340,871,774 \
        --overlay design/batches/aperture-trace/noodle_bar-E.png

    python3 design/plan-draft/measured/aperture_trace.py --store

WHY THIS EXISTS. `door_measure.py` measures the VOID — the maximally stable
dark run in the column profile — and that is the right evidence and the wrong
answer. [HUMAN, 2026-08-29, verbatim] "What I want is INSIDE EDGE of door
corners detection, then geometry lines connecting all 4 corners. Not all image
gen is going to make a perfect rectangle." With a frame to prove it: the
detected corner (blue) sat inside the dark void some 55 px left of the frame's
actual inside corner (pink). A void's dark run stops where the paint stops
being black, which on a door with any reveal at all is short of the jamb; the
aperture the renderer must clip to, the leaf sprite must fit and the warp must
pin is the jamb's inner edge where it meets the head and the threshold.

THE RULE THIS FILE OBEYS, and it is the Captain's own, verbatim: "use the
rectangle detection to identify the approximate door thresholds for a following
tracing step, where the inside edge of the door is then traced and is allowed to
veer off of the path of the detected rectangle as long as it returns and
produces a closed loop." So the rectangle is demoted to a PRIOR. Its perimeter
is sampled into N points; at each point the picture is read along the outward
normal within +/- a band, and the evidence looked for is the void->frame step:
dark on the inside, lit on the outside, preferred nearest the prior. One cyclic
dynamic-programming pass over the N samples, with a cost on how far the offset
moves between neighbours, chooses all N offsets at once. The loop is closed BY
CONSTRUCTION — the offset at the last sample pays the same smoothness cost
against the first — so "veer off and return" is not a hope about the output, it
is the shape of the search. A straight-headed door reproduces its prior; a
half-round head is followed round because the arc is where the evidence is and
the smoothness cost of climbing to it is paid back over forty samples.

WHY DYNAMIC PROGRAMMING AND NOT A SNAKE. [HUMAN, verbatim] "these need to be
pretty algorithmic and quick whatever it looks like." An active contour is
iterative, has a step size, and stops where you tell it to; this is one pass
with no learning rate, the same answer every time on the same pixels, and it
runs in well under a tenth of a second on a 1536x1024 wall. The smoothness
term is L1, so its min-convolution is two prefix scans rather than a D x D
search, which is what keeps a 121-offset band cheap.

WHAT THIS FILE DOES NOT DECIDE. It is not wired into promotion, the warp or the
renderer, by ruling, until its numbers are read. It does not know the plan, it
does not choose which opening is which, and it refuses nothing: it takes a
rectangle it is given and returns the loop it found with the confidence at every
sample, so that a caller can see a bad trace rather than inherit it.

LIMITS, SAID PLAINLY. The band is the whole search: a head that rises further
above its prior than `band` cannot be reached, so a half-round head needs a band
at least its own radius (a 205 px door wants ~110). The prior must overlap the
true aperture — a prior more than a band away is a prior for something else. And
the inside/outside cue is luminance: an aperture whose beyond is BRIGHTER than
its frame (a window, a lit doorway) needs `inside_dark=False`, which turns the
same arithmetic round exactly as `window_measure.py` turns `door_measure`'s.
"""
import argparse
import json
import os
import time

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))

#: How many points the prior's perimeter is sampled into. 256 puts a sample
#: every ~5 px on a 205 x 434 door, which is finer than the paint's own edge
#: and coarse enough that the whole pass is one small matrix.
N_SAMPLES = 256

#: The search band, half-width in px, either side of the prior along the
#: outward normal. 60 covers every reveal measured in this store; an arched
#: head needs its own radius, and the caller passes it.
BAND = 60

#: How far either side of a candidate offset the inside and outside luminances
#: are taken, in px. Below about 4 the step is read on the paint's own
#: antialiasing; above about 10 a jamb narrower than the probe is straddled and
#: the step it carries is halved.
PROBE = 6

#: Samples taken along the tangent at each point and averaged, so that one
#: cracked pixel of plaster does not carry a sample. Deliberately short: it is
#: a smoother of noise, not of geometry, and near a corner it straddles one.
TANGENT_TAPS = 5

#: THE THREE COSTS, and every one of them is in units of the wall's own
#: void-to-frame contrast, so that a dim wall and a bright one are scored alike.
#:
#: `W_EDGE`   what a full-contrast step at a sample is worth.
#: `W_PRIOR`  what being a whole band away from the prior costs. This is the
#:            "nearest the prior" in the ruling: two equally good steps in the
#:            band — the void's own edge and the frame's outer arris — are
#:            separated by which is nearer the rectangle that was measured.
#: `W_DARK`   what it costs for the INSIDE of the step not to be the void. It
#:            is what stops the loop settling on the frame's OUTER edge, where
#:            the step is just as strong but the inside is stone.
#: `W_SMOOTH` per px of offset moved between neighbouring samples. At 0.05 a
#:            half-round head's climb of 2r costs about ten times what one
#:            sample's evidence is worth and is paid for by the forty samples
#:            that then sit on the arc; a lone sample cannot buy an excursion.
W_EDGE = 1.0
W_PRIOR = 0.25
W_DARK = 0.8
W_SMOOTH = 0.05

#: A head is called arched when it stands this far off the chord between its own
#: two ends — as a fraction of the opening's width, with a floor in px so that a
#: narrow door is not called arched by two pixels of paint. A true half-round
#: head scores 0.5.
ARCH_RATIO = 0.08
ARCH_MIN_PX = 4.0

#: The turning window for finding corners, as a fraction of N. The angle at a
#: sample is measured between the chord back this far and the chord forward this
#: far, so a corner is a corner at the scale of the side and not of one pixel.
TURN_WIN_FRAC = 1.0 / 32.0

#: How straight a side has to be, in px of RMS residual about its own fitted
#: line, for its corner to be SNAPPED to the intersection of the two sides
#: rather than left on the traced sample. A snapped corner is the point the
#: ruling names — "where the jamb's inner edge meets head and sill" — which is
#: a point neither side has a sample exactly on.
SIDE_STRAIGHT_RMS = 2.5

#: And how round a side has to be, in the same units, for its corner to be taken
#: as the crossing of the neighbour's line with the fitted ARC. Looser than the
#: straightness floor because an arc is fitted through paint that is genuinely
#: curved and the grazing samples at its own springing sit worst.
ARC_FIT_RMS = 4.0


# ------------------------------------------------------- the prior's perimeter

def _perimeter(rect, n):
    """n points around the rectangle, each with its outward normal and side.

    Spaced uniformly by arc length from the top-left corner, at the midpoint of
    each step, so that no sample lands exactly on a corner — a sample on a
    corner has two normals and neither of them is right.
    """
    x0, y0, x1, y1 = [float(v) for v in rect]
    w, h = x1 - x0, y1 - y0
    sides = [
        ((x0, y0), (1.0, 0.0), w, (0.0, -1.0), "top"),
        ((x1, y0), (0.0, 1.0), h, (1.0, 0.0), "right"),
        ((x1, y1), (-1.0, 0.0), w, (0.0, 1.0), "bottom"),
        ((x0, y1), (0.0, -1.0), h, (-1.0, 0.0), "left"),
    ]
    per = 2.0 * (w + h)
    starts = np.cumsum([0.0] + [s[2] for s in sides])
    pts = np.empty((n, 2))
    nrm = np.empty((n, 2))
    tan = np.empty((n, 2))
    side = np.empty(n, dtype=np.int64)
    s = (np.arange(n) + 0.5) * per / n
    for i in range(n):
        k = int(np.searchsorted(starts, s[i], side="right") - 1)
        k = min(max(k, 0), 3)
        (px, py), (tx, ty), _, (nx, ny), _ = sides[k]
        u = s[i] - starts[k]
        pts[i] = (px + tx * u, py + ty * u)
        nrm[i] = (nx, ny)
        tan[i] = (tx, ty)
        side[i] = k
    return pts, nrm, tan, side


def _bilinear(L, X, Y):
    """L sampled at float coordinates, clamped at the border."""
    H, W = L.shape
    X = np.clip(X, 0.0, W - 1.000001)
    Y = np.clip(Y, 0.0, H - 1.000001)
    x0 = np.floor(X).astype(np.int64)
    y0 = np.floor(Y).astype(np.int64)
    fx = X - x0
    fy = Y - y0
    x1 = np.minimum(x0 + 1, W - 1)
    y1 = np.minimum(y0 + 1, H - 1)
    return ((L[y0, x0] * (1 - fx) + L[y0, x1] * fx) * (1 - fy) +
            (L[y1, x0] * (1 - fx) + L[y1, x1] * fx) * fy)


def _levels(L, rect, band):
    """(void level, frame level, contrast): what the inside and outside are.

    The void is the median of the prior's own middle; the frame is the median of
    the ring just outside it. Both are medians so that one bright fitting inside
    the opening or one dark stain on the reveal moves neither.
    """
    x0, y0, x1, y1 = [int(round(v)) for v in rect]
    H, W = L.shape
    ix0 = max(0, x0 + int(0.2 * (x1 - x0)))
    ix1 = min(W, x1 - int(0.2 * (x1 - x0)))
    iy0 = max(0, y0 + int(0.2 * (y1 - y0)))
    iy1 = min(H, y1 - int(0.2 * (y1 - y0)))
    void = float(np.median(L[iy0:iy1, ix0:ix1])) if (iy1 > iy0 and ix1 > ix0) else 0.0
    g = max(8, int(round(0.35 * band)))
    rx0, rx1 = max(0, x0 - g), min(W, x1 + g)
    ry0, ry1 = max(0, y0 - g), min(H, y1 + g)
    ring = []
    if rx1 > rx0 and ry1 > ry0:
        blk = L[ry0:ry1, rx0:rx1]
        mask = np.ones(blk.shape, bool)
        mask[max(0, y0 - ry0):max(0, y1 - ry0), max(0, x0 - rx0):max(0, x1 - rx0)] = False
        if mask.any():
            ring = blk[mask]
    frame = float(np.median(ring)) if len(ring) else void + 32.0
    return void, frame, max(8.0, abs(frame - void))


def _evidence(L, pts, nrm, tan, band, probe, taps, void, contrast, inside_dark):
    """step[i, d] and the inside-is-wrong penalty, for every sample and offset.

    `step` is (outside mean - inside mean) across the candidate edge, in units
    of the wall's void-to-frame contrast, signed so that positive is always
    "the aperture's own kind of step"; `wrong` says how far the inside of it is
    from being the void.
    """
    m = band + probe
    off = np.arange(-m, m + 1, dtype=np.float64)
    ta = (np.arange(taps, dtype=np.float64) - (taps - 1) / 2.0)
    X = (pts[:, None, None, 0] + nrm[:, None, None, 0] * off[None, :, None]
         + tan[:, None, None, 0] * ta[None, None, :])
    Y = (pts[:, None, None, 1] + nrm[:, None, None, 1] * off[None, :, None]
         + tan[:, None, None, 1] * ta[None, None, :])
    prof = _bilinear(L, X, Y).mean(axis=2)
    c = np.concatenate([np.zeros((prof.shape[0], 1)), np.cumsum(prof, axis=1)], axis=1)
    j = np.arange(2 * band + 1) + probe
    inner = (c[:, j] - c[:, j - probe]) / probe
    outer = (c[:, j + probe + 1] - c[:, j + 1]) / probe
    if inside_dark:
        step = (outer - inner) / contrast
        wrong = (inner - void) / contrast
    else:
        step = (inner - outer) / contrast
        wrong = (void - inner) / contrast
    return step, inner, wrong


def _min_conv_l1(prev, lam):
    """min over e of (prev[e] + lam*|d - e|), with the argmin, in two scans.

    The L1 distance transform. Forward: lam*d + running-min of (prev - lam*e);
    backward the mirror. Ties resolve to one side by rule and not by accident,
    so the same pixels give the same loop every time.
    """
    D = prev.shape[-1]
    d = np.arange(D, dtype=np.float64)
    idx = np.arange(D)
    a = prev - lam * d
    ca = np.minimum.accumulate(a, axis=-1)
    fi = np.maximum.accumulate(np.where(a <= ca, idx, -1), axis=-1)
    fwd = ca + lam * d
    b = (prev + lam * d)[..., ::-1]
    cb = np.minimum.accumulate(b, axis=-1)
    bi = np.maximum.accumulate(np.where(b <= cb, idx, -1), axis=-1)
    bwd = cb[..., ::-1] - lam * d
    bidx = (D - 1) - bi[..., ::-1]
    take_f = fwd <= bwd
    return np.where(take_f, fwd, bwd), np.where(take_f, fi, bidx)


def _cyclic_dp(data, lam, pin, n_rounds=4):
    """The closed loop: one DP round the ring, with sample 0's offset pinned.

    A cycle has no first node, so the usual trick is to fix one and pay for it.
    Here the fixed node is CHOSEN — the sample whose evidence is least
    ambiguous — and then the answer's own value at that node is fed back in and
    the pass repeated until it stops moving (at most `n_rounds`). Every round is
    a strictly evaluated closed loop, and the cheapest of them is returned, so
    the output is a closed loop whatever the iteration does.
    """
    n, D = data.shape
    best = None
    seen = set()
    for _ in range(n_rounds):
        if pin in seen:
            break
        seen.add(pin)
        dp = np.full(D, np.inf)
        dp[pin] = data[0, pin]
        back = np.zeros((n, D), np.int64)
        for i in range(1, n):
            m, src = _min_conv_l1(dp, lam)
            dp = m + data[i]
            back[i] = src
        close = dp + lam * np.abs(np.arange(D) - pin)
        end = int(np.argmin(close))
        total = float(close[end])
        path = np.zeros(n, np.int64)
        path[n - 1] = end
        for i in range(n - 1, 0, -1):
            path[i - 1] = back[i][path[i]]
        if best is None or total < best[0] - 1e-9:
            best = (total, path.copy())
        loop_pin = int(path[0])
        if loop_pin == pin:
            break
        pin = loop_pin
    return best[1], best[0]


# ------------------------------------------------------------ corners and head

def _turning(poly, win):
    """The exterior angle at each sample, measured over +/- `win` samples."""
    n = len(poly)
    a = poly[np.arange(n) - win]
    b = poly[(np.arange(n) + win) % n]
    u = poly - a
    v = b - poly
    cross = u[:, 0] * v[:, 1] - u[:, 1] * v[:, 0]
    dot = u[:, 0] * v[:, 0] + u[:, 1] * v[:, 1]
    return np.abs(np.arctan2(cross, dot))


def _fit_line(P):
    """Total-least-squares line through P: (point, unit direction, rms)."""
    c = P.mean(axis=0)
    Q = P - c
    _, _, vt = np.linalg.svd(Q, full_matrices=False)
    d = vt[0]
    nrm = np.array([-d[1], d[0]])
    rms = float(np.sqrt(np.mean((Q @ nrm) ** 2)))
    return c, d, rms


def _intersect(c1, d1, c2, d2):
    A = np.array([[d1[0], -d2[0]], [d1[1], -d2[1]]])
    det = A[0, 0] * A[1, 1] - A[0, 1] * A[1, 0]
    if abs(det) < 1e-6:
        return None
    t = np.linalg.solve(A, c2 - c1)
    return c1 + t[0] * d1


def _fit_side(poly, idx):
    """The line of one side of the loop, fitted on its own middle.

    Trimmed a fifth at each end because that is exactly where a side is NOT
    itself: a prior offset from the true aperture pushes the ends of each side
    past the corner and onto the neighbour's wall, and an arched head bends its
    jambs' top ends round. One rejection pass then drops what the trim missed,
    so the RMS reported is the RMS of the side and not of its corners.
    """
    if len(idx) < 8:
        return None
    t = max(1, int(0.2 * len(idx)))
    sel = idx[t:len(idx) - t]
    c, d, rms = _fit_line(poly[sel])
    nv = np.array([-d[1], d[0]])
    keep = np.abs((poly[sel] - c) @ nv) <= max(2.0, 2.5 * rms)
    if int(keep.sum()) >= 6:
        c, d, rms = _fit_line(poly[sel[keep]])
    return c, d, rms, idx


def _departure(poly, fit, from_end, tol=2.0):
    """Where the loop leaves its own side's straight line — the springing.

    Walked from the far end of the side towards the junction, the corner is the
    LAST sample still on the line. On a straight-headed door this is the side's
    last sample and the intersection is used instead; on a half-round head it is
    the point where the jamb stops being a jamb, which is the corner the ruling
    names when it says a head that is not straight is "corners plus sampled
    points along the head".
    """
    c, d, _, idx = fit
    nv = np.array([-d[1], d[0]])
    on = np.abs((poly[idx] - c) @ nv) <= tol
    # START AT THE SIDE'S MIDDLE, which is the part of it that is definitely
    # itself, and walk towards the junction. Starting at the far END instead
    # would stop at the first sample the OTHER corner had already pulled off
    # the line and report that corner's neighbourhood as this one.
    seq = np.arange(len(idx)) if from_end else np.arange(len(idx))[::-1]
    start = int(np.flatnonzero(seq == len(idx) // 2)[0])
    last = seq[start]
    for p in seq[start:]:
        if not on[p]:
            break
        last = p
    return poly[idx[last]], int(idx[last])


def _fit_circle(P):
    """Kasa's algebraic circle through P: (centre, radius, rms residual).

    One linear least squares, no iteration — the arithmetic a half-round head
    deserves and the reason `head_kind: arched` can be answered with a radius
    rather than only with a verdict.
    """
    x, y = P[:, 0], P[:, 1]
    A = np.column_stack([x, y, np.ones(len(P))])
    sol, *_ = np.linalg.lstsq(A, x * x + y * y, rcond=None)
    ctr = np.array([sol[0] / 2.0, sol[1] / 2.0])
    r = float(np.sqrt(max(sol[2] + ctr @ ctr, 0.0)))
    rms = float(np.sqrt(np.mean((np.hypot(x - ctr[0], y - ctr[1]) - r) ** 2)))
    return ctr, r, rms


def _line_circle(c, d, ctr, r, near):
    """Where a straight side meets an arc — or, at a tangency, the touch point.

    A half-round head SPRINGS from its jamb, so the jamb's line is tangent to
    the arc and the two roots coincide; asking for an intersection there is
    numerically a coin toss, and the foot of the perpendicular from the arc's
    centre is the same point and is always defined. That foot is the springing.
    """
    t = float((ctr - c) @ d)
    foot = c + t * d
    h2 = r * r - float((ctr - foot) @ (ctr - foot))
    if h2 <= 1.0:
        return foot
    h = np.sqrt(h2)
    a, b = foot + h * d, foot - h * d
    return a if np.linalg.norm(a - near) <= np.linalg.norm(b - near) else b


def _corners(poly, side, rect, win):
    """The four corners, each where its two sides meet.

    The loop is cut into four by the prior's own sides — the parameterisation is
    the prior's, so that cut is free and does not depend on finding the turns —
    and each side gets a line. Where both of a corner's sides are straight the
    corner is their INTERSECTION, which is the point the ruling names ("where
    the jamb's inner edge meets head and sill") and which no sample sits on.
    Where one side curves, the corner is where the straight one departs from its
    own line, which on a half-round head is the springing. Where neither is
    straight, the sharpest turn nearby is the honest answer and is reported as
    unsnapped.
    """
    n = len(poly)
    ang = _turning(poly, win)
    fits = [_fit_side(poly, np.flatnonzero(side == k)) for k in range(4)]
    arcs = {}

    def arc_for(k):
        """The circle through side k AND whatever its neighbours curve into.

        A half-round head does not stop at the prior's top side: the prior is
        the void's bounding box, so the arc's two flanks run down the TOP OF
        THE JAMBS' sides. Fitting the circle on the head alone leaves a shallow
        cap and a radius that wobbles; taking with it every neighbouring sample
        that has left its own side's straight line spans springing to springing
        and the fit is conditioned.
        """
        if k in arcs:
            return arcs[k]
        idx = [int(i) for i in np.flatnonzero(side == k)]
        t = max(1, int(0.1 * len(idx)))
        sel = set(idx[t:len(idx) - t])
        for m in ((k - 1) % 4, (k + 1) % 4):
            f = fits[m]
            if f is None:
                continue
            c, d, _rms, midx = f
            nv = np.array([-d[1], d[0]])
            off = np.abs((poly[midx] - c) @ nv)
            sel |= {int(i) for i, o in zip(midx, off) if o > 2.0}
        pick = np.array(sorted(sel))
        arcs[k] = _fit_circle(poly[pick]) if len(pick) >= 8 else None
        return arcs[k]

    # junction j lies between side j and side j+1: 0=TR, 1=BR, 2=BL, 3=TL
    order = [3, 0, 1, 2]                       # TL, TR, BR, BL
    out = []
    for j in order:
        a, b = fits[j], fits[(j + 1) % 4]
        pt, snapped = None, False
        if a is not None and b is not None:
            sa, sb = a[2] < SIDE_STRAIGHT_RMS, b[2] < SIDE_STRAIGHT_RMS
            if sa and sb:
                pt = _intersect(a[0], a[1], b[0], b[1])
                snapped = pt is not None
            elif sa or sb:
                straight, from_end = (a, True) if sa else (b, False)
                fit_c = arc_for(j if not sa else (j + 1) % 4)
                near = poly[(straight[3][-1] if from_end else straight[3][0])]
                if fit_c is not None and fit_c[2] < ARC_FIT_RMS:
                    pt = _line_circle(straight[0], straight[1], fit_c[0], fit_c[1], near)
                    snapped = True
                else:
                    pt, _i = _departure(poly, straight, from_end=from_end)
        if pt is None:
            idx = np.flatnonzero(side == j)
            near = np.concatenate([idx[-win:], np.flatnonzero(side == (j + 1) % 4)[:win]]) \
                if len(idx) else np.arange(min(win, n))
            pt = poly[int(near[int(np.argmax(ang[near]))])]
        pt = np.asarray(pt, float)
        s = int(np.argmin(np.linalg.norm(poly - pt, axis=1)))
        out.append((pt, s, snapped))
    return out, ang


def _head_verdict(poly, side, rect):
    """straight or arched, off how far the head stands from its own chord."""
    idx = np.flatnonzero(side == 0)
    if len(idx) < 5:
        return "straight", 0.0, 0.0, None
    P = poly[idx]
    a, b = P[0], P[-1]
    v = b - a
    ln = float(np.linalg.norm(v))
    if ln < 1e-6:
        return "straight", 0.0, 0.0, None
    nvec = np.array([-v[1], v[0]]) / ln
    dev = (P - a) @ nvec
    sag = float(np.max(np.abs(dev)))
    width = max(1.0, float(rect[2] - rect[0]))
    ratio = sag / width
    kind = "arched" if (sag >= ARCH_MIN_PX and ratio >= ARCH_RATIO) else "straight"
    arc = None
    if kind == "arched" and len(P) >= 8:
        t = max(1, int(0.15 * len(P)))
        ctr, rad, rms = _fit_circle(P[t:len(P) - t])
        arc = {"centre_px": [round(float(ctr[0]), 2), round(float(ctr[1]), 2)],
               "radius_px": round(rad, 2), "rms_px": round(rms, 2)}
    return kind, sag, ratio, arc


# --------------------------------------------------------------------- the pass

def trace_aperture(L, rect, band=BAND, n_samples=N_SAMPLES, probe=PROBE,
                   inside_dark=True, w_edge=W_EDGE, w_prior=W_PRIOR,
                   w_dark=W_DARK, w_smooth=W_SMOOTH):
    """Trace the inside edge of the aperture whose prior rectangle is `rect`.

    `L` is a 2-D luminance array, `rect` is `(x0, y0, x1, y1)` in image px.
    Returns a dict: the closed `polygon` (n_samples points), the per-sample
    `confidence` and `offsets`, the four named `corners`, the `head_kind`
    verdict, and the evidence behind each of them.
    """
    L = np.asarray(L, dtype=np.float64)
    rect = tuple(float(v) for v in rect)
    band = int(band)
    pts, nrm, tan, side = _perimeter(rect, n_samples)
    void, frame, contrast = _levels(L, rect, band)
    step, inner, wrong = _evidence(L, pts, nrm, tan, band, probe, TANGENT_TAPS,
                                   void, contrast, inside_dark)
    d_off = np.arange(-band, band + 1, dtype=np.float64)
    edge = np.clip(step, -1.5, 1.5)
    dark = np.clip(wrong - 0.5, 0.0, 2.0)
    prior = np.abs(d_off)[None, :] / float(band)
    data = -w_edge * edge + w_dark * dark + w_prior * prior

    bestd = np.argmin(data, axis=1)
    far = data.copy()
    for i in range(n_samples):
        lo, hi = max(0, bestd[i] - 8), min(data.shape[1], bestd[i] + 9)
        far[i, lo:hi] = np.inf
    margin = np.min(far, axis=1) - data[np.arange(n_samples), bestd]
    pin = int(np.argmax(np.where(np.isfinite(margin), margin, -np.inf)))
    path, cost = _cyclic_dp(np.roll(data, -pin, axis=0), w_smooth, int(bestd[pin]))
    path = np.roll(path, pin)

    offs = d_off[path]
    poly = pts + nrm * offs[:, None]
    chosen_step = step[np.arange(n_samples), path]
    conf = np.clip(chosen_step, 0.0, 1.0)
    named, ang = _corners(poly, side, rect,
                          max(3, int(round(TURN_WIN_FRAC * n_samples))))
    head_kind, sag, ratio, arc = _head_verdict(poly, side, rect)
    corner_pts = [c[0] for c in named] if named else []
    prior_ref = [[rect[0], rect[1]], [rect[2], rect[1]],
                 [rect[2], rect[3]], [rect[0], rect[3]]]
    cdev = ([float(np.linalg.norm(np.asarray(c) - np.asarray(p)))
             for c, p in zip(corner_pts, prior_ref)] if corner_pts else [])
    return {
        "polygon": [[round(float(x), 2), round(float(y), 2)] for x, y in poly],
        "confidence": [round(float(c), 4) for c in conf],
        "offsets": [int(o) for o in offs],
        "side": [int(s) for s in side],
        "corners": [[round(float(c[0]), 2), round(float(c[1]), 2)] for c in corner_pts],
        "corner_samples": [int(c[1]) for c in named] if named else [],
        "corner_snapped": [bool(c[2]) for c in named] if named else [],
        "corner_dev_from_prior_px": [round(v, 2) for v in cdev],
        "head_kind": head_kind,
        "head_sagitta_px": round(float(sag), 2),
        "head_sagitta_ratio": round(float(ratio), 4),
        "head_arc": arc,
        "max_offset_px": int(np.max(np.abs(offs))),
        "mean_confidence": round(float(np.mean(conf)), 4),
        "min_confidence": round(float(np.min(conf)), 4),
        "void_l": round(void, 2), "frame_l": round(frame, 2),
        "contrast_l": round(contrast, 2),
        "cost": round(float(cost), 3),
        "band_px": band, "n_samples": n_samples, "pinned_sample": pin,
        "method": ("the prior's perimeter sampled into %d points, each searched "
                   "+/-%d px along its outward normal for the strongest "
                   "%s-inside step, chosen by one cyclic L1 dynamic-programming "
                   "pass so the loop closes by construction"
                   % (n_samples, band, "dark" if inside_dark else "light")),
    }


# ------------------------------------------------------------------- the CLI

def _load_luma(path):
    from PIL import Image
    return np.asarray(Image.open(path).convert("RGB"), dtype=np.float64) @ \
        np.array([0.2126, 0.7152, 0.0722])


def overlay(png_in, png_out, rect, res, thick=1):
    """The loop drawn on the picture, so a person can say whether it is right."""
    from PIL import Image
    im = np.asarray(Image.open(png_in).convert("RGB")).astype(np.uint8).copy()
    H, W, _ = im.shape

    def dot(x, y, rgb, r=1):
        xi, yi = int(round(x)), int(round(y))
        im[max(0, yi - r):min(H, yi + r + 1), max(0, xi - r):min(W, xi + r + 1)] = rgb

    x0, y0, x1, y1 = [int(round(v)) for v in rect]
    for x in range(max(0, x0), min(W, x1 + 1)):
        dot(x, y0, (60, 110, 255), 0)
        dot(x, y1, (60, 110, 255), 0)
    for y in range(max(0, y0), min(H, y1 + 1)):
        dot(x0, y, (60, 110, 255), 0)
        dot(x1, y, (60, 110, 255), 0)
    P = res["polygon"]
    for k in range(len(P)):
        ax, ay = P[k]
        bx, by = P[(k + 1) % len(P)]
        n = int(max(abs(bx - ax), abs(by - ay))) + 1
        for t in range(n + 1):
            dot(ax + (bx - ax) * t / n, ay + (by - ay) * t / n, (0, 255, 90), thick)
    for c in res["corners"]:
        dot(c[0], c[1], (255, 40, 200), 3)
    Image.fromarray(im).save(png_out)


def _store_walls():
    """Every promoted wall in the store that carries a door opening."""
    import glob
    out = []
    for meta in sorted(glob.glob(os.path.join(ROOT, "backdrops", "*", "[NSEW].meta.json"))):
        try:
            d = json.load(open(meta))
        except Exception:
            continue
        png = meta.replace(".meta.json", ".png")
        if not os.path.exists(png):
            continue
        for op in d.get("openings") or []:
            if op.get("kind") != "door":
                continue
            room = os.path.basename(os.path.dirname(meta))
            facing = os.path.basename(meta).split(".")[0]
            out.append((room, facing, png, op,
                        (op["x"], op["y"], op["x"] + op["w"], op["y"] + op["h"])))
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--image", default="")
    ap.add_argument("--rect", default="", help="x0,y0,x1,y1 in image px")
    ap.add_argument("--band", type=int, default=BAND)
    ap.add_argument("--samples", type=int, default=N_SAMPLES)
    ap.add_argument("--bright-inside", action="store_true",
                    help="the beyond is LIGHTER than the frame (a window)")
    ap.add_argument("--overlay", default="")
    ap.add_argument("--json", default="")
    ap.add_argument("--store", action="store_true",
                    help="every promoted door wall, as a table")
    ap.add_argument("--overlay-dir", default="")
    a = ap.parse_args()

    if a.store:
        walls = _store_walls()
        print("%-22s %-2s %-6s %-20s %-21s %6s %6s %5s %8s %5s"
              % ("room", "F", "id", "prior rect", "traced TL / TR",
                 "maxdev", "meandev", "conf", "head", "ms"))
        rows = []
        for room, facing, png, op, rect in walls:
            L = _load_luma(png)
            t = time.time()
            r = trace_aperture(L, rect, band=a.band, n_samples=a.samples)
            ms = (time.time() - t) * 1000.0
            c = r["corners"]
            dev = r["corner_dev_from_prior_px"]
            rows.append((room, facing, ms, r))
            print("%-22s %-2s %-6s %-20s %-21s %6.1f %6.1f %5.2f %8s %5.0f"
                  % (room, facing, op.get("id", "?"),
                     "%d,%d,%d,%d" % tuple(int(v) for v in rect),
                     ("%.0f,%.0f %.0f,%.0f" % (c[0][0], c[0][1], c[1][0], c[1][1])
                      if c else "-"),
                     max(dev) if dev else 0.0,
                     sum(dev) / len(dev) if dev else 0.0,
                     r["mean_confidence"], r["head_kind"], ms))
            if a.overlay_dir:
                os.makedirs(a.overlay_dir, exist_ok=True)
                overlay(png, os.path.join(a.overlay_dir,
                                          "%s-%s-%s.png" % (room, facing, op.get("id", "?"))),
                        rect, r)
        if rows:
            print("\n%d door walls, %.0f ms median, %.0f ms worst"
                  % (len(rows), float(np.median([x[2] for x in rows])),
                     max(x[2] for x in rows)))
        return

    if not a.image or not a.rect:
        raise SystemExit("aperture_trace refused: give --image and --rect, or --store")
    rect = [float(v) for v in a.rect.split(",")]
    L = _load_luma(a.image)
    t = time.time()
    res = trace_aperture(L, rect, band=a.band, n_samples=a.samples,
                         inside_dark=not a.bright_inside)
    ms = (time.time() - t) * 1000.0
    print("%s  %s" % (a.image, res["method"]))
    print("  head %s (sagitta %.1f px, %.3f of width)"
          % (res["head_kind"], res["head_sagitta_px"], res["head_sagitta_ratio"]))
    for name, c, d, s in zip(("TL", "TR", "BR", "BL"), res["corners"],
                             res["corner_dev_from_prior_px"], res["corner_snapped"]):
        print("  %s %8.1f,%-8.1f  %5.1f px off the prior%s"
              % (name, c[0], c[1], d, "  (snapped)" if s else ""))
    print("  confidence mean %.2f min %.2f, max offset %d px, %.0f ms"
          % (res["mean_confidence"], res["min_confidence"], res["max_offset_px"], ms))
    if a.overlay:
        os.makedirs(os.path.dirname(os.path.abspath(a.overlay)), exist_ok=True)
        overlay(a.image, a.overlay, rect, res)
        print("  overlay -> %s" % a.overlay)
    if a.json:
        with open(a.json, "w") as fh:
            json.dump(res, fh, indent=2)
            fh.write("\n")


if __name__ == "__main__":
    main()
