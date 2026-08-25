/* The flight language — the emitter learns to ask for a staircase.
 *
 * WHAT WENT WRONG. `promote-backdrop.mjs` refuses a promotion whose room draws
 * a flight the painting has none of (the row-32 clause,
 * `stair.painted_flight_lost`). Six manor walls snapped geometrically clean and
 * were refused by it — and every one of them had been painted from a prompt in
 * which the word `stair` does not occur. `plan.stairs` reached the renderer, the
 * fixture validator and the refusal; it never reached the ask. That is
 * production law clause 6 read backwards: a gate that knows something the
 * generation method does not.
 *
 * The four claims this file guards, each where the defect would live:
 *
 *   1. THE ASK NAMES THE FLIGHT — on every facing whose plan draws one, and on
 *      no facing whose plan does not. Asserted on the emitted TEXT, because the
 *      text is what a generator reads.
 *   2. THE BOX IS THE PROJECTION'S OWN RECT, recomputed here from
 *      `stairsForFacing` rather than by calling the stamping function, so the
 *      tool cannot agree with itself; and the label pass on a stair facing
 *      draws only inside the rects the sidecar declares.
 *   3. THE CLIMB IS TRUE OF THE PICTURE. `flightsForFacing` derives which way a
 *      flight rises from the PLAN — the run axis against the facing's normal,
 *      and depth from the wall line. This file checks that answer against
 *      independent PIXEL evidence: on a flight climbing away, the steps further
 *      up project narrower, and on one climbing toward you they project wider.
 *   4. THE RE-ASK IS EARNED AND ONCE-ONLY. The content-gap grant proves the gap
 *      by composing the prompt the emitter writes now and diffing it against
 *      the prompt actually sent; it refuses a wall whose ask already said the
 *      thing, and refuses a wall it has already granted.
 */
import { test, expect } from "@playwright/test";
import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { repoRoot, navUrl } from "./helpers.mjs";
import {
  manorPrompt, scaffoldRects, flightRects, chairRail, PAGE_RENDER, GLYPH_TABLE,
  assertLabelChars, LEGEND_TOP_Y, CLIMB_STAMP
} from "../../tools/make-scaffold.mjs";
import { deriveMeta, stairsForFacing, flightsForFacing, stairPlanFacts }
  from "../../tools/plan-projection.mjs";
import { flightLines, askNamesAFlight } from "../../tools/frame-language.mjs";
import { paintedFlightReading } from "../../tools/flight-evidence.mjs";
import {
  REASONS, GRANTS_KEY, eligible, grant, spentPromptPath, DEFAULT_OUT
} from "../../tools/grant-content-gap.mjs";

const PLAN = JSON.parse(readFileSync(join(repoRoot, "fixtures", "demo-study", "plan.json"), "utf8"));
const LINT = join(repoRoot, "design", "plan-draft", "measured", "prompt_lint.py");
const STATE = join(DEFAULT_OUT, "run-state.json");
const CANVAS_W = 1536, CANVAS_H = 1024;

/** Every facing in the plan, once. */
function everyFacing() {
  const out = [];
  for (const room of PLAN.rooms) {
    for (const f of Object.keys(room.facings || {})) out.push([room.id, f]);
  }
  return out;
}

/** The facings the plan draws a flight in, decided by the projection the
 *  row-32 refusal itself reads — never by a list typed here. */
function stairFacings() {
  return everyFacing().filter(([loc, f]) =>
    stairsForFacing(PLAN, loc, f, deriveMeta(PLAN, loc, f)).length > 0);
}

function python(args) {
  try {
    return execFileSync("python3", args, { cwd: repoRoot, encoding: "utf8", stdio: "pipe" });
  } catch (e) {
    throw new Error(`python3 ${args.join(" ")} failed:\n${e.stdout || ""}${e.stderr || ""}`);
  }
}

/* ------------------------------------------------------------------ 1 */

