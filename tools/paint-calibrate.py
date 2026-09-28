#!/usr/bin/env python3
"""Measure a painted facing's back wall and camera straight from its pixels.

The facing paintings are one-point perspective. Everything that recedes (the
floorboards, the side walls' mouldings, the wall/floor and wall/ceiling creases)
runs to one vanishing point, the camera's principal point on the horizon. The
back wall is square to the camera: its edges are horizontal and vertical only.

So: find the vanishing point from long receding segments (LSD + RANSAC), then
map "oblique-radial" edge energy, meaning gradients whose edge runs toward the
vanishing point at a slant. It is high on side walls and floor, and absent on the
back wall. The back wall's sides are where that energy stops, looking inward
along the bands above and below the horizon; its floor line is where the
floorboards' energy starts, looking down; its ceiling line is the strongest
edge between the plain ceiling and the wall.

    tools/paint-calibrate.py backdrops/<room> [--overlay out_dir] [--check measure.json]
prints a JSON list, one object per facing: {facing, vp:[x,y], x0, x1, floor, ceil}.
--check compares against hand measurements and exits 1 if any edge is off by more than 8 px.

Measured against the hand-read muniment room (2026-09-28): the ceiling line is within 2 px on
all four facings; the corners are within about 10 px on most, but E and S each miss one by
17-55 px; the floor line is taken from the facing's meta (within 15 px on three of four) because
the pixel reading (floor_from_pixels) is not yet reliable. Hand-check the corners and floor on a
gridded zoom before baking a shell from these numbers.
"""
import json, sys, os
import numpy as np, cv2

def vanishing_point(gray):
    g = cv2.createCLAHE(3.0, (8, 8)).apply(gray)
    s = cv2.createLineSegmentDetector().detect(g)[0].reshape(-1, 4)
    d = s[:, 2:] - s[:, :2]
    ln = np.hypot(d[:, 0], d[:, 1]); ang = np.degrees(np.arctan2(np.abs(d[:, 1]), np.abs(d[:, 0])))
    keep = (ln > 50) & (ang > 8) & (ang < 80)
    s, ln = s[keep], ln[keep]
    p, q = s[:, :2], s[:, 2:]
    n = np.stack([q[:, 1] - p[:, 1], p[:, 0] - q[:, 0]], 1); n /= np.linalg.norm(n, axis=1, keepdims=True)
    c = (n * p).sum(1)
    h, w = gray.shape
    rng = np.random.default_rng(0); best, score = None, -1
    for _ in range(4000):
        i, j = rng.choice(len(s), 2, replace=False)
        A = np.stack([n[i], n[j]])
        if abs(np.linalg.det(A)) < 0.05: continue
        v = np.linalg.solve(A, [c[i], c[j]])
        if not (0.3 * w < v[0] < 0.7 * w and 0.25 * h < v[1] < 0.75 * h): continue
        sc = (ln * np.exp(-((n @ v - c) / 4) ** 2)).sum()
        if sc > score: best, score = v, sc
    v = best
    for _ in range(5):
        wt = ln * np.exp(-((n @ v - c) / 4) ** 2)
        v = np.linalg.lstsq(n * wt[:, None], c * wt, rcond=None)[0]
    return v

def oblique_energy(gray, vp):
    g = cv2.GaussianBlur(gray.astype(np.float32), (0, 0), 1.2)
    gx, gy = cv2.Sobel(g, cv2.CV_32F, 1, 0, ksize=3), cv2.Sobel(g, cv2.CV_32F, 0, 1, ksize=3)
    mag = np.hypot(gx, gy)
    h, w = gray.shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    rx, ry = xx - vp[0], yy - vp[1]; rl = np.hypot(rx, ry) + 1e-3
    # edge direction is the gradient turned 90 degrees; radial if it lines up with the ray to the VP
    ex, ey = -gy / (mag + 1e-6), gx / (mag + 1e-6)
    radial = np.abs(ex * rx / rl + ey * ry / rl)
    slant = np.degrees(np.arctan2(np.abs(ey), np.abs(ex)))
    ob = mag * (radial > 0.97) * (slant > 8) * (slant < 82)
    return ob, mag

def step(profile, lo, hi, sign, win):
    """the index in [lo, hi) where the mean just after minus the mean just before is most sign-ward"""
    cs = np.concatenate([[0], np.cumsum(profile)])
    best, at = -np.inf, lo
    for i in range(max(lo, win), min(hi, len(profile) - win)):
        after = (cs[i + win] - cs[i]) / win; before = (cs[i] - cs[i - win]) / win
        v = sign * (after - before)
        if v > best: best, at = v, i
    return at

