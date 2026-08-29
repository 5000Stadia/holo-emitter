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

import { writeFileSync, mkdirSync, rmSync, cpSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { activePack, activePackName, loadPack, PACKS_DIR, _resetPackCache } from "./pack.mjs";
import { deriveMeta } from "./plan-projection.mjs";
import { manorPrompt, scaffoldRects, manorFacings } from "./make-scaffold.mjs";

const argv = process.argv.slice(2);
const argOf = (f, d) => { const i = argv.indexOf(f); return i !== -1 ? argv[i + 1] : d; };
const out = resolve(argOf("--out", "/tmp/proof-pack"));
const pack = activePack();
const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");

/* THE RULER REFUSAL, PROVED RATHER THAN ASSERTED. `--prove-refusals` copies the
 * active pack beside itself, deletes `ruler` from the copy's world.json, and
 * requires BOTH loaders -- `tools/pack.mjs` and
 * `design/plan-draft/measured/pack.py` -- to refuse it BY NAME. Two loaders read
 * the same JSON, and a refusal only one of them makes is a hole an instrument
 * would fall through; production law clause 11: a rule only a reader can
 * execute is not a rule. */
if (argv.includes("--prove-refusals")) {
  const scratch = join(PACKS_DIR, ".refusal-probe");
  rmSync(scratch, { recursive: true, force: true });
  cpSync(pack.dir, scratch, { recursive: true });
  const wp = join(scratch, pack.files.world);
  const w = JSON.parse(readFileSync(wp, "utf8"));
  delete w.ruler;
  writeFileSync(wp, JSON.stringify(w, null, 2));
  let jsMsg = null, pyMsg = null, code = 0;
  try {
    _resetPackCache();
    loadPack(".refusal-probe");
  } catch (e) { jsMsg = e.message; }
  try {
    execFileSync("python3", [join(REPO, "design/plan-draft/measured/pack.py"),
      "--pack", ".refusal-probe"], { encoding: "utf8" });
  } catch (e) { pyMsg = String(e.stdout || e.message).trim(); }
  rmSync(scratch, { recursive: true, force: true });
  _resetPackCache();
  const ok = (m) => !!m && /no `ruler`/i.test(m) && m.includes(".refusal-probe");
  console.log(`prove-refusals: \`${pack.name}\` copied with its ruler deleted`);
  console.log(`  tools/pack.mjs   ${ok(jsMsg) ? "REFUSED" : "DID NOT REFUSE"} — ${jsMsg ? jsMsg.slice(0, 150) : "(it loaded)"}`);
  console.log(`  measured/pack.py ${ok(pyMsg) ? "REFUSED" : "DID NOT REFUSE"} — ${pyMsg ? pyMsg.slice(0, 150) : "(it loaded)"}`);
  if (!ok(jsMsg) || !ok(pyMsg)) {
    console.error("  a pack with no ruler must be refused BY NAME by both loaders, before an image can exist");
    code = 1;
  }
  process.exit(code);
}

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
