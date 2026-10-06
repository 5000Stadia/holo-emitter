// Checking a kind's own parts at authoring (Kabe, 2026-10-06: "improved discernment when building"; the
// cradle's rockers buried in its body, a cabinet's leftover panel standing behind its doors). Two rules,
// arithmetic on the thing's triangles, no picture, never in play:
//   13. seen: every part the recipe names shows from some side. Looked at from many directions (all
//       round and above; a thing on a wall only from the room), at rest and with everything moved, a
//       part is drawn into a depth grid with the rest of the thing and on its own, and what shows is the
//       share of its own outline that nothing else covers. A part that never shows a tenth is hidden.
//   14. apart: no part sits inside another. Points spread over each part's surface, a hair under it,
//       are tested against every other part's solid (a winding number: inside is 1, outside 0). A joint
//       is a little of a part let into the next; a fifth or more of its surface inside is one part
//       buried in another.
// A recipe entry can say otherwise on purpose, giving its reason: seen: false (a peg under the hat that
// hangs on it), within: "why" (set into the next part: a spigot driven into a cask, a tape tied round).
//
// parts: [{ key, tris: Float32Array (9 numbers a triangle, the thing's frame) }]

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

// the directions a thing is looked at from: all round at three heights and from above; on a wall, only
// from the room (+z, its front)
export function viewsOf({ wall = false } = {}) {
  const out = [[0, 1, 0]];
  for (const el of [0.12, 0.5, 1.0]) for (let k = 0; k < 8; k++) {
    const az = k * Math.PI / 4; if (wall && Math.cos(az) < 0.3) continue;
    out.push([Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)]);
  }
  return out;
}

// 13. what share of each part shows, at best, from the views given; states: [[parts…], …] (at rest, moved)
export function seen(states, views, { N = 200, small = 6 } = {}) {
  const keys = states[0].map(p => p.key), best = new Map(keys.map(k => [k, { share: 0, view: null, state: null, px: 0 }]));
  // one frame for every view and state: the thing's bounding sphere
  let lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (const st of states) for (const p of st) for (let i = 0; i < p.tris.length; i += 3) for (let a = 0; a < 3; a++) { lo[a] = Math.min(lo[a], p.tris[i + a]); hi[a] = Math.max(hi[a], p.tris[i + a]); }
  const C = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2], R = Math.hypot(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) / 2 + 1e-3;
  const z = new Float32Array(N * N), id = new Int16Array(N * N), mark = new Uint8Array(N * N);
  states.forEach((st, si) => views.forEach((d, vi) => {
    const right = norm(Math.abs(d[1]) > 0.95 ? cross([0, 0, -1], d) : cross([0, 1, 0], d)), up = cross(d, right);
    const proj = (p) => { const tris = p.tris, out = new Float32Array(tris.length);
      for (let i = 0; i < tris.length; i += 3) { const q = [tris[i] - C[0], tris[i + 1] - C[1], tris[i + 2] - C[2]];
        out[i] = (dot(q, right) / R + 1) * N / 2; out[i + 1] = (dot(q, up) / R + 1) * N / 2; out[i + 2] = dot(q, d); }
      return out; };
    const P = st.map(proj);
    z.fill(-Infinity); id.fill(-1);
    P.forEach((t, pi) => raster(t, N, (k, zz) => { if (zz > z[k]) { z[k] = zz; id[k] = pi; } }));
    const shown = new Int32Array(P.length); for (let k = 0; k < N * N; k++) if (id[k] >= 0) shown[id[k]]++;
    P.forEach((t, pi) => { mark.fill(0); let alone = 0; raster(t, N, (k) => { if (!mark[k]) { mark[k] = 1; alone++; } });
      if (alone < small) return;
      const b = best.get(st[pi].key), share = shown[pi] / alone;
      b.px = Math.max(b.px, alone); if (share > b.share) Object.assign(b, { share, view: vi, state: si }); });
  }));
  return best;
}

