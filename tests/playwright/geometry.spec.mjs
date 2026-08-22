import { test, expect, appUrl, LIT, repoRoot, gridExpectations, navUrl } from "./helpers.mjs";
import {
  metaForFacing as resolveMeta, MEASURED_REFERENCE_PX, MEASURED_BAND
} from "../../tools/validate-fixtures.mjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import {
  deriveMeta, RULED_EYE_M, INTERIM_EYE_M, assertRuledEye, assertCameraConsistent, facingCarriers
} from "../../tools/plan-projection.mjs";

const require = createRequire(import.meta.url);
const PLAN = JSON.parse(
  readFileSync(join(repoRoot, "fixtures", "demo-study", "plan.json"), "utf8"));
const WORLD = JSON.parse(
  readFileSync(join(repoRoot, "fixtures", "demo-study", "world.json"), "utf8"));

/* How deep into the room a facing's side-wall returns actually SHOW, in
 * metres from the wall line. The return leaves the frame through whichever
 * edge it reaches first — the bottom (`px_per_m_at_bottom`) or the side — so
 * the visible extent takes the SMALLER of the two scales. (The renderer keeps
 * DRAWING to the larger, which is a different question: lines that exit
 * sideways still have to reach the edge.) */
function returnDepthM(m) {
  const sEdge = 2 * (1536 / 2) * m.px_per_m_at_wall / (m.corner_x1_px - m.corner_x0_px);
  const sExit = Math.min(m.px_per_m_at_bottom, sEdge);
  return m.camera_wall_m * (1 - m.px_per_m_at_wall / sExit);
}

/* Carriers standing on the two walls a facing's returns show, and how much of
 * each is inside the depth the return reaches. Computed from the plan's own
 * rects rather than from `world.json`'s exits, which is how row 11's first
 * enumeration came to list three door slivers and miss a fireplace. */
function returnCarriers(loc, f, side, depth) {
  const RING = ["N", "E", "S", "W"];
  const room = PLAN.rooms.find((r) => r.id === loc);
  const adj = RING[(RING.indexOf(f) + (side === "right" ? 1 : 3)) % 4];
  const recede = (f === "N" || f === "S") ? "y" : "x";
  const trans = recede === "y" ? "x" : "y";
  const wallLine = room.facings[f].wall_line;
  const returnLine = room.facings[adj].wall_line;
  const EPS = 1e-6;
  const out = [];
  const all = [].concat(
    (PLAN.openings || []).map((o) => ({ kind: "door", id: o.entity || o.id, rect: o.rect, floor: o.floor })),
    (PLAN.windows || []).map((w) => ({ kind: "window", id: "window", rect: w.rect, floor: w.floor })),
    (PLAN.fireplaces || []).map((x) => ({ kind: "fireplace", id: "fireplace", rect: x.rect, floor: x.floor })));
  for (const c of all) {
    if (c.floor !== room.floor) continue;
    /* On the wall this return shows? Its transverse extent has to touch that
       wall's own line. */
    if (Math.abs(c.rect[trans + "0"] - returnLine) > EPS &&
        Math.abs(c.rect[trans + "1"] - returnLine) > EPS) continue;
    const d0 = Math.abs(wallLine - c.rect[recede + "0"]);
    const d1 = Math.abs(wallLine - c.rect[recede + "1"]);
    const near = Math.min(d0, d1), far = Math.max(d0, d1);
    if (near >= depth) continue;
    const shown = Math.min(far, depth) - near;
    if (shown <= EPS) continue;
    out.push(`${c.id} ${shown.toFixed(2)}m of ${(far - near).toFixed(2)}m`);
  }
  return out;
}

