#!/usr/bin/env node
/* derive-world.mjs — the fixture world DERIVED from a pack's plan. [row 44]
 *
 * The audit named it: `world.json` re-stated the plan's topology by hand — 56
 * exits, 28 door ids each typed twice. A location that is a pack cannot ask a
 * human to retype its own plan, so the page's fixture is a projection of the
 * plan: locations from rooms, exits from openings (a door on a room's side is
 * an exit on that facing; travel continues in the same direction), an empty
 * staging, the entrance as the viewstate, and a narration line for every key
 * the harness enumerates — template prose, which is the interpretive part
 * (clause 7) and the one thing here a model may later be asked to rewrite.
 *
 *   node tools/derive-world.mjs --pack <name>      writes <pack.paths.fixture_dir>/
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { activePack } from "./pack.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const require_ = createRequire(import.meta.url);
const harness = require_("../src/harness.js");
const P = activePack();
const plan = P.plan;
const EPS = 1e-6;
const FACINGS = ["N", "E", "S", "W"];

/* Which side of room `r` the opening `o` lies on, or null. */
function sideOf(r, o) {
  const R = r.rect, O = o.rect;
  const near = (a, b) => Math.abs(a - b) < EPS;
  if (o.axis === "EW") {
    if (near(O.x0, R.x1)) return "E";
    if (near(O.x1, R.x0)) return "W";
  } else {
    if (near(O.y0, R.y1)) return "N";
    if (near(O.y1, R.y0)) return "S";
  }
  return null;
}
const OPP = { N: "S", S: "N", E: "W", W: "E" };
const slug = (s) => s.replace(/[^a-z0-9]+/gi, "_").toLowerCase();
const nameOf = (id) => (plan.rooms.find((r) => r.id === id)?.name || id).toLowerCase();

const locations = plan.rooms.map((r) => ({ id: r.id, facings: FACINGS.filter((f) => r.facings && r.facings[f]), exits: [] }));
for (const o of plan.openings || []) {
  if (o.kind !== "door" && o.kind !== "open_edge") continue;
  const [a, b] = o.joins;
  for (const [from, to] of [[a, b], [b, a]]) {
    const room = plan.rooms.find((r) => r.id === from);
    const facing = sideOf(room, o);
    if (!facing) { console.error(`derive-world: opening ${o.id} does not lie on a side of ${from}`); process.exit(1); }
    const loc = locations.find((l) => l.id === from);
    loc.exits.push({ id: `${o.kind === "door" ? "door" : "way"}_${slug(from)}_${slug(to)}`, from, facing, to, arrive_facing: facing, via: o.id });
  }
}
const world = { schema: "holo-emitter/0.1", locations, entities: [], relations: [], knowledge: { player: [] } };
const staging = { schema: "holo-emitter-staging/0.1", placements: {} };
const viewstate = { location: plan.entrance || plan.rooms[0].id, facing: "N" };

/* Narration: one line per enumerated key, templated from the plan's own names. */
const domain = harness.enumerateNarrationDomain(world, staging);
const lines = {
  "toggle.*.refused_unknown": "Nothing here answers to that.",
  "take.*.refused_unknown": "There is nothing of the kind to take.",
  "go.*.refused_unknown": "No such way is to be found; the walls keep their counsel.",
  "turn.*.refused": "You cannot turn that way here.",
};
for (const key of domain) {
  const [intent, target, outcome] = key.split(".");
  if (lines[key] || target === "*") continue;
  const ex = locations.flatMap((l) => l.exits).find((e) => e.id === target);
  if (intent === "go" && ex) {
    if (outcome === "arrive") lines[key] = `You pass from the ${nameOf(ex.from)} into the ${nameOf(ex.to)}.`;
    /* [hospital-3 step 2b] PER-ENTITY PROSE: two doors into one room share a
       destination, so the line names the door's own side too. */
    else if (outcome === "refused_unreachable") lines[key] = `The way from the ${nameOf(ex.from)} to the ${nameOf(ex.to)} is not before you from here.`;
    else lines[key] = `The way from the ${nameOf(ex.from)} to the ${nameOf(ex.to)} does not answer.`;
  } else {
    lines[key] = `Nothing comes of it.`;
  }
}
const narration = { schema: "holo-emitter-narration/0.1", lines };

const dir = P.paths.fixture_dir;
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, "world.json"), JSON.stringify(world, null, 2) + "\n");
writeFileSync(join(dir, "staging.json"), JSON.stringify(staging, null, 2) + "\n");
writeFileSync(join(dir, "viewstate.json"), JSON.stringify(viewstate, null, 2) + "\n");
writeFileSync(join(dir, "narration.json"), JSON.stringify(narration, null, 2) + "\n");
writeFileSync(join(dir, "plan.ref"), relative(ROOT, P.paths.plan) + "\n");
writeFileSync(join(dir, "pack.ref"), P.name + "\n");   // the pack this fixture is a projection of
console.log(`derive-world: ${P.name} -> ${relative(ROOT, dir)}: ${locations.length} location(s), ${locations.reduce((n, l) => n + l.exits.length, 0)} exit(s), ${Object.keys(lines).length} narration line(s)`);
