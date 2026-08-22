/* §12.9 + the validator's own teeth. The validator is green on the repo
 * fixtures and red — with the right finding — on each mutation class; the
 * §12.9 cross-check dispatches every enumerated triple through the REAL
 * harness (constructive per-triple probes, fresh harness per probe, both
 * directions); the bake-refusal enforcement locus is witnessed; and the two
 * product-voiced fault surfaces are exercised via row 1's own doctored-bake
 * pattern.
 */
import { test, expect, repoRoot, appUrl, stageTree, removeTree, bake } from "./helpers.mjs";
import { validate, MEASURED_REFERENCE_PX, MEASURED_BAND, DERIVED_LENS_TOL }
  from "../../tools/validate-fixtures.mjs";
import { createRequire } from "node:module";
import { metaForFacing } from "../../tools/plan-projection.mjs";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const require = createRequire(import.meta.url);
const { records } = require(join(repoRoot, "src", "placeholders.js"));
const harness = require(join(repoRoot, "src", "harness.js"));
const fixtureDir = join(repoRoot, "fixtures", "demo-study");

const readJson = (dir, name) =>
  JSON.parse(readFileSync(join(dir, "fixtures", "demo-study", name + ".json"), "utf8"));

/* Stage a scratch tree, mutate one or more fixture files, validate, clean up.
 * `name` may be a single file or an array — some arms can only be reached by
 * a world and a staging edit together (an anchor host that is a real entity
 * and is staged nowhere), and reaching them with one edit lands on a
 * different arm instead, which is how two guards came to look bound to arms
 * they were not testing. */
function mutated(name, fn) {
  const names = Array.isArray(name) ? name : [name];
  const dir = stageTree();
  try {
    const fdir = join(dir, "fixtures", "demo-study");
    const objs = names.map((n) =>
      JSON.parse(readFileSync(join(fdir, n + ".json"), "utf8")));
    fn(...objs);
    names.forEach((n, i) =>
      writeFileSync(join(fdir, n + ".json"), JSON.stringify(objs[i], null, 2) + "\n"));
    return validate(fdir, records);
  } finally {
    removeTree(dir);
  }
}

