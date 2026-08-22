#!/usr/bin/env python3
"""Encode a promoted backdrop for the page, and say what the encode cost.

    python3 tools/encode-backdrop.py <in.png> <out.jpg> [quality]

Prints one JSON line: the byte sizes and the fidelity of the encode against the
PNG it came from — max and mean absolute channel delta, and the fraction of
pixels that moved by more than 2/255.

WHY THE PAGE IS NOT SERVED THE PNG. The paintings cannot be fetched (§12.7 runs
this from `file://`, and a `file://` image taints the canvas every hash test
reads back), so they ride in the page as data: URIs — and a 2.6 MB PNG is
3.4 MB of base64 that the browser parses before the first frame is drawn. An
artifact critic measured the consequence on a rate-limited link at 200 KB/s:
17.6-19.0 seconds of a blank page, with nothing on the surface to say why. At
eight walls it would be 27 MB.

A painting is a photograph-shaped thing and JPEG is what photographs are for.
What that costs is measured here rather than assumed, and it is the one place
in this project where the picture the page draws is not byte-identical to the
artifact the repository holds — so the difference is a number in the bake's own
output, not a claim.

PIL only, matching the rest of the measurement lane. `subsampling=0` keeps full
chroma resolution, which is what stops a warm hearth's edge from smearing.
"""
import json
import sys

from PIL import Image, ImageChops


def main(argv):
    if len(argv) < 3:
        print("usage: encode-backdrop.py <in.png> <out.jpg> [quality]", file=sys.stderr)
        return 2
    src, dst = argv[1], argv[2]
    quality = int(argv[3]) if len(argv) > 3 else 90
    im = Image.open(src).convert("RGB")
    im.save(dst, "JPEG", quality=quality, optimize=True, progressive=True,
            subsampling=0)
    back = Image.open(dst).convert("RGB")
    diff = ImageChops.difference(im, back)
    hist = diff.histogram()
    n = im.width * im.height
    # One histogram per channel, 256 bins each.
    total = 0.0
    worst = 0
    moved = 0
    for ch in range(3):
        bins = hist[ch * 256:(ch + 1) * 256]
        for v, count in enumerate(bins):
            if count:
                total += v * count
                if v > worst:
                    worst = v
                if v > 2:
                    moved += count
    import os
    print(json.dumps({
        "src": src, "out": dst, "quality": quality,
        "png_bytes": os.path.getsize(src), "jpeg_bytes": os.path.getsize(dst),
        "max_channel_delta": worst,
        "mean_channel_delta": round(total / (n * 3), 4),
        "fraction_of_channels_moved_more_than_2": round(moved / (n * 3), 5),
    }))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
