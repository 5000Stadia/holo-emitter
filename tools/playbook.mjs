/* playbook.mjs — WHICH INSTRUCTIONS THIS FACING PROMPTS.
 *
 * [HUMAN, Kabe, 2026-08-30, verbatim] "Because different angles and different
 * room types, prompt, different orientations, and styles. We should have a
 * playbook of different instructions for room, image generation, depending on
 * which direction and room piece type we are working on. When the map schematic
 * is initially generated, every location in every direction should prompt the
 * appropriate set of instructions. And some may overlay — for example, an
 * up-close wall facing with a corner on the right hand side and the wall
 * extending off of the picture to the left is one set of instructions for long
 * rooms in that corner spot, but also another set of instructions is prompted if
 * there is a door. If there is no door, we skip that processing of course."
 *
 * WHAT THIS FILE IS, AND WHAT IT IS NOT. Every situation the ruling names is
 * ALREADY built — as a branch, in `plan-projection.mjs`, `make-scaffold.mjs`,
 * `edge-seed.mjs` and the g5 register in `frame-language.mjs`. What did not
 * exist was the INDEX: a reader could not ask "which instruction sets does
 * `platform/E` prompt?" and get an answer without reading four files. So this
 * adds no instruction and changes no prompt text. It NAMES the branches, in the
 * order they compose, for every location in every direction — and it reads the
 * same functions the emitter reads, so a tag can never drift from the sentence
 * it stands for. The code is the authority; this is the index.
 *
 * OVERLAY IS THE WHOLE POINT. Tags compose: `enclosed` + `run-wall:corner-left`
 * + `door` is three instruction sets in one ask, exactly the case the ruling
 * describes. And the absence of a feature yields NO TAG — "if there is no door,
 * we skip that processing of course" — which is why nothing here emits a
 * `no-door`. The one apparent exception, `no-window`, is not one: the register
 * SAYS "there is no window" out loud on a wall that carries none, because a wall
 * that does not say it gets one painted into it. A said absence is an
 * instruction; an unsaid one is not.
 */

import { facingCarriers, deriveMeta, runSpanOf, CANVAS_W } from "./plan-projection.mjs";
import { leadFacing } from "./edge-seed.mjs";
import { deepViewOf } from "./make-scaffold.mjs";
import { loadPack, activePackName } from "./pack.mjs";

export const FACINGS = ["N", "E", "S", "W"];
const EPS = 1e-6;

/**
 * THE VOCABULARY, and its one line each. A tag not in here is a bug in this
 * file, not a new situation — `playbook.spec.mjs` refuses any tag whose key is
 * absent. `door:N` and `window:N` are the parametric keys: the tag on a facing
 * carries the count (`door:2`), and `tagKey` folds it back to the key.
 */
export const TAGS = {
  "enclosed":
    "A built wall faces you: the facing's plan type is `enclosed` (or a corridor's), so the ask describes a surface, its corners and what stands on it.",
  "open-facing":
    "No wall faces you at all: the facing's plan type is `open` and it quotes its scale at a `far_line`, so the ask describes open ground running to the horizon.",
  "lead":
    "This is the wall its room paints FIRST — the most-carried one — and it is handed to the room's other three as Image 1.",
  "follower":
    "This wall is painted AFTER its room's lead and carries the lead's picture as Image 1; its packet waits (`depends_on`) until the lead's picture is on disk.",
  "run-wall:corner-left":
    "A long room's side wall: the corner stands in view on the LEFT and the flat wall runs off the RIGHT edge of the picture with no corner and no return wall.",
  "run-wall:corner-right":
    "A long room's side wall: the corner stands in view on the RIGHT and the flat wall runs off the LEFT edge of the picture with no corner and no return wall.",
  "deep-view":
    "The wall you face is not this cell's own edge: the view passes through a full-width open edge and lands on a farther cell's wall, so the near cell's side walls, floor and ceiling fill the rest of the frame.",
  "same-wall-image":
    "The deep view's Image 1 is THIS SAME WALL promoted at close range: the ask says paint the identical wall with everything on it, from further back, changing the camera distance and nothing else.",
  "open-side":
    "An `open_edge` stands on this facing's OWN edge — a court mouth or threshold — so the ask says there is no wall here at all across its full width, and the ground runs out through it.",
  "door":
    "At least one door opening stands on this wall: the ask rules its width and 2.00 m head height and says where along the wall it sits.",
  "door:N":
    "N doors stand on this wall (N >= 2): the ask counts them and places each one separately, so two doorcases cannot collapse into one.",
  "window":
    "At least one window stands on this wall: the ask rules the sill and head, names which casement opens, and states the pack's glazing.",
  "window:N":
    "N windows stand on this wall (N >= 2): the ask counts them and places each one, and a two-window wall also gets the `between the two windows` position phrase.",
  "no-window":
    "This facing carries no glazed opening, and the ask SAYS SO — a wall that does not say it gets a window painted into it.",
  "fireplace":
    "A chimneypiece breast stands on this wall: the ask rules the breast width and gives the firebox and the height above the floor by convention.",
  "stairs":
    "A flight is drawn in this view: the ask names its direction, its treads in view, where it runs off, and (climbing up) its well.",
  "blank":
    "This facing carries no opening and no built feature at all: the ask says the room's one fabric runs across the whole of it, unbroken corner to corner, and names no second fabric."
};

