// What stands open (M7): the case's leads checked, pure, no browser, no model. node tests/.leads.mjs [case] [leads]
//  1. every lead's expressions parse and name only real clues, things, beats, clocks, people and topics (leads.js checkLeads)
//  2. the case's own _fairness solution path, walked through talk.js answer() and the narrator as case-play.js does: after
//     each step the leads are stepped; every lead raised on the way is closed by the accusation, and a side lead (a herring's
//     question) left open is closable by one more question from where the path ends
//  3. tells when each was raised and closed, and any never raised on the path (fine: a route the path does not take)
import fs from "fs";
import { answer, topicsFor } from "../src/make/talk.js";
import { makeNarrator } from "../src/make/narrator.js";
import { compileLeads, stepLeads, leadFrame, checkLeads } from "../src/make/leads.js";

const H = new URL("..", import.meta.url).pathname;
const k = JSON.parse(fs.readFileSync(H + (process.argv[2] || "design/case/case-1660.json"), "utf8"));
const L = JSON.parse(fs.readFileSync(H + (process.argv[3] || "design/case/case-1660.leads.json"), "utf8")).leads;
const arr = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);
let fails = 0; const fail = (m) => { fails++; console.log("  FAIL", m); };

// 1. sound
const chk = checkLeads(k, L);
console.log(`== ${L.length} leads: ${chk.ok ? "every expression parses and names real things" : chk.findings.length + " findings"}`);
for (const x of chk.findings) fail(`${x.at}: ${x.what}`);
if (!chk.ok) { console.log(`\n${fails} FAILED`); process.exit(1); }
const C = compileLeads(L);

// 2. the solution path (design/case/case-1660.json _fairness.solution_path, steps 1-9), as play: what case-play.js does
const frame = { learned: new Set(), holding: new Set(), said: [], yielded: new Set(), guarded: new Map() };
const n = makeNarrator(k, { seed: k.seed || 1660 });
const things = new Map(arr(k.things).map(t => [t.id, t]));
const memo = { raised: [], closed: [] }, when = {};
let pending = [], t = 0;
const fr = () => { const s = n.state(); return leadFrame({ ...s, cov: n.coverage().pillars }); };
function step() {
  const r = n.observe(pending.length ? pending : [{ type: "idle" }]); pending = [];
  if (r.due) { const b = n.pick(n.menu()); if (b) n.apply(b); }
  t++; const before = new Set(memo.raised), shut = new Set(memo.closed); stepLeads(C, fr(), memo);
  for (const id of memo.raised) if (!before.has(id)) (when[id] ||= {}).raised = t;
  for (const id of memo.closed) if (!shut.has(id)) (when[id] ||= {}).closed = t;
}
const learn = (id) => { if (!frame.learned.has(id)) { frame.learned.add(id); pending.push({ type: "learn", clue: id }); } };
const enter = (room) => { pending.push({ type: "enter", room }); step(); };
function ask(who, topic, stance = "ask", shown = null) {
  const a = answer(k, who, { topic, stance, shown }, frame);
  frame.said.push({ who, topic, act: a.act }); pending.push({ type: "say", who, topic, act: a.act });
  for (const c of a.learned) learn(c);
  step(); return a;
}
function touch(id, take = false) {
  const th = things.get(id); if (take) { frame.holding.add(id); pending.push({ type: "take", thing: id }); }
  pending.push({ type: "open", id }); for (const c of arr(th?.clue)) learn(c); step();
}
const PATH = [
  () => { enter("great_hall"); ask("anne", "death"); ask("anne", "keys"); ask("anne", "person:francis"); },                         // 1
  () => { enter("great_chamber"); ask("cressy", "deed"); ask("cressy", "mines"); },                                                 // 2
  () => { for (const r of ["withdrawing_chamber", "best_bedchamber", "closet_best"]) enter(r);
          ask("daniel", "whereabouts"); ask("daniel", "morning"); ask("daniel", "person:cressy"); },                                // 3
  () => { enter("muniment_room"); touch("key_steward", true); touch("desk1_candle"); touch("chest1"); touch("press_N1"); },            // 4
  () => { enter("withdrawing_chamber"); ask("anne", "morning", "press"); },                                                          // 5
  () => { enter("great_parlour"); ask("francis", "person:daniel"); ask("francis", "mines"); ask("francis", "person:cressy");
          ask("francis", "person:anne"); ask("francis", "hand", "press"); },                                                          // 6
  () => { for (const r of ["great_hall", "screens_passage", "kitchen", "larder", "servants_chamber_west"]) enter(r);
          touch("chest_daniel"); touch("box_daniel"); touch("draft_steward", true); ask("daniel", "gold", "show", "gold_note"); },    // 7
  () => { enter("great_hall"); ask("cressy", "gold", "show", "gold_note"); ask("cressy", "person:daniel", "press"); ask("cressy", "mines", "show", "draft_steward"); }, // 8
  () => { pending.push({ type: "accuse", who: "daniel" }); step(); },                                                                // 9
];
PATH.forEach((f, i) => { f(); const open = C.filter(l => memo.raised.includes(l.id) && !memo.closed.includes(l.id)).map(l => l.id);
  console.log(`  step ${i + 1}: open ${open.join(" ") || "(none)"}`); });
console.log(`== the solution path: ${t} turns, ${frame.learned.size} clues, phase ${n.phase()}, beats ${n.state().done.join(" ")}`);
for (const l of C) { const w = when[l.id]; console.log(`  ${l.id.padEnd(14)} ${w?.raised ? `raised at turn ${String(w.raised).padStart(2)}` : "never raised    "}  ${w?.closed ? `closed at turn ${w.closed}` : ""}`); }

// every lead raised on the path closes by the accusation; a side one, in one more question from there
for (const l of C) {
  if (!memo.raised.includes(l.id) || memo.closed.includes(l.id)) continue;
  if (!l.side) { fail(`${l.id} raised at turn ${when[l.id].raised} and still open when the accusation is made`); continue; }
  let by = null;
  for (const c of arr(k.cast)) for (const tp of topicsFor(k, c.id, frame)) for (const st of ["ask", "press"]) {
    if (by) break;
    const f2 = { learned: new Set(frame.learned), holding: new Set(frame.holding), said: [...frame.said], yielded: new Set(frame.yielded), guarded: new Map() };
    const a = answer(k, c.id, { topic: tp.id, stance: st }, f2); if (!a.learned.length) continue;
    const s = n.state(); const f = leadFrame({ ...s, learned: [...s.learned, ...a.learned], cov: n.coverage().pillars });
    if (stepLeads([l], f, { raised: [l.id], closed: [] }).closed.length) by = `${st} ${c.id} on ${tp.id}`;
  }
  if (by) console.log(`  side lead ${l.id} left open by the path; closes in one more question (${by})`); else fail(`side lead ${l.id} cannot be closed in one more question`);
}
const never = C.filter(l => !memo.raised.includes(l.id)).map(l => l.id);
if (never.length) console.log(`  never raised on this path: ${never.join(" ")}`);
console.log(fails ? `\n${fails} FAILED` : "\nall leads hold"); process.exit(fails ? 1 : 0);
