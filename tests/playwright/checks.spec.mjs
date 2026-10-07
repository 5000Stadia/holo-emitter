/* THE VETTED AUTOMATED CHECKS, AS PASS/FAIL TESTS. [design/production/checks-proposed.md rows 1-17, 19-23]
 *
 * Kabe vetted these checks ("checks yes"; "Yes" for 1-16); until now they were print-only scripts (tools/*.mjs, tests/.*.mjs)
 * or run by hand. Each is one test() here, asserting what its row says holds today; a regression turns it red. They run the
 * real pages of the lab (the static server must be up: BASE, default http://localhost:8794) under swiftshader with ?webgl=1,
 * which works headless with no GPU; chromium only (the flags and the page's WebGL fallback are Chromium's; checks 4 and 8
 * start Firefox themselves, from playwright, and skip that part if it is not installed).
 *
 *   npx playwright test -c tests/playwright checks.spec.mjs --project=chromium
 *
 * The tests share pages where they can (the manor page is loaded once for checks 3, 9, 11, 19, 20 and 22; the object page
 * once for checks 2, 4, 6, 7, 12a, 13-15, 21 and 23-kinds; one __partsCheck serves 13, 14, 15 and 21) and run in file
 * order, serially: a house builds in about 17 s under swiftshader, and check 23's whole-house scan takes about 75 s of it.
 * The file runs section 1 (no house: node, tools, object page, bench) before section 2 (every check on the house), because an
 * open manor page keeps drawing frames on every core and starves whatever runs beside it. So the order is not numeric.
 *
 * Where each lives:
 *    1 src/make/catalogue.js defineKind (node)            2 works.js on every kind (in the object page)
 *    3 src/make/audit.js apart() on the manor page        4 src/make/id.js (node, Chromium, Firefox)
 *    5 works.js + world.js on the puzzle stage's rules    6, 7 world.js, layout.js, shelving.js (object page)
 *    8 lab/bench/?reference (Chromium and Firefox)        9 the manor, banqueting and Alice pages
 *   10 src/make/reach.js (node)                          11 sound.js: tools/check-place.mjs, __sound(); rule 5 passage.js: tools/escape-demo.mjs
 *  12a __opensOnto (object page)   12b tools/kind-panels.mjs   13-15 __partsCheck (audit.js, mesh-rules.js)
 *   16 tools/plant-faults.mjs
 *   17 src/make/plan-checks.js (node); 19 __sight, 20 tests/.walk-claims.mjs and tests/.oct-walk.mjs, 22 tests/.place.mjs and
 *   tests/.required.mjs, 23 __fight (all on lab/manor/index.html); 21 __partsCheck and 23 __fightKinds (lab/brief/object.html),
 *   as tools/check-kinds.mjs and tests/.fight-kinds.mjs call them.
 *
 * Checks 1-16, how each was made a test (none looser than its row):
 *   - 2: every affordance of every kind with parts built, driven to moved (retrying what waits on another) and home again; the
 *     mover must have moved and come home to 1e-9; a bank (the press's drawers) shut by its own set(). A release gate no one opens
 *     (drinking the bottle, eating the cake: Alice's kinds) makes it one-way on purpose and is allowed not to go back.
 *     Processes: the clock jumped to the end of each phase and to long after; the level is the phase's target.
 *   - 3: no test of this existed (the row says it was found by eye). Every hinged or sliding mover of every thing in the manor,
 *     with all of a thing's movers open at once, against its room's clear floor space (1 mm) and, by audit.js apart() (surface
 *     points a hair inside each, winding number, both ways), against every other thing at rest whose box it reaches. Doors
 *     are among the things (against furniture only: a leaf stands in its wall's thickness). Instanced banks (drawers) are not
 *     expanded. The test plants a fault of each kind and asks the detector to catch it.
 *   - 4: golden values for ids, seeds, streams and settled settings, kept here; checked in node, Chromium and Firefox.
 *   - 5, 6, 7: scripted as the rows say, on ?o=puzzle's own rules and addresses, with the shelves of OWNERS.gentleman (books fill).
 *     6 compares each shelf's placements as a sorted list (the books of a repacked row shift their instance indexes).
 *   - 8: the bench's layout and raw hashes, Chromium against Firefox, case by case. WebKit (needs libwoff1) and the phone are
 *     MANUAL: open lab/bench/ on the device. Not asserted: lab/bench/reference.json, whose "every small kind" is stale (kinds were added).
 *   - 9: "rests" is judged from the built geometry: base within 2 cm of the room's floor; or back within 2 cm of a wall of its room
 *     (kinds with the wall trait); or held; or in a slot of another thing; or on another thing's top. Test stages are not walked.
 *   - 10, 11, 16 and 11's rule 5 run the existing tools or modules and read their results; 12b only that the tool writes a picture per kind.
 *   - 13, 14, 15: the findings of __partsCheck by rule; 21 asks for "relation" findings of the same run.
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
import { test, expect, firefox } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
  // the page is loaded; stop its draw loop. Every check below reads the page's data through evaluate(), and a page left drawing
  // under swiftshader keeps every core busy and starves whatever else is loading (a second page timed out at 5 minutes).
  await page.evaluate(() => { window.requestAnimationFrame = () => 0; });
  return entry;
}
const manor = (browser, qs = "") => open(browser, "manor" + qs, `/lab/manor/index.html?webgl=1${qs}`, () => window.__ok);
const objects = (browser) => open(browser, "objects", "/lab/brief/object.html?webgl=1&o=furniture&k=table/gateleg&panel=1",
  () => window.__partsCheck && window.__fightKinds, { width: 400, height: 300 });
// one __partsCheck over every kind, shared by checks 13, 14, 15 and 21 (about a minute under swiftshader)
let partsMemo = null;
const parts = async (browser) => { const { page, errs } = await objects(browser); partsMemo ??= page.evaluate(() => window.__partsCheck()); return { r: await partsMemo, errs }; };
const done = async (name) => { const e = pages.get(name); pages.delete(name); await e?.page.close(); };

test.beforeEach(({ browserName }) => { test.skip(browserName !== "chromium", "swiftshader flags are Chromium's"); });
test.afterAll(async () => { for (const n of [...pages.keys()]) await done(n); });

// ---- helpers for the checks below that run in a node child (src/ is typeless ESM, which node reads natively)
const ROOT_URL = pathToFileURL(ROOT).href;
const node = (src, timeout = 120_000) => execFileSync(process.execPath, ["--input-type=module", "-e", src], { encoding: "utf8", cwd: ROOT, timeout, stdio: ["ignore", "pipe", "pipe"] });
const tool = (args, timeout = 300_000, env = {}) => { try { return { code: 0, out: execFileSync(process.execPath, args, { encoding: "utf8", cwd: ROOT, timeout, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, BASE, ...env } }) }; }
  catch (e) { return { code: e.status ?? 1, out: String(e.stdout || "") + String(e.stderr || "") }; } };

// ---- the kit and the production system, inside a page of the lab (checks 2, 5, 6, 7): the same modules the page itself
// loaded (one registry), a kit of materials made once. window.__chk = { THREE, K, M, look }
const makeCtx = async () => {
  if (window.__chk) return true;
  const THREE = await import("three"), { makeKit } = await import("/lab/painted/procedural.js"), { strongroomMaterials } = await import("/lab/brief/strongroom.js"), M = await import("/src/make/index.js");
  const K = await makeKit(THREE, { floor: [6, 4] }), S = strongroomMaterials(THREE, K);
  window.__chk = { THREE, K, M, look: M.lookC1660(THREE, K, S) };
  return true;
};

// ---- section 1: checks that need no house: node, the tools, the object page (it draws nothing by itself) and the bench. The
// manor page, once open, keeps drawing frames under swiftshader on every core and starves whatever runs beside it (the bench
// timed out at 5 minutes behind it), so every house check is gathered in section 2, below.

// ---- check 1: a malformed kind is refused at definition, with the reason
test("check 1: a malformed kind is refused at definition, with its reason (and a good one is accepted)", () => {
  const r = JSON.parse(node(`
const { definePart, defineKind, kindOf } = await import(${JSON.stringify(ROOT_URL + "src/make/catalogue.js")});
definePart("box", { build() {} });
const good = { kind: "test/good", v: 1, parts: [{ part: "box" }], affordances: { lid: { mover: "lid", motion: "hinge", axis: [0, 1, 0], angle: 1 }, lock: { motion: "state", auto: true } } };
const cases = {
  "a bad name": { ...good, kind: "Not A Name" },
  "an unknown field": { ...good, kind: "test/field", colour: "red" },
  "a missing part": { ...good, kind: "test/part", parts: [{ part: "nothing_by_this_name" }] },
  "an unknown motion": { ...good, kind: "test/motion", affordances: { lid: { motion: "wobble" } } },
  "a need on an affordance it doesn't have": { ...good, kind: "test/need", affordances: { lid: { mover: "lid", motion: "hinge", requires: { lock: "unlocked" } } } },
  "a version that is not an integer": { ...good, kind: "test/ver", v: 1.5 },
  "no parts at all": { ...good, kind: "test/none", parts: [] },
  "an unknown field on an affordance": { ...good, kind: "test/afield", affordances: { lid: { motion: "slide", speeed: 3 } } },
  "a start of a process it doesn't have": { ...good, kind: "test/starts", affordances: { go: { motion: "switch", starts: "burn" } } },
  "a setting that is neither number, range, choice nor value": { ...good, kind: "test/setting", settings: { w: { nope: 1 } } },
};
const out = { refused: {}, registered: [] };
for (const [name, k] of Object.entries(cases)) { try { defineKind(k); out.refused[name] = null; } catch (e) { out.refused[name] = String(e.message); } if (kindOf(k.kind)) out.registered.push(k.kind); }
defineKind(good); out.good = !!kindOf("test/good");
console.log(JSON.stringify(out));`));
  const want = { "a bad name": /family\/name/, "an unknown field": /unknown field colour/, "a missing part": /no part called nothing_by_this_name/, "an unknown motion": /motion is one of/,
    "a need on an affordance it doesn't have": /requires lock, which it doesn't have/, "a version that is not an integer": /integer/, "no parts at all": /at least one part/,
    "an unknown field on an affordance": /unknown field speeed/, "a start of a process it doesn't have": /isn't a process/, "a setting that is neither number, range, choice nor value": /setting w is/ };
  for (const [name, re] of Object.entries(want)) { expect(r.refused[name], `${name}: refused`).not.toBeNull(); expect(r.refused[name], `${name}: the reason`).toMatch(re); }
  expect(r.registered, "a refused kind is never registered").toEqual([]);
  expect(r.good, "a good kind is accepted").toBe(true);
});

// ---- check 2: every movable works: each affordance drives its mover and brings it home exactly; each process reaches its phase targets
test("check 2: every movable moves and comes home exactly; every process reaches its phase targets when the clock jumps", async ({ browser }) => {
  test.setTimeout(LOAD + 180_000);
  const { page, errs } = await objects(browser);
  await page.evaluate(makeCtx);
  const r = await page.evaluate(() => { const { THREE, K, M, look } = window.__chk, out = { kinds: 0, affs: 0, moved: 0, banks: 0, oneWay: [], procs: 0, faults: [] };
    const EPS = 1e-9, snap = (g) => [...g.position.toArray(), ...g.quaternion.toArray(), ...g.scale.toArray()], dist = (a, c) => Math.max(...a.map((v, i) => Math.abs(v - c[i])));
    for (const k of M.kinds()) {
      if (!k.affordances || M.missingParts(k).length) continue;
      const b = M.build(THREE, K, look, k.kind, `check/${k.kind}`); if (b.placeholder) continue;
      out.kinds++;
      const w = M.makeWorks(THREE, { ask: () => true }); w.add(b);
      const affs = Object.entries(k.affordances), bank = (a) => b.banks.get(a.mover), at = (a) => bank(a) ? 0 : null, init = Object.fromEntries(affs.map(([n, a]) => [n, w.stateOf(b, n, at(a))]));
      const home = new Map(), dev = new Map(), bankM = (a, i) => { const m = new THREE.Matrix4(); bank(a).meshes[0].getMatrixAt(i, m); return m.elements.slice(); };
      for (const [, a] of affs) { const g = b.movers.get(a.mover); if (g) home.set(a.mover, snap(g)); }
      // a bank (a press's drawers) is many movers drawn as instances: its first and last, set shut, are the reference
      const shut = new Map(); for (const [n, a] of affs) if (bank(a)) { const bk = bank(a), last = bk.count - 1; bk.set(0, 0); bk.set(last, 0); shut.set(n, [0, last].map((i) => bankM(a, i))); }
      const ticks = () => { for (let i = 0; i < 400; i++) w.tick(0.05); };
      // drive every affordance to its moved state, retrying what waits on another (a lid on its padlocks)
      let todo = affs.map(([n]) => n);
      for (let round = 0; round < 4 && todo.length; round++) todo = todo.filter((n) => { const a = k.affordances[n]; let did;
        try { did = w.act({ b, aff: n, i: at(a) }).did; } catch (e) { out.faults.push(`${k.kind} ${n}: ${e}`); return false; }
        if (!did) return true;
        let md = 0; for (let i = 0; i < 400; i++) { w.tick(0.05); const g = b.movers.get(a.mover); if (g) md = Math.max(md, dist(snap(g), home.get(a.mover)));
          if (bank(a)) md = Math.max(md, dist(bankM(a, 0), shut.get(n)[0])); }
        dev.set(n, Math.max(dev.get(n) || 0, md)); return false; });
      for (const n of todo) out.faults.push(`${k.kind} ${n}: never moved (refused)`);
      for (const [n, a] of affs) { out.affs++; if (bank(a)) out.banks++; const needs = ["slide", "hinge", "lever"].includes(a.motion) || (a.motion === "switch" && a.angle);
        if (dev.has(n)) { out.moved++; if (needs && (a.mover) && !(dev.get(n) > 1e-4)) out.faults.push(`${k.kind} ${n}: ${a.motion} did not move its mover (${dev.get(n)})`); } }
      // and home again (what declares a release gate no one opens is one-way on purpose: drinking the bottle)
      for (let round = 0; round < 4; round++) { let any = false; for (const [n, a] of affs) if (w.stateOf(b, n, at(a)) !== init[n]) { try { const r = w.act({ b, aff: n, i: at(a) }); any ||= r.did; } catch (_) {} } ticks(); if (!any) break; }
      for (const [n, a] of affs) { const back = w.stateOf(b, n, at(a)) === init[n];
        if (!back) { if (a.release) out.oneWay.push(`${k.kind} ${n}`); else out.faults.push(`${k.kind} ${n}: did not go back (${w.stateOf(b, n, at(a))})`); continue; }
        const g = b.movers.get(a.mover); if (g && a.motion !== "state" && dist(snap(g), home.get(a.mover)) > EPS) out.faults.push(`${k.kind} ${n}: mover not home, off by ${dist(snap(g), home.get(a.mover))}`);
        if (bank(a)) { const now = [0, bank(a).count - 1].map((i) => bankM(a, i)); if (now.some((m, j) => m.some((v, q) => Math.abs(v - shut.get(n)[j][q]) > EPS))) out.faults.push(`${k.kind} ${n}: bank not shut`); } }
    }
    // processes: start each at its initial level, jump the clock to the end of each phase, and to long after
    for (const k of M.kinds()) { if (!k.processes || M.missingParts(k).length) continue;
      const b = M.build(THREE, K, look, k.kind, `check/${k.kind}`); if (b.placeholder) continue;
      for (const [name, pr] of Object.entries(k.processes)) { let now = 0; const store = {}, w = M.makeWorks(THREE, { store, clock: () => now }); w.add(b);
        store[`${b.id}~${name}`] = { from: pr.initial ?? 1, at: 0 }; out.procs++;
        let t = 0, cur = pr.initial ?? 1;
        for (const f of pr.phases) { t += Math.abs(f.to - cur) / f.rate; cur = f.to; now = t + 1e-9; w.tick(0); const L = w.level(b, name); if (Math.abs(L - f.to) > 1e-6) out.faults.push(`${k.kind} ${name}: at ${t.toFixed(0)} s level ${L}, wanted ${f.to}`); }
        now = t + 1000; w.tick(0); const L = w.level(b, name); if (Math.abs(L - cur) > 1e-6) out.faults.push(`${k.kind} ${name}: long after, level ${L}, wanted ${cur}`); } }
    return out; });
  expect(r.kinds, "kinds with affordances built and driven").toBeGreaterThanOrEqual(30);
  expect(r.affs, "affordances driven").toBeGreaterThanOrEqual(50);
  expect(r.moved, "every affordance acted").toBe(r.affs);
  expect(r.banks, "a bank of instanced movers driven (the press's drawers)").toBeGreaterThan(0);
  expect(r.procs, "processes driven").toBeGreaterThanOrEqual(4);
  expect(r.faults, "movers that did not move, did not come home exactly, or processes off their targets").toEqual([]);
  expect(errs).toEqual([]);
});

// ---- check 4: ids agree everywhere: fixed birth addresses hash to fixed ids and seeds, checked against stored values
// in node and in each browser engine here (Chromium; Firefox if it is installed). WebKit and the phone stay manual:
// they need libwoff1 and a device, so they are the bench's job (check 8's page, run by hand there).
const ID_PROBE = `async (idUrl, catUrl, kindsUrl) => {
  const { idOf, seedOf, rng, streamOf, hashOf, stable } = await import(idUrl), { settle } = await import(catUrl), F = (await import(kindsUrl)).default, kind = (n) => F.find((k) => k.kind === n);
  const A = ["manor/muniment_room/press:A/drawer:3.2", "story:alice/ch1/bottle", "stage/furniture/chest/boarded", "", "manor/great_hall/chest/boarded:6", "caf\\u00e9/\\u00dcn\\u00efcode/\\u2603/\\u{1F642}"];
  return { ids: A.map((a) => [a, idOf(a), seedOf(a)]), rng: [0, 1660, 4294967295].map((s) => { const r = rng(s); return [s, [0, 1, 2, 3].map(() => Math.round(r() * 4294967296))]; }),
    stream: [[1660, "habit"], [seedOf("story:alice/ch1/bottle"), "w"]].map(([s, n]) => [s, n, Math.round(streamOf(s, n)() * 4294967296)]),
    settle: ["chest/boarded", "table/gateleg", "cupboard/court"].map((k) => [k, seedOf("manor/x/" + k), hashOf(settle(kind(k), seedOf("manor/x/" + k)))]),
    stable: stable({ b: [1, { z: 1, a: 2 }], a: "x" }) }; }`;
const ID_GOLDEN = {
  ids: [["manor/muniment_room/press:A/drawer:3.2", "0f2gug60dz5o87", 911137830], ["story:alice/ch1/bottle", "15y5uw60cwvwu3", 2536493478], ["stage/furniture/chest/boarded", "1d1vv4s0czv84r", 2966008924],
    ["", "0ztntfp15z3edo", 2166136261], ["manor/great_hall/chest/boarded:6", "0xemwv21sr598n", 2019967454], ["café/Ünïcode/☃/\u{1F642}", "1wo9efn1udbuw8", 4152449363]],
  rng: [[0, [2654177282, 3513850444, 130533452, 827940092]], [1660, [53223149, 1950891324, 841421225, 4123830558]], [4294967295, [157364914, 607734090, 4084119400, 1046446227]]],
  stream: [[1660, "habit", 1080777683], [2536493478, "w", 592944930]],
  settle: [["chest/boarded", 820676021, "1q8s7kb0e1j4vk"], ["table/gateleg", 1985294728, "0tkybkj1kfpguu"], ["cupboard/court", 2904813438, "1x4j2oo00i5zcz"]],
  stable: '{"a":"x","b":[1,{"a":2,"z":1}]}',
};
test("check 4: ids, seeds and streams from fixed addresses equal the stored values (node, Chromium, Firefox when installed)", async ({ browser }) => {
  test.setTimeout(LOAD + 120_000);
  const inNode = JSON.parse(node(`const f = ${ID_PROBE}; console.log(JSON.stringify(await f(${JSON.stringify(ROOT_URL + "src/make/id.js")}, ${JSON.stringify(ROOT_URL + "src/make/catalogue.js")}, ${JSON.stringify(ROOT_URL + "src/make/kinds/furniture-1660.js")})));`));
  expect(inNode, "node").toEqual(ID_GOLDEN);
  const { page, errs } = await objects(browser);
  expect(await page.evaluate(`(${ID_PROBE})("/src/make/id.js", "/src/make/catalogue.js", "/src/make/kinds/furniture-1660.js")`), "Chromium").toEqual(ID_GOLDEN);
  expect(errs).toEqual([]);
  let ff = null; try { ff = await firefox.launch(); } catch (e) { /* not installed: node and Chromium stand */ }
  if (ff) { try { const p = await ff.newPage(); await p.goto(`${BASE}/lab/index.html`, { timeout: LOAD });
    expect(await p.evaluate(`(${ID_PROBE})("/src/make/id.js", "/src/make/catalogue.js", "/src/make/kinds/furniture-1660.js")`), "Firefox").toEqual(ID_GOLDEN); } finally { await ff.close(); } }
});

