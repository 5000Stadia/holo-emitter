#!/usr/bin/env python3
"""Measure a painted facing's back wall and camera straight from its pixels.

The facing paintings are one-point perspective: the back wall is a flat,
camera-facing rectangle and every receding edge (floorboards, side-wall
mouldings, the wall/floor and wall/ceiling creases) runs to one vanishing
point: the camera's principal point, on the horizon. The back wall's top and
bottom are its outermost long horizontal edges; its sides are where those
edges stop.

    tools/paint-calibrate.py backdrops/muniment_room [--overlay out_dir]
prints a JSON list, one object per facing: {facing, vp:[x,y], x0, x1, floor, ceil, ...}.
"""
import json, sys, os
import numpy as np, cv2

def segments(gray):
    g = cv2.createCLAHE(3.0, (8, 8)).apply(gray)
    s = cv2.createLineSegmentDetector().detect(g)[0].reshape(-1, 4)
    d = s[:, 2:] - s[:, :2]
    return s, np.hypot(d[:, 0], d[:, 1]), np.degrees(np.arctan2(np.abs(d[:, 1]), np.abs(d[:, 0])))

def vanishing_point(s, ln, ang, w, h):
    keep = (ln > 50) & (ang > 8) & (ang < 80)
    s, ln = s[keep], ln[keep]
    p, q = s[:, :2], s[:, 2:]
    n = np.stack([q[:, 1] - p[:, 1], p[:, 0] - q[:, 0]], 1)
    n /= np.linalg.norm(n, axis=1, keepdims=True)
    c = (n * p).sum(1)
    rng = np.random.default_rng(0)
    best, score = None, -1
    for _ in range(4000):
        i, j = rng.choice(len(s), 2, replace=False)
        A = np.stack([n[i], n[j]])
        if abs(np.linalg.det(A)) < 0.05: continue
        v = np.linalg.solve(A, [c[i], c[j]])
        if not (0.3 * w < v[0] < 0.7 * w and 0.25 * h < v[1] < 0.75 * h): continue
        r = np.abs(n @ v - c)
        sc = (ln * np.exp(-(r / 4) ** 2)).sum()
        if sc > score: best, score = v, sc
    v = best
    for _ in range(5):   # reweighted least squares around the best hypothesis
        r = np.abs(n @ v - c)
        wt = ln * np.exp(-(r / 4) ** 2)
        v = np.linalg.lstsq(n * wt[:, None], c * wt, rcond=None)[0]
    return v, int((np.abs(n @ v - c) < 4).sum()), float(np.median(np.abs(n @ v - c)[np.abs(n @ v - c) < 8]))

def back_wall(s, ln, ang, w, h, vp):
    hor = (ang < 3) & (ln > 120)
    s, ln = s[hor], ln[hor]
    y = (s[:, 1] + s[:, 3]) / 2
    xl, xr = np.minimum(s[:, 0], s[:, 2]), np.maximum(s[:, 0], s[:, 2])
    top = y < vp[1]
    ceil = np.min(y[top])
    # the floor crease: the lowest long horizontal edge above where the floor begins;
    # on the floor itself long horizontals are board ends, short and scattered
    below = ~top & (ln > 200)
    floor = np.max(y[below])
    near = lambda row: np.abs(y - row) < 10
    x0 = np.median(np.sort(xl[near(ceil)])[:2]); x1 = np.median(np.sort(xr[near(ceil)])[-2:])
    return float(x0), float(x1), float(floor), float(ceil)

def measure(room_dir, f):
    img = cv2.imread(f"{room_dir}/{f}.png")
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape
    m = json.load(open(f"{room_dir}/{f}.meta.json"))
    s, ln, ang = segments(gray)
    vp, nin, resid = vanishing_point(s, ln, ang, w, h)
    x0, x1, floor, ceil = back_wall(s, ln, ang, w, h, vp)
    return dict(facing=f, w=w, h=h, vp=[round(float(vp[0]), 1), round(float(vp[1]), 1)], vp_inliers=nin, vp_resid_px=round(resid, 2),
                x0=round(x0), x1=round(x1), floor=round(floor), ceil=round(ceil),
                openings=[dict(kind=o["kind"], corners=o["corners"]) for o in m.get("openings", []) if o.get("corners")]), img

if __name__ == "__main__":
    room = sys.argv[1].rstrip("/")
    ov = sys.argv[sys.argv.index("--overlay") + 1] if "--overlay" in sys.argv else None
    out = []
    for f in "NESW":
        if not os.path.exists(f"{room}/{f}.png"): continue
        r, img = measure(room, f)
        out.append(r)
        if ov:
            os.makedirs(ov, exist_ok=True)
            vx, vy = r["vp"]
            for x, y in [(r["x0"], r["floor"]), (r["x1"], r["floor"]), (r["x0"], r["ceil"]), (r["x1"], r["ceil"])]:
                cv2.line(img, (int(vx), int(vy)), (int(x + (x - vx) * 3), int(y + (y - vy) * 3)), (0, 200, 255), 1)
            cv2.rectangle(img, (r["x0"], r["ceil"]), (r["x1"], r["floor"]), (0, 0, 255), 2)
            cv2.circle(img, (int(vx), int(vy)), 6, (0, 255, 0), -1)
            cv2.imwrite(f"{ov}/{f}.jpg", img)
    print(json.dumps(out, indent=1))
