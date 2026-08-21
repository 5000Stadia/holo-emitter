#!/usr/bin/env node
/* plan-projection.mjs — plan + facing -> staging and §5 meta geometry
 * (blueprint §4b: "The bake **derives** from it, by projection through the
 * ruled camera: staging's `u` and `depth_m`, and the meta geometry fields
 * (`camera_wall_m`, `wall_width_m`, corner positions)").
 *
 * Exports pure functions; the CLI at the bottom is a thin wrapper that reads
 * files and writes the projection report (blueprint §4b rule 1).
 *
 * Everything in the screen layer is IMPORTED, never re-derived:
 *   - src/groundplane.js — scaleAtDepth, xAtScale, placeHost. `u` is solved
 *     THROUGH xAtScale rather than by a private inverse, so displacing
 *     xAtScale at runtime moves the projection (a test does exactly that; the
 *     row-2 precedent is validator.spec displacing placeHost).
 *   - src/renderer.js GRID_META — grid-canonical meta, the camera the shipped
 *     demo actually draws with.
 *   - tools/validate-plan.mjs — the plan's own laws, so each has one home.
 *
 * WHICH CAMERA. There are two in the documents and they are not the same:
 *   - the **grid camera** the demo ships (GRID_META: eye 1.6 m, level), the
 *     only camera this project has ever drawn a pixel with; and
 *   - the **contract camera** blueprint §10 rules for generation — eye 1.83 m
 *     (Kabe's 2026-08-20 six-foot ruling) and pitch −8°, whose home is
 *     `replicator/contract.json`.
 * Blueprint §5 rules that neither is final: "The geometry elements should be
 * determined by the orientation of the approved initial image generation" —
 * the camera is whatever the backdrop Kabe approves at row 4 turns out to
 * have. So this module takes the camera as an argument and decides nothing:
 * it defaults to the grid camera because that is the one that reproduces
 * today's pixels, and the report shows what the contract camera would give
 * instead, with the pitch term named as unmodelled and measured. That
 * divergence is a fork for Kabe, not something to settle here.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import {
  RIGHT, NORMAL, FACINGS, BUILT_KINDS, ALL_WALL_KINDS,
  validatePlan, planWarnings, builtOnWallLine, viewSpan
} from "./validate-plan.mjs";

const require_ = createRequire(import.meta.url);
const groundplane = require_("../src/groundplane.js");
const { GRID_META } = require_("../src/renderer.js");

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/* §5's pinned logical canvas is 1536×1024. GRID_META carries the height as
 * image_h_px; the width is the same pinned viewport tools/validate-
 * fixtures.mjs already names, and a plan may override it (canvas_w_px) so the
 * document stays derivable-complete for a host with another frame. */
const CANVAS_W = 1536;
const EPS = 1e-9;

/**
 * A camera, as the projection needs it. Nothing here is invented: every field
 * either comes from a document or is named as unmodelled.
 *
 * `eye_m` is the height §5's horizon device puts the horizon at. For the grid
 * camera it is DERIVED back out of GRID_META (floor_line_y − horizon_y is the
 * eye height in wall pixels). That is a definition, not evidence: it makes
 * deriveMeta reproduce GRID_META identically, which is a consistency
 * requirement and could not fail. What CAN fail is assertCameraConsistent
 * below, which asks whether GRID_META's own numbers still satisfy the device.
 */
export function cameraFrom({ id, eye_m, pitch_deg, horizon_y, px_per_m_at_wall, image_h_px, source }) {
  return Object.freeze({
    id, eye_m, pitch_deg: pitch_deg || 0, horizon_y, px_per_m_at_wall, image_h_px, source
  });
}

/** The camera the shipped demo draws with. */
export const GRID_CAMERA = cameraFrom({
  id: "grid",
  eye_m: (GRID_META.floor_line_y - GRID_META.horizon_y) * GRID_META.image_h_px / GRID_META.px_per_m_at_wall,
  pitch_deg: 0,
  horizon_y: GRID_META.horizon_y,
  px_per_m_at_wall: GRID_META.px_per_m_at_wall,
  image_h_px: GRID_META.image_h_px,
  source: "src/renderer.js GRID_META (blueprint §7's row-2 amendment)"
});

/** Blueprint §10's generation camera, for comparison only. Its home is
 * `replicator/contract.json`; the numbers are repeated here with their
 * citation so the divergence can be shown, and nothing in the validator, the
 * derived render or the shipped fixture depends on this object. */
export const CONTRACT_CAMERA = cameraFrom({
  id: "contract",
  eye_m: 1.83,
  pitch_deg: -8,
  horizon_y: GRID_META.horizon_y,
  px_per_m_at_wall: GRID_META.px_per_m_at_wall,
  image_h_px: GRID_META.image_h_px,
  source: "blueprint §10 camera.eye_height_m 1.83 / pitch_deg −8 [HUMAN 2026-08-20]"
});

/**
 * The one check on the imported camera that can go red. §5 states the floor
 * twice — as the scale lerp and as the horizon device — and they agree only
 * when px_per_m_at_bottom = (image_h − horizon_y·image_h)/eye. Edit any one
 * of GRID_META's four numbers alone and this fails.
 */
export function assertCameraConsistent(meta = GRID_META) {
  const problems = [];
  const eye = (meta.floor_line_y - meta.horizon_y) * meta.image_h_px / meta.px_per_m_at_wall;
  const bottom = (meta.image_h_px - meta.horizon_y * meta.image_h_px) / eye;
  if (Math.abs(bottom - meta.px_per_m_at_bottom) > 1e-6) {
    problems.push(`px_per_m_at_bottom is ${meta.px_per_m_at_bottom}, but §5's horizon device at eye ${eye} m gives ${bottom}`);
  }
  if (!(eye > 0.5 && eye < 3)) problems.push(`the implied eye height is ${eye} m, which is not a person`);
  return problems;
}

