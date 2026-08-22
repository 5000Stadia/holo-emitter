/* §12.1 — the scripted walkthrough, through real pointer/keyboard events
 * only, with documented assertions after every step; §12.4's zero-frames
 * woven through it; §12.2 clause 2 (the whole script replayed → identical
 * hash sequence). The input-event sequence is pinned by the plan — turns
 * included — because the replay makes the exact sequence load-bearing.
 *
 * Click coords come from the app's own layout/hitTest (in-page clickPoint),
 * EXCEPT the chair-refusal click, whose point is derived by test-side
 * independent arithmetic (helpers MF — the facing's own §5 literals — plus
 * record data) and
 * verified against both solo-render alpha masks — one real click that
 * witnesses front-to-back hit resolution at a deliberately staged overlap
 * pixel.
 */
import {
  test, expect, appUrl, POINTER_VIEWPORT, MF, stageTree, removeTree, equipContext, bake
} from "./helpers.mjs";
import { rmSync, readFileSync, writeFileSync } from "node:fs";
import { projectPlacement, deriveMeta } from "../../tools/plan-projection.mjs";
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
    /* Move back over the desk, then turn with the cursor stationary: the
       overlay must be blank after the paint (stale-outline hazard).
       The point has to be one that is BARE on the facing turned to, or the
       overlay is legitimately not blank and the test measures the wrong
       thing. Row 11 moved the desk east along the north wall and its first
       hit point landed inside the study/E door leaf's rectangle, so the point
       is now chosen clear of it — which is a fact about where the door hangs,
       not about the desk, so it is derived rather than typed. */
    const barePt = await page.evaluate(() => {
      const A = window.HOLO_APP;
      const layout = window.__T.currentLayout();
      const desk = layout.find((e) => e.id === "desk1");
      const b = window.__T.entryBBox(desk);
      const leaf = window.HOLO.renderer.apertures(
        A.harness.world, A.harness.staging, A.library,
        window.__T.metaOf({ location: "study", facing: "E" }),
        { location: "study", facing: "E" })[0];
      for (let dx = Math.floor(b.w) - 2; dx > 0; dx -= 2) {
        for (let dy = 2; dy < b.h; dy += 2) {
          const x = Math.floor(b.x + dx), y = Math.floor(b.y + dy);
          if (leaf && x >= leaf.x - 8 && x <= leaf.x + leaf.w + 8) continue;
          if (window.HOLO.renderer.hitTest(layout, A.library, x, y) === "desk1") return { x, y };
        }
      }
      return null;
    });
    expect(barePt, "a desk point clear of the next facing's doorway").not.toBeNull();
    await page.mouse.move(
      box.x + (barePt.x * box.width) / 1536,
      box.y + (barePt.y * box.height) / 1024);
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
      const M = MF("study", "N");
      const chairP = M.place(recs.staging.chair1, recs.chair);
      const deskP = M.place(recs.staging.desk1, recs.desk);
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

  // Two references captured BEFORE the passage, so what follows cannot be
  // satisfied by a renderer that is merely self-consistent with whatever the
  // live world holds after crossing (a state reset during `go` would still
  // agree with itself under a same-run re-render). `studyDoorOpenHash` is
  // the room about to be left, captured live; `hallPreTravelWorld` is a
  // frozen snapshot of the world at this instant, rendered independently
  // once the door's own facing is reached on the far side.
  let studyDoorOpenHash = null;
  let hallPreTravelWorld = null;
  if (opts.assertions) {
    studyDoorOpenHash = (await state(page)).hash;
    hallPreTravelWorld = await page.evaluate(
      () => window.__T.clone(window.HOLO_APP.harness.world));
  }

  await clickDoorway(page); // the opening is the `go` target
  await note();
  if (opts.assertions) {
    const s = await state(page);
    // Passage maintains orientation (blueprint §3): walking east through the
    // door lands you still facing east — the direction of travel — not
    // turned about to face the door you came through.
    expect(s.viewstate).toEqual({ location: "hall", facing: "E" });
    expect(s.lastEnvelope.intent).toEqual({ type: "go", exit: "door_study_hall" });
    expect(s.lastNarrationLine).toBe(s.lastEnvelope.narration); // arrival class
    // The arrival picture is not merely claimed by the viewstate string: it
    // is independently constructed — a literal viewstate, not read back off
    // the live harness — and must match what is actually on screen.
    const independentHallE = await page.evaluate(async () => {
      const h = window.HOLO_APP.harness;
      return await window.__T.hashCanvas(
        window.__T.renderW(h.world, h.staging, { location: "hall", facing: "E" }, {}));
    });
    expect(s.hash).toBe(independentHallE);
  }

  // Look back (E → S → W) to face the door: persistence is checked by
  // deliberately turning to the door's own facing and comparing against the
  // pre-passage snapshot taken above — never against a re-render of the
  // live (possibly-reset) world, which would only prove the renderer agrees
  // with itself.
  await page.keyboard.press("ArrowRight");
  await note();
  await page.keyboard.press("ArrowRight");
  await note();
  if (opts.assertions) {
    const s = await state(page);
    expect(s.viewstate).toEqual({ location: "hall", facing: "W" });
    const predictedOpenHash = await page.evaluate(async (w) => {
      const h = window.HOLO_APP.harness;
      return await window.__T.hashCanvas(
        window.__T.renderW(w, h.staging, { location: "hall", facing: "W" }, {}));
    }, hallPreTravelWorld);
    expect(s.hash, "the door survived the passage, checked against its pre-passage state")
      .toBe(predictedOpenHash);
    const closedHash = await page.evaluate(async (w) => {
      const h = window.HOLO_APP.harness;
      const c = window.__T.clone(w);
      c.entities.find((e) => e.id === "door1").state = "closed";
      return await window.__T.hashCanvas(
        window.__T.renderW(c, h.staging, { location: "hall", facing: "W" }, {}));
    }, hallPreTravelWorld);
    expect(s.hash, "and is visibly distinct from a closed one").not.toBe(closedHash);
  }

  /* Two right CHEVRON clicks (W→N→E) — §12.1's own letter includes chevron
     clicks, and row 20 moved the passage's furniture to its east end wall:
     under the ruled lens the passage is 2.60 m deep and its long facings show
     no floor at all, so nothing can stand on them. */
  await page.click("#chevron-right");
  await note();
  await page.click("#chevron-right");
  await note();
  if (opts.assertions) {
    const s = await state(page);
    expect(s.viewstate).toEqual({ location: "hall", facing: "E" });
  }

  // take coin
  await clickEntity(page, "coin1");
  await note();
  if (opts.assertions) {
    const s = await state(page);
    expect(s.inventory).toEqual(["key1", "coin1"]);
    // The scene-side half witnessed too: post-take hall/E equals the
    // same-run coin1-deleted render (the unclipped on-relation removal).
    expect(s.hash).toBe(await doctoredHash(page, ["coin1"]));
  }

  // back to W (E → N → W, two steps since the furniture moved to hall/E);
  // go through the still-open door
  await page.keyboard.press("ArrowLeft");
  await note();
  await page.keyboard.press("ArrowLeft");
  await note();
  await clickDoorway(page);
  await note();
  if (opts.assertions) {
    const s = await state(page);
    // Passage maintains orientation the other way too: walking west through
    // the door lands you facing west, not turned about to face it.
    expect(s.viewstate).toEqual({ location: "study", facing: "W" });
    expect(s.world.door, "door still open — persistence").toBe("open");
    // As on the outbound leg: the arrival picture is independently
    // constructed, not merely read back off the live viewstate.
    const independentStudyW = await page.evaluate(async () => {
      const h = window.HOLO_APP.harness;
      return await window.__T.hashCanvas(
        window.__T.renderW(h.world, h.staging, { location: "study", facing: "W" }, {}));
    });
    expect(s.hash).toBe(independentStudyW);
  }

  // Look back (W → N → E) to face the door and see it standing open — the
  // strongest form of the persistence check available: the exact frame
  // stood in before ever leaving, captured live, compared to what is seen
  // now, in the same room and the same facing.
  await page.keyboard.press("ArrowRight");
  await note();
  await page.keyboard.press("ArrowRight");
  await note();
  if (opts.assertions) {
    const s = await state(page);
    expect(s.viewstate).toEqual({ location: "study", facing: "E" });
    expect(s.hash, "the room you left is exactly the room you return to")
      .toBe(studyDoorOpenHash);
    const closedHash = await page.evaluate(async () => {
      const h = window.HOLO_APP.harness;
      const w = window.__T.clone(h.world);
      w.entities.find((e) => e.id === "door1").state = "closed";
      return await window.__T.hashCanvas(
        window.__T.renderW(w, h.staging, h.viewstate, {}));
    });
    expect(s.hash, "and is visibly distinct from a closed one").not.toBe(closedHash);
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
        window.__T.metaOf(A.harness.viewstate), A.harness.viewstate)[0];
    });
    expect(a, "the facing has a doorway").toBeTruthy();
    // Dead centre of the opening — no searching, no help.
    await clickCanvasPoint(page, { x: a.x + a.w / 2, y: a.y + a.h / 2 });
    const s = await state(page);
    expect(s.viewstate).toEqual({ location: "hall", facing: "E" });
    expect(s.lastEnvelope.intent).toEqual({ type: "go", exit: "door_study_hall" });
  });

  test("clicking the opening of a SHUT door toggles it, and never travels", async ({ page }) => {
    await page.goto(appUrl());
    await page.keyboard.press("ArrowRight");
    const a = await page.evaluate(() => {
      const A = window.HOLO_APP;
      return window.HOLO.renderer.apertures(
        A.harness.world, A.harness.staging, A.library,
        window.__T.metaOf(A.harness.viewstate), A.harness.viewstate)[0];
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
        window.__T.metaOf(A.harness.viewstate), A.harness.viewstate)[0];
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
        window.__T.metaOf(A.harness.viewstate), A.harness.viewstate)[0];
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
        window.__T.metaOf(A.harness.viewstate), A.harness.viewstate)[0];
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
        window.__T.metaOf(A.harness.viewstate), A.harness.viewstate)[0];
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
    const narration = await page.locator("#narration").innerText();
    for (const line of FAULT_LINES) expect(narration).not.toContain(line);
    expect(narration, "nor the boot-viewstate fault line").not.toContain(
      "The projection was set to a view this pattern does not hold.");
    // The pane boots empty on a healthy load — the old assert only checked a
    // string it no longer shows, and would have passed over any wording.
    expect(narration.trim(), "a healthy pane says nothing until the player acts").toBe("");
  });
});

