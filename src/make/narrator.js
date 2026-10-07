// The narrator's engine (M7, R58; design/case/narrator.md; design/case/family-read.md §2 and §5). Pure, deterministic,
// no model. It holds a case's story structure and, from what the player has learned, held, opened and said, works out the
// phase of the story, which beats the world can truly offer now, and which one to stage; the optional "beat" model call
// (src/make/voice.js: makeVoice().beat) only picks among that menu and words it in 40 words or fewer.
//
// Ported in idea from construct (5000Stadia/construct, MIT, github.com/5000Stadia/construct; Python), read, not run:
//   arc/grammar.py   Phase, Beat (a world-state condition with a weight, never a scripted scene), Pillar (a cause of the
//                    ending; coverage tri-state genuine / false / unfilled from the player's frame), Clock (pre-authored
//                    world moves), the conclusion read from coverage
//   arc/conditions.py  the closed condition atoms combined by all / any / not (here: a small text and JSON language)
//   arc/executor.py  navigate(): turns quiet -> a rung (surface 3, draw 5, converge 7, confront 9; hold just after a beat);
//                    current_phase() derived from state, never stored; clock_pass; pillar_coverage; coverage_summary
//   cohorts.py       weave_pick: a cheap pick among pre-built hook cards, sparingly, never a barrage
// Changed for this house: five phases (setup rising turn pressure resolution) advance by pillar coverage, two-valued
// conditions (the page's frame is definite), effects are a closed list the world's own rules run (works.js), no events
// spine (the narrator's state is the player's frame plus counters, and is plain JSON).
//
//   const n = makeNarrator(kase, { seed, rooms })
//   n.observe(event | [events])  one player action = one turn            -> { turn, quiet, phase, phaseChanged, fired, rung, due }
//   n.menu(worldState?)          beats provable true now (≤ max 5)         -> [{ id, kind, seed, effects, rung, weight, phase }]
//   n.pick(menu, quietTurns?)    no-model: rung, then weight, then seed    -> beat | null     (null: let it breathe)
//   n.apply(beat | id)           commit it, return its effects (validated) -> effects[]
//   n.step(worldState?)          menu + pick + apply                       -> { beat, effects } | null
//   n.phase() n.coverage() n.conclusion() n.state()
//   n.callInput(menu) / n.accept(reply, menu, { lexicon, allowed })        the model call's input and its checked output
// Also: parseExpr, evalExpr, checkNarrator(kase, { rooms }), EFFECTS, PHASES.
import { cluesOf } from "./case.js";
import { truthCheck } from "./talk.js";

const arr = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);
export const PHASES = ["setup", "rising", "turn", "pressure", "resolution"];
export const KINDS = ["arrival", "discovery", "lie_exposed", "pressure"];
const RUNGS = ["now", "surface", "draw", "converge", "confront"];             // rank 0..4; "now": react at once, never held
const KIND_RUNG = { arrival: "surface", discovery: "draw", lie_exposed: "converge", pressure: "confront" };
const WEIGHT = { required: 3, optional: 2, flavor: 1 };
const THRESHOLDS = [[3, 1], [5, 2], [7, 3], [9, 4]];                         // construct's navigate(): turns quiet -> rung rank
const ID = /^[\w./-]+$/;

// ---- the condition language ------------------------------------------------------------------------------------
// text:   learned:will and (holding:key or not opened:study) or quiet>=9      JSON: { all:[…] } { any:[…] } { not:… } or a string
// atoms:  learned:CLUE  holding:THING  opened:ID  said:TOPIC | said:WHO/TOPIC  at:ROOM  here:PERSON  var:NAME[=VALUE]
//         genuine:PILLAR  misled:PILLAR  covered:PILLAR  fired:CLOCK  done:BEAT  revealed:THING  phase:NAME
//         turns>=N  quiet>=N  learned>=N  genuine>=N  covered>=N  beats>=N      (also > <= < ==)
const ARG_ATOMS = new Set(["learned", "holding", "opened", "said", "at", "here", "var", "genuine", "misled", "covered", "fired", "done", "revealed", "phase"]);
const NUM_ATOMS = new Set(["turns", "quiet", "learned", "genuine", "covered", "beats"]);
const CMP = { ">=": (a, b) => a >= b, "<=": (a, b) => a <= b, ">": (a, b) => a > b, "<": (a, b) => a < b, "==": (a, b) => a === b };

