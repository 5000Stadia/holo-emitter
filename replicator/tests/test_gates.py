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

import numpy as np

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
                           "the clean and haloed controls must be far apart, not adjacent — "
                           "and this is why the matte clauses judge the MATTE and not the "
                           "stored sprite: the stored-resolution downscale alone lifted this "
                           "ratio on the halo control from 0.05 to 0.78")

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


class BoundsTheCriticFound(unittest.TestCase):
    """Cases the artifact critic walked past a green gate with."""

    def _part(self, dx=-0.03, dy=0.22, scale=1.04):
        from replicator import maskgen
        src, rect = synth.part_source()
        mask = maskgen.rect_mask((src.shape[1], src.shape[0]),
                                 rect["x0"], rect["y0"], rect["x1"], rect["y1"])
        return support.ingest(
            src, archetype="sliding",
            part_specs=[{"id": "drawer_front", "mask": mask,
                         "slide": {"dx": dx, "dy": dy, "scale_open": scale},
                         "source_rgb": src}])

    def test_a_drawer_that_travels_off_its_carcass_is_refused(self):
        """The row's own desk shipped like this and read as a plank on the floor
        while twelve gates stayed green. On the corpus desk the honest travel is
        0.08 and 0.10 already hangs the front over the leg gaps; on this control,
        whose recess is a much larger share of its body, the band sits higher."""
        r = self._part(dy=0.60)
        self.assertIn("slide", r.failures)

    def test_a_drawer_dragged_sideways_is_refused(self):
        r = self._part(dx=-0.90)
        self.assertIn("slide", r.failures)

    def test_an_absurd_open_scale_is_refused(self):
        r = self._part(scale=4.0)
        self.assertIn("slide", r.failures)

    def test_a_sane_travel_still_passes(self):
        self.assertEqual(self._part().failures, [])

    def test_a_blank_thumb_is_refused(self):
        """The presence half of the thumb gate is a tautology inside the
        pipeline; the pixels are not."""
        from replicator import thumbs as thumbs_mod
        g = thumbs_mod.thumb_gate(np.zeros((128, 128, 4), np.uint8), True, 128, 112)
        self.assertFalse(g["passed"])
        self.assertIn("blank", g["message"])

    def test_registration_without_a_datum_never_reads_as_a_pass(self):
        closed, opened, info = synth.state_pair()
        r = support.ingest(closed, archetype="swap", attachment="wall_mounted",
                           dims_m={"h": 2.0, "w": 0.9, "d": 0.05},
                           state_specs=[{"name": "open", "source_rgb": opened,
                                         "origin": (0.0, 0.0), "datum": None}])
        reg = support.gate(r, "registration")
        self.assertFalse(reg["passed"], "an unverified registration must not print as ok")
        self.assertIn("NOT VERIFIED", reg["message"])

    def test_a4_says_so_when_it_cannot_measure(self):
        """A hard-edged silhouette leaves no rim at draw scale — which is the
        sticker tell itself — and the clause used to drop out silently."""
        import numpy as _np
        body = _np.zeros((600, 600, 4), _np.uint8)
        body[:, :, :3] = (120, 80, 44)
        body[:, :, 3] = 255
        from replicator import gates as gates_mod
        cfg = dict(support.contract()["gates"]["halo"])
        cfg["_draw_height_px"] = 20
        g = gates_mod.gate_halo(body, (144.0, 144.0, 143.0), cfg)
        self.assertTrue(g["measured"]["a4_unmeasured_grounds"])
        self.assertIn("could not be measured", g["message"])

    def test_the_dims_cross_check_now_carries_a_severity(self):
        r = support.ingest(synth.clean_sprite(), dims_m={"h": 0.8, "w": 3.0, "d": 3.0})
        g = support.gate(r, "dims")
        self.assertFalse(g["passed"])
        self.assertEqual(g["severity"], "warn")

    def test_a_faint_cast_shadow_is_a_shadow_not_a_thin_feature(self):
        """Sweeping the control's shadow depth used to abort the ingest with
        "features thinner than the edge treatment" in the middle of the range,
        non-monotonically, pointing the operator at the classes amendment path
        for a problem that is the image's."""
        for depth in (0.08, 0.12, 0.16, 0.24):
            r = support.ingest(synth.negative_control_shadow(depth=depth))
            self.assertIn("h", r.failures, "depth %.2f attributed to %s" % (depth, r.failures))

    def test_a_source_that_is_not_on_a_mid_grey_ground_is_refused(self):
        """An already-matted PNG flattened onto black used to ship as an opaque
        rectangle with every gate green."""
        import numpy as _np
        from replicator import matte as matte_mod
        black = _np.zeros((400, 400, 3), _np.uint8)
        black[100:300, 100:300] = (120, 80, 44)
        with self.assertRaises(matte_mod.MatteError) as cm:
            support.ingest(black)
        self.assertIn("mid-grey", str(cm.exception))


class BaseXIsAGroundContactFact(unittest.TestCase):
    """The clause row 4's bake inherits, asserted rather than only written down.

    `base.x` positions the sprite — `groundplane.placeHost` computes
    `drawX = baseX − f·base.x` — so moving it from the bottom-two-rows midpoint
    to the contact-band midpoint is a placement change, not only a shadow one.
    """

    def test_base_x_is_the_footprint_midpoint(self):
        r = support.ingest(synth.legged_sprite())
        a = r.record["anchors"]
        self.assertAlmostEqual(a["base"]["x"], (a["footprint"]["x0"] + a["footprint"]["x1"]) / 2.0,
                               places=6)

    def test_footprint_contains_the_bottom_two_rows_and_lies_inside_the_canvas(self):
        for src in (synth.legged_sprite(), synth.clean_sprite()):
            r = support.ingest(src)
            rec = r.record
            body = r.body
            opaque = body[..., 3] >= 128
            rows = np.flatnonzero(opaque.any(axis=1))
            bottom = int(rows.max())
            band = opaque[max(0, bottom - 1):bottom + 1]
            cols = np.flatnonzero(band.any(axis=0))
            fp = rec["anchors"]["footprint"]
            self.assertLessEqual(fp["x0"], int(cols.min()))
            self.assertGreaterEqual(fp["x1"], int(cols.max()) + 1)
            self.assertGreaterEqual(fp["x0"], 0)
            self.assertLessEqual(fp["x1"], rec["px"]["w"])

    def test_base_x_lies_inside_the_object(self):
        r = support.ingest(synth.legged_sprite())
        rec = r.record
        opaque = r.body[..., 3] >= 128
        cols = np.flatnonzero(opaque.any(axis=0))
        self.assertGreaterEqual(rec["anchors"]["base"]["x"], int(cols.min()))
        self.assertLessEqual(rec["anchors"]["base"]["x"], int(cols.max()) + 1)
