/* §12.1 — the scripted walkthrough, through real pointer/keyboard events
 * only, with documented assertions after every step; §12.4's zero-frames
 * woven through it; §12.2 clause 2 (the whole script replayed → identical
 * hash sequence). The input-event sequence is pinned by the plan — turns
 * included — because the replay makes the exact sequence load-bearing.
 *
 * Click coords come from the app's own layout/hitTest (in-page clickPoint),
 * EXCEPT the chair-refusal click, whose point is derived by test-side
 * independent arithmetic (helpers MATH from §5 literals + record data) and
 * verified against both solo-render alpha masks — one real click that
 * witnesses front-to-back hit resolution at a deliberately staged overlap
 * pixel.
 */
import {
  test, expect, appUrl, POINTER_VIEWPORT, MATH, stageTree, removeTree, equipContext
} from "./helpers.mjs";
import { rmSync } from "node:fs";
import { join } from "node:path";

test.use({ viewport: POINTER_VIEWPORT });

async function sceneBox(page) {
  return await page.locator("#scene").boundingBox();
}

async function clickCanvasPoint(page, pt) {
  const box = await sceneBox(page);
  await page.mouse.click(
    box.x + (pt.x * box.width) / 1536,
    box.y + (pt.y * box.height) / 1024
  );
}

async function clickEntity(page, id) {
  const pt = await page.evaluate((id) => window.__T.clickPoint(id), id);
  expect(pt, `clickable point for ${id}`).not.toBeNull();
  await clickCanvasPoint(page, pt);
}

/* Walk through the opening, not through the leaf. The doorway and the leaf
 * are two targets: clicking the opening is `go`, clicking the leaf is
 * `toggle`. Clicking the leaf to travel was the old affordance and it left
 * an opened door with no way to be closed. */
async function clickDoorway(page) {
  const pt = await page.evaluate(() => window.__T.aperturePoint());
  expect(pt, "clear point inside the doorway").not.toBeNull();
  await clickCanvasPoint(page, pt);
}

async function state(page) {
  return await page.evaluate(async () => {
    const h = window.HOLO_APP.harness;
    const env = h.envelopes[h.envelopes.length - 1] || null;
    return {
      hash: await window.__T.hashScene(),
      viewstate: h.viewstate,
      envelopes: h.envelopes.length,
      paints: window.HOLO_APP.paints,
      lastEnvelope: env ? {
        events: env.events, narration: env.narration ?? null,
        intent: env.intent
      } : null,
      world: {
        desk: h.world.entities.find((e) => e.id === "desk1").state,
        door: h.world.entities.find((e) => e.id === "door1").state,
        relations: h.world.relations,
        knowledge: [...h.world.knowledge.player].sort()
      },
      lastNarrationLine: (() => {
        const ps = document.querySelectorAll("#narration p");
        return ps.length ? ps[ps.length - 1].textContent : null;
      })(),
      inventory: [...document.querySelectorAll("#inventory canvas.inv-tile")]
        .map((t) => t.getAttribute("data-entity"))
    };
  });
}

/* Scene hash must equal a same-run pure render of the current world minus
 * the named entities (the §12.4 doctored-render discipline; empty ids = the
 * agreement check: harness view == pure render of the same document). */
async function doctoredHash(page, withoutIds) {
  return await page.evaluate(async (ids) => {
    const h = window.HOLO_APP.harness;
    const w = window.__T.worldWithout(ids, h.world);
    const c = window.__T.renderW(w, h.staging, h.viewstate, {});
    return await window.__T.hashCanvas(c);
  }, withoutIds);
}

