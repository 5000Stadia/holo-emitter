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
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { facingCarriers, openingsForFacing, deriveMeta, flightsForFacing }
  from "./plan-projection.mjs";
import * as timings from "./timings.mjs";                 // [row 33] the stopwatch
/* THE ROOM'S OWN VOICE, row 29 [HUMAN, 2026-08-24]: "is every room in this
 * house parlor walls?" and "exterior garden has interior wall outside". The
 * table is beside this file with each voice's period justification on it; every
 * material sentence, every window sentence and the STAMPED ANCHOR LABEL below
 * come out of it, so a room can only be asked for the study's panelling if the
 * plan says it is that kind of room. */
import { VOICES, emitMaterials, canonicalMaterial }       // [row 36] the swatch lane
  from "./room-voices.mjs";
import { voiceFor, windowLines, hangingsFor, ANCHOR_M, carryableOutdoors, REDACTED_CORRECTION }
  from "./room-voices.mjs";
/* [row 34, AWAITING KABE] THE RECOMMENDED REGISTER, and it is shared rather than
 * copied: `frame-language.mjs` is the one home for it, and the arm the
 * recommendation was measured on (`g4`) is the same function. See that file's
 * header for the recommendation's whole basis and for what it deliberately does
 * not claim. */
import { frameGeometry, registerBlock, positiveNoText, flightLines, col }
  from "./frame-language.mjs";
/* [row 38] THE SEAM SEED. A fresh ask whose adjacent facing is already painted
 * carries that neighbour's abutting 10 % as Image 3, with its role stated in
 * words. The adjacency table, the crop, the ordering exception for open
 * locations and the packet's own wording all live in `edge-seed.mjs`; nothing
 * about a seam is decided here. */
import { attachSeed, packetNote, attachLine, openOrder, isOpenLocation, isPainted }
  from "./edge-seed.mjs";

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
/* ONE MEASURED HEIGHT, MANY VOICED FEATURES. `row23_lib.py` reads a single
 * horizontal out of the `rail_band` this file declares and converts it with
 * `rail_above / 0.95`; that divisor is the instrument's and nothing here may
 * move it. So a kitchen does not drop the anchor — it renames it (a plain
 * hanging rail instead of a chair-rail) at the same ruled height, and a garden
 * wall names a string-course. `room-voices.mjs` owns that table and this line is
 * the handshake: if the two ever disagree the emitter refuses rather than
 * stamping a ruler the gate is not measuring. */
if (ANCHOR_M !== CHAIR_RAIL_M) {
  throw new Error(
    `make-scaffold: room-voices declares its anchor at ${ANCHOR_M} m and this file rules it at ` +
    `${CHAIR_RAIL_M} m. Every voice's anchor is the SAME ruled height — only its feature and its ` +
    `name change with the room — because row23_lib.py divides the measured height by 0.95.`);
}
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
    } else if (c.kind === "open_edge") {
      /* No wall here at all: the box is the whole height of where a wall
       * would stand, and the sentence says the ground runs out through it. */
      rect.y0 = 0;
      rect.y1 = floorY;
      rect.label = "OPEN SIDE";
      rect.sub = `NO WALL · OPEN ${c.width_m.toFixed(2)} M`;
      rect.ruled = ["width"];
      rect.beyond = c.beyond || null;
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
  return { rects: out, apertures, flights: flightRects(plan, loc, facing, meta) };
}

/* ------------------------------------------------------------------ */
/* The flight region                                                   */
/* ------------------------------------------------------------------ */
/* A CARRIER IS IN A WALL; A FLIGHT IS ON THE FLOOR — so a staircase is not a
 * `scaffoldRects` box and never could be. Its rectangle is not a ruled width at
 * the wall plane, it is the extent of a projected solid, and stamping it in
 * ruler space would put the label somewhere the flight is not.
 *
 * It is stamped anyway, because the diagram already DRAWS the flight (the
 * renderer strokes it from `meta.stairs`) and an unlabelled shape in a technical
 * drawing is a shape a painter is free to read as scenery. Six manor walls came
 * back with the staircase missing and were refused promotion by the row-32
 * clause; every one of them was painted from a diagram that drew the flight and
 * a prompt that never named it.
 *
 * THE BOX IS THE CLAMPED RECT AND THE NOTE CARRIES THE RAW EXTENT. `x/y/w/h` on
 * a flight are already the intersection with the frame, so the box is honest
 * about what is in the picture; where the frame cut the body, the note says so,
 * because "paint inside this box, filling it" is a lie about a flight that runs
 * off three edges. */
const FLIGHT_LABEL_H = 40;
const FLIGHT_NOTE_H = 18;
export const CLIMB_STAMP = {
  left: "CLIMBS TO THE LEFT",
  right: "CLIMBS TO THE RIGHT",
  away: "CLIMBS AWAY FROM THE VIEWER",
  toward: "CLIMBS TOWARD THE VIEWER"
};

export function flightRects(plan, loc, facing, meta) {
  const out = [];
  for (const s of flightsForFacing(plan, loc, facing, meta, CANVAS_W)) {
    const climb = s.climb ? CLIMB_STAMP[s.climb] : "NO TREAD IN FRAME - FLOOR OPENING ONLY";
    const cut = s.runs_off.length
      ? `CUT BY THE FRAME ON THE ${s.runs_off.join(" AND ").toUpperCase()}`
      : "";
    const label = "FLIGHT";
    /* TWO NOTE LINES RATHER THAN ONE LONG ONE. A flight cut on three edges
     * carries 105 characters of note, which at a legible stroke height is
     * 1674 px on a 1536 px frame — ink outside the picture, which is the one
     * thing the confinement discipline exists to refuse. The line breaks
     * instead of the letters shrinking. */
    const notes = [`${s.treads} TREADS · ${s.width_m.toFixed(2)} M WIDE · ${climb}`];
    if (cut) notes.push(cut);
    assertLabelChars(label, `${loc}/${facing}'s flight label`);
    for (const n of notes) assertLabelChars(n, `${loc}/${facing}'s flight note`);
    const lw = textBox(label, FLIGHT_LABEL_H);
    const widths = notes.map((n) => textBox(n, FLIGHT_NOTE_H));
    const blockW = Math.max(lw, ...widths);
    const blockH = FLIGHT_LABEL_H + 10 + notes.length * FLIGHT_NOTE_H +
      (notes.length - 1) * 6;
    /* THE BLOCK SITS AT THE TOP OF THE REGION AND CLEARS THE LEGEND. A
     * descending flight's box begins near the bottom of the frame — its top
     * edge is the floor opening at your feet — and the legend already owns
     * those rows. A label the legend overprints is a label nobody can read, so
     * where the region starts inside the legend's band the block is lifted to
     * just above it and still points at the box below. */
    const x = Math.max(8, Math.min(s.x + 14, CANVAS_W - blockW - 8));
    const y = Math.max(8, Math.min(s.y + 14, LEGEND_TOP_Y - blockH - 10));
    out.push({
      kind: "flight", id: s.id, direction: s.direction, climb: s.climb,
      treads: s.treads, treads_in_view: s.treads_in_view,
      width_m: s.width_m, rise_m: s.rise_m, runs_off: s.runs_off,
      x0: round(s.x, 2), y0: round(s.y, 2),
      x1: round(s.x + s.w, 2), y1: round(s.y + s.h, 2),
      raw_w: round(s.raw_w, 2), raw_h: round(s.raw_h, 2),
      label, sub: notes.join(" · "),
      ruled: ["width", "tread count", "rise"],
      convention: [],
      label_rect: rnd({ x, y, w: lw, h: FLIGHT_LABEL_H }),
      notes: notes.map((text, i) => ({
        text,
        ...rnd({
          x, y: y + FLIGHT_LABEL_H + 10 + i * (FLIGHT_NOTE_H + 6),
          w: widths[i], h: FLIGHT_NOTE_H
        })
      }))
    });
  }
  return out;
}

/**
 * The gate anchor's line: the one ruler the gate votes on, drawn corner to
 * corner at exactly 0.95 m above the floor line.
 *
 * On `study/N` this lands at y 570.0 and the reference painting's own measured
 * `dado_rail_y_px` is 570. That agreement is the generator's first check.
 *
 * THE GEOMETRY IS FIXED AND THE LABEL IS VOICED. Row 29: the stamp used to read
 * `CHAIR-RAIL` on every facing in the manor, so the DIAGRAM handed to a painter
 * drew a chair-rail across the privy garden and Kabe walked into it ("exterior
 * garden has interior wall outside"). The height, the band and the brackets are
 * untouched — only the words change, and they change with the room's voice.
 * `anchor` is a `room-voices.mjs` anchor; omitted, it is the panelled rooms'
 * chair-rail, which is what the two experiment walls carry.
 */
