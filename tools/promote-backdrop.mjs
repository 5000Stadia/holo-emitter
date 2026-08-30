#!/usr/bin/env node
/* promote-backdrop.mjs — put an ADMITTED painted wall into the world.
 *
 *   node tools/promote-backdrop.mjs --facing study/N \
 *        --candidate backdrops/source/study-N/cand-2.png
 *
 * Writes two files, and only these two:
 *   backdrops/<loc>/<facing>.png        a byte copy of the candidate
 *   backdrops/<loc>/<facing>.meta.json  the §5 record, DERIVED not typed
 *
 * The meta is generated rather than authored because a typed meta is a second
 * home for numbers that already live in `design/plan-draft/measured/` (the
 * measurement) and in `fixtures/demo-study/plan.json` (the building). Re-run
 * it and nothing moves; re-measure and re-run it and the meta follows. That is
 * also what makes the promotion cheap to reverse: if the camera A/B on
 * `design/approvals.log`'s last line ever picks the standing eye, this is a
 * re-run against a new candidate, not a rewrite.
 *
 * WHAT IS MEASURED AND WHAT IS THE BUILDING'S. `design/plan-draft/projection.md`
 * carries the authority table and this file obeys it: the pixels
 * (floor line, horizon, scale, corners, light, calibration) come off the
 * painting; the metres (wall width, standpoint distance, storey, facing type,
 * where the doorways stand) come off the plan Kabe approved. A number that
 * could come from either comes from the one the table names.
 *
 * THE GATE IS NOT ADVISORY HERE. A candidate whose implied focal length is
 * outside blueprint §5's acceptance band is REFUSED by this script, in the
 * same words the fixture validator would refuse its meta — so "admitted" is
 * something the code decides from the measurement, never something an operator
 * decides by running the promotion.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, mkdtempSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { activePack } from "./pack.mjs";
import { fileURLToPath } from "node:url";
import {
  MEASURED_REFERENCE_PX, MEASURED_BAND, measuredLensBand,
  TOLERANCE_RULING, DECLARED_CAMERA_FIELDS, WARPED_CAMERA_FIELDS, CAMERA_SOURCES
} from "./validate-fixtures.mjs";
import { openingsForFacing, windowsForFacing, wallSegments, nearestFloorM, facingCarriers, stairsForFacing, DRAWING_EYE_M, deriveMeta } from "./plan-projection.mjs";
import { INTERIOR_FABRIC, voiceFor } from "./room-voices.mjs";
import { rulingSentences, scaffoldRects, normMaterial } from "./make-scaffold.mjs";
import { askNamesAFlight } from "./frame-language.mjs";
import { askTextFor, paintedFlightReading, flightMask, maskCentroid } from "./flight-evidence.mjs";
import * as timings from "./timings.mjs";                 // [row 33] the stopwatch

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const CANVAS_W = 1536;
const args = process.argv.slice(2);
const argOf = (flag, dflt) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : dflt;
};

const facingArg = argOf("--facing");
const candidate = argOf("--candidate");

/* [row 33] THE CLOCK IS AN EXIT HANDLER, and that is not laziness: this script
 * refuses from fifteen different places, and a refusal is the outcome most
 * worth timing — a wall that costs a minute to be told no costs it every time
 * the sweep asks. One handler records every path, and says which it was. */
const _t0 = Date.now() / 1000;
process.on("exit", (code) => {
  timings.record("promote.backdrop", _t0, Date.now() / 1000, facingArg || null,
    { candidate: candidate || null, exit_code: code, refused: code !== 0 });
});
const planPath = argOf("--plan", activePack().paths.plan);
/* WHICH ROUND'S MEASUREMENT. `design/plan-draft/measured/` itself is the cand-2
 * promotion round's home and stays the default, so every call written before
 * the standing-eye wave still resolves to the file it always did. The wave
 * writes to `measured/cand5ref/` and `measured/cand6/` — rounds have their own
 * directories since row 21, after `--round cand1` once overwrote the promotion
 * corpus in silence — so promoting one of its walls names its round. The
 * directory is the only thing this flag chooses: the refusals below, the band
 * and the meta's shape are the same whichever round produced the numbers. */
const roundDir = argOf("--round", "");
if (!facingArg || !candidate) {
  console.error("usage: promote-backdrop.mjs --facing <loc>/<F> --candidate <png> [--plan <plan.json>] [--round cand5ref|cand6] [--reference ruled|measured] [--camera-source measured|declared]");
  process.exit(2);
}
if (roundDir && !/^[a-z0-9]+$/.test(roundDir)) {
  console.error(`promote refused: --round ${roundDir} is not a round directory name`);
  process.exit(2);
}
const [loc, facing] = facingArg.split("/");

/* The measurement's own file, which is named for the WORLD's location id
 * (`hall`), while the asset seat's source directory is named for the room
 * (`passage-E`). Two names for one place is a trap and this is the one line
 * that maps them: the location id is what the world, the plan and the
 * backdrops map all use, and it is what the promoted file is named for. */
const measuredFile = join(root, "design", "plan-draft", "measured",
  ...(roundDir ? [roundDir] : []), `${loc}-${facing}.json`);
if (!existsSync(measuredFile)) {
  console.error(`promote refused: no measurement at ${measuredFile} — run design/plan-draft/measured/measure.py${roundDir ? ` --round ${roundDir}` : ""} first`);
  process.exit(1);
}
const m = JSON.parse(readFileSync(measuredFile, "utf8"));
const plan = JSON.parse(readFileSync(planPath, "utf8"));
const room = (plan.rooms || []).find((r) => r.id === loc);
const fc = room && room.facings && room.facings[facing];
if (!fc) {
  console.error(`promote refused: the plan holds no facing ${facingArg}`);
  process.exit(1);
}

/* The measurement must be OF the candidate being promoted. Without this the
 * script will happily dress a new painting in an old painting's numbers, which
 * is the one failure a promotion can commit that nothing downstream can see:
 * every gate would pass, against pixels nobody measured. */
