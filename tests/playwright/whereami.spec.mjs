/* whereami.spec — the standing readout: where you are, and which way you look.
 *
 * Kabe's ask, 2026-08-24 [HUMAN, verbatim]: "I'd like a text overlay somewhere
 * stating room identified and direction for my reference." Row 24 owns the
 * full wayfinding instrument and Kabe rules how much of it is always on; this
 * file holds the sliver that ships now.
 *
 * What it has to hold, and each case exists for one of them:
 *   1. the readout is what the viewstate says, after REAL turns and REAL
 *      travel, in both engines — a label that drifts from the document is the
 *      picture lying about the world one surface further out;
 *   2. it is CHROME — DOM over the stage, never the scene canvas — so no scene
 *      hash moves and §12.6's flip pairs never see it;
 *   3. it never names a view the world does not hold, which is both the
 *      honesty rule and what keeps the surface audit's enumeration closed;
 *   4. its audit rows are DERIVED from the shipped worlds, not hand-kept.
 */
import { test, expect, appUrl, navUrl, repoRoot, POINTER_VIEWPORT, stageTree, removeTree }
  from "./helpers.mjs";
import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/* ---------- the worlds, off the tree ---------------------------------- */

const WORLDS = readdirSync(join(repoRoot, "fixtures"))
  .filter((id) => existsSync(join(repoRoot, "fixtures", id, "world.json")))
  .sort()
  .map((id) => ({
    id,
    world: JSON.parse(readFileSync(
      join(repoRoot, "fixtures", id, "world.json"), "utf8"))
  }));

const auditText = readFileSync(
  join(repoRoot, "design", "surface-strings.md"), "utf8");

/** The audit's own rows, parsed the way voice.spec parses them: six
 *  separators, then the string, which may contain anything. */
function auditRows(surface) {
  const m = auditText.match(/```STRINGS\n([\s\S]*?)```/);
  if (!m) throw new Error("design/surface-strings.md has no ```STRINGS block");
  const out = [];
  for (const line of m[1].split("\n").filter((l) => l.trim() !== "").slice(1)) {
    const parts = [];
    let rest = line;
    for (let i = 0; i < 6; i++) {
      const at = rest.indexOf(" | ");
      if (at === -1) throw new Error(`unparseable STRINGS row: ${line}`);
      parts.push(rest.slice(0, at).trim());
      rest = rest.slice(at + 3);
    }
    if (parts[1] === surface) out.push({ id: parts[0], observed: parts[4], text: rest });
  }
  return out;
}

/** What the readout is showing, and whether it is showing at all. */
async function readout(page) {
  return await page.evaluate(() => {
    const el = document.getElementById("whereami");
    return {
      place: document.getElementById("whereami-place").textContent,
      facing: document.getElementById("whereami-facing").textContent,
      shown: !el.hidden && getComputedStyle(el).display !== "none",
      viewstate: window.HOLO_APP ? window.HOLO_APP.harness.viewstate : null
    };
  });
}

/* ---------- 1. the enumeration is derived, in both directions --------- */

test("the audit enumerates exactly the places and aspects the worlds hold", () => {
  /* The readout's string set is not a list anybody keeps: it is every
     location id of every shipped world, plus the aspects those rooms have.
     Asserted in BOTH directions, because a one-directional check would let a
     twenty-third room reach the surface unaudited (the failure the surface
     audit exists for) and would let a deleted row rot in the document. */
  const places = new Set();
  const facings = new Set();
  for (const w of WORLDS) {
    for (const loc of w.world.locations) {
      places.add(loc.id);
      for (const f of loc.facings) facings.add(f);
    }
  }
  expect(places.size, "the worlds hold rooms to name").toBeGreaterThan(20);

  const placeRows = auditRows("#whereami place");
  expect(placeRows.map((r) => r.text).sort(),
    "every place the readout can name is enumerated, and nothing else is")
    .toEqual([...places].sort());

  const facingRows = auditRows("#whereami facing");
  expect(facingRows.map((r) => r.text).sort(),
    "every aspect the readout can name is enumerated, and nothing else is")
    .toEqual([...facings].sort());

  /* `observed: no` is admissible in this audit only for an inventory tile
     name, so every row here claims a surface — and the two sweeps below are
     what make that claim true. */
  for (const r of [...placeRows, ...facingRows]) {
    expect(r.observed, `#${r.id} claims to be observed`).toBe("yes");
  }
});

