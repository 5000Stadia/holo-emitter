#!/usr/bin/env node
/* validate-fixtures.mjs — the row-2 fixture validator (plan §6 of
 * design/specs/2-world-behaviour.md).
 *
 * Exports validate(fixtureDir, records) -> array of finding strings
 * (empty = pass). The CLI wrapper loads records from src/placeholders.js,
 * prints numbered findings and exits 1 on any. The bake
 * (tools/bake-fixtures.mjs) calls validate() and refuses to bake an invalid
 * fixture — the enforcement locus.
 *
 * The validator imports src/groundplane.js (overlap math — never a
 * re-derivation; pixel truth stays §12.8's), src/renderer.js (GRID_META),
 * and src/harness.js (enumerateNarrationDomain — the §12.9 domain is the
 * harness's own, never re-derived) through their UMD guards via
 * createRequire.
 *
 * Checks (plan §6):
 *   1. truth/presentation split by key whitelist (+ smuggled coordinates,
 *      world facts in staging)
 *   2. viewstate.json holds exactly {location, facing}, resolving in world
 *   3. mirror: true rejected (§4 — mirroring breaks one-light)
 *   4. all fixture-internal and record-internal refs resolve; record anchor
 *      sanity; records JSON-clean; anchored-attachment token. Record image
 *      path strings are NOT checked at this row — the procedural library has
 *      no files; the row-4 library bake owns path resolution.
 *   5. numeric domains (u, t, v, depth_m, dims_m)
 *   6. placement<->truth consistency (transition entities excepted per exits'
 *      via; every known entity staged, anchor-hosted, or held)
 *   7. named overlap pairs, statically, through groundplane.js
 *   8. §12.9 narration coverage + the plan-§5 honesty rules (a)–(e)
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

import { metaForFacing as planMetaForFacing, waysThrough, windowIds } from "./plan-projection.mjs";
/* [Row 26] The BAR — "enough of this way through is on screen for a hand to
 * land on it" — which the exit clause below applies.
 *
 * THERE ARE TWO PREDICATES HERE, NOT ONE, and an earlier version of this
 * comment claimed otherwise. `slideAlongWall` does NOT call this function: it
 * asks something strictly stronger — the WHOLE door inside the frame with
 * `FRAME_MARGIN_PX` beyond each jamb — because a standpoint is being placed
 * and a placement should aim at the good case, not at the least acceptable
 * one. So the relationship is an implication rather than an identity: anything
 * the slide satisfies this clause also satisfies, and never the reverse. That
 * implication is what must not drift, so it is asserted in `plan.spec.mjs`
 * ("what the slide satisfies, the clause satisfies") rather than left to two
 * comments agreeing with each other. */
import { usablyInFrame, MIN_USABLE_APERTURE_PX } from "./validate-plan.mjs";

/* Row 20: the ruled lens, from its one code home. */
const FOCAL_PX = createRequire(import.meta.url)("../src/groundplane.js").FOCAL_PX;

/* The acceptance band for a MEASURED backdrop meta, and the only home for it.
 * `design/plan-draft/measured/gate.py` states the same two numbers as the
 * asset seat's acceptance gate (`REFERENCE_PX`, `BAND`); `plan.spec` asserts
 * the two files agree, so widening one without the other goes red. */
/* THE STANDING-EYE WAVE MOVED BOTH. [HUMAN 2026-08-22, design/approvals.log at
 * 964188d] "B" — the standing eye — routes every wall of the manor through one
 * regeneration wave at a new camera, so the reference the corpus conforms to
 * moved by a human's ruling and not by a corpus arguing. It is
 * `backdrops/source/study-N/cand-5-reference.png` measured by
 * `measure.py --round cand5ref`: 188.421 px/m at its drawn 4.35 m standpoint,
 * an 819.6 px lens. The band is the wave's [AI] STARTING licence — 8 % of a
 * focal length is below the just-noticeable difference for a focal-length
 * change across a film cut, which is what a player turning between two walls of
 * one room actually is — and it is recorded WITH ITS CLOCK in
 * `design/plan-draft/measured/misses.jsonl`: cand-2 admitted 0 of 7 at ±3 %,
 * cand-3 0 of 7, cand-6 2 of 7 at ±8 %. If a wave admits ~0 again the band and
 * the approach are re-examined, not widened. Previously 1010.0 / 0.03. */
export const MEASURED_REFERENCE_PX = 819.6;    // study/N cand-5-reference, measured
export const MEASURED_BAND = 0.08;             // ±8 %, the standing-eye wave / gate.py

/* THE DERIVED ARM'S TOLERANCE, exported for the same reason the band is. A
 * derived meta computes `px_per_m_at_wall` as `FOCAL_PX / distance`, so the
 * product is `FOCAL_PX` to within a few units in the last place of a double.
 * This is a float-equality epsilon, NOT an engineering allowance, and nothing
 * about a picture may move it. It sat inline and unread as `1e-9` until a
 * round-5 critic widened it to `0.1` - a factor of 10^8 - with the whole suite
 * green, at which value a 10%-wrong lens ships. The ledger case could not see
 * that, because it doctors by x1.2 and stays red under any widening short of
 * its own delta: a case proves the clause fires, and only a test at the
 * BOUNDARY proves the number. `validator.spec` pins it from both sides. */
export const DERIVED_LENS_TOL = 1e-9;
/* WHICH OF THE TWO LAWFUL CAMERAS A MEASURED META ANSWERS TO.
 *
 * There are exactly two and there have never been more: the MEASURED reference
 * (819.6 px — `study/N`'s approved painting, blueprint §5) and the RULED lens
 * (`FOCAL_PX`, 1024 px — §10's `camera.focal_mm` through one formula). Which
 * one a wall is judged against is the camera its own page meta commands: the
 * study's painted walls were generated free-hand and measured, so they answer
 * to the measured reference; a manor wall whose scaffold and derived meta both
 * declare 1024 was PAINTED TO ORDER at the ruled lens and answers to that.
 * [Navigator ruling 2026-08-24, design/approvals.log; the lens-fork rule's own
 * branch 1 — "the generator follows a commanded camera".]
 *
 * THE RULING ARRIVED IN `promote-backdrop.mjs` AND NOT HERE, AND THAT HALF-
 * LANDING IS WHY THIS COMMENT EXISTS. The promotion tool grew `--reference
 * ruled` and admitted the first manor wall; this validator still centred every
 * measured band on 819.6, so the meta the promotion had just written was
 * refused the moment the bake read it — `buttery_pantry/S`, a 975.8 px lens,
 * obeying its command and outside 754.0..885.2. One law, two readers, one of
 * them not told: the bake refused, and eight `guards.spec` ledger cases went
 * red behind it because a shipped meta tripping a clause pollutes every
 * exclusivity assertion in the file.
 *
 * The BAND does not move: it is ±MEASURED_BAND around whichever centre, and
 * the centre is the only thing the meta chooses. An absent or unrecognised
 * `camera_reference` is the measured reference — the stricter of the two — so
 * a misspelling refuses a manor wall loudly rather than admitting a study wall
 * quietly. */
export function measuredLensBand(reference) {
  const centre = reference === "ruled" ? FOCAL_PX : MEASURED_REFERENCE_PX;
  return { lo: centre * (1 - MEASURED_BAND),
           hi: centre * (1 + MEASURED_BAND), exact: false, centre };
}

/* WHERE A META'S CAMERA CAME FROM, and the second of the two answers is new.
 *
 * Until the Captain's tolerance ruling there was one answer and it was silent:
 * a promoted meta's horizon was MEASURED, fitted off the painting's own two
 * side-wall/ceiling junctions (row 20's ceiling ramp), and a facing whose
 * ramp could not be fitted — or whose ramp disagreed with the frame's own
 * ruler — was not promoted at all. Row 32 named that second case the SUSPECT
 * PAINTING family and left it on the look surface.
 *
 * [HUMAN, 2026-08-24, design/approvals.log]: *"I think its pretty close and we
 * can accept a tolerance for drift here"* — a suspect wall promotes on the
 * camera the page's own derived path would have held for that facing, and says
 * so in the meta rather than pretending its horizon was read off the picture.
 *
 * WHAT THE SECOND ANSWER MAY AND MAY NOT COVER. Exactly the field the
 * perspective contradiction makes unmeasurable: `horizon_y`. Everything else
 * on such a meta is the same measured or plan-owned value it would carry on
 * any other promotion — the floor line off the painting, the scale off the
 * painting AND STILL INSIDE ITS BAND, the building's metres off the drawing.
 * `DECLARED_CAMERA_FIELDS` is the whole licence, written once, and the clause
 * below refuses a meta that claims either more or less of it than this. A
 * declared meta that named `px_per_m_at_wall` here would be waiving the scale
 * gate by declaration, which the ruling does not license and this refuses. */
export const DECLARED_CAMERA_FIELDS = ["horizon_y"];
/* [THE WARP EXIT] AND THE WARPED FRAME'S LICENCE IS WIDER, because the painting
 * was MOVED. The tolerance path declares one number — a horizon a suspect
 * perspective could not be trusted for — and leaves the ruler, the wall-foot
 * line and the corners to the picture, which is right when nothing touched the
 * picture. `mesh_warp.py` DID touch it: it resamples the frame so that the
 * floor row lands on `floor_line_y`, the wall's scale is `px_per_m_at_wall` and
 * the u-domain runs corner to corner, all four off the scaffold's own meta and
 * all four with residual 0.000. Re-reading those four off the result and
 * shipping them is what refused 11 warped walls for a door drawn at one camera
 * and measured at another. So a warped meta names all five, and it may name
 * neither more nor fewer: the re-measurement rides beside them under
 * `measured_room.warp.remeasured`, which is a reading and not a claim. */
export const WARPED_CAMERA_FIELDS = ["horizon_y", "px_per_m_at_wall",
  "floor_line_y", "corner_x0_px", "corner_x1_px"];
export const CAMERA_SOURCES = ["measured", "declared"];
/* The Captain's own words, short. A declared meta has to CITE the ruling that
 * admits it — the log line and the sentence — so that a reader of the meta
 * alone can find the authority, and so that a meta cannot acquire the licence
 * by carrying a token nobody ruled. Matched rather than compared byte for
 * byte: the citation is prose and the authority is the log, not this file. */
export const TOLERANCE_RULING =
  'design/approvals.log 2026-08-24, suspect-painting tolerance [HUMAN]: ' +
  '"I think its pretty close and we can accept a tolerance for drift here"';
const TOLERANCE_CITATION = /we can accept a tolerance for drift here/;
const TOLERANCE_LOG = /design\/approvals\.log/;

const require_ = createRequire(import.meta.url);
import { activePack } from "./pack.mjs";
const groundplane = require_("../src/groundplane.js");
const { GRID_META } = require_("../src/renderer.js");
const harness = require_("../src/harness.js");

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CANVAS_W = 1536;
const CANVAS_H = 1024;

/* §4's named overlap pairs: co-staged on one facing, projected screen
 * x-spans AND y-spans intersect. */
const OVERLAP_PAIRS = [["chair1", "desk1"], ["stick1", "shelf1"]];

/* Plan §5: the only four legal `*` keys. */
const WILDCARD_KEYS = [
  "toggle.*.refused_unknown",
  "take.*.refused_unknown",
  "go.*.refused_unknown",
  "turn.*.refused",
];
const SUCCESS_OUTCOMES = new Set(["open", "open_reveal", "closed", "taken", "arrive"]);
const PLACEHOLDER_RE = /(TODO|TBD|FIXME|XXX|lorem|placeholder|⟦)/i;

/* Truth/presentation whitelists (plan §6.1). */
const WORLD_TOP_KEYS = ["schema", "locations", "entities", "relations", "knowledge"];
const LOCATION_KEYS = ["id", "facings", "exits"];
const LOCATION_REQ = ["id", "facings"];
const EXIT_KEYS = ["id", "from", "facing", "to", "arrive_facing", "via"];
/* [ROW 42] `kind` and `fills` join the whitelist, and they are truth rather
 * than presentation: `kind` is what the thing IS (a door, a window) and `fills`
 * names the hole in the building it stands in, by the plan's own id. Neither is
 * a coordinate — where the leaf DRAWS is the painting's to say and the meta's
 * to record, which is the whole of the row's ruling. */
const ENTITY_KEYS = ["id", "sprite", "location", "states", "state", "takeable",
  "transition", "kind", "fills"];
const ENTITY_REQ = ["id", "sprite"];
/* [ROW 42] What an entity may claim to be. Openings in a §5 meta already carry
 * `kind` from a fixed vocabulary (`OPENING_KINDS` below); these are the two of
 * them a sprite can stand in. */
const ENTITY_KINDS = ["door", "window"];
const STAGING_TOP_KEYS = ["schema", "placements"];
const FACING_PLACEMENT_KEYS = ["facing", "attachment", "u", "v", "depth_m", "mirror"];
const FACING_PLACEMENT_REQ = ["facing", "attachment", "u"];
const ANCHOR_PLACEMENT_KEYS = ["anchor_on", "t"];
/* Coordinate-shaped keys anywhere in truth. The key whitelists above cover
 * the structures §3 names; this walk is the only net under `knowledge`,
 * whose sub-keys are open — so it has to catch the shapes a coordinate
 * actually arrives wearing, not just the bare letters. `x`/`y` alone missed
 * `screen_x`, `wall_x`, `origin_y`, `left`, `top`, `width`, `height`. */
/* The complete §4 attachment vocabulary for a facing placement. */
const ATTACHMENTS = ["floor_against", "floor_free", "wall_mounted"];
const COORD_KEY_RE =
  /(^|_)(u|v|x|y|cx|cy|dx|dy|x0|x1|y0|y1|left|right|top|bottom|width|height|scale|anchor|anchors|origin|offset|bbox|rect|extent|footprint|baseline)($|_)|^(px|depth|coord|screen|pixel|canvas)/i;
const WORLD_FACT_KEYS = new Set(["state", "states", "takeable", "relations", "knowledge", "location", "sprite"]);

function isObj(x) {
  return x !== null && typeof x === "object" && !Array.isArray(x);
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null || typeof a !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false;
    return true;
  }
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) {
    if (!Object.prototype.hasOwnProperty.call(b, k)) return false;
    if (!deepEqual(a[k], b[k])) return false;
  }
  return true;
}

