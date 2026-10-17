// Warming out of sight (2026-10-07). The first sight of a thing makes what it draws: a TSL build for each shader key
// it brings (10-60 ms each), its GPU pipelines, its textures sent up; walking into a room not yet seen, or turning to
// what the first frame had behind you, hitched 0.1-0.15 s (headed Chrome, the manor). After the first frame, when the
// page has time to spare, every room is compiled ahead (renderer.compileAsync: its node builds, its bindings and
// textures, its pipelines made asynchronously, off the GPU's queue), the nearest room first (the one you stand in: what
// is behind you), so turning or walking on draws with nothing left to make. The same builds, uploads and pipelines,
// done earlier: nothing drawn differs; what is already made costs a lookup.
// A room at a time: its hidden parts shown for the instant compileAsync gathers them (it gathers in the call itself,
// before it first waits) and hidden again, nothing drawn between; then its objects compile one by one, the page's
// frames running between them (no task over 50 ms, measured). Only while the view is still (quiet()): the GPU
// compiles a new pipeline in its own process, and a frame waits on it (0.1-0.25 s, measured headed), unseen when
// nothing moves, a stutter when walking; so walking pauses it, and it goes on when you stop.
// Only the main pass (a still shadow map is not redrawn), with the lights in view now. A room that brings lights of
// its own changes every shader when it shows (the muniment room's window lights and candle): what it would build now
// is for the wrong set of lights, so it is left alone (and gathered whole, its light would join the set meanwhile).
//   makeWarm(renderer, scene, { camera, at, quiet }) -> { add(id, roots, { center }), start(), stop(), stats() }
//     roots: the room's groups (its meshes, things and doors); center: [x, y, z] in the world; at(): where you are,
//     for nearest-first; quiet(): may it work now; camera: a perspective camera whose view holds everything
export function makeWarm(renderer, scene, { camera, at = () => [0, 0, 0], quiet = () => true, slice = 6, timeout = 1000 } = {}) {
  const rooms = [], S = { rooms: 0, objects: 0, skipped: [], busy: 0, longest: 0, started: null, finished: null };
  let running = false;
  const idle = typeof requestIdleCallback === "function" ? (f) => requestIdleCallback(f, { timeout })
    : (f) => setTimeout(() => { const t = performance.now() + 8; f({ timeRemaining: () => Math.max(0, t - performance.now()), didTimeout: false }); }, 32);
  // the nearest room not yet warmed (height counts thrice: a floor up is further than a room along)
  function next() {
    const [x, y, z] = at(); let best = null, bd = Infinity;
    for (const r of rooms) { if (r.done) continue; const d = Math.hypot(r.center[0] - x, (r.center[1] - y) * 3, r.center[2] - z); if (d < bd) { bd = d; best = r; } }
    return best;
  }
  const timed = async (f) => { const t0 = performance.now(); try { await f(); } catch (e) { console.warn("warm: " + e.message); }
    const dt = performance.now() - t0; S.busy += dt; S.longest = Math.max(S.longest, dt); };
  // a room without lights: each root gathered whole (its hidden parts shown for the call's first, synchronous part only)
  async function whole(r) {
    for (const root of r.roots) {
      while (running && !quiet()) await new Promise(res => setTimeout(res, 250));      // walking: wait till you stop
      const hidden = []; root.traverse(o => { if (!o.visible) hidden.push(o); });
      let job; for (const o of hidden) o.visible = true;
      try { job = renderer.compileAsync(root, camera, scene); } finally { for (const o of hidden) o.visible = false; }
      await timed(() => job);
      root.traverse(o => { if (o.isMesh) S.objects++; }); }
  }
  async function pump(deadline) {
    if (!running) return;
    if (!quiet()) { setTimeout(() => idle(pump), 250); return; }
    // (a page that is never idle, a GPU-bound WebGL one, gets its callback at the timeout with no time left: one room then)
    for (let n = 0; running && quiet() && (deadline.timeRemaining() > slice || (deadline.didTimeout && n === 0)); n++) {
      const r = next();
      if (!r) { running = false; S.finished = performance.now(); return; }
      r.done = true;
      let lit = false; for (const root of r.roots) root.traverse(o => { if (o.isLight) lit = true; });
      if (lit) { S.skipped.push(r.id); continue; }
      await whole(r); S.rooms++;
    }
    if (running) idle(pump);
  }
  return {
    add(id, roots, { center }) { rooms.push({ id, roots: [].concat(roots).filter(Boolean), center, done: false }); },
    start() { if (running || !renderer.compileAsync) return; running = true; S.started ??= performance.now(); idle(pump); },
    stop() { running = false; },
    stats: () => ({ ...S, busy: Math.round(S.busy), longest: Math.round(S.longest), left: rooms.filter(r => !r.done).length,
      ms: S.started == null ? null : Math.round((S.finished ?? performance.now()) - S.started) }),
  };
}
