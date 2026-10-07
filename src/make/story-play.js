// A scene's story in play (R49 step 5): the compiled story (src/make/story.js) run against what was built. Your
// size and the body it gives you, what you can reach, the deeds that change you (drink, eat) and use things up,
// the things the text brings in later (the bottle, "which certainly was not here before"), the story's magic that
// keeps the goal in reach, the doorway too small for you, and the goal. Every line it says is the book's own,
// from the scene document's quotes. No AI.
// playStory({ THREE, scene, story, plan, manor, works, build, K, look, say, setVar }) -> hooks the page calls
import { storyModel, bodyAt } from "./story.js";
import { sentenceOf } from "./scene.js";

export function playStory({ THREE, scene, story, plan, manor, works, build, K, look, say: say0, setVar, text = "" }) {
  const say = (q) => say0(text ? sentenceOf(text, q) : q);
  const hall = plan.rooms.find(r => r.id === plan.entrance), Y = manor.levelOf(hall.floor), H = manor.heightOf(hall);
  const quote = (actId, i = 0) => { const a = scene.actions.find(q => q.id === actId); return a?.fails?.[i]?.quote || a?.quote; };
  const thingOf = new Map();                          // scene thing id -> built thing
  for (const t of plan.story.things) { const b = manor.things.find(q => q.kind.kind === t.kind); if (b) thingOf.set(t.id, b); }
  const hide = (b) => b.node.traverse(o => o.layers.set(31)), unhide = (b) => b.node.traverse(o => o.layers.set(0));
  const slotOf = (hostId, rel) => thingOf.get(hostId)?.slots.get(rel === "on" ? "top" : rel === "under" ? "under" : "inside");
  const seat = (b, s) => { b.node.position.set(...s.at); b.node.rotation.y = 0.35; s.node.add(b.node); };

  // the things the text brings in later: built now, hidden, seated where they will be, never in reach until then
  const later = new Map();
  for (const l of plan.story.later) { const b = build(THREE, K, look, l.kind, `story:${plan.entrance}/${l.id}`, {}); works.add(b); thingOf.set(l.id, b);
    const s = slotOf(l.of, l.rel); if (s) seat(b, s); hide(b); later.set(l.id, { ...l, b, shown: false }); }
  // the lamps: a row down the middle, each hanging from the roof
  const lamps = [];
  for (const [i, [x, y]] of (plan.story.lampAt || []).entries()) { const kind = plan.story.lamps[0]?.kind; if (!kind) break;
    // its roof contact is its drop and its rose above its lowest point; its light is the pool's, not its own
    const b = build(THREE, K, look, kind, `story:${plan.entrance}/lamp:${i}`, { glow: 0 }), drop = b.settings?.drop ?? 0.6; b.node.position.set(x, Y + H - (drop + 0.34), -y); manor.rooms.get(hall.id)?.grp.add(b.node); works.add(b); lamps.push(b); }
  // what hides an opening: hung on the hall's side of the wall, over it
  for (const h of plan.story.hides) { const o = plan.openings.find(q => q.id === h.opening); if (!o) continue;
    const b = build(THREE, K, look, h.kind, `story:${plan.entrance}/${h.id}`, {}), R = o.rect, cy = (R.y0 + R.y1) / 2;
    b.node.position.set(R.x1 + 0.06, Y, -cy); b.node.rotation.y = Math.PI / 2; manor.rooms.get(hall.id)?.grp.add(b.node); works.add(b); thingOf.set(h.id, b); }

  // ---- size: the body you have, from the store's "$size" (the document's sizes; "usual" chosen where open)
  const sizes = story.sizes, store = () => works.vars();
  let size = store().size || "usual", h = sizes[size], target = h;
  const body = () => { const b = bodyAt(h); b.eye = Math.min(b.eye, H - 0.12); return b; };   // stooped under the roof
  function setSize(s) { size = s; target = sizes[s]; setVar("size", s); }
  // the telescope: the height eases to its new value over a second and a half
  function grow(dt) { if (h === target) return false; const k = Math.min(1, dt / 1.5 * 3); h += (target - h) * k; if (Math.abs(target - h) < 0.002) h = target; return true; }

  // ---- reaching: a thing is in reach if its top is below your reach
  const box = new THREE.Box3();
  const topOf = (b) => { box.setFromObject(b.node); return box.max.y - Y; };
  const midOf = (b) => { box.setFromObject(b.node); return (box.min.y + box.max.y) / 2 - Y; };
  const reachable = (b, y = null) => (y != null ? y - Y : midOf(b)) <= bodyAt(sizes[size]).reach;
  // which act the text says fails for want of reach, for this thing (its quote is what we say)
  const reachFail = (id) => scene.actions.find(a => a.thing === id && a.verb === "take" && (a.fails || []).length);

  // ---- the softlock model: reachOf by the built things' heights at each size
  const consumables = story.actions.flatMap(a => a.effects.filter(e => e.gone).map(e => e.gone));
  const reachOf = (id, s) => { const b = thingOf.get(id) || [...manor.things].find(q => q.node.userData.opening === id); return !b || midOf(b) <= bodyAt(sizes[s]).reach; };
  const model = storyModel(story, { reachOf, consumables });
  const gone = new Set(), done = new Set();
  const doorOf = (id) => manor.things.find(b => b.node.userData.opening === id);
  const goalDoor = story.goal?.thing, goalKey = story.goal?.needs.find(n => n.holding)?.holding;
  const now = () => ({ size, held: new Set([...thingOf].filter(([, b]) => works.held().includes(b)).map(([id]) => id)), gone: new Set(gone),
    unlocked: new Set(goalDoor && doorOf(goalDoor) && works.stateOf(doorOf(goalDoor), "lock") === "unlocked" ? [goalDoor] : []) });

  // ---- after every act: the deeds it completed, then the story's magic if you are stranded
  function afterAct(t, r) {
    // the hall's doors refuse the golden key in the book's words
    if (r?.refused && t?.b?.node.userData.opening && t.b.node.userData.opening !== goalDoor) { const holdingKey = goalKey && works.held().includes(thingOf.get(goalKey));
      say(quote(holdingKey ? "act_key_hall_doors" : "act_try_hall_doors")); }
    // a door on a latch locks again when it is shut (plan: the little door)
    for (const o of plan.openings.filter(q => q.latch)) { const d = doorOf(o.id); if (d && works.stateOf(d, "leaf") !== "open" && works.stateOf(d, "lock") === "unlocked" && done.has(`opened:${o.id}`)) { works.set(d, "lock", null, "locked"); done.delete(`opened:${o.id}`); }
      if (d && works.stateOf(d, "leaf") === "open") done.add(`opened:${o.id}`); }
    if (goalDoor && doorOf(goalDoor) && works.stateOf(doorOf(goalDoor), "lock") === "unlocked") done.add("act_unlock_little_door");
    for (const a of story.actions) { const b = thingOf.get(a.thing); if (!b || !a.effects.length || done.has(a.id)) continue;
      const aff = b.kind.affordances?.[a.verb]; if (!aff) continue;
      const states = aff.states || ["off", "on"], st = works.stateOf(b, a.verb);
      if (st !== states[states.length - 1]) continue;                                   // a deed is done when its thing reaches its last state
      done.add(a.id);
      // used up: gone once its own draining has played out
      for (const e of a.effects) { if (e.size) setSize(e.size); if (e.gone) { gone.add(e.gone); const g = thingOf.get(e.gone); setTimeout(() => { if (gone.has(e.gone)) hide(g); }, 3200); } }
      { const src = scene.actions.find(q => q.id === a.id), last = (src?.effect || []).filter(e => e.quote).at(-1); say(last?.quote || src?.quote); }
    }
    magic();
  }
  // the story's magic, once you are stranded and nothing that could be used up is left to try
  function magic() {
    const s = now(); if (consumables.some(c => !s.gone.has(c))) return;
    const back = model.rescue(s); if (!back.length) return;
    for (const id of back) { const b = thingOf.get(id); if (!b) continue; gone.delete(id); for (const a of story.actions) if (a.thing === id) done.delete(a.id);
      for (const [aff, A] of Object.entries(b.kind.affordances || {})) { const s0 = (A.states || ["off"])[0]; if (works.stateOf(b, aff) !== s0) works.set(b, aff, null, s0); }
      unhide(b); }
    say(scene.things.find(t => t.id === back[0])?.exists?.quote || "“which certainly was not here before”");
  }

  // ---- before an act: a thing's first touch (an affordance nothing aims at: the cake's bite) comes before its
  // aimed one, as the text tells it ("She ate a little bit … she remained the same size")
  function beforeAct(t) {
    const b = t?.b; if (!b) return false;
    for (const [aff, A] of Object.entries(b.kind.affordances || {})) { if (A.hit || aff === t.aff || A.auto || A.requires || A.motion !== "state") continue;
      const st = A.states || ["off", "on"]; if (works.stateOf(b, aff) !== st[0] || !A.states) continue;
      const id = [...thingOf].find(([, q]) => q === b)?.[0], first = scene.actions.find(a => a.thing === id && (a.fails || []).length && !story.actions.find(q => q.id === a.id)?.effects.length);
      works.set(b, aff, null, st[1]); say(first?.fails?.[0]?.quote || first?.quote || ""); return true; }
    return false;
  }
  // ---- each frame: the later things that come to be, the doorway you don't fit, the goal
  let told = new Set(), ended = false;
  function tick(dt, x, y, roomId) {
    const changed = grow(dt);
    for (const l of later.values()) { if (l.shown) continue;
      const ev = scene.events.find(e => e.id === l.after), act = scene.actions.find(a => a.id === ev?.after), idx = scene.actions.indexOf(act);
      // a "look" happens when you come up to its thing, once the deed before it in the text is done
      const prior = scene.actions.slice(0, idx).reverse().find(a => story.actions.find(q => q.id === a.id)?.effects.length);
      if (prior && !done.has(prior.id)) continue;
      const host = thingOf.get(act?.thing); if (!host) continue; const p = new THREE.Vector3(); host.node.getWorldPosition(p);
      if (Math.hypot(p.x - x, -p.z - y) > 1.6) continue;
      l.shown = true; unhide(l.b); say(l.quote || ev?.quote || act?.quote); }
    if (goalDoor) { const o = plan.openings.find(q => q.id === goalDoor), d = doorOf(goalDoor);
      const near = o && Math.hypot((o.rect.x0 + o.rect.x1) / 2 - x, (o.rect.y0 + o.rect.y1) / 2 - y) < 0.8;
      if (near && d && works.stateOf(d, "leaf") === "open" && !fits(goalDoor) && !told.has(size)) { told.add(size); say(quote(size === "large" ? "act_look_through_door_large" : "act_go_through_usual")); }
      if (!near) told.clear(); }
    if (!ended && roomId && roomId !== hall.id && plan.rooms.find(r => r.id === roomId)?.type !== "open") { ended = true; onGoal(); }
    return changed;
  }
  // a doorway lets you through only if you fit it (src/make/reach.js's rule: no taller than it)
  const fits = (id) => { const o = plan.openings.find(q => q.id === id); return !o?.height_m || sizes[size] <= o.height_m; };
  let onGoal = () => {};
  return { say, body, beforeAct, afterAct, tick, fits, reachable, reachFail, quote, thingOf, lamps, model, size: () => size, setSize, set onGoal(f) { onGoal = f; }, strands: () => model.strands(model.start) };
}
