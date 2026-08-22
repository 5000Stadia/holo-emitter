"""Measurement primitives for backdrop §5 metadata.

Every routine here reads pixels only. Nothing is assumed about the camera except
where a docstring says so explicitly. numpy + PIL only, by ruling.

The method is the one written down in design/plan-draft/study-N-meta-draft.json's
`_how_each_was_measured` block; this file is that block made executable.
"""

import numpy as np
from PIL import Image

# Rec.709 luma. Used for every "luminance" in this file.
LUMA = np.array([0.2126, 0.7152, 0.0722])


def load(path):
    im = Image.open(path).convert("RGB")
    a = np.asarray(im).astype(np.float64)
    assert a.shape[:2] == (1024, 1536), (path, a.shape)
    return a


def luma(rgb):
    return rgb @ LUMA


def sobel(g):
    """Return (gx, gy) 3x3 Sobel gradients of a 2-D array, same shape (edges zeroed)."""
    kx = np.array([[-1.0, 0.0, 1.0], [-2.0, 0.0, 2.0], [-1.0, 0.0, 1.0]])
    ky = np.array([[-1.0, -2.0, -1.0], [0.0, 0.0, 0.0], [1.0, 2.0, 1.0]])
    h, w = g.shape
    gx = np.zeros_like(g)
    gy = np.zeros_like(g)
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            wgtx = kx[dy + 1, dx + 1]
            wgty = ky[dy + 1, dx + 1]
            if wgtx == 0 and wgty == 0:
                continue
            sl = g[1 + dy: h - 1 + dy, 1 + dx: w - 1 + dx]
            if wgtx:
                gx[1:h - 1, 1:w - 1] += wgtx * sl
            if wgty:
                gy[1:h - 1, 1:w - 1] += wgty * sl
    return gx, gy


# ---------------------------------------------------------------- horizontals

def row_step_profile(L, y0, y1, x0, x1, smooth=1):
    """Mean |row-to-row luminance step| across columns x0..x1, for rows y0..y1.

    Returns (ys, steps) where steps[i] is the strength of the boundary that lies
    between row ys[i]-1 and ys[i] (i.e. the step is attributed to the LOWER row's
    index, so a returned y is the first row of the new surface).
    """
    band = L[y0:y1 + 1, x0:x1 + 1]
    if smooth > 1:
        k = np.ones(smooth) / smooth
        band = np.apply_along_axis(lambda r: np.convolve(r, k, mode="same"), 1, band)
    d = np.abs(np.diff(band, axis=0)).mean(axis=1)
    ys = np.arange(y0 + 1, y1 + 1)
    return ys, d


def top_steps(ys, d, n=6, min_sep=6):
    """The n strongest steps, non-maximum-suppressed by min_sep rows."""
    order = np.argsort(d)[::-1]
    picked = []
    for i in order:
        if all(abs(ys[i] - ys[j]) >= min_sep for j in picked):
            picked.append(i)
        if len(picked) >= n:
            break
    return [(int(ys[i]), float(d[i])) for i in picked]


def signed_row_step(L, y, x0, x1):
    """Signed mean luminance change from row y-1 to row y over x0..x1."""
    return float((L[y, x0:x1 + 1] - L[y - 1, x0:x1 + 1]).mean())


