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
    out_img = Image.fromarray(a)
    # [Kabe, 2026-08-30] "after the zoom down for perspective have dark lines
    # outlining the corners on the reference image. We have that reference
    # deterministically and wireframe it already - incorporate it so it
    # understands." The declared geometry, drawn dark ON the reference: the
    # wall's corner verticals, its ceiling and floor lines, and the four
    # receding junction lines out to the frame corners.
    from PIL import ImageDraw
    dline = ImageDraw.Draw(out_img)
    INK = (42, 33, 24); lw = 3
    bx = args["deep"]["box"]
    tx0, tx1, tyc, tyf = bx["x0"], bx["x1"], bx["yc"], bx["yf"]
    dline.line([(tx0, tyc), (tx1, tyc)], fill=INK, width=lw)
    dline.line([(tx0, tyf), (tx1, tyf)], fill=INK, width=lw)
    dline.line([(tx0, tyc), (tx0, tyf)], fill=INK, width=lw)
    dline.line([(tx1, tyc), (tx1, tyf)], fill=INK, width=lw)
    dline.line([(0, 0), (tx0, tyc)], fill=INK, width=lw)
    dline.line([(W, 0), (tx1, tyc)], fill=INK, width=lw)
    dline.line([(0, H), (tx0, tyf)], fill=INK, width=lw)
    dline.line([(W, H), (tx1, tyf)], fill=INK, width=lw)
    out_img.save(args["out"], "PNG")
    print(json.dumps({"ok": True, "mode": "chop", "wireframe": True,
                      "filled_pct": round(float(valid.mean()) * 100, 1),
                      "gap_pct": round(float(gap.mean()) * 100, 1)}))


def compose(args):
    """[Kabe, 2026-08-31] "This is a long room. Geometrically it needs to look
    correct... 3x1, 3x2 - all of these geometries need to execute flawlessly."
    THE COMPOSED STANDPOINT: paint decides texture ONCE (the close, 1x1 regime
    the painter reliably nails); geometry is computed for every other
    standpoint. Each deep-frame pixel is classified onto its surface by the
    declared camera's ray, then sampled from that surface's OWN promoted art:
    the face wall from the close painting at ONE uniform ruler scale (a circle
    stays a circle), each side sweep from that side wall's painting by
    along-run position (sources hand off at the cell seam), floor and ceiling
    from the close art carried down the recession (wrapped - a run of lamps
    repeats, which for a long room is the truth). Exact by construction, and
    any NxM room is just another declared camera into the same math."""
    import numpy as np
    d = args["deep"]           # f, vx, vy, eye_m, half_w_m, ceil_m, z_wall, box
    f, vx, vy = d["f"], d["vx"], d["vy"]
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float64)
    dx, dy = xs - vx, ys - vy
    eps = 1e-6
    zw = d["z_wall"]
    z_floor = np.where(dy > eps, d["eye_m"] * f / np.maximum(dy, eps), np.inf)
    z_ceil  = np.where(dy < -eps, d["ceil_m"] * f / np.maximum(-dy, eps), np.inf)
    z_side  = np.where(np.abs(dx) > eps, d["half_w_m"] * f / np.maximum(np.abs(dx), eps), np.inf)
    z = np.minimum.reduce([z_floor, z_ceil, z_side, np.full_like(dx, zw)])
    on_wall = z >= zw - eps
    side    = (~on_wall) & (z_side <= np.minimum(z_floor, z_ceil))
    floorp  = (~on_wall) & (~side) & (dy > 0)
    ceilp   = (~on_wall) & (~side) & (dy < 0)

    srcs = {k: np.asarray(Image.open(v["png"]).convert("RGB")).astype(np.float32)
            for k, v in args["sources"].items()}
    out = np.zeros((H, W, 3), np.float32)

    _written = {}
    def sample(name, cc, cr, mask):
        _written[name] = _written.get(name, 0) + int(mask.sum())
        img = srcs[name]
        hgt, wid = img.shape[:2]
        ccl = np.clip(cc, 0, wid - 1.001); crl = np.clip(cr, 0, hgt - 1.001)
        x0 = ccl.astype(int); y0 = crl.astype(int)
        fx2 = (ccl - x0)[..., None]; fy2 = (crl - y0)[..., None]
        v = (img[y0, x0] * (1 - fx2) * (1 - fy2) + img[y0, np.minimum(x0 + 1, wid - 1)] * fx2 * (1 - fy2)
             + img[np.minimum(y0 + 1, hgt - 1), x0] * (1 - fx2) * fy2
             + img[np.minimum(y0 + 1, hgt - 1), np.minimum(x0 + 1, wid - 1)] * fx2 * fy2)
        out[mask] = v[mask]

    # FACE WALL: lateral by the art's own corner box centre, both axes at the
    # ruler scale (uniform - the disc stays round); the ruler-vs-corner
    # disagreement of a source shows as a thin clamped band at the box edge.
    cw = args["sources"]["face"]
    X = dx * zw / f                       # metres from centre, on the wall plane
    hgt_m = d["eye_m"] - dy * zw / f      # metres above the floor
    face_cc = cw["cx"] + X * cw["ppm"]
    face_cr = cw["floor_row"] - hgt_m * cw["ppm"]
    sample("face", face_cc, face_cr, on_wall)

    # SIDE SWEEPS: along-run position picks the source cell's art.
    a_along = args["along0_m"] + z * np.sign(args.get("along_dir", 1.0))  # metres along the run toward the wall
    h_side = d["eye_m"] - dy * z / f
    for nm in ("side_n", "side_s"):
        sd = args["sources"].get(nm)
        if not sd: continue
        m = side & ((dx < 0) if sd["on_left"] else (dx > 0))
        # ppm_h is SIGNED (a south-facing art maps the run right-to-left);
        # ppm_v is the positive vertical scale. One field doing both jobs put
        # the south sweep's rows below its own floor - the beige-wall bug.
        cc = sd["col0"] + (a_along - sd["a0"]) * sd["ppm_h"]
        cr = sd["floor_row"] - h_side * sd["ppm_v"]
        hold = m & (cc >= -0.5) & (cc <= srcs[nm].shape[1] - 0.5)
        sample(nm, cc, cr, hold)
        m2 = m & ~hold
        sib = args["sources"].get(sd["sibling"])
        if sib is not None:
            cc2 = sib["col0"] + (a_along - sib["a0"]) * sib["ppm_h"]
            cr2 = sib["floor_row"] - h_side * sib["ppm_v"]
            sample(sd["sibling"], cc2, cr2, m2)

    # FLOOR / CEILING: the close art's own bands, carried down the recession by
    # wrapping the covered depth band (a run of lamps repeats - truthfully).
    for mask, plane_h in ((floorp, None), (ceilp, d["ceil_m"])):
        zc = z - args["step_back_m"]
        band_lo, band_hi = args["band_m"]
        span = band_hi - band_lo
        # MIRROR-WRAP the depth (ping-pong): a plain wrap put the art's edge
        # discontinuity down the room as repeated stripes.
        t = np.mod(zc - band_lo, 2 * span)
        zc = band_lo + (span - np.abs(t - span))
        zc = np.maximum(zc, band_lo + 0.05)
        cr = (cw["vy"] + cw["eye_f"] / zc) if plane_h is None else (cw["vy"] - cw["ceil_f"] / zc)
        # LATERAL WRAP into the band the close art actually covers at zc -
        # the clamp-streak fan on the ceiling was the art running out sideways.
        X = dx * z / f
        L = 0.72 * zc
        Xw = np.mod(X + L, 2 * L) - L
        cc = cw["vx"] + Xw * (cw["f"] / zc)
        sample("face", cc, cr, mask)

    # [Kabe, 2026-08-31, verbatim] "almost guaranteed you're going to want an
    # edge blur between continuing walls and floors, and ceilings connected by
    # continuing locations because the separate image generation is going to
    # create a line of artifact." THE JUNCTION FEATHER: label every pixel by
    # the source that painted it (plane and cell); wherever the label changes
    # - wall meets floor, sweep meets ceiling, cell hands off to cell - a
    # narrow band is blended, so no seam line of two generations' disagreement
    # survives raw.
    label = np.zeros((H, W), np.int16)
    label[on_wall] = 1
    label[side & (dx < 0)] = 2
    label[side & (dx > 0)] = 3
    label[floorp] = 4
    label[ceilp] = 5
    seam_a = 6.4    # the cell handoff, metres along the run
    handoff = side & (np.abs(a_along - seam_a) * 213.333 < 2)
    label[handoff] = 6
    edge = np.zeros((H, W), bool)
    edge[1:, :] |= label[1:, :] != label[:-1, :]
    edge[:, 1:] |= label[:, 1:] != label[:, :-1]
    for _ in range(3):
        e2 = edge.copy()
        e2[1:, :] |= edge[:-1, :]; e2[:-1, :] |= edge[1:, :]
        e2[:, 1:] |= edge[:, :-1]; e2[:, :-1] |= edge[:, 1:]
        edge = e2
    from PIL import ImageFilter as _IFJ
    _img_j = Image.fromarray(out.clip(0, 255).astype(np.uint8))
    _blur_j = np.asarray(_img_j.filter(_IFJ.GaussianBlur(3))).astype(np.float32)
    out[edge] = _blur_j[edge]

    # THE CEILING MELTS ITS WRAP SEAMS: the lateral mirror-wrap leaves zigzag
    # joins in a surface that is low-information plaster - a strong blur
    # restricted to the ceiling sweep turns them into soft plaster and lamp
    # glow, which is what a ceiling at this light actually reads as.
    from PIL import ImageFilter as _IF
    img_out = Image.fromarray(out.clip(0, 255).astype(np.uint8))
    blurred_ceil = np.asarray(img_out.filter(_IF.GaussianBlur(14))).astype(np.uint8)
    a_out = np.asarray(img_out).copy()
    a_out[ceilp] = blurred_ceil[ceilp]
    Image.fromarray(a_out).save(args["out"], "PNG")
    print(json.dumps({"ok": True, "mode": "compose", "written": _written,
                      "wall_px": int(on_wall.sum()), "side_px": int(side.sum()),
                      "floor_px": int(floorp.sum()), "ceil_px": int(ceilp.sum())}))


