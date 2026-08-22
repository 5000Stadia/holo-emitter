/* plan.spec.mjs — row 12: the plan document, its validator, the projection,
 * and the derived render.
 *
 * Pure-Node specs in the Playwright runner, like fixtures.spec and
 * validator.spec. Nothing here opens a page: the plan is a document, and the
 * only pixels in this row are the schematic's, which is compared byte for
 * byte rather than looked at.
 *
 * The derived-render cases need `python3` on PATH. They FAIL rather than skip
 * when it is missing: the byte-identity of the derived render against the
 * drawing Kabe approved is this row's acceptance, and an acceptance that
 * quietly opts out on some machines is not one.
 */
import { test, expect, repoRoot, bake, LIT } from "./helpers.mjs";
import { readFileSync, writeFileSync, cpSync, mkdirSync, mkdtempSync, rmSync, existsSync, statSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  validatePlan, planWarnings, drawn, ruleStandpoint, measuredDistance,
  facingOfOpening, FACINGS, standpointFor, wallFitsFrame, standpointObstructions
} from "../../tools/validate-plan.mjs";
import {
  deriveMeta, projectPlacement, projectEntity, stagingDivergence,
  inverseProjectPlacement, metaForFacing, facingsContaining, report, rebuildFacings,
  RULED_EYE_M, INTERIM_EYE_M, assertRuledEye,
  wallRelief, wallReliefReport,
  assertCameraConsistent, assertRuledLens, wallInFrame, horizonGate,
  GRID_CAMERA, CONTRACT_CAMERA, KNOWN_DIVERGENCES, STAGING_TOLERANCE,
  facingCarriers, cameraFeetReport, WALL_MAP_11, CANVAS_W, FOCAL_PX, FOCAL_MM,
  DRAWING_EYE_M
} from "../../tools/plan-projection.mjs";

const require = createRequire(import.meta.url);
const fixtureDir = join(repoRoot, "fixtures", "demo-study");
const draftDir = join(repoRoot, "design", "plan-draft");

const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const PLAN = readJson(join(fixtureDir, "plan.json"));
const WORLD = readJson(join(fixtureDir, "world.json"));
const STAGING = readJson(join(fixtureDir, "staging.json"));
const RECORDS = require(join(repoRoot, "src", "placeholders.js")).records;
/* Entity id -> §6 record, resolved the way the renderer resolves it. */
const BY_ENTITY = {};
for (const e of WORLD.entities) if (RECORDS[e.sprite]) BY_ENTITY[e.id] = RECORDS[e.sprite];

const clone = (o) => JSON.parse(JSON.stringify(o));
const room = (p, id) => p.rooms.find((r) => r.id === id);
const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");
/* THE HEADER BAND, found in the sheet rather than named by a class.
 *
 * `draw_plan.py` marks the rule under the title `sheet-chrome`, and the first
 * version of this normalisation stripped elements carrying that class. That
 * made the comparison ASYMMETRIC: the approved blob in git predates the class,
 * so the rule survived normalisation on one side and vanished on the other,
 * and four cases reported that Kabe's approved geometry had moved when nothing
 * drawn had moved at all — the stamp had merely taken a second line and pushed
 * the rule down with it. A normalisation only one side of a comparison can
 * satisfy is not a normalisation, and a marker introduced on one side of a
 * frozen comparison can never be one.
 *
 * So the band is read off whichever sheet is in front of us: the full-width
 * horizontal rule under the title, wherever it sits. That rule and the title,
 * subtitle and provenance stamp above it are the sheet's chrome. Nothing the
 * plan draws can reach there — `draw_plan.py` starts the map below the rule
 * and `fit_check` refuses a plan that does not fit under it — so excluding the
 * band cannot hide a wall, and "the geometry hash moves when a room moves"
 * below is what proves the exclusion is not vacuous. */
const headerRule = (svgText) => {
  const m = /<line x1="40\.00" y1="([\d.]+)" x2="1480\.00" y2="\1"[^>]*\/>/.exec(svgText);
  if (!m) throw new Error("the sheet prints no header rule, so its chrome band cannot be found");
  return { el: m[0], y: Number(m[1]) };
};

/* The provenance stamp's own lines, however many it wraps to: the header-band
 * texts drawn in the stamp's colour above the rule. Read as a set, so a stamp
 * that grows a line is still one stamp to every reader below. */
const stampLines = (svgText) => {
  const ruleY = headerRule(svgText).y;
  return (svgText.match(/<text[^>]*>[\s\S]*?<\/text>/g) || []).filter((el) => {
    const m = /<text x="40\.00" y="([\d.]+)"[^>]*fill="#6b6257"/.exec(el);
    return m && Number(m[1]) < ruleY;
  });
};

const stampText = (svgText) => stampLines(svgText)
  .map((el) => el.replace(/<[^>]*>/g, "")).join(" ")
  .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

const geometryOnly = (svgText) =>
  svgText.replace(/<text[^>]*>[\s\S]*?<\/text>/g, "")
    .split(headerRule(svgText).el).join("");

function python(args, cwd) {
  try {
    return execFileSync("python3", args, { encoding: "utf8", cwd });
  } catch (e) {
    /* execFileSync's message is "Command failed: python3 …" and nothing else;
     * the reason the script refused is on ITS stderr, which is exactly what a
     * reader of a red test needs. */
    const err = new Error(`python3 ${args.join(" ")} failed (status ${e.status}):\n` +
      `${e.stderr ? e.stderr.toString() : "(no stderr)"}\n--- stdout ---\n` +
      `${e.stdout ? e.stdout.toString() : "(no stdout)"}`);
    err.cause = e;
    throw err;
  }
}

/**
 * ONE redline, read out of the document rather than typed.
 *
 * Both the rebuild test and the geometry-hash test need "a plausible hand
 * redline that still tiles". Naming rooms and coordinates made those tests
 * collide with any real redline touching the same wall — the round-4 critic
 * drove a library/garden-room redline through the suite and two tests failed
 * for that reason rather than for their own. This finds the FIRST interior
 * party wall whose two rooms exactly span it (deterministic over the committed
 * array order, and nothing about it is a literal), and slides that wall by
 * `delta`, carrying the two rooms, the band, and anything sitting in the band.
 *
 * Facing blocks are left stale on purpose: making them true again is
 * `rebuildFacings`, which is what one of the callers is testing.
 */
function shiftPartyWall(p, delta) {
  const EPSm = 1e-9;
  const inside = (r, b) => r.x0 >= b.x0 - EPSm && r.x1 <= b.x1 + EPSm &&
    r.y0 >= b.y0 - EPSm && r.y1 <= b.y1 + EPSm;
  for (const band of p.wall_bands) {
    if (band.kind !== "partition" || band.floors.length !== 1) continue;
    const floor = band.floors[0];
    const flat = band.rect.x1 - band.rect.x0 > band.rect.y1 - band.rect.y0 ? "y" : "x";
    const span = flat === "y" ? "x" : "y";
    const rooms = p.rooms.filter((r) => r.floor === floor);
    const spans = (r) => Math.abs(r.rect[span + "0"] - band.rect[span + "0"]) < EPSm &&
      Math.abs(r.rect[span + "1"] - band.rect[span + "1"]) < EPSm;
    const lo = rooms.find((r) => spans(r) && Math.abs(r.rect[flat + "1"] - band.rect[flat + "0"]) < EPSm);
    const hi = rooms.find((r) => spans(r) && Math.abs(r.rect[flat + "0"] - band.rect[flat + "1"]) < EPSm);
    if (!lo || !hi) continue;
    /* Do not shrink a room past anything standing in it. */
    const shrinking = delta > 0 ? hi : lo;
    const occupants = [
      ...p.stairs.filter((x) => inside(x.rect, shrinking.rect)),
      ...(p.objects || []).filter((x) => inside(x.footprint, shrinking.rect)),
      ...(p.fireplaces || []).filter((x) => x.floor === floor && inside(x.rect, shrinking.rect))
    ];
    if (occupants.length) continue;
    const carried = [
      ...p.openings.filter((o) => o.floor === floor && inside(o.rect, band.rect)),
      ...(p.windows || []).filter((w) => w.floor === floor && inside(w.rect, band.rect)),
      ...(p.fireplaces || []).filter((f) => f.floor === floor && inside(f.rect, band.rect))
    ];
    lo.rect[flat + "1"] += delta;
    hi.rect[flat + "0"] += delta;
    band.rect[flat + "0"] += delta;
    band.rect[flat + "1"] += delta;
    for (const c of carried) {
      const r = c.rect || c.footprint;
      r[flat + "0"] += delta;
      r[flat + "1"] += delta;
    }
    return { band: band.id, grew: lo.id, shrank: hi.id, axis: flat, delta };
  }
  throw new Error("shiftPartyWall: the plan has no interior party wall two rooms exactly span");
}

/* A scratch copy of everything the derived render touches, so a test can run
 * the real script — validator call and all — without writing into the repo. */
function stagePlanTree() {
  const dir = mkdtempSync(join(tmpdir(), "holo-plan-"));
  mkdirSync(join(dir, "design"));
  for (const p of ["src", "tools", "fixtures"]) cpSync(join(repoRoot, p), join(dir, p), { recursive: true });
  /* [Row 21] The promoted metas are a bake input — the meta resolution's first
     tier — so a tree without them bakes a different fixture.js from the
     committed one, and the "untouched by any of it" case would fail for a
     reason that has nothing to do with the plan. `source/` is the asset seat's
     20 MB lane and is not copied. */
  cpSync(join(repoRoot, "backdrops"), join(dir, "backdrops"), {
    recursive: true,
    filter: (src) => !src.split(/[\\/]/).includes("source")
  });
  cpSync(draftDir, join(dir, "design", "plan-draft"), { recursive: true });
  /* Row 11: the bake reads blueprint §10's ruled eye height out of the
     orientation contract, so it is a bake input. */
  mkdirSync(join(dir, "replicator"), { recursive: true });
  cpSync(join(repoRoot, "replicator", "contract.json"), join(dir, "replicator", "contract.json"));
  return dir;
}

/* ------------------------------------------------------------------ shape */

test.describe("plan.json", () => {
  test("is a versioned schema instance the validator passes", () => {
    expect(PLAN.schema).toBe("holo-emitter-plan/0.1");
    expect(Number.isInteger(PLAN.version) && PLAN.version >= 1).toBe(true);
    expect(PLAN.units).toBe("m");
    expect(validatePlan(PLAN, WORLD, BY_ENTITY)).toEqual([]);
  });

  /* The per-facing block is a pure function of the room rects and the
   * stand-back rule, so a redline that moves a wall can regenerate it instead
   * of restating four facings by hand. On the committed plan the rebuild is a
   * byte no-op, which is what makes the README's redline recipe true. */
  test("rebuilding every facing from the room rects is a byte no-op", () => {
    const rebuilt = JSON.stringify(rebuildFacings(PLAN), null, 2) + "\n";
    expect(rebuilt).toBe(readFileSync(join(fixtureDir, "plan.json"), "utf8"));
  });

  test("and the rebuild repairs a hand-moved wall", () => {
    const p = clone(PLAN);
    const moved = shiftPartyWall(p, 0.4);
    expect(moved.axis).toMatch(/^[xy]$/);
    // stale facing values: the validator says so
    expect(validatePlan(p, WORLD, BY_ENTITY).length, `moved ${moved.band}`).toBeGreaterThan(0);
    // and the rebuild fixes exactly them
    expect(validatePlan(rebuildFacings(p), WORLD, BY_ENTITY), `moved ${moved.band}`).toEqual([]);
  });

  test("a drawn standpoint survives a rebuild; only its measurement is refreshed", () => {
    const p = clone(PLAN);
    const fc = p.rooms.find((r) => r.id === "great_hall").facings.N;
    fc.standpoint_source = "drawn";
    fc.standpoint = { x: 12.0, y: 10.5 };
    fc.camera_wall_m = 1.0;                                  // stale
    const out = rebuildFacings(p);
    const back = out.rooms.find((r) => r.id === "great_hall").facings.N;
    expect(back.standpoint).toEqual({ x: 12.0, y: 10.5 });   // not moved
    expect(back.camera_wall_m).toBe(drawn(18.9 - 10.5));     // measured afresh
  });

  test("the CLI agrees with the imported function", () => {
    const out = execFileSync("node", [join(repoRoot, "tools", "validate-plan.mjs")], { encoding: "utf8" });
    expect(out).toMatch(/valid/);
  });

  test("holds the whole manor: two floors, twenty-two spaces, the study and the hall among them", () => {
    expect(PLAN.floors.map((f) => f.id).sort()).toEqual(["ground", "upper"]);
    expect(PLAN.rooms.length).toBe(22);
    expect(PLAN.rooms.filter((r) => r.floor === "ground").length).toBe(14);
    expect(PLAN.rooms.filter((r) => r.floor === "upper").length).toBe(8);
    expect(PLAN.rooms.filter((r) => r.type === "open").map((r) => r.id).sort())
      .toEqual(["entrance_approach", "entrance_court", "privy_garden"]);
    expect(PLAN.stairs.length).toBe(2);
    // Every world location is a plan room — the study and the hall are sited.
    for (const loc of WORLD.locations) expect(room(PLAN, loc.id), loc.id).toBeTruthy();
    expect(room(PLAN, "study").name).toBe("STUDY");
    expect(room(PLAN, "hall").name).toBe("CROSS PASSAGE");
  });

  test("the true-but-unfixable facts are reported as warnings, not hidden and not blocking", () => {
    /* Two, not three, since row 11. `desk1` standing in the study's chimney
     * breast was the third, and it was never in this class: a warning is for
     * something a human approved and an agent may not change, and furniture an
     * agent inverse-projected is not that. It is a hard clause now
     * (`plan.object_clear_of_carriers`, exercised in the ledger) and the desk
     * has moved out of the hearth. */
    const w = planWarnings(PLAN, BY_ENTITY).join("\n");
    expect(w).not.toMatch(/chimney breast/);
    expect(w).toMatch(/entrance_approach.*facing N.*no wall across it/);
    expect(w).toMatch(/hearth in "kitchen" has no stack/);
    // and they are warnings: the plan still validates.
    expect(validatePlan(PLAN, WORLD, BY_ENTITY)).toEqual([]);
  });
});

/* -------------------------------------------------- the validator's teeth */

/* Every check, broken one at a time. A check that stays green when what it
 * guards is deleted is a finding — this row's version of the rule row 2 paid
 * for twice. */
