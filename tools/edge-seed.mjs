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
 * location REQUIRES the strip; an indoor one takes it opportunistically.
 *
 * ORDERING IS EVERY LOCATION'S AT ROW 42, and the sentence that used to stand
 * here — "an indoor one … orders nothing" — is false from that row on. Each
 * room now picks a LEAD facing and paints it first; see the row-42 block below.
 * What is still scoped to open locations is the RING: outdoors each facing
 * continues the one at its left edge, indoors all three continue the lead.
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
import { facingCarriers } from "./plan-projection.mjs";

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

/* ------------------------------------------------------------------ */
/* [row 43] WHICH INDEX EACH PICTURE HAS                                */
/* ------------------------------------------------------------------ */
/* Row 38 wrote "Image 3" for the strip because every packet then carried a
 * style seed as Image 1 and the scaffold as Image 2. Row 40's ruling took the
 * style seed away from most packets — Image 1 is this room's own agreeing wall
 * or there is none — so the scaffold is often Image 1 and the first strip is
 * Image 2. A prompt naming an Image 3 the packet does not hold is a reference
 * the seat has to go and invent, which is how a study wall ended up in a garden
 * once already.
 *
 * So the numbering is arithmetic, in one place, and both readers use it: the
 * register (`frame-language.mjs`'s `scaffoldIndex`, the same expression) and
 * the attach list below. `seams.spec` asserts the two agree on every emitted
 * packet. */
export const scaffoldImageIndex = (style) => (style ? 2 : 1);
export const seedImageIndex = (style, n = 0) => scaffoldImageIndex(style) + 1 + n;

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

/* ------------------------------------------------------------------ */
/* [row 42] THE FIRST WALL LEADS — in every room, not only the open ones */
/* ------------------------------------------------------------------ */
/* [HUMAN, 2026-08-24, verbatim] "Can we paint the whole scene on wall 1 for a
 * room, use it to influence wall 2-4 direct where the doors should be but after
 * the fact detect the door location on the image…"
 *
 * Row 38 ordered OPEN locations because an open seam has no corner to hide in.
 * Row 42 makes the mechanism the default everywhere for a different reason: a
 * room reads as one room when its other three walls were painted with the first
 * one in front of the painter. So every location picks ONE LEAD facing, paints
 * it first, and hands it to the other three as Image 1.
 *
 * WHICH FACING LEADS, and why it is the most-carried one. The lead is the wall
 * the room's other three are answering to, so it has to be the wall that
 * actually SHOWS the room: its doorcases, its window bays, its chimneypiece.
 * A blank wall painted first hands the next three a picture of nothing, and the
 * manor has plenty of blank walls. Doors, windows and fireplaces are counted;
 * an `open_edge` is not, because it is the absence of a wall rather than
 * something standing in one.
 */
export const LEAD_KINDS = ["door", "window", "fireplace"];

/** How much of the room this facing shows — the lead choice's whole statistic. */
export function carrierLoad(plan, roomId, facing) {
  return facingCarriers(plan, roomId, facing)
    .filter((c) => LEAD_KINDS.includes(c.kind)).length;
}

/** The facing directly across the room from `facing` — two right turns. */
export function opposite(facing) {
  return neighbourAt(neighbourAt(facing, "right"), "right");
}

/**
 * The facing whose wall holds the room's ENTRY DOOR, or null where the room
 * has no door at all.
 *
 * The plan gives no room an "entry" field, so this is derived from the one
 * ordering the plan does carry: its `openings` are written from the entrance
 * inward (`op01` is the court into the great hall), so a room's entry is the
 * lowest-ordered door that joins it. Stated rather than assumed, because it is
 * the only part of the lead choice that is not a count.
 */
export function entryDoorFacing(plan, roomId) {
  const room = (plan.rooms || []).find((r) => r.id === roomId);
  if (!room) throw new Error(`edge-seed: the plan holds no room \`${roomId}\``);
  const entry = (plan.openings || [])
    .find((o) => o.kind === "door" && (o.joins || []).includes(roomId));
  if (!entry) return null;
  for (const f of FACINGS) {
    if (!(room.facings || {})[f]) continue;
    if (facingCarriers(plan, roomId, f).some((c) => c.kind === "door" && c.id === entry.id)) {
      return f;
    }
  }
  return null;
}

