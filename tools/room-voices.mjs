/* room-voices.mjs — the material voice of every room, derived from the plan.
 *
 * WHY THIS FILE EXISTS. [HUMAN, 2026-08-24, verbatim, first walk of the painted
 * manor]: "is every room in this house parlor walls?" It was. `manorPrompt`'s
 * `ROOM_MATERIALS` table was keyed on `room.archetype`, the plan carries only
 * six archetypes (`chamber`, `hall`, `corridor`, `stair`, `service`, `open`),
 * and `service` and `stair` were not in the table at all — so the KITCHEN, the
 * BUTTERY, the SERVANTS' HALL and both stairs fell through to the `chamber`
 * default and were asked for "dark hand-finished oak wall panelling ... wide
 * worn oak floorboards", which is the STUDY's own paragraph. Kabe walked into a
 * scullery panelled like a parlour and said so.
 *
 * And [HUMAN, same walk]: "exterior garden has interior wall outside" — the
 * privy garden was asked for a wainscot chair-rail because the chair-rail is
 * hard-wired into the prompt AND into the scaffold's own stamped label, so the
 * diagram a painter was handed literally drew a chair-rail across a garden.
 *
 * `design/production-law.md` clause 6 is the acceptance test for the fix: the
 * NEXT map, with none of that conversation in context, must get this for free.
 * So the voice is not prose in a packet — it is a table in code, resolved from
 * the plan's own room ids, and every wall of every future plan resolves through
 * it before a prompt exists.
 *
 * ── THE ONE RULER, AND WHY EVERY VOICE STILL DECLARES 0.95 m ──────────────
 *
 * The measurement instrument (`design/plan-draft/measured/row23_lib.py`) reads
 * ONE horizontal: a strong line inside the `rail_band` the scaffold's own
 * `brackets()` declares, and it converts it with `ppm = rail_above / 0.95`.
 * That band and that divisor are the instrument's, not the emitter's, and this
 * file may not move them.
 *
 * So a kitchen cannot simply drop the anchor: a wall with no ruler in it is the
 * `prompt.unmeasurable_by_design` miss the lint already exists to refuse, and
 * hall/N and hall/S were WITHHELD twice for exactly that.
 *
 * What changes per voice is therefore the anchor's FEATURE and its NAME, never
 * its height: every voice names a continuous horizontal running corner to
 * corner at 0.95 m above the floor or ground, and each one is a real thing that
 * room would have had in 1660 —
 *
 *   wainscot chair-rail   panelled rooms: hall, parlours, gallery, chambers
 *   plain dado capping    the back stair: boarded dado under limewash
 *   hanging rail          kitchen, buttery, servants' hall: the plain scrubbed
 *                         oak peg-rail every service room hung its gear from
 *   string-course         a garden or court wall: the stone course capping the
 *                         brick plinth, which is how such walls were built
 *   coping                an open facing with no wall: the low boundary wall
 *                         that closes a forecourt or a park pale
 *
 * The gate measures the same length in every room; the painter is asked for a
 * different object. That is the whole of the reconciliation, and it is stated
 * here rather than discovered.
 *
 * ── HERALDRY (finding b) ──────────────────────────────────────────────────
 *
 * [HUMAN, same walk]: "this same window everywhere? With the ensignias on it?"
 * Armorial painted glass in a c.1660 gentry house was not general glazing: it
 * was a display of lineage, set in the GREAT HALL's window, and at most a
 * single shield in the principal parlour. Everywhere else the glass is plain
 * diamond quarrels of greenish crown glass in lead cames. That is period
 * practice and it is also the repetition breaker, so `glass` below rations it
 * to exactly those two rooms and every other voice carries the negative.
 *
 * ── [ROW 44] AND WHY THE TABLE IS NO LONGER IN THIS FILE ──────────────────
 *
 * Everything the header above argues for is still true; only its ADDRESS
 * changed. `design/production-law.md` clause 8, adopted 2026-08-28: "the theme
 * never bleeds into the code". A voice table declared here is the manor
 * declared in the engine — `packs/INVENTORY.md` counts 183 of this file's own
 * lines naming the manor's materials — and a second location could not be
 * authored without editing this file. So the DATA moved to
 * `packs/<name>/voices.json` and this file kept the REASONING and the
 * resolution rules, which are the engine's: how a facing reaches a voice, how a
 * window sentence is composed from the plan's own openings, what a material may
 * have been called before. The table is loaded, the rules are code, and the
 * refusals below still fire by name.
 */

import { activePack } from "./pack.mjs";

/* THE ACTIVE LOCATION. `--pack <name>`, else `HOLO_PACK`, else `manor`. Read at
 * module load because every export below is a `const` this file's callers
 * import directly, and because a run paints one location. `pack.mjs` has
 * already refused a pack with no ruler, a room that resolves to no voice, or a
 * voice naming an anchor the pack does not define — so by the time anything
 * here is read, the world is known to be measurable. */
const PACK = activePack();

/* The one measured height, RULED BY THE PACK. Imported nowhere else on purpose:
 * `make-scaffold` owns `CHAIR_RAIL_M` and this file must agree with it, which
 * `tests/playwright/room-voices.spec.mjs` asserts rather than assumes. */
export const ANCHOR_M = PACK.world.ruler.height_m;

/* Sill and head are the SCAFFOLD's conventions (a plan view holds no vertical
 * dimension), repeated here so a voice's window sentence and the scaffold's own
 * stamped window box cannot drift apart. */
export const WINDOW_SILL_M = PACK.world.conventions.window_sill_m;
export const WINDOW_HEAD_M = PACK.world.conventions.window_head_m;

/* A light — one glazed pane-field between mullions — is about half a metre in
 * an English mullioned window of this date; the plan's own opening widths
 * (1.00, 1.20, 1.40, 1.50, 2.50 m) divide into 2, 2, 3, 3 and 5 lights at that
 * module, which is exactly the range such windows come in. */
export const LIGHT_MODULE_M = PACK.world.conventions.light_module_m;

/* ------------------------------------------------------------------ */
/* The voices                                                          */
/* ------------------------------------------------------------------ */
/* Each carries `why` — one line of period justification — because a material
 * table with no justification is a preference, and the next builder has no way
 * to tell a researched choice from a typed one. */

export const VOICES = PACK.voices.VOICES;

