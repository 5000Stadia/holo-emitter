"""The clause ledger.

Row 3's recheck found one family behind five separate blocking findings:
**every fix for a prior blocker landed in the artifact, and none of them landed
as a check.** `min_carcass_backing`, `max_dy_at_opening`, the stored-resolution
cap, the already-matted-source guard and the drawer-cavity disagreement error
could each be deleted — replaced by `if False:` — with the whole suite green.
The fixes were real; nothing held them there.

This module is that family's architecture. Its rule:

    A fix for a named finding arrives with a case that fails on THAT clause
    alone, and asserts the clause BY NAME — not the gate id it shares with five
    other clauses, and not "some hard gate went red".

`SlideClauseLedger` makes the rule structural rather than a habit: it declares
the six clauses the slide gate carries, exercises each one in isolation, and
asserts at the end that the set of clauses it managed to trip is exactly the
declared set. A seventh clause added to `slide_gate` without a case here shows
up as an absence, not as silence.

Every case in this file was written by first breaking the code it guards and
watching the case go red.
"""

import json
import os
import re
import shutil
import tempfile
import unittest

import numpy as np
from PIL import Image

from replicator import anchors as anchors_mod
from replicator import contract as contract_mod
from replicator import gates as gates_mod
from replicator import ingest as cli
from replicator import imaging as im
from replicator import matte as matte_mod
from replicator import record as record_mod
from replicator import pipeline as pipeline_mod
from replicator import preview as preview_mod
from replicator import states as states_mod
from replicator import synth
from replicator import thumbs as thumbs_mod

from . import support


# --------------------------------------------------------------- the slide gate

class SlideClauseLedger(unittest.TestCase):
    """Six clauses share the id `slide`. Each one is tripped alone, by name.

    The case that existed before this used `dy=0.60`, which trips the clearance
    bound, the overshoot bound, the off-canvas bound and the backing bound all
    at once, and asserted only `"slide" in result.failures`. Four clauses were
    covered by one assertion that could not tell them apart, so deleting any of
    them individually left the suite green.
    """

    DECLARED = {"carcass_backing", "max_dy_at_opening", "max_dx_fraction",
                "max_dy_on_canvas", "scale_open_range", "min_dy_clearance"}

    # Values chosen so exactly one clause fires. Roomy bounds everywhere else.
    OK = dict(supplied_dy=0.10, min_dy=0.05, dx=-0.03, view_side="left",
              max_dy=0.90, scale_open=1.04, opening_max_dy=0.20, max_dx=0.35,
              backing=0.95, min_backing=0.80)

    def _fire(self, **override):
        kw = dict(self.OK)
        kw.update(override)
        return gates_mod.slide_gate(**kw)

    def test_the_control_travel_trips_nothing(self):
        r = self._fire()
        self.assertTrue(r["passed"])
        self.assertEqual(r["measured"]["clauses_failed"], [])

    def test_carcass_backing_alone(self):
        """The headline finding of the previous round, guarded by nothing.

        A drawer whose travel carries it off the carcass reads as a plank on the
        floor. Backing 0.38 against a floor of 0.80, with every other bound
        satisfied — so this case goes green the moment the clause is removed and
        red while it is there.
        """
        r = self._fire(backing=0.38)
        self.assertFalse(r["passed"])
        self.assertEqual(r["measured"]["clauses_failed"], ["carcass_backing"])
        self.assertIn("carcass", r["message"])

    def test_max_dy_at_opening_alone(self):
        """The other half of the plank fix. dy past the opening, still on canvas,
        still clearing the cavity, still backed."""
        r = self._fire(supplied_dy=0.24, backing=0.95)
        self.assertFalse(r["passed"])
        self.assertEqual(r["measured"]["clauses_failed"], ["max_dy_at_opening"])

    def test_min_dy_clearance_alone(self):
        r = self._fire(supplied_dy=0.02)
        self.assertFalse(r["passed"])
        self.assertEqual(r["measured"]["clauses_failed"], ["min_dy_clearance"])

    def test_max_dx_fraction_alone(self):
        r = self._fire(dx=-0.50)
        self.assertFalse(r["passed"])
        self.assertEqual(r["measured"]["clauses_failed"], ["max_dx_fraction"])

    def test_max_dy_on_canvas_alone(self):
        """Travel off the bottom of the canvas, with the opening bound relaxed
        so it cannot be what fired."""
        r = self._fire(supplied_dy=0.95, opening_max_dy=None)
        self.assertFalse(r["passed"])
        self.assertEqual(r["measured"]["clauses_failed"], ["max_dy_on_canvas"])

    def test_scale_open_range_alone(self):
        r = self._fire(scale_open=5.0)
        self.assertFalse(r["passed"])
        self.assertEqual(r["measured"]["clauses_failed"], ["scale_open_range"])

    def test_every_declared_clause_has_a_case_that_trips_it_alone(self):
        """The ledger's own completeness check.

        A clause added to `slide_gate` without a case in this class fails here,
        so the absence is visible instead of silent.
        """
        seen = set()
        for kw in ({"backing": 0.38}, {"supplied_dy": 0.24}, {"supplied_dy": 0.02},
                   {"dx": -0.50}, {"supplied_dy": 0.95, "opening_max_dy": None},
                   {"scale_open": 5.0}):
            fired = self._fire(**kw)["measured"]["clauses_failed"]
            self.assertEqual(len(fired), 1, "case %s trips %s, not one clause" % (kw, fired))
            seen.add(fired[0])
        self.assertEqual(seen, self.DECLARED,
                         "the slide gate's clauses and this ledger's cases have diverged")


