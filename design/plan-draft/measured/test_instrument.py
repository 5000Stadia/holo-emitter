import json, os, tempfile, unittest
import instrument


class TheInstrumentIsNamed(unittest.TestCase):
    def test_a_stamped_record_is_current(self):
        self.assertTrue(instrument.current(instrument.stamp({})))

    def test_a_record_from_another_reader_is_not(self):
        self.assertFalse(instrument.current({"instrument": "000000000000"}))
        self.assertFalse(instrument.current({}))
        self.assertFalse(instrument.current(None))

    def test_the_warp_retakes_a_foreign_cached_reading(self):
        """mesh_warp.reading_for ignores a cached reading another reader took."""
        import mesh_warp
        d = tempfile.mkdtemp()
        old = mesh_warp.READINGS
        try:
            mesh_warp.READINGS = d
            json.dump({"_measured_px": {"wall_floor_line_y_px": 739}, "instrument": "stale"},
                      open(os.path.join(d, "abc.json"), "w"))
            calls = []
            real = mesh_warp.snap.measure
            mesh_warp.snap.measure = lambda *a, **k: calls.append(a) or {"_measured_px": {"wall_floor_line_y_px": 764}}
            try:
                r = mesh_warp.reading_for("backdrops/source/x/row23-abc.png", "x/N", {}, {}, {})
            finally:
                mesh_warp.snap.measure = real
            self.assertEqual(len(calls), 1, "a foreign reading is re-taken")
            self.assertEqual(r["_measured_px"]["wall_floor_line_y_px"], 764)
            self.assertTrue(instrument.current(r))
        finally:
            mesh_warp.READINGS = old


if __name__ == "__main__":
    unittest.main()
