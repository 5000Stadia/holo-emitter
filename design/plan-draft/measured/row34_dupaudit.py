#!/usr/bin/env python3
"""Row 34 — the duplication audit. Are two rolls of one cell two samples or one?

    python3 design/plan-draft/measured/row34_dupaudit.py
    python3 design/plan-draft/measured/row34_dupaudit.py --generation 2 --json OUT

WHY THIS DECIDES EVERYTHING UPSTREAM OF IT. The community finding is that the
imagegen path returns IDENTICAL images for identical prompts inside one session.
Every cell of this row is one prompt rolled twice in one seat session. If the
finding holds for our seat then the two rolls of a cell are one sample wearing
two ids, the per-arm n is 2 (the two WALLS, whose prompts genuinely differ) and
not 4, and every Fisher/Holm number generations 1 and 2 produced was computed
against a denominator that does not exist.

At n=2 a side the best conceivable result is 2 of 2 against 0 of 2, whose exact
one-sided p is 1/6 = 0.167 — which clears no correction at any alpha this row
uses. So a positive finding here does not weaken the statistics, it VOIDS them,
and that is worth measuring properly rather than assuming either way.

WHAT IS MEASURED, and the two are not the same question:

  byte-identical      the same file. Conclusive, and the strong form of the
                      claim.
  perceptually near   the share of pixels within a small tolerance, and the
                      mean absolute difference. A re-encode or a resample can
                      move every byte while moving no pixel a viewer could
                      find, so bytes alone would under-report duplication.

A CELL IS (arm, wall) AND THE PAIRING COMES OUT OF THE ID MAP, never out of a
filename — the filenames are opaque precisely so that nothing downstream can
pair them by eye.
"""
import argparse
import hashlib
import itertools
import json
import os
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, HERE)

from measure_lib import load  # noqa: E402

BATCH = os.path.join(ROOT, "design", "batches", "row34-evolution")

#: Two pixels count as "the same" within this many levels per channel. 2/255 is
#: below what a viewer resolves and well below any real content difference; it
#: exists so a lossless re-encode does not read as a fresh generation.
TOL = 2
#: The share of same-pixels at or above which a pair is called perceptually
#: near-duplicate. Stated here rather than chosen per result.
NEAR = 0.99


def sha(path):
    with open(path, "rb") as fh:
        return hashlib.sha256(fh.read()).hexdigest()


def compare(a, b):
    ia, ib = load(a), load(b)
    if ia.shape != ib.shape:
        return {"same_shape": False, "shape_a": list(ia.shape), "shape_b": list(ib.shape)}
    d = np.abs(ia.astype(np.int16) - ib.astype(np.int16))
    same = float((d.max(axis=2) <= TOL).mean())
    return {
        "same_shape": True,
        "share_pixels_same": round(same, 6),
        "mean_abs_diff": round(float(d.mean()), 4),
        "max_abs_diff": int(d.max()),
        "near_duplicate": same >= NEAR,
    }


