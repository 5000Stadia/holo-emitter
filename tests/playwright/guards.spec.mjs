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
 * declared set. Adding a mechanism without adding its case below makes the
 * ledger test red. */
export const MECHANISMS = [
  // the §5 meta schema arm (tools/validate-fixtures.mjs checkMeta)
  "meta.required_fields",
  "meta.facing_type",
  "meta.camera_pairing",
  "meta.corner_pairing",
  "meta.open_no_corners",
  "meta.segmented_no_corners",
  "meta.segments_present",
  "meta.null_type_no_corners",
  "meta.frame_fits",
  "meta.image_h",
  "meta.unknown_key",
  "meta.storey_height",
  "meta.segments_sane",
  // wall existence, against staging
  "staging.outside_room",
  "staging.wall_mounted_on_open",
  "staging.wall_mounted_off_band",
  // the plan validator's row-11 clauses
  "plan.composed_needs_note",
  "plan.note_needs_composed",
  "plan.storey_height",
  // the bake
  "bake.refuses_wide_camera",
  // the renderer
  "renderer.open_draws_no_wall",
  "renderer.aperture_needs_a_wall",
  "renderer.floor_clipped_to_room",
  "renderer.returns_grid",
  "renderer.corner_verticals"
];

/* ------------------------------------------------------------------ cases */

