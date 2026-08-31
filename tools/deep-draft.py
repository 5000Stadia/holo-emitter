#!/usr/bin/env python3
"""deep-draft.py — the deterministic reference for a deep facing's ask.

[Kabe, 2026-08-30, verbatim mechanism]: "producing a reference image that is
the close-up image shrunk down to the correct proportion, and then the either
absence on the edge or the skewed stretch of the edges ... then it should go to
an image generation of essentially requesting the image be recreated to
eliminate the weirdness."

Reads a JSON args file: {close_png, k, dx, dy, out}. The close painting is
scaled UNIFORMLY by k (a circle stays a circle), placed at (dx, dy) on the
1536x1024 canvas, and the margins are the scaled image's own edge pixels
stretched outward - honest, mechanical filler the ask tells the painter to
replace. Deterministic: same inputs, same bytes.
"""
import json
import sys

from PIL import Image

W, H = 1536, 1024





def insert_lines(arr, pins):
    """[Kabe, 2026-08-30, verbatim mechanism] "force maintaining the aspect
    ratio of anything we shrink and THEN having an every other pixel column
    blend of the adjacent two pixel rows insert between two rows to skew the
    picture in the appropriate direction distributed evenly to the degree the
    stretch is needed. It will make a bit of a fuzzy image but should still be
    reference valid without skew."

    One axis of it: `arr` is the image's rows (or, transposed, its columns)
    AFTER the uniform shrink, and `pins` is [(src_row_after_uniform, target_row),
    ...] covering the full frame edge-to-edge. Within each band between pins the
    deficit is met by inserting blended rows (each a 50/50 blend of its two
    neighbours) at evenly distributed positions - never by resampling, so every
    surviving row is an unstretched row of the true picture. The uniform scale
    is chosen as the global minimum band factor, so every band is insertion
    (growth); a rounding remainder of a row or two may still be dropped, blended
    into its neighbours."""
    import numpy as np
    out = []
    for (s0, t0), (s1, t1) in zip(pins, pins[1:]):
        a0, a1 = int(round(s0)), int(round(s1))
        m = int(round(t1)) - int(round(t0))
        band = arr[a0:a1]
        n = band.shape[0]
        if n == 0:
            band = arr[max(0, a0 - 1):max(1, a0)]
            n = band.shape[0]
        if m <= 0:
            continue
        if m == n:
            out.append(band); continue
        if m < n:   # rounding remainder only: drop evenly, blending into neighbours
            drop = sorted(set(min(max(int(round((i + 0.5) * n / (n - m))), 1), n - 2)
                              for i in range(n - m)))
            keep = [i for i in range(n) if i not in drop]
            b = band.copy()
            for d in drop:
                b[d - 1] = (b[d - 1] * 2 + band[d]) / 3.0
                b[min(d + 1, n - 1)] = (b[min(d + 1, n - 1)] * 2 + band[d]) / 3.0
            out.append(b[keep][:max(0, m)]); continue
        ins = sorted(min(max(int(round((i + 0.5) * n / (m - n))), 1), n - 1)
                     for i in range(m - n))
        rows, k = [], 0
        for i in range(n):
            rows.append(band[i])
            while k < len(ins) and ins[k] == i + 1:
                rows.append((band[i] + band[min(i + 1, n - 1)]) / 2.0)
                k += 1
        out.append(np.stack(rows[:m]) if len(rows) >= m else
                   np.concatenate([np.stack(rows), np.repeat(band[-1:], m - len(rows), 0)]))
    return np.concatenate(out) if out else arr