// a triangle's pixels (centres inside it) and its depth there, for each of a list of triangles
function raster(t, N, put) {
  for (let i = 0; i < t.length; i += 9) {
    const x0 = t[i], y0 = t[i + 1], z0 = t[i + 2], x1 = t[i + 3], y1 = t[i + 4], z1 = t[i + 5], x2 = t[i + 6], y2 = t[i + 7], z2 = t[i + 8];
    const A = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0); if (Math.abs(A) < 1e-9) continue;
    const ia = Math.max(0, Math.floor(Math.min(x0, x1, x2))), ib = Math.min(N - 1, Math.ceil(Math.max(x0, x1, x2)));
    const ja = Math.max(0, Math.floor(Math.min(y0, y1, y2))), jb = Math.min(N - 1, Math.ceil(Math.max(y0, y1, y2)));
    for (let j = ja; j <= jb; j++) for (let ii = ia; ii <= ib; ii++) {
      const px = ii + 0.5, py = j + 0.5;
      const w0 = ((x1 - px) * (y2 - py) - (x2 - px) * (y1 - py)) / A, w1 = ((x2 - px) * (y0 - py) - (x0 - px) * (y2 - py)) / A, w2 = 1 - w0 - w1;
      if (w0 < 0 || w1 < 0 || w2 < 0) continue;
      put(j * N + ii, w0 * z0 + w1 * z1 + w2 * z2);
    }
  }
}

// 14. for each part, the parts it lies inside: [{ a, b, share }] where share is the part of a's surface
// inside b's solid
export function apart(parts, { samples = 48, hair = 0.003, min = 0.2 } = {}) {
  const box = (t) => { const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < t.length; i += 3) for (let a = 0; a < 3; a++) { lo[a] = Math.min(lo[a], t[i + a]); hi[a] = Math.max(hi[a], t[i + a]); } return { lo, hi }; };
  // a hair under each surface: 3 mm, or a third of the part's thinnest way for a thin thing (a cloth, a tape)
  const B = parts.map(p => box(p.tris)), pts = parts.map((p, i) => surfacePoints(p.tris, samples, Math.min(hair, Math.min(...[0, 1, 2].map(k => B[i].hi[k] - B[i].lo[k])) / 3))), out = [];
  for (let a = 0; a < parts.length; a++) for (let b = 0; b < parts.length; b++) {
    if (a === b || !pts[a].length) continue;
    const A = B[a], Bb = B[b]; if ([0, 1, 2].some(k => A.lo[k] > Bb.hi[k] - 1e-4 || A.hi[k] < Bb.lo[k] + 1e-4)) continue;
    let inside = 0; for (const p of pts[a]) if (p[0] > Bb.lo[0] && p[0] < Bb.hi[0] && p[1] > Bb.lo[1] && p[1] < Bb.hi[1] && p[2] > Bb.lo[2] && p[2] < Bb.hi[2] && Math.abs(winding(parts[b].tris, p)) > 0.75) inside++;
    const share = inside / pts[a].length; if (share >= min) out.push({ a: parts[a].key, b: parts[b].key, share: +share.toFixed(2) });
  }
  return out;
}

// points spread over a surface by area, each a hair under it (into its own solid), from a fixed sequence
function surfacePoints(t, n, hair) {
  const areas = [], cum = []; let total = 0;
  for (let i = 0; i < t.length; i += 9) { const a = [t[i], t[i + 1], t[i + 2]], b = [t[i + 3], t[i + 4], t[i + 5]], c = [t[i + 6], t[i + 7], t[i + 8]];
    const cr = cross(sub(b, a), sub(c, a)), ar = Math.hypot(...cr) / 2; areas.push([a, b, c, norm(cr)]); total += ar; cum.push(total); }
  if (!total) return [];
  let s = 0x9e3779b9; const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296), out = [];
  for (let k = 0; k < n; k++) {
    const x = (k + rnd()) / n * total; let lo = 0, hi = cum.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (cum[m] < x) lo = m + 1; else hi = m; }
    const [a, b, c, nn] = areas[lo]; let u = rnd(), v = rnd(); if (u + v > 1) { u = 1 - u; v = 1 - v; }
    out.push([0, 1, 2].map(i => a[i] + (b[i] - a[i]) * u + (c[i] - a[i]) * v - nn[i] * hair));
  }
  return out;
}

// the generalised winding number of a triangle soup about a point (Jacobson et al. 2013): 1 inside a
// closed solid, 0 outside, and sensible for one that isn't quite closed
function winding(t, p) {
  let w = 0;
  for (let i = 0; i < t.length; i += 9) {
    const a = [t[i] - p[0], t[i + 1] - p[1], t[i + 2] - p[2]], b = [t[i + 3] - p[0], t[i + 4] - p[1], t[i + 5] - p[2]], c = [t[i + 6] - p[0], t[i + 7] - p[1], t[i + 8] - p[2]];
    const la = Math.hypot(...a), lb = Math.hypot(...b), lc = Math.hypot(...c);
    w += 2 * Math.atan2(dot(a, cross(b, c)), la * lb * lc + dot(a, b) * lc + dot(a, c) * lb + dot(b, c) * la);
  }
  return w / (4 * Math.PI);
}