/* Depth-first key walk over parsed JSON; fn(key, path) per object key. */
function walkKeys(node, path, fn) {
  if (Array.isArray(node)) {
    node.forEach((v, i) => walkKeys(v, `${path}[${i}]`, fn));
  } else if (isObj(node)) {
    for (const k of Object.keys(node)) {
      const p = path ? `${path}.${k}` : k;
      fn(k, p);
      walkKeys(node[k], p, fn);
    }
  }
}

function loadJson(fixtureDir, name, findings) {
  const p = join(fixtureDir, name);
  let raw;
  try {
    raw = readFileSync(p, "utf8");
  } catch (e) {
    findings.push(`${name}: unreadable (${e.message})`);
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    findings.push(`${name}: malformed JSON (${e.message})`);
    return null;
  }
}

/* Meta resolution, pinned (plan §6.5): the staged facing's backdrop meta
 * when one exists, grid canonical otherwise — the same resolution the
 * renderer applies. */
/* The §5 fields a meta must carry before the renderer may be handed it. The
 * render resolves `backdrops[key].meta ?? GRID_META`, so the moment a facing
 * carries a PARTIAL meta the fallback is never consulted and an `undefined`
 * reaches the paint: `key_tint` drives the per-sprite tint AND the grid's own
 * key falloff (and is deliberately non-identity so §12.8's tint clause is
 * satisfiable), `image_h_px` is in every ground-plane call, `horizon_y` is the
 * left-hand side of §5's camera-has-feet gate. Row 11's derived metas and
 * row 4's measured ones answer to the same list. */
const META_REQUIRED = [
  "floor_line_y", "px_per_m_at_wall", "px_per_m_at_bottom", "wall_width_m",
  "key_tint", "image_h_px", "horizon_y", "key_dir",
  "calibration_ref", "calibration_px"
];
const FACING_TYPES = ["enclosed", "open", "corridor"];
/* [Row 15] The two ways a §5 meta says a wall can be passed. A `door` is a
 * hole cut through a band that stands; a `threshold` is the line where a band
 * does not stand at all — the manor's court mouth, 20.4 m of it, and the only
 * way its entrance approach joins the rest of the building. Flights are the
 * third way through and live in `meta.stairs`, because a flight is not a hole
 * in a plane and nothing about the wall governs it. */
const OPENING_KINDS = ["door", "threshold"];
/* Every key a §5 meta may carry. `validate-plan.mjs` has had strict key
 * whitelists since row 12 for exactly this reason and the meta arm arrived
 * without one: an unknown key rode straight through, so a meta could carry a
 * misspelling of a field the renderer reads and nothing would say so. */
const META_KEYS = [
  "floor_line_y", "px_per_m_at_wall", "px_per_m_at_bottom", "wall_width_m",
  "key_tint", "image_h_px", "horizon_y", "key_dir", "calibration_ref",
  "calibration_px", "camera_wall_m", "camera_far_m", "far_line",
  "facing_type", "wall_continuous", "wall_segments",
  "corner_x0_px", "corner_x1_px", "wall_x0_px", "storey_height_m",
  // [row 26] where the eye stands along the wall, signed the way `u` is —
  // absent, not zero, on every facing that stands on its room's own axis
  "eye_offset_m",
  // provenance: which camera produced it, and whether it was MEASURED off a
  // painted backdrop (row 20) or derived from the plan
  "camera_id", "provisional", "measured", "backdrop",
  // ...and which of the two lawful cameras it was measured against, so the
  // acceptance band can be centred where the wall was commanded rather than
  // where the study happened to be painted — see `measuredLensBand`
  "camera_reference",
  // ...and which measurement ROUND produced it, so the promotion can be
  // re-derived from the meta alone once rounds have their own directories
  "measured_round",
  // [row 32, the Captain's tolerance ruling] ...and whether its camera was
  // MEASURED off the painting or DECLARED from the page's own derived camera,
  // with the flag that says why and the ruling that admits it. All four are
  // absent on an ordinary promotion — see `DECLARED_CAMERA_FIELDS`.
  "camera_source", "suspect_perspective", "tolerance_ruling", "declared_fields",
  "focal_px", "nearest_floor_m",
  // [row 15] the flights standing in this view — a fact about the building,
  // like `openings`, and what an empty manor needs in order to have an upstairs
  "stairs",
  // [row 21] the room the PAINTING depicts, beside the room the plan rules —
  // informational, warn-tier, and never read by the renderer
  "measured_room",
  // row 20: the painted doorway, measured off the backdrop. Where a meta
  // carries this, the aperture a player walks through IS the painted opening
  // and §11's "the painted opening must coincide with the click target" is
  // true by construction rather than by prompt discipline.
  "openings",
  /* [row 42] ...and the painted WINDOW, read the same way and written by the
   * same act. A window is not a way through, so it is not an `openings` entry
   * and the renderer never hands it a `go` target; it is where a casement
   * sprite is placed, and it is here so that a meta carrying one is a meta this
   * validator knows rather than one it refuses on `meta.unknown_key`.
   * `window_evidence` is the reading's own account of what the painting showed
   * that the plan does not rule — recorded, never gated. */
  "windows", "window_evidence"
];

/**
 * The meta the renderer resolves for a facing, in three tiers — a MEASURED
 * backdrop meta (row 4's), then the PLAN's derived one (row 11's), then the
 * unplanned-facing fallback. `derived` is the map the caller loaded from the
 * plan; keeping the plan read out of this function is what lets the CLI, the
 * bake and the tests hand in the same map the page was baked with.
 */
export function metaForFacing(facingStr, findings, derived) {
  const parts = String(facingStr).split("/");
  if (parts.length === 2) {
    const p = join(ROOT, "backdrops", parts[0], parts[1] + ".meta.json");
    if (existsSync(p)) {
      try {
        return JSON.parse(readFileSync(p, "utf8"));
      } catch (e) {
        /* A meta that exists but cannot be read is a finding, never a quiet
         * fall back to grid canonical: falling back would check the fixture
         * against a wall that is not the one the renderer will draw, and
         * report success. */
        findings.push(
          `backdrops/${parts[0]}/${parts[1]}.meta.json: unreadable (${e.message}) — cannot check placements on ${facingStr}`
        );
      }
    }
  }
  if (derived && derived[facingStr]) return derived[facingStr];
  return GRID_META;
}

/**
 * [Row 21] Where a fixture's plan lives: its own `plan.json`, or the
 * repo-relative path in its `plan.ref`. The navigation fixture walks the same
 * manor the demo fixture does, and a second copy of that plan would be a
 * second home for a fact — so it points instead. One home for the resolution
 * rule too: the bake imports this rather than repeating it.
 */
export function resolvePlanPath(fixtureDir) {
  const own = join(fixtureDir, "plan.json");
  if (existsSync(own)) return own;
  const ref = join(fixtureDir, "plan.ref");
  if (existsSync(ref)) return join(ROOT, readFileSync(ref, "utf8").trim());
  return own;
}

/**
 * Tier 2 of the meta resolution: every facing the world names, projected from
 * the fixture's own plan. The bake writes exactly this map into fixture.js,
 * so the validator, the page and the renderer all read one geometry.
 */
function derivedMetasFor(fixtureDir, world, findings) {
  const planFile = resolvePlanPath(fixtureDir);
  if (!existsSync(planFile)) {
    findings.push("plan.json: missing — the plan is the fixture's spatial source (blueprint §4b), and without it every facing falls back to the unplanned-facing meta");
    return {};
  }
  let plan;
  try {
    plan = JSON.parse(readFileSync(planFile, "utf8"));
  } catch (e) {
    findings.push(`plan.json: does not parse (${e.message}) — cannot resolve any facing's geometry`);
    return {};
  }
  const out = {};
  for (const loc of (isObj(world) && Array.isArray(world.locations) ? world.locations : [])) {
    if (!isObj(loc) || !Array.isArray(loc.facings)) continue;
    for (const f of loc.facings) {
      try {
        out[`${loc.id}/${f}`] = planMetaForFacing(plan, loc.id, f);
      } catch (e) {
        findings.push(`plan.json: ${loc.id}/${f} cannot be projected (${e.message})`);
      }
    }
  }
  return out;
}

/**
 * The §5 meta schema, row 11's arm. Every clause names one thing so a break
 * goes red on that clause alone.
 *
 * The type field partitions the cases it names, and `null` is one of them:
 * a facing NO PLAN HOLDS has no typed geometry, and borrowing `enclosed` for
 * it would make `enclosed` mean two things. §12.5's frame clause is here
 * because it is the one clause that reaches OUTSIDE a meta — the canvas is
 * the term no meta supplies — and after row 11 it has to reach every meta the
 * fixture can resolve, cornered or not.
 */
