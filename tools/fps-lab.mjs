// The fps lab's runner: every case of lab/fps/spec.json, in every engine, in headless Chromium on
// this machine's real GPU (ANGLE on Vulkan; WebGPU on a localhost origin, a secure context). Writes
// lab/fps/results.json; lab/fps/index.html shows it as the ledger.
// Usage: node tools/fps-lab.mjs [--engines three-webgpu,three-webgl2,godot-web] [--cases base,instanced] [--group phone]
//          [--base http://localhost:8794] [--repeat 5] [--phone] [--gpu]
//   --repeat N: each case run N times, round-robin over the cases so the machine's drift falls on all of them alike; the
//     ledger keeps the median and the spread (min, max) of fps, and of GPU ms with --gpu
//   --phone: a phone-shaped viewport, 390 x 844 at DPR 3 (1170 x 2532 pixels drawn), kept under "<engine>|<case>|phone"
//   --gpu: WebGPU timestamps, each frame's GPU ms (WebGL 2 has no timer query in Chrome: null there)
//   after each run the page's JS heap is read (after a forced GC): used heap plus ArrayBuffer backing stores
import { chromium } from "playwright";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const flag = (k) => process.argv.includes(`--${k}`);
const base = arg("base", "http://localhost:8794"), repeat = +arg("repeat", 1), phone = flag("phone"), gpuFlag = flag("gpu");
const spec = JSON.parse(readFileSync(new URL("../lab/fps/spec.json", import.meta.url)));
const engines = arg("engines", "three-webgpu,three-webgl2,godot-web").split(",");
const group = arg("group", null);
const cases = arg("cases", spec.cases.filter(c => !group || c.group === group).map(c => c.id).join(",")).split(",");
const vp = phone ? { w: 390, h: 844, dpr: 3 } : { w: spec.viewport[0], h: spec.viewport[1], dpr: null };
const extra = `${phone ? `&w=${vp.w}&h=${vp.h}&dpr=${vp.dpr}` : ""}${gpuFlag ? "&gpu=1" : ""}`;
const url = { "three-webgpu": (c) => `${base}/lab/fps/three.html?case=${c}${extra}`, "three-webgl2": (c) => `${base}/lab/fps/three.html?case=${c}&webgl=1${extra}`, "godot-web": (c) => `${base}/lab/fps/godot-web/index.html?case=${c}` };
const outFile = new URL("../lab/fps/results.json", import.meta.url);
const results = existsSync(outFile) ? JSON.parse(readFileSync(outFile)) : { runs: {} };
const b = await chromium.launch({ args: ["--use-angle=vulkan", "--enable-features=Vulkan", "--enable-unsafe-webgpu", "--ignore-gpu-blocklist", "--disable-gpu-vsync", "--disable-frame-rate-limit"], headless: true });
const gpu = await (async () => { const p = await b.newPage(); await p.goto(`${base}/lab/fps/spec.json`); const g = await p.evaluate(() => { const gl = document.createElement("canvas").getContext("webgl2"), d = gl.getExtension("WEBGL_debug_renderer_info"); return gl.getParameter(d.UNMASKED_RENDERER_WEBGL); }); await p.close(); return g; })();
const med = (a) => { const s = a.filter(x => x != null).sort((x, y) => x - y); return s.length ? s[(s.length - 1) >> 1] + (s.length % 2 ? 0 : (s[s.length >> 1] - s[(s.length - 1) >> 1]) / 2) : null; };
const r2 = (x) => x == null ? null : Math.round(x * 100) / 100;
const all = {};
for (let k = 0; k < repeat; k++) for (const e of engines) for (const c of cases) {
  const sc = spec.cases.find(x => x.id === c); if (sc?.engines && !sc.engines.includes(e)) continue;     // a mechanism only that engine has
  const p = await b.newPage({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: vp.dpr || 1 });
  const errs = []; p.on("pageerror", x => errs.push(x.message)); p.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
  let r;
  try {
    await p.goto(url[e](c), { timeout: 120000 });
    await p.waitForFunction(() => window.__result, null, { timeout: (spec.warmup_seconds + spec.seconds) * 1000 + 180000 });
    r = await p.evaluate(() => window.__result);
    try { const cdp = await p.context().newCDPSession(p); await cdp.send("HeapProfiler.collectGarbage"); const h = await cdp.send("Runtime.getHeapUsage");
      r.heap_mb = r2((h.usedSize + (h.backingStorageSize || 0)) / 1048576); r.heap_buffers_mb = h.backingStorageSize != null ? r2(h.backingStorageSize / 1048576) : null; } catch (_) {}
  } catch (x) { r = { engine: e, case: c, failed: (errs[0] || x.message).slice(0, 200) }; }
  (all[`${e}|${c}`] ||= []).push(r);
  console.log(`${k + 1}/${repeat}`, e.padEnd(14), c.padEnd(22), r.failed ? `FAILED ${r.failed}` : `${String(r.fps).padStart(6)} fps  p99 ${r.p99_ms ?? "-"} ms  gpu ${r.gpu_ms ?? "-"} ms  heap ${r.heap_mb ?? "-"} MB  draws ${r.draws ?? "-"}${r.physics_ms != null ? `  physics ${r.physics_ms} ms` : ""}${r.still ? `  cpu ${r.cpu_ms} ms  busy ${r.busy_ms_per_s} ms/s` : ""}`);
  await p.close();
}
await b.close();
// the ledger's entry: the last run's details, with the median and spread of the numbers that swing
for (const [key, rs] of Object.entries(all)) {
  const ok = rs.filter(r => !r.failed), last = ok[ok.length - 1] || rs[rs.length - 1];
  const entry = { ...last, at: new Date().toISOString() };
  if (ok.length > 1 || repeat > 1) {
    for (const f of ["fps", "mean_ms", "p99_ms", "gpu_ms", "cpu_ms", "busy_ms_per_s", "heap_mb", "first_frame_ms", "drawn_per_s"]) {
      const v = ok.map(r => r[f]).filter(x => x != null); if (!v.length) continue;
      entry[f] = r2(med(v)); entry[`${f}_runs`] = v; entry[`${f}_min`] = Math.min(...v); entry[`${f}_max`] = Math.max(...v);
    }
    entry.runs = ok.length; if (ok.length < rs.length) entry.failures = rs.length - ok.length;
  }
  results.runs[phone ? `${key}|phone` : key] = entry;
}
results.machine = gpu; results.spec = { viewport: spec.viewport, seconds: spec.seconds };
results.phone_viewport = { css: [390, 844], dpr: 3, pixels: [1170, 2532] };
writeFileSync(outFile, JSON.stringify(results, null, 1));
