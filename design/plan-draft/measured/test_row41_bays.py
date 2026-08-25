#!/usr/bin/env python3
"""Row 41 — the bay arithmetic and the corner gate, asserted.

    python3 design/plan-draft/measured/test_row41_bays.py

WHAT IS UNDER TEST AND WHAT IS NOT. The LAYOUT is pure arithmetic over two
numbers — the wall's width and the material's bay module — and that is what this
file asserts, because it is the whole of the row's claim: a stile in each corner
is true by construction or it is not true at all. The pixels are not under test
here; they are judged by eye in `design/batches/row41-bays/` and by the Captain,
which is what the flip test is for.

THE ONE THING THAT MUST BE ABLE TO FAIL. `corner_rows` is the gate row 41 adds,
and a gate that cannot go red is not a gate — this project has a whole family
named after that. So the last case rebuilds a room with one wall reverted to the
row-36 construction (a tiled fabric, which has no bay boundaries at all) and
asserts that its corners FAIL. Every other case asserts a pass, and a pass that
nothing can turn into a failure is worth nothing.
"""
import os
import sys
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import row41_bays as B                                           # noqa: E402

FRAME = dict(B.DEFAULT_FRAME)
WAINSCOT = dict(B.DEFAULT_FRAME, kind="dado")
EDGE = {"kind": "return_stile", "width_m": 0.11}


class BayCount(unittest.TestCase):
    """n = round(W/m), and the bays divide the width exactly."""

    def test_count_is_the_rounded_quotient(self):
        for w, n in ((8.000, 10), (8.650, 11), (7.600, 9), (8.800, 11),
                     (0.400, 1), (1.100, 1), (1.300, 2), (2.000, 3)):
            lay = B.bay_layout(w, FRAME)
            self.assertEqual(lay["bays"], n, "W=%.3f" % w)

    def test_never_fewer_than_one_bay(self):
        # a 0.2 m wall rounds to zero bays and a wall with no bays has no
        # boundaries, so the corner gate would have nothing to find
        lay = B.bay_layout(0.20, FRAME)
        self.assertEqual(lay["bays"], 1)
        self.assertEqual(lay["boundaries_m"][0], 0.0)

    def test_bays_divide_the_width_exactly(self):
        for w in (8.0, 8.65, 7.6, 8.8, 3.31, 12.07):
            lay = B.bay_layout(w, FRAME)
            self.assertAlmostEqual(lay["bay_width_m"] * lay["bays"], w, places=6)
            for i, u in enumerate(lay["boundaries_m"]):
                self.assertAlmostEqual(u, i * w / lay["bays"], places=6)

    def test_the_module_comes_from_the_material(self):
        # a boarded dado at 0.25 m and a panel bay at 0.80 m are not the same
        # wall, and the layout must take the number it is given
        wide = B.bay_layout(8.0, dict(FRAME, module_m=0.80))
        tight = B.bay_layout(8.0, dict(FRAME, module_m=0.25))
        self.assertEqual((wide["bays"], tight["bays"]), (10, 32))


