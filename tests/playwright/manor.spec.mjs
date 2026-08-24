/* THE MANOR, MEASURED. [Rows 15 and 19]
 *
 * Eighty more facings begin to render at this row, and the guards that held
 * the demo world's eight were pinned over those eight. Every claim here is
 * per facing, over all eighty-eight, and its expected side comes from OUTSIDE
 * the derivation it checks — `design/plan-draft/standpoints.tsv`, the sheet
 * Kabe signed, which `plan.spec` byte-compares against the approval commit.
 * Typing eighty-eight rows of literals into `helpers.mjs` would be a second
 * copy of a fact this project already keeps once; reading the approved sheet
 * is the same discipline `LIT` follows for the eight, at the scale the manor
 * needs.
 */
import { test, expect, repoRoot, navUrl, POINTER_VIEWPORT, LIT, stageTree, removeTree, bake,
  standAt, clickCanvasPoint } from "./helpers.mjs";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { deriveMeta, facingCarriers, waysThrough } from "../../tools/plan-projection.mjs";
import { validatePlan, planWarnings, MIN_USABLE_APERTURE_PX } from "../../tools/validate-plan.mjs";

const require = createRequire(import.meta.url);
const PLAN = JSON.parse(readFileSync(join(repoRoot, "fixtures", "demo-study", "plan.json"), "utf8"));
const NAV = JSON.parse(readFileSync(join(repoRoot, "fixtures", "nav-manor", "world.json"), "utf8"));
const RECORDS = require(join(repoRoot, "src", "placeholders.js")).records;
const FACINGS = ["N", "E", "S", "W"];
const W = 1536, H = 1024;
const PHONE = { width: 390, height: 844 };

/** The approved sheet, parsed: room name -> facing -> {type, distance, width}. */
const SHEET = (() => {
  const lines = readFileSync(join(repoRoot, "design", "plan-draft", "standpoints.tsv"), "utf8")
    .trim().split("\n");
  const head = lines[0].split("\t");
  const out = [];
  for (const l of lines.slice(1)) {
    const c = l.split("\t");
    const row = {};
    head.forEach((h, i) => { row[h] = c[i]; });
    out.push(row);
  }
  return out;
})();

/** The plan's own room ids, keyed by the NAME the approved sheet prints. */
const ROOM_BY_NAME = new Map(PLAN.rooms.map((r) => [r.name, r.id]));

/** Every way through THIS facing, with the visible centre of each in client px. */
async function waysOnScreen(page) {
  return page.evaluate(() => {
    const A = window.HOLO_APP;
    const cv = document.getElementById("scene");
    const r = cv.getBoundingClientRect();
    return A.apertureList().filter((a) => a.exit).map((a) => {
      const x0 = Math.max(0, a.x), x1 = Math.min(cv.width, a.x + a.w);
      const y0 = Math.max(0, a.y), y1 = Math.min(cv.height, a.y + a.h);
      return {
        exit: a.exit,
        visible: x1 > x0 && y1 > y0,
        cx: r.left + ((x0 + x1) / 2) * (r.width / cv.width),
        cy: r.top + ((y0 + y1) / 2) * (r.height / cv.height)
      };
    });
  });
}

test.describe("the whole manor is one document, checked facing by facing", () => {
  test("every room the world names is a room the plan draws, all four facings", () => {
    expect(NAV.locations.length, "the manor's rooms").toBe(PLAN.rooms.length);
    for (const loc of NAV.locations) {
      const room = PLAN.rooms.find((r) => r.id === loc.id);
      expect(room, `world location ${loc.id} has no plan room`).toBeTruthy();
      expect(loc.facings).toEqual(FACINGS);
    }
  });

  /* THE APPROVED SHEET IS THE OUTSIDE TERM. Every derived meta's distance,
     width and type is compared against the drawing a human signed, not against
     another run of the code that produced it. */
  test("every derived meta answers to the drawing, on all 88 facings", () => {
    const wrong = [];
    for (const row of SHEET) {
      const id = ROOM_BY_NAME.get(row.room);
      if (!id) { wrong.push(`the sheet prints a room "${row.room}" the plan does not hold`); continue; }
      const m = deriveMeta(PLAN, id, row.facing);
      const d = m.camera_wall_m ?? m.camera_far_m;
      if (Math.abs(d - Number(row.camera_wall_m)) > 5e-3) {
        wrong.push(`${id}/${row.facing}: derived ${d} m, the sheet prints ${row.camera_wall_m}`);
      }
      if (Math.abs(m.wall_width_m - Number(row.wall_width_m)) > 5e-3) {
        wrong.push(`${id}/${row.facing}: derived ${m.wall_width_m} m wide, the sheet prints ${row.wall_width_m}`);
      }
      if (m.facing_type !== row.facing_type) {
        wrong.push(`${id}/${row.facing}: derived type ${m.facing_type}, the sheet prints ${row.facing_type}`);
      }
      /* And the lens is the ruled one on every one of them, which is what
         makes a manor one building rather than eighty-eight cameras. */
      const focal = m.px_per_m_at_wall * d;
      if (Math.abs(focal - LIT.focal_px) > 1e-6) {
        wrong.push(`${id}/${row.facing}: implies a ${focal.toFixed(1)} px lens, not the ruled ${LIT.focal_px}`);
      }
    }
    expect(wrong).toEqual([]);
    expect(SHEET.length, "the sheet covers every facing of every room").toBe(88);
  });

  /* THE OMISSION CENSUS, PER FACING. Row 11 pinned it over eight facings after
     learning that a hand-written list understated the omission by an order of
     magnitude. A manor-wide TOTAL would be satisfied by the right numbers over
     the wrong walls and could not say which room went blank, so this is keyed
     by facing: a carrier the plan gains cannot become plain wall in silence
     anywhere in the building. */
  test("what the picture does not say, per facing, computed from the plan", () => {
    const drawn = [], blank = {};
    for (const loc of NAV.locations) {
      const exits = new Set((loc.exits || []).map((e) => e.via));
      for (const f of FACINGS) {
        const key = `${loc.id}/${f}`;
        let n = 0;
        for (const c of facingCarriers(PLAN, loc.id, f)) {
          const shown = c.kind === "door" && (exits.has(c.entity) || exits.has(c.id));
          if (shown) drawn.push(`${key} ${c.kind} ${c.id ?? ""}`.trim());
          else n++;
        }
        if (n) blank[key] = n;
      }
    }
    /* Pinned. What the grid DRAWS is exactly the doorways the world walks
       through; everything else the plan holds on a facing wall — windows,
       hearths, and the doors no exit uses — is painted as plain wall. */
    expect(blank).toEqual({
      "buttery_pantry/E": 1,
      "closet_chamber/N": 1,
      "closet_chamber/E": 1,
      "dining_parlour/N": 1,
      "dining_parlour/S": 2,
      "dining_parlour/W": 1,
      "entrance_approach/N": 2,
      "entrance_court/N": 6,
      "garden_room/N": 1,
      "great_hall/N": 2,
      "great_hall/S": 4,
      "great_stair_hall/W": 1,
      "guest_chamber/S": 1,
      "guest_chamber/W": 2,
      "hall/E": 1,
      /* [Row 26] `hall/S` used to carry one blank doorway — `op14`, drawn in
         the wall and walked by nobody, because from the passage's centre it
         projected wholly off the frame. The lateral slide brought it in and the
         completeness clause then demanded its exit, so it is a way through the
         player uses and no longer something the picture does not say. */
      "kitchen/E": 1,
      "kitchen/S": 2,
      "library/S": 1,
      "library/W": 2,
      "long_gallery/N": 1,
      "long_gallery/E": 5,
      "long_gallery/S": 1,
      "long_gallery/W": 4,
      "master_bedchamber/N": 1,
      "master_bedchamber/E": 2,
      "master_bedchamber/S": 2,
      "master_bedchamber/W": 1,
      "muniment_room/N": 1,
      "muniment_room/S": 2,
      "privy_garden/S": 1,
      "servants_hall/N": 1,
      "servants_hall/E": 2,
      "solar/N": 3,
      "solar/S": 4,
      "stair_landing/W": 1,
      "study/N": 1,
      "study/S": 2
    });
    expect(drawn.length, "one drawn opening per door exit of the manor").toBe(NAV.locations
      .reduce((n, l) => n + (l.exits || []).filter((e) => e.id.startsWith("door_")).length, 0));
  });

  /* THE `+` JUNCTION GUARD, MANOR-WIDE, AND WHAT IT FINDS. It exists for
     Kabe's own verbatim symptom. Eight facings of the approved manor exceed
     it, every one a narrow room viewed along its long axis from a standpoint
     the drawing places — a warning rather than a finding, because refusing
     them would refuse the plan he signed. The MEMBERSHIP is what is pinned:
     not "there are warnings" but "these eight and no others". */
  test("the + junction guard names exactly eight facings, and they are these", () => {
    const named = planWarnings(PLAN, {}, NAV)
      .filter((w) => w.includes("+ junction"))
      .map((w) => /room "([a-z_]+)" facing ([NESW])/.exec(w))
      .map((m) => `${m[1]}/${m[2]}`).sort();
    expect(named).toEqual([
      "closet_chamber/E", "closet_chamber/W",
      "entrance_court/E", "entrance_court/W",
      "garden_room/E", "garden_room/W",
      "privy_garden/E", "privy_garden/W"
    ]);
  });

  /* THE WAYS THROUGH, AND NOW THERE IS NO EXEMPTION AT ALL. The completeness
     clause requires an exit in both directions for every opening and flight
     joining two named rooms; the exemption is an opening its own standpoint
     cannot see.

     [ROW 26] THE MANOR'S ONE EXEMPT WAY IS GONE, and the sentence that used to
     stand here is gone with it: `op14` landed 185 px past the frame because the
     standpoint law stood the viewer at the centre of an 8.00 m passage whose
     doors are near one end, and the law now slides the body along its own wall.
     `hall/S` sees the kitchen's door whole, the completeness clause demanded its
     exit, and the manor walks 56. The list is asserted EMPTY rather than deleted
     — an exemption that quietly reappears is exactly the hole this pair of
     assertions exists to keep visible. */
  test("every way the plan draws is walked, and no way is exempt", () => {
    const ways = waysThrough(PLAN, NAV);
    const have = new Set();
    for (const l of NAV.locations) for (const e of l.exits || []) have.add(`${e.via}|${e.from}|${e.to}`);
    expect(ways.walkable.filter((w) => !have.has(`${w.id}|${w.from}|${w.to}`)), "unwalked").toEqual([]);
    expect(ways.offscreen.map((w) => `${w.id} ${w.from}→${w.to} on ${w.from}/${w.facing}`))
      .toEqual([]);
    /* And the door that WAS exempt is walked from both sides now, which is the
       whole of what row 26 bought the player here. */
    expect(have.has("op14|hall|kitchen")).toBe(true);
    expect(have.has("op14|kitchen|hall")).toBe(true);
  });

  test("the plan and the manor world are green together", () => {
    expect(validatePlan(PLAN, NAV, {})).toEqual([]);
  });
});

