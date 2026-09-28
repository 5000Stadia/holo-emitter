#!/usr/bin/env python3
"""Compare the painted shell and the code room zone by zone (see tools/zones.mjs).

For each painting pose F, zones come from the code room's instance ids:
ceiling, target wall (owner F, not an aperture), left and right returns (the facings either side),
floor near/far (split at the median floor depth), windows (glass), doors (passage/lining), fireplace.
Luminance is Rec.709 on the sRGB image after a 9 px blur (the painting's detail is not the point).
Writes zones.json and zones.png (per-zone code/painted ratio as a heat overlay) under the output dir.
"""
import json, os, sys
import numpy as np, cv2

LEFT = {"N": "W", "E": "N", "S": "E", "W": "S"}; RIGHT = {"N": "E", "E": "S", "S": "W", "W": "N"}

def lum(path):
    a = cv2.imread(path)[..., ::-1].astype(np.float32)
    return cv2.GaussianBlur(0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2], (0, 0), 9)

def zones_for(F, d):
    meta = json.load(open(os.path.join(d, "meta.json"))); w, h = meta["camera"]["width"], meta["camera"]["height"]
    inst = np.fromfile(os.path.join(d, "instance_u8.bin"), np.uint8).reshape(h, w, 4)[::-1, :, :3]
    depth = np.fromfile(os.path.join(d, "depth_f32.bin"), np.float32).reshape(h, w)[::-1]
    code = (inst[..., 0].astype(np.int64) << 16) | (inst[..., 1].astype(np.int64) << 8) | inst[..., 2]
    imap = {int(k): v for k, v in meta["ids"]["instance"].items()}
    name = np.full((h, w), "", object)
    for c, v in imap.items(): name[code == c] = v["id"]
    own = lambda f: np.char.startswith(name.astype(str), f + "/")
    has = lambda sub: np.char.find(name.astype(str), sub) >= 0
    aperture = has("/glass") | has("/outside") | has("/window") | has("door")
    fire = has("chimneypiece") | has("hearth")
    Z = {
        "ceiling": name == "ceiling",
        "target_wall": own(F) & ~aperture & ~fire,
        "left_return": own(LEFT[F]) & ~aperture,
        "right_return": own(RIGHT[F]) & ~aperture,
        "windows": has("/glass") | has("/outside"),
        "doors": has("door") & ~has("/glass"),
        "fireplace": fire,
    }
    fl = name == "floor"
    if fl.any():
        med = np.median(depth[fl]); Z["floor_near"] = fl & (depth < med); Z["floor_far"] = fl & (depth >= med)
    return {k: v for k, v in Z.items() if v.sum() > 400}

def main(out):
    report, tiles = {}, []
    for F in "NESW":
        d = os.path.join(out, F)
        Lc, Lp = lum(os.path.join(d, "beauty_lit.png")), lum(os.path.join(d, "painted.png"))
        Z = zones_for(F, d); rows = {}
        overlay = cv2.imread(os.path.join(d, "beauty_lit.png")).astype(np.float32) * 0.5; labels = []
        for k, m in Z.items():
            c, p = float(np.median(Lc[m])), float(np.median(Lp[m]))
            ratio = c / max(p, 1.0); rows[k] = {"code": round(c, 1), "painted": round(p, 1), "ratio": round(ratio, 2), "px": int(m.sum())}
            col = (60, 60, 230) if ratio > 1.15 else (230, 120, 50) if ratio < 0.85 else (80, 200, 80)      # BGR: red = too bright, blue = too dark
            overlay[m] = overlay[m] * 0.55 + np.array(col) * 0.45
            labels.append((k, ratio, m))
        overlay = overlay.astype(np.uint8)
        for k, ratio, m in labels:
            ys, xs = np.nonzero(m); cv2.putText(overlay, f"{k} {ratio:.2f}", (int(np.median(xs)) - 60, int(np.median(ys))), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        report[F] = rows
        tiles.append(cv2.resize(overlay, (768, 512)))
    cv2.imwrite(os.path.join(out, "zones.png"), np.vstack([np.hstack(tiles[:2]), np.hstack(tiles[2:])]))
    json.dump(report, open(os.path.join(out, "zones.json"), "w"), indent=1)
    for d in "NESW":
        for f in ("depth_f32.bin", "instance_u8.bin", "hit_f32.bin"):
            q = os.path.join(out, d, f)
            if os.path.exists(q): os.remove(q)
    for F, rows in report.items():
        print(F, "  ".join(f"{k} {v['ratio']:.2f}" for k, v in rows.items()))

if __name__ == "__main__":
    main(sys.argv[1])