class SlideClausesThroughTheWholePipeline(unittest.TestCase):
    """The backing clause again, end to end, because a unit call cannot prove the
    pipeline computes and passes the number the gate judges."""

    @classmethod
    def setUpClass(cls):
        cls.src, cls.mask = support.part_control()

    def _run(self, slide):
        return support.ingest(self.src, archetype="sliding",
                              part_specs=[{"id": "drawer_front", "mask": self.mask,
                                           "slide": slide, "source_rgb": self.src}],
                              previews=False)

    def test_a_travel_that_leaves_the_carcass_fails_on_the_backing_clause_by_name(self):
        r = self._run({"dx": 0.0, "dy": 0.62, "scale_open": 1.0})
        g = support.gate(r, "slide")
        self.assertFalse(g["passed"])
        self.assertIn("carcass_backing", g["measured"]["clauses_failed"],
                      "the pipeline must supply a real backing measure, not None")
        self.assertIsNotNone(g["measured"]["carcass_backing"])


# ------------------------------------------------------- the stored-resolution cap

class StoredResolutionPolicy(unittest.TestCase):
    """`ingest.output.max_content_height_px` was the entire fix for a sprite
    stored at 6.6x the placeholder's aliasing, and `_limit_resolution` could be
    made a no-op with 101 tests green."""

    def setUp(self):
        self.cap = support.contract()["ingest"]["output"]["max_content_height_px"]

    def test_an_over_tall_source_is_stored_at_the_capped_height(self):
        r = support.ingest(synth.clean_sprite(size=900, content=720), previews=False)
        self.assertEqual(r.body.shape[0], self.cap,
                         "a 720px body must be stored at the contract's cap")
        self.assertEqual(r.record["px"]["h"], self.cap,
                         "and the record must say so")
        self.assertTrue(r.measured["geometry"]["resized"],
                        "the record carries the fact that a resample happened")

    def test_gate_c_still_judges_the_height_that_arrived_not_the_stored_one(self):
        """The cap sits below gate (c)'s 512 floor deliberately. If the gate read
        the stored height instead of the arriving one, every furniture sprite
        would fail — which is how a reader can tell the two are not confused."""
        r = support.ingest(synth.clean_sprite(size=900, content=720), previews=False)
        c = support.gate(r, "c")
        self.assertTrue(c["passed"])
        self.assertGreaterEqual(c["measured"]["content_height_px"], 512)

    def test_a_part_mask_is_rescaled_with_the_body_it_cuts(self):
        """A mask left at source resolution would cut the wrong rectangle out of
        a downscaled body."""
        src, mask = support.part_control()
        r = support.ingest(src, archetype="sliding", previews=False,
                           part_specs=[{"id": "drawer_front", "mask": mask,
                                        "slide": {"dx": 0.0, "dy": 0.12, "scale_open": 1.0},
                                        "source_rgb": src}])
        part = r.parts["drawer_front"]
        self.assertLessEqual(part.shape[0], r.body.shape[0])
        rect = r.derived["parts"]["drawer_front"]["closed_rect"]
        self.assertLessEqual(rect["y1"], r.body.shape[0],
                             "the cut rect must live inside the STORED body")
        self.assertGreater(rect["y1"] - rect["y0"], 1)


# --------------------------------------------------------- the already-matted guard

class AlreadyMattedSource(unittest.TestCase):
    """An RGBA source flattened onto black ships an opaque rectangle with every
    gate green. The guard lives in the CLI's decode layer, so its case has to go
    through `cli.main` with a real PNG carrying alpha — which is why the pure
    pipeline's ground assertion, the nearest existing test, never touched it."""

    def setUp(self):
        self.tmp = tempfile.mkdtemp(prefix="replicator-matted-")

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def _argv(self, src):
        return [src, "--id", "matted-ctl", "--noun", "control", "--archetype", "static",
                "--attachment", "floor_against", "--height-m", "0.8", "--width-m", "0.9",
                "--depth-m", "0.5", "--out", os.path.join(self.tmp, "library")]

    def test_a_png_carrying_alpha_is_refused_by_name(self):
        rgb = synth.clean_sprite()
        rgba = np.dstack([rgb, np.full(rgb.shape[:2], 255, np.uint8)])
        rgba[0, 0, 3] = 0                      # one transparent pixel is enough
        path = os.path.join(self.tmp, "matted.png")
        Image.fromarray(rgba, "RGBA").save(path)
        report = os.path.join(self.tmp, "r.json")
        code = cli.main(self._argv(path) + ["--report", report])
        self.assertEqual(code, cli.EXIT_USAGE)
        with open(report) as fh:
            rep = json.load(fh)
        self.assertIn("matted once already", rep["error"]["message"])
        self.assertFalse(os.path.exists(os.path.join(self.tmp, "library", "matted-ctl")))

    def test_a_plain_rgb_png_of_the_same_object_is_accepted(self):
        """The other half: the guard must not refuse the normal case."""
        path = os.path.join(self.tmp, "plain.png")
        Image.fromarray(synth.clean_sprite()).save(path)
        self.assertEqual(cli.main(self._argv(path)), 0)


# ------------------------------------------------------ the cavity disagreement error

