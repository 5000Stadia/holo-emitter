// The London street c.1660 (R46's street package; design/outdoor/research-1660.md §B, design/outdoor/digest-r46.md
// "Streets"): a main street of the City before the Fire, made from rules after CGA shape grammars (Müller et al. 2006,
// the basis of CityEngine: split, repeat, component split, stochastic rule choice). Each side of the street's spine is
// split into lots on a jittered lattice; each lot chooses, by hash, a frontage (a gabled, jettied house with a shop
// below; an inn, wider, with a carriage arch; a covered entry under a house; an open lane between houses), its storeys
// and their jetties, its framing, windows, colours, a sign; then splits into storeys, bays, windows and timbers.
// As data first (streetPlan: pure, no three.js, ready for a worker), then geometry (makeStreet): one merged mesh per
// material per block of lots, the posts one instanced draw, every texture drawn once and shared.
// Deterministic: every choice is hashN(seed, side, lattice index, choice) (src/make/noise.js), never Math.random, so a
// lot is a function of the seed and its place along the spine alone; any block builds alone, in any order, the same.
// Behind the street: framed backs, outshuts, yards; and the city beyond as cheap stand-ins (four rows of plain houses,
// production plan §5) so a raised view sees a town, not a set. Faces never share a plane by construction (each timber
// stops at the one it meets; walls start behind the timbers' ends), so nothing shimmers (coplanar.js finds ~14 m² of
// hidden residue in 255k triangles, from ~920 m² before).
//   makeStreet(THREE, { spine: [[x, y], ...], width = 10, seed = 1660, ground = (x, y) => 0, era = "pre-fire",
//                       order: "reverse" | "shuffle" (blocks built in another order: the same street), backland = true })
//     -> { group, lots, posts, plan, blocked(x, y, half = 0.22) -> bool, heightAt(x, y), frame(s, t) -> { x, y, z, yaw },
//          digest(), stats, ms, materials }
//   streetPlan(same options) -> { spine, lots, posts, backland, profile, ... }: the data alone, pure
// Plan coordinates x east, y north, z up; three's are (x, z, -y). A lot's own frame: u along its front (to your right
// as you face it from the street), d into the house (negative: out over the street), z up from its ground floor.
import { hashN, unit, valueNoise } from "./noise.js";

// ---- the rules: sourced [S] or chosen, as research-1660.md §B tags them
export const STREET_1660 = {
  cell: 5.25, jitter: 0.75,       // plots 4.5-6 m: the lattice's cells (§B3 chosen 4.5-6 m; Spitalfields 16 ft = 4.9 m)
  inn: 0.12,                      // an inn takes two cells, ~10.5 m (§B3 chosen 8-10 m for inns: a little over)
  lane: 0.26, openLane: 0.6,      // a lane mouth at an odd cell: open (by-lanes 2.5-3.5 m, §B1 chosen) or an entry under a house
  storeys: [[2, 0.14], [3, 0.5], [4, 0.36]],  // full storeys under the garret: 3-5 in all (§B3 [S] Cheapside "three, four, and even five")
  heights: [3.0, 3.2, 2.75, 2.6], // ground to third floor (§B3 [S] the 1667 Act: 10, 10.5, 9, 8.5 ft)
  jetty: [0.45, 0.6],             // a storey's projection (§B3 chosen; two stepped jetties on tall houses)
  jetties: [["none", 0.08], ["single", 0.27], ["double", 0.45], ["every", 0.2]],
  pitch: [50, 57], depth: [8.5, 12],          // clay plain tile wants 45°+ (chosen); plot depths (chosen)
  kennel: { half: 0.42, dip: 0.11 }, fall: 0.028,   // §B2 [S] the kennel down the middle; sides crowned (chosen)
  footway: 1.75, postEvery: 3.3,  // posts between walkers and carts (§B2 [S] 1662 Act "Posts"; spacing chosen)
  sign: 0.42,                     // §B4 [U] signs on iron brackets; boards 0.6-0.9 m, brackets 1-1.5 m (chosen)
  // limewash (§B3 [U]: "panels pale yellow, ochre, or sand-pink"): cream, ochre, sand-pink, off-white, buff, pale yellow
  plaster: [["#e9dcc0", 3], ["#dcc394", 2], ["#dbbba9", 1.6], ["#eee8da", 2], ["#d6c4a2", 1.4], ["#e3d3a0", 1.2]],
  // oak left to weather: silver-grey to grey-brown, never black (§B3 [U]: "no evidence timbers were blackened")
  oak: ["#a29a8d", "#958978", "#8a7c69", "#a7a195", "#91857a", "#857560"],
  limewashedOak: 0.12,            // timbers limewashed with the panels (§B3 [U] "or limewashed")
  tile: ["#8f5638", "#7f4a33", "#96603f", "#744634", "#8a5a42", "#93573c"],   // clay plain tile, red-brown, weathered (§B3 [U])
  trades: ["draper", "mercer", "potter", "grocer", "baker", "chandler", "cutler", "haberdasher"],
};
export const EMBLEMS = ["bell", "swan", "keys", "crown", "star", "sun", "moon", "tuns", "anchor", "rose", "cock", "ship", "ball", "mitre", "book", "sheaf"];
const r3 = (v) => Math.round(v * 1000) / 1000;          // whole millimetres
const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

// ---- the spine: arc length along a polyline, a smooth frame (tangents averaged at the vertices), and the inverse
export function spineOf(pts) {
  const n = pts.length, S = [0], D = [], T = [];
  for (let i = 1; i < n; i++) S.push(S[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  for (let i = 0; i < n - 1; i++) { const dx = pts[i + 1][0] - pts[i][0], dy = pts[i + 1][1] - pts[i][1], l = Math.hypot(dx, dy) || 1; D.push([dx / l, dy / l]); }
  for (let i = 0; i < n; i++) { const a = D[Math.max(0, i - 1)], b = D[Math.min(n - 2, i)], tx = a[0] + b[0], ty = a[1] + b[1], l = Math.hypot(tx, ty) || 1; T.push([tx / l, ty / l]); }
  const L = S[n - 1];
  const seg = (s) => { let lo = 0, hi = n - 2; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (S[m] <= s) lo = m; else hi = m - 1; } return lo; };
  // the point and frame at s (beyond the ends, straight on): tangent (tx, ty), left normal (nx, ny)
  function at(s) {
    if (s <= 0 || s >= L) { const i = s <= 0 ? 0 : n - 1, e = s <= 0 ? s : s - L, t = T[i]; return { x: pts[i][0] + t[0] * e, y: pts[i][1] + t[1] * e, tx: t[0], ty: t[1], nx: -t[1], ny: t[0] }; }
    const i = seg(s), f = (s - S[i]) / (S[i + 1] - S[i]);
    let tx = T[i][0] + (T[i + 1][0] - T[i][0]) * f, ty = T[i][1] + (T[i + 1][1] - T[i][1]) * f; const l = Math.hypot(tx, ty); tx /= l; ty /= l;
    return { x: pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, y: pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f, tx, ty, nx: -ty, ny: tx };
  }
  // the inverse: (x, y) -> { s, t } (t + to the left), by the nearest segment from a bucket grid, then refined on the
  // smooth frame; null farther than `reach` from the spine
  const G = 16, reach = 40, buckets = new Map(), key = (i, j) => i * 92821 + j;
  for (let i = 0; i < n - 1; i++) {
    const x0 = Math.floor((Math.min(pts[i][0], pts[i + 1][0]) - reach) / G), x1 = Math.floor((Math.max(pts[i][0], pts[i + 1][0]) + reach) / G);
    const y0 = Math.floor((Math.min(pts[i][1], pts[i + 1][1]) - reach) / G), y1 = Math.floor((Math.max(pts[i][1], pts[i + 1][1]) + reach) / G);
    for (let a = x0; a <= x1; a++) for (let b = y0; b <= y1; b++) { const k = key(a, b); if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(i); }
  }
  function project(x, y) {
    const list = buckets.get(key(Math.floor(x / G), Math.floor(y / G))); if (!list) return null;
    let best = -1, bd = Infinity, bs = 0;
    for (const i of list) { const ax = pts[i][0], ay = pts[i][1], dx = pts[i + 1][0] - ax, dy = pts[i + 1][1] - ay, ll = dx * dx + dy * dy || 1;
      const f = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / ll)), d = Math.hypot(x - ax - dx * f, y - ay - dy * f);
      if (d < bd) { bd = d; best = i; bs = S[i] + f * (S[i + 1] - S[i]); } }
    if (best < 0 || bd > reach) return null;
    let s = bs; for (let k = 0; k < 2; k++) { const a = at(s); s += (x - a.x) * a.tx + (y - a.y) * a.ty; }
    const a = at(s); return { s, t: (x - a.x) * a.nx + (y - a.y) * a.ny };
  }
  return { length: L, at, project, pts };
}

