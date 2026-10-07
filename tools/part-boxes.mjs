// Each part's box, kind by kind, at rest (for converting a kind's coordinates to relations without moving
// anything: dump before, convert, dump after, compare). Usage:
//   node tools/part-boxes.mjs dump out.json [kind ...]     every kind if none named
//   node tools/part-boxes.mjs diff before.json after.json  parts that moved more than 2 mm, or appeared or went
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";
const [mode, a, ...rest] = process.argv.slice(2), base = process.env.BASE || "http://localhost:8794";
if (mode === "diff") {
  const A = JSON.parse(readFileSync(a)), B = JSON.parse(readFileSync(rest[0])); let n = 0;
  for (const k of Object.keys({ ...A, ...B })) { const pa = A[k] || [], pb = B[k] || [];
    if (pa.length !== pb.length) { console.log(`${k}: ${pa.length} parts before, ${pb.length} after`); n++; }
    for (let i = 0; i < Math.min(pa.length, pb.length); i++) { const d = Math.max(...pa[i].lo.map((v, j) => Math.abs(v - pb[i].lo[j])), ...pa[i].hi.map((v, j) => Math.abs(v - pb[i].hi[j])));
      if (d > 0.002) { console.log(`${k} #${i} moved ${(d * 1000).toFixed(0)} mm: lo ${pa[i].lo} → ${pb[i].lo}, hi ${pa[i].hi} → ${pb[i].hi}`); n++; } } }
  console.log(n ? `${n} differences` : "no part moved"); process.exit(n ? 1 : 0);
}
const b = await chromium.launch({ args: ["--use-angle=vulkan", "--enable-features=Vulkan", "--enable-unsafe-webgpu", "--ignore-gpu-blocklist"] });
const p = await b.newPage(); await p.goto(`${base}/lab/brief/object.html?o=furniture&k=table/gateleg&panel=1`, { timeout: 120000 }); await p.waitForFunction(() => window.__boxes, null, { timeout: 120000 });
const out = await p.evaluate((names) => window.__boxes(names.length ? names : null), rest);
writeFileSync(a, JSON.stringify(out)); console.log(`${Object.keys(out).length} kinds dumped to ${a}`); await b.close();
