/* §12.5's rendered-height clause against grid canonical meta, machine-checked
 * at V1: expected values come from §5 literals + the pinned depth model by
 * INDEPENDENT arithmetic (helpers MATH — a test-side re-implementation, never
 * an import of groundplane.js); actuals come from rendered alpha bounds —
 * never the renderer's own computed scale. ±5% on height, ±2 px on position.
 *
 * Census: study desk1/chair1/door1; hall shelf1/stick1/door1 (§12.5's rule —
 * any staged entity with known dims_m qualifies, wall-mounted included).
 * Plus (plan strengthenings): the open-door geometric gate on both facings,
 * the anchor_on child (note1), and the revealed key in the cavity.
 */
import { test, expect, appUrl, LIT, MATH, repoRoot } from "./helpers.mjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* Solo alpha-bounds of one entity rendered without backdrop or shadows. */
async function soloBounds(page, id, viewstate, doctor = null) {
  return await page.evaluate(({ id, viewstate, doctorSrc }) => {
    const fx = window.HOLO_FIXTURE;
    const keepIds = [id];
    const world = window.__T.clone(fx.world);
    if (doctorSrc) (new Function("world", doctorSrc))(world);
    const drop = world.entities.filter((e) => !keepIds.includes(e.id)).map((e) => e.id);
    const solo = window.__T.worldWithout(drop, world);
    if (!solo.knowledge.player.includes(id)) solo.knowledge.player.push(id);
    const c = window.__T.renderW(solo, fx.staging, viewstate,
      { no_backdrop: true, shadows: false });
    return window.__T.alphaBounds(c, 1);
  }, { id, viewstate, doctorSrc: doctor });
}

async function record(page, spriteId) {
  return await page.evaluate(
    (s) => window.__T.clone(window.HOLO_APP.library[s].record), spriteId);
}

async function placement(page, entityId) {
  return await page.evaluate(
    (e) => window.__T.clone(window.HOLO_APP.harness.staging.placements[e]), entityId);
}

