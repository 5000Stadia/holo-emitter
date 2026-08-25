/* THE WALKTHROUGH OF THE WORLD A VISITOR ACTUALLY OPENS. [Row 21]
 *
 * `appUrl` asks for the furnished demo world by name, so every spec written
 * before this row is about a world the bare link no longer boots. This file is
 * about the bare link: the painted navigation world, walked by real clicks and
 * real keys, at a desktop size and at a phone's, from a cold `file://` load.
 *
 * It is deliberately §12.1's shape at navigation scope — there is nothing to
 * open, nothing to take and nothing to be refused for, because the painted
 * world is empty by design until row 4's assets arrive. What it can lose is
 * the ability to WALK, and that is what these cases hold: the two rooms, the
 * eight facings, the doorway that is a fact about the building rather than a
 * fact about a leaf, and the room that shows through it.
 */
import { test, expect, navUrl, POINTER_VIEWPORT, LIT } from "./helpers.mjs";

const PHONE = { width: 390, height: 844 };

async function sceneBox(page) {
  return await page.locator("#scene").boundingBox();
}

async function clickCanvasPoint(page, pt) {
  const box = await sceneBox(page);
  await page.mouse.click(box.x + (pt.x * box.width) / 1536,
    box.y + (pt.y * box.height) / 1024);
}

async function tapCanvasPoint(page, pt) {
  const box = await sceneBox(page);
  await page.touchscreen.tap(box.x + (pt.x * box.width) / 1536,
    box.y + (pt.y * box.height) / 1024);
}

async function aperture(page) {
  return await page.evaluate(() => {
    const A = window.HOLO_APP;
    const vs = A.harness.viewstate;
    const a = window.HOLO.renderer.apertures(
      A.harness.world, A.harness.staging, A.library, A.metaFor(vs), vs)[0];
    return a ? { x: a.x, y: a.y, w: a.w, h: a.h, source: a.source, via: a.via } : null;
  });
}

async function state(page) {
  return await page.evaluate(() => {
    const h = window.HOLO_APP.harness;
    const env = h.envelopes[h.envelopes.length - 1] || null;
    return {
      viewstate: h.viewstate,
      paints: window.HOLO_APP.paints,
      world: window.HOLO_FIXTURE.id,
      entities: h.world.entities.length,
      /* [row 42] The ids of every entity that declares an aperture it fills. */
      fitted: h.world.entities.filter((e) => e.fills != null).map((e) => e.id).sort(),
      narration: [...document.querySelectorAll("#narration p")].map((p) => p.textContent),
      lastIntent: env ? env.intent : null,
      lastEvents: env ? env.events : null
    };
  });
}

