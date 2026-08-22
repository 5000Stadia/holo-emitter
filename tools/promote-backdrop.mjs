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
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  MEASURED_REFERENCE_PX, MEASURED_BAND, measuredLensBand
} from "./validate-fixtures.mjs";
import { openingsForFacing, wallSegments } from "./plan-projection.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const argOf = (flag, dflt) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : dflt;
};

const facingArg = argOf("--facing");
const candidate = argOf("--candidate");
const planPath = argOf("--plan", join(root, "fixtures", "demo-study", "plan.json"));
if (!facingArg || !candidate) {
  console.error("usage: promote-backdrop.mjs --facing <loc>/<F> --candidate <png> [--plan <plan.json>]");
  process.exit(2);
}
const [loc, facing] = facingArg.split("/");

/* The measurement's own file, which is named for the WORLD's location id
 * (`hall`), while the asset seat's source directory is named for the room
 * (`passage-E`). Two names for one place is a trap and this is the one line
 * that maps them: the location id is what the world, the plan and the
 * backdrops map all use, and it is what the promoted file is named for. */
const measuredFile = join(root, "design", "plan-draft", "measured", `${loc}-${facing}.json`);
if (!existsSync(measuredFile)) {
  console.error(`promote refused: no measurement at ${measuredFile} — run design/plan-draft/measured/measure.py first`);
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

const ppm = m.px_per_m_at_wall;
if (!(ppm > 0)) {
  console.error(`promote refused: ${facingArg} has no px_per_m_at_wall — a WITHHELD measurement is not a verdict, and a facing without one is not admitted`);
  process.exit(1);
}
const drawn = fc.camera_wall_m;
const focal = ppm * drawn;
const band = measuredLensBand();
if (!(focal >= band.lo && focal <= band.hi)) {
  console.error(`promote refused: ${facingArg} measures ${ppm.toFixed(2)} px/m at its drawn ${drawn} m — a ${focal.toFixed(1)} px lens, outside the ±${(MEASURED_BAND * 100).toFixed(0)}% band ${band.lo.toFixed(1)}..${band.hi.toFixed(1)} px around the approved ${MEASURED_REFERENCE_PX} px (blueprint §5). The corpus conforms to the law; the law is not moved to admit the corpus.`);
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
const votes = m._horizon_votes || {};
const ramp = votes.ceiling_ramp_intersection;
if (!ramp || typeof ramp.y !== "number") {
  console.error(`promote refused: ${facingArg}'s measurement carries no ceiling-ramp horizon, which is the instrument row 20 ruled`);
  process.exit(1);
}
const imageH = m.image_h_px;
const horizonY = ramp.y / imageH;
const floorLineY = m.floor_line_y;
const eyeM = (floorLineY - horizonY) * imageH / ppm;

const meta = {
  floor_line_y: round(floorLineY, 6),
  px_per_m_at_wall: round(ppm, 3),
  px_per_m_at_bottom: round((imageH - horizonY * imageH) / eyeM, 2),
  wall_width_m: fc.wall_width_m,
  key_tint: m.key_tint,
  image_h_px: imageH,
  horizon_y: round(horizonY, 6),
  key_dir: m.key_dir,
  calibration_ref: m.calibration_ref,
  calibration_px: m.calibration_px,
  camera_wall_m: drawn,
  facing_type: fc.type,
  wall_continuous: null,
  wall_segments: null,
  corner_x0_px: m.corner_x0_px,
  corner_x1_px: m.corner_x1_px,
  storey_height_m: null,
  camera_id: "measured:" + srcRel,
  provisional: false,
  measured: true,
  backdrop: fc.type === "open" ? "vista" : "wall",
  focal_px: round(focal, 1),
  nearest_floor_m: null,
  openings: []
};

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
meta.nearest_floor_m = round(eyeM / (1 - horizonY), 4);

/* THE DOORWAY, measured where the painting has one. `measure.py` reads the
 * painted opening's wall-plane rectangle off the pixels for the two facings
 * that carry a door; where it has, that rectangle is the opening — which is
 * what makes §11's "the painted opening must coincide with the click target"
 * true by construction. What the painting cannot say is what stands beyond it,
 * so the two `beyond_*` metres come from the plan, matched by the entity that
 * fills the opening. */
const planned = openingsForFacing(plan, loc, facing, meta);
for (const p of planned) {
  const measuredRect = (typeof m._measured_px?.opening_x0_px === "number" && planned.length === 1)
    ? {
        x: m._measured_px.opening_x0_px,
        y: m._measured_px.opening_y0_px,
        w: m._measured_px.opening_x1_px - m._measured_px.opening_x0_px,
        h: m._measured_px.opening_y1_px - m._measured_px.opening_y0_px
      }
    : null;
  meta.openings.push({
    id: p.id,
    via: p.via,
    x: round(measuredRect ? measuredRect.x : p.x, 2),
    y: round(measuredRect ? measuredRect.y : p.y, 2),
    w: round(measuredRect ? measuredRect.w : p.w, 2),
    h: round(measuredRect ? measuredRect.h : p.h, 2),
    beyond_m: p.beyond_m,
    beyond_offset_m: p.beyond_offset_m,
    measured: !!measuredRect
  });
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
console.log(`  eye ${eyeM.toFixed(4)} m, horizon ${(horizonY * imageH).toFixed(1)} px (ceiling ramp), floor line ${(floorLineY * imageH).toFixed(0)} px`);
console.log(`  corners ${meta.corner_x0_px}..${meta.corner_x1_px} px, span ${meta.corner_x1_px - meta.corner_x0_px} against ${(fc.wall_width_m * ppm).toFixed(1)} the plan's ${fc.wall_width_m} m implies`);

function round(v, n) {
  const f = Math.pow(10, n);
  return Math.round(v * f) / f;
}
