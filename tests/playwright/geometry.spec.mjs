import { test, expect, appUrl, LIT, repoRoot, gridExpectations } from "./helpers.mjs";
import { createRequire } from "node:module";
import { join } from "node:path";

const require = createRequire(import.meta.url);

test.describe("camera-has-feet geometry (grid canonical meta)", () => {
  test("§5 horizon consistency holds on the SHIPPED canonical meta", () => {
    // Expected values are §5 literals (this file's, independent of the
    // renderer); the actual is the shipped constant, read through the UMD
    // guard — so drift in GRID_META goes red here, not only in pixel scans.
    const { GRID_META } = require(join(repoRoot, "src", "renderer.js"));
    expect(GRID_META.floor_line_y).toBe(LIT.floor_line_y);
    expect(GRID_META.horizon_y).toBe(LIT.horizon_y);
    expect(GRID_META.px_per_m_at_wall).toBe(LIT.px_per_m_at_wall);
    expect(GRID_META.px_per_m_at_bottom).toBe(LIT.px_per_m_at_bottom);
    expect(GRID_META.image_h_px).toBe(LIT.H);
    expect(GRID_META.wall_width_m).toBe(LIT.wall_width_m);
    expect(GRID_META.key_tint).toBe("#c8b489");
    // |horizon_y − (floor_line_y − 1.6·px_per_m_at_wall/image_h_px)| ≤ 0.02
    const derived = GRID_META.floor_line_y -
      (1.6 * GRID_META.px_per_m_at_wall) / GRID_META.image_h_px;
    expect(Math.abs(GRID_META.horizon_y - derived)).toBeLessThanOrEqual(0.02);
  });

  test("the meta describes the frame it is a meta FOR", () => {
    /* Every other §12.5 assertion compares rendered pixels against the same
     * meta that would carry the error, so a meta that is wrong about the
     * world but consistent with itself passes them all. This is the one
     * clause that reaches outside: the wall the meta claims (`wall_width_m`
     * metres at `px_per_m_at_wall` px/m) has to be the wall the frame shows
     * (§5's pinned 1536 px). At §5's example 4.2 m × 96 px/m = 403 px, the
     * document could address 26% of the canvas and nothing could tell.
     *
     * Row 4's eight measured metas inherit this gate — it is the check that
     * catches a `calibration_px` measured off the wrong feature, or a wall
     * width guessed rather than measured. */
    const { GRID_META } = require(join(repoRoot, "src", "renderer.js"));
    const spanned = GRID_META.px_per_m_at_wall * GRID_META.wall_width_m;
    expect(Math.abs(spanned - LIT.W) / LIT.W,
      `wall_width_m × px_per_m_at_wall = ${spanned}px against a ${LIT.W}px frame`)
      .toBeLessThanOrEqual(0.03);
    // And §5's own calibration audit: px_per_m_at_wall ≈ calibration_px per
    // metre of the named reference (the grid's metre module is 1.0 m).
    expect(GRID_META.calibration_ref).toMatch(/1\.0 m/);
    expect(Math.abs(GRID_META.calibration_px / 1.0 - GRID_META.px_per_m_at_wall) /
      GRID_META.px_per_m_at_wall).toBeLessThanOrEqual(0.03);
  });

  test("grid pixels: floor line, eye line, foreshortened transverse rows, facing glyph on the wall", async ({ page }) => {
    await page.goto(appUrl());
    const exp = gridExpectations();

    // Expected rows from literals: floor 645, eye 491, transverse 698/772/884.
    expect(exp.floorRow).toBe(645);
    expect(exp.eyeRow).toBe(491);
    expect(exp.transverseRows).toEqual([670, 706, 760]);

    // Foreshortening is asserted, not assumed: successive gaps strictly
    // decrease toward the wall (a uniformly-spaced floor fails).
    const [r1, r2, r3] = exp.transverseRows;
    expect(r2 - r1).toBeLessThan(r3 - r2);

    // Row 2 re-points the pure-grid scans at the licensed-bare facings
    // (study S/W carry no entities); entity-laden facings are covered by the
    // entity suites.
    const res = await page.evaluate(async (exp) => {
      const T = window.__T;
      const s = T.renderDirect({ location: "study", facing: "S" });
      const w = T.renderDirect({ location: "study", facing: "W" });
      const floorTop = 660; // below the floor line and its stroke
      return {
        structure: T.gridStructure(s, exp),
        // The glyph is really on the wall: the wall band differs between
        // facings while the floor band hash-matches (only the glyph moved).
        wallS: await T.hashRegion(s, 0, 400, 1536, 160),
        wallW: await T.hashRegion(w, 0, 400, 1536, 160),
        floorS: await T.hashRegion(s, 0, floorTop, 1536, 1024 - floorTop),
        floorW: await T.hashRegion(w, 0, floorTop, 1536, 1024 - floorTop)
      };
    }, exp);

    expect(res.structure.failures).toEqual([]);
    expect(res.wallS, "wall region differs between facings (glyph)").not.toBe(res.wallW);
    expect(res.floorS, "floor region identical across facings").toBe(res.floorW);
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
