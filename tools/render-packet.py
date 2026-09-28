#!/usr/bin/env python3
"""Turn the raw passes tools/render-packet.mjs pulled from the page into the paintover packet.

    tools/render-packet.py lab/painted/<room>/packet

For every <scale>x/<F>/raw/ it writes, beside raw/: beauty_lit, beauty_neutral, albedo (sRGB PNG);
depth_u16 (+ depth_preview), normal_camera_u16, edges / edges_silhouette / edges_crease,
material_id, instance_id, id-map.json, owner.png, editable_mask, preserve_mask, later_mask, camera.json.
Contract: holo-emitter-codex's packet spec, 2026-09-28. Painting order N -> E -> S -> W, lead N.
"""
import hashlib, json, math, os, shutil, sys
import numpy as np, cv2

ORDER = ["N", "E", "S", "W"]
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

def sha(path):
    return hashlib.sha256(open(path, "rb").read()).hexdigest()

def load(raw, name, w, h, ch, dtype):
    a = np.fromfile(os.path.join(raw, name), dtype=dtype).reshape(h, w, ch)
    return a[::-1]                      # render targets read bottom row first

def edges(depth, hit, normal, inst, scale):
    h, w = depth.shape
    sil = np.zeros((h, w), bool); cre = np.zeros((h, w), bool)
    for dy, dx in ((0, 1), (1, 0)):
        a = (slice(0, h - dy), slice(0, w - dx)); b = (slice(dy, h), slice(dx, w))
        da, db, ha, hb = depth[a], depth[b], hit[a], hit[b]
        jump = (ha != hb) | (ha & hb & (np.abs(da - db) > np.maximum(0.03, 0.02 * np.minimum(da, db))))
        cosang = (normal[a] * normal[b]).sum(-1)
        crease = ha & hb & ~jump & ((cosang < math.cos(math.radians(25))) | (inst[a] != inst[b]))
        sil[a] |= jump; cre[a] |= crease
    k = np.ones((2, 2), np.uint8) if scale == 1 else np.ones((3, 3), np.uint8)
    sil = cv2.dilate(sil.astype(np.uint8), k) > 0
    cre = (cv2.dilate(cre.astype(np.uint8), k) > 0) & ~sil
    white = lambda m: np.where(m, 0, 255).astype(np.uint8)
    return white(sil | cre), white(sil), white(cre)

class PacketError(Exception):
    pass

def repair_cracks(hit_all, arrays, scale, enclosed):
    """Close internal raster cracks: pixels where some pass missed geometry. Only thin components
    that do not touch the frame are filled, each pixel from its one nearest fully-hit neighbour,
    the same donor for every pass. An open view's background is never filled."""
    hole = ~hit_all
    if not hole.any(): return 0
    n, lab, stats, _ = cv2.connectedComponentsWithStats(hole.astype(np.uint8), connectivity=8)
    h, w = hole.shape; thin = 3 * scale
    fill = np.zeros_like(hole)
    for c in range(1, n):
        x, y, bw, bh, area = stats[c]
        touches = x == 0 or y == 0 or x + bw == w or y + bh == h
        is_thin = min(bw, bh) <= thin or area <= thin * max(bw, bh)
        if is_thin and (not touches or enclosed): fill |= lab == c
    if not fill.any(): return 0
    _, labels = cv2.distanceTransformWithLabels(np.where(hit_all, 0, 1).astype(np.uint8), cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL)
    zy, zx = np.nonzero(hit_all)                      # labels number the zero (valid) pixels in scan order
    lookup = np.zeros((labels.max() + 1, 2), np.int64); lookup[labels[zy, zx]] = np.stack([zy, zx], 1)
    fy, fx = np.nonzero(fill); src = lookup[labels[fy, fx]]
    for a in arrays: a[fy, fx] = a[src[:, 0], src[:, 1]]
    hit_all[fy, fx] = True
    return int(fill.sum())

