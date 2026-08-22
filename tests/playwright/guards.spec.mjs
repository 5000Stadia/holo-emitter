/* THE CLAUSE LEDGER — row 11's mechanisms, each with a case that fails on
 * that mechanism alone.
 *
 * Why this file exists rather than six more ad-hoc cases. Row 3's last
 * examination round found one family behind five separate blockers: every fix
 * for a previous blocker landed in the artifact and none of them landed as a
 * check. Row 11's artifact critic found the same family a third time on this
 * project — six mechanisms this row is built on survived deletion with the
 * whole suite green, including the two the row's own prose calls load-bearing.
 * `replicator/tests/test_clause_guards.py` is the architecture that answered
 * it on the Python side; this is its shape ported to the browser side, on the
 * Navigator's ruling that the family's architecture goes on the table rather
 * than its instances being patched again.
 *
 * The rule, unchanged from row 3:
 *
 *   > A fix for a named finding arrives with a case that fails on THAT CLAUSE
 *   > ALONE, and asserts the clause BY NAME — not the gate id it shares with
 *   > five other clauses, and not "some hard check went red".
 *
 * Two things make it structural rather than a habit. Every clause carries a
 * stable `[row11:<name>]` or `[row20:<name>]` token in the finding it emits — the
 * prefix is the ROW THAT MINTED the clause, not a version — so a case can name
 * what fired instead of pattern-matching prose that will be reworded. And
 * `MECHANISMS` below declares the full set: the ledger test asserts that the
 * set of cases in this file is EXACTLY the declared set, so a mechanism added
 * without a case shows up as an absence rather than as silence.
 *
 * Every case in this module was written by breaking the thing it guards and
 * watching it go red.
 */
import { test, expect, repoRoot, stageTree, removeTree, bake, appUrl, navUrl } from "./helpers.mjs";
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { createRequire } from "node:module";
import { validate } from "../../tools/validate-fixtures.mjs";
import { validatePlan, drawn } from "../../tools/validate-plan.mjs";
import { deriveMeta, metaForFacing, projectPlacement } from "../../tools/plan-projection.mjs";

const require = createRequire(import.meta.url);
const FIXTURE_DIR = join(repoRoot, "fixtures", "demo-study");
const PLAN = JSON.parse(readFileSync(join(FIXTURE_DIR, "plan.json"), "utf8"));
const WORLD = JSON.parse(readFileSync(join(FIXTURE_DIR, "world.json"), "utf8"));
const RECORDS = require(join(repoRoot, "src", "placeholders.js")).records;
const clone = (o) => JSON.parse(JSON.stringify(o));

/** Every facing the world names, with the meta the page is baked with. */
function shippedMetas() {
  const out = {};
  for (const loc of WORLD.locations) {
    for (const f of loc.facings) out[`${loc.id}/${f}`] = metaForFacing(PLAN, loc.id, f);
  }
  return out;
}

/** The clause tokens a doctored meta map makes the fixture validator emit. */
function tokensFromMetas(doctor) {
  const metas = shippedMetas();
  doctor(metas);
  return tokensOf(validate(FIXTURE_DIR, RECORDS, metas));
}

/* [Row 21] The same, on the NAVIGATION fixture — the world whose doorways are
 * building facts rather than leaves. Two clauses can only be reached from a
 * world that stages no leaf, and this is the shipped one that does not. */
const NAV_DIR = join(repoRoot, "fixtures", "nav-manor");
const NAV_WORLD = JSON.parse(readFileSync(join(NAV_DIR, "world.json"), "utf8"));
function navMetas() {
  const out = {};
  for (const loc of NAV_WORLD.locations) {
    for (const f of loc.facings) out[`${loc.id}/${f}`] = metaForFacing(PLAN, loc.id, f);
  }
  return out;
}
function tokensFromNavMetas(doctor) {
  const metas = navMetas();
  doctor(metas);
  return tokensOf(validate(NAV_DIR, RECORDS, metas));
}

function tokensOf(findings) {
  const out = new Set();
  for (const f of findings) {
    const m = /\[row\d+:([a-z_.]+)\]/g;
    let hit;
    while ((hit = m.exec(f)) !== null) out.add(hit[1]);
  }
  return out;
}

/* ------------------------------------------------------------------ the
 * REGISTRY. Every case registers itself here as it is defined, so the
 * completeness check reads the cases that EXIST rather than a second list of
 * their names. Row 11's first ledger compared two hand-typed lists to each
 * other: deleting a whole case left it green, which is the one thing a
 * completeness check is for. */
/* THE SCANNED SET IS DERIVED FROM THE DIRECTORY, NOT TYPED. It was a
   hand-typed list of four paths that happened to be all of `tools/` — but
   nothing asserted that, so a fifth tool with an emit site would have been
   invisible to both the "emitted but undeclared" check and the
   one-token-one-site count. Same shape of hole as counting tokens per file
   instead of over their union, and a directory read cannot fall behind the
   directory. */
/* WHERE A CLAUSE CAN BE EMITTED FROM, walked to the bottom.
   [Round 5] This has now been the same hole three times, one level out each
   time: a hand-typed FILE list (a fifth tool would be invisible), then a
   directory read of `tools/` alone (row 21 minted three clauses in
   `design/plan-draft/measured/prompt_lint.py` and every check here was silent),
   then a hand-typed list of two DIRECTORIES read non-recursively — a critic put
   an emit site in `tools/lib/` and another in `design/plan-draft/` itself and
   both were invisible again.

   So the roots are the places this project PRODUCES findings from — its source,
   its tools, the replicator, the plan machinery — and each is walked to the
   bottom. What is deliberately not walked is `tests/` and the design documents:
   a test is not an emit site, and both of those carry the token's shape in
   prose about the ledger itself. That exclusion is the one typed thing left,
   and it is typed on a different axis from the hole: a new emit site anywhere
   under a root is caught, and moving one INTO the test suite would not make it
   a clause a validator emits. */
const EMITTING_ROOTS = ["src", "tools", "replicator", "design/plan-draft"];
const EMITTING_EXT = /\.(mjs|js|cjs|py)$/;
function walkForSources(rel) {
  const out = [];
  const abs = join(repoRoot, rel);
  if (!existsSync(abs)) return out;
  for (const e of readdirSync(abs, { withFileTypes: true })) {
    if (e.name === "__pycache__" || e.name === "node_modules" || e.name === ".git") continue;
    const child = `${rel}/${e.name}`;
    if (e.isDirectory()) out.push(...walkForSources(child));
    else if (EMITTING_EXT.test(e.name)) out.push(child);
  }
  return out;
}
const SCANNED = [...EMITTING_ROOTS.flatMap(walkForSources), "index.html"].sort();

/* THE ROW PREFIX IS DERIVED TOO, and it is the other typed half a round-5
   critic found. The token grammar was `[row(?:11|20):…]`, so a probe emitting
   `[row21:meta.brand_new]` was invisible to both the undeclared check and the
   one-token-one-site count — a whole future row's clauses could arrive
   unguarded and the scan would say nothing. The prefix set now comes from the
   tokens the sources actually carry, so the grammar cannot fall behind them,
   and the same argument that derived the file set derives this. */
const TOKEN_RE = /\[row(\d+):([a-z_.]+)\]/g;

/* AND THE GRAMMAR IS READ, NOT ONLY APPLIED — the row prefix was derived and
   the token BODY was left typed one character class in, which is the same hole
   one level down. `[row21:meta.brandNew]` and `[row23:MetaFoo]` do not match
   `[a-z_.]+`, so they are not undeclared tokens to the scan above; they are not
   tokens at all, and both checks say nothing about them. A critic added all
   three to `validate-fixtures.mjs` and the suite stayed green.
   `TOKEN_LOOSE_RE` matches anything SHAPED like a token, and the case below
   requires each match to parse — so a malformed token is a finding rather than
   a silence, and the strict grammar can no longer be evaded by breaking it.

   AND IT IS THE OPENING SHAPE ALONE, case-blind and unbudgeted. The first
   version of this was `/\[row\d*:?([^\]\n]{0,80})(\]|\n|$)/` and carried two
   typed constants of its own, each the exact shape it was written to close: a
   critic escaped it with `[ROW21:meta.brandNew]`, invisible to a case-sensitive
   `\[row`, and with an 94-character body, invisible past `{0,80}` — both
   landing back in the "neither declared nor undeclared" state this case exists
   to abolish. There is nothing left to type narrower than the thing it hunts:
   an opening bracket, `row`, a digit, and then the rest of that line is the
   case's problem rather than the pattern's.

   AND THE DIGIT IS GONE TOO, which is the step `design/architecture.md` said
   was still open and a round-4 critic walked straight through: a token
   ASSEMBLED AT RUNTIME — `` `[row${ROW}:meta.sneaky]` `` — spells `[row$`, so
   a pattern requiring a digit next saw nothing, and the clause was neither
   declared nor undeclared nor malformed. `[row:x]` and `[rowXX:x]` are the
   same hole. What separates a tag from the prose annotation this codebase
   writes everywhere (`[Row 21]`, `[row 21, round 3]`) is not a digit but a
   SPACE: a tag has none. So the hunt is `[row` NOT followed by whitespace, and
   everything it finds must parse. */
