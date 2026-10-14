// What the world is and what changes in it, written as pattern-buffer's facts (R75; Kabe, 2026-10-13: "the placement of our
// items and locations in pattern buffer on placement and status changes … When an item is taken for example";
// design/one-world/recipes/take-and-drop.md; src/make/facts-out.js). Placements for the author lane (fixtures first), play
// events for record, kept in the page's outbox until pattern-buffer's queue takes them.
import { test, expect } from "@playwright/test";

const BASE = process.env.BASE || "http://localhost:8794";
const LOAD = 300_000;
test.use({ launchOptions: { args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } });

test("code-lock: its placements (the door, switch, keypad and light fixtures in their room), then each change as it happens, through to the door open", async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium", "the facts are the same on every engine");
  test.setTimeout(2 * LOAD);
  const page = await browser.newPage({ viewport: { width: 800, height: 500 } }), errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${BASE}/lab/manor/index.html?webgl=1&fresh&plan=recipe&recipe=code-lock`, { timeout: LOAD });
  await page.waitForFunction(() => window.__ok, null, { timeout: LOAD });
  const r = await page.evaluate(async () => { const T = (id) => window.__recipeThing(id);
    window.__actOn(T("obj:switch"), "switch"); window.__recipeTalk("person:dog");
    window.__works.act({ b: T("obj:keypad"), aff: "entry", i: null, entered: "4071" }); for (let i = 0; i < 30; i++) window.__works.tick(0.05);
    window.__actOn(T("obj:door"), "leaf");
    const o = window.__outbox({ placements: true }), pick = (f) => [f.entity, f.attribute, f.value];
    return { placements: o.placements.map(pick), events: o.events.map(pick), lanes: [...new Set(o.events.map(f => f.source.lane))], frames: [...new Set([...o.placements, ...o.events].map(f => f.frame))] }; });
  expect(errs).toEqual([]);
  for (const id of ["obj:obj:door", "obj:obj:switch", "obj:obj:keypad", "obj:obj:light"]) expect(r.placements, `${id} is built in`).toContainEqual([id, "fixture", true]);
  expect(r.placements).toContainEqual(["obj:obj:switch", "in", "place:room"]);
  expect(r.placements, "the light starts out, as made, whatever has happened since").toContainEqual(["obj:obj:light", "light", "out"]);
  expect(r.placements, "the door is in the room whose doorway hangs it").toContainEqual(["obj:obj:door", "in", "place:room"]);
  expect(r.events, "flipped: the switch on, and its link lights the light").toEqual(expect.arrayContaining([["obj:obj:switch", "switch", "on"], ["obj:obj:light", "light", "lit"]]));
  expect(r.events, "the code keyed in: the keypad open, its link draws the bolt; then the door opened").toEqual(expect.arrayContaining([["obj:obj:keypad", "entry", "open"], ["obj:obj:door", "lock", "unlocked"], ["obj:obj:door", "leaf", "open"]]));
  expect(r.lanes, "play events go to record").toEqual(["record"]); expect(r.frames).toEqual(["canon"]);
});

test("the manor: a thing taken is in the player's hands; put down on a table, it is on the table", async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium", "the facts are the same on every engine");
  test.setTimeout(2 * LOAD);
  const page = await browser.newPage({ viewport: { width: 800, height: 500 } }), errs = []; page.on("pageerror", (e) => errs.push(e.message));
  // (a candle stub required in the great hall, where you start: the house's own candles stand in candlesticks no one carries)
  await page.goto(`${BASE}/lab/manor/index.html?webgl=1&fresh&require=candle/stub@great_hall`, { timeout: LOAD });
  await page.waitForFunction(() => window.__ok, null, { timeout: LOAD });
  const r = await page.evaluate(() => { const W = window.__works, all = [...W.things.values()];
    // (the first thing the engine lets you carry: tried in turn, taken when it is)
    let candle = null; for (const b of all) { if (b.kind.fixed === true || W.shutIn(b) || b.node.userData.opening) continue; const n = window.__outbox().events.length; window.__actOn(b, null); if (window.__outbox().events.length > n && W.held().includes(b)) { candle = b; break; } }
    const table = all.find(b => b.slots?.get("top") && !b.kind.affordances?.leaf && b.kind.kind.startsWith("table/"));
    if (!candle || !table) return { missing: [!!candle, !!table] };
    const took = true, afterTake = window.__outbox().events.slice(-1)[0];
    window.__actOn(table, null); const afterPut = window.__outbox().events.slice(-1)[0];
    return { took, afterTake: [afterTake.entity, afterTake.attribute, afterTake.value, afterTake.source.event], afterPut: [afterPut.entity, afterPut.attribute, afterPut.value, afterPut.source.event], candle: candle.address, table: table.address }; });
  expect(errs).toEqual([]);
  expect(r.missing, "a thing you can carry and a table in the house").toBeUndefined();
  expect(r.afterTake, "taken: in the player's hands (held_by · person:player, as pattern-buffer's library writes it)").toEqual([`obj:${r.candle}`, "held_by", "person:player", "take"]);
  expect(r.afterPut, "put down on the table").toEqual([`obj:${r.candle}`, "in", `obj:${r.table}`, "put"]);
});
