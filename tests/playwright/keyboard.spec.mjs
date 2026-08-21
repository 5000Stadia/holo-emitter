/* keyboard.spec — row 10: keyboard and assistive access to scene entities,
 * accessible names, and prefers-reduced-motion.
 *
 * Deliberately does NOT touch voice.spec.mjs or walkthrough.spec.mjs (row 8's
 * sibling done clause reads "unmodified"; this file holds the same
 * discipline for consistency and because the delicately-pinned §12.1 script
 * is not a safe thing to add branches to). It parses design/surface-strings.md
 * standalone — see `auditClean` — the same shape fullscreen.spec.mjs uses.
 *
 * The keyboard-only journey below is the row's own required deliverable
 * ("a keyboard-only walkthrough variant test proving §12.1's journey works
 * with no pointer") and is also the genuine, honest witness for every new
 * entity/go-control string that voice.spec.mjs's own (unfixed, out-of-scope)
 * sweep never reaches — see design/architecture.md and intention row 14 for
 * why that sweep never leaves the study on the shipped fixture.
 */
import { test, expect, appUrl, repoRoot, POINTER_VIEWPORT, stageTree, removeTree, equipContext } from "./helpers.mjs";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const AUDIT = join(repoRoot, "design", "surface-strings.md");
const auditText = readFileSync(AUDIT, "utf8");

function fenced(name) {
  const m = auditText.match(new RegExp("```" + name + "\\n([\\s\\S]*?)```"));
  if (!m) throw new Error(`design/surface-strings.md has no \`\`\`${name} block`);
  return m[1].split("\n").filter((l) => l.trim() !== "");
}

const knownStrings = new Set(
  fenced("STRINGS").map((line) => {
    let rest = line;
    for (let i = 0; i < 6; i++) rest = rest.slice(rest.indexOf(" | ") + 3);
    return rest;
  })
);
const VOCAB = fenced("VOCABULARY").map((line) => {
  const at = line.indexOf(" | ");
  return { list: line.slice(0, at).trim(), re: new RegExp(line.slice(at + 3), "i") };
});
const DEVELOPER = VOCAB.filter((v) => v.list === "DEVELOPER");
const METHOD = VOCAB.filter((v) => v.list === "METHOD");

function auditClean(s) {
  for (const v of DEVELOPER) expect(v.re.test(s), `developer speech — ${s}`).toBe(false);
  for (const v of METHOD) expect(v.re.test(s), `method speech — ${s}`).toBe(false);
  expect(knownStrings.has(s), `not in the audit — ${s}`).toBe(true);
}

test.use({ viewport: POINTER_VIEWPORT });

/** Tab forward (bounded) until the focused element's aria-label matches, or
 * fail loudly rather than silently timing out into a false negative
 * elsewhere. This is real Tab navigation, not a jump to a known selector —
 * the row's own claim is reachability, so the test has to actually walk
 * there. */
async function tabToLabel(page, label, maxPresses = 40) {
  /* Reset to a known, always-present anchor (the left chevron) before each
     hunt, rather than continuing forward from wherever the last hunt
     landed or calling blur() to nothing. Two real cross-engine surprises
     forced this shape, both found by running it rather than reasoning about
     it: (1) #narration is the last tabbable element in the document
     (nothing has a tabindex after it), and Firefox's headless Tab cycle
     does not wrap back to the top the way Chromium's does — it simply
     stalls on #narration forever once reached, so a bound tuned against
     Chromium silently starves on Firefox. (2) document.activeElement.blur()
     does not reliably return Firefox's *next-Tab-stop* cursor to the top of
     the document either — observed directly: blurring a button Tab had
     just reached, then pressing Tab once, re-landed on that same button
     before advancing, an internal navigation-cursor quirk blur() does not
     reset. Focusing a known real element sidesteps both: it is an
     unambiguous position Tab always advances forward from, on both
     engines. */
  await page.evaluate(() => { document.getElementById("chevron-left").focus(); });
  for (let i = 0; i < maxPresses; i++) {
    await page.keyboard.press("Tab");
    const current = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? el.getAttribute("aria-label") : null;
    });
    if (current === label) return true;
  }
  return false;
}

async function activeLabel(page) {
  return page.evaluate(() => {
    const el = document.activeElement;
    return el ? el.getAttribute("aria-label") : null;
  });
}

async function lastNarration(page) {
  return page.evaluate(() => {
    const ps = document.querySelectorAll("#narration p");
    return ps.length ? ps[ps.length - 1].textContent : null;
  });
}

async function worldState(page) {
  return page.evaluate(() => {
    const h = window.HOLO_APP.harness;
    return {
      viewstate: h.viewstate,
      desk: h.world.entities.find((e) => e.id === "desk1").state,
      door: h.world.entities.find((e) => e.id === "door1").state,
      relations: h.world.relations
    };
  });
}

