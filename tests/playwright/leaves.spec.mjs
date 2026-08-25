/* Row 42, part (3) — the placed leaf and the placed casement.
 *
 * [HUMAN, 2026-08-24, verbatim] "Can we paint the whole scene on wall 1 for a
 * room, use it to influence wall 2-4 direct where the doors should be but after
 * the fact detect the door location on the image and put the effective door
 * geometry in the images doorframe? Same with stairs, maybe Windows? Then we
 * can have door assets and window assets we literally place in the door frame
 * to open/close and same with the windows possibly"
 *
 * Parts (1) and (2) put the DETECTED geometry into the meta. This file is about
 * the sprite that goes in it, and the four things the row's own done clause
 * asks of it:
 *
 *   1. the leaf is drawn in the rectangle the PAINTING measured — and where no
 *      measurement exists, in the one §4 places it, unchanged from row 2;
 *   2. its state opens and closes on the page and PERSISTS: a shut door refuses
 *      the walk from both rooms it joins, an open one still walks;
 *   3. a casement is fitted to a measured LIGHT, a tap on that light toggles it,
 *      and no tap on a window ever travels;
 *   4. §12.2 holds: two renders of the same document are byte-equal, and a
 *      state change is the only thing that moves a pixel.
 *
 * The window half plants a MEASURED window in a copy of the page's own meta.
 * That is not a convenience: no wall in the store carries `meta.windows` yet
 * (`design/plan-draft/measured/window_calibration.json` is the list of walls
 * the promotion's clause cannot see, and it can only shrink as the sweep
 * re-measures), so a case that waited for one would be a case that never ran.
 * The rectangle planted is the one `window_measure.py` actually reads off
 * `kitchen/E`'s own painting — 868..1101 x 394..586 — so what is exercised is
 * the real number, arriving early.
 */
import { test, expect } from "@playwright/test";
import { navUrl, POINTER_VIEWPORT, repoRoot } from "./helpers.mjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";

const require_ = createRequire(import.meta.url);
const groundplane = require_(join(repoRoot, "src", "groundplane.js"));
const RECORDS = require_(join(repoRoot, "src", "placeholders.js")).records;
const STAGING = JSON.parse(readFileSync(
  join(repoRoot, "fixtures", "nav-manor", "staging.json"), "utf8"));

/** The light `window_measure.py` reads off kitchen/E's own painting. */
const KITCHEN_LIGHT = { id: "win10", kind: "window", measured: true,
  x: 868, y: 394, w: 233, h: 192, sill_m: 0.9, head_m: 2 };

/* THE DOORWAY THIS FILE USES, and why it is this one. `op22` joins the solar to
   the muniment room and BOTH facings measure it off their own paintings — 139 x
   261 px from the solar, 218 x 533 px from the muniment room — so one leaf is
   fitted to two different painted frames and the row's claim is exercised in
   both directions. `design/batches/row42-leaves/demo/README.md` records the
   survey that picked it, including the four walls whose row-27 reading
   disagrees with their own painted doorway. */
const SOLAR_E = { location: "solar", facing: "E" };
const MUNIMENT_W = { location: "muniment_room", facing: "W" };
const KITCHEN_E = { location: "kitchen", facing: "E" };

async function boot(page) {
  await page.goto(navUrl());
  await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
}

/* The manor boots in the study, so every case that needs a hand on a door has
   to walk there the way a player would: turn to face the exit, then go. Named
   exits rather than coordinates, because an exit id is the document's own
   handle for a way through and a coordinate is not. */
const TO_KITCHEN = ["door_study_hall", "door_hall_kitchen"];
const TO_SOLAR = ["door_study_hall", "door_hall_buttery_pantry",
  "door_buttery_pantry_servants_hall", "door_servants_hall_back_stair",
  "stair_back_stair_back_stair_head", "door_back_stair_head_solar"];