test.describe("the picture, on every facing the manor renders", () => {
  test.use({ viewport: POINTER_VIEWPORT });

  /* LAW (b)'S RENDERED HALF, PER FACING RATHER THAN SAMPLED. The document-side
     check has run on every facing of every room since row 20's round 4, which
     found it gated on the ROOM and therefore blind in both directions.
     Sampling the rendered half would put that shape straight back. Every one of
     the 88 metas is rendered and two things are measured off it: a corner
     column exists exactly where the meta says one is and nowhere else, and no
     wall stands where the meta holds no band. */
  test("no facing draws a wall the document does not hold, and no corner it does not have", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto(navUrl());
    await page.waitForFunction(() => !!window.HOLO_APP);
    const bad = await page.evaluate(({ w, h }) => {
      const A = window.HOLO_APP, fx = window.HOLO_FIXTURE;
      const out = [];
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      const ctx = c.getContext("2d");
      for (const loc of fx.world.locations) {
        for (const f of loc.facings) {
          const vs = { location: loc.id, facing: f };
          const meta = A.metaFor(vs);
          window.HOLO.renderer.render(c, fx.world, fx.staging, A.library,
            { [`${loc.id}/${f}`]: { meta } }, vs, { backdrop_only: true });
          const d = ctx.getImageData(0, 0, w, h).data;
          const floorY = Math.round(meta.floor_line_y * meta.image_h_px);
          /* SAMPLED JUST ABOVE THE WALL-FLOOR LINE: below any ceiling, below
             the facing glyph (which sits on the eye line), and above the floor.
             The row is read as a CONTRAST rather than against a colour,
             because the frame-wide key falloff multiplies every base tone and
             a colour match would be measuring the falloff. */
          const y = floorY - 8;
          if (y < 2 || y > h - 3) continue;
          const at = (x) => {
            const i = ((y * w + x) << 2);
            return d[i] + d[i + 1] + d[i + 2];
          };
          const sWall = meta.px_per_m_at_wall;
          const bands = (meta.wall_segments || []).map((seg) => {
            const p0 = window.HOLO.groundplane.xAtScale(seg.from_m / meta.wall_width_m, sWall, meta, w);
            const p1 = window.HOLO.groundplane.xAtScale(seg.to_m / meta.wall_width_m, sWall, meta, w);
            return [Math.min(p0, p1), Math.max(p0, p1)];
          });
          /* The FACING WALL'S own region. Outside the corners a bounded facing
             draws its two side-wall RETURNS, which are the room's real walls
             and not a claim about the plane in front of you — law (b) is about
             what stands ON the wall line. */
          let lo = 0, hi = w;
          if (meta.corner_x0_px != null) {
            lo = Math.max(0, Math.ceil(meta.corner_x0_px) + 3);
            hi = Math.min(w, Math.floor(meta.corner_x1_px) - 3);
          }
          const inBand = (x) => bands.some(([p, q]) => x >= p + 3 && x <= q - 3);
          const onWall = [], offWall = [];
          for (let x = lo; x < hi; x += 2) (inBand(x) ? onWall : offWall).push(at(x));
          const mean = (a2) => a2.reduce((n, v) => n + v, 0) / Math.max(1, a2.length);
          if (meta.facing_type === "open") {
            /* NOTHING BUILT: the row is flat void, so its brightest and its
               darkest column agree. A wall painted here would be the invented
               enclosure law (b) forbids. */
            if (onWall.length) out.push(`${loc.id}/${f}: an open facing carries ${onWall.length} band columns`);
            /* THE GROUND RUNS TO THE FAR LINE AND NOTHING STANDS ABOVE IT.
               Measured as the step across that line rather than as flatness
               along a row: the frame-wide key falloff grades the void from 46
               to 79 across the width, so "flat" is false of an honest picture,
               while "everything above the line is darker than the ground below
               it" is exactly what law (b) asks and what a wall would break. */
            let above = 0, below = 0, n = 0;
            for (let x = lo; x < hi; x += 2) {
              const i0 = (((floorY - 24) * w + x) << 2);
              const i1 = (((floorY + 24) * w + x) << 2);
              above += d[i0] + d[i0 + 1] + d[i0 + 2];
              below += d[i1] + d[i1 + 1] + d[i1 + 2];
              n++;
            }
            if (n && above / n >= below / n) {
              out.push(`${loc.id}/${f}: an open facing paints its sky as bright as its ground (${(above / n).toFixed(0)} against ${(below / n).toFixed(0)})`);
            }
          } else {
            if (!onWall.length) out.push(`${loc.id}/${f}: a walled facing paints no band at all`);
            /* And where the view is part building and part open ground, the
               gap is measurably darker than the wall beside it — which is the
               whole of "the ground runs open to its far line" in pixels. The
               entrance approach's 20.4 m court mouth is the manor's one
               subject for it. */
            else if (offWall.length > 8 && mean(onWall) - mean(offWall) < 8) {
              out.push(`${loc.id}/${f}: the gap in its wall is painted as wall (${mean(onWall).toFixed(0)} against ${mean(offWall).toFixed(0)})`);
            }
          }
          /* A CORNER IS DRAWN IFF THE META HAS ONE IN FRAME, in both
             directions: found where the meta says one is, and absent 14 px to
             either side of it. */
          /* AND A CORNER BEHIND A STAIRCASE IS NOT DRAWN, because a staircase
             is opaque and stands in front of it. That is the one place this
             drawing occludes anything and it is the point of the flight being
             a solid: before it was, the room's own corner and floor grid read
             straight THROUGH the body of the stair, which is the picture
             denying a thing the document holds. A corner the flight's own mass
             covers is therefore exempt — computed from the mass, so the
             exemption moves if the geometry does. */
          const covered = (x) => (meta.stairs || []).some((fl2) =>
            (fl2.mass_poly || []).concat(fl2.treads_poly || []).some((poly) => {
              if (poly.length < 3) return false;
              const xs = poly.map((q) => q[0]);
              const ys = poly.map((q) => q[1]);
              return x >= Math.min(...xs) - 3 && x <= Math.max(...xs) + 3 &&
                Math.max(...ys) > floorY - 90 && Math.min(...ys) < floorY - 10;
            }));
          for (const [name, cx] of [["x0", meta.corner_x0_px], ["x1", meta.corner_x1_px]]) {
            if (cx == null || cx < 8 || cx > w - 9) continue;
            if (covered(Math.round(cx))) continue;
            const col = (x) => {
              let sum = 0;
              for (let yy = Math.max(0, floorY - 90); yy < Math.min(h, floorY - 10); yy++) {
                const i = ((yy * w + x) << 2);
                sum += d[i] + d[i + 1] + d[i + 2];
              }
              return sum;
            };
            let peak = 0;
            for (let x = Math.round(cx) - 3; x <= Math.round(cx) + 3; x++) peak = Math.max(peak, col(x));
            const base = Math.max(col(Math.round(cx) - 14), col(Math.round(cx) + 14));
            if (peak <= base) out.push(`${loc.id}/${f}: the meta puts a corner at ${name} ${Math.round(cx)} and the picture draws none`);
          }
        }
      }
      return out;
    }, { w: W, h: H });
    expect(bad).toEqual([]);
  });

  /* THE FLIGHT, PREDICTED FROM THE PLAN AND MEASURED OFF THE RENDER. This is
     §12.5 (v)'s own shape applied to the one geometry this row invents: the
     tread positions are computed test-side from the flight's rect, its tread
     count, the storey height and the standpoint the approved sheet prints, and
     compared with what the picture draws. Pixels against arithmetic.

     And the arithmetic's own consequence is asserted, because the row's first
     plan guessed it backwards: a tread ABOVE eye height draws ABOVE the
     horizon, and the spacing between equal steps WIDENS toward the top. A
     staircase painted flat on the floor does the opposite. */
  test("the ascending flight is a climb, and its treads are where the plan puts them", async ({ page }) => {
    const room = PLAN.rooms.find((r) => r.id === "great_stair_hall");
    const st = PLAN.stairs.find((s) => s.id === "great_stair");
    const storey = PLAN.floors.find((f) => f.id === room.floor).storey_height_m;
    const sheet = SHEET.find((r) => r.room === room.name && r.facing === "N");
    const cam = Number(sheet.camera_wall_m);
    const px = LIT.focal_px / cam;
    const horizon = LIT.horizon_y * LIT.H;
    /* Depths from the wall line, near end to far, and the height at each. */
    const dFar = Math.abs(room.facings.N.wall_line - st.rect.y1);
    const dNear = Math.abs(room.facings.N.wall_line - st.rect.y0);
    const want = [];
    for (let i = 0; i <= st.treads; i++) {
      const t = i / st.treads;
      const d = dNear + (dFar - dNear) * t;
      if (!(d < cam)) continue;
      const s = px * cam / (cam - d);
      const y = horizon + (LIT.eye_m - storey * t) * s;
      if (y > -LIT.H && y < 2 * LIT.H) want.push(y);
    }
    want.sort((a, b) => a - b);
    await page.goto(navUrl());
    await page.waitForFunction(() => !!window.HOLO_APP);
    const got = await page.evaluate(() => {
      const A = window.HOLO_APP;
      const vs = { location: "great_stair_hall", facing: "N" };
      const fl = (A.metaFor(vs).stairs || [])[0];
      /* The noses, off the list that says they are noses — `poly` is the hit
         region's convex hull and says nothing about where any one tread is,
         and `treads_poly` now carries two faces per step (the going and the
         riser), so its quads outnumber the treads and only half of them begin
         at a nose. */
      const ys = fl.noses.map((seg) => seg[0][1]);
      return ys.sort((a2, b2) => a2 - b2);
    });
    expect(got.length, "every tread the frame can hold").toBe(want.length);
    got.forEach((y, i) => {
      expect(Math.abs(y - want[i]), `tread ${i}: drawn at ${y.toFixed(1)}, the plan puts it at ${want[i].toFixed(1)}`)
        .toBeLessThan(0.5);
    });
    /* A CLIMB, not marks on a floor: the top tread is above the horizon, and
       the gaps widen upward. */
    expect(Math.min(...got), "the top tread stands above the horizon").toBeLessThan(horizon);
    const gaps = [];
    for (let i = 1; i < got.length; i++) gaps.push(got[i] - got[i - 1]);
    expect(gaps[gaps.length - 1], "the steps nearest the viewer are the widest apart")
      .toBeGreaterThan(gaps[0]);

    /* AND THE PICTURE DRAWS IT THERE. Everything above is arithmetic against a
       document; this is the row where the document meets the canvas. The
       predicted top tread's row is measured off the render and required to be
       BRIGHTER than a row between two treads. Without the second half a
       renderer that filled the flight's whole rectangle would pass the first —
       and since this row the flight IS filled, which is why the comparison is
       of brightness between two rows of the same solid rather than of ink
       against void. */
    const ink = await page.evaluate(({ topY, gapY }) => {
      const A = window.HOLO_APP, fx = window.HOLO_FIXTURE;
      const vs = { location: "great_stair_hall", facing: "N" };
      const meta = A.metaFor(vs);
      const fl = meta.stairs[0];
      const c = document.createElement("canvas");
      c.width = 1536; c.height = 1024;
      window.HOLO.renderer.render(c, fx.world, fx.staging, A.library,
        { "great_stair_hall/N": { meta } }, vs, { backdrop_only: true });
      const d = c.getContext("2d").getImageData(0, 0, 1536, 1024).data;
      /* THE MEAN OF THE ROW, not a count of lit pixels. The flight is a SOLID
         now, so every row inside it is lit and a count cannot tell the row a
         nose is drawn on from the riser face below it — both came to 939. What
         distinguishes them is the nose LINE, stroked in the key tint over the
         flight's own tone, so the discriminating quantity is how bright the
         row is and not whether it is lit at all. */
      const rowInk = (y) => {
        let sum = 0, n = 0;
        const x0 = Math.max(0, Math.ceil(fl.x) + 2), x1 = Math.min(1536, Math.floor(fl.x + fl.w) - 2);
        for (let yy = Math.max(0, Math.round(y) - 1); yy <= Math.min(1023, Math.round(y) + 1); yy++) {
          for (let x = x0; x < x1; x++) {
            const i = (yy * 1536 + x) << 2;
            sum += d[i] + d[i + 1] + d[i + 2]; n++;
          }
        }
        return n ? sum / n : 0;
      };
      return { onTread: rowInk(topY), between: rowInk(gapY) };
    }, { topY: want[0], gapY: (want[0] + want[1]) / 2 });
    expect(ink.onTread, "the row the plan puts the top tread on carries ink")
      .toBeGreaterThan(90);
    expect(ink.onTread - ink.between,
      "and the row between two treads is darker, so the noses are drawn and not merely the body")
      .toBeGreaterThan(5);
  });

  /* NEVER VOID, AND NOT CONDITIONALLY. `drawThroughOpening` carries three
     silent `return false` paths that row 21 recorded as having no subject in
     either shipped world; the manor gives every one of them fifty-five
     chances. And one destination is an OPEN facing — the great hall's south
     door looks into the entrance court, which has `camera_far_m` and no
     `camera_wall_m` — a case the device had never been asked for. */
  test("through every doorway in the manor there is a room, including an open one", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto(navUrl());
    await page.waitForFunction(() => !!window.HOLO_APP);
    const res = await page.evaluate(({ w, h }) => {
      const A = window.HOLO_APP, fx = window.HOLO_FIXTURE;
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      const ctx = c.getContext("2d");
      const silent = [], voids = [];
      for (const loc of fx.world.locations) {
        for (const ex of loc.exits || []) {
          const vs = { location: loc.id, facing: ex.facing };
          const meta = A.metaFor(vs);
          const ap = window.HOLO.renderer.apertures(
            fx.world, fx.staging, A.library, meta, vs).find((a) => a.exit === ex.id);
          if (!ap) { silent.push(`${ex.id}: no aperture`); continue; }
          /* [Row 15] A THRESHOLD IS NOT SKIPPED, it is checked for the thing
             that IS true of it: it draws nothing of its own, so what must be
             in it is the ground the room beyond it stands on. Skipping it left
             the manor's own front door — 20.4 m of it — checked for nothing at
             all. A flight is skipped and says so: it is drawn by the grid and
             has no room behind it. */
          if (ap.kind === "stair") continue;
          if (ap.kind === "threshold") {
            const bd2 = {};
            for (const k of Object.keys(A.backdrops)) bd2[k] = { meta: A.backdrops[k].meta };
            bd2[`${loc.id}/${ex.facing}`] = { meta };
            window.HOLO.renderer.render(c, fx.world, fx.staging, A.library, bd2, vs, {});
            const dt = ctx.getImageData(0, 0, w, h).data;
            let lit = 0, tot = 0;
            const tx0 = Math.max(0, Math.ceil(ap.x)), tx1 = Math.min(w, Math.floor(ap.x + ap.w));
            /* THE BAND THE GROUND BEYOND MUST OCCUPY: from the horizon — which
               is where the far line of any open place lands — down to the
               mouth's own sill. The mouth's rectangle is taller than this now,
               because an `open_edge` has no lintel and the hole runs to the top
               of the frame; but what is above the horizon through a gap is the
               far building's face or the unpainted sky, and neither is this
               clause's business. What IS its business is that the GROUND of the
               place beyond is drawn where it must be. */
            const bandTop = Math.max(0, Math.ceil(meta.horizon_y * h));
            for (let y = bandTop; y < Math.min(h, Math.floor(ap.y + ap.h)); y++) {
              for (let x = tx0; x < tx1; x++) {
                const i = ((y * w + x) << 2);
                tot++;
                if (dt[i] + dt[i + 1] + dt[i + 2] > 90) lit++;
              }
            }
            /* A FRACTION, LIKE THE DOOR BRANCH BESIDE IT.
               This asked only that ONE pixel be lit. The manor's front way in
               answered with 1,068 of 65,148 — 1.6 %, a single hairline lying
               on the wall-floor line — and passed, which is a guard that
               cannot fail in the family row 18 exists to kill. What must be
               through a mouth is the GROUND of the place beyond it, which is
               a plane and not a line. */
            if (tot > 400 && lit / tot < 0.08) {
              voids.push(`${ex.id}: only ${(100 * lit / tot).toFixed(1)} % of its mouth is lit`);
            }
            continue;
          }
          if (ap.kind !== "door") continue;
          const bd = {};
          for (const k of Object.keys(A.backdrops)) bd[k] = { meta: A.backdrops[k].meta };
          bd[`${loc.id}/${ex.facing}`] = { meta };
          window.HOLO.renderer.render(c, fx.world, fx.staging, A.library, bd, vs, {});
          const d = ctx.getImageData(0, 0, w, h).data;
          let dark = 0, total = 0, ds = 0, ds2 = 0;
          const x0 = Math.max(0, Math.ceil(ap.x) + 6), x1 = Math.min(w, Math.floor(ap.x + ap.w) - 6);
          const y0 = Math.max(0, Math.ceil(ap.y) + 6), y1 = Math.min(h, Math.floor(ap.y + ap.h) - 6);
          for (let y = y0; y < y1; y++) {
            for (let x = x0; x < x1; x++) {
              const i = ((y * w + x) << 2);
              total++;
              const L = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
              if (L < 12) { dark++; ds += L; ds2 += L * L; }
            }
          }
          /* AN OPEN DESTINATION IS EXEMPT, and this is the exemption's own
             reason rather than a threshold moved to admit it. What shows
             through a door onto the entrance court is the court's own SOUTH
             view, and an open facing renders the ground to its far line and
             nothing above — no invented sky band, no eye line, no wall (row
             11). So the upper part of that opening is unestablished by design
             and blueprint §4b ruling (1) gives it a generated vista, which is
             row 4's. What IS asserted is that its GROUND is there: the room
             beyond a door is never a hole, and the half of the opening below
             the destination's far line must be lit. */
          const destMeta = (A.backdrops[`${ex.to}/${ex.arrive_facing}`] || {}).meta ||
            A.metaFor({ location: ex.to, facing: ex.arrive_facing });
          if (destMeta && destMeta.facing_type === "open") {
            let groundLit = 0, groundTotal = 0;
            for (let y = Math.max(y0, Math.floor((y0 + y1) / 2)); y < y1; y++) {
              for (let x = x0; x < x1; x++) {
                const i = ((y * w + x) << 2);
                groundTotal++;
                if (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2] >= 12) groundLit++;
              }
            }
            if (groundTotal > 200 && groundLit / groundTotal < 0.8) {
              voids.push(`${ex.id}: the open room beyond it shows no ground (${(100 * groundLit / groundTotal).toFixed(0)} % lit)`);
            }
            continue;
          }
          /* [Row 32] DARK AND VOID ARE NOT THE SAME THING, and this clause
             claims the second. A HOLE is the canvas the renderer never wrote
             to: one value, flat, with no structure in it at all. A dark room
             beyond a door is the grid's own low tones and it has structure —
             a floor, a wall, a junction between them.

             Darkness alone was the whole test, and it was already within one
             point of firing on a wall nobody had touched:
             `door_master_bedchamber_stair_landing` sat at 24.0 % against a
             25 % bound. When the manor sweep promoted `stair_landing/E` its
             measured door rectangle read 25.4 % — and the dark pixels behind
             it vary by 2.55 luminance levels, which is a room and not a hole.
             So the clause now asks both: a QUARTER of the opening dark AND
             that dark being ONE COLOUR. The bound on "one colour" is the
             channel's own quantisation — a region whose luminance varies by
             less than a single 8-bit level cannot be showing anything — so it
             is derived rather than chosen, and a real void (uniformly the
             clear colour) still trips it on the first pixel. */
          const darkSd = dark ? Math.sqrt(Math.max(0, ds2 / dark - (ds / dark) ** 2)) : 0;
          if (total > 400 && dark / total > 0.25 && darkSd < 1) {
            voids.push(`${ex.id}: ${(100 * dark / total).toFixed(0)} % of its opening is void — one flat colour, nothing drawn in it`);
          }
        }
      }
      /* The one destination that is an OPEN facing, named rather than hoped
         for: the great hall's south door onto the entrance court. */
      const openDest = (fx.world.locations.find((l) => l.id === "great_hall").exits || [])
        .find((e) => e.to === "entrance_court");
      const destMeta = A.metaFor({ location: "entrance_court", facing: openDest.facing });
      return { silent, voids, openDestExit: openDest.id,
        destIsOpen: destMeta.facing_type === "open" && destMeta.camera_wall_m == null };
    }, { w: W, h: H });
    expect(res.silent).toEqual([]);
    expect(res.voids).toEqual([]);
    expect(res.destIsOpen, "the great hall's south door does look into an open space").toBe(true);
  });
});

