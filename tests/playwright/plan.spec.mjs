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
import { test, expect, repoRoot, bake } from "./helpers.mjs";
import { readFileSync, writeFileSync, cpSync, mkdirSync, mkdtempSync, rmSync, existsSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  validatePlan, planWarnings, drawn, ruleStandpoint, measuredDistance,
  facingOfOpening, FACINGS
} from "../../tools/validate-plan.mjs";
import {
  deriveMeta, projectPlacement, projectEntity, stagingDivergence,
  inverseProjectPlacement, shippedMeta, facingsContaining, report,
  assertCameraConsistent, needsWideView, pinnedWallInFrame, horizonGate,
  GRID_CAMERA, CONTRACT_CAMERA, KNOWN_DIVERGENCES, STAGING_TOLERANCE,
  facingCarriers, cameraFeetReport, WALL_MAP_11, WIDE_VIEW_POLICIES, CANVAS_W
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
/* The schematic's drawn geometry, with every <text> element removed. */
const geometryOnly = (svgText) => svgText.replace(/<text[^>]*>[\s\S]*?<\/text>/g, "");

function python(args, cwd) {
  return execFileSync("python3", args, { encoding: "utf8", cwd });
}

/* A scratch copy of everything the derived render touches, so a test can run
 * the real script — validator call and all — without writing into the repo. */
function stagePlanTree() {
  const dir = mkdtempSync(join(tmpdir(), "holo-plan-"));
  mkdirSync(join(dir, "design"));
  for (const p of ["src", "tools", "fixtures"]) cpSync(join(repoRoot, p), join(dir, p), { recursive: true });
  cpSync(draftDir, join(dir, "design", "plan-draft"), { recursive: true });
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

  test("the three true-but-unfixable facts are reported as warnings, not hidden and not blocking", () => {
    const w = planWarnings(PLAN, BY_ENTITY).join("\n");
    expect(w).toMatch(/desk1.*chimney breast of "study"/);
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
  ["overlap", /overlap/i, (p) => { room(p, "study").rect.y1 = 16.0; }],
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
  ["the standpoint is where the rule puts it", /is not the ruled one/i,
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
  ["law (b): a claimed wall must actually stand", /law \(b\).*no exterior or garden wall stands/i,
    (p) => { p.wall_bands = p.wall_bands.filter((b) => b.kind !== "garden"); }],
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
    (p) => { room(p, "study").facings.N.standpoint_source = "measured"; }]
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
    expect(PLAN.canvas_w_px).toBeUndefined();
    expect(CANVAS_W).toBe(1536);
    const wide = deriveMeta(PLAN, "study", "N", { canvasW: 3072 });
    expect(wide.corner_x1_px - wide.corner_x0_px).toBeCloseTo(5.45 * 96, 9);
    expect(wide.corner_x0_px).toBeCloseTo(3072 / 2 - 5.45 / 2 * 96, 9);
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
    const shelfU = projectPlacement(PLAN, "shelf1", "hall", "N", deriveMeta(PLAN, "hall", "N")).u;
    const butteryDoor = facingCarriers(PLAN, "hall", "N")[0];
    // §11's note: "The shelf sits at u = 0.30; the drawn buttery door is at the
    // far end of the same wall, so they do not fight."
    expect(butteryDoor.u - shelfU).toBeGreaterThan(0.3);
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
    expect(validatePlan(PLAN, w, BY_ENTITY).join("\n")).toMatch(/which no plan opening carries/);
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
  test("is the shipped grid camera, and it is imported rather than typed", () => {
    expect(GRID_CAMERA.eye_m).toBeCloseTo(1.6, 9);
    expect(GRID_CAMERA.pitch_deg).toBe(0);
    expect(GRID_CAMERA.source).toMatch(/GRID_META/);
  });

  /* deriveMeta reproducing GRID_META is an identity, not evidence — the eye
   * height is derived back out of GRID_META. This is the check that CAN fail:
   * §5 states the floor twice and the two statements agree only for one
   * px_per_m_at_bottom. */
  test("§5's horizon device and §5's scale lerp still agree in grid canonical meta", () => {
    expect(assertCameraConsistent()).toEqual([]);
  });

  test("and that check goes red when they stop agreeing", () => {
    const { GRID_META } = require(join(repoRoot, "src", "renderer.js"));
    expect(assertCameraConsistent({ ...GRID_META, px_per_m_at_bottom: 210 }).length).toBeGreaterThan(0);
    expect(assertCameraConsistent({ ...GRID_META, horizon_y: 0.30 }).length).toBeGreaterThan(0);
  });

  /* Blueprint §5's camera-has-feet gate carried 1.6 m until row 3 propagated
   * Kabe's six-foot ruling into it. Grid canonical was authored against 1.6
   * and has not moved, so the gate now fails on it by 0.0016. Row 12 neither
   * created that nor can fix it — moving grid canonical moves every shipped
   * pixel — and this case pins the number so it cannot drift unnoticed. */
  test("§5's horizon gate passes grid canonical at 1.6 m and fails it at the ruled 1.83 m", () => {
    const { GRID_META } = require(join(repoRoot, "src", "renderer.js"));
    const at16 = horizonGate(GRID_META, 1.6);
    expect(at16.passes).toBe(true);
    expect(at16.residual).toBeCloseTo(0, 9);
    const at183 = horizonGate(GRID_META, 1.83);
    expect(at183.passes).toBe(false);
    expect(at183.residual).toBeCloseTo(Math.abs(0.48 - (0.63 - 1.83 * 96 / 1024)), 9);
    expect(readFileSync(join(draftDir, "projection.md"), "utf8")).toMatch(/residual 0\.0216 — FAILS/);
  });

  /* F1/F2's arithmetic, pinned. Pinning the SCALE across standpoint distances
   * means the lens varies and the floor cut walks away from the viewer's feet.
   * Both are consequences of documents older than this row, and both are
   * asserted here so they cannot become invisible. */
  test("pinning the scale makes the lens vary by a factor of ten across the manor", () => {
    const feet = cameraFeetReport(PLAN);
    const focals = feet.rows.map((r) => r.focal_px);
    expect(Math.min(...focals)).toBeCloseTo(96 * 1.95, 6);    // cross passage N
    expect(Math.max(...focals)).toBeCloseTo(1536 / 20.4 * 26.75, 6); // entrance court S, wide
    expect(Math.max(...focals) / Math.min(...focals)).toBeGreaterThan(8);
    // and the visible consequence: floor_line_y is the same on every pinned facing
    expect(deriveMeta(PLAN, "great_hall", "E").floor_line_y)
      .toBeCloseTo(deriveMeta(PLAN, "study", "N").floor_line_y, 12);
  });

  test("the frame-bottom floor cut is at the viewer's feet in the study and metres out elsewhere", () => {
    const feet = cameraFeetReport(PLAN);
    // the shipped study, the only frame-bottom cut a human has judged
    expect(feet.reference).toBeCloseTo(3.6 * 96 / 332.8, 9);
    expect(feet.reference).toBeLessThan(1.1);
    // measured from the VIEWER, not from the wall — the complement is the bug
    // this assertion exists to prevent recurring
    expect(deriveMeta(PLAN, "great_hall", "E").nearest_floor_m).toBeCloseTo(10.95 * 96 / 332.8, 9);
    expect(feet.over.length).toBe(15);
    expect(feet.over[0].nearest_floor_m).toBeGreaterThan(5);
    expect(readFileSync(join(draftDir, "projection.md"), "utf8")).toMatch(/The camera has feet, and the lens is not one lens/);
  });

  test("the contract camera is carried for comparison and drives nothing", () => {
    expect(CONTRACT_CAMERA.eye_m).toBe(1.83);
    expect(CONTRACT_CAMERA.pitch_deg).toBe(-8);
    const a = deriveMeta(PLAN, "study", "N", { camera: GRID_CAMERA });
    const b = deriveMeta(PLAN, "study", "N", { camera: CONTRACT_CAMERA });
    expect(b.floor_line_y).not.toBeCloseTo(a.floor_line_y, 4);
    // the default is the grid camera, so nothing in the row runs on §10's
    expect(deriveMeta(PLAN, "study", "N").camera_id).toBe("grid");
  });
});

/* -------------------------------------------------------- the meta geometry */

test.describe("derived meta geometry, by independent arithmetic", () => {
  /* Expected values written out here from the §5 literals, never imported —
   * §12.5's independence rule. 1536 px canvas, 1024 px image, horizon 0.48,
   * eye 1.6 m, pinned 96 px/m. */
  const CANVAS = 1536;

  test("study/N — the M0 room, pinned", () => {
    const m = deriveMeta(PLAN, "study", "N");
    expect(m.camera_wall_m).toBe(3.6);          // 0.75 × 4.80 m, off the drawing
    expect(m.wall_width_m).toBe(5.45);
    expect(m.px_per_m_at_wall).toBe(96);
    expect(m.camera).toBe("pinned");
    expect(m.floor_line_y).toBeCloseTo(0.48 + 1.6 * 96 / 1024, 12);   // 0.63
    expect(m.px_per_m_at_bottom).toBeCloseTo((1024 - 0.48 * 1024) / 1.6, 9); // 332.8
    expect(m.corner_x0_px).toBeCloseTo(CANVAS / 2 - 5.45 / 2 * 96, 9); // 506.4
    expect(m.corner_x1_px).toBeCloseTo(CANVAS / 2 + 5.45 / 2 * 96, 9); // 1029.6
    expect(m.corner_x1_px - m.corner_x0_px).toBeCloseTo(5.45 * 96, 9);
    expect(m.backdrop).toBe("wall");
  });

  test("hall/E — a corridor's deep view keeps the pinned frame", () => {
    const m = deriveMeta(PLAN, "hall", "E");
    expect(m.facing_type).toBe("corridor");
    expect(m.camera_wall_m).toBe(6.0);
    expect(m.wall_width_m).toBe(2.6);
    expect(m.camera).toBe("pinned");
    expect(m.corner_x0_px).toBeCloseTo(768 - 2.6 / 2 * 96, 9);
  });

  test("entrance_court/N — the wide-view camera fits the wall exactly", () => {
    const m = deriveMeta(PLAN, "entrance_court", "N");
    expect(m.wall_width_m).toBe(20.4);
    expect(m.camera).toBe("wide");
    expect(m.px_per_m_at_wall).toBeCloseTo(1536 / 20.4, 9);
    expect(m.floor_line_y).toBeCloseTo(0.48 + 1.6 * (1536 / 20.4) / 1024, 12);
    expect(m.px_per_m_at_bottom).toBeCloseTo(332.8, 9); // the horizon device is scale-independent
    expect(m.corner_x0_px).toBeCloseTo(0, 9);
    expect(m.corner_x1_px).toBeCloseTo(1536, 9);
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

  /* Kabe's ruling (3) and the arithmetic select different sets, and neither is
   * an agent's to pick. Both policies exist; the report prints the difference;
   * every derived meta says which one produced it. */
  test("both wide-view readings are computable and they disagree on ten facings", () => {
    const disagree = [];
    for (const r of PLAN.rooms) {
      for (const f of FACINGS) {
        const a = needsWideView(PLAN, r.id, f, GRID_CAMERA, CANVAS_W, "fits");
        const b = needsWideView(PLAN, r.id, f, GRID_CAMERA, CANVAS_W, "ruling");
        if (a !== b) disagree.push(`${r.id}/${f}`);
      }
    }
    expect(disagree.length).toBe(10);
    expect(disagree).toContain("long_gallery/N");   // corridor, deep, fits the frame
    expect(disagree).toContain("privy_garden/N");   // enclosed, flat, does not fit
    expect(Object.keys(WIDE_VIEW_POLICIES).sort()).toEqual(["fits", "ruling"]);
    expect(deriveMeta(PLAN, "privy_garden", "N", { wideViewPolicy: "ruling" }).camera).toBe("pinned");
    expect(deriveMeta(PLAN, "privy_garden", "N").camera).toBe("wide");
  });

  test("every derived meta says it is provisional and names the camera and policy that made it", () => {
    for (const r of PLAN.rooms) {
      for (const f of FACINGS) {
        const m = deriveMeta(PLAN, r.id, f);
        expect(m.provisional, `${r.id}/${f}`).toBe(true);
        expect(m.camera_id).toBe("grid");
        expect(m.wide_view_policy).toBe("fits");
      }
    }
  });

  test("the wide camera is taken by exactly the facings the pinned frame cannot hold", () => {
    expect(pinnedWallInFrame()).toBeCloseTo(16.0, 9);
    const wide = [];
    for (const r of PLAN.rooms) {
      for (const f of FACINGS) if (needsWideView(PLAN, r.id, f)) wide.push(`${r.id}/${f}`);
    }
    expect(wide.sort()).toEqual([
      "entrance_approach/E", "entrance_approach/N", "entrance_approach/S", "entrance_approach/W",
      "entrance_court/N", "entrance_court/S",
      "long_gallery/E", "long_gallery/W",
      "privy_garden/N", "privy_garden/S"
    ]);
    for (const r of PLAN.rooms) {
      for (const f of FACINGS) {
        const wideHere = needsWideView(PLAN, r.id, f);
        const w = r.facings[f].wall_width_m;
        expect(wideHere, `${r.id}/${f}`).toBe(w > 16.0);
      }
    }
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
        const want = ruleStandpoint(r.rect, f, PLAN.standpoint_stand_back);
        expect(fc.standpoint.x, `${r.id}/${f} x`).toBeCloseTo(want.x, 9);
        expect(fc.standpoint.y, `${r.id}/${f} y`).toBeCloseTo(want.y, 9);
        expect(fc.camera_wall_m, `${r.id}/${f} camera_wall_m`)
          .toBe(drawn(measuredDistance(fc.standpoint, f, fc.wall_line)));
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
    expect(div.diverging.map((r) => `${r.id}@${r.facing}`)).toEqual(["door1@study/E"]);
  });

  /* The number, pinned, so the disagreement cannot drift silently. door1's
   * plan position comes from the approved drawing: 1.1 m south of the study's
   * east-wall centre, where the shipped staging centres it. */
  test("door1 on study/E disagrees by exactly the drawing's 1.1 m", () => {
    const p = projectPlacement(PLAN, "door1", "study", "E", shippedMeta());
    expect(p.offset_m).toBeCloseTo(1.1, 9);
    expect(p.u).toBeCloseTo(0.5 + 1.1 / 16.0, 9);   // 0.56875 against a 16 m wall
    expect(STAGING.placements.door1[0].facing).toBe("study/E");
    expect(STAGING.placements.door1[0].u).toBe(0.5);
    expect(p.in_wall, "the opening straddles the wall it is a hole in").toBe(true);
    expect(KNOWN_DIVERGENCES.map((k) => `${k.id}@${k.facing}`)).toEqual(["door1@study/E"]);
  });

  /* Honesty about what the agreements are worth. Four of the six are
   * definitional (their plan positions came out of this staging), and the
   * fifth is at offset 0 where u is 0.5 under any wall width at all. */
  test("the four free-standing objects agree because they were derived from this staging", () => {
    for (const [id, pl] of Object.entries(STAGING.placements)) {
      if (Array.isArray(pl) || !pl.facing) continue;
      const obj = PLAN.objects.find((o) => o.id === id);
      expect(obj, id).toBeTruthy();
      expect(obj.source).toBe("inverse-projected");
      const back = inverseProjectPlacement(PLAN, pl, BY_ENTITY[id], shippedMeta());
      for (const k of ["x0", "x1", "y0", "y1"]) {
        expect(back[k], `${id}.${k}`).toBeCloseTo(obj.footprint[k], 9);
      }
    }
  });

  /* The allowlist has to have teeth in both directions: a divergence that
   * quietly starts agreeing must be noticed too, or the list rots into a
   * comment. */
  test("a named divergence that starts agreeing is reported as missing", () => {
    const p = clone(PLAN);
    // Re-site door1's opening on the study's east-wall centre, where the
    // staging puts it — the divergence disappears.
    const op = p.openings.find((o) => o.entity === "door1");
    op.rect.y0 = 11.5; op.rect.y1 = 12.5;
    const div = stagingDivergence(p, STAGING);
    expect(div.missing.map((k) => `${k.id}@${k.facing}`)).toEqual(["door1@study/E"]);
    // and the door is one entity in two rooms: centring it in the study
    // decentres it in the cross passage, which the same check catches from
    // the other side.
    expect(div.unexpected.map((r) => `${r.id}@${r.facing}`)).toEqual(["door1@hall/W"]);
  });

  test("a staged entity the plan holds no position for is reported, not silently skipped", () => {
    const p = clone(PLAN);
    p.objects = p.objects.filter((o) => o.id !== "desk1");
    const div = stagingDivergence(p, STAGING);
    expect(div.rows.length).toBe(5);
    expect(div.unplanned.map((u) => u.id)).toEqual(["desk1"]);
  });

  /* The tolerance is stated, derived, and driven from both sides. */
  test("a divergence just over the tolerance refuses, just under it passes", () => {
    expect(STAGING_TOLERANCE).toBe(1e-9);
    const st = clone(STAGING);
    st.placements.desk1.u = 0.479 + STAGING_TOLERANCE * 0.4;
    expect(stagingDivergence(PLAN, st).unexpected).toEqual([]);
    st.placements.desk1.u = 0.479 + STAGING_TOLERANCE * 4;
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
    // atan2(offset, standpoint distance − depth) = atan2(−0.336, 3.60 − 0.55)
    expect(p.view_angle_deg).toBeCloseTo(Math.atan2(-0.336, 3.05) * 180 / Math.PI, 6);
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

  test("the plan's own meta moves both u and drawn size, and the report says so", () => {
    const planMeta = deriveMeta(PLAN, "hall", "N");
    const a = projectEntity(PLAN, "stick1", "hall", "N", BY_ENTITY, shippedMeta());
    const b = projectEntity(PLAN, "stick1", "hall", "N", BY_ENTITY, planMeta);
    expect(b.u).not.toBeCloseTo(a.u, 4);
    expect(b.placement.heightPx / a.placement.heightPx).toBeGreaterThan(1.2);
    expect(readFileSync(join(draftDir, "projection.md"), "utf8"))
      .toMatch(/drawn height px today/);
  });
});

/* ------------------------------------- the projection is bound to groundplane */

test.describe("the projection imports the placement math rather than owning a copy", () => {
  const groundplane = require(join(repoRoot, "src", "groundplane.js"));

  test("displacing xAtScale displaces the projected u", () => {
    const original = groundplane.xAtScale;
    const before = projectPlacement(PLAN, "desk1", "study", "N", shippedMeta()).u;
    try {
      // Halve the wall the u-domain spans. A projection that re-derived
      // u = 0.5 + offset/wall_width_m in its own code would not notice.
      groundplane.xAtScale = function (u, s, meta, w) {
        return original(u, s, { ...meta, wall_width_m: meta.wall_width_m / 2 }, w);
      };
      const after = projectPlacement(PLAN, "desk1", "study", "N", shippedMeta()).u;
      expect(after).not.toBeCloseTo(before, 6);
      expect(after - 0.5).toBeCloseTo((before - 0.5) * 2, 6);
    } finally {
      groundplane.xAtScale = original;
    }
    expect(projectPlacement(PLAN, "desk1", "study", "N", shippedMeta()).u).toBeCloseTo(before, 12);
  });

  test("displacing scaleAtDepth displaces the projected scale", () => {
    const original = groundplane.scaleAtDepth;
    const before = projectPlacement(PLAN, "chair1", "study", "N", shippedMeta()).scale_px_per_m;
    try {
      groundplane.scaleAtDepth = (d, meta) => original(d, meta) * 2;
      expect(projectPlacement(PLAN, "chair1", "study", "N", shippedMeta()).scale_px_per_m)
        .toBeCloseTo(before * 2, 6);
    } finally {
      groundplane.scaleAtDepth = original;
    }
  });

  test("displacing placeHost displaces the projected pixels", () => {
    const original = groundplane.placeHost;
    const before = projectEntity(PLAN, "desk1", "study", "N", BY_ENTITY, shippedMeta());
    try {
      groundplane.placeHost = (pl, rec, meta, w) => {
        const p = original(pl, rec, meta, w);
        return p && { ...p, heightPx: p.heightPx + 1000 };
      };
      const after = projectEntity(PLAN, "desk1", "study", "N", BY_ENTITY, shippedMeta());
      expect(after.placement.heightPx).toBeCloseTo(before.placement.heightPx + 1000, 6);
    } finally {
      groundplane.placeHost = original;
    }
  });

  test("and the inverse goes through xAtScale too", () => {
    const original = groundplane.xAtScale;
    const pl = STAGING.placements.desk1;
    const before = inverseProjectPlacement(PLAN, pl, BY_ENTITY.desk1, shippedMeta());
    try {
      groundplane.xAtScale = function (u, s, meta, w) {
        return original(u, s, { ...meta, wall_width_m: meta.wall_width_m / 2 }, w);
      };
      const after = inverseProjectPlacement(PLAN, pl, BY_ENTITY.desk1, shippedMeta());
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
      expect(() => bake(dir, ["--fixture-dir", fx, "--out", join(dir, "fresh.js")])).toThrow();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("a staging value that walks away from the plan refuses the bake", () => {
    const dir = stagePlanTree();
    try {
      const fx = join(dir, "fixtures", "demo-study");
      const st = readJson(join(fx, "staging.json"));
      st.placements.desk1.u = 0.48;   // small enough to keep every fixture check green
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
      writeFileSync(rp, src.replace("px_per_m_at_bottom: 332.8", "px_per_m_at_bottom: 210"));
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
  const APPROVAL_COMMIT = "9059605";

  function approvedBlob(path) {
    return execFileSync("git", ["show", `${APPROVAL_COMMIT}:${path}`],
      { cwd: repoRoot, encoding: "buffer", maxBuffer: 32 * 1024 * 1024 });
  }

  test("git is available — the approved artifact is read from history, not from a literal", () => {
    expect(execFileSync("git", ["rev-parse", "--short", APPROVAL_COMMIT],
      { cwd: repoRoot, encoding: "utf8" }).trim()).toBe(APPROVAL_COMMIT);
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
      const texts = (t) => t.match(/<text[^>]*>[\s\S]*?<\/text>/g) || [];
      const a = texts(approved), b = texts(now);
      expect(b.length).toBe(a.length);
      const moved = a.map((x, i) => [x, b[i]]).filter(([x, y]) => x !== y);
      expect(moved.length, `${f}: more than the caption strings moved`).toBeLessThanOrEqual(2);
      for (const [x] of moved) expect(x).toMatch(/DRAFT for redline|checked by the drawing/);
    }
  });

  test("the geometry hash moves when a room moves, so it is not a decoration", () => {
    const dir = stagePlanTree();
    try {
      const fx = join(dir, "fixtures", "demo-study");
      const p = readJson(join(fx, "plan.json"));
      // Widen the library and narrow the garden room by the same amount, so
      // the floor still tiles and the plan still validates — only the picture
      // moves.
      p.rooms.find((r) => r.id === "library").rect.y1 = 21.4;
      p.rooms.find((r) => r.id === "garden_room").rect.y0 = 21.75;
      for (const id of ["library", "garden_room"]) {
        const r = p.rooms.find((x) => x.id === id);
        for (const f of FACINGS) {
          const fc = r.facings[f];
          const want = ruleStandpoint(r.rect, f, p.standpoint_stand_back);
          fc.standpoint = want;
          const geoLine = { N: r.rect.y1, S: r.rect.y0, E: r.rect.x1, W: r.rect.x0 }[f];
          fc.wall_line = geoLine;
          fc.camera_wall_m = drawn(measuredDistance(want, f, geoLine));
          fc.wall_width_m = drawn(f === "N" || f === "S" ? r.rect.x1 - r.rect.x0 : r.rect.y1 - r.rect.y0);
        }
      }
      // the door between them sits in the partition, which moved with them
      const door = p.openings.find((o) => o.joins.includes("library") && o.joins.includes("garden_room"));
      door.rect.y0 = 21.4; door.rect.y1 = 21.75;
      const band = p.wall_bands.find((b) => b.kind === "partition" && Math.abs(b.rect.y0 - 21.0) < 1e-9);
      band.rect.y0 = 21.4; band.rect.y1 = 21.75;
      writeFileSync(join(fx, "plan.json"), JSON.stringify(p));
      python([join(dir, "design", "plan-draft", "draw_plan.py")], dir);
      const svg = readFileSync(join(dir, "design", "plan-draft", "manor-ground.svg"), "utf8");
      const approved = geometryOnly(approvedBlob("design/plan-draft/manor-ground.svg").toString("utf8"));
      expect(sha256(geometryOnly(svg))).not.toBe(sha256(approved));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  /* The PNGs are the SVG rasterised by the system browser at 2×, so their
   * bytes are environment-dependent and are deliberately NOT byte-compared —
   * they were byte-stable across a re-render on the machine that produced
   * them, and that is recorded in design/architecture.md rather than
   * asserted. What IS asserted is that each PNG is the right artboard at the
   * right scale, which is what a stale one from a resized sheet would fail. */
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

test.describe("the projection report", () => {
  test("byte-equals a fresh run of the generator", () => {
    const fresh = report(PLAN, STAGING, BY_ENTITY);
    const committed = readFileSync(join(draftDir, "projection.md"), "utf8");
    expect(fresh === committed,
      "stale report — run: node tools/plan-projection.mjs --write").toBe(true);
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
