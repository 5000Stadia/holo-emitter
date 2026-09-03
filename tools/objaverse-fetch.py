#!/usr/bin/env python3
"""Retrieve a noun from Objaverse (LVIS subset) into the library, timed per stage.

  venv/bin/python3 tools/objaverse-fetch.py --category chair --query "art deco side chair wood upholstered" \
      --id chair-objaverse-1 --height-m 0.88 --width-m 0.46 --depth-m 0.5 --level seat:0.45 [--pick N]

Ranking is deterministic: candidates are the category's uids whose name/caption contain the
most query words, licence-filtered to CC0 / CC-BY, ties by uid; `--pick` chooses the Nth.
"""
import argparse
import json
import os
import subprocess
import sys
import time

import objaverse
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OK_LIC = ("by", "by-sa", "cc0")   # exact: no NC, no ND


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--category", required=True); ap.add_argument("--query", default="")
    ap.add_argument("--id", required=True); ap.add_argument("--height-m", type=float, required=True)
    ap.add_argument("--width-m", type=float, required=True); ap.add_argument("--depth-m", type=float, required=True)
    ap.add_argument("--level", default=""); ap.add_argument("--pick", type=int, default=0); ap.add_argument("--faces", type=int, default=24000)
    a = ap.parse_args()
    T = {"t_request": time.time()}
    lvis = objaverse.load_lvis_annotations(); uids = lvis.get(a.category, [])
    T["t_index"] = time.time()
    ann = objaverse.load_annotations(uids)
    T["t_annotations"] = time.time()
    words = [w.lower() for w in a.query.split()]
    want_wd = a.width_m / a.depth_m; want_wh = a.width_m / a.height_m
    scored = []
    for u in uids:
        m = ann.get(u, {}); lic = (m.get("license") or "").lower()
        if lic not in OK_LIC: continue
        text = ((m.get("name") or "") + " " + (m.get("description") or "") + " " + " ".join(t.get("name", "") for t in (m.get("tags") or []))).lower()
        hits = sum(w in text for w in words)
        # proportions from the uploader's own bounds, when present: a settee is wide and shallow, a sectional is square
        shape_pen = 0.0
        arch = m.get("archives") or {}
        dims = None
        for fmt in ("glb", "gltf", "usdz", "source"):
            if fmt in arch and arch[fmt].get("size") and m.get("dimensions"):
                break
        d = m.get("dimensions")
        if isinstance(d, dict) and all(k in d for k in ("width", "height", "depth")) and d["depth"] and d["height"]:
            try:
                wd, wh = float(d["width"]) / float(d["depth"]), float(d["width"]) / float(d["height"])
                shape_pen = abs(np.log(wd / want_wd)) + abs(np.log(wh / want_wh))
            except Exception:
                shape_pen = 0.0
        scored.append((-hits + shape_pen, u, m.get("name"), lic))
    scored.sort()
    if not scored:
        print(json.dumps({"ok": False, "why": "no licensed candidate"})); return 2
    score, uid, name, lic = scored[min(a.pick, len(scored) - 1)]
    T["t_ranked"] = time.time()
    paths = objaverse.load_objects([uid]); glb = paths[uid]
    T["t_downloaded"] = time.time()
    out = os.path.join(ROOT, "library", a.id); os.makedirs(out, exist_ok=True)
    py = sys.executable
    gr = subprocess.run([py, os.path.join(ROOT, "tools", "mesh-ground.py"), glb, os.path.join(out, "model.glb"), "--height-m", str(a.height_m), "--up", "+y", "--level", a.level, "--front", "auto" if a.level.startswith("seat") else ""], capture_output=True, text=True)
    ground = json.loads(gr.stdout) if gr.stdout.strip().startswith("{") else {"ok": False, "why": gr.stderr[-300:]}
    T["t_stood"] = time.time()
    # decimate if heavy (keeps textures only if the loader kept them; Objaverse GLBs are textured — trimesh keeps TextureVisuals on export)
    g = subprocess.run([py, os.path.join(ROOT, "tools", "mesh-gate.py"), os.path.join(out, "model.glb"), "--height-m", str(a.height_m), "--width-m", str(a.width_m), "--depth-m", str(a.depth_m), "--max-tris", "200000", "--aspect-tol", "0.8"], capture_output=True, text=True)   # a retrieved object has its own proportions: the gate only refuses a wrong CLASS of shape
    gate = json.loads(g.stdout) if g.stdout.strip().startswith("{") else {"ok": False, "failures": [g.stderr[-200:]]}
    T["t_gated"] = time.time()
    rec = {"schema": "library-record/mesh/0.1", "id": a.id, "noun": a.category, "dims_m": {"h": a.height_m, "w": a.width_m, "d": a.depth_m},
           "model": {"kind": "glb", "up": "+y", "grounded": bool(ground.get("ok")), "front": "+z", "source_faces": ground.get("faces"), "size_m": ground.get("size_m")},
           "gate": gate, "grounding": ground, "level": a.level or None,
           "provenance": {"source": "objaverse-lvis", "uid": uid, "name": name, "license": lic, "query": a.query, "rank": a.pick, "candidates": len(scored), "sketchfab": f"https://sketchfab.com/3d-models/{uid}"},
           "timings_s": {"index": round(T["t_index"] - T["t_request"], 1), "annotations": round(T["t_annotations"] - T["t_index"], 1), "rank": round(T["t_ranked"] - T["t_annotations"], 1),
                         "download": round(T["t_downloaded"] - T["t_ranked"], 1), "stand": round(T["t_stood"] - T["t_downloaded"], 1), "gate": round(T["t_gated"] - T["t_stood"], 1),
                         "request_to_library": round(T["t_gated"] - T["t_request"], 1)}}
    json.dump(rec, open(os.path.join(out, "record.json"), "w"), indent=1)
    print(json.dumps({"ok": gate.get("ok"), "id": a.id, "uid": uid, "name": name, "license": lic, "candidates": len(scored), "size_kb": os.path.getsize(os.path.join(out, "model.glb")) // 1024,
                      "gate": gate.get("failures"), "ground": {k: ground.get(k) for k in ("tilt_corrected_deg", "level_corrected_deg", "faces")}, "timings_s": rec["timings_s"]}))
    return 0 if gate.get("ok") else 2


if __name__ == "__main__":
    sys.exit(main())
