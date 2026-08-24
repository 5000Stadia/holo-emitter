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
  ARMS, ARM_IDS, GEN1_ARMS, CONTROL_ARM, PROBES, PLAN, SPECTRUM, HEADLINE_PAIRING,
  AMPLIFICATION, CHANNELS, makeCtx, armPrompt, edgeMarks, frameGeometry,
  vanishingPoint, frameExit, parseSections, renderSections, positionWord,
  V5_SUBSTITUTIONS, V2_DEMOTION_LINES, M4_DEMOTION_LINES, IMAGE2_LINES, crossings,
  junctionTable, wallGridBlock, drawInstructions
} from "../../tools/evolution-arms.mjs";
import { manorPrompt, scaffoldRects, chairRail } from "../../tools/make-scaffold.mjs";
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
  test("every arm composes for both probe walls and prompt_lint accepts all fourteen", () => {
    const dir = tmp("lint");
    const files = [];
    try {
      for (const key of KEYS) {
        const ctx = ctxFor(key);
        for (const id of GEN1_ARMS) {
          const text = armPrompt(id, ctx);
          expect(text.length, `${id} on ${key} composed nothing`).toBeGreaterThan(200);
          const p = join(dir, `${key.replace("/", "-")}__${id}.prompt.txt`);
          writeFileSync(p, text);
          files.push(p);
        }
      }
      expect(files.length).toBe(GEN1_ARMS.length * KEYS.length);
      const out = py(LINT, files);
      expect(out, `prompt_lint refused an arm's prompt:\n${out}`)
        .toContain(`0 of ${files.length} prompt(s) refused.`);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("the emitted prompts on disk are the composers' own, and they lint", () => {
    const assign = JSON.parse(readFileSync(join(BATCH, "assignment.json"), "utf8"));
    const byWall = {};
    for (const key of KEYS) byWall[key] = ctxFor(key);
    let checked = 0;
    for (const roll of assign.rolls) {
      const p = join(repoRoot, roll.prompt);
      expect(existsSync(p), `${roll.prompt} is not on disk`).toBe(true);
      expect(readFileSync(p, "utf8")).toBe(armPrompt(roll.arm, byWall[roll.wall]));
      checked++;
    }
    expect(checked).toBe(BUDGET.images_per_screening_generation);
  });

  /* ---------------------------------------------------------------- 2 */
  test("the control is production, and it is one call rather than a copy", () => {
    /* THE OBVIOUS FORM OF THIS CHECK CANNOT FAIL, and saying so is the point.
       Comparing `armPrompt(control, ctx)` against `manorPrompt(...)` compares a
       function with itself: the control IS that call, so the assertion is true
       whatever production does — including when production drifts, which is the
       one thing it was meant to catch. Two checks that can fail replace it.

       One: the control's composer is a single delegation, so it can never
       quietly become a transformation with a copy of production's text in it. */
    const src = ARMS[CONTROL_ARM].prompt.toString();
    expect(src).toContain("manorPrompt(");
    expect(src).not.toMatch(/parseSections|replaceSection|appendTo|substituteLine/);
    expect(src.split("\n").filter((l) => l.trim() && !l.trim().startsWith("/*")
      && !l.trim().startsWith("*")).length).toBeLessThanOrEqual(3);

    /* Two: what production returns today for these walls is what is on disk as
       the control's committed prompt — which is the case above, "the emitted
       prompts on disk are the composers' own", and it DOES go red when
       `manorPrompt` moves. Here we only pin that the control's own arguments
       are the plan's, so a ctx bug could not silently feed it something else. */
    for (const key of KEYS) {
      const [loc, f] = key.split("/");
      const meta = deriveMeta(PLAN, loc, f);
      const { rects } = scaffoldRects(PLAN, loc, f, meta);
      const ctx = ctxFor(key);
      expect(ctx.meta).toEqual(meta);
      expect(ctx.rects).toEqual(rects);
      expect(armPrompt(CONTROL_ARM, ctx)).toBe(manorPrompt(PLAN, key, meta, rects));
    }
  });

  test("each arm's declared diff is the whole difference from its parent", () => {
    for (const key of KEYS) {
      const ctx = ctxFor(key);
      const control = armPrompt(CONTROL_ARM, ctx).split("\n");
      const v1 = armPrompt("v1", ctx).split("\n");
      const v2 = armPrompt("v2", ctx).split("\n");
      const v5 = armPrompt("v5", ctx).split("\n");
      const v6 = armPrompt("v6", ctx).split("\n");

      /* v2 = v1 plus exactly the two declared demotion lines. */
      const added = v2.filter((l) => !v1.includes(l));
      expect(added.sort()).toEqual(
        [V2_DEMOTION_LINES.input, V2_DEMOTION_LINES.geometry].sort());
      expect(v1.filter((l) => !v2.includes(l))).toEqual([]);

      /* v5 = the control with exactly the declared substitution set. */
      const gone = v5.filter((l) => !control.includes(l));
      const came = control.filter((l) => !v5.includes(l));
      expect(gone.sort()).toEqual(V5_SUBSTITUTIONS.map(([, to]) => to).sort());
      expect(came.sort()).toEqual(V5_SUBSTITUTIONS.map(([from]) => from).sort());

      /* v6 = the control plus a camera paragraph and nothing removed. */
      expect(control.filter((l) => !v6.includes(l))).toEqual([]);
      expect(v6.length).toBeGreaterThan(control.length);
    }
  });

  test("v7 says what the frame ruled: image orients, text articulates", () => {
    for (const key of KEYS) {
      const ctx = ctxFor(key);
      const text = armPrompt("v7", ctx);
      /* The image is declared as orientation and is told it carries no number. */
      expect(text).toContain("here to ORIENT you");
      expect(text).toContain("not measured and it is not to scale");
      expect(text).toContain("It carries no measurement at all");
      /* And it is never asked to carry precision: the control's two sentences
         that hand precision to the image are gone. */
      expect(text).not.toContain("Reproduce Image 2's camera exactly");
      expect(text).not.toContain("paint that feature inside its box");
      expect(text).not.toContain(IMAGE2_LINES.input_labels);
      /* Every carrier the plan draws is named with BOTH its metres and its
         pixel columns, which is the articulation half of the ruling. */
      for (const r of ctx.rects) {
        expect(text).toContain(`column ${Math.round(r.x0)} to column ${Math.round(r.x1)}`);
        expect(text).toContain(`${r.from_m.toFixed(2)} m to ${r.to_m.toFixed(2)} m`);
      }
      /* And the eye line, which is the quantity the row measures. */
      const row = Math.round(ctx.geometry.horizonY);
      expect(text).toContain(`converge exactly at row ${row}`);
    }
  });

  test("v7's element names are derived from the box, never typed", () => {
    const g = { bounded: true, cL: 0, cR: 1000 };
    const at = (c) => positionWord({ x0: c - 10, x1: c + 10 }, g);
    expect(at(50)).toBe("at the far left of");
    expect(at(300)).toBe("left of centre in");
    expect(at(500)).toBe("at the centre of");
    expect(at(700)).toBe("right of centre in");
    expect(at(950)).toBe("at the far right of");
    /* And the real door on the real wall resolves through the same function. */
    const ctx = ctxFor("garden_room/E");
    expect(ctx.rects.length).toBe(1);
    expect(armPrompt("v7", ctx))
      .toContain(`${positionWord(ctx.rects[0], ctx.geometry)} Image 2 is the door`);
  });

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
  test("the exhaustive geometry is the plan's, recomputed independently", () => {
    for (const key of KEYS) {
      const [loc, f] = key.split("/");
      const meta = deriveMeta(PLAN, loc, f);
      const text = armPrompt("v1", ctxFor(key));
      const W = 1536, H = 1024;
      /* Every number below comes from groundplane and facingCarriers here, not
         from frameGeometry, so a bug shared by the composer and this test would
         have to exist in two independently written places. */
      const floorY = Math.round(meta.floor_line_y * meta.image_h_px);
      const ceilY = Math.round(meta.floor_line_y * meta.image_h_px
        - meta.storey_height_m * meta.px_per_m_at_wall);
      const horizon = Math.round(meta.horizon_y * meta.image_h_px);
      const railY = Math.round(meta.floor_line_y * meta.image_h_px
        - 0.95 * meta.px_per_m_at_wall);
      expect(text).toContain(`horizontal line at row ${floorY}`);
      expect(text).toContain(`horizontal line at row ${ceilY}`);
      expect(text).toContain(`EYE LINE - row ${horizon}`);
      expect(text).toContain(`at row ${railY}`);
      expect(text).toContain(`column ${Math.round(meta.corner_x0_px)} and ` +
        `column ${Math.round(meta.corner_x1_px)}`);
      expect(text).toContain(`spans ${Math.round(meta.px_per_m_at_wall)} pixels`);

      /* The junction endpoints, recomputed the way drawGrid computes them. */
      const sB = meta.px_per_m_at_bottom;
      const vpx = groundplane.wallCentrePx(meta, W);
      for (const [u, cx] of [[0, meta.corner_x0_px], [1, meta.corner_x1_px]]) {
        const xb = groundplane.xAtScale(u, sB, meta, W);
        const exit = frameExit({ x: cx, y: floorY },
          { x: 2 * cx - xb, y: 2 * floorY - H });
        expect(text, `${key} return floor junction`).toContain(
          `to column ${Math.round(exit.x)}, row ${Math.round(exit.y)}`);
      }
      /* And they converge where the composer says, at the frame's own centre
         column on the declared horizon row. */
      const vp = vanishingPoint(meta);
      expect(vp.x).toBeCloseTo(vpx, 3);
      expect(vp.y).toBeCloseTo(meta.horizon_y * meta.image_h_px, 6);
      expect(text).toContain(`meet at column ${Math.round(vp.x)}, row ${Math.round(vp.y)}`);

      /* Each carrier, in metres AND columns. */
      for (const c of facingCarriers(PLAN, loc, f)) {
        if (!["door", "window", "fireplace"].includes(c.kind)) continue;
        expect(text).toContain(`${c.from_m.toFixed(2)} m to ${c.to_m.toFixed(2)} m`);
      }
    }
  });

  test("v1 carries no layout image and no reference to one", () => {
    expect(ARMS.v1.images()).toEqual(["style-seed-warm.png"]);
    for (const key of KEYS) {
      const text = armPrompt("v1", ctxFor(key));
      expect(text).toContain("There is no layout image");
      expect(text).not.toContain("Image 2");
    }
  });

  test("the no-lettering constraint is in every arm, because nothing measures it", () => {
    /* Plan §0 item 3: the instrument has no text_painted detector, so a painted
       label is a silent pass. The only guard is the ask, and this case is it. */
    for (const key of KEYS) {
      for (const id of ARM_IDS) {
        /* Every arm of every generation. Whitespace-normalised: the constraint is wrapped across lines in the
           arms whose text is long, and a line break is not a missing rule. */
        const flat = armPrompt(id, ctxFor(key)).replace(/\s+/g, " ");
        expect(flat, `${id} on ${key} dropped the no-lettering constraint`)
          .toContain("no line, letter, word, number, label, watermark or border of any kind");
      }
    }
  });

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
  test("the spectrum spans image-carries-all to text-carries-all and covers every arm", () => {
    expect(SPECTRUM.map((s) => s.arm).sort()).toEqual([...ARM_IDS].sort());
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

  test("every generation-2 arm composes for both walls and prompt_lint accepts all twelve", () => {
    const plan = JSON.parse(readFileSync(join(BATCH, "generation-2-plan.json"), "utf8"));
    const dir = tmp("lint2");
    const files = [];
    try {
      for (const key of KEYS) {
        const ctx = ctxFor(key);
        for (const a of plan.arms) {
          const p = join(dir, `${key.replace("/", "-")}__${a.arm}.prompt.txt`);
          writeFileSync(p, armPrompt(a.arm, ctx));
          files.push(p);
        }
      }
      expect(files.length).toBe(plan.arms.length * KEYS.length);
      expect(py(LINT, files)).toContain(`0 of ${files.length} prompt(s) refused.`);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("an amplified arm is its parent plus exactly its declared amplification", () => {
    for (const key of KEYS) {
      const ctx = ctxFor(key);
      for (const id of ARM_IDS.filter((x) => ARMS[x].amplified)) {
        const parent = ARMS[id].parent;
        const before = armPrompt(parent, ctx).split("\n");
        const after = armPrompt(id, ctx).split("\n");
        /* Nothing is removed — an amplification that dropped a line would be a
           different arm wearing its parent's name. */
        expect(before.filter((l) => !after.includes(l)),
          `${id} removed a line its parent ${parent} had`).toEqual([]);
        const added = after.filter((l) => !before.includes(l));
        expect(added.length, `${id} added nothing to ${parent}`).toBeGreaterThan(0);
        /* And the channel triple did not move: amplification pushes an arm's
           defining channel harder, it does not change which channel that is. */
        for (const c of CHANNELS) expect(ARMS[id].channels[c]).toBe(ARMS[parent].channels[c]);
        expect(AMPLIFICATION[parent], `${parent} has no declared mutation`).toBeTruthy();
      }
    }
  });

  test("v2A's amplification is the junction table AND the wall's own grid", () => {
    /* The declared ladder's own words add no number v2 did not already state —
       `cameraBlock` gives all four junctions by both endpoints in prose — so the
       grid is the extension that makes this an amplification rather than a
       reformat. Plan §6a records it; this pins that both halves are present. */
    for (const key of KEYS) {
      const ctx = ctxFor(key);
      const text = armPrompt("v2A", ctx);
      for (const line of junctionTable(ctx)) expect(text).toContain(line.trim());
      for (const line of wallGridBlock(ctx)) expect(text).toContain(line.trim());
      /* The grid's numbers are the scaffold's own stamping functions, recomputed
         here from the meta rather than through the composer. */
      const m = ctx.meta;
      const g = ctx.geometry;
      for (let x = 0; x <= Math.floor(g.wall_width_m + 1e-9); x++) {
        const col = Math.round(groundplane.wallCentrePx(m, 1536)
          + (x - m.wall_width_m / 2) * m.px_per_m_at_wall);
        expect(text).toContain(`${x} m = column ${col}`);
      }
      for (const h of [0.5, 1.0, 1.5, 2.0]) {
        const row = Math.round(m.floor_line_y * m.image_h_px - h * m.px_per_m_at_wall);
        expect(text).toContain(`${h.toFixed(1)} m = row ${row}`);
      }
    }
  });

  test("v6A's waypoints lie on the junction lines and converge where the rest do", () => {
    for (const key of KEYS) {
      const ctx = ctxFor(key);
      const text = armPrompt("v6A", ctx);
      const g = ctx.geometry;
      const vp = vanishingPoint(ctx.meta);
      for (const [, s] of [["left", g.left], ["right", g.right]]) {
        for (const j of [s.ceiling, s.floor]) {
          if (!j || !j.to) continue;
          for (const t of [0.25, 0.5, 0.75]) {
            const x = Math.round(j.from.x + t * (j.to.x - j.from.x));
            const y = Math.round(j.from.y + t * (j.to.y - j.from.y));
            expect(text, `${key} waypoint ${t} off its own line`)
              .toContain(`at column ${x} it is at row ${y}`);
          }
        }
      }
      expect(text).toContain(`passes through`);
      expect(text).toContain(`column ${Math.round(vp.x)}, row ${Math.round(vp.y)}`);
    }
  });

  test("m4's demotion is scoped, because a blanket one would be a false sentence", () => {
    /* m4 carries PRODUCTION text geometry, which does not state every number, so
       v2's "the text governs every number" would be untrue in it. It demotes the
       image for the CAMERA alone, which its own text does construct in full. */
    for (const key of KEYS) {
      const text = armPrompt("v2xv6m4", ctxFor(key));
      expect(text).toContain(M4_DEMOTION_LINES.input);
      expect(text).toContain(M4_DEMOTION_LINES.camera);
      expect(text).not.toContain(V2_DEMOTION_LINES.geometry);
      expect(text).not.toContain("Geometry, exact, in pixels and in metres");
    }
    /* m2 keeps the image primary: production's own Image-2 declaration survives
       intact and the exhaustive text is added on top of it. */
    for (const key of KEYS) {
      const text = armPrompt("v2xv6m2", ctxFor(key));
      expect(text).toContain(IMAGE2_LINES.input_labels);
      expect(text).toContain("Geometry, exact, in pixels and in metres");
      expect(text).toContain("frontal one-point perspective");
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
      expect(readFileSync(join(repoRoot, r.prompt), "utf8"))
        .toBe(armPrompt(r.arm, byWall[r.wall]));
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
