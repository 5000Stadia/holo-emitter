// Parts a story's things need (R49, the Alice hall): words on a thing, a place where something is set on or in
// it, and a lamp's flame. Each is small and general: lettering is a paper tag tied round a neck (a label that
// reads) or letters marked in currants on a cake; a slot is a point, in the thing's frame, where the placer
// sets what the story says stands on it or in it; a flame is the candle's glow, without the candle.
import { definePart } from "../catalogue.js";
import { mergeGeometries, mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

// five by seven capitals, the ones the story's words need; a letter not here is an error, never a guess
const GLYPHS = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10101", "10011", "10001", "10001"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
};

// the paper of a label, printed once per text
const PAPERS = new Map();
function paperOf(THREE, text) {
  if (PAPERS.has(text)) return PAPERS.get(text);
  const cv = document.createElement("canvas"); cv.width = 256; cv.height = 128; const g = cv.getContext("2d");
  g.fillStyle = "#efe3c4"; g.fillRect(0, 0, 256, 128); g.strokeStyle = "#8a7448"; g.lineWidth = 3; g.strokeRect(5, 5, 246, 118);
  g.fillStyle = "#2a1c10"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "bold 50px Georgia, serif"; g.fillText(text, 128, 66, 230);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }); mat.userData.cls = "paper";
  PAPERS.set(text, mat); return mat;
}

// lettering: style "tag" (a paper label hung by a string loop round a neck of radius `neck`, its top edge at
// at[1]; the card hangs in front, +z) or style "currants" (the words marked in currants on a flat surface at
// at[1], the lines top to bottom away from +z, the first line farthest; "EAT ME" is "EAT" over "ME"). A part's
// own `on` or `frame` puts it; the currants' lowest point is at y = 0 of what it is given.
definePart("lettering", {
  build(c, { style = "tag", text, at = [0, 0, 0], neck = 0.0125, w = 0.05, h = 0.02, pitch = 0.0024, mover = null }) {
    const { THREE } = c;
    if (style === "tag") {
      const card = new THREE.BoxGeometry(w, h, 0.002), tube = 0.0012, loopR = neck;
      card.translate(at[0], at[1] - h / 2 + 0.0004, at[2] + loopR + tube + 0.0006);
      const loop = new THREE.TorusGeometry(loopR, tube, 5, 20); loop.rotateX(Math.PI / 2); loop.translate(at[0], at[1], at[2]);
      c.add(card, paperOf(THREE, text), { mover, spread: 0 }); c.add(loop, "tape", { mover, spread: 0.05 });
      return;
    }
    // currants: each lit cell of the letters' grid is a small dark ball, a little flattened
    const lines = text.split(" "), cols = Math.max(...lines.map(l => l.length * 6 - 1)), rows = lines.length * 8 - 1, r = pitch * 0.5, balls = [];
    lines.forEach((line, li) => [...line].forEach((ch, ci) => {
      const gl = GLYPHS[ch]; if (!gl) throw new Error(`lettering: no glyph for ${ch}`);
      const x0 = (cols - (line.length * 6 - 1)) / 2;                         // each line centred
      gl.forEach((row, j) => { [...row].forEach((on, i) => { if (on !== "1") return;
        const s = new THREE.SphereGeometry(r, 6, 4); s.scale(1, 0.9, 1);
        s.translate(at[0] + (x0 + ci * 6 + i - (cols - 1) / 2) * pitch, r * 0.9, at[2] + (li * 8 + j - (rows - 1) / 2) * pitch); balls.push(s); }); });
    }));
    c.add(mergeGeometries(balls.map(b => b.toNonIndexed()), false), "dark", { mover, spread: 0.1 });
  },
});

// a place where the story sets something: a point in the thing's frame (on a mover, if it rides one: what is put in a
// drawer comes out with the drawer). area: the free floor about the point, [w, d] in metres, reported in the built
// thing's info (b.info.slots[name].area), so whoever seats several things in one slot can lay them side by side.
definePart("slot", { build(c, { name, at = [0, 0, 0], mover = null, area = null }) { c.slot(name, at, mover); if (area) (c.info.slots ||= {})[name] = { area }; } });

// ---- a thin closed slab over a grid (a skin of parchment, a sheet): its underside at lo(i, j) and its top at hi(i, j),
// over x = xs[i], z = zs[j] (both rising); one indexed geometry, so each face shades smooth and the hem round its edge
// keeps its own corners; every face outward. uv runs over it from (0, 1) at its first corner (x0, z0) to (1, 0). With
// xz(i, j) -> [x, z], the grid's points are wherever it puts them (a coverlet turned back across a corner: each column
// ends where it does), xs and zs then only counting the columns and rows; z must still rise along each column.
function slab(THREE, xs, zs, lo, hi, xz = (i, j) => [xs[i], zs[j]]) {
  const nx = xs.length, nz = zs.length, pos = [], uv = [], idx = [];
  const V = (x, y, z, u, v) => { pos.push(x, y, z); uv.push(u, v); return pos.length / 3 - 1; };
  const P = (i, j, y, u, v) => { const [x, z] = xz(i, j); return V(x, y, z, u, v); };
  const top = [], bot = [];
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) top.push(P(i, j, hi(i, j), i / (nx - 1), 1 - j / (nz - 1)));
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) bot.push(P(i, j, lo(i, j), i / (nx - 1), 1 - j / (nz - 1)));
  const T = (i, j) => top[i * nz + j], B = (i, j) => bot[i * nz + j];
  for (let i = 0; i < nx - 1; i++) for (let j = 0; j < nz - 1; j++) {
    idx.push(T(i, j), T(i, j + 1), T(i + 1, j), T(i + 1, j), T(i, j + 1), T(i + 1, j + 1));
    idx.push(B(i, j), B(i + 1, j), B(i, j + 1), B(i + 1, j), B(i + 1, j + 1), B(i, j + 1));
  }
  // the hem: along +x, +z, -x, -z, each quad its own four corners
  const loop = []; for (let i = 0; i < nx - 1; i++) loop.push([i, 0]); for (let j = 0; j < nz - 1; j++) loop.push([nx - 1, j]);
  for (let i = nx - 1; i > 0; i--) loop.push([i, nz - 1]); for (let j = nz - 1; j > 0; j--) loop.push([0, j]);
  for (let k = 0; k < loop.length; k++) { const [i0, j0] = loop[k], [i1, j1] = loop[(k + 1) % loop.length];
    const a = P(i0, j0, lo(i0, j0), 0, 0), b = P(i1, j1, lo(i1, j1), 0, 0), c = P(i1, j1, hi(i1, j1), 0, 0), d = P(i0, j0, hi(i0, j0), 0, 0);
    idx.push(a, c, b, a, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals(); return g;
}
const steps = (a, b, n) => Array.from({ length: n + 1 }, (_, k) => a + (b - a) * k / n);
const smooth = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
// d[p] = min over q of ((p - q)^2 + g[q]) for p, q = 0 … n-1, in one pass up and one back: the lower envelope of the
// parabolas, after Felzenszwalb and Huttenlocher, "Distance Transforms of Sampled Functions" (Theory of Computing, 2012)
function envelope(g, n, d, v = new Int32Array(n), z = new Float64Array(n + 1)) {
  let k = 0; v[0] = 0; z[0] = -Infinity; z[1] = Infinity;
  const cross = (q, r) => ((g[q] + q * q) - (g[r] + r * r)) / (2 * (q - r));
  for (let q = 1; q < n; q++) { let s = cross(q, v[k]); while (s <= z[k]) { k--; s = cross(q, v[k]); } k++; v[k] = q; z[k] = s; z[k + 1] = Infinity; }
  k = 0; for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; d[q] = (q - v[k]) * (q - v[k]) + g[v[k]]; }
}

