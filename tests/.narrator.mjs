// Narrator engine test (M7, R58): node tests/.narrator.mjs   (pure; no browser, no model)
// A stub case (3 suspects + a constable, 8 clues, 6 beats, 2 clocks) driven through a scripted play. Checks: phases advance by
// pillar coverage, menus hold only beats provable true now (and every provable one), picks are deterministic for a seed and the
// seed matters for ties, effects stay in the closed list, unknown expression keys and bad effects are refused, a quiet stretch
// climbs the rungs to a pressure beat, a beat just landed holds the next, the model reply is checked, the state round-trips.
import { makeNarrator, parseExpr, evalExpr, checkNarrator, EFFECTS, PHASES } from "../src/make/narrator.js";
import { checkCase } from "../src/make/case.js";

let fails = 0;
const ok = (c, msg) => { if (!c) { fails++; console.log("  FAIL", msg); } };
const throws = (f, re, msg) => { try { f(); ok(false, `${msg} (did not throw)`); } catch (e) { ok(re.test(e.message), `${msg} (threw "${e.message}")`); } };

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

console.log("== the case's story parts");
const chk = checkNarrator(kase, { rooms: ROOMS });
ok(chk.ok, `stub case passes checkNarrator: ${JSON.stringify(chk.findings)}`);
ok(!chk.warnings.length, `no dead beats: ${JSON.stringify(chk.warnings)}`);
const dead = JSON.parse(JSON.stringify(kase)); dead.beats[1].when = "learned:will_changed and not learned:will_changed";
ok(checkNarrator(dead, { rooms: ROOMS }).warnings.length === 1, "a beat that contradicts itself is flagged");
console.log(`  checkNarrator ok=${chk.ok}, warnings=${chk.warnings.length}`);
ok(checkCase(kase, { plan: { rooms: ROOMS.map(id => ({ id })) } }).ok, "stub passes case.js checkCase too");

console.log("== the expression language");
const A = (s) => JSON.stringify(parseExpr(s));
ok(A("learned:a and holding:k or not opened:d") === A({ any: [{ all: ["learned:a", "holding:k"] }, { not: "opened:d" }] }), "text and JSON forms agree, and binds tighter than or");
ok(A("(learned:a or learned:b) and quiet>=3") === A({ all: [{ any: ["learned:a", "learned:b"] }, "quiet>=3"] }), "parentheses");
for (const bad of ["learnt:x", "learned>=x", "turn>=3", "phase:finale", "learned:", "learned:a and", "(learned:a", "learned:a b", "var:", "genuine>=two", "a:b:c d"])
  throws(() => parseExpr(bad), /./, `refuses "${bad}"`);
throws(() => parseExpr({ xor: [] }), /all \/ any \/ not/, "refuses an unknown object operator");
const f0 = { learned: new Set(["a"]), held: new Set(["k"]), opened: new Set(), said: new Set(["hale/alibi"]), vars: { n: 2, s: "x", t: true }, at: "hall", people: { pell: "hall", hale: "study" }, turns: 5, quiet: 3, phase: "rising", cov: { m: "genuine", w: "false", o: "unfilled" }, fired: new Set(["c1"]), done: new Set(["b1"]), revealed: new Set(["t"]) };
for (const [s, want] of [["learned:a", true], ["learned:b", false], ["holding:k and at:hall", true], ["said:hale/alibi", true], ["said:alibi", false], ["var:n=2", true], ["var:n=3", false], ["var:s=x and var:t", true], ["var:zz", false],
  ["here:pell", true], ["here:hale", false], ["genuine:m and misled:w and not covered:o", true], ["covered>=2 and genuine>=1 and genuine>=2", false], ["covered>=2 and genuine>=1", true], ["fired:c1 and done:b1 and revealed:t", true],
  ["turns>=5 and quiet>=3 and not quiet>=4", true], ["beats>=1 and learned>=1", true], ["phase:rising", true], ["phase:turn", false]])
  ok(evalExpr(parseExpr(s), f0) === want, `eval "${s}" = ${want}`);
console.log("  unknown keys, counters, phases and malformed text refused; 19 evaluations right");

