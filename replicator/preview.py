"""The dark-ground composite at the sprite's real draw scale.

The sprite is generated on mid-grey seamless and matted there, and every other
verification surface in this row measures it there too. But the flip test asks
what it looks like **in the room** — composited small over a dark oil-painted
interior — and a halo gate calibrated against mid-grey cannot see the tell that
only appears against a dark ground.

Blueprint §5's own arithmetic gives the scale: a 0.78 m desk at
`px_per_m_at_wall` 96 draws 75 px tall in the 1536 px frame (164 px at
`px_per_m_at_bottom` 210). So the sprite is downscaled roughly 6-12x at draw
time, and this module reproduces that before measuring anything.

Pure: returns arrays and numbers, writes nothing.
"""

import numpy as np
from PIL import Image

from . import imaging as im


def draw_scaled(rgba, draw_height_px):
    """The sprite as the renderer will draw it: bilinear, at draw height."""
    h, w = rgba.shape[:2]
    dh = max(1, int(draw_height_px))
    dw = max(1, int(round(w * dh / float(h))))
    return np.array(Image.fromarray(rgba, "RGBA").resize((dw, dh), Image.BILINEAR))


def composite_preview(rgba, ground_rgb, draw_height_px, pad=20):
    """The sprite drawn at draw scale on a flat dark ground, with a margin."""
    small = draw_scaled(rgba, draw_height_px)
    h, w = small.shape[:2]
    canvas = np.zeros((h + 2 * pad, w + 2 * pad, 4), np.uint8)
    canvas[..., :3] = np.asarray(ground_rgb, np.uint8)[None, None, :]
    canvas[..., 3] = 255
    a = (small[..., 3].astype(np.float64) / 255.0)[..., None]
    region = canvas[pad:pad + h, pad:pad + w, :3].astype(np.float64)
    canvas[pad:pad + h, pad:pad + w, :3] = np.clip(
        small[..., :3].astype(np.float64) * a + region * (1 - a), 0, 255).astype(np.uint8)
    alpha_map = np.zeros((h + 2 * pad, w + 2 * pad), np.float64)
    alpha_map[pad:pad + h, pad:pad + w] = small[..., 3]
    return canvas, alpha_map


def rim_lift_ratio(rgba, ground_rgb, draw_height_px):
    """How much brighter the composited rim reads than the ground, relative to
    the object's own lift.

    A correctly antialiased edge is a coverage-weighted blend, so its expected
    lift is about half the interior's. A grey contamination band — the
    generator's own antialias against the studio ground, opaque in any matte and
    a light outline over a dark room — pushes it far above that.

    Measured on the corpus desk at draw height 75: **0.836 with no edge erosion
    (a rim visible by eye), 0.245 with the pinned 2 px erosion.**
    """
    canvas, alpha_map = composite_preview(rgba, ground_rgb, draw_height_px)
    lum = im.luminance(canvas[..., :3])
    rim = (alpha_map > 10) & (alpha_map < 245)
    interior = alpha_map >= 250
    ground = alpha_map <= 0
    if rim.sum() == 0 or interior.sum() == 0 or ground.sum() == 0:
        return None
    g = float(lum[ground].mean())
    i = float(lum[interior].mean())
    r = float(lum[rim].mean())
    denom = i - g
    return {
        "ground_luminance": round(g, 3),
        "interior_luminance": round(i, 3),
        "rim_luminance": round(r, 3),
        "rim_px": int(rim.sum()),
        "draw_height_px": int(draw_height_px),
        "lift_ratio": round(float((r - g) / denom), 4) if abs(denom) > 1e-6 else None,
    }
