#!/usr/bin/env python3
"""The catalogue path, programmatic end to end: nouns → seat orders → meshes → library.

  python3 tools/catalogue.py prompts  --nouns lab/catalogue/nouns.json     # write library-src/<id>/prompt.txt from a template
  python3 tools/catalogue.py order    --nouns ...                           # one order to the painter seat (tmux pane), all nouns
  python3 tools/catalogue.py meshes   --nouns ...  [--venv PATH]            # TripoSR per painted source, gate, decimate, register
  python3 tools/catalogue.py sheet    --nouns ...  --out lab/catalogue/sheet.png   # contact sheet: source beside a mesh turntable frame

No LLM anywhere: the prompt is a template over the noun's row (noun, dims, materials, period)
and the pack's world/voice text; the seat paints; TripoSR reconstructs; the gate is arithmetic.
"""
import argparse
import glob
import json
import os
import subprocess
import sys
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRATCH = "/tmp/claude-1000/-home-k-Projects-holo-emitter/97770d23-8695-4407-9f5e-30bf8e241f72/scratchpad/triposr"

PROMPT = """Use case: location-study ({world})
Asset type: isolated source image for the catalogue asset `{id}`; a single-image mesh model will reconstruct it, so the silhouette must be complete and unambiguous
Input image: {reference} — approved style, palette, camera character and lighting reference only; do not reproduce its room or composition
Primary request: Generate exactly one historically plausible {period} {noun}, {h:.2f} m tall, as an isolated source image.
Subject: {subject} The complete object, every foot or base included, must be visible and unobscured.
Style/medium: {medium}
Composition/framing: Square source image, 1024x1024 or larger. Front three-quarter view turned 30 degrees toward viewer-left, showing the front and the left side. 24 mm-equivalent rectilinear perspective, camera at 1.83 m eye height pitched about 8 degrees downward, viewed as if from roughly 3 metres away. Object centred, upright, fully in frame with generous clean margin on every side, sharp edge to edge, no crop.
Lighting: Single soft key from SCREEN UPPER-LEFT at 45 degrees (the left side is the brighter side), with even fill, warm cove-light character matching the approved painting; readable transparent shadow within the object only. No rim light.
Background: One perfectly flat, perfectly uniform neutral mid-grey (RGB 128,128,128) filling every pixel that is not the object, edge to edge — NO gradient, NO studio sweep, NO vignette, NO floor plane, NO horizon, and NO shadow of any kind on the ground. The object floats on flat grey like a cut-out.
Constraints: Exactly one {noun}; {materials}; {h:.2f} m real height, about {w:.2f} m wide and {d:.2f} m deep; period {period}; full clean silhouette; no props, no people, no text, no signature, no watermark.
Avoid: any shadow on the ground, gradient background, light from the right, {avoid} scene, props, room, hard cast shadow, rim light, vignette, depth of field, blur, crop, CGI sheen, photograph.
"""


def load(a):
    n = json.load(open(a.nouns))
    world = json.load(open(os.path.join(ROOT, "packs", n["pack"], "world.json")))
    return n, world


def cmd_prompts(a):
    n, world = load(a)
    for row in n["nouns"]:
        d = os.path.join(ROOT, "library-src", row["id"]); os.makedirs(d, exist_ok=True)
        txt = PROMPT.format(world=n["pack"] + ", " + world["era"], id=row["id"], reference=n["reference"], period=n["period"],
                            noun=row["noun"], h=row["dims_m"]["h"], w=row["dims_m"]["w"], d=row["dims_m"]["d"],
                            subject=row["subject"], medium=world["medium"], materials=row["materials"], avoid=row.get("avoid", ""))
        open(os.path.join(d, "prompt.txt"), "w").write(txt)
        print("prompt", row["id"])


def cmd_order(a):
    n, _ = load(a)
    ids = [r["id"] for r in n["nouns"] if not os.path.exists(os.path.join(ROOT, "library-src", r["id"], "source.png"))]
    if not ids:
        print("nothing to order"); return
    order = ("Sprite lane, catalogue batch of %d images, one after another: for EACH id in [%s] read library-src/<id>/prompt.txt "
             "(the whole file; the reference it names is style only) and generate exactly that image, saving it as library-src/<id>/source.png, "
             "square, 1024x1024 or larger, flat uniform RGB 128,128,128 background at every pixel, zero shadow on the ground, key light from screen upper-left. "
             "Do not run the replicator; write nothing else. Print DONE <id> in this pane after each file, and DONE BATCH at the end." % (len(ids), ", ".join(ids)))
    open(os.path.join(os.path.dirname(a.nouns), "order.txt"), "w").write(order + "\n")
    subprocess.run(["tmux", "send-keys", "-t", "holoemitter-assets:0.0", "-l", order], check=True)
    time.sleep(1)
    subprocess.run(["tmux", "send-keys", "-t", "holoemitter-assets:0.0", "Enter"], check=True)
    print("ordered", len(ids), "images:", " ".join(ids))


