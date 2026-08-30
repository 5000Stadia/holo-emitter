"""THE INSTRUMENT'S IDENTITY. [Kabe, 2026-08-30]

A reading is a function of a frame's bytes AND of the code that read it. On
the hospital run a reader change was followed by a pass that re-promoted twelve
walls on cached readings, and a transient wrong reader left a warp record that
a later, correct pass reused: reception/E was pinned from row 739 where its
foot is at 764. Nothing in the tree said which instrument had produced what.

So every reading, warp record and round document carries `instrument`, this
digest of the files a reading depends on, and every consumer that would reuse
one asks `current(rec)` first. A record from another instrument is not this
instrument's record: it is re-taken, never trusted.
"""
import hashlib
import os

HERE = os.path.dirname(os.path.abspath(__file__))
#: The files a reading is a function of. Adding a reader here is the whole of
#: registering it.
FILES = ("measure.py", "row23_lib.py", "door_measure.py", "aperture_trace.py",
         "window_measure.py", "mesh_warp.py", "row35_snap.py",
         # the JS half of the instrument: what a wall's openings and brackets
         # ARE comes from these, and a fix there must re-route a latched wall
         "../../../tools/plan-projection.mjs", "../../../tools/promote-backdrop.mjs")


def _digest():
    h = hashlib.sha256()
    for f in FILES:
        p = os.path.join(HERE, f)
        if os.path.exists(p):
            h.update(open(p, "rb").read())
    return h.hexdigest()[:12]


INSTRUMENT_ID = _digest()


def stamp(rec):
    """Mark `rec` (a dict) as this instrument's. Returns it."""
    if isinstance(rec, dict):
        rec["instrument"] = INSTRUMENT_ID
    return rec


def current(rec):
    """Was `rec` produced by the instrument that is running now?"""
    return isinstance(rec, dict) and rec.get("instrument") == INSTRUMENT_ID
