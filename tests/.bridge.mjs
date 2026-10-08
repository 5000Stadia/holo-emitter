// The live bridge's client (src/make/bridge.js), against a stand-in for construct's `holo serve` (the same three endpoints,
// no model): events reach it each turn, a re-author is asked at a lull, a newer deck is polled for and merged, a refused part
// is named, and a bridge that isn't there never stalls play. node tests/.bridge.mjs   (the lab served on 8794)
import http from "node:http"; import { chromium } from "playwright";
const got = { events: 0, reauthor: 0, deckAsks: 0 }; let ready = false;
const deck = { version: 1, beats: [
  { id: "c.test_lull", kind: "pressure", phase: "setup", weight: "flavor", when: "quiet>=3", hook: "A clock somewhere strikes the quarter.", effects: [{ type: "set_var", name: "bridge_test", value: true }] },
  { id: "c.bad", kind: "pressure", phase: "setup", when: "learned:no_such_clue", hook: "x", effects: [] }] };
const srv = http.createServer((q, r) => { const H = { "access-control-allow-origin": "*", "access-control-allow-headers": "content-type", "access-control-allow-methods": "GET,POST,OPTIONS" };
  if (q.method === "OPTIONS") { r.writeHead(204, H); return r.end(); }
  let body = ""; q.on("data", c => body += c); q.on("end", () => {
    if (q.url.startsWith("/events")) { got.events++; r.writeHead(200, H); return r.end("{}"); }
    if (q.url.startsWith("/reauthor")) { got.reauthor++; ready = true; r.writeHead(202, H); return r.end("{}"); }
    if (q.url.startsWith("/deck")) { got.deckAsks++; const since = +new URL(q.url, "http://x").searchParams.get("since");
      if (ready && since < 1) { r.writeHead(200, { ...H, "content-type": "application/json" }); return r.end(JSON.stringify(deck)); } r.writeHead(204, H); return r.end(); }
    r.writeHead(404, H); r.end(); }); }).listen(8799, "127.0.0.1");
const b = await chromium.launch({ args: ["--use-angle=vulkan", "--enable-features=Vulkan", "--enable-unsafe-webgpu", "--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: 390, height: 844 } }); const errs = []; p.on("pageerror", e => errs.push(e.message));
await p.goto("http://localhost:8794/lab/manor/index.html?case=case-1660&fresh&webgpu=1&voice=0&bridge", { timeout: 300000 }); await p.waitForFunction(() => window.__ok, null, { timeout: 300000 });
for (let i = 0; i < 8; i++) { await p.evaluate(() => window.__cp.idle()); await p.waitForTimeout(150); }
await p.waitForTimeout(5000);
const st = await p.evaluate(() => window.__bridge());
const ok = (c, what) => console.log(`${c ? "ok  " : "FAIL"} ${what}`);
ok(got.events >= 5, `events sent each turn (${got.events})`); ok(got.reauthor >= 1, `a re-author asked at the lull (${got.reauthor})`);
ok(st.decks === 1 && st.added === 1 && st.refused === 1, `the newer deck merged: 1 part in, the bad one refused (${JSON.stringify(st)})`);
ok(errs.length === 0, `no page errors ${errs.join("; ")}`);
srv.close(); await b.close();
// a bridge that isn't there: play goes on
const b2 = await chromium.launch({ args: ["--use-angle=vulkan", "--enable-features=Vulkan", "--enable-unsafe-webgpu", "--ignore-gpu-blocklist"] });
const p2 = await b2.newPage({ viewport: { width: 390, height: 844 } }); const errs2 = []; p2.on("pageerror", e => errs2.push(e.message));
await p2.goto("http://localhost:8794/lab/manor/index.html?case=case-1660&fresh&webgpu=1&voice=0&bridge", { timeout: 300000 }); await p2.waitForFunction(() => window.__ok, null, { timeout: 300000 });
const t0 = Date.now(); await p2.evaluate(async () => { window.__cp.talkTo("anne"); await window.__cp.reply("anne", "household", "ask"); });
ok(Date.now() - t0 < 1500 && errs2.length === 0, `no bridge: a question answered in ${Date.now() - t0} ms, no errors`);
await b2.close();