test.describe("the ask names the flight", () => {
  test("every facing whose plan draws a flight has one in its prompt", () => {
    const stairs = stairFacings();
    /* The corpus this is about: four rooms, twelve views. If the plan ever
       stops drawing a flight anywhere, this file is guarding nothing and says
       so rather than passing vacuously. */
    expect(stairs.length, "the plan draws no flight in any view").toBeGreaterThan(0);
    for (const [loc, f] of stairs) {
      const key = `${loc}/${f}`;
      const meta = deriveMeta(PLAN, loc, f);
      const { rects } = scaffoldRects(PLAN, loc, f, meta);
      const text = manorPrompt(PLAN, key, meta, rects);
      const s = flightsForFacing(PLAN, loc, f, meta)[0];
      expect(text, `${key}'s prompt never opens a Stairs paragraph`).toMatch(/^Stairs:/m);
      expect(text, `${key}'s prompt never states the flight's tread count`)
        .toContain(`a straight stair of ${s.treads} steps`);
      expect(text, `${key}'s prompt never states the flight's width`)
        .toContain(`${s.width_m.toFixed(2)} m wide`);
      expect(text, `${key}'s prompt never says where in the frame the flight stands`)
        .toContain(`fills columns ${Math.round(s.x)} to ${Math.round(s.x + s.w)}`);
      /* THE STANDING CONSTRAINT. A way through the building painted with a lit
         space behind it is unmeasurable by the promotion instrument and fights
         the through-view the renderer composites into it — the same rule the
         door sentence has carried since row 27, said in the flight's terms. */
      expect(text, `${key}'s prompt never rules the space beyond the flight unlit`)
        .toMatch(/The space the flight (climbs|drops) into[^\n]*deep unlit shadow/);
      /* AND THE SPACE OVER A RISING FLIGHT. The renderer cuts the surface
         overhead to the flight's own footprint lifted a storey; a painting that
         closes that hole paints a staircase into a low box. */
      if (s.direction === "up" && s.well_poly.length) {
        expect(text, `${key} climbs through the surface overhead and the prompt never says so`)
          .toContain("The surface overhead is open where the flight climbs through it");
      }
    }
  });

  test("a facing the plan draws no flight in is asked for none", () => {
    const stairs = new Set(stairFacings().map(([l, f]) => `${l}/${f}`));
    let checked = 0;
    for (const [loc, f] of everyFacing()) {
      if (stairs.has(`${loc}/${f}`)) continue;
      const meta = deriveMeta(PLAN, loc, f);
      const { rects } = scaffoldRects(PLAN, loc, f, meta);
      const text = manorPrompt(PLAN, `${loc}/${f}`, meta, rects);
      expect(text, `${loc}/${f} has no flight in view and its prompt asks for one`)
        .not.toMatch(/^Stairs:/m);
      expect(scaffoldRects(PLAN, loc, f, meta).flights,
        `${loc}/${f} has no flight in view and its scaffold stamps one`).toEqual([]);
      checked++;
    }
    expect(checked).toBeGreaterThan(60);
  });

  /* [ROW 39] THE HANDSHAKE. `tools/promote-backdrop.mjs` attaches a flight to a
   * promoted meta only from a candidate whose spent prompt named one, and it
   * asks that question through `askNamesAFlight` — which lives beside the
   * sentence `flightLines` composes precisely so the two cannot drift. The
   * drift would be silent and total: a predicate that no longer matches the
   * emitter's own words refuses every flight wall in the manor, with the
   * emitter, the scaffold and the plan all still agreeing with each other. So
   * the emitter's own output is put back through the reader here, exactly as
   * `room-voices.spec` pins `INTERIOR_FABRIC` against the voice that writes
   * the words it hunts. */
  test("the promotion's reader of a spent ask matches the emitter's own flight sentence", () => {
    const stairs = stairFacings();
    expect(stairs.length, "the plan draws no flight in any view").toBeGreaterThan(0);
    for (const [loc, f] of stairs) {
      const meta = deriveMeta(PLAN, loc, f);
      const { rects } = scaffoldRects(PLAN, loc, f, meta);
      expect(askNamesAFlight(manorPrompt(PLAN, `${loc}/${f}`, meta, rects)),
        `${loc}/${f} is asked for a flight and the promotion cannot see that it was`)
        .toBe(true);
    }
    /* And it is not a predicate that says yes to everything: a facing with no
       flight in view, and a prompt that merely mentions the word. */
    const [nl, nf] = everyFacing().find(([l, x]) =>
      !stairs.some(([a, b]) => a === l && b === x));
    const bare = deriveMeta(PLAN, nl, nf);
    expect(askNamesAFlight(manorPrompt(PLAN, `${nl}/${nf}`, bare,
      scaffoldRects(PLAN, nl, nf, bare).rects)),
      `${nl}/${nf} draws no flight and the promotion reads its ask as naming one`).toBe(false);
    expect(askNamesAFlight("The back stair room is panelled in oak."),
      "the room's own NAME is not an ask for a staircase in the view").toBe(false);
    expect(askNamesAFlight(null), "and an ask that is not there names nothing").toBe(false);
  });

  test("a flight with no tread in the frame is not asked for as steps", () => {
    /* Two of the manor's views look across a stairwell whose every tread is
       below the picture. Telling a painter to draw steps there asks for a
       staircase the geometry does not put in the frame, so the paragraph says
       what IS in it — the opening in the floor — and nothing else. */
    const blind = stairFacings().filter(([l, f]) =>
      flightsForFacing(PLAN, l, f, deriveMeta(PLAN, l, f)).some((s) => s.treads_in_view === 0));
    expect(blind.length, "no facing in this plan hides every tread — the branch is unexercised")
      .toBeGreaterThan(0);
    for (const [loc, f] of blind) {
      const meta = deriveMeta(PLAN, loc, f);
      const { rects } = scaffoldRects(PLAN, loc, f, meta);
      const text = manorPrompt(PLAN, `${loc}/${f}`, meta, rects);
      expect(text, `${loc}/${f}: no tread is in frame and the prompt describes steps anyway`)
        .toContain("None of its steps are in the picture");
      expect(text).not.toMatch(/of its steps are in the picture\./);
    }
  });

  test("the flight paragraph is a derivation, never a per-wall paragraph", () => {
    /* Production law clause 6's acceptance test, mechanically: hand the composer
       a flight whose every fact differs and the sentence must follow it. If any
       clause were typed for one wall this would print the other wall's numbers. */
    const mk = (over) => flightLines({
      flights: [{
        id: "f", direction: "up", treads: 9, width_m: 2.4, rise_m: 3.1,
        x: 100, y: 200, w: 300, h: 400, treads_in_view: 5, climb: "left",
        runs_off: [], well_poly: [[0, 0], [1, 0], [1, 1]], ...over
      }],
      voice: { outdoor: false }, surface: "wall", room_name: "test"
    }).join("\n");
    const a = mk({});
    expect(a).toContain("a straight stair of 9 steps, 2.40 m wide");
    expect(a).toContain("carrying a person 3.10 m up to the storey above");
    expect(a).toContain("5 of its steps are in the picture");
    expect(a).toContain("fills columns 100 to 400");
    expect(a).toContain("and rows 200 to 600");
    expect(a).toContain("climbing toward the left of the picture");
    const b = mk({ treads: 21, width_m: 0.85, rise_m: 2.2, direction: "down",
      climb: "away", x: 7, y: 8, w: 9, h: 10, well_poly: [] });
    expect(b).toContain("a straight stair of 21 steps, 0.85 m wide");
    expect(b).toContain("dropping 2.20 m to the storey below");
    expect(b).toContain("fills columns 7 to 16");
    expect(b).toContain("climbing away from you into the picture");
    expect(b).not.toContain("The surface overhead is open");
    expect(b).toMatch(/The space the flight drops into[^\n]*deep unlit shadow/);
    /* Every climb the projection can produce has words, and they are distinct.
       A missing entry would throw rather than print `undefined` at a painter. */
    const said = new Set();
    for (const climb of ["left", "right", "away", "toward"]) {
      const line = mk({ climb });
      expect(line).not.toContain("undefined");
      said.add(line);
    }
    expect(said.size, "two climbs produce the same sentence").toBe(4);
  });
});