/** Metres of wall the pinned frame holds — 1536 px at 96 px/m is 16.0 m. */
export function pinnedWallInFrame(camera = GRID_CAMERA, canvasW = CANVAS_W) {
  return canvasW / camera.px_per_m_at_wall;
}

const roomOf = (plan, id) => {
  const r = (plan.rooms || []).find((x) => x.id === id);
  if (!r) throw new Error(`plan-projection: no room "${id}" in the plan`);
  return r;
};
const facingOf = (room, f) => {
  const fc = room.facings && room.facings[f];
  if (!fc) throw new Error(`plan-projection: room "${room.id}" has no facing ${f}`);
  return fc;
};

/**
 * The built structure across a facing's view, as segments in view-relative
 * metres measured from the left-hand end as the standpoint sees it. Law (b)
 * made into meta: a facing whose view is part wall and part open ground
 * carries both, instead of one invented wall spanning the gap.
 */
export function wallSegments(plan, roomId, facing) {
  const room = roomOf(plan, roomId);
  const fc = facingOf(room, facing);
  if (fc.type === "open") return { continuous: false, segments: [], span_m: fc.wall_width_m };
  const kinds = room.type === "open" ? BUILT_KINDS : ALL_WALL_KINDS;
  const built = builtOnWallLine(plan, room, facing, fc.wall_line, kinds);
  const span = viewSpan(room.rect, facing);
  const [rx, ry] = RIGHT[facing];
  const alongRight = span.axis === "x" ? rx : ry;
  const toView = (v) => alongRight > 0 ? v - span.lo : span.hi - v;
  const segs = built
    .map(([a, b]) => [toView(a), toView(b)].sort((p, q) => p - q))
    .map(([a, b]) => ({ from_m: Number(a.toFixed(6)), to_m: Number(b.toFixed(6)), kind: "wall" }))
    .sort((a, b) => a.from_m - b.from_m);
  const total = segs.reduce((a, s) => a + (s.to_m - s.from_m), 0);
  const continuous = segs.length === 1 && Math.abs(total - (span.hi - span.lo)) < 1e-6;
  return { continuous, segments: segs, span_m: fc.wall_width_m };
}

/**
 * Does this facing need the wider camera?
 *
 * Kabe's ruling (3), blueprint §4b: "wide-view camera license granted
 * ('sure') — open and corridor deep-views take their own wider camera,
 * enclosed flat views keep the pinned frame."
 *
 * [AI, under that standing license] The trigger is the arithmetic the license
 * was granted about: **a facing whose wall in view is wider than the pinned
 * frame holds cannot use the pinned frame** — the alternative the drawing
 * offered was clipping `wall_width_m`, and the license is what declined it.
 * A compound trigger that also read the room's or the facing's type was tried
 * and dropped: it contradicted the sentence's own vocabulary in both
 * directions. This reads one quantity; the report says which facings it
 * selects and exactly where a redline would land.
 */
export function needsWideView(plan, roomId, facing, camera = GRID_CAMERA, canvasW = CANVAS_W) {
  const fc = facingOf(roomOf(plan, roomId), facing);
  return fc.wall_width_m > pinnedWallInFrame(camera, canvasW) + EPS;
}

/**
 * deriveMeta(plan, roomId, facing, opts?) -> the §5 backdrop meta this
 * facing's geometry implies.
 *
 *   camera_wall_m / camera_far_m — READ OFF THE DRAWING (law (a)). An
 *       `enclosed` or `corridor` facing views a wall plane and carries
 *       `camera_wall_m`; an `open` facing views a drawn ground line with no
 *       surface on it and carries `camera_far_m` INSTEAD, so a consumer
 *       cannot hand a horizon to a depth model that expects a plane.
 *   px_per_m_at_wall   = the camera's pinned scale, or canvasW / wall_width_m
 *                        under the wide-view license
 *   floor_line_y       = horizon_y + eye_m · px_per_m_at_wall / image_h_px
 *   px_per_m_at_bottom = (image_h_px − horizon_y·image_h_px) / eye_m  (§5's
 *                        horizon device; independent of the wall scale)
 *   corner_x0/x1_px    = the wall's ends in frame — null unless ONE continuous
 *                        wall spans the view (law (b): a view that is part
 *                        building and part open ground has segments, not two
 *                        corners)
 */
