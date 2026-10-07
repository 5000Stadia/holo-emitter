// The browser side of the development model relay (tools/model-relay.mjs; design/case/relay.md; family-read.md §5).
// Three narrow calls a page may make, and a promise that never rejects: if the relay is down, slow, or answers something
// the page cannot trust, every call resolves { ok:false, fallback:true } and the page takes its no-model path (topics from a
// list, the case's own written lines, the first beat on the menu). The page holds no credential; only the relay does.
//
//   const v = makeVoice();                        // { relay = "http://127.0.0.1:8798", timeoutMs = 4000 }
//   await v.available()                           -> boolean (the relay answers /health; remembered a few seconds)
//   await v.read({ suspect, utterance, topics })  -> { ok, topic: id|"none", stance: ask|press|accuse|show|chat, model, ms, cost_usd, cached }
//   await v.voice({ persona, act, facts, last, max_words }, { check })
//                                                 -> { ok, line, used: [fact ids], ... }  or { fallback:true, line: <the facts' own text>, used }
//   await v.beat({ backbone, menu, quiet_turns }) -> { ok, pick: id, line, ... }          or { fallback:true, pick: menu[0].id, line: menu[0].seed }
// `check(line)` on voice is the page's truth check (no entity outside persona, facts, the player's words, what is known);
// returning false (or a string reason) rejects the line; one retry follows, then the plain fact text.
export const STANCES = ["ask", "press", "accuse", "show", "chat"];
const LIMITS = { utterance: 200, topics: 16, facts: 3, menu: 5, last: 2 };

const words = (s) => String(s).trim().split(/\s+/).filter(Boolean);
const isObj = (x) => x && typeof x === "object" && !Array.isArray(x);