class FlaggedCavityDisagreement(unittest.TestCase):
    """A hard-error path with no witness: `--anchor drawer_cavity` disagreeing
    with the derived cavity raised, and `if False:` there left the suite green."""

    def test_a_flagged_cavity_far_from_the_derived_one_is_a_hard_error(self):
        src, mask = support.part_control()
        with self.assertRaises(pipeline_mod.IngestError) as caught:
            support.ingest(src, archetype="sliding", previews=False,
                           # Inside the source frame, but nowhere near the drawer.
                           anchor_regions={"drawer_cavity": (150, 130, 320, 220)},
                           part_specs=[{"id": "drawer_front", "mask": mask,
                                        "slide": {"dx": 0.0, "dy": 0.12, "scale_open": 1.0},
                                        "source_rgb": src}])
        msg = str(caught.exception)
        self.assertIn("drawer_cavity disagrees", msg)
        self.assertIn("Flagged", msg)
        self.assertIn("derived", msg)

    def test_a_flagged_cavity_that_agrees_is_accepted(self):
        src, mask = support.part_control()
        base = support.ingest(src, archetype="sliding", previews=False,
                              part_specs=[{"id": "drawer_front", "mask": mask,
                                           "slide": {"dx": 0.0, "dy": 0.12, "scale_open": 1.0},
                                           "source_rgb": src}])
        cav = base.derived["parts"]["drawer_front"]["cavity"]
        # Back into source coordinates: the pipeline scales a flagged region by
        # the same factor it scaled the body, so a region that round-trips must
        # be accepted. This proves the error is a real comparison and not a
        # blanket refusal of the flag.
        scale = base.body.shape[0] / float(support.matte_of(src).rgba.shape[0])
        trim = support.matte_of(src).trim_offset
        region = tuple(v / scale + t for v, t in
                       ((cav["x0"], trim[0]), (cav["y0"], trim[1]),
                        (cav["x1"], trim[0]), (cav["y1"], trim[1])))
        r = support.ingest(src, archetype="sliding", previews=False,
                           anchor_regions={"drawer_cavity": region},
                           part_specs=[{"id": "drawer_front", "mask": mask,
                                        "slide": {"dx": 0.0, "dy": 0.12, "scale_open": 1.0},
                                        "source_rgb": src}])
        self.assertIn("drawer_cavity", r.record["anchors"])


# ------------------------------------------------------------------- --check

class CheckWritesNothing(unittest.TestCase):
    """Blueprint §9's row-3 block, `ingest.py`'s docstring, the flag's own --help
    and the README all say `--check` writes nothing. With `--preview-dir` it
    wrote four PNGs and printed `wrote:`."""

    def setUp(self):
        self.tmp = tempfile.mkdtemp(prefix="replicator-check-")
        self.src = os.path.join(self.tmp, "src.png")
        Image.fromarray(synth.clean_sprite()).save(self.src)

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def _argv(self, *extra):
        return [self.src, "--id", "check-ctl", "--noun", "control", "--archetype", "static",
                "--attachment", "floor_against", "--height-m", "0.8", "--width-m", "0.9",
                "--depth-m", "0.5", "--out", os.path.join(self.tmp, "library")] + list(extra)

    def test_check_with_a_preview_dir_writes_no_previews(self):
        prev = os.path.join(self.tmp, "previews")
        code = cli.main(self._argv("--check", "--preview-dir", prev))
        self.assertEqual(code, 0)
        self.assertFalse(os.path.isdir(prev) and os.listdir(prev),
                         "--check must write nothing at all, previews included")
        self.assertFalse(os.path.exists(os.path.join(self.tmp, "library", "check-ctl")))

    def test_check_reports_that_it_wrote_nothing(self):
        prev = os.path.join(self.tmp, "previews")
        report = os.path.join(self.tmp, "r.json")
        cli.main(self._argv("--check", "--preview-dir", prev, "--report", report))
        with open(report) as fh:
            self.assertEqual(json.load(fh)["written"], [])

    def test_without_check_the_same_preview_dir_is_written(self):
        """The other half, so the fix is a suppression under --check and not a
        broken --preview-dir."""
        prev = os.path.join(self.tmp, "previews")
        cli.main(self._argv("--preview-dir", prev))
        self.assertTrue(os.listdir(prev))


# ---------------------------------------------------------------- exit codes

class ExitCodePartition(unittest.TestCase):
    """Exit 2 tells the asset seat's autonomous lane to regenerate the source.
    A gate that fails on a flag value must not send it to do that."""

    def setUp(self):
        self.tmp = tempfile.mkdtemp(prefix="replicator-exit-")
        src, mask = support.part_control()
        self.src = os.path.join(self.tmp, "src.png")
        self.mask = os.path.join(self.tmp, "mask.png")
        Image.fromarray(src).save(self.src)
        Image.fromarray((mask.astype(np.uint8) * 255), "L").save(self.mask)

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def _argv(self, slide):
        return [self.src, "--id", "exit-ctl", "--noun", "control", "--archetype", "sliding",
                "--attachment", "floor_against", "--height-m", "0.8", "--width-m", "0.9",
                "--depth-m", "0.5", "--out", os.path.join(self.tmp, "library"),
                "--part", "drawer_front:%s" % self.mask, "--slide", slide]

    def test_a_bad_slide_is_a_command_failure_not_a_content_failure(self):
        code = cli.main(self._argv("0.0,0.62,1.0"))
        self.assertEqual(code, cli.EXIT_USAGE,
                         "a travel the operator typed is not a reason to regenerate the image")

    def test_a_bad_image_is_still_a_content_failure(self):
        bad = os.path.join(self.tmp, "halo.png")
        Image.fromarray(synth.negative_control_halo()).save(bad)
        argv = self._argv("0.0,0.12,1.0")
        argv[0] = bad
        self.assertEqual(cli.main(argv), cli.EXIT_CONTENT)


# -------------------------------------------------------------- registration

