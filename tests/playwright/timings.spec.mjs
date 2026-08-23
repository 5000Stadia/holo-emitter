/* Row 33 — the pipeline's own stopwatch.
 *
 * [HUMAN, 2026-08-24, verbatim] "Lets track length of time for each step and ask
 * how can this be faster while maintaining quality"
 *
 * THREE THINGS ARE ON TRIAL HERE AND EACH HAS AN ARM THAT CAN FAIL.
 *
 *  1. The writer's concurrency. Eight processes — four python, four node —
 *     append to one ledger at once. The claim is that a single `write()` under
 *     `O_APPEND` cannot interleave, and the way that claim fails is a torn
 *     line, so the count and the parse are both asserted. A reader that
 *     repaired lines would make this unfalsifiable, which is why the analyzer
 *     drops and counts them instead.
 *
 *  2. The analyzer's two detectors. A synthetic ledger carries a PLANTED idle
 *     gap and a PLANTED regression, and both must be found and named with their
 *     numbers. Each one then runs again with the defect removed and must find
 *     NOTHING — a detector that fires on the clean ledger too has not detected
 *     anything. The idle arm gets a third control: the same gap with the work
 *     already terminal must come back QUIET, because a pipeline with nothing to
 *     do is not a pipeline that is failing.
 *
 *  3. The instrumentation is really wired. Not "the file imports the writer" —
 *     the tools are RUN, and the records they leave are read back.
 *
 * The suite itself never writes the real ledger: `playwright.config.mjs` sets
 * `HOLO_TIMINGS=off` for every spec and every subprocess a spec spawns, and
 * this file overrides it per call with a temp path.
 */
import { test, expect } from "@playwright/test";
import { repoRoot } from "./helpers.mjs";
import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync, spawn } from "node:child_process";

const MEASURED = join(repoRoot, "design", "plan-draft", "measured");
const REPORT = join(MEASURED, "timings_report.py");
const WRITER_PY = join(MEASURED, "timings.py");
const WRITER_JS = join(repoRoot, "tools", "timings.mjs");

function scratch() {
  return mkdtempSync(join(tmpdir(), "holo-timings-"));
}

/** The analyzer, run over a ledger, returning its markdown. */
function analyze(ledger, extra = []) {
  return execFileSync("python3", [REPORT, "--ledger", ledger, "--out", "-", ...extra],
    { cwd: repoRoot, encoding: "utf8", env: { ...process.env, HOLO_TIMINGS: "off" } });
}

/** One JSONL line per record. */
function writeLedger(path, recs) {
  writeFileSync(path, recs.map((r) => JSON.stringify(r)).join("\n") + "\n");
}

/* A synthetic run: one wall emitted, a burst of steps, a hole, another burst.
 * `gapSeconds` of nothing is the plant; `fillGap` removes it. */
function syntheticRun({ gapSeconds = 4 * 3600, fillGap = false, terminal = false } = {}) {
  const t0 = 1_700_000_000;
  const recs = [];
  const push = (step, a, len, key, detail = {}) =>
    recs.push({ ts_start: a, ts_end: a + len, step, key, detail });

  push("emit.facing", t0, 0.02, "planted/N");
  push("emit.packet", t0 + 0.02, 0.01, "planted/N", { roll_ids: ["r1"] });
  for (let i = 0; i < 6; i++) {
    push("measure.candidate", t0 + 10 + i * 4, 3, "planted/N",
      { roll_id: `pre${i}`, verdict: "PASS" });
  }
  const resume = t0 + 40 + gapSeconds;
  if (fillGap) {
    /* The gap, paved over with work. Same ledger otherwise. */
    for (let a = t0 + 40; a < resume; a += 60) {
      push("measure.candidate", a, 30, "planted/N", { roll_id: `fill${a}`, verdict: "PASS" });
    }
  }
  if (terminal) push("promote.wall", t0 + 39, 0.5, "planted/N", { refused: false });
  for (let i = 0; i < 6; i++) {
    push("measure.candidate", resume + i * 4, 3, "planted/N",
      { roll_id: `post${i}`, verdict: "PASS" });
  }
  return { recs, t0, resume };
}