export function deriveMeta(plan, roomId, facing, opts = {}) {
  const camera = opts.camera || GRID_CAMERA;
  const room = roomOf(plan, roomId);
  const fc = facingOf(room, facing);
  const canvasW = plan.canvas_w_px || CANVAS_W;
  const wide = needsWideView(plan, roomId, facing, camera, canvasW);
  const pxAtWall = wide ? canvasW / fc.wall_width_m : camera.px_per_m_at_wall;
  const imageH = camera.image_h_px;
  const horizonY = camera.horizon_y;
  const walls = wallSegments(plan, roomId, facing);
  const meta = {
    floor_line_y: horizonY + camera.eye_m * pxAtWall / imageH,
    px_per_m_at_wall: pxAtWall,
    px_per_m_at_bottom: (imageH - horizonY * imageH) / camera.eye_m,
    wall_width_m: fc.wall_width_m,
    key_tint: GRID_META.key_tint,
    image_h_px: imageH,
    horizon_y: horizonY,
    key_dir: GRID_META.key_dir,
    facing_type: fc.type,
    camera: wide ? "wide" : "pinned",
    camera_id: camera.id,
    backdrop: fc.type === "open" ? "vista" : "wall",
    wall_segments: walls.segments,
    wall_continuous: walls.continuous,
    corner_x0_px: null,
    corner_x1_px: null
  };
  if (fc.type === "open") {
    meta.camera_far_m = fc.camera_wall_m;
    meta.far_line = fc.far_line;
  } else {
    meta.camera_wall_m = fc.camera_wall_m;
  }
  if (walls.continuous) {
    meta.corner_x0_px = canvasW / 2 - (fc.wall_width_m / 2) * pxAtWall;
    meta.corner_x1_px = canvasW / 2 + (fc.wall_width_m / 2) * pxAtWall;
  }
  return meta;
}

/** The meta the RENDERER resolves for a facing today: grid canonical, because
 * no backdrop asset exists. The only meta in which the shipped staging could
 * reproduce at all, and what stagingDivergence compares against. */
export function shippedMeta() {
  return { ...GRID_META, camera_wall_m: groundplane.CAMERA_WALL_M };
}

/** The depth of an object's baseline — its ground-contact edge nearest the
 * standpoint — from the facing's wall line. */
function footprintDepth(fc, facing, rect) {
  const line = fc.wall_line;
  const a = facing === "N" ? rect.y1 : facing === "S" ? rect.y0
    : facing === "E" ? rect.x1 : rect.x0;
  const b = facing === "N" ? rect.y0 : facing === "S" ? rect.y1
    : facing === "E" ? rect.x0 : rect.x1;
  return Math.max(Math.abs(line - a), Math.abs(line - b));
}

/**
 * projectPlacement(plan, id, roomId, facing, meta?) -> the §4 staging spatial
 * values this object's plan footprint implies for this facing.
 *
 * The lookup is `objects[]` by id first, then `openings[]` by `entity` — a
 * door is a wall carrier and lives on its opening, not in the furniture. An
 * `anchor_on` entity (note1, key1, coin1) has no plan position at all by §4
 * and is not projected: it derives everything from its host, and asking for
 * one throws rather than inventing a position.
 *
 * `u` is solved THROUGH groundplane.xAtScale, not by a private inverse, so
 * the mapping from a metre offset to a `u` has exactly one home. (It is a
 * normalization along the wall rather than a perspective term: the scale
 * cancels. The camera enters through `depth_m` → scale, and through
 * `wall_width_m` / `px_per_m_at_wall`.)
 */
export function projectPlacement(plan, objectId, roomId, facing, meta) {
  const room = roomOf(plan, roomId);
  const fc = facingOf(room, facing);
  const obj = (plan.objects || []).find((o) => o.id === objectId);
  const opening = (plan.openings || []).find((o) => o.entity === objectId);
  if (!obj && !opening) {
    throw new Error(`plan-projection: nothing in the plan is "${objectId}" (an anchor_on entity has no plan position by §4 — it derives from its host)`);
  }
  const rect = obj ? obj.footprint : opening.rect;
  const attachment = obj ? obj.attachment : "wall_mounted";
  const m = meta || deriveMeta(plan, roomId, facing);
  const canvasW = plan.canvas_w_px || CANVAS_W;

  /* A wall-mounted carrier hangs ON the wall plane: depth zero by definition,
   * §4 gives it `v` and never `depth_m`. Its rect straddles the wall (a 0.6 m
   * exterior wall puts an opening's centre 0.3 m behind the room's wall
   * line), and `in_wall` reports that instead of pretending it is a depth. */
  const [axis] = NORMAL[facing];
  const inWall = attachment === "wall_mounted"
    ? fc.wall_line >= rect[axis + "0"] - EPS && fc.wall_line <= rect[axis + "1"] + EPS
    : null;
  const depth_m = attachment === "wall_mounted" ? 0 : footprintDepth(fc, facing, rect);

  const rr = room.rect;
  const centre = { x: (rr.x0 + rr.x1) / 2, y: (rr.y0 + rr.y1) / 2 };
  const pos = { x: (rect.x0 + rect.x1) / 2, y: (rect.y0 + rect.y1) / 2 };
  const [rx, ry] = RIGHT[facing];
  const offset_m = (pos.x - centre.x) * rx + (pos.y - centre.y) * ry;

  const s = attachment === "wall_mounted"
    ? m.px_per_m_at_wall
    : groundplane.scaleAtDepth(depth_m, m);
  const centreX = groundplane.xAtScale(0.5, s, m, canvasW);
  const targetX = centreX + offset_m * s;
  const xAt0 = groundplane.xAtScale(0, s, m, canvasW);
  const xAt1 = groundplane.xAtScale(1, s, m, canvasW);
  const u = (targetX - xAt0) / (xAt1 - xAt0);

  /* Blueprint §10 [HUMAN, 2026-08-21]: a sprite's generation request derives
   * its view angle from the plan — the horizontal angle its footprint
   * subtends from the facing's standpoint, zero dead-centre, signed
   * left/right. The §6 record carries it as `view_angle_deg`, and §10 says it
   * is "computable once row 12's plan exists". */
  const standToObject = fc.camera_wall_m - depth_m;
  const view_angle_deg = standToObject > EPS
    ? Math.atan2(offset_m, standToObject) * 180 / Math.PI
    : null;

  return {
    id: objectId, room: roomId, facing, attachment,
    footprint: rect, offset_m, depth_m, in_wall: inWall,
    u, view_angle_deg, scale_px_per_m: s, screen_x: targetX,
    source: obj ? "object" : "opening"
  };
}

