// Zero-asset room: every surface of the muniment room built from its schematic in code.
// No mesh, no texture file, no prompt. Materials are generated on load from noise; mouldings
// are 2D profiles lofted along paths; light comes in through the windows.
//
//   buildProcedural(THREE, schematic) -> { scene, lights, stats }
//
// Frames: plan metres X east, Y north; three x = X, z = -Y, y up. Each wall is built in its
// own frame (r along the wall from the left corner as you face it, z up, +depth toward the
// room) and then turned into place, exactly as the painted shell is.

// ---------------------------------------------------------------- noise (texgen.js: pure, so the workers share it)
import { hash, mod, vnoise, fbm, smooth, rng } from "./texgen.js";
import { kitTexture, deferTextures, settled, drawn, mainOak, warmTextures, TEX_HALF } from "./texjobs.js";

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
// Each texture is a recipe for the kit's texture jobs (texjobs.js): its pixels drawn by texgen.js's
// generator of the same name (the code that stood here until 2026-10-07, moved unchanged), in a pool of
// workers or, when asked for at once, here; mode is "async", "sync" or (by default) "auto", which is
// async only while a page has deferred its textures (makeKit's defer). Each call makes its own texture
// objects, as before; the pixels are drawn once per recipe and shared.
const OAK_N = 1024;                       // the oak field every oak texture, the floor and the carving sample
// Oak: a 1 m periodic tile, grain running along v (rotate: across it); quarter-sawn English oak
function oakTextures(THREE, { tint = [1, 1, 1], rotate = false } = {}, mode) {
  return kitTexture(THREE, { gen: "oak", args: [OAK_N, rotate, tint] }, { mode });
}
// Floor: boards running east-west, 160-240 mm wide, butt-jointed at random lengths, W x D metres at ppm
// (periodic: a tile, every row's boards wrapping round its edge)
function floorTexture(THREE, W, D, ppm, periodic = false, mode) {
  return kitTexture(THREE, { gen: "floor", args: [W, D, ppm, !!periodic, OAK_N] }, { repeat: !!periodic, mode });
}
// Plaster (lime, smoke-aged), limestone, flags, brick: all periodic tiles
function plasterTexture(THREE, N = 512, mode) { return kitTexture(THREE, { gen: "plaster", args: [N] }, { mode }); }
function stoneTexture(THREE, N = 512, base = [118, 108, 90], blots = true, mode) { return kitTexture(THREE, { gen: "stone", args: [N, base, !!blots] }, { mode }); }
function flagTexture(THREE, N = 768, mode) { return kitTexture(THREE, { gen: "flag", args: [N] }, { mode }); }
function brickTexture(THREE, N = 512, mode) { return kitTexture(THREE, { gen: "brick", args: [N] }, { mode }); }
// carved frieze: a running vine with leaves between two fillets, as a height field on oak (one per size)
const CARVED = new Map();
function carvedTextures(THREE, oak, len, ht, ppm = 400) {
  const key = `${len.toFixed(2)}x${ht.toFixed(3)}`;
  if (!CARVED.has(key)) CARVED.set(key, kitTexture(THREE, { gen: "carved", args: [len, ht, ppm, OAK_N] }, { repeat: false }));
  return CARVED.get(key);
}
// leaded lights: diamond quarries in lead cames, a shield of arms in the upper lights
const LEADED = new Map();
function leadedTexture(THREE, wM, hM, shield, seed) {
  const key = `${wM.toFixed(2)}x${hM.toFixed(2)}/${shield}`;
  if (LEADED.has(key)) return LEADED.get(key);
  const t = leadedTextureNew(THREE, wM, hM, shield, seed); LEADED.set(key, t); return t;
}
function leadedTextureNew(THREE, wM, hM, shield, seed) {
  const ppm = 300, w = Math.round(wM * ppm), h = Math.round(hM * ppm), qw = 0.085, qh = 0.13;
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d"), r = rng(seed);
  const grad = g.createLinearGradient(0, 0, 0, h);            // v2: crown glass is hazy, not white
  grad.addColorStop(0, "rgba(236,240,232,0.16)"); grad.addColorStop(1, "rgba(214,224,208,0.2)");
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
    const cols = shield === 1 ? ["#4d6a8c", "#c7ad6a", "#94443a", "#ddd8cc"] : ["#94443a", "#ddd8cc", "#4d6a8c", "#c7ad6a"];   // stained glass, aged: muted
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
// what lies beyond the south windows: sky, a far line of trees, a lawn, soft and low in detail
function outsideTexture(THREE, mode) { return kitTexture(THREE, { gen: "outside", args: [] }, { repeat: false, mode }).map; }

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
// a mirror image of a geometry: scaled by -1 on an odd number of axes, its triangles turned back round so
// they still face outward (a scale alone leaves them wound inside out: culled from the front, drawn from
// behind and unlit, black; the panelled door's back, 2026-10-06)
function mirror(g, sx = 1, sy = 1, sz = 1) {
  g.scale(sx, sy, sz);
  if (sx * sy * sz < 0) {
    if (g.index) { const a = g.index.array; for (let i = 0; i < a.length; i += 3) { const t = a[i + 1]; a[i + 1] = a[i + 2]; a[i + 2] = t; } g.index.needsUpdate = true; }
    else for (const at of Object.values(g.attributes)) { const a = at.array, n = at.itemSize;
      for (let i = 0; i < at.count; i += 3) for (let k = 0; k < n; k++) { const p = (i + 1) * n + k, q = (i + 2) * n + k, t = a[p]; a[p] = a[q]; a[q] = t; } at.needsUpdate = true; }
  }
  return g;
}

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
    // and its base, wound the other way, so the field is a closed solid (src/make/mesh-rules.js)
    const first = rings[0], u2 = first.map(p => new THREE.Vector2(p[0], p[1]));
    for (const f of THREE.ShapeUtils.triangulateShape(u2, [])) tri(first[f[0]], first[f[2]], first[f[1]]);
  }
  return finish(THREE, pos);
}
// a horizontal run (skirting, rail, cornice): profile [[dy, depth], ...] swept along r in [a, b]
// ma, mb: a mitred end at a corner (Kabe, 2026-10-06, faces that flicker): a point of the profile standing z proud of
// the wall ends z * m along from the run's end, so two walls' runs meet on the corner's bisector instead of lying one
// over the other (m = 1 for a square inside corner; for a corner of any angle, 1 / tan(half its inside angle))
function run(THREE, a, b, base, profile, ma = 0, mb = 0) {
  const pos = [], tri = (p, q, s) => pos.push(...p, ...q, ...s), ra = (z) => a + z * ma, rb = (z) => b - z * mb;
  // round the whole profile, its back (last point to first) included, so the moulding is a closed solid;
  // the sides wound by which way the profile runs, so they always face out (src/make/mesh-rules.js)
  let turn = 0; for (let k = 0; k < profile.length; k++) { const [y0, z0] = profile[k], [y1, z1] = profile[(k + 1) % profile.length]; turn += z0 * y1 - z1 * y0; }
  for (let k = 0; k < profile.length; k++) {
    const [y0, z0] = profile[k], [y1, z1] = profile[(k + 1) % profile.length];
    if (y0 === y1 && z0 === z1) continue;
    const A = [ra(z0), base + y0, z0], B = [rb(z0), base + y0, z0], C = [rb(z1), base + y1, z1], D = [ra(z1), base + y1, z1];
    if (turn > 0) { tri(A, B, C); tri(A, C, D); } else { tri(A, C, B); tri(A, D, C); }
  }
  // end caps, facing out along the run (they were wound inward, and so never drawn, until 2026-10-06)
  const poly = profile.map(([y, z]) => new THREE.Vector2(z, y));
  for (const f of THREE.ShapeUtils.triangulateShape(poly, [])) {
    const P = f.map(i => profile[i]);
    tri(...[0, 1, 2].map(i => [ra(P[i][1]), base + P[i][0], P[i][1]]));
    tri(...[0, 2, 1].map(i => [rb(P[i][1]), base + P[i][0], P[i][1]]));
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
// any geometry: metre UVs projected per face (normals must exist)
function metricAny(g) {
  if (!g.attributes.normal) g.computeVertexNormals();
  return metric(g);
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

// ---------------------------------------------------------------- v2 helpers
// grime and soot in world space: scuffed low on the walls, smoke under the ceiling, and (for the
// chimney-piece's stone) a soot plume over the fire opening. soot = [x, y, rx, ry, strength]
function grime(THREE, mat, soot = null, walls = true) {
  mat.userData.grime = { soot, walls };                       // for the WebGPU path (src/make/nodes.js), which reads this instead
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uSoot = { value: new THREE.Vector4(...(soot ? soot.slice(0, 4) : [0, 0, 1, 1])) };
    sh.uniforms.uSootK = { value: soot ? soot[4] : 0 };
    sh.uniforms.uWalls = { value: walls ? 1 : 0 };
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vGW;")
      .replace("#include <project_vertex>", "#include <project_vertex>\nvGW = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", `#include <common>
        varying vec3 vGW; uniform vec4 uSoot; uniform float uSootK; uniform float uWalls;
        float hh3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
        float vn3(vec3 x) { vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(hh3(i), hh3(i + vec3(1,0,0)), f.x), mix(hh3(i + vec3(0,1,0)), hh3(i + vec3(1,1,0)), f.x), f.y),
                     mix(mix(hh3(i + vec3(0,0,1)), hh3(i + vec3(1,0,1)), f.x), mix(hh3(i + vec3(0,1,1)), hh3(i + vec3(1,1,1)), f.x), f.y), f.z); }`)
      .replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>
        roughnessFactor = clamp(roughnessFactor * (0.8 + 0.4 * vn3(vGW * 2.3 + 7.0)), 0.2, 1.0);   // wax worn unevenly`)
      .replace("#include <color_fragment>", `#include <color_fragment>
        mat3 prot = mat3(0.80, 0.36, -0.48, -0.60, 0.48, -0.64, 0.0, 0.80, 0.60);                           // turn the noise lattice off every axis
        float pat = 0.9 + 0.13 * vn3(prot * vGW * 1.6) + 0.05 * vn3(prot * vGW * 5.3 + 3.0);             // patina: each stretch of wood its own age
        diffuseColor.rgb *= pat;
        float g = 1.0 - uWalls * (0.16 * (1.0 - smoothstep(0.0, 0.55, vGW.y)) + 0.12 * smoothstep(2.3, 3.1, vGW.y));
        vec2 sd = (vGW.xy - uSoot.xy) / uSoot.zw;
        g *= 1.0 - uSootK * exp(-dot(sd, sd));
        diffuseColor.rgb *= g;`);
  };
  mat.customProgramCacheKey = () => "grime2" + (soot ? "s" : "") + (walls ? "w" : "");
  return mat;
}
// the carved vine and leaves as a height, X metres along the band, Y 0..1 up it
function carveHeight(X, Y, rep = 0.11) {
  // a hand-cut vine: each repeat swings a little differently, and its leaves come and go
  const cell = Math.floor(X / rep), amp = 0.17 + 0.1 * hash(cell, 3, 71), ph = (X / rep) * Math.PI * 2 + 0.6 * (hash(cell, 5, 73) - 0.5);
  const vine = 0.5 + amp * Math.sin(ph) + 0.03 * Math.sin(X * 37);
  // curls off the stem at each crest, and small leaves between: the density of acanthus, not a line
  let curl = 0;
  for (const k of [0.25, 0.75]) {
    const ccx = (cell + k) * rep, ccy = k < 0.5 ? 0.7 : 0.3, dx = (X - ccx) / rep, dy = (Y - ccy) / 0.5;
    const rr = Math.hypot(dx, dy), th = Math.atan2(dy, dx) + (k < 0.5 ? 1 : -1) * rr * 14;
    curl = Math.max(curl, Math.exp(-Math.pow((rr - 0.12) / 0.04, 2)) * (0.6 + 0.4 * Math.cos(th * 3)) * (rr < 0.2 ? 1 : 0));
  }
  let hgt = Math.max(curl, Math.exp(-Math.pow(Math.abs(Y - vine) / (0.05 + 0.02 * hash(cell, 7, 79)), 2)));
  for (const k of [0.25, 0.75]) {
    if (hash(cell, k * 8, 83) < 0.18) continue;                       // a leaf the carver left out
    const cx = (cell + k + 0.08 * (hash(cell, k * 4, 89) - 0.5)) * rep, cy = k < 0.5 ? 0.78 : 0.22;
    const sz = 0.8 + 0.4 * hash(cell, k * 6, 97);
    const ex = (X - cx) / (rep * 0.2 * sz), ey = (Y - cy) / (0.14 * sz);
    hgt = Math.max(hgt, (1 - Math.min(1, ex * ex + ey * ey)) * (0.75 + 0.25 * Math.cos(ex * 6 + hash(cell, 9, 101) * 3)));
  }
  // the tool's own texture: veins and nicks in every leaf, so the band reads as carving, not a line
  const cut = hgt > 0.2 ? 0.22 * (vnoise(X * 90, Y * 14, 100000, 100000, 111) - 0.5) : 0;
  return (Y < 0.08 || Y > 0.92) ? 1 : Math.max(0, hgt + cut);
}
// keep the part of a polygon between x = xa and x = xb (Sutherland-Hodgman, two half-planes)
function clipX(poly, xa, xb) {
  const cut = (pts, keep, at) => {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const P = pts[i], Q = pts[(i + 1) % pts.length], kp = keep(P), kq = keep(Q);
      if (kp) out.push(P);
      if (kp !== kq) { const t = (at - P[0]) / (Q[0] - P[0]); out.push([at, P[1] + t * (Q[1] - P[1])]); }
    }
    return out;
  };
  return cut(cut(poly, p => p[0] >= xa, xa), p => p[0] <= xb, xb);
}
// a dressed stone or timber block: the outline inset by its bevel, extruded, the face at zFront
function block(THREE, poly, zFront, depth, bevel = 0.007) {
  const inner = offsetLine(poly, bevel + 0.002, true);
  const shape = new THREE.Shape(inner.map(p => new THREE.Vector2(p[0], p[1])));
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 6 });
  g.translate(0, 0, zFront - depth - bevel);
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

