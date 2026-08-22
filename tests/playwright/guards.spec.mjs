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
import { test, expect, repoRoot, stageTree, removeTree, bake, appUrl } from "./helpers.mjs";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { validate } from "../../tools/validate-fixtures.mjs";
import { validatePlan, drawn } from "../../tools/validate-plan.mjs";
import { deriveMeta, metaForFacing } from "../../tools/plan-projection.mjs";

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
const SCANNED = readdirSync(join(repoRoot, "tools"))
  .filter((f) => /\.(mjs|js|cjs)$/.test(f))
  .map((f) => `tools/${f}`)
  .sort();

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
   a silence, and the strict grammar can no longer be evaded by breaking it. */
const TOKEN_LOOSE_RE = /\[row\d*:?([^\]\n]{0,80})(\]|\n|$)/g;

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
  "renderer.jamb_stands_proud",
  "renderer.typed_depth_anchor",
  "renderer.ceiling_lines",
  "renderer.ceiling_reaches_the_frame",
  "renderer.ceiling_clipped_to_the_room"
];

/* ------------------------------------------------------------------ cases */

/** name -> a function returning the set of clause tokens it tripped. */
const DOCUMENT_CASES = {
  "meta.required_fields": () => tokensFromMetas((m) => { delete m["study/N"].key_tint; }),
  "meta.unknown_key": () => tokensFromMetas((m) => { m["study/N"].floor_line = 0.63; }),
  "meta.storey_height": () => tokensFromMetas((m) => { m["study/N"].storey_height_m = 0.4; }),
  "meta.facing_type": () => tokensFromMetas((m) => { m["study/N"].facing_type = "outdoors"; }),
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
    // the study's east wall becomes a horizon; door1 still hangs on it
    m["study/E"] = openLike(m["study/E"]);
  }),
  "staging.wall_mounted_off_band": () => tokensFromMetas((m) => {
    // part building, part open ground — with the door in the open part
    m["study/E"] = {
      ...m["study/E"], wall_continuous: false,
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
  }
};

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
    expect([...tokensOf(validate(FIXTURE_DIR, RECORDS))]).toEqual([]);
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
      "        if (!spannedByBand(place.x0, place.x1, bandsHere, meta)) continue;",
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
    const src = readFileSync(join(repoRoot, f), "utf8");
    for (const m of src.matchAll(TOKEN_LOOSE_RE)) {
      const whole = m[0].endsWith("]") ? m[0] : `${m[0].replace(/\n$/, "")} (unterminated)`;
      if (!/^\[row\d+:[a-z_.]+\]$/.test(whole)) bad.push(`${f}: ${whole}`);
    }
  }
  expect(bad.sort(),
    "these read as ledger tokens and do not parse as one, so every completeness check above is silent about them")
    .toEqual([]);
});
