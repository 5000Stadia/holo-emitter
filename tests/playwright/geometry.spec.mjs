import { test, expect, appUrl, LIT, repoRoot, gridExpectations } from "./helpers.mjs";
import {
  deriveMeta, RULED_EYE_M, assertRuledEye, assertCameraConsistent
} from "../../tools/plan-projection.mjs";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const PLAN = JSON.parse(
  readFileSync(join(repoRoot, "fixtures", "demo-study", "plan.json"), "utf8"));

test.describe("camera-has-feet geometry", () => {
  test("§5's horizon device holds on the unplanned-facing meta at the RULED eye height", () => {
    /* Expected values are this file's literals (independent of the renderer);
     * the actual is the shipped constant, read through the UMD guard — so
     * drift in GRID_META goes red here, not only in pixel scans.
     *
     * Row 11 moved the eye height to §10's ruled 1.83 m [HUMAN, 2026-08-20].
     * At 1.6 m this meta failed §5's own camera-has-feet assertion by 0.0016
     * while `heights.spec` still implemented the assertion at 1.6 and the
     * suite stayed green — the blueprint was red and nothing said so. */
    const { GRID_META } = require(join(repoRoot, "src", "renderer.js"));
    expect(GRID_META.floor_line_y).toBe(LIT.floor_line_y);
    expect(GRID_META.horizon_y).toBe(LIT.horizon_y);
    expect(GRID_META.px_per_m_at_wall).toBe(LIT.px_per_m_at_wall);
    expect(GRID_META.px_per_m_at_bottom).toBe(LIT.px_per_m_at_bottom);
    expect(GRID_META.image_h_px).toBe(LIT.H);
    expect(GRID_META.wall_width_m).toBe(LIT.wall_width_m);
    expect(GRID_META.key_tint).toBe("#c8b489");
    /* A facing no plan holds has no typed geometry and must not claim two
     * corners: an extent nobody has drawn is not a room. */
    expect(GRID_META.facing_type).toBeNull();
    expect(GRID_META.corner_x0_px).toBeNull();
    expect(GRID_META.corner_x1_px).toBeNull();
    // |horizon_y − (floor_line_y − eye·px_per_m_at_wall/image_h_px)| ≤ 0.02,
    // and at the ruled eye height it is not merely inside the gate — it is 0.
    const derived = GRID_META.floor_line_y -
      (LIT.eye_m * GRID_META.px_per_m_at_wall) / GRID_META.image_h_px;
    expect(Math.abs(GRID_META.horizon_y - derived)).toBeLessThanOrEqual(1e-12);
  });

  test("the ruled eye height has one home, and the projection reads it from there", () => {
    /* The check that can go red with a term from outside the derivation. §10's
     * `camera.eye_height_m` is the authored home of Kabe's six-foot ruling and
     * lives in `replicator/contract.json`; the projection derives every meta
     * from it. Drift either way re-cameras the project in silence.
     *
     * Scope, so this does not invert a [HUMAN] ruling: §5 makes row 4's
     * APPROVED BACKDROP the geometric authority, and when it measures a
     * camera that measurement updates §10's number — this check follows that
     * home, it does not outrank it. */
    const contract = JSON.parse(
      readFileSync(join(repoRoot, "replicator", "contract.json"), "utf8"));
    expect(contract.camera.eye_height_m).toBe(LIT.eye_m);
    expect(RULED_EYE_M).toBe(LIT.eye_m);
    expect(assertRuledEye()).toEqual([]);
    expect(assertCameraConsistent()).toEqual([]);
  });

  test("§12.5's frame clauses: every meta the fixture can resolve fits the frame it is a meta FOR", () => {
    /* The ONE clause that reaches outside a meta. Every other §12.5 assertion
     * compares rendered pixels against the same meta that would carry the
     * error, so a meta wrong about the world but consistent with itself
     * passes them all. The canvas is the term no meta supplies.
     *
     * §7's row-2 amendment stated it as `px_per_m_at_wall × wall_width_m ≈
     * canvas width`, which was true while grid-canonical `wall_width_m` WAS
     * the wall in frame. Row 11 makes it false by design — a 5.45 m study
     * wall at 96 px/m is 523 px of a 1536 px frame — so it generalizes:
     *   (i)   the wall in view fits the frame (corners inside it, or the
     *         claimed wall no wider than it where there are no corners);
     *   (ii)  on a MEASURED backdrop, corner span = wall_width_m ×
     *         px_per_m_at_wall within the calibration audit's tolerance —
     *         pixels against arithmetic. Row 4's; none exists yet;
     *   (iii) on a synthesized one (ii) holds by construction, so only (i)
     *         has content;
     *   (iv)  image_h_px is the canvas it is a meta for. */
    const { GRID_META } = require(join(repoRoot, "src", "renderer.js"));
    const metas = LIT.facingKeys().map((k) => {
      const [loc, f] = k.split("/");
      return [k, deriveMeta(PLAN, loc, f)];
    });
    metas.push(["unplanned facing", GRID_META]);
    for (const [name, meta] of metas) {
      const cornered = typeof meta.corner_x0_px === "number";
      if (cornered) {
        expect(meta.corner_x0_px, `${name} (i): left corner in frame`).toBeGreaterThanOrEqual(0);
        expect(meta.corner_x1_px, `${name} (i): right corner in frame`).toBeLessThanOrEqual(LIT.W);
        // (iii): computed corners, so the span IS the arithmetic.
        expect(meta.corner_x1_px - meta.corner_x0_px,
          `${name} (iii): computed corner span`)
          .toBeCloseTo(meta.wall_width_m * meta.px_per_m_at_wall, 9);
      } else {
        expect(meta.wall_width_m * meta.px_per_m_at_wall,
          `${name} (i): the wall it claims fits the frame`).toBeLessThanOrEqual(LIT.W + 1e-6);
      }
      expect(meta.image_h_px, `${name} (iv)`).toBe(LIT.H);
      // §5's own calibration audit: px_per_m_at_wall ≈ calibration_px per
      // metre of the named reference (the grid's metre module is 1.0 m).
      expect(meta.calibration_ref).toMatch(/1\.0 m/);
      expect(Math.abs(meta.calibration_px / 1.0 - meta.px_per_m_at_wall) /
        meta.px_per_m_at_wall).toBeLessThanOrEqual(0.03);
    }
  });

  test("the camera has feet, measured from the pixels, on every facing the demo draws", async ({ page }) => {
    /* THE CLAUSE THAT CAN FAIL. On a meta `deriveMeta` produced, §5's horizon
     * assertion is the derivation's own equation read backwards: residual 0
     * by construction, unfalsifiable for any camera. Reading it off the meta
     * would be "identity, not evidence" moved from one meta to eight.
     *
     * So this reads the DRAWN floor line and the DRAWN horizon out of the
     * rendered grid — the brightest full-width row below and at the eye
     * line — and asserts the eye height between them against this file's own
     * literal. Break drawGrid's floor line, or its eye line, or the meta's
     * geometry, and it goes red on the facing that broke. */
    await page.goto(appUrl());
    for (const key of LIT.facingKeys()) {
      const [loc, f] = key.split("/");
      const m = LIT.facing(loc, f);
      const rows = await page.evaluate(({ loc, f }) => {
        const T = window.__T;
        const c = T.renderDirect({ location: loc, facing: f }, null, { backdrop_only: true });
        /* The two major horizontals. The eye line is the only full-width one;
           the wall-floor line runs corner to corner. Scan for them rather
           than being told where they are. */
        const best = (x0, x1, lo, hi) => {
          let bestRow = -1, bestVal = -1;
          for (let y = lo; y < hi; y++) {
            const v = T.lineFraction(c, y, x0, x1);
            if (v > bestVal) { bestVal = v; bestRow = y; }
          }
          return { row: bestRow, val: bestVal };
        };
        return { eye: best(0, 1536, 380, 600), floorish: null };
      }, { loc, f });
      // The eye line, from pixels.
      expect(rows.eye.val, `${key}: an eye line is drawn`).toBeGreaterThan(0.9);
      const drawnHorizon = rows.eye.row / LIT.H;
      // The wall-floor line, from pixels, measured between the corners only.
      const floorRow = await page.evaluate(({ loc, f, x0, x1 }) => {
        const T = window.__T;
        const c = T.renderDirect({ location: loc, facing: f }, null, { backdrop_only: true });
        let bestRow = -1, bestVal = -1;
        for (let y = 600; y < 800; y++) {
          const v = T.lineFraction(c, y, x0, x1);
          if (v > bestVal) { bestVal = v; bestRow = y; }
        }
        return { row: bestRow, val: bestVal };
      }, { loc, f, x0: Math.ceil(m.corner_x0_px) + 3, x1: Math.floor(m.corner_x1_px) - 3 });
      expect(floorRow.val, `${key}: a wall-floor line is drawn between the corners`).toBeGreaterThan(0.9);
      const drawnFloor = floorRow.row / LIT.H;
      /* §5's assertion, both sides from pixels except the eye height, which
         is this file's literal of §10's [HUMAN] number. ±2 px of row-finding
         slack on a 1024 px frame is 0.002. */
      const residual = Math.abs(drawnHorizon -
        (drawnFloor - LIT.eye_m * m.px_per_m_at_wall / LIT.H));
      expect(residual, `${key}: drawn horizon ${drawnHorizon.toFixed(4)} against a drawn floor line ${drawnFloor.toFixed(4)} at eye ${LIT.eye_m} m`)
        .toBeLessThanOrEqual(0.02);
    }
  });

  test("grid pixels: floor line, eye line, foreshortened transverse rows, facing glyph on the wall", async ({ page }) => {
    await page.goto(appUrl());
    const exp = gridExpectations("study", "S");

    // Expected rows from this facing's own literals.
    expect(exp.floorRow).toBe(667);
    expect(exp.eyeRow).toBe(491);
    expect(exp.transverseRows).toEqual([672, 702, 744]);
    expect(exp.cornerCols).toEqual([506.4, 1029.6]);

    // Foreshortening is asserted, not assumed: successive gaps strictly
    // decrease toward the wall (a uniformly-spaced floor fails).
    const [r1, r2, r3] = exp.transverseRows;
    expect(r2 - r1).toBeLessThan(r3 - r2);

    /* Row 2 re-pointed the pure-grid scans at the licensed-bare facings.
       Row 11 re-pairs them: study/S and study/W are no longer the same room
       drawn twice — S views the 5.45 m wall at 3.60 m and W the 4.80 m wall
       at 4.09 m, so their floors legitimately differ. The pair that isolates
       the glyph is now study/S against study/N, which share both numbers; the
       grid layer alone (`backdrop_only`) keeps N's furniture out of it. */
    const res = await page.evaluate(async (exp) => {
      const T = window.__T;
      const opt = { backdrop_only: true };
      const s = T.renderDirect({ location: "study", facing: "S" }, null, opt);
      const n = T.renderDirect({ location: "study", facing: "N" }, null, opt);
      const floorTop = 675; // below the floor line and its stroke
      return {
        structure: T.gridStructure(s, exp),
        // The glyph is really on the wall: the wall band differs between
        // facings while the floor band hash-matches (only the glyph moved).
        wallS: await T.hashRegion(s, 0, 400, 1536, 160),
        wallN: await T.hashRegion(n, 0, 400, 1536, 160),
        floorS: await T.hashRegion(s, 0, floorTop, 1536, 1024 - floorTop),
        floorN: await T.hashRegion(n, 0, floorTop, 1536, 1024 - floorTop)
      };
    }, exp);

    expect(res.structure.failures).toEqual([]);
    expect(res.wallS, "wall region differs between facings (glyph)").not.toBe(res.wallN);
    expect(res.floorS, "floor region identical across facings of one wall size").toBe(res.floorN);
  });
});

