// The whole manor from its plan, in code: no painting, no prompt, no per-room anything.
// packs/manor's plan (rooms, doors, windows, fireplaces, stairs) compiles to each wall's elements;
// lab/painted/procedural.js's kit builds them. One style for the house, varied by room archetype.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { makeKit, buildWall, buildDesk, slab, rect, run, block, loft, metric, canvasTex, normalFrom, fbm, rng, smooth, hash, stoneTexture } from "../painted/procedural.js";

const LEVEL_GAP = 3.1;                     // storey 2.8 + a 0.3 floor between
const EPS = 0.06;

// ---------------------------------------------------------------- the plan, compiled
// For a room and a plan rect, which of the room's walls it lies on, and where along that wall
// (r from the wall's left corner as you face it). null if it touches none.
function onWall(room, R, inside = false) {
  const { x0, x1, y0, y1 } = room.rect;
  const ovx = Math.min(x1, R.x1) - Math.max(x0, R.x0), ovy = Math.min(y1, R.y1) - Math.max(y0, R.y0);
  const near = (a, b) => Math.abs(a - b) < EPS;
  const hits = [];
  if (ovx > 0.05 && (inside ? near(R.y1, y1) : (near(R.y0, y1) || (R.y0 < y1 + EPS && R.y1 > y1 + EPS && R.y0 > y1 - 0.8))))
    hits.push({ F: "N", r0: Math.max(x0, R.x0) - x0, r1: Math.min(x1, R.x1) - x0, T: R.y1 - R.y0 });
  if (ovx > 0.05 && (inside ? near(R.y0, y0) : (near(R.y1, y0) || (R.y1 > y0 - EPS && R.y0 < y0 - EPS && R.y1 < y0 + 0.8))))
    hits.push({ F: "S", r0: x1 - Math.min(x1, R.x1), r1: x1 - Math.max(x0, R.x0), T: R.y1 - R.y0 });
  if (ovy > 0.05 && (inside ? near(R.x1, x1) : (near(R.x0, x1) || (R.x0 < x1 + EPS && R.x1 > x1 + EPS && R.x0 > x1 - 0.8))))
    hits.push({ F: "E", r0: y1 - Math.min(y1, R.y1), r1: y1 - Math.max(y0, R.y0), T: R.x1 - R.x0 });
  if (ovy > 0.05 && (inside ? near(R.x0, x0) : (near(R.x1, x0) || (R.x1 > x0 - EPS && R.x0 < x0 - EPS && R.x1 < x0 + 0.8))))
    hits.push({ F: "W", r0: Math.max(y0, R.y0) - y0, r1: Math.min(y1, R.y1) - y0, T: R.x1 - R.x0 });
  return hits[0] || null;
}

export function compileRoom(plan, room) {
  const H = plan.floors.find(f => f.id === room.floor).storey_height_m;
  const walls = { N: [], E: [], S: [], W: [] };
  for (const o of plan.openings) {
    if (!(o.joins || []).includes(room.id) || !o.rect) continue;
    const w = onWall(room, o.rect); if (!w) continue;
    if (o.kind === "open_edge") walls[w.F].push({ kind: "open", id: o.id, r0: w.r0, r1: w.r1, top: H, T: 0, lining: false });
    else walls[w.F].push({ kind: "door", id: o.id, r0: w.r0, r1: w.r1, top: Math.min(2.2, H - 0.5), T: Math.max(0.05, w.T),
                           lining: o.joins[0] === room.id || plan.rooms.find(r => r.id === o.joins.find(j => j !== room.id))?.type === "open", passage: false, joins: o.joins });
  }
  for (const [i, win] of plan.windows.entries()) {
    if (win.floor !== room.floor) continue;
    const w = onWall(room, win.rect); if (!w) continue;
    walls[w.F].push({ kind: "window", id: `win${i}`, r0: w.r0, r1: w.r1, sill: 0.95, top: Math.min(H - 0.32, 2.45), splay: 0.1, T: w.T, lights: [2, 2] });
  }
  for (const [i, fp] of plan.fireplaces.entries()) {
    if (fp.room !== room.id) continue;
    const w = onWall(room, fp.rect, true); if (!w) continue;
    const wd = w.r1 - w.r0, c = (w.r0 + w.r1) / 2, s = Math.min(1.3, Math.max(0.85, wd / 2.21));
    walls[w.F].push({ kind: "chimneypiece", id: `hearth${i}`, r0: w.r0, r1: w.r1, surround_top: 1.356 * s,
      mantel: { r0: w.r0 - 0.19, r1: w.r1 + 0.19, top: 1.761 * s, depth: 0.17 },
      firebox: { r0: c - wd * 0.33, r1: c + wd * 0.33, spring: 0.83 * s, apex: 1.219 * s, depth: Math.min(0.5, Math.max(0.3, w.T - 0.06)) },
      hearth: { r0: w.r0 - 0.09, r1: w.r1 + 0.09, out: 0.4 },
      breast: Math.max(0, w.T - 0.02) });       // the plan's fireplace rect is the breast standing into the room
  }
  const style = room.archetype === "service" ? "limewashed" : "panelled";
  const floor = room.archetype === "service" || room.archetype === "hall" ? "flags" : "boards";
  return { room, H, walls, style, floor };
}