test.describe("the fixture validator (§2–§8 split, refs, pairs, §12.9)", () => {
  test("green on the repo fixtures", () => {
    expect(validate(fixtureDir, records)).toEqual([]);
  });

  const redCases = [
    ["coordinate smuggled into world.json", "world",
      (w) => { w.entities[0].u = 0.4; }, /coordinate|u/i],
    ["airborne on a world entity", "world",
      (w) => { w.entities[0].airborne = true; }, /airborne/i],
    ["fact smuggled into staging.json", "staging",
      (s) => { s.placements.desk1.state = "open"; }, /state|fact|key/i],
    ["mirror: true", "staging",
      (s) => { s.placements.desk1.mirror = true; }, /mirror/i],
    ["extra viewstate key", "viewstate",
      (v) => { v.zoom = 2; }, /viewstate|zoom|exactly/i],
    ["dangling sprite ref", "world",
      (w) => { w.entities.find((e) => e.id === "chair1").sprite = "chair-ghost"; }, /chair-ghost|record/i],
    ["dangling anchor region", "staging",
      (s) => { s.placements.note1.anchor_on = "desk1.lid_top"; }, /lid_top|region|anchor/i],
    ["dangling exit via", "world",
      (w) => { w.locations[0].exits[0].via = "door9"; }, /door9|via/i],
    ["out-of-domain u", "staging",
      (s) => { s.placements.desk1.u = 1.7; }, /u|domain|range|\[0,\s*1\]/i],
    ["depth past the singularity", "staging",
      (s) => { s.placements.chair1.depth_m = 3.6; }, /depth/i],
    ["staging↔location contradiction", "staging",
      (s) => { s.placements.chair1.facing = "hall/N"; }, /location|chair1/i],
    ["known entity staged nowhere", "staging",
      (s) => { delete s.placements.shelf1; }, /shelf1/i],
    /* Row 11 moved the pair east, so u 0.9 is now BESIDE the desk rather than
       away from it. u 0.5 puts the chair back at the room's centre, which is
       where the desk no longer is. */
    ["parted overlap pair (u)", "staging",
      (s) => { s.placements.chair1.u = 0.5; }, /overlap|chair1/i],
    ["parted overlap pair (depth/y-span)", "staging",
      (s) => { s.placements.stick1.depth_m = 3.5; }, /overlap|stick1/i],
    ["missing narration key", "narration",
      (n) => { delete n.lines["toggle.chair1.refused_static"]; }, /toggle\.chair1\.refused_static/],
    ["placeholder-token line", "narration",
      (n) => { n.lines["take.coin1.taken"] = "TODO write this"; }, /placeholder|TODO|take\.coin1/i],
    ["wildcard-resolved specific triple", "narration",
      (n) => {
        delete n.lines["take.note1.refused_held"];
        n.lines["take.*.refused_held"] = "It is already in your keeping, whatever it is.";
      }, /wildcard|take\..*refused_held/i],
    ["entity-specific refused_unknown", "narration",
      (n) => { n.lines["take.key1.refused_unknown"] = "You have not seen any such key here."; },
      /refused_unknown|key1/i],
    ["duplicate success lines", "narration",
      (n) => { n.lines["take.coin1.taken"] = n.lines["take.note1.taken"]; }, /distinct|duplicate/i],
    ["duplicate refusal line across entities", "narration",
      (n) => { n.lines["toggle.stick1.refused_static"] = n.lines["toggle.chair1.refused_static"]; },
      /distinct|duplicate|refus/i],
    ["stray specific key outside the domain", "narration",
      (n) => { n.lines["toggle.ghost.open"] = "The ghost drawer slides out of nothing."; },
      /ghost|outside|domain|stray/i],
    ["missing wildcard", "narration",
      (n) => { delete n.lines["turn.*.refused"]; }, /turn\.\*\.refused|wildcard/i],
    /* The key whitelists cover the structures §3 names; `knowledge`'s
     * sub-keys are open, so the coordinate walk is the only net there — and
     * a bare /x|y/ let every dressed-up coordinate through. */
    ["dressed-up coordinate under knowledge", "world",
      (w) => { w.knowledge.screen_x = 512; }, /coordinate|screen_x/i],
    ["wall-space coordinate under knowledge", "world",
      (w) => { w.knowledge.wall_x = 3; }, /coordinate|wall_x/i],
    ["pixel rect under knowledge", "world",
      (w) => { w.knowledge.bbox = { x0: 0, y0: 0, x1: 10, y1: 10 }; }, /coordinate|bbox/i],
    /* M0 pins two-state closed/open: §7's swap rule reads "closed" as the
     * body image, the outcome vocabulary and the narration keys are named
     * for them, and the toggle walks the declared list. A fixture declaring
     * other names used to validate clean and then behave incoherently. */
    ["state names outside M0's closed/open pin", "world",
      (w) => {
        const d = w.entities.find((e) => e.id === "desk1");
        d.states = ["shut", "ajar"];
        d.state = "shut";
      }, /closed.*open|states/i],
    ["a third state", "world",
      (w) => { w.entities.find((e) => e.id === "desk1").states = ["closed", "open", "ajar"]; },
      /closed.*open|states/i],
    /* Six arms that existed and were guarded by nothing — deleting each left
     * the whole suite green. Two of them are named in the row text itself
     * ("no facts in staging.json", "all refs resolve", "thumbs"). */
    ["a placement whose attachment contradicts its record", "staging",
      (s) => { s.placements.desk1.attachment = "floor_free"; s.placements.desk1.depth_m = 1; },
      /record "desk-joined-oak-1660" declares attachment "floor_against"/],
    /* Four holes a document can fall through while every ref resolves. */
    ["a duplicate entity id", "world",
      (w) => { w.entities.push(JSON.parse(JSON.stringify(w.entities[0]))); },
      /appears more than once/],
    ["contents of a host that cannot open", "world",
      (w) => {
        w.relations = w.relations.filter((r) => r[1] !== "coin1");
        w.relations.push(["in", "coin1", "shelf1"]);
      }, /declares no "open" state/],
    ["v on a floor placement", "staging",
      (s) => { s.placements.desk1.v = 3.0; }, /carries "v" but is floor_against/],
    ["an attachment token that is not one", "staging",
      (s) => { s.placements.desk1.attachment = "ceiling_hung"; },
      /attachment "ceiling_hung" is not one of/],
    /* `u ∈ [0,1]` is not the same as "inside the room". Row 11 added the
     * stronger net: an object at u 0.98 in a 5.45 m study stands past the
     * corner, in the side wall — outside the room, though still on the
     * canvas. This is the clause that catches it. */
    ["an entity staged past a corner, outside the room", "staging",
      (s) => { s.placements.chair1.u = 0.98; }, /outside the room/],
    /* And the older frame clause still has its own case. It needs a facing
     * with no corners to clamp to — the unplanned-facing fallback's 16 m
     * wall — which is what a room the plan has not drawn resolves to, so the
     * u-mapping runs from x −400 to x 1936 across the legal u range again. */
    ["an entity staged wholly off the frame on an unplanned facing", ["world", "staging"],
      (w, s) => {
        w.locations.push({ id: "gallery", facings: ["N", "E", "S", "W"] });
        w.entities.push({ id: "chair9", sprite: "chair-joined", location: "gallery" });
        w.knowledge.player.push("chair9");
        s.placements.chair9 = { facing: "gallery/N", attachment: "floor_free", u: 0.98, depth_m: 1.2 };
      }, /wholly outside the 1536/],
    ["a placement naming no world entity", "staging",
      (s) => { s.placements.ghost1 = { facing: "study/N", attachment: "floor_free", u: 0.5, depth_m: 1 }; },
      /ghost1|names no world/i],
    ["an anchor_on host that is a real entity staged nowhere", ["world", "staging"],
      (w, s) => {
        // Both entities unknown, so the "every known entity is staged" arm
        // does not fire instead: what is left is a placement anchored on a
        // real entity that no facing carries.
        w.entities.push({ id: "shelf3", sprite: "shelf-oak", location: "study" });
        w.entities.push({ id: "stick3", sprite: "candlestick-brass", location: "study" });
        s.placements.stick3 = { anchor_on: "shelf3.surface_top", t: 0.5 };
      }, /host "shelf3" is not staged/],
    ["a takeable whose record carries no thumb", "world",
      (w) => { w.entities.find((e) => e.id === "chair1").takeable = true; }, /thumb/i],
    /* Passage maintains orientation (blueprint §3, row 13): arrive_facing
     * must continue the direction of travel until a real exception exists in
     * the schema. Both directions get their own case, since each exit's
     * `facing` differs (E vs W) and a bug that swapped the two constants
     * would leave one direction accidentally correct. */
    ["arrive_facing turned 90° off the direction of travel (study→hall)", "world",
      (w) => { w.locations.find((l) => l.id === "study").exits[0].arrive_facing = "N"; },
      /door_study_hall.*does not continue the direction of travel/],
    ["arrive_facing reversed, facing back at the door (hall→study)", "world",
      (w) => { w.locations.find((l) => l.id === "hall").exits[0].arrive_facing = "E"; },
      /door_hall_study.*does not continue the direction of travel/],
  ];

  for (const [name, file, fn, pattern] of redCases) {
    test(`red: ${name}`, () => {
      const findings = mutated(file, fn);
      expect(findings.length, `${name} yields findings`).toBeGreaterThan(0);
      expect(findings.join("\n")).toMatch(pattern);
    });
  }

  /* Record-side arms cannot be reached by editing a fixture file — the
   * records are a module. validate() takes them as an argument, so these
   * hand it a doctored copy. The bounds arm is the one that would catch a
   * cavity whose region falls off its own body, which is exactly how row 4's
   * real contents could end up clipped to nothing. */
  const recordCases = [
    ["anchor region outside the body bounds", (r) => {
      r["desk-joined-oak-1660"].anchors.drawer_cavity.x1 = 9999;
    }, /lies outside the .* body bounds/],
    ["anchor region with x1 before x0", (r) => {
      r["desk-joined-oak-1660"].anchors.surface_top.x1 = 0;
    }, /x0 must be < x1/],
    ["records that are not JSON-clean", (r) => {
      r["key-iron"].noun = { toJSON: () => "iron key" };
    }, /JSON-clean/]
  ];

  for (const [name, fn, pattern] of recordCases) {
    test(`red: ${name}`, () => {
      const doctored = JSON.parse(JSON.stringify(records));
      fn(doctored);
      if (name.includes("JSON-clean")) {
        // JSON.parse(JSON.stringify(...)) would launder it; mutate a live copy.
        const live = Object.assign({}, records, {
          "key-iron": Object.assign({}, records["key-iron"], {
            noun: { toJSON: () => "iron key" }
          })
        });
        const findings = validate(fixtureDir, live);
        expect(findings.join("\n")).toMatch(pattern);
        return;
      }
      const findings = validate(fixtureDir, doctored);
      expect(findings.length, `${name} yields findings`).toBeGreaterThan(0);
      expect(findings.join("\n")).toMatch(pattern);
    });
  }

  test("the bake itself refuses an invalid fixture (enforcement locus witnessed)", () => {
    const dir = stageTree();
    try {
      const fdir = join(dir, "fixtures", "demo-study");
      const s = JSON.parse(readFileSync(join(fdir, "staging.json"), "utf8"));
      s.placements.desk1.mirror = true;
      writeFileSync(join(fdir, "staging.json"), JSON.stringify(s, null, 2) + "\n");
      let failed = false;
      let output = "";
      try {
        bake(dir, ["--fixture-dir", fdir]);
      } catch (err) {
        failed = true;
        output = String(err.stderr || err.message || err);
      }
      expect(failed, "invalid fixture fails to bake").toBe(true);
      expect(output).toMatch(/mirror|finding|refus/i);
    } finally {
      removeTree(dir);
    }
  });
});

