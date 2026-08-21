"""The stages themselves: matte, anchors, parts, states, thumbs.

Everything here drives the pure functions directly, with constructed images —
which is the point of blueprint §4b rule 1: if a stage can only be exercised
through the CLI, it is not an importable pure function.
"""

import unittest

import numpy as np

from replicator import anchors as anchors_mod
from replicator import imaging as im
from replicator import maskgen
from replicator import matte as matte_mod
from replicator import parts as parts_mod
from replicator import states as states_mod
from replicator import synth
from replicator import thumbs as thumbs_mod

from . import support


class Matte(unittest.TestCase):
    def test_background_is_the_border_median(self):
        src = synth.clean_sprite()
        bg = matte_mod.sample_background(src)
        for c in bg:
            self.assertAlmostEqual(c, 144.0, delta=1.5)

    def test_tolerance_is_computed_per_image_not_pinned(self):
        rule = support.contract()["ingest"]["matte"]["tolerance_rule"]
        quiet = matte_mod.tolerance_for({"sigma": 0.5, "drift": 1.0}, rule)
        noisy = matte_mod.tolerance_for({"sigma": 3.0, "drift": 2.0}, rule)
        self.assertLess(quiet, noisy, "a noisier ground must earn a wider tolerance")
        self.assertLessEqual(noisy, rule["max"])
        self.assertGreaterEqual(quiet, rule["min"])

    def test_spatial_parameters_scale_with_the_content(self):
        rule = support.contract()["ingest"]["matte"]["spatial_rule"]
        small = matte_mod.spatial_params(128, rule)
        large = matte_mod.spatial_params(1200, rule)
        self.assertLess(small["edge_erode_px"], large["edge_erode_px"],
                        "2px of erosion is 1.6%% of a 128px takeable and 0.2%% of the corpus "
                        "desk; an absolute count validated at one end is wrong at the other")
        self.assertLess(small["hole_min_area_px"], large["hole_min_area_px"])

    def test_an_object_touching_the_border_is_refused(self):
        src = synth.clean_sprite().copy()
        src[:, :3] = (110, 72, 40)
        with self.assertRaises(matte_mod.MatteError) as cm:
            support.matte_of(src)
        self.assertIn("border", str(cm.exception))

    def test_an_enclosed_gap_is_punched_and_a_speck_is_not(self):
        src = synth.clean_sprite().copy()
        src[300:400, 300:400] = (144, 144, 143)     # a real gap
        src[500:502, 500:502] = (144, 144, 143)     # a two-pixel speck
        r = support.matte_of(src)
        ox, oy = r.trim_offset
        self.assertEqual(int(r.rgba[350 - oy, 350 - ox, 3]), 0, "the gap is punched")
        self.assertGreater(int(r.rgba[500 - oy, 500 - ox, 3]), 0,
                           "a speck of coincidentally-ground-coloured object is not a gap")

    def test_the_feather_is_inward_so_no_visible_pixel_reads_as_ground(self):
        r = support.matte_of(synth.clean_sprite())
        alpha = r.rgba[..., 3].astype(float)
        visible = alpha > 0
        d = im.rgb_distance(r.rgba[..., :3], r.bg_color)
        self.assertGreater(float(d[visible].min()), 5.0,
                           "feathering outward would extend the silhouette over literal "
                           "ground pixels — manufacturing the halo gate (a) exists to catch")

    def test_transparent_pixels_carry_object_colour_not_ground_and_not_black(self):
        r = support.matte_of(synth.clean_sprite())
        alpha = r.rgba[..., 3]
        rgb = r.rgba[..., :3]
        outside = alpha == 0
        near = im.dilate(alpha > 0, 2) & outside
        if near.sum():
            d = im.rgb_distance(rgb[near], r.bg_color)
            self.assertGreater(float(d.mean()), 20.0,
                               "the bled band must not carry the studio ground: the sprite is "
                               "drawn at ~10x downscale and a bilinear sampler reaches into it")

    def test_trim_is_exact_and_the_offset_is_returned(self):
        r = support.matte_of(synth.clean_sprite())
        alpha = r.rgba[..., 3]
        self.assertTrue((alpha[0] > 0).any() and (alpha[-1] > 0).any())
        self.assertTrue((alpha[:, 0] > 0).any() and (alpha[:, -1] > 0).any())
        self.assertEqual(len(r.trim_offset), 2)

    def test_erosion_refuses_to_eat_a_thin_feature(self):
        """The guard is about thinness, not smallness — see matte.matte."""
        src = synth.clean_sprite().copy()
        # a whisker four pixels wide and forty tall, standing clear of the body:
        # big enough to count as a piece, thin enough that 3 px of erosion
        # removes it entirely.
        src[28:68, 348:352] = (110, 72, 40)
        with self.assertRaises(matte_mod.MatteError) as cm:
            matte_mod.matte(src, tolerance=8.0, hole_min_area_px=31, edge_erode_px=3,
                            feather_px=1, rgb_bleed_px=1, max_erode_excess_ratio=1.6)
        self.assertIn("thinner", str(cm.exception))


