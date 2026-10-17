// FROZEN: v1 of the zero-asset room, as graded side by side with the painted shell (R29). Do not edit; v2 lives in procedural.js.
// Zero-asset room: every surface of the muniment room built from its schematic in code.
// No mesh, no texture file, no prompt. Materials are generated on load from noise; mouldings
// are 2D profiles lofted along paths; light comes in through the windows.
//
//   buildProcedural(THREE, schematic) -> { scene, lights, stats }
//
// Frames: plan metres X east, Y north; three x = X, z = -Y, y up. Each wall is built in its
// own frame (r along the wall from the left corner as you face it, z up, +depth toward the
// room) and then turned into place, exactly as the painted shell is.

// ---------------------------------------------------------------- noise
function hash(i, j, s) {
  let h = Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ Math.imul(s + 1, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const mod = (a, p) => ((a % p) + p) % p;
// value noise, periodic over px x py lattice cells so every texture tiles
function vnoise(x, y, px, py, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const x0 = mod(xi, px), x1 = mod(xi + 1, px), y0 = mod(yi, py), y1 = mod(yi + 1, py);
  const a = hash(x0, y0, s), b = hash(x1, y0, s), c = hash(x0, y1, s), d = hash(x1, y1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, px, py, oct, s) {
  let sum = 0, amp = 0.5, f = 1, norm = 0;
  for (let o = 0; o < oct; o++) { sum += amp * vnoise(x * f, y * f, px * f, py * f, s + o * 17); norm += amp; amp *= 0.5; f *= 2; }
  return sum / norm;
}
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function rng(seed) { let s = seed >>> 0; return () => { s = Math.imul(s ^ (s >>> 15), 2246822507) + 0x9e3779b9 >>> 0; s ^= s >>> 13; return (s >>> 0) / 4294967296; }; }

// ---------------------------------------------------------------- texture plumbing
function canvasTex(THREE, w, h, fill, { srgb = true, repeat = true } = {}) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d"), img = g.createImageData(w, h);
  fill(img.data, w, h);
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  t.anisotropy = 8;
  return t;
}
// a normal map from a height field (periodic)
function normalFrom(THREE, H, w, h, strength) {
  return canvasTex(THREE, w, h, (d) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const l = H[y * w + mod(x - 1, w)], r = H[y * w + mod(x + 1, w)];
      const u = H[mod(y - 1, h) * w + x], dn = H[mod(y + 1, h) * w + x];
      let nx = (l - r) * strength, ny = (dn - u) * strength, nz = 1;
      const n = Math.hypot(nx, ny, nz); nx /= n; ny /= n; nz /= n;
      const i = (y * w + x) * 4;
      d[i] = (nx * 0.5 + 0.5) * 255; d[i + 1] = (ny * 0.5 + 0.5) * 255; d[i + 2] = nz * 255; d[i + 3] = 255;
    }
  }, { srgb: false });
}

// ---------------------------------------------------------------- materials
// Oak: a 1 m periodic tile, grain running along v. Quarter-sawn English oak: straight close
// latewood lines, silver ray fleck, fine fibre, slow tonal drift.
function oakField(N) {
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
    const tone = 0.78 + 0.44 * figure;
    const k = (0.7 + 0.3 * fibre) * (1 - 0.3 * late) * tone;
    const i = (y * N + x) * 3;
    // dark English oak, aged: warm brown; fleck paler, a touch of gold
    // sRGB fractions: aged dark oak, olive-brown more than red, about (84, 59, 36)
    A[i] = 0.33 * k + fleck * 0.07;
    A[i + 1] = 0.232 * k + fleck * 0.055;
    A[i + 2] = 0.14 * k + fleck * 0.03;
    H[y * N + x] = -late * 0.35 + fibre * 0.2 + fleck * 0.15;
  }
  return { A, H, N };
}
function oakTextures(THREE, oak, { tint = [1, 1, 1], rotate = false } = {}) {
  const { A, H, N } = oak;
  const map = canvasTex(THREE, N, N, (d) => {
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const s = rotate ? (x * N + (N - 1 - y)) : (y * N + x);
      const o = (y * N + x) * 4;
      d[o] = Math.min(255, A[s * 3] * tint[0] * 255); d[o + 1] = Math.min(255, A[s * 3 + 1] * tint[1] * 255); d[o + 2] = Math.min(255, A[s * 3 + 2] * tint[2] * 255); d[o + 3] = 255;
    }
  });
  let Hr = H;
  if (rotate) { Hr = new Float32Array(N * N); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) Hr[y * N + x] = H[x * N + (N - 1 - y)]; }
  return { map, normalMap: normalFrom(THREE, Hr, N, N, 1.6) };
}

