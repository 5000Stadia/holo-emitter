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
// Until pattern-buffer's module comes in, the page keeps these in an outbox (window.__outbox) the queue will take over.
// Pure: things in, facts out.
const id = (s) => String(s).replace(/[^a-z0-9_:./#-]/gi, "_");
export const entityOf = (b) => `obj:${id(b.story || b.address || b.id)}`;
const fact = (entity, attribute, value, valueType, at, source) => ({ entity, attribute, value, value_type: valueType, frame: "canon", valid_from: at, source: { by: "holo-emitter", ...source } });

// a thing built into its room: a door in its doorway, anything fixed on a wall (a switch, a keypad) or hung from the ceiling
// (a pendant light: it rests held)
export const isFixture = (b) => !!b.node?.userData?.opening || (b.kind.fixed === true && ([].concat(b.kind.traits || []).includes("wall") || b.kind.rests === "held"));

// placements at generation: things [{ b, room, host }], host the thing it is kept in (or none); stateOf(b, aff) its states
export function placementFacts(things, { at = 0, stateOf = null } = {}) {
  const out = [];
  for (const { b, room, host } of things) { const e = entityOf(b);
    if (isFixture(b)) out.push(fact(e, "fixture", true, "literal", at, { lane: "author", why: "built into its room" }));
    out.push(fact(e, "in", host ? entityOf(host) : `place:${id(room)}`, "entity", at, { lane: "author" }));
    for (const [aff, a] of Object.entries(b.kind.affordances || {})) if (!b.banks?.get?.(a.mover)) out.push(fact(e, aff, stateOf ? stateOf(b, aff) : null, "literal", at, { lane: "author" })); }
  return out;
}

// a play event (works' onChange, and where a thing was put): -> facts
export function eventFacts(ev, { at, room = null, on = null, state = null } = {}) {
  const e = entityOf(ev.b);
  if (ev.type === "take") return [fact(e, "held_by", "person:player", "entity", at, { lane: "record", event: "take" })];
  if (ev.type === "put") return [fact(e, "in", on ? entityOf(on) : `place:${id(room)}`, "entity", at, { lane: "record", event: "put" })];
  if (ev.type === "state") return [fact(e, ev.i == null ? ev.aff : `${ev.aff}#${ev.i}`, ev.state, "literal", at, { lane: "record", event: "state", was: ev.was })];
  return [];
}
