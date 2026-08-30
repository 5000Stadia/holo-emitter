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
/* [row 40] PLAYWRIGHT IS LOADED WHEN A BROWSER IS ACTUALLY WANTED, not when
 * this module is imported. Five functions in here launch one; the material
 * vocabulary the rest of the pipeline now reads out of this file
 * (`materialParts`, `rulingSentences`, `normMaterial`,
 * `materialProvenance`) launches nothing, and `promote-backdrop.mjs` is run
 * from staged trees that carry the tools and none of node_modules. A static
 * import made those trees fail to resolve `playwright` before a line of the
 * promotion ran, which is a build-shaped refusal wearing a gate's clothes. */
const chromium = {
  async launch(...a) { return (await import("playwright")).chromium.launch(...a); }
};
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname, resolve, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { askTextFor } from "./flight-evidence.mjs";
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
/* THE PROSE REGISTRY the ask audit reads an OLD ask through: every wording a
 * material has been asked for, current and retired. See "VOUCHING FOLLOWS THE
 * MATERIAL, NOT THE WORDING" below. */
import { declaredMaterialPhrases } from "./room-voices.mjs";
import { voiceFor, windowLines, hangingsFor, ANCHOR_M, carryableOutdoors, REDACTED_CORRECTION,
  lightsFor, surroundFor, transomFor, casementSentence, WINDOW_WORDS } from "./room-voices.mjs";
/* [row 43] THE REGISTER, and it is shared rather than copied:
 * `frame-language.mjs` is the one home for both of them. `g5Prompt` is what
 * production composes, without the coordinate appendix; `registerBlock` is
 * `g4`'s, reached from this file only through `g4ManorPrompt`, which is the
 * harness's declared control arm and is dispatched by no emitter. See that
 * file's header for what each was measured at and for what neither claims. */
import { frameGeometry, registerBlock, positiveNoText, flightLines, col,
  g5Prompt, scaffoldIndex } from "./frame-language.mjs";
/* [row 38] THE SEAM SEED. A fresh ask whose adjacent facing is already painted
 * carries that neighbour's abutting 10 % beside the layout image, with its role stated in
 * words. The adjacency table, the crop, the ordering exception for open
 * locations and the packet's own wording all live in `edge-seed.mjs`; nothing
 * about a seam is decided here. */
import { attachSeed, packetNote, attachLine, isOpenLocation, roleSentence, stylePacketNote }
  from "./edge-seed.mjs";
/* [row 43 close, 2026-08-25] IMAGE 1 IS DERIVED, NOT THE RAW WALL. Rows 40 and
 * 42 decide WHICH wall a packet may show; `style-seed.mjs` decides what is IN
 * the picture it shows, which is the room's fabric with every opening and
 * carrier filled in from that wall's own adjacent paint. `servants_hall/E` is
 * the finding: an ask that ruled a hearth at the centre and a three-light window
 * left of it came back with two doorways and no window, and doorways are what
 * the room's other walls carry. See that file's header. */
import { deriveStyleSeed } from "./style-seed.mjs";
/* [row 42] The first wall leads, in every room — the lead choice, the order it
 * puts a location's facings in, and the sentence that says why. */
import { roomOrder, leadFacing, leadWhy } from "./edge-seed.mjs";
/* [row 40] A consistency re-ask is shown BOTH painted neighbours, and only
 * neighbours the measure puts inside the room's agreeing walls. */
import { attachSeeds, packetNoteAll, attachLineAll } from "./edge-seed.mjs";

/* [row 44] The location, as data. See `tools/pack.mjs`. */
import { activePack } from "./pack.mjs";

const require_ = createRequire(import.meta.url);
const groundplane = require_("../src/groundplane.js");
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
/* [row 44] THE ACTIVE LOCATION, as data. Every constant below that used to
 * name the manor — the ruled anchor height, the plan path, the batch
 * directory, the viewer query, the era sentence — is read from
 * `packs/<name>/` now. `--pack <name>`, else `HOLO_PACK`, else `manor`.
 * Production law clause 8: the theme never bleeds into the code. */
const PACK = activePack();
/* THE PACK'S OWN RULED ANCHOR — what the scaffold stamps when a caller hands no
 * voice-resolved anchor. It used to be a typed "CHAIR-RAIL ... GATE ANCHOR"
 * string, which is one world's joinery standing as the engine's default; the
 * pack's `world.ruler.kind` names it now and `pack.mjs` has already refused a
 * pack whose voices do not define it. */
const RULED_ANCHOR = PACK.voices.ANCHORS[PACK.world.ruler.kind];
const CANVAS_W = 1536;
const CANVAS_H = 1024;

/* THE STANDING BAND, imported rather than typed: every detector bracket below
 * is this number propagated through a geometry the scaffold itself declares.
 * The round may not bring its own band (blueprint §5, `gate.py`'s own header). */
import { MEASURED_BAND } from "./validate-fixtures.mjs";

/* Blueprint §11's universal anchor: the wainscot chair-rail, on every panelled
 * wall in the manor. It is the one ruler the gate votes on. */
const CHAIR_RAIL_M = PACK.world.ruler.height_m;
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
const DOOR_HEAD_M = PACK.world.conventions.door_head_m;
/* Scaffold CONVENTIONS — declared, drawn, and scored by nothing. A plan view is
 * a horizontal section and holds no vertical dimension anywhere, so these are
 * the scaffold's own and they say so on its legend. */
const CONVENTION = {
  fireplace_height_m: 1.60,
  window_sill_m: PACK.world.conventions.window_sill_m,   // the pack's, so the sheet and the sentence agree
  window_head_m: PACK.world.conventions.window_head_m,
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
    label: (anchor || RULED_ANCHOR).label,
    anchor: (anchor || RULED_ANCHOR).id
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
/* The sheet — what the diagram is MADE OF                             */
/* ------------------------------------------------------------------ */
/* TWO PIECES OF EVIDENCE, both 2026-08-25, and both say the same thing: the
 * scaffold's DARK GROUND and its DARK-FILLED BOXES are being read as the
 * picture's own look and as holes in the wall.
 *
 *   (1) `design/prompts/cold-guide-master_bedchamber-N.md` went out cold with
 *       only the scaffold attached and came back a flat modern render in the
 *       DIAGRAM's dark grey with a lit fire — every period word in the prompt
 *       lost to the one image in the packet.
 *   (2) `servants_hall/E`'s retry-4 packet carried no Image 1 at all: one
 *       scaffold, two dashed boxes labelled WINDOW and FIREPLACE. The return
 *       (`backdrops/source/servants_hall-E/row23-230bb67d.png`) painted TWO
 *       DARK DOORWAYS exactly where those two boxes stood. A dark rectangle in
 *       a dark room IS a doorway; the label never had a chance.
 *
 * So the sheet changes and the geometry does not. `ink-on-paper-v2` is paper
 * white with thin dark ink: every line is where two surfaces meet, every box is
 * an OUTLINE with a hatched interior, and no region of it is filled with a tone
 * a painter could mistake for a material, a palette or an opening. There is no
 * colour in it to copy and no darkness in it to cut a hole out of.
 *
 * THE OLD SHEET STAYS SELECTABLE AND IS THE ONLY ONE THAT DRAWS THROUGH THE
 * SHIPPED RENDERER. `grid-v1` is `window.HOLO.renderer.render` at
 * `backdrop_only + no_through`, unchanged to the byte — which is what row 23
 * §7.4 re-renders the committed scaffolds with, and what the harness's control
 * arm attaches. A sidecar written before this row carries no `scaffold_style`
 * and therefore re-renders as `grid-v1`, which is the whole of the migration.
 *
 * WHAT v2 GIVES UP, SAID PLAINLY. `grid-v1`'s frame carries row 23 §7.1's
 * guarantee — the picture a painter is given is the picture a player sees — and
 * `ink-on-paper-v2` does not, because it is not that picture and must not look
 * like it. What it keeps instead is the number: every line below comes out of
 * `frame-language.mjs`'s `frameGeometry`, which is `groundplane` called exactly
 * as `drawGrid` calls it off the SAME meta the renderer draws from — computed
 * in node before the page opens and written into the sidecar, so the drawing is
 * re-renderable from its own record and `scaffold.spec.mjs` can hold each line
 * against the renderer's own value for it.
 */
export const SCAFFOLD_STYLES = ["grid-v1", "ink-on-paper-v2"];
export const SCAFFOLD_STYLE_DEFAULT = "ink-on-paper-v2";
export function assertScaffoldStyle(style) {
  if (style != null && !SCAFFOLD_STYLES.includes(style)) {
    throw new Error(
      `make-scaffold: unknown scaffold style ${JSON.stringify(style)}. ` +
      `The sheet is one of: ${SCAFFOLD_STYLES.join(", ")}. A style nobody declares is a ` +
      "diagram nobody can re-render from its sidecar.");
  }
  return style;
}

/* THE INK, and it is ink: one near-black for the geometry a painter must obey,
 * one grey for the notes, one pale grey for the datum and the hatching. Nothing
 * here is a hue. A sheet with a colour on it is a sheet with a palette on it,
 * and a palette is exactly what the master bedchamber's return copied. */
export const SHEET = {
  paper: "#f4f1ea",
  ink: "#1a1c1f",
  mid: "#5c6066",
  faint: "#b0aa9f",
  hatch: "#c8c2b6"
};

/**
 * The line drawing, in ink: WHERE SURFACES MEET, and nothing else.
 *
 * THE GEOMETRY IS `frame-language.mjs`'s `frameGeometry` AND NOT A SECOND COPY
 * OF IT. That function already owns the four junctions, the two corners and the
 * three rows, computed off `groundplane` exactly as `renderer.js`'s `drawGrid`
 * computes them — and it is the same function the register's own sentences are
 * written from ("its left corner stands about a fifth of the way in from the
 * picture's left edge"). Drawing the sheet from it is what makes
 * "Image N draws these lines exactly; follow it" true by construction rather
 * than by two files agreeing.
 *
 * WHAT IS DELIBERATELY ABSENT. The renderer's metre GRID is not here. On paper
 * a rank of dark verticals standing floor-to-ceiling across a wall is
 * panelling — stiles, mullions, a chopped-up repeat — which is the very defect
 * row 41 names, and a diagram that draws it is asking for it. The scale the
 * grid carried is kept as short TICKS across the floor line, where nothing
 * built can be read into a mark six pixels long, and as the legend's own
 * `SCALE` line.
 */
export function inkGeometry(meta) {
  const W = CANVAS_W;
  const g = frameGeometry(meta);
  const floorY = g.floorY, eyeY = g.horizonY, ceilY = g.ceilY;
  /* An OPEN facing has no band, and therefore no corner, no return and no
   * ceiling — `drawGrid`'s own `bounded` requires a full-width band and
   * `frameGeometry`'s requires only two corners, so the band test is applied
   * here rather than assumed away. */
  const hasBand = meta.facing_type !== "open";
  const bounded = g.bounded && hasBand;
  const lines = [];
  const push = (what, weight, x0, y0, x1, y1, dash) => {
    lines.push({
      what, weight, dash: dash || null,
      x0: round(x0, 2), y0: round(y0, 2), x1: round(x1, 2), y1: round(y1, 2)
    });
  };
  const junction = (side, name, part) => {
    const s = g[side];
    if (!s || !s[part]) return;
    push(name, "heavy", s[part].from.x, s[part].from.y, s[part].to.x, s[part].to.y);
  };
  if (bounded) {
    const wallTop = (ceilY !== null && ceilY > 0) ? ceilY : 0;
    push("the line where the wall you face meets the floor", "heavy",
      g.cL, floorY, g.cR, floorY);
    junction("left", "the line where the left side wall meets the floor", "floor");
    junction("right", "the line where the right side wall meets the floor", "floor");
    push("the left corner, where the two walls meet", "heavy", g.cL, wallTop, g.cL, floorY);
    push("the right corner, where the two walls meet", "heavy", g.cR, wallTop, g.cR, floorY);
    if (ceilY !== null && ceilY > 0) {
      push("the line where the wall you face meets the ceiling", "heavy",
        g.cL, ceilY, g.cR, ceilY);
      junction("left", "the line where the left side wall meets the ceiling", "ceiling");
      junction("right", "the line where the right side wall meets the ceiling", "ceiling");
    }
  } else {
    push("the far line where the ground meets what stands beyond it", "heavy",
      0, floorY, W, floorY);
  }
  /* THE EYE LINE, on the renderer's own condition: drawn where there is a
   * surface for it to cross and nowhere else. Dashed, because it is a camera
   * fact and not an edge of anything — a solid rule at eye height across a wall
   * is a string course, and this drawing may not invent one. */
  if (hasBand) {
    push("the eye line - where the receding lines meet", "light", 0, eyeY, W, eyeY, [10, 9]);
  }
  const sWall = meta.px_per_m_at_wall;
  /* THE SCALE, AS TICKS ON THE FLOOR LINE. One per whole metre of the wall's
   * own ruler, straddling the line by six pixels — short enough that no run of
   * them can be read as anything standing on the floor. */
  const ticks = [];
  if (sWall > 0 && meta.wall_width_m > 0) {
    for (let m = 0; m <= Math.round(meta.wall_width_m); m++) {
      const x = rulerX(Math.min(m, meta.wall_width_m), meta);
      if (x < 0 || x > W) continue;
      ticks.push({ x: round(x, 2), m: round(Math.min(m, meta.wall_width_m), 2) });
    }
  }
  return {
    _what_this_is:
      "The ink-on-paper sheet's whole line work, computed in node from this facing's meta " +
      "through frame-language.mjs's frameGeometry — the same junctions, corners and rows the " +
      "register's own sentences are written from, and the same groundplane calls renderer.js's " +
      "drawGrid makes — and written here so the drawing is re-renderable from its own record. " +
      "Every line is where two surfaces meet; nothing in it is a colour, a material or an opening.",
    style: "ink-on-paper-v2",
    /* THE PALETTE TRAVELS WITH THE LINE WORK, so the record describes the whole
     * picture rather than most of it. `scaffold.spec.mjs` also holds this copy
     * against the module's own `SHEET`, so a palette change is a red test
     * naming the artifacts to re-cut and not a silently divergent re-render. */
    sheet: { ...SHEET },
    bounded, has_band: hasBand,
    floor_line_y_px: round(floorY, 2),
    ceiling_line_y_px: ceilY == null ? null : round(ceilY, 2),
    eye_line_y_px: round(eyeY, 2),
    tick_half_px: 6,
    ticks, lines
  };
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
  const { key, meta, mode, marks, G, style, ink, sheet } = arg;
  const cv = document.createElement("canvas");
  cv.width = 1536; cv.height = 1024;
  /* THE SHEET DECIDES WHAT THE GROUND IS. `grid-v1` — no style, or the name —
     is the shipped renderer's frame and is unchanged to the byte, which is what
     every committed scaffold re-renders as. `ink-on-paper-v2` is paper and the
     declared line work, and the renderer is not called at all: its picture is
     the picture a PLAYER sees, and the whole finding this style answers is that
     a painter handed that picture paints the diagram. */
  const S = style === "ink-on-paper-v2" ? sheet : null;
  if (style === "ink-on-paper-v2" && (!S || !ink)) {
    /* A CALLER THAT NAMES THE SHEET AND HANDS NO SHEET WOULD SILENTLY GET THE
       OTHER ONE, which is the one failure this whole style exists to stop. */
    throw new Error("make-scaffold PAGE_RENDER: the ink-on-paper sheet was named and " +
      (!S ? "no palette" : "no line work") + " was handed across");
  }
  if (S) {
    const g = cv.getContext("2d");
    g.fillStyle = S.paper;
    g.fillRect(0, 0, cv.width, cv.height);
    const WT = { heavy: 2.4, medium: 1.6, light: 1.2 };
    const CL = { heavy: S.ink, medium: S.mid, light: S.faint };
    if (ink) {
      g.lineCap = "butt";
      for (const l of ink.lines) {
        g.strokeStyle = CL[l.weight] || S.ink;
        g.lineWidth = WT[l.weight] || 1.6;
        g.setLineDash(l.dash || []);
        g.beginPath();
        g.moveTo(l.x0, l.y0);
        g.lineTo(l.x1, l.y1);
        g.stroke();
      }
      g.setLineDash([]);
      g.strokeStyle = S.mid;
      g.lineWidth = 1.2;
      for (const t of ink.ticks) {
        g.beginPath();
        g.moveTo(t.x, ink.floor_line_y_px - ink.tick_half_px);
        g.lineTo(t.x, ink.floor_line_y_px + ink.tick_half_px);
        g.stroke();
      }
    }
  } else {
    const A = window.HOLO_APP;
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
  }
  if (!marks) return cv.toDataURL("image/png");

  /* ---- the label pass, over the frame just drawn ---- */
  const ctx = cv.getContext("2d");
  const INK = S ? S.ink : "#e8f4ff", DIM = S ? S.mid : "#9fc4e0";
  /* A BOX IS A KEYED REGION, NEVER A FILL. On paper an outline with a light
     diagonal hatch through it is the one mark a reader cannot take for a
     surface: it has no tone of its own and it is plainly drawn ON the sheet
     rather than in the room. `servants_hall/E`'s two dark boxes became two dark
     doorways; a hatched outline has nothing to become. */
  function hatch(x0, y0, x1, y1) {
    if (!S) return;
    const h = y1 - y0;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0, y0, x1 - x0, h);
    ctx.clip();
    ctx.strokeStyle = S.hatch;
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    for (let d = 0; d <= (x1 - x0) + h; d += 14) {
      ctx.beginPath();
      ctx.moveTo(x0 + d, y0);
      ctx.lineTo(x0 + d - h, y1);
      ctx.stroke();
    }
    ctx.restore();
  }
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
    hatch(m.x0, m.y0, m.x1, m.y1);
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
    hatch(s.x0, s.y0, s.x1, s.y1);
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
  /* ON PAPER THE ANCHOR IS A DATUM LINE, drawn long-dash-dot as every drawing
     board has drawn a datum since there were drawing boards. It is the one mark
     here that names something the painter DOES paint — the gate measures it —
     so it must read as "this height", not as an edge of the room. */
  if (S) ctx.setLineDash([26, 7, 3, 7]);
  ctx.beginPath();
  ctx.moveTo(cr.x0, cr.y);
  ctx.lineTo(cr.x1, cr.y);
  ctx.stroke();
  ctx.setLineDash([]);
  glyphText(cr.label, cr.x0 + 12, cr.y + 10, 18, INK);

  const lg = marks.legend;
  ctx.strokeStyle = DIM;
  ctx.lineWidth = 2;
  ctx.strokeRect(lg.x, lg.y, lg.w, lg.h);
  let ly = lg.y + 12;
  for (const line of lg.lines) { glyphText(line, lg.x + 12, ly, lg.text_h, DIM); ly += lg.line_h; }

  return cv.toDataURL("image/png");
};

