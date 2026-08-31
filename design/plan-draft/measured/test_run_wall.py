#!/usr/bin/env python3
"""test_run_wall.py — the run wall: one corner, one ruler, no second return.

A RUN WALL is a long room's side wall. The painting legitimately shows ONE
corner (the closed end) and the flat wall running off the other frame edge:
no second corner, no second return, and past the open side the ceiling line
goes on horizontal because there is nothing there to ramp. The scaffold says
so out loud — `tools/plan-projection.mjs` `runSpanOf` extends
`corner_x0_px`/`corner_x1_px` to the ends of the RUN, so one of them lands
metres outside a 1536 px frame and `wall_run_m` is the length it wrote.

What these tests hold:

  * the run is READ off the declared meta and off nothing else, and an
    ordinary two-corner wall — including one merely wider than its lens — is
    not one;
  * the source box comes from THE ONE CORNER AND THE RULED ANCHOR: the second
    corner is neither needed nor looked at, and a "corner" the detector
    returned on the open side is ignored rather than pinned;
  * nothing is pinned outside the picture: the target's open end is the frame
    edge, never the declared corner metres away from it;
  * a two-corner wall takes the path it took before, pin for pin;
  * and where the ONE corner cannot be read this refuses by the name it always
    refused by, saying the run out loud.
"""
import os
import sys
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import row35_snap as snap                                       # noqa: E402
import mesh_warp as mw                                          # noqa: E402

W, H = snap.W, snap.H

PPM_T = 213.33333333333334          # the declared scale, underground-2/platform
STOREY_M = 3.4
FLOOR_PX = 778.4733333333334
HORIZON_PX = 526.10048


def declared(cx0, cx1, run_m=12.8, width_m=6.4, storey=STOREY_M, ppm=PPM_T):
    """A `wall_context`-shaped declaration, built by hand."""
    return dict(facing="platform/N", facing_type="enclosed", ppm=ppm,
                camera_m=4.8, horizon_px=HORIZON_PX, floor_px=FLOOR_PX,
                eye_m=(FLOOR_PX - HORIZON_PX) / ppm,
                corner_x0=cx0, corner_x1=cx1, principal_x=W / 2.0,
                wall_centre_x=0.5 * (cx0 + cx1), storey_m=storey,
                wall_width_m=width_m, wall_run_m=run_m)


def reading(cx0, cx1, ppm=199.167, floor_y=780, ceil_y=105, rail_px=None):
    """A `row23_lib.measure_candidate`-shaped reading, built by hand.

    `px_per_m_at_wall` is the RULED ANCHOR's own number — the reading's rail
    height above the floor divided by the ruler's metres — because that is the
    scale a run wall has to be placed with, there being no second corner to
    take one from.
    """
    rail = rail_px if rail_px is not None else round(ppm * snap.row23_lib.RULER_M)
    return {"px_per_m_at_wall": ppm,
            "_measured_px": {"wall_floor_line_y_px": floor_y,
                             "dado_rail_above_floor_px": rail,
                             "chair_rail_y_px": floor_y - rail},
            "_promotion": {"ceiling_y_px": ceil_y, "corner_x0_px": cx0,
                           "corner_x1_px": cx1, "ramp": None,
                           "hold_family": "unfitted-horizon"}}


