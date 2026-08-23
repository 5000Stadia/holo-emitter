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



def promote_reading(key, cand_rel, e, side, ref, reading):
    """A promote-ready record, out of the reading the GATE already took.

    ONE INSTRUMENT PER QUANTITY, and this is what that costs and what it buys.
    Until 2026-08-24 this function measured the frame a SECOND time, through
    `measure.py`'s `measure_wave`, with a config synthesised from the same
    manifest brackets widened threefold. The intent was reuse; the effect was a
    second instrument, because a detector's window is part of the detector.
    They disagreed about the one number the gate exists to read — `great_hall/N`
    117.9 px/m at the gate against 104.2 at the promotion, `back_stair/N` 337.9
    against 363.2 — and every WITHHELD the promotion issued was computed off a
    scale no gate had ever admitted. So the second call is gone: the row-23
    instrument reads the ceiling line, the corners, the ceiling-ramp horizon and
    the light in the same pass as the floor line and the chair rail (see
    `row23_lib._promotion_half`), and this shapes that one reading into the §5
    record. Nothing is measured here.
    """
    if e.get("camera_wall_m") is None:
        return None, ("an open facing's far-line frame has no wall plane to "
                      "carry a scale; its promotion path is not built yet")
    import row23_lib
    doc, refusals = row23_lib.promotion_doc(
        reading, side, ref, "manor", sha(os.path.join(ROOT, cand_rel)))
    if doc is None or refusals:
        return None, (refusals or ["no reading"])[0]
    loc, f = key.split("/")
    d = os.path.join(HERE, "manor")
    os.makedirs(d, exist_ok=True)
    path = os.path.join(d, "%s-%s.json" % (loc, f))
    json.dump(doc, open(path, "w"), indent=2)
    door_reading(path, cand_rel, loc)
    return path, None


def door_reading(doc_path, cand_rel, loc):
    """[Row 27] And where this frame's ways through are, added to the reading.

    A door's rectangle is measured off the painting, never projected onto it
    (blueprint §11's click-coincidence, the row-22 precedent), and it is
    measured HERE for the same reason every other number is: the promotion tool
    reads a measurement and writes a document, so a door read at promotion time
    would be a number no measurement ever took. `promote-backdrop.mjs` refuses
    a door-bearing facing whose reading has no `openings` at all rather than
    projecting one quietly, so this call is not optional and its absence is
    loud.
    """
    import door_measure
    plan = json.load(open(os.path.join(ROOT, "fixtures", "demo-study", "plan.json")))
    return door_measure.patch(doc_path, os.path.join(ROOT, cand_rel), loc, plan)


def _bake():
    """backdrops/baked.js AND every fixture that reads a promoted meta.

    A promoted wall changes two baked artifacts, not one: `backdrops/baked.js`
    carries the picture and each world's `fixture.js` carries the meta the page
    renders it with. Baking only the first is how a sweep leaves
    `fixtures/nav-manor/fixture.js` stale — which `fixtures.spec`'s bake
    staleness case turns red, and which it should, because a page rendering a
    wall from a meta nothing baked is a page rendering yesterday's world.
    """
    out = []
    r = subprocess.run(["node", os.path.join(ROOT, "tools", "bake-backdrops.mjs")],
                       cwd=ROOT, capture_output=True, text=True)
    if r.returncode != 0:
        return "backdrops/baked.js: " + (r.stdout + r.stderr).strip()[-300:]
    for d in sorted(os.listdir(os.path.join(ROOT, "fixtures"))):
        fd = os.path.join(ROOT, "fixtures", d)
        if not os.path.exists(os.path.join(fd, "world.json")):
            continue
        r = subprocess.run(["node", os.path.join(ROOT, "tools", "bake-fixtures.mjs"),
                            "--fixture-dir", fd], cwd=ROOT,
                           capture_output=True, text=True)
        if r.returncode != 0:
            out.append("fixtures/%s: %s" % (d, (r.stdout + r.stderr).strip()[-300:]))
    return out[0] if out else None


def do_promote(key, cand_rel, e, side, ref, reading):
    """promote-backdrop + bake, for one wall. Never for the experiment's own.

    A PROMOTION THAT CANNOT BE BAKED IS NOT A PROMOTION. The bake runs the
    fixture validator over the meta this wall just wrote, and a refusal there
    is the law speaking about the asset — so the two files are taken back out
    of the store and the wall holds, rather than leaving a wall in `backdrops/`
    that the page cannot be built from.
    """
    path, why = promote_reading(key, cand_rel, e, side, ref, reading)
    if path is None:
        return False, why
    r = subprocess.run(
        ["node", os.path.join(ROOT, "tools", "promote-backdrop.mjs"),
         "--facing", key, "--candidate", cand_rel, "--round", "manor",
         # The wall answers to the camera its own meta commands: manor walls
         # are scaffolded and derived at the ruled 1024 px lens.
         "--reference", "ruled"],
        cwd=ROOT, capture_output=True, text=True)
    if r.returncode != 0:
        return False, (r.stdout + r.stderr).strip().split("\n")[-1][:200]
    bad = _bake()
    if bad:
        loc, f = key.split("/")
        for p in (os.path.join(ROOT, "backdrops", loc, f + ".png"),
                  os.path.join(ROOT, "backdrops", loc, f + ".meta.json")):
            if os.path.exists(p):
                os.remove(p)
        _bake()
        return False, "promoted, and taken back out because the bake refused: " + bad
    return True, None