// ---------------------------------------------------------------- the kit
// Everything a room is made from, built once: materials grown from noise, and the helpers that give
// each part its own cut of timber. floor = [W, D] for a floor texture sized to one room, or null for a
// 4 m periodic tile (a house of many rooms).
// The textures are drawn in the kit's workers (texjobs.js), all at once, and kept for the next visit.
// By default makeKit waits for them, so its materials are whole when it returns; textures asked for later
// (a wall's carving, the strongroom's) are drawn on the main thread as before. defer: true returns at
// once, the materials' textures filling as their pixels arrive, and everything asked for until the page
// awaits K.ready() is drawn in the workers too, alongside the building; K.ready() resolves when every
// texture is whole (draw nothing before), and ends the deferring.
export async function makeKit(THREE, { floor = null, onStep = () => {}, defer = false } = {}) {
  onStep("growing oak");
  if (defer) deferTextures(true);
  const starting = warmTextures(), A = "async";
  // the floor first: the largest, drawn in bands across the pool
  // (a phone, TEX_HALF: the floor at half density, 180 px/m: 1440² for the manor's 8 m floor, not 2880², 88 MB of 196 MB with mips)
  const fl = floor ? floorTexture(THREE, floor[0], floor[1], TEX_HALF ? 180 : 360, floor[2], A) : floorTexture(THREE, 4, 4, TEX_HALF ? 128 : 256, true, A);
  const oakV = oakTextures(THREE, {}, A), oakH = oakTextures(THREE, { rotate: true }, A);
  const M = {
    oak: grime(THREE, new THREE.MeshStandardMaterial({ ...oakV, roughness: 0.6, vertexColors: true, normalScale: new THREE.Vector2(0.18, 0.18) })),
    oakH: grime(THREE, new THREE.MeshStandardMaterial({ ...oakH, roughness: 0.6, vertexColors: true, normalScale: new THREE.Vector2(0.18, 0.18) })),
    oakDim: new THREE.MeshStandardMaterial({ ...oakV, roughness: 0.7, color: 0x6a6a6a, vertexColors: true, emissive: 0x0a0604, emissiveIntensity: 1 }),
  };
  M.floor = new THREE.MeshStandardMaterial({ ...fl, roughness: 0.64, normalScale: new THREE.Vector2(0.4, 0.4) });
  M.plaster = new THREE.MeshStandardMaterial({ ...plasterTexture(THREE, 512, A), roughness: 0.95 });
  const stone = stoneTexture(THREE, 512, [118, 108, 90], true, A);
  M.stone = new THREE.MeshStandardMaterial({ ...stone, roughness: 0.82, normalScale: new THREE.Vector2(0.7, 0.7) });
  M.hearth = new THREE.MeshStandardMaterial({ ...stoneTexture(THREE, 512, [96, 90, 80], true, A), roughness: 0.75 });
  M.brick = new THREE.MeshStandardMaterial({ ...brickTexture(THREE, 512, A), roughness: 0.9 });
  M.dark = new THREE.MeshStandardMaterial({ color: 0x050403, roughness: 1 });
  M.lead = new THREE.MeshStandardMaterial({ color: 0x2c2824, roughness: 0.6, metalness: 0.3 });

  const CLASS = new Map();       // material object -> class name, filled once M exists
  const cast = (m) => { m.castShadow = true; m.receiveShadow = true; return m; };
  const vr = rng(1660);
  // give a geometry its own cut of the timber (a UV shift) and its own tone (vertex colour)
  const board = (g, spread = 0.22) => {
    const uv = g.attributes.uv, du = vr() * 5, dv = vr() * 5;
    // each member its own cut: grain phase, grain scale across and along, and a slight slope of the grain
    const su = 0.75 + vr() * 0.55, sv = 0.8 + vr() * 0.5, slope = (vr() - 0.5) * 0.08;
    if (uv) for (let i = 0; i < uv.count; i++) { const x = uv.getX(i), y = uv.getY(i); uv.setXY(i, x * su + y * slope + du, y * sv + dv); }
    const k = 1 - spread / 2 + vr() * spread, warm = 1 + (vr() - 0.5) * 0.08;
    const n = g.attributes.position.count, c = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { c[i * 3] = k * warm; c[i * 3 + 1] = k; c[i * 3 + 2] = k / warm; }
    g.setAttribute("color", new THREE.BufferAttribute(c, 3));
    return g;
  };
  M.limewash = new THREE.MeshStandardMaterial({ ...plasterTexture(THREE, 512, A), roughness: 0.97, color: new THREE.Color(1.12, 1.1, 1.04) });
  M.flags = new THREE.MeshStandardMaterial({ ...flagTexture(THREE, 768, A), roughness: 0.8 });
  for (const [k, v] of Object.entries(M)) CLASS.set(v, k === "oakH" || k === "oakDim" ? "oak" : k);
  const K = { M, CLASS, cast, board, parts: 0, ready: async () => { await settled(); deferTextures(false); } };
  // the oak field itself (A, H, N), drawn here only if something asks for it: the kit's textures are drawn from their own
  Object.defineProperty(K, "oak", { get: () => mainOak(OAK_N), enumerable: true, configurable: true });
  if (defer) await starting;       // the workers running before the caller blocks the main thread to build
  else {
    await Promise.all([drawn(oakV.map), drawn(oakH.map)]); onStep("laying the floor");
    await drawn(fl.map); onStep("plaster, stone and brick");
    await settled();
  }
  return K;
}