const TOKEN_LOOSE_RE = /\[row(?![ \t])/gi;

/* A CLAUSE WITH SEVERAL ARMS NEEDS A CASE PER ARM. [Row 21, round 4] The
   ledger's rule is "a case that fails on that clause alone", and this row
   proved the other half of it is just as load-bearing: a clause that compares
   six fields, or refuses four edges, emits ONE token from ONE site, so both
   completeness checks are satisfied by a case that exercises a single arm —
   and five of the six can then be deleted with the suite green. `everyArm`
   asserts each arm trips the clause BY ITSELF, and returns the union so the
   registered case still reads as one clause. */
function everyArm(name, arms) {
  const union = new Set();
  for (const [arm, doctor] of Object.entries(arms)) {
    const tripped = [...doctor()].sort();
    expect(tripped,
      `${name}: the ${arm} arm alone must trip this clause and nothing else`)
      .toEqual([name]);
    for (const t of tripped) union.add(t);
  }
  return union;
}

/** A well-formed meta opening, with one field spoiled. */
const openingRect = (over) => ({ id: "op13", via: "door1", x: 900, y: 300, w: 220,
  h: 500, beyond_m: 8.6, beyond_offset_m: 1.1, ...over });

function forEachOpening(metas, fn) {
  for (const key of Object.keys(metas)) for (const o of (metas[key].openings || [])) fn(o);
}

const REGISTERED = new Set();
function ledgerCase(name, body) {
  REGISTERED.add(name);
  test(`red on ${name} alone`, body);
}

/* The declared set. Adding a mechanism here without a case below is an
 * absence; a case whose name is not here is a name nobody owns.
 *
 * WHAT THIS LEDGER DOES NOT COUNT, said here rather than discovered. Two of
 * row 20's headline picture guards — corner honesty (a corner is drawn exactly
 * when it is honestly in frame, `mechanisms.spec`) and the glyph's size cap
 * (`geometry.spec`) — are ordinary tests, not ledger mechanisms. Both work and
 * both were verified red by reverting what they guard, but neither carries a
 * token and neither is named below, so DELETING THOSE TESTS leaves every
 * completeness assertion in this file green. They are not counted because
 * their subject is a measurement of the picture rather than a clause with an
 * emit site, and the renderer's source scan — the machinery that would let a
 * picture guard be counted — is row 18's. Two things are true at once: the
 * ledger is complete over what it declares, and what it declares is not
 * everything the row relies on. */
export const MECHANISMS = [
  // the §5 meta schema arm (tools/validate-fixtures.mjs checkMeta) — ONE NAME
  // PER ARM. Row 11's first ledger gave `meta.camera_pairing` four arms and
  // exercised one, which is the failure this file's header says it exists to
  // prevent, committed by the file itself.
  /* [Row 21] The doorway as a fact about the building, and the two ways a
     world can name a way through that is neither. */
  "meta.building_fields",
  "meta.building_segments",
  "meta.openings_list",
  "meta.opening_rect",
  "meta.opening_via",
  "meta.opening_beyond",
  "staging.pair_half_missing",
  "exit.via_unfilled",
  "exit.opening_offscreen",
  "meta.required_fields",
  "meta.unknown_key",
  "meta.storey_height",
  "meta.facing_type",
  "meta.open_needs_far",
  "meta.open_rejects_wall",
  "meta.walled_needs_wall",
  "meta.walled_rejects_far",
  "meta.corner_pairing",
  "meta.corner_order",
  "meta.open_no_corners",
  "meta.segmented_no_corners",
  "meta.segments_present",
  "meta.null_type_no_corners",
  /* §12.5 (i)'s three arms are RETIRED at row 20, not softened: under a pinned
     lens a wall wider than the frame runs past it, as in life, so "the wall in
     view fits the frame" is false by design. `meta.one_lens` is what replaced
     the clause, and it is declared below with the row's other mechanisms. */
  "meta.image_h",
  "meta.segment_shape",
  "meta.segment_bounds",
  "meta.segment_order",
  // wall existence, against staging
  "staging.outside_room",
  "staging.wall_mounted_on_open",
  "staging.wall_mounted_off_band",
  // the plan validator's row-11 clauses
  "plan.composed_needs_note",
  "plan.note_needs_composed",
  "plan.storey_height",
  "plan.object_clear_of_carriers",
  "plan.object_clear_of_stairs",
  "plan.objects_do_not_share_floor",
  // the bake
  "bake.refuses_lens_drift",
  /* [Round 4] The prompt lint's clauses. They live in
     `design/plan-draft/measured/prompt_lint.py`, which is a validator like any
     other — it refuses an artifact before it is made — and the row that minted
     them left them outside every completeness check in this file. */
  "prompt.no_gate_anchor",
  "prompt.contradictory_scale",
  "prompt.unmeasurable_by_design",
  "prompt.anchor_datum_forbidden",
  // row 20: the lens, the standpoint law, and the doorway as a building fact
  "meta.one_lens",
  "meta.one_lens_measured",
  "plan.standpoint_source",
  "plan.standpoint_branch",
  "plan.standpoint_stands_back",
  "plan.standpoint_clear",
  "plan.room_reads",
  // the renderer. The six below `renderer.corner_verticals` are the ones the
  // first ledger did not name, each of which a critic removed with the whole
  // suite green.
  "renderer.open_draws_no_wall",
  "renderer.aperture_needs_a_wall",
  "renderer.aperture_needs_a_band",
  "renderer.leaf_needs_a_wall",
  "renderer.floor_clipped_to_room",
  "renderer.returns_depth_verticals",
  "renderer.returns_height_fan",
  "renderer.returns_reach_the_frame",
  "renderer.junction_majors",
  "renderer.corner_verticals",
  "renderer.glyph_stays_on_the_band",
  "renderer.eye_line_needs_a_surface",
  /* [Row 21] The doorway as a fact about the building, and the room behind it. */
  "renderer.building_fact_opening",
  "renderer.through_view",
  "renderer.through_view_painted",
  "renderer.through_view_corners",
  "renderer.through_view_depth",
  "renderer.through_view_finite",
  "renderer.through_view_refuses_nonfinite",
  "renderer.through_dim",
  "renderer.jamb_stands_proud",
  "renderer.typed_depth_anchor",
  "renderer.ceiling_lines",
  "renderer.ceiling_reaches_the_frame",
  "renderer.ceiling_clipped_to_the_room",
  /* [Row 15] The manor: the two ways through a building that are not a leaf
     in a doorway, and the two halves of "the plan draws it, the world walks
     it" that had no clause at all. */
  "meta.opening_kind",
  "meta.stairs_list",
  "plan.stair_directions",
  "exit.opening_unwalked",
  "world.rooms_unreachable",
  "renderer.stair_flight",
  "renderer.stairwell_clears_the_ceiling",
  "renderer.threshold_line",
  "renderer.threshold_needs_no_band",
  /* [Row 19] Carrier clearance completed. */
  "plan.object_clear_of_thresholds",
  "plan.object_clear_of_standpoints",
  "plan.object_projects_finitely",
  "staging.wall_mounted_over_storey",
  "meta.opening_over_storey"
];

/* ------------------------------------------------------------------ cases */

/** name -> a function returning the set of clause tokens it tripped. */
const DOCUMENT_CASES = {
  /* study/S, not study/W, not study/N. These four doctor the DERIVED meta map
     the bake hands the validator, and a PAINTED facing's meta is resolved from
     `backdrops/<loc>/<facing>.meta.json` before the map is consulted — so
     doctoring the map leaves the clause untripped and the case
     green-by-absence, and it doctors the building half of a measured meta into
     a `meta.building_fields` finding besides, which is a second clause and
     breaks the isolation this ledger is built on. They moved from study/N to
     study/W at row 21 for that reason and from study/W to study/S at the
     standing-eye wave for the same one: study/S is the study's only wall the
     cand-6 gate did not admit, so it is the room's remaining unpainted facing.
     The painted tier has its own case below. */
  "meta.required_fields": () => tokensFromMetas((m) => { delete m["study/S"].key_tint; }),
  "meta.unknown_key": () => tokensFromMetas((m) => { m["study/S"].floor_line = 0.63; }),
  "meta.storey_height": () => tokensFromMetas((m) => { m["study/S"].storey_height_m = 0.4; }),
  "meta.facing_type": () => tokensFromMetas((m) => { m["study/S"].facing_type = "outdoors"; }),
  "meta.open_needs_far": () => tokensFromMetas((m) => {
    m["hall/S"] = openLike(m["hall/S"]);
    delete m["hall/S"].camera_far_m;
  }),
  "meta.open_rejects_wall": () => tokensFromMetas((m) => {
    const d = m["hall/S"].camera_wall_m;
    m["hall/S"] = openLike(m["hall/S"]);
    /* Its OWN distance, so the meta stays on the ruled lens and `meta.one_lens`
       does not fire alongside. */
    m["hall/S"].camera_wall_m = d;
  }),
  "meta.walled_needs_wall": () => tokensFromMetas((m) => { delete m["hall/S"].camera_wall_m; }),
  "meta.walled_rejects_far": () => tokensFromMetas((m) => { m["hall/S"].camera_far_m = 9; }),
  /* [Row 21] The opening's own shape. A meta opening is two things at once —
     the hole the renderer cuts where no leaf is staged, and the rectangle the
     page accepts a `go` click inside — so a malformed one is either a doorway
     nobody can see or a click target over solid paint. */
  /* [Row 21, round 3] A measured meta's building half against the plan's own
     answer. `study/N` is the only measured meta in the tree, and the file it
     lives in is resolved BEFORE the derived map — so these two doctor the
     DERIVED side, which is the same comparison from the other end and the only
     one a doctored map can reach. */
  "meta.building_fields": () => everyArm("meta.building_fields", {
    /* ONE TOKEN OVER SIX FIELDS IS SIX ARMS, and the emit site is inside a
       loop so the one-token-one-site count passes at 1 whatever the list
       holds. A critic cut `BUILDING` down to `["storey_height_m"]` — the one
       field this case doctored — and the whole suite stayed green, which would
       have let a promoted painting re-rule `wall_width_m`, the field the
       u-domain and every staged placement read. */
    wall_width_m: () => tokensFromMetas((m) => { m["study/N"].wall_width_m = 9.9; }),
    camera_wall_m: () => tokensFromMetas((m) => { m["study/N"].camera_wall_m = 1.1; }),
    camera_far_m: () => tokensFromMetas((m) => { m["study/N"].camera_far_m = 3.3; }),
    storey_height_m: () => tokensFromMetas((m) => { m["study/N"].storey_height_m = 2.5; }),
    facing_type: () => tokensFromMetas((m) => { m["study/N"].facing_type = "corridor"; }),
    wall_continuous: () => tokensFromMetas((m) => { m["study/N"].wall_continuous = false; })
  }),
  "meta.building_segments": () => tokensFromMetas((m) => {
    m["study/N"].wall_segments = [{ from_m: 0, to_m: 1, kind: "wall" }];
  }),
  /* hall/W, not study/E: the standing-eye wave painted the study's east
     wall, so its meta is a file and doctoring the derived map cannot reach it.
     hall/W is the OTHER SIDE OF THE SAME DOOR — its derived meta carries the
     same `op13` opening, with door1 staged on it — and nothing paints it. */
  "meta.openings_list": () => tokensFromMetas((m) => { m["hall/W"].openings = "op13"; }),
  "meta.opening_rect": () => everyArm("meta.opening_rect", {
    /* Four arms, and the case exercised one. A `NaN` x reaches `apertures()`
       and the page's `go` hit-test; a zero-height opening is a doorway with no
       door in it. */
    zero_width: () => tokensFromMetas((m) => { m["hall/W"].openings = [openingRect({ w: 0 })]; }),
    zero_height: () => tokensFromMetas((m) => { m["hall/W"].openings = [openingRect({ h: 0 })]; }),
    not_finite: () => tokensFromMetas((m) => { m["hall/W"].openings = [openingRect({ x: NaN })]; }),
    not_a_number: () => tokensFromMetas((m) => { m["hall/W"].openings = [openingRect({ w: "220" })]; })
  }),
  "meta.opening_via": () => tokensFromMetas((m) => { m["hall/W"].openings[0].via = 7; }),
  "meta.opening_beyond": () => everyArm("meta.opening_beyond", {
    /* [Round 5] The two fields the through-view is computed from, which were
       the only ones in an opening nothing typed. A meta may say NOTHING about
       what is beyond a doorway; what it may not do is say something that is
       not a distance, or answer half of the pair. */
    depth_not_a_number: () => tokensFromMetas((m) => {
      m["hall/W"].openings[0].beyond_m = "eight point six";
    }),
    depth_not_finite: () => tokensFromMetas((m) => { m["hall/W"].openings[0].beyond_m = NaN; }),
    depth_behind_the_camera: () => tokensFromMetas((m) => { m["hall/W"].openings[0].beyond_m = -2; }),
    offset_not_a_number: () => tokensFromMetas((m) => {
      m["hall/W"].openings[0].beyond_offset_m = { nonsense: true };
    }),
    offset_not_finite: () => tokensFromMetas((m) => {
      m["hall/W"].openings[0].beyond_offset_m = Infinity;
    }),
    half_an_answer: () => tokensFromMetas((m) => { m["hall/W"].openings[0].beyond_offset_m = null; })
  }),
  /* An exit through neither a leaf nor a doorway. The harness reads an
     unfilled opening as an open one — that is what makes an empty painted room
     walkable — so a typo in `via` would otherwise become a way through a blank
     wall, refused by nothing. Doctored on the NAVIGATION fixture, because that
     is the world whose doorways are building facts: in the furnished world the
     leaf answers for the exit and this clause is never reached. */
  /* [Row 15] BOTH NAMES, because an exit resolves against the entity that
     fills a hole OR the plan's own name for it — 25 of the manor's 26
     openings carry no entity and neither of its stairs ever will. Blanking
     `via` alone left every exit resolving by `id` and the clause could not
     fire; blanking both is what "the meta carries no way through for it"
     actually means now. */
  "exit.via_unfilled": () => tokensFromNavMetas((m) => {
    for (const key of Object.keys(m)) {
      for (const o of (m[key].openings || [])) { o.via = null; o.id = null; }
      for (const s of (m[key].stairs || [])) s.id = null;
    }
  }),
  /* And an exit through a doorway that is off the frame: a way through nobody
     can see or click. The cross passage's own north wall carries one 1720 px
     out, which is why an off-frame opening is a real state of this document
     and not a contrived one — what is contrived here is only that an EXIT
     walks through it. */
  "exit.opening_offscreen": () => everyArm("exit.opening_offscreen", {
    /* Four edges, and the case pushed the opening off ONE of them. A critic
       dropped the vertical half of the clause and the suite stayed green: an
       exit through a doorway above or below the frame is a way through nobody
       can see or click, exactly as one past the side is. */
    off_right: () => tokensFromNavMetas((m) => { forEachOpening(m, (o) => { o.x = 4000; }); }),
    off_left: () => tokensFromNavMetas((m) => { forEachOpening(m, (o) => { o.x = -o.w - 10; }); }),
    below_the_frame: () => tokensFromNavMetas((m) => { forEachOpening(m, (o) => { o.y = 4000; }); }),
    above_the_frame: () => tokensFromNavMetas((m) => { forEachOpening(m, (o) => { o.y = -o.h - 10; }); })
  }),
  /* [Round 5] ONE HALF OF A NAMED PAIR. Row 21 added an exemption above this
     for a world holding NEITHER half — the painted world stages no furniture —
     and said in the same breath that a world holding ONE half "is still the
     defect this clause exists to catch, and still fires". Nothing exercised
     that, and the finding carried no token, so the ledger's own
     shipped-documents check could not see it either: a critic replaced the
     whole push with a bare `continue` and the suite was green. §12.8's
     occlusion chain is a NAMED pair, and a pair with one member is a chain
     with one link. */
  "staging.pair_half_missing": () => tokensOf(validateWithStaging((st) => {
    delete st.placements.chair1;
  }, JSON.parse(readFileSync(join(FIXTURE_DIR, "staging.json"), "utf8")))),
  "meta.corner_pairing": () => tokensFromMetas((m) => { m["hall/S"].corner_x1_px = null; }),
  "meta.corner_order": () => tokensFromMetas((m) => {
    const t = m["hall/S"].corner_x0_px;
    m["hall/S"].corner_x0_px = m["hall/S"].corner_x1_px;
    m["hall/S"].corner_x1_px = t;
  }),
  "meta.open_no_corners": () => tokensFromMetas((m) => {
    // an open facing that kept its corners: law (b)'s invented enclosure
    m["hall/S"] = { ...openLike(m["hall/S"]), corner_x0_px: 384, corner_x1_px: 1152 };
  }),
  "meta.segmented_no_corners": () => tokensFromMetas((m) => {
    m["hall/S"].wall_continuous = false;
    m["hall/S"].wall_segments = [{ from_m: 0, to_m: 2, kind: "wall" }];
  }),
  "meta.segments_present": () => tokensFromMetas((m) => {
    m["hall/S"].wall_continuous = false;
    m["hall/S"].wall_segments = [];
    m["hall/S"].corner_x0_px = null;
    m["hall/S"].corner_x1_px = null;
  }),
  "meta.null_type_no_corners": () => tokensFromMetas((m) => { m["hall/S"].facing_type = null; }),
  /* ROW 20. The lens a meta implies is the ruled one — the clause that
     replaced §12.5 (i). Doctoring the SCALE alone (not the distance) is what a
     meta authored on a different lens looks like. */
  "meta.one_lens": () => tokensFromMetas((m) => { m["hall/S"].px_per_m_at_wall *= 1.2; }),
  /* The MEASURED arm, which is the one that can fail on something this project
     did not compute — and which went a whole row unexercised while its literal
     tolerance agreed with no document. A measured meta is admitted inside the
     asset gate's ±3 % band around the approved 1010 px; this one is pushed out
     of it while staying near enough the ruled lens that the derived arm would
     have shrugged. */
  "meta.one_lens_measured": () => tokensFromMetas((m) => {
    m["hall/S"].measured = true;
    m["hall/S"].px_per_m_at_wall = 1120 / m["hall/S"].camera_wall_m;   // a 1120 px lens
  }),
  "meta.image_h": () => tokensFromMetas((m) => { m["hall/S"].image_h_px = 900; }),
  "meta.segment_shape": () => tokensFromMetas((m) => segmented(m, [{ from_m: 2, to_m: 1, kind: "wall" }])),
  "meta.segment_bounds": () => tokensFromMetas((m) => segmented(m, [{ from_m: 0, to_m: 99, kind: "wall" }])),
  "meta.segment_order": () => tokensFromMetas((m) => segmented(m, [
    { from_m: 2, to_m: 5, kind: "wall" }, { from_m: 0, to_m: 1, kind: "wall" }
  ])),

  "staging.outside_room": () => {
    const staging = clone(JSON.parse(readFileSync(join(FIXTURE_DIR, "staging.json"), "utf8")));
    return tokensOf(validateWithStaging((s) => { s.placements.stick1.u = 0.995; }, staging));
  },
  "staging.wall_mounted_on_open": () => tokensFromMetas((m) => {
    // the passage's west end becomes a horizon; door1 still hangs on it
    m["hall/W"] = openLike(m["hall/W"]);
  }),
  "staging.wall_mounted_off_band": () => tokensFromMetas((m) => {
    // part building, part open ground — with the door in the open part
    m["hall/W"] = {
      ...m["hall/W"], wall_continuous: false,
      corner_x0_px: null, corner_x1_px: null,
      wall_segments: [{ from_m: 0, to_m: 0.4, kind: "wall" }]
    };
  }),

  "plan.composed_needs_note": () => {
    const p = clone(PLAN);
    delete p.objects.find((o) => o.id === "stick1").note;
    return tokensOf(validatePlan(p));
  },
  "plan.note_needs_composed": () => {
    /* Every shipped object is `composed` since row 20 moved the passage's two
       into the only facing of that room with floor in frame, so the case adds
       a fresh derived object rather than annotating one that already carries a
       reason. */
    const p = clone(PLAN);
    const src = p.objects.find((x) => x.id === "shelf1");
    p.objects.push({
      id: "zz_derived_probe", floor: src.floor, room: src.room,
      footprint: { x0: 31.2, x1: 31.6, y0: 10.8, y1: 11.2 },
      attachment: "floor_free", source: "inverse-projected",
      note: "a reason for a value nobody chose"
    });
    return tokensOf(validatePlan(p));
  },
  /* ROW 20's standpoint law, in its three arms. */
  "plan.standpoint_source": () => {
    const p = clone(PLAN);
    p.rooms.find((x) => x.id === "study").facings.N.standpoint_source = "wherever";
    return tokensOf(validatePlan(p));
  },
  "plan.standpoint_branch": () => {
    const p = clone(PLAN);
    // a facing whose wall does not fit the frame, still claiming the rule
    p.rooms.find((x) => x.id === "study").facings.N.standpoint_source = "rule";
    return tokensOf(validatePlan(p));
  },
  "plan.standpoint_stands_back": () => {
    const p = clone(PLAN);
    const r = p.rooms.find((x) => x.id === "study");
    r.facings.N.standpoint = { x: r.facings.N.standpoint.x, y: r.facings.N.standpoint.y + 0.2 };
    r.facings.N.camera_wall_m = drawn(r.facings.N.wall_line - r.facings.N.standpoint.y);
    return tokensOf(validatePlan(p));
  },
  "plan.room_reads": () => {
    /* A room none of whose facings can show it. The passage is 2.60 m deep and
       its two long facings already show nothing; making its two SHORT facings
       just as bad — an 8 m end wall seen from 2.15 m — leaves a room a player
       could never see the shape of from inside it. */
    const p = clone(PLAN);
    const r = p.rooms.find((x) => x.id === "hall");
    for (const f of ["E", "W"]) {
      r.facings[f].wall_width_m = 8;
      r.facings[f].camera_wall_m = 2.15;
      r.facings[f].standpoint_source = "drawn";
    }
    return tokensOf(validatePlan(p));
  },
  "plan.standpoint_clear": () => {
    const p = clone(PLAN);
    /* A threshold standpoint walked into the masonry it is supposed to clear:
       the study's south facing stands 0.45 m off the chimney breast's near
       face, so putting it back where the bare rule would have is standing in
       the hearth. */
    const r = p.rooms.find((x) => x.id === "study");
    /* Walked into the study's own chimney breast, with its distance kept
       honest so the document is self-consistent. It trips this clause ALONE
       because the validator gives a standpoint in masonry precedence: one
       fault, one finding, which is what lets the ledger isolate it. */
    const fire = p.fireplaces.find((x) => x.room === "study");
    r.facings.S.standpoint = { x: r.facings.S.standpoint.x, y: (fire.rect.y0 + fire.rect.y1) / 2 };
    r.facings.S.camera_wall_m = drawn(r.facings.S.standpoint.y - r.facings.S.wall_line);
    return tokensOf(validatePlan(p));
  },
  "plan.storey_height": () => {
    const p = clone(PLAN);
    p.floors.find((f) => f.id === "ground").storey_height_m = 0.4;
    return tokensOf(validatePlan(p));
  },
  "plan.object_clear_of_carriers": () => {
    /* The desk's own pre-row-11 footprint, which sat 91% inside the study's
     * hearth and was reported as a warning nobody had to act on. */
    const p = clone(PLAN);
    p.objects.find((o) => o.id === "desk1").footprint =
      { x0: 26.689, x1: 27.989, y0: 13.85, y1: 14.4 };
    return tokensOf(validatePlan(p));
  },
  "plan.object_clear_of_stairs": () => {
    const p = clone(PLAN);
    const st = p.stairs[0];
    p.objects.push({ id: "zz_probe", floor: st.floor || "ground", room: st.joins[0],
      footprint: { x0: st.rect.x0 + 0.1, x1: st.rect.x0 + 0.6, y0: st.rect.y0 + 0.1, y1: st.rect.y0 + 0.6 },
      attachment: "floor_free", source: "inverse-projected" });
    return tokensOf(validatePlan(p));
  },
  "plan.objects_do_not_share_floor": () => {
    const p = clone(PLAN);
    p.objects.find((o) => o.id === "stick1").footprint =
      clone(p.objects.find((o) => o.id === "shelf1").footprint);
    return tokensOf(validatePlan(p));
  },

  /* ---- [Row 15] the manor's two other ways through a building ---------- */

  "meta.opening_kind": () => everyArm("meta.opening_kind", {
    /* Two arms because the renderer's two branches are opposites: an unknown
       kind takes the door branch and cuts a jamb into open ground, and a
       MISSING one does the same in silence. */
    unknown: () => tokensFromMetas((m) => { m["study/E"].openings[0].kind = "archway"; }),
    absent: () => tokensFromMetas((m) => { delete m["study/E"].openings[0].kind; })
  }),
  "meta.stairs_list": () => everyArm("meta.stairs_list", {
    not_a_list: () => tokensFromMetas((m) => { m["study/W"].stairs = "up"; }),
    /* A flight is three things at once — the click target, the outline the
       grid strokes and the hover halo traces, and the well the ceiling is cut
       out of — so each is its own way to be wrong. */
    no_rectangle: () => tokensFromMetas((m) => { m["study/W"].stairs = [flight({ w: 0 })]; }),
    no_direction: () => tokensFromMetas((m) => { m["study/W"].stairs = [flight({ direction: "sideways" })]; }),
    no_rise: () => tokensFromMetas((m) => { m["study/W"].stairs = [flight({ rise_m: 0 })]; }),
    no_treads: () => tokensFromMetas((m) => { m["study/W"].stairs = [flight({ treads: 2.5 })]; }),
    no_outline: () => tokensFromMetas((m) => { m["study/W"].stairs = [flight({ poly: [] })]; }),
    broken_ring: () => tokensFromMetas((m) => { m["study/W"].stairs = [flight({ floor_poly: [[0, 0]] })]; }),
    point_not_a_point: () => tokensFromMetas((m) => { m["study/W"].stairs = [flight({ well_poly: [[0, 0], [1, NaN], [2, 2]] })]; })
  }),
  "plan.stair_directions": () => {
    /* The flight kept where it is drawn and told it is climbed ACROSS its own
       run: 1.6 m of travel against 4.8 m of width. `up` and `down` stay
       opposite, so the clause that checks THAT does not fire beside this one —
       the two say different things and the ledger requires each case to
       isolate one. */
    const p = clone(PLAN);
    const st = p.stairs.find((s) => s.id === "great_stair");
    st.up = "E"; st.down = "W";
    return tokensOf(validatePlan(p));
  },
  "exit.opening_unwalked": () => tokensOf(validateNavWorld((w) => {
    /* The plan draws a way and the world stops opening it. Without this
       clause the two documents could disagree by omission: a manor with a
       door in every wall and a world that walks four of them is green, and
       the picture holds rooms nobody can enter. */
    const loc = w.locations.find((l) => l.id === "library");
    loc.exits = loc.exits.filter((e) => e.to !== "garden_room");
  })),
  "world.rooms_unreachable": () => tokensOf(validateNavWorld((w) => {
    /* Connectivity is not implied by the clause above: a wing whose every
       opening is walked and which joins nothing else satisfies it and is
       unreachable.
       The construction has to strand a room WITHOUT leaving a plan way
       unwalked, or the two clauses fire together and neither case is evidence
       about its own. Cutting a room's doors does both. So this adds a room the
       PLAN does not draw — §4b item 3's materialization ladder puts a conjured
       location on screen as grid before any geometry exists for it — with no
       way in. The plan has nothing to say about it, `exit.opening_unwalked`
       stays silent, and no walk from the boot viewstate reaches it. */
    w.locations.push({ id: "zz_conjured", facings: ["N", "E", "S", "W"], exits: [] });
  })),

  /* ---- [Row 19] carrier clearance completed ---------------------------- */

  "plan.object_clear_of_standpoints": () => {
    /* THE ARTIFACT CRITIC'S OWN CONSTRUCTION, verbatim in effect: a desk on
       `study/N`'s standpoint. Before this clause the plan validated clean and
       `projectPlacement` returned `scale_px_per_m: -1152`. */
    const p = clone(PLAN);
    const sp = p.rooms.find((r) => r.id === "study").facings.N.standpoint;
    p.objects.find((o) => o.id === "desk1").footprint =
      { x0: sp.x - 0.405, x1: sp.x + 0.405, y0: sp.y - 0.275, y1: sp.y + 0.275 };
    return tokensOf(validatePlan(p));
  },
  "plan.object_clear_of_thresholds": () => {
    /* A press standing in the study's own doorway. `op13` is the one opening
       in the manor with a leaf, and its rect is the hole through the wall's
       thickness — floor a player crosses, not floor furniture stands on. */
    const p = clone(PLAN);
    const op = p.openings.find((o) => o.id === "op13");
    p.objects.find((o) => o.id === "desk1").footprint =
      { x0: op.rect.x0 - 0.2, x1: op.rect.x0 + 0.3, y0: op.rect.y0 + 0.1, y1: op.rect.y0 + 0.6 };
    return tokensOf(validatePlan(p));
  },
  "plan.object_projects_finitely": () => {
    /* THE PROJECTION'S OWN REFUSAL, at the site that produces the number.
       This is the second half of the critic's construction and it is where
       `-1152` was actually returned: the plan validator's own clause above
       removes the footprint that reaches it, and this one refuses whatever
       else does — a staged object whose baseline stands at the camera, which
       is a state a doctored staging or a solver-authored plan can produce
       without covering a standpoint. */
    const p = clone(PLAN);
    const room = p.rooms.find((r) => r.id === "study");
    const cam = room.facings.N.camera_wall_m;
    const line = room.facings.N.wall_line;
    /* Its baseline exactly AT the camera: the singularity itself, where the
       scale is not merely negative but infinite. */
    p.objects.find((o) => o.id === "desk1").footprint =
      { x0: 26.0, x1: 26.8, y0: line - cam, y1: line - cam + 0.55 };
    let tokens = new Set();
    try {
      projectPlacement(p, "desk1", "study", "N");
    } catch (e) {
      tokens = tokensOf([e.message]);
    }
    return tokens;
  },
  "meta.opening_over_storey": () => tokensFromNavMetas((m) => {
    /* Blueprint §11 rules every door opening at 2.00 m and the plan gives its
       floors 2.80; a room a document drops to 1.85 m has a door through its
       own ceiling, and nothing compared the two numbers. The storey is moved
       rather than the opening, because the storey is the field an agent
       actually sets.
       On the NAVIGATION world, because the demo world's only two facings with
       an opening are the two `door1` hangs on — so lowering their storey trips
       `staging.wall_mounted_over_storey` in the same breath, and neither case
       would then be evidence about its own clause. The painted world stages
       nothing, so no staging clause can fire beside this one. */
    m["great_hall/S"].storey_height_m = 1.85;
  }),
  "staging.wall_mounted_over_storey": () => tokensOf(validateWithStaging((st) => {
    /* `door1` is 2.00 m tall and hangs at `v: 0` in a 2.80 m room. Raised a
       metre it stands 3.00 m to its head — through the ceiling — and row 11's
       clauses, which bound a wall placement sideways and never upward, all
       stay green. */
    for (const pl of st.placements.door1) pl.v = 1.0;
  }, JSON.parse(readFileSync(join(FIXTURE_DIR, "staging.json"), "utf8"))))
};

/** A well-formed §5 meta flight, with one field spoiled. */
const flight = (over) => ({
  id: "great_stair", kind: "stair", via: null, direction: "up", treads: 17,
  rise_m: 2.8, u0: 0.1, u1: 0.3, depth_near_m: 5, depth_far_m: 0.2,
  x: 10, y: 200, w: 300, h: 700,
  poly: [[10, 200], [10, 900], [310, 900], [310, 200]],
  floor_poly: [[10, 700], [10, 900], [310, 900], [310, 700]],
  well_poly: [[10, 100], [10, 300], [310, 300], [310, 100]],
  beyond_m: null, beyond_offset_m: null, ...over
});

/** The navigation world, doctored on disk, through the real validator. */
function validateNavWorld(doctor) {
  const dir = mkdtempSync(join(tmpdir(), "holo-navworld-"));
  try {
    const w = clone(NAV_WORLD);
    doctor(w);
    for (const f of ["staging.json", "narration.json", "viewstate.json", "plan.ref"]) {
      writeFileSync(join(dir, f), readFileSync(join(NAV_DIR, f), "utf8"));
    }
    writeFileSync(join(dir, "world.json"), JSON.stringify(w, null, 2) + "\n");
    return validate(dir, RECORDS);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** The same facing, retyped as open: no wall, a far line instead. */
function openLike(m) {
  const out = { ...m, facing_type: "open", backdrop: "vista",
    camera_far_m: m.camera_wall_m, wall_continuous: false, wall_segments: [],
    corner_x0_px: null, corner_x1_px: null };
  delete out.camera_wall_m;
  return out;
}

/** hall/S, retyped as a part-built view carrying the given bands. */
function segmented(m, bands) {
  m["hall/S"] = {
    ...m["hall/S"], wall_continuous: false,
    corner_x0_px: null, corner_x1_px: null, wall_segments: bands
  };
}

/* A doctored staging needs a scratch fixture dir, because validate() reads it
 * off disk. */
function validateWithStaging(doctor, staging) {
  const dir = stageTree();
  try {
    const fx = join(dir, "fixtures", "demo-study");
    doctor(staging);
    writeFileSync(join(fx, "staging.json"), JSON.stringify(staging, null, 2) + "\n");
    return validate(fx, RECORDS);
  } finally {
    removeTree(dir);
  }
}

test.describe("the clause ledger — document-side mechanisms", () => {
  for (const name of Object.keys(DOCUMENT_CASES)) {
    ledgerCase(name, () => {
      const tripped = [...DOCUMENT_CASES[name]()].sort();
      /* EXCLUSIVITY, not membership. "Fails on that clause alone" was prose
       * while this read `tripped.has(name)`: three of the first ledger's
       * cases tripped a second clause and nothing said so, which means the
       * case was not isolating the thing it named. */
      expect(tripped, `${name} should be the only clause its doctored input trips`).toEqual([name]);
    });
  }

  test("and the shipped documents trip none of them", () => {
    /* [Row 21, round 3 — G4] EVERY shipped world, not the demo one. Two of the
       clauses this project minted can only fire on a world whose doorways are
       building facts, and that world was the one this check never opened. */
    for (const dir of readdirSync(join(repoRoot, "fixtures"))
      .filter((d) => existsSync(join(repoRoot, "fixtures", d, "world.json")))) {
      expect([...tokensOf(validate(join(repoRoot, "fixtures", dir), RECORDS))],
        `${dir} trips a clause`).toEqual([]);
    }
    expect([...tokensOf(validatePlan(PLAN, WORLD, byEntity()))]).toEqual([]);
  });
});

function byEntity() {
  const out = {};
  for (const e of WORLD.entities) if (RECORDS[e.sprite]) out[e.id] = RECORDS[e.sprite];
  return out;
}

/* ------------------------------------------------------- the bake's refusal */

test.describe("the clause ledger — the bake", () => {
  ledgerCase("bake.refuses_lens_drift", () => {
    /* And the other half: the pixel constant is bound to blueprint §10's
       [HUMAN] field. Two files agreeing is not a binding; a check that fires
       when they stop is. */
    const dir = stageTree();
    try {
      const f = join(dir, "replicator", "contract.json");
      const c = JSON.parse(readFileSync(f, "utf8"));
      c.camera.focal_mm = 50;
      writeFileSync(f, JSON.stringify(c, null, 2));
      let msg = "";
      try {
        bake(dir, ["--fixture-dir", join(dir, "fixtures", "demo-study")]);
      } catch (e) {
        msg = String(e.stderr || e.message);
      }
      expect(msg, "the bake refused, and named the contract").toMatch(/camera\.focal_mm/);
      expect(msg).toMatch(/row20:bake\.refuses_lens_drift/);
    } finally {
      removeTree(dir);
    }
  });
});

/* ---------------------------------------------------------- the renderer */

/* A renderer mechanism cannot be tripped by a document — the case has to
 * delete the code and look at the picture, which is what the artifact critic
 * did by hand. Each of these stages the tree, removes exactly one mechanism,
 * and measures the consequence. */
function stageWithout(marker, replacement) {
  const dir = stageTree();
  const f = join(dir, "src", "renderer.js");
  const src = readFileSync(f, "utf8");
  if (!src.includes(marker)) {
    removeTree(dir);
    throw new Error(`the ledger's marker for this mechanism is gone from renderer.js: ${marker.slice(0, 60)}…`);
  }
  writeFileSync(f, src.replace(marker, replacement));
  return dir;
}

test.describe("the clause ledger — renderer mechanisms", () => {
  ledgerCase("renderer.open_draws_no_wall", async ({ page }) => {
    /* `wallBands` returning no band for an `open` facing is the whole of
     * "wall-existence is not hard-wired". The critic's finding was that the
     * only open meta the suite rendered ALSO carried `wall_continuous: false`
     * with empty segments, so the segmented branch suppressed the wall and the
     * open branch could be deleted unnoticed. This case uses an open meta
     * whose continuity fields would otherwise grow a full band. */
    const dir = stageWithout(
      '    if (meta.facing_type === "open") return [];',
      '    if (false) return [];');
    try {
      const counts = await bandCounts(page, dir);
      expect(counts.verticals, "with the open branch gone, a wall grows on a facing that has none")
        .toBeGreaterThan(0);
      const clean = await bandCounts(page, repoRoot);
      expect(clean.verticals, "and the shipped renderer draws none").toBe(0);
    } finally {
      removeTree(dir);
    }
  });

  ledgerCase("renderer.aperture_needs_a_wall", async ({ page }) => {
    /* A doorway needs a wall to be a hole in. With the guard removed the
     * renderer returns an aperture — and paints a jamb, two reveals, a soffit
     * and a full plank leaf — on a facing whose meta says there is no wall
     * there at all. */
    const dir = stageWithout(
      "        if (!spannedByBand(rect.x, rect.x + rect.w, bandsHere, meta)) continue;",
      "        // guard removed by the ledger");
    try {
      expect(await apertureCountOnOpenMeta(page, dir),
        "with the guard gone a doorway is painted in open void").toBeGreaterThan(0);
      expect(await apertureCountOnOpenMeta(page, repoRoot),
        "and the shipped renderer paints none").toBe(0);
    } finally {
      removeTree(dir);
    }
  });

  ledgerCase("renderer.building_fact_opening", async ({ page }) => {
    /* [Row 21] A doorway with no leaf in it. The navigation world stages no
     * entities at all, so its two exits have nothing to derive an opening
     * from except the facing's own §5 meta — which is what makes an empty
     * painted room walkable. With the branch gone the wall has no hole in it,
     * the page has no `go` target, and the two rooms are unreachable from each
     * other with the whole suite otherwise green. */
    /* [Row 15] The marker moved when the lookup got its one home: the branch
     * is `groundplane.openingFor` now, so what this case removes is the CALL,
     * which is the whole of the building-fact path. */
    const dir = stageWithout(
      "          var found = gp.openingFor(meta, exit.via);",
      "          var found = null;");
    try {
      expect(await navApertureCount(page, dir),
        "with the branch gone the navigation world's doorway is not in the wall").toBe(0);
      expect(await navApertureCount(page, repoRoot),
        "and the shipped renderer cuts exactly one").toBe(1);
    } finally {
      removeTree(dir);
    }
  });

  ledgerCase("renderer.through_view", async ({ page }) => {
    /* [Row 21] Through an opening, the destination room — never void. What
     * stood here before was a dark fill: 92,061 pixels of the study's own
     * doorway darker than luminance 12, which is the picture saying VOID where
     * the document holds a passage. With the device gone they come back, and
     * the count is what this case measures. */
    const dir = stageWithout(
      "      drawThroughOpening(ctx, a, meta, world, staging, library, backdrops, doc, options);",
      "      void drawThroughOpening;");
    try {
      const broken = await apertureVoid(page, dir);
      const clean = await apertureVoid(page, repoRoot);
      expect(broken.near_black,
        "with the device gone the doorway is void again").toBeGreaterThan(50000);
      expect(clean.near_black,
        "and the shipped renderer leaves no void in it at all").toBe(0);
      expect(clean.mean - broken.mean,
        "the room beyond is lighter than the void it replaced").toBeGreaterThan(5);
    } finally {
      removeTree(dir);
    }
  });

  ledgerCase("renderer.through_view_painted", async ({ page }) => {
    /* [Row 21, round 2] THE PAINTED ARM IS A SECOND CALL SITE, and a critic
     * deleted it whole with the suite green: `study/N` is the only painting in
     * the project and it carries no doorway, so the branch had no subject
     * anywhere. The case builds the subject — the baked painting bound to
     * `study/E`, `door1` out of the world so the opening is the building's —
     * and measures the opening. One token per arm, because one token over two
     * behaviours is one countable thing the ledger can only ever exercise on
     * whichever call its case happens to reach. */
    const dir = stageWithout(
      "          drawThroughOpening(ctx, painted[ai], meta, world, staging, library, backdrops, doc0, options);",
      "          void painted[ai];");
    try {
      const broken = await paintedApertureVoid(page, dir);
      const clean = await paintedApertureVoid(page, repoRoot);
      expect(broken, "with the painted call gone the painting's doorway keeps its own dark hole")
        .toBeGreaterThan(5000);
      /* Three near-black pixels of an 84,000-pixel hole, not zero: at the
         standing camera's scale the destination frame lands with a sub-pixel
         offset at two of the aperture's corners. `mechanisms.spec`'s own
         painted through-view case carries the same residual and the same
         reason. The claim is the pair — 10,026 dark pixels with the painted
         call gone against three with it — and neither number is tuned. */
      expect(clean, "and the shipped renderer puts the passage in it").toBeLessThanOrEqual(8);
    } finally {
      removeTree(dir);
    }
  });

  ledgerCase("renderer.through_view_corners", async ({ page }) => {
    /* [Row 21, round 3 — G8] THE FOUR CORNER DRAWS HAD NO SUBJECT. The
     * destination frame covers the shipped openings in three directions, so
     * the corner regions measure 0 px wide on every facing this world has and
     * a critic deleted all four calls with the suite green. The subject is a
     * FAR destination: at 40 m the far room draws 209 px inside a 250 px
     * opening and all four corners are real. */
    const dir = stageWithout(
      "    ctx.drawImage(off, 0, 0, 1, 1, a.x, a.y, lft, top);\n" +
      "    ctx.drawImage(off, W - 1, 0, 1, 1, dx + dw, a.y, rgt, top);\n" +
      "    ctx.drawImage(off, 0, H - 1, 1, 1, a.x, dy + dh, lft, bot);\n" +
      "    ctx.drawImage(off, W - 1, H - 1, 1, 1, dx + dw, dy + dh, rgt, bot);",
      "    void [lft, rgt, top, bot];");
    try {
      const broken = await farApertureVoid(page, dir);
      const clean = await farApertureVoid(page, repoRoot);
      expect(broken - clean,
        "with the corner draws gone a wide arch leaves thousands of pixels of its corners void")
        .toBeGreaterThan(1000);
      /* Not zero, and RELATIVE, for a reason worth a line: a thin seam between
         the far room's frame and its stretched edge sits within a whisker of
         the threshold (11.9 against a bar of 12), and the two engines
         rasterise that seam differently — 4 pixels on Chromium, 240 on
         Firefox. What the mechanism owes is the CORNER REGIONS, which are
         thousands, so the claim is that the corners are a different order of
         magnitude from the seam rather than an absolute count neither engine
         agrees on. */
      expect(clean * 5, "and the shipped renderer fills them").toBeLessThan(broken);
    } finally {
      removeTree(dir);
    }
  });

  ledgerCase("renderer.through_view_depth", async ({ page }) => {
    /* [Row 21, round 3 — G9] `no_through` HAD NO SUBJECT EITHER: both shipped
     * worlds are two rooms with one door and an arrival that faces away, so
     * the recursion terminates at depth 1 whatever the flag says. The subject
     * is a world where the destination facing has a doorway of its own —
     * which is what row 15's manor is made of — and there the flag is the only
     * thing between one room and an unbounded descent. */
    const dir = stageWithout(
      "      no_through: true,",
      "      no_through: false,");
    try {
      const broken = await secondDoorwayVoid(page, dir);
      const clean = await secondDoorwayVoid(page, repoRoot);
      expect(clean - broken,
        "with the stop gone, the room beyond the SECOND doorway is drawn too — one room deeper than the renderer promises")
        .toBeGreaterThan(300);
      expect(clean,
        "and the shipped renderer leaves that second opening as the unlit hole it is at that distance")
        .toBeGreaterThan(300);
    } finally {
      removeTree(dir);
    }
  });

  ledgerCase("renderer.through_view_finite", async ({ page }) => {
    /* [Row 21, round 3 — G10] `null >= 0` IS TRUE, and the guard written
     * against it was invisible: no shipped opening carries a null `beyond_m`,
     * so reverting the fix left the suite green. The subject is an opening
     * whose meta cannot say what is beyond it — which is what every plan door
     * into an unbuilt room will carry the day the manor is walked. */
    const dir = stageWithout(
      '    if (typeof a.beyond_m !== "number" || !isFinite(a.beyond_m) || a.beyond_m < 0) {',
      "    if (!(a.beyond_m >= 0)) {");
    try {
      const broken = await nullBeyondVoid(page, dir);
      const clean = await nullBeyondVoid(page, repoRoot);
      expect(broken, "with the old test back, an opening that knows nothing draws a room anyway")
        .toBeLessThan(20000);
      expect(clean, "and the shipped renderer says nothing rather than guessing")
        .toBeGreaterThan(50000);
    } finally {
      removeTree(dir);
    }
  });

  ledgerCase("renderer.through_view_refuses_nonfinite", async ({ page }) => {
    /* [Round 4] THE OTHER ARM OF THE SAME FIX, and it had no case. The clause
     * has two halves and they are different rules: an opening whose meta says
     * NOTHING about what is beyond it (`null`) draws nothing and is silent —
     * the case above — while one that says something that is not a distance is
     * a FINDING, never a silent skip. That is row 19's rule applied here, and
     * reverting it to the silent `return false` left the suite green: no
     * shipped opening carries a bad `beyond_m`, so the throw's subject has to
     * be built. `"8.6"` is the shape that arrives the day a meta is hand-edited
     * or written by a host that stringified its numbers. */
    /* The doctor is SOURCE, not JSON: `JSON.stringify(NaN)` is `"null"`, which
       is the other arm of the clause entirely — a case that meant to test the
       finding would have tested the silence. */
    const doctor = (src) => `o.beyond_m = ${src};`;
    const throwsFor = async (root, v) => await page.evaluate(async ({ src, root: r }) => {
      void r;
      const A = window.HOLO_APP;
      const vs = { location: "study", facing: "E" };
      const meta = JSON.parse(JSON.stringify(A.metaFor(vs)));
      // eslint-disable-next-line no-new-func
      (new Function("o", src))(meta.openings[0]);
      const bd = {};
      for (const k of Object.keys(A.backdrops)) bd[k] = { meta: A.backdrops[k].meta };
      bd["study/E"] = { meta };
      const c = document.createElement("canvas");
      c.width = 1536; c.height = 1024;
      try {
        window.HOLO.renderer.render(c, A.harness.world, A.harness.staging, A.library, bd, vs,
          { backdrop_only: true });
        return null;
      } catch (e) { return String(e.message || e); }
    }, { src: doctor(v), root });
    const dir = stageWithout(
      '      if (a.beyond_m !== null && a.beyond_m !== undefined) {\n' +
      '        throw new Error("renderer: opening " + a.exit + " carries beyond_m " +\n' +
      '          JSON.stringify(a.beyond_m) + " — a distance to the far wall must be a finite number");\n' +
      '      }',
      "      void a;");
    try {
      await page.goto(navUrl(repoRoot));
      await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
      expect(await throwsFor(repoRoot, '"8.6"'),
        "a distance that is not a number is a finding, not a shrug")
        .toMatch(/beyond_m/);
      expect(await throwsFor(repoRoot, '-3'),
        "and neither is a wall behind the camera").toMatch(/beyond_m/);
      /* [Round 5] AND THE TWO VALUES `!isFinite` EXISTS FOR. The case tried
         `"8.6"` (caught by `typeof`) and `-3` (caught by `< 0`), so the middle
         clause of the three was in neither the throwing set nor the silent
         one: a critic inserted an early `return false` for exactly `NaN` and
         `Infinity` and the ledger stayed green. */
      expect(await throwsFor(repoRoot, 'NaN'),
        "a distance that is not a number at all is a finding").toMatch(/beyond_m/);
      expect(await throwsFor(repoRoot, 'Infinity'),
        "and so is one with no end").toMatch(/beyond_m/);
      expect(await throwsFor(repoRoot, 'null'),
        "while an opening that knows nothing is silent, which is the other arm").toBeNull();

      await page.goto(navUrl(dir));
      await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
      expect(await throwsFor(dir, '"8.6"'),
        "with the throw gone the picture skips it in silence").toBeNull();
    } finally {
      removeTree(dir);
    }
  });

  ledgerCase("renderer.through_dim", async ({ page }) => {
    /* [Round 5] THE DIM IS A LOOK DECISION AND IT NEEDED A READER. `THROUGH_DIM`
     * could be moved from 0.42 to 0.10 — the dim effectively gone — with every
     * measurement in the suite green; only the batch's pixel comparison went
     * red, and re-running `capture.mjs` silences that, so the guard on the one
     * constant a human is being asked to rule was a photograph a builder can
     * retake.
     *
     * WHAT IT IS BOUND TO IS THE SENTENCE KABE READS. The batch says the room
     * beyond a doorway is "dimmed to 58 % of its own brightness", so that
     * number is parsed out of his own document and the render is measured
     * against it — the idiom §5's ±3 % band already uses. Moving the constant
     * without moving the sentence goes red; moving both is a deliberate act
     * that changes what a human was shown, which is the point. */
    const readme = readFileSync(join(repoRoot, "design", "batches", "row21-promotion", "README.md"), "utf8");
    const ruled = /dimmed to (\d+) % of its own brightness/.exec(readme);
    expect(ruled, "the batch no longer states how dark the room beyond a doorway is").toBeTruthy();
    const kept = Number(ruled[1]) / 100;

    const dir = stageWithout("  var THROUGH_DIM = 0.42;", "  var THROUGH_DIM = 0;");
    try {
      /* THE CENTRE OF THE OPENING, not the whole rect: the reveals and the
         soffit are drawn OVER the far room and are not dimmed, so a mean over
         the whole aperture reads 69 % where the device itself keeps 58 %.
         Measuring where the far room actually is is the difference between
         pinning the constant and pinning the sum of the constant and the
         jambs. */
      const lit = await throughCentreMean(page, dir);
      const dimmed = await throughCentreMean(page, repoRoot);
      expect(lit, "with the dim off the room beyond is drawn at its own brightness").toBeGreaterThan(1);
      const ratio = dimmed / lit;
      /* ABSOLUTE, not derived from the constant: a tolerance phrased in terms
         of the number it pins moves with it. Two points of 255 either side. */
      expect(ratio,
        `the room beyond a doorway is drawn at ${(ratio * 100).toFixed(1)} % of its own brightness where the batch tells Kabe ${ruled[1]} %`)
        .toBeGreaterThan(kept - 0.02);
      expect(ratio, "and no dimmer than that either").toBeLessThan(kept + 0.02);
    } finally {
      removeTree(dir);
    }
  });

  ledgerCase("renderer.floor_clipped_to_room", async ({ page }) => {
    /* The floor the room actually has runs between the two wall-floor
     * junctions. Unclipped, its transverse lines paint straight across both
     * side-wall returns — 8,700 pixels of `hall/E`, with the whole suite
     * green before this case existed. */
    const dir = stageWithout(
      '      if (!bounded) { ctx.rect(0, floorY, W, H - floorY); return; }',
      '      { ctx.rect(0, floorY, W, H - floorY); return; }');
    try {
      const broken = await returnRegionInk(page, dir, { location: "hall", facing: "E" });
      const clean = await returnRegionInk(page, repoRoot, { location: "hall", facing: "E" });
      expect(broken - clean, "floor lines painted across the side walls")
        .toBeGreaterThan(500);
    } finally {
      removeTree(dir);
    }
  });

  ledgerCase("renderer.returns_depth_verticals", async ({ page }) => {
    /* The returns' depth verticals and height fan are what make a corner read
     * as a corner rather than as a change of paint, and what stops a
     * corridor's side walls reading as two flat slabs of void. */
    const dir = stageWithout(
      "        for (var dd = 0.5; dd < camM; dd += 0.5) {",
      "        for (var dd = 0.5; false; dd += 0.5) {");
    try {
      const broken = await returnRegionInk(page, dir, { location: "hall", facing: "E" });
      const clean = await returnRegionInk(page, repoRoot, { location: "hall", facing: "E" });
      expect(clean - broken, "the returns lose their own grid").toBeGreaterThan(500);
    } finally {
      removeTree(dir);
    }
  });

  ledgerCase("renderer.corner_verticals", async ({ page }) => {
    const dir = stageWithout(
      "      ctx.moveTo(snap(cL), wallTop);",
      "      ctx.moveTo(snap(cL), snap(floorY));");
    try {
      const broken = await cornerStrength(page, dir);
      const clean = await cornerStrength(page, repoRoot);
      expect(clean, "the shipped renderer draws a left corner").toBeGreaterThan(0.9);
      expect(broken, "with it gone there is no corner column").toBeLessThan(0.5);
    } finally {
      removeTree(dir);
    }
  });

  ledgerCase("renderer.aperture_needs_a_band", async ({ page }) => {
    /* The SEGMENTED half of the guard — "law (b) at the resolution the law is
     * written at", by the code's own comment, and the half the first ledger's
     * only aperture case structurally could not see: it used a meta with NO
     * bands, so the band loop was empty whatever the guard did. Widening the
     * tolerance inside `spannedByBand` from ±0.5 to ±500 px put a doorway back
     * in the open part of a part-built wall with the whole suite green. */
    const dir = stageWithout(
      "      if (x0 >= lo - 0.5 && x1 <= hi + 0.5) return true;",
      "      if (x0 >= lo - 4000 && x1 <= hi + 4000) return true;");
    /* ±4000 px, where row 11 used ±500. Row 20's lens draws the study's east
       wall at 250 px/m instead of 96, so the door's own span moved from
       830–917 to 931–1156 and a 500 px slackening no longer reaches past a
       band at 167–267 — the mutation would have "passed" by being too small to
       disable the guard, which is a case that proves nothing. The tolerance is
       chosen to be larger than the frame, so the guard is genuinely off. */
    try {
      expect(await apertureCount(page, dir, SEGMENTED_META_FOR_STUDY_E),
        "a doorway painted across the open part of a part-built wall").toBeGreaterThan(0);
      expect(await apertureCount(page, repoRoot, SEGMENTED_META_FOR_STUDY_E),
        "and the shipped renderer paints none").toBe(0);
    } finally {
      removeTree(dir);
    }
  });

  ledgerCase("renderer.leaf_needs_a_wall", async ({ page }) => {
    /* Row 11's first pass guarded the HOLE and not the DOOR. The opening
     * vanished and the plank stayed: 11,415 opaque pixels standing in open
     * void, hit-tested, hover-highlighted and toggleable, because the leaf,
     * the aperture, the hit region and the keyboard control are four code
     * paths reading one document. The guard is in `layout` now, which all four
     * walk. */
    const dir = stageWithout(
      '      if (facingPlacement.attachment === "wall_mounted" &&',
      '      if (false && facingPlacement.attachment === "wall_mounted" &&');
    try {
      expect(await leafPixels(page, dir), "the leaf is drawn in void").toBeGreaterThan(1000);
      expect(await leafPixels(page, repoRoot), "and the shipped renderer draws none").toBe(0);
    } finally {
      removeTree(dir);
    }
  });

  ledgerCase("renderer.returns_height_fan", async ({ page }) => {
    /* The other half of the returns' grid, and the half the first ledger's
     * `renderer.returns_grid` case did not reach: it killed only the depth
     * verticals. The height fan is what the renderer's own comment calls the
     * thing that makes a corner read as a corner — 2,166 to 2,492 lit pixels
     * on ALL EIGHT shipped facings, and it survived deletion with the whole
     * suite green. */
    const dir = stageWithout(
      "        for (m = 1; floorY - m * sWall >= 0; m++) {\n          ctx.beginPath();\n          ctx.moveTo(X(u, sWall), floorY - m * sWall);",
      "        for (m = 1; false; m++) {\n          ctx.beginPath();\n          ctx.moveTo(X(u, sWall), floorY - m * sWall);");
    try {
      /* Measured on `hall/E`, not on `study/S`. Row 20's lens makes the study
         a room whose facing wall fills the frame — 5.6% of it is return — so a
         return mechanism measured there is measured where it barely draws. The
         passage's east view is 71% return, which is where a side-wall
         mechanism is worth measuring. */
      const clean = await brightPixels(page, repoRoot, { location: "hall", facing: "E" });
      const broken = await brightPixels(page, dir, { location: "hall", facing: "E" });
      expect(clean - broken, "the returns lose their height fan").toBeGreaterThan(1000);
    } finally {
      removeTree(dir);
    }
  });

  ledgerCase("renderer.returns_reach_the_frame", async ({ page }) => {
    /* `sMax` carries the return past the FLOOR's last depth, because the wall
     * beside you does not stop where the floor leaves the frame. Without it a
     * corridor's lower corners are unlined slabs that read as void — 5,024
     * pixels of hall/E, 13% of its ink, with the suite green. */
    const dir = stageWithout(
      "        var sMax = Math.max(sBottom, sEdge);",
      "        var sMax = sBottom;");
    try {
      const clean = await brightPixels(page, repoRoot, { location: "hall", facing: "W" });
      const broken = await brightPixels(page, dir, { location: "hall", facing: "W" });
      expect(clean - broken, "the corridor's returns stop short").toBeGreaterThan(2000);
    } finally {
      removeTree(dir);
    }
  });

  ledgerCase("renderer.junction_majors", async ({ page }) => {
    /* The room's own continuous wall-floor line: the band's foot plus the two
     * side-wall junctions. Removing the two junctions costs 621 to 1,508
     * pixels on every shipped facing and leaves the floor with no edge. */
    const dir = stageWithout(
      "      ctx.beginPath();\n      ctx.moveTo(cL, snap(floorY));\n      ctx.lineTo(xb0, H);",
      "      ctx.beginPath();\n      ctx.moveTo(cL, snap(floorY));\n      ctx.lineTo(cL, snap(floorY));");
    try {
      const clean = await brightPixels(page, repoRoot, { location: "hall", facing: "E" });
      const broken = await brightPixels(page, dir, { location: "hall", facing: "E" });
      /* 517 px on `hall/E` at row 20's lens, against the 621–1508 row 11
         measured on the study at the pinned scale — the junctions are the same
         two strokes, drawn shorter because the returns are shallower. */
      expect(clean - broken, "a wall-floor junction goes missing").toBeGreaterThan(300);
    } finally {
      removeTree(dir);
    }
  });

  ledgerCase("renderer.glyph_stays_on_the_band", async ({ page }) => {
    /* The facing letter is in-fiction signage painted on a wall. `fitsBand`
     * is what keeps it there: without it `hall/W`'s glyph dodges a 1.0 m door
     * in a 2.60 m wall by moving off the band into the side return, which is
     * signage floating in a plane it is not painted on. */
    const dir = stageWithout(
      "    function fitsBand(x) { return x >= bandLo && x + gw <= bandHi; }",
      "    function fitsBand(x) { return true; }");
    try {
      /* WHERE the letter is, not how much ink is either side of a line. Row
         11 counted pixels; at row 20's lens the glyph is 0.6 m rather than
         1.5 m of wall and the ink either side of the corner moved by only 33
         pixels, which measured the glyph's SIZE rather than its PLACE. The
         box is what the mechanism is about: with `fitsBand` gone the letter
         dodges left, out past the corner and onto the return. */
      const clean = await glyphBox(page, repoRoot);
      const broken = await glyphBox(page, dir);
      expect(clean.x0, "the shipped glyph stands inside the band")
        .toBeGreaterThanOrEqual(clean.bandLo - 1);
      expect(broken.x0, "with the check gone the letter moves off the wall into the return")
        .toBeLessThan(clean.bandLo - 8);
      /* The same letter, moved — not a deleted or a clipped one. Total lit ink
         rather than the box, because the box on this facing also contains the
         doorway's own jamb, which does not move and would mask the change. */
      const cleanInk = await litPixels(page, repoRoot, { location: "hall", facing: "W" });
      const brokenInk = await litPixels(page, dir, { location: "hall", facing: "W" });
      expect(Math.abs(brokenInk - cleanInk), "and it is the same letter, moved")
        .toBeLessThan(cleanInk * 0.02);
    } finally {
      removeTree(dir);
    }
  });

  ledgerCase("renderer.eye_line_needs_a_surface", async ({ page }) => {
    /* A level camera's horizon is one line across every surface in the frame —
     * where there IS a surface. On a facing with no band the region above the
     * far line is unestablished void, and a major stroke through it is a
     * horizon asserted where the document holds nothing. */
    const dir = stageWithout(
      "    if (bands.length) {\n      ctx.beginPath();\n      ctx.moveTo(0, snap(eyeY));",
      "    if (true) {\n      ctx.beginPath();\n      ctx.moveTo(0, snap(eyeY));");
    try {
      expect(await eyeLineOnOpen(page, dir), "a horizon drawn across void").toBeGreaterThan(0.9);
      expect(await eyeLineOnOpen(page, repoRoot), "and the shipped renderer draws none")
        .toBeLessThan(0.2);
    } finally {
      removeTree(dir);
    }
  });

  ledgerCase("renderer.jamb_stands_proud", async ({ page }) => {
    /* Pre-dates row 11 (row 2's "a doorway is wider than the door in it"), and
     * unguarded since: `j = 0` restores exactly the defect its comment exists
     * to prevent — a shut door as a plank on unbroken wall. */
    const dir = stageWithout(
      "    var j = Math.max(3, Math.round(a.w * 0.05));",
      "    var j = 0;");
    try {
      /* Measured on the doorway's own rows, over its own columns, where the
         jamb is drawn. Row 11 read this off `glyphInk`, whose scan stops at
         y 660 — under the pinned scale the door's 86 px of width put nearly
         all of its jamb inside that window, and row 20's lens draws the same
         door 154 px wide from y 423 to y 765, so two thirds of the frame this
         mechanism paints fell outside the instrument. */
      const clean = await jambInk(page, repoRoot);
      const broken = await jambInk(page, dir);
      expect(clean - broken, "the doorway loses its proud frame").toBeGreaterThan(150);
    } finally {
      removeTree(dir);
    }
  });

  ledgerCase("renderer.typed_depth_anchor", () => {
    /* `cameraDistance` THROWS on a meta naming neither anchor. Blueprint §5,
     * blueprint §7 and architecture.md all name the silent `?? 3.5` tail as
     * the trap the two field names exist to prevent, and restoring it was
     * invisible to 1032 tests. */
    const groundplane = require(join(repoRoot, "src", "groundplane.js"));
    const bare = { px_per_m_at_wall: 96, floor_line_y: 0.65, px_per_m_at_bottom: 290, image_h_px: 1024 };
    expect(() => groundplane.scaleAtDepth(1, bare)).toThrow(/camera_wall_m|camera_far_m/);
    expect(groundplane.cameraDistance({ camera_wall_m: 3.6 })).toBe(3.6);
    expect(groundplane.cameraDistance({ camera_far_m: 26.75 })).toBe(26.75);
  });

  ledgerCase("renderer.ceiling_lines", async ({ page }) => {
    /* The ceiling is drawn the way the walls and the floor are — by its own
     * grid. Its wall-ceiling line is the floor line's twin. */
    const dir = stageWithout(
      "        ctx.moveTo(cL, snap(ceilY));\n        ctx.lineTo(cR, snap(ceilY));",
      "        ctx.moveTo(cL, snap(ceilY));\n        ctx.lineTo(cL, snap(ceilY));");
    try {
      const clean = await ceilingInk(page, repoRoot);
      const broken = await ceilingInk(page, dir);
      expect(clean.ink - broken.ink, "the wall-ceiling line goes missing").toBeGreaterThan(200);
    } finally {
      removeTree(dir);
    }
  });

  ledgerCase("renderer.ceiling_reaches_the_frame", async ({ page }) => {
    /* A surface does not stop where a DIFFERENT surface leaves the frame.
     * Row 11 ran the ceiling's fan to `px_per_m_at_bottom` — where the FLOOR
     * goes — and the ceiling stopped 209 px down, leaving the nearest fifth of
     * the frame with no ceiling in it at all, in the very pair a human is
     * asked to judge the device by. `renderer.ceiling_lines` measures the
     * wall-ceiling line and `renderer.ceiling_clipped_to_the_room` measures
     * the clip; neither can see a surface that is simply short. This measures
     * the near band. */
    const dir = stageWithout(
      "        var sCeil = Math.max(sBottom, storeyM > 0 ? (H + 2) / storeyM : sBottom);",
      "        var sCeil = sBottom;");
    try {
      /* AT A 2.0 m STOREY, and the reason is arithmetic rather than taste.
         `sCeil` takes the LARGER of the floor's last scale and the scale at
         which the ceiling leaves the top of frame, and which of the two wins
         depends on the room's height: at row 20's camera
         `px_per_m_at_bottom` is 433.6 and `(H+2)/2.8` is 366, so at a 2.8 m
         storey the floor's own scale already carries the ceiling past the
         frame and the term is inert. It bites below 1026/433.6 = 2.37 m. A
         mechanism is measured where it acts; measuring it where it cannot act
         would have been a case that passes by accident. */
      const clean = await ceilingInk(page, repoRoot, 2.0);
      const broken = await ceilingInk(page, dir, 2.0);
      expect(clean.nearBand - broken.nearBand, "and stops short without it").toBeGreaterThan(200);
    } finally {
      removeTree(dir);
    }
  });

  ledgerCase("renderer.ceiling_clipped_to_the_room", async ({ page }) => {
    /* The ceiling's own fan is clipped to the room, like the floor's. Row 11
     * shipped it unclipped for a commit: the longitudinals and both
     * wall-ceiling junctions painted straight across both returns and across
     * the void wedge above them. */
    const dir = stageWithout(
      "        ceilingFloor();\n        ctx.clip();",
      "        ctx.beginPath();\n        ctx.rect(0, 0, W, H);\n        ctx.clip();");
    try {
      const clean = await ceilingInk(page, repoRoot);
      const broken = await ceilingInk(page, dir);
      expect(broken.outside - clean.outside, "ceiling lines painted across the returns")
        .toBeGreaterThan(150);
    } finally {
      removeTree(dir);
    }
  });

  /* ---- [Row 15] the manor's building facts, in the picture -------------- */

  ledgerCase("renderer.stair_flight", async ({ page }) => {
    /* THE FLIGHT IS DRAWN, and this is what makes its `go` target honest. A
     * stair is a fact about the building exactly as a doorway is; without the
     * drawing the page offers "climb the stair" over featureless floor, in a
     * resolver whose own rule is that dead space is dead. Measured as ink on
     * the ground plane of the room the flight stands in. */
    const dir = stageWithout(
      "    var flights = meta.stairs || [];",
      "    var flights = [];");
    try {
      const clean = await stairInk(page, repoRoot);
      const broken = await stairInk(page, dir);
      expect(clean.ink, "the flight draws real ink on the stair hall's own facing")
        .toBeGreaterThan(400);
      expect(clean.ink - broken.ink, "with the flights gone the picture holds no stair at all")
        .toBeGreaterThan(400);
    } finally {
      removeTree(dir);
    }
  });

  ledgerCase("renderer.stairwell_clears_the_ceiling", async ({ page }) => {
    /* A STAIRWELL IS A HOLE IN THE CEILING. `great_stair`'s top tread lands
     * some fifteen pixels above this room's ceiling line, so without the well
     * the picture shows a staircase running into an unbroken plane — the
     * inverse of "never void", one storey up. The plan has no floor aperture
     * and this row may not add one, so the well is derived from the flight's
     * own rect and its floor's storey height and the ceiling's line work is
     * clipped out of it. Measured as ceiling ink INSIDE the well's rectangle. */
    const dir = stageWithout(
      '        if (anyWell) ctx.clip("evenodd");',
      "        if (false) ctx.clip();");
    try {
      const clean = await stairInk(page, repoRoot);
      const broken = await stairInk(page, dir);
      expect(broken.inWell - clean.inWell, "ceiling lines painted straight across the stairwell")
        .toBeGreaterThan(20);
    } finally {
      removeTree(dir);
    }
  });

  ledgerCase("renderer.threshold_line", async ({ page }) => {
    /* THE ONE MARK A THRESHOLD GETS. Law (b) forbids an invented enclosure
     * where no building stands, so the court mouth gets no jamb, no reveal and
     * no fill — but a 20.4 m `go` target on featureless ground is the same
     * defect the flights above are drawn to avoid. A line on the ground, at
     * the position the plan holds, is what the law does permit and what the
     * grid already draws every half metre. */
    const dir = stageWithout(
      '      if (mth.kind !== "threshold") continue;',
      "      if (true) continue;");
    try {
      const clean = await thresholdInk(page, repoRoot);
      const broken = await thresholdInk(page, dir);
      expect(clean.onLine, "the mouth's own ground line is drawn").toBeGreaterThan(200);
      expect(clean.onLine - broken.onLine, "and it is the threshold that draws it")
        .toBeGreaterThan(200);
    } finally {
      removeTree(dir);
    }
  });

  ledgerCase("renderer.threshold_needs_no_band", async ({ page }) => {
    /* LAW (b), READ IN THE OTHER DIRECTION. A doorway needs a band to be a
     * hole in; a threshold needs the ABSENCE of one, or it is a way through a
     * standing wall. The two tests are opposites and one function is not the
     * other: with the threshold sent through the doorway's test, the entrance
     * approach's court mouth — 20.4 m of gap between two wing fronts — has no
     * band spanning it, so the only way out of the approach disappears and one
     * room of the manor becomes unreachable with the whole suite green. */
    const dir = stageWithout(
      '        } else if (kind === "threshold") {\n' +
      "          if (crossesAnyBand(rect.x, rect.x + rect.w, bandsHere, meta)) continue;",
      '        } else if (kind === "threshold") {\n' +
      "          if (!spannedByBand(rect.x, rect.x + rect.w, bandsHere, meta)) continue;");
    try {
      const clean = await thresholdApertures(page, repoRoot);
      const broken = await thresholdApertures(page, dir);
      expect(clean, "the approach's only way in is an aperture").toBe(1);
      expect(broken, "and the doorway's own band test destroys it").toBe(0);
    } finally {
      removeTree(dir);
    }
  });
});

/* ------------------------------------------------------------- measurements */

async function open_(page, root) {
  await page.goto(appUrl(root));
  await page.waitForFunction(() => !!window.HOLO_APP);
}

/** Wall verticals drawn when an `open` meta is handed to a facing. */
async function bandCounts(page, root) {
  await open_(page, root);
  return await page.evaluate((meta) => {
    const T = window.__T, fx = window.HOLO_FIXTURE;
    const vs = { location: "study", facing: "S" };
    const c = document.createElement("canvas");
    c.width = 1536; c.height = 1024;
    const bd = {}; bd["study/S"] = { meta };
    window.HOLO.renderer.render(c, fx.world, fx.staging, T.lib(), bd, vs, { backdrop_only: true });
    let n = 0;
    for (let x = 1; x < 1536; x++) if (T.colFraction(c, x, 40, 400) > 0.9) n++;
    return { verticals: n };
  }, OPEN_META_WITH_CONTINUOUS_FIELDS);
}

/* [Row 15] THE STAIR HALL, RENDERED. `great_stair_hall/N` is the manor's
 * ascending flight seen from the room it climbs out of: 17 treads over 4.8 m
 * of run and 2.8 m of rise, ending against a ceiling this room also draws.
 * Two measurements, because the flight and the well it opens are two
 * mechanisms — the ink the flight lays on the ground plane, and the ink INSIDE
 * the well, which must be none. */
async function stairInk(page, root) {
  await page.goto(navUrl(root));
  await page.waitForFunction(() => !!window.HOLO_APP);
  return await page.evaluate(() => {
    const A = window.HOLO_APP, fx = window.HOLO_FIXTURE;
    const vs = { location: "great_stair_hall", facing: "N" };
    const meta = A.metaFor(vs);
    const c = document.createElement("canvas");
    c.width = 1536; c.height = 1024;
    window.HOLO.renderer.render(c, fx.world, fx.staging, A.library,
      { [`${vs.location}/${vs.facing}`]: { meta } }, vs, { backdrop_only: true });
    const d = c.getContext("2d").getImageData(0, 0, 1536, 1024).data;
    const fl = (meta.stairs || [])[0];
    if (!fl) return { ink: 0, inWell: 0 };
    /* The windows are read OFF THE META, so they follow the geometry instead
       of being a typed box that stops meaning anything when the camera moves. */
    const xs = (fl.well_poly || []).map((p) => p[0]);
    const ys = (fl.well_poly || []).map((p) => p[1]);
    const wx0 = Math.max(0, Math.ceil(Math.min(...xs))) + 4;
    const wx1 = Math.min(1535, Math.floor(Math.max(...xs))) - 4;
    const wy0 = Math.max(0, Math.ceil(Math.min(...ys))) + 4;
    const wy1 = Math.min(1023, Math.floor(Math.max(...ys))) - 4;
    /* INK, not floor. The grid's own floor fill is #2c3542 — 163 over three
       channels — so a threshold of 120 counts every floor pixel in the window
       and measures the window rather than the drawing. Line work is the
       facing's `key_tint` at major alpha and clears 300 comfortably. */
    const lit = (x, y) => {
      const i = (y * 1536 + x) << 2;
      return d[i] + d[i + 1] + d[i + 2] > 300;
    };
    let ink = 0, inWell = 0;
    for (let y = Math.max(0, Math.floor(fl.y)); y < Math.min(1024, Math.ceil(fl.y + fl.h)); y++) {
      for (let x = Math.max(0, Math.floor(fl.x)); x < Math.min(1536, Math.ceil(fl.x + fl.w)); x++) {
        if (lit(x, y)) ink++;
      }
    }
    /* THE WELL IS ITS OWN WINDOW, not a corner of the flight's. It is the
       footprint lifted a storey, so it lies ABOVE the flight — on this facing
       most of it is off the top-left of the frame and only y 0..174 of it is
       in the picture at all, which is exactly the band the ceiling's fan runs
       through. Scanning it inside the flight's rectangle measured one row. */
    /* And it is measured against the VOID, not against the floor. The well's
       on-frame part lies above the wall-ceiling line, where the base is
       `BEYOND_WALL` (#080b10, 35 over three channels) and the ceiling's own
       fan and transverse set are drawn at minor alpha — about 155. The
       flight's threshold of 300 is the floor's; this one is the void's. */
    for (let y = wy0; y <= wy1; y++) {
      for (let x = wx0; x <= wx1; x++) {
        const i = (y * 1536 + x) << 2;
        if (d[i] + d[i + 1] + d[i + 2] > 90) inWell++;
      }
    }
    return { ink, inWell };
  });
}

/* [Row 15] THE COURT MOUTH, RENDERED. `entrance_approach/N` is 32 m of view
 * with 20.4 m of it unbuilt — the manor's one open threshold, and the only way
 * its entrance approach joins the rest of the building. Ink is counted PER
 * COLUMN on the mouth's own ground line, so a two-pixel stroke does not read
 * as twice the line. */
async function thresholdInk(page, root) {
  await page.goto(navUrl(root));
  await page.waitForFunction(() => !!window.HOLO_APP);
  return await page.evaluate(() => {
    const A = window.HOLO_APP, fx = window.HOLO_FIXTURE;
    /* ON THE COURT'S SIDE, and the reason is worth keeping. From the entrance
       APPROACH the mouth stands at that facing's own wall line, so its ground
       line falls exactly on the wall-floor line the grid already draws and the
       threshold's stroke is coincident with it — the mark is there, and it is
       not this mechanism's. From the COURT the mouth is 6.75 m in front of an
       open facing whose far line is 26.75 m off, so the line is at y 689 with
       the far line at y 566 and nothing else draws it. */
    const vs = { location: "entrance_court", facing: "S" };
    const meta = A.metaFor(vs);
    const c = document.createElement("canvas");
    c.width = 1536; c.height = 1024;
    window.HOLO.renderer.render(c, fx.world, fx.staging, A.library,
      { [`${vs.location}/${vs.facing}`]: { meta } }, vs, { backdrop_only: true });
    const d = c.getContext("2d").getImageData(0, 0, 1536, 1024).data;
    const th = (meta.openings || []).find((o) => o.kind === "threshold");
    if (!th) return { onLine: 0 };
    /* A CONTRAST, not a threshold: the floor this line is drawn on is itself
       lit (#2c3542, 163 over three channels) and the grid rules a transverse
       line every half metre, so "is there ink here" answers yes across the
       whole picture. What discriminates is the line's own stroke against the
       floor four pixels either side of it. */
    const yLine = Math.round(th.y + th.h);
    const x0 = Math.max(2, Math.ceil(th.x) + 2);
    const x1 = Math.min(1533, Math.floor(th.x + th.w) - 2);
    let onLine = 0;
    for (let x = x0; x < x1; x++) {
      let here = 0, beside = 0;
      for (let y = yLine - 1; y <= yLine + 1; y++) {
        const i = (y * 1536 + x) << 2;
        here = Math.max(here, d[i] + d[i + 1] + d[i + 2]);
      }
      for (const y of [yLine - 4, yLine + 4]) {
        const i = (y * 1536 + x) << 2;
        beside = Math.max(beside, d[i] + d[i + 1] + d[i + 2]);
      }
      if (here - beside > 40) onLine++;
    }
    return { onLine };
  });
}

/** [Row 15] How many ways out of the entrance approach the renderer admits.
 *  One, and it is the court mouth. */
async function thresholdApertures(page, root) {
  await page.goto(navUrl(root));
  await page.waitForFunction(() => !!window.HOLO_APP);
  return await page.evaluate(() => {
    const A = window.HOLO_APP, fx = window.HOLO_FIXTURE;
    const vs = { location: "entrance_approach", facing: "N" };
    return window.HOLO.renderer.apertures(
      fx.world, fx.staging, A.library, A.metaFor(vs), vs).length;
  });
}

/** [Row 21] Apertures the NAVIGATION world cuts on study/E — where no leaf is
 *  staged, so the only thing that can put a hole in the wall is the meta. */
async function navApertureCount(page, root) {
  await page.goto(navUrl(root));
  await page.waitForFunction(() => !!window.HOLO_APP);
  return await page.evaluate(() => {
    const A = window.HOLO_APP, fx = window.HOLO_FIXTURE;
    const vs = { location: "study", facing: "E" };
    return window.HOLO.renderer.apertures(
      fx.world, fx.staging, A.library, A.metaFor(vs), vs).length;
  });
}

/** [Row 21, round 2] The same, on a PAINTED facing: the baked painting bound
 *  to `study/E` with no leaf in the world, which is the state the product
 *  reaches the day a doorway facing is admitted. */
async function paintedApertureVoid(page, root) {
  await page.goto(appUrl(root));
  await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
  return await page.evaluate(() => {
    const A = window.HOLO_APP, T = window.__T;
    const vs = { location: "study", facing: "E" };
    const world = T.worldWithout(["door1"]);
    const bd = {};
    for (const k of Object.keys(A.backdrops)) bd[k] = { meta: A.backdrops[k].meta };
    bd["study/E"] = { meta: A.metaFor(vs), image: A.backdrops["study/N"].image };
    const ap = window.HOLO.renderer.apertures(
      world, A.harness.staging, A.library, bd["study/E"].meta, vs)[0];
    const c = document.createElement("canvas");
    c.width = 1536; c.height = 1024;
    window.HOLO.renderer.render(c, world, A.harness.staging, A.library, bd, vs,
      { backdrop_only: true });
    const d = c.getContext("2d").getImageData(
      Math.round(ap.x), Math.round(ap.y), Math.round(ap.w), Math.round(ap.h)).data;
    let n = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2] < 12) n++;
    }
    return n;
  });
}

