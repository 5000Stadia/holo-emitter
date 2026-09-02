#!/usr/bin/env python3
"""THE STANDARD's close guide, built from the wall's own best roll [Kabe,
2026-09-01: "assure a strong programatic process that produces good results ...
minimize the chances that the image execution is not usable"]. The painter's
close rolls come back the right picture at the wrong size: the wall drawn a
uniform ~0.85-0.92 of the ruled scale about the vanishing point, the corner
too far in, the dado too low, the ceiling too high. Re-rolling the same packet
is a lottery on that bias; this tool takes the bias out programmatically.

  HOLO_PACK=<pack> python3 tools/close-guide.py --wall <cell>/<F>
        [--from <roll.png>] [--precomp <z>] [--out <png>]
  HOLO_PACK=<pack> python3 tools/close-guide.py --wall <cell>/<F> --measure <roll.png>

One roll in (the wall's best by this tool's own ruler, or --from), one
prepared guide + its plane-locked ask out:
  * measure the roll: dado capping strip, wall foot, cornice line (rows, from
    the wall band's own horizontal steps), the in-frame corners (the wall's
    recession profile) and the door (the dark column run);
  * ONE uniform zoom (a circle stays a circle) puts the measured ruler
    (capping strip -> foot = the ruler's height) on the ruled rows, pivoted so
    the walled corner lands on its ruled column;
  * every plane is then cover-fit (uniform) into its ruled polygon: upper wall
    to the ruled cornice row, dado 1:1, ceiling and floor to the frame edges,
    returns from the roll's own return strip (seams converging to the VP), the
    door re-cut into its ruled rectangle;
  * --precomp z: the finished guide is zoomed z about the VP, so a painter who
    shrinks by 1/z hands back the ruled picture. The ask is written from the
    pre-compensated geometry. The loop learns z from each pair's measurements.
Writes <out>.png, <out>.png.ask.txt, <out>.png.mode ("prep"), <out>.args.json.
"""
import argparse, glob, json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

#: Gaussian radius the return strips are softened by (see `cover`).
RETURN_BLUR = 10
#: Columns kept clear of each in-frame corner when the ceiling and floor strips
#: are lifted from the roll (see the ceiling/floor covers).
RETURN_MARGIN = 80
#: Columns the source's wall span is inset from each measured corner before it
#: is bookmatched out over the source's own returns (a corner reads to ~25 px).
SPAN_INSET = 40
#: A source return narrower than this in the zoomed frame is not a strip.
RETURN_MIN_PX = 24

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "design", "plan-draft", "measured"))
from pack import active_pack  # noqa: E402
from measure import witness_corner  # noqa: E402

W, H = 1536, 1024
#: px/m of the close wall (focal 1024 at 4.8 m), the scale `measure_roll`'s
#: search bands are drawn for.
CLOSE_PPM = 1024.0 / 4.8
LONG = {"N": "north", "S": "south", "E": "east", "W": "west"}
SHADOW = (96, 82, 68); SEAM = (58, 48, 40)


def declared_meta(P, wall):
    """The DECLARED camera for this wall - `deriveMeta`, the one the scaffold
    emitter draws from. The baked fixture's `metas` is not it once the wall is
    promoted: the bake carries the MEASURED camera then (gallery/N: horizon
    390, floor 774 off a9024bfc's own returns), and a guide built on that
    re-asks the painter for the previous roll's drift instead of the ruled
    picture."""
    import subprocess
    loc, f = wall.split("/")
    js = ("import('./tools/pack.mjs').then(async ({activePack}) => {"
          "const {deriveMeta} = await import('./tools/plan-projection.mjs');"
          "const m = deriveMeta(activePack().plan, %s, %s);"
          "console.log(JSON.stringify(m)); })" % (json.dumps(loc), json.dumps(f)))
    r = subprocess.run(["node", "-e", js], cwd=ROOT, capture_output=True, text=True,
                       env={**os.environ, "HOLO_PACK": P.name})
    if r.returncode != 0:
        sys.exit("close-guide: deriveMeta failed for %s: %s" % (wall, r.stderr.strip()[-400:]))
    return json.loads(r.stdout.strip().splitlines()[-1])


# ---- measuring a roll -------------------------------------------------------

def step_profile(L, cols, y0, y1):
    """Mean |dL/dy| per row over the band's columns, with how much of the span
    carries the step (a true architectural horizontal lights up nearly every
    column; a floor reflection or a panel head does not)."""
    y0, y1 = int(max(1, y0)), int(min(H - 1, y1))
    band = L[y0 - 1:y1 + 1][:, cols]
    d = np.abs(np.diff(band, axis=0))
    strength = d.mean(axis=1)
    med = np.median(d, axis=1)
    horiz = np.array([(d[k] > 0.5 * med[k]).mean() if med[k] > 0 else 0.0 for k in range(len(d))])
    return np.arange(y0, y1 + 1), strength, horiz


