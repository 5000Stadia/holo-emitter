// The hillside's boundaries and trees (R46, the hillside package; design/outdoor/research-1660.md §A5-A6: "enclosure
// of open fields by hedgerows and dry stone walls was underway by the 16th and 17th centuries"; hawthorn quickset;
// "elm and other timber trees were often planted in hedges"; field gates "oak five-bar, hung on stone gate-stoops or
// oak posts"). Along each boundary src/make/fields.js lays: a dry-stone wall (battered, buck-and-doe coping) or a
// hawthorn hedge (clumps); at a gateway, two stone stoops (a wall's) or oak posts (a hedge's) and a closed five-bar
// gate; oak, ash and elm in the hedgerows and beside the walls every 25-45 m, and a few in the pastures.
// Laid out in world coordinates from the fields' lattice: a boundary, its gateway and its trees belong to the tile its
// middle falls in, a field tree to the tile it stands in, so tiles built in any order make each thing once. Every
// position comes from integer hashes and + - * / sqrt (src/make/noise.js), so it is the same on every engine; what
// stops a body is arithmetic on that layout (blocked), never the meshes.
// Drawn in tiles round you, nearest first within a budget a frame, cached (as src/make/terrain-mesh.js): near tiles in
// full, far ones as textured strips, one draw each; trees near you as models casting shadows, every tree beyond as an
// impostor drawn from its model, all in one draw, folded away near you on the GPU (lab/scale/forest.html's technique,
// with camera-facing cards instead of crossed ones).
//   layoutHedgerows(site, fields, pkg, { tile }) -> { lineOf(edge), tileItems(ti, tj), heights(line, run, every, sides), fieldTrees(i, j), blocked(x, y, half) }   (pure)
//   makeHillside(THREE, site, fields, { tile, radius, near, nearTile, renderer, materials, light, bundle }) ->
//     { group, update(x, y, budgetMs) -> busy, blocked(x, y, half), stats(), layout, materials }
//   (renderer: draws the impostors once, at the start; light: the page's sun and fill, for the impostors and the leaves'
//   glow; materials.sunDir.value is the direction toward the sun, to move with it; bundle: on WebGPU the far tiles are
//   drawn as one render bundle)
import { hashN, unit, valueNoise } from "./noise.js";
import { rng, seedOf } from "./id.js";

// the package's numbers; each chosen (research-1660 gives few): see the comments
export const HEDGEROWS_1660 = {
  id: "midlands-hedgerows-1660",
  // a dry-stone wall's section, battered from 0.75 m at the ground to 0.42 m under the cope, 1.3 m with it (chosen:
  // research-1660 §A5 has 1.2-1.4 m high and 0.5-0.6 m at the foot; today's walling standard, from memory [U], about
  // 0.8 m at the foot, 0.36 m at the top, 1.37 m with the cope, the wider foot taken)
  wall: { base: 0.75, top: 0.42, height: 1.04, sink: 0.3, step: 1.5, over: 0.35, wobble: 0.9, bend: 23 },
  // a laid quickset hedge, kept: about 1.6 m high, 1.3 m through
  hedge: { height: 1.6, width: 1.3, over: 0.3, wobble: 1.3, bend: 19 },
  // a field gateway: 3 m clear between stone stoops (0.38 m square, 1.6 m out of the ground) or oak posts
  gate: { opening: 3.0, stoop: 0.38, stoopH: 1.6, post: 0.22, postH: 1.45, leaf: 1.2 },
  // timber trees: in a hedge, or beside a wall, every 25-45 m where the hash keeps one; a few in the pastures
  trees: { every: [25, 45], keep: 0.72, mix: { oak: 0.42, ash: 0.33, elm: 0.25 },
    field: { one: 0.42, two: 0.12, mix: { oak: 0.62, ash: 0.26, elm: 0.12 } } },
  seed: 1660,
};
// the three timber trees, as fractions of their height: trunk radius at the foot, bole, crown (clusters [x, y, z, r])
export const TREES_1660 = {
  oak: { h: [12, 19], trunk: 0.034, bole: 0.4, bark: 0x8c836f, leaf: 0x4d6a2c,
    crown: [[0, 0.73, 0, 0.21], [0.26, 0.6, 0.06, 0.19], [-0.25, 0.62, -0.05, 0.19], [0.05, 0.6, -0.26, 0.18], [-0.06, 0.61, 0.26, 0.18],
      [0.19, 0.79, 0.15, 0.16], [-0.17, 0.8, -0.15, 0.16], [0.21, 0.5, -0.18, 0.14], [-0.22, 0.51, 0.17, 0.14], [0.02, 0.88, 0.02, 0.13]] },
  ash: { h: [14, 22], trunk: 0.024, bole: 0.46, bark: 0xaaa696, leaf: 0x627f3c,
    crown: [[0, 0.86, 0, 0.12], [0.18, 0.74, 0.05, 0.12], [-0.17, 0.76, -0.06, 0.12], [0.05, 0.72, -0.19, 0.11], [-0.06, 0.7, 0.18, 0.11], [0.2, 0.59, -0.1, 0.1],
      [-0.2, 0.6, 0.12, 0.1], [0.1, 0.92, 0.08, 0.09], [-0.1, 0.63, -0.18, 0.1], [0.12, 0.57, 0.18, 0.09], [0, 0.64, 0, 0.11], [-0.12, 0.85, 0.1, 0.1]] },
  elm: { h: [18, 27], trunk: 0.026, bole: 0.3, bark: 0x857a68, leaf: 0x4a632b, leader: 0.86,
    crown: [[0.12, 0.37, 0.04, 0.12], [-0.12, 0.43, -0.05, 0.13], [0.03, 0.41, -0.13, 0.11], [0.1, 0.55, 0.07, 0.13], [-0.11, 0.6, -0.02, 0.13], [0, 0.52, 0.12, 0.11],
      [0.08, 0.72, -0.06, 0.12], [-0.07, 0.76, 0.06, 0.12], [0.02, 0.88, 0, 0.1], [0, 0.66, 0, 0.12], [-0.04, 0.48, 0.02, 0.12]] },
};
const KINDS = Object.keys(TREES_1660);
const pickW = (u, w) => { const ks = Object.keys(w); for (const k of ks) { if (u < w[k]) return k; u -= w[k]; } return ks[ks.length - 1]; };

