"""The corpus, the emitted record's arrival shape, and adversarial inputs.

Three things live here that nothing else covers:

* **A durable witness for the row's own headline claim.** "Both 1660s desk
  generations pass matting and gates" is otherwise delivered by two manual
  invocations whose results live in a closing message. A later contract
  amendment could falsify it silently, and the artifact critic's own procedure —
  break what a check guards, confirm it goes red — cannot be applied to a claim
  with no check behind it.

* **Deserialization equivalence.** The record this row mints is what row 4's
  bake reads, and the shipped `tools/validate-fixtures.mjs` is what it has to
  survive. The test builds a *minimal* fixture in a temp directory and runs the
  shipped validator over it, so the validator's record-level clauses apply to
  this row's record with no coupling to the demo fixture's composition.

* **Adversarial inputs the gates' author did not construct.** Every other case
  in this suite is written by the same hand from the same reading, which is the
  failure the method's second mind exists to prevent. These perturb a corpus
  image mechanically — a shadow composited beneath it, a gamma shift, a
  downsample — and each names the verdict it expects, so the arm cannot be
  satisfied by an incidental failure.
"""

import json
import os
import subprocess
import tempfile
import unittest

import numpy as np
from PIL import Image

from replicator import contract as contract_mod
from replicator import maskgen
from replicator import pipeline as pipeline_mod
from replicator import record as record_mod

from . import support

MASKS = os.path.join(support.REPO_ROOT, "replicator", "masks")

DESKS = {
    "desk-corpus-2.png": dict(
        sprite_id="desk-joined-oak-1660", mask="desk-joined-oak-1660",
        anchors={"surface_top": (350, 235, 900, 275)}),
    "desk-corpus-1.png": dict(
        sprite_id="desk-corpus-1-check", mask="desk-corpus-1",
        anchors={"surface_top": (400, 320, 850, 360)}, slide={"dx": -0.03, "dy": 0.075,
                                                                  "scale_open": 1.04}),
}
DIMS = {"h": 0.78, "w": 1.30, "d": 0.55}

# The travel each desk can actually carry, found by looking at the composite and
# then bounded by the carcass-backing rule. Neither is a free parameter: on
# desk-corpus-2 exactly one value (0.08) satisfies both the clearance bound and
# the backing bound, and desk-corpus-1's LOWER drawer satisfies neither — its
# front is too tall for the space beneath it, so its part is the top-middle
# drawer, which has carcass under it all the way.
SLIDE = {"dx": -0.03, "dy": 0.08, "scale_open": 1.04}


def ingest_desk(name, source=None):
    spec = DESKS[name]
    src = source if source is not None else support.corpus_rgb(name)
    mask = np.array(Image.open(os.path.join(MASKS, spec["mask"], "drawer_front.png"))) >= 128
    return pipeline_mod.ingest_sprite(
        source_rgb=src, contract=support.contract(), sprite_id=spec["sprite_id"],
        noun="joined oak writing desk", archetype="sliding", attachment="floor_against",
        dims_m=DIMS, view_side="left", anchor_regions=spec["anchors"],
        part_specs=[{"id": "drawer_front", "mask": mask,
                     "slide": spec.get("slide", SLIDE), "source_rgb": src}])


@support.requires_corpus
class BothDesksPassMattingAndGates(unittest.TestCase):
    """The row's headline done clause, as a check rather than an account."""

    def test_the_teardrop_pull_desk(self):
        r = ingest_desk("desk-corpus-2.png")
        self.assertEqual(r.failures, [],
                         "desk-corpus-2 failed: %s" % [support.gate(r, g)["message"]
                                                       for g in r.failures])

    def test_the_wooden_knob_desk(self):
        r = ingest_desk("desk-corpus-1.png")
        self.assertEqual(r.failures, [],
                         "desk-corpus-1 failed: %s" % [support.gate(r, g)["message"]
                                                       for g in r.failures])

    def test_both_desks_meet_the_same_gate_set(self):
        a = {g["id"] for g in ingest_desk("desk-corpus-2.png").gates}
        b = {g["id"] for g in ingest_desk("desk-corpus-1.png").gates}
        self.assertEqual(a, b, "'both pass gates' has to mean the same gates for both")

    def test_the_light_warning_is_recorded_and_does_not_block(self):
        """Both generated desks measure well outside UL45. The gate is warn-only
        by blueprint §9.4's [HUMAN] text, so this is what the row hands forward:
        no automated check of the intention's 'one light' quality survives row 3
        on real art. See the row's closing report."""
        r = ingest_desk("desk-corpus-2.png")
        self.assertIn("e", r.warnings)
        self.assertLess(r.record["measured"]["light"]["third_tilt"], 2.0)
        self.assertFalse(r.record["measured"]["light"]["agrees_with_declared"])


