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

/* The reveal is undone by closing the drawer, and the player can do that
 * without taking the key — a sequence the walkthrough never performs,
 * because it always takes the key first. §7 step 5's "contents draw only
 * when the host stands open" was therefore held by nothing: delete the
 * clause and the revealed key draws on the face of a shut drawer. */
test("a revealed key goes back out of sight when the drawer is shut over it", async ({ page }) => {
  await page.goto(appUrl());
  const res = await page.evaluate(async () => {
    const A = window.HOLO_APP;
    const h = A.harness;
    const vs = { location: "study", facing: "N" };
    A.dispatch({ type: "toggle", entity: "desk1" });   // open -> reveal
    const known = h.world.knowledge.player.includes("key1");
    const openHash = await window.__T.hashScene();
    A.dispatch({ type: "toggle", entity: "desk1" });   // shut, key untaken
    const shutHash = await window.__T.hashScene();
    // Still known, still in the drawer, and not on screen: the scene equals
    // a same-run render of the same world with key1 deleted outright.
    const withoutKey = await window.__T.hashCanvas(
      window.__T.renderW(window.__T.worldWithout(["key1"], h.world), h.staging, vs, {}));
    const held = h.world.relations.some((r) => r[0] === "held_by" && r[1] === "key1");
    const inDrawer = h.world.relations.some((r) => r[0] === "in" && r[1] === "key1");
    return {
      known, held, inDrawer, openHash, shutHash, withoutKey,
      stillKnown: h.world.knowledge.player.includes("key1")
    };
  });
  expect(res.known, "the open reveals it").toBe(true);
  expect(res.stillKnown, "and shutting the drawer does not unlearn it").toBe(true);
  expect(res.held).toBe(false);
  expect(res.inDrawer, "it is still in the drawer").toBe(true);
  expect(res.shutHash).not.toBe(res.openHash);
  expect(res.shutHash, "a shut drawer shows nothing of what is inside it")
    .toBe(res.withoutKey);
});

/* "Leave a room and return and the world is exactly as you left it" — the
 * walkthrough witnesses it for the door and for the taken key, but always
 * shuts the drawer before travelling, so a container left OPEN across a room
 * change is exactly blueprint §1's phrasing and exactly what was untested. */
test("a drawer left open is still open, with its contents, after a round trip", async ({ page }) => {
  await page.goto(appUrl());
  const res = await page.evaluate(async () => {
    const A = window.HOLO_APP;
    const h = A.harness;
    A.dispatch({ type: "toggle", entity: "desk1" });   // open, key revealed
    const before = await window.__T.hashScene();
    A.dispatch({ type: "turn", dir: "right" });        // study/E
    A.dispatch({ type: "toggle", entity: "door1" });
    A.dispatch({ type: "go", exit: "door_study_hall" });
    A.dispatch({ type: "go", exit: "door_hall_study" });
    A.dispatch({ type: "turn", dir: "left" });         // back to study/N
    const after = await window.__T.hashScene();
    return {
      before, after,
      desk: h.world.entities.find((e) => e.id === "desk1").state,
      key: h.world.relations.filter((r) => r[1] === "key1"),
      viewstate: h.viewstate
    };
  });
  expect(res.viewstate).toEqual({ location: "study", facing: "N" });
  expect(res.desk, "the drawer is as you left it").toBe("open");
  expect(res.key, "and the key is still in it").toEqual([["in", "key1", "desk1"]]);
  expect(res.after, "and the picture is the picture you left").toBe(res.before);
});
