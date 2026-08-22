#!/usr/bin/env python3
"""The acceptance gate for a regenerated backdrop, row 20.

A candidate is admitted when the camera it was PAINTED at is the camera the
project projects at. The measurable form of that is the implied focal length —
`px_per_m_at_wall x the standpoint distance the plan draws` — against the ruled
1024 px.

THE BAND IS +/-3% OF 1010 px, and both halves of that come from evidence rather
than from taste. 1010 px is what the ONE approved painting measures: study/N,
cand-2, the frame Kabe's probe loop blessed, at its own drawn standpoint of
4.35 m. Its 1.4% distance from the ruled 1024 px is measurement error, not
disagreement -- so the approved picture and the pinned lens ARE the same camera,
and the gate asks a new candidate to be as close to the approved one as the
measurement can tell them apart. +/-3% is twice that residual.

The corpus conforms to the law; the law is never moved to admit the corpus.
Ruled by the Navigator, 2026-08-21, after the first measurement of all eight
found focal lengths from 498 px to 1010 px -- eight cameras in one building,
which is the very defect row 20 removes, arriving from the asset side.

usage:
    python3 design/plan-draft/measured/gate.py                 # all eight, as measured
    python3 design/plan-draft/measured/gate.py study/N hall/E  # named facings only

The TARGET column is what a regenerated candidate has to measure: 1010 divided
by that facing's own drawn standpoint distance, in pixels per metre at the wall
plane. It is the per-facing scale the seat generates against.

Reads the JSONs `measure.py` writes, so re-measure first when a candidate lands:
    python3 design/plan-draft/measured/measure.py
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", ".."))

REFERENCE_PX = 1010.0      # study/N, cand-2, measured: the approved camera
RULED_PX = 1024.0          # blueprint section 10's pinned lens
BAND = 0.03

TSV = os.path.join(REPO, "design", "plan-draft", "standpoints.tsv")
ROOM_OF = {"STUDY": "study", "CROSS PASSAGE": "hall"}


def standpoints():
    """The drawn standpoint distance per facing, from the approved table."""
    out = {}
    with open(TSV) as fh:
        next(fh)
        for line in fh:
            p = line.rstrip("\n").split("\t")
            if len(p) < 7:
                continue
            room = ROOM_OF.get(p[1])
            if room:
                out["%s/%s" % (room, p[3])] = float(p[5])
    return out


def main(argv):
    want = argv[1:]
    dist = standpoints()
    rows, worst = [], 0.0
    for fac, d in sorted(dist.items()):
        if want and fac not in want:
            continue
        loc, f = fac.split("/")
        path = os.path.join(HERE, "%s-%s.json" % (loc, f))
        if not os.path.exists(path):
            rows.append((fac, None, None, None, "NOT MEASURED"))
            continue
        m = json.load(open(path))
        ppm = m["px_per_m_at_wall"]
        if ppm is None:
            # WITHHELD [row 21]. A facing whose measurement could not issue a
            # number is not a facing that failed: it is one nothing measured.
            # The two must not print alike, and neither may be quoted as the
            # other -- a FAIL carries a delta the asset seat can act on, and a
            # WITHHELD carries `blocked_on` in misses.jsonl instead. Reading a
            # null here as a zero, or crashing on it, is how a withheld facing
            # would come to be re-asked against a number nobody measured.
            rows.append((fac, d, None, None, "WITHHELD"))
            continue
        focal = ppm * d
        delta = (focal - REFERENCE_PX) / REFERENCE_PX
        worst = max(worst, abs(delta))
        rows.append((fac, d, ppm, focal,
                     "PASS" if abs(delta) <= BAND else "FAIL  %+.1f%%" % (delta * 100)))

    print("gate: implied focal length against %.0f px (the approved study/N "
          "camera), band +/-%.0f%%" % (REFERENCE_PX, BAND * 100))
    print("%-9s %9s %10s %10s %10s   %s" % ("facing", "standpt", "px/m", "TARGET", "focal px", "verdict"))
    for fac, d, ppm, focal, verdict in rows:
        if d is None:
            print("%-9s %9s %10s %10s %10s   %s" % (fac, "-", "-", "-", "-", verdict))
        elif ppm is None:
            print("%-9s %9.2f %10s %10.1f %10s   %s"
                  % (fac, d, "-", REFERENCE_PX / d, "-", verdict))
        else:
            print("%-9s %9.2f %10.2f %10.1f %10.0f   %s"
                  % (fac, d, ppm, REFERENCE_PX / d, focal, verdict))
    # ---------------------------------------------------------- WARN tier
    # THE ROOM THE PAINTING DEPICTS, against the room the plan rules. This
    # never fails and never will until it has been clocked: the Navigator
    # ruled it WARN-TIER on 2026-08-22, on the grounds that a per-facing
    # MEASURED meta already reconciles scale and sprites (nothing composited
    # missizes, because px_per_m is read off the painting), the plan stays
    # truth for topology, and the cross-facing disagreement at the corners is
    # below perception at the current V-stage. It is printed because the
    # approved study/N paints a 3.00 m storey against a ruled 2.80 and the
    # study's side walls draw ~5.1-5.3 m against a ruled 4.80 -- a camera
    # re-ask that fixes only the camera keeps every one of those.
    warns = []
    for fac, d in sorted(dist.items()):
        if want and fac not in want:
            continue
        loc, f = fac.split("/")
        path = os.path.join(HERE, "%s-%s.json" % (loc, f))
        if not os.path.exists(path):
            continue
        m = json.load(open(path))
        der = m.get("_derived") or {}
        plan = m.get("_plan") or {}
        st, wd = der.get("storey_height_m"), der.get("implied_wall_width_m")
        ruled_st = plan.get("storey_m")
        ruled_wd = plan.get("wall_width_m")
        if st and ruled_st:
            warns.append("%-9s storey %.2f m painted against %.2f m ruled (%+.1f%%)"
                         % (fac, st, ruled_st, 100 * (st - ruled_st) / ruled_st))
        if wd and ruled_wd:
            warns.append("%-9s wall   %.2f m painted against %.2f m ruled (%+.1f%%)"
                         % (fac, wd, ruled_wd, 100 * (wd - ruled_wd) / ruled_wd))
    if warns:
        print("\nwarn (the ROOM the painting depicts, never a verdict -- ruled "
              "warn-tier 2026-08-22 and unclocked):")
        for w in warns:
            print("  " + w)

    bad = [r for r in rows if not r[4].startswith("PASS")]
    withheld = [r for r in rows if r[4] == "WITHHELD"]
    print("\n%d of %d admitted, %d withheld (no verdict is possible from those "
          "pixels); the ruled lens is %.0f px and the reference is %.1f%% from "
          "it." % (len(rows) - len(bad), len(rows), len(withheld), RULED_PX,
                  abs(REFERENCE_PX - RULED_PX) / RULED_PX * 100))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
