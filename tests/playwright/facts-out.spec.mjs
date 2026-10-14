// What the world is and what changes in it, written as pattern-buffer's facts (R75; Kabe, 2026-10-13: "the placement of our
// items and locations in pattern buffer on placement and status changes … When an item is taken for example";
// design/one-world/recipes/take-and-drop.md; src/make/facts-out.js). Placements for the author lane (fixtures first), play
// events for record, kept in the page's outbox and persisted in pattern-buffer's browser queue.
import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

const BASE = process.env.BASE || "http://localhost:8794";
const LOAD = 300_000;
test.use({ launchOptions: { args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } });

test("pattern-buffer's wire adapter preserves values and fixed times, and only allows loopback transport from a loopback page", () => {
  const adapter = new URL("../../src/make/patternbuffer.js", import.meta.url).href;
  const vendor = new URL("../../src/vendor/patternbuffer/index.mjs", import.meta.url).href;
  const r = JSON.parse(execFileSync(process.execPath, ["--input-type=module", "-e", `
const { recordItems, localPbUrl, openFactsQueue } = await import(${JSON.stringify(adapter)});
const { memoryBackend, queueKey } = await import(${JSON.stringify(vendor)});
const facts = [
 { entity:"obj:door",attribute:"locked",value:false,value_type:"literal",valid_from:0,valid_to:12,frame:"canon",source:{lane:"record"},extra:"omit" },
 { entity:"person:player",attribute:"sits_on",value:null,value_type:"entity",valid_from:5,frame:"canon",source:{lane:"record"} },
 { entity:"obj:door",attribute:"fixture",value:true,value_type:"literal",timeless:true,frame:"canon",source:{lane:"author"} }
];
const before = JSON.stringify(facts), items = recordItems(facts);
const valid = ["localhost","127.0.0.1"].flatMap(hostname => ["http://localhost:8765","https://127.0.0.1:8765"].map(pb => ({ hostname,pb,url:localPbUrl(pb,hostname) })));
const invalid = [
 ["http://127.0.0.1:8765","example.com"], ["http://example.com","localhost"], ["http://localhost.evil.test","localhost"],
 ["not a URL","localhost"], ["http://user:secret@localhost:8765","localhost"], ["ftp://localhost","localhost"],
 ["file:///tmp/pb","localhost"], ["javascript:alert(1)","localhost"], ["http://localhost/?x=1","localhost"], ["http://localhost/#fragment","localhost"]
].map(([pb,hostname]) => { try { return {pb,hostname,accepted:localPbUrl(pb,hostname)}; } catch(e) { return {pb,hostname,error:String(e)}; } });
const backend = memoryBackend(), worldId = "w:queue_test", q = await openFactsQueue({worldId,backend});
q.record(facts.slice(0,2)); q.author(facts.slice(2)); const queued = await q.snapshot();
const reopened = await openFactsQueue({worldId,backend}); reopened.author(facts.slice(2)); const duplicate = await reopened.snapshot();
const recorderCalls = await backend.get(queueKey(worldId,"holo-play")), authorCalls = await backend.get(queueKey(worldId,"holo-author"));
const requests = [], online = await openFactsQueue({worldId:"w:transport_test",backend:memoryBackend(),hostname:"localhost",pb:"http://127.0.0.1:8765",
 fetch:async(url,init)=>{requests.push({url,redirect:init.redirect,credentials:init.credentials,body:JSON.parse(init.body)});return {status:503,json:async()=>({})};}});
online.record(facts.slice(0,2)); online.author(facts.slice(2)); await online.snapshot(); await online.flush();
console.log(JSON.stringify({items,unchanged:before===JSON.stringify(facts),valid,invalid,empty:[localPbUrl(null,"example.com"),localPbUrl("","localhost")],queued,duplicate,recorderCalls,authorCalls,requests}));`], { encoding: "utf8" }));
  expect(r.items).toEqual([
    { entity: "obj:door", attribute: "locked", value: false, value_type: "literal", valid_from: 0, valid_to: 12 },
    { entity: "person:player", attribute: "sits_on", value: null, value_type: "entity", valid_from: 5 },
    { entity: "obj:door", attribute: "fixture", value: true, value_type: "literal", timeless: true },
  ]);
  expect(r.unchanged, "building wire facts does not mutate the outbox's facts").toBe(true);
  expect(r.empty, "no service URL means no transport").toEqual([null, null]);
  for (const { pb, url } of r.valid) expect(new URL(url).origin).toBe(new URL(pb).origin);
  for (const row of r.invalid) expect(row.error, `refused ${row.pb} from ${row.hostname}`).toEqual(expect.any(String));
  expect(r.queued).toMatchObject({ pending: 2, calls: 1, error: null, author: { pending: 1, calls: 1 } });
  expect(r.duplicate, "reopening and repeating the same author batch does not requeue it").toMatchObject({ pending: 2, calls: 1, error: null, author: { pending: 1, calls: 1 } });
  expect(r.recorderCalls).toHaveLength(1); expect(r.recorderCalls[0].args).not.toHaveProperty("frame");
  expect(r.authorCalls).toHaveLength(1); expect(r.authorCalls[0].args.frame).toBe("canon");
  expect(r.requests.length, "the real transport invokes the injected fetch").toBeGreaterThan(0);
  for (const request of r.requests) expect(request).toMatchObject({ url: "http://127.0.0.1:8765/call", redirect: "error", credentials: "omit" });
  const recordRequest = r.requests.find(request => request.body.session === "holo-play");
  const authorRequest = r.requests.find(request => request.body.session === "holo-author");
  expect(recordRequest.body.args).not.toHaveProperty("frame"); expect(authorRequest.body.args.frame).toBe("canon");
});

