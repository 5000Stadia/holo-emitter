// A house from its plan, each room by its type (R47; design/house/r47-plan.md §3–4), on three's
// WebGPU renderer. The plan (src/make/plans/) says where rooms, doors, windows, hearths and stairs are;
// each room's type (src/make/rooms/) says what it stands on, its walls and ceiling, its hearth. A room's
// height is the storeys it rises through. The muniment room is built from its period brief
// (lab/brief/strongroom.js). Doors are things that work (door/panelled; locks and all). Each room's
// furniture stands where the placement rules put it (src/make/place.js). Every room's
// still parts are merged by material into one render bundle (WebGPU replays it without re-encoding);
// what you can see is decided by the doorways: from the room you stand in, through every open door,
// two rooms deep, and up and down the stairs you stand on. The rest is not drawn.
import * as THREE from "three/webgpu";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { houseSpecs, storeys } from "./house-spec.js";
import { floorOf } from "./walls.js";
import { carve, carveMesh } from "./carve.js";
import { shellOf, buildShell } from "./exterior.js";
import { settleFaces } from "./coplanar.js";
import { buildWall, slab, rect, metric } from "../../lab/painted/procedural.js";
import { buildStrongroom } from "../../lab/brief/strongroom.js";
import { build } from "./build.js";
import { kindOf, sizeOf as kindSize, value } from "./catalogue.js";
import { wallToRoom } from "./walls.js";
import { placeRoom, HISTORY } from "./place.js";
import { rng, seedOf } from "./id.js";

// a hearth fire's two looks: flame, drawn additive (it lights, it isn't lit), and embers
const FIRE = {
  flame: Object.assign(new THREE.MeshBasicMaterial({ color: 0xc8501a, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), { userData: { cls: "flame" } }),
  core: Object.assign(new THREE.MeshBasicMaterial({ color: 0xd89a40, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), { userData: { cls: "flame" } }),
  ember: Object.assign(new THREE.MeshBasicMaterial({ color: 0x7a2410 }), { userData: { cls: "ember" } }),
};
// a wall's mouldings mitred at its two corners: 1 / tan(half the inside angle) there (1 for a square corner; less for the
// octagon's wider ones; negative, running on, round an outside corner)
const mitresOf = (frames, F) => { const w = frames[F], ws = Object.values(frames), near = (p, q) => Math.abs(p[0] - q[0]) < 1e-4 && Math.abs(p[1] - q[1]) < 1e-4;
  const at = (u, v) => { if (!u || !v) return 0; const dot = u.dir[0] * v.dir[0] + u.dir[1] * v.dir[1], cross = u.dir[0] * v.dir[1] - u.dir[1] * v.dir[0], turn = Math.acos(Math.max(-1, Math.min(1, dot)));
    const inside = cross < 0 ? Math.PI - turn : Math.PI + turn; return 1 / Math.tan(inside / 2); };
  const prev = ws.find(q => near([q.a[0] + q.dir[0] * q.L, q.a[1] + q.dir[1] * q.L], w.a)), next = ws.find(q => near(q.a, [w.a[0] + w.dir[0] * w.L, w.a[1] + w.dir[1] * w.L]));
  return [at(prev, w), at(w, next)]; };
// a wall's group in its room: at the corner it is measured from, turned so its r runs along it and its +z faces in
const placeOf = (frames) => Object.fromEntries(Object.entries(frames).map(([F, w]) => [F, { pos: [w.a[0], 0, -w.a[1]], rot: Math.atan2(w.dir[1], w.dir[0]) }]));
const WALL_STYLE = { wainscot: "panelled", tapestry: "limewashed", limewash: "limewashed", stone: "limewashed" };

// rush matting (R §2: the long gallery matted, Hardwick): plaits a hand wide, sewn edge to edge, each
// a herringbone of rushes; the texture covers four metres of floor
function rushMatting() {
  const cv = document.createElement("canvas"); cv.width = cv.height = 512; const g = cv.getContext("2d"), r = rng(seedOf("floor/matting"));
  g.fillStyle = "#9a8456"; g.fillRect(0, 0, 512, 512);
  const band = 512 / 16;
  for (let b = 0; b < 16; b++) for (let y = 0; y < 512; y += 6) for (const side of [0, 1]) {
    const x0 = b * band + side * band / 2, tone = 120 + Math.floor(r() * 40);
    g.strokeStyle = `rgb(${tone + 30},${tone + 12},${tone - 40})`; g.lineWidth = 3; g.beginPath();
    g.moveTo(x0, y + (side ? 6 : 0)); g.lineTo(x0 + band / 2, y + (side ? 0 : 6)); g.stroke();
  }
  g.fillStyle = "rgba(60,44,20,0.5)"; for (let b = 0; b <= 16; b++) g.fillRect(b * band - 1, 0, 2, 512);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}

// stone slates (research-1660 §A: the Midlands' grey-green stone-slate roofs, Eyam and Beauchief): laid in courses, each
// slate a little different in tone, lichen on some. Drawn from its construction (2026-10-07, the ashlar's rule): every
// slate is a unit, its lichen kept inside it, the courses and the slates in each course fitted to the texture's width so
// the join wraps without a seam, and the texture four metres of roof along by four up the slope (it was two, with
// courses that diminished from 30 px to 16 and then jumped back to 30 at every repeat: a sawtooth in the roof; the
// diminishing belongs to the roof, not to a tile). Courses are about 0.1 m, 40 to the texture; slates 0.16-0.45 m wide.
let slate = null;
function slateMaterial() {
  if (slate) return slate;
  const N = 1024, cv = document.createElement("canvas"); cv.width = cv.height = N; const g = cv.getContext("2d"), r = rng(seedOf("roof/stone-slate"));
  g.fillStyle = "#3d3f38"; g.fillRect(0, 0, N, N);
  const rows = 40, hs = Array.from({ length: rows }, () => 0.9 + r() * 0.2), hsum = hs.reduce((a, b) => a + b, 0); let y = N;
  for (let i = 0; i < rows; i++) { const h = hs[i] / hsum * N; y -= h; const cy = y;
    const ws = []; let tot = 0; while (tot < N - 40) { const w = 40 + r() * 70; ws.push(w); tot += w; } const k = N / tot, off = r() * N; let x = 0;   // fitted, so the course wraps
    for (const w0 of ws) { const w = w0 * k, t = 70 + r() * 34, gr = t + 6 + r() * 8, lich = r() < 0.18, lx = r() * w, ly = r() * h, la = 150 + r() * 40, lb = 150 + r() * 30, lc = 90 + r() * 20, rx = 3 + r() * 6, ry = 2 + r() * 4;
      for (const ox of [0, -N]) for (const oy of [0, -N]) { const sx = (x + off) % N + ox, sy = cy + oy;
        if (sx > N || sx + w < 0 || sy > N || sy + h + 6 < 0) continue;
        g.save(); g.beginPath(); g.rect(sx + 1, sy + 1, w - 2, h + 5); g.clip();
        g.fillStyle = `rgb(${t | 0},${gr | 0},${(t - 6) | 0})`; g.fillRect(sx + 1, sy + 1, w - 2, h + 6);
        if (lich) { g.fillStyle = `rgba(${la | 0},${lb | 0},${lc | 0},0.5)`; g.beginPath(); g.ellipse(sx + Math.max(rx + 1, Math.min(w - rx - 1, lx)), sy + Math.max(ry + 1, Math.min(h - ry, ly)), rx, ry, 0, 0, 7); g.fill(); }
        g.restore();
        g.fillStyle = "rgba(15,15,12,0.55)"; g.fillRect(sx, sy + h - 2, w, 3); }
      x += w; } }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(0.25, 0.25); t.anisotropy = 8;
  return (slate = new THREE.MeshStandardMaterial({ map: t, roughness: 0.92, side: THREE.DoubleSide }));
}
// the house's outside: limestone ashlar (research-1660 §A: limestone with gritstone dressings), courses about 0.3 m
// high, blocks of several lengths, fine joints; the texture covers two metres by two
let ashlar = null;
function ashlarMaterial() {
  if (ashlar) return ashlar;
  // four metres of wall square, so it repeats less; courses about 0.3 m (13 to the texture), blocks 0.4-0.9 m long, each
  // a little different in tone and grain, laid with fine lime joints between them (the first version had no joints
  // and full-height streaks for rain stains: they ran through every course and read as stripes, 2026-10-07)
  const N = 1024, cv = document.createElement("canvas"); cv.width = cv.height = N; const g = cv.getContext("2d"), r = rng(seedOf("wall/ashlar"));
  const joint = "#d2c8b2"; g.fillStyle = joint; g.fillRect(0, 0, N, N);
  const rows = 13, h = N / rows, px = N / 4;                                  // px a metre
  for (let i = 0; i < rows; i++) { const y = i * h, ws = []; let tot = 0; while (tot < N - 0.4 * px) { const w = (0.4 + r() * 0.5) * px; ws.push(w); tot += w; }
    const k = N / tot, off = r() * N; let x = 0;            // the blocks fitted to the width and the course started anywhere, so it wraps with no seam and no perpend runs the height of the tile
    for (const w0 of ws) { const w = w0 * k, t = 168 + r() * 22, warm = r() * 8, sx0 = (x + off) % N, cloud = r() < 0.25, ch = r() * h * 0.5, ca = 0.04 + r() * 0.05;
      const grain = Array.from({ length: 60 }, () => [r() < 0.5 ? "96,86,66" : "235,226,204", 0.05 + r() * 0.06, 2 + r() * (w - 6), 2 + r() * (h - 6), 1 + r() * 4, 1 + r() * 2]);
      for (const ox of [0, -N]) { const sx = sx0 + ox; if (sx > N || sx + w < 0) continue;
        g.fillStyle = `rgb(${(t + warm) | 0},${(t - 6) | 0},${(t - 26 - warm) | 0})`; g.fillRect(sx + 1.5, y + 1.5, w - 3, h - 3);
        // the stone's own grain: small specks and a faint cloud, kept inside the block
        for (const [c, a, gx, gy, gw, gh] of grain) { g.fillStyle = `rgba(${c},${a})`; g.fillRect(sx + gx, y + gy, gw, gh); }
        if (cloud) { g.fillStyle = `rgba(80,72,56,${ca})`; g.fillRect(sx + 1.5, y + 1.5 + ch, w - 3, h * 0.5 - 3); } }
      x += w; }
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.repeat.set(0.5, 0.5);
  return (ashlar = new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 }));
}
export { slateMaterial, ashlarMaterial };   // for tools/check-textures.mjs (lab/scale/materials.html)
// a window's glass seen from outside: dark, a little green, leaded quarries catching the sky
let outGlass = null;
function outsideGlass() {
  if (outGlass) return outGlass;
  const N = 128, cv = document.createElement("canvas"); cv.width = cv.height = N; const g = cv.getContext("2d");
  g.fillStyle = "#1c2624"; g.fillRect(0, 0, N, N); g.strokeStyle = "#0b0f0e"; g.lineWidth = 3;
  for (let k = -N; k < 2 * N; k += 32) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + N, N); g.stroke(); g.beginPath(); g.moveTo(k, N); g.lineTo(k + N, 0); g.stroke(); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 4);
  return (outGlass = new THREE.MeshStandardMaterial({ map: t, roughness: 0.12, metalness: 0.35 }));
}

