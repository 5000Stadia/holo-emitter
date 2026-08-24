/**
 * The frame's own geometry, and the language row 34 recommends for asking for it.
 *
 * ONE HOME FOR THE RECIPE. `manorPrompt` dispatches this to the manor and
 * `evolution-arms.mjs`'s `g4` was measured on it, and they are the same function
 * rather than two copies that agree today. That matters more here than
 * anywhere: `g4` is the arm the recommendation rests on, its prompts are
 * committed on disk, and `evolution.spec.mjs` compares those committed prompts
 * against what the composer returns now. So if production ever drifts from what
 * was actually measured, that comparison goes red and the drift becomes a
 * decision somebody takes rather than a thing that happened.
 *
 * WHAT THE RECOMMENDATION IS, AND ITS STANDING [AWAITING KABE]. Row 34 spent 68
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
 * note, so it is here. It proceeds as the standing recipe under the Captain's
 * no-wait directive with his review asynchronous; the row does not close until
 * the production test reports.
 *
 * WHAT IS DELIBERATELY NOT CLAIMED: that this is better than what it replaces.
 * It did not separate. Nothing did. The honest summary is that it is the best
 * available judgment on a null result, and the plan says so in those words.
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

/**
 * ROW 34'S RECOMMENDED REGISTER, whole: the finished picture described in
 * image-frame terms, with the coordinates attached. This is `g4`.
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