/**
 * projectEntity — the above plus the pixels, taken whole from
 * groundplane.placeHost so the pixel layer is imported rather than
 * re-derived. `records` is the §6 record map keyed by ENTITY id.
 */
export function projectEntity(plan, objectId, roomId, facing, records, meta) {
  const p = projectPlacement(plan, objectId, roomId, facing, meta);
  const m = meta || deriveMeta(plan, roomId, facing);
  const canvasW = plan.canvas_w_px || CANVAS_W;
  const rec = records && records[objectId];
  if (!rec) return { ...p, placement: null };
  const staged = { attachment: p.attachment, u: p.u, depth_m: p.depth_m, v: 0 };
  return { ...p, placement: groundplane.placeHost(staged, rec, m, canvasW) };
}

/**
 * Every facing whose view contains an object's footprint — the primitive
 * §4b item 9 needs ("an object belongs to every facing whose view contains
 * it") and the first thing item 9's variant manifest enumerates. Row 12 emits
 * the primitive; the manifest itself — bucketing derived angles, diffing
 * against the library's family index — belongs to row 4's bulk step, which
 * owns the worklist and the library it diffs against.
 */
export function facingsContaining(plan, objectId) {
  const obj = (plan.objects || []).find((o) => o.id === objectId);
  if (!obj) return [];
  const room = roomOf(plan, obj.room);
  const out = [];
  for (const f of FACINGS) {
    const fc = room.facings[f];
    if (!fc) continue;
    const span = viewSpan(room.rect, f);
    const [axis] = NORMAL[f];
    const lo = Math.min(fc.standpoint[axis], fc.wall_line);
    const hi = Math.max(fc.standpoint[axis], fc.wall_line);
    const fp = obj.footprint;
    const across = fp[span.axis + "1"] > span.lo + EPS && fp[span.axis + "0"] < span.hi - EPS;
    const along = fp[axis + "1"] > lo + EPS && fp[axis + "0"] < hi - EPS;
    if (across && along) out.push(f);
  }
  return out;
}

/**
 * The inverse: a §4 staging placement -> the plan footprint it implies. This
 * is the route the four free-standing M0 objects' plan positions were
 * produced by, committed so those numbers are re-derivable rather than the
 * output of a script nobody kept. Its inputs are named: the shipped
 * `staging.json`, the §6 record, and the meta the renderer resolves — `u`
 * means nothing without the `wall_width_m` it spans.
 */
export function inverseProjectPlacement(plan, placement, record, meta) {
  const [roomId, facing] = placement.facing.split("/");
  const room = roomOf(plan, roomId);
  const fc = facingOf(room, facing);
  const rr = room.rect;
  const centre = { x: (rr.x0 + rr.x1) / 2, y: (rr.y0 + rr.y1) / 2 };
  const [rx, ry] = RIGHT[facing];
  const canvasW = plan.canvas_w_px || CANVAS_W;
  /* offset_m from u, through xAtScale, so this is the exact inverse of the
   * forward direction rather than a second formula. The scale cancels, and
   * the wall scale is always a legal one to read it at. */
  const s = meta.px_per_m_at_wall;
  const xAt0 = groundplane.xAtScale(0, s, meta, canvasW);
  const xAt1 = groundplane.xAtScale(1, s, meta, canvasW);
  const centreX = groundplane.xAtScale(0.5, s, meta, canvasW);
  const offset_m = (xAt0 + placement.u * (xAt1 - xAt0) - centreX) / s;

  const depth = placement.attachment === "floor_free" ? placement.depth_m : record.dims_m.d;
  const sign = (facing === "N" || facing === "E") ? -1 : +1;
  const near = fc.wall_line + sign * depth;
  const far = near - sign * record.dims_m.d;  // the body extends back toward the wall
  const c = (facing === "N" || facing === "S")
    ? centre.x + rx * offset_m
    : centre.y + ry * offset_m;
  const half = record.dims_m.w / 2;
  return (facing === "N" || facing === "S")
    ? { x0: c - half, x1: c + half, y0: Math.min(near, far), y1: Math.max(near, far) }
    : { x0: Math.min(near, far), x1: Math.max(near, far), y0: c - half, y1: c + half };
}

/**
 * Blueprint §4b: "the validator asserts staging ≡ plan projection." It does —
 * against the meta the renderer resolves — and this is where it does not
 * hold. One entry is expected and named; anything else is a failure, which is
 * what gives the check teeth on a fixture whose four free-standing objects
 * were inverse-projected from that same staging and therefore agree by
 * construction.
 */
export const KNOWN_DIVERGENCES = [
  {
    id: "door1", facing: "study/E",
    why: "the approved drawing sites door1 1.1 m south of the study's east-wall centre; the shipped staging centres it. Moving the plan would contradict the drawing Kabe approved; moving the staging would move the shipped demo's pixels. Row 4's study/E prompt sheet and row 15 are where it is resolved."
  }
];