function runStateFile(dir, status) {
  const p = join(dir, "run-state.json");
  writeFileSync(p, JSON.stringify({ walls: { "planted/N": { attempts: 1, status } } }));
  return p;
}

/* ------------------------------------------------------------------ */
test.describe("row 33 — the writer under concurrent processes", () => {
  test("eight processes append 2000 records and not one line is torn", async () => {
    const dir = scratch();
    try {
      const ledger = join(dir, "concurrent.jsonl");
      const N = 250, PROCS = 4;
      const payload = "x".repeat(400);   // fat enough to be worth tearing, inside PIPE_BUF
      const jobs = [];
      for (let p = 0; p < PROCS; p++) {
        jobs.push(["python3", ["-c",
          `import sys; sys.path.insert(0, ${JSON.stringify(MEASURED)}); import timings\n` +
          `for i in range(${N}):\n` +
          `    timings.record("concurrent.py", 1000.0 + i, 1000.5 + i, key="py${p}",` +
          `                   detail={"i": i, "pad": ${JSON.stringify(payload)}},` +
          `                   path=${JSON.stringify(ledger)})\n`]]);
        jobs.push(["node", ["--input-type=module", "-e",
          `import * as t from ${JSON.stringify(WRITER_JS)};\n` +
          `for (let i = 0; i < ${N}; i++) t.record("concurrent.js", 1000 + i, 1000.5 + i,` +
          ` "js${p}", { i, pad: ${JSON.stringify(payload)} }, { path: ${JSON.stringify(ledger)} });\n`]]);
      }
      const done = jobs.map(([cmd, args]) => new Promise((res, rej) => {
        const c = spawn(cmd, args, { cwd: repoRoot, stdio: ["ignore", "ignore", "pipe"] });
        let err = "";
        c.stderr.on("data", (d) => { err += d; });
        c.on("close", (code) => code === 0 ? res() : rej(new Error(`${cmd} exited ${code}: ${err}`)));
      }));
      await Promise.all(done);
      {
        const lines = readFileSync(ledger, "utf8").split("\n").filter((l) => l.length);
        expect(lines.length,
          "a lost or merged line is the writer's atomicity claim failing").toBe(2 * PROCS * N);
        let bad = 0;
        for (const l of lines) {
          try {
            const r = JSON.parse(l);
            if (typeof r.ts_start !== "number" || typeof r.ts_end !== "number" ||
                typeof r.step !== "string" || r.detail.pad !== payload) bad++;
          } catch { bad++; }
        }
        expect(bad, "torn or malformed lines under concurrent appenders").toBe(0);
        /* And the two writers agree about the shape, which is what lets one
           ledger hold both halves of the pipeline. */
        const py = lines.map(JSON.parse).find((r) => r.step === "concurrent.py");
        const js = lines.map(JSON.parse).find((r) => r.step === "concurrent.js");
        expect(Object.keys(py).sort()).toEqual(Object.keys(js).sort());
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("a record too big for one atomic write loses its detail, never its clock", () => {
    const dir = scratch();
    try {
      const ledger = join(dir, "fat.jsonl");
      execFileSync("python3", ["-c",
        `import sys; sys.path.insert(0, ${JSON.stringify(MEASURED)}); import timings\n` +
        `timings.record("fat.step", 1.0, 2.0, key="k", detail={"pad": "y" * 20000},` +
        `               path=${JSON.stringify(ledger)})\n`], { cwd: repoRoot });
      const lines = readFileSync(ledger, "utf8").split("\n").filter((l) => l.length);
      expect(lines.length, "one record is one line, whatever its detail").toBe(1);
      expect(Buffer.byteLength(lines[0], "utf8")).toBeLessThanOrEqual(4096);
      const r = JSON.parse(lines[0]);
      expect(r.step).toBe("fat.step");
      expect(r.ts_start).toBe(1.0);
      expect(r.ts_end).toBe(2.0);
      expect(r.detail._truncated, "the truncation says so in the record itself").toBeTruthy();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("HOLO_TIMINGS=off silences both writers, which is what keeps the suite out "
     + "of the committed ledger", () => {
    const dir = scratch();
    try {
      const ledger = join(dir, "never.jsonl");
      const env = { ...process.env, HOLO_TIMINGS: "off" };
      execFileSync("python3", ["-c",
        `import sys; sys.path.insert(0, ${JSON.stringify(MEASURED)}); import timings\n` +
        `assert timings.ledger_path() is None\n` +
        `timings.record("silent", 1.0, 2.0)\n`], { cwd: repoRoot, env });
      execFileSync("node", ["--input-type=module", "-e",
        `import * as t from ${JSON.stringify(WRITER_JS)};\n` +
        `if (t.ledgerPath() !== null) throw new Error("node writer is not silent");\n` +
        `t.record("silent", 1, 2);\n`], { cwd: repoRoot, env });
      expect(existsSync(ledger)).toBe(false);
      expect(process.env.HOLO_TIMINGS,
        "playwright.config.mjs must silence the writer for the whole suite").toBe("off");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

/* ------------------------------------------------------------------ */
test.describe("row 33 — the analyzer finds planted defects, and only planted ones", () => {
  test("a planted 4-hour idle gap is found, named and measured", () => {
    const dir = scratch();
    try {
      const ledger = join(dir, "gap.jsonl");
      const { recs } = syntheticRun({ gapSeconds: 4 * 3600 });
      writeLedger(ledger, recs);
      const md = analyze(ledger, ["--run-state", runStateFile(dir, "held")]);
      expect(md, "the planted gap must be reported as IDLE, not quiet").toMatch(/\*\*IDLE\*\*/);
      expect(md).toMatch(/4\.00 h/);
      expect(md, "an idle gap must carry how much work was waiting").toMatch(
        /dead air with work pending/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("THE ARM THAT CAN FAIL: with the gap paved over, no idle gap is reported", () => {
    const dir = scratch();
    try {
      const ledger = join(dir, "nogap.jsonl");
      const { recs } = syntheticRun({ gapSeconds: 4 * 3600, fillGap: true });
      writeLedger(ledger, recs);
      const md = analyze(ledger, ["--run-state", runStateFile(dir, "held")]);
      expect(md, "a detector that fires on a continuous ledger has detected nothing")
        .not.toMatch(/\*\*IDLE\*\*/);
      expect(md).toMatch(/## Idle gaps[\s\S]*?None\./);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("THE SECOND ARM: the same gap with the work finished is QUIET, not idle", () => {
    const dir = scratch();
    try {
      const ledger = join(dir, "quiet.jsonl");
      const { recs } = syntheticRun({ gapSeconds: 4 * 3600, terminal: true });
      writeLedger(ledger, recs);
      const md = analyze(ledger, ["--run-state", runStateFile(dir, "promoted")]);
      expect(md, "a pipeline with nothing owed is not a pipeline that is failing")
        .not.toMatch(/\*\*IDLE\*\*/);
      expect(md).toMatch(/\| \*\*quiet\*\* \|/);
      expect(md).toMatch(/4\.00 h/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("a planted 5x regression is flagged, with both p50s and the ratio", () => {
    const dir = scratch();
    try {
      const ledger = join(dir, "regress.jsonl");
      const recs = [];
      for (let i = 0; i < 30; i++) {
        recs.push({ ts_start: 1000 + i * 10, ts_end: 1001 + i * 10, step: "measure.candidate",
          key: `w${i}`, detail: { roll_id: `b${i}` } });
      }
      for (let i = 0; i < 10; i++) {
        recs.push({ ts_start: 2000 + i * 20, ts_end: 2005 + i * 20, step: "measure.candidate",
          key: `w${i}`, detail: { roll_id: `r${i}` } });
      }
      writeLedger(ledger, recs);
      const md = analyze(ledger);
      expect(md).toMatch(/\*\*REGRESSION `measure\.candidate`\*\*/);
      expect(md, "a flag that does not carry its arithmetic is an assertion")
        .toMatch(/recent p50 5\.00 s against a baseline p50 of 1\.00 s/);
      expect(md).toMatch(/\*\*5\.00x\*\*/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("THE ARM THAT CAN FAIL: a steady step of the same length flags nothing", () => {
    const dir = scratch();
    try {
      const ledger = join(dir, "steady.jsonl");
      const recs = [];
      for (let i = 0; i < 40; i++) {
        recs.push({ ts_start: 1000 + i * 10, ts_end: 1001 + i * 10, step: "measure.candidate",
          key: `w${i}`, detail: { roll_id: `b${i}` } });
      }
      writeLedger(ledger, recs);
      const md = analyze(ledger);
      expect(md).not.toMatch(/\*\*REGRESSION/);
      expect(md).toMatch(/None flagged\./);
      expect(md).toMatch(/steady `measure\.candidate`/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("--monitor exits 1 on a flag and 0 without one, printing one line either way", () => {
    const dir = scratch();
    try {
      const bad = join(dir, "bad.jsonl"), good = join(dir, "good.jsonl");
      const mk = (recent) => {
        const recs = [];
        for (let i = 0; i < 30; i++) {
          recs.push({ ts_start: 1000 + i * 10, ts_end: 1001 + i * 10, step: "bake.fixtures",
            key: null, detail: {} });
        }
        for (let i = 0; i < 10; i++) {
          recs.push({ ts_start: 2000 + i * 20, ts_end: 2000 + recent + i * 20,
            step: "bake.fixtures", key: null, detail: {} });
        }
        return recs;
      };
      writeLedger(bad, mk(6));
      writeLedger(good, mk(1));

      let code = 0, out = "";
      try {
        out = execFileSync("python3", [REPORT, "--ledger", bad, "--monitor"],
          { cwd: repoRoot, encoding: "utf8", env: { ...process.env, HOLO_TIMINGS: "off" } });
      } catch (e) { code = e.status; out = String(e.stdout || ""); }
      expect(code, "a monitor that cannot go red is not a monitor").toBe(1);
      expect(out.trim().split("\n").length, "the monitor speaks in one line").toBe(1);
      expect(out).toMatch(/REGRESSION: bake\.fixtures 6\.00x/);

      const ok = execFileSync("python3", [REPORT, "--ledger", good, "--monitor"],
        { cwd: repoRoot, encoding: "utf8", env: { ...process.env, HOLO_TIMINGS: "off" } });
      expect(ok).toMatch(/no regression/);
      expect(ok.trim().split("\n").length).toBe(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("the top contributor is named with its number, and markers never become durations", () => {
    const dir = scratch();
    try {
      const ledger = join(dir, "top.jsonl");
      const recs = [];
      for (let i = 0; i < 5; i++) {
        recs.push({ ts_start: 1000 + i, ts_end: 1000.1 + i, step: "emit.facing",
          key: `w${i}`, detail: {} });
      }
      for (let i = 0; i < 3; i++) {
        recs.push({ ts_start: 2000 + i * 100, ts_end: 2060 + i * 100, step: "generate.roll",
          key: `w${i}`, detail: {} });
      }
      /* Markers: a bake commit knows when, never how long. */
      for (let i = 0; i < 4; i++) {
        recs.push({ ts_start: 3000 + i, ts_end: 3000 + i, step: "bake.backdrops",
          key: null, detail: { derivation: "git commit timestamp. MARKER" }, backfilled: true });
      }
      writeLedger(ledger, recs);
      const md = analyze(ledger);
      expect(md).toMatch(/\*\*`generate\.roll` — 3\.0 min of 3\.0 min/);
      expect(md, "an all-marker step has no measured wall-clock and must not print zero")
        .toMatch(/`bake\.backdrops` \*\(4 marker\)\* \| 4 \| -- \| -- \| -- \| -- \| -- \|/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("queue latency finds work that waited while something else was running", () => {
    const dir = scratch();
    try {
      const ledger = join(dir, "queue.jsonl");
      const recs = [];
      /* Ten candidates all finished by t+100, none measured until t+3700: the
         activity timeline never breaks because generation overlaps, and the
         work still sat for an hour. */
      for (let i = 0; i < 10; i++) {
        recs.push({ ts_start: 1000, ts_end: 1000 + 100 + i, step: "generate.roll",
          key: `w${i}`, detail: { roll_id: `g${i}` } });
        recs.push({ ts_start: 4700 + i, ts_end: 4701 + i, step: "measure.candidate",
          key: `w${i}`, detail: { roll_id: `g${i}` } });
      }
      writeLedger(ledger, recs);
      const md = analyze(ledger);
      expect(md).toMatch(/## Queue latency/);
      expect(md).toMatch(/`generate\.roll` -> `measure\.candidate` \| roll id \| 10 \|/);
      expect(md, "an hour of waiting must read as an hour").toMatch(/\| 60\.0 min \|/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

/* ------------------------------------------------------------------ */
test.describe("row 33 — the backfill on the real tree", () => {
  test("mining this repository yields non-zero counts on several steps", () => {
    const dir = scratch();
    try {
      const ledger = join(dir, "backfill.jsonl");
      const md = execFileSync("python3",
        [REPORT, "--ledger", ledger, "--backfill", "--tree", repoRoot, "--out", "-"],
        { cwd: repoRoot, encoding: "utf8", env: { ...process.env, HOLO_TIMINGS: "off" } });
      const recs = readFileSync(ledger, "utf8").split("\n").filter((l) => l.length)
        .map((l) => JSON.parse(l));
      expect(recs.length, "the tree carries Test 1's evidence and the backfill found none")
        .toBeGreaterThan(100);
      const by = {};
      for (const r of recs) by[r.step] = (by[r.step] || 0) + 1;
      for (const step of ["generate.roll", "measure.candidate", "emit.facing",
                          "emit.packet", "promote.wall"]) {
        expect(by[step], `no ${step} events mined from the real tree`).toBeGreaterThan(0);
      }
      expect(recs.every((r) => r.backfilled === true),
        "every mined record must say it was mined").toBe(true);
      expect(recs.every((r) => (r.detail || {}).derivation),
        "a backfilled record must say how its clock was derived").toBe(true);
      expect(md).toMatch(/backfilled, 0 measured live/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("the backfill is idempotent — a second mining writes nothing", () => {
    const dir = scratch();
    try {
      const ledger = join(dir, "twice.jsonl");
      const env = { ...process.env, HOLO_TIMINGS: "off" };
      execFileSync("python3",
        [REPORT, "--ledger", ledger, "--backfill", "--tree", repoRoot, "--out", "-"],
        { cwd: repoRoot, encoding: "utf8", env });
      const first = readFileSync(ledger, "utf8").split("\n").filter((l) => l.length).length;
      const md = execFileSync("python3",
        [REPORT, "--ledger", ledger, "--backfill", "--tree", repoRoot, "--out", "-"],
        { cwd: repoRoot, encoding: "utf8", env });
      const second = readFileSync(ledger, "utf8").split("\n").filter((l) => l.length).length;
      expect(second, "re-running the backfill must not double the ledger").toBe(first);
      expect(md).toMatch(/0 written/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

/* ------------------------------------------------------------------ */
test.describe("row 33 — the instrumentation is wired to the real tools", () => {
  test("the fixture bake clocks itself", () => {
    const dir = scratch();
    try {
      const ledger = join(dir, "bake.jsonl");
      execFileSync("node", [join(repoRoot, "tools", "bake-fixtures.mjs"),
        "--fixture-dir", join(repoRoot, "fixtures", "demo-study"),
        "--out", join(dir, "fixture.js")],
        { cwd: repoRoot, env: { ...process.env, HOLO_TIMINGS: ledger }, stdio: "ignore" });
      const recs = readFileSync(ledger, "utf8").split("\n").filter((l) => l.length)
        .map((l) => JSON.parse(l));
      const r = recs.find((x) => x.step === "bake.fixtures");
      expect(r, "tools/bake-fixtures.mjs left no record").toBeTruthy();
      expect(r.key).toBe("demo-study");
      expect(r.ts_end).toBeGreaterThan(r.ts_start);
      expect(r.detail.facings).toBeGreaterThan(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("the backdrop bake clocks itself", () => {
    const dir = scratch();
    try {
      const ledger = join(dir, "bakeb.jsonl");
      execFileSync("node", [join(repoRoot, "tools", "bake-backdrops.mjs"),
        "--out", join(dir, "baked.js")],
        { cwd: repoRoot, env: { ...process.env, HOLO_TIMINGS: ledger }, stdio: "ignore" });
      const r = readFileSync(ledger, "utf8").split("\n").filter((l) => l.length)
        .map((l) => JSON.parse(l)).find((x) => x.step === "bake.backdrops");
      expect(r, "tools/bake-backdrops.mjs left no record").toBeTruthy();
      expect(r.ts_end).toBeGreaterThan(r.ts_start);
      expect(r.detail.paintings).toBeGreaterThan(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("a REFUSED promotion is timed too, and says it was refused", () => {
    const dir = scratch();
    try {
      const ledger = join(dir, "promote.jsonl");
      try {
        execFileSync("node", [join(repoRoot, "tools", "promote-backdrop.mjs"),
          "--facing", "nowhere/N", "--candidate", "nothing.png"],
          { cwd: repoRoot, env: { ...process.env, HOLO_TIMINGS: ledger }, stdio: "ignore" });
      } catch { /* the refusal is the point */ }
      const r = readFileSync(ledger, "utf8").split("\n").filter((l) => l.length)
        .map((l) => JSON.parse(l)).find((x) => x.step === "promote.backdrop");
      expect(r, "a refusal that costs time and leaves no record is the defect this row "
             + "exists to remove").toBeTruthy();
      expect(r.detail.refused).toBe(true);
      expect(r.key).toBe("nowhere/N");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("the prompt lint clocks itself", () => {
    const dir = scratch();
    try {
      const ledger = join(dir, "lint.jsonl");
      const prompt = join(repoRoot, "design", "batches", "row23-scaffold",
        "manor", "kitchen-N", "prompt.txt");
      test.skip(!existsSync(prompt), "no emitted prompt on disk to lint");
      execFileSync("python3", [join(MEASURED, "prompt_lint.py"), prompt],
        { cwd: repoRoot, env: { ...process.env, HOLO_TIMINGS: ledger }, stdio: "ignore" });
      const r = readFileSync(ledger, "utf8").split("\n").filter((l) => l.length)
        .map((l) => JSON.parse(l)).find((x) => x.step === "lint.prompts");
      expect(r, "prompt_lint.py left no record").toBeTruthy();
      expect(r.detail.prompts).toBe(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("every instrumented step of the sweep is a timing line and nothing else", () => {
    /* The concurrent row-23 work owns this file's measurement internals. The
       contract that keeps the merge trivial is that every row-33 edit here is
       marked and touches no logic — so the marks are asserted, and so is the
       fact that `row23_lib.py` gained nothing. */
    const run = readFileSync(join(MEASURED, "row23_run.py"), "utf8");
    for (const step of ["measure.candidate", "promote.wall", "bake.sweep", "sweep.pass"]) {
      expect(run, `row23_run.py no longer records ${step}`).toContain(`"${step}"`);
    }
    expect(run).toContain("import timings");
    const lib = readFileSync(join(MEASURED, "row23_lib.py"), "utf8");
    expect(lib.includes("timings"),
      "row23_lib.py is the corner/horizon instrument's home and row 33 does not "
      + "instrument inside a detector").toBe(false);
  });
});