test.describe("reachability is a hand, not a graph", () => {
  /* `world.rooms_unreachable` is satisfied by connectivity while a phone
     player cannot hit a door. Measured at 390×844 over every exit of the
     manor: the doorway a viewer stands 15.30 m away from is 17 CSS px wide.
     Three things follow and none of them is a widened tolerance — the
     tolerance RING reaches an aperture now, the worst case is pinned here so
     it cannot get quietly worse, and the cause (an uncapped stand-back in the
     standpoint law) is Kabe's, with the distribution in the batch. */
  test.use({ viewport: PHONE });

  test("every exit is a target a finger can find, and the worst is measured", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto(navUrl());
    await page.waitForFunction(() => !!window.HOLO_APP);
    const r = await page.evaluate(() => {
      const A = window.HOLO_APP, fx = window.HOLO_FIXTURE;
      const box = document.getElementById("scene").getBoundingClientRect();
      const k = box.width / 1536;
      const sizes = [];
      for (const loc of fx.world.locations) {
        for (const ex of loc.exits || []) {
          const vs = { location: loc.id, facing: ex.facing };
          const ap = window.HOLO.renderer.apertures(
            fx.world, fx.staging, A.library, A.metaFor(vs), vs).find((a) => a.exit === ex.id);
          if (!ap) { sizes.push({ id: ex.id, w: 0, h: 0 }); continue; }
          /* WHAT IS ON THE SCREEN, not what the rectangle declares. Two of the
             manor's apertures run past the frame — `door_hall_buttery_pantry`
             declares 476 canvas px and shows 54 — so a bound on the declared
             width measures a target nobody can reach. Intersected with the
             canvas first. */
          const x0 = Math.max(0, ap.x), x1 = Math.min(1536, ap.x + ap.w);
          const y0 = Math.max(0, ap.y), y1 = Math.min(1024, ap.y + ap.h);
          sizes.push({ id: ex.id, w: Math.max(0, x1 - x0) * k, h: Math.max(0, y1 - y0) * k,
            /* [row 26] and the same intersection in CANVAS px beside it, with
               what the aperture DECLARED, because the row-26 bar is about how
               much of a way through the frame ate — a different question from
               how big a finger finds it. */
            onW: Math.max(0, x1 - x0), onH: Math.max(0, y1 - y0), decW: ap.w, decH: ap.h });
        }
      }
      return { k, sizes, docWidth: document.documentElement.scrollWidth,
        winWidth: document.documentElement.clientWidth };
    });
    const none = r.sizes.filter((s) => s.w === 0);
    expect(none, "every exit of the manor has an aperture on its own facing").toEqual([]);
    const minW = Math.min(...r.sizes.map((s) => s.w));
    const minSide = Math.min(...r.sizes.map((s) => Math.min(s.w, s.h)));
    const minArea = Math.min(...r.sizes.map((s) => s.w * s.h));
    /* ABSOLUTE, not derived from the corpus it measures: a bound phrased as a
       fraction of the current worst is true for every value of the worst. And
       the SMALLER SIDE is bounded as well as the width, because a target 271
       CSS px wide and 14 tall is a target a thumb misses in the other
       direction — the manor's own front door was exactly that. */
    expect(minW, "the narrowest way through the manor, in CSS px on a phone").toBeGreaterThan(12);
    expect(minSide, "and its smaller side").toBeGreaterThan(12);
    /* [ROW 26] AND THE FRAME HAS NOT EATEN ANY OF THEM. This is ADDED to the
       absolute floor above and does not replace it: the two bounds answer
       different questions, and the comment above is explicit that a bound
       phrased against the current corpus is worth nothing. A doorway is
       honestly small when you are standing 15.30 m from it — ten of these draw
       under 24 CSS px on this screen and every one of them is whole — and it is
       frame-eaten when the picture cut it off, which is what `op15` was: 476 px
       of doorway with 54 on screen, the player's only way out of the boot pair.
       So the bar is what the row states: at least `min(declared, the derived
       usable minimum)` of it on the frame, in canvas px, on both axes. */
    const eaten = r.sizes.filter((s) =>
      s.onW < Math.min(s.decW, MIN_USABLE_APERTURE_PX) - 1e-6 ||
      s.onH < Math.min(s.decH, MIN_USABLE_APERTURE_PX) - 1e-6)
      .map((s) => `${s.id} shows ${Math.round(s.onW)}×${Math.round(s.onH)} of ${Math.round(s.decW)}×${Math.round(s.decH)}`);
    expect(eaten, "ways through the manor that the frame has eaten").toEqual([]);
    expect(minArea, "and the smallest reachable area").toBeGreaterThan(500);
    /* AND THE PAGE DOES NOT GROW SIDEWAYS. An aperture that runs past the
       frame used to put its keyboard control at `left: 112%`, which widened
       the document and let one arrow key turn the room AND scroll the picture
       out from under it. */
    expect(r.docWidth, "the page is no wider than the window").toBeLessThanOrEqual(r.winWidth);
  });

  test("a near miss on the narrowest doorway lands on it, and bare wall still means nothing", async ({ page }) => {
    /* A REAL CLICK, at a real point, on a real phone-sized screen. The first
       version of this case asked `HOLO_APP.resolve` and never sent an event —
       and worse, never aimed OUTSIDE an aperture at all, so removing the ring
       entirely left the whole suite green. What the ring exists for is a
       finger's slop on a 17 CSS px doorway, and the only way to know it is
       there is to miss by a finger's width and still arrive.

       BOTH DIRECTIONS, because this ring has been wrong in both before: too
       little (it widened nothing for the key) and too much (a notebook
       answering clicks 85 px away on bare wall). */
    await page.goto(navUrl());
    await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
    /* Stand in the entrance court facing its west door — 17 CSS px wide here
       and the narrowest way through the manor. */
    const ok = await page.evaluate(() => {
      const A = window.HOLO_APP;
      for (const id of ["door_study_hall", "door_hall_buttery_pantry",
        "door_buttery_pantry_servants_hall", "door_servants_hall_back_stair",
        "door_back_stair_great_hall", "door_great_hall_entrance_court"]) {
        const vs = A.harness.viewstate;
        const ex = (A.harness.world.locations.find((l) => l.id === vs.location).exits || [])
          .find((e) => e.id === id);
        let g = 0;
        while (A.harness.viewstate.facing !== ex.facing && g++ < 4) {
          A.harness.dispatch({ type: "turn", dir: "right" });
        }
        A.harness.dispatch({ type: "go", exit: id });
      }
      let g = 0;
      while (A.harness.viewstate.facing !== "W" && g++ < 4) A.harness.dispatch({ type: "turn", dir: "right" });
      return A.harness.viewstate.location === "entrance_court" && A.harness.viewstate.facing === "W";
    });
    expect(ok, "standing in the entrance court, facing its west door").toBe(true);

    const geom = await page.evaluate(() => {
      const A = window.HOLO_APP;
      const vs = A.harness.viewstate;
      const ap = window.HOLO.renderer.apertures(
        A.harness.world, A.harness.staging, A.library, A.metaFor(vs), vs)
        .find((x) => x.exit === "door_entrance_court_dining_parlour");
      const box = document.getElementById("scene").getBoundingClientRect();
      return ap ? { x: ap.x, y: ap.y, w: ap.w, h: ap.h, k: box.width / 1536 } : null;
    });
    expect(geom, "there is a west door").toBeTruthy();
    expect(geom.w * geom.k, "and it is a narrow one on this screen").toBeLessThan(30);

    /* A finger's width past its jamb: outside the drawn rectangle, inside the
       margin. Two CSS px, converted to canvas px at this display scale. */
    const miss = { x: geom.x + geom.w + 2 / geom.k, y: geom.y + geom.h / 2 };
    await clickCanvasPoint(page, miss);
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => window.HOLO_APP.harness.viewstate.location),
      "a miss by a finger's width still walks you through").toBe("dining_parlour");

    /* And bare wall well clear of it still means nothing — measured as an
       intent count, because dead space dispatching nothing is the rule this
       ring must not break. */
    const before = await page.evaluate(() => window.HOLO_APP.harness.envelopes.length);
    await clickCanvasPoint(page, { x: geom.x + geom.w + 90 / geom.k, y: geom.y + geom.h / 2 });
    await clickCanvasPoint(page, { x: 768, y: 1000 });
    await page.waitForTimeout(200);
    const after = await page.evaluate(() => ({
      n: window.HOLO_APP.harness.envelopes.length,
      where: window.HOLO_APP.harness.viewstate.location
    }));
    expect(after.n, "bare wall and bare floor dispatch nothing at all").toBe(before);
    expect(after.where, "and nobody moved").toBe("dining_parlour");
  });

});

