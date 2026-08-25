#!/usr/bin/env python3
"""Row 42 — the window detector, on frames whose answer is known.

    python3 design/plan-draft/measured/test_window_measure.py

WHY SYNTHETIC FRAMES AND NOT THE CORPUS. The corpus is the CALIBRATION and it
lives in `window_calibration.json`: 33 of the 41 windows the plan rules on
promoted walls, paired, at a median centre distance of 0.635 m. What a
calibration cannot do is go red on a change, because every one of those numbers
is a fact about paintings nobody can re-make. These frames can: each is drawn
here from three parameters, each has exactly one right answer, and the three
together are the discrimination the row asked for —

    a leaded window       must be FOUND, at the columns it was drawn at
    a wall with none      must yield nothing
    a plain BRIGHT panel  must yield nothing, and this is the case the whole
                          lattice test exists for: it is as bright as the
                          window and it is not one

THE THIRD IS THE ONE THAT MATTERS. Brightness alone cannot separate a window
from a lit wall — measured over the store, a bright piece of wall lifts up to
85 above its own median and a window lifts from 54 — so if the lattice test
were deleted or inverted this case is what goes red.
"""
import os
import sys
import unittest

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import window_measure as W                                        # noqa: E402

#: The frames every case is drawn on: the corpus's own canvas, so the detector
#: is handed exactly the shape it is handed in production (`measure_lib.load`
#: asserts it).
W_PX, H_PX = 1536, 1024
PPM = 150.0
FLOOR_Y = 700.0
WALL_L = 40.0            # a dark oak-panelled wall, at the corpus's low end


def _frame(tmp, name, panels):
    """A wall, with `panels` painted on it. Each panel is a dict:

        x0, x1     columns
        lum        its luminance
        lattice    the quarry pitch in px, or None for a flat panel
    """
    a = np.full((H_PX, W_PX, 3), WALL_L, np.float64)
    # a little wall texture, so "no fine edges at all" is never the reason a
    # flat panel is rejected — it has to be rejected for having no PERIOD.
    rng = np.random.default_rng(7)
    a += rng.normal(0.0, 6.0, a.shape)
    y0 = int(FLOOR_Y - 2.10 * PPM)
    y1 = int(FLOOR_Y - 0.80 * PPM)
    for p in panels:
        a[y0:y1, p["x0"]:p["x1"], :] = p["lum"]
        if p.get("lattice"):
            # DIAMOND QUARRIES, which is what §11's leaded lights are and what
            # the corpus paints: two families of diagonal cames. Drawn diagonal
            # rather than as a square grid on purpose — an upright came would
            # darken a whole COLUMN, which no real leaded light does and which
            # would break the column statistic the detector is built on.
            q = p["lattice"]
            yy, xx = np.mgrid[y0:y1, p["x0"]:p["x1"]]
            came = (((xx + yy) % q) < 2) | (((xx - yy) % q) < 2)
            block = a[y0:y1, p["x0"]:p["x1"], :]
            block[came] = WALL_L * 0.6
            a[y0:y1, p["x0"]:p["x1"], :] = block
        else:
            a[y0:y1, p["x0"]:p["x1"], :] += rng.normal(0.0, 5.0,
                                                       (y1 - y0, p["x1"] - p["x0"], 3))
    path = os.path.join(tmp, name)
    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(path)
    return path


