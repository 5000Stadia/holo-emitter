// Rules every mesh of every kind obeys, checked when a kind is made (design/production/geometry-method.md §2;
// Kabe, 2026-10-06: "it should've been caught at its original creation"; "as long as it stays efficient").
// Exact where checks 13 and 14 sample: Manifold (Apache-2.0) builds each part as a solid or refuses it.
//   closed:    each part is a closed solid (every edge joins two faces), unless it says it is a sheet;
//   outward:   each closed piece of it has positive volume (a mirror left unturned has negative);
//   inside:    no part shares more than a joint's volume with another, unless it says it is set within;
//   shimmer:   no two parts lay a face on one plane facing the same way (they flicker as you move);
//   whole:     every part joins what holds the thing up (the floor it stands on, the wall it hangs on)
//              through parts that touch, so nothing floats loose of it.
// A joint is a part let into the next by less than a fifth of itself (measured over the kinds: joinery
// runs 5–17%).
// Manifold is loaded only here, at authoring, never in play.
//
// meshRules(M, parts, { declared }) -> findings [{ rule, a, b?, what }]; parts: [{ key, tris: Float32Array,
// solid? (the same less what the part adds as a sheet) }] (9 numbers a triangle, the thing's frame); M: the
// Manifold module after setup()

// a triangle soup welded into a mesh: corners within 1e-5 m are one vertex; triangles collapsed by the weld
// (the pole of a turned profile) dropped
function weld(tris) {
  const at = new Map(), pos = [], idx = [], q = (v) => Math.round(v * 1e5);
  const vert = (i) => { const k = `${q(tris[i])},${q(tris[i + 1])},${q(tris[i + 2])}`; let n = at.get(k);
    if (n === undefined) { n = pos.length / 3; at.set(k, n); pos.push(tris[i], tris[i + 1], tris[i + 2]); } return n; };
  for (let i = 0; i < tris.length; i += 9) { const a = vert(i), b = vert(i + 3), c = vert(i + 6); if (a !== b && b !== c && a !== c) idx.push(a, b, c); }
  return { pos: new Float32Array(pos), idx: new Uint32Array(idx) };
}

function solidOf(M, tris) {
  const { pos, idx } = weld(tris);
  if (!idx.length) return { error: "no faces" };
  try { const mesh = new M.Mesh({ numProp: 3, vertProperties: pos, triVerts: idx }); mesh.merge(); const s = new M.Manifold(mesh);
    const st = s.status(); if (st && st !== "NoError" && st.value !== 0) { s.delete(); return { error: String(st.constructor?.name || st) }; }
    return { solid: s }; }
  catch (e) { return { error: /manifold/i.test(String(e)) ? "not closed: an edge that doesn't join two faces" : String(e).slice(0, 80) }; }
}

export function meshRules(M, parts, { declared = () => ({}), joint = 0.2, touch = 0.001, support = ["floor"] } = {}) {
  inside.M = M;
  const out = [], solids = new Map(), vol = new Map(), box = new Map();
  for (const p of parts) {
    const d = declared(p.key), t = p.tris;
    for (let i = 0; i < t.length; i++) if (!Number.isFinite(t[i])) { out.push({ rule: "closed", a: p.key, what: "a corner that isn't a number" }); break; }
    const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < t.length; i += 3) for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], t[i + k]); hi[k] = Math.max(hi[k], t[i + k]); }
    box.set(p.key, { lo, hi });
    if (d.sheet || (p.solid && !p.solid.length)) continue;     // a sheet on purpose (a label, a canvas), all of it
    const { solid, error } = solidOf(M, p.solid || t);
    if (error) { out.push({ rule: "closed", a: p.key, what: error }); continue; }
    // outward: every closed piece of the part, by its own volume
    const pieces = solid.decompose(); let inward = 0;
    for (const s of pieces) { if (s.volume() < 0) inward++; s.delete(); }
    if (inward) out.push({ rule: "outward", a: p.key, what: `${inward} of its ${pieces.length} pieces wound inside out` });
    solids.set(p.key, solid); vol.set(p.key, Math.abs(solid.volume()));
  }
  // inside: the volume two parts share, against the smaller; a joint (a tenon, a leg let into its top) is less
  const keys = [...solids.keys()], near = (a, b, m = 0) => [0, 1, 2].every(k => a.lo[k] <= b.hi[k] + m && b.lo[k] <= a.hi[k] + m);
  for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) {
    const a = keys[i], b = keys[j]; if (!near(box.get(a), box.get(b))) continue;
    const x = solids.get(a).intersect(solids.get(b)), v = x.volume(); x.delete();
    const small = Math.min(vol.get(a), vol.get(b)), share = small ? v / small : 0;
    if (share > joint && !declared(a).within && !declared(b).within) { const [s, l] = vol.get(a) <= vol.get(b) ? [a, b] : [b, a];
      out.push({ rule: "inside", a: s, b: l, what: `${(share * 100).toFixed(0)}% of it lies inside` }); }
  }
  // whole: parts that touch (or nearly) are joined; everything must join the largest
  const all = parts.map(p => p.key), link = new Map(all.map(k => [k, new Set()]));
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
    const a = all[i], b = all[j]; if (!near(box.get(a), box.get(b), touch)) continue;
    const sa = solids.get(a), sb = solids.get(b);
    const meets = sa && sb ? sa.minGap(sb, touch * 2) <= touch : true;          // a sheet: its box touching is enough
    if (meets) { link.get(a).add(b); link.get(b).add(a); }
  }
  // what holds it up: the floor under it (y = 0), the wall behind it (z = 0) for a thing on a wall
  const holds = (b) => (support.includes("floor") && b.lo[1] <= touch) || (support.includes("wall") && b.lo[2] <= touch);
  // a thing held by something it doesn't own (shutters on a window's splays: kind.rests "held") joins its largest part
  const seen = new Set(support.includes("held") ? (keys.length ? [keys.reduce((m, k) => vol.get(k) > vol.get(m) ? k : m)] : all.slice(0, 1)) : all.filter(k => holds(box.get(k)))), q = [...seen];
  while (q.length) for (const n of link.get(q.pop())) if (!seen.has(n)) { seen.add(n); q.push(n); }
  for (const k of all) if (!seen.has(k) && !declared(k).loose) out.push({ rule: "whole", a: k, what: seen.size ? "touches nothing joined to what holds the thing up" : "nothing of the thing reaches the floor or its wall" });
  // shimmer: faces of two parts on one plane, facing the same way, overlapping
  const below = (x) => (support.includes("floor") && x[1] < 0) || (support.includes("wall") && x[2] < 0);      // in the floor or the wall
  out.push(...shimmer(parts, (key, x) => below(x) || [...solids].some(([k, sol]) => k !== key && inside(sol, x))));
  for (const s of solids.values()) s.delete();
  return out;
}

