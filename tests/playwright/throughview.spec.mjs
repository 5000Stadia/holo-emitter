/* [Row 43] THE FAR ROOM'S FLOOR RUNS TO THE THRESHOLD.
 *
 * The Captain, on the live cyberpunk demo: "Noodle bar E has a gray divider
 * between the room on the other side of the doorway, and the edge of the
 * foreground room. Whatever is producing that issue should be able to easily be
 * resolved if we in building the room always shore up the bottom edge of the
 * background room on the other side of the doorway with the top edge of the
 * floor in the foreground at that doorway."
 *
 * The divider is row 25's bottom band: the far frame, scaled by `k` with the
 * horizons coincident, ends 38 rows above `noodle_bar/E`'s doorway foot, and
 * those rows were filled with ONE number — the mean of the far frame's bottom
 * band. A flat slab laid across the floor exactly where two floors are supposed
 * to meet is a grey divider whatever colour it is.
 *
 * What replaces it is the ground plane both cameras already stand on, and this
 * case checks the arithmetic and the pixels separately: the mapping against a
 * pinhole written out by hand here, and the composite against itself — the
 * strip has to CONTINUE the far floor above it, column by column, rather than
 * average it.
 *
 * A FINDING THIS CASE PINS. The clamp is not a fallback, it is the whole
 * geometry: a strip exists only when `k·(H − horizon) < ty − horizon`, and run
 * through the depth conversion that condition says the strip's own floor is
 * nearer to the far camera than the far frame's nearest floor row — always,
 * unless the far WALL were closer than that row. So the floor the strip wants
 * is floor no camera in the document photographed, and the far frame's last
 * floor row carried along its recession, per column, is the most that can
 * honestly be drawn there.
 */
import { test, expect, repoRoot, navUrl } from "./helpers.mjs";

/* A WIDE ARCH ONTO A DEEP ROOM — the shape that leaves a strip at all. The
 * reveals are drawn over the through-view at 14 % and 8 % of the opening's
 * width, so a 0.9 m door never shows one; 900 px onto a room 12 m off does.
 * The same doctoring `guards.spec.mjs` uses for the corner case. */
const OPENING = { x: 320, w: 900, beyond_m: 12, beyond_offset_m: 0 };

