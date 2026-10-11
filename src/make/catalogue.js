// The catalogue (design/production/plan.md §2): parts are the only code, kinds are data over them.
// A kind says which parts make it, the settings they read (a number, or a range drawn from the seed
// to the millimetre), the affordances that make it work (what moves, how, what it needs first),
// the processes that run in it over time, its slots and its checks. A kind is pinned by the hash of
// its own data, so a world can say exactly which version of a thing it was made with.
// Pure: no THREE, so node can check kinds.
import { hashOf, streamOf } from "./id.js";

const PARTS = new Map(), KINDS = new Map();

// a part: build(ctx, params) adds geometry by material role, onto the body or a named mover
const ARRIVALS = new Set();
export function definePart(name, part) {
  if (PARTS.has(name)) throw new Error(`part ${name} defined twice`);
  PARTS.set(name, { name, ...part });
  for (const f of ARRIVALS) f(name);
  return part;
}
// the parts a kind still waits for; and a way to hear when one arrives, so what stood as grid turns real
export const missingParts = (kind) => kind.parts.map(p => p.part).filter(n => !PARTS.has(n));
export const onPartArrives = (f) => { ARRIVALS.add(f); return () => ARRIVALS.delete(f); };
export const partOf = (name) => PARTS.get(name) || null;

// what moves a mover: slide along an axis, turn on a hinge, a lever that springs back, a switch,
// or nothing visible (a state only). Each affordance has two states, rest and moved.
export const MOTIONS = ["slide", "hinge", "lever", "switch", "state"];
const KIND_KEYS = new Set(["kind", "v", "noun", "why", "settings", "parts", "affordances", "processes", "slots", "habit", "checks", "fixed", "size", "traits", "take", "rests", "held", "place"]);
const AFF_KEYS = new Set(["mover", "motion", "axis", "travel", "angle", "states", "initial", "verbs", "requires", "refused", "starts", "lights", "hit", "speed", "sets", "auto", "done", "release", "held"]);
const PROC_KEYS = new Set(["initial", "phases", "drives"]);

export function defineKind(k) {
  const bad = (why) => { throw new Error(`kind ${k.kind || "?"}: ${why}`); };
  if (typeof k.kind !== "string" || !/^[a-z0-9_]+\/[a-z0-9_-]+$/.test(k.kind)) bad("its name is family/name, lower case");
  if (!Number.isInteger(k.v)) bad("v, its version, is an integer");
  for (const key of Object.keys(k)) if (!KIND_KEYS.has(key)) bad(`unknown field ${key}`);
  if (!Array.isArray(k.parts) || !k.parts.length) bad("it is made of at least one part");
  // a part not written yet is allowed if the kind says its size: until the part arrives the thing
  // stands as holodeck grid at that size (play never waits, plan §5); without a size it is an error
  for (const p of k.parts) if (!PARTS.has(p.part) && !k.size) bad(`no part called ${p.part}, and no size to stand in at until it arrives`);
  for (const [name, a] of Object.entries(k.affordances || {})) {
    for (const key of Object.keys(a)) if (!AFF_KEYS.has(key)) bad(`affordance ${name}: unknown field ${key}`);
    if (!MOTIONS.includes(a.motion)) bad(`affordance ${name}: motion is one of ${MOTIONS.join(", ")}`);
    // a need is another of its affordances in a state, "$variable" an engine condition, or "@something"
    // the world answers ("@holding": "key/iron": something in the inventory)
    for (const need of Object.keys(a.requires || {})) if (!"@$".includes(need[0]) && !(k.affordances || {})[need]) bad(`affordance ${name} requires ${need}, which it doesn't have`);
    if (a.starts && !(k.processes || {})[a.starts]) bad(`affordance ${name} starts ${a.starts}, which isn't a process`);
  }
  if (k.take) for (const need of Object.keys(k.take.requires || {})) if (!"@$".includes(need[0]) && !(k.affordances || {})[need]) bad(`taking it requires ${need}, which it doesn't have`);
  for (const [name, p] of Object.entries(k.processes || {})) {
    for (const key of Object.keys(p)) if (!PROC_KEYS.has(key)) bad(`process ${name}: unknown field ${key}`);
    if (!Array.isArray(p.phases) || !p.phases.every(f => typeof f.to === "number" && f.rate > 0)) bad(`process ${name}: phases are [{ to, rate per second }]`);
  }
  for (const [name, v] of Object.entries(k.settings || {})) if (!(typeof v === "number" || typeof v === "string" || typeof v === "boolean" || (Array.isArray(v) && v.length === 2 && v.every(n => typeof n === "number")) || (v && Array.isArray(v.one_of)) || (v && typeof v === "object" && "is" in v)))
    bad(`setting ${name} is a number, a [min, max] range, { one_of: [...] }, or { is: anything }`);
  const kind = { ...k, pin: hashOf(k) };
  KINDS.set(k.kind, kind);
  return kind;
}
export const kindOf = (name) => KINDS.get(name) || null;
export const kinds = () => [...KINDS.values()];