// ---- the engrosser's hand on a skin of parchment, drawn once for each size of skin: close lines between ruled margins,
// the first opening in large letters ("This Indenture"), each line's end ruled through so nothing can be added after,
// the foot left clear for the sealing. Not legible, as a deed across a table isn't: the page gives its words.
const SKINS = new Map();
function skinOf(THREE, W, D) {
  const key = `${W.toFixed(3)}:${D.toFixed(3)}`; if (SKINS.has(key)) return SKINS.get(key);
  const px = 1024, cw = px, ch = Math.round(px * D / W), mm = px / (W * 1000), cv = document.createElement("canvas"); cv.width = cw; cv.height = ch;
  const g = cv.getContext("2d"); let s = 1660;
  const rnd = () => { s = Math.imul(s ^ (s >>> 15), 2246822507) + 0x9e3779b9 >>> 0; return ((s ^ (s >>> 13)) >>> 0) / 4294967296; };
  // the skin: cream, mottled, browned toward its edges, the hair side a little warmer in patches
  g.fillStyle = "#e2d2ad"; g.fillRect(0, 0, cw, ch);
  for (let k = 0; k < 260; k++) { const x = rnd() * cw, y = rnd() * ch, rx = 20 + rnd() * 120, ry = 20 + rnd() * 90, t = rnd();
    g.fillStyle = t < 0.6 ? `rgba(170,135,85,${0.025 + rnd() * 0.04})` : `rgba(250,240,215,${0.03 + rnd() * 0.05})`; g.beginPath(); g.ellipse(x, y, rx, ry, rnd() * 3, 0, Math.PI * 2); g.fill(); }
  const edge = g.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.35, cw / 2, ch / 2, Math.max(cw, ch) * 0.72);
  edge.addColorStop(0, "rgba(120,85,40,0)"); edge.addColorStop(1, "rgba(120,85,40,0.32)"); g.fillStyle = edge; g.fillRect(0, 0, cw, ch);
  // the margins ruled in dry point, the lines of writing between
  const L = 26 * mm, R = cw - 14 * mm, top = 18 * mm, foot = ch - 22 * mm, pitch = 9.5 * mm, xh = 2.4 * mm;
  g.strokeStyle = "rgba(120,92,60,0.22)"; g.lineWidth = 1; g.beginPath(); g.moveTo(L - 4 * mm, 6 * mm); g.lineTo(L - 4 * mm, ch - 6 * mm); g.moveTo(R + 3 * mm, 6 * mm); g.lineTo(R + 3 * mm, ch - 6 * mm); g.stroke();
  g.strokeStyle = "rgba(46,30,18,0.88)"; g.fillStyle = "rgba(46,30,18,0.92)"; g.lineCap = "round"; g.lineJoin = "round";
  // a line of the hand from x0 to x1 on the baseline y: minims, ascenders and descenders in words, the end ruled through
  const hand = (x0, x1, y, h, w) => { let x = x0; g.lineWidth = w;
    while (x < x1 - h * 3) { const n = 2 + Math.floor(rnd() * 7), lw = h * 0.62, ww = n * lw; if (x + ww > x1) break;
      g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < n; k++) { const lx = x + k * lw, t = rnd();
        if (t < 0.14) { g.quadraticCurveTo(lx + h * 0.05, y - h * 2.7, lx + h * 0.3, y - h * 2.3); g.quadraticCurveTo(lx + h * 0.36, y, lx + lw, y); }
        else if (t < 0.23) { g.quadraticCurveTo(lx + h * 0.15, y + h * 1.5, lx + h * 0.32, y); g.quadraticCurveTo(lx + h * 0.48, y - h * 1.05, lx + lw, y); }
        else { g.quadraticCurveTo(lx + h * 0.12, y - h * 1.3, lx + h * 0.31, y - h * 0.15); g.quadraticCurveTo(lx + h * 0.45, y - h * 1.15, lx + lw, y); } }
      g.stroke(); x += ww + h * (0.55 + rnd() * 0.4); }
    if (x < x1 - 2) { g.beginPath(); g.moveTo(x, y - h * 0.45); g.lineTo(x1, y - h * 0.45 + (rnd() - 0.5)); g.stroke(); } };
  // the opening: "This Indenture" in the engrosser's large letters, the rest of the first line in a larger hand
  const big = Math.round(15 * mm); g.font = `italic bold ${big}px Georgia, "Times New Roman", serif`; g.textBaseline = "alphabetic";
  const first = top + big * 0.8; g.fillText("This Indenture", L, first); const after = L + g.measureText("This Indenture").width + 3 * mm;
  hand(after, R, first, xh * 1.35, 1.6);
  for (let y = first + pitch * 1.25; y < foot; y += pitch) hand(L, R, y, xh, 1.15);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.82 }); mat.userData.cls = "parchment";
  SKINS.set(key, mat); return mat;
}