def horizontal_line_extent(L, y, tol_frac=0.5, x_probe=None):
    """Per-column strength of the horizontal step at row y; used to find where a
    ceiling/floor line stops being horizontal (i.e. the corners)."""
    s = np.abs(L[y, :] - L[y - 1, :])
    if x_probe is None:
        x_probe = (L.shape[1] // 2 - 100, L.shape[1] // 2 + 100)
    ref = np.median(s[x_probe[0]:x_probe[1]])
    return s, ref, ref * tol_frac


# ------------------------------------------------------------------ verticals

def col_step_profile(L, x0, x1, y0, y1):
    """Mean |column-to-column luminance step| for columns x0..x1 over rows y0..y1."""
    band = L[y0:y1 + 1, x0:x1 + 1]
    d = np.abs(np.diff(band, axis=1)).mean(axis=0)
    xs = np.arange(x0 + 1, x1 + 1)
    return xs, d


def top_cols(xs, d, n=6, min_sep=6):
    order = np.argsort(d)[::-1]
    picked = []
    for i in order:
        if all(abs(xs[i] - xs[j]) >= min_sep for j in picked):
            picked.append(i)
        if len(picked) >= n:
            break
    return [(int(xs[i]), float(d[i])) for i in picked]


# ------------------------------------------------------ vanishing point vote

def vp_vote(L, mask, xgrid, ygrid, mag_pct=88.0, perp_tol=0.03, max_pts=30000,
            seed=11, oblique=0.27):
    """The draft's vote. Sobel gradients over `mask`; for each candidate vanishing
    point count edge pixels whose gradient is perpendicular to the ray from that
    point to the pixel (equivalently: whose edge tangent points at the candidate).

    mag_pct  - keep only edge pixels above this percentile of gradient magnitude
               WITHIN the mask, so each region votes with its own strongest edges.
    perp_tol - |cos(angle(gradient, ray))| below this counts as perpendicular.
    oblique  - discard edges whose tangent is within atan(oblique) of horizontal
               or vertical. Those two families are DEGENERATE for this vote: an
               exactly vertical edge is perpendicular to the ray from every point
               on its own column, and an exactly horizontal edge from every point
               on its own row, so they vote for a whole line of candidates and
               swamp the real convergence. Set oblique=0 to disable the filter.

    Returns (best_x, best_y, score_grid, n_edge_pixels).
    """
    gx, gy = sobel(L)
    mag = np.hypot(gx, gy)
    m = mask & (mag > 0)
    if m.sum() < 200:
        return None, None, None, int(m.sum())
    thr = np.percentile(mag[m], mag_pct)
    m = m & (mag >= thr)
    if oblique > 0:
        agx, agy = np.abs(gx), np.abs(gy)
        lo = np.minimum(agx, agy)
        hi = np.maximum(agx, agy) + 1e-9
        m = m & (lo / hi > oblique)
    if m.sum() < 200:
        return None, None, None, int(m.sum())
    ys, xs = np.nonzero(m)
    n = len(xs)
    if n > max_pts:
        rng = np.random.default_rng(seed)
        idx = rng.choice(n, max_pts, replace=False)
        ys, xs = ys[idx], xs[idx]
    g1 = gx[ys, xs]
    g2 = gy[ys, xs]
    gn = np.hypot(g1, g2)
    g1 = g1 / gn
    g2 = g2 / gn
    px = xs.astype(np.float64)
    py = ys.astype(np.float64)

    score = np.zeros((len(ygrid), len(xgrid)), dtype=np.int32)
    for j, vy in enumerate(ygrid):
        dy = py - vy
        for i, vx in enumerate(xgrid):
            dx = px - vx
            rn = np.sqrt(dx * dx + dy * dy) + 1e-9
            c = np.abs(g1 * dx + g2 * dy) / rn
            score[j, i] = int((c < perp_tol).sum())
    j, i = np.unravel_index(np.argmax(score), score.shape)
    return int(xgrid[i]), int(ygrid[j]), score, int(len(xs))


def vote_region(L, mask, coarse_step=(16, 8), fine_half=(24, 12), **kw):
    """Coarse-then-fine vote over the whole frame's plausible VP range."""
    xg = np.arange(0, 1536 + 1, coarse_step[0])
    yg = np.arange(200, 820 + 1, coarse_step[1])
    bx, by, _, n = vp_vote(L, mask, xg, yg, **kw)
    if bx is None:
        return None, None, n
    xg2 = np.arange(max(0, bx - fine_half[0]), min(1536, bx + fine_half[0]) + 1, 2)
    yg2 = np.arange(max(0, by - fine_half[1]), min(1023, by + fine_half[1]) + 1, 1)
    bx2, by2, _, _ = vp_vote(L, mask, xg2, yg2, **kw)
    return bx2, by2, n


# ---------------------------------------------------------------------- light

def normalise_tint(mean_rgb, top=200.0):
    m = max(mean_rgb)
    if m <= 0:
        return "#000000", (0, 0, 0)
    s = top / m
    v = tuple(int(round(min(255, c * s))) for c in mean_rgb)
    return "#%02x%02x%02x" % v, v


def patch_mean(rgb, x0, x1, y0, y1):
    return tuple(rgb[y0:y1 + 1, x0:x1 + 1, c].mean() for c in range(3))


def brightest_patch(L, k=21):
    """Centre of the brightest k x k patch (box filter by cumulative sums)."""
    c = np.cumsum(np.cumsum(L, axis=0), axis=1)
    c = np.pad(c, ((1, 0), (1, 0)))
    h, w = L.shape
    s = (c[k:, k:] - c[:-k, k:] - c[k:, :-k] + c[:-k, :-k])
    j, i = np.unravel_index(np.argmax(s), s.shape)
    return int(i + k // 2), int(j + k // 2)


def sobel_bright_side_deg(L, mask=None):
    """Gate (e)'s estimator: the mean direction in which luminance increases,
    reported in degrees (0 = +x / right, 90 = up on screen)."""
    gx, gy = sobel(L)
    if mask is None:
        mask = np.ones(L.shape, dtype=bool)
    mag = np.hypot(gx, gy)
    m = mask & (mag > np.percentile(mag[mask], 75))
    vx = float(gx[m].sum())
    vy = float(-gy[m].sum())  # image y grows downward; flip so +y is up
    return float(np.degrees(np.arctan2(vy, vx)))


def third_tilt(L, y0=0, y1=1023):
    band = L[y0:y1 + 1, :]
    w = band.shape[1]
    return float(band[:, :w // 3].mean() - band[:, 2 * w // 3:].mean())
