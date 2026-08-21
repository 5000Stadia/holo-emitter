"""Stage 3 — parts (blueprint §9.3).

Cut a part from the matted body with a mask PNG, inpaint the cavity it leaves
with darkened content-aware fill, record the part's origin in body pixel space,
and check the two things gate (d) at closed cannot see: that the mask follows
the drawer's real edges, and that the declared `slide` actually opens.

Pure. The mask arrives as a bool array in *source* coordinates; the caller
translates nothing — this module does, from the trim offset it is given.
"""

from dataclasses import dataclass

import numpy as np
from PIL import Image, ImageFilter

from . import imaging as im


class PartError(ValueError):
    """A part the image or the flags cannot support."""


@dataclass(frozen=True)
class PartResult:
    part_rgba: np.ndarray        # the cut part, trimmed to its own bbox
    origin: dict                 # {"x", "y"} — part bbox top-left in body px space
    body_rgba: np.ndarray        # the body with the cavity inpainted
    closed_rect: dict            # {"x0","y0","x1","y1"} — the mask bbox in body px space
    stats: dict


def translate_mask(mask_src, trim_offset, body_shape):
    """Crop a source-space mask to the trimmed body's own frame."""
    ox, oy = trim_offset
    h, w = body_shape[:2]
    out = mask_src[oy:oy + h, ox:ox + w]
    if out.shape != (h, w):
        raise PartError(
            "the mask does not cover the body's trim window: body is %dx%d at source "
            "offset (%d, %d) and the mask crop came out %dx%d"
            % (w, h, ox, oy, out.shape[1], out.shape[0]))
    return out


def mask_from_image(arr):
    """A PNG's pixels as a part mask: alpha >= 128 where present, else luma >= 128."""
    a = np.asarray(arr)
    if a.ndim == 2:
        return a >= 128
    if a.shape[2] == 4:
        return a[..., 3] >= 128
    return im.luminance(a[..., :3]) >= 128