export function chairRail(meta, anchor) {
  const y = round(wallY(CHAIR_RAIL_M, meta), 2);
  const has = groundplane.hasCorners(meta);
  return {
    y,
    x0: has ? meta.corner_x0_px : 0,
    x1: has ? meta.corner_x1_px : CANVAS_W,
    label: anchor ? anchor.label
      : `CHAIR-RAIL ${CHAIR_RAIL_M.toFixed(2)} M ABOVE FLOOR - GATE ANCHOR`,
    anchor: anchor ? anchor.id : "chair_rail"
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

  /* THE FLIGHT REGIONS, drawn on a longer dash than a carrier box so the two
     read as different kinds of instruction: a carrier box is a hole of a ruled
     width in the wall plane, a flight region is the extent of a solid standing
     on the floor. `marks.flights` is absent on every scaffold cut before the
     flight language existed, and an older sidecar must still re-render. */
  for (const s of (marks.flights || [])) {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.setLineDash([28, 12]);
    ctx.strokeRect(s.x0, s.y0, s.x1 - s.x0, s.y1 - s.y0);
    ctx.setLineDash([]);
    glyphText(s.label, s.label_rect.x, s.label_rect.y, s.label_rect.h, INK);
    for (const n of s.notes) glyphText(n.text, n.x, n.y, n.h, DIM);
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
/* FIVE LINES, ALWAYS — the legend's content is fixed and its height with it, so
 * the row the legend's frame begins at is a constant every other mark can be
 * kept clear of rather than a number only `legendFor` knows. `legendFor`
 * asserts the count, so a sixth line is a refusal instead of a silent overlap. */
const LEGEND_LINES = 5;
export const LEGEND_TOP_Y = CANVAS_H - (LEGEND_LINE_H * LEGEND_LINES + 22) - 24;
function legendFor(meta, rects, camera, anchor) {
  const lines = [
    "SCAFFOLD LEGEND - THESE MARKS ARE INSTRUCTIONS AND ARE NEVER PAINTED",
    `RULED - ${anchor ? anchor.legend_word : "CHAIR-RAIL"} ${CHAIR_RAIL_M.toFixed(2)} M · CARRIER WIDTHS · DOOR HEAD ${DOOR_HEAD_M.toFixed(2)} M`,
    "CONVENTION - CARRIER HEIGHTS ABOVE FLOOR · WINDOW SILL AND HEAD",
    `SCALE - ONE METRE OF WALL SPANS ${meta.px_per_m_at_wall.toFixed(0)} PIXELS AT THE WALL PLANE`,
    `CAMERA - ${camera}`
  ];
  for (const l of lines) assertLabelChars(l, "the legend");
  if (lines.length !== LEGEND_LINES) {
    throw new Error(
      `make-scaffold: the legend is ${lines.length} lines and LEGEND_TOP_Y is derived from ` +
      `${LEGEND_LINES}. Every mark placed clear of the legend reads that constant, so the two ` +
      `must move together or a label lands under the box that hides it.`);
  }
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
  if (argv.includes("--emit-final")) {
    const out = resolve(argOf("--out", join(ROOT, "design", "batches", "row23-scaffold")));
    await emitFinal(out);
    return;
  }
  if (argv.includes("--emit-manor")) {
    const out = resolve(argOf("--out", join(ROOT, "design", "batches", "row23-scaffold", "manor")));
    await emitManor(out, {
      technique: argOf("--technique", "t2"),
      rolls: Number(argOf("--rolls", "2")),
      retries: Number(argOf("--retries", "2")),
      limit: argOf("--limit") ? Number(argOf("--limit")) : 0
    });
    return;
  }
  if (argv.includes("--emit-retries")) {
    const out = resolve(argOf("--out", join(ROOT, "design", "batches", "row23-scaffold", "manor")));
    await emitRetries(out, {
      technique: argOf("--technique", "t2"),
      rolls: Number(argOf("--rolls", "2")),
      retries: Number(argOf("--retries", "3")),
      walls: argv.reduce((a, x, i) => (x === "--wall" ? a.concat(argv[i + 1]) : a), [])
    });
    return;
  }
  if (argv.includes("--emit-facing-materials")) {
    const plan = JSON.parse(readFileSync(join(ROOT, "fixtures", "demo-study", "plan.json"), "utf8"));
    const doc = emitMaterials(VOICES, plan);
    const fm = facingMaterials(plan, doc);
    const out = join(ROOT, "backdrops", "textures", "facings.json");
    writeFileSync(out, JSON.stringify({
      _what_this_is:
        "Which texture each facing of the plan actually shows. Emitted from " +
        "tools/make-scaffold.mjs, which owns the walls_with_openings rule and " +
        "reads the same scaffoldRects the prompts are generated from. Do not " +
        "hand-edit -- regenerate with `--emit-facing-materials`.",
      facings: fm
    }, null, 2) + "\n");
    console.log(`facings ${Object.keys(fm).length}  wrote ${out.slice(ROOT.length + 1)}`);
    return;
  }
  if (argv.includes("--emit-swatch")) {
    const out = resolve(argOf("--out", join(ROOT, "design", "batches", "row36-assembly", "swatches")));
    const r = emitSwatches(out, { rolls: Number(argOf("--rolls", "2")) });
    console.log(`swatch packets  ${r.packets.length}`);
    for (const p of r.packets) console.log(`  ${p.material.padEnd(34)} ${p.rolls.length} roll(s)`);
    console.log(`index           ${r.indexPath.slice(ROOT.length + 1)}`);
    return;
  }
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

  const { rects, apertures, flights } = scaffoldRects(plan, loc, facing, meta);
  /* The room's own voice decides what the anchor is CALLED on the diagram; the
   * height, the band and every bracket are unchanged by it. */
  const { voice, anchor, via } = voiceFor(plan, loc, facing);
  const cr = chairRail(meta, anchor);
  assertLabelChars(cr.label, "the gate anchor's label");
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
  const legend = legendFor(meta, rects, CAMERA_WORD[camera] || camera, anchor);

  let tol = null;
  if (REFLEX[key]) {
    const src = reading || JSON.parse(readFileSync(
      join(ROOT, "design", "plan-draft", "measured", key === "study/N" ? "cand5ref" : roundName,
        `${loc}-${facing}.json`), "utf8"));
    tol = carrierTolerance(plan, loc, facing, meta, REFLEX[key](src));
  }
  const bk = brackets(meta, rects, tol == null ? 0 : tol);

  const marks = { rects, chair_rail: cr, legend, flights };
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
    /* THE FLIGHTS THIS VIEW HOLDS, stamped as regions rather than carriers, and
     * declared with BOTH rectangles: the box drawn is the frame's own
     * intersection, `raw_w`/`raw_h` are the body before the frame cut it. The
     * prompt's Stairs paragraph is composed from the same projection. */
    flights_stamped: flights,
    chair_rail: { y: round(cr.y, 2), x0: cr.x0, x1: cr.x1, ruled_m: CHAIR_RAIL_M },
    /* WHICH FEATURE THIS WALL'S ANCHOR IS, and how the voice was reached. The
     * ruled height never varies (`row23_lib.py` divides by 0.95); the feature
     * and its name do, so the record says which one this diagram stamped. */
    voice: { id: voice.id, via, why: voice.why, outdoor: !!voice.outdoor,
      anchor: anchor.id, anchor_line: anchor.line, anchor_ruled_m: CHAIR_RAIL_M },
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


/* ------------------------------------------------------------------ */
/* The generic wall prompt — what the manor run actually dispatches     */
/* ------------------------------------------------------------------ */
/* The two experiment walls had their sentences written by hand because there
 * were two of them. Eighty-six do not, and a production recipe that needs a
 * human to write a paragraph per wall is not a recipe. Every clause below is
 * derived from the plan's own carriers and the facing's own meta, so a wall
 * that moves in the plan re-emits with it.
 *
 * THE RULED SIZES ARE THE GATE'S OWN. A prompt may only declare a dimension the
 * acceptance gate can measure, at the size this project rules it — `prompt_lint`
 * refuses anything else, and it is the whole reason `Gate anchor:` exists. */
const PIER_ANCHOR_SENTENCE = "The open side is flanked at each end, at the edge of frame, by a low coursed-stone pier where the boundary wall stops; the flat stone cap on each pier sits at exactly 0.95 m above the ground at the open side's line. Between the piers nothing stands. It is masonry standing in the open air: no timber rail, no lining and no built interior finish of any kind appears anywhere in this picture.";
const OPEN_SIDE_FABRIC = "no wall at all on this side: open ground running out through the open side and on to the horizon, with only the low stone piers at its two ends, under open sky";

const CARRIER_SENTENCE = {
  /* "…and the space beyond is unlit": row 27's lesson folded in per production
   * law clause 6. The promotion instrument reads a painted doorway as a VOID —
   * a dark run against the wall plane — and a doorway painted with a lit room
   * behind it is unmeasurable (library/S was demoted for exactly this). The
   * darkness is also what the renderer wants: it composites the destination
   * room into the opening, so painted light back there fights the through-view. */
  door: (w, which, where) => `The ${which}door opening is exactly ${w.toFixed(2)} m wide and exactly 2.00 m high at the wall plane, and it stands empty with no door leaf hung in it${where}. The space beyond the opening is deep unlit shadow — no lit room, no visible far wall, no light source beyond the doorway.`,
  window: (w, which, where) => `The ${which}leaded window opening is exactly ${w.toFixed(2)} m wide${where}.`,
  fireplace: (w, which, where) => `The ${which}stone fireplace's firebox opening is exactly 0.90 m wide, and its stone breast is exactly ${w.toFixed(2)} m wide${where}.`,
  /* [Kabe, 2026-08-24: "Entrance court s looks very weird on the edges"] The
   * mouth was asked as a blank wall and painted as a parapet. An open edge is
   * the ABSENCE of a wall, said as such, with nothing across it. */
  open_edge: (w, which, where) => `This side is not a wall at all: it is open across its full ${w.toFixed(2)} m width, with no wall, gate, parapet, railing or hedge across any part of it${where}. This place's own ground runs straight out through the open side and continues as the same ground beyond it, under open sky, to the far horizon.`
};

/* WHICH ONE OF THEM, when a wall carries more than one of a kind.
 *
 * `great_hall/W` and `long_gallery/W` each carry TWO doorways, and until this
 * existed their prompts said the identical door sentence twice — a painter told
 * the same thing about a doorway with nothing to attach the second telling to.
 * Both walls came back with fewer holes than the plan rules and both were
 * refused promotion for it. A duplicated instruction is one instruction; the
 * position is what makes it two. Where a wall carries exactly one of a kind
 * nothing is added, because the box on Image 2 already says which. */
const WHICH_OF = [[], [""], ["left-hand ", "right-hand "],
  ["left-hand ", "middle ", "right-hand "]];
function whichWords(n) {
  if (WHICH_OF[n]) return WHICH_OF[n];
  const ORD = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth"];
  return Array.from({ length: n }, (_, i) => `${ORD[i] || `${i + 1}th`}-from-the-left `);
}
/* THE MATERIAL VOICE IS NOT HERE. It was — an archetype-keyed `ROOM_MATERIALS`
 * table with four entries, which the plan's six archetypes overflowed: `service`
 * and `stair` were absent, so the kitchen, the buttery, the servants' hall and
 * both stairs fell to the `chamber` default and were asked for the STUDY's own
 * paragraph. It now lives in `tools/room-voices.mjs`, keyed on the plan's own
 * room ids, with each voice's period justification beside it and a refusal
 * rather than a default for a room nothing resolves. */

/**
 * One production wall's prompt: every clause a function of the plan's carriers,
 * this facing's meta, and the room's voice.
 *
 * `correction` is optional. A re-ask carries the measured sentence the run loop
 * wrote into `run-state.json` verbatim, at the top where it cannot be missed —
 * that is the only difference between a first ask and a re-ask, so the two
 * cannot drift into differently-worded requests for one wall.
 *
 * `seed` is optional and is row 38's: the completed neighbour's abutting strip,
 * already cut and recorded by `edge-seed.mjs`. It adds ONE line, in the Input
 * images paragraph where the other two images are introduced, because the
 * cookbook rule the row cites is that every reference image is named by index
 * and by role and the interaction is stated. The pixels are the appearance; this
 * sentence is the only thing that says what to do with them.
 */
export function manorPrompt(plan, key, meta, rects, correction, seed) {
  const [loc, f] = key.split("/");
  const room = plan.rooms.find((r) => r.id === loc);
  const side = { N: "north", E: "east", S: "south", W: "west" }[f];
  const { voice, anchor } = voiceFor(plan, loc, f);
  const out = voice.outdoor;
  const name = (room.name || room.id).toLowerCase();
  const SURFACE = out ? "side" : "wall";
  /* THE WINDOWS COME OFF THE STAMPED BOXES, not off the plan a second time, so
   * the width the prompt states is the width the scaffold drew and the gate
   * will score. `u` is the box's own centre as a fraction of the ruled wall. */
  const windows = rects.filter((r) => r.kind === "window").map((r) => ({
    width_m: (r.x1 - r.x0) / meta.px_per_m_at_wall,
    u: (r.from_m + r.to_m) / 2 / meta.wall_width_m
  }));
  /* The ruled carrier sentences, MINUS the windows: the window paragraph below
   * states every opening's width once, and the old per-carrier line restated
   * "The leaded window opening is exactly 1.50 m wide" four times on
   * `great_hall/S` — the very repetition row 29 is about. */
  const spoken = rects.filter((r) => r.kind !== "window");
  const nOf = {};
  for (const r of spoken) nOf[r.kind] = (nOf[r.kind] || 0) + 1;
  const seen = {};
  const ruled = spoken.map((r) => {
    const fn = CARRIER_SENTENCE[r.kind];
    if (!fn) return null;
    const i = seen[r.kind] = (seen[r.kind] || 0);
    seen[r.kind] = i + 1;
    const n = nOf[r.kind];
    const which = whichWords(n)[i];
    /* THE POSITION IS ATTACHED ONLY WHERE IT DISAMBIGUATES, and it is attached
     * in the register's own units — the picture's own columns, which is where
     * `coordinateLines` puts every other figure in this prompt. */
    const where = n > 1
      ? `, and in the picture it stands between ${col(r.x0)} and ${col(r.x1)}`
      : "";
    return fn((r.x1 - r.x0) / meta.px_per_m_at_wall, which, where);
  }).filter(Boolean);
  /* THE FLIGHT, if the plan draws one in this view. Derived here rather than
   * handed in, so that EVERY caller of this composer — the manor emit, the
   * re-ask, the suite's own 88-prompt sweep — asks for the staircase without
   * having to remember to. `flightsForFacing` is the same projection
   * `promote-backdrop.mjs`'s row-32 refusal reads, so the ask and the refusal
   * cannot be describing two different staircases. */
  const flights = flightsForFacing(plan, loc, f, meta, CANVAS_W);
  /* Underfoot and overhead: an outdoor facing has ground and sky where an
   * interior has a floor and a ceiling, and every line below that would
   * otherwise say "floor" or "room" asks the voice instead. */
  const GROUND = out ? "ground" : "floor";

  const L = [];
  /* THE USE-CASE LINE CARRIES THE VOICE'S SIDE OF THE DOOR, and the lint reads
   * it: an `exterior` prompt that then names interior fabric is refused before
   * an image exists. That is Kabe's veto as a clause rather than as a memory. */
  L.push(`Use case: historical-scene, ${out ? "exterior" : "interior"}`);
  L.push(`Asset type: gameplay backdrop for the ${side} ${SURFACE} of the ${name}, circa-1660 English manor`);
  if (correction) {
    /* FIRST, BECAUSE IT IS THE REASON THIS ASK EXISTS. Verbatim from
     * run-state.json — the measurement's own words, never a paraphrase.
     *
     * EXCEPT WHERE THE WORDS THEMSELVES ARE THE DEFECT. `privy_garden/N`'s
     * correction is Kabe's veto, and to say what went wrong it names "interior
     * oak panelling and a chair-rail" — on the one wall those words were
     * vetoed from. Carrying it put them straight back in front of the
     * generator, and the lint refused the packet, correctly. So an outdoor
     * wall carries its correction only when the correction can be said without
     * naming interior fabric; otherwise it carries the forward half and the
     * verbatim reason goes to PACKET.md and `retries.json`, where a reader
     * needs it and no generator reads it. */
    const say = (out && !carryableOutdoors(correction)) ? REDACTED_CORRECTION : correction;
    L.push(`Correction on a previous attempt at this exact wall: ${say}`);
    L.push("  Everything else below still holds; this correction is the change being asked for.");
  }
  L.push("Input images: Image 1 is the exact reference for painted MEDIUM, palette, light quality");
  L.push("  and brush handling. It is NOT a reference for this place's materials, for how many");
  L.push("  openings this wall has, or for what is in its glass — those are the words below, and");
  L.push("  where Image 1 and these words disagree, these words win. Image 2 is a geometric layout");
  L.push("  diagram of the surface to be painted: it is a technical drawing, not artwork to imitate.");
  L.push("  Image 2's boxed labels mark where a named feature belongs: paint that feature inside its box, filling it. The labels themselves are instructions and are never painted.");
  /* [row 38] ONE PHYSICAL LINE, like every other declared sentence in this
   * composer — the t1/t2 control counts lines, and a sentence wrapped across
   * two of them has changed the diff. */
  if (seed) L.push(`  ${seed.role_sentence}`);
  L.push(`Primary request: Paint the ${side} ${SURFACE} of the empty ${name} of a circa-1660 English manor,`);
  L.push("  matching Image 1's paint handling and Image 2's geometry exactly.");
  L.push(`Gate anchor: ${anchor.line}, ${CHAIR_RAIL_M.toFixed(2)} m.`);
  /* [row 34] THE CAMERA IS ASKED FOR AS A FINISHED PICTURE, NOT AS AN OPERATION.
   * What stood here described the camera and told the painter to reproduce
   * Image 2's to the pixel, and it carried row 32's eye-line sentence at the
   * end. Three generations of the row-34 trial replaced it, and the register
   * below is what they recommend: the finished picture described in image-frame
   * terms, WITH the coordinates attached. Both halves are load-bearing —
   * stripping the figures out was the ablation's one clear loss, and piling more
   * on dropped a leading arm from 3 of 4 to 1 of 4.
   *
   * ROW 32's CLAUSE SURVIVES IT. The eye-line row is still stated on every
   * facing, including the open ones that have no corners to hang a return on;
   * `coordinateLines` carries it in both branches, and `horizon.spec` checks the
   * row rather than the sentence, because the sentence is what changed.
   *
   * NOTHING HERE SEPARATED. See `frame-language.mjs`. */
  for (const line of registerBlock({
    geometry: frameGeometry(meta), meta, voice, surface: SURFACE, room_name: name
  })) L.push(line);
  /* [Kabe, 2026-08-24] THE COPING CANNOT RUN ACROSS A MOUTH. `outdoors_open`'s
   * anchor sentence closes the view with a boundary wall — right for the
   * court's blank sides, and the parapet the painter built across the 20 m
   * mouth on the south. Where the facing carries an open edge the ruler moves
   * to the piers at its ends and the sentence says nothing stands between. */
  const openSide = rects.find((r) => r.kind === "open_edge") || null;
  L.push(`Architecture and measurement anchors: ${openSide ? PIER_ANCHOR_SENTENCE : anchor.sentence}`);
  for (const r of ruled) L.push("  " + r);
  if (rects.length) {
    L.push("  Each feature stands where Image 2's box for it stands, filling that box's width.");
  } else {
    /* "no hearth" was here, and the lint's outdoor clause refuses the word
     * `hearth` in an exterior prompt — correctly, since it is interior fabric
     * and naming it even to deny it puts it in front of the generator. */
    /* AND THE FLIGHT IS NOT NOTHING. A stair stands ON THE FLOOR rather than in
     * a wall, so a facing can carry no wall opening at all and still have a
     * staircase across most of its picture — `great_stair_hall/W` is exactly
     * that. Saying "no built feature at all" there contradicts the Stairs
     * paragraph below it, so the wall's blankness is stated as the WALL's. */
    L.push(`  This ${SURFACE} carries no opening and no built feature at all: it is ${voice.blank}, and`);
    L.push(flights.length
      ? `  the anchor above is the one ruled feature in it. What else this view holds stands on the`
      : "  the anchor above is the one ruled feature in it.");
    if (flights.length) L.push(`  ${GROUND} in front of it, and it is described below.`);
  }
  L.push("  Make these dimensions physically coherent and unmistakable in the architecture.");
  /* ── the flight, where the plan draws one ── */
  for (const line of flightLines({ flights, meta, voice, surface: SURFACE, room_name: name })) {
    L.push(line);
  }
  /* ── the voice ── */
  if (out) {
    /* AN OUTDOOR FACING WITH OPENINGS IN IT IS THE HOUSE'S OWN ELEVATION, and
     * the plan decides which by whether it draws any carrier on that wall line
     * — `entrance_court/N` six windows and a door, `privy_garden/N` nothing. */
    /* AND AN OPEN EDGE IS NOT AN OPENING IN A WALL. Counting the court's
     * mouth as a carrier would dress its south side as the house's brick
     * elevation; it is the absence of a wall, and the fabric says so. */
    const built = rects.filter((r) => r.kind !== "open_edge");
    const fabric = (openSide && !built.length) ? OPEN_SIDE_FABRIC
      : (built.length && voice.walls_with_openings) || voice.walls;
    L.push(`Materials/textures: ${fabric}. Underfoot: ${voice.floor}.`);
    L.push("  Overhead is open sky with weather in it, and daylight falls from it onto everything");
    L.push("  in frame. This place is out of doors and everything in it is built for weather.");
  } else {
    L.push(`Materials/textures: ${voice.walls}. Overhead: ${voice.ceiling}.`);
    L.push(`  Underfoot: ${voice.floor}.`);
    if (voice.id === "bedchamber") L.push(`  Hangings: ${hangingsFor(loc)}.`);
  }
  /* ── the windows, and the heraldry ration ── */
  for (const line of windowLines(voice, windows, name, SURFACE)) L.push(line);
  L.push("Style/medium: as Image 1 - fine oil realism with tactile brush detail, deep warm");
  L.push("  browns, cool ambient light, gentle natural falloff.");
  if (out) {
    L.push(`Constraints: the ${name} is completely empty. Nobody is in it and no animal is in it;`);
    L.push("  it holds no cart and no garden furniture, and it carries no tub and no statuary. Its");
    L.push("  planting is low and kept, and nothing grown crosses the wall plane.");
  } else {
    L.push(`Constraints: the ${name} is completely empty. No furniture stands in it and nobody is in it;`);
    L.push("  there are no loose props and no animals.");
  }
  /* [row 34] POSITIVE SUBSTITUTION, not a list of prohibitions. The old three
   * lines were a comma-tag enumeration AND a suppression, which are the two
   * shapes the model-specific research warns about — the second because
   * forbidden text tends to re-express itself as objects. The outdoor form
   * names no interior fabric, because row 29's veto is a clause and it applies
   * to a rule as much as to a wall. */
  L.push(`  Image 2 is a layout drawing and its marks are instructions rather than things to paint.`);
  for (const line of positiveNoText({ voice })) L.push(line);
  return L.join("\n") + "\n";
}

/* ------------------------------------------------------------------ */
/* The manor, in one pass                                              */
/* ------------------------------------------------------------------ */
/* [HUMAN, 2026-08-23] "We really need to consider the most efficient way to go
 * from schematic/description to full assets. To the degree we hope to one pass
 * parallel all assets created few turns each to full completion."
 *
 * So the manor is not a sequence of waves. `--emit-manor` walks every facing the
 * plan holds, cuts its scaffold, writes its packet, and emits ONE manifest that
 * is the whole order — dispatched at once, painted in parallel, with a capped
 * number of retries per wall rather than a queue that has to be drained in
 * order.
 *
 * THREE THINGS THE MANIFEST IS SHAPED BY, all of them consequences of that:
 *
 *   1. ARRIVALS ARE UNORDERED. Every return path is absolute and unique, and
 *      the measurement is a directory watch: `measure.py --round row23` reads
 *      whatever is on disk and reports what is not. Nothing waits for a wave to
 *      complete, and re-running after more land costs only the new ones.
 *   2. A WALL CARRIES ITS OWN ACCEPTANCE. Each entry names the reference its
 *      candidates are read against and the retry cap, so a failing wall retries
 *      itself without consulting anything global.
 *   3. ONE BROWSER FOR THE WHOLE RUN. Eighty-six facings at one page launch
 *      each is most of an hour of process startup; the manor mode opens the
 *      page once and renders every facing through it.
 */

/** Every facing the plan holds, with what is already painted marked. */
export function manorFacings(plan) {
  const out = [];
  for (const room of plan.rooms) {
    for (const f of Object.keys(room.facings || {})) {
      const key = `${room.id}/${f}`;
      const promoted = existsSync(join(ROOT, "backdrops", room.id, `${f}.meta.json`));
      out.push({
        key, room: room.id, facing: f, floor: room.floor, type: room.type,
        promoted,
        fenced: PENDING_ROWS[key] || null,
        carriers: facingCarriers(plan, room.id, f).map((c) => c.kind)
      });
    }
  }
  return out;
}

/** A manor wall has no measured no-label baseline — only the two experiment
 *  walls do — so its carrier window is the stamped box dilated by the wall's own
 *  ruled carrier width. Derived, stated, and never borrowed from another wall. */
function tolFor(meta, rects) {
  if (!rects.length) return 0;
  const widest = Math.max(...rects.map((r) => r.x1 - r.x0));
  return Math.round(widest);
}

async function emitManor(outDir, opts) {
  const t_run = Date.now() / 1000;                                        // [row 33]
  const plan = JSON.parse(readFileSync(join(ROOT, "fixtures", "demo-study", "plan.json"), "utf8"));
  const all = manorFacings(plan);

  /* THE WORKLIST IS DERIVED BY LOOKING, NEVER BY ASSUMING.
   * [HUMAN, 2026-08-23] "Also make sure we algorithmicly skip art already
   * existing in the library."
   *
   * ART IS GENERATED ONCE, PROMOTED ONCE, AND THEREAFTER READ. That is the same
   * doctrine the content contract already runs on one tier up — a side wall is
   * not re-imagined, it is inherited from the neighbour that already exists,
   * and typed materials are reused per room rather than re-asked per facing.
   * Reuse is a property of the store, so it is checked against the store: a
   * facing is skipped because a file is there, not because a list said so.
   *
   * Three states are outstanding work and everything else is not:
   *   PROMOTED   backdrops/<loc>/<F>.png AND its meta exist -> read, never re-made
   *   RETURNED   a candidate PNG is already on disk -> the MEASURE loop's, not
   *              the seat's; dispatching it again would pay twice for one wall
   *   SPENT      the retry budget is exhausted -> parked, and re-emitting would
   *              quietly restart a count that exists to stop
   *
   * Re-running this at any moment is therefore idempotent, and every skip is
   * recorded WITH ITS REASON, because a silent skip is indistinguishable from a
   * wall nobody noticed. */
  const state = existsSync(join(outDir, "run-state.json"))
    ? JSON.parse(readFileSync(join(outDir, "run-state.json"), "utf8")) : { walls: {} };
  const skipped = [];
  const outstanding = [];
  for (const x of all) {
    if (x.fenced) {
      skipped.push({ ...x, skipped: `fenced: row ${x.fenced} moves this standpoint` });
      continue;
    }
    const png = join(ROOT, "backdrops", x.room, `${x.facing}.png`);
    const meta = join(ROOT, "backdrops", x.room, `${x.facing}.meta.json`);
    if (existsSync(png) && existsSync(meta)) {
      skipped.push({ ...x, skipped: `exists: backdrops/${x.room}/${x.facing}.png` });
      continue;
    }
    const already = readdirSync(join(ROOT, sourceDirFor(x.key)), { withFileTypes: true })
      .filter((d) => d.isFile() && /^row23-[0-9a-f]{8}\.png$/.test(d.name))
      .map((d) => `${sourceDirFor(x.key)}/${d.name}`);
    if (already.length) {
      skipped.push({ ...x, skipped: `returned, unmeasured: ${already.length} candidate(s) on disk`,
        returns: already,
        _routed: "the measure loop, not the seat - dispatching this again pays twice for one wall" });
      continue;
    }
    const w = state.walls[x.key];
    if (w && (w.status === "parked" || w.status === "promoted")) {
      skipped.push({ ...x, skipped: `${w.status}: ${w.why || "recorded in run-state.json"}` });
      continue;
    }
    outstanding.push(x);
  }
  const todo = outstanding.slice(0, opts.limit || undefined);
  mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1536, height: 1200 } });
  await page.goto(pathToFileURL(join(ROOT, "index.html")).href + "?world=nav-manor");
  await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);

  const entries = [];
  for (const fac of todo) {
    const [loc, f] = fac.key.split("/");
    let meta;
    try {
      meta = await page.evaluate((k) => {
        const e = window.HOLO_APP.backdrops[k];
        return e && e.meta ? e.meta : null;
      }, fac.key);
    } catch (e) { meta = null; }
    if (!meta) {
      entries.push({ ...fac, skipped: "the page holds no meta for this facing" });
      continue;
    }
    /* [row 33] The scaffold cut for one facing: two full-canvas renders read
     * back out of a browser, which is the emit half of the pipeline's clock. */
    const t_facing = Date.now() / 1000;
    const { rects, flights } = scaffoldRects(plan, loc, f, meta);
    const { voice, anchor, via } = voiceFor(plan, loc, f);
    const cr = chairRail(meta, anchor);
    assertLabelChars(cr.label, `${fac.key}'s gate anchor label`);
    const legend = legendFor(meta, rects, "THE META THIS PAGE HOLDS FOR THIS FACING", anchor);
    const marks = { rects, chair_rail: cr, legend, flights };
    const framePng = await renderPng(page, fac.key, meta, "scaffold", null);
    const scafPng = await renderPng(page, fac.key, meta, "scaffold", marks);
    const dir = join(outDir, `${loc}-${f}`);
    mkdirSync(dir, { recursive: true });
    writePng(framePng, join(dir, "frame.png"));
    writePng(scafPng, join(dir, "scaffold.png"));
    /* [row 38] THE SEAM SEED, cut beside the packet before the prompt is
     * composed, because the prompt only names Image 3 where Image 3 exists. */
    const { seed, plan: seedPlan } = attachSeed(plan, fac.key, dir);
    timings.record("emit.facing", t_facing, Date.now() / 1000, fac.key,   // [row 33]
      { carriers: rects.length, voice: voice.id, technique: opts.technique || "t2" });

    const t_packet = Date.now() / 1000;                                   // [row 33]
    const ids = [];
    for (let i = 1; i <= (opts.rolls || 2); i++) {
      const id = rollId(fac.key, opts.technique || "t2", null, i);
      ids.push({
        roll: i, id,
        candidate: `${sourceDirFor(fac.key)}/row23-${id}.png`,
        prompt: `${sourceDirFor(fac.key)}/row23-${id}.prompt.txt`
      });
    }
    /* THE PACKET, not just the picture. A manifest entry a seat cannot paint
       from is a row in a table; what makes the run one order is that every
       entry is complete where it stands. */
    const text = manorPrompt(plan, fac.key, meta, rects, null, seed);
    writeFileSync(join(dir, "prompt.txt"), text);
    copyFileSync(join(ROOT, STYLE_SEED), join(dir, "style-seed-warm.png"));
    mkdirSync(join(ROOT, sourceDirFor(fac.key)), { recursive: true });
    for (const r of ids) writeFileSync(join(ROOT, r.prompt), text);
    writeFileSync(join(dir, "PACKET.md"),
      `# ${fac.key} — technique t2 (labelled scaffold)\n\n` +
      packetNote(seed, seedPlan) +
      `${attachLine(seed)}\n` +
      `order, then send \`prompt.txt\` verbatim. Generate ${ids.length} images and save them to the\n` +
      `exact paths below — the measurement runs the moment a file appears at one of them.\n\n` +
      ids.map((r) => `| roll ${r.roll} | \`${r.candidate}\` |`).join("\n") +
      `\n\nThe prompt files are already on disk beside them. Do not rewrite them.\n\n` +
      `This wall: ${meta.px_per_m_at_wall.toFixed(1)} px per metre at the wall plane, ` +
      `${rects.length ? rects.map((r) => r.kind).join(" + ") : `no carrier — ${voice.blank}`}.\n` +
      `Voice: **${voice.id}** (${via}); gate anchor **${anchor.line}**, ${CHAIR_RAIL_M.toFixed(2)} m.\n` +
      `Write only under \`backdrops/\`. Never \`src/\`, never \`design/\`.\n`);
    /* [row 33] The packet, and with it the moment the seat COULD have started —
     * `emit.packet` -> `generate.roll` is the dispatch queue, and the first
     * backfilled reading of it was 41.9 min at p50. */
    timings.record("emit.packet", t_packet, Date.now() / 1000, fac.key,
      { rolls: ids.length, roll_ids: ids.map((r) => r.id),
        prompt_chars: text.length, retry_cap: opts.retries || 2 });
    entries.push({
      ...fac,
      packet: join(dir).slice(ROOT.length + 1),
      scaffold_sha256: sha256File(join(dir, "scaffold.png")),
      px_per_m_at_wall: meta.px_per_m_at_wall,
      /* [row 29(a)] BOTH DEPTH ANCHORS AND THE FACING'S OWN TYPE.
       *
       * `camera_wall_m` alone was emitted, and an `open` facing does not have
       * one — `deriveMeta` gives it `camera_far_m` instead, because the field
       * name is the mechanism (row 11). So the manor's four open facings landed
       * in the manifest with no distance at all and the sweep's arithmetic met
       * `float × None`: sixteen candidates read as MEASURE-ERR, four walls
       * re-asked four times for a crash in our own code, and every retry cap
       * spent. Production law clause 6 — the fix folds into the EMITTER, so the
       * next map's open facings arrive carrying their own anchor and no reader
       * downstream has to go back to the drawing for it.
       *
       * `facing_type` is emitted for the same reason and is NOT `type` above:
       * that one is the ROOM's type, so `entrance_court/N` — an enclosed facing
       * of an open room — is `open` in it, and anything routing on it sends a
       * walled painting down the vista path. */
      camera_wall_m: meta.camera_wall_m ?? null,
      camera_far_m: meta.camera_far_m ?? null,
      facing_type: meta.facing_type,
      floor_line_y: meta.floor_line_y,
      horizon_y: meta.horizon_y,
      corner_x0_px: meta.corner_x0_px, corner_x1_px: meta.corner_x1_px,
      storey_height_m: meta.storey_height_m, wall_width_m: meta.wall_width_m,
      brackets: brackets(meta, rects, tolFor(meta, rects)),
      implied_focal_px: round(groundplane.focalPx(meta), 1),
      stamped: rects.map((r) => ({ kind: r.kind, x0: r.x0, x1: r.x1 })),
      /* WHAT THE ROW-32 REFUSAL WILL LOOK FOR. A wall whose room draws a flight
       * cannot be promoted unless the painting has one, so the manifest names
       * the flights this facing's ask is carrying — a wall that arrives with a
       * `flights` entry and no staircase in the picture is a diagnosis rather
       * than a mystery. */
      flights: flights.map((s) => ({
        id: s.id, direction: s.direction, climb: s.climb, treads: s.treads,
        treads_in_view: s.treads_in_view, width_m: s.width_m,
        x0: s.x0, y0: s.y0, x1: s.x1, y1: s.y1, raw_w: s.raw_w, raw_h: s.raw_h
      })),
      chair_rail_y: cr.y,
      voice: { id: voice.id, via, outdoor: !!voice.outdoor, anchor: anchor.id },
      /* [row 38] THE SEAM, IN THE ENTRY THE SEAT AND THE SWEEP BOTH READ.
       * `edge_seed` is the strip that went out (null where none did) and
       * `depends_on` is the ordering — non-null only on an open location whose
       * seed neighbour is unpainted, which is the row's one licensed exception
       * to one-pass parallelism. An indoor entry can never carry one, so a
       * reader ordering on this field orders nothing indoors. */
      edge_seed: seed,
      seed_policy: seedPlan.policy,
      depends_on: seedPlan.depends_on,
      rolls: ids,
      retry_cap: opts.retries || 2
    });
    console.log(`  ${fac.key.padEnd(24)} ${rects.length} carrier(s)  ${ids.length} roll(s)`
      + (seed ? `  seed ${seed.side} <- ${seed.neighbour}`
        : seedPlan.depends_on ? `  WAITS for ${seedPlan.depends_on}` : ""));
  }
  await browser.close();

  /* [row 38] THE ORDER OPEN LOCATIONS ARE PAINTED IN — the ring from the first
   * completed direction, per location, with each facing's dependency. Written
   * whole rather than only for the facings this pass emitted, because the order
   * is a fact about the LOCATION and a seat reading it needs to see the painted
   * ones it starts from. */
  const openOrders = {};
  for (const room of plan.rooms) {
    if (!isOpenLocation(plan, room.id)) continue;
    openOrders[room.id] = openOrder(plan, room.id, isPainted);
  }
  const manifest = {
    _what_this_is: "The manor art run as ONE ORDER. Every unpainted facing, its scaffold, its packet and its return paths — dispatched at once and painted in parallel, with a per-wall retry cap, rather than drained as a queue.",
    _arrivals_are_unordered: "Every return path is unique and absolute. `measure.py --round row23` is a directory watch: it measures whatever is on disk and reports what is not, so a wall that lands late costs nothing and nothing waits for a wave to complete. ONE EXCEPTION, row 38's and scoped to it: a facing of an OPEN location whose edge-seed neighbour is not painted yet carries `depends_on`, and is painted after it. Every other facing, indoor or out, carries `depends_on: null` and the parallelism is unchanged.",
    _seams: "[HUMAN 2026-08-24] \"the side of the completed picture which is adjacent to the wall about to be developed should have that sides 10% of the picture cropped and sent as an additional reference picture, with a description that this is a reference image of what should be sitting on the left/right edge\" — every entry below whose neighbour is painted carries `edge_seed`: the strip that went out as Image 3, where it was cut from, and its sha256. Open locations REQUIRE it and are ordered for it; indoor ones take it opportunistically and order nothing.",
    open_location_order: openOrders,
    _speed_rule: "[HUMAN 2026-08-23] \"To the degree we hope to one pass parallel all assets created few turns each to full completion.\"",
    _reuse_rule: "ART IS GENERATED ONCE, PROMOTED ONCE, AND THEREAFTER READ. This worklist was derived by checking the stores - a promoted backdrop, a candidate already on disk, or a spent retry budget removes a facing from the order, each with its reason recorded below. Re-running the emitter is idempotent: it emits only what is genuinely outstanding. It is the same doctrine the content contract runs on one tier up, where a side wall is inherited from the neighbour that already exists rather than re-imagined.",
    _technique: opts.technique || "t2",
    _generated: new Date().toISOString().slice(0, 10),
    facings_in_plan: all.length,
    emitted: entries.filter((e) => !e.skipped).length,
    skipped: skipped.length,
    skipped_entries: skipped,
    entries: entries.concat(skipped)
  };
  const mp = join(outDir, "manifest.json");
  writeFileSync(mp, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`\nmanifest  ${mp.slice(ROOT.length + 1)}`);
  console.log(`          ${manifest.emitted} emitted of ${all.length} in the plan; `
    + `${skipped.length} skipped, each with its reason:`);
  const why = {};
  for (const k of skipped) {
    const head = k.skipped.split(":")[0];
    why[head] = (why[head] || 0) + 1;
  }
  for (const [k, n] of Object.entries(why)) console.log(`            ${n} ${k}`);
  timings.record("emit.run", t_run, Date.now() / 1000, null,             // [row 33]
    { mode: "manor", emitted: manifest.emitted, skipped: skipped.length,
      facings_in_plan: all.length, technique: opts.technique || "t2" });
  return manifest;
}