/** The TAGS key a tag stands under — `door:2` is a `door:N`. */
export function tagKey(tag) {
  const t = String(tag);
  if (/^door:\d+$/.test(t)) return "door:N";
  if (/^window:\d+$/.test(t)) return "window:N";
  return t;
}

/** WHERE EACH TAG'S INSTRUCTIONS ARE WRITTEN. The doc's third column, and the
 *  reason the doc can never claim a branch that does not exist: it is generated
 *  from here. `file` + `function`. */
export const EMITTED_BY = {
  "enclosed": ["tools/plan-projection.mjs", "deriveMeta (facing_type)"],
  "open-facing": ["tools/frame-language.mjs", "g5RoomLines / g5WallLines (out, GROUND)"],
  "lead": ["tools/edge-seed.mjs", "leadFacing / seedPlan"],
  "follower": ["tools/edge-seed.mjs", "seedPlan (continues, depends_on)"],
  "run-wall:corner-left": ["tools/frame-language.mjs", "g5PictureLines (offL/offR branch)"],
  "run-wall:corner-right": ["tools/frame-language.mjs", "g5PictureLines (offL/offR branch)"],
  "deep-view": ["tools/make-scaffold.mjs", "deepViewOf"],
  "same-wall-image": ["tools/make-scaffold.mjs", "sameWallImageFor (role_sentence)"],
  "open-side": ["tools/frame-language.mjs", "g5WallLines (openSide branch)"],
  "door": ["tools/plan-projection.mjs", "facingCarriers (door) -> scaffoldRects -> g5WallLines"],
  "door:N": ["tools/frame-language.mjs", "g5WallLines (kindGroups / nWord counting)"],
  "window": ["tools/plan-projection.mjs", "windowsForFacing / facingCarriers (window)"],
  "window:N": ["tools/frame-language.mjs", "positionPhrase (between the two windows)"],
  "no-window": ["tools/frame-language.mjs", "g5WallLines (!wins.length branch)"],
  "fireplace": ["tools/plan-projection.mjs", "facingCarriers (fireplace) -> scaffoldRects"],
  "stairs": ["tools/plan-projection.mjs", "stairsForFacing / flightsForFacing -> g5FlightLines"],
  "blank": ["tools/frame-language.mjs", "g5WallLines (!rects.length branch)"]
};

/** The one-line GIST of what each tag's instructions say, for the doc. */
export const GIST = {
  "enclosed": "\"The wall you face is square on\" — surface, corners, scale.",
  "open-facing": "\"no wall at all on this side\" — open ground out to the horizon under open sky.",
  "lead": "Paint this wall first; it becomes the room's Image 1.",
  "follower": "\"Image 1 is a wall of THIS room\" — match its fabric, light and fixtures.",
  "run-wall:corner-left": "\"On the right there is NO corner and NO return wall: the flat wall simply continues and leaves the picture.\"",
  "run-wall:corner-right": "\"On the left there is NO corner and NO return wall: the flat wall simply continues and leaves the picture.\"",
  "deep-view": "The far wall spans only part of the frame; this cell's own surfaces continue toward you and fill the rest.",
  "same-wall-image": "\"Change the camera distance and nothing else.\"",
  "open-side": "\"there is no wall here at all\" — no gate, parapet, railing or hedge across any part of it.",
  "door": "Ruled opening width x 2.00 m head, placed along the wall.",
  "door:N": "\"two doorways\", each placed — the count is said before the places.",
  "window": "Ruled sill and head, the casement that opens, the pack's glazing.",
  "window:N": "The count is said, and a feature between them is placed as \"between the two windows\".",
  "no-window": "\"there is no window: this wall carries no glazed opening of any kind\".",
  "fireplace": "Ruled breast width; firebox and height above floor by convention.",
  "stairs": "Direction, treads in view, where the flight leaves the frame, the well.",
  "blank": "\"nothing stands on it... the fabric named above runs across the whole of it, unbroken corner to corner\"."
};