/* ------------------------------------------------------------- 1(a) */

/* [ROW 39] THE PIXEL READING RASTERISES A PROJECTION ONTO A PICTURE, and the
   two have to be the same picture. A flight's polygons are frame coordinates on
   a canvas of a stated width; `paintedFlightReading` walks them over the PNG's
   own pixels. Let those widths differ and every number still comes out — a
   mean, a ring, a ratio, all of them taken over the wrong part of the frame,
   with nothing in the record saying so. The reading is not gated on, which is
   exactly why a silent wrong number here is worse than a refusal: it would sit
   on the meta as evidence.

   The real corpus is 1536 px wide throughout, so this is stated rather than
   discovered — the guard is checked by declaring the wrong canvas over a real
   candidate, which is the same disagreement a 1024 px frame would create. */
test.describe("the pixel reading and the picture it is taken from", () => {
  const CANDIDATE = join(repoRoot, "backdrops", "source", "stair_landing-N",
    "row23-e594b388.png");

  const flightsHere = () => {
    const meta = deriveMeta(PLAN, "stair_landing", "N");
    const flights = stairsForFacing(PLAN, "stair_landing", "N", meta);
    expect(flights.length, "stair_landing/N draws no flight and this case has no subject")
      .toBeGreaterThan(0);
    return flights;
  };

  test("reads at the canvas the flight was projected on", () => {
    expect(existsSync(CANDIDATE), `${CANDIDATE} is missing and this case proves nothing`)
      .toBe(true);
    const r = paintedFlightReading(CANDIDATE, flightsHere(), CANVAS_W);
    expect(r.read, r.why).toBe(true);
    expect(r.ratio).toBeGreaterThan(0);
    expect(r.body_px).toBeGreaterThan(0);
  });

  test("and refuses to read one canvas's projection off another's pixels", () => {
    const r = paintedFlightReading(CANDIDATE, flightsHere(), 1024);
    expect(r.read, "a 1024 px projection was read off a 1536 px painting").toBe(false);
    expect(r.why).toContain("1024");
    expect(r.why).toContain("1536");
    expect(r.ratio, "an unread reading carries no number").toBeUndefined();
    /* Verified by removing the check: without it this same call returns
       read:true with a ratio, over pixels two thirds of the way across the
       wrong part of the frame. Which is why the width is not defaulted — a
       caller that does not say gets no reading rather than the 1536 one. */
    const silent = paintedFlightReading(CANDIDATE, flightsHere(), undefined);
    expect(silent.read, "a reading taken without a declared canvas").toBe(false);
    expect(silent.why).toContain("without the canvas width");
  });
});

/* ------------------------------------------------------------------ 2 */

