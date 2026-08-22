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
 *     only camera this project has ever drawn a pixel with, and the interim
 *     Kabe ruled on 2026-08-21 against a rendered pair; and
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
  RIGHT, NORMAL, FACINGS, BUILT_KINDS, ALL_WALL_KINDS, drawn,
  validatePlan, planWarnings, builtOnWallLine, viewSpan,
  facingGeometry, ruleStandpoint, measuredDistance, standpointFor
} from "./validate-plan.mjs";

const require_ = createRequire(import.meta.url);
const groundplane = require_("../src/groundplane.js");
const { GRID_META } = require_("../src/renderer.js");

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/* §5's pinned logical canvas is 1536×1024. GRID_META carries the height as
 * image_h_px; the width is the same pinned viewport tools/validate-
 * fixtures.mjs already names. It is the CONSUMER's parameter, not the plan's:
 * a canvas width is a pixel, and a pixel does not belong in a document whose
 * every number is metres of real building. Pass `canvasW` to override. */
export const CANVAS_W = 1536;
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
export function cameraFrom({ id, eye_m, pitch_deg, horizon_y, focal_px, image_h_px, source }) {
  return Object.freeze({
    id, eye_m, pitch_deg: pitch_deg || 0, horizon_y,
    focal_px: focal_px == null ? groundplane.FOCAL_PX : focal_px,
    image_h_px, source
  });
}

/**
 * The lens, and the check on it that can go red.
 *
 * Blueprint §10's ruling pins f = 1024 px (24 mm on the 36 mm-wide frame).
 * The millimetres are authored in `replicator/contract.json` — §10's [HUMAN]
 * home — and `src/groundplane.js` holds the pixel constant every consumer
 * reads. This asserts the two are one number, exactly as `assertRuledEye`
 * does for the eye height, so a drift in either goes red rather than
 * silently re-lensing the project.
 */
export const FOCAL_MM = groundplane.FOCAL_MM;
export const FOCAL_PX = groundplane.FOCAL_PX;

export function assertRuledLens(contractPath = join(ROOT, "replicator", "contract.json")) {
  const problems = [];
  let contract;
  try {
    contract = JSON.parse(readFileSync(contractPath, "utf8"));
  } catch (e) {
    return [`cannot read the orientation contract at ${contractPath} (${e.message}) — it is where blueprint §10's ruled focal length lives`];
  }
  const mm = contract && contract.camera && contract.camera.focal_mm;
  if (mm !== FOCAL_MM) {
    problems.push(`FOCAL_MM is ${FOCAL_MM} but replicator/contract.json camera.focal_mm is ${JSON.stringify(mm)} — blueprint §10 is the [HUMAN] home of that number [row20:bake.refuses_lens_drift]`);
  }
  if (FOCAL_PX !== FOCAL_MM * CANVAS_W / groundplane.FRAME_W_MM) {
    problems.push(`FOCAL_PX ${FOCAL_PX} is not ${FOCAL_MM} mm on a ${CANVAS_W}px frame of the ${groundplane.FRAME_W_MM}mm format`);
  }
  return problems;
}

/**
 * The ruled eye height, and it is an INPUT rather than something read back
 * out of the picture.
 *
 * [HUMAN, 2026-08-20]: "we should be a bit higher as a view angle looking down
 * at about a 6ft height." Blueprint §10 encodes it as `camera.eye_height_m`,
 * whose authored home is `replicator/contract.json`; blueprint §5's
 * camera-has-feet assertion was propagated to it at row 3.
 *
 * Row 12 derived the grid camera's eye height back OUT of GRID_META, which it
 * said in its own comment was "an identity, not evidence": deriveMeta then
 * reproduced GRID_META because it could not do anything else. Row 11 turned the
 * arrow round — the eye height is a named constant the metas derive FROM, so
 * `assertCameraConsistent` compares a meta against a number it did not supply
 * and is a check that can actually go red. Which constant is the DRAWING one is
 * the ruling below (`INTERIM_EYE_M`); this one stays the contract's.
 *
 * `assertRuledEye` is the other half: the constant here is asserted equal to
 * the contract file's, so a drift in either goes red rather than silently
 * re-cameraing the project.
 */
export const RULED_EYE_M = 1.83;

/**
 * SUPERSEDED, AND KEPT AS THE RECORD OF WHY. This alias now resolves to the
 * MEASURED camera below — row 20 measured the approved backdrops and blueprint
 * §5 makes the approved image the geometric authority, so the interim this
 * block describes has been replaced by the thing it was waiting for. Read the
 * next block for what actually ships; read this one for the reasoning that put
 * an interim here in the first place, which is still the reasoning that says
 * why §10's 1.83 m is not simply adopted. Everything below is past tense.
 *
 * It was the height this project drew at until the real camera was measured.
 *
 * [HUMAN 2026-08-21, "Sounds good on the outline", Navigator-recommended
 * specifics] — row 11's direction package asked the question against a rendered
 * pair (`04a` at 1.83 m, `04b` at 1.60 m) and `04b` ships. The reason is in the
 * ruling itself: Kabe ruled six feet *"for better visual presentation"*, and the
 * ruling has two halves — eye 1.83 m AND a −8° downward pitch. Nothing in this
 * project models pitch. Taking the height alone pushes the frame-bottom floor
 * cut FURTHER out (hall/E to 1.98 m), which is the opposite of what the ruling
 * was for, and the floor cut at your feet is the intention's fifth quality. So
 * the six-foot ruling returns whole, with the measured camera that can carry
 * the pitch half too; until then the drawing camera was the 1.60 m it had
 * always been and §5's horizon gate was asserted at that height rather than at
 * one the pixels did not honour. That measurement is now in — see below.
 *
 * `RULED_EYE_M` above is untouched: it is §10's GENERATION camera, the height
 * row 4's backdrops are prompted at, and `assertRuledEye` still pins it to the
 * contract file.
 */
export const INTERIM_EYE_M = groundplane.DRAWING_EYE_M;

/**
 * THE DRAWING EYE HEIGHT, AND IT IS MEASURED NOW RATHER THAN INTERIM.
 *
 * Blueprint §5 [HUMAN, 2026-08-20]: *"The geometry elements should be
 * determined by the orientation of the approved initial image generation."*
 * The approved generations exist (row 20's backdrop integration), they were
 * measured off their own pixels, and the height they were drawn at is what
 * this project now draws at. The 1.60 m that shipped from row 11 was named an
 * interim awaiting exactly this measurement, and §10's ruled 1.83 m — which
 * the generator was asked for and did not honour — stays the GENERATION
 * camera, pinned to `replicator/contract.json` by `assertRuledEye`.
 *
 * The divergence is on the record rather than smoothed away: the contract asks
 * for 1.83 m pitched slightly down, and the approved images are 0.6 m lower
 * with no pitch at all and their principal point ABOVE frame centre. That is a
 * [HUMAN] field and an agent does not move it; what an agent may do is draw at
 * the height the approved picture was drawn at, which is what §5 rules.
 */
export const DRAWING_EYE_M = groundplane.DRAWING_EYE_M;

export function assertRuledEye(contractPath = join(ROOT, "replicator", "contract.json")) {
  const problems = [];
  let contract;
  try {
    contract = JSON.parse(readFileSync(contractPath, "utf8"));
  } catch (e) {
    return [`cannot read the orientation contract at ${contractPath} (${e.message}) — it is where blueprint §10's ruled eye height lives`];
  }
  const eye = contract && contract.camera && contract.camera.eye_height_m;
  if (eye !== RULED_EYE_M) {
    problems.push(`RULED_EYE_M is ${RULED_EYE_M} but replicator/contract.json camera.eye_height_m is ${JSON.stringify(eye)} — blueprint §10 is the [HUMAN] home of that number`);
  }
  return problems;
}

