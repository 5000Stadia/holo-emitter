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
  * [row 32] It never paints M0's own two rooms. `study` and `hall` are the
    eight facings row 4 produces, probe first and behind Kabe's eye, and a
    manor sweep promoting one of them walks through that order — see
    `M0_ROOMS`.
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

# [row 33] THE SWEEP CLOCKS ITSELF. Every edit this row made to this file is a
# timing line and nothing else — each one marked `[row 33]` — so the measurement
# internals below are untouched and a merge with work on them is trivial. The
# writer never raises and never blocks; see `timings.py`.
import timings  # noqa: E402

MANOR = os.path.join(ROOT, "design", "batches", "row23-scaffold", "manor")
MANIFEST = os.path.join(MANOR, "manifest.json")
STATE = os.path.join(MANOR, "run-state.json")
RETRIES_FILE = os.path.join(MANOR, "retries.json")


def _load_retries():
    """key -> retry rolls, from --emit-retries' own record. Empty when absent."""
    if not os.path.exists(RETRIES_FILE):
        return {}
    doc = json.load(open(RETRIES_FILE))
    out = {}
    for e in doc.get("entries", []):
        out.setdefault(e["key"], []).extend(e.get("rolls", []))
    return out


RETRIES = _load_retries()
OUT = os.path.join(HERE, "manor")

PLAN = os.path.join(ROOT, "fixtures", "demo-study", "plan.json")
_PLAN_CACHE = {}


def facing_of(key):
    """[row 29(a)] The PLAN's own facing record for a wall, read once.

    `design/plan-draft/projection.md`'s authority table makes the drawing law
    (a) for two fields this sweep needs and cannot get anywhere honest else:
    the facing's TYPE, and the depth anchor it carries under that type —
    `camera_wall_m` on an enclosed or corridor facing, `camera_far_m` on an
    open one.

    The manifest is not that authority for either. Its `type` is the ROOM's
    type, so `entrance_court/N` — an enclosed facing of an open room — is
    labelled `open` by it, and a reader routing on that sends four walled
    facings down the vista path. And its `camera_wall_m` is simply absent on an
    open facing, which is the float x None the four open walls died on. The
    emitter now emits `camera_far_m` and `facing_type` beside it
    (`tools/make-scaffold.mjs`) so the NEXT map arrives carrying both; this
    reads the drawing so that THIS map, whose manifest predates that, is not
    stuck behind a re-emit that would move every scaffold digest in it.
    """
    if "plan" not in _PLAN_CACHE:
        _PLAN_CACHE["plan"] = json.load(open(PLAN))
    loc, f = key.split("/")
    room = next((r for r in _PLAN_CACHE["plan"].get("rooms", [])
                 if r.get("id") == loc), None)
    return ((room or {}).get("facings") or {}).get(f) or {}

#: The experiment's own walls. Promotion here would overwrite the ground truth
#: every row-23 number is measured against.
NEVER_PROMOTE = {"study/N", "study/W"}

#: [row 32] M0'S OWN TWO ROOMS, AND THE MANOR LOOP MAY NOT PAINT THEM.
#:
#: `study` and `hall` are the eight facings blueprint §12.5 measures and that
#: the spec list's ROW 4 produces — probe first, `style_block` extracted, the
#: probe pair passed by Kabe, and only then the eight. That order exists so a
#: human sees M0's look before it ships, and a manor sweep that promotes
#: `hall/E` because its horizon happened to fit walks straight through it.
#:
#: It is not a hypothetical. The row-32 sweep admitted `hall/E` and promoting
#: it turned eighteen cases red at once — §12.5's typed per-facing literals,
#: eight clause-ledger cases, and the two committed batches Kabe was shown,
#: which are re-rendered and byte-compared precisely so a picture cannot move
#: under them silently. Every one of those is the acceptance world saying a
#: look changed. The instrument was right about the frame; the ROUTE was wrong.
#:
#: `study/N` and `study/W` above are already painted and stay so; this fence
#: only refuses walls the manor loop has not painted yet. Row 4 deletes it.
M0_ROOMS = {"study", "hall"}


def load_state():
    return json.load(open(STATE)) if os.path.exists(STATE) else {"walls": {}}


def save_state(st):
    os.makedirs(os.path.dirname(STATE), exist_ok=True)
    json.dump(st, open(STATE, "w"), indent=2)


def sha(p):
    return hashlib.sha256(open(p, "rb").read()).hexdigest()



def _indoor_ask(cand_rel):
    """[row 29(a)] Was this candidate asked for with interior fabric in the ask?

    THROUGH THE LINT'S OWN WORD LIST, never a third copy of it. `prompt_lint.py`
    holds the Python one and `tools/room-voices.mjs` holds the JavaScript one,
    and their agreement is already the handshake the suite pins; a list written
    out again here would be the drift that handshake exists to catch.

    Every candidate is written with its own prompt beside it by the emitter, so
    the ask is on disk next to the picture. A candidate with no prompt beside it
    cannot be shown to have been an outdoor ask, and on an outdoor wall that is
    the same answer as a bad one.
    """
    import prompt_lint
    p = os.path.join(ROOT, cand_rel)
    p = p[:-4] + ".prompt.txt" if p.lower().endswith(".png") else p + ".prompt.txt"
    if not os.path.exists(p):
        return True
    return bool(prompt_lint.INTERIOR_FABRIC.search(open(p, encoding="utf-8").read()))


