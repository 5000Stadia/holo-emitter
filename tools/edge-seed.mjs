/**
 * Edge seeding (row 38) — the completed neighbour's own pixels, at the edge the
 * next picture continues from.
 *
 * [HUMAN, 2026-08-24, verbatim] "my wall panel design May work well on the edges
 * when inside of a home, but if we are on a nice country hillside outside, the
 * edges of one may not stylistically be enforced on the edges of the direction
 * when you turn 90°. … the side of the completed picture which is adjacent to
 * the wall about to be developed should have that sides 10% of the picture
 * cropped and sent as an additional reference picture, with a description that
 * this is a reference image of what should be sitting on the left/right edge"
 *
 * Extended the same day, verbatim: "It may be helpful to even do that inside if
 * we are having to generate anytging fresh" — so a seed is the DEFAULT for any
 * fresh full-frame ask whose adjacent facing is already painted. An OPEN
 * location requires it and orders its facings for it; an indoor one takes it
 * opportunistically and orders nothing.
 *
 * THE DIVISION IS ROW 34's, APPLIED TO A SEAM. The reference carries appearance
 * — what a reference image is actually good at — and the words carry the ROLE,
 * which is what text is good at and what an unlabelled third image would leave
 * the generator to guess. `roleSentence()` composes it, naming the image by
 * index and by side, per the cookbook rule.
 *
 * ------------------------------------------------------------------ *
 * THE ADJACENCY TABLE, AND WHERE IT COMES FROM                        *
 * ------------------------------------------------------------------ *
 *
 *   facing | its LEFT edge abuts  | cut from that     | its RIGHT edge abuts | cut from that
 *   -------|----------------------|-------------------|----------------------|--------------
 *     N    | W                    | W's right 10 %    | E                    | E's left 10 %
 *     E    | N                    | N's right 10 %    | S                    | S's left 10 %
 *     S    | E                    | E's right 10 %    | W                    | W's left 10 %
 *     W    | S                    | S's right 10 %    | N                    | N's left 10 %
 *
 * NOTHING IN THAT TABLE IS TYPED. It is computed below from `RIGHT` and
 * `NORMAL` in `tools/validate-plan.mjs` — the project's own convention, which
 * the whole projection pipeline already runs on — by one identity:
 *
 *     RIGHT[F] === NORMAL[G]   means G is the facing F's right edge looks toward
 *
 * Standing facing N your right hand points east (`RIGHT.N = [1, 0]`), and east
 * is the direction facing E looks along (`NORMAL.E = ["x", +1]`). So the world
 * that leaves the right of N's frame is the world E is pointed at, and it
 * enters E's frame from the LEFT. The left neighbour is the same identity with
 * the sign flipped. The involution — `neighbourAt(neighbourAt(F,"right"),"left") === F`
 * — is asserted in `seams.spec.mjs` rather than assumed here.
 *
 * VERIFIED AGAINST THE REAL DRAWING, not against the story. For every room in
 * `fixtures/demo-study/plan.json`, take the world point at the right-hand end of
 * facing F's wall line and the world point at the left-hand end of its right
 * neighbour's wall line — through `viewSpan` and `RIGHT`, which is how
 * `plan-projection.mjs` measures every carrier across a view. They are the SAME
 * POINT on 86 of the 88 pairs: the shared corner of the room. The two that
 * differ are `entrance_court/E→S` and `entrance_court/S→W`, and they differ for
 * a stated reason rather than a mysterious one — an OPEN facing's `wall_line`
 * is its FAR line, tens of metres out, so the two points sit on different depth
 * planes while the frames still abut in yaw. `seams.spec.mjs` pins that count
 * and that exception set, so a plan change that breaks the convention is caught
 * by the test rather than by a painter.
 *
 * WHAT THE SEED IS NOT, said plainly. The frames do not literally touch: the
 * ruled lens is 24 mm on a 36 mm frame, hFOV 73.74°, so turning 90° leaves a
 * 16.26° wedge of world that neither picture shows. The strip is therefore what
 * the neighbouring picture ENDS with rather than a strip the new picture must
 * reproduce column for column, and the seam metric
 * (`design/plan-draft/measured/seam_measure.py`) is comparative for exactly
 * this reason — before against after, never against a perfect zero.
 *
 * WHICH SIDE, WHEN BOTH NEIGHBOURS ARE PAINTED. The left seed wins. The row's
 * own sequence is a turn to the right from the first completed direction, so
 * the picture being painted always has the finished one at its LEFT edge; the
 * right seed is what a location painted out of that order falls back to. The
 * one not taken is recorded in the packet's manifest entry as an alternative,
 * because the image list is three long by the row's ruling and a fourth image
 * would be a different ask.
 */
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