test.describe("the keyboard-only journey (row 10, no pointer at all)", () => {
  test("every beat of the §12.1 journey is reachable and completes with no mouse event", async ({ page }) => {
    await page.goto(appUrl());
    await page.waitForFunction(() => !!window.HOLO_APP);
    let s = await worldState(page);
    expect(s.viewstate).toEqual({ location: "study", facing: "N" });

    // Chair refusal — via Space, proving both activation keys work (Enter
    // does the rest of the journey).
    expect(await tabToLabel(page, "the joined wainscot chair")).toBe(true);
    auditClean(await activeLabel(page));
    await page.keyboard.press("Space");
    expect(await lastNarration(page)).toBe(
      "The chair is joined oak through and through; nothing in it opens or shuts.");
    s = await worldState(page);
    expect(s.desk).toBe("closed");

    // Open the desk (reveal).
    expect(await tabToLabel(page, "open the joined oak writing desk")).toBe(true);
    await page.keyboard.press("Enter");
    s = await worldState(page);
    expect(s.desk).toBe("open");
    expect(await lastNarration(page)).toBe(
      "The drawer resists, then gives. Inside, an iron key.");

    // Take the key.
    expect(await tabToLabel(page, "take the iron key")).toBe(true);
    auditClean(await activeLabel(page));
    await page.keyboard.press("Enter");
    s = await worldState(page);
    expect(s.relations).toContainEqual(["held_by", "key1", "player"]);

    // Take the notebook.
    expect(await tabToLabel(page, "take the vellum notebook")).toBe(true);
    await page.keyboard.press("Enter");
    s = await worldState(page);
    expect(s.relations).toContainEqual(["held_by", "note1", "player"]);

    // Close the desk (its control now reads the closing verb).
    expect(await tabToLabel(page, "close the joined oak writing desk")).toBe(true);
    await page.keyboard.press("Enter");
    s = await worldState(page);
    expect(s.desk).toBe("closed");

    // Turn to face the door (ordinary keyboard turning, unaffected by this row).
    await page.keyboard.press("ArrowRight");
    s = await worldState(page);
    expect(s.viewstate).toEqual({ location: "study", facing: "E" });

    // Open the door.
    expect(await tabToLabel(page, "open the plank door")).toBe(true);
    await page.keyboard.press("Enter");
    s = await worldState(page);
    expect(s.door).toBe("open");

    // Walk through via the go-control — a target distinct from the door's
    // own control, exactly mirroring the pointer model's two targets.
    expect(await tabToLabel(page, "walk through the plank door")).toBe(true);
    auditClean(await activeLabel(page));
    await page.keyboard.press("Enter");
    s = await worldState(page);
    expect(s.viewstate).toEqual({ location: "hall", facing: "E" });
    expect(await lastNarration(page)).toBe(
      "You step through into the hall. The air is wider here, and cooler.");

    // Turn to the hall's furnished facing (right = clockwise, so LEFT from
    // E reaches N directly: RING = [N,E,S,W], step -1).
    await page.keyboard.press("ArrowLeft");
    s = await worldState(page);
    expect(s.viewstate).toEqual({ location: "hall", facing: "N" });

    expect(await tabToLabel(page, "the back-panelled oak bookcase")).toBe(true);
    auditClean(await activeLabel(page));
    await page.keyboard.press("Enter");
    expect(await lastNarration(page)).toBe(
      "The shelf is fixed boards, pegged fast; it keeps no hinge and no drawer.");

    expect(await tabToLabel(page, "the brass candlestick")).toBe(true);
    auditClean(await activeLabel(page));
    await page.keyboard.press("Enter");
    expect(await lastNarration(page)).toBe(
      "The candlestick is a single casting of brass; there is nothing in it to work.");

    expect(await tabToLabel(page, "take the silver coin")).toBe(true);
    auditClean(await activeLabel(page));
    await page.keyboard.press("Enter");
    s = await worldState(page);
    expect(s.relations).toContainEqual(["held_by", "coin1", "player"]);

    // Turn to the door's own hall-side facing and go back.
    await page.keyboard.press("ArrowLeft");
    s = await worldState(page);
    expect(s.viewstate).toEqual({ location: "hall", facing: "W" });

    // The door is still open (nothing closed it), so its control reads the
    // closing verb here — genuinely observing the paired string on the
    // other side of the passage.
    expect(await tabToLabel(page, "close the plank door")).toBe(true);
    auditClean(await activeLabel(page));

    expect(await tabToLabel(page, "walk through the plank door")).toBe(true);
    await page.keyboard.press("Enter");
    s = await worldState(page);
    expect(s.viewstate).toEqual({ location: "study", facing: "W" });
    expect(await lastNarration(page)).toBe(
      "You pass back into the study, where ink and oak dust close about you again.");
  });
});

