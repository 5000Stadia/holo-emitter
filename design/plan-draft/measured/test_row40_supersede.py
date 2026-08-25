#!/usr/bin/env python3
"""Row 40 seam — the SUPERSEDE route, on a synthetic store in a temp dir.

    python3 design/plan-draft/measured/test_row40_supersede.py

WHAT IS BEING ASSERTED. Row 40 cut nine re-ask packets for walls that were
ALREADY PROMOTED — their rooms did not read as one room — and the painter
returned all nine into a sweep whose rule was that a return for a wall with art
in the store is a late duplicate and is ignored. `row23_run.supersede_pass` is
the one narrow route through that rule, and this file is where it can be seen
going both ways:

    a newer consistency roll whose camera passes and whose room improves
        SUPERSEDES the promoted painting;
    the same roll where the room gets WORSE is refused and the previous png,
        meta and promotion document go back BYTE FOR BYTE;
    a roll older than the promoted candidate is not a supersede;
    an ORDINARY retry roll on a promoted wall is not a supersede either — that
        is still the late duplicate the reuse law is about, and the consistency
        provenance is the whole of the difference.

AND THE TWO THINGS THE FIRST PRODUCTION PASS SENT BACK, which are the whole
point of the cases named `set` and `snap` below:

    A NO-MAJORITY ROOM IS JUDGED AS A SET. `master_bedchamber/S` and `/W` each
        refused "the room got worse" because each was judged alone against a
        room whose other outliers were still their old paintings. The fixture
        here has that exact arithmetic — moving ONE wall to the ruling material
        puts the worst pair further apart (8.489 -> 9.011) and moving BOTH puts
        it under the cut (-> 3.118) — so the same three materials show the
        single verdict refusing and the joint verdict standing.
    A CAMERA FAIL GOES THROUGH THE SNAP. `guest_chamber/S`, `/W` and
        `master_bedchamber/E` refused as camera FAIL, and `closet_chamber/W` on
        the horizon instrument. Row 35 exists for that under the Captain's
        single-return doctrine, and the snapped frame is judged by the room
        measure like any PASS. Row 32's tolerance ruling is NOT on this route,
        and `_exit_tolerance` is stubbed to raise for every case in this file so
        that a draft which reached for it fails rather than passes quietly.

THE STORE IS SYNTHETIC AND SO IS THE PAINTER. The room pixels come from
`test_room_consistency`'s own material painter — one home for "what a made-up
oak looks like", so a change to the instrument's calibration corpus cannot leave
this file asserting against a different world. The camera half is supplied
through the reading CACHE the sweep already keeps (`measure_roll` reads
`OUT/<id>.json` before it measures anything), which is the real code path a
second pass over any wall takes. The node promotion and row 35's warp are
stand-ins that do to the store exactly what `promote-backdrop.mjs` and
`row35_snap.snap_to_round` do to it, because what is under test is the ROUTE,
its verdict and its rollback — not the two tools the rest of the suite covers.
"""
import json
import os
import shutil
import sys
import tempfile
import unittest

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import test_room_consistency as TRC                       # noqa: E402
from test_room_consistency import META, build, paint      # noqa: E402

# Materials this file adds to that corpus, each for a measured reason.
#
#   `verdigris` is a ceiling FURTHER from the room's ruled plaster than the
#   outlier already in the store is — the refusal case needs a repaint that
#   genuinely made the room worse, and "worse" has to be a measured fact rather
#   than a label, which neither `stone` nor `oak` could carry.
#
#   `slate` and `warmlime` are the master_bedchamber shape, measured before
#   they were written down (probe run 2026-08-25, four facings a room, the
#   instrument's own `audit_room`):
#
#       slate  vs limeplaster   8.489   the 2-2 split, mismatched, no majority
#       slate  vs warmlime      9.011   ONE wall moved to the ruling: WORSE
#       limeplaster vs warmlime 3.118   BOTH walls moved: under the 3.75 cut
TRC.MATERIALS["verdigris"] = ((40.0, 130.0, 95.0), 0.55)
TRC.MATERIALS["slate"] = ((70.0, 82.0, 104.0), 0.30)
TRC.MATERIALS["warmlime"] = ((212.0, 186.0, 150.0), 0.09)

