#!/usr/bin/env node
/* make-scaffold.mjs — the annotated spatial scaffold for one facing.
 *
 *   node tools/make-scaffold.mjs study/N --out design/batches/row23-scaffold
 *   node tools/make-scaffold.mjs study/E --camera reading --round cand6 --out <dir>
 *
 * Blueprint §11b [HUMAN, 2026-08-22]: "Both a text description and a reference
 * image, that looks similar to the hollow grid, but may even have elements that
 * we need that have a text word in a certain space. For example, the word bird
 * in a place where we would want to see a bird."
 *
 * Writes three files per facing:
 *   <loc>-<facing>-frame.png       the bare grid frame, from the SHIPPED renderer
 *   <loc>-<facing>-scaffold.png    the same frame with the plan's carriers stamped
 *   <loc>-<facing>.scaffold.json   the sidecar: every number, and where it came from
 *
 * THE FRAME IS NOT DRAWN HERE. It is `src/renderer.js`'s own `render()`, called
 * in a real page over the real baked world, into a detached canvas. This file
 * contributes exactly one thing to the picture: the label pass in `stampLabels`,
 * which runs AFTER the frame and whose every mark is confined to the rects the
 * sidecar declares. `tests/playwright/scaffold.spec.mjs` asserts both halves —
 * the frame against the live `#scene`, and the label pass against those rects.
 *
 * TWO RENDERS, AND THE REASON THEY DIFFER. `nav-manor` stages no objects, so no
 * aperture carries a leaf and every doorway draws the room beyond it (`study/E`
 * shows 8.6 m of passage, `hall/W` 6.05 m). A scaffold must show a doorway and
 * not the room through it, so the scaffold render passes `no_through: true`
 * while the page passes `{}`. Comparing those two would be comparing different
 * pictures, so `--verify` renders at the page's own options and that is what the
 * hash test uses; the aperture-confinement of the difference is its own case.
 *
 * ONE HORIZONTAL SPACE FOR EVERY METRIC MARK, AND THE RENDERER IS ITS AUTHORITY.
 * `drawGrid` draws its own metre lines at `wallCentrePx + m × px_per_m_at_wall`,
 * so a carrier stamped that way lands ON the grid lines of its own scaffold. The
 * other mapping — `groundplane.xAtScale`, which spans u across the measured
 * CORNER span — is where a promoted wall's click target lives, and on a wall
 * whose painting is wider than the plan rules the two differ (13.25 % on
 * `study/N`, 18.4 % on `study/E`, 26.0 % on `study/W`). A scaffold is an
 * instruction to a painter whose obedience the gate scores, and an instruction
 * the gate punishes for being obeyed is not an instruction — so every metric
 * mark, DOORS INCLUDED, is stamped in ruler space, and the sidecar records the
 * aperture rect beside it. Which rectangle a PROMOTED door answers to is row
 * 27's ruling and is not decided here.
 */
import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { facingCarriers, openingsForFacing, deriveMeta } from "./plan-projection.mjs";

const require_ = createRequire(import.meta.url);
const groundplane = require_("../src/groundplane.js");
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CANVAS_W = 1536;
const CANVAS_H = 1024;

/* THE STANDING BAND, imported rather than typed: every detector bracket below
 * is this number propagated through a geometry the scaffold itself declares.
 * The round may not bring its own band (blueprint §5, `gate.py`'s own header). */
import { MEASURED_BAND } from "./validate-fixtures.mjs";

/* Blueprint §11's universal anchor: the wainscot chair-rail, on every panelled
 * wall in the manor. It is the one ruler the gate votes on. */
const CHAIR_RAIL_M = 0.95;
/* §11's ruled door opening height at the wall plane. */
const DOOR_HEAD_M = 2.00;
/* Scaffold CONVENTIONS — declared, drawn, and scored by nothing. A plan view is
 * a horizontal section and holds no vertical dimension anywhere, so these are
 * the scaffold's own and they say so on its legend. */
const CONVENTION = {
  fireplace_height_m: 1.60,
  window_sill_m: 0.90,
  window_head_m: 2.00,
  firebox_width_m: 0.90            // ruled size, but a CROSS-RULER: votes on nothing
};

/* ------------------------------------------------------------------ */
/* The glyph table                                                     */
/* ------------------------------------------------------------------ */
/* STROKED POLYLINES, NOT `fillText`, and `src/renderer.js` is the law this
 * obeys rather than a preference: its own GLYPHS table exists because font
 * rasterisation is environment-fragile, and a scaffold drawn with `fillText`
 * could not answer to a re-render comparison on any machine but the one that
 * made it. Unit box, y down, exactly the renderer's own idiom.
 *
 * Every character a label may contain is here, and `assertLabelChars` refuses a
 * label carrying anything else — so a future label cannot silently fall back to
 * a font. */