/* ---------- 2. real turns, real travel, the furnished world ----------- */

test.describe("the readout follows the view", () => {
  test.use({ viewport: POINTER_VIEWPORT });

  test("real turns and a real walk through the door keep it true", async ({ page }) => {
    await page.goto(appUrl());
    await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);

    const agrees = async (where) => {
      const r = await readout(page);
      expect(r.shown, `${where}: the readout is on screen`).toBe(true);
      expect({ location: r.place, facing: r.facing }, `${where}: it is the viewstate`)
        .toEqual(r.viewstate);
      return r;
    };

    const boot = await agrees("cold boot");
    expect(boot, "the demo world boots in the study, facing north")
      .toMatchObject({ place: "study", facing: "N" });

    /* REAL KEYS on the real page, not dispatch: the readout is wired to the
       harness's one subscriber, and the whole point is that every path a
       player has to change the view carries it. */
    for (const f of ["E", "S", "W", "N"]) {
      await page.keyboard.press("ArrowRight");
      const r = await agrees(`after a turn to ${f}`);
      expect(r.facing, "the key turned the room and the readout with it").toBe(f);
    }
    /* And the chevron, which is a different input path to the same intent. */
    await page.locator("#chevron-left").click();
    const back = await agrees("after a chevron press");
    expect(back.facing, "left from north").toBe("W");

    // Face the door, open it, and walk through it with a real click.
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    expect((await readout(page)).facing).toBe("E");
    await page.evaluate(() => window.HOLO_APP.dispatch({ type: "toggle", entity: "door1" }));
    await agrees("with the door open");

    const pt = await page.evaluate(() => window.__T.aperturePoint("door_study_hall"));
    expect(pt, "the open doorway is on the frame").toBeTruthy();
    const box = await page.locator("#scene").boundingBox();
    await page.mouse.click(box.x + (pt.x * box.width) / 1536,
      box.y + (pt.y * box.height) / 1024);
    await page.waitForFunction(
      () => window.HOLO_APP.harness.viewstate.location === "hall");
    const arrived = await agrees("after walking into the hall");
    expect(arrived.place, "the readout names the room you walked into").toBe("hall");

    // Every facing of the second room, then back through the door — which is
    // on the hall's west wall, so the return is two turns and a walk.
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("ArrowLeft");
      await agrees("turning in the hall");
    }
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    expect((await readout(page)).facing, "facing the door home").toBe("W");
    await page.evaluate(() => window.HOLO_APP.dispatch({ type: "go", exit: "door_hall_study" }));
    const home = await agrees("back in the study");
    expect(home.place, "and the room you came back to").toBe("study");

    /* A REFUSED turn changes no view, so it changes no readout — the harness
       calls its subscriber only on non-empty events, and this is the clause
       that says the label may not move when the world does not. */
    const before = await readout(page);
    await page.evaluate(() => window.HOLO_APP.dispatch({ type: "toggle", entity: "chair1" }));
    const after = await readout(page);
    expect({ place: after.place, facing: after.facing },
      "a refused intent moves nothing").toEqual({ place: before.place, facing: before.facing });
  });
});

/* ---------- 3. every room of the manor, and every facing -------------- */

