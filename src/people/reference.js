// The reference population (M8, R60): the person interface agreed with Photonic (its design/interface.md; our brief,
// design/people/photonic-brief.md §3) met in the plainest way, so the harness page and our checks run before
// Photonic's people exist, and either side can test against it. Not a look: a person is a capsule with a nose (which
// way they face), coloured from a hash of their id, every person in one instanced draw. They walk our routes
// (src/people/route.js) under our walking rules, hold their place in the moving bodies' layer (src/people/bodies.js),
// and step aside or wait for each other and for you.
//
//   makePeople(THREE, { ctx }) -> { group, tick(t, dt, camera), add(doc) -> person, remove(id), get(id), all(),
//                                   hit(raycaster) -> { id, distance } | null, show(roomIds), presence(id, tier), events() }
//   ctx: { walk: { floorOf, walkFor(half) -> a walker (src/make/walk.js) for that body }, claims: withBodies(...),
//          place: { roomAt(x, y, h) -> room | null }, works?, device?: { share 0..1 }, budgetMs? }
//   doc: { id, recipe?: { height?, half?, age? }, seed?, at: { pos: [x, y, z] | {x, y, z}, floor }, state? }
//   a person: { id, recipe, rank, where() -> { pos, floor, room }, goTo(target, { pace }), face(target), sit(thing), stand(),
//               use(thing, affordance), say(line, { to }), perceives() -> { seen, heard }, bounds() -> { half, height, reach }, state() }
// pos is three's world (x, height, -north); floor an id; target { pos, floor } or a person's id.
import { fnv } from "../make/id.js";
import { seek } from "./route.js";