// ---------------------------------------------------------------- a wall
// One wall of one room, in the wall's own frame: r along it from the left corner as you face it,
// up is up, +z toward the room. elems: doors, open edges, windows, a chimney-piece (schematic.json's
// shapes; T, lining and passage on an opening override the single-room defaults). style: "panelled"
// or "limewashed". Returns the group, and the window lights it made.
export function buildWall(THREE, K, F, L, H, elems, { style = "panelled", depth = 0, mitre = [1, 1], backdrop = true } = {}) {
  const { M, CLASS, cast, board } = K;
  const grp = new THREE.Group(), lights = [];
  const plain = style === "limewashed";
    let ctx = "panelling"; const count = {};
    const add = (g, m, spread) => {
      if (m.vertexColors) board(g, spread);
      const mesh = cast(new THREE.Mesh(g, m)); grp.add(mesh); K.parts++;
      count[ctx] = (count[ctx] || 0) + 1;
      mesh.userData = { instance: `${F}/${ctx}/${count[ctx]}`, material: CLASS.get(m) || m.userData.cls || "other", owner: F };
      return mesh;
    };

    // what interrupts the panelling: [a, b] x [z0, z1] boxes
    const obst = [];
    for (const e of elems) {
      if (e.kind === "door") obst.push({ a: e.r0 - 0.12, b: e.r1 + 0.12, z0: 0, z1: e.top + 0.12 });
      if (e.kind === "open") obst.push({ a: e.r0, b: e.r1, z0: 0, z1: H });
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
    // (each zone under the cornice of a room lower than the style's: Alice's 2.6 m hall had its upper panels through its ceiling)
    if (!plain) for (const [z0, zt] of [STYLE.lower, STYLE.upper]) { const z1 = Math.min(zt, H - 0.26); if (z1 - z0 < 0.3) continue; for (const [a, b] of free(z0, z1)) fields.push({ a, b, z0, z1 }); }
    // above an obstacle that stops short of the zone's top: its own run of panels (overmantel, over-door)
    // (up to where a zone above it, uncut there, already panels the wall: a door lower than the lower zone's top, Alice's
    // fifteen inches, had its over-door run up through the upper zone's panels, two on one plane flickering)
    for (const o of plain ? [] : obst) {
      const zoneOver = [STYLE.lower, STYLE.upper].find(([z0]) => z0 >= o.z1 - 0.01 && free(z0, z0 + 0.01).some(([a, b]) => a <= o.a + 0.01 && b >= o.b - 0.01));
      const z1 = zoneOver ? zoneOver[0] - 0.03 : Math.min(STYLE.upper[1], H - 0.26);
      if (o.z1 > z1 - 0.2 || obst.some(p => p !== o && p.z0 >= o.z1 - 0.01 && p.a < o.b && p.b > o.a)) continue;
      fields.push({ a: o.a, b: o.b, z0: o.z1 + 0.03, z1 });
    }
    // backing: the stiles and rails are the wall's own face; openings cut through it
    const holes = [], notches = [];
    for (const e of elems) {
      if (e.kind === "window") holes.push(rect(e.r0, e.r1, e.sill, e.top));
      if (e.kind === "door" || e.kind === "open") notches.push([e.r0, e.r1, e.top]);
      // (a hearth whose firebox lies wholly in its breast leaves the wall behind it whole: cut through, it showed
      // the hillside past the jambs, 2026-10-06)
      if (e.kind === "chimneypiece" && !((e.breast || 0) >= e.firebox.depth)) notches.push([e.firebox.r0, e.firebox.r1, e.firebox.apex]);
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
    add(slab(THREE, outline, [...holes, ...panelRects]), plain ? M.limewash : M.oak, 0.02);
    // the wall's core: a hidden face just behind the panels, run past the corners, under the floor and
    // over the ceiling, so no seam in the visible faces can ever show through to nothing
    ctx = "core";
    const X = 0.04, core = [[-X, -X]];
    for (const [a, b, t] of notches) core.push([a, -X], [a, t], [b, t], [b, -X]);
    core.push([L + X, -X], [L + X, H + X], [-X, H + X]);
    add(slab(THREE, core, holes, -0.03), M.oak, 0.02);
    // horizontal runs, broken where something stands in their way
    // a run that reaches a corner is mitred there (one that stops at a door or a hearth is cut square)
    const ends = (a, b) => [a < 1e-6 ? mitre[0] : 0, b > L - 1e-6 ? mitre[1] : 0];
    ctx = "skirting";
    for (const [a, b] of free(0, STYLE.skirting.top)) add(run(THREE, a, b, 0, STYLE.skirting.profile, ...ends(a, b)), M.oak);
    ctx = "dado";
    if (!plain) for (const [a, b] of free(STYLE.dado.base, STYLE.dado.base + 0.08)) add(run(THREE, a, b, STYLE.dado.base, STYLE.dado.profile, ...ends(a, b)), M.oak);
    // frieze and cornice sit under the ceiling, whatever the storey
    const top = (y) => y - (3.1 - H);
    for (const [a, b] of free(top(STYLE.frieze.base), H)) { ctx = "frieze"; if (!plain) add(run(THREE, a, b, top(STYLE.frieze.base), STYLE.frieze.profile, ...ends(a, b)), M.oak); }
    for (const [a, b] of free(top(STYLE.cornice.base), H)) { ctx = "cornice"; add(run(THREE, a, b, top(STYLE.cornice.base), STYLE.cornice.profile, ...ends(a, b)), plain ? M.limewash : M.oak); }

    for (const e of elems) {
      ctx = e.id;
      if (e.kind === "open" && e.lining !== false) {
        // a wide opening with no door: the wall's own thickness, plastered, round three sides
        const T = e.T ?? STYLE.wallT, t = e.top;
        add(quad(THREE, [e.r0, 0, 0], [e.r0, 0, -T], [e.r0, t, -T], [e.r0, t, 0]), plain ? M.limewash : M.oak);
        add(quad(THREE, [e.r1, 0, -T], [e.r1, 0, 0], [e.r1, t, 0], [e.r1, t, -T]), plain ? M.limewash : M.oak);
        if (t < H - 0.01) add(quad(THREE, [e.r0, t, 0], [e.r0, t, -T], [e.r1, t, -T], [e.r1, t, 0]), plain ? M.limewash : M.oak);
      }
      if (e.kind === "door") {
        const T = e.T ?? STYLE.wallT, t = e.top;
        // architrave round three sides, lofted outward from the opening
        add(loft(THREE, [[e.r0, 0], [e.r0, t], [e.r1, t], [e.r1, 0]], STYLE.casing, false, false), M.oak);
      }
      if (e.kind === "door" && e.lining !== false) {
        const T = e.T ?? STYLE.wallT, t = e.top;
        // lining through the wall (and, for a room on its own, a dark passage beyond)
        add(quad(THREE, [e.r0, 0, 0], [e.r0, 0, -T], [e.r0, t, -T], [e.r0, t, 0]), M.oak);
        add(quad(THREE, [e.r1, 0, -T], [e.r1, 0, 0], [e.r1, t, 0], [e.r1, t, -T]), M.oak);
        add(quad(THREE, [e.r0, t, 0], [e.r0, t, -T], [e.r1, t, -T], [e.r1, t, 0]), M.oak);
        add(quad(THREE, [e.r0, 0.001, -T], [e.r0, 0.001, 0], [e.r1, 0.001, 0], [e.r1, 0.001, -T]), M.floor);
      }
      if (e.kind === "door" && e.passage !== false) {
        const T = e.T ?? STYLE.wallT, t = e.top, P = 1.8;
        add(quad(THREE, [e.r0, 0, -T], [e.r0, 0, -T - P], [e.r0, t, -T - P], [e.r0, t, -T]), M.oakDim);
        add(quad(THREE, [e.r1, 0, -T - P], [e.r1, 0, -T], [e.r1, t, -T], [e.r1, t, -T - P]), M.oakDim);
        add(quad(THREE, [e.r0, t, -T], [e.r0, t, -T - P], [e.r1, t, -T - P], [e.r1, t, -T]), M.oakDim);
        add(quad(THREE, [e.r0, 0.001, -T - P], [e.r0, 0.001, -T], [e.r1, 0.001, -T], [e.r1, 0.001, -T - P]), M.floor);
        K.farWall = K.farWall || new THREE.MeshStandardMaterial({ map: M.oak.map, roughness: 0.8, vertexColors: true, color: 0x7a7a7a, emissive: 0x2a1c12 });
        add(quad(THREE, [e.r0, 0, -T - P], [e.r1, 0, -T - P], [e.r1, t, -T - P], [e.r0, t, -T - P]), K.farWall);
        // a dark sleeve just outside the lining and passage, so their shared edges never open onto nothing
        ctx = e.id + "/sleeve";
        { const g = new THREE.BoxGeometry(e.r1 - e.r0 + 0.08, t + 0.08, T + P + 0.04); g.translate((e.r0 + e.r1) / 2, t / 2, -(T + P) / 2 - 0.01);
          const sl = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x050403, roughness: 1, side: THREE.BackSide })); grp.add(sl);
          sl.userData = { instance: `${F}/${e.id}/sleeve`, material: "dark", owner: F }; }
        ctx = e.id;
      }
      if (e.kind === "window") {
        const T = e.T ?? STYLE.wallT, sp = e.splay, G = -T;
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
        // (the transom a few millimetres thinner than the mullion it crosses: of one depth, their faces lay one on the other)
        const box = (a, b, y0, y1, dz = 0.05) => { const g = metric(new THREE.BoxGeometry(b - a, y1 - y0, dz)); g.translate((a + b) / 2, (y0 + y1) / 2, G + 0.02); add(g, b - a > y1 - y0 ? M.oakH : M.oak); };
        box(mx - mw, mx + mw, gy0, gy1); box(gx0, gx1, ty - mw, ty + mw, 0.044);
        // plain quarries: armorial glass was a luxury set sparingly (a panel in the hall or great chamber),
        // not a shield in every light of every window; e.arms opts a window in
        const arms = e.arms ? [1, 2] : [0, 0];
        const lightsIn = [[gx0, mx - mw, ty + mw, gy1, arms[0]], [mx + mw, gx1, ty + mw, gy1, arms[1]], [gx0, mx - mw, gy0, ty - mw, 0], [mx + mw, gx1, gy0, ty - mw, 0]];
        lightsIn.forEach(([a, b, y0, y1, sh], k) => {
          const g = new THREE.PlaneGeometry(b - a, y1 - y0); g.translate((a + b) / 2, (y0 + y1) / 2, G - 0.005);
          const m = new THREE.MeshBasicMaterial({ map: leadedTexture(THREE, b - a, y1 - y0, sh, 100 + k + K.parts), color: new THREE.Color(1.0, 0.99, 0.94), transparent: true, depthWrite: false });
          const glass = new THREE.Mesh(g, m); grp.add(glass);
          glass.userData = { instance: `${F}/${e.id}/glass${k + 1}`, material: "glass", owner: F };
        });
        // (the world outside is one pane for the whole wall, after the loop: one to each window overlapped its
        // neighbours' in one plane and flickered as you moved, 2026-10-06)
        // daylight through the glass: an area light filling the opening, facing the room
        const al = new THREE.RectAreaLight(0xe9eef0, 5.5, gx1 - gx0, gy1 - gy0);   // v2: daylight is cool; the warmth is in the bounce
        al.position.set(mx, (gy0 + gy1) / 2, G + 0.06); al.lookAt(mx, (gy0 + gy1) / 2, 5);
        grp.add(al); lights.push(al);
      }
      if (e.kind === "chimneypiece" && e.breast) {
        // a chimney breast standing out into the room: its two returns and its face above the mantel
        // its returns run on past its face to meet the back of the surround's stones (14 cm deep in a 20 cm
        // surround: the 6 cm between was a slit into the breast, 2026-10-06); above the surround, to its face
        const B = e.breast, faceM = plain ? M.limewash : M.oak, SB = e.open ? 0.1 : 0.06, st = e.surround_top ?? 0;      // the stones stand 0.14 (arched) or 0.1 (open) deep
        for (const [r, s] of [[e.r0, 1], [e.r1, -1]]) {
          const q = (z0, z1, y0, y1) => s > 0 ? quad(THREE, [r, y0, z0], [r, y0, z1], [r, y1, z1], [r, y1, z0]) : quad(THREE, [r, y0, z1], [r, y0, z0], [r, y1, z0], [r, y1, z1]);
          add(q(0, B + SB, 0, st), faceM, 0.05); add(q(0, B, st, H), faceM, 0.05); }
        add(slab(THREE, rect(e.r0, e.r1, e.mantel.top - 0.1, H), [], B), faceM, 0.05);
      }
      const chimneyStart = grp.children.length;
      if (e.kind === "chimneypiece") {
        const fb = e.firebox, cx = (fb.r0 + fb.r1) / 2, half = (fb.r1 - fb.r0) / 2;
        if (e.open) {
          // a kitchen's open hearth: a wide square mouth, rubble-stone jambs, a great oak bressummer over it
          const SD = 0.2, stoneJ = M.stone, bt = fb.apex, bh = 0.32;
          for (const [a, b] of [[e.r0, fb.r0], [fb.r1, e.r1]]) for (let y = 0, k = 0; y < bt - 0.01; y += 0.34, k++)
            add(block(THREE, rect(a + (k % 2 ? 0.02 : 0), b - (k % 2 ? 0 : 0.02), y + 0.003, Math.min(bt, y + 0.34) - 0.003), SD, 0.1), stoneJ, 0.2);
          const beam = metric(new THREE.BoxGeometry(e.r1 - e.r0 + 0.2, bh, SD + 0.08)); beam.translate((e.r0 + e.r1) / 2, bt + bh / 2, (SD + 0.08) / 2);
          if (M.oakH.vertexColors) K.board(beam, 0.25); add(beam, M.oakH, 0.1);
          // a soot-dark bressummer's underside and the plaster of the breast above it
          add(quad(THREE, [fb.r1, bt - 0.001, 0], [fb.r0, bt - 0.001, 0], [fb.r0, bt - 0.001, SD], [fb.r1, bt - 0.001, SD]), M.dark);
        } else {
        // four-centred (Tudor) arch: quarter-ish arcs off the springing, flat-pointed at the apex
        const arch = [], rise = fb.apex - fb.spring, rr = Math.min(0.2, rise * 0.8), turn = 70 * Math.PI / 180;
        for (let k = 1; k <= 10; k++) { const f = k / 10 * turn; arch.push([fb.r0 + rr - rr * Math.cos(f), fb.spring + rr * Math.sin(f)]); }
        const [sx, sy] = arch[arch.length - 1];
        // the upper arcs of a Tudor arch are of long radius: a gentle bow from the shoulder to the point
        for (let k = 1; k <= 8; k++) { const a = k / 8; arch.push([sx + (cx - sx) * a, sy + (fb.apex - sy) * a]); }   // straight rises: the point reads as a point
        const archR = arch.slice(0, -1).reverse().map(([x, y]) => [2 * cx - x, y]);
        const opening = [[fb.r0, 0], [fb.r0, fb.spring], ...arch, ...archR, [fb.r1, fb.spring], [fb.r1, 0]];
        const SD = 0.2, MO = 0.075, J = 0.002;
        // dressed limestone, each block its own tone, a soot plume over the opening
        // v2: warmer, darker, weathered limestone; one texture for every chimney-piece (it was drawn afresh for each)
        const dressed = K.dressedStone || (K.dressedStone = stoneTexture(THREE, 512, [104, 92, 74]));
        const stoneS = grime(THREE, new THREE.MeshStandardMaterial({ ...dressed, roughness: 0.88, vertexColors: true, normalScale: new THREE.Vector2(0.9, 0.9) }),
          [cx, fb.apex + 0.16, half * 1.05, 0.34, 0.6], false);
        stoneS.userData.cls = "stone";
        // lime mortar, weathered: a joint, not a groove (one material for every chimney-piece: it was made afresh for each)
        const mortar = K.mortar || (K.mortar = Object.assign(new THREE.MeshStandardMaterial({ map: M.stone.map, color: 0x8a8070, roughness: 1 }), { userData: { cls: "stone" } }));
        const g = offsetLine(opening, MO, false), gl = g[0][0], gr = g[g.length - 1][0];
        // a mortar bed behind the blocks, so every joint reads as a joint
        add(slab(THREE, [[e.r0, 0], [gl, 0], ...g.slice(1, -1), [gr, 0], [e.r1, 0], [e.r1, e.surround_top], [e.r0, e.surround_top]], [], SD - 0.012), mortar);
        // the moulded border round the opening: a hollow chamfer, a fillet, a bead standing proud
        add(loft(THREE, opening, [[0, 0], [0, 0.1], [0.018, 0.12], [0.03, 0.125], [0.045, 0.15], [0.055, 0.172], [0.062, SD], [MO, SD]], false, false), stoneS, 0.08);
        // the jambs: ashlar courses up to the springing
        const courses = [0, 0.36, 0.7, fb.spring];
        for (let k = 0; k < 3; k++) for (const [a, b] of [[e.r0, gl], [gr, e.r1]])
          add(block(THREE, rect(a, b, courses[k] + J, courses[k + 1] - J), SD, 0.14), stoneS, 0.16);
        // the lintel over the arch, in three stones
        const archG = g.filter(p => p[1] >= fb.spring - 1e-6);
        const lintel = [[e.r0, fb.spring + J], ...archG.map(([x, y]) => [x, Math.max(y, fb.spring + J)]), [e.r1, fb.spring + J], [e.r1, e.surround_top], [e.r0, e.surround_top]];
        const c1 = cx - half * 0.55, c2 = cx + half * 0.55;
        for (const [a, b] of [[e.r0, c1 - J], [c1 + J, c2 - J], [c2 + J, e.r1]]) {
          const piece = clipX(lintel, a, b);
          if (piece.length >= 3) add(block(THREE, piece, SD, 0.14), stoneS, 0.16);
        }
        // a square-headed frame round the whole opening, a moulding standing proud of the stone, and the
        // spandrels between it and the arch sunk a little, as masons cut them
        { const fx0 = gl - 0.05, fx1 = gr + 0.05, ft = fb.apex + MO + 0.06;
          add(loft(THREE, [[fx0, 0], [fx0, ft], [fx1, ft], [fx1, 0]], [[0, SD], [0, SD + 0.012], [0.01, SD + 0.02], [0.022, SD + 0.02], [0.03, SD + 0.01], [0.034, SD]], false, false), stoneS, 0.06);
          for (const side of [-1, 1]) {
            const pts = side < 0 ? archG.filter(p => p[0] <= cx) : archG.filter(p => p[0] >= cx);
            const corner = side < 0 ? [[fx0 + 0.035, ft - 0.035], [fx0 + 0.035, fb.spring + MO]] : [[fx1 - 0.035, fb.spring + MO], [fx1 - 0.035, ft - 0.035]];
            const poly = side < 0 ? [...corner, ...pts, [cx, ft - 0.035]] : [[cx, ft - 0.035], ...pts, ...corner];
            if (poly.length >= 3) add(slab(THREE, poly, [], SD + 0.001), K.spandrel || (K.spandrel = grime(THREE, new THREE.MeshStandardMaterial({ map: M.stone.map, roughness: 0.9, color: 0x9a9080 }), null, false)), 0);
          }
        }
        // the mantel: a timber body, fillets, a frieze carved in relief, a boss at each end, a shelf
        // (its face 5 mm prouder than the stone moulding under it reaches: level with it, the two faces flickered)
        const m = e.mantel, fz = m.depth + 0.055, z0 = e.surround_top, zt = m.top - 0.1, mh = zt - z0;
        add(block(THREE, rect(m.r0, m.r1, z0, zt), fz, fz - 0.02, 0.006), M.oakH, 0.1);
        const ch = mh * 0.62, len = m.r1 - m.r0 - 0.52, cy = z0 + mh * 0.5;
        for (const y of [cy - ch / 2 - 0.018, cy + ch / 2 + 0.006])
          add(run(THREE, m.r0 + 0.03, m.r1 - 0.03, y, [[0, fz], [0, fz + 0.012], [0.006, fz + 0.016], [0.012, fz + 0.012], [0.012, fz]]), M.oak, 0.05);
        { // the carving itself: a grid displaced by the vine's height, so it catches real light and shadow
          const dens = K.carveDensity || 320, nx = Math.round(len * dens), ny = Math.round(ch * dens);
          const cg = new THREE.PlaneGeometry(len, ch, nx, ny), pa = cg.attributes.position;
          for (let i = 0; i < pa.count; i++) {
            const X = pa.getX(i) + len / 2, Y = pa.getY(i) / ch + 0.5;
            pa.setZ(i, carveHeight(X, Y) * 0.011);
          }
          cg.computeVertexNormals(); cg.translate((m.r0 + m.r1) / 2, cy, fz + 0.002);
          const carv = carvedTextures(THREE, null, len, ch);
          const carvM = grime(THREE, new THREE.MeshStandardMaterial({ map: carv.map, roughness: 0.55 }));
          carvM.userData.cls = "oak_carved";
          add(cg, carvM);
        }
        for (const x of [m.r0 + 0.13, m.r1 - 0.13]) {
          add(block(THREE, rect(x - 0.09, x + 0.09, cy - ch / 2, cy + ch / 2), fz + 0.03, 0.03, 0.004), M.oak, 0.06);
          const R = 0.065;
          const rs = K.carveDensity ? 20 : 48, ring = new THREE.PlaneGeometry(2 * R, 2 * R, rs, rs), q = ring.attributes.position;
          for (let i = 0; i < q.count; i++) {
            const u = q.getX(i), v = q.getY(i), r = Math.hypot(u, v) / R, th = Math.atan2(v, u);
            const petal = r < 1 ? (1 - r) * (0.55 + 0.45 * Math.cos(th * 8)) + Math.max(0, 0.3 - r) * 1.5 : 0;
            q.setZ(i, petal * 0.018);
          }
          ring.computeVertexNormals(); ring.translate(x, cy, fz + 0.031);
          add(ring, M.oak, 0.04);
        }
        add(run(THREE, m.r0 - 0.05, m.r1 + 0.05, zt, [[0, 0], [0, fz + 0.01], [0.012, fz + 0.014], [0.03, fz + 0.035], [0.055, fz + 0.058], [0.075, fz + 0.078], [0.085, fz + 0.085], [0.1, fz + 0.085], [0.1, 0]]), M.oak, 0.05);
        // a dentil course under the shelf
        for (let x = m.r0 + 0.02; x < m.r1 - 0.02; x += 0.034) add(block(THREE, rect(x, x + 0.018, zt - 0.03, zt - 0.002), fz + 0.022, 0.02, 0.002), M.oak, 0.04);
        }
        // the firebox: brick, splayed, sooted, going back into the wall
        const SD = 0.2, bd = fb.depth, bs = e.open ? 0.1 : 0.16, top = fb.apex;
        add(quad(THREE, [fb.r0, 0, 0], [fb.r0 + bs, 0, -bd], [fb.r0 + bs, top, -bd], [fb.r0, top, 0]), M.brick);
        add(quad(THREE, [fb.r1 - bs, 0, -bd], [fb.r1, 0, 0], [fb.r1, top, 0], [fb.r1 - bs, top, -bd]), M.brick);
        add(quad(THREE, [fb.r0 + bs, 0, -bd], [fb.r1 - bs, 0, -bd], [fb.r1 - bs, top, -bd], [fb.r0 + bs, top, -bd]), M.brick);
        add(quad(THREE, [fb.r1, top, 0], [fb.r0, top, 0], [fb.r0 + bs, top, -bd], [fb.r1 - bs, top, -bd]), M.dark);
        add(quad(THREE, [fb.r0 + bs, 0.002, -bd], [fb.r0, 0.002, 0], [fb.r1, 0.002, 0], [fb.r1 - bs, 0.002, -bd]), M.hearth);
        // the hearth stone, proud of the floor
        const h = e.hearth, hg = metric(new THREE.BoxGeometry(h.r1 - h.r0, 0.035, h.out + SD));   // SD is the v2 surround depth
        hg.translate((h.r0 + h.r1) / 2, 0.0175, (h.out + SD) / 2);
        add(hg, M.hearth);
        if (e.breast) for (const o of grp.children.slice(chimneyStart)) o.position.z += e.breast;
      }
    }
  // the world outside: one pane behind all of this wall's windows, 2.5 m beyond the glass, wide enough for any angle
  // in; each room's a hair deeper than the next's (depth, from its id), so two rooms' panes never share a plane
  // (not where the place has a real outside of its own: there the pane stood out in the field, 2026-10-07)
  const wins = elems.filter(e => e.kind === "window");
  if (wins.length && backdrop) {
    K.outside = K.outside || new THREE.MeshBasicMaterial({ map: outsideTexture(THREE), color: new THREE.Color(1.06, 1.06, 1.06) });
    const a = Math.min(...wins.map(e => e.r0)) - 2.6, b = Math.max(...wins.map(e => e.r1)) + 2.6, T = Math.max(...wins.map(e => e.T ?? STYLE.wallT));
    const lo = Math.min(...wins.map(e => e.sill)) - 1.7, hi = Math.max(...wins.map(e => Math.max(e.sill + 2.5, e.top + 0.6)));
    const g = new THREE.PlaneGeometry(b - a, hi - lo); g.translate((a + b) / 2, (lo + hi) / 2, -T - 2.5 - depth);
    const pane = new THREE.Mesh(g, K.outside); grp.add(pane);
    pane.userData = { instance: `${F}/outside`, material: "glass", owner: F };
  }
  return { grp, lights };
}

