"""Stage 3b — two-state swap sprites (blueprint §9.3b, as row 2 amended it).

The open image runs through stage 1 like the closed one; what row 3 has to
solve is the *registration* between two independently generated images, and the
honest answer is that geometry cannot supply it.

An earlier draft derived `origin` from the difference of the two trim offsets.
That is unsound: the contract's `framing.margin` is "full object centered", so
each image is centred on its **own** silhouette and the trim difference encodes
the silhouette difference, not where the door stands. §9.3b's own suggestion —
keep the door frame in frame as the registration datum — exists because
centring destroys the datum. So `--state-origin` is required, with no silent
default, and the datum-matching route is named as v2 rather than pretended.

Pure.
"""

from dataclasses import dataclass

import numpy as np

from . import imaging as im


class StateError(ValueError):
    """A state pair the flags or the images cannot support."""


def parse_datum(text):
    """`x0,y0,x1,y1` in the CLOSED source image's coordinates."""
    parts = text.split(",")
    if len(parts) != 4:
        raise StateError("--state-datum wants x0,y0,x1,y1, got %r" % text)
    try:
        v = tuple(int(round(float(p))) for p in parts)
    except ValueError:
        raise StateError("--state-datum: %r is not four numbers" % text)
    if not (v[0] < v[2] and v[1] < v[3]):
        raise StateError("--state-datum needs x0 < x1 and y0 < y1, got %r" % (v,))
    return v