function checkMeta(label, meta, findings, canvasW, canvasH, derivedForLabel) {
  if (!isObj(meta)) { findings.push(`${label}: not a meta object`); return; }
  const type = meta.facing_type === undefined ? null : meta.facing_type;
  for (const k of META_REQUIRED) {
    if (meta[k] == null) {
      findings.push(`${label}: §5 field "${k}" is missing — the renderer resolves one meta or the fallback, never a blend, so a partial meta reaches the paint as undefined [row11:meta.required_fields]`);
    }
  }
  for (const k of Object.keys(meta)) {
    if (!META_KEYS.includes(k)) {
      findings.push(`${label}: unknown §5 field "${k}" — a meta the renderer reads has a fixed vocabulary, and a misspelling of a field it reads would otherwise ride through in silence [row11:meta.unknown_key]`);
    }
  }
  if (meta.storey_height_m != null &&
      !(typeof meta.storey_height_m === "number" && meta.storey_height_m > 1.8 && meta.storey_height_m < 12)) {
    findings.push(`${label}: storey_height_m ${JSON.stringify(meta.storey_height_m)} is not a room height a person stands up in — the renderer draws a ceiling from it [row11:meta.storey_height]`);
  }
  /* `wall_segments` describes where the building stands across the view, in
   * view-relative metres. A segment past the wall's own width, or one that
   * overlaps its neighbour, is a band the picture cannot honestly draw. */
  if (Array.isArray(meta.wall_segments)) {
    let prev = -Infinity;
    for (const seg of meta.wall_segments) {
      if (!isObj(seg) || typeof seg.from_m !== "number" || typeof seg.to_m !== "number" ||
          !(seg.from_m < seg.to_m)) {
        findings.push(`${label}: wall_segments entry ${JSON.stringify(seg)} is not a band with two ends [row11:meta.segment_shape]`);
        continue;
      }
      if (seg.from_m < -1e-6 || seg.to_m > meta.wall_width_m + 1e-6) {
        findings.push(`${label}: wall_segments band ${seg.from_m}–${seg.to_m} m runs outside the ${meta.wall_width_m} m in view [row11:meta.segment_bounds]`);
      }
      if (seg.from_m < prev - 1e-6) {
        findings.push(`${label}: wall_segments band ${seg.from_m}–${seg.to_m} m overlaps the one before it [row11:meta.segment_order]`);
      }
      prev = seg.to_m;
    }
  }
  /* [Row 21] `openings` is the doorway as a fact about the BUILDING: the
   * rectangle a player walks through, in scene pixels, derived from the plan
   * on a synthesized facing and measured off the painting on a real one. It is
   * the aperture where no leaf is staged AND the `go` target, so a malformed
   * entry is a hole in a wall nobody can see or a click target over solid
   * paint — §11's "the painted opening must coincide with the click target"
   * read as a schema. */
  if (meta.openings !== undefined) {
    if (!Array.isArray(meta.openings)) {
      findings.push(`${label}: openings is ${JSON.stringify(meta.openings)}, not a list of rectangles [row21:meta.openings_list]`);
    } else {
      for (const o of meta.openings) {
        if (!isObj(o) || ["x", "y", "w", "h"].some((k) => typeof o[k] !== "number" || !isFinite(o[k])) ||
            !(o.w > 0) || !(o.h > 0)) {
          findings.push(`${label}: opening ${JSON.stringify(o)} is not a rectangle with a width and a height [row21:meta.opening_rect]`);
          continue;
        }
        if (o.via !== null && o.via !== undefined && typeof o.via !== "string") {
          findings.push(`${label}: opening ${JSON.stringify(o.id ?? o)} carries via ${JSON.stringify(o.via)} — the id of the entity that fills it, or null [row21:meta.opening_via]`);
        }
        /* [Row 15] AND WHICH KIND OF WAY THROUGH IT IS, because the renderer
         * branches on it and the branches are opposites: a `door` must fall
         * inside a band that is built and is drawn with a jamb, reveals and
         * the room beyond; a `threshold` must fall where nothing is built and
         * is drawn with nothing at all. A missing or misspelled kind would
         * take the door branch by default and cut a jamb into open ground. */
        if (!OPENING_KINDS.includes(o.kind)) {
          findings.push(`${label}: opening ${JSON.stringify(o.id ?? o)} is kind ${JSON.stringify(o.kind)}, not one of ${OPENING_KINDS.join(" | ")} — the renderer draws a jamb through one and nothing through the other [row15:meta.opening_kind]`);
        }
        /* [Row 19] A DOOR IS NOT TALLER THAN ITS OWN ROOM. Blueprint §11 rules
         * every door opening at 1.00 × 2.00 m and the projection states that
         * height in code, because the plan carries no vertical datum; the
         * room's height comes from `plan.floors[].storey_height_m`, a separate
         * document field an agent may set. Nothing compared them, so a 2.00 m
         * head in a 1.85 m storey was a door through the ceiling that every
         * clause admitted. A `threshold` is exempt by construction: it has no
         * head, which is what makes it a threshold. */
        if (o.kind === "door" && typeof meta.storey_height_m === "number" &&
            isFinite(meta.storey_height_m) && meta.px_per_m_at_wall > 0) {
          const headM = o.h / meta.px_per_m_at_wall;
          if (headM > meta.storey_height_m + 1e-6) {
            findings.push(`${label}: opening ${JSON.stringify(o.id ?? o)} stands ${headM.toFixed(3)} m to its head in a room the plan gives ${meta.storey_height_m} m — a door taller than its own storey goes through the ceiling [row19:meta.opening_over_storey]`);
          }
        }
        /* [Row 21, round 5] THE TWO FIELDS THE THROUGH-VIEW IS COMPUTED FROM.
         * `x/y/w/h` were typed above and these two were not, so a document
         * whose depth beyond a doorway is the string "eight point six" passed
         * every clause and the first thing to notice was the renderer's own
         * throw — at paint time, on the player's screen, through the fault
         * surface. `beyond_m` may be NULL: a meta that cannot say what lies
         * beyond an opening says so, and the picture then draws nothing there.
         * What it may not be is a value that is neither. And an opening that
         * knows its depth must know its offset, because the transform needs
         * both: half an answer places the far room on the wrong axis. */
        const depthTrouble = [];
        let known = 0;
        for (const [k, nonNegative] of [["beyond_m", true], ["beyond_offset_m", false]]) {
          const v = o[k];
          if (v === null || v === undefined) continue;
          known++;
          if (typeof v !== "number" || !isFinite(v) || (nonNegative && v < 0)) {
            depthTrouble.push(`${k} is ${JSON.stringify(v)}, where the metres through an opening are a finite number${nonNegative ? " that is not behind the camera" : ""} or null`);
          }
        }
        /* [Kabe, 2026-08-30] A way through must know how thick the wall is:
         * `depth_m` is what projects the threshold the far room may never
         * cross, and a door that knows what lies beyond but not its own depth
         * would draw that room to the floor line - "fundamentally nonsensical". */
        if (o.depth_m !== null && o.depth_m !== undefined && !(typeof o.depth_m === "number" && isFinite(o.depth_m) && o.depth_m > 0)) {
          depthTrouble.push(`depth_m is ${JSON.stringify(o.depth_m)}, where the wall's thickness at an opening is a positive number of metres (the plan's opening rect spans it); absent means the floor line`);
        }
        if (known === 1) {
          depthTrouble.push(o.beyond_m == null
            ? "it knows where the far room stands across the view and not how far off it is"
            : "it knows how far the far room is and not where it stands across the view");
        }
        /* ONE EMIT SITE, because one token means one place: the arms are
         * collected and reported together rather than pushed one at a time. */
        if (depthTrouble.length) {
          findings.push(`${label}: opening ${JSON.stringify(o.id ?? o)} — ${depthTrouble.join("; ")}. The through-view transform needs both or neither [row21:meta.opening_beyond]`);
        }
        /* NOT checked here: whether the rectangle is in frame. Under a pinned
         * lens a wall runs past the frame and so do its carriers — the cross
         * passage's 8.00 m south wall carries a door 1720 px out — and
         * refusing that would refuse the honest picture, exactly as row 20's
         * retired (i) would have. What must be in frame is the opening an EXIT
         * uses, because that one is a `go` target a player has to be able to
         * reach; that clause is on the exit, where the world says which
         * openings are doors you may walk through. */
      }
    }
  }
  /* [Row 15] THE FLIGHTS THIS VIEW HOLDS. A stair entry is three things at
   * once — the rectangle the page accepts a `go` click inside, the outline the
   * grid strokes and the hover halo traces, and the well the ceiling is cut
   * out of — so a malformed one is a climb nobody can reach, a flight drawn as
   * a smear, or a ceiling with a hole in the wrong place. Every arm is
   * collected and reported through ONE emit site, because one token means one
   * place. */
  if (meta.stairs !== undefined) {
    const flightTrouble = [];
    if (!Array.isArray(meta.stairs)) {
      flightTrouble.push(`stairs is ${JSON.stringify(meta.stairs)}, not a list of flights`);
    } else {
      for (const s of meta.stairs) {
        const bad = [];
        if (!isObj(s)) bad.push("it is not an object");
        else {
          if (["x", "y", "w", "h"].some((k) => typeof s[k] !== "number" || !isFinite(s[k])) ||
              !(s.w > 0) || !(s.h > 0)) bad.push("its rectangle is not a rectangle with a width and a height");
          if (s.direction !== "up" && s.direction !== "down") {
            bad.push(`direction is ${JSON.stringify(s.direction)}, and a flight is climbed or descended`);
          }
          if (!(typeof s.rise_m === "number" && isFinite(s.rise_m) && s.rise_m > 0)) {
            bad.push(`rise_m is ${JSON.stringify(s.rise_m)}, where a storey is a finite height`);
          }
          if (!(Number.isInteger(s.treads) && s.treads > 0)) {
            bad.push(`treads is ${JSON.stringify(s.treads)}`);
          }
          /* [ROW 25] `hit_polys` is a LIST of rings — the body the picture
           * draws, which is the region a click answers to — so every one of
           * them is checked, and the list itself may not be empty. */
          const rings = [];
          if (!Array.isArray(s.hit_polys)) {
            bad.push("hit_polys is not a list of rings");
          } else {
            if (!s.hit_polys.length) {
              bad.push("hit_polys is empty — a flight with no region is drawn and cannot be climbed");
            }
            s.hit_polys.forEach((r, i) => rings.push([`hit_polys[${i}]`, r]));
          }
          for (const k of ["floor_poly", "well_poly"]) rings.push([k, s[k]]);
          for (const [k, r] of rings) {
            if (!Array.isArray(r)) { bad.push(`${k} is not a ring of points`); continue; }
            /* `well_poly` is EMPTY on a descending flight, by design: it opens
             * the floor you stand on, not the ceiling over your head. An empty
             * ring is legal; a ring of one point, or of non-numbers, is not. */
            if (r.length && r.length < 3) bad.push(`${k} has ${r.length} point(s), which is not a ring`);
            if (r.some((pt) => !Array.isArray(pt) || pt.length !== 2 ||
                pt.some((n) => typeof n !== "number" || !isFinite(n)))) {
              bad.push(`${k} carries a point that is not two finite numbers`);
            }
          }
          /* AND EVERY DRAWN FACE SAYS WHICH WAY IT TURNS, because §7's one key
           * is applied per face in the renderer and a face with no normal would
           * be lit by a default nobody chose. */
          for (const [list, norms, label] of [[s.treads_poly, s.treads_normal, "treads"],
            [s.mass_poly, s.mass_normal, "mass"]]) {
            if (!Array.isArray(list)) { bad.push(`${label}_poly is not a list of rings`); continue; }
            if (!Array.isArray(norms) || norms.length !== list.length) {
              bad.push(`${label}_normal does not name one direction per ${label} face`);
              continue;
            }
            if (norms.some((n) => !Array.isArray(n) || n.length !== 3 ||
                n.some((c) => typeof c !== "number" || !isFinite(c)))) {
              bad.push(`${label}_normal carries a direction that is not three finite numbers`);
            }
          }
          if (Array.isArray(s.treads_poly) &&
              (!Array.isArray(s.treads_face) || s.treads_face.length !== s.treads_poly.length ||
               s.treads_face.some((f) => f !== "going" && f !== "riser" && f !== "ramp"))) {
            bad.push("treads_face does not name every tread face as a going, a riser or a ramp");
          }
          /* [ROW 26] AND IT SAYS HOW BIG IT WOULD BE IF THE FRAME LET IT.
           * `x/y/w/h` on a flight are already the intersection with the canvas,
           * so they cannot say how much of the flight the frame ate — which is
           * how row 26's usability clause came to be arithmetically incapable
           * of firing on a staircase. `raw_w`/`raw_h` are the unclamped extent
           * and the clause reads them; a meta that omits them, or claims a body
           * SMALLER than the part of it on screen, would send the clause back
           * to comparing a number with itself. */
          for (const k of ["raw_w", "raw_h"]) {
            if (typeof s[k] !== "number" || !isFinite(s[k]) || !(s[k] > 0)) {
              bad.push(`${k} is ${JSON.stringify(s[k])} — a flight states the extent it would draw before the frame cut it`);
            }
          }
          if (typeof s.raw_w === "number" && typeof s.w === "number" && s.raw_w < s.w - 1e-6) {
            bad.push(`raw_w ${s.raw_w} is narrower than the ${s.w} px of it on the frame`);
          }
          if (typeof s.raw_h === "number" && typeof s.h === "number" && s.raw_h < s.h - 1e-6) {
            bad.push(`raw_h ${s.raw_h} is shorter than the ${s.h} px of it on the frame`);
          }
          /* AND A FLIGHT CUT BY AN EDGE CLAIMS A BODY BIGGER THAN WHAT SURVIVED.
           *
           * `raw_w === w` is the same arithmetic the row was defeated by —
           * `onW >= min(w, bar)` reading `onW >= onW` — arriving by a different
           * door. `deriveMeta` cannot produce it where the frame actually cut
           * something, because the clamp only bites when the extent runs past an
           * edge. But a MEASURED meta is hand-authored JSON returned verbatim by
           * tier 1, so a promoted backdrop of a stair room could carry a flight
           * flush to the frame edge with an extent equal to the part on screen,
           * and the usability clause would go quiet on it. The condition is
           * where the equality is a LIE: a body touching an edge ran off it. A
           * flight wholly inside the frame legitimately claims raw === clamped,
           * which is why this is not a bare `raw_w > w`. */
          const touches = (lo, size, limit) =>
            typeof lo === "number" && typeof size === "number" &&
            (lo <= 1e-6 || lo + size >= limit - 1e-6);
          if (touches(s.x, s.w, CANVAS_W) && typeof s.raw_w === "number" &&
              typeof s.w === "number" && s.raw_w <= s.w + 1e-6) {
            bad.push(`raw_w ${s.raw_w} equals the ${s.w} px on the frame while the flight runs to a side edge — a body the frame cut is wider than what is left of it`);
          }
          if (touches(s.y, s.h, CANVAS_H) && typeof s.raw_h === "number" &&
              typeof s.h === "number" && s.raw_h <= s.h + 1e-6) {
            bad.push(`raw_h ${s.raw_h} equals the ${s.h} px on the frame while the flight runs to a top or bottom edge — a body the frame cut is taller than what is left of it`);
          }
        }
        if (bad.length) flightTrouble.push(`flight ${JSON.stringify((s && s.id) ?? s)} — ${bad.join("; ")}`);
      }
    }
    /* ONE EMIT SITE, because one token means one place — the shape row 21's
     * `meta.opening_beyond` settled on and the reason the ledger can say which
     * arm fired. */
    if (flightTrouble.length) {
      findings.push(`${label}: ${flightTrouble.join(" | ")} [row15:meta.stairs_list]`);
    }
  }
  if (type !== null && !FACING_TYPES.includes(type)) {
    findings.push(`${label}: facing_type ${JSON.stringify(type)} is not one of ${FACING_TYPES.join(" | ")} or null (blueprint §5) [row11:meta.facing_type]`);
  }
  const hasWall = meta.camera_wall_m != null;
  const hasFar = meta.camera_far_m != null;
  if (type === "open") {
    if (!hasFar) findings.push(`${label}: an open facing must carry camera_far_m — it views a drawn ground line, not a surface [row11:meta.open_needs_far]`);
    if (hasWall) findings.push(`${label}: an open facing carries camera_wall_m — the field name is the mechanism (§5): a depth model handed a far line as a wall distance puts a horizon where a wall goes [row11:meta.open_rejects_wall]`);
  } else {
    if (!hasWall) findings.push(`${label}: facing_type ${JSON.stringify(type)} must carry camera_wall_m [row11:meta.walled_needs_wall]`);
    if (hasFar) findings.push(`${label}: facing_type ${JSON.stringify(type)} carries camera_far_m — only an open facing has a far line instead of a wall plane [row11:meta.walled_rejects_far]`);
  }
  const c0 = meta.corner_x0_px, c1 = meta.corner_x1_px;
  const cornered = typeof c0 === "number" && typeof c1 === "number";
  if (!cornered && (typeof c0 === "number" || typeof c1 === "number")) {
    findings.push(`${label}: one corner without the other — a wall has two ends or none [row11:meta.corner_pairing]`);
  }
  if (cornered && !(c0 < c1)) {
    findings.push(`${label}: corner_x0_px ${c0} is not left of corner_x1_px ${c1} [row11:meta.corner_order]`);
  }
  if (type === "open" && cornered) {
    findings.push(`${label}: an open facing carries corners — law (b): where no building stands the ground runs open to its far line, and a corner there would be an invented enclosure [row11:meta.open_no_corners]`);
  }
  /* An open facing with corners is `meta.open_no_corners`'s violation, not
   * this one — one violation, one clause, or the ledger cannot isolate
   * either. */
  if (type !== "open" && meta.wall_continuous === false && cornered) {
    findings.push(`${label}: a discontinuous wall carries corners — a view that is part building and part open ground has segments, not two corners [row11:meta.segmented_no_corners]`);
  }
  /* An OPEN facing legitimately has no bands — that is what open means, and
   * `deriveMeta` emits `wall_continuous: false` with empty segments for one.
   * This clause is about a WALLED view that is part building and part open
   * ground: there, the bands are the only thing that says where the building
   * is. Row 11 shipped it without the exemption, so the schema refused the
   * very metas its own open branch produces — invisible because no facing M0
   * ships is open, and found by the ledger's exclusivity check the moment a
   * case built a valid one. */
  if (type !== "open" && meta.wall_continuous === false &&
      !(Array.isArray(meta.wall_segments) && meta.wall_segments.length > 0)) {
    findings.push(`${label}: wall_continuous is false but wall_segments says nothing is built — law (b) needs the bands, or nothing can say where the building is [row11:meta.segments_present]`);
  }
  if (type === null && cornered) {
    findings.push(`${label}: a facing no plan holds carries corners — a room whose extent nobody has drawn must not claim two [row11:meta.null_type_no_corners]`);
  }
  /* §12.5 (i) IS RETIRED, AND (i′) STANDS IN ITS PLACE (row 20).
   *
   * (i) asserted that the wall in view fits the frame — `0 ≤ corner_x0_px`,
   * `corner_x1_px ≤ canvasW`, and for an uncornered view `wall_width_m ×
   * px_per_m_at_wall ≤ canvasW`. It was worth having because it reached
   * OUTSIDE the meta, to the canvas. Under a pinned scale a wall that did not
   * fit had to be clipped, so not fitting was a defect.
   *
   * Under a pinned LENS it is not. A wall wider than the frame extends past
   * it, exactly as it does in life: the cross passage's 8.00 m north wall seen
   * from 2.15 m is 3810 px of wall in a 1536 px frame and its corners are
   * 1137 px outside, and that is what standing 2 m from a long wall looks
   * like. Keeping the clause would refuse the honest picture. It is retired
   * rather than widened, and its three ledger mechanisms with it — a claim
   * that stopped being true is narrowed, not softened.
   *
   * (i′) ONE LENS. What replaces it is the row's own law: the focal length a
   * meta implies is the ruled one. Both terms are outside the meta —
   * `groundplane.FOCAL_PX`, which `assertRuledLens` pins to §10's
   * `camera.focal_mm`, and the distance the drawing measures.
   *
   * ITS STATUS, SAID OUT LOUD, because this project has paid five times for
   * gates that cannot fail: on a DERIVED meta this holds by construction
   * (`deriveMeta` computes `px_per_m_at_wall` as `FOCAL_PX / distance`) and it
   * is a schema clause, not evidence. On a MEASURED backdrop meta it is
   * evidence and can fail: the scale is read off the painting's own pixels and
   * the distance off the approved drawing, so their product is a claim about a
   * picture. Row 20's eight painted facings are the first metas it judges. */
  if (typeof meta.px_per_m_at_wall === "number") {
    const dist = meta.camera_wall_m != null ? meta.camera_wall_m : meta.camera_far_m;
    if (typeof dist === "number") {
      const focal = meta.px_per_m_at_wall * dist;
      /* TWO ARMS, AND THE MEASURED ONE IS THE ONE WITH TEETH. A derived meta
       * must hit the ruled focal exactly. A measured one is a reading off a
       * painting and cannot, so its band is the SAME band the asset seat's
       * acceptance gate uses, sourced here rather than invented: a candidate
       * backdrop is admitted when its implied focal lands within ±3 % of
       * `study/N`'s measured 1010 px — the one frame Kabe's own probe approved
       * — and a meta this validator admits must be exactly the set that gate
       * admits, or the corpus passes one law and fails the other. Before this
       * was written down the arm read `0.05`, a literal that agreed with no
       * document, that nothing exercised, and that a critic widened to 0.99
       * with the whole suite green. `measuredLensBand()` is its one home and
       * `plan.spec` binds it to `gate.py`'s own two literals. */
      /* AND THE TWO ARMS CARRY TWO TOKENS, because one token over two arms is
       * one countable thing over two behaviours and the ledger can only ever
       * exercise whichever the case happens to reach. That is the
       * `meta.camera_pairing` failure `guards.spec`'s own header exists to
       * prevent, and this clause committed it again until a critic widened the
       * unexercised arm to 0.99 with the suite green. */
      if (meta.measured) {
        /* ...AROUND THE CAMERA THIS WALL ANSWERS TO, which `measuredLensBand`
         * above states in full. The width is the same ±MEASURED_BAND either
         * way; only the centre is the meta's to name, and naming nothing names
         * the stricter one. */
        const band = measuredLensBand(meta.camera_reference);
        if (!(focal >= band.lo && focal <= band.hi)) {
          findings.push(`${label}: MEASURED ${meta.px_per_m_at_wall.toFixed(2)} px/m at ${dist} m is a ${focal.toFixed(1)} px lens, outside the ±${(MEASURED_BAND * 100).toFixed(0)}% acceptance band ${band.lo.toFixed(1)}..${band.hi.toFixed(1)} px around the ${band.centre === FOCAL_PX ? `ruled ${FOCAL_PX}` : `approved ${MEASURED_REFERENCE_PX}`} px camera it declares (§12.5 (i′), blueprint §5/§10) — the painting is not on the project's camera [row20:meta.one_lens_measured]`);
        }
      } else if (!(Math.abs(focal - FOCAL_PX) / FOCAL_PX <= DERIVED_LENS_TOL)) {
        findings.push(`${label}: ${meta.px_per_m_at_wall.toFixed(2)} px/m at ${dist} m is a ${focal.toFixed(1)} px lens, not the ruled ${FOCAL_PX} px (§12.5 (i′), blueprint §10) — one lens per room, and per manor [row20:meta.one_lens]`);
      }
    }
  }
  /* [Row 32 — the Captain's suspect-painting tolerance ruling, 2026-08-24]
   * THE DECLARED-CAMERA META VARIANT, KNOWN TO THE GATE BY ITS OWN CLAUSES.
   *
   * The band above did not move and is not reached by anything here: a
   * declared-camera meta is still `measured: true`, still carries the scale it
   * was read at, and is still refused outside ±MEASURED_BAND. That is what
   * makes its wall a SUSPECT rather than a FAILURE — the ruler passed and the
   * perspective is what disagreed — and widening the measured clause to admit
   * this family would have thrown that distinction away, which is why this is
   * a separate vocabulary rather than a looser tolerance.
   *
   * What these clauses hold is the HONESTY of the record: a meta whose horizon
   * came from the declared camera must say so, must carry the suspect flag row
   * 4's staging reads, must cite the ruling that admits it, and must claim
   * neither more nor less of the declared licence than `DECLARED_CAMERA_FIELDS`
   * gives it. And the flag may not be worn by a meta that did not take the
   * path: a measured meta carrying `suspect_perspective` would put a wall on
   * Kabe's suspect surface that nothing ever ruled suspect. */
  {
    const src = meta.camera_source;
    if (src !== undefined && !CAMERA_SOURCES.includes(src)) {
      findings.push(`${label}: camera_source ${JSON.stringify(src)} is not one of ${CAMERA_SOURCES.join(" | ")} — a meta's camera was either read off its painting or taken from the page's own derived camera, and there is no third place it could have come from [row32:meta.camera_source]`);
    }
    const declared = src === "declared";
    /* [THE WARP EXIT, 2026-08-29] A WARPED META IS DECLARED AND IS NOT SUSPECT.
     * The two paths to a declared horizon are now different acts: the tolerance
     * ruling ACCEPTS a drift a human signed for, and the warp CORRECTS it — the
     * painting's own landmarks were moved onto the plan's at that very camera,
     * so the horizon is the one the pixels answer to and there is nothing for a
     * flag or a ruling to license. What such a meta must carry instead is the
     * correction's own numbers, and they are checked here by name: a warped wall
     * that records no residual is a wall claiming a correction nobody can read.
     * The measured half of this block is untouched. */
    const warp = (meta.measured_room && meta.measured_room.warp) || null;
    if (declared && warp) {
      const missing = ["pins", "residuals", "worst_segment", "revealed_px"]
        .filter((k) => warp[k] === undefined || warp[k] === null);
      if (missing.length) {
        findings.push(`${label}: camera_source is "declared" on a WARPED frame and measured_room.warp is missing ${missing.join(", ")} — the warp promotes on the declared camera because the painting was moved onto it, and the record of that motion is the whole of the licence: pins, residuals, worst segment and revealed pixels, recorded and never gated. A warped meta that carries no numbers is a flag again [warp:meta.warp_record_incomplete]`);
      }
      if (meta.suspect_perspective !== undefined || meta.tolerance_ruling !== undefined) {
        findings.push(`${label}: a warped meta carries ${["suspect_perspective", "tolerance_ruling"].filter((k) => meta[k] !== undefined).join(" and ")} — those belong to the tolerance path, where a human accepted a drift nothing corrected. This painting's perspective WAS corrected, and saying both is the record contradicting itself about what happened to the picture [warp:meta.warped_not_suspect]`);
      }
      if (JSON.stringify(meta.declared_fields) !== JSON.stringify(WARPED_CAMERA_FIELDS)) {
        findings.push(`${label}: declared_fields is ${JSON.stringify(meta.declared_fields)}, and a WARPED frame's declared camera fills exactly ${JSON.stringify(WARPED_CAMERA_FIELDS)} — the warp put the floor row, the wall's scale and the two corner columns where the scaffold's meta rules them, so a record that names fewer claims to have measured off the picture a number the resampling wrote, and one that names more claims a licence the warp never took [warp:meta.declared_fields_claim]`);
      }
    } else if (declared) {
      if (meta.suspect_perspective !== true) {
        findings.push(`${label}: camera_source is "declared" and suspect_perspective is ${JSON.stringify(meta.suspect_perspective)} — the declared camera exists only for the suspect-painting family, and a wall promoted under it that does not fly the flag is invisible to row 4's staging and to the flip test that judges it [row32:meta.declared_needs_suspect]`);
      }
      const ruling = meta.tolerance_ruling;
      if (typeof ruling !== "string" || !TOLERANCE_LOG.test(ruling) ||
          !TOLERANCE_CITATION.test(ruling)) {
        findings.push(`${label}: camera_source is "declared" and tolerance_ruling is ${JSON.stringify(ruling)} — this path is open only because a human ruled it open, so the meta cites the approvals line and his own words, and a licence that names no authority is an agent widening a gate [row32:meta.declared_needs_ruling]`);
      }
      if (JSON.stringify(meta.declared_fields) !== JSON.stringify(DECLARED_CAMERA_FIELDS)) {
        findings.push(`${label}: declared_fields is ${JSON.stringify(meta.declared_fields)}, and the declared camera fills exactly ${JSON.stringify(DECLARED_CAMERA_FIELDS)} — omitting a field it filled claims a measured horizon this painting never fixed, and naming one it did not fill (the scale above all) claims by declaration a number the band judged off the picture [row32:meta.declared_fields_claim]`);
      }
    } else {
      const worn = ["suspect_perspective", "tolerance_ruling", "declared_fields"]
        .filter((k) => meta[k] !== undefined);
      if (worn.length) {
        findings.push(`${label}: carries ${worn.join(", ")} without camera_source "declared" — the flag, the ruling and the licence belong to one path, and a meta wearing them off it puts a wall on the suspect surface that nothing ever ruled suspect [row32:meta.suspect_needs_declared]`);
      }
    }
  }
  /* [Row 21, round 3 — G1] A MEASURED META'S BUILDING HALF IS THE PLAN'S, and
   * until this it was held by nothing: a critic changed `promote-backdrop.mjs`
   * to take the storey from the PAINTING instead, shipped a meta declaring
   * 2.997 m against a plan that rules 2.80, and the whole suite stayed green —
   * with the renderer drawing its ceiling from that field. The measured half
   * of a meta is a reading off a painting and has its own clauses above; the
   * building half is a fact the drawing rules and the painting answers to, and
   * the derived meta for the same facing IS the plan's answer to it. So they
   * are compared, field by field, and a painting cannot re-rule the building
   * by being promoted. */
  if (meta.measured && derivedForLabel) {
    const BUILDING = ["wall_width_m", "camera_wall_m", "camera_far_m",
      "storey_height_m", "facing_type", "wall_continuous"];
    for (const k of BUILDING) {
      const a = meta[k], b = derivedForLabel[k];
      if (a === undefined && b === undefined) continue;
      if (JSON.stringify(a) !== JSON.stringify(b)) {
        findings.push(`${label}: measured meta says ${k} = ${JSON.stringify(a)}, the plan says ${JSON.stringify(b)} — a painting is measured for its pixels and answers to the drawing for its metres [row21:meta.building_fields]`);
      }
    }
    if (JSON.stringify(meta.wall_segments) !== JSON.stringify(derivedForLabel.wall_segments)) {
      findings.push(`${label}: measured meta's wall_segments differ from the plan's — where the building stands across a view is the plan's to say [row21:meta.building_segments]`);
    }
  }
  if (meta.image_h_px != null && meta.image_h_px !== canvasH) {
    findings.push(`${label}: image_h_px ${meta.image_h_px} is not the ${canvasH}px canvas it is a meta for (§12.5 (iv)) [row11:meta.image_h]`);
  }
}

