// A panel per kind: the thing from the front, its right, back, left and above, at rest and with everything
// that moves moved (lab/brief/object.html?panel=1), for an eye to check at authoring. One page, its
// textures made once, every kind drawn in turn. Usage:
//   node tools/kind-panels.mjs OUT_DIR kind [kind…] | --all  [--diag]   (needs the lab served; BASE overrides the address)
import { chromium } from "playwright";
const [out, ...args] = process.argv.slice(2), base = process.env.BASE || "http://localhost:8794";
const b = await chromium.launch({ args: ["--use-angle=vulkan", "--enable-features=Vulkan", "--enable-unsafe-webgpu", "--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: 1000, height: 400 } }); const errs = []; p.on("pageerror", e => errs.push(e.message));
const t0 = Date.now();
await p.goto(`${base}/lab/brief/object.html?o=furniture&k=table/gateleg&panel=1`, { timeout: 120000 }); await p.waitForFunction(() => window.__panelOf, null, { timeout: 120000 });
const tLoad = Date.now() - t0;
const names = args[0] === "--all" ? await p.evaluate(async () => (await import("/src/make/kinds/furniture-1660.js")).default.map(k => k.kind)) : args;
let draw = 0;
// --diag: the diagnostic panel (each part its own flat colour, inside-out faces magenta, flagged parts red)
const diag = names.includes("--diag"); if (diag) names.splice(names.indexOf("--diag"), 1);
for (const k of names) { const t = Date.now(); const r = await p.evaluate(([k, d]) => d ? window.__diagPanelOf(k) : window.__panelOf(k), [k, diag]); await p.screenshot({ path: `${out}/${diag ? "diag" : "panel"}-${k.replace("/", "_")}.png` }); draw += Date.now() - t;
  if (diag && r.flagged?.length) console.log(`${k}: flagged parts ${r.flagged.join(", ")}`); }
console.log(`${names.length} kinds: the page once ${tLoad} ms, then ${(draw / names.length).toFixed(0)} ms a kind (build, ten views, the picture saved); ${((Date.now() - t0) / 1000).toFixed(1)} s in all`);
if (errs.length) console.log("errors", errs.slice(0, 3)); await b.close();
