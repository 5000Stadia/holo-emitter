// Small things on shelves, c. 1660: each a recipe from a kind and a seed (lathe-turned or boxed), drawn as
// set dressing merged per material. Every one knows its size, so it can be placed, packed, and judged
// takeable like a book. The owner decides which ones stand on a shelf (owners.js).
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { rng } from "../painted/procedural.js";

export function trinketMaterials(THREE, K) {
  if (K.trinketM) return K.trinketM;
  const m = (cls, o) => { const x = new THREE.MeshStandardMaterial(o); x.userData.cls = cls; return x; };
  return (K.trinketM = {
    pewter: m("pewter", { color: 0x9a968c, metalness: 0.55, roughness: 0.42 }),
    brass: m("brass", { color: 0xb08a4a, metalness: 0.7, roughness: 0.35 }),
    stoneware: m("stoneware", { color: 0x8a6a46, roughness: 0.45 }),           // salt-glazed brown
    earthen: m("earthenware", { color: 0x9a5a34, roughness: 0.7 }),
    slip: m("slipware", { color: 0xc8a050, roughness: 0.5 }),
    glass: m("glass", { color: 0x3e5a3a, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.82 }),
    wood: m("treen", { color: 0x7a5434, roughness: 0.7 }),
    oak: K.M.oakH,
    iron: m("iron", { color: 0x3c3834, metalness: 0.4, roughness: 0.6 }),
    porcelain: m("porcelain", { color: 0xe8ecf0, roughness: 0.2 }),
    blue: m("porcelain_blue", { color: 0x3a5a9a, roughness: 0.25 }),
    wax: m("wax", { color: 0xe8dcc0, roughness: 0.6 }),
    globe: m("globe", { color: 0xc8b48a, roughness: 0.55 }),
    shell: m("shell", { color: 0xe0c8b0, roughness: 0.4 }),
  });
}

const lathe = (THREE, pts, seg = 20) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);