test.describe("leave a room and return, in a world where something changed", () => {
  /* THE INTENTION'S OWN SENTENCE, MEASURED WHERE IT CAN FAIL. In `nav-manor` —
     no entities, no relations, empty knowledge, a viewstate of exactly
     {location, facing} — a hash identity across a round trip cannot fail: it
     is §12.2's determinism restated, and it would be the sixth appearance of
     the family this row's own plan opens by naming. So the walk runs in a
     staged tree whose manor has ONE piece of state in it, and what is asserted
     is that the CHANGED state survives twenty rooms and two floors. */
  test.use({ viewport: POINTER_VIEWPORT });

  test("a door left open twenty rooms ago is still open, and its room is the same picture", async ({ page }) => {
    test.setTimeout(180_000);
    const dir = stageTree();
    try {
      const fx = join(dir, "fixtures", "nav-manor");
      /* THE MANOR WITH THE STUDY FURNISHED. The demo world's entities and
         their staging are merged into the manor's topology wholesale — not one
         invented entity, because the plan draws four object footprints and the
         validator binds each to a §6 record the moment the world names any
         entity at all. Merging is also the honest construction: this is the
         world the project is heading for, and it is where "leave a room and
         return" has a subject. */
      const world = JSON.parse(readFileSync(join(fx, "world.json"), "utf8"));
      const demoWorld = JSON.parse(readFileSync(
        join(repoRoot, "fixtures", "demo-study", "world.json"), "utf8"));
      world.entities = demoWorld.entities;
      world.relations = demoWorld.relations;
      world.knowledge = demoWorld.knowledge;
      for (const l of world.locations) {
        for (const e of l.exits || []) if (e.id === "door_study_hall" || e.id === "door_hall_study") e.via = "door1";
      }
      writeFileSync(join(fx, "world.json"), JSON.stringify(world, null, 2) + "\n");
      const staging = JSON.parse(readFileSync(
        join(repoRoot, "fixtures", "demo-study", "staging.json"), "utf8"));
      writeFileSync(join(fx, "staging.json"), JSON.stringify(staging, null, 2) + "\n");
      const narration = JSON.parse(readFileSync(join(fx, "narration.json"), "utf8"));
      const demo = JSON.parse(readFileSync(
        join(repoRoot, "fixtures", "demo-study", "narration.json"), "utf8")).lines;
      for (const k of Object.keys(demo)) if (!(k in narration.lines)) narration.lines[k] = demo[k];
      writeFileSync(join(fx, "narration.json"), JSON.stringify(narration, null, 2) + "\n");
      bake(dir, ["--fixture-dir", fx]);

      await page.goto(navUrl(dir));
      await page.waitForFunction(() => !!window.HOLO_APP);
      const out = await page.evaluate(async () => {
        const A = window.HOLO_APP;
        const D = (i) => A.harness.dispatch(i);
        const hash = async () => {
          const c = document.getElementById("scene");
          const b = await new Promise((r) => c.toBlob(r, "image/png"));
          const buf = await b.arrayBuffer();
          const d = await crypto.subtle.digest("SHA-256", buf);
          return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, "0")).join("");
        };
        D({ type: "turn", dir: "right" });          // study N -> E
        D({ type: "toggle", entity: "door1" });     // and it is open
        const before = await hash();
        const openedAt = A.harness.world.entities.find((e) => e.id === "door1").state;
        /* Twenty rooms, both floors, and home: out through the passage, round
           the service range, across the courts, up the great stair, along the
           gallery, down the back stair and back. */
        const route = ["door_study_hall", "door_hall_buttery_pantry", "door_buttery_pantry_servants_hall",
          "door_servants_hall_privy_garden", "door_privy_garden_garden_room", "door_garden_room_library",
          "door_library_great_stair_hall", "stair_great_stair_hall_stair_landing",
          "door_stair_landing_solar", "door_solar_muniment_room", "door_muniment_room_long_gallery",
          "door_long_gallery_back_stair_head", "stair_back_stair_head_back_stair",
          "door_back_stair_great_hall", "door_great_hall_entrance_court",
          "door_entrance_court_kitchen", "door_kitchen_hall", "door_hall_study"];
        const refused = [];
        for (const exit of route) {
          const vs = A.harness.viewstate;
          const ex = A.harness.world.locations.find((l) => l.id === vs.location)
            .exits.find((e) => e.id === exit);
          if (!ex) { refused.push(`${exit}: not an exit of ${vs.location}`); continue; }
          /* Turn to face it the way a player would, then walk. */
          let guard = 0;
          while (A.harness.viewstate.facing !== ex.facing && guard++ < 4) D({ type: "turn", dir: "right" });
          const env = D({ type: "go", exit });
          if (!env.events.length) refused.push(`${exit}: refused from ${JSON.stringify(vs)}`);
        }
        const home = A.harness.viewstate;
        while (A.harness.viewstate.facing !== "E") D({ type: "turn", dir: "right" });
        const after = await hash();
        return {
          refused, home, openedAt,
          stillOpen: A.harness.world.entities.find((e) => e.id === "door1").state,
          same: before === after,
          rooms: new Set(A.harness.envelopes.filter((e) => e.intent.type === "go")
            .map((e) => e.events[0] && e.events[0].location).filter(Boolean)).size
        };
      });
      expect(out.refused, "the route walks").toEqual([]);
      expect(out.rooms, "rooms entered on the way round").toBeGreaterThanOrEqual(17);
      expect(out.home, "and it ends where it started").toEqual({ location: "study", facing: "W" });
      expect(out.openedAt).toBe("open");
      expect(out.stillOpen, "the door is exactly as it was left").toBe("open");
      expect(out.same, "and so is the picture of the room it stands in").toBe(true);
    } finally {
      removeTree(dir);
    }
  });
});