// ---------------------------------------------------------------- ground outdoors
function grassTexture(N = 512) {
  const H = new Float32Array(N * N);
  const map = canvasTex(THREE, N, N, (d) => {
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const u = x / N, v = y / N, m = fbm(u * 6, v * 6, 6, 6, 4, 201), f = fbm(u * 120, v * 120, 120, 120, 2, 203);
      const k = 0.6 + 0.5 * m + 0.25 * f, o = (y * N + x) * 4;
      d[o] = 62 * k; d[o + 1] = 84 * k; d[o + 2] = 40 * k; d[o + 3] = 255; H[y * N + x] = f;
    }
  });
  return { map, normalMap: normalFrom(THREE, H, N, N, 1.5) };
}
function gravelTexture(N = 512) {
  const H = new Float32Array(N * N);
  const map = canvasTex(THREE, N, N, (d) => {
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const u = x / N, v = y / N, f = fbm(u * 160, v * 160, 160, 160, 2, 211), m = fbm(u * 5, v * 5, 5, 5, 3, 213);
      const k = 0.7 + 0.35 * f + 0.15 * m, o = (y * N + x) * 4;
      d[o] = 150 * k; d[o + 1] = 138 * k; d[o + 2] = 116 * k; d[o + 3] = 255; H[y * N + x] = f;
    }
  });
  return { map, normalMap: normalFrom(THREE, H, N, N, 2.5) };
}