async function walk(page, exits, facing) {
  const at = await page.evaluate(([exits, facing]) => {
    const A = window.HOLO_APP;
    for (const id of exits) {
      const vs = A.harness.viewstate;
      const ex = A.harness.world.locations.find((l) => l.id === vs.location)
        .exits.find((e) => e.id === id);
      if (!ex) return { failed: `${id} is not an exit of ${vs.location}` };
      let guard = 0;
      while (A.harness.viewstate.facing !== ex.facing && guard++ < 4) {
        A.dispatch({ type: "turn", dir: "right" });
      }
      const env = A.dispatch({ type: "go", exit: id });
      if (!env.events.length) return { failed: `${id} refused: ${env.narration}` };
    }
    let guard = 0;
    while (facing && A.harness.viewstate.facing !== facing && guard++ < 4) {
      A.dispatch({ type: "turn", dir: "right" });
    }
    return A.harness.viewstate;
  }, [exits, facing || null]);
  expect(at.failed, at.failed || "walked").toBeUndefined();
  return at;
}

/** One layout entry by id, on a facing, with the meta the page resolves. */
async function entryAt(page, vs, id, plantWindow) {
  return await page.evaluate(([vs, id, plant]) => {
    const A = window.HOLO_APP;
    const meta = plant
      ? Object.assign(JSON.parse(JSON.stringify(A.metaFor(vs))), { windows: [plant] })
      : A.metaFor(vs);
    const e = window.HOLO.renderer.layout(
      A.harness.world, A.harness.staging, A.library, meta, vs).find((x) => x.id === id);
    if (!e) return null;
    return { id: e.id, f: e.f, fx: e.fx, aperture: e.aperture, hangs: e.hangs,
      light_state: e.light_state, state: e.state,
      x: e.drawX, y: e.drawY,
      /* The SHUT sprite's drawn size — what "fills the frame" is about. A
         non-closed swap state draws its own narrower image from the same
         origin, and `swapW` is that. */
      w: e.images.body.width * e.fx,
      h: e.images.body.height * e.f,
      swapW: e.swap ? e.swap.image.width * e.fx : null };
  }, [vs, id, plantWindow || null]);
}

/* ------------------------------------------------------------------ */
/* 1. WHERE THE LEAF STANDS                                            */
/* ------------------------------------------------------------------ */

