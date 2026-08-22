/* §12.8 — the compositing mechanisms demonstrably fire, each asserted
 * separately, plus the plan's strengthenings: tint direction on all three
 * composite classes, draw order at staged overlap pixels, opaque-pixel
 * overlap magnitude, the drawer moving through toggle alone, the desk
 * body-recess, the swap-door gate witnessed from pixels, shadow geometry,
 * record→images derivation, thumbs as content, backdrop_only, grid
 * determinism, the clickability sweep, and the door round-trip.
 */
import {
  test, expect, appUrl, POINTER_VIEWPORT, MF, LIT, repoRoot,
  stageTree, setViewstate, removeTree, equipContext, bake
} from "./helpers.mjs";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { deriveMeta } from "../../tools/plan-projection.mjs";

test.use({ viewport: POINTER_VIEWPORT });

/* Two metas the plan really produces and M0 does not ship, for the typed-
 * geometry clause: an `open` facing (ground to a far line, law (b)'s "where no
 * building stands the ground runs open") and a SEGMENTED one (part building,
 * part the entrance court's 20.4 m open mouth). Built by `deriveMeta` — the
 * production function — rather than hand-assembled, so the clause exercises
 * what the pipeline would emit. */
const MANOR_PLAN = JSON.parse(
  readFileSync(join(repoRoot, "fixtures", "demo-study", "plan.json"), "utf8"));
const OPEN_META = deriveMeta(MANOR_PLAN, "entrance_court", "S");
const SEG_META = deriveMeta(MANOR_PLAN, "entrance_approach", "N");

/* Render the fixture world (optionally doctored in-page) at a viewstate with
 * options; returns the canvas hash. */
async function hashRender(page, viewstate, options, doctor = null) {
  return await page.evaluate(async ({ viewstate, options, doctorSrc }) => {
    const fx = window.HOLO_FIXTURE;
    const world = window.__T.clone(fx.world);
    if (doctorSrc) (new Function("world", doctorSrc))(world);
    const c = window.__T.renderW(world, fx.staging, viewstate, options);
    return await window.__T.hashCanvas(c);
  }, { viewstate, options, doctorSrc: doctor });
}

const OPEN_DESK = 'world.entities.find((e) => e.id === "desk1").state = "open";' +
  'world.knowledge.player.push("key1");';

test.describe("§12.8 — each mechanism fires", () => {
  test("tint, contact shadows, part interpolation: disabling each changes the hash", async ({ page }) => {
    await page.goto(appUrl());
    // The parts scene is a harness-toggled world state, not a part_t
    // override (a broken world-state→t mapping must not hide).
    const scene = await page.evaluate(async () => {
      const fx = window.HOLO_FIXTURE;
      const fixture = window.__T.clone({
        world: fx.world, staging: fx.staging, narration: fx.narration, viewstate: fx.viewstate
      });
      const h = window.HOLO.harness.create(fixture);
      h.dispatch({ type: "toggle", entity: "desk1" }); // open (reveals key)
      const vs = { location: "study", facing: "N" };
      const full = await window.__T.hashCanvas(window.__T.renderW(h.world, h.staging, vs, {}));
      const noTint = await window.__T.hashCanvas(window.__T.renderW(h.world, h.staging, vs, { tint: false }));
      const noShadow = await window.__T.hashCanvas(window.__T.renderW(h.world, h.staging, vs, { shadows: false }));
      const noParts = await window.__T.hashCanvas(window.__T.renderW(h.world, h.staging, vs, { parts: false }));
      return { full, noTint, noShadow, noParts };
    });
    expect(scene.noTint, "tint fires").not.toBe(scene.full);
    expect(scene.noShadow, "contact shadows fire").not.toBe(scene.full);
    expect(scene.noParts, "part interpolation fires").not.toBe(scene.full);
  });

  test("mid-state part render differs from both end states", async ({ page }) => {
    await page.goto(appUrl());
    const vs = { location: "study", facing: "N" };
    const closed = await hashRender(page, vs, {});
    const open = await hashRender(page, vs, {}, OPEN_DESK);
    const mid = await hashRender(page, vs, { part_t: { desk1: 0.5 } });
    expect(mid).not.toBe(closed);
    expect(mid).not.toBe(open);
  });

  test("the drawer moves through toggle alone (key deleted — the part is the only possible mover)", async ({ page }) => {
    await page.goto(appUrl());
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
    const partRect = (t) => {
      const scale = 1 + (part.slide.scale_open - 1) * t;
      const x = P.drawX + P.f * (part.origin.x + t * part.slide.dx * rec.desk.px.w);
      const y = P.drawY + P.f * (part.origin.y + t * part.slide.dy * rec.desk.px.h);
      return { x0: x, y0: y, x1: x + rec.partPx.w * P.f * scale, y1: y + rec.partPx.h * P.f * scale };
    };
    const cR = partRect(0), oR = partRect(1);
    const travel = {
      x0: Math.min(cR.x0, oR.x0) - 2, y0: Math.min(cR.y0, oR.y0) - 2,
      x1: Math.max(cR.x1, oR.x1) + 2, y1: Math.max(cR.y1, oR.y1) + 2
    };
    const cav = rec.desk.anchors.drawer_cavity;
    const cavityR = {
      x0: P.drawX + P.f * cav.x0, y0: P.drawY + P.f * cav.y0,
      x1: P.drawX + P.f * cav.x1, y1: P.drawY + P.f * cav.y1
    };

    const res = await page.evaluate(async ({ travel, cavityR }) => {
      const fx = window.HOLO_FIXTURE;
      const fixture = window.__T.clone({
        world: fx.world, staging: fx.staging, narration: fx.narration, viewstate: fx.viewstate
      });
      fixture.world = window.__T.worldWithout(["key1"], fixture.world);
      const h = window.HOLO.harness.create(fixture);
      const vs = { location: "study", facing: "N" };
      const before = window.__T.renderW(h.world, h.staging, vs, {});
      const env = h.dispatch({ type: "toggle", entity: "desk1" });
      const after = window.__T.renderW(h.world, h.staging, vs, {});
      const d = window.__T.diffBounds(before, after);
      let travelOutsideCavity = 0;
      if (d.count) {
        // recount precisely
        const da = before.getContext("2d").getImageData(0, 0, 1536, 1024).data;
        const db = after.getContext("2d").getImageData(0, 0, 1536, 1024).data;
        for (let y = Math.max(0, Math.floor(travel.y0)); y <= Math.min(1023, Math.ceil(travel.y1)); y++) {
          for (let x = Math.max(0, Math.floor(travel.x0)); x <= Math.min(1535, Math.ceil(travel.x1)); x++) {
            const inCavity = x >= cavityR.x0 && x <= cavityR.x1 && y >= cavityR.y0 && y <= cavityR.y1;
            if (inCavity) continue;
            const i = (y * 1536 + x) * 4;
            if (da[i] !== db[i] || da[i + 1] !== db[i + 1] || da[i + 2] !== db[i + 2] || da[i + 3] !== db[i + 3]) {
              travelOutsideCavity++;
            }
          }
        }
      }
      return {
        events: env.events, hashChanged: d.count > 0, travelOutsideCavity
      };
    }, { travel, cavityR });

    expect(res.events).toEqual([{ type: "state", entity: "desk1", to: "open" }]);
    expect(res.hashChanged, "toggle changes the scene with no key to masquerade").toBe(true);
    expect(res.travelOutsideCavity, "the diff is attributable to the part").toBeGreaterThan(0);
  });

  test("tint direction on all three composite classes: body, part, state image", async ({ page }) => {
    await page.goto(appUrl());
    const res = await page.evaluate(() => {
      const fx = window.HOLO_FIXTURE;
      const TINT_ALPHA = 0.18;
      const tint = { r: 0xc8, g: 0xb4, b: 0x89 }; // #c8b489
      const mulExpect = (c, t) => c * (1 - TINT_ALPHA) + (c * t / 255) * TINT_ALPHA;

      // A solid interior pixel of a canvas: walk rows to find a pixel whose
      // 3x3 neighbourhood is opaque and near-uniform. NEAR, not exact: every
      // sprite now carries the horizontal half of UL45 as a per-pixel ramp
      // across its own width, so no two adjacent columns are byte-identical
      // and an exact-uniformity search finds nothing. The tolerance only has
      // to exclude an anti-aliased edge, and the ramp's step is 1–2 levels.
      const NEAR = 4;
      const solidPoint = (canvas, box) => {
        const W = canvas.width;
        const data = canvas.getContext("2d").getImageData(0, 0, W, canvas.height).data;
        const at = (x, y) => {
          const i = (y * W + x) * 4;
          return [data[i], data[i + 1], data[i + 2], data[i + 3]];
        };
        for (let y = Math.ceil(box.y0) + 2; y < box.y1 - 2; y += 2) {
          for (let x = Math.ceil(box.x0) + 2; x < box.x1 - 2; x += 2) {
            const c = at(x, y);
            if (c[3] !== 255) continue;
            let uniform = true;
            for (let dy = -1; dy <= 1 && uniform; dy++) {
              for (let dx = -1; dx <= 1 && uniform; dx++) {
                const n = at(x + dx, y + dy);
                if (Math.abs(n[0] - c[0]) > NEAR || Math.abs(n[1] - c[1]) > NEAR ||
                    Math.abs(n[2] - c[2]) > NEAR || n[3] !== 255) uniform = false;
              }
            }
            if (uniform) return { x, y };
          }
        }
        return null;
      };

      const cases = [];
      const vsN = { location: "study", facing: "N" };
      const vsE = { location: "study", facing: "E" };

      // body: desk (closed), untinted vs tinted at the same pixel.
      const deskWorld = window.__T.worldWithout(
        fx.world.entities.filter((e) => e.id !== "desk1").map((e) => e.id));
      const off = window.__T.renderW(deskWorld, fx.staging, vsN, { no_backdrop: true, shadows: false, tint: false });
      const on = window.__T.renderW(deskWorld, fx.staging, vsN, { no_backdrop: true, shadows: false });
      const db = window.__T.alphaBounds(off, 255);
      cases.push({ name: "body(desk)", off, on, box: db });

      // part: drawer front, harness-toggled open state.
      const openWorld = window.__T.clone(deskWorld);
      openWorld.entities.find((e) => e.id === "desk1").state = "open";
      const rec = window.HOLO_APP.library["desk-joined-oak-1660"].record;
      const part = rec.parts[0];
      const s = (window.HOLO.groundplane || window.HOLO.groundplane);
      // part rect at t=1 in scene coords, via the app's record data + literals
      // (this is a sampling box, not a geometric assert).
      const layout = window.HOLO.renderer.layout(openWorld, fx.staging, window.__T.lib(),
        window.__T.metaOf(vsN), vsN);
      const desk = layout.find((e) => e.id === "desk1");
      const pw = window.__T.lib()["desk-joined-oak-1660"].images.parts.drawer_front.width;
      const ph = window.__T.lib()["desk-joined-oak-1660"].images.parts.drawer_front.height;
      const scale = part.slide.scale_open;
      const px0 = desk.drawX + desk.f * (part.origin.x + part.slide.dx * rec.px.w);
      const py0 = desk.drawY + desk.f * (part.origin.y + part.slide.dy * rec.px.h);
      const partBox = { x0: px0, y0: py0, x1: px0 + pw * desk.f * scale, y1: py0 + ph * desk.f * scale };
      const poff = window.__T.renderW(openWorld, fx.staging, vsN, { no_backdrop: true, shadows: false, tint: false });
      const pon = window.__T.renderW(openWorld, fx.staging, vsN, { no_backdrop: true, shadows: false });
      cases.push({ name: "part(drawer)", off: poff, on: pon, box: partBox });

      // state image: open door leaf on study/E.
      const doorWorld = window.__T.worldWithout(
        fx.world.entities.filter((e) => e.id !== "door1").map((e) => e.id));
      doorWorld.entities.find((e) => e.id === "door1").state = "open";
      const dooroff = window.__T.renderW(doorWorld, fx.staging, vsE, { no_backdrop: true, shadows: false, tint: false });
      const dooron = window.__T.renderW(doorWorld, fx.staging, vsE, { no_backdrop: true, shadows: false });
      const doorBox = window.__T.alphaBounds(dooroff, 255);
      cases.push({ name: "state(open door)", off: dooroff, on: dooron, box: doorBox });

      const out = [];
      for (const c of cases) {
        const p = solidPoint(c.off, c.box);
        if (!p) { out.push({ name: c.name, error: "no solid point" }); continue; }
        const u = window.__T.px(c.off, p.x, p.y);
        const t = window.__T.px(c.on, p.x, p.y);
        out.push({
          name: c.name,
          untinted: u, tinted: t,
          expected: [
            Math.round(mulExpect(u[0], tint.r)),
            Math.round(mulExpect(u[1], tint.g)),
            Math.round(mulExpect(u[2], tint.b))
          ]
        });
      }
      return out;
    });
    for (const c of res) {
      expect(c.error, `${c.name}: found a solid sample point`).toBeUndefined();
      for (let ch = 0; ch < 3; ch++) {
        expect(Math.abs(c.tinted[ch] - c.expected[ch]),
          `${c.name}: channel ${ch} moves toward key_tint by the pinned alpha (got ${c.tinted}, expected ${c.expected} from ${c.untinted})`)
          .toBeLessThanOrEqual(2);
      }
    }
  });

  test("named pairs overlap in opaque pixels (≥50) and draw order is nearer-over-farther", async ({ page }) => {
    await page.goto(appUrl());
    for (const pair of [
      { nearer: "chair1", farther: "desk1", vs: { location: "study", facing: "N" } },
      { nearer: "stick1", farther: "shelf1", vs: { location: "hall", facing: "E" } }
    ]) {
      const res = await page.evaluate(async ({ nearer, farther, vs }) => {
        const fx = window.HOLO_FIXTURE;
        const solo = (id) => window.__T.renderW(
          window.__T.worldWithout(
            fx.world.entities.filter((e) => e.id !== id).map((e) => e.id)),
          fx.staging, vs, { no_backdrop: true, shadows: false });
        const a = solo(nearer);
        const b = solo(farther);
        const inter = window.__T.maskIntersect(a, b, 128, 64);
        // Composite of both, same options; at an intersection pixel where the
        // two solo colors differ, the composite must equal the nearer's.
        const both = window.__T.renderW(
          window.__T.worldWithout(
            fx.world.entities.filter((e) => e.id !== nearer && e.id !== farther).map((e) => e.id)),
          fx.staging, vs, { no_backdrop: true, shadows: false });
        /* Only FULLY opaque pixels of the nearer sprite: at alpha 191 the
           composite is the nearer blended over the farther and cannot equal
           the nearer's solo colour, so a partly-transparent sample makes this
           fail for a reason that is not draw order. Green here was partly
           luck of which pixel the sampler happened to return. */
        let checked = null;
        for (const p of inter.samples) {
          const ca = window.__T.px(a, p.x, p.y);
          const cb = window.__T.px(b, p.x, p.y);
          if (ca[3] !== 255) continue;
          if (ca.join() === cb.join()) continue;
          const cc = window.__T.px(both, p.x, p.y);
          checked = { p, nearerPx: ca, fartherPx: cb, compositePx: cc };
          break;
        }
        return { count: inter.count, checked };
      }, pair);
      expect(res.count, `${pair.nearer}×${pair.farther} opaque intersection`).toBeGreaterThanOrEqual(50);
      expect(res.checked, `${pair.nearer}×${pair.farther}: found a discriminating pixel`).not.toBeNull();
      expect(res.checked.compositePx, `${pair.nearer} draws over ${pair.farther}`)
        .toEqual(res.checked.nearerPx);
    }
  });

  /* THE HALL/E PAIR READS AS ONE THING IN FRONT OF ANOTHER, MEASURED.
   *
   * Row 20 wrote its own acceptance for this composition — *"if the pair reads
   * as two objects side by side rather than one in front of the other, the
   * composition moves again"* — and then failed it: at 0.20 m in front of the
   * press the candlestick's base sat 7 drawn pixels below the press's and read
   * as standing ON its bottom shelf. It was found by a critic looking at the
   * frame, fixed by moving the candlestick to 1.70 m, and the fix was held by
   * NOTHING: reverting the two fixture numbers and re-running the two
   * generators put the failing arrangement back with the whole suite green.
   * The overlap case above was green at 0.20 m too — crossing silhouettes is
   * what a thing BEHIND another does as well.
   *
   * What separates the two readings is how far apart the two bases are drawn,
   * so that is what is measured. The bounds are ABSOLUTE, not derived from the
   * shipped `depth_m`: a bound computed from its own subject moves with it and
   * survives the exact regression it was written to catch, which is the defect
   * this row paid for twice already. 68 px is what the fix draws; 7 px is what
   * failed; the floor sits between them and far from both. */
  test("hall/E: the candlestick's base is drawn clear of the press's, not on it", async ({ page }) => {
    await page.goto(appUrl());
    const res = await page.evaluate(() => {
      const fx = window.HOLO_FIXTURE;
      const vs = { location: "hall", facing: "E" };
      const solo = (id) => window.__T.renderW(
        window.__T.worldWithout(
          fx.world.entities.filter((e) => e.id !== id).map((e) => e.id)),
        fx.staging, vs, { no_backdrop: true, shadows: false });
      const near = window.__T.alphaBounds(solo("stick1"), 128);
      const far = window.__T.alphaBounds(solo("shelf1"), 128);
      return { near, far };
    });
    expect(res.near, "stick1 draws nothing on hall/E").not.toBeNull();
    expect(res.far, "shelf1 draws nothing on hall/E").not.toBeNull();
    const sep = res.near.y1 - res.far.y1;
    expect(sep,
      `the candlestick's base is drawn ${sep} px below the press's; under about 40 px the pair first-reads as the candlestick standing ON the press, which is the read this composition was moved to fix`)
      .toBeGreaterThanOrEqual(40);
    /* And it must still CROSS the press, or it is simply a separate object
       standing somewhere else — the depth cue is the overlap plus the drop. */
    expect(res.near.y0,
      "the candlestick no longer overlaps the press's silhouette at all — moving it forward has moved it out of the pair")
      .toBeLessThan(res.far.y1);
  });

  test("desk body carries the recess, not a baked drawer face", async ({ page }) => {
    await page.goto(appUrl());
    const res = await page.evaluate(() => {
      const lib = window.HOLO_APP.library["desk-joined-oak-1660"];
      const rec = lib.record;
      const part = rec.parts[0];
      const pw = lib.images.parts.drawer_front.width;
      const ph = lib.images.parts.drawer_front.height;
      const mean = (canvas, x0, y0, w, h) => {
        const d = canvas.getContext("2d").getImageData(x0, y0, w, h).data;
        let sum = 0, n = 0;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] < 200) continue;
          sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
          n++;
        }
        return n ? sum / n : 0;
      };
      return {
        bodyInPartRect: mean(lib.images.body, part.origin.x, part.origin.y, pw, ph),
        partMean: mean(lib.images.parts.drawer_front, 0, 0, pw, ph)
      };
    });
    expect(res.bodyInPartRect, "recess darker than the face")
      .toBeLessThan(0.7 * res.partMean);
  });

  test("swap-door: toggle changes the scene hash on BOTH facings; round-trip restores it; gate witnessed from pixels", async ({ page }) => {
    await page.goto(appUrl());

    for (const vs of [{ location: "study", facing: "E" }, { location: "hall", facing: "W" }]) {
      const closed = await hashRender(page, vs, {});
      const open = await hashRender(page, vs, {},
        'world.entities.find((e) => e.id === "door1").state = "open";');
      expect(open, `door toggle changes ${vs.location}/${vs.facing}`).not.toBe(closed);
    }

    // Round-trip through the harness on study/E: a narrated success outcome
    // no walkthrough step reaches, and the swap draws both directions.
    const rt = await page.evaluate(async () => {
      const fx = window.HOLO_FIXTURE;
      const fixture = window.__T.clone({
        world: fx.world, staging: fx.staging, narration: fx.narration,
        viewstate: { location: "study", facing: "E" }
      });
      const h = window.HOLO.harness.create(fixture);
      const vs = { location: "study", facing: "E" };
      const h0 = await window.__T.hashCanvas(window.__T.renderW(h.world, h.staging, vs, {}));
      const envOpen = h.dispatch({ type: "toggle", entity: "door1" });
      const h1 = await window.__T.hashCanvas(window.__T.renderW(h.world, h.staging, vs, {}));
      const envClose = h.dispatch({ type: "toggle", entity: "door1" });
      const h2 = await window.__T.hashCanvas(window.__T.renderW(h.world, h.staging, vs, {}));
      return {
        h0, h1, h2,
        openNarration: envOpen.narration, closeNarration: envClose.narration
      };
    });
    expect(rt.h1).not.toBe(rt.h0);
    expect(rt.h2, "toggle-closed restores the closed scene exactly").toBe(rt.h0);
    expect(rt.openNarration).toBeTruthy();
    expect(rt.closeNarration).toBeTruthy();

    // The closed-frame swap gate, from record and pixels (§1 of the plan is
    // the single home of the gate; this witnesses its two clauses).
    const gate = await page.evaluate(() => {
      const lib = window.HOLO_APP.library["door-plank"];
      const rec = lib.record;
      const st = lib.images.states.open;
      const origin = rec.states_images.open.origin;
      // bottom-extreme opaque row of the open image, in body space:
      const d = st.image.getContext("2d").getImageData(0, 0, st.image.width, st.image.height).data;
      let bottom = -1;
      for (let y = st.image.height - 1; y >= 0 && bottom < 0; y--) {
        for (let x = 0; x < st.image.width; x++) {
          if (d[(y * st.image.width + x) * 4 + 3] >= 128) { bottom = y; break; }
        }
      }
      // recompute the drawn extent from pixels (bottom two rows).
      let ex0 = Infinity, ex1 = -Infinity;
      for (let y = bottom - 1; y <= bottom; y++) {
        for (let x = 0; x < st.image.width; x++) {
          if (d[(y * st.image.width + x) * 4 + 3] >= 128) {
            ex0 = Math.min(ex0, x + origin.x);
            ex1 = Math.max(ex1, x + origin.x);
          }
        }
      }
      return {
        bodyH: rec.px.h, bodyW: rec.px.w,
        stateBottomInBody: origin.y + bottom + 1,
        stateRect: { x0: origin.x, y0: origin.y, x1: origin.x + st.image.width, y1: origin.y + st.image.height },
        libExtent: st.extent, pixelExtent: { x0: ex0, x1: ex1 }
      };
    });
    // (i) vertical registration within 2% of body height
    expect(Math.abs(gate.stateBottomInBody - gate.bodyH))
      .toBeLessThanOrEqual(0.02 * gate.bodyH);
    // (ii) state rect within body canvas bounds
    expect(gate.stateRect.x0).toBeGreaterThanOrEqual(0);
    expect(gate.stateRect.y0).toBeGreaterThanOrEqual(0);
    expect(gate.stateRect.x1).toBeLessThanOrEqual(gate.bodyW);
    expect(gate.stateRect.y1).toBeLessThanOrEqual(gate.bodyH);
    // library extent equals the pixel-recomputed extent
    expect(gate.libExtent.x0).toBe(gate.pixelExtent.x0);
    expect(Math.abs(gate.libExtent.x1 - gate.pixelExtent.x1)).toBeLessThanOrEqual(1);
  });

  test("shadow geometry per placement class: centred at base, no wider than footprint (+ the open door's extent)", async ({ page }) => {
    await page.goto(appUrl());
    const cases = [
      { id: "desk1", sprite: "desk-joined-oak-1660", vs: { location: "study", facing: "N" } },
      { id: "chair1", sprite: "chair-joined", vs: { location: "study", facing: "N" } },
      { id: "door1", sprite: "door-plank", vs: { location: "study", facing: "E" }, pIdx: 0 }
    ];
    for (const c of cases) {
      const rec = await page.evaluate((s) => window.__T.clone(window.HOLO_APP.library[s].record), c.sprite);
      let pl = await page.evaluate((e) => window.__T.clone(window.HOLO_APP.harness.staging.placements[e]), c.id);
      if (Array.isArray(pl)) pl = pl[c.pIdx];
      const P = MF(c.vs.location, c.vs.facing).place(pl, rec);
      const d = await page.evaluate(({ id, vs }) => {
        const fx = window.HOLO_FIXTURE;
        const solo = window.__T.worldWithout(
          fx.world.entities.filter((e) => e.id !== id).map((e) => e.id));
        const withS = window.__T.renderW(solo, fx.staging, vs, { no_backdrop: true, tint: false });
        const noS = window.__T.renderW(solo, fx.staging, vs, { no_backdrop: true, tint: false, shadows: false });
        return window.__T.diffBounds(withS, noS);
      }, { id: c.id, vs: c.vs });
      expect(d.count, `${c.id}: shadow pixels exist`).toBeGreaterThan(0);
      const centre = (d.x0 + d.x1) / 2;
      const footW = P.f * (rec.anchors.footprint.x1 - rec.anchors.footprint.x0);
      // The pool is thrown down-and-right by the UL45 key, by fractions of
      // its own rx — the test states both fractions itself rather than
      // importing them. A pool centred exactly on the base is the one-light
      // tell this offset exists to avoid.
      const rx = footW / 2;
      const ryF = Math.min(1, Math.max(0.3, 4 / rx));
      expect(Math.abs(centre - (P.baseX + 0.22 * rx)),
        `${c.id}: shadow offset with the key, not centred on the base`)
        .toBeLessThanOrEqual(3);
      expect(d.x1 - d.x0 + 1, `${c.id}: shadow no wider than footprint+pad`)
        .toBeLessThanOrEqual(footW + 6);
      // ry is the ratio, floored so a small footprint still gets a pool and
      // capped at rx so a tiny one is not a vertical smear.
      expect(ryF, `${c.id}: pool is never taller than it is wide`).toBeLessThanOrEqual(1);
      expect(Math.abs((d.y0 + d.y1) / 2 - (P.baselineY + 0.35 * rx * ryF)),
        `${c.id}: shadow at the baseline`)
        .toBeLessThanOrEqual(rx * ryF + 4);
    }

    // anchor_on child: note1's shadow on the desk surface.
    const deskRec = await page.evaluate(() => window.__T.clone(window.HOLO_APP.library["desk-joined-oak-1660"].record));
    const noteRec = await page.evaluate(() => window.__T.clone(window.HOLO_APP.library["notebook-vellum"].record));
    const deskPl = await page.evaluate(() => window.__T.clone(window.HOLO_APP.harness.staging.placements.desk1));
    const notePl = await page.evaluate(() => window.__T.clone(window.HOLO_APP.harness.staging.placements.note1));
    const P = MF("study", "N").place(deskPl, deskRec);
    const region = deskRec.anchors.surface_top;
    const baseX = P.drawX + P.f * (region.x0 + (region.x1 - region.x0) * notePl.t);
    const noteShadow = await page.evaluate(() => {
      const fx = window.HOLO_FIXTURE;
      const solo = window.__T.worldWithout(
        fx.world.entities.filter((e) => !["desk1", "note1"].includes(e.id)).map((e) => e.id));
      const noNote = window.__T.worldWithout(["note1"], solo);
      // note's shadow = (desk+note with shadows) minus (desk+note without) minus body...
      // simpler: diff of (desk+note, shadows on) vs (desk+note, shadows off),
      // minus the desk's own shadow region: compare against desk-only diffs.
      const a1 = window.__T.renderW(solo, fx.staging, { location: "study", facing: "N" }, { no_backdrop: true, tint: false });
      const a0 = window.__T.renderW(solo, fx.staging, { location: "study", facing: "N" }, { no_backdrop: true, tint: false, shadows: false });
      const b1 = window.__T.renderW(noNote, fx.staging, { location: "study", facing: "N" }, { no_backdrop: true, tint: false });
      const b0 = window.__T.renderW(noNote, fx.staging, { location: "study", facing: "N" }, { no_backdrop: true, tint: false, shadows: false });
      // note-shadow pixels: differ between a1/a0 but not between b1/b0.
      const W = 1536, H = 1024;
      const da1 = a1.getContext("2d").getImageData(0, 0, W, H).data;
      const da0 = a0.getContext("2d").getImageData(0, 0, W, H).data;
      const db1 = b1.getContext("2d").getImageData(0, 0, W, H).data;
      const db0 = b0.getContext("2d").getImageData(0, 0, W, H).data;
      let x0 = W, y0 = H, x1 = -1, y1 = -1, count = 0;
      const differ = (d1, d2, i) =>
        d1[i] !== d2[i] || d1[i + 1] !== d2[i + 1] || d1[i + 2] !== d2[i + 2] || d1[i + 3] !== d2[i + 3];
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4;
          if (differ(da1, da0, i) && !differ(db1, db0, i)) {
            count++;
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
            if (y < y0) y0 = y;
            if (y > y1) y1 = y;
          }
        }
      }
      return { count, x0, y0, x1, y1 };
    });
    expect(noteShadow.count, "note1 casts a contact shadow on the surface").toBeGreaterThan(0);
    const noteFootW = (noteRec.dims_m.h * P.s / noteRec.px.h) *
      (noteRec.anchors.footprint.x1 - noteRec.anchors.footprint.x0);
    /* Centred at the base plus the ruled key offset. §7's pool is thrown down
       and to the RIGHT (contract UL45), by `SHADOW_DX` of its own radius, so
       "centred at the base" was only ever true while the radius was small
       enough for the offset to hide inside a 3 px tolerance. Row 20's lens
       draws everything on this desk 2.6× larger and the offset came out with
       it, so the expectation states the offset instead of tolerating it. */
    const noteRx = Math.max(noteFootW / 2, 4);
    expect(Math.abs((noteShadow.x0 + noteShadow.x1) / 2 - (baseX + 0.22 * noteRx)),
      "note shadow centred at the child's base, offset by the key").toBeLessThanOrEqual(3);
    expect(noteShadow.x1 - noteShadow.x0 + 1).toBeLessThanOrEqual(noteFootW + 6);
  });

  test("record→images derivation; thumbs are content; backdrop_only equals an entity-free render", async ({ page }) => {
    await page.goto(appUrl());
    const res = await page.evaluate(async () => {
      const lib = window.HOLO_APP.library;
      const derivation = [];
      for (const [id, entry] of Object.entries(lib)) {
        const recParts = (entry.record.parts || []).map((p) => p.id).sort();
        const imgParts = Object.keys(entry.images.parts || {}).sort();
        const recStates = Object.keys(entry.record.states_images || {}).sort();
        const imgStates = Object.keys(entry.images.states || {}).sort();
        if (JSON.stringify(recParts) !== JSON.stringify(imgParts) ||
            JSON.stringify(recStates) !== JSON.stringify(imgStates)) {
          derivation.push({ id, recParts, imgParts, recStates, imgStates });
        }
      }
      const thumbs = {};
      for (const [id, entry] of Object.entries(lib)) {
        if (!entry.record.takeable) continue;
        const t = entry.images.thumb;
        const d = t.getContext("2d").getImageData(0, 0, 128, 128).data;
        let opaque = 0;
        for (let i = 3; i < d.length; i += 4) if (d[i] >= 128) opaque++;
        thumbs[id] = { opaque, hash: await window.__T.hashCanvas(t) };
      }
      const vs = { location: "study", facing: "N" };
      const fx = window.HOLO_FIXTURE;
      const bOnly = await window.__T.hashCanvas(
        window.__T.renderW(fx.world, fx.staging, vs, { backdrop_only: true }));
      const empty = window.__T.clone(fx.world);
      empty.entities = [];
      empty.relations = [];
      empty.knowledge.player = [];
      const emptyH = await window.__T.hashCanvas(window.__T.renderW(empty, fx.staging, vs, {}));
      return { derivation, thumbs, bOnly, emptyH };
    });
    expect(res.derivation, "images tables derive from records").toEqual([]);
    const hashes = Object.values(res.thumbs).map((t) => t.hash);
    expect(new Set(hashes).size, "thumbs pairwise distinct").toBe(hashes.length);
    for (const [id, t] of Object.entries(res.thumbs)) {
      expect(t.opaque, `${id} thumb has content`).toBeGreaterThanOrEqual(500);
    }
    expect(res.bOnly, "backdrop_only == entity-free render").toBe(res.emptyH);
  });

  test("grid facings still render deterministically and structurally (bare facing)", async ({ page }) => {
    await page.goto(appUrl());
    const res = await page.evaluate(async () => {
      const vs = { location: "study", facing: "S" }; // licensed-bare facing
      const c1 = window.__T.renderDirect(vs);
      const c2 = window.__T.renderDirect(vs);
      return {
        h1: await window.__T.hashCanvas(c1),
        h2: await window.__T.hashCanvas(c2)
      };
    });
    expect(res.h1).toBe(res.h2);
  });
});

