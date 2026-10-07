// Placing things in a room, by rules each kind declares (R54 step 6; Kabe, 2026-10-06: "objects CAN anchor to the
// floor and have requirements on proximity to, directional orientation and such. Coatrack wants to be by the
// front door … against the wall. A rug wants to be away from the wall and also doesn't want to take up a reserved
// space"; "a required layer for furnishing … prioritized first"; "the context and history of a room should
// determine its fullness or sparseness"). Design in design/production/geometry-method.md §5.
//
// A kind's place (or, if it has none, what its traits imply):
//   anchor: "wall" (back to a wall), "floor" (free standing), "hung" (on a wall, off the floor), "hearth" (in a
//     fire's mouth), "beside" (along a placed piece, facing it), "at" (drawn up to a placed piece: a chair at a table),
//     "in" (in a slot of a placed piece: a key in a drawer);
//   layer: "stand" (default), "floor" (floor cover: a matting or a carpet; furniture may stand on it), "wall";
//   must: hard rules, every one or the place is refused: { near: what, within: m } | { from: "wall", atLeast: m } |
//     { under: kind }; what is "door", "door:front" (the way in from outdoors or the house's entrance), "hearth",
//     "window", or a kind already placed;
//   prefer: soft rules, adding to a place's score: { near: what, weight } | { facing: what, weight } |
//     { centre: true, weight }; a lower score is better;
//   use: how far in front of it a body stands or a chair draws out (reserved: nothing placed there, walkable).
// Each place is worked out directly, never searched for: a wall's clear runs, the room's middle along its length,
// a piece's sides; the musts filter them, the prefers and the room's own sense (a tall piece off the window wall,
// the piece that names the room facing the way in) rank them, ties go to the seed. Every place keeps a body's way
// between the room's exits and to the front of every piece placed.
// Tiers: required (the story's, placed first, with their containers), anchor (what names the room), also (the
// room's ordinary things, placed until the room is as full as its context says: its status and use, and its
// history: lived in, newly let, shut up).
// Coordinates: the room's own frame (u east from its bounding box's west side, v north from its south side).
import { floorOf, onWallAt } from "./walls.js";

const CELL = 0.1, BODY = 0.22, STEP = 0.05;
export const HISTORY = { lived: 1, new: 0.6, let: 0.7, shut: 0.35, abandoned: 0.15 };

// what a kind's traits implied before it said where it goes (the furnishing habit, R47 plan §5)
export function ruleOf(kind) {
  if (kind?.place) return kind.place;
  const t = kind?.traits || [];
  if (t.includes("wall")) return { anchor: "hung" };
  if (t.includes("free")) return { anchor: "floor", along: true, prefer: [{ centre: true, weight: 1 }] };
  if (t.includes("beside")) return { anchor: "beside", of: "free" };
  if (t.includes("hearth")) return { anchor: "hearth" };
  return { anchor: "wall" };
}

