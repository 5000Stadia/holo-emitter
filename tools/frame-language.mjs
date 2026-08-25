/**
 * The frame's own geometry, and the two registers this project has asked it in.
 *
 * WHICH ONE PRODUCTION SENDS [row 43, ruled 2026-08-25]. `g5` WITHOUT the
 * coordinate appendix, and it is the only register `manorPrompt` composes.
 * `g5Prompt(ctx, { appendix: false })` is that one path; the register trial
 * scored the clean order admissible 4/5 against `g4`'s 3/5 and passed the
 * camera gate 5/5 against `g4`'s 2/5, with the materials right on every arm and
 * no style image attached (`design/batches/g5-register/REPORT.md`, and the
 * ruling in `design/approvals.log`). Neither number separated at n=1 a wall, as
 * the trial declared before it ran; what the row acted on is a labelled
 * judgment in the open, exactly as row 34's was.
 *
 * WHAT `g4` IS NOW. The declared CONTROL arm, and nothing else — `registerBlock`
 * below, composed for the harness by `make-scaffold.mjs`'s `g4ManorPrompt` and
 * dispatched by no emitter. It stays because the next natural batch measures the
 * incumbent against the new register rather than taking this ruling on faith,
 * and because row 34's committed prompts are the evidence its own
 * recommendation rests on: `evolution.spec.mjs` holds `g4ManorPrompt`'s register
 * against those archived prompts case by case, so the control cannot drift away
 * from what was actually measured without going red.
 *
 * ONE HOME FOR BOTH RECIPES, which is why they are in one file. A register the
 * emitter composes and a register the harness measures cannot be two copies
 * that agree today.
 *
 * WHAT ROW 34's RECOMMENDATION WAS, AND ITS STANDING. Row 34 spent 68
 * declared rolls over three generations and separated NOTHING — the best Fisher
 * p in the whole row is 0.243 against Holm steps of 0.017 to 0.033. What it has
 * is a labelled judgment, made in the open, argued in `design/specs/34-plan.md`
 * §9a from the table: `g4` ties the best measured admissible rate (3 of 4), is
 * the only tied cell that loses to the reference on NEITHER probe wall, improves
 * the horizon error over the reference (13.0 px against 19.0), and is the only
 * arm carrying both of the two things three generations produced any direction
 * on at all —
 *
 *    the finished picture described in image-frame terms, AND the figures.
 *
 * Both halves are load-bearing and each was earned by something failing.
 * Stripping the figures out entirely (`g3`) was the one clear loss of the
 * ablation: 2 of 4, the worst horizon error, and one probe wall where no
 * horizon could be fitted at all. Piling MORE figures on (`v2A`, a junction
 * table and a metre grid) dropped 3 of 4 to 1 of 4. Both ends of that dial are
 * worse than the middle, and this is the middle.
 *
 * Production law clause 6 puts the correction in the emitter rather than in a
 * note, so it is here.
 *
 * WHAT IS DELIBERATELY NOT CLAIMED, of `g4` then and of `g5` now: that either
 * is better than what it replaced. Neither separated. Both are the best
 * available judgment on a null result, and both say so in those words.
 */
import { createRequire } from "node:module";

const require_ = createRequire(import.meta.url);
const groundplane = require_("../src/groundplane.js");

export const CANVAS_W = 1536;
export const CANVAS_H = 1024;

const r0 = (x) => Math.round(x);
export const col = (x) => `column ${r0(x)}`;
export const row = (y) => `row ${r0(y)}`;

/* ------------------------------------------------------------------ */
/* The geometry, read the way the renderer draws it                    */
/* ------------------------------------------------------------------ */

/**
 * Where a junction line leaves the picture: the first frame edge it meets,
 * travelling from its corner AWAY from the vanishing point.
 *
 * `drawGrid` traces the same two cases by hand — "through the bottom edge on a
 * narrow room, through the side edge on a wide one" — and the general form is
 * here so a wall of any width names a point that is actually IN the picture. A
 * painter cannot put ink at row 1178.
 */
export function frameExit(from, toward) {
  const dx = from.x - toward.x, dy = from.y - toward.y;
  let best = null;
  const cands = [];
  if (dx !== 0) {
    cands.push({ t: (0 - from.x) / dx, x: 0, y: null });
    cands.push({ t: (CANVAS_W - from.x) / dx, x: CANVAS_W, y: null });
  }
  if (dy !== 0) {
    cands.push({ t: (0 - from.y) / dy, x: null, y: 0 });
    cands.push({ t: (CANVAS_H - from.y) / dy, x: null, y: CANVAS_H });
  }
  for (const c of cands) {
    if (!(c.t > 0)) continue;
    const p = { x: c.x === null ? from.x + c.t * dx : c.x,
                y: c.y === null ? from.y + c.t * dy : c.y };
    if (p.x < -0.001 || p.x > CANVAS_W + 0.001) continue;
    if (p.y < -0.001 || p.y > CANVAS_H + 0.001) continue;
    if (best === null || c.t < best.t) best = { t: c.t, p };
  }
  return best ? best.p : null;
}

function intersect(a, b, c, d) {
  const d1x = b.x - a.x, d1y = b.y - a.y, d2x = d.x - c.x, d2y = d.y - c.y;
  const den = d1x * d2y - d1y * d2x;
  const t = ((c.x - a.x) * d2y - (c.y - a.y) * d2x) / den;
  return { x: a.x + t * d1x, y: a.y + t * d1y };
}

/**
 * The four junctions, the two corners and the three rows — every quantity the
 * language below states, computed once.
 *
 * `toRaw` is the renderer's own unclipped endpoint (`xAtScale` at the bottom
 * scale for a floor junction, at the ceiling scale for a ceiling junction);
 * `to` is where that line leaves the frame, which is what a prompt may name.
 */
export function frameGeometry(meta) {
  const floorY = meta.floor_line_y * meta.image_h_px;
  const horizonY = meta.horizon_y * meta.image_h_px;
  const storey = meta.storey_height_m;
  const ceilY = storey > 0 ? floorY - storey * meta.px_per_m_at_wall : null;
  const bounded = groundplane.hasCorners(meta);
  const cL = bounded ? meta.corner_x0_px : null;
  const cR = bounded ? meta.corner_x1_px : null;
  const sB = meta.px_per_m_at_bottom;
  const sC = Math.max(sB, storey > 0 ? (CANVAS_H + 2) / storey : sB);
  const yC = storey > 0 ? groundplane.yAtScale(sC, meta) - storey * sC : null;
  const mk = (u, cx) => {
    if (cx === null) return null;
    const xb = groundplane.xAtScale(u, sB, meta, CANVAS_W);
    const xc = groundplane.xAtScale(u, sC, meta, CANVAS_W);
    const floor = { from: { x: cx, y: floorY }, toRaw: { x: xb, y: CANVAS_H } };
    floor.to = frameExit(floor.from, { x: 2 * cx - xb, y: 2 * floorY - CANVAS_H });
    const out = { floor };
    if (ceilY !== null) {
      const ceiling = { from: { x: cx, y: ceilY }, toRaw: { x: xc, y: yC } };
      ceiling.to = frameExit(ceiling.from, { x: 2 * cx - xc, y: 2 * ceilY - yC });
      out.ceiling = ceiling;
    }
    return out;
  };
  return {
    floorY, ceilY, horizonY, cL, cR, bounded,
    px_per_m: meta.px_per_m_at_wall,
    wall_width_m: meta.wall_width_m,
    storey_height_m: storey,
    corner_span_px: bounded ? cR - cL : null,
    left: mk(0, cL), right: mk(1, cR)
  };
}

/**
 * The single vanishing point of a level, square-on camera.
 *
 * NOT ASSUMED TO BE THE FRAME CENTRE — it is the intersection of the two
 * junction lines `drawGrid` actually draws. On every facing measured so far it
 * comes out at `wallCentrePx` on the horizon row, and deriving it rather than
 * typing it is what makes a future off-centre wall correct instead of quietly
 * wrong.
 */