// ---- check 5: gates and rules hold, on the puzzle stage (?o=puzzle): the stage's own rules, its things at its addresses, the
// state kept in the world document as the strongroom keeps it, and read back from the saved document (a reload)
test("check 5: a locked door waits for its key; a burning candle can't be taken; 2 of 4 candles do nothing, the 3rd fires the rule; a reload gives the same states", async ({ browser }) => {
  test.setTimeout(LOAD + 120_000);
  const e = await open(browser, "puzzle", "/lab/brief/object.html?webgl=1&o=puzzle", () => window.__ok && window.__works && window.__obj, { width: 400, height: 300 });
  await e.page.evaluate(makeCtx);
  const r = await e.page.evaluate(() => { const { THREE, K, M, look } = window.__chk, rules = window.__obj.userData.rules, said = [], log = {};
    const stage = [...window.__works.things.values()].map((b) => ({ kind: b.kind.kind, address: b.address, settings: b.settings }));
    const world = M.makeWorld(), mk = () => stage.map((s) => M.build(THREE, K, look, s.kind, s.address, s.settings)), things = mk(), store = world.store();
    const works = M.makeWorks(THREE, { store, save: (st) => world.save(st, "player", (id) => works.things.get(id)), say: (t) => said.push(t) });
    for (const b of things) works.add(b); works.rules(rules);
    const by = (a) => things.find((b) => b.address === a), A = by("stage/puzzle/door:a"), B = by("stage/puzzle/door:b"), key = by("stage/puzzle/bench/key"), cs = [0, 1, 2, 3].map((i) => by(`stage/puzzle/bench/candle:${i}`));
    const st = (b, aff) => works.stateOf(b, aff), fin = () => { works.finish(); for (let i = 0; i < 100; i++) works.tick(0.05); };
    let x = works.act({ b: A, aff: "leaf" }); fin(); log.aRefused = [x.did, st(A, "lock"), st(A, "leaf")];
    x = works.take({ b: key }); log.took = [x.did, works.held().map((b) => b.kind.kind)];
    x = works.act({ b: A, aff: "leaf" }); fin(); log.aOpens = [x.did, x.said, st(A, "lock"), st(A, "leaf")];
    x = works.act({ b: B, aff: "leaf" }); fin(); log.bRefuses = [x.did, st(B, "lock"), st(B, "leaf")];
    x = works.act({ b: cs[0], aff: "light" }); log.lit1 = [x.did, st(cs[0], "light")];
    x = works.take({ b: cs[0] }); log.noTake = [x.did, x.refused, works.held().length];
    works.act({ b: cs[1], aff: "light" }); fin(); log.two = [st(B, "lock"), st(B, "leaf"), works.vars(), said.length];
    works.act({ b: cs[2], aff: "light" }); fin(); log.three = [st(B, "lock"), st(B, "leaf"), works.vars(), said.length];
    const world2 = M.makeWorld(JSON.parse(JSON.stringify(world.doc))), things2 = mk(), works2 = M.makeWorks(THREE, { store: world2.store() }); for (const b of things2) works2.add(b); works2.rules(rules);
    const snap = (w, ts) => JSON.stringify(ts.map((b) => [b.address, Object.keys(b.kind.affordances || {}).map((a) => w.stateOf(b, a)).join("|")]).concat([["vars", w.vars()], ["held", w.held().map((b) => b.address)]]));
    log.reloadSame = snap(works, things) === snap(works2, things2); log.reloaded = snap(works2, things2); return log; });
  expect(r.aRefused, "door A refuses without its key").toEqual([false, "locked", "closed"]);
  expect(r.took, "the key can be taken").toEqual([true, ["key/iron"]]);
  expect(r.aOpens, "door A unlocks and opens in one act with the key").toEqual([true, ["the key turns in the lock"], "unlocked", "open"]);
  expect(r.bRefuses, "door B refuses (its key is not to be had)").toEqual([false, "locked", "closed"]);
  expect(r.lit1, "a candle lights").toEqual([true, "lit"]);
  expect(r.noTake, "a burning candle can't be taken").toEqual([false, "not while it burns", 1]);
  expect(r.two, "2 of 4 lit: door B still locked and shut, the rule unfired, nothing said").toEqual(["locked", "closed", {}, 0]);
  expect(r.three, "the 3rd fires the rule: the variable is set, door B unlocked and open, the line said").toEqual(["unlocked", "open", { candles_lit: true }, 1]);
  expect(r.reloadSame, `a reload from the world document gives the same states: ${r.reloaded}`).toBe(true);
  expect(e.errs).toEqual([]);
  await done("puzzle");
});