@support.requires_corpus
class AdversarialInputsNobodyDesignedTheGatesAgainst(unittest.TestCase):
    def test_a_shadow_composited_under_a_good_desk_is_caught(self):
        """Expected verdict: gate (h) red. The perturbation is mechanical."""
        src = support.corpus_rgb("desk-corpus-2.png").astype(np.float64)
        h, w = src.shape[:2]
        y = np.arange(h)[:, None].astype(np.float64)
        x = np.arange(w)[None, :].astype(np.float64)
        r2 = (((y - 1120) / 90.0) ** 2 + ((x - w / 2.0) / 520.0) ** 2)
        src = src * (1.0 - 0.32 * np.clip(1.0 - r2, 0.0, 1.0))[..., None]
        result = ingest_desk("desk-corpus-2.png", np.clip(src, 0, 255).astype(np.uint8))
        self.assertIn("h", result.failures,
                      "a studio shadow welded to the silhouette must go red; every other "
                      "gate accepts it and gate (f) is rewarded by the widened footprint")

    def test_a_gamma_shift_moves_the_silhouette_by_less_than_a_pixel_in_a_hundred(self):
        """Expected verdict: the same gate verdicts, and a silhouette that barely
        moves.

        This is the perturbation that must NOT break anything, and the claim is
        deliberately a bounded one rather than exact invariance: a gamma curve
        genuinely changes the distances the matte measures, including the
        ground's own noise, so the computed tolerance moves a little and the
        silhouette with it. Measured at gamma 0.85 on the corpus desk: 3 px of
        914, or 0.33%. What would fail here is a matte keyed on absolute levels
        rather than on the image's own ground.
        """
        src = support.corpus_rgb("desk-corpus-2.png").astype(np.float64) / 255.0
        shifted = np.clip((src ** 0.85) * 255.0, 0, 255).astype(np.uint8)
        base = ingest_desk("desk-corpus-2.png")
        moved = ingest_desk("desk-corpus-2.png", shifted)
        self.assertEqual(moved.failures, base.failures,
                         "a tone curve must not change any gate's verdict")
        for axis in ("w", "h"):
            drift = abs(moved.record["px"][axis] - base.record["px"][axis])
            self.assertLessEqual(drift / base.record["px"][axis], 0.01,
                                 "silhouette %s moved %d px" % (axis, drift))

    def test_a_downsampled_desk_fails_the_resolution_gate_and_says_so(self):
        """Expected verdict: gate (c) red, and nothing else surprising."""
        src = support.corpus_rgb("desk-corpus-2.png")
        small = np.array(Image.fromarray(src).resize((313, 313), Image.LANCZOS))
        result = pipeline_mod.ingest_sprite(
            source_rgb=small, contract=support.contract(), sprite_id="small",
            noun="desk", archetype="static", attachment="floor_against",
            dims_m=DIMS, view_side="left")
        self.assertIn("c", result.failures)


