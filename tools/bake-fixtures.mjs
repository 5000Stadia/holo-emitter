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
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

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