async function throughView(page, root) {
  await page.goto(navUrl(root));
  await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
  return await page.evaluate((OPENING) => {
    const A = window.HOLO_APP, R = window.HOLO.renderer;
    const vs = { location: "study", facing: "E" };
    const meta = JSON.parse(JSON.stringify(A.metaFor(vs)));
    Object.assign(meta.openings[0], OPENING);
    const ap = R.apertures(A.harness.world, A.harness.staging, A.library, meta, vs)[0];
    const dvs = { location: ap.to, facing: ap.arrive_facing };
    const destMeta = JSON.parse(JSON.stringify(A.metaFor(dvs)));
    /* The far room carries no way through of its own: what is being measured
     * is this device, not a second one drawn inside it. */
    destMeta.openings = [];

    /* THE SYNTHETIC FAR ROOM. Above its floor line a flat dark wall; below it
     * a floor whose every column is a different RED — so a strip filled with
     * one band mean and a strip sampled from the far floor cannot be confused
     * — a constant green that only the floor carries, so a wall row and a
     * floor row are told apart, and a slow non-wrapping BLUE ramp down the
     * recession, so two rows of the far floor are told apart without the
     * ramp itself becoming the seam being measured. */
    const H = 1024, W = 1536;
    const img = document.createElement("canvas");
    img.width = W; img.height = H;
    const ic = img.getContext("2d");
    ic.fillStyle = "rgb(40,40,40)";
    ic.fillRect(0, 0, W, H);
    const fRow = Math.round(destMeta.floor_line_y * destMeta.image_h_px);
    for (let y = fRow; y < H; y++) {
      /* Capped short of the green: the far frame's LAST rows are what stand
         at the threshold now that it is scaled to reach it, and a ramp that
         overtook the green there would fail the floor test on its own. */
      const b = Math.min(190, 120 + ((y - fRow) >> 2));
      for (let x = 0; x < W; x += 8) {
        ic.fillStyle = "rgb(" + (30 + ((x >> 3) % 28) * 8) + ",220," + b + ")";
        ic.fillRect(x, y, 8, 1);
      }
    }

    const bd = {};
    for (const k of Object.keys(A.backdrops)) bd[k] = { meta: A.backdrops[k].meta };
    bd[vs.location + "/" + vs.facing] = { meta };
    bd[dvs.location + "/" + dvs.facing] = { meta: destMeta, image: img };

    const shot = () => {
      const c = document.createElement("canvas");
      c.width = W; c.height = H;
      R.render(c, A.harness.world, A.harness.staging, A.library, bd, vs,
        { backdrop_only: true });
      return c.getContext("2d");
    };
    const one = shot(), two = shot();

    const map = R.throughFloorMap(meta, destMeta, ap);
    const dy = meta.horizon_y * meta.image_h_px -
      map.k * destMeta.horizon_y * destMeta.image_h_px;
    const frameBottom = dy + H * map.k;
    /* [Kabe, 2026-08-30] The threshold is the FAR side of the wall's thickness:
       the far room's floor begins `depth_m` beyond the wall plane, which this
       camera draws above its own floor line by the pinhole's rule (see the
       renderer). The box's foot is only the threshold where the wall has no
       depth on record. */
    const floorHere = meta.floor_line_y * meta.image_h_px;
    const hHere = meta.horizon_y * meta.image_h_px;
    const projected = hHere + (floorHere - hHere) * meta.camera_wall_m / (meta.camera_wall_m + (ap.depth_m || 0) * 0.5);   // the leaf's plane, mid-thickness (PASSAGE_SHARE)
    const threshold = Math.min(ap.y + ap.h, projected);

    /* Clear of the reveals the grid draws OVER the through-view: 14 % of the
     * opening in from the left, 8.4 % in from the right. */
    const x0 = Math.ceil(ap.x + ap.w * 0.16), x1 = Math.floor(ap.x + ap.w * 0.90);
    const band = (g, y) => {
      const d = g.getImageData(x0, Math.round(y), x1 - x0, 1).data;
      const out = [];
      for (let i = 0; i < d.length; i += 4) out.push([d[i], d[i + 1], d[i + 2]]);
      return out;
    };
    const strip = [];
    for (let y = Math.ceil(frameBottom); y < Math.floor(threshold); y++) {
      strip.push([y, band(one, y)]);
    }
    const sample = (y) => {
      const o = map.at(y);
      return { y: y, y_far: o.y_far, row: o.row, clamped: o.clamped,
        depth_here: o.depth_here, depth_far: o.depth_far };
    };
    return {
      ap: { x: ap.x, y: ap.y, w: ap.w, h: ap.h, to: ap.to,
        arrive_facing: ap.arrive_facing, beyond_m: ap.beyond_m },
      meta: { horizon_y: meta.horizon_y, image_h_px: meta.image_h_px,
        floor_line_y: meta.floor_line_y, px_per_m_at_wall: meta.px_per_m_at_wall,
        camera_wall_m: meta.camera_wall_m },
      dest: { horizon_y: destMeta.horizon_y, image_h_px: destMeta.image_h_px,
        floor_line_y: destMeta.floor_line_y,
        px_per_m_at_wall: destMeta.px_per_m_at_wall,
        camera_wall_m: destMeta.camera_wall_m },
      map: { k: map.k, D: map.D, cam_gap: map.cam_gap, floor_row: map.floor_row,
        last_row: map.last_row, height: map.height },
      frame_bottom: frameBottom, threshold: threshold,
      above: band(one, Math.floor(frameBottom) - 2),
      below: band(one, Math.ceil(frameBottom) + 1),
      at_threshold: band(one, Math.floor(threshold) - 1),
      strip_rows: strip.length,
      strip: strip,
      repeat: band(two, Math.floor(threshold) - 1),
      probes: [sample(frameBottom + 1), sample(threshold - 0.5),
        sample(dy + H * map.k * 0.9)]
    };
  }, OPENING);
}

/** The pinhole, written out here rather than borrowed: a floor point drawn at
 *  row `y` is `f·eye/(y − horizon)` from the camera that drew it. */
function pinhole(m) {
  const hor = m.horizon_y * m.image_h_px;
  const f = m.px_per_m_at_wall * m.camera_wall_m;
  const eye = (m.floor_line_y * m.image_h_px - hor) / m.px_per_m_at_wall;
  return { hor, eye, f,
    depthAt: (y) => f * eye / (y - hor),
    yAt: (depth) => hor + eye * f / depth };
}

