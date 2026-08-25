#!/usr/bin/env node
/* validate-plan.mjs — the standing plan validator (blueprint §4b shape item
 * 10: "the plan validators gate the result (tiling, overlap,
 * door-joins-two-spaces, reachability, derivable standpoints — the checks the
 * first drawing already ran, promoted to law").
 *
 * Exports:
 *   validatePlan(plan, world?, records?) -> findings[]  (empty = pass)
 *   planWarnings(plan, records?, world?) -> warnings[]  (never empty here)
 * plus the geometry primitives the projection and the render share, so each
 * law has one home. The CLI wrapper prints both and exits 1 on any finding.
 * The bake (tools/bake-fixtures.mjs) calls validatePlan() and refuses to bake
 * a fixture whose plan.json does not pass, and prints the warnings — the same
 * enforcement locus the fixture validator uses.
 *
 * **Findings block; warnings do not.** The split exists because two true
 * statements about this plan cannot both be fixed inside this row: the desk's
 * footprint overlaps the study's chimney breast (moving either changes the
 * shipped demo's pixels or the drawing Kabe approved), and the entrance
 * approach's north view is a wall with a 20.4 m gap in it. A validator that
 * refused those would refuse the approved plan; a validator that could not
 * see them would be the reason nobody ever found them. They are computed,
 * printed, and carried in the projection report.
 *
 * Pure: no filesystem reads and no state. The CLI is the only thing that
 * touches disk (blueprint §4b rule 1 — every derivation an importable pure
 * function, every CLI a thin wrapper, so live mode is a transport change
 * rather than a rewrite).
 *
 * The checks, and where each came from:
 *   1. tiling                — draw_plan.py's interior-gross self-check, with
 *                              the gross figure derived from the outline and
 *                              the exterior bands instead of typed
 *   2. overlap               — draw_plan.py's room-pair self-check, extended
 *                              to open-vs-interior
 *   3. door joins two spaces — draw_plan.py's name check, STRENGTHENED to the
 *                              two rooms the opening geometrically abuts
 *   4. reachability          — draw_plan.py's flood fill, with every edge in
 *                              the document instead of patched in at run time
 *   5. standpoint derivability — law (a): the printed distance IS the measured
 *                              distance from the drawn standpoint to the wall
 *                              line it views
 *   6. law (b)               — a facing's TYPE is checked against what the
 *                              bands actually build, in both directions, for
 *                              every room: outdoor walls exist only where the
 *                              manor's wall stands, and open ground is open
 *   7. carriers in walls, stacks, the facing-type vocabulary, unique ids,
 *      object footprints — licensed strengthenings, each with its reason at
 *      the check
 *   8. the world cross-check (when a world is supplied): blueprint §3's
 *      orientation law made geometric rather than prose
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

/* The lens and the canvas, imported rather than restated: row 20's standpoint
 * law is about whether a wall FITS THE FRAME, which is a question about
 * pixels, and the two terms that answer it live in `src/groundplane.js`
 * (`FOCAL_PX`, bound to §10's `camera.focal_mm`) and in the pinned §5
 * viewport. A plan document holds no pixel — these are the CONSUMER's
 * parameters, exactly as `tools/plan-projection.mjs` says of `CANVAS_W`. */
const groundplane = createRequire(import.meta.url)("../src/groundplane.js");
export const PLAN_CANVAS_W = 1536;
/* [Row 26] The other half of the same pinned §5 viewport. The frame has two
 * edges a way through can fall past and the vertical pair had to be added to
 * `exit.opening_offscreen` once already, so the height is named here rather
 * than left for the next clause to rediscover. */
export const PLAN_CANVAS_H = 1024;

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/* Geometry runs on plan metres. EPS is far below any dimension the drawing
 * carries (the thinnest thing on it is a 0.35 m partition) and far above the
 * float noise of a coordinate that has been through JSON. */
const EPS = 1e-9;

export const FACINGS = ["N", "E", "S", "W"];
const FACING_TYPES = ["enclosed", "open", "corridor"];
const ROOM_TYPES = ["enclosed", "open", "corridor"];
const OPENING_KINDS = ["door", "open_edge"];
const BAND_KINDS = ["exterior", "partition", "garden"];
/* A band that is real built structure an outdoor space can see. Law (b): the
 * exterior outline, plus the one further BUILT structure Kabe ruled in on
 * 2026-08-21 ("the garden wall is fine"). A partition is interior and no
 * outdoor space ever sees one. */
export const BUILT_KINDS = ["exterior", "garden"];
export const ALL_WALL_KINDS = ["exterior", "garden", "partition"];
/* Where an object footprint came from, because a later re-derivation has to
 * know which values it may regenerate. "drawing" is measured off the sheet;
 * "inverse-projected" was computed back out of staging.json by
 * plan-projection.inverseProjectPlacement and may be recomputed; "composed"
 * (row 11) means a human-licensed composition choice was made ON TOP of that
 * — blueprint §4's standing licence — so re-deriving it from staging would
 * silently undo the choice. A "composed" object carries its `note`. */
const OBJECT_SOURCES = ["drawing", "inverse-projected", "composed"];
/* Blueprint §4b's room TYPE TEMPLATE — "rooms carry a type template
 * (chamber/hall/corridor/open) so every room is the same modular recipe … per
 * room modular consistent design so creation is snappy" [HUMAN]. This is the
 * ROOM's production recipe and is a different vocabulary from the facing
 * geometry type; §4b item 6's backdrop-template tier keys on it. */
const ARCHETYPES = ["chamber", "hall", "corridor", "service", "stair", "open"];
const ATTACHMENTS = ["floor_against", "floor_free", "wall_mounted"];

/* Screen-right, per facing: standing facing N your right hand points east, so
 * +x; facing E it points south, so −y. tools/plan-projection.mjs imports this
 * rather than keeping a second copy. */
export const RIGHT = { N: [1, 0], E: [0, -1], S: [-1, 0], W: [0, 1] };
/** The world axis a facing looks along, and which way. */
export const NORMAL = { N: ["y", +1], E: ["x", +1], S: ["y", -1], W: ["x", -1] };

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isNum = (v) => typeof v === "number" && Number.isFinite(v);

/* The truth/presentation split reaches the plan too. `world.json` never holds
 * pixels; `plan.json` never holds world FACTS — no state, no knowledge, no
 * relations, no takeable, no sprite. It names entities (an opening's `entity`,
 * an object's `id`) and rooms, which are references into truth, never copies
 * of it. Enforced by whitelist, the way tools/validate-fixtures.mjs enforces
 * the other two documents. */
const PLAN_TOP_KEYS = ["schema", "version", "units", "north", "entrance",
  "standpoint_stand_back", "standpoint_threshold_clearance_m", "wall_thickness",
  "outline", "floors", "wall_bands",
  "rooms", "openings", "windows", "fireplaces", "stairs", "objects"];
const ROOM_KEYS = ["id", "floor", "name", "type", "archetype", "rect", "facings"];
const FACING_KEYS = ["type", "standpoint_source", "standpoint", "wall_line",
  "camera_wall_m", "camera_far_m", "wall_width_m", "far_line", "note"];
const OPENING_KEYS = ["id", "kind", "floor", "axis", "rect", "joins", "entity"];
const OBJECT_KEYS = ["id", "floor", "room", "footprint", "attachment", "source", "note"];
const BAND_KEYS = ["id", "kind", "floors", "rect"];
const STAIR_KEYS = ["id", "kind", "treads", "rect", "joins", "up", "down"];
/* `storey_height_m` is OPTIONAL in the schema and BOTH shipped floors carry
 * 2.8 m, ruled by Kabe on 2026-08-21 against a rendered pair (row 11's
 * direction package, question 2). It exists because a room bounded left and
 * right and unbounded upward reads as a shaft — at the pinned scale the frame
 * holds 6.95 m of wall above the floor line against a c.1660 storey of
 * 2.6–3.0 m — and the renderer draws a ceiling from it. It stays optional
 * because an unplanned facing has no floor to read one off. 2.8 m is
 * period-plausible and sits under blueprint §4's standing licence; it is not a
 * measurement, and row 4's approved backdrop may move it. It is a vertical
 * dimension no plan VIEW draws, so `draw_plan.py` keeps it out of the approval
 * stamp's drawn digest and reports it in the second one. */
const FLOOR_KEYS = ["id", "level", "storey_height_m"];
const WINDOW_KEYS = ["floor", "rect"];
const FIREPLACE_KEYS = ["floor", "room", "rect"];
/* World facts, by name. A plan that grows one of these has become a second
 * truth document. */
const TRUTH_KEYS = new Set(["state", "states", "knowledge", "relations",
  "takeable", "sprite", "transition", "held_by", "narration"]);

function keyCheck(where, obj, allowed, push) {
  if (!isObj(obj)) return;
  for (const k of Object.keys(obj)) {
    if (TRUTH_KEYS.has(k)) {
      push(`${where}: key "${k}" is a world fact — the plan is presentation-side and holds geometry, never truth`);
    } else if (!allowed.includes(k)) {
      push(`${where}: unknown key "${k}" (allowed: ${allowed.join(", ")})`);
    }
  }
}

/** The drawn precision. The schematic prints every measured distance with two
 * decimals and the plan stores *that* number — law (a): the number printed
 * beside the standpoint IS camera_wall_m. Storing the raw double instead
 * would be worse than untidy: 18.2249999… and 18.225 are different doubles
 * that print differently, so the document would render a drawing that
 * disagreed with the approved one. `toFixed` rounds off the exact binary
 * value, which is what Python's `%.2f` does in the render, so the two agree. */
export const DRAWN_DP = 2;
export const drawn = (v) => Number(v.toFixed(DRAWN_DP));

function rectOk(r) {
  return isObj(r) && ["x0", "x1", "y0", "y1"].every((k) => isNum(r[k])) &&
    r.x1 >= r.x0 - EPS && r.y1 >= r.y0 - EPS;
}
/* Well-formed is not the same as real. A zero-extent rect is not a thing in a
 * building: a door with `y1 === y0` has no clear width, yet reachability would
 * still count it as a way through and the render would draw a knock-out of
 * nothing. §4b item 2 makes this document something a solver emits, and a
 * degenerate rect is exactly what a solver produces when a span it divided by
 * collapsed. The one shape allowed to be flat is an `open_edge`, which is a
 * boundary line rather than a hole in a wall — and even that must have a
 * positive clear width ALONG the boundary, which `degenerate` still catches.
 * Returns the offending axes, or null. */
function degenerate(r, allowFlatAxis) {
  if (!isObj(r)) return null;
  const bad = [];
  if (r.x1 - r.x0 <= EPS && allowFlatAxis !== "x") bad.push("x");
  if (r.y1 - r.y0 <= EPS && allowFlatAxis !== "y") bad.push("y");
  /* Flat in BOTH axes is a point, whatever it is allowed to be flat in. */
  if (r.x1 - r.x0 <= EPS && r.y1 - r.y0 <= EPS && !bad.length) bad.push(allowFlatAxis === "x" ? "y" : "x");
  return bad.length ? bad : null;
}
function needsExtent(label, r, push, allowFlatAxis) {
  const bad = degenerate(r, allowFlatAxis);
  if (bad) push(`${label}: zero extent in ${bad.join(" and ")} — a rect with no width is not a thing in a building, and every check downstream (reachability, containment, area) treats it as one`);
}
const area = (r) => (r.x1 - r.x0) * (r.y1 - r.y0);
const contains = (outer, inner) =>
  inner.x0 >= outer.x0 - EPS && inner.x1 <= outer.x1 + EPS &&
  inner.y0 >= outer.y0 - EPS && inner.y1 <= outer.y1 + EPS;
function overlapArea(a, b) {
  const ox = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
  const oy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
  return ox > EPS && oy > EPS ? ox * oy : 0;
}
const fmt = (n) => Number(n.toFixed(3));

/** The wall line a facing views, and the width of the wall in view. `far` is
 * the far ground line an open facing runs to when no structure bounds it. */
export function facingGeometry(rect, facing, far) {
  const w = rect.x1 - rect.x0, d = rect.y1 - rect.y0;
  const table = {
    N: { normal: d, wallLine: rect.y1, width: w },
    S: { normal: d, wallLine: rect.y0, width: w },
    E: { normal: w, wallLine: rect.x1, width: d },
    W: { normal: w, wallLine: rect.x0, width: d }
  };
  const g = table[facing];
  return { ...g, wallLine: far != null ? far : g.wallLine };
}

/** Law (a)'s rule, in one place: the standpoint stands on the room's own axis,
 * displaced from the centre AWAY from the viewed wall by K of the room's
 * dimension along that axis. */
export function ruleStandpoint(rect, facing, K) {
  const cx = (rect.x0 + rect.x1) / 2, cy = (rect.y0 + rect.y1) / 2;
  const n = facingGeometry(rect, facing).normal;
  return {
    N: { x: cx, y: cy - K * n }, S: { x: cx, y: cy + K * n },
    E: { x: cx - K * n, y: cy }, W: { x: cx + K * n, y: cy }
  }[facing];
}

/** Law (a)'s measurement: the distance from a standpoint to the line it
 * views. This is what `camera_wall_m` has to be — measured, never typed. */
export function measuredDistance(standpoint, facing, line) {
  return facing === "N" ? line - standpoint.y
    : facing === "S" ? standpoint.y - line
    : facing === "E" ? line - standpoint.x
    : standpoint.x - line;
}

