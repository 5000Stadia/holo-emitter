/* §12.3 — state isolation: toggling the desk changes pixels only within the
 * drawer part's travel union plus the cavity region (2 px pad — antialiasing
 * at fractional scale; a licensed loosening recorded in the close), in BOTH
 * directions, and each direction's diff intersects the part's travel rect
 * OUTSIDE the cavity (a diff attributable to the key appearing/hiding alone
 * would ride a frozen drawer — the part must provably move).
 *
 * The allowed region is computed from record values + the plan-§2 placement
 * math re-implemented test-side (helpers MF — the facing's own literals),
 * never from the renderer's
 * own numbers.
 */
import { test, expect, appUrl, MF } from "./helpers.mjs";

test.describe("§12.3 — state isolation (desk toggle)", () => {
  test("both directions: diff confined to part travel + cavity, and the part moves", async ({ page }) => {
    await page.goto(appUrl());

    // Record data (data input; the math around it is test-side).
    const rec = await page.evaluate(() => ({
      desk: window.__T.clone(window.HOLO_APP.library["desk-joined-oak-1660"].record),
      partPx: {
        w: window.HOLO_APP.library["desk-joined-oak-1660"].images.parts.drawer_front.width,
        h: window.HOLO_APP.library["desk-joined-oak-1660"].images.parts.drawer_front.height
      },
      placement: window.__T.clone(window.HOLO_APP.harness.staging.placements.desk1)
    }));
    const P = MF("study", "N").place(rec.placement, rec.desk);
    const part = rec.desk.parts[0];
    const pad = 2;

    // Part rect at t (test-side re-implementation of the plan-§3 formulas).
    const partRect = (t) => {
      const scale = 1 + (part.slide.scale_open - 1) * t;
      const x = P.drawX + P.f * (part.origin.x + t * part.slide.dx * rec.desk.px.w);
      const y = P.drawY + P.f * (part.origin.y + t * part.slide.dy * rec.desk.px.h);
      return { x0: x, y0: y, x1: x + rec.partPx.w * P.f * scale, y1: y + rec.partPx.h * P.f * scale };
    };
    const closedR = partRect(0);
    const openR = partRect(1);
    const cav = rec.desk.anchors.drawer_cavity;
    const cavityR = {
      x0: P.drawX + P.f * cav.x0, y0: P.drawY + P.f * cav.y0,
      x1: P.drawX + P.f * cav.x1, y1: P.drawY + P.f * cav.y1
    };
    const union = {
      x0: Math.min(closedR.x0, openR.x0, cavityR.x0) - pad,
      y0: Math.min(closedR.y0, openR.y0, cavityR.y0) - pad,
      x1: Math.max(closedR.x1, openR.x1, cavityR.x1) + pad,
      y1: Math.max(closedR.y1, openR.y1, cavityR.y1) + pad
    };
    const travel = {
      x0: Math.min(closedR.x0, openR.x0) - pad,
      y0: Math.min(closedR.y0, openR.y0) - pad,
      x1: Math.max(closedR.x1, openR.x1) + pad,
      y1: Math.max(closedR.y1, openR.y1) + pad
    };

    const res = await page.evaluate(async ({ union, travel, cavityR }) => {
      const grab = (c) => c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
      const scene = document.getElementById("scene");
      const snap = () => {
        const c = document.createElement("canvas");
        c.width = scene.width; c.height = scene.height;
        c.getContext("2d").drawImage(scene, 0, 0);
        return grab(c);
      };
      const diff = (a, b) => {
        const out = { outside: [], travelOutsideCavity: 0, count: 0 };
        for (let y = 0; y < 1024; y++) {
          for (let x = 0; x < 1536; x++) {
            const i = (y * 1536 + x) * 4;
            if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2] || a[i + 3] !== b[i + 3]) {
              out.count++;
              const inUnion = x >= union.x0 && x <= union.x1 && y >= union.y0 && y <= union.y1;
              if (!inUnion && out.outside.length < 12) out.outside.push({ x, y });
              const inTravel = x >= travel.x0 && x <= travel.x1 && y >= travel.y0 && y <= travel.y1;
              const inCavity = x >= cavityR.x0 && x <= cavityR.x1 && y >= cavityR.y0 && y <= cavityR.y1;
              if (inTravel && !inCavity) out.travelOutsideCavity++;
            }
          }
        }
        return out;
      };
      const before = snap();
      window.HOLO_APP.dispatch({ type: "toggle", entity: "desk1" }); // closed -> open (reveals key)
      const open = snap();
      window.HOLO_APP.dispatch({ type: "toggle", entity: "desk1" }); // open -> closed
      const closed = snap();
      return { openDiff: diff(before, open), closeDiff: diff(open, closed) };
    }, { union, travel, cavityR });

    for (const [name, d] of [["closed→open", res.openDiff], ["open→closed", res.closeDiff]]) {
      expect(d.count, `${name}: diff non-empty`).toBeGreaterThan(0);
      expect(d.outside, `${name}: no differing pixel outside part travel + cavity`).toEqual([]);
      expect(d.travelOutsideCavity,
        `${name}: diff intersects the part's travel rect outside the cavity (the drawer moved)`)
        .toBeGreaterThan(0);
    }
  });
});
