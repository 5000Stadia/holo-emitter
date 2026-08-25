#!/usr/bin/env python3
"""Row 40 seam — the SUPERSEDE route, on a synthetic store in a temp dir.

    python3 design/plan-draft/measured/test_row40_supersede.py

WHAT IS BEING ASSERTED. Row 40 cut nine re-ask packets for walls that were
ALREADY PROMOTED — their rooms did not read as one room — and the painter
returned all nine into a sweep whose rule was that a return for a wall with art
in the store is a late duplicate and is ignored. `row23_run.supersede_wall` is
the one narrow route through that rule, and this file is where it can be seen
going both ways:

    a newer consistency roll whose camera passes and whose room improves
        SUPERSEDES the promoted painting;
    the same roll where the room gets WORSE is refused and the previous png and
        meta go back BYTE FOR BYTE;
    a roll older than the promoted candidate is not a supersede;
    an ORDINARY retry roll on a promoted wall is not a supersede either — that
        is still the late duplicate the reuse law is about, and the consistency
        provenance is the whole of the difference.

THE STORE IS SYNTHETIC AND SO IS THE PAINTER. The room pixels come from
`test_room_consistency`'s own material painter — one home for "what a made-up
oak looks like", so a change to the instrument's calibration corpus cannot leave
this file asserting against a different world. The camera half is supplied
through the reading CACHE the sweep already keeps (`measure_roll` reads
`OUT/<id>.json` before it measures anything), which is the real code path a
second pass over any wall takes; and the node promotion is a stand-in that does
exactly what `promote-backdrop.mjs` does to the store — writes the png and the
meta — because what is under test is the ROUTE and its rollback, not the
promotion tool the rest of the suite already covers.
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

# One home for the synthetic materials and the declared geometry. See above.
import test_room_consistency as TRC                       # noqa: E402
from test_room_consistency import META, build, paint      # noqa: E402

# One material this file adds to that corpus: a ceiling FURTHER from the room's
# ruled plaster than the outlier already in the store is. The refusal case needs
# a repaint that genuinely made the room worse, and "worse" has to be a
# measured fact rather than a label — `stone` and `oak` are both nearer to
# `limeplaster` than `darkjoists`, so neither could carry it.
TRC.MATERIALS["verdigris"] = ((40.0, 130.0, 95.0), 0.55)

ROOM = "chamber"
#: The room's ruled ceiling, the outlier row 40 re-asked, and what a repaint
#: that made the room WORSE would look like.
RULED, OUTLIER, WORSE = "limeplaster", "darkjoists", "verdigris"


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
                       for k in ("ROOT", "OUT", "RETRY_ENTRIES", "do_promote")}
        self._saved_backdrops = room_consistency.BACKDROPS
        row23_run.ROOT = self.root
        row23_run.OUT = self.out
        row23_run.RETRY_ENTRIES = {}
        row23_run.do_promote = self._promote
        room_consistency.BACKDROPS = self.backdrops
        self.refuse_promotion = None      # set to a string to make node refuse
        self.cripple_meta = False         # a promotion whose meta cannot be read

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

    # --- the world --------------------------------------------------------

    def _room(self, ceilings):
        """The promoted store: one room, four facings, ceilings as given."""
        build(self.backdrops, ROOM,
              {f: (ceilings[f], "oak", "oak", 1.0) for f in "NESW"})

    def _roll(self, key, roll_id, ceiling, mtime):
        """A returned painting on disk, at a chosen mtime."""
        loc, f = key.split("/")
        rel = os.path.join("backdrops", "source", "%s-%s" % (loc, f),
                           "row23-%s.png" % roll_id)
        p = os.path.join(self.root, rel)
        os.makedirs(os.path.dirname(p), exist_ok=True)
        Image.fromarray(paint(4242, ceiling, "oak", "oak")).save(p)
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
        # the §5 document the promotion that put this wall here wrote
        with open(os.path.join(self.out, "%s-%s.json" % (loc, f)), "w") as fh:
            json.dump({"_source_sha256": cand_rel}, fh)
        return {"attempts": 2, "status": "promoted", "candidate": cand_rel}

    def _packet(self, key, roll, consistency=True, mark=True):
        self.R.RETRY_ENTRIES.setdefault(key, []).append({
            "key": key, "attempt": 1, "rolls": [roll],
            "correction": CONSISTENCY_CORRECTION if mark else
                          "draw 1.180x larger: 155.2 px/m at the wall plane",
            **({"consistency": _consistency_block()} if consistency else {})})

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
            return [json.loads(l)["step"] for l in fh if l.strip()]

    # --- the cases --------------------------------------------------------

    def test_newer_consistency_roll_that_mends_the_room_supersedes(self):
        """The nine walls' own case: outlier ceiling, repainted to the ruling."""
        key = ROOM + "/S"
        self._room({"N": RULED, "E": RULED, "W": RULED, "S": OUTLIER})
        st = self._promoted_state(
            key, "backdrops/source/%s-S/row23-old00001.png" % ROOM, 1000)
        before = self.C.audit_room(ROOM, self.C.FACINGS, [])
        self.assertEqual(before["verdict"], "mismatched", before["why"])
        self.assertEqual(before["outliers"], ["S"], before["why"])

        roll = self._roll(key, "new00001", RULED, 2000)
        self._reading(roll)
        self._packet(key, roll)

        out, line, d = self.R.supersede_wall(key, _entry(key, []), st)
        self.assertEqual(out, self.R.SUPERSEDE_STOOD, line)
        # the store now holds the returned painting, byte for byte
        with open(os.path.join(self.root, roll["candidate"]), "rb") as fh:
            self.assertEqual(self._store_bytes(key)[0], fh.read())
        # and the room reads as one room
        after = self.C.audit_room(ROOM, self.C.FACINGS, [])
        self.assertEqual(after["verdict"], "consistent", after["why"])
        # the record, every field the route owes
        self.assertEqual(st["supersede"], self.R.SUPERSEDE_STOOD)
        self.assertEqual(st["superseded_from"],
                         "backdrops/source/%s-S/row23-old00001.png" % ROOM)
        self.assertEqual(st["candidate"], roll["candidate"])
        self.assertIn("%.3f" % before["score"], st["supersede_reason"])
        self.assertIn("%.3f" % after["score"], st["supersede_reason"])
        self.assertIn("consistency` block", st["supersede_reason"])
        self.assertIn("supersede.wall", self._ledger_steps())

    def test_a_repaint_that_makes_the_room_worse_is_refused_and_restored(self):
        """The rollback, byte for byte. A repaint the measure rejects must not
        have moved what the page renders."""
        key = ROOM + "/S"
        self._room({"N": RULED, "E": RULED, "W": RULED, "S": OUTLIER})
        st = self._promoted_state(
            key, "backdrops/source/%s-S/row23-old00002.png" % ROOM, 1000)
        was = self._store_bytes(key)
        before = self.C.audit_room(ROOM, self.C.FACINGS, [])

        roll = self._roll(key, "new00002", WORSE, 2000)
        self._reading(roll)
        self._packet(key, roll)

        out, line, d = self.R.supersede_wall(key, _entry(key, []), st)
        self.assertEqual(out, self.R.SUPERSEDE_REFUSED, line)
        self.assertEqual(self._store_bytes(key), was,
                         "the previous png, meta and promotion document must "
                         "all come back byte for byte")
        after = self.C.audit_room(ROOM, self.C.FACINGS, [])
        self.assertEqual(after["score"], before["score"],
                         "the restored store must measure exactly as it did")
        self.assertEqual(st["supersede"], self.R.SUPERSEDE_REFUSED)
        self.assertEqual(st["candidate"], st["superseded_from"],
                         "a refused supersede leaves the wall on its own candidate")
        # BOTH numbers, as the refusal is required to carry
        self.assertIn("%.3f" % before["score"], st["supersede_reason"])
        self.assertIn("%.3f" % st["supersede_room"]["after"]["score"],
                      st["supersede_reason"])
        self.assertGreater(st["supersede_room"]["after"]["score"],
                           before["score"],
                           "the fixture must actually have made the room worse")
        self.assertIn("supersede.wall", self._ledger_steps())

    def test_a_roll_older_than_the_promoted_candidate_is_ignored(self):
        key = ROOM + "/S"
        self._room({"N": RULED, "E": RULED, "W": RULED, "S": OUTLIER})
        st = self._promoted_state(
            key, "backdrops/source/%s-S/row23-old00003.png" % ROOM, 3000)
        was = self._store_bytes(key)
        roll = self._roll(key, "old00099", RULED, 1500)   # older than promoted
        self._reading(roll)
        self._packet(key, roll)

        out, line, d = self.R.supersede_wall(key, _entry(key, []), st)
        self.assertIsNone(out, line)
        self.assertIn("not newer", line)
        self.assertEqual(self._store_bytes(key), was)
        self.assertNotIn("supersede", st)
        self.assertNotIn("supersede.wall", self._ledger_steps())

    def test_an_ordinary_retry_roll_on_a_promoted_wall_is_not_a_supersede(self):
        """THE RULE, stated: only a ROOM-CONSISTENCY packet can repaint a wall
        that is already in the store. An ordinary re-ask — cut for a camera
        miss, a door refusal, an unfitted horizon — was answered by the
        promotion that put the wall there, and a roll of it landing afterwards
        is the late duplicate the reuse law refuses. Newer, camera-passing, and
        it would have mended the room: still ignored."""
        key = ROOM + "/S"
        self._room({"N": RULED, "E": RULED, "W": RULED, "S": OUTLIER})
        st = self._promoted_state(
            key, "backdrops/source/%s-S/row23-old00004.png" % ROOM, 1000)
        was = self._store_bytes(key)
        roll = self._roll(key, "new00004", RULED, 2000)
        self._reading(roll)
        self._packet(key, roll, consistency=False, mark=False)

        out, line, d = self.R.supersede_wall(key, _entry(key, []), st)
        self.assertIsNone(out, line)
        self.assertIsNone(line, "a wall with no consistency packet says nothing")
        self.assertEqual(self._store_bytes(key), was)
        self.assertNotIn("supersede", st)

    def test_a_packet_with_no_block_is_identified_by_its_correction(self):
        """The stated fallback: if the emitter ever writes no `consistency`
        block, the packet is keyed on the correction that names the room's
        ruling materials — and the record says which of the two identified it."""
        key = ROOM + "/S"
        self._room({"N": RULED, "E": RULED, "W": RULED, "S": OUTLIER})
        st = self._promoted_state(
            key, "backdrops/source/%s-S/row23-old00005.png" % ROOM, 1000)
        roll = self._roll(key, "new00005", RULED, 2000)
        self._reading(roll)
        self._packet(key, roll, consistency=False, mark=True)

        out, line, d = self.R.supersede_wall(key, _entry(key, []), st)
        self.assertEqual(out, self.R.SUPERSEDE_STOOD, line)
        self.assertIn("no `consistency` block", st["supersede_reason"])

    def test_a_roll_the_camera_refuses_never_reaches_the_store(self):
        """Camera PASS is the gate and this route has no second door: no snap,
        no tolerance ruling. A FAIL is refused before anything is promoted."""
        key = ROOM + "/S"
        self._room({"N": RULED, "E": RULED, "W": RULED, "S": OUTLIER})
        st = self._promoted_state(
            key, "backdrops/source/%s-S/row23-old00006.png" % ROOM, 1000)
        was = self._store_bytes(key)
        roll = self._roll(key, "new00006", RULED, 2000)
        self._reading(roll, verdict="FAIL")
        self._packet(key, roll)

        out, line, d = self.R.supersede_wall(key, _entry(key, []), st)
        self.assertEqual(out, self.R.SUPERSEDE_REFUSED, line)
        self.assertIn("camera FAIL", st["supersede_reason"])
        self.assertEqual(self._store_bytes(key), was)

    def test_a_refused_promotion_leaves_the_store_as_it_found_it(self):
        """`promote-backdrop.mjs` refusing mid-route is not a licence to leave
        half a wall in the store."""
        key = ROOM + "/S"
        self._room({"N": RULED, "E": RULED, "W": RULED, "S": OUTLIER})
        st = self._promoted_state(
            key, "backdrops/source/%s-S/row23-old00007.png" % ROOM, 1000)
        was = self._store_bytes(key)
        roll = self._roll(key, "new00007", RULED, 2000)
        self._reading(roll)
        self._packet(key, roll)
        self.refuse_promotion = "promote refused: no painted way through"

        out, line, d = self.R.supersede_wall(key, _entry(key, []), st)
        self.assertEqual(out, self.R.SUPERSEDE_REFUSED, line)
        self.assertIn("no painted way through", st["supersede_reason"])
        self.assertEqual(self._store_bytes(key), was)

    def test_a_room_that_cannot_be_scored_after_the_repaint_is_refused(self):
        """No gate that cannot fail (production law clause 5). A room the
        instrument cannot put a number on after the repaint is not a room this
        route may claim to have improved, and the previous painting goes back."""
        key = ROOM + "/S"
        # Two facings only, so crippling the repainted one's meta leaves the
        # room with a single measurable facing and therefore no score at all.
        build(self.backdrops, ROOM, {"N": (RULED, "oak", "oak", 1.0),
                                     "S": (OUTLIER, "oak", "oak", 1.0)})
        st = self._promoted_state(
            key, "backdrops/source/%s-S/row23-old00009.png" % ROOM, 1000)
        was = self._store_bytes(key)
        roll = self._roll(key, "new00009", RULED, 2000)
        self._reading(roll)
        self._packet(key, roll)
        self.cripple_meta = True

        out, line, d = self.R.supersede_wall(key, _entry(key, []), st)
        self.assertEqual(out, self.R.SUPERSEDE_REFUSED, line)
        self.assertIn("no number", st["supersede_reason"])
        self.assertEqual(self._store_bytes(key), was,
                         "the previous png and meta must come back byte for byte")

    def test_a_wall_is_not_routed_twice_on_the_same_roll(self):
        """ONCE PER ROLL, the discipline `exit_attempt` imposes on the routing:
        without it every pass would re-promote and re-audit nine walls."""
        key = ROOM + "/S"
        self._room({"N": RULED, "E": RULED, "W": RULED, "S": OUTLIER})
        st = self._promoted_state(
            key, "backdrops/source/%s-S/row23-old00008.png" % ROOM, 1000)
        roll = self._roll(key, "new00008", WORSE, 2000)
        self._reading(roll)
        self._packet(key, roll)

        first, _, _ = self.R.supersede_wall(key, _entry(key, []), st)
        self.assertEqual(first, self.R.SUPERSEDE_REFUSED)
        n = self._ledger_steps().count("supersede.wall")
        second, line, _ = self.R.supersede_wall(key, _entry(key, []), st)
        self.assertIsNone(second, line)
        self.assertEqual(self._ledger_steps().count("supersede.wall"), n,
                         "the second pass must not spend a promotion or an audit")

    def test_the_fenced_walls_are_fenced_here_too(self):
        """`study/N` and M0's own rooms are fences the whole file keeps; a route
        that repaints a promoted wall is exactly where one would be forgotten."""
        for key in ("study/N", "hall/E"):
            st = {"status": "promoted", "candidate": "backdrops/source/x.png"}
            out, line, d = self.R.supersede_wall(key, _entry(key, []), st)
            self.assertIsNone(out, key)
            self.assertNotIn("supersede", st, key)


