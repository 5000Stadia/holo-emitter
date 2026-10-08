// A case in play (M7, R57-R59): the case's things placed by the house's placer (each knowing its clue, by story id),
// its people present as the holodeck shows them (src/make/presence.js), questioned through the panel
// (lab/ui/talk-panel.js) by topics or in your own words (src/make/intent.js in code first, the relay's read job when
// unsure), answered from their own frames (src/make/talk.js), voiced by the relay when there is one and checked,
// else in the case's own lines; the narrator (src/make/narrator.js) watching every turn and moving the world only by
// its closed effects; the accusation confirmed a group at a time against the case's solution.
//   caseRequired(kase, plan) -> plan.required entries (before the house is built)
//   playCase({ kase, plan, manor, works, panel, voice, narrator, say, presenceOf(id, room?), setVar }) -> hooks
// What stands open (src/make/leads.js): the case's leads (k.leads),
// stepped after every turn against the narrator's picture of the play (else the frame's own), raised and closed for good,
// kept with the snapshot; notebookView() carries them, the people as a court record (where each is now, the claims you
// have heard from them, a broken one with what broke it) and how many matters each still has worth raising.
import { topicsFor, answer, truthCheck, gateOpen } from "./talk.js";
import { compileLeads, stepLeads, leadFrame } from "./leads.js";
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
  const notebook = { clues: [], persons: new Map(), caught: [], heard: [] };
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
  // looking: a thing whose clue is had by looking (the body, the chest's clean corner, the candlestick's dent, a drawer
  // standing open on a paper) is looked at on the first tap, before it is worked: the playtest's taps had lit the evidence
  // candle, shut the open drawer unread, and been refused by the padlocked chest, and taught nothing
  const lookClues = (id) => arr(arr(k.things).find(q => q.id === id)?.clue).filter(c => /look/.test(clues.get(c)?.reveal || "") && !frame.learned.has(c));
  const wouldLook = (id) => !!id && lookClues(id).length > 0;
  function look(id) {
    const thing = arr(k.things).find(q => q.id === id), want = lookClues(id); if (!thing || !want.length) return false;
    pending.push({ type: "open", id }); R.opened++;
    const fresh = want.filter(c => learn(c, thing.label || thing.kind)), paper = k.papers?.[id];
    if (paper && panel.openReader) { if (!papersRead.includes(id)) papersRead.push(id); panel.openReader({ ...paper, noted: fresh.map(c => ({ label: label(c) })) }); }
    else for (const c of fresh) say(clues.get(c)?.hook || `You note it: ${label(c)}.`);
    step(); return true;
  }
  const openPaper = (id) => k.papers?.[id] && panel.openReader({ ...k.papers[id] });

  // ---- talking: open the panel on a person
  function talkTo(who) {
    const p = cast.get(who); if (!p) return; talking = who; notebook.persons.set(who, { name: p.name, role: p.role, met: true });
    panel.open({ who, name: p.name, role: p.role, portrait: presenceOf(who)?.face || presenceOf(who)?.picture, intro: p.intro, topics: topicsFor(k, who, frame), evidence: evidence() });
  }
  // what they do, voiced: the relay's voice job with only the facts handed to it, checked; else the case's own line
  async function reply(who, topic, stance, shown = null) {
    panel.markAsked?.(topic);             // (the chip marked asked, and the matter evidence is next shown on, however it was raised)
    const p = cast.get(who), a = answer(k, who, { topic, stance, shown }, frame); lastTopic = topic; turn++; if (shown) R.shown++;
    const claim = claimHeard(p, topic, a);
    frame.said.push({ who, topic, act: a.act, ...(claim ? { claim } : {}) }); if (claim && !notebook.heard.some(x => x.who === who && x.claim === claim)) notebook.heard.push({ who, claim }); pending.push({ type: "say", who, topic, act: a.act });
    let line = a.line;
    if ((voice && await voice.available()) && a.act !== "guarded") { panel.busy(true);
      R.calls++; const v = await voice.voice({ persona: [p.voice?.register, ...arr(p.voice?.phrases)].filter(Boolean).join("; "), act: a.act, facts: a.facts, last: frame.said.slice(-2), max_words: 60 },
        { check: (l) => truthCheck(l, { facts: a.facts, lexicon, allowed: [p.name, ...[...frame.learned].map(label)] }).ok });
      panel.busy(false); if (v && !v.fallback && v.line) line = v.line; }
    if (!line) line = a.act === "dontknow" ? "I know nothing of that." : a.facts.map(f => f.text).join(" ");
    const noted = []; for (const c of a.learned) if (learn(c, p.name)) noted.push({ label: label(c) });
    // who they told you of (Dame Anne's "who is in the house"): into the notebook, with where they are, as direction
    for (const f of a.facts) for (const id of arr(arr(p.claims).find(c => c.id === f.id)?.tells_of)) if (!notebook.persons.has(id) && cast.has(id)) notebook.persons.set(id, { name: cast.get(id).name, role: cast.get(id).role, met: false });
    if (a.yielded) notebook.caught.push({ who, claim: a.yielded, label: arr(p.claims).find(c => c.id === a.yielded)?.label || "a lie", ...(shown ? { by: shown, byLabel: label(shown) } : {}) });
    panel.say({ who: "them", text: line, act: a.act, noted });
    panel.setTopics(topicsFor(k, who, frame)); panel.setEvidence(evidence()); panel.guarded?.((frame.guarded.get(who) || 0) > 0);
    step();
  }
  // your own words: read in code first; the relay's read job only when unsure; else ask you to choose a topic
  async function words(text) {
    const who = talking; if (!who) return; R.words++;
    const ctx = { topics: topicsFor(k, who, frame).filter(t => !t.id.startsWith("person:")), people: arr(k.cast).filter(c => c.id !== who).map(c => ({ id: c.id, name: c.name, aka: c.aka })), evidence: evidence() };
    let r = readIntent(text, ctx);
    if (r.topic === "none" && r.stance !== "accuse" && !r.evidence && (voice && await voice.available())) { panel.busy(true); R.calls++;
      const v = await voice.read({ suspect: who, utterance: text.slice(0, 200), topics: topicsFor(k, who, frame).slice(0, 16) }); panel.busy(false);
      if (v && !v.fallback && v.topic && v.topic !== "none") r = { ...r, topic: v.topic, stance: v.stance || r.stance }; }
    // an accusation put to the one you question (or to no one named): what they have for it comes first (Daniel's
    // confession is a clue of his gated on being accused); with nothing for it, or another named, the accusation's sheet
    if (r.stance === "accuse") {
      const other = /^person:/.test(r.topic) && r.topic !== `person:${who}`;
      const c = !other && arr(cast.get(who)?.clues).find(c => arr(c.gate?.stance).includes("accuse") && !frame.learned.has(c.id) && gateOpen(c.gate, frame, "accuse"));
      return c ? reply(who, c.gate?.topic || c.topic, "accuse") : openAccusation(); }
    // pressed with no matter named ("you're lying!"): the matter last raised with them
    const last = frame.said.at(-1)?.who === who ? lastTopic : null;
    if (r.topic === "none" && !r.evidence && r.stance === "press" && last) return reply(who, last, "press");
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
  function step(extra = []) { narrate(extra); stepOpen(); save(); }
  function narrate(extra) {
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
  // what they have told you as their own account (a claim, true or not), for the court record: a claim answered, or a lie
  // first told as a clue of theirs (Daniel's half past ten), or the claim given up when it broke
  function claimHeard(p, topic, a) {
    const claims = arr(p.claims), byId = (id) => claims.find(c => c.id === id);
    if ((a.act === "tell" || a.act === "lie") && a.facts.length === 1 && byId(a.facts[0].id)) return a.facts[0].id;
    if (a.act === "tell" && a.learned.some(id => clues.get(id)?.effect === "false")) return claims.find(c => c.topic === topic && c.false)?.id || null;
    if (a.act === "refuse") return a.yielded || claims.find(c => c.topic === topic)?.id || null;
    return null;
  }
  const bare = (s) => String(s || "").replace(/^[^:]{1,40}:\s*/, "");
  // ---- what stands open: the case's leads, stepped after every turn
  let leads = null; const leadMemo = { raised: [], closed: [] };
  const people = () => Object.fromEntries(arr(k.cast).map(c => [c.id, presenceOf(c.id)?.room ?? null]));
  function leadState() {
    const s = narrator?.state?.() || {};
    return leadFrame({ ...s, learned: [...new Set([...arr(s.learned), ...frame.learned])], held: [...new Set([...arr(s.held), ...frame.holding])],
      said: [...arr(s.said), ...frame.said], people: s.people || people(), turns: s.turns ?? turn, cov: narrator?.coverage?.().pillars || {} });
  }
  function stepOpen() {
    if (!leads) return; const n = leadMemo.raised.length;
    try { stepLeads(leads, leadState(), leadMemo); } catch (e) { console.warn("leads:", e.message); }
    if (leadMemo.raised.length > n && n > 0) panel.fresh?.();
  }
  const useLeads = (L) => { try { leads = compileLeads(L); stepOpen(); } catch (e) { console.warn("leads refused:", e.message); leads = null; } };
  const leadView = (l) => ({ id: l.id, text: l.text, where: l.where || "", now: arr(l.who).filter(w => cast.has(w) && roomName(w)).map(w => `${cast.get(w).name} is in the ${roomName(w).toLowerCase()}`).join("; ") });
  function leadsView() {
    if (!leads) return null;
    const raised = new Set(leadMemo.raised), closed = new Set(leadMemo.closed);
    return { open: leads.filter(l => raised.has(l.id) && !closed.has(l.id)).map(leadView), done: leadMemo.closed.filter(id => raised.has(id)).map(id => leads.find(l => l.id === id)).filter(Boolean).map(leadView).reverse() };
  }
  // the people as a court record: who, where now, the claims heard (a broken one struck, with what broke it), and how many
  // matters are still worth raising with them (the chips' own reckoning: talk.js topicsFor dry)
  function personView(id, p) {
    const c = cast.get(id), heard = [];
    for (const s of notebook.heard) if (s.who === id && !heard.includes(s.claim)) heard.push(s.claim);
    for (const x of notebook.caught) if (x.who === id && x.claim && !heard.includes(x.claim)) heard.push(x.claim);
    const claims = heard.map(cid => { const q = arr(c?.claims).find(q => q.id === cid), x = notebook.caught.find(x => x.who === id && x.claim === cid);
      return { id: cid, label: bare(q?.label || cid), ...(x ? { broken: true, by: x.byLabel || "" } : {}) }; });
    const fresh = p.met ? topicsFor(k, id, frame).filter(t => !t.dry && !t.retired && !t.id.startsWith("person:")).length : null;
    return { id, name: p.name, note: [p.role, roomName(id) && `now in the ${roomName(id).toLowerCase()}`, !p.met && "not yet questioned"].filter(Boolean).join(" · "), claims, ...(fresh != null ? { fresh } : {}) };
  }
  const notebookView = () => ({ leads: leadsView(), persons: [...notebook.persons].map(([id, p]) => personView(id, p)), clues: notebook.clues.map(c => ({ id: c.id, label: c.label, from: `from ${c.where}` })), papers: papersRead.map(id => ({ id, title: k.papers[id].title })),
    contradictions: notebook.caught.map(c => { const t = `${cast.get(c.who)?.name}: ${bare(c.label)}`; return { label: t, text: t, by: c.byLabel || "" }; }) });
  // ---- kept between visits (a phone's tab is killed and reloaded, or you come back tomorrow): everything you have learned,
  // been told, read and confirmed, the narrator's own state, where each person now is, how long you've played. Plain JSON,
  // written after every turn (a few KB); the house's own state (doors, drawers, what you carry) is the world document's
  function snapshot() {
    return { v: 1, case: k.id, learned: [...frame.learned], holding: [...frame.holding], said: frame.said.slice(-40), yielded: [...frame.yielded], guarded: [...frame.guarded],
      notebook: { clues: notebook.clues, persons: [...notebook.persons], caught: notebook.caught, heard: notebook.heard }, papers: papersRead, turn, lastTopic, locked: [...locked], tries, leads: leadMemo,
      R: { ...R, t0: undefined, played: (R.solved ?? performance.now()) - R.t0 }, narrator: narrator?.state?.() ?? null,
      rooms: Object.fromEntries(arr(k.cast).map(c => [c.id, presenceOf(c.id)?.room]).filter(([, r]) => r)) };
  }
  let saveT = 0; function save() { if (!persist) return; clearTimeout(saveT); saveT = setTimeout(() => { try { persist(snapshot()); } catch (e) { console.warn("case save:", e.message); } }, 250); }
  if (saved?.case === k.id) {
    for (const id of arr(saved.learned)) frame.learned.add(id); for (const id of arr(saved.holding)) frame.holding.add(id); for (const id of arr(saved.yielded)) frame.yielded.add(id);
    frame.said.push(...arr(saved.said)); for (const [w, n] of arr(saved.guarded)) frame.guarded.set(w, n);
    notebook.clues.push(...arr(saved.notebook?.clues)); for (const [id, p] of arr(saved.notebook?.persons)) notebook.persons.set(id, p); notebook.caught.push(...arr(saved.notebook?.caught)); notebook.heard.push(...arr(saved.notebook?.heard));
    papersRead.push(...arr(saved.papers)); turn = saved.turn || 0; lastTopic = saved.lastTopic || null; for (const g of arr(saved.locked)) locked.add(g); tries = saved.tries || 0;
    Object.assign(R, saved.R || {}, { t0: performance.now() - (saved.R?.played || 0) }); if (saved.R?.solved != null) R.solved = performance.now();
    for (const [id, room] of Object.entries(saved.rooms || {})) presenceOf(id, room);
    leadMemo.raised.push(...arr(saved.leads?.raised)); leadMemo.closed.push(...arr(saved.leads?.closed));
  }
  // the leads: the case's own
  if (k.leads) useLeads(k.leads);
  const resumed = saved?.case === k.id ? { minutes: +((saved.R?.played || 0) / 60000).toFixed(0), clues: frame.learned.size } : null;
  return { resumed, snapshot, receipts, openPaper, look, wouldLook, afterAct, talkTo, reply, words, accuse, openAccusation, frame, notebook, notebookView, step, enter, idle, talking: () => talking, evidence, isClue: (b) => !!b?.story };
}