def correct(args):
    """--correct: a recreation of this wall came back geometrically off - the
    warp's round document says exactly where every pin sat and where it
    belonged. Build the NEXT reference from that same recreation: ONE uniform
    scale (the global minimum band factor - shapes stay true, a circle stays a
    circle), then Kabe's evenly-distributed blended-line insertion per band
    until every pin lands on its target row and column. Geometrically exact,
    slightly stuttered - and the ask sends it back to the painter to repaint
    clean. The correction only ever touches a REFERENCE, never finished art."""
    import numpy as np
    src = Image.open(args["src_png"]).convert("RGB")
    xp = [(float(a), float(b)) for a, b in args["x_pins"]]
    yp = [(float(a), float(b)) for a, b in args["y_pins"]]
    xp.sort(key=lambda p: p[0]); yp.sort(key=lambda p: p[0])
    factors = [(t1 - t0) / max(1e-6, (s1 - s0))
               for (s0, t0), (s1, t1) in zip(xp, xp[1:]) if s1 > s0] +               [(t1 - t0) / max(1e-6, (s1 - s0))
               for (s0, t0), (s1, t1) in zip(yp, yp[1:]) if s1 > s0]
    u = min(factors)
    scaled = src.resize((max(1, round(src.width * u)), max(1, round(src.height * u))),
                        Image.LANCZOS)
    a = np.asarray(scaled).astype(np.float32)
    a = insert_lines(a, [(s * u, t) for s, t in yp])
    a = insert_lines(a.transpose(1, 0, 2), [(s * u, t) for s, t in xp]).transpose(1, 0, 2)
    img = Image.fromarray(a.clip(0, 255).astype("uint8"))
    if img.size != (W, H):
        canvas = Image.new("RGB", (W, H))
        canvas.paste(img, (0, 0))
        if img.width < W:
            canvas.paste(canvas.crop((img.width - 1, 0, img.width, H)).resize((W - img.width, H)), (img.width, 0))
        if img.height < H:
            canvas.paste(canvas.crop((0, img.height - 1, W, img.height)).resize((W, H - img.height)), (0, img.height))
        img = canvas
    img.save(args["out"], "PNG")
    print(json.dumps({"ok": True, "mode": "correct", "u": round(u, 4),
                      "x_bands": len(xp) - 1, "y_bands": len(yp) - 1,
                      "size": list(img.size)}))


def frame(args):
    """[Kabe, 2026-08-30, verbatim] "It should just shrink while maintaining
    aspect ratio then simulate the geometry to the edges and ask to fill in
    the gaps. Maybe cut off the corner edges in the original and just overlay
    the correct corner geometry as reference lines to fix."

    CONTENT AND GEOMETRY, NEVER MIXED IN ONE MAPPING. The source picture is
    shrunk by ONE uniform factor (a circle stays a circle) and placed so the
    axis that fits exactly lands pin-on-pin; in the short axis the source's own
    painted junctions - drawn for the wrong camera - are CUT OFF so they cannot
    teach, and the DECLARED geometry is drawn instead: corner verticals,
    ceiling and floor lines, and the side walls' recession to the frame
    corners, as ink guide lines over a plain ground. The ask is to complete
    the picture out to the lines. Nothing anisotropic ever touches a pixel."""
    src = Image.open(args["src_png"]).convert("RGB")
    c, t = args["content_box"], args["target_box"]
    sxs, sys_ = c["x1"] - c["x0"], c["yf"] - c["yc"]
    txs, tys = t["x1"] - t["x0"], t["yf"] - t["yc"]
    ux, uy = txs / sxs, tys / sys_
    u = min(ux, uy)
    scaled = src.resize((max(1, round(src.width * u)), max(1, round(src.height * u))),
                        Image.LANCZOS)
    x_exact = abs(u - ux) < 1e-9
    y_exact = abs(u - uy) < 1e-9
    dx = (t["x0"] - c["x0"] * u) if x_exact else          ((t["x0"] + t["x1"]) / 2 - (c["x0"] + c["x1"]) / 2 * u)
    dy = (t["yc"] - c["yc"] * u) if y_exact else          ((t["yc"] + t["yf"]) / 2 - (c["yc"] + c["yf"]) / 2 * u)
    GROUND = (201, 197, 189)
    CUT = 10   # px cut inside a junction drawn for the wrong camera
    out = Image.new("RGB", (W, H), GROUND)
    bx0, bx1 = dx + c["x0"] * u, dx + c["x1"] * u
    by0, by1 = dy + c["yc"] * u, dy + c["yf"] * u
    kx0, kx1 = (bx0, bx1) if x_exact else (bx0 + CUT, bx1 - CUT)
    ky0, ky1 = (by0, by1) if y_exact else (by0 + CUT, by1 - CUT)
    region = scaled.crop((round(kx0 - dx), round(ky0 - dy),
                          round(kx1 - dx), round(ky1 - dy)))
    out.paste(region, (round(kx0), round(ky0)))
    from PIL import ImageDraw
    d = ImageDraw.Draw(out)
    INK = (42, 33, 24)
    lw = 3
    tx0, tx1, tyc, tyf = t["x0"], t["x1"], t["yc"], t["yf"]
    d.line([(tx0, tyc), (tx1, tyc)], fill=INK, width=lw)   # ceiling line
    d.line([(tx0, tyf), (tx1, tyf)], fill=INK, width=lw)   # floor line
    d.line([(tx0, tyc), (tx0, tyf)], fill=INK, width=lw)   # left corner
    d.line([(tx1, tyc), (tx1, tyf)], fill=INK, width=lw)   # right corner
    d.line([(0, 0), (tx0, tyc)], fill=INK, width=lw)       # recession, 4 ways
    d.line([(W, 0), (tx1, tyc)], fill=INK, width=lw)
    d.line([(0, H), (tx0, tyf)], fill=INK, width=lw)
    d.line([(W, H), (tx1, tyf)], fill=INK, width=lw)
    out.save(args["out"], "PNG")
    print(json.dumps({"ok": True, "mode": "frame", "u": round(u, 4),
                      "x_exact": x_exact, "y_exact": y_exact,
                      "content_kept": [round(kx0), round(ky0), round(kx1), round(ky1)]}))