// the settings for one thing: fixed values as given, ranges drawn from its seed to the millimetre,
// choices by an integer index; each from its own stream, so adding a setting never moves another.
// over: what the place asks for (a press's width from the wall it stands on), taken as given.
export function settle(kind, seed, over = {}) {
  const s = {};
  for (const name of Object.keys(kind.settings || {}).sort()) {
    const v = kind.settings[name];
    if (over[name] !== undefined) { s[name] = over[name]; continue; }
    if (Array.isArray(v)) { const steps = Math.round((v[1] - v[0]) * 1000); s[name] = Math.round(v[0] * 1000 + Math.floor(streamOf(seed, name)() * (steps + 1))) / 1000; }
    else if (v && v.one_of) s[name] = v.one_of[Math.floor(streamOf(seed, name)() * v.one_of.length)];
    else if (v && typeof v === "object" && "is" in v) s[name] = v.is;
    else s[name] = v;
  }
  for (const [name, v] of Object.entries(over)) if (s[name] === undefined) s[name] = v;
  return s;
}

// A value in kind data: a number or anything literal as it is; "$name" reads a setting; "=expr" is a
// little arithmetic over the settings (numbers, names, + - * /, brackets), so data can say "the lid
// is a centimetre wider than the box" ("=w+0.01") without code. Arrays and objects are read through.
export function value(v, s) {
  if (typeof v === "string" && v[0] === "$") return s[v.slice(1)];
  if (typeof v === "string" && v[0] === "=") return evaluate(v.slice(1), s);
  if (Array.isArray(v)) return v.map(x => value(x, s));
  if (v && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype) return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, value(x, s)]));
  return v;
}
function evaluate(src, s) {
  const tokens = src.match(/\d*\.?\d+(?:e-?\d+)?|[A-Za-z_]\w*|[-+*/()]/g) || [];
  let i = 0;
  const atom = () => {
    const t = tokens[i++];
    if (t === "(") { const v = sum(); i++; return v; }
    if (t === "-") return -atom();
    if (/^[A-Za-z_]/.test(t)) { if (typeof s[t] !== "number") throw new Error(`"=${src}": no number setting ${t}`); return s[t]; }
    return parseFloat(t);
  };
  const product = () => { let v = atom(); while (tokens[i] === "*" || tokens[i] === "/") v = tokens[i++] === "*" ? v * atom() : v / atom(); return v; };
  const sum = () => { let v = product(); while (tokens[i] === "+" || tokens[i] === "-") v = tokens[i++] === "+" ? v + product() : v - product(); return v; };
  return sum();
}
// a thing's size before it is built (for packing it among others): the kind's size, read through its
// settings for that birth address
export const sizeOf = (kind, seed, over = {}) => kind.size ? value(kind.size, settle(kind, seed, over)) : null;

// takeable comes from size and whether the thing is fixed, never listed per object
export const takeable = (kind, size) => !kind.fixed && !!size && Math.max(...size) <= 0.6 && size[0] * size[1] * size[2] <= 0.03;
