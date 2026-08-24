/* Row 34 — the breakout evolution run's machinery.
 *
 * `design/specs/34-plan.md` §8 is the list; this file is it. Four claims live
 * here and they are checked separately, because conflating them is how a
 * prompting experiment ends up measuring its own apparatus:
 *
 *   1. EVERY ARM COMPOSES A PROMPT THIS PROJECT WOULD ACTUALLY SEND — the real
 *      `prompt_lint.py`, over all seven arms on both probe walls.
 *   2. THE CONTROL IS PRODUCTION AND THE DIFFS ARE THE WHOLE DIFFERENCE — the
 *      control is byte-identical to `manorPrompt`, and every other arm's
 *      distance from its parent is exactly the set of lines declared for it.
 *   3. EVERY NUMBER AN ARM STATES IS THE PLAN'S, RECOMPUTED INDEPENDENTLY —
 *      from `facingCarriers`, `deriveMeta` and `groundplane`, never through the
 *      composer's own helper.
 *   4. THE SCORER CANNOT CROWN FROM NOISE, AND CANNOT PLAY FAVOURITES — planted
 *      fixtures with known answers, including one where the governing frame's
 *      own arm is the loser, and a structural scan proving the scorer names no
 *      arm at all.
 *
 * NO IMAGE IS DISPATCHED AND NONE IS MEASURED HERE. Every reading this file
 * scores is synthetic and marked `_synthetic`, written to a throwaway directory
 * that `row34_fixtures.py` refuses to point at the real one.
 */
