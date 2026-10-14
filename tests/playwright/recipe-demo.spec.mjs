// The main demo, its first recipe (design/one-world/recipes/switched-light.md; Kabe, 2026-10-13: "There should be a main demo
// with all layers … new features across projects can be tested there"): the golden lane, pattern-buffer's facts loaded
// straight in (lab/recipes/switched-light.facts.json), the room laid out from them by rule (src/make/recipe.js) and played
// (src/make/recipe-play.js). "the world is empty, except for a room with no exits. The room is completely dark. There is a
// light switch in the room, that if flipped turns on a light, the brightly illuminate the room and shows that there is a
// friendly dog": a room with no way out, dark; the switch works the light across the room; the person who thinks they're
// a dog is there, on all fours, seen once it is lit. The place's proof passes at load.
import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

const BASE = process.env.BASE || "http://localhost:8794";
const LOAD = 300_000;
test.use({ launchOptions: { args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } });

test("the facts are read before anything is built: what can't be built is refused with its reason", () => {
  const ROOT = new URL("../../", import.meta.url).href;
  const r = JSON.parse(execFileSync(process.execPath, ["--input-type=module", "-e", `
const R = await import(${JSON.stringify(ROOT + "src/make/recipe.js")}), fs = await import("node:fs");
const doc = JSON.parse(fs.readFileSync(new URL("lab/recipes/switched-light.facts.json", ${JSON.stringify(ROOT)})));
const drop = (attr) => ({ ...doc, facts: doc.facts.filter(f => f.attribute !== attr) });
console.log(JSON.stringify({ good: R.readFacts(doc), noExits: R.readFacts(drop("exits")).findings.map(f => f.what), noType: R.readFacts(drop("link_type")).findings.map(f => f.what),
  ghost: R.readFacts({ ...doc, facts: [...doc.facts, { entity: "obj:switch", attribute: "controls", value: "obj:nothing", value_type: "entity", source: { sentence: 3 } }] }).findings.map(f => f.what),
  unsourced: R.readFacts({ ...doc, facts: doc.facts.map((f, i) => i ? f : { ...f, source: undefined }) }).findings.map(f => f.what),
  authored: R.readFacts({ ...doc, facts: doc.facts.map((f, i) => i ? f : { ...f, source: { authored: "Kabe 2026-10-13", note: "the test's" } }) }).findings.map(f => f.what),
  both: R.readFacts({ ...doc, facts: doc.facts.map((f, i) => i ? f : { ...f, source: { chapter: 1, sentence: 1, authored: "manifest" } }) }).findings.map(f => f.what) }));`], { encoding: "utf8" }));
  expect(r.good.ok).toBe(true); expect(r.good.links).toEqual([{ from: "obj:switch", to: "obj:light", type: "switch", mode: "latching" }]);
  expect(r.noExits.join(" "), "a room must say it has no exits").toMatch(/says nothing of its exits/);
  expect(r.noType.join(" ")).toMatch(/says no link type/);
  expect(r.ghost.join(" ")).toMatch(/points at obj:nothing/);
  expect(r.unsourced.join(" "), "every fact cites its sentence or its author").toMatch(/cites neither its sentence nor its author/);
  expect(r.authored, "an authored fact, its author named: read").toEqual([]);
  expect(r.both.join(" "), "one or the other").toMatch(/cites both a sentence and an author/);
});