test.describe("the painted world a visitor opens", () => {
  test.use({ viewport: POINTER_VIEWPORT });

  test("the bare link boots the painted navigation world, on the painting", async ({ page }) => {
    await page.goto(navUrl());
    await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
    const s = await state(page);
    expect(s.world, "the bare URL boots nav-manor — no query, the way a visitor arrives").toBe("nav-manor");
    expect(s.viewstate, "and stands in the study, facing the painted wall")
      .toEqual({ location: "study", facing: "N" });
    /* [ROW 42] NO FURNITURE, AND TWO FITTINGS. This said "an empty world:
       nothing staged, nothing to click", and the sentence stopped being true
       when the row hung a door leaf in a measured doorway and a casement in a
       measured light. What has not changed is what it was written to hold: the
       navigation world furnishes nothing — no desk, no chair, no takeable —
       and its rooms are walkable because the BUILDING carries its doorways,
       not because a leaf fills them. So the count is named, and what it is
       named as is checked: every entity in this world stands in an aperture. */
    expect(s.entities, "the navigation world's only entities are the building's own fittings").toBe(2);
    expect(s.fitted, "and every one of them fills an aperture — this world has no furniture")
      .toEqual(["casement_win10", "leaf_op01"]);
    expect(s.paints, "and it painted").toBeGreaterThan(0);

    /* THE PAINTING IS ON SCREEN, not a grid that looks like one. Read as
       pixels: the frame carries no trace of the grid's own floor base colour,
       and the meta it drew with is the measured one. */
    const p = await page.evaluate(() => {
      const A = window.HOLO_APP;
      const meta = A.metaFor({ location: "study", facing: "N" });
      const c = document.getElementById("scene");
      const d = c.getContext("2d").getImageData(0, 0, 1536, 1024).data;
      let grid = 0, lit = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] === 44 && d[i + 1] === 53 && d[i + 2] === 66) grid++;
        if (d[i] > 120) lit++;
      }
      return { grid, lit, measured: meta.measured === true, ppm: meta.px_per_m_at_wall };
    });
    expect(p.measured, "study/N resolves to the meta measured off the painting").toBe(true);
    expect(p.ppm, "at the scale the painting was measured at").toBeCloseTo(188.421, 3);
    expect(p.grid, "no grid floor in a painted room").toBe(0);
    expect(p.lit, "and the fire in the hearth is lit — this is the painting").toBeGreaterThan(1000);
  });

  test("all four facings of each room turn, by real arrow keys", async ({ page }) => {
    await page.goto(navUrl());
    await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
    const seen = [];
    for (let i = 0; i < 4; i++) {
      seen.push((await state(page)).viewstate.facing);
      await page.keyboard.press("ArrowRight");
    }
    expect(seen, "right cycles N -> E -> S -> W").toEqual(["N", "E", "S", "W"]);
    /* And every one of them painted something: a turn that changes no pixels
       is a turn a player cannot see. `turn` is silent by design, so the
       picture is the entire response. */
    const hashes = await page.evaluate(async () => {
      const A = window.HOLO_APP;
      const out = [];
      for (let i = 0; i < 4; i++) {
        out.push(await window.__T.hashScene());
        A.dispatch({ type: "turn", dir: "right" });
      }
      return out;
    });
    expect(new Set(hashes).size, "four facings, four different pictures").toBe(4);
  });

  test("the doorway is a hole in the building, and clicking it walks you through", async ({ page }) => {
    await page.goto(navUrl());
    await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
    await page.keyboard.press("ArrowRight");                 // study/E
    const a = await aperture(page);
    expect(a, "the east wall has a doorway in it").toBeTruthy();
    expect(a.source, "and it comes from the meta, not from a leaf — nothing is staged here")
      .toBe("building");
    await clickCanvasPoint(page, { x: a.x + a.w / 2, y: a.y + a.h / 2 });
    const s = await state(page);
    expect(s.lastIntent, "the middle of the opening means travel")
      .toEqual({ type: "go", exit: "door_study_hall" });
    expect(s.viewstate, "arriving in the passage, facing the way you were walking")
      .toEqual({ location: "hall", facing: "E" });
    expect(s.narration[s.narration.length - 1])
      .toBe("You step through into the cross passage. The air is cooler here, and moves. The doorway stands open behind you.");
  });

  test("and back again, so the two rooms are a world rather than a one-way trip", async ({ page }) => {
    await page.goto(navUrl());
    await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
    await page.keyboard.press("ArrowRight");
    let a = await aperture(page);
    await clickCanvasPoint(page, { x: a.x + a.w / 2, y: a.y + a.h / 2 });
    // hall/E -> turn to hall/W: E -> S -> W
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    expect((await state(page)).viewstate).toEqual({ location: "hall", facing: "W" });
    a = await aperture(page);
    expect(a, "the passage's west end has the same doorway in it").toBeTruthy();
    await clickCanvasPoint(page, { x: a.x + a.w / 2, y: a.y + a.h / 2 });
    const s = await state(page);
    expect(s.viewstate, "back in the study, still walking west")
      .toEqual({ location: "study", facing: "W" });
    expect(s.narration[s.narration.length - 1])
      .toBe("You pass back into the study, where ink and oak dust close about you again. The doorway stands open behind you.");
  });

  test("the doorway is reachable by keyboard alone, and it is named for what it is", async ({ page }) => {
    /* Row 10's law: every intent a pointer can emit is reachable by keyboard
       alone. [Row 21] The go-control used to be built only where a LEAF stood
       open in the opening, so an empty painted room would have been walkable
       by mouse and by nothing else — and its name comes from the leaf's own
       noun, which an unfilled doorway does not have. */
    await page.goto(navUrl());
    await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
    await page.keyboard.press("ArrowRight");
    const labels = await page.evaluate(() =>
      [...document.querySelectorAll("#entity-controls button")]
        .map((b) => b.getAttribute("aria-label")));
    expect(labels, "one control, for the one thing on this facing you can do")
      .toEqual(["walk through the doorway"]);
    let focused = null;
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      focused = await page.evaluate(() =>
        document.activeElement && document.activeElement.getAttribute("aria-label"));
      if (focused === "walk through the doorway") break;
    }
    expect(focused, "the doorway takes focus by Tab alone").toBe("walk through the doorway");
    await page.keyboard.press("Enter");
    expect((await state(page)).viewstate, "and Enter walks through it")
      .toEqual({ location: "hall", facing: "E" });
  });

  test("a world the page does not carry is refused, in the product's voice", async ({ page }) => {
    /* [Row 21] `?world=` is a reachable surface now, so a typo in it is a
       reachable state. The page does NOT quietly boot something else — a page
       that boots a world other than the one it was asked for is the picture
       lying about the document — and it does not go silently black either. */
    const errors = [];
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    await page.goto(navUrl() + "?world=not-a-world");
    await page.waitForTimeout(500);
    const st = await page.evaluate(() => ({
      lines: [...document.querySelectorAll("#narration p")].map((p) => p.textContent),
      chevron: getComputedStyle(document.getElementById("chevron-left")).display,
      app: !!window.HOLO_APP
    }));
    expect(st.lines, "the page says what it can and cannot do, as the product")
      .toEqual(["The projection will not hold. Nothing of this place can be shown."]);
    expect(st.chevron, "and withdraws controls that were never wired").toBe("none");
    expect(st.app, "nothing booted").toBe(false);
    expect(errors.some((e) => /no baked world "not-a-world"/.test(e)),
      "the developer detail is on the console and nowhere else").toBe(true);
  });

  test("and an id that merely BEGINS with a world's name is not that world", async ({ page }) => {
    /* [Round 4] The pattern was unanchored at its tail, so `?world=` matched a
       PREFIX: `nav-manor.evil` booted the painted world and `demo-study.evil`
       booted the furnished one, in silence. The case above could never see it,
       because it only ever asked for an id made entirely of the characters the
       pattern's own class admits — the grammar was its own alibi. These two
       ask for names the page does not carry, in the shape that walked through
       it. */
    for (const id of ["nav-manor.evil", "demo-study.evil", "nav-manor "]) {
      await page.goto(navUrl() + "?world=" + encodeURIComponent(id));
      await page.waitForTimeout(300);
      const st = await page.evaluate(() => ({
        app: !!window.HOLO_APP,
        booted: window.HOLO_FIXTURE ? true : false,
        lines: [...document.querySelectorAll("#narration p")].map((p) => p.textContent)
      }));
      expect(st.app, `"${id}" booted something — the page carries no such world`).toBe(false);
      expect(st.booted, `"${id}" resolved to a fixture`).toBe(false);
      expect(st.lines, `"${id}" is refused in the product's voice like any other unknown id`)
        .toEqual(["The projection will not hold. Nothing of this place can be shown."]);
    }
  });

  test("bare wall means nothing: dead space is dead in an empty world too", async ({ page }) => {
    await page.goto(navUrl());
    await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
    await page.keyboard.press("ArrowRight");
    const a = await aperture(page);
    const before = await state(page);
    /* Well clear of the opening, on the painted-or-drawn wall itself. */
    await clickCanvasPoint(page, { x: Math.max(40, a.x - 200), y: a.y + a.h / 2 });
    const after = await state(page);
    expect(after.viewstate, "a click on the wall moves nobody").toEqual(before.viewstate);
    expect(after.paints, "and paints nothing").toBe(before.paints);
    expect(after.narration.length, "and says nothing").toBe(before.narration.length);
  });
});