/* One full pinned run. Collects the scene hash after every input event. */
async function runScript(page, opts = {}) {
  const hashes = [];
  const note = async () => { hashes.push(await page.evaluate(() => window.__T.hashScene())); };
  const assertKeyAbsent = async () => {
    if (!opts.assertions) return;
    // §12.4 zero-frames: the scene equals the same-run key1-deleted render.
    expect(await page.evaluate(() => window.__T.hashScene()))
      .toBe(await doctoredHash(page, ["key1"]));
  };

  await page.goto(appUrl());
  await note();
  await assertKeyAbsent();

  if (opts.assertions) {
    // Hover assert (once): overlay non-blank over the desk, blank off it,
    // and blank again after a keyboard turn with the cursor stationary.
    const box = await sceneBox(page);
    const deskPt = await page.evaluate(() => window.__T.clickPoint("desk1"));
    expect(deskPt).not.toBeNull();
    await page.mouse.move(
      box.x + (deskPt.x * box.width) / 1536,
      box.y + (deskPt.y * box.height) / 1024);
    expect(await page.evaluate(() => window.__T.isOverlayBlank()),
      "overlay inked over desk").toBe(false);
    // Outline identity: inked pixels lie within the hovered entity's bbox+pad,
    // and hovering the chair yields different overlay bounds.
    const deskOutline = await page.evaluate(() => {
      const o = document.getElementById("overlay");
      return window.__T.alphaBounds(o, 1);
    });
    const deskBBox = await page.evaluate(() => {
      const layout = window.__T.currentLayout();
      return window.__T.entryBBox(layout.find((e) => e.id === "desk1"));
    });
    const pad = 4;
    expect(deskOutline.x0).toBeGreaterThanOrEqual(deskBBox.x - pad);
    expect(deskOutline.x1).toBeLessThanOrEqual(deskBBox.x + deskBBox.w + pad);
    expect(deskOutline.y0).toBeGreaterThanOrEqual(deskBBox.y - pad);
    expect(deskOutline.y1).toBeLessThanOrEqual(deskBBox.y + deskBBox.h + pad);
    const chairPt = await page.evaluate(() => window.__T.clickPoint("chair1"));
    await page.mouse.move(
      box.x + (chairPt.x * box.width) / 1536,
      box.y + (chairPt.y * box.height) / 1024);
    const chairOutline = await page.evaluate(() => {
      const o = document.getElementById("overlay");
      return window.__T.alphaBounds(o, 1);
    });
    expect(JSON.stringify(chairOutline), "chair outline differs from desk outline")
      .not.toBe(JSON.stringify(deskOutline));
    // Move back over the desk, then turn with the cursor stationary: the
    // overlay must be blank after the paint (stale-outline hazard).
    await page.mouse.move(
      box.x + (deskPt.x * box.width) / 1536,
      box.y + (deskPt.y * box.height) / 1024);
    await page.keyboard.press("ArrowRight");
    expect(await page.evaluate(() => window.__T.isOverlayBlank()),
      "overlay blank after a turn with a stationary cursor").toBe(true);
    await page.keyboard.press("ArrowLeft"); // back to N; these two turns are
    // outside the pinned sequence and excluded from the replay run's hashes.
    // Off-entity hover: blank overlay.
    await page.mouse.move(box.x + (30 * box.width) / 1536, box.y + (30 * box.height) / 1024);
    expect(await page.evaluate(() => window.__T.isOverlayBlank()),
      "overlay blank off entities").toBe(true);
    // Dead-space click: no envelope, no paint, no narration (the picture —
    // and the journal — never change when the world doesn't).
    const before = await state(page);
    await clickCanvasPoint(page, { x: 30, y: 30 });
    const after = await state(page);
    expect(after.envelopes).toBe(before.envelopes);
    expect(after.paints).toBe(before.paints);
    expect(after.hash).toBe(before.hash);
  }

  // ---- Pinned sequence begins (replayed verbatim by both runs) ----
  // turn x4 (the cycle, back to N)
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press("ArrowRight");
    await note();
    await assertKeyAbsent();
  }
  if (opts.assertions) {
    const s = await state(page);
    expect(s.viewstate).toEqual({ location: "study", facing: "N" });
  }

  // Chair-refusal click at a test-side arithmetic point inside the
  // chair×desk intersection (independent of layout/hitTest).
  {
    let pt;
    if (opts.assertions) {
      const recs = await page.evaluate(() => ({
        chair: window.__T.clone(window.HOLO_APP.library["chair-joined"].record),
        desk: window.__T.clone(window.HOLO_APP.library["desk-joined-oak-1660"].record),
        staging: window.__T.clone(window.HOLO_APP.harness.staging.placements)
      }));
      const chairP = MATH.place(recs.staging.chair1, recs.chair);
      const deskP = MATH.place(recs.staging.desk1, recs.desk);
      // Chair contract: back panel opaque over middle 60% width, top-third rows.
      const chairRowLo = chairP.baselineY - chairP.heightPx;
      const chairRowHi = chairRowLo + chairP.heightPx / 3;
      const chairColLo = chairP.drawX + chairP.f * recs.chair.px.w * 0.25;
      const chairColHi = chairP.drawX + chairP.f * recs.chair.px.w * 0.75;
      // Desk contract: the top slab is opaque across the whole footprint for
      // the topmost 13% of the desk's rows. (It was the stretcher between the
      // legs until the grid's foreshortening was made to agree with §5's own
      // horizon device: the chair now stands nearer and taller, and its back
      // panel clears the desk's feet entirely while crossing the desk top.)
      const deskRowLo = deskP.baselineY - deskP.heightPx;
      const deskRowHi = deskRowLo + 0.13 * deskP.heightPx;
      const deskColLo = deskP.drawX + deskP.f * (recs.desk.anchors.footprint.x0 + 0.15 * recs.desk.px.w);
      const deskColHi = deskP.drawX + deskP.f * (recs.desk.anchors.footprint.x1 - 0.15 * recs.desk.px.w);
      const x = Math.round((Math.max(chairColLo, deskColLo) + Math.min(chairColHi, deskColHi)) / 2);
      const y = Math.round((Math.max(chairRowLo, deskRowLo) + Math.min(chairRowHi, deskRowHi)) / 2);
      expect(Math.max(chairColLo, deskColLo), "cols intersect").toBeLessThan(Math.min(chairColHi, deskColHi));
      expect(Math.max(chairRowLo, deskRowLo), "rows intersect").toBeLessThan(Math.min(chairRowHi, deskRowHi));
      pt = { x, y };
      // Both solo masks opaque at the point (threshold 128) — hard assert.
      const opaque = await page.evaluate(async (pt) => {
        const fx = window.HOLO_FIXTURE;
        const chairOnly = window.__T.renderW(
          window.__T.worldWithout(
            fx.world.entities.filter((e) => e.id !== "chair1").map((e) => e.id)),
          fx.staging, { location: "study", facing: "N" },
          { no_backdrop: true, shadows: false });
        const deskOnly = window.__T.renderW(
          window.__T.worldWithout(
            fx.world.entities.filter((e) => e.id !== "desk1").map((e) => e.id)),
          fx.staging, { location: "study", facing: "N" },
          { no_backdrop: true, shadows: false });
        return {
          chair: window.__T.px(chairOnly, pt.x, pt.y)[3],
          desk: window.__T.px(deskOnly, pt.x, pt.y)[3]
        };
      }, pt);
      expect(opaque.chair, "chair opaque at the arithmetic point").toBeGreaterThanOrEqual(128);
      expect(opaque.desk, "desk opaque at the arithmetic point").toBeGreaterThanOrEqual(128);
    } else {
      // The replay run clicks the app-derived chair point deterministically.
      pt = await page.evaluate(() => window.__T.clickPoint("chair1"));
    }
    const before = opts.assertions ? await state(page) : null;
    await clickCanvasPoint(page, pt);
    await note();
    await assertKeyAbsent();
    if (opts.assertions) {
      const s = await state(page);
      // The refusal envelope names chair1 (front-to-back hit resolution at a
      // staged overlap pixel: a hitTest returning the farther desk would
      // have opened the drawer instead).
      expect(s.lastEnvelope.intent).toEqual({ type: "toggle", entity: "chair1" });
      expect(s.lastEnvelope.events).toEqual([]);
      expect(s.lastEnvelope.narration, "refusal narration present").toBeTruthy();
      expect(s.lastNarrationLine, "refusal line reaches the pane").toBe(s.lastEnvelope.narration);
      expect(s.hash, "scene hash unchanged by refusal").toBe(before.hash);
      expect(s.paints, "no paint on refusal").toBe(before.paints);
      expect(s.envelopes).toBe(before.envelopes + 1);
    }
  }

  // toggle desk open (open_reveal; key becomes visible)
  await clickEntity(page, "desk1");
  await note();
  if (opts.assertions) {
    const s = await state(page);
    expect(s.world.desk).toBe("open");
    expect(s.world.knowledge).toContain("key1");
    expect(s.lastEnvelope.events).toEqual([
      { type: "state", entity: "desk1", to: "open" },
      { type: "knowledge_add", entity: "key1" }
    ]);
    expect(s.lastNarrationLine).toBe("The drawer resists, then gives. Inside, an iron key.");
    // Key visible: scene differs from the same-run key1-deleted render.
    expect(s.hash).not.toBe(await doctoredHash(page, ["key1"]));
    // And the harness view agrees with a pure render of the same document.
    expect(s.hash).toBe(await doctoredHash(page, []));
  }

  // take key (inventory tile; cavity empty)
  await clickEntity(page, "key1");
  await note();
  if (opts.assertions) {
    const s = await state(page);
    expect(s.world.relations).toContainEqual(["held_by", "key1", "player"]);
    expect(s.world.relations).not.toContainEqual(["in", "key1", "desk1"]);
    expect(s.inventory).toEqual(["key1"]);
    expect(s.lastNarrationLine).toBe(s.lastEnvelope.narration); // take class reaches the pane
    // Cavity empty, operationalized: the scene hash-equals the same-run
    // key1-deleted render (the held key is undrawn; region and full-scene
    // agree because nothing else changed).
    expect(s.hash).toBe(await doctoredHash(page, ["key1"]));
    // Tile pixels are the entity's own thumb.
    const tileMatch = await page.evaluate(async () => {
      const tile = document.querySelector('#inventory canvas[data-entity="key1"]');
      const thumb = window.HOLO_APP.library["key-iron"].images.thumb;
      return (await window.__T.hashCanvas(tile)) === (await window.__T.hashCanvas(thumb));
    });
    expect(tileMatch, "key tile pixel-equals the key thumb").toBe(true);
  }

  // close desk
  await clickEntity(page, "desk1");
  await note();
  if (opts.assertions) {
    const s = await state(page);
    expect(s.world.desk).toBe("closed");
    expect(s.lastEnvelope.events).toEqual([{ type: "state", entity: "desk1", to: "closed" }]);
  }

  // turn to E; open door; go through it
  await page.keyboard.press("ArrowRight");
  await note();
  await clickEntity(page, "door1"); // closed door click is a toggle
  await note();
  if (opts.assertions) {
    const s = await state(page);
    expect(s.world.door).toBe("open");
    expect(s.lastNarrationLine).toBe(s.lastEnvelope.narration); // toggle-success class
  }
  await clickDoorway(page); // the opening is the `go` target
  await note();
  if (opts.assertions) {
    const s = await state(page);
    expect(s.viewstate).toEqual({ location: "hall", facing: "W" });
    expect(s.lastEnvelope.intent).toEqual({ type: "go", exit: "door_study_hall" });
    expect(s.lastNarrationLine).toBe(s.lastEnvelope.narration); // arrival class
    // Door renders open from the hall side: harness view == pure render of
    // the current world, and != the same-run render doctored to door closed.
    expect(s.hash).toBe(await doctoredHash(page, []));
    const closedHash = await page.evaluate(async () => {
      const h = window.HOLO_APP.harness;
      const w = window.__T.clone(h.world);
      w.entities.find((e) => e.id === "door1").state = "closed";
      return await window.__T.hashCanvas(
        window.__T.renderW(w, h.staging, h.viewstate, {}));
    });
    expect(s.hash).not.toBe(closedHash);
  }

  // right CHEVRON click (W→N) — §12.1's own letter includes chevron clicks.
  await page.click("#chevron-right");
  await note();
  if (opts.assertions) {
    const s = await state(page);
    expect(s.viewstate).toEqual({ location: "hall", facing: "N" });
  }

  // take coin
  await clickEntity(page, "coin1");
  await note();
  if (opts.assertions) {
    const s = await state(page);
    expect(s.inventory).toEqual(["key1", "coin1"]);
    // The scene-side half witnessed too: post-take hall/N equals the
    // same-run coin1-deleted render (the unclipped on-relation removal).
    expect(s.hash).toBe(await doctoredHash(page, ["coin1"]));
  }

  // back to W; go through the still-open door
  await page.keyboard.press("ArrowLeft");
  await note();
  await clickDoorway(page);
  await note();
  if (opts.assertions) {
    const s = await state(page);
    expect(s.viewstate).toEqual({ location: "study", facing: "E" });
    expect(s.world.door, "door still open — persistence").toBe("open");
    expect(s.hash).toBe(await doctoredHash(page, []));
    const closedHash = await page.evaluate(async () => {
      const h = window.HOLO_APP.harness;
      const w = window.__T.clone(h.world);
      w.entities.find((e) => e.id === "door1").state = "closed";
      return await window.__T.hashCanvas(
        window.__T.renderW(w, h.staging, h.viewstate, {}));
    });
    expect(s.hash).not.toBe(closedHash);
  }

  // turn to N; open desk again (plain open — reveal spent)
  await page.keyboard.press("ArrowLeft");
  await note();
  await clickEntity(page, "desk1");
  await note();
  if (opts.assertions) {
    const s = await state(page);
    expect(s.world.desk).toBe("open");
    expect(s.lastEnvelope.events).toEqual([{ type: "state", entity: "desk1", to: "open" }]);
    // Plain open, never the reveal line again.
    expect(s.lastNarrationLine).not.toBe("The drawer resists, then gives. Inside, an iron key.");
    // Key absent (held): scene equals key1-deleted render.
    expect(s.hash).toBe(await doctoredHash(page, ["key1"]));
    // Notebook still present: scene differs from note1-deleted render.
    expect(s.hash).not.toBe(await doctoredHash(page, ["note1"]));
    // The inventory still shows exactly its two tiles after the round trip.
    expect(s.inventory).toEqual(["key1", "coin1"]);
    const tilesMatch = await page.evaluate(async () => {
      const pairs = [["key1", "key-iron"], ["coin1", "coin-silver"]];
      for (const [id, sprite] of pairs) {
        const tile = document.querySelector(`#inventory canvas[data-entity="${id}"]`);
        const thumb = window.HOLO_APP.library[sprite].images.thumb;
        if ((await window.__T.hashCanvas(tile)) !== (await window.__T.hashCanvas(thumb))) return id;
      }
      return true;
    });
    expect(tilesMatch).toBe(true);
  }

  return hashes;
}