let VIEW = null;
test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  VIEW = await throughView(page, repoRoot);
  await page.close();
});

test.describe("row 43 — the far floor meets the threshold", () => {
  test("the shape under test really leaves a strip below the far frame", () => {
    expect(VIEW.ap.to, "the doctored opening still leads somewhere").toBeTruthy();
    expect(VIEW.frame_bottom, "the far frame ends above the doorway's foot")
      .toBeLessThan(VIEW.threshold);
    expect(VIEW.strip_rows,
      `${VIEW.strip_rows} rows between the far frame's bottom and the threshold`)
      .toBeGreaterThan(20);
  });

  test("the mapping is the pinhole's, to a pixel", () => {
    const here = pinhole(VIEW.meta), dest = pinhole(VIEW.dest);
    const camGap = (VIEW.meta.camera_wall_m + VIEW.ap.beyond_m) - VIEW.dest.camera_wall_m;
    expect(VIEW.map.cam_gap,
      "the far camera stands D − dDest in front of this one").toBeCloseTo(camGap, 9);
    for (const p of VIEW.probes) {
      expect(p.depth_here, `depth here at row ${p.y}`).toBeCloseTo(here.depthAt(p.y), 6);
      expect(p.depth_far, "and in the far camera, the same point one offset nearer")
        .toBeCloseTo(here.depthAt(p.y) - camGap, 6);
      if (p.depth_far > 0) {
        expect(Math.abs(p.y_far - dest.yAt(p.depth_far)),
          `the far frame row that depth draws at, row ${p.y}`).toBeLessThanOrEqual(1);
      } else {
        expect(p.y_far, "a point behind the far camera has no row").toBe(Infinity);
      }
    }
  });

  test("the row at the threshold is the far frame's floor at the threshold's depth", () => {
    const dest = pinhole(VIEW.dest);
    const p = VIEW.probes[1];
    /* The far frame's floor runs from its own floor line down to its last row;
       the clamp is the geometry, not a fallback — see the header. */
    const want = Math.min(VIEW.map.last_row,
      Math.max(VIEW.map.floor_row, p.depth_far > 0 ? dest.yAt(p.depth_far) : Infinity));
    expect(Math.abs(p.row - want),
      `sampled far row ${p.row}, the depth wants ${want}`).toBeLessThanOrEqual(1);
    expect(p.row, "and it is a floor row of the far frame")
      .toBeGreaterThanOrEqual(VIEW.map.floor_row);
    expect(p.clamped,
      "whenever a strip exists its floor is nearer than the far frame's nearest row")
      .toBe(true);
  });

  test("the strip is the far room's floor, column by column — not a constant", () => {
    for (const [y, row] of VIEW.strip) {
      const reds = new Set(row.map((p) => p[0]));
      expect(reds.size,
        `row ${y} of the strip carries ${reds.size} distinct reds; a band mean carries 1`)
        .toBeGreaterThan(8);
      const rs = row.map((p) => p[0]);
      expect(Math.max(...rs) - Math.min(...rs),
        `row ${y} spans the far floor's own columns`).toBeGreaterThan(40);
      /* And what it sampled is FLOOR: only the far room's floor carries the
         green, and its wall above the floor line does not. */
      const greens = row.map((p) => p[1]);
      expect(Math.min(...greens),
        `row ${y} is sampled from the far frame's floor, not its wall`)
        .toBeGreaterThan(80);
    }
  });

  test("the far floor reaches the threshold: the frame is moved to the foot, no strip", () => {
    /* [Kabe, 2026-08-29] "Just MOVE the background source image of that room
       to butt up against the foreground image at the bottom of the doorframe."
       So the row just above the threshold is the far room's own floor - every
       column its own colour - and not a strip filled from it. */
    const row = VIEW.at_threshold;
    const distinct = new Set(row.map((px) => px.join(","))).size;
    expect(distinct, "the row above the threshold is the far floor, not a band").toBeGreaterThan(8);
    const mean = (i) => row.reduce((a, px) => a + px[i], 0) / row.length;
    expect(mean(1) - Math.max(mean(0), mean(2)),
      "the row above the threshold is the far room's green floor, not its dark wall (a flat rgb(40,40,40) wall scores 0)").toBeGreaterThan(5);
  });

  test("and it is the same picture twice (§12.2)", () => {
    expect(VIEW.repeat).toEqual(VIEW.at_threshold);
  });
});