// ---------------------------------------------------------------- the house
export async function buildHouse(plan, onStep = () => {}, { startId = null, nearFirst = 14 } = {}) {
  const t0 = performance.now(), timing = {};
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xa9b7c4);
  const K = await makeKit(THREE, { onStep });
  K.carveDensity = 110;             // 66 hearths: carving at a third of the single room's density (~7k tris each, not 64k)
  const { M } = K;
  timing.materials_ms = Math.round(performance.now() - t0);
  const tileUV = (g, k) => { const uv = g.attributes.uv, p = g.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / k, p.getY(i) / k); return g; };
  M.floor.map.repeat.set(1, 1);
  const out = { grass: new THREE.MeshStandardMaterial({ ...grassTexture(), roughness: 0.95 }), gravel: new THREE.MeshStandardMaterial({ ...gravelTexture(), roughness: 0.95 }),
    ashlar: new THREE.MeshStandardMaterial({ ...stoneTexture(THREE, 512, [150, 140, 118], false), roughness: 0.9 }),
    glassOut: new THREE.MeshStandardMaterial({ color: 0x1c2328, roughness: 0.12, metalness: 0.7 }) };
  out.ashlar.map.repeat.set(0.5, 0.5); out.ashlar.normalMap.repeat.set(0.5, 0.5);
  const level = (f) => plan.floors.find(x => x.id === f).level * LEVEL_GAP;
  const stairFrom = (s) => s.from || plan.floors[0].id, stairTo = (s) => s.to || plan.floors[1].id;
  const doors = [];                                   // door leaves: hinged, animated, not merged
  const PLACE0 = (W, D) => ({ N: { pos: [0, 0, -D], rot: 0 }, S: { pos: [W, 0, 0], rot: Math.PI }, E: { pos: [W, 0, -D], rot: -Math.PI / 2 }, W: { pos: [0, 0, 0], rot: Math.PI / 2 } });
  // a panelled door leaf, w x h, 45 mm thick, hinged at its left edge (x = 0), lying in the wall's plane
  const leafGeo = (w, h) => {
    const parts = [];
    const fr = metric(new THREE.BoxGeometry(w, h, 0.045)); fr.translate(w / 2, h / 2, 0); parts.push(fr);
    for (const [y0, y1] of [[0.12, h * 0.42], [h * 0.48, h - 0.12]]) {
      const pan = loft(THREE, rect(0.1, w - 0.1, y0, y1), [[0, 0.0225], [0.012, 0.03], [0.03, 0.033]], true, true);
      parts.push(pan);
      const back = pan.clone(); back.scale(1, 1, -1); parts.push(back);
    }
    const knob = new THREE.SphereGeometry(0.025, 10, 8); knob.translate(w - 0.07, 1.0, 0.045); parts.push(knob);
    const flat = parts.map(g => { const q = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(q.attributes)) if (!["position", "normal", "uv"].includes(k)) q.deleteAttribute(k); if (!q.attributes.uv) q.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(q.attributes.position.count * 2), 2)); q.clearGroups(); return q; });
    return mergeGeometries(flat, false);
  };
  const rooms = [], windowsWorld = [];
  // stage: compile the plan into every wall's elements (no geometry yet)
  const tc = performance.now();
  const specs = new Map(plan.rooms.filter(r => r.type !== "open").map(r => [r.id, compileRoom(plan, r)]));
  timing.compile_ms = +(performance.now() - tc).toFixed(1);
  const t1 = performance.now();
  async function makeRoom(room) {
    const { x0, x1, y0, y1 } = room.rect, W = x1 - x0, D = y1 - y0, Y = level(room.floor);
    const grp = new THREE.Group(); grp.position.set(x0, Y, -y0);
    const stairsHere = plan.stairs.filter(s => s.rect.x0 < x1 && s.rect.x1 > x0 && s.rect.y0 < y1 && s.rect.y1 > y0);
    const holeOf = (s) => rect(Math.max(0, s.rect.x0 - x0), Math.min(W, s.rect.x1 - x0), Math.max(0, s.rect.y0 - y0), Math.min(D, s.rect.y1 - y0));
    if (room.type === "open") {
      const g = tileUV(slab(THREE, rect(0, W, 0, D)), 3); g.rotateX(-Math.PI / 2);
      const ground = new THREE.Mesh(g, room.id.includes("garden") ? out.grass : room.id === "entrance_court" ? M.flags : out.gravel);
      ground.receiveShadow = true; grp.add(ground);
      // the house seen from outside: an ashlar face on every side a building stands, a garden wall
      // elsewhere, with the windows and doors of the rooms behind cut through it
      const PL = { N: { pos: [0, 0, -D], rot: 0 }, S: { pos: [W, 0, 0], rot: Math.PI }, E: { pos: [W, 0, -D], rot: -Math.PI / 2 }, W: { pos: [0, 0, 0], rot: Math.PI / 2 } };
      for (const F of ["N", "E", "S", "W"]) {
        const L = F === "N" || F === "S" ? W : D;
        const probe = { N: { x0, x1, y0: y1, y1: y1 + 0.7 }, S: { x0, x1, y0: y0 - 0.7, y1: y0 }, E: { x0: x1, x1: x1 + 0.7, y0, y1 }, W: { x0: x0 - 0.7, x1: x0, y0, y1 } }[F];
        const built = plan.rooms.some(q => q.type !== "open" && q.rect.x0 < probe.x1 + 0.7 && q.rect.x1 > probe.x0 - 0.7 && q.rect.y0 < probe.y1 + 0.7 && q.rect.y1 > probe.y0 - 0.7 &&
          ((F === "N" && q.rect.y0 >= y1 - EPS) || (F === "S" && q.rect.y1 <= y0 + EPS) || (F === "E" && q.rect.x0 >= x1 - EPS) || (F === "W" && q.rect.x1 <= x0 + EPS)));
        const HH = built ? 2 * LEVEL_GAP + 0.5 : 2.2;
        const holes = [], notches = [];
        for (const win of plan.windows) { const w = onWall(room, win.rect); if (w && w.F === F) holes.push(rect(w.r0, w.r1, level(win.floor) + 0.95, level(win.floor) + Math.min(2.48, 2.45))); }
        for (const o of plan.openings) { if (!(o.joins || []).includes(room.id) || !o.rect) continue; const w = onWall(room, o.rect); if (w && w.F === F) notches.push([w.r0, w.r1, o.kind === "open_edge" ? HH + 1 : 2.2]); }
        const outline = [[0, 0]];
        for (const [a, b, t] of notches.sort((p, q) => p[0] - q[0])) { if (t > HH) { outline.push([a, 0], [a, HH], [b, HH], [b, 0]); } else outline.push([a, 0], [a, t], [b, t], [b, 0]); }
        outline.push([L, 0], [L, HH], [0, HH]);
        const shown = holes.filter(h => h[2][1] < HH);
        const fg = tileUV(slab(THREE, outline, shown), 2);
        const face = new THREE.Mesh(fg, built ? out.ashlar : M.brick); face.castShadow = face.receiveShadow = true;
        const fgrp = new THREE.Group(); fgrp.add(face);
        const cap = run(THREE, 0, L, HH - 0.12, [[0, 0], [0, 0.06], [0.04, 0.1], [0.1, 0.12], [0.12, 0.12], [0.12, 0]]);
        const cm = new THREE.Mesh(cap, out.ashlar); cm.castShadow = true; fgrp.add(cm);
        // each window seen from outside: dark crown glass a hand back from the face, a stone mullion and transom
        for (const h of shown) {
          const [a, y0] = h[0], [b, y1] = h[2];
          const pg = new THREE.PlaneGeometry(b - a, y1 - y0); pg.translate((a + b) / 2, (y0 + y1) / 2, -0.12);
          fgrp.add(new THREE.Mesh(pg, out.glassOut));
          for (const [bx0, bx1, by0, by1] of [[(a + b) / 2 - 0.04, (a + b) / 2 + 0.04, y0, y1], [a, b, y0 + (y1 - y0) * 0.62 - 0.035, y0 + (y1 - y0) * 0.62 + 0.035]]) {
            const bg = new THREE.BoxGeometry(bx1 - bx0, by1 - by0, 0.14); bg.translate((bx0 + bx1) / 2, (by0 + by1) / 2, -0.07);
            const bm = new THREE.Mesh(bg, out.ashlar); bm.castShadow = true; fgrp.add(bm);
          }
        }
        fgrp.position.set(...PL[F].pos); fgrp.rotation.y = PL[F].rot; grp.add(fgrp);
      }
      const r = { room, grp, H: 0, open: true };
      scene.add(grp); return r;
    }
    const spec = specs.get(room.id), H = spec.H;
    // floor (with a hole where a stair comes up through it) and ceiling (with a hole where one goes up)
    const up = stairsHere.filter(s => stairTo(s) === room.floor).map(holeOf);
    // the ceiling slab is turned face-down, which mirrors it north-south: mirror its holes to match
    const downTo = stairsHere.filter(s => stairFrom(s) === room.floor).map(holeOf).map(h => h.map(([x, y]) => [x, D - y]).reverse());
    const fg = tileUV(slab(THREE, rect(0, W, 0, D), up), spec.floor === "flags" ? 2 : 4); fg.rotateX(-Math.PI / 2);
    const fm = new THREE.Mesh(fg, spec.floor === "flags" ? M.flags : M.floor); fm.receiveShadow = true; grp.add(fm);
    const cg = tileUV(slab(THREE, rect(0, W, 0, D), downTo), 1); cg.rotateX(Math.PI / 2); cg.translate(0, H, -D);
    // (a slab in the XY plane turned face-down: its y becomes -z, so shift it back over the room)
    const cm = new THREE.Mesh(cg, spec.style === "limewashed" ? M.limewash : M.plaster); cm.castShadow = cm.receiveShadow = true; grp.add(cm);
    const PLACE = { N: { pos: [0, 0, -D], rot: 0 }, S: { pos: [W, 0, 0], rot: Math.PI }, E: { pos: [W, 0, -D], rot: -Math.PI / 2 }, W: { pos: [0, 0, 0], rot: Math.PI / 2 } };
    for (const F of ["N", "E", "S", "W"]) {
      const L = F === "N" || F === "S" ? W : D;
      const w = buildWall(THREE, K, F, L, H, spec.walls[F], { style: spec.style });
      w.grp.position.set(...PLACE[F].pos); w.grp.rotation.y = PLACE[F].rot;
      for (const l of w.lights) { l.parent.remove(l); }
      grp.add(w.grp);
      // leaded glass seen from the courts too
      // where each window's daylight comes from, in world space, fixed now (the wall groups are merged away)
      scene.add(grp); grp.updateMatrixWorld(true);
      // door leaves, one per doorway (the room that lines it hangs it), and writing tables under windows
      const P = PLACE0(W, D)[F];
      for (const e of spec.walls[F]) if (e.kind === "door" && e.lining !== false) {
        const holder = new THREE.Group(); holder.position.set(x0 + P.pos[0], Y, -y0 + P.pos[2]); holder.rotation.y = P.rot;
        const pivot = new THREE.Group(); pivot.position.set(e.r0 + 0.005, 0, -e.T / 2); holder.add(pivot);
        const g = leafGeo(e.r1 - e.r0 - 0.01, e.top - 0.01); K.board(g, 0.18);
        const leaf = new THREE.Mesh(g, M.oakH); leaf.castShadow = leaf.receiveShadow = true; leaf.userData.door = e.id; pivot.add(leaf);
        scene.add(holder);
        const o = plan.openings.find(q => q.id === e.id);
        doors.push({ id: e.id, pivot, holder, leaf, floor: room.floor, rect: o.rect, angle: 1.62, target: 1.62, room: room.id });
        pivot.rotation.y = -1.62;
      }
      for (const ob of (plan.objects || []).filter(q => q.kind === "desk" && q.room === room.id && !q.placed)) {
        const win = spec.walls[F].find(e => e.kind === "window" && e.r1 - e.r0 > 1.0);
        if (!win) continue;
        const d = buildDesk(THREE, K);
        const holder = new THREE.Group(); holder.position.set(...P.pos); holder.rotation.y = P.rot;
        d.group.position.set((win.r0 + win.r1) / 2, 0, 0.04); holder.add(d.group); grp.add(holder);
        ob.placed = true;
      }
      for (const e of spec.walls[F]) if (e.kind === "window") {
        const c = new THREE.Vector3((e.r0 + e.r1) / 2, (e.sill + e.top) / 2, -e.T + 0.06).applyMatrix4(w.grp.matrixWorld);
        const into = new THREE.Vector3((e.r0 + e.r1) / 2, (e.sill + e.top) / 2, 5).applyMatrix4(w.grp.matrixWorld);
        windowsWorld.push({ room: room.id, c, into, w: e.r1 - e.r0 - 0.3, h: e.top - e.sill - 0.15 });
      }
    }
    scene.add(grp);
    return { room, grp, H, spec };
  }
  // stairwells: the 0.3 m between a ceiling and the floor above, closed round each stair opening
  for (const s of plan.stairs) {
    const R = s.rect, y0 = level(stairFrom(s)) + 2.8, y1 = level(stairTo(s));
    const sides = [[[R.x0, R.y1], [R.x1, R.y1]], [[R.x1, R.y1], [R.x1, R.y0]], [[R.x1, R.y0], [R.x0, R.y0]], [[R.x0, R.y0], [R.x0, R.y1]]];
    for (const [[ax, ay], [bx, by]] of sides) {
      const len = Math.hypot(bx - ax, by - ay), g = new THREE.PlaneGeometry(len, y1 - y0);
      const m = new THREE.Mesh(g, M.oak); K.board(g, 0.1);
      m.position.set((ax + bx) / 2, (y0 + y1) / 2, -(ay + by) / 2);
      m.rotation.y = Math.atan2(-(by - ay), bx - ax); m.material.side = THREE.DoubleSide;
      scene.add(m);
    }
  }
  // stairs: solid oak treads rising from the ground floor to the upper
  for (const s of plan.stairs) {
    const base = level(stairFrom(s)), n = s.treads, R = s.rect, rise = (level(stairTo(s)) - base) / n, along = s.up === "N" || s.up === "S" ? R.y1 - R.y0 : R.x1 - R.x0, run_ = along / n;
    for (let i = 0; i < n; i++) {
      const hgt = (i + 1) * rise;
      let bx0 = R.x0, bx1 = R.x1, by0 = R.y0, by1 = R.y1;
      if (s.up === "N") { by0 = R.y0 + i * run_; by1 = by0 + run_; }
      if (s.up === "S") { by1 = R.y1 - i * run_; by0 = by1 - run_; }
      if (s.up === "E") { bx0 = R.x0 + i * run_; bx1 = bx0 + run_; }
      if (s.up === "W") { bx1 = R.x1 - i * run_; bx0 = bx1 - run_; }
      const g = new THREE.BoxGeometry(bx1 - bx0, hgt, by1 - by0); g.translate((bx0 + bx1) / 2, base + hgt / 2, -(by0 + by1) / 2);
      K.board(g, 0.2);
      const m = new THREE.Mesh(g, M.oakH); m.castShadow = m.receiveShadow = true; scene.add(m);
    }
  }
  timing.rooms_ms = Math.round(performance.now() - t1);
  // fewer draw calls: merge every room's meshes by material
  const t2 = performance.now(); let before = 0, after = 0;
  function mergeRoom(r) {
    r.grp.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(r.grp.matrixWorld).invert();
    const byMat = new Map();
    r.grp.traverse(o => { if (o.isMesh) { before++; (byMat.get(o.material) || byMat.set(o.material, []).get(o.material)).push(o); } });
    const keep = [];
    for (const [mat, list] of byMat) {
      const geos = list.map(o => {
        let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
        g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
        for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv", "color"].includes(k)) g.deleteAttribute(k);
        if (mat.vertexColors && !g.attributes.color) { const c = new Float32Array(g.attributes.position.count * 3).fill(1); g.setAttribute("color", new THREE.BufferAttribute(c, 3)); }
        if (!mat.vertexColors && g.attributes.color) g.deleteAttribute("color");
        if (!g.attributes.uv) g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
        g.clearGroups();
        return g;
      });
      const merged = mergeGeometries(geos, false);
      if (!merged) { keep.push(...list); continue; }
      const m = new THREE.Mesh(merged, mat); m.castShadow = !mat.isMeshBasicMaterial; m.receiveShadow = true; keep.push(m); after++;
    }
    while (r.grp.children.length) r.grp.remove(r.grp.children[0]);
    for (const m of keep) r.grp.add(m);
  }
  timing.merge_ms = Math.round(performance.now() - t2);

  // light: one sun for the house, a sky fill, and a small rig that follows you room to room
  const tl = performance.now();
  const ext = plan.rooms.reduce((b, q) => ({ x0: Math.min(b.x0, q.rect.x0), x1: Math.max(b.x1, q.rect.x1), y0: Math.min(b.y0, q.rect.y0), y1: Math.max(b.y1, q.rect.y1) }), { x0: 1e9, x1: -1e9, y0: 1e9, y1: -1e9 });
  const bb = { w: ext.x1 - ext.x0, d: ext.y1 - ext.y0, cx: (ext.x0 + ext.x1) / 2, cy: (ext.y0 + ext.y1) / 2 };
  const reach = Math.hypot(bb.w, bb.d) / 2 + 4;
  const sun = new THREE.DirectionalLight(0xffe2b8, 1.8);
  sun.position.set(bb.cx + 12, 16 + plan.floors.length * LEVEL_GAP, -bb.cy + 30); sun.target.position.set(bb.cx, 0, -bb.cy);
  sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.03;
  Object.assign(sun.shadow.camera, { left: -reach, right: reach, top: reach, bottom: -reach, near: 1, far: 140 });
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(0xb8c4d0, 0x3a2a1c, 0.45); scene.add(hemi);
  const slots = Array.from({ length: 4 }, () => { const l = new THREE.RectAreaLight(0xe4ecf2, 0, 1, 1); scene.add(l); return l; });
  const floorB = new THREE.RectAreaLight(0xffcf9a, 0, 1, 1), ceilB = new THREE.RectAreaLight(0xfff0dd, 0, 1, 1);
  scene.add(floorB, ceilB);
  const LV = { sun: 1.8, fill: 0.65, sky: 8, floorB: 0.65, ceilB: 0.15 };
  const rig = (r) => {       // put the room rig in room r: its windows, its floor, its ceiling
    sun.intensity = LV.sun; hemi.intensity = LV.fill;
    const { x0, x1, y0, y1 } = r.room.rect, Y = level(r.room.floor), W = x1 - x0, D = y1 - y0;
    const cx = (x0 + x1) / 2, cz = -(y0 + y1) / 2;
    floorB.width = W * 0.9; floorB.height = D * 0.9; floorB.position.set(cx, Y + 0.03, cz); floorB.lookAt(cx, Y + 5, cz); floorB.intensity = r.open ? 0 : LV.floorB;
    ceilB.width = W * 0.8; ceilB.height = D * 0.8; ceilB.position.set(cx, Y + (r.H || 2.8) - 0.03, cz); ceilB.lookAt(cx, Y - 5, cz); ceilB.intensity = r.open ? 0 : LV.ceilB;
    const mine = windowsWorld.filter(w => w.room === r.room.id).slice(0, slots.length);
    slots.forEach((l, i) => {
      const w = mine[i]; if (!w) { l.intensity = 0; return; }
      l.width = w.w; l.height = w.h; l.position.copy(w.c); l.lookAt(w.into); l.intensity = LV.sky;
    });
  };
  // an edit to one room: rebuild just that room (its walls, openings, windows, fireplace) and merge it
  async function rebuildRoom(id, change = (spec) => spec) {
    const t = performance.now();
    const i = rooms.findIndex(r => r.room.id === id), old = rooms[i];
    scene.remove(old.grp);
    old.grp.traverse(o => { if (o.isMesh) o.geometry.dispose(); });
    for (let k = windowsWorld.length - 1; k >= 0; k--) if (windowsWorld[k].room === id) windowsWorld.splice(k, 1);
    if (specs.has(id)) specs.set(id, change(compileRoom(plan, old.room)));
    const r = await makeRoom(old.room); mergeRoom(r); rooms[i] = r;
    return Math.round(performance.now() - t);
  }
  function cull(x, y, floorId, near = 26) {
    const lv = plan.floors.find(f => f.id === floorId).level; let shown = 0;
    for (const r of rooms) {
      const q = r.room.rect, dx = Math.max(q.x0 - x, 0, x - q.x1), dy = Math.max(q.y0 - y, 0, y - q.y1), dist = Math.hypot(dx, dy);
      const dl = Math.abs(plan.floors.find(f => f.id === r.room.floor).level - lv);
      r.grp.visible = dl === 0 ? dist < near : dl === 1 ? dist < 6 : false;
      shown += r.grp.visible;
    }
    for (const d of doors) { const q = d.rect, dist = Math.hypot(Math.max(q.x0 - x, 0, x - q.x1), Math.max(q.y0 - y, 0, y - q.y1)); d.holder.visible = d.floor === floorId && dist < near; }
    return shown;
  }
  timing.lighting_setup_ms = +(performance.now() - tl).toFixed(1);
  // rooms: the ones round where you start first (so the first frame waits for those alone), then the
  // rest of the house streamed in behind, nearest first, a room at a time between frames
  const startRoom = plan.rooms.find(q => q.id === startId) || plan.rooms[0];
  const sx = (startRoom.rect.x0 + startRoom.rect.x1) / 2, sy = (startRoom.rect.y0 + startRoom.rect.y1) / 2, slv = plan.floors.find(f => f.id === startRoom.floor).level;
  const distOf = (q) => Math.hypot(Math.max(q.rect.x0 - sx, 0, sx - q.rect.x1), Math.max(q.rect.y0 - sy, 0, sy - q.rect.y1)) + 40 * Math.abs(plan.floors.find(f => f.id === q.floor).level - slv);
  const order = [...plan.rooms].sort((a, b) => distOf(a) - distOf(b));
  const stats = { rooms: plan.rooms.length, windows: 0, ...timing };
  const buildOne = async (room) => { const r = await makeRoom(room); mergeRoom(r); r.grp.visible = distOf(room) < nearFirst; rooms.push(r); stats.windows = windowsWorld.length; stats.meshes_before_merge = before; stats.draw_meshes = after; };
  const near = order.filter(q => distOf(q) < nearFirst);
  for (const room of near) { onStep(`raising ${room.name.toLowerCase()}`); await buildOne(room); }
  stats.first_ready_ms = Math.round(performance.now() - t0); stats.rooms_first = near.length;
  const rest = (async () => {
    for (const room of order.slice(near.length)) { await new Promise(r => setTimeout(r, 0)); await buildOne(room); }
    stats.all_rooms_ms = Math.round(performance.now() - t0);
    stats.doors = doors.length; stats.desks = (plan.objects || []).filter(o => o.placed).length;
  })();
  stats.doors = doors.length;
  return { scene, rooms, rig, LV, level, stats, rebuildRoom, doors, cull, stairFrom, stairTo, rest };
}
