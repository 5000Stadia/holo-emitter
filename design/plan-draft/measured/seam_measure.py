#!/usr/bin/env python3
"""The seam metric (row 38) — how continuous two abutting facings are.

    python3 design/plan-draft/measured/seam_measure.py --corpus
    python3 design/plan-draft/measured/seam_measure.py --pair entrance_approach/E entrance_approach/S
    python3 design/plan-draft/measured/seam_measure.py --left a.png --right b.png [--json]

WHAT IT MEASURES, AND WHERE
---------------------------
Turning right takes you from facing F to the facing at its right edge, and the
world that leaves the right of F's frame enters the next one from the left —
`tools/edge-seed.mjs` derives that ring from the project's own `RIGHT`/`NORMAL`
convention and the specs pin it. This file reads the two pictures either side of
one such turn and asks how visible the join is.

The two strips are the same ten per cent the seed is cut at
(`edge-seed.mjs`'s `EDGE_FRACTION`, restated as `FRACTION` below because a
Python file cannot import a JavaScript constant; `seams.spec.mjs` asserts the
two agree). Laid side by side they make one band of 2S columns with the JOINT in
the middle, and every number here is a fact about that band:

    colour_gap      mean over rows of the RGB distance across the joint,
                    0 .. 441.7. What a colourist would call the step.
    interior_step   the median of the same quantity at every OTHER
                    column boundary in the band — the painting's own
                    ordinary column-to-column variation.
    discontinuity   colour_gap / interior_step. THE HEADLINE. Dimensionless,
                    so a dark wall and a bright courtyard are comparable;
                    1.0 means the join is as quiet as the paint around it.
    tone_gap        |mean luma A − mean luma B| over the two strips, 0 .. 255.
                    A seam can be locally smooth and still put a light wall
                    beside a dark one, and that is what a turn shows.
    profile_gap     mean |row-mean luma A − row-mean luma B| down the frame:
                    the two strips disagreeing about where light sits
                    vertically — a sky bright at the top in one and flat in
                    the other.
    gradient_gap    mean |d/dy of those two profiles|: the same disagreement
                    in the RATE, which is what a horizon or a wainscot line
                    arriving at different heights actually looks like.

WHY A RATIO IS THE HEADLINE. An absolute step punishes busy paintings and
flatters flat ones. The ratio asks the only question a viewer asks — is the join
louder than the picture it sits in — and it is stable across the manor's very
different rooms. The other four are reported beside it because a ratio alone
cannot see a smooth fade from ochre to grey.

WHAT A PERFECT SCORE IS NOT. The frames do not literally touch. The ruled lens
is 24 mm on a 36 mm frame (`src/groundplane.js`), hFOV 73.74°, so a 90° turn
leaves a 16.26° wedge of world that neither picture shows. Two facings could be
painted by one hand from one vantage and still not join column to column. This
instrument is therefore COMPARATIVE — a wall's seam before seeding against the
same wall's seam after — and `CONTINUOUS_MAX` below is calibrated on planted
pairs rather than asserted from theory.

CALIBRATION, MEASURED — AND WHERE IT OVERLAPS
---------------------------------------------
Cutting one real painting down the middle and handing the halves to this file is
a planted CONTINUITY: the two "facings" are literally one picture, so the joint
is an ordinary column boundary. Over all 54 promoted paintings that reads 0.91
median, 0.34 best, 2.83 worst. Pairing two paintings from unrelated rooms is a
planted DISCONTINUITY: 54 such pairs read 2.21 at the quietest, 6.26 median,
27.1 at the loudest.

So `CONTINUOUS_MAX = 2.0` sits above the continuous median and below every
planted-discontinuous reading — and it is NOT a clean separator: three of the 54
planted-continuous splits cross it (`dining_parlour/N` 2.83, `buttery_pantry/E`
2.32, `dining_parlour/E` 2.06), every one of them a painting whose midpoint cuts
a real vertical edge. A door jamb at the split looks exactly like a seam to this
instrument, and pretending otherwise with a friendlier threshold would only move
the lie. The flag is a reading aid; the ROW's acceptance is comparative — one
wall's seam before seeding against the same wall's after — and that comparison
does not depend on the constant at all.

`seams.spec.mjs` re-runs both plants, synthetic and real, so these numbers stay
measurements rather than memories.
"""
import argparse
import json
import os
import sys

import numpy as np
from PIL import Image

from measure_lib import luma

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", ".."))