// ---------------------------------------------------------------- the single room
export async function buildProcedural(THREE, schem, onStep = () => {}) {
  const t0 = performance.now();
  const { w: W, d: D, h: H } = schem.room;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07060a);
  // the textures drawn in the kit's workers while the walls go up; the room returned whole
  const K = await makeKit(THREE, { floor: [W, D], onStep, defer: true });
  const { M } = K;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), M.floor);
  floor.userData = { instance: "floor", material: "floor", owner: "floor" };
  floor.rotation.x = -Math.PI / 2; floor.position.set(W / 2, 0, -D / 2); floor.receiveShadow = true; scene.add(floor);
  const ceilG = new THREE.PlaneGeometry(W, D); { const uv = ceilG.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * W, uv.getY(i) * D); }
  const ceil = new THREE.Mesh(ceilG, M.plaster);
  ceil.userData = { instance: "ceiling", material: "plaster", owner: "ceiling" };
  ceil.rotation.x = Math.PI / 2; ceil.position.set(W / 2, H, -D / 2); ceil.receiveShadow = ceil.castShadow = true; scene.add(ceil);

  const PLACE = { N: { pos: [0, 0, -D], rot: 0 }, S: { pos: [W, 0, 0], rot: Math.PI }, E: { pos: [W, 0, -D], rot: -Math.PI / 2 }, W: { pos: [0, 0, 0], rot: Math.PI / 2 } };
  const lights = [];
  onStep("raising the walls");
  await new Promise(r => setTimeout(r));
  for (const [F, elems] of Object.entries(schem.walls)) {
    const L = F === "N" || F === "S" ? W : D;
    const w = buildWall(THREE, K, F, L, H, elems);
    w.grp.position.set(...PLACE[F].pos); w.grp.rotation.y = PLACE[F].rot;
    scene.add(w.grp); lights.push(...w.lights);
  }
  const parts = K.parts;
  onStep("finishing the textures");
  await K.ready();

  // the light, shaped the way bounced light falls: a low sun through the south windows, the sky in
  // the glass, and broad warm sources where the room hands light back: the floor, the sunlit patch
  // under the windows, the ceiling, and the north wall the windows face. Analytic, not computed GI.
  const sun = new THREE.DirectionalLight(0xffe2b8, 1.8);
  sun.position.set(W * 0.5 + 2.5, 3.8, 5.5); sun.target.position.set(W * 0.45, 0, -D * 0.45);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
  Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 0.5, far: 20 });
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(0x9a8a78, 0x2a1a0e, 0.35); scene.add(hemi);
  const bounce = new THREE.PointLight(0xffc890, 0, 7, 1.6); bounce.position.set(W / 2, 1.0, -1.2); scene.add(bounce);
  const area = (color, w, h, pos, look) => { const l = new THREE.RectAreaLight(color, 1, w, h); l.position.set(...pos); l.lookAt(...look); scene.add(l); return l; };
  // each is named for the surface that GIVES the light back, and faces away from it:
  const floorB = area(0xffcf9a, W * 0.9, D * 0.9, [W / 2, 0.03, -D / 2], [W / 2, 5, -D / 2]);         // the floor's bounce: lights the ceiling
  const patchB = area(0xffd6a0, 3.0, 1.0, [W / 2, 0.04, -0.9], [W / 2, 5, -0.9]);                  // the sunlit patch: lights ceiling and south wall
  const ceilB = area(0xfff0dd, W * 0.8, D * 0.8, [W / 2, H - 0.03, -D / 2], [W / 2, -5, -D / 2]);   // the ceiling's bounce: lights the floor
  const northB = area(0xffd2a0, W * 0.8, H * 0.6, [W / 2, H * 0.45, -D + 0.08], [W / 2, H * 0.45, 5]);  // the north wall's bounce: lights the south
  const southFill = area(0xffd8aa, W * 0.6, 1.3, [W / 2, 1.1, -1.5], [W / 2, 1.1, -10]);            // the sunlit floor's glow, carried north: the far wall and the fire
  const apply = (lv) => { floorB.intensity = lv.floorB; patchB.intensity = lv.patchB; ceilB.intensity = lv.ceilB; northB.intensity = lv.northB; southFill.intensity = lv.southFill ?? 0; };
  // levels matched to the paintings' luminance percentiles (p10 / p50 / p90) at the four painting poses
  // zone-matched (tools/zones.mjs): floor was a fifth of the painting's value, the south ceiling half again too bright
  const defaults = { sun: 1.7, sky: 4.2, fill: 0.3, bounce: 0, floorB: 1.0, patchB: 0.3, ceilB: 1.5, northB: 0.25, southFill: 1.0 };

  return { scene, kit: K, lights: { sun, hemi, bounce, areas: lights, apply }, defaults,
    gtao: { radius: 0.5, distanceExponent: 1.6, thickness: 1.5, scale: 1.5, samples: 16 }, gtaoBlend: 1.0,
    stats: { parts, ms: Math.round(performance.now() - t0) } };
}