/* ------------------------------------------------------------------ */
/* The anchors                                                         */
/* ------------------------------------------------------------------ */
/* `line` is what goes on the prompt's `Gate anchor:` line, and it is matched by
 * `design/plan-draft/measured/prompt_lint.py`'s RULERS table — a name that
 * table does not carry is refused before an image exists. `label` is what the
 * SCAFFOLD stamps across the frame, so the diagram and the prompt name the same
 * object; `legend_word` is its short form on the scaffold's legend. Both are
 * restricted to `make-scaffold.mjs`'s stroked glyph table (no apostrophe, no
 * colon, no bracket), which `room-voices.spec.mjs` asserts. */

export const ANCHORS = PACK.voices.ANCHORS;

/* ------------------------------------------------------------------ */
/* Room id -> voice                                                    */
/* ------------------------------------------------------------------ */
/* DERIVED FROM THE PLAN'S OWN ID VOCABULARY, and said so per entry, because the
 * plan's `type` and `archetype` DO NOT CARRY ENOUGH: `type` is only
 * enclosed/corridor/open, and `archetype` lumps the kitchen with the buttery
 * (both `service`), the great hall with the solar (both `hall`), the study with
 * every bedchamber (all `chamber`), and both stairs with the landings (all
 * `stair`). A voice keyed on either of those is how the parlour paragraph
 * reached the scullery in the first place. So the ROOM ID is the key, the
 * archetype is the fallback for an id this table has never seen, and each entry
 * below records which of the two it came from. */

export const ROOM_VOICE = PACK.voices.ROOM_VOICE;

/* The fallback for a room id this table has never seen, so a FUTURE plan still
 * resolves rather than silently taking the first voice in the file. Keyed on
 * archetype, then on type; every entry is the safest member of its family. */
export const ARCHETYPE_FALLBACK = PACK.voices.ARCHETYPE_FALLBACK;
export const TYPE_FALLBACK = PACK.voices.TYPE_FALLBACK;

/**
 * The voice for one FACING.
 *
 * The facing, not just the room, because the plan types a facing `open` when
 * there is no wall at that wall line at all — four of them in the manor
 * (`entrance_court/S`, `entrance_approach/E|S|W`). Those are not a garden wall
 * seen from a garden; they are open ground with nothing built in frame, and a
 * voice that hands them brickwork is the same class of error as handing the
 * kitchen panelling.
 *
 * Returns `{ voice, anchor, via }`. `via` names how the voice was reached, so
 * the emitter can record it and a test can insist this plan never falls back.
 */
export function voiceFor(plan, roomId, facing) {
  const room = (plan.rooms || []).find((r) => r.id === roomId);
  if (!room) {
    throw new Error(`room-voices: the plan holds no room \`${roomId}\``);
  }
  const fc = (room.facings || {})[facing];
  if (!fc) {
    throw new Error(`room-voices: ${roomId} has no facing \`${facing}\``);
  }
  let id, via;
  if (fc.type === "open") {
    id = "outdoors_open";
    via = "facing type `open` — no wall stands at this wall line";
  } else if (ROOM_VOICE[room.id]) {
    id = ROOM_VOICE[room.id];
    via = "room id";
  } else if (ARCHETYPE_FALLBACK[room.archetype]) {
    id = ARCHETYPE_FALLBACK[room.archetype];
    via = `archetype \`${room.archetype}\` — this room id is not in the voice table`;
  } else if (TYPE_FALLBACK[room.type]) {
    id = TYPE_FALLBACK[room.type];
    via = `type \`${room.type}\` — neither the room id nor the archetype is in the voice table`;
  } else {
    throw new Error(
      `room-voices: ${roomId}/${facing} resolves to no voice at all — its id, its ` +
      `archetype \`${room.archetype}\` and its type \`${room.type}\` are all unknown. ` +
      `Add it to ROOM_VOICE with its period justification rather than letting a wall ` +
      `fall through to whatever the default happens to be.`);
  }
  const voice = VOICES[id];
  if (!voice) throw new Error(`room-voices: voice \`${id}\` is named but not defined`);
  const anchor = ANCHORS[voice.anchor];
  if (!anchor) throw new Error(`room-voices: voice \`${id}\` names anchor \`${voice.anchor}\`, which is not defined`);
  return { voice, anchor, via };
}

/** The hangings' rank in a bedchamber: the best chamber is the richest. Derived
 *  from the id vocabulary — "master" is the best chamber, "guest" the next, a
 *  "closet" chamber the plainest — and from nothing else. */
export function hangingsFor(roomId) {
  if (/master|best/.test(roomId)) return VOICES.bedchamber.hangings.best;
  if (/guest/.test(roomId)) return VOICES.bedchamber.hangings.good;
  return VOICES.bedchamber.hangings.plain;
}

/* ------------------------------------------------------------------ */
/* Windows                                                             */
/* ------------------------------------------------------------------ */
/* [HUMAN, 2026-08-24]: "this same window everywhere? With the ensignias on
 * it?" The style seed carries one leaded window with heraldic glass in it, and
 * with nothing in the prompt to differentiate them every wall painted that
 * window again. The seed stays — it is Kabe's approved style reference — and
 * the WORDS do the differentiating: every clause below is a function of THIS
 * facing's own window list out of the plan, so two walls can only read the same
 * if the plan draws them the same. */

/** Lights per opening, at the period module. 1.00 m -> 2, 1.50 m -> 3, 2.50 m -> 5. */
export function lightsFor(widthM) {
  return Math.max(2, Math.round(widthM / LIGHT_MODULE_M));
}

/**
 * Whether an opening of this width carries a transom.
 *
 * DERIVED FROM SIZE ALONE, AND NOT FROM STATUS, because the scaffold rules
 * every window's sill at 0.90 m and its head at 2.00 m — 1.10 m of opening. A
 * transom across a 1.10 m tall window is not a period detail, it is a mistake,
 * however grand the room; the first draft of this rule put one in every hall
 * and gallery window in the manor. What a transom really marks is a window big
 * enough to need the extra member, so the rule is the light count: four lights
 * or more. In this plan that is the 2.50 m stair window and nothing else.
 */
export function transomFor(widthM) {
  return lightsFor(widthM) >= 4;
}

/**
 * The dressing round an opening, which IS a status marker in 1660 and is where
 * the room's rank shows in its glazing: a state room's windows are hooded by a
 * moulded label mould, a principal room's sit in a moulded surround, a service
 * room's in a plain chamfer. It is the clause that keeps two walls of equal
 * bay count from reading identically across rooms.
 */
