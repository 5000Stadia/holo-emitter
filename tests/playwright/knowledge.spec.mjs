/* §12.4 positive filter test: the knowledge filter is exercised positively —
 * a doctored fixture with desk1 OPEN and key1 present in entities but absent
 * from knowledge.player must render, through the pure renderer, a cavity
 * hash-equal to the same-run render with key1 deleted from entities (never a
 * stored golden). A renderer that ignores knowledge entirely fails here.
 *
 * Plus §12.4's interaction half (plan): pre-reveal, hover/click at the key's
 * would-be pixels resolve to the desk, never the key — the overlay and the
 * cursor must not leak an unknown entity.
 */
import { test, expect, appUrl, POINTER_VIEWPORT } from "./helpers.mjs";

test.use({ viewport: POINTER_VIEWPORT });

test.describe("§12.4 — knowledge-frame honesty", () => {
  test("positive filter: open desk + unknown key renders identically to key-deleted world", async ({ page }) => {
    await page.goto(appUrl());
    const res = await page.evaluate(async () => {
      const fx = window.HOLO_FIXTURE;
      const vs = { location: "study", facing: "N" };

      // Doctored: desk open, key1 IN entities but NOT in knowledge.
      const unknownKey = window.__T.clone(fx.world);
      unknownKey.entities.find((e) => e.id === "desk1").state = "open";
      // (key1 is absent from knowledge.player in the shipped truth already.)

      // Same-run reference: key1 deleted from entities entirely.
      const deleted = window.__T.worldWithout(["key1"], fx.world);
      deleted.entities.find((e) => e.id === "desk1").state = "open";

      const a = window.__T.renderW(unknownKey, fx.staging, vs, {});
      const b = window.__T.renderW(deleted, fx.staging, vs, {});

      // Positive control in the same run: with key1 KNOWN, the two differ —
      // so the equality above is the filter working, not the key never
      // drawing at all.
      const knownKey = window.__T.clone(unknownKey);
      knownKey.knowledge.player.push("key1");
      const c = window.__T.renderW(knownKey, fx.staging, vs, {});

      return {
        unknownHash: await window.__T.hashCanvas(a),
        deletedHash: await window.__T.hashCanvas(b),
        knownHash: await window.__T.hashCanvas(c)
      };
    });
    expect(res.unknownHash, "unknown key renders as absent").toBe(res.deletedHash);
    expect(res.knownHash, "known key genuinely draws (the filter is what hid it)")
      .not.toBe(res.deletedHash);
  });

  test("pre-reveal, the interaction layer cannot resolve the unknown key", async ({ page }) => {
    await page.goto(appUrl());
    const res = await page.evaluate(() => {
      // Open the drawer in a DOCTORED layout where key1 stays unknown, and
      // probe the key's would-be home: hitTest must say desk1 or nothing.
      const fx = window.HOLO_FIXTURE;
      const world = window.__T.clone(fx.world);
      world.entities.find((e) => e.id === "desk1").state = "open";
      const lib = window.__T.lib();
      const meta = window.HOLO.renderer.GRID_META;
      const vs = { location: "study", facing: "N" };
      const layout = window.HOLO.renderer.layout(world, fx.staging, lib, meta, vs);
      const ids = layout.map((e) => e.id);

      // Where WOULD the key be? Compute from the known-key layout.
      const known = window.__T.clone(world);
      known.knowledge.player.push("key1");
      const knownLayout = window.HOLO.renderer.layout(known, fx.staging, lib, meta, vs);
      const keyEntry = knownLayout.find((e) => e.id === "key1");
      const kb = window.__T.entryBBox(keyEntry);
      const probe = { x: Math.round(kb.x + kb.w / 2), y: Math.round(kb.y + kb.h / 2) };
      const hit = window.HOLO.renderer.hitTest(layout, lib, probe.x, probe.y);
      return { ids, keyInKnownLayout: !!keyEntry, hit };
    });
    expect(res.ids).not.toContain("key1");
    expect(res.keyInKnownLayout, "key1 lays out once known").toBe(true);
    expect(res.hit, "the key's would-be pixels resolve to the desk, never key1")
      .not.toBe("key1");
  });
});