export function stagingDivergence(plan, staging, meta = shippedMeta(), tolerance = 1e-9) {
  const rows = [];
  const unplanned = [];
  for (const [id, placement] of Object.entries(staging.placements || {})) {
    const list = Array.isArray(placement) ? placement : [placement];
    for (const pl of list) {
      if (!pl.facing) continue; // anchor_on: no independent u/depth (§4)
      const [roomId, facing] = pl.facing.split("/");
      /* The plan is presentation-side and may be partial: a world can name a
       * location, and stage a thing in it, before the plan has drawn either
       * (§4b item 3's materialization ladder puts a conjured room on screen
       * as grid first). Such a placement is reported, never judged — and the
       * shipped fixture has none, which plan.spec pins by counting rows. */
      if (!(plan.rooms || []).some((r) => r.id === roomId)) {
        unplanned.push({ id, facing: pl.facing, why: `no plan room "${roomId}"` });
        continue;
      }
      const hasPosition = (plan.objects || []).some((o) => o.id === id) ||
        (plan.openings || []).some((o) => o.entity === id);
      if (!hasPosition) {
        unplanned.push({ id, facing: pl.facing, why: "the plan holds no position for it" });
        continue;
      }
      const p = projectPlacement(plan, id, roomId, facing, meta);
      const duOk = Math.abs(p.u - pl.u) <= tolerance;
      const shippedDepth = pl.depth_m == null ? null : pl.depth_m;
      const ddOk = shippedDepth == null || Math.abs(p.depth_m - shippedDepth) <= tolerance;
      rows.push({
        id, facing: pl.facing, attachment: pl.attachment,
        shipped_u: pl.u, projected_u: p.u, du: p.u - pl.u,
        shipped_depth_m: shippedDepth, projected_depth_m: p.depth_m,
        offset_m: p.offset_m, agrees: duOk && ddOk
      });
    }
  }
  const diverging = rows.filter((r) => !r.agrees);
  const allowed = new Set(KNOWN_DIVERGENCES.map((k) => `${k.id}@${k.facing}`));
  const unexpected = diverging.filter((r) => !allowed.has(`${r.id}@${r.facing}`));
  const missing = KNOWN_DIVERGENCES.filter(
    (k) => !diverging.some((r) => r.id === k.id && r.facing === k.facing));
  return { rows, diverging, unexpected, missing, unplanned };
}

/* ---- the report --------------------------------------------------------- */

function fixed(n, d) {
  if (n == null) return "—";
  const k = Math.pow(10, d);
  return (Math.round(n * k) / k).toFixed(d);
}

/**
 * Blueprint §5's camera-has-feet gate, as it now reads: |horizon_y −
 * (floor_line_y − eye·px_per_m_at_wall/image_h_px)| ≤ 0.02. The eye height in
 * that sentence was 1.6 m until row 3 propagated Kabe's six-foot ruling into
 * it; the shipped grid meta was authored against 1.6 and has not moved,
 * because moving it moves every pixel the demo draws.
 */
export function horizonGate(meta, eye) {
  const residual = Math.abs(meta.horizon_y - (meta.floor_line_y - eye * meta.px_per_m_at_wall / meta.image_h_px));
  return { eye, residual, tolerance: 0.02, passes: residual <= 0.02 };
}

/** Where the floor first appears in frame, in metres in front of the wall. */
function nearestFloorM(meta) {
  const cam = meta.camera_wall_m ?? meta.camera_far_m;
  return cam * (1 - meta.px_per_m_at_wall / meta.px_per_m_at_bottom);
}

/**
 * The human-readable projection report. A pure function of the documents, so
 * the committed copy is byte-comparable against a fresh run the way the
 * fixture bake is.
 */