/* [Kabe, 2026-08-30 hospital-3 step 3] THE WORDS ARE THE PACK'S. "The theme
 * shouldn't bleed into the code": stone mullions and iron-hinged casements are
 * 1660's, and the third pack's first prompt asked a 1995 hospital for them.
 * `world.json` -> `conventions.window` carries the surround by rank, the
 * dividing member, the transom and the light that opens; the code keeps only
 * the rule (which light, how many, where). Neutral words where a pack says
 * nothing, never a period's. */
export const WINDOW_WORDS = Object.assign({
  surround: {}, mullion: "glazing bar", transom: "a single transom", opening_light: "an opening light"
}, (PACK.world.conventions || {}).window || {});
export function surroundFor(status) {
  const s = WINDOW_WORDS.surround || {};
  return s[status] || s.default || "in a plain frame";
}

const COUNT_WORD = ["no", "one", "two", "three", "four", "five", "six",
  "seven", "eight", "nine", "ten"];
const count = (n) => COUNT_WORD[n] || String(n);

/**
 * WHICH LIGHT OPENS, derived from where each opening sits on the wall: one left
 * of the wall's centre hangs its casement on the left, one right of centre on
 * the right. It is the hinge a joiner would actually have hung, and it varies
 * with the plan rather than with a choice — which is what stops a range of
 * identical windows reading as one window stamped four times.
 *
 * [row 43] ITS OWN FUNCTION, because two registers say it now: the incumbent's
 * `windowLines` below and the clean register's window clause, which reaches it
 * through `g5CtxFor`. One home, so a change to the hinge rule cannot reach one
 * register and not the other.
 */
export function casementSentence(windows, surfaceWord) {
  const surface = surfaceWord || "wall";
  const many = windows.length > 1;
  const left = windows.filter((w) => (w.u == null ? 0.5 : w.u) < 0.5).length;
  const right = windows.length - left;
  const side = left && right
    ? `the left-hand light in the ${count(left)} opening${left > 1 ? "s" : ""} left of the ` +
      `${surface}'s centre, and the right-hand light in the ${count(right)} right of it.`
    : `the ${left ? "left" : "right"}-hand light${many ? ", in every one of them" : ""}.`;
  return `One light in ${many ? "each window" : "it"} is ${WINDOW_WORDS.opening_light}: ${side}`;
}

/**
 * The window paragraph for one facing: the openings the plan draws, described
 * at the period module, plus the glazing rule and the heraldry ration.
 *
 * `windows` is the facing's own window carriers in order along the wall, each
 * with `width_m` and `u` — the centre of the opening as a fraction of the
 * wall's width. Nothing here is typed per wall.
 *
 * IDENTICAL OPENINGS ARE DESCRIBED ONCE, AS A RANGE. A hall or a gallery lit
 * down one side really does repeat one window, and four separately-worded
 * sentences saying the same thing is the bloat that makes a prompt stop being
 * read. What must not repeat is the description ACROSS ROOMS, and it cannot:
 * every number below comes off this facing's own carriers.
 */
export function windowLines(voice, windows, roomName, surfaceWord, hasStyleImage = true) {
  const surface = surfaceWord || "wall";
  const datum = voice.outdoor ? "ground" : "floor";
  const L = [];
  if (!windows.length) {
    L.push(`Windows: this ${surface} carries no window and no glazed opening of any kind.`);
    return L;
  }
  const status = voice.window_status;
  const many = windows.length > 1;
  /* [row 40, Kabe's ruling] THE SENTENCE THAT ARGUES WITH IMAGE 1 IS ONLY
   * SPOKEN WHERE THERE IS AN IMAGE 1 TO ARGUE WITH. Where the packet carries no
   * style picture at all, naming one is naming a thing that is not there — and
   * a prompt that mentions a window "in Image 1" when no Image 1 exists has
   * just described a window nobody asked for, which is the disease this ruling
   * is curing. */
  L.push(`Windows: this ${surface} carries ${count(windows.length)} window opening${many ? "s" : ""}` +
    (hasStyleImage
      ? `, and ${many ? "they are" : "it is"} not the window in Image 1 — Image 1 is a reference ` +
        `for this room's materials, paint handling, palette and light only, never for how many ` +
        `openings this ${surface} has or how their glass is laid out.`
      : `, and every one of them is described here in words. There is no picture of a window in ` +
        `this packet to copy, and none is to be invented from memory.`));
  /* Grouped by ruled width, in order of first appearance along the wall. */
  const groups = [];
  for (const w of windows) {
    const key = w.width_m.toFixed(2);
    const g = groups.find((x) => x.key === key);
    if (g) g.n += 1; else groups.push({ key, n: 1, width_m: w.width_m });
  }
  for (const g of groups) {
    const lights = lightsFor(g.width_m);
    const mullions = lights - 1;
    const subject = groups.length === 1
      ? (g.n === 1 ? "  The window is" : g.n === 2 ? "  Both are" : `  All ${count(g.n)} are`)
      : (g.n === 1 ? "  One of them is" : `  ${count(g.n).replace(/^./, (c) => c.toUpperCase())} of them are`);
    L.push(`${subject} ${g.width_m.toFixed(2)} m wide, set ${surroundFor(status)}, ` +
      `divided by ${count(mullions)} ${WINDOW_WORDS.mullion}${mullions > 1 ? "s" : ""} into ` +
      `${count(lights)} equal upright light${lights > 1 ? "s" : ""}` +
      (transomFor(g.width_m)
        ? `, and crossed by ${WINDOW_WORDS.transom}, the only transom on this ` + surface
        : "") +
      `, the sill ${WINDOW_SILL_M.toFixed(2)} m above the ${datum} and the head ${WINDOW_HEAD_M.toFixed(2)} m above it.`);
  }
  L.push(`  ${casementSentence(windows, surface)}`);
  /* [row 40, Kabe's ruling] THE GLASS IS NAMED POSITIVELY, because the seed can
   * no longer supply it. This sentence used to sit downstream of a photograph
   * that showed four painted shields, and it is now the only description of the
   * glass the packet contains — so it says what IS in every quarry before
   * anything says what is not. Diamond quarrels, not rectangular ones: the
   * lozenge quarry is the c.1660 leaded form the voice table's own period notes
   * rule, and stating it plainly is the thing being asked for. */
  L.push("  Every light is glazed edge to edge with small plain diamond quarries of faintly greenish " +
    "crown glass, each quarry a plain lozenge of clear glass and nothing else, set in lead cames " +
    "with iron saddle-bars across them.");
  if (voice.glass === "armorial") {
    L.push(`Armorial glass: the ${roomName} is the one room in this house entitled to it. Set a small painted ` +
      "armorial shield in coloured glass into the head of each window, and nowhere else in the picture. Every " +
      "other pane-field on this wall stays plain diamond quarrels.");
  } else if (voice.glass === "one_shield") {
    L.push(`Armorial glass: the ${roomName} carries exactly ONE small painted armorial shield in coloured glass, ` +
      "set into the head of the first window only. Every other light on this wall, and every other pane-field of " +
      "that same window, is plain diamond quarrels.");
  } else {
    L.push("  Every quarry on this " + surface + " is that plain lozenge and no other thing: no coloured " +
      "glass, no painted or stained glass, no armorial shield, crest, badge, monogram, motto or " +
      "insignia of any kind appears in any window here. This room is not entitled to arms and has " +
      "none.");
  }
  return L;
}

