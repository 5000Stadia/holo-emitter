"""Stage 5 — the blueprint §6 sprite record, as row 2 bound it.

Two things beyond §6's example, both [AI, row 3] completions in the same form as
row 2's `px`:

* **`measured`** — the sprite's own evidence for each of the intention's five
  decomposed qualities, gated or not. The source image is superseded at row 4
  and these numbers cannot be reconstructed afterwards, so the record carries
  them or nobody ever has them. Row 2's clause — *a record cannot lie about its
  own image* — generalizes here from px/base/footprint to the qualities.
* **`declared_unwitnessed`** — the contract assertions this record restates as
  fact that **no stage measures**. The row-2 finding was that every record
  declared `"light": "UL45"` as truth while the pixels said otherwise; the same
  shape applies to turn angle, view side, pitch, drawer-closed and props, and
  naming them is the difference between a declaration and a lie.

Pure: builds a dict, writes nothing.
"""

import math


class RecordError(ValueError):
    """A record the flags or the pixels cannot support."""


def _round(v, n=4):
    if isinstance(v, float):
        if math.isnan(v) or math.isinf(v):
            return None
        return round(v, n)
    return v


def _clean(obj, n=4):
    """Round floats recursively so the emitted JSON is byte-stable."""
    if isinstance(obj, dict):
        return {k: _clean(v, n) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_clean(v, n) for v in obj]
    return _round(obj, n)


def dims_cross_check(dims_m, px, turn_deg):
    """Warn-only: does the declared footprint match the drawn width?

    Deliberately never written into `dims_m`. Blueprint §5 says in terms that
    the project camera is unsettled — the pinhole/lerp incoherence, the 133
    degree implied FOV, "the camera is whatever the room Kabe loves turns out to
    have" — and `dims_m` is what §12.5 measures every rendered height against.
    Deriving a persisted world dimension through an unsettled camera would put a
    number in the record that no measurement supports.

    What this does support: at `turn_deg`, a box footprint w x d projects to a
    drawn width of `w*cos + d*sin`. The scale comes from the declared height and
    the pixel height. Disagreement is reported, not corrected.
    """
    t = math.radians(float(turn_deg))
    scale_px_per_m = px["h"] / float(dims_m["h"])
    drawn_m = px["w"] / scale_px_per_m
    implied_m = dims_m["w"] * math.cos(t) + dims_m["d"] * math.sin(t)
    ratio = drawn_m / implied_m if implied_m else None
    return {
        "drawn_width_m": _round(drawn_m),
        "implied_width_m": _round(implied_m),
        "ratio": _round(ratio),
        "agrees": bool(ratio is not None and 0.85 <= ratio <= 1.15),
        "note": "warn-only cross-check; dims_m is the operator's, sourced from period "
                "reference, and is never derived through the unsettled §5 camera",
    }


UNWITNESSED = {
    "camera.turn_deg": "no stage measures the angle the object was actually turned to",
    "camera.side": "no stage measures which side is toward the viewer; `view_side` is the flag",
    "camera.pitch_deg": "no stage measures the camera's pitch from the arriving image",
    "framing.states": "no stage checks that every moving part arrived closed and seated",
    "framing.props": "no stage checks that nothing is resting on or in front of the object",
}


def build(*, sprite_id, noun, archetype, attachment, dims_m, px, view_side, light,
          period, anchors, takeable, airborne, parts=None, states_images=None,
          thumb=None, source="generated", contract_identity=None, environment=None,
          gates=None, derived=None, measured=None, turn_deg=30):
    """The §6 record dict. Every field is either a flag or a derivation."""
    if not sprite_id or "/" in sprite_id or sprite_id.startswith("."):
        raise RecordError("--id %r is not a usable directory name" % sprite_id)
    for k in ("h", "w", "d"):
        v = dims_m.get(k)
        if not isinstance(v, (int, float)) or not v > 0:
            raise RecordError(
                "dims_m.%s must be a number > 0 (got %r). All three of height, width and depth "
                "come from the operator, sourced from period reference: blueprint §5 says the "
                "project camera is unsettled, so deriving a world dimension from the pixels "
                "through it would put an unsupported number in the record. The pixel arithmetic "
                "survives as a warn-only cross-check." % (k, v))

    rec = {
        "schema": "sprite/0.1",
        "id": sprite_id,
        "noun": noun,
        "archetype": archetype,
        "attachment": attachment,
        "dims_m": {"h": float(dims_m["h"]), "w": float(dims_m["w"]), "d": float(dims_m["d"])},
        "px": {"w": int(px["w"]), "h": int(px["h"])},
        "view_side": view_side,
        "light": light,
        "period": dict(period),
        "anchors": _clean(anchors),
        "takeable": bool(takeable),
        "airborne": bool(airborne),
    }
    if parts:
        rec["parts"] = _clean(parts)
    if states_images:
        rec["states_images"] = _clean(states_images)
    if thumb:
        rec["thumb"] = thumb

    rec["measured"] = _clean(measured or {})
    rec["declared_unwitnessed"] = dict(UNWITNESSED)
    rec["provenance"] = _clean({
        "source": source,
        "tool": "replicator-ingest-v1",
        "contract": contract_identity or {},
        "environment": environment or {},
        "gates": gates or [],
        "derived": derived or {},
    })
    rec["measured"]["dims_cross_check"] = dims_cross_check(rec["dims_m"], rec["px"], turn_deg)
    return rec


def to_json(record):
    """Byte-deterministic JSON: sorted keys, 2-space, LF, trailing newline."""
    import json
    return json.dumps(record, sort_keys=True, indent=2, ensure_ascii=False) + "\n"
