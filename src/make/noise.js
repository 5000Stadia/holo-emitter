// Deterministic noise in world coordinates (R46; WORLDSPRING.md:11: "terrain, noise and look blends evaluated in
// world coordinates, so seams agree by construction"). Every value is a function of the global lattice index and a
// seed, never of an origin plus a local offset, so any tile, built in any order on any device, agrees with its
// neighbours. Integer hashing (PCG, after Nathan Reed, "Hash Functions for GPU Rendering", 2021) with Math.imul and
// >>> 0; interpolation uses only + - * (exact IEEE everywhere), never Math.sin/cos/exp/pow, whose last bits differ
// between engines; heights leave as whole millimetres. Pure.
export function pcg(v) { const s = (Math.imul(v >>> 0, 747796405) + 2891336453) >>> 0; const w = Math.imul(((s >>> ((s >>> 28) + 4)) ^ s) >>> 0, 277803737) >>> 0; return ((w >>> 22) ^ w) >>> 0; }
// a hash of several integers (a lattice point and a seed), chained
export function hashN(...ns) { let h = 0x9e3779b9; for (const n of ns) h = pcg((h ^ (n | 0)) >>> 0); return h; }
// a value in [0, 1) from a hash
export const unit = (h) => h / 4294967296;

const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);       // quintic: smooth to the second derivative
// value noise on a lattice of spacing `cell` metres: in [-1, 1], continuous, seeded; x, y world metres
export function valueNoise(x, y, cell, seed) {
  const gx = x / cell, gy = y / cell, i = Math.floor(gx), j = Math.floor(gy), fx = fade(gx - i), fy = fade(gy - j);
  const v = (a, b) => unit(hashN(a, b, seed)) * 2 - 1;
  const a = v(i, j), b = v(i + 1, j), c = v(i, j + 1), d = v(i + 1, j + 1);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}
// fractal sum: octaves of value noise, each half the cell and half the weight; in [-1, 1]
export function fbm(x, y, { cell = 64, octaves = 4, seed = 1, gain = 0.5 } = {}) {
  let s = 0, w = 1, n = 0;
  for (let o = 0; o < octaves; o++) { s += valueNoise(x, y, cell, (seed * 131 + o) | 0) * w; n += w; w *= gain; cell /= 2; }
  return s / n;
}
// whole millimetres: what leaves this module as a height
export const mm = (m) => Math.round(m * 1000);
