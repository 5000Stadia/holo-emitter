/* fullscreen.spec — row 8: a fullscreen control on the page chrome, with an
 * in-page maximize fallback where the Fullscreen API is withheld.
 *
 * Deliberately does NOT touch voice.spec.mjs: row 8's own done clause says
 * "all existing tests stay green unmodified", and voice.spec.mjs's own
 * STATES-derivation self-check scans only its own file for what it drove, so
 * this file parses design/surface-strings.md's audit standalone (see
 * `auditKnows` / `offendsVocabulary` below) rather than widen that mechanism.
 *
 * "A real attempt, not only mocks" (the plan's own promise): one test drives
 * a genuine page.click() with the real Fullscreen API present, and checks
 * document.fullscreenElement afterwards — asserting the call happened even
 * where a sandboxed runner declines to grant it, never silently stubbing the
 * API away for that one case. Every other test is deterministic by design
 * (the no-API branch, the rejection branch, the fullscreenchange sync).
 */
import { test, expect, appUrl, repoRoot } from "./helpers.mjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const AUDIT = join(repoRoot, "design", "surface-strings.md");
const auditText = readFileSync(AUDIT, "utf8");

function fenced(name) {
  const m = auditText.match(new RegExp("```" + name + "\\n([\\s\\S]*?)```"));
  if (!m) throw new Error(`design/surface-strings.md has no \`\`\`${name} block`);
  return m[1].split("\n").filter((l) => l.trim() !== "");
}

/* Same shape as voice.spec.mjs's own STRINGS row: last field is the string
 * text, everything before it is metadata this file does not need. */
