// Each kind with every number setting at 0.8x and 1.2x, every check run (lab/brief/object.html __sweepCheck):
// what breaks when a kind is made narrower, wider, lower or higher. Usage: node tools/sweep-kinds.mjs [kind…]
import { chromium } from "playwright";
const names = process.argv.slice(2), base = process.env.BASE || "http://localhost:8794";
const b = await chromium.launch({ args: ["--use-angle=vulkan", "--enable-features=Vulkan", "--enable-unsafe-webgpu", "--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: 300, height: 200 } }); const errs = []; p.on("pageerror", e => errs.push(e.message));
await p.goto(`${base}/lab/brief/object.html?o=furniture&k=table/gateleg&panel=1`, { timeout: 120000 }); await p.waitForFunction(() => window.__sweepCheck, null, { timeout: 120000 });
const t0 = Date.now(), rows = await p.evaluate((n) => window.__sweepCheck(n.length ? n : undefined), names);
const kinds = new Set(rows.map(r => r.kind));
for (const r of rows) console.log(`${r.kind}  ${r.setting}: ${r.findings.length} — ${r.findings.slice(0, 3).join("; ")}`);
console.log(`${kinds.size} kinds break under a setting's change, ${rows.length} settings in all; ${((Date.now() - t0) / 1000).toFixed(1)} s`);
if (errs.length) console.log("errors", errs.slice(0, 3)); await b.close();
