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
    python3 design/plan-draft/measured/gate.py --round cand3   # the cand-3 readings
    python3 design/plan-draft/measured/gate.py --round cand6   # the standing-eye wave

THE ROUND IS AN ARGUMENT AND THE BAND IS NOT. `--round cand3` reads the
universal-anchor round's readings out of `measured/cand3/` instead of the
promotion round's out of `measured/`; every number this file applies to them is
the same one. A round that could bring its own band would be a corpus moving the
law, which is the one thing this gate exists to refuse.

THE STANDING-EYE WAVE IS A NEW LAW, NOT A ROUND UNDER THIS ONE, and that is why
`--round cand6` has its own reference, its own band and its own second half.
[HUMAN 2026-08-22, design/approvals.log at 964188d] "B" - the standing eye -
ruled that every wall of the manor is repainted at a new camera, so the camera
the corpus conforms to MOVED by a human's decision rather than by a corpus
arguing. The new law is read off `backdrops/source/study-N/cand-5-reference.png`
by `measure.py --round cand5ref` and lives in `measured/cand5ref/study-N.json`:
this file reads it from there and types none of it, so the reference cannot
drift from the frame it came off. The band is +/-8 % on the implied focal length
AND on the eye height, an [AI] STARTING licence recorded with its clock in
`misses.jsonl` - if this wave admits ~0 as cand-2 and cand-3 did, the band and
the approach are re-examined and NOT widened again.

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


BAND6 = 0.08               # the standing-eye wave's [AI] starting licence
WAVE_FACINGS = ["hall/E", "hall/N", "hall/S", "hall/W",
                "study/E", "study/S", "study/W"]


def reference_set():
    """The standing camera, read off the round that measured it."""
    p = os.path.join(HERE, "cand5ref", "study-N.json")
    if not os.path.exists(p):
        return None
    return json.load(open(p))["_reference_set"]


def main_cand6(want):
    ref = reference_set()
    if ref is None:
        print("gate: no standing camera reference - run "
              "design/plan-draft/measured/measure.py --round cand5ref")
        return 1
    here = os.path.join(HERE, "cand6")
    if not os.path.isdir(here):
        print("gate: no cand-6 readings - run "
              "design/plan-draft/measured/measure.py --round cand6")
        return 1
    print("ROUND cand-6: THE STANDING-EYE WAVE. The reference is "
          "backdrops/source/study-N/cand-5-reference.png, measured at a %.1f px "
          "lens and a %.4f m eye; the band is +/-%.0f%% on BOTH, an [AI] "
          "starting licence with its clock in misses.jsonl.\n"
          % (ref["focal_px"], ref["eye_m"], BAND6 * 100))
    rows, ledger = [], []
    for fac in WAVE_FACINGS:
        if want and fac not in want:
            continue
        loc, f = fac.split("/")
        path = os.path.join(here, "%s-%s.json" % (loc, f))
        if not os.path.exists(path):
            rows.append((fac, None, None, None, None, None, "NOT MEASURED"))
            continue
        m = json.load(open(path))
        rows.append((fac, m["drawn_standpoint_m"], m["px_per_m_at_wall"],
                     m["implied_focal_px"], m["eye_height_m"],
                     (m["delta_focal_pct"], m["delta_eye_pct"]),
                     m["verdict"]))
        if m["verdict"] == "WITHHELD":
            ledger.append((fac, " ".join(m["_withheld_because"])))
    print("%-9s %9s %10s %10s %10s %9s %9s %9s   %s"
          % ("facing", "standpt", "px/m", "TARGET", "focal px", "eye m",
             "dfocal", "deye", "verdict"))
    for fac, d, ppm, focal, eye, deltas, verdict in rows:
        if ppm is None:
            print("%-9s %9s %10s %10s %10s %9s %9s %9s   %s"
                  % (fac, "%.2f" % d if d else "-", "-",
                     "%.1f" % (ref["focal_px"] / d) if d else "-",
                     "-", "-", "-", "-", verdict))
        else:
            df, de = deltas
            print("%-9s %9.2f %10.2f %10.1f %10.0f %9s %9s %9s   %s"
                  % (fac, d, ppm, ref["focal_px"] / d, focal,
                     "%.4f" % eye if eye else "-",
                     "%+.1f%%" % df if df is not None else "-",
                     "%+.1f%%" % de if de is not None else "-", verdict))
    if ledger:
        print("\nWITHHELD, and what has to change before a verdict is possible:")
        for fac, why in ledger:
            print("  %-9s %s" % (fac, why))
    bad = [r for r in rows if r[6] != "PASS"]
    withheld = [r for r in rows if r[6] == "WITHHELD"]
    print("\n%d of %d admitted, %d withheld (no verdict is possible from those "
          "pixels). First-roll pass rate: cand-2 0 of 7, cand-3 0 of 7, cand-6 "
          "%d of 7."
          % (len(rows) - len(bad), len(rows), len(withheld), len(rows) - len(bad)))
    return 1 if bad else 0