const G = {
  " ": [],
  A: [[[0, 1], [0.5, 0], [1, 1]], [[0.18, 0.62], [0.82, 0.62]]],
  B: [[[0, 0], [0, 1]], [[0, 0], [0.68, 0], [0.9, 0.16], [0.9, 0.34], [0.68, 0.48], [0, 0.48]],
      [[0.68, 0.48], [0.95, 0.64], [0.95, 0.84], [0.68, 1], [0, 1]]],
  C: [[[1, 0.16], [0.74, 0], [0.26, 0], [0, 0.26], [0, 0.74], [0.26, 1], [0.74, 1], [1, 0.84]]],
  D: [[[0, 0], [0, 1]], [[0, 0], [0.6, 0], [1, 0.3], [1, 0.7], [0.6, 1], [0, 1]]],
  E: [[[1, 0], [0, 0], [0, 1], [1, 1]], [[0, 0.5], [0.74, 0.5]]],
  F: [[[1, 0], [0, 0], [0, 1]], [[0, 0.5], [0.7, 0.5]]],
  G: [[[1, 0.16], [0.74, 0], [0.26, 0], [0, 0.26], [0, 0.74], [0.26, 1], [0.74, 1], [1, 0.8], [1, 0.56], [0.52, 0.56]]],
  H: [[[0, 0], [0, 1]], [[1, 0], [1, 1]], [[0, 0.5], [1, 0.5]]],
  I: [[[0.5, 0], [0.5, 1]], [[0.16, 0], [0.84, 0]], [[0.16, 1], [0.84, 1]]],
  J: [[[0.84, 0], [0.84, 0.78], [0.6, 1], [0.26, 1], [0.02, 0.8]]],
  K: [[[0, 0], [0, 1]], [[1, 0], [0, 0.56]], [[0.34, 0.38], [1, 1]]],
  L: [[[0, 0], [0, 1], [1, 1]]],
  M: [[[0, 1], [0, 0], [0.5, 0.62], [1, 0], [1, 1]]],
  N: [[[0, 1], [0, 0], [1, 1], [1, 0]]],
  O: [[[0.26, 0], [0.74, 0], [1, 0.26], [1, 0.74], [0.74, 1], [0.26, 1], [0, 0.74], [0, 0.26], [0.26, 0]]],
  P: [[[0, 1], [0, 0], [0.7, 0], [1, 0.2], [1, 0.42], [0.7, 0.6], [0, 0.6]]],
  Q: [[[0.26, 0], [0.74, 0], [1, 0.26], [1, 0.74], [0.74, 1], [0.26, 1], [0, 0.74], [0, 0.26], [0.26, 0]],
      [[0.62, 0.7], [1, 1]]],
  R: [[[0, 1], [0, 0], [0.7, 0], [1, 0.2], [1, 0.42], [0.7, 0.6], [0, 0.6]], [[0.44, 0.6], [1, 1]]],
  S: [[[1, 0.16], [0.7, 0], [0.3, 0], [0, 0.2], [0, 0.36], [0.3, 0.5], [0.7, 0.5], [1, 0.64], [1, 0.8], [0.7, 1], [0.3, 1], [0, 0.84]]],
  T: [[[0, 0], [1, 0]], [[0.5, 0], [0.5, 1]]],
  U: [[[0, 0], [0, 0.74], [0.26, 1], [0.74, 1], [1, 0.74], [1, 0]]],
  V: [[[0, 0], [0.5, 1], [1, 0]]],
  W: [[[0, 0], [0.25, 1], [0.5, 0.35], [0.75, 1], [1, 0]]],
  X: [[[0, 0], [1, 1]], [[1, 0], [0, 1]]],
  Y: [[[0, 0], [0.5, 0.52], [1, 0]], [[0.5, 0.52], [0.5, 1]]],
  Z: [[[0, 0], [1, 0], [0, 1], [1, 1]]],
  0: [[[0.26, 0], [0.74, 0], [1, 0.26], [1, 0.74], [0.74, 1], [0.26, 1], [0, 0.74], [0, 0.26], [0.26, 0]],
      [[0.16, 0.84], [0.84, 0.16]]],
  1: [[[0.18, 0.2], [0.5, 0], [0.5, 1]], [[0.18, 1], [0.82, 1]]],
  2: [[[0, 0.2], [0.26, 0], [0.7, 0], [1, 0.26], [1, 0.44], [0, 1], [1, 1]]],
  3: [[[0, 0.1], [0.3, 0], [0.7, 0], [1, 0.2], [0.74, 0.46], [0.34, 0.48]],
      [[0.74, 0.46], [1, 0.7], [0.7, 1], [0.3, 1], [0, 0.9]]],
  4: [[[0.74, 1], [0.74, 0], [0, 0.7], [1, 0.7]]],
  5: [[[1, 0], [0.16, 0], [0.06, 0.44], [0.6, 0.4], [1, 0.6], [0.9, 0.9], [0.5, 1], [0.1, 0.9]]],
  6: [[[0.9, 0.1], [0.6, 0], [0.26, 0.1], [0, 0.5], [0, 0.8], [0.3, 1], [0.7, 1], [1, 0.76], [0.74, 0.46], [0.3, 0.46], [0, 0.66]]],
  7: [[[0, 0], [1, 0], [0.34, 1]]],
  8: [[[0.3, 0.46], [0.05, 0.26], [0.26, 0], [0.74, 0], [0.95, 0.26], [0.7, 0.46], [0.3, 0.46]],
      [[0.7, 0.46], [1, 0.7], [0.74, 1], [0.26, 1], [0, 0.7], [0.3, 0.46]]],
  9: [[[0.1, 0.9], [0.4, 1], [0.74, 0.9], [1, 0.5], [1, 0.2], [0.7, 0], [0.3, 0], [0, 0.26], [0.26, 0.56], [0.7, 0.56], [1, 0.36]]],
  ".": [[[0.38, 0.94], [0.62, 0.94]]],
  ",": [[[0.58, 0.84], [0.42, 1]]],
  "/": [[[0.85, 0], [0.15, 1]]],
  "-": [[[0.12, 0.56], [0.88, 0.56]]],
  "·": [[[0.38, 0.5], [0.62, 0.5]]],
  "%": [[[1, 0], [0, 1]],
        [[0.04, 0.04], [0.36, 0.04], [0.36, 0.36], [0.04, 0.36], [0.04, 0.04]],
        [[0.64, 0.64], [0.96, 0.64], [0.96, 0.96], [0.64, 0.96], [0.64, 0.64]]],
  "×": [[[0.14, 0.3], [0.86, 0.8]], [[0.86, 0.3], [0.14, 0.8]]]
};
const GLYPH_SET = Object.keys(G);
/* Exported so the suite can re-render a committed scaffold with the identical
 * table rather than a copy that could drift from it. */
export const GLYPH_TABLE = G;

export function assertLabelChars(s, where) {
  for (const ch of s) {
    if (!(ch in G)) {
      throw new Error(
        `make-scaffold: ${where} contains ${JSON.stringify(ch)}, which the stroked ` +
        `glyph table does not carry. Labels may use only: ${GLYPH_SET.join("")}. ` +
        `A label outside the table would need a font, and a font-rendered ` +
        `scaffold cannot be re-rendered anywhere but the machine that made it.`);
    }
  }
  return s;
}

/* ------------------------------------------------------------------ */
/* Metas                                                               */
/* ------------------------------------------------------------------ */

/**
 * The §5 meta a measured READING implies, by the same recipe
 * `tools/promote-backdrop.mjs` uses: pixels off the painting, metres off the
 * plan (`design/plan-draft/projection.md`'s authority table).
 *
 * It is re-implemented here rather than imported because that file is a script
 * with a refusal path and a writer, and a scaffold must not be able to promote
 * anything. What makes the copy honest is the test: fed the `cand5ref` reading
 * it must reproduce the COMMITTED `backdrops/study/N.meta.json` field for field
 * on every geometry field, so the two recipes are pinned to one another by an
 * artifact the other tool actually produced.
 */
export function metaFromReading(reading, plan, loc, facing) {
  const room = plan.rooms.find((r) => r.id === loc);
  const fc = room.facings[facing];
  const ppm = reading.px_per_m_at_wall;
  if (!(ppm > 0)) {
    throw new Error(`make-scaffold: ${loc}/${facing}'s reading carries no px_per_m_at_wall — a WITHHELD measurement is not a camera`);
  }
  const ramp = (reading._horizon_votes || {}).ceiling_ramp_intersection;
  if (!ramp || typeof ramp.y !== "number") {
    throw new Error(`make-scaffold: ${loc}/${facing}'s reading carries no ceiling-ramp horizon, which is the instrument row 20 ruled`);
  }
  const imageH = reading.image_h_px;
  const horizonY = ramp.y / imageH;
  const floorLineY = reading.floor_line_y;
  const eyeM = (floorLineY - horizonY) * imageH / ppm;
  const floor = plan.floors.find((f) => f.id === room.floor);
  return {
    floor_line_y: round(floorLineY, 6),
    px_per_m_at_wall: round(ppm, 3),
    px_per_m_at_bottom: round((imageH - horizonY * imageH) / eyeM, 2),
    wall_width_m: fc.wall_width_m,
    key_tint: reading.key_tint,
    image_h_px: imageH,
    horizon_y: round(horizonY, 6),
    key_dir: reading.key_dir,
    calibration_ref: reading.calibration_ref,
    calibration_px: reading.calibration_px,
    camera_wall_m: fc.camera_wall_m,
    facing_type: fc.type,
    corner_x0_px: reading.corner_x0_px,
    corner_x1_px: reading.corner_x1_px,
    storey_height_m: room.type === "open" ? null : (floor ? floor.storey_height_m ?? null : null),
    camera_id: "measured:" + (reading._source || ""),
    provisional: false,
    measured: true,
    backdrop: "wall",
    openings: []
  };
}

function round(v, n) {
  return v == null ? v : Number(v.toFixed(n));
}
const rnd = (o) => o == null ? null
  : Object.fromEntries(Object.entries(o).map(([k, v]) => [k, round(v, 2)]));