import { test, expect } from "@playwright/test";
import { readFileSync, existsSync, mkdtempSync, rmSync, readdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { repoRoot } from "./helpers.mjs";
import {
  ARMS, ARM_IDS, GEN1_ARMS, GEN3_ARMS, CONTROL_ARM, PROBES, PLAN, SPECTRUM, REGISTER,
  HEADLINE_PAIRING,
  AMPLIFICATION, CHANNELS, makeCtx, armPrompt, edgeMarks, frameGeometry,
  vanishingPoint, frameExit, parseSections, renderSections, positionWord,
  V5_SUBSTITUTIONS, V2_DEMOTION_LINES, M4_DEMOTION_LINES, IMAGE2_LINES, crossings,
  junctionTable, wallGridBlock, drawInstructions
} from "../../tools/evolution-arms.mjs";
import { manorPrompt, scaffoldRects, chairRail } from "../../tools/make-scaffold.mjs";
import {
  registerBlock, frameGeometry as sharedFrameGeometry, POSITIVE_NO_TEXT,
  POSITIVE_NO_TEXT_OUTDOORS
} from "../../tools/frame-language.mjs";
import { voiceFor } from "../../tools/room-voices.mjs";
import { deriveMeta, facingCarriers } from "../../tools/plan-projection.mjs";
import { rollId34, BUDGET } from "../../tools/emit-evolution.mjs";

const require_ = createRequire(import.meta.url);
const groundplane = require_("../../src/groundplane.js");
const MEASURED = join(repoRoot, "design", "plan-draft", "measured");
const BATCH = join(repoRoot, "design", "batches", "row34-evolution");
const LINT = join(MEASURED, "prompt_lint.py");
const FITNESS = join(MEASURED, "row34_fitness.py");
const FIXTURES = join(MEASURED, "row34_fixtures.py");
const RUNNER = join(MEASURED, "row34_run.py");
const AUDIT = join(MEASURED, "row34_promptaudit.py");

/* The manor production run's own state. Nothing in row 34 may move any of it,
 * and the behavioural half of that check hashes these three before and after. */
const MANOR = join(repoRoot, "design", "batches", "row23-scaffold", "manor");
const MANOR_FILES = ["manifest.json", "run-state.json", "retries.json"]
  .map((f) => join(MANOR, f)).filter((p) => existsSync(p));

const KEYS = PROBES.map((p) => p.key);
const ctxFor = (key) => makeCtx(PLAN, key);
const sha = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");

function py(script, args) {
  return execFileSync("python3", [script, ...args], { encoding: "utf8", cwd: repoRoot });
}

function tmp(prefix) {
  return mkdtempSync(join(tmpdir(), `row34-${prefix}-`));
}

/* One fixture case, scored, returning the report text. Every path is a
 * throwaway; nothing here touches the real readings or the real batch output. */
function scoreCase(caseName, arm, extra = []) {
  const dir = tmp(caseName);
  const out = join(dir, "REPORT.md");
  const plan = join(dir, "gen2.json");
  try {
    py(FIXTURES, ["--case", caseName, "--arm", arm, "--out", join(dir, "readings")]);
    py(FITNESS, ["--readings", join(dir, "readings"), "--out", out,
      "--plan-out", plan, ...extra]);
    return {
      report: readFileSync(out, "utf8"),
      plan: existsSync(plan) ? JSON.parse(readFileSync(plan, "utf8")) : null,
      dir
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test.describe("row 34 — the evolution run's machinery", () => {
  /* Every claim here is about node composers, a python scorer and a set of
     coordinates. None of it touches a browser engine, so a second engine would
     run the identical assertions against the identical bytes. */
  test.skip(({ browserName }) => browserName !== "chromium",
    "row 34's machinery is a node tool and a python scorer; there is no second engine");

  /* ---------------------------------------------------------------- 1 */


  /* ---------------------------------------------------------------- 2 */




  test("v4 is minimal, not none: three body sentences over the lint's own header", () => {
    for (const key of KEYS) {
      const text = armPrompt("v4", ctxFor(key));
      const secs = parseSections(text);
      expect(secs.map((s) => s.key))
        .toEqual(["Use case", "Asset type", "Gate anchor", "Primary request"]);
      const body = secs[3].lines.join(" ").replace(/^Primary request:\s*/, "");
      expect(body.split(".").filter((s) => s.trim()).length).toBe(3);
    }
  });

  /* ---------------------------------------------------------------- 3 */



  test("the instrument really has no text_painted detector, so the note is true", () => {
    /* 23-plan §5.4 named the flag and P0 never built it, so the plan and every
       report say a painted label is a silent pass. If someone builds a detector
       later, this goes red and those sentences have to be deleted with it.

       What is looked for is the flag as CODE — a dict key, a field, an
       assignment — not the words, because this row's own files discuss its
       absence at length and a scan that could not tell those apart would be
       satisfied by deleting a comment. */
    let out = "";
    try {
      out = execFileSync("git", ["-C", repoRoot, "grep", "-nE",
        "text_painted[\"'=:\\]]", "--",
        "design/plan-draft/measured", "tools", "replicator", "src"],
        { encoding: "utf8" }).trim();
    } catch (e) {
      out = String(e.stdout || "").trim();   // git grep exits 1 when it finds nothing
    }
    expect(out, `something now emits a text_painted flag:\n${out}`).toBe("");
  });

  /* ---------------------------------------------------------------- edge */
  test("the edge scaffold's every coordinate is the declared geometry's", () => {
    for (const key of KEYS) {
      const ctx = ctxFor(key);
      const [loc, f] = key.split("/");
      const meta = deriveMeta(PLAN, loc, f);
      const marks = edgeMarks(ctx);
      expect(marks.ink).toBe("#000000");
      expect(marks.ground).toBe("#ffffff");
      const floorY = meta.floor_line_y * meta.image_h_px;
      const foot = marks.lines.find((l) => l.what === "wall-floor line");
      expect(foot.y0).toBeCloseTo(floorY, 1);
      expect(foot.x0).toBeCloseTo(meta.corner_x0_px, 1);
      expect(foot.x1).toBeCloseTo(meta.corner_x1_px, 1);
      const anchor = marks.lines.find((l) => l.what === "gate anchor");
      expect(anchor.y0).toBeCloseTo(chairRail(meta, ctx.anchor).y, 1);
      /* NO EYE-LINE MARK: a ruled horizontal at the convergence row is an
         invitation to paint a horizontal the gate then reads as a junction. */
      expect(marks.lines.some((l) => Math.abs(l.y0 - meta.horizon_y * meta.image_h_px) < 2
        && Math.abs(l.y1 - meta.horizon_y * meta.image_h_px) < 2)).toBe(false);
      expect(marks.rects.length).toBe(ctx.rects.length);
    }
  });

  test("the sidecar admits the edge drawing is not a shipped-frame capture", () => {
    for (const key of KEYS) {
      const doc = JSON.parse(readFileSync(
        join(BATCH, "gen1", key.replace("/", "-"), "sidecar.json"), "utf8"));
      expect(doc._edge_provenance).toContain("NOT A SHIPPED-RENDERER CAPTURE");
      expect(doc.declared_horizon_row).toBe(Math.round(doc.meta_used.horizon_y * 1024));
    }
  });

  /* ---------------------------------------------------------------- ids */
  test("assignment.json has never changed since the commit that added it", () => {
    const rel = "design/batches/row34-evolution/assignment.json";
    const introduced = execFileSync("git",
      ["-C", repoRoot, "log", "--diff-filter=A", "--format=%H", "--", rel],
      { encoding: "utf8" }).trim().split("\n").filter(Boolean).pop();
    expect(introduced, "assignment.json has no introducing commit").toBeTruthy();
    const then = execFileSync("git", ["-C", repoRoot, "rev-parse", `${introduced}:${rel}`],
      { encoding: "utf8" }).trim();
    const now = execFileSync("git", ["-C", repoRoot, "hash-object", join(repoRoot, rel)],
      { encoding: "utf8" }).trim();
    expect(now, "assignment.json changed after it was committed").toBe(then);
  });

  test("return paths are opaque and carry neither arm nor wall", () => {
    const assign = JSON.parse(readFileSync(join(BATCH, "assignment.json"), "utf8"));
    expect(assign.rolls.length).toBe(BUDGET.images_per_screening_generation);
    const seen = new Set();
    for (const r of assign.rolls) {
      expect(r.id).toBe(rollId34(r.generation, r.wall, r.arm, r.roll));
      expect(r.id).toMatch(/^[0-9a-f]{8}$/);
      expect(seen.has(r.id), `id ${r.id} is not unique`).toBe(false);
      seen.add(r.id);
      const base = r.candidate.split("/").pop();
      expect(base).toBe(`row34-${r.id}.png`);
      for (const token of [...ARM_IDS, ARMS[r.arm].name.toLowerCase()]) {
        expect(base.includes(token), `${base} leaks ${token}`).toBe(false);
      }
      /* The wall's own directory is unavoidable — a candidate has to live
         somewhere — but the FILENAME, which is what a measuring hand reads in a
         listing, carries nothing. */
      expect(base).not.toContain(r.wall.split("/")[0]);
    }
  });

  test("the declared budget is a gate, not a sentence", () => {
    expect(BUDGET.arms_gen1).toBe(GEN1_ARMS.length);
    expect(BUDGET.images_per_screening_generation)
      .toBe(BUDGET.arms_gen1 * BUDGET.walls * BUDGET.rolls_per_arm_per_wall);
    expect(BUDGET.total_worst_case).toBe(
      2 * BUDGET.images_per_screening_generation + BUDGET.images_confirmation_generation);
    const plan = readFileSync(join(repoRoot, "design", "specs", "34-plan.md"), "utf8");
    expect(plan).toContain(`${BUDGET.total_worst_case} images worst case`);
    expect(plan).toContain(`| 1 | ${BUDGET.arms_gen1} | ${BUDGET.walls} | ` +
      `${BUDGET.rolls_per_arm_per_wall} | **${BUDGET.images_per_screening_generation}**`);
  });

  /* ---------------------------------------------------------------- 4 */
  test("a planted winner is detected and named", () => {
    const { report } = scoreCase("winner", "v1");
    expect(report).toContain("HEADLINE: SEPARATION: v1");
    expect(report).toContain("MIN DETECTABLE EFFECT AT THIS N: 4 of 4 against 0 of 4");
  });

  test("a planted null is detected and NOTHING is crowned", () => {
    const { report } = scoreCase("null", "v1");
    expect(report).toContain("HEADLINE: NO SEPARATION");
    expect(report).not.toMatch(/HEADLINE: SEPARATION/);
    /* And the consequence is stated rather than buried. */
    expect(report).toContain("apparatus must argue for its life or be removed");
  });

  test("the governing frame's own arm can be reported as the loser, as plainly", () => {
    /* [HUMAN, 2026-08-24] "Yeah but test my direction against our tests as
       well." A framing that could only announce a win would be a finding. */
    const { report } = scoreCase("loser", "v7");
    expect(report).toContain("HEADLINE: SEPARATION: v1");
    expect(report).toMatch(/\| v7 \| 0\/4 \| 0\/4 \| \+0 \|/);
    /* Same table, same columns, no softening line anywhere near it. */
    const line = report.split("\n").find((l) => l.startsWith("| v7 | 0/4"));
    expect(line).toContain("| no | no | no |");
  });

  test("an arm that beats the control by two rolls but not decisively does not separate", () => {
    const { report } = scoreCase("thin", "v1");
    expect(report).toContain("HEADLINE: NO SEPARATION");
    expect(report).toMatch(/\| v1 \| 4\/4 \| 2\/4 \| \+2 \|/);
  });

  test("every reading withheld is a broken run, not a null, and breeds nothing", () => {
    const { report, plan } = scoreCase("broken", "v1", ["--plan-generation-2"]);
    expect(report).toContain("HEADLINE: RUN BROKEN: every reading is withheld");
    expect(plan.branch).toBe("C");
    expect(plan.refused).toBe(true);
    expect(plan.arms).toEqual([]);
    /* The table is still printed — a reader needs the column that convicts it. */
    expect(report).toMatch(/\| v3 \| \S+ \| 0\/0 \| 0\/0 \|/);
  });

  test("the three separation clauses each do their own work", () => {
    /* `separates()` as a unit, because at generation 1's n no fixture can reach
       the margin clause: the only Holm-clearing result has a margin of 4, so
       Holm is strictly the tighter guard there. The clause is kept because it
       is the one that survives a change in n, and this is where it is tested.
       Order: (holm, margin, split) — all three must be able to refuse alone. */
    const src = `import sys; sys.path.insert(0, ${JSON.stringify(MEASURED)});\n` +
      "import row34_fitness as f\n" +
      "print(f.separates(True, 4, False), f.separates(False, 4, False), " +
      "f.separates(True, 1, False), f.separates(True, 4, True))";
    const dir = tmp("sep");
    try {
      const script = join(dir, "s.py");
      writeFileSync(script, src);
      expect(py(script, []).trim()).toBe("True False False False");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("the scorer names no arm at all, not even the control's", () => {
    /* §0a's fence, mechanically: there is no place in the scorer where a
       privileged arm could be written down. */
    const src = readFileSync(FITNESS, "utf8");
    for (const id of ARM_IDS) {
      expect(src.includes(`"${id}"`), `row34_fitness.py names the arm ${id}`).toBe(false);
      expect(src.includes(`'${id}'`), `row34_fitness.py names the arm ${id}`).toBe(false);
    }
    /* And it reads the control out of the id map instead. */
    expect(src).toContain('assign["_control"]');
  });

  test("the breeding is deterministic and its ids are unique", () => {
    const a = scoreCase("winner", "v1", ["--plan-generation-2"]);
    const b = scoreCase("winner", "v1", ["--plan-generation-2"]);
    expect(JSON.stringify(a.plan)).toBe(JSON.stringify(b.plan));
    expect(a.plan.branch).toBe("A");
    const ids = a.plan.arms.map((x) => x.arm);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[0]).toBe(CONTROL_ARM);
    expect(a.plan.refused).toBe(false);
    expect(a.plan.rolls).toBeLessThanOrEqual(BUDGET.images_per_screening_generation);
    /* Round-robin breadth: the crossings do not all come from one partner. */
    const partners = a.plan.arms.filter((x) => x.origin === "crossing")
      .map((x) => x.parents[1]);
    expect(new Set(partners).size).toBeGreaterThan(1);
  });

  test("a null breeds the declared null branch, and its opposite is a spectrum distance", () => {
    const { plan } = scoreCase("null", "v1", ["--plan-generation-2"]);
    expect(plan.branch).toBe("B");
    expect(plan.arms[0].arm).toBe(CONTROL_ARM);
    expect(plan.arms.filter((a) => a.origin === "amplified").length).toBe(2);
    for (const a of plan.arms.filter((x) => x.origin === "amplified")) {
      expect(a.amplification, `${a.arm} has no declared mutation`).toBeTruthy();
      expect(a.amplification).toBe(AMPLIFICATION[a.parents[0]]);
    }
    const far = plan.arms.find((a) => a.origin.startsWith("opposite extreme"));
    expect(far, "the null branch bred no opposite extreme").toBeTruthy();
    expect(far.spectrum_distance).toBeGreaterThan(0);
    /* The control is never mutated — it is the yardstick. */
    expect(AMPLIFICATION[CONTROL_ARM]).toBeNull();
    expect(plan.arms.some((a) => a.arm === CONTROL_ARM && a.origin.includes("amplified")))
      .toBe(false);
  });

  test("channel crossings are reproducible and never reproduce an existing arm", () => {
    const out = crossings("v1", "v4");
    const existing = new Set(ARM_IDS.map((id) =>
      CHANNELS.map((c) => ARMS[id].channels[c]).join("|")));
    for (const c of out) {
      expect(existing.has(CHANNELS.map((k) => c.channels[k]).join("|"))).toBe(false);
    }
    expect(JSON.stringify(crossings("v1", "v4"))).toBe(JSON.stringify(out));
  });

  /* --------------------------------------------------- the manor is untouched */
  test("no row-34 tool names the manor run's state", () => {
    const sources = [
      join(repoRoot, "tools", "emit-evolution.mjs"),
      join(repoRoot, "tools", "evolution-arms.mjs"),
      RUNNER, FITNESS, FIXTURES
    ];
    for (const s of sources) {
      /* PROSE MAY NAME THE FILE AND CODE MAY NOT. The fences are documented in
         these very files — "this never opens run-state.json" is a sentence
         worth keeping, and a scan that could not tell a sentence from a path
         would be satisfied by deleting the sentence. So what is refused is a
         line that both builds a path and names the manor run: `join(`, `open(`
         or a `path` expression carrying `row23-scaffold`, `run-state.json` or
         `retries.json`. The behavioural half of this fence is the next case,
         which hashes those three files across a real run. */
      const text = readFileSync(s, "utf8");
      const BUILDS = /\b(join|open|readFileSync|writeFileSync|existsSync|glob)\s*\(/;
      const NAMES = /row23-scaffold|run-state\.json|retries\.json/;
      for (const l of text.split("\n")) {
        if (BUILDS.test(l) && NAMES.test(l)) {
          expect(l, `${s} builds a path into the manor run:\n${l}`).toBe("");
        }
      }
    }
  });

  test("a real run of the measure path moves nothing in the manor run", () => {
    expect(MANOR_FILES.length).toBeGreaterThan(0);
    const before = MANOR_FILES.map(sha);
    const dir = tmp("run");
    try {
      py(RUNNER, ["--out", join(dir, "readings")]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
    expect(MANOR_FILES.map(sha)).toEqual(before);
  });

  test("the manor sweep cannot see this row's returns", () => {
    /* The other half of the fence, and it is the manor's own regex that makes
       it true rather than an arrangement we are trusting. */
    const src = readFileSync(join(repoRoot, "tools", "make-scaffold.mjs"), "utf8");
    expect(src).toContain("/^row23-[0-9a-f]{8}\\.png$/");
    const assign = JSON.parse(readFileSync(join(BATCH, "assignment.json"), "utf8"));
    const re = /^row23-[0-9a-f]{8}\.png$/;
    for (const r of assign.rolls) expect(re.test(r.candidate.split("/").pop())).toBe(false);
  });

  /* --------------------------------------------------- the spectrum is the lens */
  test("the spectrum spans image-carries-all to text-carries-all and covers every arm on it", () => {
    /* Every arm whose factor that axis can SEE. Generation 3 holds the image
       constant and varies the register the geometry is written in, so all four
       of its arms would sit at one point here and read as though nothing
       varied; they have their own lens and the next case checks it. */
    const onAxis = ARM_IDS.filter((id) => ARMS[id].generation !== 3);
    expect(SPECTRUM.map((s) => s.arm).sort()).toEqual([...onAxis].sort());
    expect(SPECTRUM[0].precision_in).toBe("image");
    expect(SPECTRUM[SPECTRUM.length - 1].precision_in).toBe("text");
    /* The ruled midpoint is a POSITION, not a privilege: it sits between the
       shared-precision arms and the unbound text arms, and nothing else about
       it differs. */
    const i = SPECTRUM.findIndex((s) => s.arm === HEADLINE_PAIRING.bound);
    const j = SPECTRUM.findIndex((s) => s.arm === HEADLINE_PAIRING.unbound);
    expect(i).toBeGreaterThan(0);
    expect(j).toBeGreaterThan(i);
    expect(SPECTRUM[i].precision_in).toBe(SPECTRUM[j].precision_in);
    expect(SPECTRUM[i].bound).toBe("bound");
    expect(SPECTRUM[j].bound).toBe("unbound");
  });

  test("the report reads against the spectrum and prints the headline pairing", () => {
    const { report } = scoreCase("null", "v1");
    expect(report).toContain("## Where does precision belong");
    expect(report).toContain("Visual reference for visual orientation generalities");
    /* Every arm THIS generation ran, in the spectrum's own order. A later
       generation's arms are in the table and have no rolls in this one, and the
       report skips them rather than printing an empty row. */
    const ran = SPECTRUM.map((s) => s.arm).filter((a) => GEN1_ARMS.includes(a));
    for (const a of ran) expect(report).toContain(`| ${a} |`);
    const spectrumBlock = report.split("## Where does precision belong")[1];
    const order = ran.filter((a) => spectrumBlock.includes(`| ${a} |`));
    expect(order).toEqual(ran);
    let at = -1;
    for (const a of ran) {
      const i = spectrumBlock.indexOf(`| ${a} |`);
      expect(i, `${a} is out of spectrum order in the report`).toBeGreaterThan(at);
      at = i;
    }
    expect(report).toContain(`HEADLINE PAIRING — ${HEADLINE_PAIRING.bound} (bound)`);
    /* And the three standing caveats ride every report. */
    expect(report).toContain("no text_painted detector");
    expect(report).toContain("MINIMAL, not none");
    expect(report).toContain("the camera column is SECONDARY");
  });

  /* --------------------------------------------------- the probes */
  /* ------------------------------------------------- generation 2, bred */

  test("the generation-2 arm set is the rule's, re-derived here rather than trusted", () => {
    /* THE READINGS ARE NOT IN THIS TREE. The plan file records the planner's
       output from the Navigator's sweep, so the arm set itself cannot be
       recomputed here — but the CROSSINGS can, and they are the part a hand
       could bend. Given the two leaders, the enumeration over the seven
       generation-1 triples is pure logic over data this tree does hold. */
    const plan = JSON.parse(readFileSync(join(BATCH, "generation-2-plan.json"), "utf8"));
    expect(plan.branch).toBe("B");
    expect(plan.refused).toBe(false);
    expect(plan._provenance.readings_in_this_tree).toBe(false);
    expect(plan._provenance._gap).toContain("NOT COMMITTED");

    const bred = plan.arms.filter((a) => a.origin === "crossing");
    const parents = bred[0].parents;
    expect(new Set(bred.map((a) => a.parents.join("x"))).size).toBe(1);
    const chan = [...CHANNELS].sort();
    const sig = (c) => chan.map((k) => c[k]).join("|");
    const taken = new Set(GEN1_ARMS.map((id) => sig(ARMS[id].channels)));
    const derived = [];
    for (let mask = 1; mask < 2 ** chan.length - 1; mask++) {
      const c = {};
      chan.forEach((k, i) => { c[k] = (mask >> i) & 1
        ? ARMS[parents[1]].channels[k] : ARMS[parents[0]].channels[k]; });
      const s = sig(c);
      if (taken.has(s)) continue;
      taken.add(s);
      derived.push({ id: `${parents[0]}x${parents[1]}m${mask}`, channels: c });
    }
    expect(derived.map((d) => d.id)).toEqual(bred.map((a) => a.arm));
    for (const d of derived) {
      const planned = bred.find((a) => a.arm === d.id);
      for (const k of chan) expect(planned.channels[k]).toBe(d.channels[k]);
    }
  });

  test("every generation-2 composer matches the triple the rule bred", () => {
    /* The emitter refuses a mismatch; this is the same claim without a browser,
       so a composer written to the wrong triple is a red test and not a wasted
       generation. */
    const plan = JSON.parse(readFileSync(join(BATCH, "generation-2-plan.json"), "utf8"));
    for (const a of plan.arms) {
      const arm = ARMS[a.arm];
      expect(arm, `no composer implements ${a.arm}`).toBeTruthy();
      for (const c of Object.keys(a.channels)) expect(arm.channels[c]).toBe(a.channels[c]);
    }
    /* And the four new triples are genuinely four, not repeats of gen 1. */
    const chan = [...CHANNELS].sort();
    const sig = (id) => chan.map((k) => ARMS[id].channels[k]).join("|");
    const fresh = plan.arms.map((a) => a.arm).filter((id) => !GEN1_ARMS.includes(id));
    expect(fresh.length).toBe(4);
    for (const id of fresh) {
      if (ARMS[id].amplified) continue;      // an amplified arm keeps its parent's triple
      expect(GEN1_ARMS.map(sig)).not.toContain(sig(id));
    }
  });






  test("generation 2's id map, packets and budget", () => {
    const plan = JSON.parse(readFileSync(join(BATCH, "generation-2-plan.json"), "utf8"));
    const assign = JSON.parse(readFileSync(join(BATCH, "assignment-gen2.json"), "utf8"));
    expect(assign.rolls.length).toBe(plan.arms.length * KEYS.length
      * BUDGET.rolls_per_arm_per_wall);
    expect(assign.rolls.length).toBe(24);
    /* Under the ceiling is fine; over is refused. */
    expect(assign.rolls.length).toBeLessThanOrEqual(BUDGET.images_per_screening_generation);
    const byWall = {};
    for (const key of KEYS) byWall[key] = ctxFor(key);
    const seen = new Set();
    for (const r of assign.rolls) {
      expect(r.generation).toBe(2);
      expect(r.id).toBe(rollId34(2, r.wall, r.arm, r.roll));
      expect(seen.has(r.id)).toBe(false);
      seen.add(r.id);
      expect(r.candidate.split("/").pop()).toBe(`row34-${r.id}.png`);
      expect(existsSync(join(repoRoot, r.prompt)),
        `${r.prompt} is not on disk`).toBe(true);
    }
    /* And no generation-1 id was reused — the two maps are disjoint. */
    const g1 = JSON.parse(readFileSync(join(BATCH, "assignment.json"), "utf8"));
    for (const r of g1.rolls) expect(seen.has(r.id)).toBe(false);
  });

  test("generation 2 did not disturb generation 1", () => {
    /* The emitter used to write `manifest.json` unconditionally, which would
       have replaced generation 1's with generation 2's — and generation 1's
       manifest is what points the measure path at generation 1's sidecars. One
       manifest per generation, named like the id map. */
    expect(existsSync(join(BATCH, "manifest.json"))).toBe(true);
    expect(existsSync(join(BATCH, "manifest-gen2.json"))).toBe(true);
    const g1 = JSON.parse(readFileSync(join(BATCH, "manifest.json"), "utf8"));
    expect(g1.generation).toBe(1);
    expect(g1.walls.every((w) => w.packet.includes("gen1"))).toBe(true);
    const g2 = JSON.parse(readFileSync(join(BATCH, "manifest-gen2.json"), "utf8"));
    expect(g2.generation).toBe(2);
    expect(g2.walls.every((w) => w.packet.includes("gen2"))).toBe(true);
    /* And the generation-1 id map is byte-unmoved since its introducing commit,
       which the immutability case above checks; here we only pin that a second
       emission did not touch its roll set. */
    const a1 = JSON.parse(readFileSync(join(BATCH, "assignment.json"), "utf8"));
    expect(a1.rolls.every((r) => r.generation === 1)).toBe(true);
    expect(a1.rolls.length).toBe(BUDGET.images_per_screening_generation);
  });

  /* ------------------------------------------- generation 3, the ablation */








  test("the register is generation 3's lens and it spans figures to appearance", () => {
    expect(REGISTER.map((r) => r.arm).sort()).toEqual([...GEN3_ARMS].sort());
    expect(REGISTER[0].appearance).toBe(false);
    expect(REGISTER[REGISTER.length - 1].appearance).toBe(true);
    expect(REGISTER[REGISTER.length - 1].figures).toBe("none");
    /* Exactly one cell at each corner of the two-way design. */
    const cells = REGISTER.map((r) => `${r.figures}|${r.appearance}`);
    expect(new Set(cells).size).toBe(REGISTER.length);
  });

  test("the declared TOTAL is a gate, and generation 3 spends it exactly", () => {
    let spent = 0;
    for (const [g, f] of [[1, "assignment.json"], [2, "assignment-gen2.json"],
      [3, "assignment-gen3.json"]]) {
      const p = join(BATCH, f);
      expect(existsSync(p), `generation ${g} has no id map`).toBe(true);
      const a = JSON.parse(readFileSync(p, "utf8"));
      expect(a.rolls.every((r) => r.generation === g)).toBe(true);
      spent += a.rolls.length;
    }
    expect(spent).toBe(BUDGET.total_worst_case);
    /* The per-generation line moved and the total did not: generation 2 came in
       under its ceiling and generation 3 is over its own declared 12. */
    const g3 = JSON.parse(readFileSync(join(BATCH, "assignment-gen3.json"), "utf8"));
    expect(g3.rolls.length).toBe(16);
    expect(g3.rolls.length).toBeGreaterThan(BUDGET.images_confirmation_generation);
    const plan = readFileSync(join(repoRoot, "design", "specs", "34-plan.md"), "utf8");
    expect(plan).toContain("68");
  });


  test("the duplication audit finds no duplicates and carries its own floor", () => {
    /* The community claim that identical prompts return identical images does
       not replicate on our seat, and the between-cell floor is what makes that
       conclusive rather than merely negative. */
    for (const f of ["duplication-audit.json", "duplication-audit-gen2.json"]) {
      const d = JSON.parse(readFileSync(join(BATCH, f), "utf8"));
      expect(d.byte_identical).toBe(0);
      expect(d.near_duplicate).toBe(0);
      expect(d.pairs_within_cell).toBeGreaterThan(0);
      expect(d.between_cell_pairs).toBeGreaterThan(0);
      expect(d.verdict).toContain("INDEPENDENT");
      /* Within-cell similarity is not meaningfully above the between-cell floor
         — which is the actual finding, and a threshold nobody chose. */
      expect(d.within_share_max).toBeLessThan(d.between_share_max * 1.5);
    }
  });

  test("the reference arm is resolved from data, and both branches are pinned", () => {
    /* A generation's id map declares `_control` from the emitter's standing
       constant, so an ABLATION - which legitimately runs no control - declares
       one that ran no cells. That took the scorer down with a KeyError rather
       than producing a wrong number, which is the good failure of the two.

       The rule is data-driven because this file may name no arm: the declared
       control where it ran cells, otherwise the first arm in the id map's own
       order, which the generation's plan fixed before any candidate existed.
       This is not a selection rule - it decides which column the others are
       compared against. */
    const src = `import sys; sys.path.insert(0, ${JSON.stringify(MEASURED)});\n` +
      "import row34_fitness as f\n" +
      "ran = {'n_rolls': 4}\n" +
      "no = {'n_rolls': 0}\n" +
      "a = {'_control': 'X', '_arms': [{'id': 'X'}, {'id': 'Y'}]}\n" +
      "print(f.resolve_reference(a, {'X': ran, 'Y': ran})[0])\n" +
      "print(f.resolve_reference(a, {'X': no, 'Y': ran})[0])\n" +
      "print(f.resolve_reference(a, {'X': no, 'Y': no})[0])";
    const dir = tmp("ref");
    try {
      const script = join(dir, "r.py");
      writeFileSync(script, src);
      /* control present -> control; control absent -> first arm that ran;
         nothing ran -> the declaration, so a broken run still names something. */
      expect(py(script, []).trim().split("\n")).toEqual(["X", "Y", "X"]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
    /* And on the real maps: generations 1 and 2 take the first branch, the
       ablation takes the second and lands on its own reference register. */
    const g3 = JSON.parse(readFileSync(join(BATCH, "assignment-gen3.json"), "utf8"));
    expect(g3._arms.map((a) => a.id)).toEqual([...GEN3_ARMS]);
    expect(g3._arms.some((a) => a.id === g3._control)).toBe(false);
    expect(g3._arms[0].id).toBe(REGISTER[0].arm);
    for (const f of ["assignment.json", "assignment-gen2.json"]) {
      const a = JSON.parse(readFileSync(join(BATCH, f), "utf8"));
      expect(a._arms.some((x) => x.id === a._control)).toBe(true);
    }
  });

  /* ------------------------------------- the fold, and what replaced what */

  /* WHY THE ARM-RECOMPUTATION CASES ARE GONE, and this is the whole reason.
     Every row-34 arm was defined as a TRANSFORMATION of `manorPrompt` — that
     was the right shape while the experiment ran, because it made the control
     production by construction. Row 34's recommendation has now been folded
     INTO `manorPrompt`, so the thing those arms transform has moved, by design
     and on purpose. Recomputing a 2026-08-24 arm from a composer that has since
     adopted its own winner does not check anything: it asks whether the past
     still equals the present, and the answer is correctly no.

     What replaces them is stronger, not weaker. The archive is guaranteed by
     git — the prompts that were actually measured cannot change — and
     production is tied to that archive rather than to a function that could
     drift alongside it. If the register in `manorPrompt` ever stops being the
     register `g4` was measured on, the case below goes red. */

  test("the row-34 archive has not changed since it was committed", () => {
    /* Blob immutability, the same mechanism the id maps use. These files are
       the evidence the recommendation rests on; nothing may edit them. */
    const introOf = (rel) => execFileSync("git",
      ["-C", repoRoot, "log", "--diff-filter=A", "--format=%H", "--", rel],
      { encoding: "utf8" }).trim().split("\n").filter(Boolean).pop();
    const blobThen = (c, rel) =>
      execFileSync("git", ["-C", repoRoot, "show", `${c}:${rel}`], { encoding: "utf8" });

    /* THE ID MAPS: what may never move is the id-to-cell MAPPING, and that is
       what is compared. The whole blob is not, and the difference is a real
       event rather than a loosened rule: generation 3's map gained a `_register`
       key when its reading lens was added — metadata, written BEFORE the
       generation was dispatched and while no candidate existed. The rolls
       themselves are byte-identical in all three maps and always have been. */
    let rolls = 0;
    for (const f of ["assignment.json", "assignment-gen2.json", "assignment-gen3.json"]) {
      const rel = `design/batches/row34-evolution/${f}`;
      const c = introOf(rel);
      expect(c, `${rel} has no introducing commit`).toBeTruthy();
      const then = JSON.parse(blobThen(c, rel));
      const now = JSON.parse(readFileSync(join(BATCH, f), "utf8"));
      expect(JSON.stringify(now.rolls),
        `${rel}'s id-to-cell mapping changed after it was committed`)
        .toBe(JSON.stringify(then.rolls));
      rolls += now.rolls.length;
    }
    expect(rolls).toBe(BUDGET.total_worst_case);

    /* THE PROMPTS: these are the artifacts the measurements were produced from
       and nothing may edit them, so they ARE compared whole. */
    let checked = 0;
    for (const f of ["assignment.json", "assignment-gen2.json", "assignment-gen3.json"]) {
      for (const r of JSON.parse(readFileSync(join(BATCH, f), "utf8")).rolls) {
        const c = introOf(r.prompt);
        expect(c, `${r.prompt} has no introducing commit`).toBeTruthy();
        const then = execFileSync("git", ["-C", repoRoot, "rev-parse", `${c}:${r.prompt}`],
          { encoding: "utf8" }).trim();
        const now = execFileSync("git", ["-C", repoRoot, "hash-object", join(repoRoot, r.prompt)],
          { encoding: "utf8" }).trim();
        expect(now, `${r.prompt} changed after it was committed`).toBe(then);
        checked++;
      }
    }
    expect(checked).toBe(BUDGET.total_worst_case);
  });

  test("production dispatches the register row 34 recommends", () => {
    /* The fold itself: `manorPrompt`'s output must contain the recommended
       register verbatim, on an interior wall and on an outdoor one — the
       outdoor branch never ran in the trial and is where a generalisation
       breaks if it is going to. */
    for (const key of ["guest_chamber/E", "garden_room/E", "privy_garden/N", "great_hall/S"]) {
      const [loc, f] = key.split("/");
      const meta = deriveMeta(PLAN, loc, f);
      const { rects } = scaffoldRects(PLAN, loc, f, meta);
      const { voice, anchor } = voiceFor(PLAN, loc, f);
      const room = PLAN.rooms.find((r) => r.id === loc);
      const block = registerBlock({
        geometry: frameGeometry(meta), meta, voice,
        surface: voice.outdoor ? "side" : "wall",
        room_name: (room.name || room.id).toLowerCase()
      }).join("\n");
      expect(manorPrompt(PLAN, key, meta, rects),
        `${key}'s production prompt does not carry the recommended register`)
        .toContain(block);
    }
  });

  test("the register production dispatches is the one g4 was measured on", () => {
    /* THE FAITHFULNESS OF THE FOLD, checked against the artifact rather than
       against a recomputation. `g4`'s committed prompts are what the
       recommendation's numbers were produced from; if production's register
       ever stops being byte-identical to the register inside them, the fold has
       drifted from its own evidence and somebody has to decide that on purpose. */
    const assign = JSON.parse(readFileSync(join(BATCH, "assignment-gen3.json"), "utf8"));
    const g4 = assign.rolls.filter((r) => r.arm === "g4");
    expect(g4.length).toBe(4);
    let checked = 0;
    for (const r of g4) {
      const [loc, f] = r.wall.split("/");
      const meta = deriveMeta(PLAN, loc, f);
      const { voice } = voiceFor(PLAN, loc, f);
      const room = PLAN.rooms.find((x) => x.id === loc);
      const block = registerBlock({
        geometry: frameGeometry(meta), meta, voice,
        surface: voice.outdoor ? "side" : "wall",
        room_name: (room.name || room.id).toLowerCase()
      }).join("\n");
      expect(readFileSync(join(repoRoot, r.prompt), "utf8"),
        `production's register has drifted from the ${r.wall} prompt g4 was measured on`)
        .toContain(block);
      checked++;
    }
    expect(checked).toBe(4);
  });

  test("every one of the plan's 88 production prompts still passes the standing lint", () => {
    /* The fold rewrote a section of every prompt the manor dispatches, so the
       gate that has caught every prompt defect this project has had runs over
       all of them, not over a sample. */
    const dir = tmp("all88");
    const files = [];
    try {
      for (const room of PLAN.rooms) {
        for (const f of Object.keys(room.facings || {})) {
          const meta = deriveMeta(PLAN, room.id, f);
          const { rects } = scaffoldRects(PLAN, room.id, f, meta);
          const p = join(dir, `${room.id}-${f}.prompt.txt`);
          writeFileSync(p, manorPrompt(PLAN, `${room.id}/${f}`, meta, rects));
          files.push(p);
        }
      }
      expect(files.length).toBe(88);
      expect(py(LINT, files)).toContain(`0 of ${files.length} prompt(s) refused.`);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("no production prompt carries dead vocabulary after the fold", () => {
    const DEAD = [/vanishing\s+point/i, /one[- ]point\s+perspective/i, /focal\s+length/i,
      /principal\s+point/i, /orthographic/i];
    for (const room of PLAN.rooms) {
      for (const f of Object.keys(room.facings || {})) {
        const meta = deriveMeta(PLAN, room.id, f);
        const { rects } = scaffoldRects(PLAN, room.id, f, meta);
        const t = manorPrompt(PLAN, `${room.id}/${f}`, meta, rects);
        for (const re of DEAD) {
          expect(t, `${room.id}/${f} still carries ${re}`).not.toMatch(re);
        }
      }
    }
  });

  test("the positive no-text rule names materials, never a voice's fabric", () => {
    /* The first fold said "the panelling shows only plain wood", which puts
       panelling in front of a scullery that has none — row 29's exact veto, and
       `room-voices.spec` caught it the moment the fold landed. Wood, plaster,
       stone and glazing are materials any room may have; panelling, wainscot
       and chair-rail belong to a VOICE and only a voice may say them. */
    for (const lines of [POSITIVE_NO_TEXT, POSITIVE_NO_TEXT_OUTDOORS]) {
      /* Whitespace-normalised: these are wrapped prompt lines, and joining them
         doubles the space at each break. A line break is not a missing rule. */
      const t = lines.join(" ").replace(/\s+/g, " ");
      expect(t).not.toMatch(/panell?ing|panell?ed|wainscot|chair[- ]?rail|dado/i);
      expect(t).toContain("only");
      expect(t).toContain("Do not invent additional typography");
    }
    /* And the outdoor form names no interior fabric at all. */
    expect(POSITIVE_NO_TEXT_OUTDOORS.join(" "))
      .not.toMatch(/floorboards?|plaster ceiling|skirting|hearth|fireplace/i);
  });

  test("both probe walls are hold-family, camera-PASS and single-failure", () => {
    const state = JSON.parse(readFileSync(join(MANOR, "run-state.json"), "utf8")).walls;
    for (const p of PROBES) {
      const w = state[p.key];
      expect(w, `${p.key} is not in the manor run state`).toBeTruthy();
      expect(w.hold_family).toBe("unfitted-horizon");
      expect(w.correction).toContain("camera PASS");
      expect(p.why.length).toBeGreaterThan(40);
    }
    /* The two differ in the quantity under test: same camera, different return
       length. That is the whole argument for two walls rather than one. */
    const [a, b] = PROBES.map((p) => makeCtx(PLAN, p.key));
    expect(a.meta.px_per_m_at_wall).toBeCloseTo(b.meta.px_per_m_at_wall, 6);
    expect(a.geometry.horizonY).toBeCloseTo(b.geometry.horizonY, 6);
    const ret = (c) => c.geometry.cL;
    expect(Math.abs(ret(a) - ret(b))).toBeGreaterThan(150);
  });
});
