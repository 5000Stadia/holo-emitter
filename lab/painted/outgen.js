// The outdoor textures (the London street, the ground, the hillside) drawn off the main thread: the generators that were
// canvas code in src/make/street.js, terrain-mesh.js and hillside.js, moved here unchanged in what they draw and made pure
// functions of their arguments, so the kit's worker pool (lab/painted/texjobs.js, texworker.js) draws them and its IndexedDB
// cache keeps them, as it does the manor's. Each generator, { size, normal, whole, paint(args, ctx) -> { map, normal } }, draws
// its whole texture (a stroke or a blob can land anywhere, so no bands: whole) into RGBA bytes as a canvas holds them (row 0 at
// the top; texgen.js's draw() turns the rows over for upload). `normal` here is whatever second image the texture has: a
// normal map (the tiles', the pebbles') or the rubble's bump map; the texture's own recipe says which.
//
// Canvas 2D is used where the drawing was strokes, ellipses, gradients and text-free emblems (plaster's dirt, oak's checks,
// the sign atlas, the grass and gravel, every hillside texture): on an OffscreenCanvas (a worker has no DOM), a plain canvas
// only where there is none. Pixel maths elsewhere. None uses Math.random or the clock: each from a seeded stream.
// Imports only the pure hashing modules; they are listed in DEPS so that a change to either draws everything again.
import { hashN, unit } from "../../src/make/noise.js";
import { rng, seedOf } from "../../src/make/id.js";

export const DEPS = [new URL("../../src/make/noise.js", import.meta.url).href, new URL("../../src/make/id.js", import.meta.url).href];

// ---------------------------------------------------------------- canvas and pixels
// Which canvas: the context's defaults (SOFTWARE false), which a worker draws on the GPU, as the page's own canvases were: the
// pixels are the same to the byte as theirs (checked 2026-10-07: 11 textures hashed against the old canvases), and the street's
// screenshots are identical. Or willReadFrequently (SOFTWARE true): drawn in software, which differs from the GPU's anti-aliasing
// by up to 9/255 at the edges of strokes and ellipses (~5 % of a street screenshot's pixels, max 14/255 there), but which is the
// same on every run: on the GPU, workers drawing at once (the GPU process is shared) now and then differ by a pixel or two
// (hill.leaves: 8-16 bytes of 262144, max 9, in 4 of 24 runs with the machine loaded), and what a cache keeps is then whichever
// drawing came first. (Timing: on a quiet machine the two start alike; with other jobs on the GPU the GPU variant's first canvas
// in a worker waited longer in some runs, and the loaded-machine timings were too noisy to say more.)
// Flipping it changes this file's hash, so the cache draws everything again.
const SOFTWARE = false;
const canvas = (w, h) => typeof OffscreenCanvas === "function" ? new OffscreenCanvas(w, h) : Object.assign(document.createElement("canvas"), { width: w, height: h });
const context = (c) => c.getContext("2d", SOFTWARE ? { willReadFrequently: true } : undefined);
// RGBA bytes from fn(x, y) -> [r, g, b] (rounded and clamped as an ImageData's are)
const pixels = (N, M, fn) => { const d = new Uint8ClampedArray(N * M * 4);
  for (let y = 0; y < M; y++) for (let x = 0; x < N; x++) { const o = (y * N + x) * 4, [r, gg, b] = fn(x, y); d[o] = r; d[o + 1] = gg; d[o + 2] = b; d[o + 3] = 255; } return d; };
// pixels d put on a canvas, drawn on by paint(g), and read back
const over = (w, h, d, paint) => { const c = canvas(w, h), g = context(c); g.putImageData(new ImageData(d, w, h), 0, 0); paint(g); return g.getImageData(0, 0, w, h).data; };
// the first canvas a worker draws on waits for the page's main thread (to hand it a GPU context): as long as the main thread is
// busy. texjobs.warmTextures(timeout, [LIB]) has each worker do that on a 1 by 1 canvas as soon as it is up, while the main thread
// is free, so no job waits
export function warm() { if (SOFTWARE) return; try { const g = context(canvas(1, 1)); g.putImageData(new ImageData(1, 1), 0, 0); g.getImageData(0, 0, 1, 1); } catch (_) {} }
// a canvas drawn on from blank by paint(g)
const drawn = (w, h, paint) => { const c = canvas(w, h), g = context(c); paint(g); return g.getImageData(0, 0, w, h).data; };
// a normal map from heights (wrapping): canvas y runs down, the texture's v up
const normals = (h, N, M, k) => pixels(N, M, (x, y) => { const at = (i, j) => h[((j + M) % M) * N + ((i + N) % N)], gx = (at(x + 1, y) - at(x - 1, y)) * k, gy = (at(x, y + 1) - at(x, y - 1)) * k, l = Math.sqrt(gx * gx + gy * gy + 1);
  return [(-gx / l * 0.5 + 0.5) * 255, (gy / l * 0.5 + 0.5) * 255, (1 / l * 0.5 + 0.5) * 255]; });