/** [Row 21, round 3] The same opening with its destination pushed to 40 m, so
 *  the far room is smaller than the hole and all four corners are real. */
async function farApertureVoid(page, root) {
  /* A WIDE ARCH ONTO A DEEP ROOM, which is the shape that exposes a corner at
     all: the reveals are 14 % and 8 % of an opening's own width and they are
     drawn OVER the room beyond, so the far room's frame has to fall further
     inside the opening than that before any corner region is visible. A 0.90 m
     door onto a 12.7 m passage never does — every corner of the two shipped
     openings measures 0 px, which is why four draws could be deleted with the
     whole suite green. A 900 px arch (great-hall scale, which the manor has)
     onto a room 12 m off does: the far frame is 507 px in a 900 px hole,
     leaving 196 px of corner a side. */
  return await doctoredApertureVoid(page, root, (o) => {
    o.x = 320; o.w = 900; o.beyond_m = 12; o.beyond_offset_m = 0.088;
  });
}

/** [Row 21, round 3] And with its `beyond_m` unknown, which is what a plan door
 *  into a room this world does not hold will carry. */
async function nullBeyondVoid(page, root) {
  return await doctoredApertureVoid(page, root, (o) => { o.beyond_m = null; });
}

async function doctoredApertureVoid(page, root, doctor) {
  await page.goto(navUrl(root));
  await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
  return await page.evaluate((doctorSrc) => {
    const A = window.HOLO_APP;
    const vs = { location: "study", facing: "E" };
    const meta = JSON.parse(JSON.stringify(A.metaFor(vs)));
    // eslint-disable-next-line no-new-func
    (new Function("o", doctorSrc))(meta.openings[0]);
    const bd = {};
    for (const k of Object.keys(A.backdrops)) bd[k] = { meta: A.backdrops[k].meta };
    bd["study/E"] = { meta };
    const ap = window.HOLO.renderer.apertures(
      A.harness.world, A.harness.staging, A.library, meta, vs)[0];
    const c = document.createElement("canvas");
    c.width = 1536; c.height = 1024;
    window.HOLO.renderer.render(c, A.harness.world, A.harness.staging, A.library, bd, vs,
      { backdrop_only: true });
    const d = c.getContext("2d").getImageData(
      Math.round(ap.x), Math.round(ap.y), Math.round(ap.w), Math.round(ap.h)).data;
    let n = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2] < 12) n++;
    }
    return n;
  }, doctorBody(doctor));
}