// each kind: size(seed) -> [w, h, d] footprint and height; parts(seed) -> [{ g, mat }] standing on y = 0, centred
export const TRINKETS = {
  candlestick: {
    size: () => [0.1, 0.26, 0.1],
    parts(THREE, M, r) { const mat = r() < 0.5 ? M.brass : M.pewter;
      const g = lathe(THREE, [[0, 0], [0.05, 0], [0.05, 0.012], [0.022, 0.03], [0.012, 0.05], [0.014, 0.12], [0.01, 0.15], [0.016, 0.16], [0.022, 0.17], [0.014, 0.175], [0, 0.175]]);
      const stub = 0.02 + r() * 0.07, c = new THREE.CylinderGeometry(0.01, 0.011, stub, 12); c.translate(0, 0.175 + stub / 2, 0);
      return [{ g, mat }, { g: c, mat: M.wax }]; } },
  jug: {
    size: () => [0.16, 0.22, 0.14],
    parts(THREE, M, r) { const mat = [M.stoneware, M.earthen, M.slip][Math.floor(r() * 3)];
      const g = lathe(THREE, [[0, 0], [0.045, 0], [0.06, 0.03], [0.068, 0.08], [0.06, 0.13], [0.04, 0.17], [0.036, 0.2], [0.04, 0.21], [0, 0.21]]);
      const h = new THREE.TorusGeometry(0.035, 0.008, 6, 14, Math.PI); h.rotateZ(-Math.PI / 2); h.translate(0.062, 0.13, 0);
      return [{ g, mat }, { g: h, mat }]; } },
  tankard: {
    size: () => [0.14, 0.15, 0.1],
    parts(THREE, M) { const g = lathe(THREE, [[0, 0], [0.048, 0], [0.05, 0.01], [0.044, 0.02], [0.042, 0.13], [0.046, 0.14], [0, 0.14]]);
      const lid = lathe(THREE, [[0, 0.14], [0.048, 0.14], [0.04, 0.152], [0, 0.156]]);
      const h = new THREE.TorusGeometry(0.035, 0.007, 6, 12, Math.PI); h.rotateZ(-Math.PI / 2); h.translate(0.046, 0.075, 0);
      return [{ g, mat: M.pewter }, { g: lid, mat: M.pewter }, { g: h, mat: M.pewter }]; } },
  bottle: {
    size: () => [0.1, 0.24, 0.1],
    parts(THREE, M, r) { const mat = r() < 0.6 ? M.glass : M.stoneware;   // an onion bottle, or a bellarmine
      return [{ g: lathe(THREE, [[0, 0], [0.05, 0.004], [0.058, 0.05], [0.05, 0.1], [0.02, 0.14], [0.014, 0.2], [0.018, 0.21], [0, 0.21]]), mat }]; } },
  bowl: {
    size: () => [0.18, 0.07, 0.18],
    parts(THREE, M, r) { const mat = r() < 0.5 ? M.wood : M.pewter;
      return [{ g: lathe(THREE, [[0, 0], [0.04, 0], [0.07, 0.02], [0.088, 0.06], [0.084, 0.062], [0.066, 0.024], [0, 0.012]]), mat }]; } },
  box: {
    size: (r) => [0.2 + r() * 0.1, 0.1, 0.14],
    parts(THREE, M, r) { const w = 0.2 + r() * 0.1, b = new THREE.BoxGeometry(w, 0.08, 0.14); b.translate(0, 0.04, 0);
      const l = new THREE.BoxGeometry(w + 0.01, 0.018, 0.15); l.translate(0, 0.089, 0);
      return [{ g: b, mat: M.oak }, { g: l, mat: M.oak }]; } },
  horseshoe: {
    size: () => [0.13, 0.15, 0.04],
    parts(THREE, M) { const g = new THREE.TorusGeometry(0.055, 0.011, 6, 16, Math.PI * 1.3); g.rotateZ(-Math.PI * 0.15); g.translate(0, 0.075, 0); g.rotateY(0.3);
      return [{ g, mat: M.iron }]; } },
  nails: {
    size: () => [0.1, 0.1, 0.1],
    parts(THREE, M) { const g = lathe(THREE, [[0, 0], [0.045, 0], [0.045, 0.09], [0.04, 0.09], [0.04, 0.01], [0, 0.01]]);   // an earthen pot of nails
      const n = new THREE.CylinderGeometry(0.04, 0.04, 0.01, 14); n.translate(0, 0.08, 0);
      return [{ g, mat: M.earthen }, { g: n, mat: M.iron }]; } },
  globe: {
    size: () => [0.24, 0.34, 0.24],
    parts(THREE, M) { const s = new THREE.SphereGeometry(0.1, 24, 16); s.translate(0, 0.21, 0);
      const ring = new THREE.TorusGeometry(0.108, 0.006, 6, 32); ring.rotateX(Math.PI / 2 - 0.4); ring.translate(0, 0.21, 0);
      const stand = lathe(THREE, [[0, 0], [0.09, 0], [0.08, 0.02], [0.02, 0.04], [0.016, 0.11], [0, 0.11]]);
      return [{ g: s, mat: M.globe }, { g: ring, mat: M.brass }, { g: stand, mat: M.wood }]; } },
  clock: {   // a brass lantern clock
    size: () => [0.16, 0.38, 0.15],
    parts(THREE, M) { const b = new THREE.BoxGeometry(0.15, 0.24, 0.14); b.translate(0, 0.16, 0);
      const dial = new THREE.CylinderGeometry(0.06, 0.06, 0.004, 24); dial.rotateX(Math.PI / 2); dial.translate(0, 0.17, 0.072);
      const bell = new THREE.SphereGeometry(0.06, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2); bell.translate(0, 0.3, 0);
      const fin = new THREE.ConeGeometry(0.012, 0.05, 8); fin.translate(0, 0.37, 0);
      const feet = [-1, 1].flatMap(sx => [-1, 1].map(sz => { const f = new THREE.CylinderGeometry(0.008, 0.008, 0.04, 8); f.translate(sx * 0.07, 0.02, sz * 0.065); return { g: f, mat: M.brass }; }));
      return [{ g: b, mat: M.brass }, { g: dial, mat: M.porcelain }, { g: bell, mat: M.brass }, { g: fin, mat: M.brass }, ...feet]; } },
  porcelain: {   // a blue-and-white Chinese bowl or jar: a rich house's curiosity
    size: () => [0.16, 0.18, 0.16],
    parts(THREE, M, r) { const jar = r() < 0.5;
      const g = jar ? lathe(THREE, [[0, 0], [0.05, 0], [0.075, 0.06], [0.07, 0.13], [0.04, 0.16], [0.04, 0.17], [0, 0.17]], 24) : lathe(THREE, [[0, 0], [0.035, 0], [0.065, 0.03], [0.08, 0.075], [0.076, 0.077], [0.06, 0.035], [0, 0.012]], 24);
      const band = new THREE.TorusGeometry(jar ? 0.072 : 0.079, 0.004, 4, 24); band.rotateX(Math.PI / 2); band.translate(0, jar ? 0.09 : 0.07, 0);
      return [{ g, mat: M.porcelain }, { g: band, mat: M.blue }]; } },
  shell: {   // a curiosity: a great shell from the Indies
    size: () => [0.16, 0.08, 0.1],
    parts(THREE, M) { const g = new THREE.SphereGeometry(0.06, 16, 10); g.scale(1.3, 0.6, 0.8); g.translate(0, 0.035, 0); return [{ g, mat: M.shell }]; } },
  letters: {   // a bundle of letters tied with tape: a widow's keepsake
    size: () => [0.12, 0.04, 0.09],
    parts(THREE, M) { const g = new THREE.BoxGeometry(0.11, 0.035, 0.08); g.translate(0, 0.0175, 0); const t = new THREE.BoxGeometry(0.012, 0.037, 0.082); t.translate(0, 0.0185, 0);
      return [{ g, mat: M.wax }, { g: t, mat: M.earthen }]; } },
};

// a trinket's footprint for packing, from its kind and seed
export const trinketSize = (kind, seed) => TRINKETS[kind].size(rng(seed));
export function trinketParts(THREE, K, kind, seed, x, y, z, turn = 0) {
  const M = trinketMaterials(THREE, K), r = rng(seed);          // the same draws as size(): a box is as wide as it said
  return TRINKETS[kind].parts(THREE, M, r).map(({ g, mat }) => { g = g.index ? g.toNonIndexed() : g; g.rotateY(turn); g.translate(x, y, z); return { g, mat }; });
}
export function mergeParts(THREE, parts, name) {
  const by = new Map(); for (const p of parts) { if (!by.has(p.mat)) by.set(p.mat, []); by.get(p.mat).push(p.g); }
  const grp = new THREE.Group();
  for (const [mat, gs] of by) { for (const g of gs) { for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv", ...(mat.vertexColors ? ["color"] : [])].includes(k)) g.deleteAttribute(k); if (!g.attributes.uv) g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); }
    const m = new THREE.Mesh(mergeGeometries(gs, false), mat); m.castShadow = m.receiveShadow = true; m.userData = { instance: `${name}/${mat.userData.cls}` }; grp.add(m); }
  return grp;
}