ROOM = "chamber"
SPLIT = "bedchamber"
#: The room's ruled ceiling, the outlier row 40 re-asked, and what a repaint
#: that made the room WORSE would look like.
RULED, OUTLIER, WORSE = "limeplaster", "darkjoists", "verdigris"
#: The no-majority room: two facings of `SPLIT_A`, two of `SPLIT_B`, and the
#: voice's ruling material is `SPLIT_RULED`. See the numbers above.
SPLIT_A, SPLIT_B, SPLIT_RULED = "slate", "limeplaster", "warmlime"


def _entry(key, rolls):
    """A manor manifest entry, the shape `row23_lib` reads. Numbers are
    `servants_hall/N`'s own, so the geometry the instrument derives is a real
    wall's rather than a plausible-looking invention."""
    loc, f = key.split("/")
    return {
        "key": key, "room": loc, "facing": f, "type": "enclosed",
        "packet": "design/batches/row23-scaffold/manor/%s-%s" % (loc, f),
        "scaffold_sha256": "0" * 64,
        "px_per_m_at_wall": 155.15151515151516, "camera_wall_m": 6.6,
        "floor_line_y": 0.6930119554924243, "horizon_y": 0.51376953125,
        "corner_x0_px": 147.39393939393938, "corner_x1_px": 1388.6060606060605,
        "storey_height_m": 2.8, "wall_width_m": 8, "implied_focal_px": 1024,
        "brackets": {
            "_derivation": "servants_hall/N's own, unchanged", "band": 0.08,
            "floor_window": {"centre": 709.64, "half_width": 14.68},
            "rail_band": {"centre": 562.25, "half_width": 11.79},
            "ceiling_band": {"centre": 275.22, "half_width": 34.75},
            "carrier_windows": [], "carrier_tolerance_px": 233,
            "rail_columns": [[147, 457], [691, 1388]]},
        "stamped": [], "chair_rail_y": 562.25, "rolls": rolls, "retry_cap": 3,
    }


def _consistency_block():
    """What `--emit-consistency` stamps on a packet it cuts."""
    return {"band": "ceiling", "D": 4.9, "cut": 3.75,
            "clusters": [["E", "N", "W"], ["S"]], "majority": ["E", "N", "W"],
            "no_majority": False,
            "ruling": {"walls": "oak wainscot", "ceiling": "a plain "
                       "lime-plastered ceiling", "floor": "wide oak floorboards",
                       "hangings": None}}


CONSISTENCY_CORRECTION = (
    "This room is ruled to ONE set of materials and this facing does not show "
    "them. Paint exactly those materials on every surface in this view.")