/** The camera the shipped demo draws with: the interim eye height, level. */
export const GRID_CAMERA = cameraFrom({
  id: "grid",
  eye_m: DRAWING_EYE_M,
  pitch_deg: 0,
  horizon_y: groundplane.HORIZON_Y,
  focal_px: FOCAL_PX,
  image_h_px: GRID_META.image_h_px,
  source: "the camera MEASURED off the approved study/N backdrop (row 20): eye 1.08775 m, level, horizon at y 524.4 of 1024 by the ceiling-ramp fit, on the ruled 24 mm lens — blueprint §5's 'the geometry elements should be determined by the orientation of the approved initial image generation' [HUMAN 2026-08-20], now that the approved generation exists"
});

/** Blueprint §10's generation camera, for comparison only. Its home is
 * `replicator/contract.json`; the numbers are repeated here with their
 * citation so the divergence can be shown, and nothing in the validator, the
 * derived render or the shipped fixture depends on this object. */
export const CONTRACT_CAMERA = cameraFrom({
  id: "contract",
  eye_m: RULED_EYE_M,
  pitch_deg: -8,
  horizon_y: groundplane.HORIZON_Y,
  focal_px: FOCAL_PX,
  image_h_px: GRID_META.image_h_px,
  source: "blueprint §10 camera.eye_height_m 1.83 / pitch_deg −8 [HUMAN 2026-08-20] — what backdrops are PROMPTED at, and what the approved generations did not honour"
});

/**
 * The check on a meta's camera that can go red — and since row 11 it really
 * can, because the eye height it judges against comes from outside the meta.
 *
 * §5 states the floor twice, as the scale lerp and as the horizon device, and
 * they agree only when
 *   floor_line_y       = horizon_y + eye·px_per_m_at_wall/image_h_px   and
 *   px_per_m_at_bottom = (image_h − horizon_y·image_h)/eye.
 * Both are §5's own equations, and the second is the camera-has-feet gate
 * blueprint §5 asserts at ≤ 0.02. Edit any one of GRID_META's numbers alone —
 * or run a meta authored at a different eye height past this — and it fails.
 */
export function assertCameraConsistent(meta = GRID_META, eye = INTERIM_EYE_M) {
  const problems = [];
  const impliedFloor = meta.horizon_y + eye * meta.px_per_m_at_wall / meta.image_h_px;
  if (Math.abs(impliedFloor - meta.floor_line_y) > 1e-9) {
    problems.push(`floor_line_y is ${meta.floor_line_y}, but §5's horizon device at the drawing eye ${eye} m puts the wall-floor line at ${impliedFloor} (residual ${Math.abs(impliedFloor - meta.floor_line_y)} against §5's 0.02 gate)`);
  }
  const bottom = (meta.image_h_px - meta.horizon_y * meta.image_h_px) / eye;
  if (Math.abs(bottom - meta.px_per_m_at_bottom) > 1e-6) {
    problems.push(`px_per_m_at_bottom is ${meta.px_per_m_at_bottom}, but §5's horizon device at eye ${eye} m gives ${bottom}`);
  }
  if (!(eye > 0.5 && eye < 3)) problems.push(`the eye height is ${eye} m, which is not a person`);
  return problems;
}

/** Metres of wall the frame holds at a given camera-to-plane distance. Under
 * a pinned lens this is a function of the DISTANCE, not a constant: the frame
 * holds `canvasW / (f/d)` = `d · canvasW / f` metres — 1.5 × d at f = 1024. */
