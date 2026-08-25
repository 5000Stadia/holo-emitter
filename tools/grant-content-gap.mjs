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
 *   * a wall no reason below reaches. Two of the three reasons are keyed on the
 *     REFUSAL the gate wrote, and a camera miss, an unfitted horizon and a
 *     suspect painting are facts about a PICTURE that no gap in the ask
 *     explains. Row 38's `edge_never_seeded` is keyed on the WALL instead — an
 *     open location's facing whose painted neighbour was never handed to it —
 *     so it can reach a wall holding on any of those, because what it answers
 *     is an omission in the ask rather than the reason the picture was refused;
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
import { seedPlan } from "./edge-seed.mjs";

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
    /* [row 43] COMPARED ON SUBSTANCE, NOT ON WORDING, AND THAT IS THE WHOLE
     * POINT OF THIS REASON. It read `/door opening is exactly/` and compared
     * LINES: whatever the fresh ask said about a doorway that the spent one did
     * not. That worked while only the content moved. The register change moves
     * the WORDS on every wall at once — `g4` gave each doorway its own sentence
     * and a column range, the clean register says the count in words and names
     * every place in one clause — so a line comparison would report a gain on
     * every door wall in the house and hand out a free roll for a rewording.
     * "A content-gap grant would be a free roll dressed as an accounting
     * correction" is this reason's own sentence, so what is compared is the two
     * things row 27 and row 29 actually added: the space beyond every way
     * through ruled UNLIT, and each way through told APART from the others. */
    gained: (fresh, spent) => {
      const f = doorFacts(fresh), s = doorFacts(spent);
      const out = [];
      if (f.named && !s.named) {
        out.push("the ask names the ways through this wall at all");
      }
      if (f.unlit && !s.unlit) {
        out.push("the space beyond every way through is ruled deep unlit shadow — the void the " +
          "promotion instrument reads a doorway by, and what the renderer composites the " +
          "destination room into");
      }
      /* AND ONLY WHERE THERE IS SOMETHING TO TELL APART. A wall with one
       * doorway has no second one to be confused with, and the incumbent added
       * no position word for a lone carrier for that exact reason - "the box on
       * the layout image already says which". Counting the clean register's
       * position phrase as a gain there would grant a free roll to every
       * single-door wall in the house on the day the register changed. */
      if (f.places.size > 1 && f.places.size > s.places.size) {
        out.push(`${f.places.size} ways through are told apart from each other ` +
          `(${[...f.places].join(", ")}), against ${s.places.size} in the ask that was sent`);
      }
      return out;
    }
  },
  /* [row 38] THE THIRD REASON, AND THE FIRST THAT IS NOT KEYED ON A REFUSAL.
   *
   * The two above answer a sentence the gate wrote. This one answers a sentence
   * NOBODY wrote: an open location's facings were asked for one at a time with
   * nothing to continue, because until row 38 the emitter had no way to hand a
   * painter the completed neighbour's edge. Kabe saw the result by turning 90°
   * — "the edges of one may not stylistically be enforced on the edges of the
   * direction when you turn 90°" — which is a defect in the ASK and not in any
   * painting, and charging a retry for it charges the wall for our omission
   * exactly as `flight_never_named` did.
   *
   * SCOPED TO OPEN LOCATIONS, deliberately. Row 38 makes seeding REQUIRED there
   * and OPPORTUNISTIC indoors, and an opportunistic seed is one a wall picks up
   * the next time it is asked for some other reason — never a reason to ask
   * again on its own. So an indoor wall is refused by name here, with that
   * sentence, rather than quietly not matching.
   */
  edge_never_seeded: {
    id: "edge_never_seeded",
    why: "the ask never carried the completed neighbour's edge",
    applies: ({ key, plan }) => {
      const s = seedPlan(plan, key);
      return s.location_type === "open" && !!s.neighbour;
    },
    refuse: ({ key, plan }) => {
      const s = seedPlan(plan, key);
      if (s.location_type !== "open") {
        return "indoors the seed is opportunistic: this wall takes one the next time it is " +
          "asked, and row 38 does not make that a reason to ask again";
      }
      if (!s.neighbour) {
        return s.depends_on
          ? `an open facing whose seam neighbour \`${s.depends_on}\` is not painted yet — there ` +
            `is no completed edge to seed it with, so it waits rather than being re-asked`
          : "an open facing with no painted neighbour at all";
      }
      return null;
    },
    what: "Row 38's edge seed: the emitter now cuts the abutting 10 % of the painted " +
      "neighbour (`tools/edge-seed.mjs`, `tools/crop-edge-seed.py`) and sends it beside the " +
      "layout image with its role stated in words in the picture paragraph. The strip carries " +
      "appearance; the sentence carries the role.",
    /* [row 43] THE INDEX IS DERIVED, so the pattern cannot hold one. A packet
     * with no style image puts the scaffold at Image 1 and this strip at Image
     * 2; row 38 wrote "Image 3" when every packet carried a style seed. */
    gained: (fresh, spent) => gainedLines(fresh, spent, /Image \d+ is a reference of exactly/)
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

/* [row 43] WHAT AN ASK SAYS ABOUT THE WAYS THROUGH A WALL, in either register.
 *
 * `named` — does it mention a door opening at all.
 * `unlit` — does it rule the space beyond the opening deep unlit shadow. Row
 *   27's clause, and the flight's own unlit sentence is deliberately not
 *   matched: it says "beyond its topmost step", not "beyond the opening".
 * `places` — where the ask puts each doorway. `g4` prefixed them ("left-hand ",
 *   "right-hand ") and added a column range; the clean register uses the
 *   position words `positionPhrase` derives. Two doorways told apart is two
 *   places, in either vocabulary, and that is row 29's finding: `great_hall/W`
 *   and `long_gallery/W` were asked for their second doorway in a sentence
 *   byte-identical to the first, which is one instruction and not two.
 */
const DOOR_PLACE = new RegExp([
  "left-hand", "right-hand", "middle",
  "at the far left", "left of centre", "at the centre", "right of centre", "at the far right",
  "between the two windows",
  "\\b(?:first|second|third|fourth|fifth|sixth|seventh|eighth)-from-the-left\\b",
  "between column \\d+ and column \\d+"
].join("|"), "gi");

export function doorFacts(text) {
  const t = String(text || "");
  const door = t.split("\n").filter((l) => /door opening/i.test(l));
  return {
    named: door.length > 0,
    unlit: /beyond (?:the opening|it|them|those openings) is deep unlit shadow/i.test(t),
    places: new Set((door.join(" ").match(DOOR_PLACE) || []).map((x) => x.toLowerCase()))
  };
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

/**
 * Which walls each reason may touch, and the reason for every wall it may not.
 *
 * `spentPrompt` overrides where the ask that was actually sent is read from.
 * It exists because this decision is only reproducible while the ask it was
 * made against is still the newest one on disk: emit the re-ask and the gap
 * closes, correctly and permanently. The grant's own record keeps the path it
 * diffed, so a reader — or a test — can put the tool back in front of the state
 * it decided on. Nothing in production passes it.
 */
export function eligible(state, { plan, outDir = DEFAULT_OUT, only = null, walls = null,
  spentPrompt = null } = {}) {
  const take = [], skip = [];
  for (const [key, w] of Object.entries(state.walls || {})) {
    if (walls && !walls.includes(key)) continue;
    if (w.status === "promoted") { skip.push({ key, why: "promoted since the hold" }); continue; }
    const corr = w.correction || "";
    /* A reason matches EITHER a refusal the gate wrote (the first two) or a
     * condition of the wall itself (row 38's, where the gap is in an ask nobody
     * ever made). `applies` is given the plan so it can ask the drawing what
     * kind of place this is; it writes nothing. */
    const reason = Object.values(REASONS)
      .filter((r) => !only || r.id === only)
      .find((r) => r.refusal ? r.refusal.test(corr) : r.applies({ key, wall: w, plan }));
    if (!reason) {
      const named = only && REASONS[only];
      const why = named && named.refuse ? named.refuse({ key, wall: w, plan }) : null;
      skip.push({ key, why: why ||
        `no content-gap reason matches this wall's refusal (hold family ${w.hold_family || w.status})` });
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
    const sp = spentPrompt ? spentPrompt(key) : spentPromptPath(outDir, key);
    if (!sp) {
      skip.push({ key, why: "no prompt on disk for this wall, so there is no ask to find a gap in" });
      continue;
    }
    const [loc, f] = key.split("/");
    const meta = deriveMeta(plan, loc, f);
    const { rects } = scaffoldRects(plan, loc, f, meta);
    /* THE FRESH PROMPT IS COMPOSED WITH THE SEED IT WOULD CARRY, and no strip is
     * cut: `seedPlan` decides the side, the neighbour and the sentence without
     * touching a pixel, so eligibility stays a read. */
    const wouldSeed = seedPlan(plan, key);
    const fresh = manorPrompt(plan, key, meta, rects, w.correction || null,
      wouldSeed.neighbour ? wouldSeed : null);
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
  /* `--wall` narrows the pass to named walls, repeatable. It exists because row
   * 38's pilot is one room by the row's own words, and a tool that can only run
   * over everything makes a scoped pilot into a hand-edited state file. */
  const walls = argv.reduce((a, x, i) => (x === "--wall" ? a.concat(argv[i + 1]) : a), []);
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
  const { take, skip } = grant(state, { dryRun, plan, outDir, only,
    walls: walls.length ? walls : null });
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
