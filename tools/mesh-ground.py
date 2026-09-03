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
    ap.add_argument("--level", default="", help="the working surface that must be parallel to the ground: top | seat:<height_m> | base (Kabe, 2026-09-02)")
    ap.add_argument("--front", default="", help="auto: for a thing with a back (chair, sofa) the back is the side where the upper vertices cluster; the mesh is turned so the front faces +z")
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
    # 5b. the CLASS RULE: a chair is level when its SEAT is, a table when its TOP is
    # (Kabe): fit a plane to the up-facing surface in a slab at that height and level it
    level_deg = None
    if a.level:
        kind, _, arg = a.level.partition(":")
        h = float(m.bounds[1][1])
        if kind == "top": yc, half = h - 0.03, 0.03
        elif kind == "seat": yc, half = float(arg or 0.45), 0.03
        else: yc, half = 0.0, 0.02
        vn = m.vertex_normals; vy = m.vertices[:, 1]
        lo_, hi_ = m.bounds; cx, cz = (lo_[0] + hi_[0]) / 2, (lo_[2] + hi_[2]) / 2
        # the middle of the surface only: a seat pad's rolled edge and a table's lipping are not the plane
        mid = (np.abs(m.vertices[:, 0] - cx) < 0.3 * (hi_[0] - lo_[0])) & (np.abs(m.vertices[:, 2] - cz) < 0.3 * (hi_[2] - lo_[2]))
        sel = (np.abs(vy - yc) < half) & (vn[:, 1] > 0.85) & mid
        if sel.sum() >= 30:
            P = m.vertices[sel]; C = P - P.mean(axis=0)
            w, vec = np.linalg.eigh(C.T @ C)
            n2 = vec[:, 0]; n2 = n2 if n2[1] > 0 else -n2      # the surface's normal, pointing up
            rms = float(np.sqrt(w[0] / max(1, sel.sum())))     # how planar the picked surface is
            up = np.array([0.0, 1.0, 0.0])
            ax2 = np.cross(n2, up); s2 = np.linalg.norm(ax2); ang2 = float(np.arctan2(s2, np.dot(n2, up)))
            if s2 > 1e-8 and 0.2 < np.degrees(ang2) < 25 and rms < 0.012:
                m.apply_transform(trimesh.transformations.rotation_matrix(ang2, ax2 / s2))
                ext = m.bounds[1] - m.bounds[0]; m.apply_scale(a.height_m / max(1e-6, ext[1]))
                lo, hi = m.bounds; m.apply_translation([-(lo[0] + hi[0]) / 2, -lo[1], -(lo[2] + hi[2]) / 2])
            level_deg = round(float(np.degrees(ang2)), 2)
    # 5c. the front: the back of a seat is where the upper third of the vertices sit relative to the footprint
    front = None
    if a.front == "auto":
        V2 = m.vertices; h = float(m.bounds[1][1])
        up_pts = V2[V2[:, 1] > 0.66 * h]
        if len(up_pts) > 20:
            c = (m.bounds[0] + m.bounds[1]) / 2
            dx, dz = float(up_pts[:, 0].mean() - c[0]), float(up_pts[:, 2].mean() - c[2])
            back = "+x" if abs(dx) > abs(dz) and dx > 0 else "-x" if abs(dx) > abs(dz) else "+z" if dz > 0 else "-z"
            turn = {"+z": np.pi, "-z": 0.0, "+x": np.pi / 2, "-x": -np.pi / 2}[back]   # rotate so the back is at -z (front +z)
            if turn:
                m.apply_transform(trimesh.transformations.rotation_matrix(turn, [0, 1, 0]))
                lo, hi = m.bounds; m.apply_translation([-(lo[0] + hi[0]) / 2, -lo[1], -(lo[2] + hi[2]) / 2])
            front = "+z"
    # 6. how level did it come out: the four lowest clusters
    ys = np.sort(m.vertices[:, 1]); feet = ys[: max(4, len(ys) // 200)]
    m.export(a.out)
    print(json.dumps({"ok": True, "out": a.out, "tilt_corrected_deg": round(float(np.degrees(ang)), 2), "support_vertices": support,
                      "size_m": [round(float(v), 3) for v in (m.bounds[1] - m.bounds[0])], "lowest_1pct_spread_m": round(float(feet[-1] - feet[0]), 4), "level_rule": a.level or None, "front": front, "level_corrected_deg": level_deg, "level_surface_vertices": int(sel.sum()) if a.level else None,
                      "faces": int(len(m.faces))}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
