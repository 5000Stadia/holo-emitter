"""Shared helpers for the replicator's tests. No assertions live here."""

import os
import unittest

import numpy as np

from replicator import contract as contract_mod
from replicator import matte as matte_mod
from replicator import pipeline as pipeline_mod

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CORPUS = os.path.join(REPO_ROOT, "library-src", "corpus")

BASE = dict(sprite_id="ctl", noun="control object", archetype="static",
            attachment="floor_against", dims_m={"h": 0.8, "w": 0.9, "d": 0.5},
            view_side="left", takeable=False)


def contract():
    return contract_mod.load()


def ingest(src, **kw):
    """Run the pure pipeline on a constructed source with control defaults."""
    args = dict(BASE)
    args.update(kw)
    return pipeline_mod.ingest_sprite(source_rgb=src, contract=contract(), **args)


def matte_of(src, ct=None):
    """Stage 1 alone, with the contract's own per-image rules."""
    ct = ct or contract()
    return pipeline_mod._matte_one(src, ct)[0]


def gate(result, gate_id):
    for g in result.gates:
        if g["id"] == gate_id:
            return g
    raise AssertionError("no gate %r in %s" % (gate_id, [g["id"] for g in result.gates]))


def corpus_path(name):
    return os.path.join(CORPUS, name)


def corpus_rgb(name):
    from PIL import Image
    return np.array(Image.open(corpus_path(name)).convert("RGB"))


def requires_corpus(test):
    """The corpus is committed; skip loudly rather than silently if it is not."""
    return unittest.skipUnless(
        os.path.isdir(CORPUS) and os.listdir(CORPUS),
        "library-src/corpus/ is missing — this suite's corpus arm cannot run")(test)


def node_available():
    import shutil
    return shutil.which("node") is not None