/* ------------------------------------------------------------------ */
/* Carriers, in ruler space                                            */
/* ------------------------------------------------------------------ */

/** Ruler space: what `drawGrid` draws its own metre lines in. */
export function rulerX(m, meta) {
  return groundplane.wallCentrePx(meta, CANVAS_W) +
    (m - meta.wall_width_m / 2) * meta.px_per_m_at_wall;
}
/** Aperture space: where a promoted wall's click target lives. Recorded, not stamped. */
export function apertureX(m, meta) {
  return groundplane.xAtScale(m / meta.wall_width_m, meta.px_per_m_at_wall, meta, CANVAS_W);
}
/** The stroked table's own text metric: advance per character, minus the last gap. */
export function textBox(s, h) { return s.length * (h * 0.62 + h * 0.26) - h * 0.26; }
/** A height above the floor line, at the wall plane. */
export function wallY(heightM, meta) {
  return meta.floor_line_y * meta.image_h_px - heightM * meta.px_per_m_at_wall;
}

/**
 * The stamped rects for one facing — the whole of what the label pass may draw
 * inside, and the whole of what the sidecar declares.
 *
 * EVERY METRIC MARK IS IN RULER SPACE, DOORS INCLUDED. See the header. The
 * aperture rect is computed alongside and recorded so the divergence is a
 * number in a file rather than a surprise at row 27.
 */
export function scaffoldRects(plan, loc, facing, meta) {
  const carriers = facingCarriers(plan, loc, facing);
  const floorY = meta.floor_line_y * meta.image_h_px;
  const ppm = meta.px_per_m_at_wall;
  const out = [];
  for (const c of carriers) {
    const x0 = rulerX(c.from_m, meta);
    const x1 = rulerX(c.to_m, meta);
    const rect = { kind: c.kind, id: c.id, from_m: c.from_m, to_m: c.to_m, x0, x1 };
    if (c.kind === "door") {
      rect.y0 = wallY(DOOR_HEAD_M, meta);
      rect.y1 = floorY;
      rect.label = "DOOR";
      rect.sub = `OPENING ${c.width_m.toFixed(2)} M × ${DOOR_HEAD_M.toFixed(2)} M HIGH`;
      rect.ruled = ["width", "head height"];
    } else if (c.kind === "fireplace") {
      rect.y0 = wallY(CONVENTION.fireplace_height_m, meta);
      rect.y1 = floorY;
      rect.label = "FIREPLACE";
      rect.sub = `BREAST ${c.width_m.toFixed(2)} M · FIREBOX ${CONVENTION.firebox_width_m.toFixed(2)} M`;
      rect.ruled = ["breast width"];
      rect.convention = ["height above floor"];
      const cx = (x0 + x1) / 2;
      const half = CONVENTION.firebox_width_m * ppm / 2;
      rect.ticks = [cx - half, cx + half];
    } else if (c.kind === "window") {
      rect.y0 = wallY(CONVENTION.window_head_m, meta);
      rect.y1 = wallY(CONVENTION.window_sill_m, meta);
      rect.label = "WINDOW";
      rect.sub = `${c.width_m.toFixed(2)} M WIDE`;
      rect.ruled = ["width"];
      rect.convention = ["sill height", "head height"];
    } else {
      continue;
    }
    out.push(rect);
  }
  /* ROUNDED AT CREATION, so the sidecar declares exactly what was drawn rather
   * than a rounded description of it. The first run rounded only on the way
   * into the file, and the half-pixel difference moved the antialiasing enough
   * that re-rendering from the sidecar did not reproduce the committed image. */
  for (const r of out) {
    r.x0 = round(r.x0, 2); r.x1 = round(r.x1, 2);
    r.y0 = round(r.y0, 2); r.y1 = round(r.y1, 2);
    if (r.ticks) r.ticks = r.ticks.map((t) => round(t, 2));
  }
  /* THE TEXT PLACEMENTS, computed here so the sidecar declares what the page
   * will draw rather than describing it afterwards. `textBox` is the stroked
   * table's own metric — advance `h*0.62 + h*0.26` per character, minus the
   * last gap — and the page uses the identical formula, so a drifted label is a
   * disagreement the confinement case can see. */
  for (const r of out) {
    const h = Math.max(20, Math.min(44, (r.x1 - r.x0) / (r.label.length * 0.95)));
    const lw = textBox(r.label, h);
    r.label_rect = rnd({ x: (r.x0 + r.x1) / 2 - lw / 2, y: r.y0 + 14, w: lw, h });
    const sh = Math.max(14, h * 0.5);
    const sw = textBox(r.sub, sh);
    r.note_rect = rnd({ x: (r.x0 + r.x1) / 2 - sw / 2, y: r.y0 - sh * 1.9, w: sw, h: sh });
  }
  /* The aperture rect of every door the plan draws on this facing, recorded
   * beside the stamped one. `openingsForFacing` is the renderer's own opening
   * list, so this is the click target as the page would compute it. */
  const apertures = openingsForFacing(plan, loc, facing, meta, CANVAS_W).map((o) => ({
    id: o.id, via: o.via, x: o.x, y: o.y, w: o.w, h: o.h
  }));
  return { rects: out, apertures };
}

/**
 * The chair-rail: blueprint §11's universal anchor, the one ruler the gate
 * votes on, drawn corner to corner at exactly 0.95 m above the floor line.
 *
 * On `study/N` this lands at y 570.0 and the reference painting's own measured
 * `dado_rail_y_px` is 570. That agreement is the generator's first check.
 */
export function chairRail(meta) {
  const y = round(wallY(CHAIR_RAIL_M, meta), 2);
  const has = groundplane.hasCorners(meta);
  return {
    y,
    x0: has ? meta.corner_x0_px : 0,
    x1: has ? meta.corner_x1_px : CANVAS_W,
    label: `CHAIR-RAIL ${CHAIR_RAIL_M.toFixed(2)} M ABOVE FLOOR - GATE ANCHOR`
  };
}

/* ------------------------------------------------------------------ */
/* Detector brackets — pre-committed, and derived from the standing band */
/* ------------------------------------------------------------------ */

/**
 * The measurement's search windows, computed from the scaffold's own declared
 * geometry and the ±8 % the standing law already licenses — never hand-tuned
 * per candidate, and written into the sidecar BEFORE any image exists.
 *
 * A bracket width is the real free parameter in an adherence experiment: a
 * legible feature three pixels outside a hand-chosen window is a measurement
 * failure that would be scored as disobedience, and the width would silently
 * set the answer. Each one below is the licence propagated through a geometry
 * the scaffold declares, so there is nothing left to choose.
 *
 *   floor    the floor-to-horizon separation IS `eye × px_per_m_at_wall` — the
 *            product of the two quantities the band covers — so ±8 % of it is
 *            the licence stated in rows.
 *   rail     the anchor's own height above the floor line, ±8 % of it.
 *   ceiling  the ceiling-to-floor span, ±8 % of it.
 *   carrier  the stamped box, dilated by the arm's own tolerance (§5.4 of the
 *            spec): the reflex-versus-plan separation this wall has already
 *            been measured to produce.
 */