export function wallInFrame(distanceM, camera = GRID_CAMERA, canvasW = CANVAS_W) {
  return distanceM * canvasW / camera.focal_px;
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
 * Where the wall a facing views is not flat.
 *
 * Law (a) measures `camera_wall_m` to *the wall line the facing views*, which
 * is what the drawing prints and what the plan stores. But a chimney breast
 * projects into the room, so the wall in view is a plane with something
 * standing proud of it: on `study/N` the plane is 3.60 m away and 2.20 m of
 * the 5.45 m in view — the hearth — is at 3.10 m. §11 puts the fireplace on
 * exactly that facing, and it is the one row 4 generates first, so a backdrop
 * authored to a single 3.60 m plane has its centre half a metre too far back.
 *
 * This does not move `camera_wall_m`: law (a) names the wall line and the
 * drawing is what it is. It reports the relief, in the same view-relative
 * terms as `wall_segments`, so a prompt sheet has the number instead of
 * discovering it in a picture. `on_axis` says whether the relief sits on the
 * standpoint's own straight-ahead ray.
 */
export function wallRelief(plan, roomId, facing) {
  const room = roomOf(plan, roomId);
  const fc = facingOf(room, facing);
  const [axis, sign] = NORMAL[facing];
  const span = viewSpan(room.rect, facing);
  const [rx, ry] = RIGHT[facing];
  const alongRight = span.axis === "x" ? rx : ry;
  const toView = (v) => alongRight > 0 ? v - span.lo : span.hi - v;
  const width = span.hi - span.lo;
  const eye = fc.standpoint[span.axis];
  const stand = fc.standpoint[axis];
  const out = [];
  for (const fp of plan.fireplaces || []) {
    if (fp.floor !== room.floor || fp.room !== room.id) continue;
    /* Relief on the VIEWED wall: the breast's far edge is the wall line, its
     * near face stands proud into the room. A hearth on another of the room's
     * walls is an object in the view, not relief on the plane, and belongs to
     * `facingCarriers` for that wall's own facing. */
    const far = sign > 0 ? fp.rect[axis + "1"] : fp.rect[axis + "0"];
    if (Math.abs(far - fc.wall_line) > EPS) continue;
    const face = sign > 0 ? fp.rect[axis + "0"] : fp.rect[axis + "1"];
    const toFace = (face - stand) * sign, toWall = (fc.wall_line - stand) * sign;
    if (!(toFace > EPS && toFace < toWall - EPS)) continue;
    const a = toView(fp.rect[span.axis + "0"]), b = toView(fp.rect[span.axis + "1"]);
    const [lo, hi] = a <= b ? [a, b] : [b, a];
    out.push({
      kind: "fireplace",
      from_m: round6(lo), to_m: round6(hi), u: round6((lo + hi) / 2 / width),
      depth_m: round6(toFace), proud_by_m: round6(toWall - toFace),
      on_axis: fp.rect[span.axis + "0"] <= eye + EPS && eye <= fp.rect[span.axis + "1"] + EPS
    });
  }
  return out.sort((a, b) => a.from_m - b.from_m);
}

/** Every facing whose wall in view is not one flat plane. */
export function wallReliefReport(plan) {
  const out = [];
  for (const room of plan.rooms) {
    for (const f of FACINGS) {
      const r = wallRelief(plan, room.id, f);
      if (r.length) out.push({ room: room.name, id: room.id, facing: f, relief: r });
    }
  }
  return out;
}

/* THE WIDE-VIEW MACHINERY IS GONE (row 20), and this paragraph is what stands
 * where it stood.
 *
 * `WIDE_VIEW_POLICIES`, `DEFAULT_WIDE_VIEW_POLICY`, `needsWideView` and the
 * `camera: "pinned"|"wide"` meta field existed for one reason: under a pinned
 * SCALE a wall wider than 16 m could not fit the frame, and the alternative to
 * a second, wider camera was clipping it. Kabe's ruling (3) granted that
 * second camera ("open and corridor deep-views take their own wider camera")
 * and `design/plan-draft/projection.md` §5 carried two readings of it that
 * disagreed on ten facings, unruled.
 *
 * Under a pinned LENS nothing is clipped: a wall wider than the frame simply
 * extends past it, as in life, so the fork has no subject and both readings
 * are deleted rather than argued (perspective-research.md §8.5).
 *
 * SAID STRAIGHT: this SUPERSEDES ruling (3) rather than satisfying it. The
 * pinned lens makes `hall/E` NARROWER (an implied 106.3° becomes 73.7°) and
 * gives no facing a wider camera than any other. The authority for the
 * supersession is Kabe's own later act on the same subject: preview frame
 * `02b` IS the 24 mm `hall/E` view — a corridor deep view, narrower than
 * ruling (3) licensed — and "full steam ahead" approved it. The licence died
 * by his approval of the narrower picture, and the row's batch says so as a
 * record rather than asking it again. */

/**
 * deriveMeta(plan, roomId, facing, opts?) -> the §5 backdrop meta this
 * facing's geometry implies.
 *
 *   camera_wall_m / camera_far_m — READ OFF THE DRAWING (law (a)). An
 *       `enclosed` or `corridor` facing views a wall plane and carries
 *       `camera_wall_m`; an `open` facing views a drawn ground line with no
 *       surface on it and carries `camera_far_m` INSTEAD, so a consumer
 *       cannot hand a horizon to a depth model that expects a plane.
 *   px_per_m_at_wall   = FOCAL_PX / the drawn distance — row 20's pinned lens
 *   floor_line_y       = horizon_y + eye_m · px_per_m_at_wall / image_h_px
 *   px_per_m_at_bottom = (image_h_px − horizon_y·image_h_px) / eye_m  (§5's
 *                        horizon device; independent of the wall scale)
 *   corner_x0/x1_px    = the wall's ends in frame — null unless ONE continuous
 *                        wall spans the view (law (b): a view that is part
 *                        building and part open ground has segments, not two
 *                        corners)
 */
function storeyHeight(plan, room) {
  /* An OPEN space has no storey. The courtyard, the privy garden and the
   * entrance approach sit on the `ground` floor like every other room, so a
   * floor-level height would hand them a 2.8 m ceiling over open sky. Nothing
   * would draw it — the ceiling is inside the renderer's `bounded` branch and
   * an open facing has no corners — but the meta would be making a claim the
   * document does not hold, and a meta that lies is worse than one that is
   * silent. */
  if (room.type === "open") return null;
  const fl = (plan.floors || []).find((f) => f.id === room.floor);
  return (fl && fl.storey_height_m != null) ? fl.storey_height_m : null;
}

export function deriveMeta(plan, roomId, facing, opts = {}) {
  const camera = opts.camera || GRID_CAMERA;
  const room = roomOf(plan, roomId);
  const fc = facingOf(room, facing);
  const canvasW = opts.canvasW || CANVAS_W;
  const drawnDistance = fc.camera_wall_m ?? fc.camera_far_m;
  /* THE LENS, not the scale. `px_per_m_at_wall` is a consequence of where you
   * stand and what lens you are on, and both terms come from outside this
   * function: the distance is read off the approved drawing (law (a)) and the
   * focal length is `groundplane.FOCAL_PX`, pinned to §10's `camera.focal_mm`
   * by `assertRuledLens`. An `open` facing quotes its scale at its far line,
   * the only plane it has, which is why this reads the same field
   * `groundplane.cameraDistance` does. */
  const pxAtWall = camera.focal_px / drawnDistance;
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
    /* §5's calibration pair. A synthesized facing's known-height feature is
     * the grid's own metre module, exactly as the fallback meta declares, so
     * its numbers can be audited against its pixels like any measured
     * backdrop's. These are here because a meta handed to the renderer must be
     * a COMPLETE §5 record: the render resolves `entry.meta ?? GRID_META`, so
     * the moment a facing carries a partial meta the fallback is never
     * consulted and an `undefined` reaches the paint. Row 4's measured metas
     * replace both values with what its own calibration_ref measures. */
    calibration_ref: GRID_META.calibration_ref,
    calibration_px: pxAtWall,
    facing_type: fc.type,
    camera_id: camera.id,
    /* PROVISIONAL, always, and machine-readably. Blueprint §5 rules that the
     * geometry elements are determined by the orientation of the approved
     * image generation. Those generations now exist and were measured, so this
     * is derived at the MEASURED eye of the approved study/N backdrop (row 20)
     * rather than at row 11's interim; §10's ruled camera is still 1.83 m at
     * −8° and is still the GENERATION camera, which the pictures did not
     * honour. It stays provisional because the pitch half remains unmodelled
     * and seven of the eight backdrops have not yet been regenerated to the
     * ruled lens. **[Row 11] The repo DOES
     * consume these** — the bake emits one per facing the world names and the
     * page renders with them. What the bake refuses on is no longer the
     * wide-view reading (deleted) but the LENS: a derived meta whose
     * `focal_px` is not `groundplane.FOCAL_PX` cannot ship, because a facing
     * on a different lens is the defect row 20 exists to remove. `provisional`
     * stays true of a DERIVED meta and is false of a measured one: where a
     * painted backdrop exists, its own `backdrops/<loc>/<facing>.meta.json`
     * supersedes this and carries `provisional: false`. */
    provisional: true,
    backdrop: fc.type === "open" ? "vista" : "wall",
    wall_segments: walls.segments,
    wall_continuous: walls.continuous,
    corner_x0_px: null,
    corner_x1_px: null,
    /* The lens this facing implies. Pinning the SCALE across facings at
     * different standpoint distances means the focal length is not constant:
     * 187 px on the cross passage's north view, 1469 px on the entrance
     * court's flanks. Emitted so the consequence is a number a reader can see
     * rather than an implication buried in the arithmetic — it is §5's open
     * field-of-view question, and Kabe's. */
    focal_px: pxAtWall * drawnDistance,
    /* The room's height, where the plan gives its floor one. Both floors of
     * the shipped plan carry 2.8 m since row 11's direction verdict [HUMAN
     * 2026-08-21], so every enclosed and corridor facing draws its ceiling;
     * open spaces carry null (see `storeyHeight`). The renderer draws a
     * ceiling only where this arrives. */
    storey_height_m: storeyHeight(plan, room),
    /* Where the floor first appears in front of the viewer. The intention's
     * fifth decomposed quality is "the camera has feet" — Riven's rails cut by
     * the frame bottom at your own feet — and this is the number that either
     * is or is not that. Emitted per facing, and warned on above the bound. */
    nearest_floor_m: null
  };
  if (fc.type === "open") {
    meta.camera_far_m = fc.camera_far_m;
    meta.far_line = fc.far_line;
  } else {
    meta.camera_wall_m = fc.camera_wall_m;
  }
  meta.nearest_floor_m = nearestFloorM(meta);
  if (walls.continuous) {
    /* The corners are the ends of the u-domain at the wall plane, so they are
     * `xAtScale(0)` and `xAtScale(1)` — the renderer's own u-mapping, called,
     * not copied. A private `canvasW/2 ± wall_width_m/2 × pxAtWall` gives the
     * same two numbers today and would keep giving them after someone taught
     * xAtScale about `wall_x0_px` (§5's named extension point for an uncentred
     * wall), leaving row 11's corner verticals in one place and the staging
     * u-domain in another. Row 2 paid for this exact shape twice. */
    meta.corner_x0_px = groundplane.xAtScale(0, pxAtWall, meta, canvasW);
    meta.corner_x1_px = groundplane.xAtScale(1, pxAtWall, meta, canvasW);
  }
  return meta;
}