export function report(plan, staging, records) {
  const L = [];
  const P = (s = "") => L.push(s);
  P("# The manor plan, projected — what agrees with the shipped demo and what does not");
  P();
  P("GENERATED by `node tools/plan-projection.mjs --write`. Do not edit — a staleness test");
  P("byte-compares a fresh run against this file.");
  P();
  P("`fixtures/demo-study/plan.json` is the source and `design/plan-draft/` is its derived");
  P("render. This page is the third thing the plan produces: the projection, and everything");
  P("about it that a person has to rule on rather than a check.");
  P();
  P("**Nothing here moved the shipped demo.** `fixtures/demo-study/staging.json` is untouched and");
  P("the canvas draws exactly what it drew before.");
  P();

  P("## 0. What needs Kabe");
  P();
  P("Each of these is live before row 4's prompt sheets:");
  P();
  P("1. **Which camera the projection runs on.** The demo's grid camera is eye 1.60 m and level");
  P("   (`GRID_META`); blueprint §10's generation camera is eye **1.83 m** with **−8° pitch**");
  P("   (Kabe's six-foot ruling). §5 rules that the real answer is whatever the backdrop Kabe");
  P("   approves at row 4 measures out to. This report runs on the grid camera — the only one");
  P("   that reproduces today's pixels — and §5 below is the size of the difference.");
  P("2. **Whether `door1` sits where the drawing puts it or where the staging puts it** (§1).");
  P("3. **What the entrance approach's north view is**, given that 20.4 m of its 32 m is the open");
  P("   court mouth and not a wall (§3).");
  P("4. **The wide-view trigger's reading**, and the implied focal length, which under a pinned");
  P("   scale is not constant across facings (§4).");
  P("5. **D4, still open from the drawing**: do `hall/N` and `hall/S` get door openings prompted");
  P("   into them at row 4, or do the manor's extra exits wait for a later row? The four rulings");
  P("   of 2026-08-21 did not reach this one.");
  P("6. **The desk stands in the study's chimney breast** (§6) — visible for the first time now");
  P("   that the room has real metres.");
  P("7. **An [AI] correction was made to a datum on the approved drawing** (§7).");
  P();

  P("## 1. Staging against the plan projection");
  P();
  P("Blueprint §4b asks the validator to assert *staging ≡ plan projection*. It does, against the");
  P("meta the renderer actually resolves for these two rooms (grid canonical — no backdrop asset");
  P("exists yet, so a 16.0 m wall in frame). One divergence is expected and named; any other is a");
  P("hard failure of the bake.");
  P();
  P("| entity | facing | attachment | shipped u | projected u | Δu | shipped depth_m | projected depth_m | agrees |");
  P("|---|---|---|---|---|---|---|---|---|");
  const div = stagingDivergence(plan, staging);
  for (const r of div.rows) {
    P(`| \`${r.id}\` | ${r.facing} | ${r.attachment} | ${fixed(r.shipped_u, 4)} | ${fixed(r.projected_u, 4)} | ${fixed(r.du, 4)} | ${fixed(r.shipped_depth_m, 2)} | ${r.attachment === "wall_mounted" ? "—" : fixed(r.projected_depth_m, 2)} | ${r.agrees ? "yes" : "**no**"} |`);
  }
  P();
  P("**What that table is and is not evidence of** — this matters more than the count:");
  P();
  P("- `desk1`, `chair1`, `shelf1` and `stick1` have no position on the approved drawing: it draws");
  P("  no furniture. Their plan footprints were produced by `inverseProjectPlacement` from this");
  P("  same `staging.json`, so their agreement is **definitional**. The assertion is a binding");
  P("  guard — it catches a later edit to either side — and it is not evidence about the plan.");
  P("- `door1` on `hall/W` agrees at u 0.5, and that is **also not evidence**: it stands at offset");
  P("  0 from the wall centre, where u is 0.5 under any `wall_width_m` at all.");
  P("- `door1` on `study/E` is the one row that carries information, and it disagrees. Its plan");
  P("  position comes from the drawing, independently of the fixture:");
  for (const k of KNOWN_DIVERGENCES) P(`  - \`${k.id}\` @ ${k.facing} — ${k.why}`);
  P();
  P("Under the plan's own meta (the room's real wall instead of a 16.0 m one) every `u` moves —");
  P("and so does every object's drawn size, because `camera_wall_m` moves with it. Both are");
  P("consequences of the plan rather than errors in it, and the second is the one that would");
  P("surprise someone reading only the `u` column:");
  P();
  P("| entity | facing | u today | u under plan meta | drawn height px today | under plan meta |");
  P("|---|---|---|---|---|---|");
  for (const r of div.rows) {
    const [roomId, facing] = r.facing.split("/");
    const planMeta = deriveMeta(plan, roomId, facing);
    const a = projectEntity(plan, r.id, roomId, facing, records, shippedMeta());
    const b = projectEntity(plan, r.id, roomId, facing, records, planMeta);
    P(`| \`${r.id}\` | ${r.facing} | ${fixed(a.u, 4)} | ${fixed(b.u, 4)} | ${a.placement ? fixed(a.placement.heightPx, 1) : "—"} | ${b.placement ? fixed(b.placement.heightPx, 1) : "—"} |`);
  }
  P();

  P("## 2. View angles, for row 4's prompt sheets");
  P();
  P("Blueprint §10 [HUMAN, 2026-08-21]: a sprite's generation request derives its view angle from");
  P("the plan — the horizontal angle its footprint subtends from the facing's standpoint, zero");
  P("dead-centre, signed left/right — and the §6 record carries it as `view_angle_deg`. §10 says");
  P("it is \"computable once row 12's plan exists\"; this is that computation. The contract's");
  P("reuse tolerance is ±8°.");
  P();
  P("| entity | facing | offset from centre | standpoint distance | view_angle_deg |");
  P("|---|---|---|---|---|");
  for (const r of div.rows) {
    const [roomId, facing] = r.facing.split("/");
    const p = projectPlacement(plan, r.id, roomId, facing);
    const fc = roomOf(plan, roomId).facings[facing];
    P(`| \`${r.id}\` | ${r.facing} | ${fixed(p.offset_m, 3)} m | ${fixed(fc.camera_wall_m - p.depth_m, 2)} m | ${fixed(p.view_angle_deg, 2)} |`);
  }
  P();

  P("## 3. Meta geometry, per facing");
  P();
  P("`camera_wall_m` / `camera_far_m` and `wall_width_m` are read off the approved drawing (law");
  P("(a)); everything else derives. An **open** facing carries `camera_far_m` and no");
  P("`camera_wall_m` at all — that number is a distance to drawn ground, not to a surface, and a");
  P("depth model handed one as the other puts a horizon where a wall goes. Corners are emitted");
  P("only where **one continuous wall spans the view**.");
  P();
  P("| floor | room | facing | type | camera | to wall/far | wall_width_m | px/m at wall | floor_line_y | corner_x0_px | corner_x1_px | backdrop |");
  P("|---|---|---|---|---|---|---|---|---|---|---|---|");
  for (const room of plan.rooms) {
    for (const f of FACINGS) {
      const m = deriveMeta(plan, room.id, f);
      P(`| ${room.floor} | ${room.name} | ${f} | ${m.facing_type} | ${m.camera} | ${fixed(m.camera_wall_m ?? m.camera_far_m, 2)} | ${fixed(m.wall_width_m, 2)} | ${fixed(m.px_per_m_at_wall, 2)} | ${fixed(m.floor_line_y, 4)} | ${fixed(m.corner_x0_px, 1)} | ${fixed(m.corner_x1_px, 1)} | ${m.backdrop} |`);
    }
  }
  P();
  const segmented = [];
  for (const room of plan.rooms) {
    for (const f of FACINGS) {
      const m = deriveMeta(plan, room.id, f);
      if (m.facing_type !== "open" && !m.wall_continuous) {
        segmented.push(`- **${room.name}/${f}** — ${m.wall_segments.map((s) => `wall ${fixed(s.from_m, 2)}–${fixed(s.to_m, 2)} m`).join(", ")} across a ${fixed(m.wall_width_m, 2)} m view; the rest is open ground. No corners emitted.`);
      }
    }
  }
  P("**Law (b), where it bites.** These facings claim a wall and do not have a continuous one:");
  P();
  for (const s of segmented) P(s);
  if (!segmented.length) P("- none.");
  P();
  P("Nothing in the derived meta spans that gap with an invented wall, which is what law (b)");
  P("forbids: *\"a wall seen from the courtyard or grounds exists only where the manor's exterior");
  P("wall actually stands in the plan.\"* Whether such a facing should be typed `enclosed` at all");
  P("is Kabe's to rule — the drawing's own note says the court mouth is open at its centre.");
  P();

  P("## 4. The wide-view camera [AI, under Kabe's standing license]");
  P();
  P("Ruling (3), blueprint §4b: *open and corridor deep-views take their own wider camera,");
  P(`enclosed flat views keep the pinned frame.* The pinned frame holds ${fixed(pinnedWallInFrame(), 1)} m of wall`);
  P(`(${plan.canvas_w_px} px at ${GRID_META.px_per_m_at_wall} px/m). The trigger built is the arithmetic the license was`);
  P("granted about: **a facing whose wall in view is wider than the frame holds takes the wider");
  P("camera**, its `px_per_m_at_wall` becoming `canvas / wall_width_m` so the wall exactly fills");
  P("the frame instead of being clipped. Everything else follows from §5's horizon device.");
  P();
  const wide = [];
  for (const room of plan.rooms) {
    for (const f of FACINGS) {
      const m = deriveMeta(plan, room.id, f);
      if (m.camera === "wide") wide.push({ room, f, m });
    }
  }
  P(`The ${wide.length} facings it selects:`);
  P();
  for (const w of wide) {
    P(`- ${w.room.name}/${w.f} — ${fixed(w.m.wall_width_m, 2)} m at ${fixed(w.m.px_per_m_at_wall, 2)} px/m (room type \`${w.room.type}\`, facing type \`${w.m.facing_type}\`)`);
  }
  P();
  const encl = wide.filter((w) => w.m.facing_type === "enclosed");
  P("**Where a redline would land [flagged for Kabe].** The trigger reads one quantity and not the");
  P(`ruling's vocabulary, and the two do not line up cleanly. ${encl.length} of the ${wide.length} are \`enclosed\` FACINGS —`);
  P("real walls, simply wider than the frame holds. Meanwhile the long gallery's two `corridor`");
  P("facings, at 18.22 m the deepest views in the manor, do **not** take the wider camera, because");
  P("their 8.00 m end wall fits the pinned frame perfectly well. If \"deep view\" was meant to");
  P("select on depth rather than on width, that set changes; if \"enclosed flat views keep the");
  P("pinned frame\" was meant per facing, six of these clip instead, and the drawing's");
  P("clipped-`wall_width_m` question comes back for them.");
  P();
  P("Residue, named rather than decided (it is §5's open field-of-view question, and it is");
  P("Kabe's): `px_per_m_at_wall × camera_wall_m` is the implied focal length, and under a pinned");
  P("*scale* it is not constant —");
  {
    const a = deriveMeta(plan, "study", "N");
    const b = deriveMeta(plan, "entrance_court", "N");
    P(`${fixed(a.px_per_m_at_wall * a.camera_wall_m, 0)} px in the study, ${fixed(b.px_per_m_at_wall * b.camera_wall_m, 0)} px on the entrance court's north view. The pinned frame`);
  }
  P("is a pinned scale, not a pinned lens.");
  P();

  P("## 5. What the contract camera would give instead");
  P();
  P("Blueprint §10 rules the generation camera at eye **1.83 m** with **−8° pitch** [HUMAN,");
  P("2026-08-20: *\"we should be a bit higher as a view angle looking down at about a 6ft");
  P("height\"*]. The demo's grid camera is eye 1.60 m and level. The projection runs on the grid");
  P("camera; this is the size of the difference, so the fork is a number rather than a worry:");
  P();
  P("| quantity | grid camera (shipped) | contract camera (§10) |");
  P("|---|---|---|");
  {
    const a = deriveMeta(plan, "study", "N", { camera: GRID_CAMERA });
    const b = deriveMeta(plan, "study", "N", { camera: CONTRACT_CAMERA });
    P(`| eye height | ${fixed(GRID_CAMERA.eye_m, 2)} m | ${fixed(CONTRACT_CAMERA.eye_m, 2)} m |`);
    P(`| study/N floor_line_y | ${fixed(a.floor_line_y, 4)} | ${fixed(b.floor_line_y, 4)} |`);
    P(`| study/N px_per_m_at_bottom | ${fixed(a.px_per_m_at_bottom, 1)} | ${fixed(b.px_per_m_at_bottom, 1)} |`);
    P(`| nearest floor in frame | ${fixed(nearestFloorM(a), 2)} m | ${fixed(nearestFloorM(b), 2)} m |`);
  }
  P();
  {
    const g16 = horizonGate(GRID_META, GRID_CAMERA.eye_m);
    const g18 = horizonGate(GRID_META, CONTRACT_CAMERA.eye_m);
    P("**And the blueprint's own gate now fails on the shipped grid meta.** §5's camera-has-feet");
    P("assertion — |`horizon_y` − (`floor_line_y` − eye·`px_per_m_at_wall`/`image_h_px`)| ≤ 0.02 —");
    P(`carried 1.6 m until row 3 propagated Kabe's six-foot ruling into it. Against grid canonical:`);
    P("");
    P(`- at ${fixed(g16.eye_m ?? g16.eye, 2)} m (what grid canonical implies): residual ${fixed(g16.residual, 4)} — ${g16.passes ? "passes" : "FAILS"}`);
    P(`- at ${fixed(g18.eye, 2)} m (the ruled camera, and what §5 now says): residual ${fixed(g18.residual, 4)} — ${g18.passes ? "passes" : "FAILS"}`);
    P("");
    P("Row 12 did not create that and cannot fix it: grid canonical is what the demo draws, and");
    P("every way of satisfying the gate at 1.83 m moves shipped pixels (`horizon_y` to 0.4584,");
    P(`\`floor_line_y\` to 0.6516, or \`px_per_m_at_wall\` to ${fixed((0.63 - 0.48) * 1024 / 1.83, 2)}). It is named here because this`);
    P("is the row that reads the camera out of that meta, and because row 4 measures the real one.");
    P("");
  }
  P("**Pitch is not modelled at all**, by anything in this project: `groundplane.js` has no pitch");
  P("term and adding one would move every shipped pixel. Its magnitude, so the omission is a known");
  P("quantity rather than a silence — at the study's implied focal length of");
  {
    const a = deriveMeta(plan, "study", "N");
    const f = a.px_per_m_at_wall * a.camera_wall_m;
    const dy = f * Math.tan(8 * Math.PI / 180);
    P(`${fixed(f, 0)} px, an −8° pitch moves the horizon down ${fixed(dy, 0)} px, ${fixed(dy / GRID_META.image_h_px, 3)} of frame height,`);
  }
  P("against an authored `horizon_y` of 0.48. Row 4's approved backdrop is where §5 says the real");
  P("camera comes from; until then no agent should pick one.");
  P();

  P("## 6. What the plan makes visible that nothing could see before");
  P();
  P("Computed by `planWarnings` over the committed plan, not written by hand. None of them blocks");
  P("the plan — each would have to be fixed by moving something a human approved — and each is a");
  P("question for Kabe:");
  P();
  for (const w of planWarnings(plan, records)) P(`- ${w}`);
  P();

  P("## 7. The one [AI] correction to the approved drawing");
  P();
  P("The upper-floor opening in the W2 band at y 11.0–12.0 was labelled *Solar ↔ Long Gallery* in");
  P("the drawing's source. The Solar's east wall is at x 24.6 and that opening is at x 30.4, so it");
  P("geometrically joins the **Muniment Room** to the Long Gallery, and the plan records that. The");
  P("two names are never drawn — the drawing used them only in its own reachability check — so the");
  P("derived render is byte-identical either way and the correction changes no pixel of what Kabe");
  P("approved. The promoted validator found it on its first run. It is recorded here, and not only");
  P("in a hand-off message, because an agent changed what an approved artifact says.");
  P();
  return L.join("\n") + "\n";
}

