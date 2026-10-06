// The fps lab's runner: every case of lab/fps/spec.json, in every engine, in headless Chromium on
// this machine's real GPU (ANGLE on Vulkan; WebGPU on a localhost origin, a secure context). Writes
// lab/fps/results.json; lab/fps/index.html shows it as the ledger.
// Usage: node tools/fps-lab.mjs [--engines three-webgpu,three-webgl2,godot-web] [--cases base,instanced] [--base http://localhost:8794]
import { chromium } from "playwright";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const base = arg("base", "http://localhost:8794");
const spec = JSON.parse(readFileSync(new URL("../lab/fps/spec.json", import.meta.url)));
const engines = arg("engines", "three-webgpu,three-webgl2,godot-web").split(",");
const cases = arg("cases", spec.cases.map(c => c.id).join(",")).split(",");
const url = { "three-webgpu": (c) => `${base}/lab/fps/three.html?case=${c}`, "three-webgl2": (c) => `${base}/lab/fps/three.html?case=${c}&webgl=1`, "godot-web": (c) => `${base}/lab/fps/godot-web/index.html?case=${c}` };
const outFile = new URL("../lab/fps/results.json", import.meta.url);
const results = existsSync(outFile) ? JSON.parse(readFileSync(outFile)) : { runs: {} };
const b = await chromium.launch({ args: ["--use-angle=vulkan", "--enable-features=Vulkan", "--enable-unsafe-webgpu", "--ignore-gpu-blocklist", "--disable-gpu-vsync", "--disable-frame-rate-limit"], headless: true });
const gpu = await (async () => { const p = await b.newPage(); await p.goto(`${base}/lab/fps/spec.json`); const g = await p.evaluate(() => { const gl = document.createElement("canvas").getContext("webgl2"), d = gl.getExtension("WEBGL_debug_renderer_info"); return gl.getParameter(d.UNMASKED_RENDERER_WEBGL); }); await p.close(); return g; })();
for (const e of engines) for (const c of cases) {
  const p = await b.newPage({ viewport: { width: spec.viewport[0], height: spec.viewport[1] } });
  const errs = []; p.on("pageerror", x => errs.push(x.message)); p.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
  let r;
  try {
    await p.goto(url[e](c), { timeout: 120000 });
    await p.waitForFunction(() => window.__result, null, { timeout: (spec.warmup_seconds + spec.seconds) * 1000 + 120000 });
    r = await p.evaluate(() => window.__result);
  } catch (x) { r = { engine: e, case: c, failed: (errs[0] || x.message).slice(0, 200) }; }
  results.runs[`${e}|${c}`] = { ...r, at: new Date().toISOString() };
  console.log(e.padEnd(14), c.padEnd(22), r.failed ? `FAILED ${r.failed}` : `${String(r.fps).padStart(6)} fps  p99 ${r.p99_ms} ms  draws ${r.draws ?? "-"}  tris ${r.triangles ?? "-"}${r.physics_ms != null ? `  physics ${r.physics_ms} ms` : ""}`);
  await p.close();
}
await b.close();
results.machine = gpu; results.spec = { viewport: spec.viewport, seconds: spec.seconds };
writeFileSync(outFile, JSON.stringify(results, null, 1));