function tokens(s) { const out = []; for (const m of String(s).matchAll(/\(|\)|[^\s()]+/g)) out.push(m[0]); return out; }
export function parseExpr(e) {
  if (e == null || e === "") return { all: [] };
  if (typeof e === "object") {
    if (Array.isArray(e)) return { all: e.map(parseExpr) };
    const keys = Object.keys(e), k = keys[0];
    if (keys.length !== 1 || !["all", "any", "not"].includes(k)) throw new Error(`expression object must be one of all / any / not, got {${keys.join(",")}}`);
    return k === "not" ? { not: parseExpr(e.not) } : { [k]: arr(e[k]).map(parseExpr) };
  }
  const t = tokens(e); let i = 0;
  const atom = (w) => {
    let m = /^([a-z_]+)(>=|<=|==|>|<)(\d+)$/.exec(w);
    if (m) { if (!NUM_ATOMS.has(m[1])) throw new Error(`unknown counter "${m[1]}" in "${w}" (counters: ${[...NUM_ATOMS].join(" ")})`); return { atom: m[1], cmp: m[2], n: +m[3] }; }
    m = /^([a-z_]+):(.+)$/.exec(w);
    if (!m) throw new Error(`cannot read "${w}" (an atom is key:arg or counter>=n)`);
    if (!ARG_ATOMS.has(m[1])) throw new Error(`unknown key "${m[1]}" in "${w}" (keys: ${[...ARG_ATOMS].join(" ")})`);
    if (m[1] === "var") { const v = /^([\w.-]+)(?:=(.+))?$/.exec(m[2]); if (!v) throw new Error(`bad var in "${w}"`); return { atom: "var", name: v[1], value: v[2] === undefined ? true : /^(true|false)$/.test(v[2]) ? v[2] === "true" : /^-?\d+(\.\d+)?$/.test(v[2]) ? +v[2] : v[2] }; }
    if (m[1] === "phase" && !PHASES.includes(m[2])) throw new Error(`unknown phase "${m[2]}" in "${w}"`);
    if (!ID.test(m[2])) throw new Error(`bad name "${m[2]}" in "${w}"`);
    return { atom: m[1], arg: m[2] };
  };
  const or = () => { const xs = [and()]; while (t[i] === "or") { i++; xs.push(and()); } return xs.length === 1 ? xs[0] : { any: xs }; };
  const and = () => { const xs = [un()]; while (t[i] === "and") { i++; xs.push(un()); } return xs.length === 1 ? xs[0] : { all: xs }; };
  const un = () => {
    if (t[i] === "not") { i++; return { not: un() }; }
    if (t[i] === "(") { i++; const x = or(); if (t[i++] !== ")") throw new Error(`missing ")" in "${e}"`); return x; }
    if (t[i] === undefined || t[i] === ")" || t[i] === "and" || t[i] === "or") throw new Error(`expected an atom at "${t[i] ?? "end"}" in "${e}"`);
    return atom(t[i++]);
  };
  const x = or(); if (i < t.length) throw new Error(`unexpected "${t[i]}" in "${e}"`);
  return x;
}
export function atomsOf(ast, out = []) {
  if (ast.all || ast.any) arr(ast.all || ast.any).forEach(a => atomsOf(a, out)); else if (ast.not) atomsOf(ast.not, out); else out.push(ast);
  return out;
}
// frame: { learned, held, opened, said (Sets), vars, at, people {id: room|null}, turns, quiet, phase, cov {pillar: status},
//          fired, done, revealed (Sets) }
export function evalExpr(ast, f) {
  if (ast.all) return ast.all.every(a => evalExpr(a, f));
  if (ast.any) return ast.any.some(a => evalExpr(a, f));
  if (ast.not) return !evalExpr(ast.not, f);
  const cov = Object.values(f.cov);
  if (ast.cmp) {
    const v = { turns: f.turns, quiet: f.quiet, learned: f.learned.size, genuine: cov.filter(c => c === "genuine").length, covered: cov.filter(c => c !== "unfilled").length, beats: f.done.size }[ast.atom];
    return CMP[ast.cmp](v, ast.n);
  }
  switch (ast.atom) {
    case "learned": return f.learned.has(ast.arg);
    case "holding": return f.held.has(ast.arg);
    case "opened": return f.opened.has(ast.arg);
    case "said": return f.said.has(ast.arg);
    case "at": return f.at === ast.arg;
    case "here": return f.at != null && f.people[ast.arg] === f.at;
    case "var": { const v = f.vars[ast.name]; return ast.value === true ? !!v : v === ast.value; }
    case "genuine": return f.cov[ast.arg] === "genuine";
    case "misled": return f.cov[ast.arg] === "false";
    case "covered": return (f.cov[ast.arg] ?? "unfilled") !== "unfilled";
    case "fired": return f.fired.has(ast.arg);
    case "done": return f.done.has(ast.arg);
    case "revealed": return f.revealed.has(ast.arg);
    case "phase": return f.phase === ast.arg;
  }
  return false;
}