def grow(args):
    """[Kabe, 2026-08-31] "First build a 1x1 room image. Then cut the back
    faced wall out, fit the rest of the room, side walls, ceiling and floor
    into the front half of the wire frame of a 2x1. Fit the generated back
    faced wall into the back wall of the wire frame. This will leave a wire
    frame gap between the back wall and the front box... Pass this to the
    painter with the goal of seamlessly filling in the assets between the
    front and the back."

    THE GROW STEP, and why it is elegant: only the two shape-safe transforms
    ever touch a pixel. The 1x1's shell keeps its own painted angles (the
    camera relationship is identical - no reprojection at all); the back wall
    is fronto-parallel, so its move is ONE uniform shrink (a circle stays a
    circle). Everything angle-dependent lands in the wireframe gap ring - the
    painter's territory, generated at the correct perspective rather than
    reprojected. A back-wall door rides the cutout; a side-box door is drawn
    into the ring as outline (and named in the ask) - see args["ring_doors"].
    A 3x1 chains the same step again."""
    import numpy as np
    from PIL import ImageDraw
    base = Image.open(args["base_png"]).convert("RGB")
    a = np.asarray(base).astype(np.uint8).copy()
    bb = args["base_box"]           # the 1x1's own back-wall box, px
    db = args["deep_box"]           # the declared far box of the long room, px
    GROUND = (208, 202, 192)
    x0, x1 = int(round(bb["x0"])), int(round(bb["x1"]))
    y0, y1 = int(round(bb["yc"])), int(round(bb["yf"]))
    cut = a[y0:y1, x0:x1].copy()
    # [Kabe, 2026-08-31] "that updated picture skewed the ground weird": when
    # the base is a WARPED frame, its reveal-fill (frame-edge smear, the floor
    # band especially) rides into the draft - melted in place via the base's
    # own revealed.png mask, and the ask names the blurred patches as damage.
    if args.get("reveal_png"):
        from PIL import ImageFilter as _IFR
        rm = np.asarray(Image.open(args["reveal_png"]).convert("L")
                        .filter(_IFR.MaxFilter(25))) > 127
        rm[y0:y1, x0:x1] = False
        blur_src = np.asarray(Image.fromarray(a).filter(_IFR.GaussianBlur(12)))
        a[rm] = blur_src[rm]
    # [Kabe, 2026-08-31] "The line isnt strait anymore": the base floor's
    # guidance line is a PLAN feature (centred, fixed width) - its correct
    # shape is computable. The bent painted line is erased (rows take their
    # own floor median) and redrawn straight, perspective-tapered, in the
    # line's own sampled colour.
    if args.get("floor_line"):
        fl = args["floor_line"]
        vx_l, vy_l = float(fl["vx"]), float(fl["vy"])
        eye_l, f_l, wm = float(fl["eye_m"]), float(fl["f"]), float(fl["width_m"])
        ys0 = int(max(y1, vy_l + 8)); H2 = a.shape[0]
        samp = a[H2-60:H2-10, int(vx_l)-20:int(vx_l)+20].reshape(-1,3)
        lum = samp.astype(np.float32).mean(axis=1)
        line_col = samp[lum > np.percentile(lum, 80)].mean(axis=0).astype(np.uint8)
        for yy in range(ys0, H2):
            half = max(2.0, (wm/2.0) * (yy - vy_l) / eye_l)
            wide = max(45.0, 8.0*half)   # the bent original wanders; consume it fully
            c0, c1 = int(vx_l - wide), int(vx_l + wide)
            # REAL texture, not a flat median: the corridor takes the floor
            # from a lateral offset strip (true grain), rather than a smooth
            # band that reads as pavement.
            span = c1 - max(0, c0)
            src0 = max(0, c0) - (span + 60)
            if src0 < 0: src0 = c1 + 60
            patch = a[yy, src0:src0 + span]
            if patch.shape[0] == span:
                a[yy, max(0, c0):c1] = patch
            d0, d1 = int(round(vx_l - half)), int(round(vx_l + half))
            a[yy, d0:d1] = line_col
    # [Kabe, 2026-08-31] "Ceiling needs to be notably clean and artifact free
    # on the edge of box 1": lamp rods crossing the cut leave dark stubs on
    # the shell's ceiling band - wiped deterministically: within the hole's
    # span, for a band above the cut, dark outliers take their row's own
    # ceiling median.
    band_top = max(0, y0 - 90)
    band = a[band_top:y0, x0:x1]
    lum = band.astype(np.float32).mean(axis=2)
    med = np.median(lum, axis=1, keepdims=True)
    dark = lum < (med - 32)
    row_med = np.median(band.reshape(band.shape[0], -1, 3), axis=1).astype(np.uint8)
    band[dark] = np.repeat(row_med[:, None, :], band.shape[1], axis=1)[dark]
    a[band_top:y0, x0:x1] = band
    out = Image.fromarray(a)
    # [Kabe, 2026-08-31] "your room corners in the wireframe dont line up
    # with the example image... fix that in the example before you pass to
    # the painter." THE WALL ANCHORS TO THE DECLARED CORNERS (round 8's own
    # lesson): ONE uniform shrink from the corner span, floor-anchored; a
    # source whose ruler and corners disagree overflows at the top and the
    # cornice strip is cropped - the ring's lines and the wall's corners can
    # never disagree again.
    # [Kabe, 2026-08-31] "safe to adjust the image to snap properly to our
    # edge lines in the initial image's corners": the paste's uniform scale
    # and position are SOLVED so its painted junctions land exactly on the
    # vp-true rays from the base's own junctions - uniform + translate only,
    # no warp a circle could feel. Zero corner residual by construction.
    vp0 = args.get("vp", [768.0, 526.1])
    vpx0, vpy0 = float(vp0[0]), float(vp0[1])
    jr0 = float(args.get("junction_row", y0))
    def land(px, py, ex):
        t = (ex - px) / (vpx0 - px) if vpx0 != px else 1.0
        return py + (vpy0 - py) * t
    k = (db["x1"] - db["x0"]) / (x1 - x0)
    for _ in range(4):
        cw = (x1 - x0) * k
        wxL = vpx0 - cw / 2
        r_top = land(x0, jr0, wxL)
        r_bot = land(x0, y1, wxL)
        k = (r_bot - r_top) / (y1 - jr0)
    cw = max(1, round((x1 - x0) * k)); ch = max(1, round((y1 - y0) * k))
    wall = Image.fromarray(cut).resize((cw, ch), Image.LANCZOS)
    wx = int(round(vpx0 - cw / 2))
    wy = int(round(r_top - (jr0 - y0) * k))
    # [Kabe, 2026-08-31] "be smart about it": the snap solves UNCLAMPED, then
    # a TRANSLATE-ONLY shift brings the paste's floor inside the declared
    # instrument band (+/-8 px) - shape-safe, and a base whose rays already
    # land true is left untouched.
    floor_solved = wy + (y1 - y0) * k
    floor_ok = min(max(floor_solved, db["yf"] - 8), db["yf"] + 8)
    wy = int(round(wy + (floor_ok - floor_solved)))
    out.paste(wall, (wx, wy))
    d = ImageDraw.Draw(out)
    INK = (42, 33, 24); lw = 3
    # the wireframe of the gap: the mid-plane hole's corners run to the far
    # box's corners, and the ceiling, floor and dado lines continue through
    # [Kabe, 2026-08-31] the TOP diagonals launch from the PAINTED junction
    # (the molding's bottom corner, severed at the hole's side edge) - the
    # drawn line starts exactly where the painted cornice line ends, while
    # the cut itself stays at the molding's top so the molding rides the wall.
    jr = int(round(args.get("junction_row", y0)))
    # [Kabe, 2026-08-31] "subtle angle adjusting to match the proper geometry
    # that the room should be... no weird warping that you would see in a
    # circle." Each junction ray LAUNCHES at its painted outer junction and
    # runs at the TRUE angle - aimed through the declared vanishing point -
    # to the wall paste's edge column. Only drawn lines bend to the declared
    # geometry; content is never warped, a circle stays a circle. Any few-px
    # residual where the ray meets the paste is the ring's to heal.
    vp = args.get("vp", [768.0, 526.1])
    vpx, vpy = float(vp[0]), float(vp[1])
    def ray(px, py, edge_x):
        t = (edge_x - px) / (vpx - px) if vpx != px else 1.0
        return edge_x, py + (vpy - py) * t
    for (px, py, edge) in ((x0, jr, wx), (x1, jr, wx + cw),
                           (x0, y1, wx), (x1, y1, wx + cw)):
        tx, ty = ray(px, py, edge)
        d.line([(px, py), (tx, ty)], fill=INK, width=lw)
    # [Kabe, 2026-08-31] NO DADO LINES IN THE RING: "I worry it biases the
    # drawing to make something wall divided there" - the band is shown in the
    # painted content at both ends and the painter interpolates bands
    # reliably; only the four REAL junctions (the corner diagonals) are drawn.
    for door in args.get("ring_doors", []):
        d.rectangle([door["x0"], door["y0"], door["x1"], door["y1"]], outline=INK, width=lw)
    out.save(args["out"], "PNG")
    print(json.dumps({"ok": True, "mode": "grow", "k": round(k, 4),
                      "wall_at": [wx, wy, wx + cw, wy + ch]}))