test.describe("clickability sweep — every staged entity answers a real click (fresh page per entity)", () => {
  const sweep = [
    { boot: null, facing: "study/N", entities: ["desk1", "chair1", "note1"] },
    { boot: { location: "study", facing: "E" }, facing: "study/E", entities: ["door1"] },
    { boot: { location: "hall", facing: "E" }, facing: "hall/E", entities: ["shelf1", "stick1", "coin1"] },
    { boot: { location: "hall", facing: "W" }, facing: "hall/W", entities: ["door1"] }
  ];
  // key1 is excluded: undrawn at boot; its click coverage is the
  // walkthrough's take-key click.

  for (const group of sweep) {
    for (const id of group.entities) {
      test(`${id} on ${group.facing}`, async ({ page, context }) => {
        let root = null;
        try {
          if (group.boot) {
            root = stageTree();
            setViewstate(root, group.boot);
          }
          await page.goto(appUrl(root ?? undefined));
          // Selection rule (mask arithmetic, never hitTest): a pixel of the
          // entity's own drawn mask — computed as the diff between renders
          // with and without it, its anchor-host chain kept so children draw
          // — eroded 1px against subpixel edges, where no later-drawn
          // entity's mask touches.
          const pt = await page.evaluate((id) => {
            const fx = window.HOLO_FIXTURE;
            const h = window.HOLO_APP.harness;
            const vs = h.viewstate;
            const layout = window.__T.currentLayout();
            const me = layout.find((e) => e.id === id);
            if (!me) return { error: "not laid out" };
            const W = 1536, H = 1024;
            const chainOf = (eid) => {
              const out = [];
              let cur = eid;
              for (let i = 0; i < 4; i++) {
                const p = fx.staging.placements[cur];
                if (!p || !p.anchor_on) break;
                cur = p.anchor_on.split(".")[0];
                out.push(cur);
              }
              return out;
            };
            const keepWorld = (ids) => window.__T.worldWithout(
              fx.world.entities.filter((e) => !ids.includes(e.id)).map((e) => e.id));
            const maskOf = (eid) => {
              const chain = chainOf(eid);
              const withIt = window.__T.renderW(keepWorld([eid, ...chain]),
                fx.staging, vs, { no_backdrop: true, shadows: false });
              const withoutIt = window.__T.renderW(keepWorld(chain),
                fx.staging, vs, { no_backdrop: true, shadows: false });
              const a = withIt.getContext("2d").getImageData(0, 0, W, H).data;
              const b = withoutIt.getContext("2d").getImageData(0, 0, W, H).data;
              const m = new Uint8Array(W * H);
              for (let p = 0; p < W * H; p++) {
                const i = p * 4;
                if ((a[i] !== b[i] || a[i + 1] !== b[i + 1] ||
                     a[i + 2] !== b[i + 2] || a[i + 3] !== b[i + 3]) &&
                    a[i + 3] >= 128) m[p] = 1;
              }
              return m;
            };
            const mine = maskOf(id);
            const myIndex = layout.indexOf(me);
            const nearer = layout.slice(myIndex + 1)
              .filter((e) => e.id !== id)
              .map((e) => maskOf(e.id));
            const solidAt = (m, x, y) => {
              for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                  if (!m[(y + dy) * W + (x + dx)]) return false;
                }
              }
              return true;
            };
            const b = window.__T.entryBBox(me);
            for (let y = Math.max(1, Math.floor(b.y)); y < Math.min(H - 1, b.y + b.h); y += 1) {
              for (let x = Math.max(1, Math.floor(b.x)); x < Math.min(W - 1, b.x + b.w); x += 1) {
                if (!solidAt(mine, x, y)) continue;
                if (nearer.some((m) => m[y * W + x])) continue;
                return { x, y };
              }
            }
            return { error: "no unoccluded solid point" };
          }, id);
          expect(pt.error, `${id}: sweep point exists`).toBeUndefined();

          // No chrome eclipses the point.
          const box = await page.locator("#scene").boundingBox();
          const cssX = box.x + (pt.x * box.width) / 1536;
          const cssY = box.y + (pt.y * box.height) / 1024;
          const eclipse = await page.evaluate(({ x, y }) => {
            const el = document.elementFromPoint(x, y);
            return el ? el.id || el.tagName : null;
          }, { x: cssX, y: cssY });
          expect(eclipse, `${id}: scene canvas owns the point`).toBe("scene");

          const before = await page.evaluate(() => window.HOLO_APP.harness.envelopes.length);
          await page.mouse.click(cssX, cssY);
          const env = await page.evaluate((n) => {
            const h = window.HOLO_APP.harness;
            return h.envelopes.length > n ? h.envelopes[h.envelopes.length - 1].intent : null;
          }, before);
          expect(env, `${id}: click dispatched`).not.toBeNull();
          // Doors boot closed, so a door click is a toggle naming the door.
          expect(env.entity, `${id}: envelope names the entity`).toBe(id);
        } finally {
          if (root) removeTree(root);
        }
      });
    }
  }
});

