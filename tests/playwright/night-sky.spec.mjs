// A night sky has its stars (R71; Kabe, 2026-10-13: "Moon tests the sky should have stars unless otherwise covered by
// clouds/fog"): by a new moon many, by a full moon fewer (its glare drowns the faint ones), the same stars every night;
// covered (?cover, the weather's cloud or fog until R71 sets it), dimmed, and none at all when the sky is overcast.
import { test, expect } from "@playwright/test";

const BASE = process.env.BASE || "http://localhost:8794";
const LOAD = 300_000;
test.use({ launchOptions: { args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } });

test("stars by night: many by a new moon, fewer by a full one, dimmed by cover and gone under an overcast sky", async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium", "the sky is the same on every engine");
  test.setTimeout(5 * LOAD);
  const sky = async (q) => { const page = await browser.newPage({ viewport: { width: 800, height: 500 } }), errs = []; page.on("pageerror", (e) => errs.push(e.message));
    await page.goto(`${BASE}/lab/manor/index.html?webgl=1&room=forecourt&${q}`, { timeout: LOAD });
    await page.waitForFunction(() => window.__ok, null, { timeout: LOAD });
    const r = await page.evaluate(() => { const s = window.__stars; return s ? { stars: s.userData.stars, opacity: s.material.opacity, inSky: s.parent === window.__sky } : null; });
    await page.close(); return { r, errs }; };
  const nw = await sky("moon=new"), full = await sky("moon=full"), half = await sky("moon=new&cover=0.5"), over = await sky("moon=new&cover=1"), day = await sky("");
  for (const x of [nw, full, half, over, day]) expect(x.errs).toEqual([]);
  expect(nw.r.inSky, "the stars follow the sky").toBe(true);
  expect(nw.r.stars, "a new moon's sky: many").toBeGreaterThan(1500);
  expect(full.r.stars, "a full moon's: fewer").toBeLessThan(nw.r.stars * 0.6); expect(full.r.stars).toBeGreaterThan(200);
  expect(half.r.opacity, "half covered: dimmed").toBeCloseTo(0.5, 2);
  expect(over.r, "overcast: none").toBeNull();
  expect(day.r, "by day: none").toBeNull();
});
