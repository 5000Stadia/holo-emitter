// Check 26 (vetted 2026-10-08, decision 7 of the 2026-10-07 session: fair play and truth): a case is fair and its words
// hold, in node, no browser, no model. node tools/check-case.mjs [case id]   (default case-1660)
//   1. checkCase: every reference real (things, clues, kinds, rooms)
//   2. fairPlay: every clue reachable from the arrival, every required pillar covered by a genuine clue, on the real plan
//   3. checkNarrator: the beats and clocks parse and name only real things (the narrator refuses an unsound case at load)
//   4. the right answer of every blank is offered once its own clues are learned (appears_with), and its genuine supports exist
//   5. the truth check refuses a voiced line that names someone or something not in the facts handed to it, and passes one
//      that keeps to them (src/make/talk.js truthCheck, the guard on any line a model would voice)
//   6. the copy the page plays (lab/case/) is the case in design/case/, byte for byte
//   7. the schema (2026-10-08, after pattern-buffer's probe S1-S9): every fact a clue, claim or knows entry names exists, and
//      its truth agrees with it (a lie's fact false, a misleading clue's true); every lie has contradicts (a true fact) and its
//      breakers; every topic is real, and every knows entry is told on its topic or says why not (untold); every person,
//      thing and room a triple names exists; the timeline covers each person it must over the evening without overlaps,
//      walks only the rooms graph's doors and stairs, every sighting is mutual (seen_by and saw) and within a room or across
//      a declared sightline; every fact's positions and times hold on the timeline when true and fail when false
// Prints each finding; exits 1 on any.
//   node tools/check-case.mjs [case id] [--src file]   (--src: check that file instead, e.g. a case with a planted fault)
import fs from "node:fs";
import { planHybridE } from "../src/make/plans/hybrid-e.js";
import { GENTRY_SEAT_1660 } from "../src/make/programs/england-1660.js";
import { ROOM_TYPES_1660 } from "../src/make/rooms/england-1660.js";
// (the catalogue's kinds read from their files: the catalogue itself needs three.js, which node here hasn't)
const KINDS = new Set(fs.readdirSync("src/make/kinds").filter(f => f.endsWith(".js")).flatMap(f => [...fs.readFileSync(`src/make/kinds/${f}`, "utf8").matchAll(/\bkind: "([\w-]+\/[\w-]+)"/g)].map(m => m[1])));
import { checkCase, fairPlay, cluesOf } from "../src/make/case.js";
import { checkNarrator } from "../src/make/narrator.js";
import { truthCheck } from "../src/make/talk.js";

const argv = process.argv.slice(2), srcAt = argv.indexOf("--src"), given = srcAt >= 0 ? argv.splice(srcAt, 2)[1] : null;
const id = argv[0] || "case-1660", src = `design/case/${id}.json`, pub = `lab/case/${id}.json`;
const k = JSON.parse(fs.readFileSync(given || src, "utf8")), out = [], bad = (what) => out.push(what), t0 = performance.now();
const hearths = Object.fromEntries(Object.entries(ROOM_TYPES_1660).map(([n, v]) => [n, v.hearth]));
const plan = planHybridE(GENTRY_SEAT_1660, { hearths });

const cc = checkCase(k, { plan, kinds: KINDS });
for (const f of cc.findings || []) bad(`case: ${f.at}: ${f.what}`);
const fp = fairPlay(k, { plan });
if (!fp.ok) bad(`fair play: pillars not covered: ${fp.pillars.filter(p => !p.covered).map(p => p.id).join(", ")}`);
for (const c of fp.unreachable) bad(`fair play: clue ${c} can't be reached`);
const cn = checkNarrator(k, { rooms: plan.rooms.map(r => r.id) });
for (const f of cn.findings || []) bad(`narrator: ${f.at}: ${f.what}`);

const acc = k.accusation || {}, clueIds = new Set(cluesOf(k).map(c => c.id));
for (const b of acc.blanks || []) { const right = (b.options || []).find(o => o.id === acc.truth?.[b.id]);
  if (!right) { bad(`accusation: ${b.id} has no right option`); continue; }
  for (const c of [].concat(right.appears_with || [])) if (!clueIds.has(c)) bad(`accusation: ${b.id}.${right.id} appears with unknown clue ${c}`);
  if (right.appears_with && ![].concat(right.appears_with).some(c => fp.learned.includes(c))) bad(`accusation: ${b.id}'s right answer never appears (none of its clues reachable)`);
  const sup = [].concat(acc.supports?.[b.id] || []); if (b.id !== "suspect" && !sup.some(c => fp.learned.includes(c))) bad(`accusation: ${b.id} has no reachable support`); }