/* ------------------------------------------------------------------ */
/* The re-ask                                                          */
/* ------------------------------------------------------------------ */
/* `row23_run.py`'s sweep decides a wall must be asked again and writes WHY into
 * `run-state.json` — a measured sentence ("draw 0.854x larger: 93.5 px/m at the
 * wall plane, not 109.5") or, once, Kabe's own veto. Until row 29 nothing
 * turned that sentence back into a packet, so a re-ask was a hand-written
 * message and the correction lived in a transcript, which
 * `design/production-law.md` clause 3 calls an OPEN miss.
 *
 * This is that step in code. It reads the state, cuts each wall's scaffold
 * AGAIN — at its room's voice, so a wall re-asked after the voice table lands
 * gets the new voice for free — and writes a complete packet whose prompt
 * carries the correction verbatim at the top.
 *
 * THREE THINGS IT WILL NOT DO, each of them a way of falsifying the record:
 *
 *   1. IT NEVER OVERWRITES THE FIRST ASK. A retry lands in `<wall>/retry-<n>/`
 *      and its rolls have their own ids, so the diagram and the prompt a
 *      returned candidate was painted from stay exactly as they were — which
 *      matters, because `row23_lib.py` measures a returned candidate against
 *      `<packet>/scaffold.png`.
 *   2. IT NEVER RE-ASKS A PROMOTED WALL. Promotion is the end of a wall's life
 *      in this loop.
 *   3. IT NEVER TOUCHES THE CAP. `attempts` is the sweep's to raise; this only
 *      refuses to emit for a wall that has already spent it.
 */