// Floor: boards running east-west, 160-240 mm wide, butt-jointed at random lengths; each
// board a different cut of the same oak, darker and more worn than the panelling.
function floorTexture(THREE, oak, W, D, ppm) {
  const w = Math.round(W * ppm), h = Math.round(D * ppm), r = rng(7);
  const rows = []; let y = 0;
  while (y < D) { const bw = 0.16 + r() * 0.08; const joints = []; let x = -r() * 2.2;
    while (x < W) { joints.push({ x, off: r() * 7, rot: r(), tone: 0.72 + r() * 0.4 }); x += 1.3 + r() * 1.9; }
    rows.push({ y0: y, y1: Math.min(D, y + bw), joints }); y += bw; }
  const H = new Float32Array(w * h), N = oak.N;
  const map = canvasTex(THREE, w, h, (d) => {
    let ri = 0;
    for (let py = 0; py < h; py++) {
      const Y = D - (py + 0.5) / ppm;               // texture row 0 = north edge
      ri = rows.findIndex(b => Y >= b.y0 && Y < b.y1);
      const b = rows[Math.max(0, ri)];
      const across = (Y - b.y0) / (b.y1 - b.y0);
      for (let px = 0; px < w; px++) {
        const X = (px + 0.5) / ppm;
        let j = b.joints.length - 1; while (j > 0 && b.joints[j].x > X) j--;
        const J = b.joints[j];
        // sample the oak tile with the grain along X
        const su = mod(Math.floor((across * 0.19 + J.rot) * N), N), sv = mod(Math.floor((X + J.off) * N * 0.7), N);
        const s = (sv * N + su) * 3;
        const edge = Math.min(across, 1 - across) * (b.y1 - b.y0), jd = Math.abs(X - J.x);
        const gap = (edge < 0.0022 ? 0.25 : edge < 0.004 ? 0.7 : 1) * (jd < 0.0022 ? 0.3 : 1);
        const wear = 1 + 0.12 * Math.exp(-Math.pow((Y - D * 0.45) / 1.1, 2)) * Math.exp(-Math.pow((X - W * 0.5) / 1.6, 2));
        const k = J.tone * gap * wear, o = (py * w + px) * 4;
        d[o] = Math.min(255, oak.A[s] * 1.05 * k * 255);
        d[o + 1] = Math.min(255, oak.A[s + 1] * 1.0 * k * 255);
        d[o + 2] = Math.min(255, oak.A[s + 2] * 0.95 * k * 255);
        d[o + 3] = 255;
        H[py * w + px] = gap < 1 ? -1.2 : oak.H[sv * N + su] * 0.4;
      }
    }
  }, { repeat: false });
  return { map, normalMap: normalFrom(THREE, H, w, h, 2.2) };
}