// An engrossment: a deed written fair on skins of parchment, stitched together at their heads, ready to be sealed
// (Kabe's case: the release of Asshover, three skins, on the draw-table for the sealing). Open (the default): the
// skins lie one on another, heads together at -z and the text toward +z, each below a little longer than the one
// over it so its foot shows, every skin a little cockled and its foot curling up; tape stitched over the heads; the
// seal tags drawn through the last skin's foot lie out on the table, bare until it is sealed (sealed: a disc of red
// wax on each). Folded (open: false): a packet a third of their width and half their length, the tags tucked in. The
// thing's frame: centred on x and z, lying on y = 0.
definePart("engrossment", {
  build(c, { W = 0.56, D = 0.44, skins = 3, open = true, sealed = false, tags = 2 }) {
    const { THREE } = c, t = 0.0009, stag = 0.012, n = Math.max(1, Math.round(skins)), mat = skinOf(THREE, W, D), r = c.r("cockle");
    if (!open) {
      // folded: the skins in a packet, its folds a little rounded, the writing outward
      const w = W / 3, d = D / 2, h = 0.0022 * n * 6, xs = steps(-w / 2, w / 2, 6), zs = steps(-d / 2, d / 2, 6);
      const bow = (i, j) => 0.0012 * Math.sin(Math.PI * i / 6) * Math.sin(Math.PI * j / 6);
      c.add(slab(THREE, xs, zs, () => 0, (i, j) => h + bow(i, j)), mat, { spread: 0 });
      return;
    }
    const a1 = 9 + r() * 4, a2 = 6 + r() * 3, p1 = r() * 6, p2 = r() * 6, A = 0.0012;
    const cockle = (x, z) => A * (0.5 + 0.5 * Math.sin(x * a1 + z * a2 * 0.7 + p1) * Math.sin(x * a2 * 0.8 - z * a1 * 0.6 + p2));
    // whole length, so the frame is centred on it: the lowest skin and the tags beyond its foot
    const tagOut = 0.07, Dn = D + (n - 1) * stag, total = Dn + tagOut, head = -total / 2;
    // the skins from the lowest (j = 0, the last skin, its foot farthest out) to the top (the first)
    for (let j = 0; j < n; j++) {
      const len = D + (n - 1 - j) * stag, foot = head + len, w = W - (j % 2 ? 0.006 : 0) + (j === 0 ? 0.004 : 0), x0 = -w / 2 + (j % 2 ? 0.002 : -0.001);
      const curl = (z) => 0.0045 * smooth(foot - 0.04, foot, z) ** 1.5;
      // (its cockle is gentle, so a coarse grid; finer only where its foot curls)
      const xs = steps(x0, x0 + w, 10), zs = [...steps(head, foot - 0.05, 9), foot - 0.035, foot - 0.022, foot - 0.01, foot];
      const lo = (i, k) => cockle(xs[i], zs[k]) + curl(zs[k]) + j * t, hi = (i, k) => lo(i, k) + t;
      c.add(slab(THREE, xs, zs, lo, hi), mat, { spread: 0 });
    }
    // tape stitched over the heads, on the top skin
    for (const fx of [-0.33, 0, 0.33]) { const x = fx * W, y = Math.max(...[-0.007, 0.007].flatMap(dx => [0, 0.018].map(dz => cockle(x + dx, head + dz)))) + n * t;
      const g = new THREE.BoxGeometry(0.012, 0.0012, 0.022); g.translate(x, y + 0.0006, head + 0.008); c.add(g, "tape", { spread: 0 }); }
    // the seal tags, drawn under the last skin's curled foot and lying out on the table; sealed, a disc of wax on each
    const foot0 = head + Dn;
    for (let k = 0; k < tags; k++) { const x = (tags === 1 ? 0 : -0.16 + 0.32 * k / (tags - 1)) * W + 0.08 * W;
      const g = new THREE.BoxGeometry(0.016, 0.0008, tagOut + 0.012); g.translate(x, 0.0004, foot0 - 0.012 + (tagOut + 0.012) / 2); c.add(g, "parchment", { spread: 0.1 });
      if (sealed) { const s = new THREE.CylinderGeometry(0.019, 0.02, 0.006, 20); s.translate(x, 0.0008 + 0.003, foot0 + tagOut * 0.55); c.add(s, "seal_wax", { spread: 0 }); } }
  },
});

// cloth laid over what is under it, as a height over an even grid (x = xs[i], z = zs[j]; under(x, z) the height of what
// lies there, below 0 where nothing does): no lower than what is under it (widened a cell, so its straight runs between
// points clear steep sides); carried over every hollow narrower than its own sag R (a closing); falling at most k in 1
// at its sides; then softened, never through what it covers. Returns S (the cloth's underside) and B (what it rests on),
// both indexed by at(i, j). A sheet over a body laid out, a coverlet over a man asleep.
function drape(under, xs, zs, { R = 0.15, k = 1.6 } = {}) {
  const nx = xs.length - 1, nz = zs.length - 1, N = (nx + 1) * (nz + 1);
  const B0 = new Float32Array(N), B = new Float32Array(N), S = new Float32Array(N), at = (i, j) => i * (nz + 1) + j;
  for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++) B0[at(i, j)] = Math.max(0, under(xs[i], zs[j]) + 0.003);
  for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++) { let m = 0;
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const ii = i + a, jj = j + b; if (ii >= 0 && jj >= 0 && ii <= nx && jj <= nz) m = Math.max(m, B0[at(ii, jj)]); }
    B[at(i, j)] = m; }
  const dx = (xs[nx] - xs[0]) / nx, dz = (zs[nz] - zs[0]) / nz, dd = Math.hypot(dx, dz);
  // the closing, on the grid padded with bare bed as far as the paraboloid reaches (else the sheet's border, the end
  // of what the closing can see, would hold it up): each pass one line of the padded grid, up (sign 1) or down (-1)
  { const M = Math.ceil(Math.sqrt(2 * R * 0.3) / Math.min(dx, dz)), px = nx + 1 + 2 * M, pz = nz + 1 + 2 * M, P1 = new Float32Array(px * pz), P2 = new Float32Array(px * pz), pa_ = (i, j) => i * pz + j;
    for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++) P1[pa_(i + M, j + M)] = B[at(i, j)];
    // max (or min) over r of f(r) -/+ a (p - r)^2, a = h^2 / 2R, is -/+ a times the lower envelope of g = -/+ f / a
    const pass = (src, dst, sign, alongX) => { const n = alongX ? px : pz, m = alongX ? pz : px, a = (alongX ? dx : dz) ** 2 / (2 * R), g = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), zz = new Float64Array(n + 1);
      for (let q = 0; q < m; q++) { for (let p = 0; p < n; p++) g[p] = -sign * src[alongX ? pa_(p, q) : pa_(q, p)] / a;
        envelope(g, n, d, v, zz); for (let p = 0; p < n; p++) dst[alongX ? pa_(p, q) : pa_(q, p)] = -sign * a * d[p]; } };
    pass(P1, P2, 1, true); pass(P2, P1, 1, false); pass(P1, P2, -1, true); pass(P2, P1, -1, false);
    for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++) S[at(i, j)] = Math.max(B[at(i, j)], P1[pa_(i + M, j + M)]); }
  const relax = (i, j, ii, jj, d) => { if (ii < 0 || jj < 0 || ii > nx || jj > nz) return; const v = S[at(ii, jj)] - k * d; if (v > S[at(i, j)]) S[at(i, j)] = v; };
  for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++) { relax(i, j, i - 1, j, dx); relax(i, j, i, j - 1, dz); relax(i, j, i - 1, j - 1, dd); relax(i, j, i + 1, j - 1, dd); }
  for (let i = nx; i >= 0; i--) for (let j = nz; j >= 0; j--) { relax(i, j, i + 1, j, dx); relax(i, j, i, j + 1, dz); relax(i, j, i + 1, j + 1, dd); relax(i, j, i - 1, j + 1, dd); }
  const T = new Float32Array(N);
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++) { let sum = 0, w = 0;
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const ii = i + a, jj = j + b; if (ii < 0 || jj < 0 || ii > nx || jj > nz) continue; const q = a || b ? (a && b ? 0.5 : 1) : 2; sum += S[at(ii, jj)] * q; w += q; }
      T[at(i, j)] = Math.max(B[at(i, j)], sum / w); }
    S.set(T); }
  return { S, B, at, dx, dz, N };
}