export function retryWalls(state, only = null) {
  return Object.entries(state.walls || {})
    .filter(([key, w]) => w.status === "retry" && (!only || only.includes(key)))
    .map(([key, w]) => ({ key, attempts: w.attempts || 0, correction: w.correction || null }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

async function emitRetries(outDir, opts) {
  const t_run = Date.now() / 1000;                                        // [row 33]
  const plan = JSON.parse(readFileSync(join(ROOT, "fixtures", "demo-study", "plan.json"), "utf8"));
  const statePath = join(outDir, "run-state.json");
  if (!existsSync(statePath)) {
    console.error(`make-scaffold refused: ${statePath.slice(ROOT.length + 1)} does not exist, so there ` +
      `is nothing that has been measured and found wanting. Run the sweep first.`);
    process.exit(1);
  }
  const state = JSON.parse(readFileSync(statePath, "utf8"));
  /* `--wall` narrows a pass to named walls. A scoped emission — row 38's pilot
   * is one room — otherwise means hand-editing the state file to hide the other
   * walls from the emitter, and a state file edited to steer a tool stops being
   * a record of the sweep. */
  const want = retryWalls(state, opts.walls && opts.walls.length ? opts.walls : null);
  const cap = opts.retries || 3;

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1536, height: 1200 } });
  await page.goto(pathToFileURL(join(ROOT, "index.html")).href + "?world=nav-manor");
  await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);

  const emitted = [], refused = [];
  for (const w of want) {
    const [loc, f] = w.key.split("/");
    if (existsSync(join(ROOT, "backdrops", loc, `${f}.meta.json`))) {
      refused.push({ ...w, refused: "promoted since the state was written" });
      continue;
    }
    if (!w.correction) {
      refused.push({ ...w, refused: "the state records no correction, and a re-ask with nothing to correct is the same ask" });
      continue;
    }
    if (w.attempts >= cap) {
      refused.push({ ...w, refused: `the retry cap is spent (${w.attempts} of ${cap})` });
      continue;
    }
    const meta = await page.evaluate((k) => {
      const e = window.HOLO_APP.backdrops[k];
      return e && e.meta ? e.meta : null;
    }, w.key);
    if (!meta) { refused.push({ ...w, refused: "the page holds no meta for this facing" }); continue; }

    const t_facing = Date.now() / 1000;                                   // [row 33]
    const { rects, flights } = scaffoldRects(plan, loc, f, meta);
    const { voice, anchor, via } = voiceFor(plan, loc, f);
    const cr = chairRail(meta, anchor);
    assertLabelChars(cr.label, `${w.key}'s gate anchor label`);
    const legend = legendFor(meta, rects, "THE META THIS PAGE HOLDS FOR THIS FACING", anchor);
    const framePng = await renderPng(page, w.key, meta, "scaffold", null);
    const scafPng = await renderPng(page, w.key, meta, "scaffold",
      { rects, chair_rail: cr, legend, flights });

    const attempt = w.attempts + 1;
    const dir = join(outDir, `${loc}-${f}`, `retry-${attempt}`);
    mkdirSync(dir, { recursive: true });
    writePng(framePng, join(dir, "frame.png"));
    writePng(scafPng, join(dir, "scaffold.png"));
    copyFileSync(join(ROOT, STYLE_SEED), join(dir, "style-seed-warm.png"));
    /* [row 38] A RE-ASK IS A FRESH FULL-FRAME ASK, so it seeds like one. It is
     * also where seeding lands first in practice: the corpus's unpainted walls
     * mostly have painted neighbours by now, and this is the path that carries
     * the pilot. */
    const { seed, plan: seedPlan } = attachSeed(plan, w.key, dir);
    timings.record("emit.facing", t_facing, Date.now() / 1000, w.key,     // [row 33]
      { carriers: rects.length, voice: voice.id, retry: attempt });

    const t_packet = Date.now() / 1000;                                   // [row 33]
    const text = manorPrompt(plan, w.key, meta, rects, w.correction, seed);
    writeFileSync(join(dir, "prompt.txt"), text);
    const ids = [];
    for (let i = 1; i <= (opts.rolls || 2); i++) {
      /* A DIFFERENT TECHNIQUE STRING PER ATTEMPT, so a retry's return path can
       * never collide with the spent ask's and the two are separable in the
       * corpus forever. */
      const id = rollId(w.key, `${opts.technique || "t2"}r${attempt}`, null, i);
      ids.push({ roll: i, id,
        candidate: `${sourceDirFor(w.key)}/row23-${id}.png`,
        prompt: `${sourceDirFor(w.key)}/row23-${id}.prompt.txt` });
    }
    mkdirSync(join(ROOT, sourceDirFor(w.key)), { recursive: true });
    for (const r of ids) writeFileSync(join(ROOT, r.prompt), text);
    writeFileSync(join(dir, "PACKET.md"),
      `# ${w.key} — RE-ASK ${attempt} (technique ${opts.technique || "t2"}, labelled scaffold)\n\n` +
      `> **Why this wall is being asked again**\n>\n> ${w.correction}\n\n` +
      (voice.outdoor && !carryableOutdoors(w.correction)
        ? `**The prompt does not quote that sentence.** This is an outdoor facing, and the sentence ` +
          `names interior fabric — which is the very thing it is vetoing. Putting those words in the ` +
          `prompt would put them in front of the generator on the one wall they were vetoed from, and ` +
          `\`prompt_lint.py\` refuses a packet that does. The prompt carries the forward half instead; ` +
          `the reason lives here.\n\n`
        : "") +
      packetNote(seed, seedPlan) +
      `${attachLine(seed)}\n` +
      `order, then send \`prompt.txt\` verbatim. Generate ${ids.length} images and save them to the\n` +
      `exact paths below — the measurement runs the moment a file appears at one of them.\n\n` +
      ids.map((r) => `| roll ${r.roll} | \`${r.candidate}\` |`).join("\n") +
      `\n\nThe prompt files are already on disk beside them. Do not rewrite them.\n\n` +
      `This wall: ${meta.px_per_m_at_wall.toFixed(1)} px per metre at the wall plane, ` +
      `${rects.length ? rects.map((r) => r.kind).join(" + ") : `no carrier — ${voice.blank}`}.\n` +
      (flights.length
        ? `Stairs in this view: ${flights.map((s) => `**${s.id}** (${s.treads} treads, ` +
            `${s.width_m.toFixed(2)} m wide, ${s.climb ? CLIMB_STAMP[s.climb].toLowerCase() : "no tread in frame"})`).join(", ")}. ` +
          `The prompt asks for it and the scaffold stamps its region — a return without a ` +
          `staircase in it is refused by the promotion gate, not by an eye.\n`
        : "") +
      `Voice: **${voice.id}** (${via}); gate anchor **${anchor.line}**, ${CHAIR_RAIL_M.toFixed(2)} m.\n` +
      `The earlier ask for this wall is still at \`../\` and is not overwritten.\n` +
      `Write only under \`backdrops/\`. Never \`src/\`, never \`design/\`.\n`);
    timings.record("emit.packet", t_packet, Date.now() / 1000, w.key,     // [row 33]
      { rolls: ids.length, roll_ids: ids.map((r) => r.id),
        prompt_chars: text.length, retry: attempt });

    emitted.push({
      key: w.key, attempt, packet: dir.slice(ROOT.length + 1),
      correction: w.correction,
      voice: { id: voice.id, via, outdoor: !!voice.outdoor, anchor: anchor.id },
      px_per_m_at_wall: meta.px_per_m_at_wall,
      flights: flights.map((s) => ({
        id: s.id, direction: s.direction, climb: s.climb, treads: s.treads,
        treads_in_view: s.treads_in_view, width_m: s.width_m,
        x0: s.x0, y0: s.y0, x1: s.x1, y1: s.y1, raw_w: s.raw_w, raw_h: s.raw_h
      })),
      scaffold_sha256: sha256File(join(dir, "scaffold.png")),
      /* [row 38] The same two fields the manifest carries, for the same two
       * readers: what went out as Image 3, and what this ask waited for. */
      edge_seed: seed,
      seed_policy: seedPlan.policy,
      depends_on: seedPlan.depends_on,
      rolls: ids
    });
    console.log(`  ${w.key.padEnd(24)} retry-${attempt}  voice ${voice.id.padEnd(18)} ${ids.length} roll(s)`
      + (seed ? `  seed ${seed.side} <- ${seed.neighbour}` : ""));
  }
  await browser.close();

  const mp = join(outDir, "retries.json");
  /* THE INDEX IS CUMULATIVE, AND THIS FILE ONCE LOST A COAT BY NOT BEING.
   *
   * `row23_run.py` finds a retry roll's candidate ONLY through this file — the
   * manifest predates every re-ask — so an entry dropped here makes an image
   * that is sitting on disk invisible to the sweep. Rewriting `entries` with
   * just this pass's emissions did exactly that: the second coat's fifteen
   * walls fell out the moment a third pass was cut, thirty returned candidates
   * with them, and the loop would have re-asked walls it had already been
   * answered about.
   *
   * The header below claimed "never overwrites" while this line overwrote. The
   * PACKETS were safe (each retry lives in its own `retry-<n>/` with its own
   * roll ids); the INDEX was not, and the index is what the sweep reads. So
   * every earlier entry is carried forward, keyed by wall AND attempt, and
   * this pass's entries replace only their own key+attempt. */
  const prior = existsSync(mp) ? JSON.parse(readFileSync(mp, "utf8")).entries || [] : [];
  const merged = new Map();
  for (const e of prior) merged.set(`${e.key}#${e.attempt}`, e);
  for (const e of emitted) merged.set(`${e.key}#${e.attempt}`, e);
  const entries = [...merged.values()].sort(
    (a, b) => a.key.localeCompare(b.key) || a.attempt - b.attempt);
  writeFileSync(mp, JSON.stringify({
    _what_this_is: "Every re-ask packet this run has ever cut, each carrying its wall's own correction sentence verbatim. Emitted by `node tools/make-scaffold.mjs --emit-retries`; nothing here is hand-written.",
    _cumulative: "Entries accumulate across passes, keyed by wall and attempt. `row23_run.py` finds a retry roll's candidate only through this file, so an entry dropped here hides an image that is already on disk — which is how the second coat went unread once.",
    _never_overwrites: "A retry lives in <wall>/retry-<n>/ with its own roll ids, so the diagram and the prompt an already-returned candidate was painted from are untouched.",
    _voice: "Each entry names the room voice its prompt was cut at (tools/room-voices.mjs), so a wall re-asked after the voice table moved is visibly asked under the new voice.",
    _seams: "[row 38] `edge_seed` is the completed neighbour's abutting 10 % that rode with this re-ask as Image 3 — which painting it was cut from, which side, and its sha256 — and `depends_on` is the ordering an open location's unpainted seam neighbour imposes. A re-ask is a fresh full-frame ask, so it seeds like one.",
    _generated: new Date().toISOString().slice(0, 10),
    emitted: emitted.length, carried: entries.length - emitted.length,
    refused: refused.length,
    entries, refused_entries: refused
  }, null, 2) + "\n");
  console.log(`\nretries   ${mp.slice(ROOT.length + 1)}`);
  console.log(`          ${emitted.length} re-ask packet(s) this pass, ` +
    `${entries.length - emitted.length} carried forward; ${refused.length} refused`);
  for (const r of refused) console.log(`            ${r.key}  ${r.refused}`);
  timings.record("emit.run", t_run, Date.now() / 1000, null,              // [row 33]
    { mode: "retries", emitted: emitted.length, refused: refused.length });
  return { emitted, refused };
}


