#!/usr/bin/env python3
"""Per-material colour comparison between the reference photograph and a render.

Both images are classified into the chair's four material families by the same rules, then
each family's median colour is compared in CIE Lab. The classification is coarse on purpose:
the four families are far apart in colour, so a rule that separates them in the reference
separates them in the render too, and neither image has to be segmented by hand.
"""
import sys
import numpy as np
from PIL import Image

BG = np.array([128, 128, 128])


def classify(path):
    a = np.array(Image.open(path).convert('RGB')).astype(int)
    m = np.abs(a - BG).sum(2) > 18
    R, G, B = a[..., 0], a[..., 1], a[..., 2]
    mx = a.max(2)
    blue = m & (B > R + 8) & (B > 30) & (R < 150)
    pale = m & (R > 150) & (R > B + 30)
    dark = m & (mx < 115) & ~blue
    chrome = m & (np.abs(R - B) < 25) & (mx >= 115) & ~blue & ~pale
    return a, {'sycamore': pale, 'ebony': dark, 'wool': blue, 'chrome': chrome}


def lab(rgb):
    c = np.array(rgb, float) / 255
    c = np.where(c > 0.04045, ((c + 0.055) / 1.055) ** 2.4, c / 12.92)
    m = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
    xyz = m @ c / np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 0.008856, xyz ** (1 / 3), 7.787 * xyz + 16 / 116)
    return np.array([116 * f[1] - 16, 500 * (f[0] - f[1]), 200 * (f[1] - f[2])])


if __name__ == '__main__':
    ra, rm = classify(sys.argv[1])
    da, dm = classify(sys.argv[2])
    print('%-10s %-18s %-18s %6s %8s' % ('family', 'reference median', 'render median', 'dE', 'px ratio'))
    for k in rm:
        if rm[k].sum() < 50 or dm[k].sum() < 50:
            print('%-10s  (reference %d px, render %d px)' % (k, rm[k].sum(), dm[k].sum()))
            continue
        r = np.median(ra[rm[k]], 0)
        d = np.median(da[dm[k]], 0)
        print('%-10s %-18s %-18s %6.1f %8.2f' % (
            k, tuple(int(v) for v in r), tuple(int(v) for v in d),
            float(np.linalg.norm(lab(r) - lab(d))),
            dm[k].sum() / rm[k].sum() * (rm[k].size / dm[k].size)))