function doctorBody(fn) {
  const src = String(fn);
  return src.slice(src.indexOf("{") + 1, src.lastIndexOf("}"));
}

/** [Row 21, round 3] A THREE-ROOM CHAIN: the destination facing has a doorway
 *  of its own, which is what row 15's manor is made of. With the recursion stop
 *  in place the second doorway is drawn as what it is at that distance — an
 *  unlit opening — and with it gone the third room is drawn inside it. The
 *  answer is a number rather than a hang: an earlier version of this case built
 *  a SELF-loop and detected the descent by waiting for a stack overflow, which
 *  is engine-dependent (Chromium unwinds in under a second, Firefox grinds) and
 *  wedged a page for eight seconds on a loaded machine. */
async function secondDoorwayVoid(page, root) {
  await page.goto(navUrl(root));
  await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
  return await page.evaluate(() => {
    const A = window.HOLO_APP;
    const vs = { location: "study", facing: "E" };
    const world = JSON.parse(JSON.stringify(A.harness.world));
    /* A third room beyond the passage, reached on the facing you arrive with. */
    world.locations.push({ id: "cellar", facings: ["N", "E", "S", "W"], exits: [] });
    world.locations.find((l) => l.id === "hall").exits.push({
      id: "onward", from: "hall", facing: "E", to: "cellar",
      arrive_facing: "E", via: "door2"
    });
    const bd = {};
    for (const k of Object.keys(A.backdrops)) {
      bd[k] = { meta: JSON.parse(JSON.stringify(A.backdrops[k].meta)) };
    }
    bd["cellar/E"] = { meta: JSON.parse(JSON.stringify(A.backdrops["study/N"].meta)) };
    const src = bd["study/E"].meta.openings[0];
    /* AT THE RIGHT-HAND END OF THE PASSAGE'S OWN END WALL, and the position is
       forced rather than chosen: the far room is drawn at 0.47 scale offset
       into a 250 px opening, so only about 43 px of its end wall falls inside
       the hole we are looking through. A second doorway anywhere else in that
       wall maps outside the clip and is invisible whatever the renderer does —
       which is what makes this mechanism so easy to leave unguarded. */
    bd["hall/E"].meta.openings = [{ id: "onward", via: "door2", x: 928, y: 430,
      w: 62, h: 300, beyond_m: src.beyond_m, beyond_offset_m: 0 }];
    const ap = window.HOLO.renderer.apertures(
      world, A.harness.staging, A.library, bd["study/E"].meta, vs)[0];
    const c = document.createElement("canvas");
    c.width = 1536; c.height = 1024;
    window.HOLO.renderer.render(c, world, A.harness.staging, A.library, bd, vs,
      { backdrop_only: true });
    const d = c.getContext("2d").getImageData(
      Math.round(ap.x), Math.round(ap.y), Math.round(ap.w), Math.round(ap.h)).data;
    let n = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2] < 12) n++;
    }
    return n;
  });
}

