#!/usr/bin/env python3
"""One timings record, from a shell script. [Row 33]

    tools/timings_note.py <step> <ts_start-epoch> '<detail-json>'

`tools/publish-site.sh` is the only step of the pipeline written in bash, and a
heredoc that imports the writer inline is a second copy of the writer. This is
the thin shim that keeps the record shape in one place. `HOLO_NOTE_ROOT` names
the checkout, because the publish script runs from the repository root and the
writer lives four directories in.
"""
import json
import os
import sys
import time

ROOT = os.environ.get("HOLO_NOTE_ROOT") or os.path.abspath(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
sys.path.insert(0, os.path.join(ROOT, "design", "plan-draft", "measured"))

import timings                                            # noqa: E402


def main(argv):
    if len(argv) < 3:
        print("usage: timings_note.py <step> <ts_start> [detail-json]", file=sys.stderr)
        return 2
    try:
        detail = json.loads(argv[3]) if len(argv) > 3 and argv[3] else {}
    except Exception as exc:
        detail = {"_unparsed_detail": argv[3][:300], "_why": str(exc)}
    timings.record(argv[1], float(argv[2]), time.time(), key=None, detail=detail)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