#: Kabe's ten per cent. `tools/edge-seed.mjs` holds the emitter's copy and
#: `seams.spec.mjs` asserts the two are the same number.
FRACTION = 0.10

#: A joint no louder than twice the surrounding paint reads as continuous. See
#: CALIBRATION above; this is measured, not chosen.
CONTINUOUS_MAX = 2.0

#: The compass ring, right-turning: the picture at F's right edge is NEXT[F]'s,
#: and it meets it at ITS left edge. Derived in `tools/edge-seed.mjs` from
#: `RIGHT`/`NORMAL`; `seams.spec.mjs` asserts this copy agrees with that
#: derivation, because a Python file cannot import the JavaScript one.
NEXT = {"N": "E", "E": "S", "S": "W", "W": "N"}


def load(path):
    """Any size, RGB float. `measure_lib.load` pins 1536x1024; a seed strip and
    a planted fixture are neither, and this file must read both."""
    return np.asarray(Image.open(path).convert("RGB")).astype(np.float64)


def seam(a, b, fraction=FRACTION):
    """One seam, from the LEFT picture `a` and the RIGHT picture `b`.

    `a`'s right edge abuts `b`'s left edge — the caller has already applied the
    adjacency table; this function does not know about compass points.
    """
    if a.shape[0] != b.shape[0]:
        raise SystemExit("seam_measure: the two frames are %d and %d rows high; a seam between "
                         "frames of different heights is not a seam" % (a.shape[0], b.shape[0]))
    s = int(min(a.shape[1], b.shape[1]) * fraction + 0.5)
    if s < 2:
        raise SystemExit("seam_measure: %g of these frames is %d column(s)" % (fraction, s))
    A, B = a[:, -s:, :], b[:, :s, :]
    band = np.concatenate([A, B], axis=1)
    # Column-to-column RGB distance, averaged down the frame. Index i is the
    # boundary between band columns i and i+1, so the joint is at s-1.
    step = np.linalg.norm(np.diff(band, axis=1), axis=2).mean(axis=0)
    joint = float(step[s - 1])
    interior = float(np.median(np.delete(step, s - 1)))
    LA, LB = luma(A), luma(B)
    pA, pB = LA.mean(axis=1), LB.mean(axis=1)
    return {
        "strip_px": s,
        "rows": int(a.shape[0]),
        "colour_gap": round(joint, 3),
        "interior_step": round(interior, 3),
        "discontinuity": round(joint / max(interior, 1e-6), 3),
        "tone_gap": round(float(abs(LA.mean() - LB.mean())), 3),
        "profile_gap": round(float(np.abs(pA - pB).mean()), 3),
        "gradient_gap": round(float(np.abs(np.gradient(pA) - np.gradient(pB)).mean()), 3),
        "continuous": bool(joint / max(interior, 1e-6) <= CONTINUOUS_MAX),
    }


def seam_files(left, right, fraction=FRACTION):
    out = seam(load(left), load(right), fraction)
    out["left"] = os.path.relpath(left, REPO)
    out["right"] = os.path.relpath(right, REPO)
    return out


# ---------------------------------------------------------------- the corpus

def painting(key):
    loc, f = key.split("/")
    return os.path.join(REPO, "backdrops", loc, f + ".png")


def promoted(key):
    loc, f = key.split("/")
    d = os.path.join(REPO, "backdrops", loc)
    return os.path.exists(os.path.join(d, f + ".png")) and \
        os.path.exists(os.path.join(d, f + ".meta.json"))


def corpus_pairs(plan):
    """Every adjacent pair of PROMOTED facings in the manor, with its class.

    A pair is (F, NEXT[F]) of one room: F's right edge against its neighbour's
    left. `outdoor` is the LOCATION's — `room.type == "open"` is exactly the set
    `tools/room-voices.mjs` gives an outdoor voice to, which is the row's "open
    locations, no wall corners to break seams".
    """
    out = []
    for room in plan["rooms"]:
        for f in ("N", "E", "S", "W"):
            g = NEXT[f]
            if f not in room["facings"] or g not in room["facings"]:
                continue
            a, b = "%s/%s" % (room["id"], f), "%s/%s" % (room["id"], g)
            if not (promoted(a) and promoted(b)):
                continue
            out.append({"left": a, "right": b, "room": room["id"],
                        "outdoor": room["type"] == "open"})
    return out


def measure_corpus(plan, fraction=FRACTION):
    rows = []
    for p in corpus_pairs(plan):
        m = seam(load(painting(p["left"])), load(painting(p["right"])), fraction)
        m.update(p)
        rows.append(m)
    return rows