/**
 * The facing this room paints FIRST. The most-carried wall; on a tie, the wall
 * the entry door faces — which is the wall a person walking in is looking at,
 * and the one the room is most likely to be judged by; on a tie past that,
 * compass order, which is what a room with no door has anyway.
 */
export function leadFacing(plan, roomId) {
  const room = (plan.rooms || []).find((r) => r.id === roomId);
  if (!room) throw new Error(`edge-seed: the plan holds no room \`${roomId}\``);
  const have = FACINGS.filter((f) => (room.facings || {})[f]);
  if (!have.length) return null;
  const load = new Map(have.map((f) => [f, carrierLoad(plan, roomId, f)]));
  const most = Math.max(...load.values());
  const tied = have.filter((f) => load.get(f) === most);
  if (tied.length === 1) return tied[0];
  const entry = entryDoorFacing(plan, roomId);
  if (entry) {
    const faces = opposite(entry);
    if (tied.includes(faces)) return faces;
  }
  return tied[0];
}

/** Why this facing leads, in the words the manifest carries. */
export function leadWhy(plan, roomId, lead) {
  const room = (plan.rooms || []).find((r) => r.id === roomId);
  const have = FACINGS.filter((f) => (room.facings || {})[f]);
  const load = new Map(have.map((f) => [f, carrierLoad(plan, roomId, f)]));
  const most = load.get(lead);
  const tied = have.filter((f) => load.get(f) === most);
  const counts = have.map((f) => `${f}:${load.get(f)}`).join(" ");
  if (tied.length === 1) {
    return `the most-carried wall of this room (${counts}) — doors, windows and fireplaces`;
  }
  const entry = entryDoorFacing(plan, roomId);
  if (entry && opposite(entry) === lead) {
    return `${tied.join("/")} carry equally (${counts}), so the tie breaks to the wall the ` +
      `room's entry door (its ${entry} wall) faces`;
  }
  return `${tied.join("/")} carry equally (${counts}) and the room's entry door breaks no tie ` +
    `here, so the first in compass order leads`;
}

/**
 * One location's generation order: the lead first, then the facings that
 * continue it.
 *
 * INDOORS IT IS A STAR. "every room paints ONE facing first … the other three
 * wait for it and take it as Image 1" — so all three continue the lead
 * directly and, once the lead has a picture, all three may be painted at once.
 *
 * ON AN OPEN LOCATION IT STAYS ROW 38's RING, re-origined at the lead. That
 * row's sequence is [HUMAN] and unrevoked — "the next picture to draw should
 * automatically be one of the 90° walls in reference to the original complete
 * direction" — and it is the only construction that leaves the FOURTH facing
 * with a seam neighbour to continue, which is what an outdoor turn needs and an
 * indoor corner does not. Row 42 changes which facing the ring starts at, not
 * that there is a ring.
 *
 * `has` is what makes a facing's picture available to the next one. It defaults
 * to `isPainted` — a promoted painting — and the emitter hands in a wider one:
 * a lead that is still in the measurement loop has a CANDIDATE, and the whole
 * point of the row is that the other three follow it rather than wait for its
 * promotion.
 */
