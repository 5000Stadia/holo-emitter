// The house carved from one solid (src/make/carve.js): how long it takes, how many bands, and points that
// must be solid or empty (consultation cf4d451: a room rising through floors keeps its outer walls; the floor
// over it stands where a room stands over it). Usage: node tools/check-carve.mjs
import { readFileSync } from "node:fs";
import * as C from "../src/vendor/clipper2.min.mjs";
import { carve } from "../src/make/carve.js";
import { planChecks } from "../src/make/plan-checks.js";
import { houseSpecs, storeys } from "../src/make/house-spec.js";
import { GENTRY_SEAT_1660 } from "../src/make/programs/england-1660.js";
import { ROOM_TYPES_1660 } from "../src/make/rooms/england-1660.js";
import { planHybridE } from "../src/make/plans/hybrid-e.js";
const plan = planHybridE(GENTRY_SEAT_1660, { hearths: Object.fromEntries(Object.entries(ROOM_TYPES_1660).map(([k, v]) => [k, v.hearth])) });
const brief = JSON.parse(readFileSync(new URL("../lab/brief/manor-1660.json", import.meta.url)));
const { levelOf, gap } = storeys(plan), specs = houseSpecs(plan, { types: ROOM_TYPES_1660, brief, gap });
carve({ plan, specs, levelOf, gap });                      // once to warm the engine
const t0 = performance.now(), got = carve({ plan, specs, levelOf, gap }), ms = performance.now() - t0;
const solidAt = (x, y, z) => { const Z = Math.round(z * 1000), b = got.bands.find(q => q.z0 <= Z && q.z1 > Z); if (!b) return false;
  let w = 0; for (const ring of b.paths) { const r = C.pointInPolygon({ x: Math.round(x * 1000), y: Math.round(y * 1000) }, ring); if (r === C.PointInPolygonResult.IsInside) w += C.isPositive(ring) ? 1 : -1; } return w > 0; };
const R = (id) => plan.rooms.find(r => r.id === id), mid = (r) => [(r.rect.x0 + r.rect.x1) / 2, (r.rect.y0 + r.rect.y1) / 2];
const hall = R("great_hall"), [hx, hy] = mid(hall), fY = levelOf("first"), gY = levelOf("garret");
const tests = [
  ["the hall's middle, over the first floor's level, is open", () => !solidAt(hx, hy, fY + 0.5)],
  ["the hall's south wall at 6 m is solid", () => solidAt(hx, hall.rect.y0 - 0.3, 6)],
  ["the gallery's floor over the hall is solid", () => solidAt(hx, hy, gY - 0.15)],
  ["the floor between ground and first in the parlour wing is solid", () => { const [x, y] = mid(R("great_parlour")); return solidAt(x, y, fY - 0.15); }],
  ["every room's middle at 1.5 m is open", () => [...specs.values()].every(({ room, Y }) => { const [x, y] = mid(room); return !solidAt(x, y, Y + 1.5) || console.log("  shut:", room.id); })],
  ["every doorway's middle at 1 m is open", () => plan.openings.filter(o => o.rect).every(o => { const r = plan.rooms.find(q => q.id === o.joins[1]); return !solidAt((o.rect.x0 + o.rect.x1) / 2, (o.rect.y0 + o.rect.y1) / 2, levelOf(o.floor) + 1) || console.log("  shut:", o.id, o.joins.join("|")); })],
  ["beside every doorway, the wall it stands in is solid at 1 m", () => plan.openings.filter(o => o.rect && o.kind === "door").every(o => { const R = o.rect, ew = o.axis === "EW";
    const pts = ew ? [[(R.x0 + R.x1) / 2, R.y0 - 0.5], [(R.x0 + R.x1) / 2, R.y1 + 0.5]] : [[R.x0 - 0.5, (R.y0 + R.y1) / 2], [R.x1 + 0.5, (R.y0 + R.y1) / 2]];
    const inOpening = ([x, y]) => [...plan.openings.filter(q => q.rect && q.floor === o.floor).map(q => q.rect), ...plan.windows.filter(w => w.floor === o.floor).map(w => w.rect)].some(q => x > q.x0 - 0.1 && x < q.x1 + 0.1 && y > q.y0 - 0.1 && y < q.y1 + 0.1);
    return pts.filter(p => !inOpening(p)).every(([x, y]) => solidAt(x, y, levelOf(o.floor) + 1) || console.log("  open beside:", o.id, o.joins.join("|"), x, y)); })],
  ["every window is open at its middle and solid under its sill", () => plan.windows.every(w => { const sp = [...specs.values()].find(s => s.room.floor === w.floor && Object.values(s.spec.walls).flat().some(e => e.kind === "window" && Math.abs((e.r1 - e.r0) - ((w.rect.x1 - w.rect.x0) > (w.rect.y1 - w.rect.y0) ? w.rect.x1 - w.rect.x0 : w.rect.y1 - w.rect.y0)) < 0.02));
    const e = sp && Object.values(sp.spec.walls).flat().find(q => q.kind === "window"), x = (w.rect.x0 + w.rect.x1) / 2, y = (w.rect.y0 + w.rect.y1) / 2, Y = levelOf(w.floor);
    return !e || (!solidAt(x, y, Y + (e.sill + e.top) / 2) && solidAt(x, y, Y + e.sill / 2)) || console.log("  window:", w.floor, x, y); })],
];
let bad = 0; for (const [what, f] of tests) { const ok = f(); if (!ok) bad++; console.log(ok ? "ok  " : "FAIL", what); }
const verts = got.bands.reduce((n, b) => n + b.paths.reduce((m, r) => m + r.length, 0), 0);
console.log(`${got.bands.length} bands, ${verts} vertices, ${ms.toFixed(1)} ms`);
const pc = planChecks({ plan, specs, carved: got }), by = {}; for (const f of pc.findings) (by[f.rule] ||= []).push(f);
console.log(pc.ok ? "plan checks: sound" : `plan checks: ${pc.findings.length} findings`, `(${pc.ms} ms)`);
for (const [rule, fs] of Object.entries(by)) { console.log(`  ${rule} (${fs.length})`); for (const f of fs.slice(0, 10)) console.log(`    ${f.where}: ${f.what}`); }
process.exit(bad || !pc.ok ? 1 : 0);
