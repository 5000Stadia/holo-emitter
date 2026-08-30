#!/usr/bin/env python3
"""THE DEEP VIEW'S ACCEPTANCE — a synthetic long room, painted by surface.

    python3 -m unittest test_deep_view

Two cells of a long room, joined by a full-width open edge. Every source
painting is FLAT PER SURFACE — one colour for the wall, one for the floor, one
for the ceiling, one per side — so a probe of the assembled frame answers a
question with no tolerance in it: "which painting, and which surface of it, did
this pixel come from?" The geometry is canonical (the drawing's own focal, eye
and horizon), so the far frame's scale is exactly `k = 4.8 / 11.2` and the
probes below are hand-computed from the pinhole rather than from the module.
"""

import json
import os
import shutil
import sys
import tempfile
import unittest

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import deep_view as dv                                          # noqa: E402
import row35_snap as snap                                       # noqa: E402

STOREY = 3.4
WIDTH = 6.4

#: The synthetic long room: `near` 0..6.4, `far` 6.4..12.8, both 6.4 wide, the
#: open edge at x = 6.4 spanning the whole of it. `near/E` is the deep facing:
#: its wall line is the far cell's east wall at 12.8, 11.2 m from its
#: standpoint, and the edge it crosses is 4.8 m out.
PLAN = {
    "standpoint_stand_back": 0.25,
    "floors": [{"id": "below", "level": 0, "storey_height_m": STOREY}],
    "rooms": [
        {"id": "near", "floor": "below",
         "rect": {"x0": 0.0, "x1": 6.4, "y0": 0.0, "y1": 6.4},
         "facings": {
             "E": {"standpoint": {"x": 1.6, "y": 3.2}, "wall_line": 12.8,
                   "wall_width_m": WIDTH, "camera_wall_m": 11.2},
             "W": {"standpoint": {"x": 4.8, "y": 3.2}, "wall_line": 0.0,
                   "wall_width_m": WIDTH, "camera_wall_m": 4.8},
             "N": {"standpoint": {"x": 3.2, "y": 1.6}, "wall_line": 6.4,
                   "wall_width_m": WIDTH, "camera_wall_m": 4.8},
             "S": {"standpoint": {"x": 3.2, "y": 4.8}, "wall_line": 0.0,
                   "wall_width_m": WIDTH, "camera_wall_m": 4.8}}},
        {"id": "far", "floor": "below",
         "rect": {"x0": 6.4, "x1": 12.8, "y0": 0.0, "y1": 6.4},
         "facings": {
             "E": {"standpoint": {"x": 8.0, "y": 3.2}, "wall_line": 12.8,
                   "wall_width_m": WIDTH, "camera_wall_m": 4.8},
             "W": {"standpoint": {"x": 11.2, "y": 3.2}, "wall_line": 0.0,
                   "wall_width_m": WIDTH, "camera_wall_m": 11.2},
             "N": {"standpoint": {"x": 9.6, "y": 1.6}, "wall_line": 6.4,
                   "wall_width_m": WIDTH, "camera_wall_m": 4.8},
             "S": {"standpoint": {"x": 9.6, "y": 4.8}, "wall_line": 0.0,
                   "wall_width_m": WIDTH, "camera_wall_m": 4.8}}},
    ],
    "openings": [{"id": "way", "kind": "open_edge", "floor": "below",
                  "axis": "EW", "joins": ["near", "far"],
                  "rect": {"x0": 6.4, "x1": 6.4, "y0": 0.0, "y1": 6.4}}],
}

#: One colour per source painting per surface. The red channel names the
#: painting, the green the surface, so a probe reads back as a pair.
PAINTINGS = {"far/E": 10, "near/N": 20, "near/S": 30, "far/N": 40}
SURFACE = {"wall": 100, "floor": 120, "ceiling": 140, "left": 160, "right": 180}


def meta_for(loc, f):
    """The canonical meta a painting of this facing answers to."""
    fc = PLAN["rooms"][0 if loc == "near" else 1]["facings"][f]
    ppm = dv.FOCAL_PX / fc["camera_wall_m"]
    return {
        "image_h_px": dv.H,
        "horizon_y": dv.HORIZON_Y,
        "px_per_m_at_wall": ppm,
        "floor_line_y": (dv.HORIZON_Y * dv.H + dv.DRAWING_EYE_M * ppm) / dv.H,
        "corner_x0_px": dv.W / 2.0 - (WIDTH / 2.0) * ppm,
        "corner_x1_px": dv.W / 2.0 + (WIDTH / 2.0) * ppm,
        "wall_width_m": WIDTH,
        "camera_wall_m": fc["camera_wall_m"],
        "storey_height_m": STOREY,
    }