def measure(path):
    img = cv2.imread(path); gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape
    vp = vanishing_point(gray)
    ob, mag = oblique_energy(gray, vp)
    hz = int(vp[1])
    # the ceiling line: the strongest horizontal edge above the wall, between plain plaster and cornice
    gyabs = np.abs(cv2.Sobel(cv2.GaussianBlur(gray.astype(np.float32), (0, 0), 1.5), cv2.CV_32F, 0, 1, ksize=3))
    mid = slice(int(vp[0]) - 250, int(vp[0]) + 250)
    rowe = np.median(gyabs[:, mid], axis=1)
    lo, hi = 10, max(12, hz - 200)
    ceil = lo + int(np.argmax(rowe[lo:hi]))
    # the back wall's sides: the plain ceiling's lower edge runs exactly corner to corner. Read the
    # bright ceiling's extent a few rows above the crease, and follow its diagonal edges down to it
    lum = cv2.GaussianBlur(gray.astype(np.float32), (0, 0), 1.5)
    ys = list(range(max(2, ceil - 18), ceil - 3))
    # the ceiling fades toward the corners, but its edge against the dark side wall is still the
    # sharpest step in the row: rising on the left, falling on the right
    llum = np.log(lum + 4)                       # a ratio step: dark wall to lit plaster, whatever the level
    lx = [step(llum[y], int(0.06 * w), int(vp[0]) - 150, +1, 6) for y in ys]
    rx = [step(llum[y], int(vp[0]) + 150, int(0.94 * w), -1, 6) for y in ys]
    def robust_at(ys, xs, y):
        ys, xs = np.array(ys, float), np.array(xs, float); keep = np.ones(len(ys), bool)
        for _ in range(4):                       # refit without the rows a stray edge pulled away
            fit = np.polyfit(ys[keep], xs[keep], 1); res = np.abs(np.polyval(fit, ys) - xs)
            keep = res < max(4.0, np.median(res[keep]) * 2.5)
            if keep.sum() < 5: keep = res <= np.sort(res)[4]
        return int(round(np.polyval(fit, y)))
    x0 = robust_at(ys, lx, ceil); x1 = robust_at(ys, rx, ceil)
    # the floor line: the panels' vertical edges stop at the skirting's top; below that the dark
    # skirting gives way to the lighter floor. Columns near the vanishing point are skipped, where
    # the floorboards themselves run vertical
    gxa = np.abs(cv2.Sobel(cv2.GaussianBlur(gray.astype(np.float32), (0, 0), 1.2), cv2.CV_32F, 1, 0, ksize=3))
    cols = np.r_[x0 + 25:int(vp[0]) - 260, int(vp[0]) + 260:x1 - 25]
    vert = cv2.GaussianBlur(np.median(gxa[:, cols], axis=1)[:, None], (0, 0), 3)[:, 0]
    top = step(vert, hz + 80, h - 60, -1, 20)                       # the skirting's top
    bright = cv2.GaussianBlur(np.median(lum[:, cols], axis=1)[:, None], (0, 0), 2)[:, 0]
    floor_auto = step(bright, top + 10, min(h - 20, top + 90), +1, 8)
    # the floor line is NOT reliable from pixels yet (skirting and floor meet with little contrast):
    # the facing's stored meta is preferred where it exists, and the reading says which it used
    meta_p = os.path.splitext(path)[0] + ".meta.json"
    if os.path.exists(meta_p):
        floor, floor_source = int(round(json.load(open(meta_p))["floor_line_y"] * h)), "meta"
    else:
        floor, floor_source = floor_auto, "pixels (unreliable)"
    return dict(facing=os.path.basename(path)[0], w=w, h=h, vp=[round(float(vp[0]), 1), round(float(vp[1]), 1)],
                x0=int(x0), x1=int(x1), floor=int(floor), ceil=int(ceil), floor_source=floor_source, floor_from_pixels=int(floor_auto)), img

if __name__ == "__main__":
    room = sys.argv[1].rstrip("/")
    ov = sys.argv[sys.argv.index("--overlay") + 1] if "--overlay" in sys.argv else None
    chk = json.load(open(sys.argv[sys.argv.index("--check") + 1])) if "--check" in sys.argv else None
    out, bad = [], 0
    for f in "NESW":
        p = f"{room}/{f}.png"
        if not os.path.exists(p): continue
        r, img = measure(p); out.append(r)
        if chk and f in chk["facings"]:
            m = chk["facings"][f]; r["error_px"] = {k: r[k] - m[k] for k in ("x0", "x1", "floor", "ceil")}
            bad += any(abs(v) > 8 for v in r["error_px"].values())
        if ov:
            os.makedirs(ov, exist_ok=True)
            cv2.rectangle(img, (r["x0"], r["ceil"]), (r["x1"], r["floor"]), (0, 0, 255), 2)
            cv2.circle(img, (int(r["vp"][0]), int(r["vp"][1])), 6, (0, 255, 0), -1)
            cv2.imwrite(f"{ov}/{f}.jpg", img)
    print(json.dumps(out, indent=1))
    sys.exit(1 if bad else 0)