test.describe("§12.9 cross-check: constructive per-triple probes through the real harness", () => {
  test("the union of scored keys equals the enumerated domain exactly", () => {
    const world = readJson(repoRoot, "world");
    const staging = readJson(repoRoot, "staging");
    const narration = readJson(repoRoot, "narration");
    const viewstate = readJson(repoRoot, "viewstate");
    const domain = harness.enumerateNarrationDomain(world, staging);
    expect(domain.length, "the plan's 37-member domain").toBe(37);

    // All 38 lines are pairwise distinct (validator-enforced), so a
    // narration string maps back to exactly one key.
    const lineToKey = new Map(Object.entries(narration.lines).map(([k, v]) => [v, k]));
    expect(lineToKey.size).toBe(Object.keys(narration.lines).length);

    const clone = (o) => JSON.parse(JSON.stringify(o));
    const stagedFacings = (id) => {
      const p = staging.placements[id];
      if (!p) return [];
      const arr = Array.isArray(p) ? p : [p];
      return arr.filter((x) => x.facing).map((x) => x.facing);
    };
    const hostOf = (id) => {
      const p = staging.placements[id];
      return p && p.anchor_on ? p.anchor_on.split(".")[0] : null;
    };
    const rootFacings = (id) => {
      let cur = id;
      for (let i = 0; i < 4; i++) {
        const host = hostOf(cur);
        if (!host) return stagedFacings(cur);
        cur = host;
      }
      return [];
    };
    const allFacings = [];
    for (const loc of world.locations) {
      for (const f of loc.facings) allFacings.push(`${loc.id}/${f}`);
    }
    const exitById = {};
    for (const loc of world.locations) {
      for (const x of loc.exits || []) exitById[x.id] = x;
    }

    /* Build the minimal doctored fixture + intent for one enumerated triple
     * (the plan-§4 construction rule). */
    function probeFor(key) {
      const [type, target, ...rest] = key.split(".");
      const outcome = rest.join(".");
      const w = clone(world);
      let vs;
      const know = (id) => {
        if (!w.knowledge.player.includes(id)) w.knowledge.player.push(id);
      };
      const hold = (id) => {
        w.relations = w.relations.filter((r) => r[1] !== id);
        w.relations.push(["held_by", id, "player"]);
        know(id);
      };
      const setState = (id, st) => { w.entities.find((e) => e.id === id).state = st; };
      const at = (facingKey) => {
        const [location, facing] = facingKey.split("/");
        vs = { location, facing };
      };
      const notAt = (id) => {
        const staged = new Set(rootFacings(id));
        at(allFacings.find((f) => !staged.has(f)));
      };

      if (target === "*") {
        at(allFacings[0]);
        const intent = type === "go"
          ? { type, exit: "no_such_exit" }
          : { type, entity: "no_such_entity" };
        return { w, vs, intent };
      }
      if (type === "go") {
        const exit = exitById[target];
        if (outcome === "arrive") { at(`${exit.from}/${exit.facing}`); setState(exit.via, "open"); }
        else if (outcome === "refused_closed") { at(`${exit.from}/${exit.facing}`); setState(exit.via, "closed"); }
        else { at(allFacings.find((f) => f !== `${exit.from}/${exit.facing}`)); }
        return { w, vs, intent: { type, exit: target } };
      }
      const intent = { type, entity: target };
      if (type === "toggle") {
        if (outcome === "refused_static") { know(target); at(allFacings[0]); }
        else if (outcome === "refused_unreachable") { know(target); notAt(target); }
        else if (outcome === "open_reveal") { setState(target, "closed"); at(rootFacings(target)[0]); }
        else if (outcome === "open") {
          // plain open: reveal spent — contents already known
          setState(target, "closed");
          for (const r of w.relations) if (r[0] === "in" && r[2] === target) know(r[1]);
          at(rootFacings(target)[0]);
        } else if (outcome === "closed") { setState(target, "open"); at(rootFacings(target)[0]); }
        return { w, vs, intent };
      }
      // take
      if (outcome === "refused_fixed") { know(target); at(allFacings[0]); }
      else if (outcome === "refused_held") { hold(target); at(allFacings[0]); }
      else if (outcome === "refused_unreachable") { know(target); notAt(target); }
      else if (outcome === "refused_contained") {
        know(target);
        const host = w.relations.find((r) => r[0] === "in" && r[1] === target)[2];
        setState(host, "closed");
        at(rootFacings(target)[0]);
      } else { // taken
        know(target);
        const inRel = w.relations.find((r) => r[0] === "in" && r[1] === target);
        if (inRel) setState(inRel[2], "open");
        at(rootFacings(target)[0]);
      }
      return { w, vs, intent };
    }

    const scored = new Set();
    for (const key of domain) {
      const { w, vs, intent } = probeFor(key);
      const h = harness.create({ world: w, staging, narration, viewstate: vs });
      const env = h.dispatch(intent);
      expect(typeof env.narration, `${key}: probe narrates`).toBe("string");
      const resolved = lineToKey.get(env.narration);
      expect(resolved, `${key}: narration resolves to a key (got "${env.narration}")`).toBeTruthy();
      expect(resolved, `${key}: the probe scored its own triple`).toBe(key);
      scored.add(resolved);
    }
    expect([...scored].sort()).toEqual([...domain].sort());
  });
});

