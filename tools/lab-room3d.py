#!/usr/bin/env python3
"""lab/room3d: the pack's plan as a walkable first-person world, no painter.

Experiment one of the inversion (Kabe, 2026-09-02): the engine owns geometry,
the generator owns appearance. Every wall, dado, chrome strip, door opening
and open edge here is a pure function of packs/<pack>/plan.json; every colour
is SAMPLED from the paintings already promoted (the room's nearest close
wall, fixed row bands), so the page costs zero rolls and zero LLM calls to build.

  python3 tools/lab-room3d.py [--pack liner-3] [--out lab/room3d/index.html]
"""
import argparse
import json
import os

import base64
import io

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# row bands of the declared close camera (1536x1024, ceiling 53, rail 522,
# floor 778): where each surface is, on every promoted close painting
BANDS = {"ceiling": (6, 46), "upper": (150, 480), "strip": (521, 525),
         "lower": (560, 740), "skirting": (760, 776), "floor": (850, 1000)}
COLS = (400, 1136)


def sample(png):
    a = np.asarray(Image.open(png).convert("RGB")).astype(float)
    out = {}
    for k, (y0, y1) in BANDS.items():
        if k == "strip":
            # the chrome strip is read where the rail reader reads it: the
            # brightest row of the rail band (paintings put it at 519-528)
            rows = a[512:532, COLS[0]:COLS[1]]
            y = int(np.argmax(rows.mean(axis=(1, 2))))
            med = np.median(rows[y], axis=0)
        else:
            med = np.median(a[y0:y1, COLS[0]:COLS[1]].reshape(-1, 3), axis=0)
        out[k] = "#%02x%02x%02x" % tuple(int(round(v)) for v in med)
    return out


def close_painting(room):
    """The room's nearest promoted wall: a CLOSE painting, never a deep
    facing (saloon/N is the far wall two cells off; its rows are not the
    room's own surfaces)."""
    best = None
    for f in "NSEW":
        meta = os.path.join(ROOT, "backdrops", room, f + ".meta.json")
        if not os.path.exists(meta):
            continue
        d = float(json.load(open(meta)).get("camera_wall_m") or 1e9)
        if best is None or d < best[0]:
            best = (d, os.path.join(ROOT, "backdrops", room, f + ".png"))
    return best[1] if best else None


# experiment two: what stands in the rooms. A placement RULE per prop, not a
# hand-set coordinate: the same rule places the same asset in any plan.
FURNISH = [
    # writing room, west wall: B (TripoSR) and D (Objaverse retrieval); A and C tossed by Kabe 2026-09-02
    {"id": "chair-liner-1934-mesh", "room": "writing_room", "rule": "against_wall", "wall": "W", "slot": -0.6, "label": "B · TripoSR (generated mesh)"},
    {"id": "chair-objaverse-1", "room": "writing_room", "rule": "against_wall", "wall": "W", "slot": 0.6, "label": "D · Objaverse retrieval"},
    # the saloon scene: a unique element the catalogue cannot have (generated) beside a retrieved companion
    {"id": "telegraph-liner-1934-engine-order", "room": "saloon", "rule": "room_centre", "label": "E · engine-order telegraph (generated: a catalogue miss)"},
    {"id": "settee-objaverse-1", "room": "saloon", "rule": "against_wall", "wall": "W", "label": "F · settee (Objaverse retrieval)"},
]


