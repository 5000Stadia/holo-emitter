/* THE STAIR A PLAYER CAN USE. [Row 25]
 *
 * Rows 15 and 19 drew the flight as a solid with a stepped top and left it
 * climbable from one end. What this file measures is the other end: the share
 * of a flight's OWN DRAWN BODY at which a real pointer travels, per facing,
 * with the descending facings first — because the round that fixed the hit
 * region fixed it for a player standing at the FOOT of a stair and never
 * looked at the head of one, and every guard that failed in that row failed
 * the same way, measured where the fix ran rather than where the defect lived.
 *
 * The drawn body is the renderer's own: the rings it fills in `STAIR_BASE` —
 * `mass_poly` (the stringers) and `treads_poly` (the goings and the risers) —
 * plus `floor_poly`, the footprint it strokes, which on a descending flight is
 * the mouth of the well you step into. Nothing here reads a rectangle: a
 * rectangle round a flight takes in the bare floor beside it, and the point of
 * the case is that the region and the picture are the same set.
 */
import { test, expect, navUrl, POINTER_VIEWPORT, standAt, clickCanvasPoint } from "./helpers.mjs";

/* The phone the Captain walks the live site on. A flight is the one way
   through with no leaf and no jamb, and the chrome takes its largest share of
   the frame here. */
const PHONE = { width: 390, height: 844 };

/* The four facings a flight is a `go` target on — one per direction of each of
   the manor's two stairs. A flight seen side-on is drawn and is not walkable
   (the picture shows the building; the world says where you may walk), so
   those facings are not this case's subject and `manor.spec`'s census is what
   holds them. */
const TRAVEL = [
  { loc: "back_stair", facing: "E", exit: "stair_back_stair_back_stair_head", dir: "up" },
  { loc: "great_stair_hall", facing: "N", exit: "stair_great_stair_hall_stair_landing", dir: "up" },
  { loc: "back_stair_head", facing: "W", exit: "stair_back_stair_head_back_stair", dir: "down" },
  { loc: "stair_landing", facing: "S", exit: "stair_stair_landing_great_stair_hall", dir: "down" }
];

/* Every drawn pixel of the flight, asked what the PAGE would do with a click
   there — `resolve`, the one function that decides what a point means, not
   `apertureAt` and not `hitTest`, either of which is half of it. Sampled every
   `step` px in both axes; the sample is the measurement's resolution and the
   claim is a share of the body, so a coarser step cannot hide a hole bigger
   than itself. */