import { RIGHT, NORMAL, FACINGS, viewSpan } from "./validate-plan.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CROP = join(ROOT, "tools", "crop-edge-seed.py");

/** Kabe's ten per cent. One home; the crop and the metric both read it. */
export const EDGE_FRACTION = 0.10;

/** The two sides of a picture, in the order the table above is written. */
export const SIDES = ["left", "right"];

const vecOf = (facing) => {
  const [axis, sign] = NORMAL[facing];
  return axis === "x" ? [sign, 0] : [0, sign];
};
const same = (a, b) => a[0] === b[0] && a[1] === b[1];

/**
 * The facing whose picture abuts this one at `side` — derived, per the header.
 *
 * `right`: the neighbour is pointed at where our right edge looks, `RIGHT[F]`.
 * `left`:  the neighbour is pointed at where our left edge looks, `-RIGHT[F]`.
 */
export function neighbourAt(facing, side) {
  if (!FACINGS.includes(facing)) throw new Error(`edge-seed: no facing \`${facing}\``);
  if (!SIDES.includes(side)) throw new Error(`edge-seed: no side \`${side}\``);
  const want = side === "right" ? RIGHT[facing] : [-RIGHT[facing][0], -RIGHT[facing][1]];
  const g = FACINGS.find((f) => same(vecOf(f), want));
  if (!g) throw new Error(`edge-seed: nothing faces ${want} — the convention tables disagree`);
  return g;
}

/**
 * The neighbour's OWN side that our `side` edge meets, derived by the
 * involution rather than by writing "the opposite one": whichever of the
 * neighbour's sides names us back.
 */
export function neighbourEdge(facing, side) {
  const g = neighbourAt(facing, side);
  const back = SIDES.find((s) => neighbourAt(g, s) === facing);
  if (!back) {
    throw new Error(
      `edge-seed: ${facing}'s ${side} neighbour ${g} does not name ${facing} back on either ` +
      `side, so the compass ring is not a ring`);
  }
  return back;
}

/** The whole table, as rows — what the header prints and the spec recomputes. */
export function adjacencyTable() {
  return FACINGS.map((facing) => {
    const row = { facing };
    for (const side of SIDES) {
      row[side] = {
        neighbour: neighbourAt(facing, side),
        neighbour_edge: neighbourEdge(facing, side)
      };
    }
    return row;
  });
}

/**
 * The role sentence, verbatim per row 38. The image is named by INDEX and by
 * ROLE and the interaction is stated — reference images carry appearance, text
 * carries what to do with it.
 */
export function roleSentence(side, index = 3) {
  if (!SIDES.includes(side)) throw new Error(`edge-seed: no side \`${side}\``);
  return `Image ${index} is a reference of exactly what sits at this picture's ${side} edge ` +
    `- the scene continues from it seamlessly.`;
}

/** Where a promoted painting lives, and whether it is really there. */
export const paintingPath = (key) => {
  const [loc, f] = key.split("/");
  return `backdrops/${loc}/${f}.png`;
};
export function isPainted(key) {
  const [loc, f] = key.split("/");
  return existsSync(join(ROOT, "backdrops", loc, `${f}.png`)) &&
    existsSync(join(ROOT, "backdrops", loc, `${f}.meta.json`));
}

