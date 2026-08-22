import { test, expect, appUrl, LIT, repoRoot, gridExpectations } from "./helpers.mjs";
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
     * The eye height is the interim 1.60 m [HUMAN 2026-08-21], and the gate is
     * asserted AT IT. The defect row 11 found was not the number: it was that
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
    const metas = LIT.facingKeys().map((k) => {
      const [loc, f] = k.split("/");
      return [k, deriveMeta(PLAN, loc, f)];
    });
    metas.push(["unplanned facing", GRID_META]);
    for (const [name, meta] of metas) {
      const cornered = typeof meta.corner_x0_px === "number";
      if (cornered) {
        expect(meta.corner_x0_px, `${name} (i): left corner in frame`).toBeGreaterThanOrEqual(0);
        expect(meta.corner_x1_px, `${name} (i): right corner in frame`).toBeLessThanOrEqual(LIT.W);
        // (iii): computed corners, so the span IS the arithmetic.
        expect(meta.corner_x1_px - meta.corner_x0_px,
          `${name} (iii): computed corner span`)
          .toBeCloseTo(meta.wall_width_m * meta.px_per_m_at_wall, 9);
      } else {
        expect(meta.wall_width_m * meta.px_per_m_at_wall,
          `${name} (i): the wall it claims fits the frame`).toBeLessThanOrEqual(LIT.W + 1e-6);
      }
      expect(meta.image_h_px, `${name} (iv)`).toBe(LIT.H);
      // §5's own calibration audit: px_per_m_at_wall ≈ calibration_px per
      // metre of the named reference (the grid's metre module is 1.0 m).
      expect(meta.calibration_ref).toMatch(/1\.0 m/);
      expect(Math.abs(meta.calibration_px / 1.0 - meta.px_per_m_at_wall) /
        meta.px_per_m_at_wall).toBeLessThanOrEqual(0.03);
    }
  });

  test("the camera has feet, measured from the pixels, on every facing the demo draws", async ({ page }) => {
    /* THE CLAUSE THAT CAN FAIL. On a meta `deriveMeta` produced, §5's horizon
     * assertion is the derivation's own equation read backwards: residual 0
     * by construction, unfalsifiable for any camera. Reading it off the meta
     * would be "identity, not evidence" moved from one meta to eight.
     *
     * So this reads the DRAWN floor line and the DRAWN horizon out of the
     * rendered grid — the brightest full-width row below and at the eye
     * line — and asserts the eye height between them against this file's own
     * literal. Break drawGrid's floor line, or its eye line, or the meta's
     * geometry, and it goes red on the facing that broke. */
    await page.goto(appUrl());
    for (const key of LIT.facingKeys()) {
      const [loc, f] = key.split("/");
      const m = LIT.facing(loc, f);
      const rows = await page.evaluate(({ loc, f }) => {
        const T = window.__T;
        const c = T.renderDirect({ location: loc, facing: f }, null, { backdrop_only: true });
        /* The two major horizontals. The eye line is the only full-width one;
           the wall-floor line runs corner to corner. Scan for them rather
           than being told where they are. */
        const best = (x0, x1, lo, hi) => {
          let bestRow = -1, bestVal = -1;
          for (let y = lo; y < hi; y++) {
            const v = T.lineFraction(c, y, x0, x1);
            if (v > bestVal) { bestVal = v; bestRow = y; }
          }
          return { row: bestRow, val: bestVal };
        };
        return { eye: best(0, 1536, 380, 600), floorish: null };
      }, { loc, f });
      // The eye line, from pixels.
      expect(rows.eye.val, `${key}: an eye line is drawn`).toBeGreaterThan(0.9);
      const drawnHorizon = rows.eye.row / LIT.H;
      // The wall-floor line, from pixels, measured between the corners only.
      const floorRow = await page.evaluate(({ loc, f, x0, x1 }) => {
        const T = window.__T;
        const c = T.renderDirect({ location: loc, facing: f }, null, { backdrop_only: true });
        let bestRow = -1, bestVal = -1;
        for (let y = 600; y < 800; y++) {
          const v = T.lineFraction(c, y, x0, x1);
          if (v > bestVal) { bestVal = v; bestRow = y; }
        }
        return { row: bestRow, val: bestVal };
      }, { loc, f, x0: Math.ceil(m.corner_x0_px) + 3, x1: Math.floor(m.corner_x1_px) - 3 });
      expect(floorRow.val, `${key}: a wall-floor line is drawn between the corners`).toBeGreaterThan(0.9);
      const drawnFloor = floorRow.row / LIT.H;
      /* §5's assertion, both sides from pixels except the eye height, which
         is this file's literal of §10's [HUMAN] number. ±2 px of row-finding
         slack on a 1024 px frame is 0.002. */
      const residual = Math.abs(drawnHorizon -
        (drawnFloor - LIT.eye_m * m.px_per_m_at_wall / LIT.H));
      expect(residual, `${key}: drawn horizon ${drawnHorizon.toFixed(4)} against a drawn floor line ${drawnFloor.toFixed(4)} at eye ${LIT.eye_m} m`)
        .toBeLessThanOrEqual(0.02);
    }
  });

  test("grid pixels: floor line, eye line, foreshortened transverse rows, facing glyph on the wall", async ({ page }) => {
    await page.goto(appUrl());
    const exp = gridExpectations("study", "S");

    // Expected rows from this facing's own literals.
    expect(exp.floorRow).toBe(645);
    expect(exp.eyeRow).toBe(491);
    expect(exp.transverseRows).toEqual([649, 675, 712]);
    expect(exp.cornerCols).toEqual([506.4, 1029.6]);
    expect(exp.ceilRow).toBe(377);   // 2.8 m of room at 96 px/m below the floor line

    // Foreshortening is asserted, not assumed: successive gaps strictly
    // decrease toward the wall (a uniformly-spaced floor fails).
    const [r1, r2, r3] = exp.transverseRows;
    expect(r2 - r1).toBeLessThan(r3 - r2);

    /* Row 2 re-pointed the pure-grid scans at the licensed-bare facings.
       Row 11 re-pairs them: study/S and study/W are no longer the same room
       drawn twice — S views the 5.45 m wall at 3.60 m and W the 4.80 m wall
       at 4.09 m, so their floors legitimately differ. The pair that isolates
       the glyph is now study/S against study/N, which share both numbers; the
       grid layer alone (`backdrop_only`) keeps N's furniture out of it. */
    const res = await page.evaluate(async (exp) => {
      const T = window.__T;
      const opt = { backdrop_only: true };
      const s = T.renderDirect({ location: "study", facing: "S" }, null, opt);
      const n = T.renderDirect({ location: "study", facing: "N" }, null, opt);
      const floorTop = 675; // below the floor line and its stroke
      return {
        structure: T.gridStructure(s, exp),
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
    expect(seen.sort()).toEqual([
      "hall/E left op15 1.00m of 1.00m",
      "hall/N left door1 0.18m of 1.00m",
      "hall/N right window 0.18m of 1.00m",
      "hall/S left window 0.17m of 1.00m",
      "hall/S right door1 0.17m of 1.00m",
      "hall/W left op14 1.00m of 1.00m",
      "hall/W left window 0.47m of 1.40m",
      "hall/W left window 1.40m of 1.40m",
      "study/E left fireplace 1.26m of 2.20m",
      "study/E right op14 1.00m of 1.00m",
      "study/E right window 1.40m of 1.40m",
      "study/N left op11 0.77m of 1.00m",
      "study/S left door1 1.00m of 1.00m",
      "study/W left window 1.40m of 1.40m",
      "study/W left window 1.50m of 1.50m",
      "study/W right fireplace 1.21m of 2.20m"
    ]);
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
  const share = (m) => 1 - (m.corner_x1_px - m.corner_x0_px) / LIT.W;
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
    /* The numbers, pinned, so a change of camera model has to restate them:
       the corridor's returns fill 84% of the frame against the study's 66%,
       and 4.27 m of side wall is in view against 2.37 m. */
    expect(share(of("hall", "E"))).toBeCloseTo(1 - 2.6 * 96 / 1536, 6);
    expect(share(of("study", "N"))).toBeCloseTo(1 - 5.45 * 96 / 1536, 6);
    expect(returnDepth(of("hall", "E"))).toBeCloseTo(4.27, 1);
    expect(returnDepth(of("study", "N"))).toBeCloseTo(2.37, 1);
  });

  test("and the picture agrees: the corridor's returns really do fill more of it", async ({ page }) => {
    /* The arithmetic above is test-side. This is the same claim read off the
       render, so the type cannot become a label the drawing ignores. */
    await page.goto(appUrl());
    const measured = await page.evaluate((keys) => {
      const T = window.__T;
      const out = {};
      for (const key of keys) {
        const [loc, f] = key.split("/");
        const vs = { location: loc, facing: f };
        const c = T.renderDirect(vs, null, { backdrop_only: true });
        const m = T.metaOf(vs);
        const d = c.getContext("2d").getImageData(0, 0, 1536, 1024).data;
        /* Pixels on a wall row that lie outside the two corners — the
           returns' share of the facing wall's own band of the frame. */
        let outside = 0;
        const y = 200;
        for (let x = 0; x < 1536; x++) {
          if (x < m.corner_x0_px || x > m.corner_x1_px) outside++;
        }
        out[key] = outside / 1536;
      }
      return out;
    }, LIT.facingKeys());
    for (const c of ["hall/E", "hall/W"]) {
      for (const e of LIT.facingKeys().filter((k) => k !== "hall/E" && k !== "hall/W")) {
        expect(measured[c], `${c} shows more side wall than ${e}`).toBeGreaterThan(measured[e]);
      }
    }
  });
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

  for (const [key, value] of Object.entries(GRID_META)) {
    if (typeof value === "number") {
      expect(blueprint, `blueprint states grid ${key} = ${value}`)
        .toContain(String(value));
    }
  }
  // The superseded example values must not stand as canonical anywhere.
  for (const doc of [["blueprint", blueprint], ["architecture", architecture]]) {
    expect(doc[1], `${doc[0]} no longer calls 4.2 the grid's wall width`)
      .not.toMatch(/wall_width_m[` ]*(is |= |)4\.2/);
  }
});
