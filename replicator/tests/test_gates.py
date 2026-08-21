"""Every gate green on a clean control, red on its own constructed control.

Blueprint §9.4 names one negative control ("an image constructed to fail — grey
halo on grey ground — that must demonstrably fail"). This suite makes it a
family, one per hard gate, because "every gate goes red when you break what it
guards" is otherwise something a report claims rather than something the suite
runs.

The **calibration** class below is the other half, and it is an assertion rather
than a report: a gate whose own control cannot make it fail is a gate with no
content, and it turns this suite red.
"""

import unittest

from replicator import synth

from . import support


class CleanControlsPass(unittest.TestCase):
    """Nothing goes red on a well-formed source."""

    def test_clean_solid(self):
        r = support.ingest(synth.clean_sprite())
        self.assertEqual(r.failures, [], "clean control failed: %s" % r.failures)

    def test_legged_object(self):
        r = support.ingest(synth.legged_sprite())
        self.assertEqual(r.failures, [])

    def test_grey_object_is_not_a_halo_and_not_a_shadow(self):
        """An iron disc is ground-toned end to end and is still an object.

        This is the control that keeps M0's iron key, silver coin and brass
        candlestick ingestable. An earlier gate (h) keyed on tone alone and
        would have hard-failed all three by material, and an earlier gate (a)
        clause required an absolute edge-to-ground distance that a grey object
        cannot meet.
        """
        r = support.ingest(synth.squat_sprite(), takeable=True, attachment="anchored",
                           dims_m={"h": 0.06, "w": 0.06, "d": 0.005})
        self.assertEqual(r.failures, [])
        h = support.gate(r, "h")
        self.assertGreater(h["measured"]["ground_toned_fraction"], 0.5,
                           "the control should be overwhelmingly ground-toned")
        self.assertTrue(h["passed"], "and still not a shadow")


class NegativeControls(unittest.TestCase):
    """§9.4's must-fail family. Each names the gate it exists to redden."""

    def assert_fails(self, result, gate_id):
        self.assertIn(gate_id, result.failures,
                      "expected gate %r to go red; failures were %s"
                      % (gate_id, result.failures))
        self.assertFalse(result.ok)

    def test_the_named_negative_control_grey_halo_on_grey_ground(self):
        """Blueprint §9.4's own control, by name."""
        self.assert_fails(support.ingest(synth.negative_control_halo()), "a")

    def test_enclosed_hole_the_matte_missed(self):
        self.assert_fails(support.ingest(synth.negative_control_hole()), "b")

    def test_undersized(self):
        self.assert_fails(support.ingest(synth.negative_control_undersized()), "c")

    def test_baked_cast_shadow(self):
        self.assert_fails(support.ingest(synth.negative_control_shadow()), "h")

    def test_matte_eating_the_object(self):
        self.assert_fails(support.ingest(synth.negative_control_bitten()), "g")

    def test_a_failing_ingest_produces_no_record_worth_shipping(self):
        r = support.ingest(synth.negative_control_halo())
        self.assertFalse(r.ok)
        self.assertTrue(r.failures)


class LightGateIsWarnOnly(unittest.TestCase):
    """(e) never blocks — blueprint §9.4 says warn only, and that is [HUMAN]."""

    def test_wrong_light_still_emits(self):
        r = support.ingest(synth.lit_solid(direction="UR"))
        self.assertEqual(r.failures, [], "gate (e) must not block")
        self.assertIn("e", r.warnings)

    def test_deviation_is_recorded_in_the_record(self):
        r = support.ingest(synth.lit_solid(direction="UR"))
        measured = r.record["measured"]["light"]
        self.assertIn("estimate_deg", measured)
        self.assertIs(measured["agrees_with_declared"], False)
        self.assertEqual(r.record["light"], "UL45",
                         "the record still declares the contract's key ...")
        self.assertFalse(measured["agrees_with_declared"],
                         "... and carries the contradiction beside it, so no reader "
                         "can take the declaration on faith")