test.describe("the flight box the scaffold stamps", () => {
  test("lands on stairsForFacing's own rect, recomputed independently", () => {
    for (const [loc, f] of stairFacings()) {
      const meta = deriveMeta(PLAN, loc, f);
      /* THE INDEPENDENT SIDE: the projection, called here, and its clamped
         rectangle read off the record — never `flightRects`'s own answer. */
      const want = stairsForFacing(PLAN, loc, f, meta);
      const got = flightRects(PLAN, loc, f, meta);
      expect(got.length, `${loc}/${f}: a flight is drawn and no box is stamped`).toBe(want.length);
      for (let i = 0; i < want.length; i++) {
        const w = want[i], g = got[i];
        expect(g.id).toBe(w.id);
        expect(g.x0, `${loc}/${f} ${w.id}: left edge`).toBeCloseTo(w.x, 2);
        expect(g.y0, `${loc}/${f} ${w.id}: top edge`).toBeCloseTo(w.y, 2);
        expect(g.x1, `${loc}/${f} ${w.id}: right edge`).toBeCloseTo(w.x + w.w, 2);
        expect(g.y1, `${loc}/${f} ${w.id}: bottom edge`).toBeCloseTo(w.y + w.h, 2);
        /* AND THE RAW EXTENT IS DECLARED BESIDE IT. `x/y/w/h` are already the
           intersection with the frame, so a box that only carried them could
           not say how much of the flight the frame ate — row 26's defect. */
        expect(g.raw_w, `${loc}/${f} ${w.id}: raw width`).toBeCloseTo(w.raw_w, 2);
        expect(g.raw_h, `${loc}/${f} ${w.id}: raw height`).toBeCloseTo(w.raw_h, 2);
        /* The plan's own width, recomputed from the stair record. */
        const st = PLAN.stairs.find((x) => x.id === w.id);
        const across = (st.up === "N" || st.up === "S") ? "x" : "y";
        expect(g.width_m, `${loc}/${f} ${w.id}: stated width`)
          .toBeCloseTo(Math.abs(st.rect[across + "1"] - st.rect[across + "0"]), 6);
        expect(g.width_m).toBeCloseTo(stairPlanFacts(st).width_m, 6);
      }
    }
  });

  test("every flight mark is strokable and lands on the frame, clear of the legend", () => {
    for (const [loc, f] of stairFacings()) {
      const meta = deriveMeta(PLAN, loc, f);
      for (const s of flightRects(PLAN, loc, f, meta)) {
        assertLabelChars(s.label, `${loc}/${f} flight label`);
        for (const n of s.notes) assertLabelChars(n.text, `${loc}/${f} flight note`);
        const marks = [s.label_rect, ...s.notes];
        for (const m of marks) {
          expect(m.x, `${loc}/${f}: a flight mark starts left of the frame`).toBeGreaterThanOrEqual(0);
          expect(m.y, `${loc}/${f}: a flight mark starts above the frame`).toBeGreaterThanOrEqual(0);
          expect(m.x + m.w, `${loc}/${f}: a flight mark runs past the right edge`)
            .toBeLessThanOrEqual(CANVAS_W);
          expect(m.y + m.h, `${loc}/${f}: a flight mark runs past the bottom edge`)
            .toBeLessThanOrEqual(CANVAS_H);
          /* THE LEGEND IS DRAWN LAST AND WOULD BURY IT. A descending flight's
             box begins in the legend's own rows, which is why the block is
             lifted rather than placed inside the box regardless. */
          expect(m.y + m.h, `${loc}/${f}: a flight mark falls into the legend's band`)
            .toBeLessThanOrEqual(LEGEND_TOP_Y);
        }
        /* The note says how the frame cut the body, and it says it only when it
           did: a flight wholly in view is not "cut by the frame". */
        const cut = s.notes.map((n) => n.text).join(" ");
        expect(/CUT BY THE FRAME/.test(cut), `${loc}/${f}: the cut note and the extent disagree`)
          .toBe(s.runs_off.length > 0);
        expect(cut, `${loc}/${f}: the note never states the climb`)
          .toContain(s.climb ? CLIMB_STAMP[s.climb] : "NO TREAD IN FRAME");
      }
    }
  });
});