/** An OPEN location is one with no wall corners to break a seam: the row's scope. */
export function isOpenLocation(plan, roomId) {
  const room = (plan.rooms || []).find((r) => r.id === roomId);
  if (!room) throw new Error(`edge-seed: the plan holds no room \`${roomId}\``);
  return room.type === "open";
}

/**
 * One open location's generation order: the ring, starting at the first
 * completed direction, each facing depending on the one at its left edge.
 *
 * "the next picture to draw should automatically be one of the 90° walls in
 * reference to the original complete direction" — so the origin is a PAINTED
 * facing where the location has one, and the first facing in compass order
 * where it has none (that one is the original complete direction, painted
 * unseeded, because nothing exists yet for it to continue).
 */
export function openOrder(plan, roomId, painted = isPainted) {
  const room = (plan.rooms || []).find((r) => r.id === roomId);
  if (!room) throw new Error(`edge-seed: the plan holds no room \`${roomId}\``);
  const have = FACINGS.filter((f) => (room.facings || {})[f]);
  if (!have.length) return [];
  const origin = have.find((f) => painted(`${roomId}/${f}`)) || have[0];
  const chain = [];
  let f = origin;
  for (let i = 0; i < have.length; i++) {
    chain.push(f);
    let g = neighbourAt(f, "right");
    let guard = 0;
    while (!have.includes(g) && guard++ < FACINGS.length) g = neighbourAt(g, "right");
    f = g;
    if (chain.includes(f)) break;
  }
  return chain.map((facing, i) => ({
    facing,
    key: `${roomId}/${facing}`,
    position: i,
    painted: painted(`${roomId}/${facing}`),
    origin: i === 0,
    /* The origin continues nothing; every other facing continues the picture at
     * its left edge, which is the one before it in a right-turning ring. */
    depends_on: i === 0 ? null : `${roomId}/${chain[i - 1]}`
  }));
}

/**
 * What this facing's ask should carry, and what it must wait for.
 *
 * Returns, always:
 *   policy          "required" on an open location, "opportunistic" indoors
 *   side            this picture's edge the seed sits at, or null
 *   neighbour       the painted facing the strip is cut from, or null
 *   neighbour_edge  the side of THAT picture which is cut
 *   depends_on      the key this ask waits for (open locations only), or null
 *   alternatives    the painted neighbour not taken, recorded rather than sent
 *
 * The ordering exception is scoped here and nowhere else: `depends_on` is null
 * for every indoor facing by construction, so one-pass parallelism survives
 * everywhere the row did not license an exception.
 */
export function seedPlan(plan, key, painted = isPainted) {
  const [loc, facing] = key.split("/");
  const open = isOpenLocation(plan, loc);
  const room = (plan.rooms || []).find((r) => r.id === loc);
  const candidates = SIDES.map((side) => {
    const g = neighbourAt(facing, side);
    return {
      side,
      neighbour: `${loc}/${g}`,
      neighbour_edge: neighbourEdge(facing, side),
      exists: !!(room.facings || {})[g],
      painted: !!(room.facings || {})[g] && painted(`${loc}/${g}`)
    };
  });
  const take = candidates.find((c) => c.painted) || null;   // SIDES is left-first
  const out = {
    key,
    location: loc,
    location_type: open ? "open" : "indoor",
    policy: open ? "required" : "opportunistic",
    fraction: EDGE_FRACTION,
    side: take ? take.side : null,
    neighbour: take ? take.neighbour : null,
    neighbour_edge: take ? take.neighbour_edge : null,
    source: take ? paintingPath(take.neighbour) : null,
    /* The words that will ride with the strip, decided here rather than at the
     * cut, so a caller can ask what the ask WOULD gain without writing a file —
     * which is exactly what the grant tool's eligibility does. */
    role_sentence: take ? roleSentence(take.side) : null,
    alternatives: candidates.filter((c) => c !== take && c.exists)
      .map((c) => ({ side: c.side, neighbour: c.neighbour, painted: c.painted })),
    depends_on: null,
    why: null
  };
  if (take) {
    out.why = open
      ? "an open location: continuity across the turn is the point, and this neighbour is painted"
      : "an indoor location: the strip anchors material tone and the wainscot line across the corner";
    return out;
  }
  if (!open) {
    out.why = "no neighbour of this facing is painted; indoors the seed is opportunistic, so the " +
      "ask goes unseeded exactly as it did before this row";
    return out;
  }
  /* AN OPEN FACING WITH NOTHING PAINTED BESIDE IT — the licensed exception.
   * Which one it waits for is the ring's, not a preference: the facing at its
   * left edge, unless this facing IS the location's origin, in which case it
   * is the original complete direction and waits for nothing. */
  const order = openOrder(plan, loc, painted);
  const mine = order.find((o) => o.facing === facing);
  out.depends_on = mine ? mine.depends_on : null;
  out.order_position = mine ? mine.position : null;
  out.why = out.depends_on
    ? `an open location whose seed neighbour \`${out.depends_on}\` is not painted: this facing ` +
      `waits for it. That is row 38's one licensed exception to one-pass parallelism and it is ` +
      `scoped to open locations`
    : "an open location's origin — the first completed direction, which continues nothing";
  return out;
}

