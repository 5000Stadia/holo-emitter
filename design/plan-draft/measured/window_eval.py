#!/usr/bin/env python3
"""Row 42+ — the window detector, scored against the HUMAN label.

    python3 design/plan-draft/measured/window_eval.py            # the table
    python3 design/plan-draft/measured/window_eval.py --save a.json
    python3 design/plan-draft/measured/window_eval.py --compare a.json

WHY THIS IS NOT `window_calibration.json`. The calibration compares the PLAN to
the reading, and the project explicitly lets the painting disagree with the
plan: a wall whose window the painter slid a metre along it is a content fact,
not a detector error. So the calibration's 0.635 m median conflates a missed
window, a mis-paired one and a correctly-read one the painter moved. This file
compares the READING to what a human saw in the same picture — the labels in
`window_labels.json` — so every number here is a fact about the DETECTOR.

WHAT IS COUNTED.

    paired            a detection whose centre is within 0.35 m of a labelled
                      window's centre, under an ORDER-PRESERVING assignment:
                      windows keep their order along a wall, so the pairing is
                      the cheapest increasing run and not a nearest-centre walk
                      that can cross two windows over each other
    false positive    a detection that pairs with nothing — glass reported on a
                      wall or a place that has none
    false negative    a labelled window that pairs with nothing — a window a
                      human plainly saw and the detector did not report
    centre error      the median |detected centre - labelled centre| over the
                      pairs, in metres, because metres is the unit a sprite is
                      placed in

0.35 m IS THE GATE because it is half the narrowest light this store paints and
about a fifth of a whole window: a pairing looser than that would call a
detection on the next window along a hit.
"""
import argparse
import json
import os
import statistics
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, HERE)

import window_measure as W  # noqa: E402

LABELS = os.path.join(HERE, "window_labels.json")

#: Half the narrowest light this store paints. See the module docstring.
PAIR_GATE_M = 0.35

#: The walls the audit memo names as plainly painted and plainly missed. The
#: acceptance is stated on THESE by name so a change that improves the medians
#: while still losing them cannot read as a pass.
KNOWN_MISSES = ["servants_hall/E", "servants_hall/E@row23-ce4ea35f",
                "back_office/E", "noodle_bar/S"]


def assign(lab_c, det_c, gate):
    """Order-preserving pairing of labelled centres to detected centres.

    Both lists are sorted left to right. Dynamic programming over
    (label, detection), each step either pairing the two heads (allowed only
    within `gate`) or skipping one side; the cost of a pairing is the centre
    distance and a skip costs the gate, so a pair is always preferred to a pair
    of skips when it is inside the gate.
    """
    n, k = len(lab_c), len(det_c)
    INF = float("inf")
    cost = [[INF] * (k + 1) for _ in range(n + 1)]
    back = [[None] * (k + 1) for _ in range(n + 1)]
    cost[0][0] = 0.0
    for i in range(n + 1):
        for j in range(k + 1):
            if cost[i][j] == INF:
                continue
            if i < n and j < k:
                d = abs(lab_c[i] - det_c[j])
                if d <= gate and cost[i][j] + d < cost[i + 1][j + 1]:
                    cost[i + 1][j + 1] = cost[i][j] + d
                    back[i + 1][j + 1] = ("pair", i, j)
            if i < n and cost[i][j] + gate < cost[i + 1][j]:
                cost[i + 1][j] = cost[i][j] + gate
                back[i + 1][j] = ("miss", i, j)
            if j < k and cost[i][j] + gate < cost[i][j + 1]:
                cost[i][j + 1] = cost[i][j] + gate
                back[i][j + 1] = ("extra", i, j)
    pairs, i, j = [], n, k
    while (i, j) != (0, 0):
        kind, pi, pj = back[i][j]
        if kind == "pair":
            pairs.append((pi, pj))
        i, j = pi, pj
    return list(reversed(pairs))