def reverse(args):
    """[Kabe, 2026-08-31, phase 3 verbatim] "from the immediate perspective of
    the far side of that direction turned around. Because for reference you
    can have almost everything but back wall. Horizontal flip the image first.
    Then pull the end of the ceiling inside details to the front and the front
    to the back, which stretches and skews it in reverse. Do the same to the
    side walls and floor. Then thats the reference image looking back for the
    enhance and fill the gap on the back wall."

    THE REVERSE VIEW: the completed long view of the same axis, flipped, and
    each sweep plane depth-reversed along its own recession (far content to
    the front, front to the back - the deliberate reverse skew, sweeps only).
    The back wall was behind the original camera and is the GAP: an outlined
    box with its doorway drawn and named, for the painter to fill."""
    import numpy as np
    from PIL import ImageDraw
    src = Image.open(args["long_png"]).convert("RGB").transpose(Image.FLIP_LEFT_RIGHT)
    sa = np.asarray(src).astype(np.float32)
    d0 = args["deep"]
    f, vx, vy = d0["f"], d0["vx"], d0["vy"]
    zw = d0["z_wall"]
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float64)
    dx, dy = xs - vx, ys - vy
    eps = 1e-6
    z_floor = np.where(dy > eps, d0["eye_m"] * f / np.maximum(dy, eps), np.inf)
    z_ceil  = np.where(dy < -eps, d0["ceil_m"] * f / np.maximum(-dy, eps), np.inf)
    z_side  = np.where(np.abs(dx) > eps, d0["half_w_m"] * f / np.maximum(np.abs(dx), eps), np.inf)
    z = np.minimum.reduce([z_floor, z_ceil, z_side, np.full_like(dx, zw)])
    on_wall = z >= zw - eps
    # per-plane nearest visible depth (at the frame edge), for the reversal span
    zmin_floor = d0["eye_m"] * f / (H - vy)
    zmin_ceil  = d0["ceil_m"] * f / vy
    zmin_side  = d0["half_w_m"] * f / (W - vx)
    zmin = np.where(z_side <= np.minimum(z_floor, z_ceil), zmin_side,
                    np.where(dy > 0, zmin_floor, zmin_ceil))
    zr = np.clip(zmin + zw - z, zmin * 1.001, zw * 0.999)   # far <-> near
    # the same plane point (lateral / height preserved) at the reversed depth
    cc = vx + dx * z / zr
    cr = vy + dy * z / zr
    ccl = np.clip(cc, 0, W - 1.001); crl = np.clip(cr, 0, H - 1.001)
    x0i = ccl.astype(int); y0i = crl.astype(int)
    fx2 = (ccl - x0i)[..., None]; fy2 = (crl - y0i)[..., None]
    out = (sa[y0i, x0i] * (1 - fx2) * (1 - fy2) + sa[y0i, np.minimum(x0i + 1, W - 1)] * fx2 * (1 - fy2)
           + sa[np.minimum(y0i + 1, H - 1), x0i] * (1 - fx2) * fy2
           + sa[np.minimum(y0i + 1, H - 1), np.minimum(x0i + 1, W - 1)] * fx2 * fy2)
    GROUND = (208, 202, 192)
    b = args["gap_box"]
    bx0, bx1, by0, by1 = int(round(b["x0"])), int(round(b["x1"])), int(round(b["yc"])), int(round(b["yf"]))
    out[by0:by1, bx0:bx1] = GROUND
    img = Image.fromarray(out.clip(0, 255).astype(np.uint8))
    d = ImageDraw.Draw(img)
    INK = (42, 33, 24); lw = 3
    d.rectangle([bx0, by0, bx1, by1], outline=INK, width=lw)
    for door in args.get("ring_doors", []):
        d.rectangle([door["x0"], door["y0"], door["x1"], door["y1"]], outline=INK, width=lw)
    img.save(args["out"], "PNG")
    print(json.dumps({"ok": True, "mode": "reverse",
                      "gap": [bx0, by0, bx1, by1],
                      "doors": len(args.get("ring_doors", []))}))