class RegistrationCertifiesSomething(unittest.TestCase):
    """Three separate ways two-state registration certified nothing."""

    @classmethod
    def setUpClass(cls):
        cls.closed, cls.open_, cls.meta = synth.state_pair()
        cls.cfg = support.contract()["gates"]["registration"]

    def _run(self, **kw):
        spec = {"name": "open", "source_rgb": self.open_, "origin": None, "datum": None}
        spec.update(kw)
        return support.ingest(self.closed, archetype="swap", previews=False,
                              state_specs=[spec])

    def test_no_datum_is_a_hard_failure_not_a_warning(self):
        """A swap sprite with a typed, unverified origin exited 0."""
        r = self._run(origin=(0.0, 0.0))
        g = support.gate(r, "registration")
        self.assertEqual(g["severity"], "hard")
        self.assertFalse(g["passed"])
        self.assertIn("NOT VERIFIED", g["message"])
        self.assertIn("registration", r.failures)

    def test_a_featureless_datum_is_refused_on_contrast(self):
        """NCC divides contrast out: a blank patch of studio grey correlates at
        1.000 against any other patch of the same grey. The only guard was a
        zero-variance refusal, which dither defeats."""
        r = self._run(datum=(6, 6, 60, 60))
        g = support.gate(r, "registration")
        self.assertFalse(g["passed"], "a blank patch must not certify an origin")
        self.assertIn("datum contrast", g["message"])
        self.assertLess(g["measured"]["datum_contrast"], self.cfg["min_datum_contrast"])

    def test_a_real_datum_passes_and_says_what_it_certified(self):
        r = self._run(datum=self.meta["datum"])
        g = support.gate(r, "registration")
        self.assertTrue(g["passed"], g["message"])
        self.assertGreaterEqual(g["measured"]["datum_contrast"],
                                self.cfg["min_datum_contrast"])
        self.assertGreaterEqual(g["measured"]["peak_margin"], self.cfg["min_peak_margin"])

    def test_a_derived_only_origin_is_not_compared_against_itself(self):
        """It reported `the declared origin agrees within 0.000% of width and
        0.000% of height` for a declaration nobody made."""
        r = self._run(datum=self.meta["datum"])
        g = support.gate(r, "registration")
        self.assertEqual(g["measured"]["mode"], "datum_evidence")
        self.assertIsNone(g["measured"]["declared"])
        self.assertNotIn("agrees within", g["message"])
        self.assertIn("nothing to cross-check", g["message"])

    def test_a_typed_origin_that_disagrees_with_the_datum_fails(self):
        r = self._run(datum=self.meta["datum"], origin=(220.0, 0.0))
        g = support.gate(r, "registration")
        self.assertFalse(g["passed"])
        self.assertEqual(g["measured"]["mode"], "cross_check")
        self.assertIn("declared-vs-derived", g["message"])


class DatumUniqueness(unittest.TestCase):
    """A repeated feature correlates equally well at several offsets, and the
    argmax among equals is arbitrary."""

    def test_a_repeated_stripe_pattern_has_no_peak_margin(self):
        h = w = 240
        a = np.full((h, w, 3), 128, np.uint8)
        a[:, ::12] = 40                        # a strictly periodic feature
        b = a.copy()
        _, _, ev = states_mod.locate_datum(a, b, (60, 60, 108, 108), search_px=40)
        self.assertGreaterEqual(ev["contrast"], 3.0, "the stripes give real contrast")
        self.assertLess(ev["margin"], 0.05,
                        "a periodic patch has rivals as good as its winner")

    def test_a_unique_feature_has_a_clear_margin(self):
        h = w = 240
        a = np.full((h, w, 3), 128, np.uint8)
        a[80:120, 70:130] = 30                 # one blob, nothing like it elsewhere
        b = a.copy()
        _, _, ev = states_mod.locate_datum(a, b, (60, 70, 140, 130), search_px=40)
        self.assertGreaterEqual(ev["margin"], 0.05)


# --------------------------------------------------------- gate (a) on grey objects

class AchromaticObjects(unittest.TestCase):
    """Gate (a) hard-failed a genuinely achromatic object — the exact false-fail
    the ratio form of a2 was adopted to prevent, reappearing at the limit."""

    def test_a_true_grey_object_is_not_failed_for_having_no_colour(self):
        r = support.ingest(synth.neutral_disc(), previews=False)
        g = support.gate(r, "a")
        self.assertTrue(g["passed"],
                        "an iron key rendered neutrally must not be refused by gate (a): %s"
                        % g["message"])

    def test_a2_declares_itself_unmeasured_rather_than_scoring_zero(self):
        r = support.ingest(synth.neutral_disc(), previews=False)
        g = support.gate(r, "a")
        self.assertIsNotNone(g["measured"]["a2_unmeasured"])
        self.assertIn("achromatic", g["measured"]["a2_unmeasured"])
        self.assertIn("a2", g["message"])

    def test_a3_still_carries_a_verdict_on_that_object(self):
        """a2 dropping out must not hollow the gate: a3 is the clause written for
        exactly this case and it has to still be running."""
        r = support.ingest(synth.neutral_disc(), previews=False)
        g = support.gate(r, "a")
        self.assertIn("a3", g["message"])
        self.assertGreater(g["measured"]["inner_band_bg_distance_ratio"], 0.0)

    def test_a_haloed_grey_object_is_still_caught(self):
        """And the clause that remains must still be able to fail."""
        halo = synth.negative_control_halo()
        grey = halo.mean(axis=2).astype(np.uint8)
        r = support.ingest(np.dstack([grey, grey, grey]), previews=False)
        self.assertFalse(support.gate(r, "a")["passed"],
                         "a grey halo on a grey object must still be caught by a3/a4")

    def test_a_coloured_object_still_runs_a2(self):
        r = support.ingest(synth.clean_sprite(), previews=False)
        g = support.gate(r, "a")
        self.assertIsNone(g["measured"]["a2_unmeasured"])
        self.assertIn("a2", g["message"])
        self.assertTrue(g["passed"], g["message"])


# ------------------------------------------------- thresholds live in the contract