test("code-lock's proof: the way out is reached only through the code the person who thinks they're a dog tells", () => {
  const ROOT = new URL("../../", import.meta.url).href;
  const r = JSON.parse(execFileSync(process.execPath, ["--input-type=module", "-e", `
const R = await import(${JSON.stringify(ROOT + "src/make/recipe.js")}), fs = await import("node:fs");
const kinds = [...(await import(${JSON.stringify(ROOT + "src/make/kinds/electric-1900.js")})).default, ...(await import(${JSON.stringify(ROOT + "src/make/kinds/modern.js")})).default, ...(await import(${JSON.stringify(ROOT + "src/make/kinds/house-1660.js")})).default];
const kindOf = (n) => kinds.find(k => k.kind === n) || null, read = (n) => JSON.parse(fs.readFileSync(new URL("lab/recipes/" + n + ".facts.json", ${JSON.stringify(ROOT)})));
const told = read("code-lock"), untold = { ...told, facts: told.facts.filter(f => !String(f.frame).startsWith("knows:")) }, plan = R.planRecipe(told, { kinds });
console.log(JSON.stringify({ told: R.proveRecipe(plan, kindOf), untold: R.proveRecipe(R.planRecipe(untold, { kinds }), kindOf), door: plan.openings[0]?.door, keypad: plan.recipe.things.find(t => t.id === "obj:keypad")?.over }));`], { encoding: "utf8" }));
  expect(r.told, "told: out").toMatchObject({ ok: true, reached: ["room", "outside"], known: ["obj:keypad.code"] });
  expect(r.untold, "no one tells it: no way out, and the proof says so").toMatchObject({ ok: false, unreachable: ["outside"], known: [] });
  expect(r.door, "the door a keypad bolts is a bolted one").toEqual({ kind: "door/panelled-bolted" });
  expect(r.keypad, "the keypad's code is the facts'").toEqual({ code: "4071", knows: "obj:keypad.code" });
});

test("take-and-drop reads the steward's clothes as worn garments and stands their wearer in the hall", () => {
  const ROOT = new URL("../../", import.meta.url).href;
  const r = JSON.parse(execFileSync(process.execPath, ["--input-type=module", "-e", `
const R = await import(${JSON.stringify(ROOT + "src/make/recipe.js")}), fs = await import("node:fs");
const kinds = [...(await import(${JSON.stringify(ROOT + "src/make/kinds/electric-1900.js")})).default, ...(await import(${JSON.stringify(ROOT + "src/make/kinds/modern.js")})).default, ...(await import(${JSON.stringify(ROOT + "src/make/kinds/house-1660.js")})).default,
  ...(await import(${JSON.stringify(ROOT + "src/make/kinds/furniture-1660.js")})).default, ...(await import(${JSON.stringify(ROOT + "src/make/kinds/household-1660.js")})).default];
const doc = JSON.parse(fs.readFileSync(new URL("lab/recipes/take-and-drop.facts.json", ${JSON.stringify(ROOT)})));
const read = R.readFacts(doc), plan = R.planRecipe(doc, { kinds });
const alias = R.readFacts({ ...doc, facts: doc.facts.map(f => f.attribute === "colour" ? { ...f, attribute: "color" } : f) });
const bad = { ...doc, facts: doc.facts.map(f => f.attribute === "worn_by" ? { ...f, value: "obj:hall_table" } : f) };
let refused = null; try { R.planRecipe(bad, { kinds }); } catch (e) { refused = e.message; }
console.log(JSON.stringify({ read, people: plan.recipe.people, things: plan.recipe.things.map(t => t.id), hall: plan.rooms.find(q => q.id === "hall").rect,
  table: plan.recipe.things.find(t => t.id === "obj:hall_table"), chosen: plan.chosen, alias: alias.people, bad: R.readFacts(bad), refused }));`], { encoding: "utf8" }));
  expect(r.read.ok, "the golden facts, including their clothes, are buildable").toBe(true);
  const steward = r.read.people.find(p => p.id === "person:steward");
  expect(steward).toMatchObject({ in: "place:hall", place: "place:hall" });
  expect(steward.wears).toHaveLength(2);
  expect(steward.wears).toEqual(expect.arrayContaining([
    { id: "obj:steward_doublet", kind: "doublet", aspects: { colour: "black" } },
    { id: "obj:steward_band", kind: "falling_band", aspects: { colour: "white" } },
  ]));
  for (const g of steward.wears) {
    expect(r.read.things.find(t => t.id === g.id), "the garment is read from the facts").toMatchObject({ kind: g.kind });
    expect(r.things, "worn garments are built by the people layer").not.toContain(g.id);
  }
  expect(r.alias.find(p => p.id === steward.id).wears, "the color spelling reaches the same colour aspect").toEqual(steward.wears);
  const p = r.people.find(p => p.id === steward.id), [x, y] = p.at;
  expect(p).toMatchObject({ room: "hall", wears: steward.wears });
  expect(x).toBeGreaterThan(r.hall.x0); expect(x).toBeLessThan(r.hall.x1);
  expect(y).toBeGreaterThan(r.hall.y0); expect(y).toBeLessThan(r.hall.y1);
  const distance = Math.hypot(x - r.table.at[0], y - r.table.at[1]);
  expect(distance, "the steward stands beside the hall table").toBeGreaterThan(0.4);
  expect(distance).toBeLessThan(2);
  expect(r.chosen, "the facts' room is preserved and the chosen position is disclosed").toEqual(expect.arrayContaining([
    expect.objectContaining({ what: expect.stringMatching(/where.*steward.*is/i), value: p.at, why: expect.any(String) }),
  ]));
  expect(r.bad.ok, "a table cannot wear clothes").toBe(false);
  expect(r.bad.findings.map(f => `${f.at}: ${f.what}`).join(" ")).toMatch(/worn_by.*person|person.*worn_by/);
  expect(r.refused, "invalid wearing is refused before building").toMatch(/recipe refused/);
});

