// What things are, made sound at creation (R79; Kabe, 2026-10-13: "object type characteristics, such as produces light that
// are categorical applied elements to certain types of objects automatically upon their creation … so that things like a
// candle that produces no light won't be created"). A characteristic is one record: what makes a kind have it (its own
// word, `is: [...]`, a property its parts declare (src/make/parts/contracts.js: a part that emits light means it gives light),
// or its family: every chair is a seat), what it needs the kind to carry, and how
// what is missing is filled. defineKind resolves a kind's characteristics once, before its checks: a need with a default is
// filled and the kind says so (`filled`: what, by which characteristic, why), so nobody has to guess where a value came
// from; a need nothing can fill, or a contradiction, refuses the kind with the reason. The resolved kind is what is pinned,
// with each characteristic's version, so a changed default makes a new pin and a world keeps the candles it was made with.
// Structure only: colour and strength are the look's, at build (design/references/traits/plan-r2.md, round two): a kind
// says which source each of its lights is (gives-light's `sources`), and the look what that source is like (lightOf).
// Whether the promise holds in play is proved at authoring for every kind that has it (checks.spec.mjs check 33), never
// at page load. Pure: no THREE.
import { contractOf } from "./parts/contracts.js";
const CHARS = new Map();

export function defineCharacteristic(c) {
  if (CHARS.has(c.name)) throw new Error(`characteristic ${c.name} defined twice`);
  if (!Number.isInteger(c.v)) throw new Error(`characteristic ${c.name}: v, its version, is an integer`);
  CHARS.set(c.name, { fromPart: null, families: [], implies: [], resolve: () => ({}), ...c });
  return c;
}
export const characteristics = () => [...CHARS.values()];
export const characteristicOf = (name) => CHARS.get(name) || null;

// resolve(k) -> { kind, has: [{ name, from }], filled: [{ what, by, why }] }; throws with the reason when a need can't be met
export function resolveCharacteristics(k) {
  const has = new Map(), filled = [], bad = (why) => { throw new Error(`kind ${k.kind || "?"}: ${why}`); };
  const add = (name, from) => { const c = CHARS.get(name); if (!c) bad(`no characteristic called ${name}`);
    if (has.has(name)) return; has.set(name, from); for (const n of c.implies) add(n, `${name}`); };
  for (const name of k.is || []) add(name, "its own word");
  // a part that says it is so (its contract's property: emits) brings the characteristic that reads it
  const said = (c, p) => !!(c.fromPart && contractOf(p.part)?.[c.fromPart]);
  for (const c of CHARS.values()) for (const p of k.parts || []) if (said(c, p)) add(c.name, `its part ${p.part}`);
  // a family brings its characteristics (every chair is a seat): what a kind is called says what it is
  const fam = (k.kind || "").split("/")[0]; for (const c of CHARS.values()) if (c.families.includes(fam)) add(c.name, `its family ${fam}`);
  let kind = { ...k };
  for (const [name] of has) { const c = CHARS.get(name);
    for (const other of c.conflicts || []) if (has.has(other)) bad(`it can't be both ${name} and ${other}`);
    const r = c.resolve(kind, { bad, parts: (kind.parts || []).filter(p => said(c, p)).map(p => ({ p, groups: contractOf(p.part)[c.fromPart](p) })) });
    if (r.kind) kind = r.kind; for (const f of r.filled || []) filled.push({ ...f, by: name }); }
  return { kind, has: [...has].map(([name, from]) => ({ name, v: CHARS.get(name).v, from })), filled };
}

