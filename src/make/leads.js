// What stands open (M7; design/case/prior-art-investigation-ux.md §1, after Overboard!'s Questions list): the questions a
// case keeps open in the Justice's own words, each raised and closed by what the player has learned, held, opened, said and
// seen happen, in the narrator's condition language (src/make/narrator.js parseExpr / evalExpr), so a lead is data:
//   { id, text, raised?: expr (absent: open from the arrival), closed: expr, where?: "whom to ask or where to go",
//     who?: [person ids, whose present room the notebook adds], side?: true (a herring's question the shortest
//     solution need not settle; still closable in one question from where it ends) }
// Pure and deterministic; ms arithmetic. A lead raised stays raised, and closed stays closed (a lead's `at:` or `var:`
// may stop holding later; what the Justice has once asked, or once settled, stays in the book): the memo
// { raised: [ids], closed: [ids] } is kept with the case's snapshot.
//   compileLeads(leads) -> compiled (throws on an expression that does not parse)
//   stepLeads(compiled, frame, memo) -> memo (updated in place)        frame: narrator.js evalExpr's frame
//   openLeads(leads | compiled, frame, memo?) -> [{ id, text, where, who }] the open ones, in the case's order;
//     its .done: the ones raised and since closed
//   leadFrame({ learned, held, opened, said, vars, at, people, turns, quiet, phase, cov, fired, done, revealed }) -> frame
//     from plain arrays or Sets; said entries may be topics, "who/topic" or { who, topic }; it adds "who/any" for
//     each person questioned at all (said:daniel/any: you have questioned Daniel about something)
//   checkLeads(kase, leads) -> { ok, findings: [{ at, what }] }   every expression parses and names only real things
import { parseExpr, evalExpr, atomsOf, PHASES } from "./narrator.js";
import { cluesOf } from "./case.js";

const arr = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);
const setOf = (x) => (x instanceof Set ? x : new Set(arr(x)));

export function compileLeads(leads) {
  if (leads?.compiled) return leads;
  const out = arr(leads?.leads ?? leads).map(l => ({ ...l, raisedAst: l.raised ? parseExpr(l.raised) : null, closedAst: parseExpr(l.closed || "") }));
  out.compiled = true; return out;
}

export function leadFrame(s = {}) {
  const said = new Set();
  for (const e of arr(s.said instanceof Set ? [...s.said] : s.said)) {
    if (typeof e === "string") { said.add(e); const w = e.includes("/") ? e.split("/")[0] : null; if (w) said.add(`${w}/any`); }
    else if (e?.topic) { said.add(e.topic); if (e.who) { said.add(`${e.who}/${e.topic}`); if (e.act !== "guarded") said.add(`${e.who}/any`); } }
  }
  const fired = s.fired instanceof Set ? s.fired : new Set(Array.isArray(s.fired) ? s.fired : Object.keys(s.fired || {}));
  return { learned: setOf(s.learned), held: setOf(s.held), opened: setOf(s.opened), said, vars: s.vars || {}, at: s.at ?? null, people: s.people || {},
    turns: s.turns || 0, quiet: s.quiet || 0, phase: s.phase || "setup", cov: s.cov || {}, fired, done: setOf(s.done), revealed: setOf(s.revealed) };
}

export function stepLeads(compiled, f, memo = { raised: [], closed: [] }) {
  const raised = new Set(memo.raised), closed = new Set(memo.closed);
  for (const l of compiled) {
    if (closed.has(l.id)) continue;
    const up = raised.has(l.id) || !l.raisedAst || evalExpr(l.raisedAst, f);
    if (up && !raised.has(l.id)) { raised.add(l.id); memo.raised.push(l.id); }
    if (evalExpr(l.closedAst, f)) { closed.add(l.id); memo.closed.push(l.id); }
  }
  return memo;
}

export function openLeads(leads, f, memo = null) {
  const c = compileLeads(leads), m = memo || { raised: [], closed: [] }; stepLeads(c, f, m);
  const raised = new Set(m.raised), closed = new Set(m.closed), view = (l) => ({ id: l.id, text: l.text, where: l.where || "", who: arr(l.who) });
  const open = c.filter(l => raised.has(l.id) && !closed.has(l.id)).map(view);
  open.done = c.filter(l => raised.has(l.id) && closed.has(l.id)).map(view);
  return open;
}

export function checkLeads(k, leads) {
  const f = [], say = (at, what) => f.push({ at, what });
  const clues = new Set(cluesOf(k).map(c => c.id)), things = new Set(arr(k.things).map(t => t.id)), pillars = new Set(arr(k.pillars).map(p => p.id));
  const people = new Set(arr(k.cast).map(c => c.id)), beats = new Set(arr(k.beats).map(b => b.id)), clocks = new Set(arr(k.clocks).map(c => c.id));
  const topics = new Set([...arr(k.topics).map(t => t.id), ...cluesOf(k).map(c => c.gate?.topic || c.topic), ...arr(k.cast).flatMap(c => arr(c.claims).map(q => q.topic)), "any"].filter(Boolean));
  const seen = new Set();
  for (const l of arr(leads?.leads ?? leads)) {
    const at = `leads.${l.id}`; if (!l.id) say(at, "no id"); if (seen.has(l.id)) say(at, "duplicate id"); seen.add(l.id);
    if (!l.text) say(at, "no text"); if (!l.closed) say(at, "no closed expression: it would stand open for ever");
    for (const w of arr(l.who)) if (!people.has(w)) say(at, `who: "${w}" is not a person of the case`);
    for (const key of ["raised", "closed"]) {
      if (!l[key]) continue; let ast; try { ast = parseExpr(l[key]); } catch (e) { say(`${at}.${key}`, e.message); continue; }
      for (const a of atomsOf(ast)) {
        if (a.cmp) continue;
        const need = { learned: clues, revealed: things, genuine: pillars, misled: pillars, covered: pillars, here: people, fired: clocks, done: beats }[a.atom];
        if (need && !need.has(a.arg)) say(`${at}.${key}`, `${a.atom}:${a.arg} names nothing in the case`);
        if (a.atom === "holding" && !things.has(a.arg) && !arr(k.things).some(t => t.kind === a.arg)) say(`${at}.${key}`, `holding:${a.arg} names nothing in the case`);
        if (a.atom === "opened" && !things.has(a.arg)) say(`${at}.${key}`, `opened:${a.arg} is not a thing of the case`);
        if (a.atom === "said") { const [w, t] = a.arg.includes("/") ? a.arg.split("/") : [null, a.arg]; if (w && !people.has(w)) say(`${at}.${key}`, `said:${a.arg}: no such person`); if (!topics.has(t)) say(`${at}.${key}`, `said:${a.arg}: no such topic`); }
        if (a.atom === "phase" && !PHASES.includes(a.arg)) say(`${at}.${key}`, `phase:${a.arg} unknown`);
      }
    }
  }
  return { ok: !f.length, findings: f };
}
