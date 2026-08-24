#!/usr/bin/env python3
"""Row 35 — THE SNAP: post-generation planar rectification, no model in the loop.

    python3 design/plan-draft/measured/row35_snap.py --facing great_hall/N \
        --out design/batches/row35-snap/great_hall-N/after.png

[HUMAN, 2026-08-24, verbatim] "Can we use the prompts producing the results then
auto snap the room corners to our expected geometry?" — and the follow-on,
verbatim: "Maybe skew the eye height in some creative way too?", which is why
the eye is the one target-camera parameter this tool exposes (`--target-eye`).

[HUMAN, 2026-08-24, verbatim, relayed at the row's mid-build] "Use our lessons
to make the best prompt, allow the single return to then be processed and roll
with it without gating its result in tests and retries." So THE MEASUREMENT IS
INPUT GEOMETRY HERE AND NOT A GATE. A frame arrives once; this rectifies it and
it ships. Exactly two things refuse: a frame whose anchors cannot be read at
all (no scale, no floor line — there is nothing to rectify ONTO), and a
correction that exceeds a stated budget, refused with its number.

WHAT IS ACTUALLY BEING FIXED
----------------------------
The manor's suspect walls are not badly painted. Their FACING WALL is right —
the camera gate admits floor line, chair-rail and scale inside ±8 % — and their
RETURNS disagree with it: `great_hall/N`'s two side-wall/ceiling junctions
converge at y 615.8, which at the frame's own ruler puts the viewer's eye
0.485 m above the floor it draws. Both readings are determinate and they are of
one picture, so no single camera explains it. Row 32 named that family
`suspect-painting` and spent rolls asking for a repaint. This spends none: the
five painted surfaces are each a PLANE, and one camera's view of a plane maps
to another camera's view of it exactly.

THE CONSTRUCTION, AND WHY THE SEAMS CANNOT COME APART
-----------------------------------------------------
A one-point interior is fully described, in image space, by a BOX:

    x0, x1     the wall's two corners at the wall plane
    yc, yf     its ceiling line and its floor line at the wall plane
    vx, vy     the point the returns converge on — the principal point, which
               lies on the horizon

Those six numbers cut the frame into five regions and nothing else does: the
wall rectangle, and the four trapezoids swept by the rays from (vx, vy) through
its four corners — left return, right return, floor, ceiling. Each region is
one plane, and each is parameterised by two numbers with a physical meaning:

    wall      (u, h)   across the wall, floor-to-ceiling
    floor     (u, t)   across the wall, and t = Z / camera-to-wall depth
    ceiling   (u, t)
    left      (h, t)   floor-to-ceiling on the return, and the same depth t
    right     (h, t)

Each is a 3x3 matrix on (p, q, 1) — see `region_matrix` — so the map from a
SOURCE box to a TARGET box is, region by region, a homography: the target's
inverse, then the source's.

SEAM CONTINUITY IS A PROPERTY OF THE CONSTRUCTION, NOT A TOLERANCE. Two regions
share an edge exactly where one of their parameters is pinned (the wall's left
edge is `u = 0` and the left return's `t = 1`), and along that edge BOTH
parameterisations name the same physical line — so both matrices evaluate to
the same image point, in both boxes, by algebra rather than by agreement.
`--emit-seams` prints the two mappings of the same edge points so a test can
read the disagreement rather than take this paragraph's word for it.

AND EVERY STRAIGHT LINE THROUGH THE SOURCE VANISHING POINT COMES OUT STRAIGHT
THROUGH THE TARGET'S. A line through (vx, vy) IS a ray; it crosses the box
boundary at one point, that point maps to one point on the target boundary, and
the whole ray maps onto the whole target ray. That is what makes the snap
actually snap: the returns' painted junctions pass through the source
convergence by construction, so after the warp they pass through the declared
one, and the row-20 ramp instrument re-fitted on the snapped frame reads the
horizon the plan declares.

WHAT IS SNAPPED AND WHAT IS PRESERVED — the one design ruling in this file
--------------------------------------------------------------------------
SNAPPED: the CAMERA. The scale (`px_per_m_at_wall` to the declared lens over
the declared standpoint), the principal point (to the declared horizon row and
the declared wall centre), and the eye height (to `--target-eye`, defaulting to
the declared standing camera).

PRESERVED: the ROOM'S PAINTED PROPORTIONS — the storey height and the wall
width the picture actually drew, carried across at the declared scale.

This is not a shortcut, it is blueprint §5's standing authority applied to the
same question door_measure.py answers about doorways: the approved image is the
geometric authority and the plan amends to the painting. The alternative —
pinning the corners and the ceiling line to the numbers the plan rules — was
worked out and rejected on its own arithmetic: on `great_hall/N` it is a 27 %
horizontal stretch against a 27 % vertical squash, which is a 1.7:1 aspect
distortion over every painted board and moulding on the wall, and it would ALSO
drag the chair-rail out of the bracket the camera gate reads the scale off, so
the wall would fail the instrument it was rectified to satisfy. Preserving the
painted proportions makes the facing wall's own map a pure similarity: uniform
scale, no aspect change, no distortion anywhere on the surface the viewer
mostly looks at.

THE RESIDUALS, EACH WITH ITS CLOSED FORM, because they are the cost and they
are named rather than discovered:

  the facing wall     uniform scale k = ppm_target / ppm_source. No distortion.
  the two returns     an affine SHEAR of magnitude
                      m = ppm_target · (eye_target − eye_source) / (vx − x0),
                      i.e. ~±m/2 of local stretch. On the three pilot walls
                      that is 6–12 %, which is the ~9 % the row anticipated and
                      is inside painterly licence.
  the floor           k across, k · (eye_target / eye_source) down — a constant
                      anisotropic scale, so the floor is re-projected exactly
                      and what it costs is RESAMPLING, not geometry: a painting
                      drawn from a low eye holds fewer rows of near floor than
                      a standing eye needs, so those rows are magnified.
  the ceiling         k across, k · (storey − eye_target)/(storey − eye_source)
                      down, the same way.

`--stretch-budget` is a budget on exactly that magnification, and it is the
knob that separates a correctable painting from an uncorrectable one.

WHEN THERE IS NO CONVERGENCE TO READ
------------------------------------
Not every frame fixes a vanishing point. `--vp auto` (the default) uses the
measured ceiling-ramp convergence only when the picture actually fixes one, and
the test is physics rather than a threshold: on a level camera whose ceiling is
above the horizon, the LEFT return's junction must rise going left (positive
fitted slope) and the RIGHT return's must rise going right (negative), and a
junction whose fit moves it less than one pixel across the span it was fitted
over is a horizontal edge — a beam, a cornice, the frame — and not a receding
line. Seven of the manor's ten `suspect-painting` walls fail that on one side
or both, with a fitted slope of exactly ±0.0.

Those fall back to the DECLARED principal point, and the fallback is not a
no-op: the box is then the frame's own floor line, corners and ceiling read
against the declared horizon, so the snap still corrects the scale and moves
the floor line onto the row the plan rules — the whole warp degenerates to a
similarity about the declared vanishing point. That is the general production
path the Captain's ruling asks for ("a 0.85× wall rescales in the same
mapping"), and a wall whose perspective was already right pays nothing for it.

WHERE THE TRANSFORM SUFFICES, AND WHERE RE-DETECTION WOULD BE HONESTER
----------------------------------------------------------------------
TRANSFORM SUFFICES for everything that is a POSITION on a plane, because the
map is exact there: the measured door and opening rectangles (they lie in the
facing-wall region, whose map is a similarity, so a rectangle comes out a
rectangle with no bounding-box slop), the carrier boxes and their search
windows, the corners, the floor line, the chair-rail row, the ceiling line and
the ramp intersection. Every one of those is rewritten into the output reading
from the map, and nothing is re-detected — which is what keeps the pipeline at
one generation plus seconds.

RE-DETECTION WOULD BE HONESTER FOR THREE THINGS, and this file does the first
and declines the other two out loud:

  * THE LIGHT. `key_tint` and `key_dir` are statistics over REGIONS the warp
    redistributes — the tint patch and the wall band land on different pixels
    afterwards — so a transformed answer would describe a frame that no longer
    exists. It is re-read off the snapped image (`light`, the corpus's own),
    which is one cheap call.
  * THE CARRIER EDGE READING (`_carriers[].found`, `edge_delta_px`). Its
    verdict is "could this detector resolve this feature here", and resampling
    changes the answer. The transformed positions are carried; the FINDING is
    carried across unchanged and marked `_snap.transformed`, so a reader knows
    it is the pre-snap detector's word about post-snap coordinates. Re-running
    `carrier_edges` on the snapped frame would be honester and costs a second
    detector pass; `--acceptance` does exactly that as part of the full
    re-measurement, and its numbers are what the pilot reports.
  * THE DOOR VOID. `door_measure.py` reads a maximally-stable dark run; the
    stability sweep is over luminance cuts and resampling softens edges, so on
    a wall magnified past ~2× a re-read is the better reading. The transform is
    used because the wall region's map is a similarity and a similarity cannot
    move a rectangle relative to the paint inside it — but the acceptance run
    re-measures the doors too, and the pilot reports both.

THE ACCEPTANCE TEST IS THE INSTRUMENT ITSELF (`--acceptance`). The snapped
frame goes back through `row23_lib.measure_candidate` with the SAME windows the
scaffold declared before any candidate existed — no band is moved, no bracket
is widened, nothing is re-derived. Under the Captain's ruling above it is a
REPORT and not a gate: the wall ships snapped either way, and the report is how
the doctrine is checked rather than how a wall is refused.
"""
import argparse
import hashlib
import json
import os
import sys
import time

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, HERE)

import row23_lib                                                # noqa: E402
import timings                                                  # noqa: E402
from measure_lib import load, luma                              # noqa: E402

W, H = 1536, 1024

MANOR = os.path.join(ROOT, "design", "batches", "row23-scaffold", "manor")
MANIFEST = os.path.join(MANOR, "manifest.json")
STATE = os.path.join(MANOR, "run-state.json")
PLAN = os.path.join(ROOT, "fixtures", "demo-study", "plan.json")