// faces of different parts lying on one plane and facing one way, with real overlap (over a square
// centimetre): each triangle keyed by its plane (normal to 1e-3, offset to half a millimetre), then the pairs
// in a bucket from different parts tested for overlap in the plane
function shimmer(parts, covered = () => false, minArea = 1e-4) {
  const buckets = new Map(), out = [], seen = new Set();
  for (const p of parts) { const t = p.tris;
    for (let i = 0; i < t.length; i += 9) {
      const ux = t[i + 3] - t[i], uy = t[i + 4] - t[i + 1], uz = t[i + 5] - t[i + 2], vx = t[i + 6] - t[i], vy = t[i + 7] - t[i + 1], vz = t[i + 8] - t[i + 2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz); if (l < 1e-9) continue;
      nx /= l; ny /= l; nz /= l; const d = nx * t[i] + ny * t[i + 1] + nz * t[i + 2];
      const k = `${Math.round(nx * 1e3)},${Math.round(ny * 1e3)},${Math.round(nz * 1e3)},${Math.round(d * 2000)}`;
      (buckets.get(k) || buckets.set(k, []).get(k)).push({ key: p.key, i, t, n: [nx, ny, nz] });
    } }
  for (const list of buckets.values()) {
    if (list.length < 2) continue;
    const by = new Map(); for (const f of list) (by.get(f.key) || by.set(f.key, []).get(f.key)).push(f);
    if (by.size < 2) continue;
    const ks = [...by.keys()];
    for (let a = 0; a < ks.length; a++) for (let b = a + 1; b < ks.length; b++) {
      const pair = `${ks[a]}|${ks[b]}`; if (seen.has(pair)) continue;
      let area = 0; for (const fa of by.get(ks[a])) for (const fb of by.get(ks[b])) area += overlap2d(fa, fb);
      if (area > minArea && !hidden(by.get(ks[a]), covered) && !hidden(by.get(ks[b]), covered)) { seen.add(pair); out.push({ rule: "shimmer", a: ks[a], b: ks[b], what: `${(area * 1e4).toFixed(0)} cm² of face on one plane` }); }
    }
  }
  return out;
}

// a face is hidden when a hair in front of it lies inside another part (a tenon's shoulder, a base on the
// lining it sits in): such a face is never seen, so it can't flicker
function hidden(faces, covered) {
  let n = 0, h = 0;
  for (const f of faces) { const t = f.t, i = f.i, c = [0, 1, 2].map(k => (t[i + k] + t[i + 3 + k] + t[i + 6 + k]) / 3 + f.n[k] * 0.0015); n++; if (covered(f.key, c)) h++; }
  return h / n > 0.5;
}
// is a point inside a solid: a speck of a cube there shares volume with it
function inside(sol, [x, y, z]) {
  const M = inside.M, s = 0.0004, cube = M.Manifold.cube([s, s, s], true).translate([x, y, z]), v = cube.intersect(sol), vol = v.volume();
  cube.delete(); v.delete(); return vol > s * s * s * 0.5;
}
// the area two coplanar triangles share: both dropped onto the plane's two other axes, one clipped by the other
function overlap2d(fa, fb) {
  const n = fa.n, ax = Math.abs(n[0]) > Math.abs(n[1]) ? (Math.abs(n[0]) > Math.abs(n[2]) ? 0 : 2) : (Math.abs(n[1]) > Math.abs(n[2]) ? 1 : 2);
  const [u, v] = [0, 1, 2].filter(k => k !== ax), pts = (f) => [0, 1, 2].map(c => [f.t[f.i + c * 3 + u], f.t[f.i + c * 3 + v]]);
  let poly = pts(fa); const clip = pts(fb);
  const sgn = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]), orient = Math.sign(sgn(...clip)) || 1;
  for (let e = 0; e < 3 && poly.length; e++) {
    const A = clip[e], B = clip[(e + 1) % 3], next = [];
    for (let k = 0; k < poly.length; k++) { const P = poly[k], Q = poly[(k + 1) % poly.length], sp = sgn(A, B, P) * orient, sq = sgn(A, B, Q) * orient;
      if (sp >= 0) next.push(P);
      if (sp * sq < 0) { const t = sp / (sp - sq); next.push([P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t]); } }
    poly = next;
  }
  let s = 0; for (let k = 0; k < poly.length; k++) { const P = poly[k], Q = poly[(k + 1) % poly.length]; s += P[0] * Q[1] - Q[0] * P[1]; }
  // the projection shrinks area by the normal's share on the dropped axis
  return Math.abs(s) / 2 / Math.abs(n[ax]);
}