test("code-lock's teller cannot give a code from the unreachable side of its locked door", () => {
  const ROOT = new URL("../../", import.meta.url).href;
  const r = JSON.parse(execFileSync(process.execPath, ["--input-type=module", "-e", `
const R = await import(${JSON.stringify(ROOT + "src/make/recipe.js")}), fs = await import("node:fs");
const kinds = [...(await import(${JSON.stringify(ROOT + "src/make/kinds/electric-1900.js")})).default, ...(await import(${JSON.stringify(ROOT + "src/make/kinds/modern.js")})).default, ...(await import(${JSON.stringify(ROOT + "src/make/kinds/house-1660.js")})).default];
const doc = JSON.parse(fs.readFileSync(new URL("lab/recipes/code-lock.facts.json", ${JSON.stringify(ROOT)})));
const plan = R.planRecipe(doc, { kinds }), kindOf = n => kinds.find(k => k.kind === n) || null;
const before = R.proveRecipe(plan, kindOf);
plan.recipe.people = plan.recipe.people.map(p => ({ ...p, room: "outside" }));
console.log(JSON.stringify({ before, after: R.proveRecipe(plan, kindOf) }));`], { encoding: "utf8" }));
  expect(r.before).toMatchObject({ ok: true, known: ["obj:keypad.code"] });
  expect(r.after, "knowing the code behind its locked door does not make the teller reachable").toMatchObject({ ok: false, reached: ["room"], unreachable: ["outside"], known: [] });
});