test.describe("the flight box, drawn", () => {
  test.skip(({ browserName }) => browserName !== "chromium",
    "a claim about a node tool and one canvas has no second engine");

  test("the label pass on a stair facing draws only inside the declared rects", async ({ page }) => {
    await page.goto(navUrl());
    await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
    await page.evaluate((src) => {
      window.__renderPng = eval("(" + src + ")");
      window.__decode = function (dataUrl) {
        return new Promise((res) => {
          const im = new Image();
          im.onload = function () {
            const cv = document.createElement("canvas");
            cv.width = im.width; cv.height = im.height;
            cv.getContext("2d").drawImage(im, 0, 0);
            res(cv);
          };
          im.src = dataUrl;
        });
      };
      window.__bufOf = function (cv) {
        return cv.getContext("2d").getImageData(0, 0, cv.width, cv.height).data;
      };
    }, PAGE_RENDER.toString());

    /* The confinement case has only ever run on `study/N` and `study/E`, and
       neither room has a staircase in it — so the flight region's marks have
       never been inside its reach. This is that case on a wall that draws one. */
    for (const key of ["great_stair_hall/W", "stair_landing/N"]) {
      const [loc, f] = key.split("/");
      const meta = await page.evaluate((k) => {
        const e = window.HOLO_APP.backdrops[k];
        return e && e.meta ? e.meta : null;
      }, key);
      expect(meta, `${key}: the page holds no meta`).toBeTruthy();
      const { rects, flights } = scaffoldRects(PLAN, loc, f, meta);
      expect(flights.length, `${key} draws no flight, so this proves nothing`).toBeGreaterThan(0);
      const cr = chairRail(meta);
      const legend = {
        x: 24, y: LEGEND_TOP_Y, w: 900, h: CANVAS_H - 24 - LEGEND_TOP_Y,
        lines: ["FLIGHT CONFINEMENT CASE"], text_h: 15, line_h: 26
      };
      const pad = 4;
      const allow = [{ x0: legend.x - pad, y0: legend.y - pad,
        x1: legend.x + legend.w + pad, y1: legend.y + legend.h + pad }];
      for (const s of rects) {
        allow.push({ x0: s.x0 - pad, y0: s.y0 - pad, x1: s.x1 + pad, y1: s.y1 + pad });
        for (const r of [s.label_rect, s.note_rect]) {
          if (r) allow.push({ x0: r.x - pad, y0: r.y - pad, x1: r.x + r.w + pad, y1: r.y + r.h + pad });
        }
      }
      for (const s of flights) {
        allow.push({ x0: s.x0 - pad, y0: s.y0 - pad, x1: s.x1 + pad, y1: s.y1 + pad });
        for (const r of [s.label_rect, ...s.notes]) {
          allow.push({ x0: r.x - pad, y0: r.y - pad, x1: r.x + r.w + pad, y1: r.y + r.h + pad });
        }
      }
      allow.push({ x0: cr.x0 - pad, y0: cr.y - pad, x1: cr.x1 + pad, y1: cr.y + 10 + 18 + pad });
      allow.push({ x0: cr.x0, y0: cr.y + 10 - pad, x1: CANVAS_W, y1: cr.y + 10 + 18 + pad });

      const r = await page.evaluate(async ([key, meta, marks, G, allow]) => {
        const a = await window.__decode(window.__renderPng(
          { key, meta, mode: "scaffold", marks: null, G: null }));
        const b = await window.__decode(window.__renderPng(
          { key, meta, mode: "scaffold", marks, G }));
        const A1 = window.__bufOf(a), B1 = window.__bufOf(b);
        let diff = 0, outside = 0, first = null;
        for (let i = 0; i < A1.length; i += 4) {
          if (A1[i] !== B1[i] || A1[i + 1] !== B1[i + 1] ||
              A1[i + 2] !== B1[i + 2] || A1[i + 3] !== B1[i + 3]) {
            diff++;
            const p = i / 4, x = p % 1536, y = (p / 1536) | 0;
            if (!allow.some((q) => x >= q.x0 && x <= q.x1 && y >= q.y0 && y <= q.y1)) {
              outside++;
              if (!first) first = { x, y };
            }
          }
        }
        return { diff, outside, first };
      }, [key, meta, { rects, chair_rail: cr, legend, flights }, GLYPH_TABLE, allow]);
      expect(r.diff, `${key}: the label pass drew nothing at all`).toBeGreaterThan(1000);
      expect(r.outside,
        `${key}: ${r.outside} label pixels fall outside every declared rect` +
        (r.first ? ` (first at ${r.first.x},${r.first.y})` : "")).toBe(0);
    }
  });

  test("an older scaffold with no flights still re-renders", async ({ page }) => {
    /* Every sidecar cut before the flight language exists carries no `flights`
       key, and `scaffold.spec`'s committed-image comparison rebuilds its marks
       from one. The page must treat an absent list as an empty one or those
       comparisons break on a change that has nothing to do with them. */
    await page.goto(navUrl());
    await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
    const meta = await page.evaluate(() => window.HOLO_APP.backdrops["study/N"].meta);
    const { rects } = scaffoldRects(PLAN, "study", "N", meta);
    const cr = chairRail(meta);
    const url = await page.evaluate(([src, arg]) => eval("(" + src + ")")(arg),
      [PAGE_RENDER.toString(), {
        key: "study/N", meta, mode: "scaffold", G: GLYPH_TABLE,
        marks: { rects, chair_rail: cr,
          legend: { x: 24, y: 848, w: 400, h: 152, lines: ["NO FLIGHTS KEY"], text_h: 15, line_h: 26 } }
      }]);
    expect(url.startsWith("data:image/png")).toBe(true);
  });
});

/* ------------------------------------------------------------------ 3 */