console.log("== the case is checked: references real, effects in the closed list");
const bad = (patch) => { const c = JSON.parse(JSON.stringify(kase)); patch(c); return checkNarrator(c, { rooms: ROOMS }); };
for (const [name, patch, re] of [
  ["unknown expression key", c => { c.beats[1].when = "learnt:will_changed"; }, /unknown key/],
  ["a clue that does not exist", c => { c.beats[1].when = "learned:nothing"; }, /no such clue/],
  ["a pillar that does not exist", c => { c.beats[5].when = "covered:why"; }, /no such pillar/],
  ["a topic nobody can raise", c => { c.beats[2].when = "said:weather"; }, /no such topic/],
  ["a room that is not in the house", c => { c.beats[0].when = "at:cellar"; }, /not a room/],
  ["an effect outside the closed list", c => { c.beats[1].effects = [{ type: "teleport", id: "hale" }]; }, /closed list/],
  ["an effect with a stray key", c => { c.beats[1].effects = [{ type: "reveal_thing", id: "desk_key", loud: true }]; }, /unknown key/],
  ["a spawn of someone not in the case", c => { c.beats[0].effects = [{ type: "spawn_person", id: "ghost", at: "hall" }]; }, /not a person/],
  ["a reveal of a thing not in the case", c => { c.beats[1].effects = [{ type: "reveal_thing", id: "crown" }]; }, /not a thing/],
  ["a move to a room not in the house", c => { c.beats[4].effects = [{ type: "move_person", id: "hale", to: "cellar" }]; }, /not a room/],
  ["a set_var with an object value", c => { c.beats[2].effects = [{ type: "set_var", name: "x", value: { a: 1 } }]; }, /boolean, a number/],
  ["a beat of unknown kind", c => { c.beats[0].kind = "twist"; }, /kind/],
  ["a beat with no hook", c => { delete c.beats[0].hook; }, /hook/],
  ["a clock with no effects", c => { c.clocks[0].effects = []; }, /no effects/],
  ["a phase expression with a bad key", c => { c.phases = { turn: "zzz:1" }; }, /unknown key/],
]) { const r = bad(patch); ok(!r.ok && r.findings.some(x => re.test(x.what)), `checkNarrator refuses ${name}: ${JSON.stringify(r.findings.map(x => x.what))}`); }
throws(() => { const c = JSON.parse(JSON.stringify(kase)); c.beats[1].when = "nonsense:1"; makeNarrator(c, { rooms: ROOMS }); }, /not sound/, "makeNarrator refuses an unsound case");
console.log(`  15 faults refused; closed effect list = ${Object.keys(EFFECTS).join(" ")}`);

// ---- the scripted play --------------------------------------------------------------------------------------------------
const idle = (n) => Array.from({ length: n }, () => ({ label: "idle", ev: { type: "idle" } }));
const SCRIPT = [
  { label: "enter hall", ev: { type: "enter", room: "hall" }, phase: "setup", pick: "pell_arrives" },
  { label: "ask Anne: inheritance", ev: [{ type: "say", who: "anne", topic: "inheritance", act: "tell" }, { type: "learn", clue: "anne_quarrel" }], phase: "rising", cov: { motive: "false" } },
  ...idle(2),
  { label: "idle (quiet 3: only a draw beat waits)", ev: { type: "idle" }, quiet: 3, pick: null },
  { label: "idle (quiet 4)", ev: { type: "idle" }, quiet: 4, pick: null },
  { label: "idle (quiet 5: draw)", ev: { type: "idle" }, quiet: 5, pick: "key_glint" },
  { label: "take desk_key", ev: { type: "take", thing: "desk_key" } },
  { label: "read the will", ev: [{ type: "take", thing: "will" }, { type: "learn", clue: "will_changed" }], phase: "rising", cov: { motive: "genuine" } },
  ...idle(8),
  { label: "idle (quiet 9: confront)", ev: { type: "idle" }, quiet: 9, pick: "quiet_pressure" },
  { label: "take the vial", ev: [{ type: "take", thing: "vial" }, { type: "learn", clue: "vial_found" }], phase: "turn", cov: { means: "genuine" } },
  { label: "enter library", ev: { type: "enter", room: "library" } },
  { label: "ask Hale: alibi", ev: [{ type: "say", who: "hale", topic: "alibi", act: "lie" }, { type: "learn", clue: "hale_claim_library" }], phase: "pressure", cov: { opportunity: "false" } },
  ...idle(6),
  { label: "idle (quiet 7: converge)", ev: { type: "idle" }, quiet: 7, pick: "accusation_near" },
  { label: "ask Pell: that night", ev: [{ type: "say", who: "pell", topic: "that_night", act: "tell" }, { type: "learn", clue: "pell_saw_hale" }], phase: "pressure", cov: { opportunity: "genuine" }, pick: "lie_exposed" },
  { label: "accuse Hale", ev: { type: "accuse", who: "hale" }, phase: "resolution" },
];