def sweep(manifest, state, do_promote=True):
    do_promote_fn = globals()["do_promote"]
    import row23_lib
    # THE CORPUS'S RULES, INJECTED — the row-23 instrument supplies the windows
    # and `measure.py` supplies how to read inside them, for the promotion half
    # exactly as for the camera half. Nothing in `row23_lib` re-derives a
    # detector this project has already paid for.
    from measure import (pick_floor, module_in_bands, pick_ceiling,
                         find_corners_cand2, ceiling_ramp_vp, horizon_votes,
                         light, EYE_RANGE)
    picks = dict(pick_floor=pick_floor, module_in_bands=module_in_bands,
                 pick_ceiling=pick_ceiling, find_corners_cand2=find_corners_cand2,
                 ceiling_ramp_vp=ceiling_ramp_vp, horizon_votes=horizon_votes,
                 light=light, EYE_RANGE=EYE_RANGE)
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
        side["meta_used"]["facing_type"] = e.get("type")
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
            # A candidate the measurement cannot read is that CANDIDATE's
            # failure, never the sweep's: logged, skipped, and the wall parks
            # at its cap like any other run of misses. The alternative — a
            # per-pixel surprise anywhere in 170 images taking the loop down —
            # is the crash class this run has now paid for twice.
            try:
                d = row23_lib.measure_candidate(p, side, cfg, ref, picks)
            except Exception as _mex:
                print("  %-24s MEASURE-ERR %s: %s" % (key, r["id"], _mex))
                continue
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
                side["candidate"] = r["candidate"]
                ok, why = do_promote_fn(key, r["candidate"], e, side, ref, d)
                if ok:
                    st["status"] = "promoted"
                    st["candidate"] = r["candidate"]
                    promoted.append((key, "PASS %+.1f%% focal, promoted and baked"
                                     % d["delta_focal_pct"], d))
                else:
                    # THE CAMERA PASSED AND THE PROMOTION REFUSED. A retry
                    # would spend a roll repainting a wall whose frame is
                    # already admissible, so the wall HOLDS with its candidate
                    # named and the reason recorded, and the next sweep
                    # promotes it the moment the reason stops being true.
                    #
                    # AND THE REASON IS NOW ABOUT THE PICTURE, WHICH IT WAS NOT
                    # BEFORE. Until 2026-08-24 most of these said "no
                    # px_per_m_at_wall", which was a second instrument
                    # disagreeing with the gate about a scale the gate had just
                    # read (see `promote_reading`). What remains is the honest
                    # residue: a frame with no corners gives the row-20 horizon
                    # instrument nothing to fit, and a frame whose chair-rail
                    # and whose side-wall convergence imply two different
                    # cameras cannot be dressed in one meta. Those are facts
                    # about a painting, and they are what the retry packet says.
                    st["status"] = "held"
                    st["candidate"] = r["candidate"]
                    st["correction"] = "camera PASS; held for the promotion instrument: %s" % why
                    failed.append((key, d, st["correction"]))
            else:
                st["status"] = "admitted"
                promoted.append((key, "PASS %+.1f%% focal (promotion not run)"
                                 % d["delta_focal_pct"], d))
        else:
            worst = None
            for r in arrivals:
                # A MEASURE-ERR candidate wrote no reading; its absence is its
                # record, not a crash for the wall behind it.
                jp = os.path.join(OUT, "%s.json" % r["id"])
                if os.path.exists(jp):
                    worst = json.load(open(jp))
            if worst is None:
                st["status"] = "retry"
                st["correction"] = ("no candidate of this wall could be measured "
                                    "at all; see MEASURE-ERR lines")
                failed.append((key, {}, st["correction"]))
                continue
            # A WITHHELD IS NOT A MISS AND MUST NOT BUY A ROLL. `measurement_
            # withheld` is this round's word for "the detector could not run at
            # all", and on the manor that is `hall/N` and `hall/S`: standing
            # 2.15 m from an 8 m wall puts the declared anchor's own datum below
            # the frame, so no painting of that facing can carry a reading and a
            # re-ask carries no correction. The wall holds, its cap untouched,
            # and what it is waiting for is a standpoint, not an image.
            if worst.get("kind") == "measurement_withheld":
                st["status"] = "held"
                st["candidate"] = worst.get("candidate")
                st["correction"] = ("no roll of this facing can be measured: %s"
                                    % worst.get("blocked_on"))
                failed.append((key, worst, st["correction"]))
                continue
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