def true_shape(args):
    """[the five-round synthesis, 2026-08-30] THE BOX HOLDS ONLY AGAINST A
    FULL FRAME: round 4 (raw warped reference, no margins) held the corners to
    -1.4%; every reference with cut or empty margins invited the painter to
    expand the room box into them by 25-35%. And streaks teach streaks, while
    BLUR is the one artifact the generator reliably cleans (Kabe's original
    premise, proven on every recreate pass). So the reference is the warp's
    geometry-exact frame, complete and full-frame, with its revealed smear
    zones BLURRED IN PLACE - no ground, no lines, nothing to expand into,
    nothing streaky to copy - and the ask: repaint sharp, framing exact,
    objects true."""
    import numpy as np
    from PIL import ImageFilter
    src = Image.open(args["warped_png"]).convert("RGB")
    mask = Image.open(args["revealed_png"]).convert("L")
    grow = int(args.get("grow_px", 32))
    mask = mask.filter(ImageFilter.MaxFilter(grow * 2 + 1))
    m = np.asarray(mask) > 127
    t = args["target_box"]
    a = np.asarray(src).astype(np.uint8).copy()
    yy, xx = np.mgrid[0:a.shape[0], 0:a.shape[1]]
    inside = ((xx >= t["x0"]) & (xx <= t["x1"]) & (yy >= t["yc"]) & (yy <= t["yf"]))
    m = m & ~inside
    blurred = np.asarray(src.filter(ImageFilter.GaussianBlur(40))).astype(np.uint8)
    a[m] = blurred[m]
    Image.fromarray(a).save(args["out"], "PNG")
    print(json.dumps({"ok": True, "mode": "true_shape", "fill": "blur-in-place",
                      "blurred_px": int(m.sum()), "blurred_pct": round(float(m.mean()) * 100, 1)}))