/* ------------------------------------------------------------------ */
/* Technique (4) — the content scaffold                                */
/* ------------------------------------------------------------------ */
/* Blueprint §11b, extended the same day [HUMAN, 2026-08-22]: "it allows the
 * sidewalls to be already generated by those individual wall facing. And the
 * ceiling and floor to be specific to the flooring and ceiling type" — the
 * scaffold escalates from LAYOUT to CONTENT CONTRACT. A side-wall return stops
 * being grid and becomes the neighbouring facing's own approved pixels, so the
 * seam agrees by inheritance rather than by instruction; floor and ceiling
 * carry the room's typed materials.
 *
 * WHAT IS HONESTLY AVAILABLE TODAY, AND WHAT IS NOT. `study/N`'s two neighbours
 * are `study/W` (promoted, painted at the standing camera) and `study/E`
 * (admitted but NOT promoted, so the world still draws it as grid). Only the
 * LEFT return can inherit real pixels. That is half of what §11b describes, it
 * is stated on the scaffold's own legend and in the packet rather than being
 * quietly presented as the whole technique, and it is why this packet is
 * dispatched only on the NULL trigger.
 *
 * The floor and ceiling swatches come from `study/W` too — the same ROOM, a
 * different wall. Taking them from `study/N`'s own approved reference would
 * hand the generator the answer it is being tested on, which is the same
 * anti-leak rule §4.0 applies to the style seed.
 *
 * THE PROJECTION IS COLUMN-SLICED AND SAYS SO. The return's ceiling and floor
 * lines are the rays from the horizon through the corner, which is what they
 * geometrically are; the neighbour's wall field is sampled across them column by
 * column. It is not a full homography and this is an approximation — named
 * here, on the legend, and in the packet, because an approximation a reader has
 * to discover is a defect and one they are told about is a boundary.
 */
