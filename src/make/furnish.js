// The furnishing habit (R47 plan §5): where a room's anchor furniture stands, from the room alone. A
// piece stands back to a wall unless its kind says otherwise ("free": a long table in the middle, along
// the room's length; "beside": forms along the free table's sides; "hearth": the spit in the fire's
// mouth; "wall": hung, between the windows). It keeps clear of the swing of every door, the hearth and
// its fender, the stairs, and (if it is taller than the sill) the windows; on a wall it stands at the
// middle of the longest clear run, as a joiner would set it. Every placement is tried against the
// room's doorways: if any doorway could no longer be walked to from the others, the place is refused.
// Coordinates: the room's own plan frame, u east from its west wall, v north from its south wall.
const BODY = 0.22, STEP = 0.05;          // a body's half-width, as the walker keeps it from walls

// a wall's (r along it, d into the room) to the room's (u, v); see PLACE in manor.js and onWall
export const wallToRoom = (F, W, D, r, d) => F === "N" ? [r, D - d] : F === "S" ? [W - r, d] : F === "E" ? [W - d, D - r] : [d, r];
const rectOnWall = (F, W, D, r0, r1, d0, d1) => { const [a, b] = [wallToRoom(F, W, D, r0, d0), wallToRoom(F, W, D, r1, d1)];
  return { u0: Math.min(a[0], b[0]), u1: Math.max(a[0], b[0]), v0: Math.min(a[1], b[1]), v1: Math.max(a[1], b[1]) }; };
const hit = (a, b, m = 0) => a.u0 < b.u1 + m && a.u1 > b.u0 - m && a.v0 < b.v1 + m && a.v1 > b.v0 - m;

