// What the manor holds on the CPU at a phone's viewport, with the vertex arrays let go (src/make/geodrop.js) and without.
// Headless Chromium on this machine's GPU; one page each, after the rooms are compiled ahead (warm) and a GC.
//   node tests/.geodrop.mjs [baseurl] [extra query, e.g. "&geodrop=0"] [label]
// Prints: the perf card's memory line (held geo, GPU geo/tex), JS heap after GC (CDP), the renderer and GPU processes' RSS,
// and the held vertex arrays by attribute name and by whether the page still needs them.
import { chromium } from "playwright";
import { execSync } from "child_process";
const BASE = process.argv[2] || "http://localhost:8794", EXTRA = process.argv[3] || "", LABEL = process.argv[4] || (EXTRA || "default");
const server = await chromium.launchServer({ args: ["--use-angle=vulkan", "--enable-features=Vulkan", "--enable-unsafe-webgpu", "--ignore-gpu-blocklist", "--enable-precise-memory-info"], headless: true });
const b = await chromium.connect(server.wsEndpoint());
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
const p = await ctx.newPage(), errs = [];
p.on("pageerror", e => errs.push(e.message)); p.on("console", m => { if (m.type() === "error" || /geodrop/.test(m.text())) errs.push(m.text()); });
await p.goto(`${BASE}/lab/manor/index.html?case=case-1660&fresh&perf${EXTRA}`, { timeout: 300000 });
await p.waitForFunction(() => window.__ok, null, { timeout: 300000 });
// the rooms compiled ahead (at most 60 s), then a few seconds for the sweeps
await p.waitForFunction(() => { const w = window.__warm?.(); return !w || w.left === 0 || w.finished; }, null, { timeout: 90000 }).catch(() => {});
await p.waitForTimeout(6000);
const cdp = await ctx.newCDPSession(p);
await cdp.send("HeapProfiler.collectGarbage"); await p.waitForTimeout(500); await cdp.send("HeapProfiler.collectGarbage");
const heap = await cdp.send("Runtime.getHeapUsage");
await cdp.send("Performance.enable"); const met = Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map(m => [m.name, m.value]));
const inPage = await p.evaluate(() => {
  const scene = window.__scene, seen = new Set(), byName = {}, byState = { held: 0, dropped: 0 }; let geo = 0, meshes = 0;
  scene.traverse(o => { if (!o.isMesh) return; meshes++; const g = o.geometry; if (!g || seen.has(g)) return; seen.add(g);
    const all = [...Object.entries(g.attributes), ...(g.index ? [["index", g.index]] : [])];
    for (const [n, a] of all) { const arr = a.array || a.data?.array; if (!arr || seen.has(arr)) continue; seen.add(arr); geo += arr.byteLength; byName[n] = (byName[n] || 0) + arr.byteLength; } });
  const MB = (v) => +(v / 1048576).toFixed(1);
  const card = window.__eng.card.summary?.();
  return { meshes, geoMB: MB(geo), byName: Object.fromEntries(Object.entries(byName).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, MB(v)])), mem: card?.mem, backend: window.__eng.backend, flags: card?.flags, warm: window.__warm?.(), drop: window.__geodrop?.() };
});
// the renderer and GPU processes: children of the browser process, by their --type
const rss = (() => { try { const root = server.process().pid; const rows = execSync(`ps -eo pid,ppid,rss,args --no-headers`).toString().split("\n").filter(Boolean).map(l => { const m = l.trim().match(/^(\d+)\s+(\d+)\s+(\d+)\s+(.*)$/); return m && { pid: +m[1], ppid: +m[2], rss: +m[3], args: m[4] }; }).filter(Boolean);
  const kids = new Set([root]); let grew = true; while (grew) { grew = false; for (const r of rows) if (kids.has(r.ppid) && !kids.has(r.pid)) { kids.add(r.pid); grew = true; } }
  const mine = rows.filter(r => kids.has(r.pid)), sum = (re) => Math.round(mine.filter(r => re.test(r.args)).reduce((a, r) => a + r.rss, 0) / 1024);
  return { rendererMB: sum(/--type=renderer/), gpuMB: sum(/--type=gpu-process/) }; } catch (e) { return { err: e.message }; } })();
console.log(JSON.stringify({ label: LABEL, jsHeapMB: +(met.JSHeapUsedSize / 1048576).toFixed(1), v8HeapMB: +(heap.usedSize / 1048576).toFixed(1), backingMB: heap.backingStorageSize != null ? +(heap.backingStorageSize / 1048576).toFixed(1) : null, pageMemMB: await p.evaluate(() => +((performance.memory?.usedJSHeapSize || 0) / 1048576).toFixed(1)), ...rss, ...inPage, errors: errs.slice(0, 6) }, null, 1));
await b.close(); await server.close();
