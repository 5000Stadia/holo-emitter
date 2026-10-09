// What play showed about a deck, for construct's author (`--playtests`): naive-play runs (tests/.naive-play.mjs) of a case,
// with a deck merged or without, read into one JSON. node tools/deck-playtest.mjs CASE.json [--deck DECK.json] RUN.json…
//   per beat (the case's and the deck's): in how many runs it was heard, at which turns, and what the player did in the five
//   turns after it (so a beat that changes nothing shows as such); beats never heard; per run the stall stretches (with what
//   the player was doing) and the hints asked, by lead; and the run's totals (solved, turns, person-minutes, clues, tries)
import fs from "node:fs";
const args = process.argv.slice(2), take = (k) => { const i = args.indexOf(k); return i < 0 ? null : args.splice(i, 2)[1]; };
const deckPath = take("--deck"), [casePath, ...runPaths] = args;
const k = JSON.parse(fs.readFileSync(casePath, "utf8")), deck = deckPath ? JSON.parse(fs.readFileSync(deckPath, "utf8")) : null;
const parts = [...(k.beats || []).map(b => ({ ...b, from: "case" })), ...(k.clocks || []).map(c => ({ ...c, hook: c.line, from: "case" })),
  ...(deck?.beats || []).map(b => ({ ...b, from: "deck" })), ...(deck?.clocks || []).map(c => ({ ...c, hook: c.hook || c.line, from: "deck" }))];
const norm = (s) => String(s || "").replace(/[‘’]/g, "'").replace(/\s+/g, " ").trim().toLowerCase();
const key = (p) => norm(p.hook || p.line).slice(0, 48);
const beats = Object.fromEntries(parts.map(p => [p.id, { from: p.from, kind: p.kind, phase: p.phase, heard_in: 0, turns: [], after: [] }]));
const runs = [];
for (const rp of runPaths) {
  const r = JSON.parse(fs.readFileSync(rp, "utf8")), log = r.log || [];
  // every line the player heard or read in a turn: the world's lines, and asides in the panel
  const lines = [...(r.heard || []).map(h => ({ turn: h.turn, text: h.text })), ...log.filter(e => e.said).map(e => ({ turn: e.t, text: e.said }))];
  const heardIds = new Set();
  for (const p of parts) { const kk = key(p); if (kk.length < 12) continue;
    const hit = lines.find(l => norm(l.text).includes(kk)); if (!hit) continue; heardIds.add(p.id);
    const B = beats[p.id]; B.heard_in++; B.turns.push(hit.turn);
    B.after.push(log.filter(e => e.t > hit.turn && e.t <= hit.turn + 5).map(e => `${e.kind} ${e.detail}`.slice(0, 90))); }
  runs.push({ run: rp.split("/").pop(), seed: r.seed, solved: r.solved, turns: r.turns, person_minutes: r.est_minutes, clues: r.clues?.length ?? r.clues,
    wrong_tries: r.accusation?.tries ?? r.receipts?.wrong_tries ?? null, hints: (r.thoughts || []).map(t => ({ turn: t.turn, lead: t.lead, thought: t.thought, why: t.why })),
    stalls: (r.stalls || []).map(s => ({ from: s.from, to: s.to, turns: s.turns, doing: (s.doing || []).slice(0, 6) })), beats_heard: [...heardIds] });
}
const out = { case: k.id, deck: deck ? { path: deckPath, version: deck.version ?? null, made_at: deck.made_at ?? null } : null, runs,
  beats, never_heard: Object.entries(beats).filter(([, b]) => !b.heard_in).map(([id, b]) => ({ id, from: b.from, phase: b.phase })),
  hints_by_lead: runs.flatMap(r => r.hints).reduce((m, h) => (m[h.lead] = (m[h.lead] || 0) + 1, m), {}) };
console.log(JSON.stringify(out, null, 1));
