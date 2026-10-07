// A case in play (M7, R57-R59): the case's things placed by the house's placer (each knowing its clue, by story id),
// its people present as the holodeck shows them (src/make/presence.js), questioned through the panel
// (lab/ui/talk-panel.js) by topics or in your own words (src/make/intent.js in code first, the relay's read job when
// unsure), answered from their own frames (src/make/talk.js), voiced by the relay when there is one and checked,
// else in the case's own lines; the narrator (src/make/narrator.js) watching every turn and moving the world only by
// its closed effects; the accusation confirmed a group at a time against the case's solution.
//   caseRequired(kase, plan) -> plan.required entries (before the house is built)
//   playCase({ kase, plan, manor, works, panel, voice, narrator, say, presenceOf(id, room?), setVar }) -> hooks
import { topicsFor, answer, truthCheck } from "./talk.js";
import { readIntent } from "./intent.js";
import { cluesOf } from "./case.js";

const arr = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);

// what the case puts in the house: each thing in its room, or in a slot of another of the case's things
export function caseRequired(k, plan) {
  const things = arr(k.things), byId = new Map(things.map(t => [t.id, t])), rooms = new Set(plan.rooms.map(r => r.id)), out = [];
  const roomOf = (t, n = 0) => rooms.has(t.at) ? t.at : byId.has(t.at) && n < 6 ? roomOf(byId.get(t.at), n + 1) : null;
  for (const t of things) { const room = roomOf(t); if (!room || !t.kind) continue;
    const host = byId.get(t.at);
    out.push(host ? { kind: t.kind, room, in: { kind: host.kind, slot: t.slot || "drawer" }, story: t.id } : { kind: t.kind, room, story: t.id, ...(t.place ? { place: t.place } : {}) }); }
  // hosts first, so a thing in a drawer finds its desk placed
  return out.sort((a, b) => (a.in ? 1 : 0) - (b.in ? 1 : 0));
}