// ---------------------------------------------------------------- furniture: a joined oak table with a drawer
// c. 1660: four turned baluster legs squared where the rails and stretchers join, moulded aprons, a
// moulded top, one drawer in the front apron with a turned knob. Built in its own frame: back at
// z = 0 (against a wall), front toward +z, centred on x = 0. Returns the group, the drawer (a group
// that slides along +z) and the point inside the drawer where something can lie.
export function buildDesk(THREE, K, { W = 1.1, D = 0.56, H = 0.76 } = {}) {
  const { M, board } = K;
  const g = new THREE.Group(), drawer = new THREE.Group();
  const part = (geo, mat = M.oak, spread = 0.14, into = g) => { if (mat.vertexColors) board(geo, spread); const m = new THREE.Mesh(geo, mat); m.castShadow = m.receiveShadow = true; into.add(m); return m; };
  // every member's arrises rolled by a few millimetres, as hands and years leave joinery
  const box = (w, h, d, x, y, z, mat = M.oak, into = g) => {
    const r = Math.min(0.004, w / 4, h / 4, d / 4);
    const shape = new THREE.Shape(); shape.moveTo(-w / 2 + r, -h / 2); shape.lineTo(w / 2 - r, -h / 2); shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    shape.lineTo(w / 2, h / 2 - r); shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); shape.lineTo(-w / 2 + r, h / 2); shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    shape.lineTo(-w / 2, -h / 2 + r); shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    const b = new THREE.ExtrudeGeometry(shape, { depth: Math.max(0.001, d - 2 * r), bevelEnabled: true, bevelThickness: r, bevelSize: 0, bevelSegments: 2, curveSegments: 3 });
    b.translate(0, 0, -(d - 2 * r) / 2); metricAny(b); b.translate(x, y, z);
    return part(b, mat, 0.14, into);
  };
  const T = 0.032, AP = 0.12, LEG = 0.058, legH = H - T;
  // legs: a lathe profile between a square block under the top and a square foot
  const prof = [[0, 0.1], [0.022, 0.1], [0.025, 0.12], [0.02, 0.15], [0.026, 0.2], [0.03, 0.26], [0.028, 0.31], [0.021, 0.36], [0.017, 0.4], [0.02, 0.43], [0.026, 0.46], [0.022, 0.49], [0.025, legH - AP - 0.02], [0.02, legH - AP], [0, legH - AP]].map(([r, y]) => new THREE.Vector2(r, y));
  for (const sx of [-1, 1]) for (const sz of [0, 1]) {
    const x = sx * (W / 2 - 0.05), z = sz ? D - 0.05 : 0.05;
    const lathe = new THREE.LatheGeometry(prof, 20); lathe.translate(x, 0, z); part(lathe, M.oak, 0.1);
    box(LEG, AP, LEG, x, legH - AP / 2, z);                     // the block the rails tenon into
    box(LEG, 0.1, LEG, x, 0.05, z);                              // the foot the stretchers join
  }
  // stretchers low down, all four sides
  box(W - 0.1, 0.035, 0.035, 0, 0.07, 0.05); box(W - 0.1, 0.035, 0.035, 0, 0.07, D - 0.05);
  for (const sx of [-1, 1]) box(0.035, 0.035, D - 0.1, sx * (W / 2 - 0.05), 0.07, D / 2);
  // aprons: back and sides whole; the front framed round the drawer opening
  const dw = 0.62, dh = 0.085, y0 = legH - AP / 2 - dh / 2;
  box(W - 0.1, AP, 0.022, 0, legH - AP / 2, 0.05);
  for (const sx of [-1, 1]) box(0.022, AP, D - 0.1, sx * (W / 2 - 0.05), legH - AP / 2, D / 2);
  const fz = D - 0.05, side = (W - 0.1 - dw) / 2;
  for (const sx of [-1, 1]) box(side, AP, 0.022, sx * (dw / 2 + side / 2), legH - AP / 2, fz);
  box(dw, legH - (y0 + dh), 0.022, 0, (y0 + dh + legH) / 2, fz);
  box(dw, y0 - (legH - AP), 0.022, 0, (legH - AP + y0) / 2, fz);
  // the top: a board with a moulded edge, overhanging
  const top = metric(new THREE.BoxGeometry(W + 0.06, T, D + 0.04)); top.translate(0, legH + T / 2, D / 2 + 0.01);
  part(top, M.oakH, 0.1);
  // the drawer: front with a turned knob, sides, back and bottom; it slides out along +z
  const dd = D - 0.12, t = 0.014;
  box(dw - 0.006, dh - 0.006, 0.028, 0, y0 + dh / 2, fz + 0.005, M.oakH, drawer);
  // a raised field on the drawer front, as its panels are raised on the walls
  { const f = loft(THREE, rect(-dw / 2 + 0.03, dw / 2 - 0.03, y0 + 0.018, y0 + dh - 0.018), [[0, 0], [0.004, 0.003], [0.012, 0.005], [0.014, 0.005]], true, true);
    f.translate(0, 0, fz + 0.019); part(f, M.oakH, 0.05, drawer); }
  const knob = new THREE.LatheGeometry([[0, 0], [0.012, 0], [0.012, 0.004], [0.006, 0.01], [0.009, 0.018], [0.013, 0.026], [0.01, 0.032], [0, 0.034]].map(([r, y]) => new THREE.Vector2(r, y)), 16);
  knob.rotateX(Math.PI / 2); knob.translate(0, y0 + dh / 2, fz + 0.024); part(knob, M.oak, 0.05, drawer);
  for (const sx of [-1, 1]) box(t, dh - 0.02, dd, sx * (dw / 2 - 0.02), y0 + dh / 2 - 0.005, fz - dd / 2, M.oak, drawer);
  box(dw - 0.04, dh - 0.02, t, 0, y0 + dh / 2 - 0.005, fz - dd + t / 2, M.oak, drawer);
  // the drawer's inside: paler, unwaxed, catching what little light reaches it
  box(dw - 0.04, 0.008, dd, 0, y0 + 0.008, fz - dd / 2, drawerInside(THREE, K), drawer);
  // a dark cavity behind the drawer, so the opening never shows through the table
  box(dw, dh, 0.01, 0, y0 + dh / 2, fz - dd - 0.012, M.dark);
  g.add(drawer);
  for (const o of g.children) if (o.isMesh) o.userData.entity = "desk1";
  drawer.traverse(o => { o.userData.entity = "desk1"; });
  return { group: g, drawer, travel: dd * 0.7, cavity: new THREE.Vector3(0, y0 + 0.016, fz - dd / 2) };
}

