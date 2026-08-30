import { test, expect, navUrl, stageTree, removeTree } from "./helpers.mjs";
import { readdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";

/* [ROW 45] HOW THE PAINTINGS GET TO A VISITOR.
 *
 * Kabe, on the live site: "Sometimes loading hangs on first launch. UI is
 * present but then hangs without images loading. It's consistent enough in
 * multiple browsers and different refreshes that it seems like it is an issue."
 *
 * Nothing hung. `backdrops/baked.js` was 44 MB of base64 — every painting in
 * the building, in every world — loaded as a blocking script after the UI's own
 * scripts, so the first pixel of the first wall waited on the download, parse
 * and decode of all 71 of them. The UI was up because the UI is cheap; the room
 * was not, because the room was carrying the whole manor.
 *
 * These cases are the shape of the fix, and each of them is red against the
 * bundle: one wall on the way in, a first paint that does not wait for the rest,
 * and a wall that never arrives saying so instead of freezing.
 */
test.describe("delivery", () => {
  /* THE ONE CLAIM THE BUNDLE COULD NOT MAKE. The browser's `load` event is the
     moment every resource the document asked for is in — so counting what is in
     the store at exactly that moment counts what a visitor waits for. It was 71
     paintings. It is the one in front of you. */
  test("only the wall you are looking at is on the way in", async ({ page }) => {
    await page.addInitScript(() => {
      /* Registered before any of the page's own scripts, so this listener runs
         before the page's — which is where the neighbours are asked for. */
      window.addEventListener("load", function () {
        window.__AT_LOAD = document.querySelectorAll("#backdrop-store img[data-facing]").length;
      });
    });
    await page.goto(navUrl());
    await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
    const res = await page.evaluate(() => ({
      atLoad: window.__AT_LOAD,
      inManifest: Object.keys(window.HOLO_APP.manifest).length,
      boot: window.HOLO_APP.harness.viewstate.location + "/" + window.HOLO_APP.harness.viewstate.facing,
      requestedAtLoad: Object.keys(window.HOLO_APP.requested)
    }));
    expect(res.inManifest,
      "the building's promoted walls — what the bundle put on the critical path")
      .toBeGreaterThan(20);
    expect(res.atLoad, "and exactly one of them is what the page waits for").toBe(1);
    expect(res.requestedAtLoad, "namely the wall the visitor is looking at").toContain(res.boot);
  });

  /* AND THEN THE NEIGHBOURS, off the critical path: everything one turn or one
     step away, so the next input lands on a picture that is already in. */
  test("the walls one turn or one step away are fetched after the first frame", async ({ page }) => {
    await page.goto(navUrl());
    await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
    await page.waitForFunction(() =>
      Object.keys(window.HOLO_APP.requested).length > 1);
    const res = await page.evaluate(() => {
      const A = window.HOLO_APP, vs = A.harness.viewstate;
      const want = A.neighbourKeys(vs).filter((k) => A.manifest[k]);
      return {
        want,
        got: Object.keys(A.requested),
        inManifest: Object.keys(A.manifest).length
      };
    });
    for (const k of res.want) {
      expect(res.got, `${k} is one turn or one step away, so it is asked for early`).toContain(k);
    }
    expect(res.got.length,
      "and nothing beyond that — the rest of the building is not this visitor's problem")
      .toBeLessThan(res.inManifest);
  });

  /* THE CASE THE BUNDLE MADE IMPOSSIBLE: one wall present, every other wall
     missing. Under a bundle that is a corrupt bake and the page has nothing to
     draw; under per-wall delivery it is an ordinary Tuesday — a publish still
     landing, a CDN with a hole in it — and the wall in front of you paints. */
  test("first paint completes when only this facing's painting is there, and a missing neighbour says so", async ({ page }) => {
    const dir = stageTree();
    try {
      /* Everything but study/N — the facing nav-manor boots at. What is left is
         a tree where 70 of the 71 walls 404. */
      const served = join(dir, "backdrops", "served");
      for (const loc of readdirSync(served)) {
        for (const f of readdirSync(join(served, loc))) {
          if (loc === "study" && f === "N.jpg") continue;
          rmSync(join(served, loc, f));
        }
      }
      expect(existsSync(join(served, "study", "N.jpg")), "the one wall left standing").toBe(true);

      const faults = [];
      page.on("pageerror", (e) => faults.push(String(e)));
      await page.goto(navUrl(dir));
      await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);

      /* IT PAINTED, and it painted the painting: the frame is a different
         picture from the grid the same facing would draw with its image
         withheld. Same comparison §12.8's painted clause makes, on a tree where
         every other wall is a 404. */
      const first = await page.evaluate(() => {
        const A = window.HOLO_APP, vs = { location: "study", facing: "N" };
        const opt = { backdrop_only: true };
        const painted = window.__T.renderDirect(vs, null, opt);
        const grid = document.createElement("canvas");
        grid.width = painted.width; grid.height = painted.height;
        window.HOLO.renderer.render(grid, A.harness.world, A.harness.staging, A.library,
          { "study/N": { meta: A.metaFor(vs) } }, vs, opt);
        const px = (c) => c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
        const a = px(painted), b = px(grid);
        let diff = 0;
        for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) > 8) diff++;
        return {
          share: diff / (a.length / 4),
          hasImage: !!(A.backdrops["study/N"] && A.backdrops["study/N"].image),
          noteHidden: document.getElementById("whereami-painting").hidden,
          spoke: JSON.stringify(window.HOLO_SPOKE || {})
        };
      });
      expect(first.hasImage, "the one wall that is there arrived").toBe(true);
      expect(first.share, "and the first frame is the painting, not the grid").toBeGreaterThan(0.4);
      expect(first.noteHidden, "so the readout has nothing to add about it").toBe(true);
      expect(first.spoke, "and nothing apologised").toBe("{}");

      /* NOW TURN INTO A HOLE. study/W is in the manifest and 404s in this tree:
         the room draws its grid, the readout says the picture is on its way, and
         nothing throws — the page is still walkable, which is the whole
         difference between "not yet" and "hangs". */
      await page.evaluate(() => window.HOLO_APP.dispatch({ type: "turn", dir: "left" }));
      await page.waitForTimeout(400);
      const after = await page.evaluate(() => ({
        facing: window.HOLO_APP.harness.viewstate.facing,
        note: document.getElementById("whereami-painting").hidden
          ? null : document.getElementById("whereami-painting").textContent,
        readout: document.getElementById("whereami-place").textContent + "/" +
          document.getElementById("whereami-facing").textContent,
        painted: window.HOLO_APP.paints,
        image: !!(window.HOLO_APP.backdrops["study/W"] || {}).image,
        spoke: JSON.stringify(window.HOLO_SPOKE || {}),
        narration: Array.from(document.querySelectorAll("#narration p")).map((p) => p.textContent)
      }));
      expect(after.facing, "the turn happened").toBe("W");
      expect(after.image, "the wall did not arrive").toBe(false);
      expect(after.note, "and the readout says the picture is still coming").toBe("painting loading…");
      expect(after.readout, "while still saying where you stand").toBe("study/W");
      expect(after.painted, "the room painted anyway").toBeGreaterThan(1);
      expect(after.spoke, "nothing apologised for a fault it did not have").toBe("{}");
      expect(after.narration.join(" "), "and the page did not disown itself")
        .not.toContain("Nothing of this place can be shown");
      expect(faults, "no uncaught error").toEqual([]);

      /* AND COMING BACK ASKS AGAIN — but standing there does not. A wall that
         failed is marked, not forgotten: nothing re-requests it while you face
         it (a repaint runs through the same warm(), and re-asking there is an
         endless fetch loop), and moving away and back clears the mark, because
         a page left open across a publish cannot tell a wall that will never
         come from one that has not landed yet. */
      const asked = await page.evaluate(async () => {
        const A = window.HOLO_APP;
        const before = A.requested["study/W"];
        const beforeFailed = !!(before && before.failed);
        A.dispatch({ type: "turn", dir: "right" });
        A.dispatch({ type: "turn", dir: "left" });
        const after = A.requested["study/W"];
        return { beforeFailed, sameObject: after === before, afterAsked: !!after };
      });
      expect(asked.beforeFailed, "the wall that did not arrive is marked, not re-asked in place")
        .toBe(true);
      expect(asked.afterAsked, "and returning to the facing asks for it again").toBe(true);
      expect(asked.sameObject, "with a fresh request, not the one that failed").toBe(false);
    } finally {
      removeTree(dir);
    }
  });
});