test.describe("fault surfaces (the product's voice, in error states)", () => {
  test("a hand-edited bake missing a narration line: product-voiced fault line + console.error", async ({ page }) => {
    const dir = stageTree();
    try {
      const bakedPath = join(dir, "fixtures", "demo-study", "fixture.js");
      const baked = readFileSync(bakedPath, "utf8");
      // Remove the chair's refusal line from the baked narration (the bake
      // itself would refuse this fixture — hand-editing is the vector).
      const doctored = baked.replace(/"toggle\.chair1\.refused_static":\s*"[^"]*",?/, "");
      expect(doctored).not.toBe(baked);
      writeFileSync(bakedPath, doctored);
      const errors = [];
      page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
      await page.goto(appUrl(dir));
      const res = await page.evaluate(() => {
        const env = window.HOLO_APP.dispatch({ type: "toggle", entity: "chair1" });
        const ps = document.querySelectorAll("#narration p");
        return { narration: env.narration, pane: ps[ps.length - 1].textContent };
      });
      expect(res.narration).toBe("The pattern falters; the words do not come.");
      expect(res.pane).toBe("The pattern falters; the words do not come.");
      expect(errors.some((e) => e.includes("missing narration")),
        "developer detail on the console").toBe(true);
    } finally {
      removeTree(dir);
    }
  });

  test("a hand-edited bake with a dangling sprite id: product-voiced render fault, never a silent freeze", async ({ page }) => {
    const dir = stageTree();
    try {
      const bakedPath = join(dir, "fixtures", "demo-study", "fixture.js");
      const baked = readFileSync(bakedPath, "utf8");
      const doctored = baked.replace('"sprite": "chair-joined"', '"sprite": "chair-ghost"');
      expect(doctored).not.toBe(baked);
      writeFileSync(bakedPath, doctored);
      const errors = [];
      page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
      await page.goto(appUrl(dir));
      const pane = await page.evaluate(() => {
        const ps = document.querySelectorAll("#narration p");
        return ps.length ? ps[ps.length - 1].textContent : null;
      });
      expect(pane).toBe("The projection wavers; the pattern will not resolve.");
      expect(errors.some((e) => /render fault|chair-ghost/i.test(e)),
        "developer detail on the console").toBe(true);
    } finally {
      removeTree(dir);
    }
  });
});