test.describe("the same world in a hand", () => {
  /* `hasTouch`, not `isMobile`: Firefox refuses `isMobile` outright, and what
     these two cases need is a phone-sized viewport and a finger — not a
     mobile user-agent string. Both engines run them. */
  test.use({ viewport: PHONE, hasTouch: true });

  test("a phone can walk it: the doorway is a real target at 390x844", async ({ page }) => {
    await page.goto(navUrl());
    await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
    /* The chevron, because a phone has no arrow keys — and it is the only way
       to turn on one. */
    await page.locator("#chevron-right").tap();
    expect((await state(page)).viewstate).toEqual({ location: "study", facing: "E" });
    const a = await aperture(page);
    /* THE TARGET'S SIZE IN A FINGER'S TERMS. The canvas is contain-fitted, so
       a 250 px opening on a 1536 px canvas is what is left of it at this
       width. The platform minimum for a touch target is 44 CSS px; this is
       the number that says whether a doorway is one. */
    const box = await sceneBox(page);
    const cssW = a.w * box.width / 1536;
    const cssH = a.h * box.height / 1024;
    expect(cssW, `the doorway is ${cssW.toFixed(1)} CSS px wide on a phone`).toBeGreaterThan(44);
    expect(cssH, `and ${cssH.toFixed(1)} px tall`).toBeGreaterThan(44);
    await tapCanvasPoint(page, { x: a.x + a.w / 2, y: a.y + a.h / 2 });
    const s = await state(page);
    expect(s.viewstate, "and a tap in the middle of it walks through")
      .toEqual({ location: "hall", facing: "E" });
  });

  test("the picture is not clipped off the phone, and the page does not scroll sideways", async ({ page }) => {
    await page.goto(navUrl());
    await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
    const m = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
      clientH: document.documentElement.clientHeight,
      rootFontSize: parseFloat(getComputedStyle(document.documentElement).fontSize),
      scene: document.getElementById("scene").getBoundingClientRect().toJSON()
    }));
    expect(m.scrollW, "no horizontal scroll").toBeLessThanOrEqual(m.clientW + 1);
    expect(m.scene.width, "the whole width of the frame is on screen")
      .toBeLessThanOrEqual(m.clientW + 1);
    /* [Row 21, round 2] `> 100` WAS THE CONVENIENT-VIEWPOINT CHECK — it passes
       at a size that leaves the row's whole achievement unreadable in a hand.
       The real claim is that the picture is as large as the layout allows: a
       3:2 frame contain-fitted into the width, with the bottom chrome's
       reserve taken off the height. If a future row shrinks the picture, or
       reserves space it does not use, this moves. */
    const chrome = m.rootFontSize * 7.6;                 // narration 4.2 + strip 3.4
    const avail = { w: m.clientW, h: m.clientH - chrome };
    const fit = Math.min(avail.w / 1536, avail.h / 1024);
    expect(m.scene.width, `the picture fills the width the layout allows (${avail.w}×${avail.h.toFixed(0)} available)`)
      .toBeCloseTo(1536 * fit, 0);
    expect(m.scene.height, "and the height that follows from it").toBeCloseTo(1024 * fit, 0);
    /* WHAT THAT LEAVES, as a number rather than a shrug: on this phone the
       picture is 390×260 of an 844-tall screen — 31 % of it — and in the empty
       painted world the two chrome strips below it hold nothing at all. That
       is a look question and it is in the row's batch, not a defect this
       assertion can settle. */
    expect(m.scene.height / m.clientH, "the picture's share of a phone screen")
      .toBeLessThan(0.4);
  });
});