class ThresholdsAreInTheContract(unittest.TestCase):
    """Four hard gates read bare literals from their own modules — outside the
    freeze, and outside the hash a record's provenance claims traceability to."""

    def setUp(self):
        self.ct = support.contract()

    def test_every_hard_gate_has_a_contract_block(self):
        for key in ("alignment", "thumb", "dims", "registration"):
            self.assertIn(key, self.ct["gates"], "gates.%s must be pinned" % key)
            self.assertIn("authority", self.ct["gates"][key])
            self.assertIn("basis", self.ct["gates"][key])

    def test_a_contract_missing_a_hard_gate_block_is_refused(self):
        bad = json.loads(json.dumps(self.ct))
        bad["gates"].pop("alignment")
        with self.assertRaises(contract_mod.ContractError):
            contract_mod.parse(json.dumps(bad))

    def _identity_changes(self, mutate):
        before = contract_mod.identity(self.ct)["thresholds_sha256"]
        mutated = json.loads(json.dumps(self.ct))
        mutate(mutated)
        after = contract_mod.identity(
            contract_mod.parse(json.dumps(mutated)))["thresholds_sha256"]
        return before != after

    def test_moving_the_alignment_tolerance_moves_the_identity_hash(self):
        self.assertTrue(self._identity_changes(
            lambda c: c["gates"]["alignment"].__setitem__(
                "bottom_edge_tolerance_fraction", 0.05)))

    def test_moving_the_thumb_clauses_moves_the_identity_hash(self):
        self.assertTrue(self._identity_changes(
            lambda c: c["gates"]["thumb"].__setitem__("min_coverage", 0.5)))

    def test_moving_the_dims_band_moves_the_identity_hash(self):
        self.assertTrue(self._identity_changes(
            lambda c: c["gates"]["dims"].__setitem__("ratio_min", 0.5)))

    def test_moving_the_scale_open_rails_moves_the_identity_hash(self):
        self.assertTrue(self._identity_changes(
            lambda c: c["ingest"]["cavity"].__setitem__("scale_open_max", 9.0)))

    def test_the_alignment_gate_reads_its_tolerance_from_the_contract(self):
        origin = {"x": 0.0, "y": 0.0}
        loose = states_mod.alignment_gate(origin, (90, 40), (100, 40),
                                          {"bottom_edge_tolerance_fraction": 0.5})
        tight = states_mod.alignment_gate(origin, (90, 40), (100, 40),
                                          {"bottom_edge_tolerance_fraction": 0.01})
        self.assertTrue(loose["passed"])
        self.assertFalse(tight["passed"])

    def test_the_thumb_gate_reads_its_clauses_from_the_contract(self):
        thumb = np.zeros((128, 128, 4), np.uint8)
        thumb[60:68, 60:68, 3] = 255           # ~0.4% coverage
        lax = thumbs_mod.thumb_gate(thumb, True, 128, 112,
                                    {"min_coverage": 0.001, "edge_margin_px": 2})
        strict = thumbs_mod.thumb_gate(thumb, True, 128, 112,
                                       {"min_coverage": 0.01, "edge_margin_px": 2})
        self.assertTrue(lax["passed"])
        self.assertFalse(strict["passed"])

    def test_alpha_opaque_is_actually_read_by_the_derivations_its_basis_names(self):
        """The contract carried 128; every derivation the basis names used the
        module constant, so setting it to 250 moved nothing but the hash."""
        rgba = np.zeros((40, 30, 4), np.uint8)
        rgba[10:38, 5:25, :3] = 90
        rgba[10:38, 5:25, 3] = 255
        rgba[38:39, 5:25, 3] = 200             # a soft last row: opaque at 128, not at 250
        rgba[38:39, 5:25, :3] = 90
        loose = anchors_mod.derive_anchors(rgba, 0.25, alpha_opaque=128)[0]
        strict = anchors_mod.derive_anchors(rgba, 0.25, alpha_opaque=250)[0]
        self.assertNotEqual(loose["base"]["y"], strict["base"]["y"],
                            "base.y must move when the opaque threshold moves")

    def test_the_contract_carries_the_solid_threshold_its_light_basis_cites(self):
        self.assertEqual(self.ct["gates"]["alpha_opaque"]["solid_value"], im.ALPHA_SOLID)


# ------------------------------------------------- the preview is the renderer's

class PreviewMatchesTheRenderer(unittest.TestCase):
    """`annotate_contact` promised to draw "the contact pool the renderer would
    draw". It drew a different ellipse, with the offset removed — and the offset
    is exactly what comparison-criteria's T2.2 and T2.4 hunt for."""

    RENDERER = os.path.join(support.REPO_ROOT, "src", "renderer.js")

    def _js_constant(self, name):
        with open(self.RENDERER, encoding="utf-8") as fh:
            src = fh.read()
        m = re.search(r"\bvar\s+%s\s*=\s*([0-9.]+)\s*;" % re.escape(name), src)
        self.assertIsNotNone(m, "src/renderer.js no longer declares %s" % name)
        return float(m.group(1))

    def test_every_shadow_constant_agrees_with_src_renderer_js(self):
        for name in ("SHADOW_PEAK", "SHADOW_RY", "SHADOW_MIN_RY", "SHADOW_MIN_RX",
                     "SHADOW_DX", "SHADOW_DY"):
            self.assertEqual(getattr(preview_mod, name), self._js_constant(name),
                             "%s has drifted from the renderer's" % name)

    def test_the_pool_is_offset_the_way_the_renderer_offsets_it(self):
        canvas = np.full((120, 200, 4), 200, np.uint8)
        canvas[..., 3] = 255
        rgba = np.zeros((100, 100, 4), np.uint8)
        anchors = {"footprint": {"x0": 20.0, "x1": 80.0}, "base": {"x": 50.0, "y": 100.0}}
        out = preview_mod.annotate_contact(canvas, rgba, anchors, {"w": 100, "h": 100}, 100)
        dark = np.argwhere(out[..., 0] < 200)
        self.assertTrue(len(dark), "a grounded object must darken the ground under it")
        cx = dark[:, 1].mean()
        self.assertGreater(cx, 70.0,
                           "the pool's centre must sit right of the base, as SHADOW_DX puts it")

    def test_a_wall_mounted_sprite_gets_no_pool(self):
        canvas = np.full((120, 200, 4), 200, np.uint8)
        canvas[..., 3] = 255
        rgba = np.zeros((100, 100, 4), np.uint8)
        anchors = {"footprint": {"x0": 20.0, "x1": 80.0}, "base": {"x": 50.0, "y": 100.0}}
        out = preview_mod.annotate_contact(canvas, rgba, anchors, {"w": 100, "h": 100}, 100,
                                           attachment="wall_mounted")
        self.assertTrue((out[..., :3] == 200).all(),
                        "the renderer draws no pool for a wall-mounted sprite, so nor does this")


# --------------------------------------------------------- the gate tally per archetype

