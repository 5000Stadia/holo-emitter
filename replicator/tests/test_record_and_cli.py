"""The emitted record, the contract that admitted it, and the thin CLI."""

import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest

import numpy as np
from PIL import Image

from replicator import contract as contract_mod
from replicator import ingest as cli
from replicator import maskgen
from replicator import record as record_mod
from replicator import synth

from . import support

REPO = support.REPO_ROOT


class Contract(unittest.TestCase):
    def test_the_shipped_contract_loads(self):
        ct = contract_mod.load()
        self.assertEqual(ct["schema"], "orientation-contract/0.1")
        for block in ("prompt_block", "negative_block", "style_block", "backdrop_block"):
            self.assertTrue(ct[block].strip(), "§10's %s must be present" % block)

    def test_every_gate_block_declares_an_authority_and_a_basis(self):
        ct = contract_mod.load()
        for name, block in ct["gates"].items():
            self.assertIn("authority", block, "gates.%s" % name)
            self.assertTrue(str(block.get("basis", "")).strip(), "gates.%s basis" % name)

    def test_an_observed_threshold_may_not_gate(self):
        """§A's rule, enforced rather than described.

        A threshold measured on the corpus is a measurement of the very artifacts
        it would judge, which is what §9.4 means by "a gate tuned until the
        corpus passes is no gate".
        """
        text = json.dumps({"schema": "s", "ingest_schema": "i", "camera": {}, "light": {},
                           "framing": {}, "prompt_block": "p", "negative_block": "n",
                           "style_block": "s", "backdrop_block": "b", "classes": {},
                           "_freeze": {"blocks": {"gates": {}, "ingest": {},
                                                  "backdrop_block": {}, "style_block": {}},
                                       "amendment": "x"},
                           "gates": {"alpha_opaque": {"value": 128, "authority": "observed",
                                                      "basis": "measured on the corpus"}},
                           "ingest": {}})
        with self.assertRaises(contract_mod.ContractError) as cm:
            contract_mod.parse(text)
        self.assertIn("observed", str(cm.exception))

    def test_a_missing_key_is_an_error_naming_it_not_a_default(self):
        with self.assertRaises(contract_mod.ContractError) as cm:
            contract_mod.parse('{"schema": "x"}')
        self.assertIn("ingest_schema", str(cm.exception))

    def test_the_freeze_scope_is_written_in_the_file(self):
        ct = contract_mod.load()
        blocks = ct["_freeze"]["blocks"]
        self.assertTrue(blocks["gates"]["frozen"])
        self.assertFalse(blocks["backdrop_block"]["frozen"])
        self.assertEqual(blocks["backdrop_block"].get("status"), "provisional",
                         "a look-bearing default must not become effective by silence")

    def test_the_identity_changes_when_a_threshold_changes(self):
        ct = contract_mod.load()
        before = contract_mod.identity(ct)
        ct["gates"]["resolution"]["min_content_height_px"] = 999
        after = contract_mod.identity(ct)
        self.assertNotEqual(before["thresholds_sha256"], after["thresholds_sha256"],
                            "a record must be traceable to the exact thresholds that "
                            "admitted it; a version string alone does not move")

    def test_the_vocabularies_have_one_home_and_cover_the_shipped_library(self):
        """The contract is the authority; placeholders.js is only cross-checked."""
        ct = contract_mod.load()
        vocab = ct["ingest"]["vocabularies"]
        self.assertIn("anchored", vocab["attachment"],
                      "the token row 2 minted for anchor-hosted takeables")
        if not support.node_available():
            self.skipTest("node is not installed — the placeholders cross-check cannot run")
        out = subprocess.run(
            ["node", "-e",
             "const{createRequire}=require('module');"
             "const r=createRequire(process.cwd()+'/x.js');"
             "const p=r('./src/placeholders.js');"
             "const recs=p.records||p.HOLO&&p.HOLO.placeholders.records;"
             "const a=new Set(),k=new Set();"
             "for(const id of Object.keys(recs)){a.add(recs[id].attachment);"
             "k.add(recs[id].archetype);}"
             "console.log(JSON.stringify({attachment:[...a],archetype:[...k]}));"],
            cwd=REPO, capture_output=True, text=True)
        self.assertEqual(out.returncode, 0, out.stderr)
        used = json.loads(out.stdout)
        for name in ("attachment", "archetype"):
            for token in used[name]:
                self.assertIn(token, vocab[name],
                              "the shipped library uses %s %r and the contract does not "
                              "list it" % (name, token))


