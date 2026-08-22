/* THE WALKTHROUGH OF THE WORLD A VISITOR ACTUALLY OPENS. [Row 21]
 *
 * `appUrl` asks for the furnished demo world by name, so every spec written
 * before this row is about a world the bare link no longer boots. This file is
 * about the bare link: the painted navigation world, walked by real clicks and
 * real keys, at a desktop size and at a phone's, from a cold `file://` load.
 *
 * It is deliberately §12.1's shape at navigation scope — there is nothing to
 * open, nothing to take and nothing to be refused for, because the painted
 * world is empty by design until row 4's assets arrive. What it can lose is
 * the ability to WALK, and that is what these cases hold: the two rooms, the
 * eight facings, the doorway that is a fact about the building rather than a
 * fact about a leaf, and the room that shows through it.
 */
import { test, expect, navUrl, POINTER_VIEWPORT, LIT } from "./helpers.mjs";

const PHONE = { width: 390, height: 844 };

async function sceneBox(page) {
  return await page.locator("#scene").boundingBox();
}

async function clickCanvasPoint(page, pt) {
  const box = await sceneBox(page);
  await page.mouse.click(box.x + (pt.x * box.width) / 1536,
    box.y + (pt.y * box.height) / 1024);
}

async function tapCanvasPoint(page, pt) {
  const box = await sceneBox(page);
  await page.touchscreen.tap(box.x + (pt.x * box.width) / 1536,
    box.y + (pt.y * box.height) / 1024);
}

async function aperture(page) {
  return await page.evaluate(() => {
    const A = window.HOLO_APP;
    const vs = A.harness.viewstate;
    const a = window.HOLO.renderer.apertures(
      A.harness.world, A.harness.staging, A.library, A.metaFor(vs), vs)[0];
    return a ? { x: a.x, y: a.y, w: a.w, h: a.h, source: a.source, via: a.via } : null;
  });
}

async function state(page) {
  return await page.evaluate(() => {
    const h = window.HOLO_APP.harness;
    const env = h.envelopes[h.envelopes.length - 1] || null;
    return {
      viewstate: h.viewstate,
      paints: window.HOLO_APP.paints,
      world: window.HOLO_FIXTURE.id,
      entities: h.world.entities.length,
      narration: [...document.querySelectorAll("#narration p")].map((p) => p.textContent),
      lastIntent: env ? env.intent : null,
      lastEvents: env ? env.events : null
    };
  });
}