export function playCase({ kase: k, plan, manor, works, panel, voice = null, narrator = null, say = () => {}, presenceOf, setVar = () => {}, onEnd = () => {} }) {
  const clues = new Map(cluesOf(k).map(c => [c.id, c])), cast = new Map(arr(k.cast).map(c => [c.id, c]));
  const thingOf = new Map(manor.things.filter(b => b.story).map(b => [b.story, b]));
  const frame = { learned: new Set(), holding: new Set(), said: [], yielded: new Set(), guarded: new Map() };
  const notebook = { clues: [], persons: new Map(), caught: [] };
  let talking = null, lastTopic = null, turn = 0;
  const label = (id) => clues.get(id)?.label || arr(k.things).find(t => t.id === id)?.label || id.replace(/_/g, " ");
  const learn = (id, where) => { if (frame.learned.has(id)) return false; frame.learned.add(id); notebook.clues.push({ id, label: label(id), where }); narrator?.observe({ learned: id }); return true; };
  const evidence = () => [...[...frame.learned].map(id => ({ id, label: label(id), kind: "clue" })), ...[...frame.holding].map(id => ({ id, label: label(id), kind: "thing" }))];
  const lexicon = [...arr(k.cast).map(c => c.name), ...arr(k.things).map(t => t.label).filter(Boolean)];

  // ---- the house's things: opening, taking or reading one that carries a clue learns it (and taking it, holds it)
  function afterAct(t, r) {
    const id = t?.b?.story; if (!id) return;
    const thing = arr(k.things).find(q => q.id === id); if (!thing) return;
    if (r?.took) { frame.holding.add(id); narrator?.observe({ holding: id }); }
    narrator?.observe({ opened: id });
    for (const c of arr(thing.clue)) if (learn(c, thing.label || thing.kind)) say(clues.get(c)?.hook || `You note it: ${label(c)}.`);
    step();
  }

  // ---- talking: open the panel on a person
  function talkTo(who) {
    const p = cast.get(who); if (!p) return; talking = who; notebook.persons.set(who, { name: p.name, role: p.role });
    panel.open({ who, name: p.name, role: p.role, portrait: presenceOf(who)?.picture, intro: p.intro, topics: topicsFor(k, who, frame), evidence: evidence() });
  }
  // what they do, voiced: the relay's voice job with only the facts handed to it, checked; else the case's own line
  async function reply(who, topic, stance, shown = null) {
    const p = cast.get(who), a = answer(k, who, { topic, stance, shown }, frame); lastTopic = topic; turn++;
    frame.said.push({ who, topic, act: a.act }); narrator?.observe({ said: topic, who, act: a.act });
    let line = a.line;
    if (voice?.available?.() && a.act !== "guarded") { panel.busy(true);
      const v = await voice.voice({ persona: [p.voice?.register, ...arr(p.voice?.phrases)].filter(Boolean).join("; "), act: a.act, facts: a.facts, last: frame.said.slice(-2), max_words: 60 },
        { check: (l) => truthCheck(l, { facts: a.facts, lexicon, allowed: [p.name, ...[...frame.learned].map(label)] }).ok });
      panel.busy(false); if (v && !v.fallback && v.line) line = v.line; }
    if (!line) line = a.act === "dontknow" ? "I know nothing of that." : a.facts.map(f => f.text).join(" ");
    const noted = []; for (const c of a.learned) if (learn(c, p.name)) noted.push({ label: label(c) });
    if (a.yielded) notebook.caught.push({ who, label: arr(p.claims).find(c => c.id === a.yielded)?.label || "a lie" });
    panel.say({ who: "them", text: line, act: a.act, noted });
    panel.setTopics(topicsFor(k, who, frame)); panel.setEvidence(evidence()); panel.guarded?.((frame.guarded.get(who) || 0) > 0);
    step();
  }
  // your own words: read in code first; the relay's read job only when unsure; else ask you to choose a topic
  async function words(text) {
    const who = talking; if (!who) return; panel.say({ who: "you", text });
    const ctx = { topics: topicsFor(k, who, frame).filter(t => !t.id.startsWith("person:")), people: arr(k.cast).filter(c => c.id !== who).map(c => ({ id: c.id, name: c.name, aka: c.aka })), evidence: evidence() };
    let r = readIntent(text, ctx);
    if (r.topic === "none" && r.stance !== "accuse" && !r.evidence && voice?.available?.()) { panel.busy(true);
      const v = await voice.read({ suspect: who, utterance: text.slice(0, 200), topics: topicsFor(k, who, frame).slice(0, 16) }); panel.busy(false);
      if (v && !v.fallback && v.topic && v.topic !== "none") r = { ...r, topic: v.topic, stance: v.stance || r.stance }; }
    if (r.stance === "accuse") return openAccusation();
    if (r.topic === "none" && !r.evidence) return panel.say({ who: "aside", text: "They wait for you to be plainer. (Choose a matter below.)" });
    return reply(who, r.topic === "none" ? lastTopic : r.topic, r.stance, r.evidence);
  }

  // ---- the narrator: after each turn, the beat it stages (a closed list of effects, run by the world's own rules)
  function step() {
    if (!narrator) return; const beat = narrator.step?.(); if (!beat) return;
    if (beat.line || beat.hook) say(beat.line || beat.hook);
    for (const e of arr(beat.effects)) {
      if (e.spawn_person || e.move_person) { const { id, at, to } = e.spawn_person || e.move_person; presenceOf(id, at || to); }
      if (e.set_var) for (const [name, value] of Object.entries(e.set_var)) setVar(name, value);
      if (e.reveal_thing) { const b = thingOf.get(e.reveal_thing.id || e.reveal_thing); if (b) b.node.traverse(o => o.layers.set(0)); }
    }
  }

  // ---- the accusation: a group of blanks at a time, confirmed only when all of it is right
  function openAccusation() {
    const sol = k.solution || k.accusation || {};
    panel.openAccusation({ suspects: arr(k.cast).map(c => ({ id: c.id, name: c.name })), pillars: arr(sol.blanks || k.pillars).map(p => ({ id: p.id, label: p.label, lead: p.lead, options: arr(p.options) })), groups: sol.groups });
  }
  function accuse({ group, picks }) {
    const sol = k.solution || k.accusation || {}, truth = sol.truth || {};
    const ok = Object.entries(picks).every(([key, v]) => truth[key] === undefined || truth[key] === v);
    panel.accusationResult({ group, ok });
    narrator?.observe({ accused: picks, ok });
    return ok;
  }
  return { afterAct, talkTo, reply, words, accuse, openAccusation, frame, notebook, step, isClue: (b) => !!b?.story };
}