test.describe("§12.1 walkthrough (real events) + §12.2 clause 2 (replay)", () => {
  test("the pinned script, with documented assertions after every step", async ({ page }) => {
    test.setTimeout(120000);
    await runScript(page, { assertions: true });
  });

  test("the whole script replayed in a fresh page yields the identical hash sequence", async ({ page, context }) => {
    test.setTimeout(120000);
    const run1 = await runScript(page, { assertions: false });
    const page2 = await context.newPage();
    const run2 = await runScript(page2, { assertions: false });
    await page2.close();
    expect(run2).toEqual(run1);
  });
});

/* The door as a player meets it. §12.1's script walks through it once each
 * way; these are the affordances around that — the ones a person finds by
 * clicking, and the ones whose absence a hash-equality assert cannot see. */
test.describe("the door, from the pointer", () => {
  async function openTheDoor(page) {
    await page.goto(appUrl());
    await page.keyboard.press("ArrowRight"); // study/E
    await clickEntity(page, "door1");        // shut leaf: toggle -> open
    const s = await state(page);
    expect(s.world.door).toBe("open");
  }

  test("an opened door can be shut again by clicking the leaf", async ({ page }) => {
    // Every click on an open exit door used to dispatch `go`, so once a door
    // stood open no pointer path could ever close it: the drawer opened and
    // closed, the door only opened. `toggle.door1.closed` was authored, was
    // a member of the §12.9 domain, and was unreachable by any player.
    await openTheDoor(page);
    await clickEntity(page, "door1");
    const s = await state(page);
    expect(s.world.door, "the leaf toggles shut").toBe("closed");
    expect(s.viewstate, "and shutting it does not walk you through")
      .toEqual({ location: "study", facing: "E" });
    expect(s.lastEnvelope.events).toEqual([{ type: "state", entity: "door1", to: "closed" }]);
    expect(s.lastEnvelope.intent).toEqual({ type: "toggle", entity: "door1" });
  });

  test("the doorway is a real target: the middle of the opening walks you through", async ({ page }) => {
    // The `go` target used to be the swung leaf alone — a sliver a few CSS
    // pixels wide. A person clicks the opening.
    await openTheDoor(page);
    const a = await page.evaluate(() => {
      const A = window.HOLO_APP;
      return window.HOLO.renderer.apertures(
        A.harness.world, A.harness.staging, A.library,
        window.HOLO.renderer.GRID_META, A.harness.viewstate)[0];
    });
    expect(a, "the facing has a doorway").toBeTruthy();
    // Dead centre of the opening — no searching, no help.
    await clickCanvasPoint(page, { x: a.x + a.w / 2, y: a.y + a.h / 2 });
    const s = await state(page);
    expect(s.viewstate).toEqual({ location: "hall", facing: "W" });
    expect(s.lastEnvelope.intent).toEqual({ type: "go", exit: "door_study_hall" });
  });

  test("clicking the opening of a SHUT door toggles it, and never travels", async ({ page }) => {
    await page.goto(appUrl());
    await page.keyboard.press("ArrowRight");
    const a = await page.evaluate(() => {
      const A = window.HOLO_APP;
      return window.HOLO.renderer.apertures(
        A.harness.world, A.harness.staging, A.library,
        window.HOLO.renderer.GRID_META, A.harness.viewstate)[0];
    });
    await clickCanvasPoint(page, { x: a.x + a.w / 2, y: a.y + a.h / 2 });
    const s = await state(page);
    expect(s.world.door, "the shut leaf covers its own doorway").toBe("open");
    expect(s.viewstate).toEqual({ location: "study", facing: "E" });
  });

  test("the go veil covers the room you leave, and lifts on the one you arrive in", async ({ page }) => {
    // The veil used to be added AFTER the harness had already moved and
    // repainted, so the player saw the destination cut in at full brightness
    // and then get blacked out for half a second. The word "veil" appeared
    // in no test at all.
    await openTheDoor(page);
    const a = await page.evaluate(() => {
      const A = window.HOLO_APP;
      return window.HOLO.renderer.apertures(
        A.harness.world, A.harness.staging, A.library,
        window.HOLO.renderer.GRID_META, A.harness.viewstate)[0];
    });
    const box = await sceneBox(page);
    const opacity = () => page.evaluate(
      () => getComputedStyle(document.getElementById("veil")).opacity);

    expect(Number(await opacity()), "no veil before the move").toBe(0);
    // Dispatch synchronously and read the veil in the same task, before any
    // frame can be painted: the black must already be up.
    const atMove = await page.evaluate(({ x, y }) => {
      const A = window.HOLO_APP;
      const before = A.harness.viewstate.location;
      const a = window.HOLO.renderer.apertures(
        A.harness.world, A.harness.staging, A.library,
        window.HOLO.renderer.GRID_META, A.harness.viewstate)[0];
      A.dispatch({ type: "go", exit: a.exit });
      return {
        before,
        after: A.harness.viewstate.location,
        veil: getComputedStyle(document.getElementById("veil")).opacity
      };
    }, { x: box.x, y: box.y });
    expect(atMove.before).toBe("study");
    expect(atMove.after).toBe("hall");
    expect(Number(atMove.veil), "the veil is black at the instant the view moves").toBe(1);

    await expect.poll(async () => Number(await opacity()), {
      message: "the veil lifts on the arrival",
      timeout: 3000
    }).toBe(0);
  });

  test("a refused go never flashes the veil", async ({ page }) => {
    await page.goto(appUrl());
    await page.keyboard.press("ArrowRight"); // study/E, door shut
    const res = await page.evaluate(() => {
      const A = window.HOLO_APP;
      const env = A.dispatch({ type: "go", exit: "door_study_hall" });
      return {
        events: env.events.length,
        veil: getComputedStyle(document.getElementById("veil")).opacity
      };
    });
    expect(res.events).toBe(0);
    expect(Number(res.veil), "a closed door does not black the screen").toBe(0);
  });
});

