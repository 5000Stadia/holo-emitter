#!/usr/bin/env python3
"""On-demand, per-query retrieval with no bulk download on the client:

  Sketchfab public search (no key) -> shippable licence filter -> the uid's GLB from the Objaverse
  mirror on Hugging Face (a 20 MB uid->path map, cached once) -> stand -> gate -> library/<id>/

  venv/bin/python3 tools/catalogue-fetch.py --query "art deco side chair" --id chair-sf-1 \
      --height-m 0.88 --width-m 0.46 --depth-m 0.5 --level seat:0.45 [--pick 0] [--max-faces 150000]

Ranking: Sketchfab's own relevance, then our filters (licence CC0/CC-BY/CC-BY-SA, downloadable,
present in the mirror, face count under the cap). Deterministic for a given query and day.
"""
import argparse
import json
import os
import subprocess
import sys
import time
import urllib.parse
import urllib.request

import objaverse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHIP = {"CC Attribution", "CC Attribution-ShareAlike", "CC0 Public Domain", "CC0"}


def search(q, count=24):
    url = "https://api.sketchfab.com/v3/search?" + urllib.parse.urlencode({"type": "models", "q": q, "downloadable": "true", "count": count})
    return json.loads(urllib.request.urlopen(url, timeout=30).read())["results"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--query", required=True); ap.add_argument("--id", required=True)
    ap.add_argument("--height-m", type=float, required=True); ap.add_argument("--width-m", type=float, required=True); ap.add_argument("--depth-m", type=float, required=True)
    ap.add_argument("--level", default=""); ap.add_argument("--pick", type=int, default=0); ap.add_argument("--max-faces", type=int, default=150000)
    a = ap.parse_args()
    T = {"request": time.time()}
    hits = search(a.query); T["search"] = time.time()
    paths = objaverse._load_object_paths(); T["map"] = time.time()
    cands = [h for h in hits if (h.get("license") or {}).get("label") in SHIP and h["uid"] in paths and (h.get("faceCount") or 0) <= a.max_faces]
    if not cands:
        print(json.dumps({"ok": False, "why": "no shippable, mirrored candidate", "hits": len(hits)})); return 2
    h = cands[min(a.pick, len(cands) - 1)]
    glb = objaverse.load_objects([h["uid"]])[h["uid"]]; T["download"] = time.time()
    out = os.path.join(ROOT, "library", a.id); os.makedirs(out, exist_ok=True)
    py = sys.executable
    gr = subprocess.run([py, os.path.join(ROOT, "tools", "mesh-ground.py"), glb, os.path.join(out, "model.glb"), "--height-m", str(a.height_m), "--up", "+y", "--level", a.level,
                         "--front", "auto" if a.level.startswith("seat") else ""], capture_output=True, text=True)
    ground = json.loads(gr.stdout) if gr.stdout.strip().startswith("{") else {"ok": False, "why": gr.stderr[-300:]}
    T["stand"] = time.time()
    g = subprocess.run([py, os.path.join(ROOT, "tools", "mesh-gate.py"), os.path.join(out, "model.glb"), "--height-m", str(a.height_m), "--width-m", str(a.width_m), "--depth-m", str(a.depth_m),
                        "--max-tris", str(a.max_faces + 1000), "--aspect-tol", "0.8"], capture_output=True, text=True)
    gate = json.loads(g.stdout) if g.stdout.strip().startswith("{") else {"ok": False, "failures": [g.stderr[-200:]]}
    T["gate"] = time.time()
    rec = {"schema": "library-record/mesh/0.1", "id": a.id, "noun": a.query, "dims_m": {"h": a.height_m, "w": a.width_m, "d": a.depth_m},
           "model": {"kind": "glb", "up": "+y", "grounded": bool(ground.get("ok")), "front": "+z", "size_m": ground.get("size_m"), "source_faces": ground.get("faces")},
           "gate": gate, "grounding": ground, "level": a.level or None,
           "provenance": {"source": "sketchfab-search → objaverse-mirror", "uid": h["uid"], "name": h.get("name"), "author": (h.get("user") or {}).get("displayName"),
                          "license": (h.get("license") or {}).get("label"), "url": h.get("viewerUrl"), "query": a.query, "pick": a.pick, "candidates": len(cands), "hits": len(hits)},
           "timings_s": {k: round(T[k] - T[p], 1) for k, p in (("search", "request"), ("map", "search"), ("download", "map"), ("stand", "download"), ("gate", "stand"))} | {"request_to_library": round(T["gate"] - T["request"], 1)}}
    json.dump(rec, open(os.path.join(out, "record.json"), "w"), indent=1)
    print(json.dumps({"ok": gate.get("ok"), "id": a.id, "name": h.get("name"), "license": rec["provenance"]["license"], "faces": h.get("faceCount"), "candidates": len(cands), "of_hits": len(hits),
                      "size_kb": os.path.getsize(os.path.join(out, "model.glb")) // 1024, "wants": ground.get("wants"), "timings_s": rec["timings_s"]}))
    return 0 if gate.get("ok") else 2


if __name__ == "__main__":
    sys.exit(main())