export function roomOrder(plan, roomId, has = isPainted) {
  const room = (plan.rooms || []).find((r) => r.id === roomId);
  if (!room) throw new Error(`edge-seed: the plan holds no room \`${roomId}\``);
  const have = FACINGS.filter((f) => (room.facings || {})[f]);
  if (!have.length) return [];
  const lead = leadFacing(plan, roomId);
  const open = isOpenLocation(plan, roomId);
  let chain;
  if (open) {
    chain = [];
    let f = lead;
    for (let i = 0; i < have.length; i++) {
      chain.push(f);
      let g = neighbourAt(f, "right");
      let guard = 0;
      while (!have.includes(g) && guard++ < FACINGS.length) g = neighbourAt(g, "right");
      f = g;
      if (chain.includes(f)) break;
    }
  } else {
    chain = [lead, ...have.filter((f) => f !== lead)];
  }
  const leadKey = `${roomId}/${lead}`;
  return chain.map((facing, i) => {
    /* WHAT THIS FACING CONTINUES — the lead indoors, the ring's predecessor
     * outdoors. Distinct from `depends_on`, which is that same key only while
     * it has no picture: the order is a fact about the ROOM and the dependency
     * is a fact about NOW, and a reader that conflates them either waits for a
     * wall that is already painted or paints out of order. */
    const continues = i === 0 ? null : (open ? `${roomId}/${chain[i - 1]}` : leadKey);
    return {
      facing,
      key: `${roomId}/${facing}`,
      position: i,
      lead: i === 0,
      /* Kept from row 38's shape so its own readers are unchanged: on an open
       * location position 0 IS the original complete direction. */
      origin: i === 0,
      lead_key: leadKey,
      carriers: carrierLoad(plan, roomId, facing),
      /* HAS A PICTURE, which under the emitter's own resolver is wider than
       * PROMOTED — a lead still in the measurement loop has a candidate and is
       * followed. `painted` kept its row-38 name and would have been a lie
       * here, so the field says what it means. */
      has_image: has(`${roomId}/${facing}`),
      painted: isPainted(`${roomId}/${facing}`),
      continues,
      depends_on: continues && !has(continues) ? continues : null
    };
  });
}

/**
 * An OPEN location's order — row 38's own name for it, now one view of
 * `roomOrder` rather than a second ring. Kept because the manifest, the specs
 * and `grant-content-gap` all speak of it by this name.
 */