// ---- the layout: pure, no three.js
export function layoutHedgerows(site, fields, pkg = HEDGEROWS_1660, { tile = 128, cell = 8 } = {}) {
  const W = pkg.wall, HG = pkg.hedge, G = pkg.gate, TR = pkg.trees, S = pkg.seed, C = fields.cell, clear = fields.pkg?.clear ?? 46;
  const lines = new Map(), fieldCache = new Map(), drive = site.drive;
  const offDrive = (x, y, m) => !drive || x < drive.x0 - m || x > drive.x1 + m || y < drive.y0 - m || y > drive.y1 + m;
  const treeAt = (x, y, kind, h) => { const K = TREES_1660[kind], ht = K.h[0] + unit(hashN(h, 1)) * (K.h[1] - K.h[0]), ws = 0.88 + unit(hashN(h, 2)) * 0.24;
    return { x, y, kind, k: KINDS.indexOf(kind), h: ht, ws, yaw: unit(hashN(h, 3)) * 6.283185, r: K.trunk * ht * ws * 1.15, z: null }; };

  // a boundary as built: its line (a gentle wander off the straight, nought at the corners: pre-Parliamentary walls and
  // hedges are not ruled), the runs either side of its gateway with a station every ~1.5 m, the gateway, its trees
  function lineOf(e) {
    let L = lines.get(e.key); if (L) return L;
    const [i, j, d] = e.key.split(",").map(Number), ks = hashN(i, j, d, S, 11);
    const [ax, ay] = e.a, [bx, by] = e.b, dx = bx - ax, dy = by - ay, len = Math.sqrt(dx * dx + dy * dy), ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
    const wall = e.kind === "wall", P = wall ? W : HG;
    const wob = (s) => { const t = s / len; return t <= 0 || t >= 1 ? 0 : P.wobble * 4 * t * (1 - t) * valueNoise(s, 0, P.bend, ks); };
    const at = (s) => { const w = wob(s); return [ax + ux * s + nx * w, ay + uy * s + ny * w]; };
    let spans = [[-P.over, len + P.over]], gate = null;
    if (e.gate != null) { const sg = e.gate * len, h = G.opening / 2, p = wall ? G.stoop : G.post;
      spans = [[-P.over, sg - h - p], [sg + h + p, len + P.over]];
      gate = { s: sg, open: [at(sg - h), at(sg + h)], posts: [at(sg - h - p / 2), at(sg + h + p / 2)], post: p, stone: wall }; }
    const runs = spans.filter(([s0, s1]) => s1 - s0 > 0.4).map(([s0, s1]) => {
      const n = Math.max(1, Math.ceil((s1 - s0) / W.step)), ds = (s1 - s0) / n, x = new Float64Array(n + 1), y = new Float64Array(n + 1), tx = new Float32Array(n + 1), ty = new Float32Array(n + 1);
      for (let k = 0; k <= n; k++) { const p = at(s0 + ds * k); x[k] = p[0]; y[k] = p[1]; }
      for (let k = 0; k <= n; k++) { const a = Math.max(0, k - 1), b = Math.min(n, k + 1), qx = x[b] - x[a], qy = y[b] - y[a], l = Math.sqrt(qx * qx + qy * qy); tx[k] = qx / l; ty[k] = qy / l; }
      return { s0, s1, n, ds, x, y, tx, ty, zc: null, zl: null, zr: null };
    });
    // its timber trees: in the hedge's line, or a pace or two to one side of the wall; none at the corners or the gateway
    const trees = [];
    for (let s = 5 + unit(hashN(ks, 0, 30)) * 15, k = 0; s < len - 5; k++) {
      if (unit(hashN(ks, k, 31)) < TR.keep && (!gate || Math.abs(s - gate.s) > G.opening / 2 + 5)) {
        const off = wall ? (unit(hashN(ks, k, 32)) < 0.5 ? -1 : 1) * (W.base / 2 + 1.0 + unit(hashN(ks, k, 33)) * 1.3) : (unit(hashN(ks, k, 33)) - 0.5) * 0.5, p = at(s);
        trees.push(treeAt(p[0] + nx * off, p[1] + ny * off, pickW(unit(hashN(ks, k, 34)), TR.mix), hashN(ks, k, 35))); }
      s += TR.every[0] + unit(hashN(ks, k, 36)) * (TR.every[1] - TR.every[0]);
    }
    L = { key: e.key, kind: e.kind, ks, len, ux, uy, nx, ny, a: e.a, b: e.b, runs, gate, trees, half: wall ? W.base / 2 : HG.width / 2, at };
    if (lines.size > 20000) lines.clear();
    lines.set(e.key, L); return L;
  }
  // the ground under a run's stations (and, for a wall drawn near, either side of its foot), as needed: every station,
  // or every few; each sample taken once
  function heights(L, R, every = 1, sides = L.kind === "wall") {
    if (!R.zc) { R.zc = new Float32Array(R.n + 1).fill(NaN); R.zl = new Float32Array(R.n + 1).fill(NaN); R.zr = new Float32Array(R.n + 1).fill(NaN); }
    const hb = W.base / 2;
    const fill = (k) => { const x = R.x[k], y = R.y[k]; if (R.zc[k] !== R.zc[k]) R.zc[k] = site.z(x, y);
      if (sides && R.zl[k] !== R.zl[k]) { const nx = -R.ty[k], ny = R.tx[k]; R.zl[k] = site.z(x + nx * hb, y + ny * hb); R.zr[k] = site.z(x - nx * hb, y - ny * hb); } };
    for (let k = 0; k <= R.n; k += every) fill(k); fill(R.n);
  }
  // the pasture trees of a close (the quad of four lattice corners): none, one or two, well inside it
  function fieldTrees(i, j) {
    const key = `${i},${j}`; let out = fieldCache.get(key); if (out) return out; out = [];
    const u = unit(hashN(i, j, S, 41)), n = u < TR.field.two ? 2 : u < TR.field.one ? 1 : 0;
    if (n) { const q = [fields.nodeAt(i, j), fields.nodeAt(i + 1, j), fields.nodeAt(i + 1, j + 1), fields.nodeAt(i, j + 1)];
      for (let k = 0; k < n; k++) { const a = 0.2 + 0.6 * unit(hashN(i, j, S, 42, k)), b = 0.2 + 0.6 * unit(hashN(i, j, S, 43, k));
        const x = (q[0][0] * (1 - a) + q[1][0] * a) * (1 - b) + (q[3][0] * (1 - a) + q[2][0] * a) * b, y = (q[0][1] * (1 - a) + q[1][1] * a) * (1 - b) + (q[3][1] * (1 - a) + q[2][1] * a) * b;
        if (site.padD(x, y) < clear + 10 || !offDrive(x, y, 12)) continue;
        const f = fields.fieldAt(x, y); if (!f || f.i !== i || f.j !== j || f.use !== "pasture") continue;
        out.push(treeAt(x, y, pickW(unit(hashN(i, j, S, 44, k)), TR.field.mix), hashN(i, j, S, 45, k))); } }
    if (fieldCache.size > 20000) fieldCache.clear();
    fieldCache.set(key, out); return out;
  }
  // what a tile owns: the boundaries whose middle falls in it, their trees, and the pasture trees standing in it
  function tileItems(ti, tj) {
    const x0 = ti * tile, y0 = tj * tile, x1 = x0 + tile, y1 = y0 + tile, inT = (x, y) => x >= x0 && x < x1 && y >= y0 && y < y1;
    const own = fields.edgesIn({ x0, y0, x1, y1 }).filter(e => inT((e.a[0] + e.b[0]) / 2, (e.a[1] + e.b[1]) / 2)).map(lineOf);
    const trees = own.flatMap(L => L.trees);
    for (let i = Math.floor(x0 / C) - 1; i <= Math.floor(x1 / C) + 1; i++) for (let j = Math.floor(y0 / C) - 1; j <= Math.floor(y1 / C) + 1; j++) for (const t of fieldTrees(i, j)) if (inT(t.x, t.y)) trees.push(t);
    return { ti, tj, x0, y0, x1, y1, lines: own, trees };
  }
  // what stops a body of half-width `half` (to 1 m): a wall or hedge (capsules along its stations), a stoop or post,
  // a closed gate, a trunk. Per 8 m cell, the obstacles that can reach into it, gathered once and kept
  const cells = new Map(), M = 6, MAXH = 1.0;
  function cellOf(cx, cy) {
    const key = (cx + 1048576) * 2097152 + (cy + 1048576); let c = cells.get(key); if (c) return c;
    const x0 = cx * cell, y0 = cy * cell, x1 = x0 + cell, y1 = y0 + cell, segs = [], circs = [];
    const reach = (xa, ya, xb, yb, r) => Math.max(xa, xb) > x0 - r - MAXH && Math.min(xa, xb) < x1 + r + MAXH && Math.max(ya, yb) > y0 - r - MAXH && Math.min(ya, yb) < y1 + r + MAXH;
    for (const e of fields.edgesIn({ x0: x0 - M, y0: y0 - M, x1: x1 + M, y1: y1 + M })) {
      const L = lineOf(e);
      for (const R of L.runs) for (let k = 0; k < R.n; k++) if (reach(R.x[k], R.y[k], R.x[k + 1], R.y[k + 1], L.half)) segs.push(R.x[k], R.y[k], R.x[k + 1], R.y[k + 1], L.half);
      if (L.gate) { const g = L.gate, pr = g.post * 0.71, [A, B] = g.open;
        for (const p of g.posts) if (reach(p[0], p[1], p[0], p[1], pr)) circs.push(p[0], p[1], pr);
        if (reach(A[0], A[1], B[0], B[1], 0.06)) segs.push(A[0], A[1], B[0], B[1], 0.06); }       // the gate, shut
      for (const t of L.trees) if (reach(t.x, t.y, t.x, t.y, t.r)) circs.push(t.x, t.y, t.r);
    }
    for (let i = Math.floor((x0 - M) / C) - 1; i <= Math.floor((x1 + M) / C) + 1; i++) for (let j = Math.floor((y0 - M) / C) - 1; j <= Math.floor((y1 + M) / C) + 1; j++)
      for (const t of fieldTrees(i, j)) if (reach(t.x, t.y, t.x, t.y, t.r)) circs.push(t.x, t.y, t.r);
    c = { segs: Float64Array.from(segs), circs: Float64Array.from(circs) };
    if (cells.size > 40000) cells.clear();
    cells.set(key, c); return c;
  }
  function blocked(x, y, half = 0.22) {
    const c = cellOf(Math.floor(x / cell), Math.floor(y / cell)), Sg = c.segs, Q = c.circs;
    for (let k = 0; k < Sg.length; k += 5) { const ax = Sg[k], ay = Sg[k + 1], dx = Sg[k + 2] - ax, dy = Sg[k + 3] - ay, r = Sg[k + 4] + half, l2 = dx * dx + dy * dy;
      let t = l2 > 0 ? ((x - ax) * dx + (y - ay) * dy) / l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
      const ex = ax + t * dx - x, ey = ay + t * dy - y; if (ex * ex + ey * ey < r * r) return true; }
    for (let k = 0; k < Q.length; k += 3) { const ex = Q[k] - x, ey = Q[k + 1] - y, r = Q[k + 2] + half; if (ex * ex + ey * ey < r * r) return true; }
    return false;
  }
  return { pkg, tile, lineOf, heights, fieldTrees, tileItems, blocked, cells: () => cells.size };
}