/* The order tags compose in. Type first (what KIND of view this is), then the
 * room's painting order, then the frame's own shape, then what stands in it.
 * Fixed so two runs of the report can be diffed. */
const ORDER = [
  "enclosed", "open-facing", "lead", "follower",
  "run-wall:corner-left", "run-wall:corner-right",
  "deep-view", "same-wall-image", "open-side",
  "door", "door:N", "window", "window:N", "no-window",
  "fireplace", "stairs", "blank"
];

const ownEdgeOf = (room, F) =>
  F === "N" ? room.rect.y1 : F === "S" ? room.rect.y0
    : F === "E" ? room.rect.x1 : room.rect.x0;

/**
 * THE FACING'S ORDERED SITUATION TAGS, from the plan.
 *
 * Derived, not declared: every tag below is a read of the same function the
 * emitter reads, so this cannot say `door` where `facingCarriers` finds none.
 * `deriveMeta` is consulted for the two situations the plan alone cannot settle
 * — where the run wall's corners fall in the FRAME, and whether a flight is in
 * view — and it is the plan's own derived meta, never a measured backdrop's, so
 * the answer is a property of the map and not of what has been painted yet.
 */
export function situationsOf(plan, key, opts = {}) {
  const [loc, F] = String(key).split("/");
  const room = (plan.rooms || []).find((r) => r.id === loc);
  if (!room) throw new Error(`playbook: the plan holds no room \`${loc}\``);
  const fc = room.facings && room.facings[F];
  if (!fc) throw new Error(`playbook: room \`${loc}\` has no facing ${F}`);

  const tags = [];
  const open = fc.type === "open";
  tags.push(open ? "open-facing" : "enclosed");

  /* [row 42] WHICH WALL LEADS ITS ROOM. A room with no facings at all has no
     lead, and then neither tag is true of anything. */
  const lead = leadFacing(plan, loc);
  if (lead) tags.push(lead === F ? "lead" : "follower");

  /* [Kabe, 2026-08-30] THE RUN WALL, and WHICH SIDE ITS CORNER IS ON. The test
     is the register's own, not a paraphrase: a corner fraction below zero is a
     corner beyond the frame (`g5PictureLines`), and the tag names the side the
     corner STANDS on — which is the opposite side from the one the wall runs
     off. `wall_run_m` is set only by `deriveMeta`'s run branch, so it is what
     separates a run wall from a wall whose corners merely sit wide. */
  let meta = null;
  try { meta = deriveMeta(plan, loc, F, opts.metaOpts || {}); } catch (ignored) { meta = null; }
  if (meta && meta.wall_run_m != null && meta.corner_x0_px != null && meta.corner_x1_px != null) {
    const fL = meta.corner_x0_px / CANVAS_W;
    const fR = 1 - meta.corner_x1_px / CANVAS_W;
    const offL = fL < 0, offR = fR < 0;
    if (offL || offR) tags.push(offL ? "run-wall:corner-right" : "run-wall:corner-left");
  } else if (!meta && !open) {
    /* The meta refused. Fall back to the plan's own run span, which answers the
       same question one degree coarser: an end beyond this cell's span is a
       corner this cell does not hold. Recorded rather than skipped, because a
       silent absence would read as "no run wall". */
    try {
      const run = runSpanOf(plan, room, F);
      const rightAxis = { N: [1, 0], E: [0, -1], S: [-1, 0], W: [0, 1] }[F];
      const alongRight = run.span.axis === "x" ? rightAxis[0] : rightAxis[1];
      const beyondLo = run.lo < run.span.lo - EPS, beyondHi = run.hi > run.span.hi + EPS;
      const runsOffLeft = alongRight > 0 ? beyondLo : beyondHi;
      const runsOffRight = alongRight > 0 ? beyondHi : beyondLo;
      if (runsOffLeft || runsOffRight) tags.push(runsOffLeft ? "run-wall:corner-right" : "run-wall:corner-left");
    } catch (ignored) { /* no run either: the facing carries no run-wall tag */ }
  }

  /* [underground-2, the long room] THE DEEP VIEW: the wall you face is not this
     cell's own edge. Told apart from `same-wall-image` on purpose — a wall_line
     beyond the edge is what changes the PICTURE, and a resolvable close cell is
     what changes IMAGE 1; the second implies the first and not the reverse. */
  if (!open && fc.wall_line != null && Math.abs(fc.wall_line - ownEdgeOf(room, F)) > EPS) {
    tags.push("deep-view");
  }
  /* Plan-pure by design: `sameWallImageFor` additionally waits for the close
     view's own picture to be on disk, so this says the situation EXISTS, not
     that the strip is attachable today.
     [FOUND, 2026-08-30] AND IT IS GATED ON A CLOSE VIEW THAT HAS A WALL. On the
     manor, `deepViewOf("entrance_court/S")` matches `entrance_approach/S` —
     both OPEN facings, which carry `camera_far_m` and no `camera_wall_m` — and
     returns `{close_cam: undefined, deep_cam: undefined, back_m: null}`. Both
     that backdrop and its meta are on disk, so `sameWallImageFor` passes its own
     guard and THROWS on `dv.close_cam.toFixed(1)`. The index refuses to claim a
     situation the emitter cannot compose; the defect itself is not this row's to
     fix and is reported, not patched. */
  const dv = open ? null : deepViewOf(plan, key);
  if (dv && dv.close_cam != null && dv.deep_cam != null) tags.push("same-wall-image");

  const carriers = facingCarriers(plan, loc, F);
  const count = (k) => carriers.filter((c) => c.kind === k).length;
  if (count("open_edge")) tags.push("open-side");

  const doors = count("door");
  if (doors) { tags.push("door"); if (doors >= 2) tags.push(`door:${doors}`); }
  const wins = count("window");
  if (wins) { tags.push("window"); if (wins >= 2) tags.push(`window:${wins}`); }
  /* [Kabe] SAID, and said once. `g5WallLines` pushes this line on any facing
     with no window carrier, so this tag does too — including an open one. */
  if (!wins) tags.push("no-window");

  if (count("fireplace")) tags.push("fireplace");
  if (meta && (meta.stairs || []).length) tags.push("stairs");
  if (!carriers.length) tags.push("blank");

  tags.sort((a, b) => ORDER.indexOf(tagKey(a)) - ORDER.indexOf(tagKey(b)));
  return tags;
}