test("recipe people adopt standing people while preserving an unsupported posture's stand-in", () => {
  const ROOT = new URL("../../", import.meta.url).href;
  const r = JSON.parse(execFileSync(process.execPath, ["--input-type=module", "-e", `
const { playRecipe } = await import(${JSON.stringify(ROOT + "src/make/recipe-play.js")});
// Geometry is irrelevant to this hand-off: a minimal scene graph lets the recipe build and remove its stand-ins.
class Vec { constructor(x=0,y=0,z=0) { this.set(x,y,z); } set(x,y,z) { Object.assign(this,{x,y,z}); return this; } copy(v) { return this.set(v.x,v.y,v.z); } toArray() { return [this.x,this.y,this.z]; } }
class Node { constructor(geometry,material) { Object.assign(this,{geometry,material,position:new Vec(),rotation:new Vec(),userData:{},children:[]}); }
 add(n) { n.parent=this; this.children.push(n); } updateMatrixWorld() {} worldToLocal(v) { return v; }
 traverse(fn) { fn(this); for(const n of this.children) n.traverse(fn); }
 removeFromParent() { this.parent.children=this.parent.children.filter(n=>n!==this); this.parent=null; } }
class Disposable { dispose() {} }
class Box { setFromObject() { return this; } getSize(v) { return v.set(1,2,1); } getCenter(v) { return v.set(0,1,0); } }
const THREE={Vector3:Vec,Group:Node,Mesh:Node,Box3:Box,BoxGeometry:Disposable,CapsuleGeometry:Disposable,SphereGeometry:Disposable,MeshStandardMaterial:Disposable,MeshBasicMaterial:Disposable};
const people=[{id:"person:dog",names:["dog"],posture:"all_fours",at:[1,1],room:"hall",tells:[],wears:[]},
 {id:"person:steward",names:["steward"],posture:"standing",at:[2,2],room:"hall",tells:[],wears:[{id:"obj:coat",kind:"doublet",aspects:{colour:"black"}}]}];
const grp=new Node(), plan={entrance:"hall",rooms:[{id:"hall",floor:"ground"}],openings:[],stairs:[],recipe:{things:[],links:[],people}};
const recipe=playRecipe({THREE,plan,manor:{rooms:new Map([["hall",{grp}]]),levelOf:()=>0,heightOf:()=>3},works:{rules(){}},kindOf:()=>null});
const before=recipe.dump(), added=[],notes=[];
recipe.usePeople({add(doc){const p={doc};added.push(p);return {wear(w){p.wears=w;},face(f){p.face=f;}};}},n=>notes.push(n));
console.log(JSON.stringify({before,after:recipe.dump(),remaining:[...recipe.people.keys()],placements:recipe.placements,added,notes}));`], { encoding: "utf8" }));
  expect(r.added).toHaveLength(1);
  expect(r.added[0]).toMatchObject({ doc: { id: "person:steward", at: { room: "hall", pos: [2, 0, -2] } }, wears: [{ id: "obj:coat", kind: "doublet", aspects: { colour: "black" } }] });
  expect(r.remaining).toEqual(["person:dog"]);
  expect(r.after, "the unsupported person keeps precisely their original report").toBe(r.before.split("\n").find(line => line.startsWith('"person:dog";')));
  expect(r.placements, "both resting records remain available to the outbox").toHaveLength(2);
  expect(r.notes).toEqual([expect.stringMatching(/person:dog.*all_fours.*stand-in/)]);
});

test("the dark room: no way out, dark; the switch lights the light across the room; the person who thinks they're a dog is there", async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium", "the demo is the same on every engine");
  test.setTimeout(2 * LOAD);
  const page = await browser.newPage({ viewport: { width: 900, height: 600 } }), errs = []; page.on("pageerror", (e) => errs.push(e.message));
  // (?perf: the perf card and its per-layer cost line, Photonic's ask: people ms, place ms, loading)
  await page.goto(`${BASE}/lab/manor/index.html?webgl=1&fresh&perf&plan=recipe&recipe=switched-light`, { timeout: LOAD });
  await page.waitForFunction(() => window.__ok, null, { timeout: LOAD });
  const start = await page.evaluate(() => { const r = window.__recipe(), W = window.__works, sw = window.__recipeThing("obj:switch"), lt = window.__recipeThing("obj:light");
    return { proof: r.proof, plan: window.__plan.rooms.length, openings: window.__plan.openings.length, windows: window.__plan.windows.length, person: r.person,
      sw: W.stateOf(sw, "switch"), light: W.stateOf(lt, "light"), lit: window.__lights().fires.filter(f => f && f.room === "room").length, chosen: r.chosen.map(c => c.what) }; });
  expect(start.proof.ok, "the place's proof").toBe(true);
  expect([start.plan, start.openings, start.windows], "one room, no door, no window").toEqual([1, 0, 0]);
  expect([start.sw, start.light, start.lit], "dark: the switch off, the light out, nothing lighting the room").toEqual(["off", "out", 0]);
  expect(start.person, "the person, on all fours").toEqual({ room: "room", person: "person:dog", posture: "all_fours" });
  expect(start.chosen, "every choice the facts leave open is said").toEqual(expect.arrayContaining(["the room's width, depth and height", "where the light switch is", "where you arrive"]));
  const after = await page.evaluate(async () => { const W = window.__works, sw = window.__recipeThing("obj:switch"), lt = window.__recipeThing("obj:light");
    window.__actOn(sw, "switch"); for (let t = 0; t < 200 && !window.__lights().fires.some(f => f && f.room === "room" && f.level > 0.95); t++) await new Promise(r => setTimeout(r, 50));
    return { sw: W.stateOf(sw, "switch"), light: W.stateOf(lt, "light"), lit: window.__lights().fires.filter(f => f && f.room === "room" && f.level > 0.95).length, byHand: W.act({ b: lt, aff: "light", i: null }).refused }; });
  expect([after.sw, after.light], "flipped: the light across the room comes on").toEqual(["on", "lit"]);
  expect(after.lit, "and it lights the room").toBe(1);
  expect(after.byHand, "the light is worked from its switch alone").toMatch(/worked from its switch/);
  // the cost line: each layer's ms a tick, and loading by stage, on the card a phone's screenshot carries
  await page.waitForFunction(() => { const L = window.__layers(); return L && ["you", "place", "people", "land", "lights", "render"].every(k => L[k]?.n > 0); }, null, { timeout: 60_000 });
  const cost = await page.evaluate(() => ({ layers: window.__layers(), card: document.getElementById("perf-card")?.textContent || "" }));
  for (const [k, v] of Object.entries(cost.layers)) expect(v.p95, `${k}: a tick's share, in ms`).toBeGreaterThanOrEqual(v.p50);
  expect(cost.card, "the card says each layer").toMatch(/layers ms p50\/p95[^\n]*people [\d.]+\/[\d.]+[^\n]*render/);
  expect(cost.card, "and loading by stage, to walkable").toMatch(/loading s:[^\n]*built [\d.]+[^\n]*walkable[= ][^\n]*/);
  expect(errs).toEqual([]);
  await page.close();
});