def audit(generation, batch=BATCH):
    name = "assignment.json" if generation == 1 else "assignment-gen%d.json" % generation
    p = os.path.join(batch, name)
    if not os.path.exists(p):
        return {"generation": generation, "error": "no id map at " + p[len(ROOT) + 1:]}
    assign = json.load(open(p))
    cells = {}
    for r in assign["rolls"]:
        if r["generation"] != generation:
            continue
        cells.setdefault((r["arm"], r["wall"]), []).append(r)

    out, missing = [], []
    for (arm, wall), rolls in sorted(cells.items()):
        rolls.sort(key=lambda r: r["roll"])
        paths = []
        for r in rolls:
            f = os.path.join(ROOT, r["candidate"])
            (paths.append((r, f)) if os.path.exists(f) else missing.append(r["id"]))
        if len(paths) < 2:
            continue
        for (ra, fa), (rb, fb) in itertools.combinations(paths, 2):
            ha, hb = sha(fa), sha(fb)
            rec = {"arm": arm, "wall": wall,
                   "rolls": [ra["roll"], rb["roll"]], "ids": [ra["id"], rb["id"]],
                   "byte_identical": ha == hb, "sha_a": ha[:12], "sha_b": hb[:12]}
            rec.update(compare(fa, fb))
            out.append(rec)

    # THE CONTROL COMPARISON, and without it a "99 % same" number means nothing.
    # Two frames from DIFFERENT cells of the same wall are the natural floor:
    # they share a wall, a camera and a style seed and differ in the one thing
    # the row varies. If within-cell pairs look like between-cell pairs, nothing
    # is duplicated; if within-cell pairs are far tighter, that gap IS the
    # finding.
    between = []
    by_wall = {}
    for (arm, wall), rolls in cells.items():
        f = os.path.join(ROOT, rolls[0]["candidate"])
        if os.path.exists(f):
            by_wall.setdefault(wall, []).append((arm, f))
    for wall, items in by_wall.items():
        for (aa, fa), (ab, fb) in itertools.combinations(sorted(items), 2):
            c = compare(fa, fb)
            c.update({"wall": wall, "arms": [aa, ab], "byte_identical": sha(fa) == sha(fb)})
            between.append(c)

    within_near = [r for r in out if r.get("near_duplicate")]
    within_bytes = [r for r in out if r["byte_identical"]]
    shares_w = [r["share_pixels_same"] for r in out if "share_pixels_same" in r]
    shares_b = [r["share_pixels_same"] for r in between if "share_pixels_same" in r]
    return {
        "_what_this_is": "Are the two rolls of a cell two samples or one? See the module docstring.",
        "_tolerance_per_channel": TOL, "_near_duplicate_threshold": NEAR,
        "generation": generation,
        "pairs_within_cell": len(out),
        "byte_identical": len(within_bytes),
        "near_duplicate": len(within_near),
        "within_share_min": (round(min(shares_w), 6) if shares_w else None),
        "within_share_median": (round(float(np.median(shares_w)), 6) if shares_w else None),
        "within_share_max": (round(max(shares_w), 6) if shares_w else None),
        "between_cell_pairs": len(between),
        "between_share_median": (round(float(np.median(shares_b)), 6) if shares_b else None),
        "between_share_max": (round(max(shares_b), 6) if shares_b else None),
        "between_byte_identical": sum(1 for r in between if r["byte_identical"]),
        "candidates_missing": missing,
        "verdict": _verdict(out, between),
        "within_cell": out,
        "between_cell": between,
    }


def _verdict(within, between):
    if not within:
        return "NO PAIRS ON DISK - nothing to audit yet"
    nb = sum(1 for r in within if r["byte_identical"])
    nn = sum(1 for r in within if r.get("near_duplicate"))
    n = len(within)
    if nb == n:
        return ("DUPLICATED: every within-cell pair is byte-identical. n per arm is the number "
                "of WALLS, not walls x rolls, and every statistic computed on the larger "
                "denominator is void.")
    if nn == n:
        return ("NEAR-DUPLICATED: every within-cell pair is perceptually identical though not "
                "byte-identical. Same consequence for n as the byte case.")
    if nn == 0:
        return ("INDEPENDENT: no within-cell pair is a near-duplicate. The rolls are genuine "
                "repeats and the declared n stands.")
    return ("MIXED: %d of %d within-cell pairs are near-duplicates. n is not uniform across "
            "cells, and the honest denominator is per-cell rather than declared." % (nn, n))


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--generation", type=int, default=1)
    ap.add_argument("--all", action="store_true", help="every generation with an id map")
    ap.add_argument("--batch", default=BATCH)
    ap.add_argument("--json", default=None)
    a = ap.parse_args(argv)
    gens = [1, 2, 3] if a.all else [a.generation]
    docs = []
    for g in gens:
        d = audit(g, a.batch)
        if d.get("error") and a.all:
            continue
        docs.append(d)
        print("generation %d: %d within-cell pairs | byte-identical %s | near-duplicate %s"
              % (g, d.get("pairs_within_cell", 0), d.get("byte_identical"),
                 d.get("near_duplicate")))
        if d.get("within_share_median") is not None:
            print("   within-cell  share-same  min %.4f  median %.4f  max %.4f"
                  % (d["within_share_min"], d["within_share_median"], d["within_share_max"]))
            print("   between-cell share-same  median %.4f  max %.4f  (the floor: same wall, "
                  "same seed, different arm)"
                  % (d["between_share_median"], d["between_share_max"]))
        print("   VERDICT: " + d["verdict"])
        if d.get("candidates_missing"):
            print("   not yet returned: %d" % len(d["candidates_missing"]))
    if a.json:
        with open(a.json, "w") as fh:
            json.dump(docs if a.all else docs[0], fh, indent=2)
            fh.write("\n")
        print("written to " + a.json)
    return 0


if __name__ == "__main__":
    sys.exit(main())
