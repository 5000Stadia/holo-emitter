// A naive player of the case (M7): knows nothing of the solution and plays only by what the game shows (the notebook's
// Open leads with where to go and where people now are, the panel's chips and their dry/asked state, the eye/hand/finger
// cues on things, lines said, papers read, rooms' names), to see whether that direction alone carries a player to a
// correct verdict, and in how many turns. It never reads the case file, clue ids for meaning, _fairness or the truth.
//   node tests/.naive-play.mjs [--seeds 1,2,3] [--max 420] [--out DIR]
// Turns: one question (a chip, a press, a show), one press on a thing, one move to a room or person, one minute waited.
// Looking around a room (turning on the spot, sampling the aim) costs no turn; acting on what the cue shows does.
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const A = Object.fromEntries(process.argv.slice(2).join(" ").split(/\s*--/).filter(Boolean).map(s => { const [k, ...v] = s.split(/\s+/); return [k, v.join(" ") || true]; }));
const STALL = +(A.stall || 40);
const SEEDS = String(A.seeds || "1,2,3").split(",").map(Number), MAX = +(A.max || 420);
const OUT = A.out || "/tmp/claude-1000/-home-k-Projects-holo-emitter/97770d23-8695-4407-9f5e-30bf8e241f72/scratchpad/naive";
mkdirSync(OUT, { recursive: true });
// (voice=0: no model at all; the relay is the page's only model path)
const URL = "http://localhost:8794/lab/manor/index.html?case=case-1660&fresh&webgpu=1&voice=0";

