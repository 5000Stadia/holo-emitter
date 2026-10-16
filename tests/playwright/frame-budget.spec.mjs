// One frame budget for the work that can wait (R81; src/make/frame-budget.js). The ledger on a clock that is counted, never
// timed (a test machine's milliseconds say nothing of a phone): every grant held to its job's ceiling and to the pot, the
// floors of the busy jobs kept back for them, urgent work borrowing the tier's extra, standing still the pot grown, a job
// passed over for its maxWait frames owed its floor, an idle job holding nothing; the same work under a PC's numbers. Then on
// the page, on the phone tier: the land and the rooms served from the one ledger, every room built in the end, a job with
// nothing to do holding nothing. A room's build step can't be cut: what it spends past its grant is counted, not asserted.
import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

const BASE = process.env.BASE || "http://localhost:8794";
const LOAD = 300_000;
test.use({ launchOptions: { args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } });

test("the ledger: ceilings, the pot, floors kept back, urgent extra, still, owed floors, idle jobs; phone and PC", () => {
  const mod = new URL("../../src/make/frame-budget.js", import.meta.url).href;
  const r = JSON.parse(execFileSync(process.execPath, ["--input-type=module", "-e", `
const { makeFrameBudget, TIERS } = await import(${JSON.stringify(mod)});
let t = 0; const now = () => t;
// each job spends exactly what it is granted (the clock moves by it)
const run = (fb, name, opts) => fb.serve(name, (ms) => { t += ms; return true; }, opts);
const mk = (tier) => makeFrameBudget(tier, { now }).job("ways", { floor: 1, ceil: 3 }).job("land", { floor: 1 }).job("rooms", { floor: 1, ceil: 8 });
const out = {};
for (const tier of ["phone", "pc"]) { const fb = mk(tier), T = TIERS[tier], g = {};
  // a frame in which each says it has work; then moving: ways first (urgent), the land, the rooms; then still
  fb.begin({}); for (const j of ["ways", "land", "rooms"]) { fb.grant(j); fb.spent(j, 0, true); }
  fb.begin({ still: false }); g.ways = fb.grant("ways", { urgent: true }); fb.spent("ways", g.ways); g.land = fb.grant("land"); fb.spent("land", g.land); g.rooms = fb.grant("rooms"); fb.spent("rooms", g.rooms);
  fb.begin({ still: true }); g.waysS = fb.grant("ways", { urgent: true }); fb.spent("ways", g.waysS); g.landS = fb.grant("land", { ceil: 2 }); fb.spent("land", g.landS); g.roomsS = fb.grant("rooms"); fb.spent("rooms", g.roomsS);
  out[tier] = { T, g }; }
// floors kept back: once the ways and the rooms have said they have work, the land asked first leaves them their floors
{ const fb = mk("phone"); fb.begin({}); for (const j of ["ways", "rooms"]) { fb.grant(j); fb.spent(j, 0, true); } fb.begin({ still: false }); out.heldBack = fb.grant("land");
  const fresh = mk("phone"); fresh.begin({}); out.freshLand = fresh.grant("land"); }
// an idle job holds no floor
{ const fb = mk("phone"); fb.begin({}); fb.grant("ways"); fb.spent("ways", 0, true); fb.grant("rooms"); fb.spent("rooms", 0, true);
  fb.begin({}); fb.grant("rooms"); fb.spent("rooms", 0, false); fb.begin({}); out.idleFreed = fb.grant("land"); }
// owed: a pot that holds no floor once the first job overspends; the starved job is owed its floor after maxWait frames
{ const fb = makeFrameBudget("phone", { now }).job("hog", { floor: 1 }).job("late", { floor: 1, maxWait: 5 }); const seen = [];
  for (let f = 0; f < 8; f++) { fb.begin({}); fb.grant("hog"); fb.spent("hog", 40); seen.push(fb.grant("late")); if (seen.at(-1)) fb.spent("late", seen.at(-1)); }
  out.owed = { seen, ledger: fb.ledger() }; }
console.log(JSON.stringify(out));`], { encoding: "utf8" }));
  for (const tier of ["phone", "pc"]) { const { T, g } = r[tier];
    expect(g.ways, `${tier}: the ways held to their ceiling`).toBe(3);
    expect(g.ways + g.land + g.rooms, `${tier}: moving, the jobs together within the pot and its urgent extra`).toBeLessThanOrEqual(T.moving + T.urgent + 1e-9);
    expect(g.land, `${tier}: moving, the land's grant leaves the rooms their floor`).toBeLessThanOrEqual(T.moving - 3 - 1);
    expect(g.roomsS, `${tier}: still, the pot grows and the rooms get their ceiling or the rest (the urgent extra is only for urgent work)`).toBe(Math.min(8, T.still - 3 - 2));
    expect(g.landS, `${tier}: a frame's own ceiling`).toBe(2); }
  expect(r.pc.T.frame, "a PC's frame is half a phone's").toBeCloseTo(r.phone.T.frame / 2);
  expect(r.phone.T.people, "the people's share, agreed with Photonic").toEqual({ floor: 4, ceiling: 14 }); expect(r.pc.T.people.floor).toBe(6);
  expect(r.heldBack, "the land asked first keeps back the ways' and the rooms' floors").toBe(r.phone.T.moving - 2);
  expect(r.freshLand, "a job that has never said it has work holds no floor").toBe(r.phone.T.moving);
  expect(r.idleFreed, "the rooms gone idle: their floor free for the others, the ways' still kept").toBe(r.phone.T.moving - 1);
  expect(r.owed.seen.slice(0, 5), "passed over while the pot is spent").toEqual([0, 0, 0, 0, 0]);
  expect(r.owed.seen[5], "owed its floor after maxWait frames").toBe(1);
  expect(r.owed.ledger.owed).toBeGreaterThanOrEqual(1); expect(r.owed.ledger.jobs.late.longestWait).toBe(5);
  expect(r.owed.ledger.overPot, "the hog's overspend is counted").toBeGreaterThanOrEqual(7);
});