/** [Row 21, round 5] The mean luminance of the central half of `study/E`'s
 *  doorway — inside the reveals, where what is drawn is the room beyond. */
async function throughCentreMean(page, root) {
  await page.goto(navUrl(root));
  await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
  return await page.evaluate(() => {
    const A = window.HOLO_APP;
    const vs = { location: "study", facing: "E" };
    const meta = A.metaFor(vs);
    const ap = window.HOLO.renderer.apertures(
      A.harness.world, A.harness.staging, A.library, meta, vs)[0];
    const c = document.createElement("canvas");
    c.width = 1536; c.height = 1024;
    window.HOLO.renderer.render(c, A.harness.world, A.harness.staging, A.library,
      A.backdrops, vs, { backdrop_only: true });
    const x = Math.round(ap.x + ap.w * 0.3), y = Math.round(ap.y + ap.h * 0.3);
    const w = Math.max(1, Math.round(ap.w * 0.4)), h = Math.max(1, Math.round(ap.h * 0.4));
    const d = c.getContext("2d").getImageData(x, y, w, h).data;
    let sum = 0;
    for (let i = 0; i < d.length; i += 4) {
      sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    }
    return sum / (d.length / 4);
  });
}

/** [Row 21] How dark it is inside that doorway. */
async function apertureVoid(page, root) {
  await page.goto(navUrl(root));
  await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
  return await page.evaluate(() => {
    const A = window.HOLO_APP;
    const vs = { location: "study", facing: "E" };
    const meta = A.metaFor(vs);
    const ap = window.HOLO.renderer.apertures(
      A.harness.world, A.harness.staging, A.library, meta, vs)[0];
    const c = document.createElement("canvas");
    c.width = 1536; c.height = 1024;
    window.HOLO.renderer.render(c, A.harness.world, A.harness.staging, A.library,
      A.backdrops, vs, { backdrop_only: true });
    const d = c.getContext("2d").getImageData(
      Math.round(ap.x), Math.round(ap.y), Math.round(ap.w), Math.round(ap.h)).data;
    let n = 0, sum = 0;
    for (let i = 0; i < d.length; i += 4) {
      const L = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      sum += L;
      if (L < 12) n++;
    }
    return { near_black: n, mean: sum / (d.length / 4) };
  });
}

