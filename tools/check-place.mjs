// Is the manor sound to walk into? Runs src/make/sound.js on the plan (no furniture: that needs a build;
// the page runs it with furniture). Usage: node tools/check-place.mjs [--plan path/to/hybrid-e.js]
import { soundness } from "../src/make/sound.js";
import { compileRoom } from "../lab/house/plan-compile.js";
import { GENTRY_SEAT_1660 } from "../src/make/programs/england-1660.js";
import { ROOM_TYPES_1660 } from "../src/make/rooms/england-1660.js";
const i = process.argv.indexOf("--plan"), mod = await import(i > 0 ? new URL(process.argv[i + 1], `file://${process.cwd()}/`).href : "../src/make/plans/hybrid-e.js");
const plan = mod.planHybridE(GENTRY_SEAT_1660, { hearths: Object.fromEntries(Object.entries(ROOM_TYPES_1660).map(([k, v]) => [k, v.hearth])) });
const t0 = performance.now(), r = soundness({ plan, compileRoom });
const by = {}; for (const f of r.findings) (by[f.rule] ||= []).push(f);
console.log(r.ok ? "sound" : `${r.findings.length} findings`, `(${Math.round(performance.now() - t0)} ms)`);
for (const [rule, fs] of Object.entries(by)) { console.log(`\n${rule} (${fs.length})`); for (const f of fs.slice(0, 12)) console.log(`  ${f.where}: ${f.what}`); if (fs.length > 12) console.log(`  … ${fs.length - 12} more`); }
process.exit(r.ok ? 0 : 1);
