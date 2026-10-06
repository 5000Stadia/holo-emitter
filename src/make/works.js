// Things that work (design/production/plan.md §2, Kabe 2026-10-05: "every obvious functional thing to
// do something"). One layer for every built thing: aim at it, find the affordance under the aim, ask
// whether it may move, change its state, play the motion. Processes run over time (a flush drains and
// slowly refills, a candle burns down): their level is worked out from the time since they started,
// so nothing is simulated while no one is looking.
//
// Gates, variables and rules (Kabe, 2026-10-05: "a locked door shouldn't open until I have its key";
// "Light 3 of these candles!" should just work):
//   - an action, or taking a thing, may require: another of the thing's affordances in a state
//     ("lock": "unlocked"), an engine variable ("$bolt_drawn": true), or something held
//     ("@holding": "key/iron-door"; a kind, a family, or a thing's own id);
//   - an action may set variables ("sets": { "candle_lit": true }; undone, a true goes back to false);
//   - rules, written by the place or the story, watch the world: "when" a condition holds (a count
//     of things of a kind within an area in a state, a variable, a thing's state, something held;
//     all of / any of), "then" effects run: set a variable, or put a thing's affordance in a state
//     with its motion, or both. A rule fires once unless it says otherwise; rules chain.
//
// State is an overlay on what was generated, kept in one store: "<id>.<affordance>(#<index>)" a state,
// "<id>~<process>" a process's start, "$<name>" a variable, "@held" what is carried, "!<rule>" a rule
// that has fired. Only what changed is ever written.
import { value, takeable } from "./catalogue.js";

const DEFAULT_STATES = { slide: ["closed", "open"], hinge: ["closed", "open"], lever: ["rest", "pulled"], switch: ["out", "lit"], state: ["off", "on"] };
const DEFAULT_VERBS = { slide: ["open", "close"], hinge: ["open", "close"], lever: ["pull", "pull"], switch: ["light", "put out"], state: ["turn on", "turn off"] };

