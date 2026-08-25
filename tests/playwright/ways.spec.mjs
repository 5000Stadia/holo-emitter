/* THE MOUTH THAT MEANS WHAT IT DRAWS. [Row 25 (c) and (d)]
 *
 * Two halves of one decision. The composite through an opening used to fill
 * everything the destination's own frame did not cover by STRETCHING one row
 * or one column of it across the gap — 90 % of `hall/N`'s 476 × 953 doorway,
 * two 608 × 368 blocks of `entrance_approach/N`'s mouth each derived from a
 * single pixel, and three doors made entirely of one — so a `go` region that
 * claimed the whole opening was claiming manufactured picture. The extension
 * claims COLOUR now and nothing else, which is what lets the region stay the
 * opening: every pixel it claims is one the picture draws from the document.
 *
 * And the chevron, which rode on the same rectangle: it yields to a way
 * through under it only while some part of the button is over no way at all,
 * so no facing loses its pointer turn.
 */
import { test, expect, navUrl, POINTER_VIEWPORT, standAt, clickCanvasPoint } from "./helpers.mjs";

const PHONE = { width: 390, height: 844 };
const VIEWPORTS = [["desktop", POINTER_VIEWPORT], ["a phone", PHONE]];

/* The facings where a chevron is wholly inside a way through — measured, and
   pinned as a membership. Filled in from the sweep itself the first time it
   ran; a facing joining or leaving this list is a change in what a player can
   do with the chrome and has to be seen rather than absorbed.

   Three of the five are chevrons sitting on a FLIGHT, and those still yield —
   the rule asks the facing, not the button, so a covered chevron gives way
   while its partner can still turn the room. Only the entrance court has BOTH
   of its chevrons covered, and that is the one facing where yielding would
   leave no pointer turn at all. `stair.spec`'s "a flight under the chrome is
   still a flight" drives two of them — back_stair/E and great_stair_hall/N —
   with a real mouse.

   [row 39] `back_stair/W chevron-left` LEFT this list when the flight
   attachment landed, and it left for the reason the row exists. That facing is
   promoted, and a promoted meta's flight is the one row 39 writes into
   `meta.stairs` at the meta's own camera — the painted staircase's own body.
   Before the attachment the facing had no `meta.stairs` at all and its flight
   came from the plan projection over a derived meta, a fatter shape that
   swallowed all 49 samples of the button; the attached body leaves the
   button's top-right corner over bare wall. Nothing a player does changed:
   back_stair/W's right chevron was free before and is free now, so
   `bothCovered` was false either way and a click over the flight climbs it in
   both worlds. What changed is that the mouth on this facing is now the
   painting's rather than the plan's guess at it. */
const EXPECTED_SWALLOWED = {
  desktop: [
    "back_stair/E chevron-right",
    "back_stair/S chevron-left",
    "entrance_court/S chevron-left",
    "entrance_court/S chevron-right",
    "great_stair_hall/N chevron-left"
  ],
  "a phone": [
    "back_stair/E chevron-right",
    "back_stair/S chevron-left",
    "entrance_court/S chevron-left",
    "entrance_court/S chevron-right",
    "great_stair_hall/N chevron-left"
  ]
};

/* Every way through of every facing, with the destination frame's placement
   computed the way the renderer computes it — one derivation, read back here
   so the case can ask what is real picture and what is a colour claim. */
async function throughGeometry(page) {
  return page.evaluate(() => {
    const A = window.HOLO_APP, fx = window.HOLO_FIXTURE;
    const gp = window.HOLO.groundplane;
    const W = 1536, H = 1024;
    const out = [];
    for (const loc of fx.world.locations) {
      for (const ex of (loc.exits || [])) {
        const vs = { location: loc.id, facing: ex.facing };
        let meta; try { meta = A.metaFor(vs); } catch (e) { continue; }
        const ap = window.HOLO.renderer.apertures(fx.world, fx.staging, A.library, meta, vs)
          .find((a) => a.exit === ex.id);
        if (!ap || ap.kind === "stair") continue;
        const entry = A.backdrops[ap.to + "/" + ap.arrive_facing];
        if (!entry || !entry.meta || typeof ap.beyond_m !== "number") continue;
        let dHere, dDest;
        try { dHere = gp.cameraDistance(meta); dDest = gp.cameraDistance(entry.meta); }
        catch (e) { continue; }
        const k = dDest / (dHere + ap.beyond_m);
        out.push({
          facing: `${loc.id}/${ex.facing}`, exit: ex.id, kind: ap.kind, source: ap.source,
          rect: [ap.x, ap.y, ap.w, ap.h],
          dest: [W / 2 + k * ((ap.beyond_offset_m || 0) * entry.meta.px_per_m_at_wall - W / 2),
            meta.horizon_y * meta.image_h_px - k * entry.meta.horizon_y * entry.meta.image_h_px,
            W * k, H * k]
        });
      }
    }
    return out;
  });
}