/* "Contact" is one of the named qualities, and §12.8's contact clause only
 * asks that the shadow change SOME pixel — which a shadow at 3/100 alpha,
 * invisible on any floor, satisfies. These cases put a floor under it: a
 * measured darkening, on a floor light enough to be darkened, plus the
 * spread that makes it read as pooled occlusion rather than a hairline. */
test.describe("contact shadows are strong enough to be seen", () => {
  const FLOOR = "#8c8c8c"; // mid-grey: a lit floor, as row 4's backdrops will be

  async function shadowDelta(page, id, viewstate) {
    return await page.evaluate(({ id, viewstate }) => {
      const fx = window.HOLO_FIXTURE;
      const solo = window.__T.worldWithout(
        fx.world.entities.filter((e) => e.id !== id).map((e) => e.id));
      const on = window.__T.renderOnFill(solo, fx.staging, viewstate,
        { tint: false }, "#8c8c8c");
      const off = window.__T.renderOnFill(solo, fx.staging, viewstate,
        { tint: false, shadows: false }, "#8c8c8c");
      const W = 1536, H = 1024;
      const a = on.getContext("2d").getImageData(0, 0, W, H).data;
      const b = off.getContext("2d").getImageData(0, 0, W, H).data;
      let count = 0, maxD = 0, y0 = H, y1 = -1, x0 = W, x1 = -1;
      for (let p = 0; p < W * H; p++) {
        const i = p * 4;
        const d = b[i] - a[i]; // shadow only ever darkens
        if (d > 4) {
          count++;
          if (d > maxD) maxD = d;
          const y = (p / W) | 0, x = p % W;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
        }
      }
      return { count, maxD, h: y1 - y0 + 1, w: x1 - x0 + 1 };
    }, { id, viewstate });
  }

  const grounded = [
    { id: "desk1", vs: { location: "study", facing: "N" } },
    { id: "chair1", vs: { location: "study", facing: "N" } },
    { id: "stick1", vs: { location: "hall", facing: "E" } },
    { id: "shelf1", vs: { location: "hall", facing: "E" } }
  ];

  for (const g of grounded) {
    test(`${g.id}: darkens the ground under it by a visible amount`, async ({ page }) => {
      await page.goto(appUrl());
      const d = await shadowDelta(page, g.id, g.vs);
      const footW = await page.evaluate(({ id, vs }) => {
        const A = window.HOLO_APP;
        const meta = window.__T.metaOf(vs);
        const ent = A.harness.world.entities.find((e) => e.id === id);
        const rec = A.library[ent.sprite].record;
        let pl = A.harness.staging.placements[id];
        if (Array.isArray(pl)) pl = pl[0];
        const p = window.HOLO.groundplane.placeHost(pl, rec, meta, 1536);
        return p.f * (rec.anchors.footprint.x1 - rec.anchors.footprint.x0);
      }, { id: g.id, vs: g.vs });

      // Strength: 0.35 peak on a 140-ish floor is ≈ 49 levels. This is the
      // clause that a shadow at 0.03 alpha — invisible on any floor, and
      // green under every other check in this file — lands at ≈ 4 and fails.
      expect(d.maxD, `${g.id} peak darkening`).toBeGreaterThanOrEqual(20);
      // Shape: a pool spanning the contact, not a hairline. Both thresholds
      // scale with the object's own footprint, so a candlestick is judged as
      // a candlestick and a desk as a desk.
      expect(d.h, `${g.id} visible shadow height in px`).toBeGreaterThanOrEqual(3);
      expect(d.w, `${g.id} shadow spans the footprint`)
        .toBeGreaterThanOrEqual(0.8 * footW);
      expect(d.count, `${g.id} shadowed pixel count`)
        .toBeGreaterThanOrEqual(2 * footW);
    });
  }
});

/* The doorway. A document that says an exit stands here and a picture that
 * shows unbroken wall are the same defect as an entity drawn where truth
 * does not put it — and it left `go` with no target but the edge-on sliver
 * of the opened leaf. The opening belongs to the wall (§11 gives real
 * backdrops a painted frame), so it is drawn in the backdrop layer and is
 * inside backdrop_only. */
test.describe("doorways are in the picture, from the document", () => {
  test("apertures come from exits, one per facing that has one, none on bare walls", async ({ page }) => {
    await page.goto(appUrl());
    const res = await page.evaluate(() => {
      const A = window.HOLO_APP;
      const at = (location, facing) => window.HOLO.renderer.apertures(
        A.harness.world, A.harness.staging, A.library,
        window.__T.metaOf({ location, facing }), { location, facing });
      return {
        studyE: at("study", "E").map((a) => a.exit),
        hallW: at("hall", "W").map((a) => a.exit),
        studyN: at("study", "N").length,
        studyS: at("study", "S").length,
        hallN: at("hall", "N").length
      };
    });
    expect(res.studyE).toEqual(["door_study_hall"]);
    expect(res.hallW).toEqual(["door_hall_study"]);
    expect(res.studyN).toBe(0);
    expect(res.studyS).toBe(0);
    expect(res.hallN).toBe(0);
  });

  test("the opening is drawn on the wall, inside backdrop_only, and the closed leaf covers it", async ({ page }) => {
    await page.goto(appUrl());
    const res = await page.evaluate(async () => {
      const fx = window.HOLO_FIXTURE;
      const A = window.HOLO_APP;
      const vs = { location: "study", facing: "E" };
      const bare = { location: "study", facing: "S" };
      const a = window.HOLO.renderer.apertures(
        A.harness.world, A.harness.staging, A.library,
        window.__T.metaOf(vs), vs)[0];
      const backdropE = window.__T.renderW(fx.world, fx.staging, vs, { backdrop_only: true });
      const backdropS = window.__T.renderW(fx.world, fx.staging, bare, { backdrop_only: true });
      // Wall pixels inside the opening are darker than the same rows on a
      // bare facing: the wall really is broken through.
      const mid = { x: Math.round(a.x + a.w / 2), y: Math.round(a.y + a.h / 2) };
      const px = (c) => c.getContext("2d").getImageData(mid.x, mid.y, 1, 1).data;
      const inside = px(backdropE);
      const bareWall = px(backdropS);
      // The closed leaf covers the opening: the full composite at that pixel
      // is neither the opening nor the bare wall.
      const closed = window.__T.renderW(fx.world, fx.staging, vs, {});
      const openWorld = window.__T.clone(fx.world);
      openWorld.entities.find((e) => e.id === "door1").state = "open";
      const opened = window.__T.renderW(openWorld, fx.staging, vs, {});
      return {
        insideSum: inside[0] + inside[1] + inside[2],
        bareSum: bareWall[0] + bareWall[1] + bareWall[2],
        closedHash: await window.__T.hashRegion(closed, a.x | 0, a.y | 0, a.w | 0, a.h | 0),
        openedHash: await window.__T.hashRegion(opened, a.x | 0, a.y | 0, a.w | 0, a.h | 0),
        backdropHash: await window.__T.hashRegion(backdropE, a.x | 0, a.y | 0, a.w | 0, a.h | 0)
      };
    });
    expect(res.insideSum, "the opening is darker than unbroken wall")
      .toBeLessThan(res.bareSum);
    expect(res.closedHash, "the shut leaf covers the opening").not.toBe(res.backdropHash);
    expect(res.openedHash, "the swung leaf leaves the opening showing")
      .not.toBe(res.closedHash);
  });
});

/* The static overlap check's whole value is that it is bound to what the
 * renderer draws. It imports groundplane.js — but for a while it re-derived
 * the placement layer above it, so a renderer whose placement had been
 * broken still validated clean. Both sides now call placeHost, and this is
 * the witness that they agree pixel for pixel. */
test.describe("the validator's placement is the renderer's placement", () => {
  const staged = [
    { id: "desk1", vs: { location: "study", facing: "N" } },
    { id: "chair1", vs: { location: "study", facing: "N" } },
    { id: "shelf1", vs: { location: "hall", facing: "E" } },
    { id: "stick1", vs: { location: "hall", facing: "E" } },
    { id: "door1", vs: { location: "study", facing: "E" } }
  ];

  for (const s of staged) {
    test(`${s.id}: placeHost agrees with the layout entry exactly`, async ({ page }) => {
      await page.goto(appUrl());
      const res = await page.evaluate(({ id, vs }) => {
        const fx = window.HOLO_FIXTURE;
        const A = window.HOLO_APP;
        const meta = window.__T.metaOf(vs);
        const layout = window.HOLO.renderer.layout(
          fx.world, fx.staging, A.library, meta, vs);
        const e = layout.find((x) => x.id === id);
        if (!e) return null;
        const key = vs.location + "/" + vs.facing;
        let pl = fx.staging.placements[id];
        if (Array.isArray(pl)) pl = pl.find((p) => p.facing === key);
        const p = window.HOLO.groundplane.placeHost(pl, e.record, meta, 1536);
        return {
          layout: { drawX: e.drawX, drawY: e.drawY, baseX: e.baseX, baselineY: e.baselineY, f: e.f },
          placed: { drawX: p.drawX, drawY: p.drawY, baseX: p.baseX, baselineY: p.baselineY, f: p.f }
        };
      }, { id: s.id, vs: s.vs });
      expect(res, `${s.id} laid out`).not.toBeNull();
      expect(res.placed).toEqual(res.layout);
    });
  }
});

/* The whole suite's pointer work runs at 1536×1200, where the canvas
 * displays at scale 1 and one logical pixel is one CSS pixel. That is the
 * viewport where small targets are easiest to hit, and checking only there
 * is the convenient-viewpoint failure: on an ordinary laptop the canvas is
 * scaled down, a logical point maps to a fraction of a CSS pixel, and the
 * coin — six logical pixels across — was not reachable by a hand at all.
 * These run the smallest targets on a common laptop and a common desktop,
 * clicking the middle of the object as a person would. */