class Record(unittest.TestCase):
    def test_the_field_set_is_blueprint_section_6(self):
        r = support.ingest(synth.clean_sprite())
        rec = r.record
        for key in ("schema", "id", "noun", "archetype", "attachment", "dims_m", "px",
                    "view_side", "light", "period", "anchors", "takeable", "airborne",
                    "provenance"):
            self.assertIn(key, rec)
        self.assertEqual(rec["schema"], "sprite/0.1")
        self.assertEqual(rec["provenance"]["tool"], "replicator-ingest-v1")

    def test_the_record_is_json_clean(self):
        r = support.ingest(synth.clean_sprite())
        text = record_mod.to_json(r.record)
        self.assertEqual(json.loads(text), r.record)

    def test_dims_are_the_operators_and_the_pixel_check_only_warns(self):
        r = support.ingest(synth.clean_sprite(), dims_m={"h": 0.8, "w": 3.0, "d": 3.0})
        self.assertEqual(r.record["dims_m"], {"h": 0.8, "w": 3.0, "d": 3.0},
                         "dims_m is never rewritten from the pixels: blueprint §5 says the "
                         "project camera is unsettled")
        cross = r.record["measured"]["dims_cross_check"]
        self.assertFalse(cross["agrees"], "and the disagreement is reported")
        self.assertEqual(r.failures, [], "but it never blocks")

    def test_a_non_positive_dimension_is_refused(self):
        with self.assertRaises(record_mod.RecordError):
            support.ingest(synth.clean_sprite(), dims_m={"h": 0.8, "w": 0.0, "d": 0.5})

    def test_unknown_vocabulary_tokens_are_refused(self):
        with self.assertRaises(Exception) as cm:
            support.ingest(synth.clean_sprite(), attachment="glued_on")
        self.assertIn("floor_against", str(cm.exception))

    def test_the_record_names_what_it_declares_but_nobody_measured(self):
        """Row 2's finding, generalized: `light` was declared as truth while the
        pixels said otherwise. Five other contract assertions are restated as
        fact by this record and are measured by nothing."""
        r = support.ingest(synth.clean_sprite())
        unwitnessed = r.record["declared_unwitnessed"]
        for key in ("camera.turn_deg", "camera.side", "camera.pitch_deg",
                    "framing.states", "framing.props"):
            self.assertIn(key, unwitnessed)

    def test_the_record_carries_measured_evidence_for_the_named_qualities(self):
        r = support.ingest(synth.legged_sprite())
        measured = r.record["measured"]
        self.assertIn("light", measured)     # quality 1, direction
        self.assertIn("chroma", measured)    # quality 1, temperature
        self.assertIn("contact", measured)   # quality 2
        self.assertIn("edge", measured)      # quality 4
        self.assertIn("geometry", measured)  # quality 5

    def test_two_runs_produce_the_same_record_bytes(self):
        a = support.ingest(synth.clean_sprite())
        b = support.ingest(synth.clean_sprite())
        self.assertEqual(record_mod.to_json(a.record), record_mod.to_json(b.record))

    def test_the_environment_is_recorded_so_determinism_is_scoped(self):
        r = support.ingest(synth.clean_sprite(),
                           environment={"python": "x", "numpy": "y", "pillow": "z"})
        self.assertEqual(r.record["provenance"]["environment"]["numpy"], "y")