// a seeded stream of numbers in [0, 1) by name (the street's)
const stream = (name) => { let s = 0x811c9dc5; for (let i = 0; i < name.length; i++) s = Math.imul(s ^ name.charCodeAt(i), 0x01000193) >>> 0; let i = 0; return () => unit(hashN(s, i++)); };
// periodic value noise for textures: lattice values precomputed, so a 512-square octave costs a few ms; in [0, 1)
function noiseTex(N, M, periods, seed, weights) {
  const out = new Float32Array(N * M); let wsum = 0;
  periods.forEach(([px, py], o) => { const w = weights ? weights[o] : 1 / (o + 1); wsum += w; const g = new Float32Array(px * py);
    for (let j = 0; j < py; j++) for (let i = 0; i < px; i++) g[j * px + i] = unit(hashN(i, j, seed, o));
    for (let y = 0; y < M; y++) { const fy = y / M * py, j = Math.floor(fy), ty = fy - j, sy = ty * ty * (3 - 2 * ty), j1 = (j + 1) % py;
      for (let x = 0; x < N; x++) { const fx = x / N * px, i = Math.floor(fx), tx = fx - i, sx = tx * tx * (3 - 2 * tx), i1 = (i + 1) % px;
        const a = g[j * px + i], b = g[j * px + i1], c = g[j1 * px + i], d = g[j1 * px + i1]; out[y * N + x] += w * (a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy); } } });
  for (let k = 0; k < out.length; k++) out[k] /= wsum; return out;
}

// ---------------------------------------------------------------- the street (src/make/street.js)
// limewash (the texture covers 4 m, 2 before 2026-10-07: a wall seen along the street showed its own dirt marks every 2 m): coats laid by brush, thicker and thinner, a little dirt in its hollows
function plaster([N]) {
  const n = noiseTex(N, N, [[8, 8], [18, 18], [48, 48], [128, 128]], 11, [1, 0.8, 0.5, 0.35]), r = stream("street/plaster");
  const d = pixels(N, N, (x, y) => { const v = 0.9 + (n[y * N + x] - 0.5) * 0.2 + (r() - 0.5) * 0.025; return [246 * v, 241 * v, 230 * v]; });
  return { map: over(N, N, d, (g) => { g.lineCap = "round";
    for (let i = 0; i < 104; i++) { let x = r() * N, y = r() * N; g.strokeStyle = `rgba(80,70,55,${0.16 + r() * 0.16})`; g.lineWidth = 0.7 + r() * 0.6; g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 26; y += (r() - 0.3) * 22; g.lineTo(x, y); } g.stroke(); } }) };
}
// weathered oak (2 m along the grain by 0.5 m across): silver-grey, the grain opened by weather, checks and knots
function oak([N, M]) {
  const n = noiseTex(N, M, [[2, 48], [4, 96], [8, 24]], 21, [1, 0.6, 0.4]), r = stream("street/oak");
  const d = pixels(N, M, (x, y) => { const k = n[y * N + x], line = Math.sin(y * 0.9 + k * 18) * 0.5 + 0.5, v = 0.78 + k * 0.3 - line * line * 0.12 + (r() - 0.5) * 0.04; return [168 * v, 160 * v, 148 * v]; });
  return { map: over(N, M, d, (g) => {
    for (let i = 0; i < 70; i++) { const x = r() * N, y = r() * M, l = 20 + r() * 110; g.strokeStyle = `rgba(40,34,28,${0.35 + r() * 0.35})`; g.lineWidth = 0.8 + r() * 1.3; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l / 2, y + (r() - 0.5) * 4, x + l, y + (r() - 0.5) * 3); g.stroke(); }
    for (let i = 0; i < 5; i++) { const x = r() * N, y = r() * M; g.fillStyle = "rgba(60,48,36,0.55)"; g.beginPath(); g.ellipse(x, y, 5 + r() * 6, 3 + r() * 3, 0, 0, 7); g.fill(); g.strokeStyle = "rgba(50,40,30,0.3)"; g.lineWidth = 1.5; g.beginPath(); g.ellipse(x, y, 11 + r() * 6, 5 + r() * 3, 0, 0, 7); g.stroke(); } }) };
}
// leaded quarries (0.42 m by 0.6 m): diamond panes of old crown glass, green-grey, each catching the sky its own way
function glass([N]) {
  return { map: pixels(N, N, (x, y) => { const p = (x + y) / 64, q = (x - y + 256) / 64, ip = Math.floor(p), iq = Math.floor(q), fp = p - ip, fq = q - iq, e = Math.min(fp, 1 - fp, fq, 1 - fq) * 45;
    if (e < 2.2) return [38, 38, 36];
    const h = unit(hashN(ip & 3, iq & 3, 5)), sky = Math.max(0, 1 - (fq + (1 - fp)) * 0.8) * (0.4 + 0.6 * h), v = 0.7 + 0.3 * h, gl = Math.min(1, (e - 2.2) / 3);
    return [(78 + 110 * sky) * v * gl + 52 * (1 - gl), (92 + 112 * sky) * v * gl + 52 * (1 - gl), (86 + 116 * sky) * v * gl + 50 * (1 - gl)]; }) };
}
// clay plain tiles (4 m square, 2 before 2026-10-07): courses of 0.1 m gauge, tiles 1/6 m wide, half-lapped; burnt and pale ones, moss,
// the shadow of each course on the next; and a normal map from the same heights
function tile([N]) {
  const CH = N / 40, TW = N / 24, n = noiseTex(N, N, [[32, 32], [128, 128]], 31, [1, 0.5]), H = new Float32Array(N * N), TH = Float32Array.from({ length: 40 * 24 }, (_, i) => unit(hashN(i / 24 | 0, i % 24, 7))), TH2 = Float32Array.from({ length: 40 * 24 }, (_, i) => unit(hashN(i / 24 | 0, i % 24, 8)));
  const map = pixels(N, N, (x, y) => { const row = Math.floor(y / CH), fy = y / CH - row, off = (row & 1) * TW / 2, col = Math.floor(((x + off) % N) / TW), fx = ((x + off) % N) / TW - col;
    const hi = row * 24 + col % 24, h = TH[hi], h2 = TH2[hi], gap = fx < 0.035 || fx > 0.965, lip = fy > 0.9;
    H[y * N + x] = gap ? 0 : (0.25 + 0.75 * fy) * (lip ? 1 - (fy - 0.9) * 6 : 1);
    let R = 96 + h * 30, G = 58 + h * 16, B = 45 + h * 10; if (h2 < 0.2) { R *= 0.72; G *= 0.72; B *= 0.74; } else if (h2 > 0.88) { R *= 1.1; G *= 1.1; B *= 1.08; }
    const moss = Math.max(0, n[y * N + x] - 0.6) * 2.4; R = R * (1 - moss) + 96 * moss; G = G * (1 - moss) + 98 * moss; B = B * (1 - moss) + 72 * moss;
    const sh = (gap ? 0.6 : 1) * (fy < 0.18 ? 0.7 + fy * 1.65 : 1) * (0.9 + n[y * N + x] * 0.18); return [R * sh, G * sh, B * sh]; });
  return { map, normal: normals(H, N, N, 2.2) };
}
// brick (4 m square, 1 before 2026-10-07: the bond came round every metre; and its header courses' perpends lay over the stretchers' so joints ran up through three or four courses, now a quarter brick over): English bond, red-brown stocks with some burnt headers, lime mortar
function brick([N]) {
  const CH = N / 56, n = noiseTex(N, N, [[32, 32], [128, 128]], 41), BH = Float32Array.from({ length: 56 * 32 }, (_, i) => unit(hashN(i / 32 | 0, i % 32, 9)));
  return { map: pixels(N, N, (x, y) => { const row = Math.floor(y / CH), fy = y / CH - row, hdr = row & 1, bw = hdr ? N / 32 : N / 16, off = hdr ? bw / 2 : (row & 2 ? bw / 2 : 0), col = Math.floor(((x + off) % N) / bw), fx = ((x + off) % N) / bw - col;
    if (fy < 0.14 || fx < (hdr ? 0.07 : 0.035)) return [150, 141, 124].map(v => v * (0.85 + n[y * N + x] * 0.15));
    const h = BH[row * 32 + col], burnt = hdr && h < 0.25, v = 0.82 + n[y * N + x] * 0.22; return burnt ? [104 * v, 70 * v, 58 * v] : [(128 + h * 26) * v, (74 + h * 16) * v, (58 + h * 10) * v]; }) };
}
// the street's pebbles (3.2 m square, 1.6 before 2026-10-07): rounded river pebbles 80-150 mm set in sand and dirt, and their heights
function pebbles([N]) {
  const G = 32, cs = N / G, r = stream("street/pebbles"), P = [];
  for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) { const a = r() * Math.PI, e = 0.72 + r() * 0.28, t = r();
    P.push({ x: (i + 0.2 + r() * 0.6) * cs, y: (j + 0.2 + r() * 0.6) * cs, rad: cs * (0.5 + r() * 0.2), ca: Math.cos(a), sa: Math.sin(a), e,
      col: t < 0.18 ? [92, 94, 98] : t < 0.45 ? [150, 140, 122] : t < 0.7 ? [128, 116, 98] : t < 0.85 ? [170, 160, 140] : [120, 98, 72] }); }
  const n = noiseTex(N, N, [[64, 64], [256, 256]], 51), H = new Float32Array(N * N);
  const map = pixels(N, N, (x, y) => { const ci = Math.floor(x / cs), cj = Math.floor(y / cs); let best = null, bd = 9;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { let ii = ci + di, jj = cj + dj; ii = ii < 0 ? ii + G : ii >= G ? ii - G : ii; jj = jj < 0 ? jj + G : jj >= G ? jj - G : jj; const p = P[jj * G + ii];
      let dx = x - p.x, dy = y - p.y; dx = dx > N / 2 ? dx - N : dx < -N / 2 ? dx + N : dx; dy = dy > N / 2 ? dy - N : dy < -N / 2 ? dy + N : dy;
      const u = (dx * p.ca + dy * p.sa) / p.rad, v = (-dx * p.sa + dy * p.ca) / (p.rad * p.e), d = u * u + v * v; if (d < bd) { bd = d; best = p; } }
    const k = n[y * N + x];
    if (bd >= 1) { H[y * N + x] = 0.1 * k; return [92 + 30 * k, 80 + 26 * k, 62 + 20 * k]; }
    const dome = Math.sqrt(1 - bd); H[y * N + x] = 0.25 + 0.75 * dome; const v = (0.62 + 0.38 * dome) * (0.9 + 0.2 * k);
    return [best.col[0] * v, best.col[1] * v, best.col[2] * v]; });
  return { map, normal: normals(H, N, N, 3.0) };
}