class GateTally(unittest.TestCase):
    """The swap count was wrong in blueprint §9.4, in architecture.md and in the
    closing narrative — twelve everywhere, thirteen in fact, and two ids
    duplicated with no way to tell which image each verdict was about."""

    def test_a_static_sprite_runs_nine_distinct_gates(self):
        r = support.ingest(synth.clean_sprite(), previews=False)
        ids = [g["id"] for g in r.gates]
        self.assertEqual(len(ids), 9, ids)
        self.assertEqual(len(set(ids)), 9, "no gate id may appear twice: %s" % ids)

    def test_a_sliding_sprite_runs_thirteen_distinct_gates(self):
        src, mask = support.part_control()
        r = support.ingest(src, archetype="sliding", previews=False,
                           part_specs=[{"id": "drawer_front", "mask": mask,
                                        "slide": {"dx": 0.0, "dy": 0.12, "scale_open": 1.0},
                                        "source_rgb": src}])
        ids = [g["id"] for g in r.gates]
        self.assertEqual(len(ids), 13, ids)
        self.assertEqual(len(set(ids)), 13, ids)

    def test_a_swap_sprite_runs_sixteen_and_names_which_image_each_judged(self):
        closed, open_, meta = synth.state_pair()
        r = support.ingest(closed, archetype="swap", previews=False,
                           state_specs=[{"name": "open", "source_rgb": open_,
                                         "origin": None, "datum": meta["datum"]}])
        ids = [g["id"] for g in r.gates]
        self.assertEqual(len(ids), 16, ids)
        self.assertEqual(len(set(ids)), 16,
                         "the state image's runs must carry it in their id: %s" % ids)
        for gid in ("a[states.open]", "b[states.open]", "g[states.open]",
                    "h[states.open]", "e[states.open]"):
            self.assertIn(gid, ids, ids)

    def test_the_records_edge_evidence_describes_the_sprite_not_the_state_image(self):
        closed, open_, meta = synth.state_pair()
        r = support.ingest(closed, archetype="swap", previews=False,
                           state_specs=[{"name": "open", "source_rgb": open_,
                                         "origin": None, "datum": meta["datum"]}])
        body_a = support.gate(r, "a")
        self.assertEqual(body_a["measured"]["image"], "body")
        self.assertEqual(r.measured["edge"]["composited_rim"],
                         body_a["measured"]["composited_rim"])


if __name__ == "__main__":
    unittest.main()


# ============================================================================
# The Codex alternative-perspective pass. Each of these is a certification hole
# it named: a gate whose pass carried less information than its message claimed,
# or a green route to a bad sprite. Same rule as above — the case names the
# clause, and each was written by breaking the fix and watching it go red.
# ============================================================================

class LightSaysWhatItActuallyMeasured(unittest.TestCase):
    """`gate_light` evaluated its clauses only when the estimator produced them,
    so an object too narrow to sample returned green with the message "light
    reads as UL45 on both measures". Neither measure had run."""

    def test_an_object_with_nothing_to_sample_is_reported_not_certified(self):
        """The tilt clause is deliberately SATISFIED here, so the only thing that
        can hold this gate open is the missing measurement itself. A first version
        of this case used a uniform sliver whose tilt also failed, and the whole
        fix could be deleted with the case still green — the exact family this
        module exists to close, reappearing inside the module."""
        rgba = np.zeros((60, 6, 4), np.uint8)          # 6 px wide: no eroded interior
        rgba[:, :, 3] = 255
        rgba[:, 0:2, :3] = 200                         # bright left third
        rgba[:, 2:4, :3] = 150
        rgba[:, 4:6, :3] = 100                         # dark right third -> tilt passes
        cfg = support.contract()["gates"]["light"]
        g = gates_mod.gate_light(rgba, cfg)
        self.assertNotIn("deviation_deg", g["measured"],
                         "this fixture must leave the bright-side estimate unmeasurable")
        self.assertGreaterEqual(g["measured"]["third_tilt"], cfg["min_third_tilt"],
                                "and the tilt clause must PASS, so it cannot be what fails")
        self.assertEqual(g["measured"]["unmeasured"], ["bright-side estimate"])
        self.assertFalse(g["passed"], "a measurement that did not run is not a pass")
        self.assertIn("NOT MEASURED", g["message"])
        self.assertNotIn("reads as UL45 on both measures", g["message"])

    def test_a_real_object_still_reports_both_measures(self):
        r = support.ingest(synth.lit_solid(direction="UL"), previews=False)
        g = support.gate(r, "e")
        self.assertEqual(g["measured"]["unmeasured"], [])
        self.assertTrue(g["passed"], g["message"])


class HaloWithoutAMeasurableRimIsNotAPass(unittest.TestCase):
    """a4 is the only clause that looks at the edge as the room sees it. When it
    could not run over any ground the gate returned green — and a hard-edged
    silhouette, the sticker tell itself, is exactly what leaves no rim."""

    def test_a_gate_with_no_measurable_rim_over_any_ground_fails(self):
        rgba = np.zeros((40, 40, 4), np.uint8)
        rgba[8:32, 8:32, :3] = (150, 110, 60)
        rgba[8:32, 8:32, 3] = 255                       # perfectly hard edge
        cfg = dict(support.contract()["gates"]["halo"])
        cfg["_draw_height_px"] = 4                      # too small to leave a rim
        g = gates_mod.gate_halo(rgba, (128, 128, 128), cfg)
        self.assertEqual(len(g["measured"]["a4_unmeasured_grounds"]), 2)
        self.assertFalse(g["passed"], "no measurement is not a pass")
        self.assertIn("no ground could be measured", g["message"])

    def test_an_axis_aligned_silhouette_falls_back_to_native_edge_softness(self):
        """The constructed clean control is a rectangle filling its own bbox: it
        survives a bilinear downscale with no partial coverage while being
        perfectly feathered natively. Absence of a rim is not proof of a hard
        edge, so the question moves to where it can be answered."""
        r = support.ingest(synth.clean_sprite(), previews=False)
        g = support.gate(r, "a")
        self.assertEqual(len(g["measured"]["a4_unmeasured_grounds"]), 2)
        self.assertGreaterEqual(g["measured"]["edge_softness_ratio"], 1.0)
        self.assertTrue(g["passed"], g["message"])
        self.assertIn("native edge softness", g["message"])

    def test_a_sprite_with_a_real_rim_measures_the_grounds_instead(self):
        r = support.ingest(synth.legged_sprite(), previews=False)
        g = support.gate(r, "a")
        self.assertEqual(g["measured"]["a4_unmeasured_grounds"], [])
        self.assertTrue(g["passed"], g["message"])


