// The checks of tests/playwright/narrator-conditions.spec.mjs, run in node (Playwright's loader can't import src/make's
// modules): node tools/narrator-conditions.mjs prints each check and exits 1 on any failure.
// pattern-buffer's beat conditions read by the narrator (R58; BEATS-V1 r1.1, pattern-buffer 95ad945): patternbuffer.condition/1,
// construct's arc/io.py JSON, read verbatim (src/make/narrator.js fromCondition). Every one of pattern-buffer's 24 fixture
// conditions (tests/fixtures/patternbuffer-conditions.json, copied from its tests/fixtures/construct_conditions.json, with
// its schema beside it) is either read and evaluated as construct means it, or refused with the reason this house can't
// evaluate it; none is read as quietly false. Then a beat written in it, in play. Pure: node, no browser, no model.
const fails = [], checks = [];
const expect = (v, what = "") => { const at = (ok, want) => { checks.push(what); if (!ok) fails.push(`${what}: got ${JSON.stringify(v)}, want ${want}`); };
  const self = { toBe: (w) => at(Object.is(v, w), JSON.stringify(w)), toEqual: (w) => at(JSON.stringify(v) === JSON.stringify(w), JSON.stringify(w)), toMatch: (re) => at(typeof v === "string" && re.test(v), String(re)) };
  self.not = { toBe: (w) => at(!Object.is(v, w), `not ${JSON.stringify(w)}`) }; return self; };
const test = (name, f) => { const n = fails.length; f(); console.log(`${fails.length > n ? "FAIL" : "ok  "} ${name}`); };
import { readFileSync } from "node:fs";
import { makeNarrator, parseExpr, evalExpr, checkNarrator } from "../src/make/narrator.js";

const FX = JSON.parse(readFileSync(new URL("../tests/fixtures/patternbuffer-conditions.json", import.meta.url), "utf8"));
const SCHEMA = JSON.parse(readFileSync(new URL("../tests/fixtures/patternbuffer.condition-1.json", import.meta.url), "utf8"));
const read = (c) => { try { return { ast: parseExpr(c) }; } catch (e) { return { refused: e.message }; } };