// ---- the plan: pure data, from the spine, the seed and the ground
export function streetPlan({ spine, width = 10, seed = 1660, ground = () => 0, era = "pre-fire", rules = STREET_1660 } = {}) {
  if (era !== "pre-fire") throw new Error(`street: no rules authored for the era "${era}"`);
  const T0 = now(), R = rules, sp = spineOf(spine), half = width / 2, L = sp.length;
  const H = (side, k, n) => unit(hashN(seed, side, k, n));
  const pick = (list, r) => { const tot = list.reduce((a, [, w]) => a + w, 0); let x = r * tot; for (const [v, w] of list) if ((x -= w) < 0) return v; return list[list.length - 1][0]; };
  const profile = (t) => { const a = Math.abs(t), K = R.kennel; return a < K.half ? -K.dip * (1 - a / K.half) : R.fall * (a - K.half); };
  // the lattice: boundary k at k cells along, jittered by its own hash; so cell widths are cell ± jitter
  const bnd = (side, k) => k * R.cell + (H(side, k, 1) - 0.5) * R.jitter;
  const kLo = Math.ceil((0.6 + R.jitter / 2) / R.cell), kHi = Math.floor((L - 0.6 - R.jitter / 2) / R.cell) - 1;
  const inRange = (k) => k >= kLo && k <= kHi;
  const innAt = (side, k) => { const m = Math.floor(k / 2); return inRange(2 * m) && inRange(2 * m + 1) && H(side, m, 2) < R.inn; };
  const laneAt = (side, k) => (k & 1) === 1 && inRange(k - 1) && inRange(k + 1) && !innAt(side, k) && !innAt(side, k - 1) && !innAt(side, k + 1) && H(side, k, 3) < R.lane;
  const laneOf = (side, k) => { const open = H(side, k, 4) < R.openLane, a = bnd(side, k), b = bnd(side, k + 1), w = open ? 2.5 + H(side, k, 5) : 1.5 + 0.7 * H(side, k, 5), m = (a + b) / 2;
    return { open, w: r3(w), s0: m - w / 2, s1: m + w / 2 }; };
  // a lot's frame: its two front corners on the frontage line and the boundary lines into the house, the spine's
  // normals there, so two lots share their boundary exactly
  const frontAt = (s, sg) => { const a = sp.at(s); return { p: [r3(a.x + a.nx * half * sg), r3(a.y + a.ny * half * sg)], m: [a.nx * sg, a.ny * sg] }; };
  const frameOf = (side, s0, s1) => { const sg = side === 1 ? 1 : -1, f0 = frontAt(s0, sg), f1 = frontAt(s1, sg), [a, b] = side === 1 ? [f0, f1] : [f1, f0];
    return { A: a.p, B: b.p, mA: a.m, mB: b.m }; };
  const along = (fr, f, d = 0) => [fr.A[0] + fr.mA[0] * d + (fr.B[0] + fr.mB[0] * d - fr.A[0] - fr.mA[0] * d) * f, fr.A[1] + fr.mA[1] * d + (fr.B[1] + fr.mB[1] * d - fr.A[1] - fr.mA[1] * d) * f];
  // the ground floor stands a little above the footway's highest point along its front; its plinth goes below the lowest
  const frontZ = (fr, fn) => [0, 0.25, 0.5, 0.75, 1].map(f => { const [x, y] = along(fr, f); return ground(x, y) + profile(half); }).reduce((a, b) => fn(a, b));
  const W_ = (fr) => Math.hypot(fr.B[0] - fr.A[0], fr.B[1] - fr.A[1]);

  // a house on a lot: its storeys and jetties, gable, framing, windows, ground floor, colours, sign
  function house(side, k, s0, s1, kind, fr = frameOf(side, s0, s1), salt = 0) {
    const h = (n) => H(side, k, n + salt), W = r3(W_(fr)), inn = kind === "inn", back = kind === "back";
    const n = back ? 2 : inn ? (h(10) < 0.5 ? 2 : 3) : pick(R.storeys, h(10)), jet = back ? "single" : pick(R.jetties, h(11));
    const storeys = []; let z = 0, d = 0;
    for (let i = 0; i < n; i++) {
      const ht = r3(inn && i === 0 ? 3.75 : (back ? [2.8, 2.7][i] : R.heights[Math.min(i, 3)]) + (h(20 + i) - 0.5) * 0.2);
      if (i > 0 && jet !== "none" && (i === 1 || jet === "every" || (jet === "double" && i === 2))) d -= R.jetty[0] + (R.jetty[1] - R.jetty[0]) * h(30 + i);
      storeys.push({ z: r3(z), h: ht, d: r3(d) }); z += ht; }
    const top = storeys[n - 1], zG = r3(top.z + top.h), gj = h(12) < 0.6 ? r3(0.12 + 0.16 * h(13)) : 0, pitch = (R.pitch[0] + (R.pitch[1] - R.pitch[0]) * h(14)) * Math.PI / 180;
    const spans = inn ? [[0, r3(W / 2)], [r3(W / 2), W]] : [[0, W]], rise = r3((spans[0][1] - spans[0][0]) / 2 * Math.tan(pitch));
    const depth = r3(back ? 6 + 2 * h(15) : inn ? 12 + 2 * h(15) : R.depth[0] + (R.depth[1] - R.depth[0]) * h(15));
    const framing = h(16) < 0.42 ? "close" : h(16) < 0.78 ? "square" : "lozenge";
    const windows = storeys.map((_, i) => i === 0 ? null : W < 4.9 ? (h(40 + i) < 0.6 ? "band" : "single") : h(40 + i) < 0.45 ? "band" : h(40 + i) < 0.8 ? "pair" : "single");
    const oriel = !inn && !back && n > 1 && W >= 4.8 && h(17) < 0.24 ? [r3(W * 0.2), r3(W * 0.8)] : null;
    // the ground floor: a shop (its shutters open by day), a private door and window, an entry, an inn's arch
    const doorA = h(18) < 0.5, dw = 0.95, groundF = { door: doorA ? [0.4, r3(0.4 + dw)] : [r3(W - 0.4 - dw), r3(W - 0.4)] };
    if (inn) { groundF.arch = [r3(W / 2 - 1.55), r3(W / 2 + 1.55)]; groundF.door = doorA ? [0.6, 1.55] : [r3(W - 1.55), r3(W - 0.6)]; groundF.windows = [doorA ? [1.95, r3(W / 2 - 2.0)] : [0.6, r3(W / 2 - 2.0)], doorA ? [r3(W / 2 + 2.0), r3(W - 0.6)] : [r3(W / 2 + 2.0), r3(W - 1.95)]]; }
    else if (kind === "entry") { const pw = r3(1.5 + 0.6 * h(5)); groundF.passage = doorA ? [r3(W - 0.4 - pw), r3(W - 0.4)] : [0.4, r3(0.4 + pw)];
      groundF.door = doorA ? [0.4, r3(0.4 + dw)] : [r3(W - 0.4 - dw), r3(W - 0.4)];
      const free = doorA ? [r3(0.4 + dw + 0.35), r3(groundF.passage[0] - 0.35)] : [r3(groundF.passage[1] + 0.35), r3(W - 0.4 - dw - 0.35)];
      if (free[1] - free[0] > 0.7) groundF.windows = [free]; }
    else if (back) { groundF.windows = [doorA ? [r3(W * 0.55), r3(W - 0.6)] : [0.6, r3(W * 0.45)]]; }
    else if (h(19) < 0.88) { groundF.shop = doorA ? [r3(0.4 + dw + 0.32), r3(W - 0.4)] : [0.4, r3(W - 0.4 - dw - 0.32)]; groundF.trade = R.trades[Math.floor(h(9) * R.trades.length)]; }
    else groundF.windows = [doorA ? [r3(0.4 + dw + 0.4), r3(W - 0.5)] : [0.5, r3(W - 0.4 - dw - 0.4)]];
    const plaster = pick(R.plaster.map(([c, w]) => [c, w]), h(50)), limewashed = h(51) < R.limewashedOak;
    const lot = { id: `street/${seed}/${side === 1 ? "L" : "R"}/${k}${salt ? "/back" : ""}`, side: side === 1 ? "L" : "R", k, kind, s0: r3(s0), s1: r3(s1), width: W, depth,
      frame: fr, floor: r3(frontZ(fr, Math.max) + 0.04), low: r3(frontZ(fr, Math.min)), storeys, jetty: jet,
      gable: { z: zG, d: r3(top.d - gj), jetty: gj, pitch: r3(pitch), rise, spans, apex: r3(zG + 0.17 + rise) },
      framing, windows, oriel, ground: groundF,
      colours: { plaster, oak: limewashed ? "#" + plaster.slice(1).match(/../g).map(c => Math.round(parseInt(c, 16) * 0.86).toString(16).padStart(2, "0")).join("") : R.oak[Math.floor(h(52) * R.oak.length)], tile: R.tile[Math.floor(h(53) * R.tile.length)], limewashed },
      lean: r3((h(54) - 0.25) * 0.012), open: { a: false, b: false }, stacks: [] };
    lot.eaveZ = r3(lot.floor + zG + 0.17); lot.apexZ = r3(lot.floor + lot.gable.apex);
    if (!back && n > 1 && (inn || h(55) < R.sign)) { const e = Math.floor(h(56) * EMBLEMS.length);
      lot.sign = { emblem: e, name: EMBLEMS[e], edge: h(57) < 0.5 ? "a" : "b", reach: r3(inn ? 1.55 : 1.12 + 0.35 * h(58)), board: inn ? [0.95, 1.15] : [r3(0.68 + 0.14 * h(59)), r3(0.8 + 0.12 * h(59))] }; }
    lot.lantern = !back && h(60) < 0.32;
    return lot;
  }
  // what stands behind an entry or an inn's arch, or closes a lane's end: a yard, and a small house across it
  const backHouse = (parent, u0, u1, dB, salt) => { const fr = parent.frame, A = along(fr, u0 / parent.width, dB), B = along(fr, u1 / parent.width, dB);
    const m = [(fr.mA[0] + fr.mB[0]) / 2, (fr.mA[1] + fr.mB[1]) / 2], ml = Math.hypot(m[0], m[1]);
    return house(parent.side === "L" ? 1 : 2, parent.k, parent.s0, parent.s1, "back", { A: A.map(r3), B: B.map(r3), mA: [m[0] / ml, m[1] / ml], mB: [m[0] / ml, m[1] / ml] }, salt); };

  const lots = [];
  for (const side of [1, 2]) for (let k = kLo; k <= kHi; k++) {
    if (innAt(side, k) && (k & 1)) continue;                       // the inn's second cell
    if (laneAt(side, k)) { const ln = laneOf(side, k);
      if (ln.open) { const fr = frameOf(side, ln.s0, ln.s1), W = r3(W_(fr)), depth = r3(17 + 6 * H(side, k, 6));
        const lane = { id: `street/${seed}/${side === 1 ? "L" : "R"}/${k}`, side: side === 1 ? "L" : "R", k, kind: "lane", s0: r3(ln.s0), s1: r3(ln.s1), width: W, depth, frame: fr, floor: r3(frontZ(fr, Math.max)), low: r3(frontZ(fr, Math.min)) };
        lane.back = backHouse(lane, -2.2, W + 2.2, depth, 1000); lots.push(lane); continue; }
      const lot = house(side, k, bnd(side, k), bnd(side, k + 1), "entry"), p = lot.ground.passage;
      lot.yard = { u0: r3(Math.max(0.25, p[0] - 1.2)), u1: r3(Math.min(lot.width - 0.25, p[1] + 1.2)), d0: lot.depth, d1: r3(lot.depth + 5) };
      lot.back = backHouse(lot, lot.yard.u0 - 1.5, lot.yard.u1 + 1.5, lot.yard.d1, 1000); lots.push(lot); continue; }
    let s0 = bnd(side, k), s1 = bnd(side, innAt(side, k) ? k + 2 : k + 1);
    if (laneAt(side, k - 1) && laneOf(side, k - 1).open) s0 = laneOf(side, k - 1).s1;
    const kn = innAt(side, k) ? k + 2 : k + 1; if (laneAt(side, kn) && laneOf(side, kn).open) s1 = laneOf(side, kn).s0;
    const lot = house(side, k, s0, s1, innAt(side, k) ? "inn" : "house");
    if (lot.kind === "inn") { lot.yard = { u0: 0.4, u1: r3(lot.width - 0.4), d0: lot.depth, d1: r3(lot.depth + 12) }; lot.back = backHouse(lot, 0.4, lot.width - 0.4, lot.yard.d1, 1000); lot.back.gallery = true; }
    lots.push(lot);
  }
  // second pass, along each row: the side walls open to a lane or the street's end; a stack on some party walls;
  // two signs never on one boundary
  for (const side of ["L", "R"]) { const row = lots.filter(l => l.side === side).sort((a, b) => a.s0 - b.s0), sd = side === "L" ? 1 : 2;
    const hiEdge = side === "L" ? "b" : "a", loEdge = side === "L" ? "a" : "b";      // the edge at s1, the edge at s0
    row.forEach((X, i) => { if (X.kind === "lane") return; const prev = row[i - 1], next = row[i + 1];
      if (!prev || prev.kind === "lane" || Math.abs(prev.s1 - X.s0) > 1e-6) X.open[loEdge] = true;
      if (!next || next.kind === "lane" || Math.abs(next.s0 - X.s1) > 1e-6) X.open[hiEdge] = true; });
    for (let i = 0; i + 1 < row.length; i++) { const X = row[i], Y = row[i + 1]; if (X.kind === "lane" || Y.kind === "lane" || Math.abs(X.s1 - Y.s0) > 1e-6) continue;
      if (X.sign && Y.sign && X.sign.edge === hiEdge && Y.sign.edge === loEdge) Y.sign.edge = hiEdge;
      if (H(sd, X.k, 61) < 0.42) { const D = Math.min(X.depth, Y.depth), d0 = r3(D * (0.28 + 0.3 * H(sd, X.k, 62))), len = r3(0.9 + 0.7 * H(sd, X.k, 63));
        X.stacks.push({ edge: hiEdge, d0, d1: r3(d0 + len), z0: r3(Math.min(X.eaveZ, Y.eaveZ) - 0.5), z1: r3(Math.max(X.apexZ, Y.apexZ) + 0.75 + 0.6 * H(sd, X.k, 64)), flues: 2 + Math.floor(H(sd, X.k, 65) * 3) }); } }
  }
  // behind a house, often an outshut: a lean-to of a storey or two under its own tiled roof (kept clear of a lane's wall)
  for (const X of lots) { if (X.kind !== "house") continue; const sd = X.side === "L" ? 1 : 2, h = (n) => H(sd, X.k, n), W = X.width;
    if (lots.some(Y => Y.side === X.side && Y.yard && (Math.abs(Y.s1 - X.s0) < 1e-6 || Math.abs(Y.s0 - X.s1) < 1e-6))) continue;
    if (h(90) >= 0.62) continue; const full = h(91) < 0.5, u0 = full || h(92) < 0.5 ? 0 : r3(W * 0.42), u1 = full || u0 > 0 ? W : r3(W * 0.6);
    const zt0 = X.gable.z + 0.17, tall = h(93) < 0.3 && zt0 > 7.4;
    X.outshut = { u0: r3(u0 + (X.open.a && u0 === 0 ? 0.35 : 0)), u1: r3(u1 - (X.open.b && u1 === W ? 0.35 : 0)), depth: r3(2.2 + 1.6 * h(94)), h: r3(tall ? 5.6 : 2.6 + 0.3 * h(95)), rise: 1.1 }; }
  // the city behind (stand-ins: production plan §5, "far things are cheap stand-ins"): the houses of the next streets in
  // two rows behind each side, on their own lattice, never where a lane, an entry or an inn's yard runs back
  const backland = [];
  for (const side of [1, 2]) { const nm = side === 1 ? "L" : "R", deep = lots.filter(l => l.side === nm && (l.kind === "lane" || l.yard)).map(l => [l.s0 - 4, l.s1 + 4, (l.kind === "lane" ? l.depth : l.yard.d1) + l.back.depth + 1]);
    for (const [row, d0] of [[0, 17], [1, 38], [2, 59], [3, 81]]) for (let k = row < 2 ? -3 : -8; k * 6.5 < L + (row < 2 ? 20 : 52); k++) {
      const b0 = k * 6.5 + (H(side, k, 80 + row) - 0.5) * 1.6, b1 = (k + 1) * 6.5 + (H(side, k + 1, 80 + row) - 0.5) * 1.6;
      if (deep.some(([a, b, dd]) => b0 < b && b1 > a && dd > d0)) continue;
      const fr = frameOf(side, b0, b1), dep = r3(8 + 3 * H(side, k, 82 + row)), [cx, cy] = along(fr, 0.5, d0 + dep / 2), floors = 2 + Math.floor(H(side, k, 84 + row) * 2.2);
      backland.push({ side: nm, k, row, s0: r3(b0), s1: r3(b1), frame: fr, width: r3(W_(fr)), d0, depth: dep, floor: r3(ground(cx, cy)), h: r3(floors * 2.9 + 0.3), ridge: H(side, k, 86 + row) < 0.55 ? "across" : "along",
        plaster: pick(R.plaster, H(side, k, 88 + row)), tile: R.tile[Math.floor(H(side, k, 90 + row) * R.tile.length)], stack: H(side, k, 92 + row) < 0.45 }); } }
  // the posts along each footway's edge, on their own lattice; none across a lane's mouth, an entry or an arch
  const posts = [];
  for (const side of [1, 2]) { const sg = side === 1 ? 1 : -1, nm = side === 1 ? "L" : "R";
    const gaps = lots.filter(l => l.side === nm).flatMap(l => { if (l.kind === "lane") return [[l.s0 - 0.5, l.s1 + 0.5]]; const o = l.ground.passage || l.ground.arch; if (!o) return [];
      const f = (u) => nm === "L" ? l.s0 + (l.s1 - l.s0) * u / l.width : l.s1 - (l.s1 - l.s0) * u / l.width, a = f(o[0]), b = f(o[1]); return [[Math.min(a, b) - 0.6, Math.max(a, b) + 0.6]]; });
    for (let i = Math.ceil(1.5 / R.postEvery); i * R.postEvery < L - 1.5; i++) { const s = r3(i * R.postEvery + (H(side, i, 70) - 0.5) * 0.7);
      if (H(side, i, 71) < 0.12 || gaps.some(([a, b]) => s > a && s < b)) continue;
      const a = sp.at(s), t = sg * (half - R.footway), x = r3(a.x + a.nx * t), y = r3(a.y + a.ny * t);
      posts.push({ s, side: nm, x, y, z: r3(ground(x, y) + profile(t)), h: r3(1.0 + 0.2 * H(side, i, 72)), r: r3(0.13 + 0.04 * H(side, i, 73)), yaw: r3(Math.atan2(a.ty, a.tx)), tilt: [r3((H(side, i, 74) - 0.5) * 0.06), r3((H(side, i, 75) - 0.5) * 0.06)] }); } }
  return { spine: sp, width, half, seed, lots, posts, backland, profile, ground, rules: R, ms: Math.round((now() - T0) * 10) / 10 };
}

// ---- geometry: an accumulator per material per block, written straight into arrays (no geometry object per piece)
class Acc {
  constructor() { this.p = []; this.n = []; this.uv = []; this.c = []; this.ix = []; this.v = 0; }
  vert(P, N, u, v, C) { this.p.push(P[0], P[1], P[2]); this.n.push(N[0], N[1], N[2]); this.uv.push(u, v); this.c.push(C[0], C[1], C[2]); return this.v++; }
}
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], scl = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const nrm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
// colours: sRGB hex to linear, scaled, mixed
export const lin = (hex) => { const v = parseInt(hex.slice(1), 16), f = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }; return [f(v >> 16), f((v >> 8) & 255), f(v & 255)]; };
const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k], mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// a lot's frame as a vertex function: local (u, d, z) to three's coordinates, by the lot's two boundary lines (so two
// lots meet exactly), the house leaning a little toward the street as it rises (old frames settle forward)
function frameXf(lot) {
  const { A, B, mA, mB } = lot.frame, W = lot.width, z0 = lot.floor, lean = lot.lean || 0, ux = (B[0] - A[0]) / W, uy = (B[1] - A[1]) / W;
  return { W, z0,
    p(u, d, z) { const f = u / W, dd = d - lean * Math.max(0, z), ax = A[0] + mA[0] * dd, ay = A[1] + mA[1] * dd, bx = B[0] + mB[0] * dd, by = B[1] + mB[1] * dd;
      return [ax + (bx - ax) * f, z0 + z, -(ay + (by - ay) * f)]; },
    n(a, b, c) { return [ux * a - uy * b, c, -(uy * a + ux * b)]; },
    // the inverse on the ground plane (for what stops a body): plan (x, y) to local (u, d), by the chord
    local(x, y) { const dx = x - A[0], dy = y - A[1]; return [dx * ux + dy * uy, -dx * uy + dy * ux]; } };
}
// a quad from four local points; wound outward along `out` (a local direction) if given; uv per corner; colour a
// triple or a function of the local point
function quad(acc, X, a, b, c, d, uv, col, out) {
  let n = cross(sub(b, a), sub(c, a));
  if (out && dot(n, out) < 0) { [b, d] = [d, b]; uv = [uv[0], uv[3], uv[2], uv[1]]; n = scl(n, -1); }
  const N = (([x, y, z]) => X.n(x, y, z))(nrm(n)), f = typeof col === "function", i = acc.v;
  for (const [k, P] of [a, b, c, d].entries()) acc.vert(X.p(P[0], P[1], P[2]), N, uv[k][0], uv[k][1], f ? col(P) : col);
  acc.ix.push(i, i + 1, i + 2, i, i + 2, i + 3);
}
const tri = (acc, X, a, b, c, uv, col, out) => { let n = cross(sub(b, a), sub(c, a)); if (out && dot(n, out) < 0) { [b, c] = [c, b]; uv = [uv[0], uv[2], uv[1]]; n = scl(n, -1); }
  const N = X.n(...nrm(n)), f = typeof col === "function", i = acc.v; for (const [k, P] of [a, b, c].entries()) acc.vert(X.p(P[0], P[1], P[2]), N, uv[k][0], uv[k][1], f ? col(P) : col); acc.ix.push(i, i + 1, i + 2); };
