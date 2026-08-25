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
 */

/* The one measured height. Imported nowhere else on purpose: `make-scaffold`
 * owns `CHAIR_RAIL_M` and this file must agree with it, which
 * `tests/playwright/room-voices.spec.mjs` asserts rather than assumes. */
export const ANCHOR_M = 0.95;

/* Sill and head are the SCAFFOLD's conventions (a plan view holds no vertical
 * dimension), repeated here so a voice's window sentence and the scaffold's own
 * stamped window box cannot drift apart. */
export const WINDOW_SILL_M = 0.90;
export const WINDOW_HEAD_M = 2.00;

/* A light — one glazed pane-field between mullions — is about half a metre in
 * an English mullioned window of this date; the plan's own opening widths
 * (1.00, 1.20, 1.40, 1.50, 2.50 m) divide into 2, 2, 3, 3 and 5 lights at that
 * module, which is exactly the range such windows come in. */
export const LIGHT_MODULE_M = 0.50;

/* ------------------------------------------------------------------ */
/* The voices                                                          */
/* ------------------------------------------------------------------ */
/* Each carries `why` — one line of period justification — because a material
 * table with no justification is a preference, and the next builder has no way
 * to tell a researched choice from a typed one. */

export const VOICES = {
  hall_state: {
    id: "hall_state",
    why: "The great hall is THE display room: oak wainscot with a carved frieze over a flagged floor is the standard c.1660 gentry treatment, and the hall is the one room entitled to armorial glass in quantity.",
    outdoor: false,
    walls: "dark oak wall panelling in fielded bays with a carved frieze above it, lime-plastered wall head",
    ceiling: "a flat lime-plastered ceiling with moulded plaster ribs",
    floor: "a broad worn stone flagstone floor",
    /* [row 40] THE SAME FABRIC AS `walls`, IN FEWER WORDS — not a second one.
     * This read "unbroken oak wainscot under a carved frieze" while `walls`
     * ruled fielded PANELLING with a lime-plastered wall head, and only a
     * facing carrying no carrier ever saw it: a blank wall of the great hall
     * or the solar was told panelling in one sentence and wainscot in another
     * while its carrier-bearing neighbours were told only panelling. A
     * per-FACING property deciding a per-ROOM one is row 40's whole disease.
     * Row 36's MATERIAL_BINDING already binds `blank` and `walls` here to ONE
     * texture id; the words were the only thing dissenting. */
    blank: "unbroken oak panelling in fielded bays under its carved frieze, with the lime-plastered wall head above it",
    anchor: "chair_rail",
    glass: "armorial",
    window_status: "state"
  },
  great_chamber: {
    id: "great_chamber",
    why: "The solar — the great chamber over the hall — is the upper display room and carries the hall's own fabric: oak wainscot and a carved frieze. What it does NOT carry is the arms. Painted heraldry belongs in the hall window, and the ration allows the hall and at most the principal parlour; the prompt lint refuses it anywhere else, which is how this voice was split off from the hall's in the first place.",
    outdoor: false,
    walls: "dark oak wall panelling in fielded bays with a carved frieze above it, lime-plastered wall head",
    ceiling: "a flat lime-plastered ceiling with moulded plaster ribs",
    floor: "wide oak floorboards",
    /* [row 40] The hall's own correction, for the same reason and the same
     * fabric — `great_chamber` carries the hall's walls by design. */
    blank: "unbroken oak panelling in fielded bays under its carved frieze, with the lime-plastered wall head above it",
    anchor: "chair_rail",
    glass: "plain",
    window_status: "state"
  },
  parlour_wainscot: {
    id: "parlour_wainscot",
    why: "Study, library, dining parlour and muniment room are the panelled withdrawing rooms — dark oak wainscot over boards, the voice the approved study reference already carries and the one place it belongs.",
    outdoor: false,
    walls: "dark hand-finished oak wall panelling",
    ceiling: "an aged parchment-toned plaster ceiling",
    floor: "wide worn oak floorboards",
    blank: "unbroken oak panelling",
    anchor: "chair_rail",
    glass: "plain",
    window_status: "principal"
  },
  parlour_armorial: {
    id: "parlour_armorial",
    why: "The dining parlour is the principal parlour: identical fabric to the other panelled rooms, but period practice allows it the single shield the great hall's window carries in quantity — and no more.",
    outdoor: false,
    walls: "dark hand-finished oak wall panelling",
    ceiling: "an aged parchment-toned plaster ceiling",
    floor: "wide worn oak floorboards",
    blank: "unbroken oak panelling",
    anchor: "chair_rail",
    glass: "one_shield",
    window_status: "principal"
  },
  long_gallery: {
    id: "long_gallery",
    why: "A long gallery is a walking room lit down one whole side: oak wainscot, a boarded floor and ranges of windows rather than single ones, which is why it gets its own voice and not the parlour's.",
    outdoor: false,
    walls: "plain oak wainscot below limewashed plaster, with a moulded oak cornice at the wall head",
    ceiling: "a flat lime-plastered ceiling",
    floor: "long wide oak floorboards running the length of the gallery",
    blank: "unbroken oak wainscot below limewashed plaster",
    anchor: "chair_rail",
    glass: "plain",
    window_status: "state"
  },
  bedchamber: {
    id: "bedchamber",
    why: "A c.1660 bedchamber is wainscoted to chair height and HUNG above it — worsted or tapestry hangings, not panelling to the cornice; the best chamber's hangings are the richest in the house.",
    outdoor: false,
    walls: "oak wainscot to chair height with wall hangings above it",
    ceiling: "a plain lime-plastered ceiling",
    floor: "wide oak floorboards",
    blank: "unbroken wainscot below and hangings above",
    anchor: "chair_rail",
    glass: "plain",
    window_status: "principal",
    /* The rank of the hangings is derived per room, below. */
    hangings: {
      best: "a full set of woven tapestry hangings in faded green, umber and dull gold, hung from a rail just below the ceiling and falling to the wainscot capping",
      good: "hangings of dull red worsted say, hung from a rail below the ceiling and falling to the wainscot capping",
      plain: "plain hangings of undyed wool serge, hung from a rail below the ceiling and falling to the wainscot capping"
    }
  },
  garden_parlour: {
    id: "garden_parlour",
    why: "There is no orangery and no sash window in 1660: a garden room of this date is a garden PARLOUR — a low-wainscoted room whose one distinction is generous leaded casement bays looking onto the privy garden. Its light comes from casement COUNT, never from a wall of glass.",
    outdoor: false,
    walls: "light-toned oak wainscot to chair height below limewashed plaster",
    ceiling: "a plain lime-plastered ceiling",
    floor: "a floor of square stone paviours",
    blank: "unbroken light oak wainscot below limewashed plaster",
    anchor: "chair_rail",
    glass: "plain",
    window_status: "state"
  },
  cross_passage: {
    id: "cross_passage",
    why: "The cross passage is the working spine between hall and service: plain oak wainscot under limewash over flags, worn by traffic — no fielded panelling and no frieze.",
    outdoor: false,
    walls: "plain oak wainscot below limewashed plaster",
    ceiling: "a boarded ceiling of plain oak boards on exposed joists",
    floor: "a worn stone flagstone floor",
    blank: "unbroken plain oak wainscot below limewashed plaster",
    anchor: "chair_rail",
    glass: "plain",
    window_status: "service"
  },
  great_stair: {
    id: "great_stair",
    why: "The great stair and its landing are shown to guests: a heavy oak newel stair with turned balusters, wainscot to chair height, and the one tall stair window the plan actually draws.",
    outdoor: false,
    walls: "oak wainscot to chair height below limewashed plaster",
    ceiling: "a plain lime-plastered ceiling",
    floor: "broad oak treads and boards",
    blank: "unbroken oak wainscot below limewashed plaster",
    anchor: "chair_rail",
    glass: "plain",
    window_status: "state"
  },
  back_stair: {
    id: "back_stair",
    why: "A back stair is service fabric: limewashed plaster over a PLAIN BOARDED DADO, plain oak treads, no mouldings and no fielded joinery anywhere.",
    outdoor: false,
    walls: "limewashed plaster above a plain boarded oak dado of square-edged boards, with no mouldings and no fielded joinery",
    ceiling: "a plain plastered soffit",
    floor: "plain scrubbed oak treads and boards",
    blank: "unbroken limewash above a plain boarded dado",
    anchor: "dado_capping",
    glass: "plain",
    window_status: "service"
  },
  service: {
    id: "service",
    why: "Kitchen and buttery in 1660: stone flags, limewashed plaster straight down to the floor, a great open hearth, scrubbed oak fittings. A room where food is dressed carries no joinery on its walls at all — the one horizontal that runs them is the plain peg-rail the gear hangs from.",
    outdoor: false,
    walls: "rough limewashed plaster over stone, carried straight down to the floor unbroken by any timber lining, joinery or moulding",
    ceiling: "heavy smoke-darkened oak ceiling joists with plain boards between them",
    floor: "large worn stone flags",
    blank: "unbroken limewashed plaster over stone",
    anchor: "hanging_rail",
    glass: "plain",
    window_status: "service"
  },
  servants_hall: {
    id: "servants_hall",
    why: "The servants' hall is the plainest inhabited room in the house: plain limewash, a brick or flag floor, scrubbed oak, and nothing else. Fielded oak joinery here would be a status error, not just a material one.",
    outdoor: false,
    walls: "plain limewashed plaster carried straight down to the floor, unbroken by any timber lining, joinery or moulding",
    ceiling: "plain exposed oak joists with boards between them",
    floor: "a floor of worn red brick laid on edge",
    blank: "unbroken plain limewashed plaster",
    anchor: "hanging_rail",
    glass: "plain",
    window_status: "service"
  },
  outdoors_walled: {
    id: "outdoors_walled",
    why: "A privy garden, an entrance court or an approach seen against a wall is OUTSIDE: the wall in frame is garden brick or coursed stone under open sky, with planting and a path underfoot. No interior fabric of any kind belongs in it — this is Kabe's veto, made mechanical.",
    outdoor: true,
    walls: "a garden wall of weathered red brick in English bond on a coursed stone plinth, open sky above it",
    /* AN OUTDOOR FACING THAT CARRIES OPENINGS IS NOT A GARDEN WALL — it is the
     * house's own elevation seen from the garden or the court, and the plan
     * says which by whether it draws any window or door on that wall line.
     * `entrance_court/N` carries six windows and a door; `privy_garden/N`
     * carries nothing. Same voice, and the derivation picks. */
    walls_with_openings: "the manor's own exterior elevation of weathered red brick in English bond, with dressed stone quoins, moulded stone window surrounds and a coursed stone plinth, open sky above the roofline",
    ceiling: null,
    floor: "raked gravel paths between low clipped box and turf",
    blank: "unbroken weathered brickwork on its stone plinth",
    anchor: "string_course",
    glass: "plain",
    /* The elevation of a gentry house is dressed: moulded stone surrounds, not
     * the plain chamfer a service room gets inside. */
    window_status: "principal"
  },
  outdoors_open: {
    id: "outdoors_open",
    why: "A facing the plan types `open` has no wall at all: the view runs out over the forecourt or the park. What closes it and gives the gate its ruler is the low coursed-stone boundary wall that fences a forecourt of this date, its coping at the ruled height.",
    outdoor: true,
    walls: "no building wall at all: the view runs out over open ground, closed only by a low coursed-stone boundary wall running across the far side of it, under open sky",
    ceiling: null,
    floor: "raked gravel and worn turf running to the bottom edge of frame",
    blank: "an unbroken low boundary wall under open sky",
    anchor: "coping",
    glass: "plain",
    window_status: "service"
  }
};

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

