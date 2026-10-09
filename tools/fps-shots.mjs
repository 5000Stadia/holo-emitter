// The fps lab's pictures: a case drawn still from a set pose, for the ledger's side-by-sides (what an optimisation does
// to the picture). Writes lab/fps/shots/<name>.png. Each shot is "name=engine:case:query" (query: the pose, e.g.
// a=0.6 on the orbit, aim=tower, cam=x,y,z,tx,ty,tz,fov; &phone for the 390 x 844 DPR 3 viewport).
// Usage: node tools/fps-shots.mjs [--base http://127.0.0.1:8794] name=three-webgpu:m-ref:aim=tower ...
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const args = process.argv.slice(2), bi = args.indexOf("--base"), base = bi >= 0 ? args.splice(bi, 2)[1] : "http://localhost:8794";
const out = new URL("../lab/fps/shots/", import.meta.url); mkdirSync(out, { recursive: true });
const b = await chromium.launch({ args: ["--use-angle=vulkan", "--enable-features=Vulkan", "--enable-unsafe-webgpu", "--ignore-gpu-blocklist"], headless: true });
for (const s of args) {
  const name = s.slice(0, s.indexOf("=")), rest = s.slice(s.indexOf("=") + 1), [engine, c, ...q] = rest.split(":"), query = q.join(":"), phone = /(^|&)phone/.test(query);
  const p = await b.newPage({ viewport: phone ? { width: 390, height: 844 } : { width: 1280, height: 720 }, deviceScaleFactor: phone ? 3 : 1 });
  const errs = []; p.on("pageerror", x => errs.push(x.message));
  const u = engine === "godot-web" ? `${base}/lab/fps/godot-web/index.html?case=${c}&shot=1&${query}`
    : `${base}/lab/fps/three.html?case=${c}&shot=1${engine === "three-webgl2" ? "&webgl=1" : ""}${phone ? "&w=390&h=844&dpr=3" : ""}&${query.replace(/(^|&)phone/, "")}`;
  try {
    await p.goto(u, { timeout: 120000 });
    await p.waitForFunction(() => window.__shot, null, { timeout: 180000 });
    await p.locator("canvas").first().screenshot({ path: new URL(`${name}.png`, out).pathname });
    console.log(name, JSON.stringify(await p.evaluate(() => window.__shot)));
  } catch (x) { console.log(name, "FAILED", (errs[0] || x.message).slice(0, 200)); }
  await p.close();
}
await b.close();
