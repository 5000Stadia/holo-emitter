#!/usr/bin/env python3
"""THE WARP EXIT — `route_exit`'s one door, on a synthetic wall in a temp dir.

    python3 design/plan-draft/measured/test_warp_exit.py

WHAT IS BEING ASSERTED, and each case is one sentence of the ruling that made
this route ("sensor, not judge"; correct, don't re-ask):

    a held wall goes out through `exit: warped` — the candidate is warped, the
        WARPED frame is re-measured into the `meshwarp` round, and the promotion
        is on the DECLARED camera with the warp's own record attached, because
        the painting was moved onto that camera rather than excused for missing
        it;
    the record is not a flag: pins, residuals, worst segment and revealed px
        reach the document the promotion reads, and the run state carries them
        beside `exit`/`exit_reason`;
    a warp REFUSAL re-asks, and only a warp refusal does — one of the three
        content misses `mesh_warp.py` names, carried as the correction with its
        clause, because a repaint is the one thing that can answer "the plan
        rules a door here and the painting shows none";
    `--legacy-exits` still routes through row 35's snap, untouched.

THE SEAMS ARE STUBBED AND THE ROUTE IS NOT. `mesh_warp.warp_wall`, the
instrument's re-measure and `promote-backdrop.mjs` are stood in for — they are
covered by `test_mesh_warp.py` and by the suite — so that what runs here is
`row23_run.route_exit`, `_exit_warp` and `_warp_document`: which door the wall
leaves by, what is written where, and what the state says afterwards.
"""
import json
import os
import shutil
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

os.environ.setdefault("HOLO_TIMINGS", os.path.join(tempfile.gettempdir(),
                                                   "warp-exit-timings.jsonl"))

import row23_run as R                                            # noqa: E402
import mesh_warp                                                 # noqa: E402


def a_record(candidate):
    """What `mesh_warp.warp_wall` hands back on the plane path, in miniature."""
    return {
        "facing": "alpha/N", "candidate": candidate, "warp_mode": "plane",
        "verdict": "warped",
        "before": {"camera_verdict": "FAIL", "delta_focal_pct": -12.4,
                   "delta_eye_pct": 6.1, "hold_family": "camera-miss"},
        "columns": [{"name": "corner_left", "source": 60.0, "target": 48.0,
                     "residual_px": 0.0},
                    {"name": "door0_left", "source": 400.0, "target": 430.0,
                     "residual_px": 0.25},
                    {"name": "corner_right", "source": 960.0, "target": 976.0,
                     "residual_px": 0.0}],
        "rows": [{"name": "ceiling_line", "source": 100.0, "target": 90.0,
                  "residual_px": 0.0},
                 {"name": "floor_line", "source": 700.0, "target": 712.0,
                  "residual_px": 0.5}],
        "stretch": {"x_scale_min": 0.94, "x_scale_max": 1.12,
                    "y_scale_min": 0.99, "y_scale_max": 1.04,
                    "x_segments": [{"name": "corner_left..door0_left",
                                    "target_px": 382.0, "source_px": 340.0,
                                    "scale": 1.124},
                                   {"name": "door0_left..corner_right",
                                    "target_px": 546.0, "source_px": 560.0,
                                    "scale": 0.975}],
                    "y_segments": [{"name": "ceiling_line..floor_line",
                                    "target_px": 622.0, "source_px": 600.0,
                                    "scale": 1.037}],
                    "monotone": True, "folded_px": 0},
        "max_residual_px": 0.5, "revealed_px": 1841, "revealed_fraction": 0.002,
        "column_count": 3, "row_count": 2,
    }