export function vanishingPoint(meta) {
  const g = frameGeometry(meta);
  if (!g.bounded) {
    return { x: groundplane.wallCentrePx(meta, CANVAS_W), y: g.horizonY };
  }
  const a = g.left.ceiling, b = g.left.floor;
  if (!a) return { x: groundplane.wallCentrePx(meta, CANVAS_W), y: g.horizonY };
  return intersect(a.from, a.toRaw, b.from, b.toRaw);
}

/** Which frame edge a point sits on, in the words a viewer would use. */
export function edgeName(p) {
  if (p.x <= 0.5) return "the left edge";
  if (p.x >= CANVAS_W - 0.5) return "the right edge";
  if (p.y <= 0.5) return "the top edge";
  return "the bottom edge";
}

/* ------------------------------------------------------------------ */
/* The language                                                        */
/* ------------------------------------------------------------------ */
/* `ctx` is the small shape both callers already have: `{ geometry, meta,
 * voice, surface, room_name }`. The voice decides only WORDS — a garden has
 * ground where a study has a floor, and row 29's veto is that naming interior
 * fabric on an outdoor wall is a defect even when the geometry is identical. */

const words = (ctx) => ({
  out: !!(ctx.voice && ctx.voice.outdoor),
  GROUND: (ctx.voice && ctx.voice.outdoor) ? "ground" : "floor",
  SURFACE: ctx.surface || "wall"
});

/** The opening: what kind of picture this is, in image-frame terms. */
export function openingLines(ctx) {
  const { out, GROUND, SURFACE } = words(ctx);
  if (out) {
    return [
      `Composition/framing: a ${CANVAS_W} by ${CANVAS_H} landscape picture, looking straight out`,
      `  across the ${ctx.room_name} with the ground running away from you into the distance. The`,
      `  ${GROUND} is visible and reaches the bottom of the picture, and the sky is overhead.`
    ];
  }
  /* THE INTERIOR WORDING IS FROZEN, and deliberately generic where the sections
   * above it already name the room. It is the wording `g4` was measured on, and
   * `evolution.spec.mjs` compares the committed generation-3 prompts against
   * what this returns — so changing a word here is a decision, not an edit. */
  return [
    `Composition/framing: a ${CANVAS_W} by ${CANVAS_H} landscape picture, looking straight at one ${SURFACE} of`,
    `  the room with the two side ${SURFACE}s running away from you to left and right. The ${SURFACE} you`,
    `  face shows its whole width, and the ${GROUND} is visible and reaches the bottom of the`,
    "  picture."
  ];
}

/**
 * The four junctions as what the FINISHED PICTURE looks like — which way each
 * line leans, which edge it leaves through, and where the eye is told they
 * would meet. No camera operation, no measurement, no jargon.
 *
 * The direction words are derived from the endpoints rather than written per
 * wall, so a facing whose returns leave through a different edge says the true
 * thing about itself.
 */
export function appearanceLines(ctx) {
  const g = ctx.geometry;
  const { GROUND } = words(ctx);
  const L = [];
  if (!g.bounded) {
    L.push("  Everything that runs away from you in this view — the edges underfoot, any wall or");
    L.push("    hedge running back — leans toward one place as it goes: the middle of the picture's");
    L.push(`    width, a little above its half-height, at about the eye level of someone standing on`);
    L.push(`    the ${GROUND} you can see.`);
    return L;
  }
  let named = 0;
  for (const [side, s] of [["left-hand", g.left], ["right-hand", g.right]]) {
    for (const [what, j, surface] of [["ceiling", s && s.ceiling, "overhead"],
      ["floor", s && s.floor, "underfoot"]]) {
      if (!j || !j.to) continue;
      named++;
      const rises = j.to.y < j.from.y;
      L.push(`  The line where the ${side} side wall meets the surface ${surface} is straight ` +
        `and unbroken. Coming`);
      L.push(`    toward you from that wall's corner it ${rises ? "climbs" : "drops"}, and it ` +
        `leaves the picture through ${edgeName(j.to)}.`);
    }
  }
  if (!named) {
    /* BOUNDED BUT NOTHING TO DESCRIBE. A wall much wider than the frame has
     * corners far outside it and no junction that leaves the picture inside its
     * own bounds, so there is no line to say "climbs" or "drops" about. It still
     * has an eye line, and that is the half the promotion instrument reads — so
     * it gets the unbounded sentence rather than nothing at all. The first
     * outdoor retry emitted after the fold lost this whole paragraph. */
    L.push("  Everything that runs away from you in this view leans toward one place as it goes:");
    L.push("    the middle of the picture's width, a little above its half-height, at about the eye");
    L.push(`    level of someone standing on the ${GROUND} you can see.`);
    return L;
  }
  const HOW = ["", "that line", "both of those lines", "all three of those lines",
    "all four of those lines"];
  L.push(`  Carry ${HOW[named]} the other way instead, back into the distance, and they`);
  L.push("    converge on a single place: the middle of the picture's width, a little above its");
  L.push(`    half-height, at about the eye level of someone standing on the ${GROUND} you can see.`);
  return L;
}

/** The same thing again as figures — the half `g3`'s failure proved load-bearing. */
export function coordinateLines(ctx, { lead = "The same lines, as picture coordinates" } = {}) {
  const g = ctx.geometry;
  const vp = vanishingPoint(ctx.meta);
  const { GROUND, SURFACE } = words(ctx);
  const faced = words(ctx).out ? "the view ahead" : `the faced ${SURFACE}`;
  const L = [];
  L.push(`  ${lead} — column counted from the left edge,`);
  L.push("    row counted from the top:");
  L.push(`    The faced ${SURFACE} meets the ${GROUND} along a level line at ${row(g.floorY)}.`);
  if (g.ceilY !== null) {
    L.push(`    It meets the surface overhead along a level line at ${row(g.ceilY)}.`);
  }
  if (g.bounded) {
    /* A COLUMN OUTSIDE THE PICTURE IS NOT AN INSTRUCTION. `privy_garden/S` is a
     * wall far wider than the frame, and the first fold told a painter to stand
     * its upright edges at column -1280 and column 2816 — coordinates no ink can
     * occupy. Where an edge is off-frame the picture is told what is true of it
     * instead: the surface runs past the side of the frame. */
    const inFrame = (x) => x >= 0 && x <= CANVAS_W;
    if (inFrame(g.cL) && inFrame(g.cR)) {
      L.push(`    Its two upright edges stand at ${col(g.cL)} and ${col(g.cR)}.`);
    } else if (inFrame(g.cL)) {
      L.push(`    Its left upright edge stands at ${col(g.cL)}; it runs past the right side of the`);
      L.push("      picture without its other edge coming into view.");
    } else if (inFrame(g.cR)) {
      L.push(`    Its right upright edge stands at ${col(g.cR)}; it runs past the left side of the`);
      L.push("      picture without its other edge coming into view.");
    } else {
      L.push("    It runs past both sides of the picture: neither of its upright edges is in view,");
      L.push("      and it fills the whole width of the frame.");
    }
    /* A JUNCTION WHOSE EXIT IS NULL IS NOT NAMED, and that is a real case on the
     * manor rather than a defensive nicety: `frameExit` returns null where the
     * line does not leave the frame inside its own bounds, which happens on
     * facings whose corners overrun the picture. Neither probe wall could reach
     * it, so the first manor facing after the fold crashed on it. What is
     * printed is the junctions this frame actually has, and the count below is
     * counted rather than assumed — "all four" on a picture showing two would be
     * an instruction to draw something that is not there. */
    let named = 0;
    for (const [side, s] of [["left", g.left], ["right", g.right]]) {
      if (s && s.ceiling && s.ceiling.to) {
        L.push(`    The ${side} side wall's upper line runs from ${col(s.ceiling.from.x)}, ` +
          `${row(s.ceiling.from.y)} to ${col(s.ceiling.to.x)}, ${row(s.ceiling.to.y)}.`);
        named++;
      }
      if (s && s.floor && s.floor.to) {
        L.push(`    The ${side} side wall's lower line runs from ${col(s.floor.from.x)}, ` +
          `${row(s.floor.from.y)} to ${col(s.floor.to.x)}, ${row(s.floor.to.y)}.`);
        named++;
      }
    }
    const HOW_MANY = ["", "that one", "both of those", "all three of those", "all four of those"];
    if (named) {
      L.push(`    Carried on, ${HOW_MANY[named]} meet at ${col(vp.x)}, ${row(vp.y)}.`);
    } else {
      L.push(`    Lines running away from you converge at ${col(vp.x)}, ${row(vp.y)} — that row is`);
      L.push("      the viewer's eye line.");
    }
    L.push(`    One metre of ${faced} covers ${r0(g.px_per_m)} columns.`);
  } else {
    /* AN OPEN FACING HAS NO CORNERS AND NO RETURNS, so it can state no junction
     * — but it must still state the eye-line row, which is the one quantity the
     * promotion instrument reads and the omission row 32 was allocated for. */
    L.push(`    Lines running away from you converge at ${col(vp.x)}, ${row(vp.y)} — that row is`);
    L.push("      the viewer's eye line.");
    L.push(`    One metre at the far plane covers ${r0(g.px_per_m)} columns.`);
  }
  return L;
}

