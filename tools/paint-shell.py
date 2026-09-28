#!/usr/bin/env python3
"""Bake a walkable room shell from its four painted facings.

Each facing is a one-point-perspective painting whose back wall is a flat
rectangle square to the camera, so the wall texture is that rectangle, cropped.
Floor and ceiling are projected: every texel of the floor (ceiling) plane is
carried through each facing's pinhole camera (principal point = vanishing
point, focal from the meta, scale set by the back wall's width) and sampled
where it lands, weighted by how many painted pixels cover it. What no painting
sees (the middle of the room, under all four cameras) is filled by mirroring
the nearest painted texel across the edge of coverage, along the room's depth.

    tools/paint-shell.py lab/painted/muniment_room/measure.json
writes N/E/S/W.jpg, floor.jpg, ceiling.jpg and shell.json beside the measure file.
"""
import json, sys, os
import numpy as np
import cv2
from PIL import Image

PPM = 250          # texels per metre, about the paintings' own density at the back wall

def facing_camera(F, m, room):
    W, D = room["w"], room["d"]
    wall = W if F in "NS" else D
    s = wall / (m["x1"] - m["x0"])           # metres per painted pixel at the back wall
    f = m["focal"]
    return dict(s=s, f=f, d=f * s, vp=m["vp"], rcam=(m["vp"][0] - m["x0"]) * s,
                e=(m["floor"] - m["vp"][1]) * s, top=(m["vp"][1] - m["ceil"]) * s)

def local(F, X, Y, cam, room):
    W, D, d = room["w"], room["d"], cam["d"]
    if F == "N": return X, Y - (D - d)
    if F == "S": return W - X, d - Y
    if F == "E": return D - Y, X - (W - d)
    return Y, d - X                            # W

def sample(img, u, v):
    """bilinear sample of an HxWx3 float image at float pixel coords"""
    h, w = img.shape[:2]
    u = np.clip(u, 0, w - 1.001); v = np.clip(v, 0, h - 1.001)
    u0, v0 = np.floor(u).astype(int), np.floor(v).astype(int)
    fu, fv = (u - u0)[..., None], (v - v0)[..., None]
    a, b = img[v0, u0], img[v0, u0 + 1]
    c, d = img[v0 + 1, u0], img[v0 + 1, u0 + 1]
    return (a * (1 - fu) + b * fu) * (1 - fv) + (c * (1 - fu) + d * fu) * fv

def feather(x, lo, hi, band=40.0):
    return np.clip((x - lo) / band, 0, 1) * np.clip((hi - x) / band, 0, 1)

def project_plane(which, faces, imgs, cams, room, use, axis="y"):
    W, D = room["w"], room["d"]
    nx, ny = int(round(W * PPM)), int(round(D * PPM))
    X = (np.arange(nx) + 0.5) / PPM
    Y = D - (np.arange(ny) + 0.5) / PPM          # texture row 0 = north edge
    X, Y = np.meshgrid(X, Y)
    acc = np.zeros((ny, nx, 3)); wsum = np.zeros((ny, nx))
    for F in use:
        m, cam, img = faces[F], cams[F], imgs[F]
        h, w = img.shape[:2]
        r, z = local(F, X, Y, cam, room)
        zc = np.maximum(z, 1e-3)
        u = m["vp"][0] + cam["f"] * (r - cam["rcam"]) / zc
        if which == "floor":
            v = m["vp"][1] + cam["f"] * cam["e"] / zc
            ok = (z > 0.05) & (v > m["floor"] + 3)
            wt = feather(u, 0, w) * feather(v, m["floor"] + 3, h, 25)
        else:
            v = m["vp"][1] - cam["f"] * cam["top"] / zc
            ok = (z > 0.05) & (v < m["ceil"] - 3)
            wt = feather(u, 0, w) * feather(v, 0, m["ceil"] - 3, 25)
        wt = np.where(ok, wt * (cam["f"] / zc) ** 2, 0)        # prefer the painting that spends more pixels here
        wt = wt ** 1.5
        acc += sample(img, u, v) * wt[..., None]; wsum += wt
    cover = wsum > 1e-6 * wsum.max()
    out = np.where(cover[..., None], acc / np.maximum(wsum, 1e-12)[..., None], 0)
    if axis == "grain":  # a surface with no direction (plaster): smooth base plus tiled grain
        return grain_fill(out, cover), cover
    if axis == "x":     # mirror along the rows (the boards' own direction), so board lines stay unbroken
        return mirror_fill(out.transpose(1, 0, 2), cover.T).transpose(1, 0, 2), cover
    return mirror_fill(out, cover), cover