/* The row's own words: the static overlap check is "computed by importing
 * the renderer's own groundplane.js — never a re-derivation". Importing the
 * scale functions and re-deriving the placement layer above them satisfies
 * the letter and defeats the point: the check then asserts overlaps in a
 * world the renderer has stopped drawing. This is the direct test of the
 * clause — move placement in groundplane and the validator has to move with
 * it. A validator that re-derives stays green here and fails this case. */
test.describe("the overlap check is bound to the renderer's placement", () => {
  const groundplane = require(join(repoRoot, "src", "groundplane.js"));

  test("displacing placeHost displaces the validator's verdict", () => {
    const original = groundplane.placeHost;
    try {
      expect(validate(fixtureDir, records), "green to begin with").toEqual([]);
      // Slide the floor_free half of each named pair two canvas-widths left.
      // chair1 leaves desk1 and stick1 leaves shelf1; both pairs must be
      // reported parted.
      groundplane.placeHost = function (placement, record, meta, canvasW) {
        const p = original(placement, record, meta, canvasW);
        if (!p || placement.attachment !== "floor_free") return p;
        return Object.assign({}, p, {
          x0: p.x0 - 3072, x1: p.x1 - 3072,
          baseX: p.baseX - 3072, drawX: p.drawX - 3072
        });
      };
      const findings = validate(fixtureDir, records);
      expect(findings.length,
        "the validator reads placement from groundplane, not from its own copy")
        .toBeGreaterThan(0);
      expect(findings.join("\n")).toMatch(/overlap/i);
    } finally {
      groundplane.placeHost = original;
    }
    expect(validate(fixtureDir, records), "and restored").toEqual([]);
  });

  test("displacing placeHost vertically is caught too (the y-span half)", () => {
    const original = groundplane.placeHost;
    try {
      groundplane.placeHost = function (placement, record, meta, canvasW) {
        const p = original(placement, record, meta, canvasW);
        if (!p) return p;
        // Push floor_free entities far up the frame; the named pairs part in
        // rows while their columns still intersect.
        if (placement.attachment !== "floor_free") return p;
        return Object.assign({}, p, { y0: p.y0 - 4000, y1: p.y1 - 4000 });
      };
      const findings = validate(fixtureDir, records);
      expect(findings.length).toBeGreaterThan(0);
      expect(findings.join("\n")).toMatch(/overlap/i);
    } finally {
      groundplane.placeHost = original;
    }
    expect(validate(fixtureDir, records)).toEqual([]);
  });
});

/* [ROW 15] AND THE SAME CLAUSE FOR `openingFor`, WHICH IS THE OTHER THING BOTH
 * SIDES NOW READ. What an exit's `via` names — a leaf, or the plan's own name
 * for a hole, a threshold or a flight — has ONE home, in `src/groundplane.js`,
 * and the renderer and this validator both call it. "One home" is prose until
 * something moves when the home moves: this project paid for that twice, once
 * when `corner_x*_px` turned out to be a private copy of the u-mapping and
 * displacing `xAtScale` left the corners where they were, and once when a
 * doorway guard consulted `apertures` instead of the page's own resolver.
 *
 * So both consumers are displaced against the same function, in the same case,
 * and both have to move. */
