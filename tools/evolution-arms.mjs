/**
 * Row 34 — the variant space of the breakout evolution run, as composer
 * functions.
 *
 * `design/specs/34-plan.md` §1 is the contract this file executes. Read that
 * first; what follows is the mechanism and the reasons a later reader cannot
 * get from the plan.
 *
 * THREE THINGS ABOUT THE SHAPE, AND ALL THREE ARE LOAD-BEARING.
 *
 * 1. AN ARM IS A TRANSFORMATION OF THE PRODUCTION PROMPT, NEVER A SECOND COPY
 *    OF IT. `manorPrompt` in `tools/make-scaffold.mjs` is what the manor run
 *    actually dispatches; every arm here parses its output into sections and
 *    edits the sections it is defined to edit. So the CONTROL is the identity
 *    transformation and is byte-identical to production by construction rather
 *    than by a test that has to notice a copy going stale — and every other arm
 *    carries the room's voice, its ruled carrier sentences and its constraints
 *    without this file knowing anything about voices at all.
 *
 * 2. EVERY NUMBER IS DERIVED, AND THE RENDERER IS ITS AUTHORITY. The exhaustive
 *    geometry and the verbal camera construction below quote the same
 *    quantities `src/renderer.js`'s `drawGrid` draws with — the corner columns
 *    and the floor and ceiling rows off the meta, and the two side-wall
 *    junctions through `groundplane.xAtScale` / `yAtScale`, which is how
 *    `drawGrid` computes them. Nothing here is typed and nothing is measured a
 *    second way. `evolution.spec.mjs` recomputes all of it independently.
 *
 * 3. THE ARMS ARE A FACTORIAL SKELETON, SO A WIN IS ATTRIBUTABLE. Each arm is a
 *    setting of three channels and §6 of the plan crosses those channels to
 *    make generation 2. An arm defined as a paragraph could not be recombined
 *    with anything; an arm defined as a channel triple can be, mechanically.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { deriveMeta, facingCarriers } from "./plan-projection.mjs";
import { scaffoldRects, manorPrompt, chairRail, brackets, assertLabelChars, rulerX, wallY }
  from "./make-scaffold.mjs";
import { voiceFor } from "./room-voices.mjs";

const require_ = createRequire(import.meta.url);
const groundplane = require_("../src/groundplane.js");
export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const CANVAS_W = 1536;
export const CANVAS_H = 1024;

const r0 = (x) => Math.round(x);
const r2 = (x) => Math.round(x * 100) / 100;

/* ------------------------------------------------------------------ */
/* The frame's own geometry, read the way the renderer draws it        */
/* ------------------------------------------------------------------ */

/**
 * The single vanishing point of a level, square-on camera.
 *
 * IT IS NOT ASSUMED TO BE THE FRAME CENTRE — it is the intersection of the two
 * junction lines `drawGrid` actually draws, computed here and asserted in the
 * suite. On both probe walls it comes out at column 768.0, row 526.1, which is
 * `wallCentrePx` on the horizon row; stating it as a derivation rather than as
 * a constant is what makes a future facing with an off-centre wall correct
 * instead of silently wrong.
 */
export function vanishingPoint(meta) {
  const g = frameGeometry(meta);
  const a = g.left.ceiling, b = g.left.floor;
  return intersect(a.from, a.toRaw, b.from, b.toRaw);
}

function intersect(a, b, c, d) {
  const d1x = b.x - a.x, d1y = b.y - a.y, d2x = d.x - c.x, d2y = d.y - c.y;
  const den = d1x * d2y - d1y * d2x;
  const t = ((c.x - a.x) * d2y - (c.y - a.y) * d2x) / den;
  return { x: a.x + t * d1x, y: a.y + t * d1y };
}

/**
 * Where a junction line leaves the picture: the first frame edge it meets,
 * travelling from its corner AWAY from the vanishing point.
 *
 * `drawGrid` traces the same two cases by hand — "through the bottom edge on a
 * narrow room (hall/E: x 390 at y 1024), through the side edge on a wide one" —
 * and the general form is here so a wall of any width says the true thing. The
 * prompt has to name a point that is IN the picture, because a painter cannot
 * put ink at row 1178.
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
    if (!(c.t > 0)) continue;                       // only away from the corner
    const p = { x: c.x === null ? from.x + c.t * dx : c.x,
                y: c.y === null ? from.y + c.t * dy : c.y };
    if (p.x < -0.001 || p.x > CANVAS_W + 0.001) continue;
    if (p.y < -0.001 || p.y > CANVAS_H + 0.001) continue;
    if (best === null || c.t < best.t) best = { t: c.t, p };
  }
  return best ? best.p : null;
}

/**
 * The four junctions, the two corners and the three horizontal rows — every
 * quantity the exhaustive text states, computed once.
 *
 * `toRaw` is the renderer's own unclipped endpoint (`xAtScale` at the bottom
 * scale for the floor junction, at the ceiling scale for the ceiling junction);
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
  /* drawGrid's own two scales: the floor junction leaves at the bottom-of-frame
   * scale, the ceiling junction at the scale that puts the ceiling plane a
   * frame-height away. Both quoted from it rather than re-derived. */
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

/* ------------------------------------------------------------------ */
/* The prompt as sections                                              */
/* ------------------------------------------------------------------ */
/* Every prompt in this project is `Key: value` at column zero with two-space
 * continuation lines under it — `manorPrompt` writes that shape and
 * `prompt_lint.py` reads it. Parsing it back is what lets an arm be defined as
 * "production, with this section replaced" rather than as a second prompt. */