// Plaster (lime, smoke-aged), limestone, brick: all 1 m periodic tiles
function plasterTexture(THREE, N = 512) {
  const H = new Float32Array(N * N);
  const map = canvasTex(THREE, N, N, (d) => {
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const u = x / N, v = y / N;
      const m = fbm(u * 3, v * 3, 3, 3, 4, 3), f = fbm(u * 60, v * 60, 60, 60, 2, 9);
      const k = 0.86 + 0.18 * m + 0.05 * f, o = (y * N + x) * 4;
      d[o] = 150 * k; d[o + 1] = 128 * k; d[o + 2] = 98 * k; d[o + 3] = 255;
      H[y * N + x] = m * 0.6 + f * 0.3;
    }
  });
  return { map, normalMap: normalFrom(THREE, H, N, N, 0.8) };
}
function stoneTexture(THREE, N = 512, base = [118, 108, 90]) {
  const H = new Float32Array(N * N);
  const map = canvasTex(THREE, N, N, (d) => {
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const u = x / N, v = y / N;
      const m = fbm(u * 5, v * 5, 5, 5, 4, 51), f = fbm(u * 80, v * 80, 80, 80, 2, 57);
      const pit = smooth(0.9, 0.97, vnoise(u * 90, v * 90, 90, 90, 61));
      const tool = 0.03 * Math.sin((u * 0.7 + v) * 380 + m * 6);
      const k = (0.84 + 0.26 * m + 0.06 * f + tool) * (1 - 0.18 * pit), o = (y * N + x) * 4;
      d[o] = base[0] * k; d[o + 1] = base[1] * k; d[o + 2] = base[2] * k; d[o + 3] = 255;
      H[y * N + x] = m * 0.4 + f * 0.4 - pit;
    }
  });
  return { map, normalMap: normalFrom(THREE, H, N, N, 1.2) };
}
function brickTexture(THREE, N = 512) {
  // 1 m tile: 4 bricks of 0.25 m per course (incl. joint), 13 courses of ~0.077 m
  const H = new Float32Array(N * N), cw = 0.25, ch = 1 / 13;
  const map = canvasTex(THREE, N, N, (d) => {
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const u = x / N, v = y / N, row = Math.floor(v / ch), off = (row % 2) * cw / 2;
      const bu = mod(u + off, 1), col = Math.floor(bu / cw);
      const lu = (bu - col * cw) / cw, lv = (v - row * ch) / ch;
      const joint = lu < 0.04 || lv < 0.1;
      const t = hash(col, row, 71), m = fbm(u * 20, v * 20, 20, 20, 3, 73);
      const soot = (0.55 + 0.45 * fbm(u * 2, v * 2, 2, 2, 3, 79)) * (0.7 + 0.3 * v);
      const o = (y * N + x) * 4;
      if (joint) { d[o] = 72 * soot; d[o + 1] = 64 * soot; d[o + 2] = 56 * soot; }
      else { const k = (0.6 + 0.45 * t + 0.25 * m) * soot; d[o] = 104 * k; d[o + 1] = 56 * k; d[o + 2] = 40 * k; }
      d[o + 3] = 255; H[y * N + x] = joint ? -1 : m * 0.4;
    }
  });
  return { map, normalMap: normalFrom(THREE, H, N, N, 2.5) };
}
// carved frieze: a running vine with leaves between two fillets, as a height field on oak
function carvedTextures(THREE, oak, len, ht, ppm = 400) {
  const w = Math.round(len * ppm), h = Math.round(ht * ppm), N = oak.N;
  const Hc = new Float32Array(w * h), rep = 0.26;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
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
    const border = (Y < 0.08 || Y > 0.92) ? 1 : 0;
    Hc[y * w + x] = Math.max(hgt, border) * 0.9 + 0.1 * fbm(X * 40, Y * 10, 400, 10, 2, 91);
  }
  const map = canvasTex(THREE, w, h, (d) => {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const s = ((y % N) * N + (x % N)) * 3, k = 0.72 + 0.4 * Hc[y * w + x], o = (y * w + x) * 4;
      d[o] = oak.A[s] * k * 255; d[o + 1] = oak.A[s + 1] * k * 255; d[o + 2] = oak.A[s + 2] * k * 255; d[o + 3] = 255;
    }
  }, { repeat: false });
  return { map, normalMap: normalFrom(THREE, Hc, w, h, 3) };
}
// leaded lights: diamond quarries in lead cames, a shield of arms in the upper lights
function leadedTexture(THREE, wM, hM, shield, seed) {
  const ppm = 300, w = Math.round(wM * ppm), h = Math.round(hM * ppm), qw = 0.085, qh = 0.13;
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d"), r = rng(seed);
  const grad = g.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#f4f6ef"); grad.addColorStop(1, "#dfe6da");
  g.fillStyle = grad; g.fillRect(0, 0, w, h);
  // each quarry a slightly different glass
  for (let j = -1; j < hM / qh * 2 + 2; j++) for (let i = -1; i < wM / qw + 2; i++) {
    const cx = (i + (j % 2) * 0.5) * qw * ppm, cy = j * qh / 2 * ppm;
    g.fillStyle = `rgba(${150 + r() * 60},${170 + r() * 50},${140 + r() * 50},${0.12 + r() * 0.12})`;
    g.beginPath(); g.moveTo(cx, cy - qh / 2 * ppm); g.lineTo(cx + qw / 2 * ppm, cy); g.lineTo(cx, cy + qh / 2 * ppm); g.lineTo(cx - qw / 2 * ppm, cy); g.fill();
  }
  if (shield) {
    const sw = Math.min(w * 0.42, 0.16 * ppm), sh = sw * 1.2, sx = w / 2 - sw / 2, sy = h * 0.28;
    const path = () => { g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + sw, sy); g.lineTo(sx + sw, sy + sh * 0.55); g.quadraticCurveTo(sx + sw, sy + sh * 0.9, sx + sw / 2, sy + sh); g.quadraticCurveTo(sx, sy + sh * 0.9, sx, sy + sh * 0.55); g.closePath(); };
    const cols = shield === 1 ? ["#3a6fb0", "#e6c35a", "#b8322a", "#f0ece0"] : ["#b8322a", "#f0ece0", "#3a6fb0", "#e6c35a"];
    g.save(); path(); g.clip();
    g.fillStyle = cols[0]; g.fillRect(sx, sy, sw / 2, sh / 2); g.fillStyle = cols[1]; g.fillRect(sx + sw / 2, sy, sw / 2, sh / 2);
    g.fillStyle = cols[1]; g.fillRect(sx, sy + sh / 2, sw / 2, sh / 2); g.fillStyle = cols[0]; g.fillRect(sx + sw / 2, sy + sh / 2, sw / 2, sh / 2);
    g.strokeStyle = cols[2]; g.lineWidth = sw * 0.12; g.beginPath(); g.moveTo(sx + sw / 2, sy); g.lineTo(sx + sw / 2, sy + sh); g.moveTo(sx, sy + sh * 0.45); g.lineTo(sx + sw, sy + sh * 0.45); g.stroke();
    g.restore(); g.strokeStyle = "#2a2622"; g.lineWidth = 3; path(); g.stroke();
  }
  // the cames
  g.strokeStyle = "#35302b"; g.lineWidth = 2.6;
  for (let i = -Math.ceil(hM / qh) * 2; i < wM / qw * 2 + hM / qh * 2; i++) {
    const x0 = i * qw / 2 * ppm;
    g.beginPath(); g.moveTo(x0, 0); g.lineTo(x0 + (h / (qh * ppm)) * qw * ppm, h); g.stroke();
    g.beginPath(); g.moveTo(x0, 0); g.lineTo(x0 - (h / (qh * ppm)) * qw * ppm, h); g.stroke();
  }
  g.lineWidth = 6; g.strokeRect(0, 0, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

// ---------------------------------------------------------------- geometry
// offset a polyline by d (positive = to the left of travel, i.e. inward for a CCW loop), mitred
function offsetLine(pts, d, closed) {
  const n = pts.length, out = [];
  const nrm = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; };
  for (let i = 0; i < n; i++) {
    const hasPrev = closed || i > 0, hasNext = closed || i < n - 1;
    const n0 = hasPrev ? nrm(pts[(i - 1 + n) % n], pts[i]) : null, n1 = hasNext ? nrm(pts[i], pts[(i + 1) % n]) : null;
    let m;
    if (n0 && n1) { const k = 1 + n0[0] * n1[0] + n0[1] * n1[1]; m = [(n0[0] + n1[0]) / k, (n0[1] + n1[1]) / k]; }
    else m = n0 || n1;
    out.push([pts[i][0] + m[0] * d, pts[i][1] + m[1] * d]);
  }
  return out;
}
// loft a profile [[offset, depth], ...] along a path: ring k is the path offset by profile[k][0]
// at depth profile[k][1]. Flat-shaded, world-metre UVs on the wall plane.
function loft(THREE, path, profile, closed, cap) {
  const rings = profile.map(([o, z]) => offsetLine(path, o, closed).map(p => [p[0], p[1], z]));
  const pos = [];
  const tri = (a, b, c) => pos.push(...a, ...b, ...c);
  const segs = closed ? path.length : path.length - 1;
  for (let k = 0; k < rings.length - 1; k++) for (let i = 0; i < segs; i++) {
    const j = (i + 1) % path.length, A = rings[k][i], B = rings[k][j], C = rings[k + 1][j], Dd = rings[k + 1][i];
    tri(A, B, C); tri(A, C, Dd);
  }
  if (cap && closed) {
    const last = rings[rings.length - 1], v2 = last.map(p => new THREE.Vector2(p[0], p[1]));
    for (const f of THREE.ShapeUtils.triangulateShape(v2, [])) tri(last[f[0]], last[f[1]], last[f[2]]);
  }
  return finish(THREE, pos);
}
// a horizontal run (skirting, rail, cornice): profile [[dy, depth], ...] swept along r in [a, b]
function run(THREE, a, b, base, profile) {
  const pos = [], tri = (p, q, s) => pos.push(...p, ...q, ...s);
  for (let k = 0; k < profile.length - 1; k++) {
    const [y0, z0] = profile[k], [y1, z1] = profile[k + 1];
    const A = [a, base + y0, z0], B = [b, base + y0, z0], C = [b, base + y1, z1], D = [a, base + y1, z1];
    tri(A, B, C); tri(A, C, D);
  }
  // end caps
  const poly = profile.map(([y, z]) => new THREE.Vector2(z, y));
  for (const f of THREE.ShapeUtils.triangulateShape(poly, [])) {
    const P = f.map(i => profile[i]);
    tri(...[0, 2, 1].map(i => [a, base + P[i][0], P[i][1]]));
    tri(...[0, 1, 2].map(i => [b, base + P[i][0], P[i][1]]));
  }
  return finish(THREE, pos, true);
}
function finish(THREE, pos, uvAlongR = false) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  // world-metre UVs, projected on whichever plane the face is most square to
  const uv = [], nrm = g.attributes.normal.array;
  for (let i = 0; i < pos.length / 3; i++) {
    const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
    const nx = Math.abs(nrm[i * 3]), ny = Math.abs(nrm[i * 3 + 1]);
    if (uvAlongR) uv.push(y + z, x);                 // runs: grain along the run
    else if (nx > 0.7) uv.push(z, y); else if (ny > 0.7) uv.push(x, z); else uv.push(x, y);
  }
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  return g;
}
// a flat polygon in the wall plane (outline, holes) at depth z, world-metre UVs
function slab(THREE, outline, holes = [], z = 0) {
  const s = new THREE.Shape(outline.map(p => new THREE.Vector2(p[0], p[1])));
  for (const h of holes) s.holes.push(new THREE.Path(h.map(p => new THREE.Vector2(p[0], p[1]))));
  const g = new THREE.ShapeGeometry(s); g.translate(0, 0, z);
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i), p.getY(i));
  return g;
}
// boxes: replace the 0..1 face UVs with metres, projected per face
function metric(g) {
  const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i));
    if (nx > 0.7) uv.setXY(i, p.getZ(i), p.getY(i)); else if (ny > 0.7) uv.setXY(i, p.getX(i), p.getZ(i)); else uv.setXY(i, p.getX(i), p.getY(i));
  }
  return g;
}
const rect = (a, b, z0, z1) => [[a, z0], [b, z0], [b, z1], [a, z1]];
// a quad from four 3D points (wall frame), UV by metres along its two edges
function quad(THREE, A, B, C, D) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([...A, ...B, ...C, ...A, ...C, ...D], 3));
  const ab = Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2]), ad = Math.hypot(D[0] - A[0], D[1] - A[1], D[2] - A[2]);
  g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, ab, 0, ab, ad, 0, 0, ab, ad, 0, ad], 2));
  g.computeVertexNormals();
  return g;
}