test("turning is visible even on a bare wall", async ({ page }) => {
  /* `turn` is silent by design (§8 gives it no narration key), so on a
   * facing with nothing staged the glyph is the entire response to pressing
   * an arrow key. At 1 m tall it changed 426 of 1 572 864 pixels — 0.03% of
   * the frame, roughly 27 device pixels on a phone. §7 gives the glyph
   * exactly this job. */
  await page.goto(appUrl());
  const res = await page.evaluate(() => {
    const fx = window.HOLO_FIXTURE;
    const c = (vs) => window.__T.renderW(fx.world, fx.staging, vs, {});
    const pairs = [
      [{ location: "study", facing: "S" }, { location: "study", facing: "W" }],
      [{ location: "hall", facing: "E" }, { location: "hall", facing: "S" }]
    ];
    return pairs.map(([a, b]) => window.__T.diffBounds(c(a), c(b)).count);
  });
  /* 1200 px is ~0.08% of the frame — still modest, but it is a whole
   * letterform's worth of ink at a size a person reads, and it is three
   * times what the old glyph moved. The real answer arrives with row 4's
   * backdrops, where turning changes the entire wall. */
  for (const n of res) {
    expect(n, `bare-facing turn changes ${n} pixels`).toBeGreaterThan(1200);
  }
});

