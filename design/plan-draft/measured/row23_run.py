#!/usr/bin/env python3
"""The manor production loop — arrival to promotion, one command.

    python3 design/plan-draft/measured/row23_run.py            # one sweep
    python3 design/plan-draft/measured/row23_run.py --watch    # keep sweeping

[HUMAN, 2026-08-23] "We really need to consider the most efficient way to go from
schematic/description to full assets. To the degree we hope to one pass parallel
all assets created few turns each to full completion."

So this is a SWEEP, not a queue. It reads whatever is on disk, in whatever order
it landed, and each wall is decided on its own: measured against the camera its
own manifest entry declares, promoted if it passes, given a retry packet with a
correction if it does not, parked when its cap is spent. Nothing waits for
anything else, and running it again after more frames arrive costs only the new
ones.

WHAT IT WILL NOT DO, and both are fences rather than omissions:

  * It never promotes `study/N` or `study/W`. They are the experiment's own
    ground truth and its only Kabe-ruled camera; a production loop that
    overwrote them would destroy the reference the whole matrix is measured
    against, and it would do it silently.
  * It never publishes. Promotions accumulate and it PRINTS that they have;
    `tools/publish-site.sh` is a human's to run, because publication is the one
    act that cannot be taken back.

THE RETRY CARRIES A CORRECTION OR IT IS NOT A RETRY. The miss ledger's whole
point (production law clause 2) is that a miss is logged with its diagnosed
cause; a re-ask that just says "again" spends a roll to learn nothing. Every
retry packet here names the measured scale and the scale the wall must draw at.
"""
import argparse
import glob
import hashlib
import json
import os
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, HERE)

MANOR = os.path.join(ROOT, "design", "batches", "row23-scaffold", "manor")
MANIFEST = os.path.join(MANOR, "manifest.json")
STATE = os.path.join(MANOR, "run-state.json")
OUT = os.path.join(HERE, "manor")

#: The experiment's own walls. Promotion here would overwrite the ground truth
#: every row-23 number is measured against.
NEVER_PROMOTE = {"study/N", "study/W"}


def load_state():
    return json.load(open(STATE)) if os.path.exists(STATE) else {"walls": {}}


def save_state(st):
    os.makedirs(os.path.dirname(STATE), exist_ok=True)
    json.dump(st, open(STATE, "w"), indent=2)


def sha(p):
    return hashlib.sha256(open(p, "rb").read()).hexdigest()



def promote_reading(key, cand_rel, e):
    """A promote-ready reading, produced by the corpus's OWN wave measurement.

    `promote-backdrop.mjs` needs more than the row-23 camera check does: the
    ceiling-ramp horizon (the instrument row 20 ruled), the corners, the light,
    the calibration feature. All of that already exists in `measure_wave`, which
    is what the standing-eye wave was measured with — so this builds that
    function's config from the manifest entry and calls it, rather than growing
    a second measurement of the same pixels. Two detectors for one quantity is
    how a project ends up with two answers.
    """
    import measure as M
    b = e["brackets"]
    fw, rb, cb = b["floor_window"], b["rail_band"], b["ceiling_band"]
    cols = [tuple(x) for x in b["rail_columns"]] or [(200, 1336)]
    cfg = dict(
        src=cand_rel,
        floor_window=(int(fw["centre"] - fw["half_width"]),
                      int(fw["centre"] + fw["half_width"])),
        ceil_cols=cols, ceil_range=(8, max(60, int(cb["centre"] + cb["half_width"]))
                                    if cb else 420),
        floor_cols=cols, floor_range=(int(fw["centre"] - 6 * fw["half_width"]),
                                      min(1010, int(fw["centre"] + 6 * fw["half_width"]))),
        rail_cols=cols, rail_range=(int(rb["centre"] - 3 * rb["half_width"]),
                                    int(rb["centre"] + 3 * rb["half_width"])),
        module_band=(int(rb["centre"] - rb["half_width"] * 3),
                     int(rb["centre"] + rb["half_width"] * 3)),
        module_cols=cols)
    try:
        r = M.measure_wave(key, cfg, ref=None)
    except Exception as exc:                       # a wall the detectors cannot read
        return None, "the wave detectors could not read this frame: %s" % exc
    doc = M.wave_doc(key, r, None, "manor")
    doc["_source_sha256"] = sha(os.path.join(ROOT, cand_rel))
    loc, f = key.split("/")
    d = os.path.join(HERE, "manor-promote")
    os.makedirs(d, exist_ok=True)
    path = os.path.join(d, "%s-%s.json" % (loc, f))
    json.dump(doc, open(path, "w"), indent=2)
    return path, None