// the truth check, on lines a model might write for Dame Anne about the wound
const facts = [{ id: "anne_wound", text: "The wound was at the back of his head, round, the size of a crown piece." }];
const lexicon = [...(k.cast || []).map(c => c.name), ...(k.things || []).map(q => q.label).filter(Boolean)];
const ok1 = truthCheck("The wound was at the back of his head, sir, round as a crown piece.", { facts, lexicon, allowed: ["Dame Anne Haywood"] });
const ok2 = truthCheck("Mr Ambrose Cressy struck him with the table candlestick.", { facts, lexicon, allowed: ["Dame Anne Haywood"] });
if (!ok1.ok) bad(`truth: a line keeping to its facts was refused (${ok1.strays.join(", ")})`);
if (ok2.ok) bad("truth: a line naming what its facts don't was passed");

const ts = performance.now(), sc = checkSchema(k);
for (const f of sc) bad(`schema: ${f}`);

if (!fs.existsSync(pub) || fs.readFileSync(pub, "utf8") !== fs.readFileSync(src, "utf8")) bad(`copy: ${pub} differs from ${src}`);

console.log(`${id}: ${cluesOf(k).length} clues, ${fp.learned.length} reachable, pillars ${fp.pillars.map(p => `${p.id}${p.covered ? "" : "(open)"}`).join(" ")}, ${(k.beats || []).length} beats, ${(k.leads || []).length} leads; ${(k.facts || []).length} facts, ${(k.timeline?.intervals || []).length} intervals (schema ${(performance.now() - ts).toFixed(1)} ms); ${Math.round(performance.now() - t0)} ms`);
for (const f of out) console.log("FINDING", f);
console.log(out.length ? `${out.length} findings` : "fair and sound");
process.exit(out.length ? 1 : 0);

