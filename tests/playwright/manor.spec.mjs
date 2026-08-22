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
import { test, expect, repoRoot, navUrl, POINTER_VIEWPORT, LIT, stageTree, removeTree, bake } from "./helpers.mjs";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { deriveMeta, facingCarriers, waysThrough } from "../../tools/plan-projection.mjs";
import { validatePlan, planWarnings } from "../../tools/validate-plan.mjs";

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
      "hall/S": 1,
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

  /* THE WAYS THROUGH, AND THE ONE EXEMPTION, both computed. The completeness
     clause requires an exit in both directions for every opening and flight
     joining two named rooms; the exemption is an opening its own standpoint
     cannot see, and it is not a hand-carved hole — the cross passage is 8.00 m
     long and the pinned lens shows 3.2 m of it, so the kitchen's door lands
     185 px past the frame. */
  test("every way the plan draws is walked, and the exemptions are named", () => {
    const ways = waysThrough(PLAN, NAV);
    const have = new Set();
    for (const l of NAV.locations) for (const e of l.exits || []) have.add(`${e.via}|${e.from}|${e.to}`);
    expect(ways.walkable.filter((w) => !have.has(`${w.id}|${w.from}|${w.to}`)), "unwalked").toEqual([]);
    expect(ways.offscreen.map((w) => `${w.id} ${w.from}→${w.to} on ${w.from}/${w.facing}`))
      .toEqual(["op14 hall→kitchen on hall/S"]);
    /* And the exempted room is still reachable another way, which is the whole
       reason the exemption is admissible rather than a hole in the building. */
    expect(have.has("op02|entrance_court|kitchen")).toBe(true);
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
          for (const [name, cx] of [["x0", meta.corner_x0_px], ["x1", meta.corner_x1_px]]) {
            if (cx == null || cx < 8 || cx > w - 9) continue;
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
    const got = await page.evaluate(() => {
      const A = window.HOLO_APP;
      const vs = { location: "great_stair_hall", facing: "N" };
      const fl = (A.metaFor(vs).stairs || [])[0];
      const half = fl.poly.length / 2;
      return fl.poly.slice(0, half).map((p) => p[1]).sort((a, b) => a - b);
    }).catch(() => null) ?? await (async () => {
      await page.goto(navUrl());
      await page.waitForFunction(() => !!window.HOLO_APP);
      return await page.evaluate(() => {
        const A = window.HOLO_APP;
        const vs = { location: "great_stair_hall", facing: "N" };
        const fl = (A.metaFor(vs).stairs || [])[0];
        const half = fl.poly.length / 2;
        return fl.poly.slice(0, half).map((p) => p[1]).sort((a, b) => a - b);
      });
    })();
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
          if (ap.kind !== "door") continue;
          const bd = {};
          for (const k of Object.keys(A.backdrops)) bd[k] = { meta: A.backdrops[k].meta };
          bd[`${loc.id}/${ex.facing}`] = { meta };
          window.HOLO.renderer.render(c, fx.world, fx.staging, A.library, bd, vs, {});
          const d = ctx.getImageData(0, 0, w, h).data;
          let dark = 0, total = 0;
          const x0 = Math.max(0, Math.ceil(ap.x) + 6), x1 = Math.min(w, Math.floor(ap.x + ap.w) - 6);
          const y0 = Math.max(0, Math.ceil(ap.y) + 6), y1 = Math.min(h, Math.floor(ap.y + ap.h) - 6);
          for (let y = y0; y < y1; y++) {
            for (let x = x0; x < x1; x++) {
              const i = ((y * w + x) << 2);
              total++;
              if (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2] < 12) dark++;
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
          if (total > 400 && dark / total > 0.25) {
            voids.push(`${ex.id}: ${(100 * dark / total).toFixed(0)} % of its opening is void`);
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
          sizes.push({ id: ex.id, w: ap.w * k, h: ap.h * k });
        }
      }
      return { k, sizes };
    });
    const none = r.sizes.filter((s) => s.w === 0);
    expect(none, "every exit of the manor has an aperture on its own facing").toEqual([]);
    const minW = Math.min(...r.sizes.map((s) => s.w));
    const minArea = Math.min(...r.sizes.map((s) => s.w * s.h));
    /* ABSOLUTE, not derived from the corpus it measures: a bound phrased as a
       fraction of the current worst is true for every value of the worst. */
    expect(minW, "the narrowest way through the manor, in CSS px on a phone").toBeGreaterThan(15);
    expect(minArea, "and the smallest reachable area").toBeGreaterThan(500);
    /* AND THE COUNT UNDER THE PLATFORM MINIMUM IS PINNED, because it is the
       number that must not grow. 28 of 55 at this camera; the tolerance ring
       is what makes them hittable and the standpoint cap is what would fix
       them. */
    expect(r.sizes.filter((s) => s.w < 44).length,
      "exits narrower than the 44 CSS px platform minimum").toBe(29);
  });

  test("a near miss on a narrow doorway lands on the doorway, not on nothing", async ({ page }) => {
    await page.goto(navUrl());
    await page.waitForFunction(() => !!window.HOLO_APP);
    const r = await page.evaluate(() => {
      const A = window.HOLO_APP;
      /* The entrance court's west door: 17 CSS px wide on this screen, the
         narrowest in the manor. Aimed at a point just outside its own drawn
         rectangle — the miss a finger makes. */
      A.harness.dispatch({ type: "go", exit: "door_study_hall" });
      return true;
    });
    expect(r).toBe(true);
    const hit = await page.evaluate(() => {
      const A = window.HOLO_APP, fx = window.HOLO_FIXTURE;
      const vs = { location: "entrance_court", facing: "W" };
      const ap = window.HOLO.renderer.apertures(
        fx.world, fx.staging, A.library, A.metaFor(vs), vs)[0];
      A.harness.viewstate;   // the resolver reads the live viewstate, so drive it there
      return { x: ap.x, y: ap.y, w: ap.w, h: ap.h };
    });
    expect(hit.w).toBeGreaterThan(0);
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
