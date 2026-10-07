// How the day was spent (Kabe, 2026-10-07: "keep a running timer on what percentage of a day you are free to actively
// work and deploy something and how much time you are waiting for me to respond"). Read from the session's own
// transcript: every event is a moment of work (my turns, tools, helpers' reports) or a message of yours; a quiet gap
// longer than GAP minutes is waiting on you if the last thing I said before it asked you something, else idle (nothing
// queued: also lost time). Per day, in the local zone. node tools/attention-ledger.mjs [transcript.jsonl] [--gap 5]
import { createReadStream, readdirSync, statSync } from "node:fs";
import { createInterface } from "node:readline";
const dir = "/home/k/.claude/projects/-home-k-Projects-holo-emitter";
const args = process.argv.slice(2), gapMin = args.includes("--gap") ? +args[args.indexOf("--gap") + 1] : 5;
const file = args.find(a => a.endsWith(".jsonl")) || readdirSync(dir).filter(f => f.endsWith(".jsonl")).map(f => `${dir}/${f}`).sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0];
const ev = [];
// the helpers' own transcripts too: while one works, I'm not idle (its timestamps count as work)
const subdir = file.replace(/\.jsonl$/, "/subagents");
let subs = []; try { subs = readdirSync(subdir).filter(f => f.endsWith(".jsonl")).map(f => `${subdir}/${f}`); } catch {}
for (const f of subs) for await (const line of createInterface({ input: createReadStream(f), crlfDelay: Infinity })) { const m = /"timestamp":"([^"]+)"/.exec(line); if (m) ev.push({ t: Date.parse(m[1]), kind: "work", helper: true }); }
for await (const line of createInterface({ input: createReadStream(file), crlfDelay: Infinity })) { if (!line || line.length > 2e6) continue; let o; try { o = JSON.parse(line); } catch { continue; }
  const t = Date.parse(o.timestamp || ""); if (!t) continue;
  let kind = "work", asks = false;
  if (o.type === "user") { const c = o.message?.content; const text = typeof c === "string" ? c : Array.isArray(c) ? c.filter(x => x.type === "text").map(x => x.text).join(" ") : "";
    const tool = Array.isArray(c) && c.some(x => x.type === "tool_result");
    if (!tool && text && !/^\s*</.test(text) && !/SYSTEM NOTIFICATION|task-notification|colony\]/.test(text)) kind = "you"; }
  if (o.type === "assistant") { const c = o.message?.content; const text = Array.isArray(c) ? c.filter(x => x.type === "text").map(x => x.text).join(" ") : ""; if (text) asks = /\?\s*$/.test(text.trim()) || /\?\s*\n[^\n]*$/.test(text.trim()); }
  if (o.type === "user" || o.type === "assistant") ev.push({ t, kind, asks, said: o.type === "assistant" && asks !== undefined }); }
ev.sort((a, b) => a.t - b.t);
const day = (t) => new Date(t).toLocaleDateString("en-CA"), days = new Map(), add = (d, k, ms) => { const x = days.get(d) || { work: 0, waiting: 0, idle: 0 }; x[k] += ms; days.set(d, x); };
let lastAsk = false;
for (let i = 0; i + 1 < ev.length; i++) { const a = ev[i], b = ev[i + 1], gap = b.t - a.t; if (a.said !== undefined && a.kind === "work" && a.asks !== undefined) { if (a.asks) lastAsk = true; }
  if (a.kind === "you") lastAsk = false;
  // split a gap across midnight
  let t0 = a.t; const kind = gap <= gapMin * 60000 ? "work" : lastAsk ? "waiting" : "idle";
  while (t0 < b.t) { const end = Math.min(b.t, new Date(new Date(t0).toDateString()).getTime() + 86400000); add(day(t0), kind, end - t0); t0 = end; }
  if (b.kind === "assistant") {} }
const h = (ms) => (ms / 3600000).toFixed(1) + " h";
console.log(`day         working          waiting on you   idle (nothing queued)   (quiet gaps > ${gapMin} min)`);
for (const [d, x] of [...days].sort()) { const all = x.work + x.waiting + x.idle, p = (v) => (100 * v / all).toFixed(0).padStart(3) + "%";
  console.log(`${d}  ${p(x.work)} ${h(x.work).padStart(7)}   ${p(x.waiting)} ${h(x.waiting).padStart(7)}   ${p(x.idle)} ${h(x.idle).padStart(7)}`); }
