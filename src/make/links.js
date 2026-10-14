// Links: one thing working another (R79, P4; Kabe, 2026-10-13: "a light switch that is in a different part of the room
// that the light it turns on", "relational object status changes based on other objects would include switch, unlocking a
// door … a keypad having the right code in it and then pressing enter unlocking another door … modularize the design of
// those relationships"). A link is a fact of the place, not a part of either thing: { type, from: { thing, aff },
// to: { thing, aff } | { door } }, a thing by its address or id, a door by its opening's id (the house's lock in it).
//
// Ports (codex's review, 2026-10-13, point 2: "make ports real"): an affordance says what it carries, `port: "out:power"`
// (a switch gives power) or `"in:power"` (a light takes it), in one of a closed family of signals. A link type says which
// signal leaves its near end and which its far end takes, so a lever can't be wired to a light nor a switch to a lock, and
// the faults read from the kinds, not from guesses about motions. A door end takes a bolt.
//   power: a switch's circuit to a light;  bolt: a lever (or a plate) to a lock;  press: a plate, pressed.
// Each type says how its effect lasts:
//   latching: the effect stays until changed again (a switch, a lever, a breaker): a one-way fact for the proof while it
//     holds, so reachability stays a fixpoint over what is open;
//   held: the effect lasts only while something keeps it (a pressure plate): it opens its target only for a weight that
//     stays (`weight`: a thing that can be carried, got to and set on the plate), never for the one player who must step off
//     it to pass (codex's point 3).
// A link compiles to works' rules (src/make/works.js), so the engine that plays it is the one that plays everything else.
// checkLinks is the graph half of the proof (the placement half, a switch by the door on its latch side, is the placer's,
// per room); linkReach and linkKeys put links into reach.js's reachability, and a case's fair-play proof runs them with its
// own rounds (src/make/case.js), so a place's links are proved where its doors and keys are. Puzzle chains over story beats
// are not links: construct composes and proves those (design/one-world/beats.md). Pure: plain data in.
export const SIGNALS = ["power", "bolt", "press"];
export const LINK_TYPES = {
  switch: { lasts: "latching", from: "power", to: "power" },   // a switch works a light: on is lit, off is out
  lever: { lasts: "latching", from: "bolt", to: "bolt" },      // a lever or a breaker draws a bolt (a door's, a hatch's)
  plate: { lasts: "held", from: "press", to: "bolt" },         // a plate pressed holds its bolt drawn only while pressed
  keypad: { lasts: "latching", from: "bolt", to: "bolt" },     // a keypad given its code draws its bolt (worked only by one who knows the code)
};
const DEFAULT_STATES = { slide: ["closed", "open"], hinge: ["closed", "open"], lever: ["rest", "pulled"], switch: ["out", "lit"], state: ["off", "on"] };
const statesOf = (a) => a.states || DEFAULT_STATES[a.motion];
// an affordance's port, read: { dir: "in"|"out", signal } or null; the catalogue refuses one malformed (catalogue.js)
export const portOf = (a) => { const m = /^(in|out):(\w+)$/.exec(a?.port || ""); return m ? { dir: m[1], signal: m[2] } : null; };
const refOf = (b) => b.address || b.id;

// the rules that play a link between two things: the far end follows the near one, both ways, every time (once: false).
// (a door end is played by the page's door, which reads the bolt as its lock: not a works rule here)
export function linkRules(links, thingOf) {
  return links.flatMap((l, n) => { if (!l.to.thing) return [];
    const f = thingOf(l.from.thing), t = thingOf(l.to.thing);
    const fs = statesOf(f.kind.affordances[l.from.aff]), ts = statesOf(t.kind.affordances[l.to.aff]);
    return [1, 0].map(on => ({ id: `link${n}:${on ? "on" : "off"}`, once: false, when: { thing: l.from.thing, aff: l.from.aff, is: fs[on] },
      then: { do: { thing: l.to.thing, aff: l.to.aff, to: ts[on] } } })); });
}

