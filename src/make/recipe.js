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
import { portOf, checkLinks, linkKeys, gateOpen } from "./links.js";
import { reachability } from "./reach.js";

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
  const rooms = [...ents.values()].filter(e => e.kind === "place").map(e => ({ id: e.id, exits: of(e.id, "exits")[0] ?? null, lit: of(e.id, "lit")[0] ?? null,
    outdoors: e.outdoors === true || of(e.id, "outdoors")[0] === true, names: e.names || [] }));
  if (!rooms.some(r => !r.outdoors)) say("places", "no room to build");
  const things = [...ents.values()].filter(e => e.kind !== "place" && e.kind !== "person").map(e => ({ id: e.id, kind: e.kind, in: of(e.id, "in")[0] ?? null, state: of(e.id, "state")[0] ?? null,
    controls: of(e.id, "controls"), link_type: of(e.id, "link_type")[0] ?? null, mode: of(e.id, "control_mode")[0] ?? of(e.id, "mode")[0] ?? null,   // (control_mode, RECIPE-VOCAB-V1; mode, the first drafts') fixture: of(e.id, "fixture")[0] === true || of(e.id, "fixture")[0] === "true",
    connects_to: of(e.id, "connects_to")[0] ?? null, code: of(e.id, "code")[0] ?? null, names: e.names || [] }));
  // (an absence means nothing unless something says so: a room must say it has no exits, or have its doors, RFC-002)
  for (const r of rooms) if (!r.outdoors && r.exits == null && !things.some(t => t.kind === "door" && t.connects_to && (t.in === r.id || t.connects_to === r.id))) say(r.id, "says nothing of its exits (exits: none, or its doors)");
  for (const t of things) if (t.kind === "door" && !rooms.some(r => r.id === t.connects_to)) say(t.id, `connects to ${t.connects_to}, which is no place the facts build`);
  // (what each person knows that the world doesn't tell everyone: the facts in their own frame, knows:<person>)
  const knowsOf = (id) => arr(doc?.facts).filter(f => f.frame === `knows:${id}`).map(f => ({ entity: f.entity, attribute: f.attribute, value: f.value }));
  const people = [...ents.values()].filter(e => e.kind === "person").map(e => ({ id: e.id, in: of(e.id, "in")[0] ?? null, posture: of(e.id, "posture")[0] ?? "standing", disposition: of(e.id, "disposition")[0] ?? null,
    knows: knowsOf(e.id), names: e.names || [] }));
  // (a thing may be in another (a page in a book on a table): its place is its host's, followed to a place)
  const placeOf = (id, n = 0) => { const q = things.find(t => t.id === id); return q && n < 8 ? placeOf(q.in, n + 1) : id; };
  for (const t of [...things, ...people]) { t.place = placeOf(t.in); if (!rooms.some(r => r.id === t.place)) say(t.id, `is in ${t.in}, which is no place the facts build`); }
  const links = things.flatMap(t => t.controls.map(to => ({ from: t.id, to, type: t.link_type, mode: t.mode })));
  for (const l of links) { if (!l.type) say(l.from, "controls something, and says no link type (link_type)"); if (l.mode && !["latching", "momentary"].includes(l.mode)) say(l.from, `mode ${l.mode}: latching or momentary`); }
  return { ok: !findings.length, findings, rooms, things, links, people };
}

// the kind for a thing, by what it carries: a switch gives power, a light takes it; the first kind of the catalogue's
// that does, in its order, and said in `chosen`
const WANT = { switch: (k) => affs(k).some(([, a]) => portOf(a)?.dir === "out" && portOf(a)?.signal === "power"),
  light: (k) => affs(k).some(([, a]) => portOf(a)?.dir === "in" && portOf(a)?.signal === "power"),
  keypad: (k) => affs(k).some(([, a]) => a.code != null && portOf(a)?.signal === "bolt"),
  // a door a link bolts takes a bolt (in:bolt); one nothing works, the house's own door
  bolted: (k) => k.kind.startsWith("door/") && affs(k).some(([, a]) => portOf(a)?.dir === "in" && portOf(a)?.signal === "bolt"),
  // a table: one that stands free in a room, with nothing to work (no drawer, no leaf): what is put on it lies on its top
  table: (k) => k.kind.startsWith("table/") && (k.traits || []).includes("free") && !affs(k).length,
  // a book: a thing you can carry that keeps what is in it under a cover (its slot inside, a hinge)
  book: (k) => k.kind.startsWith("book/") && slots(k).includes("inside") && affs(k).some(([, a]) => a.motion === "hinge"),
  // a page: a leaf, a thing you can carry thinner than a card
  page: (k) => k.kind.startsWith("paper/") && Array.isArray(k.size) && typeof k.size[1] === "number" && k.size[1] < 0.003 };
