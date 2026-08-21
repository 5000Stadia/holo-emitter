"""Shared pixel primitives for the replicator stages.

Every function here is pure: it takes arrays and scalars, returns new arrays,
mutates nothing it was given, reads no clock and no RNG, and touches no file.
The stages import these; the CLI never calls them directly.

The one internal image representation across the whole pipeline is a numpy
array of shape (H, W, 4), dtype uint8, RGBA with **straight** (non-premultiplied)
alpha. Masks are (H, W) bool. PIL appears only where a rasteriser, a blur or a
resample is genuinely needed (maskgen, parts, thumbs) and in the CLI's
decode/encode.
"""

import numpy as np

ALPHA_OPAQUE = 128       # the alpha >= threshold that mechanisms.spec calls opaque
ALPHA_SOLID = 250        # the alpha >= threshold its light measure calls solid


def neighbours4(mask):
    """The four 4-connected shifts of a bool mask, each padded with False.

    Returned as (up, down, left, right) where `up[y, x]` is `mask[y + 1, x]` —
    i.e. each array holds, at every position, the value of the neighbour in
    that direction.
    """
    up = np.zeros_like(mask)
    up[:-1] = mask[1:]
    down = np.zeros_like(mask)
    down[1:] = mask[:-1]
    left = np.zeros_like(mask)
    left[:, :-1] = mask[:, 1:]
    right = np.zeros_like(mask)
    right[:, 1:] = mask[:, :-1]
    return up, down, left, right


def dilate(mask, k=1):
    """4-connected binary dilation, k times."""
    out = mask.copy()
    for _ in range(k):
        u, d, l, r = neighbours4(out)
        out = out | u | d | l | r
    return out


def erode(mask, k=1):
    """4-connected binary erosion, k times. Border pixels erode inward."""
    out = mask.copy()
    for _ in range(k):
        u, d, l, r = neighbours4(out)
        out = out & u & d & l & r
    return out


def boundary_ring(mask):
    """The pixels of `mask` that are 4-adjacent to a pixel outside it."""
    u, d, l, r = neighbours4(mask)
    return mask & ~(u & d & l & r)


def mean3x3(a):
    """3×3 box mean of a float array, edges extended."""
    p = np.pad(a.astype(np.float64), 1, mode="edge")
    s = np.zeros(a.shape, dtype=np.float64)
    for dy in (0, 1, 2):
        for dx in (0, 1, 2):
            s += p[dy:dy + a.shape[0], dx:dx + a.shape[1]]
    return s / 9.0


def span_fill(mask, seeds):
    """4-connected flood over a bool `mask` from `seeds` [(y, x), ...].

    A scanline span fill: each pop extends a horizontal run as far as the mask
    allows, marks it, and pushes one seed per unmarked run on the rows above and
    below. Deterministic — the filled set does not depend on the order seeds are
    processed — and linear in the filled area.

    Written rather than delegated to PIL's ImageDraw.floodfill because that
    function seeds from a single point and compares candidates against *that
    seed's own value*, so using it here would need the image padded with a
    synthetic frame, and its behaviour is an implementation detail of Pillow
    rather than of this pipeline.
    """
    h, w = mask.shape
    filled = np.zeros((h, w), dtype=bool)
    stack = [(int(y), int(x)) for (y, x) in seeds if mask[y, x]]
    while stack:
        y, x = stack.pop()
        if filled[y, x] or not mask[y, x]:
            continue
        row = mask[y]
        frow = filled[y]
        x0 = x
        while x0 > 0 and row[x0 - 1] and not frow[x0 - 1]:
            x0 -= 1
        x1 = x
        while x1 + 1 < w and row[x1 + 1] and not frow[x1 + 1]:
            x1 += 1
        frow[x0:x1 + 1] = True
        for ny in (y - 1, y + 1):
            if 0 <= ny < h:
                seg = mask[ny, x0:x1 + 1] & ~filled[ny, x0:x1 + 1]
                idx = np.flatnonzero(seg)
                if idx.size == 0:
                    continue
                brk = np.flatnonzero(np.diff(idx) > 1)
                starts = np.concatenate(([idx[0]], idx[brk + 1]))
                for s in starts:
                    stack.append((ny, x0 + int(s)))
    return filled