// ---- the looks, drawn in code (as src/make/manor.js draws its slates and ashlar)
function canvasTexture(THREE, N, draw, { srgb = true, repeat = 1 } = {}) {
  const cv = document.createElement("canvas"); cv.width = cv.height = N; draw(cv.getContext("2d"), N);
  const t = new THREE.CanvasTexture(cv); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.repeat.set(repeat, repeat); return t;
}
// dry-stone rubble (research-1660 §A1, A5: limestone, pale grey-buff, uneven): stones in rough courses, no mortar, the
// voids between them in deep shadow, lichen on some; a height map of the same stones for the bump. Covers 2 m by 2 m
function rubbleTextures(THREE) {
  const N = 512, r = rng(seedOf("hillside/dry-stone")), cv = [0, 1].map(() => { const c = document.createElement("canvas"); c.width = c.height = N; return c; });
  const g = cv[0].getContext("2d"), h = cv[1].getContext("2d");
  g.fillStyle = "#47433a"; g.fillRect(0, 0, N, N); h.fillStyle = "#000"; h.fillRect(0, 0, N, N);
  const courses = []; for (let y = 0; y < N;) { let ch = 26 + r() * 34; if (N - y - ch < 26) ch = N - y; courses.push([y, ch]); y += ch; }
  const stone = (ctx, x, y, w, hh, j) => { ctx.beginPath(); ctx.moveTo(x + j[0], y + j[1]); ctx.quadraticCurveTo(x + w / 2, y + j[2] - 2, x + w - j[3], y + j[4]); ctx.quadraticCurveTo(x + w + 1, y + hh / 2, x + w - j[5], y + hh - j[6]);
    ctx.quadraticCurveTo(x + w / 2, y + hh + j[7] * 0.4, x + j[8], y + hh - j[9]); ctx.quadraticCurveTo(x - 1, y + hh / 2, x + j[0], y + j[1]); ctx.closePath(); ctx.fill(); };
  for (const [cy, ch] of courses) { let x = -r() * 70; const end = x + N;
    while (x < end) { const w = Math.min(36 + r() * 92, end - x + 6), hh = ch - 2 - r() * 6, oy = cy + 1 + r() * (ch - hh - 2), j = Array.from({ length: 10 }, () => 2 + r() * 6);
      const t = 164 + r() * 44, warm = r() * 10, dark = r() < 0.12 ? 0.82 : 1;
      for (const ox of [0, -N, N]) { if (x + ox > N || x + ox + w < 0) continue;
        const grad = g.createLinearGradient(0, oy, 0, oy + hh); grad.addColorStop(0, `rgb(${(t + 14 + warm) * dark | 0},${(t + 10 + warm * 0.6) * dark | 0},${(t - 4) * dark | 0})`); grad.addColorStop(1, `rgb(${(t - 22 + warm) * dark | 0},${(t - 25) * dark | 0},${(t - 36) * dark | 0})`);
        g.fillStyle = grad; stone(g, x + ox, oy, w, hh, j);
        const hg = h.createRadialGradient(x + ox + w / 2, oy + hh * 0.4, 2, x + ox + w / 2, oy + hh / 2, Math.max(w, hh) * 0.7); hg.addColorStop(0, "#fff"); hg.addColorStop(1, "#6a6a6a"); h.fillStyle = hg; stone(h, x + ox, oy, w, hh, j); }
      // lichen: pale grey-green rosettes, now and then a yellow one
      for (let k = r() < 0.55 ? 1 + (r() * 4 | 0) : 0; k > 0; k--) { const lx = x + r() * w, ly = oy + r() * hh, yl = r() < 0.15; g.fillStyle = yl ? "rgba(196,170,80,0.45)" : `rgba(${205 + r() * 30 | 0},${210 + r() * 25 | 0},${190 + r() * 20 | 0},0.38)`;
        for (const ox of [0, -N, N]) { g.beginPath(); g.ellipse(lx + ox, ly, 2 + r() * 7, 1.5 + r() * 5, r() * 3, 0, 7); g.fill(); } }
      for (let k = 0; k < 28; k++) { g.fillStyle = `rgba(${r() < 0.5 ? "70,64,52" : "235,230,214"},${0.05 + r() * 0.08})`; const px = x + r() * w, py = oy + r() * hh; g.fillRect(px, py, 1 + r() * 4, 1 + r() * 2); if (px > N - 6) g.fillRect(px - N, py, 3, 2); }
      x += w + 2 + r() * 4; } }
  const tex = cv.map((c, k) => { const t = new THREE.CanvasTexture(c); if (!k) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; });
  return { map: tex[0], bump: tex[1] };
}
// a dressed stone's face (copes and stoops): grey-buff, pitted, lichened
function roughStone(THREE) {
  const r = rng(seedOf("hillside/cope"));
  return canvasTexture(THREE, 256, (g, N) => { g.fillStyle = "#b0a993"; g.fillRect(0, 0, N, N);
    for (let k = 0; k < 2600; k++) { const t = r(); g.fillStyle = `rgba(${t < 0.5 ? "84,78,64" : "226,220,200"},${0.06 + r() * 0.12})`; g.fillRect(r() * N, r() * N, 1 + r() * 5, 1 + r() * 3); }
    for (let k = 0; k < 26; k++) { g.fillStyle = r() < 0.2 ? "rgba(190,166,82,0.4)" : "rgba(214,218,196,0.35)"; g.beginPath(); g.ellipse(r() * N, r() * N, 3 + r() * 10, 2 + r() * 7, r() * 3, 0, 7); g.fill(); } });
}
// hawthorn: small dark leaves, crowded, with the dark of the hedge's depth between; tiles at 1/2 m
function hawthornLeaves(THREE) {
  const r = rng(seedOf("hillside/hawthorn")), greens = ["#4a6a2c", "#557530", "#628036", "#6e8a3c", "#405e26", "#7a8a44", "#577030"];
  return canvasTexture(THREE, 256, (g, N) => { g.fillStyle = "#26381a"; g.fillRect(0, 0, N, N);
    for (let k = 0; k < 2600; k++) { const x = r() * N, y = r() * N, a = r() * 6.28, l = 2.5 + r() * 3.5; g.fillStyle = greens[r() * greens.length | 0];
      for (const ox of x < 8 ? [0, N] : x > N - 8 ? [0, -N] : [0]) for (const oy of y < 8 ? [0, N] : y > N - 8 ? [0, -N] : [0]) { g.beginPath(); g.ellipse(x + ox, y + oy, l, l * 0.55, a, 0, 7); g.fill(); } }
    for (let k = 0; k < 120; k++) { g.fillStyle = "rgba(10,16,8,0.5)"; g.beginPath(); g.ellipse(r() * N, r() * N, 1.5 + r() * 3, 1 + r() * 2, r() * 3, 0, 7); g.fill(); } }, { repeat: 2 });
}
// oak left out: silver-grey over brown, the grain along the board
function weatheredOak(THREE) {
  const r = rng(seedOf("hillside/oak"));
  return canvasTexture(THREE, 256, (g, N) => { g.fillStyle = "#a09a8b"; g.fillRect(0, 0, N, N);
    for (let k = 0; k < 140; k++) { const y = r() * N, t = r(); g.strokeStyle = t < 0.5 ? `rgba(70,62,50,${0.15 + r() * 0.25})` : `rgba(190,186,172,${0.1 + r() * 0.2})`; g.lineWidth = 0.6 + r() * 1.8; g.beginPath(); g.moveTo(0, y);
      for (let x = 0; x <= N; x += 32) g.lineTo(x, y + Math.sin(x * 0.02 + k) * 2.5); g.stroke(); }
    for (let k = 0; k < 4; k++) { g.fillStyle = "rgba(60,50,38,0.5)"; g.beginPath(); g.ellipse(r() * N, r() * N, 3 + r() * 4, 2 + r() * 2, 0, 0, 7); g.fill(); } });
}
// leaves in a mass, as a grey to multiply a crown's colour by: lit clusters and dark gaps; and bark, fissured
function speckle(THREE, name, draw) { const r = rng(seedOf(name)); return canvasTexture(THREE, 256, (g, N) => draw(g, N, r), { srgb: false }); }
const leafSpeckle = (THREE) => speckle(THREE, "hillside/leaf-speckle", (g, N, r) => { g.fillStyle = "#8c8c8c"; g.fillRect(0, 0, N, N);
  for (let k = 0; k < 1600; k++) { const x = r() * N, y = r() * N, l = 2 + r() * 5, v = r() < 0.45 ? 40 + r() * 60 | 0 : 170 + r() * 85 | 0; g.fillStyle = `rgb(${v},${v},${v})`;
    for (const ox of x < 8 ? [0, N] : x > N - 8 ? [0, -N] : [0]) for (const oy of y < 8 ? [0, N] : y > N - 8 ? [0, -N] : [0]) { g.beginPath(); g.ellipse(x + ox, y + oy, l, l * 0.6, r() * 3, 0, 7); g.fill(); } } });
