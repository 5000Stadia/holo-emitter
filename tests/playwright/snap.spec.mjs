/* [Row 35] THE SNAP — post-generation planar rectification.
 *
 * [HUMAN, 2026-08-24] "Can we use the prompts producing the results then auto
 * snap the room corners to our expected geometry?"
 *
 * The tool is `design/plan-draft/measured/row35_snap.py` and its whole claim is
 * a construction: five planes, one homography each, agreeing on their shared
 * edges by algebra rather than by tolerance, and carrying every line through
 * the painting's own convergence onto a line through the declared one. Four
 * things are checked here and each is checked where the claim could break.
 *
 *   the seams        both regions' mappings of the same shared edge, computed
 *                    here from the numbers the tool emits, so a construction
 *                    that came apart shows as a distance and not as a verdict
 *                    the tool wrote about itself
 *   the round trip   target -> source -> target over every region: a
 *                    homography recovered is a homography inverted
 *   the acceptance   a room drawn at a KNOWN WRONG camera, snapped, and read
 *                    by the standing row-20/23 instrument. Nothing about the
 *                    planted frame is in the snap's inputs except the reading
 *                    the instrument takes off it.
 *   the refusals     a correction past a stated budget refuses with its number
 *
 * and then the thing none of them can see: a real click, in a real browser, on
 * the painted door of a snapped wall promoted into a SCRATCH store.
 */