export const ANCHORS = {
  chair_rail: {
    id: "chair_rail",
    line: "the wainscot chair-rail above the floor",
    datum: "floor",
    sentence: "A clearly legible wainscot chair-rail runs continuously corner to corner at exactly 0.95 m above the floor, on every exposed wall surface including the side-wall returns.",
    label: "CHAIR-RAIL 0.95 M ABOVE FLOOR - GATE ANCHOR",
    legend_word: "CHAIR-RAIL",
    why: "blueprint §11's universal anchor, and the only one the panelled rooms need"
  },
  dado_capping: {
    id: "dado_capping",
    line: "the plain oak dado capping above the floor",
    datum: "floor",
    sentence: "A plain unmoulded oak capping runs continuously corner to corner at exactly 0.95 m above the floor, topping the boarded dado on every exposed wall surface including the side-wall returns. It is a plain square-edged batten with no mouldings worked on it at all.",
    label: "DADO CAPPING 0.95 M ABOVE FLOOR - GATE ANCHOR",
    legend_word: "DADO CAPPING",
    why: "a boarded service dado is capped with a plain batten; same height, no mouldings, no panelling"
  },
  hanging_rail: {
    id: "hanging_rail",
    line: "the plain oak hanging rail above the floor",
    datum: "floor",
    sentence: "A plain scrubbed-oak hanging rail, pegged with iron hooks, runs continuously corner to corner at exactly 0.95 m above the floor, fixed straight onto the limewashed plaster on every exposed wall surface including the side-wall returns. It is a single square-edged batten on bare plaster, with no timber lining, no joinery and no moulding anywhere behind it or below it.",
    label: "HANGING RAIL 0.95 M ABOVE FLOOR - GATE ANCHOR",
    legend_word: "HANGING RAIL",
    why: "the peg-rail every c.1660 kitchen, buttery and servants' hall hung its gear from — a real continuous horizontal in a room that has no wainscot"
  },
  string_course: {
    id: "string_course",
    line: "the stone string-course above the ground",
    datum: "ground",
    sentence: "A single projecting course of dressed stone runs continuously across the whole wall at exactly 0.95 m above the ground, capping the wall's plinth. It is masonry standing in the open air: no timber rail, no lining and no built interior finish of any kind appears anywhere in this picture.",
    label: "STRING-COURSE 0.95 M ABOVE GROUND - GATE ANCHOR",
    legend_word: "STRING-COURSE",
    why: "a brick garden wall of this date is built off a stone plinth capped by a string-course; it is the outdoor equivalent horizontal"
  },
  coping: {
    id: "coping",
    line: "the boundary wall coping above the ground",
    datum: "ground",
    sentence: "A low coursed-stone boundary wall runs right across the far side of the view, and the flat stone coping along its top sits at exactly 0.95 m above the ground at that wall. It is masonry standing in the open air: no timber rail, no lining and no built interior finish of any kind appears anywhere in this picture.",
    label: "COPING 0.95 M ABOVE GROUND - GATE ANCHOR",
    legend_word: "COPING",
    why: "an open facing has no building wall; a forecourt of this date is closed by a low walled boundary, and its coping is the one ruled horizontal available"
  }
};

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