// The same continuity check runs against the local stand-in and Photonic's public pinned population. Availability is
// checked before opening the latter; an import, build, or application error after that is a failure, never a skip.
const PINNED_PEOPLE = "https://5000stadia.github.io/photonic-phone-test/v/p3/people/index.js";
for (const [name, people] of [["stand-in", null], ["legacy reference people", "reference"], ["pinned Photonic people", PINNED_PEOPLE]]) {
  test(`take-and-drop people: ${name} keeps the steward's hall and wardrobe byte-identical on reload`, async ({ browser, browserName, request }) => {
    test.skip(browserName !== "chromium", "the demo is the same on every engine");
    test.setTimeout(3 * LOAD);
    if (people === PINNED_PEOPLE) {
      let unavailable = null;
      try { const response = await request.get(people, { timeout: 30_000 }); if (!response.ok()) unavailable = `HTTP ${response.status()}`; }
      catch (e) { unavailable = e.message; }
      test.skip(!!unavailable, `the pinned people URL cannot be fetched: ${unavailable}`);
    }
    const page = await browser.newPage({ viewport: { width: 900, height: 600 } }), errs = [], consoleErrors = [];
    let reportPageError;
    // Resolving with an error (rather than rejecting an unattended promise) also covers errors during navigation.
    const firstPageError = new Promise(resolve => { reportPageError = resolve; });
    page.on("pageerror", e => { const message = e.message || String(e) || "page error with no message"; errs.push(message); reportPageError({ error: message }); });
    page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text().slice(0, 2000)); });
    const ready = async stage => {
      try {
        const result = await Promise.race([
          page.waitForFunction(() => window.__ok, null, { timeout: LOAD }).then(() => ({ ready: true })),
          firstPageError,
        ]);
        if ("error" in result) throw new Error(result.error);
      } catch (e) {
        const status = await page.locator("#status").textContent({ timeout: 1000 }).catch(() => "unavailable");
        throw new Error(`${stage}: ${e.message}\n#status: ${status}\npage errors: ${JSON.stringify(errs)}\nconsole errors: ${JSON.stringify(consoleErrors)}`);
      }
    };
    try {
      await page.goto(`${BASE}/lab/manor/index.html?webgl=1&fresh&plan=recipe&recipe=take-and-drop${people ? `&people=${encodeURIComponent(people)}` : ""}`, { timeout: LOAD });
      await ready("initial load");
      if (people) expect(await page.evaluate(() => !!window.__people), "the requested population was constructed").toBe(true);
      if (people === PINNED_PEOPLE) expect(await page.evaluate(() => typeof window.__people.dump), "the pinned population supplies its continuity report").toBe("function");
      const inspect = () => page.evaluate(({ pinned }) => {
        const dump = window.__peopleDump(), person = window.__recipe().person;
        const facts = window.__outbox({ placements: true }).placements;
        const hallGroup = window.__manor.rooms.get("hall").grp;
        let actual = null;
        if (pinned) {
          const p = window.__people.get("person:steward"), where = p?.where();
          if (where) actual = { room: where.room, pos: where.pos, facing: p.state().heading };
        } else {
          const p = hallGroup.getObjectByName("recipe-person:person:steward");
          if (p) { hallGroup.updateMatrixWorld(true); const at = new window.__THREE.Vector3(); p.getWorldPosition(at);
            actual = { room: p.userData.room, pos: at.toArray(), facing: p.rotation.y, parentedInHall: p.parent === hallGroup }; }
        }
        return { dump, person, actual, facts: facts.filter(f => ["person:steward", "obj:steward_doublet", "obj:steward_band"].includes(f.entity)),
          hall: window.__plan.rooms.find(r => r.id === "hall").rect, things: window.__recipe().things.map(t => t.id) };
      }, { pinned: people === PINNED_PEOPLE });
      const before = await inspect();
      expect(typeof before.dump, "the continuity report is text").toBe("string");
      expect(before.dump, "the steward's actual room").toMatch(/"person:steward";[^\n]*\broom="hall";/);
      expect(before.dump, "black doublet").toMatch(/doublet:[^|\]\n]*colour=black/);
      expect(before.dump, people === PINNED_PEOPLE ? "Photonic retains the supplied white falling_band in its worn record" : "white falling band").toMatch(/falling_band:[^|\]\n]*colour=white/);
      expect(before.person).toMatchObject({ person: "person:steward", room: "hall", posture: "standing" });
      expect(before.facts, "the person's place is an author fact").toEqual(expect.arrayContaining([
        expect.objectContaining({ entity: "person:steward", attribute: "in", value: "place:hall", value_type: "entity", frame: "canon", source: expect.objectContaining({ lane: "author" }) }),
        expect.objectContaining({ entity: "person:steward", attribute: "posture", value: "standing", value_type: "literal", frame: "canon", source: expect.objectContaining({ lane: "author" }) }),
        expect.objectContaining({ entity: "person:steward", attribute: "facing", value: expect.any(Number), value_type: "literal", frame: "canon", source: expect.objectContaining({ lane: "author" }) }),
        expect.objectContaining({ entity: "person:steward", attribute: "rest_pos", value: expect.any(Array), value_type: "literal", frame: "canon", source: expect.objectContaining({ lane: "author" }) }),
      ]));
      const rest = before.facts.find(f => f.entity === "person:steward" && f.attribute === "rest_pos").value;
      expect(rest).toHaveLength(3); expect(rest.every(Number.isFinite)).toBe(true);
      expect(before.actual, "the displayed person is in the hall").toMatchObject({ room: "hall", pos: rest });
      if (people !== PINNED_PEOPLE) expect(before.actual.parentedInHall, "the stand-in belongs to the hall scene group").toBe(true);
      expect(rest[0]).toBeGreaterThan(before.hall.x0); expect(rest[0]).toBeLessThan(before.hall.x1);
      expect(-rest[2]).toBeGreaterThan(before.hall.y0); expect(-rest[2]).toBeLessThan(before.hall.y1);
      const decimal = n => n.toFixed(2) === "-0.00" ? "0.00" : n.toFixed(2);
      expect(before.dump).toContain(`position=[${rest.map(decimal).join(",")}]`);
      const facing = before.facts.find(f => f.entity === "person:steward" && f.attribute === "facing").value;
      expect(Number.isFinite(facing)).toBe(true); expect(before.dump).toContain(`facing=${decimal(facing)};`);
      expect(before.actual.facing, "the displayed person's direction agrees with the author fact").toBeCloseTo(facing, 8);
      expect(before.facts.some(f => ["motion", "velocity", "phase", "doing"].includes(f.attribute)), "only resting placement is authored").toBe(false);
      const garments = before.facts.filter(f => f.attribute === "worn_by");
      expect(garments, "each supplied garment is worn by the steward").toHaveLength(2);
      for (const g of garments) {
        expect(g).toMatchObject({ value: "person:steward", value_type: "entity", frame: "canon", source: expect.objectContaining({ lane: "author" }) });
        expect(before.things).not.toContain(g.entity);
        expect(before.facts.some(f => f.entity === g.entity && f.attribute === "in"), "worn clothes have no standalone room placement").toBe(false);
      }
      expect(garments.map(g => before.facts.find(f => f.entity === g.entity && f.attribute === "colour")?.value).sort()).toEqual(["black", "white"]);
      await page.reload({ timeout: LOAD });
      await ready("reload");
      const after = await inspect();
      expect(after.dump, "the complete continuity record survives reload").toBe(before.dump);
      expect(after.person).toEqual(before.person);
      expect(after.actual, "the displayed placement survives reload").toEqual(before.actual);
      expect(after.facts, "the author outbox preserves the same placement and wardrobe").toEqual(before.facts);
      expect(errs).toEqual([]);
    } finally { await page.close(); }
  });
}

