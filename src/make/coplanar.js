// Faces that fight (Kabe, 2026-10-06: "when two surfaces are produced along the same plane theres a strange visual
// effect when you move because the renderer alternates presenting both"): two triangles on one plane, facing the
// same way, overlapping. Across everything built, not only a kind's parts (mesh-rules' shimmer): linings, floors,
// stairs, furniture against them, the pieces inside a part. Each triangle keyed by its plane (normal to 1e-3,
// offset to half a millimetre), pairs in a bucket tested for shared area in the plane. Pure.
// coplanar(meshes: [{ key, tris: Float32Array (9 per triangle, world space), order? }]) ->
//   [{ a, b, ia, ib, area, at: [x, y, z], n }]: ia, ib the triangles' indices within a and b
export function coplanar(meshes, { minArea = 2e-5, detail = true } = {}) {
  // first only each triangle's plane, as a number (normal to 1/50, offset to half a millimetre), in typed arrays;
  // a triangle is looked at closely only if another lies on its plane
  // (a hash table in typed arrays: a Map keyed by these large numbers, and an array per bucket, cost more than the rest)
  let cap = 0; for (const m of meshes) cap += m.tris.length / 9 * (m.side === 0 ? 2 : 1);
  const eM = new Int32Array(cap), eI = new Int32Array(cap), eN = new Float64Array(cap * 3), eNext = new Int32Array(cap);
  const gKey = new Float64Array(cap), gFirst = new Int32Array(cap), gLast = new Int32Array(cap), gLen = new Int32Array(cap);
  let size = 16; while (size < cap * 2) size *= 2; const slots = new Int32Array(size).fill(-1), mask = size - 1, out = [];
  const slot = (k) => slotOf(k, mask);
  const find = (k) => { for (let s = slot(k); ; s = (s + 1) & mask) { const g = slots[s]; if (g < 0 || gKey[g] === k) return g; } };
  let E = 0, G = 0;
  meshes.forEach((m, mi) => { const t = m.tris, sides = m.side === 0 ? [1, -1] : [m.side === -1 ? -1 : 1];
    for (let i = 0; i < t.length; i += 9) {
      const ux = t[i + 3] - t[i], uy = t[i + 4] - t[i + 1], uz = t[i + 5] - t[i + 2], vx = t[i + 6] - t[i], vy = t[i + 7] - t[i + 1], vz = t[i + 8] - t[i + 2];
      const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
      // (most faces built lie along an axis, where hypot is exactly the one length, and costs most of this loop)
      const l = cy === 0 && cz === 0 ? Math.abs(cx) : cx === 0 && cz === 0 ? Math.abs(cy) : cx === 0 && cy === 0 ? Math.abs(cz) : Math.hypot(cx, cy, cz); if (l < 1e-10) continue;
      for (const sg of sides) {
        const nx = cx * sg / l, ny = cy * sg / l, nz = cz * sg / l, d = nx * t[i] + ny * t[i + 1] + nz * t[i + 2];
        const k = (((Math.round(nx * 50) + 64) * 128 + Math.round(ny * 50) + 64) * 128 + Math.round(nz * 50) + 64) * 4194304 + Math.floor(d * 2000) + 2097152;
        const e = E++; eM[e] = mi; eI[e] = i; eN[e * 3] = nx; eN[e * 3 + 1] = ny; eN[e * 3 + 2] = nz; eNext[e] = -1;
        let s = slot(k), g; for (; ; s = (s + 1) & mask) { g = slots[s]; if (g < 0 || gKey[g] === k) break; }
        if (g < 0) { g = G++; slots[s] = g; gKey[g] = k; gFirst[g] = e; gLen[g] = 1; } else { eNext[gLast[g]] = e; gLen[g]++; }
        gLast[g] = e;
      } } });
  // a plane's faces as flat numbers: each one's box (lo x y z, hi x y z), its entry and whether it is filed here
  let F = new Float64Array(384), SE = new Int32Array(64), SH = new Uint8Array(64), IX = [];
  const box = (e, o, at) => { const i = eI[e], t = meshes[eM[e]].tris;
    for (let k = 0; k < 3; k++) { const a = t[i + k], b = t[i + 3 + k], c = t[i + 6 + k]; o[at + k] = Math.min(a, b, c); o[at + 3 + k] = Math.max(a, b, c); } };
  let B6 = new Float64Array(384); const ent = [], low = [];
  for (let g = 0; g < G; g++) {
    // (filed under its half-millimetre and compared with the next one up too, so two faces either side of a step meet)
    const up = find(gKey[g] + 1); if (gLen[g] + (up < 0 ? 0 : gLen[up]) < 2) continue;
    const L = gLen[g] + (up < 0 ? 0 : gLen[up]), own = gLen[g]; ent.length = 0; low.length = 0;
    for (let e = gFirst[g]; e >= 0; e = eNext[e]) ent.push(e);
    if (up >= 0) for (let e = gFirst[up]; e >= 0; e = eNext[e]) ent.push(e);
    // swept along an axis lying in the plane (sorting along the normal's own axis would put every face level)
    const e0 = ent[0], n0 = [eN[e0 * 3], eN[e0 * 3 + 1], eN[e0 * 3 + 2]], ax = Math.abs(n0[0]) > Math.abs(n0[1]) ? (Math.abs(n0[0]) > Math.abs(n0[2]) ? 0 : 2) : (Math.abs(n0[1]) > Math.abs(n0[2]) ? 1 : 2), sw = (ax + 1) % 3;
    if (B6.length < L * 6) B6 = new Float64Array(L * 12);
    for (let q = 0; q < L; q++) { box(ent[q], B6, q * 6); low.push(B6[q * 6 + sw]); }
    // (in order along it, ties as listed: the order a stable sort gives)
    IX.length = L; for (let q = 0; q < L; q++) IX[q] = q;
    if (L <= 32) for (let q = 1; q < L; q++) { const x = IX[q], v = low[x]; let r = q - 1; while (r >= 0 && low[IX[r]] > v) { IX[r + 1] = IX[r]; r--; } IX[r + 1] = x; }
    else IX.sort((a, b) => low[a] - low[b] || a - b);
    if (SE.length < L) { F = new Float64Array(L * 12); SE = new Int32Array(L * 2); SH = new Uint8Array(L * 2); }
    for (let q = 0; q < L; q++) { const x = IX[q]; SE[q] = ent[x]; SH[q] = x < own ? 1 : 0; for (let k = 0; k < 6; k++) F[q * 6 + k] = B6[x * 6 + k]; }
    const ot = 3 - ax - sw;
    const P = near(F, L, sw, ot, minArea * Math.abs(n0[ax]));
    for (let j = 0; j < P.length; j += 2) {
      const qa = P[j], qb = P[j + 1]; if (!SH[qa] && !SH[qb]) continue;
      const ea = SE[qa], eb = SE[qb], a6 = qa * 6, b6 = qb * 6, ax3 = ea * 3, bx3 = eb * 3;
      // the shared area is at most the boxes' common rectangle in the plane: tiles that only touch along an edge or at a corner
      // (a floor's neighbours, most of the pairs) need no clipping (each test here only drops a pair, so their order is free)
      const wu = Math.min(F[a6 + 3 + sw], F[b6 + 3 + sw]) - Math.max(F[a6 + sw], F[b6 + sw]), wv = Math.min(F[a6 + 3 + ot], F[b6 + 3 + ot]) - Math.max(F[a6 + ot], F[b6 + ot]);
      if (wu <= 0 || wv <= 0 || wu * wv < minArea * Math.abs(eN[ax3 + ax])) continue;
      const anx = eN[ax3], any = eN[ax3 + 1], anz = eN[ax3 + 2];
      if (anx * eN[bx3] + any * eN[bx3 + 1] + anz * eN[bx3 + 2] < 0.99995) continue;
      const Ami = eM[ea], Ai = eI[ea], At = meshes[Ami].tris, Bmi = eM[eb], Bi = eI[eb], Bt = meshes[Bmi].tris;
      if (Math.abs((anx * At[Ai] + any * At[Ai + 1] + anz * At[Ai + 2]) - (anx * Bt[Bi] + any * Bt[Bi + 1] + anz * Bt[Bi + 2])) > 5e-4) continue;
      if (F[b6 + 1] > F[a6 + 4] + 1e-5 || F[a6 + 1] > F[b6 + 4] + 1e-5 || F[b6 + 2] > F[a6 + 5] + 1e-5 || F[a6 + 2] > F[b6 + 5] + 1e-5 || F[b6] > F[a6 + 3] + 1e-5 || F[a6] > F[b6 + 3] + 1e-5) continue;
      // two triangles of one mesh sharing an edge, lying on one plane, don't overlap (a surface's own tiling)
      if (Ami === Bmi && shared(At, Ai, Bt, Bi) >= 2) continue;
      const area = overlap(At, Ai, Bt, Bi, anx, any, anz); if (area < minArea) continue;
      const p = { a: meshes[Ami].key, b: meshes[Bmi].key, ma: Ami, mb: Bmi, ia: Ai / 9, ib: Bi / 9, area, n: [anx, any, anz] };
      if (detail) { p.at = [0, 1, 2].map(k => (F[a6 + k] + F[a6 + 3 + k] + F[b6 + k] + F[b6 + 3 + k]) / 4); p.ta = [...At.slice(Ai, Ai + 9)]; p.tb = [...Bt.slice(Bi, Bi + 9)]; }
      out.push(p);
    }
  }
  return out;
}
// a number's slot in an open-addressed table of mask + 1 slots (the number a whole one, perhaps past 32 bits)
// (mixed through every bit, murmur's finish: a product's low bits alone hold only the key's low bits)
const slotOf = (k, mask) => { const hi = Math.floor(k / 4294967296), lo = k - hi * 4294967296; let h = (lo | 0) ^ Math.imul(hi | 0, 0x9E3779B1);
  h ^= h >>> 16; h = Math.imul(h, 0x85EBCA6B); h ^= h >>> 13; h = Math.imul(h, 0xC2B2AE35); h ^= h >>> 16; return h & mask; };
