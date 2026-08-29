/* proof-pack.mjs — row 44's byte-identity instrument.
 *
 * WHAT IT PROVES. Step 0 moved the manor out of the engine and into
 * `packs/manor/`. The only acceptable evidence that a MOVE is a move and not a
 * rewrite is that the same inputs produce the same bytes, so this walks every
 * facing the active pack's plan holds, derives its camera deterministically
 * (`plan-projection.mjs`'s `deriveMeta` — no browser, no model), composes the
 * production ask through `manorPrompt`, and writes one file per facing.
 *
 * Run it on the code before the move and after it and diff the two trees: an
 * identical tree is the proof. It is deterministic by construction (clause 7),
 * which is why it can be an instrument rather than a look.
 *
 *   node tools/proof-pack.mjs --pack manor --out <dir>
 *
 * It also reports what the pack REFUSES, which is the other half of row 44:
 * a room with no voice, and a world with no ruler.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { activePack, activePackName } from "./pack.mjs";
import { deriveMeta } from "./plan-projection.mjs";
import { manorPrompt, scaffoldRects, manorFacings } from "./make-scaffold.mjs";

const argv = process.argv.slice(2);
const argOf = (f, d) => { const i = argv.indexOf(f); return i !== -1 ? argv[i + 1] : d; };
const out = resolve(argOf("--out", "/tmp/proof-pack"));
const pack = activePack();

mkdirSync(out, { recursive: true });
let n = 0;
const banned = (argOf("--forbid", "") || "").split(",").map((w) => w.trim()).filter(Boolean);
const offences = [];

for (const fac of manorFacings(pack.plan)) {
  const [loc, facing] = fac.key.split("/");
  const meta = deriveMeta(pack.plan, loc, facing);
  const { rects } = scaffoldRects(pack.plan, loc, facing, meta);
  const text = manorPrompt(pack.plan, fac.key, meta, rects, null, null, {});
  writeFileSync(join(out, `${loc}-${facing}.txt`), text);
  for (const w of banned) {
    if (new RegExp(w.replace(/\s+/g, "\\s+"), "i").test(text)) offences.push(`${fac.key}: "${w}"`);
  }
  n++;
}

console.log(`proof-pack: pack \`${activePackName()}\`, ${n} facings written to ${out}`);
console.log(`  ruler ${pack.ruler.kind} at ${pack.ruler.height_m} m above the ${pack.ruler.datum || "floor"}`);
console.log(`  era   ${pack.world.era}`);
if (banned.length) {
  if (offences.length) {
    console.error(`  FORBIDDEN WORDS FOUND (${offences.length}):`);
    for (const o of offences.slice(0, 20)) console.error(`    ${o}`);
    process.exit(1);
  }
  console.log(`  none of ${banned.length} forbidden word(s) appears in any of the ${n} asks`);
}
