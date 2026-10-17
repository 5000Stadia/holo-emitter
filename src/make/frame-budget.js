// One frame budget for the work that can wait (R81; the shared order's step 5, construct m73a460: "the phone and PC budget
// on that story", two numbers, not one, Kabe: "very good on pc too"). Each piece of deferrable work had kept its own
// milliseconds a frame (the land's tiles, the hill's beside them, the rooms still to build, people finding their ways), so
// together they could take more than a frame had. Now each asks one ledger for its grant, and the tier sets the pot: the same
// work on a phone and a PC, a different budget. Prior art (R81's pass, 2026-10-16): React's scheduler (one loop; work past its
// deadline runs even when the host would yield, the starvation answer), Unreal's async loading limit with its priority extra
// time and Unity's upload time slice (one budget a frame, urgent work borrowing headroom), 3d-tiles-renderer's priority queue;
// requestIdleCallback and scheduler.postTask rejected (unreliable or missing on iOS Safari, and the browser, not the tier,
// would set the budget).
//   TIERS                          -> per tier: the frame (ms), the pot moving and still, the extra urgent work may borrow,
//                                     and the people's share of the frame agreed with Photonic (floor, ceiling)
//   makeFrameBudget(tier, { now }) -> { job(name, opts), begin({ still }), grant(name, { urgent }), spent(name, ms, busy),
//                                       serve(name, fn, { urgent }), ledger(), tier, T }
// A job's floor is kept for it while it has work (idle until it first says it has; a job that never runs holds nothing): what any other job is granted leaves room for the floors of the busy jobs
// not yet served this frame. When the pot can't hold every floor, a job passed over for maxWait frames is owed its floor
// anyway. Standing still the pot grows: a frame dropped while nothing moves is not seen. Each grant is held to the job's
// ceiling; what a job then spends is its own (a room's step can't be cut), and the ledger counts it. Pure; no AI.

export const TIERS = {
  // (a phone draws at 30 a second: 33 ms; people's 4-14 ms of it is Photonic's, m897603, scaling with headcount)
  phone: { frame: 1000 / 30, moving: 6, still: 14, urgent: 6, people: { floor: 4, ceiling: 14 } },
  // (a PC at 60: 17 ms, the richer tier's people with their shadows from 6 ms, to 10: a burst of hand-overs done in a frame
  // or two without eating the frame, Photonic mc4c24a)
  pc: { frame: 1000 / 60, moving: 5, still: 12, urgent: 4, people: { floor: 6, ceiling: 10 } },
};

export function makeFrameBudget(tier = "phone", { now = () => performance.now() } = {}) {
  const T = TIERS[tier] || TIERS.phone, jobs = new Map();
  let frame = 0, pot = 0, spentNow = 0, still = false;
  const L = { frames: 0, overPot: 0, owed: 0, worst: 0 };
  const job = (name, { floor = 0.5, ceil = Infinity, maxWait = 30 } = {}) => {
    jobs.set(name, { name, floor, ceil, maxWait, busy: false, served: -1, waited: 0, grants: 0, granted: 0, used: 0, maxUsed: 0, over: 0, skipped: 0, longestWait: 0 });
    return api; };
  function begin({ still: s = false } = {}) {
    if (frame) { L.frames++; if (spentNow > pot + T.urgent) L.overPot++; L.worst = Math.max(L.worst, spentNow); }
    frame++; still = s; pot = s ? T.still : T.moving; spentNow = 0; }
  // the milliseconds this job may spend now (0: not this frame)
  function grant(name, { urgent = false, ceil = null } = {}) {
    const j = jobs.get(name); if (!j) throw new Error(`frame budget: no job ${name}`);
    let held = 0; for (const o of jobs.values()) if (o !== j && o.busy && o.served !== frame) held += o.floor;
    const left = pot + (urgent ? T.urgent : 0) - spentNow - held;
    let g = Math.min(ceil ?? j.ceil, left);   // (a ceiling for this frame: the land's catch-up, say)
    if (g < j.floor) { if (j.waited >= j.maxWait) { g = j.floor; L.owed++; } else g = 0; }
    if (g <= 0) { j.waited++; j.skipped++; j.longestWait = Math.max(j.longestWait, j.waited); return 0; }
    j.served = frame; j.waited = 0; j.grants++; j.granted += g; j.last = g; return g; }
  // what it spent, and whether it still has work (an idle job holds no floor)
  function spent(name, ms, busy = true) {
    const j = jobs.get(name); j.busy = !!busy; if (j.served !== frame) return; spentNow += ms; j.used += ms; j.maxUsed = Math.max(j.maxUsed, ms);
    if (ms > j.last + 1) j.over++; }
  // grant, run, measure: fn(ms) -> busy (has more to do)
  function serve(name, fn, opts) { const g = grant(name, opts); if (!g) return jobs.get(name).busy;
    const t0 = now(); const busy = fn(g); spent(name, now() - t0, busy); return !!busy; }
  const r1 = (v) => Math.round(v * 10) / 10;
  const ledger = () => ({ tier, frame: r1(T.frame), pot: [T.moving, T.still], urgent: T.urgent, people: T.people, still, ...L, worst: r1(L.worst),
    jobs: Object.fromEntries([...jobs.values()].map(j => [j.name, { floor: j.floor, ceil: j.ceil, busy: j.busy, grants: j.grants, avg: j.grants ? r1(j.used / j.grants) : 0, max: r1(j.maxUsed), over: j.over, skipped: j.skipped, longestWait: j.longestWait }])) });
  const api = { job, begin, grant, spent, serve, ledger, tier, T };
  return api;
}