/* The page's own surfaces under stress: what it shows when it cannot show
 * the world, and whether the doorway answers a pointer like everything else
 * does. */
test.describe("what the page shows when things go wrong, and where it points", () => {
  test("the whole opening is the way through, not just the far side of it", async ({ page }) => {
    // The leaf's 16px pointing tolerance used to reach 40px into an 86px
    // opening: nearly half the visible gap meant "shut the door", with
    // pointer feedback, while the way through had no room left. On a phone
    // that made travelling between rooms close to a coin flip.
    await page.goto(appUrl());
    await page.keyboard.press("ArrowRight");
    await clickEntity(page, "door1");
    const res = await page.evaluate(() => {
      const A = window.HOLO_APP;
      const a = window.HOLO.renderer.apertures(
        A.harness.world, A.harness.staging, A.library,
        window.HOLO.renderer.GRID_META, A.harness.viewstate)[0];
      // Sample the opening on a grid; every point inside it that is not the
      // leaf's own pixels must resolve to travel.
      // Asked of the SHIPPED resolver, not of apertureAt directly: the whole
      // defect was an ordering one — the tolerance ring running before the
      // doorway — and a test that consults the doorway itself cannot see the
      // order the page actually applies.
      let travel = 0, leaf = 0, other = 0;
      for (let fy = 0.15; fy <= 0.85; fy += 0.1) {
        for (let fx = 0.05; fx <= 0.95; fx += 0.05) {
          const x = a.x + fx * a.w, y = a.y + fy * a.h;
          const exact = window.HOLO.renderer.hitTest(
            window.__T.currentLayout(), A.library, x, y);
          const r = A.resolve({ x, y });
          if (exact) { leaf++; continue; }        // the leaf's own pixels
          if (r.kind === "doorway") travel++;
          else other++;                            // ring stole it, or dead
        }
      }
      return { travel, leaf, other, width: a.w };
    });
    expect(res.other,
      "every point inside an open doorway that is not the leaf's own pixels means travel")
      .toBe(0);
    // The leaf is a quarter of the opening at most; the rest is the way out.
    expect(res.travel).toBeGreaterThan(res.leaf * 2);
  });

  test("the doorway answers the cursor like everything else", async ({ page }) => {
    await page.goto(appUrl());
    await page.keyboard.press("ArrowRight");
    await clickEntity(page, "door1"); // open it
    const box = await sceneBox(page);
    const a = await page.evaluate(() => {
      const A = window.HOLO_APP;
      return window.HOLO.renderer.apertures(
        A.harness.world, A.harness.staging, A.library,
        window.HOLO.renderer.GRID_META, A.harness.viewstate)[0];
    });
    await page.mouse.move(
      box.x + ((a.x + a.w * 0.75) * box.width) / 1536,
      box.y + ((a.y + a.h * 0.5) * box.height) / 1024);
    const res = await page.evaluate(() => ({
      blank: window.__T.isOverlayBlank(),
      cursor: document.getElementById("scene").style.cursor
    }));
    expect(res.blank, "the way between rooms is highlighted on hover").toBe(false);
    expect(res.cursor, "and carries the pointer").toBe("pointer");
  });

  test("a render fault clears the picture it can no longer vouch for", async ({ page }) => {
    // The catch used to return with the previous frame's pixels, the previous
    // hover outline and the pointer cursor all still in place: the world had
    // moved and the picture had not.
    await page.goto(appUrl());
    const box = await sceneBox(page);
    const pt = await page.evaluate(() => window.__T.clickPoint("desk1"));
    await page.mouse.move(
      box.x + (pt.x * box.width) / 1536,
      box.y + (pt.y * box.height) / 1024);
    expect(await page.evaluate(() => window.__T.isOverlayBlank())).toBe(false);

    const res = await page.evaluate(async () => {
      // Break the library out from under the next paint, then force one.
      const A = window.HOLO_APP;
      delete A.library["chair-joined"];
      A.dispatch({ type: "turn", dir: "right" });
      A.dispatch({ type: "turn", dir: "left" });
      const s = document.getElementById("scene");
      const d = s.getContext("2d").getImageData(0, 0, s.width, s.height).data;
      let ink = 0;
      for (let p = 0; p < d.length; p += 4) if (d[p + 3] !== 0) { ink++; break; }
      const ps = document.querySelectorAll("#narration p");
      return {
        ink,
        overlayBlank: window.__T.isOverlayBlank(),
        cursor: s.style.cursor,
        line: ps.length ? ps[ps.length - 1].textContent : null
      };
    });
    expect(res.ink, "the stale picture is gone").toBe(0);
    expect(res.overlayBlank, "and so is the stale highlight").toBe(true);
    expect(res.cursor, "and the cursor stops promising").toBe("");
    expect(res.line, "the product says so in its own voice")
      .toBe("The projection wavers; the pattern will not resolve.");
  });
});