// ---- checks 6 and 7: the world document. A gentleman's bookcase (books "fill": every shelf full) at two addresses
const worldPage = (browser) => objects(browser).then(async (e) => { await e.page.evaluate(makeCtx); return e; });
test("check 6: a book the story names for case A repacks only its own row; case B and A's other rows stay bit-identical", async ({ browser }) => {
  test.setTimeout(LOAD + 120_000);
  const { page, errs } = await worldPage(browser);
  const r = await page.evaluate(() => { const { THREE, K, M, look } = window.__chk, { layoutOf, build, blend, OWNERS } = M;
    const A = "check/locality/A", B = "check/locality/B", O = OWNERS.gentleman, { kind, ...over } = O.traits.shelving;
    const hero = [{ name: "dalton", in: A, book: { size: "quarto", title: "Dalton's Countrey Justice", binding: "gilt" } }], ctx1 = blend([O]), ctx2 = blend([{ ...O, heroes: hero }]);
    const lay = (addr, ctx) => { const b = build(THREE, K, look, kind, addr, over, ctx); return { ...layoutOf(THREE, b.node), shelves: b.info.layout.split("\n").map((l) => ({ k: l.split(":")[0].replace(/ \(.*/, ""), y: +/at ([\d.]+) m/.exec(l)[1] })) }; };
    const a0 = lay(A, ctx1), a1 = lay(A, ctx2), b0 = lay(B, ctx1), b1 = lay(B, ctx2);
    // each placement under the shelf it stands on, compared row by row as a sorted list of what stands where
    const rows = (L) => { const m = new Map(); for (const e of L.entries) { const f = e.split(" "), yy = +f[2] / 1e4, sh = L.shelves.filter((q) => q.y <= yy + 0.02).sort((p, q) => q.y - p.y)[0], y = sh ? sh.k + "@" + sh.y : "none";
      (m.get(y) || m.set(y, []).get(y)).push(f.slice(1).join(" ")); } for (const v of m.values()) v.sort(); return m; };
    const ra = rows(a0), rb = rows(a1), changed = [...new Set([...ra.keys(), ...rb.keys()])].filter((y) => JSON.stringify(ra.get(y)) !== JSON.stringify(rb.get(y)));
    return { bSame: b0.layout === b1.layout, bRaw: b0.raw === b1.raw, aDiffers: a0.layout !== a1.layout, rows: ra.size, changed, changedN: changed.reduce((s, y) => s + Math.max(ra.get(y)?.length || 0, rb.get(y)?.length || 0), 0), total: a0.entries.length }; });
  expect(r.aDiffers, "naming a book changes case A").toBe(true);
  expect(r.bSame && r.bRaw, "case B is bit-identical, rounded and raw").toBe(true);
  expect(r.changed.length, `one row of ${r.rows} repacked: ${r.changed}`).toBe(1);
  expect(r.changedN, `placements in that row (18 of ${r.total} today)`).toBeLessThanOrEqual(25);
  expect(errs).toEqual([]);
});

test("check 7: a room seen as the gentleman's stays his after the story makes the widow the owner; a new room takes the widow", async ({ browser }) => {
  test.setTimeout(LOAD + 120_000);
  const { page, errs } = await worldPage(browser);
  const r = await page.evaluate(() => { const { THREE, K, M, look } = window.__chk, { layoutOf, build, blend, OWNERS, makeWorld, GENERATOR, kinds } = M, world = makeWorld(), story = { owner: "gentleman" };
    const shelves = (who) => { const O = OWNERS[who], { kind, ...over } = O.traits.shelving; return build(THREE, K, look, kind, "check/sealed/shelves", over, blend([O])).node; };
    const room = (id) => layoutOf(THREE, shelves(world.seal(id, { owner: story.owner, kinds: kinds().length, generator: GENERATOR }).owner)).layout;
    const first = room("room-1"); story.owner = "widow"; const again = room("room-1"), fresh = room("room-2"), gent = layoutOf(THREE, shelves("gentleman")).layout, widow = layoutOf(THREE, shelves("widow")).layout;
    return { gentDiffers: gent !== widow, firstIsGent: first === gent, again: again === first, freshIsWidow: fresh === widow, bytes: world.size() }; });
  expect(r.gentDiffers, "the two owners build different shelves").toBe(true);
  expect(r.firstIsGent, "room 1 is the gentleman's").toBe(true);
  expect(r.again, "back in room 1 after the switch: its layout hash is unchanged").toBe(true);
  expect(r.freshIsWidow, "a room first seen after the switch takes the widow").toBe(true);
  expect(r.bytes, "the world document stays small").toBeLessThan(2_000);
  expect(errs).toEqual([]);
});

// ---- check 8: one layout in every engine. The bench (lab/bench, ?reference) builds seven cases and hashes each one's layout
// (every thing's id, kind and position to 0.1 mm) and the raw floats. Chromium and Firefox must agree on both. WebKit
// (libwoff1 missing) and the phone are by hand: open lab/bench/ on the device and read its verdict.
const benchOf = async (page) => { await page.goto(`${BASE}/lab/bench/index.html?reference`, { timeout: LOAD }); await page.waitForFunction(() => window.__bench, null, { timeout: LOAD });
  return page.evaluate(() => Object.fromEntries(window.__bench.results.map((c) => [c.name, { layout: c.layout, raw: c.raw, entries: c.entries }]))); };
test("check 8: Chromium and Firefox give the same layout hash and raw hash for every bench case", async ({ browser }) => {
  test.setTimeout(2 * LOAD);
  await done("objects");     // observed: with the object page still open beside it, the bench never finished (5 min); alone or after this it takes ~25 s
  let ff = null; try { ff = await firefox.launch(); } catch (e) { test.skip(true, `Firefox is not installed for playwright (${String(e.message).split("\n")[0]})`); }
  const cp = await browser.newPage(), errs = []; cp.on("pageerror", (e) => errs.push(e.message));
  const c = await benchOf(cp); await cp.close();
  expect(Object.keys(c).length, "bench cases").toBeGreaterThanOrEqual(7);
  let f; try { const fp = await ff.newPage(); fp.on("pageerror", (e) => errs.push(e.message)); f = await benchOf(fp); } finally { await ff.close(); }
  expect(f, "Firefox's layout and raw hashes, case by case, equal Chromium's").toEqual(c);
  expect(errs).toEqual([]);
});

// ---- check 10: every room reachable by the world's own actions (src/make/reach.js, on the manor's plan; nothing rendered)
test("check 10: every room reachable; a locked door waits for its key; a key behind its own door is a softlock; a body too tall enters nothing", () => {
  const r = JSON.parse(node(`
const S = (p) => import(${JSON.stringify(ROOT_URL + "src/make/")} + p);
const { reachability } = await S("reach.js"), { planHybridE } = await S("plans/hybrid-e.js"), { GENTRY_SEAT_1660 } = await S("programs/england-1660.js"), { ROOM_TYPES_1660 } = await S("rooms/england-1660.js");
const plan = planHybridE(GENTRY_SEAT_1660, { hearths: Object.fromEntries(Object.entries(ROOM_TYPES_1660).map(([k, v]) => [k, v.hearth])) });
const muni = plan.openings.filter((o) => o.joins.includes("muniment_room")), lock = (key) => Object.fromEntries(muni.map((o) => [o.id, { locked: true, key }]));
const sum = (r) => ({ ok: r.ok, reached: r.reached.length, unreachable: r.unreachable.map((u) => u.room), why: r.unreachable.map((u) => u.why), softlocks: r.softlocks, held: r.held });
console.log(JSON.stringify({ rooms: plan.rooms.length, doors: muni.length, A: sum(reachability(plan, {})), B: sum(reachability(plan, { doors: lock("key/iron"), keys: [{ name: "key/iron", room: "muniment_room" }] })),
  C: sum(reachability(plan, { doors: lock("key/iron"), keys: [{ name: "key/iron", room: "study" }] })), D: sum(reachability(plan, { player: { height: 2.6, width: 0.45 } })) }));`));
  expect(r.rooms).toBeGreaterThanOrEqual(34); expect(r.doors, "the muniment room's doors that lock").toBeGreaterThan(0);
  expect(r.A, "all doors free: every room reached").toMatchObject({ ok: true, reached: r.rooms, unreachable: [] });
  expect(r.B.unreachable, "the muniment room locked with its key inside: that room is unreachable").toEqual(["muniment_room"]);
  expect(r.B.why[0], "and says why").toMatch(/locked and its key/);
  expect(r.B.softlocks.map((s) => [s.key, s.lies_in]), "and the softlock is named").toEqual([["key/iron", "muniment_room"]]);
  expect(r.C, "the key in the study: every room reached, the key held").toMatchObject({ ok: true, reached: r.rooms, held: ["key/iron"] });
  expect(r.D.reached, "a 2.6 m player: nothing is enterable but the entrance").toBe(1);
  expect(r.D.unreachable.length).toBe(r.rooms - 1);
});

// ---- check 11: sound to walk into (src/make/sound.js): the plan alone by the tool, the furnished house by the page's __sound()
test("check 11: the plan is sound (tools/check-place.mjs) and catches its planted stair and wall faults (tools/plant-plan-faults.mjs)", () => {
  const p = tool(["tools/check-place.mjs"], 60_000);
  expect(p.code, p.out).toBe(0);
  expect(p.out).toMatch(/^sound /m);
  const q = tool(["tools/plant-plan-faults.mjs"], 120_000);
  expect(q.out, "planted plan faults").toMatch(/10\/10 caught/);
  // sound.js is what catches a stair that turns with no landing and a window laid over a door
  expect(q.out).toMatch(/caught\s+a stair turning with no landing[^\n]*sound\.js \+[1-9]/);
  expect(q.out).toMatch(/caught\s+a window and a doorway in one opening[^\n]*sound\.js \+[1-9]/);
});
// ---- check 11, rule 5: a way through (src/make/passage.js; tools/escape-demo.mjs prints the three cases)
test("check 11, rule 5: a way through: a heap against the door is cleared by its prybar, a prybar left outside is a softlock, a hoarder's study keeps its way at ~1 ms a test", () => {
  const t = tool(["tools/escape-demo.mjs"], 60_000);
  expect(t.code, t.out).toBe(0);
  const A = /A\. [^\n]*\n\s+the room: blocked[^\n]*\n\s+the house: escapable, all (\d+) rooms reached/.exec(t.out);
  expect(A, "A: locked in by the heap, the prybar inside: escapable").not.toBeNull(); expect(+A[1], "rooms reached").toBeGreaterThanOrEqual(34);
  expect(t.out, "B: the prybar left in the great hall: NOT escapable, the softlock named").toMatch(/B\. [^\n]*\n\s+the house: NOT escapable[^\n]*softlock: \[\{"key":"prybar","lies_in":"great_hall"/);
  const C = /(\d+) piles kept, (\d+) refused for closing the way; the piles cover (\d+)% of the floor; ([\d.]+) ms a test/.exec(t.out);
  expect(C, "C: the hoarder's study").not.toBeNull();
  expect(+C[1], "piles kept (60 today)").toBeGreaterThanOrEqual(60); expect(+C[2], "piles refused for closing the way: the test is not vacuous").toBeGreaterThan(0);
  expect(+C[3], "the piles cover at least half the floor").toBeGreaterThanOrEqual(45); expect(+C[4], "ms a test (about 1 today)").toBeLessThan(5);
});

// ---- check 12: it opens onto an inside
test("check 12a: nothing that opens (a lid, a hinged door) opens onto solid", async ({ browser }) => {
  test.setTimeout(LOAD + 120_000);
  const { page, errs } = await objects(browser);
  const r = await page.evaluate(() => { const t = performance.now(), f = window.__opensOnto(); return { f, ms: Math.round(performance.now() - t) }; });
  expect(r.f.map((q) => `${q.kind} ${q.aff || ""}: ${q.what || q.error}`), "kinds with a door or lid that shows solid within 3 cm").toEqual([]);
  expect(errs).toEqual([]);
});
test("check 12b: the panel tool runs and writes a panel for every furniture kind, with no errors (the panels are for the eye)", () => {
  const out = mkdtempSync(join(tmpdir(), "panels-"));
  try {
    const names = JSON.parse(node(`console.log(JSON.stringify((await import(${JSON.stringify(ROOT_URL + "src/make/kinds/furniture-1660.js")})).default.map((k) => k.kind)))`));
    const t = tool(["tools/kind-panels.mjs", out, "--all"], 600_000);
    expect(t.code, t.out).toBe(0);
    expect(t.out, "its summary line").toMatch(new RegExp(`${names.length} kinds: `));
    expect(t.out, "page errors").not.toMatch(/^errors/m);
    const files = readdirSync(out).filter((f) => f.startsWith("panel-") && f.endsWith(".png"));
    expect(files.sort(), "one panel per kind").toEqual(names.map((k) => `panel-${k.replace("/", "_")}.png`).sort());
    for (const f of files) expect(statSync(join(out, f)).size, `${f} is a picture`).toBeGreaterThan(5_000);
  } finally { rmSync(out, { recursive: true, force: true }); }
});

// ---- checks 13, 14, 15: the audit and the mesh rules over every kind, at rest and moved (src/make/audit.js, mesh-rules.js,
// one __partsCheck call shared with check 21)
test("check 13: every part of every kind shows from some side (or declares seen: false)", async ({ browser }) => {
  test.setTimeout(LOAD + 180_000);
  const { r, errs } = await parts(browser);
  expect(r.kinds, "kinds checked (55 today)").toBeGreaterThanOrEqual(55);
  expect(r.findings.filter((f) => /^13/.test(String(f.check))).map((f) => `${f.kind} ${f.part}: ${f.what}`), "parts that never show a tenth").toEqual([]);
  expect(errs).toEqual([]);
});
test("check 14: no part of any kind sits inside another", async ({ browser }) => {
  test.setTimeout(LOAD + 180_000);
  const { r, errs } = await parts(browser);
  expect(r.findings.filter((f) => String(f.check) === "14").map((f) => `${f.kind} ${f.part}: ${f.what}`), "parts inside other parts").toEqual([]);
  expect(errs).toEqual([]);
});
test("check 15: the mesh rules hold for every part of every kind, at rest and moved (closed, outward, inside, shimmer, whole, below, through)", async ({ browser }) => {
  test.setTimeout(LOAD + 180_000);
  const { r, errs } = await parts(browser);
  expect(r.findings.filter((f) => f.error).map((f) => `${f.kind}: ${f.error}`), "kinds that failed to build").toEqual([]);
  const rules = /^(closed|outward|inside|shimmer|whole|below|through)\b/;
  expect(r.findings.filter((f) => rules.test(String(f.check))).map((f) => `${f.kind} ${f.check} ${f.part}: ${f.what}`), "mesh rule findings").toEqual([]);
  expect(r.perKind, "ms a kind (about 1 s for all 55 on a GPU, a few seconds under swiftshader)").toBeLessThan(500);
  expect(errs).toEqual([]);
});

// ---- check 16: the checks themselves, tested by planting faults (tools/plant-faults.mjs, 126 plantings in 12 good kinds)
test("check 16: planted faults are caught at least as often as today (inside out, hole, doubled 100%; buried 90%; sunk 52%; lifted 29%)", () => {
  const t = tool(["tools/plant-faults.mjs"], 600_000);
  expect(t.code, t.out).toBe(0);
  expect(t.out, "page errors").not.toMatch(/^errors/m);
  const rows = Object.fromEntries([...t.out.matchAll(/^\| (inside out|a hole|sunk halfway|lifted 2 cm|buried whole|a doubled face) \| (\d+) \| (\d+) \((\d+)%\)/gm)].map((m) => [m[1], { planted: +m[2], caught: +m[3], pct: +m[4] }]));
  const floor = { "inside out": 100, "a hole": 100, "a doubled face": 100, "buried whole": 90, "sunk halfway": 52, "lifted 2 cm": 29 };
  for (const [fault, min] of Object.entries(floor)) { expect(rows[fault], `${fault} planted`).toBeTruthy(); expect(rows[fault].planted, `${fault}: plantings`).toBeGreaterThanOrEqual(21); expect(rows[fault].pct, `${fault}: caught %`).toBeGreaterThanOrEqual(min); }
  expect(Object.values(rows).reduce((n, q) => n + q.planted, 0), "plantings in all (126 today)").toBeGreaterThanOrEqual(126);
});


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

// ---- check 21: every part on a relation, over every kind (tools/check-kinds.mjs's page call)
test("check 21: every part of every kind hangs on a relation (0 relation findings, all kinds)", async ({ browser }) => {
  test.setTimeout(LOAD + 180_000);
  const { r, errs } = await parts(browser);
  expect(r.kinds, "kinds checked (55 today)").toBeGreaterThanOrEqual(55);
  expect(r.findings.filter((f) => f.check === "relation").map((f) => `${f.kind} ${f.part}: ${f.what}`), "parts placed by a typed position").toEqual([]);
  expect(r.findings.filter((f) => f.error).map((f) => `${f.kind}: ${f.error}`), "kinds that failed to build").toEqual([]);
  expect(errs).toEqual([]);
});

// ---- section 2: checks on the house (lab/manor, one load shared by 3, 9, 11, 19, 20 and 22; 23 loads its own)

// ---- check 9: it rests on something. Every built thing in a house stands on the floor (its base within 2 cm of its room's
// floor), hangs on a wall of its room (back within 2 cm of the wall, above the floor), is held (a kind that says "rests: held":
// shutters on their splays), sits in a slot of another thing, or stands on another thing's top. The test stages (?o=kinds,
// ?o=puzzle, ?o=arrival) put things on a board in mid-air: Kabe doesn't need them fixed, so they are not walked here.
const RESTS = () => { const M = window.__manor, T = window.__THREE, plan = window.__plan, out = { things: 0, how: {}, floating: [] }, TOL = 0.02;
  M.scene.updateMatrixWorld(true);
  const nodeOf = new Map(M.things.map((b) => [b.node, b])), boxes = new Map(M.things.map((b) => [b, new T.Box3().setFromObject(b.node)]));
  const roomOf = (b) => plan.rooms.find((q) => q.id === b.node.userData.room) || (b.address.startsWith("manor/") ? plan.rooms.find((q) => q.id === b.address.split("/")[1]) : null);
  const hostOf = (b) => { let o = b.node.parent; while (o) { if (nodeOf.has(o)) return nodeOf.get(o); o = o.parent; } return null; };
  for (const b of M.things) { out.things++;
    const k = b.kind, bb = boxes.get(b), room = roomOf(b), op = plan.openings.find((o) => o.id === b.node.userData.opening), floor = room?.floor ?? op?.floor, lvl = floor != null ? M.levelOf(floor) : null; let how = null;
    if (k.rests === "held") how = "held";
    else if (hostOf(b)) how = "in a slot of another thing";
    else if (lvl != null && Math.abs(bb.min.y - lvl) <= TOL) how = "on the floor";
    else if (room && ((k.traits || []).includes("wall") || k.rests === "wall")) { const R = room.rect, d = Math.min(Math.abs(bb.min.x - R.x0), Math.abs(bb.max.x - R.x1), Math.abs(-bb.max.z - R.y0), Math.abs(-bb.min.z - R.y1)); if (d <= TOL && bb.min.y > lvl) how = "hung on its wall"; }
    if (!how) for (const [o, ob] of boxes) if (o !== b && Math.abs(bb.min.y - ob.max.y) <= TOL && bb.min.x < ob.max.x && bb.max.x > ob.min.x && bb.min.z < ob.max.z && bb.max.z > ob.min.z) { how = "on another thing"; break; }
    if (how) out.how[how] = (out.how[how] || 0) + 1; else out.floating.push(`${b.address} ${k.kind} base ${bb.min.y.toFixed(3)} floor ${lvl}`); }
  // the control: lift the first thing standing on the floor by 10 cm and ask again
  const b0 = M.things.find((b) => { const bb = boxes.get(b), o = plan.rooms.find((q) => q.id === b.node.userData.room); return o && Math.abs(bb.min.y - M.levelOf(o.floor)) <= TOL && !hostOf(b) && b.kind.rests !== "held"; });
  b0.node.position.y += 0.1; b0.node.updateMatrixWorld(true); const lifted = new T.Box3().setFromObject(b0.node), lvl0 = M.levelOf(plan.rooms.find((q) => q.id === b0.node.userData.room).floor);
  out.control = { lifted: +(lifted.min.y - lvl0).toFixed(3), caught: Math.abs(lifted.min.y - lvl0) > TOL }; b0.node.position.y -= 0.1; b0.node.updateMatrixWorld(true);
  return out; };
test("check 9: every thing in the manor, the banqueting house and Alice's hall rests on something (nothing floats)", async ({ browser }) => {
  test.setTimeout(3 * LOAD);
  // the other two houses first: a manor page left open keeps drawing and starves a page loading beside it
  for (const [name, qs] of [["banq", "&plan=banqueting"], ["alice", "&plan=alice-hall"]]) {
    const e = await open(browser, name, `/lab/manor/index.html?webgl=1${qs}`, () => window.__ok), r = await e.page.evaluate(RESTS);
    expect(r.things, `things in ${name}`).toBeGreaterThan(5);
    expect(r.floating, `floating things in ${name}`).toEqual([]);
    expect(e.errs).toEqual([]);
    await done(name);
  }
  const m = await manor(browser), mr = await m.page.evaluate(RESTS);
  expect(mr.things, "things in the manor").toBeGreaterThan(150);
  expect(mr.floating, "floating things in the manor").toEqual([]);
  expect(mr.how["on the floor"], "most things stand on the floor").toBeGreaterThan(100);
  expect(mr.how["hung on its wall"], "wall-hung things (portraits, pikes, the peg rail) stand at their wall").toBeGreaterThan(10);
  expect(mr.control.caught, "a thing lifted 10 cm would be caught").toBe(true);
  expect(m.errs).toEqual([]);
});

// ---- check 3: open, it strikes nothing (every hinged or sliding mover of every thing in the house, moved, against the room's
// walls and what else stands there). The exact test is src/make/audit.js apart(): points a hair inside each surface, tested
// against the other's solid by winding number, both ways. Walls: the room's clear floor space (plan.rooms rect), 1 mm.
test("check 3: with everything that opens open, nothing strikes a wall or another thing (the house)", async ({ browser }) => {
  test.setTimeout(LOAD + 120_000);
  const { page, errs } = await manor(browser);
  const r = await page.evaluate(async () => { const { apart } = await import("/src/make/audit.js"); const M = window.__manor, T = window.__THREE, plan = window.__plan, W = window.__works, v = new T.Vector3();
    const out = { things: 0, hits: [], nears: 0, minWall: 9, control: {} };
    const trisOf = (root, skip = () => false) => { const arr = []; root.traverse((o) => { if (!o.isMesh || o.isInstancedMesh || o.material?.transparent || skip(o)) return; const g = o.geometry, P = g.attributes.position, I = g.index, n = I ? I.count : P.count;
      for (let j = 0; j < n; j++) { v.fromBufferAttribute(P, I ? I.getX(j) : j).applyMatrix4(o.matrixWorld); arr.push(v.x, v.y, v.z); } }); return Float32Array.from(arr); };
    const boxOf = (tr) => { const b = new T.Box3(); for (let i = 0; i < tr.length; i += 3) b.expandByPoint(v.set(tr[i], tr[i + 1], tr[i + 2])); return b; };
    const wallClear = (R, mb) => Math.min(mb.min.x - R.x0, R.x1 - mb.max.x, -mb.max.z - R.y0, R.y1 + mb.min.z);
    const strikes = (R, mt, near, restTris) => { const hits = []; if (R) { const c = wallClear(R, boxOf(mt)); if (c < -0.001) hits.push({ wall: +c.toFixed(3) }); }
      if (near.length) { const parts = [{ key: "mover", tris: mt, solid: mt }, ...near.map((o) => ({ key: o.address.replace("manor/", ""), tris: restTris.get(o), solid: restTris.get(o) }))];
        for (const x of apart(parts, { samples: 96, min: 0.02 })) if (x.a === "mover" || x.b === "mover") hits.push({ vs: x.a === "mover" ? x.b : x.a, share: x.share }); } return hits; };
    const MOVED = (a) => a.states ? a.states[1] : "open", REST = (a) => a.states ? a.states[0] : "closed";
    M.scene.updateMatrixWorld(true);
    const rest = new Map(M.things.map((b) => [b, trisOf(b.node)])), restBox = new Map([...rest].map(([b, tr]) => [b, boxOf(tr)]));
    const moverTris = (b, affs) => { const movers = new Set(affs.map(([, a]) => b.movers.get(a.mover))), arr = [];
      for (const g of movers) arr.push(...trisOf(g, (o) => { let q = o; while (q && q !== g) { if (q.userData?.make?.thing && q.userData.make.thing !== b.id) return true; q = q.parent; } return false; })); return Float32Array.from(arr); };
    const ctl = { shiftedIntoWall: null, shiftedIntoNeighbour: null };
    for (const b of M.things) {
      const affs = Object.entries(b.kind.affordances || {}).filter(([, a]) => a.mover && b.movers.get(a.mover) && ["slide", "hinge"].includes(a.motion)); if (!affs.length) continue;
      out.things++;
      const was = affs.map(([n]) => W.stateOf(b, n));                     // doors may stand open already: leave everything as found
      for (const [n, a] of affs) W.set(b, n, null, MOVED(a)); W.finish(); b.node.updateMatrixWorld(true);
      const mt = moverTris(b, affs), mb = boxOf(mt), room = plan.rooms.find((q) => q.id === b.node.userData.room);
      const near = M.things.filter((o) => o !== b && restBox.get(o).intersectsBox(mb.clone().expandByScalar(0.01))); out.nears += near.length;
      if (room) out.minWall = Math.min(out.minWall, wallClear(room.rect, mb));
      // a door's leaf stands in its own wall's thickness: walls are tested for what stands in a room, doors against the things only
      for (const h of strikes(room?.rect, mt, near, rest)) out.hits.push({ thing: b.address.replace("manor/", ""), ...h });
      // the control: the same detector, with the mover planted where it must strike (into the wall; onto a neighbour)
      if (room && !ctl.shiftedIntoWall) { const R = room.rect, d = R.x1 - mb.min.x + 0.05, sh = mt.slice(); for (let i = 0; i < sh.length; i += 3) sh[i] += d; ctl.shiftedIntoWall = strikes(R, sh, [], rest); }
      if (!ctl.shiftedIntoNeighbour) { const copy = { address: "manor/planted-copy" }, sh = mt.slice(); for (let i = 0; i < sh.length; i++) sh[i] += 0.003;
        ctl.shiftedIntoNeighbour = strikes(null, mt, [copy], new Map([[copy, sh]])); }
      affs.forEach(([n, a], i) => W.set(b, n, null, was[i])); W.finish();
    }
    out.control = ctl; return out; });
  expect(r.things, "things with a hinged or sliding part tested").toBeGreaterThan(60);
  expect(r.hits, "movers, open, that strike a wall or another thing").toEqual([]);
  expect(r.minWall, "no open mover past its room's clear floor space (1 mm)").toBeGreaterThanOrEqual(-0.001);
  // the detector is not vacuous
  expect(r.control.shiftedIntoWall?.some((h) => h.wall < 0), "a mover planted through the wall is caught").toBe(true);
  expect(r.control.shiftedIntoNeighbour?.some((h) => h.vs), "a mover planted in another thing's solid (a copy of itself 3 mm off) is caught").toBe(true);
  expect(errs).toEqual([]);
});

test("check 11: the furnished manor is sound to walk into (walls, doorways, walking, stairs, with furniture)", async ({ browser }) => {
  test.setTimeout(LOAD + 120_000);
  const { page, errs } = await manor(browser);
  const r = await page.evaluate(() => { const s = window.__sound(); return { ok: s.ok, findings: s.findings.map((f) => `${f.rule} ${f.where}: ${f.what}`) }; });
  expect(r.findings).toEqual([]);
  expect(r.ok).toBe(true);
  expect(errs).toEqual([]);
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

// check 24 (vetted by Kabe, 2026-10-07: "Approve on any decision that fixes a visual anomaly"): crossing a doorway
// never makes the light jump. Every door open, walk through the kitchen passage's door into the kitchen in steps; the
// lights the pool holds before the threshold are the lights it holds after, and each change after fades (src/make/lightpool.js)
test("check 24: crossing a threshold keeps the light pool's windows, every change fading", async ({ browser }) => {
  const { page, errs } = await manor(browser, "&nofurn=1");
  const r = await page.evaluate(async () => {
    const P = window.__plan, W = window.__works, A = "kitchen_passage", B = "kitchen";
    const o = P.openings.find(o => o.joins.includes(A) && o.joins.includes(B));
    for (const b of W.things.values()) if (b.node.userData.opening && W.stateOf(b, "leaf") !== "open") W.act({ b, aff: "leaf" }); W.finish?.();
    const R = o.rect, ew = o.axis === "EW", cx = (R.x0 + R.x1) / 2, cy = (R.y0 + R.y1) / 2, ra = P.rooms.find(q => q.id === A).rect;
    const s = ew ? Math.sign((ra.x0 + ra.x1) / 2 - cx) : Math.sign((ra.y0 + ra.y1) / 2 - cy), T = ew ? R.x1 - R.x0 : R.y1 - R.y0;
    const at = (d) => [ew ? cx + s * d : cx, ew ? cy : cy + s * d], wait = (ms) => new Promise(r => setTimeout(r, ms));
    const held = () => window.__lights().windows.filter(Boolean).map(w => w.key);
    let [x, y] = at(T / 2 + 0.6); window.__place(x, y, 0, -8, "ground"); await wait(1500);
    const before = held(); let jumps = 0;
    for (let k = 1; k <= 12; k++) { [x, y] = at(T / 2 + 0.6 - k * (T + 1.2) / 12); window.__place(x, y, 0, -8, "ground", true); await wait(150);
      // a light that went from nothing to full in one step would be a jump
      for (const w of window.__lights().windows.filter(Boolean)) if (w.level === 1 && !before.includes(w.key) && k < 3) jumps++; }
    return { before, after: held(), jumps };
  });
  expect(errs).toEqual([]);
  expect(r.jumps).toBe(0);
  expect(r.after.filter(k => r.before.includes(k)).length).toBeGreaterThanOrEqual(Math.min(r.before.length, 6));
});
