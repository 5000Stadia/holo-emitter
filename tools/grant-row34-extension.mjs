#!/usr/bin/env node
/**
 * Row 34's one-ask cap extension — the recommended recipe's first production test.
 *
 *     node tools/grant-row34-extension.mjs --dry-run
 *     node tools/grant-row34-extension.mjs
 *
 * WHY A CAP EXISTS AT ALL, and why this may extend it exactly once. The retry
 * cap is what stops a wall eating the run: three asks and the wall parks, so a
 * facing the generator cannot paint costs a bounded number of rolls instead of
 * an unbounded one. Every `unfitted-horizon` hold has spent four attempts
 * against a cap of three and is parked on the old recipe.
 *
 * What justifies re-opening them is not hope, it is the row's own arithmetic:
 * at the measured admissible rate of 0.75 the verify-and-retry loop clears 95 %
 * of a hold family in three asks (`row34_fitness.retries_needed`). These walls
 * have never been asked under the recommended recipe even once, so their spent
 * budget was spent on a different question. ONE ask each answers whether the
 * fold moves them; a second would be tuning, and this tool cannot grant it.
 *
 * ONCE-ONLY, AND AUDITABLE. A wall that already carries `row34_cap_extension` is
 * refused by name. The grant records who granted it, why, what the budget was
 * before, and the recipe commit it is testing — so a later reader can tell a
 * measured second coat from a quiet third one.
 *
 * WHAT IT WILL NOT TOUCH:
 *   * anything that is not an `unfitted-horizon` hold. `suspect-painting` walls
 *     are a fact about a picture and belong on Kabe's look surface;
 *     `promotion-refused` is a plan disagreement and no repaint fixes it.
 *   * `standpoint-out-of-frame`. Those two walls put the declared anchor's datum
 *     BELOW the picture — the standpoint does it, not the painting — so no
 *     recipe reaches them and an ask spent there is a roll spent to learn
 *     nothing.
 *   * a wall that has since been promoted.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const STATE = join(ROOT, "design", "batches", "row23-scaffold", "manor", "run-state.json");

export const EXTENSION_KEY = "row34_cap_extension";
export const ELIGIBLE_FAMILY = "unfitted-horizon";
export const EXTRA_ASKS = 1;

export const WHY =
  "Row 34's recommended register (the finished picture in image-frame terms, with the " +
  "coordinates attached) is folded into manorPrompt. These walls spent their budget on the " +
  "recipe it replaces and have never been asked under this one. At the row's measured 0.75 " +
  "admissible rate the retry loop clears 95 % of a hold family in three asks, so ONE ask each " +
  "is what tests the fold; a second would be tuning. AWAITING KABE - the recipe proceeds under " +
  "the standing no-wait directive with his review asynchronous.";

/** Which walls the grant may touch, and the reason for every wall it may not. */
export function eligible(state) {
  const take = [], skip = [];
  for (const [key, w] of Object.entries(state.walls || {})) {
    if (w[EXTENSION_KEY]) {
      skip.push({ key, why: "already carries a row-34 extension; this grant is once-only" });
      continue;
    }
    if (w.status === "promoted") { skip.push({ key, why: "promoted since the hold" }); continue; }
    if (w.hold_family !== ELIGIBLE_FAMILY) {
      skip.push({ key, why: `hold family is ${w.hold_family || w.status}, not ${ELIGIBLE_FAMILY}` });
      continue;
    }
    if (!w.correction) {
      skip.push({ key, why: "no correction on record, and a re-ask with nothing to correct is the same ask" });
      continue;
    }
    take.push({ key, attempts: w.attempts || 0 });
  }
  take.sort((a, b) => a.key.localeCompare(b.key));
  return { take, skip };
}

function head() {
  try {
    return execFileSync("git", ["-C", ROOT, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  } catch { return null; }
}

export function grant(state, { dryRun = false, at = new Date().toISOString() } = {}) {
  const { take, skip } = eligible(state);
  for (const t of take) {
    if (dryRun) continue;
    const w = state.walls[t.key];
    w[EXTENSION_KEY] = {
      granted: EXTRA_ASKS,
      why: WHY,
      at,
      prior_attempts: w.attempts || 0,
      prior_status: w.status,
      hold_family: w.hold_family,
      recipe_commit: head(),
      _once_only: "A wall carrying this key is refused by the grant tool. A second extension is " +
        "not this tool's to give: it would be tuning a recipe rather than testing it.",
      _label: "row-34 recipe's first production test"
    };
    /* The status is what the standing retry emitter reads. Moving it to `retry`
     * is the whole mechanical effect of the grant — everything else here is the
     * audit trail that makes the move legible afterwards. */
    w.status = "retry";
    w.why = "row-34 cap extension: first ask under the recommended recipe";
  }
  return { take, skip };
}

function main() {
  const dryRun = process.argv.includes("--dry-run");
  if (!existsSync(STATE)) {
    console.error(`refused: ${STATE.slice(ROOT.length + 1)} does not exist`);
    process.exit(1);
  }
  const state = JSON.parse(readFileSync(STATE, "utf8"));
  const { take, skip } = grant(state, { dryRun });
  for (const t of take) {
    console.log(`  GRANT  ${t.key.padEnd(24)} attempts ${t.attempts} -> +${EXTRA_ASKS} ask`);
  }
  const byWhy = {};
  for (const s of skip) byWhy[s.why] = (byWhy[s.why] || 0) + 1;
  for (const [why, n] of Object.entries(byWhy).sort()) {
    console.log(`  skip   ${String(n).padStart(3)} wall(s): ${why}`);
  }
  console.log(`\n${take.length} wall(s) granted one further ask` +
    (dryRun ? " (DRY RUN - nothing written)" : ""));
  if (!dryRun) {
    writeFileSync(STATE, JSON.stringify(state, null, 2) + "\n");
    console.log(`  written  ${STATE.slice(ROOT.length + 1)}`);
    console.log("  next     node tools/make-scaffold.mjs --emit-retries " +
      "--out design/batches/row23-scaffold/manor --retries 5 --rolls 1");
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