/* ------------------------------------------------------------------ */
/* Interior fabric, in an outdoor prompt                               */
/* ------------------------------------------------------------------ */
/* THE SECOND COPY OF `prompt_lint.py`'s INTERIOR_FABRIC, and it exists because
 * the emitter has to be able to REFUSE ITS OWN SENTENCE before it writes it.
 *
 * It was earned immediately. The re-ask for `privy_garden/N` carries its
 * correction verbatim, and that correction is Kabe's own veto — which, to say
 * what went wrong, names "interior oak panelling and a chair-rail". Carried
 * into the prompt it put both words in front of the generator on the very wall
 * they were vetoed from, and the lint refused the packet. The lint was right:
 * an outdoor prompt may not name interior fabric AT ALL, not even inside a
 * quotation of why the last attempt failed.
 *
 * So a correction reaches the prompt only when it is a forward-facing
 * instruction the prompt can act on; the verbatim text always reaches PACKET.md
 * and `retries.json`, where a reader needs it and no generator reads it. The
 * lint stays the authority — if these two word lists ever drift apart, the lint
 * refuses the packet and the suite goes red, which is the handshake. */
export const INTERIOR_FABRIC = new RegExp(PACK.world.refusals.interior_fabric, "i");

/** Whether a sentence may be carried into an OUTDOOR wall's prompt. */
export function carryableOutdoors(sentence) {
  return !INTERIOR_FABRIC.test(sentence || "");
}

/* What replaces a correction that cannot be carried: the forward half of it,
 * saying that the earlier attempt is superseded by what follows, in words the
 * clause permits. The reason itself is in the packet. */
export const REDACTED_CORRECTION = PACK.world.refusals.redacted_correction;

/* ------------------------------------------------------------------ */
/* Self-check                                                          */
/* ------------------------------------------------------------------ */

/**
 * Every room of a plan resolves to a voice, and every voice names its anchor.
 * Exported so the emitter can run it before it writes anything and the suite
 * can run it against the shipped plan.
 *
 * Returns one row per facing: `{ key, voice, anchor, via }`.
 */
export function resolveAll(plan) {
  const rows = [];
  for (const room of plan.rooms || []) {
    for (const f of Object.keys(room.facings || {})) {
      const { voice, anchor, via } = voiceFor(plan, room.id, f);
      if (!voice.why) throw new Error(`room-voices: voice \`${voice.id}\` carries no period justification`);
      if (!(anchor.line && anchor.sentence && anchor.label)) {
        throw new Error(`room-voices: anchor \`${anchor.id}\` does not fully name itself`);
      }
      rows.push({ key: `${room.id}/${f}`, voice: voice.id, anchor: anchor.id, via });
    }
  }
  return rows;
}

/* ------------------------------------------------------------------ */
/* Materials — row 36's texture library                                */
/* ------------------------------------------------------------------ */
/* A VOICE SAYS WHAT A SURFACE IS MADE OF; A MATERIAL SAYS HOW BIG IT IS.
 * Row 36 assembles a facing by sampling tiles laid out in metres, so every
 * texture needs a metres-per-pixel and a repeat that lands on a joint. None of
 * that can live in the voice's prose — "wide worn oak floorboards" does not say
 * how wide — so it lives here, keyed to the same strings.
 *
 * THE THREE THINGS THIS TABLE CARRIES, and why prose cannot:
 *
 *   the LANE      harvest (rectify a patch out of a promoted painting) or
 *                 swatch (ask for the material flat). Decided by measurement,
 *                 not taste: `design/specs/36-plan.md` §1.2 measured every
 *                 promoted facing and found floors and ceilings are grazing
 *                 surfaces no facing resolves isotropically -- 0 of 51 clear
 *                 the demand -- while a facing WALL's map is a similarity,
 *                 anisotropy exactly 1.000 on all 51. Walls harvest; the other
 *                 two are asked.
 *
 *   the TILING    which way the grain runs and the pitch ACROSS it. `pitch_m`
 *                 is the spacing between boards/stiles/joists measured
 *                 PERPENDICULAR to `grain_axis`. It is not a distance along the
 *                 grain and it is NOT the repeat period: the period is the
 *                 tile's own span, a whole number of pitches, so a repeat falls
 *                 on a joint instead of halfway across a board.
 *
 *   the SCALE     how a consumer knows the tile's ppm -- §1.4a's library-wide
 *                 contract: no asset enters without a derivable
 *                 metres-per-pixel.
 *
 * AND A MATERIAL WITHOUT A COUNTABLE REPEAT STILL NEEDS A SCALE, which is the
 * one case §1.4a's gate could not cover as first written. Three kinds:
 *
 *   periodic      boards, panels, joists, brick. The ask names a feature and a
 *                 count; the return is verified by recovering the period and
 *                 checking it against the count. The strict gate.
 *   stochastic    gravel, turf, rough limewash, woven hangings. No countable
 *                 module, but grain SIZE is visible and wrong grain reads
 *                 wrong, so the ask names a characteristic size and the return
 *                 is checked against its spectral peak at a wider residual.
 *   featureless   smooth plaster. Scale is genuinely UNOBSERVABLE -- nothing in
 *                 it has a size that could be wrong -- so any ppm is correct
 *                 and the gate inverts: the tile must actually BE featureless
 *                 (variance under a bar). If it returns with features we cannot
 *                 scale them, and that is the refusal.
 */

