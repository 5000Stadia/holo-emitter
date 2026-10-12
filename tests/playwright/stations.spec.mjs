// Stations (Kabe, 2026-10-12: "make teleport locations that it can induce"): a tester is set down at what it is to try,
// not steered there by words. Every station of the case's house sets you down: on floor your body can stand on, in the
// room it names, a person's or a thing's at least most of its distance off and facing it.
import { test, expect } from "@playwright/test";

const BASE = process.env.BASE || "http://localhost:8794";
const LOAD = 300_000;
test.use({ launchOptions: { args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } });

test("every station of the case sets you down where you can stand, facing what it names", async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium", "where a station sets you is the same on every engine");
  test.setTimeout(2 * LOAD);
  const page = await browser.newPage({ viewport: { width: 390, height: 664 } }), errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${BASE}/lab/manor/index.html?webgl=1&still=0&case=case-1660&fresh&voice=0&stations`, { timeout: LOAD });
  await page.waitForFunction(() => window.__ok, null, { timeout: LOAD });
  const r = await page.evaluate(() => {
    const list = window.__stations(), bad = [], c = window.__camera, groups = {};
    for (const s of list) { groups[s.group] = (groups[s.group] || 0) + 1;
      if (!window.__go(s.id)) { bad.push(`${s.id}: no stand`); continue; } }
    return { n: list.length, groups, bad, select: !!document.getElementById("stations") };
  });
  expect(r.select, "?stations shows the Go to list").toBe(true);
  expect(r.groups.People, "a station for each of the case's people").toBe(4);
  expect(r.groups.Things, "a station for each of the case's things").toBeGreaterThanOrEqual(20);
  expect(r.groups.Rooms, "a station for every room").toBeGreaterThanOrEqual(30);
  expect(r.bad, "every station sets you down").toEqual([]);
  // ?go= at walkable: Daniel's, in his closet, at least a metre off
  await page.goto(`${BASE}/lab/manor/index.html?webgl=1&still=0&case=case-1660&fresh&voice=0&go=person:daniel`, { timeout: LOAD });
  await page.waitForFunction(() => window.__ok, null, { timeout: LOAD }); await page.waitForTimeout(500);
  const d = await page.evaluate(() => { const c = window.__camera; let at = null; window.__scene.traverse(o => { if (o.userData?.presence === "daniel") { at = new window.__THREE.Vector3(); o.getWorldPosition(at); } });
    return { where: document.querySelector("#where .n")?.textContent, off: Math.hypot(at.x - c.position.x, at.z - c.position.z) }; });
  expect(d.where, "?go=person:daniel sets you in his room").toMatch(/CLOSET/i);
  expect(d.off, "and stands you off him").toBeGreaterThan(1);
  expect(errs).toEqual([]);
  await page.close();
});