/**
 * Cut the strip. `side` is THIS picture's edge (what the prompt names);
 * `cut` is the side of the SOURCE painting that is taken, which is the
 * neighbour's own abutting edge.
 */
export function cutEdgeSeed({ source, cut, out, fraction = EDGE_FRACTION }) {
  if (!existsSync(source)) throw new Error(`edge-seed: no painting at ${source}`);
  mkdirSync(dirname(out), { recursive: true });
  const text = execFileSync("python3", [CROP, source, out, cut, String(fraction)],
    { encoding: "utf8" });
  return JSON.parse(text.trim());
}

/** `edge-seed-left.png` / `edge-seed-right.png`, named for the edge it sits at. */
export const seedFileName = (side) => `edge-seed-${side}.png`;

/**
 * The whole seed, cut and recorded, for one packet directory — or null where
 * this facing has no painted neighbour. The returned object is what the
 * manifest entry carries and what `manorPrompt` is handed.
 */
export function attachSeed(plan, key, packetDir, painted = isPainted) {
  const plan_ = seedPlan(plan, key, painted);
  /* A PACKET HOLDS AT MOST ONE STRIP, and the emitter is re-runnable — so a
   * packet cut again after its seam neighbour changed (the other side painted,
   * or a demotion) must not be left holding yesterday's strip beside today's
   * prompt. Both names are cleared before the chosen one is written; the file
   * on disk and the sentence in the prompt are one decision or neither. */
  for (const s of SIDES) {
    const stale = join(packetDir, seedFileName(s));
    if (existsSync(stale)) rmSync(stale);
  }
  if (!plan_.neighbour) return { seed: null, plan: plan_ };
  const cut = cutEdgeSeed({
    source: join(ROOT, plan_.source),
    cut: plan_.neighbour_edge,
    out: join(packetDir, seedFileName(plan_.side))
  });
  return {
    seed: {
      ...plan_,
      file: join(packetDir, seedFileName(plan_.side)).slice(ROOT.length + 1),
      width_px: cut.width_px,
      height_px: cut.height_px,
      columns: cut.columns,
      sha256: cut.sha256,
      source_sha256: cut.source_sha256
    },
    plan: plan_
  };
}

/**
 * What the packet tells the seat: which file is Image 3, where those pixels
 * came from, and — where the location is open and the neighbour is not painted
 * yet — that this ask waits.
 *
 * ONE HOME FOR IT, because `--emit-manor` and `--emit-retries` both write a
 * PACKET.md and a seat reading two differently-worded notes about one mechanism
 * has to work out whether they mean the same thing.
 */
