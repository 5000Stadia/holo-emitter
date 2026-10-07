// The house from outside (R46): free-camera views. node tests/.outside.mjs OUTDIR [QS] name:x:y:z:yaw:pitch ...
import { chromium } from "playwright";
const [out, qs = "", ...views] = process.argv.slice(2);
const b = await chromium.launch({ args: process.env.GPU ? ["--use-angle=vulkan", "--enable-features=Vulkan", "--enable-unsafe-webgpu", "--ignore-gpu-blocklist"] : ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 960, height: 560 } }); const errs = []; p.on("pageerror", e => errs.push(e.message)); p.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
await p.goto(`http://localhost:8794/lab/manor/index.html?${process.env.GPU ? "" : "webgl=1&"}${qs}`, { timeout: 300000 }); await p.waitForFunction(() => window.__ok, null, { timeout: 300000 });
await p.evaluate(() => document.querySelectorAll("#keys,#gate,#line,#where").forEach(e => e.style.display = "none"));
console.log("exterior", JSON.stringify(await p.evaluate(() => ({ ms: window.__manor.exterior?.userData.ms, stacks: window.__manor.exterior?.userData.shell.stacks.length }))));
for (const v of views) { const [n, x, y, z, yaw, pitch] = v.split(":"); await p.evaluate((c) => { window.__freeCam = c.map(Number); }, [x, y, z, yaw, pitch]); await p.waitForTimeout(1500); await p.screenshot({ path: `${out}/out-${n}.png`, timeout: 120000 }); }
console.log("errors", errs.slice(0, 5)); await b.close();