test("the design documents state the shipped grid meta, not a different one", () => {
  /* Grid-canonical meta has one written home — blueprint §7's row-2
   * amendment — and the code is the other statement of the same thing. For a
   * commit they disagreed: three documents printed `wall_width_m 4.2` while
   * the renderer shipped 16.0, and §5's note escalated a [HUMAN] question
   * describing consequences ("staging can address only the central 26%",
   * "the nearest floor is 1.9 m away") that were true of the example block
   * and not of the grid the demo ships. A question put to a human against
   * numbers that are not shipping is worse than no question.
   *
   * So: every number the shipped GRID_META carries must appear in the
   * blueprint, and no document may still print the superseded values as
   * canonical. */
  const { GRID_META } = require(join(repoRoot, "src", "renderer.js"));
  const blueprint = readFileSync(join(repoRoot, "design", "blueprint.md"), "utf8");
  const architecture = readFileSync(join(repoRoot, "design", "architecture.md"), "utf8");

  for (const [key, value] of Object.entries(GRID_META)) {
    if (typeof value === "number") {
      expect(blueprint, `blueprint states grid ${key} = ${value}`)
        .toContain(String(value));
    }
  }
  // The superseded example values must not stand as canonical anywhere.
  for (const doc of [["blueprint", blueprint], ["architecture", architecture]]) {
    expect(doc[1], `${doc[0]} no longer calls 4.2 the grid's wall width`)
      .not.toMatch(/wall_width_m[` ]*(is |= |)4\.2/);
  }
});
