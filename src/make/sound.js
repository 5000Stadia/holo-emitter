// Is a generated place sound to walk into? (Kabe, 2026-10-06: "should be a check or new rule to prevent
// whatever was the root of those issues as it pertains to all location generation".) The root of the
// faults he found (a stair across a doorway, a stair turning with no landing, a window and a door in one
// opening, a chimney breast across a window) was the same: the plan was checked as a graph of rooms, never
// as a body walking it and a wall holding its openings. These rules hold for any place a plan type makes:
//   1. walls: on every wall, each door, window and chimneypiece (with its surround) keeps a hand from the
//      next and from the corners, and none overlaps another;
//   2. doorways: on both sides of every doorway there is floor you can stand on, not a stair, a well or a
//      piece of furniture;
//   3. walking: with every door open, a body walking (src/make/walk.js: a step at most, headroom, never
//      into a well) reaches every room from the entrance;
//   4. stairs: no riser over 0.22 m, no more than 16 risers between floor and landing, a landing at every turn.
// soundness({ plan, compileRoom, blocks }) -> { ok, findings: [{ rule, where, what }] }
import { makeWalk } from "./walk.js";

export const levelsOf = (plan, gap = 0.35) => { const fl = [...plan.floors].sort((a, b) => a.level - b.level), at = {}; let y = 0;
  for (const f of fl) { at[f.id] = y; y += f.storey_height_m + gap; } return (id) => at[id]; };

export function soundness({ plan, compileRoom, blocks = [], levelOf = levelsOf(plan), step = 0.2 }) {
  const findings = [], add = (rule, where, what) => findings.push({ rule, where, what });
  const rooms = plan.rooms.filter(r => r.type !== "open");
  // 1. walls
  const CLEAR = 0.15;
  for (const r of rooms) {
    if (r.landing) continue;
    const spec = compileRoom(plan, r);
    for (const [F, els] of Object.entries(spec.walls)) {
      const L = F === "N" || F === "S" ? r.rect.x1 - r.rect.x0 : r.rect.y1 - r.rect.y0;
      const span = (e) => e.kind === "chimneypiece" ? [Math.min(e.r0, e.mantel?.r0 ?? e.r0) - (e.breast ? 0.35 : 0), Math.max(e.r1, e.mantel?.r1 ?? e.r1) + (e.breast ? 0.35 : 0)] : [e.r0, e.r1];
      const list = els.filter(e => e.kind !== "open").map(e => ({ e, s: span(e) })).sort((a, b) => a.s[0] - b.s[0]);
      for (const { e, s } of list) if (s[0] < -0.01 || s[1] > L + 0.01) add("walls", `${r.id} ${F} wall`, `${e.kind} ${e.id} runs past the wall's end`);
      for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
        const a = list[i], b = list[j]; if (b.s[0] < a.s[1] + CLEAR) add("walls", `${r.id} ${F} wall`, `${a.e.kind} ${a.e.id} and ${b.e.kind} ${b.e.id} ${b.s[0] < a.s[1] ? "overlap" : "stand closer than a hand"} (${a.s.map(v => v.toFixed(2))} / ${b.s.map(v => v.toFixed(2))})`);
      }
    }
  }
  // 2. doorways, and 3. walking, with every door open
  const walk = makeWalk({ plan, levelOf, blocks, isOpen: () => true });
  for (const o of plan.openings) {
    if (!o.rect) continue;
    const ew = o.axis === "EW", cx = (o.rect.x0 + o.rect.x1) / 2, cy = (o.rect.y0 + o.rect.y1) / 2, L = levelOf(o.floor);
    for (const side of [-1, 1]) {
      const x = ew ? (side < 0 ? o.rect.x0 - 0.5 : o.rect.x1 + 0.5) : cx, y = ew ? cy : (side < 0 ? o.rect.y0 - 0.5 : o.rect.y1 + 0.5);
      const room = plan.rooms.find(q => q.floor === o.floor && x > q.rect.x0 && x < q.rect.x1 && y > q.rect.y0 && y < q.rect.y1);
      if (!room || room.type === "open") continue;
      if (walk.groundAt(x, y, L) !== L) add("doorways", `${o.id} (${o.joins.join(" | ")})`, `no floor to stand on half a metre into ${room.id}`);
    }
  }
  const entrance = plan.openings.find(o => o.joins.includes(plan.entrance));
  const startRoom = entrance && rooms.find(r => entrance.joins.includes(r.id));
  if (startRoom) {
    const R = startRoom.rect, seen = new Set(), q = [], key = (i, j, h) => `${i},${j},${Math.round(h * 10)}`;
    const start = [Math.round((R.x0 + R.x1) / 2 / step), Math.round((R.y0 + R.y1) / 2 / step), levelOf(startRoom.floor)];
    seen.add(key(...start)); q.push(start);
    const reached = new Set();
    while (q.length) {
      const [i, j, h] = q.pop(), x = i * step, y = j * step;
      const here = walk.roomAt(x, y, h); if (here) reached.add(here.id);
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const g = walk.groundAt((i + di) * step, (j + dj) * step, h); if (g == null) continue;
        const k = key(i + di, j + dj, g); if (seen.has(k)) continue; seen.add(k); q.push([i + di, j + dj, g]);
      }
    }
    for (const r of rooms) if (!reached.has(r.id) && !r.landing) add("walking", r.id, "a body walking from the entrance, every door open, never gets here");
  } else add("walking", "entrance", "no doorway from the entrance");
  // 4. stairs
  for (const s of plan.stairs.filter(s => s.kind === "flight")) {
    const rise = (levelOf(s.to) - levelOf(s.from)) * (s.z1 - s.z0), riser = rise / s.treads;
    if (riser > 0.22) add("stairs", s.id, `risers of ${riser.toFixed(3)} m`);
    if (s.treads > 16) add("stairs", s.id, `${s.treads} risers with no landing`);
  }
  for (const w of plan.wells || []) if (!plan.stairs.some(s => s.well === w.id && s.kind === "landing")) add("stairs", w.id, "it turns with no landing");
  for (const s of plan.stairs.filter(s => !s.kind)) add("stairs", s.id, "a flight from floor to floor with no landing");
  return { ok: !findings.length, findings };
}
