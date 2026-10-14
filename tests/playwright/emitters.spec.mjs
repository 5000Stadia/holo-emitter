// The generated browser contract for light (R79 point 4, design/references/traits/plan-r2.md "after round two", item 4): every
// kind that gives light, found by its pinned sources (no list to keep up), stood out in the start room (?emitters) and each lit
// in turn where you stand looking at it: its light takes a slot in the fire pool within the fade, in its source's colour as
// the look has it, and put out it gives the slot back. A hand-worked light is lit by its own switch; one worked only by a link
// (a bulb from its switch across the room) is set as its link sets it. The 40-emitter phone tier is crowd-lights.spec.
// Measured against the 2026-10-13 candle fault (the act's look at the lights came before the flame was up): with the page's
// re-look on a light's change taken out, the lit lights here never take a slot, and this goes red.
import { test, expect } from "@playwright/test";

const BASE = process.env.BASE || "http://localhost:8794";
const LOAD = 300_000;
test.use({ launchOptions: { args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } });

async function contract(browser, backend) {
  const page = await browser.newPage({ viewport: { width: 800, height: 500 } }), errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${BASE}/lab/manor/index.html?${backend}=1&still=0&fresh&dark&emitters`, { timeout: LOAD });
  await page.waitForFunction(() => window.__ok, null, { timeout: LOAD });
  const r = await page.evaluate(async () => {
    const W = window.__works, wait = (ms) => new Promise(res => setTimeout(res, ms)), E = window.__emitters(), out = [];
    const slotOf = (keys) => window.__lights().fires.find(f => f && keys.includes(f.key)) || null;
    for (const [i, e] of E.entries()) { const b = window.__emitter(i);
      window.__place(e.x, e.y - 1.6, 0, -20, null); await wait(800);
      const before = slotOf(e.keys);
      const did = W.act({ b, aff: e.aff, i: null }), how = did.refused ? "set, as its link sets it" : "by its own switch"; if (did.refused) W.set(b, e.aff, null, "lit");
      // (the pool fades a step a drawn frame, and a loaded machine draws under one a second: what is checked is that the pool
      // has taken it, heading for full and already rising, not how long the fade takes)
      let lit = null; for (let t = 0; t < 80 && !((lit = slotOf(e.keys))?.target === 1 && lit.level > 0); t++) await wait(250);
      const r2 = W.act({ b, aff: e.aff, i: null }); if (r2.refused) W.set(b, e.aff, null, "out");
      let gone = null; for (let t = 0; t < 80 && (gone = slotOf(e.keys)) && gone.target !== 0; t++) await wait(250);
      const src = Object.values(e.sources)[0];
      out.push({ kind: e.kind, how, keys: e.keys.length, before: before?.target ?? 0, lit: lit?.target ?? 0, rising: lit?.level ?? 0, color: lit?.color ?? null, want: e.lights?.[src]?.color ?? null, from: e.lights?.[src]?.from, after: gone?.target ?? 0 });
      // (let it fade right out before the next, so each has the pool to itself)
      for (let t = 0; t < 120 && slotOf(e.keys); t++) await wait(250); }
    return { backend: window.__eng.backend, out }; });
  await page.close();
  return { ...r, errs };
}

for (const backend of ["webgl", "webgpu"]) test(`every kind that gives light, on ${backend}: lit, it takes a pool slot in its source's colour from the look; put out, it gives it back`, async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium", "the light pool is the same on every engine");
  test.setTimeout(3 * LOAD);
  const r = await contract(browser, backend);
  // (a machine with no WebGPU adapter falls back to WebGL 2, and says so: that path is then the first test's)
  test.skip(backend === "webgpu" && r.backend !== "webgpu", `no WebGPU adapter here (the page drew on ${r.backend})`);
  console.log(`emitters on ${r.backend}: ${r.out.map(o => `${o.kind} ${o.lit}/${o.rising}`).join(" · ")}`);
  expect(r.errs).toEqual([]);
  expect(r.out.length, "kinds that give light, found by their sources").toBeGreaterThanOrEqual(7);
  for (const o of r.out) {
    expect(o.keys, `${o.kind}: its light pooled`).toBeGreaterThan(0);
    expect(o.before, `${o.kind}: out, it holds no light`).toBe(0);
    expect(o.lit, `${o.kind}: lit ${o.how}, the pool takes it, heading for full`).toBe(1); expect(o.rising, `${o.kind}: and rising`).toBeGreaterThan(0);
    expect(o.color, `${o.kind}: in its source's colour, as the look has it (${o.from})`).toBe(o.want);
    expect(o.after, `${o.kind}: put out, it gives its light back (its slot heading for nothing)`).toBe(0);
  }
});
