// What the player's own words ask (M7, R57; design/case/prior-art-interrogation.md: Facade, Mateas & Stern, mapped free
// text to a closed set of discourse acts with permissive templates, no model): a topic from the closed list and a
// stance (ask, press, show, accuse), in a few milliseconds and with no model. When nothing matches well enough it
// says "none", and the model (if the relay is there) or the topic chips take over: the no-model game is whole.
//   readIntent(text, { topics: [{ id, label, words? }], people: [{ id, name, aka? }], evidence: [{ id, label, words? }] })
//     -> { topic, stance, evidence, score, why }
const STOP = new Set("a an the of to in on at by for with and or but is are was were be been am do did does you your yours i me my mine we us our it its that this these those there here what which who whom whose why how when where tell say said about any some all no not ever just then than so as if from into upon unto thee thou thy ye sir madam master mistress pray prithee".split(" "));
// (a word's stem: endings off, a final e off, a doubled last letter single: scrape, scraped and scraping meet)
const stem = (w) => (w.length > 4 ? w.replace(/(ings|ing|edly|ed|ies|es|s|ly)$/, (m) => (m === "ies" ? "y" : "")) : w).replace(/e$/, "").replace(/(.)\1$/, "$1");
const words = (s) => (s || "").toLowerCase().replace(/[’']/g, "'").replace(/[^a-z' ]/g, " ").split(/\s+/).filter(w => w && !STOP.has(w)).map(stem);
// stance cues, strongest first
const CUES = [
  ["accuse", /\b(i accuse|you (killed|murdered|did it|poisoned|struck)|it was you|you are the (murderer|killer)|confess)\b/i],
  ["show", /\b(look at|see this|what of this|explain this|how do you account|i (found|have) (this|here)|read this)\b/i],
  ["press", /\b(you('re| are) lying|liar|that('s| is) (a lie|false|not true)|come now|the truth|i don'?t believe|nonsense|you lie|speak plainly|again)\b/i],
];

const TEMPLATES = [
  [/\bwhere (were|was) (you|he|she|they)\b|\byour whereabouts\b|\balibi\b|\bwhat were you doing\b|\b(what time|when) did you (leave|go|come|retire)\b/i, ["whereabouts", "alibi", "where"]],
  [/\b(last|when did you) see (him|her)\b|\blast saw\b/i, ["last_seen", "last seen", "whereabouts"]],
  [/\bwho (had|has|kept|keeps|held) the key\b|\bwho (could|can) (open|lock)\b/i, ["key", "lock"]],
  [/\bhow did (he|she) die\b|\bwhat killed\b|\bcause of (his|her|the) death\b/i, ["death", "body", "died"]],
  [/\bwhy would\b|\bwho (gains|profits|benefits)\b|\bwho would want\b/i, ["motive", "will", "sale", "inherit"]],
];

export function readIntent(text, { topics = [], people = [], evidence = [] } = {}) {
  const w = new Set(words(text)), why = [];
  let stance = "ask"; for (const [s, re] of CUES) if (re.test(text)) { stance = s; why.push(`stance:${s}`); break; }
  // evidence named: a clue or a thing the player holds, by its words
  let ev = null, evScore = 0;
  for (const e of evidence) { const k = new Set(words(`${e.label} ${(e.words || []).join(" ")}`)); const s = [...k].filter(x => w.has(x)).length / Math.max(1, Math.min(3, k.size)); if (s > evScore) { evScore = s; ev = e.id; } }
  // (naming a thing is not showing it: "who had the key?" asks about the key; only a cue shows it)
  if (ev && evScore >= 0.5 && stance === "show") why.push(`shows ${ev}`);
  // the topic: the best overlap of the words with a topic's label and words, or a person's name (a topic person:<id>)
  const cands = [...topics.map(t => ({ id: t.id, k: new Set(words(`${t.label} ${(t.words || []).join(" ")}`)) })),
    ...people.map(p => ({ id: `person:${p.id}`, k: new Set(words(`${p.name} ${(p.aka || []).join(" ")}`)) }))];
  let best = null, score = 0, second = 0;
  // the score: how many of its words were said (a topic with many words isn't penalised for having them); sure only
  // when one leads
  for (const c of cands) { const s = [...c.k].filter(x => w.has(x)).length; if (!s) continue;
    if (s > score) { second = score; score = s; best = c.id; } else if (s > second) second = s; }
  // the common questions, as phrases (their words are all small words), pointing at the topic whose id or label holds
  // the hint: "where were you" at the whereabouts, "when did you last see him" at the last sighting
  if (!best || score < 1 || score === second) for (const [re, hints] of TEMPLATES) if (re.test(text)) { const t = topics.find(t => hints.some(h => `${t.id} ${t.label}`.toLowerCase().includes(h)));
    if (t) { best = t.id; score = 9; second = 0; why.push(`template → ${t.id}`); break; } }
  const sure = best && score >= 1 && score > second;
  if (sure) why.push(`topic ${best} (${score.toFixed(2)})`); else why.push(best ? `unsure: ${best} ${score.toFixed(2)} vs ${second.toFixed(2)}` : "no topic words");
  return { topic: sure ? best : "none", stance, evidence: stance === "show" ? ev : null, score: +score.toFixed(2), why };
}
