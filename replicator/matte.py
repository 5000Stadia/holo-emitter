"""Stage 1 — matte (blueprint §9.1).

Border-sampled grey, flood fill from all borders, enclosed-hole punching,
edge erosion, 1px inward feather, ring decontamination, RGB bleed, trim.

Pure: takes an RGB array and the pinned contract values, returns a MatteResult.
No file I/O anywhere in this module.
"""

from dataclasses import dataclass, field

import numpy as np

from . import imaging as im


class MatteError(ValueError):
    """A source image the matte cannot honestly process."""


@dataclass(frozen=True)
class MatteResult:
    rgba: np.ndarray                  # (H, W, 4) uint8, trimmed
    trim_offset: tuple                # (x, y) of the trim bbox in source coords
    bg_color: tuple                   # the sampled ground colour, floats
    object_mask_untrimmed: np.ndarray  # (Hs, Ws) bool, the final silhouette
    stats: dict = field(default_factory=dict)


def as_rgb(src):
    """Every public entry point normalises its input here.

    Callers of the pure API can hand in RGBA, a float array, uint16, or an empty
    frame. Reshaping a four-channel border ring to triples scrambles the
    channels silently, and a float image in [0, 1] reads as nearly black to an
    8-bit tolerance. Both are refused or corrected here rather than producing a
    confident wrong silhouette.
    """
    a = np.asarray(src)
    if a.ndim != 3 or a.shape[2] < 3:
        raise MatteError("source must be an (H, W, 3+) array, got shape %r" % (a.shape,))
    if a.shape[0] < 3 or a.shape[1] < 3:
        raise MatteError("source is %dx%d — too small to sample a border ring from"
                         % (a.shape[1], a.shape[0]))
    a = a[..., :3]
    if a.dtype == np.uint8:
        return a
    if np.issubdtype(a.dtype, np.floating):
        if not np.isfinite(a).all():
            raise MatteError("source contains NaN or infinite values")
        hi = float(a.max())
        scaled = a * 255.0 if hi <= 1.0 else a
        return np.clip(scaled, 0, 255).astype(np.uint8)
    if np.issubdtype(a.dtype, np.integer):
        return np.clip(a, 0, 255).astype(np.uint8)
    raise MatteError("source dtype %r is not an image" % (a.dtype,))


def sample_background(src_rgb):
    """Per-channel median of the 1-px border ring (§9.1)."""
    src_rgb = as_rgb(src_rgb)
    ring = np.concatenate([src_rgb[0], src_rgb[-1], src_rgb[:, 0], src_rgb[:, -1]])
    return tuple(float(v) for v in np.median(ring.reshape(-1, 3), axis=0))