// the pairs [a < b] of a plane's faces whose boxes meet in the plane (within 1e-5): a sweep along one axis for a few faces;
// for many (a floor's thousands of tiles all on one plane, where a sweep met every face of a row: 11 M pairs a manor) a
// grid in the plane's two axes, each pair met once, in the cell holding the larger of their two low corners.
// F: the faces' boxes in order along sw, 6 numbers each (lo x y z, hi x y z)
function near(F, L, sw, ot, least) {
  const e = 1e-5, out = [], S = 3 + sw, O = 3 + ot;
  if (L <= 64) { for (let a = 0; a < L; a++) for (let b = a + 1; b < L; b++) { if (F[b * 6 + sw] > F[a * 6 + S] + e) break; if (F[b * 6 + ot] > F[a * 6 + O] + e || F[a * 6 + ot] > F[b * 6 + O] + e) continue; out.push(a, b); } return out; }
  let ext = 0; for (let i = 0; i < L; i++) ext += Math.max(F[i * 6 + S] - F[i * 6 + sw], F[i * 6 + O] - F[i * 6 + ot]);
  const cs = Math.max(ext / L, 1e-3), cell = (v) => Math.floor(v / cs);
  // the cells as a table in typed arrays, each cell's faces in the order met (a Map of arrays cost as much as the rest)
  let n = 0; for (let i = 0; i < L; i++) n += (cell(F[i * 6 + S] + e) - cell(F[i * 6 + sw] - e) + 1) * (cell(F[i * 6 + O] + e) - cell(F[i * 6 + ot] - e) + 1);
  let size = 16; while (size < n * 2) size *= 2; const mask = size - 1, slots = new Int32Array(size).fill(-1);
  const cKey = new Float64Array(n), cFirst = new Int32Array(n), cLast = new Int32Array(n), xFace = new Int32Array(n), xNext = new Int32Array(n);
  let C = 0, X = 0;
  for (let i = 0; i < L; i++) { const u0 = cell(F[i * 6 + sw] - e), u1 = cell(F[i * 6 + S] + e), v0 = cell(F[i * 6 + ot] - e), v1 = cell(F[i * 6 + O] + e);
    for (let u = u0; u <= u1; u++) for (let v = v0; v <= v1; v++) { const k = u * 1048576 + v;
      let s = slotOf(k, mask), c; for (; ; s = (s + 1) & mask) { c = slots[s]; if (c < 0 || cKey[c] === k) break; }
      const x = X++; xFace[x] = i; xNext[x] = -1;
      if (c < 0) { c = C++; slots[s] = c; cKey[c] = k; cFirst[c] = x; } else xNext[cLast[c]] = x;
      cLast[c] = x; } }
  const list = [];
  for (let c = 0; c < C; c++) { const k = cKey[c]; list.length = 0; for (let x = cFirst[c]; x >= 0; x = xNext[x]) list.push(xFace[x]);
    for (let x = 0; x < list.length; x++) for (let y = x + 1; y < list.length; y++) {
      const a6 = list[x] * 6, b6 = list[y] * 6;
      if (F[b6 + sw] > F[a6 + S] + e || F[a6 + sw] > F[b6 + S] + e || F[b6 + ot] > F[a6 + O] + e || F[a6 + ot] > F[b6 + O] + e) continue;
      const wu = Math.min(F[a6 + S], F[b6 + S]) - Math.max(F[a6 + sw], F[b6 + sw]), wv = Math.min(F[a6 + O], F[b6 + O]) - Math.max(F[a6 + ot], F[b6 + ot]);
      if (wu <= 0 || wv <= 0 || wu * wv < least * 0.98) continue;     // only touching (and below the least area clipping could find)
      if (cell(Math.max(F[a6 + sw], F[b6 + sw]) - e) * 1048576 + cell(Math.max(F[a6 + ot], F[b6 + ot]) - e) !== k) continue;
      if (list[x] < list[y]) out.push(list[x], list[y]); else out.push(list[y], list[x]);
    } }
  return out;
}
const shared = (ta, ia, tb, ib) => { let n = 0; for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) if (ta[ia + a * 3] === tb[ib + b * 3] && ta[ia + a * 3 + 1] === tb[ib + b * 3 + 1] && ta[ia + a * 3 + 2] === tb[ib + b * 3 + 2]) { n++; break; } return n; };
// the area two coplanar triangles share: both dropped onto the plane's two other axes, one clipped by the other
function overlap(ta, ia, tb, ib, nx, ny, nz) {
  const ax = Math.abs(nx) > Math.abs(ny) ? (Math.abs(nx) > Math.abs(nz) ? 0 : 2) : (Math.abs(ny) > Math.abs(nz) ? 1 : 2), na = ax === 0 ? nx : ax === 1 ? ny : nz;
  const u = ax === 0 ? 1 : 0, v = ax === 2 ? 1 : 2, pts = (t, i) => [[t[i + u], t[i + v]], [t[i + 3 + u], t[i + 3 + v]], [t[i + 6 + u], t[i + 6 + v]]];
  let poly = pts(ta, ia); const clip = pts(tb, ib);
  const sgn = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]), orient = Math.sign(sgn(...clip)) || 1;
  for (let e = 0; e < 3 && poly.length; e++) {
    const A = clip[e], B = clip[(e + 1) % 3], next = [];
    for (let k = 0; k < poly.length; k++) { const P = poly[k], Q = poly[(k + 1) % poly.length], sp = sgn(A, B, P) * orient, sq = sgn(A, B, Q) * orient;
      if (sp >= -1e-12) next.push(P);
      if (sp * sq < 0) { const t = sp / (sp - sq); next.push([P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t]); } }
    poly = next;
  }
  let A = 0; for (let k = 0; k < poly.length; k++) { const p = poly[k], q = poly[(k + 1) % poly.length]; A += p[0] * q[1] - q[0] * p[1]; }
  return Math.abs(A) / 2 / Math.abs(na);
}