/**
 * The meta the RENDERER resolves for a facing — the one home of the
 * resolution rule, used identically by the bake (which emits these into
 * fixture.js), by the page, by the fixture validator and by
 * stagingDivergence. Three tiers, in order:
 *
 *   1. a MEASURED backdrop meta, `backdrops/<loc>/<facing>.meta.json`
 *      (row 4's; none exists yet, and reading it is the fixture validator's
 *      job because it is the seat that owns that file's findings);
 *   2. the PLAN's derived meta, where the plan holds the room (row 11);
 *   3. the unplanned-facing fallback, `GRID_META`.
 *
 * Row 11 inserted tier 2. Before it, every shipped facing fell to tier 3 and
 * drew a 16 m wall no room has.
 */
export function metaForFacing(plan, roomId, facing, opts = {}) {
  const room = (plan && plan.rooms || []).find((r) => r.id === roomId);
  if (!room || !room.facings || !room.facings[facing]) return { ...GRID_META };
  return deriveMeta(plan, roomId, facing, opts);
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
  const canvasW = CANVAS_W;

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
  const standToObject = (fc.camera_wall_m ?? fc.camera_far_m) - depth_m;
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
  const canvasW = CANVAS_W;
  const rec = records && records[objectId];
  if (!rec) return { ...p, placement: null };
  const staged = { attachment: p.attachment, u: p.u, depth_m: p.depth_m, v: 0 };
  return { ...p, placement: groundplane.placeHost(staged, rec, m, canvasW) };
}

/**
 * What a facing's wall carries, in view-relative terms — blueprint §4b's
 * "wall segments with what each carries (door openings, windows, fireplace)".
 * This is the list row 4's prompt sheets and §11's wall maps are made of, and
 * without it "per room modular consistent design so creation is snappy" has
 * nothing to be snappy from.
 *
 * A carrier is on this facing when it stands on (a door or window: inside the
 * wall band whose face is the wall line) or against (a fireplace: its breast
 * projecting into the room from that wall) the line the facing views. Position
 * is given as `u` — the same domain §4 staging uses — and as metres from the
 * left-hand end of the view as the standpoint sees it.
 */
export function facingCarriers(plan, roomId, facing) {
  const room = roomOf(plan, roomId);
  const fc = facingOf(room, facing);
  const span = viewSpan(room.rect, facing);
  const [normalAxis, sign] = NORMAL[facing];
  const [rx, ry] = RIGHT[facing];
  const alongRight = span.axis === "x" ? rx : ry;
  const width = span.hi - span.lo;
  const toView = (v) => alongRight > 0 ? v - span.lo : span.hi - v;
  const out = [];
  const add = (kind, id, rect, extra) => {
    const a = toView(rect[span.axis + "0"]), b = toView(rect[span.axis + "1"]);
    const [lo, hi] = a <= b ? [a, b] : [b, a];
    out.push({
      kind, id, from_m: round6(lo), to_m: round6(hi),
      width_m: round6(hi - lo), u: round6((lo + hi) / 2 / width), ...extra
    });
  };
  for (const o of plan.openings || []) {
    if (o.floor !== room.floor || o.kind !== "door") continue;
    if (!(o.rect[span.axis + "0"] >= span.lo - EPS && o.rect[span.axis + "1"] <= span.hi + EPS)) continue;
    const near = sign > 0 ? o.rect[normalAxis + "0"] : o.rect[normalAxis + "1"];
    if (Math.abs(near - fc.wall_line) > EPS) continue;
    add("door", o.id, o.rect, o.entity ? { entity: o.entity } : {});
  }
  for (const w of plan.windows || []) {
    if (w.floor !== room.floor) continue;
    if (!(w.rect[span.axis + "0"] >= span.lo - EPS && w.rect[span.axis + "1"] <= span.hi + EPS)) continue;
    const near = sign > 0 ? w.rect[normalAxis + "0"] : w.rect[normalAxis + "1"];
    if (Math.abs(near - fc.wall_line) > EPS) continue;
    add("window", null, w.rect, {});
  }
  for (const fp of plan.fireplaces || []) {
    if (fp.floor !== room.floor || fp.room !== room.id) continue;
    if (!(fp.rect[span.axis + "0"] >= span.lo - EPS && fp.rect[span.axis + "1"] <= span.hi + EPS)) continue;
    /* A breast projects INTO the room, so its far edge is the wall line. */
    const far = sign > 0 ? fp.rect[normalAxis + "1"] : fp.rect[normalAxis + "0"];
    if (Math.abs(far - fc.wall_line) > EPS) continue;
    add("fireplace", null, fp.rect, {});
  }
  out.sort((a, b) => a.from_m - b.from_m);
  return out;
}
const round6 = (n) => Number(n.toFixed(6));

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
  const canvasW = CANVAS_W;
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
/**
 * EMPTY since row 11, and that is the point rather than an omission.
 *
 * Row 12 carried exactly one entry — `door1` on `study/E`, where the approved
 * drawing sites the door 1.1 m south of the study's east-wall centre and the
 * shipped staging centred it — and named it `projection.md` §0's question 2.
 * Row 11's handoff answered it from the Navigator's seat: the staging moves to
 * the drawing (blueprint §4b's "THE SCHEMATIC IS APPROVED"), so the divergence
 * is gone because the fixture agrees with the plan, not because the plan
 * moved.
 *
 * The bake refuses a listed divergence that has started to agree, which is
 * what forced this list to empty in the same commit as the staging edit.
 */
export const KNOWN_DIVERGENCES = [];

/**
 * The tolerance the staging↔projection assertion runs at, and why this number.
 *
 * The shipped `u` values are 4-decimal literals; plan footprints are stored at
 * 9 dp; `camera_wall_m` and `wall_width_m` at the drawn 2 dp. Round-tripping a
 * 9 dp metre value back through `xAtScale` moves `u` by at most
 * `5e-10 / wall_width_m`, which on the narrowest wall in the manor (2.60 m)
 * is 2e-10. TOLERANCE is 1e-9 — five times that headroom, and still six orders
 * of magnitude below the smallest real disagreement the row found (door1's
 * 0.0688). A divergence just over it refuses the bake; just under it passes,
 * and a test drives both sides.
 */
export const STAGING_TOLERANCE = 1e-9;

/**
 * `meta` is now a FUNCTION of the facing, not one meta for the whole world —
 * row 11 gave every planned facing its own. Passing a plain object still
 * works (the tests that displace `xAtScale` and want one fixed meta rely on
 * it) and is treated as that meta for every facing.
 */
