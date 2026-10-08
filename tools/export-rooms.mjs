// The manor's rooms for the family (construct checks a deck's rooms against them): ids, names, floors, types, the doors and
// openings between rooms, the stairs between storeys. node tools/export-rooms.mjs [out]   (default lab/case/rooms-1660.json)
// Written from the same plan the page builds (src/make/plans/hybrid-e.js with the gentry seat's program), in node, no three.
import fs from "node:fs";
import { planHybridE } from "../src/make/plans/hybrid-e.js";
import { GENTRY_SEAT_1660 } from "../src/make/programs/england-1660.js";
import { ROOM_TYPES_1660 } from "../src/make/rooms/england-1660.js";
const out = process.argv[2] || "lab/case/rooms-1660.json";
const hearths = Object.fromEntries(Object.entries(ROOM_TYPES_1660).map(([n, v]) => [n, v.hearth]));
const plan = planHybridE(GENTRY_SEAT_1660, { hearths });
const doc = { _what: "the manor's rooms as the page builds them (tools/export-rooms.mjs): for checking a case or a deck against the whole house",
  plan: "src/make/plans/hybrid-e.js (GENTRY_SEAT_1660)", entrance: plan.entrance,
  floors: (plan.floors || []).map(f => ({ id: f.id, z: f.z ?? f.level ?? null })),
  rooms: plan.rooms.map(r => ({ id: r.id, name: r.name, floor: r.floor, type: r.room_type, open: r.type === "open" || undefined })),
  doors: (plan.openings || []).filter(o => o.joins?.length === 2).map(o => ({ id: o.id, joins: o.joins, kind: o.kind || o.type || "opening" })),
  stairs: (plan.stairs || []).filter(s => s.joins?.length === 2).map(s => ({ id: s.id, stair: s.stair, joins: s.joins, floors: [s.from, s.to], kind: s.kind })) };
fs.writeFileSync(out, JSON.stringify(doc, null, 1) + "\n");
console.log(`${out}: ${doc.rooms.length} rooms, ${doc.doors.length} doors, ${doc.stairs.length} stairs`);