/* ------------------------------------------------------------------ */
/* The flight                                                          */
/* ------------------------------------------------------------------ */
/**
 * A staircase, asked for in the register the rest of this file is written in.
 *
 * WHY IT EXISTS. `promote-backdrop.mjs` refuses to promote a facing whose room
 * draws a flight the painting has none of — the row-32 clause — and six manor
 * walls snapped geometrically clean and were refused by it. Every one of them
 * was painted from a prompt that never mentioned a staircase, because until now
 * the emitter's carrier language covered doors, windows and fireplaces and
 * nothing else: `plan.stairs` reached the renderer, the validator and the
 * refusal, and stopped short of the ask. That is production law clause 6 read
 * backwards — the gate knew something the generation method did not — so the
 * fix is here, in the emitter, derived from the plan for every wall forever.
 *
 * WHAT BELONGS TO WHOM. The flight's MATERIAL is the room's voice
 * (`tools/room-voices.mjs`: the great stair is oak with turned balusters, the
 * back stair plain scrubbed treads) and not one word of it is said here. What
 * is said here is the flight's GEOMETRY as the finished picture holds it —
 * where it stands in the frame, how wide, which way it climbs, how much of it
 * the frame kept — plus the two standing constraints a way through the building
 * always carries:
 *
 *   1. A RISING FLIGHT NEEDS THE SPACE OVER IT. The renderer cuts the surface
 *      overhead to the flight's own footprint lifted a storey (`well_poly`), so
 *      a painting that closes that hole is painting a stair into a low box.
 *   2. WHAT LIES BEYOND IT IS UNLIT — the same rule the door sentence carries,
 *      and for the same two reasons: the promotion instrument reads a way
 *      through as a VOID, and the renderer composites the destination into it,
 *      so painted light back there fights the through-view.
 *
 * `ctx.flights` is `flightsForFacing`'s output, which is also what the scaffold
 * stamps its FLIGHT box from — one projection, two readers.
 */
const CLIMB_WORDS = {
  left: ["climbing toward the left of the picture",
    "so the flight reads as a stair going up to the left"],
  right: ["climbing toward the right of the picture",
    "so the flight reads as a stair going up to the right"],
  away: ["climbing away from you into the picture",
    "the steps further up standing narrower and closer together than the near ones"],
  toward: ["climbing toward you out of the picture",
    "the steps further up standing wider and further apart than the ones behind them"]
};

/* [row 39] THE SAME SENTENCE, READ BACK OFF A SPENT PROMPT.
 *
 * `tools/promote-backdrop.mjs` attaches a flight to a promoted meta only from
 * a candidate whose own ask named one, and the question it asks of the spent
 * prompt is answered HERE rather than by a second pattern living next to the
 * promotion — one rule read in two directions, exactly as `INTERIOR_FABRIC` in
 * `tools/room-voices.mjs` serves both the emitter's refusal and
 * `vista.indoor_ask`. Written against the opener `flightLines` composes
 * immediately below, so the two cannot drift: `flight.spec.mjs` asserts the
 * handshake by putting this emitter's own output back through this predicate.
 */
export const FLIGHT_ASK =
  /^Stairs: (?:a flight of stairs stands|\d+ flights of stairs stand) in this view\b/m;

/** Did the ask this candidate was painted from name a staircase in the view? */
export function askNamesAFlight(text) {
  return FLIGHT_ASK.test(String(text == null ? "" : text));
}

export function flightLines(ctx) {
  const flights = ctx.flights || [];
  if (!flights.length) return [];
  const { GROUND } = words(ctx);
  const L = [];
  const many = flights.length > 1;
  L.push(`Stairs: ${many ? `${flights.length} flights of stairs stand` : "a flight of stairs stands"} in this view, ` +
    `and ${many ? "they are" : "it is"} part of the architecture rather than furniture — ` +
    `${many ? "they are" : "it is"} built into this ${GROUND === "ground" ? "place" : "room"} and cannot be left out of the picture.`);
  for (const s of flights) {
    const lead = many ? `  The ${s.direction === "up" ? "rising" : "descending"} flight: ` : "  It is ";
    L.push(`${lead}a straight stair of ${s.treads} steps, ${s.width_m.toFixed(2)} m wide, ` +
      (s.direction === "up"
        ? `carrying a person ${s.rise_m.toFixed(2)} m up to the storey above.`
        : `dropping ${s.rise_m.toFixed(2)} m to the storey below.`));
    if (s.treads_in_view > 0) {
      const [how, tail] = CLIMB_WORDS[s.climb];
      L.push(`    ${s.treads_in_view} of its steps are in the picture. The front edge of each step reads as a`);
      L.push(`    level line across the width of the flight, and those lines stack one above the next,`);
      L.push(`    ${how}, ${tail}.`);
      /* [Kabe, 2026-08-24: stair_landing/N "shows stairs going up on the left"
       * where the plan's flight goes DOWN] "dropping" alone did not hold: the
       * painter drew a rising flight. A descending flight seen from its head
       * is stated as what it is — nothing above this floor. */
      if (s.direction === "down") {
        L.push(`    This flight goes DOWN from the ${GROUND} you stand on: its top step is level with this ${GROUND}`);
        L.push(`    and every other step is BELOW it. No step of it rises above this ${GROUND}, and no`);
        L.push(`    staircase climbs upward anywhere in this picture.`);
      }
    } else {
      /* A FLIGHT CAN BE PRESENT AS NOTHING BUT ITS HOLE. Two of the manor's
       * facings look across a stairwell whose every tread is below the frame,
       * and telling a painter to draw steps there would be asking for a
       * staircase the geometry does not put in the picture. */
      L.push("    None of its steps are in the picture: it falls away below the bottom edge. What this");
      L.push(`    view shows of it is the opening in the ${GROUND} it drops through.`);
    }
    /* THE FIGURES, which is the half of `g4` the ablation proved load-bearing. */
    L.push("    Where it stands, as picture coordinates — column counted from the left edge, row");
    L.push(`    counted from the top: what is in view of it fills columns ${r0(s.x)} to ${r0(s.x + s.w)}`);
    L.push(`    and rows ${r0(s.y)} to ${r0(s.y + s.h)}.`);
    if (s.runs_off.length) {
      L.push(`    The flight runs on past the ${listWords(s.runs_off)} edge${s.runs_off.length > 1 ? "s" : ""} of the picture:`);
      L.push("      what is drawn is the part of it the frame holds, cut by the frame and not stopped short.");
    }
    if (s.direction === "up" && (s.well_poly || []).length) {
      L.push("    The surface overhead is open where the flight climbs through it. There is a stairwell");
      L.push("      cut in it directly over the flight, and nothing is drawn closing that opening.");
    }
    /* THE UNLIT RULE, said in the flight's own terms. Word for word the door
     * sentence's constraint (`CARRIER_SENTENCE.door`), because it is the same
     * constraint: a way through the building, painted with a lit space behind
     * it, is unmeasurable by the promotion instrument and fights the
     * through-view the renderer composites into it. */
    L.push(s.direction === "up"
      ? "    The space the flight climbs into, beyond its topmost step, is deep unlit shadow — no lit"
      : "    The space the flight drops into, beyond its lowest step, is deep unlit shadow — no lit");
    L.push("      room there, no visible far wall, and no light source beyond the end of the stair.");
  }
  return L;
}

