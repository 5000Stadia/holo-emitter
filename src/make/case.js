// A case (M7, R56; design/case/family-read.md §5, after construct's cast/clue/pillar design and pattern-buffer's
// knowledge frames): a mystery as data, played with no model. Each character's knowledge is their own frame, so what
// they can say is only what is in it (a voice, if there is one, is handed facts from it and nothing else). Pure.
//   checkCase(kase, { plan, kinds }) -> { ok, findings }        every reference real: people, clues, things, rooms
//   fairPlay(kase, { plan, start }) -> { ok, path, learned, unreachable, pillars, ms }
//     from arrival, what can be reached by the house's own rules (src/make/reach.js: doors, locks, keys), taken,
//     read and asked, round and round until nothing new is learned; every pillar of the solution must be covered by
//     a genuine clue so reached, and no clue may sit only behind a door its own key is behind
import { reachability } from "./reach.js";

const arr = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);
export const cluesOf = (k) => [...arr(k.clues), ...arr(k.cast).flatMap(c => arr(c.clues).map(q => ({ ...q, from: c.id })))];

export function checkCase(k, { plan, kinds = null } = {}) {
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
  return { ok: !f.length, findings: f };
}

// the player's frame grows by the house's rules: rooms reached (doors open once their key is held), things in reached
// rooms taken or read (their clues learned), people present in reached rooms asked (their clues learned once the
// gate's needs are met); each round is a pure step, so the order the player takes doesn't change what can be reached
export function fairPlay(k, { plan, start = null, doors = k.doors || {} } = {}) {   // doors: { [openingId]: { locked, key } }, the case's own locks
  const t0 = performance.now(), clues = cluesOf(k), things = arr(k.things), learned = new Set(), held = new Set(), path = [];
  const thingRoom = (t) => { let at = t.at, n = 0; while (at && things.some(q => q.id === at) && n++ < 8) at = things.find(q => q.id === at).at; return at; };
  const open = (gate) => { const r = gate?.requires || {}; return arr(r.learned).every(l => learned.has(l)) && arr(r.holding).every(h => held.has(h)); };
  for (let round = 0, grew = true; grew && round < 64; round++) {
    grew = false;
    // where the player can go: the house's doors, a locked one open once its key (a thing the player holds) is held
    const keys = things.filter(t => held.has(t.id) && t.key).map(t => ({ name: t.key, room: start || plan.entrance }));
    const R = reachability(plan, { doors, keys, start: start || plan.entrance }), reached = new Set(R.reached || []);
    // things: take what can be carried, read or search what's in a reached room, if its own gate is open
    for (const t of things) { const room = thingRoom(t); if (!reached.has(room) || !open(t.gate)) continue;
      if (t.carry !== false && !held.has(t.id)) { held.add(t.id); path.push(`take ${t.id} (${room})`); grew = true; }
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