class RunWallIsRead(unittest.TestCase):
    def test_the_open_side_is_the_off_frame_corner(self):
        r = snap.run_wall(declared(85.33, 2816.0))
        self.assertIsNotNone(r)
        self.assertEqual((r["closed"], r["open"]), ("x0", "x1"))
        self.assertAlmostEqual(r["edge_px"], W - 1.0)
        self.assertAlmostEqual(r["run_m"], 12.8)
        # the metres of run BETWEEN the corner and the frame edge
        self.assertAlmostEqual(r["run_visible_m"], (W - 1.0 - 85.33) / PPM_T, 6)

    def test_the_mirror_wall_runs_the_other_way(self):
        r = snap.run_wall(declared(-1280.0, 1450.67))
        self.assertEqual((r["closed"], r["open"]), ("x1", "x0"))
        self.assertAlmostEqual(r["edge_px"], 0.0)
        self.assertAlmostEqual(r["run_visible_m"], 1450.67 / PPM_T, 6)

    def test_a_manifest_without_the_field_falls_back_to_the_span(self):
        d = declared(85.33, 2816.0, run_m=None)
        r = snap.run_wall(d)
        self.assertAlmostEqual(r["run_m"], (2816.0 - 85.33) / PPM_T, 6)
        self.assertIn("corner span", r["run_m_from"])

    def test_two_corners_in_frame_is_not_a_run(self):
        self.assertIsNone(snap.run_wall(declared(120.0, 1400.0, run_m=None)))

    def test_a_wall_wider_than_its_lens_is_not_a_run(self):
        # `solar/N`: both corners off the frame, 6.0 m of wall and no run.
        self.assertIsNone(snap.run_wall(
            declared(-77.0, 1613.0, run_m=None, width_m=6.0)))

    def test_one_corner_off_frame_at_the_wall_s_own_width_is_not_a_run(self):
        # 1536+ px of a 6.4 m wall at 213.33 ppm: off the frame by a hair on
        # one side only, and still an ordinary two-corner wall.
        self.assertIsNone(snap.run_wall(
            declared(-60.0, 1305.3, run_m=None, width_m=6.4)))

    def test_an_open_facing_is_not_a_run(self):
        self.assertIsNone(snap.run_wall(declared(85.33, 2816.0, storey=None)))


class SourceBoxFromOneCorner(unittest.TestCase):
    def test_the_box_lands_from_the_corner_and_the_anchor_scale(self):
        d = declared(85.33, 2816.0)
        r = snap.run_wall(d)
        # the open-side "corner" is a recession break and is NOT the room's:
        # putting it anywhere may not move the box.
        for junk in (1235, 700, None):
            rd = reading(120, junk)
            b, notes, why = snap.source_box(rd, dict(d), "auto")
            self.assertIsNone(why, why)
            self.assertAlmostEqual(b["x0"], 120.0)
            self.assertAlmostEqual(
                b["x1"], 120.0 + r["run_visible_m"] * rd["px_per_m_at_wall"], 6)
            self.assertIn("closed side only", notes["corners"])
            self.assertEqual(notes["run_wall"]["closed"], "x0")

    def test_the_scale_is_the_ruled_anchor_s_and_needs_no_second_corner(self):
        d = declared(85.33, 2816.0)
        rd = reading(120, None, ppm=199.167)
        mp = rd["_measured_px"]
        self.assertAlmostEqual(
            mp["dado_rail_above_floor_px"] / snap.row23_lib.RULER_M,
            rd["px_per_m_at_wall"], delta=1.0)
        b, _, why = snap.source_box(rd, dict(d), "auto")
        self.assertIsNone(why)
        span_m = (b["x1"] - b["x0"]) / rd["px_per_m_at_wall"]
        self.assertAlmostEqual(span_m, snap.run_wall(d)["run_visible_m"], 6)

    def test_the_closed_side_may_be_the_right(self):
        d = declared(-1280.0, 1450.67)
        rd = reading(760, 1459)
        b, notes, why = snap.source_box(rd, dict(d), "auto")
        self.assertIsNone(why, why)
        self.assertAlmostEqual(b["x1"], 1459.0)
        self.assertAlmostEqual(
            b["x0"], 1459.0 - snap.run_wall(d)["run_visible_m"] * 199.167, 6)
        self.assertEqual(notes["run_wall"]["closed"], "x1")

    def test_the_one_corner_unreadable_is_still_a_landmark_refusal(self):
        d = declared(85.33, 2816.0)
        rd = reading(None, 1235)          # a break on the OPEN side and no corner
        b, notes, why = snap.source_box(rd, dict(d), "auto")
        self.assertIsNone(b)
        self.assertIn("run wall", why)
        self.assertIn("no corner on that side", why)
        self.assertIn("12.80 m", why)
        # and the warp refuses it by the name it always refuses landmarks by
        self.assertEqual(mw.LANDMARK_REFUSAL, "meshwarp.landmark_unreadable")