// an independent reading of the narrator's state for the menu checks
function frameOf(n) {
  const s = n.state(), cov = n.coverage().pillars;
  return { learned: new Set(s.learned), held: new Set(s.held), opened: new Set(s.opened), said: new Set(s.said), vars: s.vars, at: s.at, people: s.people, turns: s.turns, quiet: s.quiet, phase: s.phase, cov, fired: new Set(Object.keys(s.fired)), done: new Set(s.done), revealed: new Set(s.revealed) };
}
function play(seed, { quiet = false } = {}) {
  const n = makeNarrator(kase, { seed, rooms: ROOMS }), trace = [];
  const phases = [n.phase()];
  for (const st of SCRIPT) {
    const r = n.observe(st.ev), f = frameOf(n), m = n.menu();
    // every menu entry is provably true now, and every provable beat is on the menu
    for (const e of m) { const b = kase.beats.find(x => x.id === e.id); ok(evalExpr(parseExpr(b.when), f), `[${st.label}] menu holds "${e.id}" whose when is not true`); ok(!f.done.has(e.id), `[${st.label}] menu holds a beat already done`); ok(PHASES.indexOf(b.phase) <= PHASES.indexOf(f.phase), `[${st.label}] menu holds a beat of a later phase`); }
    for (const b of kase.beats) if (!f.done.has(b.id) && PHASES.indexOf(b.phase) <= PHASES.indexOf(f.phase) && evalExpr(parseExpr(b.when), f)) ok(m.some(e => e.id === b.id), `[${st.label}] provable beat "${b.id}" missing from the menu`);
    const beat = n.pick(m); let effects = [];
    if (beat) effects = n.apply(beat);
    for (const c of r.fired) for (const e of c.effects) ok(EFFECTS[e.type], `clock effect ${e.type} in the closed list`);
    for (const e of effects) ok(EFFECTS[e.type], `beat effect ${e.type} in the closed list`);
    if (n.phase() !== phases.at(-1)) phases.push(n.phase());
    if (st.phase) ok(n.phase() === st.phase, `[${st.label}] phase ${n.phase()} (want ${st.phase})`);
    if (st.cov) for (const [p, v] of Object.entries(st.cov)) ok(n.coverage().pillars[p] === v, `[${st.label}] ${p} is ${n.coverage().pillars[p]} (want ${v})`);
    if (st.quiet != null) ok(r.quiet === st.quiet, `[${st.label}] quiet ${r.quiet} (want ${st.quiet})`);
    if (st.pick !== undefined) ok((beat?.id ?? null) === st.pick, `[${st.label}] picked ${beat?.id ?? null} (want ${st.pick})`);
    trace.push({ t: r.turn, step: st.label, phase: n.phase(), quiet: r.quiet, rung: r.rung, due: r.due, menu: m.map(e => `${e.id}(${e.rung})`).join(","), picked: beat ? `${beat.id}[${beat.kind}/${beat.rung}]` : "", effects: effects.map(e => e.type + ":" + (e.id ?? e.name)).join(","), fired: r.fired.map(c => c.id).join(",") });
  }
  return { n, trace, phases };
}

console.log("\n== scripted play, seed 7");
const run = play(7);
ok(run.phases.join(">") === PHASES.join(">"), `phases advance in order, none skipped or reversed: ${run.phases.join(">")}`);
const pad = (s, w) => String(s).padEnd(w).slice(0, w);
console.log(pad("t", 3), pad("step", 40), pad("phase", 10), pad("q", 2), pad("rung", 9), pad("menu", 62), pad("picked", 34), "effects / clocks");
for (const r of run.trace) console.log(pad(r.t, 3), pad(r.step, 40), pad(r.phase, 10), pad(r.quiet, 2), pad(r.rung, 9), pad(r.menu, 62), pad(r.picked, 34), [r.effects, r.fired && `CLOCK ${r.fired}`].filter(Boolean).join(" "));