class WarpExit(unittest.TestCase):

    def setUp(self):
        self.tmp = tempfile.mkdtemp(prefix="warp-exit-")
        self.calls = {"warp": [], "promote": [], "snap": []}
        self.saved = {k: getattr(R, k) for k in
                      ("ROOT", "HERE", "PLAN", "WARP_SOURCE_DIR",
                       "promote_document", "_exit_snap", "LEGACY_EXITS")}
        R.ROOT = self.tmp
        R.HERE = os.path.join(self.tmp, "measured")
        R.WARP_SOURCE_DIR = os.path.join(self.tmp, "backdrops", "source-warped")
        R.PLAN = os.path.join(self.tmp, "plan.json")
        os.makedirs(R.HERE, exist_ok=True)
        json.dump({"rooms": [], "floors": []}, open(R.PLAN, "w"))
        self.cand = "backdrops/source/alpha-N/roll.png"
        os.makedirs(os.path.dirname(os.path.join(self.tmp, self.cand)))
        open(os.path.join(self.tmp, self.cand), "wb").write(b"a painted wall")

        # THE SEAMS. Everything the route calls out to, and nothing it decides.
        self.mw = {k: getattr(mesh_warp, k) for k in ("warp_wall", "write_png")}
        mesh_warp.write_png = lambda p, arr: (
            os.makedirs(os.path.dirname(p), exist_ok=True),
            open(p, "wb").write(b"a corrected wall"))
        R.promote_document = self._promote
        R._exit_snap = lambda key, cand, reading: (
            self.calls["snap"].append(cand) or
            (True, "row 35 rectified this frame", {"candidate": cand}, None))
        R.LEGACY_EXITS = False
        self._patch_modules()

    def _patch_modules(self):
        """The three modules `_exit_warp` imports in-process, stood in for."""
        import types
        snap = types.ModuleType("row35_snap")
        snap.wall_context = lambda key: ({}, {"meta_used": {}}, {"cfg": True},
                                         {"ref": True}, {})
        snap.measure = lambda png, side, cfg, ref: {
            "verdict": "PASS", "delta_focal_pct": 1.2, "delta_eye_pct": -0.8,
            "px_per_m_at_wall": 180.0, "_promotion": {"hold_family": None}}
        doors = types.ModuleType("door_measure")
        doors.patch = lambda *a, **k: None
        wins = types.ModuleType("window_measure")
        wins.patch = lambda *a, **k: None
        self.saved_modules = {n: sys.modules.get(n) for n in
                              ("row35_snap", "door_measure", "window_measure")}
        sys.modules["row35_snap"] = snap
        sys.modules["door_measure"] = doors
        sys.modules["window_measure"] = wins
        self.saved_doc = R.row23_lib.promotion_doc if hasattr(R, "row23_lib") else None
        import row23_lib
        self.lib = row23_lib
        self.saved_promotion_doc = row23_lib.promotion_doc
        row23_lib.promotion_doc = lambda reading, side, ref, rnd, sha: (
            {"_round": rnd, "_source_sha256": sha,
             "_measured_px": {}, "px_per_m_at_wall": reading["px_per_m_at_wall"]},
            [])
        R.row23_lib = row23_lib

    def _promote(self, key, cand_rel, round_dir, camera_source=None):
        self.calls["promote"].append((key, cand_rel, round_dir, camera_source))
        return True, None

    def tearDown(self):
        for k, v in self.saved.items():
            setattr(R, k, v)
        for k, v in self.mw.items():
            setattr(mesh_warp, k, v)
        for n, mod in self.saved_modules.items():
            if mod is None:
                sys.modules.pop(n, None)
            else:
                sys.modules[n] = mod
        self.lib.promotion_doc = self.saved_promotion_doc
        shutil.rmtree(self.tmp, ignore_errors=True)

    def _warps(self, rec=None, refusal=None):
        def warp_wall(key, candidate, mode="plane", plan_path=None, **kw):
            self.calls["warp"].append((key, candidate))
            if refusal is not None:
                return None, dict(facing=key, candidate=candidate,
                                  verdict="refused", **refusal)
            return object(), (rec or a_record(candidate))
        mesh_warp.warp_wall = warp_wall

    def _held(self):
        return {"attempts": 2, "status": "held", "hold_family": "camera-miss",
                "correction": "draw 1.14x larger: 205.0 px/m at the wall plane"}

    # ---------------------------------------------------------------- the door

    def test_a_held_wall_leaves_through_the_warp_and_promotes(self):
        self._warps()
        st = self._held()
        ex, why = R.route_exit("alpha/N", {"key": "alpha/N"}, st, self.cand,
                               None, {"meta_used": {}}, {}, "camera-miss")
        self.assertEqual(ex, R.EXIT_WARPED)
        self.assertEqual(st["exit"], "warped")
        self.assertEqual(st["status"], "promoted")
        self.assertIn("declared camera", st["exit_reason"])
        # THE CORRECTION IS ANSWERED, not waived: the picture was corrected.
        self.assertNotIn("correction", st)
        self.assertIn("answered_correction", st)
        self.assertEqual(st["camera_source"], "declared")

        # THE PROMOTION IS OF THE WARPED FRAME, in the warp's own round, on the
        # declared camera.
        self.assertEqual(len(self.calls["promote"]), 1)
        key, cand, rnd, src = self.calls["promote"][0]
        self.assertEqual(rnd, R.WARP_ROUND)
        self.assertEqual(src, "declared")
        self.assertEqual(cand, "backdrops/source-warped/alpha-N/warped.png")
        self.assertTrue(os.path.exists(os.path.join(self.tmp, cand)))

    def test_the_record_reaches_the_document_and_the_state(self):
        self._warps()
        st = self._held()
        R.route_exit("alpha/N", {"key": "alpha/N"}, st, self.cand, None,
                     {"meta_used": {}}, {}, "camera-miss")
        doc = json.load(open(os.path.join(R.HERE, R.WARP_ROUND, "alpha-N.json")))
        self.assertEqual(doc["_round"], R.WARP_ROUND)
        w = doc["_warp"]
        for field in ("pins", "residuals", "worst_segment", "revealed_px"):
            self.assertIn(field, w)
        self.assertEqual(w["pins"], 5)                  # 3 columns + 2 rows
        self.assertEqual(w["residuals"]["max_px"], 0.5)
        self.assertEqual(w["worst_segment"]["name"], "corner_left..door0_left")
        self.assertEqual(w["revealed_px"], 1841)
        # AND THE SAME NUMBERS ON THE WALL'S OWN RECORD, so the ledger can say
        # what a wall's correction cost without opening the round.
        self.assertEqual(st["warp"]["residuals"]["max_px"], 0.5)
        self.assertEqual(st["warp"]["revealed_px"], 1841)
        # The warp's own record sits beside the picture it describes.
        beside = os.path.join(self.tmp, "backdrops", "source-warped", "alpha-N",
                              "warp.json")
        self.assertEqual(json.load(open(beside))["verdict"], "warped")

    # ------------------------------------------------------------- the re-ask

    def test_a_warp_refusal_re_asks_with_its_clause(self):
        self._warps(refusal={"clause": "meshwarp.aperture_count",
                             "why": ("content miss: the plan rules door 0 on "
                                     "alpha/N and the painting shows none of "
                                     "them")})
        st = self._held()
        ex, why = R.route_exit("alpha/N", {"key": "alpha/N"}, st, self.cand,
                               None, {"meta_used": {}}, {}, "camera-miss")
        self.assertEqual(ex, R.EXIT_GRID)
        self.assertEqual(st["status"], "held")          # the hold stands
        self.assertEqual(st["warp_refusal"]["clause"], "meshwarp.aperture_count")
        self.assertTrue(st["correction"].startswith("[meshwarp.aperture_count]"))
        self.assertIn("the painting shows none", st["correction"])
        self.assertEqual(self.calls["promote"], [])
        # NOTHING WAS LEFT BEHIND by an attempt that did not stand.
        self.assertFalse(os.path.exists(os.path.join(
            self.tmp, "backdrops", "source-warped", "alpha-N", "warped.png")))

    def test_a_failure_that_is_not_a_content_miss_does_not_buy_a_roll(self):
        """The promotion refusing is not a re-ask: a repaint would not fix it."""
        self._warps()
        R.promote_document = lambda *a, **k: (False, "the fixture refused it")
        st = self._held()
        ex, why = R.route_exit("alpha/N", {"key": "alpha/N"}, st, self.cand,
                               None, {"meta_used": {}}, {}, "camera-miss")
        self.assertEqual(ex, R.EXIT_GRID)
        self.assertNotIn("warp_refusal", st)
        self.assertEqual(st["correction"], self._held()["correction"])
        self.assertIn("the warp could not carry this wall", st["exit_reason"])

    # -------------------------------------------------------------- the legacy

    def test_legacy_exits_still_routes_through_the_snap(self):
        self._warps()
        st = self._held()
        ex, why = R.route_exit("alpha/N", {"key": "alpha/N"}, st, self.cand,
                               None, {"meta_used": {}}, {}, "camera-miss",
                               legacy=True)
        self.assertEqual(ex, R.EXIT_SNAPPED)
        self.assertEqual(st["exit"], "snapped")
        self.assertEqual(self.calls["warp"], [])       # the warp never ran
        self.assertEqual(self.calls["snap"], [self.cand])

    def test_the_module_flag_chooses_the_route_when_the_caller_does_not(self):
        self._warps()
        R.LEGACY_EXITS = True
        st = self._held()
        ex, _why = R.route_exit("alpha/N", {"key": "alpha/N"}, st, self.cand,
                                None, {"meta_used": {}}, {}, "camera-miss")
        self.assertEqual(ex, R.EXIT_SNAPPED)
        R.LEGACY_EXITS = False
        st2 = self._held()
        ex2, _why2 = R.route_exit("alpha/N", {"key": "alpha/N"}, st2, self.cand,
                                  None, {"meta_used": {}}, {}, "camera-miss")
        self.assertEqual(ex2, R.EXIT_WARPED)

    # -------------------------------------------------------------- once only

    def test_a_wall_is_not_routed_twice_on_the_same_candidate(self):
        self._warps()
        st = self._held()
        R.route_exit("alpha/N", {"key": "alpha/N"}, st, self.cand, None,
                     {"meta_used": {}}, {}, "camera-miss")
        ex, why = R.route_exit("alpha/N", {"key": "alpha/N"}, st, self.cand,
                               None, {"meta_used": {}}, {}, "camera-miss")
        self.assertEqual(ex, R.EXIT_GRID)
        self.assertIn("already routed", why)
        self.assertEqual(len(self.calls["warp"]), 1)
        # `--warp-held` asks for it anyway, which is what the flag is for.
        ex2, _ = R.route_exit("alpha/N", {"key": "alpha/N"}, st, self.cand,
                              None, {"meta_used": {}}, {}, "camera-miss",
                              force=True)
        self.assertEqual(ex2, R.EXIT_WARPED)
        self.assertEqual(len(self.calls["warp"]), 2)


if __name__ == "__main__":
    unittest.main(verbosity=2)
