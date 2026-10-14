// The weather in the house (R71; src/make/weather.js): rain, snow and fog from the address until construct's set_conditions
// writes them. What is read from the address, what the sky gives under it, the house's footprint where nothing falls; and on
// the phone tier, what rain costs, counted, never timed (a test machine's milliseconds say nothing of a phone): one draw and
// at most two programs more than the same view dry (the rain's, and the wet ground's graph beside the dry one's), the scene's lights unchanged, the particles a phone's number, the fog
// drawn in, the stars and the sun's shadow gone under cloud.
import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

const BASE = process.env.BASE || "http://localhost:8794";
const LOAD = 300_000;
test.use({ launchOptions: { args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } });

test("what the address says, what the sky gives under it, and the footprint where nothing falls", () => {
  const ROOT = new URL("../../", import.meta.url).href;
  const r = JSON.parse(execFileSync(process.execPath, ["--input-type=module", "-e", `
const W = await import(${JSON.stringify(ROOT + "src/make/weather.js")});
const THREE = { DataTexture: class { constructor(data, width, height) { this.image = { data, width, height }; } }, RGBAFormat: 0, NearestFilter: 0 };   // (all the mask needs)
const of = (q) => W.weatherOf(new URLSearchParams(q)), L = (q) => W.lightUnder(of(q));
const m = W.footprintMask(THREE, [{ x0: 0, x1: 10, y0: 0, y1: 6 }, { x0: 10, x1: 14, y0: 2, y1: 4 }], { px: 0.5, margin: 2 });
const at = (x, y) => { const i = Math.floor((x - m.x0) / (m.x1 - m.x0) * m.tex.image.width), j = Math.floor((y - m.y0) / (m.y1 - m.y0) * m.tex.image.height); return m.tex.image.data[(j * m.tex.image.width + i) * 4]; };
console.log(JSON.stringify({ clear: of(""), rain: of("weather=rain"), light: of("rain=0.2"), snow: of("weather=snow"), fog: of("weather=fog"), dry: of("rain=0"), mixed: of("weather=rain&fog=0.6&wet=0.5"),
  lights: { clear: L(""), rain: L("weather=rain"), fog: L("weather=fog") }, mask: { hall: at(5, 3), wing: at(12, 3), yard: at(12, 5.5), out: at(-1, 3) } }));`], { encoding: "utf8", cwd: new URL("../../", import.meta.url).pathname }));
  expect(r.clear).toEqual({ falls: null, amount: 0, fog: 0, cover: 0, wet: 0, snowCover: 0 });
  expect(r.rain).toMatchObject({ falls: "rain", amount: 0.7, wet: 1 }); expect(r.light).toMatchObject({ falls: "rain", amount: 0.2 });
  expect(r.snow).toMatchObject({ falls: "snow", snowCover: 0.8 }); expect(r.fog).toMatchObject({ falls: null, fog: 0.8 });
  expect(r.dry.falls, "rain=0: nothing falls").toBeNull();
  expect(r.mixed, "each of the address's own words over the preset").toMatchObject({ falls: "rain", fog: 0.6, wet: 0.5 });
  expect(r.mixed.cover, "thick fog hides the sky as cloud does").toBeGreaterThanOrEqual(0.54);
  expect(r.lights.clear, "clear: the day as it was").toMatchObject({ sun: 1, shadow: true, hemi: 1, glass: 1, fog: { near: 220, far: 1500 } });
  expect(r.lights.rain.sun, "under rain cloud the sun's direct light mostly gone").toBeLessThan(0.4); expect(r.lights.rain.shadow).toBe(false);
  expect(r.lights.fog.fog.near, "thick fog: begins a room's depth away").toBeLessThan(16); expect(r.lights.fog.fog.far).toBeLessThan(100);
  expect(r.mask, "under the roof, under a wing's, not the yard between, not outside").toEqual({ hall: 255, wing: 255, yard: 0, out: 0 });
});

async function view(browser, q) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  const page = await ctx.newPage(), errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${BASE}/lab/manor/index.html?webgl=1&still=0&fresh&perf${q}`, { timeout: LOAD });
  await page.waitForFunction(() => window.__ok, null, { timeout: LOAD });
  const r = await page.evaluate(async () => { const wait = (ms) => new Promise(res => setTimeout(res, ms)), info = window.__eng.renderer.info;
    const R = window.__plan.rooms.filter(q => q.type !== "open"), x0 = Math.min(...R.map(q => q.rect.x0)), x1 = Math.max(...R.map(q => q.rect.x1)), y0 = Math.min(...R.map(q => q.rect.y0));
    window.__place((x0 + x1) / 2, y0 - 14, 0, 2, "ground"); await wait(8000);
    const scene = window.__sky.parent, sun = []; scene.traverse(o => { if (o.isDirectionalLight) sun.push(o); });
    let lights = 0; scene.traverse(o => { if (o.isLight) lights++; });
    // the rain's own cost in this same view: drawn, and hidden (a frame each)
    const drops = scene.getObjectByName("weather:rain"); let rainDraws = null;
    if (drops) { drops.visible = false; await wait(3000); const off = info.render.drawCalls; drops.visible = true; await wait(3000); rainDraws = info.render.drawCalls - off; }
    return { phone: window.__eng.phone, weather: window.__weather(), draws: info.render.drawCalls, programs: info.memory.programs, lights, fog: [scene.fog.near, scene.fog.far],
      rainDraws, shadow: sun[0]?.castShadow, sunI: +(sun[0]?.intensity ?? 0).toFixed(2), layers: window.__layers?.() }; });
  await ctx.close();
  return { ...r, errs };
}

test("on the phone tier: rain costs one draw and at most two programs over the same view dry; fog drawn in; no sun's shadow under cloud", async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium", "the counts are the same on every engine");
  test.setTimeout(4 * LOAD);
  const dry = await view(browser, ""), wet = await view(browser, "&weather=rain"), fog = await view(browser, "&weather=fog");   // (one page at a time)
  console.log(`weather on the phone tier: dry ${dry.draws} draws ${dry.programs} programs; rain ${wet.draws} / ${wet.programs}, ${wet.weather.particles} drops; layers (rain) ${JSON.stringify(wet.layers)}`);
  for (const r of [dry, wet, fog]) { expect(r.errs).toEqual([]); expect(r.phone, "the phone tier").toBe(true); }
  expect(wet.weather.particles, "a phone's number of drops: 2500 at full, 70% of it").toBe(1750);
  expect(wet.rainDraws, "one draw for the rain, in the same view").toBe(1);
  expect(wet.programs - dry.programs, "at most two programs: the rain's, and the wet ground's").toBeLessThanOrEqual(2);
  expect(wet.lights, "no light added").toBe(dry.lights);
  expect([dry.shadow, wet.shadow], "the sun's shadow on a clear day, none under rain cloud").toEqual([true, false]);
  expect(wet.sunI).toBeLessThan(dry.sunI);
  expect(fog.fog[0], "fog drawn in").toBeLessThan(16); expect(dry.fog, "a clear day's haze").toEqual([220, 1500]);
});
