// A case (M7, R56; design/case/family-read.md §5, after construct's cast/clue/pillar design and pattern-buffer's
// knowledge frames): a mystery as data, played with no model. Each character's knowledge is their own frame, so what
// they can say is only what is in it (a voice, if there is one, is handed facts from it and nothing else). Pure.
//   checkCase(kase, { plan, kinds }) -> { ok, findings }        every reference real: people, clues, things, rooms
//   fairPlay(kase, { plan, start }) -> { ok, path, learned, unreachable, pillars, ms }
//     from arrival, what can be reached by the house's own rules (src/make/reach.js: doors, locks, keys), taken,
//     read and asked, round and round until nothing new is learned; every pillar of the solution must be covered by
//     a genuine clue so reached, and no clue may sit only behind a door its own key is behind
//   links (R79 S5, src/make/links.js): a case's things may work the house's doors, `links: [{ type, from: { thing, aff },
//     to: { door } , weight }]` (a lever in the steward's room drawing the muniment door's bolt; a plate held down by a
//     strongbox): checkCase holds each to its kinds' ports (given kindOf), and fairPlay opens a door once its lever's room
//     is reached, or its plate's, with its weight in hand. Both read the things' kinds (kindOf), as play does: a weight or
//     anything taken must be takeable by the engine's own rule, a control is worked only once its own gate opens (its key
//     held), and a gate the proof can't follow grants nothing (codex's recheck, F2-F5)
import { reachability } from "./reach.js";
import { checkLinks, linkKeys, gateOf, gateOpen, answers, openable, LINK_TYPES } from "./links.js";
import { takeable, value, settle } from "./catalogue.js";

// a case thing's own fields as the settings its kind reads: the lock a key fits, the keys a chest's padlocks need, how
// it starts (a drawer open, a candle two-thirds burnt), and any settings it names; play builds it with these
// (src/make/case-play.js), and the proof reads it with the same, so the two can't answer differently
export const caseSettings = (t) => ({ ...(t.settings || {}), ...(t.key ? { fits: t.key } : {}), ...(t.locks_need ? { keys: t.locks_need } : {}), ...(t.state ? { start: t.state } : {}) });
// the settings a kind's size reads ("$w", or a name in "=0.2+2*u"), and those they read in turn
function sizeReads(kind) {
  const names = Object.keys(kind.settings || {}), out = new Set(), scan = (v) => { if (typeof v === "string") { for (const n of names) if (!out.has(n) && new RegExp(`(^\\$|[^\\w])${n}(?!\\w)`).test(v)) { out.add(n); scan(kind.settings[n]); } }
    else if (Array.isArray(v)) v.forEach(scan); };
  scan(kind.size); return [...out];
}
// the size settings a case leaves to the seed: those its size reads, ranged or chosen, that the case doesn't pin
const sizeFree = (kind, t) => { const over = caseSettings(t); return sizeReads(kind).filter(n => over[n] === undefined && (Array.isArray(kind.settings[n]) || kind.settings[n]?.one_of)); };
// what the engine will let the player carry (works.js canTake), for this thing however it is born: its kind's size under
// its own case settings. If that size reads a setting the case leaves to the seed, the proof can't answer: a range's ends
// bound nothing ("=0.2+2*u*(1-u)" is widest in its middle), and where it is born isn't the case's to say (the placer
// builds what a case requires, even a thing kept in another, at its own address; only failing that is it built at
// case/<id>; codex's rechecks, F3). So it is not certified until the case pins the setting.
function carriable(kind, t = {}) {
  if (!kind?.size || sizeFree(kind, t).length) return false;
  return takeable(kind, value(kind.size, settle(kind, 1, caseSettings(t))));
}

const arr = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);
export const cluesOf = (k) => [...arr(k.clues), ...arr(k.cast).flatMap(c => arr(c.clues).map(q => ({ ...q, from: c.id })))];