test.describe("small takeables answer a real click at ordinary window sizes", () => {
  const viewports = [
    { name: "laptop 1366×768", width: 1366, height: 768 },
    { name: "desktop 1920×1080", width: 1920, height: 1080 }
  ];
  const targets = [
    { id: "coin1", boot: { location: "hall", facing: "E" } },
    { id: "note1", boot: null }
  ];

  for (const vp of viewports) {
    for (const t of targets) {
      test(`${t.id} on ${vp.name}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        let root = null;
        try {
          if (t.boot) {
            root = stageTree();
            setViewstate(root, t.boot);
          }
          await page.goto(appUrl(root ?? undefined));
          // The centre of the entity's own drawn bbox — where a person aims.
          const c = await page.evaluate((id) => {
            const e = window.__T.currentLayout().find((x) => x.id === id);
            if (!e) return null;
            const b = window.__T.entryBBox(e);
            return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
          }, t.id);
          expect(c, `${t.id} is on screen`).not.toBeNull();

          const box = await page.locator("#scene").boundingBox();
          const cssX = box.x + (c.x * box.width) / 1536;
          const cssY = box.y + (c.y * box.height) / 1024;
          const owner = await page.evaluate(({ x, y }) => {
            const el = document.elementFromPoint(x, y);
            return el ? el.id || el.tagName : null;
          }, { x: cssX, y: cssY });
          expect(owner, `${t.id}: the scene canvas owns the point`).toBe("scene");

          const before = await page.evaluate(() => window.HOLO_APP.harness.envelopes.length);
          await page.mouse.click(cssX, cssY);
          const env = await page.evaluate((n) => {
            const h = window.HOLO_APP.harness;
            return h.envelopes.length > n ? h.envelopes[h.envelopes.length - 1].intent : null;
          }, before);
          expect(env, `${t.id}: an aimed click dispatched something`).not.toBeNull();
          expect(env.entity, `${t.id}: and it named the thing aimed at`).toBe(t.id);
        } finally {
          if (root) removeTree(root);
        }
      });
    }
  }
});

/* The hover highlight is the only thing on screen telling a player that
 * anything can be touched, and it used to be a rectangle around the sprite's
 * full frame — an editor's selection marquee, taking in empty space and
 * crossing whatever stood behind. It traces the silhouette now, and these
 * are the two facts that distinguish the one from the other. */
test.describe("the hover highlight traces the shape, not a box", () => {
  test("the outline follows the silhouette and leaves the interior alone", async ({ page }) => {
    await page.goto(appUrl());
    const box = await page.locator("#scene").boundingBox();
    const pt = await page.evaluate(() => window.__T.clickPoint("chair1"));
    await page.mouse.move(
      box.x + (pt.x * box.width) / 1536,
      box.y + (pt.y * box.height) / 1024);

    const res = await page.evaluate(() => {
      const o = document.getElementById("overlay");
      const b = window.__T.alphaBounds(o, 1);
      const e = window.__T.currentLayout().find((x) => x.id === "chair1");
      const bb = window.__T.entryBBox(e);
      const W = o.width, H = o.height;
      const data = o.getContext("2d").getImageData(0, 0, W, H).data;
      let inked = 0;
      for (let p = 0; p < W * H; p++) if (data[p * 4 + 3] > 8) inked++;
      // The silhouette itself, from a solo render of the same entity.
      const fx = window.HOLO_FIXTURE;
      const solo = window.__T.worldWithout(
        fx.world.entities.filter((x) => x.id !== "chair1").map((x) => x.id));
      const s = window.__T.renderW(solo, fx.staging, { location: "study", facing: "N" },
        { no_backdrop: true, shadows: false, tint: false });
      const sd = s.getContext("2d").getImageData(0, 0, W, H).data;
      let interiorInk = 0, solid = 0;
      for (let p = 0; p < W * H; p++) {
        if (sd[p * 4 + 3] >= 250) {
          solid++;
          if (data[p * 4 + 3] > 8) interiorInk++;
        }
      }
      return { inked, bboxArea: bb.w * bb.h, solid, interiorInk };
    });

    // A filled or stroked rectangle would ink the whole frame border; an
    // outline of a shape inks a thin band. Well under a fifth of the box.
    expect(res.inked, "outline ink is a band, not a frame")
      .toBeLessThan(res.bboxArea * 0.2);
    expect(res.inked, "but there is an outline").toBeGreaterThan(200);
    // It does not paint over the object it is outlining.
    expect(res.interiorInk / res.solid, "the interior stays clear")
      .toBeLessThan(0.05);
  });
});

/* Two places where the renderer and the rest of the system had quietly
 * different ideas about the document. Neither was reachable from the shipped
 * fixture, and both would have arrived as a mystery at row 4. */
test.describe("the renderer reads the document the harness reads", () => {
  test("contents clip to the anchor region the staging NAMES, not to a fixed drawer_cavity", async ({ page }) => {
    // Position came from the named region and the clip from a hardcoded
    // `drawer_cavity`, so a fixture anchoring contents anywhere else got a
    // silently empty scene — validator green, truth saying the thing is
    // there, picture showing nothing — or a throw into the fault state on a
    // host record with no cavity at all.
    await page.goto(appUrl());
    const res = await page.evaluate(async () => {
      const fx = window.HOLO_FIXTURE;
      const vs = { location: "study", facing: "N" };
      const staging = window.__T.clone(fx.staging);
      staging.placements.key1 = { anchor_on: "desk1.surface_top", t: 0.5 };
      const world = window.__T.clone(fx.world);
      world.entities.find((e) => e.id === "desk1").state = "open";
      world.knowledge.player.push("key1");
      const withKey = window.__T.renderW(world, staging, vs,
        { no_backdrop: true, shadows: false });
      const noKey = window.__T.renderW(
        window.__T.worldWithout(["key1"], world), staging, vs,
        { no_backdrop: true, shadows: false });
      const d = window.__T.diffBounds(withKey, noKey);
      const desk = window.HOLO.renderer.layout(world, staging, window.__T.lib(),
        window.__T.metaOf(vs), vs).find((e) => e.id === "desk1");
      const top = desk.record.anchors.surface_top;
      return {
        count: d.count,
        y0: d.y0,
        surfaceY0: desk.drawY + desk.f * top.y0,
        surfaceY1: desk.drawY + desk.f * top.y1,
        cavityY0: desk.drawY + desk.f * desk.record.anchors.drawer_cavity.y0
      };
    });
    // Clipped to surface_top — a thin band, so a modest count; the old code
    // clipped to drawer_cavity instead and drew nothing at all here.
    expect(res.count, "the key drawn where the staging puts it").toBeGreaterThan(20);
    // And it is up on the desk top, not down where the cavity clip used to be.
    expect(res.y0).toBeLessThan(res.cavityY0);
  });

  test("a two-hop anchor chain draws — nothing is takeable that was never on screen", async ({ page }) => {
    // The harness resolves anchor_on chains when deciding what is reachable;
    // the renderer only matched children against directly-staged hosts. A
    // two-hop child was therefore absent from the picture while `take`
    // succeeded on it and it landed in the inventory.
    await page.goto(appUrl());
    const res = await page.evaluate(async () => {
      const fx = window.HOLO_FIXTURE;
      const vs = { location: "study", facing: "N" };
      const world = window.__T.clone(fx.world);
      const staging = window.__T.clone(fx.staging);
      // A shelf standing on the desk, and a coin on the shelf: coin2 is two
      // anchor hops from anything staged on a facing. (Only the desk and the
      // shelf carry surface regions, so this is the shortest real chain the
      // M0 records can make.)
      world.entities.push({ id: "shelf2", sprite: "shelf-oak", location: "study" });
      world.entities.push({ id: "coin2", sprite: "coin-silver", takeable: true });
      world.relations.push(["on", "coin2", "shelf2"]);
      world.knowledge.player.push("shelf2", "coin2");
      staging.placements.shelf2 = { anchor_on: "desk1.surface_top", t: 0.5 };
      staging.placements.coin2 = { anchor_on: "shelf2.surface_top", t: 0.5 };
      const layout = window.HOLO.renderer.layout(world, staging, window.__T.lib(),
        window.__T.metaOf(vs), vs);
      const entry = layout.find((e) => e.id === "coin2");
      const withIt = window.__T.renderW(world, staging, vs,
        { no_backdrop: true, shadows: false });
      const without = window.__T.renderW(
        window.__T.worldWithout(["coin2"], world), staging, vs,
        { no_backdrop: true, shadows: false });
      // The harness's own view: is it reachable to `take`?
      const h = window.HOLO.harness.create({
        world: world, staging: staging, narration: fx.narration, viewstate: vs
      });
      const env = h.dispatch({ type: "take", entity: "coin2" });
      return {
        laidOut: !!entry,
        hostId: entry ? entry.hostId : null,
        drawn: window.__T.diffBounds(withIt, without).count,
        takeEvents: env.events.length
      };
    });
    expect(res.laidOut, "the two-hop child is in the draw list").toBe(true);
    expect(res.hostId).toBe("shelf2");
    expect(res.drawn, "and its pixels are on the scene").toBeGreaterThan(0);
    // The harness could always take it; the point is that the picture agrees.
    expect(res.takeEvents).toBeGreaterThan(0);
  });
});

/* Guards for mechanisms that were present and correct but held by nothing:
 * delete each and the suite used to stay green, which is the same failure as
 * not having built them. Each case below is written so that removing the
 * mechanism it names turns it red. */
test.describe("mechanisms that were unguarded", () => {
  test("cavity clip: contents are CUT at the region, not merely positioned by it", async ({ page }) => {
    // The shipped key fits inside the shipped cavity, so the clip is a no-op
    // on the fixture and deleting it changed nothing any test could see.
    // Anchoring the key on the desk's thin surface_top band makes it overflow
    // its region, so the cut has to do work.
    await page.goto(appUrl());
    const res = await page.evaluate(() => {
      const fx = window.HOLO_FIXTURE;
      const vs = { location: "study", facing: "N" };
      const staging = window.__T.clone(fx.staging);
      staging.placements.key1 = { anchor_on: "desk1.surface_top", t: 0.5 };
      const world = window.__T.clone(fx.world);
      world.entities.find((e) => e.id === "desk1").state = "open";
      world.knowledge.player.push("key1");
      const withKey = window.__T.renderW(world, staging, vs,
        { no_backdrop: true, shadows: false });
      const noKey = window.__T.renderW(
        window.__T.worldWithout(["key1"], world), staging, vs,
        { no_backdrop: true, shadows: false });
      const desk = window.HOLO.renderer.layout(world, staging, window.__T.lib(),
        window.__T.metaOf(vs), vs).find((e) => e.id === "desk1");
      const r = desk.record.anchors.surface_top;
      const rect = {
        x0: desk.drawX + desk.f * r.x0, y0: desk.drawY + desk.f * r.y0,
        x1: desk.drawX + desk.f * r.x1, y1: desk.drawY + desk.f * r.y1
      };
      const W = 1536, H = 1024;
      const a = withKey.getContext("2d").getImageData(0, 0, W, H).data;
      const b = noKey.getContext("2d").getImageData(0, 0, W, H).data;
      let inside = 0, outside = 0;
      for (let p = 0; p < W * H; p++) {
        const i = p * 4;
        if (a[i] === b[i] && a[i + 1] === b[i + 1] &&
            a[i + 2] === b[i + 2] && a[i + 3] === b[i + 3]) continue;
        const x = p % W, y = (p / W) | 0;
        if (x >= rect.x0 - 1 && x <= rect.x1 + 1 &&
            y >= rect.y0 - 1 && y <= rect.y1 + 1) inside++;
        else outside++;
      }
      return { inside, outside };
    });
    expect(res.inside, "the key draws inside its region").toBeGreaterThan(20);
    expect(res.outside, "and NOTHING of it escapes the region").toBe(0);
  });

  test("hit regions are alpha regions: a transparent pixel inside the box is not a hit", async ({ page }) => {
    // §7 pins "each drawn entity's screen-space alpha bounds". Making the
    // alpha sampler return 255 turns hit-testing into bounding-box testing —
    // clicks land on things through their own gaps — and nothing noticed.
    await page.goto(appUrl());
    const res = await page.evaluate(() => {
      const fx = window.HOLO_FIXTURE;
      const vs = { location: "study", facing: "N" };
      const layout = window.__T.currentLayout();
      const chair = layout.find((e) => e.id === "chair1");
      const b = window.__T.entryBBox(chair);
      const solo = window.__T.renderW(
        window.__T.worldWithout(
          fx.world.entities.filter((e) => e.id !== "chair1").map((e) => e.id)),
        fx.staging, vs, { no_backdrop: true, shadows: false });
      const W = 1536, H = 1024;
      const d = solo.getContext("2d").getImageData(0, 0, W, H).data;
      const alphaAt = (x, y) => d[((y * W + x) * 4) + 3];
      const full = window.__T.renderW(fx.world, fx.staging, vs,
        { no_backdrop: true, shadows: false });
      const fd = full.getContext("2d").getImageData(0, 0, W, H).data;
      // Nothing at all painted in a 5×5 around the point, so a hit there
      // cannot be a one-pixel sampling difference at somebody's edge.
      const clearAround = (x, y) => {
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            if (fd[(((y + dy) * W + (x + dx)) * 4) + 3] >= 8) return false;
          }
        }
        return true;
      };
      // A hole: transparent, well inside the chair's own box, with solid
      // chair pixels both left and right on the same row.
      for (let y = Math.floor(b.y) + 4; y < b.y + b.h - 4; y++) {
        for (let x = Math.floor(b.x) + 4; x < b.x + b.w - 4; x++) {
          if (alphaAt(x, y) >= 8) continue;
          let left = false, right = false;
          for (let k = 1; k < b.w; k++) {
            if (x - k > b.x && alphaAt(x - k, y) >= 200) left = true;
            if (x + k < b.x + b.w && alphaAt(x + k, y) >= 200) right = true;
          }
          if (!left || !right) continue;
          if (!clearAround(x, y)) continue;
          return {
            point: { x, y },
            hit: window.HOLO.renderer.hitTest(layout, window.HOLO_APP.library, x, y),
            insideBox: x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h
          };
        }
      }
      return null;
    });
    expect(res, "the chair has a hole inside its own box").not.toBeNull();
    expect(res.insideBox).toBe(true);
    expect(res.hit, "a see-through pixel answers no click").toBeNull();
  });

  test("the hover outline inks the inside of a hole — a rectangle never could", async ({ page }) => {
    // The three earlier thresholds (ink < 0.2 × box, ink > 200, interior ink
    // < 5%) are all satisfied by a rectangular ring, which is exactly the
    // marquee the silhouette outline replaced. Ink deep inside the box, at
    // the rim of the chair's own opening, is what only a silhouette produces.
    await page.goto(appUrl());
    const box = await page.locator("#scene").boundingBox();
    const pt = await page.evaluate(() => window.__T.clickPoint("chair1"));
    await page.mouse.move(
      box.x + (pt.x * box.width) / 1536,
      box.y + (pt.y * box.height) / 1024);
    const deepInk = await page.evaluate(() => {
      const o = document.getElementById("overlay");
      const chair = window.__T.currentLayout().find((e) => e.id === "chair1");
      const b = window.__T.entryBBox(chair);
      const W = o.width, H = o.height;
      const d = o.getContext("2d").getImageData(0, 0, W, H).data;
      const pad = 8; // further inside than any frame stroke could reach
      let deep = 0;
      for (let y = Math.ceil(b.y) + pad; y < b.y + b.h - pad; y++) {
        for (let x = Math.ceil(b.x) + pad; x < b.x + b.w - pad; x++) {
          if (d[((y * W + x) * 4) + 3] > 8) deep++;
        }
      }
      return deep;
    });
    expect(deepInk, "outline ink well inside the box, around the seat opening")
      .toBeGreaterThan(50);
  });

  test("the open door's shadow follows the drawn sliver, not the closed leaf's footprint", async ({ page }) => {
    // The renderer's own comment calls a full-width pool under an edge-on
    // sliver "the lie this rule exists to prevent"; reverting the rule left
    // every check green, because the one shadow-geometry case that names the
    // door renders it CLOSED.
    await page.goto(appUrl());
    const res = await page.evaluate(() => {
      const fx = window.HOLO_FIXTURE;
      const vs = { location: "study", facing: "E" };
      const world = window.__T.worldWithout(
        fx.world.entities.filter((e) => e.id !== "door1").map((e) => e.id));
      world.entities.find((e) => e.id === "door1").state = "open";
      const withS = window.__T.renderOnFill(world, fx.staging, vs,
        { tint: false }, "#8c8c8c");
      const noS = window.__T.renderOnFill(world, fx.staging, vs,
        { tint: false, shadows: false }, "#8c8c8c");
      const d = window.__T.diffBounds(withS, noS);
      const e = window.HOLO.renderer.layout(world, fx.staging, window.__T.lib(),
        window.__T.metaOf(vs), vs).find((x) => x.id === "door1");
      const rec = e.record;
      return {
        shadowW: d.count ? d.x1 - d.x0 + 1 : 0,
        extentW: e.f * (e.swap.extent.x1 - e.swap.extent.x0),
        footprintW: e.f * (rec.anchors.footprint.x1 - rec.anchors.footprint.x0)
      };
    });
    expect(res.shadowW, "there is a shadow").toBeGreaterThan(0);
    // The sliver is a quarter of the leaf; the pool must follow it.
    expect(res.shadowW).toBeLessThanOrEqual(res.extentW + 6);
    expect(res.shadowW, "and is nowhere near the closed footprint")
      .toBeLessThan(res.footprintW * 0.6);
  });

  test("a doorway the player does not know about leaves no opening in the wall", async ({ page }) => {
    // apertures() looked up the exit's leaf in world.entities with no
    // knowledge filter, so an unknown door still cut its shape into the wall
    // and still answered clicks. "The renderer never reads unknown entities"
    // is categorical.
    await page.goto(appUrl());
    const res = await page.evaluate(async () => {
      const fx = window.HOLO_FIXTURE;
      const vs = { location: "study", facing: "E" };
      const unknown = window.__T.clone(fx.world);
      unknown.knowledge.player = unknown.knowledge.player.filter((id) => id !== "door1");
      const known = fx.world;
      const list = window.HOLO.renderer.apertures(
        unknown, fx.staging, window.__T.lib(), window.__T.metaOf(vs), vs);
      const a = window.HOLO.renderer.apertures(
        known, fx.staging, window.__T.lib(), window.__T.metaOf(vs), vs)[0];
      const mid = { x: Math.round(a.x + a.w / 2), y: Math.round(a.y + a.h / 2) };
      const unknownScene = window.__T.renderW(unknown, fx.staging, vs, {});
      /* THE SAME WALL WITH THE DOOR TAKEN OUT OF THE DOCUMENT, rather than a
         different facing that happens to share a meta. It used to be study/W —
         the study's opposite wall, same 4.80 m at the same 4.09 m standpoint —
         and the standing-eye wave painted study/W, so "the same wall" became
         an oil painting and the comparison became two different pictures. The
         wall this facing draws with no opening in its meta is study/E's own
         wall by construction, and it cannot be made stale by a promotion. */
      const bare = (() => {
        const bd = {};
        for (const k of Object.keys(window.__T.bd())) bd[k] = window.__T.bd()[k];
        const meta = JSON.parse(JSON.stringify(window.__T.metaOf(vs)));
        meta.openings = [];
        bd["study/E"] = { meta };
        const c = document.createElement("canvas");
        c.width = 1536; c.height = 1024;
        window.HOLO.renderer.render(c, unknown, fx.staging, window.__T.lib(), bd, vs, {});
        return c;
      })();
      const px = (c) => {
        const d = c.getContext("2d").getImageData(mid.x, mid.y, 1, 1).data;
        return d[0] + d[1] + d[2];
      };
      return { apertures: list.length, atMid: px(unknownScene), bareWall: px(bare) };
    });
    expect(res.apertures, "no opening for an unknown door").toBe(0);
    expect(res.atMid, "and the wall there is just wall").toBe(res.bareWall);
  });

  test("the two door facings are not the same picture", async ({ page }) => {
    // study/E and hall/W are both "a wall and a door". The facing glyph is
    // §7's answer to that — and it was being painted over by the doorway it
    // stood in the middle of, leaving the two rooms 99.98% identical from
    // their connecting walls, open or shut.
    await page.goto(appUrl());
    const res = await page.evaluate(() => {
      const fx = window.HOLO_FIXTURE;
      const open = window.__T.clone(fx.world);
      open.entities.find((e) => e.id === "door1").state = "open";
      const count = (w, a, b) => {
        const ca = window.__T.renderW(w, fx.staging, a, {});
        const cb = window.__T.renderW(w, fx.staging, b, {});
        return window.__T.diffBounds(ca, cb).count;
      };
      const E = { location: "study", facing: "E" };
      const Wf = { location: "hall", facing: "W" };
      return { shut: count(fx.world, E, Wf), open: count(open, E, Wf) };
    });
    // A whole glyph is thousands of pixels; the old sliver above the doorway
    // was 267.
    expect(res.shut, "shut: the facings differ by more than a sliver").toBeGreaterThan(2000);
    expect(res.open, "open: likewise").toBeGreaterThan(2000);
  });
});

/* What a click means, asked of the shipped resolver at real display scales.
 * Two directions, because the first version of this battery only had one and
 * the fix it guarded went too far: forgiveness for a small takeable turned
 * into a takeable outranking everything near it, and on a phone the notebook
 * answered clicks on the drawer, on the chair and on bare wall.
 *
 * The rule these pin: a takeable owns its own drawn rectangle (a click on a
 * transparent pixel inside the key still means the key, not the desk behind
 * it), and owns nothing beyond it. */
test.describe("what a click means, at the sizes people actually use", () => {
  const viewports = [
    { name: "phone 390×844", width: 390, height: 844 },
    { name: "laptop 1366×768", width: 1366, height: 768 },
    { name: "desktop 1920×1080", width: 1920, height: 1080 }
  ];

  async function resolveAt(page, x, y) {
    return await page.evaluate(({ x, y }) => {
      const r = window.HOLO_APP.resolve({ x, y });
      return r.kind === "entity" ? r.id : r.kind;
    }, { x, y });
  }

  for (const vp of viewports) {
    test(`${vp.name}: a takeable owns its own rectangle and nothing outside it`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(appUrl());
      const g = await page.evaluate(() => {
        const L = window.__T.currentLayout();
        const box = (id) => {
          const e = L.find((x) => x.id === id);
          return e ? window.__T.entryBBox(e) : null;
        };
        return { note: box("note1"), desk: box("desk1"), chair: box("chair1") };
      });
      expect(g.note).not.toBeNull();

      // Inside the notebook's own rectangle — including its transparent
      // corners — the notebook wins over the desk it stands on.
      for (const [fx, fy] of [[0.5, 0.5], [0.05, 0.05], [0.95, 0.95], [0.05, 0.95]]) {
        const id = await resolveAt(page, g.note.x + fx * g.note.w, g.note.y + fy * g.note.h);
        expect(id, `${vp.name}: inside the notebook means the notebook`).toBe("note1");
      }

      // The drawer face — the one affordance the placeholder art draws, and
      // the gateway to the whole M0 premise — means the desk.
      const drawer = await page.evaluate(() => {
        const e = window.__T.currentLayout().find((x) => x.id === "desk1");
        const part = e.record.parts[0];
        return {
          x: e.drawX + e.f * (part.origin.x + 40),
          y: e.drawY + e.f * (part.origin.y + 12)
        };
      });
      expect(await resolveAt(page, drawer.x, drawer.y),
        `${vp.name}: the drawer face means the desk`).toBe("desk1");

      // The chair back means the chair.
      const chairPt = await page.evaluate(() => window.__T.clickPoint("chair1"));
      expect(await resolveAt(page, chairPt.x, chairPt.y),
        `${vp.name}: the chair means the chair`).toBe("chair1");

      // Bare wall well clear of everything means nothing at all — dead space
      // stays dead however small the display scale makes a CSS margin.
      expect(await resolveAt(page, g.note.x + g.note.w / 2, g.note.y - 90),
        `${vp.name}: bare wall above the desk dispatches nothing`).toBe("none");
      expect(await resolveAt(page, g.chair.x + g.chair.w + 70, g.chair.y + g.chair.h - 10),
        `${vp.name}: bare floor beside the chair dispatches nothing`).toBe("none");
    });
  }

  test("a click on a see-through pixel of the revealed key still means the key", async ({ page }) => {
    // Children draw over their host, so a transparent pixel inside the key's
    // rectangle is desk pixels underneath — and dispatching `toggle desk1`
    // there shuts the drawer over the reveal the player just earned.
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto(appUrl());
    await page.evaluate(() => window.HOLO_APP.dispatch({ type: "toggle", entity: "desk1" }));
    const hole = await page.evaluate(() => {
      const A = window.HOLO_APP;
      const L = window.__T.currentLayout();
      const key = L.find((x) => x.id === "key1");
      const b = window.__T.entryBBox(key);
      for (let y = Math.ceil(b.y); y < b.y + b.h; y++) {
        for (let x = Math.ceil(b.x); x < b.x + b.w; x++) {
          if (window.HOLO.renderer.hitTest(L, A.library, x, y) === "desk1") {
            return { x, y };
          }
        }
      }
      return null;
    });
    expect(hole, "the key has a see-through pixel over the desk").not.toBeNull();
    const id = await page.evaluate(({ x, y }) => {
      const r = window.HOLO_APP.resolve({ x, y });
      return r.kind === "entity" ? r.id : r.kind;
    }, hole);
    expect(id).toBe("key1");
  });
});

/* Contact, measured on the floor the product actually draws. The clause
 * above renders onto a synthetic lit fill, which is right for the strength of
 * the mechanism and wrong as evidence about the picture a V1 visitor sees:
 * grid mode is a product mode (§7), not a stand-in for row 4's backdrops, and
 * on its own floor the earlier build took at most 6/255 out of the ground. */
test.describe("contact reads on the floor the product ships", () => {
  /* Every grounded object present, which is what §7 step 6 says — the four
   * floor-standing hosts AND the anchor_on children, whose pools are derived
   * rather than read off a footprint and whose clause ("an on-surface object
   * with no grounding is a sticker") had no magnitude gate at all. Row 4
   * replaces every one of these sprites, so the population has to be the
   * rule and not a list of the four that happened to be checked. */
  const grounded = [
    { id: "desk1", vs: { location: "study", facing: "N" } },
    { id: "chair1", vs: { location: "study", facing: "N" } },
    { id: "stick1", vs: { location: "hall", facing: "E" } },
    { id: "shelf1", vs: { location: "hall", facing: "E" } },
    { id: "note1", vs: { location: "study", facing: "N" }, host: "desk1", surface: true },
    { id: "coin1", vs: { location: "hall", facing: "E" }, host: "shelf1", surface: true },
    { id: "key1", vs: { location: "study", facing: "N" }, host: "desk1", surface: true, reveal: true }
  ];

  for (const g of grounded) {
    test(`${g.id}: the grid floor is measurably darker under it`, async ({ page }) => {
      await page.goto(appUrl());
      const d = await page.evaluate(({ id, vs, host, reveal }) => {
        const fx = window.HOLO_FIXTURE;
        // An anchored child reaches the scene only through its host, so the
        // host stays — and its own pool is subtracted out, because both
        // renders carry it.
        const keep = host ? [id, host] : [id];
        const solo = window.__T.worldWithout(
          fx.world.entities.filter((e) => !keep.includes(e.id)).map((e) => e.id));
        if (host) {
          const h = solo.entities.find((e) => e.id === host);
          if (h && h.states) h.state = "open";
        }
        if (reveal && !solo.knowledge.player.includes(id)) solo.knowledge.player.push(id);
        // The shipped grid, not a fill: renderW passes no backdrops.
        const on = window.__T.renderW(solo, fx.staging, vs, { tint: false });
        const off = window.__T.renderW(solo, fx.staging, vs, { tint: false, shadows: false });
        const W = 1536, H = 1024;
        const a = on.getContext("2d").getImageData(0, 0, W, H).data;
        const b = off.getContext("2d").getImageData(0, 0, W, H).data;
        let count = 0, maxD = 0, maxChannel = 0;
        for (let p = 0; p < W * H; p++) {
          const i = p * 4;
          const dd = (b[i] - a[i]) + (b[i + 1] - a[i + 1]) + (b[i + 2] - a[i + 2]);
          if (dd > 6) {
            count++;
            if (dd > maxD) maxD = dd;
            for (let ch = 0; ch < 3; ch++) {
              const c = b[i + ch] - a[i + ch];
              if (c > maxChannel) maxChannel = c;
            }
          }
        }
        const meta = window.__T.metaOf(vs);
        // The drawn footprint, read off the layout so it is right for an
        // anchored child (whose scale comes from its host's baseline) as well
        // as for a floor host.
        const lay = window.HOLO.renderer.layout(solo, fx.staging,
          window.__T.lib(), meta, vs);
        const e = lay.find((x) => x.id === id);
        const footW = e
          ? e.f * (e.record.anchors.footprint.x1 - e.record.anchors.footprint.x0) : 0;
        return { count, maxD, maxChannel, footW, drawn: !!e };
      }, { id: g.id, vs: g.vs, host: g.host || null, reveal: !!g.reveal });
      expect(d.drawn, `${g.id} is on the scene`).toBe(true);
      /* The SAME bar the lit-fill clause sets — 20 levels on a channel — and
       * on the floor the product actually draws. A channel-sum threshold let
       * the shipped frame come in at 12–18 per channel while reading as a
       * pass, and the lit-fill clause measured against a substitute floor
       * four times brighter than the real one, so between them the named
       * quality was certified by nothing. */
      expect(d.maxChannel, `${g.id}: peak per-channel darkening on the grid floor`)
        .toBeGreaterThanOrEqual(20);
      /* An area, not a few pixels. Two floors, because either alone let a
       * hairline through: one scaled to the object (a candlestick is judged
       * as a candlestick) and one absolute, because the coin's footprint is
       * under a pixel wide at its drawn scale and its whole pool came to
       * FIVE darkened pixels while a footprint-scaled threshold called that
       * a pass. */
      expect(d.count, `${g.id}: an area scaled to the object`)
        .toBeGreaterThanOrEqual(2 * d.footW);
      expect(d.count, `${g.id}: and an area at all — ${d.count} darkened pixels`)
        .toBeGreaterThanOrEqual(24);
    });
  }
});

test.describe("a cavity content's shadow is cut at the cavity too", () => {
  test("the pool under an oversized content does not spill out of the region", async ({ page }) => {
    // The renderer's own comment says the clip is applied to the shadow
    // "either", but the shipped key's pool sits well inside the shipped
    // cavity, so removing that clip changed nothing any check could see.
    // Anchoring the key on the desk's thin surface_top band makes the pool
    // reach past the region, so the cut has to do work.
    await page.goto(appUrl());
    const res = await page.evaluate(() => {
      const fx = window.HOLO_FIXTURE;
      const vs = { location: "study", facing: "N" };
      const staging = window.__T.clone(fx.staging);
      staging.placements.key1 = { anchor_on: "desk1.surface_top", t: 0.5 };
      const world = window.__T.clone(fx.world);
      world.entities.find((e) => e.id === "desk1").state = "open";
      world.knowledge.player.push("key1");
      // Shadows on vs off, with the key present in both, isolates the pool.
      const on = window.__T.renderW(world, staging, vs, { no_backdrop: true, tint: false });
      const off = window.__T.renderW(world, staging, vs,
        { no_backdrop: true, tint: false, shadows: false });
      const desk = window.HOLO.renderer.layout(world, staging, window.__T.lib(),
        window.__T.metaOf(vs), vs).find((e) => e.id === "desk1");
      const r = desk.record.anchors.surface_top;
      const rect = {
        x0: desk.drawX + desk.f * r.x0, y0: desk.drawY + desk.f * r.y0,
        x1: desk.drawX + desk.f * r.x1, y1: desk.drawY + desk.f * r.y1
      };
      const W = 1536, H = 1024;
      const a = on.getContext("2d").getImageData(0, 0, W, H).data;
      const b = off.getContext("2d").getImageData(0, 0, W, H).data;
      // Only the key's own pool differs; the desk's own shadow is outside
      // the region and identical in both, so restrict to the region's
      // neighbourhood in y.
      let inside = 0, below = 0;
      for (let p = 0; p < W * H; p++) {
        const i = p * 4;
        if (a[i] === b[i] && a[i + 1] === b[i + 1] &&
            a[i + 2] === b[i + 2] && a[i + 3] === b[i + 3]) continue;
        const x = p % W, y = (p / W) | 0;
        if (y > rect.y1 + 1 && y < rect.y1 + 40 && x > rect.x0 - 40 && x < rect.x1 + 40) below++;
        else if (y >= rect.y0 - 1 && y <= rect.y1 + 1) inside++;
      }
      return { inside, below };
    });
    expect(res.inside, "the pool draws inside the region").toBeGreaterThan(0);
    expect(res.below, "and none of it spills below the region's edge").toBe(0);
  });
});

test.describe("harness invariants the Construct-transport seam rests on", () => {
  test("create() copies the fixture instead of writing through it", async ({ page }) => {
    await page.goto(appUrl());
    const res = await page.evaluate(() => {
      const fx = window.HOLO_FIXTURE;
      const beforeWorld = JSON.stringify(fx.world);
      const beforeStaging = JSON.stringify(fx.staging);
      const h = window.HOLO.harness.create(fx);
      h.dispatch({ type: "toggle", entity: "desk1" });
      h.dispatch({ type: "take", entity: "note1" });
      return {
        worldUntouched: JSON.stringify(fx.world) === beforeWorld,
        stagingUntouched: JSON.stringify(fx.staging) === beforeStaging,
        harnessMoved: h.world.entities.find((e) => e.id === "desk1").state === "open"
      };
    });
    expect(res.harnessMoved, "the harness's own copy moved").toBe(true);
    expect(res.worldUntouched, "the baked fixture is not written through").toBe(true);
    expect(res.stagingUntouched).toBe(true);
  });

  test("viewstate is handed out as a copy, not as the live object", async ({ page }) => {
    await page.goto(appUrl());
    const res = await page.evaluate(() => {
      const h = window.HOLO.harness.create(window.__T.clone(window.HOLO_FIXTURE));
      const vs = h.viewstate;
      vs.location = "atrium";
      vs.facing = "Z";
      return h.viewstate;
    });
    expect(res, "scribbling on the returned viewstate does not move the world")
      .toEqual({ location: "study", facing: "N" });
  });
});

test.describe("contact on the placement classes nothing was measuring", () => {
  /* Both earlier contact batteries enumerate the same four floor-standing
   * hosts. The swung door's pool and every `anchor_on` child's pool — the
   * two classes whose geometry is derived rather than read straight off the
   * footprint — were in neither list, so the one placement class whose pool
   * is a smear was the one nothing looked at. */
  async function poolOf(page, id, viewstate, doctorOpen) {
    return await page.evaluate(({ id, viewstate, doctorOpen }) => {
      const fx = window.HOLO_FIXTURE;
      const keep = id === "note1" ? ["desk1", "note1"]
        : id === "coin1" ? ["shelf1", "coin1"] : [id];
      const world = window.__T.worldWithout(
        fx.world.entities.filter((e) => !keep.includes(e.id)).map((e) => e.id));
      if (doctorOpen) world.entities.find((e) => e.id === doctorOpen).state = "open";
      const on = window.__T.renderW(world, fx.staging, viewstate, { tint: false });
      const off = window.__T.renderW(world, fx.staging, viewstate,
        { tint: false, shadows: false });
      const W = 1536, H = 1024;
      const a = on.getContext("2d").getImageData(0, 0, W, H).data;
      const b = off.getContext("2d").getImageData(0, 0, W, H).data;
      let count = 0, maxD = 0, x0 = W, x1 = -1;
      for (let p = 0; p < W * H; p++) {
        const i = p * 4;
        const d = (b[i] - a[i]) + (b[i + 1] - a[i + 1]) + (b[i + 2] - a[i + 2]);
        if (d > 6) {
          count++;
          if (d > maxD) maxD = d;
          const x = p % W;
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
        }
      }
      return { count, maxD, w: x1 - x0 + 1 };
    }, { id, viewstate, doctorOpen });
  }

  test("the swung door gets a pool under the sliver it actually draws", async ({ page }) => {
    await page.goto(appUrl());
    const closed = await poolOf(page, "door1", { location: "study", facing: "E" }, null);
    const open = await poolOf(page, "door1", { location: "study", facing: "E" }, "door1");
    expect(closed.count, "shut leaf has a pool").toBeGreaterThan(0);
    expect(open.count, "and so does the swung one").toBeGreaterThan(0);
    expect(open.maxD, "at a strength that reads").toBeGreaterThanOrEqual(30);
    // Following the sliver, not the closed footprint: much narrower.
    expect(open.w, "and it follows the drawn sliver").toBeLessThan(closed.w * 0.6);
  });

  for (const c of [
    { id: "note1", vs: { location: "study", facing: "N" }, host: "the desk top" },
    { id: "coin1", vs: { location: "hall", facing: "E" }, host: "the shelf board" }
  ]) {
    test(`${c.id} darkens ${c.host} it rests on`, async ({ page }) => {
      // §7's [AI] clause: an on-surface object with no grounding is a sticker.
      await page.goto(appUrl());
      const d = await poolOf(page, c.id, c.vs, null);
      expect(d.count, `${c.id} has a pool at all`).toBeGreaterThan(8);
      expect(d.maxD, `${c.id} pool strength`).toBeGreaterThanOrEqual(15);
    });
  }
});

test.describe("a takeable a hand cannot hit is declared, not hidden", () => {
  test("anything under the tap floor at phone scale carries its deviation on the record", async ({ page }) => {
    /* The coin draws under two CSS pixels on a phone and no pointing rule can
     * fix that — it is apparent size, downstream of the open camera question
     * in blueprint §5. What this row can hold is that such an object is never
     * silent about it: if a takeable is below the platform tap floor at a
     * named phone width, its record must say so in `provenance`. Row 4 ships
     * real art through the same gate — and `dims_m` being honest is not a
     * defence, because what a hand can hit is apparent size, not metres. */
    const PHONE = { width: 390, height: 844 };
    const TAP_FLOOR_CSS = 44;
    await page.setViewportSize(PHONE);
    await page.goto(appUrl());
    const res = await page.evaluate(() => {
      const A = window.HOLO_APP;
      const box = document.getElementById("scene").getBoundingClientRect();
      const k = box.width / 1536;
      const out = [];
      // Every takeable, drawn wherever it stands (the key needs the drawer).
      const world = window.__T.clone(A.harness.world);
      world.entities.find((e) => e.id === "desk1").state = "open";
      world.knowledge.player.push("key1");
      for (const vs of [{ location: "study", facing: "N" }, { location: "hall", facing: "N" },
                        { location: "study", facing: "E" }]) {
        const lay = window.HOLO.renderer.layout(world, A.harness.staging, A.library,
          window.__T.metaOf(vs), vs);
        for (const e of lay) {
          const ent = world.entities.find((x) => x.id === e.id);
          // EVERY pointer target, because every drawn entity is one: the
          // resolver can return any of them, and the desk itself measures
          // 22.6 CSS px on a phone. Scoping the invariant to takeables and
          // transitions left four records silent about a residue the shipped
          // pointing code already treats them as having.
          if (!ent) continue;
          const w = e.f * e.record.px.w * k;
          const h = e.f * e.record.px.h * k;
          out.push({
            id: e.id, cssW: w, cssH: h,
            declared: !!(e.record.provenance && e.record.provenance.v1_apparent_size)
          });
        }
      }
      return out;
    });
    expect(res.length, "targets were laid out").toBeGreaterThan(2);
    for (const t of res) {
      if (Math.min(t.cssW, t.cssH) < TAP_FLOOR_CSS) {
        expect(t.declared,
          `${t.id} draws ${t.cssW.toFixed(1)}×${t.cssH.toFixed(1)} CSS px on a phone — under the ${TAP_FLOOR_CSS}px tap floor, so its record must carry provenance.v1_apparent_size`)
          .toBe(true);
      }
    }
  });
});

test.describe("the tint changes colour and nothing else", () => {
  test("a half-transparent edge pixel keeps its alpha exactly", async ({ page }) => {
    /* Every placeholder sprite is hard-edged, so nothing this row draws can
     * show this — but §9.1's matting feathers 1 px, and the obvious way to
     * re-clip the tinted composite (`destination-in` with the untinted copy)
     * MULTIPLIES the two alphas: a 128 edge pixel came back at 76, and at
     * zero tint at 64. Every matted edge arriving at rows 3–4 would lose half
     * its alpha and harden into the cut-out silhouette the flip test exists
     * to catch. Hash inequality cannot see it; this reads the channel.
     *
     * The library is a renderer input, so the test hands it a sprite with a
     * deliberate alpha ramp rather than waiting for row 4 to have one. */
    await page.goto(appUrl());
    const res = await page.evaluate(async () => {
      const RAMP = [0, 64, 128, 192, 255];
      // A 5×8 sprite: column i has alpha RAMP[i], all columns mid-grey.
      const body = document.createElement("canvas");
      body.width = RAMP.length; body.height = 8;
      const bx = body.getContext("2d");
      for (let i = 0; i < RAMP.length; i++) {
        bx.fillStyle = `rgba(128,128,128,${RAMP[i] / 255})`;
        bx.fillRect(i, 0, 1, 8);
      }
      const record = {
        schema: "sprite/0.1", id: "ramp", noun: "a ramp", archetype: "static",
        attachment: "floor_against", dims_m: { h: 1, w: 1, d: 0.5 },
        px: { w: RAMP.length, h: 8 }, view_side: "left", light: "UL45",
        anchors: { base: { x: 2, y: 8 }, footprint: { x0: 0, x1: RAMP.length } },
        takeable: false, airborne: false,
        provenance: { source: "test", tool: "test" }
      };
      const library = { ramp: { record, images: { body, parts: {} } } };
      const world = {
        schema: "holo-emitter/0.1",
        locations: [{ id: "study", facings: ["N"] }],
        entities: [{ id: "ramp1", sprite: "ramp", location: "study" }],
        relations: [], knowledge: { player: ["ramp1"] }
      };
      const staging = {
        schema: "holo-emitter-staging/0.1",
        placements: { ramp1: { facing: "study/N", attachment: "floor_against", u: 0.5 } }
      };
      const vs = { location: "study", facing: "N" };
      const draw = (opts) => {
        const c = document.createElement("canvas");
        c.width = 1536; c.height = 1024;
        window.HOLO.renderer.render(c, world, staging, library, {}, vs,
          Object.assign({ no_backdrop: true, shadows: false }, opts));
        return c;
      };
      const tinted = draw({});
      const plain = draw({ tint: false });
      // Sample the alpha profile down the middle of the drawn sprite.
      const lay = window.HOLO.renderer.layout(world, staging, library,
        window.__T.metaOf(vs), vs)[0];
      const y = Math.round(lay.drawY + lay.f * 4);
      const prof = (c) => {
        const d = c.getContext("2d").getImageData(0, y, 1536, 1).data;
        const out = [];
        for (let i = 0; i < RAMP.length; i++) {
          const x = Math.round(lay.drawX + lay.f * (i + 0.5));
          out.push(d[x * 4 + 3]);
        }
        return out;
      };
      return { tinted: prof(tinted), plain: prof(plain) };
    });
    expect(res.plain.some((a) => a > 0 && a < 255),
      "the probe sprite really has partial alpha").toBe(true);
    expect(res.tinted, "the tint pass leaves the alpha channel alone")
      .toEqual(res.plain);
  });
});

test.describe("one light: the sprites carry the key's direction, not just its elevation", () => {
  test("every sprite reads brighter on its viewer-left than on its right", async ({ page }) => {
    /* `light: "UL45"` is a field in every §6 record, and for a while it was
     * only a field: the painters shaded top faces lighter than vertical ones
     * — the elevation half — while per-third mean luminance came out exactly
     * symmetric on four of the eight sprites and brighter on the RIGHT for
     * the desk. A key at 45° from the upper left has to leave the left of a
     * form brighter than its right, or "every sprite shares the backdrop's
     * key direction" is a claim about JSON and not about pixels.
     *
     * Measured over opaque body pixels, per third, on the library image —
     * before the renderer's tint, which is colour temperature and not
     * direction. Row 4's generated sprites answer to gate §9.4e's Sobel
     * bright-side estimate; this is its V1 counterpart, on the sprites this
     * row actually ships. */
    await page.goto(appUrl());
    const res = await page.evaluate(() => {
      const lib = window.HOLO_APP.library;
      const out = [];
      for (const id of Object.keys(lib)) {
        const c = lib[id].images.body;
        const W = c.width, H = c.height;
        const d = c.getContext("2d").getImageData(0, 0, W, H).data;
        const sum = [0, 0, 0], n = [0, 0, 0];
        for (let y = 0; y < H; y++) {
          for (let x = 0; x < W; x++) {
            const i = (y * W + x) * 4;
            if (d[i + 3] < 250) continue;
            const third = x < W / 3 ? 0 : (x < (2 * W) / 3 ? 1 : 2);
            sum[third] += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
            n[third]++;
          }
        }
        out.push({
          id,
          declared: lib[id].record.light,
          left: n[0] ? sum[0] / n[0] : null,
          right: n[2] ? sum[2] / n[2] : null
        });
      }
      return out;
    });
    expect(res.length).toBeGreaterThanOrEqual(8);
    for (const r of res) {
      expect(r.declared, `${r.id} declares a key`).toBe("UL45");
      expect(r.left, `${r.id} has left-third pixels`).not.toBeNull();
      expect(r.right, `${r.id} has right-third pixels`).not.toBeNull();
      // A margin, not a tie: a 1-level difference is noise, not a key.
      expect(r.left - r.right,
        `${r.id}: left third ${r.left.toFixed(1)} vs right third ${r.right.toFixed(1)}`)
        .toBeGreaterThan(2);
    }
  });

  test("a sprite's parts and state images are lit like the body they belong to", async ({ page }) => {
    // A drawer face lit differently from the desk it slides out of is the
    // same divergence the whole-composite tint pass exists to prevent, one
    // layer earlier.
    await page.goto(appUrl());
    const res = await page.evaluate(() => {
      const lib = window.HOLO_APP.library;
      const tilt = (c) => {
        const W = c.width, H = c.height;
        const d = c.getContext("2d").getImageData(0, 0, W, H).data;
        let ls = 0, ln = 0, rs = 0, rn = 0;
        for (let y = 0; y < H; y++) {
          for (let x = 0; x < W; x++) {
            const i = (y * W + x) * 4;
            if (d[i + 3] < 250) continue;
            const l = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
            if (x < W / 3) { ls += l; ln++; } else if (x >= (2 * W) / 3) { rs += l; rn++; }
          }
        }
        return (ln && rn) ? (ls / ln) - (rs / rn) : null;
      };
      const out = [];
      for (const id of Object.keys(lib)) {
        const im = lib[id].images;
        for (const pid of Object.keys(im.parts || {})) {
          out.push({ what: `${id}.parts.${pid}`, tilt: tilt(im.parts[pid]) });
        }
        for (const sid of Object.keys(im.states || {})) {
          out.push({ what: `${id}.states.${sid}`, tilt: tilt(im.states[sid].image) });
        }
      }
      return out;
    });
    expect(res.length, "there are parts and state images to check").toBeGreaterThan(1);
    for (const r of res) {
      expect(r.tilt, `${r.what} is lit from the same side as its body`).toBeGreaterThan(2);
    }
  });
});

test.describe("a record cannot lie about its own image", () => {
  test("px, base and footprint are what the pixels say they are", async ({ page }) => {
    /* §9.2 defines these three by derivation: `px` is the body image's own
     * size, `base` the midpoint of the bottom-extreme opaque pixels, and
     * `footprint` their x-extent. Nothing witnessed any of them. The
     * validator bounds-checks anchors against the DECLARED `px` — against the
     * same fiction — and every shadow-geometry assertion takes its expected
     * width from `anchors.footprint`, the field the renderer reads, so the
     * binding ran one way only.
     *
     * Two demonstrations of what that hid, both with the whole suite green:
     * inflating `coin-silver.px.w` from 24 to 160 made a band of the bookcase
     * answer "take the coin", because the page sizes a takeable's tolerance
     * rectangle from `record.px`; narrowing `chair-joined`'s footprint to
     * [40,90] drew its contact pool at 36% of the width of its painted feet.
     *
     * §12.5's independence rule — never measure the code against its own
     * computed value — was applied to scale and not to these. Row 4's bake
     * inherits the same clause when the images arrive as PNGs. */
    await page.goto(appUrl());
    const res = await page.evaluate(() => {
      const lib = window.HOLO_APP.library;
      const out = [];
      for (const id of Object.keys(lib)) {
        const rec = lib[id].record;
        const c = lib[id].images.body;
        const W = c.width, H = c.height;
        const d = c.getContext("2d").getImageData(0, 0, W, H).data;
        // The bottom-extreme opaque row, then its x-extent across the two
        // rows §9.2 names.
        let bottom = -1;
        for (let y = H - 1; y >= 0 && bottom < 0; y--) {
          for (let x = 0; x < W; x++) {
            if (d[((y * W + x) * 4) + 3] >= 128) { bottom = y; break; }
          }
        }
        let x0 = W, x1 = -1;
        for (let y = Math.max(0, bottom - 1); y <= bottom; y++) {
          for (let x = 0; x < W; x++) {
            if (d[((y * W + x) * 4) + 3] >= 128) {
              if (x < x0) x0 = x;
              if (x > x1) x1 = x;
            }
          }
        }
        out.push({
          id,
          declared: {
            px: rec.px, base: rec.anchors.base, footprint: rec.anchors.footprint
          },
          derived: {
            px: { w: W, h: H },
            base: { x: (x0 + x1 + 1) / 2, y: bottom + 1 },
            footprint: { x0: x0, x1: x1 + 1 }
          }
        });
      }
      return out;
    });
    expect(res.length).toBeGreaterThanOrEqual(8);
    for (const r of res) {
      const D = r.declared, X = r.derived;
      expect(D.px, `${r.id}: px is the body image's own size`).toEqual(X.px);
      // The trim contract: opaque content touches the bottom row, so the
      // base sits on the image's own bottom edge.
      expect(D.base.y, `${r.id}: base.y is the bottom edge`).toBe(X.px.h);
      expect(Math.abs(D.base.x - X.base.x),
        `${r.id}: base.x ${D.base.x} vs the bottom-pixel midpoint ${X.base.x}`)
        .toBeLessThanOrEqual(1.5);
      expect(Math.abs(D.footprint.x0 - X.footprint.x0),
        `${r.id}: footprint.x0 ${D.footprint.x0} vs bottom-pixel extent ${X.footprint.x0}`)
        .toBeLessThanOrEqual(1);
      expect(Math.abs(D.footprint.x1 - X.footprint.x1),
        `${r.id}: footprint.x1 ${D.footprint.x1} vs bottom-pixel extent ${X.footprint.x1}`)
        .toBeLessThanOrEqual(1);
    }
  });
});

