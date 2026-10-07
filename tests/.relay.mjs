// Test of the development model relay (tools/model-relay.mjs) and its browser side (src/make/voice.js).
// No network, no key: the relay runs in mock mode; the openai provider is exercised against a local fake upstream.
//   node tests/.relay.mjs
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { startRelay, validate, schemaFor, toModelSchema, loadKey } from "../tools/model-relay.mjs";
import { makeVoice } from "../src/make/voice.js";

let pass = 0, fail = 0; const failures = [];
const ok = (c, name, extra = "") => { if (c) pass++; else { fail++; failures.push(name + (extra ? "  " + extra : "")); } };
const quiet = { quiet: true };
const post = async (r, body, headers = {}) => { const res = await fetch(r.url + "/call", { method: "POST", headers: { "content-type": "application/json", ...headers }, body: typeof body === "string" ? body : JSON.stringify(body) }); return { status: res.status, j: await res.json() }; };
const get = async (r, p) => (await fetch(r.url + p)).json();
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "relay-test-"));

const READ = { job: "read", input: { suspect: "hale", utterance: "Where were you on the night of the death?", topics: [{ id: "alibi", label: "where you were that night" }, { id: "will", label: "the will and the land sale" }, { id: "person:vane", label: "Mistress Vane" }] } };
const VOICE = { job: "voice", input: { persona: "Steward Hale, sixty, careful and clipped; says 'by your leave'.", act: "tell", facts: [{ id: "f1", text: "I locked the muniment room at nine" }, { id: "f2", text: "the key hung on my belt all night" }], last: ["Where were you?"], max_words: 40 } };
const BEAT = { job: "beat", input: { backbone: { theme: "inheritance", shape: "deduction", phase: "middle" }, menu: [{ id: "b1", kind: "arrival", seed: "A rider in the Duke's colours reaches the gate." }, { id: "b2", kind: "discovery", seed: "A torn page is found in the grate." }], quiet_turns: 2 } };

// ---- validator subset
{
  const s = { type: "object", additionalProperties: false, required: ["a", "b"], properties: { a: { type: "string", enum: ["x", "y"] }, b: { type: "array", maxItems: 2, items: { type: "string", maxLength: 3 } } } };
  ok(validate(s, { a: "x", b: ["ab"] }).length === 0, "validator accepts a valid value");
  ok(validate(s, { a: "z", b: [] }).length === 1, "validator: enum");
  ok(validate(s, { a: "x" }).some(e => /b: missing/.test(e)), "validator: required");
  ok(validate(s, { a: "x", b: ["abcd"] }).length === 1, "validator: maxLength");
  ok(validate(s, { a: "x", b: ["a", "b", "c"] }).length === 1, "validator: maxItems");
  ok(validate(s, { a: "x", b: [], c: 1 }).some(e => /not allowed/.test(e)), "validator: additionalProperties:false");
  ok(validate(s, "str").length === 1 && validate(s, null).length === 1 && validate(s, []).length === 1, "validator: wrong type");
  ok(validate({ type: "string", maxWords: 2 }, "a b c").length === 1, "validator: maxWords");
  const m = toModelSchema(schemaFor("voice", VOICE.input));
  ok(!JSON.stringify(m).includes("maxLength") && !JSON.stringify(m).includes("maxWords") && m.additionalProperties === false && m.required.length === 2, "model schema stripped of unsupported keywords");
  ok(validate(schemaFor("voice", { act: "dontknow", facts: [], max_words: 20 }), { line: "I know nothing", used: [] }).length === 0, "voice schema: dontknow with no facts");
}