def chop(args):
    """[Kabe, 2026-08-30] "We have the geometry we want to put it in (floor,
    face, side wall, ceiling) so lets chop it up to fit those spaces but
    shrunk down the % we step back. It may not fill the spaces... for each
    side, we do the edge blur to fill it out then we tell the painter to
    enhance it so the fill blur matches the surrounding."

    THE CLOSE-UP, CHOPPED BY PLANE AND RE-PROJECTED for the stepped-back
    camera. Every deep-frame pixel is classified onto its surface (the face
    wall, a side wall, the floor, the ceiling), its distance z along the deep
    camera's ray computed from the DECLARED geometry, and the same physical
    point looked up in the close painting through the close camera's OWN
    measured numbers at z_c = z - step_back. The face wall rides ONE uniform
    scale (the ruler ratio - a circle stays a circle, L-ENVELOPE); each sweep
    forehortens along its true recession. Where the close-up holds no paint
    (the near ring the deep camera alone sees), sampling clamps to the
    close frame's edge and the result is BLURRED there - Kabe's edge-blur
    fill, for the painter to enhance."""
    import numpy as np
    from PIL import ImageFilter
    close = np.asarray(Image.open(args["close_png"]).convert("RGB")).astype(np.float32)
    Hc_img, Wc_img = close.shape[:2]
    d = args["deep"]      # declared: f, vx, vy, eye_m, half_w_m, ceil_m, z_wall, box{x0,x1,yc,yf}
    c = args["close"]     # measured: f, vx, vy, eye_m, ceil_m
    dz = float(args["step_back_m"])
    f, vx, vy = d["f"], d["vx"], d["vy"]
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float64)
    dx, dy = xs - vx, ys - vy
    eps = 1e-6
    zw = d["z_wall"]
    # distance along the ray to each candidate surface
    z_floor = np.where(dy > eps, d["eye_m"] * f / np.maximum(dy, eps), np.inf)
    z_ceil  = np.where(dy < -eps, d["ceil_m"] * f / np.maximum(-dy, eps), np.inf)
    z_side  = np.where(np.abs(dx) > eps, d["half_w_m"] * f / np.maximum(np.abs(dx), eps), np.inf)
    z = np.minimum.reduce([z_floor, z_ceil, z_side, np.full_like(dx, zw)])
    b = d["box"]
    on_wall = (z >= zw - eps)
    # the face wall: ONE uniform scale (ruler ratio) anchored on the declared
    # floor line and the wall's centre
    u = float(args["wall_scale"])
    cw = args["close_wall"]         # {cx (centre col), floor_row}
    wall_cc = cw["cx"] + (xs - (b["x0"] + b["x1"]) / 2.0) / u
    wall_cr = cw["floor_row"] - (b["yf"] - ys) / u
    # the sweeps: same physical point through the close camera at z_c = z - dz
    zc = np.maximum(z - dz, 0.35)
    sweep_cc = c["vx"] + dx * (z * c["f"]) / (f * zc)
    fl = ys > vy
    sweep_cr = np.where(fl, c["vy"] + c["eye_m"] * c["f"] / zc,
                            c["vy"] - c["ceil_m"] * c["f"] / zc)
    side = (z_side < np.minimum(z_floor, z_ceil)) & ~on_wall
    side_Y = dy * z / f            # metres below the deep eye, on the side wall
    side_cr = c["vy"] + side_Y * c["f"] / zc
    cc = np.where(on_wall, wall_cc, np.where(side, sweep_cc, sweep_cc))
    cr = np.where(on_wall, wall_cr, np.where(side, side_cr, sweep_cr))
    valid = ((cc >= 0) & (cc <= Wc_img - 1) & (cr >= 0) & (cr <= Hc_img - 1)
             & (on_wall | (z - dz > 0.35)))
    ccl = np.clip(cc, 0, Wc_img - 1.001); crl = np.clip(cr, 0, Hc_img - 1.001)
    x0i = ccl.astype(int); y0i = crl.astype(int)
    fx2 = (ccl - x0i)[..., None]; fy2 = (crl - y0i)[..., None]
    p00 = close[y0i, x0i]; p01 = close[y0i, np.minimum(x0i + 1, Wc_img - 1)]
    p10 = close[np.minimum(y0i + 1, Hc_img - 1), x0i]
    p11 = close[np.minimum(y0i + 1, Hc_img - 1), np.minimum(x0i + 1, Wc_img - 1)]
    out = (p00 * (1 - fx2) * (1 - fy2) + p01 * fx2 * (1 - fy2)
           + p10 * (1 - fx2) * fy2 + p11 * fx2 * fy2)
    img = Image.fromarray(out.clip(0, 255).astype(np.uint8))
    blurred = img.filter(ImageFilter.GaussianBlur(30))
    a = np.asarray(img).copy(); bl = np.asarray(blurred)
    gap = ~valid
    a[gap] = bl[gap]
    Image.fromarray(a).save(args["out"], "PNG")
    print(json.dumps({"ok": True, "mode": "chop",
                      "filled_pct": round(float(valid.mean()) * 100, 1),
                      "gap_pct": round(float(gap.mean()) * 100, 1)}))

def main():
    args = json.load(open(sys.argv[1]))
    if args.get("mode") == "correct":
        return correct(args)
    if args.get("mode") == "frame":
        return frame(args)
    if args.get("mode") == "true_shape":
        return true_shape(args)
    if args.get("mode") == "chop":
        return chop(args)
    close = Image.open(args["close_png"]).convert("RGB")
    k = float(args["k"])
    dw, dh = round(close.width * k), round(close.height * k)
    dx, dy = round(float(args["dx"])), round(float(args["dy"]))
    scaled = close.resize((dw, dh), Image.LANCZOS)
    out = Image.new("RGB", (W, H))
    # the stretch filler: each margin is the nearest edge of the scaled image
    # pulled to the canvas edge (rows/columns of 1px, resized)
    left = scaled.crop((0, 0, 1, dh)).resize((max(1, dx), dh)) if dx > 0 else None
    right_w = W - (dx + dw)
    right = scaled.crop((dw - 1, 0, dw, dh)).resize((max(1, right_w), dh)) if right_w > 0 else None
    if left: out.paste(left, (0, dy))
    if right: out.paste(right, (dx + dw, dy))
    out.paste(scaled, (dx, dy))
    # top/bottom margins: stretch the full row now standing at the seam
    if dy > 0:
        row = out.crop((0, dy, W, dy + 1)).resize((W, dy))
        out.paste(row, (0, 0))
    bottom_h = H - (dy + dh)
    if bottom_h > 0:
        row = out.crop((0, dy + dh - 1, W, dy + dh)).resize((W, bottom_h))
        out.paste(row, (0, dy + dh))
    out.save(args["out"], "PNG")
    print(json.dumps({"ok": True, "k": k, "dx": dx, "dy": dy, "dw": dw, "dh": dh}))


if __name__ == "__main__":
    main()