/** The largest resolution any DECLARED facing asks of each surface, px/m.
 *  Measured on declared boxes over all 88 facings (`36-plan.md` §1.8), not
 *  sampled from painted ones. Floor and ceiling are constants across the whole
 *  building because eye height and horizon are ruled and only
 *  `px_per_m_at_wall` varies between facings. */
export const SLOT_DEMAND_PPM = { walls: 476, ceiling: 325, floor: 417 };

/** A swatch is asked at this pixel width. */
export const SWATCH_W_PX = 1536;

/** The largest whole count of `pitch_m` that still clears the slot's demand.
 *  Largest, not smallest: a wider swatch covers more metres and repeats less
 *  often, and repetition is the risk this library most likely loses on. */
export function swatchCount(slot, pitchM) {
  const demand = SLOT_DEMAND_PPM[slot];
  const n = Math.floor(SWATCH_W_PX / (demand * pitchM));
  if (n < 1) {
    throw new Error(
      `room-voices: a ${slot} swatch of pitch ${pitchM} m cannot clear ` +
      `${demand} px/m in ${SWATCH_W_PX} px -- not one whole module fits`);
  }
  return n;
}

/** The ask's own arithmetic: count, span, and the ppm it delivers. */
export function scaleContract(slot, tiling) {
  if (tiling.scale_kind === "periodic") {
    const count = swatchCount(slot, tiling.pitch_m);
    const span = count * tiling.pitch_m;
    return { kind: "periodic", feature: tiling.feature, pitch_m: tiling.pitch_m,
             count, span_m: +span.toFixed(4),
             ppm: +(SWATCH_W_PX / span).toFixed(2) };
  }
  const span = +(SWATCH_W_PX / SLOT_DEMAND_PPM[slot]).toFixed(4);
  if (tiling.scale_kind === "stochastic") {
    return { kind: "stochastic", feature: tiling.feature,
             characteristic_m: tiling.characteristic_m, span_m: span,
             ppm: SLOT_DEMAND_PPM[slot] };
  }
  return { kind: "featureless", feature: null, span_m: span,
           ppm: SLOT_DEMAND_PPM[slot],
           why: "scale is unobservable on a surface with nothing whose size " +
                "could be wrong; the gate is that it really is featureless" };
}

/* `grain_frame` says which pair of axes `grain_axis` names, and the two are not
 * the same space. A WALL's grain is a fact about that wall's own surface, so it
 * is "u" (across the wall) or "v" (up it). A FLOOR's or CEILING's grain is a
 * fact about the ROOM -- boards run the length of a gallery whichever way you
 * are facing in it -- so it is "room_long" or "room_short", resolved against
 * the room's rect at assembly time. Naming a floor's grain in surface
 * coordinates would make it a property of the facing, which is exactly the
 * disease row 36 exists to cure: turn ninety degrees and the boards swing.
 *
 * Pitches are craft numbers and this comment is where they say so. Board 0.25,
 * panel bay 0.80 and joist 0.90 are the period-typical spacings the prompts
 * already imply; brick course 0.075 and brick-on-edge 0.115 are standard
 * English-bond dimensions. Each is the spacing ACROSS the grain.
 */

/* ------------------------------------------------------------------ */
/* THE FRAME — row 41. A wall is architecture, not texture.            */
/* ------------------------------------------------------------------ */
/* [HUMAN, 2026-08-24, verbatim on the kitchen flip] "the paneling needs to
 * frame in the wall properly. It looks like a chopped up repeating wallpaper
 * thats glitched out. It runs off the corner and doesnt complete" — and the
 * ruling in `design/approvals.log`: tiled texture crops are REJECTED as wall
 * construction. A material that carries JOINERY carries a `frame` here, and
 * `row41_bays.py` lays the wall out from it: bay count from the wall's own
 * width, a stile in every boundary including both corners, and the fabric
 * demoted to what fills a field INSIDE that frame.
 *
 * WHERE THESE NUMBERS COME FROM, since "not invented" is the whole requirement.
 * They are the dimensions of English oak joinery of the manor's own date
 * (c. 1660), and each is stated in the imperial it was actually worked in:
 *
 *   module_m 0.80    THE BAY. It is not a new number: it is this material's own
 *                    `pitch_m`, which is where the panel bay already lived. A
 *                    riven oak panel of this period runs 2 ft to 2 ft 9 in
 *                    between stile centres — the width the timber gives before
 *                    it has to be jointed — and 0.80 m is 2 ft 7.5 in, in the
 *                    upper half of that because the manor's rooms are large.
 *                    Blueprint §11 records that the 0.90 m module inferred off
 *                    four cand-1 facings disagreed by +/-7% and was superseded;
 *                    this is the ruled figure, not that inference.
 *   stile_m 0.11     THE STILE, 4.33 in, cut from 4.5 in stuff with the
 *                    mouldings worked on its own face — so the visible member
 *                    is the stile, mouldings included, and one number covers it.
 *   plinth_m 0.17    THE PLINTH / SKIRTING, 6.7 in: the base member takes the
 *                    knocks and stands taller than the framing.
 *   chair_rail_m     0.95 EXACTLY, and it is RULED, not craft: blueprint §11's
 *                    universal chair rail, the one instrument the whole corpus
 *                    reads scale through (`row36_assemble.ANCHOR_M`). Nothing
 *                    in this table may move it.
 *   chair_rail_h_m   0.14, which is `row36_assemble.ANCHOR_BAND_M` — the same
 *                    band, said once.
 *   cornice_m 0.24   THE WALL HEAD, 9.4 in of cornice and frieze together.
 *   architrave_m     0.13, 5.1 in: the surround a door or window is framed by.
 *   bevel_m 0.035    THE FIELDING, 1.4 in: the chamfer from the frame plane
 *                    down to the panel face.
 *
 * `kind` says how far up the wall the joinery goes. "full_height" is panelling
 * to the cornice; "dado" is wainscot to the chair rail with a field above it —
 * plaster, or one of the `hangings-*` variants — which the layout frames as a
 * field rather than tiling across the wall.
 *
 * AND THE MATERIALS WITH NO FRAME still answer for the corner. Limewash has no
 * bays and inventing some would be worse than tiling, so an unframed material
 * carries an `edge` instead: the one member that stops the fabric AT the corner
 * so nothing runs off it. A return stile where the wall is plaster; a quoin —
 * blocks coursed up the angle — where it is masonry, which is what masonry
 * actually does at a corner. `width_m` 0.11 is the same stile; the quoin's
 * 0.225 m is a 9 in brick laid header-on, and its 0.15 m course is the two
 * English-bond courses (0.075 m each) a quoin block spans. */
