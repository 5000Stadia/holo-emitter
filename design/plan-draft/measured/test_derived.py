#!/usr/bin/env python3
"""The derivation's decisions, asserted — production law clause 6.

    python3 design/plan-draft/measured/test_derived.py

WHAT IS UNDER TEST AND WHAT IS NOT. `derived.py` has two halves. The half that
RUNS THE GENERATORS is proved against the real store by `derived.py --check
--deep`, which regenerates every artifact into a temp tree and byte-compares —
there is no cheaper honest proof of "a fresh run writes these bytes" than a
fresh run, and it costs three quarters of a minute. The half asserted HERE is
the half that DECIDES, and it is the half a reader has to trust between those
runs:

    the input digest    what counts as an input, that an artifact is never its
                        own, and that adding a file moves the digest as surely
                        as editing one — otherwise a promotion that ADDS a wall
                        leaves every audit that counts walls reading fresh
    idempotence         a second run regenerates nothing and says so. The
                        deliverable claims it; a claim about what a tool does
                        NOT do cannot be checked by running it once
    the strip rule      re-cut where the packet has not been rolled, `stale_from`
                        where it has. Which one applies is a fact about the tree
                        and never a judgement, so it is asserted as one
    the escaped frame   a reading that names a picture outside the tree is STALE
                        and is re-derived at the production path, rather than
                        followed off the edge of the repository. That is not
                        hypothetical: the first draft of the repair snapped into
                        a temp directory and copied the two files into place, so
                        the reading it wrote named a frame in `/tmp` — the very
                        mismatch this artifact exists to prevent, authored by
                        its own repair

Nothing here touches the store: the registry is replaced with a synthetic one
over a temp directory, which is also the only way to assert the LOOP (an
artifact that is another artifact's input) without waiting for a real one to go
stale.
"""
import json
import os
import shutil
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

os.environ.setdefault("HOLO_TIMINGS", "off")
import derived as D                                              # noqa: E402


class Sandbox(unittest.TestCase):
    """A temp tree standing in for ROOT, with the registry replaced.

    `derived.py` addresses everything relative to ROOT — that is what makes its
    records readable — so a test of its decisions moves ROOT rather than
    inventing a second addressing scheme it would then be asserting.
    """

    def setUp(self):
        self.tmp = tempfile.mkdtemp(prefix="derived-test-")
        self._saved = (D.ROOT, D.ARTIFACTS, D.ACTIONS, D.BY_ID, D.STATE_PATH,
                       D.RETRIES_FILE)
        D.ROOT = self.tmp
        D.STATE_PATH = os.path.join(self.tmp, "derived-state.json")

    def tearDown(self):
        (D.ROOT, D.ARTIFACTS, D.ACTIONS, D.BY_ID, D.STATE_PATH,
         D.RETRIES_FILE) = self._saved
        shutil.rmtree(self.tmp, ignore_errors=True)

    def write(self, rel, text):
        p = os.path.join(self.tmp, rel)
        os.makedirs(os.path.dirname(p) or self.tmp, exist_ok=True)
        with open(p, "w") as fh:
            fh.write(text)
        return p


class InputDigest(Sandbox):
    def test_it_moves_when_an_input_moves(self):
        self.write("in/a.txt", "one")
        first, n = D.input_digest(["in/*.txt"])
        self.assertEqual(n, 1)
        self.write("in/a.txt", "two")
        self.assertNotEqual(D.input_digest(["in/*.txt"])[0], first)

    def test_it_moves_when_an_input_is_merely_ADDED(self):
        """The promotion case: nothing already counted has changed."""
        self.write("in/a.txt", "one")
        first, _ = D.input_digest(["in/*.txt"])
        self.write("in/b.txt", "one")           # same bytes, second file
        second, n = D.input_digest(["in/*.txt"])
        self.assertEqual(n, 2)
        self.assertNotEqual(second, first)

    def test_an_artifact_is_never_its_own_input(self):
        """Or nothing can ever settle: writing it would stale it."""
        self.write("in/a.txt", "one")
        self.write("in/report.json", "{}")
        with_it, n1 = D.input_digest(["in/*"])
        without, n2 = D.input_digest(["in/*"], own=["in/report.json"])
        self.assertEqual((n1, n2), (2, 1))
        self.assertNotEqual(with_it, without)
        # and the state record is never anybody's input either
        self.write("derived-state.json", "{}")
        self.assertEqual(D.input_digest(["*.json"])[1], 0)

    def test_a_directory_named_as_an_artifact_excludes_what_is_under_it(self):
        self.write("round/one.json", "{}")
        self.assertEqual(D.input_digest(["round/*.json"], own=["round"])[1], 0)