export function checkCase(k, { plan, kinds = null, kindOf = null } = {}) {
  const f = [], say = (at, what) => f.push({ at, what });
  const people = new Set(arr(k.cast).map(c => c.id)), clues = new Map(cluesOf(k).map(c => [c.id, c])), things = new Map(arr(k.things).map(t => [t.id, t]));
  const rooms = new Set((plan?.rooms || []).map(r => r.id)), pillars = new Set(arr(k.pillars).map(p => p.id));
  if (!arr(k.cast).some(c => c.is_culprit)) say("cast", "no culprit");
  if (arr(k.cast).filter(c => c.is_culprit).length > 1) say("cast", "more than one culprit");
  for (const c of arr(k.cast)) { if (plan && c.home && !rooms.has(c.home)) say(`cast.${c.id}`, `home "${c.home}" is not a room of the house`);
    for (const p of arr(c.presence)) if (plan && p.room && !rooms.has(p.room)) say(`cast.${c.id}`, `present in "${p.room}", not a room`); }
  for (const t of arr(k.things)) { if (plan && t.at && !rooms.has(t.at) && !things.has(t.at)) say(`things.${t.id}`, `at "${t.at}": no such room or thing`);
    if (kinds && t.kind && !kinds.has(t.kind)) say(`things.${t.id}`, `kind "${t.kind}" is not in the catalogue`);
    for (const c of arr(t.clue)) if (!clues.has(c)) say(`things.${t.id}`, `carries clue "${c}", which no one declares`); }
  for (const [id, c] of clues) { for (const p of arr(c.pillar)) if (!pillars.has(p)) say(`clues.${id}`, `covers pillar "${p}", not declared`);
    const req = c.gate?.requires || {}; for (const l of arr(req.learned)) if (!clues.has(l)) say(`clues.${id}`, `needs clue "${l}", which doesn't exist`);
    for (const h of arr(req.holding)) if (!things.has(h)) say(`clues.${id}`, `needs to hold "${h}", which isn't a thing`);
    for (const d of arr(c.debunked_by)) if (!clues.has(d)) say(`clues.${id}`, `debunked by "${d}", which doesn't exist`); }
  for (const p of arr(k.pillars)) if (p.required !== false && ![...clues.values()].some(c => arr(c.pillar).includes(p.id) && (c.effect || "genuine") === "genuine")) say(`pillars.${p.id}`, "no genuine clue covers it");
  // its links, against its things' kinds: every port its things carry is wired (even with no links at all), a weight is one
  // the engine lets you carry (and the case doesn't say carry: false), a control's gate is one the proof can follow, and a
  // weight left on a plate is not also wanted in hand (a key, or a thing a gate asks to be held)
  if (kindOf) { const T = arr(k.things).map(t => ({ id: t.id, kind: kindOf(t.kind) || { kind: t.kind }, carry: t.carry !== false && carriable(kindOf(t.kind), t), fits: caseSettings(t).fits }));
    for (const why of checkLinks(arr(k.links), T, { openings: plan ? (plan.openings || []).map(o => o.id) : null, movable: (t) => t.carry }).faults) say("links", why);
    const wanted = new Set([...clues.values()].flatMap(c => arr(c.gate?.requires?.holding)).concat(arr(k.things).flatMap(t => arr(t.gate?.requires?.holding))));
    arr(k.links).forEach((l, n) => { const c = T.find(t => t.id === l.from?.thing), ct = things.get(l.from?.thing), g = gateOf(c?.kind?.affordances?.[l.from?.aff], c?.kind?.settings ? settle(c.kind, 1, caseSettings(ct)) : {});
      { const a = c?.kind?.affordances?.[l.from?.aff], st = c?.kind?.settings ? settle(c.kind, 1, caseSettings(ct)) : {}, code = a?.code != null && (typeof a.code === "string" && a.code[0] === "$" ? st[a.code.slice(1)] : a.code);
        if (a?.code != null && !/^\d{1,12}$/.test(String(code))) say("links", `link ${n}: its control ${l.from.thing}'s code ${JSON.stringify(code)} is not digits its keys can key in`); }
      if (g.unsupported.length) say("links", `link ${n}: its control ${l.from.thing} asks ${g.unsupported.join(", ")}, which the case's proof can't follow`);
      // (a code someone must know: something in the case tells it, a person's clue or a thing that shows it)
      const tellers = new Set([...[...clues.values()].flatMap(c => arr(c.knows)), ...arr(k.things).flatMap(t => arr(t.knows))]);
      for (const name of g.knows) if (!tellers.has(name)) say("links", `link ${n}: its control ${l.from.thing} needs the code "${name}", which no one and nothing in the case tells`);
      // (wanted in hand: a key, a thing a clue's or a thing's gate asks to hold, or a name any thing's affordance or taking
      // asks @holding that it answers: one box can't both lie on the hall's plate and be held to work the study's lever)
      { const wt = l.weight && things.get(l.weight), wk = wt && kindOf(wt.kind), free = wk ? sizeFree(wk, wt) : [];
        if (free.length) say("links", `link ${n}: its weight ${wt.id} is sized by ${free.join(", ")}, which the case leaves to its birth: pin ${free.length > 1 ? "them" : "it"} (settings) to certify it carriable`); }
      const w = l.weight && T.find(t => t.id === l.weight), asked = (kd) => [...Object.values(kd?.affordances || {}).map(a => a.requires), kd?.take?.requires]
        .flatMap(r => [...arr(r?.["@holding"]), ...arr(r?.["@holding_all"])]);
      if (w && (things.get(w.id).key || wanted.has(w.id) || T.some(t => asked(t.kind).some(name => answers(w, name)))))
        say("links", `link ${n}: its weight ${w.id} must lie on the plate, and is also wanted in hand`); }); }
  else if (arr(k.links).length) say("links", "links can't be checked without the catalogue (kindOf)");
  return { ok: !f.length, findings: f };
}