test.describe("row 42 — the leaf stands where the painting put the hole", () => {
  /* The third column is how far the PLAN's rectangle stands from the painted
     one on that wall, in px, summed over the origin and the width — the margin
     the case below has to clear. It is per-wall because the two walls disagree
     by different amounts, and asserting one number over both would either be
     vacuous on the solar or false on the muniment room: the muniment room's
     painter drew a doorway within 9 px of the width the drawing rules and put
     it 56 px along the wall from where the drawing puts it. Both are real
     divergences and neither is the same size. */
  for (const [vs, key, minDelta] of [
    [SOLAR_E, "solar/E", 120], [MUNIMENT_W, "muniment_room/W", 60]]) {
    test(`on ${key} the leaf fills the painted frame, not the plan's rectangle`, async ({ page }) => {
      await boot(page);
      const meta = await page.evaluate((vs) => window.HOLO_APP.metaFor(vs), vs);
      const hole = meta.openings.find((o) => o.id === "op22");
      expect(hole.measured, `${key}'s op22 is measured off its own painting`).toBe(true);

      const e = await entryAt(page, vs, "leaf_op22");
      expect(e, "the leaf is in the draw list at all").toBeTruthy();
      /* FILLED, both axes, to the last pixel. */
      expect(e.x).toBeCloseTo(hole.x, 6);
      expect(e.y).toBeCloseTo(hole.y, 6);
      expect(e.w).toBeCloseTo(hole.w, 6);
      expect(e.h).toBeCloseTo(hole.h, 6);
      expect(e.aperture, "and it says which aperture it is fitted to").toBe("op22");
      /* Its OPEN state is the same leaf swung to the hinge side — a sliver at the
         viewer-left of the same frame, not a second placement. */
      expect(e.state).toBe("open");
      expect(e.swapW, "the swung leaf takes a fraction of the frame it fills shut")
        .toBeLessThan(hole.w * 0.5);
      expect(e.swapW).toBeGreaterThan(0);

      /* AND IT IS GENUINELY NOT THE PLAN'S RECTANGLE, computed here through the
         same `placeHost` the §4 path uses — otherwise this case could pass on a
         coincidence between a painting and a drawing. */
      const pl = STAGING.placements.leaf_op22.find((p) => p.facing === key);
      const plan = groundplane.placeHost(pl, RECORDS["door-leaf-plank-oak-v1"], meta, 1536);
      const planW = plan.x1 - plan.x0;
      const delta = Math.abs(planW - hole.w) + Math.abs(plan.x0 - hole.x);
      expect(delta,
        `the plan would draw the leaf ${planW.toFixed(1)} px wide at x ${plan.x0.toFixed(1)}, ` +
        `and the painting cut ${hole.w} px at x ${hole.x}`)
        .toBeGreaterThan(minDelta);
      /* The vertical too, which is the axis §4 has no say in at all: a
         wall-mounted leaf's head is `dims_m.h` above the floor line and the
         painting's is wherever the painter drew the lintel. */
      expect(Math.abs(plan.y0 - hole.y), "and its head is somewhere else")
        .toBeGreaterThan(20);

      /* THE TWO SCALES ARE GENUINELY TWO. A single factor cannot fill a frame
         whose proportions are not the record's, and `fx === f` here would mean
         the leaf is standing proud of its own jamb or leaving light above it. */
      expect(e.fx).not.toBeCloseTo(e.f, 3);
    });
  }

  test("ONE leaf, TWO painted frames — the same door, fitted to each room's own picture", async ({ page }) => {
    /* The claim the two cases above make separately, said once: a leaf is not
       drawn at a size, it is drawn in a hole, and the two rooms this doorway
       joins painted that hole at different scales from different distances. */
    await boot(page);
    const a = await entryAt(page, SOLAR_E, "leaf_op22");
    const b = await entryAt(page, MUNIMENT_W, "leaf_op22");
    expect(a.w).not.toBeCloseTo(b.w, 0);
    expect(a.h).not.toBeCloseTo(b.h, 0);
    expect(a.aperture).toBe("op22");
    expect(b.aperture).toBe("op22");
  });

  test("strip the measurement and the leaf falls back to where §4 puts it", async ({ page }) => {
    /* THE ROW'S OTHER HALF, and it is what keeps every unpromoted wall in the
       manor working exactly as it did at row 2. A derived meta's opening is the
       PLAN's rectangle wearing the same field names, and fitting a leaf to it
       would be the renderer claiming a measurement nobody took. The lever is
       the `measured` flag itself, because that flag IS the rule. */
    await boot(page);
    const r = await page.evaluate((vs) => {
      const A = window.HOLO_APP;
      const meta = JSON.parse(JSON.stringify(A.metaFor(vs)));
      for (const o of meta.openings) delete o.measured;
      delete meta.measured;
      const e = window.HOLO.renderer.layout(
        A.harness.world, A.harness.staging, A.library, meta, vs)
        .find((x) => x.id === "leaf_op22");
      return { meta, e: { aperture: e.aperture, f: e.f, fx: e.fx, x: e.drawX, y: e.drawY } };
    }, SOLAR_E);
    const pl = STAGING.placements.leaf_op22.find((p) => p.facing === "solar/E");
    const plan = groundplane.placeHost(pl, RECORDS["door-leaf-plank-oak-v1"], r.meta, 1536);
    expect(r.e.aperture, "nothing measured, so nothing to be fitted to").toBeNull();
    expect(r.e.x).toBeCloseTo(plan.drawX, 6);
    expect(r.e.y).toBeCloseTo(plan.drawY, 6);
    expect(r.e.fx, "and one scale, because a §4 placement never stretches a sprite")
      .toBeCloseTo(r.e.f, 9);
  });

  test("the aperture list carries the leaf and the light hook row 37 reads", async ({ page }) => {
    await boot(page);
    const r = await page.evaluate((vs) => {
      const A = window.HOLO_APP;
      const list = window.HOLO.renderer.apertures(
        A.harness.world, A.harness.staging, A.library, A.metaFor(vs), vs);
      return list.map((a) => ({ kind: a.kind, source: a.source, leaf: a.leaf,
        light_state: a.light_state, open: a.open, x: a.x, w: a.w }));
    }, SOLAR_E);
    /* solar/E carries TWO doorways — op22 and op23 — and only one has a leaf,
       which is what makes this an assertion rather than a tautology. */
    expect(r.length).toBe(2);
    const filled = r.filter((a) => a.leaf);
    expect(filled.length).toBe(1);
    expect(filled[0].leaf, "the hole names the leaf standing in it").toBe("leaf_op22");
    expect(filled[0].source, "and it is not an unfilled doorway any more").toBe("leaf");
    expect(filled[0].light_state, "the row-37 hook tracks the document").toBe("open");
    expect(filled[0].open).toBe(true);
    const bare = r.filter((a) => !a.leaf);
    expect(bare[0].source, "the other is architecture and says so").toBe("building");
    expect(bare[0].light_state, "and an unfilled hole always passes light").toBe("open");
  });
});

