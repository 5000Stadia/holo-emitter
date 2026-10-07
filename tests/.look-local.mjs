import { chromium } from "playwright";
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 800, height: 500 } });
const errs = []; p.on("pageerror", e => errs.push(e.message)); p.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
await p.goto("http://localhost:8794/lab/manor/index.html?webgl=1" + (process.env.QS || ""), { timeout: 300000 });
await p.waitForFunction(() => window.__ok, null, { timeout: 300000 });
await p.evaluate(() => document.querySelectorAll("#keys,#gate,#where").forEach(e => e.style.display = "none"));
// AMB=1: a flat light over everything, for looking at shape rather than lighting
if (process.env.AMB) await p.evaluate(() => { const T = window.__THREE; window.__scene.add(new T.AmbientLight(0xffffff, 2.5)); });
// views: name:x:y:yawDeg:pitchDeg:floor  (plan coords)
for (const v of process.argv.slice(3)) { const [n, x, y, yaw, pitch, floor, act] = v.split(":");
  await p.evaluate(([x, y, yaw, pitch, floor]) => window.__place(+x, +y, +yaw, +pitch, floor), [x, y, yaw, pitch, floor]);
  if (act) await p.evaluate((k) => { const W = window.__works; for (const b of W.things.values()) if (b.kind.kind === k) for (const a of Object.keys(b.kind.affordances || {})) W.act({ b, aff: a }); }, act);
  await p.waitForTimeout(2000); await p.screenshot({ timeout: 120000, path: `${process.argv[2]}/v-${n}.png` }); }
console.log("errors", errs.slice(0, 6)); await b.close();