export function brackets(meta, rects, carrierTolerancePx) {
  const floorY = meta.floor_line_y * meta.image_h_px;
  const horizonY = meta.horizon_y * meta.image_h_px;
  const sep = floorY - horizonY;
  const railAbove = CHAIR_RAIL_M * meta.px_per_m_at_wall;
  const storey = meta.storey_height_m;
  const ceilSpan = storey == null ? null : storey * meta.px_per_m_at_wall;
  const b = {
    _derivation: "every width is MEASURED_BAND (the standing +/-8 % on the implied focal length AND the eye height) propagated through a geometry this scaffold declares; nothing here is chosen",
    band: MEASURED_BAND,
    floor_window: {
      centre: floorY, half_width: round(MEASURED_BAND * sep, 2),
      from: "+/-8 % of the floor-to-horizon separation, which is eye x px_per_m_at_wall"
    },
    rail_band: {
      centre: floorY - railAbove, half_width: round(MEASURED_BAND * railAbove, 2),
      from: "+/-8 % of the anchor's own height above the floor line"
    },
    ceiling_band: ceilSpan == null ? null : {
      centre: floorY - ceilSpan, half_width: round(MEASURED_BAND * ceilSpan, 2),
      from: "+/-8 % of the ceiling-to-floor span"
    },
    carrier_windows: rects.map((r) => ({
      kind: r.kind, id: r.id,
      x0: round(r.x0 - carrierTolerancePx, 2), x1: round(r.x1 + carrierTolerancePx, 2),
      from: "the stamped box dilated by this wall's own measured reflex-versus-plan separation"
    })),
    carrier_tolerance_px: round(carrierTolerancePx, 2),
    /* The wall columns a chair-rail reading may use: clear of every carrier, so
     * a mantel shelf or a window head cannot be read as the rail's capping. */
    rail_columns: railColumns(meta, rects)
  };
  return b;
}

function railColumns(meta, rects) {
  const lo = groundplane.hasCorners(meta) ? meta.corner_x0_px : 0;
  const hi = groundplane.hasCorners(meta) ? meta.corner_x1_px : CANVAS_W;
  const cuts = rects.map((r) => [Math.floor(r.x0), Math.ceil(r.x1)]).sort((a, b) => a[0] - b[0]);
  const bands = [];
  let x = lo;
  for (const [a, b] of cuts) {
    if (a > x) bands.push([x, Math.min(a, hi)]);
    x = Math.max(x, b);
  }
  if (x < hi) bands.push([x, hi]);
  return bands.filter(([a, b]) => b - a >= 40);
}

/* ------------------------------------------------------------------ */
/* The page                                                            */
/* ------------------------------------------------------------------ */

/* Where a facing is, in real intents, so the live comparison is the live page
 * rather than a viewstate written from outside. `nav-manor` boots at study/N
 * and stages no objects, so a doorway has no leaf to open. */
const R = { type: "turn", dir: "right" };
const CYCLE = ["N", "E", "S", "W"];
export const ROUTES = {
  "study/N": [],
  "study/E": [R],
  "study/S": [R, R],
  "study/W": [R, R, R],
  "hall/E": [R, { type: "go", exit: "door_study_hall" }],
  "hall/S": [R, { type: "go", exit: "door_study_hall" }, R],
  "hall/W": [R, { type: "go", exit: "door_study_hall" }, R, R],
  "hall/N": [R, { type: "go", exit: "door_study_hall" }, R, R, R]
};

/* THE FENCE. A facing goes here while an open row is about to move its
 * standpoint — its derived meta would make any scaffold cut now stale the day
 * that row lands. `scaffold.spec.mjs` turns red if an entry names a row the
 * intention list no longer holds open, so the handshake is mechanical.
 * Row 26 (hall/N, hall/S) closed 2026-08-24 and its entries left with it. */
export const PENDING_ROWS = {};

/* PIXELS NEVER CROSS THE BRIDGE. A 1536x1024 frame is 6.3 MB of RGBA, and
 * marshalling it to node as an array costs minutes per facing. Everything that
 * touches pixels happens inside one `page.evaluate`, and what comes back is a
 * PNG data URL or a small structured result. The same rule is what makes
 * `scaffold.spec.mjs` fast: it compares INSIDE the page and returns a verdict. */

/**
 * Render one facing through the shipped renderer and, for the scaffold, stamp
 * the labels over it — in one page call, so the frame never leaves the page.
 *
 * `mode` is "verify" (the page's own `{}` options, which is what the hash
 * comparison uses) or "scaffold" (`backdrop_only` + `no_through`, the picture a
 * painter is actually given).
 */
