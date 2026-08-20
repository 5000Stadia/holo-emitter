import { test, expect, appUrl } from "./helpers.mjs";

test.describe("shell", () => {
  test("cold file:// load: 1536x1024 scene canvas, non-blank, scaled to window width", async ({ page }) => {
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

    // §5's display half: the page scales the canvas stack to the window
    // width, aspect preserved — invisible to every pixel hash, so asserted
    // on the displayed bounding box at two window sizes.
    for (const vp of [{ width: 1280, height: 900 }, { width: 800, height: 600 }]) {
      await page.setViewportSize(vp);
      const box = await page.locator("#scene").boundingBox();
      expect(Math.abs(box.width - vp.width)).toBeLessThanOrEqual(2);
      expect(Math.abs(box.height - box.width * (1024 / 1536))).toBeLessThanOrEqual(2);
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
    await page.goto(appUrl());

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
  });
});