test.describe("a page that cannot boot still speaks", () => {
  // Remove one module from a staged copy of the tree — the shape of a
  // partial load over a public link. The page used to sit black and silent
  // with `‹ ›` as its entire visible text. Which of the two product-voiced
  // fault lines appears depends on how far the boot got before the missing
  // piece was reached; both are the product speaking, and that is the whole
  // requirement.
  //
  // The module is DELETED, not blocked by request routing: `page.route(...)`
  // is a silent no-op on `file://` in Firefox, so a routing version of this
  // guard is green while guarding nothing on any engine that does not
  // intercept file URLs — which is the shape of check this row keeps finding.
  const FAULT_LINES = [
    "The projection will not hold. Nothing of this place can be shown.",
    "The projection wavers; the pattern will not resolve."
  ];
  const MODULES = [
    ["src", "renderer.js"],
    ["src", "harness.js"],
    ["src", "placeholders.js"],
    ["fixtures", "demo-study", "fixture.js"]
  ];
  for (const parts of MODULES) {
    test(`a missing ${parts[parts.length - 1]} leaves a sentence, not a black rectangle`, async ({ page }) => {
      const root = stageTree();
      try {
        rmSync(join(root, ...parts));
        const errors = [];
        page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
        await page.goto(appUrl(root));
        await expect.poll(async () => await page.evaluate(() => {
          const ps = document.querySelectorAll("#narration p");
          return ps.length ? ps[ps.length - 1].textContent : null;
        }), { timeout: 5000, message: "the page says something" }).not.toBeNull();
        const line = await page.evaluate(() => {
          const ps = document.querySelectorAll("#narration p");
          return ps[ps.length - 1].textContent;
        });
        expect(FAULT_LINES, "and it speaks as the product").toContain(line);
        expect(errors.length, "developer detail on the console").toBeGreaterThan(0);
      } finally {
        removeTree(root);
      }
    });
  }

  test("with scripts disabled the page still says something, and offers nothing that does not work", async ({ browser }) => {
    // The noscript surface was added and guarded by nothing: deleting it left
    // the suite green while the page became a black rectangle with two inert
    // chevrons.
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const p = await ctx.newPage();
    await p.goto(appUrl());
    const text = await p.locator("#narration").innerText();
    expect(text.trim()).toBe(
      "This place is projected by your browser, and your browser is not running scripts. Nothing can be shown here until it does.");
    // Chevrons look live and are not; they must not be offered.
    expect(await p.locator("#chevron-left").isVisible()).toBe(false);
    expect(await p.locator("#chevron-right").isVisible()).toBe(false);
    await ctx.close();
  });

  test("a healthy page never shows the boot error", async ({ page }) => {
    // turning.spec checks the error appears when it should; nothing checked
    // that it stays away when it should, so forcing the branch always-true
    // put a `node tools/bake-fixtures.mjs` instruction in front of every
    // visitor with the whole suite still green.
    await page.goto(appUrl());
    await page.waitForFunction(() => !!window.HOLO_APP);
    const status = await page.locator("#status").textContent();
    expect(status).not.toMatch(/BOOT ERROR/);
    const narration = await page.locator("#narration").innerText();
    for (const line of FAULT_LINES) expect(narration).not.toContain(line);
  });
});