export const PAGE_RENDER = function (arg) {
  const { key, meta, mode, marks, G } = arg;
  const A = window.HOLO_APP;
  const cv = document.createElement("canvas");
  cv.width = 1536; cv.height = 1024;
  const parts = key.split("/");
  /* The backdrops the render sees: the page's own, with this facing's entry
     replaced by the meta we were handed and NO image. Dropping the image is
     what makes a promoted wall draw its grid at its own painted camera — it is
     the page's own documented behaviour for a painting that will not decode,
     and the meta survives it. */
  const bd = Object.assign({}, A.backdrops);
  bd[key] = { meta: meta || (A.backdrops[key] ? A.backdrops[key].meta : null) };
  const opts = mode === "verify" ? {} : { backdrop_only: true, no_through: true };
  window.HOLO.renderer.render(cv, A.harness.world, A.harness.staging, A.library,
    bd, { location: parts[0], facing: parts[1] }, opts);
  if (!marks) return cv.toDataURL("image/png");

  /* ---- the label pass, over the frame just drawn ---- */
  const ctx = cv.getContext("2d");
  const INK = "#e8f4ff", DIM = "#9fc4e0";
  function glyphText(s, x, y, h, colour) {
    const w = h * 0.62, gap = h * 0.26;
    ctx.strokeStyle = colour;
    ctx.lineWidth = Math.max(2, Math.round(h / 9));
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    let cx = x;
    for (const ch of s) {
      const strokes = G[ch] || [];
      ctx.beginPath();
      for (let i = 0; i < strokes.length; i++) {
        const line = strokes[i];
        for (let j = 0; j < line.length; j++) {
          const px = cx + line[j][0] * w, py = y + line[j][1] * h;
          if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
      cx += w + gap;
    }
  }
  const tw = (s, h) => s.length * (h * 0.62 + h * 0.26) - h * 0.26;

  for (const m of marks.rects) {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.setLineDash([14, 8]);
    ctx.strokeRect(m.x0, m.y0, m.x1 - m.x0, m.y1 - m.y0);
    ctx.setLineDash([]);
    if (m.ticks) {
      ctx.strokeStyle = DIM;
      ctx.lineWidth = 3;
      for (const txx of m.ticks) {
        ctx.beginPath();
        ctx.moveTo(txx, m.y1 - (m.y1 - m.y0) * 0.42);
        ctx.lineTo(txx, m.y1 - 4);
        ctx.stroke();
      }
    }
    /* EVERY MARK IS DRAWN AT A RECT THE SIDECAR DECLARES, and node computed
       both of these before the page was opened — so the confinement case has
       something real to check rather than a rect derived from the same call
       that drew the text. The word sits INSIDE the top of its box ("the word
       bird in a place where we would want to see a bird"); the dimension line
       sits in its own rect ABOVE the box, because at the box's centre the word
       overprinted the chair-rail on `study/N` and a dimension line wider than a
       1.00 m door overprinted the wall on `study/E`. */
    glyphText(m.label, m.label_rect.x, m.label_rect.y, m.label_rect.h, INK);
    glyphText(m.sub, m.note_rect.x, m.note_rect.y, m.note_rect.h, DIM);
  }

  const cr = marks.chair_rail;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cr.x0, cr.y);
  ctx.lineTo(cr.x1, cr.y);
  ctx.stroke();
  glyphText(cr.label, cr.x0 + 12, cr.y + 10, 18, INK);

  const lg = marks.legend;
  ctx.strokeStyle = DIM;
  ctx.lineWidth = 2;
  ctx.strokeRect(lg.x, lg.y, lg.w, lg.h);
  let ly = lg.y + 12;
  for (const line of lg.lines) { glyphText(line, lg.x + 12, ly, lg.text_h, DIM); ly += lg.line_h; }

  return cv.toDataURL("image/png");
};

async function renderPng(page, key, meta, mode, marks) {
  return await page.evaluate(PAGE_RENDER,
    { key, meta, mode, marks: marks || null, G });
}

/** The legend box, bottom-left, clear of the wall plane.
 *
 * ITS WIDTH IS DERIVED FROM ITS OWN TEXT, not chosen. A hard-coded 900 px left
 * the longest line overhanging its own frame by six pixels — twenty pixels of
 * ink outside every declared rect, which is precisely what the confinement
 * case exists to refuse, and it found them. */
const LEGEND_TEXT_H = 15;
const LEGEND_LINE_H = 26;
function legendFor(meta, rects, camera) {
  const lines = [
    "SCAFFOLD LEGEND - THESE MARKS ARE INSTRUCTIONS AND ARE NEVER PAINTED",
    `RULED - CHAIR-RAIL ${CHAIR_RAIL_M.toFixed(2)} M · CARRIER WIDTHS · DOOR HEAD ${DOOR_HEAD_M.toFixed(2)} M`,
    "CONVENTION - CARRIER HEIGHTS ABOVE FLOOR · WINDOW SILL AND HEAD",
    `SCALE - ONE METRE OF WALL SPANS ${meta.px_per_m_at_wall.toFixed(0)} PIXELS AT THE WALL PLANE`,
    `CAMERA - ${camera}`
  ];
  for (const l of lines) assertLabelChars(l, "the legend");
  const h = LEGEND_LINE_H * lines.length + 22;
  const w = round(24 + Math.max(...lines.map((l) => textBox(l, LEGEND_TEXT_H))), 2);
  return { x: 24, y: CANVAS_H - h - 24, w, h, lines, text_h: LEGEND_TEXT_H, line_h: LEGEND_LINE_H };
}

/* ------------------------------------------------------------------ */
/* PNG                                                                 */
/* ------------------------------------------------------------------ */

/* Written through the page's own encoder, because the project carries no PNG
 * library. That is safe here for the reason `plan.spec`'s render-lock case
 * makes it unsafe elsewhere: nothing ever compares these BYTES. Every check in
 * `scaffold.spec.mjs` decodes a PNG back to an RGBA buffer and compares
 * buffers, so the encoder is a transport and not a witness. */
function writePng(dataUrl, path) {
  writeFileSync(path, Buffer.from(dataUrl.split(",")[1], "base64"));
}

/* ------------------------------------------------------------------ */
/* Sidecar                                                             */
/* ------------------------------------------------------------------ */

function sha256File(p) {
  return createHash("sha256").update(readFileSync(p)).digest("hex");
}

function drawnDigest() {
  const p = join(ROOT, "design", "plan-draft", "approval.lock");
  if (!existsSync(p)) return null;
  /* The DRAWN digest — `approval.lock`'s `plan` line, which since row 11 hashes
   * exactly the content the approved sheets draw. A scaffold whose sidecar
   * digest no longer matches this has been cut from a plan that has since
   * moved, and the tool says so rather than drawing an old room. */
  const m = /^plan\s+([0-9a-f]{64})\s/m.exec(readFileSync(p, "utf8"));
  return m ? m[1] : null;
}

function gitCommit() {
  try {
    return execFileSync("git", ["-C", ROOT, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  } catch { return null; }
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

/**
 * The carrier arm's tolerance for one wall: the reflex-versus-plan separation
 * that wall has ALREADY been measured to produce, under the identical measure
 * the arm uses. It is read from the corpus, never typed — row 22 will move
 * `study/N`'s, and a typed copy would go stale in silence.
 *
 *   study/N  the reference painting's stone case against the stamped box
 *   study/E  the cand-6 painting's door opening against the stamped box
 *
 * 1.0 on the arm means "obeyed the box"; 0.0 means "did no better than the ask
 * that carried no label at all".
 */
export function carrierTolerance(plan, loc, facing, meta, reflexPx) {
  const { rects } = scaffoldRects(plan, loc, facing, meta);
  if (!rects.length || !reflexPx) return null;
  const r = rects[0];
  return (Math.abs(reflexPx[0] - r.x0) + Math.abs(reflexPx[1] - r.x1)) / 2;
}

export const REFLEX = {
  /* The painted stone case's outer mouldings, 0.756 and 2.023 m along the wall
   * (row 22's measurement of the approved reference), taken from the left
   * corner at that painting's own ruler. */
  "study/N": (reading) => {
    const ppm = reading.px_per_m_at_wall, c0 = reading.corner_x0_px;
    return [c0 + 0.756 * ppm, c0 + 2.023 * ppm];
  },
  /* The door opening the standing-eye wave measured: dead centre of frame,
   * where the plan puts it 1.100 m to the right. */
  "study/E": (reading) => {
    const px = reading._measured_px;
    return [px.opening_x0_px, px.opening_x1_px];
  }
};

async function main() {
  const argv = process.argv.slice(2);
  const key = argv[0];
  const argOf = (f, d) => { const i = argv.indexOf(f); return i !== -1 ? argv[i + 1] : d; };
  if (argv.includes("--emit-packets")) {
    const out = resolve(argOf("--out", join(ROOT, "design", "batches", "row23-scaffold")));
    const r = emitPackets(out);
    console.log(`assignment  ${r.assignPath.slice(ROOT.length + 1)}`);
    console.log(`            ${r.rolls.length} stage-1 rolls + ${r.lens.length} lens rolls`);
    for (const x of r.rolls) {
      console.log(`  ${x.wall}  ${x.technique}${x.variant ? "/" + x.variant : "   "}  roll ${x.roll}  ${x.id}  -> ${x.candidate}`);
    }
    for (const x of r.lens) console.log(`  ${x.wall}  lens        roll ${x.roll}  ${x.id}  -> ${x.candidate}`);
    console.log(`packets     ${out.slice(ROOT.length + 1)}/packets/`);
    return;
  }
  if (!key || !/^[a-z_]+\/[NESW]$/.test(key)) {
    console.error("usage: node tools/make-scaffold.mjs <location>/<facing> --out <dir> [--camera page|derived|reading] [--round <name>]");
    process.exit(2);
  }
  if (PENDING_ROWS[key]) {
    console.error(
      `make-scaffold refused: ${key}'s standpoint moves in row ${PENDING_ROWS[key]}, so a ` +
      `scaffold cut for it now would ask a painter for a wall the plan is about to redraw. ` +
      `Row ${PENDING_ROWS[key]}'s closing commit removes this fence.`);
    process.exit(1);
  }
  const outDir = resolve(argOf("--out", join(ROOT, "design", "batches", "row23-scaffold")));
  const camera = argOf("--camera", "page");
  const roundName = argOf("--round", "cand6");
  mkdirSync(outDir, { recursive: true });

  const [loc, facing] = key.split("/");
  const plan = JSON.parse(readFileSync(join(ROOT, "fixtures", "demo-study", "plan.json"), "utf8"));

  let meta = null, metaSource = "page", reading = null, readingPath = null;
  if (camera === "derived") {
    meta = deriveMeta(plan, loc, facing);
    metaSource = "derived:tools/plan-projection.mjs deriveMeta (INJECTED - the page never holds a derived meta for a promoted facing)";
  } else if (camera === "reading") {
    readingPath = join(ROOT, "design", "plan-draft", "measured", roundName, `${loc}-${facing}.json`);
    reading = JSON.parse(readFileSync(readingPath, "utf8"));
    reading._source = `backdrops/source/${loc}-${facing}/${roundName.replace("cand", "cand-")}.png`;
    meta = metaFromReading(reading, plan, loc, facing);
    metaSource = `reading:${roundName} (INJECTED - admitted, not promoted; its camera is its OWN reading and is never the Kabe-ruled reference)`;
  }

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1536, height: 1200 } });
  await page.goto(pathToFileURL(join(ROOT, "index.html")).href + "?world=nav-manor");
  await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);

  if (!meta) {
    meta = await page.evaluate((k) => {
      const e = window.HOLO_APP.backdrops[k];
      return e && e.meta ? e.meta : window.HOLO.renderer.GRID_META;
    }, key);
  }

  const { rects, apertures } = scaffoldRects(plan, loc, facing, meta);
  const cr = chairRail(meta);
  assertLabelChars(cr.label, "the chair-rail label");
  for (const r of rects) {
    assertLabelChars(r.label, `${r.kind}'s label`);
    assertLabelChars(r.sub, `${r.kind}'s dimension line`);
  }
  /* No apostrophe: the glyph table carries none, and `assertLabelChars` refuses
   * a label it cannot stroke rather than letting one fall back to a font. */
  const CAMERA_WORD = {
    page: "THE META THIS PAGE HOLDS FOR THIS FACING",
    derived: "DERIVED FROM THE PLAN - INJECTED",
    reading: `MEASURED READING ${roundName.toUpperCase()} - INJECTED, ADMITTED NOT PROMOTED`
  };
  const legend = legendFor(meta, rects, CAMERA_WORD[camera] || camera);

  let tol = null;
  if (REFLEX[key]) {
    const src = reading || JSON.parse(readFileSync(
      join(ROOT, "design", "plan-draft", "measured", key === "study/N" ? "cand5ref" : roundName,
        `${loc}-${facing}.json`), "utf8"));
    tol = carrierTolerance(plan, loc, facing, meta, REFLEX[key](src));
  }
  const bk = brackets(meta, rects, tol == null ? 0 : tol);

  const marks = { rects, chair_rail: cr, legend };
  const framePng = await renderPng(page, key, meta, "scaffold", null);
  const scafPng = await renderPng(page, key, meta, "scaffold", marks);
  await browser.close();

  const framePath = join(outDir, `${loc}-${facing}-frame.png`);
  const scafPath = join(outDir, `${loc}-${facing}-scaffold.png`);
  writePng(framePng, framePath);
  writePng(scafPng, scafPath);

  const sidecar = {
    _what_this_is: `The scaffold for ${key}: the shipped renderer's own grid frame for this facing with the plan's carriers stamped into it, and every number the stamping used.`,
    facing: key,
    camera, meta_source: metaSource,
    meta_used: meta,
    reading: readingPath ? readingPath.slice(ROOT.length + 1) : null,
    plan_drawn_digest: drawnDigest(),
    renderer_sha256: sha256File(join(ROOT, "src", "renderer.js")),
    groundplane_sha256: sha256File(join(ROOT, "src", "groundplane.js")),
    git_commit: gitCommit(),
    horizontal_spaces: {
      _which_is_stamped: "ruler - wallCentrePx + (m - wall_width_m/2) x px_per_m_at_wall, which is what drawGrid draws its own metre lines in",
      ruler_span_px: round(meta.wall_width_m * meta.px_per_m_at_wall, 2),
      aperture_span_px: round(groundplane.wallSpanPxAtWall(meta), 2),
      divergence_pct: round(100 * (groundplane.wallSpanPxAtWall(meta) /
        (meta.wall_width_m * meta.px_per_m_at_wall) - 1), 2),
      _why: "a measured meta's corner span is the PAINTING's wall; the ruled width is the plan's. Where they differ, a door's click target and its scored width are different rectangles - row 27's ruling.",
      anchor: "wall centre (groundplane.wallCentrePx). A corner-anchored stamp would move every carrier and is not what the renderer draws."
    },
    stamped: rects.map((r) => ({
      kind: r.kind, id: r.id, from_m: r.from_m, to_m: r.to_m,
      x0: round(r.x0, 2), x1: round(r.x1, 2), y0: round(r.y0, 2), y1: round(r.y1, 2),
      label: r.label, sub: r.sub, ruled: r.ruled || [], convention: r.convention || [],
      ticks: r.ticks ? r.ticks.map((t) => round(t, 2)) : null,
      label_rect: rnd(r.label_rect), note_rect: rnd(r.note_rect)
    })),
    apertures_recorded_not_stamped: apertures,
    chair_rail: { y: round(cr.y, 2), x0: cr.x0, x1: cr.x1, ruled_m: CHAIR_RAIL_M },
    brackets: bk,
    carrier_reflex_baseline_px: REFLEX[key] ? tol && round(tol, 2) : null,
    legend_box: { x: legend.x, y: legend.y, w: legend.w, h: legend.h,
      text_h: legend.text_h, line_h: legend.line_h, lines: legend.lines },
    glyph_set: GLYPH_SET.join(""),
    outputs: {
      frame: framePath.slice(ROOT.length + 1),
      scaffold: scafPath.slice(ROOT.length + 1),
      frame_sha256: sha256File(framePath),
      scaffold_sha256: sha256File(scafPath)
    }
  };
  const sidePath = join(outDir, `${loc}-${facing}.scaffold.json`);
  writeFileSync(sidePath, JSON.stringify(sidecar, null, 2) + "\n");

  console.log(`${key}  camera=${camera}`);
  console.log(`  ppm ${meta.px_per_m_at_wall}  focal ${round(groundplane.focalPx(meta), 1)} px at ${meta.camera_wall_m} m`);
  console.log(`  floor y ${round(meta.floor_line_y * meta.image_h_px, 1)}   chair-rail y ${round(cr.y, 1)}   corners ${meta.corner_x0_px}..${meta.corner_x1_px}`);
  for (const r of rects) {
    console.log(`  ${r.kind.padEnd(10)} ruler ${round(r.x0, 1)}..${round(r.x1, 1)} px  (${(r.to_m - r.from_m).toFixed(2)} m)`);
  }
  if (tol != null) console.log(`  carrier tolerance ${round(tol, 1)} px  (this wall's own measured reflex-versus-plan separation)`);
  console.log(`  -> ${framePath.slice(ROOT.length + 1)}`);
  console.log(`  -> ${scafPath.slice(ROOT.length + 1)}`);
  console.log(`  -> ${sidePath.slice(ROOT.length + 1)}`);
}