// ---------------------------------------------------------------- the style: oak panelling, c. 1660
const STYLE = {
  skirting: { top: 0.18, profile: [[0, 0], [0, 0.022], [0.14, 0.022], [0.15, 0.03], [0.165, 0.03], [0.18, 0.012], [0.18, 0]] },
  dado: { base: 0.92, profile: [[0, 0], [0, 0.012], [0.012, 0.024], [0.04, 0.03], [0.065, 0.026], [0.078, 0.012], [0.08, 0]] },
  lower: [0.18, 0.92], upper: [1.0, 2.84],
  frieze: { base: 2.84, profile: [[0, 0], [0, 0.01], [0.012, 0.018], [0.02, 0.012], [0.02, 0.006], [0.1, 0.006], [0.1, 0]] },
  cornice: { base: 2.94, profile: [[0, 0], [0, 0.02], [0.02, 0.035], [0.035, 0.035], [0.06, 0.06], [0.1, 0.1], [0.12, 0.12], [0.135, 0.13], [0.16, 0.13], [0.16, 0]] },
  stile: 0.09, rail: 0.085, bay: 0.52,
  // fielded panel: ovolo sticking down to a flat ground, bevel up to the raised field
  panel: [[0, 0], [0.004, -0.003], [0.01, -0.007], [0.016, -0.012], [0.02, -0.018], [0.036, -0.018], [0.07, -0.007], [0.074, -0.006]],
  casing: [[0, 0], [0, 0.03], [0.012, 0.038], [0.03, 0.042], [0.052, 0.036], [0.07, 0.044], [0.1, 0.04], [0.112, 0.026], [0.118, 0]],
  wallT: 0.32,
};