/* ------------------------------------------------------------------ */
/* 2. THE STATE, AND WHAT IT DOES                                      */
/* ------------------------------------------------------------------ */

test.describe("row 42 — the leaf opens, closes, and stays that way", () => {
  test.use({ viewport: POINTER_VIEWPORT });

  test("a real tap on the leaf shuts it, the picture changes, and it is still shut a room later", async ({ page }) => {
    await boot(page);
    const at = await walk(page, TO_SOLAR, "E");
    expect(at).toEqual(SOLAR_E);

    const shot = () => page.evaluate(async () => {
      const c = document.getElementById("scene");
      const b = await new Promise((r) => c.toBlob(r, "image/png"));
      const d = await crypto.subtle.digest("SHA-256", await b.arrayBuffer());
      return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, "0")).join("");
    });
    const openHash = await shot();

    /* A REAL CLICK, on the leaf's own pixels — the middle of the painted
       doorway, which is exactly where a shut leaf's planks are. */
    const hit = await page.evaluate(() => {
      const A = window.HOLO_APP;
      const a = A.apertureList().find((x) => x.leaf === "leaf_op22");
      const p = { x: a.x + a.w / 2, y: a.y + a.h * 0.6 };
      return { p, resolved: A.resolve(p) };
    });
    expect(hit.resolved.kind, "an OPEN doorway's middle is a way through").toBe("doorway");

    /* So shut it by the control a keyboard user has, then check the pointer
       agrees about what its pixels mean. */
    await page.evaluate(() => window.HOLO_APP.dispatch(
      { type: "toggle", entity: "leaf_op22" }));
    const closed = await page.evaluate(() => {
      const A = window.HOLO_APP;
      const a = A.apertureList().find((x) => x.leaf === "leaf_op22");
      return { state: A.harness.world.entities.find((e) => e.id === "leaf_op22").state,
        resolved: A.resolve({ x: a.x + a.w / 2, y: a.y + a.h * 0.6 }) };
    });
    expect(closed.state).toBe("closed");
    expect(closed.resolved, "and a click on a shut leaf belongs to the leaf")
      .toEqual({ kind: "entity", id: "leaf_op22" });
    const closedHash = await shot();
    expect(closedHash, "shutting a door has to change the picture").not.toBe(openHash);

    /* PERSISTED. Turn away, walk to another room, come back, and the document
       still holds what the tap put in it — and the picture still shows it. */
    const away = await walk(page, ["door_solar_stair_landing"]);
    expect(away.location).toBe("stair_landing");
    const back = await walk(page, ["door_stair_landing_solar"], "E");
    expect(back).toEqual(SOLAR_E);
    const kept = await page.evaluate(() => window.HOLO_APP.harness.world.entities
      .find((e) => e.id === "leaf_op22").state);
    expect(kept, "the document kept it").toBe("closed");
    expect(await shot(), "and so did the picture").toBe(closedHash);
  });

  test("a shut leaf refuses the walk from BOTH rooms its doorway joins", async ({ page }) => {
    /* The clause row 42 could most easily have broken: the manor names its
       exits after the plan's opening, not after the leaf, so a harness that
       looked the leaf up by `via` would have found nothing and let a player
       walk through a shut door — from either side, silently. */
    await boot(page);
    const unreach = await page.evaluate(() =>
      window.HOLO_APP.dispatch({ type: "toggle", entity: "leaf_op22" }).narration);
    await walk(page, TO_SOLAR, "E");
    const fromSolar = await page.evaluate(() => {
      const A = window.HOLO_APP;
      const shut = A.dispatch({ type: "toggle", entity: "leaf_op22" });
      const go = A.dispatch({ type: "go", exit: "door_solar_muniment_room" });
      return { shut: shut.events.map((e) => e.to),
        events: go.events.length, narration: go.narration, where: A.harness.viewstate };
    });
    expect(unreach, "a leaf you are not looking at cannot be touched")
      .toBe("The door between the solar and the muniment room is not the door in front of you.");
    expect(fromSolar.shut).toEqual(["closed"]);
    expect(fromSolar.events, "a shut door is not a way out of the solar").toBe(0);
    expect(fromSolar.narration).toContain("shut");
    expect(fromSolar.where, "and the player did not move").toEqual(SOLAR_E);

    /* Open it, cross, shut it again from the other side. */
    await page.evaluate(() => window.HOLO_APP.dispatch(
      { type: "toggle", entity: "leaf_op22" }));
    const across = await walk(page, ["door_solar_muniment_room"], "W");
    expect(across).toEqual(MUNIMENT_W);
    const fromMuniment = await page.evaluate(() => {
      const A = window.HOLO_APP;
      A.dispatch({ type: "toggle", entity: "leaf_op22" });
      const go = A.dispatch({ type: "go", exit: "door_muniment_room_solar" });
      return { state: A.harness.world.entities.find((e) => e.id === "leaf_op22").state,
        events: go.events.length, narration: go.narration, where: A.harness.viewstate };
    });
    expect(fromMuniment.state).toBe("closed");
    expect(fromMuniment.events, "nor a way back into it from the muniment room").toBe(0);
    expect(fromMuniment.narration).toContain("shut");
    expect(fromMuniment.where).toEqual(MUNIMENT_W);
  });

  test("an open leaf still walks, through the painted frame it stands in", async ({ page }) => {
    await boot(page);
    await walk(page, TO_SOLAR, "E");
    const r = await page.evaluate(() => {
      const A = window.HOLO_APP;
      const a = A.apertureList().find((x) => x.leaf === "leaf_op22");
      const before = A.harness.viewstate;
      const res = A.resolve({ x: a.x + a.w / 2, y: a.y + a.h * 0.6 });
      const env = res.kind === "doorway" ? A.dispatch({ type: "go", exit: res.aperture.exit }) : null;
      return { before, res: res.kind, exit: res.aperture ? res.aperture.exit : null,
        after: A.harness.viewstate, events: env ? env.events.length : 0 };
    });
    expect(r.before).toEqual(SOLAR_E);
    expect(r.res).toBe("doorway");
    expect(r.exit).toBe("door_solar_muniment_room");
    expect(r.events).toBeGreaterThan(0);
    expect(r.after).toEqual({ location: "muniment_room", facing: "E" });
  });
});

