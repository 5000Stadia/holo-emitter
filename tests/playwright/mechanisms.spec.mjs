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
    { id: "stick1", vs: { location: "hall", facing: "N" } },
    { id: "shelf1", vs: { location: "hall", facing: "N" } }
  ];

  for (const g of grounded) {
    test(`${g.id}: darkens the ground under it by a visible amount`, async ({ page }) => {
      await page.goto(appUrl());
      const d = await shadowDelta(page, g.id, g.vs);
      const footW = await page.evaluate((id) => {
        const A = window.HOLO_APP;
        const meta = window.HOLO.renderer.GRID_META;
        const ent = A.harness.world.entities.find((e) => e.id === id);
        const rec = A.library[ent.sprite].record;
        let pl = A.harness.staging.placements[id];
        if (Array.isArray(pl)) pl = pl[0];
        const p = window.HOLO.groundplane.placeHost(pl, rec, meta, 1536);
        return p.f * (rec.anchors.footprint.x1 - rec.anchors.footprint.x0);
      }, g.id);

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
        window.HOLO.renderer.GRID_META, { location, facing });
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
        window.HOLO.renderer.GRID_META, vs)[0];
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
    { id: "shelf1", vs: { location: "hall", facing: "N" } },
    { id: "stick1", vs: { location: "hall", facing: "N" } },
    { id: "door1", vs: { location: "study", facing: "E" } }
  ];

  for (const s of staged) {
    test(`${s.id}: placeHost agrees with the layout entry exactly`, async ({ page }) => {
      await page.goto(appUrl());
      const res = await page.evaluate(({ id, vs }) => {
        const fx = window.HOLO_FIXTURE;
        const A = window.HOLO_APP;
        const meta = window.HOLO.renderer.GRID_META;
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
    { id: "coin1", boot: { location: "hall", facing: "N" } },
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
        window.HOLO.renderer.GRID_META, vs).find((e) => e.id === "desk1");
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
        window.HOLO.renderer.GRID_META, vs);
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
        window.HOLO.renderer.GRID_META, vs).find((e) => e.id === "desk1");
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
        window.HOLO.renderer.GRID_META, vs).find((x) => x.id === "door1");
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
        unknown, fx.staging, window.__T.lib(), window.HOLO.renderer.GRID_META, vs);
      const a = window.HOLO.renderer.apertures(
        known, fx.staging, window.__T.lib(), window.HOLO.renderer.GRID_META, vs)[0];
      const mid = { x: Math.round(a.x + a.w / 2), y: Math.round(a.y + a.h / 2) };
      const unknownScene = window.__T.renderW(unknown, fx.staging, vs, {});
      const bare = window.__T.renderW(unknown, fx.staging,
        { location: "study", facing: "S" }, {});
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
  const grounded = [
    { id: "desk1", vs: { location: "study", facing: "N" } },
    { id: "chair1", vs: { location: "study", facing: "N" } },
    { id: "stick1", vs: { location: "hall", facing: "N" } },
    { id: "shelf1", vs: { location: "hall", facing: "N" } }
  ];

  for (const g of grounded) {
    test(`${g.id}: the grid floor is measurably darker under it`, async ({ page }) => {
      await page.goto(appUrl());
      const d = await page.evaluate(({ id, vs }) => {
        const fx = window.HOLO_FIXTURE;
        const solo = window.__T.worldWithout(
          fx.world.entities.filter((e) => e.id !== id).map((e) => e.id));
        // The shipped grid, not a fill: renderW passes no backdrops.
        const on = window.__T.renderW(solo, fx.staging, vs, { tint: false });
        const off = window.__T.renderW(solo, fx.staging, vs, { tint: false, shadows: false });
        const W = 1536, H = 1024;
        const a = on.getContext("2d").getImageData(0, 0, W, H).data;
        const b = off.getContext("2d").getImageData(0, 0, W, H).data;
        let count = 0, maxD = 0;
        for (let p = 0; p < W * H; p++) {
          const i = p * 4;
          const dd = (b[i] - a[i]) + (b[i + 1] - a[i + 1]) + (b[i + 2] - a[i + 2]);
          if (dd > 6) { count++; if (dd > maxD) maxD = dd; }
        }
        const meta = window.HOLO.renderer.GRID_META;
        const ent = window.HOLO_APP.harness.world.entities.find((e) => e.id === id);
        const rec = window.HOLO_APP.library[ent.sprite].record;
        let pl = fx.staging.placements[id];
        if (Array.isArray(pl)) pl = pl[0];
        const pp = window.HOLO.groundplane.placeHost(pl, rec, meta, 1536);
        const footW = pp.f * (rec.anchors.footprint.x1 - rec.anchors.footprint.x0);
        return { count, maxD, footW };
      }, { id: g.id, vs: g.vs });
      // Channel-sum darkening on a floor whose channel sum is ~120. The
      // build this clause was written against reached 12–19 in sum; the
      // key-direction offset and the floor's own luminance carry it above 30.
      expect(d.maxD, `${g.id}: peak channel-sum darkening on the grid floor`)
        .toBeGreaterThanOrEqual(30);
      // An area, not a few pixels — scaled to the object, so a candlestick is
      // judged as a candlestick.
      expect(d.count, `${g.id}: and it is an area, not a few pixels`)
        .toBeGreaterThanOrEqual(2 * d.footW);
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
        window.HOLO.renderer.GRID_META, vs).find((e) => e.id === "desk1");
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