/** Apertures returned for study/E under a given meta. */
async function apertureCount(page, root, meta) {
  await open_(page, root);
  return await page.evaluate((meta) => {
    const A = window.HOLO_APP, fx = window.HOLO_FIXTURE;
    const vs = { location: "study", facing: "E" };
    return window.HOLO.renderer.apertures(fx.world, fx.staging, A.library, meta, vs).length;
  }, meta);
}
const apertureCountOnOpenMeta = (page, root) => apertureCount(page, root, OPEN_META_FOR_STUDY_E);

/** Opaque pixels the door leaf paints on study/E under an `open` meta. */
async function leafPixels(page, root) {
  await open_(page, root);
  return await page.evaluate((meta) => {
    const T = window.__T, fx = window.HOLO_FIXTURE;
    const vs = { location: "study", facing: "E" };
    const c = document.createElement("canvas");
    c.width = 1536; c.height = 1024;
    const bd = {}; bd["study/E"] = { meta };
    window.HOLO.renderer.render(c, fx.world, fx.staging, T.lib(), bd, vs,
      { no_backdrop: true, shadows: false });
    const d = c.getContext("2d").getImageData(0, 0, 1536, 1024).data;
    let n = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] >= 128) n++;
    return n;
  }, OPEN_META_FOR_STUDY_E);
}

