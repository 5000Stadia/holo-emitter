// The kit's textures, drawn off the main thread (R46, "stream the manor first"). A texture is asked for by
// recipe, { lib, gen, args }: a generator in a pure module (texgen.js, lab/brief/strongroom-tex.js) and
// what it is drawn from. It is drawn in a pool of module workers (texworker.js), in bands of rows spread
// over them, each band kept in IndexedDB so a second visit draws nothing; the main thread only wraps the
// pixels as three.js data textures, set as procedural.js's canvas textures were (sRGB maps, repeat,
// anisotropy 8, mipmaps), the rows turned over as a canvas texture's upload turned them (flipY). Same
// pixels, same texels.
//
//   kitTexture(THREE, recipe, { srgb, repeat, mode }) -> { map, normalMap }   (normalMap where it has one)
//     mode "async": the textures come back at once, empty, and fill when their pixels arrive
//     mode "sync":  drawn here and now, on the main thread (as before: nothing to wait for)
//     mode "auto":  async while deferTextures(true) is in force (a page that awaits settled() before it
//                   draws), sync otherwise
//   settled()       -> a promise: every texture asked for so far has its pixels
//   textureLog()    -> what each texture cost, and where it came from (drawn in a worker, the cache, here)
//
// No SharedArrayBuffer (GitHub Pages can't send COOP/COEP): plain workers, pixels transferred. A worker
// that can't start or fails hands its work back here, so a page always gets its textures.
import { draw, bandsOf, bandRows, makeCtx, LIB as KIT } from "./texgen.js";

// bump to drop every stored texture (a change to the cache's form, or to anything the generators' source hash can't see)
export const TEX_VERSION = 1;

const PHONE = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches && Math.min(screen.width, screen.height) < 900;
// the pool: one worker per spare core, at most four (two on a phone), so the main thread keeps one of its own
export const POOL = Math.max(1, Math.min(PHONE ? 2 : 4, (navigator.hardwareConcurrency || 2) - 1));
const OAK_US = 1024 * 1024 * 0.75;        // the oak field's cost (µs, as a job's): paid once, by the worker that keeps it
const Q = new URLSearchParams(typeof location === "object" ? location.search : "");
const CACHE = Q.get("texcache") !== "0";  // ?texcache=0: draw everything, keep nothing (for measuring a first visit)

let slots = null, seq = 0, deferring = false;
const mainCtx = makeCtx(), known = new Map(), pending = new Set(), drawnOf = new WeakMap();

// ---------------------------------------------------------------- the pool
function pool() {
  if (slots) return slots;
  slots = [];
  if (typeof Worker !== "function" || Q.get("texworkers") === "0") return slots;
  for (let i = 0; i < POOL; i++) {
    let w; try { w = new Worker(new URL("./texworker.js", import.meta.url), { type: "module", name: `kit textures ${i + 1}` }); } catch (_) { break; }
    const s = { w, i, load: 0, alive: true, jobs: new Map() };
    s.started = new Promise((res) => { s.hello = res; });
    w.onmessage = ({ data }) => { if (data.hello) return s.hello(true);
      const j = s.jobs.get(data.id); if (!j) return; s.jobs.delete(data.id); s.load -= j.cost;
      if (data.ok) { data.worker = s.i + 1; j.resolve(data); } else { console.warn("kit textures: a worker failed, drawing here instead:", data.error); j.resolve(onMain(j)); } };
    // a worker that can't start (no module workers) or dies: its jobs, and the pool's from now on, are drawn here
    w.onerror = (e) => { e.preventDefault?.(); s.alive = false; s.hello(false); try { w.terminate(); } catch (_) {} for (const j of s.jobs.values()) j.resolve(onMain(j)); s.jobs.clear(); };
    slots.push(s);
  }
  // a channel between each pair, so the oak field drawn in one is handed to the rest without the main thread
  slots.forEach((s, i) => s.w.postMessage({ me: i + 1 }));
  for (let a = 0; a < slots.length; a++) for (let b = a + 1; b < slots.length; b++) {
    const ch = new MessageChannel();
    slots[a].w.postMessage({ peer: b + 1, port: ch.port1 }, [ch.port1]);
    slots[b].w.postMessage({ peer: a + 1, port: ch.port2 }, [ch.port2]);
  }
  return slots;
}
let oakKeeper = null;           // the worker that draws the oak field for the pool
// the pool, running: Chrome starts a worker only when the page's main thread is free to, so a page about to
// block it (building a house) waits for this first (a few tens of milliseconds), and the workers draw meanwhile
export function warmTextures(timeout = 3000) {
  const live = pool();
  return Promise.race([Promise.all(live.map(s => s.started)), new Promise(r => setTimeout(r, timeout))]);
}
// one band, on the main thread
function onMain(j) {
  const t0 = performance.now(), r = draw(j.G, j.args, j.y0, j.y1, mainCtx), ms = performance.now() - t0;
  return { w: r.w, h: r.h, y0: j.y0, y1: j.y1, map: r.map.buffer, normal: r.normal ? r.normal.buffer : null, from: "main", ms, draw_ms: ms,
    worker: 0, at: performance.timeOrigin + t0, end: performance.timeOrigin + t0 + ms };
}
// one band, in the worker that will be free soonest; the first band that needs the oak field makes its
// worker the field's keeper (and costs it the field), the rest are handed it
function band(lib, G, gen, args, y0, y1, w) {
  const j = { G, args, y0, y1, cost: w * (y1 - y0) * G.cost };
  const live = pool().filter(s => s.alive);
  if (!live.length) return Promise.resolve().then(() => onMain(j));
  let best = null, bestT = Infinity;
  for (const s of live) if (s.load < bestT) { bestT = s.load; best = s; }
  if (G.oak && (!oakKeeper || !oakKeeper.alive)) { oakKeeper = best; j.cost += OAK_US; }
  best.load += j.cost;
  return new Promise((resolve) => {
    const id = ++seq; j.resolve = resolve; best.jobs.set(id, j);
    best.w.postMessage({ id, v: TEX_VERSION, lib: lib.url, gen, args, y0, y1, cache: CACHE, oakFrom: G.oak ? oakKeeper.i + 1 : 0 });
  });
}

