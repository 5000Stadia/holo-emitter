#!/usr/bin/env python3
"""Align-then-IoU between a render's silhouette and the reference's.

Raw silhouette IoU between a photograph and a procedural render is dominated by framing,
not fidelity (grimoire/review/self_correction.md). This normalises both masks to their own
bounding box before comparing, so what is scored is the SHAPE of the silhouette - which is
what a camera fit is actually trying to match.
"""
import sys, glob, os
import numpy as np
from PIL import Image

def mask(path, thresh=18):
    a = np.array(Image.open(path).convert('RGB')).astype(int)
    return np.abs(a - np.array([128, 128, 128])).sum(axis=2) > thresh

def normed(m, n=256):
    ys, xs = np.nonzero(m)
    if len(ys) == 0:
        return np.zeros((n, n), bool)
    sub = m[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    im = Image.fromarray((sub * 255).astype(np.uint8)).resize((n, n), Image.BILINEAR)
    return np.array(im) > 127

def iou(a, b):
    return float((a & b).sum()) / max(1, (a | b).sum())

if __name__ == '__main__':
    ref = normed(mask(sys.argv[1]))
    rows = []
    for p in sorted(glob.glob(sys.argv[2])):
        m = mask(p)
        ys, xs = np.nonzero(m)
        if len(ys) == 0:
            continue
        aspect = (xs.max() - xs.min() + 1) / (ys.max() - ys.min() + 1)
        rows.append((iou(ref, normed(m)), aspect, os.path.basename(p)))
    rows.sort(reverse=True)
    refm = mask(sys.argv[1]); ys, xs = np.nonzero(refm)
    print('reference aspect %.4f' % ((xs.max()-xs.min()+1)/(ys.max()-ys.min()+1)))
    for r in rows[:int(sys.argv[3]) if len(sys.argv) > 3 else 12]:
        print('%.4f  aspect %.4f  %s' % r)