/**
 * THE STANDPOINT LAW (row 20), and it is one function so the plan, the
 * rebuild, the drawing and the validator cannot hold three versions of it.
 *
 * Blueprint §10's ruling [HUMAN, 2026-08-21]: "Standpoints move to the
 * thresholds (shape item 9's own convention)." Shape item 9's convention is
 * *you view a wall from across the room*. Two [HUMAN] artifacts make the
 * literal reading — every facing to its threshold — untenable, and the
 * Navigator ratified the conditional in their light:
 *
 *   - Kabe approved preview frame `02b`, the cross passage's east view AT ITS
 *     DRAWN RULE DISTANCE of 6.00 m, not at its threshold of 7.55 m; and
 *   - he approved `01d`, the study's north view AT ITS THRESHOLD of 4.35 m.
 *
 * The two frames together ARE the conditional, stated in pictures: a facing
 * stands back to the far side of the room WHEN, AND ONLY WHEN, its own wall
 * does not fit the frame from the drawn standpoint. The study's 5.45 m wall at
 * 3.60 m draws 1550 px in a 1536 px frame and misses by seven pixels; the
 * passage's 2.60 m end wall at 6.00 m draws 444 px and fits with room to
 * spare. Nothing here is a criterion an agent invented: "fits the frame" is
 * the frame, and the frame is not ours.
 *
 * A facing that views no wall keeps the rule — an `open` facing's far line is
 * a horizon and there is no wall behind you to stand across from.
 *
 * WHERE THE FAR SIDE IS NOT STANDABLE, the standpoint stops at what is: a
 * chimney breast, a stair flight or a wall band on the room's own axis is
 * masonry, and the threshold pulls forward to clear it by the same clearance.
 * Without that, four of the manor's standpoints would stand inside their own
 * fireplaces and flights. `standpointObstructions` is the list, and
 * `plan.standpoint_clear` is the clause that refuses one that does not.
 */
export function standpointObstructions(plan, room) {
  const out = [];
  for (const f of plan.fireplaces || []) if (f.floor === room.floor) out.push({ kind: `the hearth in "${f.room}"`, rect: f.rect });
  for (const st of plan.stairs || []) if ((st.joins || []).includes(room.id)) out.push({ kind: `the "${st.id}" flight`, rect: st.rect });
  for (const b of plan.wall_bands || []) if ((b.floors || []).includes(room.floor)) out.push({ kind: `wall band "${b.id}"`, rect: b.rect });
  return out;
}

/** Does this facing's wall fit the frame from a standpoint that far away? */
export function wallFitsFrame(wallWidthM, distanceM, canvasW = PLAN_CANVAS_W) {
  return wallWidthM * groundplane.FOCAL_PX <= canvasW * distanceM + 1e-9;
}

/**
 * [ROW 26] WHAT A HAND CAN REACH AT THE EDGE OF THE FRAME — two numbers, both
 * derived from row 2's pointing tolerance, and neither of them a feeling.
 *
 * Row 2's tolerance is two constants in `index.html` (minted at 84400cc, "a
 * doorway with thickness, and forgiveness for any small target"):
 *
 *   TAKEABLE_MARGIN_CSS = 4   the forgiveness RING's width — "a takeable owns
 *                             its own drawn rectangle plus a hand's-width
 *                             margin, and nothing beyond it"
 *   SMALL_TARGET_CSS = 24     "Below this, in CSS pixels, a target is one a
 *                             hand cannot hit exactly and the forgiveness
 *                             applies. Above it the object is big enough to
 *                             answer for itself."
 *
 * WHAT CONNECTS THEM TO A FRAME EDGE: at a clipped edge the ring is worth
 * nothing. `canvasPoint` maps a pointer event into canvas coordinates and
 * there are no pointer events outside the canvas element, so the half of the
 * ring lying past the edge can never be clicked. A clipped aperture does not
 * get row 2's forgiveness on the clipped side, and so must satisfy row 2's
 * UNFORGIVEN test instead.
 *
 * The conversion: `#stage` is `min(100%, (100svh − 7.6rem) × 1536/1024)`, so on
 * a portrait phone the stage IS the viewport width and 1 CSS px is
 * 1536/stageCssWidth canvas px. 320 is the narrowest width this product is
 * driven at anywhere in its own suite TODAY (voice.spec's 320×700 and 320×568)
 * — not a declared support floor, and named as today's narrowest rather than
 * as a promise.
 *
 *   FRAME_MARGIN_PX        = ceil(4 × 1536/320)  = 20
 *   MIN_USABLE_APERTURE_PX = ceil(24 × 1536/320) = 116
 *
 * TWO HONESTIES, because a derived number can still be derived from the wrong
 * thing. (1) SMALL_TARGET_CSS was authored for a TAKEABLE, not a doorway;
 * applying it to an aperture is an ANALOGY — the same hand, the same screen,
 * the same question "can a finger land on this exactly" — and it is written
 * here as an analogy rather than as a law row 2 already stated about doorways.
 * (2) WHICH facings slide does not turn on the exact values — the set is
 * `hall/N` and `hall/S` and nothing else for FRAME_MARGIN_PX anywhere in
 * [15, 53] and MIN_USABLE_APERTURE_PX in [95, 308] — but HOW FAR they slide
 * does, and stating only the first would be the friendlier half of the truth:
 * across that range `hall/N` moves 0.92–1.00 m and `hall/S` 1.42–1.50 m, and
 * the drawn standpoints on a sheet Kabe glances at are those numbers. So the
 * margin is not a free parameter; it is a small one whose only defence is that
 * it is derived, which `plan.spec.mjs` holds it to by re-reading both CSS
 * constants out of index.html and re-computing these ceilings.
 */
export const FRAME_MARGIN_PX = 20;
export const MIN_USABLE_APERTURE_PX = 116;

/**
 * [ROW 26] Is this way through USABLY in frame — enough of it on screen for a
 * hand to land on it without the forgiveness the frame edge cannot give?
 *
 * `min(declared, bar)` and not the bar alone, deliberately: this refuses a
 * doorway the FRAME has eaten and does not refuse one that is honestly small
 * because you are standing 15.30 m from it. Ten of the manor's doors draw
 * under 24 CSS px on a phone; every one of them is unclipped and none of them
 * is this clause's subject. A FRACTION of the declared width was tried and
 * rejected: the court mouth is 3095 px wide and shows 1536 of itself, so any
 * fraction bar above 49.6 % refuses a threshold that works today.
 *
 * WHAT "DECLARED" MEANS, AND THE BUG THAT TAUGHT IT. A door and a threshold
 * state their own rectangle and let it run off the frame, so `w` is a real
 * claim about the building. A FLIGHT does not: `stairsForFacing` clamps its
 * `x/y/w/h` to the canvas before anything else sees them, so `w` IS the
 * on-frame width and `onW >= min(w, bar)` reads `onW >= onW` — true for a
 * three-pixel wedge at the frame edge. This clause shipped in exactly that
 * state and an artifact critic defeated it: it pushed a staircase 98.7 % off
 * frame (3930 px of drawn body down to a 50 px sliver, 4.2 % of it clickable,
 * 12.7 CSS px on a phone) and every check in the project stayed green.
 *
 * So the comparison is against `raw_w`/`raw_h` where the shape carries them —
 * the flight's extent BEFORE the clamp, emitted beside the clamped rect from
 * the same numbers — and against `w`/`h` where it does not. The bar is what a
 * hand needs; what it is measured against has to be what the building draws,
 * not what the frame left of it. A meta that drops those fields, or claims a
 * body narrower than the part of it on screen, is refused by
 * row 15's `meta.stairs_list` rather than falling quietly back to the defect.
 */
export function usablyInFrame(rect, canvasW = PLAN_CANVAS_W, canvasH = PLAN_CANVAS_H) {
  const onW = Math.max(0, Math.min(rect.x + rect.w, canvasW) - Math.max(rect.x, 0));
  const onH = Math.max(0, Math.min(rect.y + rect.h, canvasH) - Math.max(rect.y, 0));
  const drawnW = typeof rect.raw_w === "number" ? Math.max(rect.raw_w, rect.w) : rect.w;
  const drawnH = typeof rect.raw_h === "number" ? Math.max(rect.raw_h, rect.h) : rect.h;
  return onW >= Math.min(drawnW, MIN_USABLE_APERTURE_PX) - 1e-9 &&
         onH >= Math.min(drawnH, MIN_USABLE_APERTURE_PX) - 1e-9;
}

/**
 * The point the standpoint law puts a facing at, and which branch produced it.
 * Returns `{ point, source }` with source "rule" or "threshold".
 *
 * TWO QUESTIONS, ASKED IN ORDER, and the order is the law's own: how far back
 * do you stand (`distanceStandpoint`, rows 20's two branches), and then where
 * along the wall do you stand (`slideAlongWall`, row 26's third). The second
 * moves the cross-axis coordinate ONLY, so `camera_wall_m` is decided by the
 * first and is never touched by the second.
 *
 * The distance half has four ways out and every one of them funnels through
 * the slide here, rather than returning past it — a branch you can leave by a
 * path that skips it is a branch that will be skipped.
 */
export function standpointFor(plan, room, facing, K, clearanceM) {
  return slideAlongWall(plan, room, facing,
    distanceStandpoint(plan, room, facing, K, clearanceM), clearanceM);
}

function distanceStandpoint(plan, room, facing, K, clearanceM) {
  const fc = room.facings[facing];
  const rule = ruleStandpoint(room.rect, facing, K);
  const open = fc && fc.type === "open";
  const geo = facingGeometry(room.rect, facing, open ? fc.far_line : undefined);
  const ruleD = measuredDistance(rule, facing, geo.wallLine);
  if (open || wallFitsFrame(fc.wall_width_m, ruleD)) return { point: rule, source: "rule" };
  const [axis, sign] = NORMAL[facing];
  const cx = (room.rect.x0 + room.rect.x1) / 2, cy = (room.rect.y0 + room.rect.y1) / 2;
  /* The far side of the room along the viewing axis — the wall you stand with
   * your back to. */
  let back = facing === "N" ? room.rect.y0 : facing === "S" ? room.rect.y1
    : facing === "E" ? room.rect.x0 : room.rect.x1;
  for (const o of standpointObstructions(plan, room)) {
    const onAxis = axis === "y"
      ? (cx >= o.rect.x0 - 1e-9 && cx <= o.rect.x1 + 1e-9)
      : (cy >= o.rect.y0 - 1e-9 && cy <= o.rect.y1 + 1e-9);
    if (!onAxis) continue;
    /* Only masonry ATTACHED TO THE WALL BEHIND YOU stands between you and it:
     * its far edge is at or behind `back`, and its near edge projects into the
     * room. A hearth on the wall you are LOOKING AT is relief on the plane you
     * view (`wallRelief`), not something you back into. */
    const far = sign > 0 ? o.rect[axis + "0"] : o.rect[axis + "1"];
    const near = sign > 0 ? o.rect[axis + "1"] : o.rect[axis + "0"];
    if ((back - far) * sign < -1e-9) continue;
    if ((near - back) * sign > 1e-9) back = near;
  }
  const p = axis === "y" ? { x: cx, y: back + sign * clearanceM }
    : { x: back + sign * clearanceM, y: cy };
  const tD = measuredDistance(p, facing, geo.wallLine);
  if (!(tD > ruleD + 1e-9)) return { point: rule, source: "rule" };
  /* And if the pulled-forward point is STILL inside masonry — a stair flight
   * that fills its own room, which the manor has two of — there is nowhere
   * further back to stand and the drawn standpoint keeps the facing. The
   * alternative is a standpoint inside a flight, which `plan.standpoint_clear`
   * refuses; a rule that cannot be satisfied gives way rather than producing
   * an absurdity it then reports. */
  for (const o of standpointObstructions(plan, room)) {
    if (p.x >= o.rect.x0 - 1e-9 && p.x <= o.rect.x1 + 1e-9 &&
        p.y >= o.rect.y0 - 1e-9 && p.y <= o.rect.y1 + 1e-9) {
      return { point: rule, source: "rule" };
    }
  }
  return { point: p, source: "threshold" };
}

/** [Row 26] The doors this facing views, as offsets in metres from the eye,
 * signed the way `u` is. A door only: a flight is a solid on the floor whose
 * rect is already clamped to the frame, and a threshold is the absence of a
 * wall — neither is a hole in the plane in front of you, and §4.1's own
 * measurements say no lateral slide could contain either. */
function doorsInView(plan, room, facing, standpoint) {
  const span = viewSpan(room.rect, facing);
  const cross = span.axis;
  const [rx, ry] = RIGHT[facing];
  const rdir = cross === "x" ? rx : ry;
  const held = new Set((plan.rooms || []).map((r) => r.id));
  const out = [];
  for (const o of plan.openings || []) {
    if (o.kind !== "door" || !rectOk(o.rect)) continue;
    const [a, b] = o.joins || [];
    if (!a || !b || !held.has(a) || !held.has(b)) continue;
    if (facingOfOpening(plan, o, room.id) !== facing) continue;
    const e0 = (o.rect[cross + "0"] - standpoint[cross]) * rdir;
    const e1 = (o.rect[cross + "1"] - standpoint[cross]) * rdir;
    out.push({ id: o.id, lo_m: Math.min(e0, e1), hi_m: Math.max(e0, e1) });
  }
  return out;
}

/** Remove `[a, b]` from a union of closed intervals. */
function withoutInterval(intervals, a, b) {
  const out = [];
  for (const [lo, hi] of intervals) {
    if (b <= lo + 1e-9 || a >= hi - 1e-9) { out.push([lo, hi]); continue; }
    if (a > lo + 1e-9) out.push([lo, a]);
    if (b < hi - 1e-9) out.push([b, hi]);
  }
  return out;
}

