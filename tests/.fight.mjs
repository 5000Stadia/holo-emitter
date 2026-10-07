// faces that fight across the built house (__fight): what pairs, how much area, where
import { chromium } from "playwright";
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage(); await p.goto("http://localhost:8794/lab/manor/index.html?webgl=1" + (process.env.QS || ""), { timeout: 300000 }); await p.waitForFunction(() => window.__ok, null, { timeout: 300000 });
const r = await p.evaluate(() => { const R = window.__fight(); return { ...R, groups: R.groups.slice(0, 40) }; });
console.log(`${r.meshes} meshes, ${r.pairs} fighting triangle pairs, ${r.ms} ms`); for (const g of r.groups) console.log(`${String(g.area).padStart(8)} cm² ${String(g.n).padStart(4)}× ${g.pair} @${g.at}` + (process.env.TRIS ? `\n   n ${g.nrm}\n   A ${g.ta}\n   B ${g.tb}` : ''));
await b.close();