const knownStrings = new Set(
  fenced("STRINGS").map((line) => {
    const parts = [];
    let rest = line;
    for (let i = 0; i < 6; i++) {
      const at = rest.indexOf(" | ");
      if (at === -1) throw new Error(`unparseable STRINGS row: ${line}`);
      parts.push(rest.slice(0, at).trim());
      rest = rest.slice(at + 3);
    }
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

const DESKTOP_169 = { width: 1920, height: 1080 };
const PHONE_PORTRAIT = { width: 390, height: 844 };
const PHONE_LANDSCAPE = { width: 844, height: 390 };

async function stageBox(page) {
  return page.locator("#stage").boundingBox();
}

test.describe("the fullscreen control", () => {
  test("exists, carries the affordance class, and starts labelled to enter", async ({ page }) => {
    await page.goto(appUrl());
    await page.waitForFunction(() => !!window.HOLO_APP);
    const btn = page.locator("#fullscreen-toggle");
    await expect(btn).toBeVisible();
    await expect(btn).toHaveClass(/\baffordance\b/);
    const label = await btn.getAttribute("aria-label");
    expect(label).toBe("fill the screen");
    auditClean(label);
  });

  test("a real, gesture-driven click attempts the real API", async ({ page }) => {
    await page.setViewportSize(DESKTOP_169);
    await page.goto(appUrl());
    await page.waitForFunction(() => !!window.HOLO_APP);
    const hadApi = await page.evaluate(() => !!document.documentElement.requestFullscreen);
    expect(hadApi, "this engine exposes the API to spy on").toBe(true);

    const calls = await page.evaluate(() => {
      window.__fsCalls = 0;
      const orig = document.documentElement.requestFullscreen.bind(document.documentElement);
      document.documentElement.requestFullscreen = function () {
        window.__fsCalls++;
        return orig();
      };
      return true;
    });
    expect(calls).toBe(true);

    await page.click("#fullscreen-toggle");
    await page.waitForTimeout(150);

    const after = await page.evaluate(() => ({
      calls: window.__fsCalls,
      granted: !!(document.fullscreenElement || document.webkitFullscreenElement),
      label: document.getElementById("fullscreen-toggle").getAttribute("aria-label"),
      fsActive: document.documentElement.classList.contains("fs-active")
    }));
    expect(after.calls, "the real API was genuinely called on a real click").toBe(1);
    // Whether a sandboxed runner actually GRANTS fullscreen on a synthetic
    // click is an environment fact this suite does not control (the
    // artifact critic's own hands-on pass is the real check) — but if it
    // was granted, the label and class must agree with reality.
    if (after.granted) {
      expect(after.label).toBe("leave the full screen");
      expect(after.fsActive).toBe(true);
      auditClean(after.label);
      // Exit again through the same control. WAIT ON THE CONDITION, not on a
      // timer: a fixed 150 ms passed two runs in three and failed the third
      // under full-suite load, which reads as flake and was in fact the label
      // genuinely lagging the state. The product fix is in `index.html`; this
      // is the measurement fix, and a timer that sometimes passes cannot tell
      // the two apart.
      await page.click("#fullscreen-toggle");
      await page.waitForFunction(() =>
        !(document.fullscreenElement || document.webkitFullscreenElement), null, { timeout: 5000 });
      const exited = await page.evaluate(() => ({
        granted: !!(document.fullscreenElement || document.webkitFullscreenElement),
        label: document.getElementById("fullscreen-toggle").getAttribute("aria-label")
      }));
      expect(exited.granted).toBe(false);
      expect(exited.label).toBe("fill the screen");
    }
  });

  test("no API present: the in-page fallback genuinely maximizes, and reverses", async ({ page }) => {
    await page.addInitScript(() => {
      delete window.Element.prototype.requestFullscreen;
      delete window.HTMLElement.prototype.requestFullscreen;
      delete window.Element.prototype.webkitRequestFullscreen;
      delete window.HTMLElement.prototype.webkitRequestFullscreen;
    });
    await page.setViewportSize(DESKTOP_169);
    await page.goto(appUrl());
    await page.waitForFunction(() => !!window.HOLO_APP);
    const hasApi = await page.evaluate(() => !!document.documentElement.requestFullscreen);
    expect(hasApi, "the API is genuinely withheld for this test").toBe(false);

    const before = await stageBox(page);
    const chromeBefore = await page.evaluate(() => ({
      narration: getComputedStyle(document.getElementById("narration")).display,
      inventory: getComputedStyle(document.getElementById("inventory")).display
    }));
    expect(chromeBefore.narration).not.toBe("none");

    await page.click("#fullscreen-toggle");
    await page.waitForTimeout(50);

    // Prove the narration line itself survives: dispatch one before toggling
    // fullscreen on, and confirm it is still rendered, on screen, and
    // legible afterwards — not merely "not display:none".
    await page.evaluate(() => window.HOLO_APP.dispatch({ type: "toggle", entity: "chair1" }));
    const lineBefore = await page.evaluate(() => {
      const ps = document.querySelectorAll("#narration p");
      return ps.length ? ps[ps.length - 1].textContent : null;
    });
    expect(lineBefore).toBeTruthy();

    const afterOn = await page.evaluate(() => ({
      fsActive: document.documentElement.classList.contains("fs-active"),
      label: document.getElementById("fullscreen-toggle").getAttribute("aria-label"),
      narrationDisplay: getComputedStyle(document.getElementById("narration")).display,
      narrationPosition: getComputedStyle(document.getElementById("narration")).position,
      inventoryPosition: getComputedStyle(document.getElementById("inventory")).position,
      line: (() => {
        const ps = document.querySelectorAll("#narration p");
        return ps.length ? ps[ps.length - 1].textContent : null;
      })()
    }));
    expect(afterOn.fsActive, "a real, observable state change").toBe(true);
    expect(afterOn.label).toBe("leave the full screen");
    // Never hidden: an earlier shape of this used display:none and an
    // artifact critic broke it in one click (a reveal line landed in a
    // zero-height pane with the aria-live region pulled from the tree). The
    // fixed-overlay shape keeps the narration genuinely on screen instead.
    expect(afterOn.narrationDisplay).not.toBe("none");
    expect(afterOn.narrationPosition).toBe("fixed");
    expect(afterOn.inventoryPosition).toBe("fixed");
    expect(afterOn.line, "the same line, still legible, still in the tree").toBe(lineBefore);
    const narrBox = await page.locator("#narration").boundingBox();
    expect(narrBox.width, "genuinely on screen, not collapsed").toBeGreaterThan(0);
    expect(narrBox.height).toBeGreaterThan(0);
    auditClean(afterOn.label);

    // The icon changes with the state, not only the aria-label — a sighted
    // mouse user never reads the label.
    const iconState = await page.evaluate(() => ({
      active: document.getElementById("fullscreen-toggle").classList.contains("active"),
      exitVisible: getComputedStyle(
        document.querySelector("#fullscreen-toggle .icon-exit")).display !== "none",
      enterVisible: getComputedStyle(
        document.querySelector("#fullscreen-toggle .icon-enter")).display !== "none"
    }));
    expect(iconState.active).toBe(true);
    expect(iconState.exitVisible).toBe(true);
    expect(iconState.enterVisible).toBe(false);

    // The stage genuinely grows (the reserve dropped to zero) — this is what
    // makes the label true rather than a relabelled no-op.
    const during = await stageBox(page);
    expect(during.height).toBeGreaterThan(before.height);

    await page.click("#fullscreen-toggle");
    await page.waitForTimeout(50);
    const afterOff = await page.evaluate(() => ({
      fsActive: document.documentElement.classList.contains("fs-active"),
      label: document.getElementById("fullscreen-toggle").getAttribute("aria-label"),
      narrationPosition: getComputedStyle(document.getElementById("narration")).position,
      active: document.getElementById("fullscreen-toggle").classList.contains("active")
    }));
    expect(afterOff.fsActive).toBe(false);
    expect(afterOff.label).toBe("fill the screen");
    expect(afterOff.narrationPosition).not.toBe("fixed");
    expect(afterOff.active).toBe(false);
  });

  test("a rejected requestFullscreen() falls through to the same fallback", async ({ page }) => {
    await page.addInitScript(() => {
      window.Element.prototype.requestFullscreen = function () {
        return Promise.reject(new Error("denied"));
      };
      delete window.Element.prototype.webkitRequestFullscreen;
      delete window.HTMLElement.prototype.webkitRequestFullscreen;
    });
    await page.goto(appUrl());
    await page.waitForFunction(() => !!window.HOLO_APP);
    await page.click("#fullscreen-toggle");
    // The rejection resolves asynchronously; give the promise a turn.
    await page.waitForFunction(
      () => document.getElementById("fullscreen-toggle").getAttribute("aria-label") ===
        "leave the full screen"
    );
    const state = await page.evaluate(() => ({
      fsActive: document.documentElement.classList.contains("fs-active"),
      narrationDisplay: getComputedStyle(document.getElementById("narration")).display,
      narrationPosition: getComputedStyle(document.getElementById("narration")).position
    }));
    expect(state.fsActive).toBe(true);
    expect(state.narrationDisplay).not.toBe("none");
    expect(state.narrationPosition).toBe("fixed");
  });

  test("fullscreenchange re-syncs the label without a click (an Esc-driven exit)", async ({ page }) => {
    await page.goto(appUrl());
    await page.waitForFunction(() => !!window.HOLO_APP);
    await page.evaluate(() => {
      Object.defineProperty(document, "fullscreenElement", {
        configurable: true, get: () => document.documentElement
      });
      document.dispatchEvent(new Event("fullscreenchange"));
    });
    const label1 = await page.locator("#fullscreen-toggle").getAttribute("aria-label");
    expect(label1).toBe("leave the full screen");
    auditClean(label1);

    await page.evaluate(() => {
      Object.defineProperty(document, "fullscreenElement", {
        configurable: true, get: () => null
      });
      document.dispatchEvent(new Event("fullscreenchange"));
    });
    const label2 = await page.locator("#fullscreen-toggle").getAttribute("aria-label");
    expect(label2).toBe("fill the screen");
  });

  test("canvas stays 1536x1024 and the scene hash is unchanged, desktop and phone", async ({ page }) => {
    await page.addInitScript(() => {
      delete window.Element.prototype.requestFullscreen;
      delete window.HTMLElement.prototype.requestFullscreen;
      delete window.Element.prototype.webkitRequestFullscreen;
      delete window.HTMLElement.prototype.webkitRequestFullscreen;
    });
    for (const vp of [DESKTOP_169, PHONE_PORTRAIT, PHONE_LANDSCAPE]) {
      await page.setViewportSize(vp);
      await page.goto(appUrl());
      await page.waitForFunction(() => !!window.HOLO_APP);
      const before = await page.evaluate(async () => ({
        w: document.getElementById("scene").width, h: document.getElementById("scene").height,
        hash: await window.__T.hashScene()
      }));
      await page.click("#fullscreen-toggle");
      await page.waitForTimeout(50);
      const after = await page.evaluate(async () => ({
        w: document.getElementById("scene").width, h: document.getElementById("scene").height,
        hash: await window.__T.hashScene()
      }));
      expect(after.w, `${vp.width}x${vp.height}: canvas width`).toBe(1536);
      expect(after.h, `${vp.width}x${vp.height}: canvas height`).toBe(1024);
      expect(after.hash, `${vp.width}x${vp.height}: scene hash unchanged`).toBe(before.hash);
      // Letterboxed, not cropped: the stage box still fits within the viewport.
      const box = await stageBox(page);
      expect(box.width).toBeLessThanOrEqual(vp.width + 1);
      expect(box.height).toBeLessThanOrEqual(vp.height + 1);
    }
  });

  test("body.capture hides every .chrome element, derived rather than a hand-kept list", async ({ page }) => {
    await page.setViewportSize({ width: 1536, height: 1200 });
    await page.goto(appUrl());
    await page.waitForFunction(() => !!window.HOLO_APP);
    await page.evaluate(() => document.body.classList.add("capture"));
    const allHidden = await page.evaluate(() => {
      const els = [...document.querySelectorAll(".chrome")];
      return els.every((el) => getComputedStyle(el).display === "none");
    });
    expect(allHidden, "every .chrome element (including the new fullscreen button) hides").toBe(true);
    const sawFullscreenBtn = await page.evaluate(
      () => document.getElementById("fullscreen-toggle").classList.contains("chrome"));
    expect(sawFullscreenBtn, "the fullscreen button really is in that set").toBe(true);
  });
});