// ---- words: what a player matches by eye ------------------------------------------------------------------------------
const STOP = new Set(("the a an and or of to in on at by for with from his her their him he she it its is was were be been this that these those what who whom whose which when where why how did does do had has have not no as up out down into over under all any some one two your you i me my our we they them there here then than so if but shall will would could should may might must sir worship master mistress mr mrs dame lady last night morning now still yet own very said says say tell told ask asked see seen saw room find shall let them whoever anyone anything every each other only also just being after before about again much more most can cannot").split(" "));
const stem = (w) => { w = w.replace(/['’]s$/, "").replace(/['’]/g, ""); if (w.length > 5) w = w.replace(/(ings|ing|edly|ed|es)$/, ""); if (w.length > 4) w = w.replace(/s$/, ""); return w; };
const toks = (s) => [...new Set(String(s || "").toLowerCase().replace(/[’‘]/g, "'").split(/[^a-z']+/).map(w => w.replace(/^'+|'+$/g, "")).filter(w => w.length >= 3 && !STOP.has(w)).map(stem).filter(w => w.length >= 3 && !STOP.has(w)))];
const overlap = (a, b) => { const B = new Set(toks(b)); return toks(a).filter(w => B.has(w)); };
const rng = (seed) => { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
const norm = (s) => String(s || "").toLowerCase().replace(/[’‘]/g, "'");

async function play(seed) {
  const R = rng(seed), jit = () => R() * 1e-3;
  const b = await chromium.launch({ args: ["--use-angle=vulkan", "--enable-features=Vulkan", "--enable-unsafe-webgpu", "--ignore-gpu-blocklist"] });
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  const t0 = Date.now();
  await p.goto(URL, { timeout: 300000 }); await p.waitForFunction(() => window.__ok && window.__cp, null, { timeout: 300000 });
  const raf = () => p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  const ROOMS = await p.evaluate(() => window.__plan.rooms.map(r => ({ id: r.id, name: r.name, floor: r.floor, rect: r.rect })));
  const roomById = new Map(ROOMS.map(r => [r.id, r]));
  const T = { turns: 0, q: 0, acts: 0, moves: 0, idles: 0, log: [], tapFallbacks: 0 };
  const M = { searched: new Map(), leadRoom: new Map(), visitSig: new Map(), person: new Map(), things: new Map(), hints: [], saidN: 0, leads: new Map(), seenAt: new Map(), lastProgress: 0, stuck: [], reads: [], heard: [] };
  let V = null, nClues = 0;
  const nbv = async () => (V = await p.evaluate(() => window.__cp.notebookView()));
  const heldN = () => p.evaluate(() => window.__cp.evidence().filter(e => e.kind === "thing").length);
  const sig = () => `${V.clues.length}/${V.contradictions.length}/${V.leads?.open.length}`;
  // what was said outside the panel (the line at the foot of the screen): beats, servants' words
  async function heardLines() { const all = await p.evaluate(() => window.__said); const fresh = all.slice(M.saidN); M.saidN = all.length; return fresh; }
  function noteLines(lines, where) { for (const t of lines) { M.heard.push({ turn: T.turns, where, text: t }); const tg = targetsOf(t); if (tg.length) M.hints.push({ text: t, targets: tg, turn: T.turns, used: false }); } }

  // ---- after every turn: the notebook, the leads' lives, what's new
  async function tick(kind, detail, extra = {}) {
    T.turns++; if (kind === "q") T.q++; else if (kind === "act") T.acts++; else if (kind === "move") T.moves++; else if (kind === "idle") T.idles++;
    const before = new Set(V?.clues.map(c => c.label) || []); await nbv();
    const fresh = V.clues.map(c => c.label).filter(l => !before.has(l));
    for (const l of V.leads?.open || []) if (!M.leads.has(l.id)) M.leads.set(l.id, { text: l.text, where: l.where, raised: T.turns, closed: null });
    for (const l of V.leads?.done || []) { const m = M.leads.get(l.id) || { text: l.text, raised: T.turns }; if (m.closed == null) m.closed = T.turns; M.leads.set(l.id, m); }
    const lsig = `${(V.leads?.open || []).map(l => l.id).join()}|${V.contradictions.length}`;
    if (fresh.length || V.clues.length !== nClues || lsig !== M.lsig) M.lastProgress = T.turns; nClues = V.clues.length; M.lsig = lsig;
    const lines = await heardLines(); noteLines(lines, kind === "idle" ? "idle" : "world");
    T.log.push({ t: T.turns, kind, detail, ...(fresh.length ? { learned: fresh } : {}), ...(lines.length ? { heard: lines } : {}), ...extra });
    if (fresh.length) console.log(`  [${seed}] t${T.turns} ${kind} ${detail} -> +${fresh.join(" | ")}`);
  }

  // ---- reading names out of what the game shows ----------------------------------------------------------------------
  let PEOPLE = await p.evaluate(() => [...window.__presences].map(([id, q]) => ({ id, name: q.p.group.name.replace(/^presence:/, "") })));
  const nameToks = () => { const all = PEOPLE.map(x => ({ id: x.id, t: toks(x.name) })); const count = new Map(); for (const x of all) for (const w of x.t) count.set(w, (count.get(w) || 0) + 1);
    const out = new Map(all.map(x => [x.id, x.t.filter(w => count.get(w) === 1)]));
    // a role read from the notebook ("the clerk") once you know it, if no one else's role shares the word
    const roles = (V?.persons || []).map(q => ({ id: q.id, t: toks((q.note || "").split(" · ")[0]) })); const rc = new Map(); for (const r of roles) for (const w of r.t) rc.set(w, (rc.get(w) || 0) + 1);
    for (const r of roles) for (const w of r.t) if (rc.get(w) === 1 && /^(clerk|heir|lawyer|attorney|widow|steward|wife|son|buyer)$/.test(w)) out.get(r.id)?.push(w);
    return out; };
  const ROOMNAMES = [...new Set(ROOMS.map(r => norm(r.name)))];
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

  // ---- moving: to a room's floor (standing clear), to face a person ---------------------------------------------------
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
    await tick("move", `to ${roomById.get(roomId).name.toLowerCase()} (${roomId})`, { hud: await hud() });
  }
  async function closeAll() { for (let i = 0; i < 6; i++) { const on = await p.evaluate(() => document.querySelectorAll(".tp-sheet.on").length); if (!on) return; await p.keyboard.press("Escape"); await p.waitForTimeout(120); } }
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
    await tick("move", `to ${PEOPLE.find(x => x.id === id)?.name}`, { hud: await hud() });
    if (ok) { await p.touchscreen.tap(195, 422); await p.waitForTimeout(450); }
    let open = await p.evaluate(() => !!document.querySelector('.tp-sheet.on[aria-label^="Speaking with"]'));
    if (!open) { T.tapFallbacks++; await p.evaluate((id) => window.__cp.talkTo(id), id); await p.waitForTimeout(200); open = true; }
    return open;
  }

  // ---- the panel, as it is on screen ----------------------------------------------------------------------------------
  const panelState = () => p.evaluate(() => {
    const talk = document.querySelector('.tp-sheet.on[aria-label^="Speaking with"]'); if (!talk) return null;
    const more = [...talk.querySelectorAll(".tp-chips .tp-chip.more")][0];
    return { more: more?.textContent || null, guarded: document.querySelector(".tp")?.classList.contains("guarded"), busy: document.querySelector(".tp")?.classList.contains("tp-busy"), hint: talk.querySelector(".tp-hint")?.textContent,
      chips: [...talk.querySelectorAll(".tp-chips .tp-chip[data-topic]")].map(c => ({ topic: c.dataset.topic, label: c.textContent, asked: c.classList.contains("asked"), dry: c.hasAttribute("data-dry") })),
      log: [...talk.querySelectorAll(".tp-log > *")].map(e => ({ cls: e.className, text: e.textContent })) }; });
  async function expandChips() { const s = await panelState(); if (s?.more === "More…") { await p.click('.tp-sheet.on .tp-chip.more'); await p.waitForTimeout(60); } return panelState(); }
  async function waitIdle() { for (let i = 0; i < 60; i++) { const busy = await p.evaluate(() => document.querySelector(".tp")?.classList.contains("tp-busy")); if (!busy) break; await p.waitForTimeout(100); } await p.waitForTimeout(80); }
  const lastLines = async (n0) => { const s = await panelState(); return (s?.log || []).slice(n0).filter(e => /tp-them|tp-aside|tp-noted/.test(e.cls)).map(e => e.text); };

  async function ask(who, chipT, stance = "ask") {
    const s0 = await panelState(), n0 = s0.log.length;
    if (stance === "press") await p.click('.tp-sheet.on .tp-st:has-text("Press for more")');
    await p.click(`.tp-sheet.on .tp-chip[data-topic="${chipT.topic}"]`); await waitIdle();
    const said = await lastLines(n0);
    await tick("q", `${stance} ${PEOPLE.find(x => x.id === who)?.name.split(" ").at(-1)}: ${chipT.label}`, { said: said.join(" / ").slice(0, 300) });
    return said;
  }
  async function show(who, evId, evLabel, topic, topicLabel) {
    const s0 = await panelState(), n0 = s0.log.length;
    await p.click('.tp-sheet.on .tp-st:has-text("Show evidence")'); await p.waitForTimeout(150);
    await p.click(`.tp-sheet.on .tp-chips button[data-on="${topic}"]`); await p.waitForTimeout(60);
    await p.click(`.tp-sheet.on .tp-card[data-evidence="${evId}"]`); await waitIdle();
    const said = await lastLines(n0);
    await tick("q", `show ${PEOPLE.find(x => x.id === who)?.name.split(" ").at(-1)}: "${evLabel}" on ${topicLabel}`, { said: said.join(" / ").slice(0, 300) });
    return said;
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
      const chips = s.chips.map(c => ({ ...c, j: jit() }));
      // a) a matter not yet raised, worth raising
      let c = chips.find(c => !c.dry && !c.asked && !did(c.topic, "ask"));
      // b) one raised before but still worth raising (something new behind it): ask again, then press
      if (!c) c = chips.find(c => !c.dry && c.asked && !did(c.topic, "ask"));
      if (c) { mark(c.topic, "ask"); const before = claimsOf(id).map(x => x.label); const said = await ask(id, c);
        const after = claimsOf(id).map(x => x.label).filter(l => !before.includes(l)); for (const l of after) me.claimOf.set(c.topic, l);
        continue; }
      const pressable = chips.filter(c => !c.dry && c.asked && !did(c.topic, "press"));
      if (pressable.length) { const c = pressable[0]; mark(c.topic, "press"); await ask(id, c, "press"); continue; }
      // c) press a claim heard, where an open lead doubts it
      const pc = chips.filter(c => me.claimOf.has(c.topic) && !did(c.topic, "press") && !claimsOf(id).find(x => x.label === me.claimOf.get(c.topic))?.broken)
        .map(c => ({ c, L: doubtLeads(id, `${me.claimOf.get(c.topic)} ${c.label}`) })).filter(x => x.L.length);
      if (pc.length) { const { c } = pc[0]; mark(c.topic, "press"); await ask(id, c, "press"); continue; }
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
      const [x, y] = c.from; window.__place(x, y, 0, 0, floor); await raf();
      const cam = window.__camera, tx = c.pt[0], ty = -c.pt[2], dz = c.pt[1] - cam.position.y, d = Math.hypot(tx - x, ty - y);
      window.__place(x, y, Math.atan2(-(tx - x), ty - y) * 180 / Math.PI, Math.atan2(dz, d) * 180 / Math.PI, floor); await raf(); await new Promise(r => setTimeout(r, 200)); await raf();
      const btn = [...document.querySelectorAll("body > button")].find(b => b.style.width === "72px"), live = [...document.querySelectorAll('body > div[role="status"]')].find(d => d.style.clip);
      return { mode: btn && btn.style.display !== "none" ? btn.getAttribute("aria-label") : null, label: live?.textContent || "", aim: window.__aim(0, 0) }; }, { c, floor });
  }
  const pressUse = () => p.evaluate(() => { const btn = [...document.querySelectorAll("body > button")].find(b => b.style.width === "72px"); btn.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true, pointerType: "touch" })); });
  async function afterPress() {
    await p.waitForTimeout(250);
    const rd = await p.evaluate(() => { const r = document.querySelector(".tp-sheet.on.rd"); return r ? { title: r.querySelector(".tp-title")?.textContent, noted: r.querySelector(".tp-rdfoot")?.textContent || "", text: r.querySelector(".tp-read")?.textContent.slice(0, 2000) } : null; });
    if (rd) M.reads.push({ turn: T.turns, ...rd });
    await closeAll(); return rd;
  }
  async function search(roomId, why) {
    await closeAll(); await goRoom(roomId);
    const { pts, floor } = await standPoints(roomId); const held0 = await heldN();
    const yaws = Array.from({ length: 12 }, (_, i) => (i * 30 + Math.floor(R() * 30)) % 360);
    const sw = await sweep(pts, floor, yaws, [-12, -42]);
    for (const id of sw.people) M.seenAt.set(id, roomId);
    const queue = sw.things.filter(c => { const m = M.things.get(c.key); return !m || (m.locked && m.lockedHeld < held0) || (m.look && !m.done); });
    // the eye first, then single things, then a press's many drawers
    const rank = (c) => c.look ? 0 : /drawers/.test(c.aff || "") ? 2 : 1;
    queue.sort((a, b) => (rank(a) - rank(b)) || (R() - 0.5));
    const kinds = []; let n = 0, idle = 0;
    // a drawer is opened when its label shares a word with what you know or are asking (a labelled bank of a hundred
    // drawers is not opened one by one), and a couple of others for luck; nothing is shut again
    const corpus = () => [...(V.leads?.open || []).map(l => `${l.text} ${l.where}`), ...V.clues.map(c => c.label), ...M.heard.map(h => h.text)].join(" ");
    while (queue.length && n++ < 40 && T.turns < MAX) {
      const c = queue.shift(), m = M.things.get(c.key) || { presses: 0 }; M.things.set(c.key, m);
      let f = await faceThing(c, floor), usedUse = false;
      for (let k = 0; k < 3 && f.mode; k++) {
        if (f.mode === "Talk") break;
        if (f.mode !== "Look" && (SKIP.test(c.kind || "") || /^light$/.test(c.aff || ""))) break;
        if (f.mode === "Locked") { m.locked = true; m.lockedHeld = await heldN(); break; }
        if (f.mode === "Use" && usedUse) break;
        if (f.mode === "Take" && usedUse && !(m.reach > 0)) break; if (f.mode === "Take" && usedUse) m.reach--;
        if (/^(close|shut|put out|blow out)/i.test(f.label)) break;
        if (f.mode === "Use" && /drawers/.test(c.aff || "")) { const own = f.label.replace(/^open the drawers?\s*·?\s*/i, "");
          if (!(own && overlap(own, corpus()).length) && idle++ >= 2) break; }
        if (f.mode === "Use") usedUse = true;
        if (f.mode === "Look" && k > 0) break;               // (the eye stays on a thing only looked at: once is enough)
        await pressUse(); m.presses++; kinds.push(`${f.mode}:${c.kind || "look"}`);
        const rd = await afterPress();
        await tick("act", `${f.mode} ${f.label || c.kind || "?"} (${roomById.get(roomId).name.toLowerCase()})`, rd ? { read: rd.title, noted: rd.noted } : {});
        // (told what it holds, 'In X: a, b and c': a player reaches in for each)
        { const said = T.log.at(-1).heard || []; const inn = said.find(h => /^In [^:]+: /.test(h)); if (inn) m.reach = (m.reach || 0) + inn.split(/,| and /).length; }
        // opened: what it holds is now in view; look again round it
        if (f.mode === "Use") { const more = await sweep([c.from], floor, [-25, -12, 0, 12, 25].map(d => ((Math.atan2(-(c.pt[0] - c.from[0]), -c.pt[2] - c.from[1]) * 180 / Math.PI) + d)), [-20, -45, -65]);
          for (const q of more.things) if (!M.things.has(q.key) && !queue.some(x => x.key === q.key) && q.key !== c.key) queue.unshift(q); }
        f = await faceThing(c, floor);
      }
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
    for (const h of M.hints.filter(h => !h.used).reverse()) { const a = await fromTargets(h.targets, "hint"); h.used = true; if (a) return { ...a, why: `hint: ${h.text.slice(0, 80)}` }; }
    const open = (V.leads?.open || []).filter(l => !leadIsCoroner(l));
    for (const l of open) { const tg = [...targetsOf(`${l.where}`), ...targetsOf(l.now || "").filter(x => x.type === "person"), ...targetsOf(l.text)];
      const a = await fromTargets(tg, l.id); if (a) return { ...a, why: l.id }; }
    for (const q of V.persons) if (q.fresh > 0 && await personWorth(q.id)) return { do: "question", id: q.id, why: "matters left" };
    return null;
  }

  // ---- the accusation: each blank from the book's words, a group at a time, the next best on a wrong group ----------
  async function accuse(reason) {
    await closeAll(); await nbv();
    const corpus = [...V.clues.map(c => [c.label, 1]), ...V.contradictions.flatMap(c => [[c.text.replace(/^[^:]*:/, ""), -3], [c.by, 2]]), ...V.persons.flatMap(q => (q.claims || []).filter(c => c.broken).map(c => [c.by, 1])),
      ...(V.leads?.done || []).map(l => [l.text, 0.5]), ...M.reads.map(r => [`${r.title} ${r.noted}`, 0.5])];
    const docs = corpus.map(([t, w]) => ({ T: new Set(toks(t)), w }));
    await p.evaluate(() => window.__cp.openAccusation()); await p.waitForTimeout(300);
    const blanks = await p.evaluate(() => [...document.querySelectorAll('.tp-sheet.on [data-blank]')].map(b => ({ key: b.dataset.blank, name: b.textContent, sealed: b.classList.contains("sealed"), right: b.classList.contains("right") })));
    const opts = {};
    for (const bl of blanks) { await p.click(`.tp-sheet.on [data-blank="${bl.key}"]`); await p.waitForTimeout(150);
      opts[bl.key] = await p.evaluate(() => ({ list: [...document.querySelectorAll(".tp-sheet.on .tp-opt")].map(o => ({ id: o.dataset.option, label: o.textContent })), note: document.querySelector(".tp-sheet.on .tp-picknote")?.textContent || "" }));
      await p.keyboard.press("Escape"); await p.waitForTimeout(120); }
    const groups = await p.evaluate(() => [...document.querySelectorAll(".tp-sheet.on [data-group]")].map(g => ({ id: g.dataset.group, label: g.textContent.replace(/^Confirm(ed:)?\s*/, "") })));
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
      if (g.keys.some(k => !scored[k].length)) { result.groups.push({ id: g.id, ok: false, why: "a blank had no option offered" }); continue; }
      // the combinations, best total first
      let combos = [[]]; for (const k of g.keys) combos = combos.flatMap(c => scored[k].map(o => [...c, o]));
      combos = combos.map(c => ({ c, s: c.reduce((a, o) => a + o.s, 0) })).sort((a, b) => b.s - a.s);
      let ok = false, tries = 0;
      for (const { c } of combos) {
        if (tries >= 20) break;
        if (g.keys.includes("suspect") && result.excluded.includes(c[g.keys.indexOf("suspect")].id)) continue;
        for (let i = 0; i < g.keys.length; i++) { await p.click(`.tp-sheet.on [data-blank="${g.keys[i]}"]`); await p.waitForTimeout(100); await p.click(`.tp-sheet.on .tp-opt[data-option="${c[i].id}"]`); await p.waitForTimeout(100); }
        await p.click(`.tp-sheet.on [data-group="${g.id}"]`); await p.waitForTimeout(250); tries++;
        const r = await p.evaluate((keys) => ({ right: keys.every(k => document.querySelector(`.tp-sheet.on [data-blank="${k}"]`)?.classList.contains("right")), rebut: document.querySelector(".tp-sheet.on .tp-note.rebut")?.textContent || "", verdict: document.querySelector(".tp-verdict")?.textContent || "" }), g.keys);
        T.turns++; T.log.push({ t: T.turns, kind: "accuse", detail: `${g.label}: ${c.map(o => o.label.slice(0, 40)).join(" / ")}`, ok: r.right, rebut: r.rebut.slice(0, 200) });
        if (r.right) { ok = true; break; }
        result.wrong++; if (r.rebut && g.keys.includes("suspect")) result.excluded.push(c[g.keys.indexOf("suspect")].id);
      }
      result.groups.push({ id: g.id, ok, tries });
    }
    result.verdict = await p.evaluate(() => document.querySelector(".tp-verdict")?.textContent || "");
    result.solved = !!result.verdict && result.groups.every(g => g.ok);
    return result;
  }
  async function peekSeals() { await p.evaluate(() => window.__cp.openAccusation()); await p.waitForTimeout(200); const s = await p.evaluate(() => [...document.querySelectorAll('.tp-sheet.on [data-blank]')].map(b => ({ key: b.dataset.blank, sealed: b.classList.contains("sealed") }))); await closeAll(); return s; }

  // ---- the play ----------------------------------------------------------------------------------------------------------
  await nbv(); noteLines(await heardLines(), "arrival"); PEOPLE = await p.evaluate(() => [...window.__presences].map(([id, q]) => ({ id, name: q.p.group.name.replace(/^presence:/, "") })));
  for (const id of await p.evaluate(() => [...window.__presences].filter(([, q]) => q.room === "great_hall").map(([id]) => id))) M.seenAt.set(id, "great_hall");   // (you arrive facing whoever meets you)
  let acc = null, idles = 0, why = "";
  while (T.turns < MAX) {
    await nbv();
    const open = V.leads?.open || [];
    if (open.some(leadIsCoroner)) { why = "the coroner lead opened"; break; }
    if (V.leads && !open.length && V.leads.done.length) { why = "every lead closed"; break; }
    const a = (T.turns - M.lastProgress > STALL) ? null : await decide();
    if (a) { idles = 0;
      if (a.do === "question") { console.log(`[${seed}] t${T.turns} question ${a.id} (${a.why})`); await question(a.id, a.why); }
      else { console.log(`[${seed}] t${T.turns} search ${a.room} (${a.why})`); const key = `${a.why}|${a.room}`; M.leadRoom.set(key, (M.leadRoom.get(key) || 0) + 1); await search(a.room, a.why); }
      continue; }
    // nothing to follow: wait for a word (a minute passes)
    if (idles >= 6) { why = "stuck: six minutes waited with nothing new to follow"; break; }
    idles++; M.stuck.push({ turn: T.turns, open: open.map(l => l.id), lastProgress: M.lastProgress });
    await closeAll(); await p.evaluate(() => window.__cp.idle()); await tick("idle", "a minute passes");
    if (T.turns - M.lastProgress > STALL) M.lastProgress = T.turns - STALL + 12;     // (a word heard gives a few more turns to follow it)
  }
  if (T.turns >= MAX) why = "turn cap";
  const seals = await peekSeals();
  acc = await accuse(why);
  await nbv();
  const rec = await p.evaluate(() => window.__cp.receipts());
  const leads = [...M.leads].map(([id, l]) => ({ id, text: l.text, raised: l.raised, closed: l.closed, open_for: (l.closed ?? T.turns) - l.raised }));
  const out = { seed, solved: acc.solved, turns: T.turns, questions: T.q, acts: T.acts, moves: T.moves, idles: T.idles, tapFallbacks: T.tapFallbacks, why, seals, accusation: acc, receipts: rec,
    clues: V.clues.map(c => `${c.label} (${c.from})`), contradictions: V.contradictions, leads, open_at_end: (V.leads?.open || []).map(l => ({ id: l.id, text: l.text, where: l.where, now: l.now })),
    persons: V.persons, stuck: M.stuck, hints: M.hints.map(h => ({ text: h.text, turn: h.turn })), heard: M.heard, reads: M.reads.map(r => ({ turn: r.turn, title: r.title, noted: r.noted })),
    searched: [...M.searched].map(([id, s]) => ({ id, ...s })), wall_s: Math.round((Date.now() - t0) / 1000), errors: errs.slice(0, 5), log: T.log };
  writeFileSync(`${OUT}/run-${seed}.json`, JSON.stringify(out, null, 1));
  await b.close();
  return out;
}

const all = [];
for (const s of SEEDS) { const r = await play(s); all.push(r);
  console.log(`seed ${s}: ${r.solved ? "SOLVED" : "not solved"} in ${r.turns} turns (${r.questions} questions, ${r.acts} acts, ${r.moves} moves, ${r.idles} waits); clues ${r.receipts.clues}/${r.receipts.of_clues}; wrong tries ${r.accusation.wrong}; ended: ${r.why}; ${r.wall_s}s`); }
writeFileSync(`${OUT}/summary.json`, JSON.stringify(all.map(r => ({ seed: r.seed, solved: r.solved, turns: r.turns, questions: r.questions, acts: r.acts, moves: r.moves, idles: r.idles, clues: r.receipts.clues, of: r.receipts.of_clues, wrong: r.accusation.wrong, why: r.why })), null, 1));