def evaluate(labels_path=LABELS, only=None):
    doc = json.load(open(labels_path))
    walls, errs = [], []
    tp = fp = fn = 0
    exact = 0
    for w in doc["walls"]:
        if only and w["key"] not in only:
            continue
        png = os.path.join(ROOT, w["image"])
        ppm = w["px_per_m_at_wall"]
        found, note = W.measure_windows(png, w["corner_x0_px"], w["corner_x1_px"],
                                        w["floor_line_y_px"], ppm)
        lab = sorted(((r["x0"] + r["x1"]) / 2.0 / ppm) for r in w["windows"])
        det = sorted((c["centre_px"] / ppm) for c in found)
        pairs = assign(lab, det, PAIR_GATE_M)
        e = [abs(lab[a] - det[b]) for a, b in pairs]
        tp += len(pairs)
        fp += len(det) - len(pairs)
        fn += len(lab) - len(pairs)
        exact += 1 if len(det) == len(lab) else 0
        errs.extend(e)
        walls.append({"key": w["key"], "labelled": len(lab), "detected": len(det),
                      "paired": len(pairs), "false_pos": len(det) - len(pairs),
                      "false_neg": len(lab) - len(pairs),
                      "errors_m": [round(x, 3) for x in e]})
    return {
        "walls": len(walls),
        "labelled_windows": sum(x["labelled"] for x in walls),
        "detections": sum(x["detected"] for x in walls),
        "paired": tp, "false_positives": fp, "false_negatives": fn,
        "median_centre_error_m": round(statistics.median(errs), 3) if errs else None,
        "p95_centre_error_m": (round(sorted(errs)[int(0.95 * (len(errs) - 1))], 3)
                               if errs else None),
        "walls_exact_count": exact,
        "known_misses_found": {k: next((x["paired"] for x in walls if x["key"] == k), None)
                               for k in KNOWN_MISSES},
        "per_wall": walls,
    }


def _line(name, a, b=None):
    if b is None:
        return "  %-26s %s" % (name, a)
    return "  %-26s %-14s %-14s" % (name, a, b)


def report(cur, prev=None):
    rows = ["walls", "labelled_windows", "detections", "paired",
            "false_positives", "false_negatives", "median_centre_error_m",
            "p95_centre_error_m", "walls_exact_count"]
    out = []
    if prev:
        out.append(_line("", "before", "after"))
        for r in rows:
            out.append(_line(r, prev.get(r), cur.get(r)))
        out.append("")
        out.append("  the walls the memo names (paired windows):")
        for k in KNOWN_MISSES:
            out.append(_line("    " + k, prev["known_misses_found"].get(k),
                             cur["known_misses_found"].get(k)))
    else:
        for r in rows:
            out.append(_line(r, cur.get(r)))
        out.append("")
        out.append("  the walls the memo names (paired windows):")
        for k in KNOWN_MISSES:
            out.append(_line("    " + k, cur["known_misses_found"].get(k)))
    miss = [w for w in cur["per_wall"] if w["false_neg"]]
    extra = [w for w in cur["per_wall"] if w["false_pos"]]
    out.append("")
    out.append("  false negatives on: " + (", ".join(
        "%s x%d" % (w["key"], w["false_neg"]) for w in miss) or "none"))
    out.append("  false positives on: " + (", ".join(
        "%s x%d" % (w["key"], w["false_pos"]) for w in extra) or "none"))
    return "\n".join(out)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--labels", default=LABELS)
    ap.add_argument("--save")
    ap.add_argument("--compare")
    ap.add_argument("--only", nargs="*")
    a = ap.parse_args()
    cur = evaluate(a.labels, set(a.only) if a.only else None)
    prev = json.load(open(a.compare)) if a.compare else None
    print(report(cur, prev))
    if a.save:
        with open(a.save, "w") as fh:
            json.dump(cur, fh, indent=1)
            fh.write("\n")
