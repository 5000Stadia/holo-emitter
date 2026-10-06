// Things that work (design/production/plan.md §2, Kabe 2026-10-05: "every obvious functional thing to
// do something"). One layer for every built thing: aim at it, find the affordance under the aim, ask
// whether it may move (a padlock, a key in hand), change its state, play the motion. Processes run
// over time (a flush drains and slowly refills, a candle burns down): their level is worked out from
// the time since they started, so nothing is simulated while no one is looking.
// State is an overlay on what was generated: store["<thing id>.<affordance>(#<index>)"] = state name,
// store["<thing id>~<process>"] = { from, at }; only what someone changed is ever written.

const DEFAULT_STATES = { slide: ["closed", "open"], hinge: ["closed", "open"], lever: ["rest", "pulled"], switch: ["out", "lit"], state: ["off", "on"] };
const DEFAULT_VERBS = { slide: ["open", "close"], hinge: ["open", "close"], lever: ["pull", "pull"], switch: ["light", "put out"], state: ["turn on", "turn off"] };

export function makeWorks(THREE, { store = {}, save = () => {}, ask = () => false, onMove = () => {}, clock = () => Date.now() / 1000 } = {}) {
  const things = new Map(), anim = new Map(), procs = new Set();
  let targets = null;
  const key = (id, aff, i) => i == null ? `${id}.${aff}` : `${id}.${aff}#${i}`;
  const statesOf = (a) => a.states || DEFAULT_STATES[a.motion];
  const stateOf = (b, aff, i) => { const k = key(b.id, aff, i), a = b.kind.affordances[aff]; return k in store ? store[k] : (a.initial || statesOf(a)[0]); };
  const moved = (b, aff, i) => stateOf(b, aff, i) === statesOf(b.kind.affordances[aff])[1];
  const rest = (b, a, i) => a.motion === "slide" && b.banks.get(a.mover)?.rest ? b.banks.get(a.mover).rest(i) : 0;

  // put an affordance's mover where t (0 at rest, 1 moved) puts it
  const _v = new THREE.Vector3(), _q = new THREE.Quaternion();
  function apply(b, aff, i, t) {
    const a = b.kind.affordances[aff], val = (v) => typeof v === "string" && v[0] === "$" ? b.settings[v.slice(1)] : v;
    const bank = b.banks.get(a.mover);
    if (bank) bank.set(i, t);
    const g = b.movers.get(a.mover);
    if (g && (a.motion === "slide")) g.position.copy(g.userData.home.position).add(_v.set(...a.axis).multiplyScalar(t * val(a.travel)));
    if (g && (a.motion === "hinge" || a.motion === "lever" || (a.motion === "switch" && a.angle))) g.quaternion.copy(g.userData.home.quaternion).multiply(_q.setFromAxisAngle(_v.set(...a.axis).normalize(), t * val(a.angle)));
    if (a.lights) b.node.traverse(o => { if (o.userData.lightGroup === a.lights) o.visible = t > 0.5; });
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
      const travel = typeof d.travel === "string" ? b.settings[d.travel.slice(1)] : d.travel;
      if (d.axis) g.position.copy(g.userData.home.position).add(_v.set(...d.axis).multiplyScalar(L * travel));
      if (d.scale) g.scale.set(d.scale[0] ? Math.max(1e-3, L) : 1, d.scale[1] ? Math.max(1e-3, L) : 1, d.scale[2] ? Math.max(1e-3, L) : 1);
    }
  }

  function add(b) {
    things.set(b.id, b); targets = null;
    for (const [aff, a] of Object.entries(b.kind.affordances || {})) {
      const bank = b.banks.get(a.mover);
      if (bank) for (let i = 0; i < bank.count; i++) apply(b, aff, i, moved(b, aff, i) ? 1 : rest(b, a, i));
      else apply(b, aff, null, moved(b, aff, null) ? 1 : 0);
    }
    for (const name of Object.keys(b.kind.processes || {})) { drive(b, name); procs.add([b, name]); }
    return b;
  }
  // every mesh that can be aimed at, for the page's raycaster
  function meshes() {
    if (targets) return targets;
    targets = [];
    for (const b of things.values()) {
      const affs = Object.values(b.kind.affordances || {});
      b.node.traverse(o => { if (!o.isMesh) return; const m = o.userData.make;
        if ((m && (m.mover || m.bank) && affs.some(a => a.mover === (m.mover || m.bank))) || affs.some(a => a.hit === "body")) targets.push(o); });
    }
    return targets;
  }
  // what a ray hit, as a thing, an affordance and an index
  function find(hit) {
    if (!hit) return null;
    let o = hit.object; while (o && !o.userData.make) o = o.parent;
    if (!o) return null;
    const m = o.userData.make, b = things.get(m.thing || m.id);
    if (!b) return null;
    const entries = Object.entries(b.kind.affordances || {});
    const e = entries.find(([, a]) => a.mover && a.mover === (m.mover || m.bank)) || entries.find(([, a]) => a.hit === "body");
    return e ? { b, aff: e[0], i: m.bank ? hit.instanceId : null } : null;
  }
  const unmet = (b, a) => Object.entries(a.requires || {}).find(([need, want]) => need[0] === "@" ? !ask(need.slice(1), want) : stateOf(b, need, null) !== want);
  function hint(t) {
    if (!t) return "";
    const a = t.b.kind.affordances[t.aff], [doV, undoV] = a.verbs || DEFAULT_VERBS[a.motion].map(v => `${v} ${t.b.kind.noun || "it"}`);
    const label = t.i != null && t.b.banks.get(a.mover)?.labelOf?.(t.i);
    const text = (moved(t.b, t.aff, t.i) && a.motion !== "lever" ? undoV : doV) + (label ? ` · ${label}` : "");
    return unmet(t.b, a) && !moved(t.b, t.aff, t.i) ? `${text} (${a.refused || "it won't move"})` : text;
  }
  // act on it: refused if a need is unmet, else the state turns over and the motion plays
  function act(t) {
    if (!t) return { did: false };
    const a = t.b.kind.affordances[t.aff], k = key(t.b.id, t.aff, t.i);
    if (unmet(t.b, a) && !moved(t.b, t.aff, t.i)) return { did: false, refused: a.refused || "It won't move." };
    if (a.motion === "lever") anim.set(k, { ...t, to: 1, spring: true, at: anim.get(k)?.at ?? 0 });
    else {
      const to = moved(t.b, t.aff, t.i) ? statesOf(a)[0] : statesOf(a)[1];
      store[k] = to; save(store);
      anim.set(k, { ...t, to: to === statesOf(a)[1] ? 1 : 0, at: anim.get(k)?.at ?? (to === statesOf(a)[1] ? rest(t.b, a, t.i) : 1) });
    }
    // a lever starts its process afresh from where it stands; a switch starts it when turned on and
    // holds it where it is when turned off
    if (a.starts) {
      const on = a.motion === "lever" || moved(t.b, t.aff, t.i);
      store[`${t.b.id}~${a.starts}`] = { from: level(t.b, a.starts), at: on ? clock() : null }; save(store);
    }
    return { did: true, state: stateOf(t.b, t.aff, t.i) };
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
    for (const b of things.values()) if (b.animate) for (const f of b.animate) f(now, (aff) => moved(b, aff, null), (name) => level(b, name));
  }
  // put an affordance in a state from outside (a world that owns it, as the harness owns the table's
  // drawer), and play the motion there
  function set(b, aff, i, state) {
    const a = b.kind.affordances[aff], k = key(b.id, aff, i);
    if (stateOf(b, aff, i) === state) return;
    const was = moved(b, aff, i) ? 1 : rest(b, a, i);
    store[k] = state; save(store);
    anim.set(k, { b, aff, i, to: state === statesOf(a)[1] ? 1 : rest(b, a, i), at: anim.get(k)?.at ?? was });
  }
  return { add, meshes, find, hint, act, set, tick, stateOf, level, settled: () => anim.size === 0, finish: () => { for (const m of anim.values()) { m.at = m.to; if (m.spring) m.to = 0; } tick(0); tick(0); }, moving: () => [...anim.values()].map(m => ({ thing: m.b.id, aff: m.aff, i: m.i, at: m.at, to: m.to })), things };
}