def strong_steps(L, cols, y0, y1, frac=0.3, min_horiz=0.6):
    ys, s, h = step_profile(L, cols, y0, y1)
    if len(s) == 0 or s.max() <= 0:
        return []
    keep = (s >= frac * s.max()) & (h >= min_horiz)
    return [(int(y), float(v), float(hh)) for y, v, hh, k in zip(ys, s, h, keep) if k]


def cluster_centre(steps, y, reach=8):
    near = [(yy, v) for yy, v, _ in steps if abs(yy - y) <= reach]
    return float(sum(yy * v for yy, v in near) / max(1e-9, sum(v for _, v in near)))


def measure_roll(path, meta, ruler_m):
    """Rows and columns of the wall's architecture in one roll."""
    im = Image.open(path).convert("RGB")
    L = np.asarray(im.convert("L")).astype(float)
    ppm = float(meta["px_per_m_at_wall"])
    floor_y = float(meta["floor_line_y"]) * H
    rail_y = floor_y - ruler_m * ppm
    cx0, cx1 = float(meta["corner_x0_px"]), float(meta["corner_x1_px"])
    doors = [o for o in meta.get("openings", []) if o.get("kind") == "door"]
    # the search bands are sized for the close wall (4.8 m, 213 px/m); a deep
    # wall's architecture sits in the same bands shrunk by its own px/m
    kb = ppm / CLOSE_PPM
    keep = np.zeros(W, bool)
    keep[int(max(0, cx0)) + int(60 * kb):int(min(W, cx1)) - int(60 * kb)] = True
    for o in doors:
        keep[max(0, int(o["x"] - 100 * kb)):min(W, int(o["x"] + o["w"] + 100 * kb))] = False
    cols = np.nonzero(keep)[0]
    # the dado capping strip: the strongest step near the ruled rail row
    st = strong_steps(L, cols, rail_y - 90 * kb, rail_y + 90 * kb, frac=0.25)
    if not st:
        return None
    y_peak = max(st, key=lambda t: t[1])[0]
    rail_r = cluster_centre(st, y_peak)
    def level(y0, y1):
        return float(L[int(max(0, y0)):int(min(H, y1))][:, cols].mean())
    # the wall foot: the LOWEST strong horizontal below the dado that is
    # lighter underneath than above (the dado and its skirting are dark, the
    # floor is not; a skirting's top edge darkens downward and a carpet's
    # pattern rows are the same carpet on both sides)
    st = strong_steps(L, cols, rail_r + 150 * kb, min(H - 4, rail_r + 340 * kb), frac=0.3)
    st = [t for t in st if level(t[0] + 4, t[0] + 24) > 1.3 * level(t[0] - 24, t[0] - 4)]
    if not st:
        return None
    foot_r = float(max(st)[0])
    # the cornice line: the LOWEST strong horizontal well above the dado that
    # is brighter above than below (the lit cove over the veneer)
    st = strong_steps(L, cols, 8, rail_r - 200 * kb, frac=0.3)
    st = [t for t in st if level(t[0] - 24, t[0] - 4) > 1.2 * level(t[0] + 4, t[0] + 24)]
    ceil_r = float(max(st)[0]) if st else None
    # the door: a dark column run in the upper wall band
    door_r = None
    if doors and ceil_r is not None:
        # the band just above the rail: a door is void there whatever its head
        band = L[int(rail_r - 160 * kb):int(rail_r - 30 * kb)]
        prof = band.mean(axis=0)
        wall_level = np.median(prof[cols])
        dark = prof < 0.5 * wall_level
        runs, x = [], 0
        while x < W:
            if dark[x]:
                x0 = x
                while x < W and dark[x]:
                    x += 1
                if x - x0 >= 120 * kb:
                    runs.append((x0, x - 1))
            x += 1
        o = doors[0]
        want = o["x"] + o["w"] / 2
        if runs:
            r0, r1 = min(runs, key=lambda r: abs((r[0] + r[1]) / 2 - want))
            # the head: the row where the door's columns stop being dark
            colm = L[:, r0 + 10:r1 - 10].mean(axis=1)
            head = int(rail_r)
            while head > 8 and colm[head] < 0.5 * wall_level:
                head -= 1
            door_r = {"x0": int(r0), "x1": int(r1), "head": head}
    # corners: the verifier's own witness (the foot's and cornice's kinks,
    # the capping strip only where it stands clear of the horizon, snapped to
    # the vertical seam that runs the wall's height). The median of three
    # traced lines read saloon_e/E 894166d7's corner at 1511 for 1443 (the
    # strip's return runs level at eye height, a blind witness) and
    # saloon_n/N 8508ccbc's at 0 (a frame edge, taken as a corner and handed
    # the painter a black return). Not found is None, never an edge.
    hz = float(meta["horizon_y"]) * H
    kev = {}
    kx0 = kx1 = None
    if cx0 >= 0:
        kx0, ev0 = witness_corner(L, "left", floor_y=foot_r, rail_y=rail_r, ceil_y=ceil_r, horizon_y=hz)
        kev["left"] = dict(ev0 or {}, x=kx0)
        kx0 = None if kx0 is None or kx0 <= 4 else int(kx0)
    if cx1 <= W:
        kx1, ev1 = witness_corner(L, "right", floor_y=foot_r, rail_y=rail_r, ceil_y=ceil_r, horizon_y=hz)
        kev["right"] = dict(ev1 or {}, x=kx1)
        kx1 = None if kx1 is None or kx1 >= W - 4 else int(kx1)
    span = foot_r - rail_r
    return {"roll": os.path.relpath(path, ROOT), "rail": round(rail_r, 1), "foot": round(foot_r, 1),
            "ceiling": ceil_r, "door": door_r,
            "corner_x0": kx0, "corner_x1": kx1,
            "corner_evidence": kev, "ruler_px": round(span, 1),
            "scale": round(span / (ruler_m * ppm), 4),
            "storey_m": round((foot_r - ceil_r) / (span / ruler_m), 3) if ceil_r else None}