const MUTATIONS = [
  /* Anchored to the room–room message and produced by a mutation that touches
   * no wall band: growing a room into a partition trips the tiling check too,
   * and a `/overlap/i` pattern then passed with the room–room check deleted. */
  ["overlap", /^overlap: /m,
    (p) => { room(p, "muniment_room").rect = { ...room(p, "back_stair_head").rect }; }],
  ["tiling", /tiling/i, (p) => { room(p, "library").rect.x1 = 9.0; }],
  ["a room standing inside a wall", /overlaps wall band/i, (p) => { room(p, "kitchen").rect.x0 = 30.5; }],
  ["door joins the rooms it names", /geometrically lies between/i,
    (p) => { p.openings.find((o) => o.entity === "door1").joins = ["study", "kitchen"]; }],
  ["door joins a room that exists", /is not a room/i,
    (p) => { p.openings.find((o) => o.entity === "door1").joins = ["study", "wine_cellar"]; }],
  ["a door is a hole in a wall", /not inside any wall band/i,
    (p) => { const o = p.openings.find((x) => x.entity === "door1"); o.rect.x0 = 28.0; o.rect.x1 = 28.6; }],
  ["reachability", /cannot be walked to/i,
    (p) => { p.openings = p.openings.filter((o) => o.entity !== "door1"); }],
  ["reachability through the stairs", /cannot be walked to/i, (p) => { p.stairs = []; }],
  ["camera_wall_m is measured, not typed", /camera_wall_m .* is not the measured/i,
    (p) => { room(p, "study").facings.N.camera_wall_m = 3.5; }],
  ["the standpoint is where the rule puts it", /is not the "rule" one|is not the "threshold" one/i,
    (p) => { room(p, "study").facings.N.standpoint.x += 0.4; }],
  ["wall_width_m is the wall in view", /wall_width_m .* is not the drawn width/i,
    (p) => { room(p, "study").facings.N.wall_width_m = 4.2; }],
  ["an open facing carries its far line", /must carry the far_line/i,
    (p) => { delete room(p, "entrance_court").facings.S.far_line; }],
  ["a walled facing carries no far line", /must not carry a far_line/i,
    (p) => { room(p, "study").facings.N.far_line = 20.0; }],
  ["law (b): an open facing whose ground runs past a real wall", /law \(b\).*built structure stands in that view/i,
    (p) => { const f = room(p, "privy_garden").facings.N; f.type = "open"; f.far_line = 26.0; f.wall_line = 26.0; }],
  ["law (b): an open facing whose far line IS a built wall", /law \(b\).*stands on the very line/i,
    (p) => { const f = room(p, "privy_garden").facings.N; f.type = "open"; f.far_line = f.wall_line; }],
  ["law (b): a claimed wall must actually stand", /law \(b\).*no wall band stands on the line it views/i,
    (p) => { p.wall_bands = p.wall_bands.filter((b) => b.kind !== "garden"); }],
  /* The round-4 critic's two demonstrations, now that law (b) runs on every
   * facing rather than only on outdoor rooms. Before the fix both of these
   * returned NO findings: an interior facing could claim a vista straight
   * through the manor's north range, and two rooms could meet with no wall
   * between them and both still claim one. */
  ["law (b): an INTERIOR facing may not claim open ground through the building",
    /law \(b\).*built structure stands in that view/i,
    (p) => {
      const f = room(p, "study").facings.N;
      f.type = "open";
      f.far_line = 30.0;
      f.wall_line = 30.0;
      delete f.camera_wall_m;
      f.camera_far_m = drawn(measuredDistance(f.standpoint, "N", 30.0));
    }],
  ["law (b): two interior rooms may not meet with no wall between them",
    /law \(b\).*no wall band stands on the line it views/i,
    (p) => {
      /* Delete a party wall and grow both rooms to meet in the middle of it,
       * so the floor still tiles by area and only the wall is missing. */
      const band = p.wall_bands.find((b) => b.kind === "partition" && b.floors.length === 1);
      const flat = band.rect.x1 - band.rect.x0 > band.rect.y1 - band.rect.y0 ? "y" : "x";
      const mid = (band.rect[flat + "0"] + band.rect[flat + "1"]) / 2;
      for (const r of p.rooms.filter((r) => r.floor === band.floors[0])) {
        if (Math.abs(r.rect[flat + "1"] - band.rect[flat + "0"]) < 1e-9) r.rect[flat + "1"] = mid;
        if (Math.abs(r.rect[flat + "0"] - band.rect[flat + "1"]) < 1e-9) r.rect[flat + "0"] = mid;
      }
      p.wall_bands = p.wall_bands.filter((b) => b !== band);
      /* Restate the facings the two grown rooms now have, so the ONLY thing
       * left wrong with this plan is the wall that is not there. Without it
       * the stale standpoints bury the finding under thirty of their own. */
      Object.assign(p, rebuildFacings(p));
    }],
  ["law (b): an open facing's far line may not fall inside the manor outline",
    /law \(b\).*falls INSIDE the manor outline/i,
    (p) => {
      /* A far line that stops INSIDE the study without crossing a band: the
       * strip test finds nothing to complain about, and only the outline can
       * say this ground is not open. */
      const f = room(p, "study").facings.S;
      f.type = "open";
      f.far_line = 11.0;
      f.wall_line = 11.0;
      delete f.camera_wall_m;
      f.camera_far_m = drawn(measuredDistance(f.standpoint, "S", 11.0));
    }],
  ["the outline and the wall bands agree", /outline: the edge/i,
    (p) => { p.outline[5][0] = 41.0; p.outline[6][0] = 41.0; }],
  ["a window is a hole in a wall", /not inside any wall band/i,
    (p) => { p.windows[0].rect = { x0: 26.0, x1: 27.0, y0: 11.0, y1: 11.2 }; }],
  ["a fireplace stands in one room", /lies inside 0 rooms/i,
    (p) => { p.fireplaces[0].rect = { x0: 26.6, x1: 28.8, y0: 14.5, y1: 15.0 }; }],
  ["chimney stacks are continuous", /stands on nothing/i,
    (p) => { const f = p.fireplaces.find((x) => x.floor === "upper"); f.rect.x0 += 6; f.rect.x1 += 6; }],
  ["ids are unique", /duplicate id/i, (p) => { p.rooms[3].id = p.rooms[2].id; }],
  ["stairs are straight single flights", /not opposite/i, (p) => { p.stairs[0].down = "E"; }],
  ["a stair joins two floors", /same floor/i, (p) => { p.stairs[0].joins = ["great_stair_hall", "library"]; }],
  ["an object stands inside its room", /footprint is not inside room/i,
    (p) => { const o = p.objects.find((x) => x.id === "desk1"); o.footprint.x0 -= 4; o.footprint.x1 -= 4; }],
  ["an object's footprint is its record's size", /but its record says/i,
    (p) => { p.objects.find((x) => x.id === "desk1").footprint.x1 += 0.5; }],
  ["an object's provenance is machine-readable", /source .* is not one of/i,
    (p) => { p.objects[0].source = "somewhere"; }],
  ["the entrance exists", /"entrance" must name/i, (p) => { p.entrance = "the_moon"; }],
  ["the version stamp", /version must be a positive integer/i, (p) => { delete p.version; }],
  ["the room archetype vocabulary", /archetype .* is not one of/i,
    (p) => { room(p, "study").archetype = "snug"; }],
  ["a world fact smuggled into the plan", /is a world fact/i,
    (p) => { room(p, "study").states = ["closed", "open"]; }],
  ["an unknown key at the top level", /unknown key/i, (p) => { p.pixels = 1536; }],
  ["an unknown key on a facing", /unknown key/i, (p) => { room(p, "study").facings.N.corner_x0_px = 506.4; }],
  ["an object the plan and the world put in different rooms", /world.json puts it in/i,
    (p) => { p.objects.find((o) => o.id === "desk1").room = "hall"; }],
  ["a standpoint_source outside the vocabulary", /standpoint_source .* is not/i,
    (p) => { room(p, "study").facings.N.standpoint_source = "measured"; }],

  /* ------------------------------------------------------------------
   * The round-4 critic neutralised every `push(` site in the validator one
   * at a time and found roughly a quarter of them survived the whole suite —
   * including two fixes installed by the previous round and the entire
   * stairs-as-exits branch. The spec's own written rule is "every check,
   * broken one at a time; a check that stays green when what it guards is
   * deleted is a finding", so each of those now has a red case here.
   * ------------------------------------------------------------------ */

  ["the legend's wall thicknesses are the walls' own", /is .* m thick, but wall_thickness/i,
    (p) => { p.wall_thickness.partition = 0.4; }],
  ["a band kind the legend has no thickness for", /wall_thickness has no/i,
    (p) => { delete p.wall_thickness.garden; }],
  ["a walled facing must carry camera_wall_m, never camera_far_m",
    /must carry camera_wall_m, never camera_far_m/i,
    (p) => {
      const f = room(p, "study").facings.N;
      f.camera_far_m = f.camera_wall_m;
    }],
  ["an open facing must carry camera_far_m, never camera_wall_m",
    /must carry camera_far_m, never camera_wall_m/i,
    (p) => {
      const f = room(p, "entrance_court").facings.S;
      f.camera_wall_m = f.camera_far_m;
    }],
  ["the outline is a closed axis-aligned polygon", /outline is not a closed axis-aligned polygon/i,
    (p) => { p.outline = p.outline.map(([x, y], i) => (i === 3 ? [x + 0.7, y + 0.7] : [x, y])); }],
  ["the facing-type vocabulary", /type .* is not one of enclosed \| open \| corridor/i,
    (p) => { room(p, "study").facings.N.type = "walled"; }],
  ["wall_line is the line the facing actually views", /wall_line .* is not the line this facing views/i,
    (p) => { room(p, "study").facings.N.wall_line += 0.5; }],
  ["a facing with no standpoint at all", /no standpoint — law \(a\) marks every facing/i,
    (p) => { delete room(p, "study").facings.N.standpoint; }],
  ["a standpoint on or past the line it views", /is on or past the line it views/i,
    (p) => {
      const r = room(p, "study"), f = r.facings.N;
      f.standpoint_source = "drawn";
      f.standpoint = { x: f.standpoint.x, y: f.wall_line + 0.5 };
      f.camera_wall_m = drawn(measuredDistance(f.standpoint, "N", f.wall_line));
    }],
  ["an opening that abuts nothing", /does not lie between exactly two rooms/i,
    (p) => {
      const o = p.openings.find((x) => x.kind === "door");
      o.rect = { x0: o.rect.x0 + 0.03, x1: o.rect.x1 + 0.03, y0: o.rect.y0 + 0.03, y1: o.rect.y1 + 0.03 };
    }],
  ["a stair that is not a straight flight", /only "straight" obeys/i,
    (p) => { p.stairs[0].kind = "dog-leg"; }],
  ["a flight of an impossible number of treads", /a flight between two storeys is 10–30/i,
    (p) => { p.stairs[0].treads = 3; }],
  ["a flight that is not inside the rooms it joins", /its flight is not inside/i,
    (p) => { p.stairs[0].rect.x0 -= 1.5; }],
  ["a window nobody looks through", /no room on .* looks through it/i,
    (p) => {
      /* Still inside a wall band — the north exterior wall — but with no room
       * on either side of it, so it is a hole in a wall onto nothing. */
      const band = p.wall_bands.find((b) => b.kind === "exterior" && b.rect.y1 - b.rect.y0 < 1 && b.rect.y0 > 24);
      p.windows[0].rect = { x0: band.rect.x0 + 0.2, x1: band.rect.x0 + 1.2, y0: band.rect.y0, y1: band.rect.y1 };
    }],
  ["a fireplace whose named room is not the room it stands in", /says room .* but stands in/i,
    (p) => { p.fireplaces[0].room = "hall"; }],
  ["an attachment outside §4's vocabulary", /is not a §4 attachment token/i,
    (p) => { p.objects[0].attachment = "hovering"; }],
  ["an object footprint running into a wall", /footprint runs into wall band/i,
    (p) => { const o = p.objects.find((x) => x.id === "desk1"); o.footprint.y1 += 0.4; o.footprint.y0 += 0.4; }],
  ["an object floor that is not its room's floor", /is not the floor of room/i,
    (p) => { p.objects[0].floor = "upper"; }],
  ["an object whose room is not a room", /room .* is not a room/i,
    (p) => { p.objects[0].room = "the_cellar"; }],
  ["a duplicate floor id", /duplicate floor id/i,
    (p) => { p.floors.push({ id: "ground", level: 2 }); }],
  ["north is +y, because every facing derivation assumes it", /north must be "\+y"/i,
    (p) => { p.north = "-y"; }],
  ["the stand-back fraction stays inside (0, 0.5)", /standpoint_stand_back must be in/i,
    (p) => { p.standpoint_stand_back = 0.6; }],
  ["a units declaration that is not metres", /units must be "m"/i,
    (p) => { p.units = "px"; }],
  /* The three arrays the whitelist did not cover until the round-4 critic
   * pushed a sprite, a knowledge block and a `takeable` through them. */
  ["a world fact smuggled into a window", /is a world fact/i,
    (p) => { p.windows[0].states = ["shut", "open"]; }],
  ["a pixel smuggled into a window", /unknown key "u_px"/i,
    (p) => { p.windows[0].u_px = 512; }],
  ["a world fact smuggled into a fireplace", /is a world fact/i,
    (p) => { p.fireplaces[0].knowledge = { lit: false }; }],
  ["a world fact smuggled into a floor", /is a world fact/i,
    (p) => { p.floors[0].takeable = true; }],
  ["an unknown key on a fireplace", /unknown key "corner_x0_px"/i,
    (p) => { p.fireplaces[0].corner_x0_px = 3; }],
  /* Degenerate geometry. §4b item 2 makes this a document a solver emits, and
   * a zero-extent rect is what a solver produces when a span collapses. */
  ["a door with no clear width", /zero extent/i,
    (p) => { const o = p.openings.find((x) => x.kind === "door"); o.rect.y1 = o.rect.y0; }],
  ["a room with no extent", /zero extent/i,
    (p) => { room(p, "study").rect.x1 = room(p, "study").rect.x0; }],
  ["an open_edge collapsed to a point", /zero extent/i,
    (p) => { const o = p.openings.find((x) => x.kind === "open_edge"); o.rect.x1 = o.rect.x0; }],

  /* ------------------------------------------------------------------
   * Shape and vocabulary. These are the defensive branches — "not an
   * object", "not a declared floor", "not one of" — and they were the rest
   * of the round-4 survivor list. They matter more here than in most
   * validators, because §4b item 2 makes this a document a HOST emits: a
   * solver that gets a field wrong produces exactly these, and a guard with
   * no red case is a guard that can be deleted by a refactor and never
   * noticed. Verified by re-running the same neutralise-every-push battery
   * the critic used: 113 sites, 0 survivors.
   * ------------------------------------------------------------------ */
  ["the schema stamp", /schema is .* expected/i, (p) => { p.schema = "some-other-plan/9"; }],
  ["wall_thickness is an object keyed by band kind", /wall_thickness must be an object/i,
    (p) => { p.wall_thickness = 0.6; }],
  ["every named array is an array", /"windows" must be an array/i, (p) => { p.windows = {}; }],
  ["a floors entry that is not {id, level}", /floors entry is not/i, (p) => { p.floors.push("attic"); }],
  ["a named thing with no id", /has no id/i, (p) => { delete p.stairs[0].id; }],
  ["a rooms entry that is not an object", /rooms entry is not an object/i, (p) => { p.rooms.push("study"); }],
  ["a room on an undeclared floor", /floor "attic" is not a declared floor/i,
    (p) => { room(p, "study").floor = "attic"; }],
  ["the room-type vocabulary", /type "roofed" is not one of/i, (p) => { room(p, "study").type = "roofed"; }],
  ["a malformed room rect", /room "study": rect is malformed/i, (p) => { room(p, "study").rect = { x0: 1 }; }],
  ["a room with no name", /room "study": no name/i, (p) => { delete room(p, "study").name; }],
  ["a wall_bands entry that is not an object", /wall_bands entry is not an object/i,
    (p) => { p.wall_bands.push(3); }],
  ["the band-kind vocabulary", /kind "hedge" is not one of/i, (p) => { p.wall_bands[0].kind = "hedge"; }],
  ["a band on an undeclared floor", /floors must be declared floor ids/i,
    (p) => { p.wall_bands[0].floors = ["attic"]; }],
  ["a malformed band rect", /wall band .*: rect is malformed/i, (p) => { p.wall_bands[0].rect = {}; }],
  ["a room with no facings at all", /no facings/i, (p) => { delete room(p, "study").facings; }],
  ["a room missing one of its four facings", /facings must be exactly N, E, S, W/i,
    (p) => { delete room(p, "study").facings.N; }],
  ["a facing that is not an object", /facing N: not an object/i, (p) => { room(p, "study").facings.N = 3; }],
  ["an openings entry that is not an object", /openings entry is not an object/i, (p) => { p.openings.push(7); }],
  ["the opening-kind vocabulary", /kind "arch" is not one of/i, (p) => { p.openings[0].kind = "arch"; }],
  ["an opening on an undeclared floor", /opening .*: floor "attic"/i, (p) => { p.openings[0].floor = "attic"; }],
  ["an opening with no axis", /axis must be "EW" or "NS"/i, (p) => { p.openings[0].axis = "diagonal"; }],
  ["a malformed opening rect", /opening .*: rect is malformed/i, (p) => { p.openings[0].rect = { x0: 1, x1: 2 }; }],
  ["an opening that names one space", /joins must name exactly two spaces/i,
    (p) => { p.openings[0].joins = [p.openings[0].joins[0]]; }],
  ["an opening that joins a room to itself", /joins a room to itself/i,
    (p) => { p.openings[0].joins = [p.openings[0].joins[0], p.openings[0].joins[0]]; }],
  ["an opening whose entity is not a name", /entity must be a string/i, (p) => { p.openings[0].entity = 7; }],
  ["a stairs entry that is not an object", /stairs entry is not an object/i, (p) => { p.stairs.push("up"); }],
  ["a malformed stair rect", /stair .*: rect is malformed/i, (p) => { p.stairs[0].rect = { x0: 1 }; }],
  ["a stair that names one room", /joins must name two rooms/i, (p) => { p.stairs[0].joins = ["library"]; }],
  ["a stair travelling somewhere that is not a facing", /up and down must each be one of/i,
    (p) => { p.stairs[0].up = "NE"; }],
  ["a malformed window", /window 0 .*: malformed/i, (p) => { p.windows[0].rect = null; }],
  ["a malformed fireplace", /fireplace 0 .*: malformed/i, (p) => { p.fireplaces[0].floor = "attic"; }],
  ["an objects entry with no id", /objects entry is not an object with an id/i, (p) => { p.objects.push({}); }],
  ["a malformed object footprint", /footprint is malformed/i, (p) => { p.objects[0].footprint = { x0: 1 }; }],
  ["an object with no §6 record of its own", /no §6 record/i, (p) => { p.objects[0].id = "lectern1"; }]
];

/* World-side mutations. `crossCheckWorld` is the branch `design/architecture.md`
 * says row 15 would otherwise have been refused by, and until now nothing
 * broke a single arm of it. The demo world has no stair exit — the manor's
 * stairs are not walkable yet — so the stair arms are exercised against a
 * world that declares one, which is exactly the document row 15 will write. */
function withStairExit(over = {}) {
  const w = clone(WORLD);
  w.locations.push({
    id: "great_stair_hall",
    facings: ["N", "E", "S", "W"],
    exits: [{
      id: "up_the_great_stair", from: "great_stair_hall", to: "stair_landing",
      facing: "N", arrive_facing: "N", via: "great_stair", ...over
    }]
  });
  return w;
}

const WORLD_MUTATIONS = [
  ["a stair exit between two rooms the flight does not join",
    /but stair "great_stair" joins/i,
    () => withStairExit({ to: "library" })],
  ["a stair exit staged on a facing the flight does not travel",
    /but the "great_stair" flight travels N out of/i,
    () => withStairExit({ facing: "E", arrive_facing: "E" })],
  ["a stair exit that turns you round on the way up",
    /arrives facing S — blueprint §3/i,
    () => withStairExit({ arrive_facing: "S" })],
  ["an exit that travels via nothing the plan knows",
    /travels via "trapdoor", which is neither a plan opening's entity nor a stair/i,
    () => withStairExit({ via: "trapdoor" })],
  ["a door exit between two rooms the opening does not join",
    /but opening "op13" joins/i,
    () => {
      const w = clone(WORLD);
      w.locations.find((l) => l.id === "study").exits[0].to = "library";
      return w;
    }],
  ["a door exit that leaves a room the opening does not abut",
    /leaves "library", which does not abut opening/i,
    () => {
      const w = clone(WORLD);
      const e = w.locations.find((l) => l.id === "study").exits[0];
      e.from = "library"; e.to = "hall";
      return w;
    }],
  ["a door exit staged on the wrong wall", /sees "op13" on its E wall/i,
    () => {
      const w = clone(WORLD);
      const e = w.locations.find((l) => l.id === "study").exits[0];
      e.facing = "N"; e.arrive_facing = "N";
      return w;
    }],
  ["a door exit that turns you round on the way through",
    /arrives facing W — blueprint §3/i,
    () => {
      const w = clone(WORLD);
      w.locations.find((l) => l.id === "study").exits[0].arrive_facing = "W";
      return w;
    }],
  ["a location declaring a facing the plan room does not carry",
    /declares facing NE, which the plan room does not carry/i,
    () => {
      const w = clone(WORLD);
      w.locations.find((l) => l.id === "study").facings.push("NE");
      return w;
    }],
  ["a world with no locations at all", /no locations to cross-check/i,
    () => ({ schema: "holo-emitter-world/0.1" })]
];

test.describe("the plan validator goes red on every check it claims", () => {
  for (const [name, pattern, mutate] of MUTATIONS) {
    test(name, () => {
      const p = clone(PLAN);
      mutate(p);
      const findings = validatePlan(p, WORLD, BY_ENTITY);
      expect(findings.length, `${name}: nothing found`).toBeGreaterThan(0);
      expect(findings.join("\n"), `${name}: found something else`).toMatch(pattern);
    });
  }

  for (const [name, pattern, mutate] of WORLD_MUTATIONS) {
    test(`world cross-check — ${name}`, () => {
      const findings = validatePlan(clone(PLAN), mutate(), BY_ENTITY);
      expect(findings.length, `${name}: nothing found`).toBeGreaterThan(0);
      expect(findings.join("\n"), `${name}: found something else`).toMatch(pattern);
    });
  }

  /* The warning that says a check did not run. A warning nothing exercises is
   * a warning that can stop being computed.
   *
   * The three OBJECT warnings that used to live here — an object in a hearth,
   * two objects in each other, an object on a stair flight — are hard clauses
   * since row 11, with cases in `tests/playwright/guards.spec.mjs`. They were
   * warnings because row 12 could not tell "a human approved this and an agent
   * may not change it" from "an agent placed this badly", and the study's desk
   * spent two rows 91% inside its own fireplace as a result. */
  test("planWarnings still names the stack that stops, which nobody may fix", () => {
    const w = planWarnings(PLAN, BY_ENTITY, WORLD);
    expect(w.join("\n")).toMatch(/has no stack rising through "upper"/);
  });

  test("planWarnings enumerates the facings that show no room at all", () => {
    /* Row 20: two of the eight facings the demo draws are a wall in your face
       — the passage is 2.60 m deep, so at the ruled lens neither its corners
       nor its floor line nor its ceiling line is in frame, and the shipped
       depth bound refuses any placement on them at any depth. That is honest
       and it is a look consequence for Kabe, so it is enumerated rather than
       left to be found in a picture. A warning nothing exercises is a warning
       that can stop being computed. */
    const w = planWarnings(PLAN, BY_ENTITY, WORLD);
    const named = w.filter((x) => /shows no corner, no wall-floor line/.test(x));
    expect(named.length, named.join("\n")).toBe(2);
    expect(named.join("\n")).toMatch(/room "hall" facing N/);
    expect(named.join("\n")).toMatch(/room "hall" facing S/);
    /* And the study is not among them: all four of its facings show the room
       they are in, which is the whole of what row 20 bought. */
    expect(named.join("\n")).not.toMatch(/"study"/);
  });

  test("planWarnings says out loud when the footprint cross-check could not run", () => {
    // The plan-only case §4b item 2 describes: geometry with no world beside
    // it. That is valid, and weaker, and the weakening must be visible.
    expect(validatePlan(PLAN)).toEqual([]);
    expect(planWarnings(PLAN).join("\n")).toMatch(/were NOT cross-checked against their §6 dims/);
  });

  test("but a world WITH objects and no records is refused, not warned", () => {
    const findings = validatePlan(PLAN, WORLD, undefined);
    expect(findings.join("\n")).toMatch(/no §6 records were — the footprint↔dims cross-check/);
  });

  test("planWarnings names a world location the plan has not drawn", () => {
    const w = clone(WORLD);
    w.locations.push({ id: "gallery", facings: ["N"], exits: [] });
    expect(planWarnings(PLAN, BY_ENTITY, w).join("\n"))
      .toMatch(/world location "gallery" has no room in the plan/);
  });

  /* §4b item 9 rules several standpoints into the great hall and the long
   * gallery, so the schema keeps a standpoint the K rule did not place
   * expressible. The branch has no instance on this plan — every standpoint is
   * `rule` — so it is exercised here rather than left as a promise row 15
   * discovers is empty. */
  test("a `drawn` standpoint is accepted where the rule's would not be, and law (a) still binds it", () => {
    const p = clone(PLAN);
    const fc = room(p, "great_hall").facings.N;
    fc.standpoint_source = "drawn";
    fc.standpoint = { x: 12.0, y: 10.5 };            // near the hall's west end
    fc.camera_wall_m = drawn(measuredDistance(fc.standpoint, "N", fc.wall_line));
    expect(validatePlan(p, WORLD, BY_ENTITY)).toEqual([]);
    // and the measurement is still law: a typed distance is still refused
    fc.camera_wall_m = 6.97;
    expect(validatePlan(p, WORLD, BY_ENTITY).join("\n")).toMatch(/is not the measured/);
  });

  test("and the unmutated plan is green, so the battery above is not a tautology", () => {
    expect(validatePlan(clone(PLAN), WORLD, BY_ENTITY)).toEqual([]);
  });
});

