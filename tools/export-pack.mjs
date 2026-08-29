/* export-pack.mjs — the one-off that turned the manor from code into data.
 *
 * Row 44 step 0. `room-voices.mjs` DECLARED the manor's voice table, its
 * anchors, its MATERIALS and its SAID_BEFORE registry as JavaScript literals;
 * clause 8 says that data belongs in a pack. This script reads whatever
 * `room-voices.mjs` currently exports and writes `packs/<name>/voices.json`,
 * then deep-compares the JSON round-trip against the live objects so the move
 * is provably lossless rather than eyeballed.
 *
 * It is kept, not deleted, for two reasons: it is the record of how the pack
 * was derived, and once `room-voices.mjs` loads FROM the pack it becomes a
 * round-trip check — re-running it must leave `voices.json` byte-identical.
 *
 *   node tools/export-pack.mjs --pack manor
 */

import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as RV from "./room-voices.mjs";
import { activePackName, PACKS_DIR } from "./pack.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const name = activePackName();
const dir = join(PACKS_DIR, name);

const voices = {
  _what_this_is:
    "The material voice of every room in this location, in this location's own language. " +
    "Exported from tools/room-voices.mjs by tools/export-pack.mjs for row 44 step 0; the " +
    "engine now LOADS this rather than declaring it. Every `why` is the period justification " +
    "the voice was authored with — a material table with no justification is a preference.",
  ANCHOR_M: RV.ANCHOR_M,
  WINDOW_SILL_M: RV.WINDOW_SILL_M,
  WINDOW_HEAD_M: RV.WINDOW_HEAD_M,
  LIGHT_MODULE_M: RV.LIGHT_MODULE_M,
  OPEN_FACING_VOICE: "outdoors_open",
  VOICES: RV.VOICES,
  ANCHORS: RV.ANCHORS,
  ROOM_VOICE: RV.ROOM_VOICE,
  ARCHETYPE_FALLBACK: RV.ARCHETYPE_FALLBACK,
  TYPE_FALLBACK: RV.TYPE_FALLBACK,
  MATERIALS: RV.MATERIALS,
  MATERIAL_BINDING: RV.MATERIAL_BINDING,
  MATERIAL_PART_OF_KEY: RV.MATERIAL_PART_OF_KEY,
  SAID_BEFORE: RV.SAID_BEFORE
};

const json = JSON.stringify(voices, null, 2) + "\n";

/* LOSSLESS OR NOTHING. A voice table that loses a key in transit is a wall
 * asked for the wrong fabric, so the round trip is compared, not trusted. */
const back = JSON.parse(json);
const problems = [];
function cmp(path, a, b) {
  if (a === b) return;
  if (typeof a === "function") { problems.push(`${path}: a function cannot be pack data`); return; }
  if (a instanceof RegExp) { problems.push(`${path}: a RegExp cannot be pack data — put its source in world.json`); return; }
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") {
    problems.push(`${path}: ${JSON.stringify(a)} !== ${JSON.stringify(b)}`);
    return;
  }
  const ka = Object.keys(a), kb = Object.keys(b);
  for (const k of ka) if (!kb.includes(k)) problems.push(`${path}.${k}: lost in the round trip`);
  for (const k of kb) if (!ka.includes(k)) problems.push(`${path}.${k}: invented by the round trip`);
  for (const k of ka) if (kb.includes(k)) cmp(`${path}.${k}`, a[k], b[k]);
}
for (const k of Object.keys(voices)) cmp(k, voices[k], back[k]);
if (problems.length) {
  console.error(`export-pack: ${problems.length} difference(s) between the live table and its JSON:`);
  for (const p of problems.slice(0, 20)) console.error(`  ${p}`);
  process.exit(1);
}

const out = join(dir, "voices.json");
const before = existsSync(out) ? readFileSync(out, "utf8") : null;
writeFileSync(out, json);
const voiceCount = Object.keys(RV.VOICES).length;
const anchorCount = Object.keys(RV.ANCHORS).length;
const matCount = Object.keys(RV.MATERIALS).length;
console.log(`export-pack: wrote ${out}`);
console.log(`  ${voiceCount} voices, ${anchorCount} anchors, ${matCount} materials, ` +
  `${Object.keys(RV.SAID_BEFORE).length} retired wordings; round trip lossless`);
if (before !== null) {
  console.log(before === json
    ? "  unchanged — the pack and the loader agree"
    : "  CHANGED — the exporter and the committed pack disagree");
}