test.describe("§12.8's switches, on the facings this row invents", () => {
  test.use({ viewport: POINTER_VIEWPORT });

  /* HOW MANY SWITCHES HAVE A SUBJECT ON AN EMPTY FACING, counted honestly.
     `tint`, `shadows`, `parts` and `part_t` are per-entity, and the painted
     navigation world stages nothing anywhere — so on a stair, a threshold or
     an open facing they produce an identical picture and a case that claimed
     six would be reporting four vacuous passes. Two discriminate here
     (`no_backdrop` and `backdrop_only`), and the other four have their subject
     in the furnished world, where §12.8 already runs them. Two and four, not
     six. */
  test("the backdrop switches discriminate on a stair, a threshold and an open facing", async ({ page }) => {
    await page.goto(navUrl());
    await page.waitForFunction(() => !!window.HOLO_APP);
    const r = await page.evaluate(async ({ w, h }) => {
      const A = window.HOLO_APP, fx = window.HOLO_FIXTURE;
      const hash = async (c) => {
        const b = await new Promise((res) => c.toBlob(res, "image/png"));
        const d = await crypto.subtle.digest("SHA-256", await b.arrayBuffer());
        return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, "0")).join("");
      };
      const out = {};
      for (const [name, vs] of [
        ["stair", { location: "great_stair_hall", facing: "N" }],
        ["threshold", { location: "entrance_approach", facing: "N" }],
        ["open", { location: "entrance_court", facing: "S" }]
      ]) {
        const meta = A.metaFor(vs);
        const bd = { [`${vs.location}/${vs.facing}`]: { meta } };
        const shot = async (opts) => {
          const c = document.createElement("canvas");
          c.width = w; c.height = h;
          window.HOLO.renderer.render(c, fx.world, fx.staging, A.library, bd, vs, opts);
          return await hash(c);
        };
        const plain = await shot({});
        out[name] = {
          plain,
          backdrop_only: await shot({ backdrop_only: true }),
          no_backdrop: await shot({ no_backdrop: true }),
          again: await shot({})
        };
      }
      return out;
    }, { w: W, h: H });
    for (const name of ["stair", "threshold", "open"]) {
      const s = r[name];
      /* §12.2 clause 1 on the same three facings, for nothing: equal inputs
         paint equal pixels, twice in one page. */
      expect(s.again, `${name}: the same inputs paint the same pixels`).toBe(s.plain);
      /* An empty facing IS its backdrop, so `backdrop_only` cannot differ from
         a full render there — and saying so is the point of counting. */
      expect(s.backdrop_only, `${name}: nothing is staged, so the backdrop IS the picture`).toBe(s.plain);
      expect(s.no_backdrop, `${name}: without the backdrop there is nothing left`).not.toBe(s.plain);
    }
  });
});