/* [row 44] The carrier-frame and edge literals that used to build MATERIALS above
 * moved into the pack with it: a `dado` frame 0.11 m wide and a 0.225 m quoin are
 * this world's joinery and this world's masonry, not the engine's. They are
 * `packs/<name>/voices.json`'s MATERIALS entries now, spelled out per material. */

export const MATERIALS = PACK.voices.MATERIALS;

/** Which material each voice's each material-bearing key names.
 *
 *  THE STRINGS ARE NOT COPIED HERE, deliberately. A binding names a voice key
 *  and a material id; the prose stays in `VOICES` as its one home, so a reworded
 *  voice cannot silently drift from a duplicated copy of itself.
 *
 *  `blank` binds to the SAME material as `walls` throughout: "unbroken oak
 *  panelling" is "dark hand-finished oak wall panelling" with nothing on it --
 *  the same fabric, said for a wall with no carrier. That is why 47 strings are
 *  33 materials. */
export const MATERIAL_BINDING = PACK.voices.MATERIAL_BINDING;

/** Every material-bearing key on a voice, DERIVED FROM THE OBJECT.
 *
 *  This is the fix for the census that was not one. A test walking a typed
 *  triple -- walls, ceiling, floor -- missed 15 of the 47 strings on the map it
 *  was already governing: a `blank` on every voice, the manor's own exterior
 *  elevation, and three ranks of bedchamber hangings. Enumerating the object
 *  means a key a future voice invents fails the check instead of passing
 *  unseen, which is the only version of this that answers production-law
 *  clause 6. */
export function materialKeysOf(voice) {
  const keys = [];
  for (const [k, v] of Object.entries(voice)) {
    if (typeof v === "string" && MATERIAL_KEYS.has(k)) keys.push(k);
  }
  if (voice.hangings && typeof voice.hangings === "object") {
    for (const rank of Object.keys(voice.hangings)) keys.push(`hangings.${rank}`);
  }
  return keys.sort();
}

/** The keys on a voice that name a material. A key added to a voice outside
 *  this set is not silently ignored: `assertMaterialsComplete` refuses any
 *  string-valued key that looks like a surface and is not bound. */
export const MATERIAL_KEYS = new Set(["walls", "blank", "walls_with_openings", "ceiling", "floor"]);

/** Follow `same_as` to the texture that is actually stored. One hop is all the
 *  table declares and a chain is refused: an alias of an alias is a merge
 *  nobody reviewed. */
export function canonicalMaterial(id) {
  const m = MATERIALS[id];
  if (!m) throw new Error(`room-voices: unknown material \`${id}\``);
  if (!m.same_as) return id;
  const next = MATERIALS[m.same_as];
  if (!next) throw new Error(`room-voices: \`${id}\` aliases unknown \`${m.same_as}\``);
  if (next.same_as) {
    throw new Error(
      `room-voices: \`${id}\` -> \`${m.same_as}\` -> \`${next.same_as}\` is a chain of ` +
      `aliases. Point every alias at the texture that is stored, so a reader ` +
      `sees one merge and not a path.`);
  }
  return m.same_as;
}

/** Every alias, with the reason it was ruled -- the table that goes to Kabe. */
export function aliasTable() {
  const rows = [];
  for (const [id, m] of Object.entries(MATERIALS)) {
    if (!m.same_as) continue;
    rows.push({ from: id, to: m.same_as, slot: m.slot, reason: m.alias_reason });
  }
  return rows.sort((a, b) => (a.slot + a.from).localeCompare(b.slot + b.from));
}

/* ------------------------------------------------------------------ */
/* WHAT A MATERIAL USED TO BE CALLED                                   */
/* ------------------------------------------------------------------ */
/* A REFINEMENT OF WORDING IS NOT A CHANGE OF MATERIAL, and this table is
 * where that claim is DECLARED rather than guessed. The rule it serves, with
 * its reason, is stated once in `make-scaffold.mjs` under "VOUCHING FOLLOWS
 * THE MATERIAL, NOT THE WORDING"; this is the only input that rule cannot
 * derive.
 *
 * WHY IT CANNOT BE DERIVED. `MATERIAL_BINDING`'s own note says it: a binding
 * is keyed on (voice, key) and never on the string, because two voices can say
 * the same words about different fabrics and one voice can say two different
 * sets of words about one fabric. The corollary is that no rule reading prose
 * alone can tell "the same material, said better" from "a different material".
 * The tempting shortcut — the old wording is a PREFIX of the new one, so it is
 * the same thing — is wrong in this very table: `cross_passage.walls` is a
 * strict prefix of `long_gallery.walls` and they are two fabrics. So the claim
 * is authored, exactly as the ids are.
 *
 * THE ENTRY RULE. When a voice string is REWORDED without changing which
 * material it names, the superseded string moves in here in the SAME commit
 * that changes the voice, with the commit that retired it and the reason. That
 * is the whole maintenance cost, and it is what makes the next map get this for
 * free (production law clause 6): a Navigator who refines a phrase declares the
 * refinement, and every wall already painted in that material stays vouched.
 *
 * AND FORGETTING IS SAFE. A refinement whose old wording is not declared here
 * reads as a material change: the audit refuses to guess, the wall goes
 * unvouched, and it is re-asked. The failure direction is a wasted roll, never
 * a wrong photograph handed to the next painter. */
export const SAID_BEFORE = PACK.voices.SAID_BEFORE;

/** How a voice key stands in a manor ask's material sentences. `blank` is
 *  absent on purpose: it is the carrier-less phrasing of the SAME fabric and it
 *  is not one of `materialParts`' slots, so admitting it would let a wall's
 *  blank prose answer for its walls prose. */
export const MATERIAL_PART_OF_KEY = PACK.voices.MATERIAL_PART_OF_KEY;

