// The works the 1660 case needs (M7), checked on the object page with no picture: gates that take any of several keys
// or all of them held together, the slots of the case's containers riding their movers (a drawer's slot comes out with
// it, a chest's stays on its floor), starting states a place sets (a drawer open, a candle out at two thirds), reading
// a paper (once read it stays read, and it can still be taken), and the old single-key gate unchanged.
// Usage (the lab served; BASE overrides): node tests/.case-works.mjs
import { chromium } from "playwright";
const base = process.env.BASE || "http://localhost:8794";
const b = await chromium.launch({ args: ["--use-angle=vulkan", "--enable-features=Vulkan", "--enable-unsafe-webgpu", "--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: 400, height: 300 } }); const errs = []; p.on("pageerror", e => errs.push(e.message));
await p.goto(`${base}/lab/brief/object.html?o=furniture&k=table/gateleg`, { timeout: 120000 }); await p.waitForFunction(() => window.__works, null, { timeout: 120000 });
const t0 = Date.now();
const r = await p.evaluate(async () => {
  const THREE = await import("three"), { makeKit } = await import("/lab/painted/procedural.js"), { strongroomMaterials } = await import("/lab/brief/strongroom.js"), M = await import("/src/make/index.js");
  const K = await makeKit(THREE, { floor: [6, 4] }), look = M.lookC1660(THREE, K, strongroomMaterials(THREE, K));
  const checks = [], ok = (name, pass, got) => checks.push({ name, pass: !!pass, got: pass ? undefined : got });
  let n = 0; const make = (kind, over = {}, story = null) => { const t = M.build(THREE, K, look, kind, `check/case/${kind}:${n++}`, over); if (story) t.story = story; return t; };
  const settle = (W) => { W.finish(); for (let i = 0; i < 300; i++) W.tick(0.05); };
  const world = (v, b) => { b.node.updateMatrixWorld(true); return new THREE.Vector3(...v).applyMatrix4(b.node.matrixWorld); };
  const slotAt = (s) => { s.node.updateMatrixWorld(true); return new THREE.Vector3(...s.at).applyMatrix4(s.node.matrixWorld); };

  // ---- gates: any of several named keys (a list), all of them held together (@holding_all), a key's "fits"
  { const W = M.makeWorks(THREE, {}), door = make("door/boarded-iron-bound", { lock: "locked", key: ["key_steward", "key_lord"] });
    const kS = make("key/iron", {}, "key_steward"), kL = make("key/iron", {}, "key_lord"), kX = make("key/iron", {}, "key_other");
    for (const t of [door, kS, kL, kX]) W.add(t);
    let x = W.act({ b: door, aff: "leaf" }); ok("any-of: no key, the door refuses", !x.did && W.stateOf(door, "lock") === "locked", x);
    W.take({ b: kX }); x = W.act({ b: door, aff: "leaf" }); ok("any-of: a key not named, still refused", !x.did && W.stateOf(door, "lock") === "locked", x);
    W.put(kX); W.take({ b: kL }); x = W.act({ b: door, aff: "leaf" }); settle(W);
    ok("any-of: the second named key unlocks and opens it in one act", x.did && W.stateOf(door, "lock") === "unlocked" && W.stateOf(door, "leaf") === "open" && x.said?.[0] === "the key turns in the lock", { x, lock: W.stateOf(door, "lock") });
    const hint = W.hint({ b: door, aff: "leaf" }); ok("any-of: the hint says close once open", /close the door/.test(hint), hint); }
  { const W = M.makeWorks(THREE, {}), door = make("door/boarded-iron-bound", { lock: "locked", key: "muniment_door" }), k = make("key/iron", { fits: "muniment_door" }), k2 = make("key/iron", { fits: ["chest_padlock_lord", "muniment_door"] });
    W.add(door); W.add(k); W.add(k2); W.take({ b: k }); const x = W.act({ b: door, aff: "leaf" });
    ok("fits: a key cut for the muniment door opens it", x.did && W.stateOf(door, "lock") === "unlocked", x);
    W.put(k); W.set(door, "leaf", null, "closed"); W.set(door, "lock", null, "locked"); W.take({ b: k2 }); const y = W.act({ b: door, aff: "leaf" });
    ok("fits: a key that fits several locks, one of them this", y.did, y); }
  { const W = M.makeWorks(THREE, {}), chest = make("chest/iron-bound", { keys: ["key_chest_steward", "key_chest_lord"] });
    const a = make("key/iron", {}, "key_chest_steward"), c = make("key/iron", {}, "key_chest_lord"); for (const t of [chest, a, c]) W.add(t);
    let x = W.act({ b: chest, aff: "lid" }); ok("all-of: the lid refuses while the padlocks hold", !x.did && /padlocks hold/.test(x.refused), x);
    W.take({ b: a }); x = W.act({ b: chest, aff: "locks" }); ok("all-of: one of its two keys is not enough", !x.did && W.stateOf(chest, "locks") === "locked" && /keys to its padlocks/.test(x.refused), x);
    ok("all-of: the cursor says it is shut", W.cue({ b: chest, aff: "locks" }).mode === "locked", W.cue({ b: chest, aff: "locks" }));
    W.take({ b: c }); x = W.act({ b: chest, aff: "locks" }); settle(W); ok("all-of: both keys held together unlock the padlocks", x.did && W.stateOf(chest, "locks") === "unlocked", x);
    x = W.act({ b: chest, aff: "lid" }); settle(W); ok("all-of: then the lid opens", x.did && W.stateOf(chest, "lid") === "open", x); }
  { const W = M.makeWorks(THREE, {}), chest = make("chest/iron-bound"), k = make("key/iron"); W.add(chest); W.add(k);
    let x = W.act({ b: chest, aff: "locks" }); ok("the chest as it was: no key, refused", !x.did, x);
    W.take({ b: k }); x = W.act({ b: chest, aff: "locks" }); ok("the chest as it was: any key opens its padlocks (keys default to [\"key\"])", x.did && W.stateOf(chest, "locks") === "unlocked", x); }
  { const W = M.makeWorks(THREE, {}), door = make("door/boarded-iron-bound", { lock: "locked", key: "key/iron" }), k = make("key/iron"); W.add(door); W.add(k);
    let x = W.act({ b: door, aff: "leaf" }); ok("one key by its kind, as before: refused without it", !x.did, x);
    W.take({ b: k }); x = W.act({ b: door, aff: "leaf" }); ok("one key by its kind, as before: opens with it", x.did && W.stateOf(door, "lock") === "unlocked", x); }
  { const W = M.makeWorks(THREE, {}), a = make("key/iron", {}, "ka"), c = make("key/iron", {}, "kb"); W.add(a); W.add(c);
    W.rules([{ id: "any", when: { holding: ["ka", "kb"] }, then: { set: { any: true } } }, { id: "all", when: { holding_all: ["ka", "kb"] }, then: { set: { all: true } } }]);
    W.take({ b: c }); const v1 = W.vars(); W.take({ b: a }); const v2 = W.vars();
    ok("rules: holding a list is any of it; holding_all is all of it", v1.any === true && v1.all === undefined && v2.all === true, { v1, v2 }); }
  { const W = M.makeWorks(THREE, { ask: () => true }), chest = make("chest/iron-bound", { keys: ["nobody_has_this"] }); W.add(chest);
    ok("the authoring checks hold every key (ask): all-of still opens", W.act({ b: chest, aff: "locks" }).did, null); }

  // ---- slots: the names the case uses, each where it should be, riding its mover
  { const W = M.makeWorks(THREE, {}), cab = make("cabinet/japanned"); W.add(cab);
    const names = ["d0l", "d0r", "d1l", "d1r", "d2l", "d2r"];
    ok("cabinet/japanned: a slot for each drawer, named as the drawer", names.every(s => cab.slots.has(s)), [...cab.slots.keys()]);
    const before = Object.fromEntries(names.map(s => [s, slotAt(cab.slots.get(s))]));
    // a thing seated in d0l as the manor seats one
    const key = make("key/iron"), s0 = cab.slots.get("d0l"); key.node.position.set(...s0.at); key.node.rotation.y = 0.35; s0.node.add(key.node); W.add(key);
    const keyBefore = new THREE.Vector3(); key.node.getWorldPosition(keyBefore);
    let x = W.act({ b: cab, aff: "d0l" }); ok("cabinet: a drawer won't open behind its shut door", !x.did, x);
    W.act({ b: cab, aff: "left" }); W.act({ b: cab, aff: "right" }); settle(W);
    for (const s of names) { x = W.act({ b: cab, aff: s }); } settle(W);
    const moved = names.map(s => { const d = slotAt(cab.slots.get(s)).sub(before[s]); return [s, +d.x.toFixed(4), +d.y.toFixed(4), +d.z.toFixed(4)]; });
    ok("cabinet: every drawer's slot comes out with its drawer (0.22 m along +z, nothing else)", moved.every(([, dx, dy, dz]) => Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6 && Math.abs(dz - 0.22) < 1e-4), moved);
    const keyAfter = new THREE.Vector3(); key.node.getWorldPosition(keyAfter);
    ok("cabinet: the key in d0l came out with the drawer", Math.abs(keyAfter.z - keyBefore.z - 0.22) < 1e-4, [keyBefore.toArray(), keyAfter.toArray()]);
    // the slot's point lies on the drawer's bottom board: a ray straight down from 5 cm above it meets the board within 2 mm
    const ray = new THREE.Raycaster(), hits = names.map(s => { const p0 = slotAt(cab.slots.get(s)); ray.set(p0.clone().add(new THREE.Vector3(0, 0.05, 0)), new THREE.Vector3(0, -1, 0));
      const meshes = []; cab.node.traverse(o => { if (o.isMesh && o.userData.owner === cab.id) meshes.push(o); }); const h = ray.intersectObjects(meshes, false)[0]; return [s, h ? +(0.05 - h.distance).toFixed(4) : null]; });
    ok("cabinet: each slot lies on its drawer's floor (within 2 mm)", hits.every(([, d]) => d != null && Math.abs(d) < 0.002), hits);
    ok("cabinet: each slot says the floor it has (info.slots)", names.every(s => cab.info.slots?.[s]?.area?.length === 2), cab.info.slots); }
  { const W = M.makeWorks(THREE, {}), t = make("table/joined-with-drawer"); W.add(t); const s = t.slots.get("drawer"), a = slotAt(s);
    W.act({ b: t, aff: "drawer" }); settle(W); const d = slotAt(s).sub(a);
    ok("joined table: its drawer's slot rides the drawer, as before", Math.abs(d.z - t.settings.drawer_travel) < 1e-4 && Math.abs(d.x) < 1e-6, d.toArray()); }
  const onTop = (b, name, test) => { const s = b.slots.get(name); if (!s) return `no slot ${name}`; const p0 = slotAt(s), ray = new THREE.Raycaster(); ray.set(p0.clone().add(new THREE.Vector3(0, 0.05, 0)), new THREE.Vector3(0, -1, 0));
    const meshes = []; b.node.traverse(o => { if (o.isMesh) meshes.push(o); }); const h = ray.intersectObjects(meshes, false)[0]; return h ? +(0.05 - h.distance).toFixed(4) : "nothing under it"; };
  for (const [kind, name, act] of [["chest/boarded", "inside", "lid"], ["chest/iron-bound", "inside", null], ["box/oak-lidded", "inside", "lid"], ["bed/standing-curtained", "bed", null], ["table/drawing", "top", null]]) {
    const W = M.makeWorks(THREE, { ask: () => true }), h = make(kind); W.add(h); const s = h.slots.get(name);
    if (!s) { ok(`${kind}: a slot "${name}"`, false, [...h.slots.keys()]); continue; }
    const a = slotAt(s), d = onTop(h, name);
    ok(`${kind}: its "${name}" lies on what holds it (within 2 mm)`, typeof d === "number" && Math.abs(d) < 0.002, d);
    if (act) { if (kind === "chest/iron-bound") W.act({ b: h, aff: "locks" }); W.act({ b: h, aff: act }); settle(W); ok(`${kind}: its "${name}" stays put when its ${act} opens`, slotAt(s).distanceTo(a) < 1e-9, slotAt(s).toArray()); }
    ok(`${kind}: its "${name}" says the floor it has`, h.info.slots?.[name]?.area?.length === 2, h.info.slots); }
  { const h = make("chest/iron-bound"), s = h.slots.get("inside"); ok("chest/iron-bound: its inside is on the bundles, not the floor (over 8 cm up)", s.at[1] > 0.13, s.at); }
  { const bed = make("bed/standing-curtained"), body = make("body/laid-out"), s = bed.slots.get("bed");
    body.node.position.set(...s.at); body.node.rotation.y = body.kind.place.turn; s.node.add(body.node); bed.node.updateMatrixWorld(true);
    const bb = new THREE.Box3().setFromObject(body.node), mat = new THREE.Box3();
    bed.node.traverse(o => { if (o.isMesh && o.userData.material === "hangings" && o.parent === bed.node) mat.expandByObject(o); });
    ok("bed: the body lies square on the coverlet, within the bed's length and width", Math.abs(bb.min.y - 0.83) < 0.002 && bb.min.z > 0.1 && bb.max.z < bed.settings.L - 0.03 && bb.max.x < bed.settings.W / 2 - 0.1, { min: bb.min.toArray(), max: bb.max.toArray() }); }

  // ---- starting states the place sets (settings.start), and processes paused part burnt
  { const W = M.makeWorks(THREE, {}), press = make("press/evidence", { start: { "drawers#5": "open" } }); W.add(press);
    ok("start: the press's drawer 5 open, the rest shut", W.stateOf(press, "drawers", 5) === "open" && W.stateOf(press, "drawers", 4) === "closed" && W.stateOf(press, "drawers", 6) === "closed", [4, 5, 6].map(i => W.stateOf(press, "drawers", i)));
    const m = new THREE.Matrix4(), bank = press.banks.get("drawers"), z = (i) => { bank.meshes[0].getMatrixAt(i, m); return m.elements[14]; }, shut = make("press/evidence"), z0 = (() => { shut.banks.get("drawers").set(5, 0); shut.banks.get("drawers").meshes[0].getMatrixAt(5, m); return m.elements[14]; })();
    ok("start: drawer 5 stands out by its whole travel", Math.abs(z(5) - z0 - (press.settings.depth - 0.06) * 0.7) < 1e-4, [z(5), z0]);
    const x = W.act({ b: press, aff: "drawers", i: 5 }); settle(W); ok("start: and it shuts like any other", x.did && W.stateOf(press, "drawers", 5) === "closed" && Math.abs(z(5) - z0) < 1e-4, [x, z(5), z0]); }
  { const W = M.makeWorks(THREE, {}), press = make("press/evidence", { start: { "drawers#5": 0.4 } }); W.add(press);
    const m = new THREE.Matrix4(), bank = press.banks.get("drawers"), z = (i) => { bank.meshes[0].getMatrixAt(i, m); return m.elements[14]; }, travel = (press.settings.depth - 0.06) * 0.7;
    bank.set(5, 0); const z0 = z(5); W.add(press);
    ok("start: a number is open and standing that far (a drawer a hand open)", W.stateOf(press, "drawers", 5) === "open" && Math.abs(z(5) - z0 - 0.4 * travel) < 1e-4, [W.stateOf(press, "drawers", 5), z(5) - z0]);
    W.act({ b: press, aff: "drawers", i: 5 }); W.tick(0.016); const mid = z(5) - z0; settle(W);
    ok("start: closing it goes on from where it stood, not from full out", mid < 0.4 * travel + 1e-6 && W.stateOf(press, "drawers", 5) === "closed" && Math.abs(z(5) - z0) < 1e-4, mid); }
  { const W = M.makeWorks(THREE, {}), bed = make("bed/standing-curtained", { start: { left: "closed", right: "closed" } }), bed2 = make("bed/standing-curtained"); W.add(bed); W.add(bed2);
    ok("start: the bed's curtains drawn, where the kind starts them open", W.stateOf(bed, "left") === "closed" && W.stateOf(bed, "right") === "closed" && W.stateOf(bed2, "left") === "open", [W.stateOf(bed, "left"), W.stateOf(bed2, "left")]); }
  { let now = 1000; const store = {}, W = M.makeWorks(THREE, { store, clock: () => now }), c = make("candle/in-candlestick", { start: { light: "out", "~burn": 0.66 } }); W.add(c);
    ok("start: the candle out at 0.66 of its length", W.stateOf(c, "light") === "out" && Math.abs(W.level(c, "burn") - 0.66) < 1e-9 && Math.abs(c.movers.get("candle").scale.y - 0.66) < 1e-9, [W.stateOf(c, "light"), W.level(c, "burn"), c.movers.get("candle").scale.y]);
    W.act({ b: c, aff: "light" }); now += 600; W.tick(0); const L = W.level(c, "burn");
    ok("start: lit, it burns on from 0.66 (ten minutes at 6.67e-5 a second)", Math.abs(L - (0.66 - 600 * 0.0000667)) < 1e-6, L);
    W.act({ b: c, aff: "light" }); now += 600; ok("start: put out again, it holds where it was", Math.abs(W.level(c, "burn") - L) < 1e-9, W.level(c, "burn")); }
  { const store = {}, c = make("chest/iron-bound", { start: { lid: "open", locks: "unlocked" } }), W = M.makeWorks(THREE, { store }); store[`${c.id}.lid`] = "closed"; W.add(c);
    ok("start: what was done in play (the store) overrides where the place started it", W.stateOf(c, "lid") === "closed" && W.stateOf(c, "locks") === "unlocked", [W.stateOf(c, "lid"), W.stateOf(c, "locks")]); }
  for (const [kind, start, why] of [["press/evidence", { "drawers#99": "open" }, /56 of them/], ["press/evidence", { drawer: "open" }, /no affordance drawer/], ["bed/standing-curtained", { left: "drawn" }, /not one of its states/],
    ["candle/in-candlestick", { "~burn": 1.5 }, /level from 0 to 1/], ["candle/in-candlestick", { "~melt": 0.5 }, /no such process/], ["bed/standing-curtained", { "left#2": "open" }, /one mover, not a bank/]]) {
    let err = null; try { M.makeWorks(THREE, {}).add(make(kind, { start })); } catch (e) { err = String(e.message); }
    ok(`start: a mistake is said when added (${JSON.stringify(start)})`, err && why.test(err), err); }

  // ---- reading: a paper read stays read, may be read again, and can still be taken
  for (const [kind, verb] of [["letters/bundle", "read the letters"], ["deed/engrossment", "read the engrossment"]]) {
    const W = M.makeWorks(THREE, {}), t = make(kind); W.add(t); W.meshes();
    const hit = []; t.node.traverse(o => { if (o.isMesh) hit.push(o); }); const found = W.find({ object: hit[0], instanceId: null });
    ok(`${kind}: aimed at, it is the read affordance, and G takes it`, found?.aff === "read" && W.hint(found) === `${verb} · G: take ${t.kind.noun}`, [found?.aff, found && W.hint(found)]);
    ok(`${kind}: unread to begin with`, W.stateOf(t, "read") === "unread", W.stateOf(t, "read"));
    let x = W.act({ b: t, aff: "read" }); ok(`${kind}: read`, x.did && x.state === "read" && W.stateOf(t, "read") === "read", x);
    x = W.act({ b: t, aff: "read" }); ok(`${kind}: read again, it stays read`, x.did && x.again && W.stateOf(t, "read") === "read" && W.hint({ b: t, aff: "read" }).startsWith(verb) && W.cue({ b: t, aff: "read" }).mode === "act", [x, W.hint({ b: t, aff: "read" })]);
    x = W.take({ b: t }); ok(`${kind}: and it can be taken`, x.did && W.held().includes(t), x);
    x = W.act({ b: t, aff: "read" }); ok(`${kind}: and read while held`, x.did && W.stateOf(t, "read") === "read", x); }
  { const W = M.makeWorks(THREE, {}), body = make("body/laid-out"); W.add(body);
    ok("body/laid-out: not a thing you can carry", !W.take({ b: body }).did && body.kind.fixed === true, null); }
  return checks;
});
const failed = r.filter(c => !c.pass);
for (const c of r) console.log(`${c.pass ? "ok  " : "FAIL"} ${c.name}${c.pass ? "" : "  " + JSON.stringify(c.got)}`);
console.log(`${r.length - failed.length} of ${r.length} pass, ${Date.now() - t0} ms`, errs.length ? errs.slice(0, 3) : "");
await b.close();
process.exit(failed.length || errs.length ? 1 : 0);