// A body laid out on a bed under a sheet, for the coroner's view: a shrouded form, nothing of the man shown. The
// pillow under his head; the sheet drawn up over his face, falling from what lies under it (the head, the nose's small
// ridge, shoulders, the hands folded on the breast, the legs and the feet that tent it) and lying out flat on the bed
// beyond. The figure is never built: only the sheet over it, worked out as a height over the bed (what lies under, every
// point of the sheet no lower than what is under it, falling at most so steeply from it, then softened), a thin closed
// slab. L: the sheet's length, head (-z) to foot (+z), the figure scaled to it (1.70 m: a man of some 5 ft 4 in, crown
// to toes 1.58 m as he lies); Wd: its width; over: how far the pillow stands out beyond the sheet's head. Frame: centred
// on x, and along z on the whole (the pillow's back to the sheet's foot), lying on y = 0.
definePart("shroud", {
  build(c, { L = 1.7, Wd = 0.8, over = 0.05, cell = 0.025, thick = 0.004 }) {
    const { THREE } = c, s = L / 1.7, head = -(L + over) / 2 + over, foot = (L + over) / 2;
    // the pillow, a squared cushion under the head, standing out beyond the sheet's head
    const pa = 0.29, pb = 0.15, pc = 0.05, pz = head - over + pb, P = 0.7, Q = 0.75;
    const pillowTop = (x, z) => { const q = 1 - Math.abs(x / pa) ** (2 / P) - Math.abs((z - pz) / pb) ** (2 / P); return q > 0 ? pc + pc * q ** (Q / 2) : -1; };
    { const g = new THREE.SphereGeometry(1, 28, 14), p = g.attributes.position, sp = (v, e) => Math.sign(v) * Math.abs(v) ** e;
      for (let i = 0; i < p.count; i++) p.setXYZ(i, pa * sp(p.getX(i), P), pc + pc * sp(p.getY(i), Q), pz + pb * sp(p.getZ(i), P));
      g.computeVertexNormals(); c.add(g, "linen", { spread: 0.04 }); }
    // what lies under the sheet: blobs, each the top of an ellipsoid [x, along, half-width, half-length, its top]
    const u = (f) => head + f * s;                                  // a point along the figure, f metres from the sheet's head at L = 1.70
    const blobs = [
      [0, u(0.13), 0.085, 0.11 * s, 0.25],                          // the head
      [0, u(0.13), 0.02, 0.035 * s, 0.28],                          // the nose's ridge
      [0, u(0.215), 0.045, 0.03 * s, 0.235],                        // the chin
      [0, u(0.27), 0.06, 0.06 * s, 0.13],                           // the neck
      [0, u(0.46), 0.23, 0.19 * s, 0.2],                            // the shoulders and breast
      [0, u(0.63), 0.07, 0.07 * s, 0.215],                          // the hands folded on it
      [-0.2, u(0.57), 0.06, 0.24 * s, 0.12], [0.2, u(0.57), 0.06, 0.24 * s, 0.12],     // the arms at his sides
      [0, u(0.8), 0.19, 0.17 * s, 0.165],                           // the belly and hips
      [-0.09, u(1.04), 0.08, 0.2 * s, 0.13], [0.09, u(1.04), 0.08, 0.2 * s, 0.13],     // the thighs
      [-0.085, u(1.33), 0.06, 0.19 * s, 0.1], [0.085, u(1.33), 0.06, 0.19 * s, 0.1],   // the shins
      [-0.09, u(1.53), 0.045, 0.05 * s, 0.17], [0.09, u(1.53), 0.045, 0.05 * s, 0.17]];   // the feet, toes up
    const under = (x, z) => { let h = pillowTop(x, z);
      for (const [bx, bz, rx, rz, top] of blobs) { const q = 1 - ((x - bx) / rx) ** 2 - ((z - bz) / rz) ** 2; if (q > 0) h = Math.max(h, top * Math.sqrt(q)); }
      return h; };
    // the sheet: no lower than what is under it (widened a cell, so its straight runs between points clear the pillow's
    // steep sides); carried over every hollow narrower than its own sag, as a sheet bridges from the toes to the knees
    // and over the neck (a closing: what lies under it, raised by a paraboloid of radius R and lowered by it again, each
    // a pass along x and one along z); falling at most 1.6 in 1 at its sides (a pass each way over the grid); then
    // softened, never through what it covers; flat on the bed where nothing holds it up
    const nx = Math.round(Wd / cell), nz = Math.round(L / cell), xs = steps(-Wd / 2, Wd / 2, nx), zs = steps(head, foot, nz);
    const { S, B, at, dx, dz, N } = drape(under, xs, zs, { R: 0.15, k: 1.6 });
    // linen, not plaster: soft folds where the sheet falls away (along the body down its sides, across it at the feet
    // and the head, each as deep as the fall is steep), a little unevenness where it lies flat; never into what it covers
    { const F = new Float32Array(N), sn = (x) => 0.5 + 0.5 * Math.sin(x);
      for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++) {
        const gx = (S[at(Math.min(nx, i + 1), j)] - S[at(Math.max(0, i - 1), j)]) / (2 * dx), gz = (S[at(i, Math.min(nz, j + 1))] - S[at(i, Math.max(0, j - 1))]) / (2 * dz), x = xs[i], z = zs[j];
        const side = smooth(0.12, 0.9, Math.abs(gx)), end = smooth(0.12, 0.9, Math.abs(gz)) * (1 - side * 0.5);
        F[at(i, j)] = 0.007 * side * sn(2 * Math.PI * z / 0.12 + 1.8 * Math.sin(2 * Math.PI * z / 0.41) + x * 4) + 0.006 * end * sn(2 * Math.PI * x / 0.1 + 1.4 * Math.sin(2 * Math.PI * x / 0.33) + z * 3)
          + (S[at(i, j)] < 0.006 ? 0.0025 * sn(x * 23 + z * 7) * sn(z * 17 - x * 6) : 0); }
      for (let q = 0; q < N; q++) S[q] = Math.max(B[q], S[q] + F[q]); }
    // the sheet's own edges lie on the bed (or the pillow): nothing of it hangs in the air at its border
    for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++) if (i === 0 || j === 0 || i === nx || j === nz) S[at(i, j)] = B[at(i, j)] > 0.004 ? B[at(i, j)] : 0;
    c.add(slab(THREE, xs, zs, (i, j) => S[at(i, j)], (i, j) => S[at(i, j)] + thick), "linen", { spread: 0.03 });
  },
});

