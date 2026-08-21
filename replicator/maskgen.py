"""Scripted polygon masks — the row's "agents have no hands to draw".

`polygon_mask` and `rect_mask` are pure. The CLI writes a mask PNG (the same
file blueprint §9.3 names as the ingester's part input) and, with --overlay,
the mask drawn over its source image so the vertices can be checked by eye —
which is the evidence that a mask follows the drawer's real edges, since gate
(d) at closed cannot tell a correct mask from one 15 px inside it.

    python3 -m replicator.maskgen --size 1254x1254 \
        --poly 356,659 756,632 756,769 356,784 \
        --out replicator/masks/desk-joined-oak-1660/drawer_front.png \
        --overlay library-src/corpus/desk-corpus-2.png \
        --overlay-out /tmp/drawer-overlay.png
"""

import argparse
import sys

import numpy as np
from PIL import Image, ImageDraw


def polygon_mask(size, points):
    """Rasterise a polygon to a bool mask of (w, h) `size`.

    `points` is [(x, y), ...] in image pixel coordinates. Pillow's scanline
    polygon rasteriser is deterministic across builds.
    """
    w, h = int(size[0]), int(size[1])
    if w <= 0 or h <= 0:
        raise ValueError("size must be positive, got %r" % (size,))
    pts = [(float(x), float(y)) for x, y in points]
    if len(pts) < 3:
        raise ValueError("a polygon needs at least 3 vertices, got %d" % len(pts))
    img = Image.new("L", (w, h), 0)
    ImageDraw.Draw(img).polygon(pts, fill=255)
    return np.array(img) >= 128