test.describe("the painted world a visitor opens", () => {
  test.use({ viewport: POINTER_VIEWPORT });

  test("the bare link boots the painted navigation world, on the painting", async ({ page }) => {
    await page.goto(navUrl());
    await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
    const s = await state(page);
    expect(s.world, "the bare URL boots nav-manor — no query, the way a visitor arrives").toBe("nav-manor");
    expect(s.viewstate, "and stands in the study, facing the painted wall")
      .toEqual({ location: "study", facing: "N" });
    expect(s.entities, "an empty world: nothing staged, nothing to click").toBe(0);
    expect(s.paints, "and it painted").toBeGreaterThan(0);

    /* THE PAINTING IS ON SCREEN, not a grid that looks like one. Read as
       pixels: the frame carries no trace of the grid's own floor base colour,
       and the meta it drew with is the measured one. */
    const p = await page.evaluate(() => {
      const A = window.HOLO_APP;
      const meta = A.metaFor({ location: "study", facing: "N" });
      const c = document.getElementById("scene");
      const d = c.getContext("2d").getImageData(0, 0, 1536, 1024).data;
      let grid = 0, lit = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] === 44 && d[i + 1] === 53 && d[i + 2] === 66) grid++;
        if (d[i] > 120) lit++;
      }
      return { grid, lit, measured: meta.measured === true, ppm: meta.px_per_m_at_wall };
    });
    expect(p.measured, "study/N resolves to the meta measured off the painting").toBe(true);
    expect(p.ppm, "at the scale the painting was measured at").toBeCloseTo(232.222, 3);
    expect(p.grid, "no grid floor in a painted room").toBe(0);
    expect(p.lit, "and the fire in the hearth is lit — this is the painting").toBeGreaterThan(1000);
  });

  test("all four facings of each room turn, by real arrow keys", async ({ page }) => {
    await page.goto(navUrl());
    await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
    const seen = [];
    for (let i = 0; i < 4; i++) {
      seen.push((await state(page)).viewstate.facing);
      await page.keyboard.press("ArrowRight");
    }
    expect(seen, "right cycles N -> E -> S -> W").toEqual(["N", "E", "S", "W"]);
    /* And every one of them painted something: a turn that changes no pixels
       is a turn a player cannot see. `turn` is silent by design, so the
       picture is the entire response. */
    const hashes = await page.evaluate(async () => {
      const A = window.HOLO_APP;
      const out = [];
      for (let i = 0; i < 4; i++) {
        out.push(await window.__T.hashScene());
        A.dispatch({ type: "turn", dir: "right" });
      }
      return out;
    });
    expect(new Set(hashes).size, "four facings, four different pictures").toBe(4);
  });

  test("the doorway is a hole in the building, and clicking it walks you through", async ({ page }) => {
    await page.goto(navUrl());
    await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
    await page.keyboard.press("ArrowRight");                 // study/E
    const a = await aperture(page);
    expect(a, "the east wall has a doorway in it").toBeTruthy();
    expect(a.source, "and it comes from the meta, not from a leaf — nothing is staged here")
      .toBe("building");
    await clickCanvasPoint(page, { x: a.x + a.w / 2, y: a.y + a.h / 2 });
    const s = await state(page);
    expect(s.lastIntent, "the middle of the opening means travel")
      .toEqual({ type: "go", exit: "door_study_hall" });
    expect(s.viewstate, "arriving in the passage, facing the way you were walking")
      .toEqual({ location: "hall", facing: "E" });
    expect(s.narration[s.narration.length - 1])
      .toBe("You step through into the cross passage. The air is cooler here, and moves.");
  });

  test("and back again, so the two rooms are a world rather than a one-way trip", async ({ page }) => {
    await page.goto(navUrl());
    await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
    await page.keyboard.press("ArrowRight");
    let a = await aperture(page);
    await clickCanvasPoint(page, { x: a.x + a.w / 2, y: a.y + a.h / 2 });
    // hall/E -> turn to hall/W: E -> S -> W
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    expect((await state(page)).viewstate).toEqual({ location: "hall", facing: "W" });
    a = await aperture(page);
    expect(a, "the passage's west end has the same doorway in it").toBeTruthy();
    await clickCanvasPoint(page, { x: a.x + a.w / 2, y: a.y + a.h / 2 });
    const s = await state(page);
    expect(s.viewstate, "back in the study, still walking west")
      .toEqual({ location: "study", facing: "W" });
    expect(s.narration[s.narration.length - 1])
      .toBe("You pass back into the study, where ink and oak dust close about you again.");
  });

  test("bare wall means nothing: dead space is dead in an empty world too", async ({ page }) => {
    await page.goto(navUrl());
    await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
    await page.keyboard.press("ArrowRight");
    const a = await aperture(page);
    const before = await state(page);
    /* Well clear of the opening, on the painted-or-drawn wall itself. */
    await clickCanvasPoint(page, { x: Math.max(40, a.x - 200), y: a.y + a.h / 2 });
    const after = await state(page);
    expect(after.viewstate, "a click on the wall moves nobody").toEqual(before.viewstate);
    expect(after.paints, "and paints nothing").toBe(before.paints);
    expect(after.narration.length, "and says nothing").toBe(before.narration.length);
  });
});

test.describe("the same world in a hand", () => {
  /* `hasTouch`, not `isMobile`: Firefox refuses `isMobile` outright, and what
     these two cases need is a phone-sized viewport and a finger — not a
     mobile user-agent string. Both engines run them. */
  test.use({ viewport: PHONE, hasTouch: true });

  test("a phone can walk it: the doorway is a real target at 390x844", async ({ page }) => {
    await page.goto(navUrl());
    await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
    /* The chevron, because a phone has no arrow keys — and it is the only way
       to turn on one. */
    await page.locator("#chevron-right").tap();
    expect((await state(page)).viewstate).toEqual({ location: "study", facing: "E" });
    const a = await aperture(page);
    /* THE TARGET'S SIZE IN A FINGER'S TERMS. The canvas is contain-fitted, so
       a 250 px opening on a 1536 px canvas is what is left of it at this
       width. The platform minimum for a touch target is 44 CSS px; this is
       the number that says whether a doorway is one. */
    const box = await sceneBox(page);
    const cssW = a.w * box.width / 1536;
    const cssH = a.h * box.height / 1024;
    expect(cssW, `the doorway is ${cssW.toFixed(1)} CSS px wide on a phone`).toBeGreaterThan(44);
    expect(cssH, `and ${cssH.toFixed(1)} px tall`).toBeGreaterThan(44);
    await tapCanvasPoint(page, { x: a.x + a.w / 2, y: a.y + a.h / 2 });
    const s = await state(page);
    expect(s.viewstate, "and a tap in the middle of it walks through")
      .toEqual({ location: "hall", facing: "E" });
  });

  test("the picture is not clipped off the phone, and the page does not scroll sideways", async ({ page }) => {
    await page.goto(navUrl());
    await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
    const m = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
      scene: document.getElementById("scene").getBoundingClientRect().toJSON()
    }));
    expect(m.scrollW, "no horizontal scroll").toBeLessThanOrEqual(m.clientW + 1);
    expect(m.scene.width, "the whole width of the frame is on screen")
      .toBeLessThanOrEqual(m.clientW + 1);
    expect(m.scene.height, "and the frame has real height").toBeGreaterThan(100);
  });
});