/* ------------------------------------------------------------------------ */
/* [Row 15] THE MANOR, WALKED — by real clicks and real arrow keys.          */
/* ------------------------------------------------------------------------ */

/** Turn with the arrow keys until the room faces `f`, the way a player does. */
async function faceWithKeys(page, f) {
  for (let i = 0; i < 5; i++) {
    const at = await page.evaluate(() => window.HOLO_APP.harness.viewstate.facing);
    if (at === f) return true;
    await page.keyboard.press("ArrowRight");
  }
  return false;
}

/** The go-control for `exit`, reached by Tab alone and pressed. */
async function walkByKeyboard(page, exit) {
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press("Tab");
    const hit = await page.evaluate((id) => {
      const a = document.activeElement;
      return !!(a && a.getAttribute("data-go") === "1" && a.getAttribute("data-target-id") === id);
    }, exit);
    if (hit) { await page.keyboard.press("Enter"); return true; }
  }
  return false;
}

/** Click the middle of an exit's own aperture. */
async function walkByClick(page, exit) {
  /* A HUMAN'S PAUSE BETWEEN TWO DOORWAY CLICKS. The double-click echo guard
     swallows a second doorway click inside 400 ms — deliberately, because one
     gesture must not walk through two rooms with the middle one never seen —
     and a test that clicks its way round a manor as fast as the harness will
     take it is not a player. The wait is the guard's own window, and driving
     the route without it is how the guard's cost was measured. */
  await page.waitForTimeout(420);
  const ap = await page.evaluate((id) => {
    const A = window.HOLO_APP, fx = window.HOLO_FIXTURE;
    const vs = A.harness.viewstate;
    const a = window.HOLO.renderer.apertures(
      fx.world, fx.staging, A.library, A.metaFor(vs), vs).find((x) => x.exit === id);
    if (!a) return null;
    /* The middle of what the resolver actually claims: for a flight that is
       the rings it is drawn with, whose bounding box takes in bare floor
       beside it. [Row 25] The centroid of the LARGEST ring, which is a point
       inside the body on a flight of any shape — the old midpoint-of-a-hull
       trick assumed one convex outline. */
    if (a.polys && a.polys.length) {
      let best = null, bestArea = -1;
      for (const ring of a.polys) {
        if (!ring || ring.length < 3) continue;
        let area = 0, cx = 0, cy = 0;
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
          const f = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
          area += f;
          cx += (ring[j][0] + ring[i][0]) * f;
          cy += (ring[j][1] + ring[i][1]) * f;
        }
        if (Math.abs(area) < 1e-9) continue;
        const a2 = Math.abs(area / 2);
        if (a2 > bestArea) { bestArea = a2; best = { x: cx / (3 * area), y: cy / (3 * area) }; }
      }
      if (best) return best;
    }
    return { x: a.x + a.w / 2, y: a.y + a.h / 2 };
  }, exit);
  if (!ap) return null;
  await clickCanvasPoint(page, ap);
  return ap;
}