def summarise(rows):
    """Median and worst discontinuity, indoor and outdoor — the before-numbers."""
    out = {}
    for name, want in (("outdoor", True), ("indoor", False)):
        got = [r for r in rows if r["outdoor"] is want]
        if not got:
            out[name] = {"pairs": 0}
            continue
        d = sorted(r["discontinuity"] for r in got)
        t = sorted(r["tone_gap"] for r in got)
        worst = max(got, key=lambda r: r["discontinuity"])
        out[name] = {
            "pairs": len(got),
            "median_discontinuity": round(float(np.median(d)), 3),
            "worst_discontinuity": round(d[-1], 3),
            "worst_pair": "%s | %s" % (worst["left"], worst["right"]),
            "median_tone_gap": round(float(np.median(t)), 3),
            "worst_tone_gap": round(t[-1], 3),
            "continuous": sum(1 for r in got if r["continuous"]),
        }
    return out


def main(argv):
    ap = argparse.ArgumentParser(description="the seam metric (row 38)")
    ap.add_argument("--corpus", action="store_true",
                    help="every adjacent promoted pair in the manor")
    ap.add_argument("--pair", nargs=2, metavar=("LEFT", "RIGHT"),
                    help="two facing keys, e.g. entrance_approach/E entrance_approach/S")
    ap.add_argument("--left")
    ap.add_argument("--right")
    ap.add_argument("--fraction", type=float, default=FRACTION)
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args(argv[1:])

    if a.left or a.right:
        if not (a.left and a.right):
            raise SystemExit("seam_measure: --left needs --right")
        m = seam_files(a.left, a.right, a.fraction)
        print(json.dumps(m) if a.json else _one(m))
        return 0
    if a.pair:
        for k in a.pair:
            if not promoted(k):
                raise SystemExit("seam_measure: %s is not promoted — there is no painting to "
                                 "measure a seam against" % k)
        if NEXT[a.pair[0].split("/")[1]] != a.pair[1].split("/")[1]:
            raise SystemExit(
                "seam_measure: %s's right edge does not abut %s. Turning right from %s reaches "
                "%s; a seam between two facings that do not meet is not a measurement."
                % (a.pair[0], a.pair[1], a.pair[0], NEXT[a.pair[0].split("/")[1]]))
        m = seam(load(painting(a.pair[0])), load(painting(a.pair[1])), a.fraction)
        m["left"], m["right"] = a.pair
        print(json.dumps(m) if a.json else _one(m))
        return 0
    if a.corpus:
        plan = json.load(open(os.path.join(REPO, "fixtures", "demo-study", "plan.json"),
                              encoding="utf-8"))
        rows = measure_corpus(plan, a.fraction)
        s = summarise(rows)
        if a.json:
            print(json.dumps({"pairs": rows, "summary": s}))
            return 0
        print("%-22s %-22s %-8s %8s %8s %8s %8s"
              % ("left", "right", "place", "discont", "colour", "tone", "profile"))
        for r in sorted(rows, key=lambda r: -r["discontinuity"]):
            print("%-22s %-22s %-8s %8.2f %8.1f %8.2f %8.2f"
                  % (r["left"], r["right"], "outdoor" if r["outdoor"] else "indoor",
                     r["discontinuity"], r["colour_gap"], r["tone_gap"], r["profile_gap"]))
        print()
        for name in ("outdoor", "indoor"):
            v = s[name]
            if not v["pairs"]:
                print("%-8s no adjacent promoted pair" % name)
                continue
            print("%-8s %d pair(s): discontinuity median %.2f, worst %.2f (%s); "
                  "tone median %.2f, worst %.2f; %d of %d read continuous at <= %.1f"
                  % (name, v["pairs"], v["median_discontinuity"], v["worst_discontinuity"],
                     v["worst_pair"], v["median_tone_gap"], v["worst_tone_gap"],
                     v["continuous"], v["pairs"], CONTINUOUS_MAX))
        return 0
    ap.print_help()
    return 2


def _one(m):
    return ("%s | %s   discontinuity %.2f (colour %.1f over interior %.1f), tone %.2f, "
            "profile %.2f, gradient %.3f — %s"
            % (m.get("left", "A"), m.get("right", "B"), m["discontinuity"], m["colour_gap"],
               m["interior_step"], m["tone_gap"], m["profile_gap"], m["gradient_gap"],
               "continuous" if m["continuous"] else "a visible join"))


if __name__ == "__main__":
    sys.exit(main(sys.argv))