export function packetNote(seed, plan_) {
  const s = seed || plan_;
  if (!s) return "";
  if (!seed) {
    if (!s.depends_on) return "";
    return `> **This ask waits for \`${s.depends_on}\`.**\n>\n> ${s.location} is an open ` +
      `location — no wall corners stand between its facings, so a seam here is a seam in open ` +
      `country. Its facings are painted in adjacency order from the first completed direction, ` +
      `and this one continues \`${s.depends_on}\`, which is not painted yet. Row 38's one ` +
      `licensed exception to one-pass parallelism, and it is scoped to open locations.\n\n`;
  }
  return `**Image 3 is this wall's edge seed.** \`${seedFileName(s.side)}\` is the ` +
    `${Math.round(s.fraction * 100)} % of \`${s.source}\` that abuts this picture — its ` +
    `${s.neighbour_edge}-hand ${s.width_px} columns, full frame height, cut by ` +
    `\`tools/crop-edge-seed.py\` (sha256 \`${s.sha256.slice(0, 12)}\` from a painting at ` +
    `\`${s.source_sha256.slice(0, 12)}\`). The prompt names its role in words: ` +
    `_${s.role_sentence}_\n\n` +
    `Seeding here is **${s.policy}** — ${s.why}.\n\n`;
}

/** The attach line's own sentence, so the two emit paths cannot word it differently. */
export function attachLine(seed) {
  return seed
    ? "Attach `style-seed-warm.png` as **Image 1**, `scaffold.png` as **Image 2** and " +
      `\`${seedFileName(seed.side)}\` as **Image 3**, in that`
    : "Attach `style-seed-warm.png` as **Image 1** and `scaffold.png` as **Image 2**, in that";
}

/* ------------------------------------------------------------------ */
/* [row 40] BOTH SIDES, AND ONLY FROM WALLS THAT AGREE                  */
/* ------------------------------------------------------------------ */
/* Row 38 attaches ONE strip, left-first, because a fresh ask only needs an
 * anchor: any painted neighbour will do to carry material tone across a
 * corner. A CONSISTENCY re-ask is a different job. The wall is being repainted
 * precisely because it disagrees with the room, so the strips are not an
 * anchor, they are the EVIDENCE of what the room already is — and a wall
 * caught between two painted neighbours should be shown both of them, so the
 * ask is boxed in on the left and on the right at once.
 *
 * The second rule matters more than the first: a seed may only be cut from a
 * facing the measure puts in the room's MAJORITY. Seeding an outlier from
 * another outlier is how a wrong material spreads round a room instead of
 * being replaced, and the whole point of this path is that it cannot. Where a
 * room has no majority at all (`room_consistency.json` says so — the master
 * bedchamber splits two and two) NO strip is cut and the ruling comes from the
 * room's voice alone, which is the only authority left standing.
 *
 * `attachSeed` is untouched: row 38's path and its spec still see exactly one
 * strip and exactly one Image 3. */

/** Every side of `key` whose neighbour is painted AND passes `allow`. */
export function seedPlansAll(plan, key, { painted = isPainted, allow = null } = {}) {
  const [loc, facing] = key.split("/");
  const room = (plan.rooms || []).find((r) => r.id === loc);
  if (!room) throw new Error(`edge-seed: no room \`${loc}\` in the plan`);
  const open = isOpenLocation(plan, loc);
  const out = [];
  for (const side of SIDES) {
    const g = neighbourAt(facing, side);
    const nk = `${loc}/${g}`;
    const exists = !!(room.facings || {})[g];
    const isPaintedNow = exists && painted(nk);
    const allowed = isPaintedNow && (!allow || allow(nk));
    out.push({
      key, location: loc, location_type: open ? "open" : "indoor",
      policy: open ? "required" : "opportunistic",
      fraction: EDGE_FRACTION, side,
      neighbour: nk, neighbour_edge: neighbourEdge(facing, side),
      source: paintingPath(nk),
      exists, painted: isPaintedNow, allowed,
      depends_on: null,
      why: !exists ? "this facing has no neighbour on that side in the plan"
        : !isPaintedNow ? "that neighbour is not painted"
        : !allowed ? "that neighbour is itself outside the room's agreeing walls, "
          + "so its pixels are not evidence of what the room is"
        : "a painted neighbour the measure puts inside the room's agreeing walls"
    });
  }
  return out;
}

