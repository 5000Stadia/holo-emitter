// The catalogue (design/production/plan.md §2): parts are the only code, kinds are data over them.
// A kind says which parts make it, the settings they read (a number, or a range drawn from the seed
// to the millimetre), the affordances that make it work (what moves, how, what it needs first),
// the processes that run in it over time, its slots and its checks. A kind is pinned by the hash of
// its own data, so a world can say exactly which version of a thing it was made with.
// Pure: no THREE, so node can check kinds.
import { hashOf, streamOf } from "./id.js";

const PARTS = new Map(), KINDS = new Map();

// a part: build(ctx, params) adds geometry by material role, onto the body or a named mover
export function definePart(name, part) {
  if (PARTS.has(name)) throw new Error(`part ${name} defined twice`);
  PARTS.set(name, { name, ...part });
  return part;
}
export const partOf = (name) => PARTS.get(name) || null;

// what moves a mover: slide along an axis, turn on a hinge, a lever that springs back, a switch,
// or nothing visible (a state only). Each affordance has two states, rest and moved.
export const MOTIONS = ["slide", "hinge", "lever", "switch", "state"];
const KIND_KEYS = new Set(["kind", "v", "noun", "why", "settings", "parts", "affordances", "processes", "slots", "habit", "checks", "fixed", "size"]);
const AFF_KEYS = new Set(["mover", "motion", "axis", "travel", "angle", "states", "initial", "verbs", "requires", "refused", "starts", "lights", "hit", "speed", "per"]);
const PROC_KEYS = new Set(["initial", "phases", "drives"]);

export function defineKind(k) {
  const bad = (why) => { throw new Error(`kind ${k.kind || "?"}: ${why}`); };
  if (typeof k.kind !== "string" || !/^[a-z0-9_]+\/[a-z0-9_-]+$/.test(k.kind)) bad("its name is family/name, lower case");
  if (!Number.isInteger(k.v)) bad("v, its version, is an integer");
  for (const key of Object.keys(k)) if (!KIND_KEYS.has(key)) bad(`unknown field ${key}`);
  if (!Array.isArray(k.parts) || !k.parts.length) bad("it is made of at least one part");
  for (const p of k.parts) if (!PARTS.has(p.part)) bad(`no part called ${p.part}`);
  for (const [name, a] of Object.entries(k.affordances || {})) {
    for (const key of Object.keys(a)) if (!AFF_KEYS.has(key)) bad(`affordance ${name}: unknown field ${key}`);
    if (!MOTIONS.includes(a.motion)) bad(`affordance ${name}: motion is one of ${MOTIONS.join(", ")}`);
    // a need is another of its affordances in a state, or "@something" the world answers ("@holding": "key")
    for (const need of Object.keys(a.requires || {})) if (need[0] !== "@" && !(k.affordances || {})[need]) bad(`affordance ${name} requires ${need}, which it doesn't have`);
    if (a.starts && !(k.processes || {})[a.starts]) bad(`affordance ${name} starts ${a.starts}, which isn't a process`);
  }
  for (const [name, p] of Object.entries(k.processes || {})) {
    for (const key of Object.keys(p)) if (!PROC_KEYS.has(key)) bad(`process ${name}: unknown field ${key}`);
    if (!Array.isArray(p.phases) || !p.phases.every(f => typeof f.to === "number" && f.rate > 0)) bad(`process ${name}: phases are [{ to, rate per second }]`);
  }
  for (const [name, v] of Object.entries(k.settings || {})) if (!(typeof v === "number" || typeof v === "string" || typeof v === "boolean" || (Array.isArray(v) && v.length === 2 && v.every(n => typeof n === "number")) || (v && Array.isArray(v.one_of))))
    bad(`setting ${name} is a number, a [min, max] range, or { one_of: [...] }`);
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
    else s[name] = v;
  }
  for (const [name, v] of Object.entries(over)) if (s[name] === undefined) s[name] = v;
  return s;
}

// takeable comes from size and whether the thing is fixed, never listed per object
export const takeable = (kind, size) => !kind.fixed && !!size && Math.max(...size) <= 0.6 && size[0] * size[1] * size[2] <= 0.03;