const S = run.n.state();
ok(S.fired.storm != null && S.fired.constable != null, `both clocks fired (storm at ${S.fired.storm}, constable at ${S.fired.constable})`);
ok(S.vars.storm === true && S.people.constable === "hall", "clock effects reached the narrator's own picture (storm var, constable in the hall)");
ok(S.people.pell === "hall" && S.revealed.includes("desk_key") && S.vars.tension === 1 && S.vars.hale_rattled === true && S.people.hale === "hall", "beat effects mirrored (Pell arrived, key revealed, tension, Hale rattled and moved)");
ok(S.log.map(l => l.beat).join() === "pell_arrives,key_glint,quiet_pressure,accusation_near,lie_exposed", `beats landed in this order: ${S.log.map(l => l.beat).join()}`);
const con = run.n.conclusion();
ok(con.culprit_ok && con.outcome === "solved" && con.sound, `accusation concludes "${con.outcome}" with a sound case`);
console.log(`  coverage at the end: ${JSON.stringify(run.n.coverage().pillars)}; conclusion ${con.outcome}`);

console.log("\n== deterministic for a seed; the seed matters where it is a tie");
ok(JSON.stringify(play(7).trace) === JSON.stringify(run.trace), "seed 7 played twice gives the identical trace");
ok(JSON.stringify(play(7).n.state()) === JSON.stringify(run.n.state()), "and the identical final state");
const tie = JSON.parse(JSON.stringify(kase)); tie.beats.push(
  { id: "tie_a", kind: "arrival", phase: "setup", weight: "optional", when: "at:garden", hook: "A, a gardener's boy looks up.", effects: [] },
  { id: "tie_b", kind: "arrival", phase: "setup", weight: "optional", when: "at:garden", hook: "B, a magpie scolds from the yew.", effects: [] });
const picks = new Map();
for (let sd = 1; sd <= 40; sd++) { const nn = makeNarrator(tie, { seed: sd, rooms: ROOMS }); nn.observe({ type: "enter", room: "garden" }); [1, 2, 3].forEach(() => nn.observe({ type: "idle" }));
  const m = nn.menu(), b = nn.pick(m); const again = makeNarrator(tie, { seed: sd, rooms: ROOMS }); again.observe({ type: "enter", room: "garden" }); [1, 2, 3].forEach(() => again.observe({ type: "idle" }));
  ok(again.pick(again.menu())?.id === b?.id, `seed ${sd} tie breaks the same way each time`); picks.set(b.id, (picks.get(b.id) || 0) + 1); }
ok(picks.size === 2 && [...picks.values()].every(v => v >= 8), `across 40 seeds both tied beats are picked, neither rarely: ${JSON.stringify([...picks])}`);
console.log("  tie_a/tie_b over 40 seeds:", JSON.stringify([...picks]));

console.log("\n== pacing: a quiet stretch climbs the rungs; a beat just landed holds the next");
{
  const n = makeNarrator(kase, { seed: 1, rooms: ROOMS });
  n.observe({ type: "enter", room: "hall" }); n.apply(n.pick(n.menu()));                                // Pell arrives (now)
  n.observe([{ type: "say", who: "anne", topic: "inheritance" }, { type: "learn", clue: "anne_quarrel" }]);
  const rungs = []; let landed = null;
  for (let i = 1; i <= 20 && !landed; i++) { const r = n.observe({ type: "idle" }); const b = n.pick(n.menu(), r.quiet); rungs.push(`q${r.quiet}:${r.rung}${b ? "->" + b.id : ""}`); if (b?.kind === "pressure") landed = b; else if (b) n.apply(b); }
  console.log("  ", rungs.join("  "));
  ok(landed?.id === "quiet_pressure" && landed.rung === "confront", "the quiet stretch ends in a pressure beat at the confront rung");
  ok(rungs.find(x => x.includes("->key_glint")).startsWith("q5:") && rungs.at(-1).startsWith("q9:confront"), "the draw beat came at quiet 5 and the pressure beat only at quiet 9");
  // a beat just landed: next turn holds (even with a beat waiting), the one after may go
  const m = n.menu(); n.apply(landed); n.observe({ type: "take", thing: "vial" }); n.observe({ type: "learn", clue: "vial_found" });
  for (let i = 0; i < 7; i++) n.observe({ type: "idle" });
  n.apply(n.pick(n.menu())); const r1 = n.observe({ type: "idle" });
  ok(r1.rung === "hold" && n.pick(n.menu()) === null, "the turn after a beat lands is held");
}
{
  const n = makeNarrator(kase, { seed: 1, rooms: ROOMS });
  n.observe({ type: "enter", room: "hall" });
  ok(n.pick(n.menu())?.id === "pell_arrives", "a 'now' beat is staged at once, with no quiet needed");
  throws(() => n.apply("key_glint"), /not true now/, "a beat that is not provable true now cannot be applied");
  throws(() => n.apply("nonexistent"), /no beat/, "a beat the case does not have cannot be applied");
}

