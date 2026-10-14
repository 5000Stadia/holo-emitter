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
  unsourced: R.readFacts({ ...doc, facts: doc.facts.map((f, i) => i ? f : { ...f, source: undefined }) }).findings.map(f => f.what) }));`], { encoding: "utf8" }));
  expect(r.good.ok).toBe(true); expect(r.good.links).toEqual([{ from: "obj:switch", to: "obj:light", type: "switch", mode: "latching" }]);
  expect(r.noExits.join(" "), "a room must say it has no exits").toMatch(/says nothing of its exits/);
  expect(r.noType.join(" ")).toMatch(/says no link type/);
  expect(r.ghost.join(" ")).toMatch(/points at obj:nothing/);
  expect(r.unsourced.join(" "), "every fact cites its sentence").toMatch(/no source sentence/);
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
  await page.goto(`${BASE}/lab/manor/index.html?webgl=1&fresh&plan=recipe&recipe=switched-light`, { timeout: LOAD });
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
