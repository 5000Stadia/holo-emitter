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

/* EVERY FACING THAT DRAWS A FLIGHT, not only the four the exit is stated on
   [Navigator ruling at the row-25 plan's second revision: the row's text
   governs unamended — "a real click on any drawn pixel of any flight travels",
   with the descending facings as the proof set]. Twelve of the manor's
   eighty-eight draw one; the four whose standpoint stands INSIDE a flight
   honestly draw none and are absent here, which `manor.spec`'s census holds.

   `travel` marks the four the exit's own facing is, where a click is a `go`
   and nothing else; on the other eight the click turns you to the flight and
   then walks it, which is the same two intents a keyboard user presses. */
const FLIGHTS = [
  { loc: "back_stair", facing: "E", exit: "stair_back_stair_back_stair_head", dir: "up", travel: true },
  { loc: "back_stair", facing: "S", exit: "stair_back_stair_back_stair_head", dir: "up" },
  { loc: "back_stair", facing: "W", exit: "stair_back_stair_back_stair_head", dir: "up" },
  { loc: "great_stair_hall", facing: "N", exit: "stair_great_stair_hall_stair_landing", dir: "up", travel: true },
  { loc: "great_stair_hall", facing: "S", exit: "stair_great_stair_hall_stair_landing", dir: "up" },
  { loc: "great_stair_hall", facing: "W", exit: "stair_great_stair_hall_stair_landing", dir: "up" },
  { loc: "back_stair_head", facing: "W", exit: "stair_back_stair_head_back_stair", dir: "down", travel: true },
  { loc: "back_stair_head", facing: "E", exit: "stair_back_stair_head_back_stair", dir: "down" },
  { loc: "back_stair_head", facing: "S", exit: "stair_back_stair_head_back_stair", dir: "down" },
  { loc: "stair_landing", facing: "S", exit: "stair_stair_landing_great_stair_hall", dir: "down", travel: true },
  { loc: "stair_landing", facing: "N", exit: "stair_stair_landing_great_stair_hall", dir: "down" },
  { loc: "stair_landing", facing: "W", exit: "stair_stair_landing_great_stair_hall", dir: "down" }
];
const TRAVEL = FLIGHTS.filter((f) => f.travel);

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
        /* THE REGION ITSELF, geometrically — the rings the meta carries, asked
           without the page's forgiveness ring in the way. */
        let inRegion = false;
        for (const r0 of (fl.hit_polys || [])) {
          if (r0.length >= 3 && inside(r0, x, y)) { inRegion = true; break; }
        }
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
  for (const t of FLIGHTS) {
    test(`${t.loc}/${t.facing} — the ${t.dir} view${t.travel ? "" : ", seen from beside it"}: every drawn pixel of the flight is the flight`,
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
  for (const t of FLIGHTS) {
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
  for (const t of FLIGHTS.filter((q) => q.dir === "down" && (q.travel || q.facing === "W"))) {
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

/* THE ONE KEY ON THE FLIGHT. [Row 25 (b)]
 *
 * The flight was one flat `#4a5870` over every face — 22.2 % of
 * `great_stair_hall/W` and 31.7 % of `back_stair/E` in a single value, tread
 * top and riser and stringer alike — the only unlit solid in a product whose
 * §7 rules one key and whose two side returns already obey it.
 *
 * Every bar below was written into `design/specs/25-…md` before the shading
 * existed, and every one is an ORDERING or a floor rather than a level, so a
 * build cannot satisfy them by re-tuning a constant. They are measured INSIDE
 * the flight's own drawn pixels, per face class, on facings that carry a body
 * — a frame-wide colour count is dominated by the wall and would pass whatever
 * the flight did.
 */
async function faceLight(page) {
  return page.evaluate(() => {
    const A = window.HOLO_APP;
    const cv = document.getElementById("scene");
    const d = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height).data;
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
    /* Drawn last wins, exactly as the renderer paints: the treads go over the
       mass, so a pixel inside both is a tread. */
    const classOf = (x, y) => {
      for (let i = (fl.treads_poly || []).length - 1; i >= 0; i--) {
        if (inside(fl.treads_poly[i], x, y)) return fl.treads_face[i];
      }
      for (let i = (fl.mass_poly || []).length - 1; i >= 0; i--) {
        if (inside(fl.mass_poly[i], x, y)) {
          const n = fl.mass_normal[i];
          return n[0] < -0.1 ? "stringer_key" : (n[0] > 0.1 ? "stringer_away" : "stringer_depth");
        }
      }
      return null;
    };
    const sums = {}, counts = {}, colours = {};
    let bodyN = 0, bodySum = 0, frameN = 0, frameSum = 0;
    for (let y = 0; y < cv.height; y += 2) {
      for (let x = 0; x < cv.width; x += 2) {
        const i = (y * cv.width + x) * 4;
        const lum = d[i] + d[i + 1] + d[i + 2];
        const k = classOf(x, y);
        if (k) {
          sums[k] = (sums[k] || 0) + lum; counts[k] = (counts[k] || 0) + 1;
          const key = d[i] + "," + d[i + 1] + "," + d[i + 2];
          colours[key] = (colours[key] || 0) + 1;
          bodyN++; bodySum += lum;
        } else { frameN++; frameSum += lum; }
      }
    }
    const means = {};
    for (const k of Object.keys(sums)) means[k] = sums[k] / counts[k] / 3;
    const top = Object.entries(colours).sort((a, b) => b[1] - a[1])[0] || ["-", 0];
    return {
      means,
      classes: Object.keys(sums).sort(),
      bodyMinusFrame: (bodySum / Math.max(1, bodyN)) - (frameSum / Math.max(1, frameN)),
      /* The row's own measure: the largest single value's share of the FRAME,
         which is where 22.2 % and 31.7 % were read. */
      topColourFramePct: (top[1] * 4 * 100) / (cv.width * cv.height),
      topColour: top[0]
    };
  });
}

test.describe("the flight's faces separate under the room's own key", () => {
  for (const t of [
    { loc: "great_stair_hall", facing: "W" },
    { loc: "back_stair", facing: "E" },
    { loc: "great_stair_hall", facing: "N" },
    { loc: "stair_landing", facing: "S" },
    { loc: "back_stair_head", facing: "W" }
  ]) {
    test(`${t.loc}/${t.facing} — no face of the flight is the same value as the next`, async ({ page }) => {
      test.setTimeout(180_000);
      await page.setViewportSize(POINTER_VIEWPORT);
      await page.goto(navUrl());
      await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
      await standAt(page, t.loc, t.facing);
      const m = await faceLight(page);
      /* THE ROW'S OWN NUMBER. 22.2 % and 31.7 % of a frame in one value; the
         bar is 10 %, which no stair facing may exceed. */
      expect(m.topColourFramePct,
        `${t.loc}/${t.facing}: the largest single colour's share of the frame (${m.topColour})`)
        .toBeLessThan(10);
      /* AND THE SOLID STILL STANDS OFF THE PLANE BEHIND IT. Round four measured
         159 summed on `great_stair_hall/W` and that is the floor — the lighting
         may not buy separation between faces by giving up separation from the
         room. */
      expect(m.bodyMinusFrame,
        `${t.loc}/${t.facing}: how far the flight's body stands off the frame behind it`)
        .toBeGreaterThan(159);
      /* THE ORDER IS THE KEY'S. A going faces the light squarely, a riser and a
         stringer take it at a glancing angle, and the stringer turned toward
         the key takes more of it than the one turned away — which is the rule
         the two side returns already obey (RETURN_RIGHT lighter than
         RETURN_LEFT). Each comparison runs only where both classes are drawn. */
      const has = (k) => Object.prototype.hasOwnProperty.call(m.means, k);
      expect(m.classes.length, `${t.loc}/${t.facing} draws no face at all`).toBeGreaterThan(0);
      if (has("going") && has("riser")) {
        expect(m.means.going - m.means.riser,
          `${t.loc}/${t.facing}: a tread top takes more of the key than a riser`)
          .toBeGreaterThan(12);
      }
      if (has("riser") && has("stringer_away")) {
        expect(m.means.riser - m.means.stringer_away,
          `${t.loc}/${t.facing}: a riser takes more of the key than a stringer turned away from it`)
          .toBeGreaterThan(10);
      }
      if (has("stringer_key") && has("stringer_away")) {
        expect(m.means.stringer_key - m.means.stringer_away,
          `${t.loc}/${t.facing}: the stringer turned toward the key is lighter than the one turned away`)
          .toBeGreaterThan(8);
      }
    });
  }

  /* THE KEY IS THE FACING'S OWN, and the arms that say so are exercised rather
     than named: no meta this corpus ships carries a key from the right or from
     below, so a doctored one is rendered beside the real one and the ordering
     has to FOLLOW the token. Without this the three unreachable arms of
     `keyVector` are code nobody can prove is read. */
  test("moving the key in the meta moves the light on the flight", async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize(POINTER_VIEWPORT);
    await page.goto(navUrl());
    await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
    await standAt(page, "back_stair", "E");
    const r = await page.evaluate(() => {
      const A = window.HOLO_APP, fx = window.HOLO_FIXTURE;
      const vs = { location: "back_stair", facing: "E" };
      const meta = A.metaFor(vs);
      const fl = meta.stairs[0];
      const inside = (poly, x, y) => {
        let c = false;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
          const [xi, yi] = poly[i], [xj, yj] = poly[j];
          if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
        }
        return c;
      };
      const meanOf = (data, rings) => {
        let sum = 0, n = 0;
        for (let y = 0; y < 1024; y += 3) {
          for (let x = 0; x < 1536; x += 3) {
            let hit = false;
            for (const ring of rings) if (inside(ring, x, y)) { hit = true; break; }
            if (!hit) continue;
            const i = (y * 1536 + x) << 2;
            sum += data[i] + data[i + 1] + data[i + 2]; n++;
          }
        }
        return n ? sum / n / 3 : 0;
      };
      const keyRings = [];
      for (let i = 0; i < fl.mass_poly.length; i++) {
        if (fl.mass_normal[i][0] < -0.1) keyRings.push(fl.mass_poly[i]);
      }
      /* THE GOINGS ARE READ ON ANOTHER FACING, and rendered rather than walked
         to: `back_stair/E` climbs away from the eye, so its tread tops are
         almost entirely hidden behind the nose in front of them (1,356 px of a
         514,856 px body) and a mean over them is mostly the riser it is
         occluded by. `great_stair_hall/W` sees the same flight across its run
         with its goings open to the camera. The page's own `metaFor` derives
         that facing wherever the viewer happens to stand, exactly as
         `manor.spec` renders a facing it is not on. */
      const vsW = { location: "great_stair_hall", facing: "W" };
      const metaW = A.metaFor(vsW);
      const flW = metaW.stairs[0];
      const goings = [];
      for (let i = 0; i < flW.treads_poly.length; i++) {
        if (flW.treads_face[i] === "going") goings.push(flW.treads_poly[i]);
      }
      const drawOn = (key, vs2, m0, rings) => {
        const c = document.createElement("canvas");
        c.width = 1536; c.height = 1024;
        const m2 = JSON.parse(JSON.stringify(m0));
        m2.key_dir = key;
        const bd = {};
        bd[vs2.location + "/" + vs2.facing] = { meta: m2 };
        window.HOLO.renderer.render(c, fx.world, fx.staging, A.library, bd, vs2, {});
        const d = c.getContext("2d").getImageData(0, 0, 1536, 1024).data;
        return meanOf(d, rings);
      };
      return {
        UL: { flank: drawOn("UL", vs, meta, keyRings), going: drawOn("UL", vsW, metaW, goings) },
        R: { flank: drawOn("R-ABOVE", vs, meta, keyRings) },
        below: { going: drawOn("L-BELOW", vsW, metaW, goings) }
      };
    });
    /* THE SAME FACE, UNDER TWO KEYS — not two faces under one, because the far
       stringer is painted over by the near one and sampling its ring reads the
       near one's pixels. What has to follow the document is the LIGHT: the
       flank that turns to the left is lighter when the key is at the left than
       when it is at the right. */
    expect(r.UL.flank - r.R.flank,
      "the stringer turned left is lighter under a key at the left than under one at the right")
      .toBeGreaterThan(8);
    /* And the vertical half of the token is read too: a tread top is an
       up-facing plane, so a key from BELOW takes the light off it. */
    expect(r.UL.going - r.below.going,
      "a tread top is lit from above and not from below")
      .toBeGreaterThan(8);
  });

  /* AND THE FLIGHT DARKENS THE FLOOR IT STANDS ON. Intention quality 2: "every
     grounded object darkens the ground under it … nothing sits on a floor
     without it", and §12.8's magnitude bar for a pool that can be seen is 20
     levels summed. Measured OUTSIDE the body — the band within one pool width
     of the footprint against the floor a pool width further out — because a
     darkening under the solid is a darkening nobody can see.
     The footprint ring is the contact on an ASCENT (where the solid meets the
     floor) and the lip of the well on a DESCENT (where the floor ends); one
     device, two true readings, and it is measured on the two ascents because
     that is where there is floor beside it to darken. */
  for (const t of [{ loc: "great_stair_hall", facing: "W" }, { loc: "back_stair", facing: "E" }]) {
    test(`${t.loc}/${t.facing} — the flight pools shadow where it meets the floor`, async ({ page }) => {
      test.setTimeout(180_000);
      await page.setViewportSize(POINTER_VIEWPORT);
      await page.goto(navUrl());
      await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
      await standAt(page, t.loc, t.facing);
      const m = await page.evaluate(() => {
        const A = window.HOLO_APP;
        const cv = document.getElementById("scene");
        const d = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height).data;
        const fl = (A.metaFor(A.harness.viewstate).stairs || [])[0];
        const inside = (poly, x, y) => {
          let c = false;
          for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
            const [xi, yi] = poly[i], [xj, yj] = poly[j];
            if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
          }
          return c;
        };
        const dist = (poly, x, y) => {
          let best = Infinity;
          for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
            const ax = poly[j][0], ay = poly[j][1], bx = poly[i][0], by = poly[i][1];
            const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
            let t2 = l2 > 0 ? ((x - ax) * dx + (y - ay) * dy) / l2 : 0;
            t2 = t2 < 0 ? 0 : (t2 > 1 ? 1 : t2);
            const ex = x - (ax + t2 * dx), ey = y - (ay + t2 * dy);
            best = Math.min(best, Math.sqrt(ex * ex + ey * ey));
          }
          return best;
        };
        const rings = fl.hit_polys || [];
        const foot = fl.floor_poly;
        let nearSum = 0, nearN = 0, farSum = 0, farN = 0;
        for (let y = 0; y < cv.height; y += 2) {
          for (let x = 0; x < cv.width; x += 2) {
            let inBody = false;
            for (const r of rings) if (inside(r, x, y)) { inBody = true; break; }
            if (inBody) continue;
            const dd = dist(foot, x, y);
            const i = (y * cv.width + x) * 4;
            const lum = d[i] + d[i + 1] + d[i + 2];
            if (dd <= 6) { nearSum += lum; nearN++; }
            else if (dd > 28 && dd <= 44) { farSum += lum; farN++; }
          }
        }
        return { near: nearSum / Math.max(1, nearN), far: farSum / Math.max(1, farN), nearN, farN };
      });
      expect(m.nearN, "there is floor beside the flight to measure").toBeGreaterThan(50);
      expect(m.far - m.near,
        "the floor at the flight's foot is darker than the floor a pool's width away")
        .toBeGreaterThan(20);
    });
  }
});
