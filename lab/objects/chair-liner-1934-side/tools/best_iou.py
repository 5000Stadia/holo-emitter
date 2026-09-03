#!/usr/bin/env python3
"""Best achievable silhouette IoU for a render under a similarity (scale + shift) alignment.

Separates the two things a raw IoU number mixes: how well the SHAPE matches, and how well the
camera happens to be framed. The search returns the best scale and pixel shift, which converts
directly back into a camera distance and target offset.
"""
import sys
import numpy as np
from PIL import Image

BG = np.array([128, 128, 128])


def mask(path, size=450):
    a = np.array(Image.open(path).convert('RGB').resize((size, size), Image.BILINEAR)).astype(int)
    return np.abs(a - BG).sum(2) > 18


def shift_scale(m, s, dx, dy, size):
    n = int(round(size * s))
    im = Image.fromarray((m * 255).astype(np.uint8)).resize((n, n), Image.BILINEAR)
    out = np.zeros((size, size), np.uint8)
    src = np.array(im)
    off = (size - n) // 2
    x0, y0 = off + dx, off + dy
    sx0, sy0 = max(0, -x0), max(0, -y0)
    dx0, dy0 = max(0, x0), max(0, y0)
    w = min(n - sx0, size - dx0)
    h = min(n - sy0, size - dy0)
    if w > 0 and h > 0:
        out[dy0:dy0 + h, dx0:dx0 + w] = src[sy0:sy0 + h, sx0:sx0 + w]
    return out > 127


def best(ref, rnd, size=450, scales=None, span=26, step=2):
    scales = scales if scales is not None else np.arange(0.90, 1.111, 0.01)
    bi, bp = 0.0, None
    for s in scales:
        m = shift_scale(rnd, s, 0, 0, size)
        for dy in range(-span, span + 1, step):
            for dx in range(-span, span + 1, step):
                q = np.roll(np.roll(m, dy, 0), dx, 1)
                i = (q & ref).sum() / max(1, (q | ref).sum())
                if i > bi:
                    bi, bp = i, (round(float(s), 3), dx, dy)
    return bi, bp


if __name__ == '__main__':
    ref = mask(sys.argv[1])
    for p in sys.argv[2:]:
        rnd = mask(p)
        raw = (ref & rnd).sum() / max(1, (ref | rnd).sum())
        b, prm = best(ref, rnd)
        print('%-34s raw %.4f   best %.4f  at scale %s shift %s' % (p.split('/')[-1], raw, b, prm[0], prm[1:]))
