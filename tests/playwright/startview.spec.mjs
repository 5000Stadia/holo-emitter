// The start view first (R65, gate g3b7af2 point 3): the manor is walkable with the room you start in and the rooms it can
// show built, the rest arriving after (window.__whole when all are in); and the house that arrives is the house built
// whole (?whole=1), every attribute of every mesh. One engine is enough for the order of building.
import { test, expect } from "@playwright/test";

const BASE = process.env.BASE || "http://localhost:8794";
const LOAD = 300_000;
test.use({ launchOptions: { args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } });

async function house(browser, qs) {
  const page = await browser.newPage({ viewport: { width: 480, height: 320 } }), errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${BASE}/lab/manor/index.html?webgl=1&still=0&${qs}`, { timeout: LOAD });
  await page.waitForFunction(() => window.__ok, null, { timeout: LOAD });
  const atWalkable = await page.evaluate(() => { const M = window.__manor, seen = [...M.visibleFrom(window.__startRoom ?? "great_hall", () => true)];
    return { pending: M.pending().length, unbuiltInView: seen.filter(id => M.rooms.get(id)?.built === false) }; });
  await page.waitForFunction(() => window.__whole !== false, null, { timeout: LOAD });
  await page.waitForFunction(() => window.__eng?.marks?.["tiles-all"] != null, null, { timeout: 60_000 }).catch(() => {});
  const story = await page.evaluate(() => window.__manor.things.filter(b => b.story).map(b => `${b.story}@${b.address}`).sort());
  const missing = await page.evaluate(() => window.__case?.missing || []);
  const set = await page.evaluate(() => { window.requestAnimationFrame = () => 0; const F = (h, v) => Math.imul(h ^ v, 16777619) >>> 0, per = [];
    window.__scene.traverse(o => { const g = o.isMesh && o.geometry; if (!g?.attributes?.position || o.material?.name === "flame" || o.material?.userData?.cls === "flame") return; let h = 2166136261;
      for (const k of ["position", "normal", "uv", "color"]) { const a = g.attributes[k]; if (!a) { h = F(h, 7); continue; } for (let i = 0; i < a.array.length; i++) h = F(h, Math.round(a.array[i] * 1e5) | 0); } per.push(h); });
    per.sort((a, b) => a - b); let all = 2166136261; for (const h of per) all = F(all, h); return all; });
  await page.close(); return { atWalkable, set, story, missing, errs };
}

test("start view first: walkable with what the start can show, then every room, the same house as built whole", async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium", "the order of building is the same on every engine");
  test.setTimeout(3 * LOAD);
  const sv = await house(browser, ""), whole = await house(browser, "whole=1");
  expect(sv.atWalkable.pending, "rooms left to build after walkable").toBeGreaterThan(0);
  expect(sv.atWalkable.unbuiltInView, "every room the start can show (doors open) built before walkable").toEqual([]);
  expect(whole.atWalkable.pending, "?whole=1 builds every room first").toBe(0);
  expect(sv.set, "the same house either way").toBe(whole.set);
  expect([...sv.errs, ...whole.errs]).toEqual([]);
});

test("start view first, a case: its things adopted room by room as they arrive, the same things in the same places as built whole", async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium", "the order of building is the same on every engine");
  test.setTimeout(3 * LOAD);
  const sv = await house(browser, "case=case-1660&fresh=1"), whole = await house(browser, "case=case-1660&fresh=1&whole=1");
  expect(sv.atWalkable.pending, "rooms left to build after walkable").toBeGreaterThan(0);
  expect(sv.atWalkable.unbuiltInView, "every room the start can show built before walkable").toEqual([]);
  expect(sv.missing, "every case thing placed once all rooms are in").toEqual([]);
  expect(sv.story, "each case thing is the same thing as built whole").toEqual(whole.story);
  expect(sv.set, "the same house either way").toBe(whole.set);
  expect([...sv.errs, ...whole.errs]).toEqual([]);
});
