#!/usr/bin/env node
/**
 * The content-gap re-ask — a wall asked again because the ASK was incomplete.
 *
 *     node tools/grant-content-gap.mjs --dry-run
 *     node tools/grant-content-gap.mjs
 *     node tools/grant-content-gap.mjs --reason flight_never_named
 *
 * WHAT MAKES THIS DIFFERENT FROM A RETRY. An ordinary re-ask says "you painted
 * this wrong, here is the measurement". A content-gap re-ask says something a
 * retry cap was never meant to charge for: WE NEVER ASKED FOR IT. Six manor
 * walls were refused promotion by the row-32 clause — "the plan draws 1
 * flight(s) in this view and a promoted meta carries none" — and every one of
 * them was painted from a prompt in which the word `stair` does not occur.
 * `plan.stairs` reached the renderer, the fixture validator and the refusal, and
 * stopped short of the emitter. Charging those walls a retry for obeying an ask
 * that never mentioned a staircase is charging them for our own omission.
 *
 * THE GAP IS PROVED, NOT ASSERTED. A reason names the refusal it answers AND a
 * `gained` test, and a wall is granted only when the prompt the emitter writes
 * TODAY says something about that refusal's own subject which the prompt
 * actually sent did not. Compose the fresh prompt, read the spent one off disk,
 * and compare. A reason whose fix has not actually landed in the emitter grants
 * nothing and says so — which is the difference between this and a list of wall
 * names somebody typed.
 *
 * ONCE-ONLY, PER WALL PER REASON, AND AUDITABLE. A wall that already carries a
 * grant under a reason is refused by name. The record keeps who granted it, the
 * reason, the refusal sentence it answers, what the budget was before, the
 * emitter commit being tested, and the exact lines the fresh prompt gained — so
 * a later reader can tell a measured re-ask from a quiet extra roll. A SECOND
 * grant under the same reason is not this tool's to give: the fix would then be
 * on trial rather than the wall.
 *
 * WHAT IT WILL NOT TOUCH:
 *   * a wall that has since been promoted;
 *   * a wall whose refusal is not one of the reasons below — a camera miss, an
 *     unfitted horizon and a suspect painting are all facts about a PICTURE, and
 *     no gap in the ask explains them;
 *   * a wall whose spent prompt already says the thing. If the ask named it and
 *     the painting still lost it, that is the generator's miss and it belongs to
 *     the ordinary retry budget.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { manorPrompt, scaffoldRects } from "./make-scaffold.mjs";
import { deriveMeta } from "./plan-projection.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const DEFAULT_OUT = join(ROOT, "design", "batches", "row23-scaffold", "manor");
export const GRANTS_KEY = "content_gap_grants";
export const EXTRA_ASKS = 1;

/**
 * THE REASONS, each one a refusal this project has actually issued paired with
 * the emitter change that answers it.
 *
 * `refusal` is matched against the correction sentence the sweep wrote into
 * `run-state.json` — the measurement's own words, never a paraphrase. `gained`
 * is given the prompt the emitter writes now and the prompt that was sent, and
 * returns the lines the ask has gained about this refusal's subject; an empty
 * list is a wall this reason may not touch.
 */
export const REASONS = {
  flight_never_named: {
    id: "flight_never_named",
    why: "the ask never named the flight",
    refusal: /the plan draws \d+ flight\(s\) in this view/,
    what: "The plan draws a staircase in this view and the prompt that was sent " +
      "did not mention one. `manorPrompt` now composes a Stairs paragraph from " +
      "`flightsForFacing` — the same projection the row-32 refusal reads — and " +
      "the scaffold stamps the flight's own region over it.",
    gained: (fresh, spent) => gainedSection(fresh, spent, /^Stairs:/)
  },
  ways_never_named_apart: {
    id: "ways_never_named_apart",
    why: "the ask never named the ways through apart from each other",
    refusal: /the plan rules \d+ way\(s\) through this wall and the painting shows/,
    what: "A wall carrying two doorways was asked for them in the identical " +
      "sentence twice, which is one instruction and not two; and the earliest " +
      "asks predate the unlit-void rule the promotion instrument reads a " +
      "doorway by. `manorPrompt` now gives each way through its own position in " +
      "the picture, and every door sentence carries the unlit clause.",
    gained: (fresh, spent) => gainedLines(fresh, spent, /door opening is exactly/)
  }
};

