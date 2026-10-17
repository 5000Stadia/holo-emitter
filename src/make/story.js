// A scene's story, compiled from its document with no AI (R49 step 5): who you are at each size, what each
// action needs and does, and when a thing the text brings in later comes to be. Effects are read from the
// document's own words by a short, fixed vocabulary (below); what it can't read is reported, never guessed.
//
// The softlock check (check 10 over sizes as well as keys): from every state the actions can reach, is the goal
// still reachable? Read literally, Alice's hall strands you: drink before taking the key, eat the cake to grow
// and take it, and the bottle is gone (the book's way out is Chapter II's fan). The hall keeps the goal in reach
// by the story's own magic, declared and not assumed: whenever the goal could no longer be reached, what was
// used up comes back ("which certainly was not here before"). Pure: plain data in and out.
//
// Vocabulary (the scene document's `what` strings):
//   "player size <id>"            you become that size        "<thing> gone" | "emptied"   it is used up
//   "player holding <thing>"      you take it                 "size <id>" (a need)          you must be that size
//   "holding <thing>" (a need)    you must hold it            "<opening> unlocked" (a need) it must be unlocked
//   an action whose effects say nothing it can read changes nothing (a look; a failed attempt)

// the body at a height (prior art: Unity's CharacterController and Unreal's capsule; what scales with a body)
// half: half its width; eye; step: what it steps up; reach: how high it can take a thing from; speed: walking
// pace by leg length (Froude: speed goes as the root of leg length); near: the camera's near plane, kept inside it
export function bodyAt(h) {
  return { height: h, half: +(0.15 * h).toFixed(3), eye: +(0.93 * h).toFixed(3), step: +(0.2 * h).toFixed(3), head: h, reach: +(1.25 * h).toFixed(3),
    speed: +(1.3 * Math.sqrt(h / 1.2)).toFixed(2), far: +Math.max(0.35, 1.9 * h).toFixed(2), near: +Math.max(0.004, 0.035 * h).toFixed(4) };
}

export function compileStory(scene, { usual = 1.2 } = {}) {
  const unread = [];
  const sizes = Object.fromEntries((scene.player?.sizes || []).map(s => [s.id, typeof s.height_m === "number" ? s.height_m : null]));
  if (sizes.usual == null) sizes.usual = usual;              // "open" in the text: chosen (r49-steps.md)
  const things = new Set((scene.things || []).map(t => t.id)), openings = new Set((scene.openings || []).map(o => o.id));
  const need = (w) => { let m;
    if ((m = /^size (\w+)/.exec(w))) return { size: m[1] };
    if ((m = /holding (\w+)/.exec(w)) && things.has(m[1])) return { holding: m[1] };
    if ((m = /^(.+?) unlocked/.exec(w))) { const id = m[1].replace(/ /g, "_"); if (openings.has(id)) return { unlocked: id }; }
    return null; };
  const effect = (w, a) => { let m;
    if ((m = /player size (\w+)/.exec(w))) return { size: m[1] };
    if ((m = /player holding (\w+)/.exec(w))) return { take: m[1] };
    if (/\bgone\b|emptied/.test(w)) return { gone: a.thing };
    if (/fits .*lock|unlocked/.test(w) && openings.has(a.thing)) return { unlock: a.thing };
    return null; };
  const actions = [];
  for (const a of scene.actions || []) {
    const needs = (a.needs || []).map(n => need(n.what)).filter(Boolean), effects = (a.effect || []).map(e => effect(e.what, a)).filter(Boolean);
    for (const e of a.effect || []) if (!effect(e.what, a)) unread.push(`${a.id}: "${e.what}"`);
    actions.push({ id: a.id, verb: a.verb, thing: a.thing, needs, effects, fails: a.fails || [] });
  }
  // the goal: going through at the size the text says, the door unlocked (its need, if the text gives one)
  const goal = actions.find(a => a.verb === "go through" && a.needs.some(n => n.size) && a.needs.some(n => n.holding));
  return { sizes, actions, goal, unread };
}