// Settle faces that would fight, when a thing is built (Kabe, 2026-10-06: "can we collapse shared planes like that on
// build to whichever one is sposed to be seen outward?"): of each pair on one plane, facing the same way and
// overlapping, the smaller triangle (the detail: a bar's end in a stile, a fold over a side) is lifted a millimetre along
// its face, so which shows is decided once and the other is never seen. geos: the geometries of one rigid node
// (a thing's body, or one mover), all in its frame; indexed ones are unshared first. Returns how many were lifted.
export function settleFaces(geos, lift = 0.001, sides = []) {
  for (let k = 0; k < geos.length; k++) if (geos[k].index) geos[k] = geos[k].toNonIndexed();
  const meshes = geos.map((g, k) => ({ key: k, tris: g.attributes.position.array, side: sides[k] ?? 1 }));
  const area = (t, i) => { const ux = t[i + 3] - t[i], uy = t[i + 4] - t[i + 1], uz = t[i + 5] - t[i + 2], vx = t[i + 6] - t[i], vy = t[i + 7] - t[i + 1], vz = t[i + 8] - t[i + 2];
    return Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx) / 2; };
  // one pass: each face lifted once for every larger face it lies on, so a stack of three or more ends at as many
  // different heights and nothing lifted meets anything again
  // (a face's key is a number, mesh × T + triangle, T past the most triangles any mesh has)
  const pairs = coplanar(meshes, { minArea: 1e-6, detail: false }), steps = new Map(), normal = new Map(), seen = new Set();
  let T = 1; for (const m of meshes) T = Math.max(T, m.tris.length / 9 + 1);
  for (const p of pairs) {
    const ta = meshes[p.ma].tris, tb = meshes[p.mb].tris, aa = area(ta, p.ia * 9), ab = area(tb, p.ib * 9);
    const key = aa < ab || (aa === ab && (p.ma < p.mb || (p.ma === p.mb && p.ia < p.ib))) ? p.ma * T + p.ia : p.mb * T + p.ib;
    const pk = `${p.ma}/${p.ia}|${p.mb}/${p.ib}`; if (seen.has(pk)) continue; seen.add(pk);
    steps.set(key, (steps.get(key) || 0) + 1); normal.set(key, p.n);
  }
  for (const [key, k] of steps) { const m = Math.floor(key / T), i = key - m * T, n = normal.get(key), t = meshes[m].tris;
    for (let c = 0; c < 3; c++) for (let x = 0; x < 3; x++) t[i * 9 + c * 3 + x] += n[x] * lift * k;
    geos[m].attributes.position.needsUpdate = true; }
  return steps.size;
}