/** The lines of a `^Section:` paragraph the fresh prompt has and the spent one
 *  has not — the paragraph and its indented continuation together. */
export function gainedSection(fresh, spent, head) {
  const lines = fresh.split("\n");
  const at = lines.findIndex((l) => head.test(l));
  if (at === -1) return [];
  const out = [lines[at]];
  for (let i = at + 1; i < lines.length && /^\s/.test(lines[i]); i++) out.push(lines[i]);
  return spent.includes(out.join("\n")) ? [] : out;
}

/** The matching lines that differ between the two prompts, fresh side. */
export function gainedLines(fresh, spent, re) {
  const was = new Set(spent.split("\n").filter((l) => re.test(l)).map((l) => l.trim()));
  return fresh.split("\n").filter((l) => re.test(l) && !was.has(l.trim()));
}

/**
 * The last prompt this wall was actually sent: the highest `retry-<n>/` there
 * is, and the first ask where there is none. A wall with no prompt on disk was
 * never asked at all and is not a content gap — it is an emission that never
 * happened, and `--emit-manor` owns that.
 */
export function spentPromptPath(outDir, key) {
  const dir = join(outDir, key.replace("/", "-"));
  if (!existsSync(dir)) return null;
  let best = null, bestN = -1;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const m = e.isDirectory() && /^retry-(\d+)$/.exec(e.name);
    if (m && Number(m[1]) > bestN && existsSync(join(dir, e.name, "prompt.txt"))) {
      bestN = Number(m[1]); best = join(dir, e.name, "prompt.txt");
    }
  }
  if (best) return best;
  const first = join(dir, "prompt.txt");
  return existsSync(first) ? first : null;
}

/** Which walls each reason may touch, and the reason for every wall it may not. */
export function eligible(state, { plan, outDir = DEFAULT_OUT, only = null } = {}) {
  const take = [], skip = [];
  for (const [key, w] of Object.entries(state.walls || {})) {
    if (w.status === "promoted") { skip.push({ key, why: "promoted since the hold" }); continue; }
    const corr = w.correction || "";
    const reason = Object.values(REASONS)
      .filter((r) => !only || r.id === only)
      .find((r) => r.refusal.test(corr));
    if (!reason) {
      skip.push({ key, why: `no content-gap reason matches this wall's refusal (hold family ${w.hold_family || w.status})` });
      continue;
    }
    if (((w[GRANTS_KEY] || {})[reason.id])) {
      skip.push({ key, why: `already carries a ${reason.id} grant; this grant is once-only per wall per reason` });
      continue;
    }
    if (existsSync(join(ROOT, "backdrops", ...key.split("/")) + ".meta.json")) {
      skip.push({ key, why: "a promoted meta is already on disk for this facing" });
      continue;
    }
    const sp = spentPromptPath(outDir, key);
    if (!sp) {
      skip.push({ key, why: "no prompt on disk for this wall, so there is no ask to find a gap in" });
      continue;
    }
    const [loc, f] = key.split("/");
    const meta = deriveMeta(plan, loc, f);
    const { rects } = scaffoldRects(plan, loc, f, meta);
    const fresh = manorPrompt(plan, key, meta, rects, w.correction || null);
    const gained = reason.gained(fresh, readFileSync(sp, "utf8"));
    if (!gained.length) {
      /* THE HONEST REFUSAL. The ask already said it, so the wall's misses are
       * the generator's and the retry budget is the right instrument. */
      skip.push({ key, why: `${reason.id}: the prompt already sent says this — nothing has been gained, so this is not a gap in the ask` });
      continue;
    }
    take.push({
      key, reason: reason.id, attempts: w.attempts || 0,
      spent_prompt: sp.slice(ROOT.length + 1), gained
    });
  }
  take.sort((a, b) => a.key.localeCompare(b.key));
  return { take, skip };
}