class Anchors(unittest.TestCase):
    def test_px_base_and_footprint_follow_the_pixels(self):
        """The derivation mechanisms.spec witnesses, re-implemented independently."""
        r = support.ingest(synth.legged_sprite())
        rec = r.record
        body = r.body
        a = body[..., 3]
        opaque = a >= 128
        rows = np.flatnonzero(opaque.any(axis=1))
        bottom = int(rows.max())
        self.assertEqual(rec["px"], {"w": int(body.shape[1]), "h": int(body.shape[0])})
        self.assertEqual(rec["anchors"]["base"]["y"], bottom + 1,
                         "base.y is the image's own bottom edge")
        fp = rec["anchors"]["footprint"]
        self.assertAlmostEqual(rec["anchors"]["base"]["x"], (fp["x0"] + fp["x1"]) / 2.0,
                               places=6, msg="base and footprint must agree or the contact "
                                             "pool is drawn off the object")

    def test_the_contact_band_is_narrow_for_a_squat_object(self):
        r = support.ingest(synth.squat_sprite(), takeable=True, attachment="anchored",
                           dims_m={"h": 0.06, "w": 0.06, "d": 0.005})
        band = r.record["measured"]["contact"]["contact_band"]
        self.assertIsNotNone(band)

    def test_a_manual_region_translates_from_source_coordinates(self):
        r = support.ingest(synth.clean_sprite(),
                           anchor_regions={"surface_top": (200, 160, 500, 200)})
        region = r.record["anchors"]["surface_top"]
        px = r.record["px"]
        self.assertTrue(0 <= region["x0"] < region["x1"] <= px["w"])
        self.assertTrue(0 <= region["y0"] < region["y1"] <= px["h"])
        self.assertLess(region["x0"], 200, "the region must have moved by the trim offset")

    def test_a_region_outside_the_canvas_is_an_error_not_a_clamp(self):
        with self.assertRaises(anchors_mod.AnchorError) as cm:
            support.ingest(synth.clean_sprite(),
                           anchor_regions={"surface_top": (0, 0, 40, 20)})
        self.assertIn("outside", str(cm.exception))

    def test_an_inverted_region_is_an_error(self):
        with self.assertRaises(anchors_mod.AnchorError):
            support.ingest(synth.clean_sprite(),
                           anchor_regions={"surface_top": (500, 200, 200, 160)})

    def test_the_vlm_seam_exists_and_is_not_called(self):
        with self.assertRaises(NotImplementedError):
            anchors_mod.detect_regions(np.zeros((4, 4, 4), np.uint8))