export function stagingDivergence(plan, staging, meta = null, tolerance = STAGING_TOLERANCE) {
  const metaAt = typeof meta === "function" ? meta
    : meta ? () => meta
      : (roomId, facing) => metaForFacing(plan, roomId, facing);
  const rows = [];
  const unplanned = [];
  const unexpectedMissing = [];
  const planRooms = new Set((plan.rooms || []).map((r) => r.id));
  /* An entity ANY of whose placements stands in a room the plan has not drawn
   * belongs to a part of the world the plan has not reached — a door between a
   * planned room and an unplanned one is the shape of it. Those warn. An
   * entity every placement of which is in a room the plan DOES hold, with no
   * position for it, is a gap in the document, and that refuses: a warning
   * there let an emptied `objects[]` bake green. */
  const straddlesUnplanned = new Set();
  for (const [id, placement] of Object.entries(staging.placements || {})) {
    const list = Array.isArray(placement) ? placement : [placement];
    for (const pl of list) {
      if (pl.facing && !planRooms.has(pl.facing.split("/")[0])) straddlesUnplanned.add(id);
    }
  }
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
        const where = straddlesUnplanned.has(id) ? unplanned : unexpectedMissing;
        where.push({ id, facing: pl.facing, why: straddlesUnplanned.has(id)
          ? `it also stands in a room the plan has not drawn`
          : `the plan holds "${roomId}" but no position for "${id}"` });
        continue;
      }
      const p = projectPlacement(plan, id, roomId, facing, metaAt(roomId, facing));
      const duOk = Math.abs(p.u - pl.u) <= tolerance;
      const shippedDepth = pl.depth_m == null ? null : pl.depth_m;
      const ddOk = shippedDepth == null || Math.abs(p.depth_m - shippedDepth) <= tolerance;
      /* `attachment` is the ONE field both documents hold, and until the
       * round-4 critic set them to different tokens nothing compared them.
       * The consequence was worse than a stale duplicate: the projection had
       * used the PLAN's token to pick its scale while the report printed
       * STAGING's, and the depth comparison — the only other thing that could
       * have noticed — is skipped whenever the shipped placement carries no
       * `depth_m`, which is exactly the wall-mounted case. */
      const planObj = (plan.objects || []).find((o) => o.id === id);
      const planAttachment = planObj ? planObj.attachment : null;
      const aOk = planAttachment == null || pl.attachment == null ||
        planAttachment === pl.attachment;
      rows.push({
        id, facing: pl.facing, attachment: pl.attachment,
        plan_attachment: planAttachment,
        shipped_u: pl.u, projected_u: p.u, du: p.u - pl.u,
        shipped_depth_m: shippedDepth, projected_depth_m: p.depth_m,
        offset_m: p.offset_m, agrees: duOk && ddOk && aOk,
        attachment_disagrees: !aOk
      });
    }
  }
  const diverging = rows.filter((r) => !r.agrees);
  const allowed = new Set(KNOWN_DIVERGENCES.map((k) => `${k.id}@${k.facing}`));
  const unexpected = diverging.filter((r) => !allowed.has(`${r.id}@${r.facing}`))
    .concat(unexpectedMissing);
  const missing = KNOWN_DIVERGENCES.filter(
    (k) => !diverging.some((r) => r.id === k.id && r.facing === k.facing));
  return { rows, diverging, unexpected, missing, unplanned };
}

/**
 * What the derived metas say about the intention's fifth decomposed quality —
 * "The camera has feet … Riven's rails are cut by the frame bottom at your own
 * feet". The reference is not invented: it is the shipped study's own frame-
 * bottom cut, the only one any human has ever judged. A facing whose floor
 * starts more than twice that far out is reported.
 *
 * This is not a validator finding. The standpoint rule that produces it is on
 * the drawing Kabe approved, and changing it changes the drawing.
 */
export function cameraFeetReport(plan, opts = {}) {
  /* The reference is the cut the BROWSER DRAWS on the facing a human looks at
   * first — the study's north view — because the sentence this number anchors
   * is "the only frame-bottom cut any human has judged". Row 12 had to take
   * the fallback meta's cut instead, since the demo drew every facing at
   * `groundplane.CAMERA_WALL_M`; row 11 gave the study its own derived meta,
   * so the shipped cut and the derived one are now the same number and the
   * substitution the round-4 critic caught cannot recur. */
  const reference = deriveMeta(plan, "study", "N", opts).nearest_floor_m;
  const rows = [];
  for (const room of plan.rooms) {
    for (const f of FACINGS) {
      const m = deriveMeta(plan, room.id, f, opts);
      rows.push({ room: room.name, facing: f, id: room.id,
        nearest_floor_m: m.nearest_floor_m, focal_px: m.focal_px,
        camera_wall_m: m.camera_wall_m ?? m.camera_far_m });
    }
  }
  rows.sort((a, b) => b.nearest_floor_m - a.nearest_floor_m);
  return { reference, limit: 2 * reference, rows, over: rows.filter((r) => r.nearest_floor_m > 2 * reference) };
}

/**
 * Blueprint §11's authored wall maps for the two rooms that already exist,
 * transcribed so the plan can be checked against them mechanically instead of
 * argued against them in prose. `kinds` is what §11's sentence implies the
 * facing carries; the plan's own carriers are compared to it.
 */
export const WALL_MAP_11 = [
  ["study", "N", { kinds: ["fireplace"], text: "paneled wall with stone fireplace" }],
  ["study", "E", { kinds: ["door"], text: "the door opening to the hall" }],
  ["study", "S", { kinds: ["window", "window"], text: "leaded windows" }],
  ["study", "W", { kinds: [], text: "blank oak paneling with wainscot" }],
  ["hall", "N", { kinds: [], text: "paneled wall (shelf1 stands against it)" }],
  ["hall", "E", { kinds: ["window"], text: "leaded window at the far end" }],
  ["hall", "S", { kinds: [], text: "tapestry on paneling" }],
  ["hall", "W", { kinds: ["door"], text: "the door opening to the study" }]
];

/**
 * Recompute every facing block from the room rects and the stand-back rule.
 *
 * The per-facing values — standpoint, wall line, camera distance, wall width —
 * are a pure function of `rect` and `standpoint_stand_back` wherever
 * `standpoint_source` is `rule`, which on this plan is everywhere. Storing
 * them is right (law (a): the document holds the number the drawing prints),
 * but it means moving one wall by hand means restating four facings by hand,
 * and the README prints a four-command redline recipe that was not one.
 *
 * This is that recipe's missing step. A `drawn` standpoint is left where it
 * is and only its measured distance is refreshed, so §4b item 9's
 * deliberately-placed standpoints survive a rebuild.
 */