#: The five planes, in the order a target pixel is offered to them. Only the
#: shared edges are ever claimed twice and the order is what settles those —
#: the wall owns its own boundary, then the horizontal planes, then the returns.
REGIONS = ("wall", "floor", "ceiling", "left", "right")

#: THE TWO BUDGETS ARE CRAFT NUMBERS AND THIS FILE SAYS SO OUT LOUD. Unlike
#: every bracket in `row23_lib` — each of which is MEASURED_BAND propagated
#: through a geometry the scaffold declares — no instrument derives these. They
#: are stated, they are flags, and the numbers this corpus actually produces
#: are recorded beside them so that moving one is an argued act.
#:
#: THE REVEAL. How far outside the source frame a required sample may lie.
#: Inside it the frame's own border pixel is repeated; past it the snap would
#: be painting room the generator never drew. Raising the eye is what spends it
#: — a standing camera sees more ceiling than a crouching one, and the paint
#: for that ceiling does not exist — so the reveal lands in the ceiling's two
#: top corners and is almost nothing anywhere else. 100 px is a tenth of the
#: frame's height, which on this corpus's plain limewashed ceilings is a repeat
#: the eye does not find and on anything patterned would be a streak. Measured
#: here: `library/N` 58 px, `great_hall/N` 91 px, `kitchen/W` 196 px.
DEFAULT_REVEAL_BUDGET_PX = 100.0

#: THE STRETCH. The largest local magnification any of the five planes may be
#: asked for — the resampling cost, since the re-projection itself is exact.
#: Measured here: `library/N` 1.8x, `great_hall/N` 2.4x, `kitchen/W` 4.9x, and
#: the seven suspect walls whose ramps are flat edges 3.7x to 470x. 3.0 admits
#: the corrections this corpus needs and refuses the ones that would invent
#: detail rather than move it.
DEFAULT_STRETCH_BUDGET = 3.0

#: A fitted junction that moves less than one pixel across the span it was
#: fitted over is a horizontal edge, not a receding line. `ceiling_ramp_vp`
#: fits over `reach = 64` px each side, so that is the span.
RAMP_REACH_PX = 64.0
MIN_RAMP_SLOPE = 1.0 / RAMP_REACH_PX

#: THE TWO CLAUSES THIS TOOL CAN REFUSE ON, by the names the clause ledger
#: (`tests/playwright/guards.spec.mjs`) declares them under. They are the whole
#: of what a BUDGET refuses — an unreadable frame, an open facing and a box that
#: is not a box are refusals of a different kind and carry no clause, because
#: `--vp auto` retries from the declared principal point on a priced correction
#: and on nothing else. The ledger tokens themselves are written at their emit
#: sites in `_snap_once` and nowhere else: one token, one arm.
STRETCH_CLAUSE = "snap.stretch_budget"
REVEAL_CLAUSE = "snap.reveal_budget"
BUDGET_CLAUSES = (STRETCH_CLAUSE, REVEAL_CLAUSE)


# ------------------------------------------------------------------- the box

def box(x0, x1, yc, yf, vx, vy):
    return {"x0": float(x0), "x1": float(x1), "yc": float(yc),
            "yf": float(yf), "vx": float(vx), "vy": float(vy)}


def box_refusal(b):
    """Why this box cannot describe a one-point interior, or None.

    The vanishing point lies strictly inside the wall rectangle in any level
    view of a room the camera is standing in — that is what "the eye is inside
    the room" means, and it is also exactly the condition under which all five
    region matrices are invertible.
    """
    if not (b["x0"] < b["vx"] < b["x1"]):
        return ("the convergence sits at x %.1f and this frame's wall runs "
                "%.1f..%.1f — a level camera's principal point is between its "
                "own corners, so there is no five-plane box here"
                % (b["vx"], b["x0"], b["x1"]))
    if not (b["yc"] < b["vy"] < b["yf"]):
        return ("the convergence sits at y %.1f and this frame's ceiling and "
                "floor lines are y %.1f and %.1f — the eye has to be inside "
                "the room it is standing in"
                % (b["vy"], b["yc"], b["yf"]))
    return None


def region_matrix(b, region):
    """The 3x3 taking a region's own (p, q, 1) parameters to homogeneous image.

    `wall` is (u, h) with W = 1 — an affine map of the rectangle. The other four
    are (u, t) or (h, t) with W = t, which is what makes them projective: a
    point at depth ratio t sits at the vanishing point plus 1/t of the way out
    to the wall-plane edge point its parameters name.
    """
    x0, x1, yc, yf = b["x0"], b["x1"], b["yc"], b["yf"]
    vx, vy = b["vx"], b["vy"]
    if region == "wall":
        return np.array([[x1 - x0, 0.0, x0],
                         [0.0, yc - yf, yf],
                         [0.0, 0.0, 1.0]])
    if region == "floor":
        return np.array([[x1 - x0, vx, x0 - vx],
                         [0.0, vy, yf - vy],
                         [0.0, 1.0, 0.0]])
    if region == "ceiling":
        return np.array([[x1 - x0, vx, x0 - vx],
                         [0.0, vy, yc - vy],
                         [0.0, 1.0, 0.0]])
    if region == "left":
        return np.array([[0.0, vx, x0 - vx],
                         [yc - yf, vy, yf - vy],
                         [0.0, 1.0, 0.0]])
    if region == "right":
        return np.array([[0.0, vx, x1 - vx],
                         [yc - yf, vy, yf - vy],
                         [0.0, 1.0, 0.0]])
    raise ValueError("no region named %r" % (region,))


def _apply(M, p, q):
    """(p, q) through a 3x3, vectorised, returning (x, y)."""
    den = M[2, 0] * p + M[2, 1] * q + M[2, 2]
    den = np.where(np.abs(den) < 1e-12, np.nan, den)
    x = (M[0, 0] * p + M[0, 1] * q + M[0, 2]) / den
    y = (M[1, 0] * p + M[1, 1] * q + M[1, 2]) / den
    return x, y


def params(b, region, x, y):
    """Image (x, y) back to a region's own two parameters."""
    return _apply(np.linalg.inv(region_matrix(b, region)), x, y)


def image(b, region, p, q):
    """A region's own two parameters forward to image (x, y)."""
    return _apply(region_matrix(b, region), p, q)


def assign(b, x, y, eps=1e-9):
    """Which plane each image point lies on, and its two parameters there.

    Returns (index into REGIONS, p, q). Every point in front of the camera lies
    on exactly one of the five, because the ray from the vanishing point to it
    leaves the wall rectangle through exactly one edge; the shared edges are
    claimed twice and REGIONS' order settles them.
    """
    x = np.asarray(x, dtype=np.float64)
    y = np.asarray(y, dtype=np.float64)
    idx = np.full(x.shape, -1, dtype=np.int8)
    P = np.zeros(x.shape)
    Q = np.zeros(x.shape)
    for i, r in enumerate(REGIONS):
        p, q = params(b, r, x, y)
        if r == "wall":
            ok = (p >= -eps) & (p <= 1 + eps) & (q >= -eps) & (q <= 1 + eps)
        else:
            ok = (p >= -eps) & (p <= 1 + eps) & (q > eps) & (q <= 1 + eps)
        ok &= np.isfinite(p) & np.isfinite(q) & (idx < 0)
        idx = np.where(ok, i, idx)
        P = np.where(ok, p, P)
        Q = np.where(ok, q, Q)
    return idx, P, Q


def map_points(src, tgt, x, y):
    """TARGET image coordinates to SOURCE image coordinates, plane by plane.

    Points the target box does not place on any plane come back NaN. That
    happens only where a caller asks about a point behind its own camera; over
    a whole frame it is zero and `snap_frame` asserts so.
    """
    idx, p, q = assign(tgt, x, y)
    sx = np.full(np.shape(x), np.nan, dtype=np.float64)
    sy = np.full(np.shape(x), np.nan, dtype=np.float64)
    for i, r in enumerate(REGIONS):
        m = idx == i
        if not np.any(m):
            continue
        ux, uy = image(src, r, p[m], q[m])
        sx[m], sy[m] = ux, uy
    return sx, sy, idx


# ------------------------------------------------------------ reading the box

def source_box(reading, declared, vp_mode):
    """The box the PAINTING drew, out of the reading the gate already took.

    Every number here is a measurement `row23_lib.measure_candidate` made, and
    none is re-detected. `notes` records which anchors the frame gave and which
    were taken from the declaration because it gave none.
    """
    p = reading.get("_promotion") or {}
    mp = reading.get("_measured_px") or {}
    ppm = reading.get("px_per_m_at_wall")
    notes = {}
    if ppm is None or mp.get("wall_floor_line_y_px") is None:
        return None, None, ("this frame's anchors cannot be read at all — no "
                            "scale, or no floor line — so there is no geometry "
                            "for a rectification to start from")
    yf = float(mp["wall_floor_line_y_px"])

    ceil = p.get("ceiling_y_px")
    if ceil is None:
        ceil = yf - declared["storey_m"] * ppm
        notes["ceiling"] = "declared: the frame gives no ceiling line"
    else:
        notes["ceiling"] = "measured"
    yc = float(ceil)

    cx0, cx1 = p.get("corner_x0_px"), p.get("corner_x1_px")
    if cx0 is None or cx1 is None:
        cx0, cx1 = declared["corner_x0"], declared["corner_x1"]
        notes["corners"] = "declared: the frame gives no corner on one side or both"
    else:
        notes["corners"] = "measured"

    vx, vy = declared["principal_x"], declared["horizon_px"]
    ramp = p.get("ramp")
    why = ramp_refusal(ramp, reading, declared)
    if vp_mode == "measured" and why:
        return None, None, "the measured convergence cannot be used: " + why
    if vp_mode != "declared" and not why:
        vx, vy = float(ramp["x"]), float(ramp["y"])
        notes["vanishing_point"] = "measured-ramp"
    else:
        notes["vanishing_point"] = "declared-principal-point"
        notes["vanishing_point_why"] = why or "asked for by --vp declared"

    b = box(cx0, cx1, yc, yf, vx, vy)
    bad = box_refusal(b)
    if bad:
        return None, None, "the frame's own reading is not a box: " + bad
    notes["px_per_m_at_wall"] = ppm
    return b, notes, None


