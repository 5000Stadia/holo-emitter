#!/usr/bin/env python3
"""Row 40 — can the consistency measure go red, and does it stay green?

    python3 design/plan-draft/measured/test_room_consistency.py

A measure that has only ever been run on the real corpus is a measure nobody
has seen fail. So this builds a SYNTHETIC store: one room whose facings are
painted from the same three materials, and the same room again with one
facing's ceiling swapped for a different material. The first must come out
consistent; the second must come out mismatched, must name the CEILING as the
band that disagrees, and must name the swapped facing as the outlier.

The materials are deterministic (seeded numpy) and are built to differ the way
real materials differ — in hue and in relative contrast — and NOT in brightness,
because brightness is the one axis the calibrated instrument deliberately
ignores. The third case checks that directly: the same material rendered a stop
darker on one facing must NOT read as a mismatch, which is the row-37 law
("light is a layer") asserted against the instrument rather than about it.
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

W, H = 1536, 1024
PPM = 160.0
STOREY = 2.8
FLOOR_Y = 0.72
CORNERS = (200, 1330)


def material(rng, rgb, contrast, shape):
    """A patch of a made-up material: a colour, and a grain at a given depth."""
    base = np.array(rgb, dtype=np.float64)
    noise = rng.normal(0.0, 1.0, shape[:2])
    # a coarse grain plus a fine one, so the Sobel energy is a real property
    coarse = np.repeat(np.repeat(rng.normal(0.0, 1.0, (shape[0] // 12 + 1,
                                                      shape[1] // 12 + 1)),
                                 12, axis=0), 12, axis=1)[:shape[0], :shape[1]]
    g = (0.7 * noise + 0.3 * coarse) * contrast
    out = base[None, None, :] * (1.0 + g[:, :, None])
    return np.clip(out, 2.0, 253.0)


MATERIALS = {
    # name:            (rgb,               contrast)
    "oak":             ((120.0, 78.0, 44.0), 0.16),
    "limeplaster":     ((196.0, 188.0, 170.0), 0.05),
    "darkjoists":      ((66.0, 50.0, 34.0), 0.34),
    "stone":           ((150.0, 146.0, 138.0), 0.10),
}


def paint(seed, ceiling, wall, floor, gain=1.0):
    """One synthetic facing: three materials stacked at the declared geometry."""
    rng = np.random.default_rng(seed)
    img = np.zeros((H, W, 3), dtype=np.float64)
    y_floor = FLOOR_Y * H
    y_ceil = y_floor - STOREY * PPM
    yc, yf = int(round(y_ceil)), int(round(y_floor))
    img[:yc] = material(rng, *MATERIALS[ceiling], shape=(yc, W))
    img[yc:yf] = material(rng, *MATERIALS[wall], shape=(yf - yc, W))
    img[yf:] = material(rng, *MATERIALS[floor], shape=(H - yf, W))
    return np.clip(img * gain, 1.0, 255.0).astype(np.uint8)


META = {
    "floor_line_y": FLOOR_Y, "px_per_m_at_wall": PPM, "storey_height_m": STOREY,
    "corner_x0_px": CORNERS[0], "corner_x1_px": CORNERS[1],
    "image_h_px": H, "facing_type": "enclosed", "horizon_y": 0.52,
    "measured_room": {"carriers": []}, "openings": []
}


def build(root, room, facings):
    """facings: {F: (ceiling, wall, floor, gain)}"""
    d = os.path.join(root, room)
    os.makedirs(d, exist_ok=True)
    for i, (f, spec) in enumerate(sorted(facings.items())):
        ceiling, wall, floor, gain = spec
        Image.fromarray(paint(1000 + i, ceiling, wall, floor, gain)).save(
            os.path.join(d, "%s.png" % f))
        with open(os.path.join(d, "%s.meta.json" % f), "w") as fh:
            json.dump(META, fh)


class RoomConsistency(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.root = tempfile.mkdtemp(prefix="holo-consistency-")
        os.environ["HOLO_BACKDROPS"] = cls.root
        import room_consistency
        cls.R = room_consistency
        cls.R.BACKDROPS = cls.root

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(cls.root, ignore_errors=True)
        os.environ.pop("HOLO_BACKDROPS", None)

    def audit(self, room):
        un = []
        r = self.R.audit_room(room, self.R.FACINGS, un)
        self.assertEqual(un, [], "no facing should have been unreadable")
        return r

    def test_same_materials_read_as_one_room(self):
        build(self.root, "same", {f: ("limeplaster", "oak", "oak", 1.0)
                                  for f in "NESW"})
        r = self.audit("same")
        self.assertEqual(r["verdict"], "consistent",
                         "four facings of one material set: %s" % r["why"])
        self.assertLess(r["score"], self.R.CUT)
        self.assertEqual(r["outliers"], [])

    def test_one_swapped_ceiling_reads_as_mismatched(self):
        spec = {f: ("limeplaster", "oak", "oak", 1.0) for f in "NESW"}
        spec["S"] = ("darkjoists", "oak", "oak", 1.0)      # the swap
        build(self.root, "swapped", spec)
        r = self.audit("swapped")
        self.assertEqual(r["verdict"], "mismatched", r["why"])
        self.assertEqual(r["worst_band"], "ceiling",
                         "the ceiling is what was swapped, so the ceiling must "
                         "be what is named: %s" % r["why"])
        self.assertEqual(r["outliers"], ["S"], r["why"])
        self.assertEqual(r["majority"], ["E", "N", "W"])
        self.assertFalse(r["no_majority"])

    def test_brightness_alone_is_not_a_mismatch(self):
        """Row 37, asserted against the instrument: light is a layer.

        The same three materials on every facing, one of them rendered at 60 per
        cent exposure. A human turning round sees one room in a shadow; an
        instrument that weighted brightness would call it a different room."""
        spec = {f: ("limeplaster", "oak", "oak", 1.0) for f in "NESW"}
        spec["W"] = ("limeplaster", "oak", "oak", 0.6)
        build(self.root, "dim", spec)
        r = self.audit("dim")
        self.assertEqual(r["verdict"], "consistent",
                         "a dimmer exposure is not a different material: %s" % r["why"])

    def test_an_even_split_reports_no_majority(self):
        """The master bedchamber's shape: two facings against two.

        There is no minority to re-ask, and the instrument must say so rather
        than pick one of the four by a hair."""
        spec = {"N": ("limeplaster", "oak", "oak", 1.0),
                "S": ("limeplaster", "oak", "oak", 1.0),
                "E": ("limeplaster", "stone", "oak", 1.0),
                "W": ("limeplaster", "stone", "oak", 1.0)}
        build(self.root, "split", spec)
        r = self.audit("split")
        self.assertEqual(r["verdict"], "mismatched", r["why"])
        self.assertTrue(r["no_majority"], r["why"])
        self.assertEqual(sorted(r["outliers"]), ["E", "N", "S", "W"])
        self.assertEqual([sorted(c) for c in r["clusters"]],
                         [["E", "W"], ["N", "S"]])

    def test_a_facing_with_no_geometry_is_reported_not_skipped(self):
        """Production law leaves no gate that cannot fail."""
        build(self.root, "lame", {f: ("limeplaster", "oak", "oak", 1.0)
                                  for f in "NES"})
        mp = os.path.join(self.root, "lame", "E.meta.json")
        m = json.load(open(mp))
        del m["storey_height_m"]
        json.dump(m, open(mp, "w"))
        un = []
        r = self.R.audit_room("lame", self.R.FACINGS, un)
        self.assertEqual(len(un), 1, "the crippled facing must be reported")
        self.assertEqual(un[0]["facing"], "E")
        self.assertIn("storey_height_m", un[0]["missing"])
        self.assertTrue(any("unmeasurable" in n for n in r["notes"]))


if __name__ == "__main__":
    unittest.main(verbosity=2)