export function openOrder(plan, roomId, painted = isPainted) {
  return roomOrder(plan, roomId, painted);
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
export function seedPlan(plan, key, opts = isPainted) {
  /* Row 38 took a `painted` predicate here and row 42 needs two more things —
   * where a wall's picture actually IS, and whether a candidate counts — so
   * the parameter widened to an options object. The old positional form is
   * still accepted, because `grant-content-gap` and the seam spec both call it
   * that way and a signature change is not what either of them is about. */
  const o = typeof opts === "function" ? { painted: opts } : (opts || {});
  const painted = o.painted || isPainted;
  /* WHERE A FACING'S PICTURE IS, and what counts as one. The default is row
   * 38's exactly: a promoted painting or nothing. The emitter hands in a wider
   * resolver so that a LEAD still in the measurement loop can be followed —
   * see `roomOrder`. */
  const imageOf = o.imageOf ||
    ((k) => painted(k) ? { rel: paintingPath(k), kind: "promoted" } : null);
  const has = (k) => !!imageOf(k);
  const [loc, facing] = key.split("/");
  const open = isOpenLocation(plan, loc);
  const room = (plan.rooms || []).find((r) => r.id === loc);
  const order = roomOrder(plan, loc, has);
  const mine = order.find((x) => x.facing === facing) || null;
  const continues = mine ? mine.continues : null;
  const candidates = SIDES.map((side) => {
    const g = neighbourAt(facing, side);
    const nk = `${loc}/${g}`;
    const exists = !!(room.facings || {})[g];
    /* A STRIP MAY BE CUT FROM A PROMOTED NEIGHBOUR — row 38 — OR FROM THE WALL
     * THIS ONE CONTINUES, whose picture may still be a candidate. The second is
     * row 42's: the lead is painted first and followed immediately, so waiting
     * for its promotion would put the room's other three walls behind the
     * measurement loop for no gain the seam can see. */
    const img = exists && (painted(nk) || nk === continues) ? imageOf(nk) : null;
    return {
      side,
      neighbour: nk,
      neighbour_edge: neighbourEdge(facing, side),
      exists,
      painted: exists && painted(nk),
      image: img,
      usable: !!img
    };
  });
  const take = candidates.find((c) => c.usable) || null;   // SIDES is left-first
  const out = {
    key,
    location: loc,
    location_type: open ? "open" : "indoor",
    policy: open ? "required" : "opportunistic",
    fraction: EDGE_FRACTION,
    side: take ? take.side : null,
    neighbour: take ? take.neighbour : null,
    neighbour_edge: take ? take.neighbour_edge : null,
    source: take ? take.image.rel : null,
    source_kind: take ? take.image.kind : null,
    /* The words that will ride with the strip, decided here rather than at the
     * cut, so a caller can ask what the ask WOULD gain without writing a file —
     * which is exactly what the grant tool's eligibility does. */
    role_sentence: take ? roleSentence(take.side) : null,
    alternatives: candidates.filter((c) => c !== take && c.exists)
      .map((c) => ({ side: c.side, neighbour: c.neighbour, painted: c.painted })),
    /* [row 42] THE ORDER IS EVERY ROOM'S NOW, so these four come off
     * `roomOrder` rather than being open-only. `depends_on` keeps row 38's
     * meaning exactly — non-null means THIS ASK WAITS — which is why every
     * reader that already routes on it keeps working. */
    lead: mine ? mine.lead_key : null,
    is_lead: !!(mine && mine.lead),
    continues,
    order_position: mine ? mine.position : null,
    depends_on: mine ? mine.depends_on : null,
    why: null
  };
  if (out.depends_on) {
    /* A LEAD NEVER REACHES HERE: it continues nothing, so its `depends_on` is
     * null by construction and the room's first wall can never wait on itself. */
    out.why = `this facing continues \`${out.depends_on}\`, which has no picture yet, so the ` +
      `ask waits for it. [row 42] Every location paints its LEAD wall first and the rest ` +
      `follow it; ` + (open
        ? "an open location follows row 38's ring from the lead, so this one waits for the " +
          "facing at its left edge"
        : "indoors the other three all follow the lead directly");
    return out;
  }
  if (take) {
    out.why = open
      ? "an open location: continuity across the turn is the point, and this neighbour has a " +
        `picture (${take.image.kind})`
      : "an indoor location: the strip anchors material tone and the wainscot line across the " +
        `corner (${take.image.kind})`;
    return out;
  }
  out.why = out.is_lead
    ? "this facing LEADS its room — the first wall painted, which continues nothing"
    : "no neighbour of this facing has a picture and what it continues is already painted; the " +
      "ask goes unseeded and the medium is carried in words";
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
/* [row 42 + row 43] TWO THINGS WIDENED THIS SIGNATURE AND THEY ARE DIFFERENT
 * QUESTIONS. `opts` is row 42's — a predicate, or an options object carrying
 * `painted` and the emitter's wider `imageOf` so a lead still in the
 * measurement loop can be followed. The trailing `{ style }` is row 43's — not
 * about WHICH strip is cut but about what INDEX it is given, because under row
 * 40's ruling the layout image is Image 1 whenever no style image rode. */
export function attachSeed(plan, key, packetDir, opts = isPainted, { style = null } = {}) {
  const plan_ = seedPlan(plan, key, opts);
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
      image_index: seedImageIndex(style),
      role_sentence: roleSentence(plan_.side, seedImageIndex(style)),
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
  /* [row 42] THE WAIT IS STATED FIRST AND IT IS STATED WHETHER OR NOT A STRIP
   * RODE. Under row 38 a waiting facing never had a seed, so the two were the
   * same sentence; under row 42 a facing can hold a strip from one painted
   * neighbour and still be waiting for its room's LEAD, and a packet that says
   * only "here is your edge seed" is a packet a seat will paint out of order. */
  const wait = s.depends_on
    ? `> **This ask WAITS for \`${s.depends_on}\`. Do not paint it until that wall's picture ` +
      `is on disk.**\n>\n> [row 42] Every location paints one wall first — its LEAD, the ` +
      `most-carried wall — and the other three are painted with the lead's own picture in ` +
      `front of the painter, which is what makes the four read as one room. ` +
      (s.location_type === "open"
        ? `${s.location} is an open location, so its facings follow row 38's ring from the ` +
          `lead and this one continues \`${s.depends_on}\`.`
        : `This facing continues \`${s.depends_on}\`, which has no picture yet.`) +
      `\n\n`
    : "";
  if (!seed) return wait;
  /* [row 43] THE INDEX IS THE SEED'S OWN, NEVER 3 BY HABIT — row 38 wrote 3
   * because every packet then carried a style image as 1 and the scaffold as 2,
   * and row 40's ruling took the style image off most packets. */
  return wait +
    `**Image ${s.image_index || 3} is this wall's edge seed.** ` +
    `\`${seedFileName(s.side)}\` is the ` +
    `${Math.round(s.fraction * 100)} % of \`${s.source}\` that abuts this picture — its ` +
    `${s.neighbour_edge}-hand ${s.width_px} columns, full frame height, cut by ` +
    `\`tools/crop-edge-seed.py\` (sha256 \`${s.sha256.slice(0, 12)}\` from a painting at ` +
    `\`${s.source_sha256.slice(0, 12)}\`). The prompt names its role in words: ` +
    `_${s.role_sentence}_\n\n` +
    `Seeding here is **${s.policy}** — ${s.why}.\n\n`;
}

/** The attach line's own sentence, so the two emit paths cannot word it differently.
 *
 *  [row 40, Kabe's ruling] IMAGE 1 IS THIS ROOM'S OWN WALL OR THERE IS NO
 *  IMAGE 1. `style` is what `attachStyle` returned — `null` where the room
 *  has no agreeing wall whose own ask was its ruling, which is most of them
 *  today. A packet that ships no style picture says so in as many words, here
 *  and in the prompt, because a seat told to attach a file that is not in the
 *  directory will go and find one. */
export function attachLine(seed, style) {
  const one = style
    ? styleAttachPhrase(style)
    : null;
  const two = `\`scaffold.png\` as **Image ${scaffoldImageIndex(style)}**`;
  const three = seed
    ? `\`${seedFileName(seed.side)}\` as **Image ${seed.image_index || seedImageIndex(style)}**`
    : null;
  const parts = [one, two, three].filter(Boolean);
  const list = parts.length > 1
    ? parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1]
    : parts[0];
  return (one ? "Attach " : "There is NO Image 1 in this packet and none is to be found " +
    "elsewhere — the medium is in the prompt's own words. Attach ") + list + ", in that";
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
 * Cut a strip for every allowed side into `packetDir`, numbering the roles from
 * one above the layout image upward in SIDES order — `opts.style` is what
 * decides which index that is. Returns the seeds actually cut.
 */
export function attachSeeds(plan, key, packetDir, opts = {}) {
  const style = opts.style || null;
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
      image_index: seedImageIndex(style, seeds.length),
      role_sentence: roleSentence(pl.side, seedImageIndex(style, seeds.length)),
      file: join(packetDir, seedFileName(pl.side)).slice(ROOT.length + 1),
      width_px: cut.width_px, height_px: cut.height_px,
      columns: cut.columns, sha256: cut.sha256,
      source_sha256: cut.source_sha256
    });
  }
  return { seeds, plans };
}

