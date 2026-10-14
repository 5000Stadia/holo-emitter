// The main demo, its first recipe (design/one-world/recipes/switched-light.md; Kabe, 2026-10-13: "There should be a main demo
// with all layers … new features across projects can be tested there"): the golden lane, pattern-buffer's facts loaded
// straight in (lab/recipes/switched-light.facts.json), the room laid out from them by rule (src/make/recipe.js) and played
// (src/make/recipe-play.js). "the world is empty, except for a room with no exits. The room is completely dark. There is a
// light switch in the room, that if flipped turns on a light, the brightly illuminate the room and shows that there is a
// friendly dog": a room with no way out, dark; the switch works the light across the room; the person who thinks they're
// a dog is there, on all fours, seen once it is lit. The place's proof passes at load.
import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

const BASE = process.env.BASE || "http://localhost:8794";
const LOAD = 300_000;
test.use({ launchOptions: { args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } });

test("the facts are read before anything is built: what can't be built is refused with its reason", () => {
  const ROOT = new URL("../../", import.meta.url).href;
  const r = JSON.parse(execFileSync(process.execPath, ["--input-type=module", "-e", `
const R = await import(${JSON.stringify(ROOT + "src/make/recipe.js")}), fs = await import("node:fs");
const doc = JSON.parse(fs.readFileSync(new URL("lab/recipes/switched-light.facts.json", ${JSON.stringify(ROOT)})));
const drop = (attr) => ({ ...doc, facts: doc.facts.filter(f => f.attribute !== attr) });
console.log(JSON.stringify({ good: R.readFacts(doc), noExits: R.readFacts(drop("exits")).findings.map(f => f.what), noType: R.readFacts(drop("link_type")).findings.map(f => f.what),
  ghost: R.readFacts({ ...doc, facts: [...doc.facts, { entity: "obj:switch", attribute: "controls", value: "obj:nothing", value_type: "entity", source: { sentence: 3 } }] }).findings.map(f => f.what),
  unsourced: R.readFacts({ ...doc, facts: doc.facts.map((f, i) => i ? f : { ...f, source: undefined }) }).findings.map(f => f.what),
  authored: R.readFacts({ ...doc, facts: doc.facts.map((f, i) => i ? f : { ...f, source: { authored: "Kabe 2026-10-13", note: "the test's" } }) }).findings.map(f => f.what),
  both: R.readFacts({ ...doc, facts: doc.facts.map((f, i) => i ? f : { ...f, source: { chapter: 1, sentence: 1, authored: "manifest" } }) }).findings.map(f => f.what) }));`], { encoding: "utf8" }));
  expect(r.good.ok).toBe(true); expect(r.good.links).toEqual([{ from: "obj:switch", to: "obj:light", type: "switch", mode: "latching" }]);
  expect(r.noExits.join(" "), "a room must say it has no exits").toMatch(/says nothing of its exits/);
  expect(r.noType.join(" ")).toMatch(/says no link type/);
  expect(r.ghost.join(" ")).toMatch(/points at obj:nothing/);
  expect(r.unsourced.join(" "), "every fact cites its sentence or its author").toMatch(/cites neither its sentence nor its author/);
  expect(r.authored, "an authored fact, its author named: read").toEqual([]);
  expect(r.both.join(" "), "one or the other").toMatch(/cites both a sentence and an author/);
});

