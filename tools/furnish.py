#!/usr/bin/env python3
"""Fetch every asset a pack's furnishing manifest names and the library lacks — on demand,
per query, timed. Reads packs/<pack>/furnish.json ("fetch": id -> {query, dims_m, level}).

  venv/bin/python3 tools/furnish.py --pack office-1 [--redo]
"""
import argparse
import json
import os
import subprocess
import sys
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--pack", required=True); ap.add_argument("--redo", action="store_true"); ap.add_argument("--only", default="", help="comma-separated ids")
    a = ap.parse_args()
    F = json.load(open(os.path.join(ROOT, "packs", a.pack, "furnish.json")))
    log = {}; t0 = time.time()
    only = [x for x in a.only.split(",") if x]
    prev = json.load(open(os.path.join(ROOT, "packs", a.pack, "furnish-log.json"))) if os.path.exists(os.path.join(ROOT, "packs", a.pack, "furnish-log.json")) else {}
    for aid, spec in F["fetch"].items():
        out = os.path.join(ROOT, "library", aid)
        if only and aid not in only:
            log[aid] = prev.get(aid, {"status": "skipped"}); continue
        if os.path.exists(os.path.join(out, "model.glb")) and not a.redo and not only:
            log[aid] = {"status": "already"}; continue
        d = spec["dims_m"]
        r = subprocess.run([sys.executable, os.path.join(ROOT, "tools", "catalogue-fetch.py"), "--query", spec["query"], "--id", aid,
                            "--height-m", str(d["h"]), "--width-m", str(d["w"]), "--depth-m", str(d["d"]), "--level", spec.get("level", ""), "--pick", str(spec.get("pick", 0)),
                            "--must", spec.get("must", ""), "--avoid", spec.get("avoid", "")],
                           capture_output=True, text=True)
        line = [l for l in r.stdout.splitlines() if l.startswith("{")]
        log[aid] = json.loads(line[-1]) if line else {"ok": False, "why": r.stderr[-300:]}
        print(aid, log[aid].get("ok"), log[aid].get("name"), log[aid].get("license"), log[aid].get("timings_s", {}).get("request_to_library"), "s", flush=True)
    log["_total_s"] = round(time.time() - t0, 1)
    json.dump(log, open(os.path.join(ROOT, "packs", a.pack, "furnish-log.json"), "w"), indent=1)
    print("total", log["_total_s"], "s")


if __name__ == "__main__":
    main()