def locate_datum(closed_src, open_src, datum, search_px=None, search_fraction=0.25):
    """Find the closed image's datum patch in the open image. Pure.

    Normalized cross-correlation of the luminance patch over a search window.
    This is what makes two-state registration *derivable* rather than typed: a
    gate whose only input is the operator's own number certifies nothing, and
    clause (i) below has exactly one satisfying `origin.y`, so an operator who
    never opens the images and simply subtracts passes it every time.

    Returns `(dx, dy, evidence)` where `evidence` carries the three numbers the
    registration gate judges:

      `peak`     the correlation at the winning offset, in [-1, 1]
      `contrast` the datum patch's own luminance standard deviation, 0..255
      `margin`   how far the winning peak stands above the best peak outside a
                 one-patch exclusion zone around it

    `contrast` and `margin` exist because **NCC divides contrast out**. A patch
    of near-uniform studio grey with a level of dither correlates at 1.000
    against any other patch of the same grey: `--state-datum 20,20,90,90` on the
    corpus desk — blank ground — returned correlation 1.000 at a wrong origin
    and the gate reported it green. The only guard was a zero-variance refusal
    at 1e-6, which no real image with dither ever trips, and the docstring's
    promise that "a flat patch has no variance to correlate on and is refused by
    name" was false. `margin` covers the second half of the same problem: a
    repeated moulding correlates equally well at several offsets, and the argmax
    among equals is arbitrary.

    Both are returned rather than raised on, so the failure lands as a named
    hard gate line in the report the autonomous lane reads, not as a traceback.
    """
    a = im.luminance(np.asarray(closed_src)[..., :3])
    b = im.luminance(np.asarray(open_src)[..., :3])
    x0, y0, x1, y1 = datum
    if not (0 <= x0 < x1 <= a.shape[1] and 0 <= y0 < y1 <= a.shape[0]):
        raise StateError("--state-datum %s lies outside the %dx%d closed source"
                         % (datum, a.shape[1], a.shape[0]))
    patch = a[y0:y1, x0:x1]
    ph, pw = patch.shape
    if ph < 4 or pw < 4:
        raise StateError("--state-datum is %dx%d — too small to correlate" % (pw, ph))
    pc = patch - patch.mean()
    pn = float(np.sqrt((pc * pc).sum()))
    contrast = float(patch.std())
    if pn < 1e-6:
        raise StateError("--state-datum names a featureless patch (zero variance): pick a "
                         "region with an edge in it, such as the door frame's inner jamb")
    reach = search_px if search_px is not None else int(max(a.shape) * search_fraction)
    span = 2 * reach + 1
    scores = np.full((span, span), -2.0)
    for dy in range(-reach, reach + 1):
        yy0, yy1 = y0 + dy, y1 + dy
        if yy0 < 0 or yy1 > b.shape[0]:
            continue
        for dx in range(-reach, reach + 1):
            xx0, xx1 = x0 + dx, x1 + dx
            if xx0 < 0 or xx1 > b.shape[1]:
                continue
            win = b[yy0:yy1, xx0:xx1]
            wc = win - win.mean()
            wn = float(np.sqrt((wc * wc).sum()))
            if wn < 1e-6:
                continue
            scores[dy + reach, dx + reach] = float((pc * wc).sum() / (pn * wn))
    flat = int(np.argmax(scores))
    by, bx = flat // span, flat % span
    peak = float(scores[by, bx])
    # The runner-up, outside a one-patch exclusion zone. Inside that zone the
    # correlation surface is the patch's own autocorrelation shoulder, which is
    # high by construction and says nothing about uniqueness; a genuine rival is
    # a second place the patch fits, at least a patch away.
    ex_y, ex_x = max(1, ph // 2), max(1, pw // 2)
    rivals = scores.copy()
    rivals[max(0, by - ex_y):by + ex_y + 1, max(0, bx - ex_x):bx + ex_x + 1] = -2.0
    runner = float(rivals.max())
    margin = peak - runner if runner > -2.0 else float(peak + 2.0)
    # A winner ON the edge of the search window is not evidence that the feature
    # was found; it is evidence that the window was too small and the true
    # displacement lies outside it. The correlation surface is still climbing.
    on_boundary = bool(bx in (0, span - 1) or by in (0, span - 1))
    return (bx - reach, by - reach,
            {"peak": peak, "contrast": round(contrast, 3),
             "runner_up": round(runner, 4) if runner > -2.0 else None,
             "margin": round(float(margin), 4),
             "search_reach_px": int(reach), "peak_on_search_boundary": on_boundary})


def origin_from_datum(offset, closed_trim, open_trim):
    """The state image's top-left in closed-sprite pixel space, from the datum.

    A point p in the closed source maps to p + offset in the open source. The
    open state image was trimmed at `open_trim` and the body at `closed_trim`,
    so the state image's top-left, expressed in body pixel space, is
    `open_trim - offset - closed_trim`.
    """
    dx, dy = offset[0], offset[1]
    return {"x": float(open_trim[0] - dx - closed_trim[0]),
            "y": float(open_trim[1] - dy - closed_trim[1])}


@dataclass(frozen=True)
class StateResult:
    name: str
    rgba: object
    origin: dict
    gate: dict
    registration: object = None


def parse_state_origin(text):
    """`name:x,y` -> (name, (x, y)) in closed-sprite (body) pixel space."""
    if ":" not in text:
        raise StateError("--state-origin wants NAME:x,y, got %r" % text)
    name, nums = text.split(":", 1)
    parts = nums.split(",")
    if len(parts) != 2:
        raise StateError("--state-origin %s wants two numbers x,y, got %r" % (name, nums))
    try:
        return name.strip(), (float(parts[0]), float(parts[1]))
    except ValueError:
        raise StateError("--state-origin %s: %r is not two numbers" % (name, nums))


def alignment_gate(origin, state_shape, body_shape, cfg=None):
    """The closed-frame alignment gate, per §9.3b as row 2 amended it.

    The original base-midpoint clause is deleted for swap sprites: a leaf swung
    near-flat moves its bottom-pixel midpoint to the hinge side by about a third
    of the sprite width, so that clause is unsatisfiable by the very open state
    blueprint §11 mandates.

      (i)  hard — origin.y + state height agrees with the body's bottom edge
           within 2% of body height.
      (ii) hard — the state's rect lies inside the body canvas.
      (iii) warn — how far the state's horizontal centre sits from the body's.

    **x registration is not verified by geometry in v1**, and this gate says so
    in its own report rather than leaving a reader to assume it is. Clause (ii)
    bounds it, clause (iii) surfaces a gross displacement, and correctness rides
    on the operator's datum and the human eye at row 4's batch.
    """
    cfg = cfg or {"bottom_edge_tolerance_fraction": 0.02}
    sh, sw = state_shape[0], state_shape[1]
    bh, bw = body_shape[0], body_shape[1]
    ox, oy = float(origin["x"]), float(origin["y"])

    bottom_err = abs(oy + sh - bh)
    bottom_tol = cfg["bottom_edge_tolerance_fraction"] * bh
    clause_i = bottom_err <= bottom_tol

    inside = (ox >= 0 and oy >= 0 and ox + sw <= bw and oy + sh <= bh)

    centre_dev = abs((ox + sw / 2.0) - bw / 2.0) / bw

    messages = []
    if not clause_i:
        messages.append(
            "(i) origin.y + state height = %g vs the body's bottom edge %d — off by %g px, "
            "over the %.1f%% of body height budget (%g px): the two state images are standing "
            "on different floors"
            % (oy + sh, bh, bottom_err,
               cfg["bottom_edge_tolerance_fraction"] * 100, bottom_tol))
    if not inside:
        messages.append(
            "(ii) the state rect (%g, %g)-(%g, %g) is not inside the %dx%d body canvas. "
            "This clause is true of M0's door and is NOT general: an open state whose "
            "silhouette exceeds the closed bbox — a raised chest lid — needs a licensed "
            "exception, not a wider tolerance."
            % (ox, oy, ox + sw, oy + sh, bw, bh))

    return {
        "id": "alignment",
        "severity": "hard",
        "passed": bool(clause_i and inside),
        "measured": {
            "origin": {"x": ox, "y": oy},
            "state_px": [int(sw), int(sh)],
            "body_px": [int(bw), int(bh)],
            "bottom_edge_error_px": round(float(bottom_err), 3),
            "horizontal_centre_deviation_fraction": round(float(centre_dev), 4),
        },
        "threshold": {"bottom_edge_error_px": round(float(bottom_tol), 3),
                      "bottom_edge_tolerance_fraction": cfg["bottom_edge_tolerance_fraction"],
                      "inside_body_canvas": True},
        "message": ("; ".join(messages) if messages else
                    "closed-frame alignment holds on clauses (i) and (ii); horizontal centre "
                    "deviation %.4f of body width. Clauses (i) and (ii) say nothing about x — "
                    "the `registration` gate beside this one is what checks it, by correlating "
                    "a datum present in both source images." % centre_dev),
    }


def registration_gate(declared, derived, evidence, body_shape, cfg, typed=True):
    """Is the open state's placement supported by something the operator did not
    also supply?

    HARD, and in two modes, neither of them a tautology:

    * **cross-check** (`typed`) — a typed `--state-origin` against an origin
      derived from the two source images by correlation, in BOTH axes. This is
      the clause that gives the alignment gate content: `alignment_gate`'s
      clause (i) has exactly one satisfying `origin.y`, so it is passed by
      arithmetic.
    * **datum evidence** (not `typed`) — when nothing was typed, the derived
      origin stands on its own and there is nothing to compare it to. The
      earlier code compared it to *itself* and printed "the declared origin
      agrees within 0.000% of width and 0.000% of height" for a declaration that
      was never made. What is judged instead is the quality of the evidence:
      the datum's contrast, the correlation peak, and the peak's margin over its
      best rival. Those are facts about the two images.

    Absent a datum entirely the gate is hard and fails. It was warn-only, so a
    swap sprite with a typed, unverified origin exited 0 — the gate could be
    walked past, which is the family this row keeps finding.
    """
    if derived is None:
        return {"id": "registration", "severity": "hard", "passed": False,
                "measured": {"derived": None, "verified": False, "mode": "none"},
                "threshold": dict(cfg),
                "message": "NOT VERIFIED — no --state-datum was given, so nothing checked where "
                           "the open state stands. A swap sprite's whole geometry is its "
                           "registration, and an unverified one is not a sprite that ships. "
                           "Give --state-datum x0,y0,x1,y1 naming a feature visible in BOTH "
                           "state sources (the door frame's inner jamb) and this gate derives "
                           "the origin and judges the evidence for it."}
    bh, bw = body_shape[0], body_shape[1]
    peak = float(evidence["peak"])
    contrast = float(evidence["contrast"])
    margin = float(evidence["margin"])
    clauses = []
    clauses.append(("datum contrast", contrast >= cfg["min_datum_contrast"],
                    contrast, cfg["min_datum_contrast"]))
    clauses.append(("correlation peak", peak >= cfg["min_correlation"],
                    round(peak, 4), cfg["min_correlation"]))
    clauses.append(("peak margin over its best rival", margin >= cfg["min_peak_margin"],
                    margin, cfg["min_peak_margin"]))
    clauses.append(("peak inside the search window (not on its edge)",
                    not evidence.get("peak_on_search_boundary"), 0, 1))
    measured = {"declared": declared if typed else None, "derived": derived,
                "correlation_peak": round(peak, 4),
                "datum_contrast": round(contrast, 3),
                "peak_margin": round(margin, 4),
                "runner_up": evidence.get("runner_up"),
                "mode": "cross_check" if typed else "datum_evidence"}
    if typed:
        ex = abs(declared["x"] - derived["x"]) / float(bw)
        ey = abs(declared["y"] - derived["y"]) / float(bh)
        measured["dx_fraction_of_width"] = round(float(ex), 5)
        measured["dy_fraction_of_height"] = round(float(ey), 5)
        clauses.append(("declared-vs-derived x", ex <= cfg["max_offset_fraction"],
                        round(ex, 5), cfg["max_offset_fraction"]))
        clauses.append(("declared-vs-derived y", ey <= cfg["max_offset_fraction"],
                        round(ey, 5), cfg["max_offset_fraction"]))
    failed = [c for c in clauses if not c[1]]
    if failed:
        msg = "; ".join("%s: measured %g against %g" % (c[0], c[2], c[3]) for c in failed)
        if any(c[0] == "datum contrast" for c in failed):
            msg += (" — normalized cross-correlation divides contrast out, so a patch this "
                    "flat matches any other patch of the same tone at a near-perfect peak. "
                    "Name a region with a real edge in it.")
        if any(c[0].startswith("peak inside") for c in failed):
            msg += (" — the correlation peak sits ON the edge of the %d px search window, so the "
                    "true displacement is probably outside it and this is not the feature. "
                    "Widen the search or pick a datum nearer where the object actually moved."
                    % evidence.get("search_reach_px", 0))
        if any(c[0].startswith("declared-vs-derived") for c in failed):
            msg += (" — either the origin was computed rather than measured, or the datum is "
                    "not the same feature in both images.")
    elif typed:
        msg = ("the datum places the open state at (%.1f, %.1f) and the declared origin agrees "
               "within %.3f%% of width and %.3f%% of height (correlation %.3f, contrast %.1f, "
               "margin %.3f)"
               % (derived["x"], derived["y"], measured["dx_fraction_of_width"] * 100,
                  measured["dy_fraction_of_height"] * 100, peak, contrast, margin))
    else:
        msg = ("no --state-origin was typed, so there is nothing to cross-check and this gate "
               "does not pretend otherwise: the origin (%.1f, %.1f) IS the datum's, and what is "
               "certified is the evidence for it — contrast %.1f, correlation %.3f, margin %.3f "
               "over its best rival. Placement in the room is still the eye's at the flip batch."
               % (derived["x"], derived["y"], contrast, peak, margin))
    return {"id": "registration", "severity": "hard", "passed": not failed,
            "measured": measured, "threshold": dict(cfg), "message": msg}


def prepare_state(name, state_rgba, body_rgba, origin_xy, derived=None, evidence=None,
                  cfg=None, alignment_cfg=None):
    """Register one matted state image against the closed body.

    `origin_xy` may be None when a datum supplied one — in which case the derived
    value is used and the registration gate records that nothing was typed.
    """
    if origin_xy is None and derived is None:
        raise StateError(
            "state %r has no registration. Two independently generated images are each centred "
            "on their own silhouette (contract framing.margin), so the difference of their trim "
            "offsets says nothing about where the object stands: there is no sound default. "
            "Give --state-datum x0,y0,x1,y1 naming a feature present in BOTH source images (the "
            "door frame's inner jamb), and the ingester derives the origin by correlation; or "
            "give --state-origin %s:X,Y in closed-sprite pixel space." % (name, name))
    origin = ({"x": float(origin_xy[0]), "y": float(origin_xy[1])} if origin_xy is not None
              else dict(derived))
    gate = alignment_gate(origin, state_rgba.shape, body_rgba.shape, cfg=alignment_cfg)
    reg = registration_gate(origin, derived, evidence, body_rgba.shape, cfg or {},
                            typed=origin_xy is not None)
    return StateResult(name=name, rgba=state_rgba, origin=origin, gate=gate, registration=reg)