class Idempotence(Sandbox):
    """A second run regenerates nothing and says so.

    The registry is two artifacts sharing one action, which is the real shape
    (`material_provenance` and `material_legacy` are one `--audit-materials`
    run) and the shape where an action can be run twice for one pass.
    """

    def registry(self):
        self.runs = []

        def action(_findings=None):
            self.runs.append(1)
            wrote = []
            for name in ("out/a.json", "out/b.json"):
                p = os.path.join(self.tmp, name)
                data = (open(os.path.join(self.tmp, "in/a.txt")).read()
                        + name).encode()
                if D._write_if_moved(p, data):
                    wrote.append(name)
            return wrote, None

        D.ACTIONS = {"both": action}
        D.ARTIFACTS = [
            {"id": "a", "paths": ["out/a.json"], "invalidated_by": "the input",
             "inputs": ["in/*.txt"], "action": "both", "regen": "the action"},
            {"id": "b", "paths": ["out/b.json"], "invalidated_by": "the input",
             "inputs": ["in/*.txt"], "action": "both", "regen": "the action"},
        ]
        D.BY_ID = {x["id"]: x for x in D.ARTIFACTS}

    def test_first_run_writes_second_run_does_not(self):
        self.write("in/a.txt", "one")
        self.registry()
        _records, wrote, notes = D.regenerate(verbose=False)
        self.assertEqual(sorted(wrote), ["out/a.json", "out/b.json"])
        self.assertEqual(notes, [])
        self.assertEqual(len(self.runs), 1, "one action, one run, two artifacts")

        _records, wrote, _notes = D.regenerate(verbose=False)
        self.assertEqual(wrote, [], "a second run regenerated something")
        self.assertEqual(len(self.runs), 1, "and it did not even run the action")
        self.assertEqual(D.is_stale(D.check()), [])

    def test_the_input_moving_is_what_brings_it_back(self):
        self.write("in/a.txt", "one")
        self.registry()
        D.regenerate(verbose=False)
        self.write("in/a.txt", "two")
        stale = D.is_stale(D.check())
        self.assertEqual(sorted(r["id"] for r in stale), ["a", "b"])
        self.assertIn("inputs have moved", stale[0]["why"][0][1])
        _records, wrote, _notes = D.regenerate(verbose=False)
        self.assertEqual(sorted(wrote), ["out/a.json", "out/b.json"])

    def test_an_artifact_that_has_never_been_derived_is_unproven_not_fresh(self):
        """A gate that cannot fail is not a gate: with no record of what a file
        was made from, `fresh` would be a guess with an all-clear's authority."""
        self.write("in/a.txt", "one")
        self.write("out/a.json", "typed by hand")
        self.write("out/b.json", "typed by hand")
        self.registry()
        rec = {r["id"]: r for r in D.check()}
        self.assertEqual(rec["a"]["state"], D.UNPROVEN)
        self.assertIn("nothing records what this was last derived from",
                      rec["a"]["why"][0][1])

    def test_an_edited_artifact_is_stale_though_its_inputs_have_not_moved(self):
        """The other direction, and the one an input digest cannot see.

        A digest answers "has the world moved under this file". A hand-edit — or
        a generator run directly rather than through here — moves the FILE under
        an unchanged world, and the artifact stops being what its own generator
        produces. Proved by doing it: this is the case that showed the freshness
        guard eight specs lean on could not, at first, fail.
        """
        self.write("in/a.txt", "one")
        self.registry()
        D.regenerate(verbose=False)
        self.write("out/a.json", "typed over it by hand")
        stale = {r["id"]: r for r in D.is_stale(D.check())}
        self.assertEqual(list(stale), ["a"], "and only the one that was edited")
        self.assertIn("edited since it was derived", stale["a"]["why"][0][1])
        D.regenerate(verbose=False)
        self.assertEqual(D.is_stale(D.check()), [], "the regen did not put it back")

    def test_the_record_does_not_churn_the_entries_that_did_not_move(self):
        """One stale artifact re-records all of them; stamping today's clock on
        the ones that did not move would dirty a committed file every pass."""
        self.write("in/a.txt", "one")
        self.registry()
        D.regenerate(verbose=False)
        before = json.load(open(D.STATE_PATH))
        self.write("out/a.json", "typed over it by hand")
        D.regenerate(verbose=False)
        self.assertEqual(json.load(open(D.STATE_PATH)), before)

    def test_a_missing_artifact_is_stale_whatever_the_digest_says(self):
        self.write("in/a.txt", "one")
        self.registry()
        D.regenerate(verbose=False)
        os.remove(os.path.join(self.tmp, "out/b.json"))
        stale = {r["id"]: r for r in D.is_stale(D.check())}
        self.assertEqual(list(stale), ["b"])
        self.assertIn("never been written", stale["b"]["why"][0][1])

    def test_the_loop_settles_when_one_artifact_feeds_another(self):
        """`c` is derived FROM `a`, which is derived from the input — the real
        shape (a snapped reading is an input to the material audit). One pass of
        the registry cannot settle it; the fixed point must."""
        self.write("in/a.txt", "one")
        self.registry()
        rounds = []

        def downstream(_findings=None):
            rounds.append(1)
            data = open(os.path.join(self.tmp, "out/a.json"), "rb").read() + b"!"
            p = os.path.join(self.tmp, "out/c.json")
            return (["out/c.json"] if D._write_if_moved(p, data) else []), None

        D.ACTIONS["downstream"] = downstream
        D.ARTIFACTS.append(
            {"id": "c", "paths": ["out/c.json"], "invalidated_by": "a",
             "inputs": ["out/a.json"], "action": "downstream", "regen": "the action"})
        D.BY_ID = {x["id"]: x for x in D.ARTIFACTS}
        D.regenerate(verbose=False)
        self.assertEqual(D.is_stale(D.check()), [],
                         "the regen left an artifact stale against its own input")
        self.assertEqual(open(os.path.join(self.tmp, "out/c.json"), "rb").read(),
                         open(os.path.join(self.tmp, "out/a.json"), "rb").read() + b"!")