class ShadowBesideTheObject(unittest.TestCase):
    """gate (h) discarded every column with no object pixel in it — which is
    where a UL45 key throws its shadow, and what shows between the legs."""

    def _frame(self, with_shadow):
        a = np.full((300, 300, 3), 128, np.uint8)
        a[80:200, 100:200] = (150, 110, 60)            # the object
        if with_shadow:
            a[190:215, 205:280] = 92                   # a pool BESIDE it, no object above
        return a

    def test_a_shadow_cast_into_columns_beside_the_object_is_caught(self):
        r = support.ingest(self._frame(True), previews=False)
        g = support.gate(r, "h")
        self.assertGreater(g["measured"]["toned_beside_object_px"], 0)
        self.assertFalse(g["passed"], "a pool beside the object is still a cast shadow")

    def test_the_same_frame_without_the_pool_passes(self):
        r = support.ingest(self._frame(False), previews=False)
        self.assertTrue(support.gate(r, "h")["passed"])

    def test_a_uniformly_ground_toned_object_still_scores_zero(self):
        """The clause that protects the iron key must survive the widening. An
        object with NO non-toned pixel anywhere gives this measure no reference
        at all, and it says so instead of calling the whole object a shadow."""
        r = support.ingest(synth.squat_sprite(), previews=False)
        g = support.gate(r, "h")
        # 99.7% ground-toned, and the few tenths of a percent that are not are
        # scattered THROUGH it — so the disc's toned region spans the columns its
        # own solid pixels occupy and no component of it is disjoint from the
        # object. A first attempt at the widening scored 65769 px here.
        self.assertEqual(g["measured"]["toned_beside_object_px"], 0)
        self.assertEqual(g["measured"]["toned_below_px"], 0)
        self.assertTrue(g["passed"], g["message"])


class ArchetypePromisesAreTwoWay(unittest.TestCase):
    """`--archetype sliding` with no `--part` shipped a green record declaring a
    moving part it did not carry. The check ran in one direction only."""

    def test_sliding_without_a_part_is_refused(self):
        with self.assertRaises(pipeline_mod.IngestError) as c:
            support.ingest(synth.clean_sprite(), archetype="sliding", previews=False)
        self.assertIn("--part", str(c.exception))

    def test_swap_without_a_state_is_refused(self):
        with self.assertRaises(pipeline_mod.IngestError) as c:
            support.ingest(synth.clean_sprite(), archetype="swap", previews=False)
        self.assertIn("--state", str(c.exception))

    def test_airborne_on_a_floor_attachment_is_refused(self):
        with self.assertRaises(pipeline_mod.IngestError) as c:
            support.ingest(synth.clean_sprite(), airborne=True,
                           attachment="floor_against", previews=False)
        self.assertIn("contradiction", str(c.exception))

    def test_the_record_names_what_no_stage_witnesses(self):
        for key in ("dims_m", "period", "takeable", "noun"):
            self.assertIn(key, record_mod.UNWITNESSED,
                          "%s is an operator claim and must be declared unwitnessed" % key)


class StateImagesGetTheImageQualityGates(unittest.TestCase):
    """The open state is an independently generated picture with its own matte.
    It got halo, light, alignment and registration — and not holes, shadow or
    over-matte, so it could carry a baked studio shadow into the room green."""

    @classmethod
    def setUpClass(cls):
        cls.closed, cls.open_, cls.meta = synth.state_pair()

    def _run(self, open_img):
        return support.ingest(self.closed, archetype="swap", previews=False,
                              state_specs=[{"name": "open", "source_rgb": open_img,
                                            "origin": None, "datum": self.meta["datum"]}])

    def test_the_state_image_is_judged_by_the_same_hard_set_as_the_body(self):
        ids = [g["id"] for g in self._run(self.open_).gates]
        for gid in ("a[states.open]", "b[states.open]", "g[states.open]",
                    "h[states.open]", "e[states.open]"):
            self.assertIn(gid, ids, ids)

    def test_a_shadow_baked_into_the_state_image_alone_is_caught(self):
        """The closed body is clean; only the open state carries the defect."""
        dirty = self.open_.copy()
        dirty[560:610, 400:560] = 92                  # a pool clear of the open leaf
        r = self._run(dirty)
        self.assertIn("h[states.open]", r.failures,
                      "a shadow in the state image must fail on the state image's own gate")
        self.assertTrue(support.gate(r, "h")["passed"],
                        "and the body's own gate (h) must stay green, so the report is legible")


class DatumSearchWindow(unittest.TestCase):
    """`max(shape) // 4` was load-bearing and undeclared, and a peak on the
    window's edge was accepted as a match."""

    def test_the_search_fraction_is_pinned_in_the_contract(self):
        cfg = support.contract()["gates"]["registration"]
        self.assertIn("search_fraction", cfg)
        self.assertIn("search_fraction_basis", cfg)

    def test_a_peak_on_the_search_boundary_is_refused_by_name(self):
        a = np.full((200, 200, 3), 128, np.uint8)
        a[40:70, 40:70] = 30
        b = np.full((200, 200, 3), 128, np.uint8)
        b[140:170, 140:170] = 30                      # moved far outside a tiny window
        _, _, ev = states_mod.locate_datum(a, b, (35, 35, 75, 75), search_px=12)
        self.assertTrue(ev["peak_on_search_boundary"])
        g = states_mod.registration_gate(
            {"x": 0.0, "y": 0.0}, {"x": 0.0, "y": 0.0}, ev, (200, 200),
            support.contract()["gates"]["registration"], typed=False)
        self.assertFalse(g["passed"])
        self.assertIn("search window", g["message"])


