// Sitting in a chair by clicking it (R80; Kabe, 2026-10-13: "clicking the chair should anchor me IN the chair at head height
// to see desk better. Drawer sliding open simply goes under my view and I can look down"; "Chairs/benches should have seated
// eye locations"): in the study, the chair at the desk seats you at its seated eye (about 1.2 m), facing the desk; the desk's
// drawer opened from the chair comes out below your eye, in reach; a step stands you back where you stood, the chair empty.
import { test, expect } from "@playwright/test";

const BASE = process.env.BASE || "http://localhost:8794";
const LOAD = 300_000;
test.use({ launchOptions: { args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } });

test("a chair clicked seats you at its eye, facing its desk; the drawer opens under your view; a step stands you up", async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium", "the page's sitting is the same on every engine");
  test.setTimeout(2 * LOAD);
  const page = await browser.newPage({ viewport: { width: 800, height: 500 } }), errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${BASE}/lab/manor/index.html?webgl=1&fresh&go=room:study`, { timeout: LOAD });
  await page.waitForFunction(() => window.__ok, null, { timeout: LOAD });
  const wait = (f, ms = 30_000) => page.waitForFunction(f, null, { timeout: ms, polling: 100 });
  const before = await page.evaluate(() => { window.__go("room:study"); const M = window.__manor;
    window.__ch = M.things.find(b => b.node.userData.room === "study" && b.kind.kind === "chair/joined");
    window.__tb = M.things.find(b => b.node.userData.room === "study" && b.kind.kind === "table/joined-with-drawer");
    return window.__seated(); });
  expect(before, "standing at first").toBeNull();
  await page.evaluate(() => window.__actOn(window.__ch, "sit"));
  // seated once the glide has landed in the chair (however slow the frames)
  await wait(() => { const s = window.__seated(); return s && Math.hypot(s.at[0] - s.back[0], s.at[1] - s.back[1]) > 0.05 && window.__touch().glide === false; });
  const sat = await page.evaluate(() => { const s = window.__seated(), ch = window.__ch, tb = window.__tb, V = ch.node.position.constructor;
    const e = new V(...ch.seat.eye).applyMatrix4(ch.node.matrixWorld), t = new V(); tb.node.getWorldPosition(t);
    const yaw = s.yaw * Math.PI / 180, fx = -Math.sin(yaw), fy = Math.cos(yaw), tx = t.x - s.at[0], ty = -t.z - s.at[1];
    return { ...s, eyeOff: Math.hypot(e.x - s.at[0], -e.z - s.at[1]), facing: (fx * tx + fy * ty) / Math.hypot(tx, ty), state: window.__works.stateOf(ch, "sit") }; });
  expect(sat.state).toBe("sat");
  expect(sat.eye, "a seated eye, about 1.2 m").toBeGreaterThan(1.05); expect(sat.eye).toBeLessThan(1.3);
  expect(sat.eyeOff, "over its seat").toBeLessThan(0.02);
  expect(sat.facing, "facing the desk").toBeGreaterThan(0.8);
  // the drawer, opened from the chair: in reach, and below your eye
  const dr = await page.evaluate(async () => { const r = window.__actOn(window.__tb, "drawer"); await new Promise(r => setTimeout(r, 1500));
    const g = window.__tb.movers.get(window.__tb.kind.affordances.drawer.mover), p = new g.position.constructor(); g.getWorldPosition(p);
    return { r, state: window.__works.stateOf(window.__tb, "drawer"), y: p.y, seated: !!window.__seated() }; });
  expect(dr.state, "the drawer opens from the chair").toBe("open");
  expect(dr.seated, "and you stay sat").toBe(true);
  expect(dr.y, "below your eye").toBeLessThan(sat.eye - 0.3);
  // a step: up, back where you stood, the chair empty
  // (held until a frame has seen it: a loaded machine had drawn no frame in a 200 ms press)
  await page.keyboard.down("KeyW"); await wait(() => !window.__seated()); await page.keyboard.up("KeyW");
  await wait(() => !window.__seated() && window.__touch().glide === false);
  expect(await page.evaluate(() => window.__works.stateOf(window.__ch, "sit"))).toBe("empty");
  expect(errs).toEqual([]);
});