def _correction_for(family, why, reading, entry):
    """[row 32] The forward half of a hold, in words a prompt can act on.

    Production law clause 6: a solution folds into the EMITTER, a GATE or the
    INSTRUMENT, never into a hand-retouched artifact. This is the emitter half
    of row 32's fix — `manorPrompt` carries whatever this returns verbatim, so
    the correction reaches the generator as an instruction rather than reaching
    a transcript as a diagnosis.

    Three rules govern the wording and all three were paid for:

    * IT SAYS WHAT TO DRAW, not what went wrong. "The returns converge too low"
      is a verdict; "the two returns meet at row 526" is a thing to paint.
    * IT NAMES THE ROW, from this wall's own manifest entry. The horizon is the
      one number every manor prompt left unsaid, which is exactly why the
      painted horizons scatter +/-45 px around it while the floor line, which
      the prompt DOES state, lands inside its bracket.
    * IT NAMES NO INTERIOR FABRIC. `room-voices.mjs`'s `carryableOutdoors`
      redacts a correction that does, and a redacted correction is a roll spent
      on "follow the words below" — so these sentences say "the surface
      overhead" and "the wall-foot line" and carry onto a garden wall whole.

    Returns None where the refusal is not row 32's to answer (a doorway the
    plan rules and the painting does not draw), and the wall holds as before.
    """
    if family not in ("suspect-painting", "unfitted-horizon"):
        return None
    hz = entry.get("horizon_y")
    p = (reading or {}).get("_promotion") or {}
    # [row 29(a)] A VISTA HAS NO RETURNS AND NO SURFACE OVERHEAD, so the
    # sentence below cannot be carried onto one: it would tell an outdoor
    # painter to make two side walls meet a ceiling that is not in the picture.
    # An open facing is refused only where its far-line ground row and its own
    # coping ruler disagree about the eye, and the forward half of that is the
    # ground row's position — the one thing a repaint can move.
    if p.get("horizon_instrument") == "far-line-ruler":
        far = p.get("far_line_ruler") or {}
        return (
            "the ground at the far line must meet the foot of the low boundary "
            "wall at row %d of the 1024-row frame — the line Image 2 draws it "
            "on — and the wall's stone coping must run straight across %d "
            "pixels above that, which is its ruled 0.95 m at this view's scale. "
            "This frame puts the ground line at row %d instead. The open sky, "
            "the ground running to the bottom edge and everything else stay "
            "exactly where Image 2 puts them."
            % (round((entry.get("floor_line_y") or 0) * 1024),
               round((far.get("px_per_m_at_far_line") or 0) * 0.95),
               round(far.get("ground_row_px") or 0)))
    row = ("row %d of the %d-row frame"
           % (round(hz * 1024), 1024)) if hz else "the eye line Image 2 marks"
    common = (
        "Both returns must read as real receding surfaces: each meets the "
        "surface overhead along ONE straight unbroken line running from its "
        "corner to the edge of frame, and those two lines must meet each other "
        "at %s — the eye line Image 2 marks. The wall-foot line, the corners "
        "and the scale stay exactly where Image 2 puts them." % row)
    if family == "suspect-painting":
        return (
            "the left and right returns of this wall converge at y %.1f, which "
            "puts the viewer's eye %.3f m above the wall-foot line this frame "
            "draws — nobody stands there, and the frame's own ruler says "
            "otherwise, so the two readings of one picture disagree. %s"
            % ((p.get("ramp") or {}).get("y", float("nan")),
               p.get("eye_height_m") or float("nan"), common))
    return (
        "this frame's returns carry no junction the eye line can be fitted to. "
        "%s" % common)


#: [row 32] THE PER-WALL SETUP, IN ONE PLACE, because two readers now need it.
#:
#: The tolerance sweep measures the same frames the ordinary sweep does, off the
#: same manifest entry, against the same declared camera — and a second copy of
#: this construction would be a second instrument the moment either moved. Only
#: the ROUTE differs between the two callers; the reading is one reading.


def arrivals_for(key, e):
    """Every roll of this wall that is actually on disk, first coat and retry.

    THE RETRY ROLLS ARE ARRIVALS TOO. `--emit-retries` cuts re-ask packets with
    fresh opaque ids recorded in retries.json — a set this sweep predates;
    without this merge the whole second coat lands invisible (found live,
    2026-08-24: 30 returned corrections and the sweep read none of them). The
    manifest's geometry cfg still governs: the voiced scaffolds move labels,
    never geometry, and every anchor stamps at the same row — the voice table's
    own test pins that.
    """
    all_rolls = list(e["rolls"])
    for rr in RETRIES.get(key, []):
        all_rolls.append(rr)
    return [r for r in all_rolls
            if os.path.exists(os.path.join(ROOT, r["candidate"]))]


def ref_for(e):
    """The wall's own declared camera, off its own manifest entry.

    Never a global one. A manor of 88 facings has 88 standpoints and therefore
    88 scales, and pooling them is the defect row 20 removed.
    """
    return dict(focal_px=e["implied_focal_px"], eye_m=1.183,
                horizon_y_px=1024 * 0.51377, band=0.08,
                source="the wall's own manifest entry",
                authority="the meta the page holds for this facing")