def do_promote(key, cand_rel, e):
    """promote-backdrop + bake, for one wall. Never for the experiment's own."""
    path, why = promote_reading(key, cand_rel, e)
    if path is None:
        return False, why
    r = subprocess.run(
        ["node", os.path.join(ROOT, "tools", "promote-backdrop.mjs"),
         "--facing", key, "--candidate", cand_rel, "--round", "manor-promote"],
        cwd=ROOT, capture_output=True, text=True)
    if r.returncode != 0:
        return False, (r.stdout + r.stderr).strip().split("\n")[-1][:200]
    b = subprocess.run(["node", os.path.join(ROOT, "tools", "bake-backdrops.mjs")],
                       cwd=ROOT, capture_output=True, text=True)
    if b.returncode != 0:
        return False, "promoted, but the bake failed: " + (b.stdout + b.stderr).strip()[-200:]
    return True, None


def sweep(manifest, state, do_promote=True):
    do_promote_fn = globals()["do_promote"]
    import row23_lib
    from measure import pick_floor, module_in_bands
    picks = dict(pick_floor=pick_floor, module_in_bands=module_in_bands)
    os.makedirs(OUT, exist_ok=True)

    promoted, failed, parked, waiting = [], [], [], []
    for e in manifest["entries"]:
        if e.get("skipped"):
            continue
        key = e["key"]
        st = state["walls"].setdefault(key, {"attempts": 0, "status": "waiting"})
        if st["status"] in ("promoted", "parked"):
            continue
        # THE STORE IS CHECKED, NOT THE STATE FILE ALONE. A wall promoted by any
        # route already has art, and a late duplicate return for it must not
        # clobber a promoted asset - the reuse rule is that art is generated
        # once, promoted once, and thereafter READ. Logged, never silent.
        loc, fac_f = key.split("/")
        if os.path.exists(os.path.join(ROOT, "backdrops", loc, fac_f + ".png")) and \
           os.path.exists(os.path.join(ROOT, "backdrops", loc, fac_f + ".meta.json")):
            if st["status"] != "promoted":
                st["status"] = "promoted"
                st["why"] = "art already in the store; this loop read it rather than remaking it"
                print("  %-24s EXISTS    backdrops/%s/%s.png - late returns ignored"
                      % (key, loc, fac_f))
            continue

        arrivals = [r for r in e["rolls"]
                    if os.path.exists(os.path.join(ROOT, r["candidate"]))]
        if not arrivals:
            waiting.append(key)
            continue

        # The wall's own declared camera, off its own manifest entry — never a
        # global one. A manor of 88 facings has 88 standpoints and therefore 88
        # scales, and pooling them is the defect row 20 removed.
        ref = dict(focal_px=e["implied_focal_px"], eye_m=1.183,
                   horizon_y_px=1024 * 0.51377, band=0.08,
                   source="the wall's own manifest entry",
                   authority="the meta the page holds for this facing")
        side = {"facing": key,
                "meta_used": {"px_per_m_at_wall": e["px_per_m_at_wall"],
                              # An OPEN facing has no wall to be a distance
                              # from; its scale is quoted at the far line and
                              # nothing in the cfg needs the distance itself.
                              "camera_wall_m": e.get("camera_wall_m"),
                              "image_h_px": 1024,
                              "floor_line_y": e.get("floor_line_y", 0.7857),
                              "horizon_y": 0.51377,
                              "corner_x0_px": e.get("corner_x0_px"),
                              "corner_x1_px": e.get("corner_x1_px"),
                              "storey_height_m": e.get("storey_height_m"),
                              "wall_width_m": e.get("wall_width_m")},
                "brackets": e["brackets"], "stamped": e["stamped"],
                "outputs": {"scaffold": e["packet"] + "/scaffold.png",
                            "scaffold_sha256": e["scaffold_sha256"]}}
        # HOTFIX (Navigator, live run 2026-08-24): the manifest's `stamped`
        # copies carry only (kind, x0, x1); the verticals are re-derived from
        # the scaffold's own convention table in `row23_lib._conv_y`. Found
        # when the first arrival took the whole loop down with KeyError 'y0'.
        try:
            cfg = row23_lib.cfg_from_sidecar(side)
        except Exception as _ex:
            # ONE BAD WALL PARKS ITSELF; it does not take the sweep down. The
            # crash class this replaces cost the run its cadence once.
            st["status"] = "parked"
            st["why"] = "config derivation failed: %s" % _ex
            print("  %-24s PARKED    config: %s" % (key, _ex))
            continue

        best = None
        for r in arrivals:
            p = os.path.join(ROOT, r["candidate"])
            d = row23_lib.measure_candidate(p, side, cfg, ref, picks)
            d["id"], d["candidate"] = r["id"], r["candidate"]
            json.dump(d, open(os.path.join(OUT, "%s.json" % r["id"]), "w"), indent=2)
            if d["verdict"] == "PASS" and (best is None or
                                           abs(d["delta_focal_pct"]) < abs(best[1]["delta_focal_pct"])):
                best = (r, d)

        st["attempts"] = max(st["attempts"], len(arrivals))
        if best:
            r, d = best
            if key in NEVER_PROMOTE:
                st["status"] = "admitted-not-promoted"
                st["why"] = ("this wall is the experiment's own ground truth; "
                             "promoting it would overwrite the reference every "
                             "row-23 number is measured against")
                promoted.append((key, "ADMITTED, fenced from promotion", d))
            elif do_promote:
                ok, why = do_promote_fn(key, r["candidate"], e)
                if ok:
                    st["status"] = "promoted"
                    st["candidate"] = r["candidate"]
                    promoted.append((key, "PASS %+.1f%% focal, promoted and baked"
                                     % d["delta_focal_pct"], d))
                else:
                    st["status"] = "retry"
                    st["correction"] = "the camera passed but promotion refused: %s" % why
                    failed.append((key, d, st["correction"]))
            else:
                st["status"] = "admitted"
                promoted.append((key, "PASS %+.1f%% focal (promotion not run)"
                                 % d["delta_focal_pct"], d))
        else:
            worst = None
            for r in arrivals:
                d = json.load(open(os.path.join(OUT, "%s.json" % r["id"])))
                worst = d
            if st["attempts"] >= e.get("retry_cap", 3):
                st["status"] = "parked"
                st["why"] = "the retry cap is spent; the wall stays grid and the run continues"
                parked.append((key, worst))
            else:
                st["status"] = "retry"
                ppm = worst.get("px_per_m_at_wall")
                want = e["px_per_m_at_wall"]
                st["correction"] = (
                    "draw %.3fx larger: %.1f px/m at the wall plane, not %.1f"
                    % (want / ppm, want, ppm)) if ppm else (
                    "the chair-rail the prompt declares is not in the frame the licence "
                    "allows; nothing in this painting converts to a scale")
                failed.append((key, worst, st["correction"]))
    return promoted, failed, parked, waiting


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--watch", action="store_true",
                    help="keep sweeping; arrivals are processed as they land")
    ap.add_argument("--interval", type=int, default=45)
    ap.add_argument("--no-promote", action="store_true")
    a = ap.parse_args()

    if not os.path.exists(MANIFEST):
        print("row23-run: no manifest - run "
              "`node tools/make-scaffold.mjs --emit-manor` first")
        return 1
    manifest = json.load(open(MANIFEST))

    while True:
        state = load_state()
        promoted, failed, parked, waiting = sweep(manifest, state, not a.no_promote)
        save_state(state)

        for key, why, d in promoted:
            print("  %-24s PROMOTE   %s" % (key, why))
        for key, d, corr in failed:
            print("  %-24s RETRY     %s | %s" % (key, d.get("verdict"), corr))
        for key, d in parked:
            print("  %-24s PARKED    cap spent; wall stays grid, run continues" % key)
        done = sum(1 for w in state["walls"].values() if w["status"] == "promoted")
        print("%s  %d promoted, %d retrying, %d parked, %d still unpainted"
              % (time.strftime("%H:%M:%S"), done, len(failed), len(parked), len(waiting)))
        if done:
            print("  >> %d wall(s) promoted and baked. `tools/publish-site.sh` is yours to "
                  "run when you want them live - this loop never publishes." % done)
        if not a.watch:
            return 0
        time.sleep(a.interval)


if __name__ == "__main__":
    sys.exit(main())