/**
 * [ROW 26] THE THIRD BRANCH OF THE STANDPOINT LAW: WHERE ALONG THE WALL.
 *
 * Rows 20's two branches decide how far back the body stands. Neither of them
 * ever asked where along the wall it stands, and the answer was always the
 * room's own cross-axis centre — which is right until a room's doors are not
 * at its centre. The cross passage is 8.00 m long and both its doors sit near
 * one end: from the middle, `op15` projects 476 px wide at x 1482 of 1536, so
 * a player saw a 54 px sliver of the only way out of the boot pair, and `op14`
 * did not appear at all. That is not a fact about the document; it is a fact
 * about where the law put the body, and this is the clause that moves it.
 *
 * THE CENSUS IS DOORS (see `doorsInView`), and it is the PLAN's own, never a
 * world's: `plan.json` serves two worlds, so a world-scoped trigger would ask
 * one drawn document for two different standpoints on one facing — and it is
 * circular exactly where the defect is, because `op14` is unwalked *because*
 * it is off frame.
 *
 * THE FEASIBLE SET INCLUDES THE STANDABLE BAND. There is no post-hoc clamp: a
 * slide computed first and clamped afterwards is a slide that satisfies
 * neither constraint. `t` is the picture's shift in canvas px — equivalently
 * `δ = t/s` metres of body along `RIGHT[facing]` — and:
 *
 *   - each door contributes the shifts that put the WHOLE of it in frame with
 *     `FRAME_MARGIN_PX` beyond each jamb, so row 2's ring exists on both sides
 *     of it;
 *   - the standable band contributes the room's own cross span inset by the
 *     same clearance the threshold branch uses, less any masonry standing at
 *     this standpoint's own depth.
 *
 * THERE IS NO "TOO WIDE TO FIT" ARM, and the reason is a number. An earlier
 * draft carried one, for a way through wider than the frame can hold. The
 * widest door this plan projects is 476.3 px; `w + 2·FRAME_MARGIN_PX >
 * canvasW` needs a margin above (1536 − 476.3)/2 = 529.9 px, which is 26× the
 * derived 20. An arm that cannot fire is this project's six-bite family, so
 * the arm is gone: a door wide enough to empty its own interval refuses
 * through the branch below, like any other infeasible facing.
 *
 * THE SLIDE IS QUANTISED, THE COORDINATE IS NOT. The drawing prints two
 * decimals and the document holds the number the drawing prints — but
 * `plan.json`'s standpoints are not two-decimal numbers today (`hall/N`'s y is
 * 10.049999999999999), so rounding the COORDINATE would move a facing that is
 * not sliding at all. The slide is the least-magnitude whole centimetre inside
 * the feasible set, and it is added to the coordinate the distance branch
 * produced.
 *
 * AND WHEN NOTHING SATISFIES IT, THE BODY DOES NOT MOVE. No partial slide: a
 * partial slide is a picture that improves without satisfying the law, and it
 * would hide the very finding the law exists to raise. The facing keeps the
 * centred standpoint and row 26's `exit.opening_unusable` clause reports the
 * door that
 * a world walks and a hand cannot reach.
 */
function slideAlongWall(plan, room, facing, chosen, clearanceM, canvasW = PLAN_CANVAS_W) {
  const fc = room.facings[facing];
  const open = fc && fc.type === "open";
  const geo = facingGeometry(room.rect, facing, open ? fc.far_line : undefined);
  const d = measuredDistance(chosen.point, facing, geo.wallLine);
  if (!(d > EPS)) return chosen;
  const s = groundplane.FOCAL_PX / d;

  const doors = doorsInView(plan, room, facing, chosen.point);
  if (!doors.length) return chosen;

  /* The fit interval, in metres of body along RIGHT. A door at eye-offset
   * [lo, hi] draws at [canvasW/2 + lo·s, canvasW/2 + hi·s]; moving the body
   * δ to the right moves the picture δ·s to the left. */
  let dLo = -Infinity, dHi = Infinity;
  for (const h of doors) {
    const L = canvasW / 2 + h.lo_m * s, R = canvasW / 2 + h.hi_m * s;
    dLo = Math.max(dLo, (R - canvasW + FRAME_MARGIN_PX) / s);
    dHi = Math.min(dHi, (L - FRAME_MARGIN_PX) / s);
  }
  if (dLo <= 1e-9 && dHi >= -1e-9) return chosen;   // every door already fits

  const span = viewSpan(room.rect, facing);
  const cross = span.axis, normal = cross === "x" ? "y" : "x";
  const [rx, ry] = RIGHT[facing];
  const rdir = cross === "x" ? rx : ry;
  const p0 = chosen.point[cross];

  /* The standable band, in the same coordinate. Masonry counts only where it
   * stands at THIS standpoint's own depth: the normal-axis test is strict
   * containment and is deliberately NOT inflated by the clearance, because a
   * threshold standpoint stands exactly `clearanceM` in front of the wall band
   * behind it and inflating the test would forbid it its own floor. */
  let bands = [[span.lo + clearanceM, span.hi - clearanceM]];
  for (const o of standpointObstructions(plan, room)) {
    if (chosen.point[normal] <= o.rect[normal + "0"] + 1e-9) continue;
    if (chosen.point[normal] >= o.rect[normal + "1"] - 1e-9) continue;
    bands = withoutInterval(bands, o.rect[cross + "0"] - clearanceM, o.rect[cross + "1"] + clearanceM);
  }

  const Q = Math.pow(10, -DRAWN_DP);
  let best = null;
  for (const [a, b] of bands) {
    const e0 = (a - p0) * rdir, e1 = (b - p0) * rdir;
    const lo = Math.max(dLo, Math.min(e0, e1)), hi = Math.min(dHi, Math.max(e0, e1));
    if (lo > hi + 1e-9) continue;
    /* The least-magnitude whole centimetre inside this interval. */
    let cand = null;
    if (lo <= 1e-9 && hi >= -1e-9) cand = 0;
    else if (lo > 0) { const k = Math.ceil(lo / Q - 1e-6); if (k * Q <= hi + 1e-9) cand = drawn(k * Q); }
    else { const k = Math.floor(hi / Q + 1e-6); if (k * Q >= lo - 1e-9) cand = drawn(k * Q); }
    if (cand === null) continue;
    if (best === null || Math.abs(cand) < Math.abs(best) - 1e-12 ||
        (Math.abs(cand) <= Math.abs(best) + 1e-12 && cand < best)) best = cand;
  }
  if (best === null || best === 0) return chosen;
  return { point: { ...chosen.point, [cross]: p0 + best * rdir }, source: chosen.source };
}

/**
 * WHAT A FACING SHOWS OF THE ROOM IT IS IN — the three things that say "you
 * are inside a room" rather than "you are facing a wall": a corner in frame,
 * the wall-floor line in frame, the wall-ceiling line in frame.
 *
 * Row 20's `+` junction guard has two levels. The per-facing one lives in the
 * tests and asks that no facing of a room that is not a corridor shows more
 * side wall than facing wall. This is the other: a ROOM must have at least one
 * facing that shows the room. The unit is the room because that is the honest
 * one — a 2.60 m passage viewed across its short dimension IS a wall in your
 * face, and it reads as a passage from the two views a player arrives and
 * travels on.
 *
 * The arithmetic is blueprint §5's own, at the drawn camera: a metre of wall is
 * `FOCAL_PX / d` pixels, the wall-floor line sits eye-height below the horizon
 * at that scale, the wall-ceiling line a storey above it, and the corners half
 * a wall width either side of centre.
 */
export function facingShows(plan, room, facing, canvasW = PLAN_CANVAS_W) {
  const fc = room.facings[facing];
  const d = fc.camera_wall_m ?? fc.camera_far_m;
  const px = groundplane.FOCAL_PX / d;
  const H = 1024;
  const floorY = groundplane.HORIZON_Y * H + groundplane.DRAWING_EYE_M * px;
  const fl = (plan.floors || []).find((x) => x.id === room.floor);
  const storey = (room.type === "open" || !fl) ? null : fl.storey_height_m;
  const half = fc.wall_width_m * px / 2;
  const c0 = canvasW / 2 - half, c1 = canvasW / 2 + half;
  return {
    corner: fc.type !== "open" && c0 >= 0 && c1 <= canvasW,
    floor_line: floorY <= H,
    ceiling_line: storey != null && floorY - storey * px >= 0,
    floor_line_y_px: floorY
  };
}

/** The span of the view along the wall, in world coordinates. */
export function viewSpan(rect, facing) {
  return (facing === "N" || facing === "S")
    ? { axis: "x", lo: rect.x0, hi: rect.x1 }
    : { axis: "y", lo: rect.y0, hi: rect.y1 };
}

/**
 * Law (b), mechanically: the built structure standing on a facing's wall
 * line, as intervals across the view. Only exterior and garden bands count —
 * they are the building's one outline plus the one further built structure
 * Kabe ruled in. Returns intervals in the view's own axis, merged and sorted.
 */
export function builtOnWallLine(plan, room, facing, line, kinds) {
  const span = viewSpan(room.rect, facing);
  const [axis, sign] = NORMAL[facing];
  const want = kinds || BUILT_KINDS;
  const segs = [];
  for (const b of plan.wall_bands || []) {
    if (!want.includes(b.kind)) continue;
    if (!Array.isArray(b.floors) || !b.floors.includes(room.floor)) continue;
    if (!rectOk(b.rect)) continue;
    /* The band has to START at the wall line, on the far side of it. */
    const near = sign > 0 ? b.rect[axis + "0"] : b.rect[axis + "1"];
    if (Math.abs(near - line) > EPS) continue;
    const lo = Math.max(span.lo, b.rect[span.axis + "0"]);
    const hi = Math.min(span.hi, b.rect[span.axis + "1"]);
    if (hi - lo > EPS) segs.push([lo, hi]);
  }
  segs.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const s of segs) {
    const last = merged[merged.length - 1];
    if (last && s[0] <= last[1] + EPS) last[1] = Math.max(last[1], s[1]);
    else merged.push([...s]);
  }
  return merged;
}

/** The complement of the above across the view: where no structure stands. */
export function gapsOnWallLine(plan, room, facing, line, kinds) {
  const span = viewSpan(room.rect, facing);
  const built = builtOnWallLine(plan, room, facing, line, kinds);
  const gaps = [];
  let cursor = span.lo;
  for (const [lo, hi] of built) {
    if (lo - cursor > EPS) gaps.push([cursor, lo]);
    cursor = Math.max(cursor, hi);
  }
  if (span.hi - cursor > EPS) gaps.push([cursor, span.hi]);
  return gaps;
}

/** Built structure standing anywhere in the strip a facing looks across —
 * between the standpoint and the line it views. An `open` facing must find
 * none: "where no building stands, the ground runs open to its far line." */
export function structureInView(plan, room, facing, standpoint, line, kinds) {
  const span = viewSpan(room.rect, facing);
  const [axis] = NORMAL[facing];
  const want = kinds || ALL_WALL_KINDS;
  const lo = Math.min(standpoint[axis], line), hi = Math.max(standpoint[axis], line);
  const strip = span.axis === "x"
    ? { x0: span.lo, x1: span.hi, y0: lo, y1: hi }
    : { x0: lo, x1: hi, y0: span.lo, y1: span.hi };
  return (plan.wall_bands || []).filter((b) =>
    want.includes(b.kind) && Array.isArray(b.floors) &&
    b.floors.includes(room.floor) && rectOk(b.rect) && overlapArea(b.rect, strip) > 0);
}

/**
 * Is a point inside the manor's outline? Even-odd crossing on the outline
 * polygon — the same polygon law (b) already treats as the single source of
 * every outdoor wall. An `open` facing's far line has to be OUT here: ground
 * that runs open to a line drawn inside the building is a fabricated horizon,
 * and it is the one thing a strip test cannot catch when the strip happens to
 * miss every band (a far line stopping mid-room).
 */
