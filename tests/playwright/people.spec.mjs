// People in our rooms (M8, R60): the harness (lab/people/) with the reference population (src/people/reference.js), or
// whatever population is behind the person interface: our checks (src/people/checks.js) on every person after a spell of
// walking, the state a person gives restoring them where they were, and the moving bodies' layer keeping everyone,
// you too, apart. The walking is stepped (__peopleStep: the page's own people frame, n at a time), so it is the same
// every run and quick under swiftshader.
import { test, expect } from "@playwright/test";

const BASE = process.env.BASE || "http://localhost:8794";
const LOAD = 300_000;
test.use({ launchOptions: { args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } });
test.describe.configure({ mode: "serial" });

async function harness(browser, qs) {
  const page = await browser.newPage({ viewport: { width: 640, height: 400 } }), errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${BASE}/lab/manor/index.html?webgl=1&still=0&${qs}`, { timeout: LOAD });
  await page.waitForFunction(() => window.__ok, null, { timeout: LOAD });
  await page.evaluate(() => { window.requestAnimationFrame = () => 0; });      // the people are stepped by the test, not drawn
  return { page, errs };
}

for (const [name, qs, n] of [["Alice's hall", "plan=alice-hall&people=reference&crowd=6", 6], ["the banqueting house", "plan=banqueting&people=reference&crowd=20", 20], ["the manor", "people=reference&crowd=300", 300]]) {
  test(`people: ${n} in ${name} walk 30 s and every check holds`, async ({ browser }) => {
    test.setTimeout(LOAD + 240_000);
    const { page, errs } = await harness(browser, qs);
    const r = await page.evaluate(() => { const before = window.__peopleCheck(); const ms = window.__peopleStep(900); const after = window.__peopleCheck(), log = window.__peopleLog, c = {};
      for (const e of log) c[e.type] = (c[e.type] || 0) + 1; return { before, after, ms, events: c }; });
    expect(r.before.people, "everyone set down").toBe(n);
    expect(r.before.findings, "where they were set down").toEqual([]);
    expect(r.after.findings, "after 30 s of walking").toEqual([]);
    expect(r.events.arrived || 0, "people got where they were going").toBeGreaterThan(0);
    expect(errs).toEqual([]);
    await page.close();
  });
}

test("people: a person's state restores them where they were, and the layer keeps bodies apart", async ({ browser }) => {
  test.setTimeout(LOAD + 120_000);
  const { page, errs } = await harness(browser, "plan=banqueting&people=reference&crowd=20");
  const r = await page.evaluate(() => { window.__peopleStep(120); const P = window.__people, docs = P.all().map(q => ({ id: q.id, recipe: q.recipe, seed: 0, state: q.state(), where: q.where(), bounds: q.bounds() }));
    for (const d of docs) P.remove(d.id); const gone = P.all().length;
    for (const d of docs) P.add({ id: d.id, recipe: d.recipe, seed: d.seed, at: d.state.at, state: d.state });
    const moved = docs.filter(d => { const w = P.get(d.id).where(), b = P.get(d.id).bounds(); return Math.hypot(w.pos[0] - d.where.pos[0], w.pos[1] - d.where.pos[1], w.pos[2] - d.where.pos[2]) > 1e-6 || w.room !== d.where.room || b.half !== d.bounds.half || b.height !== d.bounds.height; }).map(d => d.id);
    // the layer: a body set on someone is refused there, and you hold your own place
    const q = P.all()[0], w = q.where(), B = window.__bodies;
    return { n: docs.length, gone, moved, refused: B.bodyAt(w.floor, w.pos[0], -w.pos[2], 0.2, null) != null, player: B.bodies().has("player"), check: window.__peopleCheck().findings };
  });
  expect(r.gone, "removed, none left").toBe(0);
  expect(r.moved, "restored from their state where they were, as they were").toEqual([]);
  expect(r.refused).toBe(true);
  expect(r.player).toBe(true);
  expect(r.check).toEqual([]);
  expect(errs).toEqual([]);
  await page.close();
});