test.describe("the ground the sprites stand on carries the same key they do", () => {
  test("one lighting model: the falloff runs from the upper left on every plane, and the returns face the key", async ({ page }) => {
    /* Every sprite is UL45-shaded and every contact pool is thrown
     * down-right, and for a while they stood on a wall and floor of exactly
     * uniform luminance at every x — shaded objects on an unshaded ground,
     * which is the flip test's failure in miniature. §7 calls grid mode a
     * product mode, not placeholder art, and its meta declares
     * `key_dir: "UL"`; the ground has to answer for it.
     *
     * Row 11 gave the room two more planes and ONE model for all of them: a
     * per-plane facing tone first, the frame-wide falloff over it. Both halves
     * are checked, because either alone can be satisfied while the picture
     * contradicts itself —
     *   WITHIN a plane, the falloff still reads left-brighter (this sampled
     *   x 40–340 against x 1196–1496 before the corners, which after them are
     *   the two RETURNS rather than the wall, so it is re-pointed inside the
     *   facing wall);
     *   ACROSS planes, the viewer-RIGHT return reads brighter than the
     *   viewer-left one, because with a key at upper-left the right return's
     *   face turns toward it and the left return's turns away. Getting that
     *   backwards would be a one-light defect in the mode the demo ships. */
    await page.goto(appUrl());
    const res = await page.evaluate(() => {
      const fx = window.HOLO_FIXTURE;
      const vs = { location: "study", facing: "S" };  // a bare facing: the grid alone
      const meta = window.__T.metaOf(vs);
      const c = window.__T.renderW(fx.world, fx.staging, vs, { backdrop_only: true });
      const W = 1536, H = 1024;
      const d = c.getContext("2d").getImageData(0, 0, W, H).data;
      const lum = (x, y) => {
        const i = ((y * W + x) * 4);
        return 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      };
      const mean = (x0, x1, y) => {
        let t = 0, n = 0;
        for (let x = x0; x < x1; x += 3) { t += lum(x, y); n++; }
        return t / n;
      };
      const cL = Math.round(meta.corner_x0_px), cR = Math.round(meta.corner_x1_px);
      /* Inside the WALL BAND. The room has a ceiling [HUMAN 2026-08-21], so
         the facing wall runs from the wall-ceiling line (y 377 at 2.8 m and
         96 px/m) down to the floor line (y 645); row 300 is ceiling now and
         asking it about wall tone would be asking the wrong plane. */
      const wallRow = 420;
      const floorRow = 900;
      /* Inside the facing wall, away from its metre lines and the glyph. */
      const wall = { left: mean(cL + 6, cL + 110, wallRow), right: mean(cR - 110, cR - 6, wallRow) };
      /* The floor between the junctions at that row. */
      const s = meta.px_per_m_at_wall +
        ((floorRow - meta.floor_line_y * meta.image_h_px) /
         (meta.image_h_px - meta.floor_line_y * meta.image_h_px)) *
        (meta.px_per_m_at_bottom - meta.px_per_m_at_wall);
      const half = (meta.corner_x1_px - meta.corner_x0_px) / 2 * (s / meta.px_per_m_at_wall);
      const fL = Math.max(4, Math.round(768 - half)), fR = Math.min(W - 4, Math.round(768 + half));
      const floor = { left: mean(fL, fL + 200, floorRow), right: mean(fR - 200, fR, floorRow) };
      /* The two returns, sampled at the same row and the same distance in
         from their own frame edge, so only the plane differs. */
      /* The returns, sampled OUTSIDE their own corner and at the same distance
         in from the frame edge, so only the plane differs. Row 20's lens puts
         study/S's corners at 43 and 1493, so the old fixed 20..200 /
         W-200..W-20 windows straddled the facing wall on one side and the
         return on the other. */
      const rL0 = 4, rL1 = Math.max(rL0 + 8, cL - 4);
      const rR1 = W - 4, rR0 = Math.min(rR1 - 8, cR + 4);
      const returns = { left: mean(rL0, rL1, wallRow), right: mean(rR0, rR1, wallRow) };
      return { wall, floor, returns, topL: lum(cL + 20, 390), lowL: lum(cL + 20, 630) };
    });
    expect(res.wall.left - res.wall.right,
      `facing wall: left ${res.wall.left.toFixed(1)} vs right ${res.wall.right.toFixed(1)}`)
      .toBeGreaterThan(2);
    expect(res.floor.left - res.floor.right,
      `floor: left ${res.floor.left.toFixed(1)} vs right ${res.floor.right.toFixed(1)}`)
      .toBeGreaterThan(2);
    expect(res.topL - res.lowL, "and brighter above than below").toBeGreaterThan(1);
    expect(res.returns.right - res.returns.left,
      `the return facing the key is brighter: left ${res.returns.left.toFixed(1)} vs right ${res.returns.right.toFixed(1)}`)
      .toBeGreaterThan(2);
  });
});

