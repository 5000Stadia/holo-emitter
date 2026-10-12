// What a load need not work out again (R65, src/make/keep.js): the shipped table of the kinds' sizes and swings is this
// code's (else: node tools/keep-tables.mjs), a load uses it and measures nothing, and the house it builds is the house
// measuring builds. On the banqueting house: the same table, a quick load under swiftshader.
import { test, expect } from "@playwright/test";

const BASE = process.env.BASE || "http://localhost:8794";
const LOAD = 300_000;
test.use({ launchOptions: { args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } });

async function load(browser, qs) {
  const page = await browser.newPage({ viewport: { width: 480, height: 320 } }), errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${BASE}/lab/manor/index.html?webgl=1&still=0&plan=banqueting&${qs}`, { timeout: LOAD });
  await page.waitForFunction(() => window.__ok, null, { timeout: LOAD });
  const r = await page.evaluate(() => { window.requestAnimationFrame = () => 0; const F = (h, v) => Math.imul(h ^ v, 16777619) >>> 0, per = [];
    window.__scene.traverse(o => { const g = o.isMesh && o.geometry; if (!g?.attributes?.position || o.material?.name === "flame" || o.material?.userData?.cls === "flame") return; /* (flames move) */ let h = 2166136261;
      for (const k of ["position", "normal", "uv", "color"]) { const a = g.attributes[k]; if (!a) { h = F(h, 7); continue; } for (let i = 0; i < a.array.length; i++) h = F(h, Math.round(a.array[i] * 1e5) | 0); } per.push(h); });
    per.sort((a, b) => a - b); let all = 2166136261; for (const h of per) all = F(all, h); return { set: all, kept: window.__sizesKept }; });
  await page.close(); return { ...r, errs };
}

test("keep: the shipped size table is this code's, is used, and builds the house measuring builds", async ({ browser }) => {
  test.setTimeout(2 * LOAD);
  const t = await load(browser, ""), m = await load(browser, "keep=0");
  expect(t.kept.from, "the shipped table is stale: run node tools/keep-tables.mjs").toBe("table");
  expect(t.kept.probes.sizes + t.kept.probes.sweeps, "nothing measured from a current table").toBe(0);
  expect(m.kept.probes.sizes, "?keep=0 measures").toBeGreaterThan(0);
  expect(t.set, "the same house either way").toBe(m.set);
  expect([...t.errs, ...m.errs]).toEqual([]);
});
