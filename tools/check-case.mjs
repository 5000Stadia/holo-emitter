// Check 26 (vetted 2026-10-08, decision 7 of the 2026-10-07 session: fair play and truth): a case is fair and its words
// hold, in node, no browser, no model. node tools/check-case.mjs [case id]   (default case-1660)
//   1. checkCase: every reference real (things, clues, kinds, rooms)
//   2. fairPlay: every clue reachable from the arrival, every required pillar covered by a genuine clue, on the real plan
//   3. checkNarrator: the beats and clocks parse and name only real things (the narrator refuses an unsound case at load)
//   4. the right answer of every blank is offered once its own clues are learned (appears_with), and its genuine supports exist
//   5. the truth check refuses a voiced line that names someone or something not in the facts handed to it, and passes one
//      that keeps to them (src/make/talk.js truthCheck, the guard on any line a model would voice)
//   6. the copy the page plays (lab/case/) is the case in design/case/, byte for byte
// Prints each finding; exits 1 on any.
import fs from "node:fs";
import { planHybridE } from "../src/make/plans/hybrid-e.js";
import { GENTRY_SEAT_1660 } from "../src/make/programs/england-1660.js";
import { ROOM_TYPES_1660 } from "../src/make/rooms/england-1660.js";
// (the catalogue's kinds read from their files: the catalogue itself needs three.js, which node here hasn't)
const KINDS = new Set(fs.readdirSync("src/make/kinds").filter(f => f.endsWith(".js")).flatMap(f => [...fs.readFileSync(`src/make/kinds/${f}`, "utf8").matchAll(/\bkind: "([\w-]+\/[\w-]+)"/g)].map(m => m[1])));
import { checkCase, fairPlay, cluesOf } from "../src/make/case.js";
import { checkNarrator } from "../src/make/narrator.js";
import { truthCheck } from "../src/make/talk.js";

const id = process.argv[2] || "case-1660", src = `design/case/${id}.json`, pub = `lab/case/${id}.json`;
const k = JSON.parse(fs.readFileSync(src, "utf8")), out = [], bad = (what) => out.push(what), t0 = performance.now();
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

if (!fs.existsSync(pub) || fs.readFileSync(pub, "utf8") !== fs.readFileSync(src, "utf8")) bad(`copy: ${pub} differs from ${src}`);

console.log(`${id}: ${cluesOf(k).length} clues, ${fp.learned.length} reachable, pillars ${fp.pillars.map(p => `${p.id}${p.covered ? "" : "(open)"}`).join(" ")}, ${(k.beats || []).length} beats, ${(k.leads || []).length} leads; ${Math.round(performance.now() - t0)} ms`);
for (const f of out) console.log("FINDING", f);
console.log(out.length ? `${out.length} findings` : "fair and sound");
process.exit(out.length ? 1 : 0);