// size: (kind) => [w, h, d] in its own frame (back at z = 0, front +z); anchors: [kind | [kind, n]]
export function furnish({ room, spec, plan, anchors, sizeOf, traitsOf, settingsOf = () => ({}), stairFloors }) {
  const { x0, x1, y0, y1 } = room.rect, W = x1 - x0, D = y1 - y0, out = [];
  const keepClear = [], floorThings = [], hung = [];
  // what stands in the way: doors' swing and the step through, hearths and their fenders, stairs
  for (const F of ["N", "E", "S", "W"]) for (const e of spec.walls[F]) {
    // a door's leaf swings into the room that hangs it (the first it joins); elsewhere, only the step through
    if (e.kind === "door" || e.kind === "open") { const swings = e.kind === "door" && e.joins?.[0] === room.id;
      keepClear.push({ ...rectOnWall(F, W, D, e.r0 - (swings ? 0.15 : 0.1), e.r1 + (swings ? 0.15 : 0.1), 0, swings ? Math.max(1.0, e.r1 - e.r0 + 0.1) : 0.8), why: "door", F, e }); }
    if (e.kind === "chimneypiece") keepClear.push({ ...rectOnWall(F, W, D, e.mantel.r0 - 0.15, e.mantel.r1 + 0.15, 0, (e.breast || 0) + e.hearth.out + 0.5), why: "hearth", F, e });
  }
  // a stair's whole footprint stays clear: its flights, its landing, and the floor you arrive on
  for (const s of [...plan.stairs, ...(plan.wells || [])]) if (stairFloors(s).includes(room.floor) || room.rises > 1) {
    const R = s.rect; if (R.x1 > x0 && R.x0 < x1 && R.y1 > y0 && R.y0 < y1) keepClear.push({ u0: R.x0 - x0 - 0.3, u1: R.x1 - x0 + 0.3, v0: R.y0 - y0 - 0.3, v1: R.y1 - y0 + 0.3, why: "stair" });
  }
  const windowsOn = (F) => spec.walls[F].filter(e => e.kind === "window");
  const doorsIn = keepClear.filter(k => k.why === "door");
  // can every doorway still reach every other across the floor, a body's width from anything?
  function walkable(extra) {
    if (doorsIn.length < 2) return true;
    const n = Math.ceil(W / 0.1), m = Math.ceil(D / 0.1), free = new Uint8Array(n * m), solid = [...floorThings, extra].filter(Boolean);
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { const u = (i + 0.5) * 0.1, v = (j + 0.5) * 0.1;
      free[i * m + j] = u > BODY && u < W - BODY && v > BODY && v < D - BODY && !solid.some(r => u > r.u0 - BODY && u < r.u1 + BODY && v > r.v0 - BODY && v < r.v1 + BODY) ? 1 : 0; }
    // each doorway's threshold cell, just inside the room
    const cellOf = (k) => { const e = k.e, [u, v] = wallToRoom(k.F, W, D, (e.r0 + e.r1) / 2, BODY + 0.06); return [Math.min(n - 1, Math.max(0, Math.floor(u / 0.1))), Math.min(m - 1, Math.max(0, Math.floor(v / 0.1)))]; };
    const starts = doorsIn.map(cellOf), seen = new Uint8Array(n * m), q = [starts[0]];
    if (!free[starts[0][0] * m + starts[0][1]]) return false;
    seen[starts[0][0] * m + starts[0][1]] = 1;
    while (q.length) { const [i, j] = q.pop(); for (const [a, b] of [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]]) if (a >= 0 && b >= 0 && a < n && b < m && free[a * m + b] && !seen[a * m + b]) { seen[a * m + b] = 1; q.push([a, b]); } }
    return starts.every(([i, j]) => seen[i * m + j]);
  }
  // a tall piece keeps out of a window's light; in a tight room (tight), only out of its splay
  const clearOf = (r, tall, tight = false) => !keepClear.some(k => hit(r, k)) && !floorThings.some(t => hit(r, t, 0.08))
    && (!tall || !Object.keys(spec.walls).some(G => windowsOn(G).some(e => hit(r, rectOnWall(G, W, D, e.r0 - 0.1, e.r1 + 0.1, 0, tight ? 0.3 : 0.7)))));
  // against a wall: walls without windows or a hearth first, then the middle of the longest clear run
  function onWall(kind, [w, h, d], over = {}, tight = false) {
    const tall = h > 0.85, best = [];
    for (const F of ["N", "E", "S", "W"]) {
      const L = F === "N" || F === "S" ? W : D, runs = []; let run = null;
      for (let r = 0; r + w <= L + 1e-6; r += STEP) {
        const R = rectOnWall(F, W, D, r, r + w, 0.02, d + 0.02);
        if (clearOf(R, tall, tight)) { if (!run) runs.push(run = { r0: r, r1: r + w }); else run.r1 = r + w; } else run = null;
      }
      // a wall with the hearth is busy, and with windows for a tall piece (a low table stands under a window, for
      // the light to work by); the wall you come in by is worst (the piece is unseen as you
      // enter, and crowds the door); the wall facing a doorway is best, the piece that names the room is what you see
      const doorsOn = (G) => spec.walls[G].filter(e => e.kind === "door" || e.kind === "open").length, OPP = { N: "S", S: "N", E: "W", W: "E" };
      const busy = (tall ? windowsOn(F).length : windowsOn(F).length ? -0.5 : 0) + spec.walls[F].filter(e => e.kind === "chimneypiece").length * 2 + doorsOn(F) * 1.5 - (doorsOn(OPP[F]) ? 1 : 0);
      for (const ru of runs) { const len = ru.r1 - ru.r0, c = (ru.r0 + ru.r1) / 2 - w / 2;
        best.push({ F, r: Math.round(c / STEP) * STEP, score: busy * 2 - len * 0.5 + Math.abs(c + w / 2 - L / 2) * 0.1 }); }
    }
    best.sort((a, b) => a.score - b.score);
    for (const c of best) { const R = rectOnWall(c.F, W, D, c.r, c.r + w, 0.02, d + 0.02); if (walkable(R)) return { kind, wall: c.F, r: c.r + w / 2, d: 0.02, rect: R, over }; }
    return null;
  }
  // free-standing: in the middle, along the room's length, nudged along it if the middle is taken
  function free(kind, [w, h, d], over = {}) {
    const along = W >= D, cu = W / 2, cv = D / 2;
    for (let k = 0; k < 40; k++) { const s = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.2;
      const u = along ? cu + s : cu, v = along ? cv : cv + s;
      const R = along ? { u0: u - w / 2, u1: u + w / 2, v0: v - d / 2, v1: v + d / 2 } : { u0: u - d / 2, u1: u + d / 2, v0: v - w / 2, v1: v + w / 2 };
      if (R.u0 > 0.6 && R.u1 < W - 0.6 && R.v0 > 0.6 && R.v1 < D - 0.6 && clearOf(R, false) && walkable(R)) return { kind, at: [u, v], along, rect: R, over };
    }
    return null;
  }
  // forms along the free table's two long sides, facing it
  function beside(kind, [w, h, d], table, side) {
    if (!table?.at) return null;
    const { at: [u, v], along, rect: T } = table, gap = 0.12, dd = (along ? T.v1 - T.v0 : T.u1 - T.u0) / 2 + gap + d / 2;
    const cu = along ? u : u + side * dd, cv = along ? v + side * dd : v;
    const R = along ? { u0: cu - w / 2, u1: cu + w / 2, v0: cv - d / 2, v1: cv + d / 2 } : { u0: cu - d / 2, u1: cu + d / 2, v0: cv - w / 2, v1: cv + w / 2 };
    if (!clearOf(R, false) || !walkable(R)) return null;
    return { kind, at: [cu, cv], along, facing: side, rect: R };
  }
  // the spit across the fire's mouth
  function hearth(kind) {
    const k = keepClear.find(c => c.why === "hearth"); if (!k) return null;
    // the spit 0.45 m into its frame: set a quarter metre inside the mouth, over the fire
    const fb = k.e.firebox; return { kind, wall: k.F, r: (fb.r0 + fb.r1) / 2, d: (k.e.breast || 0) - 0.7, over: { W: Math.max(0.9, Math.min(2.4, fb.r1 - fb.r0 - 0.1)) }, inHearth: true };
  }
  // hung: one to a clear stretch of wall, a bay apart, never over a door, window or chimneypiece
  // hung: one to a clear stretch of wall, a bay apart, never over a door, window or chimneypiece; a piece
  // that finds no stretch at its own height goes up over the windows, if the room is tall enough (arms
  // high in a hall)
  function hang(kind, [w, h], n, at_y = null) {
    const got = [];
    for (const lift of at_y == null ? [null] : [null, "high"]) {
      const y = lift ? Math.max(...Object.values(spec.walls).flat().map(e => e.kind === "chimneypiece" ? e.mantel.top : e.top || 0)) + 0.3 : at_y;
      if (lift && (y + h > (room.H || 0) - 0.2 || got.length)) break;
      const over = lift ? { at_y: Math.round(y * 100) / 100 } : {};
      for (const F of ["N", "S", "E", "W"]) { const L = F === "N" || F === "S" ? W : D;
        const blocked = spec.walls[F].filter(e => y == null || (e.kind === "chimneypiece" ? e.mantel.top : e.top || 99) > y - 0.1)
          .map(e => e.kind === "chimneypiece" ? [e.mantel.r0 - 0.2, e.mantel.r1 + 0.2] : [e.r0 - 0.25, e.r1 + 0.25]);
        for (let r = 0.6 + w / 2; r <= L - 0.6 - w / 2 && got.length < n; r += STEP) {
          if (blocked.some(([a, b]) => r + w / 2 > a && r - w / 2 < b) || hung.some(g => g.wall === F && Math.abs(g.r - r) < w + 1.2)) continue;
          const g = { kind, wall: F, r, d: 0, over }; hung.push(g); got.push(g);
        }
      }
    }
    return got;
  }
  let table = null;
  for (const entry of anchors) {
    const [kind, n = 1] = [].concat(entry), size = sizeOf(kind), traits = traitsOf(kind), W0 = settingsOf(kind).W;
    if (!size) continue;
    if (traits.includes("wall")) { out.push(...hang(kind, size, n, settingsOf(kind).at_y ?? null)); continue; }
    for (let i = 0; i < n; i++) {
      let p = null;
      // a free table takes half the room's length (a hall's table 'eight yards long', Worden 1643), within reason
      if (traits.includes("free")) { const over = typeof W0 === "number" ? { W: Math.round(Math.min(W0 * 2, Math.max(W0 * 0.6, Math.max(W, D) * 0.5)) * 10) / 10 } : {}; p = free(kind, sizeOf(kind, over), over); }
      else if (traits.includes("hearth")) p = hearth(kind);
      else if (traits.includes("beside")) { const over = table?.over?.W && typeof W0 === "number" ? { W: Math.round((table.over.W - 0.5) * 10) / 10 } : {}; p = beside(kind, sizeOf(kind, over), table, i % 2 ? -1 : 1); if (p) p.over = over; }
      // against a wall; a piece that has a width to give gives up to 30% of it to fit (a bed of 3 ft 9 in in a tight chamber, not 5 ft 3)
      // and in a tight room it may stand beside a window rather than clear of its light
      if (!p && !traits.includes("hearth")) for (const tight of [false, true]) { for (const k of typeof W0 === "number" ? [1, 0.9, 0.8, 0.7] : [1]) { const over = k < 1 ? { W: Math.round(W0 * k * 100) / 100 } : {}; if ((p = onWall(kind, sizeOf(kind, over), over, tight))) break; } if (p) break; }
      if (!p) continue;
      if (traits.includes("free") && !table) table = p;
      if (p.rect) floorThings.push(p.rect);
      out.push(p);
    }
  }
  return out;
}
