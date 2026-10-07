// Escape rooms and hoards, on the manor's plan, with nothing rendered: src/make/passage.js and reach.js.
import { planHybridE } from "../src/make/plans/hybrid-e.js";
import { GENTRY_SEAT_1660 } from "../src/make/programs/england-1660.js";
import { ROOM_TYPES_1660 } from "../src/make/rooms/england-1660.js";
import { compileRoom } from "../lab/house/plan-compile.js";
import { passable, roomPassage } from "../src/make/passage.js";
import { wallToRoom } from "../src/make/walls.js";
import { reachability } from "../src/make/reach.js";
import { rng } from "../src/make/id.js";
const plan = planHybridE(GENTRY_SEAT_1660, { hearths: Object.fromEntries(Object.entries(ROOM_TYPES_1660).map(([k, v]) => [k, v.hearth])) });
const room = plan.rooms.find(r => r.id === "study"), P = roomPassage(plan, room, compileRoom(plan, room), wallToRoom), door = P.exits[0];
console.log(`the study: ${P.W.toFixed(1)} × ${P.D.toFixed(1)} m, exits ${P.exits.map(x => x.id).join(", ")}`);
// a heap of the study's things piled against its door, cleared with a prybar
const heap = { id: "the heap against the door", u0: door.at[0] - 0.8, u1: door.at[0] + 0.8, v0: door.at[1] - 0.8, v1: door.at[1] + 0.8, gate: { "@holding": "prybar" } };
const scene = (prybarAt, prybarRoom) => {
  const got = passable({ ...P, solids: [...P.solids, heap], points: [{ id: "start", at: [P.W / 2, P.D / 2] }, ...(prybarRoom === "study" ? [{ id: "prybar", at: prybarAt }] : [])] });
  const parts = { study: got }, keys = [{ name: "prybar", room: prybarRoom, ...(prybarRoom === "study" ? { part: got.pointParts.prybar } : {}) }];
  return { got, reach: reachability(plan, { start: "study", startPart: got.pointParts.start, parts, keys }) };
};
const A = scene([P.W / 2 + 0.5, P.D / 2], "study");
console.log(`\nA. locked in the study by the heap, the prybar in the study:\n   the room: ${A.got.blocked.length ? `blocked ${A.got.blocked.map(b => b.join(" ↛ ")).join(", ")} until ${A.got.links.map(l => l.by + " is cleared (" + JSON.stringify(l.gate) + ")").join("; ")}` : "open"}\n   the house: ${A.reach.ok ? `escapable, all ${A.reach.reached.length} rooms reached` : JSON.stringify(A.reach)}`);
const B = scene([0, 0], "great_hall");
console.log(`\nB. the same, the prybar left in the great hall:\n   the house: ${B.reach.ok ? "escapable" : `NOT escapable. Reached ${B.reach.reached.join(", ")}; softlock: ${JSON.stringify(B.reach.softlocks)}; cut off: ${JSON.stringify(B.reach.cutOff.map(c => c.room + " part " + c.part))}`}`);
// a hoarder's study: piles of trinkets dropped at random, each kept only if a body still gets between the doors
const r = rng(1660); let piles = [], refused = 0, t0 = performance.now();
const things = [{ id: "the press", at: [P.W / 2, P.D - 0.6] }, { id: "the table", at: [1.0, P.D / 2] }, { id: "the hearth", at: [P.W - 1.0, P.D / 2] }];
for (let k = 0; k < 400 && piles.length < 60; k++) {
  const s = 0.4 + r() * 0.7, u = 0.3 + r() * (P.W - 0.6 - s), v = 0.3 + r() * (P.D - 0.6 - s), pile = { u0: u, u1: u + s, v0: v, v1: v + s };
  if (passable({ ...P, solids: [...P.solids, ...piles, pile], points: things }).ok) piles.push(pile); else refused++;
}
const ms = performance.now() - t0, area = piles.reduce((a, p) => a + (p.u1 - p.u0) * (p.v1 - p.v0), 0);
console.log(`\nC. a hoarder's study (D its door, * its press, table and hearth, which must stay reachable): ${piles.length} piles kept, ${refused} refused for closing the way; the piles cover ${(100 * area / (P.W * P.D)).toFixed(0)}% of the floor; ${(ms / (piles.length + refused)).toFixed(2)} ms a test`);
// draw it, a character a cell of 0.25 m
const cols = Math.ceil(P.W / 0.25), rows = Math.ceil(P.D / 0.25), grid = Array.from({ length: rows }, () => Array(cols).fill("·"));
for (const p of [...P.solids, ...piles]) for (let i = Math.floor(p.u0 / 0.25); i < Math.ceil(p.u1 / 0.25); i++) for (let j = Math.floor(p.v0 / 0.25); j < Math.ceil(p.v1 / 0.25); j++) if (grid[rows - 1 - j]?.[i] != null) grid[rows - 1 - j][i] = "█";
for (const x of [...P.exits, ...things]) { const i = Math.min(cols - 1, Math.floor(x.at[0] / 0.25)), j = Math.min(rows - 1, Math.floor(x.at[1] / 0.25)); grid[rows - 1 - j][i] = x.id.startsWith("the") ? "*" : "D"; }
console.log(grid.map(l => "   " + l.join("")).join("\n"));