class Supersede(unittest.TestCase):
    def setUp(self):
        self.root = tempfile.mkdtemp(prefix="holo-supersede-")
        self.backdrops = os.path.join(self.root, "backdrops")
        self.out = os.path.join(self.root, "readings")
        os.makedirs(self.out)
        self.ledger = os.path.join(self.root, "timings.jsonl")
        os.environ["HOLO_TIMINGS"] = self.ledger

        import row23_run
        import room_consistency
        self.R, self.C = row23_run, room_consistency
        self._saved = {k: getattr(row23_run, k)
                       for k in ("ROOT", "HERE", "OUT", "RETRY_ENTRIES",
                                 "do_promote", "_exit_snap", "_exit_tolerance")}
        self._saved_backdrops = room_consistency.BACKDROPS
        row23_run.ROOT = self.root
        row23_run.HERE = self.root
        row23_run.OUT = self.out
        row23_run.RETRY_ENTRIES = {}
        row23_run.do_promote = self._promote
        row23_run._exit_snap = self._snap
        # ROW 32'S RULING IS NOT ON THIS ROUTE. Every case in this file fails
        # loudly if anything reaches for it, rather than passing quietly while
        # a wall ships on a declared camera nobody asked for.
        row23_run._exit_tolerance = self._no_tolerance
        room_consistency.BACKDROPS = self.backdrops

        self.states = {}                  # the run state this pass reads
        self.refuse_promotion = None      # a string makes the node tool refuse
        self.cripple_meta = False         # a promotion whose meta cannot be read
        self.snap_clean = True            # does row 35 correct the frame?
        self.snapped = []                 # what the snap was handed, in order

    def tearDown(self):
        for k, v in self._saved.items():
            setattr(self.R, k, v)
        self.C.BACKDROPS = self._saved_backdrops
        os.environ.pop("HOLO_TIMINGS", None)
        shutil.rmtree(self.root, ignore_errors=True)

    # --- the stand-ins ----------------------------------------------------

    def _promote(self, key, cand_rel, e, side, ref, reading, tolerance=False):
        """What `promote-backdrop.mjs` does to the store, and nothing else."""
        if self.refuse_promotion:
            return False, self.refuse_promotion
        loc, f = key.split("/")
        d = os.path.join(self.backdrops, loc)
        os.makedirs(d, exist_ok=True)
        shutil.copyfile(os.path.join(self.root, cand_rel),
                        os.path.join(d, "%s.png" % f))
        meta = dict(META, promoted_from=cand_rel)
        if self.cripple_meta:
            del meta["storey_height_m"]
        with open(os.path.join(d, "%s.meta.json" % f), "w") as fh:
            json.dump(meta, fh)
        # …and the §5 promotion document beside it, which `promote_reading`
        # writes and `--recheck-doors` re-promotes every wall in the store FROM.
        with open(os.path.join(self.out, "%s-%s.json" % (loc, f)), "w") as fh:
            json.dump({"_source_sha256": cand_rel}, fh)
        return True, None

    def _snap(self, key, cand_rel, reading):
        """Row 35's own contract: rectify, re-measure, and promote if clean.

        The warp itself is not what this file is about — the ROUTING to it is,
        so this records what the route handed the snap and then does to the
        store what a clean snap does: promotes through its own round.
        """
        self.snapped.append((key, cand_rel, (reading or {}).get("verdict")))
        if not self.snap_clean:
            return (False, "the snap refused this frame: its anchors cannot be "
                    "read at all", None, None)
        ok, why = self._promote(key, cand_rel, None, None, None, reading)
        if not ok:
            return False, "the snapped frame's promotion refused it: %s" % why, \
                {"candidate": cand_rel}, why
        return (True, "row 35 rectified this frame onto its own declared camera "
                "and the standing instrument then passed it",
                {"candidate": cand_rel}, None)

    def _no_tolerance(self, *a, **k):
        raise AssertionError("the tolerance ruling is not on the supersede "
                             "route and must never be reached from it")

    # --- the world --------------------------------------------------------

    def _room(self, ceilings, room=ROOM, wall="oak"):
        """The promoted store: one room, four facings, ceilings as given."""
        build(self.backdrops, room,
              {f: (ceilings[f], wall, "oak", 1.0) for f in ceilings})

    def _roll(self, key, roll_id, ceiling, mtime, wall="oak"):
        """A returned painting on disk, at a chosen mtime."""
        loc, f = key.split("/")
        rel = os.path.join("backdrops", "source", "%s-%s" % (loc, f),
                           "row23-%s.png" % roll_id)
        p = os.path.join(self.root, rel)
        os.makedirs(os.path.dirname(p), exist_ok=True)
        Image.fromarray(paint(4242, ceiling, wall, "oak")).save(p)
        os.utime(p, (mtime, mtime))
        return {"roll": 1, "id": roll_id, "candidate": rel}

    def _reading(self, roll, verdict="PASS"):
        """The cached reading the sweep would have taken. See the header."""
        d = {"verdict": verdict, "delta_focal_pct": 1.2, "kind": None,
             "id": roll["id"], "candidate": roll["candidate"],
             "px_per_m_at_wall": 155.0}
        with open(os.path.join(self.out, "%s.json" % roll["id"]), "w") as fh:
            json.dump(d, fh)
        return d

    def _promoted_state(self, key, cand_rel, mtime):
        """A wall the loop already promoted, and what it was promoted from."""
        p = os.path.join(self.root, cand_rel)
        os.makedirs(os.path.dirname(p), exist_ok=True)
        loc, f = key.split("/")
        shutil.copyfile(os.path.join(self.backdrops, loc, "%s.png" % f), p)
        os.utime(p, (mtime, mtime))
        with open(os.path.join(self.out, "%s-%s.json" % (loc, f)), "w") as fh:
            json.dump({"_source_sha256": cand_rel}, fh)
        st = {"attempts": 2, "status": "promoted", "candidate": cand_rel}
        self.states[key] = st
        return st

    def _packet(self, key, roll, consistency=True, mark=True):
        self.R.RETRY_ENTRIES.setdefault(key, []).append({
            "key": key, "attempt": 1, "rolls": [roll],
            "correction": CONSISTENCY_CORRECTION if mark else
                          "draw 1.180x larger: 155.2 px/m at the wall plane",
            **({"consistency": _consistency_block()} if consistency else {})})

    # --- running the route as the sweep runs it ---------------------------

    def _pass(self, only=None):
        """One `supersede_pass` over everything registered, as `sweep` calls it."""
        manifest = {"entries": [_entry(k, []) for k in sorted(self.states)]}
        stood, lines, notes, touched = self.R.supersede_pass(
            manifest, {"walls": self.states}, only)
        return {"stood": stood, "lines": lines, "notes": notes,
                "touched": touched}

    def _one(self, key):
        """(outcome, sentence) for one wall after a pass. None when untouched."""
        r = self._pass()
        st = self.states.get(key) or {}
        out = st.get("supersede") if key in r["touched"] else None
        line = next((ln for ln in r["lines"] if key in ln), None)
        if line is None:
            line = next(("%s: %s" % (k, w) for k, w in r["notes"] if k == key),
                        None)
        return out, line or st.get("supersede_reason")

    def _store_bytes(self, key):
        """Everything a promotion of this wall overwrites — the store's pair AND
        the §5 promotion document, which is the file `--recheck-doors` would
        later demote the wall over if a refused supersede left it moved."""
        loc, f = key.split("/")
        out = []
        for p in (os.path.join(self.backdrops, loc, "%s.png" % f),
                  os.path.join(self.backdrops, loc, "%s.meta.json" % f),
                  os.path.join(self.out, "%s-%s.json" % (loc, f))):
            with open(p, "rb") as fh:
                out.append(fh.read())
        return tuple(out)

    def _ledger_steps(self):
        if not os.path.exists(self.ledger):
            return []
        with open(self.ledger) as fh:
            return [json.loads(ln)["step"] for ln in fh if ln.strip()]

    # --- the single-wall route --------------------------------------------

    def test_newer_consistency_roll_that_mends_the_room_supersedes(self):
        """The nine walls' own case: outlier ceiling, repainted to the ruling."""
        key = ROOM + "/S"
        self._room({"N": RULED, "E": RULED, "W": RULED, "S": OUTLIER})
        self._promoted_state(
            key, "backdrops/source/%s-S/row23-old00001.png" % ROOM, 1000)
        before = self.C.audit_room(ROOM, self.C.FACINGS, [])
        self.assertEqual(before["verdict"], "mismatched", before["why"])
        self.assertEqual(before["outliers"], ["S"], before["why"])

        roll = self._roll(key, "new00001", RULED, 2000)
        self._reading(roll)
        self._packet(key, roll)

        out, line = self._one(key)
        st = self.states[key]
        self.assertEqual(out, self.R.SUPERSEDE_STOOD, line)
        with open(os.path.join(self.root, roll["candidate"]), "rb") as fh:
            self.assertEqual(self._store_bytes(key)[0], fh.read())
        after = self.C.audit_room(ROOM, self.C.FACINGS, [])
        self.assertEqual(after["verdict"], "consistent", after["why"])
        self.assertEqual(st["supersede"], self.R.SUPERSEDE_STOOD)
        self.assertEqual(st["superseded_from"],
                         "backdrops/source/%s-S/row23-old00001.png" % ROOM)
        self.assertEqual(st["candidate"], roll["candidate"])
        self.assertEqual(st["supersede_exit"], self.R.EXIT_MEASURED)
        self.assertIn("%.3f" % before["score"], st["supersede_reason"])
        self.assertIn("%.3f" % after["score"], st["supersede_reason"])
        self.assertIn("consistency` block", st["supersede_reason"])
        self.assertIn("supersede.wall", self._ledger_steps())

    def test_a_repaint_that_makes_the_room_worse_is_refused_and_restored(self):
        """The rollback, byte for byte. A repaint the measure rejects must not
        have moved what the page renders."""
        key = ROOM + "/S"
        self._room({"N": RULED, "E": RULED, "W": RULED, "S": OUTLIER})
        self._promoted_state(
            key, "backdrops/source/%s-S/row23-old00002.png" % ROOM, 1000)
        was = self._store_bytes(key)
        before = self.C.audit_room(ROOM, self.C.FACINGS, [])

        roll = self._roll(key, "new00002", WORSE, 2000)
        self._reading(roll)
        self._packet(key, roll)

        out, line = self._one(key)
        st = self.states[key]
        self.assertEqual(out, self.R.SUPERSEDE_REFUSED, line)
        self.assertEqual(self._store_bytes(key), was,
                         "the previous png, meta and promotion document must "
                         "all come back byte for byte")
        after = self.C.audit_room(ROOM, self.C.FACINGS, [])
        self.assertEqual(after["score"], before["score"],
                         "the restored store must measure exactly as it did")
        self.assertEqual(st["candidate"], st["superseded_from"],
                         "a refused supersede leaves the wall on its own candidate")
        self.assertIn("%.3f" % before["score"], st["supersede_reason"])
        self.assertIn("%.3f" % st["supersede_room"]["after"]["score"],
                      st["supersede_reason"])
        self.assertGreater(st["supersede_room"]["after"]["score"],
                           before["score"],
                           "the fixture must actually have made the room worse")
        self.assertIn("supersede.wall", self._ledger_steps())

    def test_a_roll_the_store_has_already_taken_is_ignored(self):
        """The wall was superseded by this very roll on an earlier pass, so it
        IS the promoted candidate now. Nothing is newer than itself, and a route
        that re-promoted it would re-audit nine rooms every pass forever.

        NEWNESS IS PROVENANCE, NOT MTIME, and this route's own dry run against
        main proved why: a `git checkout` had rewritten every promoted
        candidate's mtime to hours AFTER the returns landed, and an mtime test
        called all eight outstanding walls stale. A consistency packet is cut
        only for a wall already in the store, so the block IS the date; what is
        checked here is whether the store has taken this roll yet."""
        key = ROOM + "/S"
        self._room({"N": RULED, "E": RULED, "W": RULED, "S": OUTLIER})
        roll = self._roll(key, "already01", RULED, 1500)
        self._promoted_state(key, roll["candidate"], 3000)
        was = self._store_bytes(key)
        self._reading(roll)
        self._packet(key, roll)

        out, line = self._one(key)
        self.assertIsNone(out, line)
        self.assertIn("already taken it", line)
        self.assertEqual(self._store_bytes(key), was)
        self.assertNotIn("supersede", self.states[key])
        self.assertNotIn("supersede.wall", self._ledger_steps())

    def test_an_old_mtime_does_not_hide_a_return_the_store_never_took(self):
        """The regression the dry run found. The promoted candidate's mtime is
        NEWER than the returned roll's — which is what a checkout leaves behind
        — and the return must still be seen."""
        key = ROOM + "/S"
        self._room({"N": RULED, "E": RULED, "W": RULED, "S": OUTLIER})
        self._promoted_state(
            key, "backdrops/source/%s-S/row23-old00003.png" % ROOM, 9000)
        roll = self._roll(key, "checkout1", RULED, 1500)   # older on disk
        self._reading(roll)
        self._packet(key, roll)

        out, line = self._one(key)
        self.assertEqual(out, self.R.SUPERSEDE_STOOD, line)
        self.assertEqual(self.states[key]["candidate"], roll["candidate"])

    def test_an_ordinary_retry_roll_on_a_promoted_wall_is_not_a_supersede(self):
        """THE RULE, stated: only a ROOM-CONSISTENCY packet can repaint a wall
        that is already in the store. An ordinary re-ask — cut for a camera
        miss, a door refusal, an unfitted horizon — was answered by the
        promotion that put the wall there, and a roll of it landing afterwards
        is the late duplicate the reuse law refuses. Newer, camera-passing, and
        it would have mended the room: still ignored."""
        key = ROOM + "/S"
        self._room({"N": RULED, "E": RULED, "W": RULED, "S": OUTLIER})
        self._promoted_state(
            key, "backdrops/source/%s-S/row23-old00004.png" % ROOM, 1000)
        was = self._store_bytes(key)
        roll = self._roll(key, "new00004", RULED, 2000)
        self._reading(roll)
        self._packet(key, roll, consistency=False, mark=False)

        out, line = self._one(key)
        self.assertIsNone(out, line)
        self.assertIsNone(line, "a wall with no consistency packet says nothing")
        self.assertEqual(self._store_bytes(key), was)
        self.assertNotIn("supersede", self.states[key])

    def test_a_packet_with_no_block_is_identified_by_its_correction(self):
        """The stated fallback: if the emitter ever writes no `consistency`
        block, the packet is keyed on the correction that names the room's
        ruling materials — and the record says which of the two identified it."""
        key = ROOM + "/S"
        self._room({"N": RULED, "E": RULED, "W": RULED, "S": OUTLIER})
        self._promoted_state(
            key, "backdrops/source/%s-S/row23-old00005.png" % ROOM, 1000)
        roll = self._roll(key, "new00005", RULED, 2000)
        self._reading(roll)
        self._packet(key, roll, consistency=False, mark=True)

        out, line = self._one(key)
        self.assertEqual(out, self.R.SUPERSEDE_STOOD, line)
        self.assertIn("no `consistency` block",
                      self.states[key]["supersede_reason"])

    def test_a_room_that_cannot_be_scored_after_the_repaint_is_refused(self):
        """No gate that cannot fail (production law clause 5). A room the
        instrument cannot put a number on after the repaint is not a room this
        route may claim to have improved, and the previous painting goes back."""
        key = ROOM + "/S"
        # Two facings only, so crippling the repainted one's meta leaves the
        # room with a single measurable facing and therefore no score at all.
        self._room({"N": RULED, "S": OUTLIER})
        self._promoted_state(
            key, "backdrops/source/%s-S/row23-old00009.png" % ROOM, 1000)
        was = self._store_bytes(key)
        roll = self._roll(key, "new00009", RULED, 2000)
        self._reading(roll)
        self._packet(key, roll)
        self.cripple_meta = True

        out, line = self._one(key)
        self.assertEqual(out, self.R.SUPERSEDE_REFUSED, line)
        self.assertIn("no number", self.states[key]["supersede_reason"])
        self.assertEqual(self._store_bytes(key), was,
                         "the previous painting must come back byte for byte")

    def test_a_wall_is_not_routed_twice_on_the_same_roll(self):
        """ONCE PER ROLL, the discipline `exit_attempt` imposes on the routing:
        without it every pass would re-promote and re-audit nine walls."""
        key = ROOM + "/S"
        self._room({"N": RULED, "E": RULED, "W": RULED, "S": OUTLIER})
        self._promoted_state(
            key, "backdrops/source/%s-S/row23-old00008.png" % ROOM, 1000)
        roll = self._roll(key, "new00008", WORSE, 2000)
        self._reading(roll)
        self._packet(key, roll)

        first, _ = self._one(key)
        self.assertEqual(first, self.R.SUPERSEDE_REFUSED)
        n = self._ledger_steps().count("supersede.wall")
        second, line = self._one(key)
        self.assertIsNone(second, line)
        self.assertEqual(self._ledger_steps().count("supersede.wall"), n,
                         "the second pass must not spend a promotion or an audit")

    def test_the_fenced_walls_are_fenced_here_too(self):
        """`study/N` and M0's own rooms are fences the whole file keeps; a route
        that repaints a promoted wall is exactly where one would be forgotten."""
        for key in ("study/N", "hall/E"):
            self.states[key] = {"status": "promoted",
                                "candidate": "backdrops/source/x.png"}
        r = self._pass()
        self.assertEqual(r["touched"], [])
        for key in ("study/N", "hall/E"):
            self.assertNotIn("supersede", self.states[key], key)

    # --- the snap, and the ruling that is not here ------------------------

    def test_a_camera_fail_goes_through_the_snap(self):
        """The first production pass's own gap. `guest_chamber/S`, `/W` and
        `master_bedchamber/E` came back camera FAIL and were refused with "no
        snap, no tolerance"; row 35 exists for exactly that, and a snapped frame
        that re-measures clean is judged by the room measure like any PASS."""
        key = ROOM + "/S"
        self._room({"N": RULED, "E": RULED, "W": RULED, "S": OUTLIER})
        self._promoted_state(
            key, "backdrops/source/%s-S/row23-old00010.png" % ROOM, 1000)
        roll = self._roll(key, "new00010", RULED, 2000)
        self._reading(roll, verdict="FAIL")
        self._packet(key, roll)

        out, line = self._one(key)
        st = self.states[key]
        self.assertEqual(out, self.R.SUPERSEDE_STOOD, line)
        self.assertEqual(st["supersede_exit"], self.R.EXIT_SNAPPED)
        self.assertEqual(self.snapped, [(key, roll["candidate"], "FAIL")],
                         "the snap must have been handed this wall's own roll")
        self.assertIn("camera FAIL", st["supersede_reason"])
        self.assertEqual(self.C.audit_room(ROOM, self.C.FACINGS, [])["verdict"],
                         "consistent")

    def test_a_promotion_refusal_goes_through_the_snap_too(self):
        """`closet_chamber/W`'s case: the camera passes and the promotion
        instrument refuses on the horizon. That is the ordinary hold family and
        the snap door covers it — it is what row 35 was allocated for."""
        key = ROOM + "/S"
        self._room({"N": RULED, "E": RULED, "W": RULED, "S": OUTLIER})
        self._promoted_state(
            key, "backdrops/source/%s-S/row23-old00011.png" % ROOM, 1000)
        roll = self._roll(key, "new00011", RULED, 2000)
        self._reading(roll)
        self._packet(key, roll)
        self.refuse_promotion = "promote refused: carries no ceiling-ramp horizon"

        # the node tool refuses the ordinary promotion; the snap's own promotion
        # is the one that lands, so it is let through once the route reaches it
        def _snap(key_, cand, reading):
            self.refuse_promotion = None
            return self._snap(key_, cand, reading)
        self.R._exit_snap = _snap

        out, line = self._one(key)
        st = self.states[key]
        self.assertEqual(out, self.R.SUPERSEDE_STOOD, line)
        self.assertEqual(st["supersede_exit"], self.R.EXIT_SNAPPED)
        self.assertIn("no ceiling-ramp horizon", st["supersede_reason"])

    def test_a_frame_the_snap_cannot_correct_is_refused_and_restored(self):
        """The honest end of the route: camera refused, snap refused, and the
        wall in the store is left exactly as it was found."""
        key = ROOM + "/S"
        self._room({"N": RULED, "E": RULED, "W": RULED, "S": OUTLIER})
        self._promoted_state(
            key, "backdrops/source/%s-S/row23-old00012.png" % ROOM, 1000)
        was = self._store_bytes(key)
        roll = self._roll(key, "new00012", RULED, 2000)
        self._reading(roll, verdict="FAIL")
        self._packet(key, roll)
        self.snap_clean = False

        out, line = self._one(key)
        st = self.states[key]
        self.assertEqual(out, self.R.SUPERSEDE_REFUSED, line)
        self.assertIn("camera FAIL", st["supersede_reason"])
        self.assertIn("the snap refused this frame", st["supersede_reason"])
        self.assertEqual(self._store_bytes(key), was)

    # --- the room, judged as a set ----------------------------------------

    def _bedchamber(self, *eligible):
        """master_bedchamber's shape: N and S one material, E and W another,
        and the voice's ruling is a third. See the measured numbers at the top."""
        self._room({"N": SPLIT_A, "S": SPLIT_A, "E": SPLIT_B, "W": SPLIT_B},
                   room=SPLIT)
        before = self.C.audit_room(SPLIT, self.C.FACINGS, [])
        self.assertTrue(before["no_majority"],
                        "the fixture must be a room with no majority: %s"
                        % before["why"])
        for i, f in enumerate(eligible):
            key = "%s/%s" % (SPLIT, f)
            self._promoted_state(
                key, "backdrops/source/%s-%s/row23-was%d.png" % (SPLIT, f, i),
                1000)
            roll = self._roll(key, "set0000%d" % i, SPLIT_RULED, 2000)
            self._reading(roll)
            self._packet(key, roll)
        return before

    def test_a_no_majority_room_is_judged_as_a_set(self):
        """THE RULE THE FIRST PRODUCTION PASS SENT BACK. A 2-2 split has no
        majority to join: move one wall to the ruling material and it now
        disagrees with the two it used to agree with, so the worst pair gets
        FURTHER apart on the way to agreement. Move both and the room comes
        right. Judged one at a time such a room can never pass, which is what
        `master_bedchamber/S` and `/W` each refused on."""
        before = self._bedchamber("N", "S")
        r = self._pass()
        self.assertEqual(sorted(k for k, _, _ in r["stood"]),
                         [SPLIT + "/N", SPLIT + "/S"], r["lines"])
        after = self.C.audit_room(SPLIT, self.C.FACINGS, [])
        self.assertEqual(after["verdict"], "consistent", after["why"])
        self.assertLess(after["score"], before["score"])
        for f in "NS":
            st = self.states["%s/%s" % (SPLIT, f)]
            self.assertEqual(st["supersede"], self.R.SUPERSEDE_STOOD)
            self.assertIn("set of 2", st["supersede_reason"])
            self.assertEqual(st["supersede_room"]["after"]["score"],
                             after["score"])

    def test_one_wall_of_a_no_majority_room_alone_still_cannot_mend_it(self):
        """And the set is what fixes that, never a loosened veto. With only one
        of the two rolls returned the room genuinely IS worse afterwards, the
        route says so with both numbers, and the painting goes back."""
        before = self._bedchamber("N")
        key = SPLIT + "/N"
        was = self._store_bytes(key)
        out, line = self._one(key)
        st = self.states[key]
        self.assertEqual(out, self.R.SUPERSEDE_REFUSED, line)
        self.assertIn("the room got worse", st["supersede_reason"])
        self.assertGreater(st["supersede_room"]["after"]["score"],
                           before["score"])
        self.assertEqual(self._store_bytes(key), was)

    def test_a_wall_the_camera_refuses_is_dropped_from_the_set_not_the_set(self):
        """The one per-wall restore inside a joint judgement: a roll that never
        reached the store at all is dropped, and the walls that did reach it are
        still judged together."""
        self._bedchamber("N", "S")
        # S's roll misses the camera and the snap cannot correct it
        self.snap_clean = False
        bad = SPLIT + "/S"
        with open(os.path.join(self.out, "set00001.json")) as fh:
            d = json.load(fh)
        d["verdict"] = "FAIL"
        with open(os.path.join(self.out, "set00001.json"), "w") as fh:
            json.dump(d, fh)
        was_bad = self._store_bytes(bad)

        r = self._pass()
        self.assertEqual(self.states[bad]["supersede"], self.R.SUPERSEDE_REFUSED)
        self.assertEqual(self._store_bytes(bad), was_bad,
                         "the wall that never reached the store is untouched")
        # N alone cannot mend this room, so it is refused on the numbers rather
        # than carried by S's absence
        self.assertEqual(self.states[SPLIT + "/N"]["supersede"],
                         self.R.SUPERSEDE_REFUSED)
        self.assertEqual(r["stood"], [])