async function bodyReach(page, exit, step = 2) {
  return page.evaluate(({ exit, step }) => {
    const A = window.HOLO_APP;
    const cv = document.getElementById("scene");
    const fl = (A.metaFor(A.harness.viewstate).stairs || [])[0];
    if (!fl) throw new Error("no flight on this facing");
    const inside = (poly, x, y) => {
      let c = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, yi] = poly[i], [xj, yj] = poly[j];
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
      }
      return c;
    };
    const distTo = (poly, x, y) => {
      let best = Infinity;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const ax = poly[j][0], ay = poly[j][1], bx = poly[i][0], by = poly[i][1];
        const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy;
        let t = len2 > 0 ? ((x - ax) * dx + (y - ay) * dy) / len2 : 0;
        t = t < 0 ? 0 : (t > 1 ? 1 : t);
        const ex = x - (ax + t * dx), ey = y - (ay + t * dy);
        best = Math.min(best, Math.sqrt(ex * ex + ey * ey));
      }
      return best;
    };
    const rings = (fl.mass_poly || []).concat(fl.treads_poly || []);
    if (fl.floor_poly && fl.floor_poly.length >= 3) rings.push(fl.floor_poly);
    let drawn = 0, reached = 0, claimed = 0, region = 0, regionNotDrawn = 0;
    let farthest = 0;
    const misses = [];
    for (let y = 0; y < cv.height; y += step) {
      for (let x = 0; x < cv.width; x += step) {
        let isBody = false;
        for (const r of rings) if (inside(r, x, y)) { isBody = true; break; }
        /* THE REGION ITSELF, geometrically — the outline the meta carries,
           asked without the page's forgiveness ring in the way. */
        const inRegion = fl.poly && fl.poly.length >= 3 && inside(fl.poly, x, y);
        let r = null;
        try { r = A.resolve({ x, y }); } catch (e) { r = { kind: "threw" }; }
        const travels = !!(r && r.kind === "doorway" && r.aperture && r.aperture.exit === exit);
        if (isBody) {
          drawn++;
          if (travels) reached++;
          else if (misses.length < 8) misses.push([x, y, r ? r.kind : "null"]);
        }
        if (inRegion) {
          region++;
          if (!isBody) regionNotDrawn++;
        }
        if (travels) {
          claimed++;
          /* How far outside the drawn body a point that answers "climb" lies.
             §7 grants every target a hand's-width ring; nothing may answer
             from farther out than that. */
          if (!isBody) {
            let d = Infinity;
            for (const r2 of rings) d = Math.min(d, distTo(r2, x, y));
            farthest = Math.max(farthest, d);
          }
        }
      }
    }
    const k = step * step;
    return {
      drawnPx: drawn * k,
      reachedPct: drawn ? (reached * 100) / drawn : 0,
      claimedPx: claimed * k,
      regionOverClaimPct: region ? (regionNotDrawn * 100) / region : 0,
      farthestClaimPx: farthest,
      misses
    };
  }, { exit, step });
}