function head() {
  try {
    return execFileSync("git", ["-C", ROOT, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  } catch { return null; }
}

export function grant(state, opts = {}) {
  const { dryRun = false, at = new Date().toISOString() } = opts;
  const { take, skip } = eligible(state, opts);
  for (const t of take) {
    if (dryRun) continue;
    const w = state.walls[t.key];
    const r = REASONS[t.reason];
    w[GRANTS_KEY] = w[GRANTS_KEY] || {};
    w[GRANTS_KEY][t.reason] = {
      granted: EXTRA_ASKS,
      why: r.why,
      what_changed_in_the_emitter: r.what,
      answers_refusal: w.correction,
      gained_lines: t.gained,
      spent_prompt: t.spent_prompt,
      at,
      prior_attempts: w.attempts || 0,
      prior_status: w.status,
      hold_family: w.hold_family,
      emitter_commit: head(),
      _once_only: "A wall carrying this reason is refused by the grant tool. A second grant " +
        "under one reason would put the fix on trial rather than the wall, and this tool " +
        "cannot give it."
    };
    /* The status is what the standing retry emitter reads; moving it to `retry`
     * is the whole mechanical effect. Everything above is the audit trail that
     * makes the move legible afterwards. */
    w.status = "retry";
    w.why = `content gap re-ask: ${r.why}`;
  }
  return { take, skip };
}

function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");
  const argOf = (f, d) => { const i = argv.indexOf(f); return i !== -1 ? argv[i + 1] : d; };
  const outDir = resolve(argOf("--out", DEFAULT_OUT));
  const only = argOf("--reason", null);
  if (only && !REASONS[only]) {
    console.error(`refused: no reason named ${only}. The reasons are: ${Object.keys(REASONS).join(", ")}`);
    process.exit(2);
  }
  const statePath = join(outDir, "run-state.json");
  if (!existsSync(statePath)) {
    console.error(`refused: ${statePath.slice(ROOT.length + 1)} does not exist`);
    process.exit(1);
  }
  const plan = JSON.parse(readFileSync(join(ROOT, "fixtures", "demo-study", "plan.json"), "utf8"));
  const state = JSON.parse(readFileSync(statePath, "utf8"));
  const { take, skip } = grant(state, { dryRun, plan, outDir, only });
  for (const t of take) {
    console.log(`  GRANT  ${t.key.padEnd(24)} ${t.reason.padEnd(24)} attempts ${t.attempts} -> +${EXTRA_ASKS} ask`);
    for (const g of t.gained.slice(0, 2)) console.log(`           gained: ${g.trim().slice(0, 110)}`);
    if (t.gained.length > 2) console.log(`           gained: ...and ${t.gained.length - 2} more line(s)`);
  }
  const byWhy = {};
  for (const s of skip) byWhy[s.why] = (byWhy[s.why] || 0) + 1;
  for (const [why, n] of Object.entries(byWhy).sort()) {
    console.log(`  skip   ${String(n).padStart(3)} wall(s): ${why}`);
  }
  console.log(`\n${take.length} wall(s) granted one further ask` +
    (dryRun ? " (DRY RUN - nothing written)" : ""));
  if (!dryRun && take.length) {
    writeFileSync(statePath, JSON.stringify(state, null, 2) + "\n");
    /* THE CAP IS THE EMITTER'S, NOT THIS TOOL'S. `--emit-retries` refuses a wall
     * that has already spent `--retries` asks, so the command below names the
     * number that lets exactly these walls through and no others. */
    const cap = Math.max(...take.map((t) => t.attempts)) + EXTRA_ASKS;
    console.log(`  written  ${statePath.slice(ROOT.length + 1)}`);
    console.log(`  next     node tools/make-scaffold.mjs --emit-retries ` +
      `--out ${outDir.slice(ROOT.length + 1)} --retries ${cap} --rolls 1`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