// an axis-aligned box in the lot's frame; uv in metres over `tex`, u along the member's length (the grain), offset by
// `o` so no two members show the same grain; `skip` drops faces nobody sees ("u-", "u+", "d-", "d+", "z-", "z+")
let grainN = 0;
function box(acc, X, u0, u1, d0, d1, z0, z1, col, { tex = 1, skip = "", o = null } = {}) {
  if (u1 - u0 < 1e-4 || d1 - d0 < 1e-4 || z1 - z0 < 1e-4) return;
  const L = [u1 - u0, d1 - d0, z1 - z0], long = L[0] >= L[1] && L[0] >= L[2] ? 0 : L[1] >= L[2] ? 1 : 2, oo = o ?? ((grainN = (grainN + 7919) % 10007) / 10007) * 7.3;
  const lo = [u0, d0, z0], hi = [u1, d1, z1];
  for (const [ax, sg, tag] of [[0, -1, "u-"], [0, 1, "u+"], [1, -1, "d-"], [1, 1, "d+"], [2, -1, "z-"], [2, 1, "z+"]]) { if (skip.includes(tag)) continue;
    const e = [0, 1, 2].filter(i => i !== ax), [ua, va] = e.includes(long) ? [long, e.find(i => i !== long)] : (L[e[0]] >= L[e[1]] ? [e[0], e[1]] : [e[1], e[0]]);
    const P = (i, j) => { const p = [0, 0, 0]; p[ax] = sg < 0 ? lo[ax] : hi[ax]; p[e[0]] = i ? hi[e[0]] : lo[e[0]]; p[e[1]] = j ? hi[e[1]] : lo[e[1]]; return p; };
    const pts = [P(0, 0), P(1, 0), P(1, 1), P(0, 1)], uv = pts.map(p => [(p[ua] + oo) / tex, (p[va] + oo * 0.37) / tex]), out = [0, 0, 0]; out[ax] = sg;
    quad(acc, X, ...pts, uv, col, out); }
}
// a beam from p to q (local points), w wide across `hint`'s perpendicular, t thick along it; uv along its length
function beam(acc, X, p, q, w, t, hint, col, tex = 1) {
  const e = nrm(sub(q, p)), len = Math.hypot(...sub(q, p)), e2 = nrm(sub(hint, scl(e, dot(hint, e)))), e1 = cross(e, e2), c = scl(add(p, q), 0.5), oo = ((grainN = (grainN + 7919) % 10007) / 10007) * 7.3;
  const C = (a, i, j) => add(add(a, scl(e1, (i - 0.5) * w)), scl(e2, (j - 0.5) * t));
  for (const [i0, j0, i1, j1] of [[0, 0, 1, 0], [1, 0, 1, 1], [1, 1, 0, 1], [0, 1, 0, 0]]) { const a = C(p, i0, j0), b = C(q, i0, j0), cc = C(q, i1, j1), d = C(p, i1, j1), m = scl(add(a, cc), 0.5);
    quad(acc, X, a, b, cc, d, [[oo / tex, 0], [(oo + len) / tex, 0], [(oo + len) / tex, w / tex], [oo / tex, w / tex]], col, sub(m, c)); }
  for (const [a0, s] of [[p, -1], [q, 1]]) quad(acc, X, C(a0, 0, 0), C(a0, 1, 0), C(a0, 1, 1), C(a0, 0, 1), [[0, 0], [w / tex, 0], [w / tex, t / tex], [0, t / tex]], col, scl(e, s));
}
// a prism: a polygon in the (d, z) plane, star-shaped from its first point, from u0 to u1 (a jetty's bracket)
function prism(acc, X, poly, u0, u1, col, tex = 1) {
  const n = poly.length, cd = poly.reduce((a, p) => a + p[0], 0) / n, cz = poly.reduce((a, p) => a + p[1], 0) / n;
  for (const [u, s] of [[u0, -1], [u1, 1]]) for (let i = 1; i + 1 < n; i++) { const P = [poly[0], poly[i], poly[i + 1]].map(([d, z]) => [u, d, z]);
    tri(acc, X, P[0], P[1], P[2], P.map(p => [p[1] / tex, p[2] / tex]), col, [s, 0, 0]); }
  for (let i = 0; i < n; i++) { const [d0, z0] = poly[i], [d1, z1] = poly[(i + 1) % n], out = [0, (d0 + d1) / 2 - cd, (z0 + z1) / 2 - cz], l = Math.hypot(d1 - d0, z1 - z0);
    quad(acc, X, [u0, d0, z0], [u1, d0, z0], [u1, d1, z1], [u0, d1, z1], [[0, 0], [(u1 - u0) / tex, 0], [(u1 - u0) / tex, l / tex], [0, l / tex]], col, out); }
}
// a wall in the (u, z) plane at depth d, facing the street (face -1) or away (face +1), with rectangular holes
// [u0, u1, z0, z1]; split into bands at the holes' edges; uv in metres over `tex`
function wallHoles(acc, X, u0, u1, z0, z1, d, holes, col, face = -1, tex = 2) {
  if (u1 - u0 < 1e-3 || z1 - z0 < 1e-3) return;
  const zs = [...new Set([z0, z1, ...holes.flatMap(h => [h[2], h[3]]).filter(z => z > z0 && z < z1)])].sort((a, b) => a - b);
  for (let i = 0; i + 1 < zs.length; i++) { const za = zs[i], zb = zs[i + 1], cut = holes.filter(h => h[2] <= za + 1e-6 && h[3] >= zb - 1e-6 && h[1] > u0 && h[0] < u1).sort((a, b) => a[0] - b[0]);
    let at = u0; const runs = []; for (const h of cut) { if (h[0] > at) runs.push([at, Math.min(h[0], u1)]); at = Math.max(at, h[1]); } if (at < u1) runs.push([at, u1]);
    for (const [a, b] of runs) if (b - a > 1e-3) quad(acc, X, [a, d, za], [b, d, za], [b, d, zb], [a, d, zb], [[a / tex, za / tex], [b / tex, za / tex], [b / tex, zb / tex], [a / tex, zb / tex]], col, [0, face, 0]); }
}
// a side wall in the (d, z) plane at u, facing -u (side -1) or +u; holes [d0, d1, z0, z1]
function sideHoles(acc, X, u, d0, d1, z0, z1, holes, col, side, tex = 2) {
  const zs = [...new Set([z0, z1, ...holes.flatMap(h => [h[2], h[3]]).filter(z => z > z0 && z < z1)])].sort((a, b) => a - b);
  for (let i = 0; i + 1 < zs.length; i++) { const za = zs[i], zb = zs[i + 1], cut = holes.filter(h => h[2] <= za + 1e-6 && h[3] >= zb - 1e-6).sort((a, b) => a[0] - b[0]);
    let at = d0; const runs = []; for (const h of cut) { if (h[0] > at) runs.push([at, h[0]]); at = Math.max(at, h[1]); } if (at < d1) runs.push([at, d1]);
    for (const [a, b] of runs) if (b - a > 1e-3) quad(acc, X, [u, a, za], [u, b, za], [u, b, zb], [u, a, zb], [[a / tex, za / tex], [b / tex, za / tex], [b / tex, zb / tex], [a / tex, zb / tex]], col, [side, 0, 0]); }
}

// ---- the look: every texture drawn once in code (per page), each material shared by its role; colours of the
// textures are the materials' own, and a vertex's colour is a tint near one (a house's limewash, its oak, its tiles)
// and the grime of where it stands
const KITS = new WeakMap();
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
export { streetKit };   // for tools/check-textures.mjs (lab/scale/materials.html)
function streetKit(THREE) {
  if (KITS.has(THREE)) return KITS.get(THREE);
  const T0 = now(), cv = (w, h) => Object.assign(document.createElement("canvas"), { width: w, height: h });
  const tex = (c, srgb = true) => { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; };
  const pixels = (N, M, fn) => { const c = cv(N, M), g = c.getContext("2d"), im = g.createImageData(N, M), d = im.data;
    for (let y = 0; y < M; y++) for (let x = 0; x < N; x++) { const o = (y * N + x) * 4, [r, gg, b] = fn(x, y); d[o] = r; d[o + 1] = gg; d[o + 2] = b; d[o + 3] = 255; } g.putImageData(im, 0, 0); return c; };
  // a normal map from heights (wrapping): canvas y runs down, the texture's v up
  const normals = (h, N, M, k) => pixels(N, M, (x, y) => { const at = (i, j) => h[((j + M) % M) * N + ((i + N) % N)], gx = (at(x + 1, y) - at(x - 1, y)) * k, gy = (at(x, y + 1) - at(x, y - 1)) * k, l = Math.sqrt(gx * gx + gy * gy + 1);
    return [(-gx / l * 0.5 + 0.5) * 255, (gy / l * 0.5 + 0.5) * 255, (1 / l * 0.5 + 0.5) * 255]; });
  const T = {}, parts = {}; let tl = now(); const lap = (k) => { const t = now(); parts[k] = Math.round(t - tl); tl = t; };   // ms per texture, kept in kit.parts
  lap("start");
  // limewash (the texture covers 4 m, 2 before 2026-10-07: a wall seen along the street showed its own dirt marks every 2 m): coats laid by brush, thicker and thinner, a little dirt in its hollows
  { const N = 1024, n = noiseTex(N, N, [[8, 8], [18, 18], [48, 48], [128, 128]], 11, [1, 0.8, 0.5, 0.35]), r = stream("street/plaster");
    const c = pixels(N, N, (x, y) => { const v = 0.9 + (n[y * N + x] - 0.5) * 0.2 + (r() - 0.5) * 0.025; return [246 * v, 241 * v, 230 * v]; });
    const g = c.getContext("2d"); g.lineCap = "round";
    for (let i = 0; i < 104; i++) { let x = r() * N, y = r() * N; g.strokeStyle = `rgba(80,70,55,${0.16 + r() * 0.16})`; g.lineWidth = 0.7 + r() * 0.6; g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 26; y += (r() - 0.3) * 22; g.lineTo(x, y); } g.stroke(); }
    T.plaster = tex(c); T.plaster.repeat.set(0.5, 0.5); }   // (uv are metres / 2: one tile to two uv units)
  lap("plaster");
  // weathered oak (2 m along the grain by 0.5 m across): silver-grey, the grain opened by weather, checks and knots
  { const N = 512, M = 256, n = noiseTex(N, M, [[2, 48], [4, 96], [8, 24]], 21, [1, 0.6, 0.4]), r = stream("street/oak");
    const c = pixels(N, M, (x, y) => { const k = n[y * N + x], line = Math.sin(y * 0.9 + k * 18) * 0.5 + 0.5, v = 0.78 + k * 0.3 - line * line * 0.12 + (r() - 0.5) * 0.04; return [168 * v, 160 * v, 148 * v]; });
    const g = c.getContext("2d");
    for (let i = 0; i < 70; i++) { const x = r() * N, y = r() * M, l = 20 + r() * 110; g.strokeStyle = `rgba(40,34,28,${0.35 + r() * 0.35})`; g.lineWidth = 0.8 + r() * 1.3; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l / 2, y + (r() - 0.5) * 4, x + l, y + (r() - 0.5) * 3); g.stroke(); }
    for (let i = 0; i < 5; i++) { const x = r() * N, y = r() * M; g.fillStyle = "rgba(60,48,36,0.55)"; g.beginPath(); g.ellipse(x, y, 5 + r() * 6, 3 + r() * 3, 0, 0, 7); g.fill(); g.strokeStyle = "rgba(50,40,30,0.3)"; g.lineWidth = 1.5; g.beginPath(); g.ellipse(x, y, 11 + r() * 6, 5 + r() * 3, 0, 0, 7); g.stroke(); }
    T.oak = tex(c); }
  lap("oak");
  // leaded quarries (0.42 m by 0.6 m): diamond panes of old crown glass, green-grey, each catching the sky its own way
  { const N = 256, r = stream("street/glass");
    T.glass = tex(pixels(N, N, (x, y) => { const p = (x + y) / 64, q = (x - y + 256) / 64, ip = Math.floor(p), iq = Math.floor(q), fp = p - ip, fq = q - iq, e = Math.min(fp, 1 - fp, fq, 1 - fq) * 45;
      if (e < 2.2) return [38, 38, 36];
      const h = unit(hashN(ip & 3, iq & 3, 5)), sky = Math.max(0, 1 - (fq + (1 - fp)) * 0.8) * (0.4 + 0.6 * h), v = 0.7 + 0.3 * h, gl = Math.min(1, (e - 2.2) / 3);
      return [(78 + 110 * sky) * v * gl + 52 * (1 - gl), (92 + 112 * sky) * v * gl + 52 * (1 - gl), (86 + 116 * sky) * v * gl + 50 * (1 - gl)]; })); }
  lap("glass");
  // clay plain tiles (4 m square, 2 before 2026-10-07): courses of 0.1 m gauge, tiles 1/6 m wide, half-lapped; burnt and pale ones, moss,
  // the shadow of each course on the next; and a normal map from the same heights
  { const N = 1024, CH = N / 40, TW = N / 24, n = noiseTex(N, N, [[32, 32], [128, 128]], 31, [1, 0.5]), H = new Float32Array(N * N), TH = Float32Array.from({ length: 40 * 24 }, (_, i) => unit(hashN(i / 24 | 0, i % 24, 7))), TH2 = Float32Array.from({ length: 40 * 24 }, (_, i) => unit(hashN(i / 24 | 0, i % 24, 8)));
    T.tile = tex(pixels(N, N, (x, y) => { const row = Math.floor(y / CH), fy = y / CH - row, off = (row & 1) * TW / 2, col = Math.floor(((x + off) % N) / TW), fx = ((x + off) % N) / TW - col;
      const hi = row * 24 + col % 24, h = TH[hi], h2 = TH2[hi], gap = fx < 0.035 || fx > 0.965, lip = fy > 0.9;
      H[y * N + x] = gap ? 0 : (0.25 + 0.75 * fy) * (lip ? 1 - (fy - 0.9) * 6 : 1);
      let R = 96 + h * 30, G = 58 + h * 16, B = 45 + h * 10; if (h2 < 0.2) { R *= 0.72; G *= 0.72; B *= 0.74; } else if (h2 > 0.88) { R *= 1.1; G *= 1.1; B *= 1.08; }
      const moss = Math.max(0, n[y * N + x] - 0.6) * 2.4; R = R * (1 - moss) + 96 * moss; G = G * (1 - moss) + 98 * moss; B = B * (1 - moss) + 72 * moss;
      const sh = (gap ? 0.6 : 1) * (fy < 0.18 ? 0.7 + fy * 1.65 : 1) * (0.9 + n[y * N + x] * 0.18); return [R * sh, G * sh, B * sh]; }));
    T.tileN = tex(normals(H, N, N, 2.2), false); T.tile.repeat.set(0.5, 0.5); T.tileN.repeat.set(0.5, 0.5); }   // (roof uv are metres / 2)
  lap("tile");
  // brick (4 m square, 1 before 2026-10-07: the bond came round every metre; and its header courses' perpends lay over the stretchers' so joints ran up through three or four courses, now a quarter brick over): English bond, red-brown stocks with some burnt headers, lime mortar
  { const N = 1024, CH = N / 56, n = noiseTex(N, N, [[32, 32], [128, 128]], 41), BH = Float32Array.from({ length: 56 * 32 }, (_, i) => unit(hashN(i / 32 | 0, i % 32, 9)));
    T.brick = tex(pixels(N, N, (x, y) => { const row = Math.floor(y / CH), fy = y / CH - row, hdr = row & 1, bw = hdr ? N / 32 : N / 16, off = hdr ? bw / 2 : (row & 2 ? bw / 2 : 0), col = Math.floor(((x + off) % N) / bw), fx = ((x + off) % N) / bw - col;
      if (fy < 0.14 || fx < (hdr ? 0.07 : 0.035)) return [150, 141, 124].map(v => v * (0.85 + n[y * N + x] * 0.15));
      const h = BH[row * 32 + col], burnt = hdr && h < 0.25, v = 0.82 + n[y * N + x] * 0.22; return burnt ? [104 * v, 70 * v, 58 * v] : [(128 + h * 26) * v, (74 + h * 16) * v, (58 + h * 10) * v]; })); T.brick.repeat.set(0.25, 0.25); }   // (brick uv are metres)
  lap("brick");
  // the street's pebbles (3.2 m square, 1.6 before 2026-10-07; the street's uv are metres / 1.6, so repeat a half): rounded river pebbles 80-150 mm set in sand and dirt, and their heights
  { const N = 1024, G = 32, cs = N / G, r = stream("street/pebbles"), P = [];
    for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) { const a = r() * Math.PI, e = 0.72 + r() * 0.28, t = r();
      P.push({ x: (i + 0.2 + r() * 0.6) * cs, y: (j + 0.2 + r() * 0.6) * cs, rad: cs * (0.5 + r() * 0.2), ca: Math.cos(a), sa: Math.sin(a), e,
        col: t < 0.18 ? [92, 94, 98] : t < 0.45 ? [150, 140, 122] : t < 0.7 ? [128, 116, 98] : t < 0.85 ? [170, 160, 140] : [120, 98, 72] }); }
    const n = noiseTex(N, N, [[64, 64], [256, 256]], 51), H = new Float32Array(N * N);
    T.pebbles = tex(pixels(N, N, (x, y) => { const ci = Math.floor(x / cs), cj = Math.floor(y / cs); let best = null, bd = 9;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { let ii = ci + di, jj = cj + dj; ii = ii < 0 ? ii + G : ii >= G ? ii - G : ii; jj = jj < 0 ? jj + G : jj >= G ? jj - G : jj; const p = P[jj * G + ii];
        let dx = x - p.x, dy = y - p.y; dx = dx > N / 2 ? dx - N : dx < -N / 2 ? dx + N : dx; dy = dy > N / 2 ? dy - N : dy < -N / 2 ? dy + N : dy;
        const u = (dx * p.ca + dy * p.sa) / p.rad, v = (-dx * p.sa + dy * p.ca) / (p.rad * p.e), d = u * u + v * v; if (d < bd) { bd = d; best = p; } }
      const k = n[y * N + x];
      if (bd >= 1) { H[y * N + x] = 0.1 * k; return [92 + 30 * k, 80 + 26 * k, 62 + 20 * k]; }
      const dome = Math.sqrt(1 - bd); H[y * N + x] = 0.25 + 0.75 * dome; const v = (0.62 + 0.38 * dome) * (0.9 + 0.2 * k);
      return [best.col[0] * v, best.col[1] * v, best.col[2] * v]; }));
    T.pebblesN = tex(normals(H, N, N, 3.0), false); T.pebbles.repeat.set(0.5, 0.5); T.pebblesN.repeat.set(0.5, 0.5); }
  lap("pebbles");
  // the signs (an atlas of 16 boards): emblems painted or gilt on coloured grounds, in moulded frames, weathered
  T.signs = tex(signAtlas(cv(1024, 1024))); T.signs.anisotropy = 4;
  const S = (o) => new THREE.MeshStandardMaterial({ vertexColors: true, ...o });
  const mats = {
    plaster: S({ map: T.plaster, roughness: 0.95 }), oak: S({ map: T.oak, roughness: 0.86 }), glass: S({ map: T.glass, roughness: 0.32, metalness: 0 }),
    tile: S({ map: T.tile, normalMap: T.tileN, roughness: 0.86 }), brick: S({ map: T.brick, roughness: 0.92 }), iron: S({ color: 0x3a3733, roughness: 0.5, metalness: 0.5 }),
    sign: S({ map: T.signs, roughness: 0.62 }), paint: S({ roughness: 0.82 }), street: S({ map: T.pebbles, normalMap: T.pebblesN, roughness: 0.9 }),
    water: new THREE.MeshStandardMaterial({ color: 0x4a4236, roughness: 0.06, metalness: 0.1 }),
  };
  mats.tile.normalScale.set(0.8, 0.8); mats.street.normalScale.set(1.1, 1.1);
  for (const [k, m] of Object.entries(mats)) m.name = `street/${k}`;
  lap("signs"); const kit = { mats, T, parts, ms: Math.round(now() - T0) }; KITS.set(THREE, kit); return kit;
}