def factory_of(asset_id):
    """The library's procedural factory for an asset id, or None with why.
    A factory is an ES module (`library/<id>/factory.js`) exporting one
    function that returns a THREE.Group in metres, feet on y=0, front +z;
    it ships inline in the page. The record's declared dims place it."""
    d = os.path.join(ROOT, "library", asset_id)
    rec, js, glb = os.path.join(d, "record.json"), os.path.join(d, "factory.js"), os.path.join(d, "model.glb")
    if not os.path.exists(rec):
        return None, "not in the library"
    r = json.load(open(rec))
    dims = dict(r.get("dims_m") or {})
    # the STOOD object's own footprint wins over the declared one: a retrieved sofa is whatever size it is
    sz = ((r.get("model") or {}).get("size_m")) or ((r.get("grounding") or {}).get("size_m"))
    if sz and len(sz) == 3:
        dims = {"h": dims.get("h") or sz[1], "w": sz[0], "d": sz[2]}
    prim = os.path.join(d, "primitives.json")
    if os.path.exists(prim):
        pj = json.load(open(prim))
        return {"id": asset_id, "noun": r.get("noun"),
                "height_m": float(dims.get("h") or 1.0), "width_m": float(dims.get("w") or 0.5), "depth_m": float(dims.get("d") or 0.5),
                "primitives": pj}, None
    if os.path.exists(glb) and not os.path.exists(js):
        # a generated mesh: ships inline as base64; the page scales it to the
        # declared height, stands it on the floor and turns it to face the room
        raw = open(glb, "rb").read()
        return {
            "id": asset_id, "noun": r.get("noun"),
            "height_m": float(dims.get("h") or 1.0), "width_m": float(dims.get("w") or 0.5), "depth_m": float(dims.get("d") or 0.5),
            "glb": "data:model/gltf-binary;base64," + base64.b64encode(raw).decode("ascii"),
            "glb_front": (r.get("model") or {}).get("front", "+z"),
            "glb_up": (r.get("model") or {}).get("up", "+y"),
            "glb_grounded": bool((r.get("model") or {}).get("grounded")),
        }, None
    if not os.path.exists(js):
        return None, "in the library as a sprite only, no factory, model.glb or primitives.json"
    src = open(js).read()
    # the module must import three by the bare specifier the importmap maps
    # the factory is the module's DEFAULT export, else its first exported function
    export = None
    for line in src.splitlines():
        if line.startswith("export default ") and line.rstrip().endswith(";"):
            export = line.split("export default ", 1)[1].rstrip(";").strip()
            break
    if not export:
        for line in src.splitlines():
            if line.startswith("export function ") or line.startswith("export async function "):
                export = line.split("function ", 1)[1].split("(", 1)[0].strip()
                break
    if not export:
        return None, "factory.js exports no function"
    return {
        "id": asset_id, "noun": r.get("noun"),
        "height_m": float(dims.get("h") or 1.0),
        "width_m": float(dims.get("w") or 0.5),
        "depth_m": float(dims.get("d") or 0.5),
        "export": export, "module": src,
    }, None


def furnish(plan):
    rooms = {r["id"]: r for r in plan["rooms"]}
    out = []
    for f in FURNISH:
        a, why = factory_of(f["id"])
        if a is None:
            out.append({"id": f["id"], "room": f["room"], "missing": why, "label": f.get("label", f["id"])})
            continue
        R = rooms[f["room"]]["rect"]
        if f["rule"] == "room_centre":
            x, y = (R["x0"] + R["x1"]) / 2 + f.get("slot", 0.0), (R["y0"] + R["y1"]) / 2
            out.append({**{k: v for k, v in a.items() if k != "module"}, "room": f["room"], "x": round(x, 3), "y": round(y, 3),
                        "facing": f.get("facing", "S"), "rule": "room_centre", "label": f.get("label", f["id"])})
            continue
        if f["rule"] == "against_wall":
            # centred on the wall, its back 5 cm off it, clear of any opening
            # on that wall (a door pushes it sideways past the opening)
            gap = 0.05 + a["depth_m"] / 2
            if f["wall"] == "W": x, y = R["x0"] + gap, (R["y0"] + R["y1"]) / 2
            elif f["wall"] == "E": x, y = R["x1"] - gap, (R["y0"] + R["y1"]) / 2
            elif f["wall"] == "S": x, y = (R["x0"] + R["x1"]) / 2, R["y0"] + gap
            else: x, y = (R["x0"] + R["x1"]) / 2, R["y1"] - gap
            for o in plan["openings"]:
                if f["room"] not in o.get("joins", []):
                    continue
                rr = o["rect"]
                if f["wall"] in "NS" and abs((rr["y0"] if f["wall"] == "N" else rr["y1"]) - (R["y1"] if f["wall"] == "N" else R["y0"])) < 1e-3 \
                        and rr["x0"] - a["width_m"] < x < rr["x1"] + a["width_m"]:
                    x = rr["x1"] + a["width_m"]
                if f["wall"] in "EW" and abs((rr["x0"] if f["wall"] == "E" else rr["x1"]) - (R["x1"] if f["wall"] == "E" else R["x0"])) < 1e-3 \
                        and rr["y0"] - a["width_m"] < y < rr["y1"] + a["width_m"]:
                    y = rr["y1"] + a["width_m"]
            if f["wall"] in "EW": y += f.get("slot", 0.0)
            else: x += f.get("slot", 0.0)
            facing = {"W": "E", "E": "W", "S": "N", "N": "S"}[f["wall"]]
            out.append({**{k: v for k, v in a.items() if k != "module"}, "room": f["room"], "x": round(x, 3), "y": round(y, 3),
                        "facing": facing, "rule": f"{f['rule']} {f['wall']}", "label": f.get("label", f["id"])})
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pack", default="liner-3")
    ap.add_argument("--out", default=os.path.join(ROOT, "lab", "room3d", "index.html"))
    a = ap.parse_args()
    plan = json.load(open(os.path.join(ROOT, "packs", a.pack, "plan.json")))
    pack = json.load(open(os.path.join(ROOT, "packs", a.pack, "pack.json")))
    palette, provenance = {}, {}
    for r in plan["rooms"]:
        src = close_painting(r["id"])
        if src and os.path.exists(src):
            palette[r["id"]] = sample(src)
            provenance[r["id"]] = os.path.relpath(src, ROOT)
    props = furnish(plan)
    world = {
        "pack": a.pack,
        "props": props,
        "title": pack.get("title") or pack.get("name") or a.pack,
        "storey_m": plan["floors"][0]["storey_height_m"],
        "rail_m": 1.2,
        "eye_m": 1.17,
        "rooms": [{"id": r["id"], "name": r["name"], "rect": r["rect"]} for r in plan["rooms"]],
        "openings": [{"id": o["id"], "kind": o["kind"], "rect": o["rect"], "joins": o["joins"]}
                     for o in plan["openings"]],
        "door_head_m": 2.1,
        "entrance": plan.get("entrance"),
        "palette": palette,
        "provenance": provenance,
    }
    mods = []
    for f in FURNISH:
        fa, _ = factory_of(f["id"])
        if fa and "module" in fa:
            mods.append('<script type="module">\n' + fa["module"].rstrip() +
                        f'\nwindow.__factories = window.__factories || {{}}; window.__factories[{json.dumps(fa["id"])}] = {fa["export"]};\n</script>')
    body = TEMPLATE.replace("__WORLD_JSON__", json.dumps(world)).replace("__FACTORY_MODULES__", "\n".join(mods))
    # the served page is a whole document; the artifact copy is the bare
    # fragment (the artifact viewer wraps it in its own head and body)
    html = ("<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n"
            "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">\n"
            + body.split("<style>", 1)[0] + "<style>" + body.split("<style>", 1)[1].split("</style>", 1)[0] + "</style>\n</head>\n<body>\n"
            + body.split("</style>", 1)[1] + "\n</body>\n</html>\n")
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    with open(a.out, "w") as fh:
        fh.write(html)
    frag = os.path.join(os.path.dirname(a.out), "fragment.html")
    with open(frag, "w") as fh:
        fh.write(body)
    print(json.dumps({"ok": True, "out": os.path.relpath(a.out, ROOT), "rooms": len(world["rooms"]),
                      "openings": len(world["openings"]), "palette": palette}))