/* [Row 43] AND THE HOLE IS THE TRACED APERTURE, NOT ITS BOX.
 *
 * Everything above is about what is drawn INSIDE the opening. This is about
 * where the opening ends. `aperture_trace.py` traces the frame's inside edge
 * off the paint and the promotion writes it as `polygon`, with `x/y/w/h` its
 * bounding box — so a clip that keeps using the rectangle paints the room
 * beyond onto whatever the paint put in the corners of that box: an arched
 * head's two spandrels, a leaning jamb's wedge, `buttery_pantry/S`'s 49 px of
 * reveal. Far floor standing on this room's wall is the same defect as a click
 * landing on plaster and reads worse, because a player can see it.
 *
 * The case is a DIFFERENCE, and deliberately: one render with the rectangle,
 * one with a polygon whose bounding box is that same rectangle, and the far
 * room's own colour sampled at the same two points in both. The control point
 * says the through-view still draws; the notch says the clip moved with the
 * polygon. Nothing here depends on which walls in the store carry a traced
 * head — what is under test is the rule.
 */
async function notchedClip(page, root) {
  await page.goto(navUrl(root));
  await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
  return await page.evaluate((OPENING) => {
    const A = window.HOLO_APP, R = window.HOLO.renderer;
    const vs = { location: "study", facing: "E" };
    const H = 1024, W = 1536;

    /* THE FAR ROOM IS ONE COLOUR NOTHING ELSE IN THIS PICTURE IS. The
       through-view's own edge extension is that colour too — it is the mean of
       the destination's own edge band — so "is this pixel the room beyond" is
       one comparison and not a shape-matching argument. */
    const FAR = [255, 0, 200];
    const img = document.createElement("canvas");
    img.width = W; img.height = H;
    const ic = img.getContext("2d");
    ic.fillStyle = "rgb(" + FAR.join(",") + ")";
    ic.fillRect(0, 0, W, H);

    const shoot = (poly) => {
      const meta = JSON.parse(JSON.stringify(A.metaFor(vs)));
      Object.assign(meta.openings[0], OPENING);
      if (poly) {
        meta.openings[0].polygon = poly;
        meta.openings[0].polygon_used = true;
      }
      const dvs = { location: null, facing: null };
      const bd = {};
      for (const k of Object.keys(A.backdrops)) bd[k] = { meta: A.backdrops[k].meta };
      bd[vs.location + "/" + vs.facing] = { meta };
      const ap = R.apertures(A.harness.world, A.harness.staging, A.library, meta, vs)[0];
      dvs.location = ap.to; dvs.facing = ap.arrive_facing;
      const destMeta = JSON.parse(JSON.stringify(A.metaFor(dvs)));
      destMeta.openings = [];
      bd[dvs.location + "/" + dvs.facing] = { meta: destMeta, image: img };
      const c = document.createElement("canvas");
      c.width = W; c.height = H;
      R.render(c, A.harness.world, A.harness.staging, A.library, bd, vs,
        { backdrop_only: true });
      return { ap: ap, ctx: c.getContext("2d") };
    };

    const plain = shoot(null);
    const a = plain.ap;
    const x = a.x, y = a.y, w = a.w, h = a.h;
    const at = (g, p) => {
      const d = g.getImageData(Math.round(p.x), Math.round(p.y), 1, 1).data;
      return [d[0], d[1], d[2]];
    };

    /* WHERE THE ROOM BEYOND ACTUALLY SHOWS, found rather than assumed. The
       opening's own soffit and jambs are drawn OVER the through-view — the
       frame stands proud of the leaf, which is row 21's clause and not this
       one — so the top of the rectangle is timber and not the far room. The
       centre column is scanned for the band that IS the far room, and the two
       probes are placed a quarter and three quarters down it: a case that
       assumed a fraction of the height would be measuring the frame's width. */
    const far = [];
    for (let yy = Math.ceil(y); yy < Math.floor(y + h); yy++) {
      const px = at(plain.ctx, { x: x + w * 0.5, y: yy });
      if (px[0] - px[1] > 40 && px[2] - px[1] > 30) far.push(yy);
    }
    const y0 = far.length ? far[0] : y;
    const y1 = far.length ? far[far.length - 1] : y + h;
    const notch = { x: x + w * 0.5, y: y0 + (y1 - y0) * 0.25 };
    const control = { x: x + w * 0.5, y: y0 + (y1 - y0) * 0.75 };

    /* A U: the top middle third of the opening, down past the notch and well
       clear of the control, is not the aperture. Its bounding box is the
       rectangle, exactly as a promoted polygon's is. */
    const cutY = y0 + (y1 - y0) * 0.45;
    const poly = [[x, y], [x + w * 0.34, y], [x + w * 0.34, cutY],
      [x + w * 0.66, cutY], [x + w * 0.66, y], [x + w, y],
      [x + w, y + h], [x, y + h]];
    const cut = shoot(poly);
    return {
      far: FAR,
      box: { x: x, y: y, w: w, h: h },
      poly_box: (() => {
        const xs = poly.map((q) => q[0]), ys = poly.map((q) => q[1]);
        return { x: Math.min(...xs), y: Math.min(...ys),
          w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
      })(),
      poly_carried: cut.ap.poly,
      notch: notch, control: control,
      plain_notch: at(plain.ctx, notch), cut_notch: at(cut.ctx, notch),
      plain_control: at(plain.ctx, control), cut_control: at(cut.ctx, control)
    };
  }, OPENING);
}

let CUT = null;
test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  CUT = await notchedClip(page, repoRoot);
  await page.close();
});