test.describe("the page under ordinary clumsiness", () => {
  test("a double-click on a doorway walks you through once, not there and back", async ({ page }) => {
    // `arrive_facing` puts the doorway you came through under the very pixel
    // you just clicked, so the second click of a double-click landed in it
    // and returned you — behind a veil you never saw past, with two arrival
    // lines in the log and no sign anything had happened.
    await page.goto(appUrl());
    await page.keyboard.press("ArrowRight");
    await clickEntity(page, "door1");
    const a = await page.evaluate(() => {
      const A = window.HOLO_APP;
      return window.HOLO.renderer.apertures(
        A.harness.world, A.harness.staging, A.library,
        window.HOLO.renderer.GRID_META, A.harness.viewstate)[0];
    });
    const box = await sceneBox(page);
    const x = box.x + ((a.x + a.w / 2) * box.width) / 1536;
    const y = box.y + ((a.y + a.h / 2) * box.height) / 1024;
    await page.mouse.click(x, y, { clickCount: 2, delay: 15 });
    const s = await state(page);
    expect(s.viewstate, "one click through, one door").toEqual({ location: "hall", facing: "W" });
    const arrivals = await page.evaluate(() =>
      [...document.querySelectorAll("#narration p")]
        .filter((p) => /step through|pass back/.test(p.textContent)).length);
    expect(arrivals, "and one arrival line").toBe(1);
  });

  test("an entity keeps its highlight while you are still pointing at it", async ({ page }) => {
    // paint() cleared the overlay and the cursor unconditionally, so the only
    // thing on screen telling a player anything is touchable vanished at the
    // moment they touched it, and stayed gone until the mouse moved again.
    await page.goto(appUrl());
    const box = await sceneBox(page);
    const pt = await page.evaluate(() => window.__T.clickPoint("desk1"));
    const x = box.x + (pt.x * box.width) / 1536;
    const y = box.y + (pt.y * box.height) / 1024;
    await page.mouse.move(x, y);
    expect(await page.evaluate(() => window.__T.isOverlayBlank())).toBe(false);
    await page.mouse.click(x, y); // opens the drawer — a real repaint
    const after = await page.evaluate(() => ({
      blank: window.__T.isOverlayBlank(),
      cursor: document.getElementById("scene").style.cursor
    }));
    expect(after.blank, "still highlighted, because the cursor has not moved").toBe(false);
    expect(after.cursor).toBe("pointer");
  });

  test("a tap leaves no halo behind it", async ({ browser }) => {
    // Driven by REAL touch input, not hand-built events: the browser's own
    // order on a touch device is pointerdown → pointerup → mousemove →
    // mousedown → mouseup → click, and the compatibility mousemove arrives
    // after any clear done on pointerup. A synthetic sequence in a
    // convenient order made this green while every tap on a real phone left
    // a permanent glowing outline around the last thing touched.
    const ctx = await equipContext(await browser.newContext({
      hasTouch: true, viewport: { width: 390, height: 844 }
    }));
    const p = await ctx.newPage();
    await p.goto(appUrl());
    await p.waitForFunction(() => !!window.HOLO_APP);
    const box = await p.locator("#scene").boundingBox();
    const pt = await p.evaluate(() => window.__T.clickPoint("chair1"));
    await p.touchscreen.tap(
      box.x + (pt.x * box.width) / 1536,
      box.y + (pt.y * box.height) / 1024);
    await p.waitForTimeout(150);
    expect(await p.evaluate(() => window.__T.isOverlayBlank()),
      "no halo immediately after a tap").toBe(true);
    await p.waitForTimeout(1200);
    expect(await p.evaluate(() => window.__T.isOverlayBlank()),
      "and none a second later either").toBe(true);
    await ctx.close();
  });

  test("drawing the highlight does not stall the page", async ({ page }) => {
    // Full-frame scratch canvases put this at ~93 ms per pointer sample —
    // the page dropped to ~10 fps whenever the cursor was over anything.
    await page.goto(appUrl());
    const box = await sceneBox(page);
    const pt = await page.evaluate(() => window.__T.clickPoint("desk1"));
    const x = box.x + (pt.x * box.width) / 1536;
    const y = box.y + (pt.y * box.height) / 1024;
    const worst = await page.evaluate(({ x, y }) => {
      const el = document.getElementById("scene");
      let worst = 0;
      for (let i = 0; i < 12; i++) {
        const t0 = performance.now();
        el.dispatchEvent(new MouseEvent("mousemove",
          { clientX: x + (i % 2), clientY: y, bubbles: true }));
        const dt = performance.now() - t0;
        if (dt > worst) worst = dt;
      }
      return worst;
    }, { x, y });
    // Generous: the bounded version measures ~1–3 ms, the full-frame one 90+.
    expect(worst, `worst mousemove ${worst.toFixed(1)}ms`).toBeLessThan(40);
  });

  test("the newest line of prose is readable from its first word", async ({ page }) => {
    // The pane auto-scrolled to its own bottom, which shears the top off any
    // message taller than the box — and the narration IS the product voice.
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto(appUrl());
    await page.evaluate(() => window.HOLO_APP.dispatch({ type: "take", entity: "stick1" }));
    const res = await page.evaluate(() => {
      const pane = document.getElementById("narration");
      const ps = pane.querySelectorAll("p");
      const p = ps[ps.length - 1];
      return {
        top: p.offsetTop - pane.offsetTop - pane.scrollTop,
        text: p.textContent
      };
    });
    expect(res.text.length, "a long line, the case that clips").toBeGreaterThan(40);
    expect(res.top, "the first line of the newest message is inside the pane")
      .toBeGreaterThanOrEqual(0);
  });
});