def fit_polygon_from_hint(src_rgb, hint, *, search=10, samples=40, inset=0.12):
    """Fit a part's four edges to the dark reveal gaps around a coarse hint.

    The row asks for masks "produced by scripted polygon masks — agents have no
    hands to draw". A typed polygon read off a printed grid is a hand-drawn mask
    wearing a ruler: the next agent, on the next sprite, reads different numbers.
    So the only human input is a **coarse rectangle** that needs no precision,
    and the four edges are fitted programmatically:

      * for sample columns across the hint, the darkest pixel within `search` of
        the hint's top edge is the reveal gap; a least-squares line through those
        minima is the edge. The bottom edge likewise, and left/right over rows.
      * the polygon is the four fitted lines' intersections.

    A joined drawer front is bounded by a dark reveal on every side — the
    contract's `prompt_block` asks for exactly that ("panel and drawer edges
    clearly delineated with visible reveal gaps"), so this is fitting to
    something the contract requires the image to contain. Returns the vertices
    and the fit residuals, so a poor fit is visible rather than silent.
    """
    lum = np.asarray(src_rgb)[..., :3].astype(np.float64)
    lum = lum[..., 0] * 0.299 + lum[..., 1] * 0.587 + lum[..., 2] * 0.114
    h, w = lum.shape
    # The hint is four numbers (an axis-aligned rectangle) or four vertices
    # (tl, tr, br, bl). A rectangle is enough when the part is square to frame;
    # a part seen in three-quarter view has sloped reveals, and a flat guess
    # cannot follow them -- on the corpus desk the drawer's top reveal rises
    # 27 px across its width, and a window centred on a flat guess fitted the
    # slope backwards and then locked onto the drawer above. So the hint may be
    # sloped, and it is still coarse: the fit moves each edge onto the reveal
    # and reports how far it had to move.
    flat = [float(v) for v in np.asarray(hint, float).ravel()]
    if len(flat) == 4:
        x0, y0, x1, y1 = (int(round(v)) for v in flat)
        corners = [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]
    elif len(flat) == 8:
        corners = [(flat[0], flat[1]), (flat[2], flat[3]),
                   (flat[4], flat[5]), (flat[6], flat[7])]
        xs_ = [c[0] for c in corners]
        ys_ = [c[1] for c in corners]
        x0, x1 = int(round(min(xs_))), int(round(max(xs_)))
        y0, y1 = int(round(min(ys_))), int(round(max(ys_)))
    else:
        raise ValueError("--part-hint wants 4 numbers (a rectangle) or 8 (four vertices), "
                         "got %d" % len(flat))
    if not (0 <= x0 < x1 <= w and 0 <= y0 < y1 <= h):
        raise ValueError("--part-hint %s lies outside the %dx%d source" % (hint, w, h))
    dx_in = int((x1 - x0) * inset)
    dy_in = int((y1 - y0) * inset)

    def line_through(p, q, axis):
        """Initial guess coefficients for one edge, from two hint corners."""
        if axis == "y":
            a = (q[1] - p[1]) / (q[0] - p[0]) if abs(q[0] - p[0]) > 1e-9 else 0.0
            return np.array([a, p[1] - a * p[0]])
        a = (q[0] - p[0]) / (q[1] - p[1]) if abs(q[1] - p[1]) > 1e-9 else 0.0
        return np.array([a, p[0] - a * p[1]])

    def fit(along, y_guess, axis, search_px):
        """One pass: darkest pixel within `search_px` of the current guess line."""
        pts = []
        for t in np.linspace(along[0], along[1], samples):
            t = int(round(t))
            g = int(round(np.polyval(y_guess, t)))
            lo, hi = max(0, g - search_px), min((h if axis == "y" else w), g + search_px + 1)
            if hi - lo < 3:
                continue
            line = lum[lo:hi, t] if axis == "y" else lum[t, lo:hi]
            pts.append((t, lo + int(np.argmin(line))))
        if len(pts) < 4:
            raise ValueError("not enough samples to fit an edge inside the hint")
        ts = np.array([p[0] for p in pts], float)
        vs = np.array([p[1] for p in pts], float)
        coef = np.polyfit(ts, vs, 1)
        resid = vs - np.polyval(coef, ts)
        # One robust pass: drop samples more than 2 sigma out (a drawer's own
        # grain, or the neighbouring drawer's reveal caught by a wide window)
        # and refit on what is left.
        keep = np.abs(resid) <= max(2.0, 2.0 * resid.std())
        if keep.sum() >= 4 and keep.sum() < len(ts):
            coef = np.polyfit(ts[keep], vs[keep], 1)
            resid = vs[keep] - np.polyval(coef, ts[keep])
            ts, vs = ts[keep], vs[keep]
        return coef, {"rms_px": round(float(resid.std()), 3),
                      "max_abs_px": round(float(np.abs(resid).max()), 3),
                      "samples": int(len(ts)), "dropped": int(len(pts) - len(ts))}

    def fit_edge(along, guess0, axis):
        """Coarse-then-fine: a wide window on a flat guess finds the edge's
        slope, a narrow window around that line locks onto it. A single flat
        window cannot follow a sloped reveal -- on the corpus desk the drawer's
        top edge rises 27 px across its width, so a +/-18 px window centred on
        the hint missed it entirely at one end and fitted the slope backwards."""
        guess = np.asarray(guess0, float)
        info = None
        for width in (search, max(3, search // 2)):
            guess, info = fit(along, guess, axis, width)
        return guess, info

    tl, tr, br, bl = corners
    top, r_top = fit_edge((tl[0] + dx_in, tr[0] - dx_in), line_through(tl, tr, "y"), "y")
    bot, r_bot = fit_edge((bl[0] + dx_in, br[0] - dx_in), line_through(bl, br, "y"), "y")
    left, r_left = fit_edge((tl[1] + dy_in, bl[1] - dy_in), line_through(tl, bl, "x"), "x")
    right, r_right = fit_edge((tr[1] + dy_in, br[1] - dy_in), line_through(tr, br, "x"), "x")

    def corner(vline, hline):
        # x = vline(y), y = hline(x)  ->  solve the pair
        a, b = hline          # y = a*x + b
        c, d = vline          # x = c*y + d
        x = (c * b + d) / (1.0 - c * a)
        return (x, a * x + b)

    tl = corner(left, top)
    tr = corner(right, top)
    br = corner(right, bot)
    bl = corner(left, bot)
    verts = [(round(p[0], 2), round(p[1], 2)) for p in (tl, tr, br, bl)]
    return verts, {"top": r_top, "bottom": r_bot, "left": r_left, "right": r_right,
                   "hint": [[round(float(c[0]), 2), round(float(c[1]), 2)] for c in corners],
                   "search_px": search, "samples": samples, "inset": inset,
                   "worst_rms_px": round(max(r["rms_px"] for r in
                                             (r_top, r_bot, r_left, r_right)), 3)}


def rect_mask(size, x0, y0, x1, y1):
    """Rasterise an axis-aligned rectangle (half-open on x1/y1) to a bool mask."""
    if not (x0 < x1 and y0 < y1):
        raise ValueError("rect needs x0 < x1 and y0 < y1, got (%s, %s, %s, %s)"
                         % (x0, y0, x1, y1))
    return polygon_mask(size, [(x0, y0), (x1 - 1, y0), (x1 - 1, y1 - 1), (x0, y1 - 1)])


def mask_to_image(mask):
    """A bool mask as an 8-bit L-mode PIL image (255 = part)."""
    return Image.fromarray((mask.astype(np.uint8) * 255), mode="L")


def overlay_image(src_rgb, mask, fill=(255, 0, 0), alpha=90, outline=(255, 255, 0)):
    """The mask drawn translucently over its source, for the eye. Pure."""
    base = Image.fromarray(np.asarray(src_rgb)[..., :3].astype(np.uint8), "RGB").convert("RGBA")
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    rgba = np.zeros((mask.shape[0], mask.shape[1], 4), np.uint8)
    rgba[mask] = (fill[0], fill[1], fill[2], alpha)
    edge = mask & ~(
        np.pad(mask, ((1, 0), (0, 0)))[:-1] & np.pad(mask, ((0, 1), (0, 0)))[1:] &
        np.pad(mask, ((0, 0), (1, 0)))[:, :-1] & np.pad(mask, ((0, 0), (0, 1)))[:, 1:])
    rgba[edge] = (outline[0], outline[1], outline[2], 255)
    layer = Image.fromarray(rgba, "RGBA")
    return Image.alpha_composite(base, layer).convert("RGB")


def _parse_size(text):
    if "x" not in text:
        raise argparse.ArgumentTypeError("size must look like WIDTHxHEIGHT, got %r" % text)
    w, h = text.lower().split("x", 1)
    return (int(w), int(h))


def _parse_point(text):
    parts = text.split(",")
    if len(parts) != 2:
        raise argparse.ArgumentTypeError("a vertex must look like X,Y, got %r" % text)
    return (float(parts[0]), float(parts[1]))


def main(argv=None):
    p = argparse.ArgumentParser(prog="replicator.maskgen",
                                description="Write a part mask PNG from a scripted polygon.")
    p.add_argument("--size", required=True, type=_parse_size,
                   help="WIDTHxHEIGHT — must match the source image the ingester reads")
    p.add_argument("--poly", nargs="+", type=_parse_point, metavar="X,Y",
                   help="polygon vertices in source image pixel coordinates")
    p.add_argument("--rect", nargs=4, type=float, metavar=("X0", "Y0", "X1", "Y1"))
    p.add_argument("--fit-hint", nargs="+", type=float,
                   help="a COARSE hint: 4 numbers x0 y0 x1 y1, or 8 for four vertices "
                        "(tl tr br bl); the four edges are then fitted to the reveal gaps")
    p.add_argument("--fit-source", help="the source image the hint is read against")
    p.add_argument("--sidecar", help="where to write the fitted vertices and residuals")
    p.add_argument("--out", required=True)
    p.add_argument("--overlay", help="source image to draw the mask over, for the eye")
    p.add_argument("--overlay-out")
    args = p.parse_args(argv)

    modes = [bool(args.poly), bool(args.rect), bool(args.fit_hint)]
    if sum(modes) != 1:
        print("give exactly one of --poly, --rect or --fit-hint", file=sys.stderr)
        return 3
    fit_info = None
    if args.fit_hint:
        if not args.fit_source:
            print("--fit-hint needs --fit-source", file=sys.stderr)
            return 3
        src = np.array(Image.open(args.fit_source).convert("RGB"))
        verts, fit_info = fit_polygon_from_hint(src, args.fit_hint)
        mask = polygon_mask(args.size, verts)
        fit_info["vertices"] = verts
    else:
        mask = (polygon_mask(args.size, args.poly) if args.poly
                else rect_mask(args.size, *args.rect))
    mask_to_image(mask).save(args.out)
    print("wrote %s — %d px of %dx%d" % (args.out, int(mask.sum()), args.size[0], args.size[1]),
          file=sys.stderr)

    if args.sidecar and fit_info is not None:
        import json
        with open(args.sidecar, "w", encoding="utf-8") as fh:
            json.dump(fit_info, fh, sort_keys=True, indent=2)
            fh.write("\n")
        print("wrote %s" % args.sidecar, file=sys.stderr)

    if args.overlay:
        if not args.overlay_out:
            print("--overlay needs --overlay-out", file=sys.stderr)
            return 3
        src = np.array(Image.open(args.overlay).convert("RGB"))
        if src.shape[1] != args.size[0] or src.shape[0] != args.size[1]:
            print("overlay source is %dx%d but --size is %dx%d"
                  % (src.shape[1], src.shape[0], args.size[0], args.size[1]), file=sys.stderr)
            return 3
        overlay_image(src, mask).save(args.overlay_out)
        print("wrote %s" % args.overlay_out, file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