/** name -> a function returning the set of clause tokens it tripped. */
const DOCUMENT_CASES = {
  "meta.required_fields": () => tokensFromMetas((m) => { delete m["study/N"].key_tint; }),
  "meta.facing_type": () => tokensFromMetas((m) => { m["study/N"].facing_type = "outdoors"; }),
  "meta.camera_pairing": () => tokensFromMetas((m) => { m["study/N"].camera_far_m = 9; }),
  "meta.corner_pairing": () => tokensFromMetas((m) => {
    const t = m["study/N"].corner_x0_px;
    m["study/N"].corner_x0_px = m["study/N"].corner_x1_px;
    m["study/N"].corner_x1_px = t;
  }),
  "meta.open_no_corners": () => tokensFromMetas((m) => {
    // an open facing that kept its corners: law (b)'s invented enclosure
    m["study/N"].facing_type = "open";
    m["study/N"].camera_far_m = m["study/N"].camera_wall_m;
    delete m["study/N"].camera_wall_m;
  }),
  "meta.segmented_no_corners": () => tokensFromMetas((m) => {
    m["study/N"].wall_continuous = false;
    m["study/N"].wall_segments = [{ from_m: 0, to_m: 2, kind: "wall" }];
  }),
  "meta.segments_present": () => tokensFromMetas((m) => {
    m["study/N"].wall_continuous = false;
    m["study/N"].wall_segments = [];
    m["study/N"].corner_x0_px = null;
    m["study/N"].corner_x1_px = null;
  }),
  "meta.null_type_no_corners": () => tokensFromMetas((m) => { m["study/N"].facing_type = null; }),
  "meta.frame_fits": () => tokensFromMetas((m) => { m["study/N"].corner_x1_px = 1600; }),
  "meta.image_h": () => tokensFromMetas((m) => { m["study/N"].image_h_px = 900; }),
  "meta.unknown_key": () => tokensFromMetas((m) => { m["study/N"].floor_line = 0.63; }),
  "meta.storey_height": () => tokensFromMetas((m) => { m["study/N"].storey_height_m = 0.4; }),
  "meta.segments_sane": () => tokensFromMetas((m) => {
    m["study/N"].wall_continuous = false;
    m["study/N"].corner_x0_px = null;
    m["study/N"].corner_x1_px = null;
    m["study/N"].wall_segments = [{ from_m: 0, to_m: 99, kind: "wall" }];
  }),

  "staging.outside_room": () => {
    const staging = clone(JSON.parse(readFileSync(join(FIXTURE_DIR, "staging.json"), "utf8")));
    return tokensOf(validateWithStaging((s) => { s.placements.chair1.u = 0.98; }, staging));
  },
  "staging.wall_mounted_on_open": () => tokensFromMetas((m) => {
    // the study's east wall becomes a horizon; door1 still hangs on it
    const o = deriveMeta(PLAN, "entrance_court", "S");
    m["study/E"] = { ...o, wall_width_m: m["study/E"].wall_width_m };
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
    p.objects.find((o) => o.id === "desk1").note = "a reason for a value nobody chose";
    return tokensOf(validatePlan(p));
  },
  "plan.storey_height": () => {
    const p = clone(PLAN);
    p.floors.find((f) => f.id === "ground").storey_height_m = 0.4;
    return tokensOf(validatePlan(p));
  }
};

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
    test(`red on ${name} alone`, () => {
      const tripped = DOCUMENT_CASES[name]();
      expect(tripped.has(name), `${name} did not fire — tripped ${[...tripped].join(", ") || "nothing"}`).toBe(true);
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
  test("red on bake.refuses_wide_camera alone", () => {
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
  test("red on renderer.open_draws_no_wall alone", async ({ page }) => {
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

  test("red on renderer.aperture_needs_a_wall alone", async ({ page }) => {
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

  test("red on renderer.floor_clipped_to_room alone", async ({ page }) => {
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

  test("red on renderer.returns_grid alone", async ({ page }) => {
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

  test("red on renderer.corner_verticals alone", async ({ page }) => {
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
});

/* ------------------------------------------------------------- measurements */

/** Wall verticals drawn when an `open` meta is handed to a facing. */
async function bandCounts(page, root) {
  await page.goto(appUrl(root));
  await page.waitForFunction(() => !!window.HOLO_APP);
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

/** Apertures returned for study/E when its meta says there is no wall. */
async function apertureCountOnOpenMeta(page, root) {
  await page.goto(appUrl(root));
  await page.waitForFunction(() => !!window.HOLO_APP);
  return await page.evaluate((meta) => {
    const A = window.HOLO_APP, fx = window.HOLO_FIXTURE;
    const vs = { location: "study", facing: "E" };
    return window.HOLO.renderer.apertures(fx.world, fx.staging, A.library, meta, vs).length;
  }, OPEN_META_FOR_STUDY_E);
}

/** Lit pixels inside a return's own region — the side wall's ink. */
async function returnRegionInk(page, root, vs) {
  await page.goto(appUrl(root));
  await page.waitForFunction(() => !!window.HOLO_APP);
  return await page.evaluate((vs) => {
    const T = window.__T;
    const c = T.renderDirect(vs, null, { backdrop_only: true });
    const meta = T.metaOf(vs);
    const d = c.getContext("2d").getImageData(0, 0, 1536, 1024).data;
    // Left of the left corner, above the floor line: the return, and nothing
    // else. Count pixels brighter than the return's own flat base.
    const cL = Math.floor(meta.corner_x0_px) - 4;
    const floorY = Math.floor(meta.floor_line_y * meta.image_h_px);
    let base = 255, n = 0;
    for (let y = 60; y < floorY; y += 2) {
      for (let x = 4; x < cL; x += 2) {
        const v = d[(y * 1536 + x) * 4];
        if (v < base) base = v;
      }
    }
    for (let y = 60; y < 1000; y += 2) {
      for (let x = 4; x < cL; x += 2) {
        if (d[(y * 1536 + x) * 4] > base + 8) n++;
      }
    }
    return n;
  }, vs);
}

/** How strongly a vertical stands at the left corner of study/S. */
async function cornerStrength(page, root) {
  await page.goto(appUrl(root));
  await page.waitForFunction(() => !!window.HOLO_APP);
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

/* An `open` meta whose continuity fields would grow a full band if the type
 * were not read — which is what makes the open branch's deletion visible. */
const OPEN_META_WITH_CONTINUOUS_FIELDS = (() => {
  const m = deriveMeta(PLAN, "entrance_court", "S");
  return { ...m, wall_continuous: true, wall_segments: [{ from_m: 0, to_m: m.wall_width_m, kind: "wall" }] };
})();

/* The same, sized for the study's east wall, so the door's own placement lands
 * inside the frame and the only question is whether a doorway is painted. */
const OPEN_META_FOR_STUDY_E = (() => {
  const wall = deriveMeta(PLAN, "study", "E");
  const open = deriveMeta(PLAN, "entrance_court", "S");
  return {
    ...wall,
    facing_type: "open",
    camera_far_m: wall.camera_wall_m,
    camera_wall_m: undefined,
    backdrop: open.backdrop,
    wall_continuous: false,
    wall_segments: [],
    corner_x0_px: null,
    corner_x1_px: null
  };
})();

/* --------------------------------------------------------------- the ledger */

test("the ledger is complete: every declared mechanism has a case, and every case a mechanism", () => {
  /* The structural half. Six mechanisms shipped unguarded at row 11's first
   * artifact pass, and the reason none of them showed up is that nothing was
   * counting. A mechanism added to MECHANISMS without a case here is an
   * absence; a case whose mechanism is not declared is a name nobody owns. */
  const cased = new Set([
    ...Object.keys(DOCUMENT_CASES),
    "bake.refuses_wide_camera",
    "renderer.open_draws_no_wall",
    "renderer.aperture_needs_a_wall",
    "renderer.floor_clipped_to_room",
    "renderer.returns_grid",
    "renderer.corner_verticals"
  ]);
  const declared = new Set(MECHANISMS);
  expect([...declared].filter((n) => !cased.has(n)), "declared with no case").toEqual([]);
  expect([...cased].filter((n) => !declared.has(n)), "cased but not declared").toEqual([]);
});