/**
 * One render, at one sheet.
 *
 * `style` is `grid-v1` (or absent, which is the same thing and is what every
 * sidecar written before this row says) or `ink-on-paper-v2`. The ink geometry
 * is computed HERE, in node, and handed across — the page draws what it is
 * given and derives nothing, exactly as the label pass already works.
 */
async function renderPng(page, key, meta, mode, marks, style) {
  assertScaffoldStyle(style);
  const ink = style === "ink-on-paper-v2" ? inkGeometry(meta) : null;
  return await page.evaluate(PAGE_RENDER,
    { key, meta, mode, marks: marks || null, G, style: style || null, ink,
      sheet: ink ? ink.sheet : SHEET });
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
    `RULED - ${(anchor || RULED_ANCHOR).legend_word} ${CHAIR_RAIL_M.toFixed(2)} M · CARRIER WIDTHS · DOOR HEAD ${DOOR_HEAD_M.toFixed(2)} M`,
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
    const out = resolve(argOf("--out", PACK.paths.batch_dir));
    await emitManor(out, {
      scaffoldStyle: argOf("--scaffold-style", SCAFFOLD_STYLE_DEFAULT),
      technique: argOf("--technique", "t2"),
      rolls: Number(argOf("--rolls", "2")),
      retries: Number(argOf("--retries", "2")),
      limit: argOf("--limit") ? Number(argOf("--limit")) : 0
    });
    return;
  }
  if (argv.includes("--emit-retries")) {
    const out = resolve(argOf("--out", PACK.paths.batch_dir));
    await emitRetries(out, {
      scaffoldStyle: argOf("--scaffold-style", SCAFFOLD_STYLE_DEFAULT),
      technique: argOf("--technique", "t2"),
      rolls: Number(argOf("--rolls", "2")),
      retries: Number(argOf("--retries", "3")),
      walls: argv.reduce((a, x, i) => (x === "--wall" ? a.concat(argv[i + 1]) : a), [])
    });
    return;
  }
  if (argv.includes("--emit-facing-materials")) {
    const plan = JSON.parse(readFileSync(PACK.paths.plan, "utf8"));
    const doc = emitMaterials(VOICES, plan);
    const fm = facingMaterials(plan, doc);
    /* `--out`, for the reason `--audit-materials` has one: a freshness check
     * emits into a temp file and byte-compares rather than writing over the
     * committed artifact to find out whether it would have changed. */
    const out = resolve(argOf("--out", join(ROOT, "backdrops", "textures", "facings.json")));
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
  if (argv.includes("--audit-materials")) {
    /* [row 40 - the ORIGIN] The observer that did not exist on 2026-08-23.
     * Deterministic, no browser, no model: it reads the ask every promoted
     * painting was made from and compares it with the ask this composer writes
     * for that room today. Run it after ANY edit to `tools/room-voices.mjs` -
     * that is the moment the store goes stale, and it is the moment nothing
     * used to notice. */
    const plan = JSON.parse(readFileSync(PACK.paths.plan, "utf8"));
    const rep = materialProvenance(plan);
    const out = resolve(argOf("--out",
      join(ROOT, "design", "plan-draft", "measured", "material_provenance.json")));
    writeFileSync(out, JSON.stringify(rep, null, 2) + "\n");
    console.log(`promoted facings   ${rep.promoted_facings}`);
    console.log(`vouched facings    ${rep.vouched_facings}  ` +
      `(current or refined — the walls a room may show its own painter)`);
    /* THE CLASS PER ROOM, per facing, because "superseded ask on NSW" was the
     * line that hid the whole miss: it said the same thing about a wall painted
     * in the wrong fabric and a wall painted in the right one under older
     * words, and the two have opposite consequences. */
    console.log(`\n  ROOM VERDICT         ROOM                 FACINGS BY CLASS`);
    for (const r of rep.rooms) {
      const byClass = new Map();
      for (const f of r.facings) byClass.set(f.class, (byClass.get(f.class) || []).concat(f.facing));
      const cols = ["current", "refined", "split-ask", "stale-material"]
        .filter((c) => byClass.has(c))
        .map((c) => `${byClass.get(c).join("")} ${c}`);
      if (r.unprovable.length) cols.push(`${r.unprovable.join("")} ask unrecoverable`);
      console.log(`  ${r.verdict.padEnd(20)} ${r.room.padEnd(20)} ${cols.join("; ")}`);
    }
    console.log(`\n  current = the ask states this room's ruling sentences verbatim`);
    console.log(`  refined = it names the same MATERIALS in wording since refined — VOUCHED,` +
      ` re-asked only with --refined-too`);
    console.log(`  split-ask / stale-material = a different material; re-asked by default with` +
      ` --emit-consistency --from-ask`);
    console.log(`\nreport             ${out.slice(ROOT.length + 1)}`);
    if (argv.includes("--seal-legacy")) {
      /* THE LEDGER OF WHAT WAS ALREADY IN THE STORE WHEN THE GATE LANDED.
       * Written once. `promote-backdrop.mjs`'s row-40 clause admits a wall
       * only if this file names it AND names the exact candidate bytes it is
       * being promoted from, so a re-ask - which produces a new candidate id -
       * can never fall back through it, and a wall nobody repairs stays
       * visible here with its own reason instead of passing silently.
       * Production law clause 2: the miss is logged with its why. Clause 3:
       * it CLOSES when the wall is re-asked, and its line here is deleted in
       * the same commit. */
      const admitted = {};
      for (const r of rep.rooms) {
        for (const f of r.facings) {
          if (f.verdict === "current") continue;
          admitted[`${r.room}/${f.facing}`] = {
            candidate: f.candidate,
            voice: f.voice,
            /* THE CLASS RIDES ON THE ADMISSION, because the ledger's own reason
             * used to say "it predates the voice the room now speaks" about two
             * different things: a wall painted in another fabric, and a wall
             * painted in this one before the words were tightened. The second is
             * VOUCHED — `styleImageFor` may show it — and a reader of this file
             * could not tell which they were holding. */
            class: f.class,
            vouched: isVouched(f.class),
            why: f.verdict === "unrecoverable"
              ? f.why
              : f.class === "refined"
                ? `the ask this painting was made from names this room's ruled ` +
                  `${f.missing.join(" and ")} in WORDING that has since been refined — the same ` +
                  `material (${f.missing.map((k) => f.ruling_materials[k]).join(", ")}), ` +
                  `declared in room-voices.mjs SAID_BEFORE. The wall is vouched; this line stays ` +
                  `open only because the store's bytes predate the refined words`
                : `the ask this painting was made from names no ${f.missing.join(" or ")} ` +
                  `this plan rules for the room; it predates the voice the room now speaks`,
            asked: f.asked || null,
            ruled: f.ruling,
            closes_when: `node tools/make-scaffold.mjs --emit-consistency --from-ask ` +
              (f.class === "refined" ? "--refined-too " : "") +
              `--wall ${r.room}/${f.facing}`
          };
        }
      }
      const canonicalLegacy = join(ROOT, "design", "plan-draft", "measured", "material_legacy.json");
      const lp = resolve(argOf("--legacy-out", canonicalLegacy));
      /* THE SEAL DATE IS WHEN THE GATE LANDED, NOT WHEN THIS LAST RAN. The
       * ledger is regenerated after every promotion now (`derived.py`), and a
       * `_sealed` stamped with today's date would move the file's bytes on a
       * day when nothing about the store had changed — which is an artifact
       * that can never be shown fresh, and a diff nobody can read. So the date
       * is carried from whichever copy exists: the one being written over, or
       * the canonical one when this is writing a comparison copy elsewhere. */
      const priorSeal = [lp, canonicalLegacy]
        .map((p) => (existsSync(p) ? JSON.parse(readFileSync(p, "utf8"))._sealed : null))
        .find((d) => typeof d === "string" && d.length);
      writeFileSync(lp, JSON.stringify({
        _what_this_is:
          "[row 40 - the ORIGIN] The paintings that were already promoted when " +
          "promote-backdrop.mjs's row40:material.voice_stale clause landed. Each was " +
          "made from an ask that does not name the materials this plan rules for its " +
          "room, because the manor's 85 packets went out at 2026-08-23 03:54 under a " +
          "composer that keyed materials on room.archetype and row 29's voice table " +
          "landed at 11:03 and re-emitted only thirteen walls. This file is a LEDGER, " +
          "not an exemption: an entry admits one facing from one exact candidate, a " +
          "re-ask produces a new candidate id that is not in here, and the list can " +
          "only shrink. Delete an entry in the same commit that re-asks its wall.",
        _sealed: priorSeal || new Date().toISOString().slice(0, 10),
        _closes_with: "node tools/make-scaffold.mjs --emit-consistency --from-ask",
        open: Object.keys(admitted).length,
        admitted
      }, null, 2) + "\n");
      console.log(`legacy ledger      ${lp.slice(ROOT.length + 1)}  (${Object.keys(admitted).length} open)`);
      return;
    }
    /* A NON-ZERO EXIT IS THE POINT. This is a gate, and a gate that cannot
     * refuse is a report. `--warn-only` exists for the ledger pass that has to
     * write the report while the legacy store is still being repaired. */
    const bad = rep.rooms.filter((r) => r.verdict !== "current");
    if (bad.length && !argv.includes("--warn-only")) {
      console.error(`\nmake-scaffold refused: ${bad.length} room(s) in the store were not painted ` +
        `from this plan's own ruling materials. Cut their re-asks with ` +
        `\`--emit-consistency --from-ask\`.`);
      process.exitCode = 1;
    }
    return;
  }
  if (argv.includes("--emit-consistency")) {
    const out = resolve(argOf("--out", PACK.paths.batch_dir));
    await emitConsistency(out, {
      scaffoldStyle: argOf("--scaffold-style", SCAFFOLD_STYLE_DEFAULT),
      technique: argOf("--technique", "t2"),
      rolls: Number(argOf("--rolls", "1")),
      report: argOf("--report", ""),
      /* [row 40 - the ORIGIN] Source the outliers from the ASK rather than
       * from the pixels. The pixel measure needs every facing of a room
       * painted before it can speak, and it is blind on the one axis its own
       * sweep proved must not vote (stair_landing). The ask is on disk the
       * moment a roll is made and it cannot be fooled by exposure. */
      fromAsk: argv.includes("--from-ask"),
      /* FORCE THE WORDS. By default a wall whose ask named this room's own
       * materials in a wording since refined is NOT re-asked — it is vouched,
       * and a roll spent to change the words changes nothing on the wall. This
       * is the Navigator saying the words matter this time. See "VOUCHING
       * FOLLOWS THE MATERIAL, NOT THE WORDING". */
      refinedToo: argv.includes("--refined-too"),
      rooms: argv.reduce((a, x, i) => (x === "--room" ? a.concat(argv[i + 1]) : a), []),
      walls: argv.reduce((a, x, i) => (x === "--wall" ? a.concat(argv[i + 1]) : a), [])
    });
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
    console.error("usage: node tools/make-scaffold.mjs <location>/<facing> --out <dir> [--camera page|derived|reading] [--round <name>] [--scaffold-style ink-on-paper-v2|grid-v1]");
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
  const sheetStyle = assertScaffoldStyle(argOf("--scaffold-style", SCAFFOLD_STYLE_DEFAULT));
  const camera = argOf("--camera", "page");
  const roundName = argOf("--round", "cand6");
  mkdirSync(outDir, { recursive: true });

  const [loc, facing] = key.split("/");
  const plan = JSON.parse(readFileSync(PACK.paths.plan, "utf8"));

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
  await page.goto(pathToFileURL(join(ROOT, "index.html")).href + `?world=${PACK.world.paths.world_query}`);
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
  const framePng = await renderPng(page, key, meta, "scaffold", null, sheetStyle);
  const scafPng = await renderPng(page, key, meta, "scaffold", marks, sheetStyle);
  await browser.close();

  const framePath = join(outDir, `${loc}-${facing}-frame.png`);
  const scafPath = join(outDir, `${loc}-${facing}-scaffold.png`);
  writePng(framePng, framePath);
  writePng(scafPng, scafPath);

  const sidecar = {
    _what_this_is: sheetStyle === "ink-on-paper-v2"
      ? `The scaffold for ${key}: a line drawing in ink on paper - where this facing's surfaces meet, with the plan's carriers stamped into it as outlined boxes, and every number the drawing used.`
      : `The scaffold for ${key}: the shipped renderer's own grid frame for this facing with the plan's carriers stamped into it, and every number the stamping used.`,
    facing: key,
    /* [row 43(a)] THE SHEET THIS WAS DRAWN ON, so it can be drawn again. A
     * sidecar written before this row carries no `scaffold_style` and
     * re-renders as `grid-v1`, which is exactly what it was. */
    scaffold_style: sheetStyle,
    ink_geometry: sheetStyle === "ink-on-paper-v2" ? inkGeometry(meta) : null,
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

/* ------------------------------------------------------------------ */
/* [row 42] WHERE A FACING'S PICTURE IS, INCLUDING BEFORE IT IS PROMOTED */
/* ------------------------------------------------------------------ */
/* Row 38 and row 40 both ask one question of a neighbouring wall — is there a
 * picture of it — and both answer it with `isPainted`, which means PROMOTED.
 * That is right for them: a promoted painting has passed the camera gate, the
 * door reading and the material clause, so seeding from one cannot spread a
 * frame nobody has checked.
 *
 * Row 42 needs the same question answered one step earlier. The lead is painted
 * FIRST and followed IMMEDIATELY, and its promotion runs through a measurement
 * sweep that can take hours or refuse outright — so a room whose other three
 * walls waited for the lead's promotion would be a room that is ordered and
 * then stalled. What they wait for is the lead's CANDIDATE.
 *
 * WHICH candidate, decided from the loop's own record rather than from a
 * directory listing, because a wall can hold several rolls and "the newest
 * file" is not a fact anyone wrote down: `run-state.json` names the candidate
 * the sweep is working from, and that is the picture the lead currently IS.
 * The directory is only the fallback for a roll that has landed before the
 * sweep has seen it, and there the newest file is the honest answer and is
 * recorded as such.
 *
 * This file READS run-state.json and never writes it. */
export function imageFor(key, opts = {}) {
  const root = opts.root || ROOT;
  const [loc, f] = key.split("/");
  if (existsSync(join(root, "backdrops", loc, `${f}.png`)) &&
      existsSync(join(root, "backdrops", loc, `${f}.meta.json`))) {
    return { rel: `backdrops/${loc}/${f}.png`, kind: "promoted" };
  }
  if (!opts.candidates) return null;
  const state = opts.state || {};
  const named = ((state.walls || {})[key] || {}).candidate;
  if (named && existsSync(join(root, named))) {
    return { rel: named, kind: "candidate", via: "run-state.json" };
  }
  const dir = join(root, sourceDirFor(key));
  if (!existsSync(dir)) return null;
  const rolls = (existsSync(dir) ? readdirSync(dir, { withFileTypes: true }) : [])
    .filter((d) => d.isFile() && /^row\d+-[0-9a-f]{8}\.png$/.test(d.name))
    .map((d) => ({ name: d.name, t: statSync(join(dir, d.name)).mtimeMs }))
    .sort((a, b) => b.t - a.t || a.name.localeCompare(b.name));
  if (!rolls.length) return null;
  return {
    rel: `${sourceDirFor(key)}/${rolls[0].name}`, kind: "candidate",
    via: "the newest roll on disk; the sweep has not recorded one for this wall yet"
  };
}

/** The resolver row 42's ordering runs on: promoted first, then the candidate. */
export const leadImageResolver = (state, root) =>
  (key) => imageFor(key, { state, root, candidates: true });

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
      /* [row 40] THE ROW-23 MATRIX KEEPS ITS SEED. It is a two-wall experiment
         on the STUDY, and the style seed IS a painting of the study - Kabe's
         ruling that Image 1 must be a wall of the room being painted is
         satisfied here by the seed itself, and its arms are the hall's ration
         being measured, not leaking. */
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
export const PIER_ANCHOR_SENTENCE = "The open side is flanked at each end, at the edge of frame, by a low coursed-stone pier where the boundary wall stops; the flat stone cap on each pier sits at exactly 0.95 m above the ground at the open side's line. Between the piers nothing stands. It is masonry standing in the open air: no timber rail, no lining and no built interior finish of any kind appears anywhere in this picture.";
export const OPEN_SIDE_FABRIC = "no wall at all on this side: open ground running out through the open side and on to the horizon, with only the low stone piers at its two ends, under open sky";

/* ------------------------------------------------------------------ */
/* [row 40] THE ROOM'S MATERIAL ASK HAS ONE HOME                        */
/* ------------------------------------------------------------------ */
/* Row 40's ORIGIN hunt ended here. The five rooms Kabe saw as two rooms were
 * not painted badly and were not painted from divergent prompts by accident:
 * their facings were asked, verbatim, for DIFFERENT MATERIALS, seven hours
 * apart in the commit history.
 *
 *   `4efd69d` 2026-08-23 03:54  the manor run emits 85 packets. The composer
 *                              then keyed materials on `room.archetype` and
 *                              fell through to the panelled-parlour default,
 *                              so a bedchamber, a garden parlour, a kitchen
 *                              and the servants' hall were all asked for
 *                              "dark hand-finished oak wall panelling, aged
 *                              parchment-toned plaster ceiling, wide worn oak
 *                              floorboards".
 *   `e0f02b6` 2026-08-23 11:03  row 29 lands the voice table — and re-emits
 *                              THIRTEEN walls under it. Every other facing
 *                              keeps the packet it already has, because
 *                              `--emit-manor`'s reuse rule skips a facing that
 *                              is promoted or has candidates on disk.
 *   `d223961` 2026-08-23 14:16  the sweep re-asks 27 held walls, and those
 *                              carry the voice.
 *
 * So from 11:03 onward, WHETHER A FACING SPOKE ITS ROOM'S VOICE WAS DECIDED BY
 * WHETHER IT HAPPENED TO NEED A RE-ASK — a camera property, not a room
 * property. Four walls of one room, rolled independently, landed on both sides
 * of that line and the room stopped being one room. guest_chamber S is voiced
 * and N/E/W are not; master_bedchamber N/S are and E/W are not;
 * servants_hall S/W are and N/E are not; garden_room N/E are and W is not;
 * closet_chamber N is and E/W are not. That is the whole of the disease and it
 * matches the pixel measure facing for facing.
 *
 * THE STRUCTURAL CAUSE IS NOT THE OLD TABLE — a table gets corrected. It is
 * that a correction to the table CANNOT REACH THE STORE: idempotence-by-
 * existence means the emitter never re-asks a wall it has already got, and
 * nothing anywhere noticed that a promoted painting was made from an ask the
 * current composer would no longer write. `materialProvenance` below is that
 * missing observer, and it needs no pixels and no model.
 *
 * THE FIRST HALF OF THE CURE IS THIS FUNCTION. Every material sentence in a
 * manor ask is composed HERE and nowhere else, so the auditor asks the same
 * code the emitter answers with, and a room's four facings cannot be given
 * different words unless the plan itself makes them different rooms. */
export function materialParts({ voice, loc, out, openSide, built }) {
  if (out) {
    /* AN OUTDOOR FACING WITH OPENINGS IN IT IS THE HOUSE'S OWN ELEVATION, and
     * the plan decides which by whether it draws any carrier on that wall line
     * - `entrance_court/N` six windows and a door, `privy_garden/N` nothing.
     *
     * THIS IS THE ONE LICENSED PER-FACING DIFFERENCE and it is declared rather
     * than accidental: a side with no wall on it genuinely is not the fabric
     * the walled sides are, and the row-40 gate exempts exactly this branch
     * by name. Every other per-facing difference in a room's materials is the
     * disease. */
    return {
      walls: (openSide && !built) ? OPEN_SIDE_FABRIC
        : (built && voice.walls_with_openings) || voice.walls,
      overhead: null,
      underfoot: voice.floor,
      hangings: null
    };
  }
  return {
    walls: voice.walls,
    overhead: voice.ceiling,
    underfoot: voice.floor,
    hangings: voice.hangings ? hangingsFor(loc) : null
  };
}

/** The same parts, as the physical lines the ask states them on. */
export function materialLines(ctx) {
  const p = materialParts(ctx);
  const L = [];
  if (ctx.out) {
    L.push(`Materials/textures: ${p.walls}. Underfoot: ${p.underfoot}.`);
    L.push("  Overhead is open sky with weather in it, and daylight falls from it onto everything");
    L.push("  in frame. This place is out of doors and everything in it is built for weather.");
  } else {
    L.push(`Materials/textures: ${p.walls}. Overhead: ${p.overhead}.`);
    L.push(`  Underfoot: ${p.underfoot}.`);
    if (p.hangings) L.push(`  Hangings: ${p.hangings}.`);
  }
  return L;
}

/** The ruling material phrases alone - what the row-40 gate compares one
 *  facing against another with, and what the provenance auditor looks for in
 *  the prompt a promoted painting was actually made from. Carrier and opening
 *  wording is deliberately not in here: a door is a per-facing fact and the
 *  room's fabric is not. */
export const rulingSentences = materialParts;

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
 * `g4` — ROW 34's REGISTER, INSIDE THE SECTION ORDER PRODUCTION SENT UNTIL ROW 43.
 *
 * THIS IS THE DECLARED CONTROL ARM AND NOTHING DISPATCHES IT. `manorPrompt`
 * below is what every emitter composes, and it composes `g5` without the
 * coordinate appendix — the register trial's own result, ruled 2026-08-25
 * ([HUMAN] "That prompt seems like a mess too…." and "test my direction against
 * our tests as well"; `design/batches/g5-register/REPORT.md`). This function
 * stays for two reasons and neither of them is nostalgia:
 *
 *   1. THE NEXT NATURAL BATCH MEASURES THE INCUMBENT AGAINST THE NEW REGISTER.
 *      Row 43 ruled the clean register production on a screen that separated
 *      nothing at n=1 a wall, exactly as it declared before it ran. An
 *      incumbent nobody can compose any more is a ruling that can never be
 *      re-tested, which is the shape of decision this project does not make.
 *      `ARMS["g4-production"]` IS this function.
 *   2. IT IS TIED TO ROW 34's EVIDENCE. `evolution.spec.mjs` holds the register
 *      this composes against the archived prompts `g4` was actually measured
 *      on, case by case, so the control cannot drift away from its own numbers
 *      without going red.
 *
 * Every clause is a function of the plan's carriers, this facing's meta, and
 * the room's voice. `correction` and `seed` behave exactly as they did the day
 * this was production, so the control arm sends what the control arm sent.
 */
export function g4ManorPrompt(plan, key, meta, rects, correction, seed, opts = {}) {
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
  /* [row 40, Kabe's ruling] WHICH PICTURE, IF ANY, STANDS AS IMAGE 1. Derived
   * here rather than handed in, so EVERY caller of this composer - the manor
   * emit, the re-ask, the consistency re-ask, the suite's own 88-prompt sweep -
   * gets the ruling without having to remember it. `null` is a real answer and
   * the common one: a room with no wall this can vouch for gets no style image,
   * and the medium goes in words. */
  const style = opts.style !== undefined ? opts.style : styleImageFor(plan, key);
  /* Underfoot and overhead: an outdoor facing has ground and sky where an
   * interior has a floor and a ceiling, and every line below that would
   * otherwise say "floor" or "room" asks the voice instead. */
  const GROUND = out ? "ground" : "floor";

  const L = [];
  /* THE USE-CASE LINE CARRIES THE VOICE'S SIDE OF THE DOOR, and the lint reads
   * it: an `exterior` prompt that then names interior fabric is refused before
   * an image exists. That is Kabe's veto as a clause rather than as a memory. */
  L.push(`Use case: historical-scene, ${out ? "exterior" : "interior"}`);
  L.push(`Asset type: gameplay backdrop for the ${side} ${SURFACE} of the ${name}, ${PACK.world.era}`);
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
  /* [row 40, Kabe's ruling] IMAGE 1 IS A WALL OF THIS ROOM OR IT IS NOTHING.
   * What stood here made a painting of the STUDY the reference for every wall
   * in the house, and then spent four lines telling the painter not to copy its
   * materials or its glass. It copied them anyway: `privy_garden/N` was asked
   * for weathered ashlar under open sky and came back with the study's oak
   * wainscot round a garden, and seven of the nineteen promoted plain-glass
   * window walls carry the study window's coloured shields. A reference that
   * has to be argued with in every packet is a reference in the wrong place. */
  if (style) {
    L.push(`Input images: ${style.role_sentence}`);
    L.push("  Image 2 is a geometric layout diagram of the surface to be painted: it is a");
    L.push("  technical drawing, not artwork to imitate.");
  } else {
    /* AND THE REASON IS TRUE OF EVERY ROOM THIS BRANCH REACHES. Some have no
     * painted wall at all; some have four and cannot vouch for any of them —
     * `guest_chamber` is the second kind, and saying "none has been painted"
     * there would be a lie in the first sentence of the ask. */
    L.push("Input images: THERE IS NO IMAGE 1 IN THIS PACKET. No painting of any wall is given,");
    L.push("  because this room has none yet that it can vouch for, and a picture of some other");
    L.push("  room would be worse than none. Every quality of this picture — its medium, its");
    L.push("  palette, its light and its materials — is in the words below and in nothing else.");
    L.push("  Image 2 is a geometric layout diagram of the surface to be painted: it is a");
    L.push("  technical drawing, not artwork to imitate.");
  }
  L.push("  Image 2's boxed labels mark where a named feature belongs: paint that feature inside its box, filling it. The labels themselves are instructions and are never painted.");
  /* [row 38] ONE PHYSICAL LINE, like every other declared sentence in this
   * composer — the t1/t2 control counts lines, and a sentence wrapped across
   * two of them has changed the diff. */
  if (seed) L.push(`  ${seed.role_sentence}`);
  L.push(`Primary request: Paint the ${side} ${SURFACE} of the empty ${name} of a ${PACK.world.era},`);
  L.push(style
    ? "  matching Image 1's paint handling and Image 2's geometry exactly."
    : "  in the medium described below and matching Image 2's geometry exactly.");
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
    /* [row 40] AND IT IS THE SAME FABRIC AS EVERY OTHER FACING OF THIS ROOM.
     * What stood here was `voice.blank` — a SECOND material sentence, written
     * per voice and reached only by a facing that carries no carrier. In
     * `hall_state` and `great_chamber` the two disagreed in words: `walls`
     * said "dark oak wall panelling in fielded bays ... lime-plastered wall
     * head" and `blank` said "unbroken oak wainscot under a carved frieze", so
     * a blank facing of the great hall or the solar was told panelling in one
     * sentence and wainscot in another while its carrier-bearing neighbours
     * were told only panelling. That is the row-40 disease in miniature — a
     * per-FACING property deciding a per-ROOM one — and row 36's
     * MATERIAL_BINDING already binds `blank` and `walls` to one texture id, so
     * the words were the only thing dissenting. A blank facing now carries no
     * fabric vocabulary of its own at all: it points at the one
     * `Materials/textures` sentence every facing of the room shares. */
    L.push(`  This ${SURFACE} carries no opening and no built feature at all: the fabric named under`);
    L.push(`  Materials/textures below runs across the whole of it, unbroken corner to corner, and`);
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
  /* AND AN OPEN EDGE IS NOT AN OPENING IN A WALL. Counting the court's mouth
   * as a carrier would dress its south side as the house's brick elevation; it
   * is the absence of a wall, and the fabric says so. */
  for (const line of materialLines({
    voice, loc, out, openSide: !!openSide,
    built: rects.some((r) => r.kind !== "open_edge")
  })) L.push(line);
  /* ── the windows, and the heraldry ration ── */
  for (const line of windowLines(voice, windows, name, SURFACE, !!style)) L.push(line);
  /* [row 40, Kabe's ruling] AND WHERE NO PICTURE CARRIES THE MEDIUM, THE WORDS
   * DO, at the resolution a picture was carrying. This is the sentence that has
   * to stand on its own in a packet with no Image 1, so it names the paint, the
   * handling, the palette and the light rather than pointing at a photograph. */
  if (style) {
    L.push("Style/medium: as Image 1 - fine oil realism with tactile brush detail, deep warm");
    L.push("  browns, cool ambient light, gentle natural falloff.");
  } else {
    L.push("Style/medium: fine oil realism, painted alla prima on a warm ground, with tactile");
    L.push("  brush detail and visible impasto in the lit passages and thin scumbled shadow in the");
    L.push("  dark ones. The palette is deep warm browns, umber and ochre, with cool grey-green");
    L.push("  daylight; the light is soft, even and sourceless, with gentle natural falloff into");
    L.push("  the corners and no hot spot anywhere. Photographic sharpness is wrong for this: it");
    L.push("  is a painting, and the brush is visible in it.");
  }
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
/* [row 43] THE CLEAN REGISTER, AND THE ONE PATH PRODUCTION COMPOSES    */
/* ------------------------------------------------------------------ */
/* [HUMAN, 2026-08-24, verbatim, reading `master_bedchamber/N`'s production
 * prompt]: "That prompt seems like a mess too…." — and, on the same walk,
 * "Yeah but test my direction against our tests as well."
 *
 * So it was tested. `design/batches/g5-register` ran the clean order against
 * the incumbent on six walls, blind ids, one roll a cell, with the coordinate
 * appendix ablated as its own arm: admissible g4 3/5, g5 3/5, g5-noappendix
 * 4/5; camera gate g4 2/5, g5 4/5, g5-noappendix 5/5; materials correct on
 * every arm with no style image attached. Nothing separated at that n, and the
 * trial declared that before it ran. The ruling in `design/approvals.log` takes
 * the clean register WITHOUT the appendix as production, as a labelled judgment
 * in the open rather than as a crown from a number.
 *
 * ONE COMPOSITION PATH. `manorPrompt` is the only composer any emitter calls,
 * and it calls `g5Prompt` with `appendix: false`. `g4ManorPrompt` above is the
 * declared control arm and is dispatched by nothing.
 *
 * ONE CTX BUILDER, FOR THE SAME REASON THE REGISTER HAS ONE HOME. `g5CtxFor`
 * resolves every ruled fact the register needs, and `evolution-arms.mjs`'s
 * `g5Ctx` delegates to it rather than resolving them a second way — so the arm
 * that measures the register and the emitter that sends it cannot come to
 * disagree about what a room's fabric is. The one thing the arm keeps is its
 * own declared image policy, because that is the arm's declaration and not
 * production's.
 */

/** The heraldry ration, in the register's own words.
 *
 *  ONE HOME, and `prompt_lint.py` is the reason it has to be one: the ration is
 *  a gate clause (`^armorial glass:`) as well as a sentence, and a second copy
 *  of it worded differently is a packet the lint reads one way and a painter
 *  reads another. [HUMAN, 2026-08-24] "this same window everywhere? With the
 *  ensignias on it?" */
export function armorialLine(voice, roomName, surface) {
  if (voice.glass === "armorial") {
    return `Armorial glass: the ${roomName} is the one room in this house entitled to it. Set a ` +
      "small painted armorial shield in coloured glass into the head of each window and nowhere " +
      `else in the picture; every other pane-field on this ${surface} stays plain diamond quarrels.`;
  }
  if (voice.glass === "one_shield") {
    return `Armorial glass: the ${roomName} carries exactly ONE small painted armorial shield in ` +
      "coloured glass, set into the head of the first window only; every other light on this " +
      `${surface}, and every other pane-field of that same window, is plain diamond quarrels.`;
  }
  return null;
}

/**
 * Everything `g5Prompt` needs about one facing, resolved from the plan.
 *
 * NOTHING RULED IS RETYPED HERE. The fabric comes through `roomRuling` and
 * `materialParts` — the same two functions the row-40 audit compares a promoted
 * painting's spent ask against — the flight through `flightsForFacing`, which is
 * the projection `promote-backdrop.mjs`'s refusal reads, the window lights
 * through `lightsFor`, and Image 1 through `styleImageFor`, which is the
 * measure's ruling and not a taste.
 *
 * `opts.style` may be passed to override the ruling (an emitter that has already
 * attached a file, or a test); `undefined` means "ask the ruling", and `null` is
 * a real answer meaning no style image.
 */
export function g5CtxFor(plan, key, meta, rects, opts = {}) {
  const [loc, f] = key.split("/");
  const room = plan.rooms.find((r) => r.id === loc);
  const { voice, anchor } = voiceFor(plan, loc, f);
  const out = !!voice.outdoor;
  const SURFACE = out ? "side" : "wall";
  const room_name = (room.name || room.id).toLowerCase();
  const openSide = rects.find((r) => r.kind === "open_edge") || null;
  const built = rects.some((r) => r.kind !== "open_edge");
  const ruling = roomRuling(plan, loc, f);
  /* THE FABRIC. Outdoors it is `materialParts`' own answer, so the one licensed
   * per-facing difference in this house — an open side is the ABSENCE of a wall
   * and the walled sides are the house's own elevation — is decided in one
   * place. Indoors it is the room's RULING, which is `voice.walls` plus the rank
   * of a bedchamber's hangings: naming only the walls would leave the master
   * bedchamber's ask silent about the very band it fails on. */
  const fabric = out
    ? materialParts({ voice, loc, out, openSide: !!openSide, built }).walls
    : ruling.walls;
  const style = opts.style !== undefined ? opts.style : styleImageFor(plan, key);
  /* [row 38] THE STRIPS, RENUMBERED FROM THE INDEX THE LAYOUT IMAGE ACTUALLY
   * HAS. A packet with no style image puts the scaffold at Image 1 and the
   * first strip at Image 2; row 38 wrote "Image 3" because every packet then
   * carried a style seed. The cut and the file name are `edge-seed.mjs`'s and
   * are not touched here; only the sentence's number is decided, off the same
   * `scaffoldIndex` the register numbers its own references with. */
  const base = scaffoldIndex({ style }) + 1;
  const seeds = (opts.seeds || []).filter(Boolean).map((s, i) => ({
    ...s, image_index: base + i, role_sentence: roleSentence(s.side, base + i)
  }));
  /* THE CORRECTION, AND THE ONE SENTENCE THAT CANNOT BE QUOTED. `privy_garden/N`'s
   * correction is Kabe's veto, and to say what went wrong it names "interior oak
   * panelling and a chair-rail" — on the one wall those words were vetoed from.
   * Carrying it verbatim put them straight back in front of the generator and
   * `prompt_lint.py` refused the packet, correctly. An outdoor wall carries its
   * correction only where it can be said without naming interior fabric;
   * otherwise it carries the forward half and the verbatim reason goes to
   * PACKET.md and `retries.json`, where a reader needs it and no generator reads
   * it. */
  const correction = opts.correction
    ? ((out && !carryableOutdoors(opts.correction)) ? REDACTED_CORRECTION : opts.correction)
    : null;
  return {
    plan, key, loc, facing: f, meta, rects,
    world: PACK.world,                                   // [row 44] the pack's sentences
    geometry: frameGeometry(meta),
    voice, anchor, ruling,
    room_name, surface: SURFACE,
    side: { N: "north", E: "east", S: "south", W: "west" }[f],
    flights: flightsForFacing(plan, loc, f, meta, CANVAS_W),
    fabric,
    /* An open facing's ruler is the piers at the mouth, not a coping running
     * across it — [Kabe, 2026-08-24] "Entrance court s looks very weird on the
     * edges", the parapet painted across a 20 m opening. */
    anchor_sentence: openSide ? PIER_ANCHOR_SENTENCE : anchor.sentence,
    /* The open side's fabric IS its carrier sentence, ruled width and all, so
     * item 1 leaves it to item 2 rather than saying it twice. */
    fabric_in_carriers: !!(openSide && !built),
    window_lights: lightsFor,
    /* THE WINDOW'S OWN RULED DRESSING, from the one home each rule has: the
     * surround by the room's rank (`surroundFor`), the transom only on an
     * opening wide enough to need the member (`transomFor`), and the casement's
     * hinge from where each opening sits along the wall (`casementSentence`).
     * Two walls of equal bay count in different rooms must not read the same,
     * and that is what these three carry. */
    window_surround: surroundFor(voice.window_status),
    window_words: WINDOW_WORDS,
    window_sill_m: CONVENTION.window_sill_m,
    window_head_m: CONVENTION.window_head_m,
    window_transom: transomFor,
    window_casement: casementSentence(
      rects.filter((r) => r.kind === "window").map((r) => ({
        width_m: (r.x1 - r.x0) / meta.px_per_m_at_wall,
        u: (r.from_m + r.to_m) / 2 / meta.wall_width_m
      })), SURFACE),
    armorial_line: armorialLine(voice, room_name, SURFACE),
    /* [row 43(a)] WHICH SHEET THE LAYOUT IMAGE IN THIS PACKET IS DRAWN ON. The
     * register's one sentence about that image describes it, so the words and
     * the picture cannot be cut from two different decisions: an emitter that
     * attaches the grid frame says so, and everything else gets the sheet
     * production now draws. */
    scaffold_sheet: assertScaffoldStyle(opts.scaffoldStyle) || SCAFFOLD_STYLE_DEFAULT,
    style, seeds, correction,
    reask: !!opts.reask
  };
}

/**
 * ONE PRODUCTION WALL'S PROMPT, and the only composer any emitter calls.
 *
 * The signature is the one every caller already holds: `correction` is the
 * sentence `run-state.json` wrote about this wall, carried verbatim at the top
 * of the room paragraph; `seed` is row 38's strip, and `opts.seeds` is the
 * consistency path's list of them, each named by index and by role in the
 * picture paragraph. What row 43 changed is the REGISTER underneath, not what a
 * caller passes.
 */
export function manorPrompt(plan, key, meta, rects, correction, seed, opts = {}) {
  const seeds = opts.seeds !== undefined ? opts.seeds : (seed ? [seed] : []);
  return g5Prompt(g5CtxFor(plan, key, meta, rects, { ...opts, correction, seeds }),
    { appendix: false });
}

/** The register every emitted ask is composed in, named once, so a packet
 *  record and the reading of its return can be joined by it. [row 43] */
export const PRODUCTION_REGISTER = "g5-noappendix";

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
  /* [row 43(a)] WHICH SHEET THIS EMISSION DRAWS ON. `ink-on-paper-v2` by
   * default: a dark diagram is read as the picture's own look and its dark
   * boxes as holes in the wall, twice over in the ledger. `--scaffold-style
   * grid-v1` re-cuts a packet on the old sheet, which is what a comparison
   * arm needs and what a committed scaffold re-renders as. */
  const sheetStyle = assertScaffoldStyle(opts.scaffoldStyle || SCAFFOLD_STYLE_DEFAULT);
  const t_run = Date.now() / 1000;                                        // [row 33]
  const plan = JSON.parse(readFileSync(PACK.paths.plan, "utf8"));
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
  /* The previous standing order, so a skip preserves a wall's entry (below). */
  const priorEntries = {};
  if (existsSync(join(outDir, "manifest.json"))) {
    try {
      for (const pe of JSON.parse(readFileSync(join(outDir, "manifest.json"), "utf8")).entries || []) {
        if (pe && pe.key && !(pe.key in priorEntries)) priorEntries[pe.key] = pe;
      }
    } catch { /* an unreadable prior manifest preserves nothing */ }
  }
  /* [row 42] WHERE EVERY WALL'S PICTURE IS, resolved once for the whole pass —
   * promoted painting, else the candidate the sweep is working from. This is
   * what the room order, the edge seed and Image 1 all read, so a lead that
   * has landed but not been promoted is followed by all three or by none. */
  const imageOf = leadImageResolver(state, ROOT);
  const hasImage = (k) => !!imageOf(k);
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
    /* [row 44] A FIRST LOCATION HAS NO STORE YET: an absent source dir is an
     * empty one, not a crash. */
    const already = (existsSync(join(ROOT, sourceDirFor(x.key))) ? readdirSync(join(ROOT, sourceDirFor(x.key)), { withFileTypes: true }) : [])
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

  /* [hospital-3 step 3] REFUSE BEFORE THE BROWSER, BY NAME. The page boots
     from `<fixture_dir>/fixture.js`; without it the wait below times out after
     30 s saying nothing. The first third-pack run lost that half minute. */
  const fixtureJs = resolve(ROOT, PACK.paths.fixture_dir, "fixture.js");
  if (!existsSync(fixtureJs)) {
    throw new Error(`make-scaffold: ${fixtureJs} is not baked — run \`node tools/bake-fixtures.mjs --pack ${PACK.name}\` after derive-world`);
  }
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1536, height: 1200 } });
  await page.goto(pathToFileURL(join(ROOT, "index.html")).href + `?world=${PACK.world.paths.world_query}`);
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
    const framePng = await renderPng(page, fac.key, meta, "scaffold", null, sheetStyle);
    const scafPng = await renderPng(page, fac.key, meta, "scaffold", marks, sheetStyle);
    const dir = join(outDir, `${loc}-${f}`);
    mkdirSync(dir, { recursive: true });
    writePng(framePng, join(dir, "frame.png"));
    writePng(scafPng, join(dir, "scaffold.png"));
    /* [row 40, Kabe's ruling] IMAGE 1, IF THERE IS ONE. Never the study and
     * never any wall of another room: this room's own agreeing wall, or no
     * picture at all and the medium in words.
     *
     * [row 43] IT IS RESOLVED BEFORE THE STRIP because the strip's own index
     * depends on it: with no Image 1 the scaffold is Image 1 and the strip is
     * Image 2. Cutting the strip first meant numbering it against an attach
     * list that did not exist yet. */
    /* [row 42] ...and the room's LEAD is that wall wherever it has a picture,
     * promoted or still in the loop, because the lead is what the other three
     * are being painted to — so the resolver is handed in here too. */
    const style = attachStyle(plan, fac.key, dir, { imageOf });
    /* [row 38] THE SEAM SEED, cut beside the packet before the prompt is
     * composed, because the prompt only names the strip where the strip
     * exists. TWO THINGS RIDE IN AND THEY ARE DIFFERENT QUESTIONS: `imageOf` is
     * row 42's and decides WHETHER there is a strip (a lead still in the
     * measurement loop is followed); `style` is row 43's and decides what INDEX
     * the strip is given, because with no Image 1 the scaffold is Image 1. */
    const { seed, plan: seedPlan } = attachSeed(plan, fac.key, dir, { imageOf }, { style });
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
    const text = manorPrompt(plan, fac.key, meta, rects, null, seed, { style, scaffoldStyle: sheetStyle });
    writeFileSync(join(dir, "prompt.txt"), text);
    mkdirSync(join(ROOT, sourceDirFor(fac.key)), { recursive: true });
    for (const r of ids) writeFileSync(join(ROOT, r.prompt), text);
    writeFileSync(join(dir, "PACKET.md"),
      `# ${fac.key} — technique t2 (labelled scaffold)\n\n` +
      stylePacketNote(style) +
      packetNote(seed, seedPlan) +
      `${attachLine(seed, style)}\n` +
      `order, then send \`prompt.txt\` verbatim. Generate ${ids.length} images and save them to the\n` +
      `exact paths below — the measurement runs the moment a file appears at one of them.\n\n` +
      ids.map((r) => `| roll ${r.roll} | \`${r.candidate}\` |`).join("\n") +
      `\n\nThe prompt files are already on disk beside them. Do not rewrite them.\n\n` +
      `This wall: ${meta.px_per_m_at_wall.toFixed(1)} px per metre at the wall plane, ` +
      `${rects.length ? rects.map((r) => r.kind).join(" + ") : `no carrier — ${voice.blank}`}.\n` +
      `Voice: **${voice.id}** (${via}); gate anchor **${anchor.line}**, ${CHAIR_RAIL_M.toFixed(2)} m.\n` +
      `Register: **${PRODUCTION_REGISTER}** — the register this ask was composed in (tools/frame-language.mjs, row 43). Every\n` +
      `roll below is attributable to it: the reading of a return joins to this line through the roll id.\n` +
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
      /* [row 43] WHICH REGISTER THIS ASK WAS COMPOSED IN. The whole point of a
       * ruling made on a screen that separated nothing is that the next twenty
       * returns keep measuring it, and a return can only be attributed to a
       * register if the packet record says which one went out. The reading
       * documents join to this entry through the roll ids below. */
      register: PRODUCTION_REGISTER,
      scaffold_sha256: sha256File(join(dir, "scaffold.png")),
      scaffold_style: sheetStyle,
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
       * `depends_on` is the ordering — non-null while what this facing
       * CONTINUES has no picture yet, which is the wall the seat must wait for.
       * [row 42] It is no longer scoped to open locations: every room paints
       * its lead first, so an indoor entry carries one too. What did NOT
       * change is the field's meaning — a reader routing on it still reads
       * "this ask waits" and nothing else. */
      edge_seed: seed,
      seed_policy: seedPlan.policy,
      depends_on: seedPlan.depends_on,
      /* [row 42] THE ORDER THIS ENTRY STANDS IN, so a reader never has to
       * recompute it: which wall leads this room, what this facing continues
       * (the lead indoors, the ring's predecessor outdoors), and where the
       * lead's own picture is right now. `depends_on` is `continues` narrowed
       * to "and it does not exist yet". */
      lead: seedPlan.lead,
      is_lead: seedPlan.is_lead,
      continues: seedPlan.continues,
      order_position: seedPlan.order_position,
      lead_image: seedPlan.lead ? imageOf(seedPlan.lead) : null,
      style_image: style ? { file: style.file, rel: style.rel, room: style.room,
        facing: style.facing, lead: !!style.lead, source_kind: style.source_kind || null } : null,
      rolls: ids,
      retry_cap: opts.retries || 2
    });
    console.log(`  ${fac.key.padEnd(24)} ${rects.length} carrier(s)  ${ids.length} roll(s)`
      + (seedPlan.is_lead ? "  LEADS" : "")
      + (seed ? `  seed ${seed.side} <- ${seed.neighbour}` : "")
      + (seedPlan.depends_on ? `  WAITS for ${seedPlan.depends_on}` : ""));
  }
  await browser.close();

  /* [row 38, generalised at row 42] THE ORDER EVERY LOCATION IS PAINTED IN —
   * its lead, why that wall leads, and each facing's position and dependency.
   * Written whole rather than only for the facings this pass emitted, because
   * the order is a fact about the LOCATION and a seat reading it needs to see
   * the painted ones it starts from.
   *
   * ONE BLOCK, NOT TWO. `open_location_order` used to hold this for open
   * locations alone; row 42 gives every room a lead, so a second block for the
   * open ones would be the same fact written twice. */
  const roomOrders = {};
  for (const room of plan.rooms) {
    const lead = leadFacing(plan, room.id);
    roomOrders[room.id] = {
      lead: lead ? `${room.id}/${lead}` : null,
      lead_why: lead ? leadWhy(plan, room.id, lead) : "this room has no facings",
      type: isOpenLocation(plan, room.id) ? "open" : "indoor",
      shape: isOpenLocation(plan, room.id)
        ? "row 38's ring from the lead — each facing continues the one at its left edge"
        : "a star — the other three all continue the lead",
      order: roomOrder(plan, room.id, hasImage)
    };
  }
  const manifest = {
    _what_this_is: "The manor art run as ONE ORDER. Every unpainted facing, its scaffold, its packet and its return paths — dispatched at once and painted in parallel, with a per-wall retry cap, rather than drained as a queue.",
    _arrivals_are_unordered: "Every return path is unique and absolute. `measure.py --round row23` is a directory watch: it measures whatever is on disk and reports what is not, so a wall that lands late costs nothing and nothing waits for a wave to complete. THE ONE ORDERING, row 38's mechanism made the default at row 42: every location paints its LEAD wall first — the most-carried one, named in `room_order` below — and the other three carry `depends_on` until that wall's picture is on disk. A packet whose `depends_on` is set is NOT PAINTED YET; its PACKET.md says so in its first line. Once the lead has landed, its three followers go out together and the parallelism inside a room is unchanged.",
    _seams: "[HUMAN 2026-08-24] \"the side of the completed picture which is adjacent to the wall about to be developed should have that sides 10% of the picture cropped and sent as an additional reference picture, with a description that this is a reference image of what should be sitting on the left/right edge\" — every entry below whose neighbour is painted carries `edge_seed`: the strip that went out beside the layout image (`edge_seed.image_index` is which Image number it was given - the index is derived from whether an Image 1 rode, never typed [row 43]), where it was cut from, and its sha256. Open locations REQUIRE the strip; indoor ones take it opportunistically. ORDERING is no longer scoped to open locations - see `_lead_rule` and `room_order` below - and what is still scoped to them is the RING: outdoors each facing continues the one at its left edge, indoors all three continue the lead.",
    _lead_rule: "[HUMAN 2026-08-24] \"Can we paint the whole scene on wall 1 for a room, use it to influence wall 2-4\" — one facing of each room is painted first and the other three take it as Image 1 (row 40's own-room rule, extended to accept the lead's CANDIDATE) plus row 38's edge strip where it abuts. The lead is the MOST-CARRIED wall: doors, windows and fireplaces counted; ties break to the wall the room's entry door faces, then to compass order.",
    room_order: roomOrders,
    _speed_rule: "[HUMAN 2026-08-23] \"To the degree we hope to one pass parallel all assets created few turns each to full completion.\"",
    _reuse_rule: "ART IS GENERATED ONCE, PROMOTED ONCE, AND THEREAFTER READ. This worklist was derived by checking the stores - a promoted backdrop, a candidate already on disk, or a spent retry budget removes a facing from the order, each with its reason recorded below. Re-running the emitter is idempotent: it emits only what is genuinely outstanding. It is the same doctrine the content contract runs on one tier up, where a side wall is inherited from the neighbour that already exists rather than re-imagined.",
    _technique: opts.technique || "t2",
    _register: "[row 43] Every entry names the REGISTER its prompt was composed in. `g5-noappendix` is the clean register ruled production on 2026-08-25 — the room and its materials first, this wall's carriers, the picture in words with the layout image carrying the lines, the medium, nothing else, and no coordinate appendix. An entry with no `register` key predates the ruling and is `g4`, which is what the timings report's trailing rate is measured against.",
    _generated: new Date().toISOString().slice(0, 10),
    facings_in_plan: all.length,
    emitted: entries.filter((e) => !e.skipped).length,
    skipped: skipped.length,
    skipped_entries: skipped,
    /* [Kabe, "first-time success", 2026-08-30] A SKIP MUST NOT GUT THE STANDING
       ORDER. A partial re-emit used to write each skipped wall as a stub with
       no geometry — the sweep then could not SEE those walls (it skips
       `skipped` entries), their retry rolls sat unmeasured, and a probe of the
       manifest raised KeyError px_per_m_at_wall. A wall the previous manifest
       carried in full keeps its full entry; the skip and its reason live in
       `skipped_entries` above, which is the report. */
    entries: entries.concat(skipped.map((x) => {
      const prior = priorEntries[x.key];
      return prior && prior.px_per_m_at_wall != null
        ? { ...prior, promoted: x.promoted ?? prior.promoted }
        : x;
    }))
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
  /* [row 43(a)] WHICH SHEET THIS EMISSION DRAWS ON. `ink-on-paper-v2` by
   * default: a dark diagram is read as the picture's own look and its dark
   * boxes as holes in the wall, twice over in the ledger. `--scaffold-style
   * grid-v1` re-cuts a packet on the old sheet, which is what a comparison
   * arm needs and what a committed scaffold re-renders as. */
  const sheetStyle = assertScaffoldStyle(opts.scaffoldStyle || SCAFFOLD_STYLE_DEFAULT);
  const t_run = Date.now() / 1000;                                        // [row 33]
  const plan = JSON.parse(readFileSync(PACK.paths.plan, "utf8"));
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
  /* [row 42] The same resolver `--emit-manor` uses: a re-ask is a fresh
   * full-frame ask, so it takes its room's lead as Image 1 and waits for it
   * exactly as a first ask does. */
  const imageOf = leadImageResolver(state, ROOT);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1536, height: 1200 } });
  await page.goto(pathToFileURL(join(ROOT, "index.html")).href + `?world=${PACK.world.paths.world_query}`);
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
    const framePng = await renderPng(page, w.key, meta, "scaffold", null, sheetStyle);
    const scafPng = await renderPng(page, w.key, meta, "scaffold",
      { rects, chair_rail: cr, legend, flights }, sheetStyle);

    const attempt = w.attempts + 1;
    const dir = join(outDir, `${loc}-${f}`, `retry-${attempt}`);
    mkdirSync(dir, { recursive: true });
    writePng(framePng, join(dir, "frame.png"));
    writePng(scafPng, join(dir, "scaffold.png"));
    /* [row 40, Kabe's ruling] IMAGE 1, IF THERE IS ONE. Never the study and
     * never any wall of another room: this room's own agreeing wall, or no
     * picture at all and the medium in words. */
    const style = attachStyle(plan, w.key, dir, { imageOf });
    /* [row 38] A RE-ASK IS A FRESH FULL-FRAME ASK, so it seeds like one. It is
     * also where seeding lands first in practice: the corpus's unpainted walls
     * mostly have painted neighbours by now, and this is the path that carries
     * the pilot. */
    const { seed, plan: seedPlan } = attachSeed(plan, w.key, dir, { imageOf }, { style });
    timings.record("emit.facing", t_facing, Date.now() / 1000, w.key,     // [row 33]
      { carriers: rects.length, voice: voice.id, retry: attempt });

    const t_packet = Date.now() / 1000;                                   // [row 33]
    const text = manorPrompt(plan, w.key, meta, rects, w.correction, seed, { style, scaffoldStyle: sheetStyle });
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
      stylePacketNote(style) +
      packetNote(seed, seedPlan) +
      `${attachLine(seed, style)}\n` +
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
      `Register: **${PRODUCTION_REGISTER}** — the register this ask was composed in (tools/frame-language.mjs, row 43). Every\n` +
      `roll below is attributable to it: the reading of a return joins to this line through the roll id.\n` +
      `The earlier ask for this wall is still at \`../\` and is not overwritten.\n` +
      `Write only under \`backdrops/\`. Never \`src/\`, never \`design/\`.\n`);
    timings.record("emit.packet", t_packet, Date.now() / 1000, w.key,     // [row 33]
      { rolls: ids.length, roll_ids: ids.map((r) => r.id),
        prompt_chars: text.length, retry: attempt });

    emitted.push({
      key: w.key, attempt, packet: dir.slice(ROOT.length + 1),
      register: PRODUCTION_REGISTER,                                     // [row 43]
      correction: w.correction,
      voice: { id: voice.id, via, outdoor: !!voice.outdoor, anchor: anchor.id },
      px_per_m_at_wall: meta.px_per_m_at_wall,
      flights: flights.map((s) => ({
        id: s.id, direction: s.direction, climb: s.climb, treads: s.treads,
        treads_in_view: s.treads_in_view, width_m: s.width_m,
        x0: s.x0, y0: s.y0, x1: s.x1, y1: s.y1, raw_w: s.raw_w, raw_h: s.raw_h
      })),
      scaffold_sha256: sha256File(join(dir, "scaffold.png")),
      scaffold_style: sheetStyle,
      /* [row 38] The same two fields the manifest carries, for the same two
       * readers: what strip went out and at which index, and what this ask waited for.
       * [row 42] ...and the same order block, so a re-ask entry and a first-ask
       * entry are read by one rule. */
      edge_seed: seed,
      seed_policy: seedPlan.policy,
      depends_on: seedPlan.depends_on,
      lead: seedPlan.lead,
      is_lead: seedPlan.is_lead,
      continues: seedPlan.continues,
      order_position: seedPlan.order_position,
      lead_image: seedPlan.lead ? imageOf(seedPlan.lead) : null,
      style_image: style ? { file: style.file, rel: style.rel, room: style.room,
        facing: style.facing, lead: !!style.lead, source_kind: style.source_kind || null } : null,
      rolls: ids
    });
    console.log(`  ${w.key.padEnd(24)} retry-${attempt}  voice ${voice.id.padEnd(18)} ${ids.length} roll(s)`
      + (seedPlan.is_lead ? "  LEADS" : "")
      + (seed ? `  seed ${seed.side} <- ${seed.neighbour}` : "")
      + (seedPlan.depends_on ? `  WAITS for ${seedPlan.depends_on}` : ""));
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
    _register: "[row 43] Every entry names the REGISTER its prompt was composed in; an entry with no `register` key predates the 2026-08-25 ruling and is `g4`. `timings_report.py --monitor` joins each reading to its packet record through the roll id and reports the camera pass rate per register.",
    _seams: "[row 38] `edge_seed` is the completed neighbour's abutting 10 % that rode with this re-ask as an edge reference — which painting it was cut from, which side, and its sha256 — and `depends_on` is the ordering an open location's unpainted seam neighbour imposes. A re-ask is a fresh full-frame ask, so it seeds like one.",
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
/* [row 40] THE CONSISTENCY RE-ASK — `--emit-consistency`               */
/* ------------------------------------------------------------------ */
/* [HUMAN, 2026-08-24, verbatim]: "Still getting rooms with wall/ceiling
 * mismatches" — "Mismatches as in different from other walls" — and then, on
 * the same walk: "There's still not a forced consistency with the wall types
 * such as in the master bed chamber."
 *
 * FORCED is the operative word and it is what separates this path from
 * `--emit-retries`. A retry carries the sentence the promotion instrument
 * wrote about ONE wall. This carries the room's RULING: the materials
 * `tools/room-voices.mjs` binds to that room's voice, named in words, for all
 * three surfaces at once, with the instruction to paint those and nothing
 * else. The ruling does not come from the other walls — it comes from the
 * plan, through the voice table — because the other walls are exactly what is
 * in dispute. In the master bedchamber the pixel vote is two against two and
 * there is no majority to appeal to; the voice is the only authority left, and
 * production-law clause 6 is satisfied by that being where the fix lives. The
 * NEXT map, with none of this conversation in context, resolves the same
 * ruling from its own plan.
 *
 * WHAT DECIDES WHICH WALLS ARE ASKED: `room_consistency.json`, written by
 * `design/plan-draft/measured/room_consistency.py`, with no model in the loop.
 * It clusters each room's facings on the band they disagree about most and
 * names the ones outside the room's agreeing majority — or, where the room
 * splits evenly, names them all and says there is no majority.
 *
 * ONE PACKET PER OUTLIER FACING, single-return doctrine: the packet is cut,
 * the sweep handles the return, nothing here dispatches and nothing here
 * touches `run-state.json`. The packet lands in the shape the seat and the
 * sweep already read (`retries.json`, `<wall>/retry-<n>/`), because a second
 * shape would be a second thing for them to learn.
 */