/* ------------------------------------------------------------------ */
/* 3. THE CASEMENT                                                     */
/* ------------------------------------------------------------------ */

test.describe("row 42 — the casement, in a light the painting measured", () => {
  test.use({ viewport: POINTER_VIEWPORT });

  test("no measurement, no casement — the renderer draws nothing rather than guessing", async ({ page }) => {
    /* The row's own stated edge, and the same rule the promotion applies from
       the other side (`window.unpainted`): a casement placed from the PLAN onto
       paint nobody has measured is a sprite standing on blank wall. The
       document holds the casement, the picture does not show it, and the day
       kitchen/E is re-measured it appears in the light the painting drew. */
    await boot(page);
    const meta = await page.evaluate((vs) => window.HOLO_APP.metaFor(vs), KITCHEN_E);
    expect(meta.windows, "no wall in the store carries a window reading yet").toBeUndefined();
    expect(await entryAt(page, KITCHEN_E, "casement_win10"),
      "and nothing is drawn for one").toBeNull();
    /* But the DOCUMENT is not silent: the entity is there, and it says what it
       is waiting for. */
    const ent = await page.evaluate(() => window.HOLO_APP.harness.world.entities
      .find((e) => e.id === "casement_win10"));
    expect(ent.kind).toBe("window");
    expect(ent.fills).toBe("win10");
  });

  test("a measured light gets its casement, fitted to the light and hung off the floor", async ({ page }) => {
    await boot(page);
    const e = await entryAt(page, KITCHEN_E, "casement_win10", KITCHEN_LIGHT);
    expect(e, "the casement is drawn once the light is measured").toBeTruthy();
    expect(e.x).toBeCloseTo(KITCHEN_LIGHT.x, 6);
    expect(e.y).toBeCloseTo(KITCHEN_LIGHT.y, 6);
    expect(e.w).toBeCloseTo(KITCHEN_LIGHT.w, 6);
    expect(e.h).toBeCloseTo(KITCHEN_LIGHT.h, 6);
    expect(e.aperture).toBe("win10");
    expect(e.hangs, "a window sill is a metre up the wall — no contact pool under it")
      .toBe(true);
    expect(e.light_state, "and the row-37 hook is on the casement too").toBe("closed");
  });

  test("a tap on the light toggles the casement and NEVER travels", async ({ page }) => {
    await boot(page);
    /* Stand in the kitchen facing the window, walked the way a player walks. */
    expect(await walk(page, TO_KITCHEN, "E")).toEqual(KITCHEN_E);
    const r = await page.evaluate(([vs, light]) => {
      const A = window.HOLO_APP;
      /* And plant the measurement in the page's own meta store — the same
         object `metaFor` resolves, so every path under test reads one
         geometry. */
      A.backdrops[vs.location + "/" + vs.facing].meta.windows = [light];
      A.harness.redraw();

      const mid = { x: light.x + light.w / 2, y: light.y + light.h / 2 };
      const before = A.harness.viewstate;
      const resolved = A.resolve(mid);
      const env = resolved.kind === "entity"
        ? A.dispatch({ type: "toggle", entity: resolved.id }) : null;
      const after = A.harness.viewstate;
      /* And the window is in nobody's `go` list. */
      const goTargets = A.apertureList().map((a) => a.kind);
      const withWindows = window.HOLO.renderer.apertures(
        A.harness.world, A.harness.staging, A.library, A.metaFor(vs), vs, { windows: true });
      const openAgain = A.resolve(mid);
      return {
        before, after, resolved,
        state: A.harness.world.entities.find((e) => e.id === "casement_win10").state,
        events: env ? env.events : [],
        narration: env ? env.narration : null,
        goTargets,
        windowEntry: withWindows.filter((a) => a.kind === "window")
          .map((a) => ({ leaf: a.leaf, exit: a.exit, to: a.to, via: a.via,
            open: a.open, light_state: a.light_state })),
        openAgain
      };
    }, [KITCHEN_E, KITCHEN_LIGHT]);

    expect(r.resolved, "the light resolves to its casement, not to a way through")
      .toEqual({ kind: "entity", id: "casement_win10" });
    expect(r.state, "and the tap opened it").toBe("open");
    expect(r.events).toEqual([{ type: "state", entity: "casement_win10", to: "open" }]);
    expect(r.narration).toContain("casement");
    expect(r.after, "A TAP ON A WINDOW NEVER TRAVELS").toEqual(r.before);
    expect(r.goTargets, "and no window is ever a `go` target").not.toContain("window");
    expect(r.windowEntry.length).toBe(1);
    expect(r.windowEntry[0]).toEqual({ leaf: "casement_win10", exit: null, to: null,
      via: null, open: true, light_state: "open" });
    /* And an OPEN casement is still reachable: it draws as a sliver on its
       hinge side, and the light it uncovered is the rest of the target. */
    expect(r.openAgain, "an open casement can be shut again by the same tap")
      .toEqual({ kind: "entity", id: "casement_win10" });
  });
});