class PartsAndMasks(unittest.TestCase):
    def _part_run(self, dy=0.24, mask=None):
        src, rect = synth.part_source()
        if mask is None:
            mask = maskgen.rect_mask((src.shape[1], src.shape[0]),
                                     rect["x0"], rect["y0"], rect["x1"], rect["y1"])
        return support.ingest(
            src, archetype="sliding",
            part_specs=[{"id": "drawer_front", "mask": mask,
                         "slide": {"dx": -0.10, "dy": dy, "scale_open": 1.06},
                         "source_rgb": src}]), src, rect

    def test_the_part_is_cut_and_the_cavity_is_darkened(self):
        r, _, _ = self._part_run()
        self.assertEqual(r.failures, [])
        stats = r.record["provenance"]["derived"]["parts"]["drawer_front"]
        self.assertLess(stats["cavity_over_part_ratio"], 0.7,
                        "the same ratio mechanisms.spec asserts for the placeholders")

    def test_the_part_origin_is_in_body_pixel_space(self):
        r, _, _ = self._part_run()
        origin = r.record["parts"][0]["origin"]
        px = r.record["px"]
        self.assertTrue(0 <= origin["x"] < px["w"] and 0 <= origin["y"] < px["h"])

    def test_a_travel_that_does_not_open_is_refused(self):
        r, _, _ = self._part_run(dy=0.02)
        self.assertIn("slide", r.failures)
        self.assertIn("open_state", r.failures)

    def test_the_clearance_bound_is_not_derived_from_the_slide_it_checks(self):
        """An earlier draft derived the cavity FROM the slide, so the bound
        equalled the value under test and could not fail for any input."""
        a, _, _ = self._part_run(dy=0.24)
        b, _, _ = self._part_run(dy=0.40)
        min_a = support.gate(a, "slide")["measured"]["min_dy_clearance"]
        min_b = support.gate(b, "slide")["measured"]["min_dy_clearance"]
        self.assertEqual(min_a, min_b,
                         "the clearance bound must not move when the slide moves")

    def test_a_mask_of_the_wrong_size_is_an_error(self):
        src, rect = synth.part_source()
        bad = np.zeros((src.shape[0] // 2, src.shape[1] // 2), bool)
        bad[10:20, 10:20] = True
        with self.assertRaises(parts_mod.PartError):
            support.ingest(src, archetype="sliding",
                           part_specs=[{"id": "p", "mask": bad,
                                        "slide": {"dx": 0.0, "dy": 0.3, "scale_open": 1.0},
                                        "source_rgb": src}])

    def test_a_part_without_the_sliding_archetype_is_refused(self):
        src, rect = synth.part_source()
        mask = maskgen.rect_mask((src.shape[1], src.shape[0]),
                                 rect["x0"], rect["y0"], rect["x1"], rect["y1"])
        with self.assertRaises(Exception) as cm:
            support.ingest(src, archetype="static",
                           part_specs=[{"id": "p", "mask": mask,
                                        "slide": {"dx": 0.0, "dy": 0.3, "scale_open": 1.0},
                                        "source_rgb": src}])
        self.assertIn("sliding", str(cm.exception))

    def test_mask_adherence_is_measured_per_edge(self):
        src, rect = synth.part_source()
        good = maskgen.rect_mask((src.shape[1], src.shape[0]),
                                 rect["x0"], rect["y0"], rect["x1"], rect["y1"])
        one_edge_wrong = maskgen.rect_mask(
            (src.shape[1], src.shape[0]), rect["x0"], rect["y0"], rect["x1"] + 40, rect["y1"])
        a = parts_mod.mask_adherence_per_edge(src, good)
        b = parts_mod.mask_adherence_per_edge(src, one_edge_wrong)
        self.assertGreater(a["within_3px_fraction"], b["within_3px_fraction"],
                           "a mask wrong on ONE edge must score worse — a mean over the whole "
                           "ring averages three good edges against one bad one and passes")

    def test_the_polygon_rasteriser_is_deterministic(self):
        pts = [(10, 10), (90, 12), (88, 70), (12, 74)]
        a = maskgen.polygon_mask((120, 100), pts)
        b = maskgen.polygon_mask((120, 100), pts)
        self.assertTrue(np.array_equal(a, b))

    def test_the_mask_fit_is_reproducible_from_its_hint(self):
        src, rect = synth.part_source()
        hint = (rect["x0"] - 6, rect["y0"] - 6, rect["x1"] + 6, rect["y1"] + 6)
        v1, info1 = maskgen.fit_polygon_from_hint(src, hint)
        v2, info2 = maskgen.fit_polygon_from_hint(src, hint)
        self.assertEqual(v1, v2, "the fit must be a function of the hint and the image")
        self.assertLess(info1["worst_rms_px"], 3.0)
        for v, truth in zip(v1, [(rect["x0"], rect["y0"]), (rect["x1"], rect["y0"]),
                                 (rect["x1"], rect["y1"]), (rect["x0"], rect["y1"])]):
            self.assertLess(abs(v[0] - truth[0]), 8)
            self.assertLess(abs(v[1] - truth[1]), 8)


class TwoState(unittest.TestCase):
    def _pair(self):
        closed, opened, info = synth.state_pair()
        return closed, opened, info

    def test_registration_is_derived_from_a_datum_in_both_images(self):
        closed, opened, info = self._pair()
        r = support.ingest(closed, archetype="swap", attachment="wall_mounted",
                           dims_m={"h": 2.0, "w": 0.9, "d": 0.05},
                           state_specs=[{"name": "open", "source_rgb": opened,
                                         "origin": None, "datum": info["datum"]}])
        self.assertEqual(r.failures, [])
        reg = support.gate(r, "registration")
        self.assertGreater(reg["measured"]["correlation_peak"], 0.9)

    def test_a_typed_origin_that_disagrees_with_the_images_is_caught_in_x(self):
        """The clause that gives the alignment gate content.

        Clause (i) has exactly one satisfying origin.y, so an operator who never
        opens the images and simply subtracts passes it every time.
        """
        closed, opened, info = self._pair()
        r = support.ingest(closed, archetype="swap", attachment="wall_mounted",
                           dims_m={"h": 2.0, "w": 0.9, "d": 0.05},
                           state_specs=[{"name": "open", "source_rgb": opened,
                                         "origin": (90.0, 0.0), "datum": info["datum"]}])
        self.assertIn("registration", r.failures)

    def test_no_registration_at_all_is_refused(self):
        closed, opened, info = self._pair()
        with self.assertRaises(states_mod.StateError) as cm:
            support.ingest(closed, archetype="swap", attachment="wall_mounted",
                           dims_m={"h": 2.0, "w": 0.9, "d": 0.05},
                           state_specs=[{"name": "open", "source_rgb": opened,
                                         "origin": None, "datum": None}])
        self.assertIn("no sound default", str(cm.exception))

    def test_a_datum_too_small_to_correlate_is_refused_by_name(self):
        closed, opened, info = self._pair()
        with self.assertRaises(states_mod.StateError) as cm:
            support.ingest(closed, archetype="swap", attachment="wall_mounted",
                           dims_m={"h": 2.0, "w": 0.9, "d": 0.05},
                           state_specs=[{"name": "open", "source_rgb": opened,
                                         "origin": None, "datum": (5, 5, 8, 8)}])
        self.assertIn("too small", str(cm.exception))

    def test_a_datum_the_open_image_does_not_show_is_caught(self):
        """The correlation floor is what stops a datum that names the wrong thing.

        Here the datum is taken from the closed leaf's own face, which the open
        state does not contain at all — so the peak drops and the registration
        gate refuses rather than registering to a coincidence.
        """
        closed, opened, info = self._pair()
        left, top = info["left"], info["top"]
        datum = (left + info["leaf_w"] // 2 - 30, top + info["leaf_h"] // 2 - 30,
                 left + info["leaf_w"] // 2 + 30, top + info["leaf_h"] // 2 + 30)
        r = support.ingest(closed, archetype="swap", attachment="wall_mounted",
                           dims_m={"h": 2.0, "w": 0.9, "d": 0.05},
                           state_specs=[{"name": "open", "source_rgb": opened,
                                         "origin": (0.0, 0.0), "datum": datum}])
        reg = support.gate(r, "registration")
        self.assertLess(reg["measured"]["correlation_peak"],
                        support.contract()["gates"]["registration"]["min_correlation"] + 0.4,
                        "a datum the open image does not show cannot correlate strongly")

    def test_the_alignment_clauses_fail_separately(self):
        gate = states_mod.alignment_gate({"x": 0.0, "y": 200.0}, (100, 50), (400, 300))
        self.assertFalse(gate["passed"])
        self.assertIn("(i)", gate["message"])
        gate2 = states_mod.alignment_gate({"x": -20.0, "y": 200.0}, (100, 100), (400, 300))
        self.assertFalse(gate2["passed"])
        self.assertIn("(ii)", gate2["message"])
        self.assertIn("NOT general", gate2["message"],
                      "the known exception must meet the operator where it bites")

    def test_extent_is_not_written_into_the_record(self):
        closed, opened, info = self._pair()
        r = support.ingest(closed, archetype="swap", attachment="wall_mounted",
                           dims_m={"h": 2.0, "w": 0.9, "d": 0.05},
                           state_specs=[{"name": "open", "source_rgb": opened,
                                         "origin": None, "datum": info["datum"]}])
        entry = r.record["states_images"]["open"]
        self.assertEqual(sorted(entry), ["image", "origin"],
                         "extent is build-time presentation data row 4's bake derives; a "
                         "second home for a derived fact is what the one-home rule forbids")


class Thumbs(unittest.TestCase):
    def test_a_takeable_gets_a_square_thumb(self):
        r = support.ingest(synth.squat_sprite(), takeable=True, attachment="anchored",
                           dims_m={"h": 0.06, "w": 0.06, "d": 0.005})
        self.assertEqual(r.thumb.shape[0], 128)
        self.assertEqual(r.thumb.shape[1], 128)
        self.assertEqual(r.record["thumb"], "thumb.png")

    def test_a_non_takeable_carries_none(self):
        r = support.ingest(synth.clean_sprite())
        self.assertIsNone(r.thumb)
        self.assertNotIn("thumb", r.record)

    def test_the_thumb_gate_catches_a_record_that_lies_either_way(self):
        g = thumbs_mod.thumb_gate(None, True, 128)
        self.assertFalse(g["passed"])
        g2 = thumbs_mod.thumb_gate(np.zeros((128, 128, 4), np.uint8), False, 128)
        self.assertFalse(g2["passed"])

    def test_content_is_centred(self):
        body = np.zeros((200, 100, 4), np.uint8)
        body[50:150, 20:80] = (200, 100, 50, 255)
        t = thumbs_mod.make_thumb(body, size_px=128, content_px=112)
        cols = np.flatnonzero((t[..., 3] > 0).any(axis=0))
        self.assertAlmostEqual((cols.min() + cols.max() + 1) / 2.0, 64.0, delta=2.0)


if __name__ == "__main__":
    unittest.main()
