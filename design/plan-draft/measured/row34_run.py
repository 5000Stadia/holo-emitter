#!/usr/bin/env python3
"""Row 34 — the evolution run's measure path. One sweep over whatever landed.

    python3 design/plan-draft/measured/row34_run.py                 # generation 1
    python3 design/plan-draft/measured/row34_run.py --generation 2
    python3 design/plan-draft/measured/row34_run.py --batch DIR --out DIR

`design/specs/34-plan.md` §5.1 is the contract. This is a directory watch, not a
queue: it reads the evolution's own manifest and id map, measures every
candidate that is on disk, writes one reading per roll, and reports what has not
arrived. Running it again after more land costs only the new ones.

NO NEW DETECTOR EXISTS HERE AND NONE MAY. Every window is `row23_lib`'s
`cfg_from_sidecar`, computed from the WALL's declared geometry — so two frames
of the same wall from different arms are measured through byte-identical
windows, by construction rather than by discipline, and the detector
configuration cannot vary by arm even in principle. Every rule inside those
windows is `measure.py`'s own, injected exactly as the manor sweep injects them.
The row-34 machinery contributes the FILE LAYOUT and nothing else.

WHY IT IS A SEPARATE RUNNER RATHER THAN A FLAG ON `row23_run.py`
----------------------------------------------------------------
`row23_run.py` is the manor PRODUCTION loop: it promotes, it bakes, it writes
`run-state.json`, it spends a retry budget. None of that may happen to an
experiment's rolls, and a flag that switched all of it off inside the production
loop would be one edit away from switching it back on over a live run. So this
file promotes nothing, bakes nothing, publishes nothing and writes nothing under
`backdrops/` — and it never opens the manor run's manifest, run-state or
retries. `evolution.spec.mjs` asserts that structurally and behaviourally.

The manor sweep is symmetrically blind to this row: its arrival scan matches
`^row23-[0-9a-f]{8}\\.png$` and it walks its own manifest's rolls, so `row34-`
files sitting in the same source directories are invisible to it.
"""
import argparse
import hashlib
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, HERE)

BATCH = os.path.join(ROOT, "design", "batches", "row34-evolution")
OUT = os.path.join(HERE, "row34")

#: The eye the camera arm is read against — the manor loop's own reference eye,
#: quoted rather than re-chosen, so this row's camera verdict is the production
#: camera verdict and a difference between them could only be the painting.
REFERENCE_EYE_M = 1.183
BAND = 0.08


def sha(path):
    with open(path, "rb") as fh:
        return hashlib.sha256(fh.read()).hexdigest()


def assignment_path(batch, generation):
    return os.path.join(
        batch, "assignment.json" if generation == 1 else "assignment-gen%d.json" % generation)


def side_from_sidecar(doc):
    """`row23_lib`'s `side`, off this wall's own sidecar.

    The SIDECAR and not the manifest, because the manifest's `stamped` copies
    carry only (kind, x0, x1) and the sidecar carries the verticals the label
    pass actually drew. The manor loop re-derived those from the convention
    table after a live run went down on `KeyError: 'y0'`; here they are simply
    read, because this row's emitter wrote them down.
    """
    m = doc["meta_used"]
    return {
        "facing": doc["wall"],
        "meta_used": {
            "px_per_m_at_wall": m["px_per_m_at_wall"],
            "camera_wall_m": m.get("camera_wall_m"),
            "image_h_px": m["image_h_px"],
            "floor_line_y": m["floor_line_y"],
            "horizon_y": m["horizon_y"],
            "corner_x0_px": m.get("corner_x0_px"),
            "corner_x1_px": m.get("corner_x1_px"),
            "storey_height_m": m.get("storey_height_m"),
            "wall_width_m": m.get("wall_width_m"),
            "facing_type": m.get("facing_type"),
        },
        "brackets": doc["brackets"],
        "stamped": doc["stamped"],
        "outputs": {"scaffold": doc["images"]["scaffold"]},
    }


def ref_from_sidecar(doc):
    """The camera this wall's candidates are read against, and where each number
    came from — stated in the reading rather than implied by it."""
    m = doc["meta_used"]
    return {
        "focal_px": m.get("focal_px") or (m["px_per_m_at_wall"] * m["camera_wall_m"]),
        "eye_m": REFERENCE_EYE_M,
        "horizon_y_px": m["horizon_y"] * m["image_h_px"],
        "band": BAND,
        "source": "the meta the page holds for this facing, off its own row-34 sidecar",
        "authority": "the ruled lens; this wall is not promoted and holds no measured camera",
    }