test("code-lock: its placements (the door, switch, keypad and light fixtures in their room), then each change as it happens, through to the door open", async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium", "the facts are the same on every engine");
  test.setTimeout(2 * LOAD);
  const page = await browser.newPage({ viewport: { width: 800, height: 500 } }), errs = []; page.on("pageerror", (e) => errs.push(e.message));
  try {
  await page.goto(`${BASE}/lab/manor/index.html?webgl=1&fresh&plan=recipe&recipe=code-lock`, { timeout: LOAD });
  await page.waitForFunction(() => window.__ok, null, { timeout: LOAD });
  const r = await page.evaluate(async () => { const T = (id) => window.__recipeThing(id);
    window.__actOn(T("obj:switch"), "switch"); window.__recipeTalk("person:dog");
    window.__works.act({ b: T("obj:keypad"), aff: "entry", i: null, entered: "4071" }); for (let i = 0; i < 30; i++) window.__works.tick(0.05);
    window.__actOn(T("obj:door"), "leaf");
    const o = window.__outbox({ placements: true }), pick = (f) => [f.entity, f.attribute, f.value];
    return { placements: o.placements.map(pick), events: o.events.map(pick), lanes: [...new Set(o.events.map(f => f.source.lane))], frames: [...new Set([...o.placements, ...o.events].map(f => f.frame))] }; });
  expect(errs).toEqual([]);
  for (const id of ["obj:door", "obj:switch", "obj:keypad", "obj:light"]) expect(r.placements, `${id} is built in`).toContainEqual([id, "fixture", true]);
  expect(r.placements).toContainEqual(["obj:switch", "in", "place:room"]);
  expect(r.placements, "the light starts off, as made, whatever has happened since").toContainEqual(["obj:light", "state", "off"]);
  expect(r.placements, "the door starts locked and shut").toEqual(expect.arrayContaining([["obj:door", "locked", true], ["obj:door", "state", "shut"]]));
  expect(r.placements, "the door is in the room whose doorway hangs it").toContainEqual(["obj:door", "in", "place:room"]);
  expect(r.events, "flipped: the switch on, and its link lights the light (pattern-buffer's words: state on)").toEqual(expect.arrayContaining([["obj:switch", "state", "on"], ["obj:light", "state", "on"]]));
  expect(r.events, "the code keyed in: its link draws the bolt (locked false); then the door opened (state open)").toEqual(expect.arrayContaining([["obj:door", "locked", false], ["obj:door", "state", "open"]]));
  expect(r.events.some(([e]) => e === "obj:keypad"), "the keypad's own accepted code is not written: the door's locked says it").toBe(false);
  expect(r.lanes, "play events go to record").toEqual(["record"]); expect(r.frames).toEqual(["canon"]);
  const ID = /^[a-z][a-z0-9_]*:[a-z0-9_:]+$/;
  expect([...r.placements, ...r.events].filter(([e, , v]) => !ID.test(e) || (typeof v === "string" && v.includes(":") && !ID.test(v))), "every id in pattern-buffer's grammar").toEqual([]);
  } finally { await page.close(); }
});