class WindowMeasure(unittest.TestCase):
    tmp = None

    @classmethod
    def setUpClass(cls):
        import tempfile
        cls._dir = tempfile.TemporaryDirectory()
        cls.tmp = cls._dir.name

    @classmethod
    def tearDownClass(cls):
        cls._dir.cleanup()

    def read(self, path):
        return W.measure_windows(path, 100, W_PX - 100, FLOOR_Y, PPM)

    # ------------------------------------------------------------------ found

    def test_a_leaded_window_is_found_where_it_was_drawn(self):
        png = _frame(self.tmp, "one.png",
                     [{"x0": 600, "x1": 810, "lum": 190.0, "lattice": 18}])
        found, note = self.read(png)
        self.assertEqual(len(found), 1, note)
        got = found[0]
        self.assertLess(abs(got["x0_px"] - 600), 12, got)
        self.assertLess(abs(got["x1_px"] - 810), 12, got)
        self.assertGreaterEqual(got["lattice"]["score"], W.LATTICE_MIN)
        self.assertGreaterEqual(got["lift"], W.ADMIT_LIFT)

    def test_two_windows_are_two_and_not_one(self):
        png = _frame(self.tmp, "two.png",
                     [{"x0": 400, "x1": 610, "lum": 190.0, "lattice": 18},
                      {"x0": 900, "x1": 1110, "lum": 190.0, "lattice": 18}])
        found, note = self.read(png)
        self.assertEqual(len(found), 2, note)
        self.assertLess(found[0]["x1_px"], found[1]["x0_px"])

    def test_the_lights_of_one_mullioned_window_are_one_window(self):
        """A stone mullion is not a wall, and the merge is what says so."""
        gap = int(0.10 * PPM)
        png = _frame(self.tmp, "mullion.png",
                     [{"x0": 600, "x1": 700, "lum": 190.0, "lattice": 18},
                      {"x0": 700 + gap, "x1": 800 + gap, "lum": 190.0, "lattice": 18}])
        found, note = self.read(png)
        self.assertEqual(len(found), 1, note)
        self.assertEqual(len(found[0]["lights"]), 2, found[0])
        self.assertGreater(found[0]["width_m"], 1.0)

    # ------------------------------------------------------------- not found

    def test_a_wall_with_no_window_yields_nothing(self):
        png = _frame(self.tmp, "blank.png", [])
        found, note = self.read(png)
        self.assertEqual(found, [], note)

    def test_a_plain_bright_panel_is_not_a_window(self):
        """THE CASE THE LATTICE TEST EXISTS FOR.

        The same rectangle, at the same luminance, with no came grid in it. It
        passes every brightness test the detector has and it must still be
        refused — a limewashed panel catching the light is not glass.
        """
        png = _frame(self.tmp, "panel.png",
                     [{"x0": 600, "x1": 810, "lum": 190.0, "lattice": None}])
        found, note = self.read(png)
        self.assertEqual(found, [], note)
        self.assertEqual(len(note["rejected"]), 1, note)
        self.assertIn("lattice", note["rejected"][0]["rejected"])
        # ...and it was bright enough to have been admitted on brightness alone,
        # so the case is discriminating rather than merely passing.
        self.assertGreaterEqual(note["rejected"][0]["lift"], W.ADMIT_LIFT)

    def test_a_dim_lattice_is_reported_rather_than_swallowed(self):
        """A window painted too dimly is a reading nobody can use, not silence."""
        png = _frame(self.tmp, "dim.png",
                     [{"x0": 600, "x1": 810, "lum": WALL_L + 25.0, "lattice": 18}])
        found, note = self.read(png)
        self.assertEqual(found, [], note)
        self.assertEqual(len(note["rejected"]), 1, note)
        self.assertIn("stands only", note["rejected"][0]["rejected"])

    # ------------------------------------------------------- the measured band

    def test_the_head_and_sill_are_the_painting_s_and_not_the_plan_s(self):
        """The plan's band bounds the SEARCH; the light's own edges answer.

        The panel is drawn from 2.10 m to 0.80 m, which is outside the plan's
        ruled 2.00/0.90 at both ends. A reading that returned the ruled band
        would put a casement sprite inside the painted frame with glass showing
        over and under it.
        """
        png = _frame(self.tmp, "tall.png",
                     [{"x0": 600, "x1": 810, "lum": 190.0, "lattice": 18}])
        found, note = self.read(png)
        self.assertEqual(len(found), 1, note)
        got = found[0]
        self.assertEqual(got["vertical"], "measured")
        self.assertGreater(got["head_m"], W.WINDOW_HEAD_M)
        self.assertLess(got["sill_m"], W.WINDOW_SILL_M)
        self.assertLess(abs(got["head_m"] - 2.10), 0.06, got)
        self.assertLess(abs(got["sill_m"] - 0.80), 0.06, got)

    def test_the_detector_is_told_no_width_to_look_for(self):
        """A window painted at half its ruled width reads at the width it was
        painted, so the guard downstream can see that it is wrong. A detector
        that knew the answer would find it."""
        png = _frame(self.tmp, "narrow.png",
                     [{"x0": 600, "x1": 705, "lum": 190.0, "lattice": 14}])
        found, note = self.read(png)
        self.assertEqual(len(found), 1, note)
        self.assertLess(found[0]["width_m"], 0.8)

    # ------------------------------------------------ the band it reads within

    def test_the_ruled_band_matches_the_one_the_asks_name(self):
        """ONE HOME, ASSERTED ACROSS THE LANGUAGE BOUNDARY.

        `tools/room-voices.mjs` owns the sill and the head; this file restates
        them because Python cannot import a `.mjs`. A restatement nobody checks
        is a second home, so it is checked here.
        """
        root = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
        with open(os.path.join(root, "tools", "room-voices.mjs")) as fh:
            src = fh.read()
        import re
        sill = float(re.search(r"WINDOW_SILL_M\s*=\s*([\d.]+)", src).group(1))
        head = float(re.search(r"WINDOW_HEAD_M\s*=\s*([\d.]+)", src).group(1))
        self.assertEqual((sill, head), (W.WINDOW_SILL_M, W.WINDOW_HEAD_M))


if __name__ == "__main__":
    unittest.main(verbosity=2)
