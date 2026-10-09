// A naive player of the case (M7): knows nothing of the solution and plays only by what the game shows (the notebook's
// Open leads with where to go and where people now are, the panel's chips and their dry/asked state, the eye/hand/finger
// cues on things, lines said, papers read, rooms' names), to see whether that direction alone carries a player to a
// correct verdict, and in how many turns. It never reads the case file, clue ids for meaning, _fairness or the truth.
//   node tests/.naive-play.mjs [--seeds 1,2,3] [--max 420] [--out DIR] [--type 0.15] [--reload-at 50] [--crash-at 90] [--room ID] [--debug]
// R59 stand-in for a first-time phone player: it also reaches into an opened container when told what is in it, asks
// the notebook for "A thought…" when stuck, types some questions in its own words (phrasings from the intent corpus for
// the matter it means to raise, only those whose long words the game has already shown), reloads once mid-case and
// checks it resumes, survives a browser crash by resuming from the saved case, and estimates a person's wall-clock.
// Turns: one question (a chip, a typed line, a press, a show), one press on a thing, one move to a room or person, one
// minute waited, one thought asked. Looking around a room costs no turn (it costs the person's time: see COST).
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";

const A = Object.fromEntries(process.argv.slice(2).join(" ").split(/\s*--/).filter(Boolean).map(s => { const [k, ...v] = s.split(/\s+/); return [k, v.join(" ") || true]; }));
const STALL = +(A.stall || 40), HINT_STALL = +(A["hint-stall"] || 14);
const SEEDS = String(A.seeds || "1,2,3").split(",").map(Number), MAX = +(A.max || 420);
const OUT = A.out || "/tmp/claude-1000/-home-k-Projects-holo-emitter/97770d23-8695-4407-9f5e-30bf8e241f72/scratchpad/naive";
mkdirSync(OUT, { recursive: true });
// (voice=0: no model at all; the relay is the page's only model path)
const ORIGIN = "http://localhost:8794", PAGE = `${ORIGIN}/lab/manor/index.html?case=case-1660&fresh&webgpu=1&voice=0${A.deck ? `&deck=${A.deck}` : ""}`;   // --deck URL: a construct deck merged beside the case
const URL_AGAIN = PAGE.replace("&fresh", "");     // the address the page leaves after a fresh start (it drops ?fresh)
const CORPUS = JSON.parse(readFileSync(new URL("./fixtures/intent-corpus-1660.json", import.meta.url), "utf8"));

// ---- a person's time, per action (seconds), from the two playtests (design/case/playtest2-2026-10-08.md §3) -----------
const COST = {
  chip: 6,          // tap a chip (ask or press), read the answer
  typed: 20,        // type a question on a phone keyboard, read the answer
  show: 12,         // open the drawer, pick the matter and the card, read the answer
  search: 40,       // look round a room for what can be used (turning, aiming)
  act: 5,           // one tap on a thing, read its line
  paper: 45,        // read a paper in the reader
  walk: 25,         // walk to another room (doors, stairs)
  floor: 20,        // more for a change of floor (the garret took 4-6 min in playtest 2)
  step: 5,          // a few steps to someone in the room you stand in
  hint: 10,         // open the notebook's lead and read a thought
  wait: 60,         // a minute passes with nothing to follow
  glance: 5,        // look at the notebook before choosing what to do next
  sheet: 30,        // read the accusation sheet once
  accuse: 20,       // fill a group's blanks and confirm (each try)
  reload: 15,       // a reload: the page comes back (8-9 s on desktop) and you find your bearings
};

