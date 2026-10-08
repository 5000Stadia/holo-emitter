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

// a case thing's own fields as the settings its kind reads: the lock a key fits, the keys a chest's padlocks need, how
// it starts (a drawer open, a candle two-thirds burnt), and any settings it names
export const caseSettings = (t) => ({ ...(t.settings || {}), ...(t.key ? { fits: t.key } : {}), ...(t.locks_need ? { keys: t.locks_need } : {}), ...(t.state ? { start: t.state } : {}) });

// what the case puts in the house: each thing in its room, or in a slot of another of the case's things
export function caseRequired(k, plan, known = null) {   // known: the catalogue's kinds; a thing of a kind not yet written is skipped (and listed by the page)
  const things = arr(k.things), byId = new Map(things.map(t => [t.id, t])), rooms = new Set(plan.rooms.map(r => r.id)), out = [];
  const roomOf = (t, n = 0) => rooms.has(t.at) ? t.at : byId.has(t.at) && n < 6 ? roomOf(byId.get(t.at), n + 1) : null;
  for (const t of things) { const room = roomOf(t); if (!room || !t.kind || (known && !known.has(t.kind))) continue;
    const host = byId.get(t.at), settings = caseSettings(t);
    out.push(host ? { kind: t.kind, room, in: { kind: host.kind, ...(t.slot ? { slot: t.slot } : {}) }, story: t.id, settings }
      : { kind: t.kind, room, story: t.id, settings, ...(t.place ? { place: t.place } : {}) }); }
  // hosts first, so a thing in a drawer finds its desk placed
  return out.sort((a, b) => (a.in ? 1 : 0) - (b.in ? 1 : 0));
}