test.describe("the stage never disappears and never scrolls", () => {
  const sizes = [
    { name: "phone portrait 390×844", width: 390, height: 844, scroll: false },
    { name: "phone landscape 750×342", width: 750, height: 342, scroll: false },
    { name: "tablet 820×1180", width: 820, height: 1180, scroll: false },
    { name: "desktop 1920×1080", width: 1920, height: 1080, scroll: false },
    // Degenerate: the contain-fit calc goes to zero here. Something must
    // still be on screen, even if the page has to scroll for it.
    { name: "sliver 900×140", width: 900, height: 140, scroll: true }
  ];
  for (const s of sizes) {
    test(s.name, async ({ page }) => {
      await page.setViewportSize({ width: s.width, height: s.height });
      await page.goto(appUrl());
      await page.waitForFunction(() => !!window.HOLO_APP);
      const box = await page.locator("#scene").boundingBox();
      expect(box.width, "the scene has a size").toBeGreaterThan(0);
      expect(box.height).toBeGreaterThan(0);
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollHeight - window.innerHeight);
      if (s.scroll) {
        expect(box.width, "and something is visible").toBeGreaterThanOrEqual(100);
      } else {
        expect(overflow, `${s.name}: the page must not scroll`).toBeLessThanOrEqual(1);
      }
    });
  }
});