/**
 * The PACKET.md paragraph for Image 1, where a packet has one.
 *
 * [2026-08-25] IT NAMES THE DERIVED FILE, THE WALL IT WAS CUT FROM AND BOTH
 * DIGESTS, for the reason every edge strip's note gives its own: a reference
 * image that cannot be proved against the painting it claims to come from is a
 * picture with a story attached. `attachStyle` is what fills these fields, and a
 * packet with no Image 1 gets no paragraph — `attachLine` already says so.
 */

/* [Kabe, 2026-08-30] THE ATTACH LINE SAYS WHAT IMAGE 1 ACTUALLY IS, in the same
   three cases `stylePacketNote` speaks: the corrected previous painting, the
   same wall shrunk true, or the derived seed. One phrase, decided here, so the
   attach line and the paragraph cannot disagree. */
function styleAttachPhrase(style) {
  const what = style.corrected_previous
    ? `the previous painting of this very view, geometry-corrected for repainting`
    : style.true_shape_recreate
      ? `the warp's geometry-exact output of this very view, objects to be redrawn true`
    : style.frame_draft
      ? `the true picture at correct aspect, declared geometry drawn as guide lines to complete to`
    : style.same_wall
      ? `${style.room}/${style.facing}, the SAME wall promoted, shrunk true, stretched filler at the margins`
      : `${style.room}/${style.facing}, this room's own wall with its openings removed`;
  return `\`${style.file}\` as **Image 1** (${what})`;
}