function placementList(v) {
  return Array.isArray(v) ? v : [v];
}

function isAnchorPlacement(p) {
  return isObj(p) && ("anchor_on" in p || "t" in p);
}

function checkKeys(obj, allowed, required, label, findings, worldNote) {
  for (const k of Object.keys(obj)) {
    if (!allowed.includes(k)) {
      if (worldNote && k === "airborne") {
        findings.push(
          `world.json: ${label} carries "airborne" — a sprite-record key smuggled into truth (§6 homes it on the record, where the contact shadow reads it)`
        );
      } else {
        findings.push(`${worldNote ? "world.json" : "staging.json"}: ${label} carries forbidden key "${k}"`);
      }
    }
  }
  for (const k of required) {
    if (!(k in obj)) {
      findings.push(`${worldNote ? "world.json" : "staging.json"}: ${label} missing required key "${k}"`);
    }
  }
}

/* Projected screen x-span and y-span of a staged placement. This calls
 * groundplane.placeHost — the SAME function renderer.layout places every
 * entity with — so the static overlap guarantee is bound to the pixels the
 * renderer draws. Re-deriving the placement layer here (importing only the
 * scale functions under it) left this check asserting overlaps in a world
 * the renderer had stopped drawing: break placement in the renderer and the
 * validator stayed green. Every attachment class placeHost knows is covered,
 * wall_mounted included. */
function projectSpans(pl, rec, meta) {
  return groundplane.placeHost(pl, rec, meta, CANVAS_W);
}

function lineProblem(line, key) {
  if (typeof line !== "string") return "is not a string";
  const t = line.trim();
  if (t === "") return "is empty";
  if (t.length < 10) return "is shorter than 10 characters";
  if (t === key) return "equals its own key";
  if (PLACEHOLDER_RE.test(line)) return "contains a placeholder token";
  return null;
}

function parseNarrationKey(k) {
  const m = /^([^.]+)\.(.+)\.([^.]+)$/.exec(k);
  if (!m) return null;
  return { intent: m[1], target: m[2], outcome: m[3] };
}