/* Entrance → great hall → study wing → upstairs → and back. Every leg names
   how it is driven, because the two halves are not variants of one another:
   row 10's rule is that every intent a pointer can emit is reachable by
   keyboard alone, and a flight and a threshold are two aperture kinds that
   rule had never covered. */
const ROUTE = [
  ["way_entrance_approach_entrance_court", "N", "key"],    // the open threshold, in
  ["door_entrance_court_great_hall", "N", "click"],
  ["door_great_hall_back_stair", "E", "click"],
  ["stair_back_stair_back_stair_head", "E", "key"],        // UP a flight, by keyboard
  ["door_back_stair_head_long_gallery", "E", "click"],
  ["door_long_gallery_muniment_room", "W", "click"],
  ["door_muniment_room_solar", "W", "click"],
  ["door_solar_stair_landing", "W", "click"],
  ["stair_stair_landing_great_stair_hall", "S", "key"],    // DOWN a flight, by keyboard
  ["door_great_stair_hall_great_hall", "E", "click"],
  ["door_great_hall_entrance_court", "S", "click"],
  ["way_entrance_court_entrance_approach", "S", "click"]   // the open threshold, out
];

/** Walk a list of exits through the harness, turning to face each one — the
 *  way a player would, and the only way `handleGo` admits. Used to POSITION
 *  the page; the route under test is driven by real events. */
async function driveTo(page, exits) {
  return await page.evaluate((list) => {
    const A = window.HOLO_APP;
    const refused = [];
    for (const id of list) {
      const vs = A.harness.viewstate;
      const ex = (A.harness.world.locations.find((l) => l.id === vs.location).exits || [])
        .find((e) => e.id === id);
      if (!ex) { refused.push(`${id}: not an exit of ${vs.location}`); continue; }
      let guard = 0;
      while (A.harness.viewstate.facing !== ex.facing && guard++ < 4) {
        A.harness.dispatch({ type: "turn", dir: "right" });
      }
      if (!A.harness.dispatch({ type: "go", exit: id }).events.length) {
        refused.push(`${id}: refused from ${JSON.stringify(vs)}`);
      }
    }
    return refused;
  }, exits);
}

/* From the study, out through the service range and the great hall to the
   court and the approach — the manor's own front. `op14` is the one opening
   no standpoint can see (the cross passage is 8.00 m long and the lens shows
   3.2 m of it), so the kitchen is entered from the court and not from the
   passage, which is what the plan warning says out loud. */
const TO_THE_FRONT = ["door_study_hall", "door_hall_buttery_pantry",
  "door_buttery_pantry_servants_hall", "door_servants_hall_back_stair",
  "door_back_stair_great_hall", "door_great_hall_entrance_court",
  "way_entrance_court_entrance_approach"];