def cutback(args):
    """[Kabe, 2026-08-31, phase 3 v2] "we should not flip but simply skew the
    corners to the right location" - the flip turned ceiling content upside
    down. V2: the completed long view stays EXACTLY as painted - no flip, no
    depth remap, clean sweeps - and only the wall box is cut to the gap,
    snapped to the painting's own corners, with the doorway outlined for the
    painter to fill."""
    from PIL import ImageDraw
    import numpy as np
    img = Image.open(args["long_png"]).convert("RGB")
    a = np.asarray(img).astype(np.uint8).copy()
    b = args["gap_box"]
    bx0, bx1, by0, by1 = int(round(b["x0"])), int(round(b["x1"])), int(round(b["yc"])), int(round(b["yf"]))
    a[by0:by1, bx0:bx1] = (208, 202, 192)
    out = Image.fromarray(a)
    d = ImageDraw.Draw(out)
    INK = (42, 33, 24); lw = 3
    d.rectangle([bx0, by0, bx1, by1], outline=INK, width=lw)
    for door in args.get("ring_doors", []):
        d.rectangle([door["x0"], door["y0"], door["x1"], door["y1"]], outline=INK, width=lw)
    out.save(args["out"], "PNG")
    print(json.dumps({"ok": True, "mode": "cutback", "gap": [bx0, by0, bx1, by1]}))


def _detect_corner_lines(base, x0, x1, yc_m0, yf_m0):
    """The image-first corner-line detector (grow2's FINAL form), shared:
    returns det = [[ya, slope, score] x TL,TR,BL,BR] plus the misfit fn,
    lines launched at the panel edges x0/x1."""
    import numpy as np
    gray = np.asarray(base.convert("L")).astype(float)
    Gy = np.abs(np.diff(gray, axis=0))
    Himg, Wimg = Gy.shape
    rgb = np.asarray(base).astype(float)
    def line_score(xs, ys):
        """A corner line SEPARATES fabrics: edge energy x cross-line colour
        contrast, so a grout seam or masonry course (same fabric both sides)
        loses to the true junction."""
        good = (ys >= 7) & (ys <= Himg - 8)
        if good.sum() < 10:
            return -1.0
        yi = ys[good].round().astype(int); xi = xs[good]
        g = float(Gy[yi, xi].mean())
        c = float(np.abs(rgb[yi - 6, xi] - rgb[yi + 6, xi]).sum(axis=1).mean())
        return g * (c + 8.0)
    def sliver_cols(x_edge, direction):
        span = (x_edge - 2) if direction < 0 else (Wimg - x_edge - 3)
        return (int(x_edge) + direction * np.arange(2, max(10, span))).clip(0, Wimg - 1)
    def best_ya(x_edge, m, direction, ylo, yhi):
        xs = sliver_cols(x_edge, direction)
        best = (-1.0, ylo)
        for ya in np.arange(ylo, yhi, 2.0):
            s = line_score(xs, ya + m * (xs - x_edge))
            if s > best[0]:
                best = (s, float(ya))
        return best
    def refine(x_edge, ya0, m0, direction):
        """Per-column edge samples near the scan winner, robust straight fit,
        then a seam-weighted refit so the LAUNCH hugs the paint exactly where
        the wireframe meets it (painted junctions curve a little)."""
        xs_, ys_ = [], []
        for x in sliver_cols(x_edge, direction):
            yp = ya0 + m0 * (x - x_edge)
            lo, hi = int(max(1, yp - 10)), int(min(Himg - 1, yp + 10))
            if hi - lo < 4:
                continue
            g = Gy[lo:hi, x]
            if g.max() < 6:
                continue
            xs_.append(float(x)); ys_.append(float(lo + int(np.argmax(g))))
        xs_ = np.array(xs_); ys_ = np.array(ys_)
        if len(xs_) < 12:
            return float(ya0), float(m0)
        fit = np.polyfit(xs_, ys_, 1)
        for _ in range(3):
            r = np.abs(np.polyval(fit, xs_) - ys_)
            keep = r <= max(3.0, np.percentile(r, 70))
            if keep.sum() < 12:
                break
            xs_, ys_ = xs_[keep], ys_[keep]
            fit = np.polyfit(xs_, ys_, 1)
        dist = np.abs(xs_ - x_edge); near = dist <= 60
        if near.sum() >= 8:
            fit = np.polyfit(xs_[near], ys_[near], 1,
                             w=1.0 / (1.0 + dist[near] / 20.0))
        return float(np.polyval(fit, x_edge)), float(fit[0])
    def misfit(x_edge, ya, m, direction):
        """Verification, not eyeball: mean px deviation of the paint's own
        edge from the chosen line, over the 40 columns nearest the seam."""
        ds = []
        for step in range(2, 42):
            x = int(x_edge) + direction * step
            if x < 1 or x > Wimg - 2:
                break
            yp = ya + m * (x - x_edge)
            lo, hi = int(max(1, yp - 8)), int(min(Himg - 1, yp + 8))
            if hi - lo < 4:
                continue
            g = Gy[lo:hi, x]
            if g.max() < 6:
                continue
            ds.append(abs(lo + int(np.argmax(g)) - yp))
        return float(np.mean(ds)) if ds else -1.0
    # TL, TR, BL, BR: panel edge, sliver direction, slope sign (dy/dx)
    corners = [(x0, -1, +1), (x1, +1, -1), (x0, -1, -1), (x1, +1, +1)]
    cx = (x0 + x1) / 2.0
    # CANDIDATES, THEN SELECTION [Kabe, 2026-08-31]: score the whole
    # (slope x height) grid per corner, keep every strong straight-line peak
    # (verified: a real painted line hugs its fit, misfit <= 3px; and it
    # separates two notable colours - the contrast term), then SELECT: the
    # corner lines are the EXTREME junctions - above the ceiling line there is
    # only ceiling, below the floor line only floor - so among strong
    # candidates the top pair is the highest and the bottom pair the lowest,
    # pairs mirror-matched in slope and both pairs converging to one eye row.
    MAGS = np.linspace(0.15, 1.3, 24)
    def side_candidates(x_edge, d, sgn, ylo, yhi):
        xs = sliver_cols(x_edge, d)
        yas = np.arange(ylo, yhi, 2.0)
        S = np.full((len(MAGS), len(yas)), -1.0)
        for mi, mag in enumerate(MAGS):
            for yi, ya in enumerate(yas):
                S[mi, yi] = line_score(xs, ya + sgn * mag * (xs - x_edge))
        peaks = []
        smax = S.max()
        if smax <= 0:
            return peaks
        for mi in range(len(MAGS)):
            for yi in range(len(yas)):
                s = S[mi, yi]
                if s < 0.05 * smax:
                    continue
                lo_m, hi_m = max(0, mi - 1), min(len(MAGS), mi + 2)
                lo_y, hi_y = max(0, yi - 10), min(len(yas), yi + 11)
                if s < S[lo_m:hi_m, lo_y:hi_y].max():
                    continue
                ya_r, m_r = refine(x_edge, float(yas[yi]), sgn * MAGS[mi], d)
                if abs(m_r) < 0.15 or m_r * sgn < 0:
                    continue
                mf = misfit(x_edge, ya_r, m_r, d)
                if mf < 0 or mf > 3.0:
                    continue
                if any(abs(p["ya"] - ya_r) < 14 and abs(p["m"] - m_r) < 0.12
                       for p in peaks):
                    continue
                peaks.append({"ya": ya_r, "m": m_r, "s": float(s), "mf": mf})
        peaks.sort(key=lambda p: -p["s"])
        return peaks[:6]
    # the search BANDS come from the view's own measured rows (the same
    # readings the pipeline takes on every wall): the ceiling row yc and the
    # floor row yf, +/-70px. Detection stays on the image; the band only says
    # where a corner line can launch for this camera.
    yc_m = float(yc_m0 if yc_m0 is not None else Himg * 0.2); yf_m = float(yf_m0 if yf_m0 is not None else Himg * 0.73)
    cand = [side_candidates(x_edge, d, sgn,
                            *((max(10.0, yc_m - 70), min(Himg * 0.6, yc_m + 70)) if k < 2
                              else (max(Himg * 0.42, yf_m - 70), min(Himg - 10.0, yf_m + 70))))
            for k, (x_edge, d, sgn) in enumerate(corners)]
    def pair_combos(ci, cj, xi, xj):
        out = []
        for a_ in ci:
            for b_ in cj:
                r = abs(a_["m"] / b_["m"]) if b_["m"] else 99
                if not (1 / 1.6 <= r <= 1.6):
                    continue
                vp = (a_["ya"] + a_["m"] * (cx - xi)
                      + b_["ya"] + b_["m"] * (cx - xj)) / 2.0
                out.append({"a": a_, "b": b_, "vp": vp,
                            "mid": (a_["ya"] + b_["ya"]) / 2.0,
                            "s": a_["s"] + b_["s"]})
        return out
    tops = pair_combos(cand[0], cand[1], corners[0][0], corners[1][0])
    bots = pair_combos(cand[2], cand[3], corners[2][0], corners[3][0])
    best = None
    for t in tops:
        for b in bots:
            if abs(t["vp"] - b["vp"]) > 70:
                continue
            if b["mid"] - t["mid"] <= 0:
                continue
            key = t["s"] + b["s"]
            if best is None or key > best[0]:
                best = (key, t, b)
    if best is None and tops and bots:      # no converging combo: strongest
        t = max(tops, key=lambda c: c["s"]); b = max(bots, key=lambda c: c["s"])
        best = (None, t, b)
    if best is None:
        raise SystemExit(json.dumps({"ok": False, "mode": "grow2",
                                     "error": "no corner-line candidates survived verification"}))
    _, t, b = best
    det = [[t["a"]["ya"], t["a"]["m"], t["a"]["s"]],
           [t["b"]["ya"], t["b"]["m"], t["b"]["s"]],
           [b["a"]["ya"], b["a"]["m"], b["a"]["s"]],
           [b["b"]["ya"], b["b"]["m"], b["b"]["s"]]]
    return det, corners, misfit