def cmd_meshes(a):
    n, _ = load(a)
    py = os.path.join(a.venv, "bin", "python3")
    log = []
    for row in n["nouns"]:
        src = os.path.join(ROOT, "library-src", row["id"], "source.png")
        out = os.path.join(ROOT, "library", row["id"])
        if not os.path.exists(src):
            log.append((row["id"], "no source")); continue
        if os.path.exists(os.path.join(out, "model.glb")) and not a.redo:
            log.append((row["id"], "already")); continue
        t0 = time.time()
        od = os.path.join(SCRATCH, "cat", row["id"]); os.makedirs(od, exist_ok=True)
        r = subprocess.run([py, "run.py", src, "--output-dir", od, "--device", "cpu", "--model-save-format", "glb", "--mc-resolution", str(a.mc)],
                           cwd=os.path.join(SCRATCH, "TripoSR"), capture_output=True, text=True)
        raw = os.path.join(od, "0", "mesh.glb")
        if r.returncode != 0 or not os.path.exists(raw):
            log.append((row["id"], "triposr failed: " + r.stderr[-200:])); continue
        os.makedirs(out, exist_ok=True)
        dec = subprocess.run([py, "-c", f"""
import trimesh, numpy as np
from scipy.spatial import cKDTree
m = trimesh.load({raw!r}, force='mesh'); cols = m.visual.vertex_colors.copy() if m.visual.kind == 'vertex' else None
d = m.simplify_quadric_decimation(face_count={a.faces})
if cols is not None:
    d.visual = trimesh.visual.ColorVisuals(d, vertex_colors=cols[cKDTree(m.vertices).query(d.vertices)[1]])
d.export({os.path.join(out, "model.glb")!r}); print(len(m.faces), len(d.faces))
"""], capture_output=True, text=True)
        dims = row["dims_m"]
        gr = subprocess.run([py, os.path.join(ROOT, "tools", "mesh-ground.py"), os.path.join(out, "model.glb"), os.path.join(out, "model.glb"),
                             "--height-m", str(dims["h"]), "--up", "+z"], capture_output=True, text=True)
        ground = json.loads(gr.stdout) if gr.stdout.strip().startswith("{") else {"ok": False, "why": gr.stderr[-200:]}
        g = subprocess.run([sys.executable, os.path.join(ROOT, "tools", "mesh-gate.py"), os.path.join(out, "model.glb"),
                            "--height-m", str(dims["h"]), "--width-m", str(dims["w"]), "--depth-m", str(dims["d"]), "--max-tris", str(a.faces + 1000)],
                           capture_output=True, text=True)
        gate = json.loads(g.stdout) if g.stdout.strip().startswith("{") else {"ok": False, "failures": [g.stderr[-200:]]}
        rec = {"schema": "library-record/mesh/0.1", "id": row["id"], "noun": row["noun"], "dims_m": dims,
               "model": {"kind": "glb", "up": "+y", "grounded": bool(ground.get("ok")), "front": "-x", "colors": "vertex", "faces": a.faces},
               "gate": gate, "grounding": ground, "provenance": {"source": os.path.relpath(src, ROOT), "prompt": "template (tools/catalogue.py)",
                                            "generator": f"TripoSR on CPU, mc-resolution {a.mc}", "seconds": round(time.time() - t0, 1)}}
        json.dump(rec, open(os.path.join(out, "record.json"), "w"), indent=1)
        log.append((row["id"], ("PASS" if gate.get("ok") else "GATE FAIL " + "; ".join(gate.get("failures", []))) + f" {time.time() - t0:.0f}s tris {dec.stdout.strip()}"))
        print(log[-1], flush=True)
    json.dump(log, open(os.path.join(os.path.dirname(a.nouns), "meshes-log.json"), "w"), indent=1)
    for l in log: print(*l)


def cmd_sheet(a):
    from PIL import Image, ImageDraw
    n, _ = load(a)
    tiles = []
    for row in n["nouns"]:
        src = os.path.join(ROOT, "library-src", row["id"], "source.png")
        rec = os.path.join(ROOT, "library", row["id"], "record.json")
        im = Image.open(src).convert("RGB").resize((256, 256)) if os.path.exists(src) else Image.new("RGB", (256, 256), (40, 40, 40))
        status = json.load(open(rec))["gate"] if os.path.exists(rec) else None
        d = ImageDraw.Draw(im); d.rectangle([0, 232, 256, 256], fill=(20, 20, 20))
        d.text((6, 238), f"{row['id']}  {'PASS' if status and status.get('ok') else ('FAIL' if status else '—')}", fill=(236, 228, 210))
        tiles.append(im)
    cols = 4; rows = (len(tiles) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * 256, rows * 256), (20, 17, 14))
    for i, t in enumerate(tiles): sheet.paste(t, ((i % cols) * 256, (i // cols) * 256))
    sheet.save(a.out); print("sheet", a.out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["prompts", "order", "meshes", "sheet"])
    ap.add_argument("--nouns", required=True)
    ap.add_argument("--venv", default=os.path.join(SCRATCH, "venv"))
    ap.add_argument("--mc", type=int, default=256)
    ap.add_argument("--faces", type=int, default=16000)
    ap.add_argument("--redo", action="store_true")
    ap.add_argument("--out", default=os.path.join(ROOT, "lab", "catalogue", "sheet.png"))
    a = ap.parse_args()
    {"prompts": cmd_prompts, "order": cmd_order, "meshes": cmd_meshes, "sheet": cmd_sheet}[a.cmd](a)


if __name__ == "__main__":
    main()
