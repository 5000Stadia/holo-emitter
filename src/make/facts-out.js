// What the world is and what changes in it, as pattern-buffer's facts (R75; Kabe, 2026-10-13: "We also need to consider the
// placement of our items and locations in pattern buffer on placement and status changes in pattern buffer as well. When an
// item is taken for example"; design/one-world/recipes/take-and-drop.md). Two lanes, as pattern-buffer asks (m8be241):
//   placements, at generation: the world's truth, for an AUTHOR session (AUTHOR-RECORD-V1, frame canon, never the player's
//     view): each thing `in` its room or what keeps it; a thing built into the room (a door in its doorway, a switch or a
//     keypad on its wall) first marked `fixture · true`, so its place is permanent and it can never be carried off;
//   play events, as they happen: for the view module's queue to `record` (canon and the player's frame, observed): taken
//     `held_by · person:player` (pattern-buffer, m342c1a: what its library writes from text, classed as state with no model
//     call; its grader folds the containment family, so construct's `in · person:player` still matches), put down `in · place:<room>` or `in · obj:<what it is on>`, and
//     each affordance's state under its own name (`obj:door · leaf · open`, `obj:light · light · lit`).
// A thing's settings in pattern-buffer's words (RECIPE-VOCAB-V1, proposed to it in mfb985e): its main setting is `state`
// (a door's or a lid's leaf open or shut, a light or a switch on or off), a lock is `locked` (true or false), a drawer of a
// bank its own part (`obj:<thing>#drawer3`); a seat is the sitter's `sits_on`, a keypad's accepted code its door's
// `locked`; any other setting keeps its own name and its own words.
// Until pattern-buffer's module comes in, the page keeps these in an outbox (window.__outbox) the queue will take over.
// Pure: things in, facts out.
// ids in pattern-buffer's grammar, [a-z][a-z0-9_]*:[a-z0-9_:]+ (m7d24d9): a story id that already names its class (obj:switch,
// person:dog) as it is; anything else, a story id or a build address (manor/room/obj_door), an obj: with every other mark an _
const id = (s) => String(s).toLowerCase().replace(/[^a-z0-9_]/g, "_");
export const entityOf = (b) => { const s = b.story != null ? String(b.story).toLowerCase() : null;
  return s && /^[a-z][a-z0-9_]*:[a-z0-9_:]+$/.test(s) ? s : `obj:${id(s ?? b.address ?? b.id)}`; };
const fact = (entity, attribute, value, valueType, at, source) => ({ entity, attribute, value, value_type: valueType, frame: "canon", valid_from: at, source: { by: "holo-emitter", ...source } });

// a thing built into its room: a door in its doorway, anything fixed on a wall (a switch, a keypad) or hung from the ceiling
// (a pendant light: it rests held). A locked door is also shut (state · shut): RFC-003's routes read a portal's state.
export const isFixture = (b) => !!b.node?.userData?.opening || (b.kind.fixed === true && ([].concat(b.kind.traits || []).includes("wall") || b.kind.rests === "held"));

const WORD = { closed: "shut", open: "open", lit: "on", out: "off", on: "on", off: "off" };
function settingFacts(e, b, aff, i, state, mk) {
  // (a drawer of a bank, its own part: obj:press:drawers_3, part_of obj:press)
  const a = b.kind.affordances?.[aff] || {}, ent = i == null ? e : `${e}:${id(aff)}_${i}`;
  if (i != null) return [mk(ent, "part_of", e, "entity"), ...settingFacts(ent, { kind: { affordances: { [aff]: a } } }, aff, null, state, mk)];
  if (aff === "lock" || (a.states || []).includes("locked") && a.port !== "out:bolt" && a.code == null && aff !== "entry") return [mk(ent, "locked", state === "locked", "literal")];
  if (a.code != null) return [];                                          // (the keypad: its door's locked says it)
  if (aff === "sit") return state === "sat" ? [mk("person:player", "sits_on", e, "entity")] : [mk("person:player", "sits_on", null, "entity")];
  if (a.lights || a.motion === "switch" || a.motion === "hinge" || a.motion === "slide") return [mk(ent, "state", WORD[state] ?? state, "literal")];
  return [mk(ent, aff, state, "literal")];
}

// Placements at generation: things [{ b, room, host }], and people at rest with the garments they wear, never motion.
export function placementFacts(things, { at = 0, stateOf = null, people = [] } = {}) {
  const out = [];
  for (const { b, room, host } of things) { const e = entityOf(b);
    if (isFixture(b)) out.push(fact(e, "fixture", true, "literal", at, { lane: "author", why: "built into its room" }));
    out.push(fact(e, "in", host ? entityOf(host) : `place:${id(room)}`, "entity", at, { lane: "author" }));
    for (const [aff, a] of Object.entries(b.kind.affordances || {})) if (!b.banks?.get?.(a.mover) && aff !== "sit" && stateOf)
      out.push(...settingFacts(e, b, aff, null, stateOf(b, aff), (en, at2, v, t) => fact(en, at2, v, t, at, { lane: "author" }))); }
  for (const p of people) { const e = entityOf({ story: p.id }), mk = (en, a, v, t = "literal") => fact(en, a, v, t, at, { lane: "author" });
    out.push(mk(e, "in", `place:${id(p.room)}`, "entity"), mk(e, "posture", p.posture), mk(e, "facing", p.facing), mk(e, "rest_pos", p.pos.slice()));
    for (const g of p.wears || []) { const en = entityOf({ story: g.id }); out.push(mk(en, "worn_by", e, "entity"));
      for (const [a, v] of Object.entries(g.aspects || {})) out.push(mk(en, a, v)); } }
  return out;
}

// a play event (works' onChange, and where a thing was put): -> facts
export function eventFacts(ev, { at, room = null, on = null, state = null } = {}) {
  const e = entityOf(ev.b);
  if (ev.type === "take") return [fact(e, "held_by", "person:player", "entity", at, { lane: "record", event: "take" })];
  if (ev.type === "put") return [fact(e, "in", on ? entityOf(on) : `place:${id(room)}`, "entity", at, { lane: "record", event: "put" })];
  if (ev.type === "state") return settingFacts(e, ev.b, ev.aff, ev.i, ev.state, (en, a, v, t) => fact(en, a, v, t, at, { lane: "record", event: "state", was: ev.was }));
  return [];
}
