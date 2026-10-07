// Plan checks on the carved house (R54 step 5b; consultation cf4d451), beside src/make/sound.js's own rules
// (openings a hand apart, risers and landings), which stay. Arithmetic in plan, milliseconds, at generation.
//   apart: two rooms on one floor stand a partition apart (or touch nowhere): never overlapping, never with a
//     wall between them thinner than MIN_WALL (a slit no one would build, and a lining's depth behind each face);
//   joins: every doorway has floor on both sides, in exactly the two rooms it joins (or a room and outdoors), and
//     every window has its room on one side and outdoors on the other;
//   backed: every fire's mouth leaves solid behind it (a firebox cut through the wall showed the hillside, 2026-10-06);
//   open: every room is open at its middle, and solid a hand beyond each of its walls where no opening stands;
//   fits: what the story requires in a room (plan.required, with what holds it) has a clear stretch of wall wide
//     enough for it, before anything is built (Kabe: "we never have to take the step of finding room for required
//     items"): a plan that fails this must be drawn bigger, not furnished around.
// planChecks({ plan, specs, carved }) -> { ok, findings: [{ rule, where, what }], ms }
import * as C from "../vendor/clipper2.min.mjs";
import { solidAt } from "./carve.js";
import { framesOf, onWallAt } from "./walls.js";

export const MIN_WALL = 0.2;
const mm = (m) => Math.round(m * 1000);
const ringOf = (room) => room.outline ? room.outline.map(([x, y]) => ({ x: mm(x), y: mm(y) })) : [[room.rect.x0, room.rect.y0], [room.rect.x1, room.rect.y0], [room.rect.x1, room.rect.y1], [room.rect.x0, room.rect.y1]].map(([x, y]) => ({ x: mm(x), y: mm(y) }));
const inside = (room, x, y) => C.pointInPolygon({ x: mm(x), y: mm(y) }, ringOf(room)) === C.PointInPolygonResult.IsInside;