const KEY = /^([A-Z][A-Za-z ,'-]*):/;

export function parseSections(text) {
  const out = [];
  for (const line of text.replace(/\n+$/, "").split("\n")) {
    const m = KEY.exec(line);
    if (m && !line.startsWith("  ")) out.push({ key: m[1], lines: [line] });
    else if (out.length) out[out.length - 1].lines.push(line);
    else out.push({ key: null, lines: [line] });
  }
  return out;
}

export function renderSections(sections) {
  return sections.map((s) => s.lines.join("\n")).join("\n") + "\n";
}

const at = (secs, key) => secs.findIndex((s) => s.key === key);

/** Replace a whole section's lines. Throws if the section is not there, because
 *  an arm that silently no-ops is an arm that ran as the control. */
function replaceSection(secs, key, lines) {
  const i = at(secs, key);
  if (i < 0) throw new Error(`evolution-arms: no \`${key}:\` section to replace`);
  secs[i] = { key, lines };
  return secs;
}

/** Drop a section entirely. Same refusal for the same reason. */
function dropSection(secs, key) {
  const i = at(secs, key);
  if (i < 0) throw new Error(`evolution-arms: no \`${key}:\` section to drop`);
  secs.splice(i, 1);
  return secs;
}

function insertAfter(secs, key, section) {
  const i = at(secs, key);
  if (i < 0) throw new Error(`evolution-arms: no \`${key}:\` section to insert after`);
  secs.splice(i + 1, 0, section);
  return secs;
}

/** Append continuation lines to an existing section. */
function appendTo(secs, key, lines) {
  const i = at(secs, key);
  if (i < 0) throw new Error(`evolution-arms: no \`${key}:\` section to append to`);
  secs[i].lines = secs[i].lines.concat(lines);
  return secs;
}

/** Substitute one exact line for another, anywhere. Refuses a miss. */
function substituteLine(secs, from, to) {
  for (const s of secs) {
    const i = s.lines.indexOf(from);
    if (i >= 0) { s.lines[i] = to; return secs; }
  }
  throw new Error(`evolution-arms: the line to substitute is not in the prompt:\n${from}`);
}

/* ------------------------------------------------------------------ */
/* The exhaustive blocks                                               */
/* ------------------------------------------------------------------ */

const col = (x) => `column ${r0(x)}`;
const row = (y) => `row ${r0(y)}`;

/**
 * The camera, constructed in words down to the row the returns converge on.
 *
 * THIS IS THE ROW'S OWN HYPOTHESIS, WRITTEN OUT. Kabe: "the exact words that
 * identify with precision the image in text form". The production prompt states
 * the convergence row in one sentence (row 32's addition, which promoted three
 * walls at once); this states the whole construction — the perspective kind,
 * the one vanishing point, both junction lines by their two endpoints, and what
 * the intersection means.
 */
export function cameraBlock(ctx, { lead = true } = {}) {
  const g = ctx.geometry;
  const vp = vanishingPoint(ctx.meta);
  const L = [];
  if (lead) {
    L.push("Camera and composition: 1536x1024 landscape, and the entire camera is constructed");
    L.push("  below in words. Follow the words and the picture is right.");
  }
  L.push("  The camera is level: zero upward tilt, zero downward tilt, zero roll. It stands");
  L.push("  square to the wall being painted, so that wall's own edges are exactly horizontal");
  L.push("  and exactly vertical in frame and only the two side walls recede.");
  L.push("  This is a frontal one-point perspective. There is exactly ONE vanishing point in");
  L.push(`  the picture and it lies at ${col(vp.x)}, ${row(vp.y)}.`);
  L.push("  Every line in the room that runs away from the viewer - both side walls where they");
  L.push("  meet the floor, both side walls where they meet the ceiling, and the chair-rail");
  L.push(`  where it turns the corner onto a return - points at ${col(vp.x)}, ${row(vp.y)} and`);
  L.push("  at nothing else.");
  L.push(`  The painted wall meets the floor along one exactly horizontal line at ${row(g.floorY)}.`);
  if (g.ceilY !== null) {
    L.push(`  The painted wall meets the ceiling along one exactly horizontal line at ${row(g.ceilY)}.`);
  }
  if (g.bounded) {
    L.push(`  Its two corners are exactly vertical lines at ${col(g.cL)} and ${col(g.cR)}.`);
    for (const [side, s] of [["left", g.left], ["right", g.right]]) {
      if (s.ceiling && s.ceiling.to) {
        L.push(`  The ${side} side wall meets the ceiling along one straight unbroken line from ` +
          `${col(s.ceiling.from.x)}, ${row(s.ceiling.from.y)}`);
        L.push(`    to ${col(s.ceiling.to.x)}, ${row(s.ceiling.to.y)}.`);
      }
      L.push(`  The ${side} side wall meets the floor along one straight unbroken line from ` +
        `${col(s.floor.from.x)}, ${row(s.floor.from.y)}`);
      L.push(`    to ${col(s.floor.to.x)}, ${row(s.floor.to.y)}.`);
    }
    L.push(`  Extended, those four lines all meet at ${col(vp.x)}, ${row(vp.y)}. That row is the`);
    L.push("  viewer's eye line, and it is the one quantity this picture is judged on: if the");
    L.push(`  two side walls converge anywhere but ${row(vp.y)}, the picture is wrong however`);
    L.push("  well it is painted.");
    L.push(`  One metre of the painted wall spans ${r0(g.px_per_m)} pixels; that wall is ` +
      `${g.wall_width_m.toFixed(2)} m wide and spans`);
    L.push(`    ${r0(g.corner_span_px)} pixels between its corners.`);
  } else {
    L.push(`  One metre at the wall plane spans ${r0(g.px_per_m)} pixels.`);
  }
  L.push("  The floor is visible and runs to the bottom edge of frame.");
  return L;
}

/**
 * Every rect the scaffold would stamp, stated in pixel columns and rows AND in
 * metres along the wall — the same rects, in the same ruler space, that
 * `scaffoldRects` draws.
 */
export function geometryBlock(ctx) {
  const g = ctx.geometry;
  const cr = ctx.chair_rail;
  const L = [];
  L.push("Geometry, exact, in pixels and in metres: the frame is 1536 columns wide and 1024 rows");
  L.push("  high; column 0 is its left edge and row 0 is its top edge. Distances along the wall");
  L.push(`  are measured from its left corner. One metre at the wall plane spans ` +
    `${r2(g.px_per_m)} pixels.`);
  if (g.bounded) {
    L.push(`  WALL - ${g.wall_width_m.toFixed(2)} m wide, from ${col(g.cL)} to ${col(g.cR)} ` +
      `(${r0(g.corner_span_px)} pixels);`);
    L.push(`    its foot is ${row(g.floorY)}` +
      (g.ceilY !== null ? `, its head ${row(g.ceilY)}, storey height ${g.storey_height_m.toFixed(2)} m.` : "."));
  }
  L.push(`  ${cr.word} - ${ctx.anchor_m.toFixed(2)} m above the floor line, at ${row(cr.y)}, ` +
    `running the full width`);
  L.push(`    from ${col(cr.x0)} to ${col(cr.x1)} and turning the corner onto both side walls.`);
  L.push(`  EYE LINE - ${row(g.horizonY)}.`);
  if (ctx.rects.length) {
    for (const r of ctx.rects) {
      const w = (r.to_m - r.from_m);
      L.push(`  ${r.label} - ${w.toFixed(2)} m wide, standing from ${r.from_m.toFixed(2)} m to ` +
        `${r.to_m.toFixed(2)} m along the wall:`);
      L.push(`    from ${col(r.x0)} to ${col(r.x1)}, its head at ${row(r.y0)} and its foot at ` +
        `${row(r.y1)}.`);
    }
  } else {
    L.push("  CARRIERS - none. This wall carries no opening and no built feature at all.");
  }
  return L;
}

/* ------------------------------------------------------------------ */
/* The arms                                                            */
/* ------------------------------------------------------------------ */

export const STYLE_SEED = "design/references/style-seed-warm.png";

/* The exact lines `manorPrompt` writes about Image 2. An arm that drops or
 * demotes the scaffold has to remove or rewrite each of them, and naming them
 * here — rather than pattern-matching for "Image 2" — is what makes the arms'
 * declared diffs assertable line by line and what makes the emitter FAIL LOUDLY
 * the day `manorPrompt` rewords one of them. */
export const IMAGE2_LINES = {
  input_head: "  where Image 1 and these words disagree, these words win. Image 2 is a geometric layout",
  input_diagram: "  diagram of the surface to be painted: it is a technical drawing, not artwork to imitate.",
  input_labels: "  Image 2's boxed labels mark where a named feature belongs: paint that feature inside its box, filling it. The labels themselves are instructions and are never painted.",
  constraint_marks: "  Image 2 contains grid lines, a large letter and annotation text; these are"
};

/* v5's whole difference from the control, as an explicit substitution set.
 * "One line differs" would have been a lie: an edge drawing has no dim metre
 * grid and no facing glyph, so the three sentences that describe what Image 2
 * IS all have to move, and each one is written out here so the test can assert
 * the diff is exactly this and nothing else. */
export const V5_SUBSTITUTIONS = [
  [IMAGE2_LINES.input_head,
   "  where Image 1 and these words disagree, these words win. Image 2 is a line drawing of"],
  [IMAGE2_LINES.input_diagram,
   "  the surface to be painted, in black ink on white: it is a technical drawing, not artwork to imitate."],
  [IMAGE2_LINES.input_labels,
   "  Image 2's boxed outlines mark where a named feature belongs: paint that feature inside its outline, filling it. The outlines themselves are instructions and are never painted."],
  [IMAGE2_LINES.constraint_marks,
   "  Image 2 is black ink on white and contains construction lines and outlines; these are"]
];

/* v2's whole difference from v1, as two lines. The plan's §1 sentence — "the
 * text governs every number" — is verbatim in the second of them. */
export const V2_DEMOTION_LINES = {
  input: "  Image 2 is a rough spatial sketch of the same wall, attached for orientation only. It is not measured and it is not to scale.",
  geometry: "  Image 2 is a rough spatial sketch; the text governs every number. Where Image 2 and these numbers disagree, these numbers win."
};

function textOnlyInputSection(ctx) {
  return [
    "Input images: Image 1 is the exact reference for painted MEDIUM, palette, light quality",
    "  and brush handling. It is NOT a reference for this place's materials, for how many",
    "  openings this wall has, or for what is in its glass - those are the words below, and",
    "  where Image 1 and these words disagree, these words win.",
    "  There is no layout image. Every dimension of this picture is stated in the text below,",
    "  in pixels and in metres, and the text is the whole of the geometry you are given."
  ];
}

/** v1/v2's replacement for the control's Image-2-dependent constraint lines. */
const NO_LETTERING = [
  "  The painted picture contains no line, letter, word, number, label, watermark or border",
  "  of any kind."
];

function stripImage2FromConstraints(secs) {
  const i = at(secs, "Constraints");
  const keep = [];
  for (const line of secs[i].lines) {
    if (line === IMAGE2_LINES.constraint_marks) break;
    keep.push(line);
  }
  secs[i].lines = keep.concat(NO_LETTERING);
  return secs;
}

function stripImage2FromAnchors(secs) {
  const i = at(secs, "Architecture and measurement anchors");
  secs[i].lines = secs[i].lines.map((l) =>
    l === "  Each feature stands where Image 2's box for it stands, filling that box's width."
      ? "  Each feature stands at exactly the pixel columns given above."
      : l);
  return secs;
}

/**
 * The six arms of generation 1.
 *
 * `channels` is what §6 recombines; `prompt(ctx)` is the composer; `images(ctx)`
 * is the attach order the packet writes. Nothing here reads a file or opens a
 * browser — an arm is a pure function of the facing, which is what lets the
 * suite compose all twelve prompts without a page.
 */
export const ARMS = {
  v1: {
    id: "v1",
    name: "TEXT-ONLY-PRECISION",
    what: "no layout image at all; the full geometry as exhaustive precise text",
    channels: { text_geometry: "exhaustive", image: "none", camera_language: "exhaustive" },
    images: () => ["style-seed-warm.png"],
    prompt(ctx) {
      const secs = parseSections(manorPrompt(ctx.plan, ctx.key, ctx.meta, ctx.rects));
      replaceSection(secs, "Input images", textOnlyInputSection(ctx));
      substituteLine(secs,
        "  matching Image 1's paint handling and Image 2's geometry exactly.",
        "  matching Image 1's paint handling and the geometry stated below exactly.");
      replaceSection(secs, "Camera and composition", cameraBlock(ctx));
      insertAfter(secs, "Camera and composition",
        { key: "Geometry, exact, in pixels and in metres", lines: geometryBlock(ctx) });
      stripImage2FromAnchors(secs);
      stripImage2FromConstraints(secs);
      return renderSections(secs);
    }
  },

  v2: {
    id: "v2",
    name: "TEXT-PRIMARY",
    what: "v1's text exactly, plus the scaffold attached and explicitly demoted",
    channels: { text_geometry: "exhaustive", image: "scaffold_demoted", camera_language: "exhaustive" },
    images: () => ["style-seed-warm.png", "scaffold.png"],
    prompt(ctx) {
      const secs = parseSections(ARMS.v1.prompt(ctx));
      appendTo(secs, "Input images", [V2_DEMOTION_LINES.input]);
      appendTo(secs, "Geometry, exact, in pixels and in metres", [V2_DEMOTION_LINES.geometry]);
      return renderSections(secs);
    }
  },

  v3: {
    id: "v3",
    name: "CONTROL",
    what: "the current production technique, unchanged",
    channels: { text_geometry: "production", image: "scaffold_primary", camera_language: "production" },
    images: () => ["style-seed-warm.png", "scaffold.png"],
    /* THE IDENTITY TRANSFORMATION, and it is written as one call rather than as
     * a parse-and-render round trip so that "the control is production" is true
     * by construction and not by the parser being lossless. */
    prompt(ctx) { return manorPrompt(ctx.plan, ctx.key, ctx.meta, ctx.rects); }
  },

  v4: {
    id: "v4",
    name: "SCAFFOLD-PRIMARY-MINIMAL-TEXT",
    what: "the rich labelled scaffold, and three sentences",
    channels: { text_geometry: "minimal", image: "scaffold_primary", camera_language: "none" },
    images: () => ["style-seed-warm.png", "scaffold.png"],
    /* MINIMAL-TEXT, NOT NO-TEXT, and the plan says so in the same words. The
     * three header lines below are `prompt_lint.py`'s standing requirement — a
     * prompt with no `Gate anchor:` is refused before an image exists, and it
     * is refused correctly, because hall/N and hall/S came back unmeasurable
     * twice for exactly that. Suspending a live gate to make an arm purer would
     * be measuring a prompt this project would never send. */
    prompt(ctx) {
      const secs = parseSections(manorPrompt(ctx.plan, ctx.key, ctx.meta, ctx.rects));
      const keep = ["Use case", "Asset type", "Gate anchor"];
      const head = secs.filter((s) => keep.includes(s.key));
      const [, f] = ctx.key.split("/");
      const side = { N: "north", E: "east", S: "south", W: "west" }[f];
      const body = {
        key: "Primary request",
        lines: [
          `Primary request: Paint the ${side} ${ctx.surface} of the empty ${ctx.room_name} of a ` +
            "circa-1660 English manor in",
          "  Image 1's medium, palette and light, with Image 2's geometry reproduced exactly to the",
          "  pixel. Image 2 is a technical layout diagram and not artwork to imitate: every line, box,",
          "  outline and letter in it is an instruction, and the painted picture contains no line,",
          "  letter, word, number, label, watermark or border of any kind. The picture is completely",
          "  empty of furniture, loose props, people, animals and clutter."
        ]
      };
      return renderSections(head.concat([body]));
    }
  },

  v5: {
    id: "v5",
    name: "EDGE-SCAFFOLD",
    what: "the control's text; Image 2 re-drawn as high-contrast black-on-white line art",
    channels: { text_geometry: "production", image: "edge", camera_language: "production" },
    images: () => ["style-seed-warm.png", "edge.png"],
    prompt(ctx) {
      const secs = parseSections(manorPrompt(ctx.plan, ctx.key, ctx.meta, ctx.rects));
      for (const [from, to] of V5_SUBSTITUTIONS) substituteLine(secs, from, to);
      return renderSections(secs);
    }
  },

  v6: {
    id: "v6",
    name: "CAMERA-LANGUAGE",
    what: "the control, plus the exhaustive verbal perspective construction",
    channels: { text_geometry: "production", image: "scaffold_primary", camera_language: "exhaustive" },
    images: () => ["style-seed-warm.png", "scaffold.png"],
    prompt(ctx) {
      const secs = parseSections(manorPrompt(ctx.plan, ctx.key, ctx.meta, ctx.rects));
      appendTo(secs, "Camera and composition", cameraBlock(ctx, { lead: false }));
      return renderSections(secs);
    }
  }
};

/* ------------------------------------------------------------------ */
/* v7 — the governing frame's own arm                                  */
/* ------------------------------------------------------------------ */
/* [HUMAN, 2026-08-24, ruled mid-allocation and verbatim in row 34]:
 * "Visual reference for visual orientation generalities, text for well defined
 * articulation of anchored requirements and detail of the reference
 * generalizations."
 *
 * That is a DIVISION OF LABOUR, not a preference between two channels, and it
 * is the one arm in this space that executes it: Image 2 is kept and is asked
 * for orientation only — what is where, how the surfaces sit against each
 * other, how much of the frame each takes — and every anchored number lives in
 * words that NAME the element of Image 2 they are articulating. The image is
 * never asked to carry a measurement and the text never re-describes the layout
 * the image already shows; each does the half it is good at.
 *
 * WHAT MAKES IT A DIFFERENT ARM FROM v2, which also puts every number in the
 * text: v2's text is written as if the image were not there and then demotes
 * the image in a sentence, so the two channels run in PARALLEL and a
 * disagreement between them is resolved by a precedence rule. v7's text is
 * BOUND to the image element by element, so there is nothing to resolve. That
 * pairing — bound against unbound, same precision location — is the sharpest
 * comparison in the generation and the report names it as such. */

/** Where a stamped rect sits across the wall, in the words a viewer would use
 *  looking at Image 2. Derived from the box centre against the corner span, so
 *  a carrier that moves in the plan is described correctly without a hand. */
export function positionWord(rect, g) {
  if (!g.bounded) return "in";
  const u = ((rect.x0 + rect.x1) / 2 - g.cL) / (g.cR - g.cL);
  if (u < 0.2) return "at the far left of";
  if (u < 0.4) return "left of centre in";
  if (u <= 0.6) return "at the centre of";
  if (u <= 0.8) return "right of centre in";
  return "at the far right of";
}

const CARRIER_NOUN = {
  door: "the boxed opening",
  window: "the boxed opening",
  fireplace: "the boxed feature"
};

const CARRIER_IS = {
  door: (r, m) => `the door: its opening is exactly ${(r.to_m - r.from_m).toFixed(2)} m wide and ` +
    "exactly 2.00 m high, and it stands empty with no leaf hung in it",
  window: (r) => `the leaded window: its opening is exactly ${(r.to_m - r.from_m).toFixed(2)} m wide`,
  fireplace: (r) => "the stone fireplace: its firebox opening is exactly 0.90 m wide and its " +
    `stone breast exactly ${(r.to_m - r.from_m).toFixed(2)} m wide`
};

/**
 * The cross-reference block: Image 2 walked element by element, each element
 * named as a viewer sees it and then articulated to its exact number.
 */
export function crossReferenceBlock(ctx) {
  const g = ctx.geometry;
  const vp = vanishingPoint(ctx.meta);
  const cr = ctx.chair_rail;
  const [, f] = ctx.key.split("/");
  const side = { N: "north", E: "east", S: "south", W: "west" }[f];
  const L = [];
  L.push("Reading Image 2, element by element: Image 2 shows you WHERE things are and how much");
  L.push("  of the frame each takes. It carries no measurement at all. Every element you can see");
  L.push("  in it is named below and given its exact size and place, and those numbers govern.");
  L.push(`  The broad surface facing you in Image 2 is the ${side} ${ctx.surface} of the ` +
    `${ctx.room_name}.`);
  if (g.bounded) {
    L.push(`    It is exactly ${g.wall_width_m.toFixed(2)} m wide and its two corners stand at ` +
      `${col(g.cL)} and ${col(g.cR)},`);
    L.push(`    ${r0(g.corner_span_px)} pixels apart, so one metre of it spans ${r0(g.px_per_m)} pixels.`);
  }
  L.push(`  The horizontal line low in Image 2, where that surface meets the floor, is at ` +
    `${row(g.floorY)}.`);
  if (g.ceilY !== null) {
    L.push(`  The horizontal line high in Image 2, where it meets the ceiling, is at ` +
      `${row(g.ceilY)};`);
    L.push(`    the storey is exactly ${g.storey_height_m.toFixed(2)} m from floor to ceiling.`);
  }
  if (g.bounded) {
    L.push("  The two surfaces receding to left and right in Image 2 are the side walls. Each of");
    L.push("    them meets the ceiling along ONE straight unbroken line running from its own corner");
    L.push(`    to the edge of frame, and those two lines converge exactly at ${row(vp.y)} - the`);
    L.push("    viewer's eye line. Each also meets the floor along one straight unbroken line, and");
    L.push(`    those two converge at ${row(vp.y)} as well, at the same ${col(vp.x)}.`);
    L.push(`    Left: ceiling junction from ${col(g.left.ceiling.from.x)}, ${row(g.left.ceiling.from.y)} ` +
      `to ${col(g.left.ceiling.to.x)}, ${row(g.left.ceiling.to.y)};`);
    L.push(`    floor junction from ${col(g.left.floor.from.x)}, ${row(g.left.floor.from.y)} ` +
      `to ${col(g.left.floor.to.x)}, ${row(g.left.floor.to.y)}.`);
    L.push(`    Right: ceiling junction from ${col(g.right.ceiling.from.x)}, ${row(g.right.ceiling.from.y)} ` +
      `to ${col(g.right.ceiling.to.x)}, ${row(g.right.ceiling.to.y)};`);
    L.push(`    floor junction from ${col(g.right.floor.from.x)}, ${row(g.right.floor.from.y)} ` +
      `to ${col(g.right.floor.to.x)}, ${row(g.right.floor.to.y)}.`);
  }
  L.push(`  The line running the full width of Image 2 between those two is the ` +
    `${cr.word.toLowerCase()}:`);
  L.push(`    it is exactly ${ctx.anchor_m.toFixed(2)} m above the floor, at ${row(cr.y)}, and it ` +
    "turns the corner onto");
  L.push("    both side walls.");
  for (const r of ctx.rects) {
    const noun = CARRIER_NOUN[r.kind] || "the boxed feature";
    const isFn = CARRIER_IS[r.kind];
    L.push(`  ${noun.charAt(0).toUpperCase() + noun.slice(1)} ${positionWord(r, g)} Image 2 is ` +
      `${isFn ? isFn(r, ctx.meta) : r.kind}.`);
    L.push(`    It stands from ${r.from_m.toFixed(2)} m to ${r.to_m.toFixed(2)} m along the wall ` +
      `from its left corner:`);
    L.push(`    ${col(r.x0)} to ${col(r.x1)}, head at ${row(r.y0)}, foot at ${row(r.y1)}.`);
    if (r.kind === "door") {
      L.push("    The space beyond it is deep unlit shadow - no lit room, no visible far wall.");
    }
  }
  if (!ctx.rects.length) {
    L.push("  Image 2 boxes no feature on this surface, and there is none: it carries no opening");
    L.push("    and no built feature at all, and the line above is the one ruled feature in it.");
  }
  L.push("  Image 2's grid lines, its large letter and its annotation text are orientation marks");
  L.push("  and carry no measurement; where Image 2 and these numbers disagree, these numbers win,");
  L.push("  and the painted picture contains none of those marks.");
  return L;
}

ARMS.v7 = {
  id: "v7",
  name: "CROSS-REFERENCED",
  what: "the ruled division of labour: Image 2 orients, the text articulates it element by element",
  channels: {
    text_geometry: "cross_referenced",
    image: "scaffold_orienting",
    camera_language: "cross_referenced"
  },
  images: () => ["style-seed-warm.png", "scaffold.png"],
  ruling: "[HUMAN, 2026-08-24] \"Visual reference for visual orientation generalities, text for well defined articulation of anchored requirements and detail of the reference generalizations\"",
  prompt(ctx) {
    const secs = parseSections(manorPrompt(ctx.plan, ctx.key, ctx.meta, ctx.rects));
    /* Image 2 is re-declared as ORIENTATION, and the control's two sentences
     * that ask it to carry precision — "reproduce Image 2's camera exactly, to
     * the pixel" and "paint that feature inside its box" — are what this arm
     * exists to move out of the image and into the words. */
    replaceSection(secs, "Input images", [
      "Input images: Image 1 is the exact reference for painted MEDIUM, palette, light quality",
      "  and brush handling. It is NOT a reference for this place's materials, for how many",
      "  openings this wall has, or for what is in its glass - those are the words below, and",
      "  where Image 1 and these words disagree, these words win.",
      "  Image 2 is a layout sketch of this wall and it is here to ORIENT you: what is where,",
      "  how the surfaces sit against each other, and how much of the frame each takes. It is",
      "  not measured and it is not to scale. Every anchored number is in the words below, and",
      "  each of those words names the element of Image 2 it is articulating."
    ]);
    substituteLine(secs,
      "  matching Image 1's paint handling and Image 2's geometry exactly.",
      "  matching Image 1's paint handling and the geometry articulated below exactly.");
    replaceSection(secs, "Camera and composition", [
      "Camera and composition: 1536x1024 landscape. The camera is level, with zero upward or",
      "  downward tilt and zero roll, and it stands square to the surface being painted."
    ]);
    insertAfter(secs, "Camera and composition",
      { key: "Reading Image 2, element by element", lines: crossReferenceBlock(ctx) });
    stripImage2FromAnchors(secs);
    stripImage2FromConstraints(secs);
    return renderSections(secs);
  }
};

/* ------------------------------------------------------------------ */
/* Generation 2 — the arms the rule bred                               */
/* ------------------------------------------------------------------ */
/* Generation 1 returned NO SEPARATION at the strict bar, exactly as
 * `min_detectable_effect` said it must unless an arm swept: 4 of 4 against 0 of
 * 4 was the only clearing result at that n and correction, and nothing reached
 * it. So the breeding took BRANCH B, the declared null branch, and named six
 * arms — the control fresh, the two leaders on the continuous ladder amplified,
 * their two surviving crossings, and the opposite pole of the spectrum. Nothing
 * below was chosen: the arm set came out of `row34_fitness.py
 * --plan-generation-2`, and what this section adds is the composers those
 * channel triples now need.
 *
 * THE CROSSINGS ARE THE RULE'S, AND THE RULE CAN BE CHECKED WITHOUT THE
 * READINGS. Given the two leaders, the channel enumeration drops m1, m3, m5 and
 * m6 as duplicates of arms already in the pool and yields exactly m2 and m4 —
 * pure logic over the seven declared triples, which `evolution.spec.mjs`
 * re-derives rather than trusting a report of it.
 *
 * WHAT THE SCREEN SAW, and it is a pattern rather than a result: the text-heavy
 * arms took 8 of 12 admissible against 2 of 16 for the image-heavy arms and the
 * control, and the bound cross-referenced arm took 0 of 4 where its unbound twin
 * took 3 of 4. None of that cleared the bar and none of it is called a finding;
 * it is what branch B bred toward, and generation 2 is where it survives fresh
 * rolls or does not. */

/** Both endpoints of all four side-wall junctions, as a numeric table.
 *
 * This is `AMPLIFICATION.v2` word for word — and on its own it adds NO NUMBER
 * the arm did not already state, because `cameraBlock` gives all four junctions
 * by their two endpoints in prose. Found when the composer was written, and said
 * here rather than shipped as an amplification that only reformats: the table is
 * kept for the register change (prose to figures) and `wallGridBlock` below is
 * what actually pushes the channel. Plan §6a records the extension and its
 * reason, because a ladder rung that turned out to be empty is worth a sentence.
 */
export function junctionTable(ctx) {
  const g = ctx.geometry;
  if (!g.bounded) return [];
  const L = ["  RETURN JUNCTIONS - each is ONE straight unbroken line between the two points given:"];
  for (const [side, s] of [["LEFT", g.left], ["RIGHT", g.right]]) {
    if (s.ceiling && s.ceiling.to) {
      L.push(`    ${side} CEILING - from ${col(s.ceiling.from.x)}, ${row(s.ceiling.from.y)} ` +
        `to ${col(s.ceiling.to.x)}, ${row(s.ceiling.to.y)}`);
    }
    L.push(`    ${side} FLOOR   - from ${col(s.floor.from.x)}, ${row(s.floor.from.y)} ` +
      `to ${col(s.floor.to.x)}, ${row(s.floor.to.y)}`);
  }
  return L;
}

/** The wall plane's own grid, in numbers — every metre along it as a column and
 *  every half metre up it as a row.
 *
 *  WHY THIS IS THE AMPLIFICATION THAT BITES. It is exactly what the scaffold's
 *  dim metre grid carries as pixels, and this arm's whole premise is that the
 *  image is demoted — so putting the grid into figures is the text taking over
 *  the one thing the picture was still doing better than the words. Every value
 *  is `rulerX` and `wallY`, the same two functions the scaffold stamps with, so
 *  the numbers a painter is given and the numbers the gate scores are one set.
 */
export function wallGridBlock(ctx) {
  const g = ctx.geometry;
  const m = ctx.meta;
  const cols = [];
  for (let x = 0; x <= Math.floor(g.wall_width_m + 1e-9); x++) {
    cols.push(`${x} m = ${col(rulerX(x, m))}`);
  }
  const rows = [];
  const top = g.storey_height_m || 2.0;
  for (let h = 0.5; h <= top + 1e-9; h += 0.5) {
    rows.push(`${h.toFixed(1)} m = ${row(wallY(h, m))}`);
  }
  return [
    "  THE WALL'S OWN GRID, so nothing has to be judged by eye. Measured along the wall from",
    "    its left corner, one metre at a time:",
    "    " + cols.join(" · "),
    "  And measured up from the wall-floor line, half a metre at a time:",
    "    " + rows.join(" · ")
  ];
}

/** The returns as an instruction to DRAW rather than a description of what is
 *  there — `AMPLIFICATION.v6` word for word, with waypoints at quarter, half and
 *  three-quarter along each line so the hand has something to check against
 *  before it reaches the far end. The waypoints are linear interpolation of the
 *  two endpoints the renderer's own functions produced; nothing new is measured.
 */
export function drawInstructions(ctx) {
  const g = ctx.geometry;
  const vp = vanishingPoint(ctx.meta);
  if (!g.bounded) return [];
  const L = [];
  L.push("  Draw each return as one line, in this order, and check it at the waypoints:");
  for (const [side, s] of [["left", g.left], ["right", g.right]]) {
    for (const [what, j] of [["ceiling", s.ceiling], ["floor", s.floor]]) {
      if (!j || !j.to) continue;
      const way = [0.25, 0.5, 0.75].map((t) => {
        const x = j.from.x + t * (j.to.x - j.from.x);
        const y = j.from.y + t * (j.to.y - j.from.y);
        return `at ${col(x)} it is at ${row(y)}`;
      });
      L.push(`    Start the ${side} ${what} junction at ${col(j.from.x)}, ${row(j.from.y)} and rule it`);
      L.push(`      straight to ${col(j.to.x)}, ${row(j.to.y)}: ${way.join("; ")}.`);
    }
  }
  L.push("  Check the four lines against each other: extended, every one of them passes through");
  L.push(`    ${col(vp.x)}, ${row(vp.y)}. If any two of them meet anywhere else, the drawing is wrong`);
  L.push("    and no amount of finish will repair it.");
  return L;
}

/* v2xv6m4's demotion, and it is SCOPED where v2's is blanket — because it has to
 * be true. v2 can say "the text governs every number" because v2's text states
 * every number; m4 carries PRODUCTION text geometry, which does not, so the same
 * sentence in it would be a false sentence in a prompt. What m4 demotes the image
 * for is the CAMERA, which its own text now constructs in full. */
export const M4_DEMOTION_LINES = {
  input: "  Image 2 is a rough spatial sketch of the same wall. Trust it for WHERE things are; the camera construction below is exact and governs every row and column in it.",
  camera: "  Where Image 2's camera and this construction disagree, this construction wins."
};

ARMS.v2A = {
  id: "v2A", name: "TEXT-PRIMARY, AMPLIFIED", parent: "v2", amplified: true,
  what: "v2 with the junction table and the wall's own grid in figures",
  channels: { ...ARMS.v2.channels },
  images: () => ARMS.v2.images(),
  /* Built from v1 and then demoted, rather than from v2 and then amplified, so
   * the demotion sentence still CLOSES its section: appending to v2 put the
   * amplification after "the text governs every number", which reads as though
   * the table were an afterthought to the rule instead of the thing the rule
   * governs. Same lines either way, and the suite checks the set difference from
   * v2 rather than the construction order. */
  prompt(ctx) {
    const secs = parseSections(ARMS.v1.prompt(ctx));
    const GEO = "Geometry, exact, in pixels and in metres";
    appendTo(secs, GEO, junctionTable(ctx).concat(wallGridBlock(ctx)));
    appendTo(secs, "Input images", [V2_DEMOTION_LINES.input]);
    appendTo(secs, GEO, [V2_DEMOTION_LINES.geometry]);
    return renderSections(secs);
  }
};

ARMS.v6A = {
  id: "v6A", name: "CAMERA-LANGUAGE, AMPLIFIED", parent: "v6", amplified: true,
  what: "v6 with the returns constructed row by row as an instruction to draw",
  channels: { ...ARMS.v6.channels },
  images: () => ARMS.v6.images(),
  prompt(ctx) {
    const secs = parseSections(ARMS.v6.prompt(ctx));
    appendTo(secs, "Camera and composition", drawInstructions(ctx));
    return renderSections(secs);
  }
};

ARMS.v2xv6m2 = {
  id: "v2xv6m2", name: "EXHAUSTIVE TEXT, SCAFFOLD PRIMARY", parents: ["v2", "v6"],
  what: "every number in the text AND the scaffold left primary - the crossing that keeps both channels at full strength",
  channels: { text_geometry: "exhaustive", image: "scaffold_primary", camera_language: "exhaustive" },
  images: () => ["style-seed-warm.png", "scaffold.png"],
  /* The control's Image-2 declaration is left exactly as production writes it —
   * boxed labels, "reproduce Image 2's camera exactly", the lot — and the
   * exhaustive geometry and camera are added on top. So this arm asks both
   * channels for the same thing at full strength, which is the case neither
   * parent runs: v2 demotes the image, v6 leaves the text at production. */
  prompt(ctx) {
    const secs = parseSections(manorPrompt(ctx.plan, ctx.key, ctx.meta, ctx.rects));
    replaceSection(secs, "Camera and composition", cameraBlock(ctx));
    insertAfter(secs, "Camera and composition",
      { key: "Geometry, exact, in pixels and in metres", lines: geometryBlock(ctx) });
    return renderSections(secs);
  }
};

ARMS.v2xv6m4 = {
  id: "v2xv6m4", name: "PRODUCTION TEXT, EXHAUSTIVE CAMERA, SCAFFOLD DEMOTED",
  parents: ["v2", "v6"],
  what: "the camera constructed in full and the image demoted for it, with the carriers left to production's own sentences",
  channels: { text_geometry: "production", image: "scaffold_demoted", camera_language: "exhaustive" },
  images: () => ["style-seed-warm.png", "scaffold.png"],
  prompt(ctx) {
    const secs = parseSections(manorPrompt(ctx.plan, ctx.key, ctx.meta, ctx.rects));
    appendTo(secs, "Input images", [M4_DEMOTION_LINES.input]);
    replaceSection(secs, "Camera and composition", cameraBlock(ctx));
    appendTo(secs, "Camera and composition", [M4_DEMOTION_LINES.camera]);
    return renderSections(secs);
  }
};

export const ARM_IDS = Object.keys(ARMS);
export const CONTROL_ARM = "v3";

/** The arms generation 1 ran. A later generation's set is decided by the planner
 *  and read from its plan file, never from a list in a tool. */
export const GEN1_ARMS = ["v1", "v2", "v3", "v4", "v5", "v6", "v7"];

/* ------------------------------------------------------------------ */
/* The spectrum — the Captain's frame as the reading order             */
/* ------------------------------------------------------------------ */
/* [HUMAN, 2026-08-24] The ruling is not only an arm; it is the LENS. The
 * question this row answers is "where does precision belong", not "which recipe
 * won", so the report orders the arms along one axis — how much of the anchored
 * precision the IMAGE is asked to carry — and reads the fitness against that
 * ordering rather than as a league table.
 *
 * `bound` is the second axis and it is what separates the two arms that put
 * every number in the text: v7's words are indexed to the image element by
 * element, v2's run beside it and win by a precedence rule. */
export const SPECTRUM = [
  { arm: "v4", precision_in: "image", bound: null,
    reads: "the image carries everything; the words are three sentences" },
  { arm: "v5", precision_in: "image", bound: null,
    reads: "the image carries everything, redrawn as line art; production text" },
  { arm: "v3", precision_in: "shared", bound: "loose",
    reads: "production: the image is asked for the camera to the pixel and the text restates some of it" },
  { arm: "v6", precision_in: "shared", bound: "loose",
    reads: "production plus the verbal camera construction; both channels carry the camera" },
  { arm: "v6A", precision_in: "shared", bound: "loose", generation: 2,
    reads: "v6 amplified: the returns constructed row by row as an instruction to draw" },
  { arm: "v2xv6m4", precision_in: "shared", bound: "scoped", generation: 2,
    reads: "the camera in the text and the carriers still on the image, with the image demoted for the camera alone" },
  { arm: "v2xv6m2", precision_in: "both", bound: "full", generation: 2,
    reads: "both channels at full strength: every number in the text AND the scaffold left primary" },
  { arm: "v7", precision_in: "text", bound: "bound",
    reads: "THE RULED DIVISION: the image orients, the text articulates it element by element" },
  { arm: "v2", precision_in: "text", bound: "unbound",
    reads: "the text carries every number standalone; the image is attached and demoted" },
  { arm: "v2A", precision_in: "text", bound: "unbound", generation: 2,
    reads: "v2 amplified: the junction table and the wall's own metre grid, in figures" },
  { arm: "v1", precision_in: "text", bound: "none",
    reads: "the text carries everything; there is no layout image at all" }
];

/** The pairing the frame makes sharpest: same precision location, opposite
 *  binding. Named here so the report cannot forget to print it. */
export const HEADLINE_PAIRING = {
  bound: "v7", unbound: "v2",
  question: "with every anchored number in the text either way, does binding the words to the image element by element beat running them beside it under a precedence rule"
};

/* ------------------------------------------------------------------ */
/* The context an arm composes against                                 */
/* ------------------------------------------------------------------ */

/**
 * Everything an arm needs about one facing, derived once.
 *
 * `meta` is optional: pass the meta the PAGE holds when the emitter has a page
 * open (that is what a player's build resolves), and omit it in a test, where
 * `deriveMeta` gives the identical document for an unpainted facing — which
 * `evolution.spec.mjs` asserts against the manor manifest rather than assuming.
 */
export function makeCtx(plan, key, meta) {
  const [loc, f] = key.split("/");
  const m = meta || deriveMeta(plan, loc, f);
  const { rects, apertures } = scaffoldRects(plan, loc, f, m);
  const { voice, anchor, via } = voiceFor(plan, loc, f);
  const room = plan.rooms.find((r) => r.id === loc);
  const cr = chairRail(m, anchor);
  const g = frameGeometry(m);
  /* The anchor's own word, upper-cased for the geometry block, restricted to
   * the glyph set so a label and a prompt cannot disagree about what the ruler
   * is called. */
  const word = (anchor.legend_word || "CHAIR-RAIL").toUpperCase();
  assertLabelChars(word, `${key}'s anchor word`);
  return {
    plan, key, loc, facing: f, meta: m, rects, apertures,
    voice, anchor, via, geometry: g,
    room_name: (room.name || room.id).toLowerCase(),
    surface: voice.outdoor ? "side" : "wall",
    anchor_m: 0.95,
    chair_rail: { y: cr.y, x0: cr.x0, x1: cr.x1, word },
    brackets: brackets(m, rects, 0),
    carriers: facingCarriers(plan, loc, f)
  };
}

/** One arm's prompt for one facing. The only entry point the emitter uses. */
export function armPrompt(armId, ctx) {
  const a = ARMS[armId];
  if (!a) throw new Error(`evolution-arms: no arm \`${armId}\``);
  return a.prompt(ctx);
}

/* ------------------------------------------------------------------ */
/* The edge scaffold's marks                                           */
/* ------------------------------------------------------------------ */

/**
 * `v5`'s Image 2, as coordinates. The painter of it lives in the emitter; the
 * geometry lives here so the suite can recompute every coordinate from
 * `groundplane` and `facingCarriers` without opening a browser.
 *
 * WHAT IT IS AND WHAT IT IS NOT — plan §1.2. The shipped scaffold is hashed
 * against the live `#scene` buffer, so the picture a painter is given is
 * PROVABLY the picture a player sees. This drawing is composed from the same
 * declared numbers but it is not that capture, and the manifest says so on its
 * face. If `v5` wins, that guarantee has to be re-established before it becomes
 * the production Image 2.
 */
export function edgeMarks(ctx) {
  const g = ctx.geometry;
  const lines = [];
  const push = (x0, y0, x1, y1, weight, what) =>
    lines.push({ x0: r2(x0), y0: r2(y0), x1: r2(x1), y1: r2(y1), weight, what });
  if (g.bounded) {
    push(g.cL, g.floorY, g.cR, g.floorY, "heavy", "wall-floor line");
    if (g.ceilY !== null) push(g.cL, g.ceilY, g.cR, g.ceilY, "heavy", "wall-ceiling line");
    push(g.cL, g.ceilY === null ? 0 : g.ceilY, g.cL, g.floorY, "heavy", "left corner");
    push(g.cR, g.ceilY === null ? 0 : g.ceilY, g.cR, g.floorY, "heavy", "right corner");
    for (const [side, s] of [["left", g.left], ["right", g.right]]) {
      push(s.floor.from.x, s.floor.from.y, s.floor.to.x, s.floor.to.y, "heavy",
        `${side} return, floor junction`);
      if (s.ceiling) {
        push(s.ceiling.from.x, s.ceiling.from.y, s.ceiling.to.x, s.ceiling.to.y, "heavy",
          `${side} return, ceiling junction`);
      }
    }
  } else {
    push(0, g.floorY, CANVAS_W, g.floorY, "heavy", "wall-floor line");
  }
  const cr = ctx.chair_rail;
  push(cr.x0, cr.y, cr.x1, cr.y, "light", "gate anchor");
  const rects = ctx.rects.map((r) => ({
    kind: r.kind, x0: r.x0, y0: r.y0, x1: r.x1, y1: r.y1, weight: "medium"
  }));
  /* NO EYE-LINE MARK. The convergence row is what the measurement reads, and a
   * ruled horizontal drawn across the picture at row 526 is an invitation to
   * paint a horizontal there — which would be a line the gate then reads as a
   * junction. The returns carry it implicitly, which is the whole point of an
   * edge drawing. */
  return { lines, rects, ink: "#000000", ground: "#ffffff" };
}

/* ------------------------------------------------------------------ */
/* Recombination — §6's channel crossing, as a pure function           */
/* ------------------------------------------------------------------ */

export const CHANNELS = ["text_geometry", "image", "camera_language"];

/**
 * The crossings of two arms: each of the three channel settings taken from one
 * parent or the other. Enumerated in a fixed order (channel index, binary
 * ascending) so the output is reproducible from the parents alone, and a
 * crossing that reproduces an arm that already exists is dropped rather than
 * offered as a new one.
 */
export function crossings(aId, bId, existing = ARMS) {
  const a = ARMS[aId].channels, b = ARMS[bId].channels;
  const seen = new Map();
  for (const k of Object.keys(existing)) {
    seen.set(CHANNELS.map((c) => existing[k].channels[c]).join("|"), k);
  }
  const out = [];
  for (let mask = 1; mask < 7; mask++) {
    const ch = {};
    CHANNELS.forEach((c, i) => { ch[c] = (mask >> i) & 1 ? b[c] : a[c]; });
    const sig = CHANNELS.map((c) => ch[c]).join("|");
    if (seen.has(sig)) continue;
    seen.set(sig, `${aId}x${bId}m${mask}`);
    out.push({ id: `${aId}x${bId}m${mask}`, parents: [aId, bId], channels: ch });
  }
  return out;
}

/** §6's mutation ladder, declared per arm before generation 1 returns. */
export const AMPLIFICATION = {
  v1: "the geometry text gains the per-return junction table: both endpoints of each return's floor junction and ceiling junction, in columns and rows, computed through groundplane",
  v2: "the geometry text gains the per-return junction table: both endpoints of each return's floor junction and ceiling junction, in columns and rows, computed through groundplane",
  v3: null,
  v4: "the scaffold gains the return junction lines drawn as ruled marks with their own labels; the body stays three sentences",
  v5: "the edge drawing gains stroke-weight hierarchy: junctions heavy, carriers medium, the anchor light",
  v6: "the camera paragraph gains the row-by-row construction of both returns, stated as an instruction to draw rather than as a description"
};

export const PLAN = JSON.parse(
  readFileSync(join(ROOT, "fixtures", "demo-study", "plan.json"), "utf8"));

/** The two probe walls, and the run-state fact that picked each of them.
 *  Read by the emitter and by the suite so there is one home for the pick. */
export const PROBES = [
  { key: "guest_chamber/E",
    why: "the only zero-fault wall in the hold family: camera PASS, nothing absent, every bracket and both corners in frame, no carrier at all - a clean single failure on the horizon and nothing else in the picture to explain it",
    held_sigma_px: 71.64 },
  { key: "garden_room/E",
    why: "the nearest miss among clean walls (2.27x the licence against guest_chamber/E's 4.88x) and the opposite return geometry - the same camera to the last decimal, 492.6 px of return per side against 267.6 px",
    held_sigma_px: 33.30 }
];