// what each source of light is like where the look says nothing of it: its light's colour and strength (one source's
// worth: a part's light or glow is how many, a lantern's or a sconce's 3 or 2), and its flame's and halo's colours. A look
// says its own (look.lights[source]: a 1660 house's candles; a Blade Runner street's neon), and a source neither knows is
// refused. The values are the ones the parts had (2026-10-13), so no picture changed when the look took them over.
export const LIGHT_SOURCES = {
  candle: { color: 0xffb070, strength: 0.6, flame: 0xffd9a0, halo: 0xffc070 },
  rush: { color: 0xffb070, strength: 0.6, flame: 0xffd9a0, halo: 0xffc070 },          // (a rushlight, as a candle until measured)
  oil: { color: 0xffb070, strength: 0.6, flame: 0xffd9a0, halo: 0xffc070 },           // (an oil lamp's wick, the same)
  filament: { color: 0xffe2b0, strength: 3, flame: 0xfff0c8, halo: 0xfff0c8 },        // a carbon or tungsten filament, mains-steady
};
// a source as the look has it -> { color, strength, flame, halo, from }
export function lightOf(look, source) {
  const own = look?.lights?.[source], base = LIGHT_SOURCES[source];
  if (!own && !base) throw new Error(`no light source called ${source}, in the look ${look?.name || "?"} or by default`);
  return { ...base, ...own, from: own ? `the look ${look.name}` : `the default (the look ${look?.name || "?"} says nothing of ${source})` };
}

// ---- the characteristics

// gives light: a part that emits a light group (its contract: a candlestick's flame; a flame part's `group`) means the kind gives light,
// and each group's source (its part's word: a candle, a filament) is pinned with the kind (`sources`: { flame: "candle" }), so a
// group lit by two sources at once is refused.
// It needs a switch for each group it makes (an affordance whose `lights` names it): one missing is filled, lit from the
// start (a light set out is lit; a story or a place may start it out). A switch naming a group no part makes switches
// nothing, and is refused; so is a kind that says it gives light with no part that makes one: a candle that gives no light
// can't be made.
defineCharacteristic({
  name: "gives-light", v: 2,
  fromPart: "emits",
  resolve(k, { bad, parts }) {
    const groups = [...new Set(parts.flatMap(x => x.groups))];
    if (!groups.length) bad("it gives light, but no part makes a light (a flame, a candlestick)");
    const sources = {}; for (const { p, groups: gs } of parts) for (const g of gs) { const s = contractOf(p.part).source?.(p);
      if (!s) bad(`its part ${p.part} gives light and says nothing of its source`);
      if (sources[g] && sources[g] !== s) bad(`its light "${g}" is both ${sources[g]} and ${s}`); sources[g] = s; }
    const affs = { ...(k.affordances || {}) }, filled = [];
    for (const [name, a] of Object.entries(affs)) if (a.lights && !groups.includes(a.lights)) bad(`affordance ${name} lights "${a.lights}", which no part makes (it makes ${groups.join(", ")})`);
    for (const g of groups) if (!Object.values(affs).some(a => a.lights === g)) {
      const name = affs.light ? `light_${g}` : "light";
      affs[name] = { motion: "switch", lights: g, initial: "lit", hit: "body" };
      filled.push({ what: `affordance ${name}`, why: `a switch for its light "${g}", lit from the start` }); }
    return { kind: { ...k, affordances: affs, sources }, filled };
  },
});

// a seat (R80; Kabe, 2026-10-13: "clicking the chair should anchor me IN the chair at head height to see desk better"): every
// chair, stool, form, settle, bench and couch is one, by its family. It needs the part you sit on (`seat`: a part's id; a
// part called "seat" is taken as it, and said), and it faces its front (+z, as every kind is made); it gets an affordance
// `sit` (empty, sat): sitting in it is a fact of the world, which the page follows by putting your eye where a sitter's is
defineCharacteristic({
  name: "seat", v: 1,
  families: ["chair", "stool", "form", "settle", "bench", "couch"],
  resolve(k, { bad }) {
    const filled = []; let kind = k;
    if (!k.seat) { if (!(k.parts || []).some(p => p.id === "seat")) bad("it is a seat, but no part says where you sit (seat: a part's id)");
      kind = { ...kind, seat: "seat" }; filled.push({ what: "seat", why: "its part called seat is where you sit" }); }
    else if (!(k.parts || []).some(p => p.id === k.seat)) bad(`it is sat on its part ${k.seat}, which it hasn't`);
    if (!kind.affordances?.sit) { kind = { ...kind, affordances: { ...(kind.affordances || {}), sit: { motion: "state", states: ["empty", "sat"], hit: "body", verbs: [`sit in ${k.noun || "it"}`, "get up"] } } };
      filled.push({ what: "affordance sit", why: "a seat can be sat in" }); }
    return { kind, filled };
  },
});

