/* Row 23 — the scaffold generator.
 *
 * Two claims live here and they are checked separately, because the second
 * draft of the plan conflated them and the comparison could not have passed:
 *
 *   1. THE FRAME IS THE FRAME THE PLAYER SEES. `tools/make-scaffold.mjs` calls
 *      the shipped `render()`, so its output at the PAGE'S OWN options must
 *      equal the live `#scene` pixel for pixel.
 *   2. THE LABEL PASS TOUCHES ONLY WHAT THE SIDECAR DECLARES. Everything the
 *      scaffold adds over the bare frame lies inside a rect that was computed
 *      in node, before the page opened, and written into the sidecar.
 *
 * PIXELS NEVER CROSS THE BRIDGE. A frame is 6.3 MB of RGBA and marshalling it
 * to node costs minutes; every comparison below happens INSIDE the page and
 * returns a small verdict. That is also why the PNGs are decoded in the page
 * rather than in node — the project carries no PNG library, and
 * `plan.spec`'s render-lock case is about comparing PNG BYTES, which nothing
 * here does.
 */
import { test, expect } from "@playwright/test";
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { createRequire } from "node:module";
import { repoRoot, navUrl } from "./helpers.mjs";
import {
  metaFromReading, scaffoldRects, chairRail, brackets, rulerX, apertureX,
  wallY, textBox, carrierTolerance, REFLEX, PENDING_ROWS, ROUTES, PAGE_RENDER,
  assertLabelChars, SHEET, inkGeometry, SCAFFOLD_STYLES, SCAFFOLD_STYLE_DEFAULT,
  assertScaffoldStyle, manorPrompt
} from "../../tools/make-scaffold.mjs";
import { frameGeometry } from "../../tools/frame-language.mjs";
import { makeCtx, SCAFFOLD_TRIAL, ARMS } from "../../tools/evolution-arms.mjs";
import { scaffoldMarks } from "../../tools/emit-evolution.mjs";
import { facingCarriers, deriveMeta, openingsForFacing } from "../../tools/plan-projection.mjs";

const require_ = createRequire(import.meta.url);
const groundplane = require_("../../src/groundplane.js");
const BATCH = join(repoRoot, "design", "batches", "row23-scaffold");
const PLAN = JSON.parse(readFileSync(join(repoRoot, "fixtures", "demo-study", "plan.json"), "utf8"));
const MEASURED = join(repoRoot, "design", "plan-draft", "measured");

/* The facings this row exercises. `hall/N` and `hall/S` are absent on purpose:
 * row 26 slides their standpoints, and PENDING_ROWS refuses them. */
const PAGE_FACINGS = ["study/N", "study/W", "study/E", "hall/E", "hall/W"];

/* The shipped renderer's own source, for the delete-green mutations. */
const RENDERER_SRC = readFileSync(join(repoRoot, "src", "renderer.js"), "utf8");

async function boot(page) {
  await page.goto(navUrl());
  await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
}

/** Render in the page and return a digest of the RGBA buffer, not the buffer. */
const DIGEST = function (arg) {
  const url = window.__renderPng(arg);
  return window.__digest(url);
};

/* Small helpers installed in the page once: a synchronous FNV-1a over the
 * canvas buffer (the page has no SubtleCrypto under file://), and a decoder. */
async function installPageHelpers(page, pageRenderSrc) {
  await page.evaluate((src) => {
    window.__renderPng = eval("(" + src + ")");
    window.__hashBuf = function (data) {
      let h1 = 0x811c9dc5, h2 = 0x01000193;
      for (let i = 0; i < data.length; i++) {
        h1 ^= data[i]; h1 = (h1 * 16777619) >>> 0;
        h2 = (h2 + data[i] * (i % 251 + 1)) >>> 0;
      }
      return h1.toString(16) + "-" + h2.toString(16) + "-" + data.length;
    };
    window.__bufOf = function (cv) {
      return cv.getContext("2d").getImageData(0, 0, cv.width, cv.height).data;
    };
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
  }, pageRenderSrc);
}

const RENDER_SRC = PAGE_RENDER.toString();

