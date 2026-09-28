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
    sil = cv2.dilate(sil.astype(np.uint8), k) > 0; cre = cv2.dilate(cre.astype(np.uint8), k) > 0 & ~sil
    white = lambda m: np.where(m, 0, 255).astype(np.uint8)
    return white(sil | cre), white(sil), white(cre)

def main(packet):
    room_dir = os.path.dirname(packet)
    checks = {
        "schematic.json": sha(os.path.join(room_dir, "schematic.json")),
        "procedural.js": sha(os.path.join(ROOT, "lab/painted/procedural.js")),
        "index.html": sha(os.path.join(ROOT, "lab/painted/index.html")),
    }
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
                "room_m": cam["room"], "checksums_sha256": checks,
            }, open(os.path.join(fdir, "camera.json"), "w"), indent=1)
            for f in os.listdir(raw):                     # the raw dumps are large and fully re-derivable
                if f.endswith(".bin"): os.remove(os.path.join(raw, f))
            print(f"{sdir} {F}: {int(hit.mean() * 100)}% hit, {len(imap)} instances, editable {int((owner == F).mean() * 100)}%, preserve {int(np.isin(owner, earlier).mean() * 100)}%")

if __name__ == "__main__":
    main(sys.argv[1])