test.describe("the page under ordinary clumsiness", () => {
  test("a double-click on a doorway walks you through once, not there and back", async ({ page }) => {
    // Before row 13, `arrive_facing` turned the player to face back at the
    // very doorway they had just come through, so the second click of a
    // real double-click landed on that SAME doorway and returned you —
    // behind a veil you never saw past, with two arrival lines in the log
    // and no sign anything had happened; the 400ms echo window in
    // index.html guards it. Passage now maintains orientation (blueprint
    // §3): the player arrives facing the direction of travel, away from the
    // door, so on THIS two-room fixture the second click's screen
    // coordinates fall on bare wall — that specific same-doorway coincidence
    // cannot arise here any more, and this test still protects the outcome
    // (one click through a doorway is one passage, never two) whether it is
    // the window or dead space doing the protecting. The window's broader
    // job — a DIFFERENT doorway landing under that second click, which a
    // corridor makes possible — is a separate risk this two-room fixture
    // cannot construct; see "the double-click guard against a corridor's
    // aligned doorway" below for that case, driven against a doctored world.
    await page.goto(appUrl());
    await page.keyboard.press("ArrowRight");
    await clickEntity(page, "door1");
    const a = await page.evaluate(() => {
      const A = window.HOLO_APP;
      return window.HOLO.renderer.apertures(
        A.harness.world, A.harness.staging, A.library,
        window.__T.metaOf(A.harness.viewstate), A.harness.viewstate)[0];
    });
    const box = await sceneBox(page);
    const x = box.x + ((a.x + a.w / 2) * box.width) / 1536;
    const y = box.y + ((a.y + a.h / 2) * box.height) / 1024;
    await page.mouse.click(x, y, { clickCount: 2, delay: 15 });
    const s = await state(page);
    expect(s.viewstate, "one click through, one door").toEqual({ location: "hall", facing: "E" });
    // Counted against the fixture's own two arrival lines, not a guessed
    // prose fragment — the check must not depend on how either line is
    // worded, only on how many times either fired.
    const arrivals = await page.evaluate(() => {
      const lines = new Set([
        window.HOLO_FIXTURE.narration.lines["go.door_study_hall.arrive"],
        window.HOLO_FIXTURE.narration.lines["go.door_hall_study.arrive"]
      ]);
      return [...document.querySelectorAll("#narration p")]
        .filter((p) => lines.has(p.textContent)).length;
    });
    expect(arrivals, "and one arrival line").toBe(1);
  });

  /* The double-click guard's real, still-current job: a corridor whose next
   * room's own door sits on the facing you arrive with — exactly what
   * "continues the direction of travel" produces one hop later — puts a
   * DIFFERENT doorway under a real double-click's second click. M0's own
   * two-room fixture cannot construct this (neither room has a second exit),
   * so this is a doctored third room, chained off the shipped hall, built
   * directly against the real page through a real double-click — never the
   * harness API, since the defect this proves against is in index.html's
   * pointer resolution, not in the harness. */
  /* Builds a scratch tree carrying demo-study's own fixture (chair1/desk1/
   * stick1/shelf1 already present and overlapping, so the validator's
   * hardcoded named-overlap-pair check passes without extra scaffolding)
   * plus a third room, "gallery," chained off the hall on the SAME facing
   * (E) the study exit uses — the geometry that puts a second, different
   * doorway under a double-click's second click. door1 is forced open so
   * the very first click of a double-click is `go`, not a toggle. */
  function buildCorridorFixture(root) {
    const fdir = join(root, "fixtures", "demo-study");
    const world = JSON.parse(readFileSync(join(fdir, "world.json"), "utf8"));
    const staging = JSON.parse(readFileSync(join(fdir, "staging.json"), "utf8"));
    const narration = JSON.parse(readFileSync(join(fdir, "narration.json"), "utf8"));

    const hall = world.locations.find((l) => l.id === "hall");
    hall.exits.push({ id: "door_hall_gallery", from: "hall", facing: "E",
      to: "gallery", arrive_facing: "E", via: "door2" });
    world.locations.push({ id: "gallery", facings: ["N", "E", "S", "W"],
      exits: [{ id: "door_gallery_hall", from: "gallery", facing: "W",
        to: "hall", arrive_facing: "W", via: "door2" }] });
    world.entities.push({ id: "door2", sprite: "door-plank", location: "hall",
      states: ["closed", "open"], state: "open", transition: true });
    world.knowledge.player.push("door2");
    world.entities.find((e) => e.id === "door1").state = "open";

    /* ALIGNED, deliberately, which is the whole point of the fixture: the
       gallery door has to sit under the same screen x as the study door, so
       that the second click of a double-click resolves to a DIFFERENT
       doorway.

       ROW 20 made that alignment impossible where row 11 left it, and the
       reason is the lens. The study's east wall is 4.80 m and the passage's
       west wall 2.60 m; under the pinned scale both drew at 96 px/m and the
       study's door at u 0.729 sat at x 874, comfortably inside the passage's
       249 px of wall. Under the pinned lens the study's wall draws at 250 px/m
       and the passage's end wall at 171 px/m, so the study's door centre moves
       to x 1043 while the passage's whole wall ends at x 990: no `u` on the
       arrival facing can put a doorway under that point.

       So the fixture moves the SHARED OPENING south in the plan — to the
       southernmost 1.00 m both rooms' walls share — and re-derives both of
       door1's `u` values from the plan through the shipped projection, which
       is what keeps the bake's staging-equals-projection check satisfied. The
       gallery door is then placed at the study door's own aperture centre. All
       of it computed, none of it typed: a literal here would be a fact about
       one camera, which is exactly what row 20 is removing from this project. */
    const plan = JSON.parse(readFileSync(join(fdir, "plan.json"), "utf8"));
    const opening = plan.openings.find((o) => o.entity === "door1");
    opening.rect = { ...opening.rect, y0: 11.2, y1: 12.2 };
    writeFileSync(join(fdir, "plan.json"), JSON.stringify(plan, null, 2) + "\n");

    const uStudy = projectPlacement(plan, "door1", "study", "E").u;
    const uHall = projectPlacement(plan, "door1", "hall", "W").u;
    staging.placements.door1 = [
      { facing: "study/E", attachment: "wall_mounted", u: uStudy, v: 0.0 },
      { facing: "hall/W", attachment: "wall_mounted", u: uHall, v: 0.0 }
    ];

    /* Where the study's doorway centre lands in pixels, and the `u` on the
       arrival facing that puts the gallery's doorway centre at the same x. */
    const mStudyE = deriveMeta(plan, "study", "E");
    const mHallE = deriveMeta(plan, "hall", "E");
    const doorX = 1536 / 2 + (uStudy - 0.5) * mStudyE.wall_width_m * mStudyE.px_per_m_at_wall;
    const u2 = 0.5 + (doorX - 1536 / 2) / (mHallE.wall_width_m * mHallE.px_per_m_at_wall);
    staging.placements.door2 = [
      { facing: "hall/E", attachment: "wall_mounted", u: u2, v: 0.0 },
      { facing: "gallery/W", attachment: "wall_mounted", u: 0.5, v: 0.0 }
    ];

    Object.assign(narration.lines, {
      "toggle.door2.open": "The second door swings wide.",
      "toggle.door2.closed": "The second door falls shut.",
      "toggle.door2.refused_unreachable": "The second door will not answer from here.",
      "take.door2.refused_fixed": "The second door hangs on its hinges, and there it stays.",
      "go.door_hall_gallery.arrive": "You cross into the gallery beyond.",
      "go.door_hall_gallery.refused_closed": "The gallery door is shut against you.",
      "go.door_hall_gallery.refused_unreachable": "The way to the gallery does not open from here.",
      "go.door_gallery_hall.arrive": "You come back into the hall.",
      "go.door_gallery_hall.refused_closed": "The way back to the hall is shut.",
      "go.door_gallery_hall.refused_unreachable": "The way to the hall is not before you."
    });

    writeFileSync(join(fdir, "world.json"), JSON.stringify(world, null, 2) + "\n");
    writeFileSync(join(fdir, "staging.json"), JSON.stringify(staging, null, 2) + "\n");
    writeFileSync(join(fdir, "narration.json"), JSON.stringify(narration, null, 2) + "\n");
    bake(root, ["--fixture-dir", fdir]);
  }

  test("the double-click guard against a corridor's aligned doorway", async ({ page }) => {
    const root = stageTree();
    try {
      buildCorridorFixture(root);

      await page.goto(appUrl(root));
      await page.waitForFunction(() => !!window.HOLO_APP);
      await page.keyboard.press("ArrowRight"); // study/E, door1 already open
      const a = await page.evaluate(() => {
        const A = window.HOLO_APP;
        return window.HOLO.renderer.apertures(
          A.harness.world, A.harness.staging, A.library,
          window.__T.metaOf(A.harness.viewstate), A.harness.viewstate)[0];
      });
      const box = await sceneBox(page);
      const x = box.x + ((a.x + a.w / 2) * box.width) / 1536;
      const y = box.y + ((a.y + a.h / 2) * box.height) / 1024;

      // The real gesture: one double-click at one screen point. Without the
      // guard, this walks study -> hall -> gallery in a single click pair,
      // the hall never seen, behind a veil never lifted on it.
      /* The point must be a doorway in BOTH rooms, or the test would pass on
         a click that means nothing rather than on the guard. */
      const insideBoth = await page.evaluate((px) => {
        const A = window.HOLO_APP;
        const here = window.HOLO.renderer.apertures(
          A.harness.world, A.harness.staging, A.library,
          window.__T.metaOf({ location: "hall", facing: "E" }),
          { location: "hall", facing: "E" })[0];
        return here && px >= here.x && px <= here.x + here.w;
      }, a.x + a.w / 2);
      expect(insideBoth, "the same screen point is a doorway in the next room too").toBe(true);

      await page.mouse.click(x, y, { clickCount: 2, delay: 15 });
      let s = await page.evaluate(() => window.HOLO_APP.harness.viewstate);
      expect(s, "the second click is swallowed: one door, one room")
        .toEqual({ location: "hall", facing: "E" });

      // Past the window, the SAME screen point now genuinely means "the
      // gallery's own door" (door2, aligned by the corridor's own geometry),
      // and a fresh click there must be honoured, not eaten forever.
      await page.waitForTimeout(500);
      await page.mouse.click(x, y);
      s = await page.evaluate(() => window.HOLO_APP.harness.viewstate);
      expect(s, "a deliberate later click on the next door is not swallowed")
        .toEqual({ location: "gallery", facing: "E" });
    } finally {
      removeTree(root);
    }
  });

  /* The OTHER half of the guard, uncovered by the test above: clearing
   * `lastGo` on any non-doorway click. Without it, a deliberate click on
   * bare space between two doorway clicks does not end the window — the
   * NEXT doorway click, even a real, separate gesture well inside 400ms of
   * the FIRST `go`, would be swallowed as if it were the echo of a
   * double-click that never happened. */
  test("a click on bare space between two doorway clicks clears the guard, so the next doorway click is honoured", async ({ page }) => {
    const root = stageTree();
    try {
      buildCorridorFixture(root);

      await page.goto(appUrl(root));
      await page.waitForFunction(() => !!window.HOLO_APP);
      await page.keyboard.press("ArrowRight"); // study/E, door1 already open
      const box = await sceneBox(page);

      const a1 = await page.evaluate(() => {
        const A = window.HOLO_APP;
        return window.HOLO.renderer.apertures(
          A.harness.world, A.harness.staging, A.library,
          window.__T.metaOf(A.harness.viewstate), A.harness.viewstate)[0];
      });
      await page.mouse.click(
        box.x + ((a1.x + a1.w / 2) * box.width) / 1536,
        box.y + ((a1.y + a1.h / 2) * box.height) / 1024);
      let s = await page.evaluate(() => window.HOLO_APP.harness.viewstate);
      expect(s, "single click through: study -> hall").toEqual({ location: "hall", facing: "E" });

      // A deliberate click on bare space — corner of the frame, well clear
      // of anything drawn — between the first go and the second doorway
      // click, still inside the 400ms window.
      await page.mouse.click(box.x + 20, box.y + 20);
      await page.waitForTimeout(120);

      // The gallery's own door sits on THIS facing too (the corridor's
      // aligned geometry) — a deliberate, separate click on it, ~120ms
      // after the first `go`, well inside the window if nothing cleared it.
      const a2 = await page.evaluate(() => {
        const A = window.HOLO_APP;
        return window.HOLO.renderer.apertures(
          A.harness.world, A.harness.staging, A.library,
          window.__T.metaOf(A.harness.viewstate), A.harness.viewstate)[0];
      });
      await page.mouse.click(
        box.x + ((a2.x + a2.w / 2) * box.width) / 1536,
        box.y + ((a2.y + a2.h / 2) * box.height) / 1024);
      s = await page.evaluate(() => window.HOLO_APP.harness.viewstate);
      expect(s, "the bare-space click cleared the window: this doorway click is real, not an echo")
        .toEqual({ location: "gallery", facing: "E" });
    } finally {
      removeTree(root);
    }
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

test.describe("crossing a door more than once in a row", () => {
  test("walk in, look back, walk out", async ({ page }) => {
    // No timing guard sits between one passage and the next (row 13 deleted
    // the last one — a double-click echo window that pre-row-13 arrival
    // facing had made necessary and that this orientation fix made
    // permanently unreachable; see the double-click test above). Every
    // input here must still produce an envelope: an earlier defect was a
    // blanket half-second lock on the only way between rooms, cleared by
    // nothing, that silently dropped the return passage — no envelope, no
    // refusal line, no repaint. Walking in and straight back out is a real
    // thing to do, and nothing may eat it.
    await page.goto(appUrl());
    await page.keyboard.press("ArrowRight");
    await clickEntity(page, "door1");
    await clickDoorway(page);
    let s = await state(page);
    // Arrives facing the direction of travel, away from the door.
    expect(s.viewstate).toEqual({ location: "hall", facing: "E" });
    const envelopes = s.envelopes;
    // Look back and walk out.
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await clickDoorway(page);
    s = await state(page);
    expect(s.viewstate, "the way back is not locked").toEqual({ location: "study", facing: "W" });
    expect(s.envelopes, "and every input produced an envelope")
      .toBe(envelopes + 3);
  });

  test("a third passage right after the second succeeds too", async ({ page }) => {
    // Crossing back and forth repeatedly, back-to-back with no pause, must
    // keep working — there is nothing left that could accumulate state
    // across passages and start refusing or misrouting the next one.
    await page.goto(appUrl());
    await page.keyboard.press("ArrowRight");
    await clickEntity(page, "door1");
    await clickDoorway(page); // study/E -> hall, arrives facing E
    await page.keyboard.press("ArrowRight"); // look back: E -> S -> W
    await page.keyboard.press("ArrowRight");
    await clickDoorway(page); // hall/W -> study, arrives facing W
    await page.keyboard.press("ArrowRight"); // look back: W -> N -> E
    await page.keyboard.press("ArrowRight");
    await clickDoorway(page); // study/E -> hall, arrives facing E
    const s = await state(page);
    expect(s.viewstate).toEqual({ location: "hall", facing: "E" });
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
    test(`${vp.name}: whole lines, newest included, nothing sliced`, async ({ page }) => {
      /* Two ways to lose the only voice this product has, both of which
       * happened: scroll to the pane's bottom and whatever line straddles the
       * top edge is sliced through its ascenders; pin the newest line to the
       * top instead and two thirds of the pane goes blank with the
       * transcript out of reach. The contract is both at once — the newest
       * message whole, the pane filled, and every visible line a whole one. */
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(appUrl());
      await page.waitForFunction(() => !!window.HOLO_APP);
      // Through the shipped path: real refusals, real narration, real scroll.
      await page.evaluate(() => {
        const A = window.HOLO_APP;
        A.dispatch({ type: "take", entity: "stick1" });
        A.dispatch({ type: "toggle", entity: "chair1" });
        A.dispatch({ type: "take", entity: "shelf1" });
        A.dispatch({ type: "toggle", entity: "desk1" });
      });
      const geo = await page.evaluate(() => {
        const pane = document.getElementById("narration");
        const ps = [...pane.querySelectorAll("p")];
        const rows = ps.map((p) => {
          const top = p.offsetTop - pane.offsetTop - pane.scrollTop;
          return { top, bottom: top + p.offsetHeight, h: p.offsetHeight };
        });
        return { rows, pane: pane.clientHeight, count: ps.length };
      });
      expect(geo.count, "there is a transcript").toBeGreaterThanOrEqual(4);
      const last = geo.rows[geo.rows.length - 1];
      expect(last.top, `${vp.name}: the newest message starts inside the pane`)
        .toBeGreaterThanOrEqual(0);
      expect(last.bottom, `${vp.name}: and ends inside it (${last.h}px in ${geo.pane}px)`)
        .toBeLessThanOrEqual(geo.pane + 1);
      // Nothing straddles the top edge — no half-line of type, ever.
      for (const r of geo.rows) {
        const straddles = r.top < 0 && r.bottom > 0;
        expect(straddles, `${vp.name}: a line sliced across the top of the pane`).toBe(false);
      }
      // And the pane is used rather than reserved: it held exactly one line
      // with two thirds blank and the transcript scrolled out of reach, which
      // is the same voice lost by the opposite mistake.
      const visible = geo.rows.filter((r) => r.top >= 0 && r.bottom <= geo.pane + 1);
      expect(visible.length,
        `${vp.name}: ${visible.length} whole lines visible in a ${geo.pane}px pane`)
        .toBeGreaterThanOrEqual(2);
    });
  }

  test("the transcript can be reached without a mouse wheel", async ({ page }) => {
    // The pane scrolls, and on touch that is native; with a keyboard it was
    // unreachable — no tabindex, and Arrow Left/Right are captured globally
    // for turning. The narration is the product's only voice and §12.6 wants
    // the whole transcript readable at the batch.
    await page.goto(appUrl());
    const attrs = await page.evaluate(() => {
      const pane = document.getElementById("narration");
      return {
        tabindex: pane.getAttribute("tabindex"),
        live: pane.getAttribute("aria-live"),
        label: pane.getAttribute("aria-label"),
        scrollable: getComputedStyle(pane).overflowY
      };
    });
    expect(attrs.tabindex, "focusable").toBe("0");
    expect(attrs.live, "and announced when it speaks").toBe("polite");
    expect(typeof attrs.label).toBe("string");
    expect(attrs.scrollable).toBe("auto");
    // Focusable in fact, not only in attribute.
    await page.locator("#narration").focus();
    expect(await page.evaluate(() => document.activeElement.id)).toBe("narration");
  });

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

test.describe("two keyboard affordances, one set of keys", () => {
  test("arrows scroll the transcript when it holds focus, and turn the room otherwise", async ({ page }) => {
    // The transcript became a Tab stop and a keyboard-scrollable region, and
    // Left/Right were captured globally for turning — so a reader moving
    // through the prose turned the room instead.
    await page.goto(appUrl());
    await page.evaluate(() => {
      const A = window.HOLO_APP;
      for (const e of ["chair1", "stick1", "shelf1", "note1"]) {
        A.dispatch({ type: "toggle", entity: e });
      }
    });
    await page.locator("#narration").focus();
    const before = await page.evaluate(() => ({
      facing: window.HOLO_APP.harness.viewstate.facing,
      scroll: document.getElementById("narration").scrollTop
    }));
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowRight");
    const focused = await page.evaluate(() => window.HOLO_APP.harness.viewstate.facing);
    expect(focused, "the room stays put while the transcript has focus").toBe(before.facing);

    // Focus elsewhere and the arrows turn again.
    await page.locator("#scene").click({ position: { x: 5, y: 5 } });
    await page.evaluate(() => document.getElementById("narration").blur());
    await page.keyboard.press("ArrowRight");
    const after = await page.evaluate(() => window.HOLO_APP.harness.viewstate.facing);
    expect(after, "and turn it when the transcript does not").not.toBe(before.facing);
  });

  test("a refusal said twice in a row does not fill the pane twice", async ({ page }) => {
    // §8 requires every refusal to narrate, and every one still does — but a
    // two-line pane filled with one sentence ten times is the product's whole
    // visible voice spent saying nothing new.
    await page.goto(appUrl());
    const res = await page.evaluate(() => {
      const A = window.HOLO_APP;
      const envelopes0 = A.harness.envelopes.length;
      for (let i = 0; i < 6; i++) A.dispatch({ type: "toggle", entity: "chair1" });
      const ps = [...document.querySelectorAll("#narration p")];
      return {
        paragraphs: ps.length,
        text: ps[ps.length - 1].textContent,
        envelopes: A.harness.envelopes.length - envelopes0
      };
    });
    expect(res.envelopes, "every refusal still produced its envelope").toBe(6);
    expect(res.paragraphs, "and one line, not six").toBe(1);
    // Nothing about the repeat reaches the surface: a count in the fiction's
    // voice is a string about the message stream, not about the world.
    expect(res.text, "and it is still just the line").toBe(
      "The chair is joined oak through and through; nothing in it opens or shuts.");
  });

  test("the inventory strip is a named thing", async ({ page }) => {
    await page.goto(appUrl());
    const a = await page.evaluate(() => {
      const el = document.getElementById("inventory");
      return { role: el.getAttribute("role"), label: el.getAttribute("aria-label") };
    });
    expect(a.role).toBe("group");
    expect(typeof a.label).toBe("string");
    expect(a.label.length).toBeGreaterThan(3);
  });
});