export function makeWorks(THREE, { store = {}, save = () => {}, ask = () => false, onMove = () => {}, say = () => {}, clock = () => Date.now() / 1000 } = {}) {
  const things = new Map(), anim = new Map(), procs = new Set();
  let targets = null, rules = [];
  const key = (id, aff, i) => i == null ? `${id}.${aff}` : `${id}.${aff}#${i}`;
  const statesOf = (a) => a.states || DEFAULT_STATES[a.motion];
  const stateOf = (b, aff, i = null) => { const k = key(b.id, aff, i), a = b.kind.affordances[aff]; return k in store ? store[k] : (value(a.initial, b.settings) || statesOf(a)[0]); };
  const moved = (b, aff, i = null) => stateOf(b, aff, i) === statesOf(b.kind.affordances[aff])[1];
  const rest = (b, a, i) => a.motion === "slide" && b.banks.get(a.mover)?.rest ? b.banks.get(a.mover).rest(i) : 0;
  const held = () => store["@held"] || [];
  const byAddress = (address) => [...things.values()].find(b => b.address === address || b.id === address);
  // a thing answers to its own id, its kind, or its kind's family ("key" or "key/*")
  const answers = (b, name) => b.id === name || b.kind.kind === name || b.kind.kind.startsWith(`${name}/`) || name === `${b.kind.kind.split("/")[0]}/*`;
  const holding = (name) => held().some(id => things.has(id) && answers(things.get(id), name)) || ask("holding", name);
  const canTake = (b) => !!b.kind.size && takeable(b.kind, value(b.kind.size, b.settings));

  // ---- motion
  const _v = new THREE.Vector3(), _q = new THREE.Quaternion();
  function apply(b, aff, i, t) {
    const a = b.kind.affordances[aff], val = (v) => value(v, b.settings);
    const bank = b.banks.get(a.mover);
    if (bank) bank.set(i, t);
    const g = b.movers.get(a.mover);
    if (g && a.motion === "slide") g.position.copy(g.userData.home.position).add(_v.set(...a.axis).multiplyScalar(t * val(a.travel)));
    if (g && (a.motion === "hinge" || a.motion === "lever" || (a.motion === "switch" && a.angle))) g.quaternion.copy(g.userData.home.quaternion).multiply(_q.setFromAxisAngle(_v.set(...a.axis).normalize(), t * val(a.angle)));
    // a light group on or off: meshes (a flame) shown or hidden; lights kept in the scene at zero, since
    // adding or removing a light recompiles every material (a visible hitch when a candle is lit)
    if (a.lights) b.node.traverse(o => { if (o.userData.lightGroup !== a.lights) return;
      if (o.isLight) { o.userData.on ??= o.intensity; o.visible = true; o.intensity = t > 0.5 ? o.userData.on : 0; } else o.visible = t > 0.5; });
    onMove(b, aff, i, t);
  }
  // a process's level now, from where it started and how long ago
  function level(b, name) {
    const p = b.kind.processes[name], run = store[`${b.id}~${name}`];
    if (!run) return p.initial ?? 1;
    if (run.at == null) return run.from;                       // paused where it was (a candle put out)
    let cur = run.from, left = Math.max(0, clock() - run.at);
    for (const f of p.phases) {
      const dur = Math.abs(f.to - cur) / f.rate;
      if (left < dur) return cur + Math.sign(f.to - cur) * f.rate * left;
      cur = f.to; left -= dur;
    }
    return cur;
  }
  // a process moves its movers with its level: along an axis (a water surface, a flame), or scaled
  // from its pivot (a candle burning down)
  function drive(b, name) {
    const p = b.kind.processes[name], L = level(b, name);
    for (const d of [].concat(p.drives || [])) {
      const g = b.movers.get(d.mover); if (!g) continue;
      if (d.axis) g.position.copy(g.userData.home.position).add(_v.set(...d.axis).multiplyScalar(L * value(d.travel, b.settings)));
      if (d.scale) g.scale.set(d.scale[0] ? Math.max(1e-3, L) : 1, d.scale[1] ? Math.max(1e-3, L) : 1, d.scale[2] ? Math.max(1e-3, L) : 1);
    }
  }
  // turn an affordance to a state and play the motion toward it
  function turn(b, aff, i, to) {
    const a = b.kind.affordances[aff], k = key(b.id, aff, i), was = moved(b, aff, i) ? 1 : rest(b, a, i);
    store[k] = to;
    anim.set(k, { b, aff, i, to: to === statesOf(a)[1] ? 1 : (to === statesOf(a)[0] ? 0 : was), at: anim.get(k)?.at ?? was });
    // what it sets: a variable takes its value when moved, and a true goes back to false when undone
    for (const [name, v] of Object.entries(a.sets || {})) store[`$${name}`] = moved(b, aff, i) ? v : (v === true ? false : store[`$${name}`]);
  }

  // ---- gates
  function test(need, want, b) {
    if (need === "@holding") return holding(want);
    if (need[0] === "@") return ask(need.slice(1), want);
    if (need[0] === "$") return (store[need] ?? false) === want;
    return stateOf(b, need) === want;
  }
  const unmet = (b, requires) => Object.entries(requires || {}).find(([need, want]) => !test(need, value(want, b.settings), b) && !canAuto(b, need, value(want, b.settings)));
  // a need that is another affordance marked auto (a lock), whose own gate is open (its key is held),
  // is done on the way: trying a locked door with its key unlocks it and opens it
  const canAuto = (b, need, want) => { const a = b.kind.affordances?.[need]; return !!a && a.auto && statesOf(a).includes(want) && !Object.entries(a.requires || {}).find(([n, w]) => !test(n, value(w, b.settings), b)); };
  const doAutos = (b, requires) => { const done = []; for (const [need, want] of Object.entries(requires || {})) { const w = value(want, b.settings); if (!test(need, w, b) && canAuto(b, need, w)) { turn(b, need, null, w); done.push(b.kind.affordances[need].done || `${need}: ${w}`); } } return done; };

  // ---- rules
  const matches = (b, q) => (!q.kind || [].concat(q.kind).some(n => answers(b, n))) && (!q.within || b.address.startsWith(q.within))
    && Object.entries(q.state || {}).every(([aff, v]) => b.kind.affordances?.[aff] && stateOf(b, aff) === v);
  function holds(c) {
    if (c.all) return c.all.every(holds);
    if (c.any) return c.any.some(holds);
    if (c.count) { const n = [...things.values()].filter(b => matches(b, c.count)).length; return n >= (c.at_least ?? 1) && n <= (c.at_most ?? Infinity); }
    if (c.var) return (store[`$${c.var}`] ?? false) === (c.is ?? true);
    if (c.thing) { const b = byAddress(c.thing); return !!b && stateOf(b, c.aff) === c.is; }
    if (c.holding) return holding(c.holding);
    return false;
  }
  function run(effects) {
    for (const e of [].concat(effects)) {
      if (e.set) for (const [name, v] of Object.entries(e.set)) store[`$${name}`] = v;
      if (e.do) { const b = byAddress(e.do.thing); if (b && stateOf(b, e.do.aff, e.do.i ?? null) !== e.do.to) turn(b, e.do.aff, e.do.i ?? null, e.do.to); }
    }
  }
  function settle() {
    for (let pass = 0, fired = true; fired && pass < 8; pass++) {
      fired = false;
      for (const r of rules) {
        if (r.once !== false && store[`!${r.id}`]) continue;
        if (!holds(r.when)) continue;
        run(r.then); store[`!${r.id}`] = true; fired = true;
        if (r.say) say(r.say);
      }
    }
    save(store);
  }

  // ---- things
  function add(b) {
    things.set(b.id, b); targets = null;
    for (const ch of b.children || []) add(ch);
    if (held().includes(b.id)) b.node.visible = false;
    for (const [aff, a] of Object.entries(b.kind.affordances || {})) {
      const bank = b.banks.get(a.mover);
      if (bank) for (let i = 0; i < bank.count; i++) apply(b, aff, i, moved(b, aff, i) ? 1 : rest(b, a, i));
      else apply(b, aff, null, moved(b, aff) ? 1 : 0);
    }
    for (const name of Object.keys(b.kind.processes || {})) { drive(b, name); procs.add([b, name]); }
    return b;
  }
  // every mesh that can be aimed at, for the page's raycaster: what moves, what works by its body,
  // and whatever can be taken
  function meshes() {
    // each thing's own meshes are found once; which things count is asked each time, since a room comes
    // into view (and its things with it) when a door opens
    if (!targets) { targets = new Map();
      for (const b of things.values()) { const list = [], affs = Object.values(b.kind.affordances || {}), whole = affs.some(a => a.hit === "body") || canTake(b);
        b.node.traverse(o => { if (!o.isMesh) return; const m = o.userData.make;
          if (whole || (m && (m.mover || m.bank) && affs.some(a => a.mover === (m.mover || m.bank)))) list.push(o); });
        targets.set(b, list); } }
    const out = [];
    for (const [b, list] of targets) if (b.node.visible && !held().includes(b.id)) out.push(...list);
    return out;
  }
  // what a ray hit, as a thing, an affordance (none: it can only be taken) and an index
  function find(hit) {
    if (!hit) return null;
    let o = hit.object; while (o && !(o.userData.make && things.has(o.userData.make.thing || o.userData.make.id))) o = o.parent;
    if (!o) return null;
    const m = o.userData.make, b = things.get(m.thing || m.id);
    const entries = Object.entries(b.kind.affordances || {});
    const e = entries.find(([, a]) => a.mover && a.mover === (m.mover || m.bank)) || entries.find(([, a]) => a.hit === "body");
    if (e) return { b, aff: e[0], i: m.bank ? hit.instanceId : null };
    return canTake(b) ? { b, aff: null, i: null } : null;
  }
  function hint(t) {
    if (!t) return "";
    const take = canTake(t.b) ? `take ${t.b.kind.noun || "it"}` : "";
    if (!t.aff) return take + (unmet(t.b, t.b.kind.take?.requires) ? ` (${t.b.kind.take.refused || "it won't come"})` : "");
    const a = t.b.kind.affordances[t.aff], [doV, undoV] = a.verbs || DEFAULT_VERBS[a.motion].map(v => `${v} ${t.b.kind.noun || "it"}`);
    const label = t.i != null && t.b.banks.get(a.mover)?.labelOf?.(t.i);
    let text = (moved(t.b, t.aff, t.i) && a.motion !== "lever" ? undoV : doV) + (label ? ` · ${label}` : "");
    if (unmet(t.b, a.requires) && !moved(t.b, t.aff, t.i)) text += ` (${a.refused || "it won't move"})`;
    else if (unmet(t.b, a.release) && moved(t.b, t.aff, t.i)) text += ` (${a.held || "it won't go back"})`;
    else if (!moved(t.b, t.aff, t.i)) for (const [need, want] of Object.entries(a.requires || {})) { const w = value(want, t.b.settings); if (!test(need, w, t.b) && canAuto(t.b, need, w)) text += ` (${t.b.kind.affordances[need].done || "unlocking it"})`; }
    return take ? `${text} · G: ${take}` : text;
  }
  // what the cursor should say without words: take it, use it, or it's shut against you (the words
  // stay as a label for screen readers)
  function cue(t) {
    if (!t) return null;
    if (!t.aff) return { mode: unmet(t.b, t.b.kind.take?.requires) ? "locked" : "take", label: hint(t) };
    const a = t.b.kind.affordances[t.aff], m = moved(t.b, t.aff, t.i), shut = m ? !!unmet(t.b, a.release) : !!unmet(t.b, a.requires);
    return { mode: shut ? "locked" : "act", label: hint(t) };
  }
  // act on it: refused if a gate is shut, else the state turns over and the motion plays
  function act(t) {
    if (!t) return { did: false };
    if (!t.aff) return take(t);
    const a = t.b.kind.affordances[t.aff], k = key(t.b.id, t.aff, t.i);
    if (unmet(t.b, a.requires) && !moved(t.b, t.aff, t.i)) return { did: false, refused: a.refused || "It won't move." };
    // its gate going back: a gate-leg won't fold while the leaf rests on it
    if (unmet(t.b, a.release) && moved(t.b, t.aff, t.i)) return { did: false, refused: a.held || "It won't go back." };
    const autos = moved(t.b, t.aff, t.i) ? [] : doAutos(t.b, a.requires);
    if (a.motion === "lever") { anim.set(k, { ...t, to: 1, spring: true, at: anim.get(k)?.at ?? 0 }); for (const [name, v] of Object.entries(a.sets || {})) store[`$${name}`] = v; }
    else turn(t.b, t.aff, t.i, moved(t.b, t.aff, t.i) ? statesOf(a)[0] : statesOf(a)[1]);
    // a lever starts its process afresh from where it stands; a switch starts it when turned on and
    // holds it where it is when turned off
    if (a.starts) store[`${t.b.id}~${a.starts}`] = { from: level(t.b, a.starts), at: a.motion === "lever" || moved(t.b, t.aff, t.i) ? clock() : null };
    settle();
    return { did: true, state: stateOf(t.b, t.aff, t.i), said: autos };
  }
  // take it into your keeping, if it can be taken and its gate is open
  function take(t) {
    if (!t || !canTake(t.b)) return { did: false, refused: "It is not a thing you can carry." };
    const shut = unmet(t.b, t.b.kind.take?.requires);
    if (shut) return { did: false, refused: t.b.kind.take?.refused || "It won't come away." };
    store["@held"] = [...held(), t.b.id]; t.b.node.visible = false; targets = null;
    settle();
    return { did: true, took: t.b.kind.noun };
  }
  // each frame: movers ease toward their state, levers spring back, processes follow the clock
  function tick(dt) {
    for (const [k, m] of anim) {
      m.at += (m.to - m.at) * Math.min(1, dt * (m.b.kind.affordances[m.aff].speed || 7));
      if (Math.abs(m.to - m.at) < 0.002) m.at = m.to;
      apply(m.b, m.aff, m.i, m.at);
      if (m.at === m.to) { if (m.spring && m.to === 1) m.to = 0; else anim.delete(k); }
    }
    for (const [b, name] of procs) drive(b, name);
    const now = clock();
    for (const b of things.values()) if (b.animate && b.node.visible !== false) for (const f of b.animate) f(now, (aff) => moved(b, aff), (name) => level(b, name), b.movers);
  }
  // put an affordance in a state from outside (a world that owns it, as the harness owns the table's
  // drawer), and play the motion there
  function set(b, aff, i, state) { if (stateOf(b, aff, i) !== state) { turn(b, aff, i, state); settle(); } }
  return {
    add, meshes, find, hint, cue, act, take, set, tick, stateOf, level, things,
    rules: (list) => { rules = list; settle(); },
    vars: () => Object.fromEntries(Object.entries(store).filter(([k]) => k[0] === "$").map(([k, v]) => [k.slice(1), v])),
    held: () => held().map(id => things.get(id)).filter(Boolean),
    settled: () => anim.size === 0,
    // anything moving, or animated and alive (a lit candle's flame): the picture needs a new frame
    busy: () => anim.size > 0 || [...things.values()].some(b => b.animate?.length && b.node.visible !== false && Object.keys(b.kind.affordances || {}).some(a => moved(b, a))),
    finish: () => { for (const m of anim.values()) { m.at = m.to; if (m.spring) m.to = 0; } tick(0); tick(0); },
    moving: () => [...anim.values()].map(m => ({ thing: m.b.id, aff: m.aff, i: m.i, at: m.at, to: m.to })),
  };
}