export function validate(fixtureDir, records, derivedMetas) {
  const findings = [];

  const world = loadJson(fixtureDir, "world.json", findings);
  const staging = loadJson(fixtureDir, "staging.json", findings);
  const viewstate = loadJson(fixtureDir, "viewstate.json", findings);
  const narration = loadJson(fixtureDir, "narration.json", findings);

  /* Row 11: the plan's derived metas, tier 2 of the resolution. Loaded here
   * rather than inside metaForFacing so a caller can hand in the very map the
   * page was baked with — the check and the picture then read one object. The
   * default reads the fixture's own plan, which is what the CLI does. */
  const derived = derivedMetas || derivedMetasFor(fixtureDir, world, findings);
  /* [Row 15] The plan itself, for the completeness half below — which asks
   * what the plan DRAWS that the world never opens, a question no per-exit
   * clause can answer. Read through `resolvePlanPath`, the one home of where a
   * fixture's plan lives. */
  let plan = null;
  {
    const planFile = resolvePlanPath(fixtureDir);
    if (existsSync(planFile)) {
      try { plan = JSON.parse(readFileSync(planFile, "utf8")); } catch (e) { plan = null; }
    }
  }

  /* Every facing the world names resolves to a meta, and every one of them is
   * checked — not only the ones something happens to be staged on. A bare
   * facing with a broken meta still draws a room. */
  if (isObj(world) && Array.isArray(world.locations)) {
    for (const loc of world.locations) {
      if (!isObj(loc) || !Array.isArray(loc.facings)) continue;
      for (const f of loc.facings) {
        const key = `${loc.id}/${f}`;
        checkMeta(`meta ${key}`, metaForFacing(key, findings, derived), findings,
          CANVAS_W, GRID_META.image_h_px, derived && derived[key]);
      }
    }
  }

  if (!isObj(records)) {
    findings.push("records: not an object — src/placeholders.js records expected");
    return findings;
  }

  /* ---- 1. Truth/presentation split by key whitelist ------------------- */

  const locations = new Map(); // id -> location object
  const entities = new Map(); // id -> entity object
  const exits = new Map(); // id -> exit object

  if (world !== null && !isObj(world)) findings.push("world.json: not a JSON object");
  if (isObj(world)) {
    for (const k of Object.keys(world)) {
      if (!WORLD_TOP_KEYS.includes(k)) findings.push(`world.json: forbidden top-level key "${k}"`);
    }
    for (const k of WORLD_TOP_KEYS) {
      if (!(k in world)) findings.push(`world.json: missing top-level key "${k}"`);
    }

    if (Array.isArray(world.locations)) {
      world.locations.forEach((loc, i) => {
        if (!isObj(loc)) {
          findings.push(`world.json: locations[${i}] is not an object`);
          return;
        }
        checkKeys(loc, LOCATION_KEYS, LOCATION_REQ, `location "${loc.id ?? i}"`, findings, true);
        if (typeof loc.id === "string") locations.set(loc.id, loc);
        if (!Array.isArray(loc.facings) || loc.facings.some((f) => typeof f !== "string")) {
          findings.push(`world.json: location "${loc.id ?? i}" facings must be an array of strings`);
        }
        if ("exits" in loc) {
          if (!Array.isArray(loc.exits)) {
            findings.push(`world.json: location "${loc.id ?? i}" exits must be an array`);
          } else {
            loc.exits.forEach((ex, j) => {
              if (!isObj(ex)) {
                findings.push(`world.json: location "${loc.id ?? i}" exits[${j}] is not an object`);
                return;
              }
              checkKeys(ex, EXIT_KEYS, EXIT_KEYS, `exit "${ex.id ?? j}"`, findings, true);
              if (typeof ex.id === "string") exits.set(ex.id, ex);
            });
          }
        }
      });
    } else if ("locations" in world) {
      findings.push("world.json: locations must be an array");
    }

    if (Array.isArray(world.entities)) {
      world.entities.forEach((ent, i) => {
        if (!isObj(ent)) {
          findings.push(`world.json: entities[${i}] is not an object`);
          return;
        }
        checkKeys(ent, ENTITY_KEYS, ENTITY_REQ, `entity "${ent.id ?? i}"`, findings, true);
        if (typeof ent.id === "string") entities.set(ent.id, ent);
      });
    } else if ("entities" in world) {
      findings.push("world.json: entities must be an array");
    }

    /* Smuggled coordinates, anywhere in truth. */
    walkKeys(world, "", (k, path) => {
      if (COORD_KEY_RE.test(k)) {
        findings.push(`world.json: coordinate-shaped key "${k}" at ${path} — truth never holds coordinates`);
      }
    });
  }

  const placements = isObj(staging) && isObj(staging.placements) ? staging.placements : {};

  if (staging !== null && !isObj(staging)) findings.push("staging.json: not a JSON object");
  if (isObj(staging)) {
    for (const k of Object.keys(staging)) {
      if (!STAGING_TOP_KEYS.includes(k)) findings.push(`staging.json: forbidden top-level key "${k}"`);
    }
    for (const k of STAGING_TOP_KEYS) {
      if (!(k in staging)) findings.push(`staging.json: missing top-level key "${k}"`);
    }
    if ("placements" in staging && !isObj(staging.placements)) {
      findings.push("staging.json: placements must be an object");
    }

    for (const [id, value] of Object.entries(placements)) {
      const asArray = Array.isArray(value);
      if (!asArray && !isObj(value)) {
        findings.push(`staging.json: placement "${id}" is neither an object nor an array`);
        continue;
      }
      placementList(value).forEach((pl, i) => {
        const label = asArray ? `placement "${id}"[${i}]` : `placement "${id}"`;
        if (!isObj(pl)) {
          findings.push(`staging.json: ${label} is not an object`);
          return;
        }
        if (isAnchorPlacement(pl)) {
          if (asArray) {
            findings.push(`staging.json: ${label} is an anchor placement inside an array — arrays carry facing placements only (§4)`);
          }
          checkKeys(pl, ANCHOR_PLACEMENT_KEYS, ANCHOR_PLACEMENT_KEYS, label, findings, false);
        } else {
          checkKeys(pl, FACING_PLACEMENT_KEYS, FACING_PLACEMENT_REQ, label, findings, false);
        }
      });
    }

    /* World facts smuggled into presentation, anywhere. */
    walkKeys(staging.placements ?? {}, "placements", (k, path) => {
      if (WORLD_FACT_KEYS.has(k)) {
        findings.push(`staging.json: world-fact key "${k}" at ${path} — staging never holds facts`);
      }
    });
  }

  /* ---- 2. viewstate.json ---------------------------------------------- */

  if (viewstate !== null && !isObj(viewstate)) findings.push("viewstate.json: not a JSON object");
  if (isObj(viewstate)) {
    for (const k of Object.keys(viewstate)) {
      if (k !== "location" && k !== "facing") {
        findings.push(`viewstate.json: forbidden key "${k}" — boot viewstate holds exactly {location, facing}`);
      }
    }
    for (const k of ["location", "facing"]) {
      if (!(k in viewstate)) findings.push(`viewstate.json: missing key "${k}"`);
    }
    const loc = locations.get(viewstate.location);
    if ("location" in viewstate && !loc) {
      findings.push(`viewstate.json: location "${viewstate.location}" resolves to no world.json location`);
    } else if (loc && "facing" in viewstate && !(loc.facings || []).includes(viewstate.facing)) {
      findings.push(`viewstate.json: facing "${viewstate.facing}" is not a facing of location "${viewstate.location}"`);
    }
  }

  /* ---- 3. mirror: true rejected --------------------------------------- */

  for (const [id, value] of Object.entries(placements)) {
    placementList(value).forEach((pl, i) => {
      if (isObj(pl) && pl.mirror === true) {
        const label = Array.isArray(value) ? `placement "${id}"[${i}]` : `placement "${id}"`;
        findings.push(`staging.json: ${label} sets mirror: true — forbidden in M0 (mirroring flips the baked key light, §4)`);
      }
    });
  }

  /* ---- 4. Refs resolve; record sanity ---------------------------------- */

  const facingOf = (facingStr) => {
    const parts = String(facingStr).split("/");
    if (parts.length !== 2) return null;
    const loc = locations.get(parts[0]);
    if (!loc || !(loc.facings || []).includes(parts[1])) return null;
    return { location: parts[0], facing: parts[1] };
  };

  for (const [id, value] of Object.entries(placements)) {
    if (!entities.has(id)) {
      findings.push(`staging.json: placement "${id}" names no world.json entity`);
      continue;
    }
    placementList(value).forEach((pl) => {
      if (!isObj(pl)) return;
      if (isAnchorPlacement(pl)) {
        const ref = String(pl.anchor_on ?? "");
        const dot = ref.indexOf(".");
        const hostId = dot === -1 ? ref : ref.slice(0, dot);
        const region = dot === -1 ? "" : ref.slice(dot + 1);
        const host = entities.get(hostId);
        if (!host) {
          findings.push(`staging.json: placement "${id}" anchor_on "${ref}" names no world.json entity`);
          return;
        }
        if (!(hostId in placements)) {
          findings.push(`staging.json: placement "${id}" anchor_on "${ref}" — host "${hostId}" is not staged`);
        }
        const hostRec = records[host.sprite];
        if (!isObj(hostRec)) {
          findings.push(`staging.json: placement "${id}" anchor_on "${ref}" — host sprite "${host.sprite}" has no record`);
        } else if (!isObj(hostRec.anchors) || !isObj(hostRec.anchors[region])) {
          findings.push(`staging.json: placement "${id}" anchor_on "${ref}" — record "${host.sprite}" carries no anchor region "${region}"`);
        }
      } else {
        if ("facing" in pl && !facingOf(pl.facing)) {
          findings.push(`staging.json: placement "${id}" facing "${pl.facing}" names no world.json location/facing`);
        }
      }
    });
  }

  for (const [id, ent] of entities) {
    const rec = records[ent.sprite];
    if (!isObj(rec)) {
      findings.push(`world.json: entity "${id}" sprite "${ent.sprite}" has no library record`);
      continue;
    }
    if (Array.isArray(ent.states)) {
      if ("state" in ent && !ent.states.includes(ent.state)) {
        findings.push(`world.json: entity "${id}" state "${ent.state}" is not in its states ${JSON.stringify(ent.states)}`);
      }
      /* M0 pins two-state closed/open for every state entity, and three
       * layers already assume it by name: §7's swap rule reads "closed" as
       * the body image, the §12.9 outcome vocabulary is `open`/`closed`, and
       * the narration keys are written against those outcomes. A fixture
       * declaring other state names used to be accepted here and then
       * silently written a state outside its own list by the toggle. Pinning
       * it makes the assumption checkable instead of implicit; widening M0
       * past two states is a new row, and this finding is where it starts. */
      if (ent.states.length !== 2 ||
          ent.states[0] !== "closed" || ent.states[1] !== "open") {
        findings.push(
          `world.json: entity "${id}" declares states ${JSON.stringify(ent.states)} — M0 pins exactly ["closed","open"] (§7's swap rule, the §12.9 outcome vocabulary and the narration keys are all named for them)`
        );
      }
      /* World states covered by the record. */
      if (Array.isArray(rec.parts) && rec.parts.length > 0) {
        for (const part of rec.parts) {
          const covered = isObj(part.states) ? Object.keys(part.states) : [];
          for (const st of ent.states) {
            if (!covered.includes(st)) {
              findings.push(`world.json: entity "${id}" state "${st}" not covered by record "${ent.sprite}" part "${part.id}" states`);
            }
          }
        }
      } else if (isObj(rec.states_images)) {
        const covered = new Set(Object.keys(rec.states_images));
        covered.add("closed"); /* the body IS the closed state */
        for (const st of ent.states) {
          if (!covered.has(st)) {
            findings.push(`world.json: entity "${id}" state "${st}" not covered by record "${ent.sprite}" states_images ∪ {closed}`);
          }
        }
      } else {
        findings.push(`world.json: entity "${id}" carries states but record "${ent.sprite}" has neither parts nor states_images to cover them`);
      }
    }
    if (ent.takeable === true || rec.takeable === true) {
      if (!rec.thumb) {
        findings.push(`records: takeable record "${ent.sprite}" (entity "${id}") carries no thumb`);
      }
    }
    /* Anchor-hosted takeables carry attachment "anchored" (minted §6 token). */
    const pv = placements[id];
    const anchorStaged = pv !== undefined && !Array.isArray(pv) && isAnchorPlacement(pv);
    if (anchorStaged && ent.takeable === true && rec.attachment !== "anchored") {
      findings.push(`records: record "${ent.sprite}" (anchor-hosted takeable "${id}") attachment is "${rec.attachment}" — must be "anchored"`);
    }
    if (rec.attachment === "anchored" && pv !== undefined && !anchorStaged) {
      findings.push(`staging.json: entity "${id}" record "${ent.sprite}" carries attachment "anchored" but is not anchor_on-staged`);
    }
  }

  /* ---- [ROW 42] A LEAF DECLARES THE HOLE IT STANDS IN ------------------- */
  /* [HUMAN, 2026-08-24, verbatim] "Then we can have door assets and window
   * assets we literally place in the door frame to open/close and same with the
   * windows possibly." The binding that makes that possible is `fills`: the
   * entity names the aperture by the PLAN's own id, and the renderer puts the
   * sprite in the rectangle the PAINTING measured for it.
   *
   * The two halves of the declaration are checked against each other and then
   * against the building, because either half alone is a claim nobody tested:
   * `kind` with no `fills` is a door that stands in no doorway, `fills` with no
   * `kind` leaves the renderer to guess which list to look the id up in, and a
   * `fills` naming nothing the building holds is a sprite standing on blank
   * paint — the defect the promotion's own `window.unpainted` clause
   * exists to stop, arriving from the document side instead.
   *
   * WHAT COUNTS AS THE BUILDING HOLDING IT differs by kind, and the difference
   * is the state of the measurement rather than a preference. A DOORWAY is in
   * every facing's meta whether or not the wall is promoted, so a door's
   * `fills` must resolve in a meta of some facing it is staged on. A WINDOW is
   * in a meta only where `window_measure.py` has read that wall — no wall in
   * the store carries one yet, and `window_calibration.json` is the list —
   * so a casement's `fills` resolves against the PLAN's own window ids where
   * the meta is still silent. The plan is what rules the window either way; the
   * measurement is what says where it was painted. */
  if (entities.size > 0) {
    const planWindows = plan ? new Set(windowIds(plan).values()) : null;
    for (const [id, ent] of entities) {
      const hasKind = ent.kind !== undefined;
      const hasFills = ent.fills !== undefined;
      if (!hasKind && !hasFills) continue;
      /* ONE ARM FOR THE DECLARATION, three ways to get it wrong, because they
       * are one defect from the reader's side: the pair `kind` + `fills` does
       * not say what this entity stands in. The ledger's law is one token per
       * emit site, and splitting a malformed declaration into three sites
       * would be three clauses nobody can tell apart by what they DO. */
      let malformed = null;
      if (hasKind && !ENTITY_KINDS.includes(ent.kind)) {
        malformed = `kind ${JSON.stringify(ent.kind)} is not one of ${ENTITY_KINDS.join(" | ")} — a sprite placed in an aperture is a door or a casement, and the renderer routes on this`;
      } else if (hasKind && !hasFills) {
        malformed = `declares kind ${JSON.stringify(ent.kind)} and fills nothing — a leaf that names no aperture is a sprite with nowhere to be, and the renderer would place it from the plan on a wall the painting has already answered for`;
      } else if (hasFills && !hasKind) {
        malformed = `fills ${JSON.stringify(ent.fills)} and declares no kind — a doorway and a window light are two lists in a §5 meta and nothing here says which to read`;
      }
      if (malformed) {
        findings.push(`world.json: entity "${id}" ${malformed} [row42:entity.aperture_declaration]`);
        continue;
      }
      const staged = placementList(placements[id] ?? [])
        .filter((pl) => isObj(pl) && !isAnchorPlacement(pl) && typeof pl.facing === "string");
      let held = false;
      for (const pl of staged) {
        const m = metaForFacing(pl.facing, findings, derived);
        const hole = ent.kind === "window"
          ? groundplane.windowFor(m, ent.fills)
          : groundplane.openingFor(m, ent.fills);
        if (hole) { held = true; break; }
      }
      if (!held && ent.kind === "window" && planWindows && planWindows.has(ent.fills)) {
        /* The plan rules this window and no wall it is staged on has been
         * measured for glass yet. That is row 42's own stated edge, not a
         * broken document: the renderer draws no casement there and says so by
         * drawing nothing, and the day that wall is re-measured the sprite
         * appears in the light the painting drew. */
        held = true;
      }
      if (!held) {
        findings.push(`world.json: entity "${id}" fills ${JSON.stringify(ent.fills)}, which is no ${ent.kind === "window" ? "window the plan rules and no meta measures" : "opening in the meta of any facing it is staged on"} — a leaf standing in a hole the building does not have [row42:entity.fills_unheld]`);
      }
    }
  }

  /* Exits: via -> entity, to/from -> locations, arrive_facing in target
   * facings, facing in from-location facings. */
  for (const [exId, ex] of exits) {
    /* [Row 21] `via` names the thing you pass through, and there are exactly
     * two kinds. A LEAF is an entity, staged where the exits name it, and the
     * clause below still holds it to that. An OPENING is a fact about the
     * building — a hole in the wall no entity fills — and it is carried by the
     * facing's own §5 meta, derived from the plan for a synthesized facing and
     * measured off the painting for a real one. An empty painted room is
     * walkable because of the second kind.
     *
     * Naming NEITHER is the finding, and it has to be, because the harness
     * reads an unfilled opening as an open one: without this clause a typo in
     * `via` would become a doorway the player walks through in a blank wall.
     * The two arms carry two tokens, because one token over two behaviours is
     * one countable thing the ledger can only ever exercise on whichever arm
     * its case reaches.
     *
     * [ROW 26] THE `via`-IS-AN-ENTITY GATE BELOW LEAVES A LEAF-VIA EXIT
     * UNGUARDED BY THESE THREE ARMS, and the first version of this comment
     * justified that with something that is not true.
     *
     * It said a leaf's aperture is governed by the staging clauses instead.
     * What actually holds a leaf-via exit on the frame today is narrower than
     * that: `staging.outside_room` refuses a placement addressed outside the
     * room's own u-domain, and on `demo-study`'s walls the u-domain and the
     * frame nearly coincide, so a leaf cannot be placed far enough out to be
     * clipped. On a WIDE wall — the cross passage's 8.00 m north wall is 3810 px
     * in a 1536 px frame — the u-domain runs well past both edges and that
     * coincidence stops holding: a leaf-via exit whose leaf draws 0.12 px on
     * frame validates clean. The manor has no such exit; the protection is an
     * accident of the corpus rather than a clause, and an accident is worth
     * naming as one.
     *
     * Recorded as residue in `design/architecture.md` and carried by ROW 28
     * rather than widened here: this row's subject is the way through that the
     * BUILDING carries, and reaching into the staging half is a different
     * clause against a different document. */
    if (!entities.has(ex.via)) {
      const fs2 = ex.from + "/" + ex.facing;
      const m = metaForFacing(fs2, findings, derived);
      /* [Row 15] Through `groundplane.openingFor`, which is the ONE home of
       * what an exit's `via` names — an entity that fills a hole, or the
       * plan's own name for the hole, the threshold or the flight. Two copies
       * of a lookup is how the renderer and this file would come to disagree
       * about which walls have ways through them. */
      const hole = groundplane.openingFor(m, ex.via);
      if (!hole) {
        findings.push(`world.json: exit "${exId}" via "${ex.via}" names no entity, and ${fs2}'s meta carries no opening, threshold or flight for it — an exit through nothing the building holds [row21:exit.via_unfilled]`);
      } else if (hole.x + hole.w <= 0 || hole.x >= CANVAS_W ||
                 hole.y + hole.h <= 0 || hole.y >= CANVAS_H) {
        findings.push(`world.json: exit "${exId}" walks through ${fs2}'s opening "${hole.id ?? ex.via}" at ${Math.round(hole.x)},${Math.round(hole.y)} ${Math.round(hole.w)}×${Math.round(hole.h)}, which is off the ${CANVAS_W}×${CANVAS_H} frame — a way through nobody can see or click [row21:exit.opening_offscreen]`);
      } else if (!usablyInFrame(hole, CANVAS_W, CANVAS_H)) {
        /* [ROW 26] AND A SLIVER IS ITS OWN BEHAVIOUR, WITH ITS OWN TOKEN. The
         * clause above passed `op15` — the player's only route out of the boot
         * pair — by 54 px of a 476 px doorway, 8 % of it clickable, unmarked on
         * a near-black wall, and the Captain walked the manor and reported
         * "Still just 2 rooms". Wholly-off and eaten-by-the-frame are two
         * behaviours with two remedies (walk it elsewhere; slide the
         * standpoint), so they are two tokens: one token over both is one
         * countable thing a ledger case can only ever exercise on whichever it
         * reaches first, which is the rule the paragraph above already states.
         *
         * The predicate is `usablyInFrame` in `tools/validate-plan.mjs`. The
         * standpoint law's slide does not call it — it asks for the whole door
         * plus a margin, which is strictly stronger — so what binds them is an
         * asserted implication and not a shared call: a facing the slide
         * satisfied passes this clause, always. The clause above is untouched
         * by a character: this refuses more, never less. */
        const onW = Math.max(0, Math.min(hole.x + hole.w, CANVAS_W) - Math.max(hole.x, 0));
        const onH = Math.max(0, Math.min(hole.y + hole.h, CANVAS_H) - Math.max(hole.y, 0));
        /* AND WHAT THE AUTHOR IS SUPPOSED TO DO ABOUT IT, said in the finding —
         * differently for a door than for anything else, because the two are
         * not in the same position.
         *
         * The standpoint law slides the body to seat a DOOR it can seat, so a
         * door reaching this clause means the slide already tried and refused:
         * there is no standable point on that wall from which it is reachable,
         * and the completeness clause is ALSO firing — the plan draws a way and
         * the world must walk it, and walking it lands here. That pair is not a
         * deadlock to be resolved by softening either clause; it is an
         * unsatisfiable document being refused twice, loudly, and the only
         * remedy is the plan's own geometry.
         *
         * A FLIGHT OR A THRESHOLD IS NOT IN THAT POSITION, and telling its
         * author "no standable point seats it" would be a claim nobody made:
         * the slide's census is doors, for the measured reasons in
         * `slideAlongWall`, so the law never considered this shape at all. The
         * remedy is the same edit, and the sentence says which of the two
         * states the reader is in rather than flattening them into one. */
        const remedy = hole.kind === "door"
          ? "The standpoint law found no standable point on that wall that seats it, so this way through cannot be made usable from any standpoint — move the opening or move the wall"
          : `The standpoint law's slide considers doors only, so no standpoint it considered seats this ${hole.kind ?? "way through"} — move it, or move what it stands on`;
        findings.push(`world.json: exit "${exId}" walks through ${fs2}'s opening "${hole.id ?? ex.via}" at ${Math.round(hole.x)},${Math.round(hole.y)} ${Math.round(hole.w)}×${Math.round(hole.h)}, of which only ${Math.round(onW)}×${Math.round(onH)} px are on the ${CANVAS_W}×${CANVAS_H} frame — under the ${MIN_USABLE_APERTURE_PX} px a hand can hit without the forgiveness a frame edge cannot give it. ${remedy} [row26:exit.opening_unusable]`);
      }
    }
    const fromLoc = locations.get(ex.from);
    const toLoc = locations.get(ex.to);
    if (!fromLoc) findings.push(`world.json: exit "${exId}" from "${ex.from}" names no location`);
    if (!toLoc) findings.push(`world.json: exit "${exId}" to "${ex.to}" names no location`);
    if (toLoc && !(toLoc.facings || []).includes(ex.arrive_facing)) {
      findings.push(`world.json: exit "${exId}" arrive_facing "${ex.arrive_facing}" is not a facing of "${ex.to}"`);
    }
    if (fromLoc && !(fromLoc.facings || []).includes(ex.facing)) {
      findings.push(`world.json: exit "${exId}" facing "${ex.facing}" is not a facing of "${ex.from}"`);
    }
    /* Passage maintains orientation [HUMAN, 2026-08-20, blueprint §3]: "The
     * rule governs all future exits unless the world's own fiction demands a
     * turn." No exit in this schema names that exception yet (row 13 declined
     * to build one — nothing needs it), so the rule is enforced unconditionally
     * for now: arrive_facing continues the direction of travel, i.e. equals
     * the departure facing. The day a real exception is authored, this clause
     * is the escape hatch's insertion point, not a rewrite — an `orientation`
     * or similar field on the exit would gate it, checked here by name rather
     * than left for a builder's eye. */
    if (ex.arrive_facing !== ex.facing) {
      findings.push(`world.json: exit "${exId}" arrive_facing "${ex.arrive_facing}" does not continue the direction of travel (facing "${ex.facing}") — blueprint §3`);
    }
  }

  /* ---- [Row 15] the completeness half, which was missing ----------------
   *
   * Row 12's cross-check binds every exit the world names to the plan. It says
   * nothing about an opening the plan DRAWS and the world never opens, so the
   * two documents could disagree by omission: a manor with a door in every
   * wall and a world that walks through four of them would be green, and the
   * picture would hold rooms a player cannot enter.
   *
   * SCOPE, stated once and derived from the world's own location set: an
   * opening or a flight must be walkable in BOTH directions whenever the world
   * names BOTH rooms it joins. `demo-study` names two of the manor's rooms and
   * stays green as a consequence of that rule rather than by an exception
   * carved for it, which is §4b item 3's materialization ladder — a world may
   * name a subset of the plan and is judged on the subset.
   *
   * The exemption is COMPUTED, not carved: a way through whose opening falls
   * wholly off the frame from the standpoint that would view it cannot be a
   * `go` target at all (`exit.opening_offscreen` refuses one, correctly), so
   * requiring an exit through it would force that clause to be widened —
   * which is the move this project has refused five times. `waysThrough`
   * computes both lists in one place, and the plan warning prints the exempt
   * ones so the hole is visible rather than silent. */
  if (isObj(world) && Array.isArray(world.locations) && plan) {
    const ways = waysThrough(plan, world, CANVAS_W);
    const have = new Set();
    for (const [, ex] of exits) have.add(`${ex.via}|${ex.from}|${ex.to}`);
    for (const w of ways.walkable) {
      if (!have.has(`${w.id}|${w.from}|${w.to}`)) {
        findings.push(`world.json: the plan draws a way from "${w.from}" to "${w.to}" through "${w.id}", on ${w.from}/${w.facing}, and no exit walks it — the picture holds a room the player cannot enter [row15:exit.opening_unwalked]`);
      }
    }
    /* And the graph is CONNECTED, which the clause above does not imply: a
     * wing whose every opening is walked and which joins nothing else would
     * satisfy it and be unreachable. Walked from the boot viewstate, because
     * that is where a player actually starts. */
    const boot = isObj(viewstate) && typeof viewstate.location === "string"
      ? viewstate.location : (world.locations[0] || {}).id;
    const byId = new Map(world.locations.map((l) => [l.id, l]));
    const seen = new Set([boot]);
    const queue = [boot];
    while (queue.length) {
      const here = byId.get(queue.shift());
      for (const ex of (here && here.exits) || []) {
        if (!seen.has(ex.to) && byId.has(ex.to)) { seen.add(ex.to); queue.push(ex.to); }
      }
    }
    const marooned = world.locations.map((l) => l.id).filter((id) => !seen.has(id));
    if (marooned.length) {
      findings.push(`world.json: no walk from "${boot}" reaches ${marooned.map((m) => `"${m}"`).join(", ")} — the world holds rooms a player cannot get to [row15:world.rooms_unreachable]`);
    }
  }

  /* Relations and knowledge ids resolve. */
  if (isObj(world) && Array.isArray(world.relations)) {
    world.relations.forEach((rel, i) => {
      if (!Array.isArray(rel) || rel.length !== 3 || rel.some((x) => typeof x !== "string")) {
        findings.push(`world.json: relations[${i}] is not a [predicate, id, id] triple`);
        return;
      }
      if (!entities.has(rel[1])) findings.push(`world.json: relations[${i}] subject "${rel[1]}" names no entity`);
      if (!entities.has(rel[2]) && rel[2] !== "player") {
        findings.push(`world.json: relations[${i}] object "${rel[2]}" names no entity`);
      }
    });
  }
  if (isObj(world) && isObj(world.knowledge)) {
    const known = Array.isArray(world.knowledge.player) ? world.knowledge.player : [];
    if (!Array.isArray(world.knowledge.player)) {
      findings.push("world.json: knowledge.player must be an array of entity ids");
    }
    for (const id of known) {
      if (!entities.has(id)) findings.push(`world.json: knowledge.player id "${id}" names no entity`);
    }
  } else if (isObj(world) && "knowledge" in world) {
    findings.push("world.json: knowledge must be an object");
  }

  /* Record anchor sanity, per record, in record.px {w, h} sprite space. */
  for (const [rid, rec] of Object.entries(records)) {
    if (!isObj(rec)) {
      findings.push(`records: record "${rid}" is not an object`);
      continue;
    }
    const px = rec.px;
    if (!isObj(px) || !(px.w > 0) || !(px.h > 0)) {
      findings.push(`records: record "${rid}" px {w, h} missing or non-positive`);
      continue;
    }
    const anchors = rec.anchors;
    if (!isObj(anchors)) {
      findings.push(`records: record "${rid}" carries no anchors block`);
      continue;
    }
    const base = anchors.base;
    if (!isObj(base) || typeof base.x !== "number" || typeof base.y !== "number") {
      findings.push(`records: record "${rid}" anchors.base missing or malformed`);
    } else if (base.x < 0 || base.x > px.w || base.y < 0 || base.y > px.h) {
      findings.push(`records: record "${rid}" anchors.base (${base.x}, ${base.y}) lies outside the ${px.w}×${px.h} canvas`);
    }
    const fp = anchors.footprint;
    if (!isObj(fp) || typeof fp.x0 !== "number" || typeof fp.x1 !== "number") {
      findings.push(`records: record "${rid}" anchors.footprint missing or malformed`);
    } else {
      if (!(fp.x0 < fp.x1)) findings.push(`records: record "${rid}" anchors.footprint x0 must be < x1`);
      if (fp.x0 < 0 || fp.x1 > px.w) {
        findings.push(`records: record "${rid}" anchors.footprint [${fp.x0}, ${fp.x1}] lies outside the ${px.w}px canvas width`);
      }
    }
    for (const [name, region] of Object.entries(anchors)) {
      if (name === "base" || name === "footprint" || !isObj(region)) continue;
      if (!("x0" in region && "y0" in region && "x1" in region && "y1" in region)) continue;
      if (!(region.x0 < region.x1)) findings.push(`records: record "${rid}" anchor region "${name}" x0 must be < x1`);
      if (!(region.y0 < region.y1)) findings.push(`records: record "${rid}" anchor region "${name}" y0 must be < y1`);
      if (region.x0 < 0 || region.x1 > px.w || region.y0 < 0 || region.y1 > px.h) {
        findings.push(`records: record "${rid}" anchor region "${name}" lies outside the ${px.w}×${px.h} body bounds`);
      }
    }
  }

  /* Records JSON-clean: the shape row 4 must serialize survives a JSON
   * round-trip today. */
  try {
    if (!deepEqual(JSON.parse(JSON.stringify(records)), records)) {
      findings.push("records: not JSON-clean — JSON.parse(JSON.stringify(records)) does not deep-equal records");
    }
  } catch (e) {
    findings.push(`records: not JSON-serializable (${e.message})`);
  }

  /* ---- 5. Numeric domains ---------------------------------------------- */

  for (const [id, value] of Object.entries(placements)) {
    placementList(value).forEach((pl, i) => {
      if (!isObj(pl)) return;
      const label = Array.isArray(value) ? `placement "${id}"[${i}]` : `placement "${id}"`;
      if (isAnchorPlacement(pl)) {
        if (typeof pl.t !== "number" || pl.t < 0 || pl.t > 1) {
          findings.push(`staging.json: ${label} t must be a number in [0, 1] (got ${JSON.stringify(pl.t)})`);
        }
        return;
      }
      if (typeof pl.u !== "number" || pl.u < 0 || pl.u > 1) {
        findings.push(`staging.json: ${label} u must be a number in [0, 1] (got ${JSON.stringify(pl.u)})`);
      }
      if ("v" in pl && (typeof pl.v !== "number" || pl.v < 0)) {
        findings.push(`staging.json: ${label} v must be a number ≥ 0 (got ${JSON.stringify(pl.v)})`);
      }
      if (pl.attachment === "floor_free" && !("depth_m" in pl)) {
        findings.push(`staging.json: ${label} attachment floor_free requires depth_m`);
      }
      if ("depth_m" in pl) {
        const meta = metaForFacing(pl.facing, findings, derived);
        const cam = groundplane.cameraDistance(meta);
        if (typeof pl.depth_m !== "number" || pl.depth_m < 0) {
          findings.push(`staging.json: ${label} depth_m must be a number ≥ 0 (got ${JSON.stringify(pl.depth_m)})`);
        } else if (pl.depth_m >= cam || groundplane.scaleAtDepth(pl.depth_m, meta) > meta.px_per_m_at_bottom) {
          findings.push(`staging.json: ${label} depth_m ${pl.depth_m} projects past the canvas bottom (scaleAtDepth must stay ≤ px_per_m_at_bottom ${meta.px_per_m_at_bottom})`);
        }
      }
    });
  }

  for (const [rid, rec] of Object.entries(records)) {
    if (!isObj(rec)) continue;
    const dims = rec.dims_m;
    if (!isObj(dims)) {
      findings.push(`records: record "${rid}" carries no dims_m`);
      continue;
    }
    for (const [k, v] of Object.entries(dims)) {
      if (typeof v !== "number" || !(v > 0)) {
        findings.push(`records: record "${rid}" dims_m.${k} must be > 0 (got ${JSON.stringify(v)})`);
      }
    }
  }

  /* ---- 6. Placement <-> truth consistency ------------------------------ */

  /* Locations whose exits name an entity via — the transition entity's
   * required staged-location set.
   *
   * [ROW 42] Keyed by the LEAF the exit resolves to rather than by the token
   * `via` carries, through `groundplane.leafFor` — the one home of that
   * question, shared with the renderer, the harness and the page. The manor
   * names its exits after the plan's openings (`op01`) and the study after the
   * leaf (`door1`); this clause is what makes the two-sided rule hold either
   * way, and it is the clause that stops a leaf being hung on ONE side of a
   * doorway — where `handleGo` would refuse a shut door from a room whose
   * picture shows an open hole. */
  const viaLocations = new Map(); // entity id -> Set of location ids
  for (const [, ex] of exits) {
    const leaf = groundplane.leafFor(world, ex.via);
    const key = leaf ? leaf.id : ex.via;
    if (!viaLocations.has(key)) viaLocations.set(key, new Set());
    viaLocations.get(key).add(ex.from);
  }

  for (const [id, value] of Object.entries(placements)) {
    const ent = entities.get(id);
    if (!ent) continue;
    const facingPls = placementList(value).filter((pl) => isObj(pl) && !isAnchorPlacement(pl));
    if (facingPls.length === 0) continue;
    const stagedLocs = new Set();
    for (const pl of facingPls) {
      const fr = facingOf(pl.facing);
      if (fr) stagedLocs.add(fr.location);
    }
    if (ent.transition === true) {
      const expected = viaLocations.get(id) || new Set();
      const missing = [...expected].filter((l) => !stagedLocs.has(l));
      const extra = [...stagedLocs].filter((l) => !expected.has(l));
      if (missing.length || extra.length) {
        findings.push(
          `staging.json: transition entity "${id}" staged locations {${[...stagedLocs].sort().join(", ")}} must be exactly the locations whose exits name it via {${[...expected].sort().join(", ")}}`
        );
      }
    } else {
      for (const l of stagedLocs) {
        if (ent.location !== l) {
          findings.push(`staging.json: entity "${id}" staged on location "${l}" but world.json places it at ${JSON.stringify(ent.location)}`);
        }
      }
    }
  }

  /* Every known entity must be staged, anchor-hosted, or held_by — an
   * entity the document places that the picture never draws is the picture
   * lying by omission. */
  {
    const known = isObj(world) && isObj(world.knowledge) && Array.isArray(world.knowledge.player)
      ? world.knowledge.player
      : [];
    const relations = isObj(world) && Array.isArray(world.relations) ? world.relations : [];
    for (const id of known) {
      if (!entities.has(id)) continue; // dangling id already reported
      const staged = id in placements;
      const held = relations.some((r) => Array.isArray(r) && r[0] === "held_by" && r[1] === id && r[2] === "player");
      if (!staged && !held) {
        findings.push(`world.json: known entity "${id}" is neither staged, anchor-hosted, nor held_by player — the picture would omit it`);
      }
    }
  }

  /* ---- 7. Named overlap pairs, statically ------------------------------ */

  for (const [a, b] of OVERLAP_PAIRS) {
    const pairName = `${a}×${b}`;
    const entA = entities.get(a);
    const entB = entities.get(b);
    const plsA = a in placements ? placementList(placements[a]).filter((p) => isObj(p) && !isAnchorPlacement(p)) : [];
    const plsB = b in placements ? placementList(placements[b]).filter((p) => isObj(p) && !isAnchorPlacement(p)) : [];
    /* [Row 21] A world that holds NEITHER half of a pair is not a world the
     * pair is about — the navigation world stages no furniture at all, and
     * demanding a chair×desk from it would be this validator insisting every
     * fixture be the demo fixture. A world holding ONE half and not the other
     * is still the defect this clause exists to catch, and still fires. */
    if (!entA && !entB && plsA.length === 0 && plsB.length === 0) continue;
    if (!entA || !entB || plsA.length === 0 || plsB.length === 0) {
      findings.push(`staging.json: overlap pair ${pairName} cannot be evaluated — both entities must exist and carry facing placements (§4's named pairs) [row21:staging.pair_half_missing]`);
      continue;
    }
    let common = null;
    for (const pa of plsA) {
      const pb = plsB.find((p) => p.facing === pa.facing);
      if (pb) {
        common = [pa, pb];
        break;
      }
    }
    if (!common) {
      findings.push(`staging.json: overlap pair ${pairName} is not co-staged on one facing (§4's named pairs)`);
      continue;
    }
    const recA = isObj(records[entA.sprite]) ? records[entA.sprite] : null;
    const recB = isObj(records[entB.sprite]) ? records[entB.sprite] : null;
    if (!recA || !recB) {
      findings.push(`staging.json: overlap pair ${pairName} cannot be projected — a sprite record is missing`);
      continue;
    }
    const meta = metaForFacing(common[0].facing, findings, derived);
    let spanA, spanB;
    try {
      spanA = projectSpans(common[0], recA, meta);
      spanB = projectSpans(common[1], recB, meta);
    } catch {
      spanA = spanB = null;
    }
    if (!spanA || !spanB || [spanA, spanB].some((s) => Object.values(s).some((v) => !Number.isFinite(v)))) {
      findings.push(`staging.json: overlap pair ${pairName} cannot be projected — record anchors/dims or placement values do not support the span formulas`);
      continue;
    }
    const xOverlap = Math.min(spanA.x1, spanB.x1) - Math.max(spanA.x0, spanB.x0);
    const yOverlap = Math.min(spanA.y1, spanB.y1) - Math.max(spanA.y0, spanB.y0);
    if (!(xOverlap > 0)) {
      findings.push(`staging.json: overlap pair ${pairName} on ${common[0].facing}: projected x-spans do not intersect (${a} [${spanA.x0.toFixed(1)}, ${spanA.x1.toFixed(1)}] vs ${b} [${spanB.x0.toFixed(1)}, ${spanB.x1.toFixed(1)}])`);
    }
    if (!(yOverlap > 0)) {
      findings.push(`staging.json: overlap pair ${pairName} on ${common[0].facing}: projected y-spans do not intersect (${a} [${spanA.y0.toFixed(1)}, ${spanA.y1.toFixed(1)}] vs ${b} [${spanB.y0.toFixed(1)}, ${spanB.y1.toFixed(1)}])`);
    }
  }

  /* ---- 7a. ids are unique, containers can contain ---------------------- */

  /* Duplicate ids resolve — twice. Every `find`-by-id downstream (the
   * harness's mutation, the renderer's entity table, the narration domain)
   * silently picks one, so a world with two `desk1`s drew the desk twice, one
   * closed and one open, both clickable, with toggles moving only the first.
   * "All refs resolve" cannot see it, because they do. */
  {
    const seen = new Set();
    for (const ent of Array.isArray(world && world.entities) ? world.entities : []) {
      if (!isObj(ent) || typeof ent.id !== "string") continue;
      if (seen.has(ent.id)) {
        findings.push(`world.json: entity id "${ent.id}" appears more than once — every lookup by id downstream picks one of them`);
      }
      seen.add(ent.id);
    }
  }

  /* An `in` relation whose host declares no states is a hole with no bottom:
   * §7 step 5 draws contents only when the host is open, and a host that
   * cannot open is never open, so the entity is permanently invisible; the
   * harness refuses `take` as `refused_contained`; and the §12.9 enumerator
   * omits that triple *because* the host has no states — so the missing
   * narration line is invisible to the coverage arm too, and the player is
   * shown the transport's fault line for an ordinary authoring mistake. The
   * enumerator cannot be the check here: it is built from the same predicate
   * that makes the triple disappear. */
  for (const rel of Array.isArray(world && world.relations) ? world.relations : []) {
    if (!Array.isArray(rel) || rel[0] !== "in") continue;
    const host = entities.get(rel[2]);
    if (!isObj(host)) continue; // dangling refs are the ref arm's business
    const states = Array.isArray(host.states) ? host.states : [];
    if (!states.includes("open")) {
      findings.push(`world.json: ["in", "${rel[1]}", "${rel[2]}"] — host "${rel[2]}" declares no "open" state, so its contents can never be drawn or taken`);
    }
  }

  /* ---- 7b. every staged entity lands somewhere in the frame ------------- */

  /* `u ∈ [0,1]` and a legal `depth_m` are not enough to be on screen: the
   * u-mapping spans `wall_width_m` at the PLACEMENT's own scale, so a
   * floor_free object at depth 1.2 m runs from x −400 to x 1936 across the
   * legal u range. Staging chair1 at u 0.95 projected it to x 1769–1871 —
   * entirely outside the 1536 px canvas — and the only finding raised was
   * the overlap-pair one, which exists for two named pairs. An entity not in
   * a named pair would vanish from a perfectly legal document. */
  for (const [id, raw] of Object.entries(placements)) {
    const ent = entities.get(id);
    if (!isObj(ent)) continue;
    const rec = isObj(records[ent.sprite]) ? records[ent.sprite] : null;
    if (!rec) continue;
    for (const pl of placementList(raw)) {
      if (!isObj(pl) || isAnchorPlacement(pl) || typeof pl.facing !== "string") continue;
      if (!ATTACHMENTS.includes(pl.attachment)) {
        // Named directly: without this the failure surfaced as "the span
        // formulas do not support these values", which sends the reader to
        // the record instead of to the typo in front of them.
        findings.push(`staging.json: placement "${id}" attachment "${pl.attachment}" is not one of ${JSON.stringify(ATTACHMENTS)}`);
        continue;
      }
      /* §6's `attachment` and §4's must be the same word. Row 3's ingester
       * writes the record token from a CLI flag and row 4 authors the
       * staging: different hands, no check between them, and the renderer
       * silently obeys the staging one — so a desk whose record says
       * floor_against can be staged floor_free and drawn at a depth its own
       * record contradicts. Only `anchored` was bound, which is three of the
       * four tokens unenforced in both directions. */
      if (typeof rec.attachment === "string" && rec.attachment !== pl.attachment) {
        findings.push(`staging.json: placement "${id}" is ${pl.attachment} but record "${ent.sprite}" declares attachment "${rec.attachment}"`);
      }
      if ("v" in pl && pl.attachment !== "wall_mounted") {
        findings.push(`staging.json: placement "${id}" carries "v" but is ${pl.attachment} — v is metres above the wall floor line and only wall_mounted reads it`);
      }
      const meta = metaForFacing(pl.facing, findings, derived);
      let span = null;
      try {
        span = projectSpans(pl, rec, meta);
      } catch {
        span = null;
      }
      if (!span || Object.values(span).some((v) => !Number.isFinite(v))) continue;
      const onScreen = span.x1 > 0 && span.x0 < CANVAS_W &&
        span.y1 > 0 && span.y0 < meta.image_h_px;
      if (!onScreen) {
        findings.push(
          `staging.json: placement "${id}" on ${pl.facing} projects to x [${span.x0.toFixed(1)}, ${span.x1.toFixed(1)}] y [${span.y0.toFixed(1)}, ${span.y1.toFixed(1)}] — wholly outside the ${CANVAS_W}×${meta.image_h_px} frame`
        );
      }

      /* ---- 7c. staging never addresses wall that does not exist --------- */

      /* Being inside the frame and being inside the ROOM are different
       * things, and until row 11 nothing could tell them apart: `u ∈ [0,1]`
       * plus "the rect intersects the canvas" was the whole net, and both
       * were satisfied by a 16 m wall no room has. An object standing past
       * the side wall is outside the room. */
      const dom = groundplane.uDomain(meta, span.s, CANVAS_W);
      if (span.x0 < dom.x0 - 0.5 || span.x1 > dom.x1 + 0.5) {
        findings.push(
          `staging.json: placement "${id}" on ${pl.facing} projects to x [${span.x0.toFixed(1)}, ${span.x1.toFixed(1)}] but the room's own wall at that scale runs [${dom.x0.toFixed(1)}, ${dom.x1.toFixed(1)}] — it stands past a corner, outside the room [row11:staging.outside_room]`
        );
      }

      if (pl.attachment === "wall_mounted") {
        /* A door cannot hang on a horizon. Blueprint §5: an `open` facing has
         * no facing wall at all, and law (b) forbids inventing one. */
        if (meta.facing_type === "open") {
          findings.push(`staging.json: placement "${id}" is wall_mounted on ${pl.facing}, whose facing_type is "open" — there is no wall there to mount it on (blueprint §5, law (b)) [row11:staging.wall_mounted_on_open]`);
        } else if (Array.isArray(meta.wall_segments) && meta.wall_continuous === false) {
          /* Part building, part open ground: the thing must hang on a band
           * that is actually built, not across the gap between two. */
          const sWall = meta.px_per_m_at_wall;
          const inBand = meta.wall_segments.some((seg) => {
            const b0 = groundplane.xAtScale(seg.from_m / meta.wall_width_m, sWall, meta, CANVAS_W);
            const b1 = groundplane.xAtScale(seg.to_m / meta.wall_width_m, sWall, meta, CANVAS_W);
            return span.x0 >= Math.min(b0, b1) - 0.5 && span.x1 <= Math.max(b0, b1) + 0.5;
          });
          if (!inBand) {
            findings.push(`staging.json: placement "${id}" is wall_mounted on ${pl.facing} at x [${span.x0.toFixed(1)}, ${span.x1.toFixed(1)}], where the wall in view is built only in ${JSON.stringify(meta.wall_segments.map((s) => [s.from_m, s.to_m]))} m — law (b): a wall exists only where the building stands [row11:staging.wall_mounted_off_band]`);
          }
        }
        /* [Row 19] AND IT DOES NOT HANG THROUGH THE CEILING. Row 11 bounded a
         * wall placement sideways — inside the room, on a band that stands —
         * and never upward: `v` is metres above the wall floor line and
         * nothing compared `v` plus the object's own height against the room
         * the plan gives it. A 2.00 m door in a 1.85 m room is a finding, and
         * it was not one. The bound is the DECLARED storey height, so a facing
         * whose plan gives it none (an open space, an unplanned facing) is not
         * judged rather than judged against a guess. */
        const storey = meta.storey_height_m;
        const h = rec.dims_m && rec.dims_m.h;
        if (typeof storey === "number" && isFinite(storey) && typeof h === "number") {
          const top = (pl.v || 0) + h;
          if (top > storey + 1e-9) {
            findings.push(`staging.json: placement "${id}" is wall_mounted on ${pl.facing} at v ${pl.v || 0} m and is ${h} m tall, so its head stands ${top.toFixed(3)} m above the floor in a room the plan gives ${storey} m — it hangs through the ceiling [row19:staging.wall_mounted_over_storey]`);
          }
        }
      }
    }
  }

  /* ---- 8. §12.9 narration coverage + plan-§5 honesty rules -------------- */

  let lines = null;
  if (isObj(narration)) {
    if (isObj(narration.lines)) {
      lines = narration.lines;
    } else {
      findings.push("narration.json: no lines object");
      lines = {};
    }
  } else if (narration !== null) {
    findings.push("narration.json: not a JSON object");
    lines = {};
  } else {
    lines = {};
  }

  const lookup = (intent, target, outcome) => {
    const exact = `${intent}.${target}.${outcome}`;
    if (Object.prototype.hasOwnProperty.call(lines, exact)) return { key: exact, line: lines[exact], viaWildcard: target === "*" ? false : false };
    const wild = `${intent}.*.${outcome}`;
    if (Object.prototype.hasOwnProperty.call(lines, wild)) return { key: wild, line: lines[wild], viaWildcard: true };
    return null;
  };

  /* (b) the four wildcard keys must all exist (with valid lines), and no
   * other `*` key may. */
  for (const wk of WILDCARD_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(lines, wk)) {
      findings.push(`narration.json: required wildcard key "${wk}" is missing`);
    } else {
      const p = lineProblem(lines[wk], wk);
      if (p) findings.push(`narration.json: line for "${wk}" ${p}`);
    }
  }
  for (const k of Object.keys(lines)) {
    const parsed = parseNarrationKey(k);
    if (!parsed) {
      findings.push(`narration.json: key "${k}" is not an intent.target.outcome triple`);
      continue;
    }
    if (parsed.target === "*" && !WILDCARD_KEYS.includes(k)) {
      findings.push(`narration.json: wildcard key "${k}" is not one of the four legal wildcards (§5's one-reading policy)`);
    }
    /* (c) any entity-specific refused_unknown key. */
    if (parsed.target !== "*" && parsed.outcome === "refused_unknown") {
      findings.push(`narration.json: entity-specific refused_unknown key "${k}" — refused_unknown exists only as its per-intent wildcard (the narration layer carries no oracle)`);
    }
  }

  /* (d) success lines pairwise distinct globally; entity-specific refusal
   * lines never identical across entities. */
  {
    const byLine = new Map(); // line -> keys (specific success)
    const refusalByLine = new Map(); // line -> keys (specific refusals)
    for (const [k, line] of Object.entries(lines)) {
      const parsed = parseNarrationKey(k);
      if (!parsed || parsed.target === "*" || typeof line !== "string") continue;
      if (SUCCESS_OUTCOMES.has(parsed.outcome)) {
        if (!byLine.has(line)) byLine.set(line, []);
        byLine.get(line).push(k);
      } else if (parsed.outcome.startsWith("refused")) {
        if (!refusalByLine.has(line)) refusalByLine.set(line, []);
        refusalByLine.get(line).push(k);
      }
    }
    for (const [line, keys] of byLine) {
      if (keys.length > 1) {
        findings.push(`narration.json: success line ${JSON.stringify(line)} is shared by ${keys.join(", ")} — success lines must be pairwise distinct globally`);
      }
    }
    for (const [line, keys] of refusalByLine) {
      const targets = new Set(keys.map((k) => parseNarrationKey(k).target));
      if (targets.size > 1) {
        findings.push(`narration.json: refusal line ${JSON.stringify(line)} is shared across entities by ${keys.join(", ")} — per-entity refusal prose is the point of entity-specific keys`);
      }
    }
  }

  /* Domain coverage — the enumeration is imported from harness.js, never
   * re-derived. */
  let domain = null;
  if (typeof harness.enumerateNarrationDomain !== "function") {
    findings.push("src/harness.js: enumerateNarrationDomain is not exported — §12.9 domain coverage cannot be checked (pending assembly)");
  } else if (isObj(world) && isObj(staging)) {
    try {
      domain = harness.enumerateNarrationDomain(world, staging);
    } catch (e) {
      findings.push(`src/harness.js: enumerateNarrationDomain threw (${e.message}) — §12.9 domain coverage cannot be checked`);
    }
    if (domain !== null && !Array.isArray(domain)) {
      findings.push("src/harness.js: enumerateNarrationDomain did not return an array");
      domain = null;
    }
  }

  if (domain) {
    const domainSet = new Set(domain);
    for (const key of domain) {
      const parsed = parseNarrationKey(key);
      if (!parsed) {
        findings.push(`narration.json: enumerated domain key "${key}" is not an intent.target.outcome triple`);
        continue;
      }
      const resolved = lookup(parsed.intent, parsed.target, parsed.outcome);
      if (!resolved) {
        findings.push(`narration.json: no line resolves for domain key "${key}" (§12.9)`);
        continue;
      }
      const p = lineProblem(resolved.line, resolved.key);
      if (p) findings.push(`narration.json: line for "${key}" (via "${resolved.key}") ${p}`);
      /* (a) only the refused_unknown wildcards may resolve through a
       * wildcard — success AND refusal outcomes require entity-specific
       * keys. */
      if (parsed.target !== "*" && resolved.viaWildcard) {
        findings.push(`narration.json: domain key "${key}" resolves through wildcard "${resolved.key}" — every non-wildcard triple requires its entity-specific key (§5's one-reading policy)`);
      }
    }
    /* (e) any specific key outside the enumerated domain — stray prose for
     * a world that doesn't exist. */
    for (const k of Object.keys(lines)) {
      const parsed = parseNarrationKey(k);
      if (!parsed || parsed.target === "*") continue;
      if (!domainSet.has(k)) {
        findings.push(`narration.json: specific key "${k}" is outside the enumerated domain — stray prose for a world that doesn't exist`);
      }
    }
  }

  return findings;
}