test.describe("a click on a drawn flight travels, at both ends of every stair", () => {
  for (const t of TRAVEL) {
    test(`${t.loc}/${t.facing} — the ${t.dir} view: every drawn pixel of the flight is the flight`,
      async ({ page }) => {
        test.setTimeout(180_000);
        await page.setViewportSize(POINTER_VIEWPORT);
        await page.goto(navUrl());
        await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
        await standAt(page, t.loc, t.facing);
        const m = await bodyReach(page, t.exit);
        /* The flight has to BE there before its reach means anything: a facing
           that drew nothing would report 100 % of nothing. */
        expect(m.drawnPx, `${t.loc}/${t.facing} draws a flight at all`).toBeGreaterThan(20_000);
        expect(m.reachedPct,
          `${t.loc}/${t.facing}: the share of the drawn flight a real point climbs — misses at ${JSON.stringify(m.misses)}`)
          .toBe(100);
        /* AND IT CLAIMS NOTHING ELSE, in two halves — without them the case is
           satisfied by widening the region to the frame, which is the overshoot
           the outline exists to refuse ("climb the stair" for a click on the
           bare floor beside it).

           The REGION, geometrically: the outline the meta carries against the
           rings the renderer draws. A flight's visible body is convex but for
           the sawtooth its own mass fills in, so its hull is the same set as
           its drawing to within the sampling grid — 1 % is that grid at the
           outline, not a licence. */
        expect(m.regionOverClaimPct,
          `${t.loc}/${t.facing}: the share of the hit region the picture draws no stair in`)
          .toBeLessThan(1);
        /* And the PAGE, which adds §7's hand's-width ring: nothing may answer
           "climb" from farther outside the drawn body than that ring, measured
           to the body's own edges. 4 CSS px at this 1:1 viewport, plus the 2 px
           sampling step. A ring measured from the rectangle instead — which is
           why this ring used to skip flights altogether — would put this at
           hundreds of pixels on `great_stair_hall/N`. */
        expect(m.farthestClaimPx,
          `${t.loc}/${t.facing}: how far outside its own drawn body the flight answers a click`)
          .toBeLessThanOrEqual(6);
      });
  }

  /* AND ON A PHONE, where the stage is scaled to a quarter and the chrome is
     at its largest. The share is read the same way; what changes is that every
     canvas pixel is a quarter of a CSS pixel, so a region that only worked at
     1:1 — or a ring measured in the wrong space — shows up here. */
  for (const t of TRAVEL) {
    test(`${t.loc}/${t.facing} — the ${t.dir} view, on a phone`, async ({ page }) => {
      test.setTimeout(180_000);
      await page.setViewportSize(PHONE);
      await page.goto(navUrl());
      await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
      await standAt(page, t.loc, t.facing);
      const m = await bodyReach(page, t.exit);
      expect(m.drawnPx, `${t.loc}/${t.facing} draws a flight at all`).toBeGreaterThan(20_000);
      expect(m.reachedPct,
        `${t.loc}/${t.facing} on a phone: the share of the drawn flight a real point climbs — misses at ${JSON.stringify(m.misses)}`)
        .toBe(100);
      /* The ring is 4 CSS px, which is 15.75 canvas px at this width — so the
         bound is the ring in the space it is measured in, not a constant
         copied from the desktop case. */
      expect(m.farthestClaimPx,
        `${t.loc}/${t.facing} on a phone: how far outside its own drawn body the flight answers a tap`)
        .toBeLessThanOrEqual(4 * (1536 / 390) + 2);
    });
  }

  /* AND WITH A REAL MOUSE, at the head of each stair, on the two facings the
     hand-off measured at 0 % and 71.8 %. `resolve` is what the page uses, but
     a case that only ever asks a function cannot see chrome laid over the
     picture, a stage scaled away from 1:1, or a click swallowed by a guard —
     three things that have each eaten a gesture in this project before. */
  for (const t of TRAVEL.filter((q) => q.dir === "down")) {
    test(`${t.loc}/${t.facing} — a real click at the far corners of the drawn flight goes down`,
      async ({ page }) => {
        test.setTimeout(180_000);
        await page.setViewportSize(POINTER_VIEWPORT);
        await page.goto(navUrl());
        await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
        await standAt(page, t.loc, t.facing);
        /* The extremes of the drawn body, not its centre: the centre of a
           descending flight's body is inside its own footprint ring, which is
           the one part of it the shipped hit region did hold. */
        const pts = await page.evaluate(() => {
          const A = window.HOLO_APP;
          const cv = document.getElementById("scene");
          const fl = (A.metaFor(A.harness.viewstate).stairs || [])[0];
          const inside = (poly, x, y) => {
            let c = false;
            for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
              const [xi, yi] = poly[i], [xj, yj] = poly[j];
              if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
            }
            return c;
          };
          const rings = (fl.mass_poly || []).concat(fl.treads_poly || []);
          const body = [];
          for (let y = 0; y < cv.height; y += 2) {
            for (let x = 0; x < cv.width; x += 2) {
              for (const r of rings) if (inside(r, x, y)) { body.push([x, y]); break; }
            }
          }
          const pick = (f) => body.reduce((a, b) => (f(b) > f(a) ? b : a));
          return {
            top: pick((p) => -p[1]), bottom: pick((p) => p[1]),
            left: pick((p) => -p[0]), right: pick((p) => p[0])
          };
        });
        const dest = await page.evaluate((exit) => {
          const A = window.HOLO_APP;
          return (A.harness.world.locations.find((l) => l.id === A.harness.viewstate.location)
            .exits || []).find((e) => e.id === exit).to;
        }, t.exit);
        for (const [name, p] of Object.entries(pts)) {
          await clickCanvasPoint(page, { x: p[0], y: p[1] });
          await page.waitForTimeout(600);
          const after = await page.evaluate(() => window.HOLO_APP.harness.viewstate.location);
          expect({ corner: name, at: [p[0], p[1]], room: after },
            `a real click on the ${name}most drawn pixel of the flight walks down it`)
            .toEqual({ corner: name, at: [p[0], p[1]], room: dest });
          /* back to the head of the stair for the next corner */
          await page.goto(navUrl());
          await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
          await standAt(page, t.loc, t.facing);
        }
      });
  }
});
