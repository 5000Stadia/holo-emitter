#!/usr/bin/env python3
"""Row 23 — the table, and the separation report.

    python3 design/plan-draft/measured/row23_report.py

THE JOIN HAPPENS HERE AND NOWHERE ELSE. `measure.py --round row23` reads frames
by their opaque id and never opens `assignment.json`; this file opens both and
puts them together. That is the whole of the blinding: the measurement cannot
know which technique it is reading, because the map is not in the room.

THERE IS NO CROWN CLAUSE, and its absence is the row's central finding rather
than an omission. `design/specs/23-plan.md` §5.5 carries the arithmetic: the
gate's PASS is a pure CAMERA verdict and every cell of the matrix asked for the
same camera, so no rule built on admitted counts can see the manipulation this
row varies. What this file prints is numbers and their null probabilities; the
recommended recipe is a judgment made in the open, by a person, with its basis
named.

THE HEADLINE IS THE CARRIER LEAN, not the camera. Two hypotheses, both declared
before any candidate existed — the edges the scaffold asked for, and the edges
the unlabelled ask already produced on that wall. Which one a painting put its
edges at is the thing a label can move, and it is countable.
"""
import json
import os
import sys
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, HERE)
import row23_lib                                                    # noqa: E402

READINGS = os.path.join(HERE, "row23")
ASSIGN = os.path.join(READINGS, "assignment.json")


def load():
    if not os.path.exists(ASSIGN):
        print("row23: no assignment.json - nothing has been dispatched")
        return None, None
    a = json.load(open(ASSIGN))
    cell = {}
    for r in a["rolls"]:
        cell[r["id"]] = r
    for r in a["lens"]:
        cell[r["id"]] = dict(r, technique="lens")
    read = {}
    for f in sorted(os.listdir(READINGS)):
        if f.endswith(".json") and f != "assignment.json":
            d = json.load(open(os.path.join(READINGS, f)))
            read[d["id"]] = d
    return cell, read


def main():
    cell, read = load()
    if cell is None:
        return 1
    print("ROW 23 - THE TECHNIQUE MATRIX")
    print("Readings are joined to techniques HERE, after measurement. The "
          "measurement never saw the map.\n")

    missing = [i for i in cell if i not in read]
    print("%d of %d dispatched rolls have returned and measured."
          % (len(read), len(cell)))
    if missing:
        print("still out: %s\n" % ", ".join(sorted(missing)[:12]))
    if not read:
        print("\nNothing to tabulate yet.")
        return 0

    hdr = ("%-9s %-4s %-3s %-8s %8s %8s %8s  %-8s %8s  %-9s %s"
           % ("wall", "tech", "var", "id", "focal", "dfocal", "deye",
              "carrier", "lean", "adh_raw", "verdict"))
    print(hdr)
    print("-" * len(hdr))
    rows = []
    for rid, d in sorted(read.items(), key=lambda kv: (cell.get(kv[0], {}).get("wall", ""),
                                                       cell.get(kv[0], {}).get("technique", ""),
                                                       cell.get(kv[0], {}).get("roll", 0))):
        c = cell.get(rid, {})
        sc = d.get("score") or {}
        car = d.get("carriers") or [{}]
        h = (car[0] or {}).get("hypothesis") or {}
        rows.append(dict(wall=c.get("wall"), tech=c.get("technique"),
                         variant=c.get("variant"), id=rid,
                         verdict=d.get("verdict"),
                         lean=h.get("leans"), margin=h.get("log_margin"),
                         adh=sc.get("adherence_raw") if sc.get("indexed") else None,
                         edge=(car[0] or {}).get("edge_delta_px")))
        print("%-9s %-4s %-3s %-8s %8s %8s %8s  %-8s %8s  %-9s %s"
              % (c.get("wall", "?"), c.get("technique", "?"), c.get("variant") or "-",
                 rid, d.get("implied_focal_px") or "-",
                 ("%+.1f%%" % d["delta_focal_pct"]) if d.get("delta_focal_pct") is not None else "-",
                 ("%+.1f%%" % d["delta_eye_pct"]) if d.get("delta_eye_pct") is not None else "-",
                 ("%.0f px" % (car[0] or {}).get("edge_delta_px")
                  if (car[0] or {}).get("found") else "unread"),
                 ("%+.2f" % h["log_margin"]) if h.get("log_margin") is not None else "-",
                 ("%.3f" % rows[-1]["adh"]) if rows[-1]["adh"] is not None else "no index",
                 d.get("verdict")))

    # ---------------------------------------------------------------- summary
    print("\nPER TECHNIQUE, PER WALL")
    by = defaultdict(list)
    for r in rows:
        by[(r["wall"], r["tech"])].append(r)
    for (wall, tech), rs in sorted(by.items()):
        adm = [r for r in rs if r["verdict"] == "PASS"]
        idx = [r["adh"] for r in rs if r["adh"] is not None]
        leans = defaultdict(int)
        for r in rs:
            leans[r["lean"] or "unread"] += 1
        med = sorted(idx)[len(idx) // 2] if idx else None
        print("  %-9s %-4s  admitted %d of %d | indexed %d | median adh %s | "
              "lean ask %d, reflex %d, neither %d"
              % (wall, tech, len(adm), len(rs), len(idx),
                 ("%.3f" % med) if med is not None else "-",
                 leans["ask"], leans["reflex"], leans["neither"] + leans["unread"]))

    # ------------------------------------------------------- separation report
    print("\nSEPARATION REPORT")
    for wall in sorted({r["wall"] for r in rows if r["wall"]}):
        ts = sorted({r["tech"] for r in rows if r["wall"] == wall and r["tech"] != "lens"})
        counts = [len([r for r in rows if r["wall"] == wall and r["tech"] == t
                       and r["verdict"] == "PASS"]) for t in ts]
        n = max((len([r for r in rows if r["wall"] == wall and r["tech"] == t])
                 for t in ts), default=0)
        if not counts or n == 0:
            continue
        rep = row23_lib.separation_probability(counts, n)
        print("  %s camera admissions %s over %s at n=%d: spread %d, "
              "P(at least this extreme | all identical) = %.3f"
              % (wall, counts, ts, n, rep["observed_spread"],
                 rep["p_at_least_this_extreme"]))
        askc = [len([r for r in rows if r["wall"] == wall and r["tech"] == t
                     and r["lean"] == "ask"]) for t in ts]
        rep2 = row23_lib.separation_probability(askc, n)
        print("  %s CARRIER LEAN toward the ask %s over %s: spread %d, "
              "P(at least this extreme | all identical) = %.3f   <- the headline"
              % (wall, askc, ts, rep2["observed_spread"],
                 rep2["p_at_least_this_extreme"]))
    print("\n  The camera separation is evidence about CAMERA BEHAVIOUR, not about")
    print("  labels: every cell asked for the same camera. The carrier lean is the")
    print("  one the labels move, and study/E is the wall where the ask and the")
    print("  reflex are opposite acts rather than nearly the same one.")
    print("\nNO CROWN IS DECLARED HERE. See design/specs/23-plan.md §5.5: the")
    print("recommended recipe is a labelled judgment on this table plus Kabe's look.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