export const CONTENT_PAGE = function (arg) {
  const { framePng, neighbourPng, meta, corner, horizon, floorY, ceilY, note } = arg;
  return new Promise(function (resolve) {
    const base = new Image(), nb = new Image();
    let left = 2;
    const go = function () {
      if (--left) return;
      const cv = document.createElement("canvas");
      cv.width = 1536; cv.height = 1024;
      const ctx = cv.getContext("2d");
      ctx.drawImage(base, 0, 0);

      /* The neighbour's own wall field, between its corners. */
      const nx0 = neighbourPng.corner_x0, nx1 = neighbourPng.corner_x1;
      const nTop = neighbourPng.ceil_y, nBot = neighbourPng.floor_y;

      /* ---- the LEFT return, column by column ---- */
      const ray = function (throughY, x) {
        const t = (x - horizon.x) / (corner.x0 - horizon.x);
        return horizon.y + t * (throughY - horizon.y);
      };
      for (let x = 0; x < corner.x0; x++) {
        const yTop = ray(ceilY, x), yBot = ray(floorY, x);
        if (!(yBot > yTop)) continue;
        /* Nearest wall at the frame edge, the corner at the corner. */
        const u = x / Math.max(1, corner.x0);
        const sx = nx0 + u * (nx1 - nx0);
        ctx.drawImage(nb, sx, nTop, Math.max(1, (nx1 - nx0) / corner.x0), nBot - nTop,
          x, yTop, 1, yBot - yTop);
      }

      /* ---- the floor and the ceiling, the room's own materials ---- */
      const band = function (srcY0, srcY1, dstY0, dstY1) {
        if (dstY1 <= dstY0) return;
        ctx.drawImage(nb, nx0, srcY0, nx1 - nx0, Math.max(1, srcY1 - srcY0),
          0, dstY0, 1536, dstY1 - dstY0);
      };
      band(nBot + 4, 1023, floorY, 1023);
      band(0, Math.max(1, nTop - 4), 0, ceilY);

      /* ---- THE LEGEND IS RE-STAMPED, because the floor band just erased it ----
         The inherited floor runs to the bottom edge of frame, which is exactly
         where the legend sits, so the first run of this mode produced a content
         scaffold whose own face no longer said which half was inherited. The
         packet said it; the image did not, and the image is what a painter
         looks at. */
      const lg = note.legend;
      const DIM = "#9fc4e0";
      ctx.fillStyle = "rgba(6,8,12,0.82)";
      ctx.fillRect(lg.x - 6, lg.y - 6, lg.w + 12, lg.h + 12);
      ctx.strokeStyle = DIM;
      ctx.lineWidth = 2;
      ctx.strokeRect(lg.x, lg.y, lg.w, lg.h);
      let ly = lg.y + 12;
      for (const line of lg.lines) {
        const h = lg.text_h, w = h * 0.62, gap = h * 0.26;
        ctx.strokeStyle = DIM;
        ctx.lineWidth = Math.max(2, Math.round(h / 9));
        ctx.lineJoin = "round"; ctx.lineCap = "round";
        let cx = lg.x + 12;
        for (const ch of line) {
          const strokes = note.G[ch] || [];
          ctx.beginPath();
          for (let i = 0; i < strokes.length; i++) {
            const ln = strokes[i];
            for (let j = 0; j < ln.length; j++) {
              const px = cx + ln[j][0] * w, py = ly + ln[j][1] * h;
              if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
          }
          ctx.stroke();
          cx += w + gap;
        }
        ly += lg.line_h;
      }
      resolve(cv.toDataURL("image/png"));
    };
    base.onload = go; nb.onload = go;
    base.src = framePng; nb.src = neighbourPng.data;
  });
};

async function emitContentScaffold(outDir) {
  const plan = JSON.parse(readFileSync(join(ROOT, "fixtures", "demo-study", "plan.json"), "utf8"));
  const side = JSON.parse(readFileSync(
    join(outDir, "study-N.scaffold.json"), "utf8"));
  const meta = side.meta_used;
  const nbMeta = JSON.parse(readFileSync(join(ROOT, "backdrops", "study", "W.meta.json"), "utf8"));

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1536, height: 1200 } });
  await page.goto(pathToFileURL(join(ROOT, "index.html")).href + "?world=nav-manor");
  await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);

  const { rects } = scaffoldRects(plan, "study", "N", meta);
  const cr = chairRail(meta);
  const legend = legendFor(meta, rects, "THE META THIS PAGE HOLDS FOR THIS FACING");
  legend.lines.push("INHERITED - LEFT RETURN, FLOOR AND CEILING ARE STUDY WEST PIXELS");
  legend.lines.push("NOT INHERITED - RIGHT RETURN IS GRID, ITS NEIGHBOUR IS NOT PROMOTED");
  legend.h = 26 * legend.lines.length + 22;
  legend.y = CANVAS_H - legend.h - 24;
  legend.w = round(24 + Math.max(...legend.lines.map((l) => textBox(l, legend.text_h))), 2);
  for (const l of legend.lines) assertLabelChars(l, "the content legend");

  const scafPng = await renderPng(page, "study/N", meta, "scaffold",
    { rects, chair_rail: cr, legend });
  const nbData = "data:image/png;base64," +
    readFileSync(join(ROOT, "backdrops", "study", "W.png")).toString("base64");

  const contentPng = await page.evaluate(CONTENT_PAGE, {
    framePng: scafPng,
    neighbourPng: {
      data: nbData,
      corner_x0: nbMeta.corner_x0_px, corner_x1: nbMeta.corner_x1_px,
      ceil_y: Math.round(nbMeta.floor_line_y * 1024 - nbMeta.storey_height_m * nbMeta.px_per_m_at_wall),
      floor_y: Math.round(nbMeta.floor_line_y * 1024)
    },
    meta,
    corner: { x0: meta.corner_x0_px, x1: meta.corner_x1_px },
    horizon: { x: groundplane.wallCentrePx(meta, CANVAS_W), y: meta.horizon_y * meta.image_h_px },
    floorY: meta.floor_line_y * meta.image_h_px,
    ceilY: meta.floor_line_y * meta.image_h_px - meta.storey_height_m * meta.px_per_m_at_wall,
    note: { legend, G }
  });
  await browser.close();

  const dir = join(outDir, "packets", "study-N", "t4");
  mkdirSync(dir, { recursive: true });
  const img = join(dir, "study-N-content-scaffold.png");
  writePng(contentPng, img);
  copyFileSync(join(ROOT, STYLE_SEED), join(dir, "style-seed-warm.png"));
  return { dir, img, side, meta };
}


/* ------------------------------------------------------------------ */
/* P4 and P6 — the last eight rolls, as one order                       */
/* ------------------------------------------------------------------ */

/** §5.6's entrant rule, applied rather than chosen. */
export function entrantTechnique(reportRows) {
  const by = {};
  for (const r of reportRows) {
    if (!r.tech || r.tech === "lens") continue;
    by[r.tech] = by[r.tech] || { admitted: 0, idx: [] };
    if (r.verdict === "PASS") by[r.tech].admitted += 1;
    if (r.adh != null) by[r.tech].idx.push(r.adh);
  }
  const med = (a) => a.length ? a.slice().sort((x, y) => x - y)[a.length >> 1] : null;
  const ranked = Object.entries(by).sort((a, b) => {
    if (b[1].admitted !== a[1].admitted) return b[1].admitted - a[1].admitted;
    const ma = med(a[1].idx), mb = med(b[1].idx);
    if (ma != null && mb != null && ma !== mb) return mb - ma;
    if (ma != null && mb == null) return -1;
    if (mb != null && ma == null) return 1;
    return a[0] < b[0] ? -1 : 1;
  });
  return { winner: ranked[0][0], table: by, ranked: ranked.map(([t, v]) => [t, v.admitted]) };
}