test.describe("through an opening, a room and never an invention", () => {
  /* NO PART OF ANY OPENING IS A STRETCHED PIXEL. The old device is defeated by
     construction now — there is no `drawImage` of a 1 px source anywhere — so
     what this case measures is the CONSEQUENCE: outside the destination's own
     frame, an opening carries at most one value per region, which is what a
     colour claim looks like. A stretched row has as many values as it has
     columns, so a single reinstated blit fails this on the facing it runs on. */
  test("outside the destination's frame an opening claims colour, not detail", async ({ page }) => {
    test.setTimeout(240_000);
    await page.setViewportSize(POINTER_VIEWPORT);
    await page.goto(navUrl());
    await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
    const geo = await throughGeometry(page);
    expect(geo.length, "the manor composites through openings at all").toBeGreaterThan(40);
    const bad = await page.evaluate((geoIn) => {
      const A = window.HOLO_APP, fx = window.HOLO_FIXTURE;
      const W = 1536, H = 1024;
      const c = document.createElement("canvas"); c.width = W; c.height = H;
      const ctx = c.getContext("2d");
      const out = [];
      for (const g of geoIn) {
        const [loc, facing] = g.facing.split("/");
        const vs = { location: loc, facing };
        const meta = A.metaFor(vs);
        const bd = {};
        for (const key of Object.keys(A.backdrops)) bd[key] = A.backdrops[key];
        bd[g.facing] = A.backdrops[g.facing] || { meta };
        window.HOLO.renderer.render(c, fx.world, fx.staging, A.library, bd, vs, {});
        const d = ctx.getImageData(0, 0, W, H).data;
        const [ax, ay, aw, ah] = g.rect;
        const [dx, dy, dw, dh] = g.dest;
        /* The band BELOW the destination's frame, inside the opening — the one
           the Captain is looking at on the live site, and the one row 36's
           floor textures are eventually for. Sampled across its width; a
           per-column stretch shows the destination's own floor detail here and
           a colour claim shows one value. */
        const y0 = Math.max(Math.ceil(ay), Math.ceil(dy + dh) + 2);
        const y1 = Math.min(Math.floor(ay + ah) - 2, H - 1);
        if (!(y1 > y0 + 4)) continue;
        /* The middle of the band only, and never a leaf-filled opening: a
           doorway's own reveals are painted down its inside edges AFTER the
           composite, and a leaf is a sprite over the top of it — both are
           picture this case is not about. */
        if (g.source === "leaf") continue;
        const x0 = Math.max(Math.ceil(ax + aw * 0.2), Math.ceil(dx) + 2, 0);
        const x1 = Math.min(Math.floor(ax + aw * 0.8), Math.floor(dx + dw) - 2, W - 1);
        if (!(x1 > x0 + 8)) continue;
        const values = new Set();
        for (let y = y0; y < y1; y += 3) {
          for (let x = x0; x < x1; x += 3) {
            const i = (y * W + x) * 4;
            values.add(d[i] + "," + d[i + 1] + "," + d[i + 2]);
          }
        }
        if (values.size > 2) out.push({ facing: g.facing, exit: g.exit, values: values.size });
      }
      return out;
    }, geo);
    expect(bad, "an opening's bottom band carries more than a colour")
      .toEqual([]);
  });

  /* AND THE PRICE OF THAT IS MEASURED, not asserted. A flat fill meets the
     destination's own edge at a seam, and the seam is what the stretch bought
     with its invention. Measured across every seam the corpus draws, in summed
     rgb: median 19 over the 23 openings that have one, worst 125 on `hall/N`,
     51 on the entrance court's mouth — against §12.8's own magnitude bar of 60
     summed for a thing a person can see. The bar here is 140: it holds the
     worst case against regression without pretending the seam is invisible. */
  test("the seam the flat fill leaves is bounded, and here is what it costs", async ({ page }) => {
    test.setTimeout(240_000);
    await page.setViewportSize(POINTER_VIEWPORT);
    await page.goto(navUrl());
    await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
    const geo = await throughGeometry(page);
    const seams = await page.evaluate((geoIn) => {
      const A = window.HOLO_APP, fx = window.HOLO_FIXTURE;
      const W = 1536, H = 1024;
      const c = document.createElement("canvas"); c.width = W; c.height = H;
      const ctx = c.getContext("2d");
      const out = [];
      for (const g of geoIn) {
        const [loc, facing] = g.facing.split("/");
        const vs = { location: loc, facing };
        const meta = A.metaFor(vs);
        const bd = {};
        for (const key of Object.keys(A.backdrops)) bd[key] = A.backdrops[key];
        bd[g.facing] = A.backdrops[g.facing] || { meta };
        window.HOLO.renderer.render(c, fx.world, fx.staging, A.library, bd, vs, {});
        const d = ctx.getImageData(0, 0, W, H).data;
        const [ax, ay, aw, ah] = g.rect;
        const [dx, dy, dw, dh] = g.dest;
        const x0 = Math.max(0, Math.ceil(ax)), x1 = Math.min(W, Math.floor(ax + aw));
        const y0 = Math.max(0, Math.ceil(ay)), y1 = Math.min(H, Math.floor(ay + ah));
        const at = (x, y) => { const i = (y * W + x) * 4; return [d[i], d[i + 1], d[i + 2]]; };
        const step = (p, q) => Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) + Math.abs(p[2] - q[2]);
        let sum = 0, n = 0, worst = 0;
        const edges = [];
        if (dx > x0 + 2 && dx < x1 - 2) edges.push(["v", Math.round(dx)]);
        if (dx + dw > x0 + 2 && dx + dw < x1 - 2) edges.push(["v", Math.round(dx + dw)]);
        if (dy > y0 + 2 && dy < y1 - 2) edges.push(["h", Math.round(dy)]);
        if (dy + dh > y0 + 2 && dy + dh < y1 - 2) edges.push(["h", Math.round(dy + dh)]);
        for (const [kind, where] of edges) {
          if (kind === "v") {
            for (let y = Math.max(y0 + 1, Math.ceil(dy)); y < Math.min(y1 - 1, Math.floor(dy + dh)); y++) {
              const j = step(at(where - 2, y), at(where + 2, y));
              sum += j; n++; worst = Math.max(worst, j);
            }
          } else {
            for (let x = Math.max(x0 + 1, Math.ceil(dx)); x < Math.min(x1 - 1, Math.floor(dx + dw)); x++) {
              const j = step(at(x, where - 2), at(x, where + 2));
              sum += j; n++; worst = Math.max(worst, j);
            }
          }
        }
        if (n) out.push({ facing: g.facing, mean: sum / n, worst });
      }
      return out;
    }, geo);
    expect(seams.length, "some opening in the manor has a seam to measure").toBeGreaterThan(10);
    const worst = seams.slice().sort((a, b) => b.mean - a.mean)[0];
    expect({ facing: worst.facing, over: worst.mean > 140 },
      `the worst seam in the corpus, mean summed rgb — ${JSON.stringify(seams.slice().sort((a, b) => b.mean - a.mean).slice(0, 3))}`)
      .toEqual({ facing: worst.facing, over: false });
  });
});