/** "left, top and bottom" — the plain English list, so a prompt never says
 *  "left,top,bottom" at a painter. */
function listWords(xs) {
  if (xs.length === 1) return xs[0];
  return xs.slice(0, -1).join(", ") + " and " + xs[xs.length - 1];
}

/**
 * ROW 34'S RECOMMENDED REGISTER, whole: the finished picture described in
 * image-frame terms, with the coordinates attached. This is `g4`.
 *
 * [row 43] IT IS THE DECLARED CONTROL ARM AND NO EMITTER COMPOSES IT. Production
 * dispatches `g5Prompt(..., { appendix: false })` and nothing else; this block
 * is reached only through `make-scaffold.mjs`'s `g4ManorPrompt`, which
 * `ARMS["g4-production"]` is and which the suite holds against row 34's
 * archived prompts.
 */
export function registerBlock(ctx) {
  return openingLines(ctx)
    .concat(appearanceLines(ctx))
    .concat(coordinateLines(ctx));
}

/**
 * The no-lettering rule, positively.
 *
 * The line this replaces was a comma-separated list of things not to draw, and
 * it was both of the shapes the model-specific research warns about at once: a
 * tag-style enumeration, and a suppression that invites SEMANTIC DISPLACEMENT —
 * the forbidden text re-expressing itself as objects in the picture. This names
 * the surfaces that normally carry writing and gives each a positive
 * substitute, and it leans on "only", which the community's worked example puts
 * the most weight on. Negation is fine on this model for exclusions, so the one
 * short imperative at the end stays.
 */
/* IT NAMES MATERIALS, NEVER FABRIC, and that is row 29's veto applied to a rule.
 * The first version of this said "the panelling shows only plain wood" — which
 * puts panelling in front of the generator on a scullery wall that has none, and
 * is the exact defect Kabe walked into ("is every room in this house parlor
 * walls?"). `room-voices.spec` caught it on the service rooms the moment the
 * fold landed. Wood, plaster, stone and glazing are materials any room in this
 * house may have; `panelling`, `wainscot` and `chair-rail` are a VOICE's, and
 * only the voice may say them. */
export const POSITIVE_NO_TEXT = [
  "  Every surface here is plain and unlettered. Wood is left plain, plaster is left plain, stone",
  "  is left plain and the glazing is plain. This picture carries only the room itself. Do not",
  "  invent additional typography."
];

/** The outdoor form: same rule, and not one word of interior fabric in it —
 *  row 29's veto is a clause, and it applies to a rule as much as to a wall. */
export const POSITIVE_NO_TEXT_OUTDOORS = [
  "  Every surface here is plain and unlettered. Brick is left plain, stone is left plain, render",
  "  is left plain and the glazing is plain. This picture carries only the place itself. Do not",
  "  invent additional typography."
];

export function positiveNoText(ctx) {
  return words(ctx).out ? POSITIVE_NO_TEXT_OUTDOORS : POSITIVE_NO_TEXT;
}

/* ================================================================== */
/* g5 — THE CLEAN REGISTER                                             */
/* ================================================================== */
/* [HUMAN, 2026-08-24, verbatim, reading
 * `backdrops/source/master_bedchamber-N/row23-b2fa7b28.prompt.txt`]:
 * "That prompt seems like a mess too…."
 *
 * WHAT THE MESS WAS. Not the register `g4` recommends — the ORDER around it,
 * and the repetition. That prompt opens with two paragraphs about what the two
 * attached images are and are not; states the room's materials three times
 * (in the correction, in `Materials/textures`, and again inside the carrier
 * sentences); states the same four junction lines twice, as appearance and
 * again as figures; and puts the materials — the thing the painter gets wrong
 * most often, and the thing every one of row 40's nine re-asks was about —
 * forty lines of geometry below the top.
 *
 * SO g5 IS AN ORDER, NOT A NEW VOCABULARY. Every ruled fact `manorPrompt`
 * states is still stated, once, in the order Kabe ruled it:
 *
 *   1. THE ROOM in one breath — room, wall, materials, period, the anchor.
 *   2. WHAT IS ON THIS WALL — the carriers, ruled, positioned in words.
 *   3. THE PICTURE — the finished frame in words, and one line handing the
 *      lines themselves to the layout image.
 *   4. MEDIUM — one line.
 *   5. NOTHING ELSE — two lines.
 *   APPENDIX — the coordinate block, last. IT IS NOT IN PRODUCTION [row 43].
 *      It was kept into the trial because row 34's generation-3 ablation lost
 *      without figures (`g3`: 2 of 4 against `g4`'s 3 of 4, the worst horizon
 *      error in the generation, and one probe wall where no horizon could be
 *      fitted at all), and Kabe's standing rule — "test my direction against
 *      our tests as well" — is why it ran as its own arm instead of being
 *      argued about. It then lost the argument it was given: the register trial
 *      scored `g5-noappendix` 4/5 admissible and 5/5 on the camera gate against
 *      `g5`'s 3/5 and 4/5, so production law clause 5 applies to it as
 *      apparatus and it is removed from the ask. The code stays as the `g5`
 *      arm's, because the arm is what a later batch re-measures the question
 *      with.
 *
 * THE FIGURES IN THE APPENDIX ARE `g4`'s OWN, to the byte: `g5AppendixLines`
 * calls `coordinateLines` and replaces nothing but its two lead lines. That is
 * what makes `g5` against `g5-noappendix` a clean single-factor ablation, and
 * `g5` against `g4` a test of the ORDER rather than of the numbers.
 *
 * WHAT g5 NEEDS THAT `g4` DID NOT. The register now carries the room, so the
 * ctx it composes against carries the room's own facts as well as its geometry:
 * `fabric` (the voice's wall paragraph, already resolved for openings and open
 * sides), `voice.ceiling` / `voice.floor`, `anchor_sentence`, `rects`,
 * `flights`, `side`, and `style` — the Image-1 decision below.
 * `tools/evolution-arms.mjs`'s `makeCtx` fills every one of them, and nothing
 * in this file reads a file or knows what a voice is.
 *
 * [HUMAN, 2026-08-24, verbatim]: "So why do we give it the reference image of
 * the study? I think it biases it too much. I mean I know why that window with
 * the botched insignias is every window generated for example." — RULING: Image
 * 1 is never a wall from another room; a room's own agreeing majority wall when
 * one exists, else no style image and the medium in words. So the layout image
 * is NOT always Image 2 in this register: where the ruling leaves us no style
 * image it is Image 1, and every sentence that names it prints the index it
 * actually has. Saying "Image 2" beside a single attached picture would be
 * telling the painter about one that is not there.
 */

