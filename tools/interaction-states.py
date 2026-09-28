#!/usr/bin/env python3
"""Regression diffs over tools/interaction-states.mjs's captures (holo-emitter-codex's matrix).
1 vs 4: the same closed desk before and after the key left, so the scene must match.
2 vs 5: open, key present vs key taken, so they may differ only in a small region (the key and its contact).
5 vs 6: open and empty, before and after a reload, so they must match (within 1 %: the GTAO pass
         seeds its noise randomly on each page load, so a reload is never pixel-identical).
At room distance the key is below a pixel's worth of change, so 2 vs 5 may be zero there.
Exits 1 on a failure."""
import sys, numpy as np, cv2
d = sys.argv[1]; bad = 0
def diff(a, b, cam):
    A = cv2.imread(f"{d}/{a}-{cam}.png").astype(np.int16); B = cv2.imread(f"{d}/{b}-{cam}.png").astype(np.int16)
    m = (np.abs(A - B).max(-1) > 6)
    return m.mean(), m
names = {1: "1-clean-closed", 2: "2-opened-key-revealed", 4: "4-closed-after-take", 5: "5-reopened-still-empty", 6: "6-returned-persisted"}
for cam in ("close", "room"):
    f14, _ = diff(names[1], names[4], cam); f56, _ = diff(names[5], names[6], cam); f25, m25 = diff(names[2], names[5], cam)
    ys, xs = np.nonzero(m25); box = (xs.max() - xs.min() + 1) * (ys.max() - ys.min() + 1) / m25.size if len(xs) else 0
    ok = f14 < 0.002 and f56 < 0.01 and f25 < 0.02 and box < 0.1 and (cam == "room" or f25 > 0)
    bad += not ok
    print(f"{cam}: 1v4 {f14:.4%} | 5v6 {f56:.4%} | 2v5 {f25:.4%} in a box of {box:.2%} of the frame -> {'pass' if ok else 'FAIL'}")
sys.exit(1 if bad else 0)