def ground_statistics(src_rgb):
    """What this image's own ground looks like: its colour, noise and drift.

    The orientation contract asserts a "perfectly plain seamless uniform mid-grey
    background", so the ground's noise is measurable on every arriving image and
    a tolerance can be *computed* from it rather than fitted to a corpus. `drift`
    is the spread of the four corner medians, which is what a slight vignette or
    gradient costs the single border median.
    """
    src_rgb = as_rgb(src_rgb)
    bg = sample_background(src_rgb)
    ring = np.concatenate([src_rgb[0], src_rgb[-1], src_rgb[:, 0], src_rgb[:, -1]])
    sigma = float(ring.reshape(-1, 3).astype(np.float64).std(axis=0).max())
    h, w = src_rgb.shape[:2]
    k = max(8, min(h, w) // 32)
    corners = [src_rgb[:k, :k], src_rgb[:k, -k:], src_rgb[-k:, :k], src_rgb[-k:, -k:]]
    medians = np.array([np.median(c.reshape(-1, 3), axis=0) for c in corners])
    drift = float(np.abs(medians - np.asarray(bg)).max())
    return {"bg": bg, "sigma": round(sigma, 4), "drift": round(drift, 4)}


def tolerance_for(stats, rule):
    """This image's matte tolerance, by the frozen rule (row-3 plan §A).

    `tolerance = clip(k_sigma * sigma + drift_multiplier * drift, min, max)`.
    The rule is frozen; its output is per image, so one number validated at one
    source resolution is never silently applied at another.
    """
    t = rule["k_sigma"] * stats["sigma"] + rule["drift_multiplier"] * stats["drift"]
    return float(min(max(t, rule["min"]), rule["max"]))


def spatial_params(content_height_px, rule):
    """Erosion depth, hole minimum area and bleed width, scaled to the content.

    The contract admits sources from 128 px of content (a takeable) to well over
    1000 (the corpus), so an absolute pixel count validated at one end is wrong
    at the other: 2 px of erosion is 0.2% of the corpus desk and 1.6% of a
    128-px key, and a 64 px minimum hole area is 4% of the whole of that key.
    """
    h = float(max(1, content_height_px))
    erode = int(min(rule["erode_max_px"],
                    max(rule["erode_min_px"], round(h * rule["erode_fraction"]))))
    bleed = int(min(rule["bleed_max_px"],
                    max(rule["bleed_min_px"], round(h * rule["bleed_fraction"]))))
    side = h * rule["hole_side_fraction"]
    hole_area = int(max(rule["hole_min_area_floor_px"], round(side * side)))
    return {"edge_erode_px": erode, "rgb_bleed_px": bleed, "hole_min_area_px": hole_area}


def content_height(src_rgb, bg, tolerance):
    """The content bbox height before matting, for the scale rules above."""
    src_rgb = as_rgb(src_rgb)
    h, w = src_rgb.shape[:2]
    similar = im.rgb_distance(src_rgb, bg) <= tolerance
    outer = im.span_fill(similar, im.border_seeds(h, w))
    box = im.alpha_bbox((~outer).astype(np.uint8) * 255, 1)
    return 0 if box is None else box[3] - box[1]


def _check_margin(src_rgb, bg, tolerance, max_off=0.02):
    """The contract's framing.margin is 'full object centered'.

    A source whose object touches the border breaks the border-median sample
    and would be matted with a bitten silhouette. Detect it and refuse, rather
    than producing a sprite with a flat edge nobody drew.

    `max_off` is `contract.json` ingest.matte.framing_rule. It was a literal
    here — an acceptance number that decides which images ship, outside the
    freeze and outside `provenance.contract.thresholds_sha256`.
    """
    ring = np.concatenate([src_rgb[0], src_rgb[-1], src_rgb[:, 0], src_rgb[:, -1]])
    d = im.rgb_distance(ring.reshape(-1, 3), bg)
    off = float((d > tolerance).mean())
    if off > max_off:
        raise MatteError(
            "the object touches the image border: %.1f%% of the 1-px border ring is "
            "further than tolerance %g from the sampled ground %s. The orientation "
            "contract's framing.margin is 'full object centered, generous even margin "
            "on every side' -- regenerate the source rather than matting a bitten "
            "silhouette." % (off * 100.0, tolerance, tuple(round(c) for c in bg)))
    return off


def _check_ground_plausible(src_rgb, bg, lum_min=40.0, lum_max=215.0):
    """The contract's ground is "perfectly plain seamless uniform mid-grey".

    The tolerance rule cites that clause as its whole authority, so the clause
    is checked rather than assumed. What this catches: an already-matted PNG
    handed back to the ingester -- a plausible mistake for a seat re-running an
    earlier output. Its alpha is discarded on decode, the frame flattens onto
    black, the border median is black and perfectly uniform, and the WHOLE
    IMAGE becomes object: twelve gates green and an opaque rectangle shipped.
    """
    lum = float(im.luminance(np.asarray(bg, np.float64)[None, None, :])[0, 0])
    if not (lum_min <= lum <= lum_max):
        raise MatteError(
            "the sampled ground is luminance %.0f, which is not the 'plain mid-grey seamless "
            "background' the orientation contract requires (and which the matte's tolerance "
            "rule cites as its authority). If this image already has an alpha channel, it has "
            "been matted once already: ingest the original generation instead." % lum)


def matte(src_rgb, *, tolerance, hole_min_area_px, edge_erode_px, feather_px,
          rgb_bleed_px, max_erode_excess_ratio=None, framing_rule=None):
    """Matte one source image. See the module docstring for the stage order."""
    src_rgb = as_rgb(src_rgb)
    h, w = src_rgb.shape[:2]

    bg = sample_background(src_rgb)
    fr = framing_rule or {"max_border_off_fraction": 0.02,
                          "ground_luminance_min": 40.0, "ground_luminance_max": 215.0}
    border_off = _check_margin(src_rgb, bg, tolerance, fr["max_border_off_fraction"])
    _check_ground_plausible(src_rgb, bg, fr["ground_luminance_min"],
                            fr["ground_luminance_max"])

    # 2. similarity, 3. outer background
    dist = im.rgb_distance(src_rgb, bg)
    similar = dist <= tolerance
    outer = im.span_fill(similar, im.border_seeds(h, w))
    obj = ~outer
    area_raw = int(obj.sum())

    # 4. enclosed holes
    enclosed = similar & obj
    labels, n = im.label_components(enclosed)
    areas = np.bincount(labels.ravel(), minlength=n + 1)
    punched = np.zeros_like(obj)
    punched_count = 0
    kept_specks = 0
    for i in range(1, n + 1):
        if areas[i] >= hole_min_area_px:
            punched |= (labels == i)
            punched_count += 1
        else:
            kept_specks += 1
    obj = obj & ~punched
    area_after_holes = int(obj.sum())

    # 5. edge erosion -- drop the generator's own antialias band against the ground
    #
    # The guard is deliberately NOT a flat fraction of area. Eroding k pixels off
    # any shape costs roughly `perimeter * k` pixels, which is a large fraction of
    # a small object and a tiny one of a large object purely by geometry: a flat
    # 5% budget rejected a 51-px disc for being small, not for being thin. What
    # the guard exists to catch is erosion eating a *thin feature* -- a key's
    # shaft, a candlestick's stem -- which shows up as losing far more than the
    # perimeter predicts, or as a piece of the object vanishing outright.
    excess = 0.0
    lost_components = 0
    if edge_erode_px:
        eroded = im.erode(obj, int(edge_erode_px))
        loss = 1.0 - (eroded.sum() / max(area_after_holes, 1))
        perimeter = int(im.boundary_ring(obj).sum())
        expected = min(0.95, (perimeter * float(edge_erode_px)) / max(area_after_holes, 1))
        excess = loss / expected if expected > 1e-9 else 0.0
        # Count only pieces big enough to be a feature. A soft edge leaves
        # single-pixel specks outside the tolerance, and erosion removes them:
        # counting those as "a piece vanished" failed a control for its noise.
        # A ground-toned piece is not a feature of the object -- it is a cast
        # shadow's fringe, and gate (h) is what should speak to it. Counting it
        # here made a faint studio shadow abort the whole ingest with "the
        # object has features thinner than the edge treatment", non-monotonically
        # in the shadow's depth, pointing the operator at the `classes`
        # amendment path for a problem that is the image's and not the object's.
        lum_ = im.luminance(src_rgb)
        sat_ = im.saturation(src_rgb)
        bg_lum_ = float(im.luminance(np.asarray(bg, np.float64)[None, None, :])[0, 0])
        ground_toned = (sat_ <= 0.16) & (lum_ <= bg_lum_ * 0.99) & (lum_ >= bg_lum_ * 0.35)

        def _pieces(mask):
            labels_, count = im.label_components(mask)
            if count == 0:
                return 0
            sizes = np.bincount(labels_.ravel(), minlength=count + 1)[1:]
            keep = 0
            for i in range(1, count + 1):
                if sizes[i - 1] < hole_min_area_px:
                    continue
                piece = labels_ == i
                if float(ground_toned[piece].mean()) > 0.75:
                    continue      # a shadow fringe, not a feature
                keep += 1
            return keep
        before = _pieces(obj)
        after = _pieces(eroded)
        lost_components = max(0, before - after)
        if eroded.sum() == 0:
            raise MatteError(
                "edge erosion of %d px removes the whole silhouette — this object is thinner "
                "than its own edge treatment." % edge_erode_px)
        if max_erode_excess_ratio is not None and (
                excess > max_erode_excess_ratio or lost_components > 0):
            raise MatteError(
                "edge erosion of %d px removes %.1f%% of the silhouette where its perimeter "
                "predicts %.1f%% (excess ratio %.2f, limit %.2f) and %d connected piece(s) "
                "vanish. The object has features thinner than the edge treatment. This is not "
                "a number to move for this image: it is the contract's `classes` amendment "
                "path, which needs a constructed control of this object class landing in the "
                "same commit."
                % (edge_erode_px, loss * 100.0, expected * 100.0, excess,
                   max_erode_excess_ratio, lost_components))
        obj = eroded
    else:
        loss = 0.0
    area_final = int(obj.sum())
    if area_final == 0:
        raise MatteError("the matte produced an empty silhouette")

    # 6. feather 1px inward
    alpha = np.where(obj, 255.0, 0.0)
    if feather_px:
        ring = im.boundary_ring(obj)
        blurred = im.mean3x3(obj.astype(np.float64)) * 255.0
        alpha = np.where(ring, blurred, alpha)
    alpha = np.clip(alpha, 0.0, 255.0)

    # 7. ring decontamination: C = a*F + (1-a)*B  ->  F = (C - (1-a)B) / a
    rgb = src_rgb.astype(np.float64)
    partial = (alpha > 0) & (alpha < 255)
    if partial.any():
        a = (alpha / 255.0)[..., None]
        unmixed = (rgb - (1.0 - a) * np.asarray(bg, np.float64)[None, None, :])
        unmixed = np.clip(unmixed / np.maximum(a, 1e-3), 0.0, 255.0)
        rgb = np.where(partial[..., None], unmixed, rgb)

    # 8. premultiplied-safe RGB
    rgb = im.bleed_rgb(rgb, alpha > 0, rgb_bleed_px)

    rgba_full = np.dstack([rgb, alpha]).astype(np.uint8)

    # 9. trim
    box = im.alpha_bbox(rgba_full[..., 3], 1)
    if box is None:
        raise MatteError("the matte produced no opaque pixels to trim to")
    x0, y0, x1, y1 = box
    rgba = rgba_full[y0:y1, x0:x1].copy()

    stats = {
        "source_px": [int(w), int(h)],
        "background_rgb": [round(c, 2) for c in bg],
        "border_offcolour_fraction": round(border_off, 5),
        "area_raw": area_raw,
        "holes_punched": punched_count,
        "holes_kept_below_min_area": kept_specks,
        "area_after_holes": area_after_holes,
        "erode_loss_fraction": round(float(loss), 5),
        "erode_excess_ratio": round(float(excess), 4),
        "erode_lost_components": int(lost_components),
        "area_final": area_final,
        "trim_bbox": [x0, y0, x1, y1],
    }
    return MatteResult(rgba=rgba, trim_offset=(x0, y0), bg_color=bg,
                       object_mask_untrimmed=obj, stats=stats)


def silhouette_area(src_rgb, bg, tolerance):
    """The raw silhouette area at one tolerance, before holes or erosion."""
    src_rgb = as_rgb(src_rgb)
    h, w = src_rgb.shape[:2]
    similar = im.rgb_distance(src_rgb, bg) <= tolerance
    return int((~im.span_fill(similar, im.border_seeds(h, w))).sum())


def tolerance_sensitivity(src_rgb, bg, tolerance, sweep=0.25):
    """How much the silhouette moves when the tolerance moves +/- `sweep`.

    Gate (g)'s measure. A well-separated object barely moves; one whose colour
    sits near the ground's moves a lot, and that is the object a tolerant matte
    eats. See gates.gate_over_matte for why this replaced a comparison against
    one fixed conservative tolerance.
    """
    lo = silhouette_area(src_rgb, bg, tolerance * (1.0 - sweep))
    mid = silhouette_area(src_rgb, bg, tolerance)
    hi = silhouette_area(src_rgb, bg, tolerance * (1.0 + sweep))
    return abs(lo - hi) / float(max(1, mid)), {"area_low": lo, "area_mid": mid, "area_high": hi}
