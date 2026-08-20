/* §12.9 + the validator's own teeth. The validator is green on the repo
 * fixtures and red — with the right finding — on each mutation class; the
 * §12.9 cross-check dispatches every enumerated triple through the REAL
 * harness (constructive per-triple probes, fresh harness per probe, both
 * directions); the bake-refusal enforcement locus is witnessed; and the two
 * product-voiced fault surfaces are exercised via row 1's own doctored-bake
 * pattern.
 */
import { test, expect, repoRoot, appUrl, stageTree, removeTree, bake } from "./helpers.mjs";
import { validate } from "../../tools/validate-fixtures.mjs";
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

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
    ["parted overlap pair (u)", "staging",
      (s) => { s.placements.chair1.u = 0.9; }, /overlap|chair1/i],
    ["parted overlap pair (depth/y-span)", "staging",
      (s) => { s.placements.stick1.depth_m = 1.6; }, /overlap|stick1/i],
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