test("code-lock's proof: the way out is reached only through the code the person who thinks they're a dog tells", () => {
  const ROOT = new URL("../../", import.meta.url).href;
  const r = JSON.parse(execFileSync(process.execPath, ["--input-type=module", "-e", `
const R = await import(${JSON.stringify(ROOT + "src/make/recipe.js")}), fs = await import("node:fs");
const kinds = [...(await import(${JSON.stringify(ROOT + "src/make/kinds/electric-1900.js")})).default, ...(await import(${JSON.stringify(ROOT + "src/make/kinds/modern.js")})).default, ...(await import(${JSON.stringify(ROOT + "src/make/kinds/house-1660.js")})).default];
const kindOf = (n) => kinds.find(k => k.kind === n) || null, read = (n) => JSON.parse(fs.readFileSync(new URL("lab/recipes/" + n + ".facts.json", ${JSON.stringify(ROOT)})));
const told = read("code-lock"), untold = { ...told, facts: told.facts.filter(f => !String(f.frame).startsWith("knows:")) }, plan = R.planRecipe(told, { kinds });
console.log(JSON.stringify({ told: R.proveRecipe(plan, kindOf), untold: R.proveRecipe(R.planRecipe(untold, { kinds }), kindOf), door: plan.openings[0]?.door, keypad: plan.recipe.things.find(t => t.id === "obj:keypad")?.over }));`], { encoding: "utf8" }));
  expect(r.told, "told: out").toMatchObject({ ok: true, reached: ["room", "outside"], known: ["obj:keypad.code"] });
  expect(r.untold, "no one tells it: no way out, and the proof says so").toMatchObject({ ok: false, unreachable: ["outside"], known: [] });
  expect(r.door, "the door a keypad bolts is a bolted one").toEqual({ kind: "door/panelled-bolted" });
  expect(r.keypad, "the keypad's code is the facts'").toEqual({ code: "4071", knows: "obj:keypad.code" });
});

test("the dark room: no way out, dark; the switch lights the light across the room; the person who thinks they're a dog is there", async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium", "the demo is the same on every engine");
  test.setTimeout(2 * LOAD);
  const page = await browser.newPage({ viewport: { width: 900, height: 600 } }), errs = []; page.on("pageerror", (e) => errs.push(e.message));
  // (?perf: the perf card and its per-layer cost line, Photonic's ask: people ms, place ms, loading)
  await page.goto(`${BASE}/lab/manor/index.html?webgl=1&fresh&perf&plan=recipe&recipe=switched-light`, { timeout: LOAD });
  await page.waitForFunction(() => window.__ok, null, { timeout: LOAD });
  const start = await page.evaluate(() => { const r = window.__recipe(), W = window.__works, sw = window.__recipeThing("obj:switch"), lt = window.__recipeThing("obj:light");
    return { proof: r.proof, plan: window.__plan.rooms.length, openings: window.__plan.openings.length, windows: window.__plan.windows.length, person: r.person,
      sw: W.stateOf(sw, "switch"), light: W.stateOf(lt, "light"), lit: window.__lights().fires.filter(f => f && f.room === "room").length, chosen: r.chosen.map(c => c.what) }; });
  expect(start.proof.ok, "the place's proof").toBe(true);
  expect([start.plan, start.openings, start.windows], "one room, no door, no window").toEqual([1, 0, 0]);
  expect([start.sw, start.light, start.lit], "dark: the switch off, the light out, nothing lighting the room").toEqual(["off", "out", 0]);
  expect(start.person, "the person, on all fours").toEqual({ room: "room", person: "person:dog", posture: "all_fours" });
  expect(start.chosen, "every choice the facts leave open is said").toEqual(expect.arrayContaining(["the room's width, depth and height", "where the light switch is", "where you arrive"]));
  const after = await page.evaluate(async () => { const W = window.__works, sw = window.__recipeThing("obj:switch"), lt = window.__recipeThing("obj:light");
    window.__actOn(sw, "switch"); for (let t = 0; t < 200 && !window.__lights().fires.some(f => f && f.room === "room" && f.level > 0.95); t++) await new Promise(r => setTimeout(r, 50));
    return { sw: W.stateOf(sw, "switch"), light: W.stateOf(lt, "light"), lit: window.__lights().fires.filter(f => f && f.room === "room" && f.level > 0.95).length, byHand: W.act({ b: lt, aff: "light", i: null }).refused }; });
  expect([after.sw, after.light], "flipped: the light across the room comes on").toEqual(["on", "lit"]);
  expect(after.lit, "and it lights the room").toBe(1);
  expect(after.byHand, "the light is worked from its switch alone").toMatch(/worked from its switch/);
  // the cost line: each layer's ms a tick, and loading by stage, on the card a phone's screenshot carries
  await page.waitForFunction(() => { const L = window.__layers(); return L && ["you", "place", "people", "land", "lights", "render"].every(k => L[k]?.n > 0); }, null, { timeout: 60_000 });
  const cost = await page.evaluate(() => ({ layers: window.__layers(), card: document.getElementById("perf-card")?.textContent || "" }));
  for (const [k, v] of Object.entries(cost.layers)) expect(v.p95, `${k}: a tick's share, in ms`).toBeGreaterThanOrEqual(v.p50);
  expect(cost.card, "the card says each layer").toMatch(/layers ms p50\/p95[^\n]*people [\d.]+\/[\d.]+[^\n]*render/);
  expect(cost.card, "and loading by stage, to walkable").toMatch(/loading s:[^\n]*built [\d.]+[^\n]*walkable[= ][^\n]*/);
  expect(errs).toEqual([]);
});