test.describe("accessible names", () => {
  test("every control at study/N, study/E (both door states) and hall/N", async ({ page }) => {
    await page.goto(appUrl());
    await page.waitForFunction(() => !!window.HOLO_APP);

    const labelsAt = async () => page.evaluate(() =>
      [...document.querySelectorAll("#entity-controls button")]
        .map((b) => b.getAttribute("aria-label")));

    expect((await labelsAt()).sort()).toEqual([
      "open the joined oak writing desk", "the joined wainscot chair", "take the vellum notebook"
    ].sort());

    await page.evaluate(() => window.HOLO_APP.dispatch({ type: "turn", dir: "right" }));
    expect(await labelsAt()).toEqual(["open the plank door"]);

    await page.evaluate(() => window.HOLO_APP.dispatch({ type: "toggle", entity: "door1" }));
    expect((await labelsAt()).sort()).toEqual(
      ["close the plank door", "walk through the plank door"].sort());

    await page.evaluate(() => {
      window.HOLO_APP.dispatch({ type: "go", exit: "door_study_hall" });
      window.HOLO_APP.dispatch({ type: "turn", dir: "left" });
    });
    expect((await labelsAt()).sort()).toEqual([
      "the back-panelled oak bookcase", "the brass candlestick", "take the silver coin"
    ].sort());

    for (const l of await labelsAt()) auditClean(l);
  });

  test("the scene canvas carries role=img and its own accessible name", async ({ page }) => {
    await page.goto(appUrl());
    await page.waitForFunction(() => !!window.HOLO_APP);
    const canvas = page.locator("#scene");
    await expect(canvas).toHaveAttribute("role", "img");
    const label = await canvas.getAttribute("aria-label");
    expect(label).toBe("what you see");
    auditClean(label);
  });
});

test.describe("focus order", () => {
  test("#entity-controls order matches the layout's own draw order, go-control last", async ({ page }) => {
    await page.goto(appUrl());
    await page.waitForFunction(() => !!window.HOLO_APP);
    await page.evaluate(() => {
      window.HOLO_APP.dispatch({ type: "turn", dir: "right" }); // study/E
      window.HOLO_APP.dispatch({ type: "toggle", entity: "door1" }); // opens: go-control appears
    });
    const order = await page.evaluate(() => {
      const domIds = [...document.querySelectorAll("#entity-controls button")]
        .map((b) => b.getAttribute("data-target-id"));
      const layoutIds = window.__T.currentLayout().map((e) => e.id);
      const goIds = domIds.filter((id) => !layoutIds.includes(id));
      return { domIds, layoutIds, goIds };
    });
    // Every layout id appears in the DOM in the same relative order it
    // appears in currentLayout (the go-control, not a layout member, is
    // filtered out for this half of the comparison).
    const domLayoutOnly = order.domIds.filter((id) => order.layoutIds.includes(id));
    expect(domLayoutOnly).toEqual(order.layoutIds);
    // And the go-control(s), if any, are the trailing element(s).
    if (order.goIds.length) {
      expect(order.domIds.slice(-order.goIds.length)).toEqual(order.goIds);
    }
    // DOM order overall: chevrons, then fullscreen, then #entity-controls.
    const topOrder = await page.evaluate(() =>
      [...document.getElementById("stage").children].map((el) => el.id));
    expect(topOrder.slice(0, 3)).toEqual(["scene", "overlay", "veil"]);
    expect(topOrder.slice(3, 6)).toEqual(["chevron-left", "chevron-right", "fullscreen-toggle"]);
    expect(topOrder[6]).toBe("entity-controls");
  });
});

test.describe("focus survives a repaint", () => {
  test("the same id keeps focus when it still has a control; is dropped when it does not", async ({ page }) => {
    await page.goto(appUrl());
    await page.waitForFunction(() => !!window.HOLO_APP);
    // Programmatically focus desk1's control (a targeted unit check; the
    // journey test above already proves real Tab reachability end to end).
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll("#entity-controls button")]
        .find((b) => b.getAttribute("data-target-id") === "desk1");
      btn.focus();
    });
    await page.keyboard.press("Enter"); // opens the desk — a repaint happens
    const after = await page.evaluate(() => document.activeElement.getAttribute("data-target-id"));
    expect(after, "desk1 still has a control, so focus follows it").toBe("desk1");

    // Take the key: its control disappears entirely.
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll("#entity-controls button")]
        .find((b) => b.getAttribute("data-target-id") === "key1");
      btn.focus();
    });
    await page.keyboard.press("Enter");
    const dropped = await page.evaluate(() => {
      const ec = document.getElementById("entity-controls");
      return !ec.contains(document.activeElement);
    });
    expect(dropped, "no control names key1 any more, so focus is not left dangling on one").toBe(true);
  });
});

