// The ground drawn (R46): the site's height function (src/make/terrain.js) as tiles of a quadtree around you (after
// CDLOD, Strugar, MIT: regular grids, finer near; here with skirts rather than morphing, the prior-art pass's
// "plain ring LOD with a skirt is enough" for a view of a few hundred metres). Every leaf is a 32 by 32 grid; its
// normals come from the height function over a border, so a tile's edge shades as its neighbour's does; a skirt
// hangs from its edges to hide the crack where a finer tile meets a coarser one. Tiles are built nearest first, a few
// a frame (budget in ms), and kept in a cache by key, so walking back costs nothing.
//   makeGround(THREE, site, { root, maxDepth, material }) -> { group, update(x, y, budgetMs) -> busy, stats() }
import { texture, attribute, mix, uv, vec2, float } from "three/tsl";

const N = 32;
export function makeGround(THREE, site, { root = 1024, extent = 2, minSize = 32, split = 0.8, skirt = 1.0, material, bundle = false } = {}) {
  // (on WebGPU the tiles go in a render bundle, recorded again only when the set of tiles changes: the fps lab measured
  // 1,000 static meshes at 148 fps drawn one by one and 1,337 in a bundle)
  const group = bundle && THREE.BundleGroup ? new THREE.BundleGroup() : new THREE.Group(); group.name = "ground";
  const cache = new Map(), shown = new Set(); let want = [], queue = [];
  // which leaves: from each root, split while you are nearer than `split` times the node's size
  function leaves(x, y) { const out = [];
    const visit = (x0, y0, S) => { const d = Math.hypot(Math.max(x0 - x, 0, x - (x0 + S)), Math.max(y0 - y, 0, y - (y0 + S)));
      if (S > minSize && d < split * S) { const h = S / 2; visit(x0, y0, h); visit(x0 + h, y0, h); visit(x0, y0 + h, h); visit(x0 + h, y0 + h, h); } else out.push({ x0, y0, S, d }); };
    for (let i = -extent; i < extent; i++) for (let j = -extent; j < extent; j++) visit(i * root, j * root, root);
    return out; }
  function buildTile({ x0, y0, S }) {
    const s = S / N, M = N + 3, H = new Float32Array(M * M), G = new Float32Array((N + 1) * (N + 1));
    for (let j = 0; j < M; j++) for (let i = 0; i < M; i++) H[j * M + i] = site.z(x0 + (i - 1) * s, y0 + (j - 1) * s);
    for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) G[j * (N + 1) + i] = site.gravel(x0 + i * s, y0 + j * s);
    const nv = (N + 1) * (N + 1), sk = 4 * (N + 1), pos = new Float32Array((nv + sk) * 3), nor = new Float32Array((nv + sk) * 3), uvs = new Float32Array((nv + sk) * 2), spl = new Float32Array(nv + sk);
    const h = (i, j) => H[(j + 1) * M + (i + 1)];
    let v = 0; const put = (i, j, drop) => { const x = x0 + i * s, y = y0 + j * s, z = h(i, j) - drop;
      const gx = (h(i + 1, j) - h(i - 1, j)) / (2 * s), gy = (h(i, j + 1) - h(i, j - 1)) / (2 * s), l = Math.hypot(gx, gy, 1);
      pos.set([x, z, -y], v * 3); nor.set([-gx / l, 1 / l, gy / l], v * 3); uvs.set([x / 2, y / 2], v * 2); spl[v] = G[j * (N + 1) + i]; return v++; };
    for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) put(i, j, 0);
    const idx = [], at = (i, j) => j * (N + 1) + i;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const a = at(i, j), b = at(i + 1, j), c = at(i, j + 1), d = at(i + 1, j + 1); idx.push(a, b, c, b, d, c); }   // anticlockwise seen from above (b - a east, c - a north: their cross is up)
    // the skirt: each edge's posts again, a little lower, and a strip of triangles between
    const drop = skirt + s * 0.6;
    const edge = (pts, flip) => { const low = pts.map(([i, j]) => put(i, j, drop)); for (let k = 0; k + 1 < pts.length; k++) { const a = at(...pts[k]), b = at(...pts[k + 1]), c = low[k], d = low[k + 1]; if (flip) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c); } };
    const R = [...Array(N + 1).keys()];
    edge(R.map(i => [i, 0]), true); edge(R.map(i => [i, N]), false); edge(R.map(j => [0, j]), false); edge(R.map(j => [N, j]), true);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
    g.setAttribute("uv", new THREE.BufferAttribute(uvs, 2)); g.setAttribute("splat", new THREE.BufferAttribute(spl, 1)); g.setIndex(idx);
    g.computeBoundingSphere(); g.computeBoundingBox();
    // (a bundle records only what was on screen when recorded, and replays exactly that: culled tiles were lost when you
    // turned round; in a bundle a tile is never culled)
    const m = new THREE.Mesh(g, material); m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); if (group.isBundleGroup) m.frustumCulled = false; return m;
  }
  const keyOf = (t) => `${t.S}/${t.x0}/${t.y0}`;
  let last = null, built = 0, ms = 0;
  // what should show from (x, y); build what's missing within the budget, nearest first; swap in a tile's
  // replacements only once they are all built (no hole while a finer level arrives)
  function update(x, y, budget = 4) {
    if (!last || Math.hypot(x - last[0], y - last[1]) > 2) { last = [x, y]; want = leaves(x, y).sort((a, b) => a.d - b.d); queue = want.filter(t => !cache.has(keyOf(t))); }
    const t0 = performance.now();
    while (queue.length && performance.now() - t0 < budget) { const t = queue.shift(), k = keyOf(t); if (cache.has(k)) continue; const a = performance.now(); cache.set(k, buildTile(t)); ms += performance.now() - a; built++; }
    if (queue.length && shown.size) return true;           // keep the old tiles up until the new set is complete
    const keys = new Set(want.map(keyOf)); let changed = false;
    for (const k of [...shown]) if (!keys.has(k)) { group.remove(cache.get(k)); shown.delete(k); changed = true; }
    for (const k of keys) if (!shown.has(k) && cache.has(k)) { group.add(cache.get(k)); shown.add(k); changed = true; }
    if (changed && group.isBundleGroup) group.needsUpdate = true;
    return changed || queue.length > 0;
  }
  return { group, update, stats: () => ({ shown: shown.size, cached: cache.size, built, msPerTile: built ? +(ms / built).toFixed(2) : 0, queued: queue.length }) };
}

