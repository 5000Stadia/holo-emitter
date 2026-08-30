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

# ---------------------------------------------------- THE TRUST REGION (rule 2)
#
# Everything above is in units of the wall's OWN contrast, and that is exactly
# how a dark panelled door goes wrong: divide a 20-level step by a 20-level
# contrast and it looks as convincing as a 90-level step on a lit wall, so the
# loop will happily abandon the jamb for a moulding eighty px away that scores a
# hair better. The band is a TRUST REGION around the prior, and how far it may
# be trusted is a question about ABSOLUTE luminance, which these constants are
# in. See `_trust_region` for the function they make.

#: The absolute void-to-frame step, in levels of 255, below which a wall is not
#: to be trusted at all (the band collapses to `BAND_MIN`) and at or above which
#: it is trusted completely (the band is whatever the caller asked for).
A_LOW = 12.0
A_FULL = 48.0

#: The band never shrinks below this: a couple of px of paint either side of the
#: prior is the least a trace can be allowed, or it is not a trace.
BAND_MIN = 4.0

#: How much `W_PRIOR` is multiplied by when the wall carries no absolute
#: contrast at all. At 8 a full-band excursion on a contrastless wall costs
#: twice what the strongest possible edge is worth, so it is never bought.
G_LOW = 8.0

#: THE PRIOR'S OWN GRIP, and this is the half of the rule the store taught.
#: `a_i` is the absolute step the PRIOR ITSELF stands on at sample i — the
#: strongest right-kind step within `PRIOR_NEAR` px of offset 0. Where the prior
#: already sits on real paint, leaving it must be paid for; where it sits on
#: nothing (the void's dark run stopping short of the jamb, which is the whole
#: reason this file exists) it is free to go and find the edge. That single
#: number is what separates `buttery_pantry/S`'s 50 px onto the real reveal —
#: the prior stands on 4.6 levels there, i.e. on nothing — from
#: `muniment_room/E`'s 33 px onto a moulding, where the prior stands on 27.
PRIOR_NEAR = 8
PRIOR_GRIP_LO = 8.0
PRIOR_GRIP_HI = 25.0
G_HOLD = 10.0

#: How far the inside of a step may be from the void, IN LEVELS, before that step
#: stops counting as evidence the prior stands on. In levels and not in units of
#: the wall's own contrast, and that is the whole point: a prior displaced clean
#: off the aperture sits on the wall/reveal arris, whose inside is the reveal —
#: a step every bit as strong as the aperture's, and not the aperture's. Scored
#: relatively, a bright reveal on a high-contrast wall slips under any ratio you
#: pick; scored in levels it is 88 away from the void and is not grip.
GRIP_WRONG_ABS = 18.0

# -------------------------------------------------- THE THRESHOLD IS GEOMETRY
#
# (rule 1) At the foot of a doorway the room beyond is LIT — its floor catches
# the same key light this room's does — so the "dark inside" cue inverts and the
# loop follows the far floor up into the opening instead of stopping at the
# sill. There is no paint at a threshold to trace: the bottom of an aperture in
# a wall is where that wall meets its floor, which every promoted wall already
# carries as `floor_line_y * image_h_px` and every candidate carries from the
# warp. So the bottom side is not traced at all; it is SET.

#: How much the smoothness term charges for the offset step at the two junctions
#: where the traced jambs meet the set threshold. Zero, and it must be: the
#: threshold's offset is geometry and the jamb's is evidence, and charging the
#: jamb for the difference would drag its foot off the paint.
LAM_AT_THRESHOLD = 0.0

# ------------------------------------------- CONFIDENCE THAT SEES IT (rule 3)
#
# The old confidence was the chosen step in units of the wall's own contrast,
# which is a number that cannot fall: normalise a wall's evidence by its own
# evidence and every wall is confident. The new one is in ABSOLUTE levels and
# is multiplied by how much of the loop's excursion the prior's own measurement
# did not license.

#: The absolute step, in levels, at which a sample's evidence is worth full
#: marks. Around 30: below it the paint is telling you less than a tenth of the
#: range and a moulding can outvote a jamb.
A_GOOD = 30.0

#: What a forbidden offset costs. A large finite number rather than an infinity,
#: so that the min-convolution's arithmetic never has to subtract one from
#: another and hand back a NaN.
BIG = 1e9

