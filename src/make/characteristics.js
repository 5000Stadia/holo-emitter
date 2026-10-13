// What things are, made sound at creation (R79; Kabe, 2026-10-13: "object type characteristics, such as produces light that
// are categorical applied elements to certain types of objects automatically upon their creation … so that things like a
// candle that produces no light won't be created"). A characteristic is one record: what makes a kind have it (its own
// word, `is: [...]`, or a part that implies it: a flame means it gives light), what it needs the kind to carry, and how
// what is missing is filled. defineKind resolves a kind's characteristics once, before its checks: a need with a default is
// filled and the kind says so (`filled`: what, by which characteristic, why), so nobody has to guess where a value came
// from; a need nothing can fill, or a contradiction, refuses the kind with the reason. The resolved kind is what is pinned,
// with each characteristic's version, so a changed default makes a new pin and a world keeps the candles it was made with.
// Structure only: colour and strength are the look's, at build (design/references/traits/plan-r2.md, round two).
// Whether the promise holds in play is proved at authoring for every kind that has it (checks.spec.mjs check 33), never
// at page load. Pure: no THREE.
const CHARS = new Map();

export function defineCharacteristic(c) {
  if (CHARS.has(c.name)) throw new Error(`characteristic ${c.name} defined twice`);
  if (!Number.isInteger(c.v)) throw new Error(`characteristic ${c.name}: v, its version, is an integer`);
  CHARS.set(c.name, { parts: {}, implies: [], resolve: () => ({}), ...c });
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
  for (const c of CHARS.values()) for (const p of k.parts || []) if (c.parts[p.part]) add(c.name, `its part ${p.part}`);
  let kind = { ...k };
  for (const [name] of has) { const c = CHARS.get(name);
    for (const other of c.conflicts || []) if (has.has(other)) bad(`it can't be both ${name} and ${other}`);
    const r = c.resolve(kind, { bad, parts: (kind.parts || []).filter(p => c.parts[p.part]).map(p => ({ p, groups: c.parts[p.part](p) })) });
    if (r.kind) kind = r.kind; for (const f of r.filled || []) filled.push({ ...f, by: name }); }
  return { kind, has: [...has].map(([name, from]) => ({ name, v: CHARS.get(name).v, from })), filled };
}

// ---- the characteristics

// gives light: a part that makes a light group (a candlestick's flame; a flame part's `group`) means the kind gives light.
// It needs a switch for each group it makes (an affordance whose `lights` names it): one missing is filled, lit from the
// start (a light set out is lit; a story or a place may start it out). A switch naming a group no part makes switches
// nothing, and is refused; so is a kind that says it gives light with no part that makes one: a candle that gives no light
// can't be made.
defineCharacteristic({
  name: "gives-light", v: 1,
  parts: { candlestick: () => ["flame"], flame: (p) => [p.group || "flame"] },
  resolve(k, { bad, parts }) {
    const groups = [...new Set(parts.flatMap(x => x.groups))];
    if (!groups.length) bad("it gives light, but no part makes a light (a flame, a candlestick)");
    const affs = { ...(k.affordances || {}) }, filled = [];
    for (const [name, a] of Object.entries(affs)) if (a.lights && !groups.includes(a.lights)) bad(`affordance ${name} lights "${a.lights}", which no part makes (it makes ${groups.join(", ")})`);
    for (const g of groups) if (!Object.values(affs).some(a => a.lights === g)) {
      const name = affs.light ? `light_${g}` : "light";
      affs[name] = { motion: "switch", lights: g, initial: "lit", hit: "body" };
      filled.push({ what: `affordance ${name}`, why: `a switch for its light "${g}", lit from the start` }); }
    return filled.length ? { kind: { ...k, affordances: affs }, filled } : {};
  },
});
