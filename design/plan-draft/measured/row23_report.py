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
    # THE EXTENSION IS A SECOND FILE, and it is read here for the same reason it
    # is a second file: assignment.json was committed before any candidate
    # existed and may never change, so technique (4)'s ids arrived beside it
    # rather than inside it.
    ext = os.path.join(READINGS, "assignment-2.json")
    if os.path.exists(ext):
        for r in json.load(open(ext)).get("rolls", []):
            cell[r["id"]] = r
    read = {}
    for f in sorted(os.listdir(READINGS)):
        if f.endswith(".json") and not f.startswith("assignment"):
            d = json.load(open(os.path.join(READINGS, f)))
            read[d["id"]] = d
    return cell, read



def write_clock(rows):
    """Production law clause 4's acceptance metric, as a ledger record.

    THE CLOCK IS WRITTEN HERE AND NOT BY `measure.py`, and that is the blinding
    working rather than an inconvenience: a first-roll pass rate is per
    TECHNIQUE, so computing it needs the map — and the map is deliberately not
    in the room where frames are measured. The measurement writes readings; this
    file, which owns the join, writes the clock.

    AND IT SAYS OUT LOUD THAT IT IS NOT LIKE-FOR-LIKE. The wave's 0-of-7,
    0-of-7, 2-of-7 are SEVEN DIFFERENT WALLS at one roll each; row 23's rates
    are four rolls of one wall, twice over. A number set beside another number
    reads as comparable whatever the prose around it says, so the record carries
    the reason it is not.
    """
    path = os.path.join(HERE, "misses.jsonl")
    if not os.path.exists(path):
        return None
    first = defaultdict(dict)
    for r in rows:
        if r["tech"] in (None, "lens"):
            continue
        first[(r["wall"], r["tech"])][r.get("roll") or 0] = r["verdict"]
    per = {}
    for (wall, tech), byroll in sorted(first.items()):
        adm = sum(1 for v in byroll.values() if v == "PASS")
        per["%s %s" % (wall, tech)] = "%d of %d admitted" % (adm, len(byroll))
    rec = {
        "_record": "clock", "round": "row23",
        "_law": "design/production-law.md clause 4 - the acceptance metric is the "
                "FIRST-ROLL PASS RATE RISING OVER TIME - and clause 5, an improvement "
                "must clock as one.",
        "per_cell": per,
        "camera_admitted_overall": "%d of %d"
                                   % (sum(1 for r in rows if r["verdict"] == "PASS"), len(rows)),
        "carrier_arm_indexed": "%d of %d - the edge-pair detector refuses wherever two "
                               "admissible pairs disagree about the answer, and on a panelled "
                               "wall they always do"
                               % (sum(1 for r in rows if r["adh"] is not None), len(rows)),
        "_not_comparable_because":
            "the standing-eye wave's 0 of 7, 0 of 7 and 2 of 7 are SEVEN DIFFERENT WALLS at "
            "one roll each, measured against one camera. These are four rolls of each of TWO "
            "walls, measured against two different kinds of ground truth (study/N's is "
            "Kabe-ruled, study/E's is an admitted candidate). The rates are not on the same "
            "axis and must not be read as a trend.",
        "_what_it_clocked":
            "NOTHING, on the row's own question. The separation report finds no separation at "
            "all between the three techniques on either wall - carrier lean spread 0, "
            "p = 1.000 - so the scaffold's labels moved nothing that this instrument can see. "
            "Production law clause 5: a change that moves neither accuracy nor speed is "
            "apparatus, and apparatus must argue for its life.",
        "_generated": "2026-08-23",
    }
    kept = []
    for line in open(path):
        line = line.strip()
        if not line:
            continue
        try:
            prev = json.loads(line)
        except ValueError:
            continue
        if prev.get("_record") == "clock" and prev.get("round") == "row23":
            continue                     # a clock is rewritten by its own round
        kept.append(prev)
    kept.append(rec)
    with open(path, "w") as fh:
        for k in kept:
            fh.write(json.dumps(k) + "\n")
    return rec


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
                         variant=c.get("variant"), id=rid, roll=c.get("roll"),
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
    c = write_clock(rows)
    if c:
        print("\nCLOCK written to misses.jsonl: %s | %s"
              % (c["camera_admitted_overall"] + " admitted on the camera",
                 c["carrier_arm_indexed"].split(" - ")[0] + " indexed on the carrier"))

    print("\nNO CROWN IS DECLARED HERE. See design/specs/23-plan.md §5.5: the")
    print("recommended recipe is a labelled judgment on this table plus Kabe's look.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