test("code-lock in play: talked to, the person tells the code; the keypad keys it in; the bolt draws back and the door opens on the day outside", async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium", "the demo is the same on every engine");
  test.setTimeout(2 * LOAD);
  const page = await browser.newPage({ viewport: { width: 900, height: 600 } }), errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${BASE}/lab/manor/index.html?webgl=1&fresh&plan=recipe&recipe=code-lock`, { timeout: LOAD });
  await page.waitForFunction(() => window.__ok, null, { timeout: LOAD });
  const before = await page.evaluate(() => ({ proof: window.__recipe().proof.ok, known: window.__known(), outside: !!window.__site, door: window.__works.act({ b: window.__recipeThing("obj:door"), aff: "leaf", i: null }).refused }));
  expect(before.proof).toBe(true); expect(before.known, "nothing known yet").toEqual([]);
  expect(before.outside, "the world outside is there (the room's dark is its own)").toBe(true);
  expect(before.door, "bolted").toMatch(/bolted/);
  const told = await page.evaluate(() => { window.__recipeTalk("person:dog"); return { known: window.__known(), said: window.__said.at(-1) }; });
  expect(told.known).toEqual(["obj:keypad.code"]); expect(told.said, "the digits said").toMatch(/4, 0, 7, 1/);
  await page.evaluate(() => window.__actOn(window.__recipeThing("obj:keypad"), "entry")); await page.waitForSelector("#codepad", { timeout: 20_000 });
  await page.click('#codepad button[data-k="known"]');
  await page.waitForFunction(() => !document.getElementById("codepad"), null, { timeout: 10_000 });
  const after = await page.evaluate(() => { const d = window.__recipeThing("obj:door"); return { lock: window.__works.stateOf(d, "lock"), open: window.__works.act({ b: d, aff: "leaf", i: null }).did, leaf: window.__works.stateOf(d, "leaf") }; });
  expect(after, "the bolt drawn, the door opens").toEqual({ lock: "unlocked", open: true, leaf: "open" });
  expect(errs).toEqual([]);
});

// take-and-drop (design/one-world/recipes/take-and-drop.md; Kabe, 2026-10-13: "placement … and status changes in pattern
// buffer … When an item is taken"): two rooms from the facts, joined by an open door; the page in the book on the study's
// table, kept shut in until the book is opened; taken, it is in your hands; put down on the hall's table, it is on that
// table, each as pattern-buffer's facts (the outbox, R75)
test("take-and-drop in play: the page in the book is shut in until the book is opened; taken, it is held; put on the hall's table, it is in it", async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium", "the demo is the same on every engine");
  test.setTimeout(2 * LOAD);
  const page = await browser.newPage({ viewport: { width: 900, height: 600 } }), errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${BASE}/lab/manor/index.html?webgl=1&fresh&plan=recipe&recipe=take-and-drop`, { timeout: LOAD });
  await page.waitForFunction(() => window.__ok, null, { timeout: LOAD });
  const before = await page.evaluate(() => { const W = window.__works, R = window.__recipe(), pg = window.__recipeThing("obj:page"), book = window.__recipeThing("obj:book");
    const n = window.__outbox().events.length; window.__actOn(pg, null);
    return { proof: R.proof.ok, reached: R.proof.reached, rooms: window.__plan.rooms.map(q => q.id), things: R.things.map(t => t.id).sort(),
      inBook: pg.host?.b === book, bookOn: book.host?.b === window.__recipeThing("obj:study_table"), shut: W.shutIn(pg), tookShut: W.held().includes(pg), wrote: window.__outbox().events.length - n,
      placements: window.__outbox({ placements: true }).placements.filter(f => ["obj:page", "obj:book"].includes(f.entity) && f.attribute === "in").map(f => [f.entity, f.value]).sort() }; });
  expect(before.proof, "the place's proof").toBe(true);
  expect(before.rooms, "two rooms, as the facts say").toEqual(["study", "hall"]); expect(before.reached).toEqual(expect.arrayContaining(["study", "hall"]));
  expect(before.things, "the facts' things, and each room's candle (chosen: the facts don't call them dark)").toEqual(["obj:book", "obj:hall_candle", "obj:hall_table", "obj:page", "obj:study_candle", "obj:study_table"]);
  expect([before.inBook, before.bookOn], "the page in the book, the book on the table").toEqual([true, true]);
  expect([before.shut, before.tookShut, before.wrote], "shut in: it can't be taken, and nothing is written").toEqual([true, false, 0]);
  expect(before.placements, "where they are, as made").toEqual([["obj:book", "obj:study_table"], ["obj:page", "obj:book"]]);
  await page.evaluate(() => window.__actOn(window.__recipeThing("obj:book"), "cover"));
  await page.waitForFunction(() => !window.__works.shutIn(window.__recipeThing("obj:page")), null, { timeout: 30_000 });
  const after = await page.evaluate(() => { const W = window.__works, pg = window.__recipeThing("obj:page"), last = () => { const e = window.__outbox().events.at(-1); return e && [e.entity, e.attribute, e.value]; };
    window.__actOn(pg, null); const took = [W.held().includes(pg), last()];
    const h = window.__plan.rooms.find(q => q.id === "hall").rect; window.__place((h.x0 + h.x1) / 2, h.y0 + 0.8, 0);
    window.__actOn(window.__recipeThing("obj:hall_table"), null); return { took, put: [W.held().includes(pg), last()], room: pg.node.userData.room }; });
  expect(after.took, "taken: in your hands").toEqual([true, ["obj:page", "held_by", "person:player"]]);
  expect(after.put, "put on the hall's table: in it").toEqual([false, ["obj:page", "in", "obj:hall_table"]]);
  // "Reload, and it is in the hall": the world keeps where it was put (on: the hall's table), and the page seats it there again
  await page.reload({ timeout: LOAD }); await page.waitForFunction(() => window.__ok, null, { timeout: LOAD });
  const again = await page.evaluate(() => { const T = window.__THREE, pg = window.__recipeThing("obj:page"), ht = window.__recipeThing("obj:hall_table"), h = window.__plan.rooms.find(q => q.id === "hall").rect;
    const at = new T.Vector3(); pg.node.getWorldPosition(at);
    return { on: pg.host?.b === ht, held: window.__works.held().includes(pg), shown: pg.node.visible, inHall: at.x > h.x0 && at.x < h.x1 && -at.z > h.y0 && -at.z < h.y1, room: pg.node.userData.room }; });
  expect(again, "reloaded: on the hall's table, where it was put").toEqual({ on: true, held: false, shown: true, inHall: true, room: "hall" });
  expect(errs).toEqual([]);
});