test.describe("travelling twice on purpose is not the same as travelling twice by accident", () => {
  test("walk in, look back, walk out — the second passage is not swallowed", async ({ page }) => {
    // The first guard against an accidental double-click was a blanket
    // half-second lock on the only way between rooms, cleared by nothing.
    // Walking in and straight back out is a real thing to do, and it was
    // dropped without an envelope, without a refusal line and without a
    // repaint — a well-formed intent discarded by chrome state.
    await page.goto(appUrl());
    await page.keyboard.press("ArrowRight");
    await clickEntity(page, "door1");
    await clickDoorway(page);
    let s = await state(page);
    expect(s.viewstate).toEqual({ location: "hall", facing: "W" });
    const envelopes = s.envelopes;
    // A turn — any intent — ends the double-click window immediately.
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowLeft");
    await clickDoorway(page);
    s = await state(page);
    expect(s.viewstate, "the way back is not locked").toEqual({ location: "study", facing: "E" });
    expect(s.envelopes, "and every input produced an envelope")
      .toBe(envelopes + 3);
  });

  test("a second passage after the double-click window is honoured", async ({ page }) => {
    await page.goto(appUrl());
    await page.keyboard.press("ArrowRight");
    await clickEntity(page, "door1");
    await clickDoorway(page);
    await page.waitForTimeout(500);
    await clickDoorway(page);
    const s = await state(page);
    expect(s.viewstate).toEqual({ location: "study", facing: "E" });
  });
});

test.describe("a page that has faulted stops pretending", () => {
  test("one apology, and the controls withdraw", async ({ page }) => {
    // The fault line was appended per repaint attempt: six arrow presses at
    // a broken page produced six more copies of the same sentence, with the
    // chevrons still lit and inviting.
    await page.goto(appUrl());
    await page.evaluate(() => { delete window.HOLO_APP.library["chair-joined"]; });
    for (let i = 0; i < 6; i++) await page.keyboard.press("ArrowRight");
    const res = await page.evaluate(() => ({
      lines: [...document.querySelectorAll("#narration p")].map((p) => p.textContent),
      leftShown: getComputedStyle(document.getElementById("chevron-left")).display,
      rightShown: getComputedStyle(document.getElementById("chevron-right")).display
    }));
    const faults = res.lines.filter(
      (l) => l === "The projection wavers; the pattern will not resolve.");
    expect(faults.length, "said once, not once per keypress").toBe(1);
    expect(res.leftShown, "and the controls withdraw").toBe("none");
    expect(res.rightShown).toBe("none");
  });
});

test.describe("the product's voice is legible where it speaks", () => {
  const widths = [
    { name: "phone 390×844", width: 390, height: 844 },
    { name: "phone landscape 750×342", width: 750, height: 342 },
    { name: "laptop 1366×768", width: 1366, height: 768 }
  ];
  for (const vp of widths) {
    test(`${vp.name}: the newest line is whole and starts at the top of the pane`, async ({ page }) => {
      // The pane auto-scrolled to its own bottom and was a row and a half
      // tall, so it permanently showed one message plus a horizontally
      // sliced fragment of the previous one, ascenders cut mid-glyph. The
      // narration is the only thing in this product that speaks to a player.
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(appUrl());
      await page.waitForFunction(() => !!window.HOLO_APP);
      // The longest authored line in the fixture, whatever it is.
      const worst = await page.evaluate(() => {
        const lines = window.HOLO_FIXTURE.narration.lines;
        let best = null;
        for (const k of Object.keys(lines)) {
          if (!best || lines[k].length > lines[best].length) best = k;
        }
        return { key: best, text: lines[best] };
      });
      await page.evaluate((t) => {
        const pane = document.getElementById("narration");
        for (let i = 0; i < 4; i++) {
          const p = document.createElement("p");
          p.textContent = t;
          pane.appendChild(p);
          pane.scrollTop = p.offsetTop - pane.offsetTop;
        }
      }, worst.text);
      const geo = await page.evaluate(() => {
        const pane = document.getElementById("narration");
        const ps = pane.querySelectorAll("p");
        const p = ps[ps.length - 1];
        return {
          top: p.offsetTop - pane.offsetTop - pane.scrollTop,
          height: p.offsetHeight,
          pane: pane.clientHeight
        };
      });
      expect(geo.top, `${vp.name}: no sliced row above the newest line`).toBe(0);
      expect(geo.height, `${vp.name}: the newest message (${geo.height}px) fits the pane (${geo.pane}px)`)
        .toBeLessThanOrEqual(geo.pane);
    });
  }

  test("inventory tiles carry an accessible name, not only a hover title", async ({ page }) => {
    // A canvas has no text content, and on touch there is no hover, so a
    // `title` attribute names the tile to nobody who is not using a mouse.
    await page.goto(appUrl());
    await page.evaluate(() => {
      const A = window.HOLO_APP;
      A.dispatch({ type: "toggle", entity: "desk1" });
      A.dispatch({ type: "take", entity: "key1" });
      A.dispatch({ type: "take", entity: "note1" });
    });
    const tiles = await page.evaluate(() =>
      [...document.querySelectorAll("#inventory canvas.inv-tile")].map((t) => ({
        entity: t.getAttribute("data-entity"),
        label: t.getAttribute("aria-label"),
        role: t.getAttribute("role")
      })));
    expect(tiles.length).toBe(2);
    for (const t of tiles) {
      expect(t.role).toBe("img");
      expect(typeof t.label).toBe("string");
      expect(t.label.length, `${t.entity} is named`).toBeGreaterThan(3);
      // Product speech: the record's noun, never the entity id.
      expect(t.label).not.toBe(t.entity);
      expect(t.label).not.toMatch(/\d/);
    }
  });
});
