import { test, expect, appUrl, LIT, gridExpectations } from "./helpers.mjs";

test.describe("camera-has-feet geometry (grid canonical meta)", () => {
  test("§5 horizon consistency, from literals", () => {
    // |horizon_y − (floor_line_y − 1.6·px_per_m_at_wall/image_h_px)| ≤ 0.02 —
    // independent arithmetic on the §5 literals, never GRID_META.
    const derived = LIT.floor_line_y - (1.6 * LIT.px_per_m_at_wall) / LIT.H;
    expect(Math.abs(LIT.horizon_y - derived)).toBeLessThanOrEqual(0.02);
  });

  test("grid pixels: floor line, eye line, foreshortened transverse rows, facing glyph on the wall", async ({ page }) => {
    await page.goto(appUrl());
    const exp = gridExpectations();

    // Expected rows from literals: floor 645, eye 491, transverse 698/772/884.
    expect(exp.floorRow).toBe(645);
    expect(exp.eyeRow).toBe(491);
    expect(exp.transverseRows).toEqual([698, 772, 884]);

    // Foreshortening is asserted, not assumed: successive gaps strictly
    // decrease toward the wall (a uniformly-spaced floor fails).
    const [r1, r2, r3] = exp.transverseRows;
    expect(r2 - r1).toBeLessThan(r3 - r2);

    const res = await page.evaluate(async (exp) => {
      const T = window.__T;
      const n = T.renderDirect({ location: "study", facing: "N" });
      const e = T.renderDirect({ location: "study", facing: "E" });
      const floorTop = 660; // below the floor line and its stroke
      return {
        structure: T.gridStructure(n, exp),
        // The glyph is really on the wall: the wall band differs between
        // facings while the floor band hash-matches (only the glyph moved).
        wallN: await T.hashRegion(n, 0, 400, 1536, 160),
        wallE: await T.hashRegion(e, 0, 400, 1536, 160),
        floorN: await T.hashRegion(n, 0, floorTop, 1536, 1024 - floorTop),
        floorE: await T.hashRegion(e, 0, floorTop, 1536, 1024 - floorTop)
      };
    }, exp);

    expect(res.structure.failures).toEqual([]);
    expect(res.wallN, "wall region differs between facings (glyph)").not.toBe(res.wallE);
    expect(res.floorN, "floor region identical across facings").toBe(res.floorE);
  });
});