// the graph half of the proof. things: [{ id | address, kind, room }]; reached: the rooms the player can get to (from
// linkReach or reachability), or null to check the links alone; openings: the plan's opening ids, for door ends;
// movable(thing): whether it can be carried (by default, a kind not fixed). -> { ok, faults: [why] }
export function checkLinks(links, things, { reached = null, openings = null, movable = (b) => b.kind?.fixed === false || b.carry === true } = {}) {
  const faults = [], by = (ref) => things.find(b => b.address === ref || b.id === ref);
  const reach = reached && new Set(reached), doors = openings && new Set(openings);
  links.forEach((l, n) => { const T = LINK_TYPES[l.type], at = `link ${n} (${l.type})`;
    if (!T) { faults.push(`${at}: no link type called ${l.type} (${Object.keys(LINK_TYPES).join(", ")})`); return; }
    const f = by(l.from?.thing), t = l.to?.door ? null : by(l.to?.thing);
    if (!f) faults.push(`${at}: no thing ${l.from?.thing} to work it from`);
    if (l.to?.door) { if (T.to !== "bolt") faults.push(`${at}: a ${l.type} can't work a door's lock`); else if (doors && !doors.has(l.to.door)) faults.push(`${at}: no doorway ${l.to.door}`); }
    else if (!t) faults.push(`${at}: no thing ${l.to?.thing} for it to work`);
    if (!f || (!t && !l.to?.door)) return;
    const fp = portOf(f.kind.affordances?.[l.from.aff]), tp = t && portOf(t.kind.affordances?.[l.to.aff]);
    if (!(fp?.dir === "out" && fp.signal === T.from)) faults.push(`${at}: ${f.kind.kind}'s ${l.from.aff} gives no ${T.from} (a ${l.type} is worked from a ${T.from} out)`);
    if (t && !(tp?.dir === "in" && tp.signal === T.to)) faults.push(`${at}: ${t.kind.kind}'s ${l.to.aff} takes no ${T.to} (a ${l.type} works a ${T.to} in)`);
    if (t && f === t && l.from.aff === l.to.aff) faults.push(`${at}: works itself`);
    // a plate held by the player can't open the way they must go through: what holds it must be a thing that stays, that
    // can be carried to it, and that the player can get to
    if (T.lasts === "held") { const w = l.weight && l.weight !== "player" ? by(l.weight) : null;
      if (!l.weight || l.weight === "player") faults.push(`${at}: a plate holds its ${T.to} only while pressed, and only the player is named to stay on it (weight)`);
      else if (!w) faults.push(`${at}: its weight ${l.weight} is no thing of the place`);
      else { if (!movable(w)) faults.push(`${at}: its weight ${w.kind?.kind || refOf(w)} can't be carried to the plate`);
        if (reach && w.room && !reach.has(w.room)) faults.push(`${at}: its weight ${refOf(w)} is in ${w.room}, which the player can't get to`); } }
    if (reach && f.room && !reach.has(f.room)) faults.push(`${at}: ${f.kind.kind} in ${f.room}, which the player can't get to`);
  });
  // one link into each in port, counted by the thing it resolves to, not how it is spelt (an id and an address are one thing;
  // two-way switching is not yet a link type)
  const ends = new Map(); for (const l of links) { const t = !l.to?.door && by(l.to?.thing), k = l.to?.door ? `door ${l.to.door}` : `${t ? refOf(t) : l.to?.thing}.${l.to?.aff}`; ends.set(k, (ends.get(k) || 0) + 1); }
  for (const [k, c] of ends) if (c > 1) faults.push(`${k}: worked by ${c} links (two-way switching is not yet a link type)`);
  // a weight lies on one plate at a time: named for two, it holds only one of them (the player must leave it on the first)
  const weighs = new Map(); for (const l of links) if (LINK_TYPES[l.type]?.lasts === "held" && l.weight && l.weight !== "player") { const w = by(l.weight), k = w ? refOf(w) : l.weight; weighs.set(k, (weighs.get(k) || 0) + 1); }
  for (const [k, c] of weighs) if (c > 1) faults.push(`weight ${k}: named for ${c} plates, and it can lie on only one`);
  // a port nothing is wired to: a switch on the wall that drives nothing, a light no switch works (it can't be worked at all)
  for (const b of things) for (const [aff, a] of Object.entries(b.kind.affordances || {})) { const p = portOf(a); if (!p) continue;
    const wired = links.some(l => p.dir === "out" ? (l.from.thing === refOf(b) || l.from.thing === b.id) && l.from.aff === aff : (l.to.thing === refOf(b) || l.to.thing === b.id) && l.to.aff === aff);
    if (!wired) faults.push(p.dir === "out" ? `${b.kind.kind} at ${refOf(b)}: its ${aff} works nothing` : `${b.kind.kind} at ${refOf(b)}: its ${aff} takes ${p.signal} from nothing, so nothing can work it`); }
  return { ok: !faults.length, faults };
}

