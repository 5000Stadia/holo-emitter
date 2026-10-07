// The placer (R54 step 6) on the house: what each room got, what it refused, how full, how long
import { chromium } from "playwright";
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message)); p.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
await p.goto("http://localhost:8794/lab/manor/index.html?webgl=1" + (process.env.QS || ""), { timeout: 300000 }); await p.waitForFunction(() => window.__ok, null, { timeout: 300000 });
const r = await p.evaluate(() => [...window.__manor.placements].map(([id, g]) => ({ id, n: g.placed.length, kinds: g.placed.map(q => `${q.kind}${q.tier !== "anchor" ? "(" + q.tier + ")" : ""}`).join(","), refused: g.refused.map(q => `${q.kind}: ${q.why}`), share: g.share, ms: g.ms, probe: g.probe_ms })));
for (const x of r) console.log(`${x.id} [${x.n}] share ${x.share} ${x.ms}ms (probes ${x.probe}): ${x.kinds}${x.refused.length ? "\n   REFUSED " + x.refused.join("; ") : ""}`);
console.log("total ms", r.reduce((s, x) => s + x.ms, 0).toFixed(1), "probes", r.reduce((s, x) => s + x.probe, 0).toFixed(1), "errors", errs.slice(0, 4)); await b.close();