test.describe("the room has corners, and they are where the plan says", () => {
  /* Where the facing wall actually IS, in rows. The wall is a band between
     the wall-ceiling line and the floor line since the rooms gained a storey
     height [HUMAN 2026-08-21]; above `y0` the frame is ceiling and below `y1`
     it is floor, so every column scan for a corner vertical lives in here. */
  const wallBandFor = (m) => {
    const floorY = m.floor_line_y * m.image_h_px;
    return {
      y0: Math.max(6, Math.ceil(floorY - m.storey_height_m * m.px_per_m_at_wall) + 6),
      y1: Math.min(1018, Math.floor(Math.min(floorY, 1024)) - 45)
    };
  };
  /* Row 20 made the wall band per-facing: the scale is a consequence of how
     far away the wall is, so the wall-ceiling line and the floor line are at
     different rows on every facing. */
  const WALL_BAND = wallBandFor(LIT.facing("study", "S"));

  /* Row 11's own clause, and the committed replacement for the hand-run
   * cross-commit canvas check: on a row where every frame moves, "every
   * changed pixel changed on purpose" discriminates nothing, and a per-frame
   * prediction does. Corner columns, the wall-floor line's ends and the side
   * returns are predicted from the facing's own literals (typed from the
   * approved standpoints table) and measured off the rendered grid. */
  for (const key of ["study/N", "study/E", "study/S", "study/W",
    "hall/N", "hall/E", "hall/S", "hall/W"]) {
    const [loc, f] = key.split("/");
    test(`${key}: two corners, at the ends of the u-domain`, async ({ page }) => {
      const m0 = LIT.facing(loc, f);
      /* [Row 21] A PAINTED facing draws no grid and therefore no corner
         verticals: its corners are painted, and they are judged where a
         painting's corners can be judged — §12.5 (ii) in `geometry.spec`,
         measured off the image against the metres the plan rules. Skipped
         VISIBLY rather than returned early, because an early return in a test
         is a green tick for work nobody did. */
      test.skip(m0.measured === true,
        `${key} is painted; §12.5 (ii) judges its corners off the image`);
      await page.goto(appUrl());
      const m = LIT.facing(loc, f);
      const cols = await page.evaluate(({ loc, f, c0, c1, y0, y1 }) => {
        const T = window.__T;
        const c = T.renderDirect({ location: loc, facing: f }, null, { backdrop_only: true });
        /* Find the vertical near each predicted corner and measure WHERE it
           is by its own brightness centroid — a 2 px stroke on a fractional
           coordinate lights three columns, so "the first column above a
           threshold" is systematically a pixel or two to the left of the line
           it found. The centroid is the line.
           The scan runs BETWEEN the wall-ceiling line and the floor line: the
           room has a ceiling since [HUMAN 2026-08-21], so a corner vertical
           stops at `ceilRow` and a scan starting at y 40 would be measuring
           the ceiling's own fan instead of the corner. */
        const ctx = c.getContext("2d");
        const bright = (x) => {
          const d = ctx.getImageData(x, y0, 1, y1 - y0).data;
          let t = 0;
          for (let i = 0; i < y1 - y0; i++) t += d[i * 4];
          return t / (y1 - y0);
        };
        const locate = (centre) => {
          const lo = Math.round(centre) - 8, hi = Math.round(centre) + 8;
          let base = Infinity;
          const vals = [];
          for (let x = lo; x <= hi; x++) { const v = bright(x); vals.push(v); if (v < base) base = v; }
          let num = 0, den = 0, peak = 0;
          for (let x = lo; x <= hi; x++) {
            const w = Math.max(0, vals[x - lo] - base);
            num += w * (x + 0.5); den += w;
            if (w > peak) peak = w;
          }
          return { x: den > 0 ? num / den : -1, v: T.colFraction(c, Math.round(centre), y0, y1), peak };
        };
        /* Is a CORNER drawn anywhere? A corner is a 2 px stroke at
           ALPHA_MAJOR; the wall's own metre lines are 1 px at ALPHA_MINOR and
           the returns' verticals the same. So the test is two ADJACENT columns
           each brighter than the wall a few pixels either side of them — which
           a 1 px line cannot be. `bright` is a column mean over the wall band,
           so the key falloff (which brightens whole regions) cancels. */
        /* Is a CORNER drawn anywhere? A corner is a 2 px stroke at ALPHA_MAJOR
           running the WHOLE band, floor line to wall-ceiling line. The wall's
           own metre lines are 1 px at ALPHA_MINOR, and the facing glyph is a
           tall bright mark too (16 px of stroke at this scale) but covers well
           under a third of the band — so "brighter than the wall five pixels
           either side, on more than 90% of the band's rows" finds a corner and
           nothing else, without excluding the glyph by name. */
        const rows = y1 - y0;
        const band = ctx.getImageData(0, y0, 1536, rows).data;
        const at = (x, i) => band[(i * 1536 + Math.min(1535, Math.max(0, x))) * 4];
        const fullBand = (x) => {
          let hit = 0;
          for (let i = 0; i < rows; i++) {
            const base = Math.min(at(x - 5, i), at(x + 6, i));
            if (at(x, i) > base + 6) hit++;
          }
          return hit / rows > 0.9;
        };
        let anyVertical = false;
        /* From the FIRST column to the last. An artifact critic clamped the
           corner x's into the frame — the most natural defensive bug there is
           — which invents two corner verticals at x 2 and x 1533 on the two
           facings whose wall runs past the frame, and a scan starting at 6
           could not see either. The neighbour samples clamp instead of the
           scan. */
        for (let x = 0; x < 1536 && !anyVertical; x++) {
          /* TWO adjacent columns, because a corner is a 2 px stroke and the
             wall's own metre lines are 1 px. Without the adjacency this finds
             every metre line on the wall. */
          if (fullBand(x) && fullBand(x + 1)) anyVertical = true;
        }
        return { left: locate(c0), right: locate(c1), anyVertical };
      }, { loc, f, c0: m.corner_x0_px, c1: m.corner_x1_px, ...wallBandFor(m) });
      /* CORNERS APPEAR EXACTLY WHEN THEY ARE HONESTLY IN FRAME — the row's own
         done clause, read off the render. A corner whose computed x lies
         inside the canvas must be drawn AND be where the arithmetic says; a
         corner outside it must not be drawn at all, and the picture must not
         invent one somewhere else. The cross passage's long facings are the
         second case: an 8.00 m wall seen from 2.15 m puts both corners more
         than a thousand pixels outside the frame. */
      const inFrame = (x) => x >= 0 && x <= 1536;
      if (inFrame(m.corner_x0_px)) {
        expect(cols.left.v, `${key}: a left corner is drawn`).toBeGreaterThan(0.9);
        expect(Math.abs(cols.left.x - m.corner_x0_px),
          `${key}: left corner at ${m.corner_x0_px}`).toBeLessThanOrEqual(2);
      }
      if (inFrame(m.corner_x1_px)) {
        expect(cols.right.v, `${key}: a right corner is drawn`).toBeGreaterThan(0.9);
        expect(Math.abs(cols.right.x - m.corner_x1_px),
          `${key}: right corner at ${m.corner_x1_px}`).toBeLessThanOrEqual(2);
      }
      if (!inFrame(m.corner_x0_px) && !inFrame(m.corner_x1_px)) {
        expect(cols.anyVertical, `${key}: no corner is drawn, because neither is in frame`)
          .toBe(false);
      } else {
        /* And the detector is not vacuous: where a corner IS in frame it finds
           one. Both halves matter — a check that can only say "no" would pass
           a renderer that had stopped drawing corners altogether. */
        expect(cols.anyVertical, `${key}: the corner detector finds the corner that is there`)
          .toBe(true);
      }
    });
  }

  test("the corners are data: a wall width no room in the manor has puts them where it says", async ({ page }) => {
    /* The guard against the eight cases above being literals that happen to
       match. The eight already carry four DISTINCT corner pairs, which no
       hard-coded pair could satisfy; this closes it by handing the shipped
       renderer a meta with a wall width the plan does not contain anywhere,
       through the same backdrops map the page uses, and requiring the drawn
       corners to follow it. The other half of the loop — that the META
       follows the plan — is plan.spec's `deriveMeta` arithmetic. */
    await page.goto(appUrl());
    const WIDTH = 3.1;                       // in no room of the manor
    const c0 = 768 - WIDTH / 2 * 96, c1 = 768 + WIDTH / 2 * 96;   // 619.2, 916.8
    const found = await page.evaluate(({ width, y0, y1 }) => {
      const T = window.__T;
      const fx = window.HOLO_FIXTURE;
      const vs = { location: "study", facing: "S" };
      const meta = { ...T.metaOf(vs), wall_width_m: width,
        corner_x0_px: 768 - width / 2 * 96, corner_x1_px: 768 + width / 2 * 96 };
      const c = document.createElement("canvas");
      c.width = 1536; c.height = 1024;
      const bd = {}; bd["study/S"] = { meta };
      window.HOLO.renderer.render(c, fx.world, fx.staging, T.lib(), bd, vs,
        { backdrop_only: true });
      const cols = [];
      for (let x = 1; x < 1536; x++) if (T.colFraction(c, x, y0, y1) > 0.9) cols.push(x);
      return cols;
    }, { width: WIDTH, ...WALL_BAND });
    expect(found.some((x) => Math.abs(x - c0) <= 2), `left corner at ${c0}`).toBe(true);
    expect(found.some((x) => Math.abs(x - c1) <= 2), `right corner at ${c1}`).toBe(true);
    // and NOT where the study's real 5.45 m wall puts them
    expect(found.some((x) => Math.abs(x - 506.4) <= 2), "not the real study corner").toBe(false);
    expect(found.some((x) => Math.abs(x - 1029.6) <= 2), "not the real study corner").toBe(false);
  });

  test("under the pinned LENS a corner MOVES with the standpoint distance — Kabe's sentence, answered", async ({ page }) => {
    /* Blueprint §5 [HUMAN, 2026-08-20]: "the horizontal corner of the room
       needs to be determined in location based on the distance expected
       between the player and that wall."

       Under §7's pinned SCALE the corner's x was `768 ± wall_width_m × 96 / 2`
       and `camera_wall_m` CANCELLED: two rooms with the same wall at different
       distances got pixel-identical corners, which is the opposite of what
       that sentence asks for. Row 11 asserted the cancellation here, named it
       as the shape of §5's unresolved scale-vs-lens question, and left it.

       Row 20 pins the lens, so `px_per_m_at_wall` is `f / camera_wall_m` and
       the corner is `768 ± wall_width_m × f / (2 × camera_wall_m)`. Halve the
       distance and the wall draws twice as wide: the corner moves outward, and
       on a wall this size it leaves the frame entirely, which is what standing
       half as far from it looks like. This is the same test inverted, and the
       inversion is the row. */
    await page.goto(appUrl());
    const a = LIT.facing("study", "N");      // 5.45 m at 4.35 m
    const halfDistance = a.camera_wall_m / 2;
    const movedCorner = 768 - a.wall_width_m / 2 * (LIT.focal_px / halfDistance);
    expect(movedCorner).toBeLessThan(0);     // off the left of the frame, honestly
    const res = await page.evaluate(({ y0, y1, cam, px, w }) => {
      const T = window.__T;
      const fx = window.HOLO_FIXTURE;
      const vs = { location: "study", facing: "S" };
      const base = T.metaOf(vs);
      /* The same wall, viewed from half as far away — a whole meta, derived
         the way `deriveMeta` derives one, not a corner field poked by hand. */
      const meta = {
        ...base, camera_wall_m: cam, px_per_m_at_wall: px,
        wall_width_m: w,
        floor_line_y: base.horizon_y + 1.183 * px / 1024,
        corner_x0_px: 768 - w / 2 * px, corner_x1_px: 768 + w / 2 * px
      };
      const c = document.createElement("canvas");
      c.width = 1536; c.height = 1024;
      const bd = {}; bd["study/S"] = { meta };
      window.HOLO.renderer.render(c, fx.world, fx.staging, T.lib(), bd, vs,
        { backdrop_only: true });
      const cols = [];
      for (let x = 1; x < 1536; x++) if (T.colFraction(c, x, y0, y1) > 0.9) cols.push(x);
      return cols;
    }, { y0: WALL_BAND.y0, y1: WALL_BAND.y1, cam: halfDistance,
      px: LIT.focal_px / halfDistance, w: a.wall_width_m });
    /* The corner is NOT where it was at twice the distance — the assertion row
       11 could only make in the negative. */
    expect(res.some((x) => Math.abs(x - a.corner_x0_px) <= 2),
      "the corner did not stay where it was at twice the distance").toBe(false);
  });

  test("typed geometry is data, not a branch: open and segmented facings draw no wall", async ({ page }) => {
    /* Row 11's promise that open and corridor are "a meta entry later, not a
       renderer rewrite", made checkable. Two metas the plan really produces —
       an `open` facing (the entrance court's south view, ground to a far line)
       and a SEGMENTED one (the entrance approach's north view, part building
       and part open court mouth) — are rendered through the SHIPPED renderer.
       Neither may grow a facing wall, and neither may invent corners. */
    await page.goto(appUrl());
    const res = await page.evaluate(({ open, seg }) => {
      const T = window.__T;
      const fx = window.HOLO_FIXTURE;
      const vs = { location: "study", facing: "S" };
      const draw = (meta) => {
        const c = document.createElement("canvas");
        c.width = 1536; c.height = 1024;
        const bd = {}; bd["study/S"] = { meta };
        window.HOLO.renderer.render(c, fx.world, fx.staging, T.lib(), bd, vs,
          { backdrop_only: true });
        return c;
      };
      const verticals = (c) => {
        let n = 0;
        for (let x = 1; x < 1536; x++) if (T.colFraction(c, x, 40, 400) > 0.9) n++;
        return n;
      };
      const o = draw(open), g = draw(seg);
      return {
        openVerticals: verticals(o), segVerticals: verticals(g),
        openCorners: [open.corner_x0_px, open.corner_x1_px],
        segCorners: [seg.corner_x0_px, seg.corner_x1_px],
        openBackdrop: open.backdrop,
        // the wall band above the far line is the void, not the wall base
        openWallPx: T.px(o, 400, 200), segWallPx: T.px(g, 60, 200)
      };
    }, {
      open: OPEN_META,
      seg: SEG_META
    });
    // No corners claimed anywhere law (b) forbids them.
    expect(res.openCorners).toEqual([null, null]);
    expect(res.segCorners).toEqual([null, null]);
    expect(res.openBackdrop).toBe("vista");
    // And no wall grid drawn on a facing that has no wall.
    expect(res.openVerticals, "an open facing draws no wall verticals").toBe(0);
    // The segmented one draws the bands it HAS and nothing across the gap:
    // some verticals, but not the unbroken run an enclosed facing shows.
    expect(res.segVerticals, "a segmented facing draws only its built bands")
      .toBeLessThan(res.openVerticals + 40);
  });
});

