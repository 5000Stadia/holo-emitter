import { test, expect, appUrl, repoRoot } from "./helpers.mjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";

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
    // box. 8.8rem = 140.8px is row 2's bottom-chrome reserve (narration log,
    // inventory strip, status line).
    for (const vp of [
      { width: 1280, height: 900 },
      { width: 1920, height: 1080 }, // 16:9 — width-only scaling failed here
      { width: 800, height: 600 }
    ]) {
      await page.setViewportSize(vp);
      const box = await page.locator("#scene").boundingBox();
      const expected = Math.min(vp.width, (vp.height - 140.8) * (1536 / 1024));
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
    // native 1536 CSS px under contain-fit (row 2's 8.8rem reserve needs the
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

test("a fault after the first frame does not print the boot apology", async ({ page }) => {
  /* "The projection will not hold. Nothing of this place can be shown." is
   * written for a page that never got a frame up. The boot handler fired on
   * every uncaught error forever, so a stray throw from anywhere — a timer,
   * an extension — printed it over a painted, working scene with every
   * affordance live: a surface string that is false in a reachable state. */
  await page.goto(appUrl());
  await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
  await page.evaluate(() => window.HOLO_APP.dispatch({ type: "toggle", entity: "desk1" }));
  await page.evaluate(() => { setTimeout(() => { throw new Error("a stray throw"); }, 0); });
  await page.waitForTimeout(120);
  const res = await page.evaluate(() => ({
    lines: [...document.querySelectorAll("#narration p")].map((p) => p.textContent),
    painted: window.HOLO_APP.paints,
    leftShown: getComputedStyle(document.getElementById("chevron-left")).display
  }));
  expect(res.painted, "the page really is working").toBeGreaterThan(0);
  expect(res.lines, "no boot apology over a working page")
    .not.toContain("The projection will not hold. Nothing of this place can be shown.");
  expect(res.leftShown, "and the controls are not withdrawn").not.toBe("none");
});

test("the status line never presents half a row of type", async ({ page }) => {
  // A fixed-height box with wrapping text slices its second row through the
  // ascenders. Row 7 replaces the wording; the box has to hold whatever
  // replaces it at the narrowest width.
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(appUrl());
  await page.waitForFunction(() => !!window.HOLO_APP);
  const s = await page.evaluate(() => {
    const el = document.getElementById("status");
    const cs = getComputedStyle(el);
    return {
      whiteSpace: cs.whiteSpace, ellipsis: cs.textOverflow,
      scrollHeight: el.scrollHeight, clientHeight: el.clientHeight
    };
  });
  expect(s.whiteSpace, "one row, always").toBe("nowrap");
  expect(s.ellipsis, "truncated, not sliced").toBe("ellipsis");
  expect(s.scrollHeight, "and the content fits the box").toBeLessThanOrEqual(s.clientHeight + 1);
});

test("the stage's chrome reserve is what the chrome measures", () => {
  // The stage calc reserved 9.6rem against a chrome of 8.8, so the picture
  // was ~9px shorter and ~13px narrower than the layout's own budget allowed
  // at every height-bound viewport — a stated invariant nothing compared to
  // the thing it states.
  const html = readFileSync(join(repoRoot, "index.html"), "utf8");
  const m = html.match(/100svh - ([\d.]+)rem/);
  expect(m, "the stage states a reserve").not.toBeNull();
  const reserve = Number(m[1]);
  const heights = [...html.matchAll(/#(narration|inventory|status)\s*\{[^}]*height:\s*([\d.]+)rem/g)]
    .map((x) => Number(x[2]));
  expect(heights.length, "three chrome bands").toBe(3);
  const total = heights.reduce((a, b) => a + b, 0);
  expect(total, `chrome measures ${total}rem against a ${reserve}rem reserve`)
    .toBeCloseTo(reserve, 5);
});

test("the chrome measures its reserve in the browser too", async ({ page }) => {
  await page.goto(appUrl());
  await page.waitForFunction(() => !!window.HOLO_APP);
  const m = await page.evaluate(() => {
    const h = (id) => document.getElementById(id).getBoundingClientRect().height;
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    return { chrome: h("narration") + h("inventory") + h("status"), rem };
  });
  // 8.8rem, from the stage's own calc.
  expect(m.chrome).toBeCloseTo(8.8 * m.rem, 0);
});

test("a cold load and a turn leave the console clean", async ({ page }) => {
  /* Row 7 makes the console the load-bearing developer channel, and it
   * started life with a browser performance warning in it: a canvas asked
   * for a 2D context a second time with different options is ignored AND
   * warns, once per sprite per build and once per entity per frame. A
   * channel that is already noisy is a channel nobody reads. */
  const noise = [];
  page.on("console", (m) => {
    if (m.type() === "warning" || m.type() === "error") noise.push(m.type() + ": " + m.text());
  });
  page.on("pageerror", (e) => noise.push("pageerror: " + e.message));
  await page.goto(appUrl());
  await page.waitForFunction(() => !!window.HOLO_APP);
  await page.evaluate(() => {
    const A = window.HOLO_APP;
    A.dispatch({ type: "turn", dir: "right" });
    A.dispatch({ type: "turn", dir: "left" });
    A.dispatch({ type: "toggle", entity: "desk1" });
  });
  expect(noise, "nothing in the console on a healthy run").toEqual([]);
});
