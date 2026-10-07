/* THE VETTED AUTOMATED CHECKS, AS PASS/FAIL TESTS. [design/production/checks-proposed.md rows 17, 19-23]
 *
 * Kabe vetted six checks that until now were print-only scripts (tools/*.mjs, tests/.*.mjs). Each is one test()
 * here, asserting what its row says holds today; a regression turns it red. They run the real pages of the lab
 * (the static server must be up: BASE, default http://localhost:8794) under swiftshader with ?webgl=1, which
 * works headless with no GPU; chromium only (the flags and the page's WebGL fallback are Chromium's).
 *
 *   npx playwright test -c tests/playwright checks.spec.mjs --project=chromium
 *
 * The tests share pages where they can (the manor page is loaded once for checks 19, 20 and 22; the object page
 * once for checks 21 and 23-kinds) and run in file order, serially: a house builds in about 17 s under
 * swiftshader, and check 23's whole-house scan takes about 75 s of it.
 *
 * Where each lives: 17 src/make/plan-checks.js (node); 19 __sight, 20 tests/.walk-claims.mjs and
 * tests/.oct-walk.mjs, 22 tests/.place.mjs and tests/.required.mjs, 23 __fight (all on lab/manor/index.html);
 * 21 __partsCheck and 23 __fightKinds (lab/brief/object.html), as tools/check-kinds.mjs and
 * tests/.fight-kinds.mjs call them.
 *
 * Changes from the print-only scripts, none of them looser:
 *   - 20, the octagon: tests/.oct-walk.mjs is stale. Since the placer (R54 step 6) the banqueting room has a
 *     drawing table in its middle, so a walk from its centre was blocked at the first step and "diagonalStops"
 *     printed false. Here the octagon is built unfurnished (?nofurn=1: its walls and its hearth's block remain)
 *     so its walls and hearth are what stops you; the diagonal bound is the room's own: the wall stands 4.25 m
 *     from the middle (R 4.6 m, apothem), and you stop a body's width short of it.
 *   - 22: "REFUSED" in the print is any tier; the row's claim is about the story's (required) and the room's
 *     naming (anchor) pieces. An "also" piece (the buttery's second hogshead) that finds no room is not a fault:
 *     the room is simply as full as it can be.
 *
 * THRESHOLDS (check 23), measured 2026-10-06 on this tree, with a small margin so only a regression fails:
 *   kinds: 163 cm² of fighting faces in all, in 9 kinds     -> at most 180 cm², at most 10 kinds
 *   house: 44 fighting triangle pairs, 20 groups, 150 cm²   -> at most 50 pairs, 24 groups, 170 cm²
 */
import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));

const BASE = process.env.BASE || "http://localhost:8794";
const LOAD = 300_000;   // a page that builds the house under swiftshader

test.use({ launchOptions: { args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } });
test.describe.configure({ mode: "serial" });

// ---- pages shared by the tests below (opened on first use, closed after the last)
const pages = new Map();
async function open(browser, name, url, ready, viewport = { width: 1280, height: 900 }) {
  if (pages.has(name)) return pages.get(name);
  const page = await browser.newPage({ viewport }), errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  const entry = { page, errs };
  pages.set(name, entry);
  await page.goto(`${BASE}${url}`, { timeout: LOAD });
  await page.waitForFunction(ready, null, { timeout: LOAD });
  return entry;
}
const manor = (browser, qs = "") => open(browser, "manor" + qs, `/lab/manor/index.html?webgl=1${qs}`, () => window.__ok);
const objects = (browser) => open(browser, "objects", "/lab/brief/object.html?webgl=1&o=furniture&k=table/gateleg&panel=1",
  () => window.__partsCheck && window.__fightKinds, { width: 400, height: 300 });
const done = async (name) => { const e = pages.get(name); pages.delete(name); await e?.page.close(); };

test.beforeEach(({ browserName }) => { test.skip(browserName !== "chromium", "swiftshader flags are Chromium's"); });
test.afterAll(async () => { for (const n of [...pages.keys()]) await done(n); });