// 7. the schema: facts, lies, topics, the timeline (see the header)
function checkSchema(k) {
  const f = [], say = (w) => f.push(w), arr = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);
  const facts = new Map(); for (const x of arr(k.facts)) { if (facts.has(x.id)) say(`fact ${x.id} declared twice`); facts.set(x.id, x);
    if (!x.text || !Array.isArray(x.triple) || x.triple.length !== 3 || typeof x.truth !== "boolean") say(`fact ${x.id}: needs text, a triple and truth true|false`); }
  const things = new Set(arr(k.things).map(t => t.id)), clueIds = new Set(cluesOf(k).map(c => c.id));
  const people = new Set([...arr(k.cast).map(c => c.id), ...arr(k.others).map(c => c.id), k.victim?.id].filter(Boolean));
  const graph = k.rooms?.graph && fs.existsSync(k.rooms.graph) ? JSON.parse(fs.readFileSync(k.rooms.graph, "utf8")) : null;
  if (!graph) say(`rooms.graph "${k.rooms?.graph}" can't be read`);
  const rooms = new Set(arr(graph?.rooms).map(r => r.id)), next = new Map([...rooms].map(r => [r, new Set()]));
  for (const d of [...arr(graph?.doors), ...arr(graph?.stairs)]) { const [a, b] = d.joins; next.get(a)?.add(b); next.get(b)?.add(a); }
  const topics = new Set([...arr(k.topics).map(t => t.id), ...arr(k.cast).map(c => `person:${c.id}`)]);
  const refd = new Set(), ref = (at, fid, want = null) => { if (fid == null) return; refd.add(fid); const x = facts.get(fid);
    if (!x) return say(`${at} names fact "${fid}", which doesn't exist`);
    if (want != null && x.truth !== want) say(`${at}: fact ${fid} is truth:${x.truth}, but ${at.split(" ")[0]} needs it ${want}`); };
  const topicOf = (c) => c.gate?.topic || c.topic;
  // every clue, claim and knows entry points at its fact, and the fact's truth agrees with what it is
  const items = [...cluesOf(k).map(c => ["clue", c]), ...arr(k.cast).flatMap(p => [...arr(p.claims).map(c => ["claim", c, p]), ...arr(p.knows).map(c => ["knows", c, p])])];
  for (const [what, c] of items) { const at = `${what} ${c.id}`;
    if (!c.fact_id) { say(`${at} has no fact_id`); continue; }
    const lie = what === "claim" ? !!c.false : what === "clue" && c.kind === "lie";
    ref(at, c.fact_id, !lie); for (const a of arr(c.also)) ref(`${at} (also)`, a, true); if (c.yield_fact) ref(`${at} (yield)`, c.yield_fact, true);
    if (c.contradicts) ref(`${at} (contradicts)`, c.contradicts, true); if (c.suggests) ref(`${at} (suggests)`, c.suggests, false);
    if (lie) { if (!c.contradicts) say(`${at} is a lie with no contradicts`);
      const placed = (x) => x && ["at", "absent", "seen", "unseen"].some(q => arr(x[q]).length);
      if (placed(facts.get(c.fact_id)) && facts.has(c.contradicts) && !placed(facts.get(c.contradicts))) say(`${at}: its lie is placed in time, but the truth it contradicts (${c.contradicts}) is not`);
      const brk = arr(c.broken_by || c.debunked_by); if (!brk.length) say(`${at} is a lie with no breakers`);
      for (const b of brk) if (!clueIds.has(b) && !things.has(b)) say(`${at} is broken by "${b}", no clue or thing`); }
    else if (c.contradicts) say(`${at} contradicts a fact but is no lie`);
    if (what === "clue") { if (c.effect === "false" && c.kind !== "lie" && c.kind !== "misleading") say(`${at}: effect false needs kind lie|misleading`);
      if (c.kind && c.effect !== "false") say(`${at}: kind ${c.kind} on a clue whose effect isn't false`);
      if (c.kind === "misleading" && (!c.suggests || !arr(c.debunked_by).length)) say(`${at}: a misleading clue needs suggests and debunked_by`);
      if (!topicOf(c)) say(`${at} has no topic`); else if (!topics.has(topicOf(c))) say(`${at}: topic "${topicOf(c)}" is no topic of the case`); }
    if (what === "claim" && !topics.has(c.topic)) say(`${at}: topic "${c.topic}" is no topic of the case`); }
  // knows: told on a real topic (by a clue or claim of theirs stating the fact, or a claim's yield), or untold with a reason
  for (const p of arr(k.cast)) { const own = [...arr(p.clues), ...arr(p.claims)];
    for (const q of arr(p.knows)) { const at = `knows ${q.id}`;
      if (q.topic) { if (!topics.has(q.topic)) say(`${at}: topic "${q.topic}" is no topic of the case`);
        else if (!own.some(c => topicOf(c) === q.topic && [c.false ? null : c.fact_id, ...arr(c.also), c.yield_fact].includes(q.fact_id))) say(`${at}: nothing of ${p.id}'s on ${q.topic} tells ${q.fact_id}`); }
      else if (!q.untold) say(`${at} has neither a topic nor untold`); } }
  // canon's triples are facts; every fact is named by something
  for (const t of arr(k.canon?.facts)) { const x = [...facts.values()].find(x => JSON.stringify(x.triple) === JSON.stringify(t)); if (!x) say(`canon triple [${t.join(", ")}] is no fact's triple`); else refd.add(x.id); }
  for (const x of facts.values()) if (!refd.has(x.id)) say(`fact ${x.id} is named by nothing`);
  // what triples name exists
  for (const [at, t] of [...[...facts.values()].map(x => [`fact ${x.id}`, x.triple]), ...items.map(([w, c]) => [`${w} ${c.id}`, c.triple])])
    for (const m of arr(t).join(" ").matchAll(/\b(thing|person|room):([a-z0-9_]+)/gi)) {
      const ok = m[1] === "thing" ? things.has(m[2]) : m[1] === "person" ? people.has(m[2]) : rooms.has(m[2]);
      if (!ok) say(`${at}: triple names ${m[0]}, which isn't in the case`); }
  // the timeline: real people and rooms, ordered, no overlaps, the evening covered, moves along doors and stairs
  const tl = k.timeline || {}, iv = arr(tl.intervals), byWho = new Map();
  for (const i of iv) { const at = `timeline ${i.who} ${i.from}`;
    if (!people.has(i.who)) say(`${at}: no such person`);
    for (const r of [i.room, ...arr(i.via)]) if (!rooms.has(r)) say(`${at}: room "${r}" isn't in the rooms graph`);
    if (!(i.from < i.to)) say(`${at}: ends (${i.to}) before it starts`);
    if (!byWho.has(i.who)) byWho.set(i.who, []); byWho.get(i.who).push(i); }
  for (const [who, list] of byWho) { list.sort((a, b) => a.from < b.from ? -1 : 1);
    for (let n = 1; n < list.length; n++) { const a = list[n - 1], b = list[n];
      if (b.from < a.to) say(`timeline ${who}: ${a.from}-${a.to} (${a.room}) overlaps ${b.from}-${b.to} (${b.room})`);
      if (b.from === a.to) { const walk = [a.room, ...arr(b.via), b.room];
        for (let s = 1; s < walk.length; s++) if (walk[s] !== walk[s - 1] && !next.get(walk[s - 1])?.has(walk[s])) say(`timeline ${who} ${b.from}: no door or stair from ${walk[s - 1]} to ${walk[s]}`); } } }
  const ev = tl.evening || {}, must = new Set([...arr(ev.covers), ...arr(k.cast).map(c => c.id)]);
  for (const who of must) { let t = ev.from; for (const i of byWho.get(who) || []) if (i.from <= t && i.to > t) t = i.to;
    if (!(t >= ev.to)) say(`timeline ${who}: the evening isn't covered from ${t} (to ${ev.to})`); }
  // sightings: both ends declared, at once, within a room or across a declared sightline
  const lines = arr(k.rooms?.sightlines).map(l => l.between.slice().sort().join("|")), sees = (a, b) => a === b || lines.includes([a, b].sort().join("|"));
  const over = (a, b) => a.from < b.to && b.from < a.to;
  for (const i of iv) { for (const by of arr(i.seen_by)) if (!arr(byWho.get(by)).some(j => over(i, j) && arr(j.saw).includes(i.who) && sees(i.room, j.room)))
      say(`timeline ${i.who} ${i.from}: seen by ${by}, but no interval of ${by}'s then saw ${i.who} from ${i.room} or across a sightline`);
    for (const w of arr(i.saw)) if (!arr(byWho.get(w)).some(j => over(i, j) && arr(j.seen_by).includes(i.who) && sees(i.room, j.room)))
      say(`timeline ${i.who} ${i.from}: saw ${w}, but no interval of ${w}'s then is seen_by ${i.who} in ${i.room} or across a sightline`); }
  // facts' positions and times against the timeline: a true fact's all hold; a false fact's don't all hold
  const inRoom = (j, r) => j.room === r, passes = (j, r) => j.room === r || arr(j.via).includes(r);
  const covered = (who, room, from, to) => { if (from === to) return arr(byWho.get(who)).some(j => inRoom(j, room) && j.from <= from && from <= j.to);
    let t = from; for (const j of arr(byWho.get(who))) if (inRoom(j, room) && j.from <= t && j.to > t) t = j.to; return t >= to; };
  const holds = { at: (p) => covered(p.who, p.room, p.from, p.to),
    absent: (p) => !iv.some(j => (!p.who || j.who === p.who) && passes(j, p.room) && (p.from === p.to ? j.from <= p.from && p.from < j.to : over(j, p))),
    seen: (p) => arr(byWho.get(p.who)).some(j => arr(j.seen_by).includes(p.by) && (p.from === p.to ? j.from <= p.from && p.from <= j.to : over(j, p))),
    unseen: (p) => !arr(byWho.get(p.who)).some(j => arr(j.seen_by).includes(p.by) && over(j, p)) };
  for (const x of facts.values()) { const ps = Object.keys(holds).flatMap(kind => arr(x[kind]).map(p => [kind, p]));
    if (!ps.length) { if (!x.unplaced && /\b\d\d:\d\d\b/.test(x.triple.join(" "))) say(`fact ${x.id} names a time but has no placement (at/absent/seen/unseen) or unplaced`); continue; }
    for (const [kind, p] of ps) for (const r of [p.room].filter(Boolean)) if (!rooms.has(r)) say(`fact ${x.id}: ${kind} names room "${r}", not in the graph`);
    const ok = ps.map(([kind, p]) => [kind, p, holds[kind](p)]);
    if (x.truth) for (const [kind, p, h] of ok) { if (!h) say(`fact ${x.id} is true but its ${kind} ${p.who || "anyone"} ${p.room || "by " + p.by} ${p.from}${p.to !== p.from ? "-" + p.to : ""} doesn't hold on the timeline`); }
    else if (ok.every(([, , h]) => h)) say(`fact ${x.id} is false but the timeline agrees with all its placements`); }
  // the rooms the case names are in the graph and listed
  const used = new Set(arr(k.rooms?.used));
  for (const r of [k.player?.start, ...arr(k.cast).flatMap(c => [c.home, ...arr(c.presence).map(p => p.room)]), ...arr(k.things).map(t => t.at).filter(a => !things.has(a)), ...iv.flatMap(i => [i.room, ...arr(i.via)])].filter(Boolean))
    if (!used.has(r)) { say(`room ${r} is used but not in rooms.used`); used.add(r); }
  return f;
}