class WriteIfMoved(Sandbox):
    def test_it_writes_once(self):
        p = os.path.join(self.tmp, "x.bin")
        self.assertTrue(D._write_if_moved(p, b"one"))
        self.assertFalse(D._write_if_moved(p, b"one"))
        self.assertTrue(D._write_if_moved(p, b"two"))


class TheStripRule(Sandbox):
    """Re-cut, or record the drift — and which one is a fact about the tree.

    A strip is two things at once: the reference image a packet carries, and a
    record of what was handed to the painter. Before any roll it is only an
    input, and an input cut from a painting the store has replaced is simply
    wrong. After a roll it is evidence, and re-cutting it would make the record
    describe an ask nobody made.
    """

    def entry(self, rolls):
        return {"key": "x/N", "rolls": rolls,
                "edge_seed": {"source": "backdrops/y/E.png", "file": "p/strip.png",
                              "side": "right", "neighbour_edge": "left",
                              "sha256": "a" * 64, "source_sha256": "b" * 64}}

    def test_a_packet_with_no_roll_at_all_has_not_been_rolled(self):
        self.assertIsNone(D._seed_rolled(self.entry([])))

    def test_a_roll_whose_candidate_is_not_on_disk_has_not_landed(self):
        e = self.entry([{"roll": 1, "candidate": "backdrops/source/x-N/r.png"}])
        self.assertIsNone(D._seed_rolled(e), "an emitted roll is not a returned one")

    def test_a_roll_on_disk_is_an_ask_that_cannot_be_un_sent(self):
        self.write("backdrops/source/x-N/r.png", "pixels")
        e = self.entry([{"roll": 1, "candidate": "backdrops/source/x-N/r.png"}])
        self.assertEqual(D._seed_rolled(e), "backdrops/source/x-N/r.png")

    def test_the_witness_accepts_a_recorded_drift_and_only_an_exact_one(self):
        """`stale_from` is not a licence to differ: it must name the digest the
        record still carries AND the one the store now holds."""
        self.write("backdrops/y/E.png", "new pixels")
        self.write("p/strip.png", "strip")
        now = D.sha(os.path.join(self.tmp, "backdrops/y/E.png"))
        e = self.entry([])
        e["edge_seed"]["sha256"] = D.sha(os.path.join(self.tmp, "p/strip.png"))
        doc = {"entries": [e]}
        D.RETRIES_FILE = os.path.join(self.tmp, "retries.json")
        with open(D.RETRIES_FILE, "w") as fh:
            json.dump(doc, fh)
        self.assertEqual(len(D.witness_edge_seeds()), 1, "an unrecorded drift is stale")

        e["edge_seed"]["stale_from"] = {"source_sha256": "b" * 64, "now_sha256": now}
        with open(D.RETRIES_FILE, "w") as fh:
            json.dump(doc, fh)
        self.assertEqual(D.witness_edge_seeds(), [], "a recorded drift is not")

        e["edge_seed"]["stale_from"]["now_sha256"] = "c" * 64
        with open(D.RETRIES_FILE, "w") as fh:
            json.dump(doc, fh)
        self.assertEqual(len(D.witness_edge_seeds()), 1,
                         "a stale_from naming bytes nobody has admits anything")