class CornerStiles(unittest.TestCase):
    """A stile lands in each corner, and it is a WHOLE stile inside the wall."""

    def test_boundaries_sit_at_both_corners_exactly(self):
        for w in (8.0, 8.65, 7.6, 0.4, 13.9):
            lay = B.bay_layout(w, FRAME)
            self.assertEqual(lay["boundaries_m"][0], 0.0)
            self.assertAlmostEqual(lay["boundaries_m"][-1], w, places=6)

    def test_a_stile_covers_each_corner(self):
        for w in (8.0, 8.65, 7.6):
            lay = B.bay_layout(w, FRAME)
            self.assertTrue(B._stile_covers(lay, 0.0))
            self.assertTrue(B._stile_covers(lay, w))

    def test_the_corner_stile_is_whole_and_inside_the_wall(self):
        w, s = 8.65, FRAME["stile_m"]
        lay = B.bay_layout(w, FRAME)
        first, last = lay["stiles"][0], lay["stiles"][-1]
        self.assertTrue(first["corner"] and last["corner"])
        self.assertAlmostEqual(first["u0"], 0.0, places=9)
        self.assertAlmostEqual(first["u1"], s, places=9)
        self.assertAlmostEqual(last["u0"], w - s, places=9)
        self.assertAlmostEqual(last["u1"], w, places=9)

    def test_interior_stiles_straddle_their_boundary(self):
        lay = B.bay_layout(8.65, FRAME)
        s = FRAME["stile_m"]
        for st in lay["stiles"][1:-1]:
            self.assertFalse(st["corner"])
            self.assertAlmostEqual(st["u1"] - st["u0"], s, places=9)
            self.assertAlmostEqual(0.5 * (st["u0"] + st["u1"]), st["at_m"],
                                   places=9)

    def test_every_field_lies_between_two_stiles(self):
        lay = B.bay_layout(8.65, FRAME)
        for i, bay in enumerate(lay["bay_rects"]):
            self.assertAlmostEqual(bay["field_u0"], lay["stiles"][i]["u1"], 9)
            self.assertAlmostEqual(bay["field_u1"], lay["stiles"][i + 1]["u0"], 9)
            self.assertGreater(bay["field_u1"], bay["field_u0"])


class Openings(unittest.TestCase):
    """An opening takes whole bays, and the distance it moved is stated."""

    def test_an_opening_lands_on_the_bay_grid(self):
        lay = B.bay_layout(8.0, FRAME, [("door", 3.4, 4.4)])
        op = lay["openings"][0]
        self.assertEqual(op["bays"], [4, 5])
        self.assertEqual(op["bay_count"], 2)
        for u in op["snapped_u_m"]:
            self.assertIn(round(u, 6), [round(b, 6) for b in lay["boundaries_m"]])

    def test_the_snap_distance_is_reported_and_is_the_real_move(self):
        lay = B.bay_layout(8.0, FRAME, [("door", 3.4, 4.4)])
        op = lay["openings"][0]
        self.assertAlmostEqual(op["snap_left_m"],
                               op["snapped_u_m"][0] - op["asked_u_m"][0], 6)
        self.assertAlmostEqual(op["snap_right_m"],
                               op["snapped_u_m"][1] - op["asked_u_m"][1], 6)
        self.assertAlmostEqual(op["snap_total_m"],
                               abs(op["snap_left_m"]) + abs(op["snap_right_m"]), 6)

    def test_no_snap_moves_more_than_half_a_bay(self):
        # the nearest boundary is by definition within half a bay, and if that
        # ever stopped being true the snap column would be reporting something
        # other than what it says
        lay = B.bay_layout(8.65, FRAME,
                           [("window", 1.11, 2.93), ("door", 6.02, 7.31)])
        for op in lay["openings"]:
            for d in (op["snap_left_m"], op["snap_right_m"]):
                self.assertLessEqual(abs(d), lay["bay_width_m"] / 2.0 + 1e-9)

    def test_an_opening_always_takes_at_least_one_whole_bay(self):
        lay = B.bay_layout(8.0, FRAME, [("window", 3.95, 4.02)])
        self.assertGreaterEqual(lay["openings"][0]["bay_count"], 1)

    def test_the_bays_an_opening_takes_are_marked_and_the_rest_are_not(self):
        lay = B.bay_layout(8.0, FRAME, [("door", 3.4, 4.4)])
        marked = [b["i"] for b in lay["bay_rects"] if b["opening"]]
        self.assertEqual(marked, [4, 5])

    def test_a_duplicate_carrier_is_dropped(self):
        # the plan lists some windows twice; two openings on one set of bays
        lay = B.bay_layout(8.0, FRAME,
                           [("window", 4.0, 5.5), ("window", 4.0, 5.5)])
        self.assertEqual(len(lay["openings"]), 1)

    def test_overlapping_carriers_are_resolved_and_the_loser_is_recorded(self):
        # kitchen/S rules a hearth at 2.50-5.50 and a window at 4.00-5.50
        lay = B.bay_layout(8.0, FRAME,
                           [("window", 4.0, 5.5), ("hearth", 2.5, 5.5)])
        self.assertEqual([o["kind"] for o in lay["openings"]], ["hearth"])
        self.assertEqual([o["kind"] for o in lay["openings_refused"]], ["window"])

    def test_the_hole_is_cut_between_the_stiles_not_the_boundaries(self):
        # kitchen/E's window snaps to the LAST bay, so a hole cut to the bay
        # boundary would take the corner stile out with it
        w = 8.65
        lay = B.bay_layout(w, FRAME, [("window", 7.4, w)])
        op = lay["openings"][0]
        self.assertAlmostEqual(op["snapped_u_m"][1], w, places=4)
        self.assertLess(op["clear_u_m"][1], w - FRAME["stile_m"] + 1e-9)
        self.assertGreater(op["clear_u_m"][0], op["snapped_u_m"][0] - 1e-9)
        # and the corner stile still covers the corner after the hole is cut
        self.assertTrue(B._stile_covers(lay, w))

    def test_a_door_beats_a_wider_window_for_the_bays_they_share(self):
        # kitchen/W rules a door at 4.25-5.25 across a window at 3.75-5.25; by
        # width alone the door lost and the wall came back with no way through
        lay = B.bay_layout(8.65, FRAME,
                           [("door", 4.25, 5.25), ("window", 3.75, 5.25),
                            ("window", 1.25, 2.75)])
        kinds = [o["kind"] for o in lay["openings"]]
        self.assertIn("door", kinds)
        self.assertEqual([o["kind"] for o in lay["openings_refused"]], ["window"])
        self.assertEqual(len(lay["openings"]), 2)

    def test_openings_are_reported_left_to_right(self):
        lay = B.bay_layout(8.8, FRAME,
                           [("door", 3.4, 4.4), ("hearth", 0.9, 2.9)])
        self.assertEqual([o["kind"] for o in lay["openings"]],
                         ["hearth", "door"])


