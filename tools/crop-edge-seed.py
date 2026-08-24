#!/usr/bin/env python3
"""Cut one edge strip off a painted facing — the pixel half of row 38's seed.

    python3 tools/crop-edge-seed.py <source.png> <out.png> <left|right> [fraction]

Prints one JSON object: the strip's size, its sha256, and the source's, so the
emitter can record in the manifest exactly which pixels it sent and a later
reader can prove the strip against the painting it came from.

WHY PYTHON FOR A CROP. Node has no image codec and this project has ruled
`numpy + PIL only` for pixels (`measure_lib.py`'s header); `tools/bake-backdrops.mjs`
already shells out to `tools/encode-backdrop.py` for exactly this reason. The
alternative — cutting the strip in the browser the emitter already has open —
would put a canvas encode between the promoted painting and the reference image
the generator is handed, and a reference image that is not byte-faithful to the
wall it claims to continue is the one thing this seed cannot be.

DETERMINISM IS THE POINT, not a nicety. The seed rides in a packet next to a
prompt that says the scene continues from it; if two runs of the emitter cut two
different strips from one painting, the packet's own record stops being a record.
So: no resampling, no colour management, no metadata, a fixed PNG encoder
setting, and the mode forced to RGB. Same source and same side gives the same
bytes, and `seams.spec.mjs` cuts twice and compares sha256.

THE WIDTH IS ROUNDED HALF-UP AND STATED. 10 % of a 1536-wide frame is 153.6 px,
which is not a number of columns. `int(w * fraction + 0.5)` = 154. The rule is
written here rather than left to a language's rounding mode, because Python's
own `round` is banker's and would give 154 here and 152 on a 1525-wide frame for
reasons no reader of a packet could be expected to reconstruct.
"""
import hashlib
import json
import os
import sys

from PIL import Image


def sha256(path):
    with open(path, "rb") as fh:
        return hashlib.sha256(fh.read()).hexdigest()


def cut(source, out, side, fraction=0.10):
    """Write the `side` strip of `source` to `out`. Full height, `fraction` wide."""
    if side not in ("left", "right"):
        raise SystemExit("crop-edge-seed: side must be `left` or `right`, not %r" % side)
    if not (0 < fraction < 1):
        raise SystemExit("crop-edge-seed: fraction must be between 0 and 1, not %r" % fraction)
    im = Image.open(source)
    im = im.convert("RGB")
    w, h = im.size
    strip = int(w * fraction + 0.5)
    if strip < 1:
        raise SystemExit(
            "crop-edge-seed: %s is %d px wide, so %g of it is less than one column"
            % (source, w, fraction))
    box = (0, 0, strip, h) if side == "left" else (w - strip, 0, w, h)
    d = os.path.dirname(os.path.abspath(out))
    if d:
        os.makedirs(d, exist_ok=True)
    im.crop(box).save(out, "PNG", optimize=False, compress_level=6)
    return {
        "source": source,
        "source_sha256": sha256(source),
        "source_w": w,
        "source_h": h,
        "side": side,
        "fraction": fraction,
        "out": out,
        "width_px": strip,
        "height_px": h,
        "columns": [box[0], box[2]],
        "sha256": sha256(out),
    }


def main(argv):
    if len(argv) not in (4, 5):
        raise SystemExit(__doc__.strip().splitlines()[2].strip())
    frac = float(argv[4]) if len(argv) == 5 else 0.10
    print(json.dumps(cut(argv[1], argv[2], argv[3], frac)))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