// ---------------------------------------------------------------- textures
// the bands of one texture, rows turned over within each, laid into one image in upload order
function assemble(parts, w, h, key) {
  if (parts.length === 1) return parts[0][key] && new Uint8Array(parts[0][key]);
  if (!parts[0][key]) return null;
  const out = new Uint8Array(w * h * 4);
  for (const p of parts) out.set(new Uint8Array(p[key]), (h - p.y1) * w * 4);
  return out;
}
// one recipe's pixels, shared by every texture made from it
function entry(lib, gen, args, mode) {
  const key = `${lib.url}|${gen}|${JSON.stringify(args)}`;
  let e = known.get(key);
  if (!e) {
    const G = lib.GEN[gen];
    if (!G) throw new Error(`no texture generator "${gen}"`);
    const [w, h] = G.size(args);
    e = { key, G, w, h, data: null, waiting: [], log: { gen, args: JSON.stringify(args), w, h, bands: 0, from: "", worker_ms: 0, wall_ms: 0 } };
    known.set(key, e);
    if (mode === "async") {
      const n = bandsOf(G, w, h), t0 = performance.now();
      e.log.bands = n;
      e.done = Promise.all(Array.from({ length: n }, (_, k) => { const [y0, y1] = bandRows(h, k, n); return band(lib, G, gen, args, y0, y1, w); }))
        .then((parts) => {
          if (!e.data) e.data = { map: assemble(parts, w, h, "map"), normal: assemble(parts, w, h, "normal") };
          e.log.from = [...new Set(parts.map(p => p.from))].join("+"); e.log.worker_ms = Math.round(parts.reduce((a, p) => a + p.draw_ms, 0)); e.log.wall_ms = Math.round(performance.now() - t0);
          // each band: which worker (0: here), when it began and ended drawing (page clock), how long it drew, and
          // how long it spent on the oak field first (drawing it, in the keeper; waiting for it, in the others)
          e.log.parts = parts.map(p => ({ worker: p.worker, rows: [p.y0, p.y1], from: p.from, draw_ms: Math.round(p.draw_ms), oak_ms: Math.round(p.oak_ms || 0), at: Math.round(p.at - performance.timeOrigin), end: Math.round(p.end - performance.timeOrigin) }));
          e.log.asked = Math.round(t0); e.log.whole = Math.round(performance.now());
          fill(e); pending.delete(e.done); return e;
        });
      pending.add(e.done);
    }
  }
  if (mode === "sync" && !e.data) {
    // asked for now: drawn here, whole (whatever was on its way from the workers is then not needed)
    const t0 = performance.now(), r = draw(e.G, args, 0, e.h, mainCtx);
    e.data = { map: new Uint8Array(r.map.buffer), normal: r.normal && new Uint8Array(r.normal.buffer) };
    Object.assign(e.log, { bands: 1, from: "main", worker_ms: 0, wall_ms: Math.round(performance.now() - t0) });
    fill(e);
    if (!e.done) e.done = Promise.resolve(e);
  }
  return e;
}
function blank(THREE, w, h, srgb, repeat) {
  const t = new THREE.DataTexture(null, w, h, THREE.RGBAFormat, THREE.UnsignedByteType);
  // a canvas texture's own settings, which a data texture doesn't default to; its rows already in upload order
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.flipY = false; t.unpackAlignment = 4;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}
const put = (t, data, w, h) => { t.image = { data, width: w, height: h }; t.needsUpdate = true; };
function fill(e) {
  for (const { map, normalMap } of e.waiting) { put(map, e.data.map, e.w, e.h); if (normalMap) put(normalMap, e.data.normal, e.w, e.h); }
  e.waiting.length = 0;
}

export function kitTexture(THREE, { lib = KIT, gen, args }, { srgb = true, repeat = true, mode = "auto" } = {}) {
  const e = entry(lib, gen, args, mode === "auto" ? (deferring ? "async" : "sync") : mode);
  // (a normal map always repeats, as normalFrom's did, whatever its map does)
  const set = { map: blank(THREE, e.w, e.h, srgb, repeat), normalMap: e.G.normal != null ? blank(THREE, e.w, e.h, false, true) : null };
  if (e.data) { put(set.map, e.data.map, e.w, e.h); if (set.normalMap) put(set.normalMap, e.data.normal, e.w, e.h); }
  else e.waiting.push(set);
  drawnOf.set(set.map, e.done); if (set.normalMap) drawnOf.set(set.normalMap, e.done);
  return set.normalMap ? { map: set.map, normalMap: set.normalMap } : { map: set.map };
}
// a promise for one texture's pixels
export const drawn = (tex) => drawnOf.get(tex) || Promise.resolve();
// while on, textures asked for with mode "auto" are drawn in the workers and arrive later; the page awaits settled()
export function deferTextures(on) { deferring = !!on; }
export async function settled() { while (pending.size) await Promise.all([...pending]); }
export const textureLog = () => [...known.values()].map(e => ({ ...e.log }));
// the oak field on the main thread (procedural.js's K.oak), drawn on first use and shared with the textures drawn here
export const mainOak = (N = 1024) => mainCtx.oak(N);