// verdure tapestry (R §2: the great chamber hung with tapestry, Hardwick), drawn in code: a ground of
// dark blue-green, leaves in greens, olives and faded blues, crowded as weavers crowded them, and a
// border of flowers top and bottom. One cloth, tiled along the wall a metre and a half to a repeat.
let verdure = null;
function verdureMaterial() {
  if (verdure) return verdure;
  const cv = document.createElement("canvas"); cv.width = 512; cv.height = 1024; const g = cv.getContext("2d"), r = rng(seedOf("tapestry/verdure"));
  g.fillStyle = "#2a3330"; g.fillRect(0, 0, 512, 1024);
  // faded, as three centuries of daylight leave wool: blue-greens, olives, buff; big leaves over small
  const leaf = ["#5b6b4a", "#6e7a58", "#4a5e5a", "#8a8462", "#3e4c40", "#a39a6a", "#56686a", "#77805c"];
  const draw = (x, y, a, l, c) => { for (const dx of x < 80 ? [0, 512] : x > 432 ? [0, -512] : [0]) { g.save(); g.translate(x + dx, y); g.rotate(a); g.fillStyle = c; g.beginPath();
      g.moveTo(-l, 0); g.quadraticCurveTo(-l * 0.2, -l * 0.5, l, 0); g.quadraticCurveTo(-l * 0.2, l * 0.5, -l, 0); g.fill();
      g.strokeStyle = "rgba(210,200,150,0.25)"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-l * 0.9, 0); g.lineTo(l * 0.9, 0); g.stroke(); g.restore(); } };
  for (let i = 0; i < 260; i++) draw(r() * 512, 110 + r() * 804, r() * Math.PI * 2, 40 + r() * 50, leaf[Math.floor(r() * leaf.length)]);
  for (let i = 0; i < 700; i++) draw(r() * 512, 110 + r() * 804, r() * Math.PI * 2, 12 + r() * 22, leaf[Math.floor(r() * leaf.length)]);
  for (const y0 of [0, 914]) { g.fillStyle = "#5a3a2c"; g.fillRect(0, y0, 512, 110); g.fillStyle = "#a89060"; g.fillRect(0, y0 + 8, 512, 6); g.fillRect(0, y0 + 96, 512, 6);
    for (let x = 16; x < 512; x += 64) { g.fillStyle = r() < 0.5 ? "#b8a47a" : "#7e5040"; g.beginPath(); g.arc(x + 16, y0 + 55, 20, 0, Math.PI * 2); g.fill(); g.fillStyle = "#4d6a3c"; g.beginPath(); g.ellipse(x + 48, y0 + 55, 14, 6, 0.6, 0, Math.PI * 2); g.fill(); } }
  // the weave: a fine cross-hatch so it reads as cloth near to
  g.globalAlpha = 0.12; g.fillStyle = "#000"; for (let y = 0; y < 1024; y += 3) g.fillRect(0, y, 512, 1); g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.anisotropy = 4;
  verdure = new THREE.MeshStandardMaterial({ map: t, roughness: 0.97 }); verdure.userData.cls = "tapestry";
  return verdure;
}
// a hanging over each clear stretch of a wall: from the skirting to a hand under the ceiling, in soft folds
function hangings(F, L, H, elems) {
  const blocked = elems.map(e => e.kind === "chimneypiece" ? [e.mantel.r0 - 0.08, e.mantel.r1 + 0.08] : [e.r0 - 0.12, e.r1 + 0.12]).sort((a, b) => a[0] - b[0]);
  const spans = []; let at = 0.05;
  for (const [a, b] of blocked) { if (a - at > 0.5) spans.push([at, a]); at = Math.max(at, b); }
  if (L - 0.05 - at > 0.5) spans.push([at, L - 0.05]);
  const top = Math.min(H - 0.25, 4.2), bottom = 0.12;
  return spans.map(([a, b]) => { const w = b - a, n = Math.max(2, Math.round(w / 0.08)), g = new THREE.PlaneGeometry(w, top - bottom, n, 1), p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i) + w / 2; p.setZ(i, 0.035 + 0.018 * Math.sin(x / 0.21 * Math.PI)); uv.setX(i, (a + x) / 1.5); }
    g.computeVertexNormals(); g.translate(a + w / 2, (top + bottom) / 2, 0); return g; });
}