test.describe("what an exit's `via` names is bound to one function", () => {
  const groundplane = require(join(repoRoot, "src", "groundplane.js"));
  const navDir = join(repoRoot, "fixtures", "nav-manor");

  test("displacing openingFor displaces the validator's verdict", () => {
    const original = groundplane.openingFor;
    try {
      expect(validate(navDir, records), "the manor is green to begin with").toEqual([]);
      groundplane.openingFor = function () { return null; };
      const findings = validate(navDir, records);
      /* Every exit the manor walks resolves through that function and only
         through it, so with it gone every one of them is an exit through
         nothing the building holds. A validator carrying its own copy of the
         lookup stays green here. */
      const unfilled = findings.filter((f) => f.includes("[row21:exit.via_unfilled]"));
      expect(unfilled.length, "the validator reads the lookup from groundplane, not from its own copy")
        .toBe(55);
    } finally {
      groundplane.openingFor = original;
    }
    expect(validate(navDir, records), "and restored").toEqual([]);
  });

  test("displacing openingFor displaces the picture too", async ({ page }) => {
    await page.goto(appUrl().replace(/\?world=demo-study$/, ""));
    await page.waitForFunction(() => !!window.HOLO_APP);
    const r = await page.evaluate(() => {
      const A = window.HOLO_APP, fx = window.HOLO_FIXTURE;
      const count = () => {
        let n = 0;
        for (const loc of fx.world.locations) {
          for (const f of loc.facings) {
            const vs = { location: loc.id, facing: f };
            n += window.HOLO.renderer.apertures(
              fx.world, fx.staging, A.library, A.metaFor(vs), vs).length;
          }
        }
        return n;
      };
      const before = count();
      const original = window.HOLO.groundplane.openingFor;
      window.HOLO.groundplane.openingFor = function () { return null; };
      const during = count();
      window.HOLO.groundplane.openingFor = original;
      return { before, during, after: count() };
    });
    expect(r.before, "every way through the manor is an aperture on its own facing").toBe(55);
    expect(r.during, "with the lookup displaced the building has no ways through at all").toBe(0);
    expect(r.after, "and restored").toBe(55);
  });

  test("a leaf outranks the plan's own name for the hole it stands in", () => {
    /* THE ORDER IS FIXED AND IT MATTERS: an id that is both an entity's and an
       opening's must resolve to the ENTITY, because a leaf governs the hole it
       stands in — it is knowledge-filtered, it can be shut, and it is what the
       page offers a click. Reading the building first would make a shut door
       walkable. */
    const meta = {
      openings: [
        { id: "op13", via: "door1", kind: "door", x: 1, y: 2, w: 3, h: 4 },
        { id: "door1", via: null, kind: "door", x: 9, y: 9, w: 9, h: 9 }
      ]
    };
    expect(groundplane.openingFor(meta, "door1").x,
      "the leaf's own hole, not the one that happens to share its name").toBe(1);
    expect(groundplane.openingFor(meta, "op13").x,
      "and the plan's name still reaches the same hole").toBe(1);
    expect(groundplane.openingFor(meta, "nothing"), "and a name nobody holds resolves to nothing")
      .toBe(null);
  });
});

/* ONE BAND, TWO FILES, AND THE FILES ARE IN DIFFERENT LANGUAGES. The measured
 * arm of §12.5 (i′) admits exactly what the asset seat's acceptance gate
 * admits — a candidate backdrop whose implied focal lands within ±3 % of the
 * approved study/N's measured 1010 px. `gate.py` is the seat's copy and
 * `validate-fixtures.mjs` is the project's, and a round-4 critic widened the
 * project's to 0.99 with the whole suite green because the number lived
 * nowhere else. Now widening either one alone goes red. */
test.describe("the measured-lens acceptance band", () => {
  /* [Standing-eye wave] THE BAND'S TWO NUMBERS NOW COME FROM TWO PLACES, and
     neither of them is a literal in this file. The band itself is `gate.py`'s
     `BAND6`; the reference is READ OFF THE FRAME — `measure.py --round
     cand5ref` writes `_reference_set.focal_px` into
     `design/plan-draft/measured/cand5ref/study-N.json` and gate.py loads it
     from there rather than typing it, so the number the whole wave answers to
     cannot drift from the pixels it came off. The old binding was against
     gate.py's `REFERENCE_PX` literal, which is still there and is still the
     cand-2 round's own 1010 px: that round is frozen and its band is not this
     one. */
  test("agrees, number for number, with the asset gate that admits the backdrops", () => {
    const gate = readFileSync(join(repoRoot, "design", "plan-draft", "measured", "gate.py"), "utf8");
    const band = gate.match(/^BAND6\s*=\s*([0-9.]+)/m);
    expect(band, "gate.py no longer states BAND6").toBeTruthy();
    expect(Number(band[1])).toBe(MEASURED_BAND);
    const refFile = join(repoRoot, "design", "plan-draft", "measured", "cand5ref", "study-N.json");
    expect(existsSync(refFile),
      "the standing camera reference set is gone — run measure.py --round cand5ref").toBe(true);
    const ref = JSON.parse(readFileSync(refFile, "utf8"))._reference_set;
    expect(ref.focal_px,
      "the acceptance band's reference is not the focal length measured off cand-5-reference")
      .toBe(MEASURED_REFERENCE_PX);
  });

  test("and the band is a band, not a shrug — it cannot be widened past the ruled lens", () => {
    /* A tolerance loose enough to admit any picture is the gate-that-cannot-
     * fail this project has paid for five times. The band must exclude the
     * worst lens the eight approved backdrops actually contain (498 px). */
    expect(MEASURED_BAND).toBeGreaterThan(0);
    expect(MEASURED_REFERENCE_PX * (1 - MEASURED_BAND)).toBeGreaterThan(498);
    expect(MEASURED_BAND).toBeLessThan(0.1);
  });

  /* AND THE RULED NUMBER HAS A READER THAT IS NOT A COPY OF ITSELF. Every
   * other case here derives its edges FROM `MEASURED_BAND`, so moving the
   * constant moves the edges with it — a critic set both copies (here and in
   * `gate.py`) to 0.001 and to 0.037 and the boundary case passed both times,
   * which is the self-referential defect this row already removed on the
   * DERIVED arm and left standing on the arm whose title says "±3 %". At 0.001
   * the gate silently refuses every regeneration the asset seat can produce;
   * at 0.037 it admits `study/W` at −3.7 % un-regenerated. The band is
   * blueprint §5's ruling in Kabe's project's own words, so it is read off the
   * blueprint rather than asserted against a second literal. */
  test("and the number itself is the one blueprint §5 rules, read from the blueprint", () => {
    const bp = readFileSync(join(repoRoot, "design", "blueprint.md"), "utf8");
    const m = /within \*\*±([\d.]+) % of ([\d.]+) px\*\*/.exec(bp);
    expect(m, "blueprint §5 no longer states the measured-lens acceptance band").toBeTruthy();
    expect(MEASURED_BAND, `blueprint §5 rules ±${m[1]} %`).toBeCloseTo(Number(m[1]) / 100, 12);
    expect(MEASURED_REFERENCE_PX, `blueprint §5 rules ${m[2]} px`).toBe(Number(m[2]));
  });
});