export function playCase({ kase: k, plan, manor, works, panel, voice = null, narrator = null, say = () => {}, presenceOf, setVar = () => {}, onEnd = () => {}, saved = null, persist = null }) {
  const clues = new Map(cluesOf(k).map(c => [c.id, c])), cast = new Map(arr(k.cast).map(c => [c.id, c]));
  const thingOf = new Map(manor.things.filter(b => b.story).map(b => [b.story, b]));
  const frame = { learned: new Set(), holding: new Set(), said: [], yielded: new Set(), guarded: new Map() };
  const notebook = { clues: [], persons: new Map(), caught: [] };
  let talking = null, lastTopic = null, turn = 0;
  // the play's receipts (R59): how long from arrival to the verdict, how it was questioned, what was found, model calls
  const R = { t0: performance.now(), words: 0, unread: 0, shown: 0, opened: 0, calls: 0, tries: 0, solved: null };
  const receipts = () => ({ minutes: +(((R.solved ?? performance.now()) - R.t0) / 60000).toFixed(1), questions: turn, by_topic: turn - (R.words - R.unread), in_words: R.words, words_unread: R.unread,
    shown: R.shown, opened: R.opened, clues: frame.learned.size, of_clues: clues.size, people: notebook.persons.size, wrong_tries: R.tries, model_calls: R.calls, solved: R.solved != null });
  const label = (id) => clues.get(id)?.label || arr(k.things).find(t => t.id === id)?.label || id.replace(/_/g, " ");
  // (the narrator hears each turn as one array of events: src/make/narrator.js observe)
  let pending = [];
  const learn = (id, where) => { if (frame.learned.has(id)) return false; frame.learned.add(id); notebook.clues.push({ id, label: label(id), where }); pending.push({ type: "learn", clue: id }); return true; };
  const evidence = () => [...[...frame.learned].map(id => ({ id, label: label(id), kind: "clue" })), ...[...frame.holding].map(id => ({ id, label: label(id), kind: "thing" }))];
  const lexicon = [...arr(k.cast).map(c => c.name), ...arr(k.things).map(t => t.label).filter(Boolean)];

  // ---- the house's things: opening, taking or reading one that carries a clue learns it (and taking it, holds it); a
  // paper (the case's papers: its own text, the clue there to be noticed) opens in the reader instead of a line
  const papersRead = [];
  function afterAct(t, r) {
    const id = t?.b?.story; if (!id) return;
    const thing = arr(k.things).find(q => q.id === id); if (!thing) return;
    // (a refusal teaches nothing: a locked box tried had given up its note; shutting a thing again doesn't read it again)
    // (read already, a paper won't 'read' again: it opens in the reader as it is)
    if (r?.refused && k.papers?.[id] && papersRead.includes(id)) return openPaper(id);
    if (!r || r.refused || !(r.took || r.did)) return;
    const shutting = !r.took && /^(closed|shut|locked|down)$/.test(r.state || "");
    if (r.took) { frame.holding.add(id); pending.push({ type: "take", thing: id }); }
    pending.push({ type: "open", id }); R.opened++;
    const fresh = []; if (!shutting) for (const c of arr(thing.clue)) if (learn(c, thing.label || thing.kind)) fresh.push(c);
    const paper = k.papers?.[id];
    if (paper && !shutting && panel.openReader) { if (!papersRead.includes(id)) papersRead.push(id); panel.openReader({ ...paper, noted: fresh.map(c => ({ label: label(c) })) }); }
    else for (const c of fresh) say(clues.get(c)?.hook || `You note it: ${label(c)}.`);
    step();
  }
  const openPaper = (id) => k.papers?.[id] && panel.openReader({ ...k.papers[id] });

  // ---- talking: open the panel on a person
  function talkTo(who) {
    const p = cast.get(who); if (!p) return; talking = who; notebook.persons.set(who, { name: p.name, role: p.role, met: true });
    panel.open({ who, name: p.name, role: p.role, portrait: presenceOf(who)?.picture, intro: p.intro, topics: topicsFor(k, who, frame), evidence: evidence() });
  }
  // what they do, voiced: the relay's voice job with only the facts handed to it, checked; else the case's own line
  async function reply(who, topic, stance, shown = null) {
    const p = cast.get(who), a = answer(k, who, { topic, stance, shown }, frame); lastTopic = topic; turn++; if (shown) R.shown++;
    frame.said.push({ who, topic, act: a.act }); pending.push({ type: "say", who, topic, act: a.act });
    let line = a.line;
    if (voice?.available?.() && a.act !== "guarded") { panel.busy(true);
      R.calls++; const v = await voice.voice({ persona: [p.voice?.register, ...arr(p.voice?.phrases)].filter(Boolean).join("; "), act: a.act, facts: a.facts, last: frame.said.slice(-2), max_words: 60 },
        { check: (l) => truthCheck(l, { facts: a.facts, lexicon, allowed: [p.name, ...[...frame.learned].map(label)] }).ok });
      panel.busy(false); if (v && !v.fallback && v.line) line = v.line; }
    if (!line) line = a.act === "dontknow" ? "I know nothing of that." : a.facts.map(f => f.text).join(" ");
    const noted = []; for (const c of a.learned) if (learn(c, p.name)) noted.push({ label: label(c) });
    // who they told you of (Dame Anne's "who is in the house"): into the notebook, with where they are, as direction
    for (const f of a.facts) for (const id of arr(arr(p.claims).find(c => c.id === f.id)?.tells_of)) if (!notebook.persons.has(id) && cast.has(id)) notebook.persons.set(id, { name: cast.get(id).name, role: cast.get(id).role, met: false });
    if (a.yielded) notebook.caught.push({ who, label: arr(p.claims).find(c => c.id === a.yielded)?.label || "a lie" });
    panel.say({ who: "them", text: line, act: a.act, noted });
    panel.setTopics(topicsFor(k, who, frame)); panel.setEvidence(evidence()); panel.guarded?.((frame.guarded.get(who) || 0) > 0);
    step();
  }
  // your own words: read in code first; the relay's read job only when unsure; else ask you to choose a topic
  async function words(text) {
    const who = talking; if (!who) return; panel.say({ who: "you", text }); R.words++;
    const ctx = { topics: topicsFor(k, who, frame).filter(t => !t.id.startsWith("person:")), people: arr(k.cast).filter(c => c.id !== who).map(c => ({ id: c.id, name: c.name, aka: c.aka })), evidence: evidence() };
    let r = readIntent(text, ctx);
    if (r.topic === "none" && r.stance !== "accuse" && !r.evidence && voice?.available?.()) { panel.busy(true); R.calls++;
      const v = await voice.read({ suspect: who, utterance: text.slice(0, 200), topics: topicsFor(k, who, frame).slice(0, 16) }); panel.busy(false);
      if (v && !v.fallback && v.topic && v.topic !== "none") r = { ...r, topic: v.topic, stance: v.stance || r.stance }; }
    if (r.stance === "accuse") return openAccusation();
    if (r.topic === "none" && !r.evidence) { R.unread++; return panel.say({ who: "aside", text: "They wait for you to be plainer. (Choose a matter below.)" }); }
    return reply(who, r.topic === "none" ? lastTopic : r.topic, r.stance, r.evidence);
  }

  // ---- the narrator: after each turn, the beat it stages (a closed list of effects, run by the world's own rules)
  // one turn: what happened goes to the narrator; the clocks that fired run, then a beat if one is due; every effect is
  // one of the closed list, run by the world's own rules
  function run(effects) {
    for (const e of arr(effects)) {
      if (e.type === "spawn_person") presenceOf(e.id, e.at);
      else if (e.type === "move_person") presenceOf(e.id, e.to);
      else if (e.type === "set_var") setVar(e.name, e.value);
      else if (e.type === "reveal_thing") { const b = thingOf.get(e.id); if (b) b.node.traverse(o => o.layers.set(0)); setVar(`revealed.${e.id}`, true); }
    }
  }
  function step(extra = []) {
    save();
    if (!narrator) { pending = []; return; }
    const events = [...pending, ...extra]; pending = []; if (!events.length) return;
    let r; try { r = narrator.observe(events); } catch (err) { console.warn("narrator:", err.message); return; }
    for (const f of arr(r.fired)) { run(f.effects); tell(f.line); }
    if (r.due) { const m = narrator.menu(), b = narrator.pick(m); if (b) { run(narrator.apply(b)); tell(b.line || b.hook); } }
  }
  // (said in the panel while you're questioning someone, where you're reading; it had gone up behind the panel)
  function tell(t) { if (!t) return; if (panel.isOpen?.()) panel.say({ who: "aside", text: t }); else say(t); }
  const enter = (room) => step([{ type: "enter", room }]);
  const idle = () => step([{ type: "idle" }]);

  // ---- the accusation: a group of blanks at a time, confirmed only when all of it is right
  function openAccusation() {
    const sol = k.solution || k.accusation || {};
    panel.openAccusation({ suspects: arr(k.cast).map(c => ({ id: c.id, name: c.name })), pillars: arr(sol.blanks || k.pillars).map(p => ({ id: p.id, label: p.label, lead: p.lead, options: arr(p.options) })), groups: sol.groups });
    for (const g of locked) panel.accusationResult({ group: g, ok: true });     // (groups confirmed before a resume stay confirmed)
  }
  const locked = new Set(); let tries = 0;
  function accuse({ group, picks }) {
    const sol = k.solution || k.accusation || {}, truth = sol.truth || {}, keys = arr(sol.groups).find(g => g.id === group)?.keys || Object.keys(picks);
    const ok = keys.every(key => truth[key] === undefined || picks[key] === truth[key]);
    if (!ok) { tries++; R.tries++; const r = sol.rebuttals?.[picks.suspect]; if (r && picks.suspect && picks.suspect !== truth.suspect) panel.say?.({ who: "aside", text: r }); }
    panel.accusationResult({ group, ok });
    if (ok) locked.add(group);
    if (ok && arr(sol.groups).every(g => locked.has(g.id)) && sol.verdict) { R.solved = performance.now(); const q = receipts();
      // the verdict carries the play's receipts, for a phone's screenshot
      panel.verdict({ ...sol.verdict, text: `${sol.verdict.text || ""} (Solved in ${q.minutes} minutes: ${q.questions} questions, ${q.in_words} in your own words; ${q.clues} of ${q.of_clues} clues; ${q.wrong_tries} wrong ${q.wrong_tries === 1 ? "try" : "tries"}.)` });
      try { localStorage.setItem(`case-receipt:${k.id}`, JSON.stringify({ ...q, at: new Date().toISOString() })); } catch (_) {}
      onEnd({ solved: true, tries, receipts: q }); }
    if (picks.suspect || picks.who) { pending.push({ type: "accuse", who: picks.suspect || picks.who }); step(); }
    return ok;
  }
  const roomName = (id) => plan.rooms.find(r => r.id === presenceOf(id)?.room)?.name;
  const notebookView = () => ({ persons: [...notebook.persons].map(([id, p]) => ({ id, name: p.name, note: [p.role, roomName(id) && `now in the ${roomName(id).toLowerCase()}`, !p.met && "not yet questioned"].filter(Boolean).join(" · ") })), clues: notebook.clues.map(c => ({ id: c.id, label: c.label, from: `from ${c.where}` })), papers: papersRead.map(id => ({ id, title: k.papers[id].title })), contradictions: notebook.caught.map(c => ({ label: `${cast.get(c.who)?.name}: ${c.label}` })) });
  // ---- kept between visits (a phone's tab is killed and reloaded, or you come back tomorrow): everything you have learned,
  // been told, read and confirmed, the narrator's own state, where each person now is, how long you've played. Plain JSON,
  // written after every turn (a few KB); the house's own state (doors, drawers, what you carry) is the world document's
  function snapshot() {
    return { v: 1, case: k.id, learned: [...frame.learned], holding: [...frame.holding], said: frame.said.slice(-40), yielded: [...frame.yielded], guarded: [...frame.guarded],
      notebook: { clues: notebook.clues, persons: [...notebook.persons], caught: notebook.caught }, papers: papersRead, turn, lastTopic, locked: [...locked], tries,
      R: { ...R, t0: undefined, played: (R.solved ?? performance.now()) - R.t0 }, narrator: narrator?.state?.() ?? null,
      rooms: Object.fromEntries(arr(k.cast).map(c => [c.id, presenceOf(c.id)?.room]).filter(([, r]) => r)) };
  }
  let saveT = 0; function save() { if (!persist) return; clearTimeout(saveT); saveT = setTimeout(() => { try { persist(snapshot()); } catch (e) { console.warn("case save:", e.message); } }, 250); }
  if (saved?.case === k.id) {
    for (const id of arr(saved.learned)) frame.learned.add(id); for (const id of arr(saved.holding)) frame.holding.add(id); for (const id of arr(saved.yielded)) frame.yielded.add(id);
    frame.said.push(...arr(saved.said)); for (const [w, n] of arr(saved.guarded)) frame.guarded.set(w, n);
    notebook.clues.push(...arr(saved.notebook?.clues)); for (const [id, p] of arr(saved.notebook?.persons)) notebook.persons.set(id, p); notebook.caught.push(...arr(saved.notebook?.caught));
    papersRead.push(...arr(saved.papers)); turn = saved.turn || 0; lastTopic = saved.lastTopic || null; for (const g of arr(saved.locked)) locked.add(g); tries = saved.tries || 0;
    Object.assign(R, saved.R || {}, { t0: performance.now() - (saved.R?.played || 0) }); if (saved.R?.solved != null) R.solved = performance.now();
    for (const [id, room] of Object.entries(saved.rooms || {})) presenceOf(id, room);
  }
  const resumed = saved?.case === k.id ? { minutes: +((saved.R?.played || 0) / 60000).toFixed(0), clues: frame.learned.size } : null;
  return { resumed, snapshot, receipts, openPaper, afterAct, talkTo, reply, words, accuse, openAccusation, frame, notebook, notebookView, step, enter, idle, talking: () => talking, evidence, isClue: (b) => !!b?.story };
}
