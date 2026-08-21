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


def locate_datum(closed_src, open_src, datum, search_px=None):
    """Find the closed image's datum patch in the open image. Pure.

    Normalized cross-correlation of the luminance patch over a search window.
    This is what makes two-state registration *derivable* rather than typed: a
    gate whose only input is the operator's own number certifies nothing, and
    clause (i) below has exactly one satisfying `origin.y`, so an operator who
    never opens the images and simply subtracts passes it every time.

    Returns `(dx, dy, peak)` — the offset from closed-source coordinates to
    open-source coordinates, and the correlation peak in [-1, 1].
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
    if pn < 1e-6:
        raise StateError("--state-datum names a featureless patch (zero variance): pick a "
                         "region with an edge in it, such as the door frame's inner jamb")
    reach = search_px if search_px is not None else max(a.shape) // 4
    best = (0, 0, -2.0)
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
            score = float((pc * wc).sum() / (pn * wn))
            if score > best[2]:
                best = (dx, dy, score)
    return best


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


def alignment_gate(origin, state_shape, body_shape):
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
    sh, sw = state_shape[0], state_shape[1]
    bh, bw = body_shape[0], body_shape[1]
    ox, oy = float(origin["x"]), float(origin["y"])

    bottom_err = abs(oy + sh - bh)
    bottom_tol = 0.02 * bh
    clause_i = bottom_err <= bottom_tol

    inside = (ox >= 0 and oy >= 0 and ox + sw <= bw and oy + sh <= bh)

    centre_dev = abs((ox + sw / 2.0) - bw / 2.0) / bw

    messages = []
    if not clause_i:
        messages.append(
            "(i) origin.y + state height = %g vs the body's bottom edge %d — off by %g px, "
            "over the 2%% of body height budget (%g px)" % (oy + sh, bh, bottom_err, bottom_tol))
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
                      "inside_body_canvas": True},
        "message": ("; ".join(messages) if messages else
                    "closed-frame alignment holds on clauses (i) and (ii); horizontal centre "
                    "deviation %.4f of body width. Clauses (i) and (ii) say nothing about x — "
                    "the `registration` gate beside this one is what checks it, by correlating "
                    "a datum present in both source images." % centre_dev),
    }


def registration_gate(declared, derived, peak, body_shape, cfg):
    """Does the operator's `--state-origin` agree with the datum the images show?

    This is the clause that gives the alignment gate content. Clause (i) of
    `alignment_gate` has exactly one satisfying `origin.y`, so it is passed by
    arithmetic; this one compares a typed number against one derived from the
    two images by correlation, **in both axes**, which is where the plan
    previously admitted x was unverifiable.
    """
    if derived is None:
        # passed=False deliberately. Absent a datum this gate measured nothing,
        # and an [ok] line is indistinguishable on the board from one that did.
        return {"id": "registration", "severity": "warn", "passed": False,
                "measured": {"derived": None, "verified": False},
                "threshold": dict(cfg),
                "message": "NOT VERIFIED — no --state-datum was given, so nothing checked the "
                           "typed --state-origin against the images. x and y registration rest "
                           "entirely on the operator and on the human eye at the flip batch. "
                           "Give --state-datum x0,y0,x1,y1 naming a feature visible in BOTH "
                           "state sources and this gate derives the origin itself."}
    bh, bw = body_shape[0], body_shape[1]
    ex = abs(declared["x"] - derived["x"]) / float(bw)
    ey = abs(declared["y"] - derived["y"]) / float(bh)
    ok = (peak >= cfg["min_correlation"] and
          ex <= cfg["max_offset_fraction"] and ey <= cfg["max_offset_fraction"])
    return {
        "id": "registration", "severity": "hard", "passed": bool(ok),
        "measured": {"declared": declared, "derived": derived,
                     "correlation_peak": round(float(peak), 4),
                     "dx_fraction_of_width": round(float(ex), 5),
                     "dy_fraction_of_height": round(float(ey), 5)},
        "threshold": dict(cfg),
        "message": ("the datum places the open state at (%.1f, %.1f); the declared origin agrees "
                    "within %.3f%% of width and %.3f%% of height (correlation %.3f)"
                    % (derived["x"], derived["y"], ex * 100, ey * 100, peak)) if ok else
                   ("the datum places the open state at (%.1f, %.1f) but --state-origin declares "
                    "(%.1f, %.1f) — off by %.2f%% of width and %.2f%% of height (correlation "
                    "%.3f). Either the origin was computed rather than measured, or the datum is "
                    "not the same feature in both images."
                    % (derived["x"], derived["y"], declared["x"], declared["y"],
                       ex * 100, ey * 100, peak)),
    }


def prepare_state(name, state_rgba, body_rgba, origin_xy, derived=None, peak=None, cfg=None):
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
    gate = alignment_gate(origin, state_rgba.shape, body_rgba.shape)
    reg = (registration_gate(origin, derived, peak, body_rgba.shape, cfg or {})
           if origin_xy is not None or derived is not None else None)
    return StateResult(name=name, rgba=state_rgba, origin=origin, gate=gate, registration=reg)