class ThinCLI(unittest.TestCase):
    """The CLI adds nothing to the pipeline, and a test proves it."""

    def setUp(self):
        self.tmp = tempfile.mkdtemp(prefix="replicator-cli-")
        self.src = os.path.join(self.tmp, "src.png")
        Image.fromarray(synth.clean_sprite()).save(self.src)

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def _argv(self, *extra):
        return [self.src, "--id", "cli-ctl", "--noun", "control", "--archetype", "static",
                "--attachment", "floor_against", "--height-m", "0.8", "--width-m", "0.9",
                "--depth-m", "0.5", "--out", os.path.join(self.tmp, "library")] + list(extra)

    def test_the_cli_output_is_byte_identical_to_the_pure_pipeline(self):
        code = cli.main(self._argv())
        self.assertEqual(code, 0)
        written = os.path.join(self.tmp, "library", "cli-ctl", "sprite.png")
        pure = support.ingest(synth.clean_sprite(), sprite_id="cli-ctl", noun="control",
                              environment=cli.environment())
        buf = os.path.join(self.tmp, "pure.png")
        Image.fromarray(pure.body, "RGBA").save(buf)
        with open(written, "rb") as a, open(buf, "rb") as b:
            self.assertEqual(a.read(), b.read(),
                             "the CLI must add nothing to what the pure stage produced")

    def test_check_writes_nothing_and_still_reports_its_verdict(self):
        code = cli.main(self._argv("--check"))
        self.assertEqual(code, 0)
        self.assertFalse(os.path.exists(os.path.join(self.tmp, "library", "cli-ctl")))

    def test_a_failing_ingest_writes_nothing_into_the_library(self):
        bad = os.path.join(self.tmp, "halo.png")
        Image.fromarray(synth.negative_control_halo()).save(bad)
        argv = self._argv()
        argv[0] = bad
        code = cli.main(argv)
        self.assertEqual(code, cli.EXIT_CONTENT)
        self.assertFalse(os.path.exists(os.path.join(self.tmp, "library", "cli-ctl")),
                         "library/<id>/ is never left half-built")

    def test_the_report_survives_a_failure_because_the_lane_parses_it(self):
        bad = os.path.join(self.tmp, "halo.png")
        Image.fromarray(synth.negative_control_halo()).save(bad)
        report = os.path.join(self.tmp, "r.json")
        argv = self._argv("--report", report)
        argv[0] = bad
        cli.main(argv)
        self.assertTrue(os.path.exists(report),
                        "a failure report is the artifact the autonomous lane most needs")
        data = json.load(open(report))
        self.assertFalse(data["ok"])
        self.assertEqual(data["written"], [])

    def test_the_report_shape_is_what_the_asset_lane_keys_on(self):
        report = os.path.join(self.tmp, "r.json")
        cli.main(self._argv("--report", report))
        data = json.load(open(report))
        for key in ("tool", "contract", "environment", "id", "source", "written", "ok",
                    "exit_code", "gates", "warnings", "failures", "derived", "measured"):
            self.assertIn(key, data)
        for g in data["gates"]:
            for key in ("id", "severity", "passed", "measured", "threshold", "message"):
                self.assertIn(key, g)

    def test_a_light_warning_is_reported_as_a_warning_the_lane_can_branch_on(self):
        """`Where it goes`: "on gate-(e) light warnings: regenerate once, then flag".
        Exit 0 covers pass-with-warnings, so the lane can only see this here."""
        wrong = os.path.join(self.tmp, "ur.png")
        Image.fromarray(synth.lit_solid(direction="UR")).save(wrong)
        report = os.path.join(self.tmp, "r.json")
        argv = self._argv("--report", report)
        argv[0] = wrong
        code = cli.main(argv)
        self.assertEqual(code, 0)
        self.assertIn("e", json.load(open(report))["warnings"])

    def test_a_bad_invocation_exits_the_usage_code_not_the_content_code(self):
        argv = self._argv("--attachment", "glued_on")
        argv[argv.index("floor_against")] = "glued_on"
        self.assertEqual(cli.main(argv), cli.EXIT_USAGE)

    def test_a_malformed_contract_exits_the_contract_code(self):
        bogus = os.path.join(self.tmp, "contract.json")
        with open(bogus, "w") as fh:
            fh.write('{"schema": "x"}')
        self.assertEqual(cli.main(self._argv("--contract", bogus)), cli.EXIT_CONTRACT)

    def test_previews_are_written_outside_the_library(self):
        prev = os.path.join(self.tmp, "prev")
        cli.main(self._argv("--preview-dir", prev))
        self.assertTrue(os.listdir(prev))
        lib = os.path.join(self.tmp, "library", "cli-ctl")
        self.assertNotIn("preview.png", os.listdir(lib),
                         "blueprint §2 defines library/<id>/ as the shipped contents and "
                         "row 4's bake reads it")

    def test_a_re_ingest_with_fewer_parts_leaves_no_orphan(self):
        src, rect = synth.part_source()
        img = os.path.join(self.tmp, "part.png")
        Image.fromarray(src).save(img)
        mask_path = os.path.join(self.tmp, "mask.png")
        mask = maskgen.rect_mask((src.shape[1], src.shape[0]),
                                 rect["x0"], rect["y0"], rect["x1"], rect["y1"])
        maskgen.mask_to_image(mask).save(mask_path)
        argv = [img, "--id", "orphan", "--noun", "n", "--archetype", "sliding",
                "--attachment", "floor_against", "--height-m", "0.8", "--width-m", "0.9",
                "--depth-m", "0.5", "--out", os.path.join(self.tmp, "library"),
                "--part", "drawer_front:%s" % mask_path, "--slide", "-0.1,0.3,1.06"]
        self.assertEqual(cli.main(argv), 0)
        parts_dir = os.path.join(self.tmp, "library", "orphan", "parts")
        self.assertTrue(os.path.exists(parts_dir))
        argv2 = [img, "--id", "orphan", "--noun", "n", "--archetype", "static",
                 "--attachment", "floor_against", "--height-m", "0.8", "--width-m", "0.9",
                 "--depth-m", "0.5", "--out", os.path.join(self.tmp, "library")]
        self.assertEqual(cli.main(argv2), 0)
        self.assertFalse(os.path.exists(parts_dir),
                         "a part the new record does not name must not survive for row 4's "
                         "bake to find")


if __name__ == "__main__":
    unittest.main()