/** The room's ruling materials, in words, out of the voice table. */
export function roomRuling(plan, loc, facing) {
  const { voice, anchor, via } = voiceFor(plan, loc, facing);
  /* A bedchamber's wall is TWO fabrics — wainscot below the rail, hangings
   * above it — and the rank of the hangings is the room id's own business
   * (`hangingsFor`). Naming only `voice.walls` would leave the master
   * bedchamber's ruling silent about the very band it fails on. */
  const hangings = voice.hangings ? hangingsFor(loc) : null;
  return {
    voice, anchor, via, hangings,
    walls: hangings ? `${voice.walls}, those hangings being ${hangings}` : voice.walls,
    ceiling: voice.ceiling, floor: voice.floor
  };
}

/** The one-line correction the prompt carries and the packet quotes. */
export function consistencySentence(ruling, room, band, measured) {
  const surfaces = [`every wall is ${ruling.walls}`]
    .concat(ruling.ceiling ? [`every ceiling is ${ruling.ceiling}`] : [])
    .concat(ruling.floor ? [`every floor is ${ruling.floor}`] : []);
  return `This room is ruled to ONE set of materials and this facing does not show them. ` +
    `In ${room.name || room.id}, ${surfaces.join("; ")}. Paint exactly those materials on ` +
    `every surface in this view and nothing else — not a different wall lining, not a ` +
    `different ceiling, not a different floor. ${measured}`;
}

