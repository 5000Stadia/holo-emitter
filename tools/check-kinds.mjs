// Checks 13 and 14 over every kind (src/make/audit.js): every part a recipe names shows from some side,
// and none sits inside another; and the mesh rules (src/make/mesh-rules.js): closed, outward, shimmer, whole. At authoring, no picture. Usage (the lab served; BASE overrides):
//   node tools/check-kinds.mjs [kind…]
import { chromium } from "playwright";
const names = process.argv.slice(2), base = process.env.BASE || "http://localhost:8794";
const b = await chromium.launch({ args: ["--use-angle=vulkan", "--enable-features=Vulkan", "--enable-unsafe-webgpu", "--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: 400, height: 300 } }); const errs = []; p.on("pageerror", e => errs.push(e.message));
await p.goto(`${base}/lab/brief/object.html?o=furniture&k=table/gateleg&panel=1`, { timeout: 120000 }); await p.waitForFunction(() => window.__partsCheck, null, { timeout: 120000 });
const r = await p.evaluate((n) => window.__partsCheck(n.length ? n : undefined), names);
for (const f of r.findings) console.log(`${f.kind}  check ${f.check ?? "-"}  ${f.part ?? ""}  ${f.what ?? f.error}`);
console.log(`${r.kinds} kinds, ${r.findings.length} findings, ${r.ms} ms (${r.perKind} ms a kind; the mesh rules ${r.rulesMs} ms of it)`);
if (errs.length) console.log("errors", errs.slice(0, 3)); await b.close();
