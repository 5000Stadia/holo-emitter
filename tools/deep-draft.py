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


def main():
    args = json.load(open(sys.argv[1]))
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
