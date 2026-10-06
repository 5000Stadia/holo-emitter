// Passage through a room (Kabe, 2026-10-06): after anything that a body can't walk through is placed in
// a room (furniture, a stair, a chimney breast, a story's heap of things), a body the player's size can
// still get from each of the room's exits to every other. It is arithmetic on the room's floor, no
// rendering: a grid at a hand's pitch, every cell within a body's half-width of a wall or a solid shut,
// one flood from each exit. Under a millisecond for a large room.
//
// The criteria:
//   - exits: every doorway (its threshold, just inside the room) and every stair that arrives or leaves
//     here (the floor you step off it onto);
//   - solids: whatever stands on the floor and stops a body: furniture footprints, chimney breasts, a
//     stair's flights, landing and the well cut in this floor;
//   - the body: a half-width (0.22 m for the player now; Alice's sizes change it), kept from walls and solids;
//   - points: what must be reached as well (a thing that works, a key, where you start): a room with one
//     door is still refused if its press or its key is walled off by a heap;
//   - the rule: within a room every exit and point reaches every other, unless the room says it is more than one
//     walkway. A room may declare regions, groups of its exits that a body moves between (two balcony
//     walkways round one courtyard, each with its own way in and out: Kabe's exception). Then the rule
//     holds within each region, and nothing is expected between them;
//   - a refusal names what is cut off from what, so the placer can try the piece elsewhere or leave it out;
//   - except on purpose: an obstacle may carry a gate (a barricade a prybar clears, a heap you can shift),
//     as a lock carries its key. Exits it alone keeps apart are not refused but reported as blocked, with
//     what clears them; the house's reach check (src/make/reach.js) then walks the room's parts, so the
//     tool has to be reachable without passing the barricade, or it is a softlock. A hoard you weave
//     through is fine: the rule asks for a way, not a straight one.
//
// passable({ W, D, exits: [{ id, at: [u, v] }], solids: [{ u0, u1, v0, v1, gate? }], body, regions, points })
//   -> { ok, groups: [[exit ids reached together]], cut: [[a, b]] (never meet), blocked: [[a, b]] (meet once
//        a gated obstacle is cleared), links: [{ a, b, by, gate }] (group a joins group b when by is cleared),
//        pointParts: { point id: group index }, ms }
export const PLAYER = { half: 0.22 };

export function passable({ W, D, exits, solids = [], body = PLAYER.half, regions = null, cell = 0.1, points = [] }) {
  const t0 = performance.now(), n = Math.ceil(W / cell), m = Math.ceil(D / cell);
  const cellOf = ([u, v]) => Math.min(n - 1, Math.max(0, Math.floor(u / cell))) * m + Math.min(m - 1, Math.max(0, Math.floor(v / cell)));
  // which part of the floor each exit (and named point) stands in, with these solids in place
  function parts(sol) {
    const free = new Uint8Array(n * m);
    // open floor a body's half-width off the walls, then each solid (grown by the half-width) shut, cell by cell
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { const u = (i + 0.5) * cell, v = (j + 0.5) * cell; free[i * m + j] = u > body && u < W - body && v > body && v < D - body ? 1 : 0; }
    for (const r of sol) { const i0 = Math.max(0, Math.ceil((r.u0 - body) / cell - 0.5)), i1 = Math.min(n - 1, Math.floor((r.u1 + body) / cell - 0.5)), j0 = Math.max(0, Math.ceil((r.v0 - body) / cell - 0.5)), j1 = Math.min(m - 1, Math.floor((r.v1 + body) / cell - 0.5));
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) free[i * m + j] = 0; }
    const label = new Int32Array(n * m).fill(-1), at = new Map(); let next = 0;
    for (const x of [...exits, ...points]) {
      const k = cellOf(x.at);
      if (!free[k]) { at.set(x.id, `shut:${x.id}`); continue; }                          // it stands in something
      if (label[k] < 0) { const c = next++, q = [k]; label[k] = c;
        while (q.length) { const p = q.pop(), a = Math.floor(p / m), b = p % m;
          for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const A = a + da, B = b + db; if (A < 0 || B < 0 || A >= n || B >= m) continue; const r = A * m + B; if (free[r] && label[r] < 0) { label[r] = c; q.push(r); } } } }
      at.set(x.id, label[k]);
    }
    return at;
  }
  // everything in place; then only what can't be moved (an obstacle with a gate, a barricade, can be cleared)
  const fixed = solids.filter(r => !r.gate), gated = solids.filter(r => r.gate);
  const now = parts(solids), ever = gated.length ? parts(fixed) : now;
  // the room's parts: each stretch of floor holding an exit or a named point (where you start, a key, a
  // thing that works), with what stands in it
  const groupsBy = new Map(); for (const x of [...exits, ...points]) { const c = now.get(x.id); (groupsBy.get(c) || groupsBy.set(c, []).get(c)).push(x.id); }
  const groups = [...groupsBy.values()];
  // the regions a body is expected to cross within: those the room declares, the rest (its other exits and
  // every point that must be reached) as one
  const declared = regions || [], inDeclared = new Set(declared.flat()), all = [...declared.map(r => r.filter(id => exits.some(x => x.id === id))), [...exits, ...points.filter(p => p.reach !== false)].map(x => x.id).filter(id => !inDeclared.has(id))];
  const cut = [], blocked = [];
  for (const reg of all) for (let a = 1; a < reg.length; a++) {
    const A = reg[0], B = reg[a];
    if (ever.get(A) !== ever.get(B) || typeof ever.get(A) === "string") cut.push([A, B]);                    // no clearing would join them
    else if (now.get(A) !== now.get(B)) blocked.push([A, B]);                                                  // a barricade stands between
  }
  // what clears each barricade's way: an obstacle whose removal alone joins two parts, and its gate
  const links = [];
  for (const g of gated) { const without = parts(solids.filter(r => r !== g));
    for (let a = 0; a < groups.length; a++) for (let b = a + 1; b < groups.length; b++) if (without.get(groups[a][0]) === without.get(groups[b][0]) && typeof without.get(groups[a][0]) !== "string") links.push({ a, b, by: g.id || g.why, gate: g.gate }); }
  // a point (a key, where you start) is in the part of the exits it shares floor with
  const pointParts = Object.fromEntries(points.map(p => [p.id, groups.findIndex(g => g.includes(p.id))]));
  return { ok: !cut.length, groups, cut, blocked, links, pointParts, ms: +(performance.now() - t0).toFixed(2) };
}

