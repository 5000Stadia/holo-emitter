#!/usr/bin/env python3
"""Row 36 — score every row-23 return on study/N, joined to its technique.

    python3 design/plan-draft/measured/row36_t4_score.py [--json OUT]

WHY THIS EXISTS AND IS NOT `measure.py --round row23`. It is the same loop over
the same candidates against the same reference, with one difference: the FULL
picks set. `main_row23` injects only `{pick_floor, module_in_bands}`, and rows
32/35 grew `measure_candidate` a promotion half that reads `picks["EYE_RANGE"]`,
so that entry point dies on `KeyError: 'EYE_RANGE'` at `row23_lib.py:598`
before it measures anything. That is why the four content-scaffold (t4) returns
dispatched on the row-23 null trigger sat painted and unscored: the path that
produced the other twenty readings had rotted and nothing was watching it.

The picks come from `row35_snap.picks()` rather than being listed again here —
one home for that dict, so a future detector added to the promotion half
reaches this caller for free instead of breaking it the same way.

IT WRITES NOTHING INTO THE STORE, moves no run-state row and promotes nothing.
`--json` is the only file it will write, and the numbers it prints are the ones
`design/specs/36-plan.md` §3.2 quotes.

THE JOIN HAPPENS AT TABLE TIME, per row 23's own discipline: the measurement
reads a candidate by its opaque id and knows nothing about which technique made
it. `assignment.json` and `assignment-2.json` are opened afterwards, here, to
label rows that have already been scored.
"""
import argparse
import collections
import json
import os
import statistics
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, HERE)

import measure                                                   # noqa: E402
import row23_lib                                                 # noqa: E402
import row35_snap                                                # noqa: E402

WALLS = ["study/N"]


def technique_map():
    """id -> (technique, variant, roll, wall), from both assignment files.

    `assignment-2.json` is a second file rather than an edit to the first
    because the first was committed before any candidate existed and its blob
    is asserted never to change; the t4 rolls live in the second.
    """
    out = {}
    for name in ("assignment.json", "assignment-2.json"):
        p = os.path.join(HERE, "row23", name)
        if not os.path.exists(p):
            continue
        for key, val in json.load(open(p)).items():
            if not isinstance(val, list):
                continue
            for rec in val:
                if isinstance(rec, dict) and rec.get("id"):
                    out[rec["id"]] = (rec.get("technique"), rec.get("variant"),
                                      rec.get("roll"), rec.get("wall"))
    return out


def score_wall(fac, picks, tech):
    side = measure.row23_sidecar(fac)
    if side is None:
        raise SystemExit("no committed scaffold for " + fac)
    ref = measure.row23_reference(fac)
    if ref is None:
        raise SystemExit("no camera reference for " + fac)
    cfg = row23_lib.cfg_from_sidecar(side)
    found = measure.row23_returns(fac)
    print("%s   %d candidate(s) on disk   reference %s"
          % (fac, len(found), ref["source"]))
    print("   %s" % ref["authority"])
    rows = []
    for rid, path in sorted(found.items()):
        r = row23_lib.measure_candidate(path, side, cfg, ref, picks)
        sc = row23_lib.score(r, side, ref)
        prom = r.get("_promotion") or {}
        car = (r.get("carriers") or [{}])[0]
        rows.append(dict(
            id=rid, facing=fac,
            candidate=os.path.relpath(path, ROOT),
            technique=(tech.get(rid) or ("UNASSIGNED",))[0],
            roll=(tech.get(rid) or (None, None, None))[2],
            verdict=r.get("verdict"),
            implied_focal_px=r.get("implied_focal_px"),
            eye_height_m=r.get("eye_height_m"),
            delta_focal_pct=r.get("delta_focal_pct"),
            delta_eye_pct=r.get("delta_eye_pct"),
            hold_family=prom.get("hold_family"),
            carrier_found=car.get("found"),
            edge_delta_px=car.get("edge_delta_px"),
            leans=(car.get("hypothesis") or {}).get("leans"),
            adherence_raw=sc.get("adherence_raw") if sc.get("indexed") else None))
    return rows


def table(rows):
    hdr = ("%-9s %-5s %-3s %-8s %-8s %-7s %-8s %-8s %-18s %-8s %-7s"
           % ("id", "tech", "rl", "verdict", "focal", "eye", "dfoc%", "deye%",
              "hold", "carrier", "leans"))
    print()
    print(hdr)
    print("-" * len(hdr))
    for r in sorted(rows, key=lambda z: (str(z["technique"]), z["roll"] or 0)):
        print("%-9s %-5s %-3s %-8s %-8s %-7s %-8s %-8s %-18s %-8s %-7s"
              % (r["id"], r["technique"], r["roll"] or "-", r["verdict"],
                 ("%.1f" % r["implied_focal_px"]) if r["implied_focal_px"] else "-",
                 ("%.3f" % r["eye_height_m"]) if r["eye_height_m"] else "-",
                 ("%+.2f" % r["delta_focal_pct"]) if r["delta_focal_pct"] is not None else "-",
                 ("%+.2f" % r["delta_eye_pct"]) if r["delta_eye_pct"] is not None else "-",
                 str(r["hold_family"]), str(r["carrier_found"]), str(r["leans"])))

    by = collections.defaultdict(list)
    for r in rows:
        by[r["technique"]].append(r)
    print()
    print("%-6s %3s %6s %6s %11s %11s"
          % ("tech", "n", "PASS", "holds", "med|dfoc|%", "med|deye|%"))
    for t, rs in sorted(by.items(), key=lambda z: str(z[0])):
        df = [abs(x["delta_focal_pct"]) for x in rs if x["delta_focal_pct"] is not None]
        de = [abs(x["delta_eye_pct"]) for x in rs if x["delta_eye_pct"] is not None]
        print("%-6s %3d %6d %6d %11s %11s"
              % (t, len(rs), sum(1 for x in rs if x["verdict"] == "PASS"),
                 sum(1 for x in rs if x["hold_family"]),
                 ("%.2f" % statistics.median(df)) if df else "-",
                 ("%.2f" % statistics.median(de)) if de else "-"))
    print()
    print("n = 4 per arm. 4-of-4 against 2-of-4 is Fisher p ~ 0.43: NO SEPARATION.")
    print("The row-23 matrix and the row-34 evolution both established that this")
    print("corpus does not separate at these sample sizes. No recipe is crowned")
    print("by these numbers; what they carry is the hold-family warning.")


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--json", default="", help="write the rows here")
    args = ap.parse_args()
    os.chdir(ROOT)
    picks = row35_snap.picks()
    tech = technique_map()
    rows = []
    for fac in WALLS:
        rows.extend(score_wall(fac, picks, tech))
    table(rows)
    if args.json:
        with open(args.json, "w") as fh:
            json.dump(rows, fh, indent=2, default=float)
            fh.write("\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