/** Every `loc/F` the plan holds, in plan order then compass order. */
export function facingKeys(plan) {
  const out = [];
  for (const r of plan.rooms || []) {
    for (const f of FACINGS) if ((r.facings || {})[f]) out.push(`${r.id}/${f}`);
  }
  return out;
}

/** The whole map's situations — the report's data, and `--json`'s body. */
export function situationsReport(plan, opts = {}) {
  return facingKeys(plan).map((key) => ({ key, situations: situationsOf(plan, key, opts) }));
}

/* ------------------------------------------------------------------ */
/* The report                                                          */
/* ------------------------------------------------------------------ */

function main(argv) {
  const pack = loadPack(activePackName(argv));
  const rows = situationsReport(pack.plan);
  if (argv.includes("--json")) {
    process.stdout.write(JSON.stringify({ pack: pack.name, tags: Object.keys(TAGS), facings: rows }, null, 2) + "\n");
    return;
  }
  const w = Math.max(8, ...rows.map((r) => r.key.length));
  console.log(`# The facing playbook — pack \`${pack.name}\`, ${rows.length} facings\n`);
  console.log(`${"facing".padEnd(w)}  situations`);
  console.log(`${"-".repeat(w)}  ${"-".repeat(52)}`);
  for (const r of rows) console.log(`${r.key.padEnd(w)}  ${r.situations.join(", ")}`);
  const tally = new Map();
  for (const r of rows) for (const t of r.situations) tally.set(tagKey(t), (tally.get(tagKey(t)) || 0) + 1);
  console.log(`\n${"tag".padEnd(24)}  facings  meaning`);
  for (const k of ORDER) {
    if (!tally.has(k)) continue;
    console.log(`${k.padEnd(24)}  ${String(tally.get(k)).padStart(7)}  ${TAGS[k].split(":")[0]}`);
  }
  const unused = ORDER.filter((k) => !tally.has(k));
  if (unused.length) console.log(`\nnot prompted anywhere in this pack: ${unused.join(", ")}`);
}

if (process.argv[1] && process.argv[1].endsWith("playbook.mjs")) main(process.argv);