class TheEscapedFrame(Sandbox):
    """A reading that names a picture outside the tree names no picture."""

    def reading(self, image):
        d = os.path.join(self.tmp, "design", "plan-draft", "measured", D.SNAP_ROUND)
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, "kitchen-W.json"), "w") as fh:
            json.dump({"_what_this_is": "The image it describes is %s. Every "
                                        "search window is the wall's own." % image,
                       "_source_sha256": "a" * 64,
                       "_snap": {"source_candidate": "backdrops/source/kitchen-W/r.png"}}, fh)
        # `derived.py` finds the round beside itself, so HERE moves with ROOT
        self._savedHERE = D.HERE
        D.HERE = os.path.join(self.tmp, "design", "plan-draft", "measured")

    def tearDown(self):
        if hasattr(self, "_savedHERE"):
            D.HERE = self._savedHERE
        Sandbox.tearDown(self)

    def test_a_temp_path_is_stale_and_names_the_production_frame_instead(self):
        self.reading("../../../../tmp/holo-derive-snap-abc/snapped.png")
        pair = D._snap_pairs()[0]
        self.assertTrue(pair["escaped"])
        self.assertIsNone(pair["frame"])
        self.assertEqual(pair["production_frame"],
                         "backdrops/source-snapped/kitchen-W/snapped.png")
        bad = D.witness_snap_readings()
        self.assertEqual(len(bad), 1)
        self.assertIn("outside this tree", bad[0][1])

    def test_a_frame_in_the_tree_is_followed_and_its_digest_is_read(self):
        self.reading("backdrops/source-snapped/kitchen-W/snapped.png")
        self.write("backdrops/source-snapped/kitchen-W/snapped.png", "pixels")
        pair = D._snap_pairs()[0]
        self.assertFalse(pair["escaped"])
        bad = D.witness_snap_readings()
        self.assertEqual(len(bad), 1, "the recorded digest is not this frame's")
        self.assertIn("is not the frame this reading was written for", bad[0][1])


if __name__ == "__main__":
    unittest.main(verbosity=2)
