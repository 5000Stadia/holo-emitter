// The accusation on a phone (codex, bd64e68c, 390x664: the lock's blank, last in the sentence, sat under the confirm
// buttons with 3 px showing and no sign there was more): every blank of the sentence is either there to tap, its middle
// hit by a tap, or the sheet shows there is more below and brings the next blank to fill into view.
import { test, expect } from "@playwright/test";

const BASE = process.env.BASE || "http://localhost:8794";
const LOAD = 300_000;
test.use({ launchOptions: { args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } });

for (const [w, hgt] of [[390, 664], [375, 560]]) {
  test(`the accusation's blanks can all be reached at ${w}x${hgt}`, async ({ browser, browserName }) => {
    test.skip(browserName !== "chromium", "a layout check: one engine");
    test.setTimeout(LOAD);
    const ctx = await browser.newContext({ viewport: { width: w, height: hgt }, isMobile: true, hasTouch: true }), page = await ctx.newPage(), errs = [];
    page.on("pageerror", (e) => errs.push(e.message));
    await page.goto(`${BASE}/lab/manor/index.html?webgl=1&still=0&case=case-1660&fresh&voice=0&go=person:anne`, { timeout: LOAD });
    await page.waitForFunction(() => window.__ok, null, { timeout: LOAD }); await page.waitForTimeout(800);
    // (a phone draws through the direct pipeline: tone mapped in each material into the canvas's own MSAA; Photonic's third
    // run on Kabe's iPhone, 2026-10-13)
    expect(await page.evaluate(() => window.__eng.flags.direct), "the phone on the direct pipeline").toBe(1);
    await page.touchscreen.tap(w / 2, hgt / 2); await page.waitForTimeout(600);
    await page.locator("button.tp-st.acc").first().tap(); await page.waitForTimeout(600);
    const r = await page.evaluate(() => { const body = document.querySelector(".tp-acc");
      const hit = (b) => { const q = b.getBoundingClientRect(), e = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2); return e === b || b.contains(e); };
      return { more: body.classList.contains("more"), blanks: [...document.querySelectorAll(".tp-sheet.on .tp-blank")].map(b => ({ key: b.dataset.blank, hit: hit(b) })) }; });
    expect(r.blanks.length, "the sentence's blanks").toBe(5);
    const hidden = r.blanks.filter(b => !b.hit).map(b => b.key);
    if (hidden.length) expect(r.more, `blanks below the fold (${hidden.join(", ")}): the sheet says there is more`).toBe(true);
    // each blank scrolled to is then there to tap
    for (const { key } of r.blanks) {
      const ok = await page.evaluate((key) => { const b = document.querySelector(`.tp-sheet.on .tp-blank[data-blank="${key}"]`); b.scrollIntoView({ block: "nearest" });
        const q = b.getBoundingClientRect(), e = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2); return e === b || b.contains(e); }, key);
      expect(ok, `${key}: tappable once in view`).toBe(true); }
    expect(errs).toEqual([]);
    await ctx.close();
  });
}