/* ------------------------------------------------------------------ */
/* Packets — the dispatch unit, and the production recipe's seed        */
/* ------------------------------------------------------------------ */
/* §8: "the recipe is code". This is the same emitter the manor run will use on
 * every unpainted facing — the row's three techniques are its first three
 * arguments, and the recommended one becomes the default. Nothing about a
 * packet is hand-written: the prompt's numbers come out of the wall's own
 * sidecar, so a wall whose plan moves re-emits with the plan rather than being
 * retyped.
 *
 * THE CAPTAIN'S SPEED RULE, 2026-08-23: "algorithmic execution for as much as
 * possible, images within the time it takes to retrieve the image one time then
 * prep it." Waves go out back-to-back. What makes that possible is that a
 * return lands on the exact path the measurement already expects, so
 * `measure.py --round row23` can run the second a file appears — which is why
 * PACKET.md names a destination FILENAME per roll rather than a directory. */

/* Where a facing's candidates live. The source tree names the cross passage
 * `passage-*` and the study `study-*`; the renderer keys them both `<room>/<F>`. */
export const SOURCE_DIR = { study: "study", hall: "passage" };
export const sourceDirFor = (key) => {
  const [loc, f] = key.split("/");
  return `backdrops/source/${SOURCE_DIR[loc] || loc}-${f}`;
};

