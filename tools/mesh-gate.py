#!/usr/bin/env python3
"""Gate a generated GLB before it enters the library (stdlib only).

Reads the glTF header + JSON chunk, takes the POSITION accessors' min/max
for the bounding box and the index accessors for the triangle count, and
checks them against the declared real dimensions and a triangle budget:

  python3 tools/mesh-gate.py model.glb --height-m 0.88 --width-m 0.46 --depth-m 0.50 [--max-tris 60000]

Exit 0 pass (JSON report on stdout), 2 content failure (regenerate), 3 usage.
A single-image mesh is generated at an arbitrary scale and orientation, so
the gate judges SHAPE (aspect ratios) not size; the loader scales to the
declared height and the record says which axis is up/front.
"""
import argparse
import json
import struct
import sys


def read_glb(path):
    b = open(path, "rb").read()
    magic, version, length = struct.unpack_from("<4sII", b, 0)
    if magic != b"glTF":
        raise SystemExit("mesh-gate refused: not a GLB")
    off = 12
    js = None
    while off < length:
        clen, ctype = struct.unpack_from("<I4s", b, off)
        if ctype == b"JSON":
            js = json.loads(b[off + 8:off + 8 + clen].decode("utf-8"))
        off += 8 + clen
    if js is None:
        raise SystemExit("mesh-gate refused: no JSON chunk")
    return js


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("glb")
    ap.add_argument("--height-m", type=float, required=True)
    ap.add_argument("--width-m", type=float, required=True)
    ap.add_argument("--depth-m", type=float, required=True)
    ap.add_argument("--max-tris", type=int, default=60000)
    ap.add_argument("--aspect-tol", type=float, default=0.35, help="relative tolerance on width/height and depth/height")
    a = ap.parse_args()
    g = read_glb(a.glb)
    acc = g.get("accessors", [])
    mn, mx, tris = [1e9] * 3, [-1e9] * 3, 0
    for m in g.get("meshes", []):
        for p in m.get("primitives", []):
            pa = acc[p["attributes"]["POSITION"]]
            for i in range(3):
                mn[i] = min(mn[i], pa["min"][i]); mx[i] = max(mx[i], pa["max"][i])
            if "indices" in p:
                tris += acc[p["indices"]]["count"] // 3
            else:
                tris += pa["count"] // 3
    size = [mx[i] - mn[i] for i in range(3)]
    if max(size) <= 0:
        print(json.dumps({"ok": False, "why": "empty mesh"})); return 2
    # up axis: the longest declared dimension is the height for a chair;
    # take the mesh axis whose extent best matches the declared aspect
    decl = {"h": a.height_m, "w": a.width_m, "d": a.depth_m}
    best = None
    for up in range(3):
        others = [i for i in range(3) if i != up]
        h = size[up]
        ratios = sorted([size[o] / h for o in others])
        want = sorted([decl["w"] / decl["h"], decl["d"] / decl["h"]])
        err = max(abs(r - w) / w for r, w in zip(ratios, want))
        if best is None or err < best[0]:
            best = (err, up, ratios, want)
    err, up, ratios, want = best
    fails = []
    if tris > a.max_tris:
        fails.append(f"{tris} triangles over the {a.max_tris} budget")
    if err > a.aspect_tol:
        fails.append(f"shape off: side/height ratios {ratios[0]:.2f},{ratios[1]:.2f} vs declared {want[0]:.2f},{want[1]:.2f} (err {err:.2f} > {a.aspect_tol})")
    rep = {"ok": not fails, "glb": a.glb, "triangles": tris, "bbox_min": mn, "bbox_max": mx, "size": size,
           "up_axis": "xyz"[up], "aspect_err": round(err, 3), "images": len(g.get("images", [])),
           "materials": len(g.get("materials", [])), "failures": fails}
    print(json.dumps(rep, indent=1))
    return 0 if not fails else 2


if __name__ == "__main__":
    sys.exit(main())