// ---- mock relay: the three jobs
const R = await startRelay({ provider: "mock", port: 0, testHooks: true, ...quiet, cacheDir: path.join(tmp, "cache") });
ok(R.server.address().address === "127.0.0.1", "bound to 127.0.0.1 only");
{
  const r = await post(R, READ);
  ok(r.status === 200 && r.j.ok && r.j.output.topic === "alibi" && r.j.output.stance === "ask", "mock read picks the topic sharing most words", JSON.stringify(r.j));
  ok(r.j.cached === false && r.j.model === "mock" && typeof r.j.ms === "number" && r.j.tokens.in > 0 && r.j.cost_usd === 0, "reply carries model, ms, tokens, cost, cached");
  const none = await post(R, { job: "read", input: { ...READ.input, utterance: "Hello there!" } });
  ok(none.j.output.topic === "none" && none.j.output.stance === "chat", "mock read: no shared words is none; greeting is chat", JSON.stringify(none.j.output));
  const acc = await post(R, { job: "read", input: { ...READ.input, utterance: "You killed him over the will" } });
  ok(acc.j.output.topic === "will" && acc.j.output.stance === "accuse", "mock read: accuse stance", JSON.stringify(acc.j.output));
  const v = await post(R, VOICE);
  ok(v.j.ok && v.j.output.line.includes("muniment room") && v.j.output.line.includes("belt") && JSON.stringify(v.j.output.used) === '["f1","f2"]', "mock voice states the facts and lists them used", JSON.stringify(v.j.output));
  const vd = await post(R, { job: "voice", input: { ...VOICE.input, act: "dontknow", facts: [] } });
  ok(vd.j.ok && vd.j.output.used.length === 0, "mock voice dontknow states nothing");
  const vs = await post(R, { job: "voice", input: { ...VOICE.input, max_words: 6 } });
  ok(vs.j.ok && vs.j.output.line.split(/\s+/).length <= 6, "mock voice honours max_words");
  const b = await post(R, BEAT);
  ok(b.j.ok && b.j.output.pick === "b1" && b.j.output.line.startsWith("A rider"), "mock beat picks the first menu item", JSON.stringify(b.j.output));
}

// ---- schema enforcement, retry, fallback (test hook)
{
  const q = (u) => ({ ...READ, input: { ...READ.input, utterance: u } });
  const bads = [
    ["read: topic not offered", { ...q("zz1"), _test: { outputs: [{ topic: "ghost", stance: "ask" }, { topic: "ghost", stance: "ask" }] } }],
    ["read: stance not in vocabulary", { ...q("zz2"), _test: { outputs: [{ topic: "alibi", stance: "shout" }, { topic: "alibi", stance: "shout" }] } }],
    ["read: extra property", { ...q("zz3"), _test: { outputs: [{ topic: "alibi", stance: "ask", why: "x" }, { topic: "alibi", stance: "ask", why: "x" }] } }],
    ["read: missing field", { ...q("zz4"), _test: { outputs: [{ topic: "alibi" }, { topic: "alibi" }] } }],
    ["read: not an object", { ...q("zz5"), _test: { outputs: ["alibi", "alibi"] } }],
    ["voice: used a fact it was not given", { job: "voice", input: { ...VOICE.input, last: ["zz6"] }, _test: { outputs: [{ line: "x y", used: ["f9"] }, { line: "x y", used: ["f9"] }] } }],
    ["voice: too long", { job: "voice", input: { ...VOICE.input, last: ["zz7"], max_words: 5 }, _test: { outputs: Array(2).fill({ line: "one two three four five six seven", used: ["f1"] }) } }],
    ["voice: told but used nothing", { job: "voice", input: { ...VOICE.input, last: ["zz8"] }, _test: { outputs: Array(2).fill({ line: "Fine weather.", used: [] }) } }],
    ["voice: dontknow claims a fact", { job: "voice", input: { ...VOICE.input, act: "dontknow", facts: [], last: ["zz9"] }, _test: { outputs: Array(2).fill({ line: "x", used: ["f1"] }) } }],
    ["beat: pick not on the menu", { job: "beat", input: { ...BEAT.input, quiet_turns: 90 }, _test: { outputs: Array(2).fill({ pick: "b9", line: "A thing." }) } }],
    ["beat: over 40 words", { job: "beat", input: { ...BEAT.input, quiet_turns: 91 }, _test: { outputs: Array(2).fill({ pick: "b1", line: Array(41).fill("w").join(" ") }) } }],
  ];
  for (const [name, body] of bads) {
    const r = await post(R, body);
    ok(r.status === 200 && r.j.ok === false && r.j.fallback === true && r.j.error, `schema refuses (${name})`, JSON.stringify(r.j));
  }
  const before = (await get(R, "/stats")).jobs.read;
  // first attempt malformed, retry good: ok, retried, one more attempt counted
  const rr = await post(R, { ...q("zz10"), _test: { outputs: [{ topic: "ghost", stance: "ask" }] } });
  ok(rr.j.ok && rr.j.output.topic !== "ghost" && rr.j.cached === false, "malformed first answer, valid retry: ok", JSON.stringify(rr.j));
  const after = (await get(R, "/stats")).jobs.read;
  ok(after.retries === before.retries + 1, "retry counted in stats");
  // failures are not cached: the same input without the hook now succeeds
  const again = await post(R, q("zz1"));
  ok(again.j.ok && again.j.cached === false, "a failed call is not cached");
  // caller schema can only narrow
  const narrow = await post(R, { ...READ, input: { ...READ.input, utterance: "narrow it" }, schema: { type: "object", required: ["topic"], properties: { topic: { type: "string", enum: ["will"] } } } });
  ok(narrow.j.ok === false && narrow.j.fallback === true, "a caller's schema is enforced on top of the job's", JSON.stringify(narrow.j));
  // hooks are ignored when the relay was not started with them
  const R2 = await startRelay({ provider: "mock", port: 0, ...quiet });
  const noHook = await post(R2, { ...q("zz11"), _test: { outputs: [{ topic: "ghost", stance: "ask" }] } });
  ok(noHook.j.ok && noHook.j.output.topic !== "ghost", "test hooks are inert without --test-hooks");
  await R2.close();
}