test.describe("§12.5 — rendered geometry against grid canonical meta", () => {
  const census = [
    { id: "desk1", sprite: "desk-joined-oak-1660", vs: { location: "study", facing: "N" } },
    { id: "chair1", sprite: "chair-joined", vs: { location: "study", facing: "N" } },
    { id: "door1", sprite: "door-plank", vs: { location: "study", facing: "E" }, placementIndex: 0 },
    { id: "shelf1", sprite: "shelf-oak", vs: { location: "hall", facing: "N" } },
    { id: "stick1", sprite: "candlestick-brass", vs: { location: "hall", facing: "N" } },
    { id: "door1", sprite: "door-plank", vs: { location: "hall", facing: "W" }, placementIndex: 1, label: "door1@hall" }
  ];

  for (const c of census) {
    test(`${c.label || c.id}: alpha-bounds height within 5%, base position within 2px`, async ({ page }) => {
      await page.goto(appUrl());
      const rec = await record(page, c.sprite);
      let pl = await placement(page, c.id);
      if (Array.isArray(pl)) pl = pl[c.placementIndex];
      const P = MATH.place(pl, rec);

      const b = await soloBounds(page, c.id, c.vs);
      expect(b, "entity rendered").not.toBeNull();

      // Height from alpha bounds vs dims_m.h × groundplane — never the
      // renderer's scale.
      const expectedH = rec.dims_m.h * P.s;
      expect(Math.abs(b.h - expectedH) / expectedH,
        `height ${b.h} vs expected ${expectedH.toFixed(1)}`).toBeLessThanOrEqual(0.05);

      // Bottom alpha row at the baseline; left alpha column at drawX; both
      // from the test's own arithmetic.
      expect(Math.abs(b.y1 + 1 - P.baselineY)).toBeLessThanOrEqual(2);
      expect(Math.abs(b.x0 - P.drawX)).toBeLessThanOrEqual(2);
    });
  }

  for (const side of [
    { vs: { location: "study", facing: "E" } },
    { vs: { location: "hall", facing: "W" } }
  ]) {
    test(`open door on ${side.vs.location}/${side.vs.facing}: swap state lands right, not just differently`, async ({ page }) => {
      await page.goto(appUrl());
      const rec = await record(page, "door-plank");
      let pl = await placement(page, "door1");
      pl = pl.find((p) => p.facing === `${side.vs.location}/${side.vs.facing}`);
      const P = MATH.place(pl, rec);
      const openPx = await page.evaluate(() => {
        const st = window.HOLO_APP.library["door-plank"].images.states.open;
        return { w: st.image.width, h: st.image.height, extent: st.extent };
      });

      const b = await soloBounds(page, "door1", side.vs,
        'world.entities.find((e) => e.id === "door1").state = "open";');
      expect(b).not.toBeNull();

      // Full height at wall scale (the sliver is full-height), bottom at the
      // floor line, and alpha-x bounds within 2px of the test's own origin
      // arithmetic — a leaf floating mid-doorway fails here.
      const expectedH = rec.dims_m.h * P.s; // 2.0 m at wall scale = 192 px
      expect(Math.abs(b.h - expectedH) / expectedH).toBeLessThanOrEqual(0.05);
      expect(Math.abs(b.y1 + 1 - P.baselineY)).toBeLessThanOrEqual(2);
      const expectedX0 = P.drawX + P.f * rec.states_images.open.origin.x;
      const expectedX1 = expectedX0 + P.f * openPx.w;
      expect(Math.abs(b.x0 - expectedX0)).toBeLessThanOrEqual(2);
      expect(Math.abs(b.x1 + 1 - expectedX1)).toBeLessThanOrEqual(2);
    });
  }

  test("anchor_on child (note1): scale from the host's baseline, position from the diagonal lerp", async ({ page }) => {
    await page.goto(appUrl());
    const deskRec = await record(page, "desk-joined-oak-1660");
    const noteRec = await record(page, "notebook-vellum");
    const deskPl = await placement(page, "desk1");
    const notePl = await placement(page, "note1");
    const P = MATH.place(deskPl, deskRec);

    // Note pixels = diff between (desk+note) and (desk only) solo renders.
    const b = await page.evaluate(() => {
      const fx = window.HOLO_FIXTURE;
      const vs = { location: "study", facing: "N" };
      const both = window.__T.worldWithout(
        fx.world.entities.filter((e) => !["desk1", "note1"].includes(e.id)).map((e) => e.id));
      const deskOnly = window.__T.worldWithout(
        fx.world.entities.filter((e) => e.id !== "desk1").map((e) => e.id));
      const a = window.__T.renderW(both, fx.staging, vs, { no_backdrop: true, shadows: false });
      const d = window.__T.renderW(deskOnly, fx.staging, vs, { no_backdrop: true, shadows: false });
      const diff = window.__T.diffBounds(a, d);
      return diff.count ? { x0: diff.x0, y0: diff.y0, x1: diff.x1, y1: diff.y1 } : null;
    });
    expect(b, "note drawn on the desk").not.toBeNull();

    // Expected: height = dims_m.h × scaleAtY(HOST baseline); base at the
    // diagonal lerp of surface_top through the host transform.
    const expectedH = noteRec.dims_m.h * P.s;
    const region = deskRec.anchors.surface_top;
    const t = notePl.t;
    const baseX = P.drawX + P.f * (region.x0 + (region.x1 - region.x0) * t);
    const baseY = P.drawY + P.f * (region.y0 + (region.y1 - region.y0) * t);
    const noteF = expectedH / noteRec.px.h;
    const expectedX0 = baseX - noteF * noteRec.anchors.base.x;

    const actualH = b.y1 - b.y0 + 1;
    expect(Math.abs(actualH - expectedH) / expectedH).toBeLessThanOrEqual(0.05);
    expect(Math.abs(b.y1 + 1 - baseY)).toBeLessThanOrEqual(2);
    expect(Math.abs(b.x0 - expectedX0)).toBeLessThanOrEqual(2);
  });

  test("the revealed key lands right in the cavity — never a one-pixel 'visible'", async ({ page }) => {
    await page.goto(appUrl());
    const deskRec = await record(page, "desk-joined-oak-1660");
    const keyRec = await record(page, "key-iron");
    const deskPl = await placement(page, "desk1");
    const keyPl = await placement(page, "key1");
    const P = MATH.place(deskPl, deskRec);

    const res = await page.evaluate(() => {
      const fx = window.HOLO_FIXTURE;
      const vs = { location: "study", facing: "N" };
      const mk = (ids, open, knowKey) => {
        const w = window.__T.worldWithout(
          fx.world.entities.filter((e) => !ids.includes(e.id)).map((e) => e.id));
        w.entities.find((e) => e.id === "desk1").state = open ? "open" : "closed";
        if (knowKey && !w.knowledge.player.includes("key1")) w.knowledge.player.push("key1");
        return w;
      };
      const withKey = window.__T.renderW(mk(["desk1", "key1"], true, true), fx.staging, vs,
        { no_backdrop: true, shadows: false });
      const deskOnly = window.__T.renderW(mk(["desk1"], true, false), fx.staging, vs,
        { no_backdrop: true, shadows: false });
      const diff = window.__T.diffBounds(withKey, deskOnly);
      return diff.count
        ? { count: diff.count, x0: diff.x0, y0: diff.y0, x1: diff.x1, y1: diff.y1 }
        : { count: 0 };
    });

    // ≥ 200 opaque-ish pixels of key inside the transformed cavity.
    expect(res.count, "key pixel count").toBeGreaterThanOrEqual(200);
    const cav = deskRec.anchors.drawer_cavity;
    const cavR = {
      x0: P.drawX + P.f * cav.x0 - 2, y0: P.drawY + P.f * cav.y0 - 2,
      x1: P.drawX + P.f * cav.x1 + 2, y1: P.drawY + P.f * cav.y1 + 2
    };
    expect(res.x0).toBeGreaterThanOrEqual(cavR.x0);
    expect(res.x1).toBeLessThanOrEqual(cavR.x1);
    expect(res.y0).toBeGreaterThanOrEqual(cavR.y0);
    expect(res.y1).toBeLessThanOrEqual(cavR.y1);

    // Height ≈ dims_m.h × host-baseline scale (the painter contract keeps
    // the key unclipped vertically inside the cavity), position within 2px
    // of the diagonal-lerp arithmetic.
    const expectedH = keyRec.dims_m.h * P.s;
    const actualH = res.y1 - res.y0 + 1;
    expect(Math.abs(actualH - expectedH) / expectedH).toBeLessThanOrEqual(0.05);
    const t = keyPl.t;
    const baseX = P.drawX + P.f * (cav.x0 + (cav.x1 - cav.x0) * t);
    const keyF = expectedH / keyRec.px.h;
    const expectedX0 = baseX - keyF * keyRec.anchors.base.x;
    expect(Math.abs(res.x0 - expectedX0)).toBeLessThanOrEqual(2);
  });

  test("wall_mounted at v ≠ 0 keeps wall scale — a hung object does not shrink as it rises", async ({ page }) => {
    // Both shipped door placements sit at v = 0, where "scale at the wall
    // plane" and "scale at the baseline" are the same number, so only a
    // raised placement can tell a wall-plane reading from a floor-lerp one.
    // Reading the ground-plane lerp above the floor line shrank the door by
    // 30% at v = 1.0 and nothing on the shipped fixture could see it.
    await page.goto(appUrl());
    const rec = await record(page, "door-plank");
    const V = 1.0;
    const b = await page.evaluate((v) => {
      const fx = window.HOLO_FIXTURE;
      const vs = { location: "study", facing: "E" };
      const staging = window.__T.clone(fx.staging);
      staging.placements.door1.find((p) => p.facing === "study/E").v = v;
      const solo = window.__T.worldWithout(
        fx.world.entities.filter((e) => e.id !== "door1").map((e) => e.id));
      const c = window.__T.renderW(solo, staging, vs, { no_backdrop: true, shadows: false });
      return window.__T.alphaBounds(c, 1);
    }, V);
    expect(b, "raised door rendered").not.toBeNull();

    // Expected by the test's own arithmetic: full height at WALL scale, base
    // V metres above the floor line.
    const P = MATH.place(
      { attachment: "wall_mounted", u: 0.5, v: V }, rec);
    const expectedH = rec.dims_m.h * LIT.px_per_m_at_wall;
    expect(P.s).toBe(LIT.px_per_m_at_wall);
    expect(Math.abs(b.h - expectedH) / expectedH,
      `raised height ${b.h} vs wall-scale ${expectedH}`).toBeLessThanOrEqual(0.05);
    expect(Math.abs(b.y1 + 1 - P.baselineY)).toBeLessThanOrEqual(2);
    expect(Math.abs(b.x0 - P.drawX)).toBeLessThanOrEqual(2);
  });

  test("the revealed key sits inside the drawer, not on the face of it", async ({ page }) => {
    // Children draw after their host's parts (§7 step 3), so a drawer front
    // that does not clear the cavity when open puts the key ON the drawer
    // face. The gate: every key pixel lies above the open front's top edge.
    await page.goto(appUrl());
    const deskRec = await record(page, "desk-joined-oak-1660");
    const deskPl = await placement(page, "desk1");
    const P = MATH.place(deskPl, deskRec);
    const part = deskRec.parts.find((p) => p.id === "drawer_front");

    const keyBox = await page.evaluate(() => {
      const fx = window.HOLO_FIXTURE;
      const vs = { location: "study", facing: "N" };
      const mk = (ids, knowKey) => {
        const w = window.__T.worldWithout(
          fx.world.entities.filter((e) => !ids.includes(e.id)).map((e) => e.id));
        w.entities.find((e) => e.id === "desk1").state = "open";
        if (knowKey && !w.knowledge.player.includes("key1")) w.knowledge.player.push("key1");
        return w;
      };
      const withKey = window.__T.renderW(mk(["desk1", "key1"], true), fx.staging, vs,
        { no_backdrop: true, shadows: false });
      const deskOnly = window.__T.renderW(mk(["desk1"], false), fx.staging, vs,
        { no_backdrop: true, shadows: false });
      return window.__T.diffBounds(withKey, deskOnly);
    });
    expect(keyBox.count, "key drawn").toBeGreaterThan(0);

    // Open drawer front's top edge, by the test's own arithmetic from the
    // record (origin + slide travel), through the host transform.
    const frontTopBodyPx = part.origin.y + part.slide.dy * deskRec.px.h;
    const frontTopScreenY = P.drawY + P.f * frontTopBodyPx;
    expect(keyBox.y1, "key bottom above the open drawer front's top edge")
      .toBeLessThan(frontTopScreenY);
  });

  test("feet land where the camera's own eye height puts them, not only at the right size", async ({ page }) => {
    /* §12.5's height clause reads scale, and placement derives from scale, so
     * a height check cannot see a floor that puts feet at the wrong depth:
     * both sides use the same number. §5 states the ground twice — the scale
     * lerp, and the horizon device that gives `horizon_y` its meaning
     * (y = horizon_y·H + eye_height·scale at eye height 1.6 m). This clause
     * checks the drawn baseline against the SECOND statement, so the two
     * have to agree. They did not: at §5's example px_per_m_at_bottom of 210
     * the desk's feet were 31 px low and the chair's 86, each object drawn at
     * the right size for a depth its feet did not occupy. */
    await page.goto(appUrl());
    const EYE_M = 1.6;
    const horizonPx = LIT.horizon_y * LIT.H;
    const cases = [
      { id: "desk1", sprite: "desk-joined-oak-1660", vs: { location: "study", facing: "N" } },
      { id: "chair1", sprite: "chair-joined", vs: { location: "study", facing: "N" } },
      { id: "shelf1", sprite: "shelf-oak", vs: { location: "hall", facing: "N" } },
      { id: "stick1", sprite: "candlestick-brass", vs: { location: "hall", facing: "N" } }
    ];
    for (const c of cases) {
      const rec = await record(page, c.sprite);
      const pl = await placement(page, c.id);
      const depth = pl.attachment === "floor_against" ? rec.dims_m.d : pl.depth_m;
      // Independent arithmetic: pinhole scale at that depth, then the horizon
      // device — never the lerp, and never an import.
      const scale = LIT.px_per_m_at_wall * LIT.camera_wall_m / (LIT.camera_wall_m - depth);
      const expectedBaseline = horizonPx + EYE_M * scale;
      const b = await soloBounds(page, c.id, c.vs);
      expect(b, `${c.id} rendered`).not.toBeNull();
      expect(Math.abs(b.y1 + 1 - expectedBaseline),
        `${c.id}: feet at the horizon device's baseline (${expectedBaseline.toFixed(1)})`)
        .toBeLessThanOrEqual(2);
    }
    // And the wall-plane end of the same device: an object standing against
    // the wall has its feet exactly on the floor line.
    expect(horizonPx + EYE_M * LIT.px_per_m_at_wall)
      .toBeCloseTo(LIT.floor_line_y * LIT.H, 6);
  });

  test("the implied camera and the written record cannot drift apart", async ({ page }) => {
    /* The grid meta's numbers imply a camera, and that camera does not agree
     * with §10's `focal_mm: 50` — 16 m of wall in a 1536 px frame at 3.5 m is
     * a ~133° horizontal field against a 50 mm lens's ~40°. Resolving it means
     * changing an authored y-value or the contract's focal length, which is a
     * look decision and Kabe's; what this row owes is that the question is on
     * the record and stays there.
     *
     * So this binds the code to the document: the implied field, computed
     * here from the shipped meta, must be the figure blueprint §5 states. Move
     * the camera without moving the record — or the record without the
     * camera — and this goes red. */
    await page.goto(appUrl());
    const meta = await page.evaluate(() => window.HOLO.renderer.GRID_META);
    const focalPx = meta.px_per_m_at_wall * LIT.camera_wall_m;
    const fovDeg = 2 * Math.atan((LIT.W / 2) / focalPx) * 180 / Math.PI;
    const blueprint = readFileSync(join(repoRoot, "design", "blueprint.md"), "utf8");
    expect(blueprint, "blueprint §5 carries the open camera question")
      .toMatch(/horizontal field of view/i);
    expect(blueprint, `blueprint §5 states the implied field (${fovDeg.toFixed(1)}°)`)
      .toContain(`${Math.round(fovDeg)}°`);
    expect(blueprint, "and names the contract it disagrees with")
      .toMatch(/focal_mm/);
  });

  test("the shipped GRID_META is the meta this row authored (drift guard)", async ({ page }) => {
    await page.goto(appUrl());
    const meta = await page.evaluate(() => window.HOLO.renderer.GRID_META);
    expect(meta.floor_line_y).toBe(LIT.floor_line_y);
    expect(meta.px_per_m_at_wall).toBe(LIT.px_per_m_at_wall);
    expect(meta.px_per_m_at_bottom).toBe(LIT.px_per_m_at_bottom);
    expect(meta.wall_width_m).toBe(LIT.wall_width_m);
    expect(meta.image_h_px).toBe(LIT.H);
  });
});