const slots = (k) => (k.parts || []).filter(p => p.part === "slot").map(p => p.name);
const affs = (k) => Object.entries(k.affordances || {});

export function planRecipe(doc, { kinds = [] } = {}) {
  const r = readFacts(doc); if (!r.ok) throw new Error("recipe refused: " + r.findings.map(f => `${f.at}: ${f.what}`).join("; "));
  const chosen = [], choose = (what, value, why) => { chosen.push({ what, value, why }); return value; };
  const room = r.rooms.find(q => !q.outdoors), out = r.rooms.find(q => q.outdoors), idOf = (p) => p.replace(/^place:/, "").replace(/[^a-z0-9_]/gi, "_");
  if (r.rooms.filter(q => !q.outdoors).length > 1) choose("where you begin", room.id, "the first room the facts name");
  const [W, D, H] = choose("the room's width, depth and height", [ROOM.W, ROOM.D, ROOM.H], "the facts give no size: a small room, a bedroom's");
  const id = room.id.replace(/^place:/, "").replace(/[^a-z0-9_]/gi, "_");
  const plan = { schema: "holo-emitter-plan/0.1", generated: { type: "recipe", recipe: doc.recipe }, units: "m", north: "+y",
    floors: [{ id: "ground", level: 0, storey_height_m: H }], rooms: [], openings: [], windows: [], fireplaces: [], stairs: [], wells: [], objects: [], required: [], chosen };
  plan.rooms.push({ id, floor: "ground", name: (room.names[0] || "the room").toUpperCase(), type: "enclosed", room_type: "recipe_room", archetype: "state", rect: { x0: 0, x1: W, y0: 0, y1: D } });
  const doors = r.things.filter(t => t.kind === "door" && t.in === room.id);
  if (room.exits === "none" && doors.length) throw new Error(`recipe refused: ${room.id} says it has no exits, and has a door`);
  choose("no window", "none", "the facts give the room no window, and a window would be a way out");
  if (!doors.length) choose("no door", "none", "the facts say exits: none");
  // a door: in the wall behind you as you arrive (chosen), its doorway a door's width, left of the wall's middle; what lies
  // beyond, the place it connects to, an open court; bolted if something controls it (its kind takes a bolt)
  const T = 0.75, doorAt = [];
  for (const d of doors) { const by = r.things.find(t => t.controls.includes(d.id)), x0 = +(W / 2 - 1.25).toFixed(3), x1 = +(x0 + 0.9).toFixed(3), oid = d.id.replace(/[^a-z0-9_]/gi, "_");
    const kind = by ? kinds.find(WANT.bolted)?.kind : "door/panelled"; if (!kind) throw new Error(`recipe refused: no door kind takes a bolt for ${d.id}`);
    const beyond = r.rooms.find(q => q.id === d.connects_to);
    const toId = d.connects_to.replace(/^place:/, "").replace(/[^a-z0-9_]/gi, "_");
    choose(`where the ${d.names[0] || "door"} is`, [x0, x1, "S"], "in the wall behind you as you arrive, left of its middle: the facts say only that it leads out");
    if (by) choose(`the ${d.names[0] || "door"}'s kind`, kind, `the first door kind whose lock takes a bolt (in:bolt): ${by.names[0] || by.id} works it`);
    // (a door the facts say is open stands open: its leaf's start)
    plan.openings.push({ id: oid, kind: "door", floor: "ground", axis: "NS", T, joins: [id, toId], height_m: 2.1, rect: { x0, x1, y0: -T, y1: 0 }, door: { kind, ...(d.state === "open" && !by ? { start: { leaf: "open" } } : {}) } });
    if (!beyond.outdoors && !plan.rooms.some(q => q.id === toId)) { plan.rooms.push({ id: toId, floor: "ground", name: (beyond.names[0] || "the next room").toUpperCase(), type: "enclosed", room_type: "recipe_room", archetype: "state", rect: { x0: 0, x1: W, y0: -T - D, y1: -T } });
      choose(`the ${beyond.names[0] || "next room"}`, [W, D, H], "beyond the door, a room the size of the first: the facts give it no size"); }
    if (out && out.id === d.connects_to && !plan.rooms.some(q => q.id === toId)) { plan.rooms.push({ id: toId, floor: "ground", name: (out.names[0] || "outside").toUpperCase(), type: "open", archetype: "open", room_type: "court",
        rect: { x0: -2, x1: W + 2, y0: -T - 6, y1: -T } }); choose(`what lies beyond the ${d.names[0] || "door"}`, "an open court", "the facts say the door leads outside, and nothing of it"); }
    doorAt.push({ id: d.id, opening: oid, x0, x1, by: by?.id || null }); }
  const recipe = { things: [], links: [], people: [], dark: room.lit === "dark" };
  if (recipe.dark) choose("dark at the start", true, "the facts say lit: dark");
  // the things: the switch on the wall you face as you arrive, a hand by the right of its middle, at a hand's height
  // (with no door there is no latch side to stand it by: chosen); the light hanging from the ceiling's middle
  // (of the kinds that would do, the first; a table, the smallest, for a small room)
  const area = (k) => (k.settings?.W ?? 9) * (k.settings?.D ?? 9);
  const kindFor = (t) => { if (t.kind === "door") return { kind: "door" }; const want = WANT[t.kind]; const k = want && (t.kind === "table" ? kinds.filter(want).sort((a, b) => area(a) - area(b))[0] : kinds.find(want)); if (!k) throw new Error(`recipe refused: no kind is a ${t.kind} (none carries what one carries)`); return k; };
  for (const t of r.things) { const k = kindFor(t);
    if (t.kind === "switch") recipe.things.push({ id: t.id, kind: choose(`the ${t.names[0] || "switch"}'s kind`, k.kind, "the first kind that gives power (out:power)"),
      at: choose(`where the ${t.names[0] || "switch"} is`, [W / 2 + 0.6, D], "on the wall you face as you arrive, a hand right of its middle; the facts say only that it is in the room"), face: "S" });
    else if (t.kind === "light") recipe.things.push({ id: t.id, kind: choose(`the ${t.names[0] || "light"}'s kind`, k.kind, "the first kind that takes power (in:power)"),
      at: choose(`where the ${t.names[0] || "light"} hangs`, [W / 2, D / 2], "from the middle of the ceiling: the facts say only that it lights the room"), hangs: true, start: t.state === "off" ? "out" : t.state === "on" ? "lit" : null });
    else if (t.kind === "keypad") { const d = doorAt.find(q => q.by === t.id);
      // (by the doorway, inside, a hand's width past its jamb; its code the facts', its knowledge named for it)
      recipe.things.push({ id: t.id, kind: choose(`the ${t.names[0] || "keypad"}'s kind`, k.kind, "the first kind that takes a code and gives a bolt"),
        at: choose(`where the ${t.names[0] || "keypad"} is`, [d ? d.x1 + 0.3 : W / 2, 0], "on the wall by the doorway, inside, a hand's width past the jamb"), face: "N",
        over: { code: String(t.code ?? "0000"), knows: `${t.id}.code` } }); }
    else if (t.kind === "door") continue;
    else { const host = r.things.find(q => q.id === t.in), mid = (p) => { const q = plan.rooms.find(x => x.id === idOf(p)).rect; return [(q.x0 + q.x1) / 2, (q.y0 + q.y1) / 2]; };
      const what = (t.names[0] || t.kind).replace(/^another /, "other ");
      if (host) recipe.things.push({ id: t.id, kind: choose(`the ${what}'s kind`, k.kind, `the first kind that is a ${t.kind} by what it carries`), room: idOf(t.place), in: host.id,
        slot: choose(`where in the ${host.names[0] || host.kind} the ${what} lies`, host.kind === "table" ? "top" : "inside", host.kind === "table" ? "on its top" : "inside it, under its cover") });
      else recipe.things.push({ id: t.id, kind: choose(`the ${what}'s kind`, k.kind, t.kind === "table" ? "the smallest table that stands free, with nothing to work" : `the first kind that is a ${t.kind} by what it carries`), room: idOf(t.place), at: choose(`where the ${what} stands`, mid(t.place), "in the middle of its room: the facts say only that it is there"), face: "S" }); } }
  // a room the facts don't call dark, with no light of its own, is lit as the house lights a room at dusk: a candle on its
  // table (chosen, and said; a story that wants it dark says so)
  for (const q of r.rooms.filter(x => !x.outdoors && x.lit !== "dark")) { const rid = idOf(q.id);
    if (r.things.some(t => t.place === q.id && t.kind === "light")) continue;
    const table = recipe.things.find(t => t.room === rid && !t.in && WANT.table(kinds.find(k => k.kind === t.kind) || { kind: "" }));
    if (table) recipe.things.push({ id: `obj:${rid}_candle`, kind: "candle/in-candlestick", room: rid, in: table.id, slot: "top", start: "lit", over: { still: true, glow: 2 },
      chosen: choose(`the ${(q.names[0] || rid)}'s light`, "a candle on its table", "the facts don't say it is dark, and give it no light") }); }
  recipe.links = r.links.map(l => ({ type: l.type, from: l.from, to: l.to, mode: l.mode, opening: doorAt.find(d => d.id === l.to)?.opening || null }));
  // the people: in the corner to your left as you arrive, on all fours if the facts say so (a stand-in body until Photonic's)
  // (what a person knows of a keypad's code is theirs to tell: told, it is known as that keypad's code)
  for (const p of r.people) recipe.people.push({ id: p.id, names: p.names, posture: p.posture, disposition: p.disposition,
    tells: p.knows.filter(f => f.attribute === "code").map(f => ({ knows: `${f.entity}.code`, code: String(f.value), of: f.entity })),
    at: choose(`where ${p.names[0] || p.id} is`, [0.9, D - 1.1], "in a corner away from the switch: the facts say only that they are in the room"), facing: "E" });
  // where you arrive: by the wall opposite the switch, facing it (the facts give no start: chosen)
  recipe.start = choose("where you arrive", { x: W / 2, y: 0.7, yaw: 0 }, "by the wall opposite the switch, facing it");
  plan.recipe = recipe; plan.entrance = id;
  return plan;
}