test.describe("the manor, walked", () => {
  test.use({ viewport: POINTER_VIEWPORT });

  test("entrance to great hall to the wings, upstairs and back — real clicks and real keys", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto(navUrl());
    await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
    /* Start where a visitor starts and walk OUT to the approach first, so the
       route begins at the manor's own front. */
    expect(await driveTo(page, TO_THE_FRONT), "the way out to the front walks").toEqual([]);
    expect((await state(page)).viewstate.location,
      "the route starts on the approach, outside the manor's front").toBe("entrance_approach");

    const trouble = [];
    for (const [exit, facing, how] of ROUTE) {
      const before = (await state(page)).viewstate;
      if (!(await faceWithKeys(page, facing))) { trouble.push(`${exit}: could not face ${facing}`); break; }
      const ok = how === "key" ? await walkByKeyboard(page, exit) : !!(await walkByClick(page, exit));
      if (!ok) { trouble.push(`${exit}: no ${how} path from ${JSON.stringify(before)}`); break; }
      const s = await state(page);
      if (s.viewstate.location === before.location) {
        trouble.push(`${exit}: the ${how} did not travel (still in ${before.location})`);
        break;
      }
      /* THE ORIENTATION LAW, on every passage including both flights: you
         arrive facing the way you went. */
      if (s.viewstate.facing !== facing) {
        trouble.push(`${exit}: left facing ${facing} and arrived facing ${s.viewstate.facing}`);
      }
      /* And the room says its own name, in the player's voice, off the real
         pane rather than out of a JSON file. */
      const line = s.narration[s.narration.length - 1] || "";
      if (!line || /[_A-Z]{2}/.test(line)) trouble.push(`${exit}: arrival line is ${JSON.stringify(line)}`);
    }
    expect(trouble).toEqual([]);
    const end = await state(page);
    expect(end.viewstate.location, "and the walk ends where it began").toBe("entrance_approach");
    /* Two floors and three aperture kinds — two flights, two open thresholds
       and eight doorways — with one line of prose per arrival. */
    expect(end.narration.length, "one line of prose per arrival on the route")
      .toBeGreaterThanOrEqual(ROUTE.length);
  });

  test("a flight and a threshold are named for themselves, not all called a doorway", async ({ page }) => {
    /* A control's accessible name is the shortest true name of what it does.
       Calling a flight and a 20 m court mouth "the doorway" would be the one
       string on the page that is false of the thing under it. Read off the
       controls the page actually builds, standing in each room. */
    const seen = [];
    for (const [route, facing] of [
      [["door_study_hall", "door_hall_buttery_pantry", "door_buttery_pantry_servants_hall",
        "door_servants_hall_back_stair"], "E"],
      [TO_THE_FRONT.slice(0, 6), "S"]
    ]) {
      await page.goto(navUrl());
      await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
      expect(await driveTo(page, route), `positioning for ${facing}`).toEqual([]);
      await faceWithKeys(page, facing);
      seen.push(...await page.evaluate(() =>
        [...document.querySelectorAll("#entity-controls button[data-go]")]
          .map((b) => b.getAttribute("aria-label"))));
    }
    expect(seen, "a flight is climbed and a mouth is crossed; neither is 'the doorway'")
      .toEqual(expect.arrayContaining(["climb the stair", "cross the threshold"]));
  });

  test("and the same walk in a hand, at 390x844", async ({ page }) => {
    /* THE OTHER SIZE, and it is not decoration: 29 of the manor's 56 exits are
       narrower than the 44 CSS px platform minimum on this screen, because the
       standpoint law stands the entrance court's viewer 15.30 m off its own
       wall. (Row 26 seated two doorways that the frame had been cutting and
       gave the manor back its 56th exit; none of that touches these, which are
       whole and far away rather than clipped.) What makes them reachable is the tolerance ring, and the only way
       to know it does is to aim at them here. */
    test.setTimeout(180_000);
    await page.setViewportSize(PHONE);
    await page.goto(navUrl());
    await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
    expect(await driveTo(page, TO_THE_FRONT), "the way out to the front walks").toEqual([]);
    const trouble = [];
    for (const [exit, facing, how] of ROUTE) {
      const before = (await state(page)).viewstate;
      await faceWithKeys(page, facing);
      const ok = how === "key" ? await walkByKeyboard(page, exit) : !!(await walkByClick(page, exit));
      const s2 = await state(page);
      if (!ok || s2.viewstate.location === before.location) {
        trouble.push(`${exit}: no ${how} path in a hand, from ${JSON.stringify(before)}`);
        break;
      }
    }
    expect(trouble, "every way through the manor is reachable on a phone").toEqual([]);
    expect((await state(page)).viewstate.location).toBe("entrance_approach");
  });
});

/* ------------------------------------------------------------------ [row 26] */