test.describe("the plan is presentation-side, and says so by schema", () => {
  test("it holds no world fact and no pixel", () => {
    const text = readFileSync(join(fixtureDir, "plan.json"), "utf8");
    for (const k of ["\"states\"", "\"state\"", "\"knowledge\"", "\"relations\"", "\"takeable\"", "\"sprite\"", "canvas_w_px", "\"px\""]) {
      expect(text, `plan.json carries ${k}`).not.toContain(k);
    }
    // it names entities and rooms — references into truth, never copies of it
    expect(PLAN.openings.some((o) => o.entity === "door1")).toBe(true);
  });

  test("the canvas width is the consumer's parameter, not the document's", () => {
    /* The plan holds no pixel. Hand `deriveMeta` a different canvas and the
       wall's SPAN in pixels does not move — the lens and the standpoint fix
       that — while the wall's PLACE in the frame does, because the u-domain is
       centred on the canvas. Under the pinned scale this test had to use the
       deleted wide camera to say the same thing. */
    expect(CANVAS_W).toBe(1536);
    const a = deriveMeta(PLAN, "study", "N");
    const b = deriveMeta(PLAN, "study", "N", { canvasW: 3072 });
    expect(b.px_per_m_at_wall).toBe(a.px_per_m_at_wall);
    expect(b.corner_x1_px - b.corner_x0_px).toBeCloseTo(a.corner_x1_px - a.corner_x0_px, 9);
    expect(b.corner_x1_px - b.corner_x0_px).toBeCloseTo(5.45 * (1024 / 4.35), 9);
    expect(b.corner_x0_px).toBeCloseTo(3072 / 2 - 5.45 / 2 * (1024 / 4.35), 9);
  });

  test("every room carries §4b's production archetype, distinct from its facing geometry", () => {
    const pairs = PLAN.rooms.map((r) => `${r.type}/${r.archetype}`);
    // the two vocabularies are not the same vocabulary: a corridor-type room
    // may be a stair, and an enclosed room may be a hall
    expect(new Set(pairs).size).toBeGreaterThan(3);
    expect(room(PLAN, "back_stair").type).toBe("corridor");
    expect(room(PLAN, "back_stair").archetype).toBe("stair");
    expect(room(PLAN, "great_hall").type).toBe("enclosed");
    expect(room(PLAN, "great_hall").archetype).toBe("hall");
    expect(new Set(PLAN.rooms.map((r) => r.archetype)))
      .toEqual(new Set(["chamber", "hall", "corridor", "service", "stair", "open"]));
  });
});

/* --------------------------------------------------- the wall a facing carries */

test.describe("what each facing carries", () => {
  /* Blueprint §11's wall maps were prose until this row. They are checked
   * against the plan now, and the two that disagree are D4 — the drawing's own
   * open question — rather than a defect. */
  test("the two existing rooms agree with blueprint §11, except at D4", () => {
    const disagree = [];
    for (const [rid, f, expect_] of WALL_MAP_11) {
      const kinds = facingCarriers(PLAN, rid, f).map((c) => c.kind).sort().join(",");
      if (kinds !== [...expect_.kinds].sort().join(",")) disagree.push(`${rid}/${f}`);
    }
    expect(disagree).toEqual(["hall/N", "hall/S"]);
  });

  /* The viewed wall is not always one flat plane: a chimney breast stands
   * proud of it, and on study/N — §11's fireplace facing, and the first
   * backdrop row 4 generates — 2.20 m of the 5.45 m in view is half a metre
   * nearer than `camera_wall_m` says. Law (a) measures to the wall line and
   * the drawing prints that, so the number does not move; the relief is
   * reported beside it so a prompt sheet has it. */
  test("the relief on a viewed wall is reported, on the eleven facings that have it", () => {
    const report_ = wallReliefReport(PLAN);
    expect(report_.length).toBe(11);
    const studyN = wallRelief(PLAN, "study", "N");
    expect(studyN.length).toBe(1);
    expect(studyN[0].kind).toBe("fireplace");
    /* The hearth's near face is 3.10 m from the ROOM's north wall line and the
       standpoint is now 4.35 m from it, so the relief is 3.85 m ahead of the
       viewer and stands 0.50 m proud of the plane. The proud-by figure is a
       fact about the building; the depth moves with where you stand. */
    expect(studyN[0].depth_m).toBeCloseTo(3.85, 6);
    expect(studyN[0].proud_by_m).toBeCloseTo(0.5, 6);
    expect(studyN[0].on_axis).toBe(true);
    expect(room(PLAN, "study").facings.N.camera_wall_m).toBe(4.35);  // row 20's threshold standpoint
    // a hearth on another wall is an object in the view, not relief on the
    // plane — study/E's viewed wall is flat
    expect(wallRelief(PLAN, "study", "E")).toEqual([]);
    // and a hearth behind the standpoint is not relief either
    expect(wallRelief(PLAN, "study", "S")).toEqual([]);
  });

  test("study/N carries the fireplace, study/E the door, study/S two windows, study/W nothing", () => {
    expect(facingCarriers(PLAN, "study", "N").map((c) => c.kind)).toEqual(["fireplace"]);
    const door = facingCarriers(PLAN, "study", "E");
    expect(door.map((c) => c.kind)).toEqual(["door"]);
    expect(door[0].entity).toBe("door1");
    expect(door[0].u).toBeCloseTo(0.5 + 1.1 / 4.8, 6);   // the drawing's own position
    expect(facingCarriers(PLAN, "study", "S").map((c) => c.kind)).toEqual(["window", "window"]);
    expect(facingCarriers(PLAN, "study", "W")).toEqual([]);
  });

  test("a carrier's u is the same domain §4 staging uses", () => {
    /* The press moved to the passage's EAST end wall at row 20 — forced, not
       chosen: the passage is 2.60 m deep and its long facings show no floor at
       the ruled lens, so the shipped validator refuses any placement on them.
       The carrier it now shares a wall with is `hall/E`'s window, and they DO
       fight: a 1.00 m press cannot clear a 1.00 m window centred on a 2.60 m
       wall. That is recorded on the plan object and by `planWarnings`, and it
       is the prompt sheet's to resolve — this assertion is that the two live in
       ONE u-domain, which is what makes the collision computable at all. */
    const shelfU = projectPlacement(PLAN, "shelf1", "hall", "E", deriveMeta(PLAN, "hall", "E")).u;
    const window_ = facingCarriers(PLAN, "hall", "E")[0];
    expect(window_.kind).toBe("window");
    expect(Math.abs(window_.u - shelfU)).toBeLessThan(0.3);
  });
});

/* ------------------------------------------- the orientation law, geometric */

