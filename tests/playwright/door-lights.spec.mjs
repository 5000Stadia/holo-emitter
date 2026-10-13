// A room's lights are on before its door opens (Kabe, 2026-10-13: "the lights in a room should trigger on immediately before
// I see them so they don't 'turn on' in front of my eyes … when the door is within range to open before I open it"): stood by
// a shut door, the room behind holds its lights, giving nothing while the door is shut (they cast no shadow: the kitchen's
// fire had lit the passage through its wall); the moment it opens they give their full light, with no fade to watch.
import { test, expect } from "@playwright/test";

const BASE = process.env.BASE || "http://localhost:8794";
const LOAD = 300_000;
test.use({ launchOptions: { args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } });

test("a room behind a door in reach is lit before the door opens, and gives no light through it while shut", async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium", "the light pool is the same on every engine");
  test.setTimeout(2 * LOAD);
  const page = await browser.newPage({ viewport: { width: 800, height: 500 } }), errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${BASE}/lab/manor/index.html?webgl=1&still=0&fresh`, { timeout: LOAD });
  await page.waitForFunction(() => window.__ok && window.__whole, null, { timeout: LOAD });
  const r = await page.evaluate(async () => {
    const P = window.__plan, W = window.__works, M = window.__manor, wait = (ms) => new Promise(r => setTimeout(r, ms)), out = [];
    const door = new Map(M.things.filter(b => b.node.userData.opening).map(b => [b.node.userData.opening, b]));
    // the hall from the screens passage, the kitchen from its passage, the larder from the kitchen: each has windows in view
    for (const id of ["d3", "d7", "d8"]) {
      const o = P.openings.find(q => q.id === id), d = door.get(id), [A, B] = o.joins, ra = P.rooms.find(q => q.id === A).rect;
      const ew = o.axis === "EW", cx = (o.rect.x0 + o.rect.x1) / 2, cy = (o.rect.y0 + o.rect.y1) / 2;
      const s = ew ? Math.sign((ra.x0 + ra.x1) / 2 - cx) : Math.sign((ra.y0 + ra.y1) / 2 - cy), x = ew ? cx + s * 1.4 : cx, y = ew ? cy : cy + s * 1.4;
      window.__place(x, y, Math.atan2(-(cx - x), cy - y) * 180 / Math.PI, 0, o.floor);
      // settled where you stand, however slow the frames (a fixed 2 s had read the hall still in view on a loaded machine)
      for (let t = 0; t < 40 && window.__lights().inView.includes(B); t++) await wait(250); await wait(1500);
      const of = () => window.__lights().windows.filter(w => w && w.room === B);
      const shut = of(); window.__actOn(d, "leaf"); await wait(250); const open = of();
      out.push({ id, B, opened: W.stateOf(d, "leaf"), shut, open });
      window.__actOn(d, "leaf"); await wait(300); }
    return out; });
  for (const { id, B, opened, shut, open } of r) {
    expect(opened, `${id} opens`).toBe("open");
    expect(shut.length, `${id}: ${B}'s lights held while its door is shut`).toBeGreaterThan(0);
    expect(shut.every(w => w.level > 0.95), `${id}: already up behind the shut door`).toBe(true);
    expect(shut.every(w => w.gives === 0), `${id}: giving nothing through the shut door`).toBe(true);
    expect(open.length && open.every(w => w.level > 0.95 && w.gives > 0), `${id}: full the moment it opens`).toBe(true); }
  expect(errs).toEqual([]);
  await page.close();
});