// ---- effects: the closed list the world's own rules run ----------------------------------------------------------
export const EFFECTS = {
  spawn_person: { keys: ["id", "at"], refs: { id: "person", at: "room" } },     // a person comes into the house at a room
  move_person: { keys: ["id", "to"], refs: { id: "person", to: "room" } },
  set_var: { keys: ["name", "value"], refs: {} },                                // works.js store "$name"
  reveal_thing: { keys: ["id"], refs: { id: "thing" } },                         // a hidden thing becomes findable
};
function effectProblems(e, ctx) {
  const spec = e && EFFECTS[e.type]; if (!spec) return [`effect type "${e?.type}" is not in the closed list (${Object.keys(EFFECTS).join(" ")})`];
  const out = [], extra = Object.keys(e).filter(k => k !== "type" && !spec.keys.includes(k)); if (extra.length) out.push(`${e.type}: unknown key ${extra.join(",")}`);
  for (const k of spec.keys) if (e[k] === undefined) out.push(`${e.type}: missing ${k}`);
  for (const [k, what] of Object.entries(spec.refs)) {
    if (what === "person" && ctx.people && !ctx.people.has(e[k])) out.push(`${e.type}: "${e[k]}" is not a person of the case`);
    if (what === "thing" && ctx.things && !ctx.things.has(e[k])) out.push(`${e.type}: "${e[k]}" is not a thing of the case`);
    if (what === "room" && ctx.rooms && !ctx.rooms.has(e[k])) out.push(`${e.type}: "${e[k]}" is not a room of the house`);
  }
  if (e.type === "set_var") { if (!/^[\w.-]+$/.test(e.name ?? "")) out.push("set_var: bad name"); if (!["boolean", "number", "string"].includes(typeof e.value) || String(e.value).length > 40) out.push("set_var: value must be a boolean, a number or a short string"); }
  return out;
}

