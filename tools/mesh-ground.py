#!/usr/bin/env python3
"""Stand a generated mesh on the floor the way a thing actually stands.

A single-image mesh arrives at an arbitrary scale, on its own up axis, and a
few degrees off level — so sliding it down until one vertex touches y=0 leaves
three feet in the air (Kabe, 2026-09-02: "the feet bottoms need to be oriented
as flat on the ground as possible. It's still levitating angled weird").

This finds the SUPPORT PLANE: among the convex hull's underside faces (normal
within `--max-tilt` degrees of straight down, so a chair is never stood on its
back), the one with the most mesh vertices resting on it (within `--contact`
metres) — for four feet that is the plane through three feet with the fourth
a hair off. The mesh is rotated so that plane is level, scaled to the declared
height, centred on its footprint, and set on y=0. Output is y-up, front kept
as declared, and the page does no fitting of its own.

  venv/bin/python3 tools/mesh-ground.py in.glb out.glb --height-m 0.88 [--up +z] [--max-tilt 35] [--contact 0.012]
"""
import argparse
import json
import sys

import numpy as np
import trimesh


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src"); ap.add_argument("out")
    ap.add_argument("--height-m", type=float, required=True)
    ap.add_argument("--up", default="+z", help="the generator's up axis")
    ap.add_argument("--max-tilt", type=float, default=35.0)
    ap.add_argument("--contact", type=float, default=0.012, help="a vertex this close to the plane rests on it (metres, after scaling)")
    a = ap.parse_args()
    m = trimesh.load(a.src, force="mesh")
    # 1. the generator's up axis to +y
    if a.up == "+z":
        m.apply_transform(trimesh.transformations.rotation_matrix(-np.pi / 2, [1, 0, 0]))
    elif a.up == "-z":
        m.apply_transform(trimesh.transformations.rotation_matrix(np.pi / 2, [1, 0, 0]))
    # 2. scale to the declared height first, so `contact` is in metres
    ext = m.bounds[1] - m.bounds[0]
    m.apply_scale(a.height_m / max(1e-6, ext[1]))
    # 3. support plane: hull underside face with the most resting vertices
    hull = m.convex_hull
    down = np.array([0.0, -1.0, 0.0])
    cos_max = np.cos(np.radians(a.max_tilt))
    best = None
    V = m.vertices
    for fi, n in enumerate(hull.face_normals):
        c = float(np.dot(n, down))
        if c < cos_max:
            continue
        p0 = hull.vertices[hull.faces[fi][0]]
        dist = np.abs((V - p0) @ n)                 # distance of every mesh vertex to this plane
        support = int((dist < a.contact).sum())
        # tie-break toward the face already closest to level
        score = (support, c)
        if best is None or score > best[0]:
            best = (score, n.copy(), p0.copy())
    if best is None:
        print(json.dumps({"ok": False, "why": f"no hull face within {a.max_tilt} deg of down"})); return 2
    (support, c), n, p0 = best
    # 4. rotate so that n -> straight down
    axis = np.cross(n, down); s = np.linalg.norm(axis); ang = float(np.arctan2(s, np.dot(n, down)))
    if s > 1e-8 and ang > 1e-6:
        m.apply_transform(trimesh.transformations.rotation_matrix(ang, axis / s))
    # 5. re-scale to the declared height (the tilt changed the extent), centre the footprint, floor at y=0
    ext = m.bounds[1] - m.bounds[0]
    m.apply_scale(a.height_m / max(1e-6, ext[1]))
    lo, hi = m.bounds
    m.apply_translation([-(lo[0] + hi[0]) / 2, -lo[1], -(lo[2] + hi[2]) / 2])
    # 6. how level did it come out: the four lowest clusters
    ys = np.sort(m.vertices[:, 1]); feet = ys[: max(4, len(ys) // 200)]
    m.export(a.out)
    print(json.dumps({"ok": True, "out": a.out, "tilt_corrected_deg": round(float(np.degrees(ang)), 2), "support_vertices": support,
                      "size_m": [round(float(v), 3) for v in (m.bounds[1] - m.bounds[0])], "lowest_1pct_spread_m": round(float(feet[-1] - feet[0]), 4),
                      "faces": int(len(m.faces))}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