class Stands(unittest.TestCase):
    """`supersede_stands` alone — the three ways the second half can be true."""

    def _r(self, score, verdict, outliers, no_majority=False, majority=None):
        return {"score": score, "verdict": verdict, "outliers": outliers,
                "worst_band": "ceiling", "no_majority": no_majority,
                "majority": majority or []}

    def setUp(self):
        import row23_run
        self.R = row23_run

    def test_worse_distance_is_a_veto_even_when_the_outlier_clears(self):
        ok, why = self.R.supersede_stands(
            "chamber/S", self._r(4.0, "mismatched", ["S"]),
            self._r(5.0, "mismatched", ["N"]))
        self.assertFalse(ok, why)
        self.assertIn("got worse", why)

    def test_no_majority_gaining_a_majority_stands(self):
        """master_bedchamber's shape — the room Kabe named. Every facing is an
        outlier in a 2-2 split, so "no longer the outlier" can only become true
        when the room gains a majority, and that is the clause that says so."""
        ok, why = self.R.supersede_stands(
            "master_bedchamber/N",
            self._r(4.5, "mismatched", ["E", "N", "S", "W"], no_majority=True),
            self._r(4.4, "mismatched", ["E"], majority=["N", "S", "W"]))
        self.assertTrue(ok, why)
        self.assertIn("no majority and now has one", why)

    def test_still_the_outlier_at_the_same_distance_is_refused(self):
        ok, why = self.R.supersede_stands(
            "chamber/S", self._r(4.0, "mismatched", ["S"]),
            self._r(4.0, "mismatched", ["S"], majority=["E", "N", "W"]))
        self.assertFalse(ok, why)
        self.assertIn("still stands outside", why)

    def test_an_unscorable_room_is_never_a_stand(self):
        """A room the instrument cannot score is not a room this route may
        claim to have improved."""
        ok, why = self.R.supersede_stands(
            "chamber/S", self._r(4.0, "mismatched", ["S"]),
            self._r(None, "insufficient", []))
        self.assertFalse(ok, why)
        self.assertIn("no number", why)


if __name__ == "__main__":
    unittest.main(verbosity=2)