/* A TOLERANCE NOTHING READS IS NOT A TOLERANCE. Round 4 found `meta.one_lens`
 * carrying `meta.measured ? 0.05 : 1e-9` and widened 0.05 to 0.99 with the
 * suite green; the fix split the token and bound the measured half to the
 * asset gate, and round 5 then widened the DERIVED half - 1e-9 to 0.1, a
 * factor of 10^8 - with the suite green again. Same defect, other arm, one
 * round apart.
 *
 * The reason a ledger case cannot catch this is structural and worth stating:
 * a case doctors a meta far outside the tolerance (x1.2 here) to prove the
 * clause FIRES. It stays red under any widening short of its own delta. Only a
 * pair of assertions at the boundary - just outside must fail, just inside
 * must pass - pins the number itself, and a widened tolerance breaks the first
 * while a narrowed one breaks the second. */
/** Findings matching `re` after doctoring the SHIPPED derived metas. */
function lensTokens(doctor, re) {
  const plan = JSON.parse(readFileSync(join(fixtureDir, "plan.json"), "utf8"));
  const world = JSON.parse(readFileSync(join(fixtureDir, "world.json"), "utf8"));
  const metas = {};
  for (const loc of world.locations) {
    for (const f of loc.facings) metas[`${loc.id}/${f}`] = metaForFacing(plan, loc.id, f);
  }
  doctor(metas);
  return validate(fixtureDir, records, metas).filter((x) => re.test(x)).length;
}