/* ------------------------------------------------------------------ */
/* [row 40 — the ORIGIN] THE MATERIAL-PROVENANCE AUDIT                  */
/* ------------------------------------------------------------------ */
/* [HUMAN, 2026-08-24, verbatim] "Make sure we're not just fixing it. We need
 * to hunt down the cause, determine its origin and bake in the consistent
 * solution."
 *
 * `room_consistency.py` measures PIXELS and needs a promoted painting of each
 * facing before it can say anything. This measures the ASK, and it needs
 * neither pixels nor a model. For every promoted facing it recovers the exact
 * prompt its promoted candidate was painted from — the sidecar every roll
 * writes beside its image — and asks two questions the pixel measure cannot:
 *
 *   1. does this painting's ask carry the material sentences the CURRENT
 *      composer would write for this room?  A `no` means the store holds a
 *      painting made under a superseded voice, which is the exact way the
 *      five mismatched rooms came to be.
 *   2. do all the promoted facings of one room share ONE material ask?  A `no`
 *      is a room that was literally commissioned as two rooms.
 *
 * IT IS STRICTLY STRONGER THAN THE PIXEL MEASURE ON ITS OWN GROUND. It names
 * every room the pixel measure flagged, and it also names `stair_landing` —
 * the miss row 40 logged OPEN because its two ceilings differ almost purely in
 * brightness, the one axis the pixel sweep proved must not vote. In the asks
 * there is nothing subtle about it: N was asked for "a plain lime-plastered
 * ceiling" and E for a "boarded ceiling". A measurement that reads the
 * instruction cannot be fooled by exposure.
 *
 * AND IT IS THE OBSERVER THAT DID NOT EXIST. The emitter is idempotent by
 * existence — a promoted backdrop removes its facing from the order — so a
 * correction to the voice table can never reach a wall that is already
 * painted. Nothing was watching for that. This is.
 */