def ramp_refusal(ramp, reading, declared):
    """Why this frame's ceiling ramps do not fix a vanishing point, or None.

    NO INSTRUMENT THRESHOLD MOVES HERE AND NONE IS ADDED. `_admissible` already
    decided whether the convergence is determinate, in-picture and between this
    frame's own ceiling and floor, and its answer is taken as it stands (a
    reading `_admissible` refused carries a `hold_family`, and the two ramp
    slopes are what this adds).

    What this adds is a PRECONDITION OF THE WARP, which is a different
    question: the two junctions have to be RECEDING LINES for the box to
    describe five planes. On a level camera whose ceiling is above the horizon,
    the left junction rises going left and the right one rises going right —
    the signs are fixed by geometry, not chosen — and a fit that moves the line
    less than one pixel across the 64 px it was fitted over has found a
    horizontal edge.
    """
    if not ramp or ramp.get("y") is None:
        return "this frame fits no ceiling-ramp horizon at all"
    fam = (reading.get("_promotion") or {}).get("hold_family")
    if fam == row23_lib.UNFITTED_HORIZON:
        return ("the reading holds this frame as %s, so the convergence it "
                "reports is not one the instrument stands behind" % fam)
    al, ar = ramp.get("left_slope"), ramp.get("right_slope")
    if al is None or ar is None:
        return "the ramp record carries no fitted slopes"
    if not (al > MIN_RAMP_SLOPE):
        return ("the left junction is fitted at slope %.4f — a receding left "
                "return rises going left, and anything under %.4f has not "
                "moved one pixel across the %d px it was fitted over, which is "
                "a horizontal edge and not a return"
                % (al, MIN_RAMP_SLOPE, int(RAMP_REACH_PX)))
    if not (ar < -MIN_RAMP_SLOPE):
        return ("the right junction is fitted at slope %.4f — a receding right "
                "return rises going right, and anything over %.4f has not "
                "moved one pixel across the %d px it was fitted over, which is "
                "a horizontal edge and not a return"
                % (ar, -MIN_RAMP_SLOPE, int(RAMP_REACH_PX)))
    return None


def target_box(src, declared, target_eye):
    """The box the DECLARED camera would draw the PAINTED room from.

    The camera is snapped and the room's painted proportions are carried: see
    the module docstring's ruling. `k` is the whole of the scale correction.
    """
    ppm_s = declared["source_ppm"]
    ppm_t = declared["ppm"]
    k = ppm_t / ppm_s
    vx, vy = declared["principal_x"], declared["horizon_px"]
    yf = vy + target_eye * ppm_t
    storey_m = (src["yf"] - src["yc"]) / ppm_s
    yc = yf - storey_m * ppm_t
    # THE CORNERS ARE SNAPPED AND THE WIDTH IS NOT — the Captain's sentence
    # read exactly ("auto snap the room corners to our expected geometry"),
    # against blueprint §5's approved-image authority for what is BETWEEN them.
    # The wall's painted width crosses at the declared scale and its centre goes
    # where the scaffold puts it, which on every manor facing is the wall's own
    # cross-axis centre.
    #
    # The rejected alternative was to preserve the painting's asymmetry about
    # its OWN convergence instead, and it is rejected on arithmetic rather than
    # taste: that asymmetry is the difference of two independent readings — a
    # level-break on a recession profile and two 64 px ramp fits — so an error
    # in either drags the whole wall sideways. On `kitchen/W` it does: the
    # fitted convergence sits 111 px left of the frame's own corner midpoint,
    # and carrying that pushes the right corner 4 px off the frame and asks for
    # 117 px of left return the generator never painted.
    half = 0.5 * (src["x1"] - src["x0"]) * k
    x0 = declared["wall_centre_x"] - half
    x1 = declared["wall_centre_x"] + half
    b = box(x0, x1, yc, yf, vx, vy)
    bad = box_refusal(b)
    if bad:
        return None, None, (
            "the target camera does not see this room: %s. The painted storey "
            "is %.3f m and the eye asked for is %.3f m." % (bad, storey_m, target_eye))
    return b, dict(k=k, storey_m=storey_m, target_eye_m=target_eye,
                   ppm_source=ppm_s, ppm_target=ppm_t), None


# ---------------------------------------------------------------- the residual

def residuals(src, tgt, declared, target_eye):
    """The closed-form local distortion of each plane. Nothing is sampled.

    The module docstring derives these; they are written out rather than
    estimated so that the cost of a correction is a number before any pixel
    moves.
    """
    ppm_s, ppm_t = declared["source_ppm"], declared["ppm"]
    k = ppm_t / ppm_s
    eye_s = (src["yf"] - src["vy"]) / ppm_s
    storey_m = (src["yf"] - src["yc"]) / ppm_s
    out = {
        "scale_k": round(k, 6),
        "eye_source_m": round(eye_s, 4),
        "eye_target_m": round(target_eye, 4),
        "storey_painted_m": round(storey_m, 4),
        "wall_uniform_scale": round(k, 4),
        "floor_vertical_over_horizontal": round(target_eye / eye_s, 4) if eye_s else None,
        "ceiling_vertical_over_horizontal": (
            round((storey_m - target_eye) / (storey_m - eye_s), 4)
            if abs(storey_m - eye_s) > 1e-9 else None),
    }
    for side, a in (("left", src["vx"] - src["x0"]), ("right", src["x1"] - src["vx"])):
        out["%s_return_shear" % side] = (
            round(ppm_t * (target_eye - eye_s) / a, 4) if a else None)
    return out


def magnification(src, tgt):
    """The largest and smallest local linear magnification, over the frame.

    The Jacobian of TARGET -> SOURCE by central difference of the analytic map
    (the map is continuous across every seam, so a difference that straddles
    one is still a difference of one function). A source neighbourhood is
    magnified by the reciprocal of a singular value, so the resampling cost is
    1 / sigma_min.
    """
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float64)
    ax, ay, idx = map_points(src, tgt, xs - 0.5, ys)
    bx, by, _ = map_points(src, tgt, xs + 0.5, ys)
    cx, cy, _ = map_points(src, tgt, xs, ys - 0.5)
    dx, dy, _ = map_points(src, tgt, xs, ys + 0.5)
    j11, j21 = bx - ax, by - ay
    j12, j22 = dx - cx, dy - cy
    s = j11 ** 2 + j12 ** 2 + j21 ** 2 + j22 ** 2
    det = np.abs(j11 * j22 - j12 * j21)
    disc = np.sqrt(np.maximum(s * s - 4 * det * det, 0.0))
    smin = np.sqrt(np.maximum((s - disc) / 2.0, 0.0))
    smax = np.sqrt(np.maximum((s + disc) / 2.0, 0.0))
    per = {}
    for i, r in enumerate(REGIONS):
        m = (idx == i) & np.isfinite(smin) & (smin > 0)
        if not np.any(m):
            per[r] = None
            continue
        per[r] = {"pixels": int(m.sum()),
                  "max_magnification": round(float((1.0 / smin[m]).max()), 3),
                  "max_minification": round(float(smax[m].max()), 3)}
    good = np.isfinite(smin) & (smin > 0)
    return {"per_region": per,
            "max_magnification": round(float((1.0 / smin[good]).max()), 3),
            "max_minification": round(float(smax[good].max()), 3),
            "_reading": ("the largest factor any painted detail is stretched by "
                         "(magnification) and squeezed by (minification), taken "
                         "over every pixel of the output frame")}


# ------------------------------------------------------------------ the warp

def sample(rgb, sx, sy):
    """Bilinear, with the frame's own border repeated outside it.

    Returns (pixels, overshoot) where overshoot is how far outside the source
    frame each sample lay, in pixels, before it was clamped. That number is
    what the reveal budget is a budget on: within it the edge is extended,
    beyond it the snap refuses rather than inventing wall.
    """
    over = np.maximum.reduce([np.zeros_like(sx), -sx, sx - (W - 1),
                              -sy, sy - (H - 1)])
    x = np.clip(sx, 0, W - 1)
    y = np.clip(sy, 0, H - 1)
    x0 = np.floor(x).astype(np.int32)
    y0 = np.floor(y).astype(np.int32)
    x1 = np.minimum(x0 + 1, W - 1)
    y1 = np.minimum(y0 + 1, H - 1)
    fx = (x - x0)[..., None]
    fy = (y - y0)[..., None]
    out = ((rgb[y0, x0] * (1 - fx) + rgb[y0, x1] * fx) * (1 - fy) +
           (rgb[y1, x0] * (1 - fx) + rgb[y1, x1] * fx) * fy)
    return out, over


def snap_frame(rgb, src, tgt):
    """The rectified frame, and what it cost at the edges."""
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float64)
    sx, sy, idx = map_points(src, tgt, xs, ys)
    unplaced = int((idx < 0).sum())
    px, over = sample(rgb, np.nan_to_num(sx), np.nan_to_num(sy))
    return px, dict(
        unplaced_pixels=unplaced,
        max_overshoot_px=round(float(over.max()), 2),
        extended_pixels=int((over > 0).sum()),
        extended_fraction=round(float((over > 0).mean()), 5),
        region_pixels={r: int((idx == i).sum()) for i, r in enumerate(REGIONS)})


def forward(src, tgt, x, y):
    """SOURCE image coordinates to TARGET image coordinates.

    The same construction read the other way: place the point on one of the
    source planes, then draw it with the target box. This is what carries a
    measured door rectangle across.
    """
    return map_points(tgt, src, x, y)


# ------------------------------------------------------- the wall's own record

def facing_of(plan, key):
    loc, f = key.split("/")
    room = next((r for r in plan.get("rooms", []) if r.get("id") == loc), None)
    return ((room or {}).get("facings") or {}).get(f) or {}


def picks():
    """The corpus's own detectors, injected the way `row23_run.sweep` does."""
    from measure import (pick_floor, module_in_bands, pick_ceiling,
                         find_corners_recession, ceiling_ramp_vp, horizon_votes,
                         light, EYE_RANGE)
    return dict(pick_floor=pick_floor, module_in_bands=module_in_bands,
                pick_ceiling=pick_ceiling,
                find_corners_recession=find_corners_recession,
                ceiling_ramp_vp=ceiling_ramp_vp, horizon_votes=horizon_votes,
                light=light, EYE_RANGE=EYE_RANGE)


