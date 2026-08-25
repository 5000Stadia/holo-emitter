#!/usr/bin/env python3
"""Row 36 — the demonstration batch, and the corner strips that carry the claim.

    python3 design/plan-draft/measured/row36_batch.py --room kitchen

THE ONE PICTURE THAT SETTLES IT is not a frame, it is a SEAM. Two facings of one
room meet at a corner, and the strip down the right edge of one and the strip
down the left edge of the next are the SAME PHYSICAL WALL seen from two
standpoints. Put them side by side and either the material continues or it does
not; no amount of geometry reporting substitutes for that, and no single frame
shows it.

So this writes, per adjacent pair, the two strips butted together in the order a
player turning would meet them -- and it writes the same pair from the pre-row-36
promoted paintings where they exist, so the Captain is looking at a before and
an after rather than at an assertion.

WHAT THIS BATCH IS NOT. It is not a `§12.6` capture: these are the assembler's
own frames, not the scene canvas as the page draws it, because the pieces are V1
placeholder art and nothing here is promotable. The page capture comes when the
swatches land. The batch says so on its own face rather than letting a reader
assume otherwise.
"""
import argparse
import json
import os
import subprocess
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, HERE)

import row36_assemble as A                                       # noqa: E402

#: How wide a corner strip is, as a fraction of the frame. Wide enough that the
#: material reads, narrow enough that it is the SEAM being judged and not two
#: pictures placed near each other.
STRIP_FRAC = 0.16


def commit():
    try:
        return subprocess.run(["git", "rev-parse", "HEAD"], cwd=ROOT,
                              capture_output=True, text=True).stdout.strip()[:12]
    except Exception:
        return "unknown"


def load_img(p):
    return np.asarray(Image.open(p).convert("RGB"), dtype=np.uint8)


def strip_pair(right_of, left_of, out, label_gap=8):
    """The right edge of one frame butted to the left edge of the next."""
    a, b = load_img(right_of), load_img(left_of)
    w = int(round(a.shape[1] * STRIP_FRAC))
    left = a[:, -w:]
    right = b[:, :w]
    gap = np.full((a.shape[0], label_gap, 3), 32, dtype=np.uint8)
    Image.fromarray(np.concatenate([left, gap, right], axis=1)).save(out)


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--room", required=True)
    ap.add_argument("--out", default="")
    args = ap.parse_args()
    out = args.out or os.path.join(ROOT, "design", "batches", "row36-assembly",
                                   "demo-" + args.room)
    os.makedirs(out, exist_ok=True)
    facings = json.load(open(A.FACINGS))["facings"]

    # a player turning right meets N, E, S, W in that order and closes the cycle
    order = [f for f in "NESW" if "%s/%s" % (args.room, f) in facings]
    made, pairs = [], []
    for which in ("albedo", "lit"):
        for f in order:
            src = os.path.join(ROOT, "backdrops", "source-assembled",
                               "%s-%s" % (args.room, f), which + ".png")
            if not os.path.exists(src):
                continue
            dst = os.path.join(out, "%s-%s.png" % (f, which))
            Image.fromarray(load_img(src)).save(dst)
            made.append(os.path.relpath(dst, ROOT))
        for i, f in enumerate(order):
            g = order[(i + 1) % len(order)]
            a = os.path.join(ROOT, "backdrops", "source-assembled",
                             "%s-%s" % (args.room, f), which + ".png")
            b = os.path.join(ROOT, "backdrops", "source-assembled",
                             "%s-%s" % (args.room, g), which + ".png")
            if not (os.path.exists(a) and os.path.exists(b)):
                continue
            dst = os.path.join(out, "seam-%s-%s-%s.png" % (f, g, which))
            strip_pair(a, b, dst)
            pairs.append({"turn": "%s -> %s" % (f, g), "which": which,
                          "file": os.path.relpath(dst, ROOT)})

    # the same seams from the PROMOTED paintings, where the store has them
    before = []
    for i, f in enumerate(order):
        g = order[(i + 1) % len(order)]
        a = os.path.join(ROOT, "backdrops", args.room, f + ".png")
        b = os.path.join(ROOT, "backdrops", args.room, g + ".png")
        if os.path.exists(a) and os.path.exists(b):
            dst = os.path.join(out, "seam-%s-%s-promoted.png" % (f, g))
            strip_pair(a, b, dst)
            before.append({"turn": "%s -> %s" % (f, g),
                           "file": os.path.relpath(dst, ROOT)})

    cross = subprocess.run(
        ["python3", os.path.join(HERE, "row36_crossfacing.py"), "--room", args.room],
        cwd=ROOT, capture_output=True, text=True).stdout

    placeholder = any(
        json.load(open(os.path.join(A.tile_dir(m), "tile.json"))).get("placeholder")
        for m in {facings["%s/%s" % (args.room, order[0])][k]
                  for k in ("walls", "ceiling", "floor")} if m
        and os.path.exists(os.path.join(A.tile_dir(m), "tile.json")))

    readme = os.path.join(out, "README.md")
    with open(readme, "w") as fh:
        fh.write(
            "# Row 36 — %s assembled from established pieces\n\n"
            "**Rendered from commit `%s`.** The capture script is committed "
            "beside these frames (`design/plan-draft/measured/row36_batch.py`) "
            "— an artifact nobody can regenerate is not derived, it is just a "
            "file.\n\n"
            "## What to look at first\n\n"
            "The `seam-*.png` pairs. Each one is the right edge of one facing "
            "butted to the left edge of the next, which are **the same physical "
            "wall seen from two standpoints**. Either the material continues "
            "across the join or it does not, and that is the whole of the row's "
            "claim.\n\n"
            "`seam-*-promoted.png` is the same corner from the paintings the "
            "store holds today, so this is a before and after rather than an "
            "assertion.\n\n"
            "## The honest labels\n\n"
            "%s\n"
            "- These are the **assembler's own frames**, not the scene canvas "
            "as the page draws it. The §12.6 capture comes when the swatches "
            "land and the pieces are promotable.\n"
            "- `*-albedo.png` is the neutral piece as the library stores it. "
            "`*-lit.png` is the same frame under the **minimal bake-time "
            "lighting stub** — ambient plus a radial falloff per plan source. "
            "It is deliberately crude and row 37 replaces it. **Judge the "
            "architecture on the lit frames and the material on the albedo "
            "ones**; judging a neutral room for looking flat would be judging "
            "it for obeying row 37.\n\n"
            "## The turn, as arithmetic\n\n```\n%s```\n"
            % (args.room, commit(),
               ("- **V1 PLACEHOLDER ART.** The floor and ceiling tiles are "
                "drawn from each material's own tiling spec, not painted, "
                "because their swatches are dispatched and have not returned. "
                "The geometry is real; the material is not. Nothing here is "
                "promotable and the frames carry `_promotable: false`."
                if placeholder else "- All pieces are real harvested or asked "
                "material."),
               cross))
    doc = {"room": args.room, "commit": commit(), "frames": made,
           "seams": pairs, "seams_promoted": before,
           "placeholder_art": placeholder}
    with open(os.path.join(out, "batch.json"), "w") as fh:
        json.dump(doc, fh, indent=2)
        fh.write("\n")
    print("batch -> %s" % os.path.relpath(out, ROOT))
    print("  %d frames, %d assembled seams, %d promoted seams"
          % (len(made), len(pairs), len(before)))
    print("  placeholder art: %s" % placeholder)
    return 0


if __name__ == "__main__":
    sys.exit(main())