const srcRel = candidate.replace(/^\.\//, "");
if (!String(m._what_this_is || "").includes(srcRel)) {
  console.error(`promote refused: ${measuredFile} was measured off a different image than ${srcRel}`);
  console.error(`  its own header says: ${m._what_this_is}`);
  process.exit(1);
}
/* [Round 3 — G13] AND OF THE SAME BYTES, not merely the same path. A critic
 * repainted the candidate in place — moved its fireplace 200 px — and this
 * script dressed the new picture in the old measurement's numbers with nothing
 * downstream able to see it, which is the one failure its own header warns
 * about. A path is a name; a digest is the picture. */
{
  const want = m._source_sha256;
  if (!want) {
    console.error(`promote refused: ${measuredFile} carries no _source_sha256 — re-run design/plan-draft/measured/measure.py, which records the bytes it measured`);
    process.exit(1);
  }
  const got = createHash("sha256").update(readFileSync(join(root, candidate))).digest("hex");
  if (got !== want) {
    console.error(`promote refused: ${candidate} is not the image ${measuredFile} was measured off — the measurement recorded sha256 ${want.slice(0, 12)}… and this file is ${got.slice(0, 12)}…. Re-measure before promoting a repainted candidate.`);
    process.exit(1);
  }
}

/* `let`, and it moves in exactly one place: a WARPED frame's wall ruler is the
 * declared camera's by construction, and the reassignment sits below the lens
 * band so that everything judging THIS PAINTING (the focal check, its refusal
 * sentence) still reads the number the instrument took off the pixels. See
 * THE WARP EXIT's second clause, beside `declaredMeta`. */
let ppm = m.px_per_m_at_wall;
if (!(ppm > 0)) {
  console.error(`promote refused: ${facingArg} has no px_per_m_at_wall — a WITHHELD measurement is not a verdict, and a facing without one is not admitted`);
  process.exit(1);
}
/* [row 29(a)] THE DEPTH ANCHOR, TYPED. An `enclosed` or `corridor` facing views
 * a wall plane and the plan gives it `camera_wall_m`; an `open` facing views a
 * drawn far line with no surface on it and the plan gives it `camera_far_m`
 * INSTEAD — the field name is the mechanism, exactly as `groundplane`'s
 * `cameraDistance` and the validator's `meta.open_needs_far` have had it since
 * row 11. This file only ever read the first, so every open facing arrived here
 * with `focal = ppm × undefined = NaN` and was refused by the band below with a
 * sentence about a lens, which is not what was wrong. */
const isOpen = fc.type === "open";
/* [row 32] WHICH CAMERA THE HORIZON ON THIS META CAME FROM, and the second
 * answer exists because a human ruled it into existence.
 *
 * design/approvals.log 2026-08-24 [HUMAN]: "I think its pretty close and we can
 * accept a tolerance for drift here". Row 32 named the SUSPECT PAINTING family:
 * a frame whose ruler reads inside the ±8 % band and whose own side walls
 * converge somewhere no eye stands, or converge nowhere at all. Both readings
 * are of one picture and they cannot both be true, and the ruling is that the
 * ruler wins and the perspective is FLAGGED rather than repainted — the drift
 * costs compositing fidelity at depth and no mechanical function.
 *
 * So `--camera-source declared` takes the horizon off the camera the page's own
 * derived path holds for this facing (`deriveMeta`, below) instead of off the
 * picture, and the meta says so in four fields the fixture validator knows by
 * name. NOTHING ELSE MOVES: the scale is still the painting's and still
 * refused outside its band, the floor line is still the painting's, the metres
 * are still the drawing's, and the eye the declared horizon implies is judged
 * here at the same ±8 % as everything else.
 *
 * THE FLAG IS NOT AN OPERATOR'S TO GRANT. The measurement itself has to have
 * named this frame a member of the family (`_hold_family`) — so a clean wall
 * cannot be waved through this door — and, in the other direction, a
 * measurement that DID name one cannot be promoted through the ordinary door,
 * which is the hole this path would otherwise open in `promotion_doc`'s fence. */
const TOLERANCE_FAMILIES = ["suspect-painting", "unfitted-horizon"];
const cameraSource = argOf("--camera-source", "measured");
if (!CAMERA_SOURCES.includes(cameraSource)) {
  console.error(`promote refused: --camera-source ${cameraSource} is neither ${CAMERA_SOURCES.join(" nor ")}`);
  process.exit(2);
}
const declaredCamera = cameraSource === "declared";
const holdFamily = m._hold_family || null;
/* [THE WARP EXIT, 2026-08-29] AND THE THIRD WAY A META'S HORIZON CAN BE THE
 * DECLARED ONE, which is not a tolerance at all: the painting was MOVED onto
 * it. `mesh_warp.py` pins this frame's own room corners, floor and ceiling
 * lines and aperture edges onto the plan's at the declared camera, and the
 * reading below was taken off the RESULT. So the declared horizon is not a
 * second opinion standing in for a suspect one - it is the camera the pixels
 * now answer to by construction, exactly as a snapped frame's is, and the
 * family fence below has nothing to decide about it. What the correction cost
 * rides on the meta as numbers (`measured_room.warp`) instead of as a flag:
 * pins, residuals, the worst segment and the revealed edge, recorded and never
 * gated - the audit's "sensor, not judge" said of the record as of the gate. */
const warpRecord = (m._warp && typeof m._warp === "object") ? m._warp : null;
if (declaredCamera && isOpen) {
  console.error(`promote refused: ${facingArg} is an open facing and --camera-source declared has nothing to give it — a vista's horizon is ALREADY the camera's declared eye line (row 29(a)'s far-line ruler), so its eye is judged against the ground row it draws and there is no second reading for a tolerance to stand between. An open frame the ruler and the ground row disagree about is repainted, not flagged [row32:tolerance.open_facing]`);
  process.exit(1);
}
if (declaredCamera && !warpRecord && !TOLERANCE_FAMILIES.includes(holdFamily)) {
  console.error(`promote refused: ${facingArg}'s measurement names hold family ${JSON.stringify(holdFamily)}, and the tolerance ruling covers ${TOLERANCE_FAMILIES.join(" and ")}. The declared camera is what a SUSPECT painting is promoted on; a wall whose own instrument never called it suspect is promoted on the horizon it fixed, and asking for the declared one here would be an operator choosing a camera the measurement did not [row32:tolerance.not_suspect]`);
  process.exit(1);
}
if (!declaredCamera && TOLERANCE_FAMILIES.includes(holdFamily)) {
  console.error(`promote refused: ${facingArg}'s measurement names it ${holdFamily} — its horizon and the ruler that measured it disagree, so promoting it on the horizon in this document ships the reading the instrument refused. It goes through --camera-source declared under the Captain's tolerance ruling, flagged, or it does not go [row32:tolerance.suspect_undeclared]`);
  process.exit(1);
}
/* [row 29(a)] AND AN OUTDOOR FACING IS NOT PROMOTED FROM AN INDOOR ASK.
 *
 * The Captain's first walk of the painted manor, verbatim: "exterior garden has
 * interior wall outside". `prompt_lint.py` and `room-voices.mjs` answered the
 * forward half of that — an outdoor prompt may not NAME interior fabric, not
 * even inside a quotation of why the last attempt failed — and the emitter has
 * refused to write one since. Nothing answered the backward half: the art
 * already on disk was asked for BEFORE the outdoor voice existed, and those
 * rolls are still in the manifest as candidates.
 *
 * `entrance_court/S` is the case, and it passed every gate this project owns.
 * Its roll-2 candidate is a panelled interior with a chair-rail and two
 * enclosed corners; the camera gate measured that chair-rail, called it the
 * boundary wall's coping, and read +4.5 % — a correct measurement of the wrong
 * building. The picture would have shipped as the manor's front court.
 *
 * So the ask is checked, not the picture: every candidate is written with its
 * own prompt beside it, and a prompt that names interior fabric cannot have
 * produced an outdoor frame. The word list is `room-voices.mjs`'s own — the
 * lint's second copy, with the handshake the suite already pins — so this
 * clause and the emitter's refusal are one rule read in two directions and
 * cannot drift apart. On any map emitted after the voice table this is a no-op
 * by construction, which is the honest statement of what it is for. */
if (isOpen) {
  const promptPath = join(root, candidate.replace(/\.png$/i, ".prompt.txt"));
  if (!existsSync(promptPath)) {
    console.error(`promote refused: ${facingArg} is an open facing and ${candidate} has no prompt beside it — an outdoor wall is promoted only from an ask that can be shown to have been an outdoor one [row29:vista.ask_unreadable]`);
    process.exit(1);
  }
  const askText = readFileSync(promptPath, "utf8");
  const hit = INTERIOR_FABRIC.exec(askText);
  if (hit) {
    console.error(`promote refused: ${facingArg} is an open facing and the prompt ${candidate} was painted from names interior fabric ("${hit[0]}") — this candidate was asked for before the wall had an outdoor voice, and a frame painted to that ask is an interior wherever the ruler happens to land on it. Its own re-asks under \`outdoors_open\` are the candidates for this wall [row29:vista.indoor_ask]`);
    process.exit(1);
  }
}
const drawn = isOpen ? fc.camera_far_m : fc.camera_wall_m;
if (!(drawn > 0)) {
  console.error(`promote refused: the plan gives ${facingArg} no ${isOpen ? "camera_far_m" : "camera_wall_m"} — a ${fc.type} facing's scale is quoted at ${isOpen ? "the far line it draws" : "the wall plane it views"}, and with no distance there is no lens for the band to judge`);
  process.exit(1);
}
const focal = ppm * drawn;
/* WHICH LAWFUL REFERENCE THIS WALL ANSWERS TO. There are exactly two cameras
 * the law knows: the MEASURED reference (819.6 px, the study's approved
 * painting, blueprint §5) and the RULED lens (1024 px, §10's focal_mm through
 * one formula). A wall is gated against the camera its own page meta commands
 * — the study's painted walls against the measured one, a manor wall whose
 * scaffold and derived meta both declare 1024 against the ruled one. Gating a
 * 1024-commanded wall against 819.6 refuses the hand for obeying its
 * instruction (found live: back_stair/E painted 1016 px, -0.8% from command,
 * refused). `--reference ruled|measured` selects; the band is ±MEASURED_BAND
 * around either and is not moved. [Navigator ruling 2026-08-24 under the
 * Captain's standing directive, design/approvals.log; the lens-fork rule's own
 * branch 1 — "the generator follows a commanded camera" — with this as its
 * first production evidence.] */
const refMode = argOf("--reference", "measured");
if (refMode !== "measured" && refMode !== "ruled") {
  console.error(`promote refused: --reference ${refMode} is neither "measured" nor "ruled" — those are the only two cameras the law knows`);
  process.exit(2);
}
/* THROUGH THE VALIDATOR'S OWN BAND, not a second copy of it. This file used to
 * build the ruled arm inline — `1024 * (1 ± MEASURED_BAND)` — while the
 * validator built the measured one, so the two readers of one law computed it
 * in two places and only one of them knew the ruled camera existed at all. The
 * consequence was live: this tool admitted `buttery_pantry/S` and the bake then
 * refused the meta it had just written. One function, both centres. */
const band = measuredLensBand(refMode);
/* [2026-08-29, clause 7: sensor, not judge] A WARPED FRAME HAS NO SCALE LEFT TO
 * JUDGE. `mesh_warp.py` pinned this frame's corners, floor, ceiling and every
 * aperture onto the declared camera; the ruler read off its pixels afterwards
 * is the painter's module rescaled by that map, and refusing on it re-asks a
 * wall whose geometry is now exact by construction (the first --warp-held pass
 * promoted 0 of 11 warped walls on this line alone). The lens delta is RECORDED
 * on the warp record, never gated. */
if (warpRecord && !(focal >= band.lo && focal <= band.hi)) {
  warpRecord.lens_delta_px = Math.round((focal - (refMode === "ruled" ? 1024 : MEASURED_REFERENCE_PX)) * 10) / 10;
  console.error(`  warped frame reads a ${focal.toFixed(1)} px lens against the band ${band.lo.toFixed(1)}..${band.hi.toFixed(1)}: recorded on the warp record, not gated — the geometry is the declared camera's by construction`);
} else if (!(focal >= band.lo && focal <= band.hi)) {
  console.error(`promote refused: ${facingArg} measures ${ppm.toFixed(2)} px/m at its drawn ${drawn} m — a ${focal.toFixed(1)} px lens, outside the ±${(MEASURED_BAND * 100).toFixed(0)}% band ${band.lo.toFixed(1)}..${band.hi.toFixed(1)} px around the ${refMode === "ruled" ? "ruled 1024" : `approved ${MEASURED_REFERENCE_PX}`} px camera this wall answers to (blueprint §5/§10). The corpus conforms to the law; the law is not moved to admit the corpus.`);
  process.exit(1);
}

/* WHICH HORIZON: the ceiling-ramp intersection, ruled by the Navigator at row
 * 20 over the vanishing-point vote. The two instruments disagree by up to
 * 66 px across the eight paintings; the ramp fits the two side-wall/ceiling
 * junctions — lines parallel to the view axis, which must converge ON the
 * horizon — to a residual of a third of a pixel over 61 columns a side, and
 * adopting it makes the study's four independently generated frames agree
 * about their eye height 2.6× better. `src/groundplane.js`'s HORIZON_Y is that
 * same number for the same reason. */
/* [row 29(a)] AND WHICH HORIZON A VISTA ANSWERS TO, which is not this one.
 *
 * The ramp fits the two side-wall/ceiling junctions. An open facing has neither
 * — no ceiling, no side walls, and `meta.open_no_corners` refuses it corners
 * outright — so there is nothing for the instrument to be run on. Its two ruled
 * lines are the far-line GROUND row and the boundary-wall COPING 0.95 m above
 * it, and on the pinhole those fix the LENS and leave the eye and the horizon
 * in one equation with two unknowns. So an open frame's horizon is the camera's
 * own declared eye line, carried in the measurement under its OWN key
 * (`far_line_ruler`) with `ceiling_ramp_intersection` left null, so that
 * neither instrument's answer can be read as the other's.
 *
 * What keeps that from being a gate that cannot fail is the eye clause below:
 * the horizon is declared, but the GROUND ROW the eye is read off is measured,
 * and a painting that draws it anywhere else fails. */
const votes = m._horizon_votes || {};
const ramp = votes.ceiling_ramp_intersection;
const farRuler = votes.far_line_ruler;
/* [row 32] AND THE THIRD ANSWER, WHICH IS NOT AN INSTRUMENT AT ALL. Under the
 * tolerance ruling the horizon is the one the page's own derived path holds for
 * this facing — the ruled lens at this standpoint, the drawing eye, the
 * measured reference horizon — taken from `deriveMeta` rather than restated
 * here, so the declared camera and the camera the grid draws with are one
 * number. The reading's own ramp is left in the document, contradicted and
 * visible; it is simply not what the meta ships. */
const declaredMeta = (declaredCamera || warpRecord) ? deriveMeta(plan, loc, facing) : null;
const horizonPx = declaredCamera ? declaredMeta.horizon_y * m.image_h_px
  : (isOpen ? (farRuler && farRuler.y) : (ramp && ramp.y));
/* [THE WARP EXIT, 2026-08-29] AND THE WALL'S RULER AND ITS CORNERS COME OFF THE
 * SAME CAMERA AS ITS HORIZON — ONE META, THE SCAFFOLD'S OWN. This is the clause
 * that refused all 11 warped walls, and it refused them for a reason that was
 * true of the document and false of the picture.
 *
 * `mesh_warp.py` builds its targets out of the DECLARED meta and nothing else:
 * the floor line is `floor_line_y`, the wall's scale is `px_per_m_at_wall`, and
 * every aperture rectangle is `metaForFacing`'s projection at that scale. On
 * `closet_chamber/S` the plan rules op20 1.00 m wide and the target is 330.3 px
 * at the declared 330.32 px/m; `door_measure` on the warped OUTPUT reads
 * 330 px, 0.999 m. The warp hits its target to a pixel.
 *
 * What refused it was a SECOND meta, made downstream: this facing's declared
 * corners stand at -685 and 2221 px, off both sides of a 1536 px frame, so the
 * warped picture shows no corner at all and the re-measurement returns the two
 * recession breaks it CAN see — 53 and 1483 px. Called the ends of an 8.80 m
 * wall those two give a ruler of 162.4 px/m, half the declared one, and the
 * door the warp had just placed to the pixel read 2.03x "the plan's own 1.00 m
 * opening at this wall's corner scale". The ruler was measured on one camera
 * and the door was drawn on another.
 *
 * So for a warped frame the three numbers the warp DETERMINED — the wall's
 * scale and the two corner columns — are the declared camera's here as well,
 * on exactly the argument the lens band already carries three screens up: the
 * geometry is the declared camera's by construction. The re-measurement is not
 * discarded, it is RECORDED on the warp record beside the lens delta, where a
 * reader can see what the instrument made of the corrected picture and nothing
 * is gated on it.
 *
 * AND THE FLOOR LINE GOES WITH THEM, for the same reason and against the same
 * temptation. A first cut of this kept the painting's own wall-foot line, on
 * the thought that the eye band below would then still be a live check that
 * the warp had landed. It is not a check, it is the same two metas one axis
 * over: `mesh_warp.py` pins the floor row to `floor_line_y x image_h_px` with
 * residual 0.000 by construction of a monotone piecewise-linear axis map, and
 * on `closet_chamber/S` the instrument re-read that row 31.9 px high (885.0
 * against the 916.9 the warp wrote) and its ruler 5.7 % short. Divide the one
 * camera's floor line by the other camera's ruler and an eye of 1.087 m falls
 * out of two readings that were each 1.183 m on their own terms, and the wall
 * is refused for a drift neither instrument measured. So the warped frame's
 * eye is the declared camera's, exactly, and the clause below is an identity
 * on this path rather than a gate. WHERE THE CHECK ACTUALLY LIVES: the row
 * pin's own `residual_px`, carried onto this meta as `measured_room.warp
 * .residuals` — that is the number that says whether the floor line landed,
 * and it is a property of the resampling rather than of a second reading of
 * it. */
let cornerX0 = m.corner_x0_px;
let cornerX1 = m.corner_x1_px;
let wallFootY = m.floor_line_y;
if (warpRecord) {
  warpRecord.remeasured = {
    px_per_m_at_wall: round(ppm, 3),
    floor_line_y: wallFootY == null ? null : round(wallFootY, 6),
    corner_x0_px: cornerX0 == null ? null : round(cornerX0, 2),
    corner_x1_px: cornerX1 == null ? null : round(cornerX1, 2),
    corner_scale_px_per_m: (cornerX0 != null && cornerX1 != null && fc.wall_width_m > 0)
      ? round((cornerX1 - cornerX0) / fc.wall_width_m, 3) : null
  };
  ppm = declaredMeta.px_per_m_at_wall;
  cornerX0 = declaredMeta.corner_x0_px;
  cornerX1 = declaredMeta.corner_x1_px;
  wallFootY = declaredMeta.floor_line_y;
}
if (declaredCamera) {
  /* Nothing to check about an instrument that was not run — the checks that
   * matter for this path are the family fence above and the eye band below. */
} else if (isOpen) {
  if (!farRuler || typeof farRuler.y !== "number") {
    console.error(`promote refused: ${facingArg} is an open facing and its measurement carries no far-line ruler, which is the instrument an outdoor frame is read by — a vista promoted off a ceiling ramp would be a horizon fitted to two edges that are not side walls [row29:vista.no_far_line_ruler]`);
    process.exit(1);
  }
  if (ramp) {
    console.error(`promote refused: ${facingArg} is an open facing and its measurement carries a ceiling-ramp horizon — an open frame has no ceiling and no side-wall junctions for the row-20 instrument to be fitted to, so a reading that produced one measured something else [row29:vista.ramp_on_a_vista]`);
    process.exit(1);
  }
} else if (!ramp || typeof ramp.y !== "number") {
  console.error(`promote refused: ${facingArg}'s measurement carries no ceiling-ramp horizon, which is the instrument row 20 ruled`);
  process.exit(1);
}
const imageH = m.image_h_px;
const horizonY = horizonPx / imageH;
const floorLineY = wallFootY;
const eyeM = (floorLineY - horizonY) * imageH / ppm;
/* THE VISTA'S OWN EYE CLAUSE, and it exists because a vista has no ramp.
 *
 * On a walled facing the eye is a SECOND, independent reading — the side walls'
 * convergence — and `row23_lib` refuses the promotion where it disagrees with
 * the ruler. A vista has no second reading, so the eye it ships is its measured
 * far-line ground row against the declared eye line at its own measured scale,
 * and this is the only place that number is ever judged. Same band as
 * everything else (±MEASURED_BAND); nothing is widened to admit an open frame. */
if (isOpen) {
  const d = Math.abs(eyeM - DRAWING_EYE_M) / DRAWING_EYE_M;
  if (!(d <= MEASURED_BAND)) {
    console.error(`promote refused: ${facingArg} draws its far-line ground row at ${(floorLineY * imageH).toFixed(1)} px, which at its own ${ppm.toFixed(2)} px/m puts the eye ${eyeM.toFixed(3)} m above the ground there — ${(d * 100).toFixed(1)}% from the ${DRAWING_EYE_M} m this project draws at, outside the ±${(MEASURED_BAND * 100).toFixed(0)}% band. An open frame fixes no horizon of its own, so the ground row IS its eye reading and there is no second one to appeal to. [row29:vista.eye_band]`);
    process.exit(1);
  }
}
/* [row 32] AND THE DECLARED CAMERA'S OWN EYE CLAUSE, which is the reason the
 * tolerance is a tolerance and not a hole.
 *
 * The ruling accepts drift in the PERSPECTIVE reading. It accepts nothing about
 * the ruler, and the eye is where the two meet: the wall-foot line is measured
 * off this painting, the horizon is declared, and their separation at the
 * painting's own measured scale is an eye height. A frame that draws its floor
 * line somewhere no eye 1.183 m off the ground could put it is not a suspect
 * painting — it is a painting that failed the camera — and the same ±8 % that
 * admitted its lens is what says so. This is the clause the camera gate applies
 * upstream (`row23_run`'s `delta_eye_pct`), asserted again where the meta is
 * written, because a promotion may be re-run from the meta alone. */
if (declaredCamera) {
  const d = Math.abs(eyeM - DRAWING_EYE_M) / DRAWING_EYE_M;
  if (!(d <= MEASURED_BAND)) {
    console.error(`promote refused: ${facingArg} draws its wall-foot line at ${(floorLineY * imageH).toFixed(1)} px, which against the declared horizon at ${horizonPx.toFixed(1)} px and this painting's own ${ppm.toFixed(2)} px/m puts the eye ${eyeM.toFixed(3)} m — ${(d * 100).toFixed(1)}% from the ${DRAWING_EYE_M} m this project draws at, outside the ±${(MEASURED_BAND * 100).toFixed(0)}% band. The tolerance ruling accepts drift in what this frame's PERSPECTIVE says; it accepts none in what its ruler says, and the floor line is the ruler's [row32:tolerance.eye_band]`);
    process.exit(1);
  }
}

const meta = {
  floor_line_y: round(floorLineY, 6),
  px_per_m_at_wall: round(ppm, 3),
  px_per_m_at_bottom: round((imageH - horizonY * imageH) / eyeM, 2),
  wall_width_m: fc.wall_width_m,
  key_tint: m.key_tint,
  image_h_px: imageH,
  horizon_y: round(horizonY, 6),
  /* [row 32] THE KEY'S SIDE IS THE MEASUREMENT'S; WHETHER IT IS ABOVE OR BELOW
   * THE HORIZON IS THIS META'S. The document assembles that suffix against the
   * horizon its own instrument fixed, and on an `unfitted-horizon` frame there
   * was none — the reading says `NO-HORIZON`, honestly, about an instrument
   * that returned nothing. This meta HAS a horizon, so shipping that word would
   * be the record contradicting itself in the one field that says where the
   * light comes from. Reassembled from the same light reading against the
   * declared row; the measured half of the token is untouched. */
  key_dir: (declaredCamera && m._light)
    ? `${m._light.key_dir_measured}-${m._light.key_dir_brightest_y < horizonPx ? "ABOVE" : "BELOW"}`
    : m.key_dir,
  calibration_ref: m.calibration_ref,
  calibration_px: m.calibration_px,
  /* [row 29(a)] UNDER THE FIELD NAME ITS TYPE GIVES IT. The validator refuses a
   * walled meta that carries `camera_far_m` and an open one that carries
   * `camera_wall_m` (`row11:meta.walled_rejects_far`, `meta.open_rejects_wall`)
   * — "a depth model handed a far line as a wall distance puts a horizon where
   * a wall goes" — so exactly one of the two is written, and `far_line` beside
   * it, which is the drawing's own line and is what `deriveMeta` emits. */
  ...(isOpen ? { camera_far_m: drawn, far_line: fc.far_line }
             : { camera_wall_m: drawn }),
  facing_type: fc.type,
  wall_continuous: null,
  wall_segments: null,
  corner_x0_px: cornerX0,
  corner_x1_px: cornerX1,
  storey_height_m: null,
  camera_id: "measured:" + srcRel,
  /* WHICH OF THE TWO LAWFUL CAMERAS THIS WALL WAS ADMITTED AGAINST, carried so
   * that the validator centres its band where this promotion did. Without it
   * the refusal moves between the tool that writes the meta and the gate that
   * reads it, which is what happened on the first manor wall: promoted at the
   * ruled 1024 px it was commanded to draw, refused at the bake against the
   * study's measured 819.6. It is also what lets the promotion be RE-RUN from
   * the meta alone, exactly as `measured_round` is — `fixtures.spec`'s
   * staleness case reads both back off the meta and passes them to this tool. */
  camera_reference: refMode,
  /* WHICH ROUND MEASURED IT, so the promotion can be RE-RUN from the meta
   * alone. `fixtures.spec`'s staleness case re-derives every promoted meta by
   * running this tool again and byte-comparing, and it finds the candidate
   * through `camera_id`; once rounds have their own directories the candidate
   * is not enough — the tool has to be told where the measurement lives, and
   * an unstated round silently reads the cand-2 corpus, which is a DIFFERENT
   * painting's numbers. Null for the default directory. */
  measured_round: roundDir || null,
  instrument: m.instrument ?? null,          // which reader's reading this wall stands on (instrument.py)
  /* [row 32] AND WHERE ITS HORIZON CAME FROM, on the walls where that is not
   * the picture. Four fields, written only on this path so no ordinary
   * promotion's bytes move, and each one load-bearing somewhere else:
   * `camera_source` is what `fixtures.spec`'s staleness re-run reads back to
   * re-derive this file, `suspect_perspective` is the flag row 4's staging and
   * the flip test read off the baked meta, `tolerance_ruling` is the authority
   * a reader of the meta alone can follow, and `declared_fields` is the exact
   * licence — the horizon and nothing else, so the scale this wall was admitted
   * on can never be claimed as declared. The fixture validator refuses every
   * one of those four being wrong, by name. */
  ...(declaredCamera ? {
    camera_source: cameraSource,
    /* A WARPED FRAME IS NOT A SUSPECT ONE and its authority is not a ruling.
     * The flag says "this painting's perspective disagrees with its ruler and a
     * human accepted that"; a warped painting's perspective was CORRECTED, and
     * what a reader needs is the correction's own numbers, which are in
     * `measured_room.warp`. So those two fields belong to the tolerance path
     * and stay on it. */
    ...(warpRecord ? {} : {
      suspect_perspective: true,
      tolerance_ruling: TOLERANCE_RULING
    }),
    declared_fields: [...(warpRecord ? WARPED_CAMERA_FIELDS : DECLARED_CAMERA_FIELDS)]
  } : {}),
  provisional: false,
  measured: true,
  backdrop: fc.type === "open" ? "vista" : "wall",
  focal_px: round(focal, 1),
  nearest_floor_m: null,
  /* THE ROOM THE PAINTING DEPICTS, beside the room the plan rules — recorded
   * because they disagree and the disagreement must not live only in a gate's
   * printout. `study/N` paints a 3.00 m storey against a ruled 2.80 and a
   * 5.37 m wall against a ruled 5.45. The fields the renderer reads stay the
   * PLAN's, because topology and the metres a sprite is sized in are the
   * building's; these two are the painting's own, and they are informational.
   * Ruled WARN-TIER by the Navigator 2026-08-22: a measured meta reconciles
   * scale and sprites by construction, so nothing composited missizes, and the
   * clause may not become a failure until it has been clocked. */
  measured_room: {
    /* [row 29(a)] `round(null, 3)` IS 0 IN JAVASCRIPT, and an open facing is
     * the first wall to reach here with a null storey — an open space has no
     * ceiling to have a height to. Written as 0 it would say this vista's room
     * is nought metres tall, in the one field a reader consults to see where
     * the painting and the drawing disagree. Guarded the way the width beside
     * it already is. */
    storey_height_m: m._derived.storey_height_m == null ? null
      : round(m._derived.storey_height_m, 3),
    wall_width_m: m._derived.implied_wall_width_m == null ? null
      : round(m._derived.implied_wall_width_m, 3),
    ruled_storey_height_m: meta_storey_ruled(),
    ruled_wall_width_m: fc.wall_width_m,
    /* [THE WARP EXIT] WHAT THE CORRECTION COST, on the wall it was spent on.
     * Four numbers and no verdict: how many landmarks were pinned, how far the
     * field left each of them from its target, which strip of wall was
     * stretched most, and how many pixels of frame edge the motion revealed.
     * Nothing refuses on any of them - a picture is turned away only for what
     * it does not SHOW (`mesh_warp.py`'s three clauses) - and they are here so
     * that a reader of the meta alone can see what was done to the painting. */
    ...(warpRecord ? {
      warp: {
        pins: warpRecord.pins,
        residuals: warpRecord.residuals,
        worst_segment: warpRecord.worst_segment,
        revealed_px: warpRecord.revealed_px,
        ...(warpRecord.remeasured ? { remeasured: warpRecord.remeasured } : {}),
        ...(warpRecord.warped_from ? { warped_from: warpRecord.warped_from } : {}),
        ...(warpRecord.tool ? { tool: warpRecord.tool } : {})
      }
    } : {})
  },
  openings: []
};
function meta_storey_ruled() {
  const r = (plan.rooms || []).find((x) => x.id === loc);
  /* [row 29(a)] An OPEN facing has nothing overhead to have a height, and this
   * field is what the record compares the painting's room against — so on a
   * vista it is null rather than the floor's 2.8 m, which would be this record
   * saying the manor's front court is a two-storey room. Scoped to the FACING:
   * an enclosed facing of an open room (`privy_garden/N`, promoted) still
   * answers to its floor's storey, which is what its own painting draws. */
  if (isOpen) return null;
  const f2 = (plan.floors || []).find((x) => x.id === (r && r.floor));
  return (f2 && f2.storey_height_m != null) ? f2.storey_height_m : null;
}

/* The building's own half, taken from the plan rather than from the painting:
 * a wall's width, a room's height and where its doorways stand are facts the
 * drawing rules and the painting answers to. §12.5 (ii) is what holds the two
 * halves to each other — the corners MEASURED off the image against
 * `wall_width_m × px_per_m_at_wall` — and it is the first clause in this
 * project that can fail on a painting. */
const walls = wallSegments(plan, loc, facing);
meta.wall_segments = walls.segments;
meta.wall_continuous = walls.continuous;
const fl = (plan.floors || []).find((f) => f.id === room.floor);
meta.storey_height_m = (room.type === "open" || !fl) ? null : (fl.storey_height_m ?? null);
/* [F4] THROUGH THE ONE DEFINITION, not a second one that agrees on a facing
 * where the focal length happens to equal the frame height. `eyeM / (1 −
 * horizon_y)` is true only when `f` is 1024, which is what the RULED lens
 * gives and not what a measured painting does: it wrote 2.2295 where the
 * project's own `nearestFloorM` — `cam × ppm / ppm_bottom`, the definition
 * `plan.spec` pins and every derived meta carries — gives 2.1994. A second
 * formula for one number is how a 1.4 % measurement residual leaks into a
 * field that has no business carrying it. */
meta.nearest_floor_m = round(nearestFloorM(meta), 4);

/* THE DOORWAY, WHERE THE PAINTING PUT IT — row 27, and the reason this row
 * became urgent on the day the Captain first walked the painted manor: "library
 * door doesnt match up", "Multiple doors dont match up".
 *
 * Until this row the rectangle came off the PLAN projected through this meta,
 * and row 23 had already proved the painter ignores a position label: the door
 * arrives near the wall's middle wherever the drawing rules it. So on every
 * door-bearing promoted wall the painted door and the clickable hole stood
 * apart — and blueprint §11's law, "the painted opening must coincide with the
 * click target", was false on the shipped corpus. It is not only the click: the
 * renderer composites the destination room INTO this rectangle over a painted
 * backdrop (`drawThroughOpening`), so a rectangle beside the painted door pastes
 * the far room onto solid paint.
 *
 * WHAT GOVERNS. Blueprint §5 makes the approved image the geometric authority
 * and row 22 is the precedent — the plan amends to the painting. So on a
 * promoted wall the PAINTED door governs its own rectangle, and
 * `design/plan-draft/measured/door_measure.py` is the instrument that reads it:
 * the void's own stable edges, the lintel, and the wall's measured floor line.
 * Every candidate it can see arrives here; NOTHING about the plan reaches the
 * detector, so a wall whose painting disobeys reads as disobedient rather than
 * as obedient.
 *
 * WHAT DOES NOT MOVE. The world's exits: `library -> great_hall` is still
 * `library -> great_hall`, `id`, `via`, `kind` and the two `beyond_*` metres
 * are the plan's exactly as before. Only WHERE the hole is on the picture is
 * the painting's.
 *
 * WHICH SPACE THE COMPARISON IS MADE IN. A measured meta holds two horizontal
 * scales that diverge by up to 33 % across this corpus — the corner span a
 * click target lives in (§11) and `px_per_m_at_wall`, the ruler the camera gate
 * measures with. The width below is judged in the FIRST, because that is the
 * space the rectangle it is judging lives in; the second is printed beside it
 * so the divergence stays visible. */
const planned = openingsForFacing(plan, loc, facing, meta);
const plannedDoors = planned.filter((p) => p.kind === "door");
const painted = m._measured_px && Array.isArray(m._measured_px.openings)
  ? m._measured_px.openings : null;
const refusals = [];
/* [row 32, ATTACHED at row 39] A PAINTING THAT LOSES THE STAIRCASE IS NOT A
 * PROMOTION — and until this row nothing could give a promotion one.
 *
 * The renderer draws a flight from the meta's own `stairs`. Row 32 found that
 * a promoted meta had none, so promoting a facing whose room draws a flight
 * deleted the staircase from the picture and with it the poly the click
 * travels through (`great_stair_hall/W`: the sweep promoted it and
 * `manor.spec`'s "a flight seen across its run is a body, not a line" stopped
 * having a subject at all). What row 32 could do about that was refuse, and
 * refusing was right while nothing painted a staircase. Row 38 taught the
 * emitter to ASK for one and the re-asks came back with staircases in them,
 * at which point the refusal was standing over the very paintings it existed
 * to protect — because no act in this pipeline ATTACHED a flight to a promoted
 * meta. Doors got that act at row 27. This is the flight's.
 *
 * WHAT IS ATTACHED, AND WHOSE IT IS. `stairsForFacing` at THIS meta's own
 * geometry — the same call this clause already made to decide whether to
 * refuse, so the flight that is carried and the flight that was demanded are
 * one projection and cannot be two. The shape is the derived meta's exactly
 * (`deriveMeta` ends with this same call and the fixture validator's
 * `row15:meta.stairs_list` reads both), `raw_w`/`raw_h` included, so a page
 * built from a promoted stair wall and a page built from the plan's derived
 * one hold the same kind of record.
 *
 * HOW TRUE IT IS. On a DECLARED-camera wall (the row-32 tolerance route) and
 * on a SNAPPED one (a reading carrying `_snap`, where `row35_snap.py` has
 * rectified the frame ONTO the declared camera) the meta's geometry IS the camera the
 * page derives with, so the projection is exact by construction: the flight
 * lands where the same arithmetic put the scaffold box the painter was given.
 * On a measured-camera wall the geometry is this painting's own reading, so
 * the projection carries that reading's residual and nothing more — the same
 * residual every other number on the meta carries, already gated at +/-8 %.
 *
 * AND THE PERMISSION IS THE ASK'S, not the pixels'. See
 * `tools/flight-evidence.mjs`, which carries the measurement that settled it:
 * the structure statistic this clause was meant to gate on does not separate a
 * painted staircase from an empty room on the labelled corpus, and the ask
 * does, exactly. The reading is still taken and still recorded — below, on
 * `measured_room.flight_evidence` — because two artifacts can disagree and the
 * disagreement must never be invisible. */
const drawnFlights = stairsForFacing(plan, loc, facing, meta) || [];
let flightEvidence = null;
if (drawnFlights.length) {
  const ask = askTextFor(root, candidate, m, join);
  if (ask.text == null) {
    refusals.push(`${facingArg}: the plan draws ${drawnFlights.length} flight(s) in this view (${drawnFlights.map((s2) => s2.id).join(", ")}) and there is no readable ask beside ${candidate} (${ask.path}) — a flight is attached to a promoted meta only from a candidate that can be SHOWN to have been asked for one, and a candidate whose prompt is gone cannot be [row39:stair.ask_unreadable]`);
  } else if (!askNamesAFlight(ask.text)) {
    /* THE RE-ASK BRANCH. This is the wall the emitter has to paint again, and
     * the message says which act closes it rather than only what is wrong. */
    refusals.push(`${facingArg}: the plan draws ${drawnFlights.length} flight(s) in this view (${drawnFlights.map((s2) => s2.id).join(", ")}) and the ask ${candidate} was painted from never named a staircase (${ask.path}, read ${ask.via || "beside the candidate"}) — this roll was asked for before the flight language existed, so the picture cannot be shown to hold the staircase the room holds, and promoting it leaves a player looking at the place a stair used to be. Its own re-ask under the flight paragraph is the candidate for this wall [row32:stair.painted_flight_lost]`);
  } else {
    /* THE ATTACHING BRANCH — after one more question, which the first walls
     * through this door made unavoidable.
     *
     * WHOSE u-DOMAIN THE FLIGHT LANDS IN, and why that can be the wrong one.
     * `xAtScale` maps `u` across the wall through the meta's CORNERS where it
     * has them, and a promoted meta's corners are what someone measured off
     * this painting. The painter, meanwhile, was given a scaffold box computed
     * from the DRAWING's own camera, and `flight.spec` pins the prompt's stated
     * columns to exactly that box. So a wall whose corner reading is off puts
     * the projected flight somewhere the painted staircase is not, and nothing
     * else on the wall notices: a painted DOOR is measured off the picture
     * (row 27) and is immune, and the grid and the staging are drawn in the
     * same displaced domain and so agree with each other.
     *
     * `great_stair_hall/W` is the case, found by rendering the attachment over
     * its own painting: its corner detector read the staircase's own stringer
     * against the wainscot as the wall's right-hand return and returned
     * 219..944 for a wall the picture centres — a wall centre 186 px left of
     * the frame's — and the flight came out 1.19 m along the wall from where
     * the ask put it, running up the window instead of the stair.
     *
     * THE TEST CARRIES NO NUMBER SOMEBODY CHOSE: THE TWO READINGS MUST AGREE
     * ABOUT MORE OF THE STAIRCASE THAN THEY DISPUTE. Rasterise both bodies on
     * the frame; the agreed part is their intersection and the disputed part
     * is everything else in their union, and the agreed part has to be at
     * least as large as the disputed one. (That is `intersection / union >=
     * 1/2` written out, which is where the one halving in this clause comes
     * from — the definition of "as much as", not a tuned bound.)
     *
     * A DISPLACEMENT IN METRES WOULD NEED A BOUND, and a "does the middle of
     * one land inside the other" test is too weak to be one: on
     * `great_stair_hall/W` both centroids DO land inside, because two long
     * triangles crossing at a shallow angle contain each other's middles while
     * their treads run up two different parts of the picture. The area is what
     * a player's aim actually meets.
     *
     * MEASURED OVER THE PART ON THE FRAME, because a run climbing out of the
     * picture diverges without bound at depth and the tail of it is not what
     * anybody clicks.
     *
     * On this corpus: `great_stair_hall/W` agrees about 41 % and disputes 59 %
     * — refused, and the overlay of its own meta over its own painting shows
     * exactly that, the treads running up the window instead of the stair.
     * `stair_landing/N` agrees about 61 % — attached.
     *
     * AND IT IS THE WALL'S CORNERS THAT ARE WRONG, not the flight. The refusal
     * says so, because the fix is a re-read of that wall and not a repaint. */
    const byPlan = stairsForFacing(plan, loc, facing, deriveMeta(plan, loc, facing));
    const apart = [];
    for (const s of drawnFlights) {
      const there = byPlan.find((b) => b.id === s.id);
      if (!there) continue;
      const A = flightMask([s], CANVAS_W, imageH).mask;
      const B = flightMask([there], CANVAS_W, imageH).mask;
      const ca = maskCentroid(A, CANVAS_W), cb = maskCentroid(B, CANVAS_W);
      if (!ca || !cb) continue;
      let inter = 0, uni = 0;
      for (let i = 0; i < A.length; i++) { if (A[i] && B[i]) inter++; if (A[i] || B[i]) uni++; }
      const aInB = !!B[Math.round(ca.y) * CANVAS_W + Math.round(ca.x)];
      const bInA = !!A[Math.round(cb.y) * CANVAS_W + Math.round(cb.x)];
      const agreed = uni ? inter / uni : 0;
      apart.push({
        id: s.id,
        agreed_px: inter, disputed_px: uni - inter, agreed_of_union: round(agreed, 3),
        aim_of_this_lands_on_the_ask: aInB, aim_of_the_ask_lands_on_this: bInA,
        apart_px: round(Math.hypot(ca.x - cb.x, ca.y - cb.y), 1),
        apart_m: round(Math.hypot(ca.x - cb.x, ca.y - cb.y) / ppm, 3),
        over: !(inter >= uni - inter)
      });
    }
    const over = apart.filter((a) => a.over);
    if (over.length) {
      refusals.push(`${facingArg}: ${over.map((a) => `this meta and the ask disagree about where the flight "${a.id}" stands — they agree about ${a.agreed_px} px of it and dispute ${a.disputed_px}, ${round(a.agreed_of_union * 100, 0)}% of their union, with the two bodies ${a.apart_m} m apart`).join("; ")} — a flight is carried only where the two readings of the wall agree about more of the staircase than they dispute, because the disputed part is where a player aims and finds no stair. The wall's own corners are the reading to look at: this meta carries ${meta.corner_x0_px}..${meta.corner_x1_px} px, a span of ${round((meta.corner_x1_px || 0) - (meta.corner_x0_px || 0), 0)} against the ${round(fc.wall_width_m * ppm, 0)} its ${fc.wall_width_m} m implies, and a staircase standing against a wainscot is exactly what a recession detector reads as a return [row39:stair.projection_disagrees]`);
    } else {
      /* The reading is taken here, so that a wall whose pixels disagree with
       * its own ask is on the record even though nothing refuses it:
       * `flight-evidence.mjs` explains at length why nothing does. */
      flightEvidence = paintedFlightReading(join(root, candidate), drawnFlights, CANVAS_W);
      flightEvidence.asked = { prompt: ask.path, via: ask.via };
      /* WHICH ROUTE THIS FLIGHT CAME IN ON, read off the READING and not off
       * the round's NAME. A rectified frame says so in its own `_snap` block —
       * the same field `askTextFor` follows back to the roll — so a snapped
       * candidate promoted under any round records the geometry it actually
       * has. Keyed on the string `row35snap`, the second snapped round this
       * project opens would write "this painting's own measured camera" onto a
       * meta whose camera is the declared one, which is the record lying about
       * itself for want of a name. No promoted meta's bytes move: the store's
       * two snapped walls draw no flight and carry no `flight_evidence`. */
      flightEvidence.geometry = declaredCamera ? "declared-camera; the horizon is the drawing's, the u-domain this painting's own corners"
        : m._snap ? "snapped onto the declared camera; the u-domain is this painting's own corners"
          : "this painting's own measured camera";
      flightEvidence.against_the_ask = apart;
      meta.stairs = drawnFlights;
    }
  }
}
/* AND NO SECOND ASSERTION THAT THE ATTACHMENT HAPPENED, deliberately. The
 * obvious next line is a post-condition here — "the meta about to be written
 * carries the flights the plan draws" — and it is the shape this project keeps
 * paying for: it cannot be reached by doctoring any input, so it is a clause
 * with no case, which is a gate that cannot fail. What holds the attachment is
 * `plan.spec`'s own arm, which promotes `great_stair_hall/W` in a staged tree
 * and reads `meta.stairs` off the file; deleting the assignment above turns it
 * red, and that was verified by doing it. One token, one emit site, one case —
 * the ledger's own rule, which the completeness scan enforces by counting. */
/* Assigned by id, so the loop that writes the openings and the loop that writes
 * the carrier record read one answer rather than each computing its own. */
const assigned = new Map();
if (plannedDoors.length && painted === null) {
  console.error(`promote refused: ${measuredFile} carries no door reading, and the plan puts ${plannedDoors.length} way(s) through this facing. Run design/plan-draft/measured/door_measure.py --facing ${facingArg}${roundDir ? ` --round ${roundDir}` : ""} first — a promoted door's rectangle is measured off the painting, never projected onto it.`);
  process.exit(1);
}
if (plannedDoors.length) {
  /* THE ASSIGNMENT IS ORDER-PRESERVING BY CONSTRUCTION. Which painted hole is
   * which doorway is not a free choice: doorways keep their order along a wall
   * however far the painter slides them, so the assignment is the increasing
   * run of candidates that costs the least total displacement, found by
   * dynamic programming rather than by a nearest-neighbour walk that can cross
   * two doors over each other on a wall that carries two. */
  const doorsByX = [...plannedDoors].sort((a, b) => (a.x + a.w / 2) - (b.x + b.w / 2));
  const cands = [...painted].sort((a, b) => a.centre_px - b.centre_px);
  const n = doorsByX.length, k = cands.length;
  const INF = Infinity;
  const cost = Array.from({ length: n + 1 }, () => new Array(k + 1).fill(INF));
  const back = Array.from({ length: n + 1 }, () => new Array(k + 1).fill(-1));
  for (let j = 0; j <= k; j++) cost[0][j] = 0;
  for (let i = 1; i <= n; i++) {
    for (let j = i; j <= k; j++) {
      const c = cost[i - 1][j - 1] +
        Math.abs(cands[j - 1].centre_px - (doorsByX[i - 1].x + doorsByX[i - 1].w / 2));
      const skip = cost[i][j - 1];
      if (c <= skip) { cost[i][j] = c; back[i][j] = j - 1; }
      else { cost[i][j] = skip; back[i][j] = back[i][j - 1]; }
    }
  }
  if (cost[n][k] === INF) {
    refusals.push(`${facingArg}: the plan rules ${n} way(s) through this wall and the painting shows ${k} — a doorway the world walks through with no hole in the picture is not promotable, because a player would click on paint [row27:door.unmeasured_exit]`);
  } else {
    let j = k;
    for (let i = n; i >= 1; i--) {
      const pick = back[i][j];
      assigned.set(doorsByX[i - 1].id, cands[pick]);
      j = pick;
    }
  }
}
/* THE PAINTED HOLE MUST PLAUSIBLY BE A DOORWAY. Blueprint §11 rules every
 * opening in this building at 1.00 m wide; the ruled rectangle at the corner
 * span's own scale is what that is in pixels on this wall. A reading is
 * admitted between HALF and ONE AND A HALF of it, and the band is that wide on
 * purpose and for a stated reason: what is measured is the VOID, whose edges
 * are the reveal's on the inside and the architrave's on the outside, and §11
 * rules neither — so this is a floor on doorway-ness ("is that a way a person
 * walks through") and not a scale tolerance. Half a ruled leaf is 0.50 m, which
 * nobody walks through; one and a half is 1.50 m, wider than any single-leaf
 * opening the plan draws anywhere in the manor. The SCALE of the wall is
 * already gated, at ±8 %, by the lens band above; asking this reading to carry
 * a second scale verdict would score the architrave as a camera error. */
/* The ruled door width is the ACTIVE PACK's building practice, not this
 * file's (clause 8): a plan view holds no vertical dimension and no ruled
 * opening size, so the world states it and every instrument reads the same
 * number. It is the fallback for a door the plan does not dimension. */
const RULED_DOOR_M = activePack().world.conventions.door_width_m;
const DOORWAY_BAND = [0.50, 1.50];
const apertureScale = (meta.corner_x1_px != null && meta.corner_x0_px != null &&
                       fc.wall_width_m > 0)
  ? (meta.corner_x1_px - meta.corner_x0_px) / fc.wall_width_m : ppm;
/* ...AND THE PLAN DOES NOT RULE THEM ALL AT 1.00 m. `op01` (court → great
 * hall) and `op10` (great hall → garden) are drawn 1.60 m wide, and judged
 * against a fixed 1.00 m both facings of op01 refused at 1.51× and 2.42× while
 * painting the door the plan itself drew. The band is a floor on doorway-ness,
 * so it is taken against the plan's OWN width for that opening; 1.00 m stands
 * only where the plan gives no width. */
const planWidthM = new Map(facingCarriers(plan, loc, facing).filter((c) => c.kind === "door").map((c) => [c.id, c.width_m]));
for (const [id, cand] of assigned) {
  const ownM = planWidthM.get(id) > 0 ? planWidthM.get(id) : RULED_DOOR_M;
  const ruledPx = ownM * apertureScale;
  const ratio = cand.width_px / ruledPx;
  if (ratio < DOORWAY_BAND[0] || ratio > DOORWAY_BAND[1]) {
    refusals.push(`${facingArg}: the way through the painting shows for "${id}" is ${cand.width_px} px — ${ratio.toFixed(2)}× the ${ruledPx.toFixed(1)} px the plan's own ${ownM.toFixed(2)} m opening spans at this wall's corner scale (${apertureScale.toFixed(1)} px/m; its ruler reads ${ppm.toFixed(1)}), outside ${DOORWAY_BAND[0]}–${DOORWAY_BAND[1]}× — that is not a doorway, whatever else it is [row27:door.painted_width]`);
  }
}
/* ------------------------------------------------------------------ */
/* [row 43] THE APERTURE IS THE TRACED LOOP, NOT THE VOID'S BOX          */
/* ------------------------------------------------------------------ */
/* `door_measure` reads the VOID — the maximally stable dark run — and that is
 * the right evidence and the wrong answer: a void's dark run stops where the
 * paint stops being black, which on any door with a reveal is short of the
 * jamb. [HUMAN, 2026-08-29, verbatim] "What I want is INSIDE EDGE of door
 * corners detection, then geometry lines connecting all 4 corners. Not all
 * image gen is going to make a perfect rectangle."
 *
 * So the measured rectangle is DEMOTED TO A PRIOR and
 * `design/plan-draft/measured/aperture_trace.py` traces the inside edge off the
 * same pixels, with this wall's own floor line for the threshold (the bottom of
 * an aperture in a wall is where that wall meets its floor; there is no paint
 * there to trace). What comes back is written onto the opening whatever it
 * says — the polygon, its four corners, the head's verdict and the trace's own
 * confidence.
 *
 * AND THE RECTANGLE IS THE FALLBACK, BY NAME. Below TRACE_MIN_CONFIDENCE the
 * loop is recorded and NOT used: `polygon_used: false` says the aperture this
 * meta ships is still the measured box, and the polygon is there for a person
 * to look at. A promotion that refused the wall instead would send back a
 * painting whose door the old instrument reads perfectly well, which is a
 * refusal nobody asked for.
 *
 * WHERE IT IS USED, x/y/w/h ARE THE POLYGON'S BOUNDING BOX. Every reader that
 * has only ever known the rectangle — the leaf's sprite fit, the overlap gate,
 * the plan-projection comparison, the page's fallback hit test — keeps reading
 * a rectangle, and it is now the rectangle the traced aperture actually spans.
 */
const APERTURE_TRACE_PY = join(root, "design", "plan-draft", "measured", "aperture_trace.py");
const TRACE_MIN_CONFIDENCE = 0.5;
/* The trace needs the floor line in image px, which is exactly what this meta
 * already carries as `floor_line_y x image_h_px`. Null where the wall has no
 * floor line: the tracer then says so in its own `threshold` record rather
 * than being handed a guess. */
const traceFloorY = (floorLineY != null && imageH > 0) ? floorLineY * imageH : null;
function traceAperture(x0, y0, x1, y1) {
  const out = join(mkdtempSync(join(tmpdir(), "holo-aperture-trace-")), "trace.json");
  const argv = [APERTURE_TRACE_PY, "--image", candidate,
    "--rect", [x0, y0, x1, y1].map((v) => round(v, 2)).join(","),
    "--json", out];
  if (traceFloorY != null) argv.push("--floor-line-y", String(round(traceFloorY, 2)));
  const r = spawnSync("python3", argv, { cwd: root, encoding: "utf8" });
  if (r.status !== 0 || !existsSync(out)) {
    /* NOT A REFUSAL, AND NOT A SILENCE EITHER. The trace is an instrument that
     * needs numpy and Pillow; where it cannot run, the promotion still writes
     * the rectangle every reader already understood, and says on stderr that
     * this wall shipped without a traced loop. */
    console.error(`promote note: aperture_trace could not read ${candidate} (${((r.stderr || "").trim().split("\n").pop() || `exit ${r.status}`)}) — this opening ships its measured rectangle and no polygon`);
    return null;
  }
  try { return JSON.parse(readFileSync(out, "utf8")); } catch { return null; }
}
function polygonBox(poly) {
  const xs = poly.map((q) => q[0]), ys = poly.map((q) => q[1]);
  const x0 = Math.min(...xs), y0 = Math.min(...ys);
  return { x: x0, y: y0, w: Math.max(...xs) - x0, h: Math.max(...ys) - y0 };
}
for (const p of planned) {
  const cand = assigned.get(p.id) || null;
  /* Only a MEASURED opening is traced. A projected rectangle is the plan's
   * drawing, and running an edge tracer over the paint under it would answer a
   * question about the painting with a prior nobody measured off it. */
  const traced = (cand && p.kind === "door")
    ? traceAperture(cand.x0_px, cand.y0_px, cand.x1_px, cand.y1_px) : null;
  const box = (traced && traced.wall_confidence >= TRACE_MIN_CONFIDENCE
    && (traced.polygon || []).length >= 3) ? polygonBox(traced.polygon) : null;
  meta.openings.push({
    id: p.id,
    /* [Standing-eye wave] THE KIND COMES ACROSS TOO, and until this row nothing
     * noticed it did not: row 15 made `kind` a required field of every opening
     * — the renderer draws a jamb and the room beyond through a `door` and
     * nothing at all through a `threshold` — and no promoted meta had ever
     * carried an opening, because the one promoted wall was the study's
     * hearth wall. `study/E` is the first painted facing with a doorway in it,
     * and the bake refused its meta on this clause the first time it was
     * written. The kind is the plan's, like the two `beyond_*` metres beside
     * it: what a way through IS is a fact about the building. */
    kind: p.kind,
    via: p.via,
    x: round(box ? box.x : (cand ? cand.x0_px : p.x), 2),
    y: round(box ? box.y : (cand ? cand.y0_px : p.y), 2),
    w: round(box ? box.w : (cand ? cand.width_px : p.w), 2),
    h: round(box ? box.h : (cand ? (cand.y1_px - cand.y0_px) : p.h), 2),
    beyond_m: p.beyond_m,
    beyond_offset_m: p.beyond_offset_m,
    depth_m: (typeof p.depth_m === "number") ? p.depth_m : null,   // the wall's thickness at this opening (plan)
    measured: !!cand,
    /* [row 43] The traced loop, its four corners, what the head is and how much
     * of it the evidence licensed — written whether or not it is USED, because
     * a trace nobody can see is a trace nobody can check. */
    ...(traced ? {
      polygon: traced.polygon,
      corners: traced.corners,
      head_kind: traced.head_kind,
      trace_confidence: round(traced.wall_confidence, 4),
      polygon_used: !!box
    } : {})
  });
}
/* AND NO TWO WAYS THROUGH ARE THE SAME PIXELS. Two rectangles that overlap are
 * one hole the page will hand to two exits, and the second one is unreachable:
 * whichever `go` target is hit-tested first eats the click, and a player who
 * can see two doors can walk through one. The check is over every opening this
 * meta carries and not only the measured ones, because a measured hole sliding
 * onto a projected threshold is the same defect from the other side. */
for (let a = 0; a < meta.openings.length; a++) {
  for (let b = a + 1; b < meta.openings.length; b++) {
    const A = meta.openings[a], B = meta.openings[b];
    const lo = Math.max(A.x, B.x), hi = Math.min(A.x + A.w, B.x + B.w);
    if (hi > lo && Math.min(A.y + A.h, B.y + B.h) > Math.max(A.y, B.y)) {
        refusals.push(`${facingArg}: openings "${A.id}" (${A.x}..${round(A.x + A.w, 1)}) and "${B.id}" (${B.x}..${round(B.x + B.w, 1)}) share ${round(hi - lo, 1)} px of this wall — one hole cannot be two ways through, and the second one is a control nobody can reach [row27:door.painted_overlap]`);
    }
  }
}
/* ------------------------------------------------------------------ */
/* [row 42] THE WINDOW, WHERE THE PAINTING PUT IT                       */
/* ------------------------------------------------------------------ */
/* [HUMAN, 2026-08-24, verbatim] "after the fact detect the door location on the
 * image and put the effective door geometry in the images doorframe? Same with
 * stairs, maybe Windows? Then we can have door assets and window assets we
 * literally place in the door frame to open/close and same with the windows"
 *
 * This is row 27's clause with a different opening in it, and it is here for
 * the same reason: a casement sprite placed from the PLAN would stand beside
 * the painted window exactly as the clickable hole once stood beside the
 * painted door — "library door doesnt match up", the Captain, walking the
 * building. Blueprint §5 makes the approved image the geometric authority and
 * row 22 is the precedent, so ON A PROMOTED WALL THE PAINTED WINDOW GOVERNS ITS
 * OWN RECTANGLE, and `design/plan-draft/measured/window_measure.py` is the
 * instrument that says where it is.
 *
 * TWO THINGS ARE DIFFERENT FROM THE DOOR, and both are stated rather than
 * inherited:
 *
 *   THE VERTICAL IS MEASURED TOO. A doorway's foot is the wall's own floor
 *   line, so row 27 needed only the head. A window floats: it has a sill AND a
 *   head, the plan rules them at 0.90 and 2.00 m, and every overlay of this
 *   corpus shows the paintings drawing them taller than that. So `y` and `h`
 *   come off the painting like `x` and `w`, inside a clamp.
 *
 *   THE COUNT IS GATED IN ONE DIRECTION ONLY. A window the plan rules and the
 *   painting does not show is a REFUSAL — a casement placed on blank wall is
 *   the row's own defect — while a window the painting shows that the plan does
 *   not rule is RECORDED and nothing else. It is the plan that amends to the
 *   painting here (row 22), so an extra painted window is a fact about the
 *   drawing to be looked at, not a reason to send a good painting back.
 *
 * AND IT IS SILENT WHERE NOTHING WAS READ, which is a boundary and not an
 * exemption. `meta.windows` is written where the measurement carries a window
 * reading and is absent where it does not, so a wall measured before this row
 * promotes exactly as it did. What closes it is the sweep: `row23_run.py`'s
 * `window_reading` runs beside `door_reading` on every reading it takes from
 * here on, so the set of walls this clause cannot see can only shrink, and
 * `design/plan-draft/measured/window_calibration.json` is the list of them. */
const plannedWindows = windowsForFacing(plan, loc, facing, meta);
const paintedWindows = m._measured_px && Array.isArray(m._measured_px.windows)
  ? m._measured_px.windows : null;
if (paintedWindows !== null) {
  /* THE ASSIGNMENT IS ORDER-PRESERVING BY CONSTRUCTION, the same dynamic
   * programme the doorway assignment above runs on and for the same reason:
   * windows keep their order along a wall however far the painter slides them,
   * and a nearest-neighbour walk can cross two of them over each other on a
   * wall that carries four — which the long gallery does. */
  const byX = [...plannedWindows].sort((a, b) => (a.x + a.w / 2) - (b.x + b.w / 2));
  const cands = [...paintedWindows].sort((a, b) => a.centre_px - b.centre_px);
  const n = byX.length, k = cands.length;
  const INF = Infinity;
  const cost = Array.from({ length: n + 1 }, () => new Array(k + 1).fill(INF));
  const back = Array.from({ length: n + 1 }, () => new Array(k + 1).fill(-1));
  for (let j = 0; j <= k; j++) cost[0][j] = 0;
  for (let i = 1; i <= n; i++) {
    for (let j = i; j <= k; j++) {
      const c = cost[i - 1][j - 1] +
        Math.abs(cands[j - 1].centre_px - (byX[i - 1].x + byX[i - 1].w / 2));
      const skip = cost[i][j - 1];
      if (c <= skip) { cost[i][j] = c; back[i][j] = j - 1; }
      else { cost[i][j] = skip; back[i][j] = back[i][j - 1]; }
    }
  }
  const assignedW = new Map();
  let windowUnpainted = 0;
  if (cost[n][k] === INF) {
    /* [2026-08-29, audit step 7] RECORDED, NOT GATED: the window read refused
     * three walls that plainly paint their window (row 42's lift threshold on
     * bright walls). The count disagreement is written on the meta as
     * evidence; a leaf sprite simply is not placed where no light was read. */
    windowUnpainted = n - k;
    console.error(`  windows: the plan rules ${n} on this wall and the read shows ${k} — recorded as window_evidence.unpainted, not gated [row42:window.unpainted recorded]`);
  } else {
    let j = k;
    for (let i = n; i >= 1; i--) {
      const pick = back[i][j];
      assignedW.set(byX[i - 1].id, cands[pick]);
      j = pick;
    }
  }
  /* THE PAINTED LIGHT MUST PLAUSIBLY BE THIS WINDOW. Judged against the plan's
   * OWN width for that window rather than a fixed one — the manor draws windows
   * from 1.40 m to 1.50 m and the band is a floor on window-ness, not a scale
   * verdict, exactly as row 27 argues for its doorways. The scale of the wall is
   * already gated at ±8 % by the lens band above. The band is wider than the
   * door's because what is measured is the LIGHT and the plan rules the
   * OPENING: a stone surround eats a hand's width off each side, and a bay
   * painted with its reveals showing reads wider than its own rect. */
  const WINDOW_BAND = [0.35, 1.90];
  const apScale = (meta.corner_x1_px != null && meta.corner_x0_px != null &&
                   fc.wall_width_m > 0)
    ? (meta.corner_x1_px - meta.corner_x0_px) / fc.wall_width_m : ppm;
  const planWinM = new Map(plannedWindows.map((w) => [w.id, w.width_m]));
  for (const [id, cand] of assignedW) {
    const ownM = planWinM.get(id) > 0 ? planWinM.get(id) : 1.40;
    const ruledPx = ownM * apScale;
    const ratio = cand.width_px / ruledPx;
    if (ratio < WINDOW_BAND[0] || ratio > WINDOW_BAND[1]) {
      refusals.push(`${facingArg}: the glazed opening the painting shows for "${id}" is ${cand.width_px} px — ${ratio.toFixed(2)}× the ${ruledPx.toFixed(1)} px the plan's own ${ownM.toFixed(2)} m window spans at this wall's corner scale (${apScale.toFixed(1)} px/m; its ruler reads ${ppm.toFixed(1)}), outside ${WINDOW_BAND[0]}–${WINDOW_BAND[1]}× — that is not a window, whatever else it is [row42:window.painted_width]`);
    }
  }
  meta.windows = [];
  for (const w of plannedWindows) {
    const cand = assignedW.get(w.id) || null;
    meta.windows.push({
      id: w.id,
      kind: "window",
      x: round(cand ? cand.x0_px : w.x, 2),
      y: round(cand ? cand.y0_px : w.y, 2),
      w: round(cand ? cand.width_px : w.w, 2),
      h: round(cand ? (cand.y1_px - cand.y0_px) : w.h, 2),
      sill_m: cand && cand.sill_m != null ? cand.sill_m : w.sill_m,
      head_m: cand && cand.head_m != null ? cand.head_m : w.head_m,
      measured: !!cand
    });
  }
  /* THE PAINTING'S OWN EXTRA WINDOWS, recorded and never gated. The plan amends
   * to the painting (row 22), so a glazed opening the drawing does not rule is
   * something for a human to look at with the calibration table beside them —
   * not a reason to refuse a wall that is doing its job. */
  const taken = new Set([...assignedW.values()]);
  const extra = paintedWindows.filter((c) => !taken.has(c));
  meta.window_evidence = {
    unpainted: windowUnpainted,
    read_by: "design/plan-draft/measured/window_measure.py",
    ruled: plannedWindows.length,
    painted: paintedWindows.length,
    unruled: extra.map((c) => ({
      x: round(c.x0_px, 2), y: round(c.y0_px, 2),
      w: round(c.width_px, 2), h: round(c.y1_px - c.y0_px, 2),
      lattice: c.lattice ? c.lattice.score : null, lift: c.lift ?? null
    })),
    note: extra.length
      ? "the painting shows glazed opening(s) the plan does not rule; recorded, never gated - the plan amends to the painting (row 22) and this is the list to amend from"
      : "every glazed opening the painting shows answers to a window the plan rules"
  };
}

/* ------------------------------------------------------------------ */
/* [row 40] THE ROOM'S RULING MATERIALS WERE ACTUALLY ASKED FOR         */
/* ------------------------------------------------------------------ */
/* THE ORIGIN CLAUSE. Row 40 measured five rooms Kabe saw as two rooms each,
 * and the hunt for the cause ended in the asks: their facings had been
 * commissioned, verbatim, from DIFFERENT materials. The manor's 85 packets
 * went out at 2026-08-23 03:54 under a composer that keyed materials on
 * `room.archetype` and fell through to the panelled-parlour default; row 29's
 * voice table landed at 11:03 and re-emitted THIRTEEN walls under it. Every
 * other facing kept the ask it already had, because `--emit-manor` skips a
 * facing that is promoted or has candidates on disk. From that hour on,
 * whether a facing spoke its room's voice was decided by whether it happened
 * to need a re-ask - a camera property deciding a room property. All five
 * rooms split exactly along it.
 *
 * The forward half of the cure is that `manorPrompt` now composes every
 * material sentence in one place (`materialParts`). This is the backward half,
 * and it is the one that matters, because the store is what the player walks
 * through: A CANDIDATE MAY NOT ENTER THE STORE UNLESS ITS OWN ASK NAMED THE
 * MATERIALS THIS PLAN RULES FOR ITS ROOM. It is the row-29 vista clause
 * generalised - that one asks whether an OUTDOOR wall was asked as an outdoor
 * one, this asks whether ANY wall was asked as its own room - and it is
 * checked on the ASK rather than on the picture for the same reason: a
 * painting that obeyed the wrong instruction passes every geometric gate this
 * project owns, exactly as `entrance_court/S` did.
 *
 * WHAT MAKES IT A NO-OP ON A CLEAN RUN, and the honest statement of its cost:
 * the sentences come from the same `rulingSentences` the emitter composes
 * with, so any packet this emitter cuts passes by construction. It can only
 * fire on a candidate asked under a superseded voice - which is precisely the
 * event nothing was watching for. Compare `--audit-materials` for the reading
 * over the walls already promoted; this clause holds the door from here on.
 *
 * TWO THINGS ABOUT WHERE IT SITS AND HOW IT READS.
 *
 * The ask is resolved the way row 39 already resolves one, through
 * `askTextFor`, so a SNAPPED candidate is read through the roll it was
 * rectified from rather than refused for having no sidecar of its own. Row 35
 * writes `backdrops/source-snapped/<wall>/snapped.png`, which never had a
 * prompt beside it and never should: the ask that made the picture is the
 * roll's, and the snap is a rectification of that picture, not a second one.
 * Two clauses reading one file by two rules is how they drift apart.
 *
 * And it speaks WITH the other collected refusals rather than ahead of them.
 * Row 39 already refuses a flight wall whose ask cannot be read
 * (`row39:stair.ask_unreadable`); an early exit here answered that wall with
 * the general clause instead of the specific one - one token displacing
 * another, which is exactly what the clause ledger's one-token-one-arm rule
 * exists to keep visible. The specific clause speaks first where it applies
 * and this one covers every wall it does not. */
const askRead = askTextFor(root, candidate, m, join);
{
  const alreadySaid = refusals.some((r) => r.includes("row39:stair.ask_unreadable"));
  const { voice } = voiceFor(plan, loc, facing);
  if (!askRead.text && !alreadySaid) {
    refusals.push(`${facingArg}: there is no recoverable ask behind ${candidate} (${askRead.path}) - a wall is promoted only from an ask that can be SHOWN to have named this room's own materials, and an unrecoverable ask is not evidence that it did [row40:material.ask_unreadable]`);
  }
  if (askRead.text) {
    const { rects } = scaffoldRects(plan, loc, facing, deriveMeta(plan, loc, facing));
    const want = rulingSentences({
      voice, loc, out: !!voice.outdoor,
      openSide: rects.some((r) => r.kind === "open_edge"),
      built: rects.some((r) => r.kind !== "open_edge")
    });
    const flat = normMaterial(askRead.text);
    const absent = Object.entries(want)
      .filter(([, v]) => v && !flat.includes(normMaterial(v)));
    /* THE LEDGER, NOT AN EXEMPTION. Thirty-six of the sixty-one paintings
     * already in the store were made before this clause could exist - they were
     * asked before row 29's voice table - and a gate that
     * refused them all would refuse the corpus rather than the defect. Production
     * law clause 2 says what to do instead: log the miss with its why, in a
     * machine-readable file, and CLOSE it when the cause is baked in. So the
     * legacy walls are admitted by NAME AND BY CANDIDATE BYTES - the exact pair
     * that was promoted before the clause landed - and by nothing else.
     *
     * WHAT MAKES IT A LEDGER RATHER THAN A LOOPHOLE: the list can only shrink.
     * A re-ask produces a new candidate id, which is not in the list, so a wall
     * repaired under this clause can never fall back through it; and a wall
     * NOBODY repairs stays visible in the file with its own `why` instead of
     * disappearing into a silent pass. It is written once, by
     * `--audit-materials --seal-legacy`, and reviewed like any other ledger. */
    const ledgerPath = join(root, "design", "plan-draft", "measured", "material_legacy.json");
    const ledger = existsSync(ledgerPath)
      ? (JSON.parse(readFileSync(ledgerPath, "utf8")).admitted || {}) : {};
    const admitted = ledger[facingArg];
    if (absent.length && admitted && admitted.candidate === candidate) {
      console.error(`promote: ${facingArg} is a LEGACY material admission - its ask predates the ` +
        `\`${voice.id}\` voice and names no ${absent.map(([k]) => k).join(" or ")} this plan rules. ` +
        `Admitted by design/plan-draft/measured/material_legacy.json, which names this exact ` +
        `candidate and no other. The miss stays OPEN until this wall is re-asked.`);
      /* AND IT CARRIES NO LEDGER TOKEN, deliberately. The clause ledger's tokens
       * name REFUSALS - one token, one emit site, one red case - and this is a
       * pass with a note. A token here would ride along in the stderr of every
       * other clause's red case that happens to fire on a legacy wall, and
       * `everyArm` would start seeing two tokens where the case names one. */
    } else if (absent.length) {
      refusals.push(`${facingArg}: it was painted from an ask that never named this room's ` +
        `ruled ${absent.map(([k]) => k).join(" or ")}. The \`${voice.id}\` voice rules ` +
        absent.map(([k, v]) => `${k} = "${v}"`).join("; ") +
        ` and the ask ${askRead.path} (${askRead.via}) says none of it. A room whose ` +
        `facings are commissioned from different materials is painted as two rooms and reads as two ` +
        `rooms when you turn - that is row 40's whole finding. Re-ask this wall with ` +
        `\`node tools/make-scaffold.mjs --emit-consistency --from-ask --wall ${facingArg}\` ` +
        `[row40:material.voice_stale]`);
    }
  }
}
if (refusals.length) {
  for (const r of refusals) console.error("promote refused: " + r);
  process.exit(1);
}

/* [F1] WHERE THE PLAN PUTS THIS WALL'S CARRIERS, AND WHERE THE PAINTING PUT
 * THEM. The gate asks whether a candidate was painted at the project's camera.
 * It does not ask whether the room in the picture is the room the plan draws,
 * and on the very first promoted wall those two answers differ: the approved
 * plan puts the study's chimney breast at 1.65-3.85 m along the north wall —
 * dead centre of frame — and the painting puts its fireplace opening at
 * 0.87-1.78 m, its centre 1.4 m from where the document holds it. An artifact
 * critic found that, and nothing in this project could have.
 *
 * It is recorded, per carrier, in the meta and printed here. It is NOT made a
 * refusal by an agent: two human-approved artifacts disagree — the drawing
 * Kabe signed and the painting he blessed — and which one moves is his, not
 * this script's. What this script owes is that the disagreement can never
 * again be invisible. */
const carriers = [];
for (const c of facingCarriers(plan, loc, facing)) {
  const width = fc.wall_width_m;
  const px0 = groundplaneX(c.from_m / width), px1 = groundplaneX(c.to_m / width);
  const entry = {
    kind: c.kind, id: c.id ?? null,
    plan_px: [round(Math.min(px0, px1), 1), round(Math.max(px0, px1), 1)],
    plan_centre_px: round((px0 + px1) / 2, 1),
    painted_px: null, painted_centre_px: null,
    centre_delta_px: null, centre_delta_m: null,
    painted_feature: null
  };
  const mp = m._measured_px || {};
  if (c.kind === "fireplace" && typeof mp.fireplace_opening_x0_px === "number") {
    entry.painted_px = [mp.fireplace_opening_x0_px, mp.fireplace_opening_x1_px];
    entry.painted_feature = "the fireplace OPENING (the plan holds the whole breast, which is wider)";
  } else if (c.kind === "door" && assigned.has(c.id)) {
    /* [Row 27] Off the SAME assignment the opening above was written from, so
     * the record of the disagreement and the rectangle that resolves it cannot
     * come apart. Before this row a door carrier could only be recorded on the
     * two facings `measure.py` had a hand reading for. */
    const a = assigned.get(c.id);
    entry.painted_px = [a.x0_px, a.x1_px];
    entry.painted_feature = "the painted way through at the wall plane, read as the maximally stable dark run (design/plan-draft/measured/door_measure.py)";
  }
  if (entry.painted_px) {
    entry.painted_centre_px = round((entry.painted_px[0] + entry.painted_px[1]) / 2, 1);
    entry.centre_delta_px = round(entry.painted_centre_px - entry.plan_centre_px, 1);
    entry.centre_delta_m = round(entry.centre_delta_px / ppm, 3);
  }
  carriers.push(entry);
}
meta.measured_room.carriers = carriers;
/* [row 39] AND WHAT THE PIXELS SAID ABOUT THE FLIGHT THE META NOW CARRIES,
 * beside the carrier disagreements and for the same stated reason: the
 * geometry is the plan's, the permission is the ask's, and what the painting
 * itself shows in that region is a third thing that must not live only in a
 * refusal that never fires. Informational, exactly as the carriers are —
 * `tools/flight-evidence.mjs` carries the calibration that says why it is not
 * a gate and refuses to hold a threshold. Absent on every facing whose plan
 * draws no flight, so no promoted meta's bytes move for this. */
if (flightEvidence) meta.measured_room.flight_evidence = flightEvidence;

function groundplaneX(u) {
  /* The same u -> x the corners and the staging use, at wall scale. */
  return CANVAS_W / 2 + (u - 0.5) * fc.wall_width_m * ppm;
}

const outDir = join(root, "backdrops", loc);
mkdirSync(outDir, { recursive: true });
const png = join(outDir, `${facing}.png`);
const src = join(root, candidate);
if (!existsSync(src)) {
  console.error(`promote refused: ${candidate} is not a file`);
  process.exit(1);
}
writeFileSync(png, readFileSync(src));
writeFileSync(join(outDir, `${facing}.meta.json`), JSON.stringify(meta, null, 2) + "\n");
console.log(`promoted ${facingArg}: ${candidate} -> backdrops/${loc}/${facing}.png`);
console.log(`  ${ppm.toFixed(3)} px/m at the drawn ${drawn} m = a ${focal.toFixed(1)} px lens (${((focal - MEASURED_REFERENCE_PX) / MEASURED_REFERENCE_PX * 100).toFixed(1)}% from the approved ${MEASURED_REFERENCE_PX})`);
console.log(`  eye ${eyeM.toFixed(4)} m, horizon ${(horizonY * imageH).toFixed(1)} px (${declaredCamera ? `DECLARED — the page's own derived camera for this facing, under the tolerance ruling; this frame's own ${holdFamily}` : isOpen ? "declared eye line, far-line ruler" : "ceiling ramp"}), ${isOpen ? "far-line ground row" : "floor line"} ${(floorLineY * imageH).toFixed(0)} px`);
if (isOpen) {
  console.log(`  no corners: an open facing runs to its ${fc.far_line} m far line and a corner there would be an invented enclosure`);
} else if (meta.corner_x0_px == null || meta.corner_x1_px == null) {
  /* [row 32] An `unfitted-horizon` frame is one whose wall never stops being
   * square to the camera, so it gives the corner rule nothing to read — and a
   * meta with no corners is legal (`meta.corner_pairing` asks only that it has
   * two or none). Said out loud rather than printed as a NaN span. */
  console.log(`  no corners: this frame's own architecture never stops being square to the camera, so the wall's ends are not in the reading`);
} else {
  console.log(`  corners ${meta.corner_x0_px}..${meta.corner_x1_px} px, span ${meta.corner_x1_px - meta.corner_x0_px} against ${(fc.wall_width_m * ppm).toFixed(1)} the plan's ${fc.wall_width_m} m implies`);
}
if (meta.stairs && meta.stairs.length) {
  for (const s of meta.stairs) {
    console.log(`  flight ${s.id}: ${s.treads} treads ${s.direction}, ${round(s.raw_w, 0)}x${round(s.raw_h, 0)} px of body with ${round(s.w, 0)}x${round(s.h, 0)} of it on the frame — attached from ${flightEvidence.geometry}`);
  }
  console.log(flightEvidence.read
    ? `  the painting reads ${flightEvidence.ratio} of the room beside it in edge energy over that body (${flightEvidence.body_edge} against ${flightEvidence.ring_edge} across ${flightEvidence.body_px} px) — recorded, never gated: see tools/flight-evidence.mjs`
    : `  no pixel reading of that body: ${flightEvidence.why}`);
}
for (const c of carriers) {
  if (c.centre_delta_px === null) {
    console.log(`  carrier ${c.kind}${c.id ? " " + c.id : ""}: the plan puts it at ${c.plan_px[0]}..${c.plan_px[1]} px; the measurement reads no such feature in the painting`);
  } else {
    console.log(`  carrier ${c.kind}${c.id ? " " + c.id : ""}: the plan centres it at ${c.plan_centre_px} px, the painting at ${c.painted_centre_px} — ${c.centre_delta_m} m apart (${c.painted_feature})`);
  }
}

function round(v, n) {
  const f = Math.pow(10, n);
  return Math.round(v * f) / f;
}