export const ROOM_VOICE = {
  /* id vocabulary: "great_hall" and "solar" are the two display rooms, and they
   * are separated because only the hall is entitled to armorial glass — the
   * archetype `hall` covers both and would have put the arms upstairs too. */
  great_hall: "hall_state",
  solar: "great_chamber",
  /* id vocabulary: the panelled withdrawing rooms. `muniment_room` is the
   * evidence room off the solar — a small panelled closet, not a service room,
   * which its id says and its `chamber` archetype does not. */
  study: "parlour_wainscot",
  library: "parlour_wainscot",
  muniment_room: "parlour_wainscot",
  /* id vocabulary: "parlour" in the id is what licenses the single shield. */
  dining_parlour: "parlour_armorial",
  /* id vocabulary: "long_gallery" — archetype says `corridor`, which would have
   * given the manor's grandest upper room the cross passage's voice. */
  long_gallery: "long_gallery",
  /* id vocabulary: "*_bedchamber", "guest_chamber", "closet_chamber". The
   * archetype for all three is `chamber`, identical to the study's. */
  master_bedchamber: "bedchamber",
  guest_chamber: "bedchamber",
  closet_chamber: "bedchamber",
  /* id vocabulary: "garden_room". Archetype `chamber` again. */
  garden_room: "garden_parlour",
  /* id vocabulary: "hall" alone is this plan's CROSS PASSAGE (its `name` says
   * so); the great hall is `great_hall`. Keying on the archetype `corridor`
   * would have merged it with the long gallery. */
  hall: "cross_passage",
  /* id vocabulary: "great_stair_hall" and "stair_landing" are the shown stair;
   * "back_stair" and "back_stair_head" are the service stair. Both pairs share
   * the archetype `stair`, so only the id separates them. */
  great_stair_hall: "great_stair",
  stair_landing: "great_stair",
  back_stair: "back_stair",
  back_stair_head: "back_stair",
  /* id vocabulary: "kitchen", "buttery_pantry", "servants_hall". All three are
   * archetype `service`, which the old table did not carry at all — this is the
   * exact set that fell through to the study's paragraph. The servants' hall is
   * plainer still than the kitchen, so it is separated by id. */
  kitchen: "service",
  buttery_pantry: "service",
  servants_hall: "servants_hall",
  /* id vocabulary: "privy_garden", "entrance_court", "entrance_approach". These
   * are also the only rooms typed `open`, so id and type agree; the type is
   * what generalises to a future plan. */
  privy_garden: "outdoors_walled",
  entrance_court: "outdoors_walled",
  entrance_approach: "outdoors_walled"
};