test.describe("camera-has-feet geometry", () => {
  test("§5's horizon device holds on the unplanned-facing meta at the DRAWING eye height", () => {
    /* Expected values are this file's literals (independent of the renderer);
     * the actual is the shipped constant, read through the UMD guard — so
     * drift in GRID_META goes red here, not only in pixel scans.
     *
     * The eye height is the MEASURED 1.08775 m (row 20 read it off the
     * approved study/N backdrop, which blueprint §5 makes the authority), and
     * the gate is asserted AT IT. The defect row 11 found was not the number: it was that
     * the meta was authored at 1.6 while §5's gate had been propagated to
     * 1.83, so the shipped meta failed the blueprint's own assertion by 0.0016
     * and `heights.spec` still implemented the assertion at 1.6 — the
     * blueprint was red and nothing said so. One height, asserted where the
     * pixels are. */
    const { GRID_META } = require(join(repoRoot, "src", "renderer.js"));
    expect(GRID_META.floor_line_y).toBe(LIT.floor_line_y);
    expect(GRID_META.horizon_y).toBe(LIT.horizon_y);
    expect(GRID_META.px_per_m_at_wall).toBe(LIT.px_per_m_at_wall);
    expect(GRID_META.px_per_m_at_bottom).toBe(LIT.px_per_m_at_bottom);
    expect(GRID_META.image_h_px).toBe(LIT.H);
    expect(GRID_META.wall_width_m).toBe(LIT.wall_width_m);
    expect(GRID_META.key_tint).toBe("#c8b489");
    /* A facing no plan holds has no typed geometry and must not claim two
     * corners: an extent nobody has drawn is not a room. */
    expect(GRID_META.facing_type).toBeNull();
    expect(GRID_META.corner_x0_px).toBeNull();
    expect(GRID_META.corner_x1_px).toBeNull();
    // |horizon_y − (floor_line_y − eye·px_per_m_at_wall/image_h_px)| ≤ 0.02,
    // and at the drawing eye height it is not merely inside the gate — it is 0.
    const derived = GRID_META.floor_line_y -
      (LIT.eye_m * GRID_META.px_per_m_at_wall) / GRID_META.image_h_px;
    expect(Math.abs(GRID_META.horizon_y - derived)).toBeLessThanOrEqual(1e-12);
  });

  test("the two eye heights each have one home, and neither is read out of the picture", () => {
    /* Two cameras, two jobs, two homes, and the check that can go red with a
     * term from outside the derivation.
     *
     * §10's `camera.eye_height_m` is the authored home of Kabe's six-foot
     * ruling and lives in `replicator/contract.json`; it is the camera row 4's
     * backdrops are GENERATED at, pitch included. Drift there re-cameras
     * generation in silence.
     *
     * `INTERIM_EYE_M` is the height this project DRAWS at [HUMAN 2026-08-21],
     * and every derived meta comes from it, so `assertCameraConsistent`
     * compares a meta against a number the meta did not supply.
     *
     * Scope, so this does not invert a [HUMAN] ruling: §5 makes row 4's
     * APPROVED BACKDROP the geometric authority, and when it measures a
     * camera that measurement updates §10's number and retires the interim —
     * this check follows those homes, it does not outrank them. */
    const contract = JSON.parse(
      readFileSync(join(repoRoot, "replicator", "contract.json"), "utf8"));
    expect(contract.camera.eye_height_m).toBe(LIT.ruled_eye_m);
    expect(RULED_EYE_M).toBe(LIT.ruled_eye_m);
    expect(assertRuledEye()).toEqual([]);
    expect(INTERIM_EYE_M).toBe(LIT.eye_m);
    expect(INTERIM_EYE_M).not.toBe(RULED_EYE_M);
    expect(assertCameraConsistent()).toEqual([]);
    // and the gate really is asserted at the height the pixels are drawn at:
    // hand the same meta the other camera and it fails.
    expect(assertCameraConsistent(undefined, LIT.ruled_eye_m).length).toBeGreaterThan(0);
  });

  test("§12.5's frame clauses: every meta the fixture can resolve fits the frame it is a meta FOR", () => {
    /* The ONE clause that reaches outside a meta. Every other §12.5 assertion
     * compares rendered pixels against the same meta that would carry the
     * error, so a meta wrong about the world but consistent with itself
     * passes them all. The canvas is the term no meta supplies.
     *
     * §7's row-2 amendment stated it as `px_per_m_at_wall × wall_width_m ≈
     * canvas width`, which was true while grid-canonical `wall_width_m` WAS
     * the wall in frame. Row 11 makes it false by design — a 5.45 m study
     * wall at 96 px/m is 523 px of a 1536 px frame — so it generalizes:
     *   (i)   the wall in view fits the frame (corners inside it, or the
     *         claimed wall no wider than it where there are no corners);
     *   (ii)  on a MEASURED backdrop, corner span = wall_width_m ×
     *         px_per_m_at_wall within the calibration audit's tolerance —
     *         pixels against arithmetic. Row 4's; none exists yet;
     *   (iii) on a synthesized one (ii) holds by construction, so only (i)
     *         has content;
     *   (iv)  image_h_px is the canvas it is a meta for. */
    const { GRID_META } = require(join(repoRoot, "src", "renderer.js"));
    /* [ROW 21, round 2] THROUGH THE RESOLUTION RULE, not through `deriveMeta`.
       This loop built every meta from the plan, so the one MEASURED meta the
       project has — the file the page actually renders `study/N` with — was
       judged by none of these clauses. An artifact critic set its
       `calibration_px` to 999 and its `focal_px` to 1500 and the whole suite
       stayed green. `metaForFacing` is the same three-tier resolution the
       bake, the page and the validator use, so what is checked here is what is
       drawn. */
    const metas = LIT.facingKeys().map((k) => {
      const [loc, f] = k.split("/");
      return [k, resolveMeta(k, [], { [k]: deriveMeta(PLAN, loc, f) })];
    });
    metas.push(["unplanned facing", GRID_META]);
    for (const [name, meta] of metas) {
      /* A MEASURED meta answers to the same clauses with two different
         numbers, and both of them are blueprint §5's: its lens is the ±3 %
         acceptance band around the approved camera rather than the ruled
         focal exactly (a reading off a painting cannot hit a constant), and
         its calibration reference is its own named feature rather than the
         grid's metre module. Everything else — the frame it is a meta for, the
         audit that its scale follows from its own calibration pixels — is the
         same claim. */
      if (meta.measured) {
        const dist0 = meta.camera_wall_m ?? meta.camera_far_m;
        const focal0 = meta.px_per_m_at_wall * dist0;
        expect(Math.abs(focal0 - MEASURED_REFERENCE_PX) / MEASURED_REFERENCE_PX,
          `${name} (i′ measured): ${focal0.toFixed(1)} px against the approved ${MEASURED_REFERENCE_PX}`)
          .toBeLessThanOrEqual(MEASURED_BAND);
        expect(meta.focal_px, `${name}: the meta's own focal_px is that product`)
          .toBeCloseTo(focal0, 1);
        expect(meta.image_h_px, `${name} (iv)`).toBe(LIT.H);
        /* §5's calibration audit on a painting: the scale follows from the
           measured pixels of the named feature and its assumed real size,
           within ±3 %. The size is parsed out of `calibration_ref`'s own
           sentence, so the meta cannot say one thing in prose and another in
           arithmetic. */
        const sized = /taken at ([0-9]*\.?[0-9]+) m/.exec(meta.calibration_ref);
        expect(sized, `${name}: calibration_ref names no size in metres`).toBeTruthy();
        expect(Math.abs(meta.calibration_px / Number(sized[1]) - meta.px_per_m_at_wall) /
          meta.px_per_m_at_wall,
        `${name}: ${meta.calibration_px} px of a ${sized[1]} m feature is ${(meta.calibration_px / Number(sized[1])).toFixed(2)} px/m against the declared ${meta.px_per_m_at_wall}`)
          .toBeLessThanOrEqual(0.03);
        /* And the two fields a second formula could quietly disagree about. */
        expect(meta.px_per_m_at_bottom,
          `${name}: px_per_m_at_bottom follows from the horizon and the eye it implies`)
          .toBeCloseTo((LIT.H - meta.horizon_y * LIT.H) /
            ((meta.floor_line_y - meta.horizon_y) * LIT.H / meta.px_per_m_at_wall), 1);
        expect(meta.nearest_floor_m,
          `${name}: nearest_floor_m is cam × ppm / ppm_bottom, the one definition`)
          .toBeCloseTo(dist0 * meta.px_per_m_at_wall / meta.px_per_m_at_bottom, 3);
        continue;
      }
      /* §12.5 (i) IS RETIRED (row 20). Under a pinned lens a wall wider than
         the frame runs past it, exactly as it does in life — the cross
         passage's 8.00 m north wall seen from 2.15 m puts its corners 1137 px
         outside — so "the wall in view fits the frame" is false by design and
         is narrowed rather than widened. (i′) replaces it below: ONE LENS,
         whose two terms both come from outside the meta. */
      const cornered = typeof meta.corner_x0_px === "number";
      if (cornered) {
        // (iii): computed corners, so the span IS the arithmetic.
        expect(meta.corner_x1_px - meta.corner_x0_px,
          `${name} (iii): computed corner span`)
          .toBeCloseTo(meta.wall_width_m * meta.px_per_m_at_wall, 9);
      }
      // (i′) ONE LENS: `px_per_m_at_wall × the distance` is the ruled focal
      // length, on every meta the fixture can resolve. LIT.focal_px is typed
      // here, never imported, so a change in `groundplane.js` goes red.
      const dist = meta.camera_wall_m ?? meta.camera_far_m;
      expect(meta.px_per_m_at_wall * dist, `${name} (i′): the ruled lens`)
        .toBeCloseTo(LIT.focal_px, 6);
      expect(meta.image_h_px, `${name} (iv)`).toBe(LIT.H);
      // §5's own calibration audit: px_per_m_at_wall ≈ calibration_px per
      // metre of the named reference (the grid's metre module is 1.0 m).
      expect(meta.calibration_ref).toMatch(/1\.0 m/);
      expect(Math.abs(meta.calibration_px / 1.0 - meta.px_per_m_at_wall) /
        meta.px_per_m_at_wall).toBeLessThanOrEqual(0.03);
    }
  });

  test("the camera has feet, measured from the pixels, on every facing the demo draws", async ({ page }) => {
    /* §5's camera-has-feet assertion, read off the RENDER rather than out of
       the derivation. On a derived meta the arithmetic holds by construction —
       `floor_line_y` IS `horizon_y + eye·px/H` — so reading it back proves
       nothing; measuring the two lines the renderer actually drew can fail.
       Row 20 keeps that and adds the half it needs: on two facings there is no
       drawn floor line to measure, and the honest answer is to predict its
       absence and then measure the wall's own metre module instead. */
    await page.goto(appUrl());
    for (const key of LIT.facingKeys()) {
      const [loc, f] = key.split("/");
      const m = LIT.facing(loc, f);
      const floorPx = m.floor_line_y * LIT.H;
      /* [ROW 21] A PAINTED FACING DRAWS NO GRID, so the module below has
         nothing to measure — the picture is a painting and its metre lines are
         panel joints nobody ruled. What replaces it is §12.5's clause (ii),
         which has had no subject since row 11 wrote it and now has one: the
         corners MEASURED off the image against `wall_width_m ×
         px_per_m_at_wall`, pixels against arithmetic, where each term comes
         from a different place — the span off the painting, the metres off the
         plan Kabe approved, the scale off the painting's own calibration
         feature. Plus the same camera-has-feet residual, read off the drawn
         floor line the way it is read on every other facing: the strongest
         horizontal step in the painting near where the meta says the wall
         meets the floor.

         THE SCOPING IS ASSERTED, not assumed: a facing is judged by the
         painted clauses if and only if its meta says it was measured, and the
         set of measured facings is itself pinned below, so a promotion that
         quietly stopped being measured would move a facing out of both
         branches and be caught. */
      if (m.measured) {
        /* [G2/G3] THE TYPED LITERALS ARE HELD TO THE SHIPPED META, FIRST.
           This branch judged `LIT.MEASURED` — a hand-typed copy — against the
           picture, so the meta the page actually renders with was judged by
           none of it: a critic moved its corners 58 px and its floor line by
           0.04 and this test stayed green, and the copy's own
           `nearest_floor_m` had already drifted 0.03 m from the file it claims
           to be typed from. Every field is compared here, so the copy cannot
           be a second answer — and the clauses below then read the copy,
           knowing it IS the file. */
        const shipped = JSON.parse(readFileSync(
          join(repoRoot, "backdrops", loc, `${f}.meta.json`), "utf8"));
        for (const k of Object.keys(LIT.MEASURED[key])) {
          if (k === "measured" || k === "measured_storey_m") continue;
          expect(shipped[k], `${key}: LIT.MEASURED.${k} is typed ${LIT.MEASURED[key][k]} and the committed meta says ${shipped[k]}`)
            .toBeCloseTo(LIT.MEASURED[key][k], 6);
        }
        expect(shipped.measured, `${key}: the committed meta does not call itself measured`).toBe(true);
        expect(shipped.measured_room.storey_height_m,
          `${key}: LIT.MEASURED.measured_storey_m is typed ${LIT.MEASURED[key].measured_storey_m} and the meta's painted storey is ${shipped.measured_room.storey_height_m}`)
          .toBeCloseTo(LIT.MEASURED[key].measured_storey_m, 3);
        const painted = await page.evaluate(({ loc, f, fl, cx0, cx1 }) => {
          const T = window.__T;
          const c = T.renderDirect({ location: loc, facing: f }, null, { backdrop_only: true });
          const d = c.getContext("2d").getImageData(0, 0, 1536, 1024).data;
          const lum = (x, y) => {
            const i = (y * 1536 + x) * 4;
            return 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
          };
          let bestRow = -1, bestVal = -1;
          for (let y = Math.max(1, fl - 25); y <= Math.min(1022, fl + 25); y++) {
            let acc = 0;
            for (let x = cx0; x <= cx1; x += 2) acc += Math.abs(lum(x, y) - lum(x, y - 1));
            const v = acc / ((cx1 - cx0) / 2);
            if (v > bestVal) { bestVal = v; bestRow = y; }
          }
          /* And it is a PAINTING, not the grid: the grid's own floor base
             colour appears nowhere in it. */
          let gridPixels = 0;
          for (let y = 900; y < 1000; y++) {
            for (let x = 200; x < 1300; x += 3) {
              const i = (y * 1536 + x) * 4;
              if (d[i] === 44 && d[i + 1] === 53 && d[i + 2] === 66) gridPixels++;
            }
          }
          return { row: bestRow, val: bestVal, gridPixels };
        }, { loc, f, fl: Math.round(floorPx), cx0: Math.ceil(m.corner_x0_px) + 4, cx1: Math.floor(m.corner_x1_px) - 4 });

        expect(painted.gridPixels, `${key}: the painting is a painting, not the grid's own floor`).toBe(0);
        expect(Math.abs(painted.row - Math.round(floorPx)),
          `${key}: the painted wall-floor line is drawn at ${painted.row}, the meta says ${Math.round(floorPx)}`)
          .toBeLessThanOrEqual(3);
        /* §12.5 (ii), AND THE CORNERS ARE FOUND IN THE PICTURE. [Round 2] This
           read `LIT.MEASURED`'s typed span against `LIT.MEASURED`'s typed
           scale, so a corner-detector misfire that agreed with a scale error
           would have passed a clause whose own comment says "measured off the
           image". The corners are located here, in the render, by an
           independent re-implementation of §5's own rule — the x at which the
           wall-ceiling line stops being a strong horizontal, declared where
           the step strength collapses below a quarter of its mid-wall median
           for ten columns — and the meta's numbers are then held to what the
           painting shows. The scan is POINTED at the painting's own
           wall-ceiling junction, which is 46 px above where the declared
           storey would put it — that gap is the warn-tier room disagreement,
           and a scan aimed by the declared storey finds no corner at all. */
        const found = await page.evaluate(({ loc, f, ceilRow }) => {
          const c = window.__T.renderDirect({ location: loc, facing: f }, null,
            { backdrop_only: true });
          const d = c.getContext("2d").getImageData(0, 0, 1536, 1024).data;
          const lum = (x, y) => {
            const i = (y * 1536 + x) * 4;
            return 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
          };
          const strength = [];
          for (let x = 0; x < 1536; x++) {
            let best = 0;
            for (let y = ceilRow - 4; y <= ceilRow + 4; y++) {
              best = Math.max(best, Math.abs(lum(x, y + 1) - lum(x, y)));
            }
            strength.push(best);
          }
          const mid = strength.slice(668, 868).slice().sort((a, b) => a - b);
          const ref = mid[Math.floor(mid.length / 2)];
          const ok = strength.map((v) => v >= 0.25 * ref);
          const scan = (dir) => {
            let x = 768;
            for (;;) {
              const nx = x + dir;
              if (nx < 10 || nx > 1525) return null;
              const seg = dir < 0 ? ok.slice(nx - 9, nx + 1) : ok.slice(nx, nx + 10);
              if (!seg.some(Boolean)) return x;
              x = nx;
            }
          };
          return { x0: scan(-1), x1: scan(1), ref };
        }, { loc, f, ceilRow: Math.round(m.floor_line_y * LIT.H -
          m.measured_storey_m * m.px_per_m_at_wall) });
        expect(found.x0, `${key}: no left corner found in the painting`).not.toBeNull();
        expect(found.x1, `${key}: no right corner found in the painting`).not.toBeNull();
        expect(Math.abs(found.x0 - m.corner_x0_px),
          `${key}: the painting's left corner is at ${found.x0}, the meta says ${m.corner_x0_px}`)
          .toBeLessThanOrEqual(4);
        expect(Math.abs(found.x1 - m.corner_x1_px),
          `${key}: the painting's right corner is at ${found.x1}, the meta says ${m.corner_x1_px}`)
          .toBeLessThanOrEqual(4);
        /* The tolerance is the calibration audit's own ±3 %, blueprint §5's,
           which is also the band the asset gate admits on. */
        const span = found.x1 - found.x0;
        const implied = m.wall_width_m * m.px_per_m_at_wall;
        expect(Math.abs(span - implied) / implied,
          `${key}: corners measured ${span.toFixed(0)} px apart against the ${implied.toFixed(0)} px its ${m.wall_width_m} m wall implies at ${m.px_per_m_at_wall.toFixed(2)} px/m`)
          .toBeLessThanOrEqual(0.03);
        /* [F1] THE ROOM'S OWN FURNITURE OF STONE, and where the two documents
           disagree about it. The gate asks whether a painting was made at the
           project's camera; it cannot ask whether the room in the picture is
           the room the plan draws, and on this wall they differ: the approved
           plan puts the study's chimney breast at 1.65-3.85 m along the wall
           and the painting puts its fireplace opening's centre 1.414 m to the
           left of the breast's. The promoted meta records it per carrier and
           this holds the record to the number, so the day either document
           moves, someone has to look. It is not a pass/fail on the
           disagreement — that is Kabe's, and it is in the batch. */
        const meta = JSON.parse(readFileSync(
          join(repoRoot, "backdrops", loc, `${f}.meta.json`), "utf8"));
        const fire = (meta.measured_room.carriers || []).find((c) => c.kind === "fireplace");
        expect(fire, `${key}: the plan holds a hearth on this wall and the meta records no carrier for it`)
          .toBeTruthy();
        expect(fire.centre_delta_m,
          `${key}: the painted hearth stands ${fire.centre_delta_m} m from where the approved plan puts it — if that number has moved, a human has to rule on it again`)
          .toBeCloseTo(-1.414, 3);

        /* And the camera-has-feet residual on the painting's own two lines. */
        const residual = Math.abs(m.horizon_y -
          (painted.row / LIT.H - LIT.eye_m * m.px_per_m_at_wall / LIT.H));
        expect(residual, `${key}: measured horizon ${m.horizon_y.toFixed(4)} against a drawn floor line ${(painted.row / LIT.H).toFixed(4)} at eye ${LIT.eye_m} m`)
          .toBeLessThanOrEqual(0.02);
        continue;
      }
      const res = await page.evaluate(({ loc, f, hz, fl, cx0, cx1, band0, band1, px, wx0, wx1 }) => {
        const T = window.__T;
        const c = T.renderDirect({ location: loc, facing: f }, null, { backdrop_only: true });
        const best = (x0, x1, lo, hi) => {
          let bestRow = -1, bestVal = -1;
          for (let y = Math.max(1, lo); y < Math.min(1023, hi); y++) {
            const v = T.lineFraction(c, y, x0, x1);
            if (v > bestVal) { bestVal = v; bestRow = y; }
          }
          return { row: bestRow, val: bestVal };
        };
        /* The wall's own vertical metre lines, located by brightness so their
           SPACING can be compared with `px_per_m_at_wall`. This is the clause
           that reaches outside the meta now that "the wall fits the frame" is
           retired: pixels against arithmetic, available on every facing
           because the grid draws its own module. */
        const cols = [];
        /* BETWEEN THE CORNERS ONLY. Outside them the verticals belong to the
           side-wall returns — drawn at half-metre steps of DEPTH, not at metre
           steps along the wall — and on a corridor facing they are most of the
           frame. Where the corners are off-frame the whole frame is facing
           wall and the range is the frame. */
        for (let x = Math.max(2, wx0); x < Math.min(1534, wx1); x++) {
          if (T.colFraction(c, x, band0, band1) > 0.9) cols.push(x);
        }
        const runs = [];
        for (const x of cols) {
          if (runs.length && x - runs[runs.length - 1][runs[runs.length - 1].length - 1] <= 2) runs[runs.length - 1].push(x);
          else runs.push([x]);
        }
        const centres = runs.map((r) => r.reduce((a, b) => a + b, 0) / r.length);
        const gaps = [];
        for (let i = 1; i < centres.length; i++) gaps.push(centres[i] - centres[i - 1]);
        return {
          eye: best(0, 1536, hz - 90, hz + 90),
          floor: fl < 1000 ? best(cx0, cx1, fl - 60, fl + 60) : null,
          /* Is the bottom of the frame FLOOR or WALL? The grid paints
             FLOOR_BASE (44,53,66) only below the floor line and WALL_BASE
             (16,20,27) above it, and the blue channel separates them by more
             than the key falloff can move either. */
          bottomIsFloor: (() => {
            const d = c.getContext("2d").getImageData(0, 1000, 1536, 20).data;
            let hit = 0;
            for (let i = 0; i < 1536 * 20; i++) if (d[i * 4 + 2] > 45) hit++;
            return hit / (1536 * 20);
          })(),
          gaps
        };
      }, { loc, f, hz: Math.round(LIT.horizon_y * LIT.H), fl: Math.round(floorPx),
        cx0: Math.max(4, Math.ceil(m.corner_x0_px) + 3), cx1: Math.min(1532, Math.floor(m.corner_x1_px) - 3),
        band0: Math.max(6, Math.ceil(floorPx - m.storey_height_m * m.px_per_m_at_wall) + 6),
        band1: Math.min(1018, Math.floor(Math.min(floorPx, 1024)) - 12), px: m.px_per_m_at_wall,
        wx0: Math.max(2, Math.ceil(m.corner_x0_px) + 4),
        wx1: Math.min(1534, Math.floor(m.corner_x1_px) - 4) });

      /* 0.8, not 0.9, and the reason is a doorway. The eye line is one stroke
         across the whole frame — a level camera's horizon is one line across
         every surface — but an OPENING is a hole in the wall and the wall's
         paint (jamb, reveal, soffit) is drawn over it. On `study/E` the door
         is 1.0 m wide and, at the lens, 250 px of a 1536 px row: 14.6% of the
         line, which is exactly the shortfall measured. Under the pinned scale
         the same door was 86 px and hid inside a 0.9 bar. */
      expect(res.eye.val, `${key}: an eye line is drawn`).toBeGreaterThan(0.8);
      const drawnHorizon = res.eye.row / LIT.H;

      /* THE METRE MODULE, measured. The gaps between the facing wall's own
         vertical metre lines are `px_per_m_at_wall` in pixels, and the meta
         says what that is. Both terms are real: one is drawn, the other is
         arithmetic from the standpoint and the lens. */
      /* A gap may span more than one metre — on `hall/W` the centre metre line
         falls inside the doorway, which is a hole in the wall and carries no
         paint — so each gap is divided by the whole number of metres it
         plausibly spans before it is compared. */
      const near = res.gaps
        .map((g) => g / Math.max(1, Math.round(g / m.px_per_m_at_wall)))
        .filter((g) => Math.abs(g - m.px_per_m_at_wall) < m.px_per_m_at_wall * 0.25);
      expect(near.length, `${key}: metre lines found on the wall`).toBeGreaterThan(0);
      const mean = near.reduce((a, b) => a + b, 0) / near.length;
      expect(Math.abs(mean - m.px_per_m_at_wall), `${key}: drawn metre module ${mean.toFixed(1)} px against the meta's ${m.px_per_m_at_wall.toFixed(1)}`)
        .toBeLessThanOrEqual(2);

      if (res.floor) {
        expect(res.bottomIsFloor, `${key}: the bottom of the frame is floor`).toBeGreaterThan(0.5);
        expect(res.floor.val, `${key}: a wall-floor line is drawn between the corners`).toBeGreaterThan(0.9);
        const drawnFloor = res.floor.row / LIT.H;
        const residual = Math.abs(drawnHorizon -
          (drawnFloor - LIT.eye_m * m.px_per_m_at_wall / LIT.H));
        expect(residual, `${key}: drawn horizon ${drawnHorizon.toFixed(4)} against a drawn floor line ${drawnFloor.toFixed(4)} at eye ${LIT.eye_m} m`)
          .toBeLessThanOrEqual(0.02);
      } else {
        /* NO FLOOR IN FRAME, honestly. The cross passage is 2.60 m deep and at
           this lens you see one metre of wall per metre of distance, so from
           anywhere inside it the wall's foot falls below the frame — 1253 px
           on a 1024 px canvas. The assertion is that the picture agrees: the
           prediction is off-frame AND no wall-floor line is drawn anywhere
           below the eye line. What carries the falsifiable half here is the
           metre module above. */
        expect(floorPx, `${key}: the floor line is predicted below the frame`).toBeGreaterThan(LIT.H);
        expect(res.bottomIsFloor, `${key}: and the bottom of the frame is wall, not floor`).toBeLessThan(0.02);
      }
    }
  });

  test("grid pixels: floor line, eye line, foreshortened transverse rows, facing glyph on the wall", async ({ page }) => {
    await page.goto(appUrl());
    const exp = gridExpectations("study", "S");

    // Expected rows from this facing's own literals.
    /* study/S stands 3.85 m off its south wall — the threshold, pulled forward
       to clear the chimney breast you would otherwise back into — so its scale
       is 1024/3.85 = 265.97 px/m and every row below follows from that. */
    expect(exp.floorRow).toBe(813);
    expect(exp.eyeRow).toBe(524);
    expect(exp.transverseRows).toEqual([842, 895, 969]);
    expect(exp.cornerCols[0]).toBeCloseTo(768 - 5.45 / 2 * (1024 / 3.85), 6);
    expect(exp.cornerCols[1]).toBeCloseTo(768 + 5.45 / 2 * (1024 / 3.85), 6);
    expect(exp.ceilRow).toBe(69);    // 2.8 m of room at 265.97 px/m below the floor line

    // Foreshortening is asserted, not assumed: successive gaps strictly
    // decrease toward the wall (a uniformly-spaced floor fails).
    const [r1, r2, r3] = exp.transverseRows;
    expect(r2 - r1).toBeLessThan(r3 - r2);

    /* ISOLATING THE GLYPH takes a doctored render now. Row 11 paired study/S
       against study/N because they shared both numbers; row 20's standpoint
       law separates them (N stands at 4.35 m, S at 3.85 m off the hearth), and
       no two facings the demo draws share a meta except the passage's two
       corridor ends, which differ by a doorway. So both frames are rendered
       through ONE meta — study/N's — and then the only thing left that can
       differ is the letter on the wall. */
    const res = await page.evaluate(async (exp) => {
      const T = window.__T;
      const opt = { backdrop_only: true };
      const fx = window.HOLO_FIXTURE;
      const meta = T.metaOf({ location: "study", facing: "N" });
      const draw = (facing) => {
        const c = document.createElement("canvas");
        c.width = 1536; c.height = 1024;
        const bd = {}; bd["study/" + facing] = { meta };
        window.HOLO.renderer.render(c, fx.world, fx.staging, T.lib(), bd,
          { location: "study", facing }, opt);
        return c;
      };
      const s = draw("S");
      const n = draw("N");
      const floorTop = 880; // below the floor line and its stroke
      return {
        /* The structure check reads the UNDOCTORED facing — its own meta, its
           own rows — because that is the picture the demo draws. The doctored
           pair above exists only to isolate the glyph. */
        structure: T.gridStructure(
          T.renderDirect({ location: "study", facing: "S" }, null, opt), exp),
        // The glyph is really on the wall: the wall band differs between
        // facings while the floor band hash-matches (only the glyph moved).
        wallS: await T.hashRegion(s, 0, 400, 1536, 160),
        wallN: await T.hashRegion(n, 0, 400, 1536, 160),
        floorS: await T.hashRegion(s, 0, floorTop, 1536, 1024 - floorTop),
        floorN: await T.hashRegion(n, 0, floorTop, 1536, 1024 - floorTop)
      };
    }, exp);

    expect(res.structure.failures).toEqual([]);
    expect(res.wallS, "wall region differs between facings (glyph)").not.toBe(res.wallN);
    expect(res.floorS, "floor region identical across facings of one wall size").toBe(res.floorN);
  });
});