// ---- check 17: the plan checks on the carved house (apart, joins, backed, open, fits), for both plans.
// Run in a node child: src/ is ESM without a package "type", which node reads natively and playwright's loader does not.
const CHECK17 = `
import { readFileSync } from "node:fs";
const S = (p) => import(${JSON.stringify(pathToFileURL(ROOT).href)} + "src/make/" + p);
const { carve } = await S("carve.js"), { planChecks } = await S("plan-checks.js"), { houseSpecs, storeys } = await S("house-spec.js");
const { GENTRY_SEAT_1660 } = await S("programs/england-1660.js"), { ROOM_TYPES_1660 } = await S("rooms/england-1660.js");
const { planHybridE } = await S("plans/hybrid-e.js"), { planBanqueting } = await S("plans/banqueting.js"), { settle, value } = await S("catalogue.js");
const KINDS = (await Promise.all(["furniture-1660", "household-1660", "strongroom-1660"].map((f) => S("kinds/" + f + ".js")))).flatMap((m) => m.default);
const sizeOf = (name, over = {}) => { const k = KINDS.find((q) => q.kind === name); if (!k) return null; const s = settle(k, 0, over); if (k.size) return value(k.size, s);
  const W = s.W ?? s.w ?? s.width, H = s.H ?? s.h ?? s.height, D = s.D ?? s.d ?? s.depth; return W != null ? [W, H, D] : null; };
const brief = JSON.parse(readFileSync(${JSON.stringify(ROOT + "lab/brief/manor-1660.json")}));
const hearths = Object.fromEntries(Object.entries(ROOM_TYPES_1660).map(([k, v]) => [k, v.hearth]));
const run = (plan) => { const { levelOf, gap } = storeys(plan), specs = houseSpecs(plan, { types: ROOM_TYPES_1660, brief, gap });
  const r = planChecks({ plan, specs, carved: carve({ plan, specs, levelOf, gap }), sizeOf }); return { ok: r.ok, rooms: specs.size, findings: r.findings.map((f) => f.rule + " " + f.where + ": " + f.what) }; };
const bad = planHybridE(GENTRY_SEAT_1660, { hearths }); bad.rooms.find((q) => q.id === "buttery").rect.y1 += 0.6;
console.log(JSON.stringify({ manor: run(planHybridE(GENTRY_SEAT_1660, { hearths })), banqueting: run(planBanqueting()), planted: run(bad) }));
`;

test("check 17: the plan checks find nothing on the manor plan and the banqueting house", () => {
  const r = JSON.parse(execFileSync(process.execPath, ["--input-type=module", "-e", CHECK17], { encoding: "utf8", cwd: ROOT, timeout: 120_000, stdio: ["ignore", "pipe", "pipe"] }));
  for (const [name, x] of [["manor (hybrid E)", r.manor], ["banqueting house", r.banqueting]]) {
    expect(x.rooms, `rooms checked on the ${name}`).toBeGreaterThan(1);
    expect(x.findings, `plan checks on the ${name}`).toEqual([]);
    expect(x.ok).toBe(true);
  }
  // the checker is not vacuous: one planted fault (the buttery run into the kitchen passage) is caught
  expect(r.planted.findings.some((f) => f.startsWith("apart"))).toBe(true);
});

// ---- check 19: the sight check; every door open, a ray through every doorway from either side passes its wall
test("check 19: every doorway can be seen through from both sides, every door open", async ({ browser }) => {
  test.setTimeout(LOAD + 120_000);
  const { page, errs } = await manor(browser);
  const r = await page.evaluate(() => window.__sight());
  expect(r.blocked, "doorways whose ray stops in a lining standing across them").toEqual([]);
  expect(errs).toEqual([]);
});