def border_seeds(h, w):
    """Every pixel coordinate on the 1-px border of an h×w image."""
    return ([(0, x) for x in range(w)] + [(h - 1, x) for x in range(w)] +
            [(y, 0) for y in range(h)] + [(y, w - 1) for y in range(h)])


def label_components(mask):
    """Label the 4-connected components of a bool mask.

    Returns (labels int32 array, count). Label 0 is "not in the mask".
    """
    h, w = mask.shape
    labels = np.zeros((h, w), dtype=np.int32)
    remaining = mask.copy()
    cur = 0
    ys, xs = np.nonzero(mask)
    for i in range(len(ys)):
        y, x = int(ys[i]), int(xs[i])
        if labels[y, x]:
            continue
        cur += 1
        comp = span_fill(remaining, [(y, x)])
        labels[comp] = cur
        remaining &= ~comp
    return labels, cur


def luminance(rgb):
    """Rec.601 luminance, the weighting mechanisms.spec uses. Float array."""
    a = rgb.astype(np.float64)
    return a[..., 0] * 0.299 + a[..., 1] * 0.587 + a[..., 2] * 0.114


def saturation(rgb):
    """HSV saturation in [0, 1] from 0..255 RGB. Float array."""
    a = rgb.astype(np.float64)
    mx = a.max(-1)
    mn = a.min(-1)
    return np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-9), 0.0)


def rgb_distance(rgb, colour):
    """Euclidean RGB distance of every pixel from one colour. Float array."""
    return np.sqrt(((rgb.astype(np.float64) - np.asarray(colour, np.float64)) ** 2).sum(-1))


def alpha_bbox(alpha, threshold=1):
    """(x0, y0, x1, y1) half-open bbox of alpha >= threshold, or None."""
    ys, xs = np.nonzero(alpha >= threshold)
    if ys.size == 0:
        return None
    return (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)


def bleed_rgb(rgb, opaque, iterations):
    """Push object colour outward into transparency, `iterations` pixels.

    Transparent pixels beyond the bled band are zeroed. This is what makes the
    output premultiplied-safe: the sprite is drawn at roughly 6-12x downscale
    (blueprint §5's own arithmetic), so a bilinear sampler reaches past the
    silhouette on every edge pixel, and a transparent pixel holding the grey
    studio ground -- or holding black -- fringes the composite.
    """
    out = rgb.astype(np.float64).copy()
    filled = opaque.copy()
    for _ in range(max(0, int(iterations))):
        acc = np.zeros_like(out)
        cnt = np.zeros(out.shape[:2], dtype=np.float64)
        for shift, axis in ((1, 0), (-1, 0), (1, 1), (-1, 1)):
            src = np.roll(out, shift, axis=axis)
            m = np.roll(filled, shift, axis=axis)
            if axis == 0:
                if shift == 1:
                    m[0] = False
                else:
                    m[-1] = False
            else:
                if shift == 1:
                    m[:, 0] = False
                else:
                    m[:, -1] = False
            acc += src * m[..., None]
            cnt += m
        target = (~filled) & (cnt > 0)
        mean = acc / np.maximum(cnt, 1.0)[..., None]
        out = np.where(target[..., None], mean, out)
        filled = filled | target
    return np.where(filled[..., None], out, 0.0)


def composite_over(rgba, ground_rgb):
    """Composite a straight-alpha RGBA array over a flat ground colour."""
    a = rgba[..., 3].astype(np.float64)[..., None] / 255.0
    fg = rgba[..., :3].astype(np.float64)
    bg = np.asarray(ground_rgb, np.float64)[None, None, :]
    return np.clip(fg * a + bg * (1.0 - a), 0, 255)