class Calibration(unittest.TestCase):
    """A gate whose control cannot make it fail is a gate with no content.

    This is an assertion, not a line in a report. The row-2 lesson recorded in
    design/architecture.md is that a check which cannot go red is worse than no
    check, because it reads as evidence.
    """

    def test_light_band_separates_the_three_constructed_directions(self):
        ct = support.contract()
        cfg = ct["gates"]["light"]
        ul = support.gate(support.ingest(synth.lit_solid(direction="UL")), "e")
        ur = support.gate(support.ingest(synth.lit_solid(direction="UR")), "e")
        top = support.gate(support.ingest(synth.lit_solid(direction="TOP")), "e")
        self.assertTrue(ul["passed"], "a correctly UL45-lit control must pass: %s" % ul["message"])
        self.assertFalse(ur["passed"], "an upper-right-lit control must warn")
        self.assertFalse(top["passed"], "a top-lit control must warn")
        # And the band must actually be doing work, not admitting everything.
        self.assertLess(ul["measured"]["deviation_deg"], cfg["max_deviation_deg"])
        self.assertGreater(top["measured"]["deviation_deg"], cfg["max_deviation_deg"],
                           "a top-lit object must be OUTSIDE the band — this is why the "
                           "reference angle is the estimator's own response to UL (115.5) "
                           "and not the geometric 135")

    def test_halo_clauses_separate_clean_from_haloed(self):
        clean = support.gate(support.ingest(synth.legged_sprite()), "a")
        haloed = support.gate(support.ingest(synth.negative_control_halo()), "a")
        self.assertTrue(clean["passed"])
        self.assertFalse(haloed["passed"])
        self.assertGreater(clean["measured"]["inner_band_saturation_ratio"],
                           haloed["measured"]["inner_band_saturation_ratio"] * 5,
                           "the clean and haloed controls must be far apart, not adjacent")

    def test_contact_band_finds_a_stance_the_bottom_two_rows_cannot(self):
        """The control's stance is known by construction, so this is not a fit."""
        r = support.ingest(synth.legged_sprite())
        prov = r.record["measured"]["contact"]
        band = prov["contact_band"]
        bottom2 = prov["bottom_two_rows"]
        self.assertGreater(band["x1"] - band["x0"], (bottom2["x1"] - bottom2["x0"]) * 1.2,
                           "the contact band must reach feet the bottom two rows miss")
        width = r.record["px"]["w"]
        self.assertGreater((band["x1"] - band["x0"]) / width, 0.85,
                           "the constructed stance spans nearly the whole width")

    def test_over_matte_separates_a_clean_edge_from_an_eaten_one(self):
        clean = support.gate(support.ingest(synth.clean_sprite()), "g")
        eaten = support.gate(support.ingest(synth.negative_control_bitten()), "g")
        self.assertTrue(clean["passed"])
        self.assertFalse(eaten["passed"])
        self.assertGreater(eaten["measured"]["tolerance_sensitivity"],
                           clean["measured"]["tolerance_sensitivity"] + 0.01)

    def test_shadow_gate_separates_a_shadow_from_a_grey_object(self):
        shadow = support.gate(support.ingest(synth.negative_control_shadow()), "h")
        grey = support.gate(support.ingest(synth.squat_sprite(), takeable=True,
                                           attachment="anchored",
                                           dims_m={"h": 0.06, "w": 0.06, "d": 0.005}), "h")
        self.assertFalse(shadow["passed"])
        self.assertTrue(grey["passed"])
        self.assertGreater(shadow["measured"]["toned_below_object_fraction"],
                           grey["measured"]["toned_below_object_fraction"] + 0.01)


class EveryGateReportsItsMeasurement(unittest.TestCase):
    def test_green_gates_are_auditable(self):
        r = support.ingest(synth.clean_sprite())
        for g in r.gates:
            self.assertIn("measured", g)
            self.assertIn("threshold", g)
            self.assertTrue(g["message"], "gate %r reported no message" % g["id"])


if __name__ == "__main__":
    unittest.main()