export function pointInOutline(outline, x, y) {
  let inside = false;
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
    const [xi, yi] = outline[i], [xj, yj] = outline[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** The rooms whose wall lies on one side of an opening and whose span covers
 * it. Exactly one per side, or the opening is not in a wall between two
 * rooms. Each side carries the facing on which that room sees the opening —
 * the opening's own normal, never a centre-to-centre bearing, which is wrong
 * for any door that is not on the room's long axis. */
function abutting(rooms, opening) {
  const r = opening.rect;
  const out = [];
  for (const room of rooms) {
    const q = room.rect;
    if (opening.axis === "EW") {
      if (!(q.y0 - EPS <= r.y0 && r.y1 <= q.y1 + EPS)) continue;
      if (Math.abs(q.x1 - r.x0) < EPS) out.push({ id: room.id, facing: "E" });
      if (Math.abs(q.x0 - r.x1) < EPS) out.push({ id: room.id, facing: "W" });
    } else {
      if (!(q.x0 - EPS <= r.x0 && r.x1 <= q.x1 + EPS)) continue;
      if (Math.abs(q.y1 - r.y0) < EPS) out.push({ id: room.id, facing: "N" });
      if (Math.abs(q.y0 - r.y1) < EPS) out.push({ id: room.id, facing: "S" });
    }
  }
  return out;
}

/** The facing on which `roomId` sees `opening` — exported because the world
 * cross-check and row 15's topology both need exactly this. */
/**
 * [Row 19] THE ONE HOME OF "IS THERE AN HONEST PICTURE OF THIS, FROM HERE?"
 *
 * `projectPlacement` refuses a placement by throwing; `planWarnings` prints
 * the facings a variant manifest therefore does not enumerate. Those two had
 * drifted apart, each carrying its own copy of the condition: six (object,
 * facing) pairs of the SHIPPED plan were refused and only two were printed,
 * because the report's copy also required the footprint to overlap the
 * standpoint-to-wall band and four of the six do not. A refusal nobody prints
 * is exactly the silent skip row 19 exists to abolish, committed by row 19's
 * own report. One predicate, both callers, and the sets are equal by
 * construction rather than by inspection.
 *
 * Returns null when the projection is honest, or the reason it is not.
 *
 * @param {object} fc     the facing record (standpoint, wall_line, camera)
 * @param {string} facing N|E|S|W
 * @param {object} rect   the object's plan footprint
 */
export const MIN_STANDOFF_M = 0.25;
export function projectionFault(fc, facing, rect) {
  const cam = fc.camera_wall_m ?? fc.camera_far_m;
  if (typeof cam !== "number") return null;
  const line = fc.wall_line;
  if (typeof line !== "number") return null;
  const a = facing === "N" ? rect.y1 : facing === "S" ? rect.y0
    : facing === "E" ? rect.x1 : rect.x0;
  const b = facing === "N" ? rect.y0 : facing === "S" ? rect.y1
    : facing === "E" ? rect.x0 : rect.x1;
  const dNear = Math.max(Math.abs(line - a), Math.abs(line - b));
  const standoff = cam - dNear;
  /* AT OR BEHIND THE EYE: no projection exists, and the arithmetic's own sign
   * (a negative pixels-per-metre) is not an answer. */
  if (!(standoff > EPS)) return "at_or_behind";
  /* AND NEARER THAN A HAND'S BREADTH IS NOT A PICTURE EITHER. The row's stated
   * bound — finite and positive — is narrower than the class it was written
   * for: the shipped plan puts a 1.00 m press 0.10 m from the hall's south
   * camera, which projects at 10,240 px/m on a 1,536 px canvas. That is finite
   * and positive and it is not a picture of a press; it is a wall of press.
   * Something a hand's breadth from the eye has no view angle worth deriving
   * and no variant worth asking row 4 for. */
  if (standoff < MIN_STANDOFF_M - EPS) return "at_the_eye";
  return null;
}

export function facingOfOpening(plan, opening, roomId) {
  const rooms = (plan.rooms || []).filter((r) => r.floor === opening.floor && rectOk(r.rect));
  const side = abutting(rooms, opening).find((s) => s.id === roomId);
  return side ? side.facing : null;
}

/**
 * validatePlan(plan, world?, records?) -> findings[]
 */
export function validatePlan(plan, world, records) {
  const findings = [];
  const push = (s) => findings.push(s);

  if (!isObj(plan)) return ["plan.json: not an object"];
  if (plan.schema !== "holo-emitter-plan/0.1") {
    push(`plan.json: schema is ${JSON.stringify(plan.schema)}, expected "holo-emitter-plan/0.1"`);
  }
  if (!Number.isInteger(plan.version) || plan.version < 1) {
    push(`plan.json: version must be a positive integer (shape item 11's version stamp), got ${JSON.stringify(plan.version)}`);
  }
  if (plan.units !== "m") push(`plan.json: units must be "m" — every number in this document is metres of real building`);
  /* Every facing derivation, RIGHT and NORMAL assume north is +y. A document
   * declaring anything else would be silently mirrored end to end. */
  if (plan.north !== "+y") push(`plan.json: north must be "+y" — RIGHT, NORMAL and every facing derivation assume it, and a plan declaring otherwise would be mirrored end to end with no other symptom`);
  if (!isObj(plan.wall_thickness)) push("plan.json: wall_thickness must be an object keyed by band kind");
  /* Row 20's clearance: how far in front of the wall behind you a threshold
   * standpoint stands. A person cannot put their eye in the wall plane, and
   * 0.45 m is the half-depth of a standing body — it is also the value the
   * frame Kabe approved (`01d`, the study at 4.35 m in a 4.80 m room) was
   * rendered at, which is where the number comes from rather than from an
   * agent's taste. */
  if (!isNum(plan.standpoint_threshold_clearance_m) ||
      plan.standpoint_threshold_clearance_m <= 0 || plan.standpoint_threshold_clearance_m >= 1.5) {
    push(`plan.json: standpoint_threshold_clearance_m must be in (0, 1.5) metres — the clearance a threshold standpoint keeps off the wall behind it; got ${JSON.stringify(plan.standpoint_threshold_clearance_m)}`);
  }
  if (!isNum(plan.standpoint_stand_back) || plan.standpoint_stand_back <= 0 || plan.standpoint_stand_back >= 0.5) {
    push(`plan.json: standpoint_stand_back must be in (0, 0.5) — law (a)'s stand-back fraction; got ${JSON.stringify(plan.standpoint_stand_back)}`);
  }

  keyCheck("plan.json", plan, PLAN_TOP_KEYS, push);
  const arrays = ["floors", "wall_bands", "rooms", "openings", "windows", "fireplaces", "stairs", "objects"];
  for (const k of arrays) if (!Array.isArray(plan[k])) push(`plan.json: "${k}" must be an array`);
  if (findings.length) return findings; // nothing below can run on a broken shape

  const K = plan.standpoint_stand_back;
  const C = plan.standpoint_threshold_clearance_m;
  const standpointWarnings = validatePlan.standpointWarnings = [];
  const floorIds = new Set();
  for (const f of plan.floors) {
    if (!isObj(f) || typeof f.id !== "string" || !Number.isInteger(f.level)) {
      push(`plan.json: floors entry is not {id, level}`); continue;
    }
    keyCheck(`floor "${f.id}"`, f, FLOOR_KEYS, push);
    if (f.storey_height_m != null &&
        !(typeof f.storey_height_m === "number" && f.storey_height_m > 1.8 && f.storey_height_m < 12)) {
      push(`floor "${f.id}": storey_height_m ${JSON.stringify(f.storey_height_m)} is not a room height a person stands up in [row11:plan.storey_height]`);
    }
    if (floorIds.has(f.id)) push(`plan.json: duplicate floor id "${f.id}"`);
    floorIds.add(f.id);
  }

  /* Ids unique across every named thing. The fixture validator paid for this
   * one: a duplicate id resolves — twice — and every find-by-id downstream
   * silently picks one of them. */
  const seenIds = new Map();
  const claim = (kind, id) => {
    if (typeof id !== "string" || !id) { push(`plan.json: ${kind} has no id`); return; }
    if (seenIds.has(id)) push(`plan.json: duplicate id "${id}" (${seenIds.get(id)} and ${kind})`);
    else seenIds.set(id, kind);
  };

  const rooms = [];
  for (const r of plan.rooms) {
    if (!isObj(r)) { push("plan.json: rooms entry is not an object"); continue; }
    claim("room", r.id);
    keyCheck(`room "${r.id}"`, r, ROOM_KEYS, push);
    if (!ARCHETYPES.includes(r.archetype)) {
      push(`room "${r.id}": archetype ${JSON.stringify(r.archetype)} is not one of ${ARCHETYPES.join(" | ")} — §4b's room type template, the recipe a room is produced by; it is NOT the facing geometry type`);
    }
    if (!floorIds.has(r.floor)) push(`room "${r.id}": floor "${r.floor}" is not a declared floor`);
    if (!ROOM_TYPES.includes(r.type)) {
      push(`room "${r.id}": type ${JSON.stringify(r.type)} is not one of ${ROOM_TYPES.join(" | ")} — the typed geometry blueprint §5 requires`);
    }
    if (!rectOk(r.rect)) { push(`room "${r.id}": rect is malformed`); continue; }
    needsExtent(`room "${r.id}"`, r.rect, push);
    if (typeof r.name !== "string" || !r.name) push(`room "${r.id}": no name`);
    rooms.push(r);
  }
  const byId = new Map(rooms.map((r) => [r.id, r]));
  const roomsOn = (floor) => rooms.filter((r) => r.floor === floor);

  for (const b of plan.wall_bands) {
    if (!isObj(b)) { push("plan.json: wall_bands entry is not an object"); continue; }
    claim("wall band", b.id);
    keyCheck(`wall band "${b.id}"`, b, BAND_KEYS, push);
    if (!BAND_KINDS.includes(b.kind)) push(`wall band "${b.id}": kind ${JSON.stringify(b.kind)} is not one of ${BAND_KINDS.join(" | ")}`);
    if (!Array.isArray(b.floors) || !b.floors.length || b.floors.some((f) => !floorIds.has(f))) {
      push(`wall band "${b.id}": floors must be declared floor ids`);
    }
    if (!rectOk(b.rect)) push(`wall band "${b.id}": rect is malformed`);
    else needsExtent(`wall band "${b.id}"`, b.rect, push);
    /* The legend on the sheet prints these three numbers, and the drawing
     * renders them from here — so they must be the thickness of the bands they
     * describe, or the sheet states a measurement the walls contradict. */
    if (rectOk(b.rect) && isObj(plan.wall_thickness)) {
      const want = plan.wall_thickness[b.kind];
      const got = Math.min(b.rect.x1 - b.rect.x0, b.rect.y1 - b.rect.y0);
      if (!isNum(want)) push(`plan.json: wall_thickness has no "${b.kind}" — band "${b.id}" is one`);
      else if (Math.abs(got - want) > 1e-9) {
        push(`wall band "${b.id}": is ${fmt(got)} m thick, but wall_thickness.${b.kind} says ${want} m — the sheet's legend prints that number`);
      }
    }
  }
  const bandsOn = (floor) =>
    plan.wall_bands.filter((b) => Array.isArray(b.floors) && b.floors.includes(floor) && rectOk(b.rect));

  /* ---- 2. overlap ------------------------------------------------------- */
  for (const floor of floorIds) {
    const all = roomsOn(floor);
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        if (overlapArea(all[i].rect, all[j].rect) > 0) {
          push(`overlap: ${floor} space "${all[i].id}" overlaps "${all[j].id}"`);
        }
      }
    }
  }

  /* ---- 1. tiling -------------------------------------------------------- */
  const outlineArea = polygonArea(plan.outline);
  if (outlineArea == null) {
    push("plan.json: outline is not a closed axis-aligned polygon of [x, y] pairs — law (b)'s single source of every outdoor wall");
  } else {
    for (const floor of floorIds) {
      const ext = bandsOn(floor).filter((b) => b.kind === "exterior");
      const parts = bandsOn(floor).filter((b) => b.kind === "partition");
      const interior = roomsOn(floor).filter((r) => r.type !== "open");
      const extArea = ext.reduce((a, b) => a + area(b.rect), 0) - pairwiseOverlap(ext.map((b) => b.rect));
      const gross = outlineArea - extArea;
      const got = interior.reduce((a, r) => a + area(r.rect), 0) +
        parts.reduce((a, b) => a + area(b.rect), 0);
      if (Math.abs(got - gross) > 1e-6) {
        push(`tiling: ${floor} rooms + partitions cover ${got.toFixed(4)} m², interior gross is ${gross.toFixed(4)} m² — the floor does not tile`);
      }
      for (const r of interior) {
        for (const b of ext.concat(parts)) {
          if (overlapArea(r.rect, b.rect) > 0) {
            push(`tiling: ${floor} room "${r.id}" overlaps wall band "${b.id}" — a room cannot stand inside a wall`);
          }
        }
      }
    }
    /* The outline and the wall bands are two statements of one geometry, and
     * §4b makes the outline "the single source of every outdoor wall". Every
     * edge of it must be the outer face of an exterior band, or the two have
     * drifted and law (b) is being checked against a shape nothing builds. */
    for (const [p, q] of polygonEdges(plan.outline) || []) {
      const vertical = Math.abs(p[0] - q[0]) < EPS;
      const val = vertical ? p[0] : p[1];
      const lo = Math.min(vertical ? p[1] : p[0], vertical ? q[1] : q[0]);
      const hi = Math.max(vertical ? p[1] : p[0], vertical ? q[1] : q[0]);
      const ok = plan.wall_bands.some((b) => {
        if (b.kind !== "exterior" || !rectOk(b.rect)) return false;
        const r = b.rect;
        return vertical
          ? (Math.abs(r.x0 - val) < EPS || Math.abs(r.x1 - val) < EPS) &&
            r.y0 - EPS <= lo && hi <= r.y1 + EPS
          : (Math.abs(r.y0 - val) < EPS || Math.abs(r.y1 - val) < EPS) &&
            r.x0 - EPS <= lo && hi <= r.x1 + EPS;
      });
      if (!ok) {
        push(`outline: the edge from (${p[0]}, ${p[1]}) to (${q[0]}, ${q[1]}) is not the face of any exterior wall band — the outline and the bands disagree about where the building stands`);
      }
    }
  }

  /* ---- 5. standpoint derivability, and 6. law (b) ----------------------- */
  for (const r of rooms) {
    if (!isObj(r.facings)) { push(`room "${r.id}": no facings`); continue; }
    const keys = Object.keys(r.facings);
    if (keys.length !== 4 || !FACINGS.every((f) => keys.includes(f))) {
      push(`room "${r.id}": facings must be exactly N, E, S, W — got ${keys.join(", ") || "none"}`);
      continue;
    }
    for (const f of FACINGS) {
      const fc = r.facings[f];
      if (!isObj(fc)) { push(`room "${r.id}" facing ${f}: not an object`); continue; }
      keyCheck(`room "${r.id}" facing ${f}`, fc, FACING_KEYS, push);
      if (!FACING_TYPES.includes(fc.type)) {
        push(`room "${r.id}" facing ${f}: type ${JSON.stringify(fc.type)} is not one of ${FACING_TYPES.join(" | ")}`);
        continue;
      }
      if (fc.type === "open" && !isNum(fc.far_line)) {
        push(`room "${r.id}" facing ${f}: an open facing has no wall, so it must carry the far_line its ground runs to (law (b))`);
      }
      if (fc.type !== "open" && fc.far_line != null) {
        push(`room "${r.id}" facing ${f}: a ${fc.type} facing views a wall, so it must not carry a far_line`);
      }
      const geo = facingGeometry(r.rect, f, fc.type === "open" ? fc.far_line : undefined);
      if (!isNum(fc.wall_line) || Math.abs(fc.wall_line - geo.wallLine) > 1e-9) {
        push(`room "${r.id}" facing ${f}: wall_line ${fc.wall_line} is not the line this facing views (${geo.wallLine})`);
        continue;
      }
      if (!isObj(fc.standpoint) || !isNum(fc.standpoint.x) || !isNum(fc.standpoint.y)) {
        push(`room "${r.id}" facing ${f}: no standpoint — law (a) marks every facing's standpoint`);
        continue;
      }
      /* A standpoint may be drawn rather than ruled — §4b item 9 puts several
       * standpoints in a big room, and the great hall and the long gallery
       * are named as its first honest use. `standpoint_source` says which,
       * and the K rule is checked only where the plan claims it. */
      const src = fc.standpoint_source || "rule";
      /* PRECEDENCE, and it is load-bearing: a standpoint inside masonry is
       * reported as THAT and nothing else. The alternative is two findings for
       * one fault — "you are standing in the hearth" and "you are not where
       * the law puts you" — and a ledger case that can isolate neither. Same
       * shape as the harness's unknown-check-runs-first. */
      let inMasonry = null;
      for (const o of standpointObstructions(plan, r)) {
        if (fc.standpoint && fc.standpoint.x >= o.rect.x0 - 1e-9 && fc.standpoint.x <= o.rect.x1 + 1e-9 &&
            fc.standpoint.y >= o.rect.y0 - 1e-9 && fc.standpoint.y <= o.rect.y1 + 1e-9) { inMasonry = o; break; }
      }
      if (inMasonry) {
        /* HARD for a standpoint an agent computed, a WARNING for one the
         * drawing carries. A warning is for something a human approved and an
         * agent may not change; `threshold` standpoints are this row's own
         * arithmetic, so an absurdity in one is a defect. */
        if (src === "threshold") {
          push(`room "${r.id}" facing ${f}: the threshold standpoint (${fc.standpoint.x}, ${fc.standpoint.y}) stands inside ${inMasonry.kind} — a viewer stands on floor the room has left, not in its masonry [row20:plan.standpoint_clear]`);
        } else {
          standpointWarnings.push(`room "${r.id}" facing ${f}: the ${src} standpoint stands inside ${inMasonry.kind} — it is on the approved drawing, so it is reported rather than moved`);
        }
      } else if (src !== "rule" && src !== "threshold" && src !== "drawn") {
        push(`room "${r.id}" facing ${f}: standpoint_source ${JSON.stringify(src)} is not "rule", "threshold" or "drawn" [row20:plan.standpoint_source]`);
      } else if (src !== "drawn") {
        /* THE STANDPOINT LAW (row 20). `rule` and `threshold` are both
         * computed — one function, `standpointFor`, decides which branch a
         * facing takes and where it stands — so the document cannot claim one
         * branch and stand in the other's place, and it cannot claim `rule`
         * on a facing whose wall does not fit the frame. `drawn` is the
         * escape hatch §4b item 9's multi-standpoint rooms need and is
         * checked only for its measured distance, as before. */
        const want = standpointFor(plan, r, f, K, C);
        if (want.source !== src) {
          push(`room "${r.id}" facing ${f}: standpoint_source "${src}" but the law puts it at the "${want.source}" standpoint — a ${fc.wall_width_m} m wall ${wallFitsFrame(fc.wall_width_m, measuredDistance(ruleStandpoint(r.rect, f, K), f, geo.wallLine)) ? "fits" : "does not fit"} the frame from the drawn standpoint; mark it standpoint_source "drawn" if it is deliberate [row20:plan.standpoint_branch]`);
        } else if (Math.abs(fc.standpoint.x - want.point.x) > 1e-9 || Math.abs(fc.standpoint.y - want.point.y) > 1e-9) {
          /* [Row 26] AND WHICH OF THE TWO QUESTIONS IT GOT WRONG. The law now
           * decides a distance and then a position along the wall, and a
           * message naming only the stand-back would describe a slid facing as
           * a stand-back that never moved sideways — a finding that sends its
           * reader to the wrong half of the law. */
          const crossAxis = (f === "N" || f === "S") ? "x" : "y";
          const slid = Math.abs(fc.standpoint[crossAxis] - want.point[crossAxis]) > 1e-9;
          const why = slid
            ? `the law slides this facing along its own wall to bring every door the plan draws on it fully in frame with ${FRAME_MARGIN_PX} px of margin, then stands back ${K} of the room's own dimension (threshold clearance ${C} m off the wall behind)`
            : `stand-back ${K} of the room's own dimension, threshold clearance ${C} m off the wall behind`;
          push(`room "${r.id}" facing ${f}: standpoint (${fc.standpoint.x}, ${fc.standpoint.y}) is not the "${src}" one (${want.point.x}, ${want.point.y}) — ${why} [row20:plan.standpoint_stands_back]`);
        }
      }
      /* Law (a), always: the printed number IS the measured distance from the
       * drawn standpoint to the line it views, at the drawn precision.
       *
       * An OPEN facing measures to drawn ground with no surface on it, and it
       * carries `camera_far_m` — a different field, not a differently-valued
       * one, because §4b item 2 makes this document the interchange format a
       * future host emits and `groundplane.scaleAtDepth` silently falls back
       * to 3.5 m for a missing `camera_wall_m`. A name a consumer has to
       * handle beats a number it will misread. */
      const measured = measuredDistance(fc.standpoint, f, fc.wall_line);
      const distField = fc.type === "open" ? "camera_far_m" : "camera_wall_m";
      const otherField = fc.type === "open" ? "camera_wall_m" : "camera_far_m";
      if (fc[otherField] != null) {
        push(`room "${r.id}" facing ${f}: a ${fc.type} facing must carry ${distField}, never ${otherField}`);
      }
      if (fc[distField] !== drawn(measured)) {
        push(`room "${r.id}" facing ${f}: ${distField} ${fc[distField]} is not the measured standpoint-to-${fc.type === "open" ? "far-line" : "wall"} distance (${drawn(measured)}, from ${measured}) — law (a): it is read off the drawing, never invented`);
      }
      if (measured <= 0) {
        push(`room "${r.id}" facing ${f}: the standpoint is on or past the line it views (${measured} m)`);
      }
      if (fc.wall_width_m !== drawn(geo.width)) {
        push(`room "${r.id}" facing ${f}: wall_width_m ${fc.wall_width_m} is not the drawn width of the wall in view (${drawn(geo.width)}, from ${geo.width})`);
      }
      /* ---- Law (b), for EVERY facing of EVERY room ----------------------
       *
       * The law is about the facing's TYPE against what the bands actually
       * build, and nothing about it is particular to an outdoor space. Gating
       * it on `room.type === "open"` — which is what this check did until the
       * round-4 critic broke it — leaves the whole interior unguarded in both
       * directions: an interior facing could be typed `open` with a far line
       * driven straight through the manor's north range (a vista prompt for a
       * stone fireplace wall, at row 4, with nothing left to catch it), and a
       * partition could be deleted with the two rooms grown to meet and both
       * facings still typed `enclosed` (an invented wall, which is the exact
       * thing law (b) is named for).
       *
       * `ALL_WALL_KINDS` throughout, not `BUILT_KINDS`: an interior facing
       * sees partitions, and for an outdoor space the stronger set costs
       * nothing, since no partition stands outdoors. */
      if (fc.type === "open") {
        const hits = structureInView(plan, r, f, fc.standpoint, fc.wall_line, ALL_WALL_KINDS);
        if (hits.length) {
          push(`law (b): "${r.id}" facing ${f} is typed open, but built structure stands in that view — ${hits.map((b) => b.id).join(", ")}`);
        }
        /* And nothing may stand ON the far line either: a facing whose ground
         * runs open to a line the manor's wall is built along is a wall you
         * would see, described as sky. */
        const onLine = builtOnWallLine(plan, r, f, fc.wall_line, ALL_WALL_KINDS);
        if (onLine.length) {
          push(`law (b): "${r.id}" facing ${f} is typed open, but built structure stands on the very line its ground runs to (${fc.wall_line})`);
        }
        /* The far line itself must be outdoors. A strip test misses a far line
         * that stops mid-room without crossing a band; the outline does not. */
        if (Array.isArray(plan.outline)) {
          const [axis] = NORMAL[f];
          const px = axis === "y" ? fc.standpoint.x : fc.wall_line;
          const py = axis === "y" ? fc.wall_line : fc.standpoint.y;
          if (pointInOutline(plan.outline, px, py)) {
            push(`law (b): "${r.id}" facing ${f} is typed open, but its far line (${fc.wall_line}) falls INSIDE the manor outline at (${fmt(px)}, ${fmt(py)}) — open ground cannot run to a line drawn through the building`);
          }
        }
      } else {
        /* The other direction. A facing that claims a wall must have one:
         * some band standing on the line it views. Whether that wall spans the
         * WHOLE view is a warning, not a finding (the entrance approach's
         * north view is a wall with the court mouth open in the middle of it,
         * and the drawing says so). */
        const built = builtOnWallLine(plan, r, f, fc.wall_line, ALL_WALL_KINDS);
        if (!built.length) {
          push(`law (b): "${r.id}" facing ${f} is typed ${fc.type}, but no wall band stands on the line it views (${fc.wall_line}) — a facing sees a wall only where the plan actually builds one`);
        }
      }
    }
  }

  /* ---- 3. every opening joins the two spaces it names ------------------- */
  const openings = [];
  for (const o of plan.openings) {
    if (!isObj(o)) { push("plan.json: openings entry is not an object"); continue; }
    claim("opening", o.id);
    keyCheck(`opening "${o.id}"`, o, OPENING_KEYS, push);
    if (!OPENING_KINDS.includes(o.kind)) {
      push(`opening "${o.id}": kind ${JSON.stringify(o.kind)} is not one of ${OPENING_KINDS.join(" | ")}`);
      continue;
    }
    if (!floorIds.has(o.floor)) { push(`opening "${o.id}": floor "${o.floor}" is not a declared floor`); continue; }
    if (o.axis !== "EW" && o.axis !== "NS") { push(`opening "${o.id}": axis must be "EW" or "NS"`); continue; }
    if (!rectOk(o.rect)) { push(`opening "${o.id}": rect is malformed`); continue; }
    /* An open_edge is a boundary LINE and is flat across its own axis; a door
     * is a hole in a wall and must be solid in both. Either way the clear
     * width along the boundary has to be positive or nothing walks through. */
    needsExtent(`opening "${o.id}"`, o.rect, push,
      o.kind === "open_edge" ? (o.axis === "NS" ? "y" : "x") : undefined);
    if (!Array.isArray(o.joins) || o.joins.length !== 2) {
      push(`opening "${o.id}": joins must name exactly two spaces`); continue;
    }
    let unresolved = false;
    for (const id of o.joins) if (!byId.has(id)) { push(`opening "${o.id}": joins "${id}", which is not a room`); unresolved = true; }
    if (o.joins[0] === o.joins[1]) push(`opening "${o.id}": joins a room to itself`);
    const sides = abutting(roomsOn(o.floor), o);
    if (sides.length !== 2) {
      push(`opening "${o.id}": does not lie between exactly two rooms on ${o.floor} — it abuts [${sides.map((s) => `${s.id} (${s.facing})`).join(", ") || "nothing"}]`);
    } else if (!unresolved) {
      const geom = sides.map((s) => s.id).sort().join("|");
      const named = [...o.joins].sort().join("|");
      if (geom !== named) {
        push(`opening "${o.id}": joins [${o.joins.join(", ")}] but geometrically lies between [${sides.map((s) => s.id).join(", ")}]`);
      }
    }
    if (o.kind === "door" && !bandsOn(o.floor).some((b) => contains(b.rect, o.rect))) {
      push(`opening "${o.id}": is not inside any wall band on ${o.floor} — a door has to be a hole in a wall`);
    }
    if (o.entity != null && typeof o.entity !== "string") push(`opening "${o.id}": entity must be a string`);
    openings.push(o);
  }

  /* ---- stairs ----------------------------------------------------------- */
  const stairs = [];
  for (const s of plan.stairs) {
    if (!isObj(s)) { push("plan.json: stairs entry is not an object"); continue; }
    claim("stair", s.id);
    keyCheck(`stair "${s.id}"`, s, STAIR_KEYS, push);
    if (!rectOk(s.rect)) push(`stair "${s.id}": rect is malformed`);
    else needsExtent(`stair "${s.id}"`, s.rect, push);
    if (!Array.isArray(s.joins) || s.joins.length !== 2 || s.joins.some((id) => !byId.has(id))) {
      push(`stair "${s.id}": joins must name two rooms`); continue;
    }
    const [a, b] = s.joins.map((id) => byId.get(id));
    if (a.floor === b.floor) push(`stair "${s.id}": joins two rooms on the same floor`);
    if (!FACINGS.includes(s.up) || !FACINGS.includes(s.down)) {
      push(`stair "${s.id}": up and down must each be one of N, E, S, W`);
    } else if (RIGHT[s.up][0] !== -RIGHT[s.down][0] || RIGHT[s.up][1] !== -RIGHT[s.down][1]) {
      push(`stair "${s.id}": up "${s.up}" and down "${s.down}" are not opposite — Kabe's ruling (4) keeps stairs straight single flights ("let's keep it simple for now"), and a straight flight is walked back the way it was walked up`);
    }
    if (s.kind !== "straight") {
      push(`stair "${s.id}": kind ${JSON.stringify(s.kind)} — only "straight" obeys blueprint §3's orientation law without the fiction-demands-a-turn exception, which ruling (4) left unspent`);
    }
    /* A flight of two treads is not a storey. The plan carries no vertical
     * datum yet (named in design/architecture.md as row 4's and row 11's), so
     * this is a sanity band rather than a rise check: a c.1660 domestic storey
     * takes roughly 12–24 treads. */
    if (!Number.isInteger(s.treads) || s.treads < 10 || s.treads > 30) {
      push(`stair "${s.id}": treads is ${JSON.stringify(s.treads)} — a flight between two storeys is 10–30; the plan carries no storey height to check a rise against`);
    }
    /* [Row 15] AND THE TRAVEL DIRECTIONS ANSWER TO THE DRAWING.
     *
     * `up` and `down` are the only thing the world cross-check has to check a
     * stair exit's facing against, and `architecture.md` records them among
     * the fields that "have only the code's own mutation tests" — unanchored
     * to the approved sheet. One wrong token and the world is authored to
     * agree with it, the cross-check passes, and climbing that stair turns
     * the player around.
     *
     * Two halves of it can be anchored to drawn geometry and are: they must be
     * OPPOSITE, and the flight's own longer axis must be the axis they name —
     * the run of a flight is the direction it travels. What cannot be anchored
     * is which END is the top, because the two rooms a flight joins are
     * stacked and have identical rects; that residual is named here rather
     * than left to be discovered. */
    if (rectOk(s.rect) && FACINGS.includes(s.up)) {
      const runAxis = (s.up === "N" || s.up === "S") ? "y" : "x";
      const across = runAxis === "y" ? "x" : "y";
      const runLen = s.rect[runAxis + "1"] - s.rect[runAxis + "0"];
      const wideLen = s.rect[across + "1"] - s.rect[across + "0"];
      if (!(runLen > wideLen)) {
        push(`stair "${s.id}": it travels ${s.up}/${s.down}, so its run is its ${runAxis} extent — ${runLen} m against ${wideLen} m across, which is a flight drawn sideways to the way it is climbed [row15:plan.stair_directions]`);
      }
    }
    for (const room of [a, b]) {
      if (rectOk(s.rect) && !contains(room.rect, s.rect)) push(`stair "${s.id}": its flight is not inside "${room.id}"`);
    }
    stairs.push(s);
  }

  /* ---- 4. reachability -------------------------------------------------- */
  {
    const adj = new Map(rooms.map((r) => [r.id, new Set()]));
    const link = (a, b) => { adj.get(a)?.add(b); adj.get(b)?.add(a); };
    for (const o of openings) if (o.joins.every((id) => byId.has(id))) link(o.joins[0], o.joins[1]);
    for (const s of stairs) if (s.joins.every((id) => byId.has(id))) link(s.joins[0], s.joins[1]);
    const start = plan.entrance;
    if (typeof start !== "string" || !byId.has(start)) {
      push(`plan.json: "entrance" must name the space every room is walked to from; got ${JSON.stringify(start)}`);
    } else {
      const seen = new Set(), stack = [start];
      while (stack.length) {
        const n = stack.pop();
        if (seen.has(n)) continue;
        seen.add(n);
        for (const m of adj.get(n) || []) stack.push(m);
      }
      const missing = rooms.map((r) => r.id).filter((id) => !seen.has(id)).sort();
      if (missing.length) {
        push(`reachability: ${missing.length} space(s) cannot be walked to from "${start}": ${missing.join(", ")}`);
      }
    }
  }

  /* ---- 7a. windows lie in walls, with an interior side ------------------
   * A window floating in a room is a wall map that gets prompted into a
   * backdrop at row 4, where nothing can catch it any more. */
  plan.windows.forEach((w, i) => {
    const label = `window ${i} (${w && w.floor})`;
    if (!isObj(w) || !floorIds.has(w.floor) || !rectOk(w.rect)) { push(`${label}: malformed`); return; }
    keyCheck(label, w, WINDOW_KEYS, push);
    needsExtent(label, w.rect, push);
    if (!bandsOn(w.floor).some((b) => contains(b.rect, w.rect))) {
      push(`${label}: is not inside any wall band — a window is a hole in a wall`);
    }
    const touches = roomsOn(w.floor).some((r) => {
      const q = r.rect, x = w.rect;
      const spansX = q.x0 - EPS <= x.x0 && x.x1 <= q.x1 + EPS;
      const spansY = q.y0 - EPS <= x.y0 && x.y1 <= q.y1 + EPS;
      return (spansY && (Math.abs(q.x1 - x.x0) < EPS || Math.abs(q.x0 - x.x1) < EPS)) ||
        (spansX && (Math.abs(q.y1 - x.y0) < EPS || Math.abs(q.y0 - x.y1) < EPS));
    });
    if (!touches) push(`${label}: no room on ${w.floor} looks through it`);
  });

  /* ---- 7b. fireplaces sit in one room ----------------------------------- */
  plan.fireplaces.forEach((f, i) => {
    const label = `fireplace ${i} (${f && f.floor})`;
    if (!isObj(f) || !floorIds.has(f.floor) || !rectOk(f.rect)) { push(`${label}: malformed`); return; }
    keyCheck(label, f, FIREPLACE_KEYS, push);
    needsExtent(label, f.rect, push);
    const hosts = roomsOn(f.floor).filter((r) => contains(r.rect, f.rect));
    if (hosts.length !== 1) {
      push(`${label}: lies inside ${hosts.length} rooms (${hosts.map((h) => h.id).join(", ") || "none"}) — a chimney breast projects into exactly one`);
    } else if (f.room !== hosts[0].id) {
      push(`${label}: says room "${f.room}" but stands in "${hosts[0].id}"`);
    }
  });
  /* Stacks are continuous upward: an upper hearth standing on nothing is a
   * chimney with no flue below it. The other direction — a ground hearth with
   * nothing above — is a warning, because a plan may honestly stop a stack. */
  for (const f of plan.floors) {
    if (f.level === 0) continue;
    const below = plan.floors.find((g) => g.level === f.level - 1);
    if (!below) continue;
    for (const fire of plan.fireplaces.filter((x) => x.floor === f.id)) {
      if (!rectOk(fire.rect)) continue;
      if (!plan.fireplaces.some((g) => g.floor === below.id && rectOk(g.rect) && overlapArea(g.rect, fire.rect) > 0)) {
        push(`fireplace in "${fire.room}" (${f.id}) stands on nothing — chimney stacks are continuous, so every upper hearth sits over one below`);
      }
    }
  }

  /* EVERY ROOM SHOWS ITSELF FROM SOMEWHERE. Row 20's second-level `+` guard,
   * and the unit is the room: a facing may honestly be a wall in your face,
   * but a room all of whose facings are is a room a player can never see the
   * shape of. Hard, because it is a claim about the building's own metres
   * against the ruled lens, and a plan that fails it cannot be drawn honestly
   * from any standpoint inside itself. */
  for (const room of plan.rooms || []) {
    if (!room.facings) continue;
    const any = FACINGS.some((f) => {
      if (!room.facings[f]) return false;
      const sh = facingShows(plan, room, f);
      return sh.corner || sh.floor_line || sh.ceiling_line;
    });
    if (!any) {
      push(`room "${room.id}": no facing of it shows a corner, a wall-floor line or a wall-ceiling line — at the ruled lens this room can never be seen as a room from inside itself [row20:plan.room_reads]`);
    }
  }

  /* ---- 7c. objects ------------------------------------------------------ */
  const worldLocation = new Map();
  if (isObj(world)) for (const e of world.entities || []) if (e.location) worldLocation.set(e.id, e.location);
  /* The footprint↔dims cross-check is the only thing binding a plan footprint
   * to the object it claims to be, and where it CAN run it must not be
   * optional (round-3 finding). It resolves through world.json's entity→sprite
   * map, so a caller that supplied a world and withheld the records has
   * skipped a check that was available; a caller with no world at all is the
   * plan-only case §4b item 2 describes — a host emitting geometry with no
   * truth document beside it — and that is not an invalid plan. planWarnings
   * says so out loud, so the skip is never silent. */
  if (plan.objects.length && isObj(world) && !records) {
    push("plan.json: objects are present and a world was supplied, but no §6 records were — the footprint↔dims cross-check is the only thing binding a plan footprint to the object it claims to be, and where it can run it must not be optional");
  }
  for (const o of plan.objects) {
    if (!isObj(o) || typeof o.id !== "string") { push("plan.json: objects entry is not an object with an id"); continue; }
    claim("object", o.id);
    keyCheck(`object "${o.id}"`, o, OBJECT_KEYS, push);
    if (worldLocation.has(o.id) && worldLocation.get(o.id) !== o.room) {
      push(`object "${o.id}": the plan puts it in "${o.room}", world.json puts it in "${worldLocation.get(o.id)}"`);
    }
    const room = byId.get(o.room);
    if (!room) { push(`object "${o.id}": room "${o.room}" is not a room`); continue; }
    if (room.floor !== o.floor) push(`object "${o.id}": floor "${o.floor}" is not the floor of room "${o.room}"`);
    if (!OBJECT_SOURCES.includes(o.source)) {
      push(`object "${o.id}": source ${JSON.stringify(o.source)} is not one of ${OBJECT_SOURCES.join(" | ")} — a later re-derivation has to know which values it may regenerate`);
    }
    /* FURNITURE STANDS ON FREE FLOOR, not inside the building. Row 11's own
     * "every directly-staged placement lies inside the room at its own scale"
     * was scoped to the room POLYGON, and a chimney breast is inside that — so
     * `desk1` sat with 91% of its footprint in the study's hearth, on the
     * facing row 4 generates first, reported as a warning nobody had to act
     * on. A room's free floor is the room minus what is built into it. */
    /* [Row 19] THE CARRIERS, ALL THREE OF THEM, AND ONE FAULT MAKES ONE
     * FINDING.
     *
     * Row 11 gave furniture a hearth to keep out of and a flight to keep off.
     * Row 11's own round-6 residue named the two it had not: a doorway's
     * threshold, and the point the viewer stands on. The second is what the
     * artifact critic reached for — a desk on `study/N`'s standpoint — and a
     * clean-validated plan then handed the projection a `scale_px_per_m` of
     * −1152, because the desk stood at the camera.
     *
     * PRECEDENCE, written before the ledger cases were constructed, and
     * extending row 20's rule that a standpoint in masonry takes precedence
     * over the branch and placement clauses. One object can be in a hearth ON
     * a standpoint straddling a threshold, and the ledger requires each case
     * to trip its clause and NOTHING else — so without a stated order the
     * cases would be built by picking constructions that happen not to
     * collide, which is the author proving the case he wrote. The first fault
     * is the one that explains the rest: an object standing where the viewer
     * stands necessarily projects badly. */
    let fault = null;
    const carrier = (s) => { if (!fault) fault = s; };
    for (const room2 of [room]) {
      if (!room2.facings || !rectOk(o.footprint)) break;
      for (const f of FACINGS) {
        const fc = room2.facings[f];
        if (!fc || !fc.standpoint) continue;
        const p = fc.standpoint;
        if (p.x >= o.footprint.x0 - 1e-9 && p.x <= o.footprint.x1 + 1e-9 &&
            p.y >= o.footprint.y0 - 1e-9 && p.y <= o.footprint.y1 + 1e-9) {
          carrier(`object "${o.id}": its footprint covers "${o.room}"'s ${f} standpoint (${p.x}, ${p.y}) — a viewer stands on floor the room has left, and an object at the camera has no projection at all [row19:plan.object_clear_of_standpoints]`);
          break;
        }
      }
    }
    for (const fire of plan.fireplaces || []) {
      if (fire.floor !== o.floor || !rectOk(fire.rect) || !rectOk(o.footprint)) continue;
      const a = overlapArea(fire.rect, o.footprint);
      if (a > 1e-9) {
        carrier(`object "${o.id}": ${a.toFixed(3)} m² of its footprint is inside the chimney breast of "${fire.room}" — furniture stands on the floor a room has left, not in its masonry [row11:plan.object_clear_of_carriers]`);
      }
    }
    for (const st of plan.stairs || []) {
      if (!rectOk(st.rect) || !rectOk(o.footprint)) continue;
      const room = byId.get(o.room);
      if (!room || !st.joins.includes(o.room)) continue;
      if (overlapArea(st.rect, o.footprint) > 1e-9) {
        carrier(`object "${o.id}": its footprint is on the "${st.id}" flight [row11:plan.object_clear_of_stairs]`);
      }
    }
    /* THE SECOND CARRIER: a doorway's own threshold. An opening's rect is the
     * hole through the wall's thickness and the floor a player crosses to use
     * it; a press standing in it is a door that cannot be opened, drawn by a
     * plan nothing refused. Both kinds count — a door and an open edge — and
     * only openings on this object's own floor that its own room abuts. */
    for (const op of plan.openings || []) {
      if (op.floor !== o.floor || !rectOk(o.footprint) || !op.rect) continue;
      if (!(op.joins || []).includes(o.room)) continue;
      const a = overlapArea(op.rect, o.footprint);
      if (a > 1e-9) {
        carrier(`object "${o.id}": ${a.toFixed(3)} m² of its footprint stands in the "${op.id}" threshold — a doorway is floor a player crosses, not floor furniture stands on [row19:plan.object_clear_of_thresholds]`);
      }
    }
    for (const other of plan.objects || []) {
      if (other.id <= o.id || other.floor !== o.floor) continue;
      if (!rectOk(other.footprint) || !rectOk(o.footprint)) continue;
      if (overlapArea(other.footprint, o.footprint) > 1e-9) {
        carrier(`objects "${o.id}" and "${other.id}" occupy the same floor area [row11:plan.objects_do_not_share_floor]`);
      }
    }
    /* [Row 19] AND THE THIRD CARRIER CLAUSE, WHICH IS THE ONE THAT CATCHES
     * THE CLASS RATHER THAN THE CONSTRUCTION.
     *
     * The two above remove the footprints anyone has thought of. An artifact
     * critic then put a desk at (25.3..26.1, 9.75..9.95) — inside the study,
     * on no standpoint, clear of hearth, threshold, flight and every other
     * footprint — and the plan validated CLEAN while `projectPlacement` on
     * `study/N` returned −3413 px/m and on `study/E` −1014.
     *
     * So: for every facing whose view CONTAINS this footprint, its nearest
     * ground edge must be strictly in front of that facing's camera. "Contains"
     * is the FRUSTUM and not the band between the standpoint and the wall,
     * which is the distinction that makes this clause both correct and
     * satisfiable: the study's own desk and chair stand LEVEL with two of its
     * standpoints, a metre and a half off the view axis, where the frustum has
     * closed to a few centimetres — beside the viewer, not in front of them,
     * and in no picture at all. A clause reading the band would refuse the
     * plan Kabe approved for a picture nobody draws.
     *
     * The frustum's half-width at depth `d` is `(canvasW / 2) · (cam − d) / f`
     * metres, which is zero AT the camera — so an object that reaches the
     * camera plane inside the view is caught by construction, and one beside
     * it is not. */
    if (rectOk(o.footprint) && room.facings) {
      for (const f of FACINGS) {
        const fc = room.facings[f];
        if (!fc || !fc.standpoint) continue;
        const cam = fc.camera_wall_m ?? fc.camera_far_m;
        const line = fc.wall_line;
        if (typeof cam !== "number" || typeof line !== "number") continue;
        const [normalAxis] = NORMAL[f];
        const lateralAxis = normalAxis === "y" ? "x" : "y";
        const a0 = Math.abs(line - o.footprint[normalAxis + "0"]);
        const a1 = Math.abs(line - o.footprint[normalAxis + "1"]);
        const dFar = Math.min(a0, a1), dNear = Math.max(a0, a1);
        if (dFar >= cam - EPS) continue;              // wholly behind the camera
        /* Does any part of the footprint that is IN FRONT of the camera fall
         * inside the frustum? Sampled at the near end of that part, where the
         * frustum is narrowest, and at the far end, where it is widest. */
        const axisPos = fc.standpoint[lateralAxis];
        const lo = o.footprint[lateralAxis + "0"], hi = o.footprint[lateralAxis + "1"];
        let inView = false;
        for (const d of [dFar, Math.min(dNear, cam - 1e-6)]) {
          const half = (PLAN_CANVAS_W / 2) * (cam - d) / groundplane.FOCAL_PX;
          if (hi > axisPos - half - EPS && lo < axisPos + half + EPS) { inView = true; break; }
        }
        if (!inView) continue;
        if (!(dNear < cam - EPS)) {
          carrier(`object "${o.id}": on ${o.room}/${f} it stands in the view with its near ground edge ${dNear.toFixed(3)} m from the wall line and the camera at ${cam} m — an object at or beyond the camera has no projection, and a scale that is not a positive finite number is a finding rather than a number the renderer paints with [row19:plan.object_projects_finitely]`);
          break;
        }
      }
    }
    if (fault) push(fault);

    /* A composed footprint is one a human licence moved off its derived
     * value; without the reason beside it the next re-derivation cannot tell
     * a decision from a stale number, which is the whole point of the token. */
    if (o.source === "composed" && !(typeof o.note === "string" && o.note.trim().length > 20)) {
      push(`object "${o.id}": source "composed" without a note saying why — blueprint §4's licence is "change it if it makes the product better, and say why", and the why lives where the value does [row11:plan.composed_needs_note]`);
    }
    if (o.note != null && o.source !== "composed") {
      push(`object "${o.id}": carries a note but its source is "${o.source}" — a note records a composition choice, and a derived value has none [row11:plan.note_needs_composed]`);
    }
    if (!ATTACHMENTS.includes(o.attachment)) {
      push(`object "${o.id}": attachment ${JSON.stringify(o.attachment)} is not a §4 attachment token`);
    }
    if (!rectOk(o.footprint)) { push(`object "${o.id}": footprint is malformed — the plan holds the rect the object stands on, not a point`); continue; }
    needsExtent(`object "${o.id}" footprint`, o.footprint, push);
    if (!contains(room.rect, o.footprint)) {
      push(`object "${o.id}": its footprint is not inside room "${o.room}"`);
    }
    for (const b of bandsOn(o.floor)) {
      if (overlapArea(b.rect, o.footprint) > 0) push(`object "${o.id}": its footprint runs into wall band "${b.id}"`);
    }
    {
      const rec = records && records[o.id];
      /* [Row 21] The record map is keyed by ENTITY id, so it can only hold a
       * record for an object the world beside the plan actually names. A world
       * that holds the entity and cannot produce its record is the defect this
       * clause was written for and still fires — and so does a world that
       * stages other furniture and not this piece, which is a disagreement
       * between two documents about what the room contains.
       *
       * What is NOT a finding is a world that stages NOTHING AT ALL: the
       * navigation world is the manor with no furniture in it, so no footprint
       * in the plan can be bound to anything and the check is unavailable
       * rather than failed. `planWarnings` says how many went unjudged, so the
       * weaker run is never silently weaker. The discriminator is the world's
       * own emptiness, not this object's absence, because "the plan draws a
       * desk this world does not hold" means one thing in a furnished world
       * and another in an empty one.
       *
       * [ROW 42] AND "EMPTY" MEANS NO FURNITURE, NOT NO ENTITIES. The
       * discriminator used to be `worldLocation.size > 0` — any entity at all
       * — and the navigation world now holds two that are not furniture: a
       * door leaf and a window casement, the building's own fittings, which
       * the plan draws as an OPENING and a WINDOW and never as an object. One
       * leaf hung in a doorway made all four of the manor plan's unfurnished
       * footprints report as records the world could not produce. The question
       * the clause is asking is whether this world furnishes the plan at all,
       * so that is what it asks. */
      if (!rec && records &&
          (worldLocation.has(o.id) ||
           (plan.objects || []).some((other) => worldLocation.has(other.id)))) {
        push(`object "${o.id}": no §6 record — nothing binds this footprint to an object of a known size`);
      }
      if (rec && rec.dims_m) {
        const w = o.footprint.x1 - o.footprint.x0, d = o.footprint.y1 - o.footprint.y0;
        const ok = (Math.abs(w - rec.dims_m.w) < 1e-6 && Math.abs(d - rec.dims_m.d) < 1e-6) ||
          (Math.abs(w - rec.dims_m.d) < 1e-6 && Math.abs(d - rec.dims_m.w) < 1e-6);
        if (!ok) {
          push(`object "${o.id}": footprint is ${fmt(w)} × ${fmt(d)} m, but its record says the object is ${rec.dims_m.w} × ${rec.dims_m.d} m on the floor`);
        }
      }
    }
  }

  if (world !== undefined) findings.push(...crossCheckWorld(plan, world, byId));
  return findings;
}