def painting_for(loc, f):
    """A painting flat per surface, cut by that camera's own five-plane box."""
    key = "%s/%s" % (loc, f)
    room = dv.room_of(PLAN, loc)
    cam = dv.source_camera(PLAN, room, f, meta_for(loc, f))
    box = cam.box(*dv.across_span(room["rect"], f))
    ys, xs = np.mgrid[0:dv.H, 0:dv.W].astype(np.float64)
    idx, _, _ = snap.assign(box, xs, ys)
    rgb = np.zeros((dv.H, dv.W, 3), dtype=np.uint8)
    for i, r in enumerate(snap.REGIONS):
        m = idx == i
        rgb[m] = (PAINTINGS[key], SURFACE[r], 200)
    return rgb


def sources(roles=("far", "left", "right")):
    out = {}
    if "far" in roles:
        out["far"] = ("far", "E", meta_for("far", "E"), painting_for("far", "E"))
    if "left" in roles:
        out["left"] = ("near", "N", meta_for("near", "N"), painting_for("near", "N"))
    if "right" in roles:
        out["right"] = ("near", "S", meta_for("near", "S"), painting_for("near", "S"))
    return out


def probe(frame, x, y):
    """The (painting, surface) pair a pixel came from."""
    px = np.round(frame[y, x]).astype(int)
    return int(px[0]), int(px[1])


PAINT_BY_ID = {v: k for k, v in PAINTINGS.items()}
SURF_BY_ID = {v: k for k, v in SURFACE.items()}


def named(pair):
    return (PAINT_BY_ID.get(pair[0], pair[0]), SURF_BY_ID.get(pair[1], pair[1]))


class DetectionTest(unittest.TestCase):

    def test_deep_facing_is_the_one_whose_wall_line_crosses_the_edge(self):
        near = dv.room_of(PLAN, "near")
        far = dv.room_of(PLAN, "far")
        self.assertTrue(dv.is_deep(PLAN, near, "E"))
        self.assertTrue(dv.is_deep(PLAN, far, "W"))
        for f in ("N", "S", "W"):
            self.assertFalse(dv.is_deep(PLAN, near, f), f)
        self.assertEqual(dv.deep_facings(PLAN), [("near", "E"), ("far", "W")])

    def test_the_walk_crosses_the_open_edge_once(self):
        cells, edges = dv.walk_open_edges(PLAN, dv.room_of(PLAN, "near"), "E")
        self.assertEqual([c["id"] for c in cells], ["near", "far"])
        self.assertEqual(edges, [6.4])

    def test_side_facings_are_left_and_right_of_the_view(self):
        self.assertEqual(dv.side_facings("E"), ("N", "S"))
        self.assertEqual(dv.side_facings("W"), ("S", "N"))
        self.assertEqual(dv.side_facings("N"), ("W", "E"))
        self.assertEqual(dv.side_facings("S"), ("E", "W"))