test.describe("§12.2 over a manor route, in both engines", () => {
  test.use({ viewport: POINTER_VIEWPORT });

  /* The route both clauses run on: out of the study, round the service range,
     up the great stair, along the gallery, down the back stair and home, then
     in and out of the kitchen by the cross passage — the ROUTE array's own
     length of passages, across both floors. Turns included, because a turn is a
     picture too and clause 1 is about the SEQUENCE of them. */
  const ROUTE = ["door_study_hall", "door_hall_buttery_pantry",
    "door_buttery_pantry_servants_hall", "door_servants_hall_privy_garden",
    "door_privy_garden_garden_room", "door_garden_room_library",
    "door_library_great_stair_hall", "stair_great_stair_hall_stair_landing",
    "door_stair_landing_solar", "door_solar_muniment_room",
    "door_muniment_room_long_gallery", "door_long_gallery_back_stair_head",
    "stair_back_stair_head_back_stair", "door_back_stair_great_hall",
    "door_great_hall_entrance_court", "way_entrance_court_entrance_approach",
    "way_entrance_approach_entrance_court", "door_entrance_court_kitchen",
    /* [row 26] and out of the kitchen by the passage door, which is the way
       row 26 gave back — so the 56th exit is hashed like the other 55 rather
       than being the one nobody replays. The count is not written in either
       comment any more: it was twenty in one and nineteen in the other, over
       an array of twenty, which is what a number restated twice does. */
    "door_kitchen_hall", "door_hall_kitchen"];

  async function hashes(page) {
    await page.goto(navUrl());
    await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
    return await page.evaluate(async (route) => {
      const A = window.HOLO_APP;
      const c = document.getElementById("scene");
      const hash = async () => {
        const b = await new Promise((r) => c.toBlob(r, "image/png"));
        const d = await crypto.subtle.digest("SHA-256", await b.arrayBuffer());
        return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, "0")).join("");
      };
      const out = [await hash()];
      const refused = [];
      for (const id of route) {
        const vs = A.harness.viewstate;
        const ex = (A.harness.world.locations.find((l) => l.id === vs.location).exits || [])
          .find((e) => e.id === id);
        if (!ex) { refused.push(`${id}: not an exit of ${vs.location}`); continue; }
        let g = 0;
        while (A.harness.viewstate.facing !== ex.facing && g++ < 4) {
          A.harness.dispatch({ type: "turn", dir: "right" });
          out.push(await hash());
        }
        if (!A.harness.dispatch({ type: "go", exit: id }).events.length) {
          refused.push(`${id}: refused from ${JSON.stringify(vs)}`);
        }
        out.push(await hash());
      }
      return { out, refused, end: A.harness.viewstate };
    }, ROUTE);
  }

  test("clause 1: two fresh loads of the same route paint the identical sequence", async ({ page }) => {
    test.setTimeout(240_000);
    const a = await hashes(page);
    expect(a.refused, "the route walks").toEqual([]);
    const b = await hashes(page);
    expect(b.end, "and ends in the same room both times").toEqual(a.end);
    expect(a.out.length, "a picture per turn and per passage").toBeGreaterThan(ROUTE.length);
    /* Not a stored golden — a within-run identity, which is all §12.2's letter
       asks and all a `file://` page with no network can honestly hold. */
    expect(b.out, "equal inputs paint equal pixels, across two cold loads").toEqual(a.out);
    /* And the pictures are not all the same picture, which is the thing an
       identity check cannot notice on its own: a renderer that painted one
       frame forever would pass every clause above. */
    expect(new Set(a.out).size, "and the manor is not one room repeated")
      .toBeGreaterThan(ROUTE.length);
  });
});