test("all 24 of pattern-buffer's conditions: read, or refused with the reason", () => {
  expect(FX.schema).toBe("patternbuffer.condition/1"); expect(SCHEMA.title).toBe("patternbuffer.condition/1");
  // every op the schema names is one the adapter knows (a new op in the schema fails here first)
  expect(SCHEMA.$defs.expr.oneOf.map(x => x.$ref.split("/").pop()).sort()).toEqual(["all_of", "any_of", "at_least", "beat_achieved", "clock_fired", "in_frame", "located", "not", "occurred", "quantity", "state_is", "turns_elapsed", "turns_quiet"]);
  const r = Object.fromEntries(FX.conditions.map(c => [c.name, read(c.condition)]));
  expect(Object.keys(r).length).toBe(24);
  const refused = Object.fromEntries(Object.entries(r).filter(([, v]) => v.refused).map(([k, v]) => [k, v.refused]));
  expect(Object.keys(refused).sort(), "refused: what this house can't evaluate").toEqual(["clock_fired_n", "in_frame", "nested", "occurred_defaults", "occurred_full"]);
  expect(refused.in_frame).toMatch(/reads only the player's frame/);
  expect(refused.clock_fired_n).toMatch(/plot frame plot:b: this house plays one arc/);
  for (const k of ["occurred_defaults", "occurred_full", "nested"]) expect(refused[k], k).toMatch(/kind (confrontation|theft|alarm): the page observes learn take put/);
  // the same conditions as a beat stores them, a JSON string literal
  for (const c of FX.conditions) expect(!!read(JSON.stringify(c.condition)).refused, c.name).toBe(!!r[c.name].refused);
});

test("each one read is evaluated as construct means it, true and false", () => {
  const F = (o = {}) => ({ learned: new Set(), held: new Set(), opened: new Set(), said: new Set(), vars: {}, at: null, people: {}, talking: null, turns: 0, quiet: 0, phase: "setup", cov: {},
    fired: new Set(), done: new Set(), revealed: new Set(), events: [], world: null, knows: null, ...o });
  const W = (m) => (e, a) => m[`${e}|${a}`];
  const ev = (name, f) => evalExpr(parseExpr(FX.conditions.find(c => c.name === name).condition), f);
  const both = (name, yes, no) => { expect(ev(name, yes), `${name}: true`).toBe(true); expect(ev(name, no), `${name}: false`).toBe(false); };
  both("state_is", F({ world: W({ "person:watson|mood": "calm" }) }), F({ world: W({ "person:watson|mood": "cross" }) }));
  expect(ev("state_is", F()), "no world read: nothing known").toBe(false);
  both("state_is_nonstring_value", F({ world: W({ "obj:safe|locked": true }) }), F({ world: W({ "obj:safe|locked": "true" }) }));
  both("located", F({ people: { holmes: "study" } }), F({ people: { holmes: "hall" } }));
  both("beat_achieved", F({ done: new Set(["find_body"]) }), F());
  both("clock_fired", F({ fired: new Set(["dawn"]) }), F());
  both("turns_elapsed", F({ turns: 12 }), F({ turns: 11 })); both("turns_quiet", F({ quiet: 4 }), F({ quiet: 3 }));
  const ox = (v) => F({ world: W({ "ship:alpha|oxygen": v, "ship:alpha|fuel": v / 100 }) });
  both("quantity_ge", ox(50), ox(49)); both("quantity_gt", ox(51), ox(50)); both("quantity_le", ox(50), ox(51)); both("quantity_lt", ox(49), ox(50));
  both("quantity_eq", ox(50), ox(51)); both("quantity_ne", ox(51), ox(50)); both("quantity_float", ox(40), ox(60));
  expect(ev("quantity_ge", F({ world: W({ "ship:alpha|oxygen": "50" }) })), "a quantity that isn't a number: false").toBe(false);
  both("not", F({ quiet: 1 }), F({ quiet: 2 }));
  both("all_of", F({ people: { a: "b" }, turns: 1 }), F({ people: { a: "b" }, turns: 0 }));
  both("any_of", F({ turns: 30 }), F({ turns: 29 })); expect(ev("any_of", F({ done: new Set(["x"]) }))).toBe(true);
  both("at_least", F({ turns: 1, quiet: 1 }), F({ turns: 1 }));
  expect(ev("at_least", F({ turns: 1, world: W({ "e:a|in": "p:b" }) })), "a thing located through the world's in").toBe(true);
  expect(ev("empty_operands", F()), "all of nothing: true").toBe(true);
  // the player's own frame, and the player's place
  expect(evalExpr(parseExpr({ op: "in_frame", frame: "knows:person:player", entity: "obj:keypad", attribute: "code", value: "4071" }), F({ knows: (e, a, v) => e === "obj:keypad" && v === "4071" }))).toBe(true);
  expect(evalExpr(parseExpr({ op: "located", entity: "person:player", place: "place:study" }), F({ at: "study" }))).toBe(true);
  // what happened, as the page observes it (an event kind it keeps), between turns
  const seen = F({ events: [{ turn: 2, type: "take", ids: ["vial"] }, { turn: 5, type: "take", ids: ["will"] }] });
  expect(evalExpr(parseExpr({ op: "occurred", kind: "take", participants: ["obj:vial"] }), seen)).toBe(true);
  expect(evalExpr(parseExpr({ op: "occurred", kind: "take", since: 3, min_count: 2 }), seen)).toBe(false);
  // malformed is refused, as the schema would
  for (const [c, re] of [[{ op: "state_is", entity: "a", attribute: "b" }, /needs value/], [{ op: "turns_quiet", at_least: 2, extra: 1 }, /unknown field extra/], [{ op: "teleport" }, /op is one of/]]) expect(read(c).refused).toMatch(re);
});

const ROOMS = ["hall", "study", "library", "garden"];
const kase = {
  id: "stub", theme: "a will, a poison and a lie, Michaelmas 1660", shape: "deduction",
  pillars: [{ id: "motive", label: "why" }, { id: "means", label: "how" }, { id: "opportunity", label: "when" }],
  topics: [{ id: "inheritance" }, { id: "alibi" }, { id: "that_night" }],
  cast: [
    { id: "anne", name: "Lady Anne", home: "library", clues: [{ id: "anne_quarrel", pillar: "motive", effect: "false", debunked_by: "will_changed", gate: { topic: "inheritance" }, fact: "She quarrelled with Sir Edmund over the settlement." }] },
    { id: "hale", name: "Master Hale", home: "study", is_culprit: true, clues: [{ id: "hale_claim_library", pillar: "opportunity", effect: "false", debunked_by: "pell_saw_hale", gate: { topic: "alibi" }, fact: "He says he sat in the library till midnight." }] },
    { id: "pell", name: "Dr Pell", home: "hall", arrives: true, clues: [
      { id: "pell_dosage", pillar: "means", effect: "context", gate: { topic: "that_night", requires: { learned: ["vial_found"] } }, fact: "A third of the vial would kill a strong man." },
      { id: "pell_saw_hale", pillar: "opportunity", gate: { topic: "that_night", requires: { learned: ["vial_found"] } }, fact: "He saw Hale on the back stair at eleven." }] },
    { id: "constable", name: "the Constable", arrives: true },
  ],
  things: [
    { id: "will", kind: "paper", at: "study", clue: "will_changed" }, { id: "vial", kind: "bottle", at: "study", clue: "vial_found" },
    { id: "ledger", kind: "book", at: "library", clue: "ledger_gap" }, { id: "letter", kind: "paper", at: "garden", clue: "letter_threat" },
    { id: "desk_key", kind: "key", at: "hall", hidden: true },
  ],
  clues: [
    { id: "will_changed", pillar: "motive", fact: "The will was changed the week before he died." },
    { id: "vial_found", pillar: "means", fact: "A vial of foxglove tincture, half empty." },
    { id: "ledger_gap", pillar: [], effect: "context", fact: "A page cut from the ledger." },
    { id: "letter_threat", pillar: "motive", fact: "A letter threatening to expose the steward." },
  ],
  beats: [
    { id: "pell_arrives", kind: "arrival", phase: "setup", weight: "optional", rung: "now", when: "at:hall and not here:pell", hook: "The door opens: Dr Pell, hat in hand, come for the body.", effects: [{ type: "spawn_person", id: "pell", at: "hall" }] },
    { id: "key_glint", kind: "discovery", phase: "rising", weight: "required", when: "learned>=1 and not revealed:desk_key", hook: "Something glints under the hall bench.", effects: [{ type: "reveal_thing", id: "desk_key" }] },
    { id: "pell_confides", kind: "discovery", phase: "turn", weight: "optional", rung: "converge", when: "holding:vial and not learned:pell_saw_hale", hook: "Dr Pell takes you aside, eyes on the vial.", effects: [{ type: "set_var", name: "pell_nervous", value: true }] },
    { id: "lie_exposed", kind: "lie_exposed", phase: "turn", weight: "required", rung: "now", when: "learned:hale_claim_library and learned:pell_saw_hale", hook: "Hale's chair scrapes back. He has been caught in the library that was empty.", effects: [{ type: "set_var", name: "hale_rattled", value: true }, { type: "move_person", id: "hale", to: "hall" }] },
    { id: "quiet_pressure", kind: "pressure", phase: "rising", weight: "optional", when: "quiet>=9", hook: "A bell tolls from the chapel; the household is gathering, and watching you.", effects: [{ type: "move_person", id: "hale", to: "hall" }, { type: "set_var", name: "tension", value: 1 }] },
    { id: "accusation_near", kind: "pressure", phase: "pressure", weight: "required", rung: "converge", when: "covered>=3", hook: "The Constable's horse is heard on the gravel; whatever you mean to say, say it soon.", effects: [{ type: "set_var", name: "accuse_ready", value: true }] },
  ],
  clocks: [
    { id: "storm", when: "turns>=15", effects: [{ type: "set_var", name: "storm", value: true }], line: "Rain begins against the glass." },
    { id: "constable", when: "turns>=24 and not phase:resolution", effects: [{ type: "spawn_person", id: "constable", at: "hall" }], line: "The Constable arrives from the village." },
  ],
};

test("in play: a beat written in pattern-buffer's conditions comes on the menu when they hold, through the host's world read", () => {
  const world = new Map();
  const k = { ...kase, beats: [...kase.beats, { id: "door_shut", kind: "pressure", phase: "setup", weight: "optional", rung: "now", hook: "The study door swings shut.",
    when: JSON.stringify({ op: "all_of", operands: [{ op: "state_is", entity: "obj:study_door", attribute: "state", value: "shut" }, { op: "occurred", kind: "take", participants: ["obj:vial"] }, { op: "located", entity: "person:player", place: "place:study" }] }) }] };
  expect(checkNarrator(k, { rooms: ROOMS }).findings).toEqual([]);
  const n = makeNarrator(k, { seed: 7, rooms: ROOMS, world: (e, a) => world.get(`${e}|${a}`) });
  const on = () => n.menu().some(b => b.id === "door_shut");
  n.observe({ type: "enter", room: "study" }); n.observe({ type: "take", thing: "vial" });
  expect(on(), "the door still open: not yet").toBe(false);
  world.set("obj:study_door|state", "shut");
  expect(on(), "shut, the vial taken, you in the study: on the menu").toBe(true);
  // kept with the narrator's state, so a resumed narrator remembers what happened
  const again = makeNarrator(k, { seed: 7, rooms: ROOMS, from: n.state(), world: (e, a) => world.get(`${e}|${a}`) });
  expect(again.menu().some(b => b.id === "door_shut")).toBe(true);
});

// a deck's own event kinds (construct, mc9f6f4: R20 run 12's Ironhold deck, its authored kinds as sent), mapped by the deck's
// occurred_kinds to what the page observes, or marked unobservable: the unobservable, the unmapped and the host-reserved
// walk-away are refused with their reasons, the mapped come into play on the page's own events
test("a deck's own event kinds: mapped ones play on the page's events, the rest refused with the reason", () => {
  const occ = (kind) => JSON.stringify({ op: "occurred", kind, participants: [], since: null, until: null, min_count: 1 });
  const beat = (id, kind) => ({ id, kind: "pressure", phase: "setup", weight: "optional", rung: "now", hook: `${id} lands.`, when: occ(kind) });
  const deck = { beats: [beat("last_labor_access_used", "last_labor_writ_exploited_for_escape_work_lawfully_enough_to_pass_tally_initially"),
      beat("compact_given_a_safe_lie", "northwatch_compact_bypassed_without_openly_naming_a_guard_traitor"),
      beat("river_blinks", "slack_bell_escape_into_the_frostwake_routine_before_hanging_dawn"), beat("refusal", "event:abandoned")],
    occurred_kinds: { last_labor_writ_exploited_for_escape_work_lawfully_enough_to_pass_tally_initially: "unobservable",
      northwatch_compact_bypassed_without_openly_naming_a_guard_traitor: { page: "talk", ids: ["constable"] },
      slack_bell_escape_into_the_frostwake_routine_before_hanging_dawn: { page: "enter", ids: ["garden"] } } };
  const n = makeNarrator(kase, { seed: 7, rooms: ROOMS }), m = n.merge(deck);
  expect(m.added, "mapped: in").toEqual(["compact_given_a_safe_lie", "river_blinks"]);
  const why = Object.fromEntries(m.refused.map(x => [x.id, x.why]));
  expect(why.last_labor_access_used, "marked unobservable").toMatch(/the deck marks it unobservable here/);
  expect(why.refusal, "the walk-away: the page has none yet").toMatch(/occurred event:abandoned: not something the page observes/);
  const on = (id) => n.menu().some(b => b.id === id);
  expect(on("compact_given_a_safe_lie"), "before: not yet").toBe(false);
  n.observe({ type: "talk", who: "constable" });
  expect(on("compact_given_a_safe_lie"), "talked to the constable: the compact's beat").toBe(true);
  expect(on("river_blinks"), "the garden not entered: the river's beat still waits").toBe(false);
  n.observe({ type: "enter", room: "garden" }); expect(on("river_blinks")).toBe(true);
  // a deck's mapping malformed: refused with the reason
  const bad = makeNarrator(kase, { seed: 7, rooms: ROOMS }).merge({ beats: [beat("x", "a_kind")], occurred_kinds: { a_kind: { page: "teleport", ids: [] } } });
  expect(bad.refused[0]?.why).toMatch(/page is one of learn take/);
});

for (const f of fails) console.log("  " + f);
console.log(`${checks.length} checks, ${fails.length} failed`);
process.exit(fails.length ? 1 : 0);