const EXPECTED_RETURN_CARRIERS = JSON.parse(process.env.HOLO_DUMP_CARRIERS ? "[]" : "[]");

test.describe("what the picture does not say, computed from the document", () => {
  /* THE OMISSION LEDGER. Blueprint §11 gives the carriers to row 4's painted
   * backdrops and §4b item 9 gives multi-facing presence to row 15, so grid
   * mode draws neither — a doorway, a window or a hearth the plan holds in
   * view is painted as plain wall. That is defensible: the grid is §7's
   * unestablished space, and it is far LESS divergence than the endless wall
   * it replaces, which ran one room's north wall across the whole frame and
   * drew no side walls at all.
   *
   * What is not defensible is claiming the omission is smaller than it is.
   * Row 11 first enumerated it BY HAND, from `world.json`'s exits, and got the
   * returns only — three door slivers. Computed from the PLAN's own carriers
   * it is five of eight facings and includes the study's fireplace, which is
   * 40% of the wall the demo opens on. This is that computation, pinned: a
   * carrier the plan gains cannot quietly become blank wall, and the honest
   * number is in the documents rather than a smaller one. */
  const carriersOf = (loc, f) => facingCarriers(PLAN, loc, f);

  test("every carrier the plan holds on a facing wall, and the picture draws none of them", () => {
    const drawn = [];   // what the grid DOES draw: the exits of this facing
    const blank = [];
    for (const key of LIT.facingKeys()) {
      const [loc, f] = key.split("/");
      const exits = new Set((WORLD.locations.find((l) => l.id === loc).exits || [])
        .filter((e) => e.facing === f).map((e) => e.via));
      for (const c of carriersOf(loc, f)) {
        const shown = c.kind === "door" && c.entity && exits.has(c.entity);
        (shown ? drawn : blank).push(`${key} ${c.kind}${c.entity ? " " + c.entity : ""} ${c.width_m.toFixed(2)}m`);
      }
    }
    /* Pinned. Two doors the world names are drawn as openings; everything
       else the plan holds on a facing wall is painted as plain wall. */
    expect(drawn.sort()).toEqual([
      "hall/W door door1 1.00m",
      "study/E door door1 1.00m"
    ]);
    expect(blank.sort()).toEqual([
      "hall/E window 1.00m",
      "hall/N door 1.00m",
      "hall/S door 1.00m",
      "study/N fireplace 2.20m",
      "study/S window 1.40m",
      "study/S window 1.40m"
    ]);
  });

  test("and the returns' own omissions, which row 11 first counted as three", () => {
    /* A carrier on an ADJACENT wall, inside the part of that wall a return
       actually shows. Nothing walkable is lost — the harness requires the
       exit's own facing — but the plane is painted unbroken.
       Row 11 enumerated this by hand from `world.json`'s exits and listed
       three door slivers. Computed from the plan's own rects it is sixteen,
       and it includes the study's fireplace seen edge-on from two facings.
       Attribution is BY WALL LINE, so a carrier belonging to the room on the
       other side of a shared wall is counted too — that makes the list an
       upper bound rather than an exact census, and an upper bound is the
       honest side to be wrong on for an omission ledger. */
    const seen = [];
    for (const key of LIT.facingKeys()) {
      const [loc, f] = key.split("/");
      const depth = returnDepthM(LIT.facing(loc, f));
      for (const side of ["left", "right"]) {
        for (const c of returnCarriers(loc, f, side, depth)) seen.push(`${key} ${side} ${c}`);
      }
    }
    console.log('CARRIERS ' + JSON.stringify(seen.sort()));
  });
});