/* THE GATE OF THE MANOR, PROVED WHERE THE DEFECT LIVED — on the shipped page,
   walked as a player walks it, with a real pointer event at a real drawn pixel.
   The Captain's own report was "Still just 2 rooms" / "No change - go try it
   out", and this is why: the buttery doorway on `hall/N` drew 476 px of itself
   with 54 on the frame, 8 % of it clickable, unmarked on a near-black grid
   wall. Every machine check in the project passed while that was true, which is
   the point of doing it this way instead — `dispatch` reaching the exit proves
   the world; only a click at a pixel proves the player can reach it.

   NOT `HOLO_APP.resolve`. This suite has been burned once by a case that asked
   `resolve` and never sent an event. */
test.describe("the gate of the manor: a walked way-through is where the hand is", () => {
  for (const [name, vp] of [["a phone", { width: 390, height: 844 }],
                            ["the narrowest screen the suite drives", { width: 320, height: 568 }]]) {
    test(`from the passage, a real click on the drawn doorway travels — ${name}`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.setViewportSize(vp);
      await page.goto(navUrl());
      await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);

      /* Into the passage the way the boot pair opens onto it, by real intents. */
      expect(await driveTo(page, ["door_study_hall"]), "out of the study").toEqual([]);
      expect((await state(page)).viewstate.location).toBe("hall");

      for (const [facing, exitId, dest] of [["N", "door_hall_buttery_pantry", "buttery_pantry"],
                                            ["S", "door_hall_kitchen", "kitchen"]]) {
        /* Face the wall the door is in with a real arrow key — no viewstate
           writing, and the page repaints on its own envelope as it would for a
           player. */
        expect(await faceWithKeys(page, facing), `turning to ${facing}`).toBe(true);
        expect((await state(page)).viewstate).toEqual({ location: "hall", facing });

        /* The aperture the RENDERER produced, not one this test computed, and
           the part of it that is actually on the canvas. */
        const ap = await page.evaluate((id) => {
          const A = window.HOLO_APP, vs = A.harness.viewstate;
          const a = window.HOLO.renderer.apertures(
            A.harness.world, A.harness.staging, A.library, A.metaFor(vs), vs)
            .find((x) => x.exit === id);
          if (!a) return null;
          const x0 = Math.max(0, a.x), x1 = Math.min(1536, a.x + a.w);
          const y0 = Math.max(0, a.y), y1 = Math.min(1024, a.y + a.h);
          return { x: a.x, y: a.y, w: a.w, h: a.h, onW: x1 - x0, onH: y1 - y0,
            cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
        }, exitId);
        expect(ap, `${exitId} draws an aperture on hall/${facing}`).toBeTruthy();
        expect(ap.onW, `${exitId}: ${Math.round(ap.onW)} px of ${Math.round(ap.w)} on the frame`)
          .toBeCloseTo(ap.w, 6);

        /* AND THE CLICK. At the middle of what is drawn, through the live
           bounding box, as a pointer event the page receives.

           The pause is the double-click echo guard's own 400 ms window, for
           the reason `walkByClick` above already records: one gesture must not
           walk two rooms, and a test that clicks as fast as the harness will
           take it is not a player. Without it the SECOND doorway of this case
           was swallowed by the guard and read as a defect in the doorway. */
        await page.waitForTimeout(420);
        await clickCanvasPoint(page, { x: ap.cx, y: ap.cy });
        const s = await state(page);
        expect(s.viewstate.location,
          `a click on the drawn ${dest} doorway travels, at ${vp.width}x${vp.height}`).toBe(dest);

        /* Back into the passage for the second door, by keyboard — a real
           input path, so the page's own paint keeps step with the world. The
           way back is on the opposite wall of the room we just entered, which
           the world says rather than this test guessing. */
        const back = dest === "buttery_pantry" ? "door_buttery_pantry_hall" : "door_kitchen_hall";
        const backFacing = await page.evaluate((id) => {
          const A = window.HOLO_APP, vs = A.harness.viewstate;
          return (A.harness.world.locations.find((l) => l.id === vs.location).exits || [])
            .find((e) => e.id === id).facing;
        }, back);
        expect(await faceWithKeys(page, backFacing), "facing the way back").toBe(true);
        expect(await walkByKeyboard(page, back), "back into the passage").toBe(true);
        expect((await state(page)).viewstate.location).toBe("hall");
      }
    });
  }
});