test.describe("row 23 — the scaffold generator", () => {
  test.skip(({ browserName }) => browserName !== "chromium",
    "a claim about a node tool and one canvas has no second engine");

  /* ---------------------------------------------------------------- §7.1 */
  /* THE OPTIONS MUST MATCH ON BOTH SIDES OR THE COMPARISON IS VOID.
   * `nav-manor` stages no objects, so no aperture carries a leaf and every
   * doorway draws the room beyond it — `study/E` shows 8.6 m of passage. The
   * scaffold render suppresses that with `no_through`; the page does not. The
   * second draft of the plan compared those two and would have failed here. */
  test("the generator's frame is the frame the page draws, at the page's own options", async ({ page }) => {
    for (const key of PAGE_FACINGS) {
      /* A FRESH BOOT PER FACING. `ROUTES` are absolute from the boot state, so
         replaying them in one page walks past the facing under test — the
         first run of this case landed study/E on study/N and compared two
         different walls, which `apertureList` then reported as having no
         doorway at all. */
      await boot(page);
      await installPageHelpers(page, RENDER_SRC);
      const same = await page.evaluate(async ([key, route, arg]) => {
        const A = window.HOLO_APP;
        for (const it of route) A.dispatch(it);
        if (A.backdrops[key] && A.backdrops[key].image) delete A.backdrops[key].image;
        A.harness.redraw();
        const vs = A.harness.viewstate;
        if (vs.location + "/" + vs.facing !== key) {
          return { ok: false, why: "route landed on " + vs.location + "/" + vs.facing };
        }
        const scene = document.getElementById("scene");
        const live = window.__hashBuf(window.__bufOf(scene));
        const cv = await window.__decode(window.__renderPng(arg));
        const gen = window.__hashBuf(window.__bufOf(cv));
        return { ok: live === gen, live, gen };
      }, [key, ROUTES[key], { key, meta: null, mode: "verify", marks: null, G: null }]);
      expect(same.ok,
        `${key}: the generator's verify render is not what the page drew (${same.why || same.live + " vs " + same.gen})`)
        .toBe(true);
    }
  });

  /* ---------------------------------------------------------------- §7.9 */
  /* DELETE-GREEN, and it breaks what the check guards rather than the
   * comparator. A one-pixel meta perturbation — the plan's second draft —
   * proves only that a hash is sensitive. These two take away the thing §7.1
   * exists to assert: first the renderer's own drawing, then the generator's
   * use of it. Both must go red. */
  test("§7.1 goes red when the renderer moves, and when the generator stops using it", async ({ page }) => {
    await boot(page);
    await installPageHelpers(page, RENDER_SRC);
    const arg = { key: "study/N", meta: null, mode: "verify", marks: null, G: null };

    const baseline = await page.evaluate(async (arg) => {
      const cv = await window.__decode(window.__renderPng(arg));
      return window.__hashBuf(window.__bufOf(cv));
    }, arg);

    /* (a) THE RENDERER MOVES. `snap` is what puts every grid line on a half
     *     pixel; shifting it one pixel redraws every line the frame has. */
    const mutated = RENDERER_SRC.replace(
      "function snap(v) { return Math.floor(v) + 0.5; }",
      "function snap(v) { return Math.floor(v) + 1.5; }");
    expect(mutated, "the mutation did not apply — `snap` has been rewritten and this case is now blind")
      .not.toBe(RENDERER_SRC);
    const afterA = await page.evaluate(async ([src, arg]) => {
      eval(src);
      const cv = await window.__decode(window.__renderPng(arg));
      return window.__hashBuf(window.__bufOf(cv));
    }, [mutated, arg]);
    expect(afterA,
      "the frame did not move when the renderer's own line snapping did — §7.1 cannot see a renderer change")
      .not.toBe(baseline);

    /* (b) THE GENERATOR STOPS USING IT. A plausible reimplementation that
     *     draws a frame-shaped thing must not pass for the shipped one. */
    await page.reload();
    await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
    await installPageHelpers(page, RENDER_SRC);
    const afterB = await page.evaluate(async (arg) => {
      window.HOLO.renderer.render = function (cv) {
        const c = cv.getContext("2d");
        c.fillStyle = "#0b0d12"; c.fillRect(0, 0, cv.width, cv.height);
        c.strokeStyle = "#4a5870";
        for (let x = 0; x < cv.width; x += 96) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, cv.height); c.stroke(); }
        return cv;
      };
      const cv = await window.__decode(window.__renderPng(arg));
      return window.__hashBuf(window.__bufOf(cv));
    }, arg);
    expect(afterB,
      "a local reimplementation produced the same frame as the shipped renderer — §7.1 is not testing what it claims")
      .not.toBe(baseline);
  });

  /* ---------------------------------------------------------------- §7.2 */
  /* The scaffold suppresses the through-view; the difference that makes must
   * be confined to the apertures. The rects come from `HOLO_APP.apertureList`
   * — the page's own — and are dilated by 1 px, because the renderer clips at
   * fractional edges and antialiasing lands a pixel outside an undilated
   * rect. */
  test("suppressing the through-view changes only aperture pixels", async ({ page }) => {
    let sawADoorway = false;
    for (const key of PAGE_FACINGS) {
      await boot(page);                     // absolute routes; see the case above
      await installPageHelpers(page, RENDER_SRC);
      const r = await page.evaluate(async ([key, route]) => {
        const A = window.HOLO_APP;
        for (const it of route) A.dispatch(it);
        if (A.backdrops[key] && A.backdrops[key].image) delete A.backdrops[key].image;
        A.harness.redraw();
        const rects = (A.apertureList() || []).map((a) => ({
          x0: Math.floor(a.x) - 1, y0: Math.floor(a.y) - 1,
          x1: Math.ceil(a.x + a.w) + 1, y1: Math.ceil(a.y + a.h) + 1
        }));
        const a = await window.__decode(window.__renderPng(
          { key, meta: null, mode: "verify", marks: null, G: null }));
        const b = await window.__decode(window.__renderPng(
          { key, meta: null, mode: "scaffold", marks: null, G: null }));
        const A1 = window.__bufOf(a), B1 = window.__bufOf(b);
        let diff = 0, outside = 0, firstOut = null;
        for (let i = 0; i < A1.length; i += 4) {
          if (A1[i] !== B1[i] || A1[i + 1] !== B1[i + 1] || A1[i + 2] !== B1[i + 2] || A1[i + 3] !== B1[i + 3]) {
            diff++;
            const p = i / 4, x = p % 1536, y = (p / 1536) | 0;
            if (!rects.some((q) => x >= q.x0 && x < q.x1 && y >= q.y0 && y < q.y1)) {
              outside++;
              if (!firstOut) firstOut = { x, y };
            }
          }
        }
        return { diff, outside, firstOut, apertures: rects.length };
      }, [key, ROUTES[key]]);
      if (r.apertures > 0 && r.diff > 0) sawADoorway = true;
      expect(r.outside,
        `${key}: ${r.outside} pixels change outside its ${r.apertures} aperture rect(s) when the through-view is suppressed` +
        (r.firstOut ? ` (first at ${r.firstOut.x},${r.firstOut.y})` : ""))
        .toBe(0);
    }
    expect(sawADoorway,
      "no facing changed a pixel when the through-view was suppressed — this case proved nothing, and nav-manor is supposed to stage no leaf on 8.6 m of visible passage")
      .toBe(true);
  });

  /* ---------------------------------------------------------------- §7.3 */
  /* The injection mechanism, proved where the native answer exists.
   * `study/E` is unpainted, so the meta the page holds for it IS the derived
   * meta — injecting that same meta must therefore change nothing. Without
   * this, `--camera derived` on a PROMOTED facing is a mechanism nothing can
   * check, because the page never holds a derived meta there. */
  test("injecting a meta is faithful, where the page's own meta is the same meta", async ({ page }) => {
    await boot(page);
    await installPageHelpers(page, RENDER_SRC);
    const derived = deriveMeta(PLAN, "study", "E");
    const r = await page.evaluate(async ([key, derived]) => {
      const native = await window.__decode(window.__renderPng(
        { key, meta: null, mode: "scaffold", marks: null, G: null }));
      const inj = await window.__decode(window.__renderPng(
        { key, meta: derived, mode: "scaffold", marks: null, G: null }));
      return {
        native: window.__hashBuf(window.__bufOf(native)),
        injected: window.__hashBuf(window.__bufOf(inj)),
        pageFocal: (function () {
          const m = window.HOLO_APP.backdrops[key].meta;
          return m.px_per_m_at_wall * m.camera_wall_m;
        })()
      };
    }, ["study/E", derived]);
    expect(r.injected,
      "the injected derived meta did not draw what the page's own derived meta draws — the injection mechanism is not faithful")
      .toBe(r.native);
    expect(r.pageFocal).toBeCloseTo(groundplane.FOCAL_PX, 6);
  });

  /* ---------------------------------------------------------------- §7.4 */
  test("the committed scaffolds are what the generator draws today", async ({ page }) => {
    await boot(page);
    await installPageHelpers(page, RENDER_SRC);
    for (const key of ["study/N", "study/E"]) {
      const [loc, f] = key.split("/");
      const side = JSON.parse(readFileSync(join(BATCH, `${loc}-${f}.scaffold.json`), "utf8"));
      const marks = marksOf(side);
      const { GLYPH_TABLE: G } = await import("../../tools/make-scaffold.mjs");
      for (const [name, file] of [["frame", side.outputs.frame], ["scaffold", side.outputs.scaffold]]) {
        const committed = "data:image/png;base64," +
          readFileSync(join(repoRoot, file)).toString("base64");
        const same = await page.evaluate(async ([committed, arg]) => {
          const a = await window.__decode(committed);
          const b = await window.__decode(window.__renderPng(arg));
          return window.__hashBuf(window.__bufOf(a)) === window.__hashBuf(window.__bufOf(b));
        }, [committed, {
          key, meta: side.meta_used, mode: "scaffold",
          marks: name === "frame" ? null : marks, G,
          /* [row 43(a)] THE SHEET IS READ OUT OF THE SIDECAR, and these two
             sidecars carry none — which IS the migration promise: a scaffold cut
             before the sheet existed re-renders as `grid-v1`, to the byte, and
             this case is what holds the promise. */
          style: side.scaffold_style || null,
          ink: side.ink_geometry || null,
          sheet: (side.ink_geometry && side.ink_geometry.sheet) || SHEET
        }]);
        expect(same,
          `${file} is not what the generator draws today — it was edited by hand, or the generator moved`)
          .toBe(true);
      }
    }
  });

  /* THE LABEL PASS TOUCHES ONLY WHAT THE SIDECAR DECLARES. Diff the bare frame
   * against the labelled scaffold; every differing pixel must lie inside a
   * rect that was computed in node BEFORE the page opened — the carrier boxes,
   * their label and note rects, the firebox ticks, the chair-rail band and the
   * legend. A label drifted onto the wall goes red here instead of needing an
   * eye, which is what this row's whole doctrine rests on. */
  test("the label pass draws only inside the rects the sidecar declares", async ({ page }) => {
    await boot(page);
    await installPageHelpers(page, RENDER_SRC);
    const { GLYPH_TABLE } = await import("../../tools/make-scaffold.mjs");
    for (const key of ["study/N", "study/E"]) {
      const [loc, f] = key.split("/");
      const side = JSON.parse(readFileSync(join(BATCH, `${loc}-${f}.scaffold.json`), "utf8"));
      const allow = [];
      const pad = 4;                       // the stroke is up to 3 px wide, plus AA
      for (const s of side.stamped) {
        allow.push({ x0: s.x0 - pad, y0: s.y0 - pad, x1: s.x1 + pad, y1: s.y1 + pad });
        for (const r of [s.label_rect, s.note_rect]) {
          if (r) allow.push({ x0: r.x - pad, y0: r.y - pad, x1: r.x + r.w + pad, y1: r.y + r.h + pad });
        }
        if (s.ticks) {
          for (const t of s.ticks) allow.push({ x0: t - pad, y0: s.y0, x1: t + pad, y1: s.y1 + pad });
        }
      }
      const cr = side.chair_rail;
      const crLabelH = 18;
      allow.push({
        x0: cr.x0 - pad, y0: cr.y - pad,
        x1: cr.x1 + pad, y1: cr.y + 10 + crLabelH + pad
      });
      allow.push({
        x0: cr.x0, y0: cr.y + 10 - pad,
        x1: cr.x0 + 12 + textBox(chairRail(side.meta_used).label, crLabelH) + pad,
        y1: cr.y + 10 + crLabelH + pad
      });
      const lb = side.legend_box;
      allow.push({ x0: lb.x - pad, y0: lb.y - pad, x1: lb.x + lb.w + pad, y1: lb.y + lb.h + pad });

      const marks = marksOf(side);
      const r = await page.evaluate(async ([key, meta, marks, G, allow, sheetArg]) => {
        const a = await window.__decode(window.__renderPng(
          { key, meta, mode: "scaffold", marks: null, G: null, ...sheetArg }));
        const b = await window.__decode(window.__renderPng(
          { key, meta, mode: "scaffold", marks, G, ...sheetArg }));
        const A1 = window.__bufOf(a), B1 = window.__bufOf(b);
        let diff = 0, outside = 0, first = null;
        for (let i = 0; i < A1.length; i += 4) {
          if (A1[i] !== B1[i] || A1[i + 1] !== B1[i + 1] || A1[i + 2] !== B1[i + 2] || A1[i + 3] !== B1[i + 3]) {
            diff++;
            const p = i / 4, x = p % 1536, y = (p / 1536) | 0;
            if (!allow.some((q) => x >= q.x0 && x <= q.x1 && y >= q.y0 && y <= q.y1)) {
              outside++;
              if (!first) first = { x0: x, y0: y, x1: x, y1: y };
              else { first.x0 = Math.min(first.x0, x); first.x1 = Math.max(first.x1, x);
                     first.y0 = Math.min(first.y0, y); first.y1 = Math.max(first.y1, y); }
            }
          }
        }
        return { diff, outside, first };
      }, [key, side.meta_used, marks, GLYPH_TABLE, allow, {
        style: side.scaffold_style || null, ink: side.ink_geometry || null, sheet: (side.ink_geometry && side.ink_geometry.sheet) || SHEET
      }]);
      expect(r.diff, `${key}: the label pass drew nothing at all`).toBeGreaterThan(1000);
      expect(r.outside,
        `${key}: ${r.outside} label pixels fall outside every declared rect` +
        (r.first ? ` (bounding ${r.first.x0},${r.first.y0} .. ${r.first.x1},${r.first.y1})` : ""))
        .toBe(0);
    }
  });

  /* ---------------------------------------------------------------- §7.5 */
  /* The stamped rects, recomputed here from `facingCarriers` and
   * `groundplane` rather than by calling the tool's own function — so the
   * tool cannot agree with itself. */
  test("the stamped rects are the plan's, recomputed independently", async () => {
    for (const key of ["study/N", "study/E"]) {
      const [loc, f] = key.split("/");
      const side = JSON.parse(readFileSync(join(BATCH, `${loc}-${f}.scaffold.json`), "utf8"));
      const meta = side.meta_used;
      const carriers = facingCarriers(PLAN, loc, f);
      expect(side.stamped.length, `${key}: the scaffold stamps a different number of carriers than the plan holds`)
        .toBe(carriers.length);
      const centre = groundplane.wallCentrePx(meta, 1536);
      const floorY = meta.floor_line_y * meta.image_h_px;
      for (let i = 0; i < carriers.length; i++) {
        const c = carriers[i], s = side.stamped[i];
        const x0 = centre + (c.from_m - meta.wall_width_m / 2) * meta.px_per_m_at_wall;
        const x1 = centre + (c.to_m - meta.wall_width_m / 2) * meta.px_per_m_at_wall;
        expect(s.x0, `${key} ${c.kind}: left edge`).toBeCloseTo(x0, 1);
        expect(s.x1, `${key} ${c.kind}: right edge`).toBeCloseTo(x1, 1);
        /* THE BOX IS EXACTLY ITS RULED WIDTH AT THE META'S OWN SCALE. This is
         * what makes an obeying candidate score: the gate converts pixels to
         * metres with `px_per_m_at_wall` and nothing else. */
        expect((s.x1 - s.x0) / meta.px_per_m_at_wall, `${key} ${c.kind}: the box is not its ruled width`)
          .toBeCloseTo(c.to_m - c.from_m, 3);
        /* AND IT IS CENTRE-ANCHORED. A corner-anchored stamp is 68 px away on
         * `study/N` — 21 % of that wall's carrier tolerance — and `drawGrid`
         * draws its own metre lines centre-anchored, so this is the renderer's
         * choice and not a taste. */
        const cornerAnchored = meta.corner_x0_px + c.from_m * meta.px_per_m_at_wall;
        if (Math.abs(cornerAnchored - x0) > 2) {
          expect(Math.abs(s.x0 - cornerAnchored), `${key} ${c.kind}: stamped corner-anchored, not centre-anchored`)
            .toBeGreaterThan(2);
        }
      }
      /* The chair-rail: blueprint §11's universal anchor. */
      expect(side.chair_rail.y, `${key}: the chair-rail is not at 0.95 m above the floor line`)
        .toBeCloseTo(floorY - 0.95 * meta.px_per_m_at_wall, 1);
    }
    /* THE ANCHOR AGREES WITH THE GROUND TRUTH, to the pixel. The reference
     * painting's own measured `dado_rail_y_px` is 570 and the scaffold stamps
     * its rail at 570.0. If this ever parts, the generator is wrong before any
     * image is made. */
    const sideN = JSON.parse(readFileSync(join(BATCH, "study-N.scaffold.json"), "utf8"));
    const ref = JSON.parse(readFileSync(join(MEASURED, "cand5ref", "study-N.json"), "utf8"));
    /* The reference's own calibration datum is the rail's UNDERCUT, recorded as
       `dado_rail_above_floor_px` (179) below its floor line (749) — 570, which
       is where the scaffold stamps 0.95 m. The rail's painted TOP edge is 561
       and is a different feature; comparing to it needed a fudge, which is how
       this assertion was first written and is exactly the kind of number this
       project refuses. */
    expect(sideN.chair_rail.y, "the scaffold's chair-rail has parted from the reference painting's own")
      .toBeCloseTo(ref._measured_px.wall_floor_line_y_px - ref._measured_px.dado_rail_above_floor_px, 1);
  });

  /* Label paths the manor run needs. `study/E`'s door is now dispatched
   * product; `hall/E`'s window is not, and is exercised here so the path is
   * not first run on a wall nobody checked. */
  test("the door and window label paths both produce a ruled box", async () => {
    for (const [loc, f, kind] of [["study", "E", "door"], ["hall", "E", "window"]]) {
      const meta = deriveMeta(PLAN, loc, f);
      const { rects } = scaffoldRects(PLAN, loc, f, meta);
      const got = rects.find((r) => r.kind === kind);
      expect(got, `${loc}/${f} has no ${kind} rect — the ${kind} label path is unexercised`).toBeTruthy();
      expect(got.x1).toBeGreaterThan(got.x0);
      expect(got.y1).toBeGreaterThan(got.y0);
      assertLabelChars(got.label, "a label");
      assertLabelChars(got.sub, "a dimension line");
    }
  });

  /* Every label character is in the stroked table — so no label can quietly
   * fall back to a font and make the scaffold un-re-renderable elsewhere. */
  test("every emitted label is in the stroked glyph set", async () => {
    for (const key of ["study/N", "study/E"]) {
      const [loc, f] = key.split("/");
      const side = JSON.parse(readFileSync(join(BATCH, `${loc}-${f}.scaffold.json`), "utf8"));
      for (const s of side.stamped) {
        assertLabelChars(s.label, `${key} label`);
        assertLabelChars(s.sub, `${key} note`);
      }
      expect(() => assertLabelChars("A LABEL WITH AN APOSTROPHE'S", "the guard itself")).toThrow();
    }
  });

  /* ---------------------------------------------------------------- §7.6 */
  /* The meta recipe is pinned to an artifact the OTHER tool produced: fed the
   * cand5ref reading, `metaFromReading` must reproduce the committed promoted
   * meta field for field on every geometry field. */
  test("metaFromReading reproduces the meta promote-backdrop actually wrote", async () => {
    const reading = JSON.parse(readFileSync(join(MEASURED, "cand5ref", "study-N.json"), "utf8"));
    const got = metaFromReading(reading, PLAN, "study", "N");
    const want = JSON.parse(readFileSync(join(repoRoot, "backdrops", "study", "N.meta.json"), "utf8"));
    for (const k of ["floor_line_y", "px_per_m_at_wall", "px_per_m_at_bottom", "wall_width_m",
      "image_h_px", "horizon_y", "camera_wall_m", "corner_x0_px", "corner_x1_px",
      "storey_height_m", "calibration_px", "key_dir", "key_tint", "facing_type"]) {
      expect(got[k], `metaFromReading disagrees with the committed promoted meta on ${k}`).toEqual(want[k]);
    }
  });

  /* ---------------------------------------------------------------- §7.7 */
  /* THE BRACKETS ARE THE REAL FREE PARAMETER, and they are derived rather than
   * chosen: every width is the standing ±8 % propagated through a geometry the
   * scaffold declares. Recomputed here from the band and the meta alone. */
  test("every detector bracket is the standing band propagated, not a number someone picked", async () => {
    const { MEASURED_BAND } = await import("../../tools/validate-fixtures.mjs");
    for (const key of ["study/N", "study/E"]) {
      const [loc, f] = key.split("/");
      const side = JSON.parse(readFileSync(join(BATCH, `${loc}-${f}.scaffold.json`), "utf8"));
      const m = side.meta_used, b = side.brackets;
      expect(b.band, `${key}: the round brought its own band`).toBe(MEASURED_BAND);
      const floorY = m.floor_line_y * m.image_h_px;
      const sep = floorY - m.horizon_y * m.image_h_px;
      expect(b.floor_window.half_width).toBeCloseTo(MEASURED_BAND * sep, 2);
      expect(b.rail_band.half_width).toBeCloseTo(MEASURED_BAND * 0.95 * m.px_per_m_at_wall, 2);
      if (b.ceiling_band) {
        expect(b.ceiling_band.half_width).toBeCloseTo(MEASURED_BAND * m.storey_height_m * m.px_per_m_at_wall, 2);
      }
      /* And the carrier window is the stamped box dilated by THIS WALL's own
       * measured reflex-versus-plan separation — read from the corpus, never
       * typed, so row 22 moving `study/N`'s hearth moves it too. */
      for (let i = 0; i < side.stamped.length; i++) {
        expect(b.carrier_windows[i].x0).toBeCloseTo(side.stamped[i].x0 - b.carrier_tolerance_px, 1);
        expect(b.carrier_windows[i].x1).toBeCloseTo(side.stamped[i].x1 + b.carrier_tolerance_px, 1);
      }
    }
    /* The two walls carry DIFFERENT tolerances because they are different
     * measurements, and the plan's whole argument for the second wall is that
     * `study/E`'s is a separation and `study/N`'s is nearly a coincidence. */
    const n = JSON.parse(readFileSync(join(BATCH, "study-N.scaffold.json"), "utf8"));
    const e = JSON.parse(readFileSync(join(BATCH, "study-E.scaffold.json"), "utf8"));
    expect(n.brackets.carrier_tolerance_px).toBeCloseTo(324.4, 1);
    expect(e.brackets.carrier_tolerance_px).toBeCloseTo(226.1, 1);
  });

  /* study/E's probe, asserted as a number rather than as an argument: the
   * plan's door and the painting's door barely overlap, which is what makes
   * this wall able to tell obedience from reflex. */
  test("study/E's carrier probe separates obedience from reflex", async () => {
    const side = JSON.parse(readFileSync(join(BATCH, "study-E.scaffold.json"), "utf8"));
    const reading = JSON.parse(readFileSync(join(MEASURED, "cand6", "study-E.json"), "utf8"));
    const painted = [reading._measured_px.opening_x0_px, reading._measured_px.opening_x1_px];
    const box = side.stamped.find((s) => s.kind === "door");
    const overlap = Math.max(0, Math.min(painted[1], box.x1) - Math.max(painted[0], box.x0));
    const width = box.x1 - box.x0;
    expect(overlap / width,
      "the reflex door and the stamped door overlap too much for this wall to discriminate")
      .toBeLessThan(0.15);
    /* And the reflex really is a CENTRING, which is the thing the label has to
     * overcome: the painted opening's centre sits on the frame's own. */
    const paintedCentre = (painted[0] + painted[1]) / 2;
    const wallCentre = (reading.corner_x0_px + reading.corner_x1_px) / 2;
    expect(Math.abs(paintedCentre - wallCentre)).toBeLessThan(6);
  });

  /* ---------------------------------------------------------------- §7.8 */
  /* `assignment.json` is the only map from an opaque return id to the cell
   * that produced it, and it must never change after the readings exist. The
   * check is BLOB IMMUTABILITY at the commit that introduced it, not commit
   * ordering — ordering can be satisfied by a rebase. It arms itself when P1
   * writes the file. */
  /* BOTH MAPS, and the second exists BECAUSE of this case. Technique (4) needed
   * four more ids after the first twenty-eight had been measured, and appending
   * them to `assignment.json` would have broken the one discipline that makes a
   * map trustworthy — so the extension is a second file with the same rule
   * rather than an edit to a file that may not change. */
  for (const rel of ["design/plan-draft/measured/row23/assignment.json",
    "design/plan-draft/measured/row23/assignment-2.json"]) {
  test(`${rel.split("/").pop()} has never changed since it was added`, async () => {
    if (!existsSync(join(repoRoot, rel))) {
      test.info().annotations.push({
        type: "pending",
        description: `${rel} does not exist yet — P1 writes it, and this case arms itself then`
      });
      return;
    }
    const introduced = execFileSync("git",
      ["-C", repoRoot, "log", "--diff-filter=A", "--format=%H", "--", rel],
      { encoding: "utf8" }).trim().split("\n").filter(Boolean).pop();
    expect(introduced, `${rel} is untracked — the map must be committed BEFORE any candidate is measured`).toBeTruthy();
    const then = execFileSync("git", ["-C", repoRoot, "rev-parse", `${introduced}:${rel}`], { encoding: "utf8" }).trim();
    const now = execFileSync("git", ["-C", repoRoot, "hash-object", join(repoRoot, rel)], { encoding: "utf8" }).trim();
    expect(now,
      `${rel} has changed since the commit that introduced it — the technique map cannot be edited once readings exist`)
      .toBe(then);
  });
  }

  /* --------------------------------------------------------------- §7.13 */
  /* THE ROW-26 HANDSHAKE, MECHANICAL. A note in a spec file is deleted with
   * the spec file; this goes red when row 26 closes and the fence survives. */
  test("PENDING_ROWS names only rows that are still open", async () => {
    const intention = readFileSync(join(repoRoot, "design", "intention.md"), "utf8");
    const open = new Set();
    for (const line of intention.split("\n")) {
      const m = /^\|\s*(\d+)\s*\|/.exec(line);
      if (m) open.add(Number(m[1]));
    }
    expect(open.size, "no rows parsed out of design/intention.md — this case has gone blind").toBeGreaterThan(0);
    for (const [facing, row] of Object.entries(PENDING_ROWS)) {
      expect(open.has(row),
        `make-scaffold still refuses ${facing} for row ${row}, but row ${row} has left the spec list — ` +
        `that row's closing commit was supposed to delete this fence`)
        .toBe(true);
    }
  });

  test("the fenced facings are refused, and the refusal names its row", async () => {
    for (const facing of Object.keys(PENDING_ROWS)) {
      let out = "";
      try {
        execFileSync("node", [join(repoRoot, "tools", "make-scaffold.mjs"), facing],
          { cwd: repoRoot, encoding: "utf8", stdio: "pipe" });
        out = "(exited zero)";
      } catch (e) { out = String(e.stdout || "") + String(e.stderr || ""); }
      expect(out, `${facing} was not refused, or the refusal does not name row ${PENDING_ROWS[facing]}`)
        .toMatch(new RegExp(`row ${PENDING_ROWS[facing]}`));
    }
  });
});