export function buildManor({ plan, types, K, S, look, brief, bundles = true, furnished = true, settleRooms = false, outside = false }) {   // outside: the place has a real outside (no painted pane behind its windows)
  const t0 = performance.now(), { M } = K;
  const { floors, levelOf, heightOf, gap } = storeys(plan);
  const stairFrom = (s) => s.from || floors[0].id, stairTo = (s) => s.to || floors[1].id;
  const mats = {
    gypsum: Object.assign(new THREE.MeshStandardMaterial({ color: 0xa89c86, roughness: 0.7 }), { userData: { cls: "gypsum" } }),
    matting: Object.assign(new THREE.MeshStandardMaterial({ map: rushMatting(), roughness: 0.95 }), { userData: { cls: "matting" } }),
    plaster: M.plaster, limewash: M.limewash,
    carve: Object.assign(new THREE.MeshStandardMaterial({ color: 0x5a5048, roughness: 1 }), { userData: { cls: "carve" } }),
  };
  const placements = new Map(), scene = new THREE.Group(), rooms = new Map(), things = [], windows = [], blocks = [], hearths = [], flames = [];
  // a kind's size in its own frame (from its data, or measured once from a build)
  const sizes = new Map(), box = new THREE.Box3(), v3 = new THREE.Vector3();
  const sizeOf = (kind, over = {}) => { const key = kind + JSON.stringify(over); if (!sizes.has(key)) { const k = kindOf(kind); let s = k ? kindSize(k, 0, over) : null;
      if (k && !s) { const b = build(THREE, K, look, kind, `probe/${kind}`, over); box.setFromObject(b.node).getSize(v3); s = [v3.x, v3.y, box.max.z]; }
      sizes.set(key, s); } return sizes.get(key); };
  // the space a kind's moving parts sweep (R54: a lid swung back, a door swung out), in its own frame: each
  // mover turned or slid through its travel in 8 steps, its box at each step joined; measured once a kind
  const sweeps = new Map(), q0 = new THREE.Quaternion();
  const sweptOf = (kind, over = {}) => { const key = kind + JSON.stringify(over); if (sweeps.has(key)) return sweeps.get(key);
    const k = kindOf(kind); let S = null;
    if (k?.affordances) { const b = build(THREE, K, look, kind, `probe/${kind}`, over), all = new THREE.Box3(), bb = new THREE.Box3();
      for (const a of Object.values(k.affordances)) { const g = a.mover && b.movers.get(a.mover); if (!g || !["hinge", "lever", "slide"].includes(a.motion)) continue;
        const ax = new THREE.Vector3(...(a.axis || [0, 1, 0])).normalize(), ang = value(a.angle ?? 0, b.settings), tr = value(a.travel ?? 0.3, b.settings), home = g.userData.home;
        for (let i = 0; i <= 8; i++) { const t = i / 8; g.position.copy(home.position); g.quaternion.copy(home.quaternion);
          if (a.motion === "slide") g.position.addScaledVector(ax, tr * t); else g.quaternion.multiply(q0.setFromAxisAngle(ax, ang * t));
          g.updateMatrixWorld(true); bb.setFromObject(g); all.union(bb); }
        g.position.copy(home.position); g.quaternion.copy(home.quaternion); }
      if (!all.isEmpty()) S = { lo: all.min.toArray(), hi: all.max.toArray() }; }
    sweeps.set(key, S); return S; };
  const settingsOf = (kind) => kindOf(kind)?.settings || {};
  const traitsOf = (kind) => kindOf(kind)?.traits || [];
  const tileUV = (g, k) => { const uv = g.attributes.uv, p = g.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / k, p.getY(i) / k); return g; };

  const specs = houseSpecs(plan, { types, brief, gap });
  for (const room of plan.rooms) {
    if (room.type === "open") continue;
    const T = types[room.room_type] || {}, { x0, x1, y0, y1 } = room.rect, W = x1 - x0, D = y1 - y0, Y = levelOf(room.floor), H = heightOf(room);
    const grp = new THREE.Group(); grp.position.set(x0, Y, -y0); grp.userData.room = room.id;
    const movers = new THREE.Group(); movers.position.copy(grp.position);
    // its walls and what stands in them, every height decided once (src/make/house-spec.js): the carve reads the same
    const spec = specs.get(room.id).spec;
    // the muniment room: its own builder, from its period brief
    if (spec.strong) {
      const sr = buildStrongroom(THREE, K, spec);
      sr.group.position.set(x0, Y, -y0); scene.add(sr.group); things.push(...sr.things);
      for (const l of sr.lights) l.userData.room = room.id;
      rooms.set(room.id, { room, grp: sr.group, movers: null, H, Y, lights: sr.lights, colliders: sr.colliders, strongroom: sr });
      continue;
    }
    // the floor (with a hole where a stair comes up through it) and the ceiling (with one where it goes up)
    // each storey's stair well is cut from the floor it reaches (src/make/plans/stairs.js)
    const wellsHere = (plan.wells || []).filter(w => w.hole.x0 < x1 && w.hole.x1 > x0 && w.hole.y0 < y1 && w.hole.y1 > y0);
    const holeOf = (w) => rect(Math.max(0, w.hole.x0 - x0), Math.min(W, w.hole.x1 - x0), Math.max(0, w.hole.y0 - y0), Math.min(D, w.hole.y1 - y0));
    const up = wellsHere.filter(w => w.to === room.floor).map(holeOf);
    const topFloor = floors[Math.min(floors.length - 1, floors.findIndex(f => f.id === room.floor) + (room.rises || 1) - 1)].id;
    const down = wellsHere.filter(w => w.from === topFloor).map(holeOf).map(h => h.map(([x, y]) => [x, D - y]).reverse());
    const floorMat = T.floor === "flags" ? M.flags : T.floor === "gypsum" ? mats.gypsum : T.floor === "matting" ? mats.matting : M.floor;
    const fg = tileUV(slab(THREE, floorOf(room), up), T.floor === "flags" ? 2 : 4); fg.rotateX(-Math.PI / 2);
    grp.add(Object.assign(new THREE.Mesh(fg, floorMat), { receiveShadow: true }));
    const cg = tileUV(slab(THREE, floorOf(room).map(([u, v]) => [u, D - v]).reverse(), down), 1); cg.rotateX(Math.PI / 2); cg.translate(0, H, -D);
    grp.add(Object.assign(new THREE.Mesh(cg, T.walls === "limewash" || T.walls === "stone" ? M.limewash : M.plaster), { castShadow: true, receiveShadow: true }));
    // the ceiling's make: exposed joists across the short span, or moulded ribs in compartments
    if (T.ceiling === "beams" || T.ceiling === "compartments") {
      const along = W >= D, span = along ? D : W, len = along ? W : D, beam = T.ceiling === "beams";
      const step = beam ? 0.55 : 1.4, bw = beam ? 0.14 : 0.07, bd = beam ? 0.18 : 0.06, mat = beam ? M.oak : M.plaster;
      for (let s = step / 2; s < len; s += step) {
        const g = metric(new THREE.BoxGeometry(along ? bw : span, bd, along ? span : bw)); g.translate(along ? s : W / 2, H - bd / 2, along ? -D / 2 : -s); if (mat.vertexColors) K.board(g, 0.2);
        grp.add(Object.assign(new THREE.Mesh(g, mat), { castShadow: true }));
      }
      // (the ribs the other way a little shallower: of one depth, where they cross their faces lay one on the other)
      if (!beam) for (let s = step / 2; s < span; s += step) { const dd = bd * 0.8, g = metric(new THREE.BoxGeometry(along ? len : bw, dd, along ? bw : len)); g.translate(along ? W / 2 : s, H - dd / 2, along ? -s : -D / 2); grp.add(new THREE.Mesh(g, mat)); }
    }
    // the walls, by the type's finish
    // each wall where its frame says (src/make/walls.js): a rectangle's four, or an outline's every edge
    const P = placeOf(spec.frames), style = WALL_STYLE[T.walls] || "panelled";
    for (const F of Object.keys(spec.walls)) {
      const L = spec.frames[F].L;
      const w = buildWall(THREE, K, F, L, H, spec.walls[F], { style, depth: (seedOf(`outside/${room.id}`) % 40) * 0.004, mitre: mitresOf(spec.frames, F), backdrop: !outside });
      w.grp.position.set(...P[F].pos); w.grp.rotation.y = P[F].rot;
      if (T.walls === "tapestry") for (const g of hangings(F, L, H, spec.walls[F])) w.grp.add(Object.assign(new THREE.Mesh(g, verdureMaterial()), { receiveShadow: true }));
      for (const l of w.lights) l.parent.remove(l);
      grp.add(w.grp);
      // each window's daylight, where it is in the world, for the light rig that follows you
      const frame = new THREE.Object3D(); frame.position.set(x0 + P[F].pos[0], Y + P[F].pos[1], -y0 + P[F].pos[2]); frame.rotation.y = P[F].rot; frame.updateMatrixWorld(true);
      for (const e of spec.walls[F]) if (e.kind === "window") windows.push({ room: room.id, w: e.r1 - e.r0 - 0.2, h: e.top - e.sill - 0.1,
        c: frame.localToWorld(new THREE.Vector3((e.r0 + e.r1) / 2, (e.sill + e.top) / 2, -(e.T || 0.6) + 0.06)), into: frame.localToWorld(new THREE.Vector3((e.r0 + e.r1) / 2, (e.sill + e.top) / 2, 5)) });
      // each hearth's fire, where it burns in the world (the firebox stands in the breast), if the room keeps one lit
      for (const e of spec.walls[F]) if (e.kind === "chimneypiece") { const fb = e.firebox, B = e.breast || 0;
        hearths.push({ room: room.id, lit: (T.light || []).includes("fire"), big: !!e.open, w: fb.r1 - fb.r0,
          at: frame.localToWorld(new THREE.Vector3((fb.r0 + fb.r1) / 2, 0.3, B - fb.depth * 0.45)), into: frame.localToWorld(new THREE.Vector3((fb.r0 + fb.r1) / 2, 0.6, B + 2)) }); }
      // the doors this room hangs (the first room an opening joins), as things that work
      // (the strongroom hangs its own iron door)
      for (const e of spec.walls[F]) if (e.kind === "door" && e.joins?.[0] === room.id && !e.joins.some(j => plan.rooms.find(q => q.id === j)?.room_type === "muniment_room")) {
        const holder = new THREE.Group(); holder.position.set(...P[F].pos); holder.rotation.y = P[F].rot; movers.add(holder);
        const b = build(THREE, K, look, "door/panelled", `manor/${room.id}/${e.id}`, { w: r2(e.r1 - e.r0), h: r2(e.top), set: -Math.min(0.1, (e.T || 0.3) / 2), ...(e.door || {}) });   // e.door: its lock and key, if the plan says (a story's locked doors)
        b.node.position.set(e.r0, 0, 0); holder.add(b.node); b.node.userData.opening = e.id; things.push(b);
        // the reveal through the wall, lined in oak: the door's own, so it is there whenever the door is seen
        // (from the far room too, when the room that hangs it is not drawn)
        // and its threshold: the oak sill through the wall, the doorway's own floor
        { const w = e.r1 - e.r0, h = e.top, T = e.T || 0.3, t = 0.025, parts = [new THREE.BoxGeometry(t, h, T), new THREE.BoxGeometry(t, h, T), new THREE.BoxGeometry(w, t, T), new THREE.BoxGeometry(w + 0.02, 0.012, T + 0.02)];
          parts[0].translate(t / 2 + 0.004, h / 2, -T / 2); parts[1].translate(w - t / 2 - 0.004, h / 2, -T / 2); parts[2].translate(w / 2, h - t / 2 - 0.004, -T / 2); parts[3].translate(w / 2, 0.006, -T / 2);
          const g = mergeGeometries(parts.map(q => q.toNonIndexed()), false); if (M.oak.vertexColors) K.board(g, 0.15);
          const lining = new THREE.Mesh(g, M.oak); lining.receiveShadow = true; b.node.add(lining);
          // settled with the door's own frame, which it meets on the wall's face
          { const ms = b.node.children.filter(o => o.isMesh), gs = ms.map(o => o.geometry); settleFaces(gs, 0.001); ms.forEach((o, k) => { o.geometry = gs[k]; }); } }
      }
    }
    // what stands in the room, by the rules each kind declares (src/make/place.js): what the story requires first,
    // then what names the room, then its ordinary things to the fullness its context gives it; things that work,
    // drawn with their room, in a room of any shape
    const req = (plan.required || []).filter(q => q.room === room.id);
    const got = furnished ? placeRoom({ room, spec, plan, H, sizeOf, sweptOf, kindOf, seed: seedOf(`manor/${room.id}/place`),
      tiers: { required: req, anchor: T.anchor || [], also: T.also || [] }, fullness: (T.fullness ?? 0) * (HISTORY[room.history || plan.history || "lived"] ?? 1),
      stairFloors: (s) => [stairFrom(s), stairTo(s)] }) : { placed: [], refused: [] };
    placements.set(room.id, got);
    const builtHere = [];
    got.placed.forEach((p, i) => {
      const b = build(THREE, K, look, p.kind, `manor/${room.id}/${p.kind}:${i}`, { ...(p.over || {}), ...(p.settings || {}) }), n = b.node, d = p.dd ?? (sizeOf(p.kind, p.over || {})?.[2] || 0);
      builtHere.push(b);
      // in a slot: turned as its kind says (a body lies square on its bed), several in one slot laid side by side within
      // the slot's floor (the box and the draft in Daniel's chest had overlapped)
      if (p.inside) { const host = builtHere[p.inside.host], s = host?.slots.get(p.inside.slot);
        if (s) { const area = host.info?.slots?.[p.inside.slot]?.area, k = (s.count = (s.count || 0) + 1) - 1, w = area?.[0] ?? 0.3;
          n.position.set(s.at[0] + (k ? (k % 2 ? 1 : -1) * Math.ceil(k / 2) * w / 3 : 0), s.at[1], s.at[2]); n.rotation.y = kindOf(p.kind)?.place?.turn ?? 0.35; s.node.add(n); } else got.refused.push({ kind: p.kind, why: `${host?.kind.kind} has no ${p.inside.slot}` }); }
      else if (p.wall) { const holder = new THREE.Group(); holder.position.set(...P[p.wall].pos); holder.rotation.y = P[p.wall].rot; movers.add(holder); n.position.set(p.r, 0, p.d); holder.add(n); }
      else { // free standing: its back (the origin) half its depth behind its middle, facing the way it is turned
        const [u, v] = p.at, f = [Math.sin(p.rot), -Math.cos(p.rot)]; n.rotation.y = p.rot; n.position.set(u - f[0] * d / 2, 0, -(v - f[1] * d / 2)); movers.add(n); }
      n.userData.room = room.id; if (p.story) { b.story = p.story; n.userData.story = p.story; } things.push(b);   // a story's thing knows which it is (a case's clue)
      if (p.poly && !p.inside && (kindOf(p.kind)?.place?.layer || "stand") === "stand") { const xs = p.poly.map(q => q[0]), ys = p.poly.map(q => q[1]);
        blocks.push({ floor: room.floor, room: room.id, kind: p.kind, poly: p.poly, x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }); }
    });
    // the lights the room's type names (T.light), each a thing that gives it, where such a light was kept: a lantern
    // hung over the stairhead, a sconce beside the main door, a rushlight on a sill near the stair. Their lights are
    // the room's own (rooms' lights), for the page to take into its pool: never a light in the scene, never a light
    // without its flame (the picture never lies)
    const ownLights = [], RW = x1 - x0, RD = y1 - y0, lightNotes = [], made = new Map();
    const light = (kind, over, place) => { const k = (made.get(kind) || 0) + 1; made.set(kind, k);
      const b = build(THREE, K, look, kind, `manor/${room.id}/${kind}:light${k > 1 ? k : ""}`, over); place(b.node, b);
      b.node.userData.room = room.id; things.push(b); b.node.traverse(o => { if (o.isPointLight) ownLights.push(o); }); return b; };
    // (on a tapestried wall a sconce stands on the hanging's face, 5.5 cm out, not behind it)
    const onWall = (F, r, y, z, node) => { const holder = new THREE.Group(); holder.position.set(...P[F].pos); holder.rotation.y = P[F].rot; movers.add(holder); node.position.set(r, y, z + (T.walls === "tapestry" && z >= 0 ? 0.055 : 0)); holder.add(node); };
    // a stretch of wall clear for a sconce at r: inside the wall, nothing in the wall there, nothing hung there, nothing tall before it
    const clearAt = (F, r) => { const L = spec.frames[F].L;
      if (r < 0.25 || r > L - 0.25 || spec.walls[F].some(q => { const a = q.kind === "chimneypiece" ? q.mantel.r0 : q.r0, b = q.kind === "chimneypiece" ? q.mantel.r1 : q.r1; return a < r + 0.15 && b > r - 0.15; })) return false;
      const [u, v] = wallToRoom(spec.frames[F], RW, RD, r, 0.15), px = x0 + u, py = y0 + v;
      return !got.placed.some(p => (p.wall === F && Math.abs(p.r - r) < (p.w || 0.5) / 2 + 0.15) || (p.poly && (sizeOf(p.kind, p.over || {})?.[1] || 0) > 1.35 && Math.min(...p.poly.map(q => q[0])) < px + 0.3 && Math.max(...p.poly.map(q => q[0])) > px - 0.3 && Math.min(...p.poly.map(q => q[1])) < py + 0.3 && Math.max(...p.poly.map(q => q[1])) > py - 0.3)); };
    // beside the room's main door (its widest), a hand clear of the door's opening, on the side away from its hinge first
    const byDoor = () => { for (const { F, e } of Object.entries(spec.walls).flatMap(([F, es]) => es.filter(e => e.kind === "door").map(e => ({ F, e }))).sort((a, b) => (b.e.r1 - b.e.r0) - (a.e.r1 - a.e.r0)))
      for (const r of [e.r1 + 0.3, e.r0 - 0.3]) if (clearAt(F, r)) return { F, r }; return null; };
    // a room is dim by day when its windows' glass is under a fifteenth of its floor (the nursery has none, the little
    // parlour 0.059; the great rooms 0.09-0.2): only there is a candle the house sets out burning in the morning
    const dim = Object.values(spec.walls).flat().filter(e => e.kind === "window").reduce((s, e) => s + (e.r1 - e.r0) * (e.top - e.sill), 0) / (W * D) < 0.065;
    // set on top of a placed thing (a table, a cabinet, a court cupboard), at the first of a few spots clear of what is on it
    const onTop = (host, node, fs = [0.3, -0.3, 0, 0.42, -0.42]) => { const i = builtHere.indexOf(host), p = got.placed[i], [w, h, d] = sizeOf(p.kind, p.over || {});
      const taken = []; host.node.traverse(o => { if (o !== host.node && o.userData.make?.kind) taken.push(o.position.x); });
      const x = fs.map(f => f * w).find(x => taken.every(t => Math.abs(t - x) > 0.18)) ?? 0;
      node.position.set(x, h, d / 2); node.rotation.y = 0; host.node.add(node); };
    if (furnished) for (const what of T.light || []) {
      if (what === "candle_at_stairhead") {
        // over the head of the flight that arrives on this floor, 0.45 m on from its top step; on the floor a stair only
        // leaves from, over its foot, 0.45 m before its first step. Under a ceiling, not the well
        const flights = plan.stairs.filter(s => s.kind === "flight"), inside = ([x, y]) => x > x0 + 0.3 && x < x1 - 0.3 && y > y0 + 0.3 && y < y1 - 0.3;
        const end = (s, top) => { const R = s.rect, cx = (R.x0 + R.x1) / 2, cy = (R.y0 + R.y1) / 2, k = top ? 1 : -1;
          return { N: [cx, top ? R.y1 : R.y0, 0, k], S: [cx, top ? R.y0 : R.y1, 0, -k], E: [top ? R.x1 : R.x0, cy, k, 0], W: [top ? R.x0 : R.x1, cy, -k, 0] }[s.up]; };
        const arrive = flights.find(s => stairTo(s) === room.floor && s.z1 > 0.999 && inside(end(s, true))), leave = flights.find(s => stairFrom(s) === room.floor && s.z0 < 0.001 && inside(end(s, false)));
        const e = arrive ? end(arrive, true) : leave ? end(leave, false) : null; if (!e) { lightNotes.push(`${what}: no stair`); continue; }
        const x = e[0] + e[2] * 0.45, y = e[1] + e[3] * 0.45;
        if ((plan.wells || []).some(w => w.from === room.floor && x > w.hole.x0 - 0.15 && x < w.hole.x1 + 0.15 && y > w.hole.y0 - 0.15 && y < w.hole.y1 + 0.15)) { lightNotes.push(`${what}: under the well`); continue; }
        // clear of heads: its lowest point 2.25 m over the floor (the chain as long as the room's height allows, to 1.2 m)
        light("lantern/stair", { drop: r2(Math.max(0.08, Math.min(1.2, H - 2.25 - 0.49))) }, (n) => { box.setFromObject(n);
          n.position.set(x - x0, H - box.max.y, -(y - y0)); movers.add(n); n.userData.bottom = r2(H - box.max.y); });
      } else if (what === "candle_at_door") {
        // beside the room's main door, the plate's middle 1.5 m up
        const at = byDoor(); if (!at) { lightNotes.push(`${what}: no clear wall by a door`); continue; }
        light("sconce/candle", {}, (n) => onWall(at.F, at.r, 0, 0, n));
      } else if (what === "candles") {
        // a brass candlestick with a tallow candle on the room's table, else on a cabinet or a court cupboard; with none of
        // them (a bedchamber, the nursery, the long gallery) a sconce beside the door. Lit only in a dim room
        const start = { light: dim ? "lit" : "out" };
        const host = builtHere.find(q => /^table\//.test(q.kind.kind) && q.kind.kind !== "table/kitchen") || builtHere.find(q => q.kind.kind === "cabinet/japanned") || builtHere.find(q => q.kind.kind === "cupboard/court");
        if (host) { light("candle/in-candlestick", { still: true, glow: 1.2, start }, (n) => onTop(host, n)); continue; }
        const at = byDoor(); if (!at) { lightNotes.push(`${what}: no table and no clear wall by a door`); continue; }
        light("sconce/candle", { start }, (n) => onWall(at.F, at.r, 0, 0, n));
      } else if (what === "wax_candles") {
        // a pair of brass sconces with wax candles flanking the chimneypiece, 0.3 m clear of its mantel's ends (else beside
        // the door); set out, not lit, unless the room is dim
        const start = { light: dim ? "lit" : "out" }, cp = Object.entries(spec.walls).flatMap(([F, es]) => es.filter(e => e.kind === "chimneypiece").map(e => ({ F, e })))[0];
        const spots = cp ? [cp.e.mantel.r0 - 0.3, cp.e.mantel.r1 + 0.3].filter(r => clearAt(cp.F, r)).map(r => ({ F: cp.F, r })) : [];
        if (spots.length < 2) { const at = byDoor(); if (at && !spots.length) spots.push(at); }
        if (!spots.length) { lightNotes.push(`${what}: no clear wall by the chimneypiece or a door`); continue; }
        // (their plates' middles a hand over the mantel's shelf, so they stand above it, not beside it)
        const at_y = r2(Math.min(H - 0.6, Math.max(1.55, (cp?.e.mantel.top ?? 0) + 0.25)));
        for (const at of spots) light("sconce/candle", { candle: "beeswax", at_y, start }, (n) => onWall(at.F, at.r, 0, 0, n));
      } else if (what === "branched_candlestick") {
        // a branched candlestick in the middle of the hall's table: set out, lit at supper
        const host = builtHere.find(q => /^table\//.test(q.kind.kind));
        if (!host) { lightNotes.push(`${what}: no table`); continue; }
        light("candlestick/branched", { start: { light: dim ? "lit" : "out" } }, (n) => onTop(host, n, [0, 0.25, -0.25]));
      } else if (what === "rushlight") {
        // on a window's sill, the window nearest the room's stair (else its first), a hand in from the wall's face
        const wins = Object.entries(spec.walls).flatMap(([F, es]) => es.filter(e => e.kind === "window").map(e => ({ F, e, at: wallToRoom(spec.frames[F], RW, RD, (e.r0 + e.r1) / 2, 0) })));
        const st = plan.stairs.find(s => s.kind === "flight" && (stairFrom(s) === room.floor || stairTo(s) === room.floor) && s.rect.x0 < x1 && s.rect.x1 > x0 && s.rect.y0 < y1 && s.rect.y1 > y0);
        if (st) { const c = [(st.rect.x0 + st.rect.x1) / 2 - x0, (st.rect.y0 + st.rect.y1) / 2 - y0]; wins.sort((a, b) => Math.hypot(a.at[0] - c[0], a.at[1] - c[1]) - Math.hypot(b.at[0] - c[0], b.at[1] - c[1])); }
        const w = wins.find(q => q.e.r1 - q.e.r0 > 0.45 && q.e.sill > 0.4);
        if (w) { light("rushlight/nip", {}, (n) => onWall(w.F, (w.e.r0 + w.e.r1) / 2 - 0.05, w.e.sill, -Math.min(0.14, (w.e.T || 0.3) * 0.45), n)); continue; }
        // a room with no window (the servants' hall): on its table, beside what is on it already
        const host = builtHere.find(q => q.kind.kind.startsWith("table/") && q.slots.has("top")), s = host?.slots.get("top");
        if (!s) { lightNotes.push(`${what}: no sill, no table`); continue; }
        light("rushlight/nip", {}, (n) => { const k = (s.count = (s.count || 0) + 1) - 1; n.position.set(s.at[0] + (k ? (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.25 : 0), s.at[1], s.at[2]); s.node.add(n); });
      }
    }
    // each chimneypiece is solid to a body: its breast and the fire's mouth within it (Kabe, 2026-10-06: "the
    // hearth doesn't collide with the player and I can walk inside"); an open kitchen hearth's mouth too
    { const RW = room.rect.x1 - room.rect.x0, RD = room.rect.y1 - room.rect.y0;
      for (const F of Object.keys(spec.walls)) for (const e of spec.walls[F]) if (e.kind === "chimneypiece") {
        // the breast, and in front of it the surround, the mantel and its shelf (some 0.3 m proud, wider than the
        // fire by its ends): a body keeps out of all of it, so an eye can't stand inside the mantel
        const deep = (e.breast || 0) + 0.32, m = e.mantel || e, [a, b] = [wallToRoom(spec.frames[F], RW, RD, Math.min(e.r0, m.r0) - 0.05, 0), wallToRoom(spec.frames[F], RW, RD, Math.max(e.r1, m.r1) + 0.05, deep)];
        blocks.push({ floor: room.floor, room: room.id, kind: "hearth", x0: x0 + Math.min(a[0], b[0]), x1: x0 + Math.max(a[0], b[0]), y0: y0 + Math.min(a[1], b[1]), y1: y0 + Math.max(a[1], b[1]) }); } }
    merge(grp, bundles, settleRooms);
    // the fire in each lit hearth: logs, embers and flames (drawn with the room; they flicker while seen)
    for (const h of hearths.filter(q => q.room === room.id && q.lit)) {
      const f = new THREE.Group(), n = h.big ? 5 : 3, span = Math.min(h.w * 0.6, h.big ? 1.4 : 0.55);
      f.position.set(h.at.x - grp.position.x, h.at.y - 0.3 - grp.position.y, h.at.z - grp.position.z); f.lookAt(new THREE.Vector3(h.into.x - grp.position.x, f.position.y, h.into.z - grp.position.z));
      for (let k = 0; k < 2; k++) { const log = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, span, 8), M.dark || M.oak); log.rotation.z = Math.PI / 2; log.rotation.y = (k - 0.5) * 0.4; log.position.set(0, 0.06 + k * 0.05, (k - 0.5) * 0.1); f.add(log); }
      const ember = new THREE.Mesh(new THREE.PlaneGeometry(span, 0.3), FIRE.ember); ember.rotation.x = -Math.PI / 2; ember.position.y = 0.012; f.add(ember);
      // tongues of flame, each an orange cone round a smaller yellow core, rising from the logs
      for (let k = 0; k < n; k++) for (const [mat, r, hgt] of [[FIRE.flame, 0.06 + (k % 2) * 0.025, 0.26 + (k % 3) * 0.08], [FIRE.core, 0.03, 0.13 + (k % 2) * 0.05]]) {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(r, hgt, 7, 1, true), mat); cone.geometry.translate(0, hgt / 2, 0);
        cone.position.set((k / (n - 1 || 1) - 0.5) * span * 0.8, 0.08, (k % 2) * 0.05); cone.userData.phase = k * 1.7 + (mat === FIRE.core ? 0.6 : 0); f.add(cone); flames.push(cone); }
      f.userData.fire = true; grp.add(f);
    }
    scene.add(grp, movers);
    rooms.set(room.id, { room, grp, movers, H, Y, lights: ownLights, lightNotes });
  }
  // the stairs: each flight its treads and risers on a sloping soffit, open beneath; each half-landing a
  // slab on newel posts; a balustrade (rail, turned balusters, newels) wherever a flight or a landing or a
  // floor's well has an open side
  const stairParts = new Map();                                       // owner room -> [geometries]
  const partOf = (s) => { const id = s.joins.find(j => plan.rooms.find(q => q.id === j)?.floor === stairFrom(s)) || s.joins[0]; if (!stairParts.has(id)) stairParts.set(id, []); return stairParts.get(id); };
  const BAL = new THREE.LatheGeometry([[0, 0], [0.03, 0], [0.03, 0.06], [0.018, 0.1], [0.028, 0.32], [0.016, 0.5], [0.022, 0.62], [0.016, 0.72], [0.03, 0.76], [0, 0.76]].map(([r, y]) => new THREE.Vector2(r, y)), 8);
  const cube = (x0b, x1b, y0b, y1b, z0b, z1b) => { const g = new THREE.BoxGeometry(x1b - x0b, z1b - z0b, y1b - y0b); g.translate((x0b + x1b) / 2, (z0b + z1b) / 2, -(y0b + y1b) / 2); return g; };
  // a rail from plan point a (at height ha) to b (at hb): balusters along it, a moulded rail on top, a newel at each end
  const rails = [];
  const rail = (out, [ax, ay, ha], [bx, by, hb], newels = true) => {
    rails.push([[ax, ay, ha], [bx, by, hb]].map(p => p.map(v => Math.round(v * 100) / 100)));
    const L = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.round(L / 0.26));
    for (let i = 1; i < n; i++) { const t = i / n, g = BAL.clone(), y = ha + (hb - ha) * t; g.scale(1, (0.86) / 0.76, 1); g.translate(ax + (bx - ax) * t, y, -(ay + (by - ay) * t)); out.push(g); }
    const g = new THREE.BoxGeometry(0.08, 0.07, 1); const dir = new THREE.Vector3(bx - ax, hb - ha, -(by - ay)), len = dir.length(); g.scale(1, 1, len); g.lookAt(dir); g.translate((ax + bx) / 2, (ha + hb) / 2 + 0.9, -(ay + by) / 2); out.push(g);
    if (newels) for (const [x, y, h] of [[ax, ay, ha], [bx, by, hb]]) out.push(cube(x - 0.07, x + 0.07, y - 0.07, y + 0.07, h - 0.3, h + 1.05), cube(x - 0.09, x + 0.09, y - 0.09, y + 0.09, h + 1.05, h + 1.12));
  };
  const along = (s) => s.up === "N" || s.up === "S";
  // the stair's hall on the floor it rises from, and whether a line in it (x = at, or y = at) stands against its wall
  const hallOf = (s) => { const R = s.rect, cx = (R.x0 + R.x1) / 2, cy = (R.y0 + R.y1) / 2; return plan.rooms.find(q => q.type !== "open" && q.floor === stairFrom(s) && cx > q.rect.x0 && cx < q.rect.x1 && cy > q.rect.y0 && cy < q.rect.y1); };
  const againstWall = (room, ax, at) => ax === "x" ? Math.min(Math.abs(at - room.rect.x0), Math.abs(at - room.rect.x1)) < 0.2 : Math.min(Math.abs(at - room.rect.y0), Math.abs(at - room.rect.y1)) < 0.2;
  for (const s of plan.stairs) {
    const base = levelOf(stairFrom(s)), rise = levelOf(stairTo(s)) - base, R = s.rect, out = partOf(s);
    if (s.kind === "landing") {
      const h = base + rise * s.z0; out.push(cube(R.x0, R.x1, R.y0, R.y1, h - 0.22, h));
      for (const [x, y] of [[R.x0 + 0.07, R.y0 + 0.07], [R.x1 - 0.07, R.y0 + 0.07], [R.x0 + 0.07, R.y1 - 0.07], [R.x1 - 0.07, R.y1 - 0.07]]) out.push(cube(x - 0.07, x + 0.07, y - 0.07, y + 0.07, base, h - 0.22));
      continue;
    }
    // the flight in its own frame: u up the run, h up, a across; then laid into the plan by the way it rises
    const n = s.treads, len = along(s) ? R.y1 - R.y0 : R.x1 - R.x0, wid = along(s) ? R.x1 - R.x0 : R.y1 - R.y0, g = len / n, h0 = rise * s.z0, dh = rise * (s.z1 - s.z0) / n, waist = 0.24;
    const sh = new THREE.Shape(); sh.moveTo(0, Math.max(0, h0 - waist)); sh.lineTo(0, h0 + dh);
    for (let k = 1; k <= n; k++) { sh.lineTo(k * g, h0 + k * dh); if (k < n) sh.lineTo(k * g, h0 + (k + 1) * dh); }
    sh.lineTo(len, h0 + n * dh - waist); sh.lineTo(g, h0 + dh - waist); sh.lineTo(0, Math.max(0, h0 - waist));
    let geo = new THREE.ExtrudeGeometry(sh, { depth: wid, bevelEnabled: false }).toNonIndexed();
    const map = { E: (u, h, a) => [R.x0 + u, h, -(R.y0 + a)], W: (u, h, a) => [R.x1 - u, h, -(R.y0 + a)], N: (u, h, a) => [R.x0 + a, h, -(R.y0 + u)], S: (u, h, a) => [R.x0 + a, h, -(R.y1 - u)] }[s.up];
    const P = geo.attributes.position;
    for (let i = 0; i < P.count; i++) { const [x, y, z] = map(P.getX(i), P.getY(i), P.getZ(i)); P.setXYZ(i, x, base + y, z); }
    if (s.up === "E" || s.up === "S") for (let i = 0; i < P.count; i += 3) for (const attr of [P, geo.attributes.uv]) { if (!attr) continue; const k = attr.itemSize; for (let c = 0; c < k; c++) { const t = attr.array[(i + 1) * k + c]; attr.array[(i + 1) * k + c] = attr.array[(i + 2) * k + c]; attr.array[(i + 2) * k + c] = t; } }
    geo.computeVertexNormals(); out.push(geo);
    // its sides: every side with a drop beside it is railed from foot to head, the well's and the room's alike (Kabe,
    // 2026-10-06: "you'd assume stairs of this type have a bannister both sides"); only a side against a wall is not
    const room = hallOf(s);
    for (const toward of ["lo", "hi"]) {
      const a = along(s) ? (toward === "hi" ? R.x1 - 0.05 : R.x0 + 0.05) : (toward === "hi" ? R.y1 - 0.05 : R.y0 + 0.05);
      if (room && againstWall(room, along(s) ? "x" : "y", toward === "hi" ? (along(s) ? R.x1 : R.y1) : (along(s) ? R.x0 : R.y0))) continue;
      const lo = s.up === "N" ? R.y0 : s.up === "S" ? R.y1 : s.up === "E" ? R.x0 : R.x1, hi = s.up === "N" ? R.y1 : s.up === "S" ? R.y0 : s.up === "E" ? R.x1 : R.x0;
      const pt = (u, h) => along(s) ? [a, u, h] : [u, a, h];
      rail(out, pt(lo, base + h0 + dh), pt(hi, base + rise * s.z1)); }
  }
  // each half-landing's edges: railed wherever it stands off a wall and no flight goes on from it
  for (const s of plan.stairs.filter(q => q.kind === "landing")) {
    const base = levelOf(stairFrom(s)), h = base + (levelOf(stairTo(s)) - base) * s.z0, R = s.rect, out = partOf(s), room = hallOf(s);
    const flights = plan.stairs.filter(q => q.kind === "flight" && q.well === s.well).map(q => q.rect);
    for (const [ax, at, lo, hi] of [["y", R.y0, R.x0, R.x1], ["y", R.y1, R.x0, R.x1], ["x", R.x0, R.y0, R.y1], ["x", R.x1, R.y0, R.y1]]) {
      if (room && againstWall(room, ax, at)) continue;
      // what of this edge a flight goes on from: not railed
      const joined = flights.filter(f => ax === "y" ? (Math.abs(f.y1 - at) < 0.02 || Math.abs(f.y0 - at) < 0.02) : (Math.abs(f.x1 - at) < 0.02 || Math.abs(f.x0 - at) < 0.02))
        .map(f => ax === "y" ? [f.x0, f.x1] : [f.y0, f.y1]).sort((p, q) => p[0] - q[0]);
      let x = lo; const runs = []; for (const [a, b] of joined) { if (a > x + 0.05) runs.push([x, a]); x = Math.max(x, b); } if (hi > x + 0.05) runs.push([x, hi]);
      const inset = (v, sgn) => v + sgn * 0.05, side = at === R.x0 || at === R.y0 ? 1 : -1;
      for (const [a, b] of runs) rail(out, ax === "y" ? [a, inset(at, side), h] : [inset(at, side), a, h], ax === "y" ? [b, inset(at, side), h] : [inset(at, side), b, h]);
    }
  }
  // round each floor's well: the open long side and the landing's end, where they stand off a wall
  for (const w of plan.wells || []) {
    const room = plan.rooms.find(q => q.floor === w.to && q.rect.x0 <= w.hole.x0 + 0.01 && q.rect.x1 >= w.hole.x1 - 0.01 && q.rect.y0 <= w.hole.y0 + 0.01 && q.rect.y1 >= w.hole.y1 - 0.01); if (!room) continue;
    const H = levelOf(w.to), Q = room.rect, Rh = w.hole, out = stairParts.get(room.id) || (stairParts.set(room.id, []), stairParts.get(room.id));
    const foot = (plan.wells.find(v => v.id === w.id).rect), footLo = foot.y0 < Rh.y0 - 0.01 ? "S" : foot.y1 > Rh.y1 + 0.01 ? "N" : foot.x0 < Rh.x0 - 0.01 ? "W" : "E";
    const edges = { N: [[Rh.x0, Rh.y1], [Rh.x1, Rh.y1], Q.y1 - Rh.y1], S: [[Rh.x0, Rh.y0], [Rh.x1, Rh.y0], Rh.y0 - Q.y0], E: [[Rh.x1, Rh.y0], [Rh.x1, Rh.y1], Q.x1 - Rh.x1], W: [[Rh.x0, Rh.y0], [Rh.x0, Rh.y1], Rh.x0 - Q.x0] };
    for (const [F, [a, b, gapToWall]] of Object.entries(edges)) if (F !== footLo && gapToWall > 0.2) rail(out, [...a, H], [...b, H]);
    // the floor's edge round the well, cased in oak boards down through the floor's thickness (the carve stands behind)
    // (inside the hole, so its top is a trim round it, never lying on the floor beside it)
    for (const g of [cube(Rh.x0, Rh.x1, Rh.y1 - 0.035, Rh.y1, H - gap - 0.03, H), cube(Rh.x0, Rh.x1, Rh.y0, Rh.y0 + 0.035, H - gap - 0.03, H),
      cube(Rh.x0, Rh.x0 + 0.035, Rh.y0 + 0.035, Rh.y1 - 0.035, H - gap - 0.03, H), cube(Rh.x1 - 0.035, Rh.x1, Rh.y0 + 0.035, Rh.y1 - 0.035, H - gap - 0.03, H)]) out.push(g);
  }
  // the stairs settled as one, whatever room each piece is drawn with (one flight's newel meets the next one's)
  { const lists = [...stairParts.values()]; for (const ps of lists) for (let k = 0; k < ps.length; k++) if (ps[k].index) ps[k] = ps[k].toNonIndexed();
    const flat = lists.flat(); settleFaces(flat, 0.001); let k = 0; for (const ps of lists) for (let j = 0; j < ps.length; j++) ps[j] = flat[k++]; }
  for (const [id, parts] of stairParts) {
    const owner = rooms.get(id), geo = mergeGeometries(parts.map(g => { g = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv"].includes(k)) g.deleteAttribute(k);
      if (!g.attributes.uv) g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); if (!g.attributes.normal) g.computeVertexNormals();
      if (M.oakH.vertexColors) K.board(g, 0.2); return g; }), false);
    const m = new THREE.Mesh(geo, M.oakH); m.castShadow = m.receiveShadow = true;
    if (owner) { m.position.set(-owner.grp.position.x, -owner.grp.position.y, -owner.grp.position.z); owner.grp.add(m); } else scene.add(m);
  }
  // the house's solid, every room and opening carved out of it (src/make/carve.js): behind every lining, so a lining
  // that stops short shows stone, never the hillside
  const carved = carve({ plan, specs, levelOf, gap });
  const solid = new THREE.Mesh(carveMesh(THREE, carved), [M.stone || mats.carve, M.plaster, mats.carve, ashlarMaterial()]); solid.userData = { carve: true }; solid.castShadow = solid.receiveShadow = true; scene.add(solid);
  // the house's outside (src/make/exterior.js): its roofs, coped gables, stacks, and its windows seen from without
  let exterior = null;
  if (plan.ranges || plan.rooms.some(r => r.outline)) { const t1 = performance.now(), shell = shellOf(plan, { gap });
    const stoneOut = ashlarMaterial().clone(); stoneOut.side = THREE.DoubleSide;
    exterior = buildShell(THREE, shell, { slate: slateMaterial(), stone: stoneOut, glass: outsideGlass(), windows, mergeGeometries });
    exterior.userData = { exterior: true, ms: Math.round(performance.now() - t1), shell }; scene.add(exterior); }
  // what can be seen from a room: itself, every room through an open doorway two deep, and the rooms its stairs join
  const doorOf = new Map(things.filter(b => b.node.userData.opening).map(b => [b.node.userData.opening, b]));
  function visibleFrom(id, isOpen) {
    const seen = new Set([id]); let edge = [id];
    for (let depth = 0; depth < 2; depth++) {
      const next = [];
      for (const r of edge) {
        for (const o of plan.openings) if (o.joins.includes(r)) { const other = o.joins.find(j => j !== r), d = doorOf.get(o.id);
          if (!seen.has(other) && (o.kind === "open_edge" || !d || isOpen(d) || plan.rooms.find(q => q.id === other)?.room_type === "muniment_room")) { seen.add(other); next.push(other); } }
        for (const s of plan.stairs) if (s.joins.includes(r)) for (const j of s.joins) if (!seen.has(j)) { seen.add(j); next.push(j); }
      }
      edge = next;
    }
    return seen;
  }
  // a door's leaf shows while either room it joins is seen
  const doorRooms = new Map(plan.openings.map(o => [o.id, o.joins]));
  function show(set) {
    for (const [id, r] of rooms) { r.grp.visible = set.has(id); if (r.movers) r.movers.visible = true; }
    for (const b of things) { const j = doorRooms.get(b.node.userData.opening); if (j) b.node.visible = j.some(id => set.has(id)); else if (b.node.userData.room) b.node.visible = set.has(b.node.userData.room); }
  }
  return { exterior, rails, carved, specs, placements, scene, rooms, things, windows, blocks, hearths, flames, levelOf, heightOf, stairFrom, stairTo, visibleFrom, show, ms: Math.round(performance.now() - t0) };
}