/**
 * [B-ROUTING] ONE FACING'S META, and nothing else in the fixture.
 *
 * WHAT A PER-WALL VALIDATION IS FOR, which is the whole reason this stands
 * beside `validate` rather than instead of it: ATTRIBUTION. The sweep promotes
 * wall after wall into one store, and when a promotion writes a meta the law
 * refuses, the promoted wall has to be the one named and the one taken back
 * out — the fixture-wide validator says the fixture is bad and cannot say
 * which of this pass's twelve promotions made it so.
 *
 * That attribution was being bought by running the WHOLE validator once per
 * wall — the row-33 ledger flagged `promote.wall` at 121x against it — which
 * re-reads the world, the plan and all eighty-eight derived metas to check
 * one. The clause a promotion can newly break is the meta clause and only
 * that; the fixture-wide clauses (the truth/presentation split, the exits, the
 * narration domain) are about the fixture rather than about this wall, they
 * cannot be made false by writing one meta the meta clause admits, and the
 * sweep checks them ONCE at its end through the bake — `bake-fixtures.mjs`
 * runs `validate` whole before it writes a line.
 *
 * A facing the world does not name is a finding, never a quiet pass: a
 * promotion onto a wall no fixture renders would otherwise report success
 * forever, which is the same silence `metaForFacing` refuses to fall back into.
 */
