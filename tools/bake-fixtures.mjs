#!/usr/bin/env node
/* bake-fixtures.mjs — embed the fixture JSON files into a classic script.
 *
 * Chromium blocks fetch/XHR and ES-module loading for file:// pages, so the
 * fixtures cannot be fetched at runtime. This bake embeds each .json file's
 * raw text verbatim as a JS expression (JSON text is valid JS expression
 * syntax), assigning window.HOLO_FIXTURE. The .json files stay the sole
 * truth; edit them, then re-run this bake.
 *
 * The bake is byte-deterministic: a pure function of the JSON texts. The
 * embedded fingerprint (FNV-1a 32 over the concatenated texts) is shown by
 * the page's chrome status line, so an edit that took effect visibly moves
 * the fingerprint.
 *
 * Usage: node tools/bake-fixtures.mjs [--fixture-dir DIR] [--out FILE]
 * Defaults: fixtures/demo-study -> fixtures/demo-study/fixture.js
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { validate } from "./validate-fixtures.mjs";
import { validatePlan, planWarnings } from "./validate-plan.mjs";
import { stagingDivergence, assertCameraConsistent } from "./plan-projection.mjs";

const require = createRequire(import.meta.url);

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
function argOf(flag, dflt) {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : dflt;
}
const fixtureDir = argOf("--fixture-dir", join(root, "fixtures", "demo-study"));
const outFile = argOf("--out", join(fixtureDir, "fixture.js"));

const FILES = ["world", "staging", "narration", "viewstate"];
const texts = {};
const parsed = {};
for (const name of FILES) {
  const raw = readFileSync(join(fixtureDir, name + ".json"), "utf8");
  parsed[name] = JSON.parse(raw); // refuse to bake malformed truth
  texts[name] = raw.trim();
}

// Refuse to bake a boot viewstate the world cannot honour — a typo'd
// location or facing would otherwise boot a normal-looking grid whose every
// input is silently refused.
{
  const vs = parsed.viewstate;
  const loc = (parsed.world.locations || []).find((l) => l.id === vs.location);
  if (!loc || !(loc.facings || []).includes(vs.facing)) {
    console.error(
      `bake refused: viewstate ${JSON.stringify(vs)} names no location/facing in world.json`
    );
    process.exit(1);
  }
}

// Refuse to bake an invalid fixture (row 2, plan §6's enforcement locus):
// the validator gates the bake, so a hand-edited fixture cannot ship
// between suite runs.
{
  let records;
  try {
    records = require("../src/placeholders.js").records;
  } catch (e) {
    console.error(`bake refused: cannot load records from src/placeholders.js (${e.message})`);
    process.exit(1);
  }
  const findings = validate(fixtureDir, records);
  if (findings.length > 0) {
    findings.forEach((f, i) => console.error(`${i + 1}. ${f}`));
    console.error(`bake refused: ${findings.length} validator finding(s)`);
    process.exit(1);
  }
}

// Refuse to bake a fixture whose spatial source does not hold up (row 12).
// The plan is REQUIRED, not optional: a deleted or mis-pathed plan.json would
// otherwise make the bake green and silent, and the bake is this project's
// enforcement locus precisely so a fixture cannot ship unchecked. plan.json is
// deliberately NOT among the baked FILES — the page does not read the plan, so
// baking it would move fixture.js's bytes and its fingerprint for nothing.
{
  const planFile = join(fixtureDir, "plan.json");
  if (!existsSync(planFile)) {
    console.error(`bake refused: no plan.json in ${fixtureDir} — the plan is the fixture's spatial source (blueprint §4b)`);
    process.exit(1);
  }
  let plan;
  try {
    plan = JSON.parse(readFileSync(planFile, "utf8"));
  } catch (e) {
    console.error(`bake refused: plan.json does not parse (${e.message})`);
    process.exit(1);
  }
  let records;
  try {
    records = require("../src/placeholders.js").records;
  } catch (e) {
    console.error(`bake refused: cannot load records from src/placeholders.js (${e.message})`);
    process.exit(1);
  }
  const byEntity = {};
  for (const e of parsed.world.entities || []) if (records[e.sprite]) byEntity[e.id] = records[e.sprite];

  // The projection reads its camera out of grid-canonical meta; if that meta
  // stops satisfying §5's own horizon device, the camera is not a camera and
  // every derived floor line is nonsense.
  const cameraProblems = assertCameraConsistent();
  if (cameraProblems.length) {
    cameraProblems.forEach((c) => console.error(`bake refused: camera — ${c}`));
    process.exit(1);
  }
  const planFindings = validatePlan(plan, parsed.world, byEntity);
  if (planFindings.length > 0) {
    planFindings.forEach((f, i) => console.error(`${i + 1}. ${f}`));
    console.error(`bake refused: ${planFindings.length} plan finding(s)`);
    process.exit(1);
  }
  // Blueprint §4b: the validator asserts staging ≡ plan projection. One
  // divergence is named in tools/plan-projection.mjs with its reason; a new
  // one, or the disappearance of a named one, refuses the bake.
  const div = stagingDivergence(plan, parsed.staging);
  for (const u of div.unplanned) console.error(`plan warning: staged "${u.id}" on ${u.facing} is not judged — ${u.why}`);
  for (const r of div.unexpected) {
    console.error(`bake refused: staging ≠ plan projection — ${r.id} @ ${r.facing}: staging u ${r.shipped_u}, plan projects ${r.projected_u}`);
  }
  for (const k of div.missing) {
    console.error(`bake refused: ${k.id} @ ${k.facing} is listed as a known staging divergence but now agrees — delete the entry in tools/plan-projection.mjs`);
  }
  if (div.unexpected.length || div.missing.length) process.exit(1);
  for (const w of planWarnings(plan, byEntity, parsed.world)) console.error(`plan warning: ${w}`);
}

function fnv1a32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}
const fp = fnv1a32(FILES.map((n) => texts[n]).join("\n"));

const out = `// GENERATED FILE — DO NOT EDIT.
// The one truth lives in the sibling .json files (world.json, staging.json,
// narration.json, viewstate.json). Edit those, then regenerate this file:
//
//     node tools/bake-fixtures.mjs
//
// This file exists only because file:// pages cannot fetch JSON (§12.7).
// A stale bake fails the test suite (bake-staleness test).
window.HOLO_FIXTURE = {
  fp: "${fp}",
  world: ${texts.world},
  staging: ${texts.staging},
  narration: ${texts.narration},
  viewstate: ${texts.viewstate}
};
`;

writeFileSync(outFile, out);
console.log(`baked ${outFile} (fp ${fp})`);
