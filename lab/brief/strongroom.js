// The strongroom's pieces (R45): a room compiled from the period brief (brief.js) built in code.
// Limewashed stone walls, a flagged floor and a segmental stone vault; oak doors bound in iron in plain
// stone reveals; small barred windows with inside shutters; presses of drawers that pull, labelled for
// the family's papers and its manors (brief.js labelDrawers), with pigeonholes of bundles and court rolls over; an iron-bound chest under two locks; and the table with the drawer
// (procedural.js). Everything from the kit (procedural.js makeKit): no image, no mesh file.
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { buildBook, bookSpec } from "../../src/make/parts/books.js";
import { build, lookC1660, shutterOpen } from "../../src/make/index.js";
import { rect, slab, quad, run, loft, metric, metricAny, block, rng, hash, leadedTexture, outsideTexture, stoneTexture, grime, canvasTex, normalFrom, fbm, smooth } from "../painted/procedural.js";

const r2 = (x) => Math.round(x * 1000) / 1000;
const PLACE = (W, D) => ({ N: { pos: [0, 0, -D], rot: 0 }, S: { pos: [W, 0, 0], rot: Math.PI }, E: { pos: [W, 0, -D], rot: -Math.PI / 2 }, W: { pos: [0, 0, 0], rot: Math.PI / 2 } });

// the segmental vault's height across its span: chord c, rise h, at s from one springing wall
function vaultArc(c, spring, crown) {
  const h = crown - spring, R = (c * c / 4 + h * h) / (2 * h);
  return { R, h, y: (s) => spring + Math.sqrt(Math.max(0, R * R - (s - c / 2) ** 2)) - (R - h) };
}

