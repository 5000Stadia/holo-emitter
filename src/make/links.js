// Links: one thing working another (R79, P4; Kabe, 2026-10-13: "a light switch that is in a different part of the room
// that the light it turns on", "relational object status changes based on other objects would include switch, unlocking a
// door … a keypad having the right code in it and then pressing enter unlocking another door … modularize the design of
// those relationships"). A link is a fact of the place, not a part of either thing: { type, from: { thing, aff },
// to: { thing, aff } }, a thing by its address or id. Its type, from a closed family, says what may stand at each end and
// how its effect lasts:
//   latching: the effect stays until changed again (a switch, a lever, a breaker): a one-way fact for the proof while it
//     holds, so reachability stays a fixpoint over what is open;
//   held: the effect lasts only while something keeps it (a pressure plate): it opens its target only for a weight that
//     stays, never for the one player who must step off it to pass.
// A link compiles to works' rules (src/make/works.js), so the engine that plays it is the one that plays everything else.
// check(...) is the graph half of the proof, at planning (the placement half, a switch by the door on its latch side, is
// the placer's, per room): every end exists and is the right sort, no control drives nothing, and with reach.js's
// reachability, every control a link needs is somewhere the player can get to. Puzzle chains over story beats are not
// links: construct composes and proves those (design/one-world/beats.md). Pure: plain data in.
export const LINK_TYPES = {
  // a switch (any two-state affordance) works a light (an affordance that lights a group): on is lit, off is out
  switch: { lasts: "latching", from: (a) => !!a && !a.lights, to: (a) => !!a?.lights, map: (on) => (on ? 1 : 0) },
  // a lever or breaker works anything two-state at the far end (a door's bolt, a circuit)
  lever: { lasts: "latching", from: (a) => !!a, to: (a) => !!a, map: (on) => (on ? 1 : 0) },
  // a plate pressed holds its target moved only while pressed
  plate: { lasts: "held", from: (a) => !!a, to: (a) => !!a, map: (on) => (on ? 1 : 0) },
};
const DEFAULT_STATES = { slide: ["closed", "open"], hinge: ["closed", "open"], lever: ["rest", "pulled"], switch: ["out", "lit"], state: ["off", "on"] };
const statesOf = (a) => a.states || DEFAULT_STATES[a.motion];

// the rules that play a link: the far end follows the near one, both ways, every time (once: false)
export function linkRules(links, thingOf) {
  return links.flatMap((l, n) => { const f = thingOf(l.from.thing), t = thingOf(l.to.thing);
    const fs = statesOf(f.kind.affordances[l.from.aff]), ts = statesOf(t.kind.affordances[l.to.aff]);
    return [1, 0].map(on => ({ id: `link${n}:${on ? "on" : "off"}`, once: false, when: { thing: l.from.thing, aff: l.from.aff, is: fs[on] },
      then: { do: { thing: l.to.thing, aff: l.to.aff, to: ts[LINK_TYPES[l.type].map(on)] } } })); });
}

// the graph half of the proof. things: [{ id, address, kind, room }]; reached: the rooms the player can get to
// (reach.js reachability(...).reached), or null to check the links alone. -> { ok, faults: [why] }
export function checkLinks(links, things, { reached = null } = {}) {
  const faults = [], by = (ref) => things.find(b => b.address === ref || b.id === ref);
  const reach = reached && new Set(reached);
  links.forEach((l, n) => { const T = LINK_TYPES[l.type], at = `link ${n} (${l.type})`;
    if (!T) { faults.push(`${at}: no link type called ${l.type} (${Object.keys(LINK_TYPES).join(", ")})`); return; }
    const f = by(l.from?.thing), t = by(l.to?.thing);
    if (!f) faults.push(`${at}: no thing ${l.from?.thing} to work it from`);
    if (!t) faults.push(`${at}: no thing ${l.to?.thing} for it to work`);
    if (!f || !t) return;
    const fa = f.kind.affordances?.[l.from.aff], ta = t.kind.affordances?.[l.to.aff];
    if (!T.from(fa)) faults.push(`${at}: ${f.kind.kind} has no ${l.from.aff} a ${l.type} can be worked by`);
    if (!T.to(ta)) faults.push(`${at}: ${t.kind.kind} has no ${l.to.aff} a ${l.type} can work`);
    if (f === t && l.from.aff === l.to.aff) faults.push(`${at}: works itself`);
    // a plate held by the player can't open the way they must go through: what holds it must be a thing that stays
    if (T.lasts === "held" && !l.weight) faults.push(`${at}: a plate holds ${t.kind.kind} only while pressed, and nothing is named to stay on it (weight)`);
    if (reach && f.room && !reach.has(f.room)) faults.push(`${at}: ${f.kind.kind} in ${f.room}, which the player can't get to`);
  });
  // a light some link works, with its own switch on its body too, would fight the wall's switch: one control per end
  const ends = new Map(); for (const l of links) { const k = `${l.to?.thing}.${l.to?.aff}`; ends.set(k, (ends.get(k) || 0) + 1); }
  for (const [k, c] of ends) if (c > 1) faults.push(`${k}: worked by ${c} links (two-way switching is not yet a link type)`);
  // a control nothing listens to: a switch kind on the wall with no link drives nothing
  for (const b of things) if (b.kind.controls) for (const aff of [].concat(b.kind.controls)) if (!links.some(l => (l.from.thing === b.address || l.from.thing === b.id) && l.from.aff === aff))
    faults.push(`${b.kind.kind} at ${b.address || b.id}: its ${aff} works nothing`);
  return { ok: !faults.length, faults };
}

// links that open ways, for reach.js's reachability: a latching link whose far end is a door's lock (a lever that draws a
// bolt two rooms off) opens that door once the player has reached the lever's room, which is what a key lying there does,
// so it goes in as one: { doors, keys } to merge into reachability's. A held link (a plate) opens it only with its weight
// on the plate: a key in the plate's room if the weight can be got to it, which the caller's first pass says (heldOk); never
// for the player alone. doorOf(thing) -> the plan opening a door thing stands in, or null.
export function linkKeys(links, things, { doorOf, heldOk = () => false } = {}) {
  const by = (ref) => things.find(b => b.address === ref || b.id === ref), doors = {}, keys = [];
  links.forEach((l, n) => { const T = LINK_TYPES[l.type], f = by(l.from.thing), t = by(l.to.thing), o = t && doorOf(t);
    if (!T || !f || !o) return;
    if (T.lasts === "held" && !heldOk(l)) { doors[o] = { locked: true, key: `link${n}` }; return; }
    doors[o] = { locked: true, key: `link${n}` }; keys.push({ name: `link${n}`, room: f.room }); });
  return { doors, keys };
}
