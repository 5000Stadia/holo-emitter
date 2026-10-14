// A recipe's place from its facts (the main demo, Kabe 2026-10-13: "There should be a main demo with all layers that
// should be tested across shapes … and new features across projects can be tested there"; design/one-world/
// coherence-recipes.md). pattern-buffer hands on a recipe's facts (patternbuffer.recipe-facts/1: entities and facts, each
// with its frame and the sentence it came from); this reads them, refuses what it can't build with the reason, and lays
// the place out by rule, no AI, listing every choice the facts leave open in `plan.chosen` with why (as story-hall does),
// so nothing chosen passes for something the story said. The golden lane loads the facts straight in; the story lane
// (pattern-buffer's build library on the story's text) must give the same facts.
//   readFacts(doc) -> { ok, findings, rooms, things, links, people }
//   planRecipe(doc, { kinds }) -> plan (holo-emitter-plan/0.1) with plan.recipe: the things, where each stands, the links
// Kinds are chosen by what they carry, never by name: a switch is a kind whose affordance gives power (out:power), a light
// one that takes it (in:power), a keypad one that gives a bolt from a code. Pure.
import { portOf } from "./links.js";

const arr = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);
// a recipe room, where the facts give no size (chosen: a small room, a bedroom's size, its ceiling an ordinary one's)
const ROOM = { W: 4.2, D: 5.0, H: 2.7 };

export function readFacts(doc) {
  const findings = [], say = (at, what) => findings.push({ at, what });
  if (doc?.schema !== "patternbuffer.recipe-facts/1") say("schema", `not patternbuffer.recipe-facts/1 (${doc?.schema})`);
  const ents = new Map(arr(doc?.entities).map(e => [e.id, e])), canon = arr(doc?.facts).filter(f => (f.frame || "canon") === "canon");
  const of = (id, attr) => canon.filter(f => f.entity === id && f.attribute === attr).map(f => f.value);
  for (const f of arr(doc?.facts)) { if (!ents.has(f.entity)) say(`fact ${f.entity}.${f.attribute}`, "names an entity the facts don't declare");
    if (f.value_type === "entity" && !ents.has(f.value)) say(`fact ${f.entity}.${f.attribute}`, `points at ${f.value}, which the facts don't declare`);
    if (!f.source) say(`fact ${f.entity}.${f.attribute}`, "has no source sentence"); }
  const rooms = [...ents.values()].filter(e => e.kind === "place").map(e => ({ id: e.id, exits: of(e.id, "exits")[0] ?? null, lit: of(e.id, "lit")[0] ?? null, names: e.names || [] }));
  if (!rooms.length) say("places", "no place to build");
  // (an absence means nothing unless something says so: a room with no exits must say exits: none, RFC-002)
  for (const r of rooms) if (r.exits == null) say(r.id, "says nothing of its exits (exits: none, or its doors)");
  const things = [...ents.values()].filter(e => e.kind !== "place" && e.kind !== "person").map(e => ({ id: e.id, kind: e.kind, in: of(e.id, "in")[0] ?? null, state: of(e.id, "state")[0] ?? null,
    controls: of(e.id, "controls"), link_type: of(e.id, "link_type")[0] ?? null, mode: of(e.id, "mode")[0] ?? null, fixture: of(e.id, "fixture")[0] === true || of(e.id, "fixture")[0] === "true", names: e.names || [] }));
  const people = [...ents.values()].filter(e => e.kind === "person").map(e => ({ id: e.id, in: of(e.id, "in")[0] ?? null, posture: of(e.id, "posture")[0] ?? "standing", disposition: of(e.id, "disposition")[0] ?? null, names: e.names || [] }));
  for (const t of [...things, ...people]) if (!rooms.some(r => r.id === t.in)) say(t.id, `is in ${t.in}, which is no place the facts build`);
  const links = things.flatMap(t => t.controls.map(to => ({ from: t.id, to, type: t.link_type, mode: t.mode })));
  for (const l of links) { if (!l.type) say(l.from, "controls something, and says no link type (link_type)"); if (l.mode && !["latching", "momentary"].includes(l.mode)) say(l.from, `mode ${l.mode}: latching or momentary`); }
  return { ok: !findings.length, findings, rooms, things, links, people };
}

