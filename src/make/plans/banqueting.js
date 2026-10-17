// A plan type with no right angles to lean on (R54 step 5e; Kabe, 2026-10-06: "make sure you can allow cool
// architectures like a large octagon room"): a garden banqueting house of c.1660, where a party withdrew after
// dinner for the sweet course, often octagonal (Lyveden's New Bield is a cross; Hampton Court's and Chiswick's
// were octagons, as were many garden lodges). One octagonal room, drawn as an exact regular octagon, entered from a
// small square lobby off the garden; windows in its diagonal sides and its east and west, a chimneypiece in its
// north. The octagon's openings name the edge that hosts them (an outline has no N/E/S/W to match on).
import { regular, wallsOf } from "../walls.js";

export const BANQUETING_DIMS = { R: 4.6, storey: 4.2, wall: 0.75, part: 0.3, lobby: [3.0, 2.6], door: 1.1, window: 1.4 };

export function planBanqueting({ dims = BANQUETING_DIMS } = {}) {
  const D = { ...BANQUETING_DIMS, ...dims }, c = [10, 10], ap = D.R * Math.cos(Math.PI / 8);
  const plan = { schema: "holo-emitter-plan/0.1", generated: { type: "banqueting" }, units: "m", north: "+y",
    floors: [{ id: "ground", level: 0, storey_height_m: D.storey }], rooms: [], openings: [], windows: [], fireplaces: [], stairs: [], wells: [], objects: [] };
  const outline = regular(c, D.R, 8), xs = outline.map(p => p[0]), ys = outline.map(p => p[1]);
  const oct = { id: "octagon", floor: "ground", name: "BANQUETING ROOM", type: "enclosed", room_type: "great_chamber", archetype: "state",
    outline, rect: { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) } };
  const [lw, ld] = D.lobby, ly1 = c[1] - ap - D.part;
  const lobby = { id: "lobby", floor: "ground", name: "LOBBY", type: "enclosed", room_type: "porch", archetype: "service", rect: { x0: c[0] - lw / 2, x1: c[0] + lw / 2, y0: ly1 - ld, y1: ly1 } };
  const garden = { id: "garden", floor: "ground", name: "GARDEN", type: "open", archetype: "open", room_type: "court", rect: { x0: c[0] - 6, x1: c[0] + 6, y0: lobby.rect.y0 - D.wall - 6, y1: lobby.rect.y0 - D.wall } };
  plan.rooms.push(oct, lobby, garden);
  // the octagon's walls by the way each faces into the room
  const walls = wallsOf(oct), facing = (nx, ny) => walls.reduce((b, w) => (w.n[0] * nx + w.n[1] * ny > b.n[0] * nx + b.n[1] * ny ? w : b));
  const mid = (w, width) => ({ F: w.F, r0: +(w.L / 2 - width / 2).toFixed(3), r1: +(w.L / 2 + width / 2).toFixed(3) });
  // the door from the lobby: in the octagon's south side (its frame faces north, into the room)
  const S = facing(0, 1), hw = D.door / 2;
  plan.openings.push({ id: "d1", kind: "door", floor: "ground", axis: "NS", T: D.part, joins: ["octagon", "lobby"], on: { octagon: mid(S, D.door) },
    rect: { x0: c[0] - hw, x1: c[0] + hw, y0: ly1, y1: ly1 + D.part } });
  plan.openings.push({ id: "d2", kind: "door", floor: "ground", axis: "NS", joins: ["garden", "lobby"], rect: { x0: c[0] - hw, x1: c[0] + hw, y0: lobby.rect.y0 - D.wall, y1: lobby.rect.y0 } });
  // windows in the four diagonal sides and the east and west; the chimneypiece in the north
  for (const [nx, ny] of [[1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [-1, 0]].map(([x, y]) => [-x, -y]))
    plan.windows.push({ floor: "ground", room: "octagon", T: D.wall, ...mid(facing(nx / Math.hypot(nx, ny), ny / Math.hypot(nx, ny)), D.window) });
  plan.fireplaces.push({ floor: "ground", room: "octagon", kind: "chimneypiece", breast: 0.48, ...mid(facing(0, -1), 2.2) });
  plan.entrance = "garden";
  return plan;
}