#: The unlicensed excursion, in px RMS, at which confidence has halved. Two
#: things about what is counted. First, an excursion is unlicensed in proportion
#: to the GRIP the prior had where the loop left it (`hold_i`), so following a
#: bad prior onto the real reveal costs nothing and wandering off good paint onto
#: a moulding costs everything. Second, it counts the excursion the loop MADE or
#: the one it WANTED — whichever is larger — because the trust region of rule 2
#: now holds the bad walls in place, and a confidence that only saw the realised
#: offset would report the restraint as success. What the evidence alone would
#: have chosen, over the whole requested band, is the honest measure of how
#: nearly this wall ran away.
EXC_REF = 14.0


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


def _prior_grip(step, wrong, band, contrast, near=PRIOR_NEAR):
    """`a_i`: the absolute step, in levels, that the PRIOR itself stands on.

    The strongest step within `near` px of offset 0 whose INSIDE is still the
    void. A sample whose prior stands on real paint has to pay to leave it; a
    sample whose prior stands on nothing does not. The void test is what keeps a
    prior displaced clean off the aperture from reading the wall/reveal arris
    beneath itself as a reason to stay.
    """
    d = np.arange(-band, band + 1)
    sel = np.abs(d) <= near
    ok = (wrong[:, sel] * contrast) <= GRIP_WRONG_ABS
    a = np.where(ok, step[:, sel] * contrast, -np.inf).max(axis=1)
    return np.clip(a, 0.0, None)


def _trust_region(band, w_prior, a_grip, a_ring):
    """THE FUNCTION, stated. (band_eff, per-sample w_prior, A, trust).

    `A`, the wall's absolute void-to-frame step in levels of 255, is
    `max(|frame - void|, p75 of a_i)`: the ring-and-centre medians, and the
    upper quartile of what the prior's own perimeter measures. The quartile is
    there because a prior can be plain wrong over a third of its perimeter
    without the wall being dim, and the median would then report a dim wall; the
    ring term is there because a prior displaced clean off the aperture measures
    nothing at all and the quartile would then report a dim wall.

        trust = clip((A - A_LOW) / (A_FULL - A_LOW), 0, 1) ** 2

    squared so that the middle of the range is treated as the doubtful thing it
    is. From it, two things:

        band_eff  = BAND_MIN + (band - BAND_MIN) * trust
        w_prior_i = W_PRIOR * (1 + G_LOW*(1 - trust) + G_HOLD*hold_i)
        hold_i    = clip((a_i - PRIOR_GRIP_LO) / (PRIOR_GRIP_HI - PRIOR_GRIP_LO), 0, 1)

    The first is a hard cutoff — an offset past `band_eff` is not on the menu.
    The second is the price of every offset that is, charged per px against the
    REQUESTED band so that the units do not move when the cutoff does.

    Worked: `muniment_room/E` has A = 33, so trust = 0.33 and the band closes
    from 60 px to 23; where it used to wander, a_i = 27, so hold = 1 and
    w_prior_i = 4.1, and 23 px of excursion costs 1.6 against a strongest
    possible edge worth 1.5. It cannot be bought. `buttery_pantry/S` has
    A = 46 (its ring says 23, its own perimeter says 46), so trust = 0.91 and
    the band stays open at 55 px; where it moves, a_i = 4.6, so hold = 0 and
    w_prior_i = 0.42, and the 50 px onto the real reveal costs 0.35. It is.
    """
    A = float(max(a_ring, np.percentile(a_grip, 75)))
    trust = float(np.clip((A - A_LOW) / (A_FULL - A_LOW), 0.0, 1.0)) ** 2
    band_eff = int(round(BAND_MIN + (band - BAND_MIN) * trust))
    band_eff = max(int(BAND_MIN), min(int(band), band_eff))
    hold = np.clip((a_grip - PRIOR_GRIP_LO) / (PRIOR_GRIP_HI - PRIOR_GRIP_LO), 0.0, 1.0)
    w = w_prior * (1.0 + G_LOW * (1.0 - trust) + G_HOLD * hold)
    return band_eff, w, A, trust, hold


