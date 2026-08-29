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
      const b = 120 + ((y - fRow) >> 2);
      for (let x = 0; x < W; x += 8) {
        ic.fillStyle = "rgb(" + (30 + ((x >> 3) % 28) * 8) + ",190," + b + ")";
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
    const threshold = ap.y + ap.h;

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

  test("the far floor crosses its own bottom edge without a seam", () => {
    const above = VIEW.above, below = VIEW.below;
    expect(below.length).toBe(above.length);
    let worst = 0, at = -1;
    for (let i = 0; i < above.length; i++) {
      for (let c = 0; c < 3; c++) {
        const d = Math.abs(above[i][c] - below[i][c]);
        if (d > worst) { worst = d; at = i; }
      }
    }
    expect(worst,
      `column ${at} jumps by ${worst} across the far frame's bottom edge`)
      .toBeLessThanOrEqual(12);
  });

  test("and it is the same picture twice (§12.2)", () => {
    expect(VIEW.repeat).toEqual(VIEW.at_threshold);
  });
});