/**
 * Every prose a manor ask may state for a material, with the material it names
 * and the material PART it stands in — current wordings from the voices, plus
 * every wording `SAID_BEFORE` retires.
 *
 * This is the registry that lets a reader of an OLD ask on disk answer "which
 * material was this wall commissioned in?" rather than only "does it say what
 * we say today?". Ids come back canonical, so an alias and its target compare
 * equal: `floor/wide-worn-oak-boards` is `floor/wide-oak-boards` with a finish
 * adjective on it and a wall asked for either was asked for one floor.
 */
export function declaredMaterialPhrases() {
  const out = [];
  const partsOfId = new Map();
  for (const [vid, bound] of Object.entries(MATERIAL_BINDING)) {
    const voice = VOICES[vid];
    if (!voice) throw new Error(`room-voices: MATERIAL_BINDING names voice \`${vid}\`, which is not defined`);
    for (const [key, id] of Object.entries(bound)) {
      const part = key.startsWith("hangings.") ? "hangings" : MATERIAL_PART_OF_KEY[key];
      if (!part) continue;
      const phrase = key.startsWith("hangings.")
        ? (voice.hangings || {})[key.slice("hangings.".length)]
        : voice[key];
      if (!phrase) continue;
      const canon = canonicalMaterial(id);
      out.push({ phrase, id: canon, part, said_by: `${vid}.${key}`, current: true });
      if (!partsOfId.has(canon)) partsOfId.set(canon, new Set());
      partsOfId.get(canon).add(part);
    }
  }
  /* THE RETIRED WORDINGS, CHECKED RATHER THAN TRUSTED. An entry that names an
     unknown material, a material no voice reaches, or a phrase that is some
     OTHER material's current wording is not a refinement record — it is a merge
     nobody reviewed, and it would vouch a wall painted in the wrong fabric. */
  for (const [id, entries] of Object.entries(SAID_BEFORE)) {
    if (!MATERIALS[id]) throw new Error(`room-voices: SAID_BEFORE names unknown material \`${id}\``);
    const canon = canonicalMaterial(id);
    const parts = partsOfId.get(canon);
    if (!parts || !parts.size) {
      throw new Error(
        `room-voices: SAID_BEFORE carries \`${id}\`, which no voice names in any material ` +
        `sentence. A retired wording for a material nothing asks for vouches nothing and ` +
        `hides a binding that was deleted.`);
    }
    for (const e of entries || []) {
      for (const k of ["said", "retired", "commit", "why"]) {
        if (!e[k]) throw new Error(`room-voices: SAID_BEFORE[\`${id}\`] has an entry with no \`${k}\``);
      }
      const clash = out.find((x) => x.phrase === e.said);
      if (clash) {
        throw new Error(
          `room-voices: SAID_BEFORE[\`${id}\`] retires "${e.said}", which is ` +
          (clash.id === canon
            ? `still what \`${clash.said_by}\` says today. A wording is retired or it is current, not both.`
            : `\`${clash.said_by}\`'s CURRENT wording for \`${clash.id}\`. Retiring another ` +
              `material's live phrase would vouch a wall painted in that other fabric.`));
      }
      for (const part of parts) {
        out.push({ phrase: e.said, id: canon, part, said_by: `SAID_BEFORE.${id}`,
          current: false, retired: e.retired, commit: e.commit, why: e.why });
      }
    }
  }
  return out;
}

/** The material a voice's key names. Refuses rather than guessing. */
export function materialOf(voiceId, key) {
  const bound = MATERIAL_BINDING[voiceId];
  if (!bound) throw new Error(`room-voices: no material binding for voice \`${voiceId}\``);
  const id = bound[key];
  if (!id) {
    throw new Error(
      `room-voices: voice \`${voiceId}\` carries a material key \`${key}\` that ` +
      `names no material. Add it to MATERIAL_BINDING -- a surface nobody sized ` +
      `cannot be assembled.`);
  }
  const mat = MATERIALS[id];
  if (!mat) throw new Error(`room-voices: \`${voiceId}.${key}\` names unknown material \`${id}\``);
  /* `named_as` is what the voice said; `id` is the texture that is stored. They
     differ exactly where an alias was ruled, and both travel so a reader can
     see which merge produced a tile. */
  const canon = canonicalMaterial(id);
  const stored = MATERIALS[canon];
  return { id: canon, named_as: id, aliased: canon !== id,
           ...stored, scale_contract: scaleContract(stored.slot, stored.tiling) };
}

/** Completeness and bijection, asserted over the voices that exist.
 *
 *  Two claims, and they fail differently. COMPLETENESS: every material-bearing
 *  key on every voice resolves to a material. BIJECTION: no two distinct voice
 *  strings collide onto one material id unless their binding says so on
 *  purpose, and every declared material is reachable. The second is why ids are
 *  authored rather than derived from the prose: `cross_passage.walls` is a
 *  strict PREFIX of `long_gallery.walls`, so any truncating slug merges them
 *  silently -- and would "solve" the passage's swatch by handing it the
 *  gallery's cornice. */
export function assertMaterialsComplete(voices) {
  const namedIds = new Set();       // what voices SAY, aliases included
  const storedIds = new Set();      // what is actually kept as a texture
  const perVoice = new Map();       // `${storedId}|${voiceId}` -> Set(strings)
  for (const [vid, voice] of Object.entries(voices)) {
    for (const key of materialKeysOf(voice)) {
      const m = materialOf(vid, key);
      namedIds.add(m.named_as);
      storedIds.add(m.id);
      const str = key.startsWith("hangings.")
        ? voice.hangings[key.slice("hangings.".length)]
        : voice[key];
      const k = `${m.id}|${vid}`;
      if (!perVoice.has(k)) perVoice.set(k, new Set());
      perVoice.get(k).add(str);
    }
  }
  const unreachable = Object.keys(MATERIALS).filter((id) => !namedIds.has(id));
  if (unreachable.length) {
    throw new Error(
      `room-voices: ${unreachable.length} material(s) no voice reaches: ` +
      `${unreachable.join(", ")}. A texture nothing asks for is a texture ` +
      `nobody will notice going stale.`);
  }
  /* ONE VOICE may name a wall material at most twice -- its `walls` prose and
     its `blank` phrasing. Counting per (material, voice) rather than per
     material is what lets an ALIAS merge several voices onto one texture while
     still catching a single voice whose two keys have drifted into two
     different fabrics. */
  for (const [k, strs] of perVoice) {
    const [id, vid] = k.split("|");
    const mat = MATERIALS[id];
    if (mat.slot === "walls" && strs.size > 2 && !mat.variant_of) {
      throw new Error(
        `room-voices: voice \`${vid}\` names material \`${id}\` with ${strs.size} ` +
        `different strings. A voice carries at most its \`walls\` prose and its ` +
        `\`blank\` phrasing; more than that is two materials wearing one id.`);
    }
  }
  const stored = [...storedIds];
  return {
    declared: Object.keys(MATERIALS).length,
    aliases: Object.values(MATERIALS).filter((m) => m.same_as).length,
    stored: stored.length,
    base: stored.filter((id) => !MATERIALS[id].variant_of).length,
    harvest: stored.filter((id) => MATERIALS[id].lane === "harvest").length,
    swatch: stored.filter((id) => MATERIALS[id].lane === "swatch").length
  };
}