test.describe("the climb the prompt states", () => {
  test("agrees with the pixels, which are not what derived it", () => {
    /* `flightsForFacing` decides the climb from the PLAN: the run axis against
       this facing's normal, and depth from the wall line. The evidence here is
       the picture's own — a step further from the eye projects a shorter nose —
       and the two derivations share nothing. On the twelve views this plan
       holds they agree on every one. */
    let checkedDepth = 0, checkedLateral = 0;
    for (const [loc, f] of stairFacings()) {
      const meta = deriveMeta(PLAN, loc, f);
      for (const s of flightsForFacing(PLAN, loc, f, meta)) {
        if (!s.climb) continue;
        const inView = s.noses.filter((n) => {
          const x0 = Math.min(n[0][0], n[1][0]), x1 = Math.max(n[0][0], n[1][0]);
          const y0 = Math.min(n[0][1], n[1][1]), y1 = Math.max(n[0][1], n[1][1]);
          return x1 >= 0 && x0 <= CANVAS_W && y1 >= 0 && y0 <= meta.image_h_px;
        });
        const len = (n) => Math.hypot(n[1][0] - n[0][0], n[1][1] - n[0][1]);
        const lo = inView[0], hi = inView[inView.length - 1];
        if (s.climb === "away" || s.climb === "toward") {
          /* A flight running into the view: the top step is further off than
             the bottom one, or nearer, and the projected nose length says which
             — it is the same scale the projection applied to place them. */
          const ratio = len(hi) / len(lo);
          if (s.climb === "away") {
            expect(ratio, `${loc}/${f}: the prompt says the flight climbs away and its upper steps project WIDER`)
              .toBeLessThan(1);
          } else {
            expect(ratio, `${loc}/${f}: the prompt says the flight climbs toward you and its upper steps project NARROWER`)
              .toBeGreaterThan(1);
          }
          checkedDepth++;
        } else {
          const mid = (n) => (n[0][0] + n[1][0]) / 2;
          const dx = mid(hi) - mid(lo);
          expect(Math.sign(dx), `${loc}/${f}: the prompt says the flight climbs ${s.climb} and the picture goes the other way`)
            .toBe(s.climb === "left" ? -1 : 1);
          checkedLateral++;
        }
        /* And every in-view climb rises up the picture, which is what makes
           "the lines stack one above the next" a true sentence. */
        const midY = (n) => (n[0][1] + n[1][1]) / 2;
        expect(midY(hi), `${loc}/${f}: the higher step projects LOWER in the frame`)
          .toBeLessThan(midY(lo));
      }
    }
    expect(checkedDepth, "no flight in this plan runs into the view").toBeGreaterThan(0);
    expect(checkedLateral, "no flight in this plan runs across the view").toBeGreaterThan(0);
  });
});

/* ------------------------------------------------------------------ 4 */