def grain_fill(img, cover):
    """plaster, which has no direction: keep the painted ring and let it fade into the
    painted texels' median colour, carrying fractal grain matched to the paint's own"""
    inner = cv2.erode(cover.astype(np.uint8), np.ones((41, 41), np.uint8)) > 0
    base = np.median(img[inner], axis=0)
    hp = img - cv2.GaussianBlur(img, (0, 0), 6)
    amp = hp[cv2.erode(inner.astype(np.uint8), np.ones((41, 41), np.uint8)) > 0].std(axis=0)
    rng = np.random.default_rng(7)
    h, w = img.shape[:2]
    noise = np.zeros((h, w), np.float32)
    for k, cell in enumerate((3, 7, 17, 41)):
        g = rng.standard_normal((h // cell + 2, w // cell + 2)).astype(np.float32)
        noise += cv2.resize(g, (w, h), interpolation=cv2.INTER_CUBIC) * (0.55 ** k)
    noise = (noise - noise.mean()) / noise.std()
    fill = base[None, None, :] * (1 + 0.04 * cv2.GaussianBlur(noise, (0, 0), 30)[..., None] * 8) + noise[..., None] * amp
    soft = cv2.GaussianBlur(inner.astype(np.float32), (0, 0), 50)[..., None]
    painted = np.where(cover[..., None], img, fill)      # nothing unpainted may leak black into the blend
    return painted * soft + fill * (1 - soft)

def mirror_fill(img, cover):
    """fill uncovered texels column by column by reflecting the nearest covered run across its edge"""
    out = img.copy()
    ny = img.shape[0]
    for x in range(img.shape[1]):
        col = cover[:, x]
        if col.all(): continue
        idx = np.flatnonzero(col)
        if len(idx) == 0: continue
        for y in np.flatnonzero(~col):
            above = idx[idx < y]; below = idx[idx > y]
            cands = []
            if len(above): a = above[-1]; cands.append((y - a, a - (y - a)))
            if len(below): b = below[0]; cands.append((b - y, b + (b - y)))
            # blend both reflections by distance so the seam in the middle is soft
            vals, ws = [], []
            for dist, src in cands:
                src = int(np.clip(src, 0, ny - 1))
                if not col[src]:          # reflection ran off the covered run: clamp to the edge texel
                    src = int(idx[np.argmin(np.abs(idx - src))])
                vals.append(img[src, x]); ws.append(1.0 / max(dist, 1) ** 2)
            ws = np.array(ws) / sum(ws)
            out[y, x] = sum(v * w for v, w in zip(vals, ws))
    return out

def main(path):
    spec = json.load(open(path)); base = os.path.dirname(path); room = spec["room_m"]
    faces = spec["facings"]
    imgs = {F: np.asarray(Image.open(f"{spec['backdrops']}/{F}.png").convert("RGB"), dtype=np.float32) for F in faces}
    cams = {F: facing_camera(F, faces[F], room) for F in faces}
    shell = dict(room_m=room, ppm=PPM, walls={}, source=spec["backdrops"])
    for F, m in faces.items():
        wall = room["w"] if F in "NS" else room["d"]
        crop = Image.fromarray(imgs[F].astype(np.uint8)).crop((m["x0"], m["ceil"], m["x1"], m["floor"]))
        crop.resize((int(round(wall * PPM)), int(round(room["h"] * PPM))), Image.LANCZOS).save(f"{base}/{F}.jpg", quality=90)
        span_px, tall_px = m["x1"] - m["x0"], m["floor"] - m["ceil"]
        ops = []
        for i, o in enumerate(m.get("openings", [])):
            # what the painting shows through the opening becomes a card set back in the passage;
            # the frame's own colour, just inside the opening's edge, dresses the reveal
            inside = imgs[F][o["top"] + 8:m["floor"] - 4, o["x0"] + 8:o["x1"] - 8]
            Image.fromarray(inside.astype(np.uint8)).save(f"{base}/{F}.op{i}.jpg", quality=90)
            edge = np.concatenate([imgs[F][o["top"]:m["floor"], o["x0"] - 14:o["x0"] - 4].reshape(-1, 3),
                                   imgs[F][o["top"]:m["floor"], o["x1"] + 4:o["x1"] + 14].reshape(-1, 3)])
            if o["kind"] == "recess":     # a firebox: its reveal is its own splayed brick, just inside the edge
                edge = imgs[F][o["top"] + 20:m["floor"] - 30, o["x0"] + 6:o["x0"] + 30].reshape(-1, 3)
            ops.append(dict(kind=o["kind"], u0=(o["x0"] - m["x0"]) / span_px, u1=(o["x1"] - m["x0"]) / span_px,
                            top=(m["floor"] - o["top"]) / tall_px, beyond=f"{F}.op{i}.jpg", depth=o.get("depth"),
                            reveal_rgb=[int(v) for v in np.median(edge, axis=0) * 0.8]))
        # reliefs: parts of the painting that stand proud of the wall (a chimney-piece). Their
        # front is the wall texture itself; their sides take the paint just inside their edge
        rel = []
        for r in m.get("reliefs", []):
            side = imgs[F][r["top"]:r["bottom"], r["x0"] + 3:r["x0"] + 12].reshape(-1, 3)
            top = imgs[F][r["top"] + 2:r["top"] + 8, r["x0"]:r["x1"]].reshape(-1, 3)
            rel.append(dict(what=r.get("what", ""), u0=(r["x0"] - m["x0"]) / span_px, u1=(r["x1"] - m["x0"]) / span_px,
                            v0=(m["floor"] - r["bottom"]) / tall_px, v1=(m["floor"] - r["top"]) / tall_px, depth=r["depth"],
                            side_rgb=[int(v) for v in np.median(side, axis=0) * 0.72],
                            top_rgb=[int(v) for v in np.median(top, axis=0) * 0.9]))
        hearth = None
        if m.get("hearth"):
            # the hearth lies on the floor, so its own facing's camera sees it true: project it
            # out of that painting alone, like the floor, over the slab's footprint
            hm = m["hearth"]; u0, u1 = (hm["x0"] - m["x0"]) / span_px, (hm["x1"] - m["x0"]) / span_px
            out = hm["out_m"] + max([r["depth"] for r in m.get("reliefs", []) if r["bottom"] >= m["floor"]] or [0])
            hearth = dict(u0=u0, u1=u1, out_m=hm["out_m"], tex=f"{F}.hearth.jpg")
            nr, nz = int((u1 - u0) * wall * PPM), int(out * PPM)
            R = u0 * wall + (np.arange(nr) + 0.5) / PPM
            Z = cams[F]["d"] - out + (np.arange(nz) + 0.5) / PPM        # camera depth; row 0 = the room side
            R, Z = np.meshgrid(R, Z)
            c = cams[F]
            u = m["vp"][0] + c["f"] * (R - c["rcam"]) / Z
            v = m["vp"][1] + c["f"] * c["e"] / Z
            Image.fromarray(np.clip(sample(imgs[F], u, v), 0, 255).astype(np.uint8)).save(f"{base}/{F}.hearth.jpg", quality=90)
        shell["walls"][F] = dict(tex=f"{F}.jpg", width_m=wall, openings=ops, reliefs=rel, hearth=hearth)
        shell.setdefault("cameras", {})[F] = {k: round(v, 3) for k, v in cams[F].items() if k != "vp"}
    for which, use, axis in (("floor", spec.get("floor_from", list(faces)), spec.get("fill_axis", "y")),
                             ("ceiling", list(faces), "grain")):
        tex, cover = project_plane(which, faces, imgs, cams, room, use, axis)
        if which == "ceiling": tex = tex[::-1]        # seen from below: texture row 0 = south edge
        Image.fromarray(np.clip(tex, 0, 255).astype(np.uint8)).save(f"{base}/{which}.jpg", quality=90)
        shell[which] = dict(tex=f"{which}.jpg", painted_fraction=round(float(cover.mean()), 3), from_facings=use)
        Image.fromarray((cover * 255).astype(np.uint8)).save(f"{base}/{which}.cover.png")
    json.dump(shell, open(f"{base}/shell.json", "w"), indent=1)
    print(json.dumps({k: v for k, v in shell.items() if k in ("floor", "ceiling", "cameras")}, indent=1))

if __name__ == "__main__":
    main(sys.argv[1])