// ---- the signs: 16 boards in a 4 by 4 atlas (§B4: "carving and gilding"; the emblems are the common London signs:
// the Bell, the Swan, the Cross Keys, the Crown, the Star, the Sun, the Half Moon, the Three Tuns, the Anchor, the Rose,
// the Cock, the Ship, the Golden Ball, the Mitre, the Bible, the Wheatsheaf; colours chosen)
const SIGN_STYLE = { bell: ["#1c1a18", "gold"], swan: ["#1f3554", "#efe9dc"], keys: ["#6e211c", "gold"], crown: ["#21402c", "gold"], star: ["#1f3554", "gold"], sun: ["#1c1a18", "gold"],
  moon: ["#22385a", "#e8e4da"], tuns: ["#d8c8a0", "#6b4a2c"], anchor: ["#21402c", "gold"], rose: ["#d8c8a0", "#a3262a"], cock: ["#6e211c", "#efe9dc"], ship: ["#2a4566", "#efe9dc"],
  ball: ["#1c1a18", "gold"], mitre: ["#6e211c", "#efe9dc"], book: ["#21402c", "#efe9dc"], sheaf: ["#1c1a18", "gold"] };
export const signCell = (e) => [(e % 4) / 4, 1 - (Math.floor(e / 4) + 1) / 4];       // uv of a board's lower-left corner
function signAtlas(c) {
  const g = c.getContext("2d"), r = stream("street/signs"), C = 256;
  EMBLEMS.forEach((name, e) => { const [ground, ink] = SIGN_STYLE[name]; g.save(); g.translate((e % 4) * C, Math.floor(e / 4) * C);
    g.fillStyle = "#2a2018"; g.fillRect(0, 0, C, C);
    const gold = () => { const gr = g.createLinearGradient(0, -1, 0, 1); gr.addColorStop(0, "#f4d986"); gr.addColorStop(0.45, "#cfa040"); gr.addColorStop(1, "#86601e"); return gr; };
    g.fillStyle = ink === "gold" ? "#b48c2c" : "#c9b994"; g.fillRect(9, 9, C - 18, C - 18); g.fillStyle = "rgba(0,0,0,0.35)"; g.fillRect(9, C - 15, C - 18, 6); g.fillRect(C - 15, 9, 6, C - 18);
    g.fillStyle = ground; g.fillRect(17, 17, C - 34, C - 34);
    g.save(); g.translate(C / 2, C / 2 + 4); g.scale(C * 0.37, C * 0.37); g.lineJoin = g.lineCap = "round";
    emblem(g, name, ink === "gold" ? gold() : ink, ground); g.restore();
    for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(${r() < 0.5 ? "0,0,0" : "255,248,230"},${0.03 + r() * 0.06})`; g.fillRect(r() * C, r() * C, 2 + r() * 12, 1 + r() * 4); }
    g.restore(); });
  return c;
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

// ---- a house from its lot. K: the block's accumulators by material. Local frame: u along the front, d into the
// house (the street at negative d), z up from its ground floor
const TP = 0.035;                                  // how far a timber stands proud of its plaster
const OAK_REF = "#958b7d", TILE_REF = "#93553a", IRON = [1, 1, 1], STONE = lin("#8d877b"), SOOT = lin("#141210"), HORN = lin("#c9a466"), SHADE = lin("#5a4c3c");
const tint = (hex, ref) => { const a = lin(hex), b = lin(ref); return [a[0] / b[0], a[1] / b[1], a[2] / b[2]]; };
const CLOTH = ["#74443a", "#4a566a", "#76664a", "#56604a", "#c9c0aa", "#3a352e", "#8a6c48", "#5e4a50", "#a89c84"].map(lin);
const POTS = ["#9a5a34", "#6f7a4a", "#8a8478", "#b07a4a", "#5a4a3a"].map(lin);
const runs = (a, b, holes) => { const out = []; let at = a; for (const [h0, h1] of [...holes].sort((p, q) => p[0] - q[0])) { if (h0 > at) out.push([at, Math.min(h0, b)]); at = Math.max(at, h1); } if (at < b) out.push([at, b]); return out.filter(([p, q]) => q - p > 1e-3); };

function houseGround(K, lot) {
  const X = frameXf(lot), W = lot.width, D = lot.depth, S = lot.storeys, n = S.length, G = lot.gable, gf = lot.ground, H0 = S[0].h, top = S[n - 1];
  grainN = hashN(lot.k, lot.side === "L" ? 1 : 2, lot.kind === "back" ? 7 : 0) % 10007;
  const r = stream(lot.id), cPl = lin(lot.colours.plaster), cOak = tint(lot.colours.oak, OAK_REF), cTile = tint(lot.colours.tile, TILE_REF);
  const salt = (lot.k * 7.31 + (lot.side === "L" ? 0 : 3.7) + (lot.kind === "back" ? 1.9 : 0)) % 10, mott = (P) => 0.95 + 0.045 * Math.sin(P[0] * 2.1 + salt) * Math.sin(P[2] * 1.6 + salt * 1.3) + 0.03 * Math.sin(P[0] * 5.3 + P[2] * 3.7 + P[1] * 2.9 + salt * 2.1);
  const oak = (k = 1) => mul(cOak, k), pl = (k = 1) => (P) => mul(cPl, k * mott(P));
  const plG = (P) => mul(cPl, (P[2] < 1.2 ? 0.66 + 0.28 * Math.max(0, P[2]) : 0.99) * mott(P));       // splashed from the street below
  const below = Math.min(-0.3, lot.low - lot.floor - 0.3), zStreet = lot.low - lot.floor;   // the plinth's foot; the street's lowest point
  const ext = { stall: null };

  // the ground floor: a plinth of brick, the sill beam on it, corner posts, the girding beam carrying the floor above
  const open0 = [gf.door, gf.passage, gf.arch].filter(Boolean).map(([a, b]) => [a - 0.13, b + 0.13]);
  for (const [a, b] of runs(0, W, open0)) { box(K.brick, X, a, b, -0.07, 0.25, below, 0.32, [0.95, 0.95, 0.95], { skip: "d+" }); box(K.oak, X, a, b, -TP, 0.2, 0.32, 0.48, oak(), { skip: "d+" }); }
  box(K.oak, X, 0, 0.24, -TP, 0.2, 0.48, H0 - 0.3, oak(), { skip: "d+" }); box(K.oak, X, W - 0.24, W, -TP, 0.2, 0.48, H0 - 0.3, oak(), { skip: "d+" });
  box(K.oak, X, 0, W, -TP - 0.012, 0.2, H0 - 0.3, H0, oak(0.95), { skip: "d+" });
  const holes0 = [];
  const post = (u0, u1, z0 = 0.48, z1 = H0 - 0.3) => box(K.oak, X, u0, u1, -TP, 0.16, z0, z1, oak(), { skip: "d+" });
  // a window in a front at depth d: glass set in, a sill standing out, head, jambs, mullions, a transom if tall
  const windowAt = (u0, u1, z0, z1, d, f = -1) => {
    const g = 0.82 + 0.3 * r(), gd = d - f * 0.07, sk = f < 0 ? "d+" : "d-", o0 = f < 0 ? d - TP : d - 0.1, o1 = f < 0 ? d + 0.1 : d + TP, m0 = f < 0 ? d - 0.012 : d - 0.08, m1 = f < 0 ? d + 0.08 : d + 0.012;
    quad(K.glass, X, [u0, gd, z0], [u1, gd, z0], [u1, gd, z1], [u0, gd, z1], [[0, 0], [(u1 - u0) / 0.42, 0], [(u1 - u0) / 0.42, (z1 - z0) / 0.6], [0, (z1 - z0) / 0.6]], [g, g, g], [0, f, 0]);
    box(K.oak, X, u0 - 0.07, u1 + 0.07, f < 0 ? o0 - 0.04 : o0, f < 0 ? o1 : o1 + 0.04, z0 - 0.09, z0, oak(), { skip: sk }); box(K.oak, X, u0 - 0.07, u1 + 0.07, o0, o1, z1, z1 + 0.09, oak(), { skip: sk });
    box(K.oak, X, u0 - 0.07, u0, o0, o1, z0, z1, oak(), { skip: sk }); box(K.oak, X, u1, u1 + 0.07, o0, o1, z0, z1, oak(), { skip: sk });
    const nl = Math.max(1, Math.round((u1 - u0) / 0.44)); for (let j = 1; j < nl; j++) { const u = u0 + (u1 - u0) * j / nl; box(K.oak, X, u - 0.035, u + 0.035, m0, m1, z0, z1, oak(), { skip: sk }); }
    if (z1 - z0 > 1.05) { const zt = z0 + (z1 - z0) * 0.66; box(K.oak, X, u0, u1, m0 + f * 0.006, m1 + f * 0.006, zt - 0.03, zt + 0.03, oak(), { skip: sk }); } };
  // the goods a trade sets out on its stall board, and on the shelves within
  const goods = (trade, u0, u1, d0, d1, z, rows = 2) => { for (let row = 0; row < rows; row++) { let u = u0; const dd0 = d0 + (d1 - d0) * row / rows, dd1 = d0 + (d1 - d0) * (row + 1) / rows - 0.03;
      while (u < u1 - 0.12) { const k = r(); let w, h, dep = dd1 - dd0, col;
        if (trade === "draper" || trade === "mercer") { w = 0.26 + 0.12 * k; h = 0.09 + 0.05 * r(); col = CLOTH[Math.floor(r() * CLOTH.length)]; const stack = 1 + Math.floor(r() * 1.6); for (let s = 0; s < stack; s++) box(K.paint, X, u, Math.min(u + w, u1), dd0 + 0.02 * s, dd1 - 0.02 * s, z + h * s, z + h * (s + 1) - 0.006, mul(CLOTH[Math.floor(r() * CLOTH.length)], 0.9 + 0.2 * r())); u += w + 0.04; continue; }
        if (trade === "potter") { w = 0.12 + 0.1 * k; h = 0.14 + 0.18 * r(); col = POTS[Math.floor(r() * POTS.length)]; box(K.paint, X, u, u + w, dd0 + 0.04, dd0 + 0.04 + w, z, z + h, col); box(K.paint, X, u + w * 0.2, u + w * 0.8, dd0 + 0.04 + w * 0.2, dd0 + 0.04 + w * 0.8, z + h, z + h + 0.04, mul(col, 0.8)); u += w + 0.06; continue; }
        if (trade === "grocer") { w = 0.24 + 0.1 * k; h = 0.22 + 0.12 * r(); col = r() < 0.5 ? lin("#b9a27a") : lin("#8a6a42"); box(K.paint, X, u, u + w, dd0 + 0.03, dd0 + 0.03 + Math.min(dep, w), z, z + h, col); u += w + 0.05; continue; }
        if (trade === "baker") { w = 0.15 + 0.05 * k; h = 0.05 + 0.02 * r(); const c = lin(r() < 0.5 ? "#9c6a38" : "#87562c"); box(K.paint, X, u, u + w, dd0 + 0.05, dd0 + 0.05 + w * 0.62, z, z + h, c); box(K.paint, X, u + w * 0.15, u + w * 0.85, dd0 + 0.05 + w * 0.09, dd0 + 0.05 + w * 0.53, z + h, z + h + 0.035, mul(c, 1.08)); u += w + 0.06; continue; }
        if (trade === "chandler") { w = 0.05; h = 0.22 + 0.1 * r(); for (let c = 0; c < 4; c++) box(K.paint, X, u + c * 0.035, u + c * 0.035 + 0.026, dd0 + 0.05, dd0 + 0.076, z, z + h, lin("#e2d6b4")); u += 0.2; continue; }
        w = 0.14 + 0.1 * k; h = 0.05 + 0.05 * r(); box(K.paint, X, u, u + w, dd0 + 0.05, dd0 + 0.05 + 0.14, z, z + h, trade === "cutler" ? lin("#5c5a56") : CLOTH[Math.floor(r() * CLOTH.length)]); u += w + 0.06; } } };
  // a dark room behind an opening (a shop, seen in): floor, back, sides and ceiling facing in, darker as it goes back
  const room = (u0, u1, z1, di) => { const dk = (P) => mul(SHADE, 1.9 - 1.15 * Math.min(1, P[1] / di));
    quad(K.paint, X, [u0, 0, 0.01], [u1, 0, 0.01], [u1, di, 0.01], [u0, di, 0.01], [[0, 0], [1, 0], [1, 1], [0, 1]], (P) => mul(dk(P), 0.8), [0, 0, 1]);
    quad(K.plaster, X, [u0, di, 0], [u1, di, 0], [u1, di, z1], [u0, di, z1], [[0, 0], [1, 0], [1, 1], [0, 1]], dk, [0, -1, 0]);
    quad(K.plaster, X, [u0, 0.16, 0], [u0, di, 0], [u0, di, z1], [u0, 0.16, z1], [[0, 0], [1, 0], [1, 1], [0, 1]], dk, [1, 0, 0]);
    quad(K.plaster, X, [u1, 0.16, 0], [u1, di, 0], [u1, di, z1], [u1, 0.16, z1], [[0, 0], [1, 0], [1, 1], [0, 1]], dk, [-1, 0, 0]);
    quad(K.oak, X, [u0, 0.2, z1], [u1, 0.2, z1], [u1, di, z1], [u0, di, z1], [[0, 0], [1, 0], [1, 1], [0, 1]], dk, [0, 0, -1]); };

  if (gf.door) { const [a, b] = gf.door; holes0.push([a - 0.13, b + 0.13, -1, 2.24]); post(a - 0.13, a, 0, 2.24); post(b, b + 0.13, 0, 2.24); box(K.oak, X, a, b, -TP, 0.16, 2.06, 2.24, oak(), { skip: "d+" });
    box(K.oak, X, a, b, 0.09, 0.15, 0, 2.06, oak(0.8), { skip: "d+" }); for (let u = a + 0.19; u < b - 0.08; u += 0.19) box(K.oak, X, u - 0.016, u + 0.016, 0.078, 0.09, 0.03, 2.03, oak(0.66), { skip: "d+" });
    const hingeA = (a + b) / 2 < W / 2; for (const z of [0.38, 1.62]) box(K.iron, X, hingeA ? a + 0.02 : b - 0.62, hingeA ? a + 0.62 : b - 0.02, 0.066, 0.078, z, z + 0.045, IRON, { skip: "d+" });
    box(K.iron, X, hingeA ? b - 0.16 : a + 0.12, hingeA ? b - 0.12 : a + 0.16, 0.05, 0.078, 1.02, 1.1, IRON);
    box(K.paint, X, a - 0.12, b + 0.12, -0.34, 0.09, below + 0.15, 0.02, STONE); }
  if (gf.shop) { const [a, b] = gf.shop, zs = 0.82, zh = 2.32; holes0.push([a, b, zs, zh]); ext.stall = [a, b];
    post(a - 0.14, a); post(b, b + 0.14); box(K.oak, X, a, b, -TP, 0.16, zh, zh + 0.14, oak(), { skip: "d+" }); box(K.oak, X, a, b, -TP - 0.012, 0.16, zs - 0.12, zs, oak(), { skip: "d+" });
    box(K.oak, X, a, b, -0.008, 0.03, 0.48, zs - 0.12, oak(0.74), { skip: "d+" });
    room(a, b, H0 - 0.3, 2.6); for (const z of [1.08, 1.52, 1.96]) { box(K.oak, X, a + 0.05, b - 0.05, 2.25, 2.58, z - 0.03, z, oak(0.55)); goods(gf.trade, a + 0.1, b - 0.12, 2.27, 2.56, z, 1); }
    // the shutters, open by day (§B4): the lower let down as a stall board on two legs, the upper propped up as a pent roof
    box(K.oak, X, a + 0.02, b - 0.02, -0.8, -0.055, zs - 0.05, zs, oak(0.98)); for (const u of [a + 0.1, b - 0.16]) box(K.oak, X, u, u + 0.06, -0.74, -0.68, zStreet - 0.1, zs - 0.05, oak(0.9));
    goods(gf.trade, a + 0.08, b - 0.08, -0.74, -0.08, zs, 2);
    beam(K.oak, X, [(a + b) / 2, -0.03, zh + 0.12], [(a + b) / 2, -0.82, zh - 0.18], b - a + 0.08, 0.04, [0, 0, 1], oak(0.97));
    for (const u of [a + 0.12, b - 0.12]) beam(K.iron, X, [u, -TP, zh + 0.78], [u, -0.78, zh - 0.12], 0.022, 0.022, [1, 0, 0], IRON); }
  for (const [a, b] of gf.windows || []) { const z0 = lot.kind === "inn" ? 0.92 : 0.98, z1 = lot.kind === "inn" ? 2.6 : 2.3; holes0.push([a - 0.07, b + 0.07, z0 - 0.09, z1 + 0.09]); windowAt(a, b, z0, z1, 0); }
  // an entry under the house, or an inn's carriage arch: posts, a head (an arch for the inn), a passage through to the yard
  const way = gf.passage || gf.arch;
  if (way) { const [a, b] = way, zc = gf.arch ? H0 - 0.3 : 2.5; holes0.push([a, b, -1, gf.arch ? H0 - 0.42 : zc]); post(a - 0.14, a, 0); post(b, b + 0.14, 0);
    if (gf.arch) { const m = (a + b) / 2, hw = (b - a) / 2, zk = H0 - 0.42, zs = zk - 0.85, pts = [];
      for (let i = 0; i <= 12; i++) { const f = -1 + i / 6, ze = zs + (zk - zs) * Math.sqrt(Math.max(0, 1 - f * f)); pts.push([m + f * hw, ze]); }
      const nrmAt = (i) => { const p0 = pts[Math.max(0, i - 1)], p1 = pts[Math.min(12, i + 1)], tx = p1[0] - p0[0], tz = p1[1] - p0[1], l = Math.hypot(tx, tz); return [tz / l, -tx / l]; };   // outward from the opening
      const inner = pts.map(([u, z]) => [u, z]), outer = pts.map(([u, z], i) => { const [nu, nz] = nrmAt(i); return [u - nu * 0.17, z - nz * 0.17]; });
      for (let i = 0; i < 12; i++) { const [a0, a1, b0, b1] = [inner[i], inner[i + 1], outer[i], outer[i + 1]], L = Math.hypot(a1[0] - a0[0], a1[1] - a0[1]);
        quad(K.oak, X, [a0[0], -0.04, a0[1]], [a1[0], -0.04, a1[1]], [b1[0], -0.04, b1[1]], [b0[0], -0.04, b0[1]], [[i * L, 0], [(i + 1) * L, 0], [(i + 1) * L, 0.17], [i * L, 0.17]], oak(), [0, -1, 0]);
        quad(K.oak, X, [a0[0], -0.04, a0[1]], [a1[0], -0.04, a1[1]], [a1[0], 0.16, a1[1]], [a0[0], 0.16, a0[1]], [[i * L, 0], [(i + 1) * L, 0], [(i + 1) * L, 0.2], [i * L, 0.2]], oak(0.9), [nrmAt(i)[0], 0, nrmAt(i)[1]]);
        quad(K.oak, X, [b0[0], -0.04, b0[1]], [b1[0], -0.04, b1[1]], [b1[0], 0, b1[1]], [b0[0], 0, b0[1]], [[i * L, 0], [(i + 1) * L, 0], [(i + 1) * L, 0.04], [i * L, 0.04]], oak(0.9), [-nrmAt(i)[0], 0, -nrmAt(i)[1]]); }
      for (const half of [pts.slice(0, 7), pts.slice(6)]) { const left = half[0][0] < m;
        const poly = left ? [[a, zk], ...half] : [[b, zk], ...[...half].reverse()]; for (let i = 1; i + 1 < poly.length; i++) tri(K.plaster, X, [poly[0][0], 0, poly[0][1]], [poly[i][0], 0, poly[i][1]], [poly[i + 1][0], 0, poly[i + 1][1]], [[0, 0], [0.5, 0], [0.5, 0.5]], plG, [0, -1, 0]); }
      box(K.oak, X, a, b, -TP, 0.16, zk, zk + 0.06, oak(), { skip: "d+" }); }
    else box(K.oak, X, a, b, -TP, 0.16, zc, zc + 0.16, oak(), { skip: "d+" });
    const sh = (P) => mul(cPl, 0.3 + 0.5 * Math.abs(P[1] / D - 0.5));
    const c0 = gf.arch ? 0.2 : 0.16; sideHoles(K.plaster, X, a, 0.16, D, 0, zc, [], sh, 1); sideHoles(K.plaster, X, b, 0.16, D, 0, zc, [], sh, -1);
    quad(K.oak, X, [a, c0, zc], [b, c0, zc], [b, D, zc], [a, D, zc], [[0, 0], [1, 0], [1, 1], [0, 1]], (P) => mul(oak(), 0.3 + 0.4 * Math.abs(P[1] / D - 0.5)), [0, 0, -1]);
    for (let d = 0.35; d < D - 0.1; d += 0.55) box(K.oak, X, a, b, d - 0.06, d + 0.06, zc - 0.17, zc, mul(oak(), 0.45), { skip: "z+" }); }
  wallHoles(K.plaster, X, 0, W, 0.48, H0 - 0.3, 0, holes0, plG);
  return { X, W, D, S, n, G, gf, H0, top, r, cPl, cOak, cTile, oak, pl, mott, below, windowAt, post, ext };
}
function buildHouse(K, lot) {
  const c = houseGround(K, lot), { X, W, D, S, n, G, H0, top, r, cPl, cTile, oak, pl, mott, below, windowAt } = c, tanp = Math.tan(G.pitch), zt0 = G.z + 0.17;
  // a jetty: the joists' ends showing under the projecting floor, a dark soffit between, a curved bracket at the posts
  const jetty = (z, dLo, dHi, us) => { const zj = z - 0.2;
    quad(K.plaster, X, [0, dHi - TP, z - 0.025], [W, dHi - TP, z - 0.025], [W, dLo + 0.1, z - 0.025], [0, dLo + 0.1, z - 0.025], [[0, 0], [W / 2, 0], [W / 2, (dLo - dHi) / 2], [0, (dLo - dHi) / 2]], pl(0.5), [0, 0, -1]);
    const nj = Math.max(3, Math.round(W / 0.4)); for (let j = 0; j <= nj; j++) { const u = 0.1 + (W - 0.2) * j / nj; box(K.oak, X, u - 0.06, u + 0.06, dHi - TP, dLo - TP, zj, z, oak(0.86), { skip: "z+" }); }
    for (const u of us) { const ds = dLo - TP, de = dHi + 0.05, zs = zj - 0.8, pts = [[ds, zj]];
      for (let i = 6; i >= 0; i--) { const t = i / 6 * Math.PI / 2; pts.push([ds + (de - ds) * (1 - Math.cos(t)), zs + (zj - zs) * Math.sin(t)]); }
      prism(K.oak, X, pts, u - 0.06, u + 0.06, oak(0.9)); } };
  // a window in a side wall (on a lane, or at the street's end): glass set in, a frame round it
  const sideWindow = (u, sg, d0, d1, z0, z1) => { const ui = u - sg * 0.07, uo = u + sg * TP, lo = Math.min(uo, u - sg * 0.1), hi = Math.max(uo, u - sg * 0.1);
    quad(K.glass, X, [ui, d0, z0], [ui, d1, z0], [ui, d1, z1], [ui, d0, z1], [[0, 0], [(d1 - d0) / 0.42, 0], [(d1 - d0) / 0.42, (z1 - z0) / 0.6], [0, (z1 - z0) / 0.6]], [0.9, 0.9, 0.9], [sg, 0, 0]);
    box(K.oak, X, lo - (sg < 0 ? 0.04 : 0), hi + (sg > 0 ? 0.04 : 0), d0 - 0.07, d1 + 0.07, z0 - 0.09, z0, oak()); box(K.oak, X, lo, hi, d0 - 0.07, d1 + 0.07, z1, z1 + 0.09, oak());
    box(K.oak, X, lo, hi, d0 - 0.07, d0, z0, z1, oak()); box(K.oak, X, lo, hi, d1, d1 + 0.07, z0, z1, oak()); box(K.oak, X, lo, hi, (d0 + d1) / 2 - 0.035, (d0 + d1) / 2 + 0.035, z0, z1, oak()); };
  // the storeys above the street: jettied out, framed, windowed
  for (let i = 1; i < n; i++) { const s = S[i], lo = S[i - 1], d = s.d, z = s.z, zt = z + s.h;
    if (lo.d - d > 0.01) jetty(z, lo.d, d, W > 5.2 ? [0.12, W / 2, W - 0.12] : [0.12, W - 0.12]);
    box(K.oak, X, 0, W, d - TP, d + 0.14, z, z + 0.17, oak(), { skip: "d+" }); box(K.oak, X, 0.003, W - 0.003, d - TP - 0.024, d - TP + 0.01, z + 0.004, z + 0.05, oak(0.88), { skip: "d+" });
    box(K.oak, X, 0, W, d - TP, d + 0.14, zt - 0.17, zt, oak(), { skip: "d+" });
    box(K.oak, X, 0, 0.2, d - TP, d + 0.14, z + 0.17, zt - 0.17, oak(), { skip: "d+" }); box(K.oak, X, W - 0.2, W, d - TP, d + 0.14, z + 0.17, zt - 0.17, oak(), { skip: "d+" });
    const zw0 = z + 0.88, zw1 = zt - 0.36, inn = lot.kind === "inn", nb = inn ? 6 : W > 5.4 ? 3 : 2, bays = Array.from({ length: nb - 1 }, (_, j) => W * (j + 1) / nb);
    const style = inn ? "band" : lot.windows[i], oriel = i === 1 && lot.oriel; let wins = [];
    if (oriel) wins = [];
    else if (style === "band") { const cuts = [0.27, ...bays, W - 0.27]; for (let k = 0; k + 1 < cuts.length; k++) wins.push([cuts[k] + (k ? 0.16 : 0.07), cuts[k + 1] - (k + 2 < cuts.length ? 0.16 : 0.07)]); }
    else if (style === "pair") { const ww = Math.min(1.7, W / 2 - 0.75); wins = [[W / 4 - ww / 2, W / 4 + ww / 2], [3 * W / 4 - ww / 2, 3 * W / 4 + ww / 2]]; }
    else { const ww = Math.min(2.3, W * 0.46); wins = [[W / 2 - ww / 2, W / 2 + ww / 2]]; }
    const covered = (u, m = 0.1) => wins.some(([a, b]) => u > a - m && u < b + m) || (oriel && u > oriel[0] - m && u < oriel[1] + m);
    const posts = bays.filter(b => !covered(b, 0.02) || style === "band");
    for (const b of posts) box(K.oak, X, b - 0.09, b + 0.09, d - TP, d + 0.14, z + 0.17, zt - 0.17, oak(), { skip: "d+" });
    // the infill's timbers: close studding, or square panels braced at the ends, or panels set with lozenges
    const edges = [0.2, ...posts.flatMap(b => [b - 0.09, b + 0.09]), W - 0.2], panels = []; for (let k = 0; k + 1 < edges.length; k += 2) panels.push([edges[k], edges[k + 1]]);
    for (const [p0, p1] of panels) box(K.oak, X, p0, p1, d - TP, d + 0.14, zw0 - 0.21, zw0 - 0.09, oak(), { skip: "d+" });
    const stud = (u, z0, z1) => { if (z1 - z0 > 0.08) box(K.oak, X, u - 0.065, u + 0.065, d - TP, d + 0.13, z0, z1, oak(0.97), { skip: "d+" }); };
    if (lot.framing === "close") { for (const [p0, p1] of panels) { const m = Math.max(1, Math.round((p1 - p0) / 0.42)); for (let j = 1; j < m; j++) { const u = p0 + (p1 - p0) * j / m;
        stud(u, z + 0.17, zw0 - 0.21); if (!covered(u, 0.15)) stud(u, zw0 - 0.09, zt - 0.17); else stud(u, zw1 + 0.09, zt - 0.17); } } }
    else panels.forEach(([p0, p1], k) => { const w = p1 - p0, mid = (p0 + p1) / 2, zl0 = z + 0.17, zl1 = zw0 - 0.21;
      if (w > 1.1) stud(mid, zl0, zl1);
      if (lot.framing === "lozenge") for (const [q0, q1] of w > 1.1 ? [[p0, mid - 0.065], [mid + 0.065, p1]] : [[p0, p1]]) { const cu = (q0 + q1) / 2, cz = (zl0 + zl1) / 2, hu = (q1 - q0) / 2 - 0.02, hz = (zl1 - zl0) / 2 - 0.02, dd = d + 0.046;
        const L = [[cu - hu, cz], [cu, cz + hz], [cu + hu, cz], [cu, cz - hz]]; for (let j = 0; j < 4; j++) beam(K.oak, X, [L[j][0], dd, L[j][1]], [L[(j + 1) % 4][0], dd, L[(j + 1) % 4][1]], 0.1, 0.15, [0, 1, 0], oak(0.97)); }
      else if (k === 0 || k === panels.length - 1) { const from = k === 0 ? p0 + 0.1 : p1 - 0.1, to = k === 0 ? Math.min(p1 - 0.1, p0 + 0.95) : Math.max(p0 + 0.1, p1 - 0.95);
        beam(K.oak, X, [from, d + 0.048, zl0 + 0.1], [to, d + 0.048, zl1 - 0.1], 0.12, 0.155, [0, 1, 0], oak(0.97)); }
      if (!covered(mid, 0.15) && w > 0.5) stud(mid, zw0 - 0.09, zt - 0.17); });
    const holes = wins.map(([a, b]) => [a - 0.07, b + 0.07, zw0 - 0.09, zw1 + 0.09]);
    if (oriel) holes.push([oriel[0], oriel[1], zw0 - 0.32, zw1 + 0.14]);
    wallHoles(K.plaster, X, 0, W, z + 0.17, zt - 0.17, d, holes, pl(i === 1 ? 0.96 : 1));
    for (const [a, b] of wins) windowAt(a, b, zw0, zw1, d);
    // an oriel: a glazed bay on the first floor, on brackets, under a little tiled roof
    if (oriel) { const [o0, o1] = oriel, od = d - 0.42;
      windowAt(o0 + 0.16, o1 - 0.16, zw0, zw1, od); box(K.oak, X, o0, o0 + 0.09, od - TP, d, zw0 - 0.09, zw1 + 0.09, oak()); box(K.oak, X, o1 - 0.09, o1, od - TP, d, zw0 - 0.09, zw1 + 0.09, oak());
      for (const [u, sg] of [[o0 + 0.045, -1], [o1 - 0.045, 1]]) quad(K.glass, X, [u, od + 0.01, zw0], [u, d, zw0], [u, d, zw1], [u, od + 0.01, zw1], [[0, 0], [1, 0], [1, 1.6], [0, 1.6]], [0.85, 0.85, 0.85], [sg, 0, 0]);
      box(K.oak, X, o0, o1, od - TP, d, zw0 - 0.32, zw0 - 0.09, oak(0.95)); box(K.oak, X, o0, o1, od - TP, d, zw1 + 0.09, zw1 + 0.15, oak());
      for (const u of [o0 + 0.18, o1 - 0.18]) { const pts = [[d, zw0 - 0.32]]; for (let k = 5; k >= 0; k--) { const t = k / 5 * Math.PI / 2; pts.push([d + (od + 0.06 - d) * (1 - Math.cos(t)), zw0 - 0.95 + 0.63 * Math.sin(t)]); } prism(K.oak, X, pts, u - 0.05, u + 0.05, oak(0.9)); }
      beam(K.tile, X, [(o0 + o1) / 2, d, zw1 + 0.5], [(o0 + o1) / 2, od - 0.14, zw1 + 0.14], o1 - o0 + 0.12, 0.05, [0, 0, 1], mul(cTile, 0.95)); } }
  // the party walls (the sides), framed and windowed where they stand open to a lane or the street's end
  for (const [edge, u, sg] of [["a", 0, -1], ["b", W, 1]]) { const open = lot.open?.[edge];
    for (let i = 0; i < n; i++) { const s = S[i], lo = i ? S[i - 1] : null, jet = lo && lo.d - s.d > 0.01, zB = i === n - 1 ? zt0 + 0.06 : s.z + s.h, b0 = D - 0.14;
      const wh = open && i > 0 ? [[s.d + 1.1, s.d + 2.2, s.z + 0.9, s.z + s.h - 0.42], ...(D - s.d > 6.5 ? [[s.d + 4.3, s.d + 5.4, s.z + 0.9, s.z + s.h - 0.42]] : [])] : [];
      const sc = (P) => mul(cPl, (P[2] < 1.2 ? 0.66 + 0.28 * Math.max(0, P[2]) : 0.95) * (open ? 1 : 0.92) * mott(P));
      if (i === 0) { sideHoles(K.plaster, X, u, 0.25, b0, below, 0.32, [], sc, sg); sideHoles(K.plaster, X, u, 0.2, b0, 0.32, zB, wh, sc, sg); }
      else { sideHoles(K.plaster, X, u, s.d + 0.14, b0, s.z, zB, wh, sc, sg); if (jet) sideHoles(K.plaster, X, u, s.d - TP, lo.d - TP, s.z - 0.2, s.z, [], sc, sg); }
      for (const w of wh) sideWindow(u, sg, ...w);
      { const lo = sg < 0 ? -TP : W - 0.14, hi = sg < 0 ? 0.14 : W + TP, ok = open || i > 0; if (ok) { box(K.oak, X, lo, hi, s.d + 0.14, b0, s.z, s.z + 0.17, oak()); box(K.oak, X, lo, hi, b0 - 0.2, b0, Math.max(below, s.z) + (i ? 0.17 : 0), s.z + s.h, oak());
        if (i > 0) { const dm = s.d + (D - s.d) * 0.48; box(K.oak, X, lo, hi, dm - 0.09, dm + 0.09, s.z + 0.17, s.z + s.h, oak()); if (!open) beam(K.oak, X, [sg < 0 ? -0.01 : W + 0.01, dm - 0.1, s.z + 0.2], [sg < 0 ? -0.01 : W + 0.01, dm - 1.1, s.z + s.h - 0.25], 0.12, 0.08, [1, 0, 0], oak(0.95)); } } } }
    if (G.jetty > 0.01) { sideHoles(K.plaster, X, u, G.d - TP, top.d - TP, G.z - 0.2, G.z, [], pl(0.95), sg); sideHoles(K.plaster, X, u, G.d + 0.14, top.d + 0.14, G.z, zt0 + 0.06, [], pl(0.95), sg); } }
  // the back, seen from the yards and from above: framed and plastered as the front, a leaded window or two a storey, a
  // door to the yard (or the passage running through), and often an outshut (a lean-to) under its own tiles
  const way = c.gf.passage || c.gf.arch, backH = [], doorB = [];
  if (way) backH.push([way[0] - 0.13, way[1] + 0.13, below - 1, c.gf.arch ? H0 - 0.3 : 2.66]);
  S.forEach((s, i) => { const z0 = s.z + 0.92, z1 = s.z + Math.min(2.08, s.h - 0.42), w = 0.9 + 0.35 * r(); let ws = W > 4.8 && r() < 0.55 ? [[W * 0.27 - w / 2, W * 0.27 + w / 2], [W * 0.73 - w / 2, W * 0.73 + w / 2]] : [[W / 2 - w / 2, W / 2 + w / 2]];
    if (i === 0) { if (way) ws = []; else { const dA = r() < 0.5, dr = dA ? [0.45, 1.35] : [W - 1.35, W - 0.45]; doorB.push(dr); backH.push([dr[0] - 0.12, dr[1] + 0.12, below - 1, 2.12]); ws = [dA ? [W * 0.62 - 0.45, W * 0.62 + 0.45] : [W * 0.38 - 0.45, W * 0.38 + 0.45]]; } }
    if (lot.outshut && i === 0) ws = ws.filter(([a, b]) => b < lot.outshut.u0 || a > lot.outshut.u1);
    for (const [a, b] of ws) { backH.push([a - 0.07, b + 0.07, z0 - 0.09, z1 + 0.09]); windowAt(a, b, z0, z1, D, 1); }
    // the frame: a plate under each floor, a sill over it, studs under the windows' sills
    if (i > 0) box(K.oak, X, 0, W, D - 0.14, D + TP, s.z, s.z + 0.17, oak(), { skip: "d-" });
    box(K.oak, X, 0, W, D - 0.14, D + TP, s.z + s.h - 0.17, s.z + s.h, oak(), { skip: "d-" });
    for (let u = 0.55; u < W - 0.4; u += 0.55) if (!backH.some(h => u > h[0] - 0.08 && u < h[1] + 0.08 && h[2] < s.z + 0.8)) box(K.oak, X, u - 0.06, u + 0.06, D - 0.12, D + TP, Math.max(below + 0.3, s.z + (i ? 0.17 : 0.3)), z0 - 0.09, oak(0.95), { skip: "d-" }); });
  wallHoles(K.plaster, X, 0, W, below, zt0, D, backH, pl(0.86), 1);
  S.forEach((s, i) => { for (const u of [0, W - 0.2]) box(K.oak, X, u, u + 0.2, D - 0.14, D + TP, i ? s.z + 0.17 : below, s.z + s.h - 0.17, oak(), { skip: "d-" }); });
  for (const [a, b] of doorB) { box(K.oak, X, a - 0.12, a, D - 0.14, D + TP, below, 2.12, oak(), { skip: "d-" }); box(K.oak, X, b, b + 0.12, D - 0.14, D + TP, below, 2.12, oak(), { skip: "d-" });
    box(K.oak, X, a, b, D - 0.14, D + TP, 2.0, 2.12, oak(), { skip: "d-" }); box(K.oak, X, a, b, D - 0.16, D - 0.1, -0.2, 2.0, oak(0.75), { skip: "d-" }); }
  if (lot.outshut) { const o = lot.outshut, u0 = o.u0, u1 = o.u1, d1 = D + o.depth, he = o.h, hr = Math.min(he + o.rise, zt0 - 0.25), sl = (hr - he) / o.depth;
    sideHoles(K.plaster, X, u0, D + TP, d1 - 0.14, below, he, [], pl(0.84), -1); sideHoles(K.plaster, X, u1, D + TP, d1 - 0.14, below, he, [], pl(0.84), 1);
    for (const [u, sg] of [[u0, -1], [u1, 1]]) tri(K.plaster, X, [u, D + TP, he], [u, d1, he], [u, D + TP, hr - TP * sl], [[0, 0], [1, 0], [0, 0.5]], pl(0.82), [sg, 0, 0]);
    const ow = Math.min(1.1, (u1 - u0) * 0.4), om = (u0 + u1) / 2, oh = [[om - ow / 2 - 0.07, om + ow / 2 + 0.07, 0.83, 2.0]];
    wallHoles(K.plaster, X, u0, u1, below, he, d1, oh, pl(0.84), 1); windowAt(om - ow / 2, om + ow / 2, 0.92, 1.91, d1, 1);
    for (const u of [u0, u1 - 0.18]) { if (he > 4) { box(K.oak, X, u, u + 0.18, d1 - 0.14, d1 + TP, below, 2.7, oak(), { skip: "d-" }); box(K.oak, X, u, u + 0.18, d1 - 0.14, d1 + TP, 2.87, he - 0.17, oak(), { skip: "d-" }); }
      else box(K.oak, X, u, u + 0.18, d1 - 0.14, d1 + TP, below, he - 0.17, oak(), { skip: "d-" }); }
    box(K.oak, X, u0, u1, d1 - 0.14, d1 + TP, he - 0.17, he, oak(), { skip: "d-" }); if (he > 4) box(K.oak, X, u0, u1, d1 - 0.14, d1 + TP, 2.7, 2.87, oak(), { skip: "d-" });
    const len = Math.hypot(o.depth + 0.3, hr - he + 0.3 * sl), tc = mul(cTile, 0.9);
    quad(K.tile, X, [u0 - 0.06, D, hr + 0.05], [u1 + 0.06, D, hr + 0.05], [u1 + 0.06, d1 + 0.3, he - 0.3 * sl + 0.05], [u0 - 0.06, d1 + 0.3, he - 0.3 * sl + 0.05], [[u0 / 2, len / 2], [u1 / 2, len / 2], [u1 / 2, 0], [u0 / 2, 0]], tc, [0, sl, 1]); }
  // the gable to the street: its tie beam, plaster with the garret's window, principal rafters, collar and studs on its
  // face, bargeboards at the verge and a finial; then the roof of clay tiles back to the rear gable, and its ridge
  if (G.jetty > 0.01) jetty(G.z, top.d, G.d, [0.12, W - 0.12]);
  const dg = G.d, dv = dg - 0.3;
  for (const [a, b] of G.spans) { const m = (a + b) / 2, apex = zt0 + (m - a) * tanp, rake = (u) => zt0 + Math.min(u - a, b - u) * tanp;
    box(K.oak, X, a, b, dg - TP, dg + 0.14, G.z, zt0, oak(), { skip: "d+" });
    let ww = Math.min(1.3, (b - a) * 0.34), wz0 = zt0 + 0.42, wz1 = wz0 + 0.8; while (ww > 0.5 && wz1 + 0.14 > rake(m - ww / 2 - 0.08)) ww -= 0.08; wz1 = Math.min(wz1, rake(m - ww / 2 - 0.08) - 0.14);
    const hole = [m - ww / 2 - 0.07, m + ww / 2 + 0.07, wz0 - 0.09, wz1 + 0.09], k = (m - a) / (apex - zt0), L = (z) => a + (z - zt0) * k, R = (z) => b - (z - zt0) * k;
    const zs = [zt0, hole[2], hole[3], apex];
    for (let i = 0; i + 1 < zs.length; i++) { const z0 = zs[i], z1 = zs[i + 1]; if (z1 - z0 < 1e-3) continue; const cut = i === 1;
      for (const [f0, f1] of cut ? [[L, () => hole[0]], [() => hole[1], R]] : [[L, R]]) { const a0 = f0(z0), a1 = f0(z1), b0 = f1(z0), b1 = f1(z1);
        quad(K.plaster, X, [a0, dg, z0], [b0, dg, z0], [b1, dg, z1], [a1, dg, z1], [[a0 / 2, z0 / 2], [b0 / 2, z0 / 2], [b1 / 2, z1 / 2], [a1 / 2, z1 / 2]], pl(0.98), [0, -1, 0]); } }
    windowAt(m - ww / 2, m + ww / 2, wz0, wz1, dg);
    for (const [e0, sg] of [[a + 0.05, 1], [b - 0.05, -1]]) beam(K.oak, X, [e0 + sg * 0.1 / tanp, dg + 0.0425, zt0 + 0.1], [m, dg + 0.0425, apex - 0.03], 0.19, 0.155, [0, 1, 0], oak());
    const zc = Math.max(wz1 + 0.16, zt0 + (apex - zt0) * 0.64), cu = (zc + 0.14 - zt0) / tanp + 0.16; if (b - a - 2 * cu > 0.3) box(K.oak, X, a + cu, b - cu, dg - TP, dg + 0.12, zc, zc + 0.14, oak(), { skip: "d+" });
    for (let u = a + 0.45; u < b - 0.3; u += 0.45) { if (Math.abs(u - m) < 0.1) continue; const zTop = Math.min(rake(u) - 0.12, zc);
      if (u > hole[0] - 0.08 && u < hole[1] + 0.08) box(K.oak, X, u - 0.06, u + 0.06, dg - TP, dg + 0.12, zt0, hole[2], oak(0.97), { skip: "d+" });
      else if (zTop - zt0 > 0.15) box(K.oak, X, u - 0.06, u + 0.06, dg - TP, dg + 0.12, zt0, zTop, oak(0.97), { skip: "d+" }); }
    for (const e0 of [a + 0.02, b - 0.02]) beam(K.oak, X, [e0, dv, zt0 - 0.06], [m, dv, apex + 0.12], 0.26, 0.05, [0, 1, 0], oak(0.9));
    box(K.oak, X, m - 0.065, m + 0.065, dv - 0.065, dv + 0.065, apex - 0.6, apex + 0.72, oak(0.9)); box(K.oak, X, m - 0.1, m + 0.1, dv - 0.1, dv + 0.1, apex + 0.5, apex + 0.64, oak(0.9));
    const dF = dv - 0.04, dB = D + 0.28, e = 0.05, len = Math.hypot(m - a, apex - zt0);
    for (const [u0, sgn] of [[a, -1], [b, 1]]) { const tc = (P) => mul(cTile, 0.86 + 0.14 * Math.min(1, (P[2] - zt0) / 2.5));
      quad(K.tile, X, [u0, dF, zt0 + e], [u0, dB, zt0 + e], [m, dB, apex + e], [m, dF, apex + e], [[dF / 2, 0], [dB / 2, 0], [dB / 2, len / 2], [dF / 2, len / 2]], tc, [sgn * tanp, 0, 1]);
      quad(K.oak, X, [u0, dF, zt0 + e - 0.05], [m, dF, apex + e - 0.05], [m, dg, apex + e - 0.05], [u0, dg, zt0 + e - 0.05], [[0, 0], [1, 0], [1, 0.3], [0, 0.3]], oak(0.4), [-sgn * tanp, 0, -1]);
      quad(K.tile, X, [u0, dF, zt0 + e - 0.05], [u0, dF, zt0 + e], [m, dF, apex + e], [m, dF, apex + e - 0.05], [[0, 0], [0, 0.02], [len / 2, 0.02], [len / 2, 0]], mul(cTile, 0.6), [0, -1, 0]); }
    beam(K.tile, X, [m, dF + 0.03, apex + e + 0.035], [m, dB - 0.03, apex + e + 0.035], 0.26, 0.13, [0, 0, 1], mul(cTile, 0.8));
    tri(K.plaster, X, [a, D, zt0], [b, D, zt0], [m, D, apex], [[0, 0], [1, 0], [0.5, 1]], pl(0.86), [0, 1, 0]);
    box(K.oak, X, a, b, D - 0.14, D + TP, G.z, zt0, oak(), { skip: "d-" }); }
  // the stacks on the party walls: brick, an oversailing course near the top, the flues' sooty mouths
  for (const st of lot.stacks || []) { const u = st.edge === "a" ? 0 : W, z0 = st.z0 - lot.floor, z1 = st.z1 - lot.floor, hw = 0.38;
    box(K.brick, X, u - hw, u + hw, st.d0, st.d1, z0, z1 - 0.34, [1, 1, 1]); box(K.brick, X, u - hw - 0.06, u + hw + 0.06, st.d0 - 0.06, st.d1 + 0.06, z1 - 0.34, z1 - 0.22, [0.9, 0.9, 0.9]);
    box(K.brick, X, u - hw - 0.02, u + hw + 0.02, st.d0 - 0.02, st.d1 + 0.02, z1 - 0.22, z1, mul([1, 1, 1], 0.8));
    const fw = (st.d1 - st.d0 - 0.1) / st.flues; for (let f = 0; f < st.flues; f++) { const d0 = st.d0 + 0.05 + f * fw + 0.05, d1 = d0 + fw - 0.1;
      quad(K.paint, X, [u - 0.18, d0, z1 + 0.004], [u + 0.18, d0, z1 + 0.004], [u + 0.18, d1, z1 + 0.004], [u - 0.18, d1, z1 + 0.004], [[0, 0], [1, 0], [1, 1], [0, 1]], SOOT, [0, 0, 1]); } }
  // a sign on an iron bracket at the first floor's corner post (§B4): a bar out over the street, a stay above it and a
  // scroll between, the board hung on two rings, painted both sides
  if (lot.sign && n > 1) { const sg = lot.sign, s1 = S[1], u = sg.edge === "a" ? 0.11 : W - 0.11, df = s1.d - TP, zb = s1.z + 0.62, R = sg.reach, [bw, bh] = sg.board;
    box(K.iron, X, u - 0.035, u + 0.035, df - 0.025, df, zb - 0.22, zb + 0.78, IRON);
    beam(K.iron, X, [u, df, zb], [u, df - R, zb], 0.045, 0.035, [1, 0, 0], IRON); beam(K.iron, X, [u, df, zb + 0.66], [u, df - R * 0.74, zb + 0.02], 0.03, 0.03, [1, 0, 0], IRON);
    const sc = [df - 0.36, zb + 0.2]; for (let k = 0; k < 8; k++) { const a0 = k / 8 * Math.PI * 1.6, a1 = (k + 1) / 8 * Math.PI * 1.6, r0 = 0.15 - k * 0.012, r1 = 0.15 - (k + 1) * 0.012;
      beam(K.iron, X, [u, sc[0] + Math.cos(a0) * r0, sc[1] + Math.sin(a0) * r0], [u, sc[0] + Math.cos(a1) * r1, sc[1] + Math.sin(a1) * r1], 0.022, 0.022, [1, 0, 0], IRON); }
    box(K.iron, X, u - 0.03, u + 0.03, df - R - 0.04, df - R + 0.03, zb - 0.035, zb + 0.035, IRON);
    const dO = df - R + 0.07, dI = dO + bw, zT = zb - 0.1, zB = zT - bh;
    for (const dd of [dO + 0.07, dI - 0.07]) box(K.iron, X, u - 0.008, u + 0.008, dd - 0.012, dd + 0.012, zT, zb, IRON);
    const [cu, cv] = signCell(sg.emblem), uv = [[cu + 0.004, cv + 0.004], [cu + 0.246, cv + 0.004], [cu + 0.246, cv + 0.246], [cu + 0.004, cv + 0.246]], edgeUV = [[cu + 0.003, cv + 0.003], [cu + 0.006, cv + 0.003], [cu + 0.006, cv + 0.006], [cu + 0.003, cv + 0.006]];
    const t = 0.024; quad(K.sign, X, [u - t, dI, zB], [u - t, dO, zB], [u - t, dO, zT], [u - t, dI, zT], uv, [1, 1, 1], [-1, 0, 0]); quad(K.sign, X, [u + t, dO, zB], [u + t, dI, zB], [u + t, dI, zT], [u + t, dO, zT], uv, [1, 1, 1], [1, 0, 0]);
    quad(K.sign, X, [u - t, dO, zT], [u + t, dO, zT], [u + t, dI, zT], [u - t, dI, zT], edgeUV, [1, 1, 1], [0, 0, 1]); quad(K.sign, X, [u - t, dO, zB], [u + t, dO, zB], [u + t, dI, zB], [u - t, dI, zB], edgeUV, [1, 1, 1], [0, 0, -1]);
    quad(K.sign, X, [u - t, dO, zB], [u + t, dO, zB], [u + t, dO, zT], [u - t, dO, zT], edgeUV, [1, 1, 1], [0, -1, 0]); quad(K.sign, X, [u - t, dI, zB], [u + t, dI, zB], [u + t, dI, zT], [u - t, dI, zT], edgeUV, [1, 1, 1], [0, 1, 0]); }
  // a lantern by the door (the 1662 Act's "Lights in Lanthornes", §B2): unlit by day, on its own little bracket
  if (lot.lantern && c.gf.door) { const [a, b] = c.gf.door, u = (a + b) / 2 < W / 2 ? b + 0.32 : a - 0.32, z = 2.5;
    beam(K.iron, X, [u, -TP, z + 0.36], [u, -0.44, z + 0.36], 0.026, 0.026, [1, 0, 0], IRON); box(K.iron, X, u - 0.012, u + 0.012, -0.4, -0.376, z + 0.2, z + 0.36, IRON);
    box(K.paint, X, u - 0.09, u + 0.09, -0.48, -0.3, z - 0.12, z + 0.14, HORN); box(K.iron, X, u - 0.11, u + 0.11, -0.5, -0.28, z + 0.14, z + 0.2, IRON); box(K.iron, X, u - 0.11, u + 0.11, -0.5, -0.28, z - 0.16, z - 0.12, IRON);
    box(K.iron, X, u - 0.06, u + 0.06, -0.45, -0.33, z + 0.2, z + 0.26, IRON); }
  // an inn yard's back range keeps a gallery along its first floor
  if (lot.gallery && n > 1) { const s = S[1], dg2 = s.d - 1.3, zf = s.z;
    box(K.oak, X, 0.2, W - 0.2, dg2, s.d - TP, zf - 0.18, zf, oak(0.9));
    for (let u = 0.3; u < W - 0.3; u += 2.4) box(K.oak, X, u, u + 0.17, dg2 - 0.015, dg2 + 0.17, -0.3, zf + 2.6, oak());
    box(K.oak, X, 0.2, W - 0.2, dg2, dg2 + 0.1, zf + 0.92, zf + 1.0, oak()); box(K.oak, X, 0.2, W - 0.2, dg2, dg2 + 0.1, zf + 2.5, zf + 2.62, oak());
    for (let u = 0.35; u < W - 0.3; u += 0.16) box(K.oak, X, u, u + 0.05, dg2 + 0.025, dg2 + 0.075, zf, zf + 0.92, oak(0.9)); }
  return c;
}

// ---- the ground underfoot: pebbles set in sand, crowned to the sides, the kennel down the middle (§B2), mud by world
// position; lanes, entries and yards floored the same, a little gutter down their middles
const dirt = (x, y, t, plan) => { const a = Math.abs(t), n1 = valueNoise(x, y, 2.4, plan.seed + 3) * 0.5 + 0.5, n2 = valueNoise(x, y, 0.8, plan.seed + 5) * 0.5 + 0.5, n3 = valueNoise(x, y, 12, plan.seed + 7) * 0.5 + 0.5, k = (0.84 + 0.26 * n2) * (0.92 + 0.16 * n3);   // n3: the slow tone, 12 m cells, that keeps the pebbles' 3.2 m tile from showing
  let c = mixc([k, k * 0.985, k * 0.95], [0.6, 0.5, 0.38], Math.min(0.7, Math.max(0, n1 - 0.5) * 1.8));
  if (a < 0.75) c = mixc(c, [0.4, 0.35, 0.28], (1 - a / 0.75) * 0.8);
  else if (a > 1.1 && a < 2.4) c = mul(c, 0.9 + 0.1 * Math.abs(a - 1.75) / 0.65);
  if (a > plan.half - 0.45 && a <= plan.half + 0.01) c = mul(c, 0.84); return c; };
const laneZ = (plan, x, y, u, d, u0, u1) => plan.ground(x, y) + plan.profile(plan.half) - 0.06 * (1 - Math.abs(2 * (u - u0) / (u1 - u0) - 1)) * Math.min(1, Math.max(0, d));
function streetSurface(acc, water, plan, sA, sB) {
  const { spine: sp, half, profile, ground } = plan, K = plan.rules.kennel, ts = [];
  for (let t = -half; t <= half + 1e-6; t += 0.5) ts.push(+t.toFixed(3)); ts.push(-K.half, K.half, -0.13, 0.13); const T = [...new Set(ts)].sort((a, b) => a - b), nT = T.length;
  const nS = Math.max(1, Math.ceil((sB - sA) / 0.5)), rows = [];
  for (let i = 0; i <= nS; i++) { const s = sA + (sB - sA) * i / nS, a = sp.at(s); rows.push(T.map(t => { const x = a.x + a.nx * t, y = a.y + a.ny * t; return [x, y, ground(x, y) + profile(t), t, s]; })); }
  const grid = (A, rowsOf, n, colour) => { const base = A.v, m = rowsOf[0].length;
    for (let i = 0; i <= n; i++) for (let j = 0; j < m; j++) { const P = rowsOf[i][j], a = rowsOf[Math.max(0, i - 1)][j], b = rowsOf[Math.min(n, i + 1)][j], c = rowsOf[i][Math.max(0, j - 1)], e = rowsOf[i][Math.min(m - 1, j + 1)];
      const vs = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], vt = [e[0] - c[0], e[1] - c[1], e[2] - c[2]]; let N = cross(vs, vt); if (N[2] < 0) N = scl(N, -1); N = nrm(N);
      A.vert([P[0], P[2], -P[1]], [N[0], N[2], -N[1]], P[3] / 1.6, P[4] / 1.6, colour(P)); }
    for (let i = 0; i < n; i++) for (let j = 0; j + 1 < m; j++) { const a = base + i * m + j, b = a + 1, c = a + m, d = c + 1; A.ix.push(a, c, d, a, d, b); } };
  grid(acc, rows, nS, (P) => dirt(P[0], P[1], P[3], plan));
  // the kennel's water: a dark strip a little under the pebbles' edge, so only its middle shows
  const wz = profile(0.13) - 0.004, wrows = rows.map(row => [-0.13, 0.13].map(t => { const P = row.find(q => q[3] === t); return [P[0], P[1], P[2] - profile(t) + wz, t, P[4]]; }));
  grid(water, wrows, nS, () => [1, 1, 1]);
}
function laneFloor(acc, plan, lot, u0, u1, d0, d1) {
  const X = frameXf(lot), nu = 4, nd = Math.max(1, Math.ceil((d1 - d0) / 0.75)), base = acc.v;
  for (let i = 0; i <= nd; i++) for (let j = 0; j <= nu; j++) { const u = u0 + (u1 - u0) * j / nu, d = d0 + (d1 - d0) * i / nd, p = X.p(u, d, 0), x = p[0], y = -p[2], z = laneZ(plan, x, y, u, d, u0, u1);
    acc.vert([x, z + 0.004, -y], [0, 1, 0], u / 1.6, d / 1.6, dirt(x, y, (2 * (u - u0) / (u1 - u0) - 1) * 0.8, plan)); }
  for (let i = 0; i < nd; i++) for (let j = 0; j < nu; j++) { const a = base + i * (nu + 1) + j, b = a + 1, c = a + nu + 1, d = c + 1; acc.ix.push(a, b, d, a, d, c); }
}
// a lot's floors open to a body (a lane, a passage, a yard) and what stands solid in it, in its own (u, d)
const floorsOf = (l) => l.kind === "lane" ? [[0, l.width, -0.01, l.depth]] : (l.ground?.passage || l.ground?.arch) ? [[...(l.ground.passage || l.ground.arch), -0.01, l.depth], [l.yard.u0, l.yard.u1, l.depth - 0.01, l.yard.d1]] : [];
function solidsOf(l) {
  if (l.kind === "lane") return [[-0.22, 0, 0, l.depth], [l.width, l.width + 0.22, 0, l.depth], [-2.2, l.width + 2.2, l.depth, l.depth + l.back.depth]];
  const W = l.width, D = l.depth, way = l.ground.passage || l.ground.arch, out = way ? [[0, way[0], 0, D], [way[1], W, 0, D]] : [[0, W, 0, D]];
  if (l.ground.shop) out.push([l.ground.shop[0], l.ground.shop[1], -0.82, 0]);
  if (l.yard) out.push([l.yard.u0 - 0.22, l.yard.u0, D, l.yard.d1], [l.yard.u1, l.yard.u1 + 0.22, D, l.yard.d1], [l.yard.u0 - 1.5, l.yard.u1 + 1.5, l.yard.d1, l.yard.d1 + l.back.depth]);
  return out;
}
// a stand-in of the city behind: a house of the next street, plastered over a timber frame, its windows, a gabled roof
// of tile set across or along its row, sometimes a stack; seen from above and from far off, never walked to
function buildBackland(K, b) {
  const X = frameXf({ frame: b.frame, width: b.width, floor: b.floor, lean: 0 }), W = b.width, d0 = b.d0, d1 = b.d0 + b.depth, h = b.h, cP = mul(lin(b.plaster), 0.72 - 0.05 * b.row), cT = mul(tint(b.tile, TILE_REF), 0.92 - 0.04 * b.row), cO = mul(tint(STREET_1660.oak[b.k & 3], OAK_REF), 0.8);
  box(K.plaster, X, 0, W, d0, d1, -1.5, h, cP, { tex: 2, skip: "z-z+" });
  const floors = Math.round((h - 0.3) / 2.9);
  for (const [d, f] of [[d0, -1], [d1, 1]]) { const o0 = f < 0 ? d - 0.03 : d, o1 = f < 0 ? d : d + 0.03;
    if (b.row > 1) continue;
    const back = f < 0 ? "d+" : "d-";       // the face against the wall, never seen
    for (let i = 1; i <= floors; i++) box(K.oak, X, 0.002, W - 0.002, o0, o1, i * 2.9 - 0.1, i * 2.9 + 0.06, cO, { skip: back });
    for (const u of [0.05, W / 3 - 0.07, 2 * W / 3 - 0.07, W - 0.2]) box(K.oak, X, u, u + 0.15, f < 0 ? o0 - 0.012 : o0, f < 0 ? o1 : o1 + 0.012, 0, h, cO, { skip: back });
    for (let i = 0; i < floors; i++) for (const fu of [1 / 6, 0.5, 5 / 6]) { const u = W * fu, z = i * 2.9 + 0.95, dd = d + f * 0.012, w = Math.min(0.55, W / 6 - 0.2);
      quad(K.glass, X, [u - w, dd, z], [u + w, dd, z], [u + w, dd, z + 1.15], [u - w, dd, z + 1.15], [[0, 0], [2 * w / 0.42, 0], [2 * w / 0.42, 1.9], [0, 1.9]], [0.62, 0.62, 0.62], [0, f, 0]); } }
  const T = (u0, u1, v0, v1) => [[u0 / 2, v0 / 2], [u1 / 2, v0 / 2], [u1 / 2, v1 / 2], [u0 / 2, v1 / 2]];
  if (b.ridge === "across") { const m = W / 2, ap = h + m * 1.28, len = Math.hypot(m + 0.25, ap - h + 0.32);
    for (const [u0, sg] of [[-0.25, -1], [W + 0.25, 1]]) quad(K.tile, X, [u0, d0 - 0.3, h - 0.32], [u0, d1 + 0.3, h - 0.32], [m, d1 + 0.3, ap + 0.05], [m, d0 - 0.3, ap + 0.05], T(d0, d1 + 0.6, 0, len), cT, [sg * 1.28, 0, 1]);
    for (const [d, f] of [[d0, -1], [d1, 1]]) tri(K.plaster, X, [0, d, h], [W, d, h], [m, d, ap], [[0, 0], [1, 0], [0.5, 1]], mul(cP, 0.95), [0, f, 0]);
    if (b.stack) box(K.brick, X, m - 0.4, m + 0.4, d0 + 1.2, d0 + 2.1, h, ap + 0.9, [0.85, 0.85, 0.85]); }
  else { const m = (d0 + d1) / 2, ap = h + (d1 - d0) / 2 * 0.84, len = Math.hypot((d1 - d0) / 2 + 0.3, ap - h + 0.25);
    for (const [dd, f] of [[d0 - 0.3, -1], [d1 + 0.3, 1]]) quad(K.tile, X, [-0.05, dd, h - 0.25], [W + 0.05, dd, h - 0.25], [W + 0.05, m, ap + 0.05], [-0.05, m, ap + 0.05], T(0, W, 0, len), cT, [0, f * 0.84, 1]);
    for (const [u, f] of [[0, -1], [W, 1]]) tri(K.plaster, X, [u, d0, h], [u, d1, h], [u, m, ap], [[0, 0], [1, 0], [0.5, 1]], mul(cP, 0.95), [f, 0, 0]);
    if (b.stack) box(K.brick, X, W * 0.3 - 0.4, W * 0.3 + 0.4, m - 0.45, m + 0.45, h, ap + 0.9, [0.85, 0.85, 0.85]); }
}
function buildLot(K, lot, plan, row) {
  const yardWall = (X, u0, u1, d0, d1, z0, h) => { if (d1 - d0 < 0.05) return; box(K.brick, X, u0, u1, d0, d1, z0, h, [0.9, 0.9, 0.9]); box(K.brick, X, u0 - 0.04, u1 + 0.04, d0, d1, h, h + 0.1, [0.75, 0.75, 0.75]); };
  if (lot.kind === "lane") { const X = frameXf(lot), W = lot.width, i = row.indexOf(lot), lo = row[i - 1], hi = row[i + 1];
    // which neighbour stands at the lane's u = 0: on the left side the one before it along the spine, on the right the one after
    const nA = lot.side === "L" ? lo : hi, nB = lot.side === "L" ? hi : lo, z0 = lot.low - lot.floor - 0.3;
    laneFloor(K.street, plan, lot, 0, W, 0, lot.depth);
    yardWall(X, -0.22, 0, nA && nA.kind !== "lane" ? nA.depth : 0, lot.depth, z0, 2.6); yardWall(X, W, W + 0.22, nB && nB.kind !== "lane" ? nB.depth : 0, lot.depth, z0, 2.6);
    buildHouse(K, lot.back); return; }
  buildHouse(K, lot);
  const way = lot.ground.passage || lot.ground.arch;
  if (way) { const X = frameXf(lot), y = lot.yard, z0 = lot.low - lot.floor - 0.3; laneFloor(K.street, plan, lot, way[0], way[1], 0, lot.depth); laneFloor(K.street, plan, lot, y.u0, y.u1, lot.depth, y.d1);
    yardWall(X, y.u0 - 0.22, y.u0, lot.depth, y.d1, z0, lot.kind === "inn" ? 3.2 : 2.6); yardWall(X, y.u1, y.u1 + 0.22, lot.depth, y.d1, z0, lot.kind === "inn" ? 3.2 : 2.6);
    buildHouse(K, lot.back); }
}

// ---- the street: the plan, then a block of lots at a time (any order, the same result), meshes per material per block
const MATS = ["plaster", "oak", "glass", "tile", "brick", "iron", "sign", "paint", "street", "water"];
const CAST = { plaster: true, oak: true, glass: false, tile: true, brick: true, iron: true, sign: true, paint: true, street: false, water: false };
export function makeStreet(THREE, opts = {}) {
  const T0 = now(), plan = streetPlan(opts), T1 = now(), kit = streetKit(THREE), T2 = now(), BL = opts.block || 40, L = plan.spine.length;
  const rows = { L: [], R: [] }; for (const l of plan.lots) rows[l.side].push(l); for (const k in rows) rows[k].sort((a, b) => a.s0 - b.s0);
  // the blocks: a side's lots by where their middle falls along the spine, and the street's ground in the same lengths
  const blocks = new Map(), blockOf = (key) => { if (!blocks.has(key)) blocks.set(key, { key, lots: [], backs: [], K: Object.fromEntries(MATS.map(k => [k, new Acc()])) }); return blocks.get(key); };
  for (const l of plan.lots) blockOf(`${l.side}${Math.floor((l.s0 + l.s1) / 2 / BL)}`).lots.push(l);
  if (opts.backland !== false) for (const b of plan.backland) blockOf(`${b.side}${Math.floor((b.s0 + b.s1) / 2 / BL)}`).backs.push(b);
  for (let b = 0; b * BL < L; b++) blockOf(`S${b}`);
  let keys = [...blocks.keys()].sort(); if (opts.order === "reverse") keys = keys.reverse(); else if (opts.order === "shuffle") keys = keys.map(k => [unit(hashN(k.length, k.charCodeAt(0), k.charCodeAt(k.length - 1))), k]).sort((a, b) => a[0] - b[0]).map(e => e[1]);
  const per = {};
  for (const key of keys) { const B = blocks.get(key), t = now();
    if (key[0] === "S") { const b = +key.slice(1); streetSurface(B.K.street, B.K.water, plan, b * BL, Math.min(L, (b + 1) * BL)); }
    else { for (const l of B.lots.sort((a, b) => a.s0 - b.s0)) buildLot(B.K, l, plan, rows[l.side]); for (const bl of B.backs.sort((a, b) => a.row - b.row || a.s0 - b.s0)) buildBackland(B.K, bl); }
    let h = 0x2545f491; for (const k of MATS) { const a = B.K[k].p; for (let i = 0; i < a.length; i += 5) h = hashN(h, Math.round(a[i] * 1000)); } B.digest = h; per[key] = +(now() - t).toFixed(1); }
  const T3 = now(), group = new THREE.Group(); group.name = "street"; let tris = 0, verts = 0, meshes = 0;
  for (const key of [...blocks.keys()].sort()) { const B = blocks.get(key), g = new THREE.Group(); g.name = `street/${key}`;
    for (const k of MATS) { const A = B.K[k]; if (!A.v) continue; const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(A.p, 3)); geo.setAttribute("normal", new THREE.Float32BufferAttribute(A.n, 3));
      geo.setAttribute("uv", new THREE.Float32BufferAttribute(A.uv, 2)); geo.setAttribute("color", new THREE.Float32BufferAttribute(A.c, 3));
      geo.setIndex(A.v > 65535 ? new THREE.Uint32BufferAttribute(A.ix, 1) : new THREE.Uint16BufferAttribute(A.ix, 1)); geo.computeBoundingSphere(); geo.computeBoundingBox();
      const m = new THREE.Mesh(geo, kit.mats[k]); m.name = `street/${key}/${k}`; m.castShadow = CAST[k]; m.receiveShadow = true; m.matrixAutoUpdate = false; g.add(m);
      tris += A.ix.length / 3; verts += A.v; meshes++; B.K[k] = null; }
    group.add(g); }
  // the posts: one instanced draw, oak, each its own height, girth and lean
  const prof = [[0, 0], [1, 0], [1, 0.86], [0.94, 0.9], [0.45, 0.985], [0, 1.0]].map(([x, y]) => new THREE.Vector2(x, y)), pg = new THREE.LatheGeometry(prof, 4, Math.PI / 4), uvs = pg.attributes.uv;
  for (let i = 0; i < uvs.count; i++) { const u = uvs.getX(i), v = uvs.getY(i); uvs.setXY(i, v * 0.6, u * 0.35); }
  pg.setAttribute("color", new THREE.Float32BufferAttribute(new Float32Array(pg.attributes.position.count * 3).fill(1), 3));
  const posts = new THREE.InstancedMesh(pg, kit.mats.oak, Math.max(1, plan.posts.length)); posts.count = plan.posts.length; posts.name = "street/posts"; posts.castShadow = posts.receiveShadow = true;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), col = new THREE.Color();
  plan.posts.forEach((p, i) => { e.set(p.tilt[0], p.yaw, p.tilt[1], "YXZ"); q.setFromEuler(e); m4.compose(new THREE.Vector3(p.x, p.z - 0.25, -p.y), q, new THREE.Vector3(p.r, p.h + 0.25, p.r)); posts.setMatrixAt(i, m4);
    const t = tint(STREET_1660.oak[Math.floor(unit(hashN(plan.seed, i, 77)) * STREET_1660.oak.length)], OAK_REF); const k = 0.62 + 0.16 * unit(hashN(plan.seed, i, 78)); posts.setColorAt(i, col.setRGB(t[0] * k, t[1] * k, t[2] * k)); });
  posts.computeBoundingSphere(); group.add(posts); tris += plan.posts.length * pg.index.count / 3; meshes++;
  // what stops a body, and the height of the ground under it
  const xf = new Map(plan.lots.map(l => [l, frameXf(l)])), solid = new Map(plan.lots.map(l => [l, solidsOf(l)])), floors = new Map(plan.lots.map(l => [l, floorsOf(l)]));
  const near = (side, s, m) => rows[side].filter(l => l.s1 > s - m && l.s0 < s + m);
  const postsByCell = new Map(); for (const p of plan.posts) { const k = Math.floor(p.s / 4); if (!postsByCell.has(k)) postsByCell.set(k, []); postsByCell.get(k).push(p); }
  function blocked(x, y, half = 0.22) {
    const pr = plan.spine.project(x, y); if (!pr || pr.s < -3 || pr.s > L + 3) return false;
    for (let k = Math.floor(pr.s / 4) - 1; k <= Math.floor(pr.s / 4) + 1; k++) for (const p of postsByCell.get(k) || []) if (Math.hypot(x - p.x, y - p.y) < p.r + half) return true;
    if (Math.abs(pr.t) < plan.half - 1.0) return false;
    for (const l of near(pr.t > 0 ? "L" : "R", pr.s, 4 + Math.max(0, Math.abs(pr.t) - plan.half) * 0.25)) { const [u, d] = xf.get(l).local(x, y);
      for (const R of solid.get(l)) if (u > R[0] - half && u < R[1] + half && d > R[2] - half && d < R[3] + half) return true; }
    return false;
  }
  function heightAt(x, y) {
    const pr = plan.spine.project(x, y); if (!pr) return plan.ground(x, y);
    if (Math.abs(pr.t) <= plan.half) return plan.ground(x, y) + plan.profile(pr.t);
    for (const l of near(pr.t > 0 ? "L" : "R", pr.s, 6)) { const [u, d] = xf.get(l).local(x, y); for (const [u0, u1, d0, d1] of floors.get(l)) if (u >= u0 && u <= u1 && d >= d0 && d <= d1) return laneZ(plan, x, y, u, d, u0, u1); }
    return plan.ground(x, y) + plan.profile(plan.half);
  }
  // a place on the street: s along the spine, t across (+ left); its height; the yaw that looks along the street
  const frame = (s, t = 0) => { const a = plan.spine.at(s), x = a.x + a.nx * t, y = a.y + a.ny * t; return { x, y, z: heightAt(x, y), yaw: Math.atan2(-a.tx, a.ty) * 180 / Math.PI, tx: a.tx, ty: a.ty, nx: a.nx, ny: a.ny }; };
  const digest = () => [...blocks.keys()].sort().map(k => blocks.get(k).digest.toString(36)).join(".");
  const T4 = now(), count = (k) => plan.lots.filter(l => l.kind === k).length;
  const stats = { lots: plan.lots.length, houses: count("house"), inns: count("inn"), lanes: count("lane"), entries: count("entry"), signs: plan.lots.filter(l => l.sign).length, posts: plan.posts.length,
    blocks: blocks.size, meshes, tris: Math.round(tris), verts, ms: { plan: +(T1 - T0).toFixed(1), textures: kit.ms, kitThisCall: +(T2 - T1).toFixed(1), geometry: +(T3 - T2).toFixed(1), meshes: +(T4 - T3).toFixed(1), total: +(T4 - T0).toFixed(1), perBlock: per } };
  return { group, lots: plan.lots, posts: plan.posts, plan, blocked, heightAt, frame, digest, stats, ms: stats.ms.total, materials: kit.mats };
}
