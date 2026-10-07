// The plan, compiled: a pure function of the plan, no three.js, so the brief compiler (lab/brief) and
// tools in Node can use it as the house does.
import { framesOf } from "../../src/make/walls.js";
export const EPS = 0.06;

// ---------------------------------------------------------------- the plan, compiled
// For a room and a plan rect, which of the room's walls it lies on, and where along that wall
// (r from the wall's left corner as you face it). null if it touches none.
export function onWall(room, R, inside = false) {
  const { x0, x1, y0, y1 } = room.rect;
  const ovx = Math.min(x1, R.x1) - Math.max(x0, R.x0), ovy = Math.min(y1, R.y1) - Math.max(y0, R.y0);
  const near = (a, b) => Math.abs(a - b) < EPS;
  const hits = [];
  if (ovx > 0.05 && (inside ? near(R.y1, y1) : (near(R.y0, y1) || (R.y0 < y1 + EPS && R.y1 > y1 + EPS && R.y0 > y1 - 0.8))))
    hits.push({ F: "N", r0: Math.max(x0, R.x0) - x0, r1: Math.min(x1, R.x1) - x0, T: R.y1 - R.y0 });
  if (ovx > 0.05 && (inside ? near(R.y0, y0) : (near(R.y1, y0) || (R.y1 > y0 - EPS && R.y0 < y0 - EPS && R.y1 < y0 + 0.8))))
    hits.push({ F: "S", r0: x1 - Math.min(x1, R.x1), r1: x1 - Math.max(x0, R.x0), T: R.y1 - R.y0 });
  if (ovy > 0.05 && (inside ? near(R.x1, x1) : (near(R.x0, x1) || (R.x0 < x1 + EPS && R.x1 > x1 + EPS && R.x0 > x1 - 0.8))))
    hits.push({ F: "E", r0: y1 - Math.min(y1, R.y1), r1: y1 - Math.max(y0, R.y0), T: R.x1 - R.x0 });
  if (ovy > 0.05 && (inside ? near(R.x0, x0) : (near(R.x1, x0) || (R.x1 > x0 - EPS && R.x0 < x0 - EPS && R.x1 < x0 + 0.8))))
    hits.push({ F: "W", r0: Math.max(y0, R.y0) - y0, r1: Math.min(y1, R.y1) - y0, T: R.x1 - R.x0 });
  return hits[0] || null;
}

export function compileRoom(plan, room) {
  const H = plan.floors.find(f => f.id === room.floor).storey_height_m;
  // its walls (src/make/walls.js): N, E, S, W for a rectangle; one per edge, e0, e1, ..., for an outline
  const frames = framesOf(room), walls = Object.fromEntries(Object.keys(frames).map(F => [F, []]));
  if (room.outline) return compileOutline(plan, room, H, walls, frames);
  for (const o of plan.openings) {
    if (!(o.joins || []).includes(room.id) || !o.rect) continue;
    const w = onWall(room, o.rect); if (!w) continue;
    if (o.kind === "open_edge") walls[w.F].push({ kind: "open", id: o.id, r0: w.r0, r1: w.r1, top: H, T: 0, lining: false });
    else walls[w.F].push({ kind: "door", id: o.id, r0: w.r0, r1: w.r1, top: Math.min(2.2, H - 0.5), T: Math.max(0.05, w.T),
                           lining: o.joins[0] === room.id || plan.rooms.find(r => r.id === o.joins.find(j => j !== room.id))?.type === "open", passage: false, joins: o.joins });
  }
  for (const [i, win] of plan.windows.entries()) {
    if (win.floor !== room.floor || !win.rect) continue;
    const w = onWall(room, win.rect); if (!w) continue;
    walls[w.F].push({ kind: "window", id: `win${i}`, r0: w.r0, r1: w.r1, sill: 0.95, top: Math.min(H - 0.32, 2.45), splay: 0.1, T: w.T, lights: [2, 2] });
  }
  for (const [i, fp] of plan.fireplaces.entries()) {
    if (fp.room !== room.id || !fp.rect) continue;
    const w = onWall(room, fp.rect, true); if (!w) continue;
    const wd = w.r1 - w.r0, c = (w.r0 + w.r1) / 2, s = Math.min(1.3, Math.max(0.85, wd / 2.21));
    walls[w.F].push({ kind: "chimneypiece", id: `hearth${i}`, r0: w.r0, r1: w.r1, surround_top: 1.356 * s,
      mantel: { r0: w.r0 - 0.19, r1: w.r1 + 0.19, top: 1.761 * s, depth: 0.17 },
      firebox: { r0: c - wd * 0.33, r1: c + wd * 0.33, spring: 0.83 * s, apex: 1.219 * s, depth: Math.min(0.5, Math.max(0.3, w.T - 0.06)) },
      hearth: { r0: w.r0 - 0.09, r1: w.r1 + 0.09, out: 0.4 },
      breast: Math.max(0, w.T - 0.02) });       // the plan's fireplace rect is the breast standing into the room
  }
  const style = room.archetype === "service" ? "limewashed" : "panelled";
  const floor = room.archetype === "service" || room.archetype === "hall" ? "flags" : "boards";
  return { room, H, walls, frames, style, floor };
}

