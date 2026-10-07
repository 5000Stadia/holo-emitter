// Questioning a suspect (M7, R57; design/case/family-read.md §5, after epistemic-projector's answer states and
// construct's reveal gates): what a person does when asked about a topic, decided in code from their own frame and
// what the player has learned and holds; never from a model. A model, if there is one, only voices the result and may
// state only the facts handed to it (the truth check). With no model, the case's own written lines are said.
//   topicsFor(kase, who, frame) -> [{ id, label }]            what can be raised with them now
//   answer(kase, who, { topic, stance }, frame) -> { act, facts: [{ id, text }], line, learned: [clue ids] }
//     act: tell | deflect | refuse | lie | dontknow; frame: { learned: Set, holding: Set, said: [] }
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

export function answer(k, who, { topic, stance = "ask" }, frame) {
  const p = arr(k.cast).find(c => c.id === who); if (!p) return { act: "dontknow", facts: [], line: "", learned: [] };
  // a clue of theirs on this topic, its gate open: they tell it (the truth, a fact from their frame)
  const mine = arr(p.clues).filter(c => (c.gate?.topic || c.topic) === topic);
  const told = mine.filter(c => !frame.learned.has(c.id) && opens(c.gate, frame, stance));
  if (told.length) return { act: "tell", facts: told.map(c => ({ id: c.id, text: textOf(c.fact || c.text) })), line: told.map(c => c.hook || textOf(c.fact)).join(" "), learned: told.map(c => c.id) };
  // a claim on this topic (what they'll say, true or not): its lie stands until a clue that debunks it is shown
  const claim = arr(p.claims).find(c => c.topic === topic);
  if (claim) { const broken = arr(claim.broken_by || claim.debunked_by).some(id => frame.learned.has(id)) && stance === "show";
    if (claim.false && !broken) return { act: "lie", facts: [{ id: claim.id, text: textOf(claim.fact || claim.text) }], line: claim.line || textOf(claim.fact), learned: [] };
    if (claim.false && broken) return { act: "refuse", facts: [], line: claim.yield || claim.when_broken || "", learned: [] };
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