/**
 * planWarnings(plan, records?) -> strings that are true of this plan and do
 * not block it. Printed by the CLI and by the bake, and carried into the
 * projection report, so nothing here can be true and unseen.
 */
export function planWarnings(plan, records, world) {
  const out = [];
  if (!isObj(plan) || !Array.isArray(plan.rooms)) return out;
  const byId = new Map(plan.rooms.map((r) => [r.id, r]));

  /* A location the world names that the plan has not drawn. Not an error —
   * see crossCheckWorld — but it is a room with no geometry, so it renders as
   * unestablished grid and nothing in the plan can check anything about it. */
  if (isObj(world)) {
    for (const loc of world.locations || []) {
      if (!byId.has(loc.id)) out.push(`world location "${loc.id}" has no room in the plan — it has no plan geometry, and every exit touching it is outside what the plan can check`);
    }
  }

  /* Law (b), the half that cannot block: a facing claims a wall, and the
   * plan's bands cover only part of the view. Every room, not only the
   * outdoor ones — the blocking check asks for at least one band on the line,
   * so a wall covering a tenth of the view passes it, and that is as true of
   * an interior facing as of a garden one. */
  for (const r of plan.rooms) {
    if (!isObj(r.facings)) continue;
    for (const f of FACINGS) {
      const fc = r.facings[f];
      if (!isObj(fc) || fc.type === "open" || !isNum(fc.wall_line)) continue;
      const gaps = gapsOnWallLine(plan, r, f, fc.wall_line, ALL_WALL_KINDS);
      if (gaps.length) {
        out.push(`law (b): "${r.id}" facing ${f} is typed ${fc.type}, but ${gaps.map(([a, b]) => `${fmt(b - a)} m`).join(" + ")} of its ${fc.wall_width_m} m view has no wall across it (gap${gaps.length > 1 ? "s" : ""} at ${gaps.map(([a, b]) => `${fmt(a)}–${fmt(b)}`).join(", ")}). The derived meta carries the built segments rather than one invented wall; the facing's type is Kabe's to rule.`);
      }
    }
  }

  /* The check that did not run. Plan-only validation is legitimate (§4b item
   * 2's host emits geometry with no world beside it) but it is weaker, and the
   * weakening has to be visible rather than inferred from a shorter list. */
  /* [Row 21] And the same sentence for the objects a supplied world does not
   * name: the plan draws furniture, this world stages none of it, so those
   * footprints went unjudged. Saying how many is what keeps "unavailable" from
   * reading as "checked". */
  if ((plan.objects || []).length && records && isObj(world)) {
    const held = new Set((world.entities || []).map((e) => e.id));
    const orphans = plan.objects.filter((o) => !held.has(o.id));
    if (orphans.length) {
      out.push(`${orphans.length} object footprint(s) — ${orphans.map((o) => o.id).join(", ")} — were NOT cross-checked against their §6 dims: the world beside this plan names no such entity, so the plan draws furniture this world does not stage`);
    }
  }
  if ((plan.objects || []).length && !records) {
    out.push(`${plan.objects.length} object footprint(s) were NOT cross-checked against their §6 dims — no records were supplied, which is the plan-only case; run with a world beside the plan for the full check`);
  }

  /* Objects standing in things WAS a set of warnings here. Row 11 promoted it
   * to a hard clause in validatePlan (`plan.object_clear_of_carriers` and
   * `plan.objects_do_not_share_floor`), because a warning nobody had to act on
   * is how the study's desk came to sit 91% inside its own hearth for two
   * rows, on the facing row 4 generates first. A warning is for something a
   * human approved and an agent may not change; furniture an agent placed is
   * not that.
   */

  /* THE FACINGS THAT SHOW NO ROOM, enumerated rather than left to be found in
   * a picture. Under a pinned lens a facing whose wall is wider than the frame
   * holds shows neither corner, and one nearer than the nearest visible floor
   * shows no floor line — the cross passage's two long views are both, and
   * nothing can be staged on them at any depth. A warning rather than a
   * finding: the rooms' metres are on the drawing a human approved, so this is
   * a consequence of them for him to rule on, not a defect in this document.
   * It exists because hiding two flat walls inside a green suite is exactly
   * what a warning is for. */
  for (const room of plan.rooms || []) {
    if (!room.facings) continue;
    for (const f of FACINGS) {
      if (!room.facings[f]) continue;
      const sh = facingShows(plan, room, f);
      if (!sh.corner && !sh.floor_line && !sh.ceiling_line) {
        const fc = room.facings[f];
        out.push(`room "${room.id}" facing ${f} shows no corner, no wall-floor line and no wall-ceiling line — a ${fc.wall_width_m} m wall seen from ${fc.camera_wall_m ?? fc.camera_far_m} m at the ruled lens is a wall in your face, and nothing can be staged on it at any depth`);
      }
    }
  }

  /* [Row 15] A STANDPOINT INSIDE A FLIGHT, WHERE A HUMAN CAN READ IT.
   *
   * Row 20 computed these — four of the manor's standpoints stand in a stair
   * flight, on the approved drawing, so they are reported rather than moved —
   * and hung the list on a PROPERTY of `validatePlan`, which nothing read: not
   * the bake, not a spec, not a batch. A warning nobody prints is not
   * "reported", and this row is the one that makes it matter, because a flight
   * is drawn now and the viewer is standing in it.
   *
   * Recomputed here rather than read off that property, because a property set
   * by the last call is a fact about call order. */
  for (const room of plan.rooms || []) {
    if (!room.facings) continue;
    for (const f of FACINGS) {
      const fc = room.facings[f];
      if (!fc || !fc.standpoint) continue;
      for (const st of plan.stairs || []) {
        if (!(st.joins || []).includes(room.id) || !rectOk(st.rect)) continue;
        const p2 = fc.standpoint;
        if (p2.x >= st.rect.x0 - EPS && p2.x <= st.rect.x1 + EPS &&
            p2.y >= st.rect.y0 - EPS && p2.y <= st.rect.y1 + EPS) {
          /* THE SENTENCE MUST MATCH THE PICTURE. This used to end "and the
           * picture draws the flight around them". It does not, and never did:
           * a standpoint inside a flight puts the whole run at and behind the
           * eye except for the tread underfoot, which is within a hand's
           * breadth of the camera and below the frame. A document claiming a
           * drawing that is not there is the row's own quality running
           * backwards, and it was aimed at the reader of the bake log. */
          out.push(`room "${room.id}" facing ${f}: its standpoint (${p2.x}, ${p2.y}) stands ON the "${st.id}" flight — the drawing puts the viewer partway up a staircase, so the flight lies at and behind the eye and THIS FACING DRAWS NO FLIGHT: the only part in front of you is the tread under your feet, nearer than a hand's breadth and below the frame. It is on the approved sheet, so it is reported rather than moved`);
        }
      }
    }
  }

  /* [Row 15] THE `+` JUNCTION GUARD, MANOR-WIDE.
   *
   * Row 20 built it from Kabe's own verbatim symptom — *"the demo first room
   * looks like every direction is a corridor….. Like a + shape"* — and pinned
   * it over the eight facings the demo world renders. This row makes eighty
   * more render, so the guard runs over all of them: the share of the frame
   * taken by side-wall RETURN rather than by the wall you are facing, and no
   * facing of a room that is not a corridor may show more of the first than of
   * the second.
   *
   * A WARNING, on this document's own precedent. Eight facings of the approved
   * manor exceed it — the garden room's and the closet chamber's flanks at
   * 64 %, the entrance court's at 61 %, the privy garden's at 76 % — and every
   * one is a narrow room viewed along its long axis from a standpoint the
   * approved drawing places. A validator that refused them would refuse the
   * plan Kabe signed; one that could not see them is why nobody would ever
   * find them. The facing's type is his to rule, exactly as law (b)'s warning
   * above says of the entrance approach. */
  for (const room of plan.rooms || []) {
    if (!room.facings) continue;
    for (const f of FACINGS) {
      const fc = room.facings[f];
      if (!fc || fc.type === "corridor" || fc.type === "open") continue;
      if (!(fc.wall_width_m > 0)) continue;
      const d = fc.camera_wall_m ?? fc.camera_far_m;
      if (!(d > 0)) continue;
      const wallPx = fc.wall_width_m * groundplane.FOCAL_PX / d;
      const share = 1 - Math.min(1, wallPx / PLAN_CANVAS_W);
      if (share > 0.5) {
        out.push(`room "${room.id}" facing ${f} is typed ${fc.type} and shows ${(share * 100).toFixed(0)} % side wall against ${(100 - share * 100).toFixed(0)} % facing wall — its ${fc.wall_width_m} m wall seen from ${d} m fills less than half the frame, which is the "+ junction" reading Kabe named; the facing's type is his to rule`);
      }
    }
  }

  /* [Row 19] AND THE FACINGS AN OBJECT IS EXCLUDED FROM because the viewer
   * stands level with it. `facingsContaining` is §4b item 9's own primitive —
   * "an object belongs to every facing whose view contains it" — and it drops
   * a facing whose camera stands at or in front of the object's own baseline,
   * because there is no projection there to derive an angle or a scale from.
   * An exclusion nobody prints is a hole; this is where it is printed. */
  for (const o of plan.objects || []) {
    const room = byId.get(o.room);
    if (!room || !room.facings || !rectOk(o.footprint)) continue;
    /* EVERY FACING THE PROJECTION REFUSES, not the subset this file used to
       recompute for itself. The `across`/`along` gates were the reason four of
       the six shipped refusals were never printed: an object OUTSIDE the
       standpoint-to-wall band is still an object `projectPlacement` throws on,
       and the throw was the only place it was said. */
    const level = [], atEye = [];
    for (const f of FACINGS) {
      const fc = room.facings[f];
      if (!fc) continue;
      const fault = projectionFault(fc, f, o.footprint);
      if (fault === "at_or_behind") level.push(f);
      else if (fault === "at_the_eye") atEye.push(f);
    }
    if (level.length) {
      out.push(`object "${o.id}": the ${o.room} viewer stands level with it on ${level.join(", ")} — its own ground edge is at or behind those cameras, so it belongs to no picture from them and §4b item 9's variant manifest does not enumerate them`);
    }
    if (atEye.length) {
      out.push(`object "${o.id}": the ${o.room} viewer stands within ${MIN_STANDOFF_M} m of it on ${atEye.join(", ")} — its projection is finite and positive and still not a picture of it (a 1 m object at 0.1 m draws 10,240 px/m on a 1,536 px canvas), so §4b item 9's variant manifest does not enumerate those facings either`);
    }
  }

  /* A hearth with no flue rising through the floor above it. */
  for (const f of plan.floors || []) {
    const above = (plan.floors || []).find((g) => g.level === f.level + 1);
    if (!above) continue;
    for (const fire of (plan.fireplaces || []).filter((x) => x.floor === f.id)) {
      if (!rectOk(fire.rect)) continue;
      if (!(plan.fireplaces || []).some((g) => g.floor === above.id && rectOk(g.rect) && overlapArea(g.rect, fire.rect) > 0)) {
        out.push(`the hearth in "${fire.room}" has no stack rising through "${above.id}" above it`);
      }
    }
  }
  return out;
}