// ---- a closed tube along a path (a nightshirt's sleeve, a bandaged shin): a ring of m about each point, of that point's
// radius (and wrap(k, a) more, at ring k and angle a: a frill, a bandage's turns), its frame carried along the path so it
// never twists, both ends capped flat. Indexed, every face outward.
function tube(THREE, pts, radii, { m = 14, wrap = null } = {}) {
  const n = pts.length, pos = [], idx = [], V = (v) => { pos.push(v.x, v.y, v.z); return pos.length / 3 - 1; };
  const P = pts.map(p => new THREE.Vector3(...p)), T = P.map((p, k) => P[Math.min(n - 1, k + 1)].clone().sub(P[Math.max(0, k - 1)]).normalize());
  let N = new THREE.Vector3(0, 1, 0); if (Math.abs(N.dot(T[0])) > 0.9) N.set(1, 0, 0);
  const rings = [];
  for (let k = 0; k < n; k++) { N = N.clone().sub(T[k].clone().multiplyScalar(N.dot(T[k]))).normalize(); const B = T[k].clone().cross(N), ring = [];
    for (let q = 0; q < m; q++) { const a = 2 * Math.PI * q / m, r = radii[k] + (wrap ? wrap(k, a) : 0);
      ring.push(V(P[k].clone().addScaledVector(N, Math.cos(a) * r).addScaledVector(B, Math.sin(a) * r))); }
    rings.push(ring); }
  for (let k = 0; k < n - 1; k++) for (let q = 0; q < m; q++) { const a = rings[k][q], b = rings[k][(q + 1) % m], c = rings[k + 1][q], d = rings[k + 1][(q + 1) % m]; idx.push(a, b, c, b, d, c); }
  const c0 = V(P[0]), c1 = V(P[n - 1]);
  for (let q = 0; q < m; q++) { idx.push(c0, rings[0][(q + 1) % m], rings[0][q]); idx.push(c1, rings[n - 1][q], rings[n - 1][(q + 1) % m]); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(pos.length / 3 * 2), 2));
  g.setIndex(idx); g.computeVertexNormals(); return g;
}
// a sphere of rings × segments, its seam welded (so it shades without a line down it), each unit point moved by f(x, y, z)
// -> [x, y, z]; an even uv of nothing, so it merges with the other geometry of its material
function blob(THREE, f, w = 32, h = 20) {
  let g = new THREE.SphereGeometry(1, w, h); g.deleteAttribute("uv"); g.deleteAttribute("normal"); g = mergeVertices(g);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const l = Math.hypot(p.getX(i), p.getY(i), p.getZ(i)) || 1; p.setXYZ(i, ...f(p.getX(i) / l, p.getY(i) / l, p.getZ(i) / l, i)); }
  g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(p.count * 2), 2)); g.computeVertexNormals(); return g;
}
const G = (v, c, s) => Math.exp(-(((v - c) / s) ** 2));
const sp = (v, e) => Math.sign(v) * Math.abs(v) ** e;      // a superellipse's power: a squared cushion from a sphere

