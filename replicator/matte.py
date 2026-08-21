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


def sample_background(src_rgb):
    """Per-channel median of the 1-px border ring (§9.1)."""
    ring = np.concatenate([src_rgb[0], src_rgb[-1], src_rgb[:, 0], src_rgb[:, -1]])
    return tuple(float(v) for v in np.median(ring.reshape(-1, 3), axis=0))


def _check_margin(src_rgb, bg, tolerance):
    """The contract's framing.margin is 'full object centered'.

    A source whose object touches the border breaks the border-median sample
    and would be matted with a bitten silhouette. Detect it and refuse, rather
    than producing a sprite with a flat edge nobody drew.
    """
    ring = np.concatenate([src_rgb[0], src_rgb[-1], src_rgb[:, 0], src_rgb[:, -1]])
    d = im.rgb_distance(ring.reshape(-1, 3), bg)
    off = float((d > tolerance).mean())
    if off > 0.02:
        raise MatteError(
            "the object touches the image border: %.1f%% of the 1-px border ring is "
            "further than tolerance %g from the sampled ground %s. The orientation "
            "contract's framing.margin is 'full object centered, generous even margin "
            "on every side' -- regenerate the source rather than matting a bitten "
            "silhouette." % (off * 100.0, tolerance, tuple(round(c) for c in bg)))
    return off


def matte(src_rgb, *, tolerance, hole_min_area_px, edge_erode_px, feather_px,
          rgb_bleed_px, max_erode_loss_fraction=None):
    """Matte one source image. See the module docstring for the stage order."""
    src_rgb = np.asarray(src_rgb)
    if src_rgb.ndim != 3 or src_rgb.shape[2] < 3:
        raise MatteError("source must be an (H, W, 3+) array, got shape %r" % (src_rgb.shape,))
    src_rgb = src_rgb[..., :3]
    h, w = src_rgb.shape[:2]

    bg = sample_background(src_rgb)
    border_off = _check_margin(src_rgb, bg, tolerance)

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
    if edge_erode_px:
        eroded = im.erode(obj, int(edge_erode_px))
        loss = 1.0 - (eroded.sum() / max(area_after_holes, 1))
        if max_erode_loss_fraction is not None and loss > max_erode_loss_fraction:
            raise MatteError(
                "edge erosion of %d px would remove %.1f%% of the silhouette (limit %.1f%%). "
                "The object is too thin for this edge treatment -- lower "
                "ingest.matte.edge_erode_px for this class of sprite rather than eating it."
                % (edge_erode_px, loss * 100.0, max_erode_loss_fraction * 100.0))
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
        "area_final": area_final,
        "trim_bbox": [x0, y0, x1, y1],
    }
    return MatteResult(rgba=rgba, trim_offset=(x0, y0), bg_color=bg,
                       object_mask_untrimmed=obj, stats=stats)


def conservative_area(src_rgb, *, tolerance):
    """The silhouette area at a deliberately tight tolerance.

    Gate (g) compares this against the shipped matte's area: nothing in §9.4
    hunts a *bitten* silhouette, and a key with its shaft matted away exits
    zero while reading as a broken sticker.
    """
    src_rgb = np.asarray(src_rgb)[..., :3]
    h, w = src_rgb.shape[:2]
    bg = sample_background(src_rgb)
    similar = im.rgb_distance(src_rgb, bg) <= tolerance
    outer = im.span_fill(similar, im.border_seeds(h, w))
    return int((~outer).sum())
