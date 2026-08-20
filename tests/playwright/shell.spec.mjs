import { test, expect, appUrl } from "./helpers.mjs";

test.describe("shell", () => {
  test("cold file:// load: 1536x1024 scene canvas, non-blank, contain-fit within the window", async ({ page }) => {
    await page.goto(appUrl());
    const dims = await page.evaluate(() => {
      const c = document.getElementById("scene");
      return { w: c.width, h: c.height };
    });
    expect(dims).toEqual({ w: 1536, h: 1024 });

    const distinct = await page.evaluate(() => {
      const c = document.getElementById("scene");
      const data = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
      const seen = new Set();
      for (let i = 0; i < data.length; i += 4) {
        seen.add((data[i] << 16) | (data[i + 1] << 8) | data[i + 2]);
        if (seen.size > 1) break;
      }
      return seen.size;
    });
    expect(distinct, "canvas is non-blank").toBeGreaterThan(1);

    // §5's display half (contain-fit, amended at row 1): the whole frame —
    // including the frame-bottom floor cut, the camera-has-feet device — is
    // visible without scrolling at common window shapes; aspect preserved.
    // Invisible to every pixel hash, so asserted on the displayed bounding
    // box. 9.6rem = 153.6px is row 2's bottom-chrome reserve (narration log,
    // inventory strip, status line).
    for (const vp of [
      { width: 1280, height: 900 },
      { width: 1920, height: 1080 }, // 16:9 — width-only scaling failed here
      { width: 800, height: 600 }
    ]) {
      await page.setViewportSize(vp);
      const box = await page.locator("#scene").boundingBox();
      const expected = Math.min(vp.width, (vp.height - 153.6) * (1536 / 1024));
      expect(Math.abs(box.width - expected)).toBeLessThanOrEqual(2);
      expect(Math.abs(box.height - box.width * (1024 / 1536))).toBeLessThanOrEqual(2);
      expect(box.y + box.height, "frame bottom on screen").toBeLessThanOrEqual(vp.height);
    }
  });

  test("no canvas animation: the scene hash is time-independent (§7)", async ({ page }) => {
    await page.goto(appUrl());
    const h1 = await page.evaluate(() => window.__T.hashScene());
    await page.waitForTimeout(600);
    const h2 = await page.evaluate(() => window.__T.hashScene());
    expect(h2).toBe(h1);
  });

  test("capture class hides all chrome overlapping the scene canvas (§12.6 seam)", async ({ page }) => {
    // §12.6 pins native-size captures: downscaling softens exactly the halo
    // tells the flip test exists to catch. 1536×1200 displays the canvas at
    // native 1536 CSS px under contain-fit (row 2's 9.6rem reserve needs the
    // taller window).
    await page.setViewportSize({ width: 1536, height: 1200 });
    await page.goto(appUrl());
    const nativeBox = await page.locator("#scene").boundingBox();
    expect(Math.abs(nativeBox.width - 1536)).toBeLessThanOrEqual(1);

    // The chevrons genuinely overlap the canvas — the case capture exists for.
    const canvasBox = await page.locator("#scene").boundingBox();
    for (const id of ["#chevron-left", "#chevron-right"]) {
      const b = await page.locator(id).boundingBox();
      const overlaps =
        b.x < canvasBox.x + canvasBox.width && b.x + b.width > canvasBox.x &&
        b.y < canvasBox.y + canvasBox.height && b.y + b.height > canvasBox.y;
      expect(overlaps, `${id} overlaps the canvas`).toBe(true);
    }

    const shotOff = await page.locator("#scene").screenshot();

    await page.evaluate(() => document.body.classList.add("capture"));
    for (const id of ["#chevron-left", "#chevron-right", "#status"]) {
      const display = await page.locator(id).evaluate((el) => getComputedStyle(el).display);
      expect(display, `${id} hidden under capture`).toBe("none");
    }
    const shotOn1 = await page.locator("#scene").screenshot();

    // Toggle cycle: capture-on screenshots are stable, and differ from
    // capture-off exactly because chrome overlapped.
    await page.evaluate(() => document.body.classList.remove("capture"));
    await page.evaluate(() => document.body.classList.add("capture"));
    const shotOn2 = await page.locator("#scene").screenshot();

    expect(shotOn1.equals(shotOn2), "capture-on screenshot stable across toggle").toBe(true);
    expect(shotOn1.equals(shotOff), "capture-on differs from capture-off (chrome was in frame)").toBe(false);

    // The captured element is native-size (PNG IHDR dimensions).
    expect(shotOn1.readUInt32BE(16), "capture width is native").toBe(1536);
    expect(shotOn1.readUInt32BE(20), "capture height is native").toBe(1024);
  });
});