/** The layout image's own index in the attach order — 2 behind a style image,
 *  1 when the ruling leaves us none.
 *
 *  ONE RULE, TWO READERS. `tools/edge-seed.mjs` numbers the attach list in
 *  PACKET.md off the same arithmetic (`scaffoldImageIndex`), and every edge
 *  strip is numbered from this index upward, so the prompt and the attach list
 *  cannot disagree about which picture is which. A seat told to attach the
 *  layout diagram as Image 2 in a packet whose prompt calls it Image 1 has been
 *  handed two instructions. */
export function scaffoldIndex(ctx) {
  return ctx.style ? 2 : 1;
}

export function scaffoldImage(ctx) {
  return `Image ${scaffoldIndex(ctx)}`;
}

/** Where a carrier sits across the faced surface, in the words a viewer would
 *  use. Derived from the box centre against the corner span, so a carrier that
 *  moves in the plan describes itself correctly without a hand.
 *
 *  [Kabe] "between the two windows" is his own example, and it is the one
 *  relation worth more than a fraction: on a wall whose two windows flank a
 *  fireplace it locates the fireplace exactly and "at the centre" does not. */
export function positionPhrase(rect, g, rects = []) {
  const mid = (r) => (r.x0 + r.x1) / 2;
  const wins = rects.filter((r) => r.kind === "window");
  if (rect.kind !== "window" && wins.length === 2) {
    const a = mid(wins[0]), b = mid(wins[1]), m = mid(rect);
    if (m > Math.min(a, b) && m < Math.max(a, b)) return "between the two windows";
  }
  if (!g.bounded || g.cR === g.cL) return "in this view";
  const u = (mid(rect) - g.cL) / (g.cR - g.cL);
  if (u < 0.2) return "at the far left";
  if (u < 0.4) return "left of centre";
  if (u <= 0.6) return "at the centre";
  if (u <= 0.8) return "right of centre";
  return "at the far right";
}

const N_WORD = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight"];
const nWord = (n) => N_WORD[n] || String(n);

/** Carriers of one kind, grouped by their RULED width, in order along the wall.
 *  Two doorways of the same width are ONE clause with two places, which is what
 *  stops the register saying an identical sentence twice — the defect row 29
 *  named and `whichWords` was written for.
 *
 *  AND NO TWO OF THEM ARE GIVEN THE SAME PLACE. `positionPhrase`'s vocabulary
 *  has five buckets across the corner span, and a wall carrying more carriers
 *  than that — `long_gallery/W`'s four windows, `entrance_court/N`'s six —
 *  collides: two openings both land "at the far right", which is one
 *  instruction wearing two hats and is exactly the defect row 29 found on
 *  `great_hall/W`'s two doorways. Where the places collide the whole kind falls
 *  back to its position in the rank, which cannot collide because it is derived
 *  from the order itself. */
const ORDINAL = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth",
  "ninth", "tenth"];

function widthGroups(rects, kind, g, all) {
  const mine = rects.filter((x) => x.kind === kind);
  const mid = (r) => (r.x0 + r.x1) / 2;
  let places = mine.map((r) => positionPhrase(r, g, all));
  if (new Set(places).size !== places.length) {
    const order = [...mine].sort((a, b) => mid(a) - mid(b));
    places = mine.map((r) => {
      const i = order.indexOf(r);
      return `${ORDINAL[i] || `${i + 1}th`} from the left`;
    });
  }
  const groups = [];
  mine.forEach((r, i) => {
    const w = r.to_m - r.from_m;
    const key = w.toFixed(2);
    const found = groups.find((x) => x.key === key);
    if (found) found.at.push(places[i]);
    else groups.push({ key, width_m: w, at: [places[i]] });
  });
  return groups;
}

/* ---- item 1: the room, in one breath ---- */

/**
 * A re-ask's ONE sentence, at the top of item 1.
 *
 * [Kabe] "corrections (re-asks) go as ONE sentence at the top of item 1,
 * stating the ruled fact, not the measurement's prose." Production carries
 * `consistencySentence`'s four-clause paragraph, which ends "Measured: this
 * room's ceiling splits EW against NS with NO majority (worst pair D=4.474)" —
 * a number about US, in front of a painter who cannot act on it, and a full
 * restatement of the materials the very next sentence gives. So the correction
 * is one imperative and the ruling is not repeated: the ruled fact IS item 1.
 */
export function g5CorrectionSentence(ctx) {
  const { GROUND, SURFACE } = words(ctx);
  return `This is a repaint of one ${SURFACE} of a room that must read as ONE room: paint the ` +
    "materials named below on every surface in this view and nothing else — not a different wall " +
    `lining, not a different surface overhead, not a different ${GROUND}.`;
}

export function g5RoomLines(ctx) {
  const { out } = words(ctx);
  const SURFACE = ctx.surface || "wall";
  const L = [];
  const paint = `Paint the ${ctx.side} ${SURFACE} of the ${ctx.room_name} of a circa-1660 ` +
    "English manor.";
  /* [row 43] THE MEASURED CORRECTION, ONE PHYSICAL LINE, AT THE TOP OF ITEM 1.
   *
   * A re-ask carries the sentence `run-state.json` holds about THIS wall —
   * verbatim, because it is the measurement's own words and the reason the ask
   * exists — and `manorPrompt` is what decides whether those words can be said
   * on this facing at all (an outdoor wall whose correction names interior
   * fabric carries the forward half instead; see `carryableOutdoors`). Nothing
   * about that rule is re-decided here: the composer prints the sentence it is
   * handed, at column zero where a reader and `prompt_lint.py` both find it.
   *
   * `ctx.reask` with no sentence is the OTHER kind of re-ask — the row-40
   * forced ruling, whose correction is the ruled fact rather than a
   * measurement, and `g5CorrectionSentence` is that fact in one imperative. */
  if (ctx.correction) {
    L.push(`Correction on a previous attempt at this exact wall: ${ctx.correction}`);
    L.push(`Primary request: ${paint}`);
  } else if (ctx.reask) {
    L.push(`Primary request: ${g5CorrectionSentence(ctx)}`);
    L.push(`  ${paint}`);
  } else {
    L.push(`Primary request: ${paint}`);
  }
  /* THE FABRIC IS SAID ONCE. Where the facing's own carrier sentence is the
   * fabric — an open side is the ABSENCE of a wall, stated with its ruled width
   * in item 2 — item 1 does not say it a second time. That repetition is half of
   * what Kabe was reading when he called the production prompt a mess. */
  if (out) {
    if (!ctx.fabric_in_carriers) L.push(`  This side is ${ctx.fabric}.`);
    L.push(`  Underfoot: ${ctx.voice.floor}. Overhead is open sky with weather in it, and daylight ` +
      "falls from it onto everything in frame.");
  } else {
    L.push(`  Its walls are ${ctx.fabric}.`);
    L.push(`  Overhead: ${ctx.voice.ceiling}. Underfoot: ${ctx.voice.floor}.`);
  }
  L.push(`  ${ctx.anchor_sentence}`);
  return L;
}

/* ---- item 2: what is on this wall ---- */

