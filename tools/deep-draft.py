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

def main():
    args = json.load(open(sys.argv[1]))
    if args.get("mode") == "correct":
        return correct(args)
    if args.get("mode") == "frame":
        return frame(args)
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
