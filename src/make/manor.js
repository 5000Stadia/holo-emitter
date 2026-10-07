// A house from its plan, each room by its type (R47; design/house/r47-plan.md §3–4), on three's
// WebGPU renderer. The plan (src/make/plans/) says where rooms, doors, windows, hearths and stairs are;
// each room's type (src/make/rooms/) says what it stands on, its walls and ceiling, its hearth. A room's
// height is the storeys it rises through. The muniment room is built from its period brief
// (lab/brief/strongroom.js). Doors are things that work (door/panelled; locks and all). Each room's
// anchor furniture stands where the furnishing habit puts it (src/make/furnish.js). Every room's
// still parts are merged by material into one render bundle (WebGPU replays it without re-encoding);
// what you can see is decided by the doorways: from the room you stand in, through every open door,
// two rooms deep, and up and down the stairs you stand on. The rest is not drawn.
import * as THREE from "three/webgpu";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { houseSpecs, storeys } from "./house-spec.js";
import { carve, carveMesh } from "./carve.js";
import { buildWall, slab, rect, metric } from "../../lab/painted/procedural.js";
import { buildStrongroom } from "../../lab/brief/strongroom.js";
import { build } from "./build.js";
import { kindOf, sizeOf as kindSize, value } from "./catalogue.js";
import { furnish, wallToRoom } from "./furnish.js";
import { rng, seedOf } from "./id.js";