class AssemblyTest(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.frame, cls.record = dv.assemble(PLAN, "near", "E", sources())

    def test_the_far_frame_lands_at_the_pinhole_ratio(self):
        k = 4.8 / 11.2
        self.assertAlmostEqual(self.record["k_camera"], k, places=12)
        # Consistent metas: the corner-to-corner scale IS the camera ratio.
        self.assertAlmostEqual(self.record["k_corners"], k, places=9)
        q = self.record["quads"]
        ppm = dv.FOCAL_PX / 11.2
        self.assertAlmostEqual(q["wall"]["tl"][0], dv.W / 2.0 - 3.2 * ppm, places=6)
        self.assertAlmostEqual(q["wall"]["tr"][0], dv.W / 2.0 + 3.2 * ppm, places=6)
        # The crossed edge at 4.8 m is the same wall's rectangle at 1/k.
        self.assertAlmostEqual(q["crossed_edge"]["tl"][0], dv.W / 2.0 - 3.2 * ppm / k,
                               places=5)
        self.assertAlmostEqual(self.record["t_edge"] if "t_edge" in self.record
                               else self.record["geometry"]["t_edge"], k, places=12)

    def test_the_wall_is_the_far_cells_own_wall(self):
        self.assertEqual(named(probe(self.frame, 768, 500)), ("far/E", "wall"))
        self.assertEqual(named(probe(self.frame, 500, 400)), ("far/E", "wall"))

    def test_beyond_the_edge_is_the_far_cells_own_ring(self):
        # x = 200 on the horizon row sits on the left plane at t = 0.515 > k.
        self.assertEqual(named(probe(self.frame, 200, 500)), ("far/E", "left"))
        self.assertEqual(named(probe(self.frame, 1340, 500)), ("far/E", "right"))

    def test_the_near_ring_is_the_near_cells_own_walls(self):
        # x = 40 is the left plane at t = 0.402 < k — nearer than the edge.
        self.assertEqual(named(probe(self.frame, 40, 500)), ("near/N", "wall"))
        self.assertEqual(named(probe(self.frame, 1500, 500)), ("near/S", "wall"))

    def test_the_near_floor_and_ceiling_come_from_the_side_they_lie_on(self):
        self.assertEqual(named(probe(self.frame, 400, 900)), ("near/N", "floor"))
        self.assertEqual(named(probe(self.frame, 1100, 900)), ("near/S", "floor"))
        self.assertEqual(named(probe(self.frame, 400, 40)), ("near/N", "ceiling"))
        self.assertEqual(named(probe(self.frame, 1100, 40)), ("near/S", "ceiling"))

    def test_the_record_names_its_sources_and_its_seam(self):
        self.assertEqual(self.record["far_cell"], "far")
        self.assertEqual(self.record["seam"]["feather_px"], 0)
        self.assertEqual(self.record["unassigned_px"], 0)
        self.assertEqual(sorted(s["role"] for s in self.record["sources"]),
                         ["far", "left", "right"])
        self.assertEqual(self.record["surfaces"]["wall"], ["far"])
        self.assertEqual(self.record["surfaces"]["near.left"], ["left"])

    def test_a_missing_side_is_recorded_as_a_fallback(self):
        frame, rec = dv.assemble(PLAN, "near", "E", sources(("far", "right")))
        why = [f for f in rec["fallbacks"] if f["surface"] == "near.left"]
        self.assertTrue(why, rec["fallbacks"])
        self.assertEqual(why[0]["fill"], "far_frame_edge")
        self.assertEqual(rec["missing_sources"], ["left"])
        # and the pixels there are the far frame extended, not black.
        self.assertEqual(probe(frame, 40, 500)[0], PAINTINGS["far/E"])

    def test_a_close_facing_is_refused(self):
        with self.assertRaises(dv.DeepRefusal):
            dv.assemble(PLAN, "near", "N", sources())


class SeamTest(unittest.TestCase):
    """The join at the crossed edge is a CUT, not a blend."""

    def setUp(self):
        flat = {}
        for role, (loc, f, c) in {"far": ("far", "E", 60),
                                  "left": ("near", "N", 90),
                                  "right": ("near", "S", 150)}.items():
            rgb = np.full((dv.H, dv.W, 3), c, dtype=np.uint8)
            flat[role] = (loc, f, meta_for(loc, f), rgb)
        self.frame, _ = dv.assemble(PLAN, "near", "E", flat)

    def test_no_pixel_of_the_seam_is_a_blend_of_the_two(self):
        row = np.round(self.frame[500, :, 0]).astype(int)
        self.assertEqual(sorted(set(row.tolist())), [60, 90, 150])
        # and the cut is where the geometry puts it: the left plane crosses
        # t = 4.8/11.2 at x = vx + (x0 - vx)/t.
        ppm = dv.FOCAL_PX / 11.2
        cut = dv.W / 2.0 + (-3.2 * ppm) / (4.8 / 11.2)
        first_far = int(np.argmax(row == 60))
        self.assertLessEqual(abs(first_far - cut), 1.0)


class DeterminismTest(unittest.TestCase):

    def test_the_same_inputs_give_the_same_bytes(self):
        a, ra = dv.assemble(PLAN, "near", "E", sources())
        b, rb = dv.assemble(PLAN, "near", "E", sources())
        self.assertTrue(np.array_equal(np.round(a).astype(np.uint8),
                                       np.round(b).astype(np.uint8)))
        self.assertEqual(json.dumps(ra, sort_keys=True),
                         json.dumps(rb, sort_keys=True))

    def test_the_candidate_id_is_its_inputs_and_its_geometry(self):
        root = tempfile.mkdtemp(prefix="deepview-")
        try:
            for loc, f in (("far", "E"), ("near", "N"), ("near", "S")):
                d = os.path.join(root, "backdrops", loc)
                os.makedirs(d, exist_ok=True)
                Image.fromarray(painting_for(loc, f)).save(
                    os.path.join(d, "%s.png" % f))
                with open(os.path.join(d, "%s.meta.json" % f), "w") as fh:
                    json.dump(meta_for(loc, f), fh, sort_keys=True)
            png1, js1, rec1 = dv.derive(PLAN, "near", "E", root=root)
            png2, js2, rec2 = dv.derive(PLAN, "near", "E", root=root)
            self.assertEqual(png1, png2)
            self.assertTrue(os.path.basename(png1).startswith("row23-deep"))
            with open(png1, "rb") as fh1, open(png2, "rb") as fh2:
                self.assertEqual(fh1.read(), fh2.read())
            self.assertEqual(rec1["candidate_id"], rec2["candidate_id"])
            self.assertEqual(len(rec1["candidate_id"]), 8)
            self.assertEqual(sorted(i["role"] for i in rec1["inputs"]),
                             ["far", "left", "right"])
            self.assertTrue(js1.endswith(".deep.json"))
            with open(js1) as fh:
                self.assertEqual(json.load(fh)["candidate_id"], rec1["candidate_id"])
        finally:
            shutil.rmtree(root, ignore_errors=True)


if __name__ == "__main__":
    unittest.main()
