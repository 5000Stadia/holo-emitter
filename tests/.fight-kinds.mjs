import { chromium } from "playwright";
const b = await chromium.launch({ args: ["--use-angle=vulkan", "--enable-features=Vulkan", "--enable-unsafe-webgpu", "--ignore-gpu-blocklist"] });
const p = await b.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
await p.goto("http://localhost:8794/lab/brief/object.html?o=furniture&k=table/gateleg&panel=1", { timeout: 120000 }); await p.waitForFunction(() => window.__fightKinds, null, { timeout: 120000 });
const r = await p.evaluate((n) => window.__fightKinds(n.length ? n : null), process.argv.slice(2));
let tot = 0; for (const [k, gs] of Object.entries(r)) { for (const g of gs) { tot += g.area; console.log(`${k.padEnd(28)} ${String(g.area).padStart(7)} cm² ${String(g.n).padStart(4)}× ${g.pair} @${g.at}`); } }
console.log(`${Object.keys(r).length} kinds with faces that fight, ${tot.toFixed(0)} cm² in all`, errs.slice(0, 3)); await b.close();
