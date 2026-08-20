/* §12.8 — the compositing mechanisms demonstrably fire, each asserted
 * separately, plus the plan's strengthenings: tint direction on all three
 * composite classes, draw order at staged overlap pixels, opaque-pixel
 * overlap magnitude, the drawer moving through toggle alone, the desk
 * body-recess, the swap-door gate witnessed from pixels, shadow geometry,
 * record→images derivation, thumbs as content, backdrop_only, grid
 * determinism, the clickability sweep, and the door round-trip.
 */
import {
  test, expect, appUrl, POINTER_VIEWPORT, MATH, LIT,
  stageTree, setViewstate, removeTree
} from "./helpers.mjs";

test.use({ viewport: POINTER_VIEWPORT });

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
    const P = MATH.place(rec.placement, rec.desk);
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
      // 3x3 neighbourhood is uniform and opaque (no edge anti-aliasing).
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
                if (n[0] !== c[0] || n[1] !== c[1] || n[2] !== c[2] || n[3] !== 255) uniform = false;
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
        window.HOLO.renderer.GRID_META, vsN);
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
      { nearer: "stick1", farther: "shelf1", vs: { location: "hall", facing: "N" } }
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
        let checked = null;
        for (const p of inter.samples) {
          const ca = window.__T.px(a, p.x, p.y);
          const cb = window.__T.px(b, p.x, p.y);
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
      const P = MATH.place(pl, rec);
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
      expect(Math.abs(centre - P.baseX), `${c.id}: shadow centred at base`).toBeLessThanOrEqual(3);
      expect(d.x1 - d.x0 + 1, `${c.id}: shadow no wider than footprint+pad`)
        .toBeLessThanOrEqual(footW + 6);
      expect(Math.abs((d.y0 + d.y1) / 2 - P.baselineY), `${c.id}: shadow at the baseline`)
        .toBeLessThanOrEqual(P.f * (rec.anchors.footprint.x1 - rec.anchors.footprint.x0) * 0.18 + 4);
    }

    // anchor_on child: note1's shadow on the desk surface.
    const deskRec = await page.evaluate(() => window.__T.clone(window.HOLO_APP.library["desk-joined-oak-1660"].record));
    const noteRec = await page.evaluate(() => window.__T.clone(window.HOLO_APP.library["notebook-vellum"].record));
    const deskPl = await page.evaluate(() => window.__T.clone(window.HOLO_APP.harness.staging.placements.desk1));
    const notePl = await page.evaluate(() => window.__T.clone(window.HOLO_APP.harness.staging.placements.note1));
    const P = MATH.place(deskPl, deskRec);
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
    expect(Math.abs((noteShadow.x0 + noteShadow.x1) / 2 - baseX),
      "note shadow centred at the child's base").toBeLessThanOrEqual(3);
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
    { boot: { location: "hall", facing: "N" }, facing: "hall/N", entities: ["shelf1", "stick1", "coin1"] },
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
