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
import { compileRoom } from "../../lab/house/plan-compile.js";
import { buildWall, slab, rect, metric } from "../../lab/painted/procedural.js";
import { buildStrongroom } from "../../lab/brief/strongroom.js";
import { compileBrief } from "../../lab/brief/brief.js";
import { build } from "./build.js";
import { kindOf, sizeOf as kindSize } from "./catalogue.js";
import { furnish } from "./furnish.js";
import { rng, seedOf } from "./id.js";

const PLACE = (W, D) => ({ N: { pos: [0, 0, -D], rot: 0 }, S: { pos: [W, 0, 0], rot: Math.PI }, E: { pos: [W, 0, -D], rot: -Math.PI / 2 }, W: { pos: [0, 0, 0], rot: Math.PI / 2 } });
const WALL_STYLE = { wainscot: "panelled", tapestry: "limewashed", limewash: "limewashed", stone: "limewashed" };

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
  const floors = [...plan.floors].sort((a, b) => a.level - b.level), gap = 0.35;
  const levelOf = (id) => { let y = 0; for (const f of floors) { if (f.id === id) return y; y += f.storey_height_m + gap; } return y; };
  const heightOf = (room) => { const i = floors.findIndex(f => f.id === room.floor), n = room.rises || 1; let h = 0; for (let k = 0; k < n && floors[i + k]; k++) h += floors[i + k].storey_height_m + (k ? gap : 0); return h; };
  const stairFrom = (s) => s.from || floors[0].id, stairTo = (s) => s.to || floors[1].id;
  const mats = {
    gypsum: Object.assign(new THREE.MeshStandardMaterial({ color: 0xd8ccb0, roughness: 0.45 }), { userData: { cls: "gypsum" } }),
    matting: Object.assign(new THREE.MeshStandardMaterial({ color: 0xa88c58, roughness: 0.95 }), { userData: { cls: "matting" } }),
    plaster: M.plaster, limewash: M.limewash,
  };
  const scene = new THREE.Group(), rooms = new Map(), things = [], windows = [], blocks = [];
  // a kind's size in its own frame (from its data, or measured once from a build)
  const sizes = new Map(), box = new THREE.Box3(), v3 = new THREE.Vector3();
  const sizeOf = (kind, over = {}) => { const key = kind + JSON.stringify(over); if (!sizes.has(key)) { const k = kindOf(kind); let s = k ? kindSize(k, 0, over) : null;
      if (k && !s) { const b = build(THREE, K, look, kind, `probe/${kind}`, over); box.setFromObject(b.node).getSize(v3); s = [v3.x, v3.y, box.max.z]; }
      sizes.set(key, s); } return sizes.get(key); };
  const settingsOf = (kind) => kindOf(kind)?.settings || {};
  const traitsOf = (kind) => kindOf(kind)?.traits || [];
  const tileUV = (g, k) => { const uv = g.attributes.uv, p = g.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / k, p.getY(i) / k); return g; };

  for (const room of plan.rooms) {
    if (room.type === "open") continue;
    const T = types[room.room_type] || {}, { x0, x1, y0, y1 } = room.rect, W = x1 - x0, D = y1 - y0, Y = levelOf(room.floor), H = heightOf(room);
    const grp = bundles ? new THREE.BundleGroup() : new THREE.Group(); grp.position.set(x0, Y, -y0); grp.userData.room = room.id;
    const movers = new THREE.Group(); movers.position.copy(grp.position);
    // the muniment room: its own builder, from its period brief
    if (room.room_type === "muniment_room" && brief) {
      const spec = compileBrief(plan, room.id, brief), sr = buildStrongroom(THREE, K, spec);
      sr.group.position.set(x0, Y, -y0); scene.add(sr.group); things.push(...sr.things);
      for (const l of sr.lights) l.userData.room = room.id;
      rooms.set(room.id, { room, grp: sr.group, movers: null, H, Y, lights: sr.lights, colliders: sr.colliders, strongroom: sr });
      continue;
    }
    const spec = compileRoom(plan, room);
    // windows by rank: a state room's mullion-and-transom lights reach high; a closet's are small
    for (const F of Object.keys(spec.walls)) for (const e of spec.walls[F]) {
      if (e.kind !== "window") continue;
      if (T.windows === "state") { e.sill = 0.75; e.top = Math.min(H - 0.45, 3.2); }
      else if (T.windows === "small") { e.sill = 1.15; e.top = Math.min(H - 0.5, 2.1); }
      else { e.sill = 0.9; e.top = Math.min(H - 0.5, 2.5); }
    }
    // a kitchen's (or bakehouse's) hearth is an open one: wide, square-mouthed, deep, under a beam
    if (T.hearth === "kitchen") for (const F of Object.keys(spec.walls)) for (const e of spec.walls[F]) if (e.kind === "chimneypiece") {
      const top = Math.min(1.75, H - 1.2);
      Object.assign(e, { open: true, surround_top: top + 0.32, mantel: { r0: e.r0 - 0.1, r1: e.r1 + 0.1, top: top + 0.32, depth: 0.08 },
        firebox: { r0: e.r0 + 0.32, r1: e.r1 - 0.32, spring: top, apex: top, depth: (e.breast || 0) > 0.35 ? e.breast - 0.01 : 0.6 }, hearth: { r0: e.r0 + 0.2, r1: e.r1 - 0.2, out: 0.6 } });
    }
    // the floor (with a hole where a stair comes up through it) and the ceiling (with one where it goes up)
    const stairsHere = plan.stairs.filter(s => s.rect.x0 < x1 && s.rect.x1 > x0 && s.rect.y0 < y1 && s.rect.y1 > y0);
    const holeOf = (s) => rect(Math.max(0, s.rect.x0 - x0), Math.min(W, s.rect.x1 - x0), Math.max(0, s.rect.y0 - y0), Math.min(D, s.rect.y1 - y0));
    const up = stairsHere.filter(s => stairTo(s) === room.floor).map(holeOf);
    const topFloor = floors[Math.min(floors.length - 1, floors.findIndex(f => f.id === room.floor) + (room.rises || 1) - 1)].id;
    const down = stairsHere.filter(s => stairFrom(s) === topFloor).map(holeOf).map(h => h.map(([x, y]) => [x, D - y]).reverse());
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
      // the doors this room hangs (the first room an opening joins), as things that work
      // (the strongroom hangs its own iron door)
      for (const e of spec.walls[F]) if (e.kind === "door" && e.joins?.[0] === room.id && !e.joins.some(j => plan.rooms.find(q => q.id === j)?.room_type === "muniment_room")) {
        const holder = new THREE.Group(); holder.position.set(...P[F].pos); holder.rotation.y = P[F].rot; movers.add(holder);
        const b = build(THREE, K, look, "door/panelled", `manor/${room.id}/${e.id}`, { w: r2(e.r1 - e.r0), h: r2(e.top), set: -Math.min(0.1, (e.T || 0.3) / 2) });
        b.node.position.set(e.r0, 0, 0); holder.add(b.node); b.node.userData.opening = e.id; things.push(b);
      }
    }
    // the anchor furniture, by the furnishing habit (src/make/furnish.js): things that work, drawn with their room
    const placed = furnish({ room, spec, plan, anchors: furnished ? T.anchor || [] : [], sizeOf, traitsOf, settingsOf, stairFloors: (s) => [stairFrom(s), stairTo(s)] });
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
    merge(grp);
    scene.add(grp, movers);
    rooms.set(room.id, { room, grp, movers, H, Y, lights: [] });
  }
  // the stairs: oak treads from floor to floor, and the stairwell's sides between ceiling and floor above
  for (const s of plan.stairs) {
    const base = levelOf(stairFrom(s)), top = levelOf(stairTo(s)), n = s.treads, R = s.rect, rise = (top - base) / n;
    const along = s.up === "N" || s.up === "S" ? R.y1 - R.y0 : R.x1 - R.x0, run = along / n, parts = [];
    for (let i = 0; i < n; i++) {
      const hgt = (i + 1) * rise; let bx0 = R.x0, bx1 = R.x1, by0 = R.y0, by1 = R.y1;
      if (s.up === "N") { by0 = R.y0 + i * run; by1 = by0 + run; } if (s.up === "S") { by1 = R.y1 - i * run; by0 = by1 - run; }
      if (s.up === "E") { bx0 = R.x0 + i * run; bx1 = bx0 + run; } if (s.up === "W") { bx1 = R.x1 - i * run; bx0 = bx1 - run; }
      const g = new THREE.BoxGeometry(bx1 - bx0, hgt, by1 - by0); g.translate((bx0 + bx1) / 2, base + hgt / 2, -(by0 + by1) / 2); K.board(g, 0.2); parts.push(g);
    }
    const m = new THREE.Mesh(mergeGeometries(parts.map(g => g.toNonIndexed()), false), M.oakH); m.castShadow = m.receiveShadow = true;
    const owner = rooms.get(s.joins.find(id => plan.rooms.find(q => q.id === id)?.floor === stairFrom(s)));
    (owner ? owner.grp : scene).add(owner ? (m.position.set(-owner.grp.position.x, -owner.grp.position.y, -owner.grp.position.z), m) : m);
  }
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
  return { scene, rooms, things, windows, blocks, levelOf, heightOf, stairFrom, stairTo, visibleFrom, show, ms: Math.round(performance.now() - t0) };
}

const r2 = (x) => Math.round(x * 100) / 100;
// a room's still meshes merged by material: a few draws a room, which its bundle then replays
function merge(grp) {
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
  for (const m of keep) grp.add(m);
  for (const o of others) { o.parent?.remove(o); grp.add(o); }
}