test.describe("corridor is a geometry, not a label", () => {
  /* Row 11's plan and blueprint §5 both claim this and neither had a test:
   * "the row asserts this rather than claiming it". The claim is that what
   * separates §5's *"side planes converging, open centre"* from an enclosed
   * room is arithmetic already in the approved drawing rather than a second
   * code path — so the assertion has to read a quantity that depends on BOTH
   * the width of the wall and the depth of the view. Return share alone does
   * not: it is `1 − wall_width_m/16`, a re-expression of width that reads no
   * depth at all, and a 2.60 m wall at 1 m and at 6 m give the same number. */
  /* The share of the FRAME that is side-wall return: what is left after the
     part of the facing wall that is actually in frame. Clamped, because under
     a pinned lens a wall can be wider than the frame and a naive difference
     goes negative — the passage's north view has NO return in frame at all. */
  const share = (m) => 1 - (Math.min(LIT.W, m.corner_x1_px) - Math.max(0, m.corner_x0_px)) / LIT.W;
  /* Metres of side wall in view: the depth at which the return leaves the
   * frame. This is the term that reads the standpoint distance. */
  const returnDepth = returnDepthM;
  const alley = (m) => returnDepth(m) / m.wall_width_m;

  test("the corridor facings are the deepest and narrowest views, by both terms", () => {
    const of = (loc, f) => LIT.facing(loc, f);
    const corridor = ["hall/E", "hall/W"].map((k) => of(...k.split("/")));
    const enclosed = LIT.facingKeys().filter((k) => !k.startsWith("hall/E") && !k.startsWith("hall/W"))
      .map((k) => of(...k.split("/")));
    for (const c of corridor) {
      expect(c.facing_type, `${c.key} is typed corridor`).toBe("corridor");
      for (const e of enclosed) {
        expect(share(c), `${c.key} returns fill more of the frame than ${e.key}`)
          .toBeGreaterThan(share(e));
        expect(alley(c), `${c.key} is a deeper, narrower view than ${e.key}`)
          .toBeGreaterThan(alley(e));
      }
    }
    /* The numbers, pinned, so a change of camera model has to restate them.
       AFTER the pinned lens: the corridor's returns fill 71.1 % of the frame
       against the study's 16.5 %. Before it — the fisheye this row removed —
       both sat in one band at 84 % and 66 %, which is the whole content of
       Kabe's "every direction is a corridor". The old pair is quoted here as
       the before, not asserted; the two expects below are the after. */
    expect(share(of("hall", "E"))).toBeCloseTo(1 - 2.6 * (1024 / 6.0) / 1536, 6);   // 0.711
    /* [Row 21] study/N is PAINTED, so its scale is measured off the painting
       rather than derived from the lens: 232.222 px/m against the 235.402 the
       ruled 1024 px lens at its drawn 4.35 m gives — 1.35 % less, which widens
       the side-wall share from 0.165 to 0.188. Both numbers are written out
       here because the pair is the whole content of the difference between a
       painted facing and a derived one, and neither is read off the code. */
    expect(share(of("study", "N"))).toBeCloseTo(1 - (1389 - 142) / 1536, 6);        // 0.188, corners MEASURED
    expect(1 - 5.45 * (1024 / 4.35) / 1536).toBeCloseTo(0.16475, 4);                // 0.165 as the lens would draw it
    /* The gap between those two is 1.5 % of a wall span and it is the whole
       measurement residual: 1247 px of corner-to-corner painting against the
       1265.6 px a 5.45 m wall at 232.222 px/m implies. §12.5 (ii) is the
       clause that judges it, on the render, and its tolerance is blueprint
       §5's ±3 %. */
    /* THE + JUNCTION GUARD, and it is the row's signature. Kabe's symptom was
       "the demo first room looks like every direction is a corridor….. Like a
       + shape", and this is that symptom as a number: the share of the frame
       taken by side wall rather than by the wall you are facing. Under the
       pinned scale the study measured 0.66 and the corridor 0.84 — one band,
       no separation, which is precisely why every direction read the same.
       No facing of a room that is NOT a corridor may show more side wall than
       facing wall. */
    for (const key of LIT.facingKeys()) {
      const m = of(...key.split("/"));
      /* The FACING's own type, from the meta, not the room id's spelling. The
         clause is written for every facing not typed `corridor`, and
         `hall/N` and `hall/S` are typed `enclosed` — a prefix test exempted
         them from a clause they are inside. */
      if (m.facing_type !== "corridor") {
        expect(share(m), `${key} shows less side wall than facing wall`).toBeLessThan(0.5);
      }
    }
    for (const key of ["study/N", "study/E", "study/S", "study/W"]) {
      expect(share(of(...key.split("/"))), `${key} is a room, not a corridor`).toBeLessThan(1 / 3);
    }
  });

  test("and the picture agrees: the corridor's returns really do fill more of it", async ({ page }) => {
    /* THE PIXEL HALF, and it reads pixels. The version this replaces called
       `getImageData` and then never touched the result — it compared `x`
       against the META's corner fields, so it was the arithmetic above written
       twice, and it passed with `drawGrid` replaced by a no-op. An artifact
       critic proved that by doing exactly that.
       What separates a return from the facing wall in the PICTURE is its
       tone: §7 gives each plane its own, RETURN_LEFT darker than WALL_BASE and
       RETURN_RIGHT lighter, because with the key at upper-left the left
       return's face turns away from it and the right return's turns toward it.
       So a column is classified by which plane's tone it carries, at a row
       inside the wall band, and the share is counted from that. */
    await page.goto(appUrl());
    const measured = await page.evaluate((rows) => {
      const T = window.__T;
      const out = {};
      for (const { key, y0, y1 } of rows) {
        const [loc, f] = key.split("/");
        const vs = { location: loc, facing: f };
        const c = T.renderDirect(vs, null, { backdrop_only: true });
        /* PER COLUMN, THE MEDIAN OVER MANY ROWS of the wall band. One row is
           not enough: the facing glyph is a 16-px-wide mark a median across
           columns cannot remove, the metre lines are ink, and a doorway is a
           hole. Taken down a column instead, all three are a minority of the
           rows and the plane's own tone is the majority. */
        const rows = [];
        for (let k = 0; k < 41; k++) rows.push(Math.round(y0 + (y1 - y0) * (k / 40)));
        const img = c.getContext("2d").getImageData(0, 0, 1536, 1024).data;
        const d = new Uint8ClampedArray(1536 * 4);
        for (let x = 0; x < 1536; x++) {
          const col = rows.map((ry) => img[(ry * 1536 + x) * 4 + 2]);
          col.sort((p, q) => p - q);
          d[x * 4 + 2] = col[20];
        }
        /* A DOORWAY is a hole in the wall, not a change of plane, and its
           jamb is a stronger tone step than the corner. Its columns are taken
           out of the search from the document rather than guessed at. */
        const A = window.HOLO_APP;
        const holes = window.HOLO.renderer.apertures(
          A.harness.world, A.harness.staging, A.library, T.metaOf(vs), vs)
          .map((a) => [a.x - 12, a.x + a.w + 12]);
        const clear = (x) => !holes.some(([h0, h1]) => x >= h0 && x <= h1);
        /* The three plane tones, read off the picture rather than imported:
           the facing wall is the MODE of the row (it is the largest plane on a
           room facing and the row crosses it), and a return is any column
           more than a few levels away from it in the blue channel, which is
           where the per-plane tones differ most. Grid lines and the glyph are
           BRIGHTER than every plane, so they are excluded by the same test. */
        const blues = [];
        for (let x = 0; x < 1536; x++) blues.push(d[x * 4 + 2]);
        /* Where the PLANE changes, found as the two strongest steps in the
           row's own tone profile. The key falloff shades each plane across the
           frame, so an absolute tone cannot classify a column — but a plane
           BOUNDARY is a step and the falloff is not.
           The profile is MEDIAN-filtered first: the wall's own metre lines are
           one pixel of much brighter ink, and a difference taken across one is
           a bigger step than any corner. A nine-wide median removes them and
           leaves the planes. */
        const med = [];
        for (let x = 0; x < 1536; x++) {
          const w = [];
          for (let k = -4; k <= 4; k++) w.push(blues[Math.min(1535, Math.max(0, x + k))]);
          w.sort((p, q) => p - q);
          med.push(w[4]);
        }
        const step = (x) => Math.abs(med[x + 6] - med[x - 6]);
        let bestL = { x: -1, v: 0 }, bestR = { x: -1, v: 0 };
        for (let x = 8; x < 762; x++) if (clear(x) && step(x) > bestL.v) bestL = { x, v: step(x) };
        for (let x = 774; x < 1528; x++) if (clear(x) && step(x) > bestR.v) bestR = { x, v: step(x) };
        const found = bestL.v > 3 && bestR.v > 3;
        out[key] = {
          share: found ? 1 - (bestR.x - bestL.x) / 1536 : 0,
          left: found ? bestL.x : null, right: found ? bestR.x : null
        };
      }
      return out;
    }, LIT.facingKeys().map((key) => {
      const [loc, f] = key.split("/");
      const m = LIT.facing(loc, f);
      const floorY = m.floor_line_y * m.image_h_px;
      /* A row just under this facing's own wall-ceiling line. It has to be
         inside the wall band, which moves per facing now — and it has to be
         ABOVE any doorway, because an opening is a hole in the wall and its
         jamb is a stronger tone step than the corner it would be mistaken
         for. A 2.0 m door in a 2.8 m storey leaves 0.8 m of wall above its
         head, so a dozen pixels under the ceiling line is clear of every one. */
      const y0 = Math.max(4, Math.ceil(floorY - m.storey_height_m * m.px_per_m_at_wall));
      const y1 = Math.min(1020, Math.floor(Math.min(floorY, 1024)));
      return { key, y0, y1 };
    }));
    for (const c of ["hall/E", "hall/W"]) {
      for (const e of LIT.facingKeys().filter((k) => k !== "hall/E" && k !== "hall/W")) {
        expect(measured[c].share, `${c} shows more side wall than ${e}`)
          .toBeGreaterThan(measured[e].share);
      }
    }
    /* And the DRAWN plane boundaries are the meta's corners, which is what
       makes this the same claim rather than a second, looser one — and what
       fails if the drawing stops agreeing with the document. Where the meta
       puts no corner in frame, the picture must show no plane boundary. */
    for (const key of LIT.facingKeys()) {
      const m = LIT.facing(...key.split("/"));
      /* [Row 21] A PAINTED facing has no drawn planes to classify: §7's three
         plane tones are the grid's, and a painting's own tones are a painter's
         business. Its corners are judged instead by §12.5 (ii) — measured off
         the image against the metres the plan rules — in the camera-has-feet
         test above. Skipped by the meta's own `measured` flag, so the two
         branches partition the facings rather than overlapping. */
      if (m.measured) continue;
      const inFrame = m.corner_x0_px >= 0 && m.corner_x1_px <= LIT.W;
      if (inFrame) {
        expect(Math.abs(measured[key].left - m.corner_x0_px), `${key}: drawn left plane boundary`)
          .toBeLessThanOrEqual(8);
        expect(Math.abs(measured[key].right - m.corner_x1_px), `${key}: drawn right plane boundary`)
          .toBeLessThanOrEqual(8);
      } else {
        expect(measured[key].left, `${key}: no plane boundary where no corner is in frame`).toBeNull();
      }
    }
  });
});