// ---- the signs: 16 boards in a 4 by 4 atlas (§B4: "carving and gilding"; the emblems are the common London signs:
// the Bell, the Swan, the Cross Keys, the Crown, the Star, the Sun, the Half Moon, the Three Tuns, the Anchor, the Rose,
// the Cock, the Ship, the Golden Ball, the Mitre, the Bible, the Wheatsheaf; colours chosen)
export const EMBLEMS = ["bell", "swan", "keys", "crown", "star", "sun", "moon", "tuns", "anchor", "rose", "cock", "ship", "ball", "mitre", "book", "sheaf"];
const SIGN_STYLE = { bell: ["#1c1a18", "gold"], swan: ["#1f3554", "#efe9dc"], keys: ["#6e211c", "gold"], crown: ["#21402c", "gold"], star: ["#1f3554", "gold"], sun: ["#1c1a18", "gold"],
  moon: ["#22385a", "#e8e4da"], tuns: ["#d8c8a0", "#6b4a2c"], anchor: ["#21402c", "gold"], rose: ["#d8c8a0", "#a3262a"], cock: ["#6e211c", "#efe9dc"], ship: ["#2a4566", "#efe9dc"],
  ball: ["#1c1a18", "gold"], mitre: ["#6e211c", "#efe9dc"], book: ["#21402c", "#efe9dc"], sheaf: ["#1c1a18", "gold"] };