const barkSpeckle = (THREE) => speckle(THREE, "hillside/bark", (g, N, r) => { g.fillStyle = "#c4c4c4"; g.fillRect(0, 0, N, N);
  for (let k = 0; k < 90; k++) { const x = r() * N, v = 90 + r() * 50 | 0; g.strokeStyle = `rgb(${v},${v},${v})`; g.lineWidth = 1 + r() * 3; g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= N; y += 16) g.lineTo(x + Math.sin(y * 0.05 + k) * 3, y); g.stroke(); }
  for (let k = 0; k < 60; k++) { const v = 190 + r() * 60 | 0; g.fillStyle = `rgba(${v},${v},${v - 20},0.5)`; g.beginPath(); g.ellipse(r() * N, r() * N, 2 + r() * 6, 1 + r() * 3, 0, 0, 7); g.fill(); } });
// the materials, shared by every tile. Foliage passes some sunlight through: lit from behind (the sun beyond it) a crown
// or a hedge glows a little rather than going black, as leaves do (a translucency term on the diffuse colour, by how
// nearly you look toward the sun, `sunDir`: a uniform, the direction toward the sun in three's frame)
export function hillsideMaterials(THREE, { sunDir, light = { sun: 0xffe2b8, sunI: 1.8 } } = {}) {
  const T = THREE.TSL, rub = rubbleTextures(THREE), leaves = hawthornLeaves(THREE);
  sunDir = sunDir || T.uniform(new THREE.Vector3(14, 22, 30).normalize());
  const back = T.max(T.dot(T.normalize(T.positionWorld.sub(T.cameraPosition)), sunDir), 0);
  const glow = (k = 1) => T.diffuseColor.rgb.mul(T.color(light.sun)).mul(T.float(0.1).add(back.pow(4).mul(0.5)).mul(light.sunI * k));
  const far = new THREE.MeshLambertNodeMaterial({ vertexColors: true });
  // the far strips: walls and hedges in one material, the look by a vertex weight (0 stone, 1 hedge)
  const look = T.attribute("look", "float");
  far.colorNode = T.mix(T.texture(rub.map, T.uv()), T.texture(leaves, T.uv().mul(2)), look); far.emissiveNode = glow().mul(look);
  const hedge = new THREE.MeshLambertNodeMaterial({ map: leaves }); hedge.emissiveNode = glow();
  // a tree: bark or leaves by a vertex weight, each a grey speckle over the vertex colour
  const tree = new THREE.MeshLambertNodeMaterial({ vertexColors: true }), leafy = T.attribute("leafy", "float");
  tree.colorNode = T.mix(T.texture(barkSpeckle(THREE), T.uv().mul(T.vec2(2, 4))), T.texture(leafSpeckle(THREE), T.uv().mul(T.vec2(6, 3))), leafy).mul(1.15); tree.emissiveNode = glow().mul(leafy);
  return {
    stone: new THREE.MeshLambertMaterial({ map: rub.map, bumpMap: rub.bump, bumpScale: 2.2 }),
    cope: new THREE.MeshLambertMaterial({ map: roughStone(THREE) }),
    hedge, wood: new THREE.MeshLambertMaterial({ map: weatheredOak(THREE) }), tree, far, sunDir,
  };
}

// ---- shared shapes
// a cope: an upright slab, its top broken and lopsided (turned end for end at random, so no two in a row alike); unit
// size: x along the wall (its thickness), y up, z across the wall
function copeGeometry(THREE) {
  const P = [[-0.5, 0], [0.5, 0], [0.5, 0.56], [0.36, 0.84], [0.12, 0.9], [-0.08, 1], [-0.3, 0.93], [-0.46, 0.74], [-0.5, 0.6]], pos = [], nor = [], uv = [], idx = [];
  let per = 0;
  for (let i = 1; i < P.length; i++) { const [z0, y0] = P[i], [z1, y1] = P[(i + 1) % P.length], ez = z1 - z0, ey = y1 - y0, l = Math.hypot(ez, ey), b = pos.length / 3;
    for (const [x, z, y, u] of [[-0.5, z0, y0, per], [0.5, z0, y0, per], [-0.5, z1, y1, per + l], [0.5, z1, y1, per + l]]) { pos.push(x, y, z); nor.push(0, -ez / l, ey / l); uv.push(u, x + 0.5); }
    idx.push(b, b + 1, b + 3, b, b + 3, b + 2); per += l; }
  for (const sx of [-0.5, 0.5]) { const b = pos.length / 3; for (const [z, y] of P) { pos.push(sx, y, z); nor.push(Math.sign(sx), 0, 0); uv.push(z + 0.5, y); }
    for (let i = 1; i + 1 < P.length; i++) sx < 0 ? idx.push(b, b + i, b + i + 1) : idx.push(b, b + i + 1, b + i); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeBoundingSphere(); return g;
}
// a clump of hawthorn: a lumpy ball (diameter 1), its vertices welded so the lumps never crack, its normals the ball's
// own, tipped up (foliage lit as a mass, not as facets)
function clumpGeometry(THREE) {
  const src = new THREE.IcosahedronGeometry(0.5, 1), P = src.attributes.position, U = src.attributes.uv, map = new Map(), pos = [], nor = [], uv = [], idx = [];
  const lump = (x, y, z) => 1 + 0.16 * Math.sin(x * 9.1 + 1.3) * Math.sin(y * 7.7 + 0.4) * Math.sin(z * 8.3 + 2.2) + 0.08 * Math.sin(x * 17 + y * 13 + z * 11);
  for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i), key = `${x.toFixed(4)},${y.toFixed(4)},${z.toFixed(4)}`;
    let v = map.get(key);
    if (v === undefined) { v = pos.length / 3; map.set(key, v); const k = lump(x, y, z), l = Math.hypot(x, y + 0.4, z); pos.push(x * k, y * k, z * k); nor.push(x / l, (y + 0.4) / l, z / l); uv.push(U.getX(i), U.getY(i)); }
    idx.push(v); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeBoundingSphere(); src.dispose(); return g;
}
// a box's arrays (three's), for appending transformed
function boxArrays(THREE, w, h, d, at = [0, 0, 0], rotZ = 0) {
  const b = new THREE.BoxGeometry(w, h, d); if (rotZ) b.rotateZ(rotZ); b.translate(...at);
  const out = { p: Array.from(b.attributes.position.array), n: Array.from(b.attributes.normal.array), t: Array.from(b.attributes.uv.array), i: Array.from(b.index.array) }; b.dispose(); return out;
}
// a five-bar field gate, shut, in its own frame: x from the hinge along the gate (L), y up from the bottom rail, z
// through it. Bars closer at the foot (to keep lambs in), a heel and a head, a middle upright, the brace from the
// heel's foot to the head's top (chosen: the common English pattern)
function leafArrays(THREE, L = 2.9, H = 1.2) {
  const parts = [], bars = [0.1, 0.3, 0.52, 0.77, 1.08];
  bars.forEach((y, k) => parts.push(boxArrays(THREE, L - 0.06, k === 4 ? 0.11 : 0.085, k === 4 ? 0.07 : 0.035, [L / 2, y, 0])));
  parts.push(boxArrays(THREE, 0.1, H, 0.09, [0.05, H / 2, 0]), boxArrays(THREE, 0.075, H - 0.05, 0.07, [L - 0.04, (H - 0.05) / 2, 0]), boxArrays(THREE, 0.06, 1.0, 0.04, [L * 0.5, 0.56, 0.03]));
  const bx = L - 0.15, by = 1.0, bl = Math.hypot(bx, by); parts.push(boxArrays(THREE, bl, 0.075, 0.035, [0.08 + bx / 2, 0.06 + by / 2, -0.035], Math.atan2(by, bx)));
  const out = { p: [], n: [], t: [], i: [] }; for (const q of parts) { const b = out.p.length / 3; out.p.push(...q.p); out.n.push(...q.n); out.t.push(...q.t); for (const i of q.i) out.i.push(i + b); }
  return out;
}