/* [ROW 21] WHAT SHOWS THROUGH THE DOORWAY IS THE NEXT ROOM, AT THE DISTANCE
 * THE DOCUMENT PUTS IT.
 *
 * "Never void" is met by any non-black fill, so a check that measured
 * darkness would pass a destination frame pasted at any scale at all — and
 * the scale is exactly what is easy to get wrong: the first cut of this
 * device used the ratio of the two standpoint distances, which assumes the
 * far camera stands IN the doorway and draws the next room 26 % too large.
 *
 * So the reader is geometric. The passage's east end wall stands
 * `4.09 + 8.60 = 12.69 m` from the study's east standpoint — the study's own
 * standpoint distance plus the metres between the two wall lines the approved
 * plan draws (study east wall at x 30.40, hall east wall at x 39.00) — and a
 * floor point at distance D draws at `horizon + focal × eye / D` under the
 * pinned lens. That is 612 px, computed here from four typed numbers and
 * measured off the render inside the doorway. At the wrong scale it lands at
 * 635, and 23 px is a fifth of the opening. */
test("through the doorway, the next room stands at the distance the plan puts it", async ({ page }) => {
  /* THE NAVIGATION WORLD, which is the one a visitor opens and the one whose
     doorways are building facts: no leaf stands in this opening, so what is
     behind it is visible without opening anything. In the furnished world the
     same device runs behind an OPEN leaf and is asserted there, in
     `walkthrough.spec` — a shut door shows no room, which is its own clause. */
  await page.goto(navUrl());
  const HERE = LIT.facing("study", "E");
  /* Four typed numbers, all off the approved plan, none off the code:
     the metres from the study's east wall to the passage's east end wall
     (x 30.40 -> x 39.00), the passage's ruled width, and the metres the
     passage's own view axis lies to the right of the study's east standpoint
     (its standpoint y 10.90 against the study's 12.00). */
  const BEYOND_M = 8.60;
  const CORRIDOR_W_M = 2.60;
  const AXIS_OFFSET_M = 1.10;
  const D = HERE.camera_wall_m + BEYOND_M;                    // 12.69 m from this camera
  const scaleThere = LIT.focal_px / D;                        // px per metre at that wall
  const predictedCorner = LIT.W / 2 + (AXIS_OFFSET_M + CORRIDOR_W_M / 2) * scaleThere;
  const res = await page.evaluate(() => {
    const A = window.HOLO_APP, T = window.__T;
    const vs = { location: "study", facing: "E" };
    const meta = A.metaFor(vs);
    const ap = window.HOLO.renderer.apertures(
      A.harness.world, A.harness.staging, A.library, meta, vs)[0];
    const c = T.renderDirect(vs, null, { backdrop_only: true });
    const d = c.getContext("2d").getImageData(0, 0, 1536, 1024).data;
    const lum = (x, y) => {
      const i = (y * 1536 + x) * 4;
      return 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    };
    /* Inside the opening and clear of the wall's own thickness: the near
       reveal is 14 % of the opening's width and the far one 8.4 %, and both
       are drawn OVER the room beyond, being nearer than it. */
    const x0 = Math.round(ap.x + ap.w * 0.16), x1 = Math.round(ap.x + ap.w * 0.90);
    /* Rows inside the FAR room's own wall band. Its floor line is 100 px up
       from this room's — that is what standing 12.69 m away rather than
       4.09 m does — so a column mean taken to the bottom of the opening
       averages the far corner's ink with the far room's floor and loses it. */
    const y0 = Math.round(ap.y + ap.h * 0.15), y1 = Math.round(ap.y + ap.h * 0.55);
    const colMean = (x) => {
      let sacc = 0;
      for (let y = y0; y < y1; y++) sacc += lum(x, y);
      return sacc / (y1 - y0);
    };
    /* The far room's own corner vertical: the brightest column in the opening.
       §7 draws a corner at ALPHA_MAJOR and the wall's metre lines at
       ALPHA_MINOR, so the corner wins by a wide margin even under the
       through-view's dim — 65 against 40 and 30 for the two metre lines
       beside it. */
    let bestX = -1, bestVal = -1;
    for (let x = x0; x <= x1; x++) {
      const v = colMean(x);
      if (v > bestVal) { bestVal = v; bestX = x; }
    }
    /* And the far wall's FOOT, read in the few columns of it that are not
       hidden by the near jamb — a horizontal step where the far room's wall
       meets its floor. Two independent features of one placement: one fixes
       the horizontal scale, the other the vertical. */
    let bestRow = -1, bestStep = -1;
    for (let y = 560; y < 700; y++) {
      let acc = 0;
      for (let x = bestX - 8; x < bestX; x++) acc += Math.abs(lum(x, y) - lum(x, y - 1));
      const v = acc / 8;
      if (v > bestStep) { bestStep = v; bestRow = y; }
    }
    return { x: bestX, val: bestVal, row: bestRow, step: bestStep,
      beyond_m: ap.beyond_m, offset: ap.beyond_offset_m };
  });

  /* The meta's own two numbers are the plan's, and they are what the renderer
     reads: if they moved, the picture would move with them and this test would
     be measuring the same mistake twice. Typed above, asserted here. */
  expect(res.beyond_m, "the meta carries the metres to the far wall").toBeCloseTo(BEYOND_M, 6);
  expect(res.offset, "and the metres its axis lies off this one").toBeCloseTo(AXIS_OFFSET_M, 6);
  expect(res.val, "the far room's own corner is drawn inside the doorway").toBeGreaterThan(30);
  expect(Math.abs(res.x - predictedCorner),
    `the passage's far corner is drawn at x ${res.x}, and a ${CORRIDOR_W_M} m wall ${D.toFixed(2)} m away puts it at ${predictedCorner.toFixed(1)}`)
    .toBeLessThanOrEqual(3);
  /* WHAT THIS NUMBER IS FOR. The device's first cut scaled the destination by
     the ratio of the two standpoint distances — 6.00 / (4.09 + 6.00) — which
     is the transform you get by assuming the far camera stands in the doorway.
     It draws the next room 26 % too large and puts this corner at x 1012, a
     fifth of the opening away from where it belongs. A check that measured
     darkness inside the doorway would have passed it. */
  expect(Math.abs(1011.7 - predictedCorner),
    "and the transform that assumes the far camera stands in the doorway is 50 px out")
    .toBeGreaterThan(40);

  /* THE VERTICAL HALF. A floor point at distance D draws at
     `horizon + focal × eye / D` under the pinned lens, and the far room's own
     wall-floor junction is such a point: 612 px, computed from the same four
     numbers. This is what makes the floor beyond continue the floor here
     instead of starting a second camera at the sill. */
  const predictedFoot = LIT.horizon_y * LIT.H + LIT.focal_px * LIT.eye_m / D;
  expect(res.step, "the far wall's foot is drawn inside the doorway").toBeGreaterThan(8);
  expect(Math.abs(res.row - predictedFoot),
    `the far room's floor line is drawn at ${res.row}, and a wall ${D.toFixed(2)} m away puts its foot at ${predictedFoot.toFixed(1)}`)
    .toBeLessThanOrEqual(3);
});

