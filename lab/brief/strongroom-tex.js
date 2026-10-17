// The strongroom's two textures as pure pixel maths (lab/painted/texgen.js explains the form): drawn in the
// kit's workers, or on the main thread when there are none. Moved from strongroom.js unchanged but for the
// band of rows each loop now runs over; seeded (rng 1660, 1662), never Math.random. Imports only texgen.js.
import { fbm, smooth, hash, rng } from "../painted/texgen.js";

// limewash over coursed ashlar: the courses' joints, each course's kept clear of the course below's
function limewashLayout() {
  const TILE = 4, COURSE = 0.4, NC = TILE / COURSE, cuts = [];
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
  return { TILE, NC, cuts };
}
// flagstones: course widths summing exactly to the tile, each course cut into stones 0.6-1.1 m long
function flagstoneLayout() {
  const TILE = 4, r = rng(1662);
  let rows = []; { let y = 0; while (y < TILE - 0.5) { const w = 0.55 + r() * 0.3; rows.push(w); y += w; } const k = TILE / rows.reduce((a, b) => a + b, 0); rows = rows.map(w => w * k); }
  const edges = [0]; for (const w of rows) edges.push(edges[edges.length - 1] + w / TILE);
  const cuts = rows.map((_, j) => { const c = []; let x = r() * 0.25; while (x < 1 - 0.0001) { c.push(x); x += (0.6 + r() * 0.5) / TILE; } if (c.length > 1 && 1 - c[c.length - 1] + c[0] < 0.45 / TILE) c.pop(); return c; });
  return { TILE, rows, edges, cuts };
}

export const GEN = {
  // limewash over coursed ashlar: near white, washed on unevenly, the courses showing through faintly (a 4 m tile)
  limewash: { cost: 0.65, normal: 1.2, size: ([N]) => [N, N],
    rows([N], y0, y1, d, Hs) {
      const { TILE, NC, cuts } = limewashLayout();
      for (let y = y0; y < y1; y++) for (let x = 0; x < N; x++) {
        const u = x / N, v = y / N, row = Math.floor(v * NC), fv = v * NC - row;
        let du = 1; for (const c of cuts[row]) { const a = Math.abs(u - c); du = Math.min(du, a, 1 - a); }
        const jt = Math.min(Math.min(fv, 1 - fv) / NC, du) * TILE;             // metres to the nearest joint
        const joint = 1 - smooth(0.004, 0.012, jt);                              // the wash has filled it: a soft shallow line
        const m = fbm(u * 8, v * 8, 8, 8, 4, 71), f = fbm(u * 128, v * 128, 128, 128, 2, 73), wash = fbm(u * 14, v * 14, 14, 14, 3, 79);
        const k = (0.91 + 0.09 * m + 0.035 * f) * (1 - 0.05 * joint) * (1 - 0.05 * Math.max(0, wash - 0.55) * 4), o = ((y - y0) * N + x) * 4;
        d[o] = 226 * k; d[o + 1] = 221 * k; d[o + 2] = 206 * k; d[o + 3] = 255;
        Hs[(y - y0) * N + x] = -0.18 * joint + m * 0.45 + f * 0.22;
      }
    } },
  // flagstones: large slabs in courses of varied width, each its own tone and wear; joints wrap at the tile's edge
  flagstone: { cost: 0.53, normal: 1.6, size: ([N]) => [N, N],
    rows([N], y0, y1, d, Hs) {
      const { TILE, rows, edges, cuts } = flagstoneLayout();
      for (let y = y0; y < y1; y++) {
        const v = y / N; let row = 0; while (row < rows.length - 1 && v >= edges[row + 1]) row++;
        const dv = Math.min(v - edges[row], edges[row + 1] - v) * TILE, cs = cuts[row];
        for (let x = 0; x < N; x++) {
          const u = x / N;
          let k0 = cs.length - 1; for (let q = 0; q < cs.length; q++) if (cs[q] <= u) k0 = q;      // which stone (wrapping)
          let du = 1; for (const c of cs) { const a = Math.abs(u - c); du = Math.min(du, a, 1 - a); }
          const jt = Math.min(dv, du * TILE), joint = 1 - smooth(0.002, 0.009, jt), edge = 1 - smooth(0.008, 0.05, jt);
          const t = hash(k0, row, 53), m = fbm(u * 16 + k0 * 0.37, v * 16, 16, 16, 4, 57 + (k0 % 5)), f = fbm(u * 160, v * 160, 160, 160, 2, 59);
          const stone = (0.78 + 0.22 * t + 0.16 * m + 0.06 * f) * (1 - 0.1 * edge), k = stone + (0.56 - stone) * joint, o = ((y - y0) * N + x) * 4;   // lime-pointed joints: darker, not black
          d[o] = 122 * k; d[o + 1] = 114 * k; d[o + 2] = 100 * k; d[o + 3] = 255;
          Hs[(y - y0) * N + x] = -0.6 * joint - 0.25 * edge + m * 0.3 + f * 0.2 + t * 0.1;
        }
      }
    } },
};
// for the kit's texture jobs (lab/painted/texjobs.js): where a worker finds these generators
export const LIB = { url: import.meta.url, GEN };