// the place's proof, from its plan alone (no build): every link sound by its kinds' ports, and every place reached by
// what the place gives. A door a keypad bolts opens only for its code; its code is known only once someone you can reach
// tells it (what they know is in their own frame); round by round until nothing more is reached. A code no one tells
// leaves the way out unreached, and the proof fails. -> { ok, links, reached, unreachable, known }
export function proveRecipe(plan, kindOf) {
  const R = plan.recipe, room = plan.entrance;
  const doorOf = new Map(plan.openings.filter(o => o.door).map(o => [o.id, o]));
  // the things as the proof sees them: the recipe's, and each door the house hangs in its doorway (by its opening)
  const things = R.things.map(t => ({ id: t.id, kind: kindOf(t.kind) || { kind: t.kind }, room, settings: { ...(kindOf(t.kind)?.settings || {}), ...(t.over || {}) } }));
  for (const l of R.links) if (l.opening && !things.some(t => t.id === l.to)) things.push({ id: l.to, kind: kindOf(doorOf.get(l.opening)?.door?.kind) || { kind: "door" }, room, opening: l.opening });
  const aff = (t, dir) => Object.entries(t?.kind.affordances || {}).find(([, a]) => portOf(a)?.dir === dir)?.[0];
  const links = R.links.map(l => ({ type: l.type, from: { thing: l.from, aff: aff(things.find(t => t.id === l.from), "out") }, to: { thing: l.to, aff: aff(things.find(t => t.id === l.to), "in") } }));
  const known = new Set(); let reach = null;
  for (let round = 0; round < 8; round++) {
    const lk = linkKeys(links, things, { doorOf: (t) => t.opening || null, canWork: (g) => gateOpen(g, [], known) });
    reach = reachability(plan, { start: room, doors: lk.doors, keys: lk.keys }); const reached = new Set(reach.reached), before = known.size;
    for (const p of R.people) if (reached.has(room)) for (const t of p.tells || []) known.add(t.knows);
    if (known.size === before) break; }
  const lc = checkLinks(links, things, { reached: reach.reached });
  const unreachable = reach.unreachable.map(u => u.room ?? u);
  return { ok: lc.ok && !unreachable.length, links: lc, reached: reach.reached, unreachable, known: [...known] };
}