def side_for(key, e, fac):
    """The sidecar the row-23 instrument reads this wall's windows out of."""
    side = {"facing": key,
            "meta_used": {"px_per_m_at_wall": e["px_per_m_at_wall"],
                          # An OPEN facing has no wall to be a distance
                          # from; its scale is quoted at the FAR LINE, and
                          # the field name is the mechanism (row 11) — so
                          # both are carried and `row23_lib.camera_distance`
                          # resolves which one this facing has. The manifest
                          # is preferred where it carries the wall distance,
                          # and the drawing supplies the far one, which the
                          # manifest of this map never emitted.
                          "camera_wall_m": (e.get("camera_wall_m")
                                            if e.get("camera_wall_m") is not None
                                            else fac.get("camera_wall_m")),
                          "camera_far_m": (e.get("camera_far_m")
                                           if e.get("camera_far_m") is not None
                                           else fac.get("camera_far_m")),
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
    # [row 29(a)] THE FACING'S TYPE, FROM THE DRAWING. This read `e["type"]`,
    # which is the ROOM's type in the manor manifest — so the four enclosed
    # facings of the two open rooms (`entrance_court/N|E|W`,
    # `entrance_approach/N`) were labelled `open` in every reading they
    # wrote, and a promotion routing on it would take a walled painting down
    # the vista path. The manifest's own `facing_type` is preferred where
    # the emitter now writes one; the drawing answers where it does not.
    side["meta_used"]["facing_type"] = (
        e.get("facing_type") or fac.get("type") or e.get("type"))
    # The anchor's NAME, so an outdoor record does not say "chair-rail".
    # The scaffold's own voice named it when the packet was cut.
    side["meta_used"]["anchor_label"] = {
        "coping": "boundary-wall coping",
        "string_course": "string course",
        "dado_capping": "dado capping",
        "chair_rail": "chair-rail",
    }.get((e.get("voice") or {}).get("anchor"))
    return side


def promote_reading(key, cand_rel, e, side, ref, reading, tolerance=False):
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
    # [row 29(a)] THE OPEN FACING'S PROMOTION IS BUILT NOW, and this is where it
    # was refused. The refusal read "an open facing's far-line frame has no wall
    # plane to carry a scale; its promotion path is not built yet" — true of the
    # path and false of the frame: the scale is carried at the FAR LINE, by the
    # boundary-wall coping the `outdoors_open` voice declares, and
    # `row23_lib._promotion_half_open` reads it there. What survives of the
    # refusal is the honest half: a facing whose record names NEITHER depth
    # anchor still has nothing for a lens to be quoted at, and that is a
    # WITHHELD the instrument itself issues (see `measure_candidate`), so by the
    # time a reading reaches here it has already been said once.
    import row23_lib
    doc, refusals = row23_lib.promotion_doc(
        reading, side, ref, "manor", sha(os.path.join(ROOT, cand_rel)))
    # [row 32] THE FENCE IS STILL A FENCE; THE TOLERANCE RULING IS A SECOND
    # DOOR THROUGH IT AND NOT A HOLE IN IT.
    #
    # A refusal here is what has held the suspect family out of the store: the
    # document the promotion tool reads was never written, so there was nothing
    # to promote from. Under the Captain's ruling the document IS written for
    # the two families named in `row23_lib.TOLERANCE_FAMILIES` — it keeps every
    # honest number it read, including the contradicted ramp and the sentence
    # saying why the reading was refused — and `promote-backdrop.mjs` then
    # requires `--camera-source declared` to touch it. So the wall cannot reach
    # the store by this route without wearing the flag, and a refusal that is
    # NOT one of the two families still stops here exactly as before.
    if doc is not None and refusals and tolerance and \
            doc.get("_hold_family") in row23_lib.TOLERANCE_FAMILIES:
        refusals = []
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
    _t = time.time()                                              # [row 33]
    _n = 0                                                        # [row 33]
    r = subprocess.run(["node", os.path.join(ROOT, "tools", "bake-backdrops.mjs")],
                       cwd=ROOT, capture_output=True, text=True)
    if r.returncode != 0:
        # [row 33] A refused bake is timed too: it is the outcome that costs the
        # sweep a promotion, and it is the one nobody would think to measure.
        timings.record("bake.sweep", _t, time.time(), None,
                       {"worlds": 0, "refused": True, "at": "backdrops"})
        return "backdrops/baked.js: " + (r.stdout + r.stderr).strip()[-300:]
    for d in sorted(os.listdir(os.path.join(ROOT, "fixtures"))):
        fd = os.path.join(ROOT, "fixtures", d)
        if not os.path.exists(os.path.join(fd, "world.json")):
            continue
        r = subprocess.run(["node", os.path.join(ROOT, "tools", "bake-fixtures.mjs"),
                            "--fixture-dir", fd], cwd=ROOT,
                           capture_output=True, text=True)
        _n += 1                                                   # [row 33]
        if r.returncode != 0:
            out.append("fixtures/%s: %s" % (d, (r.stdout + r.stderr).strip()[-300:]))
    timings.record("bake.sweep", _t, time.time(), None,           # [row 33]
                   {"worlds": _n, "refused": bool(out)})
    return out[0] if out else None


def do_promote(key, cand_rel, e, side, ref, reading, tolerance=False):
    """promote-backdrop + bake, for one wall. Never for the experiment's own.

    A PROMOTION THAT CANNOT BE BAKED IS NOT A PROMOTION. The bake runs the
    fixture validator over the meta this wall just wrote, and a refusal there
    is the law speaking about the asset — so the two files are taken back out
    of the store and the wall holds, rather than leaving a wall in `backdrops/`
    that the page cannot be built from.
    """
    _t = time.time()                                              # [row 33]
    ok, why = _do_promote(key, cand_rel, e, side, ref, reading, tolerance)
    timings.record("promote.wall", _t, time.time(), key,           # [row 33]
                   {"candidate": cand_rel, "refused": not ok,
                    "camera_source": "declared" if tolerance else "measured",
                    "why": (why or "")[:300] or None})
    return ok, why


def _do_promote(key, cand_rel, e, side, ref, reading, tolerance=False):
    """[row 33] The promotion itself, unchanged; `do_promote` is now its clock."""
    path, why = promote_reading(key, cand_rel, e, side, ref, reading, tolerance)
    if path is None:
        return False, why
    r = subprocess.run(
        ["node", os.path.join(ROOT, "tools", "promote-backdrop.mjs"),
         "--facing", key, "--candidate", cand_rel, "--round", "manor",
         # The wall answers to the camera its own meta commands: manor walls
         # are scaffolded and derived at the ruled 1024 px lens.
         "--reference", "ruled"]
        # [row 32] AND THE CAMERA ITS HORIZON COMES FROM. Named only on the
        # tolerance route, so the ordinary call is the string it has always
        # been and no promoted meta's bytes move.
        + (["--camera-source", "declared"] if tolerance else []),
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
                         find_corners_recession, ceiling_ramp_vp, horizon_votes,
                         light, EYE_RANGE)
    picks = dict(pick_floor=pick_floor, module_in_bands=module_in_bands,
                 pick_ceiling=pick_ceiling,
                 find_corners_recession=find_corners_recession,
                 ceiling_ramp_vp=ceiling_ramp_vp, horizon_votes=horizon_votes,
                 light=light, EYE_RANGE=EYE_RANGE)
    os.makedirs(OUT, exist_ok=True)

    promoted, failed, parked, waiting = [], [], [], []
    for e in manifest["entries"]:
        if e.get("skipped"):
            continue
        key = e["key"]
        st = state["walls"].setdefault(key, {"attempts": 0, "status": "waiting"})
        # THE STORE IS THE TRUTH IN BOTH DIRECTIONS. Below, a wall with art and
        # no state is recorded as promoted. This is the mirror the loop was
        # missing: a wall whose STATE says promoted and whose art is gone is
        # not promoted, it is invisible — the sweep skipped it, the store had
        # nothing, and the page rendered grid while the ledger said painted.
        # It happens the moment a promotion clause takes a wall back out (row
        # 27's door rule, row 32's flight rule) and anything afterwards reads a
        # state file written before that. Re-decided from the pixels, like any
        # other wall.
        loc0, fac0 = key.split("/")
        if st["status"] == "promoted" and not os.path.exists(
                os.path.join(ROOT, "backdrops", loc0, fac0 + ".meta.json")):
            print("  %-24s RE-DECIDE  state said promoted and the store holds no art"
                  % key)
            st["status"] = "waiting"
            st.pop("hold_family", None)
        # [row 29(a)] A PARKED WALL IS RE-DECIDED FROM THE PIXELS TOO, which is
        # the same sentence the RE-DECIDE guard above is written in and the same
        # doctrine — it was simply never applied to this status. A parked wall
        # was skipped entirely, so whatever correction it happened to be
        # carrying when its cap ran out stayed on it forever, whichever route
        # wrote it. `entrance_court/S` is the case: `--recheck-doors` took it
        # back out of the store with a sentence about its indoor ASK, the next
        # sweep parked it, and the record then read `hold_family: camera-miss`
        # beside a correction about a candidate the wall no longer has. The cap
        # still governs — a parked wall buys no roll and stays parked — but what
        # it says about itself is re-derived from the frames on disk. The cost is
        # four walls' candidates a sweep.
        #
        # This also replaces row 32's stamp, which stood here and read: "A
        # PARKED WALL NAMES ITS SUB-FAMILY TOO, even though the sweep does not
        # re-read it... this stamps what the wall's own record already says and
        # measures nothing." Its claim — every stalled wall names which thing is
        # true of it, so the ledger can say how many are one thing — is
        # unchanged and now holds by MEASUREMENT rather than by assertion: the
        # parked branch below writes the family and the diagnosed correction
        # together, off this pass's own reading.
        if st["status"] == "promoted":
            # [row 29(a)] AND NOTHING IS STAMPED ON AN ALREADY-PROMOTED WALL.
            # A draft of this cleared `correction` here as well as at the
            # promotion below, on the reasoning that a painted wall is not
            # waiting for a repaint. It is not that simple: `privy_garden/N` is
            # promoted and its `correction` is KABE'S OWN VETO, the sentence
            # that sent it back — a record of how the wall got here rather than
            # a claim about where it is going, and the one human-authored line
            # in this file. `room-voices.spec` reads it. A wall the sweep is not
            # re-deciding is a wall it has nothing new to say about, so it says
            # nothing; the clearing happens where the promotion is actually
            # performed, against a correction that promotion just answered.
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

        # [row 29(a)] The DRAWING's own facing record, read before anything
        # routes on the facing's type — see `facing_of`; and every roll of this
        # wall that is on disk, first coat and retry — see `arrivals_for`.
        fac = facing_of(key)
        arrivals = arrivals_for(key, e)
        # [row 29(a)] AN OUTDOOR WALL'S CANDIDATES ARE THE ONES IT WAS ASKED FOR
        # OUTDOORS. `entrance_court/S`'s two ORIGINAL rolls were painted before
        # the `outdoors_open` voice existed, from a prompt that asked for oak
        # panelling and a chair-rail, and they are panelled interiors with two
        # enclosed corners. The camera gate reads them happily — it measures the
        # panelling's chair-rail, calls it the boundary wall's coping and
        # returns +4.5 % — so left in the pool they are chosen OVER the wall's
        # own outdoor re-asks and the manor's front court ships as a parlour.
        # `promote-backdrop.mjs` refuses them too (one rule, both ends); they
        # are dropped HERE as well so the wall falls to its outdoor rolls and
        # earns their correction, rather than holding on a refusal about an ask
        # nobody will make again.
        if fac.get("type") == "open":
            keep, dropped = [], []
            for r in arrivals:
                if _indoor_ask(r["candidate"]):
                    dropped.append(r["id"])
                else:
                    keep.append(r)
            for rid in dropped:
                print("  %-24s INDOOR-ASK %s: painted from a prompt that names "
                      "interior fabric, before this wall had an outdoor voice"
                      % (key, rid))
            if dropped and not keep:
                # Every roll this wall has was asked for indoors. That is not a
                # wall waiting for art — the art arrived and is of the wrong
                # building — so it holds under its own name and says so.
                st["status"] = "held"
                st["hold_family"] = "indoor-ask-outdoor-wall"
                st["correction"] = (
                    "every candidate of this open facing was painted from a "
                    "prompt naming interior fabric, before the wall had an "
                    "outdoor voice; it needs a roll asked under `outdoors_open`")
                failed.append((key, {}, st["correction"]))
                continue
            arrivals = keep
        if not arrivals:
            waiting.append(key)
            continue

        ref = ref_for(e)
        side = side_for(key, e, fac)
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
            # [row 33] A wall leaving the pipeline is a leave event whichever
            # door it goes out of; without this, a parked wall reads as pending
            # for the rest of the ledger and every gap after it reads IDLE.
            _now = time.time()
            timings.record("park.wall", _now, _now, key,
                           {"why": "config derivation failed", "error": str(_ex)[:200]})
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
            _t = time.time()                                      # [row 33]
            try:
                d = row23_lib.measure_candidate(p, side, cfg, ref, picks)
            except Exception as _mex:
                # [row 33] A MEASURE-ERR is a measurement that ran and cost its
                # time; leaving it out would make the instrument look faster
                # than it is on exactly the frames it struggles with.
                timings.record("measure.candidate", _t, time.time(), key,
                               {"roll_id": r["id"], "candidate": r["candidate"],
                                "verdict": "MEASURE-ERR", "error": str(_mex)[:200]})
                print("  %-24s MEASURE-ERR %s: %s" % (key, r["id"], _mex))
                continue
            timings.record("measure.candidate", _t, time.time(), key,  # [row 33]
                           {"roll_id": r["id"], "candidate": r["candidate"],
                            "verdict": d.get("verdict"), "kind": d.get("kind")})
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
                st["hold_family"] = "fenced-ground-truth"
                st["why"] = ("this wall is the experiment's own ground truth; "
                             "promoting it would overwrite the reference every "
                             "row-23 number is measured against")
                promoted.append((key, "ADMITTED, fenced from promotion", d))
            elif key.split("/")[0] in M0_ROOMS:
                st["status"] = "admitted-not-promoted"
                st["hold_family"] = "fenced-m0-row4"
                st["why"] = ("this wall is one of M0's own eight facings; the "
                             "spec list's row 4 produces them probe-first and "
                             "behind Kabe's eye, and a manor sweep promoting "
                             "one walks through that order. The camera is "
                             "admitted and the frame is on file; the ROUTE is "
                             "row 4's, not this loop's")
                promoted.append((key, "ADMITTED, fenced from promotion (M0, row 4's)", d))
            elif do_promote:
                side["candidate"] = r["candidate"]
                ok, why = do_promote_fn(key, r["candidate"], e, side, ref, d)
                if ok:
                    st["status"] = "promoted"
                    st["candidate"] = r["candidate"]
                    # [row 29(a)] A PROMOTED WALL CARRIES NO FORWARD HALF, AND
                    # NOTHING IS DELETED TO GIVE IT ONE. The three vistas came
                    # out of this branch still carrying `hold_family:
                    # unmeasurable-candidate` and the correction "no candidate
                    # of this wall could be measured at all" — written while the
                    # instrument was crashing on them, and true of nothing now.
                    # A record saying a painted wall is waiting for a repaint is
                    # the ledger lying about the store, which is the RE-DECIDE
                    # guard's own defect read from the other side.
                    #
                    # But a correction is not only a forward half: on
                    # `privy_garden/N` it is KABE'S OWN VETO, the one
                    # human-authored line in this file, and a first draft of
                    # this deleted it. So it MOVES rather than goes — the
                    # correction this promotion answered, kept under a name that
                    # is past tense — and the two present-tense fields stop
                    # claiming a wall in the store is waiting for anything.
                    if st.get("correction") is not None:
                        st["answered_correction"] = st.pop("correction")
                    st.pop("hold_family", None)
                    promoted.append((key, "PASS %+.1f%% focal, promoted and baked"
                                     % d["delta_focal_pct"], d))
                else:
                    # THE CAMERA PASSED AND THE PROMOTION REFUSED — and since
                    # row 32 that is no longer one situation with one cost.
                    #
                    # Until 2026-08-24 most of these said "no px_per_m_at_wall",
                    # which was a second instrument disagreeing with the gate
                    # about a scale the gate had just read (see
                    # `promote_reading`), and the wall HELD because a retry
                    # would have spent a roll repainting a frame that was
                    # already admissible. That reasoning was right about an
                    # instrument failure and wrong about a picture failure, and
                    # the run then held 58 of 85 walls on it.
                    #
                    # So the refusal now carries a NAMED SUB-FAMILY and the
                    # sub-family decides what it costs:
                    #
                    #   suspect-painting   the instrument read this frame's
                    #                      horizon to inside the standing
                    #                      licence and it disagrees with the
                    #                      frame's own ruler. That is a fact
                    #                      about the PAINTING, a repaint can
                    #                      answer it, and the correction says
                    #                      what to move — so it buys a roll.
                    #   unfitted-horizon   the frame fixed no horizon at all.
                    #                      Also a fact about the painting (its
                    #                      side walls draw no junction the two
                    #                      ramps can be fitted to), and the
                    #                      correction is the forward half of
                    #                      that sentence — so it buys a roll
                    #                      too, up to the same cap.
                    #   anything else      the older refusals, unchanged: a
                    #                      doorway the plan rules and the
                    #                      painting does not draw. Those hold.
                    fam = ((d.get("_promotion") or {}).get("hold_family")
                           if isinstance(d, dict) else None)
                    corr = _correction_for(fam, why, d, e)
                    st["candidate"] = r["candidate"]
                    if corr and st["attempts"] < e.get("retry_cap", 3):
                        st["status"] = "retry"
                        st["correction"] = corr
                        st["hold_family"] = fam
                    else:
                        st["status"] = "held"
                        st["hold_family"] = fam or "promotion-refused"
                        st["correction"] = (
                            "camera PASS; held for the promotion instrument "
                            "[%s]: %s" % (st["hold_family"], corr or why))
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
                # [row 32] EVERY WALL NAMES ITS SUB-FAMILY, including the ones
                # that never reached the horizon instrument at all. A hold with
                # no name is the state row 32 was allocated out of: 58 walls
                # holding, and the ledger unable to say how many were one thing.
                st["hold_family"] = "unmeasurable-candidate"
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
                st["hold_family"] = "standpoint-out-of-frame"
                st["candidate"] = worst.get("candidate")
                st["correction"] = ("no roll of this facing can be measured: %s"
                                    % worst.get("blocked_on"))
                failed.append((key, worst, st["correction"]))
                continue
            # [row 29(a)] THE DIAGNOSED CAUSE IS WRITTEN BEFORE THE ROUTE IS
            # CHOSEN, so a PARKED wall carries it too. Production law clause 2
            # asks for every miss logged WITH ITS WHY, and the parked branch
            # below wrote only "the retry cap is spent" — which is the route,
            # not the cause. `entrance_court/S` came out of it carrying a
            # correction left over from a different pass, about a candidate it
            # no longer has: the ledger describing a wall that no longer exists.
            ppm = worst.get("px_per_m_at_wall")
            want = e["px_per_m_at_wall"]
            # THE PLANE THE SCALE IS QUOTED AT HAS TWO NAMES. An open facing has
            # no wall plane, so a correction telling its painter to draw N px/m
            # "at the wall plane" names a surface that is not in the picture —
            # and the second sentence named interior fabric ("the chair-rail")
            # on a wall where `room-voices.mjs` would redact the whole
            # correction for it.
            where = ("the far line" if (side["meta_used"].get("facing_type")
                                        == "open") else "the wall plane")
            anchor_name = side["meta_used"].get("anchor_label") or (
                "boundary-wall coping"
                if side["meta_used"].get("facing_type") == "open"
                else "chair-rail")
            st["correction"] = (
                "draw %.3fx larger: %.1f px/m at %s, not %.1f"
                % (want / ppm, want, where, ppm)) if ppm else (
                "the %s the prompt declares is not in the frame the licence "
                "allows; nothing in this painting converts to a scale"
                % anchor_name)
            st["candidate"] = worst.get("candidate")
            st["hold_family"] = "camera-miss"
            if st["attempts"] >= e.get("retry_cap", 3):
                st["status"] = "parked"
                st["why"] = "the retry cap is spent; the wall stays grid and the run continues"
                _now = time.time()                                # [row 33]
                timings.record("park.wall", _now, _now, key,
                               {"why": "retry cap spent", "attempts": st["attempts"],
                                "correction": st["correction"]})
                parked.append((key, worst))
            else:
                st["status"] = "retry"
                st.pop("why", None)
                failed.append((key, worst, st["correction"]))
    return promoted, failed, parked, waiting


def recheck_doors(state):
    """[Row 27, widened at row 32] Every promoted wall, re-decided by the law as it now stands.

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
            # [row 32] EVERY PROMOTED WALL, not only the door-bearing ones.
            # This loop was cut for row 27's painted-door rule and filtered on
            # `openings` because that was the only clause it was answering. A
            # promotion clause that is not about doors — row 32's flight
            # clause, for one — then had no way to reach the walls already in
            # the store, and `back_stair/W` sat there deleting a staircase it
            # had been promoted before the clause existed. The filter is the
            # store itself now: if it is promoted, the law as it stands today
            # is asked about it.
            walls.append(("%s/%s" % (loc, f[0]), loc, f[0], meta))
    kept, demoted = [], []
    for key, loc, fac, meta in walls:
        cand = str(meta.get("camera_id", "")).replace("measured:", "")
        rnd = meta.get("measured_round") or ""
        doc = os.path.join(HERE, *([rnd] if rnd else []), "%s-%s.json" % (loc, fac))
        if not cand or not os.path.exists(doc):
            demoted.append((key, "the meta names no candidate, or its measurement is gone"))
            continue
        # THE DOOR READING STILL ONLY RUNS ON A DOOR-BEARING WALL. Widening
        # the wall list above widened this too for one draft, and it patched
        # `openings: []` into `cand6/study-W.json` and `cand5ref/study-N.json`
        # — round-locked corpora, byte-compared by `plan.spec`. A promotion
        # clause may re-decide any wall in the store; it may not rewrite the
        # record of a round that never asked the question.
        found = []
        if any(o.get("kind") == "door" for o in meta.get("openings", [])):
            found, _note = door_reading(doc, cand, loc)
        r = subprocess.run(
            ["node", os.path.join(ROOT, "tools", "promote-backdrop.mjs"),
             "--facing", key, "--candidate", cand]
            + (["--round", rnd] if rnd else [])
            + (["--reference", meta["camera_reference"]] if meta.get("camera_reference") else [])
            # [row 32] AND THE CAMERA SOURCE, read back off the meta for the
            # same reason the round and the reference are: a wall promoted
            # under the tolerance ruling is RE-DECIDED under it too, and
            # re-running this tool without the flag would refuse it on
            # `tolerance.suspect_undeclared` and demote a wall the Captain
            # admitted.
            + (["--camera-source", meta["camera_source"]]
               if meta.get("camera_source") else []),
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


APPROVALS = os.path.join(ROOT, "design", "approvals.log")


def tolerance_ruling():
    """The Captain's ruling, read from ITS OWN HOME and never copied here.

    design/approvals.log is where a human's word lives in this project, and the
    tolerance sweep exists only because one is on that ledger. Reading it rather
    than restating it means the mode cannot outlive the ruling: strike the line
    and the sweep refuses to run, which is the honest behaviour for a route
    whose entire authority is a sentence somebody said.

    The meta's own citation is `promote-backdrop.mjs`'s to write; this is the
    sweep's check that there is something to cite.
    """
    if not os.path.exists(APPROVALS):
        return None
    for ln in reversed(open(APPROVALS, encoding="utf-8").read().splitlines()):
        if "suspect-painting tolerance" in ln:
            return ln.strip()
    return None


def tolerance_sweep(manifest, state, dry_run=True):
    """[row 32, the Captain's ruling 2026-08-24] The suspect family, promoted.

    A SECOND PASS OVER WALLS THE FIRST ONE HELD, and only over those. The
    ordinary sweep decides every wall on its own art; this one takes the walls
    it decided against for one named reason — the perspective is unusable while
    the ruler is fine — and re-decides them under the declared camera.

    WHAT IT WILL NOT DO:

      * It never touches a wall the ordinary sweep is still working. A wall in
        `retry` has rolls coming and its cap unspent; promoting it here would
        spend the Captain's tolerance on a wall that was about to be repainted
        for free. Only `held` and `parked` walls — the ones with nothing else
        coming — are eligible, which is also why this mode is run AFTER the
        production test's returns are in and never over them.
      * It never widens a band. Every wall here still has to produce a camera
        PASS on this pass's own reading; a wall whose scale has drifted out of
        ±8 % since it was held is not a suspect, it is a miss, and it stays
        held with its own correction untouched.
      * It never promotes a fenced wall (`NEVER_PROMOTE`, `M0_ROOMS`) and never
        touches art already in the store.

    `dry_run` is the mode's default in every sense that matters: it measures
    everything, decides everything, writes NOTHING — no document, no meta, no
    run state — and prints what would happen and why. The ruling is a licence
    to promote a family, not a licence to promote without looking.
    """
    import row23_lib
    from measure import (pick_floor, module_in_bands, pick_ceiling,
                         find_corners_recession, ceiling_ramp_vp, horizon_votes,
                         light, EYE_RANGE)
    picks = dict(pick_floor=pick_floor, module_in_bands=module_in_bands,
                 pick_ceiling=pick_ceiling,
                 find_corners_recession=find_corners_recession,
                 ceiling_ramp_vp=ceiling_ramp_vp, horizon_votes=horizon_votes,
                 light=light, EYE_RANGE=EYE_RANGE)
    ruling = tolerance_ruling()
    would, skipped = [], []
    for e in manifest["entries"]:
        if e.get("skipped"):
            continue
        key = e["key"]
        st = state["walls"].get(key) or {}
        loc, fac_f = key.split("/")
        if st.get("status") not in ("held", "parked"):
            continue
        if st.get("hold_family") not in row23_lib.TOLERANCE_FAMILIES:
            continue
        if key in NEVER_PROMOTE or loc in M0_ROOMS:
            skipped.append((key, st.get("hold_family"),
                            "fenced from promotion by this loop"))
            continue
        if os.path.exists(os.path.join(ROOT, "backdrops", loc, fac_f + ".png")):
            skipped.append((key, st.get("hold_family"), "art already in the store"))
            continue
        fac = facing_of(key)
        if fac.get("type") == "open":
            # An open frame's horizon is ALREADY declared, so there is nothing
            # for this route to give it — `promote-backdrop.mjs` refuses one by
            # name and the sweep says so here rather than spending a reading.
            skipped.append((key, st.get("hold_family"),
                            "an open facing: its horizon is already the declared "
                            "eye line and it has no second reading to be "
                            "tolerant of"))
            continue
        arrivals = arrivals_for(key, e)
        if not arrivals:
            skipped.append((key, st.get("hold_family"), "no candidate on disk"))
            continue
        ref = ref_for(e)
        side = side_for(key, e, fac)
        try:
            cfg = row23_lib.cfg_from_sidecar(side)
        except Exception as _ex:
            skipped.append((key, st.get("hold_family"), "config: %s" % _ex))
            continue
        best = None
        for r in arrivals:
            try:
                d = row23_lib.measure_candidate(
                    os.path.join(ROOT, r["candidate"]), side, cfg, ref, picks)
            except Exception as _mex:
                continue
            d["id"], d["candidate"] = r["id"], r["candidate"]
            if d["verdict"] == "PASS" and (
                    best is None or
                    abs(d["delta_focal_pct"]) < abs(best[1]["delta_focal_pct"])):
                best = (r, d)
        if best is None:
            # THE SCALE GATE IS NOT WAIVED AND THIS IS WHERE THAT IS TRUE.
            skipped.append((key, st.get("hold_family"),
                            "no candidate of this wall passes the camera band on "
                            "this pass; that is a miss, not a suspect"))
            continue
        r, d = best
        fam = (d.get("_promotion") or {}).get("hold_family")
        if fam not in row23_lib.TOLERANCE_FAMILIES:
            # The state said suspect and this pass's own reading does not. The
            # reading wins — the state file is a record, the picture is the fact
            # — and the wall goes back to the ordinary sweep.
            skipped.append((key, st.get("hold_family"),
                            "this pass reads it as %s; the ordinary sweep owns it"
                            % (fam or "clean")))
            continue
        would.append((key, fam, r, d))
    if dry_run:
        return would, skipped, None
    if not ruling:
        return [], skipped, ("design/approvals.log carries no suspect-painting "
                             "tolerance line; this mode has no authority to run")
    promoted = []
    for key, fam, r, d in would:
        entry = e_of(manifest, key)
        side = side_for(key, entry, facing_of(key))
        side["candidate"] = r["candidate"]
        ok, why = do_promote(key, r["candidate"], entry, side, ref_for(entry), d,
                             tolerance=True)
        st = state["walls"].setdefault(key, {"attempts": 0})
        if ok:
            st["status"] = "promoted"
            st["candidate"] = r["candidate"]
            # THE CORRECTION IS NOT ANSWERED AND IS NOT DELETED. The repaint
            # this wall was asked for never happened; the Captain accepted the
            # drift instead. Kept under a past-tense name so the two
            # present-tense fields stop claiming a wall in the store is waiting
            # for a roll, and so the record still says what the frame does.
            if st.get("correction") is not None:
                st["waived_correction"] = st.pop("correction")
            st["hold_family"] = fam
            st["suspect_perspective"] = True
            st["camera_source"] = "declared"
            st["tolerance_ruling"] = ruling
            promoted.append((key, fam, r, d))
        else:
            st["status"] = "held"
            st["hold_family"] = fam
            st["why"] = "the tolerance promotion was refused: %s" % why
            skipped.append((key, fam, why))
    return promoted, skipped, None


def e_of(manifest, key):
    """This wall's manifest entry, by key."""
    return next(x for x in manifest["entries"] if x["key"] == key)


def _tolerance_line(key, fam, r, d):
    """One dry-run row: what this wall would carry and where each field is from."""
    p = d.get("_promotion") or {}
    m = d.get("_measured_px") or {}
    return ("  %-24s %-17s %s | measured %.1f px/m (%+.1f%% focal, %+.1f%% eye), "
            "floor line y %d, rail %d px — DECLARED horizon %s | %s"
            % (key, fam, r["id"], d["px_per_m_at_wall"], d["delta_focal_pct"],
               d["delta_eye_pct"], m.get("wall_floor_line_y_px", -1),
               m.get("dado_rail_above_floor_px", -1),
               ("y %.1f (this frame's own returns converge at y %.1f)"
                % (1024 * 0.51377, (p.get("ramp") or {}).get("y", float("nan"))))
               if fam == "suspect-painting" else
               "y %.1f (this frame's returns converge nowhere admissible)"
               % (1024 * 0.51377),
               "eye would be %.3f m" % ((m.get("wall_floor_line_y_px", 0)
                                         - 1024 * 0.51377)
                                        / d["px_per_m_at_wall"])))


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--watch", action="store_true",
                    help="keep sweeping; arrivals are processed as they land")
    ap.add_argument("--interval", type=int, default=45)
    ap.add_argument("--no-promote", action="store_true")
    ap.add_argument("--recheck-doors", action="store_true",
                    help="row 27: re-measure and re-decide every promoted "
                         "door-bearing wall against the painted-door rule")
    ap.add_argument("--tolerance-sweep", action="store_true",
                    help="row 32: promote the remaining suspect-family holds on "
                         "the declared camera, under the Captain's tolerance "
                         "ruling (design/approvals.log 2026-08-24)")
    ap.add_argument("--dry-run", action="store_true",
                    help="with --tolerance-sweep: measure and decide, write "
                         "nothing, and print what would promote and why")
    a = ap.parse_args()

    if a.dry_run and not a.tolerance_sweep:
        print("row23-run: --dry-run belongs to --tolerance-sweep; the ordinary "
              "sweep's dry run is --no-promote, which already exists")
        return 2

    if a.tolerance_sweep:
        ruling = tolerance_ruling()
        if not ruling:
            print("row23-run: design/approvals.log carries no suspect-painting "
                  "tolerance line — this mode is a human's ruling and nothing else")
            return 1
        if not os.path.exists(MANIFEST):
            print("row23-run: no manifest")
            return 1
        manifest = json.load(open(MANIFEST))
        state = load_state()
        out, skipped, err = tolerance_sweep(manifest, state, dry_run=a.dry_run)
        if err:
            print("row23-run: " + err)
            return 1
        print("  under: %s" % ruling)
        for key, fam, r, d in out:
            print(_tolerance_line(key, fam, r, d))
            if not a.dry_run:
                print("  %-24s PROMOTE   declared camera, flagged suspect" % key)
        for key, fam, why in skipped:
            print("  %-24s %-17s NOT PROMOTED: %s" % (key, fam or "-", why))
        if a.dry_run:
            print("%s  DRY RUN: %d wall(s) would promote on the declared camera, "
                  "%d would not; nothing was written"
                  % (time.strftime("%H:%M:%S"), len(out), len(skipped)))
            return 0
        save_state(state)
        bad = _bake()
        print("%s  %d wall(s) promoted under the tolerance ruling, %d not%s"
              % (time.strftime("%H:%M:%S"), len(out), len(skipped),
                 ("; BAKE REFUSED: " + bad) if bad else ""))
        return 1 if bad else 0

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
        _t = time.time()                                          # [row 33]
        promoted, failed, parked, waiting = sweep(manifest, state, not a.no_promote)
        # [row 33] The pass itself, so a sweep that finds nothing is on the clock
        # too: an empty pass every 45 seconds is the shape of the idle the ledger
        # is here to find, and it is invisible if only the work is timed.
        timings.record("sweep.pass", _t, time.time(), None,
                       {"promoted": len(promoted), "failed": len(failed),
                        "parked": len(parked), "waiting": len(waiting),
                        "promote_enabled": not a.no_promote})
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