def validate(F, scale, w, h, hit, normal, code, mcode, imap, mmap, masks, e_all, e_sil, e_cre, camj, enclosed):
    fail = []
    if normal.shape != (h, w, 3) or code.shape != (h, w): fail.append("dimensions")
    n = np.linalg.norm(normal[hit], axis=1)
    if not np.all(np.isfinite(n)) or np.abs(n - 1).max() > 1e-3: fail.append(f"normals not unit on hits (max err {np.abs(n - 1).max():.2e})")
    if not np.array_equal(hit, code != 0) or not np.array_equal(hit, mcode != 0): fail.append("hit coverage differs across depth/normal/instance/material")
    unknown = set(np.unique(code[hit]).tolist()) - set(imap)
    if unknown: fail.append(f"{len(unknown)} instance colours not in id-map")
    if set(np.unique(mcode[hit]).tolist()) - set(mmap): fail.append("material colours not in id-map")
    total = sum(m.astype(np.int32) for m in masks)
    if not (np.all(total[hit] == 1) and np.all(total[~hit] == 0)): fail.append("editable + preserve + later != exactly one on hits / zero off hits")
    if (e_sil == 0).any() and ((e_sil == 0) & (e_cre == 0)).any(): fail.append("silhouette and crease overlap")
    if not np.array_equal(e_all == 0, (e_sil == 0) | (e_cre == 0)): fail.append("edges != union of silhouette and crease")
    Mw, V = np.array(camj["world_from_camera"]), np.array(camj["view"])
    if np.abs(Mw @ V - np.eye(4)).max() > 1e-4: fail.append("world_from_camera x view != identity")
    if not np.allclose(np.array(camj["world_from_camera_colmajor"]).reshape(4, 4).T, Mw): fail.append("row/column-major matrices disagree")
    if enclosed and not hit.all(): fail.append(f"enclosed room with {int((~hit).sum())} uncovered pixels")
    if fail: raise PacketError(f"{scale}x {F}: " + "; ".join(fail))