// ---- check 20: walking acceptance, on the manor and on the octagon
test("check 20: stairs climb, well and under-flight refuse, hearths stop you short, doors stop shut and pass open", async ({ browser }) => {
  test.setTimeout(LOAD + 120_000);
  const { page, errs } = await manor(browser);
  const r = await page.evaluate(() => { const W = window.__works, plan = window.__plan, out = {}, ok = (name, v) => { out[name] = v; };
    const doors = [...W.things.values()].filter((b) => b.node.userData.opening), set = (b, open) => { if ((W.stateOf(b, "leaf") === "open") !== open) W.act({ b, aff: "leaf" }); W.finish?.(); };
    for (const d of doors) set(d, true);
    ok("hallToFirst", window.__walkPath([[40, 1.8], [46.6, 1.8], [48.65, 2.2], [48.65, 7.1], [46.75, 7.1], [46.75, 2.2], [49.6, 2.0]], "ground").done === true);
    ok("firstToGarret", window.__walkPath([[49.6, 2.0], [48.65, 2.2], [48.65, 7.3], [46.75, 7.3], [46.75, 2.2], [45.0, 1.7]], "first").done === true);
    ok("underStairStops", window.__walkPath([[46.6, 1.8], [46.75, 6.0]], "ground").done === false);
    ok("intoWellStops", window.__walkPath([[47.7, 2.2], [47.7, 5.0]], "first").done === false);
    ok("backStair", window.__walkPath([[7.5, 4.0], [7.5, 7.6], [1.4, 7.6], [1.4, 5.75], [2.3, 5.75], [4.9, 5.75], [4.9, 6.65], [2.3, 6.65], [1.4, 6.65], [1.4, 7.6], [7.5, 7.6], [7.5, 4.0]], "ground").done === true);
    ok("chamberDoor", window.__walkPath([[46.75, 2.2], [50.2, 2.2], [50.2, 3.5], [53, 3.5]], "first").done === true);
    // every hearth: walk straight at its fire from 2 m out; you stop at least 0.15 m short of its block
    const M = window.__manor, hb = M.blocks.filter((q) => q.kind === "hearth");
    out.hearths = M.hearths.map((h) => { const fx = h.at.x, fy = -h.at.z, ix = h.into.x, iy = -h.into.z, d = Math.hypot(ix - fx, iy - fy), ux = (ix - fx) / d, uy = (iy - fy) / d;
      const floor = plan.rooms.find((q) => q.id === h.room).floor, w = window.__walk(fx + ux * 2, fy + uy * 2, fx, fy, floor), blk = hb.find((q) => q.room === h.room);
      const gap = blk ? Math.max(blk.x0 - w.x, w.x - blk.x1, blk.y0 - w.y, w.y - blk.y1) : null;
      return { room: h.room, stopped: !w.done, gap: gap == null ? null : +gap.toFixed(2) }; });
    // each door: shut, you can't pass; open, you can (a hand either side of its middle). Doors onto the forecourt
    // lead out of the house, where there is no floor yet: not walked
    const outdoors = new Set(plan.rooms.filter((q) => q.type === "open").map((q) => q.id));
    out.doors = plan.openings.filter((o) => o.rect && o.kind === "door" && !o.joins.some((j) => outdoors.has(j))).map((o) => { const R = o.rect, ew = o.axis === "EW", cx = (R.x0 + R.x1) / 2, cy = (R.y0 + R.y1) / 2;
      const [a, c] = ew ? [[R.x0 - 0.6, cy], [R.x1 + 0.6, cy]] : [[cx, R.y0 - 0.6], [cx, R.y1 + 0.6]], d = doors.find((q) => q.node.userData.opening === o.id);
      if (!d) return { id: o.id, door: false, open: window.__walk(...a, ...c, o.floor).done };
      set(d, false); const shut = window.__walk(...a, ...c, o.floor).done; set(d, true); const open = window.__walk(...a, ...c, o.floor).done;
      return { id: o.id, joins: o.joins.join("|"), strongroom: o.joins.includes("muniment_room"), shut, open }; });
    return out; });
  const claims = Object.fromEntries(Object.entries(r).filter(([, v]) => typeof v === "boolean"));
  expect(Object.keys(claims).length).toBe(6);
  expect(Object.entries(claims).filter(([, v]) => !v).map(([k]) => k), "walking claims that failed").toEqual([]);
  // every hearth stops you, at least 0.15 m short of its block
  expect(r.hearths.length, "hearths walked").toBeGreaterThan(0);
  expect(r.hearths.filter((h) => !h.stopped || h.gap == null || h.gap < 0.15), "hearths that do not stop you short").toEqual([]);
  // every door with a leaf stops you shut; every doorway passes you open (the strongroom's iron door among them)
  expect(r.doors.length, "doors walked").toBeGreaterThan(0);
  expect(r.doors.some((d) => d.strongroom), "the strongroom's door is among them").toBe(true);
  expect(r.doors.filter((d) => d.door !== false && d.shut !== false).map((d) => d.id), "doors that pass you shut").toEqual([]);
  expect(r.doors.filter((d) => d.open !== true).map((d) => d.id), "doorways that stop you open").toEqual([]);
  expect(errs).toEqual([]);

  // the octagon (unfurnished: see the header): the door stops you shut and passes you open, the four diagonal
  // walls and the east and west walls stop you a body's width short, and the hearth stops you short of its block
  const oct = await open(browser, "oct", "/lab/manor/index.html?webgl=1&plan=banqueting&nofurn=1", () => window.__ok);
  const o = await oct.page.evaluate(() => { const W = window.__works, d = [...W.things.values()].find((b) => b.node.userData.opening === "d1"), out = {},
      set = (open) => { if ((W.stateOf(d, "leaf") === "open") !== open) W.act({ b: d, aff: "leaf" }); W.finish?.(); }, walk = window.__walk;
    set(false); out.shutStops = walk(10, 4.5, 10, 9, "ground").done === false;
    set(true); out.openPasses = walk(10, 4.5, 10, 9, "ground").done === true;
    const from = (x, y) => { const w = walk(10, 10, x, y, "ground"); return { done: w.done, d: +Math.hypot(w.x - 10, w.y - 10).toFixed(2), y: w.y }; };
    out.diagonals = [[14, 14], [6, 14], [14, 6], [6, 6]].map(([x, y]) => from(x, y));
    out.sides = [[15, 10], [5, 10]].map(([x, y]) => from(x, y));
    out.hearth = from(10, 15); out.block = window.__manor.blocks.find((q) => q.kind === "hearth" && q.room === "octagon");
    return out; });
  expect(o.shutStops, "octagon door shut stops you").toBe(true);
  expect(o.openPasses, "octagon door open passes you").toBe(true);
  for (const w of o.diagonals) { expect(w.done, "a diagonal wall stops you").toBe(false); expect(w.d, "a body's width short of the diagonal wall (4.25 m out)").toBeGreaterThan(3.5); expect(w.d).toBeLessThan(4.25); }
  for (const w of o.sides) { expect(w.done, "a side wall stops you").toBe(false); expect(w.d).toBeGreaterThan(3.5); expect(w.d).toBeLessThan(4.25); }
  expect(o.block, "the octagon's hearth has a block").toBeTruthy();
  expect(o.hearth.done, "the octagon's hearth stops you").toBe(false);
  expect(o.block.y0 - o.hearth.y, "short of the hearth's block by at least 0.15 m").toBeGreaterThanOrEqual(0.15);
  expect(oct.errs).toEqual([]);
  await done("oct");
});

