#!/usr/bin/env python3
"""THE STANDARD's guide, built from the plan [growth doctrine, phase 1 amended
2026-08-31: "Deep and backward views are built only after, as G-PREP guides
whose far-wall element is cover-fit from the CLOSE painting of the wall being
faced"]. One deep facing in, one prepared guide + its plane-locked ask out:

  HOLO_PACK=<pack> python3 tools/deep-guide.py --wall <cell>/<F> [--out <png>]

What the plan decides (nothing here is chosen per scene):
  * the far wall = every cell standing on the facing's wall line, each cell's
    own span cut from ITS close painting of that wall and set down at its plan
    position, scaled once by close/deep (uniform - a circle stays a circle);
    a square room's far wall is two close paintings side by side, its far
    corner off the frame where the run says so;
  * each side is a WALL (its seams converge to the far corner; the shell's own
    side strip is cover-fit above and below the ruled dado) or OPEN (a full-
    width open edge stands on that side of any cell along the axis: no wall,
    no corner, no return - ceiling and floor run to the frame edge and the far
    wall continues face-on past it);
  * ceiling and floor pre-fill from the shell, the close painting of the far
    cell straight ahead (the same fabric, the same side wall);
  * the ask names the fixed corner columns, the open side, the far wall's own
    features (a door where the close painting carries one) and the voice's
    fabric - in words the register would accept.
  * [2026-09-01, the close-guide standard] every close painting is cut at its
    MEASURED cornice, foot and corners (close-guide.measure_roll against that
    wall's declared camera), not at the declared rows - a promoted painting
    sits within 2 % of them and 2 % of a wall is a cove or a skirting; every
    piece is laid by one uniform scale (a circle stays a circle); the side
    walls are softened (RETURN_BLUR) so the drawn seams are the only lines on
    them; ceiling and floor are lifted from between the shell's returns;
  * --precomp z: the ruled geometry is zoomed z about the VP before anything
    is cut (the far wall is set at D/z), so a painter who shrinks by 1/z hands
    back the ruled picture. The ask is written from the pre-compensated rows.
    The loop (tools/roll-loop.py --guide deep) learns z from each pair.
Writes <out>.png, <out>.png.ask.txt, <out>.png.mode ("prep"), <out>.args.json;
refuses fail-closed on a mid-room artifact band (G-PREP r2 guard).
"""
import argparse, importlib.util, json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "design", "plan-draft", "measured"))
from pack import active_pack  # noqa: E402

_cg_spec = importlib.util.spec_from_file_location("close_guide", os.path.join(ROOT, "tools", "close-guide.py"))
close_guide = importlib.util.module_from_spec(_cg_spec)
_cg_spec.loader.exec_module(close_guide)
declared_meta, measure_roll = close_guide.declared_meta, close_guide.measure_roll
RETURN_BLUR, RETURN_MARGIN = close_guide.RETURN_BLUR, close_guide.RETURN_MARGIN

W, H = 1536, 1024
FOCAL = 1024.0
VP = (768.0, 526.1)
EYE_M = 1.183
EPS = 1e-6
FWD = {"N": (0, 1), "S": (0, -1), "E": (1, 0), "W": (-1, 0)}
RGT = {"N": (1, 0), "S": (-1, 0), "E": (0, -1), "W": (0, 1)}
LONG = {"N": "north", "S": "south", "E": "east", "W": "west"}


def far_edge(cell, f):
    r = cell["rect"]
    return r["y1"] if f == "N" else r["y0"] if f == "S" else r["x1"] if f == "E" else r["x0"]


def side_edge(cell, f, side):
    """The world coordinate of a cell's LEFT/RIGHT edge as facing f sees it."""
    r = cell["rect"]
    rx, ry = RGT[f]
    if rx:   # lateral axis is x
        return r["x1"] if (rx > 0) == (side == "right") else r["x0"]
    return r["y1"] if (ry > 0) == (side == "right") else r["y0"]


def lateral_span(cell, f):
    r = cell["rect"]
    return (r["x0"], r["x1"]) if RGT[f][0] else (r["y0"], r["y1"])


