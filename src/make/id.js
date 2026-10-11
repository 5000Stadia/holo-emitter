// Identity, born once (design/production/plan.md §3). A thing's id and seed come from its birth
// address, the path of what made it: "manor/muniment_room/press:A/drawer:3.2", "story:alice/ch1/bottle".
// Where it is now is a relation, never part of its id, so moving it changes nothing here.
// Integer arithmetic only (Math.imul, shifts, a division by 2^32): every browser agrees to the bit.
// Pure: no THREE, no DOM, so node can check it.

// FNV-1a over UTF-16 code units
export function fnv(str, basis = 0x811c9dc5) {
  let h = basis >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}
export const seedOf = (address) => fnv(address);
// 64 bits from two independent bases, as 14 base-36 characters: opaque, stable, collision-safe at world scale
export const idOf = (address) => fnv(address).toString(36).padStart(7, "0") + fnv(address, 0x9747b28c).toString(36).padStart(7, "0");
export const at = (parent, part) => parent ? `${parent}/${part}` : String(part);

// a seeded stream of numbers in [0, 1): each an integer over 2^32, exact in every engine
export function rng(seed) {
  let s = seed >>> 0;
  return () => { s = Math.imul(s ^ (s >>> 15), 2246822507) + 0x9e3779b9 >>> 0; s ^= s >>> 13; return (s >>> 0) / 4294967296; };
}
// an independent stream for one named choice, so adding a choice never shifts the others
export const streamOf = (seed, name) => rng((seed ^ fnv(name)) >>> 0);

// JSON with keys sorted at every depth: the same data always prints the same
export function stable(v) {
  if (Array.isArray(v)) return `[${v.map(stable).join(",")}]`;
  if (v && typeof v === "object") return `{${Object.keys(v).sort().filter(k => v[k] !== undefined).map(k => `${JSON.stringify(k)}:${stable(v[k])}`).join(",")}}`;
  return JSON.stringify(v);
}
export const hashOf = (v) => idOf(stable(v));