/* The fallback for a room id this table has never seen, so a FUTURE plan still
 * resolves rather than silently taking the first voice in the file. Keyed on
 * archetype, then on type; every entry is the safest member of its family. */
export const ARCHETYPE_FALLBACK = {
  hall: "hall_state",
  chamber: "parlour_wainscot",
  corridor: "cross_passage",
  stair: "great_stair",
  service: "service",
  open: "outdoors_walled"
};
export const TYPE_FALLBACK = {
  enclosed: "parlour_wainscot",
  corridor: "cross_passage",
  open: "outdoors_walled"
};

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
export function surroundFor(status) {
  if (status === "state") return "under a moulded stone label mould";
  if (status === "principal") return "in a moulded stone surround";
  return "in a plain chamfered stone surround";
}

const COUNT_WORD = ["no", "one", "two", "three", "four", "five", "six",
  "seven", "eight", "nine", "ten"];
const count = (n) => COUNT_WORD[n] || String(n);

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
      `divided by ${count(mullions)} stone mullion${mullions > 1 ? "s" : ""} into ` +
      `${count(lights)} equal upright light${lights > 1 ? "s" : ""}` +
      (transomFor(g.width_m)
        ? ", and crossed by a single stone transom, the only transom on this " + surface
        : "") +
      `, the sill ${WINDOW_SILL_M.toFixed(2)} m above the ${datum} and the head ${WINDOW_HEAD_M.toFixed(2)} m above it.`);
  }
  /* WHICH LIGHT OPENS is derived from where each opening sits on the wall: one
   * left of the wall's centre hangs its casement on the left, one right of
   * centre on the right. It is the hinge a joiner would actually have hung, and
   * it varies with the plan rather than with a choice — which is what stops a
   * range of identical windows reading as one window stamped four times. */
  const left = windows.filter((w) => (w.u == null ? 0.5 : w.u) < 0.5).length;
  const right = windows.length - left;
  const side = left && right
    ? `the left-hand light in the ${count(left)} opening${left > 1 ? "s" : ""} left of the ` +
      `${surface}'s centre, and the right-hand light in the ${count(right)} right of it.`
    : `the ${left ? "left" : "right"}-hand light${many ? ", in every one of them" : ""}.`;
  L.push(`  One light in ${many ? "each window" : "it"} is a casement hung on iron hinges: ${side}`);
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
export const INTERIOR_FABRIC =
  /panell?ing|panell?ed|wainscot\w*|chair[- ]?rail|\bdado\b|floorboards?|plaster ceiling|ceiling joists?|\bskirting\b|\bhearth\b|\bfireplace\b/i;

