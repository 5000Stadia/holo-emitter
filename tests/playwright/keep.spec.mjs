// What a load need not work out again (R65, src/make/keep.js): the shipped tables (the kinds' sizes and swings; the
// place's placement) are this code's (else: node tools/keep-tables.mjs), a load uses them and measures and places
// nothing, and the house it builds is the house measuring and placing builds. On the banqueting house: the same table, a quick load under swiftshader.
import { test, expect } from "@playwright/test";

const BASE = process.env.BASE || "http://localhost:8794";
const LOAD = 300_000;
test.use({ launchOptions: { args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } });

async function load(browser, qs, waitTiles = false) {
  const page = await browser.newPage({ viewport: { width: 480, height: 320 } }), errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${BASE}/lab/manor/index.html?webgl=1&whole=1&still=0&plan=banqueting&${qs}`, { timeout: LOAD });
  await page.waitForFunction(() => window.__ok && window.__whole !== false, null, { timeout: LOAD });
  // (every ground tile built: an indoor start fills the rest after walkable, and a digest taken before would count fewer)
  // (Chromium only: headless Firefox's page grew past 4 GB in the seconds after walkable, with the old tile budget too, and
  // was killed for memory on 2026-10-12; Firefox keeps the placement comparison below)
  if (waitTiles) await page.waitForFunction(() => window.__eng?.marks?.["tiles-all"] != null, null, { timeout: 60_000 }).catch(() => {});
  const r = await page.evaluate(() => { window.requestAnimationFrame = () => 0; const F = (h, v) => Math.imul(h ^ v, 16777619) >>> 0, per = [];
    window.__scene.traverse(o => { const g = o.isMesh && o.geometry; if (!g?.attributes?.position || o.material?.name === "flame" || o.material?.userData?.cls === "flame") return; /* (flames move) */ let h = 2166136261;
      for (const k of ["position", "normal", "uv", "color"]) { const a = g.attributes[k]; if (!a) { h = F(h, 7); continue; } for (let i = 0; i < a.array.length; i++) h = F(h, Math.round(a.array[i] * 1e5) | 0); } per.push(h); });
    per.sort((a, b) => a - b); let all = 2166136261; for (const h of per) all = F(all, h);
    return { set: all, kept: window.__sizesKept, placed: JSON.stringify([...window.__manor.placements].map(([id, g]) => [id, g.placed])) }; });
  await page.close(); return { ...r, errs };
}

test("keep: the shipped tables are this code's, are used, and build the house measuring and placing builds", async ({ browser, browserName }) => {
  test.setTimeout(2 * LOAD);
  const t = await load(browser, "", browserName === "chromium"), m = await load(browser, "keep=0", browserName === "chromium");
  expect(t.kept.from, "the shipped table is stale: run node tools/keep-tables.mjs").toBe("table");
  expect(t.kept.probes.sizes + t.kept.probes.sweeps, "nothing measured from a current table").toBe(0);
  expect(t.kept.places, "the shipped placement is stale: run node tools/keep-tables.mjs").toBe("table");
  expect(m.kept.places, "?keep=0 places").toBe("placed");
  expect(m.kept.probes.sizes, "?keep=0 measures").toBeGreaterThan(0);
  // (to the bit in Chromium, which makes the tables; Firefox's own placement lies 4e-15 m off them, which can flip a
  // rounded digest, so there the placement is compared to 1e-9 m below)
  if (browserName === "chromium") expect(t.set, "the same house either way").toBe(m.set);
  // (to within 1e-9 m, not to the bit: the tables are made in Chromium, and Firefox's own trigonometry places a few things
  // 4e-15 m away; the table gives every browser the one house)
  { const A = JSON.parse(t.placed), B = JSON.parse(m.placed); let worst = 0, shape = true;
    const walk = (x, y) => { if (typeof x === "number" && typeof y === "number") worst = Math.max(worst, Math.abs(x - y)); else if (x && y && typeof x === "object") { const ks = new Set([...Object.keys(x), ...Object.keys(y)]); for (const k of ks) walk(x[k], y[k]); } else if (x !== y) shape = false; };
    walk(A, B); console.log(`placement: largest difference ${worst}`); expect(shape, "the same things, the same fields").toBe(true); expect(worst, "the same places").toBeLessThan(1e-9); }
  expect([...t.errs, ...m.errs]).toEqual([]);
});