export function rebuildFacings(plan) {
  const out = JSON.parse(JSON.stringify(plan));
  const K = out.standpoint_stand_back;
  const C = out.standpoint_threshold_clearance_m;
  for (const r of out.rooms) {
    for (const f of FACINGS) {
      const fc = r.facings[f];
      const open = fc.type === "open";
      if (!open) delete fc.far_line;
      const geo = facingGeometry(r.rect, f, open ? fc.far_line : undefined);
      fc.wall_line = geo.wallLine;
      fc.wall_width_m = drawn(geo.width);
      /* Row 20: the standpoint law decides both WHERE and WHICH BRANCH, from
       * `tools/validate-plan.mjs`'s one home, so the rebuild and the validator
       * cannot disagree about it. A `drawn` standpoint stays where it was put
       * and only its measurement is refreshed (§4b item 9). The wall line and
       * width are set first because the law reads the facing's own width. */
      if ((fc.standpoint_source || "rule") !== "drawn") {
        const sp = standpointFor(out, r, f, K, C);
        fc.standpoint = sp.point;
        if (sp.source === "rule") delete fc.standpoint_source;
        else fc.standpoint_source = sp.source;
      }
      delete fc.camera_wall_m;
      delete fc.camera_far_m;
      fc[open ? "camera_far_m" : "camera_wall_m"] =
        drawn(measuredDistance(fc.standpoint, f, geo.wallLine));
    }
  }
  return out;
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

/**
 * Where the floor first appears, in metres IN FRONT OF THE VIEWER — not in
 * front of the wall. The bottom of frame is the depth at which the ground
 * scale reaches `px_per_m_at_bottom`; solving
 * `px_per_m_at_wall · cam / (cam − d) = px_per_m_at_bottom` for the distance
 * from the standpoint, `cam − d`, gives `cam · px_per_m_at_wall /
 * px_per_m_at_bottom`. (A first cut of this function returned `d`, the depth
 * from the wall, which is the complement and is the wrong number: it made the
 * study read 2.56 m where the shipped grid cuts the floor at 1.04 m.)
 */
function nearestFloorM(meta) {
  const cam = meta.camera_wall_m ?? meta.camera_far_m;
  return cam * meta.px_per_m_at_wall / meta.px_per_m_at_bottom;
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
  P("**ROW 20 MOVED EVERY PIXEL.** The sentence that stood here — *nothing here moved the");
  P("shipped demo* — was true of row 12 and false the moment the lens was pinned: the scale is");
  P("a per-facing consequence now, the standpoints moved, and `fixtures/demo-study/staging.json`");
  P("carries the passage's two objects on a different facing.");
  P();

  P("## 0. What needs Kabe");
  P();
  P("Each of these is live before row 4's prompt sheets:");
  P();
  P("1. **CLOSED AT ROW 20 — the camera is MEASURED now.** Blueprint §5 rules that the geometry");
  P("   is determined by the orientation of the approved image generation; those generations");
  P("   arrived, and the one Kabe's probe loop blessed measures eye **1.09 m**, level, with its");
  P("   horizon at y 524.4 of 1024 by the ceiling-ramp fit. That is what this report and the");
  P("   renderer both run on. §10's generation camera — eye **1.83 m**, **−8° pitch** — is");
  P("   untouched and is what backdrops are PROMPTED at; the generator was asked for it on all");
  P("   eight and drew 1.1–1.5 m level every time. The size of that difference is below (§7).");
  P("2. **CLOSED AT ROW 11, and the question outlived its answer until row 20 found it.**");
  P("   `staging.json` carries the projection's own values, so `door1` on `study/E` stands");
  P("   1.100 m off the east wall's centre — where the drawing sites it — and the divergence");
  P("   table reports none (§1).");
  P("3. **What the entrance approach's north view is**, given that 20.4 m of its 32 m is the open");
  P("   court mouth and not a wall (§3).");
  P("4. **CLOSED BY ROW 20** — the wide-view trigger's two readings are deleted with the");
  P("   machinery: a pinned lens clips no wall, so the fork has no subject. Kabe's ruling (3)");
  P("   is SUPERSEDED by his own later approval of preview frame `02b`, the 24 mm `hall/E`");
  P("   view, which is narrower than the licence granted. Recorded, not asked again (§5).");
  P("5. **D4, still open from the drawing**: do `hall/N` and `hall/S` get door openings prompted");
  P("   into them at row 4, or do the manor's extra exits wait for a later row? The four rulings");
  P("   of 2026-08-21 did not reach this one.");
  P("6. **The desk stands in the study's chimney breast** (§10) — visible for the first time now");
  P("   that the room has real metres.");
  P("7. **An [AI] correction was made to a datum on the approved drawing** (§9).");
  P("8. **CLOSED BY ROW 20** — the frame-bottom floor cut was fifteen anomalies running to");
  P("   6.05 m under a pinned scale. Under a pinned lens it is ONE number for the whole");
  P("   manor, `f / px_per_m_at_bottom`, because it depends on the lens and the horizon and");
  P("   not on where you stand. What is left is that one number, and it is named residue (§6).");
  P("9. **CLOSED BY ROW 20** — the implied lens ran 187 px to 2014 px across the manor, a");
  P("   factor of eleven. It is `f` = 1024 px on every facing now, bound to blueprint §10's");
  P("   `camera.focal_mm` and refused at the bake if it drifts (§6).");
  P("10. **What row 4 measures and what it takes from the plan** — §5 rules the approved image");
  P("    the geometric authority, and this row makes the plan one. The per-field table in §8 is");
  P("    a proposal, not a ruling.");
  P();

  P("## 1. Staging against the plan projection");
  P();
  P("Blueprint §4b asks the validator to assert *staging ≡ plan projection*. It does, against the");
  P("meta the renderer actually resolves for these two rooms — the PLAN's own derived meta since");
  P("row 11, each room's real wall at the ruled lens, not the 16.0 m fallback a sentence here");
  P("claimed until row 20. Any divergence at all is a hard failure of the bake.");
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
  P("- `door1` on `study/E` was the one row that carried information, and it disagreed: the");
  P("  drawing sites it 1.100 m off the east wall's centre where the staging centred it. **Row 11");
  P("  adopted the projection's values**, so it agrees now and the whole table is definitional.");
  P("  The guard still catches a later edit to either side, which is what it is for.");
  for (const k of KNOWN_DIVERGENCES) P(`  - \`${k.id}\` @ ${k.facing} — ${k.why}`);
  P();
  P("Against the FALLBACK meta a facing no plan holds would resolve to (a 16.0 m wall at 4.0 m),");
  P("every `u` moves —");
  P("and so does every object's drawn size, because `camera_wall_m` moves with it. Both are");
  P("consequences of the plan rather than errors in it, and the second is the one that would");
  P("surprise someone reading only the `u` column:");
  P();
  P("| entity | facing | u under the FALLBACK meta | u under plan meta | drawn height px, fallback | under plan meta |");
  P("|---|---|---|---|---|---|");
  for (const r of div.rows) {
    const [roomId, facing] = r.facing.split("/");
    const planMeta = deriveMeta(plan, roomId, facing);
    const a = projectEntity(plan, r.id, roomId, facing, records, { ...GRID_META });
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
  P("**The sign, stated, because two consumers would read it opposite ways.** `view_angle_deg` is");
  P("**where the thing IS**, not which way it faces: negative means the footprint sits to the");
  P("viewer's LEFT of centre, positive to the right. §10's `view_side` token is the other one —");
  P("it says which way a generated sprite is TURNED. An object left of centre is seen turned");
  P("toward the viewer's right, so the two are opposite by construction, and a generator handed");
  P("both without this sentence would mirror every sprite it made. Nothing in the row consumes");
  P("`view_angle_deg` yet; row 4's prompt sheets are the first, and this is the contract they");
  P("board from.");
  P();
  P("| entity | facing | offset from centre | standpoint distance | view_angle_deg |");
  P("|---|---|---|---|---|");
  for (const r of div.rows) {
    const [roomId, facing] = r.facing.split("/");
    const p = projectPlacement(plan, r.id, roomId, facing);
    const fc = roomOf(plan, roomId).facings[facing];
    P(`| \`${r.id}\` | ${r.facing} | ${fixed(p.offset_m, 3)} m | ${fixed((fc.camera_wall_m ?? fc.camera_far_m) - p.depth_m, 2)} m | ${fixed(p.view_angle_deg, 2)} |`);
  }
  P();

  P("## 3. What each facing's wall carries");
  P();
  P("Blueprint §4b: *\"wall segments with what each carries (door openings, windows,");
  P("fireplace)\"*. This is the list row 4's prompt sheets are made of, and the thing Kabe's");
  P("*\"per room modular consistent design so creation is snappy\"* has to be snappy from.");
  P("`u` is the §4 staging domain across the wall in view.");
  P();
  P("The two rooms that already exist, against blueprint §11's authored wall maps:");
  P();
  P("| facing | the plan's carriers | §11's wall map | agree |");
  P("|---|---|---|---|");
  for (const [rid, f, expect] of WALL_MAP_11) {
    const cs = facingCarriers(plan, rid, f);
    const got = cs.length ? cs.map((c) => `${c.kind}${c.entity ? ` (\`${c.entity}\`)` : ""} at u ${fixed(c.u, 3)}, ${fixed(c.width_m, 2)} m`).join("; ") : "nothing";
    const kinds = cs.map((c) => c.kind).sort().join(",");
    const ok = kinds === [...expect.kinds].sort().join(",");
    P(`| ${rid}/${f} | ${got} | ${expect.text} | ${ok ? "yes" : "**no**"} |`);
  }
  P();
  P("The two disagreements are **D4**, the drawing's own open question, arriving with numbers:");
  P("the manor gives the cross passage a door north to the buttery and a door south to the");
  P("kitchen, and §11's wall map gives those two facings a paneled wall with the shelf and a");
  P("tapestry. Either row 4 prompts a door opening into them, or the manor's extra exits wait");
  P("for a later row and the two doors are drawn but not built. Kabe's call, and live before");
  P("the prompt sheets.");
  P();
  {
    const relief = wallReliefReport(plan);
    P("**And the viewed wall is not always one plane.** A chimney breast stands proud of it, so");
    P("`camera_wall_m` — which law (a) measures to the wall LINE, and which the drawing prints —");
    P("is not the depth of everything you see straight ahead. On the eleven facings below, part");
    P("of the view is nearer than that number says. `study/N` is the one that matters first: it");
    P("is §11's fireplace wall and row 4's probe backdrop.");
    P("");
    P("| facing | relief | across the view | at | wall line at | on the sight line |");
    P("|---|---|---|---|---|---|");
    for (const r of relief) {
      for (const v of r.relief) {
        P(`| ${r.room}/${r.facing} | ${v.kind} | ${fixed(v.from_m, 2)}–${fixed(v.to_m, 2)} m (u ${fixed(v.u, 3)}) | ${fixed(v.depth_m, 2)} m | ${fixed(v.depth_m + v.proud_by_m, 2)} m | ${v.on_axis ? "**yes**" : "no"} |`);
      }
    }
    P("");
    P("The number is not moved: the drawing is what it is and law (a) names the wall line. What");
    P("row 4 needs is this table beside it, so a backdrop is authored to a wall with a hearth in");
    P("front of it rather than to a flat plane at 3.60 m.");
    P("");
  }
  P("## 4. Meta geometry, per facing");
  P();
  P("`camera_wall_m` / `camera_far_m` and `wall_width_m` are read off the approved drawing (law");
  P("(a)); everything else derives. An **open** facing carries `camera_far_m` and no");
  P("`camera_wall_m` at all — that number is a distance to drawn ground, not to a surface, and a");
  P("depth model handed one as the other puts a horizon where a wall goes. Corners are emitted");
  P("only where **one continuous wall spans the view**.");
  P();
  P("**One row means something different from the other 87, and it drives two numbers.**");
  P("`wall_width_m` is \"the width of the wall in view\" everywhere except `entrance_approach/N`,");
  P("where it is 32.00 m of which 20.40 m is the open court mouth — a VIEW width, not a wall.");
  P("Corners are correctly null there (nothing continuous spans it), but the same number still");
  P("sets `px_per_m_at_wall = 1536 / 32 = 48` and still defines the §4 `u` domain, so both are");
  P("scaled to a span that is two thirds sky. Whether that facing is one wide view, two walls");
  P("with a gap, or an `open` facing with a far line is §0's question 3, and it is Kabe's; the");
  P("number is not moved here because it is read off the approved drawing.");
  P();
  P("| floor | room | facing | type | standpoint | to wall/far | wall_width_m | px/m at wall | focal px | floor_line_y | nearest floor | corner_x0_px | corner_x1_px | backdrop |");
  P("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|");
  for (const room of plan.rooms) {
    for (const f of FACINGS) {
      const m = deriveMeta(plan, room.id, f);
      P(`| ${room.floor} | ${room.name} | ${f} | ${m.facing_type} | ${(room.facings[f] || {}).standpoint_source || "rule"} | ${fixed(m.camera_wall_m ?? m.camera_far_m, 2)} | ${fixed(m.wall_width_m, 2)} | ${fixed(m.px_per_m_at_wall, 2)} | ${fixed(m.focal_px, 0)} | ${fixed(m.floor_line_y, 4)} | ${fixed(m.nearest_floor_m, 2)} | ${fixed(m.corner_x0_px, 1)} | ${fixed(m.corner_x1_px, 1)} | ${m.backdrop} |`);
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

  P("## 5. The wide-view camera — deleted, and by whose authority");
  P();
  P("Kabe's ruling (3) [HUMAN, 2026-08-21] granted open and corridor deep views *\"their own");
  P("wider camera\"*, and row 12 built two readings of it that disagreed on ten facings and");
  P("left the choice to him. **Row 20 deletes both.** They existed only because a pinned SCALE");
  P("had to clip a wall wider than the frame; a pinned LENS does not clip — a wall wider than");
  P("the frame extends past it, as in life — so there is nothing for the licence to be about.");
  P();
  P("Said straight, because it is a [HUMAN] licence: this **supersedes** ruling (3) rather than");
  P("satisfying it. The pinned lens makes `hall/E` NARROWER (an implied 106.3° becomes 73.7°)");
  P("and gives no facing a wider camera than any other. The authority is Kabe's own later act");
  P("on the same subject: preview frame `02b` IS the 24 mm `hall/E` view, and *\"full steam");
  P("ahead\"* approved it. The licence died by his approval of the narrower picture.");
  P();

  P("## 6. The camera has feet, and the lens is one lens");
  P();
  P("Row 20 pinned the LENS instead of the scale, and both halves of this section inverted.");
  P();
  {
    const feet = cameraFeetReport(plan);
    const focals = feet.rows.map((r) => r.focal_px);
    P("**The lens.** `px_per_m_at_wall × camera_wall_m` is the implied focal length. Under the");
    P("pinned scale it ran 187 px to 2014 px across the manor — a factor of eleven, a 4 mm");
    P(`fisheye to a 47 mm normal. It is now ${fixed(Math.min(...focals), 0)} px on every one of ${feet.rows.length} facings`);
    P(`(${fixed(Math.max(...focals), 0)} px at the widest), which is 24 mm on this frame's own 36×24 format,`);
    P("bound to blueprint §10's `camera.focal_mm` by `assertRuledLens` and refused at the bake");
    P("if the two ever drift. `px_per_m_at_wall` is a consequence now, not a constant: it is");
    P("`f / camera_wall_m`, so a metre of wall is worth more pixels the nearer the wall is,");
    P("which is what a camera does and what makes a corner move with where you stand.");
    P("");
    P("**Where the floor starts, in front of the viewer.** The intention's fifth decomposed");
    P("quality: *\"The camera has feet … Riven's rails are cut by the frame bottom at your own");
    P("feet\"*. Under a pinned lens this is `f / px_per_m_at_bottom` — the lens and the horizon");
    P(`decide it and the standpoint does not — so it is ONE number for the whole manor: ${fixed(feet.reference, 2)} m.`);
    P(`${feet.over.length} facings start their floor more than twice that far out, against fifteen before.`);
    P("");
    P("That number is the row's largest named cost and its arithmetic is worth having in full:");
    P("`nearest_floor = eye / (1 − horizon_y)` when `f` equals the frame height, as it does");
    P("here. Its infimum over any horizon a picture can use is the EYE HEIGHT itself, so no");
    P("lens shift at this focal length puts the cut at a viewer's feet. What brought it in from");
    P("the 3.08 m every 24 mm preview drew is the approved backdrops' own camera, measured at");
    P(`${fixed(GRID_CAMERA.eye_m, 4)} m rather than the 1.83 m §10 asked for. The quality's second carrier —`);
    P("*\"Kabe's reference anchors the same way through a near desk surface\"* — is what closes");
    P("the rest, and it belongs to the row that stages a near surface.");
  }
  P();

  P("## 7. What the contract camera would give instead");
  P();
  P("Blueprint §10 rules the generation camera at eye **1.83 m** with **−8° pitch** [HUMAN,");
  P("2026-08-20: *\"we should be a bit higher as a view angle looking down at about a 6ft");
  P("height\"*]. The camera the demo DRAWS at is the one the approved backdrops were painted");
  P("at, measured off their own pixels at row 20: **1.09 m, level**. §5 makes the approved image");
  P("the geometric authority and this is that authority exercised — the generator was asked for");
  P("1.83 m on all eight and drew 1.1–1.5 m every time, so the divergence is a fact about the");
  P("generations rather than a choice, and it is recorded rather than corrected. This is its");
  P("size, so the fork is a number rather than a worry:");
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
    P("**And §5's own gate is asserted at whichever height the pixels are drawn at.** The");
    P("camera-has-feet assertion — |`horizon_y` − (`floor_line_y` − eye·`px_per_m_at_wall`/");
    P("`image_h_px`)| ≤ 0.02 — is a check on a meta's self-consistency, so it holds against the");
    P("drawing camera and fails against the other one. Against grid canonical:");
    P("");
    P(`- at ${fixed(g16.eye_m ?? g16.eye, 2)} m (the measured camera the demo draws): residual ${fixed(g16.residual, 4)} — ${g16.passes ? "passes" : "FAILS"}`);
    P(`- at ${fixed(g18.eye, 2)} m (§10's generation camera): residual ${fixed(g18.residual, 4)} — ${g18.passes ? "passes" : "FAILS"}`);
    P("");
    P("");
    P("**And by how much depends on how wide the wall is**, which is the part that would bite");
    P("silently. The residual is `(1.83 − the drawing eye) × px_per_m_at_wall / image_h_px`, so it scales");
    P("with the scale:");
    P("");
    P("| facing | px/m at wall | residual against the 1.83 m gate | verdict |");
    P("|---|---|---|---|");
    for (const [rid, f] of [["study", "N"], ["long_gallery", "E"], ["entrance_approach", "N"]]) {
      const m = deriveMeta(plan, rid, f);
      const g = horizonGate(m, CONTRACT_CAMERA.eye_m);
      P(`| ${rid}/${f} | ${fixed(m.px_per_m_at_wall, 2)} | ${fixed(g.residual, 4)} | ${g.passes ? "passes" : "**fails**"} |`);
    }
    P("");
    P("So a derivation run at the generation camera would emit metas that pass or fail one");
    P("acceptance clause according to the size of the room. That is not a tolerance being tight;");
    P("it is two eye heights in one project.");
    P("");
    P("Which is why there is one drawing height rather than two, and why it is the interim: every");
    P("way of satisfying the gate at 1.83 m moves shipped pixels (`horizon_y` to 0.4584,");
    P(`\`floor_line_y\` to 0.6516, or \`px_per_m_at_wall\` to ${fixed((0.63 - 0.48) * 1024 / 1.83, 2)}), and moves them the wrong way`);
    P("for the quality the six-foot ruling was given to serve. Row 4 measures the real one.");
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

  P("## 8. Which document owns which meta field — a proposal, not a ruling");
  P();
  P("Blueprint §5 [HUMAN, 2026-08-20]: *\"The geometry elements should be determined by the");
  P("orientation of the approved initial image generation\"* — the approved image is the");
  P("geometric authority. Row 12 makes the plan an authority too. They are not the same");
  P("authority, and row 4 needs to know per field which one it obeys. This table is what this");
  P("row proposes; it is Kabe's and row 4's to settle:");
  P();
  P("| field | proposed owner | why |");
  P("|---|---|---|");
  P("| `camera_wall_m` / `camera_far_m` | **the plan** | law (a): the number printed on the drawing IS this field |");
  P("| `wall_width_m` | **the plan** | the wall is a building fact, drawn and measured |");
  P("| `facing_type`, `backdrop`, `wall_segments` | **the plan** | law (b): what is built, and where |");
  P("| `px_per_m_at_wall` | **the approved image** | §5's ruling; the plan's value is a proposal for the prompt sheet to hit |");
  P("| `floor_line_y`, `horizon_y` | **the approved image** | measured off the backdrop; §12.5 audits them against it |");
  P("| `px_per_m_at_bottom` | **the approved image** | it is the floor the picture actually draws |");
  P("| `corner_x0_px` / `corner_x1_px` | **the approved image**, cross-checked against the plan | §5: \"measured from the image for generated backdrops; computed … for the grid\" |");
  P("| `key_dir`, `key_tint`, `calibration_ref`, `calibration_px` | **the approved image** | light and calibration are measured, never derived — this row emits none of them |");
  P();
  P("Two consequences worth stating. The plan's `px_per_m_at_wall`, `floor_line_y` and");
  P("`px_per_m_at_bottom` are therefore **proposals**, which is why every derived meta carries");
  P("`provisional: true`. And a meta that ends up carrying both a measured and a derived value");
  P("for one field needs a rule for which loses; that rule does not exist yet and row 4 owns it.");
  P();
  P("## 9. The one [AI] correction to the approved drawing");
  P();
  P("The upper-floor opening in the W2 band at y 11.0–12.0 was labelled *Solar ↔ Long Gallery* in");
  P("the drawing's source. The Solar's east wall is at x 24.6 and that opening is at x 30.4, so it");
  P("geometrically joins the **Muniment Room** to the Long Gallery, and the plan records that. The");
  P("two names are never drawn — the drawing used them only in its own reachability check — so the");
  P("derived render is byte-identical either way and the correction changes no pixel of what Kabe");
  P("approved. The promoted validator found it on its first run. It is recorded here, and not only");
  P("in a hand-off message, because an agent changed what an approved artifact says.");
  P();

  P("## 10. What the plan makes visible that nothing could see before");
  P();
  P("Computed by `planWarnings` over the committed plan, not written by hand. None of them blocks");
  P("the plan — each would have to be fixed by moving something a human approved — and each is a");
  P("question for Kabe:");
  P();
  for (const w of planWarnings(plan, records)) P(`- ${w}`);
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
  let plan = JSON.parse(readFileSync(planPath, "utf8"));
  if (args.includes("--rebuild-facings")) {
    writeFileSync(planPath, JSON.stringify(rebuildFacings(plan), null, 2) + "\n");
    plan = JSON.parse(readFileSync(planPath, "utf8"));
    console.log(`rebuilt every facing block in ${planPath} from the room rects`);
  }
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

  const cam = assertCameraConsistent();
  if (cam.length) {
    cam.forEach((c) => console.error(`camera: ${c}`));
    console.error("plan-projection: grid-canonical meta no longer satisfies §5's horizon device, so the camera this projection reads out of it is not a camera");
    process.exit(1);
  }
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