/** Whether a sentence may be carried into an OUTDOOR wall's prompt. */
export function carryableOutdoors(sentence) {
  return !INTERIOR_FABRIC.test(sentence || "");
}

/* What replaces a correction that cannot be carried: the forward half of it,
 * saying that the earlier attempt is superseded by what follows, in words the
 * clause permits. The reason itself is in the packet. */
export const REDACTED_CORRECTION =
  "the previous attempt at this wall was rejected because it did not paint this place as the " +
  "materials and the anchor below describe it. Those words replace anything the earlier attempt " +
  "showed; follow them exactly.";

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
export const MATERIALS = {
  /* ---- wall fabrics: the harvest lane (anisotropy 1.000, §1.2) ---- */
  "wall/oak-fielded-bays-frieze": {
    slot: "walls", lane: "harvest",
    tiling: { grain_axis: "v", grain_frame: "surface", mirror: "across",
              scale_kind: "periodic", pitch_m: 0.80, feature: "fielded panel bay" }
  },
  "wall/dark-oak-panelling": {
    slot: "walls", lane: "harvest",
    tiling: { grain_axis: "v", grain_frame: "surface", mirror: "across",
              scale_kind: "periodic", pitch_m: 0.80, feature: "panel bay" }
  },
  "wall/oak-wainscot-limewash-cornice": {
    slot: "walls", lane: "harvest",
    tiling: { grain_axis: "v", grain_frame: "surface", mirror: "across",
              scale_kind: "periodic", pitch_m: 0.80, feature: "wainscot bay" }
  },
  "wall/oak-wainscot-with-hangings": {
    slot: "walls", lane: "harvest",
    tiling: { grain_axis: "v", grain_frame: "surface", mirror: "across",
              scale_kind: "periodic", pitch_m: 0.80, feature: "wainscot bay" },
    note: "the DADO band only; the field band above it is one of the three " +
          "`wall/hangings-*` variants, chosen per room by `hangingsFor`"
  },
  "wall/light-oak-wainscot-limewash": {
    slot: "walls", lane: "harvest",
    tiling: { grain_axis: "v", grain_frame: "surface", mirror: "across",
              scale_kind: "periodic", pitch_m: 0.80, feature: "wainscot bay" }
  },
  "wall/plain-oak-wainscot-limewash": {
    same_as: "wall/oak-wainscot-limewash",
    alias_reason:
      "differ only by \"plain\" and \"to chair height\" -- both are oak wainscot below limewashed plaster. THE CONSEQUENCE IS THE POINT: cross_passage had no promoted facing and was the library's only wall swatch; great_stair has one, so this alias turns an ask into a harvest.",
    slot: "walls", lane: "swatch",
    tiling: { grain_axis: "v", grain_frame: "surface", mirror: "across",
              scale_kind: "periodic", pitch_m: 0.80, feature: "wainscot bay" },
    note: "SWATCH because `cross_passage` has no promoted facing anywhere in " +
          "the manor -- `hall` is unpainted -- so there is nothing to harvest from"
  },
  "wall/oak-wainscot-limewash": {
    slot: "walls", lane: "harvest",
    tiling: { grain_axis: "v", grain_frame: "surface", mirror: "across",
              scale_kind: "periodic", pitch_m: 0.80, feature: "wainscot bay" }
  },
  "wall/boarded-oak-dado-limewash": {
    slot: "walls", lane: "harvest",
    tiling: { grain_axis: "v", grain_frame: "surface", mirror: "across",
              scale_kind: "periodic", pitch_m: 0.25, feature: "square-edged dado board" }
  },
  "wall/rough-limewash-over-stone": {
    same_as: "wall/plain-limewash-to-floor",
    alias_reason:
      "\"rough ... over stone\" and \"plain\" are finish adjectives over the same material: limewashed plaster carried straight to the floor with no joinery.",
    slot: "walls", lane: "harvest",
    tiling: { grain_axis: null, grain_frame: "surface", mirror: "both",
              scale_kind: "stochastic", characteristic_m: 0.05,
              feature: "the trowelled undulation of limewash over rubble" }
  },
  "wall/plain-limewash-to-floor": {
    slot: "walls", lane: "harvest",
    tiling: { grain_axis: null, grain_frame: "surface", mirror: "both",
              scale_kind: "stochastic", characteristic_m: 0.04,
              feature: "the trowelled undulation of plain limewash" }
  },
  "wall/garden-brick-english-bond": {
    slot: "walls", lane: "harvest",
    tiling: { grain_axis: "u", grain_frame: "surface", mirror: "across",
              scale_kind: "periodic", pitch_m: 0.075, feature: "brick course" }
  },
  "wall/manor-exterior-elevation": {
    slot: "walls", lane: "harvest",
    tiling: { grain_axis: "u", grain_frame: "surface", mirror: "across",
              scale_kind: "periodic", pitch_m: 0.075, feature: "brick course" },
    note: "the THIRTEENTH wall fabric, invisible to a walls/ceiling/floor " +
          "census: `outdoors_walled.walls_with_openings`, selected in " +
          "`make-scaffold.mjs` when the plan draws any carrier on that wall " +
          "line. 7 of the 8 outdoor facings render it"
  },
  "wall/low-boundary-wall": {
    slot: "walls", lane: "harvest",
    tiling: { grain_axis: "u", grain_frame: "surface", mirror: "across",
              scale_kind: "periodic", pitch_m: 0.12, feature: "stone course" }
  },

  /* ---- the bedchamber's three field bands ---- */
  "wall/hangings-tapestry": {
    slot: "walls", lane: "harvest", variant_of: "wall/oak-wainscot-with-hangings",
    tiling: { grain_axis: null, grain_frame: "surface", mirror: "both",
              scale_kind: "stochastic", characteristic_m: 0.03,
              feature: "the weave of woven tapestry" }
  },
  "wall/hangings-red-worsted": {
    slot: "walls", lane: "harvest", variant_of: "wall/oak-wainscot-with-hangings",
    tiling: { grain_axis: null, grain_frame: "surface", mirror: "both",
              scale_kind: "stochastic", characteristic_m: 0.02,
              feature: "the weave of worsted say" }
  },
  "wall/hangings-wool-serge": {
    slot: "walls", lane: "harvest", variant_of: "wall/oak-wainscot-with-hangings",
    tiling: { grain_axis: null, grain_frame: "surface", mirror: "both",
              scale_kind: "stochastic", characteristic_m: 0.02,
              feature: "the weave of undyed wool serge" }
  },

  /* ---- ceilings: all swatch (0 of 51 facings clear the demand, §1.2) ---- */
  "ceiling/lime-plaster-ribs": {
    slot: "ceiling", lane: "swatch",
    tiling: { grain_axis: null, grain_frame: "plan", mirror: "both",
              scale_kind: "periodic", pitch_m: 1.20, feature: "moulded plaster rib bay" }
  },
  "ceiling/parchment-plaster": {
    slot: "ceiling", lane: "swatch",
    tiling: { grain_axis: null, grain_frame: "plan", mirror: "both",
              scale_kind: "featureless" }
  },
  "ceiling/flat-lime-plaster": {
    same_as: "ceiling/plain-lime-plaster",
    alias_reason:
      "plain and flat are synonyms here; the material is lime plaster either way.",
    slot: "ceiling", lane: "swatch",
    tiling: { grain_axis: null, grain_frame: "plan", mirror: "both",
              scale_kind: "featureless" }
  },
  "ceiling/plain-lime-plaster": {
    slot: "ceiling", lane: "swatch",
    tiling: { grain_axis: null, grain_frame: "plan", mirror: "both",
              scale_kind: "featureless" }
  },
  "ceiling/boarded-oak-joists": {
    same_as: "ceiling/plain-exposed-joists",
    alias_reason:
      "the same ceiling said twice -- plain oak boards on exposed joists.",
    slot: "ceiling", lane: "swatch",
    tiling: { grain_axis: "room_short", grain_frame: "plan", mirror: "across",
              scale_kind: "periodic", pitch_m: 0.90, feature: "exposed joist" }
  },
  "ceiling/smoke-darkened-joists": {
    slot: "ceiling", lane: "swatch",
    tiling: { grain_axis: "room_short", grain_frame: "plan", mirror: "across",
              scale_kind: "periodic", pitch_m: 0.90, feature: "exposed joist" }
  },
  "ceiling/plain-exposed-joists": {
    slot: "ceiling", lane: "swatch",
    tiling: { grain_axis: "room_short", grain_frame: "plan", mirror: "across",
              scale_kind: "periodic", pitch_m: 0.90, feature: "exposed joist" }
  },
  "ceiling/plain-plastered-soffit": {
    same_as: "ceiling/plain-lime-plaster",
    alias_reason:
      "a soffit is where the plaster is, not what it is; plain plaster and plain lime plaster are one material in this period.",
    slot: "ceiling", lane: "swatch",
    tiling: { grain_axis: null, grain_frame: "plan", mirror: "both",
              scale_kind: "featureless" }
  },

  /* ---- floors: all swatch (0 of 51 facings clear the demand, §1.2) ---- */
  "floor/broad-stone-flags": {
    same_as: "floor/worn-stone-flags",
    alias_reason:
      "broad/large/worn are size adjectives on one material. NO voice's period justification names a different stone or a different laying pattern -- checked, all three say worn stone flags.",
    slot: "floor", lane: "swatch",
    tiling: { grain_axis: null, grain_frame: "plan", mirror: "both",
              scale_kind: "stochastic", characteristic_m: 0.70,
              feature: "the spread of a broad worn flag" }
  },
  "floor/wide-oak-boards": {
    slot: "floor", lane: "swatch",
    tiling: { grain_axis: "room_long", grain_frame: "plan", mirror: "across",
              scale_kind: "periodic", pitch_m: 0.25, feature: "floorboard" }
  },
  "floor/wide-worn-oak-boards": {
    same_as: "floor/wide-oak-boards",
    alias_reason:
      "worn is a finish adjective on wide oak floorboards.",
    slot: "floor", lane: "swatch",
    tiling: { grain_axis: "room_long", grain_frame: "plan", mirror: "across",
              scale_kind: "periodic", pitch_m: 0.25, feature: "floorboard" }
  },
  "floor/gallery-long-oak-boards": {
    same_as: "floor/wide-oak-boards",
    alias_reason:
      "\"running the length of the gallery\" is a LAYING DIRECTION, and direction is already carried by grain_axis room_long, which all three share -- so it is not a second material.",
    slot: "floor", lane: "swatch",
    tiling: { grain_axis: "room_long", grain_frame: "plan", mirror: "across",
              scale_kind: "periodic", pitch_m: 0.25, feature: "floorboard" },
    note: "the gallery's voice says the boards run its LENGTH, which is what " +
          "`room_long` means and why grain is a plan fact and not a facing one"
  },
  "floor/square-stone-paviours": {
    slot: "floor", lane: "swatch",
    tiling: { grain_axis: null, grain_frame: "plan", mirror: "both",
              scale_kind: "periodic", pitch_m: 0.45, feature: "square paviour" }
  },
  "floor/worn-stone-flags": {
    slot: "floor", lane: "swatch",
    tiling: { grain_axis: null, grain_frame: "plan", mirror: "both",
              scale_kind: "stochastic", characteristic_m: 0.55,
              feature: "the spread of a worn flag" }
  },
  "floor/broad-oak-treads-boards": {
    slot: "floor", lane: "swatch",
    tiling: { grain_axis: "room_long", grain_frame: "plan", mirror: "across",
              scale_kind: "periodic", pitch_m: 0.25, feature: "board" }
  },
  "floor/scrubbed-oak-treads-boards": {
    same_as: "floor/broad-oak-treads-boards",
    alias_reason:
      "broad and plain scrubbed are finish adjectives on oak treads and boards. Kept separate from the floorboards: treads name a stair surface.",
    slot: "floor", lane: "swatch",
    tiling: { grain_axis: "room_long", grain_frame: "plan", mirror: "across",
              scale_kind: "periodic", pitch_m: 0.25, feature: "board" },
    note: "NAMES TWO GEOMETRIES IN ONE STRING -- stair treads and floor " +
          "boards are not the same surface. Recorded rather than split, " +
          "because stair rooms are not assembly customers (36-plan.md §2.6)"
  },
  "floor/large-worn-stone-flags": {
    same_as: "floor/worn-stone-flags",
    alias_reason:
      "as above: a size adjective, not a different stone.",
    slot: "floor", lane: "swatch",
    tiling: { grain_axis: null, grain_frame: "plan", mirror: "both",
              scale_kind: "stochastic", characteristic_m: 0.80,
              feature: "the spread of a large worn flag" }
  },
  "floor/red-brick-on-edge": {
    slot: "floor", lane: "swatch",
    tiling: { grain_axis: "room_long", grain_frame: "plan", mirror: "across",
              scale_kind: "periodic", pitch_m: 0.115, feature: "brick laid on edge" }
  },
  "floor/raked-gravel-box-turf": {
    slot: "floor", lane: "swatch",
    tiling: { grain_axis: null, grain_frame: "plan", mirror: "both",
              scale_kind: "stochastic", characteristic_m: 0.02,
              feature: "raked gravel grain" }
  },
  "floor/gravel-and-turf": {
    /* The voice says "...running to the bottom edge of frame", which is a true
       and useful thing to tell a painter about a FACING and a meaningless one
       to tell a flat sample -- the swatch ask refuses picture-talk, and this is
       the same ground said without the picture. */
    swatch_prose: "raked gravel and worn turf, the two running together",
    slot: "floor", lane: "swatch",
    tiling: { grain_axis: null, grain_frame: "plan", mirror: "both",
              scale_kind: "stochastic", characteristic_m: 0.02,
              feature: "raked gravel grain" }
  }
};

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
export const MATERIAL_BINDING = {
  hall_state:       { walls: "wall/oak-fielded-bays-frieze", blank: "wall/oak-fielded-bays-frieze",
                      ceiling: "ceiling/lime-plaster-ribs", floor: "floor/broad-stone-flags" },
  great_chamber:    { walls: "wall/oak-fielded-bays-frieze", blank: "wall/oak-fielded-bays-frieze",
                      ceiling: "ceiling/lime-plaster-ribs", floor: "floor/wide-oak-boards" },
  parlour_wainscot: { walls: "wall/dark-oak-panelling", blank: "wall/dark-oak-panelling",
                      ceiling: "ceiling/parchment-plaster", floor: "floor/wide-worn-oak-boards" },
  parlour_armorial: { walls: "wall/dark-oak-panelling", blank: "wall/dark-oak-panelling",
                      ceiling: "ceiling/parchment-plaster", floor: "floor/wide-worn-oak-boards" },
  /* THE GALLERY'S `blank` IS THE GALLERY'S OWN FABRIC, cornice included, even
   * though its blank PROSE does not mention the cornice -- "unbroken oak
   * wainscot below limewashed plaster" is byte-identical to `great_stair`'s
   * blank string and they are NOT the same material. A blank gallery wall still
   * has a moulded cornice at its head; the phrasing is just lossy about it.
   * This is why a binding is keyed on (voice, key) and never on the string: two
   * voices can say the same words about different fabrics. */
  long_gallery:     { walls: "wall/oak-wainscot-limewash-cornice", blank: "wall/oak-wainscot-limewash-cornice",
                      ceiling: "ceiling/flat-lime-plaster", floor: "floor/gallery-long-oak-boards" },
  bedchamber:       { walls: "wall/oak-wainscot-with-hangings", blank: "wall/oak-wainscot-with-hangings",
                      ceiling: "ceiling/plain-lime-plaster", floor: "floor/wide-oak-boards",
                      "hangings.best": "wall/hangings-tapestry",
                      "hangings.good": "wall/hangings-red-worsted",
                      "hangings.plain": "wall/hangings-wool-serge" },
  garden_parlour:   { walls: "wall/light-oak-wainscot-limewash", blank: "wall/light-oak-wainscot-limewash",
                      ceiling: "ceiling/plain-lime-plaster", floor: "floor/square-stone-paviours" },
  cross_passage:    { walls: "wall/plain-oak-wainscot-limewash", blank: "wall/plain-oak-wainscot-limewash",
                      ceiling: "ceiling/boarded-oak-joists", floor: "floor/worn-stone-flags" },
  great_stair:      { walls: "wall/oak-wainscot-limewash", blank: "wall/oak-wainscot-limewash",
                      ceiling: "ceiling/plain-lime-plaster", floor: "floor/broad-oak-treads-boards" },
  back_stair:       { walls: "wall/boarded-oak-dado-limewash", blank: "wall/boarded-oak-dado-limewash",
                      ceiling: "ceiling/plain-plastered-soffit", floor: "floor/scrubbed-oak-treads-boards" },
  service:          { walls: "wall/rough-limewash-over-stone", blank: "wall/rough-limewash-over-stone",
                      ceiling: "ceiling/smoke-darkened-joists", floor: "floor/large-worn-stone-flags" },
  servants_hall:    { walls: "wall/plain-limewash-to-floor", blank: "wall/plain-limewash-to-floor",
                      ceiling: "ceiling/plain-exposed-joists", floor: "floor/red-brick-on-edge" },
  outdoors_walled:  { walls: "wall/garden-brick-english-bond", blank: "wall/garden-brick-english-bond",
                      walls_with_openings: "wall/manor-exterior-elevation",
                      floor: "floor/raked-gravel-box-turf" },
  outdoors_open:    { walls: "wall/low-boundary-wall", blank: "wall/low-boundary-wall",
                      floor: "floor/gravel-and-turf" }
};

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
    const out = join(root, "backdrops", "textures", "materials.json");
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