async function emitFinal(outDir) {
  const plan = JSON.parse(readFileSync(join(ROOT, "fixtures", "demo-study", "plan.json"), "utf8"));
  const assign = JSON.parse(readFileSync(
    join(ROOT, "design", "plan-draft", "measured", "row23", "assignment.json"), "utf8"));

  /* ---- §5.6's rule, on study/N's own measured rolls ---- */
  const readDir = join(ROOT, "design", "plan-draft", "measured", "row23");
  const rows = [];
  for (const f of readdirSync(readDir)) {
    if (!f.endsWith(".json") || f.startsWith("assignment")) continue;
    const d = JSON.parse(readFileSync(join(readDir, f), "utf8"));
    const cell = assign.rolls.find((r) => r.id === d.id);
    if (!cell || cell.wall !== "study/N") continue;
    rows.push({ tech: cell.technique, verdict: d.verdict,
      adh: (d.score && d.score.indexed) ? d.score.adherence_raw : null });
  }
  const pick = entrantTechnique(rows);
  const T = TECHNIQUES.find((t) => t.id === pick.winner);
  /* The rule names a TECHNIQUE; t3 carries two variants and the rule is silent
     on which, so it is extended the only way that stays deterministic — the
     first variant in the declared order. Recorded, not decided at dispatch. */
  const variant = T.variants[0];

  /* ================= P4 — the lens arm ================= */
  const lensSide = JSON.parse(readFileSync(
    join(outDir, "lens", "study-N.scaffold.json"), "utf8"));
  const lensDir = join(outDir, "packets", "study-N", "lens");
  mkdirSync(lensDir, { recursive: true });
  copyFileSync(join(ROOT, STYLE_SEED), join(lensDir, "style-seed-warm.png"));
  copyFileSync(join(outDir, "lens", "study-N-scaffold.png"),
    join(lensDir, "study-N-scaffold-derived.png"));
  const lensText = promptFor("study/N", lensSide, T, variant);
  writeFileSync(join(lensDir, "prompt.txt"), lensText);
  for (const r of assign.lens) writeFileSync(join(ROOT, r.prompt), lensText);

  writeFileSync(join(lensDir, "PACKET.md"), `# Packet — study/N, THE LENS ARM (4 rolls)

**This packet is the same wall at a DIFFERENT CAMERA, and that is the whole point.**
Every other row-23 packet showed a scaffold drawn at the camera the approved painting was
made at — an **819.6 px** lens, 188 px per metre. This one is drawn at the camera the
project's own law rules: a **1024 px** lens, **235 px per metre**. The two differ by 20 %,
and which of them the manor finishes painting at is an open question with a human's name on
it. These four frames are the numbers that question gets answered with.

So: reproduce **Image 2's** camera, not the camera of anything you have painted before.

## Attach, in this order

1. \`style-seed-warm.png\` — **Image 1**, the style reference.
2. \`study-N-scaffold-derived.png\` — **Image 2**, the layout scaffold at the ruled lens.

Then send \`prompt.txt\` verbatim.

## The rolls

| roll | save the image to |
|---|---|
${assign.lens.map((r) => `| ${r.roll} | \`${r.candidate}\` |`).join("\n")}

The prompt files are already on disk beside them. Do not rewrite them.

## Which technique this is, and why

The technique was **not chosen** — it was picked by the rule written down before any
candidate returned (\`design/specs/23-plan.md\` §5.6: highest admitted count, then highest
median adherence, then technique index). On \`study/N\` the admitted counts were
${pick.ranked.map(([t, k]) => `${t} ${k}`).join(", ")} of 4, so **${pick.winner}** carries the lens
arm${variant ? `, and its first declared variant (${variant}) carries it` : ""}.

## The fence

Write only under \`backdrops/\`. Never \`src/\`, never \`design/\`. Generate, save, report the paths.
`);

  /* ================= P6 — technique (4) ================= */
  const c = await emitContentScaffold(outDir);
  const t4 = { id: "t4", image2: "content-scaffold", labelled: true, variants: [null],
    what: "content scaffold - inherited side-wall and material pixels" };
  const t4Rolls = [];
  for (let i = 1; i <= 4; i++) {
    const id = rollId("study/N", "t4", null, i);
    t4Rolls.push({ id, wall: "study/N", technique: "t4", variant: null, roll: i,
      camera: "page", scaffold: "content-scaffold",
      candidate: `${sourceDirFor("study/N")}/row23-${id}.png`,
      prompt: `${sourceDirFor("study/N")}/row23-${id}.prompt.txt` });
  }
  const t4Text = promptFor("study/N", c.side, t4, null) +
    "Inherited content: Image 2's LEFT side-wall return, its floor and its ceiling are not " +
    "diagram - they are real painted pixels from the adjoining west wall of this same room. " +
    "Continue them exactly: the same oak, the same boards, the same plaster, the same light, " +
    "carried across the corner without a seam. The RIGHT return is still diagram, because the " +
    "wall beyond it has not been painted yet; paint it to match the left.\n";
  writeFileSync(join(c.dir, "prompt.txt"), t4Text);
  for (const r of t4Rolls) writeFileSync(join(ROOT, r.prompt), t4Text);

  writeFileSync(join(c.dir, "PACKET.md"), `# Packet — study/N, technique t4 (content scaffold)

**Image 2 is half diagram and half painting, and the difference is the technique.** Its left
side-wall return, its floor and its ceiling are real pixels lifted from the adjoining west
wall of this same room — the seam is meant to agree because it *is* the neighbour, not
because a sentence asked it to. The facing wall and the right return are still diagram.

## Attach, in this order

1. \`style-seed-warm.png\` — **Image 1**, the style reference.
2. \`study-N-content-scaffold.png\` — **Image 2**.

Then send \`prompt.txt\` verbatim.

## The rolls

| roll | save the image to |
|---|---|
${t4Rolls.map((r) => `| ${r.roll} | \`${r.candidate}\` |`).join("\n")}

## What is inherited and what is not — stated, not implied

- **Left return, floor, ceiling** — \`backdrops/study/W.png\`, promoted, painted at the
  standing camera. Real pixels.
- **Right return** — still grid. Its neighbour \`study/E\` is admitted but **not promoted**,
  so there are no approved pixels to inherit. This packet is therefore **half** of what
  blueprint §11b describes, and it says so rather than presenting itself as the whole
  technique.
- **The projection is column-sliced, not a full homography.** The return's ceiling and floor
  lines are the rays from the horizon through the corner, which is what they geometrically
  are, and the neighbour's wall field is sampled across them column by column. It is an
  approximation. You are told, so you can paint through it rather than reproduce it.
- **The floor and ceiling swatches are the WEST wall's**, not this wall's own reference — a
  room's materials, not the answer to the question this frame is asking.

## The fence

Write only under \`backdrops/\`. Never \`src/\`, never \`design/\`. Generate, save, report the paths.
`);

  /* ---- the assignment EXTENSION, a second file because the first may not change ---- */
  const ext = join(ROOT, "design", "plan-draft", "measured", "row23", "assignment-2.json");
  writeFileSync(ext, JSON.stringify({
    _what_this_is: "The technique-(4) rolls' id map. A SECOND file rather than an edit: assignment.json was committed before any candidate existed and scaffold.spec asserts its blob has never changed since, so an extension that appended to it would break the one discipline that makes the map trustworthy.",
    _trigger: "Dispatched on the NULL trigger in design/specs/23-plan.md §4.5 - the separation report found no separation at all on either wall (carrier lean spread 0, p = 1.000 both walls).",
    _half_inheritance: "study/N's left return, floor and ceiling inherit study/W's promoted pixels; the right return stays grid because study/E is admitted and not promoted. Stated on the scaffold's own legend and in the packet.",
    _lens_arm_is_in_the_first_file: "P4's four ids were reserved in assignment.json when it was written; only their technique was undecided, and §5.6's rule has now picked it.",
    lens_technique_decided: { rule: "design/specs/23-plan.md §5.6", winner: pick.winner,
      variant, admitted_counts: pick.ranked,
      _note: "the rule names a technique; the variant is its first declared one, which is the only deterministic extension" },
    _generated: "2026-08-23",
    rolls: t4Rolls
  }, null, 2) + "\n");

  console.log(`P4 lens arm   ${lensDir.slice(ROOT.length + 1)}   technique ${pick.winner}${variant ? "/" + variant : ""} by rule (admitted ${pick.ranked.map(([t, k]) => t + " " + k).join(", ")})`);
  for (const r of assign.lens) console.log(`   roll ${r.roll}  ${r.id}  -> ${r.candidate}`);
  console.log(`P6 technique4 ${c.dir.slice(ROOT.length + 1)}`);
  for (const r of t4Rolls) console.log(`   roll ${r.roll}  ${r.id}  -> ${r.candidate}`);
  console.log(`extension     ${ext.slice(ROOT.length + 1)}`);
}

/* THE ENTRY POINT LIVES AT THE END OF THE FILE, and has to: `main` reads the
 * packet tables below it, and a module-eval-time call placed above them hits
 * their temporal dead zone. */
/* `process.argv[1]` IS UNDEFINED under `node -e`, and `pathToFileURL(undefined)`
 * throws — so importing this module from an eval context crashed on load rather
 * than exporting anything. Latent until something imported it that way; found
 * doing exactly that while checking the row-34 fold. The guard is the same shape
 * `emit-evolution.mjs` already uses. */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error(e); process.exit(1); });
}

/* ------------------------------------------------------------------ */
/* Row 36 — the swatch ask                                             */
/* ------------------------------------------------------------------ */
/* A SWATCH IS THE ONE ASK IN THIS PROJECT WITH NO GEOMETRY IN IT. Every other
 * packet shows a camera a room and asks it to obey; a swatch asks for a
 * material lying flat, and the whole request is: this stuff, this big, evenly
 * lit, nothing else. It exists because `design/specs/36-plan.md` §1.2 measured
 * every promoted facing and found floors and ceilings are grazing surfaces no
 * painting resolves isotropically — 0 of 51 clear the demand — so they cannot
 * be harvested and must be asked for flat.
 *
 * THREE THINGS THIS ASK DOES DIFFERENTLY, each with its reason:
 *
 *   NO SCAFFOLD IMAGE. There is no geometry to show. A scaffold would be a
 *   picture of a room, and a room is exactly what this must not contain.
 *
 *   NO STYLE SEED. `style-seed-warm.png` is a LIGHTING reference — its name
 *   says so — and row 37 rules that pieces carry material and not
 *   illumination. Attaching it would import the one thing the ask forbids.
 *   Medium is carried in words instead, which is also where row 34's evidence
 *   put the anchored detail: the image-heavy arms were its weakest.
 *
 *   A SCALE CONTRACT IN THE ASK ITSELF. §1.4a: no asset enters the library
 *   without a derivable metres-per-pixel. A generator controls the pixels, so
 *   the scale cannot be chosen the way a harvest chooses it — it has to be
 *   recoverable from what comes back. So the ask names a ruled physical feature
 *   and a COUNT of it across the image, and admission recovers the period and
 *   checks it. A swatch whose scale cannot be derived is re-asked, never
 *   admitted at a guess: nothing downstream re-checks a tile's ppm, because
 *   everything downstream is entitled to trust it.
 */

/** A swatch's opaque roll id. Kept in the same shape as `rollId` and in a
 *  separate namespace, so a swatch can never collide with a wall roll. */
export function swatchId(materialId, roll) {
  return createHash("sha256")
    .update(`row36|swatch|${materialId}|${roll}`)
    .digest("hex").slice(0, 8);
}

/** The words that make a swatch's scale recoverable.
 *
 *  Periodic materials get a counted feature and that is the strict gate.
 *  Stochastic ones have no countable module but a visible grain SIZE, so the
 *  ask names it and admission checks the spectral peak at a wider residual.
 *  Featureless ones are the honest special case: scale is UNOBSERVABLE — there
 *  is nothing in smooth plaster whose size could be wrong — so any ppm is
 *  correct and the gate inverts to "it must really be featureless". */
export function swatchScaleLines(sc) {
  const L = [];
  if (sc.kind === "periodic") {
    /* THE PITCH IS ACROSS THE GRAIN AND THE SENTENCE HAS TO SAY SO. Written as
       "the boards run across the image at 0.25 m each" it reads as a length
       along the board, which is the exact ambiguity `MATERIALS.tiling` was
       restated to remove. Say it as a count laid side by side. */
    L.push(`Scale, and this is exact: exactly ${sc.count} ${sc.feature}s lie side ` +
           `by side across the image, each one exactly ${sc.pitch_m.toFixed(3)} m ` +
           `wide measured across it.`);
    L.push(`  They run the other way — along their own length — from one edge of ` +
           `the image to the other, unbroken.`);
    L.push(`  So the image spans ${sc.span_m.toFixed(3)} m across. Every ` +
           `${sc.feature} is the same width as every other, and the count must be ` +
           `exact: it is measured off the returned image and a miscount is a re-ask.`);
  } else if (sc.kind === "stochastic") {
    L.push(`Scale: the image covers exactly ${sc.span_m.toFixed(3)} m of ground ` +
           `edge to edge.`);
    L.push(`  ${sc.feature[0].toUpperCase() + sc.feature.slice(1)} is about ` +
           `${(sc.characteristic_m * 1000).toFixed(0)} mm across, so it should read ` +
           `at that size against the ${sc.span_m.toFixed(2)} m the image spans.`);
  } else {
    L.push(`Scale: the image covers about ${sc.span_m.toFixed(3)} m edge to edge, ` +
           `but nothing in this surface has a size, and that is the point.`);
    L.push("  It must be genuinely featureless — no cracks, no patches, no " +
           "trowel marks, no mouldings, no boards, no joints, nothing whose " +
           "size a viewer could read. An even surface with a faint tooth.");
  }
  return L;
}

