// How well the no-model reader (src/make/intent.js) reads a real player's questions to the four suspects of case-1660:
// the corpus tests/fixtures/intent-corpus-1660.json (each question labelled with the topic and stance a good game master
// would pick, `also` the other topics one could equally pick; a quarter marked `held`, kept out of tuning: its misses
// print only with --held), read with
// the context src/make/case-play.js words() builds, in two frames: the start (nothing learned) and mid-game (about half
// the clues learned, so the topics marked `after` are open, and three things held). The proposed topic words in
// design/case/case-1660.words.json are merged into the case first (topic words; a "person:<id>" entry into that
// person's aka; --no-words leaves them out). Exits 1 if the ten typical questions of commit 4d4c1351 stop reading.
//   node tests/.intent-eval.mjs [--held] (print held-out misses too) [--no-words] [--json] [--reader path/to/intent.js] [--clue-words]
import fs from "fs";
import { topicsFor } from "../src/make/talk.js";
import { cluesOf } from "../src/make/case.js";

const H = new URL("..", import.meta.url).pathname, argv = process.argv.slice(2), args = new Set(argv);
// (--reader: another intent.js to measure, e.g. an earlier one: git show REV:src/make/intent.js > /tmp/old-intent.js)
const { readIntent } = await import(argv.includes("--reader") ? new URL(argv[argv.indexOf("--reader") + 1], `file://${process.cwd()}/`).href : "../src/make/intent.js");
const k = JSON.parse(fs.readFileSync(H + "design/case/case-1660.json", "utf8"));
const wordsFile = H + "design/case/case-1660.words.json";
if (!args.has("--no-words") && fs.existsSync(wordsFile)) { const add = JSON.parse(fs.readFileSync(wordsFile, "utf8"));
  for (const t of k.topics) if (add[t.id]) t.words = [...new Set([...(t.words || []), ...add[t.id]])];
  // (a "person:<id>" entry: more names that person answers to, merged into their aka)
  for (const c of k.cast) if (add[`person:${c.id}`]) c.aka = [...new Set([...(c.aka || []), ...add[`person:${c.id}`]])]; }
const corpus = JSON.parse(fs.readFileSync(H + "tests/fixtures/intent-corpus-1660.json", "utf8"));
const arr = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);

// the frames: nothing learned; and every other clue learned (with the two that open the `after` topics) and three things held
const all = cluesOf(k).map(c => c.id).filter(id => id !== "daniel_confession");
const frames = {
  start: { learned: new Set(), holding: new Set() },
  mid: { learned: new Set([...all.filter((_, i) => i % 2 === 0), "anne_francis_blood", "gold_note"]), holding: new Set(["key_steward", "desk1_candle", "draft_steward"]) },
};
const clueLabel = new Map(cluesOf(k).map(c => [c.id, c.label]));
const label = (id) => clueLabel.get(id) || arr(k.things).find(t => t.id === id)?.label || id.replace(/_/g, " ");
// the context exactly as case-play.js words() builds it
// (--clue-words: a topic that comes in by a suspect's clue or claim carries the case topic's words too; talk.js's
// topicsFor gives it only its label today, so Francis's "hand" before it opens is read by "cut hand" alone)
const caseWords = new Map(k.topics.map(t => [t.id, t.words]));
const ctxOf = (who, frame) => ({
  topics: topicsFor(k, who, frame).filter(t => !t.id.startsWith("person:")).map(t => args.has("--clue-words") && !t.words && caseWords.get(t.id) ? { ...t, words: caseWords.get(t.id) } : t),
  people: arr(k.cast).filter(c => c.id !== who).map(c => ({ id: c.id, name: c.name, aka: c.aka })),
  evidence: [...[...frame.learned].map(id => ({ id, label: label(id), kind: "clue" })), ...[...frame.holding].map(id => ({ id, label: label(id), kind: "thing" }))],
});