def sweep(generation, batch, out_dir, verbose=True):
    import row23_lib
    # THE CORPUS'S RULES, INJECTED — identical to `row23_run.sweep`'s injection,
    # and identical BECAUSE it is the same instrument. A second reading of one
    # quantity is exactly what row 32 removed from the manor loop.
    from measure import (pick_floor, module_in_bands, pick_ceiling,
                         find_corners_recession, ceiling_ramp_vp, horizon_votes,
                         light, EYE_RANGE)
    picks = dict(pick_floor=pick_floor, module_in_bands=module_in_bands,
                 pick_ceiling=pick_ceiling,
                 find_corners_recession=find_corners_recession,
                 ceiling_ramp_vp=ceiling_ramp_vp, horizon_votes=horizon_votes,
                 light=light, EYE_RANGE=EYE_RANGE)

    manifest = json.load(open(os.path.join(batch, "manifest.json")))
    assign = json.load(open(assignment_path(batch, generation)))
    os.makedirs(out_dir, exist_ok=True)

    sidecars, cfgs, refs = {}, {}, {}
    for w in manifest["walls"]:
        doc = json.load(open(os.path.join(ROOT, w["packet"], "sidecar.json")))
        sidecars[w["key"]] = doc
        side = side_from_sidecar(doc)
        cfgs[w["key"]] = (side, row23_lib.cfg_from_sidecar(side))
        refs[w["key"]] = ref_from_sidecar(doc)

    measured, waiting = [], []
    for roll in assign["rolls"]:
        if roll["generation"] != generation:
            continue
        cand = os.path.join(ROOT, roll["candidate"])
        if not os.path.exists(cand):
            waiting.append(roll["id"])
            continue
        side, cfg = cfgs[roll["wall"]]
        ref = refs[roll["wall"]]
        reading = row23_lib.measure_candidate(cand, side, cfg, ref, picks)
        # THE READING NAMES ITS OWN ROLL AND NOTHING ELSE ABOUT IT. The arm is
        # NOT written here: the join to the arm happens at table time, out of
        # the id map, so a hand reading a measurement file cannot see which
        # condition it is looking at. That is the blinding, and writing the arm
        # into the reading would spend it for nothing.
        reading["_row"] = 34
        reading["_generation"] = generation
        reading["_id"] = roll["id"]
        reading["_wall"] = roll["wall"]
        reading["_candidate"] = roll["candidate"]
        reading["_candidate_sha256"] = sha(cand)
        reading["_ref"] = ref
        reading["_declared_horizon_row"] = sidecars[roll["wall"]]["declared_horizon_row"]
        reading["_arm_is_not_recorded_here"] = (
            "by design: design/specs/34-plan.md §4. The id maps to its arm in "
            "design/batches/row34-evolution/assignment.json, which was committed "
            "before any candidate existed and has not changed since.")
        with open(os.path.join(out_dir, roll["id"] + ".json"), "w") as fh:
            json.dump(reading, fh, indent=2)
            fh.write("\n")
        measured.append((roll["id"], reading))
        if verbose:
            p = reading.get("_promotion") or {}
            adm = "yes" if p.get("ramp") else "no "
            print("  %s  %-20s  %-8s  horizon %s  admissible %s"
                  % (roll["id"], roll["wall"], reading.get("verdict"),
                     ("%.1f" % p["ramp"]["y"]) if p.get("ramp") else "   -  ", adm))

    if verbose:
        print("\ngeneration %d: %d measured, %d not yet returned"
              % (generation, len(measured), len(waiting)))
        if waiting:
            print("  waiting: " + " ".join(waiting))
        print("  readings  " + out_dir[len(ROOT) + 1:])
        print("  NOTHING PROMOTED, NOTHING BAKED, NOTHING PUBLISHED - this is an "
              "experiment's measure path and it owns no production act.")
    return measured, waiting


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--generation", type=int, default=1)
    ap.add_argument("--batch", default=BATCH,
                    help="the evolution batch directory (manifest.json + assignment.json)")
    ap.add_argument("--out", default=None, help="where readings are written")
    a = ap.parse_args(argv)
    out = a.out or (OUT if a.generation == 1 else "%s-gen%d" % (OUT, a.generation))
    sweep(a.generation, a.batch, out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
