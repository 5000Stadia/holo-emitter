"""The depth-slider table: per roll, the corner-walk span (implied room depth)
and the far-wall dado stripe (the loop's ruler). Declared: span 585px = 11.2m,
stripe 110px."""
import importlib.util, os, sys
import numpy as np
from PIL import Image
ROOT = os.path.dirname(os.path.abspath(__file__)) + "/../../../../.."
ROOT = os.path.normpath(ROOT)
spec = importlib.util.spec_from_file_location("dd", os.path.join(ROOT, "tools/deep-draft.py"))
dd = importlib.util.module_from_spec(spec); spec.loader.exec_module(dd)

def span_of(path):
    base = Image.open(path).convert("RGB")
    g = np.asarray(base.convert("L")).astype(float)
    Gy = np.abs(np.diff(g, axis=0)); H, W = Gy.shape
    det, corners, _m = dd._detect_corner_lines(base, 86, 1451, 205.0, 750.0)
    ends = []
    for (x_edge, direction, sgn), (ya, m, sc) in zip(corners[:2], det[:2]):
        xs, ev = [], []
        x = int(x_edge); inward = -direction
        while 60 < x < W - 60:
            x += inward * 6
            yp = ya + m * (x - x_edge)
            lo, hi = int(max(1, yp - 5)), int(min(H - 1, yp + 5))
            if hi - lo < 3: break
            xs.append(x); ev.append(float(Gy[lo:hi, x].max()))
        ev = np.array(ev); xs = np.array(xs)
        ref = np.median(ev[:10]); endx = xs[-1]
        for i in range(len(ev) - 2):
            if (ev[i] < max(6.0, 0.3 * ref) and ev[i+1] < max(6.0, 0.35 * ref)
                    and ev[i+2] < max(6.0, 0.4 * ref)):
                endx = xs[i]; break
        ends.append(endx)
    span = abs(ends[1] - ends[0])
    # stripe at frame centre: dado-top and floor edges in the deep zone
    mid = slice(700, 840)
    gy_mid = Gy[:, mid].mean(axis=1)
    dtop = 480 + int(np.argmax(gy_mid[480:600]))
    foot = 600 + int(np.argmax(gy_mid[600:700]))
    return span, foot - dtop

def span_of_banded(path, yc, yf):
    """span_of with per-view detection bands (genre rolls)."""
    base = Image.open(path).convert("RGB")
    g = np.asarray(base.convert("L")).astype(float)
    Gy = np.abs(np.diff(g, axis=0)); H, W = Gy.shape
    det, corners, _m = dd._detect_corner_lines(base, 86, 1451, yc, yf)
    ends = []
    for (x_edge, direction, sgn), (ya, m, sc) in zip(corners[:2], det[:2]):
        xs, ev = [], []
        x = int(x_edge); inward = -direction
        while 60 < x < W - 60:
            x += inward * 6
            yp = ya + m * (x - x_edge)
            lo, hi = int(max(1, yp - 5)), int(min(H - 1, yp + 5))
            if hi - lo < 3: break
            xs.append(x); ev.append(float(Gy[lo:hi, x].max()))
        ev = np.array(ev); xs = np.array(xs)
        ref = np.median(ev[:10]); endx = xs[-1]
        for i in range(len(ev) - 2):
            if (ev[i] < max(6.0, 0.3 * ref) and ev[i+1] < max(6.0, 0.35 * ref)
                    and ev[i+2] < max(6.0, 0.4 * ref)):
                endx = xs[i]; break
        ends.append(endx)
    return abs(ends[1] - ends[0])

GENRES = [("kitchen-N", 190.0, 777.0), ("ward-N", 200.0, 741.0),
          ("noodle_bar-N", 200.0, 780.0)]

if __name__ == "__main__" and "--genre" in sys.argv:
    d0 = os.path.join(ROOT, "backdrops/source")
    print(f"{'roll':22} {'span':>5} {'depth':>6}   (declared: 585px / 11.2m)")
    for loc, yc, yf in GENRES:
        for i in "12":
            p_ = os.path.join(d0, loc, f"exp-g{i}.png")
            if not os.path.exists(p_):
                print(f"{loc}/exp-g{i}   missing"); continue
            try:
                span = span_of_banded(p_, yc, yf)
                print(f"{loc}/exp-g{i:1} {span:5.0f} {1024*6.4/max(span,1):5.2f}m")
            except SystemExit:
                print(f"{loc}/exp-g{i}   detector: no lines")
    raise SystemExit(0)

if __name__ == "__main__":
    d = os.path.join(ROOT, "backdrops/source/platform-E")
    print(f"{'roll':8} {'span':>5} {'depth':>6} {'stripe':>6}   (declared: 585px / 11.2m / 110px)")
    for v in "abcd":
        for i in "12":
            p = os.path.join(d, f"exp-{v}{i}.png")
            if not os.path.exists(p):
                print(f"exp-{v}{i}   missing"); continue
            try:
                span, stripe = span_of(p)
                print(f"exp-{v}{i} {span:5.0f} {1024*6.4/max(span,1):5.2f}m {stripe:5.0f}px")
            except SystemExit:
                print(f"exp-{v}{i}   detector: no lines")