TEMPLATE = r"""<title>Meridian Deck Walk</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@300;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
  :root { --ink: #ece4d2; --ink-dim: #a89e88; --panel: rgba(22, 19, 16, 0.78); --line: rgba(236, 228, 210, 0.22); --brass: #c9a961; }
  html, body { height: 100%; margin: 0; background: #14110e; color: var(--ink); overflow: hidden;
    font-family: "IBM Plex Mono", ui-monospace, Menlo, monospace; font-size: 13px; }
  canvas { display: block; }
  .hud { position: fixed; inset: 0; pointer-events: none; display: grid; grid-template-rows: auto 1fr auto; padding: 18px; gap: 12px; }
  .hud > * { pointer-events: none; }
  .top { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
  .room { background: var(--panel); border: 1px solid var(--line); padding: 12px 16px 10px; min-width: 220px; }
  .room .eyebrow { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-dim); }
  .room .name { font-family: "Josefin Sans", "Futura", sans-serif; font-weight: 600; font-size: 24px; letter-spacing: 0.08em; text-transform: uppercase; margin-top: 4px; color: var(--brass); text-wrap: balance; }
  .pos { background: var(--panel); border: 1px solid var(--line); padding: 10px 14px; font-variant-numeric: tabular-nums; color: var(--ink-dim); text-align: right; line-height: 1.6; }
  .pos b { color: var(--ink); font-weight: 500; }
  .bottom { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; }
  .keys { background: var(--panel); border: 1px solid var(--line); padding: 10px 14px; color: var(--ink-dim); line-height: 1.7; }
  .keys kbd { font-family: inherit; color: var(--ink); border: 1px solid var(--line); padding: 0 5px; border-radius: 2px; }
  .prov { background: var(--panel); border: 1px solid var(--line); padding: 10px 14px; color: var(--ink-dim); max-width: 44ch; line-height: 1.55; }
  .prov b { color: var(--ink); font-weight: 500; }
  #gate { position: fixed; left: 50%; top: 18px; transform: translateX(-50%); cursor: pointer; z-index: 2; border: 1px solid var(--brass); padding: 12px 22px; background: var(--panel); text-align: center; }
  #gate .t { font-family: "Josefin Sans", "Futura", sans-serif; font-weight: 300; font-size: 20px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--brass); }
  #gate .s { margin-top: 4px; color: var(--ink-dim); }
  #gate:focus-visible { outline: 2px solid var(--brass); outline-offset: 3px; }
  #status { position: fixed; inset: 0; display: grid; place-items: center; background: #14110e; z-index: 3; text-align: center; padding: 24px; }
  #status .t { font-family: "Josefin Sans", "Futura", sans-serif; font-weight: 300; font-size: 26px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--brass); }
  #status .s { margin-top: 12px; color: var(--ink-dim); max-width: 52ch; line-height: 1.6; }
  #status .s b { color: var(--ink); font-weight: 500; }
  #status[hidden], #gate[hidden] { display: none !important; }
  @media (max-width: 640px) { .hud { padding: 10px; font-size: 11px; } .room { min-width: 0; padding: 8px 10px 6px; } .room .name { font-size: 16px; } .prov { display: none; } #gate { top: 70px; } }
  @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
</style>
<div id="status"><div><div class="t">SS Meridian · C Deck</div><div class="s" id="statusText">loading the engine…</div></div></div>
<div id="gate" tabindex="0"><div class="t">click to walk</div><div class="s">esc releases the mouse · or drag to look</div></div>
<div class="hud">
  <div class="top">
    <div class="room"><div class="eyebrow">you are in</div><div class="name" id="roomName">—</div></div>
    <div class="pos" id="pos">x <b>0.0</b> m &nbsp; y <b>0.0</b> m<br>facing <b>N</b></div>
  </div>
  <div></div>
  <div class="bottom">
    <div class="keys"><kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> walk &nbsp; mouse look &nbsp; <kbd>shift</kbd> stride &nbsp; <kbd>Q</kbd> <kbd>E</kbd> turn &nbsp; <kbd>V</kbd> contract camera</div>
    <div class="prov" id="prov"></div>
  </div>
</div>
<script>
  // fail loudly: a black page says nothing, a sentence says what to fix
  window.__fail = (why) => { const s = document.getElementById("status"); s.hidden = false; s.querySelector("#statusText").innerHTML = why; };
  window.addEventListener("error", (e) => { if (!window.__ok) window.__fail("the page hit an error before the first frame: <b>" + (e.message || e.type) + "</b>"); });
  setTimeout(() => { if (!window.__ok && !window.__failed) window.__fail("the engine module did not arrive from cdnjs.cloudflare.com within 15 s. A content blocker, an offline tab or a browser without import maps is the usual cause; reload once it is reachable."); }, 15000);
</script>
<script type="importmap">{"imports": {"three": "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.min.js", "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"}}</script>
__FACTORY_MODULES__
<script type="module">
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
const WORLD = __WORLD_JSON__;
(function () {
  const c = document.createElement("canvas");
  const gl = c.getContext("webgl2") || c.getContext("webgl") || c.getContext("experimental-webgl");
  if (!gl) { window.__failed = true; window.__fail("this browser refused a WebGL context, so there is nothing to draw with. Enable hardware acceleration / WebGL, or open the page outside the embedded viewer."); throw new Error("no WebGL"); }
})();
const EPS = 1e-6;
// plan: metres, north = +y.  three: y up, so plan y -> -z (north is -z, the camera's default look).
const P = (x, y) => new THREE.Vector3(x, 0, -y);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x14110e);
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 80);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
document.body.prepend(renderer.domElement);

const H = WORLD.storey_m, RAIL = WORLD.rail_m, HEAD = WORLD.door_head_m, T = 0.1;
const mats = {};
function mat(room, part) {
  const key = room + "/" + part;
  if (mats[key]) return mats[key];
  const pal = WORLD.palette[room] || Object.values(WORLD.palette)[0];
  const c = new THREE.Color(pal[part]);
  const m = part === "strip"
    ? new THREE.MeshStandardMaterial({ color: c, metalness: 0.9, roughness: 0.25 })
    : new THREE.MeshStandardMaterial({ color: c, metalness: 0.0, roughness: part === "floor" ? 0.95 : 0.55 });
  mats[key] = m;
  return m;
}
function box(room, part, x0, x1, y0, y1, z0, z1) {
  // x, y: plan metres; z: height metres
  const g = new THREE.BoxGeometry(x1 - x0, z1 - z0, y1 - y0);
  const m = new THREE.Mesh(g, mat(room, part));
  m.position.set((x0 + x1) / 2, (z0 + z1) / 2, -(y0 + y1) / 2);
  scene.add(m);
}
// one wall run along u in [a, b] at v (the room's edge), thickness T outward;
// openings: [{u0, u1, head}] with head = the lintel height (H for an open edge)
function wallRun(room, axis, v, out, a, b, openings) {
  const place = (u0, u1, z0, z1, part, protrude) => {
    const pv0 = out > 0 ? v - (protrude || 0) : v - T - 0; // wall body: from the edge outward
    const pv1 = out > 0 ? v + T : v + (protrude || 0);
    if (axis === "x") box(room, part, u0, u1, pv0, pv1, z0, z1);
    else box(room, part, pv0, pv1, u0, u1, z0, z1);
  };
  const full = (u0, u1) => {
    if (u1 - u0 < EPS) return;
    place(u0, u1, 0, RAIL, "lower");
    place(u0, u1, RAIL, H, "upper");
    place(u0, u1, RAIL - 0.02, RAIL + 0.02, "strip", 0.015);
    place(u0, u1, 0, 0.09, "skirting", 0.008);
  };
  let u = a;
  for (const o of openings.slice().sort((p, q) => p.u0 - q.u0)) {
    full(u, Math.max(u, o.u0));
    if (o.head < H - EPS) place(o.u0, o.u1, o.head, H, "upper");
    u = Math.max(u, o.u1);
  }
  full(u, b);
}
const on = (p, q) => Math.abs(p - q) < 1e-3;
for (const r of WORLD.rooms) {
  const R = r.rect;
  const sides = [
    { axis: "x", v: R.y1, out: +1, a: R.x0, b: R.x1, hit: o => on(o.rect.y0, R.y1) && o.rect.x0 < R.x1 - EPS && o.rect.x1 > R.x0 + EPS, span: o => [o.rect.x0, o.rect.x1] },
    { axis: "x", v: R.y0, out: -1, a: R.x0, b: R.x1, hit: o => on(o.rect.y1, R.y0) && o.rect.x0 < R.x1 - EPS && o.rect.x1 > R.x0 + EPS, span: o => [o.rect.x0, o.rect.x1] },
    { axis: "y", v: R.x1, out: +1, a: R.y0, b: R.y1, hit: o => on(o.rect.x0, R.x1) && o.rect.y0 < R.y1 - EPS && o.rect.y1 > R.y0 + EPS, span: o => [o.rect.y0, o.rect.y1] },
    { axis: "y", v: R.x0, out: -1, a: R.y0, b: R.y1, hit: o => on(o.rect.x1, R.x0) && o.rect.y0 < R.y1 - EPS && o.rect.y1 > R.y0 + EPS, span: o => [o.rect.y0, o.rect.y1] },
  ];
  for (const s of sides) {
    const ops = WORLD.openings.filter(o => o.joins.includes(r.id) && s.hit(o)).map(o => {
      const [u0, u1] = s.span(o);
      return { u0: Math.max(s.a, u0), u1: Math.min(s.b, u1), head: o.kind === "door" ? HEAD : H };
    });
    wallRun(r.id, s.axis, s.v, s.out, s.a, s.b, ops);
  }
  // floor and ceiling
  const fg = new THREE.PlaneGeometry(R.x1 - R.x0, R.y1 - R.y0);
  const floor = new THREE.Mesh(fg, mat(r.id, "floor"));
  floor.rotation.x = -Math.PI / 2; floor.position.copy(P((R.x0 + R.x1) / 2, (R.y0 + R.y1) / 2)); scene.add(floor);
  const ceil = new THREE.Mesh(fg.clone(), mat(r.id, "ceiling"));
  ceil.rotation.x = Math.PI / 2; ceil.position.copy(P((R.x0 + R.x1) / 2, (R.y0 + R.y1) / 2)); ceil.position.y = H; scene.add(ceil);
  // cove light: warm points under the ceiling, one per ~3.2 m of wall
  const nx = Math.max(1, Math.round((R.x1 - R.x0) / 3.2)), ny = Math.max(1, Math.round((R.y1 - R.y0) / 3.2));
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    const lx = R.x0 + (i + 0.5) * (R.x1 - R.x0) / nx, ly = R.y0 + (j + 0.5) * (R.y1 - R.y0) / ny;
    const l = new THREE.PointLight(0xffd9a8, 16, 14, 2); l.position.copy(P(lx, ly)); l.position.y = H - 0.25; scene.add(l);
  }
}
scene.add(new THREE.HemisphereLight(0xfff1dc, 0x2a1a10, 0.75));

// props: the library's procedural factories (inline modules registered on
// window.__factories), placed by the generator's rule, turned to face the room
const FACING_YAW = { N: 0, E: -Math.PI / 2, S: Math.PI, W: Math.PI / 2 };   // a factory's front is +z (south); turn it to face `facing`
const placeProp = (g, pr) => {
  g.position.copy(P(pr.x, pr.y));
  g.rotation.y = Math.PI + FACING_YAW[pr.facing];
  g.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
  scene.add(g);
};
// primitive JSON (LLM-Primitives' representation): cubes, cylinders, spheres with a material each
function buildPrimitives(pj) {
  const g = new THREE.Group();
  const mats = {};
  for (const [k, m] of Object.entries(pj.materials || {})) mats[k] = new THREE.MeshStandardMaterial({ color: new THREE.Color(m.color), roughness: m.roughness ?? 0.6, metalness: m.metalness ?? 0 });
  for (const p of pj.parts) {
    let geo;
    const sc = p.scale || [1, 1, 1];
    if (p.type === "cylinder") geo = new THREE.CylinderGeometry(sc[0], sc[0], sc[1], 24), geo.scale(1, 1, sc[2] / sc[0]);
    else if (p.type === "sphere") geo = new THREE.SphereGeometry(0.5, 24, 16), geo.scale(sc[0], sc[1], sc[2]);
    else { geo = new THREE.BoxGeometry(sc[0], sc[1], sc[2], 1, 4, 1);
      if (p.taper !== undefined) {           // narrower at the foot: a leg
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) { const t = (pos.getY(i) / sc[1]) + 0.5; const f = p.taper + (1 - p.taper) * t; pos.setX(i, pos.getX(i) * f); pos.setZ(i, pos.getZ(i) * f); }
        geo.computeVertexNormals();
      }
      if (p.curve) {                          // a gentle concave bend across the width: a chair back
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) { const u = pos.getX(i) / sc[0]; pos.setZ(i, pos.getZ(i) - p.curve * (1 - 4 * u * u)); }
        geo.computeVertexNormals();
      }
    }
    const mesh = new THREE.Mesh(geo, mats[p.material] || new THREE.MeshStandardMaterial({ color: 0x888888 }));
    mesh.position.fromArray(p.position || [0, 0, 0]);
    if (p.rotation) mesh.rotation.set(p.rotation[0], p.rotation[1], p.rotation[2]);
    mesh.name = p.name || p.type;
    g.add(mesh);
  }
  return g;
}
const legend = WORLD.props.map(pr => `${pr.label}${pr.missing ? " — " + pr.missing : ""}`).join("<br>");
const gltf = new GLTFLoader();
for (const pr of WORLD.props) {
  if (pr.missing) continue;
  if (pr.primitives) { placeProp(buildPrimitives(pr.primitives), pr); continue; }
  if (pr.glb) {
    // a generated mesh at arbitrary scale: fit its height to the declared one, feet on the floor, footprint centred
    fetch(pr.glb).then(r => r.arrayBuffer()).then(buf => gltf.parse(buf, "", (res) => {
      const g = new THREE.Group(); const m = new THREE.Group(); m.add(res.scene);
      if (pr.glb_grounded) {                                            // tools/mesh-ground.py already stood it level on y=0, in metres
        if (pr.glb_front === "-z") m.rotation.y = Math.PI; else if (pr.glb_front === "+x") m.rotation.y = Math.PI / 2; else if (pr.glb_front === "-x") m.rotation.y = -Math.PI / 2;
        m.traverse(o => { if (o.isMesh && o.material) { o.material.side = THREE.DoubleSide; } });
        g.add(m); placeProp(g, pr); return;
      }
      if (pr.glb_up === "+z") res.scene.rotation.x = -Math.PI / 2;      // a z-up mesh stood up
      const box = new THREE.Box3().setFromObject(m); const size = new THREE.Vector3(); box.getSize(size);
      const s = pr.height_m / Math.max(1e-6, size.y);
      m.scale.setScalar(s);
      const b2 = new THREE.Box3().setFromObject(m); const c = new THREE.Vector3(); b2.getCenter(c);
      // ground on the mesh's low PERCENTILE of vertex heights, not its single lowest point: a
      // generated blob has one leg a little longer than the rest, and min.y leaves three feet in the air
      m.updateMatrixWorld(true);
      const ys = []; const v = new THREE.Vector3();
      m.traverse(o => { if (o.isMesh) { const pos = o.geometry.attributes.position; const step = Math.max(1, Math.floor(pos.count / 20000));
        for (let i = 0; i < pos.count; i += step) { v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld); ys.push(v.y); } } });
      ys.sort((a, b) => a - b);
      const ground = ys.length ? ys[Math.floor(ys.length * 0.012)] : b2.min.y;
      m.position.set(-c.x, -ground, -c.z);
      if (pr.glb_front === "-z") m.rotation.y = Math.PI; else if (pr.glb_front === "+x") m.rotation.y = Math.PI / 2; else if (pr.glb_front === "-x") m.rotation.y = -Math.PI / 2;
      // a single-image mesh can arrive with either winding: draw both faces
      m.traverse(o => { if (o.isMesh && o.material) { o.material.side = THREE.DoubleSide; } });
      g.add(m); placeProp(g, pr);
    }, (e) => console.error("glb", pr.id, e)));
    continue;
  }
  const make = (window.__factories || {})[pr.id];
  if (!make) continue;
  placeProp(make(), pr);
}
// the walker's own body, so the third-person camera has a scale to read against
const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 1.3, 4, 10),
  new THREE.MeshStandardMaterial({ color: 0x2b2420, roughness: 0.9 }));
body.visible = false; scene.add(body);

// where you may stand: rooms inset from their walls, plus a corridor through every opening
const INSET = 0.35;
const zones = WORLD.rooms.map(r => ({ x0: r.rect.x0 + INSET, x1: r.rect.x1 - INSET, y0: r.rect.y0 + INSET, y1: r.rect.y1 - INSET }));
for (const o of WORLD.openings) {
  const R = o.rect, vert = R.x1 - R.x0 < R.y1 - R.y0;   // a vertical (NS-running) edge or an EW-axis door
  const w = o.kind === "door" ? 0.28 : INSET;
  if (vert) zones.push({ x0: R.x0 - INSET - 0.05, x1: R.x1 + INSET + 0.05, y0: R.y0 + w, y1: R.y1 - w });
  else zones.push({ x0: R.x0 + w, x1: R.x1 - w, y0: R.y0 - INSET - 0.05, y1: R.y1 + INSET + 0.05 });
}
const blocks = WORLD.props.filter(pr => !pr.missing && pr.rule === "room_centre").map(pr => ({ x0: pr.x - pr.width_m / 2 - 0.25, x1: pr.x + pr.width_m / 2 + 0.25, y0: pr.y - pr.depth_m / 2 - 0.25, y1: pr.y + pr.depth_m / 2 + 0.25 }));
const inside = (x, y) => zones.some(z => x >= z.x0 && x <= z.x1 && y >= z.y0 && y <= z.y1) && !blocks.some(b => x > b.x0 && x < b.x1 && y > b.y0 && y < b.y1);
const roomAt = (x, y) => WORLD.rooms.find(r => x >= r.rect.x0 && x <= r.rect.x1 && y >= r.rect.y0 && y <= r.rect.y1);

// the walker
const start = WORLD.rooms.find(r => r.id === WORLD.entrance) || WORLD.rooms[0];
let px = (start.rect.x0 + start.rect.x1) / 2, py = (start.rect.y0 + start.rect.y1) / 2;
let yaw = 0, pitch = 0;      // yaw 0 = facing north (+y plan, -z three)
// ?face=W&view=contract&x=..&y=.. opens the page already placed and turned (links for grading)
const Q = new URLSearchParams(location.search);
if (Q.get("face")) yaw = { N: 0, W: Math.PI / 2, S: Math.PI, E: -Math.PI / 2 }[Q.get("face").toUpperCase()] ?? 0;
if (Q.get("x") && Q.get("y") && inside(+Q.get("x"), +Q.get("y"))) { px = +Q.get("x"); py = +Q.get("y"); }
const keys = {};
// V: the contract camera (front-three-quarter at 1.83 m, pitched 8 deg down, 24 mm) following behind
let view = new URLSearchParams(location.search).get("view") === "contract" ? "contract" : "first";
const VFOV_FIRST = 70, HFOV_24MM = 2 * Math.atan(18 / 24) * 180 / Math.PI;
addEventListener("keydown", e => {
  keys[e.code] = true;
  if (e.code === "KeyV") view = view === "first" ? "contract" : "first";
  if (e.code === "KeyQ") yaw += Math.PI / 12;      // turn left 15 deg, keyboard-only viewers
  if (e.code === "KeyE") yaw -= Math.PI / 12;
});
addEventListener("keyup", e => { keys[e.code] = false; });
const gate = document.getElementById("gate");
const lock = () => { try { const p = renderer.domElement.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (_) {} };
gate.addEventListener("click", lock);
gate.addEventListener("keydown", e => { if (e.code === "Enter" || e.code === "Space") lock(); });
document.addEventListener("pointerlockchange", () => { gate.hidden = document.pointerLockElement === renderer.domElement; });
const look = (mx, my) => { yaw -= mx * 0.0022; pitch -= my * 0.0022; pitch = Math.max(-1.4, Math.min(1.4, pitch)); };
document.addEventListener("mousemove", e => { if (document.pointerLockElement === renderer.domElement) look(e.movementX, e.movementY); });
// touch and no-pointer-lock viewers: the left half of the screen is a
// walking stick (drag from where you touched), the right half looks
const stick = { id: null, ox: 0, oy: 0, dx: 0, dy: 0 };
let lookDrag = null;
const isTouch = matchMedia("(pointer: coarse)").matches;
if (isTouch) { document.querySelector(".keys").innerHTML = "left thumb walks &nbsp; right thumb looks"; gate.querySelector(".t").textContent = "touch to walk"; gate.querySelector(".s").textContent = "left thumb walks, right thumb looks"; }
renderer.domElement.addEventListener("pointerdown", e => {
  renderer.domElement.setPointerCapture(e.pointerId);
  if (e.pointerType === "touch" && e.clientX < innerWidth / 2 && stick.id === null) { stick.id = e.pointerId; stick.ox = e.clientX; stick.oy = e.clientY; stick.dx = stick.dy = 0; return; }
  lookDrag = { id: e.pointerId, x: e.clientX, y: e.clientY };
  if (e.pointerType === "mouse" && document.pointerLockElement !== renderer.domElement) lock();
});
renderer.domElement.addEventListener("pointermove", e => {
  if (e.pointerId === stick.id) { stick.dx = Math.max(-60, Math.min(60, e.clientX - stick.ox)); stick.dy = Math.max(-60, Math.min(60, e.clientY - stick.oy)); return; }
  if (lookDrag && e.pointerId === lookDrag.id && document.pointerLockElement !== renderer.domElement) { look((e.clientX - lookDrag.x) * 1.6, (e.clientY - lookDrag.y) * 1.6); lookDrag.x = e.clientX; lookDrag.y = e.clientY; }
});
const release = e => { if (e.pointerId === stick.id) { stick.id = null; stick.dx = stick.dy = 0; } if (lookDrag && e.pointerId === lookDrag.id) lookDrag = null; };
renderer.domElement.addEventListener("pointerup", release);
renderer.domElement.addEventListener("pointercancel", release);
renderer.domElement.style.touchAction = "none";
addEventListener("resize", () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

const roomName = document.getElementById("roomName"), pos = document.getElementById("pos");
const COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
let last = performance.now(), lastRoom = null;
function step(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  const speed = (keys.ShiftLeft || keys.ShiftRight) ? 3.2 : 1.6;
  // forward in plan coords: yaw 0 -> +y
  const fx = -Math.sin(yaw), fy = Math.cos(yaw), rx = Math.cos(yaw), ry = Math.sin(yaw);
  let dx = 0, dy = 0;
  if (keys.KeyW || keys.ArrowUp) { dx += fx; dy += fy; }
  if (keys.KeyS || keys.ArrowDown) { dx -= fx; dy -= fy; }
  if (keys.KeyD || keys.ArrowRight) { dx += rx; dy += ry; }
  if (keys.KeyA || keys.ArrowLeft) { dx -= rx; dy -= ry; }
  if (stick.id !== null) { const k = 1 / 60; dx += (fx * -stick.dy + rx * stick.dx) * k; dy += (fy * -stick.dy + ry * stick.dx) * k; }
  const n = Math.hypot(dx, dy);
  if (n > 0) {
    const amt = Math.min(1, n);
    dx = dx / n * amt * speed * dt; dy = dy / n * amt * speed * dt;
    if (inside(px + dx, py)) px += dx;      // slide along walls
    if (inside(px, py + dy)) py += dy;
  }
  if (view === "first") {
    camera.fov = VFOV_FIRST; camera.updateProjectionMatrix();
    camera.position.copy(P(px, py)); camera.position.y = WORLD.eye_m;
    camera.rotation.set(0, 0, 0, "YXZ"); camera.rotation.y = yaw; camera.rotation.x = pitch;
    body.visible = false;
  } else {
    // 24 mm on the 36 mm frame is the horizontal field; three.js takes the vertical one
    camera.fov = 2 * Math.atan(Math.tan(HFOV_24MM / 2 * Math.PI / 180) / camera.aspect) * 180 / Math.PI; camera.updateProjectionMatrix();
    let dist = 3.0;                                          // the contract's "roughly 3 metres away"
    while (dist > 0.6 && !inside(px - fx * dist, py - fy * dist)) dist -= 0.1;
    // over the right shoulder, so the walker's own body never hides what is straight ahead
    camera.position.copy(P(px - fx * dist + rx * 0.7, py - fy * dist + ry * 0.7)); camera.position.y = 1.83;
    camera.rotation.set(0, 0, 0, "YXZ"); camera.rotation.y = yaw; camera.rotation.x = -8 * Math.PI / 180;
    body.visible = !Q.get("view"); body.position.copy(P(px, py)); body.position.y = 0.83;   // a grading link shows the wall, not the walker
  }
  const r = roomAt(px, py);
  if (r !== lastRoom) { roomName.textContent = r ? r.name : "—"; lastRoom = r;
    const prov = WORLD.provenance[r && r.id];
    const here = r ? WORLD.props.filter(pr => pr.room === r.id) : [];
    const chairs = here.length ? `<br><br>in this room:<br>${here.map(pr => `${pr.label} — ${pr.rule}${pr.missing ? " — " + pr.missing : ""}`).join("<br>")}` : "";
    document.getElementById("prov").innerHTML = prov
      ? `walls, dado, strip, carpet and ceiling are the plan's geometry; their colours are the medians of <b>${prov}</b> in fixed row bands. No painter, no prompt.${chairs}`
      : "";
  }
  const hd = ((-yaw * 180 / Math.PI) % 360 + 360) % 360;
  pos.innerHTML = `x <b>${px.toFixed(1)}</b> m &nbsp; y <b>${py.toFixed(1)}</b> m<br>facing <b>${COMPASS[Math.round(hd / 45) % 8]}</b>`;
  renderer.render(scene, camera);
  if (!window.__ok) { window.__ok = true; document.getElementById("status").hidden = true; }
  requestAnimationFrame(step);
}
requestAnimationFrame(step);
</script>
"""

if __name__ == "__main__":
    main()