/* ---- 8. the world cross-check ------------------------------------------
 * Blueprint §3's orientation law was prose until this row: nothing checked
 * that the hall actually lies east of the study in any geometric sense. It
 * does now — exit.facing is the facing on which the room sees the opening,
 * read off the opening's own normal.
 *
 * `world.json` stays the home of topology TRUTH; the plan is presentation-
 * side and holds the geometry. This check is what binds them, and it is
 * one-directional on purpose at M0: every location the world names must be a
 * plan room, but the plan holds twenty more rooms the world has not grown
 * into yet (row 15). */
function crossCheckWorld(plan, world, byId) {
  const out = [];
  if (!isObj(world) || !Array.isArray(world.locations)) return ["world.json: no locations to cross-check against the plan"];
  const openingsByEntity = new Map();
  for (const o of plan.openings) if (o && o.entity) openingsByEntity.set(o.entity, o);
  /* [Row 15] AND BY THE PLAN'S OWN NAME FOR THE HOLE. Exactly one of the
   * manor's twenty-six openings carries an `entity` — the study's `door1` —
   * so a world that may only address a leaf can walk through one of them. The
   * alternative, writing an `entity` onto the other twenty-five, moves the
   * drawn digest of the drawing Kabe approved and demands a human redline for
   * a change no human asked for. An entity wins over an id where both would
   * match, because a leaf governs the hole it stands in;
   * `groundplane.openingFor` is the same order on the renderer's side. */
  const openingsById = new Map();
  for (const o of plan.openings) if (o && o.id) openingsById.set(o.id, o);
  /* Row 12's own row text: "stairs as exits". A stair is addressed by its own
   * id — it carries no leaf entity — and its travel directions ARE the
   * orientation law's, so the check is the stair's `up`/`down` rather than a
   * wall normal. */
  const stairsById = new Map();
  for (const st of plan.stairs || []) if (st && st.id) stairsById.set(st.id, st);
  for (const loc of world.locations) {
    const room = byId.get(loc.id);
    /* A location the plan has not drawn is not an error: `world.json` is the
     * home of topology truth, the plan is presentation-side, and §4b item 3's
     * materialization ladder has a conjured room arriving as grid before any
     * geometry exists for it. It is a warning (planWarnings), and every exit
     * touching it is simply outside what the plan can speak about. */
    if (!room) continue;
    for (const f of loc.facings || []) {
      if (!room.facings || !room.facings[f]) {
        out.push(`plan/world: location "${loc.id}" declares facing ${f}, which the plan room does not carry`);
      }
    }
    for (const exit of loc.exits || []) {
      if (!byId.has(exit.from) || !byId.has(exit.to)) continue;   // not the plan's to judge
      const stair = stairsById.get(exit.via);
      if (stair) {
        const joins = [...stair.joins].sort().join("|");
        if (joins !== [exit.from, exit.to].sort().join("|")) {
          out.push(`plan/world: exit "${exit.id}" goes ${exit.from} → ${exit.to}, but stair "${stair.id}" joins ${stair.joins.join(" ↔ ")}`);
        } else {
          const want = stair.joins[0] === exit.from ? stair.up : stair.down;
          if (exit.facing !== want) {
            out.push(`plan/world: exit "${exit.id}" is staged on facing ${exit.facing}, but the "${stair.id}" flight travels ${want} out of "${exit.from}"`);
          }
        }
        if (exit.arrive_facing !== exit.facing) {
          out.push(`plan/world: exit "${exit.id}" leaves facing ${exit.facing} and arrives facing ${exit.arrive_facing} — blueprint §3: you arrive facing the way you went`);
        }
        continue;
      }
      const op = openingsByEntity.get(exit.via) || openingsById.get(exit.via);
      if (!op) {
        out.push(`plan/world: exit "${exit.id}" travels via "${exit.via}", which is neither a plan opening's entity, a plan opening, nor a stair`);
        continue;
      }
      const joins = [...op.joins].sort().join("|");
      const want = [exit.from, exit.to].sort().join("|");
      if (joins !== want) {
        out.push(`plan/world: exit "${exit.id}" goes ${exit.from} → ${exit.to}, but opening "${op.id}" joins ${op.joins.join(" ↔ ")}`);
      }
      const dir = facingOfOpening(plan, op, exit.from);
      if (dir === null) {
        out.push(`plan/world: exit "${exit.id}" leaves "${exit.from}", which does not abut opening "${op.id}"`);
      } else if (exit.facing !== dir) {
        out.push(`plan/world: exit "${exit.id}" is staged on facing ${exit.facing}, but "${exit.from}" sees "${op.id}" on its ${dir} wall`);
      }
      if (exit.arrive_facing !== exit.facing) {
        out.push(`plan/world: exit "${exit.id}" leaves facing ${exit.facing} and arrives facing ${exit.arrive_facing} — blueprint §3: you arrive facing the way you went. (A future exit whose fiction demands a turn is a new-row decision that reopens this check; the schema names no such field yet.)`);
      }
    }
  }
  return out;
}