// ---------------------------------------------------------------- the build
export async function buildProcedural(THREE, schem, onStep = () => {}) {
  const t0 = performance.now();
  const { w: W, d: D, h: H } = schem.room;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07060a);

  onStep("growing oak");
  await new Promise(r => setTimeout(r));
  const oak = oakField(1024);
  const oakV = oakTextures(THREE, oak), oakH = oakTextures(THREE, oak, { rotate: true });
  const M = {
    oak: new THREE.MeshStandardMaterial({ ...oakV, roughness: 0.55, vertexColors: true, normalScale: new THREE.Vector2(0.3, 0.3) }),
    oakH: new THREE.MeshStandardMaterial({ ...oakH, roughness: 0.55, vertexColors: true, normalScale: new THREE.Vector2(0.3, 0.3) }),
    oakDim: new THREE.MeshStandardMaterial({ ...oakV, roughness: 0.7, color: 0x6a6a6a, vertexColors: true }),
  };
  onStep("laying the floor");
  await new Promise(r => setTimeout(r));
  const fl = floorTexture(THREE, oak, W, D, 360);
  M.floor = new THREE.MeshStandardMaterial({ ...fl, roughness: 0.42, normalScale: new THREE.Vector2(0.6, 0.6) });
  onStep("plaster, stone and brick");
  await new Promise(r => setTimeout(r));
  M.plaster = new THREE.MeshStandardMaterial({ ...plasterTexture(THREE), roughness: 0.95 });
  const stone = stoneTexture(THREE);
  M.stone = new THREE.MeshStandardMaterial({ ...stone, roughness: 0.82, normalScale: new THREE.Vector2(0.7, 0.7) });
  M.hearth = new THREE.MeshStandardMaterial({ ...stoneTexture(THREE, 512, [96, 90, 80]), roughness: 0.75 });
  M.brick = new THREE.MeshStandardMaterial({ ...brickTexture(THREE), roughness: 0.9 });
  M.dark = new THREE.MeshStandardMaterial({ color: 0x050403, roughness: 1 });
  M.lead = new THREE.MeshStandardMaterial({ color: 0x2c2824, roughness: 0.6, metalness: 0.3 });

  const CLASS = new Map();       // material object -> class name, filled once M exists
  const cast = (m) => { m.castShadow = true; m.receiveShadow = true; return m; };
  const vr = rng(1660);
  // give a geometry its own cut of the timber (a UV shift) and its own tone (vertex colour)
  const board = (g, spread = 0.22) => {
    const uv = g.attributes.uv, du = vr() * 5, dv = vr() * 5;
    if (uv) for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) + du, uv.getY(i) + dv);
    const k = 1 - spread / 2 + vr() * spread, warm = 1 + (vr() - 0.5) * 0.08;
    const n = g.attributes.position.count, c = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { c[i * 3] = k * warm; c[i * 3 + 1] = k; c[i * 3 + 2] = k / warm; }
    g.setAttribute("color", new THREE.BufferAttribute(c, 3));
    return g;
  };
  for (const [k, v] of Object.entries(M)) CLASS.set(v, k === "oakH" || k === "oakDim" ? "oak" : k);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), M.floor);
  floor.userData = { instance: "floor", material: "floor", owner: "floor" };
  floor.rotation.x = -Math.PI / 2; floor.position.set(W / 2, 0, -D / 2); floor.receiveShadow = true; scene.add(floor);
  const ceilG = new THREE.PlaneGeometry(W, D); { const uv = ceilG.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * W, uv.getY(i) * D); }
  const ceil = new THREE.Mesh(ceilG, M.plaster);
  ceil.userData = { instance: "ceiling", material: "plaster", owner: "ceiling" };
  ceil.rotation.x = Math.PI / 2; ceil.position.set(W / 2, H, -D / 2); ceil.receiveShadow = ceil.castShadow = true; scene.add(ceil);

  const PLACE = { N: { pos: [0, 0, -D], rot: 0 }, S: { pos: [W, 0, 0], rot: Math.PI }, E: { pos: [W, 0, -D], rot: -Math.PI / 2 }, W: { pos: [0, 0, 0], rot: Math.PI / 2 } };
  const lights = [];
  let parts = 0;

  onStep("raising the walls");
  await new Promise(r => setTimeout(r));
  for (const [F, elems] of Object.entries(schem.walls)) {
    const L = F === "N" || F === "S" ? W : D;
    const grp = new THREE.Group();
    let ctx = "panelling"; const count = {};
    const add = (g, m, spread) => {
      if (m.vertexColors) board(g, spread);
      const mesh = cast(new THREE.Mesh(g, m)); grp.add(mesh); parts++;
      count[ctx] = (count[ctx] || 0) + 1;
      mesh.userData = { instance: `${F}/${ctx}/${count[ctx]}`, material: CLASS.get(m) || m.userData.cls || "other", owner: F };
      return mesh;
    };

    // what interrupts the panelling: [a, b] x [z0, z1] boxes
    const obst = [];
    for (const e of elems) {
      if (e.kind === "door") obst.push({ a: e.r0 - 0.12, b: e.r1 + 0.12, z0: 0, z1: e.top + 0.12 });
      if (e.kind === "window") obst.push({ a: e.r0, b: e.r1, z0: e.sill, z1: e.top });
      if (e.kind === "chimneypiece") { obst.push({ a: e.r0, b: e.r1, z0: 0, z1: e.surround_top }); obst.push({ a: e.mantel.r0, b: e.mantel.r1, z0: e.surround_top, z1: e.mantel.top }); }
    }
    const free = (z0, z1) => {
      const cuts = obst.filter(o => o.z0 < z1 && o.z1 > z0).map(o => [o.a, o.b]).sort((p, q) => p[0] - q[0]);
      const out = []; let x = 0;
      for (const [a, b] of cuts) { if (a > x) out.push([x, a]); x = Math.max(x, b); }
      if (x < L) out.push([x, L]);
      return out.filter(([a, b]) => b - a > 0.02);
    };
    const fields = [];
    for (const [z0, z1] of [STYLE.lower, STYLE.upper]) for (const [a, b] of free(z0, z1)) fields.push({ a, b, z0, z1 });
    // above an obstacle that stops short of the zone's top: its own run of panels (overmantel, over-door)
    for (const o of obst) {
      const z1 = STYLE.upper[1];
      if (o.z1 > z1 - 0.2 || obst.some(p => p !== o && p.z0 >= o.z1 - 0.01 && p.a < o.b && p.b > o.a)) continue;
      fields.push({ a: o.a, b: o.b, z0: o.z1 + 0.03, z1 });
    }
    // backing: the stiles and rails are the wall's own face; openings cut through it
    const holes = [], notches = [];
    for (const e of elems) {
      if (e.kind === "window") holes.push(rect(e.r0, e.r1, e.sill, e.top));
      if (e.kind === "door") notches.push([e.r0, e.r1, e.top]);
      if (e.kind === "chimneypiece") notches.push([e.firebox.r0, e.firebox.r1, e.firebox.apex]);
    }
    const outline = [[0, 0]];
    for (const [a, b, t] of notches.sort((p, q) => p[0] - q[0])) outline.push([a, 0], [a, t], [b, t], [b, 0]);
    outline.push([L, 0], [L, H], [0, H]);
    // the panels: each sinks behind the stiles-and-rails face through its own opening in it
    const panelRects = [];
    for (const f of fields) {
      const span = f.b - f.a, n = Math.max(1, Math.round((span - STYLE.stile) / (STYLE.bay + STYLE.stile)));
      const pw = (span - (n + 1) * STYLE.stile) / n;
      if (pw < 0.12 || f.z1 - f.z0 < 0.2) continue;
      for (let i = 0; i < n; i++) {
        const a = f.a + STYLE.stile + i * (pw + STYLE.stile);
        const path = rect(a, a + pw, f.z0 + STYLE.rail, f.z1 - STYLE.rail);
        add(loft(THREE, path, STYLE.panel, true, true), M.oak, 0.34);
        panelRects.push(path);
      }
    }
    add(slab(THREE, outline, [...holes, ...panelRects]), M.oak, 0.02);
    // the wall's core: a hidden face just behind the panels, run past the corners, under the floor and
    // over the ceiling, so no seam in the visible faces can ever show through to nothing
    ctx = "core";
    const X = 0.04, core = [[-X, -X]];
    for (const [a, b, t] of notches) core.push([a, -X], [a, t], [b, t], [b, -X]);
    core.push([L + X, -X], [L + X, H + X], [-X, H + X]);
    add(slab(THREE, core, holes, -0.03), M.oak, 0.02);
    // horizontal runs, broken where something stands in their way
    ctx = "skirting";
    for (const [a, b] of free(0, STYLE.skirting.top)) add(run(THREE, a, b, 0, STYLE.skirting.profile), M.oak);
    ctx = "dado";
    for (const [a, b] of free(STYLE.dado.base, STYLE.dado.base + 0.08)) add(run(THREE, a, b, STYLE.dado.base, STYLE.dado.profile), M.oak);
    ctx = "frieze"; add(run(THREE, 0, L, STYLE.frieze.base, STYLE.frieze.profile), M.oak);
    ctx = "cornice"; add(run(THREE, 0, L, STYLE.cornice.base, STYLE.cornice.profile), M.oak);

    for (const e of elems) {
      ctx = e.id;
      if (e.kind === "door") {
        const T = STYLE.wallT, t = e.top;
        // architrave round three sides, lofted outward from the opening
        add(loft(THREE, [[e.r0, 0], [e.r0, t], [e.r1, t], [e.r1, 0]], STYLE.casing, false, false), M.oak);
        // lining through the wall, and a dark passage beyond
        add(quad(THREE, [e.r0, 0, 0], [e.r0, 0, -T], [e.r0, t, -T], [e.r0, t, 0]), M.oak);
        add(quad(THREE, [e.r1, 0, -T], [e.r1, 0, 0], [e.r1, t, 0], [e.r1, t, -T]), M.oak);
        add(quad(THREE, [e.r0, t, 0], [e.r0, t, -T], [e.r1, t, -T], [e.r1, t, 0]), M.oak);
        add(quad(THREE, [e.r0, 0.001, -T], [e.r0, 0.001, 0], [e.r1, 0.001, 0], [e.r1, 0.001, -T]), M.floor);
        const P = 1.8;
        add(quad(THREE, [e.r0, 0, -T], [e.r0, 0, -T - P], [e.r0, t, -T - P], [e.r0, t, -T]), M.oakDim);
        add(quad(THREE, [e.r1, 0, -T - P], [e.r1, 0, -T], [e.r1, t, -T], [e.r1, t, -T - P]), M.oakDim);
        add(quad(THREE, [e.r0, t, -T], [e.r0, t, -T - P], [e.r1, t, -T - P], [e.r1, t, -T]), M.oakDim);
        add(quad(THREE, [e.r0, 0.001, -T - P], [e.r0, 0.001, -T], [e.r1, 0.001, -T], [e.r1, 0.001, -T - P]), M.oakDim);
        add(quad(THREE, [e.r0, 0, -T - P], [e.r1, 0, -T - P], [e.r1, t, -T - P], [e.r0, t, -T - P]), M.dark);
        // a dark sleeve just outside the lining and passage, so their shared edges never open onto nothing
        ctx = e.id + "/sleeve";
        { const g = new THREE.BoxGeometry(e.r1 - e.r0 + 0.08, t + 0.08, T + P + 0.04); g.translate((e.r0 + e.r1) / 2, t / 2, -(T + P) / 2 - 0.01);
          const sl = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x050403, roughness: 1, side: THREE.BackSide })); grp.add(sl);
          sl.userData = { instance: `${F}/${e.id}/sleeve`, material: "dark", owner: F }; }
        ctx = e.id;
      }
      if (e.kind === "window") {
        const T = STYLE.wallT, sp = e.splay, G = -T;
        const o = [[e.r0, e.sill], [e.r1, e.sill], [e.r1, e.top], [e.r0, e.top]];
        const i = [[e.r0 + sp, e.sill], [e.r1 - sp, e.sill], [e.r1 - sp, e.top - 0.08], [e.r0 + sp, e.top - 0.08]];
        // splayed reveals and sill
        add(quad(THREE, [...o[0], 0], [...i[0], G], [...i[3], G], [...o[3], 0]), M.oak);
        add(quad(THREE, [...i[1], G], [...o[1], 0], [...o[2], 0], [...i[2], G]), M.oak);
        add(quad(THREE, [...o[2], 0], [...o[3], 0], [...i[3], G], [...i[2], G]), M.oak);
        add(quad(THREE, [...o[0], 0], [...o[1], 0], [...i[1], G], [...i[0], G]), M.oakH);
        // the frame, a mullion and a transom, and the leaded lights between them
        const fr = rect(i[0][0], i[1][0], i[0][1], i[2][1]);
        add(loft(THREE, fr, [[0, G], [0, G + 0.03], [0.05, G + 0.03], [0.055, G]], true, false), M.oak);
        const gx0 = i[0][0] + 0.055, gx1 = i[1][0] - 0.055, gy0 = i[0][1] + 0.055, gy1 = i[2][1] - 0.055;
        const mx = (gx0 + gx1) / 2, ty = gy0 + (gy1 - gy0) * 0.62, mw = 0.028;
        const box = (a, b, y0, y1) => { const g = metric(new THREE.BoxGeometry(b - a, y1 - y0, 0.05)); g.translate((a + b) / 2, (y0 + y1) / 2, G + 0.02); add(g, b - a > y1 - y0 ? M.oakH : M.oak); };
        box(mx - mw, mx + mw, gy0, gy1); box(gx0, gx1, ty - mw, ty + mw);
        const lightsIn = [[gx0, mx - mw, ty + mw, gy1, 1], [mx + mw, gx1, ty + mw, gy1, 2], [gx0, mx - mw, gy0, ty - mw, 0], [mx + mw, gx1, gy0, ty - mw, 0]];
        lightsIn.forEach(([a, b, y0, y1, sh], k) => {
          const g = new THREE.PlaneGeometry(b - a, y1 - y0); g.translate((a + b) / 2, (y0 + y1) / 2, G - 0.005);
          const m = new THREE.MeshBasicMaterial({ map: leadedTexture(THREE, b - a, y1 - y0, sh, 100 + k + parts), color: new THREE.Color(2.1, 2.1, 2.0) });
          const glass = new THREE.Mesh(g, m); grp.add(glass);
          glass.userData = { instance: `${F}/${e.id}/glass${k + 1}`, material: "glass", owner: F };
        });
        ctx = e.id + "/glassback";
        { const g = new THREE.PlaneGeometry(i[1][0] - i[0][0], i[2][1] - i[0][1]); g.translate((i[0][0] + i[1][0]) / 2, (i[0][1] + i[2][1]) / 2, G - 0.03);
          const pane = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: new THREE.Color(2.0, 2.0, 1.9) })); grp.add(pane);
          pane.userData = { instance: `${F}/${e.id}/glassback`, material: "glass", owner: F }; }
        ctx = e.id;
        // daylight through the glass: an area light filling the opening, facing the room
        const al = new THREE.RectAreaLight(0xfff0dc, 5.5, gx1 - gx0, gy1 - gy0);
        al.position.set(mx, (gy0 + gy1) / 2, G + 0.06); al.lookAt(mx, (gy0 + gy1) / 2, 5);
        grp.add(al); lights.push(al);
      }
      if (e.kind === "chimneypiece") {
        const fb = e.firebox, cx = (fb.r0 + fb.r1) / 2, half = (fb.r1 - fb.r0) / 2;
        // four-centred (Tudor) arch: quarter-ish arcs off the springing, flat-pointed at the apex
        const arch = [], rr = 0.16;
        for (let k = 1; k <= 8; k++) { const f = k / 8 * Math.PI / 3; arch.push([fb.r0 + rr - rr * Math.cos(f), fb.spring + rr * Math.sin(f)]); }
        const [sx, sy] = arch[arch.length - 1];
        for (let k = 1; k <= 6; k++) { const a = k / 6; arch.push([sx + (cx - sx) * a, sy + (fb.apex - sy) * (1 - (1 - a) * (1 - a) * 0.15) * a / (a + 0.0001) * (0.85 + 0.15 * a)]); }
        const archR = arch.slice(0, -1).reverse().map(([x, y]) => [2 * cx - x, y]);
        const opening = [[fb.r0, 0], [fb.r0, fb.spring], ...arch, ...archR, [fb.r1, fb.spring], [fb.r1, 0]];
        const SD = 0.12;
        // the stone surround: a slab notched by the opening grown 5 cm, and a chamfer lofted back to it
        const grown = offsetLine(opening, 0.05, false);
        const outline = [[e.r0, 0], [grown[0][0], 0], ...grown.slice(1, -1), [grown[grown.length - 1][0], 0], [e.r1, 0], [e.r1, e.surround_top], [e.r0, e.surround_top]];
        add(slab(THREE, outline, [], SD), M.stone);
        add(loft(THREE, opening, [[0, 0.0], [0, 0.07], [0.05, SD]], false, false), M.stone);
        add(quad(THREE, [e.r0, 0, 0], [e.r0, 0, SD], [e.r0, e.surround_top, SD], [e.r0, e.surround_top, 0]), M.stone);
        add(quad(THREE, [e.r1, 0, SD], [e.r1, 0, 0], [e.r1, e.surround_top, 0], [e.r1, e.surround_top, SD]), M.stone);
        // the mantel: a carved frieze between fillets, a shelf over it
        const m = e.mantel, mh = m.top - e.surround_top - 0.1, fz = m.depth;
        const body = metric(new THREE.BoxGeometry(m.r1 - m.r0, m.top - e.surround_top - 0.1, fz));
        body.translate((m.r0 + m.r1) / 2, e.surround_top + mh / 2, fz / 2);
        add(body, M.oakH);
        const carv = carvedTextures(THREE, oak, m.r1 - m.r0 - 0.5, mh * 0.62);
        const cg = new THREE.PlaneGeometry(m.r1 - m.r0 - 0.5, mh * 0.62); cg.translate((m.r0 + m.r1) / 2, e.surround_top + mh * 0.5, fz + 0.002);
        const carvM = new THREE.MeshStandardMaterial({ ...carv, roughness: 0.5, normalScale: new THREE.Vector2(1, 1) }); carvM.userData.cls = "oak_carved";
        add(cg, carvM);
        for (const x of [m.r0 + 0.13, m.r1 - 0.13]) {         // a boss at each end
          const b = metric(new THREE.BoxGeometry(0.18, mh * 0.62, 0.03)); b.translate(x, e.surround_top + mh * 0.5, fz + 0.015); add(b, M.oak);
          const r = loft(THREE, rect(x - 0.07, x + 0.07, e.surround_top + mh * 0.5 - 0.07, e.surround_top + mh * 0.5 + 0.07), [[0, fz + 0.03], [0.02, fz + 0.045], [0.05, fz + 0.035], [0.07, fz + 0.05]], true, true);
          add(r, M.oak);
        }
        const shelf = run(THREE, m.r0 - 0.05, m.r1 + 0.05, m.top - 0.1, [[0, 0], [0, fz + 0.01], [0.02, fz + 0.03], [0.05, fz + 0.05], [0.08, fz + 0.07], [0.1, fz + 0.07], [0.1, 0]]);
        add(shelf, M.oak);
        // the firebox: brick, splayed, sooted, going back into the wall
        const bd = fb.depth, bs = 0.16, top = fb.apex;
        add(quad(THREE, [fb.r0, 0, 0], [fb.r0 + bs, 0, -bd], [fb.r0 + bs, top, -bd], [fb.r0, top, 0]), M.brick);
        add(quad(THREE, [fb.r1 - bs, 0, -bd], [fb.r1, 0, 0], [fb.r1, top, 0], [fb.r1 - bs, top, -bd]), M.brick);
        add(quad(THREE, [fb.r0 + bs, 0, -bd], [fb.r1 - bs, 0, -bd], [fb.r1 - bs, top, -bd], [fb.r0 + bs, top, -bd]), M.brick);
        add(quad(THREE, [fb.r1, top, 0], [fb.r0, top, 0], [fb.r0 + bs, top, -bd], [fb.r1 - bs, top, -bd]), M.dark);
        add(quad(THREE, [fb.r0 + bs, 0.002, -bd], [fb.r0, 0.002, 0], [fb.r1, 0.002, 0], [fb.r1 - bs, 0.002, -bd]), M.hearth);
        // the hearth stone, proud of the floor
        const h = e.hearth, hg = metric(new THREE.BoxGeometry(h.r1 - h.r0, 0.035, h.out + SD));
        hg.translate((h.r0 + h.r1) / 2, 0.0175, (h.out + SD) / 2);
        add(hg, M.hearth);
      }
    }
    grp.position.set(...PLACE[F].pos); grp.rotation.y = PLACE[F].rot;
    scene.add(grp);
  }

  // the light: a low sun through the south windows, sky fill through the glass, and the room's own bounce
  const sun = new THREE.DirectionalLight(0xffe2b8, 2.6);
  sun.position.set(W * 0.5 + 2.5, 3.8, 5.5); sun.target.position.set(W * 0.45, 0, -D * 0.45);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
  Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 0.5, far: 20 });
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(0x9a8a78, 0x2a1a0e, 0.55); scene.add(hemi);
  const bounce = new THREE.PointLight(0xffc890, 0.9, 7, 1.6); bounce.position.set(W / 2, 1.0, -1.2); scene.add(bounce);

  return { scene, lights: { sun, hemi, bounce, areas: lights }, stats: { parts, ms: Math.round(performance.now() - t0) } };
}