// the kind for a thing, by what it carries: a switch gives power, a light takes it; the first kind of the catalogue's
// that does, in its order, and said in `chosen`
const WANT = { switch: (k) => affs(k).some(([, a]) => portOf(a)?.dir === "out" && portOf(a)?.signal === "power"),
  light: (k) => affs(k).some(([, a]) => portOf(a)?.dir === "in" && portOf(a)?.signal === "power"),
  keypad: (k) => affs(k).some(([, a]) => a.code != null && portOf(a)?.signal === "bolt") };
const affs = (k) => Object.entries(k.affordances || {});

export function planRecipe(doc, { kinds = [] } = {}) {
  const r = readFacts(doc); if (!r.ok) throw new Error("recipe refused: " + r.findings.map(f => `${f.at}: ${f.what}`).join("; "));
  const chosen = [], choose = (what, value, why) => { chosen.push({ what, value, why }); return value; };
  const room = r.rooms[0];
  const [W, D, H] = choose("the room's width, depth and height", [ROOM.W, ROOM.D, ROOM.H], "the facts give no size: a small room, a bedroom's");
  const id = room.id.replace(/^place:/, "").replace(/[^a-z0-9_]/gi, "_");
  const plan = { schema: "holo-emitter-plan/0.1", generated: { type: "recipe", recipe: doc.recipe }, units: "m", north: "+y",
    floors: [{ id: "ground", level: 0, storey_height_m: H }], rooms: [], openings: [], windows: [], fireplaces: [], stairs: [], wells: [], objects: [], required: [], chosen };
  plan.rooms.push({ id, floor: "ground", name: (room.names[0] || "the room").toUpperCase(), type: "enclosed", room_type: "recipe_room", archetype: "state", rect: { x0: 0, x1: W, y0: 0, y1: D } });
  if (room.exits !== "none") throw new Error(`recipe refused: ${room.id} has exits, and a recipe room's doors are not yet built from facts`);
  choose("no door, no window", "none", "the facts say exits: none; a room with no way out has no window either (it would be one)");
  const recipe = { things: [], links: [], people: [], dark: room.lit === "dark" };
  if (recipe.dark) choose("dark at the start", true, "the facts say lit: dark");
  // the things: the switch on the wall you face as you arrive, a hand by the right of its middle, at a hand's height
  // (with no door there is no latch side to stand it by: chosen); the light hanging from the ceiling's middle
  const kindFor = (t) => { const want = WANT[t.kind]; const k = want && kinds.find(want); if (!k) throw new Error(`recipe refused: no kind is a ${t.kind} (none carries what one carries)`); return k; };
  for (const t of r.things) { const k = kindFor(t);
    if (t.kind === "switch") recipe.things.push({ id: t.id, kind: choose(`the ${t.names[0] || "switch"}'s kind`, k.kind, "the first kind that gives power (out:power)"),
      at: choose(`where the ${t.names[0] || "switch"} is`, [W / 2 + 0.6, D], "on the wall you face as you arrive, a hand right of its middle; the facts say only that it is in the room"), face: "S" });
    else if (t.kind === "light") recipe.things.push({ id: t.id, kind: choose(`the ${t.names[0] || "light"}'s kind`, k.kind, "the first kind that takes power (in:power)"),
      at: choose(`where the ${t.names[0] || "light"} hangs`, [W / 2, D / 2], "from the middle of the ceiling: the facts say only that it lights the room"), hangs: true, start: t.state === "off" ? "out" : t.state === "on" ? "lit" : null });
    else recipe.things.push({ id: t.id, kind: k.kind, at: [W / 2, D / 2] }); }
  recipe.links = r.links.map(l => ({ type: l.type, from: l.from, to: l.to, mode: l.mode }));
  // the people: in the corner to your left as you arrive, on all fours if the facts say so (a stand-in body until Photonic's)
  for (const p of r.people) recipe.people.push({ id: p.id, names: p.names, posture: p.posture, disposition: p.disposition,
    at: choose(`where ${p.names[0] || p.id} is`, [0.9, D - 1.1], "in a corner away from the switch: the facts say only that they are in the room"), facing: "E" });
  // where you arrive: by the wall opposite the switch, facing it (the facts give no start: chosen)
  recipe.start = choose("where you arrive", { x: W / 2, y: 0.7, yaw: 0 }, "by the wall opposite the switch, facing it");
  plan.recipe = recipe; plan.entrance = id;
  return plan;
}