/** Lit pixels inside a return's own region — the side wall's ink. */
async function returnRegionInk(page, root, vs) {
  await open_(page, root);
  return await page.evaluate((vs) => {
    const T = window.__T;
    const c = T.renderDirect(vs, null, { backdrop_only: true });
    const meta = T.metaOf(vs);
    const d = c.getContext("2d").getImageData(0, 0, 1536, 1024).data;
    const cL = Math.floor(meta.corner_x0_px) - 4;
    const floorY = Math.floor(meta.floor_line_y * meta.image_h_px);
    let base = 255;
    for (let y = 60; y < floorY; y += 2) {
      for (let x = 4; x < cL; x += 2) {
        const v = d[(y * 1536 + x) * 4];
        if (v < base) base = v;
      }
    }
    let n = 0;
    for (let y = 60; y < 1000; y += 2) {
      for (let x = 4; x < cL; x += 2) if (d[(y * 1536 + x) * 4] > base + 8) n++;
    }
    return n;
  }, vs);
}

/** Ink: pixels brighter than the bases, over a facing's whole grid layer. */
async function brightPixels(page, root, vs) {
  await open_(page, root);
  return await page.evaluate((vs) => {
    const T = window.__T;
    const c = T.renderDirect(vs, null, { backdrop_only: true });
    const d = c.getContext("2d").getImageData(0, 0, 1536, 1024).data;
    let n = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] > 60) n++;
    return n;
  }, vs);
}

/** Every lit pixel of a facing's grid layer. */
async function litPixels(page, root, vs) {
  await open_(page, root);
  return await page.evaluate((vs) => {
    const T = window.__T;
    const c = T.renderDirect(vs, null, { backdrop_only: true });
    const d = c.getContext("2d").getImageData(0, 0, 1536, 1024).data;
    let base = 255;
    for (let i = 0; i < d.length; i += 4 * 37) if (d[i] < base) base = d[i];
    let n = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] > base + 8) n++;
    return n;
  }, vs);
}

/** Glyph ink inside the band against outside it, on hall/W. */
async function glyphInk(page, root) {
  await open_(page, root);
  return await page.evaluate(() => {
    const T = window.__T;
    const vs = { location: "hall", facing: "W" };
    const c = T.renderDirect(vs, null, { backdrop_only: true });
    const meta = T.metaOf(vs);
    const d = c.getContext("2d").getImageData(0, 0, 1536, 1024).data;
    /* The glyph is the brightest ink on the frame; count its pixels either
       side of the corner columns. */
    let onBand = 0, offBand = 0;
    for (let y = 40; y < 660; y++) {
      for (let x = 0; x < 1536; x++) {
        if (d[(y * 1536 + x) * 4] > 120) {
          if (x >= meta.corner_x0_px && x <= meta.corner_x1_px) onBand++; else offBand++;
        }
      }
    }
    return { onBand, offBand };
  });
}

/** How strongly the eye line is drawn on a facing with no wall. */
async function eyeLineOnOpen(page, root) {
  await open_(page, root);
  return await page.evaluate((meta) => {
    const T = window.__T, fx = window.HOLO_FIXTURE;
    const vs = { location: "study", facing: "S" };
    const c = document.createElement("canvas");
    c.width = 1536; c.height = 1024;
    const bd = {}; bd["study/S"] = { meta };
    window.HOLO.renderer.render(c, fx.world, fx.staging, T.lib(), bd, vs, { backdrop_only: true });
    const row = Math.floor(meta.horizon_y * meta.image_h_px);
    let best = 0;
    for (let y = row - 2; y <= row + 2; y++) best = Math.max(best, T.lineFraction(c, y));
    return best;
  }, OPEN_META_WITH_CONTINUOUS_FIELDS);
}

