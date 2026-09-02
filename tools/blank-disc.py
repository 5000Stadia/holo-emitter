#!/usr/bin/env python3
"""Erase mounted discs (medallions, plaques) from a painted wall so it can
serve as a close-guide SOURCE after the voice stopped naming the object.

A guide is a picture the painter copies; a medallion left in it is painted
again whatever the prompt says. This finds every neutral (unsaturated),
bright, roughly round blob above the rail on a warm veneer wall and fills its
box with the same columns of wall from directly beneath it, feathered — the
veneer figure runs vertically so the panel seams stay in line. The result is
a guide source only, never a store asset (verifier-raw acceptance: what the
store holds is the painter's own output).

  python3 tools/blank-disc.py --in backdrops/saloon/S.png --out X.png [--rail 522]
Prints one JSON line: the discs found (bbox, fill offset) or none.
"""
import argparse
import json
import sys

import numpy as np
from PIL import Image, ImageFilter


def components(mask):
    """8-connected components of a sparse boolean mask (no scipy here)."""
    seen = np.zeros_like(mask, bool)
    H, W = mask.shape
    for y0, x0 in zip(*np.nonzero(mask)):
        if seen[y0, x0]:
            continue
        stack, ys, xs = [(y0, x0)], [], []
        seen[y0, x0] = True
        while stack:
            y, x = stack.pop()
            ys.append(y); xs.append(x)
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    yy, xx = y + dy, x + dx
                    if 0 <= yy < H and 0 <= xx < W and mask[yy, xx] and not seen[yy, xx]:
                        seen[yy, xx] = True
                        stack.append((yy, xx))
        yield np.array(ys), np.array(xs)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="src", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--rail", type=int, default=522, help="rail row: discs live above it")
    ap.add_argument("--ceiling", type=int, default=53)
    ap.add_argument("--min-r", type=int, default=20)
    ap.add_argument("--max-r", type=int, default=160)
    a = ap.parse_args()

    im = Image.open(a.src).convert("RGB")
    W, H = im.size
    rgb = np.asarray(im).astype(np.float32)
    mx, mn = rgb.max(axis=2), rgb.min(axis=2)
    sat = (mx - mn) / np.maximum(mx, 1.0)
    L = 0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]
    field = np.zeros((H, W), bool)
    field[a.ceiling + 10:a.rail - 10] = True
    # the wall is warm (saturated); chrome reflects it back with most of the
    # colour drained - well under the wall's own saturation - and never dark
    wall_sat = float(np.median(sat[field]))
    cand = field & (sat < 0.72 * wall_sat) & (L > 60)
    m = Image.fromarray((cand * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(5))
    cand = np.asarray(m) > 0
    discs = []
    for ys, xs in components(cand):
        h, w = ys.max() - ys.min() + 1, xs.max() - xs.min() + 1
        r = (h + w) / 4
        if r < a.min_r or r > a.max_r:
            continue
        if abs(h - w) / max(h, w) > 0.25:
            continue
        fill = len(ys) / (np.pi * r * r)
        if fill < 0.6:
            continue
        discs.append(dict(x0=int(xs.min()), x1=int(xs.max()), y0=int(ys.min()), y1=int(ys.max()),
                          r=round(float(r), 1), fill=round(float(fill), 2)))
    out = np.asarray(im).copy()
    for d in discs:
        pad = int(d["r"] * 0.4) + 8  # the rim highlight and the drop shadow sit outside the neutral blob
        x0, x1 = max(0, d["x0"] - pad), min(W, d["x1"] + pad + 1)
        y0, y1 = max(a.ceiling, d["y0"] - pad), min(a.rail, d["y1"] + pad + 1)
        hh = y1 - y0
        # donor rows: the same columns of wall directly beneath the box (the
        # light there is the box's own light), mirrored upward from the box's
        # foot so the join row is continuous; a short band reflects
        band = out[y1:a.rail - 16, x0:x1].astype(np.float32)
        n = band.shape[0]
        if n < 8:
            band = out[a.ceiling + 6:y0, x0:x1].astype(np.float32)[::-1]
            n = band.shape[0]
        idx = np.arange(hh)
        period = max(1, 2 * (n - 1))
        idx = idx % period
        idx = np.where(idx >= n, period - idx, idx)
        patch = band[idx][::-1]
        dy = int(n)
        # the wall is lit unevenly (cove light falls off toward the rail):
        # re-level the donor rows to the wall flanking the box, row by row,
        # interpolated left flank -> right flank, per channel
        fl = max(0, x0 - 40); fr = min(W, x1 + 40)
        left = out[y0:y1, fl:x0].astype(np.float32).mean(axis=1) if x0 > fl else None
        right = out[y0:y1, x1:fr].astype(np.float32).mean(axis=1) if fr > x1 else None
        left = right if left is None else left
        right = left if right is None else right
        t = np.linspace(0.0, 1.0, x1 - x0)[None, :, None]
        target = (1 - t) * left[:, None, :] + t * right[:, None, :]
        have = patch.mean(axis=1, keepdims=True)
        patch = np.clip(patch * np.clip(target / np.maximum(have, 1.0), 0.7, 1.4), 0, 255)
        # feather the box edges so the join does not read as a cut
        fy = np.minimum(np.arange(hh), np.arange(hh)[::-1]) / max(1.0, min(pad, hh / 2))
        fx = np.minimum(np.arange(x1 - x0), np.arange(x1 - x0)[::-1]) / max(1.0, min(pad, (x1 - x0) / 2))
        alpha = np.clip(np.minimum(fy[:, None], fx[None, :]), 0, 1)[..., None]
        out[y0:y1, x0:x1] = (alpha * patch + (1 - alpha) * out[y0:y1, x0:x1]).astype(np.uint8)
        d["fill_dy"] = int(dy)
    Image.fromarray(out).save(a.out)
    print(json.dumps(dict(ok=True, src=a.src, out=a.out, discs=discs)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