// what the suspect's own clues and claims are about (readIntent's `own`, a tie-break): case-play.js doesn't pass it yet
const ownOf = (who) => { const p = arr(k.cast).find(c => c.id === who); return [...new Set([...arr(p.clues).map(c => c.gate?.topic || c.topic), ...arr(p.claims).map(c => c.topic)])]; };
function run(items, frameName, withOwn = false) {
  const frame = frames[frameName], rows = [];
  for (const it of items) {
    const ctx = { ...ctxOf(it.who, frame), ...(withOwn ? { own: ownOf(it.who) } : {}) }, open = new Set([...ctx.topics.map(t => t.id), ...ctx.people.map(p => `person:${p.id}`)]);
    // what counts as right here: the label and its equals that are open in this frame; a closed one reads right as none
    let want = it.topic === "*" ? null : it.topic === "none" ? ["none"] : [it.topic, ...arr(it.also)].filter(t => open.has(t));
    if (want && !want.length) want = ["none"];
    const t0 = performance.now(), r = readIntent(it.q, ctx), ms = performance.now() - t0;
    rows.push({ it, r, ms, want, topicOk: !want || want.includes(r.topic), stanceOk: r.stance === it.stance || arr(it.stanceAlso).includes(r.stance) });
  }
  return rows;
}
const pct = (n, d) => d ? `${(100 * n / d).toFixed(1)}%` : "-";
function stats(rows) {
  const graded = rows.filter(x => x.want), wantTopic = graded.filter(x => x.want[0] !== "none"), wantNone = graded.filter(x => x.want[0] === "none");
  return {
    n: rows.length,
    topic: graded.filter(x => x.topicOk).length / graded.length,
    stance: rows.filter(x => x.stanceOk).length / rows.length,
    both: rows.filter(x => x.topicOk && x.stanceOk).length / rows.length,
    noneRate: wantTopic.filter(x => x.r.topic === "none").length / Math.max(1, wantTopic.length),        // a topic was there, read none
    wrongTopic: wantTopic.filter(x => x.r.topic !== "none" && !x.topicOk).length / Math.max(1, wantTopic.length), // read a wrong topic
    falseTopic: wantNone.filter(x => x.r.topic !== "none").length / Math.max(1, wantNone.length),          // should be none, read a topic
    raw: { graded: graded.length, topicOk: graded.filter(x => x.topicOk).length },
  };
}
const line = (name, s) => `${name.padEnd(16)} n=${String(s.n).padStart(3)}  topic ${pct(s.topic * 1e3, 1e3).padStart(6)}  stance ${pct(s.stance * 1e3, 1e3).padStart(6)}  both ${pct(s.both * 1e3, 1e3).padStart(6)}  read-none ${pct(s.noneRate * 1e3, 1e3).padStart(6)}  wrong-topic ${pct(s.wrongTopic * 1e3, 1e3).padStart(6)}  off-topic-read ${pct(s.falseTopic * 1e3, 1e3).padStart(6)}`;

const out = {}; let reads = 0, ms = 0, worst = 0;
for (const split of ["train", "held"]) for (const f of Object.keys(frames)) {
  const rows = run(corpus.filter(x => !!x.held === (split === "held")), f); out[`${split}/${f}`] = rows;
  for (const x of rows) { reads++; ms += x.ms; worst = Math.max(worst, x.ms); }
}
if (args.has("--json")) { console.log(JSON.stringify(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, stats(v)])))); process.exit(0); }
for (const [key, rows] of Object.entries(out)) {
  console.log(line(key, stats(rows)));
  for (const who of ["daniel", "cressy", "francis", "anne"]) console.log(line(`  ${who}`, stats(rows.filter(x => x.it.who === who))));
}
const tot = (split) => stats([...out[`${split}/start`], ...out[`${split}/mid`]]);
console.log(`\nTRAIN both frames: ${line("", tot("train")).trim()}\nHELD  both frames: ${line("", tot("held")).trim()}`);
const own = (split) => stats(["start", "mid"].flatMap(f => run(corpus.filter(x => !!x.held === (split === "held")), f, true)));
console.log(`with own (case-play passing the suspect's own topics):\nTRAIN both frames: ${line("", own("train")).trim()}\nHELD  both frames: ${line("", own("held")).trim()}`);
console.log(`reads ${reads}, mean ${(ms / reads).toFixed(3)} ms, worst ${worst.toFixed(2)} ms`);

// the misses (held-out ones only with --held, so they are not tuned against)
for (const [key, rows] of Object.entries(out)) { if (key.startsWith("held") && !args.has("--held")) continue;
  const miss = rows.filter(x => !x.topicOk || !x.stanceOk); if (!miss.length) continue;
  console.log(`\n-- misses ${key} (${miss.length})`);
  for (const x of miss) console.log(`  ${x.it.who.padEnd(7)} ${JSON.stringify(x.it.q).padEnd(62)} want ${(x.want || ["*"]).join("|")}/${x.it.stance}  got ${x.r.topic}/${x.r.stance}   ${x.r.why.join("; ")}`);
}

// the ten typical questions of commit 4d4c1351 (Hand's cut hand open, as then): must keep reading as they did
const TEN = [["francis", "You quarrelled with the steward at supper. Why?", "steward"], ["francis", "How did you cut your hand?", "hand"], ["daniel", "What time did you leave the muniment room?", "whereabouts"], ["cressy", "Tell me about the lead mines.", "mines"], ["anne", "Who struck him?", "wound", "death"], ["daniel", "Did anyone scrape the deed?", "deed"], ["anne", "What happened to the candle?", "candle"], ["cressy", "How much did you win at cards?", "cards"], ["daniel", "Where were you when the clock struck eleven?", "whereabouts"], ["anne", "Who opened the door this morning?", "morning"]];
const tenFrame = { learned: new Set(["anne_francis_blood"]), holding: new Set() };
let tenOk = 0; const tenBad = [];
for (const [who, q, ...want] of TEN) { const r = readIntent(q, { ...ctxOf(who, tenFrame), evidence: [] }); if (want.includes(r.topic) && r.stance === "ask") tenOk++; else tenBad.push(`${who}: ${q} -> ${r.topic}/${r.stance}`); }
console.log(`\nthe ten typical questions (4d4c1351): ${tenOk} of 10${tenBad.length ? "\n  " + tenBad.join("\n  ") : ""}`);
if (tenOk < 10) process.exitCode = 1;
