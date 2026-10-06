// The world document (design/production/plan.md §3), in pattern-buffer's shape: entities with opaque
// ids, and assertions about them, each [subject, attribute, value, provenance, as-of]. Nothing is
// resolved on write; a read takes the latest assertion for a subject and attribute (the projector's
// policy, named so it can be swapped). Generated things are not stored: a thing is a pure function
// of (world, birth address), and becomes an entity here only when it is committed: changed, taken,
// or named by the story. Where a thing is, is a relation (in, on, held_by, under) asserted like any
// other attribute, so moving it never touches its id, seed or provenance.
// A room is sealed the first time it is seen: its inputs (the context that reached it, the kinds'
// pins, the generator's version) are stored, not its items, so it comes back as it was seen even if
// the story later changes what would reach it.
// Pure: no THREE, no DOM, so node can check it.
import { hashOf, stable } from "./id.js";

export const GENERATOR = "make/1";
const RELATIONS = ["in", "on", "held_by", "under"];

export function makeWorld(doc = null, { now = () => new Date().toISOString() } = {}) {
  const w = doc || { schema: "holo-make/world/1", generator: GENERATOR, entities: {}, assertions: [], rooms: {} };
  const latest = new Map();                                       // "subject|attribute" -> value, folded from the assertions
  const fold = (a) => latest.set(`${a[0]}|${a[1]}`, a[2]);
  for (const a of w.assertions) fold(a);

  const api = {
    doc: w,
    // say something about an entity; who said it, and when
    assert(subject, attribute, value, provenance = "player") {
      const a = [subject, attribute, value, provenance, now()];
      w.assertions.push(a); fold(a);
      return a;
    },
    get: (subject, attribute) => latest.get(`${subject}|${attribute}`),
    // a generated thing becomes an entity: its id, the address it was born at, its kind and the pin of
    // the kind's version it was made with; from here on the world remembers it
    commit(b, why = "changed") {
      if (!w.entities[b.id]) w.entities[b.id] = { address: b.address, kind: b.kind.kind, pin: b.kind.pin, committed: why };
      return w.entities[b.id];
    },
    // where a thing is now: the latest of its relations
    whereIs(id) { for (let i = w.assertions.length - 1; i >= 0; i--) { const a = w.assertions[i]; if (a[0] === id && RELATIONS.includes(a[1])) return a[2] === null ? null : { rel: a[1], to: a[2] }; } return null; },
    move(id, rel, to, provenance = "player") {
      for (const r of RELATIONS) if (r !== rel && latest.get(`${id}|${r}`) != null) api.assert(id, r, null, provenance);
      return api.assert(id, rel, to, provenance);
    },
    // the inputs a room was first seen with, sealed; or, the first time, the ones given now
    seal(room, inputs) {
      if (!w.rooms[room]) w.rooms[room] = { sealed: now(), inputs: JSON.parse(stable(inputs)), hash: hashOf(inputs) };
      return w.rooms[room].inputs;
    },
    sealed: (room) => w.rooms[room]?.inputs || null,
    // works' overlay (src/make/works.js) kept here, as assertions about the things themselves: a
    // state is said of its thing ("door.leaf" = "open"), a variable of the world, a rule's firing of
    // the rules, what is carried as held_by relations. The store a page plays from is a fold of the
    // world, never a second truth. lookup(id) finds a built thing, so what is changed is committed.
    store() {
      const s = {}, held = [];
      for (const [k, v] of latest) {
        const bar = k.indexOf("|"), subject = k.slice(0, bar), attr = k.slice(bar + 1);
        if (subject === "@world") s[`$${attr}`] = v;
        else if (subject === "@rules") s[`!${attr}`] = v;
        else if (attr === "held_by") { if (v === "player") held.push(subject); }
        else if (RELATIONS.includes(attr)) continue;
        else if (attr[0] === "~") s[`${subject}${attr}`] = v;
        else s[`${subject}.${attr}`] = v;
      }
      if (held.length) s["@held"] = held;
      return s;
    },
    save(store, provenance = "player", lookup = () => null) {
      const before = api.store(), touch = (id) => { const b = lookup(id); if (b) api.commit(b); };
      for (const [k, v] of Object.entries(store)) {
        if (stable(before[k]) === stable(v)) continue;
        if (k[0] === "$") api.assert("@world", k.slice(1), v, provenance);
        else if (k[0] === "!") api.assert("@rules", k.slice(1), v, provenance);
        else if (k === "@held") {
          for (const id of v) if (!(before["@held"] || []).includes(id)) { touch(id); api.move(id, "held_by", "player", provenance); }
          for (const id of before["@held"] || []) if (!v.includes(id)) api.assert(id, "held_by", null, provenance);
        }
        else if (k.includes("~")) { const i = k.indexOf("~"); touch(k.slice(0, i)); api.assert(k.slice(0, i), k.slice(i), v, provenance); }
        else { const i = k.indexOf("."); touch(k.slice(0, i)); api.assert(k.slice(0, i), k.slice(i + 1), v, provenance); }
      }
    },
    size: () => JSON.stringify(w).length,
  };
  return api;
}
