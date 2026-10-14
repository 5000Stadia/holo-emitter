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
import { checkLinks, linkKeys, gateOf, gateOpen } from "./links.js";
import { takeable, value, settle } from "./catalogue.js";

// what the engine will let the player carry (works.js canTake): a kind not fixed, small and light enough
const carriable = (kind) => !!kind?.size && takeable(kind, value(kind.size, settle(kind, 1)));

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
  if (kindOf) { const T = arr(k.things).map(t => ({ id: t.id, kind: kindOf(t.kind) || { kind: t.kind }, carry: t.carry !== false && carriable(kindOf(t.kind)) }));
    for (const why of checkLinks(arr(k.links), T, { openings: plan ? (plan.openings || []).map(o => o.id) : null, movable: (t) => t.carry }).faults) say("links", why);
    const wanted = new Set([...clues.values()].flatMap(c => arr(c.gate?.requires?.holding)).concat(arr(k.things).flatMap(t => arr(t.gate?.requires?.holding))));
    arr(k.links).forEach((l, n) => { const c = T.find(t => t.id === l.from?.thing), g = gateOf(c?.kind?.affordances?.[l.from?.aff]);
      if (g.unsupported.length) say("links", `link ${n}: its control ${l.from.thing} asks ${g.unsupported.join(", ")}, which the case's proof can't follow`);
      const w = l.weight && things.get(l.weight); if (w && (w.key || wanted.has(w.id))) say("links", `link ${n}: its weight ${w.id} must lie on the plate, and is also wanted in hand`); }); }
  else if (arr(k.links).length) say("links", "links can't be checked without the catalogue (kindOf)");
  return { ok: !f.length, findings: f };
}

// the player's frame grows by the house's rules: rooms reached (doors open once their key is held), things in reached
// rooms taken or read (their clues learned), people present in reached rooms asked (their clues learned once the
// gate's needs are met); each round is a pure step, so the order the player takes doesn't change what can be reached
export function fairPlay(k, { plan, start = null, doors = k.doors || {}, kindOf = null } = {}) {   // doors: { [openingId]: { locked, key } }, the case's own locks; kindOf: the catalogue, for links and what can be carried
  const t0 = performance.now(), clues = cluesOf(k), things = arr(k.things), learned = new Set(), held = new Set(), path = [];
  const thingRoom = (t) => { let at = t.at, n = 0; while (at && things.some(q => q.id === at) && n++ < 8) at = things.find(q => q.id === at).at; return at; };
  const open = (gate) => { const r = gate?.requires || {}; return arr(r.learned).every(l => learned.has(l)) && arr(r.holding).every(h => held.has(h)); };
  for (let round = 0, grew = true; grew && round < 64; round++) {
    grew = false;
    // where the player can go: the house's doors, a locked one open once its key (a thing the player holds) is held
    const keys = things.filter(t => held.has(t.id) && t.key).map(t => ({ name: t.key, room: start || plan.entrance }));
    // its links: a lever's door a key in the lever's room; a plate's, in the plate's room once its weight is in hand
    const asThing = (t) => ({ id: t.id, room: thingRoom(t), kind: kindOf?.(t.kind) || null, fits: t.fits }), inHand = things.filter(t => held.has(t.id)).map(asThing);
    const lk = linkKeys(arr(k.links), things.map(asThing), { weightOk: (l) => held.has(l.weight), canWork: (g) => gateOpen(g, inHand) });
    const R = reachability(plan, { doors: { ...doors, ...lk.doors }, keys: [...keys, ...lk.keys], start: start || plan.entrance }), reached = new Set(R.reached || []);
    // things: take what can be carried, read or search what's in a reached room, if its own gate is open
    for (const t of things) { const room = thingRoom(t); if (!reached.has(room) || !open(t.gate)) continue;
      if (t.carry !== false && (!kindOf || carriable(kindOf(t.kind))) && !held.has(t.id)) { held.add(t.id); path.push(`take ${t.id} (${room})`); grew = true; }
      for (const c of arr(t.clue)) if (!learned.has(c)) { learned.add(c); path.push(`learn ${c} from ${t.id}`); grew = true; } }
    // people: ask whoever is present in a reached room, each clue whose gate is open
    for (const c of clues.filter(q => q.from)) { if (learned.has(c.id) || !open(c.gate)) continue;
      const who = arr(k.cast).find(p => p.id === c.from), rooms = [who?.home, ...arr(who?.presence).map(p => p.room)].filter(Boolean);
      if (!rooms.some(r => reached.has(r))) continue;
      learned.add(c.id); path.push(`learn ${c.id} from ${c.from}`); grew = true; }
  }
  const unreachable = clues.filter(c => !learned.has(c.id)).map(c => c.id);
  const pillars = arr(k.pillars).map(p => ({ id: p.id, covered: clues.some(c => learned.has(c.id) && arr(c.pillar).includes(p.id) && (c.effect || "genuine") === "genuine") }));
  const ok = pillars.every(p => p.covered || arr(k.pillars).find(q => q.id === p.id)?.required === false);
  return { ok, path, learned: [...learned], unreachable, pillars, ms: +(performance.now() - t0).toFixed(1) };
}
