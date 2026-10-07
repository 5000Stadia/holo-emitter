// The kit's textures as pure pixel maths: no DOM, no three.js, no imports, so the same code runs in a
// worker (texworker.js) or on the main thread (texjobs.js). Each generator draws rows y0..y1 of its
// texture as a canvas holds them (row 0 at the top) into RGBA bytes and, where it has a normal map, its
// height field for the same rows; draw() adds the normals and turns the rows over for upload.
//
// Every generator here is procedural.js's own texture code of 2026-10-07, moved and not changed: the
// loops run over a band of rows instead of the whole, and that is all. Its pixels are the same to the
// byte (checked by hashing them against the canvas versions). None uses Math.random or the clock: each
// layout comes from rng(seed), each grain from hash().
//
// A generator: { size(args) -> [w, h], normal: strength or null, oak: needs the oak field (oakN(args): of what
// size), cost: rough microseconds a pixel (for sharing the work out), rows(args, y0, y1, d, H, ctx) }.

// ---------------------------------------------------------------- noise
export function hash(i, j, s) {
  let h = Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ Math.imul(s + 1, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
export const mod = (a, p) => ((a % p) + p) % p;
// value noise, periodic over px x py lattice cells so every texture tiles
export function vnoise(x, y, px, py, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const x0 = mod(xi, px), x1 = mod(xi + 1, px), y0 = mod(yi, py), y1 = mod(yi + 1, py);
  const a = hash(x0, y0, s), b = hash(x1, y0, s), c = hash(x0, y1, s), d = hash(x1, y1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x, y, px, py, oct, s) {
  let sum = 0, amp = 0.5, f = 1, norm = 0;
  for (let o = 0; o < oct; o++) { sum += amp * vnoise(x * f, y * f, px * f, py * f, s + o * 17); norm += amp; amp *= 0.5; f *= 2; }
  return sum / norm;
}
export const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export function rng(seed) { let s = seed >>> 0; return () => { s = Math.imul(s ^ (s >>> 15), 2246822507) + 0x9e3779b9 >>> 0; s ^= s >>> 13; return (s >>> 0) / 4294967296; }; }

// ---------------------------------------------------------------- the oak
// Oak: a 1 m periodic tile, grain running along v. Quarter-sawn English oak: straight close
// latewood lines, silver ray fleck, fine fibre, slow tonal drift.
export function oakField(N) {
  const A = new Float32Array(N * N * 3), H = new Float32Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = x / N, v = y / N;
    const warp = fbm(u * 2, v * 1, 2, 1, 3, 11) - 0.5;
    const t = u * 70 + warp * 6 + (fbm(u * 12, v * 2, 12, 2, 2, 5) - 0.5) * 2.5;
    const ring = t - Math.floor(t);
    const late = smooth(0.6, 0.86, ring) * (1 - smooth(0.9, 1.0, ring));
    const fibre = fbm(u * 300, v * 5, 300, 5, 2, 23);
    // figure: broad light and dark streaks running with the grain, what reads from across a room
    const figure = fbm(u * 7 + warp, v * 0.6, 7, 1, 3, 29);
    const fl = vnoise(u * 50 + warp * 4, v * 12, 50, 12, 31);
    const fleck = smooth(0.8, 0.92, fl) * (0.5 + 0.5 * vnoise(u * 140, v * 36, 140, 36, 37));
    const tone = 0.72 + 0.56 * figure;                       // v2: the broad figure carries the wood; the fine grain whispers
    const k = (0.82 + 0.18 * fibre) * (1 - 0.18 * late) * tone;
    const i = (y * N + x) * 3;
    // dark English oak, aged: warm brown; fleck paler, a touch of gold
    // sRGB fractions: aged dark oak, olive-brown more than red, about (84, 59, 36)
    // (zone-matched: the panelling read 15-50 % bright against the painting; this is 0.84 of the first pass)
    A[i] = 0.277 * k + fleck * 0.03;          // (fleck halved with the quieter grain, or it spots)
    A[i + 1] = 0.195 * k + fleck * 0.023;
    A[i + 2] = 0.118 * k + fleck * 0.012;
    H[y * N + x] = -late * 0.35 + fibre * 0.2 + fleck * 0.15;
  }
  return { A, H, N };
}

// Floor: boards running east-west, 160-240 mm wide, butt-jointed at random lengths; each
// board a different cut of the same oak, darker and more worn than the panelling.
function floorLayout(W, D, periodic) {
  const r = rng(7), rows = []; let y = 0;
  while (y < D) { const bw = 0.16 + r() * 0.08; const joints = []; let x = periodic ? r() * 1.8 : -r() * 2.2;
    while (x < W) { joints.push({ x, off: r() * 7, rot: r(), tone: 0.88 + r() * 0.2, sc: 0.65 + r() * 0.7, ac: 0.12 + r() * 0.16 }); x += 1.3 + r() * 1.9; }
    rows.push({ y0: y, y1: Math.min(D, y + bw), joints }); y += bw; }
  if (periodic) {   // a tile: the rows fill D exactly; each row's boards wrap round the tile's edge, so no joint lines up
    const k = D / rows[rows.length - 1].y1; let acc = 0;
    for (const row of rows) { const bw = (row.y1 - row.y0) * k; row.y0 = acc; row.y1 = acc = acc + bw; }
    rows[rows.length - 1].y1 = D;
  }
  return rows;
}
const sm = (x) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };

// flagstones (the kit's): courses in tile units (tile = 2 m), each cut at random lengths
function flagLayout() {
  const r = rng(51);
  const rows = [0, 0.52, 1.0, 1.46, 2.0].map(v => v / 2);     // course lines in tile units (tile = 2 m)
  const cuts = rows.slice(0, -1).map(() => { const c = [0]; let x = 0.25 + r() * 0.1; while (x < 0.95) { c.push(x); x += 0.28 + r() * 0.12; } if (1 - c[c.length - 1] < 0.2) c.pop(); return c; });   // no sliver where a course wraps
  return { rows, cuts };
}

// ---------------------------------------------------------------- the generators
export const GEN = {
  // the oak tile, along the grain (rotate: across it), and its normals
  oak: { oak: true, oakN: ([N]) => N, cost: 0.11, normal: 1.6, size: ([N]) => [N, N],
    rows([N, rotate = false, tint = [1, 1, 1]], y0, y1, d, Hs, ctx) {
      const { A, H } = ctx.oak(N);
      for (let y = y0; y < y1; y++) for (let x = 0; x < N; x++) {
        const s = rotate ? (x * N + (N - 1 - y)) : (y * N + x);
        const o = ((y - y0) * N + x) * 4;
        d[o] = Math.min(255, A[s * 3] * tint[0] * 255); d[o + 1] = Math.min(255, A[s * 3 + 1] * tint[1] * 255); d[o + 2] = Math.min(255, A[s * 3 + 2] * tint[2] * 255); d[o + 3] = 255;
        Hs[(y - y0) * N + x] = H[s];
      }
    } },
  // the floor: W x D metres at ppm, of the oak tile N (periodic: a tile, every row wrapping)
  floor: { oak: true, oakN: (a) => a[4], cost: 0.46, normal: 2.2, size: ([W, D, ppm]) => [Math.round(W * ppm), Math.round(D * ppm)],
    rows([W, D, ppm, periodic, N0], y0, y1, d, Hs, ctx) {
      const w = Math.round(W * ppm), rows = floorLayout(W, D, periodic), oak = ctx.oak(N0), N = oak.N;
      let ri = 0;
      for (let py = y0; py < y1; py++) {
        const Y = D - (py + 0.5) / ppm;               // texture row 0 = north edge
        ri = rows.findIndex(b => Y >= b.y0 && Y < b.y1);
        const b = rows[Math.max(0, ri)];
        const across = (Y - b.y0) / (b.y1 - b.y0);
        for (let px = 0; px < w; px++) {
          const X = (px + 0.5) / ppm;
          let j = b.joints.length - 1; while (j > 0 && b.joints[j].x > X) j--;
          // in a tile, a board that crosses the edge carries on from the row's last joint
          const wrap = periodic && X < b.joints[0].x, J = wrap ? b.joints[b.joints.length - 1] : b.joints[j];
          const Xg = wrap ? X + W : X;
          // sample the oak tile with the grain along X
          const su = mod(Math.floor((across * J.ac + J.rot) * N), N), sv = mod(Math.floor((Xg + J.off) * N * 0.7 * J.sc), N);
          const s = (sv * N + su) * 3;
          const edge = Math.min(across, 1 - across) * (b.y1 - b.y0), jd = Math.abs(Xg - J.x);
          // each board's edge rounded over 6 mm into the joint, not cut square: a groove one pixel wide and hard broke into
          // dashes when seen low across the floor (Kabe, 2026-10-06, "harsh lines between butt up surfaces")
          const ge = sm(edge / 0.006), gj = sm(jd / 0.006), gap = (0.35 + 0.65 * ge) * (0.4 + 0.6 * gj);
          const wear = 1 + 0.12 * Math.exp(-Math.pow((Y - D * 0.45) / 1.1, 2)) * Math.exp(-Math.pow((X - W * 0.5) / 1.6, 2));
          const drift = 0.94 + 0.12 * fbm((Xg + J.off) * 0.6, across * 0.3 + J.rot * 5, 1000, 1000, 2, 131);   // slow, along the board
          const k = J.tone * drift * gap * wear, o = ((py - y0) * w + px) * 4;
          // the floor is the same oak, worn lighter and waxed: the painting's boards sit well above its panelling
          // ...and greyed by wear and dust: pulled a third of the way toward its own grey
          const fr = oak.A[s] * 1.9 * k, fg = oak.A[s + 1] * 1.85 * k, fb = oak.A[s + 2] * 1.8 * k, fy = 0.3 * fr + 0.55 * fg + 0.15 * fb;
          d[o] = Math.min(255, (fr * 0.64 + fy * 0.36) * 255);
          d[o + 1] = Math.min(255, (fg * 0.64 + fy * 0.36) * 255);
          d[o + 2] = Math.min(255, (fb * 0.64 + fy * 0.36) * 255);
          d[o + 3] = 255;
          Hs[(py - y0) * w + px] = oak.H[sv * N + su] * 0.4 * ge * gj - 1.2 * (1 - ge * gj);
        }
      }
    } },
  // plaster (lime, smoke-aged): a 1 m periodic tile
  plaster: { cost: 0.51, normal: 0.8, size: ([N]) => [N, N],
    rows([N], y0, y1, d, Hs) {
      for (let y = y0; y < y1; y++) for (let x = 0; x < N; x++) {
        const u = x / N, v = y / N;
        const m = fbm(u * 3, v * 3, 3, 3, 4, 3), f = fbm(u * 60, v * 60, 60, 60, 2, 9);
        const k = 0.86 + 0.18 * m + 0.05 * f, o = ((y - y0) * N + x) * 4;
        d[o] = 150 * k; d[o + 1] = 128 * k; d[o + 2] = 98 * k; d[o + 3] = 255;
        Hs[(y - y0) * N + x] = m * 0.6 + f * 0.3;
      }
    } },
  // limestone, tooled and pitted, with lichen-dark blots (or without)
  stone: { cost: 0.76, normal: 1.2, size: ([N]) => [N, N],
    rows([N, base, blots], y0, y1, d, Hs) {
      for (let y = y0; y < y1; y++) for (let x = 0; x < N; x++) {
        const u = x / N, v = y / N;
        const m = fbm(u * 5, v * 5, 5, 5, 4, 51), f = fbm(u * 80, v * 80, 80, 80, 2, 57);
        const pit = smooth(0.9, 0.97, vnoise(u * 90, v * 90, 90, 90, 61));
        const tool = 0.03 * Math.sin((u * 0.7 + v) * 380 + m * 6);
        const blot = blots ? smooth(0.55, 0.8, fbm(u * 9, v * 9, 9, 9, 3, 67)) : 0;      // lichen-dark weathering blots
        const k = (0.78 + 0.38 * m + 0.1 * f + 1.6 * tool) * (1 - 0.22 * pit) * (1 - 0.25 * blot), o = ((y - y0) * N + x) * 4;
        d[o] = base[0] * k; d[o + 1] = base[1] * k; d[o + 2] = base[2] * k; d[o + 3] = 255;
        Hs[(y - y0) * N + x] = m * 0.4 + f * 0.4 - pit;
      }
    } },
  // the kit's flags: a 2 m tile in four courses
  flag: { cost: 0.64, normal: 2, size: ([N]) => [N, N],
    rows([N], y0, y1, d, Hs) {
      const { rows, cuts } = flagLayout();
      for (let y = y0; y < y1; y++) for (let x = 0; x < N; x++) {
        const u = x / N, v = y / N, row = rows.findIndex((a, i) => v >= a && v < rows[i + 1]);
        const cs = cuts[row]; let j = cs.length - 1; while (j > 0 && cs[j] > u) j--;
        const next = j + 1 < cs.length ? cs[j + 1] : 1;
        const eu = Math.min(u - cs[j], next - u), ev = Math.min(v - rows[row], rows[row + 1] - v);
        const joint = eu < 0.004 || ev < 0.004;
        const t = hash(j, row, 53), m = fbm(u * 10, v * 10, 10, 10, 4, 57), f = fbm(u * 90, v * 90, 90, 90, 2, 59);
        const k = joint ? 0.35 : (0.72 + 0.3 * t + 0.25 * m + 0.08 * f) * (1 - 0.3 * smooth(0.6, 0.85, fbm(u * 6, v * 6, 6, 6, 3, 61)));
        const o = ((y - y0) * N + x) * 4;
        d[o] = 118 * k; d[o + 1] = 110 * k; d[o + 2] = 96 * k; d[o + 3] = 255;
        Hs[(y - y0) * N + x] = joint ? -1 : m * 0.3 + f * 0.3;
      }
    } },
  // brick: a 1 m tile, 4 bricks of 0.25 m per course (incl. joint), 13 courses of ~0.077 m
  brick: { cost: 0.45, normal: 2.5, size: ([N]) => [N, N],
    rows([N], y0, y1, d, Hs) {
      const cw = 0.25, ch = 1 / 13;
      for (let y = y0; y < y1; y++) for (let x = 0; x < N; x++) {
        const u = x / N, v = y / N, row = Math.floor(v / ch), off = (row % 2) * cw / 2;
        const bu = mod(u + off, 1), col = Math.floor(bu / cw);
        const lu = (bu - col * cw) / cw, lv = (v - row * ch) / ch;
        const joint = lu < 0.04 || lv < 0.1;
        const t = hash(col, row, 71), m = fbm(u * 20, v * 20, 20, 20, 3, 73);
        const soot = (0.55 + 0.45 * fbm(u * 2, v * 2, 2, 2, 3, 79)) * (0.7 + 0.3 * v);
        const o = ((y - y0) * N + x) * 4;
        if (joint) { d[o] = 72 * soot; d[o + 1] = 64 * soot; d[o + 2] = 56 * soot; }
        else { const k = (0.6 + 0.45 * t + 0.25 * m) * soot; d[o] = 104 * k; d[o + 1] = 56 * k; d[o + 2] = 40 * k; }
        d[o + 3] = 255; Hs[(y - y0) * N + x] = joint ? -1 : m * 0.4;
      }
    } },
  // carved frieze: a running vine with leaves between two fillets, as a height field on oak (len x ht metres at ppm)
  carved: { oak: true, oakN: (a) => a[3], cost: 0.6, normal: 3, size: ([len, ht, ppm]) => [Math.round(len * ppm), Math.round(ht * ppm)],
    rows([len, ht, ppm, N0], y0, y1, d, Hs, ctx) {
      const w = Math.round(len * ppm), h = Math.round(ht * ppm), oak = ctx.oak(N0), N = oak.N, rep = 0.26;
      for (let y = y0; y < y1; y++) for (let x = 0; x < w; x++) {
        const X = x / ppm, Y = 1 - y / h;           // Y 0..1 bottom to top
        const ph = (X / rep) * Math.PI * 2;
        const vine = 0.5 + 0.22 * Math.sin(ph);
        const dv = Math.abs(Y - vine);
        let hgt = Math.exp(-Math.pow(dv / 0.06, 2));
        // leaves: an ellipse off each crest and trough
        for (const k of [0.25, 0.75]) {
          const cx = (Math.floor(X / rep) + k) * rep, cy = k < 0.5 ? 0.78 : 0.22;
          const ex = (X - cx) / (rep * 0.2), ey = (Y - cy) / 0.14;
          hgt = Math.max(hgt, (1 - Math.min(1, ex * ex + ey * ey)) * (0.8 + 0.2 * Math.cos(ex * 6)));
        }
        const border = (Y < 0.08 || Y > 0.92) ? 1 : 0, i = (y - y0) * w + x;
        Hs[i] = Math.max(hgt, border) * 0.9 + 0.1 * fbm(X * 40, Y * 10, 400, 10, 2, 91);
        // (the map reads the height as stored: a float32, as the canvas version's Float32Array held it)
        const s = ((y % N) * N + (x % N)) * 3, k = 0.72 + 0.4 * Hs[i], o = i * 4;
        d[o] = oak.A[s] * k * 255; d[o + 1] = oak.A[s + 1] * k * 255; d[o + 2] = oak.A[s + 2] * k * 255; d[o + 3] = 255;
      }
    } },
  // what lies beyond the south windows: sky, a far line of trees, a lawn, soft and low in detail
  outside: { cost: 0.23, normal: null, size: () => [1024, 512],
    rows(_, y0, y1, d) {
      const w = 1024, h = 512;
      for (let y = y0; y < y1; y++) for (let x = 0; x < w; x++) {
        const u = x / w, v = y / h, o = ((y - y0) * w + x) * 4;
        const ridge = 0.5 + 0.07 * (fbm(u * 6, 0.5, 6, 1, 4, 301) - 0.5) * 4;       // the tree line's top edge
        let r, g2, b;
        if (v < ridge) { const k = v / ridge; r = 200 - 40 * k; g2 = 214 - 30 * k; b = 226 - 34 * k; }     // sky, hazed toward the horizon
        else if (v < 0.66) { const m = fbm(u * 30, v * 20, 30, 20, 3, 303); r = 40 + 26 * m; g2 = 54 + 30 * m; b = 42 + 18 * m; }  // trees: the one value break that must read
        else { const m = fbm(u * 12, v * 24, 12, 24, 3, 307); r = 82 + 26 * m; g2 = 100 + 26 * m; b = 62 + 16 * m; }             // lawn
        const haze = 0.18; d[o] = r * (1 - haze) + 214 * haze; d[o + 1] = g2 * (1 - haze) + 222 * haze; d[o + 2] = b * (1 - haze) + 226 * haze; d[o + 3] = 255;
      }
    } },
};

// ---------------------------------------------------------------- drawing a band of rows
// rows y0..y1 of a normal map from heights Hs held for rows y0-1..y1 (each wrapped): procedural.js's
// normalFrom, the same arithmetic on the same float32 heights
function normalRows(Hs, w, y0, y1, strength, d) {
  for (let y = y0; y < y1; y++) for (let x = 0; x < w; x++) {
    const r0 = (y - y0 + 1) * w;
    const l = Hs[r0 + mod(x - 1, w)], r = Hs[r0 + mod(x + 1, w)];
    const u = Hs[(y - y0) * w + x], dn = Hs[(y - y0 + 2) * w + x];
    let nx = (l - r) * strength, ny = (dn - u) * strength, nz = 1;
    const n = Math.hypot(nx, ny, nz); nx /= n; ny /= n; nz /= n;
    const i = ((y - y0) * w + x) * 4;
    d[i] = (nx * 0.5 + 0.5) * 255; d[i + 1] = (ny * 0.5 + 0.5) * 255; d[i + 2] = nz * 255; d[i + 3] = 255;
  }
}
// a band's rows, last first: a canvas texture is turned over as it is uploaded (flipY), a data texture is
// not, so its rows go up in the order the GPU reads them and the two land in the same texels
function turnOver(d, w, n) {
  const row = w * 4, tmp = new Uint8ClampedArray(row);
  for (let a = 0, b = n - 1; a < b; a++, b--) {
    tmp.set(d.subarray(a * row, a * row + row)); d.copyWithin(a * row, b * row, b * row + row); d.set(tmp, b * row);
  }
}
// rows y0..y1 of generator G's texture (and its normal map), ready for upload: { w, h, map, normal }
export function draw(G, args, y0, y1, ctx) {
  const [w, h] = G.size(args), n = y1 - y0;
  const map = new Uint8ClampedArray(n * w * 4);
  let normal = null;
  if (G.normal == null) G.rows(args, y0, y1, map, null, ctx);
  else {
    const Hs = new Float32Array((n + 2) * w);
    G.rows(args, y0, y1, map, Hs.subarray(w, (n + 1) * w), ctx);
    // the rows either side, for the normals at the band's edges (wrapping, as normalFrom does)
    const halo = (row, at) => {
      if (row >= y0 && row < y1) Hs.copyWithin(at * w, (row - y0 + 1) * w, (row - y0 + 2) * w);
      else G.rows(args, row, row + 1, new Uint8ClampedArray(w * 4), Hs.subarray(at * w, (at + 1) * w), ctx);
    };
    halo(mod(y0 - 1, h), 0); halo(y1 % h, n + 1);
    normal = new Uint8ClampedArray(n * w * 4);
    normalRows(Hs, w, y0, y1, G.normal, normal);
    turnOver(normal, w, n);
  }
  turnOver(map, w, n);
  return { w, h, map, normal };
}
// how many bands a texture is drawn in (fixed by its size and cost, never by the machine, so a cached band
// is found again on any): about a quarter second of work a band, at most four
export function bandsOf(G, w, h) { return Math.max(1, Math.min(4, Math.round(w * h * G.cost / 250000))); }
export function bandRows(h, k, n) { return [Math.round(h * k / n), Math.round(h * (k + 1) / n)]; }
// what a worker (or the main thread) keeps between jobs: the oak field, drawn once (or handed over by a worker that drew it)
export function makeCtx() {
  const oaks = new Map();
  return { oak: (N = 1024) => { if (!oaks.has(N)) oaks.set(N, oakField(N)); return oaks.get(N); }, has: (N) => oaks.has(N), put: (N, field) => oaks.set(N, field) };
}
// for the kit's texture jobs (texjobs.js): where a worker finds these generators
export const LIB = { url: import.meta.url, GEN };