test.describe("reduced motion is a true instant cut", () => {
  test("the go veil never gains .on under the preference; it does without it", async ({ browser }) => {
    const reduced = await equipContext(
      await browser.newContext({ reducedMotion: "reduce", viewport: POINTER_VIEWPORT }));
    const rp = await reduced.newPage();
    await rp.goto(appUrl());
    await rp.waitForFunction(() => !!window.HOLO_APP);
    const onDuringReduced = await rp.evaluate(() => {
      window.HOLO_APP.dispatch({ type: "turn", dir: "right" }); // face the door (study/E)
      window.HOLO_APP.dispatch({ type: "toggle", entity: "door1" });
      window.HOLO_APP.dispatch({ type: "go", exit: "door_study_hall" });
      return document.getElementById("veil").classList.contains("on");
    });
    expect(onDuringReduced, "reduced motion: the veil sequence never runs").toBe(false);
    await reduced.close();

    const normal = await equipContext(
      await browser.newContext({ reducedMotion: "no-preference", viewport: POINTER_VIEWPORT }));
    const np = await normal.newPage();
    await np.goto(appUrl());
    await np.waitForFunction(() => !!window.HOLO_APP);
    const onDuringNormal = await np.evaluate(() => {
      window.HOLO_APP.dispatch({ type: "turn", dir: "right" });
      window.HOLO_APP.dispatch({ type: "toggle", entity: "door1" });
      window.HOLO_APP.dispatch({ type: "go", exit: "door_study_hall" });
      return document.getElementById("veil").classList.contains("on");
    });
    expect(onDuringNormal, "normal motion: the veil goes black synchronously with the repaint").toBe(true);
    await normal.close();
  });
});

test.describe("fault withdrawal", () => {
  test("a render fault clears #entity-controls and drops any focus inside it", async ({ page }) => {
    await page.goto(appUrl());
    await page.waitForFunction(() => !!window.HOLO_APP);
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll("#entity-controls button")][0];
      if (btn) btn.focus();
      window.HOLO.renderer.render = () => { throw new Error("forced"); };
      window.HOLO_APP.dispatch({ type: "turn", dir: "right" });
    });
    const st = await page.evaluate(() => ({
      count: document.getElementById("entity-controls").children.length,
      focusInside: document.getElementById("entity-controls").contains(document.activeElement)
    }));
    expect(st.count).toBe(0);
    expect(st.focusInside).toBe(false);
  });
});

test.describe("the mouse path is unaffected", () => {
  test("a click on the canvas reaches the canvas, not a new invisible control", async ({ page }) => {
    await page.goto(appUrl());
    await page.waitForFunction(() => !!window.HOLO_APP);
    const box = await page.locator("#scene").boundingBox();
    const pt = await page.evaluate(() => window.__T.clickPoint("desk1"));
    await page.mouse.click(box.x + (pt.x * box.width) / 1536, box.y + (pt.y * box.height) / 1024);
    const st = await page.evaluate(() => ({
      desk: window.HOLO_APP.harness.world.entities.find((e) => e.id === "desk1").state,
      activeIsBody: document.activeElement === document.body
    }));
    expect(st.desk, "the click still worked exactly as before").toBe("open");
    expect(st.activeIsBody, "no invisible control intercepted the click").toBe(true);
  });
});

test.describe("degenerate noun fallback", () => {
  test("a record with no usable noun falls back to 'something here', with a console fault", async ({ page }) => {
    const dir = stageTree();
    try {
      const p = join(dir, "src", "placeholders.js");
      writeFileSync(p, readFileSync(p, "utf8").replace('"noun": "iron key",', ""));
      const errors = [];
      page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
      await page.goto(appUrl(dir));
      await page.waitForFunction(() => !!window.HOLO_APP);
      await page.evaluate(() => window.HOLO_APP.dispatch({ type: "toggle", entity: "desk1" }));
      const label = await page.evaluate(() => {
        const btn = [...document.querySelectorAll("#entity-controls button")]
          .find((b) => b.getAttribute("data-target-id") === "key1");
        return btn ? btn.getAttribute("aria-label") : null;
      });
      expect(label, "named, and in the product's voice").toBe("something here");
      auditClean(label);
      expect(errors.some((e) => e.includes("entity control: record has no usable noun")),
        "console carries it").toBe(true);
    } finally {
      removeTree(dir);
    }
  });
});