// ---- check 21: every part on a relation, over every kind (tools/check-kinds.mjs's page call)
test("check 21: every part of every kind hangs on a relation (0 relation findings, all kinds)", async ({ browser }) => {
  test.setTimeout(LOAD + 180_000);
  const { page, errs } = await objects(browser);
  const r = await page.evaluate(() => window.__partsCheck());
  expect(r.kinds, "kinds checked (55 today)").toBeGreaterThanOrEqual(55);
  expect(r.findings.filter((f) => f.check === "relation").map((f) => `${f.kind} ${f.part}: ${f.what}`), "parts placed by a typed position").toEqual([]);
  expect(r.findings.filter((f) => f.error).map((f) => `${f.kind}: ${f.error}`), "kinds that failed to build").toEqual([]);
  expect(errs).toEqual([]);
});

// ---- check 22: placement keeps its rules, on the house and with a required key
test("check 22: nothing required or naming a room is refused, and the required key lies in its desk's drawer", async ({ browser }) => {
  test.setTimeout(2 * LOAD + 120_000);
  const { page, errs } = await manor(browser);
  const rooms = await page.evaluate(() => [...window.__manor.placements].map(([id, g]) => ({ id, n: g.placed.length, refused: g.refused.map((q) => ({ kind: q.kind, tier: q.tier, why: q.why })) })));
  expect(rooms.length, "rooms placed").toBeGreaterThan(20);
  expect(rooms.reduce((s, q) => s + q.n, 0), "pieces placed").toBeGreaterThan(100);
  expect(rooms.flatMap((q) => q.refused.filter((x) => x.tier === "required" || x.tier === "anchor").map((x) => `${q.id}: ${x.kind} (${x.tier}): ${x.why}`)), "required or naming pieces refused").toEqual([]);
  expect(errs).toEqual([]);
  // the story's key in the study, and in the nursery (which has no desk: the desk comes with it)
  for (const [room, req] of [["study", "key/iron@study:table/joined-with-drawer.drawer"], ["nursery", "key/iron@nursery:table/joined-with-drawer.drawer"]]) {
    const e = await open(browser, "req-" + room, `/lab/manor/index.html?webgl=1&fresh=1&require=${encodeURIComponent(req)}`, () => window.__ok);
    const g = await e.page.evaluate((room) => { const g = window.__manor.placements.get(room), M = window.__manor;
      const key = M.things.find((b) => b.kind.kind === "key/iron" && b.node.parent && b.node.userData.room === room), desk = M.things.find((b) => b.kind.kind === "table/joined-with-drawer" && b.node.userData.room === room);
      const inDrawer = !!(key && desk && desk.movers.get("drawer") && (() => { let o = key.node.parent; while (o) { if (o === desk.movers.get("drawer")) return true; o = o.parent; } return false; })());
      return { order: g.placed.map((q) => `${q.kind}(${q.tier})`).slice(0, 2), desks: g.placed.filter((q) => q.kind === "table/joined-with-drawer").length, inDrawer, refused: g.refused }; }, room);
    expect(g.refused, `${room}: refused`).toEqual([]);
    expect(g.order, `${room}: the story's pieces come first`).toEqual(["table/joined-with-drawer(required)", "key/iron(required)"]);
    expect(g.desks, `${room}: one desk, not a second from the anchors`).toBe(1);
    expect(g.inDrawer, `${room}: the key rides in the desk's drawer`).toBe(true);
    expect(e.errs).toEqual([]);
    await done("req-" + room);
  }
});

