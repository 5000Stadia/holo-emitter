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
//   4. stairs: no riser over 0.22 m, no more than 16 risers between floor and landing, a landing at every turn;
//   5. passage: in every room, a body the player's size gets from each exit to every other past what stands
//      in it (src/make/passage.js), within each walkway the room declares (its regions).
// A place may have more than one body (plan.bodies: a story's sizes, Alice at ten inches and at nine feet): a doorway
// is sound if a body that fits it stands on both sides, and a room is reached if any body reaches it (which body
// you have when is the story's own softlock check, src/make/story.js).
// soundness({ plan, compileRoom, blocks }) -> { ok, findings: [{ rule, where, what }] }
import { makeWalk } from "./walk.js";
import { passable, roomPassage } from "./passage.js";
import { wallToRoom } from "./walls.js";

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
  const bodies = plan.bodies || [null], walks = bodies.map(b => ({ b, w: makeWalk({ plan, levelOf, blocks, isOpen: () => true, ...(b ? { body: b } : {}) }) }));
  const walk = walks[0].w, fitting = (o) => walks.filter(({ b }) => !o.height_m || !b || b.head <= o.height_m);
  for (const o of plan.openings) {
    if (!o.rect) continue;
    const ew = o.axis === "EW", cx = (o.rect.x0 + o.rect.x1) / 2, cy = (o.rect.y0 + o.rect.y1) / 2, L = levelOf(o.floor);
    for (const side of [-1, 1]) {
      const x = ew ? (side < 0 ? o.rect.x0 - 0.5 : o.rect.x1 + 0.5) : cx, y = ew ? cy : (side < 0 ? o.rect.y0 - 0.5 : o.rect.y1 + 0.5);
      const room = plan.rooms.find(q => q.floor === o.floor && x > q.rect.x0 && x < q.rect.x1 && y > q.rect.y0 && y < q.rect.y1);
      if (!room || room.type === "open") continue;
      if (!fitting(o).some(({ w }) => w.groundAt(x, y, L) === L)) add("doorways", `${o.id} (${o.joins.join(" | ")})`, `no floor to stand on half a metre into ${room.id}`);
    }
  }
  const entrance = plan.openings.find(o => o.joins.includes(plan.entrance));
  const startRoom = entrance && rooms.find(r => entrance.joins.includes(r.id));
  if (startRoom) { const reached = new Set(); step = Math.min(step, plan.claim_cell || step);
   for (const { w: walk } of walks) {
    const R = startRoom.rect, seen = new Set(), q = [], key = (i, j, h) => `${i},${j},${Math.round(h * 10)}`;
    const start = [Math.round((R.x0 + R.x1) / 2 / step), Math.round((R.y0 + R.y1) / 2 / step), levelOf(startRoom.floor)];
    seen.add(key(...start)); q.push(start);
    while (q.length) {
      const [i, j, h] = q.pop(), x = i * step, y = j * step;
      const here = walk.roomAt(x, y, h); if (here) reached.add(here.id);
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const g = walk.groundAt((i + di) * step, (j + dj) * step, h); if (g == null) continue;
        const k = key(i + di, j + dj, g); if (seen.has(k)) continue; seen.add(k); q.push([i + di, j + dj, g]);
      }
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
  // 5. passage, room by room, furniture and all
  let passMs = 0;
  for (const r of rooms) {
    const P = roomPassage(plan, r, compileRoom(plan, r), wallToRoom);
    const mine = blocks.filter(b => b.room === r.id).map(b => ({ u0: b.x0 - r.rect.x0, u1: b.x1 - r.rect.x0, v0: b.y0 - r.rect.y0, v1: b.y1 - r.rect.y0 }));
    // a way between two exits holds if any of the place's bodies finds it
    let cut = null;
    for (const b of bodies) { const got = passable({ ...P, solids: [...P.solids, ...mine], ...(b ? { body: b.half, cell: plan.claim_cell || 0.1 } : {}) }); passMs += got.ms;
      const here = new Set(got.cut.map(([a, c]) => `${a}\u0000${c}`)); cut = cut ? new Set([...cut].filter(k => here.has(k))) : here; }
    for (const k of cut) { const [a, b] = k.split("\u0000"); add("passage", r.id, `a body can't get from ${a} to ${b}`); }
  }
  return { ok: !findings.length, findings, passMs: +passMs.toFixed(1) };
}