/* ==================================================================== */
/* Row 43(a) — the sheet the scaffold is drawn on                         */
/* ==================================================================== */
/* WHAT THIS BLOCK GUARDS IS A FINDING, not a preference. Two returns on
 * 2026-08-25 read the diagram as the picture: `master_bedchamber/N`, asked cold
 * with only the scaffold attached, came back a flat modern render in the
 * DIAGRAM's dark grey; `servants_hall/E`'s retry-4 packet — one scaffold, two
 * dashed boxes labelled WINDOW and FIREPLACE, no Image 1 — came back with two
 * dark doorways standing exactly where those boxes stood. The sheet answers
 * both: paper, thin ink where surfaces meet, outlined boxes with a hatched
 * interior, no tone anywhere. The cases below hold each half of that sentence
 * against pixels rather than against the description. */
const INK_BATCH = join(repoRoot, "design", "batches", "scaffold-ink", "gen1");
const INK_WALLS = SCAFFOLD_TRIAL.walls.map((w) => w.key);

test.describe("row 43(a) — the ink-on-paper sheet", () => {
  test.skip(({ browserName }) => browserName !== "chromium",
    "a claim about one canvas has no second engine");

  /* ---------------------------------------------------------------- 43(a).1 */
  /* THE LINES ARE THE ROOM'S OWN, recomputed here from `groundplane` and the
   * meta rather than by calling the drawing's own function — so the sheet
   * cannot agree with itself. A drawing whose floor line is not the floor line
   * is a drawing that teaches a painter the wrong room, and the whole claim of
   * this style is that only the SHEET changed. */
  test("every ink line is a junction the renderer's own geometry puts there", () => {
    for (const key of [...INK_WALLS, "study/N", "study/E", "hall/E", "entrance_court/S"]) {
      const [loc, f] = key.split("/");
      const meta = deriveMeta(PLAN, loc, f);
      const ink = inkGeometry(meta);
      const g = frameGeometry(meta);
      const floorY = meta.floor_line_y * meta.image_h_px;
      const eyeY = meta.horizon_y * meta.image_h_px;
      const at = (what) => ink.lines.find((l) => l.what === what);
      expect(ink.floor_line_y_px, `${key}: the sheet's floor row is not the meta's`)
        .toBeCloseTo(floorY, 1);
      expect(ink.eye_line_y_px, `${key}: the sheet's eye row is not the meta's horizon`)
        .toBeCloseTo(eyeY, 1);
      const eye = at("the eye line - where the receding lines meet");
      if (meta.facing_type === "open") {
        expect(eye, `${key} is open and has no band, and the renderer draws no eye line on it`)
          .toBeUndefined();
      } else {
        expect(eye, `${key}: the eye line is missing`).toBeTruthy();
        expect(eye.y0).toBeCloseTo(eyeY, 1);
        expect(eye.dash, `${key}: the eye line is solid, which reads as a string course`).toBeTruthy();
      }
      if (!(g.bounded && meta.facing_type !== "open")) {
        expect(at("the left corner, where the two walls meet"),
          `${key} is unbounded and the sheet drew it a corner`).toBeUndefined();
        continue;
      }
      /* The corners ARE `corner_x0_px`/`corner_x1_px` — `xAtScale(0|1)` at wall
         scale, which is where the staging's u-domain ends and where the
         renderer strokes them. */
      expect(at("the left corner, where the two walls meet").x0)
        .toBeCloseTo(meta.corner_x0_px, 1);
      expect(at("the right corner, where the two walls meet").x0)
        .toBeCloseTo(meta.corner_x1_px, 1);
      const wf = at("the line where the wall you face meets the floor");
      expect(wf.x0).toBeCloseTo(meta.corner_x0_px, 1);
      expect(wf.x1).toBeCloseTo(meta.corner_x1_px, 1);
      expect(wf.y0).toBeCloseTo(floorY, 1);
      /* The side walls leave the picture where `frameGeometry` says they do,
         which is where `drawGrid`'s two majors leave it. */
      for (const [side, name] of [["left", "the line where the left side wall meets the floor"],
        ["right", "the line where the right side wall meets the floor"]]) {
        const l = at(name);
        expect(l, `${key}: the ${side} return's floor junction is missing`).toBeTruthy();
        expect(l.x1).toBeCloseTo(g[side].floor.to.x, 1);
        expect(l.y1).toBeCloseTo(g[side].floor.to.y, 1);
      }
      if (meta.storey_height_m > 0) {
        const wc = at("the line where the wall you face meets the ceiling");
        expect(wc, `${key}: the room has a storey height and the sheet drew no ceiling line`).toBeTruthy();
        expect(wc.y0).toBeCloseTo(floorY - meta.storey_height_m * meta.px_per_m_at_wall, 1);
      }
      /* AND THE GRID IS GONE. A rank of dark verticals standing floor to ceiling
         across a wall is panelling (row 41's own defect), so the sheet carries
         the scale as ticks on the floor line and nothing else. */
      const verticals = ink.lines.filter((l) => l.x0 === l.x1 && l.y0 < floorY - 1);
      expect(verticals.length,
        `${key}: the sheet draws ${verticals.length} verticals standing on the wall (${verticals.map((l) => l.what).join("; ")}) — only the two corners may, because a rank of them is panelling`)
        .toBe(2);
      expect(ink.ticks.length, `${key}: the sheet carries no metre ticks, so it states a scale nothing shows`)
        .toBeGreaterThan(1);
    }
  });

  /* ---------------------------------------------------------------- 43(a).2 */
  /* THE MIGRATION PROMISE, mechanically: a sidecar that names no sheet renders
   * exactly what `grid-v1` renders, to the byte. §7.4 above already re-renders
   * the two committed row-23 scaffolds through the absent-style path; this is
   * the other direction — naming the old sheet must change nothing. */
  test("naming `grid-v1` renders exactly what naming no sheet at all renders", async ({ page }) => {
    await boot(page);
    await installPageHelpers(page, RENDER_SRC);
    const { GLYPH_TABLE } = await import("../../tools/make-scaffold.mjs");
    for (const key of ["study/N", "study/E"]) {
      const [loc, f] = key.split("/");
      const side = JSON.parse(readFileSync(join(BATCH, `${loc}-${f}.scaffold.json`), "utf8"));
      const marks = marksOf(side);
      const r = await page.evaluate(async ([key, meta, marks, G, sheet]) => {
        const a = await window.__decode(window.__renderPng(
          { key, meta, mode: "scaffold", marks, G }));
        const b = await window.__decode(window.__renderPng(
          { key, meta, mode: "scaffold", marks, G, style: "grid-v1", ink: null, sheet }));
        return { a: window.__hashBuf(window.__bufOf(a)), b: window.__hashBuf(window.__bufOf(b)) };
      }, [key, side.meta_used, marks, GLYPH_TABLE, SHEET]);
      expect(r.b, `${key}: naming the old sheet is not the same as naming none — every committed scaffold's re-render depends on those being one thing`)
        .toBe(r.a);
    }
    expect(SCAFFOLD_STYLES).toContain("grid-v1");
    expect(() => assertScaffoldStyle("ink-on-paper-v3")).toThrow(/unknown scaffold style/);
  });

  /* ---------------------------------------------------------------- 43(a).3 */
  /* THE COMMITTED INK SHEETS ARE WHAT THE GENERATOR DRAWS TODAY, re-rendered
   * from their own sidecars — §7.4's discipline for the new sheet. The ink
   * geometry in the sidecar is what the page is handed, and it must also BE
   * `inkGeometry`'s own answer, so the record and the tool are pinned to one
   * another rather than to a memory of one another. */
  test("the committed ink scaffolds re-render from their sidecars, to the byte", async ({ page }) => {
    await boot(page);
    await installPageHelpers(page, RENDER_SRC);
    const { GLYPH_TABLE } = await import("../../tools/make-scaffold.mjs");
    for (const key of INK_WALLS) {
      const dir = join(INK_BATCH, key.replace("/", "-"));
      const side = JSON.parse(readFileSync(join(dir, "sidecar.json"), "utf8"));
      expect(side.scaffold_sheets["scaffold-ink.png"],
        `${key}: the sidecar does not declare the ink sheet`).toBe("ink-on-paper-v2");
      expect(side.ink_geometry,
        `${key}: the sidecar declares an ink sheet and records none of its lines`).toBeTruthy();
      /* THE RECORD IS COMPLETE, PALETTE INCLUDED, and it is the palette the
         tool draws with today — so a change to `SHEET` is a red case naming the
         artifacts to re-cut rather than a re-render that quietly differs. */
      expect(side.ink_geometry.sheet,
        `${key}: the sidecar's palette is not the one make-scaffold draws with`).toEqual(SHEET);
      expect(JSON.parse(JSON.stringify(inkGeometry(side.meta_used))),
        `${key}: the sidecar's line work is not what inkGeometry produces from the same meta`)
        .toEqual(side.ink_geometry);
      const marks = scaffoldMarks(makeCtx(PLAN, key, side.meta_used));
      const committed = "data:image/png;base64," +
        readFileSync(join(dir, "scaffold-ink.png")).toString("base64");
      const same = await page.evaluate(async ([committed, arg]) => {
        const a = await window.__decode(committed);
        const b = await window.__decode(window.__renderPng(arg));
        return window.__hashBuf(window.__bufOf(a)) === window.__hashBuf(window.__bufOf(b));
      }, [committed, {
        key, meta: side.meta_used, mode: "scaffold", marks, G: GLYPH_TABLE,
        style: "ink-on-paper-v2", ink: side.ink_geometry, sheet: side.ink_geometry.sheet
      }]);
      expect(same, `${key}: scaffold-ink.png is not what the generator draws from its own sidecar`)
        .toBe(true);
    }
  });

  /* ---------------------------------------------------------------- 43(a).4 */
  /* THE CLAIM ITSELF, IN PIXELS: no dark ground, and no carrier box a painter
   * can read as a hole. The SAME two measurements are taken on `grid-v1`, which
   * is what makes this a measurement rather than a threshold chosen to pass —
   * the old sheet has to fail both, and it does, by a wide margin. */
  test("the sheet has no dark ground and no filled box, and the old sheet has both", async ({ page }) => {
    await boot(page);
    await installPageHelpers(page, RENDER_SRC);
    const { GLYPH_TABLE } = await import("../../tools/make-scaffold.mjs");
    const MEASURE = async function (arg) {
      const cv = await window.__decode(window.__renderPng(arg.render));
      const d = window.__bufOf(cv);
      const lum = (i) => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      let light = 0, n = 0;
      for (let i = 0; i < d.length; i += 4) { if (lum(i) >= 190) light++; n++; }
      const boxes = arg.rects.map((r) => {
        /* INSET PAST THE OUTLINE. The claim is about the box's INTERIOR: a
           dashed outline is ink and is supposed to be dark. */
        const x0 = Math.ceil(r.x0) + 8, x1 = Math.floor(r.x1) - 8;
        const y0 = Math.ceil(r.y0) + 8, y1 = Math.floor(r.y1) - 8;
        let sum = 0, k = 0;
        for (let y = y0; y < y1; y++) {
          for (let x = x0; x < x1; x++) { sum += lum((y * 1536 + x) * 4); k++; }
        }
        return { kind: r.kind, mean: k ? sum / k : null, px: k };
      });
      return { light_share: light / n, boxes };
    };
    for (const key of INK_WALLS) {
      const dir = join(INK_BATCH, key.replace("/", "-"));
      const side = JSON.parse(readFileSync(join(dir, "sidecar.json"), "utf8"));
      const ctx = makeCtx(PLAN, key, side.meta_used);
      const marks = scaffoldMarks(ctx);
      const rects = ctx.rects.map((r) => ({ kind: r.kind, x0: r.x0, x1: r.x1, y0: r.y0, y1: r.y1 }));
      expect(rects.length, `${key} carries no carrier, so this case would prove nothing on it`)
        .toBeGreaterThan(0);
      const base = { key, meta: side.meta_used, mode: "scaffold", marks, G: GLYPH_TABLE };
      const v2 = await page.evaluate(MEASURE,
        { render: { ...base, style: "ink-on-paper-v2", ink: side.ink_geometry, sheet: side.ink_geometry.sheet }, rects });
      const v1 = await page.evaluate(MEASURE, { render: base, rects });

      expect(v2.light_share,
        `${key}: only ${(100 * v2.light_share).toFixed(1)} % of the ink sheet is paper — a sheet with a ground has a palette on it`)
        .toBeGreaterThan(0.9);
      expect(v1.light_share,
        `${key}: the grid sheet is ${(100 * v1.light_share).toFixed(1)} % light, so this measurement no longer separates the two sheets and has gone blind`)
        .toBeLessThan(0.1);
      for (let i = 0; i < rects.length; i++) {
        expect(v2.boxes[i].mean,
          `${key}: the ${rects[i].kind} box's interior reads ${v2.boxes[i].mean.toFixed(0)} on the ink sheet — a filled box is an opening, which is exactly what servants_hall/E painted`)
          .toBeGreaterThan(190);
        expect(v1.boxes[i].mean,
          `${key}: the ${rects[i].kind} box on the GRID sheet reads ${v1.boxes[i].mean.toFixed(0)}, which is not dark — the finding this row answers is no longer visible and this case has gone blind`)
          .toBeLessThan(90);
      }
    }
  });

  /* ---------------------------------------------------------------- 43(a).5 */
  /* THE WORDS AND THE PICTURE MOVE TOGETHER. The register's one sentence about
   * the layout image describes the sheet, so an emitter that cuts one sheet and
   * a composer that describes the other is a packet whose prompt is about a
   * picture that is not in it. Production says the drawing; the control arm,
   * which attaches the old sheet, says what was actually sent. */
  test("the register's sentence about the layout image names the sheet the packet carries", () => {
    for (const key of INK_WALLS) {
      const [loc, f] = key.split("/");
      const meta = deriveMeta(PLAN, loc, f);
      const { rects } = scaffoldRects(PLAN, loc, f, meta);
      const production = manorPrompt(PLAN, key, meta, rects);
      expect(SCAFFOLD_STYLE_DEFAULT, "production no longer cuts the sheet its words describe")
        .toBe("ink-on-paper-v2");
      expect(production, `${key}: the production ask does not say what the layout image IS`)
        .toContain("is a line drawing in ink on paper: its lines are where surfaces meet and " +
          "its outlined boxes are where the named features stand; nothing in it is a colour, " +
          "a material or an opening to paint");
      expect(production, `${key}: the production ask still points at the old sheet's dark colours`)
        .not.toContain("flat dark colours");
      /* THE CONTROL ARM IS THE ASK THAT WAS SENT, and it must still say the old
         sentence beside the old picture — otherwise the trial's two arms differ
         in three things and the pair is not an ablation of anything. */
      const grid = ARMS["s1-grid-sheet"].prompt(makeCtx(PLAN, key, meta));
      const ink = ARMS["s2-ink-sheet"].prompt(makeCtx(PLAN, key, meta));
      expect(grid).toContain("lines, boxes and lettering are instructions rather than things to paint");
      expect(grid).toContain("flat dark colours");
      expect(ink).toContain("is a line drawing in ink on paper");
      /* ONE CHANGE, AND IT IS TWO LINES. Every other line of the two arms'
         prompts is identical, which is what makes the pair readable. */
      const a = grid.split("\n"), b = ink.split("\n");
      expect(a.length, `${key}: the two arms' prompts are different lengths`).toBe(b.length);
      const moved = a.filter((l, i) => l !== b[i]);
      expect(moved.length,
        `${key}: ${moved.length} lines differ between the two arms, and only the two sentences about the layout image may:\n${moved.join("\n")}`)
        .toBe(2);
      for (const key2 of ARMS["s1-grid-sheet"].images()) expect(key2).toBe("scaffold.png");
      expect(ARMS["s2-ink-sheet"].images()).toEqual(["scaffold.png"]);
    }
  });
});

/** The marks the generator drew, rebuilt from the sidecar it wrote. */
function marksOf(side) {
  return {
    rects: side.stamped.map((s) => ({
      x0: s.x0, x1: s.x1, y0: s.y0, y1: s.y1, label: s.label, sub: s.sub,
      ticks: s.ticks, label_rect: s.label_rect, note_rect: s.note_rect
    })),
    chair_rail: { ...side.chair_rail, label: chairRail(side.meta_used).label },
    legend: legendOf(side)
  };
}

/** The legend the generator wrote — read from the sidecar, which now carries
 *  its own lines, so the suite cannot drift from the tool by re-deriving them. */
function legendOf(side) {
  return side.legend_box;
}