class NothingIsPinnedOutsideThePicture(unittest.TestCase):
    def setUp(self):
        self.d = declared(85.33, 2816.0)
        self.rd = reading(120, 1235)
        self.src, _, why = snap.source_box(self.rd, dict(self.d), "auto")
        self.assertIsNone(why, why)
        self.tgt, self.tnotes, why = mw.target_box_from_plan(
            self.d, self.src, self.rd["px_per_m_at_wall"])
        self.assertIsNone(why, why)

    def test_the_target_holds_the_corner_and_stops_at_the_frame_edge(self):
        self.assertAlmostEqual(self.tgt["x0"], 85.33)      # the real corner
        self.assertAlmostEqual(self.tgt["x1"], W - 1.0)    # NOT 2816
        self.assertIsNotNone(self.tnotes["run_wall"])
        self.assertIn("run wall", self.tnotes["horizontal"])

    def test_the_two_boxes_span_the_same_wall_at_their_own_scales(self):
        span_t = self.tgt["x1"] - self.tgt["x0"]
        span_s = self.src["x1"] - self.src["x0"]
        self.assertAlmostEqual(span_t / span_s,
                               PPM_T / self.rd["px_per_m_at_wall"], 6)

    def test_no_column_pin_sits_off_the_frame(self):
        cols, rows, _ = mw.wall_axis_pins(
            self.src, self.tgt, [], names=("corner_left", "run_end_right"))
        self.assertEqual([c["name"] for c in cols],
                         ["corner_left", "run_end_right"])
        self.assertEqual([c["kind"] for c in cols], ["room_corner", "run_end"])
        for c in cols:
            self.assertTrue(0.0 <= c["target"] <= W - 1.0, c)
            self.assertNotAlmostEqual(c["target"], 2816.0)
        self.assertIsNone(mw.axis_refusal("column", cols))
        self.assertIsNone(mw.axis_refusal("row", rows))

    def test_no_shell_pin_sits_off_the_frame(self):
        pins = mw.shell_pins(self.src, self.tgt)
        self.assertTrue(pins)
        for p in pins:
            self.assertTrue(-0.5 <= p["target"][0] <= W - 0.5, p)
            self.assertTrue(-0.5 <= p["target"][1] <= H - 0.5, p)
        self.assertFalse([p for p in pins if p["target"][0] > 2000])


class TheTwoCornerPathIsUnmoved(unittest.TestCase):
    def setUp(self):
        self.d = declared(120.0, 1400.0, run_m=None, width_m=6.0)
        self.rd = reading(140, 1380)
        self.assertIsNone(snap.run_wall(self.d))

    def test_the_source_box_is_the_measured_corners(self):
        b, notes, why = snap.source_box(self.rd, dict(self.d), "auto")
        self.assertIsNone(why, why)
        self.assertEqual((b["x0"], b["x1"]), (140.0, 1380.0))
        self.assertEqual(notes["corners"], "measured")
        self.assertNotIn("run_wall", notes)

    def test_an_unread_corner_still_falls_back_to_the_declaration(self):
        b, notes, why = snap.source_box(reading(None, 1380), dict(self.d), "auto")
        self.assertIsNone(why, why)
        self.assertEqual((b["x0"], b["x1"]), (120.0, 1400.0))
        self.assertTrue(notes["corners"].startswith("declared:"))

    def test_the_target_is_the_declared_corners_and_the_pins_are_unchanged(self):
        src, _, _ = snap.source_box(self.rd, dict(self.d), "auto")
        tgt, tnotes, why = mw.target_box_from_plan(
            self.d, src, self.rd["px_per_m_at_wall"])
        self.assertIsNone(why, why)
        self.assertEqual((tgt["x0"], tgt["x1"]), (120.0, 1400.0))
        self.assertTrue(tnotes["corners_in_frame"])
        self.assertIsNone(tnotes["run_wall"])
        self.assertIn("both inside the frame", tnotes["horizontal"])
        cols, rows, dropped = mw.wall_axis_pins(src, tgt, [])
        self.assertEqual([c["name"] for c in cols],
                         ["corner_left", "corner_right"])
        self.assertEqual([c["kind"] for c in cols], ["room_corner"] * 2)
        self.assertEqual((len(cols), len(rows), dropped), (2, 2, []))
        self.assertEqual(len(mw.shell_pins(src, tgt)), 12)


if __name__ == "__main__":
    unittest.main()