// a room's exits and fixed solids from its plan and compiled walls, in its own frame (u east from its west
// wall, v north from its south wall); wallToRoom as in furnish.js
export function roomPassage(plan, room, spec, wallToRoom, { stairFloors = (s) => [s.from, s.to] } = {}) {
  const { x0, x1, y0, y1 } = room.rect, W = x1 - x0, D = y1 - y0, exits = [], solids = [];
  for (const F of ["N", "E", "S", "W"]) for (const e of spec.walls[F]) {
    if (e.kind === "door" || e.kind === "open") exits.push({ id: e.id, at: wallToRoom(F, W, D, (e.r0 + e.r1) / 2, PLAYER.half + 0.08) });
    if (e.kind === "chimneypiece" && e.breast) { const [a, b] = [wallToRoom(F, W, D, e.r0, 0), wallToRoom(F, W, D, e.r1, e.breast)];
      solids.push({ u0: Math.min(a[0], b[0]), u1: Math.max(a[0], b[0]), v0: Math.min(a[1], b[1]), v1: Math.max(a[1], b[1]), why: "chimney breast" }); }
  }
  for (const w of plan.wells || []) {
    if (!(w.from === room.floor || w.to === room.floor) || w.rect.x1 <= x0 || w.rect.x0 >= x1 || w.rect.y1 <= y0 || w.rect.y0 >= y1) continue;
    const H = w.hole, R = w.rect, rel = (r) => ({ u0: r.x0 - x0, u1: r.x1 - x0, v0: r.y0 - y0, v1: r.y1 - y0 });
    solids.push({ ...rel(H), why: "stair" });
    // the floor you step off the stair onto: the footprint beyond its well
    const a = rel(R), h = rel(H), foot = a.v0 < h.v0 - 0.01 ? [(a.u0 + a.u1) / 2, (a.v0 + h.v0) / 2] : a.v1 > h.v1 + 0.01 ? [(a.u0 + a.u1) / 2, (a.v1 + h.v1) / 2]
      : a.u0 < h.u0 - 0.01 ? [(a.u0 + h.u0) / 2, (a.v0 + a.v1) / 2] : [(a.u1 + h.u1) / 2, (a.v0 + a.v1) / 2];
    exits.push({ id: w.id, at: foot });
  }
  return { W, D, exits, solids, regions: room.regions || null };
}
