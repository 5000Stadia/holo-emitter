// One of the kit's texture workers (texjobs.js keeps a pool of them). A job is one band of rows of one
// texture: { id, v, lib, gen, args, y0, y1, cache }. The worker looks the band up in IndexedDB and, if it is
// not there or was drawn by other code, draws it (texgen.js), stores it, and sends the pixels back
// (transferred, not copied): { id, ok, w, h, y0, y1, map, normal, from, ms, draw_ms, oak_ms, at, end }.
//
// A stored band is keyed by what it is (generator, arguments, rows) and carries the signature of what
// drew it: the cache version and a hash of the generators' own source. Change a generator and its bands
// no longer match, so they are drawn again and overwritten; nothing stale is ever shown. Every storage
// call is wrapped and timed out: where storage is blocked or missing (a private window, a strict
// setting) the worker simply draws.
import { draw, makeCtx } from "./texgen.js";

const ctx = makeCtx();                    // the oak field, drawn at most once in this worker
const libs = new Map(), sigs = new Map();
const libOf = (url) => { if (!libs.has(url)) libs.set(url, import(url)); return libs.get(url); };
const TEXGEN = new URL("./texgen.js", import.meta.url).href;

// cyrb53: a quick 53-bit string hash, for the generators' source
function cyrb53(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) { const ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}
// the hash of a module's source as served (null if it can't be read: then nothing it draws is cached)
const sigOf = (url) => { if (!sigs.has(url)) sigs.set(url, fetch(url).then(r => r.ok ? r.text() : null).then(t => t && cyrb53(t)).catch(() => null)); return sigs.get(url); };

// ---- IndexedDB, every call guarded
const within = (p, ms, fallback) => Promise.race([p, new Promise(r => setTimeout(() => r(fallback), ms))]);
let dbp = null;
function db() {
  if (dbp) return dbp;
  dbp = within(new Promise((res) => {
    try {
      const rq = indexedDB.open("holo-textures", 1);
      rq.onupgradeneeded = () => { try { rq.result.createObjectStore("bands"); } catch (_) {} };
      rq.onsuccess = () => res(rq.result); rq.onerror = () => res(null); rq.onblocked = () => res(null);
    } catch (_) { res(null); }
  }), 3000, null);
  return dbp;
}
async function load(key) {
  const d = await db(); if (!d) return null;
  return within(new Promise((res) => {
    try { const q = d.transaction("bands", "readonly").objectStore("bands").get(key); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null); }
    catch (_) { res(null); }
  }), 5000, null);
}
function store(d, key, value) {
  // put() copies the value as it is called, so the buffers may be sent away straight after
  try { const tx = d.transaction("bands", "readwrite", { durability: "relaxed" }); tx.onerror = tx.onabort = (e) => { e?.preventDefault?.(); }; tx.objectStore("bands").put(value, key); }
  catch (_) {}
}

// ---- the oak field, drawn once in the pool: its keeper draws it and hands a copy to every other worker
// at once, over the channels the page set up between them (the page's main thread may be busy building);
// a worker that needs it first asks the keeper, and if no answer comes, draws it itself
let me = 0;
const peers = new Map(), sent = new Set(), waiting = new Map();
function listen(k, port) {
  peers.set(k, port);
  port.onmessage = ({ data }) => {
    if (data.want) give(k, data.want);
    else if (data.oak) { if (!ctx.has(data.oak)) ctx.put(data.oak, data.field); waiting.get(data.oak)?.done(); }
  };
}
function keep(N) { if (ctx.has(N)) return; ctx.oak(N); for (const k of peers.keys()) give(k, N); }
function give(k, N) { keep(N); if (sent.has(`${k}/${N}`)) return; sent.add(`${k}/${N}`); peers.get(k).postMessage({ oak: N, field: ctx.oak(N) }); }
async function oakFor(N, from) {
  if (ctx.has(N)) return;
  if (!from || from === me || !peers.has(from)) return keep(N);
  if (!waiting.has(N)) { let done; const p = new Promise(r => { done = r; }); waiting.set(N, { p, done }); peers.get(from).postMessage({ want: N }); }
  await within(waiting.get(N).p, 8000, null);
  if (!ctx.has(N)) ctx.oak(N);            // the keeper gone or too slow: drawn here
}

// running: the page may now block its main thread (a worker can't be started while it is blocked; once
// started it needs nothing from it)
postMessage({ hello: true });

onmessage = async ({ data: job }) => {
  if (job.me) { me = job.me; return; }
  if (job.peer) { listen(job.peer, job.port); return; }
  const t0 = performance.now();
  try {
    const lib = await libOf(job.lib), G = lib.GEN[job.gen];
    if (!G) throw new Error(`no texture generator "${job.gen}" in ${job.lib}`);
    const [w, h] = G.size(job.args);
    let map = null, normal = null, from = "drawn", key = null, sig = null;
    if (job.cache) {
      const [a, b] = await Promise.all([sigOf(TEXGEN), sigOf(job.lib)]);
      if (a && b) { sig = `${job.v}|${a}|${b}`; key = `${new URL(job.lib).pathname}|${job.gen}|${JSON.stringify(job.args)}|${job.y0}-${job.y1}`; }
    }
    if (key) {
      const hit = await load(key), bytes = (job.y1 - job.y0) * w * 4;
      const whole = (b) => b instanceof ArrayBuffer && b.byteLength === bytes;
      if (hit && hit.sig === sig && hit.w === w && hit.h === h && whole(hit.map) && (G.normal == null ? !hit.normal : whole(hit.normal))) {
        map = hit.map; normal = hit.normal || null; from = "cache";
      }
    }
    if (!map && G.oak) {
      // the oak field: drawn here by its keeper, or awaited from it (oak_ms: the one or the other)
      const k0 = performance.now(); await oakFor(G.oakN(job.args), job.oakFrom); job.oak_ms = performance.now() - k0;
    }
    let t1 = performance.now(), t2 = t1;
    if (!map) {
      const r = draw(G, job.args, job.y0, job.y1, ctx);
      t2 = performance.now();
      map = r.map.buffer; normal = r.normal ? r.normal.buffer : null;
      if (key) { const d = await db(); if (d) store(d, key, { sig, w, h, map, normal }); }
    }
    // ms: the job's time here, waiting behind this worker's other jobs included; draw_ms: the drawing alone;
    // at, end: when (on the page's clock) it began drawing and finished
    const T0 = performance.timeOrigin;
    postMessage({ id: job.id, ok: true, w, h, y0: job.y0, y1: job.y1, map, normal, from, ms: performance.now() - t0, draw_ms: t2 - t1, oak_ms: job.oak_ms || 0, at: T0 + t1, end: T0 + performance.now() }, normal ? [map, normal] : [map]);
  } catch (e) {
    postMessage({ id: job.id, ok: false, error: String(e && (e.stack || e.message) || e) });
  }
};
