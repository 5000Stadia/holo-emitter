// Faces that fight (Kabe, 2026-10-06: "when two surfaces are produced along the same plane theres a strange visual
// effect when you move because the renderer alternates presenting both"): two triangles on one plane, facing the
// same way, overlapping. Across everything built, not only a kind's parts (mesh-rules' shimmer): linings, floors,
// stairs, furniture against them, the pieces inside a part. Each triangle keyed by its plane (normal to 1e-3,
// offset to half a millimetre), pairs in a bucket tested for shared area in the plane. Pure.
// coplanar(meshes: [{ key, tris: Float32Array (9 per triangle, world space), order? }]) ->
//   [{ a, b, ia, ib, area, at: [x, y, z], n }]: ia, ib the triangles' indices within a and b
export function coplanar(meshes, { minArea = 2e-5 } = {}) {
  // first only each triangle's plane, as a number (normal to 1/50, offset to half a millimetre), in typed arrays;
  // a triangle is looked at closely only if another lies on its plane
  const buckets = new Map(), out = [], refs = [];   // refs: [mesh, start, sign] per entry
  meshes.forEach((m, mi) => { const t = m.tris, sides = m.side === 0 ? [1, -1] : [m.side === -1 ? -1 : 1];
    for (let i = 0; i < t.length; i += 9) {
      const ux = t[i + 3] - t[i], uy = t[i + 4] - t[i + 1], uz = t[i + 5] - t[i + 2], vx = t[i + 6] - t[i], vy = t[i + 7] - t[i + 1], vz = t[i + 8] - t[i + 2];
      const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx, l = Math.hypot(cx, cy, cz); if (l < 1e-10) continue;
      for (const sg of sides) {
        const nx = cx * sg / l, ny = cy * sg / l, nz = cz * sg / l, d = nx * t[i] + ny * t[i + 1] + nz * t[i + 2];
        const k = (((Math.round(nx * 50) + 64) * 128 + Math.round(ny * 50) + 64) * 128 + Math.round(nz * 50) + 64) * 4194304 + Math.floor(d * 2000) + 2097152;
        const e = refs.length; refs.push(mi, i, sg); let b = buckets.get(k); if (!b) buckets.set(k, b = []); b.push(e);
      } } });
  const face = (e) => { const mi = refs[e], i = refs[e + 1], sg = refs[e + 2], t = meshes[mi].tris;
    const ux = t[i + 3] - t[i], uy = t[i + 4] - t[i + 1], uz = t[i + 5] - t[i + 2], vx = t[i + 6] - t[i], vy = t[i + 7] - t[i + 1], vz = t[i + 8] - t[i + 2];
    const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx, l = Math.hypot(cx, cy, cz);
    return { mi, i, t, n: [cx * sg / l, cy * sg / l, cz * sg / l], lo: [Math.min(t[i], t[i + 3], t[i + 6]), Math.min(t[i + 1], t[i + 4], t[i + 7]), Math.min(t[i + 2], t[i + 5], t[i + 8])],
      hi: [Math.max(t[i], t[i + 3], t[i + 6]), Math.max(t[i + 1], t[i + 4], t[i + 7]), Math.max(t[i + 2], t[i + 5], t[i + 8])] }; };
  for (const [key, own] of buckets) {
    // (filed under its half-millimetre and compared with the next one up too, so two faces either side of a step meet)
    const up = buckets.get(key + 1); if (own.length + (up ? up.length : 0) < 2) continue;
    const list = own.map(e => { const f = face(e); f.home = true; return f; }); if (up) for (const e of up) { const f = face(e); f.home = false; list.push(f); }
    // swept along an axis lying in the plane (sorting along the normal's own axis would put every face level)
    const n0 = list[0].n, ax = Math.abs(n0[0]) > Math.abs(n0[1]) ? (Math.abs(n0[0]) > Math.abs(n0[2]) ? 0 : 2) : (Math.abs(n0[1]) > Math.abs(n0[2]) ? 1 : 2), sw = (ax + 1) % 3;
    list.sort((a, b) => a.lo[sw] - b.lo[sw]);
    for (let a = 0; a < list.length; a++) for (let b = a + 1; b < list.length; b++) {
      const A = list[a], B = list[b]; if (B.lo[sw] > A.hi[sw] + 1e-5) break; if (!A.home && !B.home) continue;
      if (A.n[0] * B.n[0] + A.n[1] * B.n[1] + A.n[2] * B.n[2] < 0.99995) continue;
      if (Math.abs((A.n[0] * A.t[A.i] + A.n[1] * A.t[A.i + 1] + A.n[2] * A.t[A.i + 2]) - (A.n[0] * B.t[B.i] + A.n[1] * B.t[B.i + 1] + A.n[2] * B.t[B.i + 2])) > 5e-4) continue;
      if (B.lo[1] > A.hi[1] + 1e-5 || A.lo[1] > B.hi[1] + 1e-5 || B.lo[2] > A.hi[2] + 1e-5 || A.lo[2] > B.hi[2] + 1e-5 || B.lo[0] > A.hi[0] + 1e-5 || A.lo[0] > B.hi[0] + 1e-5) continue;
      // two triangles of one mesh sharing an edge, lying on one plane, don't overlap (a surface's own tiling)
      if (A.mi === B.mi && shared(A.t, A.i, B.t, B.i) >= 2) continue;
      const area = overlap(A, B); if (area < minArea) continue;
      out.push({ a: meshes[A.mi].key, b: meshes[B.mi].key, ma: A.mi, mb: B.mi, ia: A.i / 9, ib: B.i / 9, area, n: A.n,
        at: [0, 1, 2].map(k => (A.lo[k] + A.hi[k] + B.lo[k] + B.hi[k]) / 4), ta: [...A.t.slice(A.i, A.i + 9)], tb: [...B.t.slice(B.i, B.i + 9)] });
    }
  }
  return out;
}
const shared = (ta, ia, tb, ib) => { let n = 0; for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) if (ta[ia + a * 3] === tb[ib + b * 3] && ta[ia + a * 3 + 1] === tb[ib + b * 3 + 1] && ta[ia + a * 3 + 2] === tb[ib + b * 3 + 2]) { n++; break; } return n; };
// the area two coplanar triangles share: both dropped onto the plane's two other axes, one clipped by the other
function overlap(fa, fb) {
  const n = fa.n, ax = Math.abs(n[0]) > Math.abs(n[1]) ? (Math.abs(n[0]) > Math.abs(n[2]) ? 0 : 2) : (Math.abs(n[1]) > Math.abs(n[2]) ? 1 : 2);
  const [u, v] = [0, 1, 2].filter(k => k !== ax), pts = (f) => [0, 1, 2].map(c => [f.t[f.i + c * 3 + u], f.t[f.i + c * 3 + v]]);
  let poly = pts(fa); const clip = pts(fb);
  const sgn = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]), orient = Math.sign(sgn(...clip)) || 1;
  for (let e = 0; e < 3 && poly.length; e++) {
    const A = clip[e], B = clip[(e + 1) % 3], next = [];
    for (let k = 0; k < poly.length; k++) { const P = poly[k], Q = poly[(k + 1) % poly.length], sp = sgn(A, B, P) * orient, sq = sgn(A, B, Q) * orient;
      if (sp >= -1e-12) next.push(P);
      if (sp * sq < 0) { const t = sp / (sp - sq); next.push([P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t]); } }
    poly = next;
  }
  let A = 0; for (let k = 0; k < poly.length; k++) { const p = poly[k], q = poly[(k + 1) % poly.length]; A += p[0] * q[1] - q[0] * p[1]; }
  return Math.abs(A) / 2 / Math.abs(n[ax]);
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
  const pairs = coplanar(meshes, { minArea: 1e-6 }), steps = new Map(), normal = new Map(), seen = new Set();
  for (const p of pairs) {
    const ta = meshes[p.ma].tris, tb = meshes[p.mb].tris, aa = area(ta, p.ia * 9), ab = area(tb, p.ib * 9);
    const [m, i] = aa < ab || (aa === ab && (p.ma < p.mb || (p.ma === p.mb && p.ia < p.ib))) ? [p.ma, p.ia] : [p.mb, p.ib], key = `${m}/${i}`;
    const pk = `${p.ma}/${p.ia}|${p.mb}/${p.ib}`; if (seen.has(pk)) continue; seen.add(pk);
    steps.set(key, (steps.get(key) || 0) + 1); normal.set(key, p.n);
  }
  const lifted = new Set(steps.keys());
  for (const [key, k] of steps) { const [m, i] = key.split("/").map(Number), n = normal.get(key), t = meshes[m].tris;
    for (let c = 0; c < 3; c++) for (let x = 0; x < 3; x++) t[i * 9 + c * 3 + x] += n[x] * lift * k;
    geos[m].attributes.position.needsUpdate = true; }
  return lifted.size;
}