def grow2(args):
    """[Kabe, 2026-08-31, the image-led grow — FINAL form] "start with corner
    detection on the image itself and have the corner edges extend off of the
    image section and into our wire frame. It will be easier for you to simply
    align the two generated lines over each other."

    IMAGE-FIRST: the four corner lines are detected on the raw painting alone —
    no box, no measured priors, a wide joint scan per mirrored pair, scored by
    edge energy x cross-line fabric contrast. The wireframe corner lines ARE
    the detected lines extended inward to the estimated depth; the gap quad's
    corners are the detected lines' crossings at the panel edges; the back-wall
    cut rows derive from the detected lines. The cutout settles by
    least-squares uniform scale + translation onto the four stops, and the
    generation reconciles the rest."""
    import numpy as np
    from PIL import ImageDraw
    base = Image.open(args["base_png"]).convert("RGB")
    a = np.asarray(base).astype(np.uint8).copy()
    bb = args["base_box"]
    x0, x1 = int(round(bb["x0"])), int(round(bb["x1"]))
    GROUND = (208, 202, 192)
    det, corners, misfit = _detect_corner_lines(
        base, x0, x1, float(bb.get("yc")) if "yc" in bb else None,
        float(bb.get("yf")) if "yf" in bb else None)
    Himg, Wimg = a.shape[0], a.shape[1]
    cx = (x0 + x1) / 2.0
    P = [(float(c[0]), d[0]) for c, d in zip(corners, det)]
    slopes = [d[1] for d in det]
    anchors = [{"x": c[0], "y": round(d[0], 1), "slope": round(d[1], 4),
                "overlap": round(d[2], 1),
                "misfit_px": round(misfit(c[0], d[0], d[1], c[1]), 2)}
               for c, d in zip(corners, det)]
    # back-wall cut rows come from the detected lines, not a measured box
    y0c = int(round(min(det[0][0], det[1][0])))
    y1c = int(round(max(det[2][0], det[3][0])))
    y0c = max(0, y0c); y1c = min(Himg, y1c)
    cut = a[y0c:y1c, x0:x1].copy()
    if args.get("reveal_png"):
        from PIL import ImageFilter as _IFR
        rm = np.asarray(Image.open(args["reveal_png"]).convert("L")
                        .filter(_IFR.MaxFilter(25))) > 127
        rm[y0c:y1c, x0:x1] = False
        blur_src = np.asarray(Image.fromarray(a).filter(_IFR.GaussianBlur(12)))
        a[rm] = blur_src[rm]
    out = Image.fromarray(a)
    d = ImageDraw.Draw(out)
    INK = (42, 33, 24); lw = 3
    # the gap quad's corners ARE the detected launch points
    d.polygon([(x0, P[0][1]), (x1, P[1][1]), (x1, P[3][1]), (x0, P[2][1])],
              fill=GROUND)
    k_est = float(args["depth_ratio"])          # z_near / z_far
    ends = []
    for (px, py), m, (x_edge, direction, sgn) in zip(P, slopes, corners):
        ex = cx + (px - cx) * k_est             # stop column: pure scale toward centre
        ey = py + m * (ex - px)                 # the detected line, extended inward
        ends.append((ex, ey))
        d.line([(px, py), (ex, ey)], fill=INK, width=lw)
        ox = px + (direction * (Wimg - 1 - px) if direction > 0 else -(px - 1))
        d.line([(px, py), (ox, py + m * (ox - px))], fill=INK, width=1)
    # the cutout's own corners, in cut-local rows, per detected side
    C = np.array([(0.0, det[0][0] - y0c), (float(x1 - x0), det[1][0] - y0c),
                  (0.0, det[2][0] - y0c), (float(x1 - x0), det[3][0] - y0c)])
    E = np.array(ends)
    cbar = C.mean(axis=0); ebar = E.mean(axis=0)
    Cc = C - cbar; Ec = E - ebar
    k_fit = float((Ec * Cc).sum() / (Cc * Cc).sum())
    k_fit = max(0.05, min(1.0, k_fit))   # a garbage line set must not flip or explode the wall
    t = ebar - k_fit * cbar
    cw = max(1, round((x1 - x0) * k_fit)); ch = max(1, round((y1c - y0c) * k_fit))
    wall = Image.fromarray(cut).resize((cw, ch), Image.LANCZOS)
    wx = int(round(t[0])); wy = int(round(t[1]))
    out.paste(wall, (wx, wy))
    out.save(args["out"], "PNG")
    print(json.dumps({"ok": True, "mode": "grow2", "k_fit": round(k_fit, 4),
                      "ends": [[round(e[0]), round(e[1])] for e in ends],
                      "anchors": anchors, "cut_rows": [y0c, y1c],
                      "wall_at": [wx, wy, wx + cw, wy + ch]}))