// The abstract state the softlock search walks: your size, what you hold, what is used up, what is unlocked.
// reachOf(thing, size): may a body of that size take it (worked out from the built thing's height by the page,
// or given)? The search runs the scene's own deeds: take, drink, eat, unlock; then the goal.
export function storyModel(story, { reachOf, consumables }) {
  const deeds = [];
  for (const a of story.actions) {
    const ef = a.effects; if (!ef.length) continue;
    deeds.push({ id: a.id, thing: a.thing, needs: a.needs, effects: ef });
  }
  // taking a thing you can reach: the text shows it only at one size, but taking is taking
  const takes = [...new Set(deeds.flatMap(d => d.needs.filter(n => n.holding).map(n => n.holding)).concat(story.actions.filter(a => a.verb === "take").map(a => a.thing)))];
  const key = (s) => `${s.size}|${[...s.held].sort()}|${[...s.gone].sort()}|${[...s.unlocked].sort()}`;
  const ok = (s, d) => d.needs.every(n => (n.size ? s.size === n.size : true) && (n.holding ? s.held.has(n.holding) : true) && (n.unlocked ? s.unlocked.has(n.unlocked) : true))
    && !s.gone.has(d.thing);
  function next(s) {
    const out = [];
    for (const t of takes) if (!s.held.has(t) && !s.gone.has(t) && reachOf(t, s.size)) out.push({ by: `take ${t}`, s: { ...s, held: new Set([...s.held, t]) } });
    for (const d of deeds) { if (!ok(s, d)) continue; if (!reachOf(d.thing, s.size)) continue;
      const n = { size: s.size, held: new Set(s.held), gone: new Set(s.gone), unlocked: new Set(s.unlocked) };
      for (const e of d.effects) { if (e.size) n.size = e.size; if (e.take) n.held.add(e.take); if (e.gone) n.gone.add(e.gone); if (e.unlock) n.unlocked.add(e.unlock); }
      if (key(n) !== key(s)) out.push({ by: d.id, s: n }); }
    return out;
  }
  const atGoal = (s) => story.goal && story.goal.needs.every(n => (n.size ? s.size === n.size : true) && (n.holding ? s.held.has(n.holding) || [...s.unlocked].length : true));
  // from s, can the goal still be reached? (a breadth-first walk; a few dozen states)
  function canFinish(s) { const seen = new Set([key(s)]), q = [s];
    while (q.length) { const c = q.shift(); if (atGoal(c)) return true; for (const { s: n } of next(c)) { const k = key(n); if (!seen.has(k)) { seen.add(k); q.push(n); } } }
    return false; }
  // every state reachable from the start, and those that strand you: the softlock report
  function strands(start) { const seen = new Map([[key(start), { s: start, path: [] }]]), q = [start], out = [];
    while (q.length) { const c = q.shift(), here = seen.get(key(c)); if (!canFinish(c)) out.push({ state: show(c), by: here.path });
      for (const { by, s: n } of next(c)) { const k = key(n); if (!seen.has(k)) { seen.set(k, { s: n, path: [...here.path, by] }); q.push(n); } } }
    return { states: seen.size, stranded: out }; }
  // the story's magic: what was used up comes back, the fewest that make the goal reachable again
  function rescue(s) { if (canFinish(s)) return [];
    for (const c of consumables) if (s.gone.has(c)) { const n = { ...s, gone: new Set([...s.gone].filter(x => x !== c)) }; if (canFinish(n)) return [c]; }
    return [...s.gone].filter(c => consumables.includes(c)); }
  const show = (s) => ({ size: s.size, held: [...s.held], gone: [...s.gone], unlocked: [...s.unlocked] });
  const start = { size: "usual", held: new Set(), gone: new Set(), unlocked: new Set() };
  return { start, next, canFinish, strands, rescue, show };
}