export function makeVoice({ relay = "http://127.0.0.1:8798", timeoutMs = 4000, fetchImpl, coolOffMs = 15000, now = () => Date.now() } = {}) {
  const base = String(relay).replace(/\/$/, "");
  const f = (...a) => (fetchImpl || globalThis.fetch)(...a);
  let downUntil = 0;                       // after a network failure, skip the relay for a while rather than stall every question
  let healthy = null, healthAt = 0;

  async function http(path, init, ms) {
    const ctl = typeof AbortController === "function" ? new AbortController() : null;
    const timer = setTimeout(() => ctl && ctl.abort(), ms);
    try {
      const res = await Promise.race([
        f(base + path, { ...init, signal: ctl?.signal }),
        new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms + 50)),   // for a fetch that ignores abort
      ]);
      return await res.json();
    } finally { clearTimeout(timer); }
  }

  async function available() {
    if (now() < downUntil) return false;
    if (healthy !== null && now() - healthAt < 5000) return healthy;
    try { const j = await http("/health", { method: "GET" }, Math.min(timeoutMs, 1500)); healthy = !!j?.ok; } catch { healthy = false; downUntil = now() + coolOffMs; }
    healthAt = now(); return healthy;
  }

  // Send one job; resolve the relay's answer if it passes `accept` (the page's own check of the shape), else null.
  async function ask(job, input, accept) {
    if (now() < downUntil) return { err: "relay down (cooling off)" };
    try {
      const j = await http("/call", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ job, input }) }, timeoutMs);
      if (!j || j.ok !== true || !isObj(j.output)) return { err: j?.error || "relay declined" };
      const bad = accept(j.output);
      if (bad) return { err: bad, rejected: true };
      healthy = true; healthAt = now();
      return { j };
    } catch (e) {
      downUntil = now() + coolOffMs; healthy = false; healthAt = now();
      return { err: e?.message || "relay unreachable" };
    }
  }
  const meta = (j) => ({ model: j.model, ms: j.ms, tokens: j.tokens, cost_usd: j.cost_usd, cached: !!j.cached });
  const fail = (err, extra = {}) => ({ ok: false, fallback: true, error: err, ...extra });

  async function read(req) {
    try {
      const { suspect, utterance, topics } = req || {};
      const ts = (Array.isArray(topics) ? topics : []).slice(0, LIMITS.topics).map(t => ({ id: String(t.id), label: String(t.label ?? t.id) }));
      if (!suspect || !ts.length || typeof utterance !== "string" || !utterance.trim()) return fail("nothing to read");
      const ids = new Set(ts.map(t => t.id));
      const r = await ask("read", { suspect: String(suspect), utterance: utterance.slice(0, LIMITS.utterance), topics: ts },
        o => (typeof o.topic === "string" && (o.topic === "none" || ids.has(o.topic)) && STANCES.includes(o.stance)) ? null : "unusable read");
      return r.j ? { ok: true, fallback: false, topic: r.j.output.topic, stance: r.j.output.stance, ...meta(r.j) } : fail(r.err);
    } catch (e) { return fail(String(e?.message || e)); }
  }

  async function voice(req, opts) {
    const { persona, act, facts, last, max_words = 40 } = req || {}, { check } = opts || {};
    const fs = (Array.isArray(facts) ? facts : []).slice(0, LIMITS.facts).map(x => ({ id: String(x.id), text: String(x.text) }));
    // the plain words: what the no-model path says, and what we fall back to (the facts' own text; empty for non-telling acts)
    const plain = (act === "tell" || act === "lie") ? fs.map(x => x.text.replace(/\s+/g, " ").trim()).join(" ") : "";
    const fb = (err) => fail(err, { line: plain, used: fs.map(x => x.id) });
    try {
      if (!persona || !["tell", "deflect", "refuse", "lie", "dontknow"].includes(act)) return fb("bad voice request");
      const input = { persona: String(persona), act, facts: act === "dontknow" ? [] : fs, last: (Array.isArray(last) ? last : []).slice(-LIMITS.last).map(String), max_words: Math.max(3, Math.min(120, Math.floor(max_words))) };
      const ids = new Set(input.facts.map(x => x.id));
      let reason = "";
      for (let attempt = 0; attempt < 2; attempt++) {
        // a second try changes the input (and so the relay's cache key) so it asks the model afresh
        const r = await ask("voice", attempt ? { ...input, attempt } : input, o => {
          if (typeof o.line !== "string" || !o.line.trim() || !Array.isArray(o.used)) return "unusable voice";
          if (words(o.line).length > input.max_words) return "too long";
          if (!o.used.every(u => ids.has(u))) return "used a fact it was not given";
          if ((act === "tell" || act === "lie") && ids.size && !o.used.length) return "stated no fact";
          return null;
        });
        if (!r.j) { reason = r.err; if (!r.rejected) break; continue; }   // the relay failing is final; only our own check retries
        const verdict = check ? check(r.j.output.line, r.j.output) : true;
        if (verdict === false || typeof verdict === "string") { reason = typeof verdict === "string" ? verdict : "failed the truth check"; continue; }
        return { ok: true, fallback: false, line: r.j.output.line.trim(), used: r.j.output.used, ...meta(r.j) };
      }
      return fb(reason || "no usable voice");
    } catch (e) { return fb(String(e?.message || e)); }
  }

  async function beat(req) {
    const { backbone, menu, quiet_turns = 0 } = req || {};
    const ms = (Array.isArray(menu) ? menu : []).slice(0, LIMITS.menu).map(m => ({ id: String(m.id), kind: String(m.kind ?? ""), seed: String(m.seed ?? "") }));
    const first = ms[0] ? { pick: ms[0].id, line: ms[0].seed } : {};
    try {
      if (!ms.length) return fail("empty menu");
      const ids = new Set(ms.map(m => m.id));
      const r = await ask("beat", { backbone: backbone ?? "", menu: ms, quiet_turns: Math.max(0, Math.floor(quiet_turns) || 0) },
        o => (typeof o.pick === "string" && ids.has(o.pick) && typeof o.line === "string" && o.line.trim() && words(o.line).length <= 40) ? null : "unusable beat");
      return r.j ? { ok: true, fallback: false, pick: r.j.output.pick, line: r.j.output.line.trim(), ...meta(r.j) } : fail(r.err, first);
    } catch (e) { return fail(String(e?.message || e), first); }
  }

  return { available, read, voice, beat, relay: base };
}