test.describe("the ways through, said apart", () => {
  const doorRefused = () => Object.entries(
    JSON.parse(readFileSync(STATE, "utf8")).walls)
    .filter(([, w]) => REASONS.ways_never_named_apart.refusal.test(w.correction || ""))
    .map(([k]) => k);

  test("every door-refused wall's prompt carries the unlit-void rule", () => {
    const walls = doorRefused();
    expect(walls.length, "no wall in the run state was refused for a missing way through")
      .toBeGreaterThan(0);
    for (const key of walls) {
      const [loc, f] = key.split("/");
      const meta = deriveMeta(PLAN, loc, f);
      const { rects } = scaffoldRects(PLAN, loc, f, meta);
      const w = JSON.parse(readFileSync(STATE, "utf8")).walls[key];
      const text = manorPrompt(PLAN, key, meta, rects, w.correction);
      const doors = rects.filter((r) => r.kind === "door").length;
      const said = text.split("\n").filter((l) => /door opening is exactly/.test(l));
      expect(said.length, `${key}: the plan rules ${doors} way(s) through and the prompt states ${said.length}`)
        .toBe(doors);
      for (const line of said) {
        expect(line, `${key}: a door sentence omits the unlit-void rule`)
          .toContain("The space beyond the opening is deep unlit shadow");
      }
      /* AND TWO WAYS ARE TWO INSTRUCTIONS. `great_hall/W` and `long_gallery/W`
         were asked for their second doorway in a sentence byte-identical to the
         first, which is one instruction said twice; both came back with fewer
         holes than the plan rules. */
      expect(new Set(said.map((l) => l.trim())).size,
        `${key}: ${said.length} ways through are asked for in ${new Set(said.map((l) => l.trim())).size} distinct sentence(s)`)
        .toBe(said.length);
      if (doors > 1) {
        for (const line of said) {
          expect(line, `${key}: a door sentence never says where in the picture that door stands`)
            .toMatch(/in the picture it stands between column \d+ and column \d+/);
        }
      }
    }
  });

  test("every prompt a held wall would be re-asked with passes the standing lint", () => {
    /* The correction is quoted verbatim into the prompt, and a correction is the
       one part of a prompt nobody composed — so the lint runs over the re-ask
       form of every held wall, not only over the first-ask form the 88-prompt
       sweep covers. */
    const state = JSON.parse(readFileSync(STATE, "utf8"));
    const dir = mkdtempSync(join(tmpdir(), "holo-flight-lint-"));
    const files = [];
    try {
      for (const [key, w] of Object.entries(state.walls)) {
        if (!w.correction || w.status === "promoted") continue;
        const [loc, f] = key.split("/");
        const meta = deriveMeta(PLAN, loc, f);
        const { rects } = scaffoldRects(PLAN, loc, f, meta);
        const p = join(dir, `${loc}-${f}.prompt.txt`);
        writeFileSync(p, manorPrompt(PLAN, key, meta, rects, w.correction));
        files.push(p);
      }
      expect(files.length, "no held wall carries a correction").toBeGreaterThan(0);
      expect(python([LINT, ...files])).toContain(`0 of ${files.length} prompt(s) refused.`);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

/* ------------------------------------------------------------------ 5 */

test.describe("the content-gap grant", () => {
  const liveState = () => JSON.parse(readFileSync(STATE, "utf8"));

  /**
   * The moment the grant decided in, rebuilt from the grant's own record.
   *
   * The grant has already run against the live file — that is what put nine
   * re-ask packets on disk — and the re-ask it produced is now the newest
   * prompt for those walls, so the gap it found is closed and asking again
   * correctly returns nothing. Rerunning it here would therefore pass
   * vacuously. Two things have to be put back, and the record keeps both: the
   * status each wall was moved FROM, and the exact prompt file the decision was
   * diffed against. A record that could not reconstruct its own decision would
   * be an audit trail nobody can read backwards, which is precisely what
   * `_once_only` is supposed to make possible — so rebuilding it here is a
   * check on the record as much as on the tool.
   */
  const preGrant = () => {
    const state = liveState();
    const spent = {};
    let undone = 0;
    for (const [key, w] of Object.entries(state.walls)) {
      const g = w[GRANTS_KEY];
      if (!g) continue;
      for (const rec of Object.values(g)) {
        w.status = rec.prior_status;
        expect(rec.spent_prompt, `${key}'s grant does not name the prompt it was diffed against`)
          .toBeTruthy();
        spent[key] = join(repoRoot, rec.spent_prompt);
      }
      delete w[GRANTS_KEY];
      undone++;
    }
    expect(undone, "the live run state carries no content-gap grant, so nothing here is about a real run")
      .toBeGreaterThan(0);
    return {
      state,
      opts: {
        plan: PLAN,
        spentPrompt: (key) => spent[key] || spentPromptPath(DEFAULT_OUT, key)
      }
    };
  };

  test("the live run state carries the grant, and the tool will not give a second", () => {
    /* Once-only against the FILE, not against a copy: the tool has run, and
       running it again must find nothing left to give. */
    const live = liveState();
    const granted = Object.entries(live.walls).filter(([, w]) => w[GRANTS_KEY]);
    expect(granted.length, "the grant has not been applied to the run state").toBeGreaterThan(0);
    for (const [key, w] of granted) {
      for (const [reason, rec] of Object.entries(w[GRANTS_KEY])) {
        expect(REASONS[reason], `${key} carries a grant under an unknown reason ${reason}`).toBeTruthy();
        expect(rec.granted).toBe(1);
        expect(rec.gained_lines.length,
          `${key} was granted with nothing gained`).toBeGreaterThan(0);
        expect(rec.emitter_commit, `${key}'s grant does not name the emitter it is testing`).toBeTruthy();
        expect(rec.prior_status, `${key}'s grant does not record what it moved from`).toBeTruthy();
      }
      expect(w.status, `${key} was granted and is not queued for a re-ask`).toBe("retry");
    }
    expect(eligible(live, { plan: PLAN }).take,
      "the grant would hand out a second ask on a state it has already granted").toEqual([]);
  });

  test("grants exactly the walls whose ask was missing the thing they were refused for", () => {
    const { state, opts } = preGrant();
    const { take, skip } = eligible(state, opts);
    expect(take.length, "the grant finds nothing to grant").toBeGreaterThan(0);
    for (const t of take) {
      const w = state.walls[t.key];
      /* TWO SHAPES OF REASON SINCE ROW 38. The first two are keyed on the
         REFUSAL the gate wrote. `edge_never_seeded` is keyed on the WALL — an
         open location's facing whose painted neighbour was never handed to it —
         because no refusal describes it: the gap is in an ask nobody made, so
         there is no sentence to match. A granted wall satisfies its own
         reason's own test, whichever kind that is. */
      const reason = REASONS[t.reason];
      expect(reason.refusal
        ? reason.refusal.test(w.correction)
        : reason.applies({ key: t.key, wall: w, plan: PLAN }),
      `${t.key} was granted under ${t.reason}, whose own test its wall does not satisfy`).toBe(true);
      expect(t.gained.length,
        `${t.key} was granted with nothing gained, which is the same ask again`).toBeGreaterThan(0);
      /* THE GAP IS REAL, checked here against the file rather than against the
         tool's own report: the prompt actually sent does not carry the line. */
      const spent = readFileSync(join(repoRoot, t.spent_prompt), "utf8");
      for (const line of t.gained) {
        expect(spent, `${t.key}: the spent prompt already carries ${JSON.stringify(line.trim().slice(0, 60))}`)
          .not.toContain(line.trim());
      }
    }
    /* Every wall the row-32 flight clause refused AND IS STILL WAITING ON is
       granted, and it is found by reading the refusal rather than by a list of
       names. [Row 39] The second half of that sentence is load-bearing now that
       a flight-bearing wall can actually be promoted: `run-state.json` keeps a
       wall's correction verbatim after the wall is answered, so a wall whose
       art has since reached the store still READS as flight-refused here while
       `eligible` — rightly, and in its own words — skips it. The store is the
       fact; the recorded sentence is a record of a past decision. */
    const inStore = (key) =>
      existsSync(join(repoRoot, "backdrops", ...key.split("/")) + ".meta.json");
    const flightRefused = Object.entries(state.walls)
      .filter(([k, w]) => REASONS.flight_never_named.refusal.test(w.correction || "") && !inStore(k))
      .map(([k]) => k).sort();
    expect(flightRefused.length).toBeGreaterThan(0);
    expect(take.filter((t) => t.reason === "flight_never_named").map((t) => t.key).sort())
      .toEqual(flightRefused);
    /* And nothing outside a content gap is touched: a camera miss, an unfitted
       horizon and a suspect painting are facts about a picture. */
    for (const s of skip) {
      const w = state.walls[s.key];
      if (!w || w.status === "promoted" || inStore(s.key)) continue;
      if (/no content-gap reason matches/.test(s.why)) {
        expect(REASONS.flight_never_named.refusal.test(w.correction || ""),
          `${s.key} was skipped and its refusal IS the flight clause`).toBe(false);
      }
    }
  });

  test("is once-only per wall per reason", () => {
    const { state, opts } = preGrant();
    const first = grant(state, { ...opts, at: "2026-08-24T00:00:00.000Z" });
    expect(first.take.length).toBeGreaterThan(0);
    for (const t of first.take) {
      expect(state.walls[t.key][GRANTS_KEY][t.reason].granted).toBe(1);
      expect(state.walls[t.key].status).toBe("retry");
    }
    const second = grant(state, { ...opts, at: "2026-08-25T00:00:00.000Z" });
    expect(second.take, "a second run granted the same walls again").toEqual([]);
    for (const t of first.take) {
      const why = second.skip.find((s) => s.key === t.key).why;
      expect(why, `${t.key}'s second refusal does not say the grant is once-only`)
        .toContain("once-only");
      /* And the first grant's record is untouched by the second run. */
      expect(state.walls[t.key][GRANTS_KEY][t.reason].at).toBe("2026-08-24T00:00:00.000Z");
    }
  });

  test("refuses a wall whose ask already said the thing", () => {
    const state = liveState();
    const { skip } = eligible(state, { plan: PLAN });
    const already = skip.filter((s) => /nothing has been gained/.test(s.why));
    /* Two door-refused walls were already re-asked under the unlit rule and
       still came back without the hole. That is the generator's miss and the
       ordinary retry budget owns it — a content-gap grant would be a free roll
       dressed as an accounting correction. */
    expect(already.length, "no wall exercises the already-said refusal, so it is unproven")
      .toBeGreaterThan(0);
    for (const s of already) {
      const sp = spentPromptPath(DEFAULT_OUT, s.key);
      expect(sp, `${s.key} has no spent prompt`).toBeTruthy();
      expect(readFileSync(sp, "utf8")).toContain("deep unlit shadow");
    }
  });

  test("a reason whose fix has not landed in the emitter grants nothing", () => {
    /* The gap is PROVED, not asserted: if `manorPrompt` stopped composing the
       Stairs paragraph, this grant would stop finding flight walls rather than
       going on handing out asks for a fix that is no longer there. */
    const state = liveState();
    const flightWalls = Object.entries(state.walls)
      .filter(([, w]) => REASONS.flight_never_named.refusal.test(w.correction || ""))
      .map(([k]) => k);
    for (const key of flightWalls) {
      const [loc, f] = key.split("/");
      const meta = deriveMeta(PLAN, loc, f);
      const { rects } = scaffoldRects(PLAN, loc, f, meta);
      const fresh = manorPrompt(PLAN, key, meta, rects, state.walls[key].correction);
      /* The emitter's own output with the paragraph struck out is exactly what
         a build that never learned the flight language would produce. */
      const without = fresh.split("\n").filter((l, i, all) => {
        let at = all.findIndex((x) => /^Stairs:/.test(x));
        if (at === -1) return true;
        let end = at + 1;
        while (end < all.length && /^\s/.test(all[end])) end++;
        return i < at || i >= end;
      }).join("\n");
      expect(REASONS.flight_never_named.gained(without, without),
        `${key}: a prompt with no Stairs paragraph still reports a gain`).toEqual([]);
      expect(REASONS.flight_never_named.gained(fresh, without).length,
        `${key}: the Stairs paragraph is not what the grant is proving`).toBeGreaterThan(0);
    }
  });

  test("the tool refuses a run state that is not there, and an unknown reason", () => {
    const dir = mkdtempSync(join(tmpdir(), "holo-flight-grant-"));
    try {
      const run = (args) => {
        try {
          return { code: 0, out: execFileSync("node",
            [join(repoRoot, "tools", "grant-content-gap.mjs"), ...args],
            { cwd: repoRoot, encoding: "utf8", stdio: "pipe" }) };
        } catch (e) { return { code: e.status, out: (e.stdout || "") + (e.stderr || "") }; }
      };
      const missing = run(["--out", dir, "--dry-run"]);
      expect(missing.code).toBe(1);
      expect(missing.out).toContain("does not exist");
      const bogus = run(["--reason", "no_such_reason", "--dry-run"]);
      expect(bogus.code).toBe(2);
      expect(bogus.out).toContain("no reason named no_such_reason");
      /* The real dry run writes nothing. */
      const before = readFileSync(STATE, "utf8");
      const dry = run(["--dry-run"]);
      expect(dry.code).toBe(0);
      expect(dry.out).toContain("DRY RUN - nothing written");
      expect(readFileSync(STATE, "utf8")).toBe(before);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

/* The run state this file reads is a real artifact of a real run; if it is ever
 * absent the whole grant half is vacuous, so it is checked rather than skipped
 * past. */
test("the run state the grant reads exists", () => {
  expect(existsSync(STATE), `${STATE} is missing and the grant cases prove nothing`).toBe(true);
});