def main(packet):
    room_dir = os.path.dirname(packet)
    checks = {
        "schematic.json": sha(os.path.join(room_dir, "schematic.json")),
        "procedural.js": sha(os.path.join(ROOT, "lab/painted/procedural.js")),
        "index.html": sha(os.path.join(ROOT, "lab/painted/index.html")),
        "render-packet.mjs": sha(os.path.join(ROOT, "tools/render-packet.mjs")),
        "render-packet.py": sha(os.path.join(ROOT, "tools/render-packet.py")),
    }
    enclosed = True        # this fixture is a closed room: every pixel must land on a surface
    poses = {}
    for sdir in sorted(d for d in os.listdir(packet) if d.endswith("x")):
        scale = int(sdir[:-1])
        for F in ORDER:
            fdir = os.path.join(packet, sdir, F); raw = os.path.join(fdir, "raw")
            if not os.path.isdir(raw): continue
            meta = json.load(open(os.path.join(raw, "meta.json"))); cam = meta["camera"]; w, h = cam["width"], cam["height"]
            for k in ("beauty_lit", "beauty_neutral", "albedo"):
                shutil.copy(os.path.join(raw, f"{k}.png"), os.path.join(fdir, f"{k}.png"))
            depth = load(raw, "depth_f32.bin", w, h, 1, np.float32)[..., 0]
            hit = load(raw, "hit_f32.bin", w, h, 1, np.float32)[..., 0] > 0.5
            normal = load(raw, "normal_f32.bin", w, h, 3, np.float32)
            world = load(raw, "world_f32.bin", w, h, 3, np.float32)
            inst8 = load(raw, "instance_u8.bin", w, h, 4, np.uint8)[..., :3]
            mat8 = load(raw, "material_u8.bin", w, h, 4, np.uint8)[..., :3]
            depth, normal, world, inst8, mat8 = (np.ascontiguousarray(a) for a in (depth, normal, world, inst8, mat8))
            hit_all = hit & (inst8.any(-1)) & (mat8.any(-1))
            repaired = repair_cracks(hit_all, [depth, normal, world, inst8, mat8], scale, enclosed)
            hit = hit_all
            # depth: euclidean camera distance in millimetres, 0 = no hit
            d16 = np.where(hit, np.clip(np.round(depth * 1000), 1, 65535), 0).astype(np.uint16)
            cv2.imwrite(os.path.join(fdir, "depth_u16.png"), d16)
            dmax = float(depth[hit].max()) if hit.any() else 1.0
            prev = np.where(hit, 255 - np.clip(depth / dmax * 235, 0, 235), 0).astype(np.uint8)
            cv2.imwrite(os.path.join(fdir, "depth_preview.png"), prev)
            n16 = np.where(hit[..., None], np.clip(np.round((normal * 0.5 + 0.5) * 65535), 0, 65535), 0).astype(np.uint16)
            cv2.imwrite(os.path.join(fdir, "normal_camera_u16.png"), n16[..., ::-1])
            code = (inst8[..., 0].astype(np.int64) << 16) | (inst8[..., 1].astype(np.int64) << 8) | inst8[..., 2]
            cv2.imwrite(os.path.join(fdir, "instance_id.png"), inst8[..., ::-1])
            cv2.imwrite(os.path.join(fdir, "material_id.png"), mat8[..., ::-1])
            imap = {int(k): v for k, v in meta["ids"]["instance"].items()}
            mmap = {int(k): v for k, v in meta["ids"]["material"].items()}
            hexs = lambda c: "#%06x" % c
            json.dump({"instance": {hexs(c): v for c, v in sorted(imap.items())}, "material": {hexs(c): v for c, v in sorted(mmap.items())},
                       "background": "#000000 = no hit"}, open(os.path.join(fdir, "id-map.json"), "w"), indent=1)
            e_all, e_sil, e_cre = edges(depth, hit, normal, code, scale)
            for k, v in (("edges", e_all), ("edges_silhouette", e_sil), ("edges_crease", e_cre)):
                cv2.imwrite(os.path.join(fdir, f"{k}.png"), v)
            # ownership: one physical surface, one painted source. Walls belong to their facing;
            # floor and ceiling texels to the nearest wall (plan X east, Y north = -z)
            owner = np.full((h, w), "", object)
            for c, v in imap.items(): owner[code == c] = v.get("owner") or ""
            W, D = cam["room"]["w"], cam["room"]["d"]
            X, Y = world[..., 0], -world[..., 2]
            near = np.array(["N", "S", "E", "W"], object)[np.argmin(np.stack([D - Y, Y, W - X, X]), 0)]
            plane = np.isin(owner, ["floor", "ceiling"])
            owner[plane] = near[plane]
            owner[~hit] = ""
            colours = {"N": (70, 90, 200), "E": (80, 170, 80), "S": (200, 150, 60), "W": (170, 70, 170), "": (0, 0, 0)}
            vis = np.zeros((h, w, 3), np.uint8)
            for k, c in colours.items(): vis[owner == k] = c
            cv2.imwrite(os.path.join(fdir, "owner.png"), vis[..., ::-1])
            earlier = ORDER[:ORDER.index(F)]; later = ORDER[ORDER.index(F) + 1:]
            m8 = lambda m: np.where(m, 255, 0).astype(np.uint8)
            cv2.imwrite(os.path.join(fdir, "editable_mask.png"), m8(owner == F))
            cv2.imwrite(os.path.join(fdir, "preserve_mask.png"), m8(np.isin(owner, earlier)))
            cv2.imwrite(os.path.join(fdir, "later_mask.png"), m8(np.isin(owner, later)))
            masks = [owner == F, np.isin(owner, earlier), np.isin(owner, later)]
            mcode = (mat8[..., 0].astype(np.int64) << 16) | (mat8[..., 1].astype(np.int64) << 8) | mat8[..., 2]
            # the camera
            q = cam["quaternion"]; M = np.array(cam["matrixWorld"]).reshape(4, 4).T
            fwd = -M[:3, 2]; up = M[:3, 1]; pos = np.array(cam["position"])
            fv = math.radians(cam["fov_v_deg"]); fh = 2 * math.atan(math.tan(fv / 2) * w / h)
            json.dump({
                "schema": "holo-emitter/render-packet/1", "view_id": f"{os.path.basename(room_dir)}/{F}/{scale}x",
                "facing": F, "painting_order": ORDER, "lead": ORDER[0], "width": w, "height": h, "pixel_aspect": 1.0, "units": "metres",
                "frame": "three.js world: right-handed, +Y up; plan X east = +x, plan Y north = -z; the camera looks down its local -Z",
                "projection": "perspective", "position": pos.tolist(), "quaternion_xyzw": q,
                "look_at": (pos + fwd).tolist(), "up": up.tolist(),
                "fov_v_deg": cam["fov_v_deg"], "fov_h_deg": math.degrees(fh), "focal_px": h / 2 / math.tan(fv / 2),
                "principal_point_px": [w / 2, h / 2], "near": cam["near"], "far": cam["far"],
                "matrix_convention": "4x4 lists are row-major (M[row][col]); the *_colmajor arrays are three.js toArray()",
                "world_from_camera": M.tolist(), "view": np.array(cam["matrixWorldInverse"]).reshape(4, 4).T.tolist(),
                "projection_matrix": np.array(cam["projectionMatrix"]).reshape(4, 4).T.tolist(),
                "world_from_camera_colmajor": cam["matrixWorld"], "projection_colmajor": cam["projectionMatrix"],
                "overscan": {"x_px": 0, "y_px": 0, "crop": None},
                "exposure": cam["exposure"], "tone_mapper": {"beauty_lit": "ACESFilmic", "beauty_neutral": "none (hemisphere at pi, white sky, grey ground: form without cast shadows)", "albedo": "none"},
                "output_colour_space": {"beauty_lit": "sRGB", "beauty_neutral": "sRGB", "albedo": "sRGB", "data passes": "linear, untagged"},
                "lights_at_render": cam["lights"], "white_balance": "none (lights carry their own colour)",
                "seed": "deterministic: procedural.js seeds are fixed constants; no jitter, no TAA",
                "depth": {"file": "depth_u16.png", "type": "uint16", "quantity": "euclidean distance from the camera centre",
                          "decode": "metres = value / 1000", "no_hit": 0, "preview": "depth_preview.png (8-bit, human only)"},
                "normal": {"file": "normal_camera_u16.png", "type": "uint16 RGB", "space": "camera",
                           "axes": "+X right, +Y up, +Z toward the viewer (out of the screen)", "decode": "n = value / 65535 * 2 - 1", "no_hit": [0, 0, 0]},
                "ids": {"instance": "instance_id.png", "material": "material_id.png", "map": "id-map.json"},
                "masks": {"editable": "surfaces this facing owns and may invent", "preserve": "surfaces owned by facings painted earlier: composite their projected pixels back",
                          "later": "surfaces owned by facings painted later: leave loose", "owner": "owner.png: N blue, E green, S amber, W violet"},
                "room_m": cam["room"], "enclosed": enclosed, "cracks_repaired_px": repaired, "checksums_sha256": checks,
            }, open(os.path.join(fdir, "camera.json"), "w"), indent=1)
            camj = json.load(open(os.path.join(fdir, "camera.json")))
            validate(F, scale, w, h, hit, normal, code, mcode, imap, mmap, masks, e_all, e_sil, e_cre, camj, enclosed)
            poses.setdefault(F, []).append((scale, camj["position"], camj["quaternion_xyzw"], json.load(open(os.path.join(fdir, "id-map.json")))))
            for f in os.listdir(raw):                     # the raw dumps are large and fully re-derivable
                if f.endswith(".bin"): os.remove(os.path.join(raw, f))
            print(f"{sdir} {F}: valid; {repaired} crack px repaired; {len(imap)} instances; editable {(owner == F).mean() * 100:.0f}%, preserve {np.isin(owner, earlier).mean() * 100:.0f}%")
    # across scales: the same pose and the same ids
    for F, views in poses.items():
        for (s1, p1, q1, m1), (s2, p2, q2, m2) in zip(views, views[1:]):
            if not (np.allclose(p1, p2) and np.allclose(q1, q2)): raise PacketError(f"{F}: pose differs between {s1}x and {s2}x")
            if m1 != m2: raise PacketError(f"{F}: id-map differs between {s1}x and {s2}x")
    print("packet valid: every check passed at every scale")

if __name__ == "__main__":
    main(sys.argv[1])
