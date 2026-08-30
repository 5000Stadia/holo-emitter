#!/usr/bin/env python3
"""The manor production loop — arrival to promotion, one command.

    python3 design/plan-draft/measured/row23_run.py            # one sweep
    python3 design/plan-draft/measured/row23_run.py --watch    # keep sweeping
    python3 design/plan-draft/measured/row23_run.py --tolerance-sweep --dry-run
                          # [row 32] what the suspect family would promote on
                          # the declared camera, under the Captain's ruling —
                          # measured, decided, nothing written. Drop --dry-run
                          # to do it. See `tolerance_sweep`.
    python3 design/plan-draft/measured/row23_run.py --supersede-only
                          # [row 40 seam] ONLY the supersede route, as a table:
                          # every promoted wall whose own room re-asked it and
                          # whose consistency roll has come back. Add
                          # `--only <loc>/<F>` for one wall, `--dry-run` to see
                          # which walls qualify without promoting anything. The
                          # standing sweep runs this route inside itself; this
                          # is it alone. See `supersede_pass`.

[HUMAN, 2026-08-23] "We really need to consider the most efficient way to go from
schematic/description to full assets. To the degree we hope to one pass parallel
all assets created few turns each to full completion."

So this is a SWEEP, not a queue. It reads whatever is on disk, in whatever order
it landed, and each wall is decided on its own: measured against the camera its
own manifest entry declares, promoted if it passes, given a retry packet with a
correction if it does not, parked when its cap is spent. Nothing waits for
anything else, and running it again after more frames arrive costs only the new
ones.

AND EVERY WALL LEAVES BY A NAMED DOOR. A camera PASS the promotion instrument
refuses is not the end of the wall: row 35's snap and row 32's tolerance ruling
are two exits the Captain ruled, they used to be tools run by hand between
passes, and they are now taken inside the pass in the order the Navigator was
applying them — snap first (with B-ASSEMBLY's door-void repair as its second
half), tolerance second, grid last. Each wall's door is on its own run-state
record as `exit`, with the reason it went out of that one. See `route_exit`,
`SNAP_ROUND` and `DOOR_REPAIR_TOOL`.

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
import row23_lib  # noqa: E402

# THE LOCATION, AS DATA (clause 8). The batch, store and readings directories
# were typed here with one house's name in them; they are the active pack's now.
from pack import active_pack

_PACK = active_pack()
BATCH = _PACK.paths["batch_dir"]
MANIFEST = os.path.join(BATCH, "manifest.json")
STATE = os.path.join(BATCH, "run-state.json")
RETRIES_FILE = os.path.join(BATCH, "retries.json")


def _load_retries():
    """key -> retry rolls, from --emit-retries' own record. Empty when absent."""
    if not os.path.exists(RETRIES_FILE):
        return {}
    doc = json.load(open(RETRIES_FILE))
    out = {}
    for e in doc.get("entries", []):
        out.setdefault(e["key"], []).extend(e.get("rolls", []))
    return out


def _load_retry_entries():
    """key -> the WHOLE retry entries, not just their rolls.

    `_load_retries` above flattens the file to the one thing the arrival path
    needs — where the images are. The supersede route needs the other half of
    each entry: WHY the packet was cut. `--emit-consistency` stamps a
    `consistency` block on the entries it cuts (retries.json says so in its own
    `_consistency` key) and that block is this route's provenance; without the
    entries there is nothing to read it off. Same file, same mtime guard, one
    extra parse a worklist change.
    """
    if not os.path.exists(RETRIES_FILE):
        return {}
    doc = json.load(open(RETRIES_FILE))
    out = {}
    for e in doc.get("entries", []):
        out.setdefault(e["key"], []).append(e)
    return out


RETRIES = _load_retries()
RETRY_ENTRIES = _load_retry_entries()
REMEASURE = "--remeasure" in sys.argv
_RETRIES_MTIME = os.path.getmtime(RETRIES_FILE) if os.path.exists(RETRIES_FILE) else 0


def refresh_retries():
    """[row 33 seam fix] A long-lived watcher may not go stale against its own
    worklist. Three times now a writer added retry rolls after this module
    loaded and the sweep walked past returned work while reporting healthy —
    the second coat, the retry-5 production test, the content-gap nine. The
    watch loop calls this each pass; the mtime check keeps it free."""
    global RETRIES, RETRY_ENTRIES, _RETRIES_MTIME
    m = os.path.getmtime(RETRIES_FILE) if os.path.exists(RETRIES_FILE) else 0
    if m != _RETRIES_MTIME:
        RETRIES = _load_retries()
        RETRY_ENTRIES = _load_retry_entries()
        _RETRIES_MTIME = m
        print("  retries.json moved - worklist reloaded (%d walls)" % len(RETRIES))
OUT = _PACK.paths["readings_dir"]
from instrument import INSTRUMENT_ID, stamp as _stamp_instrument, current as _instrument_current

PLAN = _PACK.paths["plan"]
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

#: [row 32] M0'S OWN TWO ROOMS, AND THE BATCH LOOP MAY NOT PAINT THEM.
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
    # The word list is the ACTIVE PACK's now (`world.json`'s
    # `refusals.interior_fabric`), reached through the lint that owns it.
    return bool(prompt_lint.interior_fabric().search(open(p, encoding="utf-8").read()))


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
    """Delegate. One home: `row23_lib.reference_from_entry` (row 35's merge —
    two builders extracted the same helper to two homes; the lib won so that
    one wall cannot be described two ways)."""
    return row23_lib.reference_from_entry(e)

def side_for(key, e, fac):
    """Delegate. One home: `row23_lib.side_from_entry` (see ref_for)."""
    return row23_lib.side_from_entry(key, e, fac)

def picks_for_instrument():
    """The corpus's own detectors, injected into the row-23 instrument.

    Lifted out of `sweep` so that the supersede route reads a roll on exactly
    the instrument the arrivals are read on — one instrument per quantity is
    this file's own law (see `promote_reading`), and a second `picks` dict
    assembled somewhere else is the first step toward a second instrument.
    """
    from measure import (pick_floor, module_in_bands, pick_ceiling,
                         find_corners_recession, ceiling_ramp_vp, horizon_votes,
                         light, EYE_RANGE)
    return dict(pick_floor=pick_floor, module_in_bands=module_in_bands,
                pick_ceiling=pick_ceiling,
                find_corners_recession=find_corners_recession,
                ceiling_ramp_vp=ceiling_ramp_vp, horizon_votes=horizon_votes,
                light=light, EYE_RANGE=EYE_RANGE)


def measure_roll(key, r, side, cfg, ref, picks):
    """ONE ROLL, READ ONCE, CACHED BY ID. Returns the reading, or None.

    This was the body of `sweep`'s per-arrival loop and it is unchanged; it is
    a function now because the supersede route measures a roll too, and a
    routed reading that took a different path to the same number would be the
    second instrument this file has already paid to delete once.

    [row 30 cut, 2026-08-24] A READING IS TAKEN ONCE. The sweep was re-measuring
    every held wall's every candidate on every pass — 27 holds x (measure + door
    read) — and after the host restart a single pass had not finished in two
    hours while new returns queued behind old holds. A candidate's reading is a
    pure function of its bytes and the instrument; it is cached by id and reused
    until `--remeasure` says the instrument moved.

    A candidate the measurement cannot read is that CANDIDATE's failure, never
    the sweep's: logged, skipped (None), and the wall parks at its cap like any
    other run of misses. The alternative — a per-pixel surprise anywhere in 170
    images taking the loop down — is the crash class this run has now paid for
    twice.
    """
    _t = time.time()                                              # [row 33]
    _cached = os.path.join(OUT, "%s.json" % r["id"])
    # [underground-2] THE BYTES, NOT THE ID. A re-emitted ask reuses its roll id
    # and the painter delivers a NEW painting at the SAME path; a cache keyed by
    # id then serves the old painting's reading for the new bytes (platform/E
    # held twice on a reading of a frame that no longer existed). The reading
    # names the file's digest and is retaken when the bytes moved.
    import hashlib as _hl
    try:
        _sha = _hl.sha256(open(os.path.join(ROOT, r["candidate"]), "rb").read()).hexdigest()
    except OSError:
        _sha = None
    if os.path.exists(_cached) and not REMEASURE:
        _old = json.load(open(_cached))
        if _old.get("candidate_sha256") != _sha:
            _old = {}
        # [Kabe, 2026-08-30] A READING IS A FUNCTION OF THE BYTES *AND THE
        # INSTRUMENT*. The floor rule changed (foot, not shadow) and a pass
        # re-promoted twelve walls on their cached readings — the old rows,
        # to the pixel. A reading names the instrument it was taken with, and
        # one taken by another is taken again.
        if _old and _instrument_current(_old):
            return _old
    try:
        d = row23_lib.measure_candidate(os.path.join(ROOT, r["candidate"]),
                                        side, cfg, ref, picks)
    except Exception as _mex:
        # [row 33] A MEASURE-ERR is a measurement that ran and cost its time;
        # leaving it out would make the instrument look faster than it is on
        # exactly the frames it struggles with.
        import traceback as _tb
        _where = _tb.extract_tb(_mex.__traceback__)[-1]
        _at = "%s:%d in %s" % (os.path.basename(_where.filename), _where.lineno, _where.name)
        timings.record("measure.candidate", _t, time.time(), key,
                       {"roll_id": r["id"], "candidate": r["candidate"],
                        "verdict": "MEASURE-ERR", "error": str(_mex)[:200], "where": _at})
        # [guards-that-cannot-fail] an error with no location is a guard nobody
        # can act on: entrance_approach/W sat unread for a day behind one.
        print("  %-24s MEASURE-ERR %s: %s  (at %s)" % (key, r["id"], _mex, _at))
        return None
    timings.record("measure.candidate", _t, time.time(), key,      # [row 33]
                   {"roll_id": r["id"], "candidate": r["candidate"],
                    "verdict": d.get("verdict"), "kind": d.get("kind")})
    d["id"], d["candidate"] = r["id"], r["candidate"]
    d["candidate_sha256"] = _sha
    _stamp_instrument(d)
    os.makedirs(OUT, exist_ok=True)
    json.dump(d, open(_cached, "w"), indent=2)
    return d


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
    _stamp_instrument(doc)                     # which reader this promotion stands on
    json.dump(doc, open(path, "w"), indent=2)
    door_reading(path, cand_rel, loc)
    window_reading(path, cand_rel, loc)
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
    plan = json.load(open(PLAN))
    return door_measure.patch(doc_path, os.path.join(ROOT, cand_rel), loc, plan)