test("the manor: a thing taken is in the player's hands; put down on a table, it is on the table", async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium", "the facts are the same on every engine");
  test.setTimeout(2 * LOAD);
  const page = await browser.newPage({ viewport: { width: 800, height: 500 } }), errs = []; page.on("pageerror", (e) => errs.push(e.message));
  const posts = []; page.on("request", request => { if (request.method() === "POST") posts.push(request.url()); });
  try {
  // (a candle stub required in the great hall, where you start: the house's own candles stand in candlesticks no one carries)
  await page.goto(`${BASE}/lab/manor/index.html?webgl=1&fresh&require=candle/stub@great_hall`, { timeout: LOAD });
  await page.waitForFunction(() => window.__ok, null, { timeout: LOAD });
  const r = await page.evaluate(async () => { const W = window.__works, all = [...W.things.values()];
    const queueBefore = await window.__pbQueue(), eventStart = window.__outbox().events.length;
    // (the first thing the engine lets you carry: tried in turn, taken when it is)
    let candle = null; for (const b of all) { if (b.kind.fixed === true || W.shutIn(b) || b.node.userData.opening) continue; const n = window.__outbox().events.length; window.__actOn(b, null); if (window.__outbox().events.length > n && W.held().includes(b)) { candle = b; break; } }
    const table = all.find(b => b.slots?.get("top") && !b.kind.affordances?.leaf && b.kind.kind.startsWith("table/"));
    if (!candle || !table) return { missing: [!!candle, !!table] };
    const took = true, afterTake = window.__outbox().events.slice(-1)[0];
    const queueTake = await window.__pbQueue(), eventsTake = window.__outbox().events.slice(eventStart);
    window.__actOn(table, null); const afterPut = window.__outbox().events.slice(-1)[0];
    const queuePut = await window.__pbQueue(), eventsPut = window.__outbox().events.slice(eventStart);
    return { took, afterTake: [afterTake.entity, afterTake.attribute, afterTake.value, afterTake.source.event], afterPut: [afterPut.entity, afterPut.attribute, afterPut.value, afterPut.source.event], candle: candle.address, table: table.address,
      queueBefore, queueTake, queuePut, eventsTake, eventsPut }; });
  expect(errs).toEqual([]);
  expect(r.missing, "a thing you can carry and a table in the house").toBeUndefined();
  const ID = /^[a-z][a-z0-9_]*:[a-z0-9_:]+$/;   // (pattern-buffer's id grammar)
  expect(r.afterTake.slice(1), "taken: in the player's hands (held_by · person:player, as pattern-buffer's library writes it)").toEqual(["held_by", "person:player", "take"]);
  expect(r.afterTake[0]).toMatch(ID);
  expect(r.afterPut, "put down on the table").toEqual([r.afterTake[0], "in", r.afterPut[2], "put"]); expect(r.afterPut[2]).toMatch(ID); expect(r.afterPut[2]).not.toBe(r.afterTake[0]);
  const wire = facts => facts.map(({ entity, attribute, value, value_type, valid_from }) => ({ entity, attribute, value, value_type, valid_from }));
  for (const [name, queue, events] of [["take", r.queueTake, r.eventsTake], ["put", r.queuePut, r.eventsPut]]) {
    expect(queue.error, `${name}: queue writes succeeded`).toBeNull();
    expect(queue.transport, "without a pb URL no transport is configured").toBeNull();
    expect(queue.pending - r.queueBefore.pending, `${name}: pending counts facts, including every eventFacts result`).toBe(events.length);
    expect(queue.items.slice(-Math.min(events.length, 10)), `${name}: the queue holds the outbox's wire facts`).toEqual(wire(events).slice(-10));
    expect(queue.calls, `${name}: a record call was committed`).toBeGreaterThan(r.queueBefore.calls);
    for (const item of queue.items) { expect(item).not.toHaveProperty("frame"); expect(item).not.toHaveProperty("source"); }
  }
  expect(r.queuePut.pending - r.queueTake.pending, "put adds exactly the facts it emitted").toBe(r.eventsPut.length - r.eventsTake.length);
  expect([true, false, null], "storage persistence permission is separate from IndexedDB durability").toContain(r.queuePut.persisted);
  // `fresh` is an initial-world instruction; the reload resumes both the world and the queue in IndexedDB.
  await page.evaluate(() => { const url = new URL(location.href); url.searchParams.delete("fresh"); history.replaceState(null, "", url); });
  await page.reload({ timeout: LOAD }); await page.waitForFunction(() => window.__ok, null, { timeout: LOAD });
  const again = await page.evaluate(async () => ({ queue: await window.__pbQueue(), events: window.__outbox().events }));
  expect(again.queue.error, "the persisted queue reopened successfully").toBeNull();
  expect(again.queue.pending, "pending facts survive a reload even if persist() returned false").toBe(r.queuePut.pending);
  expect(again.queue.calls, "pending record calls survive reload").toBe(r.queuePut.calls);
  expect(again.queue.items, "the queued facts survive byte-for-byte as JSON values").toEqual(r.queuePut.items);
  expect(again.events, "the outbox still reports only events from this page's play").toEqual([]);
  expect(again.queue.transport).toBeNull();
  expect(posts, "an unconfigured service receives no POSTs").toEqual([]);
  expect(errs).toEqual([]);
  } finally { await page.close(); }
});