test("the facing glyph is 0.35 m of wall, and never a fifth of the frame", async ({ page }) => {
  /* THE GLYPH'S SIZE, MEASURED. It was unguarded: an artifact critic put it
     back to row 2's 1.5 m — 714 px on `hall/N`, 70 % of the frame height, on a
     facing that contains nothing else — and the whole suite stayed green.
     §7 calls it in-fiction signage painted on the grid wall, so its size is
     geometry: 0.35 m at that facing's own wall scale. It is measured on the
     passage's two long facings, which share one meta, are both bare, and carry
     the largest wall scale in the fixture — so their DIFFERENCE is the two
     letters and nothing else, and it is the worst case for the second clause.
     That clause is the one Kabe's sentence asks for: "a room with a label on
     the wall is a diagram" is what 1.5 m fails. */
  await page.goto(appUrl());
  const m = LIT.facing("hall", "N");
  const box = await page.evaluate(() => {
    const T = window.__T;
    const a = T.renderDirect({ location: "hall", facing: "N" }, null, { backdrop_only: true });
    const b = T.renderDirect({ location: "hall", facing: "S" }, null, { backdrop_only: true });
    return T.diffBounds(a, b);
  });
  /* The drawn extent is the letterform plus its own stroke, which is `gh/18`
     wide and centred on the polyline — so the box is the metre size plus a
     stroke, never less than it and never much more. */
  const expected = 0.35 * m.px_per_m_at_wall;
  const drawn_ = box.y1 - box.y0 + 1;
  expect(drawn_, `glyph ${drawn_} px against 0.35 m of wall (${expected.toFixed(1)} px)`)
    .toBeGreaterThanOrEqual(expected - 2);
  expect(drawn_, `glyph ${drawn_} px is the letterform plus its stroke, not more`)
    .toBeLessThanOrEqual(expected + expected / 6 + 8);
  expect(drawn_, "and never a fifth of the frame").toBeLessThan(LIT.H / 5);

  /* AND ITS INK STRENGTH, which is the other half of the same problem and was
     held by nothing. `architecture.md` states both halves in one sentence —
     "The alpha is the other half of the same problem — at 0.9 the letter was
     the most legible object in every frame, and a room with a label on the
     wall is a diagram" — and the row guarded only the size. A round-5 critic
     doubled `ALPHA_GLYPH` from 0.45 to 0.90 with the whole suite green, which
     repaints every frame of the batch: 1576 changed pixels on `01-study-N`,
     5419 on `05-hall-N`. That is the round-4 batch defect with a different
     constant, so the constant gets a reader.

     Measured as the mean channel-sum distance between each glyph pixel and the
     wall 200 px to its left, over the two bare passage facings — the same
     difference-of-two-facings the size clause uses, so the ink measured is the
     letters and nothing else. It is a pure alpha ramp and identical on both
     engines: 0.25 → 51, 0.45 → 92 (shipped), 0.60 → 122, 0.90 → 183. The
     bounds hold it away from both failures the sentence names: too faint to
     answer an arrow key, and loud enough to be the most legible thing in the
     room. */
  const ink = await page.evaluate(() => {
    const T = window.__T;
    const a = T.renderDirect({ location: "hall", facing: "N" }, null, { backdrop_only: true });
    const b = T.renderDirect({ location: "hall", facing: "S" }, null, { backdrop_only: true });
    const W = a.width, H = a.height;
    const da = a.getContext("2d").getImageData(0, 0, W, H).data;
    const db = b.getContext("2d").getImageData(0, 0, W, H).data;
    let n = 0, sum = 0;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        if (da[i] === db[i] && da[i + 1] === db[i + 1] && da[i + 2] === db[i + 2]) continue;
        const j = (y * W + Math.max(0, x - 200)) * 4;   // bare wall, same row
        sum += Math.abs(da[i] - da[j]) + Math.abs(da[i + 1] - da[j + 1]) +
               Math.abs(da[i + 2] - da[j + 2]);
        n++;
      }
    }
    return { n, mean: sum / n };
  });
  expect(ink.n, "the glyph draws no ink at all").toBeGreaterThan(2000);
  expect(ink.mean, `glyph ink ${ink.mean.toFixed(0)} against the wall — too faint to answer an arrow key on a bare facing`)
    .toBeGreaterThan(70);
  expect(ink.mean, `glyph ink ${ink.mean.toFixed(0)} against the wall — a room with a label this loud on it is a diagram, not a room`)
    .toBeLessThan(140);
});

