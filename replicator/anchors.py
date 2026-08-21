"""Stage 2 — anchors (blueprint §9.2).

Two kinds of quantity live in `record.anchors`, and row 3 keeps them apart
because they answer different questions:

* **Pixel facts.** `px`, and the bottom-extreme opaque row that fixes `base.y`.
  These are derived exactly the way the shipped
  `tests/playwright/mechanisms.spec.mjs` case "px, base and footprint are what
  the pixels say they are" derives them, so a record this ingester writes and a
  record that test reads agree by construction.

* **Ground-contact facts.** `anchors.footprint` and `base.x` are what the
  renderer draws an object's contact pool from. On generated three-quarter art
  the bottom two rows are the *nearest foot*, not the stance: measured on the
  corpus desk, the bottom-two-rows extent is 27 px of a 1148 px sprite while the
  desk's real ground contact spans 33..1098. Taking §9.2's derivation literally
  there gives a desk a contact pool 3% of the width of its own feet, against a
  named quality that reads "nothing sits on a floor without it". So these are
  operator-flagged at v1 (`--footprint`), with the geometric value kept as a
  reported cross-check and gate (f) refusing an implausible one. §9.2's own v2
  clause is Kabe's and names exactly this: "an llm looks at it and identifies
  the rear points that touch the ground".

Everything here is pure.
"""

import numpy as np

from . import imaging as im


class AnchorError(ValueError):
    """An anchor the image cannot support."""


def bottom_extreme(rgba, threshold=im.ALPHA_OPAQUE):
    """(bottom_row, x0, x1_inclusive) over the bottom two opaque rows.

    `bottom_row` is the highest-index row holding a pixel at alpha >= threshold;
    the extent is taken across that row and the one above it, which is what §9.2
    means by "bottom 2 rows".
    """
    a = rgba[..., 3]
    opaque = a >= threshold
    rows = np.flatnonzero(opaque.any(axis=1))
    if rows.size == 0:
        raise AnchorError("no opaque pixels to derive anchors from")
    bottom = int(rows.max())
    band = opaque[max(0, bottom - 1):bottom + 1]
    cols = np.flatnonzero(band.any(axis=0))
    return bottom, int(cols.min()), int(cols.max())


def geometric_anchors(rgba):
    """`base` and `footprint` exactly as §9.2 and mechanisms.spec derive them.

    `footprint.x1` is **exclusive** (x1_inclusive + 1) and `base.y` is the
    image's own bottom edge (bottom_row + 1), matching the shipped test.
    """
    bottom, x0, x1 = bottom_extreme(rgba)
    return {
        "base": {"x": (x0 + x1 + 1) / 2.0, "y": bottom + 1},
        "footprint": {"x0": x0, "x1": x1 + 1},
    }


def contact_band_estimate(rgba, band_fraction, threshold=im.ALPHA_OPAQUE):
    """A measured suggestion for the ground-contact extent.

    The x-extent of the columns whose lowest opaque pixel lies within
    `band_fraction` of the image height of the bottom-most opaque row. On a
    legged object in three-quarter view this finds all the feet; on a squat disc
    it stays narrow, which is the coin's lesson running the other way. Reported
    to the operator, never written silently — on some shapes the band is the
    whole silhouette and that would be a lie.
    """
    a = rgba[..., 3]
    opaque = a >= threshold
    h = rgba.shape[0]
    lowest = np.full(rgba.shape[1], -1, dtype=np.int64)
    for x in range(rgba.shape[1]):
        ys = np.flatnonzero(opaque[:, x])
        if ys.size:
            lowest[x] = ys.max()
    valid = lowest >= 0
    if not valid.any():
        return None
    bottom = int(lowest.max())
    cutoff = bottom - band_fraction * h
    cols = np.flatnonzero(valid & (lowest >= cutoff))
    if cols.size == 0:
        return None
    return {"x0": int(cols.min()), "x1": int(cols.max()) + 1}