// ---- check 23: faces that fight, the kinds (rest and opened) and the whole house
test("check 23: faces that fight stay within today's hairlines (kinds <= 180 cm2 in <= 10 kinds; house <= 50 pairs, 170 cm2)", async ({ browser }) => {
  test.setTimeout(2 * LOAD + 240_000);
  const o = await objects(browser);
  const kinds = await o.page.evaluate(() => window.__fightKinds());
  const flat = Object.entries(kinds).flatMap(([k, gs]) => gs.map((g) => ({ kind: k, ...g }))), cm2 = flat.reduce((s, g) => s + g.area, 0);
  expect(Object.keys(kinds).length, `kinds with faces that fight: ${Object.keys(kinds).join(", ")}`).toBeLessThanOrEqual(10);
  expect(cm2, "cm2 of fighting faces over every kind").toBeLessThanOrEqual(180);
  expect(o.errs).toEqual([]);
  await done("objects");
  // the house, on a page of its own (every door as the page builds it: shut; checks 19 and 20 opened theirs)
  await done("manor");
  const m = await manor(browser);
  const h = await m.page.evaluate(() => { const R = window.__fight(); return { meshes: R.meshes, pairs: R.pairs, groups: R.groups.length, area: R.groups.reduce((s, g) => s + g.area, 0), worst: R.groups.slice(0, 5).map((g) => `${g.pair} ${g.area} cm2 x${g.n} @${g.at}`) }; });
  expect(h.meshes, "meshes scanned").toBeGreaterThan(1000);
  expect(h.pairs, `fighting pairs in the house; worst: ${h.worst.join(" | ")}`).toBeLessThanOrEqual(50);
  expect(h.groups, "groups of fighting pairs").toBeLessThanOrEqual(24);
  expect(h.area, "cm2 of fighting faces in the house").toBeLessThanOrEqual(170);
  expect(m.errs).toEqual([]);
});
