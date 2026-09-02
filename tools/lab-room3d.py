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
    world = {
        "pack": a.pack,
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
    html = TEMPLATE.replace("__WORLD_JSON__", json.dumps(world))
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    with open(a.out, "w") as fh:
        fh.write(html)
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
  #gate { position: fixed; inset: 0; display: grid; place-items: center; background: rgba(20, 17, 14, 0.72); cursor: pointer; z-index: 2; }
  #gate .card { text-align: center; border: 1px solid var(--line); padding: 28px 36px; background: var(--panel); }
  #gate .t { font-family: "Josefin Sans", "Futura", sans-serif; font-weight: 300; font-size: 30px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--brass); }
  #gate .s { margin-top: 10px; color: var(--ink-dim); }
  #gate:focus-visible { outline: 2px solid var(--brass); outline-offset: -6px; }
  @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
</style>
<div id="gate" tabindex="0"><div class="card"><div class="t">SS Meridian · C Deck</div><div class="s">click to walk · esc to release the mouse</div></div></div>
<div class="hud">
  <div class="top">
    <div class="room"><div class="eyebrow">you are in</div><div class="name" id="roomName">—</div></div>
    <div class="pos" id="pos">x <b>0.0</b> m &nbsp; y <b>0.0</b> m<br>facing <b>N</b></div>
  </div>
  <div></div>
  <div class="bottom">
    <div class="keys"><kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> walk &nbsp; mouse look &nbsp; <kbd>shift</kbd> stride</div>
    <div class="prov" id="prov"></div>
  </div>
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
const WORLD = __WORLD_JSON__;
const EPS = 1e-6;
// plan: metres, north = +y.  three: y up, so plan y -> -z (north is -z, the camera's default look).
const P = (x, y) => new THREE.Vector3(x, 0, -y);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x14110e);
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 80);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
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
    const l = new THREE.PointLight(0xffd9a8, 0.55, 12, 2); l.position.copy(P(lx, ly)); l.position.y = H - 0.25; scene.add(l);
  }
}
scene.add(new THREE.HemisphereLight(0xfff1dc, 0x2a1a10, 0.35));

// where you may stand: rooms inset from their walls, plus a corridor through every opening
const INSET = 0.35;
const zones = WORLD.rooms.map(r => ({ x0: r.rect.x0 + INSET, x1: r.rect.x1 - INSET, y0: r.rect.y0 + INSET, y1: r.rect.y1 - INSET }));
for (const o of WORLD.openings) {
  const R = o.rect, vert = R.x1 - R.x0 < R.y1 - R.y0;   // a vertical (NS-running) edge or an EW-axis door
  const w = o.kind === "door" ? 0.28 : INSET;
  if (vert) zones.push({ x0: R.x0 - INSET - 0.05, x1: R.x1 + INSET + 0.05, y0: R.y0 + w, y1: R.y1 - w });
  else zones.push({ x0: R.x0 + w, x1: R.x1 - w, y0: R.y0 - INSET - 0.05, y1: R.y1 + INSET + 0.05 });
}
const inside = (x, y) => zones.some(z => x >= z.x0 && x <= z.x1 && y >= z.y0 && y <= z.y1);
const roomAt = (x, y) => WORLD.rooms.find(r => x >= r.rect.x0 && x <= r.rect.x1 && y >= r.rect.y0 && y <= r.rect.y1);

// the walker
const start = WORLD.rooms.find(r => r.id === WORLD.entrance) || WORLD.rooms[0];
let px = (start.rect.x0 + start.rect.x1) / 2, py = (start.rect.y0 + start.rect.y1) / 2;
let yaw = 0, pitch = 0;      // yaw 0 = facing north (+y plan, -z three)
const keys = {};
addEventListener("keydown", e => { keys[e.code] = true; });
addEventListener("keyup", e => { keys[e.code] = false; });
const gate = document.getElementById("gate");
gate.addEventListener("click", () => renderer.domElement.requestPointerLock());
gate.addEventListener("keydown", e => { if (e.code === "Enter" || e.code === "Space") renderer.domElement.requestPointerLock(); });
document.addEventListener("pointerlockchange", () => { gate.hidden = document.pointerLockElement === renderer.domElement; });
document.addEventListener("mousemove", e => {
  if (document.pointerLockElement !== renderer.domElement) return;
  yaw -= e.movementX * 0.0022; pitch -= e.movementY * 0.0022;
  pitch = Math.max(-1.4, Math.min(1.4, pitch));
});
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
  const n = Math.hypot(dx, dy);
  if (n > 0) {
    dx = dx / n * speed * dt; dy = dy / n * speed * dt;
    if (inside(px + dx, py)) px += dx;      // slide along walls
    if (inside(px, py + dy)) py += dy;
  }
  camera.position.copy(P(px, py)); camera.position.y = WORLD.eye_m;
  camera.rotation.set(0, 0, 0, "YXZ"); camera.rotation.y = yaw; camera.rotation.x = pitch;
  const r = roomAt(px, py);
  if (r !== lastRoom) { roomName.textContent = r ? r.name : "—"; lastRoom = r;
    const prov = WORLD.provenance[r && r.id];
    document.getElementById("prov").innerHTML = prov
      ? `walls, dado, strip, carpet and ceiling are the plan's geometry; their colours are the medians of <b>${prov}</b> in fixed row bands. No painter, no prompt.`
      : "";
  }
  const hd = ((-yaw * 180 / Math.PI) % 360 + 360) % 360;
  pos.innerHTML = `x <b>${px.toFixed(1)}</b> m &nbsp; y <b>${py.toFixed(1)}</b> m<br>facing <b>${COMPASS[Math.round(hd / 45) % 8]}</b>`;
  renderer.render(scene, camera);
  requestAnimationFrame(step);
}
requestAnimationFrame(step);
</script>
"""

if __name__ == "__main__":
    main()
