// A room's compiled spec, once (R54 step 5a): its walls and what stands in them (doors, windows, hearths),
// with every height a room's type decides (a state room's windows reach high, a kitchen's hearth is open).
// The linings (lab/painted/procedural.js buildWall, lab/brief/strongroom.js) and the carve (src/make/carve.js)
// both read this, so a sill or a firebox has one number, never two that may disagree (the hall crack,
// 2026-10-06, was two). Pure: no three.js.
import { compileRoom } from "../../lab/house/plan-compile.js";
import { compileBrief } from "../../lab/brief/brief.js";

export function roomSpec(plan, room, { types = {}, brief = null, H }) {
  const T = types[room.room_type] || {};
  // the muniment room: from its period brief (its own builder reads the same spec)
  if (room.room_type === "muniment_room" && brief) return { ...compileBrief(plan, room.id, brief), strong: true };
  const spec = compileRoom(plan, room);
  // windows by rank: a state room's mullion-and-transom lights reach high; a closet's are small
  for (const F of Object.keys(spec.walls)) for (const e of spec.walls[F]) {
    if (e.kind !== "window") continue;
    if (T.windows === "state") { e.sill = 0.75; e.top = Math.min(H - 0.45, 3.2); }
    else if (T.windows === "small") { e.sill = 1.15; e.top = Math.min(H - 0.5, 2.1); }
    else { e.sill = 0.9; e.top = Math.min(H - 0.5, 2.5); }
  }
  // a kitchen's (or bakehouse's) hearth is an open one: wide, square-mouthed, deep, under a beam
  if (T.hearth === "kitchen") for (const F of Object.keys(spec.walls)) for (const e of spec.walls[F]) if (e.kind === "chimneypiece") {
    const top = Math.min(1.75, H - 1.2);
    Object.assign(e, { open: true, surround_top: top + 0.32, mantel: { r0: e.r0 - 0.1, r1: e.r1 + 0.1, top: top + 0.32, depth: 0.08 },
      firebox: { r0: e.r0 + 0.32, r1: e.r1 - 0.32, spring: top, apex: top, depth: (e.breast || 0) > 0.35 ? e.breast - 0.01 : 0.6 }, hearth: { r0: e.r0 + 0.2, r1: e.r1 - 0.2, out: 0.6 } });
  }
  return spec;
}

// where each floor stands and how tall a room is (the storeys it rises through), as the manor builds them
export function storeys(plan, gap = 0.35) {
  const floors = [...plan.floors].sort((a, b) => a.level - b.level);
  const levelOf = (id) => { let y = 0; for (const f of floors) { if (f.id === id) return y; y += f.storey_height_m + gap; } return y; };
  const heightOf = (room) => { const i = floors.findIndex(f => f.id === room.floor), n = room.rises || 1; let h = 0; for (let k = 0; k < n && floors[i + k]; k++) h += floors[i + k].storey_height_m + (k ? gap : 0); return h; };
  return { floors, levelOf, heightOf, gap };
}
// every built room's spec, keyed by id: { room, Y, H, spec }
export function houseSpecs(plan, { types = {}, brief = null, gap = 0.35 } = {}) {
  const { levelOf, heightOf } = storeys(plan, gap);
  return new Map(plan.rooms.filter(r => r.type !== "open").map(r => [r.id, { room: r, Y: levelOf(r.floor), H: heightOf(r), spec: roomSpec(plan, r, { types, brief, H: heightOf(r) }) }]));
}