export function g5WallLines(ctx) {
  const g = ctx.geometry;
  const { out, GROUND } = words(ctx);
  const SURFACE = ctx.surface || "wall";
  const rects = ctx.rects || [];
  const L = [];
  const body = [];

  const openSide = rects.find((r) => r.kind === "open_edge");
  if (openSide) {
    const w = openSide.to_m - openSide.from_m;
    body.push("there is no wall here at all. It is open across its full " +
      `${w.toFixed(2)} m width, with no wall, gate, parapet, railing or hedge across any part of ` +
      `it, and this place's own ${GROUND} runs straight out through it and continues as the same ` +
      `${GROUND} beyond, to the far horizon under open sky`);
  }

  for (const kind of ["fireplace", "door"]) {
    const groups = widthGroups(rects, kind, g, rects);
    if (!groups.length) continue;
    const total = groups.reduce((n, x) => n + x.at.length, 0);
    for (const grp of groups) {
      const n = grp.at.length;
      const where = listWords(grp.at);
      if (kind === "fireplace") {
        body.push(n > 1
          ? `${nWord(n)} stone fireplaces stand ${where}, each with a firebox opening exactly ` +
            `0.90 m wide and a stone breast exactly ${grp.width_m.toFixed(2)} m wide`
          : `the stone fireplace stands ${where}, its firebox opening exactly 0.90 m wide and its ` +
            `stone breast exactly ${grp.width_m.toFixed(2)} m wide`);
      } else {
        body.push(n > 1
          ? `${nWord(n)} door openings stand ${where}, each exactly ${grp.width_m.toFixed(2)} m ` +
            "wide and exactly 2.00 m high at the wall plane"
          : `the door opening stands ${where}, exactly ${grp.width_m.toFixed(2)} m wide and ` +
            "exactly 2.00 m high at the wall plane");
      }
    }
    if (kind === "door") {
      /* THE UNLIT RULE, SAID ONCE FOR EVERY DOORWAY ON THE WALL. The promotion
       * instrument reads a way through as a VOID and the renderer composites
       * the destination room into it, so painted light back there fights the
       * through-view (row 27, library/S). `great_hall/W` carries two doorways
       * and production says this whole clause twice. */
      body.push(`${total > 1 ? "every one of those openings stands" : "it stands"} empty with no ` +
        "leaf hung in it, and the space beyond it is deep unlit shadow — no lit room, no visible " +
        "far wall and no light source behind it");
    }
  }

  const wins = widthGroups(rects, "window", g, rects);
  for (const grp of wins) {
    const n = grp.at.length;
    const lights = ctx.window_lights ? ctx.window_lights(grp.width_m) : null;
    const mull = lights ? lights - 1 : 0;
    /* THE DRESSING ROUND THE OPENING IS A STATUS MARKER IN 1660 and it is where
     * a room's rank shows in its glazing — a state room's windows hooded by a
     * moulded label mould, a service room's in a plain chamfer. It is the clause
     * that keeps two walls of equal bay count in different rooms from reading
     * identically, and it is the room's, so it arrives through `ctx` from
     * `room-voices.mjs` rather than being decided here. */
    body.push(`${n > 1 ? `${nWord(n)} window openings stand` : "one window opening stands"} ` +
      `${listWords(grp.at)}, ${n > 1 ? "each " : ""}exactly ${grp.width_m.toFixed(2)} m wide, the ` +
      `sill 0.90 m and the head 2.00 m above the ${GROUND}` +
      (ctx.window_surround ? `, set ${ctx.window_surround}` : "") +
      (lights ? `, divided by ${nWord(mull)} stone mullion${mull === 1 ? "" : "s"} into ` +
        `${nWord(lights)} equal upright light${lights === 1 ? "" : "s"}` : "") +
      (ctx.window_transom && ctx.window_transom(grp.width_m)
        ? `, and crossed by a single stone transom, the only transom on this ${SURFACE}`
        : ""));
  }

  if (!rects.length) {
    /* [row 40] A BLANK FACING IS TOLD NO SECOND FABRIC. What stood here was
     * `voice.blank` — a fabric sentence written per voice and reached only by a
     * facing carrying no carrier, so a blank wall of the great hall was told
     * panelling in item 1 and wainscot here while its carrier-bearing
     * neighbours were told only panelling. That is row 40's disease exactly: a
     * per-FACING property deciding a per-ROOM one. The blankness now points at
     * the one fabric sentence every facing of the room shares, and it names
     * neither a material nor the anchor's own word — `material-origin.spec`
     * reads this line and refuses any fabric vocabulary in it that the room's
     * own material sentences do not carry. */
    body.push(`nothing stands on it: this ${SURFACE} carries no opening and no built feature at ` +
      "all. The fabric named above runs across the whole of it, unbroken corner to corner, and " +
      "the anchor named above is the one ruled feature in it");
  }
  /* [Kabe] "No window" WHEN NONE — said, and said once, because a wall that
   * does not say it gets one painted into it. */
  if (!wins.length) {
    body.push(`there is no window: this ${SURFACE} carries no glazed opening of any kind`);
  }

  /* One clause per line: the painter reads a list of the things that are there
   * rather than a paragraph to unpick. */
  body.forEach((s, i) => L.push(i === 0
    ? `On this ${SURFACE}: ${s}.`
    : `  ${s.charAt(0).toUpperCase()}${s.slice(1)}.`));

  if (wins.length) {
    /* WHICH LIGHT OPENS, once for the whole wall. Derived from where each
     * opening sits along it, in `room-voices.mjs` where the rule lives, so the
     * incumbent register and this one cannot hang the same casement on two
     * different sides. */
    if (ctx.window_casement) L.push(`  ${ctx.window_casement}`);
    /* THE HERALDRY RATION, at column zero where its voice is entitled to it,
     * because `prompt_lint.py`'s clause reads `^armorial glass:` and a gate
     * that cannot see the line cannot hold it. [HUMAN] "this same window
     * everywhere? With the ensignias on it?" */
    if (ctx.armorial_line) L.push(ctx.armorial_line);
    else {
      L.push("  The glass is plain diamond quarrels of faintly greenish crown glass in lead cames: " +
        "no coloured glass, no painted or stained glass, and no armorial shield, crest, badge or " +
        `monogram anywhere on this ${SURFACE}.`);
    }
  }
  return L;
}

/* ---- item 2b: the flight, shortened ---- */
/**
 * The flight, in the clean register.
 *
 * SHORTENED, NOT DROPPED, AND THE OPENER IS EXACT. `promote-backdrop.mjs`
 * attaches a flight to a promoted meta only from a candidate whose own ask
 * named one, and the question it asks of the spent prompt is `FLIGHT_ASK` —
 * this file's own regex, a few dozen lines above. So the first line here
 * matches it to the character. A register that read better and quietly took a
 * live gate down would not be an improvement.
 *
 * What moves out is the figure block: where the flight stands in columns and
 * rows now rides in the appendix with every other coordinate, which is what the
 * appendix is for.
 */
export function g5FlightLines(ctx) {
  const flights = ctx.flights || [];
  if (!flights.length) return [];
  const { GROUND } = words(ctx);
  const many = flights.length > 1;
  const L = [];
  L.push(`Stairs: ${many ? `${flights.length} flights of stairs stand` : "a flight of stairs stands"} ` +
    `in this view, and ${many ? "they are" : "it is"} part of the architecture rather than furniture.`);
  for (const s of flights) {
    const lead = many ? `  The ${s.direction === "up" ? "rising" : "descending"} flight is ` : "  It is ";
    L.push(`${lead}a straight stair of ${s.treads} steps, ${s.width_m.toFixed(2)} m wide, ` +
      (s.direction === "up"
        ? `carrying a person ${s.rise_m.toFixed(2)} m up to the storey above.`
        : `dropping ${s.rise_m.toFixed(2)} m to the storey below.`));
    if (s.treads_in_view > 0) {
      const [how] = CLIMB_WORDS[s.climb];
      L.push(`    ${s.treads_in_view} of its steps are in the picture: the front edge of each reads ` +
        "as a level line across the width of the flight, and those lines stack one above the next, " +
        `${how}.`);
      if (s.direction === "down") {
        L.push(`    This flight goes DOWN from the ${GROUND} you stand on. Its top step is level ` +
          `with this ${GROUND} and every other step is below it, and no staircase climbs upward ` +
          "anywhere in this picture.");
      }
    } else {
      L.push("    None of its steps are in the picture: it falls away below the bottom edge, and " +
        `what this view shows of it is the opening in the ${GROUND} it drops through.`);
    }
    if (s.runs_off && s.runs_off.length) {
      L.push(`    It runs on past the ${listWords(s.runs_off)} edge${s.runs_off.length > 1 ? "s" : ""} ` +
        "of the picture: draw the part the frame holds, cut by the frame and not stopped short.");
    }
    if (s.direction === "up" && (s.well_poly || []).length) {
      L.push("    The surface overhead is open directly over it, and nothing is drawn closing that " +
        "stairwell.");
    }
    L.push(s.direction === "up"
      ? "    The space it climbs into, beyond its topmost step, is deep unlit shadow — no lit room,"
      : "    The space it drops into, beyond its lowest step, is deep unlit shadow — no lit room,");
    L.push("      no visible far wall and no light source beyond the end of the stair.");
  }
  return L;
}

