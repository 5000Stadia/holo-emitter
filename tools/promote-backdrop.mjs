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
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  MEASURED_REFERENCE_PX, MEASURED_BAND, measuredLensBand,
  TOLERANCE_RULING, DECLARED_CAMERA_FIELDS, CAMERA_SOURCES
} from "./validate-fixtures.mjs";
import { openingsForFacing, wallSegments, nearestFloorM, facingCarriers, stairsForFacing, DRAWING_EYE_M, deriveMeta } from "./plan-projection.mjs";
import { INTERIOR_FABRIC } from "./room-voices.mjs";
import { askNamesAFlight } from "./frame-language.mjs";
import { askTextFor, paintedFlightReading } from "./flight-evidence.mjs";
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
const planPath = argOf("--plan", join(root, "fixtures", "demo-study", "plan.json"));
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

const ppm = m.px_per_m_at_wall;
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
if (declaredCamera && isOpen) {
  console.error(`promote refused: ${facingArg} is an open facing and --camera-source declared has nothing to give it — a vista's horizon is ALREADY the camera's declared eye line (row 29(a)'s far-line ruler), so its eye is judged against the ground row it draws and there is no second reading for a tolerance to stand between. An open frame the ruler and the ground row disagree about is repainted, not flagged [row32:tolerance.open_facing]`);
  process.exit(1);
}
if (declaredCamera && !TOLERANCE_FAMILIES.includes(holdFamily)) {
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
if (!(focal >= band.lo && focal <= band.hi)) {
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
const declaredMeta = declaredCamera ? deriveMeta(plan, loc, facing) : null;
const horizonPx = declaredCamera ? declaredMeta.horizon_y * m.image_h_px
  : (isOpen ? (farRuler && farRuler.y) : (ramp && ramp.y));
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
const floorLineY = m.floor_line_y;
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
  corner_x0_px: m.corner_x0_px,
  corner_x1_px: m.corner_x1_px,
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
    suspect_perspective: true,
    tolerance_ruling: TOLERANCE_RULING,
    declared_fields: [...DECLARED_CAMERA_FIELDS]
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
    ruled_wall_width_m: fc.wall_width_m
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
 * on a SNAPPED one (`--round row35snap`, where `row35_snap.py` has rectified
 * the frame ONTO the declared camera) the meta's geometry IS the camera the
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
    /* THE ATTACHING BRANCH. The reading is taken first, so that a wall whose
     * pixels disagree with its own ask is on the record even though nothing
     * refuses it: `flight-evidence.mjs` explains at length why nothing does. */
    flightEvidence = paintedFlightReading(join(root, candidate), drawnFlights);
    flightEvidence.asked = { prompt: ask.path, via: ask.via };
    flightEvidence.geometry = declaredCamera ? "declared-camera, exact by construction"
      : roundDir === "row35snap" ? "snapped onto the declared camera, exact by construction"
        : "this painting's own measured camera";
    meta.stairs = drawnFlights;
  }
}
/* AND THE POST-CONDITION, ASSERTED WHERE THE META IS WRITTEN. The clause above
 * is the only thing that puts a flight on a promoted meta; this is the check
 * that it did, kept as its own refusal so that deleting the attachment cannot
 * pass as a promotion with a quietly flightless stair room. */
if (drawnFlights.length && !refusals.length &&
    !(Array.isArray(meta.stairs) && meta.stairs.length === drawnFlights.length)) {
  refusals.push(`${facingArg}: the plan draws ${drawnFlights.length} flight(s) in this view (${drawnFlights.map((s2) => s2.id).join(", ")}) and the meta about to be written carries ${(meta.stairs || []).length} — painting this wall deletes the staircase the room holds, and a player is left looking at the place a stair used to be [row32:stair.painted_flight_lost]`);
}
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
const RULED_DOOR_M = 1.00;
const DOORWAY_BAND = [0.50, 1.50];
const apertureScale = (meta.corner_x1_px != null && meta.corner_x0_px != null &&
                       fc.wall_width_m > 0)
  ? (meta.corner_x1_px - meta.corner_x0_px) / fc.wall_width_m : ppm;
for (const [id, cand] of assigned) {
  const ruledPx = RULED_DOOR_M * apertureScale;
  const ratio = cand.width_px / ruledPx;
  if (ratio < DOORWAY_BAND[0] || ratio > DOORWAY_BAND[1]) {
    refusals.push(`${facingArg}: the way through the painting shows for "${id}" is ${cand.width_px} px — ${ratio.toFixed(2)}× the ${ruledPx.toFixed(1)} px blueprint §11's 1.00 m opening spans at this wall's corner scale (${apertureScale.toFixed(1)} px/m; its ruler reads ${ppm.toFixed(1)}), outside ${DOORWAY_BAND[0]}–${DOORWAY_BAND[1]}× — that is not a doorway, whatever else it is [row27:door.painted_width]`);
  }
}
for (const p of planned) {
  const cand = assigned.get(p.id) || null;
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
    x: round(cand ? cand.x0_px : p.x, 2),
    y: round(cand ? cand.y0_px : p.y, 2),
    w: round(cand ? cand.width_px : p.w, 2),
    h: round(cand ? (cand.y1_px - cand.y0_px) : p.h, 2),
    beyond_m: p.beyond_m,
    beyond_offset_m: p.beyond_offset_m,
    measured: !!cand
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