/* THE COMPARISON IS OF MATERIALS, NOT OF PROSE. The composer's wording moved
 * three times while the manor was being painted — "Materials and period
 * detail:" became "Materials/textures:" at row 34, and the flat comma list
 * became three sentences at row 29 — and none of that is a different room.
 * `library` is the case that proves the point: N carries "Overhead: an aged
 * parchment-toned plaster ceiling" and E/W carry "aged parchment-toned plaster
 * ceiling" inside a comma list. Same ceiling. A gate that cut a re-ask packet
 * for that would spend a model call on an article, so leading articles,
 * punctuation and case are normalised away and what is compared is the
 * material phrase itself. */
export const normMaterial = (s) => String(s || "")
  .toLowerCase()
  .replace(/\b(materials\/textures|materials and period detail|materials|overhead|underfoot|hangings)\s*:/g, " ")
  .replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
  .replace(/\b(?:a|an|the)\s+/g, " ")
  .replace(/[.,;:]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

/* ------------------------------------------------------------------ */
/* VOUCHING FOLLOWS THE MATERIAL, NOT THE WORDING                       */
/* ------------------------------------------------------------------ */
/* THE RULE, and it lives here alone. Everything downstream — the audit's per
 * facing `class`, `--audit-materials`' table, the default re-ask set, and the
 * `styleImageFor` condition that decides whether a room may show a painter one
 * of its own walls — reads this and states nothing of its own.
 *
 *   A promoted wall is VOUCHED when the MATERIALS its ask resolved to are the
 *   materials this room's voice resolves to now. It stays vouched when the
 *   words moved and the materials did not.
 *
 * FOUR CLASSES, per facing, exclusive and in this order:
 *
 *   current         the ask states this room's ruling sentences verbatim.
 *   refined         every sentence it does not state verbatim resolves to the
 *                   SAME material id the ruling resolves to. Same fabric,
 *                   better words.                                  VOUCHED.
 *   split-ask       its materials are not the ruling's, and its room holds
 *                   more than one set of ask materials — row 40's "painted as
 *                   two rooms".
 *   stale-material  its materials are not the ruling's, and the whole room was
 *                   commissioned the same wrong way.
 *
 * `current` and `refined` are vouched; the other two are not, and they are what
 * `--emit-consistency --from-ask` re-asks by default.
 *
 * WHY, AND IT IS A MISS THIS COST US ONCE. On 2026-08-25 the Navigator refined
 * ONE voice string — the servants' hall floor gained its bond, "…in straight
 * courses… no square pavers", after Kabe saw one wall lay its bricks as squares
 * — and the audit, which compares SENTENCES, called every wall of the room
 * asked before the ruling. All three were sealed legacy, so the room had no
 * wall it could vouch for, so `styleImageFor` attached no Image 1 to any of its
 * re-asks — including for walls painted that same day in exactly the material
 * the voice rules. A refinement of wording was being spent as a change of
 * material: the room lost its own fabric as the reference for its own walls,
 * and the words that were meant to make the floor MORE consistent made the room
 * less able to be consistent.
 *
 * The cure is not a looser comparison — a looser comparison is how "plain oak
 * wainscot below limewashed plaster" (the cross passage) would come to vouch
 * for the long gallery, which says the same words and then adds a cornice. The
 * cure is to compare the one thing that is not prose: the material id. Where
 * the words moved, `room-voices.mjs`'s `SAID_BEFORE` is where the move is
 * DECLARED, in the commit that made it, and an undeclared move reads as a
 * material change — unvouched and re-asked, which is the safe direction.
 *
 * PRODUCTION LAW CLAUSE 6, which is the test this had to pass: "does the NEXT
 * map, with none of this conversation in context, get this for free?" It does.
 * Nothing here knows the servants' hall exists. A future map refines a phrase,
 * declares the retired wording beside its material, and its already-painted
 * walls go on vouching for their rooms — no per-run paragraph, no hand-edited
 * ledger entry, no seat remembering why the brick floor is special. */

const REASK_CLASSES = new Set(["split-ask", "stale-material"]);
/** Vouched: `styleImageFor` may attach this wall, and the repair route may seed
 *  from it. The one home for that question. */
export const isVouched = (cls) => cls === "current" || cls === "refined";

let _phraseIdx = null;
/** The registry, normalised once and bucketed by material part, longest phrase
 *  first — because a longer declared wording that is present is always the more
 *  specific reading of the same text (`light-toned oak wainscot to chair height
 *  below limewashed plaster` contains `oak wainscot to chair height below
 *  limewashed plaster`, and the garden parlour is not the great stair). */
function phraseIndex() {
  if (_phraseIdx) return _phraseIdx;
  const byPart = new Map();
  for (const p of declaredMaterialPhrases()) {
    const norm = normMaterial(p.phrase);
    if (!norm) continue;
    if (!byPart.has(p.part)) byPart.set(p.part, []);
    byPart.get(p.part).push({ ...p, norm });
  }
  for (const list of byPart.values()) list.sort((a, b) => b.norm.length - a.norm.length);
  _phraseIdx = byPart;
  return _phraseIdx;
}

/**
 * Which material a piece of ask text names for one material part, or null.
 *
 * NULL IS AN ANSWER AND NOT A FAILURE: it means no wording anybody has declared
 * for that part is anywhere in this text, which is exactly what a wall
 * commissioned from a vocabulary this plan no longer holds looks like
 * (`great_hall`'s "broad flagstone floor", `privy_garden`'s "weathered ashlar
 * and brick"). Two nulls never compare equal downstream — two unreadable asks
 * are not evidence that a room was commissioned once.
 */
export function materialNamedIn(text, part) {
  const list = phraseIndex().get(part);
  if (!list) return null;
  const flat = normMaterial(text);
  if (!flat) return null;
  for (const p of list) if (flat.includes(p.norm)) return p.id;
  return null;
}

/**
 * The materials an ask and a ruling each resolve to, and the class that follows.
 *
 * `missing` is the verbatim comparison the audit and the promotion gate already
 * run — the parts whose ruling sentence is not in the ask. Only those parts are
 * asked the material question, because a part the ask states word for word has
 * already answered it. That keeps this strictly weaker than the verbatim test
 * nowhere and strictly stronger nowhere except on the one axis it exists for.
 */
export function classifyAsk(askText, want, missing, askKey) {
  const ask_materials = {}, ruling_materials = {};
  for (const [part, v] of Object.entries(want)) {
    ruling_materials[part] = v ? materialNamedIn(v, part) : null;
    ask_materials[part] = v ? materialNamedIn(askText, part) : null;
  }
  /* A RULING SENTENCE THAT RESOLVES TO NO DECLARED MATERIAL cannot vouch for
     anything, and it must not: `OPEN_SIDE_FABRIC` is the absence of a wall said
     as a fabric and is bound to no texture. Such a part falls back to the
     verbatim test, which is where it already was. */
  const refined = missing.length > 0 && missing.every((k) =>
    ruling_materials[k] && ask_materials[k] === ruling_materials[k]);
  return {
    ask_materials, ruling_materials,
    /* `wrong` is provisional: only the room can say whether a wall that is not
       the ruling is a split or a whole room superseded. */
    class: missing.length === 0 ? "current" : refined ? "refined" : "wrong",
    /* THE COMMISSION, in materials. A part the plan rules NOTHING for on this
       facing — a bedchamber's hangings in a kitchen, a ceiling out of doors —
       is not in the fingerprint at all: it is not a fabric this room was or was
       not asked for, and keying it as unreadable would split every room whose
       voice happens to leave a slot empty. */
    ask_material_key: askMaterialKey(askKey, want, ask_materials)
  };
}

/** The fingerprint a room's facings are compared on, in MATERIALS rather than
 *  in prose — so a room whose facings were asked the same fabric in two
 *  wordings is ONE commission, which is the whole of this rule.
 *
 *  A PART THIS CANNOT READ FALLS BACK TO THE PROSE FINGERPRINT and never to a
 *  shared "(none)": row 40's own rule, unchanged. Two facings whose asks are
 *  illegible in the same words were plainly commissioned together (`solar`'s
 *  four); two illegible in DIFFERENT words are two asks until someone can show
 *  otherwise (`study`'s N and W). */
const askMaterialKey = (askKey, want, m) => JSON.stringify(Object.keys(m).sort()
  .filter((k) => want[k])
  .map((k) => [k, m[k] || `(unreadable, asked as: ${askKey})`]));

export function materialProvenance(plan, opts = {}) {
  const root = opts.root || ROOT;
  const statePath = opts.runState ||
    join(root, ...PACK.world.paths.batch_dir.split("/"), "run-state.json");
  const walls = existsSync(statePath)
    ? (JSON.parse(readFileSync(statePath, "utf8")).walls || {}) : {};

  const rooms = [];
  for (const room of plan.rooms || []) {
    const facings = [];
    for (const f of Object.keys(room.facings || {})) {
      const key = `${room.id}/${f}`;
      const metaPath = join(root, "backdrops", room.id, `${f}.meta.json`);
      if (!existsSync(metaPath)) continue;                       // not promoted
      const meta = JSON.parse(readFileSync(metaPath, "utf8"));
      /* WHICH CANDIDATE IS IN THE STORE, AND THE META IS THE ONE THAT KNOWS.
       * This used to prefer `run-state.json` on the stated ground that the
       * loop's record and the promotion's `camera_id` "agree where both
       * exist". They do not, on eight of the sixty-one promoted walls, and
       * they cannot: run-state names the ROLL the loop dispatched, while a
       * wall that went through row 27's door-void painter or row 35's snap is
       * promoted from a DERIVED frame - `backdrops/source-doors/<wall>/
       * doored.png`, `backdrops/source-snapped/<wall>/snapped.png` - and it is
       * that frame `backdrops/<loc>/<F>.png` is a byte copy of. Two costs, both
       * paid: `material_legacy.json` was sealed with the roll's path while
       * `promote-backdrop.mjs` compares the ledger against the candidate it is
       * actually handed, so the ledger admitted none of those eight and the
       * row-40 clause refused `great_hall/N` - a wall the ledger exists to
       * admit; and where a snap was rectified from a roll other than the one
       * run-state last recorded (`back_stair/W`, `back_stair_head/S`) the audit
       * read a different ask than the gate did, which is the exact drift the
       * `askTextFor` note below exists to prevent. The promotion's own record
       * governs; run-state is the fallback for a meta that names no camera. */
      const cand = String(meta.camera_id || "").replace(/^measured:/, "") ||
        (walls[key] && walls[key].candidate) || null;
      const { voice } = voiceFor(plan, room.id, f);
      const derived = deriveMeta(plan, room.id, f);
      const { rects } = scaffoldRects(plan, room.id, f, derived);
      const want = rulingSentences({
        voice, loc: room.id, out: !!voice.outdoor,
        openSide: rects.some((r) => r.kind === "open_edge"),
        built: rects.some((r) => r.kind !== "open_edge")
      });
      const rec = { facing: f, voice: voice.id, candidate: cand || null, ruling: want };
      /* THE ASK IS RESOLVED THE WAY THE PROMOTION RESOLVES IT, through
       * `askTextFor`, so a row-35 SNAPPED candidate is read through the roll
       * it was rectified from rather than counted as unrecoverable. Two
       * readers of the same file with two rules is how a gate and its audit
       * come to disagree about the same wall. */
      const measured = meta.measured_round
        ? join(root, "design", "plan-draft", "measured", meta.measured_round, `${room.id}-${f}.json`)
        : join(root, "design", "plan-draft", "measured", `${room.id}-${f}.json`);
      const mm = existsSync(measured) ? JSON.parse(readFileSync(measured, "utf8")) : null;
      const ask = cand ? askTextFor(root, cand, mm, join) : { text: null, path: null, via: null };
      if (!ask.text) {
        /* REPORTED, NEVER SKIPPED — production law leaves no gate that cannot
         * fail. A painting in the store whose ask cannot be recovered is not a
         * pass; it is a wall nobody can prove was asked for this room. */
        rec.verdict = "unrecoverable";
        /* NOT VOUCHED, AND RE-ASKED. A wall nobody can prove was asked for this
         * room cannot be shown to the next painter as a picture of it. */
        rec.class = "stale-material";
        rec.ask_materials = null;
        rec.ruling_materials = null;
        rec.why = cand
          ? `the ask this candidate was painted from is not on disk: no ${ask.path}, and the ` +
            `measurement names no roll it was rectified from`
          : "neither run-state.json nor the promoted meta names the candidate this was painted from";
        rec.asked = null;
        facings.push(rec);
        continue;
      }
      const text = ask.text;
      rec.ask_path = ask.path;
      rec.ask_via = ask.via;
      const flat = normMaterial(text);
      const missing = [];
      for (const [k, v] of Object.entries(want)) {
        if (!v) continue;
        if (!flat.includes(normMaterial(v))) missing.push(k);
      }
      rec.missing = missing;
      rec.verdict = missing.length ? "stale" : "current";
      /* THE ASK'S OWN FINGERPRINT, so two facings can be compared on what they
       * were told rather than on whether they match today. A room whose
       * facings were all asked the same superseded thing is at least ONE room;
       * a room whose facings were asked different things is two. */
      const said = [];
      for (const line of text.split("\n")) {
        const t = line.trim();
        /* THE HEADINGS THE MANOR'S ASKS HAVE ACTUALLY USED, which is more than
         * the composer writes today: `study/W` was hand-written before the
         * manor composer existed and states its fabric under "Style and
         * materials:". A heading this list does not know is not a wall with no
         * materials — it is a wall this fingerprint cannot read, and the two
         * are recorded differently below. */
        if (/^(Materials\b|Materials\/textures:|Style and materials:|Overhead:|Underfoot:|Hangings:)/.test(t)) {
          /* THE LABELS ARE STRIPPED, because the composer renamed them twice
           * while the manor was being painted ("Materials and period detail:"
           * became "Materials/textures:" at row 34; the flat comma list became
           * three labelled sentences at row 29) and a renamed label is not a
           * different room. What is compared is the material words. */
          said.push(t.replace(/^(Materials(\/textures| and period detail)?|Style and materials|Overhead|Underfoot|Hangings):/, "").trim());
        }
      }
      rec.asked = said.join(" ");
      /* AND AN ASK WHOSE MATERIALS THIS CANNOT FIND NEVER COMPARES EQUAL TO
       * ANOTHER ONE. Two unreadable asks are not evidence that a room was
       * commissioned once; keying them both to a shared "(none)" would make a
       * room of two illegible facings read as one ask and pass. */
      rec.ask_key = normMaterial(said.join(" ")) ||
        `(no material sentence this audit can read, in ${ask.path})`;
      /* AND THE SAME ASK READ AS MATERIALS. See "VOUCHING FOLLOWS THE MATERIAL,
       * NOT THE WORDING" above: `verdict` answers "does it say what we say
       * today", `class` answers "was it painted in the material we rule today",
       * and only the second decides whether this wall may stand as a picture of
       * its own room. */
      const cls = classifyAsk(text, want, missing, rec.ask_key);
      rec.ask_materials = cls.ask_materials;
      rec.ruling_materials = cls.ruling_materials;
      rec.class = cls.class;
      rec.ask_material_key = cls.ask_material_key;
      facings.push(rec);
    }
    if (!facings.length) continue;
    /* AN UNRECOVERABLE ASK IS NOT A SECOND ASK. It is an unanswerable
     * question, and counting it as a split would cut a re-ask packet for a
     * wall that may be perfectly correct. It gets its own verdict and its own
     * line, because production law leaves no gate that cannot fail. */
    const known = facings.filter((x) => x.verdict !== "unrecoverable");
    /* COMPARED ON MATERIALS, NOT ON PROSE. The room is one room if its facings
     * were commissioned in one set of fabrics, however the asks worded them. */
    const asks = new Set(known.map((x) => x.ask_material_key));
    const stale = known.filter((x) => x.verdict !== "current");
    const unprovable = facings.filter((x) => x.verdict === "unrecoverable");
    /* THE ROOM DECIDES WHICH KIND OF WRONG A WRONG FACING IS, because that is
     * the one part of the class only the room can see: the same wrong material
     * on every wall is a room superseded, and a wall out of step with its
     * siblings is the room painted as two rooms. */
    const split = asks.size > 1;
    for (const x of facings) if (x.class === "wrong") x.class = split ? "split-ask" : "stale-material";
    const refined = facings.filter((x) => x.class === "refined");
    const wrong = known.filter((x) => REASK_CLASSES.has(x.class));
    rooms.push({
      room: room.id,
      facings,
      distinct_asks: asks.size,
      /* A ROOM COMMISSIONED AS TWO ROOMS. This is the finding Kabe walked into. */
      split,
      stale: stale.map((x) => x.facing),
      /* THE WALLS THE WORDS MOVED UNDER AND THE MATERIAL DID NOT. Vouched, and
       * re-asked only when the Navigator wants the words forced
       * (`--emit-consistency --from-ask --refined-too`). */
      refined: refined.map((x) => x.facing),
      unprovable: unprovable.map((x) => x.facing),
      verdict: split ? "split-ask"
        : wrong.length ? "one-ask-superseded"
        : unprovable.length ? "unprovable"
        : refined.length ? "refined"
        : "current"
    });
  }
  return {
    instrument: "tools/make-scaffold.mjs materialProvenance()",
    what: "the material sentences every promoted painting was actually asked for, " +
      "against the sentences this composer writes today — and, where those differ, " +
      "the MATERIALS each resolves to, which is what decides whether the wall is vouched " +
      "(see `VOUCHING FOLLOWS THE MATERIAL, NOT THE WORDING` in the instrument)",
    promoted_facings: rooms.reduce((n, r) => n + r.facings.length, 0),
    split_rooms: rooms.filter((r) => r.split).map((r) => r.room),
    superseded_rooms: rooms.filter((r) => r.verdict === "one-ask-superseded").map((r) => r.room),
    refined_rooms: rooms.filter((r) => r.verdict === "refined").map((r) => r.room),
    vouched_facings: rooms.reduce((n, r) => n + r.facings.filter((f) => isVouched(f.class)).length, 0),
    unrecoverable: rooms.flatMap((r) =>
      r.facings.filter((f) => f.verdict === "unrecoverable").map((f) => `${r.room}/${f.facing}`)),
    rooms
  };
}

/* ------------------------------------------------------------------ */
/* [row 40] IMAGE 1 IS NEVER A WALL FROM ANOTHER ROOM                   */
/* ------------------------------------------------------------------ */
/* [HUMAN, 2026-08-24, verbatim] "So why do we give it the reference image of
 * the study? I think it biases it too much. I mean I know why that window with
 * the botched insignias is every window generated for example."
 *
 * He is right, and the store says so twice.
 *
 *   `privy_garden/N`, roll `row23-1b134204`. Its ask reads, in full,
 *   "Materials and period detail: weathered ashlar and brick, open sky above,
 *   packed earth and stone paving underfoot." It names no wood at all. The
 *   painting has dark oak FIELDED WAINSCOT running round an outdoor garden
 *   under open sky. Image 1 is the only place in that packet where fielded oak
 *   panelling exists, so it is where the panelling came from. That picture is
 *   what Kabe vetoed as "exterior garden has interior wall outside".
 *
 *   The glass, counted rather than asserted: of the 19 promoted facings the
 *   plan gives a window and whose voice rules PLAIN glass, SEVEN carry
 *   saturated daylight-bright coloured glass their ask never asked for. The
 *   control is what makes it evidence — `great_hall`, the one room this
 *   project's own heraldry ration allows arms in quantity, scores 71 px and
 *   20 px, LESS than nine of the rooms forbidden them. The shields went
 *   everywhere except the room entitled to them.
 *
 * STATED HONESTLY, because it bounds the claim: all seven of those walls were
 * painted from asks that predate row 29 and carry no plain-glass refusal at
 * all, so the store cannot tell us whether words alone would have beaten the
 * seed. That experiment has never been run. This ruling removes the need to
 * run it.
 *
 * AND IT IS NOT THE ORIGIN OF THE FIVE MISMATCHED ROOMS. Those split exactly
 * on the archetype/voice date, facing for facing, and wherever an ask named a
 * fabric far from the seed's the PAINTING FOLLOWED THE ASK — servants_hall S/W
 * came back limewash over brick under exposed joists, garden_room N/E light
 * wainscot over paviours, master_bedchamber N/S tapestry hangings,
 * guest_chamber/S a red worsted hanging, which is as far from a panelled study
 * as this house goes. Two different diseases, two different causes, and the
 * seed owns the second one.
 *
 * SO THE RULING, ruled by Kabe and folded in here: Image 1 is NEVER a wall
 * from another room. Where the room has an agreeing painted majority it is
 * that room's OWN wall, and it references this room's materials, medium and
 * light and nothing else — geometry comes from Image 2. Where the room has no
 * majority to trust, NO style image is attached at all and the medium is
 * carried in words. A packet that cannot show a wall of this room shows none.
 *
 * TWO CONDITIONS, and the second is row 40's own. The pixel measure must put
 * the wall inside the room's agreeing majority, AND the ask audit must say
 * that wall's own ask was this room's ruling — because a majority wall painted
 * from the wrong ask would hand the next roll the wrong material with a
 * photograph behind it. `guest_chamber` is why: its pixel majority is the
 * three facings that are wrong. */
/** Put this facing's Image 1 into its packet, or put none there and say so.
 *  Returns what `manorPrompt` must be told, so the picture in the packet and
 *  the sentence beside it can never disagree about what Image 1 is. */
export function attachStyle(plan, key, dir, opts = {}) {
  const style = styleImageFor(plan, key, opts);
  if (!style) return null;
  /* WHAT IS COPIED IS THE DERIVED SEED AND NEVER THE WALL ITSELF [2026-08-25].
   * `styleImageFor` names the wall; `deriveStyleSeed` cuts the picture of it a
   * packet may hold — every opening and carrier filled in with that wall's own
   * adjacent fabric, its floor and its ceiling untouched — and the seed is only
   * written where `door_measure` and `window_measure` read nothing at all in it.
   *
   * A WALL WHOSE ARCHITECTURE CANNOT BE REMOVED GETS NO IMAGE 1, and that is the
   * right answer rather than a shortfall: row 40's own fallback is a packet with
   * no style image and the medium in words, and it is still the common case. The
   * reason is printed, because a seat reading the packet would otherwise wonder
   * why a room with four painted walls shows none of them. */
  const root = opts.root || ROOT;
  if (style.same_wall) {
    /* The SAME-WALL reference rides RAW - its content is the point; filling
       its openings would erase the very identity the ask asserts. */
    copyFileSync(join(root, style.rel), join(dir, style.file));
    return { ...style, derived: false };
  }
  const seed = deriveStyleSeed(plan, `${style.room}/${style.facing}`, {
    root, rel: style.rel, source_kind: style.source_kind, metaFromReading
  });
  if (!seed.ok) {
    console.error(`make-scaffold: ${key} gets NO Image 1 — ${style.room}/${style.facing} ` +
      `cannot be cut into a style seed: ${seed.why}`);
    return null;
  }
  /* NAMED FOR THE ROOM IT IS OF, because that is the one fact a seat holding the
   * packet needs from the filename: this is a picture of THIS room. */
  const file = style.file;
  const reportFile = file.replace(/\.png$/, ".json");
  copyFileSync(join(root, seed.png), join(dir, file));
  copyFileSync(join(root, seed.report), join(dir, reportFile));
  const rec = seed.record || {};
  return {
    ...style, file, report_file: reportFile,
    derived: true,
    derived_by: "tools/style-seed.mjs + tools/style-seed.py",
    derived_from: style.rel,
    derived_store: seed.png,
    source_sha256: rec.source_sha256 || null,
    sha256: rec.sha256 || null,
    filled_rects: (rec.rects || []).length,
    filled_pct_of_wall: rec.masked_pct_of_wall ?? null,
    verified: rec.verified || null
  };
}

const _provByRoot = new Map();
function provenanceCache(plan, root) {
  if (!_provByRoot.has(root)) _provByRoot.set(root, materialProvenance(plan, { root }));
  return _provByRoot.get(root);
}

/* ------------------------------------------------------------------ */
/* [row 42] AND THE ROOM'S LEAD IS IMAGE 1 WHERE IT HAS A PICTURE       */
/* ------------------------------------------------------------------ */
/* Row 40's rule stands whole: Image 1 is never another room's wall, and it is
 * only a wall of THIS room that the pixel measure puts inside the agreeing
 * majority AND whose own ask was this room's ruling. Row 42 adds one wall to
 * the set that can satisfy it — the room's LEAD, painted first precisely so
 * that the other three can be painted with it in front of the painter — and it
 * adds it under the SAME two conditions read one step earlier:
 *
 *   the pixel measure   has nothing to say about an unpromoted lead, and NO
 *                       MEASUREMENT IS NOT A MAJORITY — but it is also not a
 *                       minority, and the wall it would be voting on is one
 *                       this emitter cut the ask for itself.
 *   the ask audit       is the condition that actually carries row 40, and it
 *                       is checkable on a candidate exactly as it is on a
 *                       promotion: the prompt sits beside the roll. A lead
 *                       whose own ask does not name this room's ruling
 *                       materials is REFUSED as Image 1, which is the whole
 *                       point of row 40's second condition and the reason
 *                       `guest_chamber`'s pixel majority is the wrong half.
 *
 * So an unpromoted lead is admitted on its ask and on nothing else, and it says
 * so in the packet: a seat reading "this room's own lead wall, not yet
 * promoted" knows what it is holding. A promoted lead goes through row 40's
 * original path unchanged, and simply wins the tie against its siblings —
 * because the lead is the wall the room is being painted to. */
function leadAskIsRuling(plan, loc, f, root, candidateRel) {
  const { voice } = voiceFor(plan, loc, f);
  const derived = deriveMeta(plan, loc, f);
  const { rects } = scaffoldRects(plan, loc, f, derived);
  const want = rulingSentences({
    voice, loc, out: !!voice.outdoor,
    openSide: rects.some((r) => r.kind === "open_edge"),
    built: rects.some((r) => r.kind !== "open_edge")
  });
  const ask = askTextFor(root, candidateRel, null, join);
  if (!ask.text) return { ok: false, why: `no ask is on disk beside ${candidateRel}` };
  const flat = normMaterial(ask.text);
  const missing = Object.entries(want)
    .filter(([, v]) => v && !flat.includes(normMaterial(v)))
    .map(([k]) => k);
  /* READ AS MATERIALS, exactly as the promoted path is — same rule, one step
   * earlier. A lead asked for this room's fabric in the wording that was live
   * the day it was rolled leads the room just as well as one asked in today's;
   * a lead asked for a DIFFERENT fabric is refused, which is the whole of row
   * 40's second condition. See "VOUCHING FOLLOWS THE MATERIAL, NOT THE
   * WORDING". */
  const cls = classifyAsk(ask.text, want, missing, "lead");
  if (isVouched(cls.class)) {
    return { ok: true, ask_path: ask.path, class: cls.class,
      refined: cls.class === "refined" };
  }
  return { ok: false,
    why: `its own ask never named this room's ${missing.join(" or ")}, and what it did name ` +
      `is a different material` };
}


/* [Kabe, 2026-08-30] THE LONG ROOM'S DEEP VIEW IS THE SAME WALL, SAID SO. Two
 * independent asks painted one wall twice and the details disagreed (the disc
 * grew a face, one lamp became three). The deep facing's ask now carries the
 * CLOSE painting itself as Image 1 with an identity sentence and the camera
 * move in metres: "based off that picture, X m further back" — Kabe's own
 * wording. The close painting must be PROMOTED first (a seed must pass the
 * instrument before it may teach). */
export function deepViewOf(plan, key) {
  const [loc, F] = key.split("/");
  const room = (plan.rooms || []).find((r) => r.id === loc);
  const fc = room && room.facings && room.facings[F];
  if (!room || !fc || fc.wall_line == null) return null;
  const ax = (F === "N" || F === "S") ? "y" : "x";
  const ownEdge = F === "N" ? room.rect.y1 : F === "S" ? room.rect.y0
    : F === "E" ? room.rect.x1 : room.rect.x0;
  if (Math.abs(fc.wall_line - ownEdge) < 1e-6) return null;
  let cell = room, line = ownEdge, hops = 0;
  while (hops++ < 8) {
    const oe = (plan.openings || []).find((o) =>
      o.kind === "open_edge" && o.floor === cell.floor && o.rect &&
      (o.joins || []).includes(cell.id) &&
      Math.abs(o.rect[ax + "0"] - line) < 1e-6 && Math.abs(o.rect[ax + "1"] - line) < 1e-6);
    if (!oe) return null;
    const next = (plan.rooms || []).find((r) => r.id === (oe.joins || []).find((j) => j !== cell.id));
    if (!next) return null;
    cell = next;
    line = F === "N" ? cell.rect.y1 : F === "S" ? cell.rect.y0
      : F === "E" ? cell.rect.x1 : cell.rect.x0;
    if (Math.abs(line - fc.wall_line) < 1e-6) {
      const cfc = cell.facings && cell.facings[F];
      if (!cfc) return null;
      return { close_key: `${cell.id}/${F}`, close_cam: cfc.camera_wall_m,
               deep_cam: fc.camera_wall_m, back_m: fc.camera_wall_m - cfc.camera_wall_m };
    }
  }
  return null;
}

export function sameWallImageFor(plan, key, opts = {}) {
  const root = opts.root || ROOT;
  const dv = deepViewOf(plan, key);
  if (!dv) return null;
  const [cLoc, cF] = dv.close_key.split("/");
  const png = join(root, "backdrops", cLoc, `${cF}.png`);
  const metaFile = join(root, "backdrops", cLoc, `${cF}.meta.json`);
  if (!existsSync(png) || !existsSync(metaFile)) return null;   // waits: the close view teaches only once promoted
  const meta = JSON.parse(readFileSync(metaFile, "utf8"));
  const frac = (meta.wall_width_m * groundplane.FOCAL_PX / dv.deep_cam) / CANVAS_W;
  const fracWord = frac > 0.55 ? "over half" : frac > 0.42 ? "about half" : frac > 0.3 ? "about a third" : "about a quarter";
  return {
    rel: relative(root, png), file: `same-wall-${cLoc}-${cF}.png`, room: cLoc, facing: cF,
    same_wall: true, source_kind: "promoted-same-wall", lead: false,
    facing_word: { N: "north", E: "east", S: "south", W: "west" }[cF],
    why: `${dv.close_key} is THIS SAME WALL promoted at ${dv.close_cam} m; this facing views it from ${dv.deep_cam} m`,
    role_sentence:
      `Image 1 IS THIS VERY WALL AND THIS VERY ROOM, photographed from ${dv.close_cam.toFixed(1)} m away. ` +
      `This picture is based directly on Image 1: paint the identical wall with everything on it - every ` +
      `fixture, lamp, disc, mark and line exactly as Image 1 shows them, nothing added and nothing removed - ` +
      `but from ${dv.back_m.toFixed(1)} m further back, so the camera now stands ${dv.deep_cam.toFixed(1)} m ` +
      `from that wall. At this distance the wall spans ${fracWord} of the picture's width, and the room's own ` +
      `side walls, ceiling and floor - the same surfaces visible at the edges of Image 1 - continue toward ` +
      `you and fill the rest of the frame. Change the camera distance and nothing else.`
  };
}

export function styleImageFor(plan, key, opts = {}) {
  /* [Kabe, 2026-08-30] A DEEP FACING'S IMAGE 1 IS THE SAME WALL, PROMOTED —
     decided here, the one home every caller reads. */
  const sw = sameWallImageFor(plan, key, opts);
  if (sw) return sw;
  const root = opts.root || ROOT;
  const [loc, f] = key.split("/");
  const name0 = ((plan.rooms || []).find((r) => r.id === loc) || {}).name || loc;
  const say = (pick, rel, why, extra) => ({
    /* [2026-08-25] NAMED FOR THE ROOM, because the file in the packet is no
     * longer the wall — it is the seed derived from it, and `style-reference`
     * described a picture that no longer exists. One name, decided here, so the
     * prompt, the attach line and the file on disk cannot disagree. */
    rel, file: `style-${loc}.png`, room: loc, facing: pick, why, ...extra,
    /* [row 43] THE COMPASS WORD, because the register names Image 1 in words a
     * painter uses ("the north wall of this same room") rather than by a
     * letter. It rides on BOTH answers this function can give — the promoted
     * wall and row 42's lead candidate — because the register does not know
     * which one it was handed. */
    facing_word: { N: "north", E: "east", S: "south", W: "west" }[pick],
    /* [2026-08-25] AND IT SAYS WHAT THE PICTURE IS, which is not the wall. The
     * old sentence described a painting of another wall and then spent its
     * second half telling the painter not to take the architecture out of it —
     * and `servants_hall/E` took it anyway. What rides now is a DERIVED picture
     * with no architecture in it, so the sentence stops arguing and describes
     * what is there. `attachStyle` is what makes the description true. */
    role_sentence:
      `Image 1 shows this room's materials, palette and light on ANOTHER WALL OF THIS SAME ROOM, ` +
      `the ${pick} wall of the ${String(name0).toLowerCase()}, WITH ITS OPENINGS REMOVED: there ` +
      `is no door, no window, no fireplace and no stair anywhere in it, because they have been ` +
      `filled in with that wall's own plain fabric. Match its paint handling, its palette and its ` +
      `light, and take NO ARCHITECTURE from it: how many openings this wall carries, where they ` +
      `stand and every dimension of them come from Image 2 and the words below. Paint this wall ` +
      `as the same room on the same day.`
  });
  /* THE LEAD, always known; its CANDIDATE only reachable where the caller has
   * told us where unpromoted pictures live. */
  const lead = leadFacing(plan, loc);
  if (opts.imageOf && lead && lead !== f) {
    const img = opts.imageOf(`${loc}/${lead}`);
    if (img && img.kind === "candidate") {
      /* [Kabe, "we want first-time success", 2026-08-30] A SEED MUST PASS THE
         INSTRUMENT BEFORE IT MAY TEACH. platform_far's three followers took
         Image 1 from their lead's unjudged candidate - a scale-broken frame -
         and all three painted 10-15 % small; re-rolled with NO image and the
         same words, all three passed. One wrong picture outweighs every
         sentence, so a candidate seeds nothing until its own reading is a
         camera PASS. */
      const cid = (img.rel.match(/row23-([0-9a-f]+)\.png$/) || [])[1];
      const readingFile = cid && PACK.paths.readings_dir
        ? join(PACK.paths.readings_dir, `${cid}.json`) : null;
      let candPass = false;
      if (readingFile && existsSync(readingFile)) {
        try { candPass = JSON.parse(readFileSync(readingFile, "utf8")).verdict === "PASS"; }
        catch { candPass = false; }
      }
      const ok = candPass ? leadAskIsRuling(plan, loc, lead, root, img.rel)
        : { ok: false, why: "the lead's candidate has no camera-PASS reading yet - an unjudged frame seeds nothing" };
      if (ok.ok) {
        return say(lead, img.rel,
          `${loc}/${lead} LEADS this room [row 42] and is painted but not promoted yet; its own ` +
          `ask named this room's ruling materials (${ok.ask_path})` +
          (ok.refined ? ` in the wording that was live when it was rolled — the same materials, ` +
            `since refined` : "") +
          `, which is row 40's second condition read on the candidate`,
          { lead: true, source_kind: "candidate", ask_class: ok.class });
      }
      /* A LEAD THAT FAILS ROW 40's CONDITION IS NOT IMAGE 1 — it falls through
       * to the promoted path below, which may find a proper wall or none.
       * Recorded on the returned object where one is found, and silent where
       * none is, because the packet already says there is no Image 1. */
    }
  }
  const reportPath = opts.report ||
    join(root, "design", "plan-draft", "measured", "room_consistency.json");
  /* NO MEASUREMENT IS NOT A MAJORITY. A room nobody has compared has no wall
   * this can vouch for, and the safe answer is no picture. */
  if (!existsSync(reportPath)) return null;
  const rep = JSON.parse(readFileSync(reportPath, "utf8"));
  const room = (rep.rooms || []).find((r) => r.room === loc);
  if (!room) return null;
  const mismatched = String(room.verdict || "").startsWith("mismatched");
  if (mismatched && room.no_majority) return null;
  const agreeing = mismatched ? (room.majority || []) : (room.facings || []);
  /* THE AUDIT IS READ ONCE PER PROCESS, not once per facing. This composer is
   * called 88 times in one sweep and `materialProvenance` walks the whole
   * store; without the memo the row-40 test alone re-read 61 prompts 88 times.
   * Keyed by root so a staged tree in a test never reads the repository's. */
  const prov = opts.provenance || provenanceCache(plan, root);
  const pr = (prov.rooms || []).find((r) => r.room === loc);
  /* VOUCHED, NOT VERBATIM. `current` and `refined` both mean this wall was
   * painted in the material the room is ruled to; only the wording differs.
   * See "VOUCHING FOLLOWS THE MATERIAL, NOT THE WORDING" — this line is the
   * gap that rule was written to close, and a sealed-legacy wall whose class
   * is `refined` passes it. */
  const ruled = new Map((pr ? pr.facings : [])
    .filter((x) => isVouched(x.class)).map((x) => [x.facing, x.class]));
  const eligible = agreeing
    .filter((g) => g !== f)
    .filter((g) => ruled.has(g))                                  // vouched, per above
    .filter((g) => existsSync(join(root, "backdrops", loc, `${g}.png`)))
    .sort();
  /* [row 42] THE LEAD WINS THE TIE among walls that already satisfy row 40 —
   * it is the wall this room is being painted TO — and where it is not one of
   * them, row 40's own alphabetical pick stands exactly as before. */
  const pick = (lead && eligible.includes(lead)) ? lead : eligible[0];
  if (!pick) return null;
  return say(pick, `backdrops/${loc}/${pick}.png`,
    `${loc}/${pick} is inside this room's agreeing walls (room_consistency.json) ` +
    `and its own ask was this room's ruling ${ruled.get(pick) === "refined"
      ? "MATERIALS, in the wording that was live when it was painted — the words have since been " +
        "refined and the material has not (materialProvenance: refined)"
      : "(materialProvenance)"}` +
    (pick === lead ? "; it also LEADS this room [row 42]" : ""),
    { lead: pick === lead, source_kind: "promoted", ask_class: ruled.get(pick) });
}

/* THE ASK AUDIT, SPOKEN IN THE PIXEL MEASURE'S OWN SHAPE.
 *
 * `--emit-consistency` already knows how to cut a forced re-ask from a report
 * of mismatched rooms; what it did not have was a second way to be told which
 * rooms those are. This is that second way, and it is strictly earlier than
 * the first: the pixel measure cannot speak until every facing of a room is
 * painted and promoted, and it is blind on the one axis its own sweep proved
 * must not vote - which is why `stair_landing` sits in row 40's ledger as an
 * OPEN miss. In the ASKS there is nothing subtle about stair_landing at all:
 * N was asked for "a plain lime-plastered ceiling", E for a "boarded ceiling".
 *
 * THE MAJORITY IS NOT A VOTE HERE EITHER, and this is the stronger form of
 * row 40's own rule. The pixel route may seed a re-ask only from a facing
 * inside the room's agreeing majority; this route may seed only from a facing
 * whose ASK was the plan's ruling. guest_chamber is the case that separates
 * them: three of its four facings agree with each other in pixels and all
 * three were asked for the wrong fabric, so the pixel majority is the half
 * that is wrong while the ask majority is the one facing that is right. */
export function provenanceAsConsistencyReport(prov, opts = {}) {
  /* WHAT IS RE-ASKED, AND IT FOLLOWS THE MATERIAL. `stale-material` and
   * `split-ask` are the two ways a wall's fabric is not the room's; both are
   * re-asked, and that is the default. A `refined` wall is in the right
   * material and only the words moved, so re-asking it buys a roll and a wait
   * to change nothing on the wall — it is re-asked when the Navigator asks for
   * the words to be FORCED (`--refined-too`), and not otherwise. */
  const rooms = [];
  for (const r of prov.rooms || []) {
    if (r.verdict === "current") continue;
    const known = r.facings.filter((x) => x.verdict !== "unrecoverable");
    /* THE WALLS THAT MAY SEED, which is the whole reason this distinction was
     * drawn: vouched, not verbatim. */
    const vouched = r.facings.filter((x) => isVouched(x.class)).map((x) => x.facing);
    /* An unrecoverable ask is re-asked too: a painting nobody can prove was
     * asked for this room is not evidence that it was — it is classed
     * `stale-material` for exactly that reason. */
    const outliers = r.facings
      .filter((x) => REASK_CLASSES.has(x.class) || (opts.refinedToo && x.class === "refined"))
      .map((x) => x.facing);
    if (!outliers.length) continue;
    /* A WALL BEING REPAINTED IS NOT A WALL TO SEED FROM, even where it is
     * vouched — under `--refined-too` a refined wall is both, and the seed goes
     * to a sibling that is standing still. */
    const out = new Set(outliers);
    const right = vouched.filter((g) => !out.has(g));
    const byAsk = new Map();
    for (const x of known) {
      byAsk.set(x.ask_material_key, (byAsk.get(x.ask_material_key) || []).concat(x.facing));
    }
    const refined = r.facings.filter((x) => x.class === "refined").map((x) => x.facing);
    const wrong = known.filter((x) => REASK_CLASSES.has(x.class)).map((x) => x.facing);
    const said = r.split
      ? `Measured, in the ASKS rather than in the pixels: this room's promoted facings were ` +
        `commissioned from ${r.distinct_asks} different sets of materials ` +
        `(${[...byAsk.values()].map((g) => g.join("")).join(" against ")}), so it was painted as ` +
        `${r.distinct_asks} rooms and not one. ` +
        (right.length
          ? `${right.join(" and ")} ${right.length > 1 ? "were" : "was"} asked for the materials ` +
            `above and ${wrong.length > 1 ? "the others were" : "this one was"} not.`
          : `No facing of it was asked for the materials above, so the ruling comes from the plan ` +
            `and not from another wall.`)
      : wrong.length
        ? `Measured, in the ASKS rather than in the pixels: every promoted facing of this room was ` +
          `commissioned from ONE set of materials, and that set is not the one this plan rules for ` +
          `the room. The materials above are the plan's ruling.`
        /* THE `--refined-too` SENTENCE, and it says what is and is not wrong
         * with the wall — a painter told its materials were wrong would repaint
         * a floor that is already the right floor. */
        : `Measured, in the ASKS rather than in the pixels: every promoted facing of this room was ` +
          `commissioned in the materials this plan rules for it, and ${refined.join(", ")} ` +
          `${refined.length > 1 ? "were" : "was"} asked in WORDING that has since been refined. ` +
          `The fabric is not in dispute; what is being forced is the refined wording above.`;
    rooms.push({
      room: r.room,
      facings: r.facings.map((x) => x.facing),
      verdict: "mismatched (ask)",
      worst_band: "materials",
      score: r.distinct_asks,
      bands: {},
      outliers,
      majority: right,
      no_majority: right.length === 0,
      refined,
      clusters: [...byAsk.values()],
      measured: said
    });
  }
  return {
    instrument: prov.instrument,
    cut: "the plan's own ruling materials",
    reasks: opts.refinedToo
      ? "stale-material, split-ask and refined (--refined-too)"
      : "stale-material and split-ask",
    rooms
  };
}

async function emitConsistency(outDir, opts) {
  /* [row 43(a)] WHICH SHEET THIS EMISSION DRAWS ON. `ink-on-paper-v2` by
   * default: a dark diagram is read as the picture's own look and its dark
   * boxes as holes in the wall, twice over in the ledger. `--scaffold-style
   * grid-v1` re-cuts a packet on the old sheet, which is what a comparison
   * arm needs and what a committed scaffold re-renders as. */
  const sheetStyle = assertScaffoldStyle(opts.scaffoldStyle || SCAFFOLD_STYLE_DEFAULT);
  const t_run = Date.now() / 1000;                                        // [row 33]
  const plan = JSON.parse(readFileSync(PACK.paths.plan, "utf8"));
  let report;
  if (opts.fromAsk) {
    /* [row 40 - the ORIGIN] No file to be stale, no pixels to be fooled: the
     * audit runs here, now, off the store and this composer. */
    report = provenanceAsConsistencyReport(materialProvenance(plan),
      { refinedToo: !!opts.refinedToo });
  } else {
    const reportPath = opts.report ||
      join(ROOT, "design", "plan-draft", "measured", "room_consistency.json");
    if (!existsSync(reportPath)) {
      console.error(`make-scaffold refused: ${reportPath.slice(ROOT.length + 1)} does not exist, so ` +
        `no room has been measured for consistency and there is nothing to correct. Run ` +
        `\`python3 design/plan-draft/measured/room_consistency.py\` first, or cut the re-asks ` +
        `from the asks instead with \`--from-ask\`.`);
      process.exit(1);
    }
    report = JSON.parse(readFileSync(reportPath, "utf8"));
  }
  const mp = join(outDir, "retries.json");
  const prior = existsSync(mp) ? JSON.parse(readFileSync(mp, "utf8")).entries || [] : [];
  const spent = new Map();
  for (const e of prior) spent.set(e.key, Math.max(spent.get(e.key) || 0, e.attempt || 0));

  /* WHAT IS ASKED, decided before a browser is launched so the refusals are
   * visible even on a pass that emits nothing. */
  const want = [], refused = [];
  for (const r of report.rooms || []) {
    if (opts.rooms && opts.rooms.length && !opts.rooms.includes(r.room)) continue;
    if (!String(r.verdict || "").startsWith("mismatched")) {
      if (opts.rooms && opts.rooms.length) {
        refused.push({ key: r.room, refused: `the measure calls this room ${r.verdict}` });
      }
      continue;
    }
    for (const f of r.outliers || []) {
      const key = `${r.room}/${f}`;
      if (opts.walls && opts.walls.length && !opts.walls.includes(key)) continue;
      if (!existsSync(join(ROOT, "backdrops", r.room, `${f}.png`))) {
        refused.push({ key, refused: "no promoted painting to replace" });
        continue;
      }
      want.push({ key, room: r });
    }
  }
  /* A WALL NAMED BY HAND AND NOT RE-ASKED SAYS SO. `--wall` narrows a pass; it
   * does not admit one. A named wall that is not in the re-ask set used to
   * vanish without a line, which reads exactly like a wall that was emitted —
   * and since `refined` walls are held back by default, that silence is now the
   * likeliest thing a seat will hit. It is a refusal with its reason instead. */
  for (const key of opts.walls || []) {
    if (want.some((w) => w.key === key)) continue;
    const [loc, fc] = key.split("/");
    const r = (report.rooms || []).find((x) => x.room === loc);
    refused.push({ key, refused: !r
      ? `${loc} is not in the report: every promoted facing of it was asked for this room's own materials`
      : (r.outliers || []).includes(fc)
        ? `${key} is in the re-ask set but was filtered out by --room`
        : `${key} is not in the re-ask set (${report.reasks || "the report's own outliers"})` +
          ((r.refined || []).includes(fc) ? " — it is `refined`; pass --refined-too to force the words" : "") });
  }
  if (!want.length) {
    console.log("no facing is outside its room's agreeing walls — nothing to re-ask");
    for (const r of refused) console.log(`  ${r.key}  ${r.refused}`);
    return { emitted: [], refused };
  }

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1536, height: 1200 } });
  await page.goto(pathToFileURL(join(ROOT, "index.html")).href + `?world=${PACK.world.paths.world_query}`);
  await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);

  /* [row 42] The same resolver the other two emit paths use. On this path
   * every wall is already promoted, so it never resolves a candidate — but the
   * lead preference for Image 1 is the same rule and reads through the same
   * function rather than a second one. */
  const cstate = existsSync(join(outDir, "run-state.json"))
    ? JSON.parse(readFileSync(join(outDir, "run-state.json"), "utf8")) : { walls: {} };
  const imageOf = leadImageResolver(cstate, ROOT);
  const hasImage = (k) => !!imageOf(k);

  const emitted = [];
  for (const w of want) {
    const [loc, f] = w.key.split("/");
    const order = {
      lead: (() => { const l = leadFacing(plan, loc); return l ? `${loc}/${l}` : null; })(),
      order: roomOrder(plan, loc, hasImage)
    };
    const meta = await page.evaluate((k) => {
      const e = window.HOLO_APP.backdrops[k];
      return e && e.meta ? e.meta : null;
    }, w.key);
    if (!meta) { refused.push({ ...w, room: undefined, refused: "the page holds no meta for this facing" }); continue; }

    const t_facing = Date.now() / 1000;                                   // [row 33]
    const room = (plan.rooms || []).find((x) => x.id === loc);
    const ruling = roomRuling(plan, loc, f);
    const { voice, anchor, via } = ruling;
    const band = w.room.bands[w.room.worst_band] || {};
    const worst = (band.pairwise || []).reduce((a, b) => (b.D > (a ? a.D : -1) ? b : a), null);
    /* THE SOURCE STATES ITS OWN FINDING. The ask audit measures a different
     * quantity from the pixel measure and says so in its own words rather than
     * borrowing a band name and a D it does not have. */
    const measured = w.room.measured ? w.room.measured : w.room.no_majority
      ? `Measured: this room's ${w.room.worst_band} splits ` +
        `${(w.room.clusters || []).map((c) => c.join("")).join(" against ")} with NO majority ` +
        `(worst pair D=${w.room.score}), so the materials above are the plan's ruling and not ` +
        `another wall's.`
      : `Measured: this room's ${w.room.worst_band} disagrees at D=${w.room.score}` +
        (worst ? ` (colour ${worst.dChroma}, contrast x${(2 ** worst.dT).toFixed(2)})` : "") +
        `; ${(w.room.majority || []).join(" and ")} agree with each other and this facing does not.`;
    const correction = consistencySentence(ruling, room || { id: loc }, w.room.worst_band, measured);

    const { rects, flights } = scaffoldRects(plan, loc, f, meta);
    const cr = chairRail(meta, anchor);
    assertLabelChars(cr.label, `${w.key}'s gate anchor label`);
    const legend = legendFor(meta, rects, "THE META THIS PAGE HOLDS FOR THIS FACING", anchor);
    const framePng = await renderPng(page, w.key, meta, "scaffold", null, sheetStyle);
    const scafPng = await renderPng(page, w.key, meta, "scaffold",
      { rects, chair_rail: cr, legend, flights }, sheetStyle);

    const attempt = (spent.get(w.key) || 0) + 1;
    const dir = join(outDir, `${loc}-${f}`, `retry-${attempt}`);
    mkdirSync(dir, { recursive: true });
    writePng(framePng, join(dir, "frame.png"));
    writePng(scafPng, join(dir, "scaffold.png"));
    /* [row 40, Kabe's ruling] IMAGE 1, IF THERE IS ONE. Never the study and
     * never any wall of another room: this room's own agreeing wall, or no
     * picture at all and the medium in words. On THIS path it is very often
     * none, and correctly so - a room being re-asked for consistency is a room
     * whose walls are in dispute, and a disputed wall is exactly what must not
     * be handed to the next roll as a photograph. */
    const style = attachStyle(plan, w.key, dir, { imageOf });
    /* THE SEEDS, AND THE RULE THAT MAKES THEM SAFE: only a neighbour the
     * measure puts in this room's agreeing majority may be cut from. Seeding
     * an outlier off another outlier spreads the wrong material round the room
     * instead of replacing it. A room with no majority gets no strip at all
     * and stands on the ruling alone. */
    const agreeing = new Set((w.room.majority || []).map((g) => `${loc}/${g}`));
    const { seeds, plans } = attachSeeds(plan, w.key, dir,
      { allow: (nk) => agreeing.has(nk), style });
    timings.record("emit.facing", t_facing, Date.now() / 1000, w.key,     // [row 33]
      { carriers: rects.length, voice: voice.id, consistency: attempt });

    const t_packet = Date.now() / 1000;                                   // [row 33]
    /* [row 43] BOTH STRIPS ARE NAMED BY THE COMPOSER, not appended after it.
     * `manorPrompt` used to name one strip and this path glued the second role
     * sentence onto the end of a finished prompt — below the constraints, in no
     * section, after the register had said its last word. The clean register
     * takes the whole list and names each strip in the picture paragraph where
     * the other images are introduced. */
    const text = manorPrompt(plan, w.key, meta, rects, correction, null, { style, seeds, scaffoldStyle: sheetStyle });
    writeFileSync(join(dir, "prompt.txt"), text);
    const ids = [];
    for (let i = 1; i <= (opts.rolls || 1); i++) {
      const id = rollId(w.key, `${opts.technique || "t2"}c${attempt}`, null, i);
      ids.push({ roll: i, id,
        candidate: `${sourceDirFor(w.key)}/row23-${id}.png`,
        prompt: `${sourceDirFor(w.key)}/row23-${id}.prompt.txt` });
    }
    mkdirSync(join(ROOT, sourceDirFor(w.key)), { recursive: true });
    for (const r of ids) writeFileSync(join(ROOT, r.prompt), text);
    writeFileSync(join(dir, "PACKET.md"),
      `# ${w.key} — CONSISTENCY RE-ASK ${attempt} (technique ${opts.technique || "t2"}, labelled scaffold)\n\n` +
      `> **Why this wall is being asked again**\n>\n> ${correction}\n\n` +
      `This wall is already promoted. It is being asked again because the room it stands in ` +
      `does not read as one room: \`design/plan-draft/measured/room_consistency.py\` measures ` +
      `**${w.room.worst_band}** across ${w.room.facings.join("")} at **D = ${w.room.score}** ` +
      `(the cut is ${report.cut}), and ` +
      (w.room.no_majority
        ? `the room splits ${(w.room.clusters || []).map((c) => c.join("")).join(" against ")} ` +
          `with no majority — so every facing is being re-asked and the ruling comes from the ` +
          `room's voice, not from another wall.\n\n`
        : `${(w.room.majority || []).join("")} agree with each other while this one does not.\n\n`) +
      stylePacketNote(style) +
      packetNoteAll(seeds, plans) +
      `${attachLineAll(seeds, style)}\n` +
      `order, then send \`prompt.txt\` verbatim. Generate ${ids.length} image(s) and save them to the\n` +
      `exact paths below — the measurement runs the moment a file appears at one of them.\n\n` +
      ids.map((r) => `| roll ${r.roll} | \`${r.candidate}\` |`).join("\n") +
      `\n\nThe prompt files are already on disk beside them. Do not rewrite them.\n\n` +
      `This wall: ${meta.px_per_m_at_wall.toFixed(1)} px per metre at the wall plane, ` +
      `${rects.length ? rects.map((r) => r.kind).join(" + ") : `no carrier — ${voice.blank}`}.\n` +
      `Voice: **${voice.id}** (${via}); gate anchor **${anchor.line}**, ${CHAIR_RAIL_M.toFixed(2)} m.\n` +
      `Register: **${PRODUCTION_REGISTER}** — the register this ask was composed in (tools/frame-language.mjs, row 43). Every\n` +
      `roll below is attributable to it: the reading of a return joins to this line through the roll id.\n` +
      `The promoted painting this replaces is still at \`backdrops/${loc}/${f}.png\` and is not ` +
      `overwritten by this packet; promotion is the sweep's decision, not this emitter's.\n` +
      `Write only under \`backdrops/\`. Never \`src/\`, never \`design/\`.\n`);
    timings.record("emit.packet", t_packet, Date.now() / 1000, w.key,     // [row 33]
      { rolls: ids.length, roll_ids: ids.map((r) => r.id),
        prompt_chars: text.length, consistency: attempt });

    emitted.push({
      key: w.key, attempt, packet: dir.slice(ROOT.length + 1),
      register: PRODUCTION_REGISTER,                                     // [row 43]
      correction,
      voice: { id: voice.id, via, outdoor: !!voice.outdoor, anchor: anchor.id },
      px_per_m_at_wall: meta.px_per_m_at_wall,
      flights: flights.map((s) => ({
        id: s.id, direction: s.direction, climb: s.climb, treads: s.treads,
        treads_in_view: s.treads_in_view, width_m: s.width_m,
        x0: s.x0, y0: s.y0, x1: s.x1, y1: s.y1, raw_w: s.raw_w, raw_h: s.raw_h
      })),
      scaffold_sha256: sha256File(join(dir, "scaffold.png")),
      scaffold_style: sheetStyle,
      /* The row-38 fields, unchanged in meaning, so the seam spec and the
       * sweep read this entry exactly as they read a retry's. `edge_seeds` is
       * the row-40 addition: the full list, where two strips rode. */
      edge_seed: seeds[0] || null,
      edge_seeds: seeds,
      seed_policy: isOpenLocation(plan, loc) ? "required" : "opportunistic",
      /* [row 42] A CONSISTENCY RE-ASK NEVER WAITS, and it is the one path that
       * does not. Every wall it touches is ALREADY PROMOTED — that is the
       * clause it is emitted under — so the room's lead has a picture by
       * construction, and there is nothing for a dependency to be waiting on.
       * The order block is still recorded, because a reader of this file
       * should not have to know that in order to read one entry. */
      depends_on: null,
      lead: order.lead,
      is_lead: order.lead === w.key,
      continues: (order.order.find((x) => x.key === w.key) || {}).continues || null,
      order_position: (order.order.find((x) => x.key === w.key) || {}).position ?? null,
      /* [row 40] What the measure said, carried with the packet so a reader
       * never has to go and re-derive why this wall was asked. */
      consistency: {
        band: w.room.worst_band, D: w.room.score, cut: report.cut,
        clusters: w.room.clusters, majority: w.room.majority,
        no_majority: !!w.room.no_majority,
        ruling: { walls: ruling.walls, ceiling: ruling.ceiling,
                  floor: ruling.floor, hangings: ruling.hangings }
      },
      rolls: ids
    });
    console.log(`  ${w.key.padEnd(24)} retry-${attempt}  voice ${voice.id.padEnd(18)} ` +
      `${ids.length} roll(s)  ${seeds.length ? seeds.map((s) => `seed ${s.side} <- ${s.neighbour}`).join(", ") : "no seed (no agreeing neighbour)"}`);
  }
  await browser.close();

  /* THE INDEX IS CUMULATIVE — see the same block in `emitRetries` for the coat
   * that was lost by not being. Keyed by wall AND attempt, so a consistency
   * packet can never displace a retry's entry or another pass's. */
  const merged = new Map();
  for (const e of prior) merged.set(`${e.key}#${e.attempt}`, e);
  for (const e of emitted) merged.set(`${e.key}#${e.attempt}`, e);
  const entries = [...merged.values()].sort(
    (a, b) => a.key.localeCompare(b.key) || a.attempt - b.attempt);
  const head = existsSync(mp) ? JSON.parse(readFileSync(mp, "utf8")) : {};
  writeFileSync(mp, JSON.stringify({
    ...head,
    _consistency: "[row 40] An entry carrying a `consistency` block was cut by `--emit-consistency`, not by `--emit-retries`: the wall is already PROMOTED and is being asked again because its room does not read as one room. Its correction names the room's ruling materials out of tools/room-voices.mjs, and its edge seeds are cut only from facings the measure puts inside the room's agreeing majority.",
    _generated: new Date().toISOString().slice(0, 10),
    emitted: emitted.length, carried: entries.length - emitted.length,
    refused: refused.length,
    entries, refused_entries: refused
  }, null, 2) + "\n");
  console.log(`\nconsistency  ${mp.slice(ROOT.length + 1)}`);
  console.log(`             ${emitted.length} packet(s) this pass, ` +
    `${entries.length - emitted.length} carried forward; ${refused.length} refused`);
  for (const r of refused) console.log(`               ${r.key}  ${r.refused}`);
  timings.record("emit.run", t_run, Date.now() / 1000, null,              // [row 33]
    { mode: "consistency", emitted: emitted.length, refused: refused.length });
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
  const plan = JSON.parse(readFileSync(PACK.paths.plan, "utf8"));
  const side = JSON.parse(readFileSync(
    join(outDir, "study-N.scaffold.json"), "utf8"));
  const meta = side.meta_used;
  const nbMeta = JSON.parse(readFileSync(join(ROOT, "backdrops", "study", "W.meta.json"), "utf8"));

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1536, height: 1200 } });
  await page.goto(pathToFileURL(join(ROOT, "index.html")).href + `?world=${PACK.world.paths.world_query}`);
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

  /* ROW 23's CLOSED EXPERIMENT KEEPS ITS OWN SHEET. Technique t4 was measured
   * against the grid frame and its four orphaned returns are still being read
   * against that table (row 36's first evidence); re-cutting it on paper would
   * change the arm after the rolls were spent. */
  const scafPng = await renderPng(page, "study/N", meta, "scaffold",
    { rects, chair_rail: cr, legend }, "grid-v1");
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
  const plan = JSON.parse(readFileSync(PACK.paths.plan, "utf8"));
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
  const plan = JSON.parse(readFileSync(PACK.paths.plan, "utf8"));
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
