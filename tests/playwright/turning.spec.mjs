import {
  test, expect, appUrl, stageTree, setViewstate, removeTree
} from "./helpers.mjs";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** Boot the app and cycle four facings with ArrowRight, returning the four
 * scene hashes plus the hash after a fifth state (the closed cycle). */
async function cycleHashes(page) {
  const hashes = [await page.evaluate(() => window.__T.hashScene())];
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press("ArrowRight");
    hashes.push(await page.evaluate(() => window.__T.hashScene()));
  }
  await page.keyboard.press("ArrowRight");
  const closed = await page.evaluate(() => window.__T.hashScene());
  return { hashes, closed };
}

function expectPairwiseDistinct(hashes) {
  for (let i = 0; i < hashes.length; i++) {
    for (let j = i + 1; j < hashes.length; j++) {
      expect(hashes[i], `facing hashes ${i} vs ${j} distinct`).not.toBe(hashes[j]);
    }
  }
}

test.describe("turning", () => {
  test("study: four facings cycle by turning, hashes pairwise distinct, cycle closes", async ({ page }) => {
    await page.goto(appUrl());
    const { hashes, closed } = await cycleHashes(page);
    expectPairwiseDistinct(hashes);
    expect(closed, "a fourth turn returns to the first facing").toBe(hashes[0]);

    // Direction is pinned, not just change: ArrowRight then ArrowLeft
    // returns to the starting hash.
    const before = await page.evaluate(() => window.__T.hashScene());
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowLeft");
    const after = await page.evaluate(() => window.__T.hashScene());
    expect(after).toBe(before);
  });

  test("journal discipline: inputs, envelopes and hash changes correspond; ring and chevrons correctly signed", async ({ page }) => {
    await page.goto(appUrl());
    let prev = await page.evaluate(() => window.__T.hashScene());
    const hashChanges = [];

    // Script R,R,L from study/N: the facing sequence must be E,S,E.
    for (const key of ["ArrowRight", "ArrowRight", "ArrowLeft"]) {
      await page.keyboard.press(key);
      const h = await page.evaluate(() => window.__T.hashScene());
      if (h !== prev) hashChanges.push(h);
      prev = h;
    }
    // Chevrons: right chevron matches ArrowRight's sign, left matches
    // ArrowLeft's. From E: right -> S, left -> E.
    await page.click("#chevron-right");
    let h = await page.evaluate(() => window.__T.hashScene());
    if (h !== prev) hashChanges.push(h);
    prev = h;
    await page.click("#chevron-left");
    h = await page.evaluate(() => window.__T.hashScene());
    if (h !== prev) hashChanges.push(h);

    const journal = await page.evaluate(() =>
      window.HOLO_APP.harness.envelopes.map((e) => ({
        events: e.events.length,
        facing: e.events.length ? e.events[0].facing : null
      }))
    );
    // Journal length equals the number of input events (boot paint emits no
    // envelope), every envelope carries exactly one view event, and every
    // hash change pairs with exactly one envelope.
    expect(journal.length).toBe(5);
    expect(journal.every((e) => e.events === 1)).toBe(true);
    expect(journal.map((e) => e.facing)).toEqual(["E", "S", "E", "S", "E"]);
    expect(hashChanges.length).toBe(5);
  });

  test("modifier'd arrows are the browser's, not turns", async ({ page }) => {
    await page.goto(appUrl());
    for (const combo of ["Alt+ArrowLeft", "Control+ArrowRight", "Meta+ArrowLeft"]) {
      await page.keyboard.press(combo);
    }
    const journal = await page.evaluate(() => window.HOLO_APP.harness.envelopes.length);
    expect(journal, "modifier'd arrows dispatch nothing").toBe(0);
  });

  test("a hand-edited stale/broken boot viewstate fails loudly at boot, not silently", async ({ page }) => {
    // The bake refuses bad viewstates, so simulate the hand-editor who
    // bypasses it: rewrite the baked viewstate directly.
    const dir = stageTree();
    try {
      const bakedPath = join(dir, "fixtures", "demo-study", "fixture.js");
      const baked = readFileSync(bakedPath, "utf8");
      writeFileSync(bakedPath, baked.replace(
        /viewstate: \{[^}]*\}/,
        'viewstate: { "location": "atrium", "facing": "N" }'
      ));
      const errors = [];
      page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
      await page.goto(appUrl(dir));
      // Loudly, and in the product's voice: the surface says a place is
      // missing; the mechanics — the marker, the path, the command — are on
      // the console, which is where speech to a developer belongs.
      await expect(page.locator("#narration")).toContainText(
        "The projection was set to a view this pattern does not hold.");
      const pane = await page.locator("#narration").innerText();
      for (const token of ["BOOT ERROR", "viewstate", ".json", "node ", "tools/"]) {
        expect(pane, `no "${token}" on the product face`).not.toContain(token);
      }
      expect(errors.some((e) => e.includes("BOOT ERROR") &&
        e.includes("bake-fixtures.mjs")), "console carries the whole mechanic").toBe(true);
    } finally {
      removeTree(dir);
    }
  });

  test("hall: boot viewstate is fixture-editable; the cycling check boots into the other room that way", async ({ page }) => {
    const dir = stageTree();
    try {
      setViewstate(dir, { location: "hall", facing: "W" });
      await page.goto(appUrl(dir));
      const boot = await page.evaluate(() => window.HOLO_APP.harness.viewstate);
      expect(boot).toEqual({ location: "hall", facing: "W" });
      const { hashes, closed } = await cycleHashes(page);
      expectPairwiseDistinct(hashes);
      expect(closed).toBe(hashes[0]);
    } finally {
      removeTree(dir);
    }
  });
});
