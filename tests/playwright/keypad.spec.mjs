// A keypad by a bolted door (R79's keypad; lab/brief/object.html?o=keypad, lab/codepad.js): using it opens its keys as a
// panel; a wrong code buzzes and leaves the door bolted, the right one draws the bolt and the door opens. On a phone the keys
// are tapped (60 px each), and once you know the code a button keys it in for you; on a laptop the number keys work. The
// door can't be opened by hand while bolted.
import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

const BASE = process.env.BASE || "http://localhost:8794";
const LOAD = 300_000;
test.use({ launchOptions: { args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } });

async function stage(browser, { phone = false, knows = false } = {}) {
  const ctx = await browser.newContext(phone ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 900, height: 600 } });
  const page = await ctx.newPage(), errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${BASE}/lab/brief/object.html?webgl=1&o=keypad${knows ? "&knows" : ""}`, { timeout: LOAD });
  await page.waitForFunction(() => window.__works && window.__built?.length, null, { timeout: LOAD });
  const st = () => page.evaluate(() => { const W = window.__works, d = window.__built.find(b => b.kind.kind.startsWith("door")), k = window.__built.find(b => b.kind.kind.startsWith("keypad"));
    return { entry: W.stateOf(k, "entry"), lock: W.stateOf(d, "lock"), pad: !!document.getElementById("codepad") }; });
  const use = () => page.evaluate(() => window.__use({ b: window.__built.find(b => b.kind.kind.startsWith("keypad")), aff: "entry", i: null }));
  const door = () => page.evaluate(() => window.__works.act({ b: window.__built.find(b => b.kind.kind.startsWith("door")), aff: "leaf", i: null }));
  return { ctx, page, errs, st, use, door };
}

test("a keypad's panel: a wrong code buzzes and leaves the door bolted, the right one keyed on a laptop opens it", async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium", "the panel is plain HTML, the same on every engine");
  test.setTimeout(2 * LOAD);
  const s = await stage(browser);
  expect((await s.door()).refused, "bolted: not by hand").toMatch(/bolted/);
  await s.use(); await s.page.waitForSelector("#codepad");
  expect(await s.page.locator('#codepad button[data-k="known"]').count(), "no remembered code until you know it").toBe(0);
  for (const d of "1234") await s.page.keyboard.press(d);
  await s.page.waitForTimeout(700);
  expect(await s.st(), "wrong: still bolted, the panel still open for another try").toEqual({ entry: "locked", lock: "locked", pad: true });
  for (const d of "4071") await s.page.keyboard.press(d);
  await s.page.waitForFunction(() => !document.getElementById("codepad"), null, { timeout: 10_000 });
  await s.page.waitForTimeout(500);
  expect(await s.st(), "right: the bolt drawn, the panel closed").toEqual({ entry: "open", lock: "unlocked", pad: false });
  expect((await s.door()).did, "the door opens").toBe(true);
  expect(s.errs).toEqual([]); await s.ctx.close();
});

test("on a phone: the keys tapped, and the code you know keyed in for you with one tap", async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium", "the panel is plain HTML, the same on every engine");
  test.setTimeout(2 * LOAD);
  const s = await stage(browser, { phone: true, knows: true });
  await s.use(); await s.page.waitForSelector("#codepad");
  const box = await s.page.locator('#codepad button[data-k="5"]').boundingBox();
  expect(Math.min(box.width, box.height), "a key a thumb can hit (48 px or more)").toBeGreaterThanOrEqual(48);
  for (const d of "9999") await s.page.tap(`#codepad button[data-k="${d}"]`);
  await s.page.waitForTimeout(700);
  expect((await s.st()).entry, "a guess that's wrong: still locked").toBe("locked");
  await s.page.tap('#codepad button[data-k="known"]');
  await s.page.waitForFunction(() => !document.getElementById("codepad"), null, { timeout: 10_000 });
  await s.page.waitForTimeout(500);
  expect(await s.st()).toEqual({ entry: "open", lock: "unlocked", pad: false });
  expect(s.errs).toEqual([]); await s.ctx.close();
});

// K3 (design/references/traits/plan-r2.md): in a case's play, a code is known as the proof counts it (src/make/case.js):
// once a clue that carries it is learned (a person tells it), or a thing that shows it (a note with its digits) is opened,
// taken or read; nothing else tells it, and a resumed case knows again what it knew. The page's keypads read what is known.
test("K3: a case's play knows a code once a clue that carries it is learned or a thing that shows it is handled, and no sooner", () => {
  const ROOT = new URL("../../", import.meta.url).href;
  const r = JSON.parse(execFileSync(process.execPath, ["--input-type=module", "-e", `
const { codesKnown } = await import(${JSON.stringify(ROOT + "src/make/case-play.js")});
const k = { cast: [{ id: "dog", home: "room", clues: [{ id: "dog_says", knows: "exit_code" }], knows: [{ id: "f1", text: "a person's own frame, not a code" }] }],
  clues: [{ id: "outside" }], things: [{ id: "keypad", at: "room", settings: { code: "4071", knows: "exit_code" } }, { id: "note", at: "room", knows: "safe_code" }, { id: "sign", at: "out", clue: "outside" }] };
const S = (...a) => new Set(a);
console.log(JSON.stringify({ none: codesKnown(k, S(), S()), told: codesKnown(k, S("dog_says"), S()), read: codesKnown(k, S(), S("note")), both: codesKnown(k, S("dog_says", "outside"), S("note", "sign")),
  keypadTouched: codesKnown(k, S(), S("keypad")) }));`], { encoding: "utf8" }));
  expect(r.none, "nothing learned, nothing handled: nothing known").toEqual([]);
  expect(r.told, "the person tells it").toEqual(["exit_code"]);
  expect(r.read, "the note read").toEqual(["safe_code"]);
  expect(r.both.sort()).toEqual(["exit_code", "safe_code"]);
  expect(r.keypadTouched, "a keypad's own settings tell no one its code").toEqual([]);
});