// grass and gravel, mixed by the ground's gravel weight; each drawn once in code
export function groundMaterial(THREE, { rng }) {
  const tex = (draw, N = 512) => { const c = document.createElement("canvas"); c.width = c.height = N; draw(c.getContext("2d"), N); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; };
  const grass = tex((g, N) => { const r = rng("ground/grass"); g.fillStyle = "#5b6d32"; g.fillRect(0, 0, N, N);
    for (let k = 0; k < 9000; k++) { const x = r() * N, y = r() * N, l = 3 + r() * 7, t = r(); g.strokeStyle = `rgba(${70 + t * 60 | 0},${92 + t * 50 | 0},${36 + t * 20 | 0},0.55)`; g.lineWidth = 1 + r(); g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 3, y - l); g.stroke(); }
    for (let k = 0; k < 60; k++) { g.fillStyle = `rgba(${110 + r() * 40 | 0},${100 + r() * 30 | 0},${50},0.12)`; g.beginPath(); g.ellipse(r() * N, r() * N, 20 + r() * 50, 12 + r() * 30, r() * 3, 0, 7); g.fill(); } });
  const gravel = tex((g, N) => { const r = rng("ground/gravel"); g.fillStyle = "#a59a80"; g.fillRect(0, 0, N, N);
    for (let k = 0; k < 7000; k++) { const t = r(); g.fillStyle = `rgb(${130 + t * 90 | 0},${122 + t * 84 | 0},${100 + t * 70 | 0})`; g.beginPath(); g.ellipse(r() * N, r() * N, 1.5 + r() * 4, 1 + r() * 3, r() * 3, 0, 7); g.fill(); }
    g.fillStyle = "rgba(60,50,35,0.25)"; for (let k = 0; k < 2500; k++) g.fillRect(r() * N, r() * N, 2, 2); });
  const m = new THREE.MeshStandardNodeMaterial({ roughness: 0.95, side: THREE.DoubleSide });
  const w = attribute("splat", "float");
  m.colorNode = mix(texture(grass, uv()), texture(gravel, uv().mul(vec2(1.6, 1.6))), w);
  return m;
}
