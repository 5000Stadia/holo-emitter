// What the player's own words ask (M7, R57; design/case/prior-art-interrogation.md: Facade, Mateas & Stern, mapped free
// text to a closed set of discourse acts with permissive templates, no model): a topic from the closed list and a
// stance (ask, press, show, accuse), with no model: ~0.1 ms a read once warm, ~0.5 ms on a context it hasn't seen
// (the first read of all ~12 ms, compiling). When nothing matches well enough it
// says "none", and the model (if the relay is there) or the topic chips take over: the no-model game is whole.
//   readIntent(text, { topics: [{ id, label, words? }], people: [{ id, name, aka? }], evidence: [{ id, label, words? }],
//                      own?: [topic ids of the suspect's own clues and claims], last?: topic id last asked })
//     -> { topic, stance, evidence, score, why }
// Measured against 264 phone-typed questions to the four suspects of case-1660 (tests/fixtures/intent-corpus-1660.json,
// a quarter held out from tuning): node tests/.intent-eval.mjs.
//
// How it reads, in order:
//  1. the text made plain: chat spellings (u, ur, wat, nite), contractions, numbers as words, a greeting dropped
//  2. its words, each stemmed; a word in a synonym group brings the group (slain → kill, lawyer → attorney); a word
//     the reader does not know, of five letters or more, meets a known one a letter or two away (engrosment →
//     engrossment, dnaiel → daniel); a word with its vowels dropped meets one with the same consonants (hnd → hand)
//  3. each topic scored by how many of the player's words point at it (a synonym 0.9, a near spelling 0.8); the
//     general words (where, night, last…) count once a topic and weakly; a time ("at eleven") and a few phrase
//     templates ("where were you", "who had the key") vote for the topic their hint names
//  4. each person by name, surname or what they're called (a two-word name like "the London man" needs both);
//     "she" the one woman not being questioned, "he/him" the deceased (the topic that answers to "victim") when no
//     one else was named; a question with no "you" in it that names someone is about them ("where was Francis?")
//  5. the best leads; a tie goes to the suspect's own topic (when told them), then to the topic named first; a
//     greeting or anything with no topic word reads "none"
const STOP = new Set(("a an the of to in on at by for with and or but is are was were be been being am do did does doing done you your yours yourself i me my mine " +
  "we us our it its that this these those there here what which who whom whose why how when where tell say said about any some all no not ever just then than so as if from " +
  "into upon unto thee thou thy thine ye sir madam pray prithee he she him her his hers they them their himself herself myself itself " +
  "would could should can will shall may might must have has had having get got let lets know think make made very much many really please " +
  "out up down over off again also only too still yet both each other own same such ah oh well now anything something nothing everything anyone someone " +
  "go went gone going come came coming like one ok okay hey hi hello yes yeah").split(/\s+/));
// a title alone says little ("master" is also the steward's word for his man): it counts a quarter
const TITLES = new Set("mr mrs master mistress dame lady sir madam miss young old".split(" "));
// the general words: said often, about much; a topic counts the best one of them once, at 0.6
const WEAK = new Set("where night evening yesterday late hour clock last time light play master money first copy head lost won note found".split(" "));
// chat and phone spellings, and the period's own small words
const CHAT = { u: "you", ur: "your", r: "are", y: "why", wat: "what", wot: "what", wut: "what", wher: "where", whr: "where", wen: "when", wer: "were",
  nite: "night", tonite: "tonight", lst: "last", abt: "about", bout: "about", b4: "before", cuz: "because", coz: "because", thru: "through", teh: "the",
  pls: "please", plz: "please", ppl: "people", hes: "he is", shes: "she is", whos: "who is", wheres: "where is", thats: "that is", dont: "do not",
  didnt: "did not", wasnt: "was not", werent: "were not", youre: "you are", im: "i am", ive: "i have", idk: "i do not know", yr: "your", whn: "when",
  wast: "were", wert: "were", didst: "did", dost: "do", doth: "does", hast: "have", hath: "has", art: "are", shalt: "shall", canst: "can", knowest: "know", sawest: "saw" };