class Stands(unittest.TestCase):
    """`supersede_stands` alone — the ways the second half can be true."""

    def _r(self, score, verdict, outliers, no_majority=False, majority=None):
        return {"score": score, "verdict": verdict, "outliers": outliers,
                "worst_band": "ceiling", "no_majority": no_majority,
                "majority": majority or []}

    def setUp(self):
        import row23_run
        self.R = row23_run

    def test_worse_distance_is_a_veto_even_when_the_outlier_clears(self):
        ok, why = self.R.supersede_stands(
            ["chamber/S"], self._r(4.0, "mismatched", ["S"]),
            self._r(5.0, "mismatched", ["N"]))
        self.assertFalse(ok, why)
        self.assertIn("got worse", why)

    def test_no_majority_gaining_a_majority_stands(self):
        """master_bedchamber's shape — the room Kabe named. Every facing is an
        outlier in a 2-2 split, so "no longer the outlier" can only become true
        when the room gains a majority, and that is the clause that says so."""
        ok, why = self.R.supersede_stands(
            ["master_bedchamber/N"],
            self._r(4.5, "mismatched", ["E", "N", "S", "W"], no_majority=True),
            self._r(4.4, "mismatched", ["E"], majority=["N", "S", "W"]))
        self.assertTrue(ok, why)
        self.assertIn("no majority and now has one", why)

    def test_still_the_outlier_at_the_same_distance_is_refused(self):
        ok, why = self.R.supersede_stands(
            ["chamber/S"], self._r(4.0, "mismatched", ["S"]),
            self._r(4.0, "mismatched", ["S"], majority=["E", "N", "W"]))
        self.assertFalse(ok, why)
        self.assertIn("still stands outside", why)

    def test_a_set_is_judged_on_every_wall_in_it(self):
        """One wall of the set still outside the room refuses the whole set —
        they went into the store together and they are judged together.

        The `before` here still HAS a majority, because a room that had none and
        gains one stands by that clause alone and would never reach the outlier
        question."""
        b = self._r(9.0, "mismatched", ["N", "S"], majority=["E", "W"])
        ok, why = self.R.supersede_stands(
            ["b/N", "b/S"], b, self._r(8.0, "mismatched", ["S"],
                                       majority=["E", "N", "W"]))
        self.assertFalse(ok, why)
        self.assertIn("S still stands outside", why)
        ok, why = self.R.supersede_stands(
            ["b/N", "b/S"], b, self._r(8.0, "mismatched", ["E"],
                                       majority=["N", "S", "W"]))
        self.assertTrue(ok, why)
        self.assertIn("N+S no longer stand outside", why)

    def test_an_unscorable_room_is_never_a_stand(self):
        """A room the instrument cannot score is not a room this route may
        claim to have improved."""
        ok, why = self.R.supersede_stands(
            ["chamber/S"], self._r(4.0, "mismatched", ["S"]),
            self._r(None, "insufficient", []))
        self.assertFalse(ok, why)
        self.assertIn("no number", why)


if __name__ == "__main__":
    unittest.main(verbosity=2)