// the player's frame grows by the house's rules: rooms reached (doors open once their key is held), things in reached
// rooms taken or read (their clues learned), people present in reached rooms asked (their clues learned once the
// gate's needs are met); each round is a pure step, so the order the player takes doesn't change what can be reached
export function fairPlay(k, { plan, start = null, doors = k.doors || {}, kindOf = null } = {}) {   // doors: { [openingId]: { locked, key } }, the case's own locks; kindOf: the catalogue, for links and what can be carried
  const t0 = performance.now(), clues = cluesOf(k), things = arr(k.things), learned = new Set(), held = new Set(), path = [];
  const thingRoom = (t) => { let at = t.at, n = 0; while (at && things.some(q => q.id === at) && n++ < 8) at = things.find(q => q.id === at).at; return at; };
  const laid = new Set(), worked = new Set(), reachedBefore = new Set(), known = new Set();   // weights left on plates; latching links worked; rooms reached so far; what the player knows (a code)
  const open = (gate) => { const r = gate?.requires || {}; return arr(r.learned).every(l => learned.has(l)) && arr(r.holding).every(h => held.has(h) && !laid.has(h)); };
  for (let round = 0, grew = true; grew && round < 64; round++) {
    grew = false;
    // where the player can go: the house's doors, a locked one open once its key (a thing the player holds) is held
    const keys = things.filter(t => held.has(t.id) && !laid.has(t.id) && t.key).map(t => ({ name: t.key, room: start || plan.entrance }));
    // its links: a lever's door a key in the lever's room; a plate's, in the plate's room once its weight is in hand
    // a weight laid on a plate whose room is reached is out of your hands (F5): no gate counts it held. A latching control
    // once worked stays worked (a lever pulled while you held its key stays pulled after the key goes on a plate)
    const asThing = (t) => { const kd = kindOf?.(t.kind) || null; return { id: t.id, room: thingRoom(t), kind: kd, fits: caseSettings(t).fits, settings: kd ? settle(kd, 1, caseSettings(t)) : caseSettings(t) }; };
    for (const l of arr(k.links)) if (LINK_TYPES[l.type]?.lasts === "held" && held.has(l.weight) && reachedBefore.has(thingRoom(things.find(t => t.id === l.from?.thing) || {}))) laid.add(l.weight);
    const inHand = things.filter(t => held.has(t.id) && !laid.has(t.id)).map(asThing);
    const lk = linkKeys(arr(k.links), things.map(asThing), { weightOk: (l) => laid.has(l.weight),
      canWork: (g, l, n) => worked.has(n) || (gateOpen(g, inHand, known) && (LINK_TYPES[l.type]?.lasts !== "latching" || worked.add(n))) });
    const R = reachability(plan, { doors: { ...doors, ...lk.doors }, keys: [...keys, ...lk.keys], start: start || plan.entrance }), reached = new Set(R.reached || []);
    for (const r of reached) if (!reachedBefore.has(r)) { reachedBefore.add(r); grew = true; }
    // things: take what can be carried, read or search what's in a reached room, if its own gate is open, and if every
    // thing it is kept in can be opened by what is in hand and known (codex's keypad review, K2: a code note in a box locked
    // with a key beyond the keypad's door had been read from outside the box): each of a keeper's movable parts (its lid,
    // its drawers) must stand open or be openable, as play opens them (src/make/links.js openable); with no catalogue, as before
    const within = (t) => { for (let at = t.at, n = 0; at && n < 8; n++) { const c = things.find(q => q.id === at); if (!c) return true;
        const kd = kindOf?.(c.kind); if (kd) { const st = settle(kd, 1, caseSettings(c));
          for (const [name, a] of Object.entries(kd.affordances || {})) if (a.mover && (a.motion === "hinge" || a.motion === "slide") && !openable(kd, name, st, inHand, known)) return false; }
        at = c.at; } return true; };
    for (const t of things) { const room = thingRoom(t); if (!reached.has(room) || !open(t.gate) || (kindOf && !within(t))) continue;
      if (t.carry !== false && (!kindOf || carriable(kindOf(t.kind), t)) && !held.has(t.id)) { held.add(t.id); path.push(`take ${t.id} (${room})`); grew = true; }
      for (const c of arr(t.clue)) if (!learned.has(c)) { learned.add(c); path.push(`learn ${c} from ${t.id}`); grew = true; }
      // (a thing that shows a code, a note in a drawer with its digits, tells it to whoever reaches it)
      for (const n of arr(t.knows)) if (!known.has(n)) { known.add(n); path.push(`know ${n} from ${t.id}`); grew = true; } }
    // people: ask whoever is present in a reached room, each clue whose gate is open
    for (const c of clues.filter(q => q.from)) { if (learned.has(c.id) || !open(c.gate)) continue;
      const who = arr(k.cast).find(p => p.id === c.from), rooms = [who?.home, ...arr(who?.presence).map(p => p.room)].filter(Boolean);
      if (!rooms.some(r => reached.has(r))) continue;
      learned.add(c.id); path.push(`learn ${c.id} from ${c.from}`); grew = true;
      for (const n of arr(c.knows)) if (!known.has(n)) { known.add(n); path.push(`know ${n} from ${c.from}`); } }
    // (a clue a thing gives, if it carries knowledge, tells it too)
    for (const c of clues) if (learned.has(c.id)) for (const n of arr(c.knows)) if (!known.has(n)) { known.add(n); path.push(`know ${n} (${c.id})`); grew = true; }
  }
  const unreachable = clues.filter(c => !learned.has(c.id)).map(c => c.id);
  const pillars = arr(k.pillars).map(p => ({ id: p.id, covered: clues.some(c => learned.has(c.id) && arr(c.pillar).includes(p.id) && (c.effect || "genuine") === "genuine") }));
  const ok = pillars.every(p => p.covered || arr(k.pillars).find(q => q.id === p.id)?.required === false);
  return { ok, path, learned: [...learned], unreachable, pillars, ms: +(performance.now() - t0).toFixed(1) };
}