test.describe("row 43 — the through-view is clipped to the traced aperture", () => {
  /* THE ROOM BEYOND IS RECOGNISED BY ITS HUE, NOT ITS VALUE. What is drawn
     through an opening is the destination's pixels under this room's own
     lighting, so the far room's rgb(255, 0, 200) arrives at rgb(148, 0, 116) —
     a third darker and the same colour. Matching the literal triple would make
     this case a test of the light pass. Green stays the smallest channel by a
     mile, which nothing else in this picture does. */
  const isFar = (px) => px[0] - px[1] > 40 && px[2] - px[1] > 30;

  test("the polygon's bounding box IS the rectangle, so nothing else moved", () => {
    for (const k of ["x", "y", "w", "h"]) {
      expect(Math.abs(CUT.poly_box[k] - CUT.box[k]),
        `the doctored polygon's ${k} is not the opening's`).toBeLessThan(0.5);
    }
    expect(CUT.poly_carried, "the aperture carries the loop to the renderer").toBeTruthy();
  });

  test("with no polygon the far room fills the box, corner to corner", () => {
    expect(isFar(CUT.plain_notch),
      `the rectangle's own top middle is the room beyond (${CUT.plain_notch})`).toBe(true);
    expect(isFar(CUT.plain_control),
      `and so is the middle of the opening (${CUT.plain_control})`).toBe(true);
  });

  test("with one, the room beyond stops at the polygon", () => {
    expect(isFar(CUT.cut_control),
      `inside the traced aperture the room beyond is still drawn (${CUT.cut_control})`)
      .toBe(true);
    expect(isFar(CUT.cut_notch),
      `inside the bounding box but outside the traced aperture it is not (${CUT.cut_notch})`)
      .toBe(false);
  });

  test("and the polygon changes only what is outside it", () => {
    /* The two renders differ at the notch and nowhere the aperture still
       covers — which is the whole claim, stated without a colour model:
       clipping to the loop must not move the picture inside the loop. */
    expect(CUT.cut_control,
      "the pixel inside the traced aperture is the same in both renders")
      .toEqual(CUT.plain_control);
    expect(CUT.cut_notch,
      "the pixel outside it is not").not.toEqual(CUT.plain_notch);
  });
});

/* [Kabe, 2026-08-30] AND THE ROOM BEYOND NEVER STANDS BELOW THE THRESHOLD.
 *
 * "There needs to be a bottom threshold the background room image is never
 * allowed to go below, in line with the foreground room's horizontal line where
 * the back wall meets the floor's back edge. Otherwise it's fundamentally
 * nonsensical." Then: "not even exactly in line but a few pixels up ... a door
 * jamb, room divider spacing ... there's a general expected depth." The far
 * room is seen through the wall's thickness, so its floor begins at the FAR
 * side of that thickness — `depth_m`, the plan's — and this camera draws that
 * row above its own floor line by the pinhole's rule. The case is a DIFFERENCE
 * again: the same opening, its box run down to the floor line, drawn once with
 * no depth (the far room reaches the floor line) and once 0.6 m deep (it stops
 * short by the projected thickness, and the wall's own paint stands below).
 */