def mask_adherence(src_rgb, mask, radius=10, samples_per_edge=60):
    """How well a mask's boundary sits on the dark reveal gaps around a part.

    For points along the mask boundary, walk the outward normal from -radius to
    +radius and note where the darkest pixel on that crossing lies. A mask that
    follows a joined drawer's reveal finds the minimum at offset ~0; a mask
    pulled inside the front finds it out at the reveal it missed.

    Measured on the corpus desk: the fitted mask scores 0.51 of samples within
    3 px, the same mask pulled 20 px inside scores 0.24, and one pushed 15 px
    out scores 0.27. It discriminates, but not sharply enough to hard-fail on —
    the drawer's own highlight band is nearly as dark as a reveal. So this is
    reported and **warns**, and the real evidence that a mask follows the edges
    is the overlay image `replicator.maskgen --overlay` writes for the eye.
    """
    lum = im.luminance(np.asarray(src_rgb)[..., :3])
    h, w = lum.shape
    ring = im.boundary_ring(mask)
    ys, xs = np.nonzero(ring)
    if ys.size == 0:
        return None
    # Sample evenly around the ring, deterministically.
    n = min(samples_per_edge * 4, ys.size)
    step = max(1, ys.size // n)
    idx = np.arange(0, ys.size, step)[:n]
    # Outward normal per sample: away from the mask's local centre of mass.
    grad_y, grad_x = np.gradient(mask.astype(np.float64))
    offsets = []
    for i in idx:
        y, x = int(ys[i]), int(xs[i])
        gx, gy = -grad_x[y, x], -grad_y[y, x]
        norm = float(np.hypot(gx, gy))
        if norm < 1e-6:
            continue
        gx, gy = gx / norm, gy / norm
        prof = []
        for d in range(-radius, radius + 1):
            px = int(round(x + gx * d))
            py = int(round(y + gy * d))
            prof.append(lum[py, px] if 0 <= py < h and 0 <= px < w else 255.0)
        offsets.append(int(np.argmin(prof)) - radius)
    if not offsets:
        return None
    offsets = np.asarray(offsets)
    return {
        "samples": int(offsets.size),
        "within_3px_fraction": round(float((np.abs(offsets) <= 3).mean()), 4),
        "mean_abs_offset_px": round(float(np.abs(offsets).mean()), 3),
    }


def _inpaint(rgb, mask, blur_radius, darken):
    """Content-aware-enough fill: propagate the boundary inward, blur, darken.

    Blueprint §9.3 licenses this explicitly — "PIL blur-fill acceptable, cavity
    quality bar is low". The darkening factor is `src/placeholders.js`'s own
    recess factor, so an ingested body satisfies the same body/part luminance
    ratio mechanisms.spec asserts for the placeholders.
    """
    work = rgb.astype(np.float64).copy()
    known = ~mask
    cur = known.copy()
    for _ in range(4096):
        todo = mask & ~cur
        if not todo.any():
            break
        acc = np.zeros_like(work)
        cnt = np.zeros(work.shape[:2], dtype=np.float64)
        for shift, axis in ((1, 0), (-1, 0), (1, 1), (-1, 1)):
            src = np.roll(work, shift, axis=axis)
            m = np.roll(cur, shift, axis=axis)
            if axis == 0:
                m[0 if shift == 1 else -1] = False
            else:
                m[:, 0 if shift == 1 else -1] = False
            acc += src * m[..., None]
            cnt += m
        upd = todo & (cnt > 0)
        if not upd.any():
            break
        work = np.where(upd[..., None], acc / np.maximum(cnt, 1.0)[..., None], work)
        cur = cur | upd
    blurred = np.array(Image.fromarray(np.clip(work, 0, 255).astype(np.uint8), "RGB")
                       .filter(ImageFilter.GaussianBlur(blur_radius))).astype(np.float64)
    out = rgb.astype(np.float64).copy()
    return np.where(mask[..., None], np.clip(blurred * darken, 0, 255), out)


def cut_part(body_rgba, mask_body, *, darken, blur_radius):
    """Cut the part, inpaint the cavity, return both images and the origin."""
    if mask_body.shape != body_rgba.shape[:2]:
        raise PartError("mask is %dx%d but the body is %dx%d"
                        % (mask_body.shape[1], mask_body.shape[0],
                           body_rgba.shape[1], body_rgba.shape[0]))
    body_alpha = body_rgba[..., 3]
    part_mask = mask_body & (body_alpha >= im.ALPHA_OPAQUE)
    if not part_mask.any():
        raise PartError("the mask selects no opaque body pixels — is it in source "
                        "coordinates, and does it overlap the object?")
    ys, xs = np.nonzero(part_mask)
    x0, y0, x1, y1 = int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1

    part_full = np.zeros_like(body_rgba)
    part_full[..., :3] = body_rgba[..., :3]
    part_full[..., 3] = np.where(part_mask, body_alpha, 0)
    part = part_full[y0:y1, x0:x1].copy()
    # The part is drawn over the room too: give its transparency object colour.
    part[..., :3] = im.bleed_rgb(part[..., :3], part[..., 3] > 0, 2).astype(np.uint8)

    body = body_rgba.copy()
    body[..., :3] = _inpaint(body_rgba[..., :3], part_mask, blur_radius, darken).astype(np.uint8)

    part_lum = im.luminance(part[..., :3])[part[..., 3] > 0]
    cav_lum = im.luminance(body[..., :3])[part_mask]
    stats = {
        "part_px": [int(x1 - x0), int(y1 - y0)],
        "mask_px": int(part_mask.sum()),
        "part_mean_luminance": round(float(part_lum.mean()), 2),
        "cavity_mean_luminance": round(float(cav_lum.mean()), 2),
        "cavity_over_part_ratio": round(float(cav_lum.mean() / max(part_lum.mean(), 1e-6)), 4),
    }
    return PartResult(part_rgba=part, origin={"x": x0, "y": y0}, body_rgba=body,
                      closed_rect={"x0": x0, "y0": y0, "x1": x1, "y1": y1}, stats=stats)


def derived_cavity(closed_rect, slide, px):
    """Where a part's contents are visible when it is open, in body px space.

    Row 2 pinned the convention ("`drawer_cavity` semantics: contents sit where
    they are visible when *open*") and architecture.md records why the travel
    has to clear the cavity: children draw after their host's parts, so an open
    drawer front overlapping the cavity puts the revealed key on the *face* of
    the drawer instead of inside it.

    The open front's top edge lands at `origin.y + dy * px.h`; everything of the
    closed rect above that line is cavity. This cannot be measured off a closed
    source image — the cavity is behind the drawer front — which is why it is
    derived here rather than flagged blind.
    """
    dy = float(slide["dy"])
    dx = float(slide["dx"])
    open_top = closed_rect["y0"] + dy * px["h"]
    x0 = closed_rect["x0"] + max(0.0, dx * px["w"])
    x1 = closed_rect["x1"] + min(0.0, dx * px["w"])
    y0 = float(closed_rect["y0"])
    y1 = float(min(open_top, closed_rect["y1"]))
    if not (x0 < x1 and y0 < y1):
        return None
    return {"x0": x0, "y0": y0, "x1": x1, "y1": y1}


def min_dy_clearance(closed_rect, cavity, px):
    """The smallest `slide.dy` for which the open front clears `cavity`."""
    return (float(cavity["y1"]) - float(closed_rect["y0"])) / float(px["h"])


def open_state_composite(body_rgba, part_rgba, origin, slide, px, t=1.0):
    """Composite body + part at travel `t`, the way §7 draws it. Pure.

    Used to check that a part which passes gate (d) at *closed* also opens: a
    drawer cut and inpainted perfectly that travels to the wrong place passes
    every other gate in §9.4.
    """
    out = body_rgba.astype(np.float64).copy()
    dx = float(slide["dx"]) * px["w"] * t
    dy = float(slide["dy"]) * px["h"] * t
    scale = 1.0 + (float(slide.get("scale_open", 1.0)) - 1.0) * t
    ph, pw = part_rgba.shape[:2]
    sw, sh = max(1, int(round(pw * scale))), max(1, int(round(ph * scale)))
    part = np.array(Image.fromarray(part_rgba, "RGBA").resize((sw, sh), Image.BILINEAR))
    ox = int(round(origin["x"] + dx))
    oy = int(round(origin["y"] + dy))
    H, W = out.shape[:2]
    x0, y0 = max(0, ox), max(0, oy)
    x1, y1 = min(W, ox + sw), min(H, oy + sh)
    if x0 >= x1 or y0 >= y1:
        return out.astype(np.uint8), {"x0": ox, "y0": oy, "x1": ox + sw, "y1": oy + sh}
    sub = part[y0 - oy:y1 - oy, x0 - ox:x1 - ox].astype(np.float64)
    a = (sub[..., 3] / 255.0)[..., None]
    dst = out[y0:y1, x0:x1]
    dst[..., :3] = sub[..., :3] * a + dst[..., :3] * (1 - a)
    dst[..., 3] = np.maximum(dst[..., 3], sub[..., 3])
    out[y0:y1, x0:x1] = dst
    return out.astype(np.uint8), {"x0": ox, "y0": oy, "x1": ox + sw, "y1": oy + sh}
