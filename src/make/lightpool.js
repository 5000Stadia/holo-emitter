// A fixed pool of lights handed round what you can see (Kabe, 2026-10-06: "kitchen passage to kitchen jumps in the
// lighting again"). The pool's size never changes, so nothing recompiles; which windows or fires hold a light is
// ranked by what each would give where you stand (its size over its distance squared), never by the room you stand
// in, so crossing a threshold changes nothing by itself. A light keeps what it holds until something else would
// give half as much again, and every change fades over `fade` seconds: a light let go fades out before its slot
// takes the next, a light taken fades in. Pure apart from the lights it is given (anything with `intensity`).
// share (a pool smaller than what is in view: a phone's 3 window lights): what the items left without a light would give
// where you stand (by the same measure) is shared among those holding one, so a room keeps its brightness, at most `share`
// times their own; the share eases like the fades. Off (0) by default.
// makePool(lights, { place(light, item), fade, keep, share }) -> { update(items, at), step(dt) -> busy, snap(), held() }
//   items: [{ key, at: {x, y, z}, size, base }]  (base: the light's full intensity for that item)
export function makePool(lights, { place, fade = 0.6, keep = 1.5, share = 0 } = {}) {
  const slots = lights.map(l => ({ l, key: null, item: null, level: 0, target: 0 }));
  let boost = 1, boostTo = 1;
  function update(items, at) {
    const held = new Set(slots.filter(s => s.key !== null && s.target > 0).map(s => s.key));
    const gives = (it) => { const dx = it.at.x - at.x, dy = it.at.y - at.y, dz = it.at.z - at.z; return it.size * (it.base || 1) / (dx * dx + dy * dy + dz * dz + 2); };
    const score = (it) => gives(it) / (it.base || 1) * (held.has(it.key) ? keep : 1);
    const ranked = items.map(it => [score(it), it]).sort((a, b) => b[0] - a[0]);
    const want = ranked.slice(0, slots.length).map(([, it]) => it);
    if (share > 1) { let all = 0, kept = 0; ranked.forEach(([, it], i) => { const g = gives(it); all += g; if (i < slots.length) kept += g; });
      boostTo = kept > 0 ? Math.min(share, all / kept) : 1; }
    const wanted = new Map(want.map(it => [it.key, it]));
    for (const s of slots) if (s.key !== null) { const it = wanted.get(s.key); if (it) { s.target = 1; s.item = it; wanted.delete(s.key); } else s.target = 0; }
    // what is newly wanted takes a slot that is free (faded out); the rest wait for one
    for (const it of wanted.values()) { const s = slots.find(q => q.key === null); if (!s) break; s.key = it.key; s.item = it; s.level = 0; s.target = 1; place(s.l, it); }
  }
  // each frame: levels toward their targets; a slot faded out is free. Busy while anything is still fading
  function step(dt) {
    let busy = false;
    if (boost !== boostTo) { busy = true; const k = dt / fade; boost = Math.abs(boostTo - boost) <= k ? boostTo : boost + Math.sign(boostTo - boost) * k; }
    for (const s of slots) {
      if (s.level !== s.target) { busy = true; s.level = s.target > s.level ? Math.min(s.target, s.level + dt / fade) : Math.max(s.target, s.level - dt / fade); }
      if (s.level === 0 && s.target === 0) s.key = s.item = null;
      const e = s.level * s.level * (3 - 2 * s.level); s.l.intensity = s.item ? s.item.base * e * boost : 0; s.l.userData.level = e;
    }
    return busy;
  }
  // straight to where the fades are going (the first frame, a jump to another place)
  const snap = () => { for (const s of slots) s.level = s.target; boost = boostTo; step(0); };
  const held = () => slots.map(s => s.key);
  return { update, step, snap, held, slots };
}