test("the room beyond stops at the far side of the wall's thickness, never below", async ({ page }) => {
  await page.goto(navUrl(repoRoot));
  await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
  const r = await page.evaluate(() => {
    const A = window.HOLO_APP, R = window.HOLO.renderer;
    const vs = { location: "study", facing: "E" };
    const H = 1024, W = 1536;
    const FAR = [255, 0, 200];
    const img = document.createElement("canvas");
    img.width = W; img.height = H;
    const ic = img.getContext("2d");
    ic.fillStyle = "rgb(" + FAR.join(",") + ")";
    ic.fillRect(0, 0, W, H);
    const base = A.metaFor(vs);
    const floorY = base.floor_line_y * base.image_h_px;
    const horizonY = base.horizon_y * base.image_h_px;
    const dHere = base.camera_wall_m != null ? base.camera_wall_m : base.camera_far_m;
    const shoot = (depth) => {
      const meta = JSON.parse(JSON.stringify(base));
      const o = meta.openings[0];
      delete o.polygon; o.polygon_used = false;
      o.h = floorY - o.y;               // the box runs to the floor line
      o.depth_m = depth;
      const bd = {};
      for (const k of Object.keys(A.backdrops)) bd[k] = { meta: A.backdrops[k].meta };
      bd[vs.location + "/" + vs.facing] = { meta };
      const ap = R.apertures(A.harness.world, A.harness.staging, A.library, meta, vs)[0];
      const destMeta = JSON.parse(JSON.stringify(A.metaFor({ location: ap.to, facing: ap.arrive_facing })));
      destMeta.openings = [];
      bd[ap.to + "/" + ap.arrive_facing] = { meta: destMeta, image: img };
      const c = document.createElement("canvas");
      c.width = W; c.height = H;
      R.render(c, A.harness.world, A.harness.staging, A.library, bd, vs, { backdrop_only: true });
      const g = c.getContext("2d");
      const x = Math.round(ap.x + ap.w / 2);
      const col = g.getImageData(x, 0, 1, H).data;
      let last = -1;
      for (let yy = 0; yy < H; yy++) {
        const p = col.slice(yy * 4, yy * 4 + 3);
        if (p[0] - p[1] > 40 && p[2] - p[1] > 30) last = yy;
      }
      return { last_far_row: last, depth_m: ap.depth_m };
    };
    const t = 0.6;
    const expected = horizonY + (floorY - horizonY) * dHere / (dHere + t * 0.5);   // PASSAGE_SHARE: the leaf's plane
    return { flush: shoot(0), deep: shoot(t), floorY, expected, dHere };
  });
  expect(r.deep.depth_m, "the aperture carries the plan's depth").toBe(0.6);
  /* With no depth the blend still spans its minimum band (PASSAGE_BLEND_MIN_PX
     = 24 rows): the far room is pure just above it and covered before the floor line. */
  expect(r.flush.last_far_row,
    `with no depth the far room is pure above the minimum blend band (${r.flush.last_far_row} vs ${r.floorY})`).toBeGreaterThanOrEqual(Math.floor(r.floorY) - 26);
  expect(r.flush.last_far_row, "and covered before the floor line").toBeLessThan(r.floorY - 2);
  /* [Kabe] the two floors BLEND from the leaf's plane to the floor line: the
     last row that is still purely the far room lies inside that band, above the
     floor line, and never below it. */
  expect(r.deep.last_far_row,
    `0.6 m deep the far room is still pure at the leaf's plane (${r.deep.last_far_row} vs plane ${r.expected.toFixed(1)})`).toBeGreaterThanOrEqual(Math.floor(r.expected) - 1);
  expect(r.deep.last_far_row,
    `and this room's floor has covered it before the floor line (${r.deep.last_far_row} vs floor ${r.floorY.toFixed(1)})`).toBeLessThan(r.floorY - 2);
});