export function validateFacing(fixtureDir, facingKey) {
  const findings = [];
  const world = loadJson(fixtureDir, "world.json", findings);
  const named = isObj(world) && Array.isArray(world.locations)
    && world.locations.some((loc) => isObj(loc) && Array.isArray(loc.facings)
      && loc.facings.some((f) => `${loc.id}/${f}` === facingKey));
  if (!named) {
    findings.push(`--only ${facingKey}: this fixture's world names no such facing — checking the meta of a wall nothing renders is not a validation of the promotion that wrote it`);
    return findings;
  }
  const derived = derivedMetasFor(fixtureDir, world, findings);
  checkMeta(`meta ${facingKey}`, metaForFacing(facingKey, findings, derived), findings,
    CANVAS_W, GRID_META.image_h_px, derived && derived[facingKey]);
  return findings;
}

/* ---- CLI wrapper -------------------------------------------------------- */

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) {
  const args = process.argv.slice(2);
  const i = args.indexOf("--fixture-dir");
  /* [Kabe, 2026-08-30 hospital-3 step 2] `--pack` names the fixture dir too (see
     validate-plan): one flag, one location. */
  const fixtureDir = i !== -1 && args[i + 1] ? resolve(args[i + 1])
    : (args.includes("--pack") ? resolve(ROOT, activePack().paths.fixture_dir) : join(ROOT, "fixtures", "demo-study"));

  let records;
  try {
    records = require_("../src/placeholders.js").records;
  } catch (e) {
    console.error(`validate-fixtures: cannot load records from src/placeholders.js (${e.message})`);
    process.exit(1);
  }
  if (!isObj(records)) {
    console.error("validate-fixtures: src/placeholders.js exports no records object");
    process.exit(1);
  }

  /* [B-ROUTING] `--only <loc>/<F>` checks that one facing's meta and nothing
     else — see `validateFacing`. Absent, this is the fixture-wide check it has
     always been, byte for byte. */
  const j = args.indexOf("--only");
  const only = j !== -1 ? args[j + 1] : null;
  if (only != null && !/^[A-Za-z0-9_-]+\/[NESW]$/.test(only)) {
    console.error(`validate-fixtures: --only ${only} is not a <loc>/<F> facing`);
    process.exit(2);
  }
  const where = only ? `${fixtureDir} meta ${only}` : fixtureDir;

  const findings = only ? validateFacing(fixtureDir, only) : validate(fixtureDir, records);
  if (findings.length > 0) {
    findings.forEach((f, n) => console.error(`${n + 1}. ${f}`));
    console.error(`validate-fixtures: ${findings.length} finding(s) in ${where}`);
    process.exit(1);
  }
  console.log(`validate-fixtures: ${where} valid`);
}