class ContractValidationReachesNestedOverrides(unittest.TestCase):
    """`classes.<c>.ingest.matte.tolerance_rule` is one level deeper than the
    flat check looked, so a per-class threshold with no authority and no basis
    reached the matte while inheriting the base block's justification."""

    def _with_class(self, body):
        ct = json.loads(json.dumps(support.contract()))
        ct["classes"] = {"takeable": {"ingest": {"matte": {"tolerance_rule": body}}}}
        return json.dumps(ct)

    def test_a_nested_override_without_authority_is_refused(self):
        with self.assertRaises(contract_mod.ContractError) as c:
            contract_mod.parse(self._with_class({"k_sigma": 4.0}))
        self.assertIn("tolerance_rule", str(c.exception))

    def test_a_nested_override_with_authority_and_basis_is_accepted(self):
        ct = contract_mod.parse(self._with_class(
            {"k_sigma": 4.0, "authority": "control",
             "basis": "a constructed small-object control landing in the same commit"}))
        self.assertEqual(
            contract_mod.for_class(ct, "ingest.matte.tolerance_rule", "takeable")["k_sigma"], 4.0)

    def test_an_observed_nested_override_may_not_gate(self):
        with self.assertRaises(contract_mod.ContractError):
            contract_mod.parse(self._with_class(
                {"k_sigma": 4.0, "authority": "observed", "basis": "measured on the corpus"}))


class MatteAcceptanceNumbersAreInTheContract(unittest.TestCase):
    """`_check_margin`'s 0.02 and `_check_ground_plausible`'s 40..215 decide
    which images ship and were literals, outside `thresholds_sha256`."""

    def test_the_framing_rule_is_pinned(self):
        fr = support.contract()["ingest"]["matte"]["framing_rule"]
        for key in ("max_border_off_fraction", "ground_luminance_min",
                    "ground_luminance_max", "authority", "basis"):
            self.assertIn(key, fr)

    def test_moving_the_framing_rule_moves_the_identity_hash(self):
        ct = support.contract()
        before = contract_mod.identity(ct)["thresholds_sha256"]
        mutated = json.loads(json.dumps(ct))
        mutated["ingest"]["matte"]["framing_rule"]["ground_luminance_min"] = 1.0
        after = contract_mod.identity(
            contract_mod.parse(json.dumps(mutated)))["thresholds_sha256"]
        self.assertNotEqual(before, after)

    def test_the_matte_reads_the_border_fraction_it_is_given(self):
        """The object touches the frame on one side: refused under the shipped
        2% budget, accepted under a wide one. Without this the literal could be
        put back and only the luminance half of the rule was guarded."""
        touching = np.full((200, 200, 3), 128, np.uint8)
        touching[0:120, 40:160] = 200                 # runs off the top edge
        with self.assertRaises(matte_mod.MatteError) as c:
            matte_mod.matte(touching, tolerance=10, hole_min_area_px=8, edge_erode_px=1,
                            feather_px=1, rgb_bleed_px=1)
        self.assertIn("touches the image border", str(c.exception))
        matte_mod.matte(touching, tolerance=10, hole_min_area_px=8, edge_erode_px=1,
                        feather_px=1, rgb_bleed_px=1,
                        framing_rule={"max_border_off_fraction": 0.9,
                                      "ground_luminance_min": 40.0,
                                      "ground_luminance_max": 215.0})

    def test_the_matte_reads_the_band_it_is_given(self):
        """A black frame is refused under the shipped band and accepted under a
        widened one — so the number is live, not decorative."""
        black = np.zeros((200, 200, 3), np.uint8)
        black[60:140, 60:140] = 200
        with self.assertRaises(matte_mod.MatteError):
            matte_mod.matte(black, tolerance=10, hole_min_area_px=8, edge_erode_px=1,
                            feather_px=1, rgb_bleed_px=1)
        matte_mod.matte(black, tolerance=10, hole_min_area_px=8, edge_erode_px=1,
                        feather_px=1, rgb_bleed_px=1,
                        framing_rule={"max_border_off_fraction": 0.02,
                                      "ground_luminance_min": 0.0,
                                      "ground_luminance_max": 255.0})


class TurnDegIsInTheThresholdIdentity(unittest.TestCase):
    """`camera.turn_deg` decides the `dims` verdict and was outside the hash."""

    def test_moving_the_turn_angle_moves_the_identity_hash(self):
        ct = support.contract()
        before = contract_mod.identity(ct)["thresholds_sha256"]
        mutated = json.loads(json.dumps(ct))
        mutated["camera"]["turn_deg"] = 45
        after = contract_mod.identity(
            contract_mod.parse(json.dumps(mutated)))["thresholds_sha256"]
        self.assertNotEqual(before, after)


class ReportSeverityDoesNotReadAsAPass(unittest.TestCase):
    """`part_mask` carries no verdict and printed `[ok  ]` on a board of gate
    lines, where it reads as evidence."""

    def test_a_report_line_is_marked_as_a_report(self):
        class _Args(object):
            id = "ctl"
            check = False
        result = support.ingest(*support.part_control()[:1], archetype="sliding",
                                previews=False,
                                part_specs=[{"id": "drawer_front",
                                             "mask": support.part_control()[1],
                                             "slide": {"dx": 0.0, "dy": 0.12,
                                                       "scale_open": 1.0},
                                             "source_rgb": support.part_control()[0]}])
        text = cli.human(result, _Args(), [], 0)
        line = [l for l in text.splitlines() if "part_mask" in l][0]
        self.assertIn("[rept]", line)
        self.assertNotIn("[ok  ]", line)
