"""Load and validate `replicator/contract.json`.

Pure once the bytes are in hand: `parse(text)` does the work and `load(path)`
is the only thing here that touches a file, so the stages can be driven from a
contract that arrived over a wire (blueprint §4b rule 1's live-ingestion shape).

The validation is deliberately unforgiving about two things:

* **every threshold block carries `authority` and `basis`.** A number with no
  citable derivation is a guess wearing a provenance claim, and the row's whole
  anti-tuning device rests on those strings being there to read.
* **there are no defaults.** A missing key is an error naming the key, never a
  fallback — a gate reading a default nobody pinned is the tuned gate wearing
  different clothes.
"""

import json
import os

CONTRACT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "contract.json")

REQUIRED_TOP = ("schema", "ingest_schema", "camera", "light", "framing",
                "prompt_block", "negative_block", "style_block", "backdrop_block",
                "gates", "ingest", "classes", "_freeze")

REQUIRED_GATES = ("alpha_opaque", "halo", "holes", "resolution", "state_diff",
                  "light", "contact", "over_matte", "shadow", "part_mask", "registration")

REQUIRED_INGEST = ("matte", "cavity", "thumb", "preview", "output", "period", "vocabularies")

AUTHORITIES = ("contract", "control", "observed")


class ContractError(ValueError):
    """The contract file cannot be trusted to run gates from."""


def _need(obj, key, where):
    if key not in obj:
        raise ContractError("%s is missing %r" % (where, key))
    return obj[key]


def _check_authority(block, where):
    """Every gate/ingest block declares where its numbers came from."""
    if "authority" not in block:
        raise ContractError("%s carries no `authority` — every threshold must declare whether "
                            "it follows from the contract, from a constructed control, or is "
                            "merely observed (an `observed` threshold may not gate)" % where)
    auth = block["authority"]
    parts = [p.strip() for p in str(auth).split("|")]
    for p in parts:
        if p not in AUTHORITIES:
            raise ContractError("%s declares authority %r — must be one or more of %s"
                                % (where, auth, ", ".join(AUTHORITIES)))
    if "observed" in parts:
        raise ContractError("%s declares authority `observed`, and an observed threshold may "
                            "not gate: it is a measurement of the very artifacts it would "
                            "judge. Report it instead." % where)
    if not str(block.get("basis", "")).strip():
        raise ContractError("%s carries no `basis` — name the construction or the derivation "
                            "the number came from" % where)


def parse(text):
    """Validate contract JSON text and return the dict. Pure."""
    try:
        data = json.loads(text)
    except ValueError as e:
        raise ContractError("contract.json is not valid JSON: %s" % e)
    if not isinstance(data, dict):
        raise ContractError("contract.json must hold a JSON object")

    for key in REQUIRED_TOP:
        _need(data, key, "contract.json")

    gates = data["gates"]
    for key in REQUIRED_GATES:
        _need(gates, key, "contract.json gates")
        block = gates[key]
        if not isinstance(block, dict):
            raise ContractError("contract.json gates.%s must be an object" % key)
        _check_authority(block, "contract.json gates.%s" % key)

    ingest = data["ingest"]
    for key in REQUIRED_INGEST:
        _need(ingest, key, "contract.json ingest")
    for key in ("cavity", "thumb", "preview", "output", "vocabularies"):
        _check_authority(ingest[key], "contract.json ingest.%s" % key)
    for key in ("tolerance_rule", "spatial_rule"):
        _need(ingest["matte"], key, "contract.json ingest.matte")
        _check_authority(ingest["matte"][key], "contract.json ingest.matte.%s" % key)
    _need(ingest["matte"], "feather_px", "contract.json ingest.matte")

    alpha = gates["alpha_opaque"]["value"]
    if not (0 < int(alpha) <= 255):
        raise ContractError("contract.json gates.alpha_opaque.value must be in 1..255")

    for name in ("attachment", "archetype"):
        vals = _need(ingest["vocabularies"], name, "contract.json ingest.vocabularies")
        if not (isinstance(vals, list) and vals and all(isinstance(v, str) for v in vals)):
            raise ContractError("contract.json ingest.vocabularies.%s must be a list of "
                                "strings" % name)

    freeze = data["_freeze"]
    _need(freeze, "blocks", "contract.json _freeze")
    _need(freeze, "amendment", "contract.json _freeze")
    for block in ("gates", "ingest", "backdrop_block", "style_block"):
        _need(freeze["blocks"], block, "contract.json _freeze.blocks")

    return data


def load(path=CONTRACT_PATH):
    """Read and validate the contract from disk. The one impure call here."""
    try:
        with open(path, "r", encoding="utf-8") as fh:
            text = fh.read()
    except OSError as e:
        raise ContractError("cannot read %s: %s" % (path, e))
    return parse(text)


def identity(contract):
    """What a record cites to say which thresholds admitted it.

    A version string alone is not enough: the `classes` amendment path moves
    numbers without bumping `ingest_schema`, and every record emitted before an
    amendment would go on claiming conformance to a contract that has changed.
    So the identity carries a digest of the blocks that actually decide
    pass/fail, and a record can be traced to the exact threshold set.
    """
    import hashlib
    payload = json.dumps({"gates": contract["gates"], "ingest": contract["ingest"],
                          "classes": contract["classes"]},
                         sort_keys=True, separators=(",", ":")).encode("utf-8")
    return {
        "schema": contract["schema"],
        "ingest_schema": contract["ingest_schema"],
        "thresholds_sha256": hashlib.sha256(payload).hexdigest()[:16],
    }


def for_class(contract, block_path, object_class=None):
    """A gate/ingest block, with any per-class override applied.

    `classes` is the amendment path §3.1 of the row-3 plan defines: a threshold
    may be extended for an object class no constructed control covered, when a
    control of that class lands in the same commit. It may never be moved
    because a real arriving image failed.
    """
    node = contract
    for part in block_path.split("."):
        node = node[part]
    out = dict(node)
    override = contract.get("classes", {}).get(object_class or "", {})
    for part in block_path.split("."):
        if not isinstance(override, dict):
            override = {}
            break
        override = override.get(part, {})
    if isinstance(override, dict):
        out.update(override)
    return out