/* WHAT THE FOURTH EXAMINATION FOUND, WRITTEN FROM THE DEFECT.
 *
 * Every case below was reinstated-and-confirmed-red the other way round: the
 * defect was put BACK into the shipped code, and the case had to fail. That
 * is the only order that answers the fault these four share — a guard written
 * from its own fix, measured where its own fix is what runs. */
test.describe("the stair, the chrome and the width, measured where they broke", () => {
  /* THE FLIGHT IS ON EVERY FACING IT CAN HONESTLY BE ON, PER FACING.
   *
   * A total cannot substitute: the defect this replaces emitted a flight on
   * one facing of each stair room and a sum over the manor still looked
   * plausible. The census is per facing and pinned whole, so restricting
   * `stairsForFacing` to the travel facing — which is the exact line a recheck
   * used to reinstate the original finding with 1328 tests passing — moves
   * eight of these sixteen entries and cannot pass. */
  test("a flight is drawn from every side of it you can honestly see, facing by facing", () => {
    /* Derived by the same call the bake makes, which `fixtures.spec`'s
       staleness case pins byte-for-byte to what ships. */
    const metas = {};
    const census = {};
    for (const room of ["great_stair_hall", "stair_landing", "back_stair", "back_stair_head"]) {
      for (const f of FACINGS) {
        const m = deriveMeta(PLAN, room, f);
        metas[`${room}/${f}`] = m;
        census[`${room}/${f}`] = m && m.stairs ? m.stairs.length : 0;
      }
    }
    /* THE FOUR ZEROES ARE THE FOUR STANDPOINTS THE PLAN PUTS INSIDE A FLIGHT.
       On those the run lies at and behind the eye and the only part in front
       is the tread underfoot, nearer than a hand's breadth and below the
       frame — so the honest picture is no flight, and the plan warning now
       says so in those words instead of claiming a drawing that is not
       there. Every other facing of every stair room carries its flight. */
    expect(census).toEqual({
      "great_stair_hall/N": 1, "great_stair_hall/E": 0,
      "great_stair_hall/S": 1, "great_stair_hall/W": 1,
      "stair_landing/N": 1, "stair_landing/E": 0,
      "stair_landing/S": 1, "stair_landing/W": 1,
      "back_stair/N": 0, "back_stair/E": 1,
      "back_stair/S": 1, "back_stair/W": 1,
      "back_stair_head/N": 0, "back_stair_head/E": 1,
      "back_stair_head/S": 1, "back_stair_head/W": 1
    });
    /* AND EVERY ONE OF THEM HAS A BODY. `mass_poly` was gated on two
       independently frame-culled lists having equal length, which emptied it
       on eight of the twelve — including all four facings a player climbs
       from, where the treads then floated with nothing joining them to their
       own footprint. */
    const bodiless = [];
    for (const [k, n] of Object.entries(census)) {
      if (!n) continue;
      const s = metas[k].stairs[0];
      if (!s.mass_poly || !s.mass_poly.length) bodiless.push(k);
    }
    expect(bodiless, "a flight with no solid is two rails and a floor grid through them")
      .toEqual([]);
  });

  /* THE FLIGHT IS A SOLID, AND IT IS SOLID AGAINST THE PLANE BEHIND IT.
   *
   * Measured on `great_stair_hall/W` — the flight seen ACROSS its own run,
   * standing against a wall, which is the facing where the old drawing
   * collapsed to a single hairline covering 0.33 % of the frame at five
   * levels of contrast. Contrast and coverage both, because either alone
   * passed the old drawing: it had a tone (invisible) and it had ink (a
   * line). */
  test("a flight seen across its run is a body, not a line", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto(navUrl());
    await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
    await standAt(page, "great_stair_hall", "W");
    const m = await page.evaluate(() => {
      const A = window.HOLO_APP;
      const cv = document.getElementById("scene");
      const ctx = cv.getContext("2d");
      const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
      const vs = A.harness.viewstate;
      const fl = A.metaFor(vs).stairs[0];
      const inside = (poly, x, y) => {
        let c = false;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
          const [xi, yi] = poly[i], [xj, yj] = poly[j];
          if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
        }
        return c;
      };
      const bodies = (fl.mass_poly || []).concat(fl.treads_poly || []);
      let n = 0, sum = 0, rn = 0, rsum = 0;
      for (let y = 0; y < cv.height; y += 2) {
        for (let x = 0; x < cv.width; x += 2) {
          let hit = false;
          for (const b of bodies) if (b.length > 2 && inside(b, x, y)) { hit = true; break; }
          const i = (y * cv.width + x) * 4;
          const lum = d[i] + d[i + 1] + d[i + 2];
          if (hit) { n++; sum += lum; } else { rn++; rsum += lum; }
        }
      }
      return { pct: (n * 4 * 100) / (cv.width * cv.height),
        body: sum / Math.max(1, n), frame: rsum / Math.max(1, rn) };
    });
    /* A seventeen-tread flight 4.4 m dead ahead, 4.8 m long and 2.8 m tall,
       occupies a real part of the view. The old drawing gave 0.33 %. */
    expect(m.pct, "the share of the frame the flight's own body covers")
      .toBeGreaterThan(8);
    /* AND IT READS AGAINST WHAT IS BEHIND IT. Summed over r+g+b, so a bound
       of 60 is twenty levels a channel — the magnitude bar §12.8 already sets
       for a thing being visibly there. The old drawing gave about fifteen,
       five levels a channel, through which the wall's own grid was legible. */
    expect(m.body - m.frame, "how far the flight's body stands off the plane behind it")
      .toBeGreaterThan(60);
  });

  /* A CHEVRON DOES NOT EAT A DOORWAY.
   *
   * `hall/N`'s doorway runs off the frame and its visible sliver sits under
   * the right chevron at every viewport. A real click at the exact middle of
   * the only part of it a person can see turned the viewer east instead of
   * walking them through — the picture showing a way and the click meaning
   * something else. Both viewports, because the phone is where the chrome
   * takes the largest share of a small target. */
  for (const vp of [{ name: "desktop", size: POINTER_VIEWPORT }, { name: "a phone", size: PHONE }]) {
    test(`a click in the middle of a visible doorway walks through it, on ${vp.name}`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.setViewportSize(vp.size);
      await page.goto(navUrl());
      await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
      await standAt(page, "hall", "N");
      const ways = await waysOnScreen(page);
      const way = ways.find((w) => w.exit === "door_hall_buttery_pantry");
      expect(way && way.visible, "the cross passage's north doorway is on the frame").toBe(true);
      /* Named, so the case says what it is about: the chrome IS over it, and
         the point of the fix is that being over it is no longer being in the
         way. If a later layout moves the chevron off this doorway the case
         still holds — it asserts the walk, not the eclipse. */
      const over = await page.evaluate(({ x, y }) => {
        const el = document.elementFromPoint(x, y);
        return el ? (el.id || el.tagName) : "none";
      }, { x: way.cx, y: way.cy });
      const before = await page.evaluate(() => window.HOLO_APP.harness.viewstate.location);
      await page.mouse.click(way.cx, way.cy);
      await page.waitForTimeout(500);
      const after = await page.evaluate(() => window.HOLO_APP.harness.viewstate.location);
      expect({ over, before, after },
        "a click on a doorway a person can see is a walk through it")
        .toEqual({ over, before: "hall", after: "buttery_pantry" });
    });
  }

  /* THE PAGE IS NO WIDER THAN THE WINDOW *ON THE FACING THAT MADE IT WIDER*.
   *
   * The check this replaces read `scrollWidth` inside an evaluate that never
   * navigated: it stood on the boot facing, where no aperture runs off the
   * frame, and so could not see the defect on any value of the code. Removing
   * the clamp entirely left it green. `hall/N` is the one facing in the manor
   * whose aperture rect exceeds the canvas, so that is where it is read. */
  test("the page does not grow sideways where an aperture runs off the frame", async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize(PHONE);
    await page.goto(navUrl());
    await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
    await standAt(page, "hall", "N");
    const r = await page.evaluate(() => {
      const lefts = [...document.querySelectorAll("#entity-controls [style*='left']")]
        .map((b) => parseFloat(b.style.left));
      return { doc: document.documentElement.scrollWidth,
        win: document.documentElement.clientWidth,
        maxLeft: lefts.length ? Math.max(...lefts) : 0,
        controls: lefts.length };
    });
    expect(r.controls, "hall/N carries the control whose position was the fault")
      .toBeGreaterThan(0);
    expect(r.maxLeft, "no control is placed outside the stage").toBeLessThanOrEqual(100);
    expect(r.doc, "the page is no wider than the window, standing here")
      .toBeLessThanOrEqual(r.win);
    /* AND THE ARROW KEY IS CONSUMED. Nothing asserted this half at all: with
       the document no longer over-wide there is nothing left to scroll, so a
       missing `preventDefault` is invisible to a scroll measurement and has to
       be asked of the event itself. */
    const prevented = await page.evaluate(() => new Promise((res) => {
      window.addEventListener("keydown", function h(e) {
        if (e.key !== "ArrowRight") return;
        window.removeEventListener("keydown", h, true);
        res(e.defaultPrevented);
      }, false);
      document.dispatchEvent(new KeyboardEvent("keydown",
        { key: "ArrowRight", bubbles: true, cancelable: true }));
    }));
    expect(prevented, "an arrow key that turns the room does not also scroll the page")
      .toBe(true);
  });
});