def wall_context(key):
    """Everything about a manor wall that existed before any candidate did.

    `side`, `cfg` and `ref` are the sweep's own, through `row23_lib`; `declared`
    is the geometry this wall was scaffolded at, which is what the snap snaps
    onto.
    """
    manifest = json.load(open(MANIFEST))
    plan = json.load(open(PLAN))
    e = next((z for z in manifest["entries"] if z.get("key") == key), None)
    if e is None:
        raise SystemExit("snap refused: the manor manifest holds no facing " + key)
    fac = facing_of(plan, key)
    side = row23_lib.side_from_entry(key, e, fac)
    ref = row23_lib.reference_from_entry(e)
    cfg = row23_lib.cfg_from_sidecar(side)
    m = side["meta_used"]
    cx0, cx1 = m.get("corner_x0_px"), m.get("corner_x1_px")
    ppm = m["px_per_m_at_wall"]
    horizon_px = m["horizon_y"] * m["image_h_px"]
    declared = dict(
        facing=key,
        facing_type=m.get("facing_type"),
        ppm=ppm,
        camera_m=row23_lib.camera_distance(m)[0],
        horizon_px=horizon_px,
        floor_px=m["floor_line_y"] * m["image_h_px"],
        eye_m=(m["floor_line_y"] * m["image_h_px"] - horizon_px) / ppm,
        corner_x0=cx0, corner_x1=cx1,
        # TWO CENTRES, AND THEY ARE NOT THE SAME NUMBER IN GENERAL.
        #
        # `principal_x` is where a LEVEL, horizontally-unshifted lens puts its
        # principal point, which is the frame's own centre. `groundplane.js`
        # models one shift and it is vertical (`HORIZON_Y` — "a level camera
        # with its frame moved"), so there is no horizontal one to carry.
        #
        # `wall_centre_x` is where this facing's WALL sits across that frame,
        # which is the scaffold's own corner midpoint: a standpoint that slid
        # sideways (row 26's `eye_offset_m`) draws a wall that is not centred on
        # the lens. On every manor facing today the two agree at 768; they are
        # written apart because the day one of them moves, silently sharing a
        # number would put the room's centre on the lens axis.
        principal_x=W / 2.0,
        wall_centre_x=(0.5 * (cx0 + cx1)
                       if (cx0 is not None and cx1 is not None) else W / 2.0),
        storey_m=m.get("storey_height_m"),
        wall_width_m=m.get("wall_width_m"))
    return e, side, cfg, ref, declared


def measure(path, side, cfg, ref):
    return row23_lib.measure_candidate(path, side, cfg, ref, picks())


def sha256(path):
    return hashlib.sha256(open(path, "rb").read()).hexdigest()


# ---------------------------------------------------- the reading, transformed

def _pt(src, tgt, x, y):
    ax, ay, _ = forward(src, tgt, np.array([float(x)]), np.array([float(y)]))
    return float(ax[0]), float(ay[0])


def _rect(src, tgt, x0, y0, x1, y1):
    """A wall-plane rectangle across the warp.

    The facing wall's map is a similarity, so the four corners come back as a
    rectangle; the assertion is here rather than assumed, and a rectangle that
    does not survive is a finding rather than a silent bounding box.
    """
    xs = np.array([x0, x1, x1, x0], dtype=np.float64)
    ys = np.array([y0, y0, y1, y1], dtype=np.float64)
    ax, ay, _ = forward(src, tgt, xs, ys)
    skew = max(abs(ax[0] - ax[3]), abs(ax[1] - ax[2]),
               abs(ay[0] - ay[1]), abs(ay[2] - ay[3]))
    return (float(min(ax)), float(min(ay)), float(max(ax)), float(max(ay)),
            float(skew))


def transform_doc(doc, src, tgt, declared, target_eye, rgb_after, extras):
    """The §5 record, rewritten in post-snap coordinates.

    Nothing here is measured except the light, which cannot honestly be
    transformed (see the module docstring). Every other pixel field is either a
    number the target box states by construction — the floor line, the corners,
    the ceiling line, the horizon, the scale — or a position carried through
    the map.
    """
    ppm_t = declared["ppm"]
    imh = float(doc["image_h_px"])
    floor_t = tgt["yf"]
    rail_above_t = 0.95 * ppm_t
    rail_t = floor_t - rail_above_t
    focal_t = ppm_t * declared["camera_m"]

    d = dict(doc)
    d["floor_line_y"] = round(floor_t / imh, 6)
    d["horizon_y"] = round(tgt["vy"] / imh, 6)
    d["px_per_m_at_wall"] = round(ppm_t, 3)
    d["px_per_m_at_bottom"] = round((imh - tgt["vy"]) / target_eye, 2)
    d["implied_focal_px"] = round(focal_t, 1)
    d["eye_height_m"] = round(target_eye, 4)
    d["storey_height_m"] = round((tgt["yf"] - tgt["yc"]) / ppm_t, 4)
    d["wall_width_m"] = round((tgt["x1"] - tgt["x0"]) / ppm_t, 4)
    d["corner_x0_px"] = round(tgt["x0"], 2)
    d["corner_x1_px"] = round(tgt["x1"], 2)
    d["calibration_px"] = int(round(rail_above_t))
    ref_focal = extras["ref"]["focal_px"]
    ref_eye = extras["ref"]["eye_m"]
    d["delta_focal_pct"] = round(100 * (focal_t - ref_focal) / ref_focal, 2)
    d["delta_eye_pct"] = round(100 * (target_eye - ref_eye) / ref_eye, 2)

    # THE LIGHT IS RE-READ, and it is the only thing here that is.
    L = luma(rgb_after)
    lit = picks()["light"](rgb_after, L, int(round(tgt["yc"])), int(round(floor_t)),
                           int(round(tgt["x0"])), int(round(tgt["x1"])))
    d["key_tint"] = lit["key_tint"]
    d["key_dir"] = "%s-%s" % (lit["key_dir_measured"],
                              "ABOVE" if lit["key_dir_brightest_y"] < tgt["vy"] else "BELOW")
    d["_light"] = lit

    # THE HORIZON RECORD SAYS WHICH OF TWO THINGS IT IS, because they are not
    # the same claim and a reader would otherwise take the weaker one for the
    # stronger. The ROW is the declared one either way and that is not a
    # courtesy: the warp re-projects this frame's floor onto it, so the ground
    # plane the renderer builds does converge there.
    #
    #   from the MEASURED convergence — a theorem. The two return junctions pass
    #     through the source convergence by construction and every straight line
    #     through it comes out straight through the target's, so the snapped
    #     picture's returns converge on this row.
    #   from the DECLARED principal point — an ASSUMPTION, and it is written
    #     down as one. That path is taken exactly when the frame fixed no usable
    #     convergence of its own, so its painted ceiling junctions were not
    #     moved onto this row and still whisper wherever the painter put them.
    #     The row-35 residual, named on the record rather than discovered by the
    #     next reader.
    src_ramp = (doc.get("_horizon_votes") or {}).get("ceiling_ramp_intersection") or {}
    measured_vp = extras["record"]["source_anchors"].get("vanishing_point") == "measured-ramp"
    ramp = dict(src_ramp)
    ramp.update(x=round(tgt["vx"], 1), y=round(tgt["vy"], 1),
                _snap_basis=("measured-convergence" if measured_vp
                             else "declared-principal-point"),
                _snapped=(
                    "the two return junctions of this frame pass through its own "
                    "measured convergence, and every straight line through that "
                    "point comes out straight through this one, so the snapped "
                    "picture's returns converge here by construction"
                    if measured_vp else
                    "ASSUMED, not achieved: this frame fixed no usable "
                    "convergence of its own, so the snap took the declared "
                    "principal point and re-projected the floor onto this row "
                    "WITHOUT moving the painted ceiling junctions. The ground "
                    "plane converges here; the painting's own returns still "
                    "converge where the painter drew them (this reading's "
                    "pre-snap fit put that at y %s). Re-measuring the snapped "
                    "frame is what says which." % (src_ramp.get("y"),)))
    d["_horizon_votes"] = dict(doc.get("_horizon_votes") or {},
                               adopted_y=round(tgt["vy"], 1),
                               ceiling_ramp_intersection=ramp)

    mp = dict(doc.get("_measured_px") or {})
    mp["wall_floor_line_y_px"] = int(round(floor_t))
    mp["chair_rail_y_px"] = int(round(rail_t))
    mp["dado_rail_above_floor_px"] = int(round(rail_above_t))
    mp["wall_ceiling_line_y_px"] = int(round(tgt["yc"]))
    mp["corner_x0_px"] = round(tgt["x0"], 2)
    mp["corner_x1_px"] = round(tgt["x1"], 2)
    mp["horizon_y_px"] = round(tgt["vy"], 1)
    if mp.get("capping_above_floor_px") is not None:
        mp["capping_above_floor_px"] = int(round(
            mp["capping_above_floor_px"] * declared["ppm"] / declared["source_ppm"]))

    openings, skew_max = [], 0.0
    for o in (doc.get("_measured_px") or {}).get("openings") or []:
        ax0, ay0, ax1, ay1, skew = _rect(src, tgt, o["x0_px"], o["y0_px"],
                                         o["x1_px"], o["y1_px"])
        skew_max = max(skew_max, skew)
        w = ax1 - ax0
        z = dict(o)
        z.update(x0_px=int(round(ax0)), x1_px=int(round(ax1)),
                 y0_px=int(round(ay0)), y1_px=int(round(ay1)),
                 width_px=int(round(w)), width_m=round(w / ppm_t, 3),
                 centre_px=round((ax0 + ax1) / 2.0, 1),
                 head_m=round((floor_t - ay0) / ppm_t, 3),
                 _snap="transformed through the facing wall's own map")
        openings.append(z)
    mp["openings"] = openings
    d["_measured_px"] = mp
    if doc.get("_openings_read"):
        d["_openings_read"] = dict(doc["_openings_read"],
                                   wall_band_px=[int(round(tgt["x0"])), int(round(tgt["x1"]))],
                                   _snap=("read off the pre-snap frame and carried "
                                          "through the warp; --acceptance re-reads it"))

    carriers = []
    for c in doc.get("_carriers") or []:
        z = dict(c)
        for a, b2 in (("asked_x0", "asked_x1"), ("x0", "x1")):
            if z.get(a) is not None and z.get(b2) is not None:
                nx0, _ = _pt(src, tgt, z[a], floor_src_of(doc))
                nx1, _ = _pt(src, tgt, z[b2], floor_src_of(doc))
                z[a], z[b2] = round(nx0, 2), round(nx1, 2)
        if isinstance(z.get("window"), (list, tuple)) and len(z["window"]) == 2:
            wx0, _ = _pt(src, tgt, z["window"][0], floor_src_of(doc))
            wx1, _ = _pt(src, tgt, z["window"][1], floor_src_of(doc))
            z["window"] = [int(round(wx0)), int(round(wx1))]
        z["_snap"] = ("positions transformed; the FINDING is the pre-snap "
                      "detector's — re-run --acceptance for a post-snap one")
        carriers.append(z)
    d["_carriers"] = carriers

    d["_derived"] = dict(doc.get("_derived") or {},
                         eye_height_m=d["eye_height_m"],
                         storey_height_m=d["storey_height_m"],
                         implied_wall_width_m=d["wall_width_m"],
                         px_per_m_at_bottom=round((imh - tgt["vy"]) / target_eye, 4),
                         implied_camera_wall_m=round(imh / ppm_t, 4))
    d["_withheld_because"] = []
    d["_hold_family"] = None
    d["verdict"] = "SNAPPED"
    d["_snap"] = extras["record"]
    d["_snap"]["opening_rect_skew_px"] = round(skew_max, 4)
    return d