/* ---- item 3: the picture ---- */

/** Which frame edges this facing's returns actually leave through, in words.
 *  Derived rather than assumed: a wall wider than the frame sends them out
 *  through the bottom, and telling a painter "the left and right edges" there
 *  would be an instruction to draw a line the picture does not hold. */
function exitEdges(g) {
  const seen = [];
  for (const s of [g.left, g.right]) {
    for (const j of [s && s.ceiling, s && s.floor]) {
      if (!j || !j.to) continue;
      const e = edgeName(j.to).replace(/^the /, "").replace(/ edge$/, "");
      if (!seen.includes(e)) seen.push(e);
    }
  }
  return seen;
}

/** "the left and right edges" — one article and one plural noun, so a picture
 *  whose returns leave through three edges still reads as English. */
function edgeWords(edges) {
  return `the ${listWords(edges)} edge${edges.length > 1 ? "s" : ""}`;
}

export function g5PictureLines(ctx) {
  const g = ctx.geometry;
  const { out, GROUND } = words(ctx);
  const SURFACE = ctx.surface || "wall";
  const edges = g.bounded ? exitEdges(g) : [];
  const L = [];
  L.push(`Composition/framing: a ${CANVAS_W} by ${CANVAS_H} landscape picture, seen from the eye of ` +
    `someone standing on the ${GROUND} in this ${out ? "place" : "room"}.`);
  if (edges.length) {
    /* [2026-08-25] "FILLS THE PICTURE'S WIDTH" WAS TAKEN LITERALLY. The first two
     * production returns under this register (servants_hall E and W) pushed the
     * wall's corners to the frame edges and failed the camera at +10 % and
     * +17 % focal — the one fact the retired coordinate block carried that the
     * words had dropped was WHERE THE CORNERS STAND. Said in words, from the
     * scaffold's own corner columns, never as pixel figures. */
    const m = ctx.meta || {};
    const fracWords = (f) => f < 0.045 ? "just inside" : f < 0.11 ? "about a tenth of the way in from"
      : f < 0.17 ? "about a seventh of the way in from" : f < 0.22 ? "about a fifth of the way in from"
      : f < 0.29 ? "about a quarter of the way in from" : f < 0.38 ? "about a third of the way in from"
      : "well inside";
    const fL = m.corner_x0_px != null ? m.corner_x0_px / CANVAS_W : null;
    const fR = m.corner_x1_px != null ? 1 - m.corner_x1_px / CANVAS_W : null;
    if (fL != null && fR != null) {
      L.push(`  The ${SURFACE} you face is square on and shows its whole width: its left corner stands ` +
        `${fracWords(fL)} the picture's left edge and its right corner ${fracWords(fR)} the right edge, ` +
        `and from each corner a side wall runs toward you and leaves the picture through ${edgeWords(edges)}.`);
    } else {
      L.push(`  The ${SURFACE} you face is square on and shows its whole width, and the two side ` +
        `walls run away from you to left and right and leave the picture through ${edgeWords(edges)}.`);
    }
    /* [2026-08-25] THE SCALE, IN WORDS. Four production returns under this
     * register drew the wall 10-17 % too large with the corners right: the
     * "one metre covers N columns" fact had no words. Said as a fraction of
     * the picture's width, from the scaffold's own ruler. */
    const ppm = m.px_per_m_at_wall;
    if (ppm > 0 && m.wall_width_m > 0) {
      const share = (m.wall_width_m * ppm) / CANVAS_W;
      const shareWords = share > 0.95 ? "almost the whole width of the picture" : share > 0.85 ? "about nine tenths of the picture's width"
        : share > 0.75 ? "about four fifths of the picture's width" : share > 0.65 ? "about seven tenths of the picture's width"
        : share > 0.55 ? "about three fifths of the picture's width" : "about half the picture's width";
      L.push(`  Seen from where you stand, the whole ${m.wall_width_m.toFixed(1)} m of the ${SURFACE} spans ${shareWords} — ` +
        `no closer and no larger than that; the ${SURFACE} does not crowd the frame.`);
    }
    L.push(`  The ${GROUND} is visible and reaches the bottom of the picture, and the eye line sits ` +
      "a little above the middle of the picture's height — that is where those receding lines would " +
      "meet if they were carried back into the distance.");
  } else {
    L.push(`  The view runs away from you into the distance, and the ${GROUND} is visible and ` +
      `reaches the bottom of the picture${out ? ", with the sky overhead" : ""}.`);
    L.push("  The eye line sits a little above the middle of the picture's height, and everything " +
      "running away from you leans toward one place on it, at the middle of the picture's width.");
  }
  /* THE ONE LINE THAT HANDS THE LINES THEMSELVES TO THE PICTURE. [Kabe] */
  L.push(`  ${scaffoldImage(ctx)} draws these lines exactly; follow it.`);
  /* [row 38] THE EDGE STRIPS, EACH ON ONE PHYSICAL LINE, NAMED BY INDEX AND BY
   * ROLE. They belong here and nowhere else in this register: an edge seed is a
   * statement about what the FINISHED PICTURE holds at its own edge, which is
   * what item 3 is. The sentence is `edge-seed.mjs`'s `roleSentence` — the
   * cookbook rule the row cites is that a reference image is named by index and
   * by role and the interaction is stated, and the pixels cannot say any of
   * that themselves.
   *
   * THE INDEX IS DERIVED, NEVER 3 BY HABIT. Row 38 wrote "Image 3" because
   * every packet then carried a style seed as Image 1 and the scaffold as Image
   * 2. Under row 40's ruling most packets carry no style image at all, so the
   * scaffold is Image 1 and the first strip is Image 2 — and a prompt naming an
   * Image 3 that is not in the packet is a reference the seat has to go and
   * invent. `g5CtxFor` renumbers every strip from `scaffoldIndex` before it
   * gets here, and `edge-seed.mjs` numbers the attach list the same way. */
  for (const s of ctx.seeds || []) L.push(`  ${s.role_sentence}`);
  return L;
}

/* ---- item 4: the medium ---- */