test.describe("plan ↔ world: the orientation law is geometry now, not prose", () => {
  test("green on the shipped pair", () => {
    expect(validatePlan(PLAN, WORLD, BY_ENTITY)).toEqual([]);
  });

  test("the hall really does lie east of the study", () => {
    const op = PLAN.openings.find((o) => o.entity === "door1");
    expect(op.joins.slice().sort()).toEqual(["hall", "study"]);
    expect(facingOfOpening(PLAN, op, "study")).toBe("E");
    expect(facingOfOpening(PLAN, op, "hall")).toBe("W");
  });

  test("a flipped arrive_facing is caught", () => {
    const w = clone(WORLD);
    w.locations[0].exits[0].arrive_facing = "W";
    expect(validatePlan(PLAN, w, BY_ENTITY).join("\n")).toMatch(/arrives facing W/);
  });

  test("an exit staged on the wrong wall is caught", () => {
    const w = clone(WORLD);
    w.locations[0].exits[0].facing = "N";
    w.locations[0].exits[0].arrive_facing = "N";
    expect(validatePlan(PLAN, w, BY_ENTITY).join("\n")).toMatch(/sees "op\d+" on its E wall/);
  });

  test("an exit whose via names no plan opening is caught", () => {
    const w = clone(WORLD);
    w.locations[0].exits[0].via = "trapdoor";
    expect(validatePlan(PLAN, w, BY_ENTITY).join("\n")).toMatch(/neither a plan opening's entity nor a stair/);
  });

  /* A location the plan has not drawn is a warning, not a finding: world.json
   * is the home of topology truth, the plan is presentation-side, and §4b's
   * materialization ladder has a conjured room arriving as grid before any
   * geometry exists for it. Its exits are outside what the plan can judge. */
  test("a location with no room on the plan is a warning, and its exits are not judged", () => {
    const w = clone(WORLD);
    w.locations.push({ id: "gallery", facings: ["N", "E", "S", "W"],
      exits: [{ id: "e", from: "gallery", facing: "N", to: "hall", arrive_facing: "S", via: "door2" }] });
    expect(validatePlan(PLAN, w, BY_ENTITY)).toEqual([]);
    expect(planWarnings(PLAN, BY_ENTITY, w).join("\n")).toMatch(/"gallery" has no room in the plan/);
  });

  /* The rule this replaced was a centre-to-centre bearing, and it is wrong on
   * this very plan: the cross passage's kitchen door lies south of it but
   * WEST of its centre. Row 15 grows world.json to the whole manor, so a rule
   * that happens to be right for the two M0 rooms is not good enough. */
  test("a door off the room's long axis still resolves to the wall it is in", () => {
    const kitchenDoor = PLAN.openings.find(
      (o) => o.floor === "ground" && o.joins.includes("kitchen") && o.joins.includes("hall"));
    expect(kitchenDoor, "the kitchen ↔ cross passage door").toBeTruthy();
    expect(facingOfOpening(PLAN, kitchenDoor, "hall")).toBe("S");
    const hall = room(PLAN, "hall").rect;
    const cx = (hall.x0 + hall.x1) / 2, cy = (hall.y0 + hall.y1) / 2;
    const dx = (kitchenDoor.rect.x0 + kitchenDoor.rect.x1) / 2 - cx;
    const dy = (kitchenDoor.rect.y0 + kitchenDoor.rect.y1) / 2 - cy;
    expect(Math.abs(dx) > Math.abs(dy),
      "a centre-to-centre bearing would call this door W, and it is S").toBe(true);
  });
});

/* ------------------------------------------------------------- the camera */

test.describe("the camera the projection runs on", () => {
  test("is a named constant the metas derive FROM, not one read out of the picture", () => {
    /* Row 12 derived the grid camera's eye height back out of GRID_META and
     * said in its own comment that this made deriveMeta's agreement with
     * GRID_META "an identity, not evidence". Row 11 turns the arrow round: the
     * eye height is a constant with a citation and the metas are derived FROM
     * it. Which constant is Kabe's [HUMAN 2026-08-21]; row 20 measured the
     * approved study/N backdrop's own camera and blueprint §5 makes that image
     * the authority, so the interim it was awaiting has arrived and shipped. */
    expect(GRID_CAMERA.eye_m).toBe(DRAWING_EYE_M);
    expect(DRAWING_EYE_M).toBe(1.08775);     // MEASURED off the approved study/N backdrop (row 20)
    expect(GRID_CAMERA.pitch_deg).toBe(0);   // §10's −8° is unmodelled, and absent from the approved image
    expect(INTERIM_EYE_M).toBe(DRAWING_EYE_M);
    expect(RULED_EYE_M).toBe(1.83);          // §10's generation camera, untouched
    expect(assertRuledEye()).toEqual([]);
    /* The provenance string names the numbers it claims, so it cannot go on
       describing a camera the object no longer carries — an artifact critic
       found it saying "eye 1.2316 m, horizon at y 490" beside fields reading
       1.08775 and 524.4, and a `/MEASURED/` match let it. */
    expect(GRID_CAMERA.source).toMatch(/MEASURED/);
    expect(GRID_CAMERA.source).toContain(String(GRID_CAMERA.eye_m));
    expect(GRID_CAMERA.source).toContain(String(Math.round(GRID_CAMERA.horizon_y * 1024 * 10) / 10));
  });

  /* THE SAME DEFECT ONE LAYER DOWN, and this is its third appearance in one
   * row. `GRID_META`'s block annotates every line with the number it evaluates
   * to — which is the only reason a reader can check the arithmetic by eye —
   * and those comments went on reading 1.2316, 490, 0.7864, 433.5823 and
   * 0.4785 for a whole commit after the measured camera landed. Nothing could
   * see it: a comment is not a field. So the comments are now READ AS CLAIMS.
   * The last number in each trailing comment is the value that line produces,
   * to whatever precision it is written at, and drift in either direction goes
   * red. Red-verified by editing one digit. */
  test("the GRID_META block's arithmetic comments are read as claims about the meta", () => {
    const src = readFileSync(join(repoRoot, "src", "renderer.js"), "utf8");
    const start = src.indexOf("var GRID_META = (function ()");
    expect(start).toBeGreaterThan(-1);
    const block = src.slice(start, src.indexOf("})();", start));
    const { GRID_META } = require(join(repoRoot, "src", "renderer.js"));
    const claims = [
      ["var cam = gp.CAMERA_WALL_M;", GRID_META.camera_wall_m],
      ["var px = gp.pxPerMAtWall(cam);", GRID_META.px_per_m_at_wall],
      ["var eye = gp.DRAWING_EYE_M;", DRAWING_EYE_M],
      ["var hy = gp.HORIZON_Y;", GRID_META.horizon_y],
      ["floor_line_y:", GRID_META.floor_line_y],
      ["px_per_m_at_bottom:", GRID_META.px_per_m_at_bottom],
      ["horizon_y: hy,", GRID_META.horizon_y]
    ];
    /* AND THE HEADER TABLE ONE BLOCK UP, which states the same five numbers in
       the paragraph a fresh session boards from. The first version of this
       test started reading at `var GRID_META`, so a round-5 critic set the
       header back to the PRE-ROW-20 camera — 96 px/m, floor_line_y 0.63,
       nearest floor 3.077 m — and the suite stayed green, while changing one
       digit a single line lower went red. The reader has to cover both
       statements or the block above it is a free space to be wrong in. */
    const header = src.slice(src.lastIndexOf("/*", start), start);
    const headerClaims = {
      px_per_m_at_wall: GRID_META.px_per_m_at_wall,
      horizon_y: GRID_META.horizon_y,
      floor_line_y: GRID_META.floor_line_y,
      px_per_m_at_bottom: GRID_META.px_per_m_at_bottom,
      "nearest visible floor": 1024 / GRID_META.px_per_m_at_bottom
    };
    /* THE FLOOR IS THE TABLE'S ARITY, NOT FOUR OF IT. `>= 4` against five
       claims left the table free to drop exactly one entry in silence, and the
       one it could drop is the pinned lens's own `px_per_m_at_wall`. And the
       row was found by `l.includes(name)`, an unanchored substring — the
       `floor_line_y  horizon_y + eye/4 = 0.784047` entry contains the string
       `horizon_y`, so a reordered table matched the wrong row and failed with
       a message naming a number that was never wrong. Each name anchors at the
       start of its own entry now, and every claim must be found. */
    const headerRows = header.split("\n").map((l) => l.replace(/^\s*\*?\s*/, ""));
    for (const [name, actual] of Object.entries(headerClaims)) {
      const rows = headerRows.filter((l) => l.startsWith(name) && l.includes("="));
      expect(rows.length,
        `the GRID_META header table states ${name} ${rows.length} times; a fresh session boards from this table and every number in it is bound`)
        .toBe(1);
      const row = rows[0];
      const claim = row.slice(row.lastIndexOf("=") + 1).trim().split(/\s+/)[0];
      const dp = (claim.split(".")[1] || "").length;
      expect(Math.abs(Number(claim) - actual),
        `the GRID_META header table says ${name} = ${claim}; it is ${actual}`)
        .toBeLessThanOrEqual(0.5 * Math.pow(10, -dp) + 1e-9);
    }

    for (const [needle, actual] of claims) {
      const line = block.split("\n").find((l) => l.includes(needle));
      expect(line, `${needle} is gone from the GRID_META block`).toBeTruthy();
      const comment = line.slice(line.indexOf("//") + 2);
      expect(line.includes("//"), `${needle} lost the comment that states its value`).toBe(true);
      const nums = comment.match(/-?\d+(?:\.\d+)?/g);
      expect(nums, `${needle}'s comment states no number`).toBeTruthy();
      const claim = nums[nums.length - 1];
      const dp = (claim.split(".")[1] || "").length;
      expect(Math.abs(Number(claim) - actual),
        `${needle} is annotated ${claim} and evaluates to ${actual}`)
        .toBeLessThanOrEqual(0.5 * Math.pow(10, -dp) + 1e-12);
    }
  });

  test("and the contract cross-check goes red when the two statements drift apart", () => {
    const tmp = mkdtempSync(join(tmpdir(), "holo-eye-"));
    try {
      const c = JSON.parse(readFileSync(join(repoRoot, "replicator", "contract.json"), "utf8"));
      c.camera.eye_height_m = 1.6;
      mkdirSync(join(tmp, "replicator"), { recursive: true });
      writeFileSync(join(tmp, "replicator", "contract.json"), JSON.stringify(c));
      expect(assertRuledEye(join(tmp, "replicator", "contract.json")).length).toBeGreaterThan(0);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  /* §5 states the floor twice and the two statements agree only for one
   * (floor_line_y, px_per_m_at_bottom) pair at a given eye height. Since row
   * 11 the eye height comes from OUTSIDE the meta, so this compares a meta
   * against a number it did not supply. */
  test("§5's horizon device and §5's scale lerp still agree in grid canonical meta", () => {
    expect(assertCameraConsistent()).toEqual([]);
  });

  test("and that check goes red when they stop agreeing", () => {
    const { GRID_META } = require(join(repoRoot, "src", "renderer.js"));
    expect(assertCameraConsistent({ ...GRID_META, px_per_m_at_bottom: 210 }).length).toBeGreaterThan(0);
    expect(assertCameraConsistent({ ...GRID_META, horizon_y: 0.30 }).length).toBeGreaterThan(0);
    expect(assertCameraConsistent({ ...GRID_META, floor_line_y: 0.6515625 }).length).toBeGreaterThan(0);
    // and at §10's generation eye height it fails too — which is what it
    // means for the check to read a term from outside the meta.
    expect(assertCameraConsistent(GRID_META, 1.83).length).toBeGreaterThan(0);
  });

  /* Blueprint §5's camera-has-feet gate carried 1.6 m until row 3 propagated
   * Kabe's six-foot ruling into it. Grid canonical was authored against 1.6
   * and, for row 12's whole life, failed the gate by 0.0016 while
   * heights.spec still implemented 1.6 and the suite stayed green — the
   * blueprint was red and nothing said so. What closes that is ONE height,
   * asserted where the pixels are: since [HUMAN 2026-08-21] the drawing camera
   * is the interim 1.60 m, the gate is asserted at it, and §10's 1.83 m — the
   * camera nothing here draws at — is the one that fails. The gate is a
   * check on a meta's self-consistency, so it can only ever hold at one. */
  test("§5's horizon gate passes at the MEASURED drawing height, and §10's generation camera fails on it", () => {
    const { GRID_META } = require(join(repoRoot, "src", "renderer.js"));
    const at16 = horizonGate(GRID_META, DRAWING_EYE_M);
    expect(at16.passes).toBe(true);
    expect(at16.residual).toBeCloseTo(0, 12);
    const at183 = horizonGate(GRID_META, 1.83);
    expect(at183.passes).toBe(false);
    expect(at183.residual).toBeCloseTo(
      Math.abs(GRID_META.horizon_y - (GRID_META.floor_line_y - 1.83 * GRID_META.px_per_m_at_wall / 1024)), 9);
    for (const key of ["study/N", "study/E", "hall/N", "hall/E"]) {
      const [loc, f] = key.split("/");
      const g = horizonGate(deriveMeta(PLAN, loc, f), DRAWING_EYE_M);
      expect(g.passes, `${key} at the drawing eye height`).toBe(true);
    }
  });

  /* THE SAME ARITHMETIC, INVERTED BY ROW 20, and that inversion is the row.
   * Under the pinned SCALE the implied focal length ran 187 px to 2014 px — a
   * factor of eleven, a 4 mm fisheye to a 47 mm normal — and `floor_line_y`
   * came out IDENTICAL on every facing whatever the room's size, which is the
   * arithmetic behind "every direction is a corridor". Under the pinned LENS
   * it is the other way round: one focal length everywhere, and a floor line
   * that moves with how far away the wall is, because that is what a floor
   * line does. */
  test("pinning the lens makes the focal length one number and the floor line a per-facing one", () => {
    const feet = cameraFeetReport(PLAN);
    const focals = feet.rows.map((r) => r.focal_px);
    expect(Math.min(...focals)).toBeCloseTo(FOCAL_PX, 6);
    expect(Math.max(...focals)).toBeCloseTo(FOCAL_PX, 6);
    expect(deriveMeta(PLAN, "great_hall", "E").floor_line_y)
      .not.toBeCloseTo(deriveMeta(PLAN, "study", "N").floor_line_y, 3);
  });

  test("the frame-bottom floor cut is at the viewer's feet in the study and metres out elsewhere", () => {
    const feet = cameraFeetReport(PLAN);
    /* The cut the BROWSER DRAWS on the facing a human looks at first — the
       study's north view. Row 12 had to use the fallback meta's cut because
       the demo drew every facing at `groundplane.CAMERA_WALL_M`; row 11 gave
       the study its own derived meta, so the shipped cut and the derived one
       are the same number and the substitution the round-4 critic caught
       cannot recur. */
    const { GRID_META } = require(join(repoRoot, "src", "renderer.js"));
    const expected = FOCAL_PX / GRID_META.px_per_m_at_bottom;
    expect(feet.reference).toBeCloseTo(expected, 9);
    /* ONE NUMBER FOR THE WHOLE MANOR. Under the pinned scale this was fifteen
       anomalies running to 6.05 m; under a pinned lens the nearest visible
       floor is `f / px_per_m_at_bottom` and depends on the lens and the
       horizon alone — not on where you stand — so every facing has the same
       one and there is nothing left to be "over". */
    for (const r of feet.rows) expect(r.nearest_floor_m, r.room + "/" + r.facing).toBeCloseTo(expected, 9);
    expect(feet.over.length).toBe(0);
    expect(readFileSync(join(draftDir, "projection.md"), "utf8")).toMatch(/The camera has feet, and the lens is one lens/);
  });

  test("the two cameras differ in the height Kabe ruled interim and in the pitch nothing models", () => {
    /* §10's contract camera is the GENERATION camera and the grid camera is
     * the DRAWING one, and since [HUMAN 2026-08-21] they differ in both
     * terms on purpose: the interim eye height, because the six-foot ruling
     * without its pitch half moves the frame-bottom floor cut the wrong way;
     * and the pitch itself, which `groundplane.js` has no term for. Naming
     * both here keeps them measured quantities rather than silences —
     * §10's −8° would move the horizon down 49 px at the study's implied
     * focal length, the direction that would pull the floor cut back toward
     * the viewer's feet, which is exactly why the height waits for it. */
    expect(GRID_CAMERA.eye_m).toBe(INTERIM_EYE_M);
    expect(CONTRACT_CAMERA.eye_m).toBe(RULED_EYE_M);
    expect(CONTRACT_CAMERA.pitch_deg).toBe(-8);
    expect(GRID_CAMERA.pitch_deg).toBe(0);
    const a = deriveMeta(PLAN, "study", "N", { camera: GRID_CAMERA });
    const b = deriveMeta(PLAN, "study", "N", { camera: CONTRACT_CAMERA });
    // the eye height is modelled, so it moves the floor line; the pitch is
    // not, so nothing else about b differs.
    expect(b.floor_line_y).toBeGreaterThan(a.floor_line_y);
    expect(b.floor_line_y - a.floor_line_y)
      .toBeCloseTo((RULED_EYE_M - DRAWING_EYE_M) * a.px_per_m_at_wall / 1024, 12);
    expect(b.corner_x0_px).toBeCloseTo(a.corner_x0_px, 12); // pitch is unmodelled
    expect(deriveMeta(PLAN, "study", "N").camera_id).toBe("grid");
  });
});

/* -------------------------------------------------------- the meta geometry */

test.describe("derived meta geometry, by independent arithmetic", () => {
  /* Expected values written out here from the §5 literals, never imported —
   * §12.5's independence rule. 1536 px canvas, 1024 px image, horizon 0.48,
   * the interim eye 1.60 m, pinned 96 px/m. */
  const CANVAS = 1536;

  test("study/N — the M0 room, pinned", () => {
    const m = deriveMeta(PLAN, "study", "N");
    const PX = 1024 / 4.35;                     // the lens, not a pinned scale
    expect(m.camera_wall_m).toBe(4.35);         // the THRESHOLD standpoint, off the drawing
    expect(m.wall_width_m).toBe(5.45);
    expect(m.px_per_m_at_wall).toBeCloseTo(PX, 9);          // 235.402
    expect(m.camera).toBeUndefined();
    expect(m.floor_line_y).toBeCloseTo(524.4 / 1024 + 1.08775 * PX / 1024, 12);
    expect(m.px_per_m_at_bottom).toBeCloseTo((1024 - 524.4) / 1.08775, 9);
    expect(m.corner_x0_px).toBeCloseTo(CANVAS / 2 - 5.45 / 2 * PX, 9);        // 126.5
    expect(m.corner_x1_px).toBeCloseTo(CANVAS / 2 + 5.45 / 2 * PX, 9);        // 1409.5
    expect(m.corner_x1_px - m.corner_x0_px).toBeCloseTo(5.45 * PX, 9);
    expect(m.backdrop).toBe("wall");
  });

  test("hall/E — a corridor's deep view keeps the pinned frame", () => {
    const m = deriveMeta(PLAN, "hall", "E");
    expect(m.facing_type).toBe("corridor");
    expect(m.camera_wall_m).toBe(6.0);          // its DRAWN standpoint: the wall fits from there
    expect(m.wall_width_m).toBe(2.6);
    expect(m.camera).toBeUndefined();
    expect(m.corner_x0_px).toBeCloseTo(768 - 2.6 / 2 * (1024 / 6.0), 9);  // 546.1
  });

  test("entrance_court/N — a wide wall simply runs past the frame now", () => {
    /* This facing used to take the deleted WIDE camera, whose whole job was to
       shrink the scale until a 20.4 m wall fitted a 1536 px frame. Under a
       pinned lens it does not fit and does not need to: the corners fall
       outside and the wall runs past the edges, which is what standing in a
       courtyard looks like. */
    const m = deriveMeta(PLAN, "entrance_court", "N");
    expect(m.wall_width_m).toBe(20.4);
    expect(m.camera).toBeUndefined();
    expect(m.px_per_m_at_wall).toBeCloseTo(1024 / m.camera_wall_m, 9);
    expect(m.px_per_m_at_bottom).toBeCloseTo((1024 - 524.4) / 1.08775, 9); // scale-independent
    expect(m.corner_x0_px).toBeLessThan(0);
    expect(m.corner_x1_px).toBeGreaterThan(1536);
  });

  test("entrance_court/S — an open facing has no wall, no corners, and a vista", () => {
    const m = deriveMeta(PLAN, "entrance_court", "S");
    expect(m.facing_type).toBe("open");
    expect(m.backdrop).toBe("vista");
    expect(m.corner_x0_px).toBeNull();
    expect(m.corner_x1_px).toBeNull();
    // and the distance is to the drawn ground line, under its own name
    expect(m.camera_wall_m).toBeUndefined();
    expect(m.camera_far_m).toBe(26.75);
    expect(m.far_line).toBe(-20.0);
  });

  test("entrance_approach/N — a view that is part wall and part sky gets segments, not corners", () => {
    const m = deriveMeta(PLAN, "entrance_approach", "N");
    expect(m.facing_type).toBe("enclosed");
    expect(m.wall_continuous).toBe(false);
    expect(m.corner_x0_px).toBeNull();
    expect(m.corner_x1_px).toBeNull();
    // The wings' fronts: 3.8–10.0 and 30.4–35.8 of a view running 3.8–35.8.
    expect(m.wall_segments.map((s) => [s.from_m, s.to_m]))
      .toEqual([[0, 6.2], [26.6, 32]]);
    const gap = 32 - 6.2 - 5.4;
    expect(gap).toBeCloseTo(20.4, 9);   // the court mouth, exactly the court's width
  });

  /* ROW 20: the wide-view fork is gone, and what stands here is the law that
   * replaced it. `WIDE_VIEW_POLICIES`, `needsWideView` and the `camera` meta
   * field existed only because a pinned SCALE had to clip a wall wider than
   * the frame; a pinned LENS does not clip, so the fork has no subject. */
  test("ONE LENS: every facing in the manor, on every camera, implies the ruled focal length", () => {
    expect(FOCAL_MM).toBe(24);
    expect(FOCAL_PX).toBe(24 * 1536 / 36);       // exactly 1024 on this frame
    expect(FOCAL_PX).toBe(1024);
    const focals = new Set();
    for (const r of PLAN.rooms) {
      for (const f of FACINGS) {
        const m = deriveMeta(PLAN, r.id, f);
        const d = m.camera_wall_m ?? m.camera_far_m;
        focals.add(Math.round(m.px_per_m_at_wall * d * 1e6) / 1e6);
      }
    }
    expect([...focals]).toEqual([FOCAL_PX]);
    /* And it is a lens, not a scale: the px/m that comes out is DIFFERENT on
       facings at different distances, which is the whole point — the corner
       moves with where you stand, which is what blueprint §5's [HUMAN]
       sentence asked for and the pinned scale could not give. */
    const study = deriveMeta(PLAN, "study", "N"), passage = deriveMeta(PLAN, "hall", "E");
    expect(study.px_per_m_at_wall).not.toBeCloseTo(passage.px_per_m_at_wall, 3);
    expect(study.px_per_m_at_wall).toBeCloseTo(1024 / 4.35, 6);
    expect(passage.px_per_m_at_wall).toBeCloseTo(1024 / 6.0, 6);
  });

  test("and the lens is bound to blueprint §10's [HUMAN] field, not merely equal to it", () => {
    expect(assertRuledLens()).toEqual([]);
    const tmp = mkdtempSync(join(tmpdir(), "holo-lens-"));
    try {
      const c = JSON.parse(readFileSync(join(repoRoot, "replicator", "contract.json"), "utf8"));
      c.camera.focal_mm = 50;
      mkdirSync(join(tmp, "replicator"), { recursive: true });
      writeFileSync(join(tmp, "replicator", "contract.json"), JSON.stringify(c));
      expect(assertRuledLens(join(tmp, "replicator", "contract.json")).length).toBeGreaterThan(0);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test("the frame holds metres in proportion to how far away the plane is", () => {
    // was pinnedWallInFrame(), a constant 16.0 m; under a lens it is 1.5 x d
    expect(wallInFrame(4.0)).toBeCloseTo(6.0, 9);
    expect(wallInFrame(6.0)).toBeCloseTo(9.0, 9);
  });

  test("every derived meta says it is provisional and names the camera that made it", () => {
    for (const r of PLAN.rooms) {
      for (const f of FACINGS) {
        const m = deriveMeta(PLAN, r.id, f);
        expect(m.provisional, `${r.id}/${f}`).toBe(true);
        expect(m.camera_id).toBe("grid");
        expect(m.wide_view_policy, `${r.id}/${f} carries no wide-view reading`).toBeUndefined();
        expect(m.camera, `${r.id}/${f} carries no camera token`).toBeUndefined();
      }
    }
  });

  /* §12.5's frame clauses as ROW 20 leaves them. (i) is retired: under a
   * pinned lens a wall wider than the frame runs past it, as in life, so
   * "the wall in view fits the frame" is false by design. What survives is
   * (ii) — corner span against arithmetic — and the honest census of which
   * facings show a corner at all. */
  test("corners span what the arithmetic says, and only some of them are in frame", () => {
    let withCorners = 0, bothIn = 0, someOut = 0;
    for (const r of PLAN.rooms) {
      for (const f of FACINGS) {
        const m = deriveMeta(PLAN, r.id, f);
        if (m.corner_x0_px === null) { expect(m.corner_x1_px).toBeNull(); continue; }
        withCorners++;
        expect(m.corner_x1_px - m.corner_x0_px, `${r.id}/${f} span`)
          .toBeCloseTo(m.wall_width_m * m.px_per_m_at_wall, 6);
        if (m.corner_x0_px >= 0 && m.corner_x1_px <= CANVAS_W) bothIn++; else someOut++;
      }
    }
    // 88 less the four open facings and the one segmented one
    expect(withCorners).toBe(83);
    /* The number that matters to the row's done — "corners appear exactly when
       honestly in frame". A wall too wide to fit from where you stand shows
       neither corner, and the count is pinned so it cannot drift in silence. */
    expect(bothIn + someOut).toBe(83);
    expect(bothIn).toBeGreaterThan(0);
    expect(someOut).toBeGreaterThan(0);
  });

  /* The genuinely independent check: every derived camera_wall_m and
   * wall_width_m against the standpoint table on the drawing Kabe approved —
   * a separate artifact, not this code's own arithmetic. */
  test("all 88 facings agree with the approved standpoints.tsv", () => {
    const lines = readFileSync(join(draftDir, "standpoints.tsv"), "utf8").trim().split("\n");
    const header = lines.shift().split("\t");
    expect(header.slice(0, 7)).toEqual([
      "floor", "room", "room_type", "facing", "facing_type", "camera_wall_m", "wall_width_m"]);
    expect(lines.length).toBe(88);
    let checked = 0;
    for (const line of lines) {
      const [floor, name, roomType, facing, facingType, cam, ww] = line.split("\t");
      const r = PLAN.rooms.find((x) => x.floor === floor && x.name === name);
      expect(r, `${floor}/${name}`).toBeTruthy();
      expect(r.type).toBe(roomType);
      const m = deriveMeta(PLAN, r.id, facing);
      expect(m.facing_type, `${name}/${facing} type`).toBe(facingType);
      expect((m.camera_wall_m ?? m.camera_far_m).toFixed(2), `${name}/${facing} camera_wall_m`).toBe(cam);
      expect(m.wall_width_m.toFixed(2), `${name}/${facing} wall_width_m`).toBe(ww);
      checked++;
    }
    expect(checked).toBe(88);
  });

  test("law (a): every stored distance is the measured one, recomputed here", () => {
    for (const r of PLAN.rooms) {
      for (const f of FACINGS) {
        const fc = r.facings[f];
        /* Row 20: the standpoint law, not the stand-back rule alone. A facing
           whose wall does not fit the frame from the drawn standpoint stands at
           the far side of its room instead, and the document says which branch
           it took. `ruleStandpoint` is still what the `rule` branch returns. */
        const want = fc.standpoint_source === "drawn" ? fc.standpoint
          : standpointFor(PLAN, r, f, PLAN.standpoint_stand_back,
            PLAN.standpoint_threshold_clearance_m).point;
        expect(fc.standpoint.x, `${r.id}/${f} x`).toBeCloseTo(want.x, 9);
        expect(fc.standpoint.y, `${r.id}/${f} y`).toBeCloseTo(want.y, 9);
        if ((fc.standpoint_source || "rule") === "rule") {
          const ruled = ruleStandpoint(r.rect, f, PLAN.standpoint_stand_back);
          expect(fc.standpoint.x, `${r.id}/${f} rule x`).toBeCloseTo(ruled.x, 9);
        }
        const field = fc.type === "open" ? "camera_far_m" : "camera_wall_m";
        expect(fc[field], `${r.id}/${f} ${field}`)
          .toBe(drawn(measuredDistance(fc.standpoint, f, fc.wall_line)));
        // and the other name is absent, so a consumer cannot read a horizon
        // as a wall through groundplane's camera_wall_m fallback
        expect(fc[fc.type === "open" ? "camera_wall_m" : "camera_far_m"]).toBeUndefined();
      }
    }
  });
});

/* ------------------------------------------------------------ the projection */

test.describe("the projection against the shipped staging", () => {
  test("staging ≡ plan projection everywhere but the one named divergence", () => {
    const div = stagingDivergence(PLAN, STAGING);
    /* Six directly-staged placements, all of them judged. The count is the
     * guard against a placement quietly falling out of the plan: an entity
     * the plan stops holding a position for is reported as unplanned and
     * skipped, and this is what notices. */
    expect(div.rows.length).toBe(6);
    expect(div.unplanned, "a shipped placement the plan cannot judge").toEqual([]);
    expect(div.unexpected, "an unnamed divergence").toEqual([]);
    expect(div.missing, "a named divergence that has quietly gone away").toEqual([]);
    /* NOTHING diverges since row 11: the staging was moved to the drawing, so
     * the allowlist is empty and every row agrees. What that agreement is
     * worth is the next two cases' subject — five of the six agree
     * definitionally, and the sixth (door1 on study/E) agrees because the
     * fixture moved to the plan rather than because the plan moved. */
    expect(div.diverging).toEqual([]);
    expect(KNOWN_DIVERGENCES).toEqual([]);
  });

  /* The number, pinned. door1's plan position comes from the approved
   * drawing: 1.1 m south of the study's east-wall centre. Row 12 recorded the
   * shipped staging centring it as the one divergence that carried
   * information; row 11 moved the staging to the drawing, so the same 1.1 m
   * is now what the fixture says. */
  test("door1 on study/E stands where the approved drawing puts it: 1.1 m off centre", () => {
    const m = metaForFacing(PLAN, "study", "E");
    const p = projectPlacement(PLAN, "door1", "study", "E", m);
    expect(p.offset_m).toBeCloseTo(1.1, 9);
    expect(p.u).toBeCloseTo(0.5 + 1.1 / 4.8, 9);   // 0.72917 across the study's east wall
    expect(STAGING.placements.door1[0].facing).toBe("study/E");
    expect(STAGING.placements.door1[0].u).toBeCloseTo(p.u, 9);
    expect(p.in_wall, "the opening straddles the wall it is a hole in").toBe(true);
    /* And it is inside the room: a doorway past a corner is a doorway in the
     * side wall, which is not what the drawing holds. */
    expect(p.screen_x).toBeGreaterThan(m.corner_x0_px);
    expect(p.screen_x).toBeLessThan(m.corner_x1_px);
  });

  /* Honesty about what the agreements are worth. Four of the six are
   * definitional (their plan positions came out of this staging), and the
   * fifth is at offset 0 where u is 0.5 under any wall width at all. */
  test("the four free-standing objects round-trip, and only one still agrees definitionally", () => {
    /* Honesty about what the agreements are worth. Only `shelf1`'s footprint
     * was the inverse projection of an earlier staging until row 20, when the
     * ruled lens left the passage's long facings with no floor in frame and
     * the shipped validator refused any placement on them. All four are
     * "composed" now and every one carries its own reason, so the round trip
     * below is a binding guard and says nothing at all about the plan. */
    const sources = {};
    for (const [id, pl] of Object.entries(STAGING.placements)) {
      if (Array.isArray(pl) || !pl.facing) continue;
      const obj = PLAN.objects.find((o) => o.id === id);
      expect(obj, id).toBeTruthy();
      sources[id] = obj.source;
      const [loc, f] = pl.facing.split("/");
      const back = inverseProjectPlacement(PLAN, pl, BY_ENTITY[id], metaForFacing(PLAN, loc, f));
      for (const k of ["x0", "x1", "y0", "y1"]) {
        expect(back[k], `${id}.${k}`).toBeCloseTo(obj.footprint[k], 9);
      }
    }
    expect(sources).toEqual({
      desk1: "composed",
      chair1: "composed",
      shelf1: "composed",
      stick1: "composed"
    });
    expect(PLAN.objects.find((o) => o.id === "desk1").note).toMatch(/chimney breast/);
    expect(PLAN.objects.find((o) => o.id === "chair1").note).toMatch(/keeps the pair/i);
    const stick = PLAN.objects.find((o) => o.id === "stick1");
    expect(stick.note, "a composed value carries its why").toMatch(/§4/);
    expect(stick.note).toMatch(/occlusion chain/);
  });

  /* The allowlist has to have teeth in both directions: a divergence that
   * quietly starts agreeing must be noticed too, or the list rots into a
   * comment. */
  test("moving the drawing under the staging is caught from both sides at once", () => {
    /* The allowlist is empty, so every disagreement is unexpected — and the
     * door is one entity in two rooms, so re-siting its opening moves it away
     * from the staging in the study AND decentres it in the cross passage.
     * Both are reported. */
    const p = clone(PLAN);
    const op = p.openings.find((o) => o.entity === "door1");
    op.rect.y0 = 11.5; op.rect.y1 = 12.5;
    const div = stagingDivergence(p, STAGING);
    expect(div.missing).toEqual([]);
    expect(div.unexpected.map((r) => `${r.id}@${r.facing}`).sort())
      .toEqual(["door1@hall/W", "door1@study/E"]);
  });

  /* The room is on the plan and the thing standing in it is not: a gap in the
   * document, so it refuses. Only a placement in a room the plan has not
   * reached at all is a warning. */
  test("a staged entity the plan holds no position for refuses, and does not merely warn", () => {
    const p = clone(PLAN);
    p.objects = p.objects.filter((o) => o.id !== "desk1");
    const div = stagingDivergence(p, STAGING);
    expect(div.rows.length).toBe(5);
    expect(div.unplanned).toEqual([]);
    expect(div.unexpected.map((u) => u.id)).toEqual(["desk1"]);
  });

  test("a placement in a room the plan has not drawn is a warning, not a refusal", () => {
    const st = clone(STAGING);
    st.placements.lamp1 = { facing: "scullery/N", attachment: "floor_free", u: 0.5, depth_m: 1 };
    const div = stagingDivergence(PLAN, st);
    expect(div.unexpected).toEqual([]);
    expect(div.unplanned.map((u) => u.id)).toEqual(["lamp1"]);
  });

  /* A door between a planned room and an unplanned one is staged on both, and
   * it belongs to the part of the world the plan has not reached — so it warns
   * from both sides rather than refusing from the planned one. */
  test("a door straddling a planned and an unplanned room warns from both sides", () => {
    const st = clone(STAGING);
    st.placements.door2 = [
      { facing: "hall/E", attachment: "wall_mounted", u: 0.5, v: 0 },
      { facing: "gallery/W", attachment: "wall_mounted", u: 0.5, v: 0 }
    ];
    const div = stagingDivergence(PLAN, st);
    expect(div.unexpected).toEqual([]);
    expect(div.unplanned.map((u) => u.facing).sort()).toEqual(["gallery/W", "hall/E"]);
  });

  /* The tolerance is stated, derived, and driven from both sides. */
  test("a divergence just over the tolerance refuses, just under it passes", () => {
    expect(STAGING_TOLERANCE).toBe(1e-9);
    const st = clone(STAGING);
    const u0 = STAGING.placements.desk1.u;
    st.placements.desk1.u = u0 + STAGING_TOLERANCE * 0.4;
    expect(stagingDivergence(PLAN, st).unexpected).toEqual([]);
    st.placements.desk1.u = u0 + STAGING_TOLERANCE * 4;
    expect(stagingDivergence(PLAN, st).unexpected.map((r) => r.id)).toEqual(["desk1"]);
  });

  test("door1's plan position is NOT derived from staging — it is the drawing's opening", () => {
    const op = PLAN.openings.find((o) => o.entity === "door1");
    expect(op.rect).toEqual({ x0: 30.4, x1: 31.0, y0: 10.4, y1: 11.4 });
    expect(PLAN.objects.find((o) => o.id === "door1")).toBeUndefined();
  });

  test("an anchor_on entity has no plan position and asking for one throws", () => {
    for (const id of ["note1", "key1", "coin1"]) {
      expect(PLAN.objects.find((o) => o.id === id), id).toBeUndefined();
      expect(() => projectPlacement(PLAN, id, "study", "N")).toThrow(/anchor_on/);
    }
  });

  test("view angles are derived from the plan, for §10's per-placement request", () => {
    const p = projectPlacement(PLAN, "desk1", "study", "N");
    // atan2(offset, standpoint distance − depth) = atan2(+1.875, 4.35 − 0.55)
    expect(p.view_angle_deg).toBeCloseTo(Math.atan2(1.875, 3.80) * 180 / Math.PI, 6);
    expect(projectPlacement(PLAN, "door1", "hall", "W").view_angle_deg).toBeCloseTo(0, 9);
    for (const r of stagingDivergence(PLAN, STAGING).rows) {
      const [rm, f] = r.facing.split("/");
      expect(projectPlacement(PLAN, r.id, rm, f).view_angle_deg).not.toBeNull();
    }
  });

  test("facingsContaining enumerates the facings an object stands in front of", () => {
    // The desk stands against the study's north wall: the N view contains it,
    // the S view (looking the other way, from north of it) does not.
    expect(facingsContaining(PLAN, "desk1")).toContain("N");
    expect(facingsContaining(PLAN, "desk1")).not.toContain("S");
    expect(facingsContaining(PLAN, "shelf1")).toContain("N");
  });

  test("the room's own meta moves both u and drawn size against the unplanned fallback", () => {
    /* What row 11 shipped, stated as a difference: the 16 m fallback wall
     * against the cross passage's real 8.00 m at 1.95 m. Both u and the drawn
     * size move, and the second is the one a reader of the u column alone
     * would not expect. */
    const { GRID_META } = require(join(repoRoot, "src", "renderer.js"));
    const planMeta = deriveMeta(PLAN, "hall", "N");
    const a = projectEntity(PLAN, "stick1", "hall", "N", BY_ENTITY, { ...GRID_META });
    const b = projectEntity(PLAN, "stick1", "hall", "N", BY_ENTITY, planMeta);
    expect(b.u).not.toBeCloseTo(a.u, 4);
    expect(b.placement.heightPx / a.placement.heightPx).toBeGreaterThan(1.1);
    expect(readFileSync(join(draftDir, "projection.md"), "utf8"))
      .toMatch(/drawn height px, fallback/);
  });
});

/* ------------------------------------- the projection is bound to groundplane */

test.describe("the projection imports the placement math rather than owning a copy", () => {
  const groundplane = require(join(repoRoot, "src", "groundplane.js"));

  test("displacing xAtScale displaces the projected u", () => {
    const original = groundplane.xAtScale;
    const before = projectPlacement(PLAN, "desk1", "study", "N", metaForFacing(PLAN, "study", "N")).u;
    try {
      // Halve the wall the u-domain spans. A projection that re-derived
      // u = 0.5 + offset/wall_width_m in its own code would not notice.
      groundplane.xAtScale = function (u, s, meta, w) {
        return original(u, s, { ...meta, wall_width_m: meta.wall_width_m / 2 }, w);
      };
      const after = projectPlacement(PLAN, "desk1", "study", "N", metaForFacing(PLAN, "study", "N")).u;
      expect(after).not.toBeCloseTo(before, 6);
      expect(after - 0.5).toBeCloseTo((before - 0.5) * 2, 6);
    } finally {
      groundplane.xAtScale = original;
    }
    expect(projectPlacement(PLAN, "desk1", "study", "N", metaForFacing(PLAN, "study", "N")).u).toBeCloseTo(before, 12);
  });

  /* The corners are what row 11 consumes, so a private copy of the u-mapping
   * would put its corner verticals and the staging u-domain in two places
   * that agree only by luck. */
  test("displacing xAtScale displaces the derived corners", () => {
    const original = groundplane.xAtScale;
    const before = deriveMeta(PLAN, "study", "N");
    try {
      groundplane.xAtScale = function (u, s, meta, w) {
        return original(u, s, { ...meta, wall_width_m: meta.wall_width_m / 2 }, w);
      };
      const after = deriveMeta(PLAN, "study", "N");
      expect(after.corner_x0_px).not.toBeCloseTo(before.corner_x0_px, 6);
      expect(after.corner_x1_px - after.corner_x0_px)
        .toBeCloseTo((before.corner_x1_px - before.corner_x0_px) / 2, 6);
    } finally {
      groundplane.xAtScale = original;
    }
    expect(deriveMeta(PLAN, "study", "N").corner_x0_px).toBeCloseTo(before.corner_x0_px, 12);
  });

  test("displacing scaleAtDepth displaces the projected scale", () => {
    const original = groundplane.scaleAtDepth;
    const before = projectPlacement(PLAN, "chair1", "study", "N", metaForFacing(PLAN, "study", "N")).scale_px_per_m;
    try {
      groundplane.scaleAtDepth = (d, meta) => original(d, meta) * 2;
      expect(projectPlacement(PLAN, "chair1", "study", "N", metaForFacing(PLAN, "study", "N")).scale_px_per_m)
        .toBeCloseTo(before * 2, 6);
    } finally {
      groundplane.scaleAtDepth = original;
    }
  });

  test("displacing placeHost displaces the projected pixels", () => {
    const original = groundplane.placeHost;
    const before = projectEntity(PLAN, "desk1", "study", "N", BY_ENTITY, metaForFacing(PLAN, "study", "N"));
    try {
      groundplane.placeHost = (pl, rec, meta, w) => {
        const p = original(pl, rec, meta, w);
        return p && { ...p, heightPx: p.heightPx + 1000 };
      };
      const after = projectEntity(PLAN, "desk1", "study", "N", BY_ENTITY, metaForFacing(PLAN, "study", "N"));
      expect(after.placement.heightPx).toBeCloseTo(before.placement.heightPx + 1000, 6);
    } finally {
      groundplane.placeHost = original;
    }
  });

  test("and the inverse goes through xAtScale too", () => {
    const original = groundplane.xAtScale;
    const pl = STAGING.placements.desk1;
    const before = inverseProjectPlacement(PLAN, pl, BY_ENTITY.desk1, metaForFacing(PLAN, "study", "N"));
    try {
      groundplane.xAtScale = function (u, s, meta, w) {
        return original(u, s, { ...meta, wall_width_m: meta.wall_width_m / 2 }, w);
      };
      const after = inverseProjectPlacement(PLAN, pl, BY_ENTITY.desk1, metaForFacing(PLAN, "study", "N"));
      expect(after.x0).not.toBeCloseTo(before.x0, 6);
    } finally {
      groundplane.xAtScale = original;
    }
  });
});

/* ------------------------------------------------------------- the bake path */

test.describe("the bake refuses a fixture whose plan does not hold up", () => {
  test("an invalid plan.json refuses the bake, and fixture.js is not written", () => {
    const dir = stagePlanTree();
    try {
      const fx = join(dir, "fixtures", "demo-study");
      const p = readJson(join(fx, "plan.json"));
      p.rooms.find((r) => r.id === "study").rect.y1 = 16.0;   // overlaps the back stair
      writeFileSync(join(fx, "plan.json"), JSON.stringify(p));
      const out = join(dir, "fresh.js");
      expect(() => bake(dir, ["--fixture-dir", fx, "--out", out])).toThrow();
      expect(existsSync(out), "the bake wrote a file anyway").toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("a MISSING plan.json refuses the bake — silence is not a pass", () => {
    const dir = stagePlanTree();
    try {
      const fx = join(dir, "fixtures", "demo-study");
      rmSync(join(fx, "plan.json"));
      let msg = "";
      try { bake(dir, ["--fixture-dir", fx, "--out", join(dir, "fresh.js")]); }
      catch (e) { msg = String(e.stderr || e.message); }
      // the NAMED refusal, not an incidental ENOENT from readFileSync
      expect(msg).toMatch(/bake refused: no plan\.json/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("a staging value that walks away from the plan refuses the bake", () => {
    const dir = stagePlanTree();
    try {
      const fx = join(dir, "fixtures", "demo-study");
      const st = readJson(join(fx, "staging.json"));
      /* Small enough to keep every OTHER fixture check green: a nudge that
         leaves the desk inside its room and still overlapping the chair, so
         the only thing that can notice is the plan projection itself. */
      st.placements.desk1.u = st.placements.desk1.u + 0.004;
      writeFileSync(join(fx, "staging.json"), JSON.stringify(st, null, 2) + "\n");
      let msg = "";
      try { bake(dir, ["--fixture-dir", fx, "--out", join(dir, "fresh.js")]); }
      catch (e) { msg = String(e.stderr || e.message); }
      expect(msg).toMatch(/staging ≠ plan projection/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("a world that contradicts the plan's geometry refuses the bake", () => {
    const dir = stagePlanTree();
    try {
      const fx = join(dir, "fixtures", "demo-study");
      const w = readJson(join(fx, "world.json"));
      w.locations[0].exits[0].arrive_facing = "W";
      writeFileSync(join(fx, "world.json"), JSON.stringify(w, null, 2) + "\n");
      expect(() => bake(dir, ["--fixture-dir", fx, "--out", join(dir, "fresh.js")])).toThrow();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  /* The camera the projection reads out of grid-canonical meta has to still be
   * a camera. This is the guard on the imported constant, in the real path. */
  test("a grid-canonical meta that stops satisfying §5's horizon device refuses the bake", () => {
    const dir = stagePlanTree();
    try {
      const rp = join(dir, "src", "renderer.js");
      const src = readFileSync(rp, "utf8");
      /* Break the horizon device in the fallback meta's own derivation: the
         eye height is what ties `px_per_m_at_bottom` to `floor_line_y`, so
         halving it makes the two statements of §5's floor disagree. Row 20
         made every GRID_META number derived, so there is no literal left to
         swap — which is the point of deriving them. */
      writeFileSync(rp, src.replace("var eye = gp.DRAWING_EYE_M;", "var eye = gp.DRAWING_EYE_M / 2;"));
      let msg = "";
      try { bake(dir, ["--fixture-dir", join(dir, "fixtures", "demo-study"), "--out", join(dir, "fresh.js")]); }
      catch (e) { msg = String(e.stderr || e.message); }
      expect(msg).toMatch(/camera/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("the shipped fixture.js is untouched by any of it", () => {
    const dir = stagePlanTree();
    try {
      const fx = join(dir, "fixtures", "demo-study");
      const out = join(dir, "fresh.js");
      bake(dir, ["--fixture-dir", fx, "--out", out]);
      expect(readFileSync(out).equals(readFileSync(join(fixtureDir, "fixture.js")))).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

/* ---------------------------------------------------------- the derived render */

test.describe("the schematic is a derived render of the plan", () => {
  test("python3 is available — this row's acceptance runs through it", () => {
    expect(python(["-c", "print('ok')"]).trim()).toBe("ok");
  });

  test("re-rendering plan.json reproduces the committed SVGs and TSV byte for byte", () => {
    const dir = stagePlanTree();
    try {
      const draft = join(dir, "design", "plan-draft");
      for (const f of ["manor-ground.svg", "manor-upper.svg", "standpoints.tsv"]) {
        rmSync(join(draft, f));
      }
      python([join(draft, "draw_plan.py")], dir);
      for (const f of ["manor-ground.svg", "manor-upper.svg", "standpoints.tsv"]) {
        expect(readFileSync(join(draft, f)).equals(readFileSync(join(draftDir, f))),
          `${f} — stale derived render; run: python3 design/plan-draft/draw_plan.py`).toBe(true);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("the render refuses a plan the validator rejects", () => {
    const dir = stagePlanTree();
    try {
      const fx = join(dir, "fixtures", "demo-study");
      const p = readJson(join(fx, "plan.json"));
      p.openings = p.openings.filter((o) => o.entity !== "door1");   // study unreachable
      writeFileSync(join(fx, "plan.json"), JSON.stringify(p));
      expect(() => python([join(dir, "design", "plan-draft", "draw_plan.py")], dir)).toThrow();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  /* The tie back to the artifact a human actually looked at, taken from git
   * rather than from a literal.
   *
   * Kabe approved `design/plan-draft/` on 2026-08-21; the sheets landed at
   * commit 02754d1 and the approval with its four rulings is recorded at
   * 9059605, where the blobs are byte-identical to 02754d1's. Row 12 inverted
   * the source and corrected two caption strings that had become false —
   * "DRAFT for redline" on an approved sheet, and a footnote crediting checks
   * that moved into tools/validate-plan.mjs — so the whole-file bytes moved.
   * The DRAWN GEOMETRY did not, and that is what these cases assert, against
   * the approved blob itself. A literal hash would have been severable in one
   * edit; this cannot be changed without rewriting history.
   *
   * The suite's "no hash literals" rule is about CANVAS hashes across browser
   * engines. There is no engine here, and nothing else in the row ties the
   * derived render to a human's yes. */
  /* RE-ANCHORED AT ROW 20 to f50e20e, the commit carrying the redrawn sheets
   * and the standpoint table. (It first read d87335f, which carried the same
   * geometry under an earlier provenance string; the literal moved forward
   * with that string and this comment did not, which is the stale-sentence
   * family and is corrected here.) What moved in the drawing is the
   * standpoints:
   * every facing whose viewed wall does not fit the frame from its drawn
   * standpoint now stands at the far side of its room, 0.45 m off the wall
   * behind it, pulled forward where a hearth or a flight is in the way. No
   * wall, opening, window, hearth, stair or room moved.
   *
   * The authority is Kabe's approval of the perspective preview frames on
   * 2026-08-21 — "If so full steam ahead, lets build this thing" — which
   * blessed `01d` (the study's north view FROM THE THRESHOLD, 4.35 m) and
   * `02b` (the passage's east view from its DRAWN standpoint, 6.00 m). Those
   * two frames are the standpoint law stated in pictures.
   *
   * And what that authority does NOT cover is printed on the sheet's own face
   * rather than left to this comment: `approval.lock` carries a `pending`
   * line, so the stamp reads "APPROVED … AWAITING HIS EYE ON: the standpoint
   * markers and their printed distances". The sheets are in the row's batch,
   * and the row does not close until his word lands.
   *
   * AND THE ANCHOR DOES NOT MOVE AGAIN FOR A STAMP. Round 5 made the stamp
   * wrap to a second line, which pushed the header rule down and changed the
   * sheets' bytes; the reflex fix is to walk this literal forward to whatever
   * commit carries the new file, and that reflex is what would hollow the case
   * out — an anchor an agent re-points every time the artifact moves proves
   * nothing about the artifact. `geometryOnly` above absorbs chrome on BOTH
   * sides instead, so this literal moves only when the DRAWING moves and Kabe
   * has said yes to the new one. */
  const APPROVAL_COMMIT = "f50e20e";

  /* The last sheets a human looked at DIRECTLY — Kabe's 2026-08-21 approval was
   * of two rendered frames, not of these drawings, which is the whole reason a
   * `pending` line exists. The drawn content that has moved since he last saw a
   * sheet is what that line has to name, and this is the commit that delta is
   * measured against. */
  const SEEN_SHEET_COMMIT = "9059605";

  function approvedBlob(path) {
    return execFileSync("git", ["show", `${APPROVAL_COMMIT}:${path}`],
      { cwd: repoRoot, encoding: "buffer", maxBuffer: 32 * 1024 * 1024 });
  }

  /* THE BATCH AND THE LOCK'S `pending` LINE ARE ONE SWITCH, NOT TWO.
   *
   * Round 5 moved the AWAITING requirement out of the lock and onto the batch
   * directory's existence, on the reasoning that a directory leaving the tree is
   * a human-visible event where a deleted line is not. A critic then deleted the
   * directory: four cases — the AWAITING requirement, the frame re-render, the
   * BEFORE frames and the schematic byte-equality — all reported PASS, because
   * every one of them opened with `if (!existsSync(dir)) return`. The mitigation
   * and the three things it was protecting were switched off by the same `rm`.
   *
   * So neither may move alone. `pending` present means the batch is out; the
   * batch out means `pending` is present; and the cases below skip VISIBLY when
   * it is retired rather than reporting a pass they did not earn. Retiring it
   * takes both edits, and the lock half is a step `design/plan-draft/README.md`
   * makes a human's. */
  const BATCH_DIR = join(repoRoot, "design", "batches", "row20-lens");

  function pendingScope() {
    const m = /^pending\s+(.+)$/m.exec(readFileSync(join(draftDir, "approval.lock"), "utf8"));
    return m ? m[1].trim() : null;
  }

  test("the batch and the lock's pending line stand or fall together", () => {
    const scope = pendingScope();
    expect(existsSync(BATCH_DIR), scope
      ? "approval.lock names pending scope, so design/batches/row20-lens/ must still be in the tree — retiring the gate takes BOTH edits"
      : "design/batches/row20-lens/ is still out, so approval.lock must still carry the `pending` line naming what Kabe has not seen")
      .toBe(!!scope);
  });

  /* [ROW 21] AND THE GATE RETIRES ON A VERDICT, NOT ON A DIRECTORY.
   *
   * Round 7's G2, recorded at the row-20 close and left open with its root
   * named: `rm -r design/batches/row20-lens/`, delete the `pending` line,
   * re-run the drawing, and the suite reported 568 passed over two sheets
   * printing a bare APPROVED above a drawing nobody had seen. Coupling the
   * batch to the line made that twice as expensive and did not change its
   * shape, because both halves are things an agent can delete. What cannot be
   * deleted into compliance is a POSITIVE record: `design/approvals.log` is a
   * committed ledger of every human gate verdict, and an entry whose last
   * column still reads `pending-close` or `-` is a gate that has had no word.
   *
   * So the three move together. While the ledger says a batch is open, the
   * batch must be in the tree and the lock must carry its line; retiring it
   * means writing down what a human actually said, with the commit it was said
   * against — which is a claim about a person and not about a file. */
  const APPROVALS = join(repoRoot, "design", "approvals.log");
  function openBatchGates() {
    const out = [];
    for (const line of readFileSync(APPROVALS, "utf8").split("\n")) {
      if (line.startsWith("#") || !line.includes("|")) continue;
      const col = line.split("|").map((c) => c.trim());
      if (col.length < 4) continue;
      const dir = /\((design\/batches\/[a-z0-9-]+)\)/.exec(col[1]);
      if (!dir) continue;
      out.push({ scope: col[1], word: col[2], commit: col[3], dir: dir[1],
        open: col[3] === "pending-close" || col[3] === "-" });
    }
    return out;
  }

  test("a batch gate is open until the approvals ledger records a verdict", () => {
    const gates = openBatchGates();
    expect(gates.length,
      "design/approvals.log carries no batch entry at all — the ledger is where a human gate's verdict lives")
      .toBeGreaterThanOrEqual(2);
    for (const g of gates) {
      if (!g.open) continue;
      expect(existsSync(join(repoRoot, g.dir)),
        `${g.dir} is named by an OPEN entry in design/approvals.log, so the frames it names must still be in the tree`)
        .toBe(true);
      expect(readdirSync(join(repoRoot, g.dir)).filter((f) => f.endsWith(".png")).length,
        `${g.dir} is an open human gate with no pictures in it`)
        .toBeGreaterThan(0);
    }
    /* [F18] AND A CLOSED ENTRY CITES A COMMIT THAT EXISTS. Deleting the batch
       and the lock's line together is caught; WRITING a verdict was not, and
       fabricating a line is the same class of act as deleting one. A commit
       hash is the one part of an entry that something outside the document can
       check, so it is checked: `git rev-parse` it. This does not make the
       QUOTE true — nothing in a repository can — but it stops a gate retiring
       on a sentence with no history behind it. */
    for (const g of gates) {
      if (g.open) continue;
      let resolved = "";
      try {
        resolved = execFileSync("git", ["rev-parse", "--verify", "--quiet", g.commit + "^{commit}"],
          { cwd: repoRoot, encoding: "utf8" }).trim();
      } catch (e) { resolved = ""; }
      expect(resolved,
        `design/approvals.log records a verdict on ${g.dir} against "${g.commit}", which is not a commit in this history`)
        .not.toBe("");
      expect(g.word.length,
        `${g.dir}'s entry records a verdict with no word in it — the ledger holds what a human said`)
        .toBeGreaterThan(3);
      /* [Round 3 — G5] AND THE WORD MAY NOT BE A PLACEHOLDER. Writing a commit
         hash into a row whose verdict column still reads AWAITING KABE closed
         the gate with the whole suite green: the hash was checked and the word
         was not, so a gate could retire on a line that says in plain English
         that nobody has looked. A closed entry carries what a person actually
         said, in quotation marks, because that is what this file is for. */
      expect(g.word, `${g.dir} is recorded as CLOSED against ${g.commit} while its verdict still reads "${g.word}" — a placeholder is not a verdict`)
        .not.toMatch(/awaiting|pending|tbd|todo|^-$/i);
      expect(g.word, `${g.dir}'s verdict is not quoted — the ledger holds a human's own words`)
        .toMatch(/["“”]/);
    }
    /* And the row-20 lock's own line is that gate's second half: while its
       ledger entry is open the sheets must keep printing what the approval
       does not cover. */
    const row20 = gates.find((g) => g.dir.endsWith("row20-lens"));
    expect(row20, "the ledger has lost the row-20 batch entry").toBeTruthy();
    expect(!!pendingScope(), row20.open
      ? "the ledger still calls the row-20 batch open, so approval.lock must still carry its `pending` line"
      : "the ledger records a verdict on the row-20 batch, so the `pending` line may go — and must, or the sheets claim a gate that has closed")
      .toBe(row20.open);
  });

  test("git is available — the approved artifact is read from history, not from a literal", () => {
    expect(execFileSync("git", ["rev-parse", "--short", APPROVAL_COMMIT],
      { cwd: repoRoot, encoding: "utf8" }).trim()).toBe(APPROVAL_COMMIT);
  });

  /* THE BATCH IS RE-RENDERED AND COMPARED, because a batch is an artifact of
   * the code and nothing else can say whether it is current.
   *
   * The first version of this guard asked git whether `src/` or `index.html`
   * had moved past a commit hash typed into the README, and a round-5 critic
   * took it apart three ways. The hash is a string in the document the guard
   * reads, so setting it to HEAD satisfies the guard whatever the frames show.
   * It was ALREADY WRONG: the README named a commit two changes LATER than the
   * capture, so its own sentence — "the commit whose src/ and index.html these
   * frames were rendered from" — was false while the test was green. And it
   * bound nothing about the pictures, so `cp 05-hall-N.png 01-study-N.png`
   * left the whole suite green: nineteen of the batch's twenty-one images
   * could be any picture at all.
   *
   * So the frames answer for themselves. `capture.mjs` is deterministic here —
   * the critic re-ran it and got eleven byte-identical files, and so do we —
   * which makes re-rendering and comparing available as a live check rather
   * than as the stored golden §12.6 forbids. Nothing is kept on disk to
   * compare against: the comparison is against what the code draws right now.
   *
   * It costs one browser and eleven page loads, and it is the only assertion
   * in this file that can tell Kabe he is looking at this build. */
  test("the batch IS what the build that made it drew — every frame re-rendered and compared", async ({ browserName }) => {
    test.setTimeout(180_000);
    /* ONCE, not once per engine. This case launches its own Chromium through
       `capture.mjs` and renders eleven frames; running it again under the
       Firefox project measures nothing new about the frames and doubles a
       minute of work, which on a loaded machine is what turned it red twice.
       The engine under test is irrelevant to a claim about a script. */
    test.skip(browserName !== "chromium", "the batch is captured in Chromium whatever engine this project runs");
    test.skip(!pendingScope(), "the batch has been retired: approval.lock carries no `pending` line");
    const dir = BATCH_DIR;
    expect(existsSync(dir),
      "approval.lock still carries a `pending` line, so the batch it names must still be in the tree")
      .toBe(true);
    const script = join(dir, "capture.mjs");
    expect(existsSync(script),
      "the batch must carry the script that made it — an artifact nobody can regenerate is not derived")
      .toBe(true);

    /* [Row 21] AGAINST THE TREE THAT DREW THEM, which is what this batch's own
       BEFORE frames have done since row 20 and what its AFTER frames now have
       to do too. Row 21 paints `study/N` and puts the next room behind every
       open door, so six of these eleven frames are pictures today's build does
       not draw — and re-capturing them would replace the evidence a human has
       not yet ruled on with evidence he has never seen. The guard's claim
       narrows honestly with the facts: not "these frames are what the code
       draws" but "these frames are what the build that made them drew, and
       here is that build". `ROW20_COMMIT` is the row-20 closing commit, and it
       moves only when a human has ruled on a new set of pictures. */
    const tree = mkdtempSync(join(tmpdir(), "holo-row20-tree-"));
    const out = mkdtempSync(join(tmpdir(), "holo-batch-"));
    try {
      const tar = join(tree, "t.tar");
      execFileSync("git", ["archive", "-o", tar, ROW20_COMMIT,
        "index.html", "src", "fixtures", "library"], { cwd: repoRoot });
      execFileSync("tar", ["-xf", tar, "-C", tree]);
      const log = execFileSync("node", [script, out, tree], { cwd: repoRoot, encoding: "utf8", stdio: "pipe" });
      const fresh = readdirSync(out).filter((f) => f.endsWith(".png")).sort();
      expect(fresh.length, "capture.mjs produced no frames").toBeGreaterThan(8);
      const stale = [];
      for (const f of fresh) {
        const committed = join(dir, f);
        if (!existsSync(committed)) { stale.push(`${f} (missing from the batch)`); continue; }
        if (!readFileSync(committed).equals(readFileSync(join(out, f)))) stale.push(f);
      }
      expect(stale,
        `these batch frames are not what ${ROW20_COMMIT} drew — the build that made them is the only thing that can answer for them`)
        .toEqual([]);
      /* And every capture the script makes is IN the batch, so a frame cannot
         be quietly dropped from the set a human is asked to look at. */
      const committedFrames = readdirSync(dir)
        .filter((f) => /^\d\d-/.test(f) && f.endsWith(".png") && !f.includes("BEFORE") && !f.includes("schematic"))
        .sort();
      expect(committedFrames).toEqual(fresh);

      /* AND EACH FRAME IS OF WHAT ITS NAME PROMISES. Byte-equality proves the
         picture is current; it cannot prove `06-hall-E.png` is the hall looking
         east, because `capture.mjs` is both the definition and the comparison
         and renaming a row of FRAMES is green by construction. The script
         already prints the viewstate it actually reached for every frame; the
         guard reads that line instead of discarding it. */
      const reached = Object.fromEntries(
        log.split("\n").map((l) => /^(\S+) -> (\S+)$/.exec(l)).filter(Boolean)
          .map((m) => [m[1], m[2]]));
      for (const f of fresh) {
        const name = f.replace(/\.png$/, "");
        const m = /^\d\d-(study|hall)-([NESW])(?:-|$)/.exec(name);
        expect(m, `${name}: a batch frame's name must say which room and facing it is`).toBeTruthy();
        expect(reached[name], `${name}: capture.mjs printed no viewstate for it`).toBeDefined();
        expect(reached[name], `${name} is named for ${m[1]}/${m[2]} and was captured at ${reached[name]}`)
          .toBe(`${m[1]}/${m[2]}`);
      }
    } finally {
      rmSync(tree, { recursive: true, force: true });
      rmSync(out, { recursive: true, force: true });
    }
  });

  /* THE BEFORE FRAMES ANSWER FOR THEMSELVES TOO, and until this they answered
   * for nothing at all.
   *
   * Round 5 bound the eleven AFTER frames by re-rendering them, and the filter
   * that did it reads `!f.includes("BEFORE")` — so eight of the batch's
   * twenty-one images stayed exactly as unbound as all twenty-one had been.
   * `cp 05-hall-N-BEFORE.png 01-study-N-BEFORE.png` left the suite green, and
   * the batch README tells Kabe to open the before/after pair FIRST: *"that is
   * the whole row in two pictures"*. Half of the row's evidence was a picture
   * nobody could check.
   *
   * They cannot be re-rendered by today's code — that is what "before" means —
   * so the script takes the tree to draw from. `git archive` the last build
   * before the lens was pinned, point `capture.mjs` at it, and the eight frames
   * come back byte-identical or they are not what they claim to be. No digest
   * is stored, and nothing is read out of the document being guarded. */
  const BEFORE_COMMIT = "ff095d9";   // the last build before the lens was pinned
  /* [Row 21] The row-20 closing commit — the build that drew this batch's
     eleven AFTER frames. Kabe's word on them is still outstanding, so the
     pictures may not move; what moves is where they are re-drawn from. */
  const ROW20_COMMIT = "b0422ac";
  const BEFORE_FACINGS = ["01-study-N", "02-study-E", "03-study-S", "04-study-W",
    "05-hall-N", "06-hall-E", "07-hall-S", "08-hall-W"];

  test("the batch's BEFORE frames are what the superseded build drew", async ({ browserName }) => {
    test.setTimeout(180_000);
    /* ONCE, not once per engine. This case launches its own Chromium through
       `capture.mjs` and renders eleven frames; running it again under the
       Firefox project measures nothing new about the frames and doubles a
       minute of work, which on a loaded machine is what turned it red twice.
       The engine under test is irrelevant to a claim about a script. */
    test.skip(browserName !== "chromium", "the batch is captured in Chromium whatever engine this project runs");
    test.skip(!pendingScope(), "the batch has been retired: approval.lock carries no `pending` line");
    expect(execFileSync("git", ["rev-parse", "--short", BEFORE_COMMIT],
      { cwd: repoRoot, encoding: "utf8" }).trim(),
      "BEFORE_COMMIT must be a commit in this history, not a string").toBe(BEFORE_COMMIT);

    const committed = readdirSync(BATCH_DIR).filter((f) => f.endsWith("-BEFORE.png")).sort();
    expect(committed, "the batch promises one BEFORE frame per facing")
      .toEqual(BEFORE_FACINGS.map((f) => `${f}-BEFORE.png`));

    const tree = mkdtempSync(join(tmpdir(), "holo-before-tree-"));
    const out = mkdtempSync(join(tmpdir(), "holo-before-"));
    try {
      const tar = join(tree, "t.tar");
      execFileSync("git", ["archive", "-o", tar, BEFORE_COMMIT,
        "index.html", "src", "fixtures", "library"], { cwd: repoRoot });
      execFileSync("tar", ["-xf", tar, "-C", tree]);
      execFileSync("node", [join(BATCH_DIR, "capture.mjs"), out, tree],
        { cwd: repoRoot, encoding: "utf8", stdio: "pipe" });
      const wrong = [];
      for (const f of BEFORE_FACINGS) {
        const a = join(BATCH_DIR, `${f}-BEFORE.png`), b = join(out, `${f}.png`);
        if (!existsSync(b)) { wrong.push(`${f} (the superseded build drew no such frame)`); continue; }
        if (!readFileSync(a).equals(readFileSync(b))) wrong.push(`${f}-BEFORE.png`);
      }
      expect(wrong,
        `these BEFORE frames are not what ${BEFORE_COMMIT} drew — they are the other half of the row's evidence`)
        .toEqual([]);
    } finally {
      rmSync(tree, { recursive: true, force: true });
      rmSync(out, { recursive: true, force: true });
    }
  });

  /* [ROW 21, round 2] THE PROMPT LINT IS A GATE, SO IT IS TESTED LIKE ONE.
   *
   * `prompt_lint.py` is the miss ledger's bake-in — the clause that makes two
   * of this round's diagnosed causes impossible rather than merely written
   * down. An artifact critic found it refusing 18 of 18 committed prompts and
   * run by nothing, which is a rule with no discrimination and no enforcement.
   * Two things answer that. This case proves the lint discriminates: a prompt
   * that satisfies the rules passes, and one that breaks each rule is refused
   * BY THAT CLAUSE. And the corpus number is asserted rather than quoted,
   * because it is the lint's own clock baseline.
   *
   * The committed prompts are GRANDFATHERED and the lint says so by refusing
   * them: they were written before the rule existed, they are the evidence for
   * it, and the round they produced is the 0-of-7 baseline. The lint governs
   * the next round. */
  const LINT = join(draftDir, "measured", "prompt_lint.py");

  function lint(paths) {
    try {
      return execFileSync("python3", [LINT, ...paths],
        { cwd: repoRoot, encoding: "utf8", stdio: "pipe" });
    } catch (e) {
      return String(e.stdout || "") + String(e.stderr || "");
    }
  }

  test("the prompt lint refuses what it names and passes what obeys it", () => {
    const dir = mkdtempSync(join(tmpdir(), "holo-lint-"));
    try {
      const good = join(dir, "good.prompt.txt");
      const bad = join(dir, "bad.prompt.txt");
      const blind = join(dir, "blind.prompt.txt");
      writeFileSync(good, [
        "Asset type: backdrop candidate for the study east facing",
        "Gate anchor: the door opening's height at the wall plane, 2.00 m",
        "Hard camera geometry: camera 4.09 metres from the wall; one metre must span about 247 pixels.",
        "Targeted correction: move the camera closer until the wall spans about 1346 pixels.",
        "Avoid: fisheye, converging verticals, rim light."
      ].join("\n") + "\n");
      writeFileSync(bad, [
        "Asset type: backdrop candidate",
        "Gate anchor: the fireplace opening at the wall plane, 0.90 m",
        "Targeted correction: move the camera closer until the wall spans about 1346 pixels.",
        "Avoid: changing the camera scale, fisheye, rim light."
      ].join("\n") + "\n");
      writeFileSync(blind, [
        "Asset type: backdrop candidate for a flat wall band",
        "Hard camera geometry: NO floor line. NO ceiling line. NO corners in frame.",
        "Critical constraints: no feature, carrier, opening, or decoration."
      ].join("\n") + "\n");

      const okOut = lint([good]);
      expect(okOut, "a prompt that declares its anchor and does not contradict itself passes")
        .toMatch(/^ok\s+.*good\.prompt\.txt/m);
      expect(okOut).toMatch(/0 of 1 prompt\(s\) refused/);

      const badOut = lint([bad]);
      expect(badOut, "the contradiction is named by its own clause")
        .toMatch(/row21:prompt\.contradictory_scale/);
      expect(badOut, "and only by it — this prompt declares an anchor")
        .not.toMatch(/row21:prompt\.no_gate_anchor/);

      const blindOut = lint([blind]);
      expect(blindOut).toMatch(/row21:prompt\.no_gate_anchor/);
      expect(blindOut, "a frame with nothing of ruled size in it is refused by its own clause")
        .toMatch(/row21:prompt\.unmeasurable_by_design/);

      /* [Round 3 — G7] AND THE ADVERSARIAL FORMS, one per clause, because a
         critic defeated all three of them by writing the same instruction
         differently. Each of these commits exactly the fault its clause
         exists to refuse, in words the first version of the clause did not
         enumerate. */
      const paraphrase = join(dir, "paraphrase.prompt.txt");
      writeFileSync(paraphrase, [
        "Gate anchor: the door opening's height at the wall plane, 2.00 m",
        "Avoid: changing the camera scale, fisheye, rim light.",
        "Targeted correction: back the camera off until the wall reads 1346 pixels across."
      ].join("\n") + "\n");
      expect(lint([paraphrase]), "a paraphrased scale instruction is still one")
        .toMatch(/row21:prompt\.contradictory_scale/);

      const listed = join(dir, "listed.prompt.txt");
      writeFileSync(listed, [
        "Gate anchor: the fireplace opening, jamb to jamb, 0.90 m",
        "Avoid:",
        "- changing the camera scale",
        "- fisheye",
        "Targeted correction: move the camera closer until the wall spans about 1346 pixels."
      ].join("\n") + "\n");
      expect(lint([listed]), "the prohibition still counts when it is a bullet under Avoid:")
        .toMatch(/row21:prompt\.contradictory_scale/);

      const nullAnchor = join(dir, "null.prompt.txt");
      writeFileSync(nullAnchor, [
        "Gate anchor: nothing whatsoever, 0 m",
        "Hard camera geometry: No corner shall appear in frame. NO corners in frame."
      ].join("\n") + "\n");
      const nullOut = lint([nullAnchor]);
      expect(nullOut, "an anchor of nothing is not an anchor")
        .toMatch(/row21:prompt\.no_gate_anchor/);
      expect(nullOut, "and it does not silence the clause that depends on one")
        .toMatch(/row21:prompt\.unmeasurable_by_design/);

      const wrongSize = join(dir, "wrong.prompt.txt");
      writeFileSync(wrongSize, [
        "Gate anchor: the wainscot chair-rail above the floor, 1.20 m",
        "Hard camera geometry: camera 4.09 metres from the wall."
      ].join("\n") + "\n");
      expect(lint([wrongSize]),
        "an anchor at a size this project does not rule would have the prompt and the gate measuring different lengths")
        .toMatch(/row21:prompt\.no_gate_anchor/);

      /* [The close] AND THE OTHER FAILURE OF A GATE: REFUSING COMPLIANT WORK.
         The parser required the metres to follow a comma, so all seven cand-3
         prompts — which declare the ruled anchor as "at exactly 0.95m above the
         floor, running the full wall" — were refused for having no anchor at
         all. The round written to test the rule was generated against a tool
         that rejected obedience to it, and a refusal count that is noise reads
         exactly like one that is discrimination. */
      const seatPhrasing = join(dir, "seat.prompt.txt");
      writeFileSync(seatPhrasing, [
        "Gate anchor: wainscot chair-rail at exactly 0.95m above the floor, running the full wall",
        "Geometry: floorboards reach the bottom edge and the ceiling junction is visible."
      ].join("\n") + "\n");
      expect(lint([seatPhrasing]),
        "the metres are read wherever they stand on the line — this is the phrasing the seat actually writes")
        .toMatch(/^ok\s+.*seat\.prompt\.txt/m);

      const noSize = join(dir, "nosize.prompt.txt");
      writeFileSync(noSize, ["Gate anchor: the wainscot chair-rail, running the full wall"].join("\n") + "\n");
      expect(lint([noSize]), "a feature with no length is half a ruler")
        .toMatch(/row21:prompt\.no_gate_anchor/);

      /* And the clause the cand-3 round earned: an anchor is only declared when
         the datum it is measured from is in the picture. */
      const noDatum = join(dir, "nodatum.prompt.txt");
      writeFileSync(noDatum, [
        "Gate anchor: wainscot chair-rail at exactly 0.95m above the floor, running the full wall",
        "Geometry: No floor, no ceiling, and no corners appear."
      ].join("\n") + "\n");
      const noDatumOut = lint([noDatum]);
      expect(noDatumOut, "a height above a floor the frame forbids is not a length in that frame")
        .toMatch(/row21:prompt\.anchor_datum_forbidden/);
      expect(noDatumOut, "and it is that clause, not the one about declaring an anchor — this prompt declares a good one")
        .not.toMatch(/row21:prompt\.no_gate_anchor/);
      expect(lint([seatPhrasing]),
        "a frame that shows its floor keeps the same anchor without complaint")
        .not.toMatch(/row21:prompt\.anchor_datum_forbidden/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  /* [ROW 21, the close] THE CAND-3 ROUND, AND WHAT IT CLOCKED.
   *
   * The universal-anchor round is recipe validation and promotes nothing —
   * blueprint §11 rules the wainscot chair-rail at 0.95 m on every panelled
   * wall so that measurability is a property of the WALL SPEC rather than of
   * whichever feature a prompt asked for, and every cand-3 prompt declares it.
   * What the round is quoted for in `design/batches/row21-promotion/README.md`
   * is a MEMBERSHIP claim — nothing is admitted — and this is its reader.
   * Asserting the membership rather than the band is the shape row 20 paid for
   * twice: a band pinned against itself moves with the number it pins. */
  test("the cand-3 round admits nothing, and its control still reads the approved frame", () => {
    const dir = join(draftDir, "measured", "cand3");
    expect(existsSync(dir),
      "the cand-3 readings are gone — run measure.py --round cand3").toBe(true);
    let out = "";
    try {
      out = execFileSync("python3", [join(draftDir, "measured", "gate.py"), "--round", "cand3"],
        { cwd: repoRoot, encoding: "utf8", stdio: "pipe" });
    } catch (e) {
      out = String(e.stdout || "");
    }
    expect(out, "gate.py --round cand3 printed nothing — the tool did not run").toContain("facing");
    expect(out, "no cand-3 candidate is admitted; the standing-eye wave regenerates every wall")
      .toMatch(/\n0 of 8 admitted/);
    expect(out, "and the approved wall is read but not judged by a round it does not belong to")
      .toMatch(/study\/N .*NOT GATED/);

    const control = JSON.parse(readFileSync(join(dir, "study-N.json"), "utf8"))._control;
    expect(control.passed,
      `the cand-3 detectors no longer read the approved frame the way the promotion did: ${JSON.stringify(control.per_field)}`)
      .toBe(true);
    /* The control is a claim about the DETECTORS, so its fields are asserted
       against the committed promotion rather than against themselves. */
    expect(control.measured.wall_floor_line_y_px).toBe(777);
    expect(control.measured.dado_rail_above_floor_px).toBe(213);
  });

  /* [ROW 21, the close] EACH ROUND'S DATA LIVES WHERE ITS PROSE SAYS IT DOES.
   *
   * `SUMMARY.md` is the row-20 record and its tables are the cand-1 round's,
   * and `summary_tables.py` exists so those numbers can be REGENERATED and
   * diffed rather than retyped. It read `_raw.json` out of `measured/` itself,
   * which since row 21 has held the cand-2 promotion round — so the one file
   * whose whole job is to stop numbers being retyped was reprinting a different
   * round's numbers under this round's prose, and `--round cand1` overwrote the
   * promotion corpus in silence. Rounds have their own directories now, and
   * this asserts the binding the way the failure would have been caught: a row
   * the tool prints must appear in the prose verbatim. */
  test("SUMMARY.md's tables are the cand-1 round's own numbers, regenerated", () => {
    let out = "";
    try {
      out = execFileSync("python3", [join(draftDir, "measured", "summary_tables.py")],
        { cwd: repoRoot, encoding: "utf8", stdio: "pipe" });
    } catch (e) { out = String(e.stdout || ""); }
    const rows = out.split("\n").filter((l) => /^\| `(study|hall)\//.test(l));
    expect(rows.length, "summary_tables.py printed no per-facing rows").toBeGreaterThanOrEqual(8);
    const md = readFileSync(join(draftDir, "measured", "SUMMARY.md"), "utf8");
    const missing = rows.filter((r) => !md.includes(r.trimEnd()));
    expect(missing,
      "SUMMARY.md quotes numbers the cand-1 round no longer prints — regenerate it, or the round directories have been crossed")
      .toEqual([]);
    /* And the promotion corpus says which round it is, so a re-run of another
       round landing on top of it is visible rather than silent. */
    const promo = JSON.parse(readFileSync(join(draftDir, "measured", "study-N.json"), "utf8"));
    expect(promo._what_this_is,
      "design/plan-draft/measured/ is the promotion round's home and its own header no longer says so")
      .toContain("--round cand2");
  });

  /* [ROW 21, the close] THE BATCH QUOTES TWO GATE TABLES TO KABE, AND A QUOTED
   * TABLE IS A SECOND COPY OF A FACT. The row-20 batch shipped stale frames
   * because nothing could see them move; a stale TABLE is the same defect in
   * prose, and this project has already recorded one unread `before` column for
   * exactly this reason. Both tables are compared, line for line, against what
   * the tool prints today. The README may say anything it likes ABOUT the
   * numbers; the numbers themselves are the tool's. */
  test("the batch's gate tables are what gate.py prints, both rounds", () => {
    const readme = readFileSync(join(ROW21_DIR, "README.md"), "utf8");
    const blocks = [...readme.matchAll(/```\n(facing\s+standpt[\s\S]*?)```/g)]
      .map((m) => m[1].trimEnd().split("\n"));
    expect(blocks.length,
      "the batch carries two gate tables — the promotion round's and cand-3's")
      .toBe(2);
    const gate = (args) => {
      try {
        return execFileSync("python3",
          [join(draftDir, "measured", "gate.py"), ...args],
          { cwd: repoRoot, encoding: "utf8", stdio: "pipe" });
      } catch (e) { return String(e.stdout || ""); }
    };
    const rounds = [[], ["--round", "cand3"]];
    blocks.forEach((quoted, i) => {
      const printed = gate(rounds[i]).split("\n");
      const head = printed.findIndex((l) => l.startsWith("facing"));
      expect(head, `gate.py ${rounds[i].join(" ")} printed no table`).toBeGreaterThanOrEqual(0);
      const actual = printed.slice(head, head + quoted.length).map((l) => l.trimEnd());
      expect(actual,
        `design/batches/row21-promotion/README.md quotes a gate table the tool no longer prints (round ${i === 0 ? "cand-2" : "cand-3"}) — re-run gate.py and paste what it says`)
        .toEqual(quoted.map((l) => l.trimEnd()));
    });
  });

  test("the cand-2 corpus is the lint's clock baseline, and the numbers are read not quoted", () => {
    const prompts = readdirSync(join(repoRoot, "backdrops", "source"))
      .filter((d) => d !== "refs")
      .map((d) => join(repoRoot, "backdrops", "source", d, "cand-2.prompt.txt"))
      .filter((p) => existsSync(p));
    expect(prompts.length, "eight cand-2 prompts, one per facing").toBe(8);
    const out = lint(prompts);
    const count = (re) => (out.match(re) || []).length;
    /* The seven regenerated walls carry the contradiction; study/N's own
       prompt is not a re-ask and does not. This is the number the architecture
       and the batch quote, asserted here so quoting it cannot go stale. */
    expect(count(/row21:prompt\.contradictory_scale/g),
      "five of the seven re-asks forbid the correction they ask for").toBe(5);
    expect(count(/row21:prompt\.no_gate_anchor/g),
      "and not one of the eight declares what the gate should measure").toBe(8);
    expect(count(/row21:prompt\.unmeasurable_by_design/g),
      "two ask for a frame nothing can measure").toBe(2);
    expect(out, "every one of them is refused — the corpus is grandfathered, not compliant")
      .toMatch(/8 of 8 prompt\(s\) refused/);
  });

  /* [ROW 21] AND THE PAINTED BATCH ANSWERS FOR ITSELF THE SAME WAY. Every
   * future batch copies this shape: the script that made the frames is
   * committed beside them, the suite re-runs it, and an artifact nobody can
   * regenerate is not derived — it is just a file. This one re-renders against
   * TODAY's build, because these are pictures of what the link serves now; the
   * row-20 batch re-renders against the build that drew it, because those are
   * pictures of a build that has been superseded and whose verdict is still
   * outstanding. */
  const ROW21_DIR = join(repoRoot, "design", "batches", "row21-promotion");

  test("the row-21 batch IS what the code draws — every frame re-rendered and compared", async ({ browserName }) => {
    test.setTimeout(180_000);
    /* ONCE, not once per engine. This case launches its own Chromium through
       `capture.mjs` and renders eleven frames; running it again under the
       Firefox project measures nothing new about the frames and doubles a
       minute of work, which on a loaded machine is what turned it red twice.
       The engine under test is irrelevant to a claim about a script. */
    test.skip(browserName !== "chromium", "the batch is captured in Chromium whatever engine this project runs");
    expect(existsSync(join(ROW21_DIR, "capture.mjs")),
      "the batch must carry the script that made it").toBe(true);
    const out = mkdtempSync(join(tmpdir(), "holo-row21-"));
    try {
      const log = execFileSync("node", [join(ROW21_DIR, "capture.mjs"), out],
        { cwd: repoRoot, encoding: "utf8", stdio: "pipe" });
      const fresh = readdirSync(out).filter((f) => f.endsWith(".png")).sort();
      expect(fresh.length, "capture.mjs produced no frames").toBeGreaterThan(8);
      const stale = [];
      for (const f of fresh) {
        const committed = join(ROW21_DIR, f);
        if (!existsSync(committed)) { stale.push(`${f} (missing from the batch)`); continue; }
        if (!readFileSync(committed).equals(readFileSync(join(out, f)))) stale.push(f);
      }
      expect(stale,
        "these batch frames are not what the code draws — re-run design/batches/row21-promotion/capture.mjs into the batch")
        .toEqual([]);
      const committedFrames = readdirSync(ROW21_DIR)
        .filter((f) => /^\d\d-/.test(f) && f.endsWith(".png")).sort();
      expect(committedFrames, "a frame the script draws is missing from the set a human is shown")
        .toEqual(fresh);
      /* And each frame is of what its name promises: the script prints the
         viewstate it actually reached, so renaming a row of FRAMES cannot be
         green by construction. */
      const reached = Object.fromEntries(
        log.split("\n").map((l) => /^(\S+) -> (\S+)$/.exec(l)).filter(Boolean)
          .map((m) => [m[1], m[2]]));
      for (const f of fresh) {
        const name = f.replace(/\.png$/, "");
        const m = /^\d\d-(?:demo-)?(study|hall)-([NESW])(?:-|$)/.exec(name);
        expect(m, `${name}: a batch frame's name must say which room and facing it is`).toBeTruthy();
        expect(reached[name], `${name} is named for ${m[1]}/${m[2]} and was captured at ${reached[name]}`)
          .toBe(`${m[1]}/${m[2]}`);
      }
    } finally {
      rmSync(out, { recursive: true, force: true });
    }
  });

  /* The batch's two schematics ARE the live sheets — same bytes, not a copy
     that was true once. A round-4 critic found the batch's pair still printing
     a drift notice the live sheets no longer carry, because the pictures were
     older than the drawing that made them. */
  test("the batch's schematics are the live sheets, byte for byte", () => {
    test.skip(!pendingScope(), "the batch has been retired: approval.lock carries no `pending` line");
    const dir = BATCH_DIR;
    for (const [batch, live] of [["12-schematic-ground.png", "manor-ground.png"],
                                 ["13-schematic-upper.png", "manor-upper.png"]]) {
      expect(readFileSync(join(dir, batch)).equals(readFileSync(join(draftDir, live))),
        `${batch} is not the sheet the drawing now produces — re-copy it from design/plan-draft/`)
        .toBe(true);
    }
  });

  /* THE SCOPE LINE IS REQUIRED, NOT MERELY PERMITTED. §12 makes it the whole
   * mitigation for an APPROVED stamp over a drawing nobody has seen — *"a
   * stamp that says APPROVED without saying of what would be the picture lying
   * about the document"* — and `approval.lock`'s own header says *"an agent
   * that could move them could approve its own drawing"*. A round-5 critic
   * deleted the `pending` line, re-ran the documented redline workflow, and
   * both sheets printed a bare `APPROVED 2026-08-21` with the suite green:
   * neither digest moves, so `UNAPPROVED REVISION` never fires, and the
   * caption clause excludes the provenance line by name. An agent could widen
   * the approval's apparent scope without touching a hash.
   *
   * The reader has to sit OUTSIDE the lock, or it is the lock checking itself.
   * It sits on the batch, coupled to the lock by the case above so that neither
   * can be switched off alone. */
  test("while the batch is out, the sheets say what the approval does NOT cover", () => {
    const scope = pendingScope();
    test.skip(!scope, "the batch has been retired: approval.lock carries no `pending` line");
    expect(scope.length,
      "the pending line must name the drawn content the anchor rests on by inference").toBeGreaterThan(20);
    for (const f of ["manor-ground.svg", "manor-upper.svg"]) {
      const svg = readFileSync(join(draftDir, f), "utf8");
      /* Read from the stamp's LINES joined, not from the raw file: the stamp
         wraps, so a `pending` clause whose wrap point falls inside the first
         forty characters would fail a raw `toContain` on a sheet that is
         printing it perfectly. A guard that does not know its subject wraps is
         the same defect in a smaller costume. */
      const stamp = stampText(svg);
      expect(stamp, `${f}: the stamp prints APPROVED without printing what it does not cover`)
        .toContain("AWAITING HIS EYE ON");
      expect(stamp, `${f}: the stamp must name the pending scope, not merely the words`)
        .toContain(scope);
    }
  });

  /* AND THE SCOPE LINE MUST NAME ITS SUBJECT, not merely be twenty characters
   * of something.
   *
   * The clause above asked for a length and for the stamp to print it, and a
   * critic set `pending` to *"the sheet border and the scale bar"*: both sheets
   * then printed `AWAITING HIS EYE ON: the sheet border and the scale bar.` and
   * every case stayed green, with the standpoint markers — the drawn content
   * the entire anchor rests on by inference — silently folded under APPROVED.
   * Deleting the line was caught; narrowing it to a lie was not.
   *
   * The first repair read the clause against what actually moved and demanded
   * the moved family be NAMED — a word-presence test, and a critic negated it
   * in the guard's own vocabulary: `pending  the standpoint distances and the
   * wall widths are exactly as he approved them; nothing on this sheet needs
   * his eye` printed on both sheets with every case green. Round 5 could be
   * defeated by naming the wrong subject; that repair could be defeated by
   * naming the right subject and negating it, which is worse, because the
   * failure reads as compliance.
   *
   * SO NO SENTENCE OF ANYONE'S CARRIES THE CLAIM. The clause is DERIVED from
   * the delta — which family moved, on how many facings — and the lock carries
   * that derived string and no other. Its home is `scopeFromDelta` below;
   * `approval.lock` holds a byte-checked copy the way `render.lock` holds a
   * hash, and the sheet prints it. There is no prose left to negate: any edit
   * to the line, in any direction, is a string that is not the computed one. */
  function standpointDelta() {
    const rows = (t) => t.trim().split("\n").map((l) => l.split("\t"));
    const then = rows(execFileSync("git", ["show", `${SEEN_SHEET_COMMIT}:design/plan-draft/standpoints.tsv`],
      { cwd: repoRoot, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }));
    const now = rows(readFileSync(join(draftDir, "standpoints.tsv"), "utf8"));
    return { then, now };
  }

  /* Each drawn family the sheet prints, the column that carries it, and the
     words the derived clause uses for it. Only families that MOVED appear, so
     the clause cannot be satisfied by naming everything. */
  const FAMILIES = [
    { column: "camera_wall_m", said: "the standpoint distances" },
    { column: "wall_width_m", said: "the wall widths" },
    { column: "room_type", said: "the room types" },
    { column: "facing_type", said: "the facing types" }
  ];

  function scopeFromDelta(then, now) {
    const head = then[0];
    const moved = [], changedRows = new Set();
    for (const fam of FAMILIES) {
      const i = head.indexOf(fam.column);
      if (i < 0) return { error: `standpoints.tsv has no ${fam.column} column` };
      let differs = then.length !== now.length;
      for (let r = 1; r < Math.min(then.length, now.length); r++) {
        if (then[r][i] !== now[r][i]) { differs = true; changedRows.add(r); }
      }
      if (differs) moved.push(fam);
    }
    if (!moved.length) return { moved, sentence: null };
    /* "the manor's N facings", never "this sheet draws". The count is over the
       whole table and BOTH sheets print the clause, so a per-sheet phrasing is
       false on both of them: manor-ground draws 56 facings, manor-upper 32,
       and a person holding the ground sheet was being told it drew 88. The
       derivation removed the author's ability to negate the caption and, for
       one commit, everyone's ability to notice it was inaccurate — a byte-check
       reproduces an error as faithfully as a truth. Either the count is scoped
       to the sheet or the words are true wherever they are printed; this takes
       the second, and the test compares against the same scoping the sheet
       prints. */
    const sentence = `${moved.map((f) => f.said).join(" and ")} on `
      + `${changedRows.size} of the manor's ${now.length - 1} facings, `
      + `changed since the sheet he approved`;
    return { moved, sentence };
  }

  test("the pending clause is DERIVED from what moved — no sentence of anyone's carries the claim", () => {
    const scope = pendingScope();
    test.skip(!scope, "the batch has been retired: approval.lock carries no `pending` line");
    expect(execFileSync("git", ["rev-parse", "--short", SEEN_SHEET_COMMIT],
      { cwd: repoRoot, encoding: "utf8" }).trim()).toBe(SEEN_SHEET_COMMIT);

    const { then, now } = standpointDelta();
    expect(now[0], "the standpoint table's columns changed; this comparison no longer knows what it is comparing")
      .toEqual(then[0]);
    const d = scopeFromDelta(then, now);
    expect(d.error).toBeUndefined();
    expect(d.sentence,
      "nothing the sheet draws has moved since Kabe last saw one, so the `pending` line is a claim about nothing — retire it")
      .not.toBeNull();
    expect(scope,
      `approval.lock's \`pending\` line is not the derived scope. Write exactly:\n\npending  ${d.sentence}\n\nand re-run draw_plan.py and render.sh. The line is computed from standpoints.tsv against ${SEEN_SHEET_COMMIT}, not composed — a clause a person writes is a clause a person can negate.`)
      .toBe(d.sentence);

    /* AND THE LOCK'S PROSE STATES NO COUNT, WHICH IS WHY THERE IS NO SECOND
       ASSERTION HERE. The commentary once read "Forty-two of the manor's
       eighty-eight standpoints moved" — no baseline's answer, typed into a
       comment and read by nothing, eighteen lines above a derived line saying
       38. The first repair put the right number in the prose and matched it
       with `/(\d+) of the manor's (\d+) facings/`; a critic typed the original
       false sentence straight back in — words, and the noun "standpoints" —
       and the suite stayed green, along with three other phrasings. **A pattern
       enumerating one spelling cannot hold prose.** So the count lives exactly
       once, in the clause the line above computes, and the paragraph points at
       it instead of restating it. [Navigator's ruling at the row-20 close,
       2026-08-22, taking the critic's own first constraint: when prose states
       no number, there is no number for prose to get wrong — which is the
       argument the `pending` line itself won on.] */
  });

  test("the derived drawing's geometry is Kabe's approved geometry, unchanged", () => {
    for (const f of ["manor-ground.svg", "manor-upper.svg"]) {
      const approved = geometryOnly(approvedBlob(`design/plan-draft/${f}`).toString("utf8"));
      const now = geometryOnly(readFileSync(join(draftDir, f), "utf8"));
      expect(sha256(now), `${f}: the derived render's geometry left the approved drawing`)
        .toBe(sha256(approved));
    }
  });

  test("the standpoint table — pure geometry, no prose — byte-equals the approved one", () => {
    expect(readFileSync(join(draftDir, "standpoints.tsv"))
      .equals(approvedBlob("design/plan-draft/standpoints.tsv"))).toBe(true);
  });

  test("and only the two caption strings differ from the approved sheets", () => {
    for (const f of ["manor-ground.svg", "manor-upper.svg"]) {
      const approved = approvedBlob(`design/plan-draft/${f}`).toString("utf8");
      const now = readFileSync(join(draftDir, f), "utf8");
      /* The PROVENANCE stamp is excluded, and deliberately. It is the stamp,
         not a caption: it restates itself on every render from the lock's
         state, its font size is fitted to the sheet's own width, and the four
         tests above already hold it to a much harder standard than "did it
         move". Judging it here would make the caption clause red for the one
         string whose whole job is to change when the document does.

         Excluded by its BAND, not by matching its first line's wording. The
         earlier filter matched "holo-emitter - overhead plan", which only the
         stamp's FIRST line carries — so the day the stamp wrapped, its
         continuation line arrived in the caption set as an extra element, the
         counts stopped matching and this case went red over a stamp that had
         moved exactly as designed. */
      const texts = (t) => {
        const stamp = stampLines(t);
        expect(stamp.length,
          "the sheet prints no provenance stamp in its header band").toBeGreaterThan(0);
        return (t.match(/<text[^>]*>[\s\S]*?<\/text>/g) || [])
          .filter((el) => !stamp.includes(el));
      };
      const a = texts(approved), b = texts(now);
      expect(b.length).toBe(a.length);
      const moved = a.map((x, i) => [x, b[i]]).filter(([x, y]) => x !== y);
      /* Zero until the next redline. Row 20's re-anchor points at the commit
         that carries these sheets, so the approved blob IS this render; the
         bound stays at two because the clause is about what a REDLINE may
         change, and the two captions row 12 corrected are the precedent it was
         written from. */
      expect(moved.length, `${f}: more than the caption strings moved`).toBeLessThanOrEqual(2);
      for (const [x] of moved) expect(x).toMatch(/DRAFT for redline|checked by the drawing/);
    }
  });

  test("the geometry hash moves when a room moves, so it is not a decoration", () => {
    const dir = stagePlanTree();
    try {
      const fx = join(dir, "fixtures", "demo-study");
      // One party wall slides; the two rooms either side take up the slack, so
      // the floor still tiles and the plan still validates — only the picture
      // moves. Which wall is read out of the document (see shiftPartyWall), so
      // a real redline cannot collide with this test's coordinates.
      const staged = readJson(join(fx, "plan.json"));
      shiftPartyWall(staged, 0.4);
      const p = rebuildFacings(staged);
      expect(validatePlan(p, WORLD, BY_ENTITY)).toEqual([]);
      writeFileSync(join(fx, "plan.json"), JSON.stringify(p));
      python([join(dir, "design", "plan-draft", "draw_plan.py")], dir);
      const svg = readFileSync(join(dir, "design", "plan-draft", "manor-ground.svg"), "utf8");
      const approved = geometryOnly(approvedBlob("design/plan-draft/manor-ground.svg").toString("utf8"));
      expect(sha256(geometryOnly(svg))).not.toBe(sha256(approved));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  /* The PNG is the artifact a human actually looks at, and it is the one this
   * row's gate runs on. Its bytes come from this machine's browser, so they
   * cannot be regenerated for comparison — but `render.lock`, written by
   * render.sh, records which SVG each PNG was rasterised from and what the PNG
   * hashed to. A redline that runs draw_plan.py and forgets render.sh leaves a
   * PNG whose recorded source no longer matches the committed SVG; a swapped
   * or hand-edited PNG no longer matches its recorded hash. Both go red here.
   * (Before this lock existed, dropping the pre-row-12 PNG in its place passed
   * the whole suite.) */
  test("render.lock ties each committed PNG to the SVG it was rasterised from", () => {
    const lock = readFileSync(join(draftDir, "render.lock"), "utf8").trim().split("\n");
    expect(lock.length).toBe(2);
    for (const line of lock) {
      const m = /^(\S+)\s+svg=([0-9a-f]{64})\s+png=([0-9a-f]{64})$/.exec(line);
      expect(m, `render.lock line not parseable: ${line}`).toBeTruthy();
      const [, name, svgHash, pngHash] = m;
      expect(sha256(readFileSync(join(draftDir, name + ".svg"))),
        `${name}.png was rasterised from a different ${name}.svg — run ./design/plan-draft/render.sh`)
        .toBe(svgHash);
      expect(sha256(readFileSync(join(draftDir, name + ".png"))),
        `${name}.png is not the file render.sh produced`)
        .toBe(pngHash);
    }
  });

  test("each PNG is its SVG artboard at 2×", () => {
    for (const name of ["manor-ground", "manor-upper"]) {
      const svg = readFileSync(join(draftDir, name + ".svg"), "utf8");
      const w = Number(/<svg[^>]*width="(\d+)"/.exec(svg)[1]);
      const h = Number(/<svg[^>]*height="(\d+)"/.exec(svg)[1]);
      const png = readFileSync(join(draftDir, name + ".png"));
      // PNG IHDR: 8-byte signature, 4-byte length, "IHDR", then width, height
      expect(png.readUInt32BE(16), `${name} width`).toBe(2 * w);
      expect(png.readUInt32BE(20), `${name} height`).toBe(2 * h);
      expect(statSync(join(draftDir, name + ".png")).size).toBeGreaterThan(1000);
    }
  });
});

/* --------------------------------------------------------------- the report */

/* THE SHEET'S FACE HAS TO HOLD THE SENTENCE IT PRINTS. §12 says the approval
 * scope is what "the sheet prints on its own face", and architecture.md says a
 * stamp that says APPROVED without saying of what is the picture lying about
 * the document. A round-4 critic measured ink at column 3039 of a 3040-px
 * render: the stamp ran off the right edge and ended mid-word, in the live
 * sheets and in the batch. SVG does not wrap, and nothing was looking.
 *
 * `draw_plan.py` wraps it now and REFUSES a word wider than the column. This
 * asks the picture instead of the drawing code, because the drawing code's
 * width estimate is the thing most likely to be wrong. */
test.describe("the approval stamp fits inside the paper", () => {
  const SHEETS = ["manor-ground", "manor-upper"];

  for (const sheet of SHEETS) {
    test(`${sheet}: no stamp ink reaches the sheet edge`, async ({ page }) => {
      const png = readFileSync(join(draftDir, `${sheet}.png`)).toString("base64");
      /* THE BAND STOPS ABOVE THE RULE, and it used not to. The sampled rows
         were 140..235 at 2×, and round 5 moved the header rule down into that
         window — a full-width line from SVG x 40 to 1480, which is device
         column 80 to 2960, exactly the two margins. It pinned `lo` at 80 and
         `hi` at 2960 by itself: patching `draw_plan.py` to print NO stamp text
         at all, re-rendering and re-rasterising left both cases green, with
         `expect(ink.hi).toBeGreaterThan(0)  // there IS a stamp` satisfied by
         a horizontal rule. The rule's y is read off the sheet, so the band
         follows it wherever the stamp's line count puts it. */
      const ruleY = headerRule(readFileSync(join(draftDir, `${sheet}.svg`), "utf8")).y;
      const y0 = 140, h = Math.round(ruleY * 2) - 6 - y0;
      expect(h, `${sheet}: the header band has collapsed; there is no room left to measure the stamp in`)
        .toBeGreaterThan(20);
      const ink = await page.evaluate(async ({ b64, y0, h }) => {
        const img = new Image();
        img.src = "data:image/png;base64," + b64;
        await img.decode();
        const c = document.createElement("canvas");
        c.width = img.width; c.height = img.height;
        const g = c.getContext("2d");
        g.drawImage(img, 0, 0);
        const band = g.getImageData(0, y0, img.width, h).data;
        let lo = img.width, hi = -1;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < img.width; x++) {
            const i = (y * img.width + x) * 4;
            if (band[i] < 230 || band[i + 1] < 230 || band[i + 2] < 230) {
              if (x < lo) lo = x;
              if (x > hi) hi = x;
            }
          }
        }
        return { lo, hi, w: img.width };
      }, { b64: png, y0, h });
      expect(ink.hi, `${sheet}: the header band above the rule carries no ink at all — the sheet is printing no stamp`)
        .toBeGreaterThan(0);
      /* The sheet's margin is 40 SVG units, 80 device px at 2x. Ink inside the
         margin on either side means the line was laid out to the paper. */
      expect(ink.lo, `${sheet}: stamp ink starts left of the margin`).toBeGreaterThanOrEqual(72);
      expect(ink.w - 1 - ink.hi, `${sheet}: stamp ink runs into the right margin — it is being clipped by the sheet edge`)
        .toBeGreaterThanOrEqual(72);
    });
  }

  test("and the drawing refuses a stamp too long for the column", () => {
    const src = readFileSync(join(repoRoot, "design", "plan-draft", "draw_plan.py"), "utf8");
    expect(src).toMatch(/def fit_size_px\(/);
    expect(src, "fit_size_px must refuse rather than overflow").toMatch(/raise SystemExit/);
    let refused = false;
    try {
      execFileSync("python3", ["-c",
        "import sys; sys.path.insert(0,'design/plan-draft'); import draw_plan as d; d.fit_size_px('x'*400, 1440, 10, 7.5)"],
        { cwd: repoRoot, encoding: "utf8", stdio: "pipe" });
    } catch (e) {
      refused = /does not fit/.test(String(e.stderr || e.stdout || e.message));
    }
    expect(refused, "a 400-character stamp did not make the drawing refuse").toBe(true);
  });

  /* The width model the wrap trusts is a table of glyph advances. If the table
     drifts from the font the SVG actually names, the wrap silently starts
     lying — so regenerate it from the font and compare, where the font is
     present. */
  test("the glyph-advance table still matches DejaVu Sans", () => {
    let out;
    try {
      out = execFileSync("python3", ["-c", `
from PIL import ImageFont
import sys; sys.path.insert(0, 'design/plan-draft')
import draw_plan as d
f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 1000)
bad = [c for c, w in d._ADV.items() if round(f.getlength(chr(c))) != w]
print(len(bad), bad[:5])
`], { cwd: repoRoot, encoding: "utf8", stdio: "pipe" });
    } catch {
      test.skip(true, "PIL or the DejaVu font is not present here");
      return;
    }
    expect(out.trim().startsWith("0 "), `advance table drifted from the font: ${out.trim()}`).toBe(true);
  });
});

test.describe("the projection report", () => {
  test("byte-equals a fresh run of the generator", () => {
    const fresh = report(PLAN, STAGING, BY_ENTITY);
    const committed = readFileSync(join(draftDir, "projection.md"), "utf8");
    expect(fresh === committed,
      "stale report — run: node tools/plan-projection.mjs --write").toBe(true);
  });

  /* THE BYTE-EQUALITY ABOVE COMPARES THE DOCUMENT TO ITSELF, and a round-4
   * critic showed what that misses: the facing table printed `undefined` in
   * the camera column of all 88 rows for a whole row, because row 20 deleted
   * the `camera` meta field while `plan.spec` separately asserted on every
   * derived meta that the field IS gone. Two statements in one repo, one
   * asserting a field's absence and one printing it into a document a human
   * reads, and a generator faithfully reproducing the mistake on every run.
   * So: at least one assertion about the report's CONTENT that its own
   * generator cannot satisfy by being consistent. */
  test("the report prints no absent field — no undefined, NaN or null in any row", () => {
    const md = readFileSync(join(draftDir, "projection.md"), "utf8");
    const rows = md.split("\n").filter((l) => l.startsWith("| ") && l.includes(" | "));
    expect(rows.length).toBeGreaterThan(88);
    const bad = rows.filter((l) => /\|\s*(undefined|NaN|null)\s*\|/.test(l));
    expect(bad.slice(0, 3), `${bad.length} table cells print a field that does not exist`).toEqual([]);
  });

  test("and the standpoint column carries the plan's own tokens, not a stale field", () => {
    const md = readFileSync(join(draftDir, "projection.md"), "utf8");
    const header = md.split("\n").find((l) => l.startsWith("| floor | room | facing |"));
    expect(header).toContain("| standpoint |");
    const col = header.split("|").map((s) => s.trim()).indexOf("standpoint");
    const seen = new Set();
    for (const l of md.split("\n")) {
      if (!/^\| (ground|upper) \| /.test(l)) continue;
      seen.add(l.split("|").map((s) => s.trim())[col]);
    }
    // every value is a legal token, and the row's own branch is really in there
    for (const v of seen) expect(["rule", "threshold", "drawn"]).toContain(v);
    expect(seen.has("threshold"), "the report shows no thresholded standpoint at all").toBe(true);
    expect(seen.has("rule"), "the report shows no ruled standpoint at all").toBe(true);
  });

  /* A WELL-FORMED WRONG NUMBER IS THE ONE THING THE TWO CHECKS ABOVE CANNOT
   * SEE. They catch absent-field markers and illegal tokens; a round-5 critic
   * swapped the two corner columns in the generator and all 88 rows printed
   * their corners reversed with the suite green — in the table
   * `architecture.md` hands to row 4 for its prompt sheets. So one numeric
   * column gets a reader that is not the generator: `LIT`, the test-side
   * literals typed from the approved standpoint sheet, which is the same
   * independence rule §12.5 states for every other number in this suite. */
  test("the facing table's corner columns are read by something other than the generator", () => {
    const md = readFileSync(join(draftDir, "projection.md"), "utf8");
    const header = md.split("\n").find((l) => l.startsWith("| floor | room | facing |"));
    const cols = header.split("|").map((x) => x.trim());
    const iFacing = cols.indexOf("facing"), iRoom = cols.indexOf("room");
    const i0 = cols.indexOf("corner_x0_px"), i1 = cols.indexOf("corner_x1_px");
    expect(Math.min(iFacing, iRoom, i0, i1)).toBeGreaterThan(-1);
    const seen = [];
    for (const line of md.split("\n")) {
      if (!/^\| (ground|upper) \| /.test(line)) continue;
      const c = line.split("|").map((x) => x.trim());
      if (!/^(STUDY|CROSS PASSAGE)$/.test(c[iRoom])) continue;
      const loc = c[iRoom] === "STUDY" ? "study" : "hall";
      /* [Row 21] The DERIVED literals, deliberately: `projection.md` is the
         plan's own projection report and prints what the plan implies, so a
         painted facing's measured corners are not what this table is about.
         Naming which of the two a reader means is the whole point of keeping
         both. */
      const lit = LIT.derivedFacing(loc, c[iFacing]);
      if (lit.corner_x0_px == null) continue;
      seen.push(`${loc}/${c[iFacing]}`);
      expect(Number(c[i0]), `${loc}/${c[iFacing]} corner_x0_px: the report prints ${c[i0]}, the approved sheet gives ${lit.corner_x0_px.toFixed(1)}`)
        .toBeCloseTo(lit.corner_x0_px, 0);
      expect(Number(c[i1]), `${loc}/${c[iFacing]} corner_x1_px: the report prints ${c[i1]}, the approved sheet gives ${lit.corner_x1_px.toFixed(1)}`)
        .toBeCloseTo(lit.corner_x1_px, 0);
      expect(Number(c[i0]), `${loc}/${c[iFacing]}: corner_x0_px is not left of corner_x1_px — the columns are swapped`)
        .toBeLessThan(Number(c[i1]));
    }
    expect(seen.length, "no cornered facing of the demo's two rooms was found in the report").toBeGreaterThanOrEqual(6);
  });

  /* Round-4 finding F4: almost every pointer into this report resolved to the
   * wrong section, in the report itself and in the two documents that outlive
   * the row. Prose about prose is not a check, so this is one. */
  test("every §N pointer in the report resolves to a section the report has", () => {
    const md = readFileSync(join(draftDir, "projection.md"), "utf8");
    const headings = new Set([...md.matchAll(/^## (\d+)\. /gm)].map((m) => m[1]));
    expect(headings.size).toBeGreaterThan(5);
    // and they are emitted IN ORDER, so a reader scrolling finds §8 after §7
    const order = [...md.matchAll(/^## (\d+)\. /gm)].map((m) => Number(m[1]));
    expect(order).toEqual([...order].sort((a, b) => a - b));
    /* A parenthesised "(§N)" is the report pointing at ITSELF — the form §0's
     * ten questions use, and the exact form that was wrong in every case the
     * round-4 critic checked. A bare §N in running prose may be the
     * blueprint's (§5, §10, §11, §12.5 all appear here by name), so those are
     * out of scope for a mechanical check and stay a reader's job. */
    const bad = [];
    for (const m of md.matchAll(/\(§(\d+)\)/g)) {
      if (!headings.has(m[1])) {
        bad.push(`(§${m[1]}) near "${md.slice(Math.max(0, m.index - 60), m.index).slice(-50)}"`);
      }
    }
    expect(bad).toEqual([]);
    expect([...md.matchAll(/\(§(\d+)\)/g)].length).toBeGreaterThan(4);
  });

  /* And the two documents that outlive the row point at the right sections. */
  test("architecture.md, blueprint §4b and the draft README cite sections that exist", () => {
    const md = readFileSync(join(draftDir, "projection.md"), "utf8");
    const headings = new Set([...md.matchAll(/^## (\d+)\. /gm)].map((m) => m[1]));
    const bad = [];
    for (const f of [join(repoRoot, "design", "architecture.md"),
      join(repoRoot, "design", "blueprint.md"), join(draftDir, "README.md")]) {
      const text = readFileSync(f, "utf8");
      for (const m of text.matchAll(/projection\.md`? §(\d+)/g)) {
        if (!headings.has(m[1])) bad.push(`${f.split("/").pop()}: projection.md §${m[1]}`);
      }
    }
    expect(bad).toEqual([]);
    // §0's question count, quoted in the blueprint, is computed not typed
    const n = (md.match(/^## 0\. What needs Kabe$[\s\S]*?^## 1\./m)[0]
      .match(/^\d+\. \*\*/gm) || []).length;
    expect(readFileSync(join(repoRoot, "design", "blueprint.md"), "utf8"))
      .toMatch(new RegExp(`§0 lists the ${["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"][n]} questions`));
  });

  test("carries the questions this row cannot answer, so they outlive the spec file", () => {
    const md = readFileSync(join(draftDir, "projection.md"), "utf8");
    for (const needle of [
      "1.83", "−8° pitch", "door1", "entrance approach", "D4",
      "chimney breast", "Muniment Room"
    ]) {
      expect(md, `the report drops "${needle}"`).toContain(needle);
    }
  });
});