// a merge-as-you-go bucket per material: thousands of drawer parts become a few draw calls
function buckets(THREE, K) {
  const map = new Map();
  return {
    add(g, mat, spread = 0.18, xf = null) {
      if (mat.vertexColors && !g.attributes.color) K.board(g, spread);
      if (!g.attributes.color) { const n = g.attributes.position.count, c = new Float32Array(n * 3).fill(1); g.setAttribute("color", new THREE.BufferAttribute(c, 3)); }
      if (!g.attributes.uv) g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      if (g.index) g = g.toNonIndexed();
      if (xf) g.applyMatrix4(xf);
      if (!map.has(mat)) map.set(mat, []);
      map.get(mat).push(g); K.parts++;
    },
    flush(into, name) {
      for (const [mat, gs] of map) {
        const keep = gs.map(g => { for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv", "color"].includes(k)) g.deleteAttribute(k); if (!g.attributes.normal) g.computeVertexNormals(); return g; });
        const m = new THREE.Mesh(mergeGeometries(keep, false), mat); m.castShadow = m.receiveShadow = true;
        m.userData = { instance: `${name}/${mat.userData.cls || "part"}`, material: mat.userData.cls || "other", owner: name };
        into.add(m);
      }
      map.clear();
    },
  };
}

// limewash over coursed ashlar: near white, washed on unevenly, the courses showing through faintly.
// Stones as a mason lays them: level courses 0.4 m high, each stone 0.75–1.3 m long, every joint
// broken over the stone below; a 4 m tile, so no wall shows the pattern twice.
function limewashTexture(THREE, N = 1024) {
  const TILE = 4, COURSE = 0.4, NC = TILE / COURSE, H = new Float32Array(N * N), cuts = [];
  const r = rng(1660);
  for (let j = 0; j < NC; j++) {
    // joints in tile units, periodic; each course's joints kept clear of the course below's
    const below = cuts[j - 1] || [], c = [];
    let x = r() * 0.3;
    while (x < 1) {
      let t = x;
      for (let k = 0; k < 6 && below.some(b => Math.min(Math.abs(t - b), 1 - Math.abs(t - b)) < 0.06); k++) t += 0.035;
      c.push(t % 1); x = t + (0.75 + r() * 0.55) / TILE;
    }
    if (c.length > 1 && 1 - c[c.length - 1] + c[0] < 0.6 / TILE) c.pop();      // no sliver where the course wraps
    cuts.push(c);
  }
  const map = canvasTex(THREE, N, N, (d) => {
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const u = x / N, v = y / N, row = Math.floor(v * NC), fv = v * NC - row;
      let du = 1; for (const c of cuts[row]) { const a = Math.abs(u - c); du = Math.min(du, a, 1 - a); }
      const jt = Math.min(Math.min(fv, 1 - fv) / NC, du) * TILE;             // metres to the nearest joint
      const joint = 1 - smooth(0.004, 0.012, jt);                              // the wash has filled it: a soft shallow line
      const m = fbm(u * 8, v * 8, 8, 8, 4, 71), f = fbm(u * 128, v * 128, 128, 128, 2, 73), wash = fbm(u * 14, v * 14, 14, 14, 3, 79);
      const k = (0.91 + 0.09 * m + 0.035 * f) * (1 - 0.05 * joint) * (1 - 0.05 * Math.max(0, wash - 0.55) * 4), o = (y * N + x) * 4;
      d[o] = 226 * k; d[o + 1] = 221 * k; d[o + 2] = 206 * k; d[o + 3] = 255;
      H[y * N + x] = -0.18 * joint + m * 0.45 + f * 0.22;
    }
  });
  map.repeat.set(1 / TILE, 1 / TILE);
  const nm = normalFrom(THREE, H, N, N, 1.2); nm.repeat.set(1 / TILE, 1 / TILE);
  return { map, normalMap: nm };
}

// flagstones: large slabs in courses of varied width running across the room, each stone 0.6–1.1 m long,
// its own tone and wear; joints wrap at the tile's edge (a 4 m tile) so no sliver stone appears
function flagstoneTexture(THREE, N = 1024) {
  const TILE = 4, r = rng(1662);
  // course widths summing exactly to the tile
  let rows = []; { let y = 0; while (y < TILE - 0.5) { const w = 0.55 + r() * 0.3; rows.push(w); y += w; } const k = TILE / rows.reduce((a, b) => a + b, 0); rows = rows.map(w => w * k); }
  const edges = [0]; for (const w of rows) edges.push(edges[edges.length - 1] + w / TILE);
  const cuts = rows.map((_, j) => { const c = []; let x = r() * 0.25; while (x < 1 - 0.0001) { c.push(x); x += (0.6 + r() * 0.5) / TILE; } if (c.length > 1 && 1 - c[c.length - 1] + c[0] < 0.45 / TILE) c.pop(); return c; });
  const H = new Float32Array(N * N);
  const map = canvasTex(THREE, N, N, (d) => {
    for (let y = 0; y < N; y++) {
      const v = y / N; let row = 0; while (row < rows.length - 1 && v >= edges[row + 1]) row++;
      const dv = Math.min(v - edges[row], edges[row + 1] - v) * TILE, cs = cuts[row];
      for (let x = 0; x < N; x++) {
        const u = x / N;
        let k0 = cs.length - 1; for (let q = 0; q < cs.length; q++) if (cs[q] <= u) k0 = q;      // which stone (wrapping)
        let du = 1; for (const c of cs) { const a = Math.abs(u - c); du = Math.min(du, a, 1 - a); }
        const jt = Math.min(dv, du * TILE), joint = 1 - smooth(0.002, 0.009, jt), edge = 1 - smooth(0.008, 0.05, jt);
        const t = hash(k0, row, 53), m = fbm(u * 16 + k0 * 0.37, v * 16, 16, 16, 4, 57 + (k0 % 5)), f = fbm(u * 160, v * 160, 160, 160, 2, 59);
        const stone = (0.78 + 0.22 * t + 0.16 * m + 0.06 * f) * (1 - 0.1 * edge), k = stone + (0.56 - stone) * joint, o = (y * N + x) * 4;   // lime-pointed joints: darker, not black
        d[o] = 122 * k; d[o + 1] = 114 * k; d[o + 2] = 100 * k; d[o + 3] = 255;
        H[y * N + x] = -0.6 * joint - 0.25 * edge + m * 0.3 + f * 0.2 + t * 0.1;
      }
    }
  });
  map.repeat.set(1 / TILE, 1 / TILE);
  const nm = normalFrom(THREE, H, N, N, 1.6); nm.repeat.set(1 / TILE, 1 / TILE);
  return { map, normalMap: nm };
}

export function strongroomMaterials(THREE, K) {
  const { M } = K;
  if (K.SR) return K.SR;
  const iron = new THREE.MeshStandardMaterial({ color: 0x55504a, metalness: 0.3, roughness: 0.55, vertexColors: true }); iron.userData.cls = "iron";
  const lw = limewashTexture(THREE);
  const dressed = new THREE.MeshStandardMaterial({ ...stoneTexture(THREE, 512, [150, 140, 122], false), roughness: 0.86, normalScale: new THREE.Vector2(0.6, 0.6) }); dressed.userData.cls = "stone";
  const lime = grime(THREE, new THREE.MeshStandardMaterial({ ...lw, roughness: 0.96, normalScale: new THREE.Vector2(0.5, 0.5) })); lime.userData.cls = "limewash";
  const vault = new THREE.MeshStandardMaterial({ ...lw, roughness: 0.97, normalScale: new THREE.Vector2(0.5, 0.5), side: THREE.DoubleSide }); vault.userData.cls = "limewash";
  // the door's boards: weathered oak, paler and greyer than the waxed presses
  const doorOak = new THREE.MeshStandardMaterial({ map: M.oak.map, normalMap: M.oak.normalMap, roughness: 0.75, vertexColors: true, color: new THREE.Color(1.35, 1.28, 1.18) }); doorOak.userData.cls = "oak";
  const parch = new THREE.MeshStandardMaterial({ color: 0xcdb98e, roughness: 0.92, vertexColors: true }); parch.userData.cls = "parchment";
  const tape = new THREE.MeshStandardMaterial({ color: 0x7a2a22, roughness: 0.8 }); tape.userData.cls = "tape";
  const dark = new THREE.MeshStandardMaterial({ color: 0x0b0806, roughness: 1 }); dark.userData.cls = "dark";
  const flags = new THREE.MeshStandardMaterial({ ...flagstoneTexture(THREE), roughness: 0.8 }); flags.userData.cls = "flags";
  return (K.SR = { iron, dressed, lime, vault, parch, tape, dark, flags, doorOak });
}

// ---------------------------------------------------------------- a stone wall
// N and S spring the vault: they stop at the springing. The end walls rise to the vault's curve.
function stoneWall(THREE, K, S, F, L, elems, top, vaultTop) {
  const grp = new THREE.Group(), lights = [], B = buckets(THREE, K);
  const holes = [], notches = [];
  for (const e of elems) {
    if (e.kind === "window") holes.push(rect(e.r0, e.r1, e.sill, e.top));
    if (e.kind === "door") notches.push([e.r0, e.r1, e.top]);
  }
  const outline = [[0, 0]];
  for (const [a, b, t] of notches.sort((p, q) => p[0] - q[0])) outline.push([a, 0], [a, t], [b, t], [b, 0]);
  outline.push([L, 0]);
  if (vaultTop) for (let k = 0; k <= 32; k++) { const r = L * (1 - k / 32); outline.push([r, vaultTop(r) + 0.02]); }
  else outline.push([L, top], [0, top]);
  B.add(slab(THREE, outline, holes), S.lime);
  // the wall's core behind, so no seam opens onto nothing
  const X = 0.05, core = [[-X, -X]];
  for (const [a, b, t] of notches) core.push([a, -X], [a, t], [b, t], [b, -X]);
  core.push([L + X, -X]);
  if (vaultTop) for (let k = 0; k <= 32; k++) { const r = L * (1 - k / 32); core.push([r + (k === 0 ? X : k === 32 ? -X : 0), vaultTop(r) + 0.1]); }
  else core.push([L + X, top + 0.1], [-X, top + 0.1]);
  B.add(slab(THREE, core, holes, -0.04), S.dark);
  // a chamfered impost course where the vault springs
  if (!vaultTop) B.add(run(THREE, -0.02, L + 0.02, top - 0.1, [[0, 0], [0, 0.02], [0.05, 0.075], [0.1, 0.075], [0.1, 0]]), S.dressed);
  // a low plinth of dressed stone, chamfered, broken at the doors
  { const cuts = notches.map(([a, b]) => [a, b]).sort((p, q) => p[0] - q[0]); let x = 0;
    for (const [a, b] of [...cuts, [L, L]]) { if (a - x > 0.05) B.add(run(THREE, x, a, 0, [[0, 0], [0, 0.04], [0.12, 0.04], [0.15, 0.012], [0.15, 0]]), S.dressed); x = b; } }

  for (const e of elems) {
    const T = e.T ?? 0.5;
    if (e.kind === "door") lights.push(...doorReveal(THREE, K, S, B, grp, e, T));
    if (e.kind === "window") lights.push(...barredWindow(THREE, K, S, B, grp, F, e, T));
  }
  B.flush(grp, F);
  return { grp, lights };
}

// ---------------------------------------------------------------- a door's opening in stone
// Plain stone reveals, chamfered at the arris; the leaf is a thing of its own (door/boarded-iron-bound),
// hung in the opening by the room. Beyond, until the next room is built, the holodeck grid.
function doorReveal(THREE, K, S, B, grp, e, T) {
  const t = e.top;
  B.add(quad(THREE, [e.r0, 0, 0], [e.r0, 0, -T], [e.r0, t, -T], [e.r0, t, 0]), S.dressed);
  B.add(quad(THREE, [e.r1, 0, -T], [e.r1, 0, 0], [e.r1, t, 0], [e.r1, t, -T]), S.dressed);
  B.add(quad(THREE, [e.r0, t, 0], [e.r0, t, -T], [e.r1, t, -T], [e.r1, t, 0]), S.dressed);
  B.add(quad(THREE, [e.r0, 0.003, -T], [e.r0, 0.003, 0], [e.r1, 0.003, 0], [e.r1, 0.003, -T]), S.dressed);
  B.add(loft(THREE, [[e.r0, 0], [e.r0, t], [e.r1, t], [e.r1, 0]], [[0, 0.004], [0.045, -0.04], [0.05, -0.05]], false, false), S.dressed);
  const beyond = new THREE.Mesh(new THREE.PlaneGeometry(e.r1 - e.r0 + 2, t + 1.5), holodeckGrid(THREE, K));
  beyond.position.set((e.r0 + e.r1) / 2, t / 2, -T - 1.2); beyond.userData = { instance: `${e.id}/beyond`, material: "grid", owner: e.id }; grp.add(beyond);
  return [];
}

// unestablished space, in-fiction and literal: a dark field ruled in a faint grid
function holodeckGrid(THREE, K) {
  if (K.grid) return K.grid;
  const N = 512, map = canvasTex(THREE, N, N, (d) => {
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = (y * N + x) * 4, line = x % 64 < 2 || y % 64 < 2;
      d[i] = line ? 120 : 6; d[i + 1] = line ? 200 : 10; d[i + 2] = line ? 170 : 12; d[i + 3] = 255;
    }
  });
  map.wrapS = map.wrapT = THREE.RepeatWrapping; map.repeat.set(3, 3);
  K.grid = new THREE.MeshBasicMaterial({ map, color: 0x9fdcc8 });
  return K.grid;
}