// a hearth fire's two looks: flame, drawn additive (it lights, it isn't lit), and embers
const FIRE = {
  flame: Object.assign(new THREE.MeshBasicMaterial({ color: 0xc8501a, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), { userData: { cls: "flame" } }),
  core: Object.assign(new THREE.MeshBasicMaterial({ color: 0xd89a40, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), { userData: { cls: "flame" } }),
  ember: Object.assign(new THREE.MeshBasicMaterial({ color: 0x7a2410 }), { userData: { cls: "ember" } }),
};
const PLACE = (W, D) => ({ N: { pos: [0, 0, -D], rot: 0 }, S: { pos: [W, 0, 0], rot: Math.PI }, E: { pos: [W, 0, -D], rot: -Math.PI / 2 }, W: { pos: [0, 0, 0], rot: Math.PI / 2 } });
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

export function buildManor({ plan, types, K, S, look, brief, bundles = true, furnished = true }) {
  const t0 = performance.now(), { M } = K;
  const { floors, levelOf, heightOf, gap } = storeys(plan);
  const stairFrom = (s) => s.from || floors[0].id, stairTo = (s) => s.to || floors[1].id;
  const mats = {
    gypsum: Object.assign(new THREE.MeshStandardMaterial({ color: 0xa89c86, roughness: 0.7 }), { userData: { cls: "gypsum" } }),
    matting: Object.assign(new THREE.MeshStandardMaterial({ map: rushMatting(), roughness: 0.95 }), { userData: { cls: "matting" } }),
    plaster: M.plaster, limewash: M.limewash,
    carve: Object.assign(new THREE.MeshStandardMaterial({ color: 0x5a5048, roughness: 1 }), { userData: { cls: "carve" } }),
  };
  const scene = new THREE.Group(), rooms = new Map(), things = [], windows = [], blocks = [], hearths = [], flames = [];
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
    const fg = tileUV(slab(THREE, rect(0, W, 0, D), up), T.floor === "flags" ? 2 : 4); fg.rotateX(-Math.PI / 2);
    grp.add(Object.assign(new THREE.Mesh(fg, floorMat), { receiveShadow: true }));
    const cg = tileUV(slab(THREE, rect(0, W, 0, D), down), 1); cg.rotateX(Math.PI / 2); cg.translate(0, H, -D);
    grp.add(Object.assign(new THREE.Mesh(cg, T.walls === "limewash" || T.walls === "stone" ? M.limewash : M.plaster), { castShadow: true, receiveShadow: true }));
    // the ceiling's make: exposed joists across the short span, or moulded ribs in compartments
    if (T.ceiling === "beams" || T.ceiling === "compartments") {
      const along = W >= D, span = along ? D : W, len = along ? W : D, beam = T.ceiling === "beams";
      const step = beam ? 0.55 : 1.4, bw = beam ? 0.14 : 0.07, bd = beam ? 0.18 : 0.06, mat = beam ? M.oak : M.plaster;
      for (let s = step / 2; s < len; s += step) {
        const g = metric(new THREE.BoxGeometry(along ? bw : span, bd, along ? span : bw)); g.translate(along ? s : W / 2, H - bd / 2, along ? -D / 2 : -s); if (mat.vertexColors) K.board(g, 0.2);
        grp.add(Object.assign(new THREE.Mesh(g, mat), { castShadow: true }));
      }
      if (!beam) for (let s = step / 2; s < span; s += step) { const g = metric(new THREE.BoxGeometry(along ? len : bw, bd, along ? bw : len)); g.translate(along ? W / 2 : s, H - bd / 2, along ? -s : -D / 2); grp.add(new THREE.Mesh(g, mat)); }
    }
    // the walls, by the type's finish
    const P = PLACE(W, D), style = WALL_STYLE[T.walls] || "panelled";
    for (const F of ["N", "E", "S", "W"]) {
      const L = F === "N" || F === "S" ? W : D;
      const w = buildWall(THREE, K, F, L, H, spec.walls[F], { style });
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
        const b = build(THREE, K, look, "door/panelled", `manor/${room.id}/${e.id}`, { w: r2(e.r1 - e.r0), h: r2(e.top), set: -Math.min(0.1, (e.T || 0.3) / 2) });
        b.node.position.set(e.r0, 0, 0); holder.add(b.node); b.node.userData.opening = e.id; things.push(b);
        // the reveal through the wall, lined in oak: the door's own, so it is there whenever the door is seen
        // (from the far room too, when the room that hangs it is not drawn)
        // and its threshold: the oak sill through the wall, the doorway's own floor
        { const w = e.r1 - e.r0, h = e.top, T = e.T || 0.3, t = 0.025, parts = [new THREE.BoxGeometry(t, h, T), new THREE.BoxGeometry(t, h, T), new THREE.BoxGeometry(w, t, T), new THREE.BoxGeometry(w + 0.02, 0.012, T + 0.02)];
          parts[0].translate(t / 2 + 0.004, h / 2, -T / 2); parts[1].translate(w - t / 2 - 0.004, h / 2, -T / 2); parts[2].translate(w / 2, h - t / 2 - 0.004, -T / 2); parts[3].translate(w / 2, 0.006, -T / 2);
          const g = mergeGeometries(parts.map(q => q.toNonIndexed()), false); if (M.oak.vertexColors) K.board(g, 0.15);
          const lining = new THREE.Mesh(g, M.oak); lining.receiveShadow = true; b.node.add(lining); }
      }
    }
    // the anchor furniture, by the furnishing habit (src/make/furnish.js): things that work, drawn with their room
    const placed = furnish({ room: { ...room, H }, spec, plan, anchors: furnished ? T.anchor || [] : [], sizeOf, sweptOf, traitsOf, settingsOf, stairFloors: (s) => [stairFrom(s), stairTo(s)] });
    placed.forEach((p, i) => {
      const b = build(THREE, K, look, p.kind, `manor/${room.id}/${p.kind}:${i}`, p.over || {}), n = b.node, d = sizeOf(p.kind, p.over || {})?.[2] || 0;
      if (p.wall) { const holder = new THREE.Group(); holder.position.set(...P[p.wall].pos); holder.rotation.y = P[p.wall].rot; movers.add(holder); n.position.set(p.r, 0, p.d); holder.add(n); }
      else { const [u, v] = p.at, f = p.facing ?? 1;
        if (p.along) { n.rotation.y = f > 0 ? 0 : Math.PI; n.position.set(u, 0, -v - f * d / 2); }
        else { n.rotation.y = f > 0 ? Math.PI / 2 : -Math.PI / 2; n.position.set(u - f * d / 2, 0, -v); }
        movers.add(n); }
      n.userData.room = room.id; things.push(b);
      if (p.rect) blocks.push({ floor: room.floor, room: room.id, kind: p.kind, x0: x0 + p.rect.u0, x1: x0 + p.rect.u1, y0: y0 + p.rect.v0, y1: y0 + p.rect.v1 });
    });
    // each chimneypiece is solid to a body: its breast and the fire's mouth within it (Kabe, 2026-10-06: "the
    // hearth doesn't collide with the player and I can walk inside"); an open kitchen hearth's mouth too
    { const RW = room.rect.x1 - room.rect.x0, RD = room.rect.y1 - room.rect.y0;
      for (const F of ["N", "E", "S", "W"]) for (const e of spec.walls[F]) if (e.kind === "chimneypiece") {
        // the breast, and in front of it the surround, the mantel and its shelf (some 0.3 m proud, wider than the
        // fire by its ends): a body keeps out of all of it, so an eye can't stand inside the mantel
        const deep = (e.breast || 0) + 0.32, m = e.mantel || e, [a, b] = [wallToRoom(F, RW, RD, Math.min(e.r0, m.r0) - 0.05, 0), wallToRoom(F, RW, RD, Math.max(e.r1, m.r1) + 0.05, deep)];
        blocks.push({ floor: room.floor, room: room.id, kind: "hearth", x0: x0 + Math.min(a[0], b[0]), x1: x0 + Math.max(a[0], b[0]), y0: y0 + Math.min(a[1], b[1]), y1: y0 + Math.max(a[1], b[1]) }); } }
    merge(grp, bundles);
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
    rooms.set(room.id, { room, grp, movers, H, Y, lights: [] });
  }
  // the stairs: each flight its treads and risers on a sloping soffit, open beneath; each half-landing a
  // slab on newel posts; a balustrade (rail, turned balusters, newels) wherever a flight or a landing or a
  // floor's well has an open side
  const stairParts = new Map();                                       // owner room -> [geometries]
  const partOf = (s) => { const id = s.joins.find(j => plan.rooms.find(q => q.id === j)?.floor === stairFrom(s)) || s.joins[0]; if (!stairParts.has(id)) stairParts.set(id, []); return stairParts.get(id); };
  const BAL = new THREE.LatheGeometry([[0, 0], [0.03, 0], [0.03, 0.06], [0.018, 0.1], [0.028, 0.32], [0.016, 0.5], [0.022, 0.62], [0.016, 0.72], [0.03, 0.76], [0, 0.76]].map(([r, y]) => new THREE.Vector2(r, y)), 8);
  const cube = (x0b, x1b, y0b, y1b, z0b, z1b) => { const g = new THREE.BoxGeometry(x1b - x0b, z1b - z0b, y1b - y0b); g.translate((x0b + x1b) / 2, (z0b + z1b) / 2, -(y0b + y1b) / 2); return g; };
  // a rail from plan point a (at height ha) to b (at hb): balusters along it, a moulded rail on top, a newel at each end
  const rail = (out, [ax, ay, ha], [bx, by, hb], newels = true) => {
    const L = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.round(L / 0.26));
    for (let i = 1; i < n; i++) { const t = i / n, g = BAL.clone(), y = ha + (hb - ha) * t; g.scale(1, (0.86) / 0.76, 1); g.translate(ax + (bx - ax) * t, y, -(ay + (by - ay) * t)); out.push(g); }
    const g = new THREE.BoxGeometry(0.08, 0.07, 1); const dir = new THREE.Vector3(bx - ax, hb - ha, -(by - ay)), len = dir.length(); g.scale(1, 1, len); g.lookAt(dir); g.translate((ax + bx) / 2, (ha + hb) / 2 + 0.9, -(ay + by) / 2); out.push(g);
    if (newels) for (const [x, y, h] of [[ax, ay, ha], [bx, by, hb]]) out.push(cube(x - 0.07, x + 0.07, y - 0.07, y + 0.07, h - 0.3, h + 1.05), cube(x - 0.09, x + 0.09, y - 0.09, y + 0.09, h + 1.05, h + 1.12));
  };
  const along = (s) => s.up === "N" || s.up === "S";
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
    // its open side: the side toward the other flight (the well), railed from foot to head
    const well = (plan.wells || []).find(w => w.id === s.well), other = plan.stairs.find(q => q.well === s.well && q.kind === "flight" && q !== s);
    if (other) { const toward = along(s) ? (other.rect.x0 > R.x0 ? "hi" : "lo") : (other.rect.y0 > R.y0 ? "hi" : "lo");
      const a = along(s) ? (toward === "hi" ? R.x1 - 0.05 : R.x0 + 0.05) : (toward === "hi" ? R.y1 - 0.05 : R.y0 + 0.05);
      const lo = s.up === "N" ? R.y0 : s.up === "S" ? R.y1 : s.up === "E" ? R.x0 : R.x1, hi = s.up === "N" ? R.y1 : s.up === "S" ? R.y0 : s.up === "E" ? R.x1 : R.x0;
      const pt = (u, h) => along(s) ? [a, u, h] : [u, a, h];
      rail(out, pt(lo, base + h0 + dh), pt(hi, base + rise * s.z1)); }
  }
  // round each floor's well: the open long side and the landing's end, where they stand off a wall
  for (const w of plan.wells || []) {
    const room = plan.rooms.find(q => q.floor === w.to && q.rect.x0 <= w.hole.x0 + 0.01 && q.rect.x1 >= w.hole.x1 - 0.01 && q.rect.y0 <= w.hole.y0 + 0.01 && q.rect.y1 >= w.hole.y1 - 0.01); if (!room) continue;
    const H = levelOf(w.to), Q = room.rect, Rh = w.hole, out = stairParts.get(room.id) || (stairParts.set(room.id, []), stairParts.get(room.id));
    const foot = (plan.wells.find(v => v.id === w.id).rect), footLo = foot.y0 < Rh.y0 - 0.01 ? "S" : foot.y1 > Rh.y1 + 0.01 ? "N" : foot.x0 < Rh.x0 - 0.01 ? "W" : "E";
    const edges = { N: [[Rh.x0, Rh.y1], [Rh.x1, Rh.y1], Q.y1 - Rh.y1], S: [[Rh.x0, Rh.y0], [Rh.x1, Rh.y0], Rh.y0 - Q.y0], E: [[Rh.x1, Rh.y0], [Rh.x1, Rh.y1], Q.x1 - Rh.x1], W: [[Rh.x0, Rh.y0], [Rh.x0, Rh.y1], Rh.x0 - Q.x0] };
    for (const [F, [a, b, gapToWall]] of Object.entries(edges)) if (F !== footLo && gapToWall > 0.2) rail(out, [...a, H], [...b, H]);
    // the floor's edge round the well, cased in oak boards down through the floor's thickness (the carve stands behind)
    for (const g of [cube(Rh.x0 - 0.035, Rh.x1 + 0.035, Rh.y1, Rh.y1 + 0.035, H - gap - 0.03, H), cube(Rh.x0 - 0.035, Rh.x1 + 0.035, Rh.y0 - 0.035, Rh.y0, H - gap - 0.03, H),
      cube(Rh.x0 - 0.035, Rh.x0, Rh.y0, Rh.y1, H - gap - 0.03, H), cube(Rh.x1, Rh.x1 + 0.035, Rh.y0, Rh.y1, H - gap - 0.03, H)]) out.push(g);
  }
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
  const solid = new THREE.Mesh(carveMesh(THREE, carved), [M.stone || mats.carve, M.plaster, mats.carve]); solid.userData = { carve: true }; scene.add(solid);
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
  return { carved, specs, scene, rooms, things, windows, blocks, hearths, flames, levelOf, heightOf, stairFrom, stairTo, visibleFrom, show, ms: Math.round(performance.now() - t0) };
}

const r2 = (x) => Math.round(x * 100) / 100;
// a room's still meshes merged by material: a few draws a room, which its bundle then replays
function merge(grp, bundle = false) {
  grp.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(grp.matrixWorld).invert(), byMat = new Map();
  grp.traverse(o => { if (o.isMesh && !o.isInstancedMesh) (byMat.get(o.material) || byMat.set(o.material, []).get(o.material)).push(o); });
  const keep = [];
  for (const [mat, list] of byMat) {
    const geos = list.map(o => { let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
      for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv", "color"].includes(k)) g.deleteAttribute(k);
      if (mat.vertexColors && !g.attributes.color) g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 3).fill(1), 3));
      if (!mat.vertexColors && g.attributes.color) g.deleteAttribute("color");
      if (!g.attributes.uv) g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      if (!g.attributes.normal) g.computeVertexNormals(); g.clearGroups(); return g; });
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