def floor_src_of(doc):
    """The source frame's own floor row — the row a wall-plane column is read at.

    A carrier's x is a column on the WALL PLANE, so it is carried across at the
    wall plane. Any row inside the wall region gives the same answer (the map
    there is a similarity, which does not mix x with y); the floor line is used
    because it is the row every one of these numbers was measured against.
    """
    return float((doc.get("_measured_px") or {})["wall_floor_line_y_px"])


# ------------------------------------------------------------------ the pilot

def draw_marks(rgb, b, colour_box=(255, 64, 64), colour_ray=(64, 200, 255)):
    """The box and its four rays, drawn on a copy. Deterministic, no model."""
    im = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8)).convert("RGB")
    from PIL import ImageDraw
    dr = ImageDraw.Draw(im)
    x0, x1, yc, yf = b["x0"], b["x1"], b["yc"], b["yf"]
    vx, vy = b["vx"], b["vy"]
    dr.rectangle([x0, yc, x1, yf], outline=colour_box, width=3)
    for cx, cy in ((x0, yc), (x1, yc), (x0, yf), (x1, yf)):
        dx, dy = cx - vx, cy - vy
        dr.line([cx, cy, vx + dx * 12, vy + dy * 12], fill=colour_ray, width=2)
    dr.line([0, vy, W, vy], fill=(255, 220, 0), width=2)
    dr.line([0, yf, W, yf], fill=(120, 255, 120), width=1)
    dr.ellipse([vx - 7, vy - 7, vx + 7, vy + 7], outline=(255, 220, 0), width=3)
    return im


def write_png(path, arr):
    os.makedirs(os.path.dirname(os.path.abspath(path)) or ".", exist_ok=True)
    Image.fromarray(np.clip(np.round(arr), 0, 255).astype(np.uint8)).save(path)


# ------------------------------------------------------------------- the snap

def snap_wall(key, candidate, target_eye=None, vp_mode="auto",
              reveal_budget=DEFAULT_REVEAL_BUDGET_PX,
              stretch_budget=DEFAULT_STRETCH_BUDGET, reading=None):
    """One wall, arrival to rectified frame. Returns (result, refusal).

    `--vp auto` IS TWO ATTEMPTS AND THE RECORD SAYS SO. A frame can fix a
    convergence that is statistically tight and still be a frame the correction
    ruins: `kitchen/W`'s two returns are 64 px slivers at the edges of an
    almost flat-on wall, its ramps fit to a third of a pixel, and snapping the
    0.271 m eye they imply onto the standing camera magnifies the floor 4.9x
    and asks for 196 px of reveal. So when the measured convergence's own snap
    exceeds a budget, `auto` tries again from the DECLARED principal point —
    the same construction with the frame's perspective taken as already right,
    which still corrects the scale and the floor line — and writes into
    `source_anchors.vanishing_point_why` exactly what the first attempt cost.
    Nothing is silent. `--vp measured` refuses instead of falling back, for a
    caller who wants the strict answer.
    """
    if reading is None:
        # Measured ONCE, here, so a second attempt costs the warp and not the
        # instrument — the whole latency claim is one generation plus seconds.
        _e, _side, _cfg, _ref, _decl = wall_context(key)
        path = os.path.join(ROOT, candidate)
        if not os.path.exists(path):
            return None, "no candidate at " + candidate
        reading = measure(path, _side, _cfg, _ref)
    r, why, clause = _snap_once(key, candidate, target_eye, vp_mode,
                                reveal_budget, stretch_budget, reading)
    # THE RETRY ROUTES ON THE CLAUSE, NOT ON THE SENTENCE. This read the ledger
    # token back out of the refusal prose, which is two defects in one line: a
    # caller deciding a route by substring-matching a message it also formats,
    # and a second occurrence of a token whose whole discipline (guards.spec's
    # ledger) is one token, one emit site. The clause name is what the emit site
    # already knows; it is returned beside the sentence and the token appears
    # exactly once, where it is emitted.
    if r is not None or vp_mode != "auto" or clause not in BUDGET_CLAUSES:
        return r, why
    r2, why2, _ = _snap_once(key, candidate, target_eye, "declared",
                             reveal_budget, stretch_budget, reading)
    if r2 is None:
        return None, ("the measured convergence's snap is over budget (%s) and "
                      "the declared one is too (%s)" % (why, why2))
    r2["source_notes"]["vanishing_point_why"] = (
        "the measured convergence was tried first and its snap was over "
        "budget: " + why)
    return r2, None


def _snap_once(key, candidate, target_eye, vp_mode, reveal_budget,
               stretch_budget, reading):
    """(result, refusal sentence, clause name). The clause is None on a pass and
    on every refusal that is not one of `BUDGET_CLAUSES` — a wall the snap has
    nothing to offer is not the same event as a correction it can price."""
    e, side, cfg, ref, declared = wall_context(key)
    if declared["facing_type"] == "open":
        return None, ("%s is an open facing: it has no wall plane, no ceiling "
                      "and no side walls, so there are no five planes to "
                      "rectify. A vista's geometry is the far-line ruler's and "
                      "this tool has nothing to say about it" % key), None
    if declared["camera_m"] is None:
        return None, ("%s names neither camera_wall_m nor camera_far_m, so its "
                      "scale converts to no lens and no target camera can be "
                      "built" % key), None
    path = os.path.join(ROOT, candidate)
    if not os.path.exists(path):
        return None, "no candidate at " + candidate, None
    if reading is None:
        reading = measure(path, side, cfg, ref)
    if reading.get("verdict") == "WITHHELD":
        return None, ("the instrument could not run on this frame at all: %s"
                      % reading.get("blocked_on")), None
    declared["source_ppm"] = reading.get("px_per_m_at_wall")

    src, notes, why = source_box(reading, declared, vp_mode)
    if src is None:
        return None, why, None
    eye_t = declared["eye_m"] if target_eye is None else float(target_eye)
    tgt, tnotes, why = target_box(src, declared, eye_t)
    if tgt is None:
        return None, why, None

    res = residuals(src, tgt, declared, eye_t)
    mag = magnification(src, tgt)
    if mag["max_magnification"] > stretch_budget:
        worst = max((r for r in REGIONS if mag["per_region"][r]),
                    key=lambda r: mag["per_region"][r]["max_magnification"])
        return None, (
            "the correction this frame needs magnifies its %s by %.2fx, past "
            "the %.2fx budget — the painting does not hold enough of that "
            "surface for the camera it is being snapped to, and stretching it "
            "there would invent detail rather than move it "
            "[row35:snap.stretch_budget]"
            % (worst, mag["max_magnification"], stretch_budget)), STRETCH_CLAUSE

    rgb = load(path)
    after, edge = snap_frame(rgb, src, tgt)
    if edge["unplaced_pixels"]:
        return None, ("%d pixels of the output frame lie on none of the five "
                      "planes, which means the target box is not a box"
                      % edge["unplaced_pixels"]), None
    if edge["max_overshoot_px"] > reveal_budget:
        return None, (
            "rectifying this frame reveals %.1f px beyond its own edge, past "
            "the %.1f px budget — the corners pull in far enough that the snap "
            "would be painting wall the generator never drew "
            "[row35:snap.reveal_budget]"
            % (edge["max_overshoot_px"], reveal_budget)), REVEAL_CLAUSE

    return dict(facing=key, candidate=candidate, reading=reading,
                side=side, cfg=cfg, ref=ref, declared=declared,
                source_box=src, target_box=tgt, source_notes=notes,
                target_notes=tnotes, residuals=res, magnification=mag,
                edge=edge, before=rgb, after=after,
                budgets=dict(reveal_px=reveal_budget, stretch=stretch_budget)), None, None


def snap_record(r):
    """What the tool asserts about a snap, in one block a reader can audit."""
    return {
        "_what_this_is": (
            "the row-35 snap of %s: a five-plane planar rectification of %s "
            "onto the camera its own scaffold declares. Deterministic, no "
            "model in the loop. The source box is the reading the row-23 gate "
            "took of this same frame; the target box is that camera with the "
            "painted room's own proportions carried across."
            % (r["facing"], r["candidate"])),
        "tool": "design/plan-draft/measured/row35_snap.py",
        "source_box": r["source_box"],
        "target_box": r["target_box"],
        "source_anchors": r["source_notes"],
        "target": r["target_notes"],
        "residuals": r["residuals"],
        "magnification": r["magnification"],
        "edge_reveal": r["edge"],
        "budgets": r["budgets"],
    }


# --------------------------------------------------------------- self-checks