const PACE = { stroll: 0.8, walk: 1.2, hurry: 1.9 };
export function makePeople(THREE, { ctx }) {
  const Std = THREE.MeshStandardNodeMaterial || THREE.MeshStandardMaterial;
  const group = new THREE.Group(); group.name = "people"; group.matrixAutoUpdate = false;
  // one capsule 1.7 m tall, feet at 0, scaled to each body; a nose at the eyes, pointing the way they face (+z local)
  const bodyGeo = new THREE.CapsuleGeometry(0.2, 1.3, 4, 10); bodyGeo.translate(0, 0.85, 0);
  const noseGeo = new THREE.BoxGeometry(0.07, 0.05, 0.14); noseGeo.translate(0, 1.55, 0.2);
  const bodyMat = new Std({ roughness: 0.8 }), noseMat = new Std({ color: 0x2a2018, roughness: 0.9 });
  let cap = 0, body = null, nose = null;
  const people = new Map(), order = [], jobs = [], log = [];
  let shown = null, dirty = false;
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), S = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0), C = new THREE.Color(), ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
  // room for n people: the instanced meshes grown (or, under a quarter used, shrunk) and every slot written again;
  // the old buffers freed on the GPU
  function fit(n) {
    const want = Math.max(16, 2 ** Math.ceil(Math.log2(Math.max(1, n))));
    if (want === cap || (n <= cap && n > cap / 4)) return;
    for (const m of [body, nose]) if (m) { m.removeFromParent(); m.dispose(); }
    cap = want; body = new THREE.InstancedMesh(bodyGeo, bodyMat, cap); nose = new THREE.InstancedMesh(noseGeo, noseMat, cap);
    for (const m of [body, nose]) { m.frustumCulled = false; m.castShadow = false; m.receiveShadow = true; m.count = 0; group.add(m); }
    body.setColorAt(0, C.set(0xffffff)); order.forEach((p, k) => { p.slot = k; p.drawn = null; body.setColorAt(k, C.set(p.colour)); }); body.instanceColor.needsUpdate = true; body.count = nose.count = order.length; for (const p of order) write(p); dirty = true;
  }
  const hash = (s) => fnv(s) / 4294967296;
  const toPlan = (pos) => Array.isArray(pos) ? [pos[0], -pos[2], pos[1]] : [pos.x, -pos.z, pos.y];
  const ev = (e) => log.push({ t: performance.now() / 1000, ...e });

  function add(doc) {
    if (people.has(doc.id)) remove(doc.id);
    const r = doc.recipe || {}, seed = String(doc.seed ?? ""), a = hash(`${doc.id}/${seed}/height`), b = hash(`${doc.id}/${seed}/build`);
    const height = r.height ?? (r.age != null && r.age < 14 ? 0.75 + r.age * 0.06 : 1.52 + a * 0.33), half = r.half ?? (0.17 + b * 0.07);
    const st = doc.state, at = st?.at || doc.at, [x, y, h] = toPlan(at.pos);
    const p = { id: doc.id, recipe: r, seed, rank: hash(`${doc.id}/rank`), height, half, colour: new THREE.Color().setHSL(hash(`${doc.id}/hue`), 0.45, 0.45).getHex(),
      x, y, h, floor: at.floor ?? ctx.walk.floorOf(h), yaw: st?.yaw ?? 0, phase: 0, path: null, leg: 0, pace: PACE.walk, to: null, waiting: 0, sitting: st?.sitting ?? null,
      tier: "at_scene", room: null, heard: [], slot: -1, drawn: null };
    p.walk = ctx.walk.walkFor(half);
    people.set(p.id, p); order.push(p); fit(order.length); p.slot = order.length - 1; body.count = nose.count = order.length;
    body.setColorAt(p.slot, C.set(p.colour)); body.instanceColor.needsUpdate = true;
    ctx.claims.hold(p.id, p.floor, x, y, half); placeRoom(p); write(p);
    const handle = person(p); if (st?.to) handle.goTo(st.to, { pace: st.pace });
    return handle;
  }
  function remove(id) {
    const p = people.get(id); if (!p) return; people.delete(id); ctx.claims.release(id);
    // the last slot moves into the freed one, so the drawn instances stay packed
    const last = order.pop(); if (last !== p) { order[p.slot] = last; last.slot = p.slot; body.setColorAt(last.slot, C.set(last.colour)); body.instanceColor.needsUpdate = true; last.drawn = null; write(last); }
    body.count = nose.count = order.length; fit(order.length); ev({ type: "removed", id });
  }
  // (the room exactly where they stand, each move: kept from 0.4 m back, a person by a doorway named the room behind them)
  const placeRoom = (p) => { p.room = ctx.place.roomAt(p.x, p.y, p.h)?.id ?? null; };
  // drawn: at the scene, ranked within the device's share, and in a room being shown
  const drawn = (p) => p.tier === "at_scene" && p.rank < (ctx.device?.share ?? 1) && (!shown || shown.has(p.room));
  function write(p) {
    const vis = drawn(p); if (!vis && p.drawn === false) return; p.drawn = vis; dirty = true;
    if (!vis) { body.setMatrixAt(p.slot, ZERO); nose.setMatrixAt(p.slot, ZERO); return; }
    const bob = p.path ? Math.abs(Math.sin(p.phase)) * 0.025 : 0, sy = p.height / 1.7 * (p.sitting ? 0.72 : 1);
    Q.setFromAxisAngle(UP, p.yaw); P.set(p.x, p.h + bob, -p.y); S.set(p.half / 0.2, sy, p.half / 0.2);
    body.setMatrixAt(p.slot, M.compose(P, Q, S)); S.set(1, sy, 1); nose.setMatrixAt(p.slot, M.compose(P, Q, S));
  }
  // a way found for p within the frame's budget; until then they stand
  const want = (p, to, pace) => { p.search = null; p.to = to; p.pace = PACE[pace] || (typeof pace === "number" ? pace : PACE.walk); p.path = null; p.waiting = 0; if (!jobs.includes(p)) jobs.push(p); };
  const target = (to) => { if (typeof to === "string") { const q = people.get(to); return q ? [q.x, q.y, q.h, q.floor] : null; }
    const [x, y, h] = toPlan(to.pos); return [x, y, h, to.floor]; };
  // (each search runs in slices of 200 nodes, resumed next frame where the budget ran out)
  function solve(budget) {
    const t0 = performance.now();
    while (jobs.length && performance.now() - t0 < budget) { const p = jobs[0]; if (!people.has(p.id) || !p.to) { jobs.shift(); p.search = null; continue; }
      if (!p.search) { const T = target(p.to); if (!T) { jobs.shift(); ev({ type: "no_way", id: p.id }); p.to = null; continue; } p.search = seek(p.walk, [p.x, p.y, p.h], T); }
      const pts = p.search.step(200); if (pts === undefined) { jobs.push(jobs.shift()); continue; }
      jobs.shift(); p.search = null;
      if (!pts) { ev({ type: "no_way", id: p.id, to: p.to }); p.to = null; continue; }
      p.path = pts; p.leg = 1; ev({ type: "set_off", id: p.id }); }
  }
  // one step along the path: through anyone in the way only never; aside a little if that is clear; else wait
  function step(p, dt) {
    const [tx, ty] = p.path[p.leg], dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy), s = Math.min(d, p.pace * dt);
    if (d < 1e-3) { if (++p.leg >= p.path.length) arrive(p); return; }
    const ux = dx / d, uy = dy / d, open = (x, y) => { const g = p.walk.groundAt(x, y, p.h); return g != null && ctx.claims.bodyAt(p.floor, x, y, p.half, p.id) == null ? g : null; };
    let nx = p.x + ux * s, ny = p.y + uy * s, g = open(nx, ny);
    if (g == null) for (const side of [1, -1]) { const ax = p.x + (ux * 0.5 - uy * side) * s, ay = p.y + (uy * 0.5 + ux * side) * s, ag = open(ax, ay); if (ag != null) { nx = ax; ny = ay; g = ag; break; } }
    if (g == null) { p.waiting += dt; if (p.waiting > 4) { ev({ type: "stuck", id: p.id, by: ctx.claims.bodyAt(p.floor, p.x + ux * 0.3, p.y + uy * 0.3, p.half, p.id) }); p.path = null; p.to = null; } return; }
    p.waiting = 0; p.x = nx; p.y = ny; p.h = g; p.floor = ctx.walk.floorOf(g); p.yaw = Math.atan2(ux, -uy);
    p.phase += dt * p.pace * 5.5;         // a stride's bob, by distance walked (engine principle 5: a phase, in seconds)
    ctx.claims.hold(p.id, p.floor, p.x, p.y, p.half); placeRoom(p);
  }
  function arrive(p) { const to = p.to; p.path = null; p.to = null; ev({ type: "arrived", id: p.id, at: { pos: [p.x, p.h, -p.y], floor: p.floor }, to }); }

  function tick(t, dt) {
    solve(ctx.budgetMs ?? 3);
    // per-frame work only for people walking or changing whether they show (engine principle 4)
    for (const p of order) { if (p.tier === "offscene") continue; if (p.path) { step(p, dt); write(p); } else if (p.drawn !== drawn(p)) write(p); }
    if (dirty) { body.instanceMatrix.needsUpdate = nose.instanceMatrix.needsUpdate = true; dirty = false; return true; }
    return order.some(p => p.path);
  }
  // aimed at: the nearest person's upright cylinder the ray meets, within its reach
  function hit(ray) {
    const o = ray.ray.origin, d = ray.ray.direction; let best = null;
    for (const p of order) { if (!drawn(p)) continue;
      const cx = o.x - p.x, cz = o.z + p.y, a = d.x * d.x + d.z * d.z, b = 2 * (cx * d.x + cz * d.z), c = cx * cx + cz * cz - p.half * p.half, D = b * b - 4 * a * c;
      if (a < 1e-9 || D < 0) continue; const s = (-b - Math.sqrt(D)) / (2 * a); if (s < ray.near || s > ray.far) continue;
      const yy = o.y + d.y * s - p.h; if (yy < 0 || yy > p.height * (p.sitting ? 0.72 : 1)) continue;
      if (!best || s < best.distance) best = { id: p.id, distance: s }; }
    return best;
  }
  function person(p) {
    return {
      id: p.id, recipe: p.recipe, rank: p.rank,
      where: () => ({ pos: [p.x, p.h, -p.y], floor: p.floor, room: p.room }),
      goTo: (to, { pace } = {}) => { if (p.sitting) stand(); want(p, to, pace); },
      face: (to) => { const T = target(to); if (T) { p.yaw = Math.atan2(T[0] - p.x, -(T[1] - p.y)); write(p); } },
      sit: (thing) => { p.sitting = thing ?? true; p.path = null; write(p); ev({ type: "sat", id: p.id, on: thing ?? null }); },
      stand: () => stand(),
      use: (thing, affordance) => { const b = ctx.works?.things?.get(thing); if (!b) return { refused: "no such thing" }; const r = ctx.works.act({ b, aff: affordance }); ev({ type: "used", id: p.id, thing, affordance }); return r; },
      say: (line, { to } = {}) => { ev({ type: "said", id: p.id, line, to: to ?? null });
        for (const q of order) if (q !== p && q.floor === p.floor && Math.hypot(q.x - p.x, q.y - p.y) < 12) q.heard.push({ from: p.id, line }); },
      perceives: () => { const seen = order.filter(q => q !== p && q.floor === p.floor && q.room === p.room && Math.hypot(q.x - p.x, q.y - p.y) < 10).map(q => q.id), heard = p.heard; p.heard = []; return { seen, heard }; },
      bounds: () => ({ half: p.half, height: p.height, reach: 0.7 }),
      state: () => ({ at: { pos: [p.x, p.h, -p.y], floor: p.floor }, yaw: p.yaw, sitting: p.sitting, to: p.to, pace: p.pace, doing: p.path || p.to ? "walking" : p.sitting ? "sitting" : "standing" }),
    };
    function stand() { if (!p.sitting) return; p.sitting = null; write(p); ev({ type: "stood", id: p.id }); }
  }
  fit(0);
  return {
    group, tick, add, remove, hit,
    get: (id) => people.has(id) ? person(people.get(id)) : null,
    all: () => order.map(p => person(p)),
    show: (ids) => { shown = ids ? new Set(ids) : null; for (const p of order) write(p); },
    presence: (id, tier) => { const p = people.get(id); if (p) { p.tier = tier; write(p); } },
    events: () => log.splice(0),
  };
}