/** Ceiling plane pixels, and ceiling ink outside the room it belongs to. */
async function ceilingInk(page, root, storey = 2.8) {
  await open_(page, root);
  return await page.evaluate((storey) => {
    const T = window.__T, fx = window.HOLO_FIXTURE;
    /* Measured on the passage's east view. Row 20's lens makes the study a
       room whose facing wall fills the frame, so a mechanism about the CEILING
       AND THE RETURNS measured there is measured where the returns are 5.6% of
       the frame; hall/E is 71% return and its ceiling line sits at y 287. */
    const vs = { location: "hall", facing: "E" };
    const base = T.metaOf(vs);
    const meta = { ...base, storey_height_m: storey };
    const c = document.createElement("canvas");
    c.width = 1536; c.height = 1024;
    const bd = {}; bd["hall/E"] = { meta };
    window.HOLO.renderer.render(c, fx.world, fx.staging, T.lib(), bd, vs, { backdrop_only: true });
    const d = c.getContext("2d").getImageData(0, 0, 1536, 1024).data;
    const ceilY = meta.floor_line_y * meta.image_h_px - storey * meta.px_per_m_at_wall;
    /* All the ceiling's ink, and the part of it that lands where the room's
       ceiling is not: left of the left corner, above the wall-ceiling line. */
    let ink = 0, outside = 0, nearBand = 0;
    for (let y = 4; y < 1020; y++) {
      for (let x = 2; x < 1534; x++) {
        if (d[(y * 1536 + x) * 4] > 60) {
          ink++;
          if (y < ceilY - 4 && x < meta.corner_x0_px - 6) outside++;
          if (y < 200) nearBand++;   // the nearest fifth of the frame
        }
      }
    }
    return { ink, outside, nearBand };
  }, storey);
}

/** The facing glyph's own bounding box on hall/W, and where its band is. */
async function glyphBox(page, root) {
  await open_(page, root);
  return await page.evaluate(() => {
    const T = window.__T, fx = window.HOLO_FIXTURE;
    const vs = { location: "hall", facing: "W" };
    /* A NARROWER WALL than the passage's own, so the door leaves no room for
       the glyph beside it. Row 20 shrank the letter to 0.35 m of wall, which
       on the shipped 2.60 m end wall fits beside the 1.0 m door with 11 px to
       spare — so the shipped facing no longer exercises the dodge at all, and
       a case measured there would pass whatever `fitsBand` did. The mechanism
       is what happens when the sideways dodges do NOT fit, so the meta is
       doctored until they do not. */
    const base = T.metaOf(vs);
    const meta = { ...base, wall_width_m: 1.6,
      corner_x0_px: 768 - 1.6 / 2 * base.px_per_m_at_wall,
      corner_x1_px: 768 + 1.6 / 2 * base.px_per_m_at_wall };
    const c = document.createElement("canvas");
    c.width = 1536; c.height = 1024;
    const bd = {}; bd["hall/W"] = { meta };
    window.HOLO.renderer.render(c, fx.world, fx.staging, T.lib(), bd, vs,
      { backdrop_only: true });
    const d = c.getContext("2d").getImageData(0, 0, 1536, 1024).data;
    /* The glyph is the brightest ink on a bare wall — brighter than the metre
       lines, which is what `ALPHA_GLYPH` 0.45 against `ALPHA_MINOR` 0.25
       buys. Its box is taken over the rows it occupies. */
    let x0 = 1e9, x1 = -1e9;
    for (let y = 150; y < 700; y++) {
      let run = 0;
      for (let x = 2; x < 1534; x++) {
        if (d[(y * 1536 + x) * 4] > 90) run++;
        else {
          /* Runs of four or more, so the letter's own strokes are counted and
             the wall's 1 px metre lines and the 2 px corner verticals are not.
             The glyph strokes at `gh/18`, six pixels at this scale. */
          /* And TALL: the same column bright eight rows down. The eye line is
             a full-width run one pixel high, and without this it hands the box
             the whole frame. */
          const mid = x - Math.ceil(run / 2);
          if (run >= 4 && y + 8 < 1024 && d[((y + 8) * 1536 + mid) * 4] > 90) {
            if (x - run < x0) x0 = x - run;
            if (x - 1 > x1) x1 = x - 1;
          }
          run = 0;
        }
      }
    }
    return { x0, x1, bandLo: meta.corner_x0_px, bandHi: meta.corner_x1_px };
  });
}

/** Ink inside the doorway's own rect on study/E — where the jamb is drawn. */
async function jambInk(page, root) {
  await open_(page, root);
  return await page.evaluate(() => {
    const A = window.HOLO_APP, T = window.__T, fx = window.HOLO_FIXTURE;
    const vs = { location: "study", facing: "E" };
    const meta = T.metaOf(vs);
    const a = window.HOLO.renderer.apertures(fx.world, fx.staging, A.library, meta, vs)[0];
    const c = T.renderDirect(vs, null, { backdrop_only: true });
    const d = c.getContext("2d").getImageData(0, 0, 1536, 1024).data;
    let n = 0;
    const x0 = Math.max(0, Math.floor(a.x) - 14), x1 = Math.min(1535, Math.ceil(a.x + a.w) + 14);
    const y0 = Math.max(0, Math.floor(a.y) - 14), y1 = Math.min(1023, Math.ceil(a.y + a.h) + 4);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) if (d[(y * 1536 + x) * 4] > 60) n++;
    }
    return n;
  });
}

/** How strongly a vertical stands at the left corner of study/S. */
async function cornerStrength(page, root) {
  await open_(page, root);
  return await page.evaluate(() => {
    const T = window.__T;
    const vs = { location: "study", facing: "S" };
    const c = T.renderDirect(vs, null, { backdrop_only: true });
    const m = T.metaOf(vs);
    const cx = Math.round(m.corner_x0_px);
    /* The corner runs from the wall-ceiling line to the floor line, so the
       scan lives between them. The rooms have a storey height [HUMAN
       2026-08-21]; above it the frame is ceiling and a scan from y 40 would
       be asking the ceiling whether a corner is drawn. */
    const floorY = m.floor_line_y * m.image_h_px;
    const y0 = Math.ceil(floorY - m.storey_height_m * m.px_per_m_at_wall) + 6;
    const y1 = Math.floor(floorY) - 45;
    let best = 0;
    for (let x = cx - 3; x <= cx + 3; x++) best = Math.max(best, T.colFraction(c, x, y0, y1));
    return best;
  });
}

/* Two metas the plan really produces and M0 does not ship. */
const OPEN_META_WITH_CONTINUOUS_FIELDS = (() => {
  const m = deriveMeta(PLAN, "entrance_court", "S");
  return { ...m, wall_continuous: true, wall_segments: [{ from_m: 0, to_m: m.wall_width_m, kind: "wall" }] };
})();

const OPEN_META_FOR_STUDY_E = (() => {
  const wall = deriveMeta(PLAN, "study", "E");
  const out = {
    ...wall, facing_type: "open", camera_far_m: wall.camera_wall_m,
    backdrop: "vista", wall_continuous: false, wall_segments: [],
    corner_x0_px: null, corner_x1_px: null
  };
  delete out.camera_wall_m;
  return out;
})();

/* Part building, part open ground, with the door standing in the OPEN part —
 * the case the first ledger's aperture test structurally could not reach. */
const SEGMENTED_META_FOR_STUDY_E = (() => {
  const wall = deriveMeta(PLAN, "study", "E");
  return {
    ...wall, wall_continuous: false, corner_x0_px: null, corner_x1_px: null,
    wall_segments: [{ from_m: 0, to_m: 0.4, kind: "wall" }]
  };
})();

/* --------------------------------------------------------------- the ledger */

/* THE PROMPT LINT IS A VALIDATOR, so its clauses are ledger mechanisms.
 *
 * It refuses an artifact BEFORE it is made rather than after, which is the
 * production law's own remedy — a cause baked in algorithmically rather than
 * left in a transcript — and that is the same job the fixture validator does
 * one step later. Its behavioural discrimination against real and adversarial
 * prompts lives in `plan.spec`; what these four owe is the ledger's own
 * property: each clause fires ALONE on an input that commits exactly its
 * fault. */
test.describe("the clause ledger — prompt-lint mechanisms", () => {
  const LINT = join(repoRoot, "design", "plan-draft", "measured", "prompt_lint.py");

  function lintTokens(lines) {
    const dir = mkdtempSync(join(tmpdir(), "holo-lintcase-"));
    const f = join(dir, "case.prompt.txt");
    try {
      writeFileSync(f, lines.join("\n") + "\n");
      let out = "";
      try {
        out = execFileSync("python3", [LINT, f], { cwd: repoRoot, encoding: "utf8", stdio: "pipe" });
      } catch (e) { out = String(e.stdout || "") + String(e.stderr || ""); }
      expect(out, "the lint did not run").toMatch(/prompt\(s\) refused/);
      return [...tokensOf([out])].sort();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  const GOOD_ANCHOR = "Gate anchor: the door opening's height at the wall plane, 2.00 m";

  ledgerCase("prompt.no_gate_anchor", () => {
    expect(lintTokens([
      "Asset type: backdrop candidate for the study east facing",
      "Geometry: the wall is centred and both corners are in frame."
    ]), "a prompt that names no ruler leaves the gate to find one in the picture")
      .toEqual(["prompt.no_gate_anchor"]);
  });

  ledgerCase("prompt.contradictory_scale", () => {
    expect(lintTokens([
      GOOD_ANCHOR,
      "Targeted correction: move the camera closer until the wall spans about 1346 pixels.",
      "Avoid: changing the camera scale, fisheye, rim light."
    ]), "a re-ask that forbids the correction it asks for is not a re-ask")
      .toEqual(["prompt.contradictory_scale"]);
  });

  ledgerCase("prompt.unmeasurable_by_design", () => {
    /* THIS ONE FIRES AS A PAIR, by construction rather than by accident: its
       own precondition is that the prompt has no usable anchor, which is what
       `prompt.no_gate_anchor` says. Asserting the pair is the honest exclusivity
       for a clause whose subject includes another clause's; what makes the case
       evidence is the discrimination below — the same forbidding frame with a
       ruler in it trips neither. */
    expect(lintTokens([
      "Asset type: a flat wall band",
      "Hard camera geometry: NO ceiling line. NO corners in frame.",
      "Critical constraints: no feature, carrier, opening, or decoration."
    ]), "a frame with nothing of ruled size in it can never be admitted")
      .toEqual(["prompt.no_gate_anchor", "prompt.unmeasurable_by_design"]);
    expect(lintTokens([
      GOOD_ANCHOR,
      "Hard camera geometry: NO ceiling line. NO corners in frame."
    ]), "and the same frame with a declared ruler in it is measurable")
      .toEqual([]);
  });

  ledgerCase("prompt.anchor_datum_forbidden", () => {
    expect(lintTokens([
      "Gate anchor: wainscot chair-rail at exactly 0.95m above the floor, running the full wall",
      "Geometry: No floor, no ceiling, and no corners appear."
    ]), "a height above a floor the frame forbids is not a length in that frame")
      .toEqual(["prompt.anchor_datum_forbidden"]);
  });
});

test("the ledger is complete: every declared mechanism has a case, and every case a mechanism", () => {
  /* THE STRUCTURAL HALF, and row 11 built it wrong the first time: `cased` was
   * a second hand-typed list of names, so deleting a whole case left the
   * ledger green. `REGISTERED` is filled by `ledgerCase` as each case is
   * defined, so this reads the cases that EXIST. Delete a case and its name
   * disappears from the set. */
  const declared = new Set(MECHANISMS);
  expect([...declared].filter((n) => !REGISTERED.has(n)).sort(), "declared with no case").toEqual([]);
  expect([...REGISTERED].filter((n) => !declared.has(n)).sort(), "cased but not declared").toEqual([]);
  expect(REGISTERED.size).toBe(MECHANISMS.length);
});

test("every clause the validators can emit is a mechanism the ledger declares", () => {
  /* The other direction, and the one that would have caught row 11's six
   * unnamed mechanisms if it had existed: read the tokens out of the SOURCE
   * and require each to be declared. A clause added without a name is as
   * invisible as a mechanism added without a case. */
  const declared = new Set(MECHANISMS);
  const seen = new Set();
  /* ROW 20 EXTENDS THE SCAN. Row 18 is the row that makes it read every emit
     site; until it lands this reads the two validators AND the two tools row
     20's own document-side clauses emit from, which is every token this row
     mints outside the renderer. The renderer's tokens are still covered by
     `MECHANISMS` plus a registered case and NOT by a source scan — that half
     stays row 18's, and saying which half is scanned is the point. */
  for (const f of SCANNED) {
    const src = readFileSync(join(repoRoot, f), "utf8");
    for (const m of src.matchAll(TOKEN_RE)) seen.add(m[2]);
  }
  expect([...seen].filter((n) => !declared.has(n)).sort(), "emitted but undeclared").toEqual([]);
  /* And each token tags exactly ONE emit site, so a case that names a clause
   * is naming one arm — the first ledger let `meta.camera_pairing` tag four
   * and exercised one, which is the failure this file exists to prevent. */
  /* ACROSS THE UNION OF THE SCANNED FILES, not per file. An artifact critic
     added a second `meta.one_lens` emit in a DIFFERENT file from the token's
     own home and the per-file count stayed at one apiece — which is exactly
     the failure this assertion exists to prevent (`meta.camera_pairing`
     tagging four arms), reachable across files instead of within one. */
  const counts = {};
  for (const f of SCANNED) {
    const src = readFileSync(join(repoRoot, f), "utf8");
    for (const m of src.matchAll(TOKEN_RE)) {
      counts[m[2]] = (counts[m[2]] || 0) + 1;
    }
  }
  for (const [name, n] of Object.entries(counts)) {
    expect(n, `${name} tags ${n} emit sites across the scanned tools — one token, one arm`).toBe(1);
  }
});

test("anything shaped like a ledger token IS one — the grammar is read, not only applied", () => {
  /* The two checks above are blind to a token they cannot parse: an emit site
   * tagged `[row21:meta.brandNew]` is neither declared nor undeclared, and
   * neither counted nor uncounted. So every occurrence of the token's opening
   * shape has to parse under the strict grammar or it is a finding by itself.
   * This is the same argument that derived the scanned file set and the row
   * prefix, carried down to the last typed part of the pattern. */
  const bad = [];
  for (const f of SCANNED) {
    for (const line of readFileSync(join(repoRoot, f), "utf8").split("\n")) {
      for (const m of line.matchAll(TOKEN_LOOSE_RE)) {
        /* From the opening shape to the end of its own line: no character
           budget to slip past, and an unterminated token has no `]` to hide
           behind either. */
        const rest = line.slice(m.index);
        if (!/^\[row\d+:[a-z_.]+\]/.test(rest)) {
          bad.push(`${f}: ${rest.slice(0, 60)}${rest.length > 60 ? "…" : ""}`);
        }
      }
    }
  }
  expect(bad.sort(),
    "these read as ledger tokens and do not parse as one, so every completeness check above is silent about them")
    .toEqual([]);
});