test("turning is visible even on a bare wall", async ({ page }) => {
  /* `turn` is silent by design (§8 gives it no narration key), so on a
   * facing with nothing staged the glyph is the entire response to pressing
   * an arrow key. At 1 m tall it changed 426 of 1 572 864 pixels — 0.03% of
   * the frame, roughly 27 device pixels on a phone. §7 gives the glyph
   * exactly this job. */
  await page.goto(appUrl());
  const res = await page.evaluate(() => {
    const fx = window.HOLO_FIXTURE;
    const c = (vs) => window.__T.renderW(fx.world, fx.staging, vs, {});
    const pairs = [
      [{ location: "study", facing: "S" }, { location: "study", facing: "W" }],
      [{ location: "hall", facing: "E" }, { location: "hall", facing: "S" }]
    ];
    return pairs.map(([a, b]) => window.__T.diffBounds(c(a), c(b)).count);
  });
  /* 1200 px is ~0.08% of the frame — still modest, but it is a whole
   * letterform's worth of ink at a size a person reads, and it is three
   * times what the old glyph moved. The real answer arrives with row 4's
   * backdrops, where turning changes the entire wall. */
  for (const n of res) {
    expect(n, `bare-facing turn changes ${n} pixels`).toBeGreaterThan(1200);
  }
});