@support.requires_corpus
class DeserializationEquivalence(unittest.TestCase):
    """The emitted record + PNGs, read back, are the shape row 2 bound."""

    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.mkdtemp(prefix="replicator-bound-")
        cls.result = ingest_desk("desk-corpus-2.png")
        cls.dir = os.path.join(cls.tmp, "library", cls.result.record["id"])
        os.makedirs(os.path.join(cls.dir, "parts"), exist_ok=True)
        Image.fromarray(cls.result.body, "RGBA").save(os.path.join(cls.dir, "sprite.png"))
        for pid, arr in cls.result.parts.items():
            Image.fromarray(arr, "RGBA").save(
                os.path.join(cls.dir, "parts", "%s.png" % pid))
        with open(os.path.join(cls.dir, "record.json"), "w", encoding="utf-8") as fh:
            fh.write(record_mod.to_json(cls.result.record))

    @classmethod
    def tearDownClass(cls):
        import shutil
        shutil.rmtree(cls.tmp, ignore_errors=True)

    def _bind(self):
        """Assemble the row-2 bound library shape from the files on disk."""
        with open(os.path.join(self.dir, "record.json")) as fh:
            rec = json.load(fh)
        images = {"body": np.array(Image.open(os.path.join(self.dir, "sprite.png"))),
                  "parts": {}, "states": {}}
        for part in rec.get("parts", []):
            images["parts"][part["id"]] = np.array(
                Image.open(os.path.join(self.dir, part["image"])))
        for name, entry in (rec.get("states_images") or {}).items():
            arr = np.array(Image.open(os.path.join(self.dir, entry["image"])))
            a = arr[..., 3]
            opaque = a >= 128
            rows = np.flatnonzero(opaque.any(axis=1))
            bottom = int(rows.max())
            band = opaque[max(0, bottom - 1):bottom + 1]
            cols = np.flatnonzero(band.any(axis=0))
            images["states"][name] = {
                "image": arr,
                "extent": {"x0": int(cols.min()) + entry["origin"]["x"],
                           "x1": int(cols.max()) + 1 + entry["origin"]["x"]}}
        return {"record": rec, "images": images}

    def test_image_keys_derive_from_the_record_never_beside_it(self):
        lib = self._bind()
        rec = lib["record"]
        self.assertEqual(sorted(lib["images"]["parts"]),
                         sorted(p["id"] for p in rec.get("parts", [])))
        self.assertEqual(sorted(lib["images"]["states"]),
                         sorted(rec.get("states_images") or {}))

    def test_px_base_and_footprint_are_what_the_written_pixels_say(self):
        """mechanisms.spec's clause, re-derived from the PNG on disk.

        `px` and `base.y` are pixel-identical. `footprint` and `base.x` are
        ground-contact quantities on generated three-quarter art — measured on
        this desk the bottom-two-rows extent is 27 px of 1144 while the real
        stance spans nearly the whole width — so the clause row 4 inherits is
        that the footprint CONTAINS the bottom-two-rows extent and lies inside
        the canvas, not that it equals it. See the [AI, row 3] note at
        blueprint §9.2.
        """
        lib = self._bind()
        rec = lib["record"]
        body = lib["images"]["body"]
        self.assertEqual(rec["px"], {"w": int(body.shape[1]), "h": int(body.shape[0])})
        opaque = body[..., 3] >= 128
        rows = np.flatnonzero(opaque.any(axis=1))
        bottom = int(rows.max())
        self.assertEqual(rec["anchors"]["base"]["y"], bottom + 1)
        band = opaque[max(0, bottom - 1):bottom + 1]
        cols = np.flatnonzero(band.any(axis=0))
        b2 = {"x0": int(cols.min()), "x1": int(cols.max()) + 1}
        fp = rec["anchors"]["footprint"]
        self.assertLessEqual(fp["x0"], b2["x0"])
        self.assertGreaterEqual(fp["x1"], b2["x1"])
        self.assertGreaterEqual(fp["x0"], 0)
        self.assertLessEqual(fp["x1"], rec["px"]["w"])

    def test_the_shipped_validator_accepts_this_record(self):
        """The real arrival test: the record row 4 will ship, through the
        validator the demo already runs.

        The fixture is minimal and authored here, staging this record alone —
        whether this record placed in the DEMO fixture's composition preserves
        that fixture's staged overlap spans is row 4's question, not row 3's,
        and a synthetic desk dimensioned to match the placeholder would pass by
        construction and witness nothing.
        """
        if not support.node_available():
            self.skipTest("node is not installed — the shipped validator cannot run")
        with open(os.path.join(self.dir, "record.json")) as fh:
            rec = json.load(fh)
        fixture = os.path.join(self.tmp, "fixture")
        os.makedirs(fixture, exist_ok=True)
        world = {
            "schema": "holo-emitter/0.1",
            "entities": {"desk1": {"sprite": rec["id"], "location": "study",
                                   "states": ["closed", "open"], "state": "closed"}},
            "relations": [],
            "knowledge": {"player": ["desk1"]},
            "topology": {"study": {"facings": ["N", "E", "S", "W"], "exits": {}}},
        }
        staging = {"schema": "holo-emitter-staging/0.1",
                   "placements": {"desk1": {"facing": "study/N", "u": 0.5,
                                            "attachment": "floor_against"}}}
        viewstate = {"location": "study", "facing": "N"}
        for name, payload in (("world.json", world), ("staging.json", staging),
                              ("viewstate.json", viewstate), ("narration.json", {})):
            with open(os.path.join(fixture, name), "w", encoding="utf-8") as fh:
                json.dump(payload, fh)
        script = (
            "const {validate} = await import(process.argv[1]);\n"
            "const fs = await import('node:fs');\n"
            "const recs = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));\n"
            "const out = validate(process.argv[2], {[recs.id]: recs});\n"
            "console.log(JSON.stringify(out));\n")
        proc = subprocess.run(
            ["node", "--input-type=module", "-e", script,
             os.path.join(support.REPO_ROOT, "tools", "validate-fixtures.mjs"),
             fixture, os.path.join(self.dir, "record.json")],
            capture_output=True, text=True, cwd=support.REPO_ROOT)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        findings = json.loads(proc.stdout.strip().splitlines()[-1])
        record_findings = [f for f in findings if f.startswith("records:")]
        self.assertEqual(record_findings, [],
                         "the shipped validator's record-level clauses must accept the "
                         "record this row mints:\n  " + "\n  ".join(record_findings))


if __name__ == "__main__":
    unittest.main()
