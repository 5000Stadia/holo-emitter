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

import { metaForFacing as planMetaForFacing } from "./plan-projection.mjs";

/* Row 20: the ruled lens, from its one code home. */
const FOCAL_PX = createRequire(import.meta.url)("../src/groundplane.js").FOCAL_PX;

const require_ = createRequire(import.meta.url);
const groundplane = require_("../src/groundplane.js");
const { GRID_META } = require_("../src/renderer.js");
const harness = require_("../src/harness.js");

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CANVAS_W = 1536;

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
const ENTITY_KEYS = ["id", "sprite", "location", "states", "state", "takeable", "transition"];
const ENTITY_REQ = ["id", "sprite"];
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
  // provenance: which camera produced it, and whether it was MEASURED off a
  // painted backdrop (row 20) or derived from the plan
  "camera_id", "provisional", "measured", "backdrop",
  "focal_px", "nearest_floor_m",
  // row 20: the painted doorway, measured off the backdrop. Where a meta
  // carries this, the aperture a player walks through IS the painted opening
  // and §11's "the painted opening must coincide with the click target" is
  // true by construction rather than by prompt discipline.
  "openings"
];

/**
 * The meta the renderer resolves for a facing, in three tiers — a MEASURED
 * backdrop meta (row 4's), then the PLAN's derived one (row 11's), then the
 * unplanned-facing fallback. `derived` is the map the caller loaded from the
 * plan; keeping the plan read out of this function is what lets the CLI, the
 * bake and the tests hand in the same map the page was baked with.
 */
function metaForFacing(facingStr, findings, derived) {
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
 * Tier 2 of the meta resolution: every facing the world names, projected from
 * the fixture's own plan. The bake writes exactly this map into fixture.js,
 * so the validator, the page and the renderer all read one geometry.
 */
function derivedMetasFor(fixtureDir, world, findings) {
  const planFile = join(fixtureDir, "plan.json");
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
function checkMeta(label, meta, findings, canvasW, canvasH) {
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
      const tol = meta.measured ? 0.05 : 1e-9;
      if (!(Math.abs(focal - FOCAL_PX) / FOCAL_PX <= tol)) {
        findings.push(`${label}: ${meta.px_per_m_at_wall.toFixed(2)} px/m at ${dist} m is a ${focal.toFixed(1)} px lens, not the ruled ${FOCAL_PX} px (§12.5 (i′), blueprint §10) — one lens per room, and per manor [row20:meta.one_lens]`);
      }
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

  /* Every facing the world names resolves to a meta, and every one of them is
   * checked — not only the ones something happens to be staged on. A bare
   * facing with a broken meta still draws a room. */
  if (isObj(world) && Array.isArray(world.locations)) {
    for (const loc of world.locations) {
      if (!isObj(loc) || !Array.isArray(loc.facings)) continue;
      for (const f of loc.facings) {
        const key = `${loc.id}/${f}`;
        checkMeta(`meta ${key}`, metaForFacing(key, findings, derived), findings,
          CANVAS_W, GRID_META.image_h_px);
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

  /* Exits: via -> entity, to/from -> locations, arrive_facing in target
   * facings, facing in from-location facings. */
  for (const [exId, ex] of exits) {
    if (!entities.has(ex.via)) {
      findings.push(`world.json: exit "${exId}" via "${ex.via}" names no entity`);
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
   * required staged-location set. */
  const viaLocations = new Map(); // entity id -> Set of location ids
  for (const [, ex] of exits) {
    if (!viaLocations.has(ex.via)) viaLocations.set(ex.via, new Set());
    viaLocations.get(ex.via).add(ex.from);
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
    if (!entA || !entB || plsA.length === 0 || plsB.length === 0) {
      findings.push(`staging.json: overlap pair ${pairName} cannot be evaluated — both entities must exist and carry facing placements (§4's named pairs)`);
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

/* ---- CLI wrapper -------------------------------------------------------- */

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) {
  const args = process.argv.slice(2);
  const i = args.indexOf("--fixture-dir");
  const fixtureDir = i !== -1 && args[i + 1] ? resolve(args[i + 1]) : join(ROOT, "fixtures", "demo-study");

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

  const findings = validate(fixtureDir, records);
  if (findings.length > 0) {
    findings.forEach((f, n) => console.error(`${n + 1}. ${f}`));
    console.error(`validate-fixtures: ${findings.length} finding(s) in ${fixtureDir}`);
    process.exit(1);
  }
  console.log(`validate-fixtures: ${fixtureDir} valid`);
}