// a builder of one tile's merged geometry; positions arrive in plan coordinates (x east, y north, z up)
class Arrays {
  constructor(look = false) { this.p = []; this.n = []; this.t = []; this.i = []; this.c = look ? [] : null; this.l = look ? [] : null; this.v = 0; }
  add(x, y, z, nx, ny, nz, u, v, col, look) { this.p.push(x, z, -y); this.n.push(nx, nz, -ny); this.t.push(u, v); if (this.c) { this.c.push(col[0], col[1], col[2]); this.l.push(look); } return this.v++; }
  // three's arrays (a box, the gate) through an affine matrix (column-major, three's frame); normals turned by yaw only
  put(A, m, c, s) { const b = this.v, P = A.p, N = A.n;
    for (let k = 0; k < P.length; k += 3) { const x = P[k], y = P[k + 1], z = P[k + 2]; this.p.push(m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]);
      const nx = N[k], ny = N[k + 1], nz = N[k + 2]; this.n.push(nx * c + nz * s, ny, -nx * s + nz * c); }
    this.t.push(...A.t); for (const i of A.i) this.i.push(i + b); this.v += P.length / 3; }
  geometry(THREE) { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(this.t, 2)); if (this.c) { g.setAttribute("color", new THREE.Float32BufferAttribute(this.c, 3)); g.setAttribute("look", new THREE.Float32BufferAttribute(this.l, 1)); }
    g.setIndex(this.v > 65535 ? new THREE.Uint32BufferAttribute(this.i, 1) : new THREE.Uint16BufferAttribute(this.i, 1)); g.computeBoundingSphere(); return g; }
}
// T(x, y, z) R_y(yaw) R_z(lean) S(sx, sy, sz), column-major, into a Float32Array at o
function writeTRS(A, o, x, y, z, yaw, lean, sx, sy, sz) {
  const c = Math.cos(yaw), s = Math.sin(yaw), cl = Math.cos(lean), sl = Math.sin(lean);
  A[o] = c * cl * sx; A[o + 1] = sl * sx; A[o + 2] = -s * cl * sx; A[o + 3] = 0;
  A[o + 4] = -c * sl * sy; A[o + 5] = cl * sy; A[o + 6] = s * sl * sy; A[o + 7] = 0;
  A[o + 8] = s * sz; A[o + 9] = 0; A[o + 10] = c * sz; A[o + 11] = 0;
  A[o + 12] = x; A[o + 13] = y; A[o + 14] = z; A[o + 15] = 1;
}

// ---- a tree's model, unit height, its bark and leaves as vertex colours (the near model, and what its impostor is drawn from)
function treeGeometry(THREE, kind) {
  const K = TREES_1660[kind], r = rng(seedOf(`hillside/tree/${kind}`)), parts = [], bark = new THREE.Color(K.bark), leaf = new THREE.Color(K.leaf);
  const limb = (a, b, r0, r1, sides = 6) => { const d = new THREE.Vector3().subVectors(b, a), g = new THREE.CylinderGeometry(r1, r0, d.length(), sides, 1, true);
    g.translate(0, d.length() / 2, 0); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize())); g.translate(a.x, a.y, a.z); return g; };
  const top = K.leader || K.bole, base = new THREE.Vector3(0, 0, 0), fork = new THREE.Vector3((r() - 0.5) * 0.02, K.bole, (r() - 0.5) * 0.02);
  parts.push([limb(base, fork, K.trunk, K.trunk * 0.62, 9), 0]);
  if (K.leader) parts.push([limb(fork, new THREE.Vector3(0, top, 0), K.trunk * 0.62, K.trunk * 0.25, 7), 0]);
  for (const [x, y, z] of K.crown) { if (y < K.bole + 0.02) continue; const from = K.leader ? new THREE.Vector3(0, Math.min(y - 0.06, top), 0) : fork;
    parts.push([limb(from, new THREE.Vector3(x * 0.75, y - 0.04, z * 0.75), K.trunk * 0.4, K.trunk * 0.16, 5), 0]); }
  // the clusters: lumpy balls; their normals the ball's, tipped up and out from the trunk, so a crown is lit as a mass
  // (its side away from the sun dim, not black) rather than as so many balls
  for (const [x, y, z, rad] of K.crown) { const s = new THREE.IcosahedronGeometry(rad, rad > 0.11 ? 2 : 1), P = s.attributes.position, N = s.attributes.normal, sd = r() * 10, out = Math.hypot(x, z) || 1;
    for (let i = 0; i < P.count; i++) { const px = P.getX(i), py = P.getY(i), pz = P.getZ(i), k = 1 + 0.28 * Math.sin(px / rad * 3.1 + sd) * Math.sin(py / rad * 2.7 + sd * 0.7) * Math.sin(pz / rad * 3.3 + sd * 1.3) + 0.1 * Math.sin((px + py + pz) / rad * 7 + sd);
      P.setXYZ(i, px * k, py * k * 0.92, pz * k);
      const nx = N.getX(i) + 0.35 * x / out, ny = N.getY(i) + 0.5, nz = N.getZ(i) + 0.35 * z / out, l = Math.hypot(nx, ny, nz); N.setXYZ(i, nx / l, ny / l, nz / l); }
    s.translate(x, y, z); parts.push([s, 1]); }
  const geos = parts.map(([g0, m]) => { const g = g0.index ? g0.toNonIndexed() : g0, P = g.attributes.position, N = g.attributes.normal, col = new Float32Array(P.count * 3);
    for (let i = 0; i < P.count; i++) { let v;
      if (m) { const ny = N.getY(i), ax = Math.hypot(P.getX(i), P.getZ(i)); v = (0.8 + 0.2 * (ny * 0.5 + 0.5)) * (0.88 + 0.14 * Math.min(1, ax / 0.28)) * (0.9 + 0.18 * unit(hashN(i, 7)));
        col[i * 3] = leaf.r * v; col[i * 3 + 1] = leaf.g * v; col[i * 3 + 2] = leaf.b * v; }
      else { v = 0.85 + 0.25 * unit(hashN(i, 9)); col[i * 3] = bark.r * v; col[i * 3 + 1] = bark.g * v; col[i * 3 + 2] = bark.b * v; } }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3)); g.setAttribute("leafy", new THREE.BufferAttribute(new Float32Array(P.count).fill(m), 1)); return g; });
  const total = geos.reduce((a, g) => a + g.attributes.position.count, 0), out = new THREE.BufferGeometry();
  for (const [name, n] of [["position", 3], ["normal", 3], ["color", 3], ["uv", 2], ["leafy", 1]]) { const arr = new Float32Array(total * n); let o = 0; for (const g of geos) { arr.set(g.attributes[name].array, o); o += g.attributes[name].array.length; } out.setAttribute(name, new THREE.BufferAttribute(arr, n)); }
  out.computeBoundingSphere(); geos.forEach(g => g.dispose()); return out;
}