test.describe("the doorway reads as an opening, not a picture on the wall", () => {
  test("the wall's own thickness is drawn inside it, lit from the same side", async ({ page }) => {
    /* Two earlier attempts at depth-in-the-opening both failed, opposite
     * ways: a raised far floor line drew a room one step deeper than the
     * `go` delivers, and putting the line at this room's own floor line drew
     * NOTHING — the aperture rect's bottom IS the floor line for a
     * `wall_mounted` leaf at `v: 0`, so the fill had zero height and every
     * transverse line fell below the clip. The check written for it passed
     * on the jamb's own bottom stroke: a test asserting a device that draws
     * no pixels. So this one reads the reveal itself, in columns, and it is
     * verified to go red when the reveal is removed. */
    await page.goto(appUrl());
    const res = await page.evaluate(() => {
      const fx = window.HOLO_FIXTURE;
      const A = window.HOLO_APP;
      const vs = { location: "study", facing: "E" };
      const meta = window.__T.metaOf(vs);
      const a = window.HOLO.renderer.apertures(
        fx.world, fx.staging, A.library, meta, vs)[0];
      const c = window.__T.renderW(fx.world, fx.staging, vs, { backdrop_only: true });
      const W = 1536;
      const d = c.getContext("2d").getImageData(0, 0, W, 1024).data;
      const lum = (x, y) => {
        const i = ((y * W + x) * 4);
        return 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      };
      // A row well inside the opening, clear of the soffit and the jamb.
      const y = Math.round(a.y + a.h * 0.6);
      const col = (f) => lum(Math.round(a.x + f * a.w), y);
      // A row inside the soffit band, and one below it, at mid-width.
      const soffitY = Math.round(a.y + Math.max(2, a.w * 0.09) * 0.5);
      const midY = Math.round(a.y + a.h * 0.4);
      const midX = Math.round(a.x + a.w * 0.5);
      return {
        near: col(0.06), void_: col(0.5), far: col(0.93),
        soffit: lum(midX, soffitY), below: lum(midX, midY),
        w: a.w
      };
    });
    // The near reveal — the jamb face turned toward an upper-left key —
    // is the brightest thing in the opening.
    expect(res.near - res.void_,
      `near reveal ${res.near.toFixed(1)} vs the void ${res.void_.toFixed(1)}`)
      .toBeGreaterThan(8);
    // The far one is off the void but nothing like the near one: one light,
    // not two.
    expect(res.far, "the far reveal is lit at all").toBeGreaterThan(res.void_ + 1);
    expect(res.far, "and far less than the near one").toBeLessThan(res.near - 4);
    // And a lintel above, in shadow.
    expect(res.soffit, "the soffit is not the void").not.toBe(res.below);
  });
});

test.describe("real touch, at a real phone size", () => {
  /* §12.1's clause is "real pointer/keyboard events", and every real-event
   * sweep ran at desktop-sized windows: the phone cases asked `resolve()` in
   * canvas coordinates instead of touching the screen. A finger on a 390 px
   * phone is the hardest case the product has and the one it was never
   * driven with. */
  const targets = [
    { id: "note1", boot: null, intent: "take" },
    { id: "desk1", boot: null, intent: "toggle" },
    { id: "coin1", boot: { location: "hall", facing: "E" }, intent: "take" },
    { id: "stick1", boot: { location: "hall", facing: "E" }, intent: "toggle" }
  ];
  for (const t of targets) {
    test(`${t.id}: a finger on a 390×844 phone reaches it`, async ({ browser }) => {
      const ctx = await equipContext(await browser.newContext({
        // `isMobile` and a deviceScaleFactor are Chromium-only options and
        // this runs on both engines; touch and the viewport are what matter.
        hasTouch: true, viewport: { width: 390, height: 844 }
      }));
      const page = await ctx.newPage();
      let root = null;
      try {
        if (t.boot) { root = stageTree(); setViewstate(root, t.boot); }
        await page.goto(appUrl(root ?? undefined));
        await page.waitForFunction(() => !!window.HOLO_APP);
        const pt = await page.evaluate((id) => {
          const e = window.__T.currentLayout().find((x) => x.id === id);
          if (!e) return null;
          const b = window.__T.entryBBox(e);
          return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
        }, t.id);
        expect(pt, `${t.id} is on screen`).not.toBeNull();
        const box = await page.locator("#scene").boundingBox();
        await page.touchscreen.tap(
          box.x + (pt.x * box.width) / 1536,
          box.y + (pt.y * box.height) / 1024);
        const env = await page.evaluate(() => {
          const h = window.HOLO_APP.harness;
          return h.envelopes.length ? h.envelopes[h.envelopes.length - 1].intent : null;
        });
        expect(env, `${t.id}: the tap dispatched something`).not.toBeNull();
        expect(env.entity, `${t.id}: and it named the thing tapped`).toBe(t.id);
        expect(env.type).toBe(t.intent);
      } finally {
        await ctx.close();
        if (root) removeTree(root);
      }
    });
  }
});