test("code-lock in play: talked to, the person tells the code; the keypad keys it in; the bolt draws back and the door opens on the day outside", async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium", "the demo is the same on every engine");
  test.setTimeout(2 * LOAD);
  const page = await browser.newPage({ viewport: { width: 900, height: 600 } }), errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${BASE}/lab/manor/index.html?webgl=1&fresh&plan=recipe&recipe=code-lock`, { timeout: LOAD });
  await page.waitForFunction(() => window.__ok, null, { timeout: LOAD });
  const before = await page.evaluate(() => ({ proof: window.__recipe().proof.ok, known: window.__known(), outside: !!window.__site, door: window.__works.act({ b: window.__recipeThing("obj:door"), aff: "leaf", i: null }).refused }));
  expect(before.proof).toBe(true); expect(before.known, "nothing known yet").toEqual([]);
  expect(before.outside, "the world outside is there (the room's dark is its own)").toBe(true);
  expect(before.door, "bolted").toMatch(/bolted/);
  const told = await page.evaluate(() => { window.__recipeTalk("person:dog"); return { known: window.__known(), said: window.__said.at(-1) }; });
  expect(told.known).toEqual(["obj:keypad.code"]); expect(told.said, "the digits said").toMatch(/4, 0, 7, 1/);
  await page.evaluate(() => window.__actOn(window.__recipeThing("obj:keypad"), "entry")); await page.waitForSelector("#codepad", { timeout: 20_000 });
  await page.click('#codepad button[data-k="known"]');
  await page.waitForFunction(() => !document.getElementById("codepad"), null, { timeout: 10_000 });
  const after = await page.evaluate(() => { const d = window.__recipeThing("obj:door"); return { lock: window.__works.stateOf(d, "lock"), open: window.__works.act({ b: d, aff: "leaf", i: null }).did, leaf: window.__works.stateOf(d, "leaf") }; });
  expect(after, "the bolt drawn, the door opens").toEqual({ lock: "unlocked", open: true, leaf: "open" });
  expect(errs).toEqual([]);
  await page.close();
});

// take-and-drop (design/one-world/recipes/take-and-drop.md; Kabe, 2026-10-13: "placement … and status changes in pattern
// buffer … When an item is taken"): two rooms from the facts, joined by an open door; the page in the book on the study's
// table, kept shut in until the book is opened; taken, it is in your hands; put down on the hall's table, it is on that
// table, each as pattern-buffer's facts (the outbox, R75)
test("take-and-drop in play: the page in the book is shut in until the book is opened; taken, it is held; put on the hall's table, it is in it", async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium", "the demo is the same on every engine");
  test.setTimeout(2 * LOAD);
  const page = await browser.newPage({ viewport: { width: 900, height: 600 } }), errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${BASE}/lab/manor/index.html?webgl=1&fresh&plan=recipe&recipe=take-and-drop`, { timeout: LOAD });
  await page.waitForFunction(() => window.__ok, null, { timeout: LOAD });
  const before = await page.evaluate(() => { const W = window.__works, R = window.__recipe(), pg = window.__recipeThing("obj:page"), book = window.__recipeThing("obj:book");
    const n = window.__outbox().events.length; window.__actOn(pg, null);
    return { proof: R.proof.ok, reached: R.proof.reached, rooms: window.__plan.rooms.map(q => q.id), things: R.things.map(t => t.id).sort(),
      inBook: pg.host?.b === book, bookOn: book.host?.b === window.__recipeThing("obj:study_table"), shut: W.shutIn(pg), tookShut: W.held().includes(pg), wrote: window.__outbox().events.length - n,
      placements: window.__outbox({ placements: true }).placements.filter(f => ["obj:page", "obj:book"].includes(f.entity) && f.attribute === "in").map(f => [f.entity, f.value]).sort() }; });
  expect(before.proof, "the place's proof").toBe(true);
  expect(before.rooms, "two rooms, as the facts say").toEqual(["study", "hall"]); expect(before.reached).toEqual(expect.arrayContaining(["study", "hall"]));
  expect(before.things, "the facts' things, and each room's candle (chosen: the facts don't call them dark)").toEqual(["obj:book", "obj:hall_candle", "obj:hall_table", "obj:page", "obj:study_candle", "obj:study_table"]);
  expect([before.inBook, before.bookOn], "the page in the book, the book on the table").toEqual([true, true]);
  expect([before.shut, before.tookShut, before.wrote], "shut in: it can't be taken, and nothing is written").toEqual([true, false, 0]);
  expect(before.placements, "where they are, as made").toEqual([["obj:book", "obj:study_table"], ["obj:page", "obj:book"]]);
  await page.evaluate(() => window.__actOn(window.__recipeThing("obj:book"), "cover"));
  await page.waitForFunction(() => !window.__works.shutIn(window.__recipeThing("obj:page")), null, { timeout: 30_000 });
  const after = await page.evaluate(() => { const W = window.__works, pg = window.__recipeThing("obj:page"), last = () => { const e = window.__outbox().events.at(-1); return e && [e.entity, e.attribute, e.value]; };
    window.__actOn(pg, null); const took = [W.held().includes(pg), last()];
    const h = window.__plan.rooms.find(q => q.id === "hall").rect; window.__place((h.x0 + h.x1) / 2, h.y0 + 0.8, 0);
    window.__actOn(window.__recipeThing("obj:hall_table"), null); return { took, put: [W.held().includes(pg), last()], room: pg.node.userData.room }; });
  expect(after.took, "taken: in your hands").toEqual([true, ["obj:page", "held_by", "person:player"]]);
  expect(after.put, "put on the hall's table: in it").toEqual([false, ["obj:page", "in", "obj:hall_table"]]);
  // "Reload, and it is in the hall": the world keeps where it was put (on: the hall's table), and the page seats it there again
  await page.reload({ timeout: LOAD }); await page.waitForFunction(() => window.__ok, null, { timeout: LOAD });
  const again = await page.evaluate(() => { const T = window.__THREE, pg = window.__recipeThing("obj:page"), ht = window.__recipeThing("obj:hall_table"), h = window.__plan.rooms.find(q => q.id === "hall").rect;
    const at = new T.Vector3(); pg.node.getWorldPosition(at);
    return { on: pg.host?.b === ht, held: window.__works.held().includes(pg), shown: pg.node.visible, inHall: at.x > h.x0 && at.x < h.x1 && -at.z > h.y0 && -at.z < h.y1, room: pg.node.userData.room }; });
  expect(again, "reloaded: on the hall's table, where it was put").toEqual({ on: true, held: false, shown: true, inHall: true, room: "hall" });
  expect(errs).toEqual([]);
  await page.close();
});