# ---- the guide --------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--wall", required=True)
    ap.add_argument("--from", dest="src")
    ap.add_argument("--from-wall", dest="src_wall",
                    help="cut the guide from this wall's promoted close asset (a follower from its lead)")
    ap.add_argument("--measure")
    ap.add_argument("--ruled", action="store_true", help="print the wall's ruled rows/columns as JSON")
    ap.add_argument("--precomp", type=float, default=1.0)
    ap.add_argument("--out")
    ap.add_argument("--store", default=os.path.join(ROOT, "backdrops"))
    a = ap.parse_args()
    P = active_pack()
    plan, voices, world = P.plan, P.voices, P.world
    loc, f = a.wall.split("/")
    meta = declared_meta(P, a.wall)
    ruler_m = P.ruler_height_m
    ppm = float(meta["px_per_m_at_wall"])
    D = float(meta["camera_wall_m"])
    storey = float(meta["storey_height_m"])
    VP = (W / 2.0, float(meta["horizon_y"]) * H)
    floor_y = float(meta["floor_line_y"]) * H
    rail_y = floor_y - ruler_m * ppm
    ceil_y = floor_y - storey * ppm
    cx0, cx1 = float(meta["corner_x0_px"]), float(meta["corner_x1_px"])
    doors = [o for o in meta.get("openings", []) if o.get("kind") == "door"]

    if a.ruled:
        print(json.dumps({"vp_x": VP[0], "vp_y": VP[1], "ceiling_y": ceil_y, "rail_y": rail_y,
                          "floor_y": floor_y, "corner_x0": cx0, "corner_x1": cx1, "ppm": ppm}))
        return 0
    if a.measure:
        m = measure_roll(a.measure, meta, ruler_m)
        print(json.dumps(m))
        return 0 if m else 1

    # ---- the bias pre-compensation, applied to the RULED GEOMETRY ----
    # The guide is built directly in its zoomed frame: every ruled row and
    # column is moved z about the VP before a plane is cut, so the covers fill
    # to the frame edges at any z (zooming the finished guide out for z < 1
    # left a black border the painter was handed as architecture).
    z = float(a.precomp)
    ruled = {"ceil": round(ceil_y, 1), "rail": round(rail_y, 1), "floor": round(floor_y, 1),
             "corner_x0": round(cx0, 1), "corner_x1": round(cx1, 1),
             "doors": [[round(o["x"]), round(o["y"]), round(o["x"] + o["w"]), round(o["y"] + o["h"])] for o in doors]}
    if abs(z - 1.0) > 1e-6:
        px = lambda x: VP[0] + z * (x - VP[0])
        py = lambda y: VP[1] + z * (y - VP[1])
        ceil_y, rail_y, floor_y = py(ceil_y), py(rail_y), py(floor_y)
        cx0, cx1 = px(cx0), px(cx1)
        doors = [dict(o, x=px(o["x"]), y=py(o["y"]), w=z * o["w"], h=z * o["h"]) for o in doors]

    # the source: --from-wall (a FOLLOWER's guide is cut from its room's
    # promoted close asset - the lead's painting, the room's own fabric at the
    # ruled scale, measured against ITS declared wall), else --from, else the
    # wall's best roll by this ruler
    if a.src_wall:
        sloc, sf = a.src_wall.split("/")
        src_path = os.path.join(a.store, sloc, sf + ".png")
        if not os.path.exists(src_path):
            sys.exit(f"close-guide: {a.src_wall} has no promoted store to cut from")
        smeta = declared_meta(P, a.src_wall)
        m = measure_roll(src_path, smeta, ruler_m)
        if not m:
            sys.exit(f"close-guide: could not measure {src_path}")
        m["roll"] = os.path.relpath(src_path, ROOT)
    else:
        smeta = meta
        if a.src:
            cands = [a.src]
        else:
            cands = sorted(glob.glob(os.path.join(a.store, "source", f"{loc}-{f}", "row23-*.png")))
        measured = [(m, p) for p in cands for m in [measure_roll(p, meta, ruler_m)] if m]
        if not measured:
            sys.exit(f"close-guide: no measurable roll for {a.wall}")
        m, src_path = min(measured, key=lambda t: abs(t[0]["scale"] - 1.0))
    roll = Image.open(src_path).convert("RGB")
    # the source's own wall span, in its own frame: a corner it has in frame,
    # else the frame edge the wall runs out through
    sc0 = m["corner_x0"] if m["corner_x0"] is not None else 0
    sc1 = m["corner_x1"] if m["corner_x1"] is not None else W

    # ---- one uniform zoom: ruler to the ruled rows, corner to its column ----
    s = (floor_y - rail_y) / (m["foot"] - m["rail"])
    ay = floor_y - s * m["foot"]
    # the source's corner lands on the ruled column where BOTH walls have
    # that corner in frame; otherwise the source's wall span is centred on the
    # ruled span (a foreign source's corner has nothing to land on)
    if m["corner_x0"] is not None and cx0 >= 0:
        ax, pivot = cx0 - s * m["corner_x0"], "left corner"
    elif m["corner_x1"] is not None and cx1 <= W:
        ax, pivot = cx1 - s * m["corner_x1"], "right corner"
    elif m["door"] and doors:
        ax, pivot = (doors[0]["x"] + doors[0]["w"] / 2) - s * (m["door"]["x0"] + m["door"]["x1"]) / 2, "door centre"
    else:
        ax, pivot = (max(0.0, cx0) + min(float(W), cx1)) / 2 - s * (sc0 + sc1) / 2, "wall-span centre"
    zoomed = roll.resize((max(1, int(round(W * s))), max(1, int(round(H * s)))), Image.LANCZOS)
    Z = Image.new("RGB", (W, H), (0, 0, 0))
    Z.paste(zoomed, (int(round(ax)), int(round(ay))))
    zx = lambda x: ax + s * x
    zy = lambda y: ay + s * y
    ceil_z = zy(m["ceiling"]) if m["ceiling"] is not None else ceil_y
    # the painted door's void, filled with the wall's own fabric (mirrored
    # from beside it) before any plane is cut - the ruled door is re-cut after
    if m["door"]:
        d0, d1 = int(zx(m["door"]["x0"])) - 24, int(zx(m["door"]["x1"])) + 24
        top = int(min(zy(m["door"]["head"]) - 24, ceil_z))
        wdt = d1 - d0
        arr = np.asarray(Z).astype(float)
        if d1 + wdt <= W:
            patch = arr[top:int(floor_y) + 1, d1:d1 + wdt][:, ::-1]
        else:
            patch = arr[top:int(floor_y) + 1, d0 - wdt:d0][:, ::-1]
        arr[top:int(floor_y) + 1, d0:d1] = patch
        Z = Image.fromarray(arr.clip(0, 255).astype(np.uint8))

    # the source's wall span in the zoomed frame, and the source with that
    # span mirror-tiled out over its own returns and any border: the facing
    # planes (ceiling, floor, dado, upper wall) are cut from this, so a source
    # narrower than the ruled span (a 6.4 m lead cut for a 12.8 m run, or a
    # roll that shrank) hands over more of the same fabric at the same scale
    # instead of a return or black where wall is ruled
    wz0, wz1 = int(round(max(0.0, zx(sc0)))), int(round(min(float(W), zx(sc1))))
    # a return strip is cut from the ZOOMED ROLL, not from the frame: past the
    # roll's own extent the frame is black (saloon_e/E 894166d7, s 0.966: the
    # roll ended at x 1458 and the strip 1434..1536 went to the painter as a
    # black return; it drew two corners). A strip narrower than RETURN_MIN_PX
    # is no strip, and the side falls to the mirrored or dimmed rule.
    rz0, rz1 = int(round(max(0.0, ax))), int(round(min(float(W), ax + s * W)))
    src_returns = {}
    if m["corner_x0"] is not None and wz0 - rz0 >= RETURN_MIN_PX:
        src_returns["left"] = (rz0, wz0)
    if m["corner_x1"] is not None and rz1 - wz1 >= RETURN_MIN_PX:
        src_returns["right"] = (wz1, rz1)
    # a measured corner is good to ~25 px; the span stays clear of the return
    t0 = wz0 + (SPAN_INSET if "left" in src_returns else 0)
    t1 = wz1 - (SPAN_INSET if "right" in src_returns else 0)
    arr = np.asarray(Z).astype(np.uint8)
    span = arr[:, t0:t1]
    if span.shape[1] >= 8:
        flipped = span[:, ::-1]
        n = (t0 + W - t1) // span.shape[1] + 2
        # bookmatched outward: the tile beside the span is its mirror
        left = np.concatenate([flipped if k % 2 == 0 else span for k in range(n)][::-1], axis=1)
        right = np.concatenate([flipped if k % 2 == 0 else span for k in range(n)], axis=1)
        ext = np.concatenate([left[:, left.shape[1] - t0:], span, right[:, :W - t1]], axis=1)
        Zw = Image.fromarray(ext[:, :W])
    else:
        Zw = Z

    canvas = Image.new("RGB", (W, H), (0, 0, 0))
    report = {}

    def cover(name, src, sbox, tpoly, tbox, anchor, blur=0):
        """Uniform cover-fit of src[sbox] into the polygon, anchored at a
        fraction (fx, fy) of the target box (0 = left/top, 1 = right/bottom).
        `blur` softens the piece before it is laid: a return strip lifted
        uniformly from the roll carries the roll's OWN cornice, capping strip
        and skirting at the roll's own slopes, and beside the ruled seams those
        are a second, wrong convergence the painter follows (gallery/N: the
        guide's return foot read at slope 0.71 against the seam's 0.365, and
        every guided roll came back at 0.61). Softened, the strip keeps its
        tone - walnut above, ebony below - and the drawn seams are the only
        lines on it."""
        sx0, sy0, sx1, sy1 = [int(round(v)) for v in sbox]
        sx0, sy0, sx1, sy1 = max(0, sx0), max(0, sy0), min(W, sx1), min(H, sy1)
        sw, sh = max(1, sx1 - sx0), max(1, sy1 - sy0)
        tx0, ty0, tx1, ty1 = tbox
        tw, th = max(1.0, tx1 - tx0), max(1.0, ty1 - ty0)
        sc = max(tw / sw, th / sh)
        pw, ph = max(1, round(sw * sc)), max(1, round(sh * sc))
        piece = src.crop((sx0, sy0, sx1, sy1)).resize((pw, ph), Image.LANCZOS)
        if blur:
            piece = piece.filter(ImageFilter.GaussianBlur(blur))
        fx_, fy_ = anchor
        px = tx0 + fx_ * (tw - pw)
        py = ty0 + fy_ * (th - ph)
        layer = Image.new("RGB", (W, H), (0, 0, 0))
        layer.paste(piece, (int(round(px)), int(round(py))))
        mask = Image.new("L", (W, H), 0)
        ImageDraw.Draw(mask).polygon([(float(p[0]), float(p[1])) for p in tpoly], fill=255)
        canvas.paste(layer, (0, 0), mask)
        report[name] = {"scale": round(sc, 4), **({"blur": blur} if blur else {})}

    def seam_at(corner_x, h_y):
        """The return's seam through (corner_x, h_y) toward the VP, as y(x)."""
        def at(x):
            if abs(corner_x - VP[0]) < 1e-6:
                return h_y
            return VP[1] + (h_y - VP[1]) * (x - VP[0]) / (corner_x - VP[0])
        return at

    returns = {}
    if cx0 >= 0:
        returns["left"] = cx0
    if cx1 <= W:
        returns["right"] = cx1
    xL, xR = max(0.0, cx0), min(float(W), cx1)

    # ceiling: above the cornice row, down the return seams to the frame edge
    top_poly = [(0, 0), (W, 0)]
    for side in ("right", "left"):
        x_edge = W if side == "right" else 0
        if side in returns:
            c = returns[side]
            pts = [(x_edge, seam_at(c, ceil_y)(x_edge)), (c, ceil_y)]
        else:
            pts = [(x_edge, ceil_y), (x_edge, ceil_y)]
        top_poly += pts if side == "right" else pts[::-1]
    # sourced between the returns only: the roll's own return junctions run
    # through its ceiling and floor strips at the roll's slopes, and laid under
    # the ruled seams they were a second convergence the painter followed
    mx0, mx1 = xL + RETURN_MARGIN, xR - RETURN_MARGIN
    cover("ceiling", Zw, (mx0, 0, mx1, ceil_z), top_poly, (0, 0, W, max(p[1] for p in top_poly)), (0.5, 1.0))
    # floor: below the foot, up the return seams to the frame edge
    bot_poly = [(0, H), (W, H)]
    for side in ("right", "left"):
        x_edge = W if side == "right" else 0
        if side in returns:
            c = returns[side]
            pts = [(x_edge, seam_at(c, floor_y)(x_edge)), (c, floor_y)]
        else:
            pts = [(x_edge, floor_y), (x_edge, floor_y)]
        bot_poly += pts if side == "right" else pts[::-1]
    cover("floor", Zw, (mx0, floor_y, mx1, H), bot_poly, (0, min(p[1] for p in bot_poly), W, H), (0.5, 0.0))
    # the facing wall: the dado 1:1 (the zoom already ruled it), the upper wall
    # cover-fit up to the ruled cornice row, both anchored at the walled corner
    fx_anchor = 0.0 if "left" in returns else (1.0 if "right" in returns else 0.5)
    cover("dado", Zw, (xL, rail_y, xR, floor_y), [(xL, rail_y), (xR, rail_y), (xR, floor_y), (xL, floor_y)],
          (xL, rail_y, xR, floor_y), (fx_anchor, 1.0))
    cover("upper_wall", Zw, (xL, ceil_z, xR, rail_y), [(xL, ceil_y), (xR, ceil_y), (xR, rail_y), (xL, rail_y)],
          (xL, ceil_y, xR, rail_y), (fx_anchor, 1.0))
    # returns: the source's own return strip on that side; the other side's
    # strip mirrored where the source has only one; the wall's own fabric
    # dimmed to a side wall's fall-off where it has none - split at the dado,
    # seams to the VP
    seams = []
    Zm = Z.transpose(Image.FLIP_LEFT_RIGHT)
    Zd = Image.fromarray((np.asarray(Zw).astype(float) * 0.55).astype(np.uint8))
    for side, c in returns.items():
        x_edge = 0.0 if side == "left" else float(W)
        top_at, rail_at, bot_at = seam_at(c, ceil_y), seam_at(c, rail_y), seam_at(c, floor_y)
        ctop, crail, cbot = (c, ceil_y), (c, rail_y), (c, floor_y)
        other = "right" if side == "left" else "left"
        if side in src_returns:
            rsrc, sbox_x, rfrom = Z, src_returns[side], "own"
        elif other in src_returns:
            o0, o1 = src_returns[other]
            rsrc, sbox_x, rfrom = Zm, (W - o1, W - o0), "mirrored"
        else:
            rsrc, sbox_x, rfrom = Zd, ((0, c) if side == "left" else (c, W)), "dimmed wall"
        anchor = (1.0, 1.0) if side == "left" else (0.0, 1.0)
        cover(f"{side}_return_upper", rsrc, (sbox_x[0], ceil_z, sbox_x[1], rail_y),
              [(x_edge, top_at(x_edge)), ctop, crail, (x_edge, rail_at(x_edge))],
              (min(x_edge, c), min(top_at(x_edge), ceil_y), max(x_edge, c), rail_y), anchor, blur=RETURN_BLUR)
        cover(f"{side}_return_lower", rsrc, (sbox_x[0], rail_y, sbox_x[1], H),
              [(x_edge, rail_at(x_edge)), crail, cbot, (x_edge, bot_at(x_edge))],
              (min(x_edge, c), rail_y, max(x_edge, c), max(bot_at(x_edge), floor_y)), (anchor[0], 0.0), blur=RETURN_BLUR)
        report[f"{side}_return_upper"]["from"] = report[f"{side}_return_lower"]["from"] = rfrom
        seams += [((x_edge, top_at(x_edge)), ctop), ((x_edge, bot_at(x_edge)), cbot), ((x_edge, rail_at(x_edge)), crail)]
    # the door, re-cut from the roll into its ruled rectangle
    door_rects = []
    for o in doors:
        rx0, ry0, rx1, ry1 = o["x"], o["y"], o["x"] + o["w"], o["y"] + o["h"]
        door_rects.append([round(rx0), round(ry0), round(rx1), round(ry1)])
        if not m["door"]:
            # the source has no door to lift: the ruled opening is drawn as
            # the void it is, a thin lit architrave around deep shadow
            dd_ = ImageDraw.Draw(canvas)
            dd_.rectangle([rx0 - 10, ry0 - 10, rx1 + 10, ry1], fill=(120, 96, 64))
            dd_.rectangle([rx0, ry0, rx1, ry1], fill=(8, 6, 5))
            report[f"door_{o['id']}"] = {"scale": 1.0, "from": "drawn void"}
            continue
        # from the unzoomed roll, architrave included, threshold on the foot
        cover(f"door_{o['id']}", roll,
              (m["door"]["x0"] - 14, m["door"]["head"] - 14, m["door"]["x1"] + 14, m["foot"]),
              [(rx0, ry0), (rx1, ry0), (rx1, ry1), (rx0, ry1)], (rx0, ry0, rx1, ry1), (0.5, 1.0))
    # PERMANENT architecture: soft occlusion shadow under a narrow dark seam
    dd = ImageDraw.Draw(canvas)

    def seam(a_, b_):
        dd.line([a_, b_], fill=SHADOW, width=9)
        dd.line([a_, b_], fill=SEAM, width=4)
    for s_ in seams:
        seam(*s_)
    seam((xL, ceil_y), (xR, ceil_y)); seam((xL, floor_y), (xR, floor_y))
    for c in returns.values():
        seam((c, ceil_y), (c, floor_y))

    g = {"ceil": ceil_y, "rail": rail_y, "floor": floor_y, "xL": cx0, "xR": cx1,
         "doors": [[float(v) for v in r] for r in door_rects]}

    out = a.out or os.path.join(a.store, "grown", f"{loc}-{f}.png")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    canvas.save(out, "PNG")

    # ---- the ask -------------------------------------------------------------
    cell = {r["id"]: r for r in plan["rooms"]}[loc]
    voice_id = voices["ROOM_VOICE"].get(loc) or voices["ARCHETYPE_FALLBACK"].get(cell.get("archetype"))
    voice = voices["VOICES"][voice_id]
    anchor = voices["ANCHORS"][voice["anchor"]]
    r0 = lambda v: int(round(v))
    legend = anchor["legend_word"].lower()
    in_frame = {side: (0 <= g["xL"] <= W) if side == "left" else (0 <= g["xR"] <= W) for side in ("left", "right")}
    in_frame = {side: v and side in returns for side, v in in_frame.items()}
    pts = []
    if in_frame["left"]:
        pts += [f"top-left ({r0(g['xL'])},{r0(g['ceil'])})", f"bottom-left ({r0(g['xL'])},{r0(g['floor'])})"]
    if in_frame["right"]:
        pts += [f"top-right ({r0(g['xR'])},{r0(g['ceil'])})", f"bottom-right ({r0(g['xR'])},{r0(g['floor'])})"]
    ceil_words = (f"its top edge, the cornice line, is row {r0(g['ceil'])}" if g["ceil"] >= 0 else
                  f"its top edge, the cornice line, lies at row {r0(g['ceil'])}, just above the top of the picture, so no ceiling is visible")
    floor_words = (f"its foot, where it meets the floor, is row {r0(g['floor'])}" if g["floor"] <= H else
                   f"its foot lies at row {r0(g['floor'])}, just below the bottom of the picture, so no floor is visible")
    rail_words = f"{anchor['line']} runs across it at row {r0(g['rail'])}"
    side_sentences = []
    for side in ("left", "right"):
        xc = g["xL"] if side == "left" else g["xR"]
        if side in returns and in_frame[side]:
            side_sentences.append(
                f"The {side} corner stands at column {r0(xc)}; between it and the {side} edge of the picture is the {side} "
                f"return, a narrow side wall seen almost edge-on, its cornice, {legend} and foot converging toward the vanishing "
                f"point. Pixels {side} of that corner seam belong to the {side} return and must never be painted as more facing wall.")
        elif side in returns:
            side_sentences.append(
                f"The {side} corner stands at column {r0(xc)}, just outside the {side} edge of the picture, so the facing wall "
                f"runs face-on to the {side} edge and no {side} return is visible.")
        else:
            side_sentences.append(
                f"There is NO {side} corner anywhere in this picture: the wall is {float(meta.get('wall_run_m', 0)):.1f} m long "
                f"and continues face-on, at one unbroken scale, out through the {side} edge of the picture. Never paint a "
                f"{side} corner, a {side} return or a {side} side wall.")
    corner_sentence = (
        f"At the native 1536 by 1024 resolution the facing wall's fixed control points are: " + "; ".join(pts) + ". "
        if pts else "At the native 1536 by 1024 resolution the facing wall fills the picture from edge to edge. ")
    door_words = ""
    for (dx0, dy0, dx1, dy1), o in zip(g["doors"], doors):
        door_words += (f" The door opening in the facing wall stands between columns {r0(dx0)} and {r0(dx1)}, its head at row "
                       f"{r0(dy0)} and its threshold at the wall's foot; it stays exactly as drawn: empty, no leaf hung in it, "
                       f"deep unlit shadow beyond it.")
    plane_words = []
    if g["ceil"] > 0:
        plane_words.append("the strip above the cornice line is ceiling")
    if g["floor"] < H:
        plane_words.append("the plane below the foot is floor")
    for side in returns:
        if in_frame[side]:
            plane_words.append(f"the {side} polygon is the {side} return")
    plane_words.append(f"everything between the cornice line and the foot, across the whole width, is the facing wall, "
                       f"its dado below the {legend} and its upper panelling above it")
    seams_words = [f"the horizontal cornice line along the top of the facing wall", f"the facing wall's own {legend}",
                   "the horizontal contact seam along its foot"]
    for side in returns:
        if in_frame[side]:
            seams_words = [f"the converging {side} cornice", f"the converging {side} {legend}",
                           f"the converging {side} floor seam", f"the {side} vertical corner seam"] + seams_words
    ask = (
        "This is constrained surface completion of Image 1, not scene generation, redesign, or recomposition. "
        "Use Image 1 at its native 1536 by 1024 resolution. Its camera position, field of view, horizon, vanishing point, "
        "composition, room depth, plane assignments, and architectural boundaries are final and immutable. Do not crop, resize, "
        "zoom, translate, widen, narrow, deepen, shorten, or recompose the image. "
        f"The camera stands exactly {D:g} metres from the facing {LONG[f]} wall, which is {storey:g} metres tall and fills the "
        f"picture at that close range: {ceil_words}; {rail_words}; {floor_words}. Preserve that unusually close, tall framing "
        "even if a smaller wall with more ceiling and floor around it would look more conventionally composed. "
        + corner_sentence
        + " ".join(side_sentences) + " "
        + "Do not move any corner. Do not change the wall's height, scale, or apparent distance: the wall must not be drawn "
        "smaller, farther away, or with more room around it than Image 1 shows. "
        + "The prepared surfaces are finished source material. Preserve them. "
        + f"The facing wall's {voice['walls']} - with {anchor['line']}, its panel scale, lighting and position - must remain unchanged."
        + door_words + " "
        + "A circle stays a circle at the same size and position. "
        + "Every pixel in Image 1 already belongs to its final plane. Preserve those plane assignments: "
        + "; ".join(plane_words) + ". Never reassign pixels from one plane to another. "
        + "All visible boundaries in Image 1 are permanent physical architecture, not temporary guide marks. Preserve them on their "
        + "existing centerlines: " + "; ".join(seams_words) + ". "
        + "Do not erase, relocate, straighten, relax, replace, or reinterpret any of these features. "
        + "Finish only the surface quality of the already pre-filled planes: resolve the veneer figure, the chrome, the "
        + "reflections and the lighting into one continuous photographic surface. Continue the existing convergence exactly: "
        + "every line running away from the camera keeps the fixed vanishing point shown in Image 1. Geometry takes priority "
        + "over seamlessness, realism, symmetry, and conventional room proportions. If a texture transition conflicts with the "
        + "fixed geometry, keep the geometry and resolve the texture only within its existing plane. Never solve a mismatch by "
        + "moving a corner, shrinking the wall, changing a plane boundary, or repainting finished material. The room remains "
        + "completely empty: no furniture, nobody, and no loose props. No legible text anywhere. Add no light fixtures, fans, "
        + "ceiling-mounted objects, or floor-mounted objects. The room is lit evenly and warmly as if by lamps outside the frame. "
        + f"Maintain the established fabric: {voice['walls']}; overhead, {voice['ceiling']}; underfoot, {voice['floor']}. "
        + f"Return the same 1536 by 1024 composition with the fixed {D:g} metre declared geometry intact. Surface completion is "
        + "permitted. Geometric reinterpretation is not."
    )
    open(out + ".ask.txt", "w").write(ask + "\n")
    open(out + ".mode", "w").write("prep\n")
    args = {"mode": "close-guide", "wall": a.wall, "pack": P.name, "roll": m["roll"], "measured": m,
            "zoom": {"s": round(s, 4), "pivot": pivot, "ax": round(ax, 1), "ay": round(ay, 1)},
            "ruled": ruled,
            "precomp": z, "guide_geometry": {k: ([[round(x, 1) for x in r] for r in v] if k == "doors" else round(v, 1))
                                             for k, v in g.items()},
            "returns": list(returns), "elements": report, "out": os.path.relpath(out, ROOT)}
    open(os.path.splitext(out)[0] + ".args.json", "w").write(json.dumps(args, indent=1) + "\n")
    stale = out + ".stale"
    if os.path.exists(stale):
        os.remove(stale)
    print(json.dumps({"ok": True, "mode": "close-guide", "wall": a.wall, "roll": m["roll"],
                      "measured": {k: m[k] for k in ("rail", "foot", "ceiling", "corner_x0", "corner_x1", "scale", "storey_m")},
                      "door": m["door"], "zoom": args["zoom"], "precomp": z, "out": args["out"]}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