// ---- cache: memory, and on disk across a restart
{
  const a = await post(R, { ...READ, input: { ...READ.input, utterance: "cache me please" } });
  const b = await post(R, { ...READ, input: { ...READ.input, utterance: "cache me please" } });
  ok(!a.j.cached && b.j.cached === true && b.j.cost_usd === 0 && JSON.stringify(a.j.output) === JSON.stringify(b.j.output), "second identical call is cached");
  const k = await post(R, { ...READ, input: { topics: READ.input.topics, utterance: "cache me please", suspect: "hale" } });   // key order differs
  ok(k.j.cached === true, "cache key ignores property order");
  const other = await post(R, { ...READ, input: { ...READ.input, utterance: "cache me please", suspect: "vane" } });
  ok(!other.j.cached, "a different input is a different key");
  ok(fs.readdirSync(path.join(tmp, "cache")).some(f => f.endsWith(".json")), "disk cache written");
  const R3 = await startRelay({ provider: "mock", port: 0, ...quiet, cacheDir: path.join(tmp, "cache") });
  const c = await post(R3, { ...READ, input: { ...READ.input, utterance: "cache me please" } });
  ok(c.j.cached === true, "disk cache survives a restart");
  await R3.close();
}

// ---- stats
{
  const s = await get(R, "/stats");
  ok(s.ok && s.provider === "mock" && s.total.calls > 20 && s.total.cached >= 2 && s.total.failed >= 11 && s.jobs.voice.calls > 0 && s.jobs.beat.calls > 0, "stats count calls, cache hits, failures per job", JSON.stringify(s.total));
  ok(s.total.calls === s.jobs.read.calls + s.jobs.voice.calls + s.jobs.beat.calls, "job totals add up");
  ok((await get(R, "/health")).ok, "health");
}