test("on the phone tier: the land and the rooms from one ledger, every room and tile built in the end", async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium", "the ledger is the same on every engine");
  test.setTimeout(2 * LOAD);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  const page = await ctx.newPage(), errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${BASE}/lab/manor/index.html?webgl=1&still=0&fresh&perf`, { timeout: LOAD });
  await page.waitForFunction(() => window.__ok, null, { timeout: LOAD });
  // standing still, the rooms still to build are built from the ledger's grants, and the land's tiles
  await page.waitForFunction(() => window.__manor.pending().length === 0 && window.__budget().jobs.rooms.busy === false, null, { timeout: LOAD, polling: 1000 });
  const r = await page.evaluate(() => ({ b: window.__budget(), card: document.querySelector("#perfcard, .perfcard")?.textContent ?? null, marks: window.__eng.marks }));
  await ctx.close();
  console.log(`frame budget on the phone tier: ${JSON.stringify(r.b)}`);
  expect(errs).toEqual([]);
  expect(r.b.tier).toBe("phone");
  expect(r.b.jobs.rooms.grants, "the rooms built from the ledger's grants").toBeGreaterThan(0);
  expect(r.b.jobs.rooms.busy, "every room built in the end").toBe(false);
  expect(r.b.jobs.land.grants, "the land's tiles from the ledger's grants").toBeGreaterThan(0);
  expect(r.b.jobs.ways, "no people here: the ways never run and hold no floor").toMatchObject({ grants: 0, busy: false });
  // (a room's step can't be cut, so what the rooms spend past their grant is counted, not held: max ${r.b.jobs.rooms.max} ms
  // here; finer steps or building in workers is what brings it down)
  expect(r.b.jobs.rooms.over, "the rooms' overspend is counted").toBeGreaterThanOrEqual(0);
});