def _cyclic_dp(data, lam, pin, n_rounds=4):
    """The closed loop: one DP round the ring, with sample 0's offset pinned.

    A cycle has no first node, so the usual trick is to fix one and pay for it.
    Here the fixed node is CHOSEN — the sample whose evidence is least
    ambiguous — and then the answer's own value at that node is fed back in and
    the pass repeated until it stops moving (at most `n_rounds`). Every round is
    a strictly evaluated closed loop, and the cheapest of them is returned, so
    the output is a closed loop whatever the iteration does.

    `lam` is per STEP, not per loop: `lam[i]` is charged between sample i-1 and
    sample i, and `lam[0]` is charged at the closure between the last sample and
    the first. That is what lets the two junctions where the traced jambs meet
    the SET threshold cost nothing, so a sill 30 px below the prior's bottom
    does not drag the jambs' feet 30 px sideways with it.
    """
    n, D = data.shape
    lam = np.broadcast_to(np.asarray(lam, float).reshape(-1), (n,))
    best = None
    seen = set()
    for _ in range(n_rounds):
        if pin in seen:
            break
        seen.add(pin)
        dp = np.full(D, BIG)
        dp[pin] = data[0, pin]
        back = np.zeros((n, D), np.int64)
        for i in range(1, n):
            m, src = _min_conv_l1(dp, lam[i])
            dp = m + data[i]
            back[i] = src
        close = dp + lam[0] * np.abs(np.arange(D) - pin)
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
    """straight or arched — and ARCHED HAS TO BE EARNED.

    A sagitta is not an arch. `closet_chamber/S` stood 60 px off its own chord
    and was called arched, and what it was standing on was a moulding: the head
    ran flat, jumped, ran flat again. So the verdict now asks the four things
    that separate a half-round head from an excursion, and every one of them is
    a statement about the SHAPE of the deviation rather than its size:

      convex        no head sample dips INWARD past the chord (an arch is on one
                    side of its chord; an excursion has a shoulder that isn't).
      monotone      the curvature is single-signed over almost the whole head —
                    an arc bends the same way everywhere, an excursion bends one
                    way at each shoulder and not at all between them.
      bulk          most of the head is actually raised. A half-round has 2/3 of
                    its samples above a quarter of its sagitta; a bump has as
                    many as the bump is wide.
      circular      a circle fitted through the head has a small residual, and
                    the sagitta that circle IMPLIES for this chord is the
                    sagitta measured. This is the one an excursion fails worst:
                    a flat-jump-flat head has no circle at all.

    Returns (kind, sagitta, ratio, arc) with `arc` carrying the fitted centre,
    radius, residual, and the four checks as they were answered.
    """
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
    if nvec @ np.array([0.0, -1.0]) < 0:      # point it OUT of the aperture
        nvec = -nvec
    dev = (P - a) @ nvec                       # positive = away from the sill
    sag = float(np.max(dev))
    dip = float(-np.min(dev))
    width = max(1.0, float(rect[2] - rect[0]))
    ratio = max(sag, 0.0) / width

    big_enough = sag >= ARCH_MIN_PX and ratio >= ARCH_RATIO
    convex = dip <= max(2.0, 0.20 * max(sag, 0.0))
    k = max(3, len(dev) // 12) | 1             # a short odd box, to kill grain
    sm = np.convolve(dev, np.ones(k) / k, mode="valid")
    curv = np.diff(sm, 2)
    dead = max(0.02, 0.01 * max(sag, 0.0))
    live = np.abs(curv) > dead
    mono = bool(live.sum() >= 3 and
                (curv[live] < 0).mean() >= 0.85)   # bends one way, outward
    bulk = float((dev > 0.25 * max(sag, 1e-9)).mean())
    bulky = bulk >= 0.45

    arc, circular = None, False
    if len(P) >= 8:
        t = max(1, int(0.15 * len(P)))
        ctr, rad, rms = _fit_circle(P[t:len(P) - t])
        # The sagitta the FITTED CIRCLE implies over this same chord: the
        # farthest the circle reaches outward past the chord line. Taken as a
        # perpendicular distance rather than from r and the half-chord, because
        # near a half-round the second formula is the difference of two nearly
        # equal numbers and the two grazing samples at the springing — which sit
        # worst, by geometry — swing it by tens of px.
        implied = float((ctr - a) @ nvec) + rad
        circular = bool(rms <= max(2.0, 0.05 * rad) and
                        abs(implied - sag) <= max(3.0, 0.30 * max(sag, 0.0)))
        arc = {"centre_px": [round(float(ctr[0]), 2), round(float(ctr[1]), 2)],
               "radius_px": round(rad, 2), "rms_px": round(rms, 2),
               "implied_sagitta_px": round(implied, 2),
               "convex": bool(convex), "monotone_curvature": mono,
               "bulk_frac": round(bulk, 3), "circular": circular}
    kind = "arched" if (big_enough and convex and mono and bulky and circular) \
        else "straight"
    if kind == "straight" and arc is not None:
        arc["rejected"] = True
    return kind, max(sag, 0.0), ratio, arc


# --------------------------------------------------------------------- the pass

def trace_aperture(L, rect, band=BAND, n_samples=N_SAMPLES, probe=PROBE,
                   inside_dark=True, w_edge=W_EDGE, w_prior=W_PRIOR,
                   w_dark=W_DARK, w_smooth=W_SMOOTH, floor_line_y=None):
    """Trace the inside edge of the aperture whose prior rectangle is `rect`.

    `L` is a 2-D luminance array, `rect` is `(x0, y0, x1, y1)` in image px.
    `floor_line_y` is the wall's own floor line in image px — from a promoted
    wall's `floor_line_y * image_h_px`, or from the warp or the plan when a
    candidate is being traced. GIVE IT. The bottom of an aperture in a wall is
    where the wall meets its floor and there is no paint there to trace: at the
    foot of a doorway the room beyond is lit, and a tracer looking for dark
    inside will climb the far floor every time. With it, only the jambs and the
    head are traced and the loop is closed along the floor line between the two
    jamb feet; each foot is where that jamb's own fitted line meets it.

    Returns a dict: the closed `polygon` (n_samples points), the per-sample
    `confidence` and `offsets`, the four named `corners`, the `head_kind`
    verdict, the per-wall `wall_confidence` and what it is made of, and the
    evidence behind each of them.
    """
    L = np.asarray(L, dtype=np.float64)
    rect = tuple(float(v) for v in rect)
    band = int(band)
    pts, nrm, tan, side = _perimeter(rect, n_samples)
    void, frame, contrast = _levels(L, rect, band)
    step, inner, wrong = _evidence(L, pts, nrm, tan, band, probe, TANGENT_TAPS,
                                   void, contrast, inside_dark)
    d_off = np.arange(-band, band + 1, dtype=np.float64)

    # RULE 2. The band is a trust region, and its size and its price are set by
    # the wall's contrast in ABSOLUTE levels and by the grip the prior itself
    # has at each sample. `_trust_region` states the function.
    a_grip = _prior_grip(step, wrong, band, contrast)
    band_eff, w_prior_i, A_abs, trust, hold = _trust_region(
        band, w_prior, a_grip, abs(frame - void))

    edge = np.clip(step, -1.5, 1.5)
    dark = np.clip(wrong - 0.5, 0.0, 2.0)
    prior = np.abs(d_off)[None, :] / float(band)
    data = -w_edge * edge + w_dark * dark + w_prior_i[:, None] * prior
    data[:, np.abs(d_off) > band_eff] = BIG

    # RULE 1. The threshold is geometry, not paint. The bottom side is SET to
    # the wall's floor line — one offset, no choice — and the smoothness term is
    # switched off at the two junctions so the set sill cannot drag the traced
    # jambs' feet sideways with it.
    lam = np.full(n_samples, float(w_smooth))
    bottom = np.flatnonzero(side == 2)
    thr = {"kind": "traced", "note": "no floor line given; the sill was traced,"
           " and at the foot of a lit doorway that is the weak side"}
    if floor_line_y is not None and len(bottom):
        want = float(floor_line_y) - rect[3]
        d_thr = int(round(np.clip(want, -band, band)))
        data[bottom, :] = BIG
        data[bottom, d_thr + band] = 0.0
        lam[bottom[0]] = LAM_AT_THRESHOLD
        lam[(bottom[-1] + 1) % n_samples] = LAM_AT_THRESHOLD
        thr = {"kind": "floor_line", "y_px": round(rect[3] + d_thr, 2),
               "offset_from_prior_px": d_thr,
               "clamped": bool(abs(want - d_thr) > 0.5),
               "note": "the wall's floor line at the door's columns; the jamb "
                       "feet are where the jambs' fitted lines meet it"}

    bestd = np.argmin(data, axis=1)
    far = data.copy()
    for i in range(n_samples):
        lo, hi = max(0, bestd[i] - 8), min(data.shape[1], bestd[i] + 9)
        far[i, lo:hi] = np.inf
    margin = np.min(far, axis=1) - data[np.arange(n_samples), bestd]
    margin[bottom] = -np.inf                   # never pin on set geometry
    pin = int(np.argmax(np.where(np.isfinite(margin), margin, -np.inf)))
    path, cost = _cyclic_dp(np.roll(data, -pin, axis=0), np.roll(lam, -pin),
                            int(bestd[pin]))
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

    # RULE 3. A confidence that can fall. The old one was the chosen step in
    # units of the wall's own contrast, which is a ratio of a wall's evidence to
    # itself and so is high on every wall, bad ones included. This one is two
    # honest factors, both about the traced sides only — the threshold is set
    # geometry and has no opinion to be confident about:
    #
    #   evidence   the ABSOLUTE step, in levels, under the loop where it
    #              actually settled, scored against A_GOOD. Falls with the
    #              wall's absolute contrast, by construction.
    #   licence    how much of the loop's excursion from the prior the prior's
    #              own measurement licensed. An excursion at a sample where the
    #              prior stood on nothing is free; the same excursion where the
    #              prior stood on real paint is the failure mode this whole rule
    #              exists to catch, and it is charged at EXC_REF px RMS = half.
    #              The excursion counted is the one the loop MADE or the one the
    #              evidence alone WANTED over the whole requested band, whichever
    #              is larger, because rule 2's trust region now holds the bad
    #              walls in place and a confidence that only saw where the loop
    #              ended up would read that restraint as a good trace.
    #
    #   wall_confidence = evidence * licence
    traced = side != 2
    a_chosen = np.clip(chosen_step * contrast, 0.0, None)
    c_evi = float(np.mean(np.clip(a_chosen[traced] / A_GOOD, 0.0, 1.0)))
    d_free = d_off[np.argmin(-w_edge * edge + w_dark * dark, axis=1)]
    want = np.maximum(np.abs(offs), np.abs(d_free))
    unlic = float(np.sqrt(np.mean(hold[traced] * want[traced] ** 2)))
    c_lic = 1.0 / (1.0 + (unlic / EXC_REF) ** 2)
    wall_conf = c_evi * c_lic
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
        "max_offset_px": int(np.max(np.abs(offs[traced]))) if traced.any() else 0,
        "mean_confidence": round(float(np.mean(conf[traced])), 4),
        "min_confidence": round(float(np.min(conf[traced])), 4),
        "wall_confidence": round(wall_conf, 4),
        "conf_evidence": round(c_evi, 4),
        "conf_licence": round(c_lic, 4),
        "unlicensed_excursion_px": round(unlic, 2),
        "free_excursion_px": int(np.max(np.abs(d_free[traced]))) if traced.any() else 0,
        "abs_contrast_l": round(A_abs, 2),
        "trust": round(trust, 4),
        "band_eff_px": band_eff,
        "threshold": thr,
        "void_l": round(void, 2), "frame_l": round(frame, 2),
        "contrast_l": round(contrast, 2),
        "cost": round(float(cost), 3),
        "band_px": band, "n_samples": n_samples, "pinned_sample": pin,
        "method": ("the prior's perimeter sampled into %d points; the jambs and "
                   "head searched +/-%d px (of %d asked) along the outward "
                   "normal for the strongest %s-inside step, the threshold %s, "
                   "all chosen by one cyclic L1 dynamic-programming pass so the "
                   "loop closes by construction"
                   % (n_samples, band_eff, band,
                      "dark" if inside_dark else "light",
                      ("SET to the wall's floor line at y=%.1f" % thr["y_px"])
                      if thr["kind"] == "floor_line" else "traced (no floor line given)")),
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
            fl = d.get("floor_line_y")
            ih = d.get("image_h_px")
            out.append((room, facing, png, op,
                        (op["x"], op["y"], op["x"] + op["w"], op["y"] + op["h"]),
                        (float(fl) * float(ih)) if (fl and ih) else None))
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--image", default="")
    ap.add_argument("--rect", default="", help="x0,y0,x1,y1 in image px")
    ap.add_argument("--band", type=int, default=BAND)
    ap.add_argument("--samples", type=int, default=N_SAMPLES)
    ap.add_argument("--floor-line-y", type=float, default=None,
                    help="the wall's floor line in image px — a promoted wall's "
                         "floor_line_y * image_h_px, or the warp's. The bottom "
                         "of the aperture is SET to it and not traced.")
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
        print("%-20s %-2s %-6s %6s %5s %5s %6s %5s %6s %5s %8s %4s"
              % ("room", "F", "id", "absC", "trust", "band", "maxoff", "unlic",
                 "sill", "conf", "head", "ms"))
        rows = []
        for room, facing, png, op, rect, floor_y in walls:
            L = _load_luma(png)
            t = time.time()
            r = trace_aperture(L, rect, band=a.band, n_samples=a.samples,
                               floor_line_y=floor_y)
            ms = (time.time() - t) * 1000.0
            rows.append((room, facing, ms, r, op.get("id", "?")))
            thr = r["threshold"]
            print("%-20s %-2s %-6s %6.1f %5.2f %5d %6d %5.1f %6s %5.2f %8s %4.0f"
                  % (room, facing, op.get("id", "?"), r["abs_contrast_l"],
                     r["trust"], r["band_eff_px"], r["max_offset_px"],
                     r["unlicensed_excursion_px"],
                     ("%+d" % thr["offset_from_prior_px"])
                     if thr["kind"] == "floor_line" else "traced",
                     r["wall_confidence"], r["head_kind"], ms))
            if a.overlay_dir:
                os.makedirs(a.overlay_dir, exist_ok=True)
                overlay(png, os.path.join(a.overlay_dir,
                                          "%s-%s-%s.png" % (room, facing, op.get("id", "?"))),
                        rect, r)
        if rows:
            cs = sorted(x[3]["wall_confidence"] for x in rows)
            print("\n%d door walls, %.0f ms median, %.0f ms worst; "
                  "confidence %.2f worst / %.2f median / %.2f best; %d below 0.5"
                  % (len(rows), float(np.median([x[2] for x in rows])),
                     max(x[2] for x in rows), cs[0], float(np.median(cs)), cs[-1],
                     sum(1 for c in cs if c < 0.5)))
        if a.json:
            with open(a.json, "w") as fh:
                json.dump([{"room": x[0], "facing": x[1], "id": x[4], "ms": x[2],
                            **x[3]} for x in rows], fh, indent=1)
                fh.write("\n")
        return

    if not a.image or not a.rect:
        raise SystemExit("aperture_trace refused: give --image and --rect, or --store")
    rect = [float(v) for v in a.rect.split(",")]
    L = _load_luma(a.image)
    t = time.time()
    res = trace_aperture(L, rect, band=a.band, n_samples=a.samples,
                         inside_dark=not a.bright_inside,
                         floor_line_y=a.floor_line_y)
    ms = (time.time() - t) * 1000.0
    print("%s  %s" % (a.image, res["method"]))
    print("  head %s (sagitta %.1f px, %.3f of width)"
          % (res["head_kind"], res["head_sagitta_px"], res["head_sagitta_ratio"]))
    for name, c, d, s in zip(("TL", "TR", "BR", "BL"), res["corners"],
                             res["corner_dev_from_prior_px"], res["corner_snapped"]):
        print("  %s %8.1f,%-8.1f  %5.1f px off the prior%s"
              % (name, c[0], c[1], d, "  (snapped)" if s else ""))
    print("  absolute contrast %.1f, trust %.2f -> band %d px of %d asked"
          % (res["abs_contrast_l"], res["trust"], res["band_eff_px"], res["band_px"]))
    print("  threshold %s%s"
          % (res["threshold"]["kind"],
             (" at y=%.1f (%+d px off the prior)"
              % (res["threshold"]["y_px"], res["threshold"]["offset_from_prior_px"]))
             if res["threshold"]["kind"] == "floor_line" else ""))
    print("  wall confidence %.2f = evidence %.2f x licence %.2f "
          "(unlicensed excursion %.1f px rms), max offset %d px, %.0f ms"
          % (res["wall_confidence"], res["conf_evidence"], res["conf_licence"],
             res["unlicensed_excursion_px"], res["max_offset_px"], ms))
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