// ---------------------------------------------------------------- a small window, barred
function barredWindow(THREE, K, S, B, grp, F, e, T) {
  const sp = e.splay ?? 0.16, G = -T + 0.12;
  const o = [[e.r0, e.sill], [e.r1, e.sill], [e.r1, e.top], [e.r0, e.top]];
  const i = [[e.r0 + sp, e.sill + 0.06], [e.r1 - sp, e.sill + 0.06], [e.r1 - sp, e.top - 0.04], [e.r0 + sp, e.top - 0.04]];
  // a deep splayed embrasure, limewashed, with a stone sill sloping down into the room
  B.add(quad(THREE, [...o[0], 0], [...i[0], G], [...i[3], G], [...o[3], 0]), S.lime);
  B.add(quad(THREE, [...i[1], G], [...o[1], 0], [...o[2], 0], [...i[2], G]), S.lime);
  B.add(quad(THREE, [...o[2], 0], [...o[3], 0], [...i[3], G], [...i[2], G]), S.lime);
  B.add(quad(THREE, [...o[0], 0], [...o[1], 0], [...i[1], G], [...i[0], G]), S.dressed);
  // a plain chamfered stone frame round the light
  B.add(loft(THREE, rect(i[0][0], i[1][0], i[0][1], i[2][1]), [[0, G], [0, G + 0.02], [0.04, G + 0.02], [0.05, G]], true, false), S.dressed);
  const gx0 = i[0][0] + 0.04, gx1 = i[1][0] - 0.04, gy0 = i[0][1] + 0.04, gy1 = i[2][1] - 0.04, gw = gx1 - gx0, gh = gy1 - gy0;
  // leaded quarries, plain
  { const g = new THREE.PlaneGeometry(gw, gh); g.translate((gx0 + gx1) / 2, (gy0 + gy1) / 2, G - 0.006);
    const m = new THREE.MeshBasicMaterial({ map: leadedTexture(THREE, gw, gh, 0, 300 + K.parts), color: new THREE.Color(1.0, 0.99, 0.94), transparent: true, depthWrite: false });
    const glass = new THREE.Mesh(g, m); glass.userData = { instance: `${F}/${e.id}/glass`, material: "glass", owner: F }; grp.add(glass); }
  // the world outside, 2.5 m beyond
  K.outside = K.outside || new THREE.MeshBasicMaterial({ map: outsideTexture(THREE), color: new THREE.Color(1.06, 1.06, 1.06) });
  { const g = new THREE.PlaneGeometry(gw + 5, 4.2); g.translate((gx0 + gx1) / 2, e.sill + 0.3, G - 2.5);
    const pane = new THREE.Mesh(g, K.outside); pane.userData = { instance: `${F}/${e.id}/outside`, material: "glass", owner: F }; grp.add(pane); }
  // the iron grid: round stanchions run into the head and sill, flat saddle bars across, a hand inside the glass
  const bz = G + 0.05, nb = Math.max(2, Math.round(gw / 0.11));
  for (let k = 1; k < nb + 1; k++) { const x = gx0 + gw * k / (nb + 1); const g = new THREE.CylinderGeometry(0.011, 0.011, gh + 0.1, 8); g.translate(x, (gy0 + gy1) / 2, bz); B.add(g, S.iron, 0.2); }
  for (const f of [0.33, 0.67]) { const g = new THREE.BoxGeometry(gw + 0.08, 0.035, 0.012); g.translate((gx0 + gx1) / 2, gy0 + gh * f, bz + 0.012); B.add(g, S.iron, 0.2); }
  // daylight through the glass, facing the room
  const al = new THREE.RectAreaLight(0xe9eef0, 5.5, gw, gh);
  al.position.set((gx0 + gx1) / 2, (gy0 + gy1) / 2, G + 0.06); al.lookAt((gx0 + gx1) / 2, (gy0 + gy1) / 2, 5);
  grp.add(al);
  // inside shutters are a thing of their own (shutters/splay-pair), hung here by the room
  e.light = al; e.splay = { x0: i[0][0], x1: i[1][0], y0: i[0][1], y1: i[2][1], G, ox0: o[0][0], ox1: o[1][0] };
  return [al];
}