// synonym groups: a word of a group brings the whole group (general English and the period's; the case's own words
// belong in its topics)
const GROUPS = [
  "kill killed killing killer murder murdered murdering murderer slay slain slew assassin",
  "die died dying dead death perish perished",
  "strike struck striking hit blow bash bashed clubbed beat beaten",
  "blood bloody bleed bleeding bled",
  "wound wounded injury injured injuries gash bruise",
  "buy buying bought buyer purchase purchaser",
  "sell selling sold sale seller vendor",
  "pay paid paying payment",
  "bribe bribed bribery bribing",
  "lose lost losing loss",
  "win won winning winnings",
  "gamble gambling gambled gambler bet betting wager wagered stake",
  "card cards dice gaming",
  "lock locked locking unlock unlocked bolt bolted",
  "candle candles candlestick taper flame wick",
  "morning dawn daybreak sunrise",
  "night tonight nightfall",
  "bed abed sleep slept asleep retire retired",
  "lawyer attorney solicitor counsel counsellor barrister",
  "clerk secretary scribe copyist scrivener",
  "lady ladyship",
  "stepmother stepmom",
  "rasure erasure erase erased scrape scraped scratched alter altered alteration tamper tampered forge forged forgery correction corrected",
  "mine mines mining mineral minerals ore",
  "money cash coin coins pounds shillings guineas",
  "quarrel quarrelled quarreled argue argued argument row threat threaten threatened",
  "deed document contract",
  "steal stole stolen theft thief rob robbed",
  "glass glasses goblet cup",
  "write wrote written writing",
  "copy copied copying",
  "find found finding discover discovered",
  "parlour parlor",
].map(g => g.split(" "));
const NUM = { "1": "one", "2": "two", "3": "three", "4": "four", "5": "five", "6": "six", "7": "seven", "8": "eight", "9": "nine", "10": "ten", "11": "eleven", "12": "twelve" };
const TIME = /\b(\d{1,2}(:\d\d)?\s*(am|pm|o'?clock)?|midnight|noon|o'?clock)\b|\b(at|by|till|until|about|around|past|to|half|after|before|near)\s+(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b|\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(o'?clock|thirty|fifteen|forty)\b/i;
const GREETING = /^\s*(good\s+(morning|evening|day|afternoon|night|morrow)|hello|hi|hey|greetings|well met|god (ye )?good (den|morrow))\b[\s,!.]*/i;
const SECOND = /\b(you|yourself|ye|thou|thee)\b/i;   // (not "your": "your stepson" names him)

// (a word's stem: endings off, a final e off a long one, a doubled last letter single: scrape, scraped and scraping
// meet; wine and win do not)
const STEMS = new Map();
export const stem = (w) => { let r = STEMS.get(w); if (r !== undefined) return r;
  r = w.length > 4 ? w.replace(/(ings|ing|edly|ed|ies|es|s|ly)$/, (m) => (m === "ies" ? "y" : "")) : w;
  if (r.length > 4 && r.endsWith("e")) r = r.slice(0, -1);
  if (r.length > 1 && r[r.length - 1] === r[r.length - 2]) r = r.slice(0, -1);
  if (STEMS.size > 20000) STEMS.clear(); STEMS.set(w, r); return r; };
const plain = (s) => (s || "").toLowerCase().replace(/[’‘`]/g, "'").replace(/'s\b/g, "").replace(/n't\b/g, " not").replace(/'(re|ve|ll|d|m)\b/g, " ")
  .replace(/\b(\d{1,2})\b/g, (m) => NUM[m] || m).replace(/[^a-z' ]/g, " ").replace(/'/g, "");
const RAW = new Map();
const rawWords = (s) => { let r = RAW.get(s); if (r) return r; r = plain(s).split(/\s+/).filter(Boolean).flatMap(w => (CHAT[w] || w).split(" "));
  if (RAW.size > 5000) RAW.clear(); RAW.set(s, r); return r; };
const words = (s) => rawWords(s).filter(w => !STOP.has(w)).map(stem);
const GROUP_OF = new Map(); for (const g of GROUPS) for (const w of g) GROUP_OF.set(stem(w), g.map(stem));
// the words said of anyone at all (when, where, money, blood, a table: the house has three): naming a person with only
// these is about them ("what did Francis do last night?", "was he bleeding?", "did the lawyer leave the table?"); any
// other matter word named beside a person is about the matter (below)
const GENERAL = new Set("where night evening yesterday late hour clock last time master money first blood bloody bleed bled table".split(" ").map(stem));
const vowelless = (w) => w.replace(/[aeiouy]/g, "").replace(/(.)\1+/g, "$1");
const collapse = (w) => w.replace(/(.)\1+/g, "$1");
// the optimal-string-alignment distance (an edit, or two letters swapped), giving up past `max`
function dist(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let p2 = null, p = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) { const c = [i]; let lo = i;
    for (let j = 1; j <= b.length; j++) { let v = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (p2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, p2[j - 2] + 1);
      c.push(v); if (v < lo) lo = v; }
    if (lo > max) return max + 1; p2 = p; p = c; }
  return p[b.length];
}
const FEMALE = /\b(dame|lady|mrs|mistress|madam|miss|wife|widow|mother|daughter|sister|she)\b/i;

// stance cues, strongest first
const CUES = [
  ["accuse", /\b(i accuse|accuse you|you (killed|murdered|did it|did this|poisoned|struck|slew|stabbed|smothered|pushed|had him killed|are the (murderer|killer|culprit))|you('re| are) (the )?(murderer|killer|culprit|guilty)|it was you|(you|thou) (art )?(a |the )?murderer|confess|(did|didst) (you|thou) (kill|murder|slay|slew|poison|smother|stab) (him|hollins|the steward|your master|mr hollins|master hollins))\b/i],
  ["show", /\b(look at|see this|see these|see here|behold|what of this|explain this|explain these|how do you (account|explain)|what do you make of (this|these|that|it)|what('s| is) this|do you (recogni[sz]e|know) this|recogni[sz]e this|seen this|i (found|have) (this|these|here)|here('s| is) (the|a|your)|read this|read these|care to explain|check this)\b/i],
  ["press", /\b((you('re| are| were)?|youre|u r|ur) (lying|lie|lied|a liar)|lying to me|liar|lies|(that('s| is)|thats|it('s| is)) (a lie|false|not true|untrue|impossible|nonsense)|not (the )?(whole )?truth|the truth|truthful|come now|come on|i don'?t believe|i do not believe|don'?t believe|nonsense|rubbish|i know you|we know you|someone saw you|you were seen|admit it|admit|own it|out with it|spit it out|stop lying|don'?t lie|do not lie|speak plainly|i doubt|are you sure|but you said|(you('re| are)|youre) hiding|what are you hiding|again)\b/i],
];

// "what do you make of …" shows only when what follows names a thing or clue by more than a person's name ("what do you
// make of the cut cord?"); "what do you make of Mr Cressy?" asks of him
const SOFT_SHOW = /\bwhat do (you|u|ye|thou) make of\b/i;

// the common questions, as phrases (their words are mostly small words), voting for the topic whose id or label holds
// the hint: "where were you" for the whereabouts, "who had the key" for the keys
const WHERE_HINT = ["whereabouts", "alibi", "where"];
const TEMPLATES = [
  [/\bwhere (were|was|wast|wert) (you|u|thou|ye)\b|\bwhere('d| did| had) (you|u) (go|been|be)\b|\byour whereabouts\b|\bwhereabouts\b|\balibi\b|\bwhat were (you|u) doing\b|\b(what time|when) did (you|u) (leave|go|come|retire|get)\b|\bwhat did (you|u) do (last|that|yester)/i, WHERE_HINT],
  [/\b(last|when did (you|u)) (see|saw) (him|her|them)\b|\blast saw\b|\blast (time|seen)\b/i, ["last_seen", "last seen", ...WHERE_HINT]],
  [/\bwho (had|has|kept|keeps|held|holds) (the |a |his )?keys?\b|\bwho (could|can) (open|lock|get in)\b|\blocked (room|door)\b/i, ["key", "lock"]],
  [/\bhow did (he|she|him|\w+|mr \w+|master \w+) die\b|\bwhat killed\b|\bcause of (his|her|the) death\b|\bwho (killed|murdered|did it|(could|would|might) have done (it|this|that))\b/i, ["death", "body", "died"]],
  // (who wished him dead is of the man and his enemies, and outweighs the word "dead": it had read as how he died)
  [/\bwho (would|could|might|did) (want|wish|have wanted) (him|his master|mr hollins|the steward|hollins) dead\b|\bwanted him dead\b|\b(his|any) enem(y|ies)\b|\bwho hated\b/i, ["steward"], 2],
  [/\bwhy would\b|\bwho (gains|profits|benefits)\b|\bwho would want\b|\bmotive\b/i, ["motive", "will", "sale", "inherit"]],
  [/\bwho (found|opened|discovered|went in)\b|\bthis morning\b/i, ["morning", "found"]],
  // (when the door was opened: the key where it lay then is the morning's, not the keys'; it outweighs the word "key")
  [/\bwhen (you|u|ye|thou|they|he|she|we) (went|came|got|broke|first went) in\b|\bwhen (you|u) (opened|found|entered|broke)\b|\bwhen the door was (opened|broken|forced)\b/i, ["morning", "found"], 1.5],
  // what they saw or heard abroad in the night ("did you see anyone on the stairs?")
  [/\b(did|didst) (you|u|thou) (see|hear|meet|pass) (any|anyone|anybody|someone|somebody|any one|a soul|aught)\b|\b(see|saw|seen|hear|heard)\b.*\b(stairs?|staircase|passage|gallery|landing)\b/i, WHERE_HINT, 1, "unnamed"],
  // what brings the stranger here: his business is the sale
  [/\b(what|which) (business|errand|affair|purpose)\b|\b(bring|brings|brought) (you|thee|ye|an? \w+( \w+)?) (here|hither)\b|\bhither\b/i, ["sale"]],
  // money handed to someone ("did you give money to Wragg?") is a payment: the matter of money paid, not the one paid
  [/\b(give|gave|given|giving|pay|paid|slip|slipped|hand|handed|lend|lent)\s+(\w+\s+)?(money|coin|coins|gold|pounds|guineas|shillings)\b|\b(money|gold|coin|coins) to\b/i, ["gold", "bribe", "pay"]],
  // the threat at supper: "he'd not live to see it sealed" is of the steward
  [/\b(not|never|wouldn'?t|would not|won'?t|will not|shan'?t|shall not) live to see\b|\blive to see (it|the deed|the sale)\b/i, ["steward"]],
  [/\bwho (else )?(is|are|was|were|lives?|lived|stays?|stayed|sleeps?|slept)\b.*\b(here|house|household|staying|about|present|living)\b|\bwho else\b|\bwhere (is|are) (every|all)\w*\b/i, ["household", "house", "present"]],
];

const BASE_VOCAB = new Map(), BASE_FORMS = [];
const NUMBER_WORDS = "one two three four five six seven eight nine ten eleven twelve midnight".split(" ");
for (const g of [...GROUPS, NUMBER_WORDS]) for (const w of g) { const s = stem(w); if (!BASE_VOCAB.has(s)) BASE_VOCAB.set(s, new Set()); if (!BASE_VOCAB.get(s).has(w)) { BASE_VOCAB.get(s).add(w); if (w.length >= 4) BASE_FORMS.push([w, s, vowelless(w), collapse(w)]); } }
// what the reader knows of a context, built once per context (a phone's questions to one suspect share it)
const INDEX = new Map();
function indexOf(topics, people, evidence) {
  const key = JSON.stringify([topics.map(t => [t.id, t.label, t.words]), people.map(p => [p.id, p.name, p.aka]), evidence.map(e => [e.id, e.label, e.words])]);
  let ix = INDEX.get(key); if (ix) return ix;
  // topics by their label and words (a person's name in a label is the person's, as is a name with 's: "the gold in
  // Daniel's box"); people by name and aka (a two-word aka needs both words: "the London man")
  const nameStems = new Set(people.flatMap(p => [p.name, ...(p.aka || [])].flatMap(n => words(n)).filter(w => !TITLES.has(w))));
  const labelWords = (t) => `${(t.label || "").replace(/\b[A-Z][a-z]+['’]s\b/g, " ")} ${(t.words || []).join(" ")}`;
  const deceased = topics.find(t => (t.words || []).some(w => /^(victim|deceased)$/i.test(w)))?.id || null;
  const hintTopic = (hints) => topics.find(t => hints.some(h => `${t.id} ${t.label || ""}`.toLowerCase().includes(h)))?.id || null;
  const cands = topics.map(t => ({ id: t.id, dead: t.id === deceased, keys: new Set(words(labelWords(t)).filter(w => !nameStems.has(w))) }));
  const persons = people.map(p => ({ id: `person:${p.id}`, female: FEMALE.test(`${p.name} ${(p.aka || []).join(" ")}`),
    groups: [...new Set([p.name, ...(p.aka || [])].flatMap(n => { const all = words(n), w = all.filter(x => !TITLES.has(x));
      return w.length > 1 && n !== p.name ? [w.join(" ")] : w.length ? w : [all.join(" ")]; }))].filter(Boolean).map(g => g.split(" ")) }));
  // the words it knows, for near spellings: stem -> its forms (the synonym groups' known once, at load)
  const vocab = new Map(BASE_VOCAB), forms = [...BASE_FORMS];
  const know = (w) => { if (STOP.has(w)) return; const s = stem(w); if (!vocab.has(s)) vocab.set(s, new Set());
    if (!vocab.get(s).has(w)) { vocab.set(s, new Set([...vocab.get(s), w])); if (w.length >= 4) forms.push([w, s, vowelless(w), collapse(w)]); } };
  for (const t of topics) rawWords(labelWords(t)).forEach(know);
  for (const p of people) rawWords(`${p.name} ${(p.aka || []).join(" ")}`).forEach(know);
  for (const e of evidence) rawWords(`${e.label || ""} ${(e.words || []).join(" ")}`).forEach(know);
  ix = { cands, persons, nameStems, vocab, forms, deceased, hintTopic, whereTopic: hintTopic(WHERE_HINT), near: new Map() };
  if (INDEX.size > 16) INDEX.delete(INDEX.keys().next().value); INDEX.set(key, ix); return ix;
}
// a word the reader does not know, met by a near spelling of one it does: of five letters, a letter left out or two
// swapped (a same-length change at five letters is too often another real word: horse, house); of six or more, one
// edit; of eight or more, two; a word with its vowels dropped ("hnd") or a doubled letter single ("dor") meets the one
// word it can be
function nearOf(ix, w) {
  if (ix.near.has(w)) return ix.near.get(w);
  let hits = [];
  if (w.length >= 5) { const max = w.length >= 8 ? 2 : 1; let bestD = max + 1;
    for (const [f, s] of ix.forms) { if (Math.abs(f.length - w.length) > max || (f[0] !== w[0] && f[1] !== w[1] && f[0] !== w[1])) continue;
      if (w.length === 5 && f.length === 5 && !(f.split("").sort().join("") === w.split("").sort().join(""))) continue;
      const d = dist(w, f, max); if (d < bestD) { bestD = d; hits = [s]; } else if (d === bestD && !hits.includes(s)) hits.push(s); }
    if (bestD > max || hits.length > 2) hits = [];
  } else if (w.length >= 3) { for (const [f, s, vl, co] of ix.forms) if (f.length > w.length && (vl === w || co === w) && !hits.includes(s)) hits.push(s); if (hits.length !== 1) hits = []; }
  ix.near.set(w, hits); return hits;
}

export function readIntent(text, { topics = [], people = [], evidence = [], own = null, last = null } = {}) {
  const why = [], src = String(text || "").slice(0, 400), norm = rawWords(src).join(" ");
  const test = (re) => re.test(src) || re.test(norm);
  let stance = "ask"; for (const [s, re] of CUES) if (test(re)) { stance = s; why.push(`stance:${s}`); break; }
  const soft = stance === "ask" && test(SOFT_SHOW); if (soft) stance = "show";
  const raw = rawWords(src.replace(GREETING, " ")), toThem = SECOND.test(norm);
  const ix = indexOf(topics, people, evidence), { cands, persons, vocab, deceased, hintTopic, whereTopic } = ix;

  // ---- the player's words: exact, a near spelling of a word the reader knows, and each one's synonym group
  const said = [];   // [{ stems: Map(stem -> weight), at }]: each word the player said, what it may mean
  raw.forEach((w, at) => { if (STOP.has(w)) return; const s = stem(w), m = new Map([[s, 1]]);
    if (!vocab.has(s)) for (const h of nearOf(ix, w)) m.set(h, 0.8);
    for (const [k, v] of [...m]) for (const g of GROUP_OF.get(k) || []) if (!m.has(g)) m.set(g, 0.9 * v);
    said.push({ stems: m, at, w });
  });

  // ---- the scores
  const score = new Map(), first = new Map(), add = (id, v, at = 99) => { if (!id || !v) return; score.set(id, (score.get(id) || 0) + v); if (!first.has(id) || at < first.get(id)) first.set(id, at); };
  let matter = 0;   // the strongest word for a matter of its own (not a time, a place in general, money in general, him)
  for (const c of cands) { let strong = 0, weak = 0, at = 99;
    for (const x of said) { let best = 0, isWeak = false, bs = null;
      // (the deceased is the subject of nearly every question: naming him is a weak vote for the topic about him)
      for (const [s, v] of x.stems) if (c.keys.has(s)) { const weak = WEAK.has(s) || TITLES.has(s) || c.dead, wt = TITLES.has(s) ? 0.25 * v : weak ? 0.6 * v : v; if (wt > best) { best = wt; isWeak = weak; bs = s; } }
      if (!best) continue; at = Math.min(at, x.at); if (isWeak) weak = Math.max(weak, best); else strong += best;
      if (!c.dead && !GENERAL.has(bs) && !TITLES.has(bs)) matter = Math.max(matter, best); }
    if (strong + weak) add(c.id, strong + weak, at); }
  // a name with 's and a thing that is a matter of its own ("Francis's hand", the hand open as a matter) is about the
  // thing: the name counts half, and the question isn't about them ("blood on Francis's shirt" is still about Francis
  // while no matter answers to "shirt")
  const owns = new Set([...src.toLowerCase().replace(/’/g, "'").matchAll(/\b([a-z]+)'s\s+([a-z]+)/g)]
    .filter(m => cands.some(c => c.keys.has(stem(m[2])))).map(m => stem(m[1])));
  let named = null;
  for (const p of persons) { let best = 0, at = 99;
    for (const g of p.groups) { let ok = 1, pos = 99;
      for (const gw of g) { let hit = 0; for (const x of said) { const v = x.stems.get(gw) || 0; if (v > hit) { hit = v; pos = Math.min(pos, x.at); } } ok = Math.min(ok, hit); }
      if (ok > best) { best = ok; at = pos; } }
    const own = p.groups.some(g => g.length === 1 && owns.has(g[0]));
    // (another person named beside a matter of its own is the matter's: "did Francis go to the buttery?" is his cut hand,
    // "how much did Francis lose?" the cards; they had read as "what of Francis", and the player got Cressy's view of him)
    const side = !own && matter >= 0.5;
    if (best) { add(p.id, own || side ? best / 2 : best, at); if (own) why.push(`${p.id}'s`); else { if (side) why.push(`${p.id} beside a matter`); if (!named || at < named.at) named = { id: p.id, at, female: p.female, side }; } } }
  // pronouns: "she/her" the one woman not being questioned, when no one is named; "he/him/his" the deceased, when no
  // one else is
  const pron = raw.find(w => /^(he|him|his|she|her|hers)$/.test(w));
  if (pron && !named) { const fem = /^(she|her|hers)$/.test(pron), women = persons.filter(p => p.female);
    if (fem && women.length === 1) { add(women[0].id, 0.5, raw.indexOf(pron)); why.push(`${pron} → ${women[0].id}`); }
    else if (!fem && deceased && !raw.some(w => vocab.has(stem(w)) && cands.find(c => c.id === deceased)?.keys.has(stem(w)))) { add(deceased, 0.5, 98); why.push(`${pron} → ${deceased}`); } }
  // a time ("at eleven") is a vote for where they were; the phrase templates vote for their topic
  // (a number word misspelt, "elevn", is still a time)
  const num = new Map(said.map(x => [x.w, [...x.stems.keys()].find(k => NUMBER_WORDS.includes(k))]));
  if (test(TIME) || TIME.test(raw.map(w => num.get(w) || w).join(" "))) { add(whereTopic, 0.6); why.push("a time"); }
  for (const [re, hints, wt = 1, only] of TEMPLATES) if (!(only === "unnamed" && named) && test(re)) { const t = hintTopic(hints); if (t) { add(t, wt, 50); why.push(`template → ${t}`); } }
  // a question with no "you" in it that names someone is about them ("where was Francis at eleven?")
  if (named && !toThem && !named.side) { add(named.id, 0.5); why.push(`about ${named.id}`); }
  // a question to them with "you" in it, naming another and a matter of theirs, is about the matter ("did you play
  // cards with Cressy?"): the matter wins a tie with the person
  const ranked = [...score].sort((a, b) => b[1] - a[1] || tieBreak(a[0], b[0]));
  function tieBreak(a, b) {
    const pa = a.startsWith("person:"), pb = b.startsWith("person:");
    if (pa !== pb && toThem) return pa ? 1 : -1;
    const oa = own?.includes(a) ? 0 : 1, ob = own?.includes(b) ? 0 : 1; if (oa !== ob) return oa - ob;
    if (last && (a === last) !== (b === last)) return a === last ? -1 : 1;
    return (first.get(a) ?? 99) - (first.get(b) ?? 99);
  }
  const [best, top] = ranked[0] || [null, 0], next = ranked[1]?.[1] || 0;
  const sure = best && top >= 0.45 && (top > next || tieBreak(best, ranked[1][0]) < 0);
  if (sure) why.push(`topic ${best} (${top.toFixed(2)}${next ? ` vs ${ranked[1][0]} ${next.toFixed(2)}` : ""})`);
  else why.push(best ? `unsure: ${best} ${top.toFixed(2)} vs ${next.toFixed(2)}` : "no topic words");

  // ---- evidence named: a clue or a thing the player holds, by its words (naming a thing is not showing it: "who had the
  // key?" asks about the key; only a cue shows it)
  let ev = null, evScore = 0;
  if (stance === "show") for (const e of evidence) { const k = new Set(words(`${e.label} ${(e.words || []).join(" ")}`).filter(w => !TITLES.has(w) && !(soft && ix.nameStems.has(w))));
    let hit = 0; for (const x of said) { let b = 0; for (const [s, v] of x.stems) if (k.has(s)) b = Math.max(b, v); hit += b; }
    const s = hit / Math.max(1, Math.min(3, k.size)); if (s > evScore) { evScore = s; ev = e.id; } }
  if (ev && evScore >= 0.3) why.push(`shows ${ev}`); else ev = null;
  if (soft && !ev) { stance = "ask"; why.push("make of: nothing shown, asks"); } else if (soft) why.push("stance:show (make of)");
  return { topic: sure ? best : "none", stance, evidence: ev, score: +top.toFixed(2), why };
}
