// Checks a room compiled from the period brief (lab/brief/brief.js): prints the pin report and the
// checks that must always hold. Usage: node tools/brief-check.mjs [roomId]
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { compileBrief } from "../lab/brief/brief.js";

const plan = JSON.parse(readFileSync(new URL("../lab/house/plan.json", import.meta.url)));
const brief = JSON.parse(readFileSync(new URL("../lab/brief/manor-1660.json", import.meta.url)));
const id = process.argv[2] || "muniment_room";
const out = compileBrief(plan, id, brief);
for (const r of out.report) console.log(`${r.status.padEnd(9)} ${r.pin.padEnd(14)} ${r.text}`);

const fails = [];
// nothing stands in an opening: floor items keep clear of every door and, if taller than the sill, of every window
const items = ["desk", "chest", "press"];
for (const [F, es] of Object.entries(out.walls)) {
  const span = (e) => e.kind === "press" ? [e.r0, e.r1] : [e.r - (e.width ?? e.w) / 2, e.r + (e.width ?? e.w) / 2];
  const tall = (e) => e.kind === "press" ? e.height : e.kind === "chest" ? e.h : 0.79;
  const L = F === "N" || F === "S" ? out.room.W : out.room.D;
  for (const e of es.filter(e => items.includes(e.kind))) {
    const [a, b] = span(e);
    if (a < -1e-6 || b > L + 1e-6) fails.push(`${e.id} runs off the ${F} wall (${a.toFixed(2)}–${b.toFixed(2)} of ${L})`);
    for (const o of es.filter(o => o.kind === "door" || (o.kind === "window" && tall(e) > o.sill)))
      if (a < o.r1 && b > o.r0) fails.push(`${e.id} stands in ${o.id} on ${F}`);
    for (const o of es.filter(o => o !== e && items.includes(o.kind))) { const [c, d] = span(o); if (a < d - 1e-6 && b > c + 1e-6) fails.push(`${e.id} overlaps ${o.id} on ${F}`); }
  }
}
// the same plan and brief always compile to the same room
const h = (o) => createHash("sha256").update(JSON.stringify({ ...o, ms: 0 })).digest("hex").slice(0, 16);
if (h(out) !== h(compileBrief(plan, id, brief))) fails.push("two compiles of the same brief differ");
// every must-pin is reported
for (const p of brief.rooms[id].pins) if (!out.report.some(r => r.pin === p.id)) fails.push(`pin ${p.id} not reported`);
console.log(`\ncompiled in ${out.ms} ms · hash ${h(out)} · ${fails.length ? "FAIL" : "all checks hold"}`);
for (const f of fails) console.log("  ✗ " + f);
process.exit(fails.length ? 1 : 0);