/** The whole ask for one material, flat. */
export function swatchPrompt(materialId, mat) {
  const sc = mat.scale_contract;
  const slotWord = mat.slot === "floor" ? "floor" : mat.slot === "ceiling" ? "ceiling" : "wall";
  const L = [];
  /* A VOICE'S PROSE CAN CARRY FRAME-RELATIVE LANGUAGE, AND A SWATCH HAS NO
     FRAME. `outdoors_open.floor` is "raked gravel and worn turf running to the
     bottom edge of frame" -- true and useful in a facing's ask, meaningless in
     a flat sample, and worse than meaningless here because the same prompt's
     Avoid line forbids a frame at all. So the ask refuses prose that talks
     about the picture rather than the material, and the material may carry a
     `swatch_prose` that says the same stuff without the frame. Refusing rather
     than silently stripping: a regex that edits a request is a request nobody
     wrote. */
  const FRAME_TALK = /\b(edge of frame|in frame|bottom edge|top edge|foreground|background|far side|across the (?:far|near)|horizon)\b/i;
  const prose = mat.swatch_prose || mat.prose;
  if (prose && FRAME_TALK.test(prose)) {
    throw new Error(
      `make-scaffold: \`${materialId}\` names its material in picture terms ` +
      `("${prose.match(FRAME_TALK)[0]}") and a swatch has no picture. Give the ` +
      `material a \`swatch_prose\` that describes the stuff and not the frame.`);
  }
  if (!prose) {
    throw new Error(
      `make-scaffold: material \`${materialId}\` reached the swatch ask with no ` +
      `prose. The words live in VOICES and are resolved by emitMaterials -- an ` +
      `ask that names no material is not a request, it is a blank.`);
  }
  L.push(`Paint one flat, square sample of a single building material: ${prose}.`);
  L.push("");
  L.push("This is a MATERIAL SAMPLE and not a picture of a room. There is no");
  L.push("  room, no wall meeting another wall, no corner, no floor line, no");
  L.push("  ceiling, no window, no door, no furniture and no horizon. The");
  L.push(`  ${slotWord} surface fills the whole image, edge to edge.`);
  L.push("");
  L.push("Viewpoint: square on, looking straight at the surface from directly");
  L.push("  in front of it. No perspective, no vanishing point, no convergence,");
  L.push("  nothing receding. The surface is parallel to the picture plane, so a");
  L.push("  straight joint runs straight and stays the same width across the");
  L.push("  whole image.");
  L.push("");
  L.push("Light: completely even and sourceless. No sun, no window light, no");
  L.push("  firelight, no lamp, no highlight, no cast shadow, no vignette, no");
  L.push("  gradient from one side to the other. The same brightness in every");
  L.push("  corner as in the middle. This sample will be lit later by the scene");
  L.push("  it is used in, so any light painted into it is light in the wrong");
  L.push("  place forever.");
  L.push("");
  for (const line of swatchScaleLines(sc)) L.push(line);
  L.push("");
  L.push("Medium: fine oil realism with tactile brush detail, the material's own");
  L.push("  colour, honest to English building work of about 1660. Age and wear");
  L.push("  are welcome in the SURFACE — worn, scrubbed, weathered, settled — but");
  L.push("  not as staining that reads as a shadow.");
  L.push("");
  L.push("Avoid: any room, any object, any perspective, any directional light,");
  L.push("  any border or frame or margin, any caption, any colour chart, any");
  L.push("  watermark. The material and nothing else.");
  return L.join("\n");
}

/** Emit one packet per swatch material. Writes no image and reads no plan. */
export function emitSwatches(outDir, opts = {}) {
  const rolls = Number(opts.rolls || 2);
  const plan = JSON.parse(readFileSync(join(ROOT, "fixtures", "demo-study", "plan.json"), "utf8"));
  const doc = emitMaterials(VOICES, plan);
  /* THE HARVEST'S OWN CONVERSIONS JOIN THE ASK. A material whose promoted
     sources cannot supply the lattice its consumers demand is not a harvest,
     whatever the table says -- so the harvester writes what it could not serve
     and this reads it. `36-plan.md` §8 costed that conversion path explicitly
     and said the build reports the count rather than assuming zero; this is
     where the arithmetic actually moves. */
  const convPath = join(ROOT, "backdrops", "textures", "harvest-conversions.json");
  const conv = existsSync(convPath)
    ? JSON.parse(readFileSync(convPath, "utf8")) : { converted_to_swatch: [] };
  const converted = new Map(
    (conv.converted_to_swatch || []).map((c) => [c.material, c.reason]));
  const wanted = Object.values(doc.materials).filter(
    (m) => m.lane === "swatch" || converted.has(m.id));
  mkdirSync(outDir, { recursive: true });
  const index = [];
  for (const mat of wanted) {
    const dir = join(outDir, mat.id.replace("/", "-"));
    mkdirSync(dir, { recursive: true });
    const prompt = swatchPrompt(mat.id, mat);
    writeFileSync(join(dir, "prompt.txt"), prompt + "\n");
    const ids = [];
    for (let i = 1; i <= rolls; i++) {
      const id = swatchId(mat.id, i);
      const dest = `backdrops/textures/source/${mat.id.replace("/", "-")}/row36-${id}.png`;
      ids.push({ roll: i, id, dest });
      const pdir = join(ROOT, dirname(dest));
      mkdirSync(pdir, { recursive: true });
      writeFileSync(join(ROOT, dest.replace(/\.png$/, ".prompt.txt")), prompt + "\n");
    }
    const sc = mat.scale_contract;
    const why = converted.get(mat.id);
    writeFileSync(join(dir, "PACKET.md"),
      `# ${mat.id} — flat material swatch\n\n` +
      (why ? `**Converted from the harvest lane.** ${why}\n\n` : "") +
      `Send \`prompt.txt\` verbatim. **Attach no image** — this ask carries no\n` +
      `reference on purpose: there is no geometry to show, and the style seed is a\n` +
      `LIGHTING reference which is the one thing a neutral sample must not inherit.\n\n` +
      `Generate ${rolls} images and save them to the exact paths below.\n\n` +
      ids.map((r) => `| roll ${r.roll} | \`${r.dest}\` |`).join("\n") + "\n\n" +
      `Scale contract (${sc.kind}): ` +
      (sc.kind === "periodic"
        ? `${sc.count} × ${sc.feature} at ${sc.pitch_m} m = ${sc.span_m} m across, ` +
          `${sc.ppm} px/m.\n`
        : sc.kind === "stochastic"
          ? `${sc.span_m} m across at ${sc.ppm} px/m, grain about ` +
            `${(sc.characteristic_m * 1000).toFixed(0)} mm.\n`
          : `${sc.span_m} m across at ${sc.ppm} px/m; scale is unobservable and ` +
            `the sample must be genuinely featureless.\n`) +
      `\nWrite only under \`backdrops/\`. Never \`src/\`, never \`design/\`.\n`);
    index.push({ material: mat.id, slot: mat.slot, dir: dir.slice(ROOT.length + 1),
                 converted_from_harvest: why || null,
                 scale_contract: sc, rolls: ids });
  }
  const idxPath = join(outDir, "swatch-index.json");
  writeFileSync(idxPath, JSON.stringify({
    _what_this_is:
      "Row 36's flat material swatches. One packet per material the library " +
      "cannot harvest. A NEW index file rather than an edit to assignment.json, " +
      "whose blob scaffold.spec asserts has never changed.",
    emitted: index.length, rolls_each: rolls, packets: index
  }, null, 2) + "\n");
  return { packets: index, indexPath: idxPath };
}

/* ------------------------------------------------------------------ */
/* Row 36 — which texture each facing actually shows                   */
/* ------------------------------------------------------------------ */
/* The harvester holds a promoted FACING and needs the material it renders.
 * Three of the library's fabrics are not reachable from `voice.walls` at all,
 * and each is reached by a rule that lives here rather than in the voice table:
 *
 *   `walls_with_openings` — an outdoor facing whose plan draws any carrier on
 *   its wall line is the manor's own exterior elevation rather than a garden
 *   wall. The rule is one line in `manorPrompt` and it is applied here from the
 *   same `scaffoldRects` it reads, so the two cannot drift.
 *
 *   the three `hangings` ranks — chosen by `hangingsFor(roomId)` off the room's
 *   own id vocabulary, so which tapestry a bedchamber shows is a fact about
 *   which bedchamber it is.
 *
 *   `blank` — the same fabric as `walls`, which the binding already knows.
 *
 * Re-deriving any of that on the Python side would be a second copy of a rule
 * whose first copy is what the prompts are actually generated from. */
export function facingMaterials(plan, doc) {
  const out = {};
  for (const room of plan.rooms || []) {
    for (const f of Object.keys(room.facings || {})) {
      const key = `${room.id}/${f}`;
      const { voice } = voiceFor(plan, room.id, f);
      const bound = doc.bindings[voice.id] || {};
      let meta = null, rects = [];
      try {
        meta = deriveMeta(plan, room.id, f);
        rects = scaffoldRects(plan, room.id, f, meta).rects || [];
      } catch { /* a facing whose meta will not derive still names its voice */ }
      const carriers = rects.filter((r) => r.kind && r.kind !== "flight");

      /* THE SAME CONDITION `manorPrompt` USES, read from the same rects. */
      const wallsKey = (carriers.length && voice.walls_with_openings)
        ? "walls_with_openings" : "walls";
      const walls = bound[wallsKey] || bound.walls || null;

      let field = null;
      if (voice.id === "bedchamber") {
        const rank = Object.entries(voice.hangings || {})
          .find(([, s]) => s === hangingsFor(room.id));
        if (rank) field = bound[`hangings.${rank[0]}`] || null;
      }
      out[key] = {
        voice: voice.id,
        walls: walls && canonicalMaterial(walls),
        walls_key: wallsKey,
        field: field && canonicalMaterial(field),
        ceiling: bound.ceiling ? canonicalMaterial(bound.ceiling) : null,
        floor: bound.floor ? canonicalMaterial(bound.floor) : null,
        facing_type: room.facings[f].type,
        carriers: carriers.map((r) => r.kind),
        /* THE WALL'S OWN DEMAND, and it is exactly this number. The facing
           wall's map is a similarity — row 35 preserves the painted
           proportions so that it is, and §1.2's measurement found anisotropy
           1.000 on all 51 promoted facings — so one metre of wall is
           `px_per_m_at_wall` pixels everywhere on it. A material's lattice is
           sized to the largest demand among the facings that USE it, never to
           the building's global maximum, which would refuse every harvest to
           satisfy a wall the material never appears on. */
        declared_ppm: meta ? meta.px_per_m_at_wall : null,
        /* THE DECLARED BOX, in the six numbers `row35_snap.box` takes. An
           assembled facing is built at the geometry the PLAN rules, never at a
           painting's own -- that is what makes cross-facing consistency a
           construction rather than an achievement -- so these come from
           `deriveMeta` and not from any promoted meta. */
        declared: meta ? {
          ppm: meta.px_per_m_at_wall,
          image_w_px: meta.image_w_px, image_h_px: meta.image_h_px,
          floor_line_y: meta.floor_line_y, horizon_y: meta.horizon_y,
          corner_x0_px: meta.corner_x0_px, corner_x1_px: meta.corner_x1_px,
          storey_height_m: (meta.measured_room && meta.measured_room.storey_height_m)
            || meta.storey_height_m,
          camera_wall_m: (meta.measured_room && meta.measured_room.camera_wall_m)
            || meta.camera_wall_m || meta.camera_far_m,
          wall_width_m: meta.wall_width_m
        } : null
      };
    }
  }
  return out;
}