def recheck_doors(state):
    """[Row 27] Every already-promoted door-bearing wall, re-read and re-decided.

    The twenty-two walls of the first production harvest were promoted with
    their openings PROJECTED from the plan, which is the defect the Captain
    walked into. This puts each of them back through the instrument as it now
    stands: the doors are measured off the painting, the promotion is re-run
    from the same candidate and the same round, and a wall whose ways through
    cannot be read — or read as something that is not a doorway — is TAKEN BACK
    OUT of the store with its reason written into the run state. It goes back
    to the holodeck grid, which is what unestablished space renders as and is
    honest; a painted wall whose door is somewhere else is not.

    It is idempotent: a wall that passes is re-derived to the same bytes.
    """
    walls = []
    for loc in sorted(os.listdir(os.path.join(ROOT, "backdrops"))):
        d = os.path.join(ROOT, "backdrops", loc)
        if loc == "source" or not os.path.isdir(d):
            continue
        for f in sorted(os.listdir(d)):
            if not f.endswith(".meta.json"):
                continue
            meta = json.load(open(os.path.join(d, f)))
            if not any(o.get("kind") == "door" for o in meta.get("openings", [])):
                continue
            walls.append(("%s/%s" % (loc, f[0]), loc, f[0], meta))
    kept, demoted = [], []
    for key, loc, fac, meta in walls:
        cand = str(meta.get("camera_id", "")).replace("measured:", "")
        rnd = meta.get("measured_round") or ""
        doc = os.path.join(HERE, *([rnd] if rnd else []), "%s-%s.json" % (loc, fac))
        if not cand or not os.path.exists(doc):
            demoted.append((key, "the meta names no candidate, or its measurement is gone"))
            continue
        found, _note = door_reading(doc, cand, loc)
        r = subprocess.run(
            ["node", os.path.join(ROOT, "tools", "promote-backdrop.mjs"),
             "--facing", key, "--candidate", cand]
            + (["--round", rnd] if rnd else [])
            + (["--reference", meta["camera_reference"]] if meta.get("camera_reference") else []),
            cwd=ROOT, capture_output=True, text=True)
        if r.returncode == 0:
            kept.append((key, len([f for f in found]), r.stdout.strip().split("\n")[-1]))
        else:
            why = [ln for ln in (r.stdout + r.stderr).strip().split("\n") if ln.strip()]
            demoted.append((key, why[-1] if why else "promote-backdrop refused without a word"))
            for p in (os.path.join(ROOT, "backdrops", loc, fac + ".png"),
                      os.path.join(ROOT, "backdrops", loc, fac + ".meta.json")):
                if os.path.exists(p):
                    os.remove(p)
            st = state["walls"].setdefault(key, {"attempts": 0})
            st["status"] = "held"
            st["correction"] = (
                "row 27: demoted to grid. The promotion now measures each painted "
                "way through off the picture (§11's click target must coincide with "
                "the painted opening) and this wall's does not survive it — "
                + demoted[-1][1])
    bad = _bake()
    return kept, demoted, bad


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--watch", action="store_true",
                    help="keep sweeping; arrivals are processed as they land")
    ap.add_argument("--interval", type=int, default=45)
    ap.add_argument("--no-promote", action="store_true")
    ap.add_argument("--recheck-doors", action="store_true",
                    help="row 27: re-measure and re-decide every promoted "
                         "door-bearing wall against the painted-door rule")
    a = ap.parse_args()

    if a.recheck_doors:
        state = load_state()
        kept, demoted, bad = recheck_doors(state)
        save_state(state)
        for key, n, line in kept:
            print("  %-24s KEPT      %d painted way(s) through | %s" % (key, n, line))
        for key, why in demoted:
            print("  %-24s DEMOTED   %s" % (key, why))
        print("%s  %d kept, %d demoted to grid%s"
              % (time.strftime("%H:%M:%S"), len(kept), len(demoted),
                 ("; BAKE REFUSED: " + bad) if bad else ""))
        return 1 if bad else 0

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
        # THE LINE SAYS WHAT THE STATE SAYS. Every entry in `failed` printed
        # RETRY, including the ones the sweep had recorded as HELD — so the
        # run's own log claimed rolls were being asked for that nothing was
        # asking for. The status is read back out of the state it was just
        # written into rather than assumed from which list the wall is in.
        for key, d, corr in failed:
            print("  %-24s %-9s %s | %s"
                  % (key, state["walls"][key]["status"].upper(),
                     d.get("verdict"), corr))
        for key, d in parked:
            print("  %-24s PARKED    cap spent; wall stays grid, run continues" % key)
        tally = {}
        for w in state["walls"].values():
            tally[w["status"]] = tally.get(w["status"], 0) + 1
        done = tally.get("promoted", 0)
        print("%s  %d promoted, %d retrying, %d held, %d parked, %d still unpainted"
              % (time.strftime("%H:%M:%S"), done, tally.get("retry", 0),
                 tally.get("held", 0), tally.get("parked", 0),
                 tally.get("waiting", 0)))
        if done:
            print("  >> %d wall(s) promoted and baked. `tools/publish-site.sh` is yours to "
                  "run when you want them live - this loop never publishes." % done)
        if not a.watch:
            return 0
        time.sleep(a.interval)


if __name__ == "__main__":
    sys.exit(main())