// ---- guards: input, body, origin, host, content type
{
  ok((await post(R, { job: "read", input: { ...READ.input, utterance: "x".repeat(201) } })).status === 400, "utterance over 200 chars refused");
  ok((await post(R, { job: "read", input: { ...READ.input, topics: Array(17).fill({ id: "a", label: "a" }) } })).status === 400, "more than 16 topics refused");
  ok((await post(R, { job: "voice", input: { ...VOICE.input, facts: Array(4).fill({ id: "a", text: "a" }) } })).status === 400, "more than 3 facts refused");
  ok((await post(R, { job: "beat", input: { ...BEAT.input, menu: Array(6).fill({ id: "a", kind: "k", seed: "s" }) } })).status === 400, "more than 5 menu items refused");
  ok((await post(R, { job: "nope", input: {} })).status === 400, "unknown job refused");
  ok((await post(R, "{not json")).status === 400, "bad JSON refused");
  ok((await post(R, JSON.stringify({ job: "read", input: { ...READ.input, suspect: "x".repeat(40000) } }))).status === 413, "oversized body refused");
  ok((await post(R, READ, { "content-type": "text/plain" })).status === 415, "non-JSON content type refused");
  ok((await post(R, READ, { origin: "https://evil.example" })).status === 403, "foreign origin refused");
  const lo = await fetch(R.url + "/call", { method: "POST", headers: { "content-type": "application/json", origin: "http://localhost:8793" }, body: JSON.stringify(READ) });
  ok(lo.status === 200 && lo.headers.get("access-control-allow-origin") === "http://localhost:8793", "localhost origin gets CORS");
  const lan = await fetch(R.url + "/stats", { headers: { origin: "http://192.168.68.58:8793" } });
  ok(lan.status === 403, "a LAN origin is not a localhost origin");
  const pre = await fetch(R.url + "/call", { method: "OPTIONS", headers: { origin: "http://127.0.0.1:8793", "access-control-request-method": "POST", "access-control-request-private-network": "true" } });
  ok(pre.status === 204 && pre.headers.get("access-control-allow-origin") === "http://127.0.0.1:8793" && pre.headers.get("access-control-allow-private-network") === "true", "preflight for localhost");
  const evilPre = await fetch(R.url + "/call", { method: "OPTIONS", headers: { origin: "https://evil.example" } });
  ok(evilPre.status === 403 && !evilPre.headers.get("access-control-allow-origin"), "preflight from a foreign origin refused");
  const badHost = await new Promise(res => { const q = http.request({ host: "127.0.0.1", port: R.port, path: "/stats", headers: { host: "rebind.example" } }, r => { r.resume(); res(r.statusCode); }); q.end(); });
  ok(badHost === 403, "a foreign Host header (DNS rebinding) refused");
  ok((await fetch(R.url + "/nothing")).status === 404, "404");
}
await R.close();

// ---- subscription stub
{
  const S = await startRelay({ provider: "subscription", port: 0, ...quiet });
  const r = await post(S, READ);
  ok(r.j.ok === false && r.j.fallback === true && /decision 4/.test(r.j.error), "subscription provider refuses and points to decision 4", r.j.error);
  await S.close();
}