// ---- words: what a player matches by eye ------------------------------------------------------------------------------
const STOP = new Set(("the a an and or of to in on at by for with from his her their him he she it its is was were be been this that these those what who whom whose which when where why how did does do had has have not no as up out down into over under all any some one two your you i me my our we they them there here then than so if but shall will would could should may might must sir worship master mistress mr mrs dame lady last night morning now still yet own very said says say tell told ask asked see seen saw room find shall let them whoever anyone anything every each other only also just being after before about again much more most can cannot").split(" "));
const stem = (w) => { w = w.replace(/['’]s$/, "").replace(/['’]/g, ""); if (w.length > 5) w = w.replace(/(ings|ing|edly|ed|es)$/, ""); if (w.length > 4) w = w.replace(/s$/, ""); return w; };
const toks = (s) => [...new Set(String(s || "").toLowerCase().replace(/[’‘]/g, "'").split(/[^a-z']+/).map(w => w.replace(/^'+|'+$/g, "")).filter(w => w.length >= 3 && !STOP.has(w)).map(stem).filter(w => w.length >= 3 && !STOP.has(w)))];
const overlap = (a, b) => { const B = new Set(toks(b)); return toks(a).filter(w => B.has(w)); };
const rng = (seed) => { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
const norm = (s) => String(s || "").toLowerCase().replace(/[’‘]/g, "'");
const CRASH = /Target (page, context or browser )?(has been )?closed|crash|disconnected|Browser has been closed|Execution context was destroyed|Navigation failed|Protocol error/i;

async function play(seed) {
  const R = rng(seed), jit = () => R() * 1e-3;
  // seeds vary the tie-breaks (chip order, which lead first) and the hand: odd seeds tap chips, even seeds type more
  const TYPE_P = A.type != null ? +A.type : (seed % 2 ? 0.15 : 0.6), LEAD_SKIP = 0.15;
  const RELOAD_AT = +(A["reload-at"] || 40 + Math.floor(R() * 30));
  const errs = [], S = { crashes: 0, restarts: [], botErrors: [] };
  let b = null, p = null, store = null;
  const T = { turns: 0, q: 0, typed: 0, typedNone: 0, typedMiss: 0, acts: 0, moves: 0, idles: 0, hints: 0, log: [], tapFallbacks: 0, est: 0, estBy: {} };
  const spend = (k, n = 1) => { T.est += COST[k] * n; T.estBy[k] = (T.estBy[k] || 0) + COST[k] * n; };
  const M = { searched: new Map(), leadRoom: new Map(), visitSig: new Map(), person: new Map(), things: new Map(), hints: [], saidN: 0, leads: new Map(), seenAt: new Map(), lastProgress: 0, lastHint: -99, stuck: [], reads: [], heard: [], thoughts: [], vocab: new Set(), typedUsed: new Set(), here: null, reload: null };
  let V = null, nClues = 0, ROOMS = null, roomById = null, PEOPLE = [], ROOMNAMES = [];
  const t0 = Date.now();

  // ---- a browser that may crash: the case resumes from what the page saved (mirrored here as the phone would keep it)
  async function launch(again) {
    for (let k = 0; ; k++) { try { return await launchOnce(again); } catch (e) { S.loadFails = (S.loadFails || 0) + 1; console.log(`  [${seed}] load failed (${e.message.slice(0, 80)}), try ${k + 2}`); try { await b?.close(); } catch (_) {} if (k >= 2) throw e; } }
  }
  async function launchOnce(again) {
    b = await chromium.launch({ args: ["--use-angle=vulkan", "--enable-features=Vulkan", "--enable-unsafe-webgpu", "--ignore-gpu-blocklist"] });
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, ...(again && store ? { storageState: { cookies: [], origins: [{ origin: ORIGIN, localStorage: store }] } } : {}) });
    p = await ctx.newPage(); p.setDefaultTimeout(20000); p.on("pageerror", e => errs.push(e.message));
    await p.goto(again ? URL_AGAIN : PAGE, { timeout: 300000 }); await p.waitForFunction(() => window.__ok && window.__cp, null, { timeout: 300000 });
    M.saidN = 0;
    if (!ROOMS) { ROOMS = await p.evaluate(() => window.__plan.rooms.map(r => ({ id: r.id, name: r.name, floor: r.floor, rect: r.rect }))); roomById = new Map(ROOMS.map(r => [r.id, r])); ROOMNAMES = [...new Set(ROOMS.map(r => norm(r.name)))]; }
    PEOPLE = await p.evaluate(() => [...window.__presences].map(([id, q]) => ({ id, name: q.p.group.name.replace(/^presence:/, "") })));
    await nbv();
  }
  async function mirror() { try { store = await p.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith("holo-emitter/")).map(name => ({ name, value: localStorage.getItem(name) }))); } catch (_) {} }
  async function restart(why) {
    S.crashes++; const before = V ? { clues: V.clues.length, open: (V.leads?.open || []).map(l => l.id).sort().join() } : null;
    try { await b?.close(); } catch (_) {}
    await launch(true); spend("reload");
    const back = await p.evaluate(() => window.__said.find(t => /take up the case again/.test(t)) || "");
    const r = { turn: T.turns, why: String(why).slice(0, 160), resumedLine: back, clues: [before?.clues, V.clues.length], leadsSame: before ? before.open === (V.leads?.open || []).map(l => l.id).sort().join() : null };
    S.restarts.push(r); console.log(`  [${seed}] restarted after a crash at t${T.turns}: ${JSON.stringify(r)}`);
  }
  const nbv = async () => (V = await p.evaluate(() => window.__cp.notebookView()));
  const heldN = () => p.evaluate(() => window.__cp.evidence().filter(e => e.kind === "thing").length);
  const sig = () => `${V.clues.length}/${V.contradictions.length}/${V.leads?.open.length}`;
  const raf = () => p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  const learnWords = (s) => { for (const w of toks(s)) M.vocab.add(w); };
  // what was said outside the panel (the line at the foot of the screen): beats, servants' words
  async function heardLines() { const all = await p.evaluate(() => window.__said); const fresh = all.slice(M.saidN); M.saidN = all.length; return fresh; }
  function noteLines(lines, where) { for (const t of lines) { learnWords(t); M.heard.push({ turn: T.turns, where, text: t }); const tg = targetsOf(t); if (tg.length) M.hints.push({ text: t, targets: tg, turn: T.turns, used: false }); } }

  // ---- after every turn: the notebook, the leads' lives, what's new
  async function tick(kind, detail, extra = {}) {
    T.turns++; if (kind === "q") T.q++; else if (kind === "act") T.acts++; else if (kind === "move") T.moves++; else if (kind === "idle") T.idles++; else if (kind === "hint") T.hints++;
    const before = new Set(V?.clues.map(c => c.label) || []); await nbv();
    const fresh = V.clues.map(c => c.label).filter(l => !before.has(l));
    for (const l of V.leads?.open || []) { learnWords(`${l.text} ${l.where} ${l.now}`); if (!M.leads.has(l.id)) M.leads.set(l.id, { text: l.text, where: l.where, raised: T.turns, closed: null }); }
    for (const l of V.leads?.done || []) { const m = M.leads.get(l.id) || { text: l.text, raised: T.turns }; if (m.closed == null) m.closed = T.turns; M.leads.set(l.id, m); }
    for (const c of V.clues) learnWords(c.label);
    const lsig = `${(V.leads?.open || []).map(l => l.id).join()}|${V.contradictions.length}`;
    const prog = !!(fresh.length || V.clues.length !== nClues || lsig !== M.lsig); if (prog) M.lastProgress = T.turns; nClues = V.clues.length; M.lsig = lsig;
    const lines = await heardLines(); noteLines(lines, kind === "idle" ? "idle" : "world"); await heardAsides();
    T.log.push({ t: T.turns, kind, detail, est: Math.round(T.est), ...(prog ? { prog } : {}), ...(fresh.length ? { learned: fresh } : {}), ...(lines.length ? { heard: lines } : {}), ...extra });
    if (fresh.length) console.log(`  [${seed}] t${T.turns} ${kind} ${detail} -> +${fresh.join(" | ")}`);
  }

  // ---- reading names out of what the game shows ----------------------------------------------------------------------
  const nameToks = () => { const all = PEOPLE.map(x => ({ id: x.id, t: toks(x.name) })); const count = new Map(); for (const x of all) for (const w of x.t) count.set(w, (count.get(w) || 0) + 1);
    const out = new Map(all.map(x => [x.id, x.t.filter(w => count.get(w) === 1)]));
    // a role read from the notebook ("the clerk") once you know it, if no one else's role shares the word
    const roles = (V?.persons || []).map(q => ({ id: q.id, t: toks((q.note || "").split(" · ")[0]) })); const rc = new Map(); for (const r of roles) for (const w of r.t) rc.set(w, (rc.get(w) || 0) + 1);
    for (const r of roles) for (const w of r.t) if (rc.get(w) === 1 && /^(clerk|heir|lawyer|attorney|widow|steward|wife|son|buyer)$/.test(w)) out.get(r.id)?.push(w);
    return out; };
  // targets in a text, in the order mentioned: people by their own name words (or a role word), rooms by their full name
  function targetsOf(text) {
    const s = norm(text), out = [], NT = nameToks();
    for (const [id, ws] of NT) { let at = Infinity; for (const w of ws) { const m = new RegExp(`\\b${w}`).exec(s); if (m) at = Math.min(at, m.index); } if (at < Infinity) out.push({ type: "person", id, at }); }
    for (const n of ROOMNAMES) { const i = s.indexOf(n.replace(/s' /, "s' ")); if (i < 0) continue;
      let cands = ROOMS.filter(r => norm(r.name) === n); const fl = /garret/.test(s) ? "garret" : null;
      if (fl) cands = cands.filter(r => r.floor === fl).concat(cands.filter(r => r.floor !== fl));
      if (/\bwest\b/.test(s)) cands.sort((a, b) => a.rect.x0 - b.rect.x0); else if (/\beast\b/.test(s)) cands.sort((a, b) => b.rect.x0 - a.rect.x0);
      // (a name inside a longer one, "closet" in "the closet beyond it": kept, it is a place said)
      out.push({ type: "room", ids: cands.map(r => r.id), at: i, name: n }); }
    // (a room said twice, once inside a longer name: the longer one wins at that place)
    return out.sort((a, b) => a.at - b.at).filter((x, i, arr) => !(x.type === "room" && arr.some(y => y !== x && y.type === "room" && y.name.length > x.name.length && y.at <= x.at && y.at + y.name.length >= x.at + x.name.length)));
  }
  // where a person is, as the game shows it: a lead's "now", the person's note in the book, or where you saw them
  function whereIs(id) {
    const name = PEOPLE.find(x => x.id === id)?.name; if (!name) return null;
    const said = [...(V.leads?.open || []).map(l => l.now || ""), ...(V.persons || []).filter(q => q.id === id).map(q => `${name} is ${q.note}`)].join("; ");
    const m = new RegExp(`${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} is (?:[^;]*· )?(?:now )?in the ([a-z' ]+)`, "i").exec(said);
    if (m) return { name: m[1].trim().toLowerCase(), shown: true };
    const seen = M.seenAt.get(id); return seen ? { name: norm(roomById.get(seen)?.name), room: seen, shown: false } : null;
  }

  // ---- moving: to a room's floor (standing clear), to face a person; a person's time by where you were ----------------
  const walkCost = (to) => { if (!to || to === M.here) return spend("step"); spend("walk"); if (M.here && roomById.get(M.here)?.floor !== roomById.get(to)?.floor) spend("floor"); };
  async function standPoints(roomId, step = 2.2) {
    return p.evaluate(([rid, step]) => { const r = window.__plan.rooms.find(q => q.id === rid), f = r.floor, out = [];
      const ok = (x, y) => window.__walk(x, y, x + 0.03, y, f).done && window.__walk(x, y, x, y + 0.03, f).done;
      const cx = (r.rect.x0 + r.rect.x1) / 2, cy = (r.rect.y0 + r.rect.y1) / 2;
      const nx = Math.max(1, Math.round((r.rect.x1 - r.rect.x0 - 0.8) / step)), ny = Math.max(1, Math.round((r.rect.y1 - r.rect.y0 - 0.8) / step));
      for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const x0 = r.rect.x0 + 0.4 + (i + 0.5) * (r.rect.x1 - r.rect.x0 - 0.8) / nx, y0 = r.rect.y0 + 0.4 + (j + 0.5) * (r.rect.y1 - r.rect.y0 - 0.8) / ny;
        for (let k = 0; k < 120; k++) { const a = k * 2.4, rr = 0.07 * Math.sqrt(k), x = x0 + Math.cos(a) * rr, y = y0 + Math.sin(a) * rr; if (x > r.rect.x0 + 0.25 && x < r.rect.x1 - 0.25 && y > r.rect.y0 + 0.25 && y < r.rect.y1 - 0.25 && ok(x, y)) { out.push([x, y]); break; } } }
      if (!out.length) out.push([cx, cy]); return { pts: out, floor: f }; }, [roomId, step]);
  }
  const hud = () => p.evaluate(() => document.querySelector("#where .n")?.textContent || "");
  async function goRoom(roomId) {
    const { pts, floor } = await standPoints(roomId); const [x, y] = pts[Math.floor(pts.length / 2)];
    await p.evaluate(([x, y, f]) => window.__place(x, y, 0, -10, f), [x, y, floor]); await raf(); await raf();
    walkCost(roomId); M.here = roomId;
    await tick("move", `to ${roomById.get(roomId).name.toLowerCase()} (${roomId})`, { hud: await hud() });
  }
  async function closeAll() { for (let i = 0; i < 6; i++) { const on = await p.evaluate(() => document.querySelectorAll(".tp-sheet.on").length); if (!on) return; await p.keyboard.press("Escape"); await p.waitForTimeout(120); } }
  const talkOpen = () => p.evaluate(() => !!document.querySelector('.tp-sheet.on[aria-label^="Speaking with"]'));
  // stand before a person and tap them, as a player would (the centre of the screen, where they stand)
  async function goPerson(id) {
    await closeAll();
    const ok = await p.evaluate(async (id) => { const q = window.__presences.get(id); if (!q) return false; const g = q.p.group.position, R = window.__plan.rooms.find(r => r.id === q.room);
      const raf = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const cx = (R.rect.x0 + R.rect.x1) / 2, cy = (R.rect.y0 + R.rect.y1) / 2, gx = g.x, gy = -g.z;
      const base = Math.atan2(cy - gy, cx - gx);
      for (const d of [1.6, 1.3, 2.0]) for (let k = 0; k < 8; k++) { const a = base + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * Math.PI / 4, x = gx + Math.cos(a) * d, y = gy + Math.sin(a) * d;
        if (!window.__walk(x, y, x + 0.02, y, R.floor).done) continue;
        window.__place(x, y, Math.atan2(-(gx - x), gy - y) * 180 / Math.PI, -4, R.floor); await raf();
        if (window.__aim(0, 0)?.presence === id) return true; }
      return false; }, id);
    const room = await p.evaluate((id) => window.__presences.get(id)?.room, id); walkCost(room); M.here = room;
    await tick("move", `to ${PEOPLE.find(x => x.id === id)?.name}`, { hud: await hud() });
    if (ok) { await p.touchscreen.tap(195, 422); await p.waitForTimeout(450); }
    let open = await talkOpen();
    if (!open) { T.tapFallbacks++; await p.evaluate((id) => window.__cp.talkTo(id), id); await p.waitForTimeout(200); open = true; }
    return open;
  }

  // ---- the panel, as it is on screen ----------------------------------------------------------------------------------
  const panelState = () => p.evaluate(() => {
    const talk = document.querySelector('.tp-sheet.on[aria-label^="Speaking with"]'); if (!talk) return null;
    const more = [...talk.querySelectorAll(".tp-chips .tp-chip.more")][0];
    return { more: more?.textContent || null, guarded: document.querySelector(".tp")?.classList.contains("guarded"), busy: document.querySelector(".tp")?.classList.contains("tp-busy"), hint: talk.querySelector(".tp-hint")?.textContent,
      chips: [...talk.querySelectorAll(".tp-chips .tp-chip[data-topic]")].map(c => ({ topic: c.dataset.topic, label: c.textContent, asked: c.classList.contains("asked"), dry: c.hasAttribute("data-dry"), press: c.classList.contains("press") })),
      log: [...talk.querySelectorAll(".tp-log > *")].map(e => ({ cls: e.className, text: e.textContent })) }; });
  async function expandChips() { const s = await panelState(); if (s?.more === "More…") { await p.click('.tp-sheet.on .tp-chip.more'); await p.waitForTimeout(60); } const t = await panelState(); for (const c of t?.chips || []) learnWords(c.label); return t; }
  async function waitIdle() { for (let i = 0; i < 60; i++) { const busy = await p.evaluate(() => document.querySelector(".tp")?.classList.contains("tp-busy")); if (!busy) break; await p.waitForTimeout(100); } await p.waitForTimeout(80); }
  // an aside the house said into an open panel (a beat dealt as you question someone, or as you read a paper) is recorded as
  // heard; recorded only, so the bot plays as it did before (its runs stay comparable with the ones before this)
  const heardAsides = async () => { const all = await p.evaluate(() => window.__asides || []).catch(() => []); if (all.length < (M.asideN || 0)) M.asideN = 0; for (const t of all.slice(M.asideN || 0)) M.heard.push({ turn: T.turns, where: "aside", text: t }); M.asideN = all.length; };
  const lastLines = async (n0) => { const s = await panelState(); const got = (s?.log || []).slice(n0).filter(e => /tp-them|tp-aside|tp-noted/.test(e.cls)).map(e => e.text); return got; };

  async function ask(who, chipT, stance = "ask") {
    const s0 = await panelState(), n0 = s0.log.length;
    if (stance === "press") await p.click('.tp-sheet.on .tp-st:has-text("Press for more")');
    await p.click(`.tp-sheet.on .tp-chip[data-topic="${chipT.topic}"]`); await waitIdle();
    const said = await lastLines(n0); said.forEach(learnWords); spend("chip");
    await tick("q", `${stance} ${PEOPLE.find(x => x.id === who)?.name.split(" ").at(-1)}: ${chipT.label}`, { said: said.join(" / ") });
    return said;
  }
  // in its own words: a phrasing people typed for this matter (tests/fixtures/intent-corpus-1660.json), only one whose
  // longer words the game has already put before you (no word of the solution you haven't met), not one used before
  function phrasingFor(who, topic, stance) {
    const ok = CORPUS.filter(x => x.who === who && x.topic === topic && x.stance === stance && !M.typedUsed.has(`${who}|${x.q}`)
      && toks(x.q).every(w => w.length < 5 || M.vocab.has(w)));
    return ok.length ? ok[Math.floor(R() * ok.length)].q : null;
  }
  async function typeAsk(who, chipT, stance) {
    const q = phrasingFor(who, chipT.topic, stance); if (!q) return null;
    M.typedUsed.add(`${who}|${q}`);
    const s0 = await panelState(), n0 = s0.log.length, wasAsked = chipT.asked, asked0 = new Set(s0.chips.filter(c => c.asked).map(c => c.topic));
    await p.click(".tp-sheet.on .tp-in"); await p.fill(".tp-sheet.on .tp-in", q); await p.press(".tp-sheet.on .tp-in", "Enter"); await waitIdle();
    const said = await lastLines(n0); said.forEach(learnWords); spend("typed"); T.typed++;
    const s1 = await panelState(), none = said.some(t => /wait for you to be plainer/i.test(t));
    const nowAsked = s1?.chips.find(c => c.topic === chipT.topic)?.asked;
    const miss = !none && !wasAsked && !nowAsked;          // (read, but as another matter than the one meant)
    const readAs = miss ? (s1?.chips.filter(c => c.asked && !asked0.has(c.topic)).map(c => c.label).join(", ") || "a matter already raised") : null;
    if (none) T.typedNone++; if (miss) T.typedMiss++;
    await tick("q", `typed ${PEOPLE.find(x => x.id === who)?.name.split(" ").at(-1)}: "${q}" (meant: ${chipT.label}${stance === "press" ? ", pressed" : ""})${none ? " -> read as none" : miss ? ` -> read as: ${readAs}` : ""}`, { said: said.join(" / "), typed: { q, meant: chipT.topic, meantLabel: chipT.label, none, miss, readAs } });
    // (not understood: the chip, as the aside asks)
    if (none) return ask(who, chipT, stance);
    return said;
  }
  async function raise(who, chipT, stance = "ask") { if (R() < TYPE_P) { const r = await typeAsk(who, chipT, stance); if (r) return r; } return ask(who, chipT, stance); }
  async function show(who, evId, evLabel, topic, topicLabel) {
    const s0 = await panelState(), n0 = s0.log.length;
    await p.click('.tp-sheet.on .tp-st:has-text("Show evidence")'); await p.waitForTimeout(150);
    await p.click(`.tp-sheet.on .tp-chips button[data-on="${topic}"]`); await p.waitForTimeout(60);
    await p.click(`.tp-sheet.on .tp-card[data-evidence="${evId}"]`); await waitIdle();
    const said = await lastLines(n0); said.forEach(learnWords); spend("show");
    await tick("q", `show ${PEOPLE.find(x => x.id === who)?.name.split(" ").at(-1)}: "${evLabel}" on ${topicLabel}`, { said: said.join(" / ") });
    return said;
  }

  // ---- a thought from the notebook: it opens from a conversation's header, so talk to someone near if no one is open;
  // the lead that has stood open longest (the one you're stuck on), its next rung
  async function takeHint(why, onLead = null) {
    const open = (V.leads?.open || []).filter(l => !leadIsCoroner(l) && l.more && (!onLead || l.id === onLead)); if (!open.length) return false;
    const lead = open.map(l => ({ l, raised: M.leads.get(l.id)?.raised ?? 0, n: (l.hints || []).length })).sort((a, b) => (a.n - b.n) || (a.raised - b.raised))[0].l;
    if (!(await talkOpen())) {
      const near = PEOPLE.map(x => ({ id: x.id, room: M.seenAt.get(x.id) })).find(x => x.room && x.room === M.here) || PEOPLE.find(x => P(x.id).visits > 0) || PEOPLE[0];
      await goPerson(near.id);
    }
    await p.click('.tp-sheet.on .tp-ib[aria-label="Notebook"]'); await p.waitForTimeout(200);
    await p.click('.tp-sheet.on .tp-tab[data-tab="leads"]').catch(() => {}); await p.waitForTimeout(100);
    const got = await p.evaluate(async (text) => { const e = [...document.querySelectorAll(".tp-sheet.on .tp-entry.lead")].find(x => x.querySelector("h3")?.textContent === text);
      const btn = e?.querySelector(".tp-hintbtn"); if (!btn) return null; btn.click(); await new Promise(r => setTimeout(r, 200));
      const e2 = [...document.querySelectorAll(".tp-sheet.on .tp-entry.lead")].find(x => x.querySelector("h3")?.textContent === text);
      return [...(e2?.querySelectorAll("p.hint") || [])].map(p => p.textContent).at(-1) || null; }, lead.text);
    await closeAll(); if (!got) return false;
    spend("hint"); M.lastHint = T.turns; M.thoughts.push({ turn: T.turns + 1, lead: lead.id, leadText: lead.text, thought: got, why });
    console.log(`  [${seed}] t${T.turns + 1} thought on "${lead.text.slice(0, 60)}": ${got}`);
    learnWords(got); M.heard.push({ turn: T.turns, where: "thought", text: got });
    // a thought is followed now, as a player does on reading it: the lead's own place and people first (where it says to
    // go; a route named on the way, "the great stair, then the best bedchamber…", is how to get there), then what the
    // thought names; places and people already done get another go (a room swept afresh)
    // (a person the thought names comes first, "press Dame Anne on…"; then the lead's place, then the places the thought
    // names from the last, the end of a route; then the lead's people)
    const tt = targetsOf(got), wt = targetsOf(`${lead.where}`), nt = targetsOf(lead.now || "").filter(x => x.type === "person");
    const tgs = [...tt.filter(x => x.type === "person"), ...wt.filter(x => x.type === "room"), ...tt.filter(x => x.type === "room").reverse(), ...wt.filter(x => x.type === "person"), ...nt];
    for (const tg of tgs) { if (tg.type === "person") M.visitSig.delete(tg.id); else for (const r of tg.ids) { M.searched.delete(r); for (const k of [...M.leadRoom.keys()]) if (k.endsWith(`|${r}`)) M.leadRoom.delete(k); } }
    if (tgs.length) M.hints.push({ text: got, targets: tgs, turn: T.turns, used: false, fromThought: true });
    await tick("hint", `a thought on "${lead.text.slice(0, 70)}"`, { thought: got, why });
    return true;
  }

  // ---- questioning: each matter worth raising, a press where a claim heard meets an open doubt, a show where what you
  // learned shares words with what they told you (capped per person per lead) -----------------------------------------
  const P = (id) => { if (!M.person.has(id)) M.person.set(id, { did: new Map(), claimOf: new Map(), shown: new Set(), perLead: new Map(), visits: 0, guardedLeft: false }); return M.person.get(id); };
  const claimsOf = (id) => (V.persons.find(q => q.id === id)?.claims || []);
  function leadsAbout(id) { const NT = nameToks().get(id) || []; return (V.leads?.open || []).filter(l => NT.some(w => toks(`${l.text} ${l.where} ${l.now}`).includes(w))); }
  function doubtLeads(id, text) { return leadsAbout(id).concat((V.leads?.open || []).filter(l => overlap(text, l.text).length >= 1)).filter((l, i, a) => a.indexOf(l) === i && overlap(text, `${l.text} ${l.where}`).length >= 1); }
  async function question(id, why) {
    await goPerson(id); const me = P(id); me.visits++; M.visitSig.set(id, sig());
    // (closed up when you left them: the panel, reopened, no longer shows it, but you remember; questions wear it off)
    let startedGuarded = me.guardPending || (await panelState())?.guarded, guardBurn = 0; me.guardPending = false;
    for (let step = 0; step < 30 && T.turns < MAX; step++) {
      const s = await expandChips(); if (!s) break;
      if (s.guarded && !startedGuarded) { me.guardPending = true; me.guardedAt = T.turns; break; }
      if (startedGuarded && guardBurn < 3) { guardBurn++; const c = s.chips.find(c => c.dry) || s.chips[0]; const said = await ask(id, c); if (said.length && !s.guarded && guardBurn > 1) startedGuarded = false; continue; }
      startedGuarded = false;
      const k = sig(), did = (t, st) => me.did.get(`${t}|${st}|${k}`), mark = (t, st) => me.did.set(`${t}|${st}|${k}`, true);
      // (tie-breaks by the seed: among chips of the same standing, which first)
      const chips = s.chips.map(c => ({ ...c, j: jit() })), shuffled = chips.map(c => ({ c, r: R() })).sort((a, b) => a.r - b.r).map(x => x.c);
      // (a chip the panel marks "press": pressed, as its badge says, once for what is learned now)
      const pm = shuffled.find(c => c.press && !c.dry && !did(c.topic, "press"));
      if (pm) { mark(pm.topic, "press"); await raise(id, pm, "press"); continue; }
      // a) a matter not yet raised, worth raising
      let c = shuffled.find(c => !c.dry && !c.asked && !did(c.topic, "ask"));
      // b) one raised before but still worth raising (something new behind it): ask again, then press
      if (!c) c = shuffled.find(c => !c.dry && c.asked && !did(c.topic, "ask"));
      if (c) { mark(c.topic, "ask"); const before = claimsOf(id).map(x => x.label); await raise(id, c);
        const after = claimsOf(id).map(x => x.label).filter(l => !before.includes(l)); for (const l of after) me.claimOf.set(c.topic, l);
        continue; }
      const pressable = shuffled.filter(c => !c.dry && c.asked && !did(c.topic, "press"));
      if (pressable.length) { const c = pressable[0]; mark(c.topic, "press"); await raise(id, c, "press"); continue; }
      // c) press a claim heard, where an open lead doubts it
      const pc = chips.filter(c => me.claimOf.has(c.topic) && !did(c.topic, "press") && !claimsOf(id).find(x => x.label === me.claimOf.get(c.topic))?.broken)
        .map(c => ({ c, L: doubtLeads(id, `${me.claimOf.get(c.topic)} ${c.label}`) })).filter(x => x.L.length);
      if (pc.length) { const { c } = pc[0]; mark(c.topic, "press"); await raise(id, c, "press"); continue; }
      // d) show: what you learned (or hold), on the matter of theirs it shares most words with
      const ev = await p.evaluate(() => window.__cp.evidence());
      let best = null;
      const mine = new Set(V.clues.filter(c => c.from === `from ${PEOPLE.find(x => x.id === id)?.name}`).map(c => c.label));
      for (const e of ev) { if (me.shown.has(e.label) || mine.has(e.label)) continue;
        for (const c of chips) { const claim = me.claimOf.get(c.topic) || "", L = leadsAbout(id).map(l => ({ l, o: overlap(e.label, `${l.text} ${l.where}`).length })).sort((a, b) => b.o - a.o)[0];
          const sc = 2 * overlap(e.label, `${c.label} ${claim}`).length + (L?.o || 0) + (claim ? 0.5 : 0) + c.j;
          const lead = L?.o ? L.l.id : "_"; if ((me.perLead.get(lead) || 0) >= 2) continue;
          if (sc >= 2 && (!best || sc > best.sc)) best = { e, c, sc, lead }; } }
      if (best) { me.shown.add(best.e.label); me.perLead.set(best.lead, (me.perLead.get(best.lead) || 0) + 1); await show(id, best.e.id, best.e.label, best.c.topic, best.c.label); continue; }
      break;
    }
    await closeAll();
  }

  // ---- searching a room: turn on the spot at a few places, sample the aim over the screen, act on what is cued -------
  const SKIP = /door|leaf|shutter|casement|window|gate|stair|hanging|curtain|bell/;
  const GRID = []; for (const x of [-0.75, -0.4, 0, 0.4, 0.75]) for (const y of [-0.55, -0.25, 0.05, 0.35]) GRID.push([x, y]);
  async function sweep(pts, floor, yaws, pitches, grid = GRID) {
    return p.evaluate(async ({ pts, floor, yaws, pitches, grid }) => {
      const THREE = window.__THREE, cam = window.__camera, rc = new THREE.Raycaster(); rc.far = 2.8;
      const raf = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const out = new Map(), people = new Set();
      for (const [x, y] of pts) for (const yaw of yaws) for (const pitch of pitches) {
        window.__place(x, y, yaw, pitch, floor); await raf();
        for (const [nx, ny] of grid) { const a = window.__aim(nx, ny); if (!a) continue;
          if (a.presence) { people.add(a.presence); continue; }
          // the thing the aim chose (its forgiving circle may have found a small thing beside the sample): the ray at the
          // sample, else rays round it (as the aim's own rings), until one meets a thing of that kind (or the looked-at thing)
          const first = (vx, vy) => { rc.setFromCamera(new THREE.Vector2(vx, vy), cam); return rc.intersectObjects(window.__scene.children, true).find(h => { let o = h.object; while (o) { if (o.visible === false) return false; o = o.parent; } return h.object.material?.visible !== false; }); };
          const fits = (h) => h && (a.look ? !!h.object.userData.look : window.__works.find(h)?.b?.kind?.kind === a.kind);
          let h = first(nx, ny);
          if (!fits(h)) { h = null; for (const [px, n] of [[24, 8], [48, 12]]) { for (let j = 0; j < n && !h; j++) { const an = j * 2 * Math.PI / n, q = first(nx + Math.cos(an) * px * 2 / innerWidth, ny + Math.sin(an) * px * 2 / innerHeight); if (fits(q)) h = q; } if (h) break; } }
          if (!h) continue; const t = window.__works.find(h);
          let key = null; if (t?.b && !a.look) key = t.b.node.uuid + "|" + a.aff + (/drawers/.test(a.aff || "") ? "|" + h.point.toArray().map(v => Math.round(v * 4)).join(",") : ""); else if (a.look) key = "look:" + h.point.toArray().map(v => Math.round(v * 2)).join(",");
          if (!key || out.has(key)) continue;
          out.set(key, { key, kind: a.kind || null, look: !!a.look, aff: a.aff || null, pt: h.point.toArray(), from: [x, y] }); } }
      return { things: [...out.values()], people: [...people] };
    }, { pts, floor, yaws, pitches, grid });
  }
  // face a point from where it was seen; what the thumb's button shows (Look, Take, Use, Locked, Talk) and the cue's words
  async function faceThing(c, floor) {
    return p.evaluate(async ({ c, floor }) => { const raf = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const btnOf = () => { const btn = [...document.querySelectorAll("body > button")].find(b => b.style.width === "72px"), live = [...document.querySelectorAll('body > div[role="status"]')].find(d => d.style.clip);
        return { mode: btn && btn.style.display !== "none" ? btn.getAttribute("aria-label") : null, label: live?.textContent || "", aim: window.__aim(0, 0) }; };
      if (c.pose) { const [x, y, yaw, pitch] = c.pose; window.__place(x, y, yaw, pitch, floor); await raf(); await new Promise(r => setTimeout(r, 200)); await raf(); return btnOf(); }
      const [x, y] = c.from; window.__place(x, y, 0, 0, floor); await raf();
      const cam = window.__camera, tx = c.pt[0], ty = -c.pt[2], dz = c.pt[1] - cam.position.y, d = Math.hypot(tx - x, ty - y);
      window.__place(x, y, Math.atan2(-(tx - x), ty - y) * 180 / Math.PI, Math.atan2(dz, d) * 180 / Math.PI, floor); await raf(); await new Promise(r => setTimeout(r, 200)); await raf();
      const btn = [...document.querySelectorAll("body > button")].find(b => b.style.width === "72px"), live = [...document.querySelectorAll('body > div[role="status"]')].find(d => d.style.clip);
      return { mode: btn && btn.style.display !== "none" ? btn.getAttribute("aria-label") : null, label: live?.textContent || "", aim: window.__aim(0, 0) }; }, { c, floor });
  }
  // an opened thing said to hold something: from a step or so off it, turn and tilt over it until the hand offers "take out"
  async function reachScan(c, floor) {
    return p.evaluate(async ({ c, floor }) => { const raf = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const tx = c.pt[0], ty = -c.pt[2], [fx, fy] = c.from, d0 = Math.hypot(fx - tx, fy - ty), froms = [];
      for (const d of [0.9, 1.2, 0.7, 1.5]) { if (d >= d0) continue; const x = tx + (fx - tx) * d / d0, y = ty + (fy - ty) * d / d0; if (window.__walk(x, y, x + 0.03, y, floor).done && window.__walk(x, y, x, y + 0.03, floor).done) { froms.push([x, y]); break; } }
      froms.push(c.from);
      for (const [x, y] of froms) { const base = Math.atan2(-(tx - x), ty - y) * 180 / Math.PI;
        for (const dyaw of [0, 10, -10, 20, -20, 30, -30, 40, -40]) for (const pitch of [-20, -30, -40, -50, -60, -15, -70]) {
          window.__place(x, y, base + dyaw, pitch, floor); await raf(); await new Promise(r => setTimeout(r, 30)); await raf();
          const btn = [...document.querySelectorAll("body > button")].find(b => b.style.width === "72px"), live = [...document.querySelectorAll('body > div[role="status"]')].find(d => d.style.clip);
          const mode = btn && btn.style.display !== "none" ? btn.getAttribute("aria-label") : null, label = live?.textContent || "";
          if (mode === "Take" && /^take out/i.test(label)) return { f: { mode, label, aim: window.__aim(0, 0) }, pose: [x, y, base + dyaw, pitch] }; } }
      return null; }, { c, floor });
  }
  const pressUse = () => p.evaluate(() => { const btn = [...document.querySelectorAll("body > button")].find(b => b.style.width === "72px"); const r = btn.getBoundingClientRect(), at = { bubbles: true, cancelable: true, pointerType: "touch", pointerId: 77, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2 };
    // (the button acts when the finger lifts, unmoved, since 2026-10-08's touch work: a press is down then up)
    btn.dispatchEvent(new PointerEvent("pointerdown", at)); btn.dispatchEvent(new PointerEvent("pointerup", at)); });
  async function afterPress() {
    await p.waitForTimeout(250);
    const rd = await p.evaluate(() => { const r = document.querySelector(".tp-sheet.on.rd"); return r ? { title: r.querySelector(".tp-title")?.textContent, noted: r.querySelector(".tp-rdfoot")?.textContent || "", text: r.querySelector(".tp-read")?.textContent.slice(0, 2000) } : null; });
    if (rd) { M.reads.push({ turn: T.turns, ...rd }); learnWords(`${rd.title} ${rd.text}`); }
    await closeAll(); return rd;
  }
  async function search(roomId, why) {
    await closeAll(); await goRoom(roomId); spend("search");
    const { pts, floor } = await standPoints(roomId); const held0 = await heldN();
    const yaws = Array.from({ length: 12 }, (_, i) => (i * 30 + Math.floor(R() * 30)) % 360);
    const sw = await sweep(pts, floor, yaws, [-12, -42]);
    for (const id of sw.people) M.seenAt.set(id, roomId);
    // (a thing opened before that still holds what you were told of: reach in again)
    const queue = sw.things.filter(c => { const m = M.things.get(c.key); return !m || (m.locked && m.lockedHeld < held0) || (m.look && !m.done) || (m.reach > 0); });
    // the eye first, then single things, then a press's many drawers
    const rank = (c) => c.look ? 0 : /drawers/.test(c.aff || "") ? 2 : 1;
    queue.sort((a, b) => (rank(a) - rank(b)) || (R() - 0.5));
    const kinds = []; let n = 0, idle = 0;
    // a drawer is opened when its label shares a word with what you know or are asking (a labelled bank of a hundred
    // drawers is not opened one by one), and a couple of others for luck; nothing is shut again
    const corpus = () => [...(V.leads?.open || []).map(l => `${l.text} ${l.where}`), ...V.clues.map(c => c.label), ...M.heard.map(h => h.text)].join(" ");
    while (queue.length && n++ < 40 && T.turns < MAX) {
      const c = queue.shift(), m = M.things.get(c.key) || { presses: 0 }; M.things.set(c.key, m);
      let f = await faceThing(c, floor); const usedLabels = new Set(); let usedUse = false;
      if (A.debug) console.log("   face", c.kind, c.aff, JSON.stringify(f));
      for (let k = 0; k < 6 && f.mode; k++) {
        if (f.mode === "Talk") break;
        // (the hand on an open thing, "take out …": the game says what is in it and offers to reach in; always take it)
        const reachIn = f.mode === "Take" && /^take out/i.test(f.label);
        if (f.mode !== "Look" && !reachIn && (SKIP.test(c.kind || "") || /^light$/.test(c.aff || ""))) break;
        if (f.mode === "Locked") { m.locked = true; m.lockedHeld = await heldN(); break; }
        // (a second Use only on another thing behind the first: the box inside the chest, "open the box")
        if (f.mode === "Use" && usedLabels.has(f.label)) break;
        if (f.mode === "Take" && usedUse && !reachIn && !(m.reach > 0)) break; if (f.mode === "Take" && usedUse && !reachIn) m.reach--;
        if (/^(close|shut|put out|blow out)/i.test(f.label)) break;
        if (f.mode === "Use" && /drawers/.test(c.aff || "")) { const own = f.label.replace(/^open the drawers?\s*·?\s*/i, "");
          if (!(own && overlap(own, corpus()).length) && idle++ >= 2) break; }
        if (f.mode === "Use") { usedUse = true; usedLabels.add(f.label); }
        if (f.mode === "Look" && k > 0) break;               // (the eye stays on a thing only looked at: once is enough)
        await pressUse(); m.presses++; kinds.push(`${f.mode}:${c.kind || "look"}`);
        const rd = await afterPress(); spend(rd ? "paper" : "act");
        if (reachIn) m.reach = Math.max(0, (m.reach || 1) - 1);
        await tick("act", `${f.mode} ${f.label || c.kind || "?"} (${roomById.get(roomId).name.toLowerCase()})`, { ...(rd ? { read: rd.title, noted: rd.noted } : {}), ...(reachIn ? { reachIn: true } : {}) });
        // (told what it holds, 'In X: a, b and c': a player reaches in for each)
        { const said = T.log.at(-1).heard || []; const inn = said.find(h => /^In [^:]+: /.test(h)); if (inn) m.reach = (m.reach || 0) + inn.split(/,| and /).length; }
        // opened: what it holds is now in view; look again round it
        if (f.mode === "Use") { const more = await sweep([c.from], floor, [-25, -12, 0, 12, 25].map(d => ((Math.atan2(-(c.pt[0] - c.from[0]), -c.pt[2] - c.from[1]) * 180 / Math.PI) + d)), [-20, -45, -65]);
          for (const q of more.things) if (!M.things.has(q.key) && !queue.some(x => x.key === q.key) && q.key !== c.key) queue.unshift(q); }
        f = await faceThing(c, floor);
        // (told what is in it, and the lid swung up out of the aim: look down into it, as a player tilts to see inside)
        // (told what is in it, and the open lid swung out of the aim: step up to it and look down into it, as a player does)
        if (m.reach > 0 && !(f.mode === "Take" && /^take out/i.test(f.label))) { const g = await reachScan(c, floor); if (g) { f = g.f; c.pose = g.pose; } }
        if (A.debug) console.log("   again", JSON.stringify(f));
      }
      if (f.mode === "Take" && /^take out/i.test(f.label)) M.reachLeft = (M.reachLeft || 0) + 1;     // (left with the hand still offering: a bot fault, counted)
      m.done = true; if (c.look) m.look = true;
    }
    M.searched.set(roomId, { turn: T.turns, sig: sig(), held: await heldN(), things: sw.things.length, kinds });
    return sw.things.length;
  }

  // ---- what to do next: the top open lead's people and places, servants' words, anyone with matters left ---------------
  const leadIsCoroner = (l) => /accuse/i.test(l.where || "") || /coroner/i.test(l.text);
  async function personWorth(id) {
    if (!whereIs(id)) return false;
    const q = V.persons.find(x => x.id === id), me = P(id);
    if (me.guardPending) return T.turns - me.guardedAt >= 6;
    if (M.visitSig.get(id) === sig()) return false;
    if (!q || /not yet questioned/.test(q.note || "")) return true;
    if (q.fresh > 0) return true;
    // something learned since the last visit that shares words with what they told you or a lead about them
    const ev = await p.evaluate(() => window.__cp.evidence());
    const text = [...claimsOf(id).map(c => c.label), ...leadsAbout(id).map(l => `${l.text} ${l.where}`)].join(" ");
    return ev.some(e => !me.shown.has(e.label) && overlap(e.label, text).length >= 1);
  }
  async function roomWorth(roomId, leadId) {
    const s = M.searched.get(roomId); if (!s) return true;
    const key = `${leadId}|${roomId}`, tries = M.leadRoom.get(key) || 0; if (tries >= 2) return false;
    return s.sig !== sig() || s.held < await heldN();
  }
  async function fromTargets(targets, leadId) {
    for (const tg of targets) {
      if (tg.type === "person" && await personWorth(tg.id)) return { do: "question", id: tg.id, why: leadId };
      if (tg.type === "room") for (const r of tg.ids) if (await roomWorth(r, leadId)) return { do: "search", room: r, why: leadId };
    }
    return null;
  }
  async function decide() {
    // (a servant's word is followed now or not at all; a thought is kept until there is something to do on it, 40 turns)
    for (const h of M.hints.filter(h => !h.used && !(h.fromThought && T.turns - h.turn > 40)).reverse()) { const a = await fromTargets(h.targets, "hint"); if (a || !h.fromThought) h.used = true; if (a) return { ...a, why: `${h.fromThought ? "thought" : "hint"}: ${h.text.slice(0, 80)}` }; }
    let open = (V.leads?.open || []).filter(l => !leadIsCoroner(l));
    // (tie-break by the seed: now and then the second lead first)
    if (open.length > 1 && R() < LEAD_SKIP) open = [open[1], open[0], ...open.slice(2)];
    const tgOf = (l) => [...targetsOf(`${l.where}`), ...targetsOf(l.now || "").filter(x => x.type === "person"), ...targetsOf(l.text), ...(l.hints || []).flatMap(h => targetsOf(h))];
    // first somewhere or someone the leads name that you've never been to or questioned (a first-timer goes to see the
    // room where he lay before asking the same people again), then the leads in order
    for (const l of open) { const fresh = tgOf(l).map(t => t.type === "room" ? { ...t, ids: t.ids.filter(r => !M.searched.has(r)) } : t).filter(t => t.type === "room" ? t.ids.length : !(P(t.id).visits > 0));
      const a = await fromTargets(fresh, l.id); if (a) return { ...a, why: `${l.id} (new)` }; }
    for (const l of open) { const a = await fromTargets(tgOf(l), l.id); if (a) return { ...a, why: l.id }; }
    for (const q of V.persons) if (q.fresh > 0 && await personWorth(q.id)) return { do: "question", id: q.id, why: "matters left" };
    return null;
  }

  // ---- the accusation: each blank from the book's words, a group at a time, the next best on a wrong group ----------
  async function accuse(reason) {
    await closeAll(); await nbv();
    const corpus = [...V.clues.map(c => [c.label, c.struck ? -1 : 1]), ...V.contradictions.flatMap(c => [[c.text.replace(/^[^:]*:/, ""), -3], [c.by, 2]]), ...V.persons.flatMap(q => (q.claims || []).filter(c => c.broken).map(c => [c.by, 1])),
      ...(V.leads?.done || []).map(l => [l.text, 0.5]), ...M.reads.map(r => [`${r.title} ${r.noted}`, 0.5])];
    const docs = corpus.map(([t, w]) => ({ T: new Set(toks(t)), w }));
    await p.evaluate(() => window.__cp.openAccusation()); await p.waitForTimeout(300); spend("sheet");
    const blanks = await p.evaluate(() => [...document.querySelectorAll('.tp-sheet.on [data-blank]')].map(b => ({ key: b.dataset.blank, name: b.textContent, sealed: b.classList.contains("sealed"), right: b.classList.contains("right") })));
    const opts = {};
    for (const bl of blanks) { await p.click(`.tp-sheet.on [data-blank="${bl.key}"]`); await p.waitForTimeout(150);
      opts[bl.key] = await p.evaluate(() => ({ list: [...document.querySelectorAll(".tp-sheet.on .tp-opt")].map(o => ({ id: o.dataset.option, label: o.textContent })), note: document.querySelector(".tp-sheet.on .tp-picknote")?.textContent || "" }));
      await p.keyboard.press("Escape"); await p.waitForTimeout(120); }
    const groups = await p.evaluate(() => [...document.querySelectorAll(".tp-sheet.on [data-group]")].map(g => ({ id: g.dataset.group, label: g.textContent.replace(/^Confirm(ed:)?\s*/, ""), done: /^Confirmed/.test(g.textContent) })));
    const GW = (s) => s.toLowerCase().split(/[^a-z]+/).filter(w => w && !["the", "and", "by", "was", "what", "how", "door"].includes(w)).map(stem);
    for (const g of groups) g.keys = blanks.filter(bl => GW(bl.name).some(w => GW(g.label).includes(w))).map(bl => bl.key);
    // scores: an option's own words (those not shared with the blank's other options) found in the book
    const scoreOpt = (key, o) => { if (key === "suspect") { const id = o.id, NT = nameToks().get(id) || toks(o.label);
        const broken = V.persons.find(q => q.id === id)?.claims?.filter(c => c.broken).length || 0, caught = V.contradictions.filter(c => NT.some(w => toks(c.text).includes(w))).length;
        const said = V.clues.filter(c => NT.some(w => toks(c.label).includes(w))).length; return 3 * broken + 2 * caught + 0.5 * said; }
      const share = (w) => opts[key].list.filter(x => toks(x.label).includes(w)).length, own = toks(o.label);
      let s = 0; for (const w of own) s += Math.max(-3, Math.min(3, docs.filter(d => d.T.has(w)).reduce((a, d) => a + d.w, 0))) / share(w); return s / Math.sqrt(Math.max(1, own.length)); };
    const scored = {}; for (const bl of blanks) scored[bl.key] = opts[bl.key].list.map(o => ({ ...o, s: scoreOpt(bl.key, o) + jit() })).sort((a, b) => b.s - a.s);
    const result = { reason, blanks: blanks.map(b => ({ key: b.key, sealed: b.sealed, options: opts[b.key].list.length, note: opts[b.key].note, ranked: scored[b.key].map(o => `${o.label.slice(0, 50)} (${o.s.toFixed(2)})`) })), groups: [], wrong: 0, solved: false, excluded: [] };
    for (const g of groups) {
      if (g.done) { result.groups.push({ id: g.id, ok: true, tries: 0, before: true }); continue; }
      if (g.keys.some(k => !scored[k].length)) { result.groups.push({ id: g.id, ok: false, why: "a blank had no option offered" }); continue; }
      // the combinations, best total first
      let combos = [[]]; for (const k of g.keys) combos = combos.flatMap(c => scored[k].map(o => [...c, o]));
      combos = combos.map(c => ({ c, s: c.reduce((a, o) => a + o.s, 0) })).sort((a, b) => b.s - a.s);
      let ok = false, tries = 0;
      for (const { c } of combos) {
        if (tries >= 20) break;
        if (g.keys.includes("suspect") && result.excluded.includes(c[g.keys.indexOf("suspect")].id)) continue;
        for (let i = 0; i < g.keys.length; i++) { await p.click(`.tp-sheet.on [data-blank="${g.keys[i]}"]`); await p.waitForTimeout(100); await p.click(`.tp-sheet.on .tp-opt[data-option="${c[i].id}"]`); await p.waitForTimeout(100); }
        await p.click(`.tp-sheet.on [data-group="${g.id}"]`); await p.waitForTimeout(250); tries++; spend("accuse");
        const r = await p.evaluate((keys) => ({ right: keys.every(k => document.querySelector(`.tp-sheet.on [data-blank="${k}"]`)?.classList.contains("right")), rebut: document.querySelector(".tp-sheet.on .tp-note.rebut")?.textContent || "", verdict: document.querySelector(".tp-verdict")?.textContent || "" }), g.keys);
        T.turns++; T.log.push({ t: T.turns, kind: "accuse", detail: `${g.label}: ${c.map(o => o.label.slice(0, 40)).join(" / ")}`, ok: r.right, rebut: r.rebut.slice(0, 200), est: Math.round(T.est) });
        if (r.right) { ok = true; break; }
        result.wrong++; if (r.rebut && g.keys.includes("suspect")) result.excluded.push(c[g.keys.indexOf("suspect")].id);
      }
      result.groups.push({ id: g.id, ok, tries });
    }
    result.verdict = await p.evaluate(() => document.querySelector(".tp-verdict")?.textContent || "");
    result.receiptLine = (/\(Solved in [^)]*\)/.exec(result.verdict) || [""])[0];
    result.solved = !!result.verdict && result.groups.every(g => g.ok);
    return result;
  }
  async function peekSeals() { await p.evaluate(() => window.__cp.openAccusation()); await p.waitForTimeout(200); const s = await p.evaluate(() => [...document.querySelectorAll('.tp-sheet.on [data-blank]')].map(b => ({ key: b.dataset.blank, sealed: b.classList.contains("sealed") }))); await closeAll(); return s; }

  // ---- once, mid-case: reload the page (a phone's tab killed and come back to) and check the case is taken up again ----
  async function reloadCheck() {
    await closeAll(); await p.waitForTimeout(600);                        // (the case saves 250 ms after a turn)
    const look = () => p.evaluate(() => ({ at: [+window.__camera.position.x.toFixed(2), +(-window.__camera.position.z).toFixed(2)], room: document.querySelector("#where .n")?.textContent || "", rec: window.__cp.receipts() }));
    const nb = (v) => ({ clues: v.clues.map(c => c.label).sort(), persons: v.persons.map(q => `${q.id}:${(q.claims || []).length}`).sort(), open: (v.leads?.open || []).map(l => `${l.id}:${(l.hints || []).length}`).sort(), done: (v.leads?.done || []).length, caught: v.contradictions.length });
    const before = { ...(await look()), nb: nb(V) };
    await p.reload({ timeout: 300000 }); await p.waitForFunction(() => window.__ok && window.__cp, null, { timeout: 300000 }); M.saidN = 0;
    await p.waitForTimeout(500); await nbv(); spend("reload");
    const after = { ...(await look()), nb: nb(V), url: p.url() };
    const line = (await p.evaluate(() => window.__said)).find(t => /take up the case again/.test(t)) || "";
    const same = (k) => JSON.stringify(before.nb[k]) === JSON.stringify(after.nb[k]);
    const r = { turn: T.turns, url: after.url, line, clues: [before.nb.clues.length, after.nb.clues.length], cluesSame: same("clues"), personsSame: same("persons"), leadsSame: same("open"), doneSame: same("done"), caughtSame: same("caught"),
      room: [before.room, after.room], moved_m: +Math.hypot(before.at[0] - after.at[0], before.at[1] - after.at[1]).toFixed(2), questions: [before.rec.questions, after.rec.questions], minutes: [before.rec.minutes, after.rec.minutes], hints: [before.rec.hints, after.rec.hints] };
    r.ok = !!line && r.cluesSame && r.personsSame && r.leadsSame && r.doneSame && r.caughtSame && before.room === after.room && r.questions[0] === r.questions[1];
    M.reload = r; console.log(`  [${seed}] reload at t${T.turns}: ${r.ok ? "resumed" : "DIFFERS"} ${JSON.stringify(r)}`);
    noteLines(await heardLines(), "reload");
    await tick("reload", `the page reloaded mid-case: ${r.ok ? "taken up again" : "differs"}`, { reload: r });
  }

  // ---- the play ----------------------------------------------------------------------------------------------------------
  await launch(false);
  noteLines(await heardLines(), "arrival");
  for (const id of await p.evaluate(() => [...window.__presences].filter(([, q]) => q.room === "great_hall").map(([id]) => id))) M.seenAt.set(id, "great_hall");   // (you arrive facing whoever meets you)
  M.here = "great_hall";
  // (a probe: search one room, as a test of the search loop)
  if (A.room) { await search(A.room, "probe"); const out = { seed, probe: A.room, log: T.log, things: [...M.things], heard: M.heard }; writeFileSync(`${OUT}/probe-${A.room}.json`, JSON.stringify(out, null, 1)); await b.close(); return { seed, probe: true, log: T.log }; }
  let acc = null, idles = 0, why = "", reloaded = false, fails = 0;
  for (;;) {
    try {
      if (!acc) {
        while (T.turns < MAX) {
          await mirror(); await nbv();
          const open = V.leads?.open || [];
          if (open.some(leadIsCoroner)) { why = "the coroner lead opened"; break; }
          if (V.leads && !open.length && V.leads.done.length) { why = "every lead closed"; break; }
          if (!reloaded && T.turns >= RELOAD_AT) { reloaded = true; await reloadCheck(); continue; }
          // (--crash-at N: the browser killed outright at turn N, to test the restart and resume from the saved case)
          if (A["crash-at"] && T.turns >= +A["crash-at"] && !S.simulated) { S.simulated = T.turns; await b.close(); }
          // stuck a while with nothing new: ask the notebook for a thought (no more than one per few turns)
          if (T.turns - M.lastProgress >= HINT_STALL && T.turns - M.lastHint >= 8 && await takeHint(`no progress for ${T.turns - M.lastProgress} turns`)) continue;
          // a question that has stood open a long while, its places and people already been to: a thought on it
          { const long = (V.leads?.open || []).filter(l => !leadIsCoroner(l) && l.more && T.turns - (M.leads.get(l.id)?.raised ?? T.turns) >= 40 && T.turns - (M.leadHint?.[l.id] ?? -99) >= 30)
              .sort((a, b) => (M.leads.get(a.id)?.raised ?? 0) - (M.leads.get(b.id)?.raised ?? 0))[0];
            if (long && T.turns - M.lastHint >= 8) { (M.leadHint ||= {})[long.id] = T.turns; if (await takeHint(`open ${T.turns - M.leads.get(long.id).raised} turns`, long.id)) continue; } }
          const a = (T.turns - M.lastProgress > STALL) ? null : await decide();
          if (a) { idles = 0; spend("glance");
            if (a.do === "question") { console.log(`[${seed}] t${T.turns} question ${a.id} (${a.why})`); await question(a.id, a.why); }
            else { console.log(`[${seed}] t${T.turns} search ${a.room} (${a.why})`); const key = `${a.why}|${a.room}`; M.leadRoom.set(key, (M.leadRoom.get(key) || 0) + 1); await search(a.room, a.why); }
            continue; }
          // nothing to follow: a thought first, then wait for a word (a minute passes)
          if (T.turns - M.lastHint >= 2 && await takeHint("nothing to follow")) continue;
          if (idles >= 6) { why = "stuck: six minutes waited with nothing new to follow"; break; }
          idles++; M.stuck.push({ turn: T.turns, open: open.map(l => l.id), lastProgress: M.lastProgress });
          await closeAll(); await p.evaluate(() => window.__cp.idle()); spend("wait"); await tick("idle", "a minute passes");
          if (T.turns - M.lastProgress > STALL) M.lastProgress = T.turns - STALL + 12;     // (a word heard gives a few more turns to follow it)
        }
        if (T.turns >= MAX) why = "turn cap";
        await mirror();
        M.seals = await peekSeals();
        acc = await accuse(why);
        // what the narrator dealt, by its own count of turns (a silent clock shows only here)
        M.narr = await p.evaluate(() => { const s = window.__narrator?.state(); return s ? { turns: s.turns, beats: s.log, clocks: s.fired } : null; }).catch(() => null);
      }
      break;
    } catch (e) {
      const crashed = CRASH.test(e.message) || !b?.isConnected() || p?.isClosed();
      if (crashed && S.crashes < 3) { await restart(e.message); continue; }
      if (!crashed && fails++ < 5) { S.botErrors.push({ turn: T.turns, err: e.message.slice(0, 200) }); console.log(`  [${seed}] bot error at t${T.turns}: ${e.message.slice(0, 160)}`); try { await closeAll(); } catch (_) {} continue; }
      throw e;
    }
  }
  await nbv();
  const rec = await p.evaluate(() => window.__cp.receipts());
  const leads = [...M.leads].map(([id, l]) => ({ id, text: l.text, raised: l.raised, closed: l.closed, open_for: (l.closed ?? T.turns) - l.raised }));
  // stalls: stretches of 12 or more turns with nothing new in the book, what was being done, a person's minutes in them
  const stalls = []; { let last = { t: 0, est: 0 }; for (const e of T.log) { if (e.prog || e === T.log.at(-1)) { if (e.t - last.t >= 12) { const seg = T.log.filter(x => x.t > last.t && x.t <= e.t);
      stalls.push({ from: last.t, to: e.t, turns: e.t - last.t, minutes: +(((e.est ?? last.est) - last.est) / 60).toFixed(1), doing: [...new Set(seg.map(x => x.detail.replace(/\s*\(.*$/, "").slice(0, 60)))].slice(0, 12), ended: e.learned || e.detail }); } last = { t: e.t, est: e.est ?? last.est }; } } }
  const out = { seed, type_p: TYPE_P, solved: acc.solved, turns: T.turns, est_minutes: +(T.est / 60).toFixed(1), est_by: Object.fromEntries(Object.entries(T.estBy).map(([k, v]) => [k, +(v / 60).toFixed(1)])),
    questions: T.q, typed: T.typed, typed_none: T.typedNone, typed_other: T.typedMiss, acts: T.acts, moves: T.moves, idles: T.idles, hints: T.hints, tapFallbacks: T.tapFallbacks, reachLeft: M.reachLeft || 0,
    why, seals: M.seals, accusation: acc, receipts: rec, reload: M.reload, crashes: S.crashes, loadFails: S.loadFails || 0, restarts: S.restarts, simulated_crash_at: S.simulated || null, botErrors: S.botErrors, thoughts: M.thoughts, stalls,
    clues: V.clues.map(c => `${c.label} (${c.from})`), contradictions: V.contradictions, leads, open_at_end: (V.leads?.open || []).map(l => ({ id: l.id, text: l.text, where: l.where, now: l.now, hints: l.hints })),
    persons: V.persons, stuck: M.stuck, hints_followed: M.hints.map(h => ({ text: h.text, turn: h.turn })), heard: M.heard, reads: M.reads.map(r => ({ turn: r.turn, title: r.title, noted: r.noted })),
    searched: [...M.searched].map(([id, s]) => ({ id, ...s })), wall_s: Math.round((Date.now() - t0) / 1000), errors: errs.slice(0, 8), narrator: M.narr || null, log: T.log };
  writeFileSync(`${OUT}/run-${seed}.json`, JSON.stringify(out, null, 1));
  await b.close();
  return out;
}

const all = [];
for (const s of SEEDS) { const r = await play(s); all.push(r); if (r.probe) continue;
  console.log(`seed ${s}: ${r.solved ? "SOLVED" : "not solved"} in ${r.turns} turns, ~${r.est_minutes} min for a person (${r.questions} questions, ${r.typed} typed, ${r.typed_none} read as none, ${r.acts} acts, ${r.moves} moves, ${r.idles} waits, ${r.hints} thoughts); clues ${r.receipts.clues}/${r.receipts.of_clues}; wrong tries ${r.accusation.wrong}; model calls ${r.receipts.model_calls}; reload ${r.reload?.ok ? "ok" : "DIFFERS"}; crashes ${r.crashes}; ended: ${r.why}; ${r.wall_s}s\n  ${r.accusation.receiptLine}`); }
if (!A.room) writeFileSync(`${OUT}/summary-${SEEDS.join("_")}.json`, JSON.stringify(all.map(r => ({ seed: r.seed, type_p: r.type_p, solved: r.solved, turns: r.turns, est_minutes: r.est_minutes, clues: r.receipts.clues, of: r.receipts.of_clues, wrong: r.accusation.wrong, hints: r.hints, typed: r.typed, typed_none: r.typed_none, typed_other: r.typed_other, model_calls: r.receipts.model_calls, receipt: r.accusation.receiptLine, reload_ok: r.reload?.ok, crashes: r.crashes, errors: r.errors.length + r.botErrors.length, why: r.why })), null, 1));
