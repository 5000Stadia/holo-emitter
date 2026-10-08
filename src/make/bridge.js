// The live bridge to construct (R58 slice 2; construct's side: `construct holo serve CASE --rooms … --deck … --port 8799` on
// its branch holo-bridge): development only, this machine only (127.0.0.1), like the model relay; the published page never
// makes one. Each turn's events go out as they happen (construct writes them into a pattern-buffer world of the case, no
// model call); at a phase change or a long lull it is asked to re-author from what this player has done, in the
// background; newer decks are polled for and merged into the narrator (each part checked as the case's own are). A slow or
// absent bridge never stalls play: the narrator keeps dealing from the deck it has.
//   makeBridge({ base = "http://127.0.0.1:8799", merge(deck) -> {added, refused}, log? }) -> { turn({ turn, events, phase,
//     phaseChanged, quiet, done }), stats() }
export function makeBridge({ base = "http://127.0.0.1:8799", merge, log = () => {}, quietFor = 6, pollMs = 4000 } = {}) {
  const S = { sent: 0, failed: 0, reauthors: 0, decks: 0, added: 0, refused: 0, version: 0, lastAsk: -99, alive: null };
  const post = (path, body) => fetch(`${base}${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  // (one request at a time per kind; a failed bridge is asked again only after a pause)
  let busy = false, downUntil = 0;
  async function send(turn, events) {
    if (busy || performance.now() < downUntil) return; busy = true;
    try { const r = await post("/events", { turn, events }); S.alive = r.ok; if (r.ok) S.sent++; else S.failed++; }
    catch (_) { S.alive = false; S.failed++; downUntil = performance.now() + 15000; }
    finally { busy = false; } }
  async function reauthor(turn, done) {
    if (performance.now() < downUntil) return;
    try { const r = await post("/reauthor", { turn, done }); if (r.status === 202 || r.ok) { S.reauthors++; log(`bridge: re-authoring from turn ${turn}`); } }
    catch (_) { downUntil = performance.now() + 15000; } }
  async function poll() {
    if (performance.now() < downUntil) return;
    try { const r = await fetch(`${base}/deck?since=${S.version}`); if (r.status !== 200) return; const deck = await r.json();
      const m = merge(deck, { patch: true }); S.version = deck.version ?? S.version + 1; S.decks++; S.added += m.added.length; S.refused += m.refused.length;
      log(`bridge: deck v${S.version} merged, ${m.added.length} parts in${m.refused.length ? `, ${m.refused.length} refused` : ""}`);
      if (m.refused.length) console.warn("bridge deck refused:", m.refused); }
    catch (_) { downUntil = performance.now() + 15000; } }
  const timer = setInterval(poll, pollMs);
  return {
    turn({ turn, events, phaseChanged, quiet, done }) {
      if (events?.length) send(turn, events);
      if ((phaseChanged || quiet >= quietFor) && turn - S.lastAsk >= quietFor) { S.lastAsk = turn; reauthor(turn, done); } },
    stats: () => ({ base, ...S }), stop: () => clearInterval(timer),
  };
}