console.log("\n== the model call: input is small and closed; its reply is checked");
{
  const n = makeNarrator(kase, { seed: 3, rooms: ROOMS });
  n.observe({ type: "enter", room: "hall" }); n.observe([{ type: "learn", clue: "anne_quarrel" }, { type: "say", topic: "inheritance" }]);
  const m = [{ id: "key_glint", kind: "discovery", seed: "Something glints under the hall bench.", rung: "draw", effects: [] }, { id: "pell_arrives", kind: "arrival", seed: "Dr Pell comes in.", rung: "now", effects: [] }];
  const inp = n.callInput(m);
  ok(inp.menu.length === 2 && Object.keys(inp.menu[0]).join() === "id,kind,seed" && inp.backbone.phase === "rising" && inp.quiet_turns === 0 && JSON.stringify(inp).length < 600, `call input is closed and small (${JSON.stringify(inp).length} bytes): ${JSON.stringify(inp.backbone)}`);
  const good = n.accept({ pick: "key_glint", line: "A glint beneath the bench draws your eye." }, m);
  ok(good?.id === "key_glint" && good.line.startsWith("A glint"), "a valid pick and line is accepted, line replaced");
  ok(n.accept({ pick: "not_on_menu", line: "Hello." }, m) === null, "a pick not on the menu is refused (caller falls back to pick())");
  ok(n.accept({ pick: "key_glint", line: Array(41).fill("word").join(" ") }, m) === null, "a line over 40 words is refused");
  ok(n.accept({ pick: "key_glint", line: "{\"x\":1}" }, m) === null, "a line with braces is refused");
  ok(n.accept({ pick: "key_glint", line: "Hale smirks at you." }, m, { lexicon: ["Hale", "Pell"], allowed: ["Pell"] }) === null, "a line naming someone the seed and the player do not know is refused");
  ok(n.accept({ pick: "key_glint", line: "Pell glances at the bench." }, m, { lexicon: ["Hale", "Pell"], allowed: ["Pell"] })?.id === "key_glint", "a line naming only allowed people is accepted");
}

console.log("\n== the state is plain JSON and restores");
{
  const a = play(7).n, saved = JSON.parse(JSON.stringify(a.state()));
  const b = makeNarrator(kase, { seed: 7, rooms: ROOMS, from: saved });
  ok(JSON.stringify(b.state()) === JSON.stringify(a.state()) && b.phase() === a.phase(), "restored narrator has the same state and phase");
  const mid = makeNarrator(kase, { seed: 7, rooms: ROOMS }); mid.observe({ type: "enter", room: "hall" }); mid.apply(mid.pick(mid.menu())); mid.observe({ type: "learn", clue: "will_changed" });
  const cont = makeNarrator(kase, { seed: 7, rooms: ROOMS, from: mid.state() });
  mid.observe({ type: "idle" }); cont.observe({ type: "idle" });
  ok(JSON.stringify(mid.menu()) === JSON.stringify(cont.menu()) && JSON.stringify(mid.state()) === JSON.stringify(cont.state()), "a narrator restored mid-play continues exactly as the original");
  const w = makeNarrator(kase, { seed: 1, rooms: ROOMS });
  w.menu({ at: "hall", learned: ["anne_quarrel"], held: ["vial"], vars: { x: 1 } });
  ok(w.phase() === "rising" && w.state().at === "hall" && w.state().held[0] === "vial", "menu(worldState) takes the page's snapshot (learned, held, at, vars)");
}

console.log("\n== cost");
{
  const n = makeNarrator(kase, { seed: 1, rooms: ROOMS }); const t0 = performance.now(); let k = 0;
  for (let i = 0; i < 2000; i++) { n.observe({ type: i % 7 === 0 ? "enter" : "idle", room: "hall" }); n.pick(n.menu()); k++; }
  const per = (performance.now() - t0) / k;
  ok(per < 1, `observe + menu + pick under 1 ms a turn (${per.toFixed(4)} ms)`);
  console.log(`  observe + menu + pick: ${per.toFixed(4)} ms per turn (2000 turns, 6 beats, 2 clocks); model calls: 0`);
}
console.log(fails ? `\n${fails} FAILED` : "\nall passed"); process.exit(fails ? 1 : 0);