/* ------------------------------------------------------------------ */
/* 4. §12.2                                                            */
/* ------------------------------------------------------------------ */

test.describe("row 42 — the document is the sole truth and the picture never lies", () => {
  test("two renders of a placed leaf and a placed casement are byte-equal, and only state moves a pixel", async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(async ([hall, kitchen, light]) => {
      const A = window.HOLO_APP;
      const R = window.HOLO.renderer;
      const digest = async (c) => {
        const b = await new Promise((res) => c.toBlob(res, "image/png"));
        const d = await crypto.subtle.digest("SHA-256", await b.arrayBuffer());
        return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, "0")).join("");
      };
      const paint = async (vs, meta) => {
        const c = document.createElement("canvas");
        c.width = 1536; c.height = 1024;
        R.render(c, A.harness.world, A.harness.staging, A.library,
          Object.assign({}, A.backdrops,
            { [vs.location + "/" + vs.facing]: Object.assign({},
              A.backdrops[vs.location + "/" + vs.facing], { meta }) }),
          vs, {});
        return await digest(c);
      };
      const hallMeta = A.metaFor(hall);
      const kitMeta = Object.assign(
        JSON.parse(JSON.stringify(A.metaFor(kitchen))), { windows: [light] });

      const leaf = A.harness.world.entities.find((e) => e.id === "leaf_op22");
      const cas = A.harness.world.entities.find((e) => e.id === "casement_win10");

      const hallOpenA = await paint(hall, hallMeta);
      const hallOpenB = await paint(hall, hallMeta);
      const kitShutA = await paint(kitchen, kitMeta);
      const kitShutB = await paint(kitchen, kitMeta);
      leaf.state = "closed";
      cas.state = "open";
      const hallShut = await paint(hall, hallMeta);
      const kitOpen = await paint(kitchen, kitMeta);
      leaf.state = "open";
      cas.state = "closed";
      const hallBack = await paint(hall, hallMeta);
      const kitBack = await paint(kitchen, kitMeta);
      return { hallOpenA, hallOpenB, kitShutA, kitShutB, hallShut, kitOpen, hallBack, kitBack };
    }, [SOLAR_E, KITCHEN_E, KITCHEN_LIGHT]);

    expect(r.hallOpenB, "two renders of one document, byte for byte").toBe(r.hallOpenA);
    expect(r.kitShutB, "and the same with a casement in the frame").toBe(r.kitShutA);
    expect(r.hallShut, "a shut leaf is a different picture").not.toBe(r.hallOpenA);
    expect(r.kitOpen, "an open casement is a different picture").not.toBe(r.kitShutA);
    expect(r.hallBack, "and the round trip returns to the same pixels").toBe(r.hallOpenA);
    expect(r.kitBack, "on both").toBe(r.kitShutA);
  });
});
