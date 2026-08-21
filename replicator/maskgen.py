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
    p.add_argument("--out", required=True)
    p.add_argument("--overlay", help="source image to draw the mask over, for the eye")
    p.add_argument("--overlay-out")
    args = p.parse_args(argv)

    if bool(args.poly) == bool(args.rect):
        print("give exactly one of --poly or --rect", file=sys.stderr)
        return 3
    mask = (polygon_mask(args.size, args.poly) if args.poly
            else rect_mask(args.size, *args.rect))
    mask_to_image(mask).save(args.out)
    print("wrote %s — %d px of %dx%d" % (args.out, int(mask.sum()), args.size[0], args.size[1]),
          file=sys.stderr)

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