/* ---- small geometry helpers -------------------------------------------- */
function polygonEdges(pts) {
  if (!Array.isArray(pts) || pts.length < 3) return null;
  const edges = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    if (!Array.isArray(p) || !isNum(p[0]) || !isNum(p[1])) return null;
    if (!Array.isArray(q) || !isNum(q[0]) || !isNum(q[1])) return null;
    if (Math.abs(p[0] - q[0]) > EPS && Math.abs(p[1] - q[1]) > EPS) return null; // not axis-aligned
    edges.push([p, q]);
  }
  return edges;
}
function polygonArea(pts) {
  const edges = polygonEdges(pts);
  if (!edges) return null;
  let a = 0;
  for (const [p, q] of edges) a += p[0] * q[1] - q[0] * p[1];
  return Math.abs(a) / 2;
}
/** Area counted twice by axis-aligned rects that overlap — the exterior bands
 * cross at every corner of the building, so the gross-area arithmetic has to
 * subtract those crossings once. */
function pairwiseOverlap(rects) {
  let a = 0;
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) a += overlapArea(rects[i], rects[j]);
  }
  return a;
}

/* ---- CLI wrapper -------------------------------------------------------- */
const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) {
  const args = process.argv.slice(2);
  const i = args.indexOf("--fixture-dir");
  const fixtureDir = i !== -1 && args[i + 1] ? resolve(args[i + 1]) : join(ROOT, "fixtures", "demo-study");
  const planPath = join(fixtureDir, "plan.json");
  const worldPath = join(fixtureDir, "world.json");
  if (!existsSync(planPath)) {
    console.error(`validate-plan: no plan.json in ${fixtureDir}`);
    process.exit(1);
  }
  let plan, world;
  try {
    plan = JSON.parse(readFileSync(planPath, "utf8"));
  } catch (e) {
    console.error(`validate-plan: ${planPath} does not parse (${e.message})`);
    process.exit(1);
  }
  if (existsSync(worldPath) && !args.includes("--no-world")) {
    try {
      world = JSON.parse(readFileSync(worldPath, "utf8"));
    } catch (e) {
      console.error(`validate-plan: ${worldPath} does not parse (${e.message})`);
      process.exit(1);
    }
  }
  /* §6 records, keyed by ENTITY id the way the renderer resolves them — the
   * plan names entities, the library names sprites, and world.json is the map
   * between them. Without records the footprint↔dims cross-check cannot run,
   * and validatePlan says so rather than passing quietly. */
  let records;
  try {
    const { createRequire } = await import("node:module");
    const bySprite = createRequire(import.meta.url)("../src/placeholders.js").records;
    /* No world means no entity→sprite map, so there are no records to resolve
     * — and `records` stays undefined rather than becoming an empty object
     * that every lookup misses. An empty map is "I looked and found nothing",
     * which would report four missing records; undefined is "the check cannot
     * run here", which is the truth of the plan-only case. */
    if (world) {
      records = {};
      for (const e of world.entities || []) if (bySprite[e.sprite]) records[e.id] = bySprite[e.sprite];
    }
  } catch (e) {
    console.error(`validate-plan: cannot load records from src/placeholders.js (${e.message})`);
    process.exit(1);
  }
  const findings = validatePlan(plan, world, records);
  for (const w of planWarnings(plan, records, world)) console.error(`warning: ${w}`);
  if (findings.length > 0) {
    findings.forEach((f, n) => console.error(`${n + 1}. ${f}`));
    console.error(`validate-plan: ${findings.length} finding(s) in ${planPath}`);
    process.exit(1);
  }
  console.log(`validate-plan: ${planPath} valid`);
}