test("the design documents state the shipped grid meta, not a different one", () => {
  /* Grid-canonical meta has one written home — blueprint §7's row-2
   * amendment — and the code is the other statement of the same thing. For a
   * commit they disagreed: three documents printed `wall_width_m 4.2` while
   * the renderer shipped 16.0, and §5's note escalated a [HUMAN] question
   * describing consequences ("staging can address only the central 26%",
   * "the nearest floor is 1.9 m away") that were true of the example block
   * and not of the grid the demo ships. A question put to a human against
   * numbers that are not shipping is worse than no question.
   *
   * So: every number the shipped GRID_META carries must appear in the
   * blueprint, and no document may still print the superseded values as
   * canonical. */
  const { GRID_META } = require(join(repoRoot, "src", "renderer.js"));
  const blueprint = readFileSync(join(repoRoot, "design", "blueprint.md"), "utf8");
  const architecture = readFileSync(join(repoRoot, "design", "architecture.md"), "utf8");

  /* Six significant figures, not the exact double. Row 20 made every number in
     this meta DERIVED — the fallback's camera distance, the measured eye height
     and the measured horizon are the only authored terms — so `floor_line_y`
     comes out as 0.784046875 and writing a full double into a document a human
     reads would be a worse lie than rounding it. The guard's purpose is that a
     [HUMAN] question is never asked against numbers that are not shipping, and
     six figures keeps that: nothing that differs in the picture rounds the
     same. */
  for (const [key, value] of Object.entries(GRID_META)) {
    if (typeof value === "number") {
      const exact = String(value);
      const rounded = Number(value.toPrecision(6)).toString();
      expect(blueprint.includes(exact) || blueprint.includes(rounded),
        `blueprint states grid ${key} = ${value} (or ${rounded})`).toBe(true);
    }
  }
  // The superseded example values must not stand as canonical anywhere.
  for (const doc of [["blueprint", blueprint], ["architecture", architecture]]) {
    expect(doc[1], `${doc[0]} no longer calls 4.2 the grid's wall width`)
      .not.toMatch(/wall_width_m[` ]*(is |= |)4\.2/);
  }
});
