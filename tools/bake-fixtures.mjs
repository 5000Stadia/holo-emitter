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
import { validate, resolvePlanPath, metaForFacing as resolveFacingMeta } from "./validate-fixtures.mjs";
import { validatePlan, planWarnings } from "./validate-plan.mjs";
import {
  stagingDivergence, assertCameraConsistent, assertRuledEye, assertRuledLens,
  metaForFacing
} from "./plan-projection.mjs";

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
/* Derived, not authored: the §5 meta per facing, computed from plan.json
 * below. It rides fixture.js because the page cannot fetch, exactly like the
 * authored files, and it is in the fingerprint because a plan edit that moves
 * a room's geometry must move the bake. */
let metas = null;
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

// The plan is REQUIRED and it is read FIRST, before any other refusal: a
// missing plan.json must produce its own named refusal rather than surfacing
// as a validator finding about geometry that could not be resolved.
//
// [Row 21] A fixture may instead carry `plan.ref`, one line holding the
// repo-relative path of the plan it is projected from. The manor plan has ONE
// home, and the navigation fixture that walks the same manor must not carry a
// second copy of it to go stale; a pointer is the cheapest thing that keeps
// the fact in one place. Neither file is still a named refusal.
let plan;
{
  const planFile = resolvePlanPath(fixtureDir);
  if (!existsSync(planFile)) {
    console.error(`bake refused: no plan.json or plan.ref in ${fixtureDir} — the plan is the fixture's spatial source (blueprint §4b)`);
    process.exit(1);
  }
  try {
    plan = JSON.parse(readFileSync(planFile, "utf8"));
  } catch (e) {
    console.error(`bake refused: plan.json does not parse (${e.message})`);
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
// plan.json is deliberately NOT among the baked FILES — the page does not read
// the plan, so baking it would move fixture.js's bytes for nothing; what IS
// baked is the derived per-facing meta, below.
{
  let records;
  try {
    records = require("../src/placeholders.js").records;
  } catch (e) {
    console.error(`bake refused: cannot load records from src/placeholders.js (${e.message})`);
    process.exit(1);
  }
  const byEntity = {};
  for (const e of parsed.world.entities || []) if (records[e.sprite]) byEntity[e.id] = records[e.sprite];

  // The ruled eye height is blueprint §10's, whose authored home is
  // replicator/contract.json. The projection derives every meta from it, so a
  // drift between the two would silently re-camera the project.
  const lensProblems = assertRuledLens();
  for (const p of lensProblems) console.error(`bake refused: ${p}`);
  if (lensProblems.length) process.exit(1);
  const eyeProblems = assertRuledEye();
  if (eyeProblems.length) {
    eyeProblems.forEach((c) => console.error(`bake refused: camera — ${c}`));
    process.exit(1);
  }
  // And the unplanned-facing fallback meta must still satisfy §5's own horizon
  // device at that eye height: if it does not, the camera is not a camera and
  // every floor line derived beside it is nonsense.
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

  /* Row 11: the §5 meta of every facing the world names, derived from the
   * plan and baked beside the fixture. The page hands these to the renderer as
   * backdrop entries with no image, so the grid draws each room's real wall
   * instead of the 16 m one the fallback meta describes. `plan.json` itself
   * stays unbaked — the page does not read it, and baking it would move
   * fixture.js's bytes for nothing.
   *
   * Refused, not silently accepted: a facing whose derived meta takes the
   * WIDE camera. `design/plan-draft/projection.md` §5 carries two live
   * readings of Kabe's wide-view licence that disagree on ten facings, and
   * says the default stands "only because nothing consumes a derived meta
   * yet". This bake is something consuming them, so a wide facing cannot ship
   * until that reading is ruled. None of M0's eight is wide. */
  /* [Row 21] Tier 1 belongs in this map too. `metaForFacing` in
   * `tools/plan-projection.mjs` derives a facing's geometry FROM THE PLAN; the
   * resolution RULE — a measured `backdrops/<loc>/<facing>.meta.json` first,
   * the derived meta next, the unplanned-facing fallback last — has one home,
   * in the fixture validator, and the bake calls it rather than repeating two
   * of its three tiers. Before this the bake baked the derived meta for every
   * facing, so a promoted painting's own measured geometry reached the
   * validator and never reached the page: the picture would have been drawn
   * with numbers nobody measured. */
  metas = {};
  const metaFindings = [];
  for (const loc of parsed.world.locations || []) {
    for (const f of loc.facings || []) {
      const m = resolveFacingMeta(`${loc.id}/${f}`, metaFindings,
        { [`${loc.id}/${f}`]: metaForFacing(plan, loc.id, f) });
      /* ONE LENS is refused by `tools/validate-fixtures.mjs`'s
       * `meta.one_lens`, which the bake runs over exactly these metas before
       * it writes anything — so a second check here would be a mechanism no
       * case could measure on its own, which this project narrows rather than
       * widens. What the bake DOES own is the binding to blueprint §10's
       * [HUMAN] field: `assertRuledLens`, above, beside `assertRuledEye`. */
      metas[`${loc.id}/${f}`] = m;
    }
  }
  if (metaFindings.length) {
    metaFindings.forEach((f) => console.error(`bake refused: ${f}`));
    process.exit(1);
  }
}

function fnv1a32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}
const metasText = JSON.stringify(metas, null, 2);
const fp = fnv1a32(FILES.map((n) => texts[n]).concat([metasText]).join("\n"));

/* [Row 21] The page carries more than one baked world — the painted
 * navigation world it boots by default, and the furnished demo world §12.1
 * walks — so each bake registers itself under its own directory name and the
 * page chooses. `window.HOLO_FIXTURE` is NOT set here: it is set by
 * `index.html` to the fixture that was actually booted, so that name means one
 * thing (the world on screen) instead of "whichever script tag came last". */
const fixtureId = fixtureDir.replace(/\\/g, "/").replace(/\/+$/, "").split("/").pop();

const out = `// GENERATED FILE — DO NOT EDIT.
// The one truth lives in the sibling .json files (world.json, staging.json,
// narration.json, viewstate.json). Edit those, then regenerate this file:
//
//     node tools/bake-fixtures.mjs --fixture-dir ${"fixtures/" + fixtureId}
//
// This file exists only because file:// pages cannot fetch JSON (§12.7).
// A stale bake fails the test suite (bake-staleness test).
//
// \`metas\` is DERIVED, not authored: the §5 backdrop meta of every facing the
// world names, projected from this fixture's plan (its own plan.json, or the
// one its plan.ref points at) through
// tools/plan-projection.mjs (blueprint §4b). Its one home is the plan; edit
// the plan, re-bake. The page hands these to the renderer as backdrop entries
// carrying a meta and no image.
window.HOLO_FIXTURES = window.HOLO_FIXTURES || {};
window.HOLO_FIXTURES[${JSON.stringify(fixtureId)}] = {
  id: ${JSON.stringify(fixtureId)},
  fp: "${fp}",
  world: ${texts.world},
  staging: ${texts.staging},
  narration: ${texts.narration},
  viewstate: ${texts.viewstate},
  metas: ${metasText}
};
`;

writeFileSync(outFile, out);
console.log(`baked ${outFile} (fp ${fp})`);