const r2 = (x) => Math.round(x * 100) / 100;
// a room's still meshes merged by material: a few draws a room, which its bundle then replays
function merge(grp, bundle = false, settle = true) {
  grp.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(grp.matrixWorld).invert(), byMat = new Map();
  grp.traverse(o => { if (o.isMesh && !o.isInstancedMesh) (byMat.get(o.material) || byMat.set(o.material, []).get(o.material)).push(o); });
  const keep = [], ready = new Map();
  for (const [mat, list] of byMat) {
    ready.set(mat, list.map(o => { let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
      for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv", "color"].includes(k)) g.deleteAttribute(k);
      if (mat.vertexColors && !g.attributes.color) g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 3).fill(1), 3));
      if (!mat.vertexColors && g.attributes.color) g.deleteAttribute("color");
      if (!g.attributes.uv) g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      if (!g.attributes.normal) g.computeVertexNormals(); g.clearGroups(); return g; }));
  }
  // faces two pieces of the room lay on one plane, facing the same way (crossing ribs, a lining over a lining), would
  // flicker as you move: the smaller of each pair lifted a millimetre (src/make/coplanar.js), across all its materials
  { const mats = [...ready.keys()], flat = mats.flatMap(m => ready.get(m)), sides = mats.flatMap(m => ready.get(m).map(() => m.side === THREE.BackSide ? -1 : m.side === THREE.DoubleSide ? 0 : 1));
    if (settle && flat.length > 1) settleFaces(flat, 0.001, sides); let k = 0; for (const m of mats) { const gs = ready.get(m); for (let j = 0; j < gs.length; j++) gs[j] = flat[k++]; } }
  for (const [mat, list] of byMat) {
    const geos = ready.get(mat);
    const merged = mergeGeometries(geos, false); if (!merged) { keep.push(...list); continue; }
    const m = new THREE.Mesh(merged, mat); m.castShadow = !mat.transparent && !mat.isMeshBasicMaterial; m.receiveShadow = true; m.frustumCulled = false; keep.push(m);
  }
  const others = []; grp.traverse(o => { if ((o.isInstancedMesh || o.isLight) && o.parent) others.push(o); });
  while (grp.children.length) grp.remove(grp.children[0]);
  // the opaque merged meshes go into a render bundle (WebGPU replays it without re-encoding); glass and
  // anything instanced stay outside it, drawn the ordinary way
  const B = bundle ? new THREE.BundleGroup() : grp; if (bundle) grp.add(B);
  for (const m of keep) (m.material.transparent ? grp : B).add(m);
  for (const o of others) { o.parent?.remove(o); grp.add(o); }
}