// links that open ways, for reach.js's reachability: a latching link whose far end is a door's lock (a lever that draws a
// bolt two rooms off) opens that door once the player has reached the lever's room, which is what a key lying there does,
// so it goes in as one: { doors, keys } to merge into reachability's. A held link (a plate) is a key in the plate's room
// only when weightOk(link) says its weight can be got onto it; never for the player alone. A far end is a door end, or a
// thing standing in a doorway (doorOf(thing) -> its opening id).
// A control is worked only if its own gate opens (codex's recheck, F4: a lever whose key lay behind the very door it draws
// had been granted): canWork(gate) answers a control's needs (gateOf below); by default only a control with none. A weight
// holds the first plate that names it, never a second (F5).
export function linkKeys(links, things, { doorOf = () => null, weightOk = () => false, canWork = (g) => g.free } = {}) {
  const by = (ref) => things.find(b => b.address === ref || b.id === ref), doors = {}, keys = [], laid = new Set();
  links.forEach((l, n) => { const T = LINK_TYPES[l.type], f = by(l.from.thing), o = l.to.door || (by(l.to.thing) && doorOf(by(l.to.thing)));
    if (!T || !f || !o) return;
    doors[o] = { locked: true, key: `link${n}` };
    const a = f.kind?.affordances?.[l.from.aff]; if (!a || !canWork(gateOf(a, f.settings), l, n)) return;   // (a control whose kind isn't known can't be worked)
    if (T.lasts === "held") { const w = by(l.weight), k = w ? refOf(w) : l.weight; if (!weightOk(l) || laid.has(k)) return; laid.add(k); }
    keys.push({ name: `link${n}`, room: f.room }); });
  return { doors, keys };
}
// a control's gate, as the proof can follow it: what must be held (any of each entry; all of holding_all), and what it
// can't follow (another affordance's state, an engine variable, a question to the world), which no proof grants
// (a code to key in, a keypad's, is knowledge the player must have: its `knows`, read through the thing's settings; play lets
// any digits be tried, the proof counts none but the known code). "@worked_by_…" is a link's own gate (the bulb, the bolted
// door): only the link works it, so it asks nothing of the player.
export function gateOf(a, settings = {}) {
  const any = [], all = [], knows = [], unsupported = [], val = (v) => typeof v === "string" && v[0] === "$" ? settings[v.slice(1)] : v;
  for (const [need, want] of Object.entries(a?.requires || {})) { if (need === "@holding") any.push([].concat(want)); else if (need === "@holding_all") all.push(...[].concat(want));
    else if (need === "@knows") knows.push(...[].concat(val(want))); else if (!need.startsWith("@worked_by")) unsupported.push(need); }
  if (a?.code != null) knows.push(val(a.knows));
  return { any, all, knows, unsupported, free: !any.length && !all.length && !knows.length && !unsupported.length };
}
// whether a held thing answers a name, as works.js's @holding does: its id, its story id, its kind, its family, family/*,
// or a name its fits setting gives it
export const answers = (t, name) => t.id === name || (t.story != null && t.story === name) || t.kind?.kind === name || !!t.kind?.kind?.startsWith(`${name}/`)
  || name === `${(t.kind?.kind || "").split("/")[0]}/*` || (t.fits != null && [].concat(t.fits).includes(name));
export const gateOpen = (g, held, known = new Set()) => !g.unsupported.length && g.any.every(names => names.some(n => held.some(t => answers(t, n)))) && g.all.every(n => held.some(t => answers(t, n)))
  && g.knows.every(n => n != null && known.has(n));

// a place's reach with its links, to a fixpoint: a plate's weight counts once its room and the plate's are both reached,
// which may take a lever's door first; a gated control (a lever under a padlock) is not granted here, where nothing is
// held: a case's proof, which follows what is held, grants it (src/make/case.js). reachability: reach.js's; base: its own { doors, keys, start, ... }.
// -> reachability's result, with the links' doors and keys in it
export function linkReach(reachability, plan, links, things, base = {}, { doorOf = () => null } = {}) {
  const by = (ref) => things.find(b => b.address === ref || b.id === ref); let reached = new Set(), R = null;
  for (let round = 0; round < 16; round++) {
    const lk = linkKeys(links, things, { doorOf, weightOk: (l) => { const w = by(l.weight), f = by(l.from.thing); return !!(w && f && reached.has(w.room) && reached.has(f.room)); } });
    R = reachability(plan, { ...base, doors: { ...(base.doors || {}), ...lk.doors }, keys: [...(base.keys || []), ...lk.keys] });
    const now = new Set(R.reached || []); if (now.size === reached.size) break; reached = now; }
  return R;
}