/* THE OPAQUE ID. Deterministic, so the emission is re-runnable and the map can
 * be committed before anything exists; opaque in the FILENAME, which is the
 * thing that would otherwise tell a measuring hand which technique it is
 * looking at.
 *
 * Said plainly, because a blinding claim that overstates itself is worse than
 * none: this is not cryptographic, and it is reproducible from this file. What
 * actually carries the blinding is that `CFG_ROW23` is a function of the
 * SCAFFOLD's geometry, and a scaffold is per WALL — so the detector
 * configuration cannot vary by technique even in principle. The id keeps the
 * technique out of the path; the config keeps it out of the measurement. */
export function rollId(wall, technique, variant, roll) {
  return createHash("sha256")
    .update(`row23|${wall}|${technique}|${variant || "-"}|${roll}`)
    .digest("hex").slice(0, 8);
}

const TECHNIQUES = [
  { id: "t1", image2: "frame", labelled: false, variants: [null],
    what: "scaffold alone + style ref" },
  { id: "t2", image2: "scaffold", labelled: true, variants: [null],
    what: "scaffold with labelled carriers" },
  { id: "t3", image2: "scaffold", labelled: true, variants: ["VA", "VB"],
    what: "scaffold + style + text variants" }
];
const ROLLS = 4;
const STYLE_SEED = "design/references/style-seed-warm.png";

const WALL_WORDS = {
  "study/N": {
    side: "north",
    ruled: "The stone Tudor fireplace's firebox opening is exactly 0.90 m wide, and its stone breast is exactly 2.20 m wide.",
    declared2: "The fireplace stands where Image 2's FIREPLACE box stands, its stone breast filling that box's width.",
    materials: "dark hand-finished oak wall panelling, aged parchment-toned plaster ceiling, wide worn oak floorboards, pale carved stone Tudor fireplace surround, brick-lined firebox, a small lively lit wood fire",
    vb: "The stone fireplace stands just left of the wall's centre, its breast projecting half a metre into the room, with a broad clear expanse of panelling to its right.",
    carrier: "fireplace breast"
  },
  "study/E": {
    side: "east",
    ruled: "The door opening is exactly 1.00 m wide and exactly 2.00 m high at the wall plane.",
    declared2: "The doorway stands where Image 2's DOOR box stands, its opening filling that box's width.",
    materials: "dark hand-finished oak wall panelling, aged parchment-toned plaster ceiling, wide worn oak floorboards, a plain moulded oak door surround with the opening standing empty and no door leaf hung in it",
    vb: "The doorway stands well right of the wall's centre, with a broad clear expanse of panelling to its left and only a narrow return of wall beyond it.",
    carrier: "door opening"
  }
};

/** V-A's sentence, computed from the wall's own sidecar. Nothing typed. */
function variantA(side, w) {
  const m = side.meta_used, s = side.stamped[0];
  const ppm = m.px_per_m_at_wall;
  const fromL = (s.x0 - m.corner_x0_px) / ppm;
  const toL = (s.x1 - m.corner_x0_px) / ppm;
  const span = (m.corner_x1_px - m.corner_x0_px) / ppm;
  return `Carrier placement: The ${w.carrier} begins ${fromL.toFixed(2)} m from the left corner ` +
    `and ends ${toL.toFixed(2)} m from it, on a wall measuring ${span.toFixed(2)} m corner to ` +
    `corner as Image 2 draws it - from ${Math.round(100 * fromL / span)} % to ` +
    `${Math.round(100 * toL / span)} % of the wall's width.`;
}

/**
 * One prompt. `t1` and `t2` are byte-identical but for the two DECLARED lines,
 * which is the control that makes the matrix an experiment rather than three
 * differently-worded asks; `emitPackets` asserts that diff before it writes.
 */
export function promptFor(key, side, technique, variant) {
  const w = WALL_WORDS[key];
  const ppm = side.meta_used.px_per_m_at_wall;
  const lab = technique.labelled;
  const lines = [];
  lines.push("Use case: historical-scene");
  lines.push(`Asset type: gameplay backdrop for the study ${w.side} wall, circa-1660 English manor`);
  lines.push("Input images: Image 1 is the exact reference for painted style, medium, materials,");
  lines.push("  palette, period detail and light quality. Image 2 is a geometric layout diagram of");
  lines.push("  the wall to be painted: it is a technical drawing, not artwork to imitate.");
  /* ONE PHYSICAL LINE PER DECLARED SENTENCE. §4.0b says t1 and t2 differ by
     exactly the two declared lines, and the control below counts LINES — so a
     declaration wrapped across two of them makes the diff three and the guard
     refuses the wave. It did, on the first run. */
  if (lab) {
    lines.push("  Image 2's boxed labels mark where a named feature belongs: paint that feature inside its box, filling it. The labels themselves are instructions and are never painted.");
  }
  lines.push(`Primary request: Paint the ${w.side} wall of an empty circa-1660 English manor study,`);
  lines.push("  matching Image 1's finish and Image 2's geometry exactly.");
  lines.push("Gate anchor: the wainscot chair-rail above the floor, 0.95 m.");
  lines.push("Camera and composition: 1536x1024 landscape. Reproduce Image 2's camera exactly. The");
  lines.push("  camera is level, with zero upward or downward tilt. The wall-floor line, the two");
  lines.push("  room corners, the side-wall returns at left and right, and the amount of visible");
  lines.push("  floor all land where Image 2 puts them, to the pixel. One metre of wall at the wall");
  lines.push(`  plane spans ${ppm.toFixed(0)} pixels. The floor is visible and runs to the bottom edge of frame.`);
  lines.push("Architecture and measurement anchors: A clearly legible wainscot chair-rail runs");
  lines.push("  continuously corner to corner at exactly 0.95 m above the floor, on every exposed");
  lines.push(`  wall surface including the side-wall returns. ${w.ruled} Make these dimensions`);
  lines.push("  physically coherent and unmistakable in the architecture.");
  if (lab) lines.push(`  ${w.declared2}`);
  lines.push(`Materials and period detail: ${w.materials}.`);
  lines.push("Style and lighting: as Image 1 - fine oil realism with tactile brush detail, deep warm");
  lines.push("  browns, cool ambient light from the right, localized amber firelight, gentle natural falloff.");
  lines.push("Constraints: the room is completely empty of furniture, loose props, people and");
  lines.push("  clutter. Image 2 contains grid lines, a large letter and annotation text; these are");
  lines.push("  diagram marks identifying the wall, and the painted room contains no line, letter,");
  lines.push("  word, number, label, watermark or border of any kind.");
  if (variant === "VA") lines.push(variantA(side, w));
  if (variant === "VB") lines.push(`Carrier placement: ${w.vb}`);
  return lines.join("\n") + "\n";
}