// ---- openai provider against a fake upstream (both API styles); the key must never leak
for (const style of ["responses", "chat"]) {
  const KEY = "sk-test-SECRETSECRETSECRET1234";
  const seen = []; let mode = "good";
  const up = http.createServer((req, res) => {
    let b = ""; req.on("data", c => b += c); req.on("end", () => {
      const body = JSON.parse(b); seen.push({ url: req.url, auth: req.headers.authorization, body });
      const reply = (o) => { res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify(o)); };
      if (mode === "401") { res.writeHead(401, { "content-type": "application/json" }); return res.end(JSON.stringify({ error: { message: `Incorrect API key provided: ${KEY}.` } })); }
      const user = JSON.parse(style === "responses" ? body.input : body.messages[1].content);
      const out = mode === "bad" ? { topic: "ghost", stance: "ask" } : { topic: user.topics[0].id, stance: "ask" };
      const text = JSON.stringify(out);
      if (style === "responses") reply({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text }] }], usage: { input_tokens: 1000, output_tokens: 100 } });
      else reply({ choices: [{ message: { content: text } }], usage: { prompt_tokens: 1000, completion_tokens: 100 } });
    });
  });
  await new Promise(r => up.listen(0, "127.0.0.1", r));
  const logs = []; const orig = console.log; console.log = (...a) => logs.push(a.join(" "));
  let O;
  try {
    O = await startRelay({ provider: "openai", port: 0, key: KEY, openaiApi: style, openaiBase: `http://127.0.0.1:${up.address().port}/v1`, models: { read: "test-model" }, prices: { "test-model": [1, 2] }, budgetUsd: 1 });
    const r = await post(O, READ);
    ok(r.j.ok && r.j.output.topic === "alibi" && r.j.model === "test-model", `openai/${style}: answer returned`, JSON.stringify(r.j));
    ok(r.j.tokens.in === 1000 && r.j.tokens.out === 100 && Math.abs(r.j.cost_usd - 0.0012) < 1e-9, `openai/${style}: tokens and cost accounted (1000*$1 + 100*$2 per M = $0.0012)`, String(r.j.cost_usd));
    const s = seen[0];
    ok(s.auth === `Bearer ${KEY}` && s.url === (style === "responses" ? "/v1/responses" : "/v1/chat/completions"), `openai/${style}: key sent to the provider only, right path`, s.url);
    const fmt = style === "responses" ? s.body.text.format : s.body.response_format.json_schema;
    ok(fmt.strict === true && fmt.schema.additionalProperties === false && !JSON.stringify(fmt.schema).includes("maxLength") && fmt.schema.properties.topic.enum.includes("none"), `openai/${style}: strict JSON schema sent, closed topic enum`);
    ok(s.body.store === false, `openai/${style}: store:false`);
    // invalid answer twice -> retry sent, then fallback
    mode = "bad"; seen.length = 0;
    const f = await post(O, { ...READ, input: { ...READ.input, utterance: "bad upstream" } });
    ok(f.j.ok === false && f.j.fallback === true && seen.length === 2, `openai/${style}: invalid answer retried once then fallback`, `calls=${seen.length}`);
    ok(/Retry|rejected/i.test(JSON.stringify(seen[1].body)), `openai/${style}: retry tells the model what was wrong`);
    // auth error echoing the key: fatal (no retry), key scrubbed
    mode = "401"; seen.length = 0;
    const a = await post(O, { ...READ, input: { ...READ.input, utterance: "auth fails" } });
    ok(a.j.ok === false && a.j.fallback === true && seen.length === 1 && !JSON.stringify(a.j).includes("SECRET"), `openai/${style}: 401 is final and the echoed key is scrubbed`, JSON.stringify(a.j));
    const st = JSON.stringify(await get(O, "/stats"));
    ok(!st.includes("SECRET") && !logs.join("\n").includes("SECRET"), `openai/${style}: key absent from stats and log lines`);
    ok(logs.some(l => /\bread\b.*test-model.*\$0\.00/.test(l)), `openai/${style}: per-call log line has job, model, tokens, cost`, logs[0]);
    // budget guard: 1 + 1000-token calls are cheap; shrink the budget to prove the stop
    const O2 = await startRelay({ provider: "openai", port: 0, key: KEY, openaiApi: style, openaiBase: `http://127.0.0.1:${up.address().port}/v1`, models: { read: "test-model" }, prices: { "test-model": [1, 2] }, budgetUsd: 0.001, quiet: true });
    mode = "good"; await post(O2, READ);
    const capped = await post(O2, { ...READ, input: { ...READ.input, utterance: "over budget" } });
    ok(capped.j.ok === false && /budget/.test(capped.j.error), `openai/${style}: budget cap stops calls`, JSON.stringify(capped.j));
    await O2.close();
  } finally { console.log = orig; if (O) await O.close(); up.close(); }
}
{
  let threw = null; try { await startRelay({ provider: "openai", port: 0, key: null, ...quiet }); } catch (e) { threw = e; }
  // loadKey() reads the real env/file; with neither set it returns null, so startRelay refuses
  if (!process.env.OPENAI_API_KEY && !fs.existsSync(path.join(os.homedir(), ".config/holo-emitter/openai.key"))) ok(threw && /needs OPENAI_API_KEY/.test(threw.message), "openai without a key refuses to start");
  const kf = path.join(tmp, "k.key"); fs.writeFileSync(kf, "sk-abc\n", { mode: 0o644 }); fs.chmodSync(kf, 0o644);
  let e2 = null; try { loadKey({}, kf); } catch (e) { e2 = e; }
  ok(e2 && /0600/.test(e2.message), "a key file readable by others is refused");
  fs.chmodSync(kf, 0o600);
  ok(loadKey({}, kf) === "sk-abc", "a 0600 key file is read");
  ok(loadKey({ OPENAI_API_KEY: " sk-env " }, kf) === "sk-env", "env key wins");
  ok(loadKey({}, path.join(tmp, "absent")) === null, "no key at all is null");
}