def reverse(args):
    """[Kabe, 2026-08-31, phase 3 verbatim] "from the immediate perspective of
    the far side of that direction turned around. Because for reference you
    can have almost everything but back wall. Horizontal flip the image first.
    Then pull the end of the ceiling inside details to the front and the front
    to the back, which stretches and skews it in reverse. Do the same to the
    side walls and floor. Then thats the reference image looking back for the
    enhance and fill the gap on the back wall."

    THE REVERSE VIEW: the completed long view of the same axis, flipped, and
    each sweep plane depth-reversed along its own recession (far content to
    the front, front to the back - the deliberate reverse skew, sweeps only).
    The back wall was behind the original camera and is the GAP: an outlined
    box with its doorway drawn and named, for the painter to fill."""
    import numpy as np
    from PIL import ImageDraw
    src = Image.open(args["long_png"]).convert("RGB").transpose(Image.FLIP_LEFT_RIGHT)
    sa = np.asarray(src).astype(np.float32)
    d0 = args["deep"]
    f, vx, vy = d0["f"], d0["vx"], d0["vy"]
    zw = d0["z_wall"]
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float64)
    dx, dy = xs - vx, ys - vy
    eps = 1e-6
    z_floor = np.where(dy > eps, d0["eye_m"] * f / np.maximum(dy, eps), np.inf)
    z_ceil  = np.where(dy < -eps, d0["ceil_m"] * f / np.maximum(-dy, eps), np.inf)
    z_side  = np.where(np.abs(dx) > eps, d0["half_w_m"] * f / np.maximum(np.abs(dx), eps), np.inf)
    z = np.minimum.reduce([z_floor, z_ceil, z_side, np.full_like(dx, zw)])
    on_wall = z >= zw - eps
    # per-plane nearest visible depth (at the frame edge), for the reversal span
    zmin_floor = d0["eye_m"] * f / (H - vy)
    zmin_ceil  = d0["ceil_m"] * f / vy
    zmin_side  = d0["half_w_m"] * f / (W - vx)
    zmin = np.where(z_side <= np.minimum(z_floor, z_ceil), zmin_side,
                    np.where(dy > 0, zmin_floor, zmin_ceil))
    zr = np.clip(zmin + zw - z, zmin * 1.001, zw * 0.999)   # far <-> near
    # the same plane point (lateral / height preserved) at the reversed depth
    cc = vx + dx * z / zr
    cr = vy + dy * z / zr
    ccl = np.clip(cc, 0, W - 1.001); crl = np.clip(cr, 0, H - 1.001)
    x0i = ccl.astype(int); y0i = crl.astype(int)
    fx2 = (ccl - x0i)[..., None]; fy2 = (crl - y0i)[..., None]
    out = (sa[y0i, x0i] * (1 - fx2) * (1 - fy2) + sa[y0i, np.minimum(x0i + 1, W - 1)] * fx2 * (1 - fy2)
           + sa[np.minimum(y0i + 1, H - 1), x0i] * (1 - fx2) * fy2
           + sa[np.minimum(y0i + 1, H - 1), np.minimum(x0i + 1, W - 1)] * fx2 * fy2)
    GROUND = (208, 202, 192)
    b = args["gap_box"]
    bx0, bx1, by0, by1 = int(round(b["x0"])), int(round(b["x1"])), int(round(b["yc"])), int(round(b["yf"]))
    out[by0:by1, bx0:bx1] = GROUND
    img = Image.fromarray(out.clip(0, 255).astype(np.uint8))
    d = ImageDraw.Draw(img)
    INK = (42, 33, 24); lw = 3
    d.rectangle([bx0, by0, bx1, by1], outline=INK, width=lw)
    for door in args.get("ring_doors", []):
        d.rectangle([door["x0"], door["y0"], door["x1"], door["y1"]], outline=INK, width=lw)
    img.save(args["out"], "PNG")
    print(json.dumps({"ok": True, "mode": "reverse",
                      "gap": [bx0, by0, bx1, by1],
                      "doors": len(args.get("ring_doors", []))}))


def cutback(args):
    """[Kabe, 2026-08-31, phase 3 v2] "we should not flip but simply skew the
    corners to the right location" - the flip turned ceiling content upside
    down. V2: the completed long view stays EXACTLY as painted - no flip, no
    depth remap, clean sweeps - and only the wall box is cut to the gap,
    snapped to the painting's own corners, with the doorway outlined for the
    painter to fill."""
    from PIL import ImageDraw
    import numpy as np
    img = Image.open(args["long_png"]).convert("RGB")
    a = np.asarray(img).astype(np.uint8).copy()
    b = args["gap_box"]
    bx0, bx1, by0, by1 = int(round(b["x0"])), int(round(b["x1"])), int(round(b["yc"])), int(round(b["yf"]))
    a[by0:by1, bx0:bx1] = (208, 202, 192)
    out = Image.fromarray(a)
    d = ImageDraw.Draw(out)
    INK = (42, 33, 24); lw = 3
    d.rectangle([bx0, by0, bx1, by1], outline=INK, width=lw)
    for door in args.get("ring_doors", []):
        d.rectangle([door["x0"], door["y0"], door["x1"], door["y1"]], outline=INK, width=lw)
    out.save(args["out"], "PNG")
    print(json.dumps({"ok": True, "mode": "cutback", "gap": [bx0, by0, bx1, by1]}))


