// Planted faults in the plan (R54 step 5d): break a sound house in one way at a time and see whether the carve's
// plan checks (src/make/plan-checks.js) or src/make/sound.js catch it. Each fault is one the person found, or
// its cause. Usage: node tools/plant-plan-faults.mjs
import { readFileSync } from "node:fs";
import { carve } from "../src/make/carve.js";
import { planChecks } from "../src/make/plan-checks.js";
import { soundness } from "../src/make/sound.js";
import { compileRoom } from "../lab/house/plan-compile.js";
import { houseSpecs, storeys } from "../src/make/house-spec.js";
import { GENTRY_SEAT_1660 } from "../src/make/programs/england-1660.js";
import { ROOM_TYPES_1660 } from "../src/make/rooms/england-1660.js";
import { planHybridE } from "../src/make/plans/hybrid-e.js";
const hearths = Object.fromEntries(Object.entries(ROOM_TYPES_1660).map(([k, v]) => [k, v.hearth]));
const brief = JSON.parse(readFileSync(new URL("../lab/brief/manor-1660.json", import.meta.url)));
const fresh = () => planHybridE(GENTRY_SEAT_1660, { hearths });
const R = (plan, id) => plan.rooms.find(r => r.id === id);
const run = (plan, tweak = null) => { const { levelOf, gap } = storeys(plan), specs = houseSpecs(plan, { types: ROOM_TYPES_1660, brief, gap });
  if (tweak) tweak(specs); const carved = carve({ plan, specs, levelOf, gap });
  const pc = planChecks({ plan, specs, carved }), sd = soundness({ plan, compileRoom });
  return { plan: pc.findings.map(f => f.rule), sound: sd.findings.map(f => f.rule) }; };
const FAULTS = [
  ["a partition thinner than a wall (the little parlour pushed 0.2 m into its partition with the great parlour)", (p) => { R(p, "little_parlour").rect.y1 += 0.2; }],
  ["two rooms overlapping (the buttery run into the kitchen passage)", (p) => { R(p, "buttery").rect.y1 += 0.6; }],
  ["a doorway off the wall the two rooms share (moved a metre into the hall)", (p) => { const o = p.openings.find(q => q.joins.includes("great_hall") && q.joins.includes("screens_passage")); o.rect.x0 += 1; o.rect.x1 += 1; }],
  ["a doorway joining the wrong room (the parlour's door said to open to the study)", (p) => { const o = p.openings.find(q => q.joins.includes("great_parlour") && q.joins.includes("little_parlour")); o.joins = ["great_parlour", "study"]; }],
  ["a window on an inside wall (the hall's partition with the passage)", (p) => { const h = R(p, "great_hall").rect; p.windows.push({ floor: "ground", rect: { x0: h.x0 - 0.3, x1: h.x0, y0: 3, y1: 4.4 } }); }],
  ["a fire cut through the wall behind it (the hall's firebox 1.3 m deep, in a 0.48 m breast and a 0.75 m wall)", null, (specs) => { for (const e of Object.values(specs.get("great_hall").spec.walls).flat()) if (e.kind === "chimneypiece") e.firebox.depth = 1.3; }],
  ["a window and a doorway in one opening (a window laid over the porch's door)", (p) => { const o = p.openings.find(q => q.joins.includes("porch") && q.joins.includes("forecourt")); p.windows.push({ floor: "ground", rect: { ...o.rect } }); }],
  ["a stair turning with no landing (the great stair's half-landings taken out)", (p) => { p.stairs = p.stairs.filter(q => !(q.kind === "landing" && q.well?.startsWith?.("great"))); }],
];
const base = run(fresh());
console.log(`sound house: plan checks ${base.plan.length ? base.plan.join(",") : "clean"}; sound.js ${base.sound.length ? base.sound.length + " findings" : "clean"}`);
let caught = 0;
for (const [what, mut, tweak] of FAULTS) { const p = fresh(); if (mut) mut(p); const r = run(p, tweak);
  const newPlan = r.plan.length - base.plan.length, newSound = r.sound.length - base.sound.length, hit = newPlan > 0 || newSound > 0; if (hit) caught++;
  console.log(`${hit ? "caught " : "MISSED "} ${what}: ${[...new Set(r.plan)].join(",") || "-"} | sound.js +${newSound}`); }
console.log(`${caught}/${FAULTS.length} caught`);