def window_reading(doc_path, cand_rel, loc):
    """[Row 42] And where this frame's WINDOWS are, added to the same reading.

    Beside `door_reading` and for its reason exactly: the promotion reads a
    measurement and writes a document, so a window read at promotion time would
    be a number no measurement ever took. `promote-backdrop.mjs` writes
    `meta.windows` only where this reading exists, so the set of promoted walls
    with no window reading can only shrink -- every reading taken from this row
    on carries one.
    """
    import window_measure
    plan = json.load(open(PLAN))
    return window_measure.patch(doc_path, os.path.join(ROOT, cand_rel), loc, plan)


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
        ["node", os.path.join(ROOT, "tools", "promote-backdrop.mjs"), "--pack", _PACK.name,
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
    return _validate_promoted(key)


def _take_back(key):
    """The two files out of the store again. A promotion the law refuses is not
    a promotion, and half of one is a page rendering a wall nothing validated."""
    loc, f = key.split("/")
    for p in (os.path.join(ROOT, "backdrops", loc, f + ".png"),
              os.path.join(ROOT, "backdrops", loc, f + ".meta.json")):
        if os.path.exists(p):
            os.remove(p)


def _validate_promoted(key):
    """THE PROMOTED WALL'S OWN META, and the whole fixture exactly once a sweep.
    [row 33 regression fix, 2026-08-24; narrowed by B-ROUTING]

    The bake left the per-wall path when the stopwatch flagged promote.wall
    44.8x slower — every promotion re-baked the whole store, 15+ MB re-encoded
    per wall. What the per-wall bake bought was ATTRIBUTION: a refusal named its
    wall and rolled it back. The cheap validator bought the same attribution
    without the encode, and the row-33 ledger then flagged what IT cost —
    promote.wall at 121x, because checking one wall re-read the world, the plan
    and all eighty-eight derived metas.

    So the per-wall check is now the one clause a promotion can newly break:
    `validate-fixtures --only <loc>/<F>`, this wall's meta and nothing else. The
    fixture-wide clauses are checked ONCE per sweep — `_validate_sweep`, before
    the single bake — because they are properties of the fixture rather than of
    this wall, and twelve promotions cannot each make them differently false.
    """
    v = subprocess.run(["node", os.path.join(ROOT, "tools", "validate-fixtures.mjs"),
                        "--fixture-dir", _PACK.paths["fixture_dir"],
                        "--only", key],
                       cwd=ROOT, capture_output=True, text=True)
    if v.returncode != 0:
        _take_back(key)
        return False, ("promoted, and taken back out because the validator refused: "
                       + (v.stdout + v.stderr).strip().split("\n")[-1][:200])
    return True, None


def _validate_sweep():
    """The fixture, whole, ONCE — and before the encode rather than inside it.

    Every promotion this pass made was checked at its own meta (`--only`), which
    is the clause a promotion can newly break and the only one that can be
    attributed to a wall. What that check cannot see is a claim about the
    fixture as a whole, so it is asked here, once, over everything the pass
    left behind. It runs BEFORE `_bake()` because the bake validates the same
    thing after re-encoding 15+ MB, and a store the law refuses should cost the
    sweep a validator run rather than a bake.
    """
    _t = time.time()
    v = subprocess.run(["node", os.path.join(ROOT, "tools", "validate-fixtures.mjs"),
                        "--fixture-dir", _PACK.paths["fixture_dir"]],
                       cwd=ROOT, capture_output=True, text=True)
    ok = v.returncode == 0
    timings.record("validate.sweep", _t, time.time(), None,
                   {"fixture": os.path.relpath(_PACK.paths["fixture_dir"]), "refused": not ok})
    if ok:
        return None
    return (os.path.relpath(_PACK.paths["fixture_dir"]) + ": "
            + (v.stdout + v.stderr).strip().split("\n")[-1][:300])


def _derive(reason):
    """[production law clause 6] EVERY ARTIFACT THIS PASS INVALIDATED, REMADE.

    A pass that promoted, superseded, re-snapped or void-repaired anything has
    moved the store, and a dozen committed artifacts are DERIVED from the store:
    the material provenance report and its legacy ledger, the per-room
    consistency measure and its README, the window calibration, the snapped and
    repaired readings, the edge-strip records in `retries.json`. None of them
    used to be regenerated by the loop — they were remade by whichever command
    the Navigator happened to type next — so a ledger tick committed the moved
    store beside artifacts describing the store before it, and eight suite cases
    went red saying so in eight different languages.

    `derived.py` is the one place that knows which act invalidates which
    artifact. It runs BEFORE the bake, because the bake is the last derived thing
    in the chain, and it regenerates only what its own check calls stale — so a
    pass that promoted nothing new costs one digest sweep and writes nothing.
    """
    import derived
    _t = time.time()
    records, wrote, notes = derived.regenerate(verbose=False)
    stale = [r["id"] for r in derived.is_stale(records)]
    timings.record("derive.sweep", _t, time.time(), None,
                   {"stale": stale, "files": len(wrote), "reason": reason,
                    "notes": [n[:120] for n in notes[:4]]})
    for _id in stale:
        print("  %-24s DERIVED   %s" % (_id, "regenerated"))
    for n in notes:
        print("  !! derive: %s" % n)
    left = derived.is_stale(derived.check())
    if left:
        return ("derived artifacts are still stale after the regen: "
                + ", ".join(r["id"] for r in left))
    return None


def _bake_if_promoted(n_promoted, reason="sweep"):
    """One derivation, one validation and one bake for the whole sweep, only
    when something moved."""
    if not n_promoted:
        return None
    bad = _derive(reason)
    if bad:
        return bad
    bad = _validate_sweep()
    if bad:
        return bad
    return _bake()


#: [B-ROUTING] THE TWO EXITS THE CAPTAIN RULED, MADE STANDING.
#:
#: The sweep measured, promoted and retried, and that was all it did. The two
#: ways a wall the measurement refuses can still reach the store were tools the
#: Navigator ran by hand between passes — `row35_snap.py` (row 35's correction)
#: and `--tolerance-sweep` (row 32's declared camera under the Captain's
#: ruling). A pass could therefore measure twelve fresh returns, find every one
#: of them a camera PASS, and leave all twelve holding for want of a command
#: nobody was in the room to type.
#:
#: The order is the Navigator's own and it is not arbitrary:
#:
#:   SNAP first     it spends no roll and no tolerance. The correction is
#:                  deterministic and the result is re-measured on the standing
#:                  instrument, so a wall that comes back clean is promoted on
#:                  its own MEASURED numbers. Nothing is waived.
#:   VOID REPAIR    the snap's own second half, for a corrected frame the door
#:                  clause refuses: the plan's apertures painted in as voids,
#:                  the doors then MEASURED off the repaired frame. Also
#:                  deterministic, also nothing waived. See `DOOR_REPAIR_TOOL`.
#:   TOLERANCE second  the Captain's ruling, spent only where the snap could
#:                  not correct the frame. It ships a wall whose returns still
#:                  disagree with its ruler, flagged, on the DECLARED horizon.
#:   GRID last      the honest answer. Unestablished space renders as the
#:                  holodeck grid, in-fiction and literal, and a wall neither
#:                  exit can carry stays there with its correction.
#:
#: ONCE PER CANDIDATE. Every exit attempt is recorded against the candidate it
#: was tried on (`exit_attempt`), and a wall is not routed again until its
#: candidate changes — otherwise every pass would re-snap the same frame to the
#: same refusal, at ~12 s a wall, which is the row-30 cut being paid all over
#: again on the other side of the pipeline.
SNAP_ROUND = "row35snap"
#: WHERE A SNAPPED FRAME LIVES, and it is not a new place: the eleven walls the
#: Navigator snapped and promoted by hand put theirs at
#: `backdrops/source-snapped/<loc>-<F>/snapped.png`, and the metas in the store
#: name that path as their `camera_id`. A routed snap writing somewhere else
#: would give one kind of thing two homes, and the store would answer "where is
#: the frame this wall was promoted from" two different ways depending on who
#: promoted it. `row35_snap.py`'s own default (a row-35 batch directory) is a
#: BATCH's home — evidence for a row under judgement — and stays that.
SNAP_SOURCE_DIR = os.path.join(ROOT, "backdrops", "source-snapped")
EXIT_MEASURED, EXIT_SNAPPED = "measured", "snapped"
#: The snap, plus row 36's door-void repair — see `DOOR_REPAIR_TOOL`. It is
#: its own name rather than a flag on `snapped` because the frame that shipped
#: is not the frame the snap produced.
EXIT_SNAPPED_VOIDED = "snapped+voided"
EXIT_TOLERATED, EXIT_GRID = "tolerated", "grid"

#: [THE WARP EXIT, 2026-08-29] ONE DOOR, AND IT IS A CORRECTION.
#:
#: The method audit's ruling on the gate: "sensor, not judge". Kabe's, said the
#: same day: correct, don't re-ask. The chain above is three judges in a row —
#: the snap refuses on its own budgets, the void repair only reaches frames the
#: snap already passed, and the tolerance ruling ships a wall FLAGGED because
#: nothing could correct it. `mesh_warp.py` is the instrument that makes all
#: three unnecessary for the case they were built for: it reads the painting's
#: own landmarks, moves them onto the plan's, and reports every cost as a
#: number instead of turning a picture away for it.
#:
#: So the default route is ONE door. The candidate is warped onto the DECLARED
#: camera, the warped frame is RE-MEASURED (row 27's rule is the same whoever
#: moved the pixels: the document describes the image being promoted), and it is
#: promoted with its warp record attached — recorded, never gated.
#:
#: THE ONLY REFUSALS ARE THE WARP'S OWN. A landmark that cannot be read, an
#: aperture COUNT the painting does not answer, an aperture ORDER it
#: contradicts: those three are CONTENT misses — the painting does not show what
#: the plan rules — and no motion of pixels puts a door where none was painted.
#: They are the re-ask cases, and each carries its clause as the correction.
#: Everything else the old chain refused on is a number in the record.
EXIT_WARPED = "warped"
#: WHERE A WARPED FRAME LIVES and the round its reading is written into — the
#: same shape as the snap's and the repair's, one home per kind of artifact.
#: `mesh_warp.py`'s own sweep writes to `meshwarp-sweep/` (a dash, so it can
#: never be a round directory name) precisely so the evidence of an experiment
#: and the document a promotion reads cannot land on the same path.
WARP_SOURCE_DIR = os.path.join(ROOT, "backdrops", "source-warped")
WARP_ROUND = "meshwarp"
#: The three clauses `mesh_warp.py` emits, READ here and not emitted (the same
#: discipline as DOOR_CLAUSES: one token, one emit site, and this is not it).
WARP_REFUSALS = ("meshwarp.landmark_unreadable", "meshwarp.aperture_count",
                 "meshwarp.aperture_order")
#: `--legacy-exits`: the snap → void-repair → tolerance chain, kept reachable for
#: one release so a wall promoted through it can be re-derived and so the change
#: can be clocked against the route it replaced (production law clause 5).
LEGACY_EXITS = False


def _record_exit(st, name, reason, cand_rel=None, sha=None):
    """What left the pipeline by which door, and why, on the wall's own record."""
    st["exit"] = name
    st["exit_reason"] = reason
    if cand_rel is not None:
        st["exit_attempt"] = {"candidate": cand_rel, "exit": name, "instrument": INSTRUMENT_ID, "candidate_sha256": sha,
                              "at": time.strftime("%Y-%m-%dT%H:%M:%S")}


def _exit_tried(st, cand_rel):
    """Has this wall already been routed on THIS candidate? See SNAP_ROUND above."""
    # [Kabe, 2026-08-30] ...on this candidate BY THIS INSTRUMENT. A changed
    # reader is a new routing, or a wall holds forever on a reading nobody takes.
    _a = st.get("exit_attempt") or {}
    if _a.get("candidate") != cand_rel or _a.get("instrument") != INSTRUMENT_ID:
        return False
    # ...and on these BYTES: a repainted candidate at the same path is a new
    # routing (see measure_roll's candidate_sha256).
    _want = _a.get("candidate_sha256")
    if _want:
        import hashlib as _hl
        try:
            if _hl.sha256(open(os.path.join(ROOT, cand_rel), "rb").read()).hexdigest() != _want:
                return False
        except OSError:
            return False
    return True


def _snapped_frame(key):
    """Where this wall's snapped frame lives. One home. See SNAP_SOURCE_DIR."""
    loc, fac = key.split("/")
    return os.path.join(SNAP_SOURCE_DIR, "%s-%s" % (loc, fac), "snapped.png")


def _routed_frames(key):
    """The four files a routing attempt can write, in two pairs.

    A pair is ONE artifact in two files — a picture and the reading that
    describes it — and both doors write one: the snap writes
    `source-snapped/<wall>/snapped.png` beside `row35snap/<wall>.json`, and the
    void repair writes `source-doors/<wall>/doored.png` beside
    `row36doors/<wall>.json`. Both paths are keyed by WALL and not by candidate,
    which is what makes an attempt on a NEWER roll able to overwrite the picture
    an ALREADY-PROMOTED wall was measured on.
    """
    loc, fac = key.split("/")
    return (_snapped_frame(key),
            os.path.join(HERE, SNAP_ROUND, "%s-%s.json" % (loc, fac)),
            os.path.join(DOOR_SOURCE_DIR, "%s-%s" % (loc, fac), "doored.png"),
            os.path.join(HERE, DOOR_ROUND, "%s-%s.json" % (loc, fac)))


def _stash_snapped(key):
    """What those four files hold before a routing attempt. See `route_exit`."""
    return {p: (open(p, "rb").read() if os.path.exists(p) else None)
            for p in _routed_frames(key)}


def _restore_snapped(key, stash):
    """The stashed files back, byte for byte, where the bytes actually moved.

    A file that did not exist before the attempt is REMOVED rather than left: a
    snapped frame nothing points at is the next reader's puzzle, and both the
    snap and the void repair are deterministic, so nothing is lost that a re-run
    cannot make again.
    """
    for p, before in (stash or {}).items():
        now = open(p, "rb").read() if os.path.exists(p) else None
        if now == before:
            continue
        if before is None:
            os.remove(p)
        else:
            with open(p, "wb") as fh:
                fh.write(before)


def _warped_frame(key):
    """Where this wall's warped frame lives, and the record beside it.

    ONE ARTIFACT IN TWO FILES, the same pairing the snap and the repair keep:
    the picture and the reading that describes what was done to it.
    """
    loc, fac = key.split("/")
    d = os.path.join(WARP_SOURCE_DIR, "%s-%s" % (loc, fac))
    return os.path.join(d, "warped.png"), os.path.join(d, "warp.json")


def _warp_files(key):
    """The four files a warp attempt writes, keyed by WALL and not by candidate
    — so an attempt that does not stand must put them back. See `route_exit`."""
    loc, fac = key.split("/")
    png, rec = _warped_frame(key)
    return (png, rec, os.path.splitext(png)[0] + ".prompt.txt",
            os.path.join(HERE, WARP_ROUND, "%s-%s.json" % (loc, fac)))


def _stash_warped(key):
    """What those four files hold before a warp attempt."""
    return {p: (open(p, "rb").read() if os.path.exists(p) else None)
            for p in _warp_files(key)}


def promote_document(key, cand_rel, round_dir, camera_source=None):
    """A promotion of a document some other instrument already wrote.

    The ordinary promotion shapes a reading into a §5 record and then promotes
    it (`promote_reading` + `_do_promote`). The snap has already done both
    halves — its rewritten reading IS the document, in its own round directory —
    so this promotes that, and nothing here measures or writes a record.
    """
    _t = time.time()
    r = subprocess.run(
        ["node", os.path.join(ROOT, "tools", "promote-backdrop.mjs"), "--pack", _PACK.name,
         "--facing", key, "--candidate", cand_rel, "--round", round_dir,
         "--reference", "ruled"]
        # THE CAMERA THE HORIZON COMES FROM, named only where the frame was
        # MOVED onto it. A warped frame's landmarks are on the declared camera
        # by construction — that is what the warp did — so its meta says so.
        + (["--camera-source", camera_source] if camera_source else []),
        cwd=ROOT, capture_output=True, text=True)
    if r.returncode != 0:
        # THE REFUSAL IS RETURNED WHOLE AND TRUNCATED ONLY FOR THE LEDGER. A
        # first draft cut it to 200 characters at both ends at once, and
        # `promote-backdrop.mjs` puts its ledger token LAST — so `great_hall/N`
        # came back refused for want of a painted way through with the
        # door.unmeasured_exit token sliced off the end, `_is_door_refusal`
        # said no, and the door-void exit never fired on the one wall in the
        # run that needed it. A router that reads a message it also shortens is
        # reading its own scissors.
        why = (r.stdout + r.stderr).strip().split("\n")[-1]
        timings.record("promote.wall", _t, time.time(), key,
                       {"candidate": cand_rel, "refused": True, "round": round_dir,
                        "camera_source": camera_source or "measured", "why": why[:300]})
        return False, why
    ok, why = _validate_promoted(key)
    timings.record("promote.wall", _t, time.time(), key,
                   {"candidate": cand_rel, "refused": not ok, "round": round_dir,
                    "camera_source": camera_source or "measured",
                    "why": (why or "")[:300] or None})
    return ok, why


def _exit_snap(key, cand_rel, reading):
    """Row 35's correction, tried, and promoted if the frame comes back clean.

    The reading is the one the gate has already taken of this frame, handed
    straight in: the snap's own docstring says the measurement is INPUT GEOMETRY
    and not a gate, and re-measuring here would be a second instrument reading
    for the same number the sweep just read.
    """
    import row35_snap
    _t = time.time()
    loc, fac = key.split("/")
    out_png = os.path.join(SNAP_SOURCE_DIR, "%s-%s" % (loc, fac), "snapped.png")
    try:
        res, why = row35_snap.snap_to_round(key, cand_rel, reading=reading,
                                            round_dir=SNAP_ROUND, out_png=out_png,
                                            acceptance=True)
    except Exception as ex:
        # ONE BAD WALL IS ONE ROW. A snap that raises costs this wall its exit
        # and costs the sweep nothing else.
        timings.record("exit.snap", _t, time.time(), key,
                       {"candidate": cand_rel, "snapped": False,
                        "error": str(ex)[:200]})
        return False, "the snap raised on this frame: %s" % str(ex)[:200], None, None
    if res is None:
        timings.record("exit.snap", _t, time.time(), key,
                       {"candidate": cand_rel, "snapped": False,
                        "why": (why or "")[:300]})
        return False, "the snap refused this frame: %s" % why, None, None
    acc = res.get("acceptance") or {}
    clean = row35_snap.snap_is_clean(acc)
    timings.record("exit.snap", _t, time.time(), key,
                   {"candidate": cand_rel, "snapped": True, "clean": clean,
                    "snapped_candidate": res["candidate"],
                    "verdict": acc.get("verdict"),
                    "hold_family": acc.get("hold_family")})
    if not clean:
        return False, ("the snap corrected this frame and the standing "
                       "instrument still refuses it: %s [%s]"
                       % (acc.get("verdict"), acc.get("hold_family") or "-")), res, None
    ok, why = promote_document(key, res["candidate"], SNAP_ROUND)
    if not ok:
        return False, ("the snapped frame re-measures clean and the promotion "
                       "refused it: %s" % why), res, why
    return True, ("row 35 rectified this frame onto its own declared camera and "
                  "the standing instrument then passed it with nothing left to "
                  "hold (focal %+.2f%%, eye %+.2f%%); promoted from %s through "
                  "the %s round, on measured numbers and no waiver"
                  % (acc.get("delta_focal_pct") or 0.0,
                     acc.get("delta_eye_pct") or 0.0,
                     res["candidate"], SNAP_ROUND)), res, None


#: [B-ROUTING x row 36] The door-void repair: the plan's apertures composited
#: onto a snapped frame as unlit voids at the declared geometry, for the walls a
#: snap pass finds CLEAN and the promotion still refuses — the camera is
#: corrected, the instrument passes it, and the painting shows no measurable
#: hole where the plan rules a way through. Repeated re-asks under the unlit-void
#: rule did not fix that; the generator will not reliably paint a readable dark
#: void, and nothing about a rectangle the plan already rules needs a model.
#:
#: THE PAINTER IS ROW 36'S (`row36_assemble.repair_doors`, its `--paint-doors`
#: arm) and it is called in-process: it is a python module in this directory, so
#: a subprocess would buy a second interpreter's start-up and lose the record it
#: returns — which is what `_doors_repair` on the promoted reading is made of.
#: It is MINIMAL-TOUCH by construction: a way through the detector already reads
#: is left alone, and a wall with nothing missing is refused rather than given a
#: second doorway.
DOOR_REPAIR_TOOL = "design/plan-draft/measured/row36_assemble.py --paint-doors"

#: WHERE A REPAIRED FRAME LIVES, and the round its reading is written into.
#:
#: THE READING MUST BE A READING OF THE IMAGE BEING PROMOTED, which is why this
#: is its own round and not a patch of the snapped one. `promote-backdrop.mjs`
#: refuses a document whose `_what_this_is` does not name the candidate — and it
#: is right to: a reading dressed on another picture is the one failure nothing
#: downstream can see. The first attempt at this exit promoted `doored.png`
#: against `row35snap/<loc>-<F>.json` and was refused by name, in the Navigator's
#: hands, on all five walls. So `row36doors/<loc>-<F>.json` is the snapped
#: reading RE-POINTED: the camera numbers are untouched (the repair moves pixels
#: only inside the plan's apertures, at the same geometry), the image path and
#: digest name the repaired frame, the openings are re-read off it, and
#: `_doors_repair` says which apertures were painted and which were left alone.
DOOR_SOURCE_DIR = os.path.join(ROOT, "backdrops", "source-doors")
DOOR_ROUND = "row36doors"

#: The row-27 clauses this repair answers, by their LEDGER TOKENS. Routing on
#: the token and not on the prose is row 35's own lesson (`_snap_once` returns
#: its clause beside its sentence): a router that decides by substring-matching
#: a sentence someone else writes breaks the day the sentence is reworded.
#:
#: THESE ARE READ, NOT EMITTED, and the bracket is what separates the two. The
#: ledger's discipline is one token one EMIT SITE — `guards.spec` counts the
#: BRACKETED form across every source this project produces findings from, and
#: `tools/promote-backdrop.mjs` holds the only one of each. What is written here
#: is the name a reader looks FOR inside somebody else's bracket, so it is
#: written without one: nothing here mints a finding. (The suite caught the
#: first draft of this comment quoting the bracketed token and counted it as a
#: second arm, which is the guard doing exactly its job.) The second entry has
#: no token at all, because that refusal exits before the refusal list exists;
#: it is quoted whole rather than paraphrased.
DOOR_CLAUSES = ("row27:door.unmeasured_exit", "carries no door reading")


def _is_door_refusal(why):
    """Did the promotion refuse this wall for want of a painted way through?"""
    return any(c in (why or "") for c in DOOR_CLAUSES)


def _exit_void_repair(key, st, res, promo_why):
    """Doors painted in, doors re-read, wall promoted. See DOOR_REPAIR_TOOL.

    AFTER THE SNAP AND BEFORE THE TOLERANCE, because it is the same kind of act
    as the snap and not the same kind as the ruling: it corrects the picture
    deterministically at the geometry the plan already rules, the doors are then
    MEASURED off the repaired frame the way row 27 requires of every promotion,
    and nothing is waived. A wall that takes this exit ships on measured
    numbers.
    """
    _t = time.time()
    loc, fac = key.split("/")
    out_png = os.path.join(DOOR_SOURCE_DIR, "%s-%s" % (loc, fac), "doored.png")
    try:
        import row36_assemble
        plan = json.load(open(PLAN))
        facings = row36_assemble.read_json(row36_assemble.FACINGS)["facings"]
        rec, why = row36_assemble.repair_doors(key, res["candidate"], out_png,
                                               plan, facings)
    except Exception as ex:
        # ONE BAD WALL IS ONE ROW, here as at the snap.
        timings.record("exit.voidrepair", _t, time.time(), key,
                       {"candidate": res["candidate"], "repaired": False,
                        "error": str(ex)[:200]})
        return False, ("the door-void repair raised on this frame: %s"
                       % str(ex)[:200])
    if rec is None:
        timings.record("exit.voidrepair", _t, time.time(), key,
                       {"candidate": res["candidate"], "repaired": False,
                        "why": (why or "")[:300]})
        return False, "the door-void repair refused this frame: %s" % why
    rel_out = os.path.relpath(out_png, ROOT)
    # THE DOORS ARE RE-READ OFF THE REPAIRED FRAME, never carried. The whole
    # refusal was that this picture had no hole to measure; a promotion that
    # took the rectangles from anywhere but the pixels it is about to ship
    # would be the row-27 defect the Captain walked into, re-authored.
    doc_out, why = _doors_document(key, res, rel_out, rec)
    if doc_out is None:
        timings.record("exit.voidrepair", _t, time.time(), key,
                       {"candidate": rel_out, "repaired": True,
                        "why": (why or "")[:300]})
        return False, why
    ok, why = promote_document(key, rel_out, DOOR_ROUND)
    timings.record("exit.voidrepair", _t, time.time(), key,
                   {"candidate": rel_out, "repaired": True, "promoted": ok,
                    "voids": len(rec.get("painted") or []),
                    "separation_luma": rec.get("separation_luma"),
                    "why": (why or "")[:300] or None})
    if not ok:
        return False, ("the repaired frame's doors read and the promotion "
                       "refused it: %s" % why)
    st["door_voids_painted"] = rel_out
    return True, ("the snap corrected the camera and row 36 then painted the "
                  "%d way(s) through that this frame did not draw, as unlit "
                  "voids at the plan's own geometry (%.1f luma clear of the "
                  "wall) — the doors were re-read off %s and it promoted "
                  "through the %s round on measured numbers"
                  % (len(rec.get("painted") or []),
                     rec.get("separation_luma") or 0.0, rel_out, DOOR_ROUND))


def _doors_document(key, res, repaired_rel, rec):
    """The snapped reading, RE-POINTED at the repaired frame. See DOOR_ROUND.

    Every camera number in the snapped document is still true of this image:
    the repair moves pixels only inside the plan's apertures, at the geometry
    that document already states. What must move is the two fields that say
    WHICH IMAGE it describes, the openings — re-read here, off the repaired
    frame — and a record of what was painted and what was left alone.

    It is written into its own round rather than over the snapped one because
    `row35snap/<loc>-<F>.json` is a true reading of `snapped.png` and must stay
    one: two images cannot share a document, and the promotion tool says so by
    name.
    """
    import door_measure
    loc, fac = key.split("/")
    src_doc = res["doc_out"]
    if not os.path.exists(src_doc):
        return None, "the snapped round document is gone from %s" % src_doc
    doc = json.load(open(src_doc))
    doc["_round"] = DOOR_ROUND
    doc["_source_sha256"] = sha(os.path.join(ROOT, repaired_rel))
    doc["_what_this_is"] = (
        "The row-35 SNAPPED reading for %s, re-pointed at %s. The camera it "
        "describes is the one row 35 rectified %s onto, unchanged and not "
        "re-measured: row 36's door repair composites the ways through the plan "
        "rules as unlit voids INSIDE that same geometry, so every scale, corner "
        "and line in this document is as true of the repaired frame as of the "
        "snapped one. What was re-read off the repaired frame, and off nothing "
        "else, is the openings — see `_doors_repair` and `_measured_px."
        "openings`. The image this document describes is %s."
        % (key, repaired_rel, res["candidate"], repaired_rel))
    doc["_doors_repair"] = {
        "_what_this_is": ("the ways through this frame did not draw, painted in "
                          "at the plan's own geometry and then MEASURED off the "
                          "result — row 27's rule is the same whoever painted "
                          "the hole"),
        "tool": DOOR_REPAIR_TOOL,
        "painted_onto": res["candidate"],
        "image": repaired_rel,
        "painted": rec.get("painted"),
        "left_alone": rec.get("left_alone"),
        "doors_ruled": rec.get("doors_ruled"),
        "doors_read_before": rec.get("doors_read_before"),
        "wall_median_luma": rec.get("wall_median_luma"),
        "void_luma": rec.get("void_luma"),
        "separation_luma": rec.get("separation_luma"),
        "min_separation_required": rec.get("min_separation_required"),
    }
    doc_out = os.path.join(HERE, DOOR_ROUND, "%s-%s.json" % (loc, fac))
    os.makedirs(os.path.dirname(doc_out), exist_ok=True)
    json.dump(doc, open(doc_out, "w"), indent=2, default=float)
    plan = json.load(open(PLAN))
    try:
        door_measure.patch(doc_out, os.path.join(ROOT, repaired_rel), loc, plan)
        # [row 42] and the windows off the same repaired frame, for the same
        # reason the openings are re-read here: the document describes THIS
        # image and every reading in it has to have been taken off THIS image.
        import window_measure
        window_measure.patch(doc_out, os.path.join(ROOT, repaired_rel), loc, plan)
    except Exception as ex:
        return None, ("the doors could not be read off the repaired frame: %s"
                      % str(ex)[:200])
    return doc_out, None


def _exit_tolerance(key, e, st, cand_rel, reading, side, ref, fam):
    """Row 32's declared camera, under the Captain's ruling. Second, never first.

    THE FENCES ARE `tolerance_sweep`'S OWN and this route may not be softer than
    the mode it stands in for: the ruling is spent only on a wall with nothing
    else coming (a `retry` wall has a correction going out and its cap unspent,
    and buying it a waiver would spend the Captain's tolerance on a repaint that
    was about to happen for free), only on the families the ruling covers, and
    only while the ruling is on the ledger.
    """
    ruling = tolerance_ruling()
    if not ruling:
        return False, ("design/approvals.log carries no suspect-painting "
                       "tolerance line; this route has no authority to run")
    if fam not in row23_lib.TOLERANCE_FAMILIES:
        return False, ("%s is not one of the families the tolerance ruling "
                       "covers" % fam)
    if st.get("status") != "held":
        return False, ("this wall is still retrying: it has a correction going "
                       "out and its cap unspent, and the ruling is not spent on "
                       "a repaint that may happen for free")
    _t = time.time()
    ok, why = do_promote(key, cand_rel, e, dict(side, candidate=cand_rel), ref,
                         reading, tolerance=True)
    timings.record("exit.tolerance", _t, time.time(), key,
                   {"candidate": cand_rel, "family": fam, "refused": not ok,
                    "why": (why or "")[:300] or None})
    if not ok:
        return False, "the tolerance promotion was refused: %s" % why
    # THE CORRECTION IS NOT ANSWERED AND IS NOT DELETED — the repaint this wall
    # was asked for never happened; the Captain accepted the drift instead.
    # `tolerance_sweep` keeps it under the same past-tense name.
    if st.get("correction") is not None:
        st["waived_correction"] = st.pop("correction")
    st["suspect_perspective"] = True
    st["camera_source"] = "declared"
    st["tolerance_ruling"] = ruling
    st["hold_family"] = fam
    return True, ("the snap could not correct this frame and its camera passes, "
                  "so it ships on the DECLARED horizon under the Captain's "
                  "ruling, flagged suspect_perspective: %s" % ruling)


def _worst_segment(rec):
    """The one strip of wall the correction asked most of, named.

    A separable monotone map's whole distortion is its per-segment scale (see
    `mesh_warp.axis_segments`), so the worst segment is the segment whose scale
    is furthest from 1 — reported, never gated: it is what a reader looks at to
    see where the picture was stretched, and the answer is a place, not a flag.
    """
    st = (rec.get("stretch") or {})
    worst = None
    for axis in ("x_segments", "y_segments"):
        for s in (st.get(axis) or []):
            if not s.get("scale"):
                continue
            d = abs(s["scale"] - 1.0)
            if worst is None or d > worst[0]:
                worst = (d, dict(axis=axis[0], name=s.get("name"),
                                 scale=s.get("scale"),
                                 target_px=s.get("target_px"),
                                 source_px=s.get("source_px")))
    return worst[1] if worst else None


def _warp_block(rec):
    """The four numbers the meta carries about the correction it was given.

    `meta.measured_room.warp` — pins, residuals, worst segment, revealed px.
    The tolerance ruling's flag said "this painting is suspect" and gave a
    reader nothing to check; this says exactly how far each landmark had to
    move, how far the field then put it off its target, where the wall was
    stretched most, and how much frame edge the correction revealed.
    """
    cols = rec.get("columns") if isinstance(rec.get("columns"), list) else []
    rws = rec.get("rows") if isinstance(rec.get("rows"), list) else []
    return {
        "pins": len(rec.get("pins") or []) or (len(cols) + len(rws)),
        "columns": rec.get("column_count") or (len(cols) or None),
        "rows": rec.get("row_count") or (len(rws) or None),
        "residuals": {
            # EVERY PIN'S OWN, by name, and the worst of them. This is what the
            # tolerance ruling's bare flag never carried: how far the field puts
            # each landmark off the target it was pinned to.
            "max_px": rec.get("max_residual_px"),
            "column_px": [[e.get("name"), e.get("residual_px")] for e in cols],
            "row_px": [[e.get("name"), e.get("residual_px")] for e in rws],
        },
        "worst_segment": _worst_segment(rec),
        "revealed_px": rec.get("revealed_px"),
        "revealed_fraction": rec.get("revealed_fraction"),
        "warp_mode": rec.get("warp_mode"),
        "warped_from": rec.get("candidate"),
    }


def _warp_document(key, warped_rel, reading_after, side, ref, rec):
    """The reading of the WARPED frame, in the warp's own round.

    RE-MEASURED AND NOT RE-POINTED. The snap could carry its document through
    its own homography and the void repair could re-point one because neither
    moved a camera number; the warp moves the painting's landmarks onto the
    plan's, so every scale, corner and line in the old reading is a statement
    about a picture that no longer exists. The instrument reads the warped frame
    from scratch, the doors and windows are read off it, and the record of what
    the warp did rides along under `_warp` — recorded, never gated.
    """
    loc, fac = key.split("/")
    doc, _refusals = row23_lib.promotion_doc(
        reading_after, dict(side, candidate=warped_rel), ref, WARP_ROUND,
        sha(os.path.join(ROOT, warped_rel)))
    if doc is None:
        return None, ("the warped frame carries no scale, so there is nothing "
                      "for a meta to be a meta of")
    doc["_round"] = WARP_ROUND
    doc["_what_this_is"] = (
        "The MESH-WARPED reading for %s. %s was warped onto this facing's "
        "DECLARED camera by design/plan-draft/measured/mesh_warp.py — the "
        "painting's own room corners, floor and ceiling lines and aperture "
        "edges pinned onto the plan's, separable and piecewise-linear on the "
        "wall plane so no straight line bends — and this document is the "
        "row-23 instrument's reading of the RESULT, measured off %s and off "
        "nothing else. What the correction cost is in `_warp`: it is recorded "
        "and nothing here is gated on it."
        % (key, rec.get("candidate"), warped_rel))
    doc["_warp"] = _warp_block(rec)
    doc["_warp"]["tool"] = "design/plan-draft/measured/mesh_warp.py"
    _stamp_instrument(doc)
    doc_out = os.path.join(HERE, WARP_ROUND, "%s-%s.json" % (loc, fac))
    os.makedirs(os.path.dirname(doc_out), exist_ok=True)
    json.dump(doc, open(doc_out, "w"), indent=2, default=float)
    plan = json.load(open(PLAN))
    try:
        import door_measure
        import window_measure
        door_measure.patch(doc_out, os.path.join(ROOT, warped_rel), loc, plan)
        window_measure.patch(doc_out, os.path.join(ROOT, warped_rel), loc, plan)
    except Exception as ex:
        return None, ("the openings could not be read off the warped frame: %s"
                      % str(ex)[:200])
    return doc_out, None


def _exit_warp(key, e, st, cand_rel, side, ref, fam):
    """THE correction step. Returns `(ok, reason, record, clause)`.

    `clause` is non-null only on one of the warp's own three refusals, and that
    is the whole of the re-ask: a content miss the plan can name and a painter
    can answer. Everything else that goes wrong here costs this wall its exit
    and nothing else — it stays on the grid with its reason, and no roll is
    spent asking for a repaint that would not fix it.
    """
    _t = time.time()
    import mesh_warp
    try:
        out, rec = mesh_warp.warp_wall(key, cand_rel)
    except (Exception, SystemExit) as ex:          # ONE BAD WALL IS ONE ROW - a snap refusal raises SystemExit and must not end the sweep.
        timings.record("exit.warp", _t, time.time(), key,
                       {"candidate": cand_rel, "warped": False,
                        "error": str(ex)[:200]})
        return False, "the warp raised on this frame: %s" % str(ex)[:200], None, None
    WARP_RECORDS[key] = rec
    if out is None:
        clause = rec.get("clause") if rec.get("clause") in WARP_REFUSALS else None
        timings.record("exit.warp", _t, time.time(), key,
                       {"candidate": cand_rel, "warped": False,
                        "clause": rec.get("clause"), "why": (rec.get("why") or "")[:300]})
        return False, (rec.get("why") or "the warp refused this frame"), rec, clause

    png, rec_path = _warped_frame(key)
    mesh_warp.write_png(png, out)
    warped_rel = os.path.relpath(png, ROOT)
    # THE ASK GOES WITH THE PICTURE. [row39:stair.ask_unreadable] attaches a
    # flight to a promoted meta only from a candidate that can be SHOWN to have
    # been asked for one, and it looks for `<candidate>.prompt.txt` beside the
    # frame. A warped frame IS that candidate corrected — the same roll, the
    # same ask, moved onto the declared camera — so the prompt it was painted
    # from is copied beside it rather than the wall losing its staircase for
    # having been corrected.
    src_prompt = os.path.join(ROOT, os.path.splitext(cand_rel)[0] + ".prompt.txt")
    if os.path.exists(src_prompt):
        with open(src_prompt, "rb") as _fh:
            _ask = _fh.read()
        with open(os.path.splitext(png)[0] + ".prompt.txt", "wb") as _out:
            _out.write(_ask)
    rec["warped_image"] = warped_rel
    rec["asked_from"] = os.path.relpath(src_prompt, ROOT) if os.path.exists(src_prompt) else None
    rec["warped_sha256"] = sha(png)

    # THE WARPED FRAME, PUT BACK THROUGH THE STANDING INSTRUMENT — not to judge
    # it, but because the document a promotion reads must be a reading of the
    # image being promoted (row 27's rule, whoever moved the pixels).
    import row35_snap
    _e, _side, cfg, _ref, _declared = row35_snap.wall_context(key)
    reading_after = row35_snap.measure(png, side, cfg, ref)
    rec["after"] = dict(camera_verdict=reading_after.get("verdict"),
                        delta_focal_pct=reading_after.get("delta_focal_pct"),
                        delta_eye_pct=reading_after.get("delta_eye_pct"),
                        hold_family=(reading_after.get("_promotion") or {})
                        .get("hold_family"))
    mesh_warp._emit(rec_path, rec)

    doc_out, why = _warp_document(key, warped_rel, reading_after, side, ref, rec)
    if doc_out is None:
        timings.record("exit.warp", _t, time.time(), key,
                       {"candidate": cand_rel, "warped": True, "promoted": False,
                        "why": (why or "")[:300]})
        return False, why, rec, None

    ok, why = promote_document(key, warped_rel, WARP_ROUND,
                               camera_source="declared")
    timings.record("exit.warp", _t, time.time(), key,
                   {"candidate": cand_rel, "warped": True, "promoted": ok,
                    "max_residual_px": rec.get("max_residual_px"),
                    "revealed_px": rec.get("revealed_px"),
                    "why": (why or "")[:300] or None})
    if not ok:
        return False, ("the warped frame re-measures and the promotion refused "
                       "it: %s" % why), rec, None
    ws = _worst_segment(rec) or {}
    return True, ("the warp pinned this painting's own landmarks onto the "
                  "plan's and it promoted from %s on the declared camera "
                  "(%d pins, worst residual %.2f px, worst segment %s x%.3f, "
                  "%d px revealed) — the correction is recorded, not waived"
                  % (warped_rel, _warp_block(rec)["pins"],
                     rec.get("max_residual_px") or 0.0,
                     ws.get("name") or "-", ws.get("scale") or 1.0,
                     rec.get("revealed_px") or 0)), rec, None


def route_exit(key, e, st, cand_rel, reading, side, ref, fam,
               legacy=None, force=False):
    """ONE DOOR — `exit: warped` — for one wall, once. See EXIT_WARPED.

    The chain this replaces (snap → void repair → tolerance) is behind
    `--legacy-exits` for one release and is what `legacy=True` runs.

    Returns (exit, reason) and mutates `st` on a promotion. The caller has
    already recorded the hold; this is what happens next, and on GRID the hold
    it recorded stands untouched.
    """
    _t = time.time()
    legacy = LEGACY_EXITS if legacy is None else legacy
    if _exit_tried(st, cand_rel) and not force:
        # NOTHING HAPPENED THIS PASS, and that is what is returned. The routing
        # already ran on this candidate and said what it said; re-running it
        # would re-snap the same frame to the same refusal at ~12 s a wall,
        # every pass, forever. GRID here is not a new verdict about the wall —
        # the hold the caller just recorded stands, and the wall's own record
        # still carries the exit it took and the reason — it is this pass
        # declining to claim an exit it did not take.
        return EXIT_GRID, ("already routed on this candidate (%s); nothing is "
                           "tried again until the candidate changes"
                           % (st.get("exit") or "no exit"))

    def _promoted(exit_name, reason, answered=True):
        """The state a wall carries out of an exit it took.

        `answered` is the difference between the two kinds of promotion and it
        is not cosmetic: a CORRECTED frame answers the correction it was asked
        for, and a TOLERATED one never does — the repaint did not happen, the
        Captain accepted the drift, and `_exit_tolerance` has already moved the
        sentence under `waived_correction`. A tolerated wall also keeps its
        `hold_family` and its flags, which is what `tolerance_sweep` writes and
        what `--recheck-doors` reads back to re-decide it under the ruling; a
        corrected one is no longer holding for anything and says so.
        """
        st["status"] = "promoted"
        st["candidate"] = cand_rel
        if answered:
            if st.get("correction") is not None:
                st["answered_correction"] = st.pop("correction")
            st["snapped_from_family"] = fam
            st.pop("hold_family", None)
        _record_exit(st, exit_name, reason, cand_rel,
                     sha=(reading.get("candidate_sha256") if isinstance(reading, dict) else None))
        timings.record("exit.route", _t, time.time(), key,
                       {"candidate": cand_rel, "exit": exit_name, "family": fam})
        return exit_name, reason

    if not legacy:
        # THE WARP IS THE WHOLE ROUTE. Same doctrine as everything below it: an
        # attempt that does not stand leaves the store exactly as it found it,
        # because `source-warped/<wall>/warped.png` and its round document are
        # keyed by WALL and a newer roll of an already-promoted wall would
        # otherwise overwrite the picture the store was measured on.
        _warp_stash = _stash_warped(key)
        ok, reason, rec, clause = _exit_warp(key, e, st, cand_rel, side, ref, fam)
        if ok:
            if rec is not None:
                st["warp"] = _warp_block(rec)
            st["camera_source"] = "declared"
            return _promoted(EXIT_WARPED, reason)
        _restore_snapped(key, _warp_stash)      # the same byte-for-byte restore
        # AN OPEN FACING HAS NO ROOM CORNERS TO PIN, so the warp's landmark
        # refusal on one says the INSTRUMENT does not apply — not that the
        # painting is missing something a painter could add. That is the one
        # refusal of the three that is never a re-ask, and spending a roll on it
        # would ask a vista to grow a ceiling.
        open_facing = ((side or {}).get("meta_used") or {}).get("facing_type") == "open"
        if clause and not open_facing:
            # THE RE-ASK, AND THE ONLY ONE. A landmark that cannot be read, an
            # aperture count or an aperture order the painting contradicts: the
            # picture does not show what the plan rules, and the clause IS the
            # correction — it names what to paint, which is the one thing a
            # repaint can supply and a warp cannot.
            st["warp_refusal"] = {"clause": clause, "why": reason,
                                  "candidate": cand_rel}
            st["correction"] = "[%s] %s" % (clause, reason)
            _record_exit(st, EXIT_GRID,
                         "the warp refused this frame and it is a content miss, "
                         "so it re-asks: %s" % st["correction"], cand_rel)
        else:
            _record_exit(st, EXIT_GRID,
                         "the warp could not carry this wall: %s" % reason,
                         cand_rel)
        timings.record("exit.route", _t, time.time(), key,
                       {"candidate": cand_rel, "exit": EXIT_GRID, "family": fam,
                        "warp": reason[:200], "clause": clause})
        return EXIT_GRID, st["exit_reason"]

    # [production law clause 6, 2026-08-25] THE SNAPPED FRAME IS PUT BACK IF THE
    # WALL DOES NOT LEAVE THROUGH IT.
    #
    # `backdrops/source-snapped/<loc>-<F>/snapped.png` is keyed by WALL and not
    # by candidate, so snapping a NEWER roll of a wall that is already promoted
    # from an OLDER one overwrites the frame the store was measured on — and the
    # promoted meta, the row-35 reading and the store's own picture are then all
    # describing a picture that is not there any more. That happened to three
    # walls (`great_hall/N`, `guest_chamber/E`, `back_stair_head/S`), shipped in
    # a ledger tick, and turned `snap.spec`, `assembly.spec` and `fixtures.spec`
    # red in three different languages; `derived.py` repairs it after the fact
    # and this stops it happening. Same doctrine as the supersede route's
    # `_stash`/`_restore`: an attempt that does not stand leaves the store
    # exactly as it found it.
    #
    # BOTH PAIRS, because the void repair's `doored.png` and its `row36doors`
    # reading are keyed by wall in exactly the same way and are written before
    # the promotion that may refuse them. See `_routed_frames`.
    _snap_stash = _stash_snapped(key)
    ok, reason, res, promo_why = _exit_snap(key, cand_rel, reading)
    if ok:
        return _promoted(EXIT_SNAPPED, reason)
    snap_why = reason

    # THE DOOR REPAIR IS THE SNAP'S OWN SECOND HALF, not a third opinion: it is
    # reached only from a frame the snap already corrected and the instrument
    # already passed, refused for want of a painted way through. See
    # DOOR_REPAIR_TOOL.
    if res is not None and _is_door_refusal(promo_why):
        ok, reason = _exit_void_repair(key, st, res, promo_why)
        if ok:
            return _promoted(EXIT_SNAPPED_VOIDED, reason)
        snap_why = "%s; %s" % (snap_why, reason)

    # Neither snapped door carried it, so whatever this pass wrote into those
    # four files is a picture nothing points at — and what it replaced may be a
    # picture the store does.
    _restore_snapped(key, _snap_stash)

    ok, reason = _exit_tolerance(key, e, st, cand_rel, reading, side, ref, fam)
    if ok:
        # The correction is WAIVED here and not answered — `_exit_tolerance`
        # has already moved it under that name — so this promotion does not
        # claim the repaint happened.
        return _promoted(EXIT_TOLERATED,
                         "%s (the snap first: %s)" % (reason, snap_why),
                         answered=False)

    _record_exit(st, EXIT_GRID,
                 "neither exit could carry this wall — snap: %s; tolerance: %s"
                 % (snap_why, reason), cand_rel)
    timings.record("exit.route", _t, time.time(), key,
                   {"candidate": cand_rel, "exit": EXIT_GRID, "family": fam,
                    "snap": snap_why[:200], "tolerance": reason[:200]})
    return EXIT_GRID, st["exit_reason"]


# ---------------------------------------------------------------------------
# [row 40 seam] SUPERSEDE — the one route by which a wall ALREADY IN THE STORE
# can be repainted by this loop.
#
# THE SEAM, exactly. Row 40 cut nine re-ask packets for walls that are already
# PROMOTED: their rooms do not read as one room, and `--emit-consistency` asked
# each outlier again with the room's ruling materials named in its correction.
# The painter returned all nine. The sweep then ignored every one of them, and
# it was right to under the rule it had — "art already in the store; this loop
# read it rather than remaking it" is what stops a late duplicate return
# clobbering a promoted asset, and it is the reuse law (generate once, promote
# once, thereafter READ). But a consistency re-ask is not a late duplicate. It
# is a repaint the loop itself asked for, of a wall it itself promoted, for a
# reason the pixels can be re-measured against.
#
# So the rule is narrow on purpose, and it is three sentences:
#
#   1. A promoted wall is a SUPERSEDE CANDIDATE only when retries.json carries a
#      ROOM-CONSISTENCY roll — one whose entry has the row-40 emitter's own
#      `consistency` block (`tools/make-scaffold.mjs --emit-consistency`; the
#      file documents it under `_consistency`) — that is on disk and is not
#      already the candidate this wall is promoted from. That block is what
#      makes it NEWER: the emitter reads the PROMOTED store and asks only walls
#      already in it, so the packet can only have been cut after the promotion
#      it answers. See `supersede_roll` for why mtime is not asked.
#   2. That roll is measured on the standing instrument exactly as any arrival
#      (`measure_roll`, cached by id) and must be a camera PASS, and the
#      ordinary promotion must admit it — no snap, no tolerance, no waiver.
#   3. It is then promoted for real, the room is re-audited with the whole set
#      in place, and it STANDS unless the room got WORSE — past that veto, on
#      the worst-band distance falling by `SUPERSEDE_IMPROVEMENT`, or no wall of
#      the set still being an outlier, or the room reaching consistent, or a
#      no-majority room gaining a majority. Otherwise the previous png, meta and
#      promotion documents go back byte-for-byte and the record reads
#      `supersede: refused`.
#
# THE UNIT OF JUDGEMENT IS THE ROOM, NOT THE WALL, AND TWO PRODUCTION PASSES
# PAID TO LEARN THE SHAPE OF IT.
#
# Pass 1 judged every wall alone. `master_bedchamber/S` and `/W` each refused
# "the room got worse: 4.474 -> 4.716 / 6.321" — because each was measured
# against a room whose OTHER outliers were still their old paintings. A 2-2
# split has no majority to join: move one wall to the ruling materials and it
# now disagrees with the two it used to agree with, so the worst pair gets
# further apart ON THE WAY TO agreement. Judged one at a time such a room can
# never pass. Pass 2 superseded all four together and the room came to 4.144.
#
# That fix was scoped to NO-MAJORITY rooms, and pass 2 showed the scope was the
# wrong shape rather than the wrong idea. `guest_chamber`'s pixel majority is
# E+N — and E+N are the half that DISOBEYS the room's voice. The ruling comes
# from the plan, so both rolls going out are moving AWAY from the biggest
# cluster and TOWARD the ruling; measured one at a time, the first is a facing
# walking away from its room, which is what the distance says and the wrong
# reading of what it is doing. So the rule is now simply: EVERY eligible
# consistency roll of one room is judged together, majority or no majority,
# because a room has two returns exactly when one measure named two facings
# against one ruling. A room with one roll is a set of one and the same code.
#
# The only per-wall restore inside a set is for a wall whose OWN camera or
# promotion refused it: that wall never reached the store, and it is dropped
# from the set rather than taken down with it.
#
# AND THE VERDICT KEEPS PROGRESS, NOT ONLY PERFECTION. Pass 2 refused
# `garden_room/W` at 6.208 -> 3.904 — a 37 % cut toward the ruling — because it
# was still the furthest facing from the room's median and the outlier clause
# was the only door past the veto. That clause exists to stop REGRESSIONS; made
# the only door, it demanded the whole distance in one roll and threw away a
# store plainly better than the one before it. `SUPERSEDE_IMPROVEMENT` is the
# fourth door: a measurable step toward one room is kept. Only no-improvement
# and worsening are refused.
#
# THE SNAP IS ON THIS ROUTE; THE TOLERANCE RULING IS NOT.
#
# The first pass refused `guest_chamber/S`, `guest_chamber/W` and
# `master_bedchamber/E` as camera FAIL, and `closet_chamber/W` on the horizon
# instrument, on the reasoning that a snap would rectify the very pixels the
# consistency measure is judging. That reasoning was wrong, ruled by the
# Navigator on the returns: the snap warps GEOMETRY, not material, and the
# consistency bands are re-cut on the snapped frame's own declared geometry —
# which is what row 40's own miss log asked for. Row 35 exists for exactly this
# case under the Captain's single-return doctrine ("allow the single return to
# then be processed and roll with it"), so a consistency roll that misses the
# camera goes through `_exit_snap` in the order `route_exit` uses it, with the
# door-void repair as its second half, and a snapped frame that re-measures
# clean is then judged by the room measure like any PASS.
#
# What is NOT on this route is row 32's TOLERANCE ruling — the declared camera.
# Stated, not omitted: that door ships a wall whose returns still disagree with
# its ruler, flagged, and it is spent on a wall with nothing else coming. This
# wall has something else: it is already in the store, painted, and the question
# is its ROOM. A waiver cannot answer that question, and `_exit_tolerance` would
# refuse here anyway — it requires `status == held`.
#
# WHAT IS DELIBERATELY NOT A SUPERSEDE. An ordinary retry roll landing on a
# promoted wall — a re-ask cut for a camera miss, a door refusal, an unfitted
# horizon — is still ignored exactly as before. That wall's correction was
# answered by the promotion that put it in the store; a roll that arrived
# afterwards is the late duplicate the reuse law is about, and admitting it
# would let any stale packet in the worklist repaint a finished wall. The
# consistency block is the whole of the difference: it is stamped by the one
# emitter that asks an ALREADY-PROMOTED wall to be repainted.
#
# ONCE PER ROLL, the same discipline `exit_attempt` imposes on the routing: a
# supersede attempt is recorded against the roll it was tried on, and the wall
# is not tried again until a newer consistency roll lands. Without it every
# pass would re-promote and re-audit nine walls forever, which is the row-30 cut
# being paid again on the third side of the pipeline.

#: The provenance field `--emit-consistency` stamps on the entries it cuts.
CONSISTENCY_FIELD = "consistency"
#: The fallback, if a future emitter ever writes no block: the correction
#: sentence `consistencySentence` composes, which names the room's ruling
#: materials. Kept because the deliverable asked for a route that works off
#: whatever the emitter wrote — but the block is what the row-40 emitter DID
#: write, so this is a belt and never the braces, and `supersede_reason` says
#: which of the two identified the packet.
CONSISTENCY_MARK = "This room is ruled to ONE set of materials"
#: A distance is not "worse" for a rounding tick. `audit_room` rounds its score
#: to three places, so this is a hair below that.
SUPERSEDE_EPS = 1e-4

#: HOW MUCH CLOSER TO ONE ROOM A REPAINT HAS TO GET BEFORE THE STORE KEEPS IT,
#: as a fraction of the worst-band distance it started from. [Navigator ruling,
#: 2026-08-25, on the second production pass's own returns.]
#:
#: The number is 10 % and it is a FLOOR ON MEANING, not a bar on quality — the
#: bar is `room_consistency.CUT`, which is calibrated on twelve labelled rooms
#: and is not moved by anything here. This says only how much movement counts as
#: movement rather than as noise, and there are two reasons it sits where it
#: does. The instrument reports its score to three decimals and the twelve-room
#: calibration ordered 34 of 36 pairs, so a fraction of a percent is inside what
#: the measure can honestly distinguish; and the returns this rule was written
#: on are nowhere near the line — `garden_room/W` cut 37 % (6.208 -> 3.904) and
#: the room-worsening refusals of pass 1 were negative. Ten per cent is
#: comfortably above the noise and comfortably below every real result, which is
#: the whole job of a floor: nothing in the corpus is decided BY it.
#:
#: WHY A FLOOR AT ALL, rather than admitting any improvement. A repaint that
#: moves the room 0.4 % has not answered the correction it was asked for, and
#: keeping it would spend the wall's one supersede — `_supersede_tried` — on a
#: roll that did nothing, so the next return would find the attempt already
#: made. A wall is kept for progress or it is left for the next roll.
SUPERSEDE_IMPROVEMENT = 0.10


def consistency_rolls(key):
    """Every ROOM-CONSISTENCY roll this wall has, newest entry last.

    Returns [(roll, provenance)] — provenance being which field identified the
    packet, because that sentence goes on the wall's record.
    """
    out = []
    for e in RETRY_ENTRIES.get(key, []):
        if isinstance(e.get(CONSISTENCY_FIELD), dict):
            prov = "the row-40 emitter's `consistency` block"
        elif CONSISTENCY_MARK in (e.get("correction") or ""):
            prov = ("the packet's correction naming the room's ruling materials "
                    "(the entry carries no `consistency` block)")
        else:
            continue
        for r in e.get("rolls", []):
            out.append((r, prov))
    return out


def _mtime(rel):
    p = os.path.join(ROOT, rel) if not os.path.isabs(rel) else rel
    return os.path.getmtime(p) if os.path.exists(p) else None


def supersede_roll(key, st):
    """The consistency roll this wall has not taken into the store yet.

    Returns (roll, provenance, why_not). `why_not` is filled only when there is
    something to say about a wall that HAS a consistency packet — a wall with
    none is silent, because ~85 walls a pass would otherwise each print a line
    saying nothing happened.

    NEWER IS A FACT ABOUT PROVENANCE, NOT ABOUT MTIME, and this route was
    written the other way round first and caught by its own dry run. The brief
    is "a roll NEWER than the promoted candidate", and a first draft asked the
    filesystem: `mtime(roll) > mtime(promoted candidate)`. Then the eight walls
    the first production pass refused came back from that test as "not newer" —
    because a `git checkout` had rewritten the promoted candidates' mtimes to
    the moment of the checkout, hours after the returns landed. mtime does not
    survive a checkout, a clone or a rebase, so an ordering built on it reports
    real work as stale on one machine and stale work as real on another, and
    it fails silently in both directions.

    The durable ordering was there all along, in what the packet IS.
    `--emit-consistency` reads the PROMOTED store and cuts a packet only for a
    wall already in it (`tools/make-scaffold.mjs`, and retries.json's own
    `_consistency` key says so) — so a consistency roll for this wall can only
    have been asked for AFTER the promotion it is answering. Its provenance is
    its date. What remains to check is whether the store has already taken it,
    and that is one comparison of the candidate path: a consistency roll that is
    not the candidate this wall is promoted from is a return the store has not
    taken.

    mtime survives only as the tie-break among several unspent consistency
    rolls — where being wrong costs which of two returns is tried first, and
    `_supersede_tried` brings the other one round on the next pass anyway.
    """
    rolls = [(r, prov) for r, prov in consistency_rolls(key)
             if _mtime(r["candidate"]) is not None]
    if not rolls:
        return None, None, None
    was = st.get("candidate")
    unspent = [(r, prov) for r, prov in rolls if r["candidate"] != was]
    if not unspent:
        return None, None, ("the consistency roll this wall has IS the candidate "
                            "it is promoted from; the store has already taken it")
    unspent.sort(key=lambda rp: (_mtime(rp[0]["candidate"]), rp[0]["id"]))
    return unspent[-1][0], unspent[-1][1], None


#: THE RULE THIS ROUTE IS CURRENTLY RUNNING, and a refusal is only spent
#: against the rule that refused it.
#:
#: Rule 1 (the first production pass, 2026-08-25) judged every wall ALONE and
#: admitted a camera PASS and nothing else. It superseded one wall of nine and
#: refused eight — five of them for reasons rule 2 exists to answer: two
#: `master_bedchamber` walls on "the room got worse" that only a SET can mend,
#: three camera FAILs and one promotion refusal that the SNAP is for.
#:
#: Rule 2 (the second pass, same day) judged NO-MAJORITY rooms as a set and put
#: the snap on the route. `master_bedchamber`'s four stood together at 4.474 ->
#: 4.144. It refused `garden_room/W` at 6.208 -> 3.904 for want of an
#: improvement clause, and it would have judged `guest_chamber`'s two rolls one
#: at a time because that room HAS a majority — the half that disobeys the
#: voice. Rule 3 is those two: `SUPERSEDE_IMPROVEMENT`, and joint judging
#: wherever a room has more than one roll.
#:
#: Without this the once-per-roll guard would keep every refusal standing
#: forever against rolls that are still on disk, and each fix would reach
#: nothing — the Navigator would have to hand-edit the run state to let a
#: corrected rule see the work it was written for. A refusal is a verdict of a
#: rule, so it is recorded with the rule's number and re-decided when that
#: number moves. Bump this whenever what the route ADMITS changes; never for a
#: message or a field.
SUPERSEDE_RULE = 3


def _supersede_tried(st, cand_rel):
    """Has this wall already been superseded-or-refused on THIS roll, under the
    rule that is running now? See SUPERSEDE_RULE."""
    at = st.get("supersede_attempt") or {}
    return (at.get("candidate") == cand_rel
            and at.get("rule", 1) == SUPERSEDE_RULE)


def audit_for(room):
    """The room, measured by row 40's own instrument over the store as it stands.

    Imported here rather than at module scope: it pulls numpy and PIL, and a
    sweep that never reaches this route should not pay for them.
    """
    import room_consistency
    return room_consistency.audit_room(room, room_consistency.FACINGS, [])


def supersede_stands(keys, before, after):
    """Did the repaint earn the store? (stands, sentence with both numbers).

    `keys` is the SET being judged — every eligible wall of the room, which is
    one wall where the room returned one roll. The verdict is one verdict for
    the whole set, because the set went into the store together.

    ONE VETO, FOUR WAYS TO STAND. The veto is regression: a repaint that leaves
    the room's worst pair further apart than it found them has made the room
    worse whatever else it did, and no other clause can buy that back. Past the
    veto the question is whether the room got better, and it can answer yes four
    ways — the distance fell by a stated margin, no wall of the set is still an
    outlier, the room dropped below the cut entirely, or a room that had NO
    majority (master_bedchamber's 2-2 split, the one Kabe named) now has one.

    THE MARGIN CLAUSE IS THE SECOND PASS'S CORRECTION AND IT COST A REAL WALL.
    `garden_room/W` came back from its consistency roll at 6.208 -> 3.904 — a
    37 % cut toward the room's ruling materials — and was REFUSED, because it
    was still the furthest facing from the room's median and the outlier clause
    was the only way past the veto. That clause was written to stop regressions
    and it was made to demand the whole distance in one roll instead. Progress
    the store should keep was thrown away and the previous painting put back.
    So `SUPERSEDE_IMPROVEMENT` stands beside it: a room measurably closer to
    reading as one room is a better store than the one before it, whether or not
    one more roll is still owed.
    """
    fs = [k.split("/")[1] for k in keys]
    b, a = before.get("score"), after.get("score")
    band_b, band_a = before.get("worst_band"), after.get("worst_band")
    if b is None or a is None:
        return False, ("the room cannot be scored %s the repaint (%s / %s), so "
                       "there is no number this supersede could be judged on"
                       % ("before" if b is None else "after",
                          before.get("verdict"), after.get("verdict")))
    nums = ("worst-band distance %.3f (%s) -> %.3f (%s)"
            % (b, band_b, a, band_a))
    if a > b + SUPERSEDE_EPS:
        return False, "the room got worse: " + nums
    cut = (b - a) / b if b > 0 else 0.0
    nums = "%s, %.0f%% closer" % (nums, cut * 100.0)
    still = [f for f in fs if f in (after.get("outliers") or [])]
    consistent = (before.get("verdict") == "mismatched"
                  and after.get("verdict") in ("consistent", "consistent-incomplete"))
    gained = bool(before.get("no_majority")) and not bool(after.get("no_majority"))
    who = "+".join(fs)
    if consistent:
        return True, ("the room now reads as one room; " + nums)
    if gained:
        return True, ("the room had no majority and now has one (%s); %s"
                      % ("".join(after.get("majority") or []), nums))
    if not still:
        return True, ("%s no longer stand%s outside the room; %s"
                      % (who, "" if len(fs) > 1 else "s", nums))
    if cut >= SUPERSEDE_IMPROVEMENT:
        return True, ("%s still stand%s outside the room, and the room is that "
                      "much closer to reading as one anyway; %s"
                      % ("+".join(still), "" if len(still) > 1 else "s", nums))
    return False, ("%s still stand%s outside the room (%s agree), the room is "
                   "still %s, and the repaint moved it less than the %.0f%% this "
                   "route keeps a wall for; %s"
                   % ("+".join(still), "" if len(still) > 1 else "s",
                      "".join(after.get("majority") or []) or "none",
                      after.get("verdict"), SUPERSEDE_IMPROVEMENT * 100.0, nums))


def _supersede_files(key):
    """Everything a promotion of this wall overwrites, so a refusal can undo it.

    THE DOCUMENTS ARE NOT OPTIONAL AND THEY ARE THE ONES THAT BITE. The store's
    png and meta are the obvious pair. The rest are the §5 promotion documents,
    one per round this route can promote through (`promote_reading` writes the
    manor one, `row35_snap.snap_to_round` the snapped one, `_doors_document` the
    repaired one) — and `recheck_doors` re-promotes every wall in the store FROM
    the document its meta's own `measured_round` names, against the candidate
    that meta names. Leave any of them describing a roll that was rolled back
    and `promote-backdrop.mjs` refuses the wall on a sha256 mismatch — "is not
    the image the measurement was measured off" — and the next
    `--recheck-doors` demotes to grid a wall this route decided to leave exactly
    as it found it. Every round is stashed rather than the one that happens to
    be used, because which door a wall goes out of is decided after the stash.
    """
    loc, f = key.split("/")
    out = [os.path.join(ROOT, "backdrops", loc, f + ".png"),
           os.path.join(ROOT, "backdrops", loc, f + ".meta.json"),
           os.path.join(OUT, "%s-%s.json" % (loc, f))]
    for rnd in (SNAP_ROUND, DOOR_ROUND):
        out.append(os.path.join(HERE, rnd, "%s-%s.json" % (loc, f)))
    return out


def _stash(key):
    """The bytes of everything a promotion would overwrite, held in memory."""
    return {p: (open(p, "rb").read() if os.path.exists(p) else None)
            for p in _supersede_files(key)}


def _restore(key, stash):
    """The previous files back, BYTE FOR BYTE. A refused supersede must leave
    the store exactly as it found it — anything less and a repaint the measure
    rejected has still moved what the page renders."""
    for p, blob in stash.items():
        if blob is None:
            if os.path.exists(p):
                os.remove(p)
            continue
        os.makedirs(os.path.dirname(p), exist_ok=True)
        with open(p, "wb") as fh:
            fh.write(blob)


SUPERSEDE_STOOD, SUPERSEDE_REFUSED = "stood", "refused"




def _record_supersede(st, key, roll, prov, outcome, reason, t0,
                      before=None, after=None, how=None, reading=None):
    """The wall's record, whichever way it went. Returns the printable line.

    EVERY OUTCOME WRITES IT. `supersede` says stood or refused,
    `superseded_from` names the candidate the new roll was measured against —
    on a refusal that is the candidate that STAYS, and `supersede_reason` says
    so in words — and `supersede_reason` carries both distances. The timings
    ledger gets `supersede.wall` either way, because a refusal costs a
    promotion, an audit and a restore, and it is the outcome nobody would think
    to measure (row 33's own lesson about the refused bake).
    """
    room = key.split("/")[0]
    st["supersede"] = outcome
    st["superseded_from"] = st.get("candidate")
    st["supersede_reason"] = reason
    st["supersede_attempt"] = {"candidate": roll["candidate"],
                               "roll_id": roll["id"], "outcome": outcome,
                               "provenance": prov, "exit": how,
                               "rule": SUPERSEDE_RULE,
                               "at": time.strftime("%Y-%m-%dT%H:%M:%S")}
    if how:
        st["supersede_exit"] = how
    if before is not None:
        def _half(r):
            return None if r is None else {
                "score": r.get("score"), "band": r.get("worst_band"),
                "verdict": r.get("verdict"), "outliers": r.get("outliers"),
                "no_majority": r.get("no_majority")}
        st["supersede_room"] = {"room": room, "before": _half(before),
                                "after": _half(after)}
    timings.record("supersede.wall", t0, time.time(), key,
                   {"candidate": roll["candidate"], "roll_id": roll["id"],
                    "outcome": outcome, "room": room, "exit": how,
                    "before": (before or {}).get("score"),
                    "after": (after or {}).get("score"),
                    "why": reason[:300]})
    return "  %-24s SUPERSEDE %s: %s" % (key, outcome.upper(), reason)


def _supersede_admit(key, e, st, roll, promote_fn):
    """Get this roll INTO the store on measured numbers, or say why it cannot.

    Returns (exit, reason, why_not, reading). `exit` is None when the wall never
    reached the store at all, and `why_not` is then the sentence for its record.

    THE DOORS, IN `route_exit`'S OWN ORDER, MINUS THE RULING. The ordinary
    promotion first, on a camera PASS. Then row 35's SNAP — for a roll the
    camera refused as much as for one the promotion refused, because the snap
    spends no roll and no waiver, corrects the frame deterministically and puts
    it back through the standing instrument, so a wall that comes back clean
    ships on its own MEASURED numbers. Then the snap's own second half, the
    door-void repair, for a corrected frame the door clause refuses. There is no
    fourth door: row 32's tolerance ruling is not on this route (see the
    SUPERSEDE block above).
    """
    cand_rel = roll["candidate"]
    fac = facing_of(key)
    ref = row23_lib.reference_from_entry(e)
    side = row23_lib.side_from_entry(key, e, fac)
    try:
        cfg = row23_lib.cfg_from_sidecar(side)
    except Exception as _ex:
        return None, None, ("config derivation failed for the consistency roll "
                            "%s: %s" % (roll["id"], _ex)), None
    d = measure_roll(key, roll, side, cfg, ref, picks_for_instrument())
    if d is None:
        return None, None, ("the consistency roll %s could not be measured at "
                            "all" % roll["id"]), None

    gate_why = None
    if d.get("verdict") == "PASS":
        ok, why = promote_fn(key, cand_rel, e, dict(side, candidate=cand_rel),
                             ref, d)
        if ok:
            return (EXIT_MEASURED,
                    "camera PASS %+.1f%% focal, promoted on measured numbers"
                    % (d.get("delta_focal_pct") or 0.0), None, d)
        gate_why = "the promotion instrument refused it: %s" % why
    else:
        gate_why = ("camera %s (%s)"
                    % (d.get("verdict"),
                       d.get("kind") or d.get("blocked_on") or "-"))

    ok, reason, res, promo_why = _exit_snap(key, cand_rel, d)
    if ok:
        return EXIT_SNAPPED, "%s, and %s" % (gate_why, reason), None, d
    snap_why = reason

    if res is not None and _is_door_refusal(promo_why):
        ok, reason = _exit_void_repair(key, st, res, promo_why)
        if ok:
            return EXIT_SNAPPED_VOIDED, "%s, and %s" % (gate_why, reason), None, d
        snap_why = "%s; %s" % (snap_why, reason)

    return None, None, ("%s, and neither the snap nor the door repair could "
                        "carry it — %s" % (gate_why, snap_why)), d


def _supersede_set(room, cands, before, promote_fn):
    """One room, one audit, one verdict for the whole set. See the block above.

    `cands` is [(key, entry, st, roll, prov)] — every eligible wall of the room,
    which is one wall where the room returned one roll. Returns (stood, lines):
    `stood` is [(key, reason, reading)] for the sweep's own promoted list, so
    the single end-of-sweep bake covers them.
    """
    t0 = time.time()
    if before is None:
        try:
            before = audit_for(room)
        except Exception as _aex:
            return [], [_record_supersede(st, key, roll, prov,
                                          SUPERSEDE_REFUSED,
                                          "the room could not be audited before "
                                          "the repaint (%s); the promoted wall "
                                          "stands" % str(_aex)[:200], t0)
                        for key, e, st, roll, prov in cands]

    placed, lines, stood = [], [], []
    for key, e, st, roll, prov in cands:
        # ONE WALL'S OWN REFUSAL IS ONE WALL'S. A roll the camera, the snap and
        # the repair all refuse never reached the store, so it is dropped from
        # the set and takes nothing down with it.
        was_st = json.loads(json.dumps(st))
        stash = _stash(key)
        how, reason, why_not, d = _supersede_admit(key, e, st, roll, promote_fn)
        if how is None:
            _restore(key, stash)
            st.clear()
            st.update(was_st)
            lines.append(_record_supersede(
                st, key, roll, prov, SUPERSEDE_REFUSED,
                "%s; the promoted wall stands" % why_not, t0, before, None, None, d))
            continue
        placed.append((key, st, roll, prov, stash, was_st, how, reason, d))

    if not placed:
        return stood, lines

    try:
        after = audit_for(room)
    except Exception as _aex:
        after_why = ("the room could not be audited with the set in place (%s), "
                     "so there is no number this supersede could be judged on"
                     % str(_aex)[:200])
        for key, st, roll, prov, stash, was_st, how, reason, d in placed:
            _restore(key, stash)
            st.clear()
            st.update(was_st)
            lines.append(_record_supersede(
                st, key, roll, prov, SUPERSEDE_REFUSED,
                "%s; the previous painting is back byte-for-byte" % after_why,
                t0, before, None, how, d))
        return stood, lines

    keys = [p[0] for p in placed]
    stands, sentence = supersede_stands(keys, before, after)
    joint = len(keys) > 1
    for key, st, roll, prov, stash, was_st, how, reason, d in placed:
        if not stands:
            _restore(key, stash)
            st.clear()
            st.update(was_st)
            lines.append(_record_supersede(
                st, key, roll, prov, SUPERSEDE_REFUSED,
                "%s%s, so the consistency roll %s is out and the previous "
                "painting is back byte-for-byte (it went in %s; provenance: %s)"
                % ("the room's %d rolls were judged together — " % len(keys)
                   if joint else "", sentence, roll["id"], how, prov),
                t0, before, after, how, d))
            continue
        why = ("%s%s, so the consistency roll %s replaces the painting (%s; "
               "provenance: %s)"
               % ("the set of %d was judged together — " % len(keys)
                  if joint else "", sentence, roll["id"], reason, prov))
        _record_supersede(st, key, roll, prov, SUPERSEDE_STOOD, why, t0,
                          before, after, how, d)
        # The record only moves on the STAND — `_record_supersede` has already
        # stamped `superseded_from` with the candidate this wall was promoted
        # from, and that is the one being replaced.
        st["candidate"] = roll["candidate"]
        st["status"] = "promoted"
        if st.get("correction") is not None:
            st["answered_correction"] = st.pop("correction")
        stood.append((key, "SUPERSEDED - %s" % why, d or {}))
    return stood, lines


def supersede_room(room, cands, promote_fn=None):
    """One room's eligible consistency rolls, judged together.

    EVERY ROLL OF ONE ROOM IS ONE ACT. A room with two returns has them because
    ONE measure named two facings against ONE ruling; they were asked in the
    same breath and they answer the same sentence, so putting one in and asking
    whether the room improved is asking about half a repaint. This was scoped to
    no-majority rooms first — master_bedchamber's 2-2 split, where a wall moved
    alone provably makes the worst pair worse — and the second pass showed the
    scope was the wrong shape rather than the wrong idea.

    `guest_chamber` is why. Its pixel majority is E+N, and E+N are the half that
    DISOBEYS the room's voice: the ruling is the plan's, not the pixels', so the
    two rolls going out are both moving AWAY from the majority and toward the
    ruling. Judge them one at a time and the first one measured is a facing
    walking away from the room's biggest cluster — which is exactly what the
    distance says, and exactly the wrong reading of what it is doing. Two rolls
    toward one ruling are judged together or they are not judged at all.

    A room with ONE roll is the same code with a set of one: one audit before,
    one after, one verdict. There is no second path left to keep in step.
    """
    promote_fn = promote_fn or globals()["do_promote"]
    try:
        before = audit_for(room)
    except Exception as _aex:
        _t = time.time()
        return [], [_record_supersede(st, key, roll, prov, SUPERSEDE_REFUSED,
                                      "the room could not be audited before the "
                                      "repaint (%s); the promoted wall stands"
                                      % str(_aex)[:200], _t)
                    for key, e, st, roll, prov in cands]
    return _supersede_set(room, cands, before, promote_fn)


def supersede_eligible(manifest, state, only=None):
    """room -> [(key, entry, st, roll, prov)], and the notes for the rest.

    A wall qualifies when it is promoted, its art is in the store, it is not
    fenced, and `supersede_roll` finds it a consistency roll newer than the
    candidate it was promoted from that has not already been tried.
    """
    by_room, notes = {}, []
    for e in manifest["entries"]:
        if e.get("skipped"):
            continue
        key = e["key"]
        if only and key != only:
            continue
        if key in NEVER_PROMOTE or key.split("/")[0] in M0_ROOMS:
            continue
        st = (state.get("walls") or {}).get(key)
        if not st or st.get("status") != "promoted":
            continue
        loc, f = key.split("/")
        if not os.path.exists(os.path.join(ROOT, "backdrops", loc,
                                           f + ".meta.json")):
            continue
        roll, prov, why_not = supersede_roll(key, st)
        if roll is None:
            if why_not:
                notes.append((key, why_not))
            continue
        if _supersede_tried(st, roll["candidate"]):
            # Nothing happened this pass, and that is what is returned. See the
            # ONCE PER ROLL note in the SUPERSEDE block above.
            continue
        by_room.setdefault(loc, []).append((key, e, st, roll, prov))
    return by_room, notes


def supersede_pass(manifest, state, only=None, promote_fn=None):
    """The whole route, room by room. Returns (stood, lines, notes, touched)."""
    by_room, notes = supersede_eligible(manifest, state, only)
    stood, lines, touched = [], [], []
    for room in sorted(by_room):
        cands = sorted(by_room[room], key=lambda c: c[0])
        touched += [c[0] for c in cands]
        s, l = supersede_room(room, cands, promote_fn)
        stood += s
        lines += l
    return stood, lines, notes, touched


def supersede_sweep(manifest, state, only=None, dry_run=False):
    """[row 40 seam] `--supersede-only`: this route and nothing else, as a table.

    The standing sweep runs this route inside itself; this is the same route
    with the arrivals half switched off, so the Navigator can point it at the
    nine walls on main and read what happened in one screen. A dry run measures
    and decides eligibility — which walls have a newer consistency roll and
    whether its camera passes — and writes nothing, because the room half
    cannot be answered without putting the paintings in the store.
    """
    if dry_run:
        by_room, notes = supersede_eligible(manifest, state, only)
        rows = []
        for room in sorted(by_room):
            try:
                before = audit_for(room)
            except Exception as _aex:
                before = {}
            n_room = len(by_room[room])
            for key, e, st, roll, prov in sorted(by_room[room],
                                                 key=lambda c: c[0]):
                fac = facing_of(key)
                ref = row23_lib.reference_from_entry(e)
                side = row23_lib.side_from_entry(key, e, fac)
                try:
                    cfg = row23_lib.cfg_from_sidecar(side)
                except Exception as _ex:
                    notes.append((key, "config derivation failed: %s" % _ex))
                    continue
                d = measure_roll(key, roll, side, cfg, ref,
                                 picks_for_instrument())
                cam = (d or {}).get("verdict") or "MEASURE-ERR"
                rows.append({
                    "key": key, "roll": roll["id"], "camera": cam,
                    "before": before.get("score"), "after": None,
                    "outcome": ("would try" if cam == "PASS"
                                else "would try via the snap"),
                    "why": "%s; judged %s" % (
                        prov, "with %s's other %d roll(s), as one act"
                        % (room, n_room - 1) if n_room > 1
                        else "alone (this room returned one roll)")})
        return rows, notes, 0

    stood, lines, notes, touched = supersede_pass(manifest, state, only)
    for line in lines:
        print(line)
    rows = []
    # THIS PASS'S WALLS AND NOT THE LEDGER'S. A wall superseded three passes ago
    # still carries its record; a table built by scanning the state for records
    # would report it again every time and the count would drift from what just
    # happened.
    for key in sorted(touched):
        st = (state.get("walls") or {}).get(key) or {}
        at = st.get("supersede_attempt") or {}
        r = st.get("supersede_room") or {}
        if not at.get("roll_id"):
            continue
        rows.append({"key": key, "roll": at.get("roll_id"),
                     "camera": at.get("exit") or "-",
                     "outcome": st.get("supersede"),
                     "before": (r.get("before") or {}).get("score"),
                     "after": (r.get("after") or {}).get("score"),
                     "why": st.get("supersede_reason")})
    return rows, notes, len(stood)

def sweep(manifest, state, do_promote=True):
    do_promote_fn = globals()["do_promote"]
    import row23_lib
    # THE CORPUS'S RULES, INJECTED — the row-23 instrument supplies the windows
    # and `measure.py` supplies how to read inside them, for the promotion half
    # exactly as for the camera half. Nothing in `row23_lib` re-derives a
    # detector this project has already paid for. See `picks_for_instrument`.
    picks = picks_for_instrument()
    os.makedirs(OUT, exist_ok=True)

    promoted, failed, parked, waiting = [], [], [], []
    # [row 40 seam] THE SUPERSEDE ROUTE RUNS FIRST AND A ROOM AT A TIME. It is
    # about walls already in the store, so it has nothing to do with the
    # arrivals below and cannot be folded into their per-wall loop: every roll
    # of one room answers one ruling and is judged as one act, and a loop that
    # visits one wall at a time can only ever ask half of it. Stands go on
    # `promoted` so the sweep's ONE end-of-sweep bake covers them exactly as it
    # covers any other promotion, and so the tally counts them where they
    # belong.
    if do_promote:
        _stood, _lines, _notes, _touched = supersede_pass(manifest, state)
        for _line in _lines:
            print(_line)          # the refusals; a stand prints as PROMOTE
        promoted += _stood
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
            # [B-ROUTING] AND THE DOOR IT LEFT BY GOES WITH THE CLAIM THAT IT
            # LEFT. A wall whose art is gone is not out any exit, and a record
            # saying `exit: snapped` beside a wall the page renders as grid is
            # the ledger lying about the store — which is this guard's own
            # defect read from one field over. `exit_attempt` STAYS: it is what
            # stops the routing re-snapping this candidate every pass, and the
            # candidate has not changed.
            st.pop("exit", None)
            st.pop("exit_reason", None)
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
            #
            # [row 40 seam] EXCEPT WHERE ITS OWN ROOM RE-ASKED IT — and that is
            # decided a ROOM at a time, above this loop, because every roll of
            # one room answers one ruling and is judged as one act. See
            # `supersede_pass` and the SUPERSEDE block.
            continue
        # THE STORE IS CHECKED, NOT THE STATE FILE ALONE. A wall promoted by any
        # route already has art, and a late duplicate return for it must not
        # clobber a promoted asset - the reuse rule is that art is generated
        # once, promoted once, and thereafter READ. Logged, never silent.
        #
        # [row 40 seam] ONE RETURN IS NOT A LATE DUPLICATE: a room-consistency
        # re-ask, which this loop cut for a wall it had already promoted. That
        # one is taken, on its own route and under its own gate, from the
        # promoted branch above - see the SUPERSEDE block. Everything else that
        # lands on a wall with art in the store is still ignored here.
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

        # The wall's own declared camera and its own scaffold record, off its
        # own manifest entry — never a global one. Both were written out here
        # until row 35 gave them a second reader (`row35_snap.py` measures the
        # frame it is about to rectify, through the same windows); they live in
        # `row23_lib` now so that one wall cannot be described two ways.
        ref = row23_lib.reference_from_entry(e)
        side = row23_lib.side_from_entry(key, e, fac)
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
            # See `measure_roll` — this loop's own body, lifted out so the
            # supersede route reads a roll on the same instrument.
            d = measure_roll(key, r, side, cfg, ref, picks)
            if d is None:
                continue
            if d.get("verdict") == "PASS" and (best is None or
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
                    # [B-ROUTING] The door this wall left by, on its own record,
                    # so the ledger can say how many walls each exit carried
                    # without inferring it from what a wall is missing.
                    _record_exit(st, EXIT_MEASURED,
                                 "the camera this frame's own returns fix; "
                                 "no correction and no waiver")
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
                    if corr and st["attempts"] < (e.get("retry_cap", 3) + st.get("cap_extension", 0)):
                        st["status"] = "retry"
                        st["correction"] = corr
                        st["hold_family"] = fam
                    else:
                        st["status"] = "held"
                        st["hold_family"] = fam or "promotion-refused"
                        st["correction"] = (
                            "camera PASS; held for the promotion instrument "
                            "[%s]: %s" % (st["hold_family"], corr or why))
                    # [B-ROUTING] AND THE HOLD IS WHERE THE EXITS STAND. The
                    # wall's camera passed and its candidate is on disk and
                    # readable — which is the whole precondition the Navigator
                    # was checking by hand between passes. Two kinds of hold
                    # reach the doors, and the second was found live:
                    #
                    #   the two RULED FAMILIES — the snap and the ruling are
                    #     what row 35 and row 32 were allocated for.
                    #   a DOOR REFUSAL, whatever family the wall is in. Four of
                    #     the five walls the door repair exists for hold under
                    #     `promotion-refused` and nothing else is wrong with
                    #     them: the camera passes, the snap corrects them, and
                    #     the plan rules a way through that the painting does
                    #     not draw. Gating the exits on the families alone left
                    #     exactly those four outside the door they were built.
                    #
                    # See SNAP_ROUND and DOOR_REPAIR_TOOL.
                    if fam in row23_lib.TOLERANCE_FAMILIES or _is_door_refusal(why):
                        ex, reason = route_exit(key, e, st, r["candidate"], d,
                                                side, ref, fam)
                        if ex in (EXIT_WARPED, EXIT_SNAPPED,
                                  EXIT_SNAPPED_VOIDED, EXIT_TOLERATED):
                            promoted.append((key, "%s - %s" % (ex.upper(), reason), d))
                            continue
                    # [guards-that-cannot-fail] a wall routed to grid may have had its
                    # correction waived/answered by the exit; the reason is what remains.
                    failed.append((key, d, st.get("correction") or st.get("exit_reason") or why))
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
            # [THE WARP EXIT] A CAMERA MISS THE WARP ABSORBS IS NOT A RE-ASK.
            # The gate is a sensor and not a judge: a frame whose lens or eye
            # reads outside the band is exactly the scale jitter the warp
            # corrects, so the correction is TRIED before a roll is spent
            # asking for the picture to be painted again. Only the warp's own
            # three refusals — the content misses — reach the re-ask below.
            if not LEGACY_EXITS and do_promote and worst.get("candidate"):
                ex, reason = route_exit(key, e, st, worst["candidate"], worst,
                                        side, ref, "camera-miss")
                if ex == EXIT_WARPED:
                    promoted.append((key, "WARPED - %s" % reason, worst))
                    continue
            if st["attempts"] >= (e.get("retry_cap", 3) + st.get("cap_extension", 0)):
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
    # [row 33 regression fix] One bake per sweep, not per wall — the walls were
    # each validated at promotion time, so a refusal here is global, loud, rare.
    _sweep_bad = _bake_if_promoted(len(promoted), reason="sweep")
    if _sweep_bad:
        print("  !! end-of-sweep bake refused: %s" % _sweep_bad)
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
    _rooms = {r["id"] for r in _PACK.plan.get("rooms", [])}
    for loc in sorted(os.listdir(os.path.join(ROOT, "backdrops"))):
        if loc not in _rooms:
            continue                       # [row 44] another pack's room is not this pack's to re-decide
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
            ["node", os.path.join(ROOT, "tools", "promote-backdrop.mjs"), "--pack", _PACK.name,
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
    # A DEMOTION MOVES THE STORE EXACTLY AS A PROMOTION DOES — it takes a wall
    # OUT — so the artifacts derived from the store are as stale after it, and
    # this route goes through the same one door. `len(kept) or len(demoted)`
    # rather than a bare `_bake()`: a recheck that changed nothing should cost
    # the pipeline nothing.
    bad = _bake_if_promoted(len(kept) + len(demoted), reason="recheck-doors")
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


#: The last warp record this process produced for each wall, so `--warp-held`
#: can print WHAT the correction cost without re-reading a file the route has
#: already restored on a refusal. Nothing decides on it; it is the table's.
WARP_RECORDS = {}
WARP_HELD_STATUSES = ("held", "retry", "parked")


def warp_held_pass(manifest, state, statuses=WARP_HELD_STATUSES, only=None):
    """[--warp-held] Every held, retrying or parked wall with a candidate, put
    through the one door. Returns `(rows, skipped)`.

    THE STANDING SWEEP DOES THIS BY ITSELF for every wall it routes; this is the
    same route run over the walls that were already holding when it became the
    route, which is the only thing a one-time flag is for. The fences are the
    sweep's own — nothing this loop is forbidden to promote is promoted here,
    and a wall whose art is already in the store is left alone.
    """
    rows, skipped = [], []
    for e in manifest["entries"]:
        if e.get("skipped"):
            continue
        key = e["key"]
        if only and key != only:
            continue
        st = state["walls"].get(key)
        if st is None or st.get("status") not in statuses:
            continue
        loc, fac_f = key.split("/")
        cand = st.get("candidate")
        if not cand or not os.path.exists(os.path.join(ROOT, cand)):
            skipped.append((key, st.get("status"), "no candidate on disk"))
            continue
        if key in NEVER_PROMOTE or loc in M0_ROOMS:
            skipped.append((key, st.get("status"),
                            "fenced from promotion by this loop"))
            continue
        if os.path.exists(os.path.join(ROOT, "backdrops", loc, fac_f + ".png")):
            skipped.append((key, st.get("status"), "art already in the store"))
            continue
        fac = facing_of(key)
        if fac.get("type") == "open":
            skipped.append((key, st.get("status"),
                            "an open facing: it has no ceiling line and no room "
                            "corners for the warp to pin"))
            continue
        ref = ref_for(e)
        side = side_for(key, e, fac)
        ex, reason = route_exit(key, e, st, cand, None, side, ref,
                                st.get("hold_family"), legacy=False, force=True)
        state["walls"][key] = st
        rows.append(_warp_row(key, st, ex, reason))
    return rows, skipped


def _warp_row(key, st, ex, reason):
    """One line of the `--warp-held` table: what the wall read before, what the
    warp did, what it cost, and whether it went into the store."""
    rec = WARP_RECORDS.get(key) or {}
    before = rec.get("before") or {}
    ws = _worst_segment(rec) or {}
    return dict(
        wall=key,
        before_focal=before.get("delta_focal_pct"),
        before_eye=before.get("delta_eye_pct"),
        verdict=("warped" if ex == EXIT_WARPED else
                 ("refused(%s)" % rec.get("clause")) if rec.get("clause")
                 else "no exit"),
        worst_segment=("%s x%.3f" % (ws.get("name"), ws.get("scale"))
                       if ws.get("scale") else None),
        revealed_px=rec.get("revealed_px"),
        promoted=(ex == EXIT_WARPED),
        why=(reason or "")[:110])


WARP_TABLE = ("wall", "before_focal", "before_eye", "verdict", "worst_segment",
              "revealed_px", "promoted")


def print_warp_table(rows, stream=sys.stdout):
    cols = list(WARP_TABLE)
    def cell(v):
        if v is None:
            return "-"
        if isinstance(v, bool):
            return "yes" if v else "no"
        if isinstance(v, float):
            return "%+.2f" % v
        return str(v)
    wide = {c: max([len(c)] + [len(cell(r.get(c))) for r in rows]) for c in cols}
    stream.write("  ".join(c.ljust(wide[c]) for c in cols) + "\n")
    stream.write("  ".join("-" * wide[c] for c in cols) + "\n")
    for r in rows:
        stream.write("  ".join(cell(r.get(c)).ljust(wide[c]) for c in cols) + "\n")
    for r in rows:
        if not r["promoted"]:
            stream.write("  %s: %s\n" % (r["wall"], r.get("why")))



def _foreign_instrument_walls():
    """Promoted walls whose meta was measured by another reader. [instrument.py]"""
    out = []
    try:
        plan = json.load(open(PLAN))
        for room in plan.get("rooms", []):
            for F in "NESW":
                mp = os.path.join(ROOT, "backdrops", room["id"], F + ".meta.json")
                if not os.path.exists(mp):
                    continue
                meta = json.load(open(mp))
                if meta.get("instrument") != INSTRUMENT_ID:
                    out.append("%s/%s" % (room["id"], F))
    except Exception:
        pass
    return out

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
    ap.add_argument("--warp-held", action="store_true",
                    help="the warp exit, run over every held, retrying or "
                         "parked wall that has a candidate: each is warped onto "
                         "its declared camera, re-measured, and promoted with "
                         "its warp record attached. Prints the table and bakes "
                         "once; it never publishes")
    ap.add_argument("--legacy-exits", action="store_true",
                    help="route through the OLD chain (row 35's snap, row 36's "
                         "void repair, row 32's tolerance ruling) instead of the "
                         "warp. Kept for one release so the change can be "
                         "clocked against the route it replaced")
    ap.add_argument("--supersede-only", action="store_true",
                    help="row 40 seam: run ONLY the supersede route — every "
                         "promoted wall whose room re-asked it and whose "
                         "consistency roll has returned — and print the table")
    ap.add_argument("--only", metavar="LOC/F",
                    help="with --supersede-only or --warp-held: one wall, by key")
    ap.add_argument("--derive-check", action="store_true",
                    help="[production law clause 6] report which committed "
                         "derived artifacts are stale against the store and "
                         "write nothing; exits non-zero if any is. This is the "
                         "guard `tools/publish-site.sh` refuses on and the one "
                         "the suite's freshness helper reads, so a publish and "
                         "a test cannot disagree about what fresh means")
    ap.add_argument("--derive-regen", action="store_true",
                    help="regenerate exactly the stale derived artifacts and "
                         "say what moved; the sweep does this itself after any "
                         "pass that promoted, superseded or re-snapped anything")
    ap.add_argument("--deep", action="store_true",
                    help="with --derive-check: regenerate into a temporary tree "
                         "and byte-compare, rather than trusting the recorded "
                         "input digests")
    ap.add_argument("--dry-run", action="store_true",
                    help="with --tolerance-sweep: measure and decide, write "
                         "nothing, and print what would promote and why. With "
                         "--supersede-only: which walls have a newer "
                         "consistency roll and whether its camera passes; the "
                         "room half cannot be answered without promoting")
    a = ap.parse_args()

    global LEGACY_EXITS
    LEGACY_EXITS = a.legacy_exits

    if a.dry_run and not (a.tolerance_sweep or a.supersede_only):
        print("row23-run: --dry-run belongs to --tolerance-sweep and "
              "--supersede-only; the ordinary sweep's dry run is --no-promote, "
              "which already exists")
        return 2

    if a.derive_check or a.derive_regen:
        import derived
        if a.derive_regen:
            _records, wrote, notes = derived.regenerate()
            for n in notes:
                print("  !! %s" % n)
            if not wrote:
                print("nothing to regenerate: every derived artifact is already "
                      "what its inputs say it should be")
        records = derived.check(deep=a.deep)
        derived._print(records)
        bad = derived.is_stale(records)
        print("\n%d of %d derived artifact(s) are stale against the store."
              % (len(bad), len(records)))
        return 1 if bad else 0

    if a.only and not (a.supersede_only or a.warp_held):
        print("row23-run: --only belongs to --supersede-only; the ordinary "
              "sweep decides every wall on its own and has no queue to filter")
        return 2

    if a.supersede_only:
        if not os.path.exists(MANIFEST):
            print("row23-run: no manifest")
            return 1
        manifest = json.load(open(MANIFEST))
        refresh_retries()
        state = load_state()
        rows, notes, stood = supersede_sweep(manifest, state, only=a.only,
                                             dry_run=a.dry_run)
        print("  %-24s %-10s %-15s %-9s %-9s %s"
              % ("WALL", "ROLL", "VIA" if not a.dry_run else "CAMERA",
                 "BEFORE", "AFTER", "OUTCOME"))
        for r in rows:
            print("  %-24s %-10s %-15s %-9s %-9s %s"
                  % (r["key"], r["roll"] or "-", r["camera"],
                     "-" if r["before"] is None else "%.3f" % r["before"],
                     "-" if r["after"] is None else "%.3f" % r["after"],
                     r["outcome"]))
            if r.get("why"):
                print("  %-24s   %s" % ("", r["why"]))
        for key, why in notes:
            print("  %-24s SKIPPED   %s" % (key, why))
        if a.dry_run:
            print("%s  DRY RUN: %d wall(s) carry a newer consistency roll; "
                  "nothing was written" % (time.strftime("%H:%M:%S"), len(rows)))
            return 0
        save_state(state)
        bad = _bake_if_promoted(stood, reason="supersede")
        print("%s  %d superseded, %d refused, %d wall(s) skipped%s"
              % (time.strftime("%H:%M:%S"), stood, len(rows) - stood, len(notes),
                 ("; BAKE REFUSED: " + bad) if bad else ""))
        if stood:
            print("  >> %d wall(s) repainted and baked. `tools/publish-site.sh` "
                  "is yours to run; this loop never publishes." % stood)
        return 1 if bad else 0

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
        bad = _bake_if_promoted(len(out), reason="tolerance-sweep")
        print("%s  %d wall(s) promoted under the tolerance ruling, %d not%s"
              % (time.strftime("%H:%M:%S"), len(out), len(skipped),
                 ("; BAKE REFUSED: " + bad) if bad else ""))
        return 1 if bad else 0

    if a.warp_held:
        if not os.path.exists(MANIFEST):
            print("row23-run: no manifest - run "
                  "`node tools/make-scaffold.mjs --emit-manor` first")
            return 1
        manifest = json.load(open(MANIFEST))
        state = load_state()
        rows, skipped = warp_held_pass(manifest, state, only=a.only)
        save_state(state)
        print_warp_table(rows)
        for key, status, why in skipped:
            print("  %-24s SKIPPED   %s (%s)" % (key, why, status))
        n = sum(1 for r in rows if r["promoted"])
        # ONE BAKE FOR THE WHOLE PASS, the sweep's own rule.
        bad = _bake_if_promoted(n, reason="warp-held")
        print("%s  %d of %d held wall(s) promoted through the warp, %d skipped%s"
              % (time.strftime("%H:%M:%S"), n, len(rows), len(skipped),
                 ("; BAKE REFUSED: " + bad) if bad else ""))
        if n:
            print("  >> `tools/publish-site.sh` is yours to run when you want "
                  "them live - this loop never publishes.")
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
        refresh_retries()
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
        # [instrument.py] A promoted wall that stands on another reader's
        # reading is named every pass, so a reader change cannot hide behind
        # "promoted" (reception/E did, once).
        _foreign = _foreign_instrument_walls()
        if _foreign:
            print("  >> %d promoted wall(s) stand on another instrument's reading (%s): "
                  "`--remeasure` re-promotes them" % (len(_foreign), ", ".join(_foreign[:6]) + (" ..." if len(_foreign) > 6 else "")))
        # [B-ROUTING] AND BY WHICH DOOR, because "promoted" is now four
        # different claims about how a wall got there and one of them is a
        # waiver the Captain signed.
        exits = {}
        for w in state["walls"].values():
            if w.get("exit"):
                exits[w["exit"]] = exits.get(w["exit"], 0) + 1
        if exits:
            print("  exits: " + ", ".join("%d %s" % (exits[k], k) for k in
                                          (EXIT_MEASURED, EXIT_WARPED,
                                           EXIT_SNAPPED, EXIT_SNAPPED_VOIDED,
                                           EXIT_TOLERATED, EXIT_GRID)
                                          if exits.get(k)))
        if done:
            print("  >> %d wall(s) promoted and baked. `tools/publish-site.sh` is yours to "
                  "run when you want them live - this loop never publishes." % done)
        if not a.watch:
            return 0
        time.sleep(a.interval)


if __name__ == "__main__":
    sys.exit(main())
