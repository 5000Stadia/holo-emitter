// Test the checks themselves (design/production/geometry-method.md §3): in good kinds, plant one known fault
// at a time in one part (inside out, a hole, sunk halfway, lifted 2 cm, buried whole, a doubled face) and see
// which checks catch it. Usage (the lab served; BASE overrides): node tools/plant-faults.mjs [kind…]
import { chromium } from "playwright";
const base = process.env.BASE || "http://localhost:8794";
const names = process.argv.slice(2).length ? process.argv.slice(2) : ["chest/boarded", "table/gateleg", "cupboard/court", "chair/joined", "cradle/hooded", "trough/kneading", "bed/standing-curtained", "dresser/pewter", "tankard/pewter-lidded", "jug/earthen", "clock/lantern", "arms/pikes"];
const b = await chromium.launch({ args: ["--use-angle=vulkan", "--enable-features=Vulkan", "--enable-unsafe-webgpu", "--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: 300, height: 200 } }); const errs = []; p.on("pageerror", e => errs.push(e.message));
await p.goto(`${base}/lab/brief/object.html?o=furniture&k=table/gateleg&panel=1`, { timeout: 120000 }); await p.waitForFunction(() => window.__plantFaults, null, { timeout: 120000 });
const t0 = Date.now(), rows = await p.evaluate((n) => window.__plantFaults(n), names);
const by = {};
for (const r of rows) { if (r.skipped) { console.log(`${r.kind}: skipped, ${r.skipped}`); continue; }
  const s = by[r.fault] || (by[r.fault] = { n: 0, caught: 0, by: {}, missed: [] }); s.n++;
  if (r.caught.length) s.caught++; else s.missed.push(`${r.kind} #${r.part}`);
  for (const c of r.caught) s.by[c] = (s.by[c] || 0) + 1; }
console.log("| fault | planted | caught | by which checks | missed |\n|---|---|---|---|---|");
for (const [f, s] of Object.entries(by)) console.log(`| ${f} | ${s.n} | ${s.caught} (${Math.round(100 * s.caught / s.n)}%) | ${Object.entries(s.by).map(([c, n]) => `${c} ${n}`).join(", ")} | ${s.missed.join("; ")} |`);
console.log(`${rows.length} plantings in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
if (errs.length) console.log("errors", errs.slice(0, 3)); await b.close();