export function planChecks({ plan, specs, carved, sizeOf = null }) {
  const t0 = performance.now(), findings = [], say = (rule, where, what) => findings.push({ rule, where, what });
  const list = [...specs.values()];
  // apart
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    const A = list[i].room, B = list[j].room; if (A.floor !== B.floor) continue;
    const over = C.intersect([ringOf(A)], [ringOf(B)], C.FillRule.NonZero);
    if (over.length && Math.abs(C.areaPaths(over)) > 1) { say("apart", `${A.id}|${B.id}`, "the two rooms overlap"); continue; }
    const near = C.intersect(C.inflatePaths([ringOf(A)], mm(MIN_WALL / 2) - 1, C.JoinType.Miter, C.EndType.Polygon), C.inflatePaths([ringOf(B)], mm(MIN_WALL / 2) - 1, C.JoinType.Miter, C.EndType.Polygon), C.FillRule.NonZero);
    if (near.length && Math.abs(C.areaPaths(near)) > 1) say("apart", `${A.id}|${B.id}`, `a wall thinner than ${MIN_WALL} m between them`);
  }
  // joins: a hand either side of each doorway's middle, through its wall
  const roomsAt = (floor, x, y) => list.filter(s => s.room.floor === floor && inside(s.room, x, y)).map(s => s.room.id);
  const court = new Set(plan.rooms.filter(r => r.type === "open").map(r => r.id));
  // (an outline room hosts its own: either side of the stretch of wall it names)
  const hosted = (room, F, r0, r1, T) => { const w = framesOf(room)[F], r = (r0 + r1) / 2, at = (d) => { const [u, v] = onWallAt(w, r, d); return [room.rect.x0 + u, room.rect.y0 + v]; }; return [at(0.15), at(-T - 0.15)]; };
  for (const o of plan.openings) { if (o.rect || !o.on) continue;
    for (const [id, h] of Object.entries(o.on)) { const room = plan.rooms.find(q => q.id === id), [inn, out] = hosted(room, h.F, h.r0, h.r1, o.T ?? 0.3), other = o.joins.find(j => j !== id);
      const got = [roomsAt(room.floor, ...inn), roomsAt(room.floor, ...out)];
      if (got[0].join() !== id || (court.has(other) ? got[1].length : got[1].join() !== other)) say("joins", o.id, `joins ${o.joins.join(" and ")}, but from ${id}'s side it opens into ${got.map(g => g.join("+") || "outdoors").join(" and ")}`); } }
  plan.windows.forEach((w, i) => { if (w.rect || !w.room) return; const room = plan.rooms.find(q => q.id === w.room), [inn, out] = hosted(room, w.F, w.r0, w.r1, w.T ?? 0.75);
    const got = [roomsAt(room.floor, ...inn), roomsAt(room.floor, ...out)]; if (got[0].join() !== w.room || got[1].length) say("joins", `window ${i}`, `should have ${w.room} and outdoors either side; has ${got.map(g => g.join("+") || "outdoors").join(" and ")}`); });
  for (const o of plan.openings) { if (!o.rect) continue;
    const R = o.rect, cx = (R.x0 + R.x1) / 2, cy = (R.y0 + R.y1) / 2, ew = o.axis === "EW", h = 0.15;
    const sides = ew ? [[R.x0 - h, cy], [R.x1 + h, cy]] : [[cx, R.y0 - h], [cx, R.y1 + h]];
    const got = sides.map(([x, y]) => roomsAt(o.floor, x, y)), want = o.joins.filter(j => !court.has(j));
    const reached = got.flat(), outdoors = got.filter(g => !g.length).length;
    if (want.some(j => !reached.includes(j)) || reached.some(j => !want.includes(j)) || outdoors !== o.joins.length - want.length)
      say("joins", o.id, `joins ${o.joins.join(" and ")}, but its two sides open into ${got.map(g => g.join("+") || "outdoors").join(" and ")}`); }
  plan.windows.forEach((w, i) => { if (!w.rect) return; const R = w.rect, cx = (R.x0 + R.x1) / 2, cy = (R.y0 + R.y1) / 2, ew = (R.x1 - R.x0) < (R.y1 - R.y0), h = 0.15;
    const got = (ew ? [[R.x0 - h, cy], [R.x1 + h, cy]] : [[cx, R.y0 - h], [cx, R.y1 + h]]).map(([x, y]) => roomsAt(w.floor, x, y));
    if (got.filter(g => g.length === 1).length !== 1 || got.filter(g => !g.length).length !== 1) say("joins", `window ${i}`, `should have one room and outdoors either side; has ${got.map(g => g.join("+") || "outdoors").join(" and ")}`); });
  // backed and open, read off the carve
  for (const { room, Y, spec } of list) {
    const { x0, y0, x1, y1 } = room.rect, W = x1 - x0, D = y1 - y0, frames = framesOf(room), P = (F, r, d) => { const [u, v] = onWallAt(frames[F], r, d); return [x0 + u, y0 + v]; };
    if (solidAt(carved, (x0 + x1) / 2, (y0 + y1) / 2, Y + 1.2)) say("open", room.id, "its middle is solid");
    for (const [F, es] of Object.entries(spec.walls)) {
      const L = frames[F].L;
      for (const e of es) if (e.kind === "chimneypiece") { const fb = e.firebox, [x, y] = P(F, (fb.r0 + fb.r1) / 2, (e.breast || 0) - fb.depth - 0.1);
        if (!solidAt(carved, x, y, Y + Math.min(0.5, fb.apex / 2))) say("backed", `${room.id} ${e.id}`, "less than 0.1 m of solid behind the fire"); }
      // solid a hand beyond the wall, every half metre where nothing stands in it
      const free = (r, z) => !es.some(e => r > Math.min(e.r0, e.mantel?.r0 ?? e.r0) - 0.15 && r < Math.max(e.r1, e.mantel?.r1 ?? e.r1) + 0.15 && (e.kind !== "window" || (z > e.sill - 0.1 && z < e.top + 0.1)));
      for (let r = 0.3; r < L - 0.3; r += 0.5) for (const z of [0.5, 1.5]) { if (!free(r, z)) continue; const [x, y] = P(F, r, -0.1);
        if (!solidAt(carved, x, y, Y + z)) say("open", `${room.id} ${F}`, `no wall a hand beyond its ${F} wall at ${r.toFixed(1)} m along, ${z} m up`); }
    }
  }
  // fits: the widest clear stretch of each room's walls (a hand clear of doors, windows and hearths) against the
  // widest thing the story needs against them
  if (sizeOf) for (const q of plan.required || []) { const s = specs.get(q.room); if (!s) { say("fits", q.kind, `required in ${q.room}, which the plan has no room called`); continue; }
    const need = [q.in ? sizeOf(q.in.kind) : null, sizeOf(q.kind, q.over || {})].filter(Boolean).map(z => z[0]), w = Math.max(0, ...need);
    let best = 0; for (const [F, es] of Object.entries(s.spec.walls)) { const L = s.spec.frames[F].L, cuts = es.map(e => [Math.min(e.r0, e.mantel?.r0 ?? e.r0) - 0.3, Math.max(e.r1, e.mantel?.r1 ?? e.r1) + 0.3]).sort((a, b) => a[0] - b[0]);
      let x = 0; for (const [a, b] of cuts) { best = Math.max(best, a - x); x = Math.max(x, b); } best = Math.max(best, L - x); }
    if (best < w + 0.1) say("fits", `${q.kind} in ${q.room}`, `needs ${(w + 0.1).toFixed(2)} m of clear wall; the widest is ${best.toFixed(2)} m`); }
  return { ok: !findings.length, findings, ms: Math.round((performance.now() - t0) * 10) / 10 };
}