def grow3(args):
    """[Kabe, 2026-08-31, the cover-fit plane assembly] "Cut the side walls,
    cieling, floor, back wall. Now, scale while maintaining aspect ratio so
    that piece fully covers the wireframe version and cut/crop off what
    overlays over the wireframe line... No skewing or warping just locked
    scaling. Same with back wall... If the image generated element is larger
    then the wireframe cutout of that section it scales down to the exact size
    of the shrink size that doesn't have a pixel shrink smaller then the
    wireframe section... If the image generated element is smaller... it
    scales up to the exact size that closes that gap. And again crop off
    element outside of the corner boundry."

    Each plane of the 1x1 is cut along the image's own DETECTED corner lines,
    uniformly scaled (locked aspect - no skew, no warp) to the minimal size
    that fully covers its 2x1 wireframe region, and cropped at the wireframe
    lines. The wireframe is OUR correct geometry: corner lines through the
    detected close corners toward the declared vp, deep corners at the
    declared depth ratio. Coverage is total; the seams carry the angle
    mismatch and the painter reconciles."""
    import numpy as np
    from PIL import ImageDraw
    base = Image.open(args["base_png"]).convert("RGB")
    W, H = base.size
    bb = args["base_box"]
    x0, x1 = int(round(bb["x0"])), int(round(bb["x1"]))
    a = np.asarray(base)
    det, corners, _mis = _detect_corner_lines(
        base, x0, x1, float(bb.get("yc")) if "yc" in bb else None,
        float(bb.get("yf")) if "yf" in bb else None)
    vx, vy = args.get("vp", [768.0, 526.1])
    k = float(args["depth_ratio"])
    C = [(float(x0), det[0][0]), (float(x1), det[1][0]),
         (float(x0), det[2][0]), (float(x1), det[3][0])]
    # [Kabe] the far wall stops at OUR estimated depth: the deep rect is the
    # DECLARED geometry (declared close corners scaled toward the vp), so the
    # instruments' ruler and the guide agree about the far wall's size. The
    # ring lines run detected-launch -> declared-stop.
    db = args.get("declared_box", {})
    dyc = float(db.get("yc", bb.get("yc", C[0][1])))
    dyf = float(db.get("yf", bb.get("yf", C[2][1])))
    Cd = [(float(x0), dyc), (float(x1), dyc), (float(x0), dyf), (float(x1), dyf)]
    D = [(vx + (cxy[0] - vx) * k, vy + (cxy[1] - vy) * k) for cxy in Cd]
    def sline(i, x):                       # the image's own detected line
        return det[i][0] + det[i][1] * (x - C[i][0])
    def tline(i, x):                       # our correct geometry: through C toward vp
        m = (vy - C[i][1]) / (vx - C[i][0])
        return C[i][1] + m * (x - C[i][0])
    canvas = Image.new("RGB", (W, H), (208, 202, 192))   # the gap ring shows GROUND
    report = {}
    def cover(name, sbox, tpoly, tbox, anchor):
        sx0, sy0, sx1, sy1 = [int(round(v)) for v in sbox]
        sx0 = max(0, sx0); sy0 = max(0, sy0); sx1 = min(W, sx1); sy1 = min(H, sy1)
        sw, sh = max(1, sx1 - sx0), max(1, sy1 - sy0)
        tx0, ty0, tx1, ty1 = tbox
        tw, th = max(1.0, tx1 - tx0), max(1.0, ty1 - ty0)
        s = max(tw / sw, th / sh)          # the exact minimal covering scale
        pw, ph = max(1, round(sw * s)), max(1, round(sh * s))
        piece = base.crop((sx0, sy0, sx1, sy1)).resize((pw, ph), Image.LANCZOS)
        if anchor == "top":
            px, py = (tx0 + tx1) / 2.0 - pw / 2.0, ty0
        elif anchor == "bottom":
            px, py = (tx0 + tx1) / 2.0 - pw / 2.0, ty1 - ph
        elif anchor == "left":
            px, py = tx0, (ty0 + ty1) / 2.0 - ph / 2.0
        elif anchor == "right":
            px, py = tx1 - pw, (ty0 + ty1) / 2.0 - ph / 2.0
        else:
            px, py = (tx0 + tx1) / 2.0 - pw / 2.0, (ty0 + ty1) / 2.0 - ph / 2.0
        layer = Image.new("RGB", (W, H), (0, 0, 0))
        layer.paste(piece, (int(round(px)), int(round(py))))
        mask = Image.new("L", (W, H), 0)
        ImageDraw.Draw(mask).polygon([(float(px_), float(py_)) for px_, py_ in tpoly], fill=255)
        canvas.paste(layer, (0, 0), mask)
        report[name] = {"scale": round(s, 4), "src": [sx0, sy0, sx1, sy1],
                        "at": [round(px), round(py)]}
    # [Kabe]: "we shouldn't scale it to fully cover the 2x1, just the front
    # 1x1 section" - each element keeps its own footprint: it covers only the
    # front section (frame edge to the close-corner plane), bounded by OUR
    # corrected lines; the middle ring stays wireframe gap; the back wall
    # cover-fits the deep rect.
    # [Kabe, 2026-08-31]: no back-wall corner molding may ride mid-room in the
    # front ceiling/floor: the source is CLIPPED 28px short of the junction
    # band, and the cover scale-up fills the difference with the plane's own
    # texture.
    JMARGIN = 28
    cover("ceiling",
          (0, 0, W, min(C[0][1], C[1][1]) - JMARGIN),
          [(0, 0), (W, 0), (W, tline(1, W)), C[1], C[0], (0, tline(0, 0))],
          (0, 0, W, max(tline(0, 0), tline(1, W), C[0][1], C[1][1])), "top")
    cover("floor",
          (0, max(C[2][1], C[3][1]) + JMARGIN, W, H),
          [(0, H), (W, H), (W, tline(3, W)), C[3], C[2], (0, tline(2, 0))],
          (0, min(tline(2, 0), tline(3, W), C[2][1], C[3][1]), W, H), "bottom")
    # the same law at the vertical seam: the 1x1's own corner shadow at the
    # panel edge must not ride the ring's front boundary - the side sources
    # stop 10px short of it and the cover scale-up refills with wall fabric.
    VMARGIN = 10
    cover("left_wall",
          (0, min(sline(0, 0), C[0][1]), x0 - VMARGIN, max(sline(2, 0), C[2][1])),
          [(0, tline(0, 0)), C[0], C[2], (0, tline(2, 0))],
          (0, min(tline(0, 0), C[0][1]), C[0][0], max(tline(2, 0), C[2][1])), "left")
    cover("right_wall",
          (x1 + VMARGIN, min(sline(1, W - 1), C[1][1]), W, max(sline(3, W - 1), C[3][1])),
          [(W, tline(1, W)), C[1], C[3], (W, tline(3, W))],
          (C[1][0], min(tline(1, W), C[1][1]), W, max(tline(3, W), C[3][1])), "right")
    cover("back_wall",
          (x0, min(C[0][1], C[1][1]), x1, max(C[2][1], C[3][1])),
          [D[0], D[1], D[3], D[2]],
          (min(D[0][0], D[2][0]), min(D[0][1], D[1][1]),
           max(D[1][0], D[3][0]), max(D[2][1], D[3][1])), "center")
    # the wireframe through the gap ring: our corner lines, close to deep
    dd = ImageDraw.Draw(canvas)
    for ci, di in zip(C, D):
        dd.line([ci, di], fill=(42, 33, 24), width=3)
    # [Kabe, 2026-08-31]: "lock this in as the standard methodology with a
    # guard to make sure we are eliminating that particular risk of mid
    # artifact" - FAIL-CLOSED: scan the front ceiling and floor mid-spans of
    # the assembled guide for any row-coherent horizontal edge band; a breach
    # refuses the build (only a .breach debug copy is written).
    cg = np.asarray(canvas.convert("L")).astype(float)
    def band_guard(y_lo, y_hi, name):
        y_lo, y_hi = int(max(1, y_lo)), int(min(H - 1, y_hi))
        if y_hi - y_lo < 6:
            return {"band": name, "rows": 0, "max": 0.0, "median": 0.0, "ok": True}
        seg = cg[y_lo:y_hi, int(x0) + 40:int(x1) - 40]
        g = np.abs(np.diff(seg, axis=0)).mean(axis=1)
        med = float(np.median(g)); mx = float(g.max())
        return {"band": name, "rows": int(len(g)), "max": round(mx, 2),
                "median": round(med, 2),
                "ok": bool(mx <= max(9.0, 5.0 * (med + 0.3)))}
    guards = [band_guard(8, min(C[0][1], C[1][1]) - 8, "ceiling_front"),
              band_guard(max(C[2][1], C[3][1]) + 8, H - 8, "floor_front")]
    breach = [g_ for g_ in guards if not g_["ok"]]
    if breach:
        canvas.save(args["out"] + ".breach.png", "PNG")
        print(json.dumps({"ok": False, "mode": "grow3",
                          "error": "mid-room artifact guard breached",
                          "guards": guards}))
        return
    canvas.save(args["out"], "PNG")
    print(json.dumps({"ok": True, "mode": "grow3", "guards": guards,
                      "close_corners": [[round(c[0]), round(c[1], 1)] for c in C],
                      "deep_corners": [[round(d[0], 1), round(d[1], 1)] for d in D],
                      "elements": report}))

