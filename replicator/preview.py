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


def with_parts(body_rgba, parts, records, t=1.0):
    """Composite every part back at travel `t`, the way §7 draws it.

    The preview showed the BODY only, so a sprite with a drawer cut out of it
    appeared with a hole where the drawer is -- and the operator's one look
    never saw the thing the renderer will actually draw. That is how a drawer
    travelling to the wrong place survived a look.
    """
    from . import parts as parts_mod
    out = body_rgba
    px = {"w": int(body_rgba.shape[1]), "h": int(body_rgba.shape[0])}
    for rec in records:
        arr = parts.get(rec["id"])
        if arr is None:
            continue
        out, _ = parts_mod.open_state_composite(out, arr, rec["origin"], rec["slide"], px, t=t)
    return out


def annotate_contact(canvas, rgba, anchors, px, draw_height_px, pad=20):
    """Draw the contact pool the renderer would draw, and the footprint span.

    Quality 2 is "every grounded object darkens the ground under it", and the
    row that first sets the footprint value that pool is drawn from would
    otherwise never once look at a pool. This puts it in the picture, at the
    scale the sprite is actually drawn, so the judgement is available to an
    examining seat and not only to a width check.

    The ellipse follows blueprint §7 step 6's shape: centred on `base`, spanning
    `footprint`. It is drawn multiplicatively so it reads as darkening rather
    than as ink.
    """
    out = canvas.copy()
    scale = draw_height_px / float(rgba.shape[0])
    fp = anchors.get("footprint") or {}
    base = anchors.get("base") or {}
    x0 = pad + float(fp.get("x0", 0)) * scale
    x1 = pad + float(fp.get("x1", 0)) * scale
    cx = pad + float(base.get("x", 0)) * scale
    cy = pad + float(base.get("y", rgba.shape[0])) * scale
    rx = max(1.0, (x1 - x0) / 2.0)
    ry = max(1.0, rx * 0.18)
    h, w = out.shape[:2]
    yy = np.arange(h)[:, None].astype(np.float64)
    xx = np.arange(w)[None, :].astype(np.float64)
    r = ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2
    pool = np.clip(1.0 - r, 0.0, 1.0)
    shade = 1.0 - 0.55 * pool
    out[..., :3] = np.clip(out[..., :3].astype(np.float64) * shade[..., None],
                           0, 255).astype(np.uint8)
    # A one-pixel tick at each end of the footprint span, so the width is legible.
    for x in (int(round(x0)), int(round(x1)) - 1):
        if 0 <= x < w:
            lo = max(0, int(cy) - 3)
            hi = min(h, int(cy) + 4)
            out[lo:hi, x, :3] = np.array([220, 90, 60], np.uint8)
    return out


def rim_lift_ratios(rgba, grounds, draw_height_px):
    """The rim measure over every reference ground, keyed by name.

    Judging only over a near-black ground catches a light rim and is blind to a
    dark one — a dark fringe from over-erosion or a bleed undershoot is exactly
    as much a cut-out tell against a lit plaster wall or a leaded window. So the
    clause is evaluated over a dark ground *and* a light one, and bounded in both
    directions around the coverage algebra's expectation.
    """
    return {name: rim_lift_ratio(rgba, rgb, draw_height_px)
            for name, rgb in grounds.items()}


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

    # The reference for each rim pixel is its own LOCAL interior, not the
    # object's global mean. Comparing a ring to a whole-object average is
    # confounded by which faces happen to have edges: a box whose bright top
    # runs along its silhouette and whose dark side does not measured a "rim"
    # brighter than its own interior and looked like a halo, on a control
    # constructed to be clean.
    local = lum.copy()
    known = interior.copy()
    for _ in range(6):
        u, d, l, r_ = im.neighbours4(known)
        nbr = u | d | l | r_
        target = rim & nbr & ~known
        if not target.any():
            break
        acc = np.zeros_like(lum)
        cnt = np.zeros_like(lum)
        for shift, axis in ((1, 0), (-1, 0), (1, 1), (-1, 1)):
            src = np.roll(local, shift, axis=axis)
            m = np.roll(known, shift, axis=axis)
            if axis == 0:
                m[0 if shift == 1 else -1] = False
            else:
                m[:, 0 if shift == 1 else -1] = False
            acc += src * m
            cnt += m
        local = np.where(target, acc / np.maximum(cnt, 1.0), local)
        known = known | target
    measured = rim & known
    if measured.sum() == 0:
        return None
    denom = local[measured] - g
    ok = np.abs(denom) > 1e-6
    if not ok.any():
        return None

    # The residual, not a raw lift. Straight-alpha compositing says a rim pixel
    # of coverage a over ground G against local interior L must land at exactly
    #     expected = a*L + (1 - a)*G
    # so the normalized residual (observed - expected) / (L - G) is ZERO for a
    # correct edge whatever the colours are. That is algebra, not calibration:
    # it needs no threshold fitted to anything, and it is scale-free across
    # object colour, ground colour and draw size. A grey contamination band adds
    # light the coverage does not account for and drives it positive over a dark
    # ground; over-erosion or a bleed undershoot drives it negative.
    a = (alpha_map[measured][ok] / 255.0)
    L = local[measured][ok]
    obs = lum[measured][ok]
    expected = a * L + (1.0 - a) * g
    residual = (obs - expected) / denom[ok]
    lifts = (obs - g) / denom[ok]
    return {
        "ground_luminance": round(g, 3),
        "interior_luminance": round(float(lum[interior].mean()), 3),
        "rim_luminance": round(float(lum[rim].mean()), 3),
        "rim_px": int(measured.sum()),
        "draw_height_px": int(draw_height_px),
        "lift_ratio": round(float(np.median(lifts)), 4),
        "coverage_residual": round(float(np.median(residual)), 4),
        "coverage_residual_p90": round(float(np.quantile(np.abs(residual), 0.90)), 4),
    }
