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


class StateError(ValueError):
    """A state pair the flags or the images cannot support."""


@dataclass(frozen=True)
class StateResult:
    name: str
    rgba: object
    origin: dict
    gate: dict


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
                    "closed-frame alignment holds on clauses (i) and (ii). "
                    "x registration is NOT verified by geometry at v1 — clause (ii) bounds it "
                    "and the horizontal centre deviation is %.4f of body width; correctness "
                    "rides on the --state-origin datum and the human eye at row 4."
                    % centre_dev),
    }


def prepare_state(name, state_rgba, body_rgba, origin_xy):
    """Register one matted state image against the closed body."""
    if origin_xy is None:
        raise StateError(
            "state %r has no --state-origin. Two independently generated images are each "
            "centred on their own silhouette (contract framing.margin), so the difference "
            "of their trim offsets says nothing about where the object stands: there is no "
            "sound default. Give --state-origin %s:X,Y in closed-sprite pixel space, "
            "measured from a datum present in both images (the door frame)." % (name, name))
    origin = {"x": float(origin_xy[0]), "y": float(origin_xy[1])}
    gate = alignment_gate(origin, state_rgba.shape, body_rgba.shape)
    return StateResult(name=name, rgba=state_rgba, origin=origin, gate=gate)
