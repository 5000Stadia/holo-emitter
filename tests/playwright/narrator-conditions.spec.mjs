// pattern-buffer's beat conditions read by the narrator (R58; BEATS-V1 r1.1, pattern-buffer 95ad945): patternbuffer.condition/1,
// construct's arc/io.py JSON, read verbatim (src/make/narrator.js fromCondition). Every one of pattern-buffer's 24 fixture
// conditions (tests/fixtures/patternbuffer-conditions.json, copied from its tests/fixtures/construct_conditions.json, with
// its schema beside it) is either read and evaluated as construct means it, or refused with the reason this house can't
// evaluate it; none is read as quietly false. Then a beat written in it, in play. Pure: node, no browser, no model.
import { test, expect } from "@playwright/test";
import { spawnSync } from "node:child_process";

const BASE = process.env.BASE || "http://localhost:8794";
const LOAD = 300_000;
test.use({ launchOptions: { args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } });

test("pattern-buffer's 24 conditions read or refused with the reason, each evaluated true and false, and a beat in them in play (tools/narrator-conditions.mjs)", () => {
  const r = spawnSync(process.execPath, [new URL("../../tools/narrator-conditions.mjs", import.meta.url).pathname], { encoding: "utf8" });
  console.log(r.stdout.trim().split("\n").slice(-4).join("\n"));
  expect(r.stdout).toMatch(/\d+ checks, 0 failed/);
  expect(r.status, r.stdout).toBe(0);
});

// the house's narrator reads the house as its facts say it now (the outbox's words): a door's state as it changes, a thing
// held by the player once taken
test("in the case's house, the narrator's world read is the house's facts as they change", async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium", "the reads are the same on every engine");
  test.setTimeout(2 * LOAD);
  const page = await browser.newPage({ viewport: { width: 800, height: 500 } }), errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${BASE}/lab/manor/index.html?webgl=1&still=0&case=case-1660&fresh&voice=0`, { timeout: LOAD });
  await page.waitForFunction(() => window.__ok && window.__narratorReads, null, { timeout: LOAD });
  const r = await page.evaluate(async () => { const { entityOf } = await import("/src/make/facts-out.js"), W = window.__works, R = window.__narratorReads;
    const door = [...W.things.values()].find(b => b.node.userData.opening && b.kind.affordances?.leaf && !W.act({ b, aff: "leaf", i: null }).refused);
    if (!door) return { missing: "a door that opens" };
    const e = entityOf(door), opened = R.world(e, "state"); W.act({ b: door, aff: "leaf", i: null }); const shut = R.world(e, "state");
    return { e, opened, shut, nothing: R.world("obj:no_such_thing", "state") ?? null, knows: R.knows("obj:keypad", "code") }; });
  expect(r.missing).toBeUndefined();
  expect([r.opened, r.shut], `${r.e}: opened, then shut again, as the facts say`).toEqual(["open", "shut"]);
  expect(r.nothing, "a thing the house hasn't: nothing").toBeNull();
  expect(r.knows, "a code not told: not in the player's frame").toBe(false);
  expect(errs).toEqual([]);
});