// a drawer's inside: paler, unwaxed oak, catching what little light reaches it
export const drawerInside = (THREE, K) => (K.drawerIn ||= new THREE.MeshStandardMaterial({ map: K.M.oakH.map, roughness: 0.85, vertexColors: true, color: new THREE.Color(1.5, 1.4, 1.25), emissive: 0x120a05 }));

// an iron key, about 11 cm: a looped bow, a round shank, a warded bit
export function buildKey(THREE) {
  // worn wrought iron: a dull grey-brown that still reads without an environment to reflect
  const iron = new THREE.MeshStandardMaterial({ color: 0x6a6259, metalness: 0.45, roughness: 0.48 });
  iron.userData.cls = "iron";
  const g = new THREE.Group(), add = (geo) => { const m = new THREE.Mesh(geo, iron); m.castShadow = true; m.userData.entity = "key1"; g.add(m); };
  const bow = new THREE.TorusGeometry(0.016, 0.0038, 10, 28); bow.rotateX(Math.PI / 2); bow.translate(-0.055, 0, 0); add(bow);
  const shank = new THREE.CylinderGeometry(0.0032, 0.0034, 0.08, 12); shank.rotateZ(Math.PI / 2); shank.translate(0.001, 0, 0); add(shank);
  const collar = new THREE.CylinderGeometry(0.0048, 0.0048, 0.006, 12); collar.rotateZ(Math.PI / 2); collar.translate(-0.036, 0, 0); add(collar);
  for (const [w, d, x, z] of [[0.016, 0.02, 0.034, 0.01], [0.004, 0.012, 0.03, 0.016]]) { const b = new THREE.BoxGeometry(w, 0.003, d); b.translate(x, 0, z); add(b); }
  // where it touches the drawer's bottom, a soft dark contact
  { const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d");
    const gr = x.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, "rgba(0,0,0,0.55)"); gr.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.05), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2; sh.position.set(-0.008, -0.0036, 0.004); sh.renderOrder = 1; sh.userData.entity = "key1"; g.add(sh); }
  // a hand's-width pick area round it, unseen: an 11 cm key is a small thing to put a pointer on
  const pick = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 0.08), new THREE.MeshBasicMaterial({ visible: false }));
  pick.userData.entity = "key1"; g.add(pick);
  g.userData.entity = "key1";
  return g;
}

// the kit's parts, for builders of more than one room (lab/house)
export { STYLE, rect, loft, mirror, run, slab, quad, metric, metricAny, block, offsetLine, canvasTex, normalFrom, fbm, vnoise, hash, rng, smooth, stoneTexture, plasterTexture, brickTexture, flagTexture, leadedTexture, outsideTexture, grime };