def seam_samples(src, tgt, n=64):
    """Both regions' mappings of the same shared edge, for every shared edge.

    The point of the list is that a test computes the disagreement rather than
    being told there is none. Each entry names the two regions, the edge, and
    the two source coordinates each of them maps the same target point to.
    """
    edges = [
        ("wall", "left", "u=0, t=1"),
        ("wall", "right", "u=1, t=1"),
        ("wall", "floor", "h=0, t=1"),
        ("wall", "ceiling", "h=1, t=1"),
        ("floor", "left", "u=0 on the floor, h=0 on the return"),
        ("floor", "right", "u=1 on the floor, h=0 on the return"),
        ("ceiling", "left", "u=0 on the ceiling, h=1 on the return"),
        ("ceiling", "right", "u=1 on the ceiling, h=1 on the return"),
    ]
    s = np.linspace(0.0, 1.0, n)
    out = []
    for a, b, label in edges:
        if a == "wall":
            if b in ("left", "right"):
                p = np.zeros(n) if b == "left" else np.ones(n)
                ta = image(tgt, "wall", p, s)
                sa = image(src, "wall", p, s)
                tb = image(tgt, b, s, np.ones(n))
                sb = image(src, b, s, np.ones(n))
            else:
                h = np.zeros(n) if b == "floor" else np.ones(n)
                ta = image(tgt, "wall", s, h)
                sa = image(src, "wall", s, h)
                tb = image(tgt, b, s, np.ones(n))
                sb = image(src, b, s, np.ones(n))
        else:
            # a floor/ceiling meeting a return: one line in space, reached with
            # u pinned on the horizontal plane and h pinned on the return, and
            # the SAME depth t on both.
            t = np.linspace(0.05, 1.0, n)
            u = np.zeros(n) if b == "left" else np.ones(n)
            h = np.zeros(n) if a == "floor" else np.ones(n)
            ta = image(tgt, a, u, t)
            sa = image(src, a, u, t)
            tb = image(tgt, b, h, t)
            sb = image(src, b, h, t)
        out.append({
            "edge": "%s|%s" % (a, b), "shared": label,
            "target_a": [list(map(float, ta[0])), list(map(float, ta[1]))],
            "target_b": [list(map(float, tb[0])), list(map(float, tb[1]))],
            "source_a": [list(map(float, sa[0])), list(map(float, sa[1]))],
            "source_b": [list(map(float, sb[0])), list(map(float, sb[1]))],
        })
    return out


def roundtrip_samples(src, tgt, n=40, seed=35):
    """Target -> source -> target on points scattered over every region.

    A homography recovered is a homography inverted: the composition of the
    backward map with the forward one is the identity, and the residual is what
    a test reads. The scatter is a fixed grid rather than a random draw so the
    numbers are the same on every machine.
    """
    g = np.linspace(0.5, 0.5, 1)
    xs, ys = np.meshgrid(np.linspace(2, W - 3, n), np.linspace(2, H - 3, n))
    xs, ys = xs.ravel() + g, ys.ravel()
    sx, sy, idx = map_points(src, tgt, xs, ys)
    bx, by, idx2 = forward(src, tgt, sx, sy)
    ok = np.isfinite(bx) & np.isfinite(by) & (idx >= 0)
    err = np.hypot(bx[ok] - xs[ok], by[ok] - ys[ok])
    return {"points": int(ok.sum()), "max_error_px": float(err.max()),
            "mean_error_px": float(err.mean()),
            "regions_used": sorted(set(int(i) for i in idx[ok]))}


def synthetic_room(b, ppm, camera_m, seed=35):
    """A deterministic painted room, drawn FROM a box. numpy only.

    It exists so the acceptance test has a frame whose true geometry is known
    rather than measured: the texture is laid out in each plane's own surface
    coordinates, so the picture is a correct one-point view of a room by
    construction and the row-23 instrument has real features to read —

      the facing wall   panel stiles every 0.80 m and rails every 0.70 m, all
                        axis-aligned, with the chair-rail's undercut shadow a
                        dark band with its top edge 0.95 m above the floor line
      the returns       the same panelling in (depth, height), so it projects
                        OBLIQUE and `wall_recession` can find the corners
      the floor         boards across, seams every 0.25 m
      the ceiling       plain, dark, with the junction step against the wall
    """
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float64)
    idx, p, q = assign(b, xs, ys)
    storey_m = (b["yf"] - b["yc"]) / ppm
    width_m = (b["x1"] - b["x0"]) / ppm
    eye_m = (b["yf"] - b["vy"]) / ppm
    L = np.zeros((H, W))

    def panels(a_m, h_m):
        v = 150.0 + 8.0 * np.cos(2 * np.pi * a_m / 0.80)
        v = v - 26.0 * (np.abs(((a_m / 0.80) % 1.0) - 0.5) > 0.44)
        v = v - 22.0 * (np.abs(((h_m / 0.70) % 1.0) - 0.5) > 0.44)
        # THE CHAIR-RAIL'S UNDERCUT, and it is drawn for the rule that reads it:
        # `module_in_bands` takes the DARKEST row in the rail bracket, so the
        # darkest row of this notch is placed at exactly 0.95 m and the notch
        # falls away either side of it. A wide flat dark band would be read
        # anywhere inside itself and the frame's own ruler would be a guess.
        v = v - 90.0 * np.exp(-((h_m - 0.95) / 0.012) ** 2)
        v = v + 55.0 * np.exp(-((h_m - 1.02) / 0.012) ** 2)
        return v

    # `h` is 0 at the FLOOR line and 1 at the ceiling in both parameterisations
    # — the wall's second parameter and the returns' first — so a height above
    # the floor is `h * storey`, which is what the chair-rail is measured in.
    m = idx == REGIONS.index("wall")
    L[m] = panels(p[m] * width_m, q[m] * storey_m)
    for side_name in ("left", "right"):
        m = idx == REGIONS.index(side_name)
        # depth from the camera, so the panelling recedes with the surface
        L[m] = panels(q[m] * camera_m, p[m] * storey_m) * 0.86
    m = idx == REGIONS.index("floor")
    # DEPTH FROM THE WALL, not from the camera, because the shadow below is a
    # fact about the wall's foot. `q` is Z / camera-to-wall, so the wall plane
    # is q = 1 and the camera is q = 0.
    from_wall = (1.0 - q[m]) * camera_m
    # THE SHADOW AT THE WALL'S FOOT, drawn for the rule that reads it:
    # `pick_floor` takes the luminance MINIMUM inside the floor bracket, so the
    # floor is darkest exactly at the junction and lightens monotonically away
    # from it — one row can be the answer whatever the resampling does to it,
    # where a one-pixel seam is gone the moment the floor is magnified. The
    # board seams start beyond the shadow so that nothing competes with it
    # inside the bracket.
    L[m] = (96.0 - 52.0 * np.exp(-from_wall / 0.55) +
            14.0 * np.cos(2 * np.pi * from_wall / 0.25) * (from_wall > 1.2) -
            18.0 * ((np.abs(((p[m] * width_m / 0.30) % 1.0) - 0.5) > 0.47) &
                    (from_wall > 1.2)))
    m = idx == REGIONS.index("ceiling")
    L[m] = 62.0 + 6.0 * np.cos(2 * np.pi * (q[m] * camera_m) / 0.90)
    del eye_m
    rgb = np.stack([L * 1.02, L * 0.96, L * 0.84], axis=-1)
    return np.clip(rgb, 0, 255)


# --------------------------------------------------------------------- the CLI

def _state_candidate(key):
    if not os.path.exists(STATE):
        return None
    return (json.load(open(STATE))["walls"].get(key) or {}).get("candidate")


