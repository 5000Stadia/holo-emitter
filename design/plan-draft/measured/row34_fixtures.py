#!/usr/bin/env python3
"""Row 34 — synthetic readings, so the scorer can be tested before any image exists.

    python3 design/plan-draft/measured/row34_fixtures.py --case winner --out DIR
    python3 .../row34_fixtures.py --case null   --out DIR
    python3 .../row34_fixtures.py --case loser  --out DIR --arm v7

`design/specs/34-plan.md` §8 items 7, 7b and 8. A scorer whose only evidence is
the run it was written for cannot be trusted before that run: these fixtures put
a KNOWN answer in front of it and the suite asserts it says the known thing.

THE PLANTED NULL IS THE ONE THAT MATTERS. Anyone can write a scorer that names a
winner; the discipline this row lives or dies by is that it refuses to name one
when the numbers are noise, and the `null` case is the check that it does.

THE CASES ARE PARAMETERISED BY ARM RATHER THAN NAMING ONE. `--arm` says which
arm gets the planted result, so the same code plants a win or a loss on any arm
— which is how §0a's fence gets exercised: the run must be able to announce the
governing frame's arm losing exactly as plainly as winning.

Nothing here writes into the real readings directory, and `--out` is required.
"""
import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
BATCH = os.path.join(ROOT, "design", "batches", "row34-evolution")

#: A reading the instrument would have produced for an admissible frame, and one
#: for a frame whose returns fix no horizon. Both are shaped exactly like
#: `row23_lib.measure_candidate`'s output for the fields the scorer reads, and
#: they are marked synthetic so one can never be mistaken for a measurement.
def reading(admissible, declared_row, horizon_off_px=3.0, sigma=6.0,
            camera_pass=True, withheld=False):
    if withheld:
        return {"verdict": "WITHHELD", "kind": "measurement_withheld",
                "blocked_on": "synthetic fixture: a fact about us, counting against nothing",
                "_declared_horizon_row": declared_row, "_synthetic": True}
    y = declared_row + horizon_off_px
    tried = [{"ceiling_y_px": 200, "admissible": bool(admissible),
              "sigma_y_px": sigma, "horizon_y_px": y,
              "why": None if admissible else "synthetic: outside the standing licence"}]
    return {
        "verdict": "PASS" if camera_pass else "FAIL",
        "kind": None if camera_pass else "generation_miss",
        "delta_focal_pct": 0.5, "delta_eye_pct": 1.0,
        "_declared_horizon_row": declared_row,
        "_synthetic": True,
        "_promotion": {
            "ramp": ({"y": y, "x": 768.0, "sigma_y_px": sigma} if admissible else None),
            "ceiling_rows_tried": tried,
            "hold_family": None if admissible else "unfitted-horizon",
            "withheld_because": [] if admissible else ["synthetic unfitted horizon"],
        },
    }


CASES = {
    # A CLEAN SWEEP, which plan §5.4 computes as the only generation-1 result
    # that can clear the discipline: the named arm takes every roll, the control
    # takes none, everyone else sits between.
    "winner": {"target": 2, "control": 0, "other": 1,
               "_is": "a planted separation: the named arm sweeps, the control takes nothing"},
    # EVERY ARM AT HALF, INCLUDING THE CONTROL. There is nothing here, and the
    # scorer has to say so.
    "null": {"target": 1, "control": 1, "other": 1,
             "_is": "a planted null: every arm and the control at the same rate"},
    # THE NAMED ARM TAKES NOTHING AND ANOTHER SWEEPS. Used to prove the report
    # announces a loss for any arm as plainly as a win.
    "loser": {"target": 0, "control": 0, "other": 1, "winner_is_first_other": True,
              "_is": "a planted loss for the named arm, with a different arm separating"},
    # ONE ROLL OF MARGIN AND NOTHING ELSE. The margin rule must refuse it.
    "thin": {"target": 2, "control": 1, "other": 1,
             "_is": "a planted one-roll margin, which the >=2 margin rule must refuse"},
    # NOTHING MEASURABLE AT ALL. Not a null - a broken run.
    "broken": {"withheld_all": True, "_is": "every reading withheld: a broken run"},
}


def build(case, arm, out_dir, batch=BATCH, generation=1):
    spec = CASES[case]
    assign = json.load(open(os.path.join(
        batch, "assignment.json" if generation == 1 else "assignment-gen%d.json" % generation)))
    control = assign["_control"]
    others = [a["id"] for a in assign["_arms"] if a["id"] not in (control, arm)]
    sweeper = others[0] if spec.get("winner_is_first_other") and others else None
    os.makedirs(out_dir, exist_ok=True)
    per_wall = {}
    for roll in assign["rolls"]:
        if roll["generation"] != generation:
            continue
        per_wall.setdefault((roll["arm"], roll["wall"]), []).append(roll)
    n_written = 0
    for (a, w), rolls in per_wall.items():
        if spec.get("withheld_all"):
            k = 0
        elif a == control:
            k = spec["control"]
        elif a == arm:
            k = spec["target"]
        elif a == sweeper:
            k = len(rolls)
        else:
            k = spec["other"]
        for i, roll in enumerate(sorted(rolls, key=lambda r: r["roll"])):
            doc = reading(i < k, 526,
                          withheld=bool(spec.get("withheld_all")))
            doc["_id"] = roll["id"]
            doc["_wall"] = roll["wall"]
            doc["_fixture"] = {"case": case, "arm_under_test": arm, "_is": spec["_is"]}
            with open(os.path.join(out_dir, roll["id"] + ".json"), "w") as fh:
                json.dump(doc, fh, indent=2)
                fh.write("\n")
            n_written += 1
    return n_written


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--case", required=True, choices=sorted(CASES))
    ap.add_argument("--arm", default=None,
                    help="which arm carries the planted result; defaults to the first "
                         "non-control arm in the id map")
    ap.add_argument("--out", required=True)
    ap.add_argument("--batch", default=BATCH)
    ap.add_argument("--generation", type=int, default=1)
    a = ap.parse_args(argv)
    if os.path.abspath(a.out) == os.path.abspath(os.path.join(HERE, "row34")):
        print("refused: --out is the real readings directory", file=sys.stderr)
        return 1
    arm = a.arm
    if arm is None:
        assign = json.load(open(os.path.join(a.batch, "assignment.json")))
        arm = next(x["id"] for x in assign["_arms"] if x["id"] != assign["_control"])
    n = build(a.case, arm, a.out, a.batch, a.generation)
    print("%d synthetic readings for case %s (arm %s) -> %s" % (n, a.case, arm, a.out))
    return 0


if __name__ == "__main__":
    sys.exit(main())