export function g5MediumLines(ctx) {
  /* [Kabe, 2026-08-24] THE ERA IS A LOOK, NOT ONLY A MATERIALS LIST. His own
   * working seed came from "Sherlock Holmes era office, high realism oil
   * painting" — an era named as a painting tradition — and his cold-ask test
   * with only the layout diagram attached came back as a flat modern render in
   * the DIAGRAM's dark grey, every period word lost to the one image in the
   * packet. So the medium names the tradition, and when no style image is
   * attached the diagram is told apart from the picture in one clause. */
  const L = ["Style/medium: a high-realism oil painting in the manner of a seventeenth-century " +
    "Dutch or English interior — fine tactile brush detail, deep warm browns, cool ambient " +
    "daylight and gentle natural falloff; a period painting, not a modern render."];
  if (!ctx.style) {
    /* [row 43(a)] THE DIAGRAM HAS NO COLOURS LEFT TO BORROW. This line used to
     * warn off "the layout diagram's flat dark colours", which was the honest
     * description of a sheet that HAD flat dark colours — and naming them is
     * itself a way of putting them in front of the painter. The sheet is ink on
     * paper now, and the clause says so: there is nothing in it to copy. */
    L.push(sheetOf(ctx) === "grid-v1"
      ? "  The layout diagram's flat dark colours are NOT the picture's colours: the picture is " +
        "this painting, in the materials named above."
      : "  The layout diagram is a black-and-white line drawing on paper and holds no colour " +
        "of its own: the picture is this painting, in the materials named above.");
  }
  if (ctx.style) {
    /* THE ONLY CLAUSE IN THE REGISTER ABOUT WHAT AN IMAGE IS NOT, and it is one
     * clause because one clause is what was ruled.
     *
     * [2026-08-25] AND IT NOW DESCRIBES THE PICTURE RATHER THAN ARGUING WITH IT.
     * What stood here was "Image 1 is the north wall of this same room, already
     * painted: match its paint handling, palette and light, and take nothing
     * else from it" — a clause that names a photograph of a wall and then asks
     * for half of it. `servants_hall/E`'s ask ruled a fireplace at the centre
     * and one three-light window left of it; the return came back with TWO
     * DOORWAYS and no window, which is what the room's other walls carry. The
     * clause was obeyed in its first half and ignored in its second, which is
     * how an image reference always behaves: it carries everything in it.
     *
     * So Image 1 is no longer that wall. `tools/style-seed.mjs` derives a
     * picture of it with every opening and carrier filled in from the wall's own
     * adjacent fabric, and this clause says what that picture is. The sentence
     * only has to be true, and `attachStyle` is what makes it true — where the
     * seed cannot be cut, no style image is attached and this clause is not
     * reached at all. */
    L.push(`  Image 1 shows this room's materials, palette and light on another of its walls, ` +
      "with its openings removed: match those, and take no architecture from it.");
  }
  return L;
}

/* ---- item 5: nothing else ---- */

/* [row 43(a)] THE ONE SENTENCE ABOUT WHAT THE LAYOUT IMAGE IS, and it says what
 * the image now IS rather than only what it is for. Two returns on 2026-08-25
 * earned the change: `master_bedchamber/N` was asked cold with only the
 * scaffold attached and came back a flat modern render in the DIAGRAM's dark
 * grey, and `servants_hall/E`'s retry-4 packet — one scaffold, two dashed boxes
 * labelled WINDOW and FIREPLACE, no Image 1 — came back with TWO DARK DOORWAYS
 * standing exactly where those two boxes stood. "Instructions rather than
 * things to paint" was true and was not enough: it never said what the marks
 * MEAN, so a dark rectangle went on meaning a hole and a dark ground went on
 * meaning a palette. The scaffold is ink on paper now
 * (`make-scaffold.mjs`'s `ink-on-paper-v2`) and this sentence is the words for
 * that sheet — the two halves move together, or the prompt is describing a
 * picture that is not in the packet. */
export const SCAFFOLD_IS_A_DRAWING =
  "is a line drawing in ink on paper: its lines are where surfaces meet and its outlined " +
  "boxes are where the named features stand; nothing in it is a colour, a material or an " +
  "opening to paint";

/* THE INCUMBENT'S WORDING, kept live for one reason: it is what every packet
 * dispatched before this row carried, and the `scaffold-ink` trial's control
 * arm has to be the ask that was actually sent — a prompt describing ink on
 * paper beside a dark grid frame is neither the incumbent nor the candidate. */
export const SCAFFOLD_IS_INSTRUCTIONS =
  "lines, boxes and lettering are instructions rather than things to paint";

/** Which sheet the layout image in this packet is drawn on. Absent means the
 *  sheet production now cuts; `grid-v1` is the control arm's. */
export const sheetOf = (ctx) => ctx.scaffold_sheet || "ink-on-paper-v2";

export function g5NothingElseLines(ctx) {
  const { out } = words(ctx);
  return [
    `Constraints: the ${ctx.room_name} is completely empty — no furniture, nobody in it, no ` +
      `animals and no loose props of any kind${out ? ", and nothing grown crosses the wall plane" : ""}.`,
    sheetOf(ctx) === "grid-v1"
      ? `  Every surface in it is plain and unlettered, and ${scaffoldImage(ctx)}'s ` +
        `${SCAFFOLD_IS_INSTRUCTIONS}.`
      : `  Every surface in it is plain and unlettered, and ${scaffoldImage(ctx)} ` +
        `${SCAFFOLD_IS_A_DRAWING}.`
  ];
}

/* ---- the appendix ---- */

/**
 * The coordinate block, last.
 *
 * NOT PRODUCTION [row 43]. It was kept into the register trial because
 * generation 3's `g3` — this same appearance register with the figures stripped
 * out — took 2 of 4 against `g4`'s 3 of 4, carried the worst horizon error in
 * the generation, and left one probe wall on which no horizon could be fitted at
 * all. That was the only direction three generations produced on the question,
 * so `g5-noappendix` asked it again of the new order and the answer came back
 * the other way: 4/5 admissible and 5/5 on the camera gate, against `g5`'s 3/5
 * and 4/5. `manorPrompt` passes `appendix: false`; this function is the `g5`
 * arm's alone, and it is how the next batch asks the question a third time.
 *
 * EVERY FIGURE IS `coordinateLines`'s, unchanged — only its two lead lines are
 * replaced. So the appendix and `g4`'s attached block are the same numbers in
 * the same words, and what the comparison moves is WHERE they sit.
 */
export function g5AppendixLines(ctx) {
  const L = [`Reference lines (from ${scaffoldImage(ctx)}): column counted from the left edge, ` +
    "row counted from the top."];
  for (const line of coordinateLines(ctx).slice(2)) L.push(line);
  for (const s of ctx.flights || []) {
    L.push(`    What is in view of the stair fills columns ${r0(s.x)} to ${r0(s.x + s.w)} and rows ` +
      `${r0(s.y)} to ${r0(s.y + s.h)}.`);
  }
  return L;
}

/* ---- the whole prompt ---- */

/**
 * `g5`, whole: the three header lines `prompt_lint.py` requires of every prompt
 * in this project, then Kabe's five items in his order, then the appendix.
 *
 * [row 43] PRODUCTION CALLS IT WITH `appendix: false`, and `manorPrompt` is the
 * only caller that composes an ask this project sends. The default stays `true`
 * because the `g5` ARM was declared and measured with the appendix, and an arm
 * whose meaning changes with a default is an arm that cannot be re-run.
 *
 * THE HEADER LINES ARE NOT AN ITEM AND ARE NOT DECORATION. `Gate anchor:` is
 * what makes the picture measurable at all — hall/N and hall/S came back
 * WITHHELD twice for the want of it — and `Use case:` is where an exterior
 * facing declares its side of the door, which is Kabe's garden veto as a
 * mechanical clause. Row 34's `v4` made the same call for the same reason:
 * suspending a live gate to make an arm tidier would be measuring a prompt this
 * project would never send.
 */
export function g5Prompt(ctx, { appendix = true } = {}) {
  const { out } = words(ctx);
  const L = [];
  L.push(`Use case: historical-scene, ${out ? "exterior" : "interior"}`);
  L.push(`Asset type: gameplay backdrop for the ${ctx.side} ${ctx.surface} of the ${ctx.room_name}, ` +
    "circa-1660 English manor");
  L.push(`Gate anchor: ${ctx.anchor.line}, 0.95 m.`);
  for (const l of g5RoomLines(ctx)) L.push(l);
  for (const l of g5WallLines(ctx)) L.push(l);
  for (const l of g5FlightLines(ctx)) L.push(l);
  for (const l of g5PictureLines(ctx)) L.push(l);
  for (const l of g5MediumLines(ctx)) L.push(l);
  for (const l of g5NothingElseLines(ctx)) L.push(l);
  if (appendix) for (const l of g5AppendixLines(ctx)) L.push(l);
  return L.join("\n") + "\n";
}
