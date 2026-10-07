// Questioning a suspect (M7, R57; design/case/family-read.md §5, after epistemic-projector's answer states and
// construct's reveal gates): what a person does when asked about a topic, decided in code from their own frame and
// what the player has learned and holds; never from a model. A model, if there is one, only voices the result and may
// state only the facts handed to it (the truth check). With no model, the case's own written lines are said.
//   topicsFor(kase, who, frame) -> [{ id, label }]            what can be raised with them now
//   answer(kase, who, { topic, stance, shown }, frame) -> { act, facts: [{ id, text }], line, learned: [clue ids], yielded? }
//     act: tell | deflect | refuse | lie | dontknow | guarded; frame: { learned: Set, holding: Set, said: [],
//     yielded: Set (claims broken, which stay broken), guarded: Map (who -> turns they stay closed up) }
//   shown: the clue or thing put before them; a lie breaks only when it is one of the lie's own breakers; anything else
//   shown against a lie makes them close up for a few turns (Ace Attorney's press and present, without a penalty meter)
import { cluesOf } from "./case.js";

const arr = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);
const opens = (gate, frame, stance) => { const r = gate?.requires || {};
  return (!gate?.stance || arr(gate.stance).includes(stance)) && arr(r.learned).every(l => frame.learned.has(l)) && arr(r.holding).every(h => frame.holding.has(h)); };
const textOf = (f) => typeof f === "string" ? f : f?.text || (Array.isArray(f) ? f.join(" ") : JSON.stringify(f));

export function topicsFor(k, who, frame) {
  const p = arr(k.cast).find(c => c.id === who); if (!p) return [];
  const out = new Map();
  // the case's general topics (the deceased, where were you, the land sale …), then each of this person's clues' topics
  for (const t of arr(k.topics)) out.set(t.id, { id: t.id, label: t.label || t.id });
  for (const c of arr(p.clues)) { const id = c.gate?.topic || c.topic; if (id && !out.has(id)) out.set(id, { id, label: (arr(k.topics).find(t => t.id === id)?.label) || id.replace(/_/g, " ") }); }
  for (const c of arr(p.claims)) { const id = c.topic; if (id && !out.has(id)) out.set(id, { id, label: id.replace(/_/g, " ") }); }
  // and each other person, by name ("what of Master Hale?")
  for (const q of arr(k.cast)) if (q.id !== who && !out.has(`person:${q.id}`)) out.set(`person:${q.id}`, { id: `person:${q.id}`, label: q.name });
  return [...out.values()];
}

export const GUARD_TURNS = 3;
export function answer(k, who, { topic, stance = "ask", shown = null }, frame) {
  const p = arr(k.cast).find(c => c.id === who); if (!p) return { act: "dontknow", facts: [], line: "", learned: [] };
  frame.yielded ||= new Set(); frame.guarded ||= new Map();
  // closed up after a wrong thing was put to them: a turn passes with every question while it lasts
  const g = frame.guarded.get(who) || 0; if (g > 0) { frame.guarded.set(who, g - 1); return { act: "guarded", facts: [], line: p.guarded || "", learned: [] }; }
  // a clue of theirs on this topic, its gate open: they tell it (the truth, a fact from their frame)
  const mine = arr(p.clues).filter(c => (c.gate?.topic || c.topic) === topic);
  const told = mine.filter(c => !frame.learned.has(c.id) && opens(c.gate, frame, stance));
  if (told.length) return { act: "tell", facts: told.map(c => ({ id: c.id, text: textOf(c.fact || c.text) })), line: told.map(c => c.hook || textOf(c.fact)).join(" "), learned: told.map(c => c.id) };
  // a claim on this topic (what they'll say, true or not): its lie stands until a clue that debunks it is shown
  const claim = arr(p.claims).find(c => c.topic === topic);
  if (claim) { const breakers = arr(claim.broken_by || claim.debunked_by);
    // broken once, broken for good: asked again they give what they gave when caught
    if (claim.false && frame.yielded.has(claim.id)) return { act: "refuse", facts: [], line: claim.yield || claim.when_broken || "", learned: [] };
    if (claim.false && stance === "show" && shown && breakers.includes(shown) && (frame.learned.has(shown) || frame.holding.has(shown))) {
      frame.yielded.add(claim.id); return { act: "refuse", facts: [], line: claim.yield || claim.when_broken || "", learned: [], yielded: claim.id }; }
    if (claim.false && stance === "show" && shown) { frame.guarded.set(who, GUARD_TURNS); return { act: "guarded", facts: [], line: p.guarded || claim.line || "", learned: [] }; }
    if (claim.false) return { act: "lie", facts: [{ id: claim.id, text: textOf(claim.fact || claim.text) }], line: claim.line || textOf(claim.fact), learned: [] };
    return { act: "tell", facts: [{ id: claim.id, text: textOf(claim.fact || claim.text) }], line: claim.line || textOf(claim.fact), learned: [] }; }
  // a clue they hold but its gate is shut: they deflect (press, or bring what the gate wants)
  if (mine.length) { const c = mine.find(c => !frame.learned.has(c.id)); if (c) return { act: "deflect", facts: [], line: c.deflect || p.deflect || "", learned: [] }; }
  // nothing in their frame on it
  return { act: "dontknow", facts: [], line: p.dontknow || "", learned: [] };
}

// the truth check (decision 7b, pre-approved in principle): a voiced line may use only the facts handed to it; any
// entity it names must be in those facts, the person's own voice note, the player's words, or what the player knows
export function truthCheck(line, { facts, lexicon, allowed }) {
  const named = lexicon.filter(w => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(line));
  const ok = named.filter(w => !allowed.some(a => a.toLowerCase().includes(w.toLowerCase())) && !facts.some(f => f.text.toLowerCase().includes(w.toLowerCase())));
  return { ok: !ok.length, strays: ok };
}