test.describe("the way back through a door is reachable by a finger", () => {
  test("an open leaf a fraction of the shut one's width still closes the door on a phone", async ({ browser }) => {
    /* §7's amendment gives "a widening tolerance ring for targets too small
     * to hit exactly"; scoping it to `takeable` restored the blueprint's own
     * named failure on the device most people will open the link on. The
     * open leaf draws 6 CSS px wide at 390×844 and is the ONLY pointer path
     * from open back to closed — `toggle door1 → closed` is authored,
     * narrated, a member of the §12.9 domain, and was unreachable by a
     * finger. The earlier sweeps could not see it: they tap computed
     * bounding-box centres, which is not a thing a hand does, and their
     * target lists omitted the leaf and the doorway. */
    const ctx = await equipContext(await browser.newContext({
      hasTouch: true, viewport: { width: 390, height: 844 }
    }));
    const page = await ctx.newPage();
    let root = null;
    try {
      root = stageTree();
      setViewstate(root, { location: "study", facing: "E" });
      await page.goto(appUrl(root));
      await page.waitForFunction(() => !!window.HOLO_APP);
      const box = await page.locator("#scene").boundingBox();
      const tap = async (pt) => {
        await page.touchscreen.tap(
          box.x + (pt.x * box.width) / 1536,
          box.y + (pt.y * box.height) / 1024);
      };
      const leafRect = async () => await page.evaluate(() => {
        const e = window.__T.currentLayout().find((x) => x.id === "door1");
        const b = window.__T.entryBBox(e);
        return { x: b.x + b.w / 2, y: b.y + b.h / 2, w: b.w, h: b.h };
      });
      // Open it (the shut leaf is wide).
      const shut = await leafRect();
      await tap(shut);
      expect(await page.evaluate(() =>
        window.HOLO_APP.harness.world.entities.find((e) => e.id === "door1").state))
        .toBe("open");

      const open = await leafRect();
      const cssW = (open.w * box.width) / 1536;
      const shutW = (shut.w * box.width) / 1536;
      /* A sliver, stated as a RATIO rather than as a pixel count. The open leaf
         is swung near-flat to the wall, so it draws a small fraction of the
         shut leaf's width — that is the property this test needs. Row 20's
         lens makes the passage's wall 1.8× the pixels per metre it was, so
         every absolute width on this facing grew with it and a literal here
         would have been a fact about the old scale. */
      /* A quarter of the shut leaf is what the placeholder's open-state image
         happens to be; what the test needs is only that the sliver is far too
         narrow for a finger, which is the premise the tolerance ring exists
         for. Both are asserted, and the absolute one is in CSS pixels at a
         real phone width, where a fingertip is about 40. */
      expect(cssW / shutW, "the open leaf really is a sliver").toBeLessThan(0.5);
      expect(cssW, "and far too narrow for a finger").toBeLessThan(20);

      /* A finger, off centre to the LEFT — onto the wall beside the opening,
       * outside the leaf's own 6 px of pixels and inside the tolerance
       * margin. Not into the opening: §7 puts the ring last precisely so it
       * cannot eat the doorway, and an earlier version of this test asserted
       * the opposite — that a tap 5 CSS px INTO the visible gap shuts the
       * door — which pinned a contradiction of the blueprint clause in
       * place with a green test. The leaf keeps its forgiveness where there
       * is nothing else to hit. */
      for (const dx of [-6, -5, -4]) {
        await page.touchscreen.tap(
          box.x + (open.x * box.width) / 1536 + dx,
          box.y + (open.y * box.height) / 1024);
        const st = await page.evaluate(() => ({
          door: window.HOLO_APP.harness.world.entities.find((e) => e.id === "door1").state,
          where: window.HOLO_APP.harness.viewstate.location
        }));
        expect(st.where, `a tap ${dx} px off the leaf did not walk you through`).toBe("study");
        expect(st.door, `a tap ${dx} px off the leaf shut the door`).toBe("closed");
        // Re-open for the next offset.
        await tap(await leafRect());
      }
    } finally {
      await ctx.close();
      if (root) removeTree(root);
    }
  });

  test("no drawn entity hides under a chevron on any facing", async ({ page }) => {
    /* The chevrons sit over the scene canvas at z-index 2, so a click on
     * their 40×205 px boxes never reaches `resolve()` — the picture gives no
     * sign that region is spoken for. Nothing is staged there in this
     * fixture, and this is the guard that keeps it that way when row 4
     * stages eight real facings: the clickability sweep computes its own
     * points and would pass straight over an entity that is in fact
     * unclickable. */
    await page.goto(appUrl());
    const bad = await page.evaluate(() => {
      const fx = window.HOLO_FIXTURE;
      const stage = document.getElementById("stage").getBoundingClientRect();
      const scene = document.getElementById("scene");
      const sx = 1536 / scene.getBoundingClientRect().width;
      const sy = 1024 / scene.getBoundingClientRect().height;
      const zones = [...document.querySelectorAll(".chevron")].map((c) => {
        const r = c.getBoundingClientRect();
        return {
          x0: (r.left - stage.left) * sx, x1: (r.right - stage.left) * sx,
          y0: (r.top - stage.top) * sy, y1: (r.bottom - stage.top) * sy
        };
      });
      const out = [];
      const world = window.__T.clone(fx.world);
      world.entities.find((e) => e.id === "desk1").state = "open";
      world.entities.find((e) => e.id === "door1").state = "open";
      world.knowledge.player.push("key1");
      for (const loc of world.locations) {
        for (const f of loc.facings) {
          const vs = { location: loc.id, facing: f };
          const lay = window.HOLO.renderer.layout(world, fx.staging,
            window.__T.lib(), window.__T.metaOf(vs), vs);
          for (const e of lay) {
            const b = window.__T.entryBBox(e);
            for (const z of zones) {
              if (b.x < z.x1 && b.x + b.w > z.x0 && b.y < z.y1 && b.y + b.h > z.y0) {
                out.push(`${e.id} on ${loc.id}/${f}`);
              }
            }
          }
        }
      }
      return { out, zones };
    });
    expect(bad.zones.length, "the chevrons are on the stage").toBe(2);
    expect(bad.out, "no entity's drawn box overlaps a chevron").toEqual([]);
  });
});

test.describe("what a finger means, where the demo actually happens", () => {
  const PHONE = { width: 393, height: 727 };

  async function phone(browser, boot) {
    const ctx = await equipContext(await browser.newContext({
      hasTouch: true, viewport: PHONE
    }));
    const page = await ctx.newPage();
    let root = null;
    if (boot) { root = stageTree(); setViewstate(root, boot); }
    await page.goto(appUrl(root ?? undefined));
    await page.waitForFunction(() => !!window.HOLO_APP);
    return { ctx, page, root };
  }

  test("every visible part of an open doorway walks you through", async ({ browser }) => {
    /* §7: the tolerance ring comes last "so it cannot eat the opening". It
     * ran second for a commit, and because the open leaf is a small target
     * its margin reached inside the aperture — 46% of the visible gap on a
     * phone answered "shut the door" to a player trying to walk through it,
     * with a test pinning that in place. Sampled across the opening with
     * real taps, on a fresh page each time so one answer cannot mask the
     * next. */
    const { ctx, page, root } = await phone(browser, { location: "study", facing: "E" });
    try {
      const box = await page.locator("#scene").boundingBox();
      // Open it.
      const leaf = await page.evaluate(() => {
        const e = window.__T.currentLayout().find((x) => x.id === "door1");
        const b = window.__T.entryBBox(e);
        return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
      });
      await page.touchscreen.tap(
        box.x + (leaf.x * box.width) / 1536, box.y + (leaf.y * box.height) / 1024);
      const a = await page.evaluate(() => {
        const A = window.HOLO_APP;
        return window.HOLO.renderer.apertures(
          A.harness.world, A.harness.staging, A.library,
          window.__T.metaOf(A.harness.viewstate), A.harness.viewstate)[0];
      });
      // Every column of the opening that is not the leaf's own pixels.
      const verdicts = await page.evaluate(({ a }) => {
        const A = window.HOLO_APP;
        const L = window.__T.currentLayout();
        const out = [];
        for (let f = 0.05; f <= 0.96; f += 0.05) {
          const x = a.x + f * a.w;
          const y = a.y + a.h * 0.6;
          const exact = window.HOLO.renderer.hitTest(L, A.library, x, y);
          if (exact) continue; // the leaf's own pixels legitimately toggle
          const r = A.resolve({ x, y });
          out.push({ f: +f.toFixed(2), kind: r.kind === "entity" ? r.id : r.kind });
        }
        return out;
      }, { a });
      expect(verdicts.length, "the opening has clear columns").toBeGreaterThan(8);
      const wrong = verdicts.filter((v) => v.kind !== "doorway");
      expect(wrong, "no clear column of the opening means anything but travel")
        .toEqual([]);
      // And a real finger in the middle of the gap really travels.
      await page.touchscreen.tap(
        box.x + ((a.x + a.w * 0.6) * box.width) / 1536,
        box.y + ((a.y + a.h * 0.6) * box.height) / 1024);
      expect(await page.evaluate(() => window.HOLO_APP.harness.viewstate.location))
        .toBe("hall");
    } finally {
      await ctx.close();
      if (root) removeTree(root);
    }
  });

  test("the revealed key can be picked up by a finger, and a near-miss does not shut it in", async ({ browser }) => {
    /* The one dramatic beat of M0. `smallTargetAt` returned the FIRST entry
     * within the margin, and a host draws before its anchored child — so at
     * phone scale, where the desk itself counts as a small target, the key's
     * own pixels were handed to the desk. Reachable area: 12 CSS px². A tap
     * three CSS pixels off centre dispatched `toggle desk1` and shut the
     * drawer over the reveal the player had just earned. */
    const { ctx, page, root } = await phone(browser, null);
    try {
      const box = await page.locator("#scene").boundingBox();
      await page.evaluate(() => window.HOLO_APP.dispatch({ type: "toggle", entity: "desk1" }));
      const c = await page.evaluate(() => {
        const e = window.__T.currentLayout().find((x) => x.id === "key1");
        const b = window.__T.entryBBox(e);
        return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
      });
      const k = 1536 / box.width;
      for (const [dx, dy] of [[0, 0], [3, 0], [-3, 0], [0, 3], [0, -3]]) {
        const st = await page.evaluate(({ x, y }) => {
          const r = window.HOLO_APP.resolve({ x, y });
          return r.kind === "entity" ? r.id : r.kind;
        }, { x: c.x + dx * k, y: c.y + dy * k });
        expect(st, `a finger ${dx},${dy} CSS px off the key means the key`).toBe("key1");
      }
      // And a real tap takes it, leaving the drawer open.
      await page.touchscreen.tap(
        box.x + (c.x * box.width) / 1536, box.y + (c.y * box.height) / 1024);
      const after = await page.evaluate(() => {
        const h = window.HOLO_APP.harness;
        return {
          held: h.world.relations.some((r) => r[0] === "held_by" && r[1] === "key1"),
          desk: h.world.entities.find((e) => e.id === "desk1").state
        };
      });
      expect(after.held, "the key is taken").toBe(true);
      expect(after.desk, "and the drawer is still open").toBe("open");
    } finally {
      await ctx.close();
      if (root) removeTree(root);
    }
  });
});

test.describe("the image that lands is the image the record names", () => {
  /* §12.8 witnessed that the swap changes the hash and that the state's rect
   * lands in the right place; §12.3 and the interpolation clauses read the
   * diff rect or the library. None of them read WHICH image reached the
   * canvas. Substituting the body image into the swap branch — so the open
   * door draws the whole closed leaf, planks and ring pull, squashed into a
   * sliver — left all 440 tests green, and so did substituting it into the
   * part branch. "Exercising `states_images` end to end" is the centre of
   * this row's target.
   *
   * These compare the drawn pixels against a same-run stamp of the library
   * image at the same transform — no goldens, and the expectation is built
   * from the record, not from the renderer's own output. */
  async function compare(page, { id, vs, doctor, pick }) {
    return await page.evaluate(({ id, vs, doctorSrc, pick }) => {
      const fx = window.HOLO_FIXTURE;
      const lib = window.__T.lib();
      const world = window.__T.clone(fx.world);
      if (doctorSrc) (new Function("world", doctorSrc))(world);
      const solo = window.__T.worldWithout(
        world.entities.filter((e) => e.id !== id).map((e) => e.id), world);
      const drawn = window.__T.renderW(solo, fx.staging, vs,
        { no_backdrop: true, shadows: false, tint: false });
      const e = window.HOLO.renderer.layout(solo, fx.staging, lib,
        window.__T.metaOf(vs), vs).find((x) => x.id === id);
      // Where the named image should have landed, and which one it is.
      const spec = pick === "swap"
        ? { img: e.images.states[e.state].image,
            x: e.drawX + e.f * e.swap.origin.x,
            y: e.drawY + e.f * e.swap.origin.y, k: e.f }
        : (function () {
            const part = e.parts[0];
            const t = part.t;
            return {
              img: e.images.parts[part.id],
              x: e.drawX + e.f * (part.origin.x + t * part.slide.dx * e.record.px.w),
              y: e.drawY + e.f * (part.origin.y + t * part.slide.dy * e.record.px.h),
              k: e.f * (1 + t * (part.slide.scale_open - 1))
            };
          })();
      const W = 1536, H = 1024;
      const want = document.createElement("canvas");
      want.width = W; want.height = H;
      want.getContext("2d").drawImage(spec.img, spec.x, spec.y,
        spec.img.width * spec.k, spec.img.height * spec.k);
      const a = drawn.getContext("2d").getImageData(0, 0, W, H).data;
      const b = want.getContext("2d").getImageData(0, 0, W, H).data;
      // Inside the named image's own rect, and only where the expectation is
      // solid (the entity may draw other things around it — a body under a
      // part — and anti-aliased edges are not the claim).
      let checked = 0, wrong = 0;
      const x0 = Math.max(0, Math.floor(spec.x)), y0 = Math.max(0, Math.floor(spec.y));
      const x1 = Math.min(W, Math.ceil(spec.x + spec.img.width * spec.k));
      const y1 = Math.min(H, Math.ceil(spec.y + spec.img.height * spec.k));
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * W + x) * 4;
          if (b[i + 3] < 250) continue;
          checked++;
          if (Math.abs(a[i] - b[i]) > 2 || Math.abs(a[i + 1] - b[i + 1]) > 2 ||
              Math.abs(a[i + 2] - b[i + 2]) > 2) wrong++;
        }
      }
      return { checked, wrong };
    }, { id, vs, doctorSrc: doctor || null, pick });
  }

  for (const side of [
    { location: "study", facing: "E" },
    { location: "hall", facing: "W" }
  ]) {
    test(`the open leaf on ${side.location}/${side.facing} is the state image, pixel for pixel`, async ({ page }) => {
      await page.goto(appUrl());
      const r = await compare(page, {
        id: "door1", vs: side, pick: "swap",
        doctor: 'world.entities.find((e) => e.id === "door1").state = "open";'
      });
      expect(r.checked, "there are solid state-image pixels to compare")
        .toBeGreaterThan(500);
      expect(r.wrong, `${r.wrong} of ${r.checked} pixels are not the state image`).toBe(0);
    });
  }

  test("the open drawer front is the part image, pixel for pixel", async ({ page }) => {
    await page.goto(appUrl());
    const r = await compare(page, {
      id: "desk1", vs: { location: "study", facing: "N" }, pick: "part",
      doctor: 'world.entities.find((e) => e.id === "desk1").state = "open";'
    });
    expect(r.checked, "there are solid part pixels to compare").toBeGreaterThan(500);
    expect(r.wrong, `${r.wrong} of ${r.checked} pixels are not the part image`).toBe(0);
  });
});

/* [ROW 21, round 2] THE PAINTED ARM OF THE THROUGH-VIEW, which had no subject.
 *
 * The row claims one device serves painted and synthesized facings alike, and
 * an artifact critic deleted the painted call site outright with the whole
 * suite green: `study/N` is the only painting and it carries no doorway, so
 * nothing in the product exercised that branch. The claim was true of the code
 * and untested anywhere.
 *
 * So the case builds the state the product will reach the day a doorway facing
 * is admitted: a painted entry bound to `study/E` — the real baked painting,
 * standing in for a wall not yet gated — with `door1` removed from the world so
 * the opening is the building's own. What must be true is what is true on the
 * grid arm: the room beyond shows, and with the device gone the opening is
 * void. */
test.describe("through an opening, on a PAINTED facing", () => {
  test("the destination room draws through a painted wall's doorway too", async ({ page }) => {
    await page.goto(appUrl());
    await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
    const res = await page.evaluate(async () => {
      const A = window.HOLO_APP, T = window.__T;
      const vs = { location: "study", facing: "E" };
      const world = T.worldWithout(["door1"]);
      const painting = A.backdrops["study/N"].image;
      if (!painting) return { skipped: "no painting is bound to study/N" };
      const bd = {};
      for (const k of Object.keys(A.backdrops)) bd[k] = { meta: A.backdrops[k].meta };
      bd["study/E"] = { meta: A.metaFor(vs), image: painting };
      const ap = window.HOLO.renderer.apertures(
        world, A.harness.staging, A.library, bd["study/E"].meta, vs)[0];
      const draw = (opts) => {
        const c = document.createElement("canvas");
        c.width = 1536; c.height = 1024;
        window.HOLO.renderer.render(c, world, A.harness.staging, A.library, bd, vs, opts);
        return c.getContext("2d").getImageData(
          Math.round(ap.x), Math.round(ap.y), Math.round(ap.w), Math.round(ap.h)).data;
      };
      const dark = (d) => {
        let n = 0;
        for (let i = 0; i < d.length; i += 4) {
          if (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2] < 12) n++;
        }
        return n;
      };
      const painted = draw({ backdrop_only: true });
      const withoutDevice = draw({ backdrop_only: true, no_through: true });
      /* And the painting is really underneath: a column of wall outside the
         opening carries the painting's own pixels, not the grid's. */
      const c = document.createElement("canvas");
      c.width = 1536; c.height = 1024;
      window.HOLO.renderer.render(c, world, A.harness.staging, A.library, bd, vs,
        { backdrop_only: true });
      const wallPx = c.getContext("2d").getImageData(200, 400, 1, 1).data;
      const truth = document.createElement("canvas");
      truth.width = 1536; truth.height = 1024;
      truth.getContext("2d").drawImage(painting, 0, 0, 1536, 1024);
      const truthPx = truth.getContext("2d").getImageData(200, 400, 1, 1).data;
      return {
        source: ap.source,
        voidWith: dark(painted),
        voidWithout: dark(withoutDevice),
        wallIsPainting: wallPx[0] === truthPx[0] && wallPx[1] === truthPx[1] && wallPx[2] === truthPx[2]
      };
    });
    expect(res.skipped, `${res.skipped}`).toBeUndefined();
    expect(res.source, "the opening is the building's — no leaf is in this world").toBe("building");
    expect(res.wallIsPainting, "the wall outside the opening is the painting itself").toBe(true);
    /* 5,000 rather than the grid arm's 50,000, and the difference is the
       point: a painted wall paints its OWN doorway, so with the device off the
       opening is not blank canvas — it is the dark passage the painter put
       there, 10,026 near-black pixels of it. What the device adds is the room
       that is actually beyond, and what it removes is every one of them. */
    expect(res.voidWithout,
      "with the device off, a painted wall's doorway is the painter's own dark hole")
      .toBeGreaterThan(5000);
    /* THREE PIXELS, not zero, and the number is stated rather than rounded
       away. The device fills the opening from the destination's own frame plus
       eight edge and corner extensions, and at the standing camera's scale the
       destination lands with a sub-pixel offset at two of the aperture's
       corners — three near-black pixels of an 84,000-pixel hole, which is a
       hairline seam and not a void. It was exactly 0 at the low-eye camera
       because the scale factor happened to land on integers. The bound is
       eight so the number has room to be measured rather than tuned; the
       claim, that the passage is drawn through a painted wall's doorway, is
       carried by `voidWithout` above it — 10,026 dark pixels with the device
       off against three with it on. */
    expect(res.voidWith,
      "and with it on, the passage is there — through a painting exactly as through a grid")
      .toBeLessThanOrEqual(8);
  });
});