def open_edges_of(plan, cell):
    """Full-width open edges on this cell, with the neighbour and the side of
    the cell they stand on (as world axis + coordinate)."""
    out = []
    for o in plan.get("openings", []):
        if o.get("kind") != "open_edge" or o.get("floor") != cell.get("floor") or not o.get("rect"):
            continue
        if cell["id"] not in o.get("joins", []):
            continue
        rr = o["rect"]
        along = "y" if abs(rr["x0"] - rr["x1"]) < EPS else "x"
        full = rr[along + "0"] <= cell["rect"][along + "0"] + EPS and cell["rect"][along + "1"] - EPS <= rr[along + "1"]
        if not full:
            continue
        other = [j for j in o["joins"] if j != cell["id"]][0]
        fixed = "x" if along == "y" else "y"
        out.append({"to": other, "axis": fixed, "at": rr[fixed + "0"], "id": o["id"]})
    return out


def connected(plan, cell):
    by = {r["id"]: r for r in plan["rooms"]}
    seen, q = {cell["id"]}, [cell]
    while q:
        c = q.pop(0)
        for oe in open_edges_of(plan, c):
            if oe["to"] in seen or oe["to"] not in by:
                continue
            seen.add(oe["to"]); q.append(by[oe["to"]])
    return [by[i] for i in seen]


def cells_ahead(plan, cell, f):
    """The chain of cells straight ahead across full-width open edges in f."""
    by = {r["id"]: r for r in plan["rooms"]}
    chain, c = [cell], cell
    for _ in range(8):
        edge = far_edge(c, f)
        axis = "y" if FWD[f][1] else "x"
        nxt = None
        for oe in open_edges_of(plan, c):
            if oe["axis"] == axis and abs(oe["at"] - edge) < EPS:
                nxt = by.get(oe["to"])
        if not nxt:
            break
        chain.append(nxt); c = nxt
    return chain


