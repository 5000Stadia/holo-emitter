// A panel per kind: the thing from the front, its right, back, left and above, at rest and with everything
// that moves moved (lab/brief/object.html?panel=1), for an eye to check at authoring. Usage:
//   node tools/kind-panels.mjs OUT_DIR kind [kind…]   (needs the lab served; BASE overrides the address)
import { chromium } from "playwright";
const [out, ...names] = process.argv.slice(2), base = process.env.BASE || "http://192.168.68.58:8793";
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 1500, height: 600 } }); const errs = []; p.on("pageerror", e => errs.push(e.message));
for (const k of names) { const t0 = Date.now();
  await p.goto(`${base}/lab/brief/object.html?o=furniture&k=${k}&panel=1&webgl=1`, { timeout: 120000 }); await p.waitForFunction(() => window.__panel, null, { timeout: 120000 });
  await p.screenshot({ path: `${out}/panel-${k.replace("/", "_")}.png` }); console.log(k, `${Date.now() - t0} ms`); }
if (errs.length) console.log("errors", errs.slice(0, 3)); await b.close();