test.describe("the lens tolerances are pinned from both sides", () => {
  test("the DERIVED arm is a float epsilon: 4x it is refused, a fraction of it is not", () => {
    const bend = (rel) => lensTokens((m) => {
      m["hall/S"].px_per_m_at_wall *= (1 + rel);
    }, /row20:meta\.one_lens\]/);

    /* ABSOLUTE deviations, never multiples of the constant under test. My
       first version of this asserted `bend(TOL * 4)` is refused, which is true
       for EVERY value of TOL — the test moved with the number it was meant to
       pin and survived the exact 1e-9 -> 0.1 widening it was written to catch.
       A boundary test phrased in terms of its own subject is the same
       self-referential defect as a document that reads a second copy of
       itself, one level down. So: fixed relative deviations, chosen for what
       they mean in PIXELS on this frame. */
    expect(bend(0), "the shipped derived meta must pass").toBe(0);
    expect(bend(1e-12),
      "1e-12 is float noise on a derived meta and must not be a finding").toBe(0);
    expect(bend(1e-6),
      "1e-6 relative — a thousandth of a pixel on a 1024 px lens — must be refused: this arm is a float-equality epsilon, and if it is green the tolerance has become an allowance")
      .toBeGreaterThan(0);
  });

  test("and the epsilon is an epsilon, not an allowance", () => {
    /* A float-equality tolerance may not become a licence. At 1e-6 a 1024 px
       lens admits a 1024.001 px one, which is still nothing - but at 1e-3 it
       admits a whole pixel, and that is a picture decision nobody ruled. */
    expect(DERIVED_LENS_TOL).toBeLessThanOrEqual(1e-8);
    expect(DERIVED_LENS_TOL).toBeGreaterThan(0);
  });

  test("the MEASURED band is +/-3%: just outside is refused, just inside is not", () => {
    const atFocal = (focalPx) => lensTokens((m) => {
      m["hall/S"].measured = true;
      m["hall/S"].px_per_m_at_wall = focalPx / m["hall/S"].camera_wall_m;
    }, /row20:meta\.one_lens_measured\]/);

    const lo = MEASURED_REFERENCE_PX * (1 - MEASURED_BAND);
    const hi = MEASURED_REFERENCE_PX * (1 + MEASURED_BAND);
    expect(atFocal(MEASURED_REFERENCE_PX), "the approved camera itself must pass").toBe(0);
    expect(atFocal(lo + 1), "just inside the low edge must pass").toBe(0);
    expect(atFocal(hi - 1), "just inside the high edge must pass").toBe(0);
    expect(atFocal(lo - 1), "just outside the low edge must be refused").toBeGreaterThan(0);
    expect(atFocal(hi + 1), "just outside the high edge must be refused").toBeGreaterThan(0);
  });

  /* AND THE BAND IS JUDGED AGAINST THE CORPUS IT EXISTS TO JUDGE. `gate.py`'s
     own sentence is "The corpus conforms to the law; the law is never moved to
     admit the corpus", and blueprint §5 rules seven of the eight backdrops
     must regenerate. A round-5 critic set the band to 0.0999 - inside the
     `< 0.1` rail the first version of this file called a guard - and gate.py
     silently went from 1 of 8 admitted to 3 of 8, letting study/E and study/W
     ship un-regenerated. So the real assertion is not about the number: it is
     that the seven still fail and the one still passes. */
  test("the band still admits exactly the one backdrop blueprint §5 admits", () => {
    const dir = join(repoRoot, "design", "plan-draft", "measured");
    /* NOT a silent return. The measurements are committed and this arm exists
       to judge them; a missing directory means the corpus this band is about
       has left the tree, which is a finding rather than a pass. */
    expect(existsSync(dir),
      "design/plan-draft/measured/ is gone — the measured band has nothing left to be a band over").toBe(true);
    /* px/m read off each painting, and each facing's DRAWN standpoint.
       [Standing-eye wave] These are the cand-6 round's numbers, plus the
       reference itself, and two facings are WITHHELD — nothing in their pixels
       converts to a scale, because neither paints the chair-rail its own
       prompt declares — so they carry null and are not members of any band. A
       withheld facing is not a failing one and must not be counted as either.
       The membership is the claim, not the arithmetic: a widened band that
       admitted hall/W at +17.9 % would still satisfy an assertion written
       against `MEASURED_BAND`. */
    const MEASURED = {
      "study/N": [188.421, 4.35], "study/E": [204.211, 4.09], "study/S": [null, 3.85],
      "study/W": [192.632, 4.09], "hall/N": [301.05, 2.15], "hall/E": [171.58, 6.00],
      "hall/S": [null, 2.15], "hall/W": [161.05, 6.00]
    };
    const lo = MEASURED_REFERENCE_PX * (1 - MEASURED_BAND);
    const hi = MEASURED_REFERENCE_PX * (1 + MEASURED_BAND);
    const admitted = Object.entries(MEASURED)
      .filter(([, [ppm, cam]]) => ppm !== null && ppm * cam >= lo && ppm * cam <= hi)
      .map(([k]) => k).sort();
    expect(admitted,
      "the band's membership over the standing-eye wave has changed — it admits the reference and the study's east and west walls, and rules the other four back to the asset seat")
      .toEqual(["study/E", "study/N", "study/W"]);
  });

  /* The numbers above are typed from the measurement, so they can rot. This
     reads gate.py's own verdict line and requires the two to agree. */
  test("and gate.py, run for real, says the same thing", () => {
    const gate = join(repoRoot, "design", "plan-draft", "measured", "gate.py");
    expect(existsSync(gate),
      "gate.py is gone — the band's only independent reader has left the tree").toBe(true);
    /* gate.py EXITS NON-ZERO while any candidate fails, which is its whole
       job today — seven of eight are meant to fail. So a throw is the normal
       path and its stdout is the verdict; only a missing stdout means the tool
       could not run. This test skipped silently on that throw when it was
       first written, which would have made it the very thing it guards: a
       check that is green because it never ran. */
    let out = "";
    try {
      out = execFileSync("python3", [gate], { cwd: repoRoot, encoding: "utf8", stdio: "pipe" });
    } catch (e) {
      out = e.stdout ? String(e.stdout) : "";
    }
    if (!out.trim()) {
      /* [Row 21, round 3 — G6] AN EMPTY STDOUT IS A FAILURE, NOT A SKIP. The
         skip was written for a tree with no measurement corpus, and a critic
         used it as an off-switch: breaking `gate.py`'s WITHHELD guard makes it
         raise a TypeError, print nothing, and this case reported a green skip
         over a tool that had crashed. The corpus is either there or it is not,
         and that is a question about the tree rather than about the tool — so
         it is asked directly, and anything else is red. */
      const corpus = join(repoRoot, "design", "plan-draft", "measured", "study-N.json");
      expect(existsSync(corpus),
        "gate.py printed nothing and its own corpus IS in the tree — the tool did not run")
        .toBe(false);
      test.skip(true, "the measurement corpus is not present here");
      return;
    }
    expect(out).toMatch(/1 of 8 admitted/);
    expect(out.match(/^study\/N\s.*PASS/m), "study/N must be the admitted one").toBeTruthy();
    /* AND THE ROUND THE SHIPPED BAND IS ABOUT, which is not that one. The
       default run above is the frozen cand-2 round with its own frozen 1010 px
       reference; the band this file imports is the standing-eye wave's, so the
       tool has to be asked the question the band is an answer to. */
    let wave = "";
    try {
      wave = execFileSync("python3", [gate, "--round", "cand6"],
        { cwd: repoRoot, encoding: "utf8", stdio: "pipe" });
    } catch (e) {
      wave = e.stdout ? String(e.stdout) : "";
    }
    expect(wave.trim(), "gate.py --round cand6 printed nothing — the tool did not run")
      .not.toHaveLength(0);
    expect(wave).toMatch(/2 of 7 admitted/);
    for (const f of ["study/E", "study/W"]) {
      expect(wave.match(new RegExp("^" + f.replace("/", "\\/") + "\\s.*PASS", "m")),
        `${f} must be admitted by the wave`).toBeTruthy();
    }
  });
});