def project(u, d, h):
    """view-relative lateral u (m, right +), depth d (m), height h (m) -> px."""
    return VP[0] + u * FOCAL / d, VP[1] + (EYE_M - h) * FOCAL / d


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--wall", required=True)
    ap.add_argument("--out")
    ap.add_argument("--store", default=os.path.join(ROOT, "backdrops"))
    ap.add_argument("--precomp", type=float, default=1.0)
    a = ap.parse_args()
    P = active_pack()
    plan, voices, world = P.plan, P.voices, P.world
    loc, f = a.wall.split("/")
    by = {r["id"]: r for r in plan["rooms"]}
    cell = by[loc]
    fc = cell["facings"][f]
    D = float(fc["camera_wall_m"])
    D_close = 4.8 if "camera_close_m" not in fc else float(fc["camera_close_m"])
    storey = next((fl["storey_height_m"] for fl in plan.get("floors", []) if fl["id"] == cell["floor"]), 3.4)
    ruler_h = float(world["ruler"]["height_m"])
    # the declared camera (deriveMeta) must be the one this file projects with
    meta = declared_meta(P, a.wall)
    if abs(float(meta["horizon_y"]) * H - VP[1]) > 0.5 or abs(float(meta["px_per_m_at_wall"]) - FOCAL / D) > 0.05:
        sys.exit(f"deep-guide: declared camera for {a.wall} (horizon {meta['horizon_y']}, ppm {meta['px_per_m_at_wall']}) "
                 f"is not the projection this guide is drawn with")
    sx, sy = fc["standpoint"]["x"], fc["standpoint"]["y"]
    fx, fy = FWD[f]; rx, ry = RGT[f]
    u_of = lambda x, y: (x - sx) * rx + (y - sy) * ry
    wall_line = fc["wall_line"]
    # the bias pre-compensation: zooming the ruled picture z about the VP is
    # the same picture with every depth divided by z, so the guide is drawn
    # at Dt and its covers fill to the frame edges at any z
    z = float(a.precomp)
    Dt = D / z
    ceil_far = project(0, Dt, storey)[1]
    floor_far = project(0, Dt, 0.0)[1]
    rail_far = project(0, Dt, ruler_h)[1]
    k = D_close / Dt

    # the far wall: cells on the wall line, connected, by plan position
    far_cells = [c for c in connected(plan, cell) if abs(far_edge(c, f) - wall_line) < EPS]
    far_cells.sort(key=lambda c: u_of(*(((c["rect"]["x0"] + c["rect"]["x1"]) / 2, (c["rect"]["y0"] + c["rect"]["y1"]) / 2))))
    if not far_cells:
        sys.exit(f"deep-guide: no cell stands on {a.wall}'s wall line {wall_line}")
    ahead = cells_ahead(plan, cell, f)
    shell_cell = ahead[-1]
    if abs(far_edge(shell_cell, f) - wall_line) > EPS:
        sys.exit(f"deep-guide: {a.wall} does not reach its wall line across open edges")

    # sides: wall or open, judged along the whole axis
    sides = {}
    for side in ("left", "right"):
        opened = []
        for c in ahead:
            edge = side_edge(c, f, side)
            axis = "x" if rx else "y"
            for oe in open_edges_of(plan, c):
                if oe["axis"] == axis and abs(oe["at"] - edge) < EPS:
                    opened.append(oe["id"])
        u_side = u_of(*((side_edge(cell, f, side), sy) if rx else (sx, side_edge(cell, f, side))))
        sides[side] = {"open": bool(opened), "via": opened, "u_m": u_side}

    # far corners in the deep frame
    span_lo = min(u_of(*p) for c in far_cells for p in corners_of(c))
    span_hi = max(u_of(*p) for c in far_cells for p in corners_of(c))
    xL = project(span_lo, Dt, 0)[0]
    xR = project(span_hi, Dt, 0)[0]
    run_m = span_hi - span_lo

    # ---- the guide -------------------------------------------------------
    store = a.store
    shell_path = os.path.join(store, shell_cell["id"], f + ".png")
    if not os.path.exists(shell_path):
        sys.exit(f"deep-guide: the shell's close painting {shell_path} is not promoted yet (phase 1 first)")
    shell = Image.open(shell_path).convert("RGB")
    canvas = Image.new("RGB", (W, H), (0, 0, 0))
    report = {}

    def cover(name, src, sbox, tpoly, tbox, anchor, blur=0):
        """Uniform cover-fit of src[sbox] into the polygon, anchored at a
        fraction (fx, fy) of the target box (0 = left/top, 1 = right/bottom);
        `blur` softens the piece before it is laid (a side wall lifted from
        the shell's return strip carries the shell's own cornice, capping strip
        and skirting, and beside the ruled seams those are a second, wrong
        convergence the painter follows - softened, the strip keeps its tone
        and the drawn seams are the only lines on it)."""
        sx0, sy0, sx1, sy1 = [int(round(v)) for v in sbox]
        sx0, sy0, sx1, sy1 = max(0, sx0), max(0, sy0), min(W, sx1), min(H, sy1)
        sw, sh = max(1, sx1 - sx0), max(1, sy1 - sy0)
        tx0, ty0, tx1, ty1 = tbox
        tw, th = max(1.0, tx1 - tx0), max(1.0, ty1 - ty0)
        s = max(tw / sw, th / sh)
        pw, ph = max(1, round(sw * s)), max(1, round(sh * s))
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
        report[name] = {"scale": round(s, 4), **({"blur": blur} if blur else {})}

    # close-frame rows and corners of a promoted painting: MEASURED against
    # its own declared camera (the verifier admits 2 %, and 2 % of a wall is
    # the cove or the skirting - cut at the declared rows, the far wall carried
    # a strip of ceiling above its cornice); declared where nothing reads
    def close_frame(path, wall):
        cm = declared_meta(P, wall)
        ppm_c = float(cm["px_per_m_at_wall"])
        floor_d = float(cm["floor_line_y"]) * H
        ruled_c = {"ceil": floor_d - storey * ppm_c, "rail": floor_d - ruler_h * ppm_c, "foot": floor_d,
                   "x0": float(cm["corner_x0_px"]), "x1": float(cm["corner_x1_px"])}
        m = measure_roll(path, cm, ruler_h)
        if not m:
            return ruled_c, {"from": "declared (unmeasurable)"}
        fr = {"ceil": m["ceiling"] if m["ceiling"] is not None else ruled_c["ceil"],
              "rail": m["rail"], "foot": m["foot"],
              "x0": m["corner_x0"] if m["corner_x0"] is not None else ruled_c["x0"],
              "x1": m["corner_x1"] if m["corner_x1"] is not None else ruled_c["x1"]}
        return fr, {"from": "measured", "scale": m["scale"], "door": m["door"]}

    shell_fr, shell_m = close_frame(shell_path, f"{shell_cell['id']}/{f}")
    ceil_c, rail_c, floor_c = shell_fr["ceil"], shell_fr["rail"], shell_fr["foot"]
    sxL, sxR = shell_fr["x0"], shell_fr["x1"]
    report["shell"] = {"painting": os.path.relpath(shell_path, ROOT), "rows": {k_: round(v, 1) for k_, v in shell_fr.items()}, **shell_m}

    def seam_line(side, h):
        """y on the side wall's seam at height h, as a function of x."""
        u = sides[side]["u_m"]
        xf, yf = project(u, Dt, h)
        def at(x):
            if abs(xf - VP[0]) < 1e-6:
                return yf
            return VP[1] + (yf - VP[1]) * (x - VP[0]) / (xf - VP[0])
        return at, (xf, yf)

    JM, VM = 28, 10
    # ceiling polygon
    top_poly = [(0, 0), (W, 0)]
    for side in ("right", "left"):
        x_edge = W if side == "right" else 0
        if sides[side]["open"]:
            pts = [(x_edge, ceil_far), (min(max(xR if side == "right" else xL, 0), W), ceil_far)]
        else:
            at, corner = seam_line(side, storey)
            pts = [(x_edge, at(x_edge)), corner]
        top_poly += pts if side == "right" else pts[::-1]
    # sourced between the shell's returns only: its own return junctions run
    # through its ceiling and floor strips at the close slopes
    mx0, mx1 = max(0.0, sxL) + RETURN_MARGIN, min(float(W), sxR) - RETURN_MARGIN
    cover("ceiling", shell, (mx0, 0, mx1, ceil_c - JM), top_poly,
          (0, 0, W, max(p[1] for p in top_poly)), (0.5, 0.0))
    # floor polygon
    bot_poly = [(0, H), (W, H)]
    for side in ("right", "left"):
        x_edge = W if side == "right" else 0
        if sides[side]["open"]:
            pts = [(x_edge, floor_far), (min(max(xR if side == "right" else xL, 0), W), floor_far)]
        else:
            at, corner = seam_line(side, 0.0)
            pts = [(x_edge, at(x_edge)), corner]
        bot_poly += pts if side == "right" else pts[::-1]
    fy0 = floor_c + JM
    g0 = np.asarray(shell.convert("L")).astype(float)
    strip = np.abs(np.diff(g0[int(fy0):H - 8, int(mx0):int(mx1)], axis=0)).mean(axis=1)
    if len(strip) > 20:
        med = float(np.median(strip)); mx = float(strip.max())
        if mx > max(9.0, 5.0 * (med + 0.3)):
            fy0 = min(H - 60, int(fy0) + int(np.argmax(strip)) + 40)
    cover("floor", shell, (mx0, fy0, mx1, H), bot_poly,
          (0, min(p[1] for p in bot_poly), W, H), (0.5, 1.0))
    # side walls: the shell's own return strip on that side, split at the
    # ruled dado; the other side's strip mirrored where the shell has only
    # one; the shell's wall dimmed to a side wall's fall-off where it has none
    shell_returns = {}
    if sxL > VM:
        shell_returns["left"] = (0, sxL - VM)
    if sxR < W - VM:
        shell_returns["right"] = (sxR + VM, W)
    shell_m_ = shell.transpose(Image.FLIP_LEFT_RIGHT)
    shell_d = Image.fromarray((np.asarray(shell).astype(float) * 0.55).astype(np.uint8))
    seams = []
    for side in ("left", "right"):
        if sides[side]["open"]:
            continue
        x_edge = 0.0 if side == "left" else float(W)
        top_at, ctop = seam_line(side, storey)
        bot_at, cbot = seam_line(side, 0.0)
        rail_at, crail = seam_line(side, ruler_h)
        other = "right" if side == "left" else "left"
        if side in shell_returns:
            rsrc, sbox_x, rfrom = shell, shell_returns[side], "own"
        elif other in shell_returns:
            o0, o1 = shell_returns[other]
            rsrc, sbox_x, rfrom = shell_m_, (W - o1, W - o0), "mirrored"
        else:
            rsrc, sbox_x, rfrom = shell_d, (mx0, mx1), "dimmed wall"
        anchor = (1.0, 1.0) if side == "left" else (0.0, 1.0)
        cover(f"{side}_wall_upper", rsrc, (sbox_x[0], ceil_c, sbox_x[1], rail_c),
              [(x_edge, top_at(x_edge)), ctop, crail, (x_edge, rail_at(x_edge))],
              (min(x_edge, ctop[0]), min(top_at(x_edge), ctop[1]), max(x_edge, ctop[0]), max(rail_at(x_edge), crail[1])),
              anchor, blur=RETURN_BLUR)
        cover(f"{side}_wall_lower", rsrc, (sbox_x[0], rail_c, sbox_x[1], H),
              [(x_edge, rail_at(x_edge)), crail, cbot, (x_edge, bot_at(x_edge))],
              (min(x_edge, ctop[0]), min(rail_at(x_edge), crail[1]), max(x_edge, ctop[0]), max(bot_at(x_edge), cbot[1])),
              (anchor[0], 0.0), blur=RETURN_BLUR)
        report[f"{side}_wall_upper"]["from"] = report[f"{side}_wall_lower"]["from"] = rfrom
        seams += [((x_edge, top_at(x_edge)), ctop), ((x_edge, bot_at(x_edge)), cbot), ((x_edge, rail_at(x_edge)), crail)]
    # the far wall: each cell's own span from its close painting, at its place
    far_report = []
    doors = []
    door_gaps = []   # far-frame column spans where a far cell's painting has a void
    for c in far_cells:
        cpath = os.path.join(store, c["id"], f + ".png")
        if not os.path.exists(cpath):
            sys.exit(f"deep-guide: far wall needs {cpath} promoted first (phase 1 first)")
        close = Image.open(cpath).convert("RGB")
        cfr, cm_ = close_frame(cpath, f"{c['id']}/{f}")
        # the cell's own span in its close frame: the measured corner where
        # it has one, the frame edge where its wall runs out of the picture
        src_x0, src_x1 = max(0.0, cfr["x0"]), min(float(W), cfr["x1"])
        d_lo = min(u_of(*p) for p in corners_of(c)); d_hi = max(u_of(*p) for p in corners_of(c))
        dx0 = project(d_lo, Dt, 0)[0]; dx1 = project(d_hi, Dt, 0)[0]
        # one uniform scale, the foot on the ruled foot row, the span centred;
        # a close corner is good to ~25 px, so the cover overfills by that
        # much of wall rather than reveal a return
        tx0, tx1 = max(0.0, dx0), min(float(W), dx1)
        if tx1 - tx0 < 2:
            continue
        # the source's columns that the in-frame target span covers
        sc = (src_x1 - src_x0) / max(1e-6, dx1 - dx0)
        sb = (src_x0 + (tx0 - dx0) * sc, cfr["ceil"], src_x0 + (tx1 - dx0) * sc, cfr["foot"])
        cover(f"far_wall_{c['id']}", close, sb,
              [(tx0, ceil_far), (tx1, ceil_far), (tx1, floor_far), (tx0, floor_far)],
              (tx0, ceil_far, tx1, floor_far), (0.5, 1.0))
        far_report.append({"cell": c["id"], "from": os.path.relpath(cpath, ROOT), "at_px": [round(dx0), round(dx1)],
                           "scale": report[f"far_wall_{c['id']}"]["scale"], "rows": {k_: round(v, 1) for k_, v in cfr.items()}, **cm_})
        # [saloon_n/S, 2026-09-01] THE SEAMS STOP AT A DOORWAY. The far seams
        # (cornice, capping strip, foot) were ruled straight across the far
        # wall, doorway included: saloon_n/S's guide carried the chrome strip
        # across door02's void, both rolls copied it (a 9-row bar across the
        # opening at 1.2 m), the door reader's head walk stopped on the bar at
        # 1.06 m and the promotion refused a doorway the painter had painted.
        # The void's columns are the close painting's own measured door,
        # carried through the cover's mapping (uniform scale, centred).
        dr = cm_.get("door") if isinstance(cm_, dict) else None
        if dr:
            sx0r, sx1r = max(0, int(round(sb[0]))), min(W, int(round(sb[2])))
            s_ = report[f"far_wall_{c['id']}"]["scale"]
            pw_ = max(1, round(max(1, sx1r - sx0r) * s_))
            px_ = tx0 + 0.5 * ((tx1 - tx0) - pw_)
            gx0, gx1 = px_ + (dr["x0"] - sx0r) * s_, px_ + (dr["x1"] - sx0r) * s_
            if gx1 > tx0 and gx0 < tx1:
                door_gaps.append((max(tx0, gx0) - 4.0, min(tx1, gx1) + 4.0))
        for o in plan.get("openings", []):
            if o.get("kind") != "door" or c["id"] not in o.get("joins", []):
                continue
            rr = o["rect"]
            on_line = abs(rr["y0"] - wall_line) < EPS + 0.2 and abs(rr["y1"] - wall_line) < EPS + 0.2 if fy else \
                abs(rr["x0"] - wall_line) < EPS + 0.2 and abs(rr["x1"] - wall_line) < EPS + 0.2
            if not on_line:
                continue
            span = (rr["x0"], rr["x1"]) if fy else (rr["y0"], rr["y1"])
            us = sorted(u_of(*((s_, wall_line) if fy else (wall_line, s_))) for s_ in span)
            px0 = project(us[0], Dt, 0)[0]; px1 = project(us[1], Dt, 0)[0]
            if px1 > 0 and px0 < W:
                doors.append({"id": o["id"], "cols": [round(max(px0, 0)), round(min(px1, W))]})
    report["far_wall"] = far_report
    # An interior join between two cells' paintings is NOT a corner: each close
    # painting shades its own corners, so the join is rebuilt from the wall's
    # own fabric mirrored across it (book-matched, at the same scale) and
    # cross-faded - no scale change, no shadow, nothing to read as a pilaster.
    joins = sorted({int(round(fr["at_px"][1])) for fr in far_report} & {int(round(fr["at_px"][0])) for fr in far_report})
    joins = [j for j in joins if 0 < j < W]
    if joins:
        arr = np.asarray(canvas).astype(float)
        y0, y1 = int(round(ceil_far)), int(round(floor_far))
        B = 32
        for j in joins:
            if j - 3 * B < 0 or j + 3 * B > W:
                continue
            left = arr[y0:y1, j - 3 * B:j - B][:, ::-1]      # mirror of the wall left of the band
            right = arr[y0:y1, j + B:j + 3 * B][:, ::-1]     # mirror of the wall right of the band
            t = np.linspace(0.0, 1.0, 2 * B)[None, :, None]
            arr[y0:y1, j - B:j + B] = left * (1 - t) + right * t
        canvas = Image.fromarray(arr.clip(0, 255).astype(np.uint8))
    report["joins_px"] = joins
    # PERMANENT architecture: soft occlusion shadow under a narrow dark seam
    dd = ImageDraw.Draw(canvas)
    SHADOW = (96, 82, 68); SEAM = (58, 48, 40)
    def seam(a_, b_):
        dd.line([a_, b_], fill=SHADOW, width=9)
        dd.line([a_, b_], fill=SEAM, width=4)
    for s_ in seams:
        seam(*s_)
    bx0, bx1 = max(0.0, xL), min(float(W), xR)
    def seam_row(y_, gaps):
        """One horizontal seam, broken over every doorway's columns."""
        segs = [(bx0, bx1)]
        for g0, g1 in sorted(gaps):
            nxt = []
            for a_, b_ in segs:
                if g1 <= a_ or g0 >= b_:
                    nxt.append((a_, b_)); continue
                if g0 > a_: nxt.append((a_, g0))
                if g1 < b_: nxt.append((g1, b_))
            segs = nxt
        for a_, b_ in segs:
            if b_ - a_ > 1:
                seam((a_, y_), (b_, y_))
    seam_row(ceil_far, [])
    seam_row(floor_far, door_gaps)
    seam_row(rail_far, door_gaps)
    report["door_gaps_px"] = [[round(a_), round(b_)] for a_, b_ in door_gaps]
    if xL >= 0:
        seam((xL, ceil_far), (xL, floor_far))
    if xR <= W:
        seam((xR, ceil_far), (xR, floor_far))
    # the mid-room artifact guard (G-PREP r2)
    cg = np.asarray(canvas.convert("L")).astype(float)
    def band_guard(y_lo, y_hi, name):
        y_lo, y_hi = int(max(1, y_lo)), int(min(H - 1, y_hi))
        if y_hi - y_lo < 6:
            return {"band": name, "ok": True}
        seg = cg[y_lo:y_hi, int(max(bx0, 0)) + 40:int(bx1) - 40]
        g_ = np.abs(np.diff(seg, axis=0)).mean(axis=1)
        med = float(np.median(g_)); mx = float(g_.max())
        return {"band": name, "max": round(mx, 2), "median": round(med, 2),
                "ok": bool(mx <= max(9.0, 5.0 * (med + 0.3)))}
    guards = [band_guard(8, ceil_far - 8, "ceiling_front"), band_guard(floor_far + 8, H - 8, "floor_front")]
    out = a.out or os.path.join(store, "grown", f"{loc}-{f}.png")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    if any(not g_["ok"] for g_ in guards):
        canvas.save(out + ".breach.png", "PNG")
        print(json.dumps({"ok": False, "mode": "deep-guide", "error": "mid-room artifact guard breached", "guards": guards}))
        return 1
    canvas.save(out, "PNG")

    # ---- the ask -----------------------------------------------------------
    voice_id = voices["ROOM_VOICE"].get(loc) or voices["ARCHETYPE_FALLBACK"].get(cell.get("archetype"))
    voice = voices["VOICES"][voice_id]
    anchor = voices["ANCHORS"][voice["anchor"]]
    r0 = lambda v: int(round(v))
    pts = []
    if xL >= 0:
        pts += [f"top-left ({r0(xL)},{r0(ceil_far)})", f"bottom-left ({r0(xL)},{r0(floor_far)})"]
    if xR <= W:
        pts += [f"top-right ({r0(xR)},{r0(ceil_far)})", f"bottom-right ({r0(xR)},{r0(floor_far)})"]
    off = []
    if xL < 0:
        off.append(f"its left corner stands outside the frame at column {r0(xL)}")
    if xR > W:
        off.append(f"its right corner stands outside the frame at column {r0(xR)}")
    both_in = xL >= 0 and xR <= W
    corner_sentence = (f"At the native 1536 by 1024 resolution, the immutable far-wall corner-seam centerlines are: "
                       + "; ".join(pts) + ". "
                       + ("Those four points are fixed control points. The far wall remains exactly inside the rectangle they define. "
                          if both_in else
                          f"Those points are fixed control points, and the far wall's top edge stays on row {r0(ceil_far)} and its bottom edge on row {r0(floor_far)} across the whole picture; the far wall is {run_m:.1f} m long and "
                          + " and ".join(off) + ", so it continues face-on, at one unbroken scale, out through that edge of the picture. "))
    side_sentences = []
    for side in ("left", "right"):
        if sides[side]["open"]:
            other = "right" if side == "left" else "left"
            side_sentences.append(
                f"There is NO {side} side wall anywhere in this picture: the room is open on its {side} for its whole depth. "
                f"Never paint a {side} side wall, a {side} corner or a {side} return. The ceiling runs unbroken to the {side} edge of the "
                f"picture above row {r0(ceil_far)}, the floor runs unbroken to the {side} edge below row {r0(floor_far)}, and between "
                f"those rows the far wall continues face-on to the {side} edge.")
        else:
            side_sentences.append(
                f"Pixels immediately {'left' if side == 'left' else 'right'} of the {side} seam belong to the {side} side wall; "
                f"they must never be interpreted or painted as additional far wall.")
    plane_words = []
    plane_words.append("the upper plane is ceiling; the lower plane is floor")
    for side in ("left", "right"):
        if not sides[side]["open"]:
            plane_words.append(f"the {side} polygon is the {side} side wall")
    plane_words.append("the central band bounded by the fixed far-wall seams is the far wall")
    seams_words = ["the horizontal cornice across the top of the far wall", "the horizontal contact seam across the bottom of the far wall",
                   f"the far wall's own {anchor['legend_word'].lower()}"]
    for side in ("left", "right"):
        if not sides[side]["open"]:
            seams_words = [f"the converging {side} wall-to-ceiling cornice", f"the converging {side} wall-to-floor contact seam",
                           f"the converging {side} {anchor['legend_word'].lower()}"] + seams_words
            if (side == "left" and xL >= 0) or (side == "right" and xR <= W):
                seams_words.append(f"the {side} vertical far-wall corner seam")
    door_words = ""
    if doors:
        door_words = " " + " ".join(
            f"The door opening in the far wall between columns {d['cols'][0]} and {d['cols'][1]} stays exactly as painted: "
            f"empty, no leaf hung in it, deep unlit shadow beyond it." for d in doors)
    ask = (
        "This is constrained surface completion of Image 1, not scene generation, redesign, or recomposition. "
        "Use Image 1 at its native 1536 by 1024 resolution. Its camera position, field of view, horizon, vanishing point, "
        "composition, room depth, plane assignments, and architectural boundaries are final and immutable. Do not crop, resize, "
        "zoom, translate, widen, narrow, deepen, shorten, or recompose the image. "
        f"The camera-to-far-wall distance is exactly {D:g} metres. Preserve that unusually long depth even if a shorter, more "
        "conventionally proportioned room would look more familiar. "
        + corner_sentence
        + "".join(f"The far wall is one continuous surface across column {j}: there is no joint, pilaster, corner, "
                  f"return or change of plane there. " for j in joins)
        + "Do not move any corner. Do not change the far wall's height, scale, or apparent distance. "
        + " ".join(side_sentences) + " "
        + "The completed near section and the existing far wall are finished source material. Preserve them. "
        + f"The far wall's {voice['walls']} - with {anchor['line']}, its panel scale, lighting and position - must remain unchanged."
        + door_words + " "
        + "A circle stays a circle at the same size and position. "
        + "Every pixel in the prepared continuation area already belongs to its final plane. Preserve those plane assignments: "
        + "; ".join(plane_words) + ". Never reassign pixels from one plane to another. "
        + "All visible boundaries in Image 1 are permanent physical architecture, not temporary guide marks. Preserve them on their "
        + "existing centerlines: " + "; ".join(seams_words) + ". "
        + "Do not erase, relocate, straighten, relax, replace, or reinterpret any of these features. "
        + "Finish only the surface quality of the already pre-filled continuation planes. Continue the existing convergence exactly: "
        + "every line running away from the camera keeps the fixed vanishing point shown in Image 1, and surface pattern diminishes "
        + "toward the far wall. Do not regularize this perspective into a shorter room. Geometry takes priority over seamlessness, "
        + "realism, symmetry, and conventional room proportions. If a texture transition conflicts with the fixed geometry, keep the "
        + "geometry and resolve the texture only within its existing plane. Never solve a mismatch by moving a corner, extending the "
        + "far wall, changing a plane boundary, or repainting finished material. The room remains completely empty: no furniture, "
        + "nobody, and no loose props. No legible text anywhere. Add no light fixtures, fans, ceiling-mounted objects, or floor-mounted "
        + "objects. The room is lit evenly and warmly as if by lamps outside the frame. "
        + f"Maintain the established fabric: {voice['walls']}; overhead, {voice['ceiling']}; underfoot, {voice['floor']}. "
        + f"Return the same 1536 by 1024 composition with the fixed {D:g} metre declared geometry intact. Surface completion is "
        + "permitted. Geometric reinterpretation is not."
    )
    open(out + ".ask.txt", "w").write(ask + "\n")
    open(out + ".mode", "w").write("prep\n")
    args = {"mode": "deep-guide", "wall": a.wall, "pack": P.name, "shell": os.path.relpath(shell_path, ROOT),
            "far_cells": [c["id"] for c in far_cells], "sides": sides, "far_rect": [round(xL, 1), round(ceil_far, 1), round(xR, 1), round(floor_far, 1)],
            "run_m": run_m, "depth_ratio": k, "vp": list(VP), "doors": doors, "elements": report, "guards": guards,
            "precomp": z, "depth_drawn_m": round(Dt, 4), "out": os.path.relpath(out, ROOT)}
    open(os.path.splitext(out)[0] + ".args.json", "w").write(json.dumps(args, indent=1) + "\n")
    stale = out + ".stale"
    if os.path.exists(stale):
        os.remove(stale)
    print(json.dumps({"ok": True, "mode": "deep-guide", "wall": a.wall, "sides": {s: ("open" if v["open"] else "wall") for s, v in sides.items()},
                      "far_rect": args["far_rect"], "run_m": run_m, "doors": doors, "guards": guards, "precomp": z,
                      "roll": report["shell"]["painting"], "measured": {"scale": report["shell"].get("scale")},
                      "far_wall": [{"cell": fr["cell"], "from": fr["from"], "scale": fr["scale"]} for fr in far_report],
                      "out": args["out"]}))
    return 0


def corners_of(c):
    r = c["rect"]
    return [(r["x0"], r["y0"]), (r["x1"], r["y0"]), (r["x0"], r["y1"]), (r["x1"], r["y1"])]


if __name__ == "__main__":
    sys.exit(main())