export function stylePacketNote(style) {
  if (!style) return "";
  const s12 = (h) => (h ? String(h).slice(0, 12) : "unrecorded");
  /* [Kabe, 2026-08-30] THE DEEP FACING'S IMAGE 1 IS THE WALL ITSELF. A long
     room's deep ask carries the promoted CLOSE painting raw — its content is
     the point — and says so, instead of the derived-seed paragraph whose every
     claim ("no architecture at all") would be false of it. */
  if (style.same_wall && style.corrected_previous) {
    return `**Image 1 IS THE PREVIOUS PAINTING OF THIS VERY VIEW, GEOMETRY-CORRECTED** — \`${style.file}\`, ` +
      `built by \`tools/deep-draft.py --correct\` from \`${style.derived_from}\` (archived as \`previous.png\` ` +
      `beside its round document): ONE uniform scale, so every shape keeps its aspect, then evenly-distributed ` +
      `blended-line insertion per band until every pin of the warp's round document lands exactly — geometrically ` +
      `true, slightly stuttered [Kabe's mechanism, 2026-08-30]. The prompt asks for the picture to be REPAINTED ` +
      `CLEAN: everything exactly where Image 1 puts it, the stutter gone.

`;
  }
  if (style.same_wall && style.true_shape_recreate) {
    return `**Image 1 IS THE WARP'S OWN OUTPUT for this very view** — \`${style.file}\`, copied from ` +
      `\`${style.derived_from}\`: architecture geometry-exact and full-frame, objects ovalled by the ` +
      `per-axis correction. The prompt inverts the usual ask: keep every line of architecture and the ` +
      `framing exactly, redraw every OBJECT in its true shape (a circle stays a circle) [true-shape ` +
      `recreate, 2026-08-30 — the painter re-normalizes shapes unless ordered to copy, and a full-frame ` +
      `reference leaves nothing to zoom into].

`;
  }
  if (style.same_wall && style.frame_draft) {
    return `**Image 1 IS THE FRAME DRAFT of the very view this packet paints** — \`${style.file}\`, ` +
      `built by \`tools/deep-draft.py\` (mode frame) from \`${style.derived_from}\`: the true picture ` +
      `shrunk by ONE uniform factor (shapes true, a circle stays a circle), its wrong-camera junctions ` +
      `cut off, and the DECLARED geometry drawn as ink guide lines out to the frame edges [Kabe's frame ` +
      `recipe, 2026-08-30]. The prompt asks for the picture to be COMPLETED: centre kept exactly, the ` +
      `room painted out to the guide lines, no line left visible.

`;
  }
  if (style.same_wall) {
    return `**Image 1 IS THE DEEP DRAFT of the very view this packet paints** — \`${style.file}\`, ` +
      `built mechanically by \`tools/deep-draft.py\` from the promoted \`${style.rel}\` ` +
      `(${style.room}/${style.facing}, the SAME wall): the true picture shrunk uniformly to the correct ` +
      `proportion at the centre, mechanically stretched filler at the margins. The prompt asks for the ` +
      `picture to be RECREATED: centre kept exactly, filler replaced with the room continuing.

`;
  }
  return `**Image 1 is a DERIVED style seed, not a wall.** \`${style.file}\` is ` +
    `\`${style.derived_from}\` — ${style.room}/${style.facing}, this room's own wall ` +
    `(sha256 \`${s12(style.source_sha256)}\`) — with every opening and carrier on it filled in ` +
    `from that wall's OWN adjacent fabric by \`tools/style-seed.mjs\`: ` +
    `${style.filled_rects} rectangle(s), ${style.filled_pct_of_wall} % of the wall, the floor and ` +
    `the ceiling untouched. The fill report rides beside it as \`${style.report_file}\` and the ` +
    `store's copy is \`${style.derived_store}\` (sha256 \`${s12(style.sha256)}\`). ` +
    `${style.verified || ""} So it carries this room's materials, its palette and its light and NO ` +
    `ARCHITECTURE AT ALL: how many openings the wall being painted carries, where they stand and ` +
    `every dimension of them come from the layout image and the words.

`;
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
export function attachLineAll(seeds, style) {
  const parts = (style
    ? [styleAttachPhrase(style)]
    : [])
    .concat([`\`scaffold.png\` as **Image ${scaffoldImageIndex(style)}**`])
    .concat(seeds.map((s) => `\`${seedFileName(s.side)}\` as **Image ${s.image_index}**`));
  const lead = style ? "Attach " : "There is NO Image 1 in this packet and none is to be found " +
    "elsewhere — the medium is in the prompt's own words. Attach ";
  return lead + (parts.length > 1
    ? parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1]
    : parts[0]) + ", in that";
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
