// A crowd of lights on the phone's budget (R79 S4; the plan's P3, design/references/traits/plan-r2.md): forty candles lit in the
// great hall, on the phone tier (a coarse pointer, a phone's screen). Every one shows its state (its flame, by its switch);
// the light they give is carried by the fire pool's three slots and its share, as the window pool carries windows; and the
// cost is counted, never timed (a test machine's milliseconds say nothing about a phone): the scene's lights never change in
// number, putting all forty out and lighting them again compiles nothing new, and each candle costs at most two draw calls.
// Measured 2026-10-13: 131 draws with one candle, 152-163 with forty; 49 programs throughout; 9 lights in the scene.
import { test, expect } from "@playwright/test";

const BASE = process.env.BASE || "http://localhost:8794";
const LOAD = 300_000;
test.use({ launchOptions: { args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } });

async function hall(browser, n) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  const page = await ctx.newPage(), errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${BASE}/lab/manor/index.html?webgl=1&fresh&candles=${n}`, { timeout: LOAD });
  await page.waitForFunction(() => window.__ok, null, { timeout: LOAD });
  const r = await page.evaluate(async () => {
    const wait = (ms) => new Promise(r => setTimeout(r, ms)), W = window.__works, c = window.__candles(), info = window.__eng.renderer.info;
    const v = window.__candlesView(); window.__place(v.x, v.y, 0, -12); await wait(4000);
    // a candle's state as the world has it, and as the picture shows it (its flame)
    const flameOf = (b) => { let f = null; b.node.traverse(o => { if (!f && o.userData.lightGroup && !o.isLight) f = o; }); return f; };
    const read = () => ({ lit: c.filter(b => W.stateOf(b, "light") === "lit").length, shown: c.filter(b => flameOf(b)?.visible).length,
      agree: c.every(b => (W.stateOf(b, "light") === "lit") === !!flameOf(b)?.visible), share: window.__lights().fireShare,
      slots: window.__lights().fires.length, held: window.__lights().fires.filter(Boolean).length, sceneLights: window.__lights().sceneLights,
      programs: info.memory.programs, draws: info.render.drawCalls, phone: window.__eng.phone });
    const start = read();
    for (const b of c) W.act({ b, aff: "light", i: null }); await wait(3000); const out = read();
    for (const b of c) W.act({ b, aff: "light", i: null }); await wait(3000); const back = read();
    return { start, out, back }; });
  await ctx.close();
  return { ...r, errs };
}

test("forty candles in one room on the phone tier: each shows its state, the pool carries their light, nothing new is compiled, and each costs at most two draw calls", async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium", "the phone tier is the same on every engine");
  test.setTimeout(3 * LOAD);
  const one = await hall(browser, 1), forty = await hall(browser, 40);   // (one browser page at a time)
  for (const r of [one, forty]) expect(r.errs).toEqual([]);
  const f = forty;
  expect(f.start.phone, "the phone tier").toBe(true);
  expect(f.start.lit, "all forty lit").toBe(40); expect(f.start.agree, "each flame as its switch says").toBe(true);
  expect(f.out.lit, "all forty out").toBe(0); expect(f.out.agree).toBe(true); expect(f.out.shown).toBe(0);
  expect(f.back.lit, "and lit again").toBe(40); expect(f.back.agree).toBe(true); expect(f.back.shown).toBe(40);
  // the light: the pool's three slots, the rest carried by its share (at most 1.6 times), none carried when they are out
  expect(f.start.slots, "the fire pool's size is fixed").toBe(3); expect(f.start.held).toBe(3);
  expect(f.back.share, "forty lit: their light carried by the share").toBeGreaterThan(1.3);
  expect(f.out.share, "all out: nothing of theirs carried").toBeLessThan(1.1);
  // the cost, counted: the lights in the scene never change in number; nothing compiled by putting them out and lighting them
  expect(f.start.sceneLights, "no light added for a candle").toBe(one.start.sceneLights);
  expect([f.out.sceneLights, f.back.sceneLights]).toEqual([f.start.sceneLights, f.start.sceneLights]);
  expect([f.out.programs, f.back.programs], "no new programs from forty switches").toEqual([f.start.programs, f.start.programs]);
  expect(f.start.programs, "and none for the crowd itself").toBe(one.start.programs);
  expect(Math.max(f.start.draws, f.back.draws) - one.start.draws, "at most two draw calls a candle").toBeLessThanOrEqual(2 * 39);
});