// An outline room's openings, windows and hearths say which of its walls hosts them and where along it, so no
// matching by position is needed (a diagonal wall has no axis to match on): an opening's on[room] = { F, r0, r1 },
// a window's or a fireplace's room and F, r0, r1 (a fireplace's breast, its depth into the room)
function compileOutline(plan, room, H, walls, frames) {
  for (const o of plan.openings) { const h = o.on?.[room.id]; if (!h || !walls[h.F]) continue;
    if (o.kind === "open_edge") walls[h.F].push({ kind: "open", id: o.id, r0: h.r0, r1: h.r1, top: H, T: 0, lining: false });
    else walls[h.F].push({ kind: "door", id: o.id, r0: h.r0, r1: h.r1, top: Math.min(2.2, H - 0.5), T: o.T ?? 0.3, lining: o.joins[0] === room.id || plan.rooms.find(r => r.id === o.joins.find(j => j !== room.id))?.type === "open", passage: false, joins: o.joins }); }
  plan.windows.forEach((w, i) => { if (w.room !== room.id || !walls[w.F]) return;
    walls[w.F].push({ kind: "window", id: `win${i}`, r0: w.r0, r1: w.r1, sill: 0.95, top: Math.min(H - 0.32, 2.45), splay: 0.1, T: w.T ?? 0.75, lights: [2, 2] }); });
  plan.fireplaces.forEach((fp, i) => { if (fp.room !== room.id || !walls[fp.F]) return;
    const wd = fp.r1 - fp.r0, c = (fp.r0 + fp.r1) / 2, s = Math.min(1.3, Math.max(0.85, wd / 2.21)), B = fp.breast ?? 0.48;
    walls[fp.F].push({ kind: "chimneypiece", id: `hearth${i}`, r0: fp.r0, r1: fp.r1, surround_top: 1.356 * s, mantel: { r0: fp.r0 - 0.19, r1: fp.r1 + 0.19, top: 1.761 * s, depth: 0.17 },
      firebox: { r0: c - wd * 0.33, r1: c + wd * 0.33, spring: 0.83 * s, apex: 1.219 * s, depth: Math.min(0.5, Math.max(0.3, B + 0.02 - 0.06)) }, hearth: { r0: fp.r0 - 0.09, r1: fp.r1 + 0.09, out: 0.4 }, breast: B }); });
  for (const F of Object.keys(walls)) walls[F].sort((a, b) => a.r0 - b.r0);
  const style = room.archetype === "service" ? "limewashed" : "panelled", floor = room.archetype === "service" || room.archetype === "hall" ? "flags" : "boards";
  return { room, H, walls, frames, style, floor };
}