function signAtlas(g) {
  const r = stream("street/signs"), C = 256;
  EMBLEMS.forEach((name, e) => { const [ground, ink] = SIGN_STYLE[name]; g.save(); g.translate((e % 4) * C, Math.floor(e / 4) * C);
    g.fillStyle = "#2a2018"; g.fillRect(0, 0, C, C);
    const gold = () => { const gr = g.createLinearGradient(0, -1, 0, 1); gr.addColorStop(0, "#f4d986"); gr.addColorStop(0.45, "#cfa040"); gr.addColorStop(1, "#86601e"); return gr; };
    g.fillStyle = ink === "gold" ? "#b48c2c" : "#c9b994"; g.fillRect(9, 9, C - 18, C - 18); g.fillStyle = "rgba(0,0,0,0.35)"; g.fillRect(9, C - 15, C - 18, 6); g.fillRect(C - 15, 9, 6, C - 18);
    g.fillStyle = ground; g.fillRect(17, 17, C - 34, C - 34);
    g.save(); g.translate(C / 2, C / 2 + 4); g.scale(C * 0.37, C * 0.37); g.lineJoin = g.lineCap = "round";
    emblem(g, name, ink === "gold" ? gold() : ink, ground); g.restore();
    for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(${r() < 0.5 ? "0,0,0" : "255,248,230"},${0.03 + r() * 0.06})`; g.fillRect(r() * C, r() * C, 2 + r() * 12, 1 + r() * 4); }
    g.restore(); });
}
function emblem(g, name, ink, ground) {
  const P = (pts, close = true) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); if (close) g.closePath(); };
  const O = (x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); }, E = (x, y, rx, ry, a = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, a, 0, Math.PI * 2); };
  const fill = (c = ink) => { g.fillStyle = c; g.fill(); }, line = (w, c = ink) => { g.lineWidth = w; g.strokeStyle = c; g.stroke(); };
  const dark = "rgba(24,18,12,0.6)", white = "#efe9dc", red = "#a8302a", yellow = "#d9a83a";
  switch (name) {
    case "bell": g.beginPath(); g.moveTo(-0.62, 0.55); g.bezierCurveTo(-0.48, 0.4, -0.42, 0.22, -0.4, -0.1); g.bezierCurveTo(-0.38, -0.56, -0.2, -0.68, 0, -0.68); g.bezierCurveTo(0.2, -0.68, 0.38, -0.56, 0.4, -0.1);
      g.bezierCurveTo(0.42, 0.22, 0.48, 0.4, 0.62, 0.55); g.closePath(); fill(); P([[-0.66, 0.52], [0.66, 0.52], [0.66, 0.62], [-0.66, 0.62]]); fill(); P([[-0.09, -0.86], [0.09, -0.86], [0.09, -0.66], [-0.09, -0.66]]); fill();
      O(0, 0.76, 0.11); fill(); g.beginPath(); g.moveTo(-0.39, 0.04); g.quadraticCurveTo(0, -0.04, 0.39, 0.04); line(0.04, dark); break;
    case "swan": for (const y of [0.56, 0.7]) { g.beginPath(); for (let x = -0.8; x <= 0.8; x += 0.1) g.lineTo(x, y + Math.sin(x * 14) * 0.025); line(0.035, "#8fb0c8"); }
      E(0.1, 0.24, 0.55, 0.22); fill(); P([[0.58, 0.2], [0.8, -0.02], [0.62, 0.34]]); fill(); g.beginPath(); g.moveTo(-0.15, 0.16); g.quadraticCurveTo(0.2, -0.2, 0.5, -0.1); g.quadraticCurveTo(0.35, 0.12, -0.15, 0.16); fill(); line(0.02, dark);
      g.beginPath(); g.moveTo(-0.3, 0.16); g.bezierCurveTo(-0.6, -0.08, -0.12, -0.36, -0.36, -0.6); line(0.13); E(-0.42, -0.62, 0.13, 0.085); fill(); P([[-0.52, -0.66], [-0.72, -0.58], [-0.52, -0.56]]); fill("#d9772e"); O(-0.43, -0.65, 0.025); fill("#111"); break;
    case "keys": for (const [a, m] of [[-Math.PI / 4, 1], [-3 * Math.PI / 4, -1]]) { g.save(); g.rotate(a); g.scale(1, m);
        O(-0.62, 0, 0.2); fill(); O(-0.62, 0, 0.1); fill(ground); P([[-0.44, -0.05], [0.62, -0.05], [0.62, 0.05], [-0.44, 0.05]]); fill(); P([[0.36, 0.05], [0.6, 0.05], [0.6, 0.32], [0.36, 0.32]]); fill(); P([[0.45, 0.14], [0.51, 0.14], [0.51, 0.32], [0.45, 0.32]]); fill(ground); g.restore(); } break;
    case "crown": P([[-0.62, 0.25], [-0.68, -0.3], [-0.46, -0.02], [-0.31, -0.46], [-0.16, -0.02], [0, -0.62], [0.16, -0.02], [0.31, -0.46], [0.46, -0.02], [0.68, -0.3], [0.62, 0.25]]); fill();
      P([[-0.66, 0.22], [0.66, 0.22], [0.66, 0.5], [-0.66, 0.5]]); fill(); for (const [x, y] of [[-0.68, -0.3], [-0.31, -0.46], [0, -0.62], [0.31, -0.46], [0.68, -0.3]]) { O(x, y - 0.06, 0.075); fill(); }
      P([[-0.03, -0.92], [0.03, -0.92], [0.03, -0.7], [-0.03, -0.7]]); fill(); P([[-0.1, -0.85], [0.1, -0.85], [0.1, -0.79], [-0.1, -0.79]]); fill();
      for (const [x, c] of [[-0.38, red], [0, "#2c5a8a"], [0.38, red]]) { E(x, 0.36, 0.08, 0.06); fill(c); } break;
    case "star": P(Array.from({ length: 16 }, (_, i) => { const a = i * Math.PI / 8 - Math.PI / 2, r = i & 1 ? 0.3 : 0.8; return [Math.cos(a) * r, Math.sin(a) * r]; })); fill(); line(0.02, dark); break;
    case "sun": for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, r = i & 1 ? 0.68 : 0.86, w = 0.13; P([[Math.cos(a - w) * 0.4, Math.sin(a - w) * 0.4], [Math.cos(a) * r, Math.sin(a) * r], [Math.cos(a + w) * 0.4, Math.sin(a + w) * 0.4]]); fill(); }
      O(0, 0, 0.42); fill(); for (const x of [-0.14, 0.14]) { O(x, -0.08, 0.04); fill(dark); } g.beginPath(); g.arc(0, 0.06, 0.18, 0.4, Math.PI - 0.4); line(0.035, dark); break;
    case "moon": O(0, 0, 0.62); fill(); O(0.28, -0.12, 0.54); fill(ground);
      for (const [x, y] of [[0.5, 0.45], [0.62, -0.55], [0.15, 0.62]]) { P(Array.from({ length: 10 }, (_, i) => { const a = i * Math.PI / 5 - Math.PI / 2, r = i & 1 ? 0.03 : 0.08; return [x + Math.cos(a) * r, y + Math.sin(a) * r]; })); fill(yellow); } break;
    case "tuns": for (const [x, y] of [[-0.36, -0.32], [0.36, -0.32], [0, 0.34]]) { g.save(); g.translate(x, y); g.scale(0.95, 0.95);
        g.beginPath(); g.moveTo(-0.32, -0.17); g.quadraticCurveTo(0, -0.27, 0.32, -0.17); g.lineTo(0.32, 0.17); g.quadraticCurveTo(0, 0.27, -0.32, 0.17); g.closePath(); fill();
        E(0.32, 0, 0.07, 0.17); fill("#4a3018"); for (const hx of [-0.22, -0.1, 0.1, 0.22]) { g.beginPath(); g.moveTo(hx, -0.24 + Math.abs(hx) * 0.3); g.lineTo(hx, 0.24 - Math.abs(hx) * 0.3); line(0.03, "#2e1e10"); } g.restore(); } break;
    case "anchor": O(0, -0.72, 0.11); line(0.06); P([[-0.38, -0.58], [0.38, -0.58], [0.38, -0.5], [-0.38, -0.5]]); fill(); for (const x of [-0.4, 0.4]) { O(x, -0.54, 0.06); fill(); }
      P([[-0.055, -0.62], [0.055, -0.62], [0.055, 0.6], [-0.055, 0.6]]); fill(); g.beginPath(); g.arc(0, 0.02, 0.58, 0.35, Math.PI - 0.35); line(0.1);
      for (const s of [-1, 1]) { const a = s > 0 ? 0.35 : Math.PI - 0.35, x = Math.cos(a) * 0.58, y = 0.02 + Math.sin(a) * 0.58; P([[x - 0.12 * s, y + 0.05], [x + 0.12 * s, y - 0.22], [x + 0.1 * s, y + 0.06]]); fill(); } break;
    case "rose": for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5 - Math.PI / 2 + Math.PI / 5; P([[Math.cos(a) * 0.5, Math.sin(a) * 0.5], [Math.cos(a + 0.18) * 0.8, Math.sin(a + 0.18) * 0.8], [Math.cos(a - 0.18) * 0.8, Math.sin(a - 0.18) * 0.8]]); fill("#3f6a34"); }
      for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5 - Math.PI / 2; O(Math.cos(a) * 0.36, Math.sin(a) * 0.36, 0.3); fill(); }
      for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5 - Math.PI / 2 + Math.PI / 5; O(Math.cos(a) * 0.17, Math.sin(a) * 0.17, 0.17); fill(white); } O(0, 0, 0.11); fill(yellow); break;
    case "cock": for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(0.25, 0.0 + i * 0.04); g.quadraticCurveTo(0.6 + i * 0.03, -0.62 + i * 0.12, 0.78, -0.05 + i * 0.12); line(0.07, i & 1 ? "#1d3a2a" : "#2a2420"); }
      E(0.02, 0.12, 0.4, 0.3, -0.15); fill(); g.beginPath(); g.moveTo(-0.32, 0.0); g.lineTo(-0.38, -0.3); g.lineTo(-0.18, -0.3); g.lineTo(-0.05, -0.02); g.closePath(); fill(); O(-0.3, -0.36, 0.13); fill();
      for (const [x, y] of [[-0.38, -0.5], [-0.28, -0.53], [-0.18, -0.48]]) { O(x, y, 0.06); fill(red); } E(-0.4, -0.22, 0.04, 0.07); fill(red); P([[-0.42, -0.4], [-0.58, -0.34], [-0.42, -0.31]]); fill(yellow); O(-0.33, -0.39, 0.022); fill("#111");
      for (const x of [-0.06, 0.12]) { g.beginPath(); g.moveTo(x, 0.38); g.lineTo(x, 0.66); g.moveTo(x - 0.1, 0.68); g.lineTo(x + 0.1, 0.68); line(0.035, yellow); } break;
    case "ship": for (const y of [0.58, 0.72]) { g.beginPath(); for (let x = -0.8; x <= 0.8; x += 0.1) g.lineTo(x, y + Math.sin(x * 12 + y * 9) * 0.03); line(0.035, "#a8c0d4"); }
      P([[-0.72, 0.18], [0.72, 0.18], [0.5, 0.48], [-0.5, 0.48]]); fill("#6b4a2c"); P([[0.45, 0.18], [0.72, 0.18], [0.66, -0.02], [0.45, -0.02]]); fill("#6b4a2c");
      g.beginPath(); g.moveTo(0, 0.2); g.lineTo(0, -0.82); line(0.05, "#5a3c22"); g.beginPath(); g.moveTo(-0.42, -0.62); g.lineTo(0.42, -0.62); g.quadraticCurveTo(0.52, -0.25, 0.44, 0.06); g.lineTo(-0.44, 0.06); g.quadraticCurveTo(-0.34, -0.25, -0.42, -0.62); fill();
      P([[0, -0.82], [0.32, -0.76], [0, -0.7]]); fill(red); break;
    case "ball": { const gr = g.createRadialGradient(-0.18, -0.2, 0.05, 0, 0, 0.6); gr.addColorStop(0, "#fbe9a8"); gr.addColorStop(0.5, "#cf9f3e"); gr.addColorStop(1, "#6e4c14"); O(0, 0.06, 0.56); fill(gr); O(0, -0.56, 0.08); line(0.045, "#cf9f3e"); break; }
    case "mitre": g.beginPath(); g.moveTo(-0.45, 0.55); g.lineTo(-0.45, 0.0); g.quadraticCurveTo(-0.45, -0.52, 0, -0.85); g.quadraticCurveTo(0.45, -0.52, 0.45, 0.0); g.lineTo(0.45, 0.55); g.closePath(); fill();
      P([[-0.07, -0.8], [0.07, -0.8], [0.07, 0.55], [-0.07, 0.55]]); fill(yellow); P([[-0.45, 0.34], [0.45, 0.34], [0.45, 0.46], [-0.45, 0.46]]); fill(yellow);
      for (const x of [-0.3, 0.18]) { P([[x, 0.55], [x + 0.12, 0.55], [x + 0.12, 0.82], [x, 0.82]]); fill(); } break;
    case "book": P([[-0.74, -0.32], [0.74, -0.32], [0.74, 0.44], [-0.74, 0.44]]); fill("#5a1e1a");
      for (const s of [-1, 1]) { P([[0, -0.26], [0.7 * s, -0.36], [0.7 * s, 0.36], [0, 0.46]]); fill(); for (let i = 0; i < 6; i++) { const y = -0.2 + i * 0.1; g.beginPath(); g.moveTo(0.1 * s, y + 0.02); g.lineTo(0.6 * s, y - 0.02); line(0.022, dark); } }
      g.beginPath(); g.moveTo(0, -0.26); g.lineTo(0, 0.46); line(0.03, dark); break;
    case "sheaf": for (let i = -11; i <= 11; i++) { const tx = i * 0.05, bx = i * 0.034; g.beginPath(); g.moveTo(bx, 0.76); g.lineTo(i * 0.012, 0.24); g.lineTo(tx, -0.5); line(0.03);
        E(tx * 1.05, -0.6, 0.035, 0.12, Math.atan2(tx, 1)); fill(); }
      P([[-0.2, 0.17], [0.2, 0.17], [0.2, 0.3], [-0.2, 0.3]]); fill("#7a5a1e"); break;
  }
}

// ---------------------------------------------------------------- the ground (src/make/terrain-mesh.js)
// a periodic value noise: octaves of lattice values, smooth-stepped, wrapping; one grey in R, G and B
function tone([name, N, periods]) {
  const r = rng(seedOf(name)), d = new Uint8ClampedArray(N * N * 4), out = new Float32Array(N * N); let wsum = 0;
  periods.forEach((p, o) => { const w = 1 / (o + 1); wsum += w; const lat = Float32Array.from({ length: p * p }, () => r());
    for (let y = 0; y < N; y++) { const fy = y / N * p, j = Math.floor(fy), ty = fy - j, sy = ty * ty * (3 - 2 * ty), j1 = (j + 1) % p;
      for (let x = 0; x < N; x++) { const fx = x / N * p, i = Math.floor(fx), tx = fx - i, sx = tx * tx * (3 - 2 * tx), i1 = (i + 1) % p, a = lat[j * p + i], b = lat[j * p + i1], c2 = lat[j1 * p + i], d2 = lat[j1 * p + i1];
        out[y * N + x] += w * (a + (b - a) * sx + (c2 - a) * sy + (a - b - c2 + d2) * sx * sy); } } });
  for (let k = 0; k < N * N; k++) { const v = Math.max(0, Math.min(1, 0.5 + (out[k] / wsum - 0.5) * 1.8)) * 255; d[k * 4] = d[k * 4 + 1] = d[k * 4 + 2] = v; d[k * 4 + 3] = 255; }
  return { map: d };
}
function grass([N]) {
  const r = rng(seedOf("ground/grass"));
  return { map: drawn(N, N, (g) => { g.fillStyle = "#5b6d32"; g.fillRect(0, 0, N, N);
    for (let k = 0; k < 9000; k++) { const x = r() * N, y = r() * N, l = 3 + r() * 7, t = r(), dx = (r() - 0.5) * 3; g.strokeStyle = `rgba(${70 + t * 60 | 0},${92 + t * 50 | 0},${36 + t * 20 | 0},0.55)`; g.lineWidth = 1 + r();
      for (const ox of x < 4 ? [0, N] : x > N - 4 ? [0, -N] : [0]) for (const oy of y - l < 0 ? [0, N] : [0]) { g.beginPath(); g.moveTo(x + ox, y + oy); g.lineTo(x + ox + dx, y + oy - l); g.stroke(); } } }) };   // (blades at an edge are drawn again on the other side, so the tile wraps)
}
function gravel([N]) {
  const r = rng(seedOf("ground/gravel"));
  return { map: drawn(N, N, (g) => { g.fillStyle = "#a59a80"; g.fillRect(0, 0, N, N);
    for (let k = 0; k < 7000; k++) { const t = r(); g.fillStyle = `rgb(${130 + t * 90 | 0},${122 + t * 84 | 0},${100 + t * 70 | 0})`; const x = r() * N, y = r() * N, a = 1.5 + r() * 4, b = 1 + r() * 3, th = r() * 3; for (const ox of x < 6 ? [0, N] : x > N - 6 ? [0, -N] : [0]) for (const oy of y < 6 ? [0, N] : y > N - 6 ? [0, -N] : [0]) { g.beginPath(); g.ellipse(x + ox, y + oy, a, b, th, 0, 7); g.fill(); } }
    g.fillStyle = "rgba(60,50,35,0.25)"; for (let k = 0; k < 2500; k++) { const x = r() * N, y = r() * N; g.fillRect(x, y, 2, 2); if (x > N - 2) g.fillRect(x - N, y, 2, 2); if (y > N - 2) g.fillRect(x, y - N, 2, 2); } }) };
}

// ---------------------------------------------------------------- the hillside (src/make/hillside.js)
// dry-stone rubble (research-1660 §A1, A5: limestone, pale grey-buff, uneven): stones in rough courses, no mortar, the
// voids between them in deep shadow, lichen on some; a height map of the same stones for the bump (the second image). Covers
// 4 m by 4 m (2 m before 2026-10-07: along a 100 m wall the same dozen stones came round every 2 m); the stones are the same size
function rubble() {
  const N = 1024, r = rng(seedOf("hillside/dry-stone")), cv = [0, 1].map(() => canvas(N, N));
  const g = context(cv[0]), h = context(cv[1]);
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
      for (let k = r() < 0.55 ? 1 + (r() * 4 | 0) : 0; k > 0; k--) { const lx = x + w * (0.2 + r() * 0.6), ly = oy + hh * (0.2 + r() * 0.6), yl = r() < 0.15; g.fillStyle = yl ? "rgba(196,170,80,0.45)" : `rgba(${205 + r() * 30 | 0},${210 + r() * 25 | 0},${190 + r() * 20 | 0},0.38)`;
        for (const ox of [0, -N, N]) { g.beginPath(); g.ellipse(lx + ox, ly, 2 + r() * 7, 1.5 + r() * 5, r() * 3, 0, 7); g.fill(); } }
      for (let k = 0; k < 28; k++) { g.fillStyle = `rgba(${r() < 0.5 ? "70,64,52" : "235,230,214"},${0.05 + r() * 0.08})`; const px = x + 4 + r() * Math.max(1, w - 10), py = oy + 3 + r() * Math.max(1, hh - 6); g.fillRect(px, py, 1 + r() * 4, 1 + r() * 2); if (px > N - 6) g.fillRect(px - N, py, 3, 2); }
      x += w + 2 + r() * 4; } }
  return { map: g.getImageData(0, 0, N, N).data, normal: h.getImageData(0, 0, N, N).data };
}
const tex256 = (draw) => drawn(256, 256, (g) => draw(g, 256));
// a dressed stone's face (copes and stoops): grey-buff, pitted, lichened
function roughStone() {
  const r = rng(seedOf("hillside/cope"));
  return { map: tex256((g, N) => { g.fillStyle = "#b0a993"; g.fillRect(0, 0, N, N);
    for (let k = 0; k < 2600; k++) { const t = r(); g.fillStyle = `rgba(${t < 0.5 ? "84,78,64" : "226,220,200"},${0.06 + r() * 0.12})`; g.fillRect(r() * N, r() * N, 1 + r() * 5, 1 + r() * 3); }
    for (let k = 0; k < 26; k++) { g.fillStyle = r() < 0.2 ? "rgba(190,166,82,0.4)" : "rgba(214,218,196,0.35)"; g.beginPath(); g.ellipse(r() * N, r() * N, 3 + r() * 10, 2 + r() * 7, r() * 3, 0, 7); g.fill(); } }) };
}
// hawthorn: small dark leaves, crowded, with the dark of the hedge's depth between; tiles at 1/2 m
function hawthornLeaves() {
  const r = rng(seedOf("hillside/hawthorn")), greens = ["#4a6a2c", "#557530", "#628036", "#6e8a3c", "#405e26", "#7a8a44", "#577030"];
  return { map: tex256((g, N) => { g.fillStyle = "#26381a"; g.fillRect(0, 0, N, N);
    for (let k = 0; k < 2600; k++) { const x = r() * N, y = r() * N, a = r() * 6.28, l = 2.5 + r() * 3.5; g.fillStyle = greens[r() * greens.length | 0];
      for (const ox of x < 8 ? [0, N] : x > N - 8 ? [0, -N] : [0]) for (const oy of y < 8 ? [0, N] : y > N - 8 ? [0, -N] : [0]) { g.beginPath(); g.ellipse(x + ox, y + oy, l, l * 0.55, a, 0, 7); g.fill(); } }
    for (let k = 0; k < 120; k++) { g.fillStyle = "rgba(10,16,8,0.5)"; g.beginPath(); g.ellipse(r() * N, r() * N, 1.5 + r() * 3, 1 + r() * 2, r() * 3, 0, 7); g.fill(); } }) };
}
// oak left out: silver-grey over brown, the grain along the board
function weatheredOak() {
  const r = rng(seedOf("hillside/oak"));
  return { map: tex256((g, N) => { g.fillStyle = "#a09a8b"; g.fillRect(0, 0, N, N);
    for (let k = 0; k < 140; k++) { const y = r() * N, t = r(); g.strokeStyle = t < 0.5 ? `rgba(70,62,50,${0.15 + r() * 0.25})` : `rgba(190,186,172,${0.1 + r() * 0.2})`; g.lineWidth = 0.6 + r() * 1.8; g.beginPath(); g.moveTo(0, y);
      for (let x = 0; x <= N; x += 32) g.lineTo(x, y + Math.sin(x * 0.02 + k) * 2.5); g.stroke(); }
    for (let k = 0; k < 4; k++) { g.fillStyle = "rgba(60,50,38,0.5)"; g.beginPath(); g.ellipse(r() * N, r() * N, 3 + r() * 4, 2 + r() * 2, 0, 0, 7); g.fill(); } }) };
}
// leaves in a mass, as a grey to multiply a crown's colour by: lit clusters and dark gaps; and bark, fissured
const speckle = (name, draw) => { const r = rng(seedOf(name)); return { map: tex256((g, N) => draw(g, N, r)) }; };
const leafSpeckle = () => speckle("hillside/leaf-speckle", (g, N, r) => { g.fillStyle = "#8c8c8c"; g.fillRect(0, 0, N, N);
  for (let k = 0; k < 1600; k++) { const x = r() * N, y = r() * N, l = 2 + r() * 5, v = r() < 0.45 ? 40 + r() * 60 | 0 : 170 + r() * 85 | 0; g.fillStyle = `rgb(${v},${v},${v})`;
    for (const ox of x < 8 ? [0, N] : x > N - 8 ? [0, -N] : [0]) for (const oy of y < 8 ? [0, N] : y > N - 8 ? [0, -N] : [0]) { g.beginPath(); g.ellipse(x + ox, y + oy, l, l * 0.6, r() * 3, 0, 7); g.fill(); } } });
const barkSpeckle = () => speckle("hillside/bark", (g, N, r) => { g.fillStyle = "#c4c4c4"; g.fillRect(0, 0, N, N);
  for (let k = 0; k < 90; k++) { const x = r() * N, v = 90 + r() * 50 | 0; g.strokeStyle = `rgb(${v},${v},${v})`; g.lineWidth = 1 + r() * 3; g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= N; y += 16) g.lineTo(x + Math.sin(y * 0.05 + k) * 3, y); g.stroke(); }
  for (let k = 0; k < 60; k++) { const v = 190 + r() * 60 | 0; g.fillStyle = `rgba(${v},${v},${v - 20},0.5)`; g.beginPath(); g.ellipse(r() * N, r() * N, 2 + r() * 6, 1 + r() * 3, 0, 0, 7); g.fill(); } });

// ---------------------------------------------------------------- the generators
// cost: rough microseconds a pixel (for sharing the work out; measured 2026-10-07 as a worker's drawing time over the pixels, texjobs.textureLog())
const WHOLE = { whole: true };
export const GEN = {
  plaster: { ...WHOLE, cost: 0.14, normal: null, size: ([N]) => [N, N], paint: plaster },
  oak: { ...WHOLE, cost: 0.4, normal: null, size: ([N, M]) => [N, M], paint: oak },
  glass: { ...WHOLE, cost: 0.35, normal: null, size: ([N]) => [N, N], paint: glass },
  tile: { ...WHOLE, cost: 0.22, normal: 1, size: ([N]) => [N, N], paint: tile },
  brick: { ...WHOLE, cost: 0.12, normal: null, size: ([N]) => [N, N], paint: brick },
  pebbles: { ...WHOLE, cost: 0.3, normal: 1, size: ([N]) => [N, N], paint: pebbles },
  signs: { ...WHOLE, cost: 0.06, normal: null, size: () => [1024, 1024], paint: () => ({ map: drawn(1024, 1024, signAtlas) }) },
  tone: { ...WHOLE, cost: 0.12, normal: null, size: ([, N]) => [N, N], paint: tone },
  grass: { ...WHOLE, cost: 0.15, normal: null, size: ([N]) => [N, N], paint: grass },
  gravel: { ...WHOLE, cost: 0.2, normal: null, size: ([N]) => [N, N], paint: gravel },
  rubble: { ...WHOLE, cost: 0.08, normal: 1, size: () => [1024, 1024], paint: rubble },
  cope: { ...WHOLE, cost: 0.17, normal: null, size: () => [256, 256], paint: roughStone },
  leaves: { ...WHOLE, cost: 0.3, normal: null, size: () => [256, 256], paint: hawthornLeaves },
  weathered: { ...WHOLE, cost: 0.08, normal: null, size: () => [256, 256], paint: weatheredOak },
  leafSpeckle: { ...WHOLE, cost: 0.24, normal: null, size: () => [256, 256], paint: leafSpeckle },
  bark: { ...WHOLE, cost: 0.1, normal: null, size: () => [256, 256], paint: barkSpeckle },
};
// for the kit's texture jobs (texjobs.js): where a worker finds these generators
export const LIB = { url: import.meta.url, GEN };       // (warm, DEPS: the module's own exports, found by the worker)
