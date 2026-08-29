#!/usr/bin/env python3
"""The pipeline's stopwatch — the python half of the writer. [Row 33]

[HUMAN, 2026-08-24, verbatim] "Lets track length of time for each step and ask
how can this be faster while maintaining quality"

One JSON object per line, appended to `design/plan-draft/measured/timings.jsonl`:

    {"ts_start": <epoch float>, "ts_end": <epoch float>,
     "step": "<name>", "key": <string|null>, "detail": {...}}

WHY A LINE AND A SINGLE `write()`. The sweep, the emitter, the bakes and the
publish can all be in flight at once — the run this ledger exists to measure was
a parallel one by design ("all assets created few turns each to full
completion") — so the writer must be safe under concurrent processes without a
lock, because a lock is a place a stopwatch can hang the thing it is timing. A
single `write()` of at most PIPE_BUF bytes to a file opened `O_APPEND` is
atomic on Linux: two processes cannot interleave inside one line and neither can
overwrite the other's offset. That is the whole concurrency design, and it is
why `detail` is truncated to fit rather than allowed to grow past the limit.

WHY NOTHING HERE CAN TAKE A STEP DOWN. This is apparatus, and production law
clause 5 gives apparatus no standing to break the work it measures. Every write
is guarded: a failure prints one line to stderr and the pipeline continues. A
run that lost its timings is a run with a gap in the ledger; a run that died
because the stopwatch could not open a file is a defect this file authored.

MARKERS. A backfilled record can know WHEN a step landed and not HOW LONG it
took (a git commit timestamp is all a bake left behind). Those are written with
`ts_end == ts_start` and a `detail.derivation` sentence, and the analyzer counts
them as activity but never as a duration. So that a real measurement can never
be mistaken for one, a live record's `ts_end` is clamped to at least
`ts_start + 1 microsecond`.

The ledger path is `HOLO_TIMINGS` when that is set (the tests point it at a
temp file; the pipeline leaves it unset), else the repository's own ledger.
`HOLO_TIMINGS=off` silences the writer entirely.
"""
import json
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))

#: The one home for the ledger's path, shared with `tools/timings.mjs` and
#: `timings_report.py` by construction rather than by three copies of a string.
DEFAULT_LEDGER = os.path.join(HERE, "timings.jsonl")

#: A single `write()` is atomic under O_APPEND up to this many bytes. Records
#: are truncated to stay under it; a torn line would be worse than a short one.
PIPE_BUF = 4096

#: Room for the closing brace of the truncation note itself.
_TRUNC_MARGIN = 220


def ledger_path():
    """Where records go. `HOLO_TIMINGS` wins; "off" disables the writer."""
    env = os.environ.get("HOLO_TIMINGS")
    if env is None or env == "":
        return DEFAULT_LEDGER
    if env == "off":
        return None
    return env


def _line(rec):
    """One line of JSON, small enough that the kernel writes it whole.

    Truncation eats `detail` and never the four fields the analyzer reads, so a
    record can lose its notes and can never lose its clock.
    """
    line = json.dumps(rec, separators=(",", ":"), sort_keys=True, default=str) + "\n"
    if len(line.encode("utf-8")) <= PIPE_BUF:
        return line
    small = dict(rec)
    small["detail"] = {"_truncated": "detail dropped: the record did not fit in one "
                                     "atomic write (%d bytes)" % len(line.encode("utf-8"))}
    line = json.dumps(small, separators=(",", ":"), sort_keys=True, default=str) + "\n"
    if len(line.encode("utf-8")) <= PIPE_BUF:
        return line
    # The key itself is the overflow. Keep the clock and the step name.
    small["key"] = None
    small["detail"] = {"_truncated": "detail and key dropped to fit one atomic write"}
    return json.dumps(small, separators=(",", ":"), sort_keys=True, default=str) + "\n"


# [clause 12, 2026-08-28] MEASURE TRANSITIONS, NOT POLLS. The sweep re-visits
# every wall every pass and re-records the same verdict for walls that did not
# move: 2,138 of every 50 sampled records were `promote.wall` repeats and the
# ledger reached 71 MB (~950 rows per image made). For the per-pass steps below
# a record is written only when its detail CHANGES from the last one written for
# the same (step, key) in this process; the first sighting always lands.
_TRANSITION_ONLY = {"promote.wall", "promote.backdrop", "park.wall", "validate.sweep",
                    "bake.sweep", "derive.sweep", "sweep.pass", "baton.stalled"}
_last_detail = {}


def record(step, ts_start, ts_end, key=None, detail=None, backfilled=False,
           path=None):
    """Append one step event. Never raises."""
    p = path if path is not None else ledger_path()
    if p is None:
        return None
    if not backfilled and str(step) in _TRANSITION_ONLY:
        try:
            sig = json.dumps(detail or {}, sort_keys=True, default=str)
        except Exception:
            sig = repr(detail)
        if _last_detail.get((str(step), key)) == sig:
            return None
        _last_detail[(str(step), key)] = sig
    if not backfilled and ts_end <= ts_start:
        # A live step is never a marker. See the header.
        ts_end = ts_start + 1e-6
    rec = {"ts_start": round(float(ts_start), 6), "ts_end": round(float(ts_end), 6),
           "step": str(step), "key": key, "detail": detail or {}}
    if backfilled:
        rec["backfilled"] = True
    try:
        d = os.path.dirname(p)
        if d:
            os.makedirs(d, exist_ok=True)
        fd = os.open(p, os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o644)
        try:
            os.write(fd, _line(rec).encode("utf-8"))
        finally:
            os.close(fd)
    except Exception as exc:                                  # pragma: no cover
        print("timings: could not write %s (%s) — the step ran, the clock did not"
              % (p, exc), file=sys.stderr)
    return rec


class step(object):
    """Context manager: time a block and record it however it ends.

        with timings.step("measure.candidate", key="great_hall/N") as s:
            d = measure(...)
            s.detail["verdict"] = d["verdict"]

    A raising block still records, with `detail.error` naming the exception —
    the slowest steps in a pipeline are often the ones that fail.
    """

    def __init__(self, name, key=None, path=None, **detail):
        self.name = name
        self.key = key
        self.path = path
        self.detail = dict(detail)
        self.ts_start = None
        self.ts_end = None

    def __enter__(self):
        self.ts_start = time.time()
        return self

    def __exit__(self, exc_type, exc, tb):
        self.ts_end = time.time()
        if exc is not None:
            self.detail["error"] = "%s: %s" % (exc_type.__name__, exc)
        record(self.name, self.ts_start, self.ts_end, self.key, self.detail,
               path=self.path)
        return False
