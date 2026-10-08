// Questioning a suspect (M7, R57; design/case/family-read.md §5, after epistemic-projector's answer states and
// construct's reveal gates): what a person does when asked about a topic, decided in code from their own frame and
// what the player has learned and holds; never from a model. A model, if there is one, only voices the result and may
// state only the facts handed to it (the truth check). With no model, the case's own written lines are said.
//   topicsFor(kase, who, frame) -> [{ id, label, words?, dry?, retired? }]   what can be raised with them now
//     dry: asking it now would give nothing new (no unlearned clue of theirs on it whose gate asking or pressing opens with
//     what is held and learned now, and their claim on it already heard); retired: every clue on it, from anyone, is
//     learned, and they have no unbroken lie on it (Heaven's Vault: a question leaves everyone once answered anywhere).
//     Neither says anything of the future: a dry topic wakes when something learned opens a gate on it.
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

export const gateOpen = opens;
export function topicsFor(k, who, frame) {
  const p = arr(k.cast).find(c => c.id === who); if (!p) return [];
  const out = new Map(), general = new Map(arr(k.topics).map(t => [t.id, t])), learned = frame.learned || new Set();
  const open = (t) => !t?.after || learned.has(t.after);
  const named = (id) => id.startsWith("person:") ? arr(k.cast).find(c => `person:${c.id}` === id)?.name : null;
  // the case's general topics (the deceased, where were you, the land sale …), then each of this person's clues' and claims'
  // topics (a topic carries its own words for reading your questions; one marked `after` opens once its clue is learned)
  for (const t of arr(k.topics)) if (open(t)) out.set(t.id, { id: t.id, label: t.label || t.id, words: t.words });
  const add = (id) => { if (!id || out.has(id)) return; const t = general.get(id); if (t && !open(t)) return;
    out.set(id, { id, label: t?.label || named(id) || id.replace(/_/g, " "), ...(t?.words ? { words: t.words } : {}) }); };
  for (const c of arr(p.clues)) add(c.gate?.topic || c.topic);
  for (const c of arr(p.claims)) add(c.topic);
  // and each other person, by name ("what of Master Hale?")
  for (const q of arr(k.cast)) if (q.id !== who && !out.has(`person:${q.id}`)) out.set(`person:${q.id}`, { id: `person:${q.id}`, label: q.name });
  for (const t of out.values()) { const w = wellOf(k, p, t.id, frame); if (w.dry) t.dry = true; if (w.retired) t.retired = true; }
  return [...out.values()];
}
// is the well dry: what asking or pressing on a topic now would give them (see topicsFor)
const topicOf = (c) => c.gate?.topic || c.topic;
function wellOf(k, p, topic, frame) {
  const learned = frame.learned || new Set(), f = { learned, holding: frame.holding || new Set() };
  const asking = (c) => { const st = c.gate?.stance; return (st ? arr(st).filter(s => s === "ask" || s === "press") : ["ask"]).some(s => opens(c.gate, f, s)); };
  const live = arr(p.clues).some(c => topicOf(c) === topic && !learned.has(c.id) && asking(c));
  const claim = arr(p.claims).find(c => c.topic === topic);
  const heard = arr(frame.said).some(s => s.who === p.id && s.topic === topic && s.act !== "guarded");
  const dry = !live && (!claim || heard);
  const all = arr(k.cast).flatMap(c => arr(c.clues)).filter(c => topicOf(c) === topic && !arr(c.gate?.stance).includes("accuse"));
  const lie = arr(p.claims).some(c => c.topic === topic && c.false && !frame.yielded?.has(c.id));
  return { dry, retired: dry && all.length > 0 && all.every(c => learned.has(c.id)) && !lie };
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