export function placeRoom({ room, spec, plan, H, tiers, sizeOf, sweptOf = () => null, kindOf, seed = 1, fullness = 0, stairFloors = (s) => [s.from, s.to] }) {
  const notes = []; let probe = 0; { const sz = sizeOf, sw = sweptOf; sizeOf = (...a) => { const t = performance.now(); try { return sz(...a); } finally { probe += performance.now() - t; } }; sweptOf = (...a) => { const t = performance.now(); try { return sw(...a); } finally { probe += performance.now() - t; } }; }
  const t0 = performance.now(), frames = spec.frames, poly = floorOf(room), { x0, y0 } = room.rect;
  const W = room.rect.x1 - x0, D = room.rect.y1 - y0, n = Math.ceil(W / CELL), m = Math.ceil(D / CELL);
  let rs = seed >>> 0; const rand = () => { rs = Math.imul(rs ^ (rs >>> 15), 2246822507) + 0x9e3779b9 >>> 0; rs ^= rs >>> 13; return (rs >>> 0) / 4294967296; };
  const inPoly = (P, u, v) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [au, av] = P[i], [bu, bv] = P[j]; if ((av > v) !== (bv > v) && u < (bu - au) * (v - av) / (bv - av) + au) c = !c; } return c; };
  // the room's grid: 3 outside its floor, 2 something a body can't pass, 1 reserved, 0 free
  let version = 0; const grid = new Uint8Array(n * m), cells = (P, f) => { const us = P.map(p => p[0]), vs = P.map(p => p[1]);
    const i0 = Math.max(0, Math.floor(Math.min(...us) / CELL)), i1 = Math.min(n - 1, Math.floor(Math.max(...us) / CELL)), j0 = Math.max(0, Math.floor(Math.min(...vs) / CELL)), j1 = Math.min(m - 1, Math.floor(Math.max(...vs) / CELL));
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) if (inPoly(P, (i + 0.5) * CELL, (j + 0.5) * CELL)) if (f(i * m + j) === false) return false; return true; };
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) if (!inPoly(poly, (i + 0.5) * CELL, (j + 0.5) * CELL)) grid[i * m + j] = 3;
  // a footprint square to the grid (most are: a rectangular room's walls) is answered from running sums in one
  // lookup, rebuilt only when something new is claimed; one at an angle cell by cell
  const rectOf = (P) => { if (P.length !== 4) return null; for (let k = 0; k < 4; k++) { const a = P[k], b = P[(k + 1) % 4]; if (Math.abs(a[0] - b[0]) > 1e-9 && Math.abs(a[1] - b[1]) > 1e-9) return null; }
    const us = P.map(p => p[0]), vs = P.map(p => p[1]);
    return { i0: Math.max(0, Math.ceil(Math.min(...us) / CELL - 0.5)), i1: Math.min(n - 1, Math.floor(Math.max(...us) / CELL - 0.5 - 1e-9)), j0: Math.max(0, Math.ceil(Math.min(...vs) / CELL - 0.5)), j1: Math.min(m - 1, Math.floor(Math.max(...vs) / CELL - 0.5 - 1e-9)) }; };
  const sums = new Map();
  const sumOf = (key, test) => { const c = sums.get(key); if (c && c.v === version) return c.S; const S = new Uint32Array((n + 1) * (m + 1));
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) S[(i + 1) * (m + 1) + j + 1] = (test(i * m + j) ? 1 : 0) + S[i * (m + 1) + j + 1] + S[(i + 1) * (m + 1) + j] - S[i * (m + 1) + j];
    sums.set(key, { v: version, S }); return S; };
  const count = (S, R) => R.i1 < R.i0 || R.j1 < R.j0 ? 0 : S[(R.i1 + 1) * (m + 1) + R.j1 + 1] - S[R.i0 * (m + 1) + R.j1 + 1] - S[(R.i1 + 1) * (m + 1) + R.j0] + S[R.i0 * (m + 1) + R.j0];
  const claim = (P, s) => { version++; return cells(P, (c) => { if (grid[c] < s) grid[c] = s; }); };
  const freeOf = (P, worst) => { const R = rectOf(P); return R ? !count(sumOf(`over${worst}`, (c) => grid[c] > worst), R) : cells(P, (c) => grid[c] <= worst); };
  const onWall = (F, r0, r1, d0, d1) => [[r0, d0], [r1, d0], [r1, d1], [r0, d1]].map(([r, d]) => onWallAt(frames[F], r, d));
  // what the room itself claims: doors' swings and the step through, hearths, stairs; windows' light (for tall things)
  const exits = [], hearths = [], doors = [], windows = [], solids = [];
  for (const [F, es] of Object.entries(spec.walls)) for (const e of es) {
    if (e.kind === "door" || e.kind === "open") { const swings = e.kind === "door" && e.joins?.[0] === room.id;
      claim(onWall(F, e.r0 - (swings ? 0.15 : 0.1), e.r1 + (swings ? 0.15 : 0.1), 0, swings ? Math.max(1.0, e.r1 - e.r0 + 0.1) : 0.8), 1);
      const at = onWallAt(frames[F], (e.r0 + e.r1) / 2, BODY + 0.08); exits.push({ id: e.id, at }); doors.push({ F, e, at: onWallAt(frames[F], (e.r0 + e.r1) / 2, 0) }); }
    if (e.kind === "chimneypiece") { const B = e.breast || 0; if (B) { const P = onWall(F, e.r0, e.r1, 0, B); claim(P, 2); solids.push(P); }
      claim(onWall(F, e.mantel.r0 - 0.15, e.mantel.r1 + 0.15, 0, B + e.hearth.out + 0.5), 1); hearths.push({ F, e, at: onWallAt(frames[F], (e.r0 + e.r1) / 2, B) }); }
    if (e.kind === "window") windows.push({ F, e, sill: e.sill ?? 0.9, wide: onWall(F, e.r0 - 0.1, e.r1 + 0.1, 0, 0.7), tight: onWall(F, e.r0 - 0.1, e.r1 + 0.1, 0, 0.3), at: onWallAt(frames[F], (e.r0 + e.r1) / 2, 0) });
  }
  // each cell's lowest sill among the windows whose light falls on it (wide: 0.7 m in; tight: 0.3 m), once
  const litWide = new Float32Array(n * m).fill(Infinity), litTight = new Float32Array(n * m).fill(Infinity);
  for (const x of windows) { cells(x.wide, (c) => { litWide[c] = Math.min(litWide[c], x.sill); }); cells(x.tight, (c) => { litTight[c] = Math.min(litTight[c], x.sill); }); }
  const inLight = (P, h, tight) => { const L = tight ? litTight : litWide, R = rectOf(P); if (R) { const k = `lit${tight ? 1 : 0}/${Math.round(h * 100)}`; const c = sums.get(k); const S = c ? c.S : sumOf(k, (q) => L[q] < h + 0.05); if (!c) sums.get(k).v = Infinity; return count(S, R) > 0; }
    let hit = false; cells(P, (c) => { if (L[c] < h + 0.05) { hit = true; return false; } }); return hit; };
  for (const s of [...plan.stairs, ...(plan.wells || [])]) if (stairFloors(s).includes(room.floor) || (room.rises || 1) > 1) { const R = s.rect;
    if (R.x1 > x0 && R.x0 < room.rect.x1 && R.y1 > y0 && R.y0 < room.rect.y1) claim([[R.x0 - x0 - 0.3, R.y0 - y0 - 0.3], [R.x1 - x0 + 0.3, R.y0 - y0 - 0.3], [R.x1 - x0 + 0.3, R.y1 - y0 + 0.3], [R.x0 - x0 - 0.3, R.y1 - y0 + 0.3]], 1); }
  for (const w of plan.wells || []) { if (!(w.from === room.floor || w.to === room.floor)) continue; const h = w.hole, R = w.rect;
    if (R.x1 <= x0 || R.x0 >= room.rect.x1 || R.y1 <= y0 || R.y0 >= room.rect.y1) continue;
    const P = [[h.x0 - x0, h.y0 - y0], [h.x1 - x0, h.y0 - y0], [h.x1 - x0, h.y1 - y0], [h.x0 - x0, h.y1 - y0]]; claim(P, 2); solids.push(P);
    const a = { u0: R.x0 - x0, u1: R.x1 - x0, v0: R.y0 - y0, v1: R.y1 - y0 }, b = { u0: h.x0 - x0, u1: h.x1 - x0, v0: h.y0 - y0, v1: h.y1 - y0 };
    exits.push({ id: w.id, at: a.v0 < b.v0 - 0.01 ? [(a.u0 + a.u1) / 2, (a.v0 + b.v0) / 2] : a.v1 > b.v1 + 0.01 ? [(a.u0 + a.u1) / 2, (a.v1 + b.v1) / 2] : a.u0 < b.u0 - 0.01 ? [(a.u0 + b.u0) / 2, (a.v0 + a.v1) / 2] : [(a.u1 + b.u1) / 2, (a.v0 + a.v1) / 2] }); }
  // can a body still get from each exit to every other, and to the front of every piece? (the grid a body's
  // half-width off everything it can't pass, one flood)
  const uses = [];
  let cached = -1, base = null; const R = Math.ceil(BODY / CELL), OFFS = [];
  for (let di = -R; di <= R; di++) for (let dj = -R; dj <= R; dj++) if (!((Math.abs(di) - 0.5) ** 2 + (Math.abs(dj) - 0.5) ** 2 > (BODY / CELL) ** 2 && di && dj)) OFFS.push([di, dj]);
  const grow = (block, i, j) => { for (const [di, dj] of OFFS) { const a = i + di, b = j + dj; if (a >= 0 && b >= 0 && a < n && b < m) block[a * m + b] = 1; } };
  function walkable(extra, skip = null) {
    if (cached !== version) { base = new Uint8Array(n * m); for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) if (grid[i * m + j] >= 2) grow(base, i, j); cached = version; }
    const block = base.slice(); if (extra) cells(extra, (c) => { grow(block, Math.floor(c / m), c % m); });
    const at = ([u, v]) => Math.min(n - 1, Math.max(0, Math.floor(u / CELL))) * m + Math.min(m - 1, Math.max(0, Math.floor(v / CELL)));
    const pts = [...exits, ...uses.filter(u => u !== skip)].map(p => at(p.at)); if (pts.length < 2) return true;
    const seen = new Uint8Array(n * m), q = [pts[0]]; seen[pts[0]] = 1; for (const p of pts) block[p] = 0;
    while (q.length) { const c = q.pop(), i = Math.floor(c / m), j = c % m;
      for (const [a, b] of [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]]) { if (a < 0 || b < 0 || a >= n || b >= m) continue; const k = a * m + b; if (!seen[k] && !block[k]) { seen[k] = 1; q.push(k); } } }
    return pts.every(p => seen[p]);
  }
  // where a named thing is: its point in the room
  const placed = [];
  const whereIs = (what) => what === "door" ? doors.map(d => d.at) : what === "door:front" ? doors.filter(d => d.e.joins?.some(j => plan.rooms.find(q => q.id === j)?.type === "open" || j === plan.entrance)).map(d => d.at).concat(doors.length ? [] : [])
    : what === "hearth" ? hearths.map(h => h.at) : what === "window" ? windows.map(w => w.at) : placed.filter(p => p.kind === what).map(p => p.centre);
  const nearest = (what, [u, v]) => Math.min(Infinity, ...whereIs(what).map(([a, b]) => Math.hypot(a - u, b - v)));
  const centroid = poly.reduce((s, [u, v]) => [s[0] + u / poly.length, s[1] + v / poly.length], [0, 0]);
  const mustOk = (rule, centre, P, half = 0) => (rule.must || []).every(k => k.near ? nearest(k.near, centre) - half <= k.within : k.from === "wall" ? cells(P, () => true) && grownInside(P, k.atLeast) : true);
  const grownInside = (P, g) => { const c = P.reduce((s, [u, v]) => [s[0] + u / P.length, s[1] + v / P.length], [0, 0]); return P.every(([u, v]) => { const d = Math.hypot(u - c[0], v - c[1]) || 1; return inPoly(poly, u + (u - c[0]) / d * g, v + (v - c[1]) / d * g); }); };
  const preferScore = (rule, centre, facing) => (rule.prefer || []).reduce((s, p) => s + (p.weight ?? 1) * (p.near ? Math.min(5, nearest(p.near, centre)) : p.centre ? Math.hypot(centre[0] - centroid[0], centre[1] - centroid[1]) * 0.2
    : p.facing && facing ? Math.min(...whereIs(p.facing).map(([a, b]) => { const d = Math.hypot(a - centre[0], b - centre[1]) || 1; return 1 - ((a - centre[0]) * facing[0] + (b - centre[1]) * facing[1]) / d; }), 2) : 0), 0);
  const OPP = (F) => { const w = frames[F]; return Object.keys(frames).find(G => frames[G].n[0] * w.n[0] + frames[G].n[1] * w.n[1] < -0.9); };
  // a place on a wall: its clear runs, and in each the middle (a joiner sets a piece in the middle of its run)
  function onWallPlace(entry, [w, h, d], over) {
    const S = sweptOf(entry.kind, over), sw = S ? { back: Math.max(0, -S.lo[2]), l: Math.max(0, -w / 2 - S.lo[0]), r: Math.max(0, S.hi[0] - w / 2), front: Math.max(0, S.hi[2] - d) } : { back: 0, l: 0, r: 0, front: 0 };
    const tall = h > 0.85, off = 0.02 + sw.back, rule = entry.rule, best = [];
    for (const F of Object.keys(frames)) {
      const L = frames[F].L, runs = []; let run = null;
      for (let r = sw.l; r + w + sw.r <= L + 1e-6; r += STEP) {
        const P = onWall(F, r, r + w, off, off + d), Q = onWall(F, r - sw.l, r + w + sw.r, 0.02, off + d + sw.front);
        const ok = freeOf(P, 0) && freeOf(Q, 1) && !(tall && inLight(P, h, entry.tight)) && mustOk(rule, onWallAt(frames[F], r + w / 2, off + d / 2), P, w / 2);
        if (ok) { if (!run) runs.push(run = { r0: r, r1: r + w }); else run.r1 = r + w; } else run = null;
      }
      const doorsOn = (G) => (spec.walls[G] || []).filter(e => e.kind === "door" || e.kind === "open").length, nWin = (spec.walls[F] || []).filter(e => e.kind === "window").length;
      const busy = (tall ? nWin : nWin ? -0.5 : 0) + (spec.walls[F] || []).filter(e => e.kind === "chimneypiece").length * 2 + doorsOn(F) * 1.5 - (OPP(F) && doorsOn(OPP(F)) ? 1 : 0);
      for (const ru of runs) { const len = ru.r1 - ru.r0, c = (ru.r0 + ru.r1) / 2 - w / 2;
        // a must or a prefer that wants it near something: try along the run toward it too
        const rs = [Math.round(c / STEP) * STEP]; if ((rule.must || rule.prefer || []).some(k => k.near)) for (let r = ru.r0; r <= ru.r1 - w + 1e-6; r += 0.2) rs.push(r);
        for (const r of rs) { const centre = onWallAt(frames[F], r + w / 2, off + d / 2), P = onWall(F, r, r + w, off, off + d);
          if (!freeOf(P, 0) || !mustOk(rule, centre, P, w / 2)) continue;
          best.push({ F, r, P, centre, facing: frames[F].n, score: busy * 2 - len * 0.5 + Math.abs(c + w / 2 - L / 2) * 0.1 + preferScore(rule, centre, frames[F].n) * 2 + rand() * 1e-3, sweep: onWall(F, r - sw.l, r + w + sw.r, 0.02, off + d + sw.front) }); }
      }
    }
    best.sort((a, b) => a.score - b.score);
    for (const c of best) { const front = onWallAt(frames[c.F], c.r + w / 2, off + d + (entry.rule.use ?? 0.35));
      const use = { at: front }; uses.push(use); if (walkable(c.P)) return { wall: c.F, r: c.r + w / 2, d: off, P: c.P, centre: c.centre, sweep: c.sweep, use }; uses.pop(); }
    return null;
  }
  // free standing, rotated to a direction: its four corners from its middle
  const box = ([cu, cv], w, d, a) => { const x = [Math.cos(a), Math.sin(a)], f = [Math.sin(a), -Math.cos(a)];
    return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => [cu + x[0] * sx * w / 2 + f[0] * sz * d / 2, cv + x[1] * sx * w / 2 + f[1] * sz * d / 2]); };
  function onFloorPlace(entry, [w, h, d]) {
    // along the room's length, through its middle, nudged along that line if the middle is taken
    const a = W >= D ? 0 : Math.PI / 2, ax = [Math.cos(a), Math.sin(a)], rule = entry.rule, gap = rule.must?.find(k => k.from === "wall")?.atLeast ?? 0.6, cands = [];
    for (let k = 0; k < 40; k++) { const s = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.2, c = [centroid[0] + ax[0] * s, centroid[1] + ax[1] * s], P = box(c, w, d, a);
      if (!freeOf(P, rule.layer === "floor" ? 1 : 0) || !grownInside(P, gap) || !mustOk(rule, c, P, Math.max(w, d) / 2)) continue;
      cands.push({ c, P, score: preferScore(rule, c, null) + Math.abs(s) * 0.01 + rand() * 1e-3 }); }
    cands.sort((p, q) => p.score - q.score);
    for (const c of cands) if (rule.layer === "floor" || walkable(c.P)) return { at: c.c, rot: a, P: c.P, centre: c.c, along: true };
    return null;
  }
  // along a placed piece's two long sides, facing it (forms by the long table), or drawn up to it (a chair at a table)
  function besidePlace(entry, [w, h, d], target, side, gap = 0.12) {
    if (!target?.centre) return null; const a = target.rot ?? 0, x = [Math.cos(a), Math.sin(a)], f = [Math.sin(a), -Math.cos(a)];
    const half = target.dd / 2 + gap + d / 2, c = [target.centre[0] + f[0] * side * half, target.centre[1] + f[1] * side * half], P = box(c, w, d, a);
    if (!freeOf(P, 0) || !walkable(P)) return null;
    return { at: c, rot: side > 0 ? a + Math.PI : a, P, centre: c, facing: side };
  }
  // drawn up to a placed piece (a chair at a desk): at its front if it stands against a wall, else along its long
  // sides; the room to draw the chair out stays reserved behind it
  function atPlace(entry, [w, h, d], target) {
    const tries = [];
    if (target.wall) { const fr = frames[target.wall], c = onWallAt(fr, target.r, target.d + target.dd + 0.05 + d / 2), rot = Math.atan2(-fr.n[0], fr.n[1]); tries.push({ c, rot }); }
    else { const a = target.rot ?? 0, x = [Math.cos(a), Math.sin(a)], f = [Math.sin(a), -Math.cos(a)], tw = target.w || 1;
      for (const side of [1, -1]) for (const k of [0, -0.3, 0.3, -0.6, 0.6]) { const off = k * tw, half = target.dd / 2 + 0.05 + d / 2;
        tries.push({ c: [target.centre[0] + f[0] * side * half + x[0] * off, target.centre[1] + f[1] * side * half + x[1] * off], rot: side > 0 ? a + Math.PI : a }); } }
    for (const t of tries) { const P = box(t.c, w, d, t.rot), fwd = [Math.sin(t.rot), -Math.cos(t.rot)], back = box([t.c[0] - fwd[0] * (d / 2 + 0.2), t.c[1] - fwd[1] * (d / 2 + 0.2)], w, 0.4, t.rot);
      // (a chair may stand where a drawer pulls out: it is drawn back to open it)
      // (the piece's own use point is now the chair's: whoever uses it sits here, and draws the chair back to stand)
      if (freeOf(P, 1) && freeOf(back, 1) && walkable(P, target.use)) { claim(back, 1); if (target.use) target.use.at = [t.c[0] - fwd[0] * (d / 2 + 0.3), t.c[1] - fwd[1] * (d / 2 + 0.3)]; return { at: t.c, rot: t.rot, P, centre: t.c }; } }
    return null;
  }
  function hearthPlace(entry) {
    const h = hearths[0]; if (!h) return null; const fb = h.e.firebox;
    return { wall: h.F, r: (fb.r0 + fb.r1) / 2, d: (h.e.breast || 0) - 0.7, over: { W: Math.max(0.9, Math.min(2.4, fb.r1 - fb.r0 - 0.1)) }, inHearth: true };
  }
  // hung: one to a clear stretch of wall, a bay apart, never over a door, window or chimneypiece; if none at its own
  // height, over the windows if the room is tall enough (arms high in a hall)
  const hung = [];
  function hangPlace(entry, [w, h], count, at_y) {
    const got = [];
    for (const lift of at_y == null ? [null] : [null, "high"]) {
      const y = lift ? Math.max(...Object.values(spec.walls).flat().map(e => e.kind === "chimneypiece" ? e.mantel.top : e.top || 0)) + 0.3 : at_y;
      if (lift && (y + h > (H || 0) - 0.2 || got.length)) break;
      const over = lift ? { at_y: Math.round(y * 100) / 100 } : {};
      for (const F of Object.keys(frames)) { const L = frames[F].L;
        const blocked = (spec.walls[F] || []).filter(e => y == null || (e.kind === "chimneypiece" ? e.mantel.top : e.top || 99) > y - 0.1).map(e => e.kind === "chimneypiece" ? [e.mantel.r0 - 0.2, e.mantel.r1 + 0.2] : [e.r0 - 0.25, e.r1 + 0.25]);
        const rs = []; for (let r = 0.6 + w / 2; r <= L - 0.6 - w / 2; r += STEP) rs.push(r);
        // a must to be near something (a peg rail by the door): nearest first
        if ((entry.rule.must || []).some(k => k.near)) { const near = entry.rule.must.find(k => k.near).near; rs.sort((a, b) => nearest(near, onWallAt(frames[F], a, 0)) - nearest(near, onWallAt(frames[F], b, 0))); }
        for (const r of rs) { if (got.length >= count) break;
          if (blocked.some(([a, b]) => r + w / 2 > a && r - w / 2 < b) || hung.some(g => g.wall === F && Math.abs(g.r - r) < w + 1.2)) continue;
          if (!mustOk(entry.rule, onWallAt(frames[F], r, 0.1), null, w / 2)) continue;
          const g = { wall: F, r, d: 0, over, centre: onWallAt(frames[F], r, 0.1) }; hung.push(g); got.push(g); } }
    }
    return got;
  }
  // each entry: { kind, n, tier, over, in: { host kind, slot } }; the placed list in the order placed
  const out = [], refused = [];
  function put(entry) {
    const kind = kindOf(entry.kind), rule = entry.rule = { ...ruleOf(kind), ...(entry.place || {}) }, W0 = kind?.settings?.W, n0 = entry.n ?? 1;
    if (rule.anchor === "in" || entry.in) { const host = [...placed].reverse().find(p => p.kind === (entry.in?.kind || rule.of));
      if (!host) { refused.push({ kind: entry.kind, tier: entry.tier, why: `no ${entry.in?.kind || rule.of} to be in` }); return 0; }
      const p = { kind: entry.kind, tier: entry.tier, inside: { host: placed.indexOf(host), slot: entry.in?.slot || rule.slot || "drawer" } }; if (entry.story) p.story = entry.story; out.push(p); placed.push(p); return 1; }
    const size = sizeOf(entry.kind, entry.over || {}); if (!size) { refused.push({ kind: entry.kind, tier: entry.tier, why: "no size" }); return 0; }
    if (rule.anchor === "hung") { const got = hangPlace(entry, size, n0, kind?.settings?.at_y ?? null); for (const g of got) { const p = { kind: entry.kind, tier: entry.tier, ...g }; if (entry.story) p.story = entry.story; out.push(p); placed.push(p); }
      if (got.length < n0) refused.push({ kind: entry.kind, tier: entry.tier, why: `${n0 - got.length} found no clear stretch of wall${(rule.must || []).length ? " that keeps its rules" : ""}` }); return got.length; }
    let k = 0;
    for (let i = 0; i < n0; i++) {
      let p = null;
      if (rule.anchor === "hearth") p = hearthPlace(entry);
      else if (rule.anchor === "floor") { const over = rule.along && typeof W0 === "number" && entry.tier === "anchor" ? { W: Math.round(Math.min(W0 * 2, Math.max(W0 * 0.6, Math.max(W, D) * 0.5)) * 10) / 10 } : {}; p = onFloorPlace(entry, sizeOf(entry.kind, over)); if (p) p.over = over; }
      else if (rule.anchor === "at") { const target = [...placed].reverse().find(q => [].concat(rule.of).includes(q.kind)); if (target) p = atPlace(entry, sizeOf(entry.kind, {}), target); }
      else if (rule.anchor === "beside") { const target = placed.find(q => rule.of === "free" ? q.along : q.kind === rule.of);
        const over = rule.anchor === "beside" && target?.over?.W && typeof W0 === "number" ? { W: Math.round((target.over.W - 0.5) * 10) / 10 } : {};
        const sz = sizeOf(entry.kind, over); p = target && besidePlace(entry, sz, target, i % 2 ? -1 : 1); if (p) p.over = over; }
      // against a wall; a piece that has a width to give gives up to 30% of it to fit, and in a tight room may stand
      // beside a window rather than clear of its light
      if (!p && rule.anchor !== "hearth") for (const tight of [false, true]) { for (const f of typeof W0 === "number" ? [1, 0.9, 0.8, 0.7] : [1]) { const over = f < 1 ? { W: Math.round(W0 * f * 100) / 100 } : {};
        if ((p = onWallPlace({ ...entry, tight }, sizeOf(entry.kind, over), over))) { p.over = over; break; } } if (p) break; }
      if (!p) { refused.push({ kind: entry.kind, tier: entry.tier, why: "no place that keeps the way clear and its rules" }); break; }
      const sz = sizeOf(entry.kind, p.over || {}); Object.assign(p, { kind: entry.kind, tier: entry.tier, dd: sz[2], w: sz[0] });   // d stays the wall offset; dd is its depth
      // (a piece claims a finger's breadth round itself: two set exactly side by side share a face, which flickers)
      const around = (P, g) => { const c = P.reduce((a, [u, v]) => [a[0] + u / P.length, a[1] + v / P.length], [0, 0]); return P.map(([u, v]) => { const du = u - c[0], dv = v - c[1], l = Math.hypot(du, dv) || 1; return [u + du / l * g * 1.42, v + dv / l * g * 1.42]; }); };
      if (p.P) claim(rule.layer === "floor" ? p.P : around(p.P, 0.02), rule.layer === "floor" ? 0 : 2); if (p.sweep) claim(p.sweep, 1);
      if (entry.story) p.story = entry.story; out.push(p); placed.push(p); k++;
    }
    return k;
  }
  // the story's things first, each with what holds it (the key, and the desk whose drawer it is in), so finding room
  // for them is never the last step; then the anchors, less any the story already put here
  const already = new Map(), count0 = (k) => already.get(k) || 0;
  for (const e of tiers.required || []) { if (e.in && !placed.some(q => q.kind === e.in.kind)) { if (put({ kind: e.in.kind, n: 1, tier: "required" })) already.set(e.in.kind, count0(e.in.kind) + 1); }
    if (put({ ...e, n: e.n ?? 1, tier: "required" })) already.set(e.kind, count0(e.kind) + (e.n ?? 1)); }
  for (const e of tiers.anchor || []) { const [kind, n = 1] = [].concat(e), left = n - count0(kind); if (left > 0) put({ kind, n: left, tier: "anchor" }); }
  // the room's ordinary things, until it is as full as its context says (the share of its floor taken)
  const share = () => { let a = 0, t = 0; for (let c = 0; c < n * m; c++) { if (grid[c] === 3) continue; t++; if (grid[c] === 2) a++; } return t ? a / t : 1; };
  const pool = (tiers.also || []).map(e => [].concat(e)).map(([kind, max = 1]) => ({ kind, left: max }));
  for (let tries = 0; fullness > 0 && share() < fullness && pool.some(p => p.left) && tries < 40; tries++) {
    const live = pool.filter(p => p.left), p = live[Math.floor(rand() * live.length)]; p.left--;
    if (!put({ kind: p.kind, n: 1, tier: "also" })) p.left = 0;
  }
  // in the plan's frame, for the house's claims and the walker
  const toPlan = (P) => P.map(([u, v]) => [x0 + u, y0 + v]);
  for (const p of out) if (p.P) p.poly = toPlan(p.P);
  return { placed: out, refused, notes, share: Math.round(share() * 1000) / 1000, ms: Math.round((performance.now() - t0) * 10) / 10, probe_ms: Math.round(probe * 10) / 10 };
}