// ---- voice.js (the browser side)
{
  const M = await startRelay({ provider: "mock", port: 0, ...quiet });
  const v = makeVoice({ relay: M.url, timeoutMs: 1500 });
  ok(await v.available() === true, "voice.available() true when the relay is up");
  const r = await v.read(READ.input);
  ok(r.ok && !r.fallback && r.topic === "alibi" && r.stance === "ask", "voice.read", JSON.stringify(r));
  const vo = await v.voice(VOICE.input);
  ok(vo.ok && vo.line.includes("muniment") && vo.used.length === 2 && vo.cached === false, "voice.voice", JSON.stringify(vo));
  const be = await v.beat(BEAT.input);
  ok(be.ok && be.pick === "b1", "voice.beat", JSON.stringify(be));
  // the page's truth check: a rejecting check retries once, then falls back to the plain fact text
  let calls = 0;
  const chk = await v.voice(VOICE.input, { check: () => { calls++; return "named a stranger"; } });
  ok(chk.fallback === true && chk.line === "I locked the muniment room at nine the key hung on my belt all night" && calls === 2 && chk.used.length === 2, "voice.voice: failed truth check retries once then plain facts", JSON.stringify({ calls, chk }));
  const chk2 = await v.voice(VOICE.input, { check: (l) => l.includes("Marry") });
  ok(chk2.ok === true, "voice.voice: truth check passing");
  const nk = await v.voice({ ...VOICE.input, act: "dontknow", facts: [] });
  ok(nk.ok && nk.used.length === 0, "voice.voice dontknow");
  // never throws on junk
  const junk = await Promise.all([v.read(), v.read({}), v.read(null), v.voice(), v.voice(null), v.voice({ persona: 3, act: "x" }), v.beat(), v.beat({ menu: "no" }), v.read({ suspect: "a", utterance: 5, topics: "x" })]);
  ok(junk.every(j => j && j.fallback === true), "junk arguments resolve fallback, never throw");
  const fbBeat = await v.beat({ backbone: "x", menu: [] });
  ok(fbBeat.fallback === true, "empty menu falls back");
  await M.close();

  // relay down: fast fallback, then the cool-off keeps later calls instant
  const dead = makeVoice({ relay: "http://127.0.0.1:1", timeoutMs: 500 });
  const t0 = Date.now();
  ok(await dead.available() === false, "available() false when nothing listens");
  const d1 = await dead.read(READ.input), d2 = await dead.voice(VOICE.input), d3 = await dead.beat(BEAT.input);
  ok(d1.fallback && d2.fallback && d3.fallback && d2.line.includes("muniment") && d3.pick === "b1" && d3.line.startsWith("A rider"), "relay down: fallback with the plain facts and the first beat");
  ok(Date.now() - t0 < 1500, "relay down: no stall", `${Date.now() - t0} ms`);

  // slow relay: times out at timeoutMs
  const slow = http.createServer((req, res) => { setTimeout(() => { try { res.end("{}"); } catch {} }, 3000); });
  await new Promise(r => slow.listen(0, "127.0.0.1", r));
  const sv = makeVoice({ relay: `http://127.0.0.1:${slow.address().port}`, timeoutMs: 300 });
  const t1 = Date.now(); const sr = await sv.read(READ.input);
  ok(sr.fallback === true && Date.now() - t1 < 1200, "slow relay: times out to fallback", `${Date.now() - t1} ms`);
  slow.closeAllConnections?.(); slow.close();

  // a lying relay: output the page must not trust
  const liar = http.createServer((req, res) => { let b = ""; req.on("data", c => b += c); req.on("end", () => { res.writeHead(200, { "content-type": "application/json" }); const job = req.url === "/call" ? JSON.parse(b).job : "";
    res.end(JSON.stringify({ ok: true, model: "x", ms: 1, output: job === "read" ? { topic: "ghost", stance: "ask" } : job === "voice" ? { line: "I did it", used: ["f77"] } : { pick: "b9", line: "x" } })); }); });
  await new Promise(r => liar.listen(0, "127.0.0.1", r));
  const lv = makeVoice({ relay: `http://127.0.0.1:${liar.address().port}`, timeoutMs: 800 });
  const [l1, l2, l3] = [await lv.read(READ.input), await lv.voice(VOICE.input), await lv.beat(BEAT.input)];
  ok(l1.fallback && l2.fallback && l2.line.includes("muniment") && l3.fallback && l3.pick === "b1", "a relay answering outside the closed vocabulary is not trusted");
  liar.close();
}

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`relay test: ${pass} passed, ${fail} failed`);
for (const f of failures) console.log("  FAIL " + f);
process.exit(fail ? 1 : 0);
