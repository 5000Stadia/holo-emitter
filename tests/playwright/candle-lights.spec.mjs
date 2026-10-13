// A candle you light lights the room, standing where you are (Kabe, 2026-10-13: "let candles don't do anything as far as
// lighting goes"): the act's own look at the lights came before the flame was up, at strength 0, and nothing looked again
// till you moved. In the dark (?dark) every candle starts out, and one you light gives its light.
import { test, expect } from "@playwright/test";

const BASE = process.env.BASE || "http://localhost:8794";
const LOAD = 300_000;
test.use({ launchOptions: { args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } });

test("in the dark study the candle starts out, and lit where you stand it takes a light", async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium", "the light pool is the same on every engine");
  test.setTimeout(2 * LOAD);
  const page = await browser.newPage({ viewport: { width: 800, height: 500 } }), errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${BASE}/lab/manor/index.html?webgl=1&still=0&fresh&dark&room=study`, { timeout: LOAD });
  await page.waitForFunction(() => window.__ok, null, { timeout: LOAD });
  const r = await page.evaluate(async () => {
    const T = window.__THREE, W = window.__works, wait = (ms) => new Promise(r => setTimeout(r, ms));
    const t = window.__manor.things.find(t => t.node.userData.room === "study" && t.kind.affordances?.light);
    const c = new T.Box3().setFromObject(t.node).getCenter(new T.Vector3()), cx = c.x, cy = -c.z, rr = window.__plan.rooms.find(q => q.id === "study").rect;
    let x = cx, y = cy; for (const [dx, dy] of [[1.5, 0], [-1.5, 0], [0, 1.5], [0, -1.5]]) { const X = cx + dx, Y = cy + dy; if (X > rr.x0 + 0.4 && X < rr.x1 - 0.4 && Y > rr.y0 + 0.4 && Y < rr.y1 - 0.4) { x = X; y = Y; break; } }
    window.__place(x, y, Math.atan2(-(cx - x), cy - y) * 180 / Math.PI, -15, "ground"); await wait(1500);
    const study = () => window.__lights().fires.filter(f => f && f.room === "study");
    const before = { state: W.stateOf(t, "light"), fires: study() };
    window.__actOn(t, "light"); await wait(2000);
    return { before, after: { state: W.stateOf(t, "light"), fires: study() } }; });
  expect(r.before.state, "the dark begins with the candle out").toBe("out");
  expect(r.before.fires.length, "an unlit candle holds no light").toBe(0);
  expect(r.after.state).toBe("lit");
  expect(r.after.fires.length && r.after.fires.every(f => f.level > 0.95), "lit where you stand, it lights").toBeTruthy();
  expect(errs).toEqual([]);
  await page.close();
});