/**
 * Cut a strip for every allowed side into `packetDir`, numbering the roles
 * from Image 3 upward in SIDES order. Returns the seeds actually cut.
 */
export function attachSeeds(plan, key, packetDir, opts = {}) {
  const plans = seedPlansAll(plan, key, opts);
  for (const sd of SIDES) {                      // never leave a stale strip
    const stale = join(packetDir, seedFileName(sd));
    if (existsSync(stale)) rmSync(stale);
  }
  const seeds = [];
  for (const pl of plans) {
    if (!pl.allowed) continue;
    const cut = cutEdgeSeed({
      source: join(ROOT, pl.source),
      cut: pl.neighbour_edge,
      out: join(packetDir, seedFileName(pl.side))
    });
    seeds.push({
      ...pl,
      image_index: 3 + seeds.length,
      role_sentence: roleSentence(pl.side, 3 + seeds.length),
      file: join(packetDir, seedFileName(pl.side)).slice(ROOT.length + 1),
      width_px: cut.width_px, height_px: cut.height_px,
      columns: cut.columns, sha256: cut.sha256,
      source_sha256: cut.source_sha256
    });
  }
  return { seeds, plans };
}

/** The PACKET.md paragraph for a list of strips — the plural of `packetNote`. */
export function packetNoteAll(seeds, plans) {
  if (!seeds.length) {
    const why = (plans || []).map((p) => `\`${p.neighbour}\` — ${p.why}`).join("; ");
    return `**No edge seed rides with this ask.** ${why || "no neighbour is available"}. ` +
      `The materials are named in words in the prompt instead, and the words are the ` +
      `room's own ruling out of \`tools/room-voices.mjs\` — not another wall's pixels.

`;
  }
  return seeds.map((s) =>
    `**Image ${s.image_index} is this wall's ${s.side}-edge seed.** ` +
    `\`${seedFileName(s.side)}\` is the ${Math.round(s.fraction * 100)} % of ` +
    `\`${s.source}\` that abuts this picture — its ${s.neighbour_edge}-hand ` +
    `${s.width_px} columns, full frame height, cut by \`tools/crop-edge-seed.py\` ` +
    `(sha256 \`${s.sha256.slice(0, 12)}\` from a painting at ` +
    `\`${s.source_sha256.slice(0, 12)}\`). It is one of the walls this room AGREES ` +
    `on, which is why it is here. The prompt names its role in words: ` +
    `_${s.role_sentence}_

`).join("");
}

/** The attach line for a list of strips — the plural of `attachLine`. */
export function attachLineAll(seeds) {
  const parts = ["`style-seed-warm.png` as **Image 1**", "`scaffold.png` as **Image 2**"]
    .concat(seeds.map((s) => `\`${seedFileName(s.side)}\` as **Image ${s.image_index}**`));
  return "Attach " + parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1] +
    ", in that";
}

/**
 * The world point at one end of a facing's wall line — the geometry the header's
 * verification runs on, exported so the spec recomputes it rather than
 * trusting a comment.
 */
export function wallLineEnd(room, facing, end) {
  const fc = (room.facings || {})[facing];
  if (!fc) throw new Error(`edge-seed: ${room.id} has no facing ${facing}`);
  const span = viewSpan(room.rect, facing);
  const alongRight = span.axis === "x" ? RIGHT[facing][0] : RIGHT[facing][1];
  const rightEnd = alongRight > 0 ? span.hi : span.lo;
  const leftEnd = alongRight > 0 ? span.lo : span.hi;
  const p = {};
  p[NORMAL[facing][0]] = fc.wall_line;
  p[span.axis] = end === "right" ? rightEnd : leftEnd;
  return { x: p.x, y: p.y };
}