test("the manor: the readout names every one of its rooms, on every facing", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto(navUrl());
  await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);

  /* Twenty-two rooms and eighty-eight facings walked in ONE page.evaluate,
     through the page's own dispatch — the real intent path, the same one the
     keys and the chevrons reach, and the same subscriber. The furnished
     world's case above is the one that proves the input surfaces themselves;
     driving 88 facings through the mouse would spend minutes to re-prove it.
     The walk is a depth-first crawl that backtracks over the exit it came in
     by, so it is the building's own topology that decides where it goes. */
  const r = await page.evaluate(() => {
    const A = window.HOLO_APP, W = A.harness.world;
    const el = document.getElementById("whereami");
    const placeEl = document.getElementById("whereami-place");
    const facingEl = document.getElementById("whereami-facing");
    const mismatches = [], places = new Set(), pairs = new Set(), unshown = [];

    const check = (where) => {
      const vs = A.harness.viewstate;
      if (placeEl.textContent !== vs.location || facingEl.textContent !== vs.facing) {
        mismatches.push(`${where}: readout "${placeEl.textContent}/${facingEl.textContent}" vs viewstate "${vs.location}/${vs.facing}"`);
      }
      if (el.hidden) unshown.push(where);
      places.add(vs.location);
      pairs.add(vs.location + "/" + vs.facing);
    };
    const exitsOf = (id) => (W.locations.find((l) => l.id === id).exits || []);
    const turnTo = (f) => {
      for (let i = 0; i < 4 && A.harness.viewstate.facing !== f; i++) {
        A.dispatch({ type: "turn", dir: "right" });
        check("turning in " + A.harness.viewstate.location);
      }
    };
    const visited = new Set();

    const walk = (id) => {
      visited.add(id);
      // Every facing of this room, so all four aspects are read here too.
      for (let i = 0; i < 4; i++) {
        A.dispatch({ type: "turn", dir: "right" });
        check("a full turn in " + id);
      }
      for (const ex of exitsOf(id)) {
        if (visited.has(ex.to)) continue;
        turnTo(ex.facing);
        A.dispatch({ type: "go", exit: ex.id });
        if (A.harness.viewstate.location !== ex.to) {
          mismatches.push(`${ex.id}: the walk could not travel from ${id} to ${ex.to}`);
          continue;
        }
        check("arriving in " + ex.to);
        walk(ex.to);
        const back = exitsOf(A.harness.viewstate.location).find((e) => e.to === id);
        if (!back) {
          mismatches.push(`no way back from ${A.harness.viewstate.location} to ${id}`);
          return;
        }
        turnTo(back.facing);
        A.dispatch({ type: "go", exit: back.id });
        check("back in " + id);
      }
    };
    walk(A.harness.viewstate.location);
    return {
      mismatches, unshown,
      places: [...places].sort(), pairCount: pairs.size,
      rooms: W.locations.map((l) => l.id).sort(),
      facings: W.locations.reduce((n, l) => n + l.facings.length, 0)
    };
  });

  expect(r.mismatches, "the readout is the viewstate, everywhere in the manor").toEqual([]);
  expect(r.unshown, "and it is showing in every room of it").toEqual([]);
  expect(r.places, "every room of the manor was reached and named").toEqual(r.rooms);
  expect(r.pairCount, "on every facing of every room").toBe(r.facings);
});

/* ---------- 4. chrome, not the picture ------------------------------- */

test("the readout is chrome: no scene hash moves, and a capture never sees it",
  async ({ page }) => {
    await page.goto(appUrl());
    await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);

    expect(await page.evaluate(() =>
      document.getElementById("scene").contains(document.getElementById("whereami"))),
    "it is not inside the canvas element").toBe(false);

    /* §12.2's own question, asked of this element: the picture is a function
       of the document, and a label over it is not an input to that function.
       The hash is taken with the readout live, then with it saying something
       else entirely — a within-run identity, which is all §12.2 asserts. */
    const before = await page.evaluate(() => window.__T.hashScene());
    await page.evaluate(() => {
      document.getElementById("whereami-place").textContent = "a very long room name";
      document.getElementById("whereami-facing").textContent = "NNE";
    });
    const after = await page.evaluate(() => window.__T.hashScene());
    expect(after, "the scene canvas cannot see the readout").toBe(before);

    // And a repaint restores it from the document rather than leaving the lie.
    await page.keyboard.press("ArrowRight");
    const r = await readout(page);
    expect({ location: r.place, facing: r.facing },
      "the next paint writes the truth back over it").toEqual(r.viewstate);

    /* §12.6's capture rule: the scene canvas may carry no chrome. The
       readout overlaps the picture, so this is the clause that keeps a flip
       pair clean. */
    const overlaps = await page.evaluate(() => {
      const a = document.getElementById("whereami").getBoundingClientRect();
      const b = document.getElementById("scene").getBoundingClientRect();
      return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    });
    expect(overlaps, "it does overlap the canvas — which is why capture must hide it").toBe(true);
    await page.evaluate(() => document.body.classList.add("capture"));
    expect(await page.locator("#whereami").evaluate((el) => getComputedStyle(el).display),
      "hidden under body.capture").toBe("none");
  });