/** The payload the Python assembler reads. One home in JS, crossed as data --
 *  the way `MEASURED_BAND` already crosses into `row23_lib`. */
/** Which voice each FACING of a plan resolves to.
 *
 *  The bindings are keyed by voice; a harvester holds a facing. Without this
 *  the Python side would have to re-implement `voiceFor`'s resolution order
 *  (room id, then archetype, then type) and would drift from it the first time
 *  a fallback changed. Emitted rather than re-derived: one home. */
export function facingVoices(plan) {
  const out = {};
  for (const room of plan.rooms || []) {
    for (const f of Object.keys(room.facings || {})) {
      out[`${room.id}/${f}`] = voiceFor(plan, room.id, f).voice.id;
    }
  }
  return out;
}

export function emitMaterials(voices, plan) {
  const stats = assertMaterialsComplete(voices);
  /* Only STORED textures are emitted: an alias is a naming fact, not an asset,
     and the assembler must never be handed a tile id that nothing keeps. The
     aliases travel beside them as their own table so the merge is auditable. */
  /* THE PROSE IS LOOKED UP, NEVER COPIED. A material's words live in VOICES as
     their one home; an ask needs them, so they are resolved here from the
     binding and stamped with the voice they came from. Preference order is
     deliberate: a voice's `walls`/`floor`/`ceiling` prose describes the
     material, while its `blank` phrasing describes the same material with
     nothing on it -- the second is lossy and must not become the ask. */
  const proseOf = new Map();
  for (const [vid, voice] of Object.entries(voices)) {
    for (const key of materialKeysOf(voice)) {
      const m = materialOf(vid, key);
      const str = key.startsWith("hangings.")
        ? voice.hangings[key.slice("hangings.".length)]
        : voice[key];
      /* Two ranks, both deliberate. A voice that names the CANONICAL id
         outright beats one that reaches it through an alias, because the
         alias sources are the strings the ruling merged AWAY and the ask
         should speak in the surviving material's own words. Within that, a
         `walls`/`floor`/`ceiling` prose beats the lossy `blank` phrasing. */
      const rank = (m.aliased ? 10 : 0) + (key === "blank" ? 2 : 1);
      const prev = proseOf.get(m.id);
      if (!prev || rank < prev.rank) proseOf.set(m.id, { rank, prose: str, from: `${vid}.${key}` });
    }
  }
  const materials = {};
  for (const [id, m] of Object.entries(MATERIALS)) {
    if (m.same_as) continue;
    const p = proseOf.get(id);
    if (!p) throw new Error(`room-voices: material \`${id}\` has no prose in any voice`);
    materials[id] = { id, ...m, prose: p.prose, prose_from: p.from,
                      scale_contract: scaleContract(m.slot, m.tiling) };
  }
  const bindings = {};
  for (const [vid, voice] of Object.entries(voices)) {
    bindings[vid] = {};
    for (const key of materialKeysOf(voice)) bindings[vid][key] = materialOf(vid, key).id;
  }
  return {
    _what_this_is:
      "Row 36's texture library types. Emitted from tools/room-voices.mjs, " +
      "which is the one home: the voices say what a surface is made of and " +
      "this says how big it is. Do not hand-edit -- regenerate with " +
      "`node tools/room-voices.mjs --emit-materials`.",
    slot_demand_ppm: SLOT_DEMAND_PPM,
    swatch_w_px: SWATCH_W_PX,
    counts: stats,
    aliases: aliasTable(),
    materials,
    bindings,
    facings: plan ? facingVoices(plan) : null
  };
}

/* ------------------------------------------------------------------ */
/* CLI — `node tools/room-voices.mjs --emit-materials`                 */
/* ------------------------------------------------------------------ */
/* The emitted JSON is what the Python assembler reads, and it is committed so
 * that a build is reproducible without running node first. `fixtures.spec.mjs`
 * already holds two staleness tests of exactly this shape: re-emit, compare
 * bytes, refuse a committed artifact that has drifted from its generator. */
if (import.meta.url === `file://${process.argv[1]}`) {
  const { writeFileSync, mkdirSync, readFileSync } = await import("node:fs");
  const { dirname, join } = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const here = dirname(fileURLToPath(import.meta.url));
  const root = join(here, "..");
  if (process.argv.includes("--emit-materials")) {
    const plan = JSON.parse(readFileSync(join(root, "fixtures", "demo-study", "plan.json"), "utf8"));
    const doc = emitMaterials(VOICES, plan);
    /* `--out` so a FRESHNESS CHECK can emit into a temp file and byte-compare
     * without writing over the committed one — the shape every other generator
     * in this project already offers (`bake-fixtures --out`, `--audit-materials
     * --out`), and what `design/plan-draft/measured/derived.py --check --deep`
     * needs to cover this artifact without touching it. */
    const outFlag = process.argv.indexOf("--out");
    const out = outFlag >= 0 && process.argv[outFlag + 1]
      ? process.argv[outFlag + 1]
      : join(root, "backdrops", "textures", "materials.json");
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, JSON.stringify(doc, null, 2) + "\n");
    const c = doc.counts;
    process.stdout.write(
      `materials: ${c.declared} declared, ${c.aliases} aliased away, ` +
      `${c.stored} stored (${c.base} base + ${c.stored - c.base} variants)\n` +
      `  harvest ${c.harvest}   swatch ${c.swatch}\n` +
      `aliases ruled (${doc.aliases.length}):\n` +
      doc.aliases.map((a) => `  ${a.from}\n    -> ${a.to}\n`).join("") +
      `wrote ${out}\n`);
  } else {
    process.stdout.write("usage: node tools/room-voices.mjs --emit-materials\n");
    process.exit(2);
  }
}