// ---- the case's narrator parts, checked --------------------------------------------------------------------------
// beats: [{ id, kind, phase, weight, rung?, when, unless?, hook, seed?, effects?, once? }]   clocks: [{ id, when, effects, line?, rearm?, cooldown? }]
// phases (optional): { rising, turn, pressure, resolution } each an expression; pacing (optional): { thresholds, hold }
export function checkNarrator(k, { rooms = null } = {}) {
  const f = [], say = (at, what) => f.push({ at, what });
  const clues = new Map(cluesOf(k).map(c => [c.id, c])), things = new Set(arr(k.things).map(t => t.id)), pillars = new Set(arr(k.pillars).map(p => p.id));
  const people = new Set(arr(k.cast).map(c => c.id)), beatIds = new Set(arr(k.beats).map(b => b.id)), clockIds = new Set(arr(k.clocks).map(c => c.id));
  const topics = new Set([...arr(k.topics).map(t => t.id), ...cluesOf(k).map(c => c.gate?.topic || c.topic), ...arr(k.cast).flatMap(c => arr(c.claims).map(q => q.topic))].filter(Boolean));
  const roomSet = rooms ? new Set(rooms) : null, ctx = { people, things, rooms: roomSet };
  const exprOk = (at, src) => {
    let ast; try { ast = parseExpr(src); } catch (e) { say(at, e.message); return null; }
    for (const a of atomsOf(ast)) {
      const m = (c, what, set) => { if (!set.has(a.arg)) say(at, `${a.atom}:${a.arg} — no such ${what}`); };
      if (a.cmp) continue;
      if (a.atom === "learned") m(a, "clue", clues);
      else if (a.atom === "holding") { if (!things.has(a.arg) && !arr(k.things).some(t => t.kind === a.arg)) say(at, `holding:${a.arg} — no such thing`); }
      else if (a.atom === "revealed") m(a, "thing", things);
      else if (["genuine", "misled", "covered"].includes(a.atom)) m(a, "pillar", pillars);
      else if (a.atom === "here") m(a, "person", people);
      else if (a.atom === "fired") m(a, "clock", clockIds);
      else if (a.atom === "done") m(a, "beat", beatIds);
      else if (a.atom === "said") { const t = a.arg.includes("/") ? a.arg.split("/")[1] : a.arg; if (!topics.has(t)) say(at, `said:${a.arg} — no such topic`); }
      else if (a.atom === "at" && roomSet && !roomSet.has(a.arg)) say(at, `at:${a.arg} — not a room`);
    }
    return ast;
  };
  const efx = (at, list) => { for (const e of arr(list)) for (const p of effectProblems(e, ctx)) say(at, p); };
  const seen = new Set();
  for (const b of arr(k.beats)) {
    const at = `beats.${b.id}`; if (seen.has(b.id)) say(at, "duplicate id"); seen.add(b.id);
    if (!KINDS.includes(b.kind)) say(at, `kind "${b.kind}" is not one of ${KINDS.join(" ")}`);
    if (b.phase && !PHASES.includes(b.phase)) say(at, `phase "${b.phase}" unknown`);
    if (b.weight && !WEIGHT[b.weight]) say(at, `weight "${b.weight}" unknown`);
    if (b.rung && !RUNGS.includes(b.rung)) say(at, `rung "${b.rung}" unknown`);
    if (!b.hook && !b.seed) say(at, "needs a hook (its own line) or a seed");
    if (b.hook && String(b.hook).split(/\s+/).length > 40) say(at, "hook is longer than 40 words");
    exprOk(`${at}.when`, b.when); if (b.unless) exprOk(`${at}.unless`, b.unless); efx(at, b.effects);
  }
  seen.clear();
  for (const c of arr(k.clocks)) { const at = `clocks.${c.id}`; if (seen.has(c.id)) say(at, "duplicate id"); seen.add(c.id); exprOk(`${at}.when`, c.when); efx(at, c.effects); if (!arr(c.effects).length) say(at, "no effects"); }
  for (const [p, src] of Object.entries(k.phases || {})) { if (!PHASES.includes(p) || p === "setup") say(`phases.${p}`, "unknown phase"); else exprOk(`phases.${p}`, src); }
  for (const p of arr(k.pillars)) for (const w of ["genuine_via", "false_via"]) if (p[w]) exprOk(`pillars.${p.id}.${w}`, p[w]);
  // a beat that can never be true: its expression has no assignment of its atoms (each taken as independent) that holds
  const warnings = [];
  const sat = (ast) => { const as = [...new Map(atomsOf(ast).map(a => [JSON.stringify(a), a])).keys()]; if (as.length > 14) return true;
    const ev = (n, m) => n.all ? n.all.every(x => ev(x, m)) : n.any ? n.any.some(x => ev(x, m)) : n.not ? !ev(n.not, m) : m[JSON.stringify(n)];
    for (let bits = 0; bits < (1 << as.length); bits++) { const m = {}; as.forEach((a, i) => { m[a] = !!(bits >> i & 1); }); if (ev(ast, m)) return true; } return false; };
  for (const b of arr(k.beats)) { try { if (!sat(parseExpr(b.when))) warnings.push({ at: `beats.${b.id}`, what: "its when can never be true (contradicts itself)" }); } catch { /* reported above */ } }
  return { ok: !f.length, findings: f, warnings };
}

// ---- the narrator -------------------------------------------------------------------------------------------------
const hash01 = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } h ^= h >>> 15; h = Math.imul(h, 2246822507); h ^= h >>> 13; return (h >>> 0) / 4294967296; };
const rankOf = (r) => RUNGS.indexOf(r);