// ---------------------------------------------------------------- the room
export function buildStrongroom(THREE, K, spec) {
  const t0 = performance.now();
  const { W, D, H } = spec.room, S = strongroomMaterials(THREE, K);
  const grp = new THREE.Group(), lights = [], colliders = [];
  const P = PLACE(W, D);
  const v = spec.finish.vault, span = v.axis === "EW" ? D : W;
  const arc = vaultArc(span, v.spring, v.crown);
  // the floor: flags, 2 m to the tile
  { const g = new THREE.PlaneGeometry(W, D); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * W, uv.getY(i) * D);
    const f = new THREE.Mesh(g, S.flags); f.rotation.x = -Math.PI / 2; f.position.set(W / 2, 0, -D / 2); f.receiveShadow = true;
    f.userData = { instance: "floor", material: "flags", owner: "floor" }; grp.add(f); }
  // the vault: a segmental barrel from springing wall to springing wall, limewashed stone
  { const L = v.axis === "EW" ? W : D, n = 40, pos = [], uv = [];
    const th0 = Math.asin((span / 2) / arc.R);
    for (let k = 0; k < n; k++) for (const [a, b] of [[k, k + 1]]) {
      const pt = (q, along) => { const th = -th0 + 2 * th0 * q / n, s = span / 2 + arc.R * Math.sin(th), y = arc.y(s);
        return v.axis === "EW" ? [along, y, -s] : [s, y, -along]; };
      const A = pt(a, 0), B2 = pt(b, 0), C = pt(b, L), D2 = pt(a, L);
      pos.push(...A, ...C, ...B2, ...A, ...D2, ...C);
      const ua = arc.R * 2 * th0 * a / n, ub = arc.R * 2 * th0 * b / n;
      uv.push(0, ua, L, ub, 0, ub, 0, ua, L, ua, L, ub);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, S.vault); m.receiveShadow = m.castShadow = true; m.userData = { instance: "vault", material: "limewash", owner: "ceiling" }; grp.add(m); }
  // the walls, then what stands against them: every piece of furniture, every door's leaf and every
  // window's shutters is a thing built from its kind (src/make), and everything on it that looks as if
  // it works, works
  const stats = { presses: 0, drawers: 0 }, things = [], windows = [];
  const look = lookC1660(THREE, K, S), room = `manor/${spec.room.id}`;
  const make = (kind, id, over, into, at, rot = 0) => {
    const t = performance.now(), b = build(THREE, K, look, kind, `${room}/${id}`, over);
    b.node.position.set(...at); b.node.rotation.y = rot; into.add(b.node); things.push(b);
    stats.things_ms = +((stats.things_ms || 0) + performance.now() - t).toFixed(1);
    return b;
  };
  let table = null;
  for (const F of ["N", "E", "S", "W"]) {
    const L = F === "N" || F === "S" ? W : D, elems = spec.walls[F] || [];
    const spring = v.springWalls.includes(F);
    const w = stoneWall(THREE, K, S, F, L, elems.filter(e => e.kind === "door" || e.kind === "window"), v.spring, spring ? null : (r) => arc.y(F === "E" || F === "S" ? r : r));
    w.grp.position.set(...P[F].pos); w.grp.rotation.y = P[F].rot; grp.add(w.grp); lights.push(...w.lights);
    for (const e of elems) {
      // the door from the lord's rooms (a solar, or his closet in the manor) stands unlocked; any other is locked, and its key is not here:
      // the brief's one way in, kept in play while the plan still gives the room two doors
      // the door is the house's like any other: it says which opening it hangs in, so a walker is stopped by it shut
      // (Kabe, 2026-10-06: "locked door in first floor closet I can walk right through")
      if (e.kind === "door") { const d = make("door/boarded-iron-bound", e.id, { w: e.r1 - e.r0, h: e.top, ...(e.joins?.some(j => /solar|closet_best|best_bedchamber|withdrawing/.test(j)) ? {} : { lock: "locked", key: `key/${e.id}` }) }, w.grp, [e.r0, 0, 0]); if (d) d.node.userData.opening = e.id; }
      if (e.kind === "window" && e.splay && e.shutters) {
        const sp = e.splay, sh = make("shutters/splay-pair", `${e.id}/shutters`, { x0: sp.x0, x1: sp.x1, y0: sp.y0, y1: sp.y1, G: sp.G,
          open_left: shutterOpen("left", sp.x0, sp.ox0, sp.G), open_right: shutterOpen("right", sp.x1, sp.ox1, sp.G) }, w.grp, [0, 0, 0]);
        windows.push({ shutters: sh, light: e.light });
      }
    }
    const fur = new THREE.Group();
    for (const e of elems) {
      let fp = null;
      if (e.kind === "press") {
        const n = e.cols * e.rows;
        make("press/evidence", e.id, { width: r2(e.r1 - e.r0), height: e.height, depth: e.depth, cols: e.cols, rows: e.rows, pigeonholes: e.pigeonholes,
          labels: (spec.labels || []).slice(e.label0, e.label0 + n), full: e.full }, fur, [(e.r0 + e.r1) / 2, 0, 0]);
        stats.presses++; stats.drawers += n; fp = { r0: e.r0, r1: e.r1, depth: e.depth + 0.06 };
      }
      if (e.kind === "chest") { make("chest/iron-bound", e.id, { w: e.w, d: e.d, h: e.h }, fur, [e.r, 0, e.off]); fp = { r0: e.r - e.w / 2 - 0.02, r1: e.r + e.w / 2 + 0.02, depth: e.off + e.d + 0.03 }; }
      if (e.kind === "desk") {
        table = make("table/joined-with-drawer", e.id, { W: e.width }, fur, [e.r, 0, 0.04]);
        // on it: the calendar of the evidences, a folio in vellum, to one side; a candle to the other
        if (spec.onTable) { const cal = buildBook(THREE, K, bookSpec("folio", 1660, undefined, { binding: "vellum" }));
          cal.rotation.set(0, 0.12, Math.PI / 2); cal.position.set(-e.width / 2 + 0.3, 0.76 + cal.scale.x / 2, 0.3); table.node.add(cal); }
        make("candle/in-candlestick", `${e.id}/candle`, {}, table.node, [e.width / 2 - 0.2, 0.76, 0.22]);
        fp = { r0: e.r - e.width / 2 - 0.03, r1: e.r + e.width / 2 + 0.03, depth: 0.64 };
      }
      if (fp) colliders.push({ F, ...fp });
    }
    fur.position.copy(w.grp.position); fur.rotation.y = P[F].rot; grp.add(fur);
  }
  // colliders in room metres (X east from the west wall, Y north from the south wall)
  const boxes = colliders.map(c => {
    const at = { N: (r, o) => [r, D - o], S: (r, o) => [W - r, o], E: (r, o) => [W - o, D - r], W: (r, o) => [o, r] }[c.F];
    const p = [at(c.r0, 0), at(c.r1, 0), at(c.r0, c.depth), at(c.r1, c.depth)];
    return { x0: Math.min(...p.map(q => q[0])), x1: Math.max(...p.map(q => q[0])), y0: Math.min(...p.map(q => q[1])), y1: Math.max(...p.map(q => q[1])) };
  });
  return { group: grp, lights, things, table, windows, colliders: boxes, stats: { ...stats, things: things.length, parts: K.parts, ms: Math.round(performance.now() - t0) } };
}
