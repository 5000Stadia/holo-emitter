#!/usr/bin/env node
/* [Kabe, 2026-08-30] ONE-SHOT: write `depth_m` into every promoted meta's
 * openings from the active pack's plan — the same value `promote-backdrop`
 * writes from this commit on (`openingDepthM`), so a wall promoted before the
 * field existed carries the same fact as one promoted after. Idempotent; a
 * second run changes nothing. Usage: node tools/backfill-opening-depth.mjs --pack manor */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { activePack } from "./pack.mjs";
import { openingDepthM } from "./plan-projection.mjs";
const pack = activePack();
const plan = pack.plan;
const root = pack.paths.root || process.cwd();
let walls = 0, written = 0;
for (const room of plan.rooms || []) {
  for (const F of ["N", "E", "S", "W"]) {
    const f = join(root, "backdrops", room.id, F + ".meta.json");
    if (!existsSync(f)) continue;
    walls++;
    const text = readFileSync(f, "utf8");
    const meta = JSON.parse(text);
    let changed = false;
    for (const o of meta.openings || []) {
      const d = openingDepthM(plan, o.id);
      if (d != null && o.depth_m !== d) { o.depth_m = d; changed = true; }
    }
    if (changed) { writeFileSync(f, JSON.stringify(meta, null, 2) + "\n"); written++; }
  }
}
console.log(`${pack.name}: ${walls} promoted walls read, ${written} written with depth_m`);