def reverse3(args):
    """[Kabe, 2026-08-31]: "lets get back to the flip and redraw from far
    backward perspective" - phase 3 under G-PREP. The finished 2x1 is
    FLIPPED; its corner lines are detected on the flipped painting; the
    middle-band plane strips (the far half, real painted material) are cut
    along those lines and cover-fit (locked scale, cropped at our corrected
    lines) into the backward view's FRONT footprint; the middle ring stays
    pale wireframe gap with the corner lines drawn; the far back wall - never
    seen by the original camera - is an outlined gap box."""
    import numpy as np
    from PIL import ImageDraw, ImageOps
    base0 = Image.open(args["base_png"]).convert("RGB")
    base = ImageOps.mirror(base0)
    W, H = base.size
    bb = args["base_box"]
    x0, x1 = int(round(bb["x0"])), int(round(bb["x1"]))
    det, corners, _mis = _detect_corner_lines(
        base, x0, x1, float(bb.get("yc")) if "yc" in bb else None,
        float(bb.get("yf")) if "yf" in bb else None)
    vx, vy = args.get("vp", [768.0, 526.1])
    k = float(args["depth_ratio"])
    C = [(float(x0), det[0][0]), (float(x1), det[1][0]),
         (float(x0), det[2][0]), (float(x1), det[3][0])]
    db = args.get("declared_box", {})
    dyc = float(db.get("yc", bb.get("yc", C[0][1])))
    dyf = float(db.get("yf", bb.get("yf", C[2][1])))
    Cd = [(float(x0), dyc), (float(x1), dyc), (float(x0), dyf), (float(x1), dyf)]
    D = [(vx + (cxy[0] - vx) * k, vy + (cxy[1] - vy) * k) for cxy in Cd]
    # source strips cut at the PAINT's own far region (detected corners
    # vp-scaled); only the targets are declared
    Ds = [(vx + (cxy[0] - vx) * k, vy + (cxy[1] - vy) * k) for cxy in C]
    def tline(i, x):
        m = (vy - C[i][1]) / (vx - C[i][0])
        return C[i][1] + m * (x - C[i][0])
    GROUND = (208, 202, 192); INK = (42, 33, 24)
    canvas = Image.new("RGB", (W, H), GROUND)
    report = {}
    def cover(name, sbox, tpoly, tbox, anchor):
        sx0, sy0, sx1, sy1 = [int(round(v)) for v in sbox]
        sx0 = max(0, sx0); sy0 = max(0, sy0); sx1 = min(W, sx1); sy1 = min(H, sy1)
        sw, sh = max(1, sx1 - sx0), max(1, sy1 - sy0)
        tx0, ty0, tx1, ty1 = tbox
        tw, th = max(1.0, tx1 - tx0), max(1.0, ty1 - ty0)
        s = max(tw / sw, th / sh)
        pw, ph = max(1, round(sw * s)), max(1, round(sh * s))
        piece = base.crop((sx0, sy0, sx1, sy1)).resize((pw, ph), Image.LANCZOS)
        if anchor == "top":
            px, py = (tx0 + tx1) / 2.0 - pw / 2.0, ty0
        elif anchor == "bottom":
            px, py = (tx0 + tx1) / 2.0 - pw / 2.0, ty1 - ph
        elif anchor == "left":
            px, py = tx0, (ty0 + ty1) / 2.0 - ph / 2.0
        elif anchor == "right":
            px, py = tx1 - pw, (ty0 + ty1) / 2.0 - ph / 2.0
        else:
            px, py = (tx0 + tx1) / 2.0 - pw / 2.0, (ty0 + ty1) / 2.0 - ph / 2.0
        layer = Image.new("RGB", (W, H), GROUND)
        layer.paste(piece, (int(round(px)), int(round(py))))
        mask = Image.new("L", (W, H), 0)
        ImageDraw.Draw(mask).polygon([(float(a_), float(b_)) for a_, b_ in tpoly], fill=255)
        canvas.paste(layer, (0, 0), mask)
        report[name] = {"scale": round(s, 4), "src": [sx0, sy0, sx1, sy1],
                        "at": [round(px), round(py)]}
    # SOURCES are the middle-band strips of the flipped finished view - real
    # painted material of the room's far half; TARGETS are the backward
    # front footprints (same construction as grow3's).
    JMARGIN_R = 12
    cover("ceiling",
          (x0, min(C[0][1], C[1][1]), x1, min(Ds[0][1], Ds[1][1]) - JMARGIN_R),
          [(0, 0), (W, 0), (W, tline(1, W)), C[1], C[0], (0, tline(0, 0))],
          (0, 0, W, max(tline(0, 0), tline(1, W), C[0][1], C[1][1])), "top")
    cover("floor",
          (x0, max(Ds[2][1], Ds[3][1]) + JMARGIN_R, x1, max(C[2][1], C[3][1])),
          [(0, H), (W, H), (W, tline(3, W)), C[3], C[2], (0, tline(2, 0))],
          (0, min(tline(2, 0), tline(3, W), C[2][1], C[3][1]), W, H), "bottom")
    cover("left_wall",
          (x0, min(C[0][1], Ds[0][1]), Ds[0][0], max(C[2][1], Ds[2][1])),
          [(0, tline(0, 0)), C[0], C[2], (0, tline(2, 0))],
          (0, min(tline(0, 0), C[0][1]), C[0][0], max(tline(2, 0), C[2][1])), "left")
    cover("right_wall",
          (Ds[1][0], min(C[1][1], Ds[1][1]), x1, max(C[3][1], Ds[3][1])),
          [(W, tline(1, W)), C[1], C[3], (W, tline(3, W))],
          (C[1][0], min(tline(1, W), C[1][1]), W, max(tline(3, W), C[3][1])), "right")
    dd = ImageDraw.Draw(canvas)
    for ci, di in zip(C, D):
        dd.line([ci, di], fill=INK, width=3)
    # the far back wall was never seen: an OUTLINED GAP box at the deep rect
    bx0, by0 = min(D[0][0], D[2][0]), min(D[0][1], D[1][1])
    bx1, by1 = max(D[1][0], D[3][0]), max(D[2][1], D[3][1])
    dd.rectangle([bx0, by0, bx1, by1], fill=GROUND, outline=INK, width=3)
    if args.get("door"):
        dw, dh = args["door"]                 # metres
        ppm = (bx1 - bx0) / float(args.get("wall_w_m", 6.4))
        dwp, dhp = dw * ppm, dh * ppm
        dcx = (bx0 + bx1) / 2.0
        dd.rectangle([dcx - dwp / 2.0, by1 - dhp, dcx + dwp / 2.0, by1],
                     outline=INK, width=3)
    canvas.save(args["out"], "PNG")
    print(json.dumps({"ok": True, "mode": "reverse3",
                      "close_corners": [[round(c[0]), round(c[1], 1)] for c in C],
                      "deep_corners": [[round(d[0], 1), round(d[1], 1)] for d in D],
                      "elements": report}))

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
    if args.get("mode") == "compose":
        return compose(args)
    if args.get("mode") == "grow":
        return grow(args)
    if args.get("mode") == "reverse":
        return reverse(args)
    if args.get("mode") == "grow2":
        return grow2(args)
    if args.get("mode") == "grow3":
        return grow3(args)
    if args.get("mode") == "reverse3":
        return reverse3(args)
    if args.get("mode") == "cutback":
        return cutback(args)
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