// A man asleep in his bed (Sir Gervase on his opiate, design/case/case-1660.json lord_asleep: "sleeps heavily, grey-faced,
// his bound foot on a cushion"). A bolster across the bed's head and a pillow on it, dented where his head lies; the head,
// in a linen nightcap with a turned-up brim, face up and turned a little toward the bed's +x side, the chin a little down;
// his nightshirt close over his shoulders and breast, its collar about his neck; a coverlet of coloured wool drawn up to
// his breast over the form of him (breast, the arm at his side, belly, legs, the feet toes up: worked out as the laid-out
// body's sheet is, drape above), the top sheet turned down over it; one arm out over the coverlet in the nightshirt's
// sleeve, the hand lying on his belly; the coverlet thrown back from his gouty foot, which lies bound in linen on a
// cushion; the bed's own sheet under all of it. The head is a sphere moved into a
// head (skull, jaw, brow, the sockets and closed lids, nose, cheekbones, mouth, chin; old: hollow-cheeked, a long nose),
// painted in its vertices (lids, lips, a grey moustache and brows, grey hair below the cap), in the look's flesh.
// L: the length he takes, head (-z) to foot (+z); Wd: the coverlet's width (the bed's). Frame as the shroud's: centred on
// x and along z, lying on y = 0. turn: how far his face turns toward +x (radians).
definePart("sleeper", {
  build(c, { L = 1.75, Wd = 1.5, turn = 0.45, thick = 0.01, cell = 0.025 }) {
    const { THREE } = c, hz = -L / 2, foot = L / 2, V3 = THREE.Vector3;
    // ---- the bolster, across the bed's head
    const bz = hz + 0.085, br = 0.085, bw = Wd / 2 - 0.03;
    c.add(blob(THREE, (x, y, z) => [bw * sp(x, 0.25), br + br * y, bz + br * z], 40, 16), "linen", { spread: 0.03 });
    // ---- the pillow, before the bolster and lifted onto it at the back; dented where the back of his head lies
    const face = new V3(0, 0, 1).applyEuler(new THREE.Euler(0.2 - Math.PI / 2, 0, 0)).applyAxisAngle(new V3(0, 0, 1), -turn);   // his face's direction
    const hc = new V3(0, 0.185, hz + 0.225), back = hc.clone().addScaledVector(face, -0.085);
    const pa = 0.34, pb = 0.17, pc = 0.05, pz = hz + 0.215, PP = 0.7, Q = 0.75;
    const lift = (z) => 0.06 * smooth(pz - 0.02, hz + 0.07, z), dent = (x, z) => 0.03 * G(x, back.x, 0.1) * G(z, back.z, 0.1);
    const pillowTop = (x, z) => { const q = 1 - Math.abs(x / pa) ** (2 / PP) - Math.abs((z - pz) / pb) ** (2 / PP); return q > 0 ? pc + pc * q ** (Q / 2) + lift(z) - dent(x, z) : -1; };
    c.add(blob(THREE, (x, y, z) => { const X = pa * sp(x, PP), Z = pz + pb * sp(z, PP); return [X, pc + pc * sp(y, Q) + lift(Z) - dent(X, Z) * smooth(-0.6, 0.6, y), Z]; }, 36, 18), "linen", { spread: 0.04 });
    const bolsterTop = (x, z) => { const q = 1 - ((z - bz) / br) ** 2; return Math.abs(x) < bw && q > 0 ? br + br * Math.sqrt(q) : -1; };
    // ---- the head: in its own frame x across, y to the crown, z to the face; a sphere moved into a head, its pole at
    // the face (so its rings crowd where the features are)
    const rx = 0.072, ry = 0.114, rz = 0.097;
    const shape = (ux, uy, uz) => {
      const jaw = smooth(0.05, -0.85, uy);                                             // 0 above the cheekbones, 1 at the chin
      let x = ux * rx * (1 - 0.3 * jaw - 0.06 * smooth(0.3, 0.9, uy) * Math.max(0, uz)), y = uy * ry, z = uz * rz;
      z *= uz < 0 ? 1 - 0.42 * jaw : 1 - 0.1 * uz ** 3 * (1 - jaw) - 0.12 * jaw * (1 - uz);   // the nape and throat are not skull; a flat face
      z -= 0.012 * Math.max(0, -uz) * smooth(-0.3, 0.5, uy);                          // the back of the skull
      const w = smooth(0.25, 0.75, uz);
      if (w > 0) { let d = 0;
        d += 0.008 * G(x, 0, 0.042) * G(y, 0.029, 0.008) - 0.004 * G(x, 0, 0.008) * G(y, 0.03, 0.01);   // the brow, a furrow between
        for (const s of [-1, 1]) {
          d -= 0.015 * G(x, s * 0.03, 0.015) * G(y, 0.012, 0.011);                     // the sockets
          d += 0.0065 * G(x, s * 0.03, 0.011) * G(y, 0.009, 0.0065);                   // the lids, shut
          d -= 0.0012 * G(x, s * 0.03, 0.011) * G(y, 0.006, 0.0012);                   // where they meet
          d += 0.007 * G(x, s * 0.047, 0.012) * G(y, -0.008, 0.01);                    // the cheekbones
          d -= 0.009 * G(x, s * 0.042, 0.015) * G(y, -0.045, 0.016);                   // hollow cheeks
          d -= 0.006 * G(x, s * 0.062, 0.01) * G(y, 0.03, 0.014);                      // hollow temples
          d += 0.007 * G(x, s * 0.013, 0.006) * G(y, -0.031, 0.006);                   // the nostrils' wings
          const fx = s * (0.021 + 0.25 * (-0.03 - y)); d -= 0.0028 * G(x, fx, 0.0035) * smooth(-0.028, -0.034, y) * smooth(-0.07, -0.058, y);   // the folds from nose to mouth
          d += 0.003 * G(x, s * 0.03, 0.012) * G(y, 0.031, 0.004); }                   // bushy brows
        const t = smooth(0.024, -0.03, y), nose = (0.006 + 0.026 * t ** 1.3) * smooth(0.032, 0.02, y) * smooth(-0.042, -0.031, y);
        d += nose * G(x, 0, 0.0055 + 0.0055 * t);                                      // the nose, long, its bridge narrow
        d += 0.003 * G(x, 0, 0.007) * G(y, -0.027, 0.006);                             // its tip
        d += 0.0035 * G(x, 0, 0.019) * G(y, -0.052, 0.005) + 0.003 * G(x, 0, 0.017) * G(y, -0.064, 0.004) - 0.0035 * G(x, 0, 0.022) * G(y, -0.058, 0.0022);   // thin lips, the mouth's line
        d += 0.003 * G(x, 0, 0.022) * G(y, -0.046, 0.004);                             // a grey moustache
        d -= 0.003 * G(x, 0, 0.015) * G(y, -0.074, 0.005);                             // under the lip
        d += 0.012 * G(x, 0, 0.02) * G(y, -0.093, 0.012);                              // the chin
        z += d * w; }
      return [x, y, z]; };
    const faceUp = (f) => (x, y, z) => f(x, -z, y);                                    // the sphere's pole to the face
    const skin = blob(THREE, faceUp(shape), 80, 56);
    // the neck, from under the jaw down into the breast under the coverlet
    const neck = blob(THREE, (x, y, z) => [0.042 * x, -0.105 + 0.06 * y, -0.05 + 0.04 * z], 16, 10);
    // painted in its vertices, as multiples of the look's flesh (so the look keeps the complexion): the lids' line and the
    // sockets darker, the lips duller and redder, the nose a little red, brows, moustache and the hair at the temples grey
    const base = c.mat("flesh").color, white = new THREE.Color(0xc4c0b8), grey = new THREE.Color(0x8e8a82);
    const mul = (col) => [col.r / base.r, col.g / base.g, col.b / base.b];
    const paint = (g, at) => { const p = g.attributes.position, col = new Float32Array(p.count * 3);
      for (let i = 0; i < p.count; i++) col.set(at(p.getX(i), p.getY(i), p.getZ(i)), i * 3);
      g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); };
    const mix = (a, b, t) => a.map((v, k) => v + (b[k] - v) * t), WHITE = mul(white), GREY = mul(grey);
    // the cap covers the head above a plane tilted from over the brow down to the nape: n . u > edge, u the head's unit direction
    const cn = new V3(0, 0.95, -0.62).normalize(), edge = -0.1;
    const capOf = (x, y, z) => cn.y * y / ry + cn.z * z / rz - edge;                  // > 0 under the cap
    paint(skin, (x, y, z) => { const f = z > 0 ? 1 : 0; let col = [1, 1, 1];
      for (const s of [-1, 1]) { col = mix(col, [0.8, 0.74, 0.74], 0.7 * f * G(x, s * 0.03, 0.016) * G(y, 0.012, 0.011));
        col = mix(col, [0.4, 0.33, 0.33], f * G(x, s * 0.03, 0.012) * G(y, 0.006, 0.0018));
        col = mix(col, WHITE, 0.9 * f * G(x, s * 0.031, 0.013) * G(y, 0.031, 0.0035)); }
      col = mix(col, [0.98, 0.78, 0.8], f * G(x, 0, 0.017) * G(y, -0.058, 0.006));
      col = mix(col, [1.07, 0.9, 0.9], f * 0.8 * G(x, 0, 0.01) * G(y, -0.027, 0.009));
      col = mix(col, GREY, f * 0.95 * G(x, 0, 0.025) * G(y, -0.046, 0.0035));
      col = mix(col, [0.88, 0.88, 0.92], f * 0.5 * smooth(-0.045, -0.085, y));         // a day's grey stubble
      const hair = smooth(-0.3, -0.04, capOf(x, y, z)) * smooth(0.5, 0.1, z / rz);      // below the cap's edge, at the sides and back
      return mix(col, WHITE, 0.92 * hair); });
    paint(neck, () => [0.96, 0.94, 0.94]);
    // the cap: a closed shell whose outside lies 6 mm off the head (looser at the back of the crown) and whose inside lies
    // 1 cm within it, the two meeting at the cap's edge in a turned-up brim. A sphere whose upper half becomes the outside
    // and lower half the inside, each spread over the cap from its crown (the plane's pole) to its edge, so the edge falls
    // on a ring of the mesh and is clean
    const tmax = Math.acos(edge), toCap = new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), cn);
    const onHead = (d, off) => { const [x, y, z] = shape(d.x, d.y, d.z), n = new V3(x / rx / rx, y / ry / ry, z / rz / rz).normalize(); return [x + n.x * off, y + n.y * off, z + n.z * off]; };
    const cap = blob(THREE, (x, y, z) => { const th = Math.acos(Math.max(-1, Math.min(1, y))), ph = Math.atan2(z, x), outside = th < Math.PI / 2 - 1e-6, rim = Math.abs(th - Math.PI / 2) < 1e-6;
      const t = (outside ? th : Math.PI - th) / (Math.PI / 2), a = t * tmax, d = new V3(Math.sin(a) * Math.cos(ph), Math.cos(a), Math.sin(a) * Math.sin(ph)).applyQuaternion(toCap);
      const loose = 0.007 * Math.max(0, -d.z) * Math.max(0, d.y), brim = 0.008 * smooth(0.72, 0.95, t);
      return onHead(d, rim ? 0.002 : outside ? 0.006 + loose + brim : -0.01); }, 64, 40);
    // the head into the bed's frame: face up, the chin a little down toward the breast, turned toward +x
    const M = new THREE.Matrix4().makeRotationAxis(new V3(0, 0, 1), -turn).multiply(new THREE.Matrix4().makeRotationX(0.2 - Math.PI / 2)).premultiply(new THREE.Matrix4().makeTranslation(hc.x, hc.y, hc.z));
    for (const g of [skin, neck, cap]) g.applyMatrix4(M);
    c.add(skin, "flesh", { spread: 0 }); c.add(neck, "flesh", { spread: 0 }); c.add(cap, "linen", { spread: 0.02 });
    // ---- the form of him under the bedclothes: blobs as the shroud's [x, z, half-width, half-length, top], along him
    // from his crown; the bed's own sheet under everything, 3 mm
    const crown = hc.z - ry * Math.cos(0.2), F = (f) => crown + f, sheet = 0.003;
    const cx = 0.13, cz = F(1.47), cw = 0.17, cd = 0.16, ch = 0.055;                    // the cushion under his bound foot
    const cushionTop = (x, z) => { const q = 1 - Math.abs((x - cx) / cw) ** (2 / PP) - Math.abs((z - cz) / cd) ** (2 / PP); return q > 0 ? sheet + ch + ch * q ** (Q / 2) : -1; };
    const blobs = [
      [0, F(0.24), 0.05, 0.07, 0.155],                                                 // the neck
      [-0.16, F(0.36), 0.085, 0.1, 0.12], [0.16, F(0.36), 0.085, 0.1, 0.12],           // the shoulders
      [0, F(0.45), 0.22, 0.2, 0.175],                                                  // the breast
      [-0.215, F(0.58), 0.055, 0.25, 0.11],                                            // the arm at his side
      [0, F(0.8), 0.19, 0.18, 0.155],                                                  // the belly and hips
      [-0.1, F(1.05), 0.08, 0.2, 0.12], [cx - 0.01, F(1.05), 0.08, 0.2, 0.125],        // the thighs
      [-0.1, F(1.33), 0.06, 0.18, 0.09], [-0.1, F(1.55), 0.045, 0.05, 0.16],           // a shin, a foot toes up
      [cx, F(1.18), 0.065, 0.09, 0.13], [cx, F(1.3), 0.062, 0.09, 0.165]];             // the other knee and shin, rising to the cushion
    const him = (x, z) => { let h = sheet;
      for (const [bx, bz2, bxr, bzr, top] of blobs) { const q = 1 - ((x - bx) / bxr) ** 2 - ((z - bz2) / bzr) ** 2; if (q > 0) h = Math.max(h, top * Math.sqrt(q)); }
      return h; };
    const under = (x, z) => Math.max(pillowTop(x, z), bolsterTop(x, z), cushionTop(x, z), him(x, z));
    const rest = (x, z) => under(x, z) + 0.001;
    // the bed's sheet, under all of it
    { const g = new THREE.BoxGeometry(Wd, sheet, L); g.translate(0, sheet / 2, 0); c.add(g, "linen", { spread: 0.02 }); }
    // ---- his nightshirt, over his shoulders and breast from the collar under his chin to under the coverlet (over him
    // only: where the pillow's front edge comes down on his shoulders, the shirt goes under it). Close on him (a sag of
    // 5 cm, not the coverlet's 22); where nothing of him is under it, it is drawn down into the bed's sheet, so its
    // outline is his and never a board's
    { const nx = 40, nz = 18, xs = steps(-0.31, 0.29, nx), zs = steps(F(0.2), F(0.47), nz), { S, at } = drape(him, xs, zs, { R: 0.05, k: 2.5 });
      // (its collar close about his neck, a little thicker there)
      const up = (i, j) => { const h = him(xs[i], zs[j]) + 0.001; return i === 0 || i === nx || j === 0 || j === nz ? h : Math.max(h, S[at(i, j)] + 0.002 * Math.sin(xs[i] * 40 + zs[j] * 25)); };
      const shirt = (i, j) => up(i, j) + 0.004 + (j === 0 ? 0.004 * G(xs[i], 0, 0.07) : 0), into = (i, j) => smooth(sheet + 0.012, sheet + 0.004, shirt(i, j));
      c.add(slab(THREE, xs, zs, (i, j) => up(i, j) * (1 - into(i, j)), (i, j) => shirt(i, j) + (sheet - 0.0005 - shirt(i, j)) * into(i, j)), "linen", { spread: 0.02 }); }
    // ---- the coverlet: draped over him, then cut to its own outline: drawn up to his breast, thrown back off the gouty foot
    const top0 = F(0.43), z0 = top0 - 0.03, nx = Math.round(Wd / cell), nz = Math.round((foot - z0) / cell), xs = steps(-Wd / 2, Wd / 2, nx), zs = steps(z0, foot, nz);
    const { S, at } = drape(under, xs, zs, { R: 0.22, k: 1.3 });
    // wool, thick and soft: broad slow folds where it falls away at his sides, a little unevenness where it lies flat
    const sAt = (x, z) => { const fi = Math.max(0, Math.min(nx - 1e-6, (x - xs[0]) / (xs[nx] - xs[0]) * nx)), fj = Math.max(0, Math.min(nz - 1e-6, (z - zs[0]) / (zs[nz] - zs[0]) * nz)), i = Math.floor(fi), j = Math.floor(fj), a = fi - i, b = fj - j;
      return (S[at(i, j)] * (1 - a) + S[at(i + 1, j)] * a) * (1 - b) + (S[at(i, j + 1)] * (1 - a) + S[at(i + 1, j + 1)] * a) * b; };
    const fold = (x, z) => { const gx = (sAt(x + 0.03, z) - sAt(x - 0.03, z)) / 0.06, side = smooth(0.15, 0.9, Math.abs(gx));
      return 0.011 * side * (0.5 + 0.5 * Math.sin(2 * Math.PI * z / 0.21 + 1.5 * Math.sin(2 * Math.PI * z / 0.53) + x * 3)) + 0.003 * (0.5 + 0.5 * Math.sin(x * 17 + z * 5) * Math.sin(z * 13 - x * 4)); };
    const lie = (x, z) => Math.max(rest(x, z), sAt(x, z) + fold(x, z));
    const zEnd = (x) => foot - (foot - F(1.27)) * smooth(-0.04, 0.07, x) - 0.08 * smooth(0.07, Wd / 2, x);   // the corner thrown back
    const CZ = nz, cxz = (i, j) => { const x = xs[i], e = zEnd(x); return [x, top0 + (e - top0) * j / CZ]; };
    const lo = (i, j) => { const [x, z] = cxz(i, j); return i === 0 || i === nx || j === CZ ? rest(x, z) : lie(x, z); };
    const hi = (i, j) => { const [x, z] = cxz(i, j), e = zEnd(x), turned = smooth(0.07, 0.02, e - z) * smooth(-0.04, 0.07, x);   // doubled where it is turned back
      return lo(i, j) + thick * (1 + 0.9 * turned); };
    c.add(slab(THREE, xs, steps(0, 1, CZ), lo, hi, cxz), "coverlet", { spread: 0.03 });
    // ---- the top sheet turned down over it: from just past the coverlet's edge (where it folds) 15 cm down him
    const tz = steps(top0 - 0.012, top0 + 0.15, 12), tx = steps(-Wd / 2, Wd / 2, nx);
    const tlo = (i, j) => j === 0 ? lie(tx[i], tz[j]) + 0.003 : lie(tx[i], tz[j]) + thick + 0.0005;
    c.add(slab(THREE, tx, tz, tlo, (i, j) => tlo(i, j) + 0.004 + 0.004 * G(tz[j], top0, 0.008)), "linen", { spread: 0.02 });
    // what lies on the bedclothes lies on this: the turned-down sheet, the coverlet, or above them the nightshirt or the bed
    const over = (x, z) => z < top0 - 0.012 ? rest(x, z) + 0.006 : lie(x, z) + thick + (z < top0 + 0.155 ? 0.0045 : 0);
    // ---- the arm out over the coverlet, in the nightshirt's sleeve: from his shoulder down his side to the elbow, the
    // forearm across to the hand on his belly; gathered at the wrist in a frilled cuff
    const arm = [[0.19, 0.31, 0.047], [0.245, 0.42, 0.047], [0.268, 0.53, 0.045], [0.258, 0.61, 0.042], [0.2, 0.665, 0.039], [0.14, 0.7, 0.036], [0.125, 0.708, 0.043]];
    const armPts = arm.map(([x, f, r], k) => [x, over(x, F(f)) + r * 0.82 - (k ? 0 : 0.035), F(f)]);
    c.add(tube(THREE, armPts, arm.map(a => a[2]), { m: 16, wrap: (k, a) => k === arm.length - 1 ? 0.004 * Math.sin(9 * a) : 0 }), "linen", { spread: 0.02 });
    // the hand, palm down on him, from the wrist toward his middle, lying on the coverlet's rise; the fingers a little
    // curled, the thumb at its side
    { const wx = 0.13, wf = 0.705, dir = new V3(-0.09, 0, 0.1).normalize(), side = new V3(dir.z, 0, -dir.x), w0 = new V3(wx, 0, F(wf));
      const place = (lx, ly, lz) => { const p = w0.clone().addScaledVector(dir, lz).addScaledVector(side, lx); return [p.x, ly + over(p.x, p.z) + 0.012, p.z]; };
      const hand = blob(THREE, (x, y, z) => { const lz = 0.09 + 0.098 * z, fing = smooth(0.1, 0.13, lz);
        let lx = x * 0.041 * (1 - 0.12 * fing), ly = y * 0.014 * (1 - 0.25 * fing) - 0.008 * smooth(0.13, 0.19, lz) ** 2;
        if (y > 0) ly += 0.002 * G(lz, 0.1, 0.008) - 0.0028 * fing * (0.5 + 0.5 * Math.cos(2 * Math.PI * lx / 0.0205));   // the knuckles, the fingers parted
        return place(lx, ly, lz); }, 40, 20);
      // (a left hand, palm down: its thumb on its right as you look down on it, angled out from the fingers)
      const thumb = blob(THREE, (x, y, z) => { const lz = 0.065 + 0.04 * z; return place(-0.03 - 0.25 * (lz - 0.03) + 0.011 * x, 0.01 * y - 0.003, lz); }, 16, 10);
      paint(hand, (x, y, z) => [1.0, 0.97, 0.97]); paint(thumb, () => [1.0, 0.97, 0.97]);
      c.add(hand, "flesh", { spread: 0 }); c.add(thumb, "flesh", { spread: 0 }); }
    // ---- the gouty foot bound in linen, from under the coverlet's turned edge down the shin to the ankle on the cushion,
    // and the foot itself, toes up and a little out, swaddled thick
    { const shin = [[cx, F(1.2), 0.125], [cx + 0.003, F(1.32), 0.155], [cx + 0.006, F(1.43), 0.17], [cx + 0.008, F(1.47), 0.172]];
      c.add(tube(THREE, shin.map(([x, z, y]) => [x, y, z]), [0.05, 0.054, 0.058, 0.06], { m: 18, wrap: (k, a) => 0.003 * Math.sin(3 * a + k * 2.1) }), "linen", { spread: 0.02 });
      const up = new V3(0.15, 1, 0.38).normalize(), ac = new V3(cx + 0.01, 0.175, F(1.49)).addScaledVector(up, 0.07);
      const footG = blob(THREE, (x, y, z) => { const r = [0.062, 0.12, 0.066], v = new V3(x * r[0], y * r[1], z * r[2]);
        v.z += 0.012 * Math.sin(y * 9 + x * 3) * 0.3; v.multiplyScalar(1 + 0.03 * Math.sin(y * 28 + Math.atan2(z, x) * 2));   // the bandage's turns
        return v.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), up)).add(ac).toArray(); }, 24, 18);
      c.add(footG, "linen", { spread: 0.02 }); }
    // ---- the cushion under it, on the bed
    c.add(blob(THREE, (x, y, z) => [cx + cw * sp(x, PP), ch + ch * sp(y, Q), cz + cd * sp(z, PP)], 28, 14), "cushion", { spread: 0.03 });
  },
});