test("it is announced, and it is not a control", async ({ page }) => {
  await page.goto(appUrl());
  await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
  const a = await page.evaluate(() => {
    const el = document.getElementById("whereami");
    return {
      role: el.getAttribute("role"),
      label: el.getAttribute("aria-label"),
      chrome: el.classList.contains("chrome"),
      pointer: getComputedStyle(el).pointerEvents,
      markHidden: el.querySelector(".sep").getAttribute("aria-hidden"),
      /* What a screen reader is handed for the region's contents: the place
         and the aspect, with the decorative mark taken out of the tree. */
      spoken: [...el.querySelectorAll("span")]
        .filter((s) => s.getAttribute("aria-hidden") !== "true")
        .map((s) => s.textContent).join(" ")
    };
  });
  /* Where it sits in the stage. `keyboard.spec` pins the first seven children
     because that is where the focusable things are; this element is not one,
     so it goes after them — and that placement is pinned HERE rather than
     left to whichever spec happens to notice it moved. */
  const stageOrder = await page.evaluate(() =>
    [...document.getElementById("stage").children].map((el) => el.id));
  expect(stageOrder[stageOrder.length - 1],
    "the readout is the last child of the stage, after every control").toBe("whereami");

  expect(a.role, "row 24's screen-reader work builds on this").toBe("status");
  expect(a.label).toBe("where you stand");
  expect(a.chrome, "so a capture hides it with the rest").toBe(true);
  expect(a.pointer, "a readout takes no clicks from the canvas under it").toBe("none");
  expect(a.markHidden, "the separator is decoration").toBe("true");
  expect(a.spoken, "what is announced is the place and the aspect").toBe("study N");
});

/* ---------- 5. it never names a view the world does not hold ---------- */

test("a broken boot viewstate leaves the readout blank and withdrawn", async ({ page }) => {
  for (const [label, vs, recovers] of [
    ["a location no world holds", { location: "atrium", facing: "N" }, false],
    ["an aspect that room does not have", { location: "study", facing: "Q" }, true]
  ]) {
    const dir = stageTree();
    try {
      const p = join(dir, "fixtures", "demo-study", "fixture.js");
      writeFileSync(p, readFileSync(p, "utf8").replace(
        /viewstate: \{[^}]*\}/, "viewstate: " + JSON.stringify(vs)));
      await page.goto(appUrl(dir));
      await page.waitForFunction(() => !!window.HOLO_APP);
      const r = await readout(page);
      expect({ place: r.place, facing: r.facing }, `${label}: nothing is claimed`)
        .toEqual({ place: "", facing: "" });
      expect(r.shown, `${label}: and the element is withdrawn`).toBe(false);
      /* The player is still answered — by the narration pane, which is where
         every other fault line in this product speaks. */
      expect(await page.locator("#narration p").last().textContent())
        .toBe("The projection was set to a view this pattern does not hold.");

      /* And the recovery is real: on the branch where the room exists, the
         first arrow key puts a true view back, and the readout comes back
         with it rather than staying dark. */
      await page.keyboard.press("ArrowRight");
      const after = await readout(page);
      if (recovers) {
        expect(after.shown, `${label}: the view recovered and so did the readout`).toBe(true);
        expect({ location: after.place, facing: after.facing }).toEqual(after.viewstate);
      } else {
        expect(after.shown, `${label}: that room does not exist, and never will`).toBe(false);
      }
    } finally {
      removeTree(dir);
    }
  }
});

test("a render fault takes the readout with the frame it was reading", async ({ page }) => {
  await page.goto(appUrl());
  await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
  expect((await readout(page)).shown).toBe(true);
  await page.evaluate(() => {
    window.HOLO.renderer.render = () => { throw new Error("forced"); };
    window.HOLO_APP.dispatch({ type: "turn", dir: "right" });
  });
  const r = await readout(page);
  expect(r.shown, "the page has disowned the frame; the label goes too").toBe(false);
  expect({ place: r.place, facing: r.facing }).toEqual({ place: "", facing: "" });
  expect(await page.locator("#narration p").last().textContent())
    .toBe("The projection wavers; the pattern will not resolve.");
});