export function emitPackets(outDir) {
  const walls = ["study/N", "study/E"];
  const sides = {};
  for (const key of walls) {
    const [loc, f] = key.split("/");
    sides[key] = JSON.parse(readFileSync(join(outDir, `${loc}-${f}.scaffold.json`), "utf8"));
  }

  /* ---- the map, written before anything it maps exists ---- */
  const rolls = [];
  for (const key of walls) {
    for (const t of TECHNIQUES) {
      let n = 0;
      for (const v of t.variants) {
        const per = ROLLS / t.variants.length;
        for (let i = 0; i < per; i++) {
          n += 1;
          const id = rollId(key, t.id, v, n);
          rolls.push({
            id, wall: key, technique: t.id, variant: v, roll: n,
            camera: sides[key].camera, scaffold: t.image2,
            candidate: `${sourceDirFor(key)}/row23-${id}.png`,
            prompt: `${sourceDirFor(key)}/row23-${id}.prompt.txt`
          });
        }
      }
    }
  }
  const lens = [];
  for (let i = 1; i <= 4; i++) {
    const id = rollId("study/N", "lens", "derived", i);
    lens.push({
      id, wall: "study/N", technique: null, variant: null, roll: i, camera: "derived",
      scaffold: "scaffold",
      candidate: `${sourceDirFor("study/N")}/row23-${id}.png`,
      prompt: `${sourceDirFor("study/N")}/row23-${id}.prompt.txt`,
      _technique_decided_by:
        "the deterministic entrant rule in design/specs/23-plan.md §5.6 (highest admitted count, " +
        "then highest median adherence_raw, then technique index), applied at P2. It is recorded " +
        "in the batch table and NOT here, because this file may never change once written."
    });
  }

  const assignPath = join(ROOT, "design", "plan-draft", "measured", "row23", "assignment.json");
  mkdirSync(dirname(assignPath), { recursive: true });
  writeFileSync(assignPath, JSON.stringify({
    _what_this_is: "The ONLY map from an opaque return id to the cell that produced it. Written and committed BEFORE any candidate is measured; scaffold.spec asserts its blob has never changed since the commit that introduced it.",
    _why_opaque: "A return path carrying its technique would tell a measuring hand which condition it is looking at. What actually carries the blinding is that CFG_ROW23 is a function of the SCAFFOLD's geometry and a scaffold is per WALL, so the detector configuration cannot vary by technique even in principle; the opaque id keeps the technique out of the path as well. The id is reproducible from tools/make-scaffold.mjs and is not cryptographic, which is stated here rather than implied.",
    _stage1: "3 techniques x 4 rolls x 2 walls = 24. t3's four are two variants x two rolls, so a variant is separable from roll noise.",
    _lens_arm: "4 rolls at --camera derived on study/N, the wall with the Kabe-ruled camera. Their technique is decided by a rule at P2, not chosen, and is not written here.",
    _generated: "2026-08-23",
    rolls, lens
  }, null, 2) + "\n");

  /* ---- the packets ---- */
  const lint = [];
  for (const key of walls) {
    const [loc, f] = key.split("/");
    const side = sides[key];
    const texts = {};
    for (const t of TECHNIQUES) {
      const dir = join(outDir, "packets", `${loc}-${f}`, t.id);
      mkdirSync(dir, { recursive: true });
      copyFileSync(join(ROOT, STYLE_SEED), join(dir, "style-seed-warm.png"));
      const img2 = `${loc}-${f}-${t.image2}.png`;
      copyFileSync(join(outDir, img2), join(dir, img2));

      const mine = rolls.filter((r) => r.wall === key && r.technique === t.id);
      const written = [];
      for (const v of t.variants) {
        const text = promptFor(key, side, t, v);
        const name = v ? `prompt-${v}.txt` : "prompt.txt";
        writeFileSync(join(dir, name), text);
        written.push({ name, variant: v });
        if (!v) texts[t.id] = text;
        lint.push(join(dir, name));
        /* AND BESIDE THE CANDIDATE, where the lint and the measurement look for
         * it. The seat copies the image; the prompt is ours to place, and
         * placing it now means a return needs nothing but the PNG. */
        for (const r of mine.filter((x) => x.variant === v)) {
          mkdirSync(join(ROOT, sourceDirFor(key)), { recursive: true });
          writeFileSync(join(ROOT, r.prompt), text);
          lint.push(join(ROOT, r.prompt));
        }
      }
      writeFileSync(join(dir, "PACKET.md"), packetMd(key, t, mine, img2, side));
    }
    /* THE CONTROL, ASSERTED BEFORE ANY PACKET IS DISPATCHED rather than claimed
     * in a document: on this wall t1 and t2 differ by exactly the two declared
     * lines. A matrix whose prompts differ in prose as well as in technique has
     * measured nothing. */
    const a = texts.t1.split("\n"), b = texts.t2.split("\n");
    const extra = b.filter((l) => !a.includes(l));
    const missing = a.filter((l) => !b.includes(l));
    if (extra.length !== 2 || missing.length !== 0) {
      throw new Error(
        `emit-packets refused: on ${key} the t1/t2 prompts differ by ${extra.length} added and ` +
        `${missing.length} removed lines, not by exactly the two declared ones. The matrix's own ` +
        `control is broken and no packet may go out.`);
    }
  }
  return { assignPath, rolls, lens, lint };
}

function packetMd(key, t, mine, img2, side) {
  const dir = sourceDirFor(key);
  const rows = mine.map((r) =>
    `| ${r.roll} | \`${r.variant ? `prompt-${r.variant}.txt` : "prompt.txt"}\` | \`${r.candidate}\` |`);
  return `# Packet — ${key}, technique ${t.id} (${t.what})

**Generate ${mine.length} images. Save each to the exact path in the table.** The measurement runs
the moment a file appears at one of those paths, so a return in the right place under the wrong name
costs a wave.

## Attach, in this order

1. \`style-seed-warm.png\` — **Image 1**, the style reference. Kabe's approved seed ("Warm",
   \`design/approvals.log\`, 2026-08-21).
2. \`${img2}\` — **Image 2**, the ${t.labelled ? "annotated layout scaffold" : "bare layout frame"}.

Then send the prompt text verbatim from the file named in the table.

## The rolls

| roll | prompt to send | save the image to |
|---|---|---|
${rows.join("\n")}

**The prompt files are already on disk beside where the image goes** (\`${dir}/row23-<id>.prompt.txt\`),
written from this packet, so a return needs nothing but the PNG. Do not rewrite them.

## What this wall is

${key} at ${side.meta_used.px_per_m_at_wall} px per metre at the wall plane, ${side.camera === "page"
    ? "drawn at the camera the page holds for this facing"
    : "drawn at its own measured cand-6 camera, injected (admitted, not promoted)"}. Its plan carrier
is the **${side.stamped.map((s) => s.label.toLowerCase()).join(", ")}**, and the gate's one voting
ruler is the wainscot chair-rail at 0.95 m above the floor line.

## The fence

Write only under \`backdrops/\` and \`library-src/\`. Never \`src/\`, never \`design/\`. Nothing here
asks you to judge a result: generate, save to the named paths, and report the paths back.
`;
}

/* THE ENTRY POINT LIVES AT THE END OF THE FILE, and has to: `main` reads the
 * packet tables below it, and a module-eval-time call placed above them hits
 * their temporal dead zone. */
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