export function makeNarrator(k, { seed = 1, rooms = null, from = null } = {}) {
  const check = checkNarrator(k, { rooms }); if (!check.ok) throw new Error(`narrator: the case's story parts are not sound: ${check.findings.slice(0, 4).map(x => `${x.at}: ${x.what}`).join("; ")}`);
  const clues = cluesOf(k), clueBy = new Map(clues.map(c => [c.id, c])), pillars = arr(k.pillars), required = pillars.filter(p => p.required !== false).map(p => p.id);
  const thingIds = new Set(arr(k.things).map(t => t.id)), peopleIds = new Set(arr(k.cast).map(c => c.id)), roomSet = rooms ? new Set(rooms) : null;
  const ctx = { people: peopleIds, things: thingIds, rooms: roomSet };
  const beats = arr(k.beats).map(b => ({ ...b, ast: parseExpr(b.when), unlessAst: b.unless ? parseExpr(b.unless) : null, phase: b.phase || "setup", weight: b.weight || "optional", rung: b.rung || KIND_RUNG[b.kind] }));
  const clocks = arr(k.clocks).map(c => ({ ...c, ast: parseExpr(c.when) }));
  const pillarAst = Object.fromEntries(pillars.map(p => [p.id, { g: p.genuine_via ? parseExpr(p.genuine_via) : null, f: p.false_via ? parseExpr(p.false_via) : null }]));
  const phaseAst = Object.fromEntries(Object.entries(k.phases || {}).map(([p, e]) => [p, parseExpr(e)]));
  const thresholds = k.pacing?.thresholds || THRESHOLDS, hold = k.pacing?.hold ?? 2, maxMenu = k.pacing?.menu ?? 5;

  // everything the narrator knows is plain data, so it can be saved with the world and restored
  const S = {
    turns: 0, quiet: 0, lastBeatTurn: -99, phase: "setup", at: null, accused: null,
    learned: [], held: [], opened: [], said: [], vars: {}, fired: {}, done: [], revealed: [], log: [],
    people: Object.fromEntries(arr(k.cast).map(c => [c.id, c.arrives || c.presence === "offscene" ? null : (c.home ?? null)])),
  };
  if (from) Object.assign(S, JSON.parse(JSON.stringify(from)));
  const add = (key, v) => { if (v != null && !S[key].includes(v)) S[key].push(v); };

  const frame = () => {
    const f = { learned: new Set(S.learned), held: new Set(S.held), opened: new Set(S.opened), said: new Set(S.said), vars: S.vars, at: S.at, people: S.people,
      turns: S.turns, quiet: S.quiet, phase: S.phase, cov: {}, fired: new Set(Object.keys(S.fired)), done: new Set(S.done), revealed: new Set(S.revealed) };
    f.cov = coverageOf(f); return f;
  };
  // pillar coverage from the player's frame: a genuine clue learned -> genuine (it wins a tie); a false clue learned and
  // not yet debunked -> false (a case built on a red herring); else unfilled (construct's pillar_coverage)
  function coverageOf(f) {
    const out = {};
    for (const p of pillars) {
      const mine = clues.filter(c => arr(c.pillar).includes(p.id) && f.learned.has(c.id)), pa = pillarAst[p.id];
      const g = mine.some(c => (c.effect || "genuine") === "genuine") || (pa.g && evalExpr(pa.g, { ...f, cov: {} }));
      const fl = mine.some(c => c.effect === "false" && !arr(c.debunked_by).some(d => f.learned.has(d))) || (pa.f && evalExpr(pa.f, { ...f, cov: {} }));
      out[p.id] = g ? "genuine" : fl ? "false" : "unfilled";
    }
    return out;
  }
  // the phase, derived from coverage and never stored backwards (construct's current_phase): setup until a clue is learned;
  // rising; the turn at half the required pillars covered (a lie caught, a theory built); pressure when every required
  // pillar is covered; resolution once accused. The case may override any with an expression.
  function phaseNow(f) {
    const covered = required.filter(id => f.cov[id] !== "unfilled").length, n = required.length;
    const def = { rising: f.learned.size >= 1, turn: n > 0 && covered >= Math.ceil(n / 2), pressure: n > 0 && covered >= n, resolution: S.accused != null };
    let best = PHASES.indexOf(S.phase);
    PHASES.forEach((p, i) => { if (i === 0) return; const ok = phaseAst[p] ? evalExpr(phaseAst[p], f) : def[p]; if (ok && i > best) best = i; });
    return PHASES[best];
  }
  function coverage() {
    const cov = frame().cov, g = required.filter(id => cov[id] === "genuine"), fl = required.filter(id => cov[id] === "false"), un = required.filter(id => cov[id] === "unfilled");
    return { pillars: cov, required, genuine: g, false: fl, unfilled: un, complete: !!required.length && !un.length, sound: !!required.length && g.length === required.length };
  }
  const conclusion = () => {
    if (S.accused == null) return null;
    const cov = coverage(), culprit = arr(k.cast).find(c => c.is_culprit)?.id, right = S.accused === culprit;
    return { accused: S.accused, culprit_ok: right, outcome: right ? (cov.sound ? "solved" : "right-but-unproven") : (cov.complete ? "wrong-case-built" : "wrong"), ...cov };
  };

  // the rung: turns quiet -> a rung rank (construct's navigate); held for `hold` turns after a beat lands
  const rungRank = (quiet = S.quiet) => thresholds.reduce((r, [q, rank]) => quiet >= q ? rank : r, 0);
  const held = () => S.turns - S.lastBeatTurn < hold;
  const rungName = () => (held() ? "hold" : rungRank() === 0 ? "calm" : RUNGS[rungRank()]);

  // clocks: pre-authored world moves that fire when their condition holds (construct's clock_pass), to a fixpoint
  function clockPass() {
    const fired = [];
    for (let pass = 0, again = true; again && pass < 4; pass++) {
      again = false;
      for (const c of clocks) {
        const last = S.fired[c.id]; if (last != null && c.rearm !== "repeat") continue;
        if (last != null && S.turns - last < (c.cooldown ?? 5)) continue;
        if (!evalExpr(c.ast, frame())) continue;
        S.fired[c.id] = S.turns; const effects = commit(c.effects, c.id); fired.push({ id: `clock:${c.id}`, kind: "clock", line: c.line || "", effects }); again = true;
      }
    }
    return fired;
  }
  // an effect is validated, then mirrored into the narrator's own picture (so later conditions see it); the page runs it
  function commit(list, why) {
    const out = [];
    for (const e of arr(list)) {
      const bad = effectProblems(e, ctx); if (bad.length) throw new Error(`effect refused (${why}): ${bad.join("; ")}`);
      if (e.type === "set_var") S.vars[e.name] = e.value;
      else if (e.type === "spawn_person") S.people[e.id] = e.at;
      else if (e.type === "move_person") S.people[e.id] = e.to;
      else if (e.type === "reveal_thing") add("revealed", e.id);
      out.push({ ...e });
    }
    return out;
  }

  const TOUCH = new Set(["learn", "take", "put", "open", "say", "accuse"]);
  function one(ev) {
    switch (ev.type) {
      case "learn": add("learned", ev.clue); break;
      case "take": add("held", ev.thing); break;
      case "put": S.held = S.held.filter(x => x !== ev.thing); break;
      case "open": add("opened", ev.id ?? ev.thing ?? ev.room); break;
      case "say": add("said", ev.topic); if (ev.who) add("said", `${ev.who}/${ev.topic}`); break;
      case "enter": S.at = ev.room; break;
      case "accuse": S.accused = ev.who; break;
      case "var": S.vars[ev.name] = ev.value; break;
      case "idle": break;
      case "sync": sync(ev); break;
      default: throw new Error(`unknown event type "${ev.type}"`);
    }
  }
  // the page's snapshot wins on what it owns: learned, held, opened, said, vars, at, people
  function sync(ws) {
    for (const [key, field] of [["learned", "learned"], ["held", "held"], ["opened", "opened"], ["said", "said"]]) if (ws[field]) S[key] = [...new Set([...S[key], ...ws[field]])];
    if (ws.held) S.held = [...ws.held];
    if (ws.vars) Object.assign(S.vars, ws.vars);
    if (ws.at !== undefined) S.at = ws.at;
    if (ws.people) Object.assign(S.people, ws.people);
    if (ws.turn != null) S.turns = Math.max(S.turns, ws.turn);
    if (ws.quiet != null) S.quiet = ws.quiet;
  }
  function observe(evs) {
    const list = arr(evs), counts = list.some(e => e.type !== "var" && e.type !== "sync");
    let touched = false;
    for (const e of list) { one(e); if (TOUCH.has(e.type)) touched = true; }
    if (counts) { S.turns++; S.quiet = touched ? 0 : S.quiet + 1; }
    const before = S.phase; S.phase = phaseNow(frame());
    const fired = clockPass(); S.phase = phaseNow(frame());       // a clock may have moved a variable that moves the phase
    const menu = menuNow();
    const due = menu.some(b => b.rung === "now" || (!held() && rankOf(b.rung) <= rungRank()));
    return { turn: S.turns, quiet: S.quiet, phase: S.phase, phaseChanged: S.phase !== before, fired, rung: rungName(), due };
  }

  // the menu: only beats provable true now. unreachable (unless) closes a beat; a beat belongs to its phase and later
  function menuNow() {
    const f = frame(), pi = PHASES.indexOf(S.phase);
    return beats.filter(b => !f.done.has(b.id) && PHASES.indexOf(b.phase) <= pi && !(b.unlessAst && evalExpr(b.unlessAst, f)) && evalExpr(b.ast, f))
      .map(b => ({ id: b.id, kind: b.kind, seed: b.seed || b.hook, effects: arr(b.effects).map(e => ({ ...e })), rung: b.rung, weight: b.weight, phase: b.phase }));
  }
  function menu(ws = null) {
    if (ws) { sync(ws); S.phase = phaseNow(frame()); }
    // the best first: heavier, from a later phase rather than an old one; the seed breaks ties
    const w = (b) => WEIGHT[b.weight] * 10 + PHASES.indexOf(b.phase) + hash01(`${seed}|${S.turns}|${b.id}`);
    return menuNow().sort((a, b) => w(b) - w(a) || a.id.localeCompare(b.id)).slice(0, maxMenu);
  }
  // no model: nothing while a beat has just landed (let it breathe); else what the rung allows. "now" beats react at
  // once; otherwise the highest rung the quiet allows, then weight, then the seeded tie-break
  function pick(m, quietTurns = S.quiet) {
    const now = m.filter(b => b.rung === "now");
    if (now.length) return best(now);
    if (held()) return null;
    const rank = rungRank(quietTurns);
    const ok = m.filter(b => rankOf(b.rung) <= rank && rankOf(b.rung) >= 1);
    return ok.length ? best(ok) : null;
    function best(xs) { return beatOf(xs.map(b => [b, rankOf(b.rung) * 100 + WEIGHT[b.weight] * 10 + hash01(`${seed}|${S.turns}|${b.id}`)]).sort((a, b) => b[1] - a[1])[0][0]); }
  }
  const beatOf = (entry) => { const src = beats.find(b => b.id === entry.id); return { ...entry, line: src?.hook || entry.seed || "" }; };
  // commit a beat: only one provable true now (never a fact the world doesn't hold); returns the effects for the page to run
  function apply(b) {
    const id = typeof b === "string" ? b : b.id, src = beats.find(x => x.id === id); if (!src) throw new Error(`no beat "${id}"`);
    if (!menuNow().some(x => x.id === id)) throw new Error(`beat "${id}" is not true now`);
    const effects = commit(src.effects, id);
    add("done", id); S.lastBeatTurn = S.turns; S.quiet = 0;
    S.log.push({ turn: S.turns, beat: id, phase: S.phase });
    S.phase = phaseNow(frame());
    return effects;
  }
  function step(ws = null) {
    const m = menu(ws), b = pick(m); if (!b) return null;
    const effects = apply(b); return { beat: { id: b.id, line: b.line, effects }, effects, kind: b.kind, rung: b.rung };
  }

  // the optional model call (voice.beat): code has already proved the menu true; the model picks one and words it
  function callInput(m) {
    return { backbone: { theme: k.theme || "", shape: k.shape || "deduction", phase: S.phase, covered: required.length - coverage().unfilled.length, of: required.length },
      menu: m.slice(0, 5).map(b => ({ id: b.id, kind: b.kind, seed: b.seed })), quiet_turns: S.quiet };
  }
  function accept(reply, m, { lexicon = null, allowed = [] } = {}) {
    const e = m.find(b => b.id === reply?.pick); if (!e) return null;
    const line = String(reply.line ?? "").trim(), words = line.split(/\s+/).filter(Boolean).length;
    if (!line || words > 40 || /[{}<>]/.test(line)) return null;
    if (lexicon && !truthCheck(line, { facts: [{ text: e.seed || "" }], lexicon, allowed }).ok) return null;
    return { ...beatOf(e), line };
  }

  const stateOut = () => JSON.parse(JSON.stringify(S));
  return { observe, menu, pick, apply, step, phase: () => S.phase, coverage, conclusion, state: stateOut, rung: rungName, callInput, accept, check };
}
