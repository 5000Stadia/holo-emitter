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
  test, expect, appUrl, POINTER_VIEWPORT, MATH
} from "./helpers.mjs";

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
      // Desk contract: stretcher opaque between the legs for bottom 8% rows.
      const deskRowLo = deskP.baselineY - 0.07 * deskP.heightPx;
      const deskRowHi = deskP.baselineY - 1;
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
  await clickEntity(page, "door1"); // open exit door click is a go
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
  await clickEntity(page, "door1");
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