def main_cand5ref():
    ref = reference_set()
    if ref is None:
        print("gate: no standing camera reference - run "
              "design/plan-draft/measured/measure.py --round cand5ref")
        return 1
    print("ROUND cand5ref: THE STANDING CAMERA REFERENCE SET. Nothing is "
          "gated here - a reference is read, not admitted.\n")
    print("  source            backdrops/source/study-N/cand-5-reference.png")
    for k, label in (("px_per_m_at_wall", "px_per_m_at_wall"),
                     ("focal_px", "implied focal px"),
                     ("eye_m", "eye height m"),
                     ("horizon_y_px", "horizon y px (ceiling ramp)"),
                     ("floor_line_y_px", "floor line y px"),
                     ("corner_x0_px", "corner x0 px"),
                     ("corner_x1_px", "corner x1 px"),
                     ("storey_height_m", "storey m (painted)")):
        print("  %-17s %s" % (label, ref[k]))
    print("\ncarried by:")
    for c in ref["_what_carries_it"]:
        print("  " + c)
    return 0


def main(argv):
    argv = list(argv)
    here = HERE
    if "--round" in argv:
        i = argv.index("--round")
        rnd = argv[i + 1] if len(argv) > i + 1 else ""
        if rnd not in ("cand2", "cand3", "cand5ref", "cand6"):
            print("gate: --round takes cand2, cand3, cand5ref or cand6")
            return 2
        del argv[i:i + 2]
        if rnd == "cand5ref":
            return main_cand5ref()
        if rnd == "cand6":
            return main_cand6(argv[1:])
        if rnd == "cand3":
            here = os.path.join(HERE, "cand3")
            if not os.path.isdir(here):
                print("gate: no cand-3 readings - run "
                      "design/plan-draft/measured/measure.py --round cand3")
                return 1
            print("ROUND cand-3: the universal-anchor round. NOTHING HERE "
                  "PROMOTES - the standing-eye wave regenerates every wall "
                  "against cand-4. This table is recipe validation.\n")
    want = argv[1:]
    dist = standpoints()
    rows, worst, notes = [], 0.0, []
    for fac, d in sorted(dist.items()):
        if want and fac not in want:
            continue
        loc, f = fac.split("/")
        path = os.path.join(here, "%s-%s.json" % (loc, f))
        if not os.path.exists(path):
            rows.append((fac, None, None, None, "NOT MEASURED"))
            continue
        m = json.load(open(path))
        ppm = m["px_per_m_at_wall"]
        if m.get("_not_gated"):
            # A round may READ a facing it does not judge - the cand-3 round
            # measures study/N, which is already admitted and promoted at
            # cand-2. Printing its reading as a verdict would put the approved
            # wall in a table of misses; leaving it out would let the round be
            # quoted as if the approved wall had not been looked at.
            notes.append("%-9s not gated: %s" % (fac, m["_not_gated"]))
            rows.append((fac, d, ppm, (ppm * d if ppm else None), "NOT GATED"))
            continue
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
    for n in notes:
        print("  " + n)
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
        path = os.path.join(here, "%s-%s.json" % (loc, f))
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