def apply_footprint_override(anchors, footprint_src, trim_offset, px):
    """Replace the geometric footprint with an operator-measured one.

    `footprint_src` is (x0, x1) in **source image** pixel space; it is
    translated by the trim offset. `base.x` moves to the new footprint's
    midpoint, because base is where the contact pool is centred and a base that
    disagrees with its own footprint draws the pool off the object.
    """
    ox = trim_offset[0]
    x0 = float(footprint_src[0]) - ox
    x1 = float(footprint_src[1]) - ox
    if not (x0 < x1):
        raise AnchorError("--footprint needs x0 < x1, got %s,%s" % footprint_src)
    if x0 < 0 or x1 > px["w"]:
        raise AnchorError(
            "--footprint %s,%s translates to [%g, %g] in the %dx%d sprite, which lies "
            "outside it. Flags are given in SOURCE image coordinates; this sprite was "
            "trimmed by (%d, %d)." % (footprint_src[0], footprint_src[1], x0, x1,
                                      px["w"], px["h"], trim_offset[0], trim_offset[1]))
    out = dict(anchors)
    out["footprint"] = {"x0": x0, "x1": x1}
    out["base"] = {"x": (x0 + x1) / 2.0, "y": anchors["base"]["y"]}
    return out


def parse_region(text):
    """`name:x0,y0,x1,y1` -> (name, (x0, y0, x1, y1)) in source coordinates."""
    if ":" not in text:
        raise AnchorError("--anchor wants NAME:x0,y0,x1,y1, got %r" % text)
    name, nums = text.split(":", 1)
    parts = nums.split(",")
    if len(parts) != 4:
        raise AnchorError("--anchor %s wants four numbers x0,y0,x1,y1, got %r" % (name, nums))
    try:
        vals = tuple(float(p) for p in parts)
    except ValueError:
        raise AnchorError("--anchor %s: %r is not four numbers" % (name, nums))
    return name.strip(), vals


def apply_manual_region(anchors, name, region_src, trim_offset, px):
    """Translate one flagged region from source space into sprite space.

    The operator measures on the image they can open, so the flags are in source
    coordinates; §6 stores sprite coordinates. A region that lands outside the
    trimmed canvas is an error naming both rectangles — never a clamp, because a
    clamped anchor is a record lying about where a thing is.
    """
    ox, oy = trim_offset
    x0, y0, x1, y1 = region_src
    if not (x0 < x1 and y0 < y1):
        raise AnchorError("--anchor %s needs x0 < x1 and y0 < y1, got %s" % (name, region_src))
    r = {"x0": x0 - ox, "y0": y0 - oy, "x1": x1 - ox, "y1": y1 - oy}
    if r["x0"] < 0 or r["y0"] < 0 or r["x1"] > px["w"] or r["y1"] > px["h"]:
        raise AnchorError(
            "--anchor %s:%g,%g,%g,%g translates to (%g, %g, %g, %g) in the %dx%d sprite "
            "and lies outside it. Flags are in SOURCE image coordinates; this sprite was "
            "trimmed by (%d, %d)." % (name, x0, y0, x1, y1, r["x0"], r["y0"], r["x1"],
                                      r["y1"], px["w"], px["h"], ox, oy))
    out = dict(anchors)
    out[name] = r
    return out


def detect_regions(rgba, ask=None):
    """v2 seam (blueprint §9.2, §4b rule 5): the injected VLM callable.

    `ask` is a `(prompt, schema) -> json` callable of the same convention
    pattern-buffer uses. Nothing in v1 supplies one; v1's geometric base and
    footprint stay as the deterministic cross-check on whatever a model claims.
    """
    if ask is None:
        raise NotImplementedError(
            "anchor auto-detection is blueprint §9.2 v2: it needs an injected "
            "(prompt, schema) -> json callable. v1 flags regions with --anchor.")
    raise NotImplementedError(
        "the v2 detection body is not built at row 3 — the seam exists so a live host "
        "can supply the callable without a rewrite (§4b rule 5).")