// a flame and its glow, as a candle's, for a lamp: shown while its affordance (`when`, default "light") is
// moved; a light group `group` the affordance turns on and off; it flickers. light 0 makes no point light
// (a row of lamps would be a row of lights): the flame and a soft glow only. still: a steady flame in still air (a
// lantern's candle, a sconce's): no animation and a steady light (userData.still, which the page's pool keeps from
// flickering), so a lit one never asks for a frame of its own; halo: [radius,
// opacity] of the glow (a lantern's horn lit from within). The flame keeps its light (userData.light), so putting it
// out still darkens a light the page has taken out of the scene into its pool
definePart("flame", {
  build(c, { at = [0, 0, 0], r = 0.007, light = 0.6, reach = 5, group = "flame", when = "light", still = false, halo = null }) {
    const { THREE } = c;
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0.92 });
    const flame = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), flameMat); flame.scale.set(1, 2.4, 1); flame.position.set(...at); flame.userData.lightGroup = group;
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xffc070, transparent: true, opacity: halo ? halo[1] : 0.16, depthWrite: false });
    const glow = new THREE.Mesh(new THREE.SphereGeometry(halo ? halo[0] : r * 3.4, 12, 8), glowMat); glow.position.set(...at); glow.userData.lightGroup = group;
    c.extra(flame); c.extra(glow);
    let lamp = null;
    if (light > 0) { lamp = new THREE.PointLight(0xffb070, light, reach, 2); lamp.position.set(at[0], at[1] + r, at[2]); lamp.userData.lightGroup = group; lamp.userData.still = still; c.extra(lamp); flame.userData.light = lamp; }
    if (!still) c.animate((t, isLit) => { if (!isLit(when)) return;
      const f = 1 + 0.07 * Math.sin(t * 6.1 + at[0] * 40) + 0.05 * Math.sin(t * 11.3 + 1.7) + 0.03 * Math.sin(t * 27.9);
      flame.scale.set(1, 2.4 * f, 1); glow.scale.setScalar(1 + (f - 1) * 0.5); if (lamp) lamp.intensity = (lamp.userData.on ?? light) * f; });
  },
});
