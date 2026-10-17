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
  // a room rising through floors is as tall as the storeys it rises through, unless rooms stand in it above (a stair
  // hall's landings, each with its own walls, doors and floor): then only to the lowest of them (built whole, its
  // walls stood across the landing's doorway into the great chamber, 2026-10-06)
  const full = (room) => { const i = floors.findIndex(f => f.id === room.floor), n = room.rises || 1; let h = 0; for (let k = 0; k < n && floors[i + k]; k++) h += floors[i + k].storey_height_m + (k ? gap : 0); return h; };
  const over = (a, b) => a.x0 < b.x1 - 0.01 && a.x1 > b.x0 + 0.01 && a.y0 < b.y1 - 0.01 && a.y1 > b.y0 + 0.01;
  // a room may be lower than its storey (a passage "not much larger than a rat-hole", Alice ch. I)
  const heightOf = (room) => { if (room.height_m) return room.height_m; const Y = levelOf(room.floor), H = full(room); if ((room.rises || 1) < 2) return H;
    const above = plan.rooms.filter(q => q !== room && q.type !== "open" && levelOf(q.floor) > Y + 0.01 && levelOf(q.floor) < Y + H && over(q.rect, room.rect));
    return above.length ? Math.min(H, Math.min(...above.map(q => levelOf(q.floor))) - Y - gap) : H; };
  return { floors, levelOf, heightOf, gap };
}
// every built room's spec, keyed by id: { room, Y, H, spec }
export function houseSpecs(plan, { types = {}, brief = null, gap = 0.35 } = {}) {
  const { levelOf, heightOf } = storeys(plan, gap);
  const specs = new Map(plan.rooms.filter(r => r.type !== "open").map(r => [r.id, { room: r, Y: levelOf(r.floor), H: heightOf(r), spec: roomSpec(plan, r, { types, brief, H: heightOf(r) }) }]));
  // a doorway's reveal is lined once: when both rooms would line it, the one whose builder makes it its own (the
  // strongroom's iron door in stone) keeps it, else the room that hangs the door (lined twice, the two faces
  // flickered, 2026-10-06)
  const doorsOf = (sp) => Object.values(sp.walls).flat().filter(e => e.kind === "door");
  for (const o of plan.openings) { const [a, b] = (o.joins || []).map(j => specs.get(j)); if (!a || !b) continue;
    const ea = doorsOf(a.spec).find(e => e.id === o.id), eb = doorsOf(b.spec).find(e => e.id === o.id); if (!ea || !eb || ea.lining === false || eb.lining === false) continue;
    if (eb.style === "iron" && ea.style !== "iron") ea.lining = false; else eb.lining = false; }
  return specs;
}