class Bands(unittest.TestCase):
    """The frame completes at the floor, at 0.95 m, and at the CEILING."""

    def test_the_cornice_is_measured_down_from_the_storey(self):
        # the row-36 defect: the source's storey was 3.274 m and the kitchen's
        # 2.800 m, so the band carrying the cornice was clipped 0.474 m short
        for storey in (2.4, 2.8, 3.6):
            members, _f, _u = B.bands_of(FRAME, storey)
            name, v0, v1, _lvl = members[2]
            self.assertEqual(name, "cornice")
            self.assertAlmostEqual(v1, storey, places=9)
            self.assertAlmostEqual(v1 - v0, FRAME["cornice_m"], places=9)

    def test_the_chair_rail_sits_on_the_ruled_anchor(self):
        members, _f, _u = B.bands_of(FRAME, 2.8)
        name, v0, v1, _lvl = members[1]
        self.assertEqual(name, "chair_rail")
        self.assertAlmostEqual(0.5 * (v0 + v1), B.ANCHOR_M, places=9)
        self.assertAlmostEqual(0.5 * (v0 + v1), 0.95, places=9)

    def test_full_height_panelling_bays_both_bands(self):
        _m, fields, upper = B.bands_of(FRAME, 2.8)
        self.assertEqual([f[0] for f in fields], ["dado", "upper"])
        self.assertIsNone(upper)

    def test_wainscot_bays_only_below_the_rail(self):
        _m, fields, upper = B.bands_of(WAINSCOT, 2.8)
        self.assertEqual([f[0] for f in fields], ["dado"])
        self.assertIsNotNone(upper)
        self.assertAlmostEqual(upper[1], B.ANCHOR_M + WAINSCOT["chair_rail_h_m"] / 2.0, 9)


class UnframedEdge(unittest.TestCase):
    """A material with no bays still answers for the corner."""

    def test_an_edge_member_sits_at_each_corner(self):
        lay = B.edge_layout(8.65, EDGE)
        self.assertFalse(lay["framed"])
        self.assertTrue(B._stile_covers(lay, 0.0))
        self.assertTrue(B._stile_covers(lay, 8.65))

    def test_the_edge_never_swallows_the_wall(self):
        lay = B.edge_layout(0.10, {"kind": "quoin", "width_m": 0.225})
        self.assertLess(lay["edge_w_m"], 0.10)
        self.assertGreater(lay["edge_w_m"], 0.0)


