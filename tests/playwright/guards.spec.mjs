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
 * stable `[row11:<name>]` token in the finding it emits, so a case can name
 * what fired instead of pattern-matching prose that will be reworded. And
 * `MECHANISMS` below declares the full set: the ledger test asserts that the
 * set of cases in this file is EXACTLY the declared set, so a mechanism added
 * without a case shows up as an absence rather than as silence.
 *
 * Every case in this module was written by breaking the thing it guards and
 * watching it go red.
 */
import { test, expect, repoRoot, stageTree, removeTree, bake, appUrl } from "./helpers.mjs";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { validate } from "../../tools/validate-fixtures.mjs";
import { validatePlan } from "../../tools/validate-plan.mjs";
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
    const m = /\[row11:([a-z_.]+)\]/g;
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
const REGISTERED = new Set();
function ledgerCase(name, body) {
  REGISTERED.add(name);
  test(`red on ${name} alone`, body);
}

/* The declared set. Adding a mechanism here without a case below is an
 * absence; a case whose name is not here is a name nobody owns. */
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
  "meta.frame_fits_left",
  "meta.frame_fits_right",
  "meta.frame_fits_uncornered",
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
  "bake.refuses_wide_camera",
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
    m["hall/S"] = openLike(m["hall/S"]);
    m["hall/S"].camera_wall_m = 1.95;
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
  "meta.frame_fits_left": () => tokensFromMetas((m) => { m["hall/S"].corner_x0_px = -1; }),
  "meta.frame_fits_right": () => tokensFromMetas((m) => { m["hall/S"].corner_x1_px = 1600; }),
  "meta.frame_fits_uncornered": () => tokensFromMetas((m) => {
    // the no-corner half of §12.5 (i) — the half row 11 extended it for, and
    // the half the first ledger's single `frame_fits` case never reached
    m["hall/S"].facing_type = null;
    m["hall/S"].corner_x0_px = null;
    m["hall/S"].corner_x1_px = null;
    m["hall/S"].wall_width_m = 20;
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
    const p = clone(PLAN);
    const o = p.objects.find((x) => x.id === "shelf1");
    o.note = "a reason for a value nobody chose";
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
  ledgerCase("bake.refuses_wide_camera", () => {
    /* The refusal blueprint §5 promises: a wide-camera meta may not ship until
     * `design/plan-draft/projection.md` §5's two readings of Kabe's licence
     * are ruled. The mutation is the live, unruled choice itself — switch the
     * default wide-view policy to the ruling's own vocabulary and the cross
     * passage's two corridor facings become wide, which is exactly the
     * scenario the refusal exists for. Nothing else fires first: the metas
     * stay self-consistent, so the camera checks pass. */
    const dir = stageTree();
    try {
      const f = join(dir, "tools", "plan-projection.mjs");
      const src = readFileSync(f, "utf8");
      expect(src).toContain('export const DEFAULT_WIDE_VIEW_POLICY = "fits";');
      writeFileSync(f, src.replace('export const DEFAULT_WIDE_VIEW_POLICY = "fits";',
        'export const DEFAULT_WIDE_VIEW_POLICY = "ruling";'));
      let msg = "";
      try {
        bake(dir, ["--fixture-dir", join(dir, "fixtures", "demo-study")]);
      } catch (e) {
        msg = String(e.stderr || e.message);
      }
      expect(msg, "the bake refused, and named the wide camera")
        .toMatch(/derives the WIDE camera/);
      expect(msg).toMatch(/hall\/[EW]/);
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
      "      if (x0 >= lo - 500 && x1 <= hi + 500) return true;");
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
      const clean = await brightPixels(page, repoRoot, { location: "study", facing: "S" });
      const broken = await brightPixels(page, dir, { location: "study", facing: "S" });
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
      const clean = await brightPixels(page, repoRoot, { location: "study", facing: "S" });
      const broken = await brightPixels(page, dir, { location: "study", facing: "S" });
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
      const clean = await glyphInk(page, repoRoot);
      const broken = await glyphInk(page, dir);
      expect(broken.offBand - clean.offBand,
        "with the check gone the letter moves off the wall into the return")
        .toBeGreaterThan(100);
      expect(broken.onBand + broken.offBand, "and it is the same letter, moved")
        .toBeGreaterThan(clean.onBand + clean.offBand - 50);
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
      const clean = await glyphInk(page, repoRoot);
      const broken = await glyphInk(page, dir);
      expect((clean.onBand + clean.offBand) - (broken.onBand + broken.offBand),
        "the doorway loses its proud frame").toBeGreaterThan(150);
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
async function ceilingInk(page, root) {
  await open_(page, root);
  return await page.evaluate(() => {
    const T = window.__T, fx = window.HOLO_FIXTURE;
    const vs = { location: "study", facing: "N" };
    const base = T.metaOf(vs);
    const meta = { ...base, storey_height_m: 2.8 };
    const c = document.createElement("canvas");
    c.width = 1536; c.height = 1024;
    const bd = {}; bd["study/N"] = { meta };
    window.HOLO.renderer.render(c, fx.world, fx.staging, T.lib(), bd, vs, { backdrop_only: true });
    const d = c.getContext("2d").getImageData(0, 0, 1536, 1024).data;
    const ceilY = meta.floor_line_y * meta.image_h_px - 2.8 * meta.px_per_m_at_wall;
    /* All the ceiling's ink, and the part of it that lands where the room's
       ceiling is not: left of the left corner, above the wall-ceiling line. */
    let ink = 0, outside = 0;
    for (let y = 4; y < 1020; y++) {
      for (let x = 2; x < 1534; x++) {
        if (d[(y * 1536 + x) * 4] > 60) {
          ink++;
          if (y < ceilY - 4 && x < meta.corner_x0_px - 6) outside++;
        }
      }
    }
    return { ink, outside };
  });
}

/** How strongly a vertical stands at the left corner of study/S. */
async function cornerStrength(page, root) {
  await open_(page, root);
  return await page.evaluate(() => {
    const T = window.__T;
    const vs = { location: "study", facing: "S" };
    const c = T.renderDirect(vs, null, { backdrop_only: true });
    const cx = Math.round(T.metaOf(vs).corner_x0_px);
    let best = 0;
    for (let x = cx - 3; x <= cx + 3; x++) best = Math.max(best, T.colFraction(c, x, 40, 400));
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
  for (const f of ["tools/validate-fixtures.mjs", "tools/validate-plan.mjs"]) {
    const src = readFileSync(join(repoRoot, f), "utf8");
    for (const m of src.matchAll(/\[row11:([a-z_.]+)\]/g)) seen.add(m[1]);
  }
  expect([...seen].filter((n) => !declared.has(n)).sort(), "emitted but undeclared").toEqual([]);
  /* And each token tags exactly ONE emit site, so a case that names a clause
   * is naming one arm — the first ledger let `meta.camera_pairing` tag four
   * and exercised one, which is the failure this file exists to prevent. */
  for (const f of ["tools/validate-fixtures.mjs", "tools/validate-plan.mjs"]) {
    const src = readFileSync(join(repoRoot, f), "utf8");
    const counts = {};
    for (const m of src.matchAll(/\[row11:([a-z_.]+)\]/g)) counts[m[1]] = (counts[m[1]] || 0) + 1;
    for (const [name, n] of Object.entries(counts)) {
      expect(n, `${name} tags ${n} emit sites in ${f} — one token, one arm`).toBe(1);
    }
  }
});