import { test, expect, repoRoot, POINTER_VIEWPORT, stageTree, removeTree } from "./helpers.mjs";
import { readFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, copyFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const SNAP = join(repoRoot, "design", "plan-draft", "measured", "row35_snap.py");
const BATCH = join(repoRoot, "design", "batches", "row35-snap");

/** The tool, run in the repository, with the timings ledger left alone. */
function snap(args, opts = {}) {
  return execFileSync("python3", [SNAP, ...args], {
    cwd: repoRoot, encoding: "utf8", stdio: "pipe",
    env: { ...process.env, HOLO_TIMINGS: "off" }, ...opts
  });
}

/* ONE INVOCATION FEEDS THE FIRST THREE CASES. `--synthetic-acceptance` draws a
   room at a known camera, snaps it, and emits the seam samples, the round trip
   and the instrument's reading of both frames. It touches no image on disk, so
   it costs seconds where a real wall costs a measurement. */
let SYNTH = null;
test.beforeAll(() => {
  SYNTH = JSON.parse(snap(["--synthetic-acceptance"]));
});

/** The largest distance between two regions' mappings of one shared edge. */
function seamGap(list) {
  let worst = 0, where = "";
  for (const e of list) {
    for (const [a, b] of [["source_a", "source_b"], ["target_a", "target_b"]]) {
      for (let i = 0; i < e[a][0].length; i++) {
        const d = Math.hypot(e[a][0][i] - e[b][0][i], e[a][1][i] - e[b][1][i]);
        if (d > worst) { worst = d; where = `${e.edge} (${e.shared}) sample ${i}`; }
      }
    }
  }
  return { worst, where };
}

test.describe("row 35 — the snap", () => {
  test("the five planes agree on every shared edge, in both boxes", () => {
    /* SEAM CONTINUITY IS THE CONSTRUCTION OR IT IS NOTHING. Each shared edge is
       reached from BOTH sides through the parameters that pin it — the wall's
       left edge is u = 0 and the left return's is t = 1 — and both mappings are
       evaluated in the source box and in the target box. If the two
       parameterisations ever named different physical lines this distance would
       be pixels, not float noise. */
    const { worst, where } = seamGap(SYNTH.seams);
    expect(SYNTH.seams.length, "every shared edge is sampled").toBe(8);
    expect(worst, `the widest seam disagreement is at ${where}`).toBeLessThan(1e-6);
  });

  test("target -> source -> target is the identity, over every region", () => {
    const rt = SYNTH.roundtrip;
    expect(rt.points, "the scatter covers the frame").toBeGreaterThan(1000);
    expect(rt.regions_used, "every one of the five planes is exercised")
      .toEqual([0, 1, 2, 3, 4]);
    expect(rt.max_error_px).toBeLessThan(1e-6);
  });

  test("a room drawn at a wrong camera re-measures onto the declared one", () => {
    /* THE ACCEPTANCE TEST IS THE INSTRUMENT. The planted room is drawn from a
       box whose eye is 0.609 m — nobody stands there — and the standing
       row-20/23 detectors read that camera back off the painting before the
       snap and the DECLARED camera off it afterwards. No band is moved: the
       tolerances below are blueprint §5's own ±8 % carried onto the quantities
       the gate reads.

       The first two expectations are what makes the third mean anything. A
       snap that did nothing would leave the planted eye where it was, and the
       BEFORE reading is checked against the planted camera precisely so that
       "the instrument reads 1.18 m afterwards" cannot be satisfied by an
       instrument that reads 1.18 m off anything. */
    const before = SYNTH.read_before, after = SYNTH.read_after;
    const planted = SYNTH.planted_eye_m, want = SYNTH.target_eye_m;

    expect(Math.abs(before.eye_m - planted),
      `the planted frame reads its own planted eye: ${before.eye_m} against ${planted}`)
      .toBeLessThan(0.05);
    expect(Math.abs(before.eye_m - want) / want,
      "and that eye is nowhere near the declared one, so there is a correction to make")
      .toBeGreaterThan(0.08);

    expect(Math.abs(after.ramp.y - SYNTH.declared_horizon_px),
      `after the snap the two returns converge at ${after.ramp.y}, and the declared horizon is ${SYNTH.declared_horizon_px}`)
      .toBeLessThan(8);
    expect(Math.abs(after.eye_m - want) / want,
      `after the snap the frame's own ruler and its own perspective put the eye at ${after.eye_m} m`)
      .toBeLessThan(0.08);
    expect(Math.abs(after.floor_line_y_px - SYNTH.declared_floor_px),
      "and the wall's foot is on the row the plan rules")
      .toBeLessThan(0.08 * (SYNTH.declared_floor_px - SYNTH.declared_horizon_px));
  });

  test("a correction past a budget refuses, with the number, and snaps nothing", () => {
    /* BOTH REFUSAL PATHS, on a real wall, off the reading the batch committed —
       so this costs the warp and not a measurement. `kitchen/W` is the corpus's
       own case: its returns are 64 px slivers at the edges of an almost flat-on
       wall, they fit a convergence to a third of a pixel, and snapping the
       0.271 m eye it implies magnifies the floor 4.9x. */
    /* THE SCRATCH OUTPUT GOES OUTSIDE THE REPOSITORY. Both browser projects run
       this file, so two copies of it are in flight at once; a fixed path inside
       the tree is one run deleting the other run's frame. */
    const scratch = mkdtempSync(join(tmpdir(), "holo-snap-refuse-"));
    const out = join(scratch, "refused.png");
    const attempt = (extra) => {
      try {
        snap(["--facing", "kitchen/W", "--vp", "measured", "--reading",
          join(BATCH, "kitchen-W", "before-reading.json"), "--out", out, ...extra]);
        return null;
      } catch (e) {
        return String(e.stdout || "") + String(e.stderr || "");
      }
    };
    const stretch = attempt([]);
    expect(stretch, "the stretch budget refuses and names its tag").toMatch(/row35:snap\.stretch_budget/);
    expect(stretch, "and the number it refused on").toMatch(/magnifies its floor by 4\.\d\dx/);

    const reveal = attempt(["--stretch-budget", "1000"]);
    expect(reveal, "the reveal budget refuses and names its tag").toMatch(/row35:snap\.reveal_budget/);
    expect(reveal, "and the number it refused on").toMatch(/reveals \d+\.\d px beyond its own edge/);

    expect(existsSync(out), "a refused snap writes no frame").toBe(false);
    rmSync(scratch, { recursive: true, force: true });
  });

  test("--vp auto says which convergence it used and why", () => {
    /* The fallback is the production path for a frame that fixes no usable
       convergence, and it is only honest if the record carries it. */
    const rec = JSON.parse(readFileSync(join(BATCH, "kitchen-W", "snap.json"), "utf8"));
    expect(rec.source_anchors.vanishing_point).toBe("declared-principal-point");
    expect(rec.source_anchors.vanishing_point_why,
      "and it names what the measured convergence cost").toMatch(/over budget/);
    const gh = JSON.parse(readFileSync(join(BATCH, "great_hall-N", "snap.json"), "utf8"));
    expect(gh.source_anchors.vanishing_point).toBe("measured-ramp");
  });

  test("the snap is deterministic: the same reading gives the same bytes", () => {
    const scratch = mkdtempSync(join(tmpdir(), "holo-snap-det-"));
    const a = join(scratch, "a.png");
    const b = join(scratch, "b.png");
    for (const out of [a, b]) {
      snap(["--facing", "library/S", "--reading",
        join(BATCH, "library-S", "before-reading.json"), "--out", out,
        "--doc-out", out.replace(/\.png$/, ".json")]);
    }
    expect(readFileSync(a).equals(readFileSync(b)),
      "two runs of one warp over one frame are the same picture").toBe(true);
    rmSync(scratch, { recursive: true, force: true });
  });

  test("every snapped reading describes the frame it was written for", () => {
    /* THE CORPUS INVARIANT. A rewritten reading is the document a promotion
       takes, so it has to name the image it describes, carry that image's own
       digest, and agree with the box the snap recorded — otherwise the
       promotion would be reading post-snap prose over pre-snap numbers. */
    const dir = join(repoRoot, "design", "plan-draft", "measured", "row35snap");
    const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
    expect(files.length, "the round has readings in it").toBeGreaterThan(0);
    for (const f of files) {
      const d = JSON.parse(readFileSync(join(dir, f), "utf8"));
      const png = /(design\/batches\/\S+?\.png)/.exec(d._what_this_is);
      expect(png, `${f} does not name the image it describes`).toBeTruthy();
      const sha = execFileSync("sha256sum", [join(repoRoot, png[1])], { encoding: "utf8" })
        .split(/\s+/)[0];
      expect(d._source_sha256, `${f} records a digest that is not ${png[1]}'s`).toBe(sha);
      const box = d._snap.target_box;
      expect(Math.abs(d.corner_x0_px - box.x0)).toBeLessThan(0.02);
      expect(Math.abs(d.corner_x1_px - box.x1)).toBeLessThan(0.02);
      expect(Math.abs(d.floor_line_y * d.image_h_px - box.yf)).toBeLessThan(0.6);
      expect(Math.abs(d.horizon_y * d.image_h_px - box.vy)).toBeLessThan(0.02);
      expect(d._horizon_votes.ceiling_ramp_intersection.y,
        `${f}'s ramp record must be the box's own convergence`)
        .toBeCloseTo(box.vy, 1);
      /* AND IT SAYS WHICH OF TWO CLAIMS IT IS. From a measured convergence the
         snapped picture's returns converge on that row by construction; from
         the declared principal point they were never moved onto it and the
         record has to say ASSUMED, because a reading that asserts a
         measurement nobody took is the defect this corpus keeps paying for. */
      const ramp = d._horizon_votes.ceiling_ramp_intersection;
      const basis = d._snap.source_anchors.vanishing_point === "measured-ramp"
        ? "measured-convergence" : "declared-principal-point";
      expect(ramp._snap_basis, `${f}'s horizon record must name its basis`).toBe(basis);
      if (basis === "declared-principal-point") {
        expect(ramp._snapped, `${f} took the fallback and must say so`).toMatch(/ASSUMED, not achieved/);
      }
      /* The chair-rail row and the scale are one number, the way
         `geometry.spec`'s calibration audit reads them. */
      expect(d.calibration_px / 0.95).toBeCloseTo(d.px_per_m_at_wall, 0);
    }
  });

  test("a transformed door rectangle coincides with the paint it was moved onto", () => {
    /* §11's click-coincidence, asked of the SNAPPED frame. The reading carries
       each door where the warp put it — measured before the warp and moved
       through the facing wall's own map, never re-detected — and the tool's
       acceptance pass re-reads the same doors off the snapped image with
       nothing about the carried answer in its inputs. The distance between the
       two is the honest size of what the transform costs.

       The tolerance is `door_measure.py`'s own control tolerance, 6 px: what
       two people reading one luminance profile would disagree by. */
    const rec = JSON.parse(readFileSync(join(BATCH, "servants_hall-W", "snap.json"), "utf8"));
    const d = rec.acceptance.doors;
    expect(d.carried, "this wall's two ways through are in the reading").toBe(2);
    expect(d.re_read, "and the snapped frame shows two of them").toBe(2);
    for (const p of d.pairs) {
      expect(p.centre_delta_px,
        `carried ${p.carried} against a fresh read of the snapped frame ${p.re_read}`)
        .toBeLessThanOrEqual(6);
      expect(p.width_delta_px).toBeLessThanOrEqual(6);
    }
  });

  test.describe("on the running page", () => {
    test.use({ viewport: POINTER_VIEWPORT });

    /* A SCRATCH STORE, NEVER THE REAL ONE. The pilot is judged before the
       promotion loop is allowed anywhere near it (the Navigator sequences that
       after this row lands), so the snapped wall is promoted into a staged copy
       of the runnable tree and the click is taken there. */
    let dir = null;
    test.beforeAll(() => {
      dir = stageTree();
      mkdirSync(join(dir, "design", "plan-draft", "measured", "row35snap"), { recursive: true });
      mkdirSync(join(dir, "design", "batches", "row35-snap", "servants_hall-W"), { recursive: true });
      copyFileSync(join(repoRoot, "design", "plan-draft", "measured", "row35snap", "servants_hall-W.json"),
        join(dir, "design", "plan-draft", "measured", "row35snap", "servants_hall-W.json"));
      copyFileSync(join(BATCH, "servants_hall-W", "after.png"),
        join(dir, "design", "batches", "row35-snap", "servants_hall-W", "after.png"));
      execFileSync("node", [join(dir, "tools", "promote-backdrop.mjs"),
        "--facing", "servants_hall/W",
        "--candidate", "design/batches/row35-snap/servants_hall-W/after.png",
        "--round", "row35snap", "--reference", "ruled"],
        { cwd: dir, encoding: "utf8", stdio: "pipe" });
      execFileSync("node", [join(dir, "tools", "bake-backdrops.mjs")],
        { cwd: dir, encoding: "utf8", stdio: "pipe" });
      execFileSync("node", [join(dir, "tools", "bake-fixtures.mjs"),
        "--fixture-dir", join(dir, "fixtures", "nav-manor")],
        { cwd: dir, encoding: "utf8", stdio: "pipe" });
    });
    test.afterAll(() => { if (dir) removeTree(dir); });

    test("a real click in the middle of the snapped wall's painted door travels", async ({ page }) => {
      /* THE INTEGRATION NOTHING ELSE SEES. The door rectangle in the promoted
         meta was never measured off this image: it was measured off the frame
         BEFORE the warp and carried through the facing wall's own map. If that
         transform is wrong by more than half a doorway, this click lands on
         paint and the page says so instead of travelling. */
      const meta = JSON.parse(readFileSync(
        join(dir, "backdrops", "servants_hall", "W.meta.json"), "utf8"));
      const door = (meta.openings || []).find((o) => o.kind === "door");
      expect(door, "the promoted meta carries the painted way through").toBeTruthy();
      expect(door.measured, "and it is measured, never projected").toBe(true);

      await page.goto(pathToFileURL(join(dir, "index.html")).href);
      await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
      const stood = await page.evaluate(() => {
        const A = window.HOLO_APP;
        const W = A.harness.world;
        const start = A.harness.viewstate.location;
        const order = ["N", "E", "S", "W"];
        const seen = new Map([[start, []]]);
        const q = [start];
        let walk = null;
        while (q.length && walk === null) {
          const at = q.shift();
          if (at === "servants_hall") { walk = seen.get(at); break; }
          for (const ex of (W.locations.find((l) => l.id === at) || {}).exits || []) {
            if (seen.has(ex.to)) continue;
            seen.set(ex.to, seen.get(at).concat([ex]));
            q.push(ex.to);
          }
        }
        let f = A.harness.viewstate.facing;
        for (const ex of walk) {
          while (f !== ex.facing) { A.dispatch({ type: "turn", dir: "right" }); f = order[(order.indexOf(f) + 1) % 4]; }
          A.dispatch({ type: "go", exit: ex.id });
          f = ex.arrive_facing;
        }
        while (f !== "W") { A.dispatch({ type: "turn", dir: "right" }); f = order[(order.indexOf(f) + 1) % 4]; }
        return { vs: A.harness.viewstate, apertures: A.apertureList() };
      });
      expect(`${stood.vs.location}/${stood.vs.facing}`).toBe("servants_hall/W");
      const a = stood.apertures.find((z) => z.via === door.id || z.via === door.via);
      expect(a, "the page draws the way through the snapped wall paints").toBeTruthy();
      for (const k of ["x", "y", "w", "h"]) {
        expect(Math.abs(a[k] - door[k]),
          `the page's ${k} is ${a[k]} and the snapped meta's is ${door[k]}`).toBeLessThan(0.5);
      }
      await page.locator("#scene").click({
        position: { x: a.x + a.w / 2, y: a.y + a.h / 2 }
      });
      const after = await page.evaluate(() => window.HOLO_APP.harness.viewstate);
      expect(after.location,
        "a click in the middle of the door the SNAPPED wall paints walks through it")
        .toBe("back_stair");
    });
  });
});