class _Room(object):
    """The smallest thing `corner_rows` reads: four walls and a rect."""

    def __init__(self, layouts):
        self.walls = {f: {"layout": l} for f, l in layouts.items()}


class CornerGate(unittest.TestCase):
    """The gate row 41 adds — and the case that turns it red."""

    @staticmethod
    def room(w=8.0, h=8.65, frame=FRAME):
        return _Room({"N": B.bay_layout(w, frame), "E": B.bay_layout(h, frame),
                      "S": B.bay_layout(w, frame), "W": B.bay_layout(h, frame)})

    def test_a_laid_out_room_passes_every_corner_with_zero_gap(self):
        rows = B.corner_rows(self.room())
        self.assertEqual(len(rows), 8)
        for r in rows:
            self.assertTrue(r["pass"], r["corner"])
            self.assertEqual(r["boundary_gap_this_m"], 0.0)
            self.assertEqual(r["boundary_gap_next_m"], 0.0)
            self.assertTrue(r["stile_covers_corner"])

    def test_an_unframed_but_edged_room_also_passes(self):
        rw = _Room({f: B.edge_layout(w, EDGE) for f, w in
                    (("N", 8.0), ("E", 8.65), ("S", 8.0), ("W", 8.65))})
        for r in B.corner_rows(rw):
            self.assertTrue(r["pass"], r["corner"])

    def test_a_wall_reverted_to_A_TILED_CROP_fails_its_corners(self):
        # THE RED CASE. Row 36's construction has no bay boundaries at all: the
        # fabric is sampled by perimeter metre and the corner falls wherever the
        # wall happens to end. Modelled here as a wall whose layout reports no
        # member at either corner — which is exactly what a tiled wall is.
        tiled = dict(B.bay_layout(8.0, FRAME), stiles=[], boundaries_m=[])
        rw = self.room()
        rw.walls["N"]["layout"] = tiled
        rows = B.corner_rows(rw)
        failed = [r for r in rows if not r["pass"]]
        self.assertEqual(len(failed), 4, "every corner touching N must fail")
        for r in failed:
            self.assertIn("N", (r["this_wall"], r["next_wall"]))

    def test_a_boundary_further_out_than_a_stile_fails(self):
        # and the bar is a stile, so nudging one boundary just past it goes red
        rw = self.room()
        lay = rw.walls["E"]["layout"]
        s = lay["stile_m"]
        lay["boundaries_m"] = [b + 2 * s for b in lay["boundaries_m"]]
        lay["stiles"] = [dict(st, u0=st["u0"] + 2 * s, u1=st["u1"] + 2 * s)
                         for st in lay["stiles"]]
        self.assertTrue(any(not r["pass"] for r in B.corner_rows(rw)))


class Profiles(unittest.TestCase):
    """The drawn sections, where a wrong sign is invisible in a picture."""

    def test_the_panel_is_recessed_and_its_field_is_raised(self):
        import numpy as np
        d = np.array([0.0, 0.004, 0.02, 0.05, 0.30])
        r = B._panel_relief(d, FRAME["bevel_m"])
        self.assertLess(r[0], 0.0)                       # the quirk cuts in
        self.assertLess(r[1], r[4])                      # and the field is up
        self.assertAlmostEqual(float(r[4]), B.FIELD_H, places=9)
        self.assertLess(float(r[4]), B.STILE_H)          # still shy of the stile

    def test_the_chair_rail_undercuts_at_its_foot(self):
        import numpy as np
        t = np.array([0.02, 0.45, 0.95])
        p = B._profile("chair_rail", t)
        self.assertLess(float(p[0]), 0.0)                # the shadow line
        self.assertGreater(float(p[1]), float(p[2]))     # torus over fillet

    def test_the_cornice_steps_out_towards_the_head(self):
        import numpy as np
        p = B._profile("cornice", np.array([0.05, 0.3, 0.55, 0.9]))
        self.assertLess(float(p[0]), 0.0)
        self.assertTrue(float(p[1]) < float(p[2]) < float(p[3]))


if __name__ == "__main__":
    unittest.main(verbosity=2)