test.describe("a chevron never gives up its whole self", () => {
  for (const [name, size] of VIEWPORTS) {
    /* THE GUARANTEE IS PER FACING, over all eighty-eight, and it is the one the
       old rule could not make: standing anywhere in the manor, both chevrons
       turn the room from somewhere on the button. The entrance court is the
       facing that failed it — a 3095 px mouth over a 1536 px frame — and it is
       in the list rather than beside it. */
    test(`every facing keeps a pointer turn on both chevrons, on ${name}`, async ({ page }) => {
      test.setTimeout(240_000);
      await page.setViewportSize(size);
      await page.goto(navUrl());
      await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
      const stuck = await page.evaluate(() => {
        const A = window.HOLO_APP, fx = window.HOLO_FIXTURE;
        const scene = document.getElementById("scene");
        const r = scene.getBoundingClientRect();
        const out = [];
        for (const loc of fx.world.locations) {
          for (const facing of ["N", "E", "S", "W"]) {
            const vs = { location: loc.id, facing };
            let meta; try { meta = A.metaFor(vs); } catch (e) { continue; }
            const list = window.HOLO.renderer.apertures(fx.world, fx.staging, A.library, meta, vs)
              .filter((a) => a.exit);
            for (const id of ["chevron-left", "chevron-right"]) {
              const box = document.getElementById(id).getBoundingClientRect();
              let free = 0;
              for (let iy = 0; iy <= 6; iy++) {
                for (let ix = 0; ix <= 6; ix++) {
                  const cx = box.left + (box.width * ix) / 6;
                  const cy = box.top + (box.height * iy) / 6;
                  const p = { x: ((cx - r.left) * scene.width) / r.width,
                    y: ((cy - r.top) * scene.height) / r.height };
                  let covered = false;
                  for (const a of list) {
                    if (a.polys && a.polys.length) {
                      for (const ring of a.polys) {
                        if (ring.length < 3) continue;
                        let inside = false;
                        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
                          const [xi, yi] = ring[i], [xj, yj] = ring[j];
                          if ((yi > p.y) !== (yj > p.y) &&
                              p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi) inside = !inside;
                        }
                        if (inside) { covered = true; break; }
                      }
                    } else if (p.x >= a.x && p.x < a.x + a.w && p.y >= a.y && p.y < a.y + a.h) {
                      covered = true;
                    }
                    if (covered) break;
                  }
                  if (!covered) free++;
                }
              }
              if (!free) out.push(`${loc.id}/${facing} ${id}`);
            }
          }
        }
        return out;
      });
      /* THE MEMBERSHIP IS WHAT IS PINNED, the way the manor's other censuses
         pin theirs: not "some facing swallows a chevron" but WHICH. A facing in
         this list is one where every pixel of that button is inside a way
         through, so the yield would leave the room with no pointer turn on that
         side — which is exactly where the rule hands the button back. The two
         real-click cases below stand on the members; a new member appearing
         here is a new frame to look at rather than a silent behaviour change. */
      expect(stuck.sort(), `chevrons wholly inside a way through, on ${name}`)
        .toEqual(EXPECTED_SWALLOWED[name]);
    });
  }

  /* THE COURT, WITH A REAL MOUSE, both viewports: the facing where both
     chevrons walked the player out of the room over their whole area. */
  for (const [name, size] of VIEWPORTS) {
    test(`the entrance court can be looked around from the chevrons, on ${name}`, async ({ page }) => {
      test.setTimeout(240_000);
      await page.setViewportSize(size);
      await page.goto(navUrl());
      await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
      await standAt(page, "entrance_court", "S");
      for (const [id, want] of [["chevron-left", "E"], ["chevron-right", "W"]]) {
        await page.locator("#" + id).click();
        await page.waitForTimeout(500);
        const at = await page.evaluate(() => window.HOLO_APP.harness.viewstate);
        expect({ id, ...at }, `the ${id} over a 20.4 m mouth turns the room`)
          .toEqual({ id, location: "entrance_court", facing: want });
        /* back to south for the other one */
        while (await page.evaluate(() => window.HOLO_APP.harness.viewstate.facing) !== "S") {
          await page.evaluate(() => window.HOLO_APP.dispatch({ type: "turn", dir: "right" }));
        }
      }
      /* AND THE MOUTH IS STILL WALKED, from a point on it that is not chrome. */
      const mid = await page.evaluate(() => {
        const a = window.HOLO_APP.apertureList().find((q) => q.kind === "threshold");
        return { x: 768, y: a.y + a.h - 40 };
      });
      await clickCanvasPoint(page, mid);
      await page.waitForTimeout(600);
      expect(await page.evaluate(() => window.HOLO_APP.harness.viewstate.location),
        "a click inside the mouth still walks through it").toBe("entrance_approach");
    });
  }

  /* AND THE YIELD STILL FIRES WHERE ROUND FOUR FOUND IT: a doorway a chevron
     covers part of, on the viewport where the chrome takes its largest share.
     `hall/N`'s doorway runs off the frame and its visible sliver sits under the
     right chevron; `great_hall/N`'s garden door is 185 px wide with 26 % of a
     phone chevron over it. Either would be a silent turn again if the new rule
     were "the chevron always turns". */
  for (const [loc, facing, exit, dest] of [
    ["hall", "N", "door_hall_buttery_pantry", "buttery_pantry"],
    ["great_hall", "N", "door_great_hall_privy_garden", "privy_garden"]
  ]) {
    test(`${loc}/${facing} — a doorway under the chrome is still walked, on a phone`, async ({ page }) => {
      test.setTimeout(240_000);
      await page.setViewportSize(PHONE);
      await page.goto(navUrl());
      await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
      await standAt(page, loc, facing);
      const pt = await page.evaluate((exitId) => {
        const A = window.HOLO_APP;
        const cv = document.getElementById("scene");
        const r = cv.getBoundingClientRect();
        const a = A.apertureList().find((q) => q.exit === exitId);
        const x0 = Math.max(0, a.x), x1 = Math.min(cv.width, a.x + a.w);
        const y0 = Math.max(0, a.y), y1 = Math.min(cv.height, a.y + a.h);
        const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
        const client = { x: r.left + (cx * r.width) / cv.width, y: r.top + (cy * r.height) / cv.height };
        const el = document.elementFromPoint(client.x, client.y);
        return { cx, cy, over: el ? (el.id || el.tagName) : "none" };
      }, exit);
      await clickCanvasPoint(page, { x: pt.cx, y: pt.cy });
      await page.waitForTimeout(600);
      const after = await page.evaluate(() => window.HOLO_APP.harness.viewstate.location);
      expect({ over: pt.over, after },
        "a click in the middle of a doorway a person can see walks through it")
        .toEqual({ over: pt.over, after: dest });
    });
  }
});