// ---- the hillside drawn
export function makeHillside(THREE, site, fields, { tile = 128, radius = 700, near = 150, nearTile = 150, renderer = null, materials = {}, pkg = HEDGEROWS_1660,
  light = { sun: 0xffe2b8, sunI: 1.8, sky: 0xc8d0d8, ground: 0x3a2c1e, hemi: 0.55, dir: [14, 22, 30] }, capacity = 3000, bundle = false } = {}) {
  const T = THREE.TSL, lay = layoutHedgerows(site, fields, pkg, { tile }), W = pkg.wall, HG = pkg.hedge, G = pkg.gate;
  const sunDir = T.uniform(new THREE.Vector3(...light.dir).normalize()), M = { ...hillsideMaterials(THREE, { sunDir, light }), ...materials };
  const group = new THREE.Group(); group.name = "hillside";
  const tiles = new THREE.Group(); tiles.name = "hillside-tiles"; group.add(tiles);
  // the far tiles (a hundred light draws) as one render bundle on WebGPU, recorded again only when the set changes. A
  // bundle replays what passed the frustum when it was recorded (three r186 culls its children then), so its tiles are
  // never culled: all of them drawn, cheaply, whichever way you turn. The near tiles (few, heavy) stay culled as usual.
  // (Measured on the RX 460: 34 fewer draws, the same frame time, as the hillside is bound by the GPU there; off by default)
  const farTiles = bundle && THREE.BundleGroup ? new THREE.BundleGroup() : tiles; if (farTiles !== tiles) { farTiles.name = "hillside-far"; group.add(farTiles); }
  // an instanced draw's shader is the same for every tile only if its matrices come as attributes, not a uniform array
  // sized to the count (three r186 picks by size): every tile's instanced meshes hold at least this many
  const PAD = Math.floor((renderer?.backend?.capabilities?.getUniformBufferLimit?.() || 65536) / 64) + 1;
  const copeGeo = copeGeometry(THREE), clumpGeo = clumpGeometry(THREE), LEAF = G.opening - 0.1, leaf = leafArrays(THREE, LEAF, G.leaf), post = boxArrays(THREE, 1, 1, 1, [0, 0.5, 0]);

  // ---- the trees: per kind, an instanced batch of near models (rebuilt as you go); every tree's impostor in one draw
  const treeGeos = KINDS.map(k => treeGeometry(THREE, k));
  const nearTrees = treeGeos.map((g) => { const m = new THREE.InstancedMesh(g, M.tree, capacity); m.count = 0; m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; m.name = "trees-near"; group.add(m); return m; });
  // the impostors' atlases: each kind's model drawn once, side on, in a cell of 1.1 by 1.1 of its height; twice, with the
  // sun at the light's height behind the viewer and behind the tree, so a far tree is lit as its model would be from
  // where you stand (the two blended by how you face the sun)
  const CELLW = 1.1, atlas = renderer ? [1, -1].map(impostorAtlas) : null;
  function impostorAtlas(side) {
    const rt = new THREE.RenderTarget(1024, 256, { type: THREE.HalfFloatType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, depthBuffer: true });
    const s = new THREE.Scene(), cam = new THREE.OrthographicCamera(-CELLW / 2, CELLW * 3.5, 1.08, -0.02, 0.1, 10); cam.position.set(0, 0, 4); cam.lookAt(0, 0, 0);
    treeGeos.forEach((g, k) => { const m = new THREE.Mesh(g, M.tree); m.position.x = k * CELLW; s.add(m); });
    s.add(new THREE.HemisphereLight(light.sky, light.ground, light.hemi));
    const el = Math.atan2(light.dir[1], Math.hypot(light.dir[0], light.dir[2])), l = new THREE.DirectionalLight(light.sun, light.sunI);
    l.position.set(0, Math.sin(el), Math.cos(el) * side).add(new THREE.Vector3(1.65, 0.5, 0)); l.target.position.set(1.65, 0.5, 0); s.add(l, l.target);
    const cc = renderer.getClearColor(new THREE.Color()), ca = renderer.getClearAlpha(), was = renderer.getRenderTarget(), sun0 = sunDir.value.clone();
    sunDir.value.copy(l.position).sub(l.target.position).normalize();     // the leaves' glow from this drawing's sun
    renderer.setClearColor(new THREE.Color(0.03, 0.05, 0.02), 0); renderer.setRenderTarget(rt); renderer.render(s, cam); renderer.setRenderTarget(was); renderer.setClearColor(cc, ca);
    sunDir.value.copy(sun0);
    return rt.texture;
  }
  const IMP = 8192, ig = new THREE.InstancedBufferGeometry(), card = new THREE.PlaneGeometry(1, 1); card.translate(0, 0.5, 0);
  ig.index = card.index; ig.setAttribute("position", card.attributes.position); ig.setAttribute("uv", card.attributes.uv);
  const aCenter = new THREE.InstancedBufferAttribute(new Float32Array(IMP * 3), 3), aSize = new THREE.InstancedBufferAttribute(new Float32Array(IMP * 2), 2), aKind = new THREE.InstancedBufferAttribute(new Float32Array(IMP), 1);
  for (const a of [aCenter, aSize, aKind]) a.setUsage(THREE.DynamicDrawUsage);
  ig.setAttribute("aCenter", aCenter); ig.setAttribute("aSize", aSize); ig.setAttribute("aKind", aKind); ig.instanceCount = 0;
  const imp = new THREE.MeshBasicNodeMaterial({ side: THREE.DoubleSide, alphaTest: 0.5 }); imp.alphaToCoverage = true;
  { const C = T.attribute("aCenter", "vec3"), Sz = T.attribute("aSize", "vec2"), K = T.attribute("aKind", "float"), P = T.positionGeometry, toCam = T.cameraPosition.sub(C);
    // a card turned to face you about the upright (a tree looks alike from every side); folded to a point within the near
    // trees' reach, where the models stand instead
    const side = T.normalize(T.vec3(toCam.z, 0, toCam.x.negate()).add(T.vec3(1e-5, 0, 0)));
    imp.positionNode = T.select(T.distance(C, T.cameraPosition).lessThan(near - 4), C, C.add(side.mul(P.x.mul(Sz.x))).add(T.vec3(0, P.y.mul(Sz.y), 0)));
    // (a render target reads upside down through a mesh's uv in three r186, on both backends: v turned over)
    const at = T.vec2(K.add(T.uv().x).div(4), T.float(1).sub(T.uv().y)), facing = T.dot(T.normalize(T.vec2(toCam.x, toCam.z.negate())), T.normalize(T.vec2(sunDir.x, sunDir.z.negate())));
    imp.colorNode = atlas ? T.mix(T.texture(atlas[1], at), T.texture(atlas[0], at), facing.mul(0.5).add(0.5)) : T.vec4(0.12, 0.2, 0.06, 1); }
  const impostors = new THREE.Mesh(ig, imp); impostors.frustumCulled = false; impostors.name = "trees-far"; group.add(impostors);

  // ---- a tile, near: walls in full, copes and stoops, hedge clumps, gates and posts
  function wallNear(L, A, copes) {
    const hb = W.base / 2, ht = W.top / 2, H = W.height, wb = hb + (hb - ht) * W.sink / H;
    L.runs.forEach((R, ri) => { lay.heights(L, R, 1); const b0 = A.v;
      for (let k = 0; k <= R.n; k++) { const x = R.x[k], y = R.y[k], nx = -R.ty[k], ny = R.tx[k], zc = R.zc[k], top = zc + H, zl = R.zl[k] - W.sink, zr = R.zr[k] - W.sink, u = (R.s0 + R.ds * k) / 2;
        const inset = wb - ht, rl = top - zl, rr = top - zr, ll = Math.hypot(rl, inset), lr = Math.hypot(rr, inset);
        A.add(x + nx * wb, y + ny * wb, zl, nx * rl / ll, ny * rl / ll, inset / ll, u, (zl - zc) / 2);
        A.add(x + nx * ht, y + ny * ht, top, nx * rl / ll, ny * rl / ll, inset / ll, u, H / 2);
        A.add(x + nx * ht, y + ny * ht, top, 0, 0, 1, u, 0.21);
        A.add(x - nx * ht, y - ny * ht, top, 0, 0, 1, u, 0);
        A.add(x - nx * ht, y - ny * ht, top, -nx * rr / lr, -ny * rr / lr, inset / lr, -u, H / 2);
        A.add(x - nx * wb, y - ny * wb, zr, -nx * rr / lr, -ny * rr / lr, inset / lr, -u, (zr - zc) / 2); }
      for (let k = 0; k < R.n; k++) { const a = b0 + k * 6, b = a + 6;
        A.i.push(a, a + 1, b, a + 1, b + 1, b, a + 2, a + 3, b + 2, a + 3, b + 3, b + 2, a + 5, b + 5, a + 4, a + 4, b + 5, b + 4); }
      // the ends: a wall-head each
      for (const [k, sg] of [[0, -1], [R.n, 1]]) { const x = R.x[k], y = R.y[k], tx = R.tx[k] * sg, ty = R.ty[k] * sg, nx = -R.ty[k], ny = R.tx[k], zc = R.zc[k], top = zc + H, b = A.v;
        A.add(x + nx * wb, y + ny * wb, R.zl[k] - W.sink, tx, ty, 0, 0, -W.sink / 2); A.add(x + nx * ht, y + ny * ht, top, tx, ty, 0, 0.2, H / 2);
        A.add(x - nx * ht, y - ny * ht, top, tx, ty, 0, 0.4, H / 2); A.add(x - nx * wb, y - ny * wb, R.zr[k] - W.sink, tx, ty, 0, 0.6, -W.sink / 2);
        if (sg < 0) A.i.push(b, b + 3, b + 1, b + 1, b + 3, b + 2); else A.i.push(b, b + 1, b + 3, b + 1, b + 2, b + 3); }
      // the cope: upright stones, tall and short in turn (buck and doe), each its own thickness, lean and tone
      for (let s = R.s0 + 0.03, q = 0; s < R.s1 - 0.06; q++) { const h = hashN(L.ks, ri, q, 51), u = (n) => unit(hashN(h, n));
        const th = 0.07 + u(1) * 0.09, tall = q % 2 === 0, hh = tall ? 0.24 + u(2) * 0.12 : 0.15 + u(2) * 0.08, ww = W.top * (0.9 + u(3) * 0.24), sc = s + th / 2;
        const f = Math.min(R.n - 1e-6, (sc - R.s0) / R.ds), k = Math.floor(f), w = f - k, x = R.x[k] + (R.x[k + 1] - R.x[k]) * w, y = R.y[k] + (R.y[k + 1] - R.y[k]) * w, z = R.zc[k] + (R.zc[k + 1] - R.zc[k]) * w + H - 0.05;
        // (turned end for end at random, never mirrored: a negative scale would turn an instance inside out)
        const t = 0.72 + u(4) * 0.36; copes.push(x, z, -y, Math.atan2(R.ty[k], R.tx[k]) + (u(5) - 0.5) * 0.16 + (u(7) < 0.5 ? 0 : Math.PI), (u(6) - 0.5) * 0.3, th, hh, ww, t, t * (0.97 + u(8) * 0.04), t * (0.9 + u(8) * 0.06));
        s += th + 0.004 + u(9) * 0.025; } });
  }
  function hedgeNear(L, clumps) {
    const hs = HG.height / 1.6;                 // the clumps are sized for a 1.6 m hedge
    L.runs.forEach((R, ri) => { lay.heights(L, R, 1);
      const at = (s) => { const f = Math.min(R.n - 1e-6, Math.max(0, (s - R.s0) / R.ds)), k = Math.floor(f), w = f - k; return [R.x[k] + (R.x[k + 1] - R.x[k]) * w, R.y[k] + (R.y[k + 1] - R.y[k]) * w, R.zc[k] + (R.zc[k + 1] - R.zc[k]) * w, R.tx[k], R.ty[k]]; };
      // the body: big clumps shoulder to shoulder; the crown: smaller ones along the top, so its line is never ruled
      for (const [row, step0, step1] of [[0, 0.55, 0.15], [1, 0.7, 0.4]]) for (let s = R.s0 + 0.15 + row * 0.4, q = 0; s < R.s1 - 0.1; q++) {
        const h = hashN(L.ks, ri, row, q, 61), u = (n) => unit(hashN(h, n)), sx = row ? 1.0 + u(3) * 0.5 : 1.2 + u(3) * 0.45;
        // (kept within the run, so a gateway's posts and leaf stand clear of the hedge)
        const ss = Math.min(R.s1 - 0.42 * sx + 0.25, Math.max(R.s0 + 0.42 * sx - 0.25, s + (u(1) - 0.5) * 0.2)), [x, y, zc, tx, ty] = at(ss), lat = (u(2) - 0.5) * (row ? 0.36 : 0.2);
        const sy = (row ? 0.42 + u(4) * 0.22 : 1.2 + u(4) * 0.2) * hs, sz = row ? 0.95 + u(5) * 0.3 : HG.width * (0.94 + u(5) * 0.12);
        const cz = row ? zc + (1.25 + u(6) * 0.1) * hs : zc + sy / 2 - 0.14, sec = 0.5 + 0.5 * valueNoise(R.s0 + ss, ri * 7.3, 9, L.ks), t = 0.8 + 0.2 * sec + 0.1 * u(7);
        clumps.push(x - ty * lat, cz, -(y + tx * lat), Math.atan2(ty, tx) + (u(8) - 0.5) * 0.9, (u(9) - 0.5) * 0.2, sx, sy, sz, t * (0.94 + 0.1 * u(10)), t, t * (0.84 + 0.1 * u(11)));
        s += step0 + u(12) * step1; } });
  }
  function gateNear(L, copes, wood) {
    const g = L.gate, [A, B] = g.open, zA = site.z(A[0], A[1]), zB = site.z(B[0], B[1]), dx = B[0] - A[0], dy = B[1] - A[1], len = Math.sqrt(dx * dx + dy * dy), yaw = Math.atan2(dy, dx);
    for (const [k, p] of g.posts.entries()) { const z = site.z(p[0], p[1]), u = unit(hashN(L.ks, 70, k));
      if (g.stone) copes.push(p[0], z - 0.4, -p[1], yaw + (u - 0.5) * 0.08 + (u < 0.5 ? 0 : Math.PI), (u - 0.5) * 0.05, G.stoop, G.stoopH + 0.4, G.stoop, 0.78 + u * 0.1, 0.76 + u * 0.1, 0.7 + u * 0.1);
      else { const m = new Float32Array(16); writeTRS(m, 0, p[0], z - 0.35, -p[1], yaw, 0, G.post, G.postH + 0.35, G.post); wood.put(post, m, Math.cos(yaw), Math.sin(yaw)); } }
    // the leaf, shut, hung from the near post, its foot following the ground between them (a shear, not a tilt)
    const m = new Float32Array(16), c = Math.cos(yaw), s = Math.sin(yaw), k = (zB - zA) / len, sx = (len - 0.1) / LEAF, hx = A[0] + dx / len * 0.05, hy = A[1] + dy / len * 0.05;
    m[0] = c * sx; m[1] = k * sx; m[2] = -s * sx; m[5] = 1; m[8] = s; m[10] = c; m[12] = hx; m[13] = zA + 0.07; m[14] = -hy; m[15] = 1;
    wood.put(leaf, m, c, s);
  }
  function instanced(geo, mat, data, stride, cast) {
    const n = data.length / stride, m = new THREE.InstancedMesh(geo, mat, Math.max(n, PAD)), A = m.instanceMatrix.array, col = new Float32Array(Math.max(n, PAD) * 3);
    for (let q = 0, o = 0; q < n; q++, o += stride) { writeTRS(A, q * 16, data[o], data[o + 1], data[o + 2], data[o + 3], data[o + 4], data[o + 5], data[o + 6], data[o + 7]); col[q * 3] = data[o + 8]; col[q * 3 + 1] = data[o + 9]; col[q * 3 + 2] = data[o + 10]; }
    m.count = n; m.instanceColor = new THREE.InstancedBufferAttribute(col, 3); m.castShadow = cast; m.receiveShadow = true; return m;
  }
  function finish(it, meshes, lod) {
    const g = new THREE.Group(); g.name = `hillside ${it.ti},${it.tj} ${lod ? "far" : "near"}`; g.matrixAutoUpdate = false;
    // what culls it: the tile and what its boundaries reach out of it, and the ground's height there
    let zl = Infinity, zh = -Infinity; for (const L of it.lines) for (const R of L.runs) if (R.zc) for (const z of R.zc) if (z === z) { zl = Math.min(zl, z); zh = Math.max(zh, z); }
    if (zl > zh) { zl = 0; zh = 0; }
    const sphere = new THREE.Sphere(new THREE.Vector3((it.x0 + it.x1) / 2, (zl + zh) / 2, -(it.y0 + it.y1) / 2), (it.x1 - it.x0) * 0.71 + 60 + (zh - zl) / 2);
    for (const m of meshes) { if (!m) continue; m.matrixAutoUpdate = false; if (m.isInstancedMesh) m.boundingSphere = sphere; g.add(m); }
    return g;
  }
  function* buildNear(it) {
    const wall = new Arrays(), wood = new Arrays(), copes = [], clumps = [];
    for (const L of it.lines) { if (L.kind === "wall") wallNear(L, wall, copes); else hedgeNear(L, clumps); if (L.gate) gateNear(L, copes, wood); yield; }
    for (const t of it.trees) if (t.z == null) t.z = site.z(t.x, t.y) - 0.15;
    const mesh = (A, mat) => { if (!A.v) return null; const m = new THREE.Mesh(A.geometry(THREE), mat); m.receiveShadow = true; return m; };
    return finish(it, [mesh(wall, M.stone), copes.length ? instanced(copeGeo, M.cope, copes, 11, false) : null, clumps.length ? instanced(clumpGeo, M.hedge, clumps, 11, false) : null, mesh(wood, M.wood)], 0);
  }
  // ---- a tile, far: each boundary a textured strip (a wall's battered section, a hedge's rounded one), every 4th station
  const stoneCol = [1, 1, 1], capCol = [0.62, 0.6, 0.56];
  function* buildFar(it) {
    const A = new Arrays(true);
    for (const L of it.lines) { const wall = L.kind === "wall";
      for (const R of L.runs) { lay.heights(L, R, 4, false); const ks = []; for (let k = 0; k <= R.n; k += 4) ks.push(k); if (ks[ks.length - 1] !== R.n) ks.push(R.n);
        const b0 = A.v, per = wall ? 6 : 5;
        for (const k of ks) { const x = R.x[k], y = R.y[k], nx = -R.ty[k], ny = R.tx[k], zc = R.zc[k], u = (R.s0 + R.ds * k) / 2, j = unit(hashN(L.ks, k, 81));
          if (wall) { const top = zc + W.height + 0.18, lo = zc - 0.9, wb = 0.45, ht = 0.22, t = 0.92 + 0.12 * j;
            A.add(x + nx * wb, y + ny * wb, lo, nx * 0.98, ny * 0.98, 0.2, u, -0.45, stoneCol, 0); A.add(x + nx * ht, y + ny * ht, top, nx * 0.98, ny * 0.98, 0.2, u, (W.height + 0.18) / 2, stoneCol, 0);
            A.add(x + nx * ht, y + ny * ht, top, 0, 0, 1, u, 0.2, capCol.map(c => c * t), 0); A.add(x - nx * ht, y - ny * ht, top, 0, 0, 1, u, 0, capCol.map(c => c * t), 0);
            A.add(x - nx * ht, y - ny * ht, top, -nx * 0.98, -ny * 0.98, 0.2, -u, (W.height + 0.18) / 2, stoneCol, 0); A.add(x - nx * wb, y - ny * wb, lo, -nx * 0.98, -ny * 0.98, 0.2, -u, -0.45, stoneCol, 0); }
          else { const top = zc + HG.height + (j - 0.5) * 0.3, mid = zc + 0.85, lo = zc - 0.9, t = 0.85 + 0.25 * j, c = [t, t, t * 0.95], cm = [t * 0.8, t * 0.8, t * 0.78];
            A.add(x + nx * 0.6, y + ny * 0.6, lo, nx, ny, 0, u, 0, cm, 1); A.add(x + nx * 0.68, y + ny * 0.68, mid, nx * 0.9, ny * 0.9, 0.4, u, 0.45, c, 1);
            A.add(x, y, top, 0, 0, 1, u, 0.9, c, 1); A.add(x - nx * 0.68, y - ny * 0.68, mid, -nx * 0.9, -ny * 0.9, 0.4, u, 1.35, c, 1); A.add(x - nx * 0.6, y - ny * 0.6, lo, -nx, -ny, 0, u, 1.8, cm, 1); } }
        for (let q = 0; q + 1 < ks.length; q++) { const a = b0 + q * per, b = a + per;
          if (wall) A.i.push(a, a + 1, b, a + 1, b + 1, b, a + 2, a + 3, b + 2, a + 3, b + 3, b + 2, a + 5, b + 5, a + 4, a + 4, b + 5, b + 4);
          else for (let f = 0; f < 4; f++) A.i.push(a + f, a + f + 1, b + f, a + f + 1, b + f + 1, b + f); } }
      yield; }
    for (const t of it.trees) if (t.z == null) t.z = site.z(t.x, t.y) - 0.15;
    const m = A.v ? new THREE.Mesh(A.geometry(THREE), M.far) : null; if (m) { m.receiveShadow = false; m.frustumCulled = farTiles === tiles; }
    return finish(it, [m], 1);
  }

  // ---- streaming: the tiles within reach, nearest first, a few ms a frame; kept, and swapped only once built
  const cache = new Map(), shown = new Map(), tally = [{ n: 0, ms: 0, max: 0 }, { n: 0, ms: 0, max: 0 }];
  let last = null, want = [], queue = [], job = null, nearAt = null, treesDirty = true, allTrees = [];
  function around(x, y) { const out = [], R = radius;
    for (let i = Math.floor((x - R) / tile); i <= Math.floor((x + R) / tile); i++) for (let j = Math.floor((y - R) / tile); j <= Math.floor((y + R) / tile); j++) {
      const x0 = i * tile, y0 = j * tile, d = Math.hypot(Math.max(x0 - x, 0, x - x0 - tile), Math.max(y0 - y, 0, y - y0 - tile));
      if (d < R) { const lod = d < nearTile ? 0 : 1; out.push({ ti: i, tj: j, d, lod, id: `${i},${j}`, key: `${i},${j},${lod}` }); } }
    return out.sort((a, b) => a.d - b.d); }
  function dispose(e) { e.group.traverse(o => { if (o.isInstancedMesh) o.dispose(); else if (o.isMesh) o.geometry.dispose(); }); }
  function refreshImpostors() {
    allTrees = []; for (const k of shown.values()) for (const t of cache.get(k).trees) allTrees.push(t);
    const n = Math.min(IMP, allTrees.length), c = aCenter.array, s = aSize.array, kk = aKind.array;
    for (let q = 0; q < n; q++) { const t = allTrees[q]; c[q * 3] = t.x; c[q * 3 + 1] = t.z - 0.02 * t.h; c[q * 3 + 2] = -t.y; s[q * 2] = CELLW * t.h * t.ws; s[q * 2 + 1] = CELLW * t.h; kk[q] = t.k; }
    ig.instanceCount = n; aCenter.needsUpdate = aSize.needsUpdate = aKind.needsUpdate = true;
  }
  function refreshNear(x, y) {
    const counts = [0, 0, 0], r2 = near * near;
    for (const t of allTrees) { const dx = t.x - x, dy = t.y - y; if (dx * dx + dy * dy >= r2 || counts[t.k] >= capacity) continue;
      writeTRS(nearTrees[t.k].instanceMatrix.array, counts[t.k]++ * 16, t.x, t.z, -t.y, t.yaw, 0, t.h * t.ws, t.h, t.h * t.ws); }
    nearTrees.forEach((m, k) => { m.count = counts[k]; m.instanceMatrix.needsUpdate = true; });
  }
  function update(x, y, budget = 4) {
    const t0 = performance.now();
    if (!last || (x - last[0]) ** 2 + (y - last[1]) ** 2 > 64) { last = [x, y]; want = around(x, y); queue = want.filter(t => !cache.has(t.key)); }
    while (performance.now() - t0 < budget) {
      if (!job) { const t = queue.shift(); if (!t) break; if (cache.has(t.key)) continue; const it = lay.tileItems(t.ti, t.tj); job = { t, it, gen: t.lod ? buildFar(it) : buildNear(it), ms: 0 }; }
      const a = performance.now(), r = job.gen.next(); job.ms += performance.now() - a;
      if (r.done) { const T0 = tally[job.t.lod]; T0.n++; T0.ms += job.ms; T0.max = Math.max(T0.max, job.ms); cache.set(job.t.key, { group: r.value, trees: job.it.trees, lod: job.t.lod, ms: job.ms }); job = null; }
    }
    // show each wanted tile at its level, or at the other while that is being built; take away what is out of reach
    let changed = false, farChanged = false; const ids = new Set(), parentOf = (e) => e.lod ? farTiles : tiles;
    const put = (k) => { const e = cache.get(k); parentOf(e).add(e.group); farChanged ||= !!e.lod; }, take = (k) => { const e = cache.get(k); parentOf(e).remove(e.group); farChanged ||= !!e.lod; };
    for (const t of want) { ids.add(t.id); const cur = shown.get(t.id), alt = `${t.id},${1 - t.lod}`, k = cache.has(t.key) ? t.key : cur || (cache.has(alt) ? alt : null);
      if (k && k !== cur) { if (cur) take(cur); put(k); shown.set(t.id, k); changed = true; } }
    for (const [id, k] of shown) if (!ids.has(id)) { take(k); shown.delete(id); changed = true; }
    if (farChanged && farTiles.isBundleGroup) farTiles.needsUpdate = true;
    if (changed) { treesDirty = true;
      // the cache: what lies within twice the reach stays; beyond, the furthest go first past 600 tiles
      if (cache.size > 600) { const keep = new Set(shown.values()); for (const [k, e] of cache) { if (keep.has(k)) continue; const [i, j] = k.split(",").map(Number);
        if (Math.hypot((i + 0.5) * tile - x, (j + 0.5) * tile - y) > radius * 2) { dispose(e); cache.delete(k); } } } }
    if (treesDirty) refreshImpostors();
    if (treesDirty || !nearAt || (x - nearAt[0]) ** 2 + (y - nearAt[1]) ** 2 > 16) { nearAt = [x, y]; refreshNear(x, y); }
    treesDirty = false;
    return changed || queue.length > 0 || !!job;
  }
  const stats = () => { let n0 = 0, n1 = 0; for (const k of shown.values()) cache.get(k).lod ? n1++ : n0++;
    return { shown: shown.size, near: n0, far: n1, cached: cache.size, queued: queue.length + (job ? 1 : 0), built: { near: tally[0].n, far: tally[1].n },
      msPerTile: { near: tally[0].n ? +(tally[0].ms / tally[0].n).toFixed(2) : 0, far: tally[1].n ? +(tally[1].ms / tally[1].n).toFixed(2) : 0 }, maxTileMs: { near: +tally[0].max.toFixed(2), far: +tally[1].max.toFixed(2) },
      trees: ig.instanceCount, nearTrees: nearTrees.reduce((a, m) => a + m.count, 0), cells: lay.cells() }; };
  return { group, update, blocked: lay.blocked, stats, layout: lay, materials: M, impostorAtlas: atlas };
}