/* ---- CLI wrapper -------------------------------------------------------- */
const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) {
  const args = process.argv.slice(2);
  const i = args.indexOf("--fixture-dir");
  const fixtureDir = i !== -1 && args[i + 1] ? resolve(args[i + 1]) : join(ROOT, "fixtures", "demo-study");
  const o = args.indexOf("--out");
  const outFile = o !== -1 && args[o + 1] ? resolve(args[o + 1])
    : join(ROOT, "design", "plan-draft", "projection.md");
  const planPath = join(fixtureDir, "plan.json");
  if (!existsSync(planPath)) {
    console.error(`plan-projection: no plan.json in ${fixtureDir}`);
    process.exit(1);
  }
  const plan = JSON.parse(readFileSync(planPath, "utf8"));
  const world = JSON.parse(readFileSync(join(fixtureDir, "world.json"), "utf8"));
  let records;
  try {
    records = require_("../src/placeholders.js").records;
  } catch (e) {
    console.error(`plan-projection: cannot load records from src/placeholders.js (${e.message})`);
    process.exit(1);
  }
  /* Entity id -> §6 record, resolved the way the renderer resolves it. */
  const byEntity = {};
  for (const e of world.entities || []) if (records[e.sprite]) byEntity[e.id] = records[e.sprite];

  const findings = validatePlan(plan, world, byEntity);
  if (findings.length) {
    findings.forEach((f, n) => console.error(`${n + 1}. ${f}`));
    console.error(`plan-projection: refusing to project an invalid plan (${findings.length} finding(s))`);
    process.exit(1);
  }
  const staging = JSON.parse(readFileSync(join(fixtureDir, "staging.json"), "utf8"));
  const div = stagingDivergence(plan, staging);
  for (const u of div.unplanned) console.error(`plan warning: staged "${u.id}" on ${u.facing} is not judged — ${u.why}`);
  if (div.unexpected.length) {
    for (const r of div.unexpected) {
      console.error(`staging ≠ plan projection: ${r.id} @ ${r.facing} — shipped u ${r.shipped_u}, projected ${r.projected_u}`);
    }
    process.exit(1);
  }
  const text = report(plan, staging, byEntity);
  if (args.includes("--write")) {
    writeFileSync(outFile, text);
    console.log(`wrote ${outFile}`);
  } else {
    process.stdout.write(text);
  }
}
