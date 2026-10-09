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
//   8. the schema, round 2 (2026-10-08, after pattern-buffer's re-probe and the case-sim study): every interval is half-open,
//      an instant in [from, to) only; a liar's knows holds the truth each of his lies denies, and everyone's knows holds what
//      they tell; things that move have a timeline (one holder or place at a time, no overlaps, a holder on the timeline
//      while holding, a hand-off made in one room by someone there, and at play's opening where play starts them); door
//      states (real doors, one state at a time, no one through a locked door without its key, a sightline through a door
//      only while it is open, play's door locks as doors has them); no two facts give one subject and predicate two values
//      without a time between them or a declared contradiction; every knows entry says how it was learned, and a 'saw'
//      had the knower in sight of every placement of the fact
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

console.log(`${id}: ${cluesOf(k).length} clues, ${fp.learned.length} reachable, pillars ${fp.pillars.map(p => `${p.id}${p.covered ? "" : "(open)"}`).join(" ")}, ${(k.beats || []).length} beats, ${(k.leads || []).length} leads; ${(k.facts || []).length} facts, ${(k.timeline?.intervals || []).length} intervals, ${(k.timeline?.things || []).length} thing stints, ${(k.timeline?.doors || []).length} door states (schema ${(performance.now() - ts).toFixed(1)} ms); ${Math.round(performance.now() - t0)} ms`);
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
      const placed = (x) => x && ["at", "absent", "seen", "unseen", "held"].some(q => arr(x[q]).length);
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
      else if (!q.untold) say(`${at} has neither a topic nor untold`); }
    // a person's frame holds what they tell (a clue or claim that is no lie, what it also states, a yield) and the truth
    // each of their lies denies: a liar knows what he hides
    const known = new Set(arr(p.knows).map(q => q.fact_id));
    for (const c of own) { const lie = !!c.false || c.kind === "lie";
      for (const fid of [lie ? null : c.fact_id, ...arr(c.also), c.yield_fact].filter(Boolean)) if (!known.has(fid)) say(`${c.id}: ${p.id} tells ${fid}, which isn't in their knows`);
      if (lie && c.contradicts && !known.has(c.contradicts)) say(`${c.id}: ${p.id}'s lie denies ${c.contradicts}, which isn't in their knows`); } }
  // canon's triples are facts; every fact is named by something
  for (const t of arr(k.canon?.facts)) { const x = [...facts.values()].find(x => JSON.stringify(x.triple) === JSON.stringify(t)); if (!x) say(`canon triple [${t.join(", ")}] is no fact's triple`); else refd.add(x.id); }
  for (const x of facts.values()) if (!refd.has(x.id)) say(`fact ${x.id} is named by nothing`);
  // what triples name exists
  for (const [at, t] of [...[...facts.values()].map(x => [`fact ${x.id}`, x.triple]), ...items.map(([w, c]) => [`${w} ${c.id}`, c.triple])])
    for (const m of arr(t).join(" ").matchAll(/\b(thing|person|room):([a-z0-9_]+)/gi)) {
      const ok = m[1] === "thing" ? things.has(m[2]) : m[1] === "person" ? people.has(m[2]) : rooms.has(m[2]);
      if (!ok) say(`${at}: triple names ${m[0]}, which isn't in the case`); }
  // the timeline: real people and rooms, ordered, no overlaps, the evening covered, moves along doors and stairs.
  // Every interval is half-open, [from, to): an instant t is in it when from <= t < to.
  const tl = k.timeline || {}, iv = arr(tl.intervals), byWho = new Map();
  const tAt = (list, t) => arr(list).find(j => j.from <= t && t < j.to);
  const over = (a, b) => a.from < b.to && b.from < a.to;
  const range = { from: tl.evening?.from, to: tl.morning?.to || tl.evening?.to }, play = tl.morning?.play;
  const inRange = (t) => t >= range.from && t < range.to;
  for (const i of iv) { const at = `timeline ${i.who} ${i.from}`;
    if (!people.has(i.who)) say(`${at}: no such person`);
    for (const r of [i.room, ...arr(i.via)]) if (!rooms.has(r)) say(`${at}: room "${r}" isn't in the rooms graph`);
    if (!(i.from < i.to)) say(`${at}: ends (${i.to}) before it starts`);
    if (!byWho.has(i.who)) byWho.set(i.who, []); byWho.get(i.who).push(i); }
  for (const list of byWho.values()) list.sort((a, b) => a.from < b.from ? -1 : 1);
  const coveredBy = (list, a, b, ok = () => true) => { let t = a; for (const j of arr(list)) if (j.from <= t && j.to > t && ok(j, t)) t = j.to; return t >= b; };
  // doors: real openings, one state at a time; a sightline through a door holds only while it stands open
  const doorDefs = new Map(arr(graph?.doors).map(d => [d.id, d])), byDoor = new Map();
  for (const d of arr(tl.doors)) { const at = `door ${d.door} ${d.from}`;
    if (!doorDefs.has(d.door)) say(`${at}: no such door in the rooms graph`);
    if (!["open", "shut", "locked"].includes(d.state)) say(`${at}: state "${d.state}" isn't open, shut or locked`);
    if (!(d.from < d.to)) say(`${at}: ends (${d.to}) before it starts`);
    if (!byDoor.has(d.door)) byDoor.set(d.door, []); byDoor.get(d.door).push(d); }
  for (const [door, list] of byDoor) { list.sort((a, b) => a.from < b.from ? -1 : 1);
    for (let n = 1; n < list.length; n++) if (list[n].from < list[n - 1].to) say(`door ${door}: ${list[n - 1].from}-${list[n - 1].to} (${list[n - 1].state}) overlaps ${list[n].from}-${list[n].to} (${list[n].state})`); }
  const isOpen = (j) => j.state === "open";
  const doorOpen = (door, a, b, all) => a === b ? tAt(byDoor.get(door), a)?.state === "open"
    : all ? coveredBy(byDoor.get(door), a, b, isOpen) : arr(byDoor.get(door)).some(d => isOpen(d) && d.from < b && a < d.to);
  const lines = new Map(arr(k.rooms?.sightlines).map(l => [l.between.slice().sort().join("|"), l]));
  for (const l of lines.values()) if (l.through) { const d = doorDefs.get(l.through);
    if (!d) say(`sightline ${l.between.join("|")}: through "${l.through}", no door of the rooms graph`);
    else if (d.joins.slice().sort().join("|") !== l.between.slice().sort().join("|")) say(`sightline ${l.between.join("|")}: door ${l.through} doesn't join those rooms`); }
  // in sight from room a of room b over [from, to): the same room, or a sightline whose door is open (at some moment, or all of it)
  const sight = (a, b, from, to, all = false) => { if (a === b) return true; const l = lines.get([a, b].sort().join("|"));
    return !!l && (!l.through || doorOpen(l.through, from, to, all)); };
  // the things that move or change hands: where each was, with whom; built things or the unbuilt the timeline names
  const unbuilt = new Map(arr(tl.unbuilt).map(u => [u.id, u])), thingDef = new Map(arr(k.things).map(t => [t.id, t])), byThing = new Map();
  for (const s of arr(tl.things)) { const at = `thing ${s.thing} ${s.from}`;
    if (!things.has(s.thing) && !unbuilt.has(s.thing)) say(`${at}: no such thing (things or timeline.unbuilt)`);
    if (!s.holder === !s.place) say(`${at}: needs a holder or a place, one of them`);
    if (s.holder && !people.has(s.holder)) say(`${at}: holder "${s.holder}" is no person`);
    if (s.place && !rooms.has(s.place) && !things.has(s.place) && !unbuilt.has(s.place)) say(`${at}: place "${s.place}" is no room or thing`);
    if (s.by && !people.has(s.by)) say(`${at}: by "${s.by}" is no person`);
    if (!(s.from < s.to)) say(`${at}: ends (${s.to}) before it starts`);
    if (!byThing.has(s.thing)) byThing.set(s.thing, []); byThing.get(s.thing).push(s); }
  for (const list of byThing.values()) list.sort((a, b) => a.from < b.from ? -1 : 1);
  const roomOf = (id, t, n = 0) => { if (n > 8) return null; if (rooms.has(id)) return id;
    const s = tAt(byThing.get(id), t); if (s) return s.holder ? tAt(byWho.get(s.holder), t)?.room || null : roomOf(s.place, t, n + 1);
    const d = thingDef.get(id); return d?.at ? roomOf(d.at, t, n + 1) : null; };
  const stintRoom = (s, t) => s.holder ? tAt(byWho.get(s.holder), t)?.room || null : roomOf(s.place, t);
  for (const [thing, list] of byThing) for (let n = 0; n < list.length; n++) { const b = list[n], a = list[n - 1], at = `thing ${thing} ${b.from}`;
    if (a && b.from < a.to) say(`thing ${thing}: ${a.from}-${a.to} overlaps ${b.from}-${b.to}`);
    // a holder is on the timeline for all of the holding the timeline spans
    if (b.holder && b.from < range.to && b.to > range.from) { const lo = b.from > range.from ? b.from : range.from, hi = b.to < range.to ? b.to : range.to;
      if (!coveredBy(byWho.get(b.holder), lo, hi)) say(`${at}: held by ${b.holder}, who isn't on the timeline all of ${lo}-${hi}`); }
    // a hand-off is made where both ends are: the room it was in is the room it goes to, and whoever moved it was there
    if (a && b.from === a.to && inRange(b.from)) { const t = b.from, ra = stintRoom(a, t), rb = stintRoom(b, t);
      if (!ra || !rb) say(`${at}: the hand-off can't be placed in a room (${a.holder || a.place} to ${b.holder || b.place})`);
      else if (ra !== rb) say(`${at}: handed from ${a.holder || a.place} (in ${ra}) to ${b.holder || b.place} (in ${rb}), not in one room`);
      if (a.place && b.place && a.place !== b.place && !b.by) say(`${at}: moved from ${a.place} to ${b.place} by no one (by)`);
      if (b.by && rb && tAt(byWho.get(b.by), t)?.room !== rb) say(`${at}: put there by ${b.by}, who isn't in ${rb} at ${t}`); } }
  // where play opens, things, doors and people are where the case puts them
  if (play) { for (const [thing, list] of byThing) { const s = tAt(list, play), d = thingDef.get(thing); if (!s || !d) continue;
      if (s.holder || s.place !== d.at || (d.rel && s.rel !== d.rel)) say(`thing ${thing}: at ${play} the timeline has it ${s.holder ? "with " + s.holder : (s.rel || "at") + " " + s.place}, but play starts it ${d.rel || "at"} ${d.at}`);
      for (const [q, v] of Object.entries(s.state || {})) if (d.state?.[q] !== v) say(`thing ${thing}: its ${q} at ${play} is ${v} on the timeline, ${d.state?.[q]} where play starts`); }
    for (const [door, list] of byDoor) { const s = tAt(list, play), d = k.doors?.[door]; if (s && d && (s.state === "locked") !== !!d.locked) say(`door ${door}: ${s.state} at ${play} on the timeline, but doors.${door} has locked:${!!d.locked}`); }
    for (const c of arr(k.cast)) { const j = tAt(byWho.get(c.id), play); if (!j || j.room !== c.home) say(`timeline ${c.id}: in ${j?.room || "nowhere"} at ${play}, but play starts them in ${c.home}`); } }
  // moves: along doors and stairs, and through no door locked across the move unless the mover holds a key to it
  const holdsKey = (who, t, lock) => !!lock && arr(tl.things).some(s => s.holder === who && s.from <= t && t < s.to && (thingDef.get(s.thing) || unbuilt.get(s.thing))?.key === lock);
  const lockedAcross = (door, t) => { const list = byDoor.get(door); return tAt(list, t)?.state === "locked" && arr(list).some(d => d.from < t && t <= d.to && d.state === "locked"); };
  for (const [who, list] of byWho)
    for (let n = 1; n < list.length; n++) { const a = list[n - 1], b = list[n];
      if (b.from < a.to) say(`timeline ${who}: ${a.from}-${a.to} (${a.room}) overlaps ${b.from}-${b.to} (${b.room})`);
      if (b.from === a.to) { const walk = [a.room, ...arr(b.via), b.room];
        for (let s = 1; s < walk.length; s++) { const [r1, r2] = [walk[s - 1], walk[s]]; if (r1 === r2) continue;
          if (!next.get(r1)?.has(r2)) { say(`timeline ${who} ${b.from}: no door or stair from ${r1} to ${r2}`); continue; }
          const ways = [...arr(graph?.doors), ...arr(graph?.stairs)].filter(d => d.joins.includes(r1) && d.joins.includes(r2));
          if (ways.every(d => d.kind === "door" && lockedAcross(d.id, b.from) && !holdsKey(who, b.from, k.doors?.[d.id]?.key)))
            say(`timeline ${who} ${b.from}: passes ${ways.map(d => d.id).join("/")} from ${r1} to ${r2} while it is locked, holding no key to it`); } } }
  const ev = tl.evening || {}, must = new Set([...arr(ev.covers), ...arr(k.cast).map(c => c.id)]);
  for (const who of must) { let t = ev.from; for (const i of byWho.get(who) || []) if (i.from <= t && i.to > t) t = i.to;
    if (!(t >= ev.to)) say(`timeline ${who}: the evening isn't covered from ${t} (to ${ev.to})`); }
  // sightings: both ends declared, at once, within a room or across a declared sightline whose door is open then
  const sees = (i, j) => sight(i.room, j.room, i.from > j.from ? i.from : j.from, i.to < j.to ? i.to : j.to);
  for (const i of iv) { for (const by of arr(i.seen_by)) if (!arr(byWho.get(by)).some(j => over(i, j) && arr(j.saw).includes(i.who) && sees(i, j)))
      say(`timeline ${i.who} ${i.from}: seen by ${by}, but no interval of ${by}'s then saw ${i.who} from ${i.room} or across a sightline (its door open)`);
    for (const w of arr(i.saw)) if (!arr(byWho.get(w)).some(j => over(i, j) && arr(j.seen_by).includes(i.who) && sees(i, j)))
      say(`timeline ${i.who} ${i.from}: saw ${w}, but no interval of ${w}'s then is seen_by ${i.who} in ${i.room} or across a sightline (its door open)`); }
  // facts' positions and times against the timeline: a true fact's all hold; a false fact's don't all hold
  const inRoom = (j, r) => j.room === r, passes = (j, r) => j.room === r || arr(j.via).includes(r);
  const covered = (who, room, from, to) => from === to ? !!tAt(byWho.get(who), from) && inRoom(tAt(byWho.get(who), from), room) : coveredBy(byWho.get(who), from, to, j => inRoom(j, room));
  const holder = (p) => (s) => p.by ? s.holder === p.by : s.place === p.place;
  const holds = { at: (p) => covered(p.who, p.room, p.from, p.to),
    absent: (p) => !iv.some(j => (!p.who || j.who === p.who) && passes(j, p.room) && (p.from === p.to ? j.from <= p.from && p.from < j.to : over(j, p))),
    seen: (p) => arr(byWho.get(p.who)).some(j => arr(j.seen_by).includes(p.by) && (p.from === p.to ? j.from <= p.from && p.from < j.to : over(j, p))),
    unseen: (p) => !arr(byWho.get(p.who)).some(j => arr(j.seen_by).includes(p.by) && over(j, p)),
    held: (p) => p.from === p.to ? !!tAt(byThing.get(p.thing), p.from) && holder(p)(tAt(byThing.get(p.thing), p.from)) : coveredBy(byThing.get(p.thing), p.from, p.to, holder(p)) };
  const placements = (x) => Object.keys(holds).flatMap(kind => arr(x[kind]).map(p => [kind, p]));
  const show = (kind, p) => `${kind} ${kind === "held" ? `${p.thing} ${p.by ? "by " + p.by : "in " + p.place}` : `${p.who || "anyone"} ${p.room || "by " + p.by}`} ${p.from}${p.to !== p.from ? "-" + p.to : ""}`;
  for (const x of facts.values()) { const ps = placements(x);
    if (!ps.length) { if (!x.unplaced && /\b\d\d:\d\d\b/.test(x.triple.join(" "))) say(`fact ${x.id} names a time but has no placement (at/absent/seen/unseen/held) or unplaced`); continue; }
    for (const [kind, p] of ps) { if (p.room && !rooms.has(p.room)) say(`fact ${x.id}: ${kind} names room "${p.room}", not in the graph`);
      if (kind === "held" && !byThing.has(p.thing)) say(`fact ${x.id}: held names ${p.thing}, which has no timeline`); }
    const ok = ps.map(([kind, p]) => [kind, p, holds[kind](p)]);
    if (x.truth) for (const [kind, p, h] of ok) { if (!h) say(`fact ${x.id} is true but its ${show(kind, p)} doesn't hold on the timeline`); }
    else if (ok.every(([, , h]) => h)) say(`fact ${x.id} is false but the timeline agrees with all its placements`); }
  // no collisions: two facts giving one subject and predicate two values need a time between them (their placements
  // apart), or to be a declared contradiction (a lie and the truth it contradicts, a misleading truth and what it suggests)
  const declared = new Set(items.flatMap(([, c]) => [c.contradicts, c.suggests].filter(Boolean).map(o => [c.fact_id, o].sort().join("|"))));
  const when = (x) => { const ps = placements(x).map(([, p]) => p); return ps.length ? [ps.reduce((m, p) => p.from < m ? p.from : m, ps[0].from), ps.reduce((m, p) => p.to > m ? p.to : m, ps[0].to)] : null; };
  const bySP = new Map(); for (const x of facts.values()) { const sp = `${x.triple[0]} ${x.triple[1]}`; if (!bySP.has(sp)) bySP.set(sp, []); bySP.get(sp).push(x); }
  for (const [sp, list] of bySP) for (let a = 0; a < list.length; a++) for (let b = a + 1; b < list.length; b++) { const [x, y] = [list[a], list[b]];
    if (x.triple[2] === y.triple[2] || declared.has([x.id, y.id].sort().join("|"))) continue;
    const [wx, wy] = [when(x), when(y)]; if (wx && wy && (wx[1] < wy[0] || wy[1] < wx[0])) continue;
    say(`facts ${x.id} and ${y.id} give "${sp}" two values with no time between them`); }
  // how each thing was learned; a 'saw' is held to the timeline: the knower was in sight of every placement of the fact
  const HOW = new Set(["saw", "told", "inferred", "routine"]);
  const inSight = (who, room, from, to) => { const list = byWho.get(who);
    if (from === to) { const j = tAt(list, from); return (!!j && sight(j.room, room, from, from)) || arr(list).some(j => (j.from === from && passes(j, room)) || (j.to === from && j.room === room)); }
    return coveredBy(list, from, to, (j, t) => sight(j.room, room, t, j.to < to ? j.to : to, true)); };
  const witnessed = (who, kind, p) => ({
    at: () => p.who === who || inSight(who, p.room, p.from, p.to),
    absent: () => p.who === who || inSight(who, p.room, p.from, p.to),
    seen: () => p.by === who || (p.who === who && arr(byWho.get(who)).some(j => (p.from === p.to ? j.from <= p.from && p.from < j.to : over(j, p)) && arr(j.saw).includes(p.by)))
      || (!!tAt(byWho.get(p.who), p.from) && inSight(who, tAt(byWho.get(p.who), p.from).room, p.from, p.to)),
    unseen: () => p.by === who,
    held: () => p.by === who || (!!roomOf(p.thing, p.from) && inSight(who, roomOf(p.thing, p.from), p.from, p.to)) })[kind]();
  for (const c of arr(k.cast)) for (const q of arr(c.knows)) { const at = `knows ${q.id}`;
    if (!HOW.has(q.how)) { say(`${at}: how "${q.how}" isn't saw, told, inferred or routine`); continue; }
    if (q.from && !people.has(q.from) && q.from !== "the household") say(`${at}: told from "${q.from}", no person (or "the household")`);
    if (q.how !== "saw" || !facts.has(q.fact_id)) continue;
    for (const [kind, p] of placements(facts.get(q.fact_id))) if (inRange(p.from) && !witnessed(c.id, kind, p))
      say(`${at}: ${c.id} 'saw' ${q.fact_id}, but the timeline doesn't have them in sight of its ${show(kind, p)}`); }
  // the rooms the case names are in the graph and listed
  const used = new Set(arr(k.rooms?.used));
  for (const r of [k.player?.start, ...arr(k.cast).flatMap(c => [c.home, ...arr(c.presence).map(p => p.room)]), ...arr(k.things).map(t => t.at).filter(a => !things.has(a)), ...iv.flatMap(i => [i.room, ...arr(i.via)]), ...arr(tl.things).map(s => s.place).filter(p => rooms.has(p))].filter(Boolean))
    if (!used.has(r)) { say(`room ${r} is used but not in rooms.used`); used.add(r); }
  return f;
}