def sweep(statuses=("held", "retry", "parked"), acceptance=True, out=None):
    """Every wall the production loop is holding, snapped and re-measured.

    IT WRITES NOTHING INTO THE STORE AND IT MOVES NOTHING IN THE RUN STATE. The
    routing — which snapped wall the loop promotes, and what a refusal costs it
    — is the follow-on the Navigator sequences after this row is judged. What
    this is, is the doctrine's own evidence: how many held walls the snap
    corrects, what each correction costs in magnification and reveal, what the
    standing instrument says about the result, and how long a wall takes from
    the frame being on disk to the reading being written.
    """
    state = json.load(open(STATE))["walls"]
    keys = sorted(k for k, v in state.items()
                  if v.get("status") in statuses and v.get("candidate"))
    rows, t_all = [], time.time()
    for key in keys:
        cand = state[key]["candidate"]
        t0 = time.time()
        try:
            r, why = snap_wall(key, cand)
        except Exception as ex:                       # one bad wall is one row
            rows.append(dict(facing=key, candidate=cand, snapped=False,
                             error=str(ex)[:300], seconds=round(time.time() - t0, 2)))
            continue
        if r is None:
            rows.append(dict(facing=key, candidate=cand, snapped=False,
                             was_holding=state[key].get("hold_family"),
                             refused=why, seconds=round(time.time() - t0, 2)))
            continue
        row = dict(facing=key, candidate=cand, snapped=True,
                   was_holding=state[key].get("hold_family"),
                   vanishing_point=r["source_notes"]["vanishing_point"],
                   eye_source_m=r["residuals"]["eye_source_m"],
                   eye_target_m=r["residuals"]["eye_target_m"],
                   scale_k=r["residuals"]["scale_k"],
                   max_magnification=r["magnification"]["max_magnification"],
                   max_overshoot_px=r["edge"]["max_overshoot_px"])
        if acceptance:
            tmp = os.path.join(HERE, "_sweep-frame.png")
            write_png(tmp, r["after"])
            try:
                acc = measure(tmp, r["side"], r["cfg"], r["ref"])
            finally:
                os.remove(tmp)
            s = acceptance_summary(acc, r)
            row["acceptance"] = {k: s[k] for k in
                                 ("verdict", "hold_family", "delta_focal_pct",
                                  "delta_eye_pct", "ramp_eye_m")}
            row["acceptance"]["ramp_y"] = (s.get("ramp") or {}).get("y")
        row["seconds"] = round(time.time() - t0, 2)
        timings.record("snap.wall", t0, time.time(), key,
                       {"candidate": cand, "refused": False, "sweep": True,
                        "vp": row["vanishing_point"],
                        "max_magnification": row["max_magnification"]})
        rows.append(row)
    snapped = [r for r in rows if r.get("snapped")]
    clean = [r for r in snapped
             if r.get("acceptance", {}).get("verdict") == "PASS"
             and not r.get("acceptance", {}).get("hold_family")]
    doc = {
        "_what_this_is": (
            "every wall the manor loop is holding, put through the row-35 snap "
            "and then back through the row-23 instrument. Nothing was promoted, "
            "nothing was written into the store and no run-state row moved."),
        "statuses": list(statuses),
        "walls": len(rows), "snapped": len(snapped), "refused": len(rows) - len(snapped),
        "clean_after_snap": len(clean),
        "clean_facings": [r["facing"] for r in clean],
        "seconds_total": round(time.time() - t_all, 1),
        "seconds_per_wall_median": round(
            sorted(r["seconds"] for r in rows)[len(rows) // 2], 2) if rows else None,
        "rows": rows,
    }
    if out:
        _emit(out, doc)
    return doc


def _emit(path, obj):
    if not path:
        return
    os.makedirs(os.path.dirname(os.path.abspath(path)) or ".", exist_ok=True)
    with open(path, "w") as fh:
        json.dump(obj, fh, indent=2, default=float)
        fh.write("\n")


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--facing", help="<loc>/<F>")
    ap.add_argument("--candidate", default="",
                    help="the png; the run state's own candidate when omitted")
    ap.add_argument("--out", default="", help="where the snapped png goes")
    ap.add_argument("--round", default="row35snap",
                    help="the measurement round directory the rewritten "
                         "reading is written into, for --round on the promotion")
    ap.add_argument("--doc-out", default="",
                    help="the rewritten reading; the round's own path when omitted")
    ap.add_argument("--target-eye", type=float, default=None,
                    help="the eye height the snap targets, in metres. Defaults "
                         "to the eye this facing's own scaffold declares "
                         "[HUMAN: \"Maybe skew the eye height in some creative "
                         "way too?\"]")
    ap.add_argument("--vp", default="auto", choices=("auto", "measured", "declared"))
    ap.add_argument("--reading", default="",
                    help="a row-23 reading of this candidate to use as the "
                         "input geometry instead of taking one now. It must be "
                         "a reading of THIS candidate through THIS wall's own "
                         "windows; the batch's `before-reading.json` is one")
    ap.add_argument("--reveal-budget-px", type=float, default=DEFAULT_REVEAL_BUDGET_PX)
    ap.add_argument("--stretch-budget", type=float, default=DEFAULT_STRETCH_BUDGET)
    ap.add_argument("--batch", default="",
                    help="a directory to write before/after frames, marked "
                         "frames and both readings into")
    ap.add_argument("--acceptance", action="store_true",
                    help="re-measure the snapped frame on the standing "
                         "instrument and report; never a gate")
    ap.add_argument("--json", default="", help="write the snap record here")
    ap.add_argument("--emit-seams", action="store_true")
    ap.add_argument("--emit-roundtrip", action="store_true")
    ap.add_argument("--synthetic-acceptance", action="store_true",
                    help="draw a room at a wrong camera, snap it, and re-measure")
    ap.add_argument("--sweep", default="",
                    help="snap and re-measure EVERY wall the loop is holding, "
                         "writing the record here. Promotes nothing, writes "
                         "nothing into the store and moves no run-state row")
    a = ap.parse_args()

    if a.synthetic_acceptance:
        return synthetic_acceptance()
    if a.sweep:
        doc = sweep(out=a.sweep)
        for r in doc["rows"]:
            if r.get("snapped"):
                acc = r.get("acceptance") or {}
                print("  %-22s %-24s mag %5.2f rev %6.1f | %-5s %-18s "
                      "focal %+6.2f eye %+6.2f  %5.1fs"
                      % (r["facing"], r["vanishing_point"], r["max_magnification"],
                         r["max_overshoot_px"], acc.get("verdict"),
                         acc.get("hold_family") or "-",
                         acc.get("delta_focal_pct") or 0.0,
                         acc.get("delta_eye_pct") or 0.0, r["seconds"]))
            else:
                print("  %-22s REFUSED %s"
                      % (r["facing"], (r.get("refused") or r.get("error"))[:120]))
        print("%d walls: %d snapped, %d refused, %d re-measure clean; %.0fs total, "
              "%.1fs median" % (doc["walls"], doc["snapped"], doc["refused"],
                                doc["clean_after_snap"], doc["seconds_total"],
                                doc["seconds_per_wall_median"]))
        return 0
    if not a.facing:
        ap.error("--facing is required")

    cand = a.candidate or _state_candidate(a.facing)
    if not cand:
        raise SystemExit("snap refused: no candidate given and the run state "
                         "names none for " + a.facing)

    t0 = time.time()
    given = None
    if a.reading:
        # THE READING MUST BE OF THE CANDIDATE BEING SNAPPED. It is the warp's
        # input geometry, so a reading of a neighbouring roll would rectify this
        # picture onto another one's corners in silence. `promote-backdrop.mjs`
        # enforces the same rule one tier down for the same reason; this is it
        # one tier up.
        given = json.load(open(a.reading))
        want = given.get("_of_candidate")
        if want is not None and want != cand:
            raise SystemExit("snap refused: %s is a reading of %s, not of %s"
                             % (a.reading, want, cand))
        want = given.get("_of_candidate_sha256")
        got = sha256(os.path.join(ROOT, cand))
        if want is not None and want != got:
            raise SystemExit(
                "snap refused: %s was taken off a different image — it records "
                "sha256 %s… and %s is %s…"
                % (a.reading, want[:12], cand, got[:12]))
    r, why = snap_wall(a.facing, cand, target_eye=a.target_eye, vp_mode=a.vp,
                       reveal_budget=a.reveal_budget_px,
                       stretch_budget=a.stretch_budget, reading=given)
    if r is None:
        timings.record("snap.wall", t0, time.time(), a.facing,
                       {"candidate": cand, "refused": True, "why": why[:300]})
        print("snap refused: %s: %s" % (a.facing, why))
        return 1

    if a.emit_seams or a.emit_roundtrip:
        out = {}
        if a.emit_seams:
            out["seams"] = seam_samples(r["source_box"], r["target_box"])
        if a.emit_roundtrip:
            out["roundtrip"] = roundtrip_samples(r["source_box"], r["target_box"])
        print(json.dumps(out))
        return 0

    loc, fac = a.facing.split("/")
    out_png = a.out or os.path.join(ROOT, "design", "batches", "row35-snap",
                                    "%s-%s" % (loc, fac), "after.png")
    write_png(out_png, r["after"])
    rel_out = os.path.relpath(os.path.abspath(out_png), ROOT)

    doc, _refusals = row23_lib.promotion_doc(
        r["reading"], dict(r["side"], candidate=cand), r["ref"], a.round,
        sha256(os.path.join(ROOT, cand)))
    if doc is None:
        print("snap refused: %s: the reading carries no scale, so there is "
              "nothing for a meta to be a meta of" % a.facing)
        return 1
    import door_measure
    plan = json.load(open(PLAN))
    tmp_doc = os.path.join(os.path.dirname(os.path.abspath(out_png)), "_pre-snap.json")
    _emit(tmp_doc, doc)
    try:
        door_measure.patch(tmp_doc, os.path.join(ROOT, cand), loc, plan)
        doc = json.load(open(tmp_doc))
    finally:
        if os.path.exists(tmp_doc):
            os.remove(tmp_doc)

    rec = snap_record(r)
    rec["source_candidate"] = cand
    rec["source_candidate_sha256"] = sha256(os.path.join(ROOT, cand))
    out_doc = transform_doc(doc, r["source_box"], r["target_box"], r["declared"],
                            r["target_notes"]["target_eye_m"], r["after"],
                            dict(ref=r["ref"], record=rec))
    out_doc["_source_sha256"] = sha256(out_png)
    out_doc["_what_this_is"] = (
        "The row-35 SNAPPED reading for %s, measured off %s by "
        "design/plan-draft/measured/row23_lib.py through the row-23 instrument "
        "and then rectified onto this facing's declared camera by "
        "design/plan-draft/measured/row35_snap.py. The image it describes is "
        "%s. Every search window is the wall's own scaffold's, declared in "
        "design/batches/row23-scaffold/manor/manifest.json before any candidate "
        "existed; every coordinate below is post-snap."
        % (a.facing, cand, rel_out))
    out_doc["_round"] = a.round
    doc_out = a.doc_out or os.path.join(HERE, a.round, "%s-%s.json" % (loc, fac))
    _emit(doc_out, out_doc)

    acc = None
    if a.acceptance:
        acc = measure(out_png, r["side"], r["cfg"], r["ref"])
        rec["acceptance"] = acceptance_summary(acc, r)
        # THE DOORS, RE-READ ON THE SNAPPED FRAME BESIDE THE TRANSFORMED ONES.
        # The module docstring says re-detection would be honester here and
        # that the transform is used for the latency; this is that claim made
        # checkable rather than asserted. The re-read goes into the REPORT and
        # never into the reading the promotion takes.
        rec["acceptance"]["doors"] = door_check(out_png, out_doc, loc, plan)
    if a.json:
        _emit(a.json, rec)

    if a.batch:
        os.makedirs(a.batch, exist_ok=True)
        write_png(os.path.join(a.batch, "before.png"), r["before"])
        write_png(os.path.join(a.batch, "after.png"), r["after"])
        draw_marks(r["before"], r["source_box"]).save(
            os.path.join(a.batch, "before-marked.png"))
        draw_marks(r["after"], r["target_box"]).save(
            os.path.join(a.batch, "after-marked.png"))
        _emit(os.path.join(a.batch, "before-reading.json"),
              dict(r["reading"], _of_candidate=cand,
                   _of_candidate_sha256=rec["source_candidate_sha256"],
                   _what_this_is=(
                       "the row-23 reading of %s that was this snap's input "
                       "geometry — the measurement the gate takes, through this "
                       "wall's own scaffold windows, before anything moved"
                       % cand)))
        _emit(os.path.join(a.batch, "after-reading.json"), acc or {})
        _emit(os.path.join(a.batch, "snap.json"), rec)

    t1 = time.time()
    timings.record("snap.wall", t0, t1, a.facing,
                   {"candidate": cand, "out": rel_out, "refused": False,
                    "vp": r["source_notes"].get("vanishing_point"),
                    "max_magnification": r["magnification"]["max_magnification"],
                    "max_overshoot_px": r["edge"]["max_overshoot_px"],
                    "acceptance": bool(a.acceptance)})
    print("snapped %s: %s -> %s in %.2fs" % (a.facing, cand, rel_out, t1 - t0))
    print("  vanishing point %s: (%.1f, %.1f) -> (%.1f, %.1f)"
          % (r["source_notes"]["vanishing_point"], r["source_box"]["vx"],
             r["source_box"]["vy"], r["target_box"]["vx"], r["target_box"]["vy"]))
    print("  eye %.3f -> %.3f m, scale %.2f -> %.2f px/m (k %.4f)"
          % (r["residuals"]["eye_source_m"], r["residuals"]["eye_target_m"],
             r["declared"]["source_ppm"], r["declared"]["ppm"],
             r["residuals"]["scale_k"]))
    print("  magnification max %.2fx (budget %.2f), edge reveal %.1f px on "
          "%.3f%% of the frame (budget %.1f)"
          % (r["magnification"]["max_magnification"], a.stretch_budget,
             r["edge"]["max_overshoot_px"], 100 * r["edge"]["extended_fraction"],
             a.reveal_budget_px))
    print("  reading -> %s" % os.path.relpath(doc_out, ROOT))
    if acc is not None:
        for line in acceptance_lines(rec["acceptance"]):
            print("  " + line)
    return 0


def acceptance_summary(acc, r):
    p = acc.get("_promotion") or {}
    d = r["declared"]
    eye_t = r["target_notes"]["target_eye_m"]
    return {
        "_what_this_is": (
            "the snapped frame put back through the SAME instrument, with the "
            "same scaffold windows and no band moved. Under the Captain's "
            "2026-08-24 ruling this is a report and not a gate."),
        "verdict": acc.get("verdict"), "kind": acc.get("kind"),
        "hold_family": p.get("hold_family"),
        "delta_focal_pct": acc.get("delta_focal_pct"),
        "delta_eye_pct": acc.get("delta_eye_pct"),
        "px_per_m_at_wall": acc.get("px_per_m_at_wall"),
        "floor_line_y_px": (acc.get("_measured_px") or {}).get("wall_floor_line_y_px"),
        "floor_window": (acc.get("_windows") or {}).get("floor"),
        "chair_rail_y_px": (acc.get("_measured_px") or {}).get("chair_rail_y_px"),
        "rail_band": (acc.get("_windows") or {}).get("rail"),
        "ramp": p.get("ramp"),
        "ramp_eye_m": p.get("eye_height_m"),
        "corner_x0_px": p.get("corner_x0_px"), "corner_x1_px": p.get("corner_x1_px"),
        "declared_horizon_px": d["horizon_px"],
        "declared_floor_px": d["floor_px"],
        "target_eye_m": eye_t,
        "withheld_because": p.get("withheld_because") or [],
        "absent": acc.get("_absent") or [],
    }


def door_check(png, out_doc, loc, plan):
    """The transformed door rectangles against a fresh read of the same frame.

    Both readings are of the SAME image; they differ only in whether the void
    was found before the warp and carried, or found after it. The distance
    between them is the honest size of what the transform costs — and where the
    pre-snap frame gave no void at all (a lit doorway rather than a dark one is
    the row-27 detector's standing blind spot, not the warp's), the re-read is
    the only reading there is and this says so.
    """
    import door_measure
    mp = out_doc["_measured_px"]
    fresh, note = door_measure.measure_openings(
        png, mp.get("corner_x0_px"), mp.get("corner_x1_px"),
        mp["wall_floor_line_y_px"], out_doc["px_per_m_at_wall"],
        door_measure.ruled_storey(plan, loc))
    carried = mp.get("openings") or []
    pairs = []
    for c in carried:
        near = min(fresh, key=lambda f: abs(f["centre_px"] - c["centre_px"]),
                   default=None)
        pairs.append({
            "carried": [c["x0_px"], c["x1_px"], c["y0_px"], c["y1_px"]],
            "re_read": ([near["x0_px"], near["x1_px"], near["y0_px"], near["y1_px"]]
                        if near else None),
            "centre_delta_px": (round(abs(near["centre_px"] - c["centre_px"]), 1)
                                if near else None),
            "width_delta_px": (abs(near["width_px"] - c["width_px"])
                               if near else None)})
    return {"_what_this_is": ("the doors the reading carries, transformed, "
                              "beside a fresh read of the snapped frame"),
            "carried": len(carried), "re_read": len(fresh),
            "pairs": pairs, "re_read_note": note}


def acceptance_lines(s):
    ramp = s.get("ramp") or {}
    out = [
        "ACCEPTANCE %s (%s) focal %+.2f%% eye %+.2f%%"
        % (s["verdict"], s.get("hold_family") or "no hold",
           s.get("delta_focal_pct") or 0.0, s.get("delta_eye_pct") or 0.0),
        "  floor line y %s in %s, chair-rail y %s in %s"
        % (s["floor_line_y_px"], s["floor_window"], s["chair_rail_y_px"], s["rail_band"]),
        "  ramp y %s (declared horizon %.1f) -> eye %s m"
        % (ramp.get("y"), s["declared_horizon_px"], s.get("ramp_eye_m")),
    ]
    d = s.get("doors")
    if d:
        out.append("  doors: %d carried, %d re-read on the snapped frame%s"
                   % (d["carried"], d["re_read"],
                      "".join("; centre %s px apart, width %s px apart"
                              % (p["centre_delta_px"], p["width_delta_px"])
                              for p in d["pairs"])))
    return out


def synthetic_acceptance():
    """A room drawn at a WRONG camera, snapped, and read by the instrument.

    The planted geometry is the whole point: nothing about this frame was
    measured before the snap chose its box, so what the instrument reads
    afterwards is a check on the construction rather than on a corpus.
    """
    ppm_s, ppm_t, camera_m = 128.0, 115.70621468926554, 8.85
    horizon = 526.1
    wrong = box(x0=120.0, x1=1420.0, yc=250.0, yf=690.0, vx=735.0, vy=612.0)
    rgb = synthetic_room(wrong, ppm_s, camera_m)
    declared = dict(ppm=ppm_t, camera_m=camera_m, horizon_px=horizon,
                    floor_px=horizon + 1.183 * ppm_t, eye_m=1.183,
                    corner_x0=None, corner_x1=None,
                    principal_x=768.0, wall_centre_x=768.0,
                    storey_m=2.8, wall_width_m=14.6, source_ppm=ppm_s,
                    facing="synthetic/N", facing_type="enclosed")
    tgt, tnotes, why = target_box(wrong, declared, declared["eye_m"])
    if tgt is None:
        raise SystemExit("synthetic: " + why)
    after, edge = snap_frame(rgb, wrong, tgt)
    out = {
        "planted_source_box": wrong,
        "target_box": tgt,
        "declared_horizon_px": horizon,
        "declared_floor_px": declared["floor_px"],
        "planted_eye_m": (wrong["yf"] - wrong["vy"]) / ppm_s,
        "target_eye_m": declared["eye_m"],
        "edge_reveal": edge,
        "residuals": residuals(wrong, tgt, declared, declared["eye_m"]),
        "roundtrip": roundtrip_samples(wrong, tgt),
        "seams": seam_samples(wrong, tgt),
    }
    out["read_before"] = _read_planted(rgb, wrong, ppm_s)
    out["read_after"] = _read_planted(after, tgt, ppm_t)
    print(json.dumps(out, default=float))
    return 0


def _read_planted(rgb, b, ppm):
    """The row-20/23 detectors run on a synthetic frame, through ITS own box.

    The windows are the box's own declared rows — the same construction
    `cfg_from_sidecar` uses on a real wall, at the standing +/-8 % band — so
    what comes back is the instrument's reading and not a search.
    """
    from measure import (pick_floor, module_in_bands, pick_ceiling,
                         find_corners_recession, ceiling_ramp_vp)
    L = luma(rgb)
    floor_y, yc = b["yf"], b["yc"]
    band = 0.08
    fw = band * (floor_y - b["vy"])
    cols = [(int(b["x0"] + 40), int(b["x0"] + 40 + 160)),
            (int(b["vx"] - 80), int(b["vx"] + 80)),
            (int(b["x1"] - 200), int(b["x1"] - 40))]
    cols = [(max(0, c[0]), min(W - 1, c[1])) for c in cols if c[1] > c[0]]
    fcfg = dict(floor_cols=cols,
                floor_range=(int(max(0, floor_y - 6 * fw)), int(min(H - 1, floor_y + 6 * fw))),
                floor_window=(int(floor_y - fw), int(floor_y + fw)))
    fy, _, _ = pick_floor(L, fcfg)
    rail_c = floor_y - 0.95 * ppm
    rb = band * 0.95 * ppm
    mod = module_in_bands(L, fy, (int(rail_c - rb), int(rail_c + rb)), cols)
    cy, cands, _ = pick_ceiling(L, dict(ceil_cols=cols, ceil_range=(8, int(yc + 60))))
    cx0, cx1, ev = find_corners_recession(L, cy, fy, b["vy"], ())
    ramp = None
    if cx0 is not None and cx1 is not None:
        best = None
        for c in cands:
            rr = ceiling_ramp_vp(L, c["y"] - 1, cx0, cx1, with_error=True)
            ok, _ = row23_lib._admissible(rr, c["y"] - 1, fy, band * (fy - b["vy"]))
            if ok and (best is None or rr["sigma_y_px"] < best["sigma_y_px"]):
                best = rr
        ramp = best
    rail_above = mod["dado_rail_above_floor_px"]
    return {"floor_line_y_px": int(fy), "chair_rail_y_px": int(mod["dado_rail_y_px"]),
            "dado_rail_above_floor_px": int(rail_above),
            "px_per_m_at_wall": round(rail_above / 0.95, 3),
            "ceiling_y_px": int(cy), "corner_x0_px": cx0, "corner_x1_px": cx1,
            "corner_evidence": ev, "ramp": ramp,
            "eye_m": (round((fy - ramp["y"]) / (rail_above / 0.95), 4)
                      if ramp and rail_above else None)}


if __name__ == "__main__":
    sys.exit(main())
