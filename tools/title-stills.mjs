// title-stills.mjs: the manor page's first screen (R65; Teleoperator's title, design/references/teleoperator/README.md).
// For each address the site links, load the page as a first-time visitor, wait until the start is walkable, and save the
// very view you start in (UI hidden) as lab/manor/stills/<key>.webp, plus a tiny copy inlined into the page between its
// "stills:" markers, with the house it was made from (the page says when the house has moved on since).
// Usage: node tools/title-stills.mjs [port]   (serves the checkout itself; needs python3 and Pillow)
import { chromium } from "playwright";
import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
const PORT = +(process.argv[2] || 8797), ROOT = new URL("..", import.meta.url).pathname, SCRATCH = fs.mkdtempSync("/tmp/title-stills-");
const ENTRIES = { manor: "", "case-1660": "case=case-1660", banqueting: "plan=banqueting", "alice-hall": "plan=alice-hall" };
const srv = spawn("python3", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1"], { cwd: ROOT, stdio: "ignore" });
await new Promise(r => setTimeout(r, 800));
const b = await chromium.launch({ args: ["--use-angle=vulkan", "--enable-features=Vulkan", "--enable-unsafe-webgpu", "--ignore-gpu-blocklist"] });
const made = {};
try {
  for (const [key, q] of Object.entries(ENTRIES)) {
    made[key] = {};
    // wide: a desktop or a phone on its side (fov 66°); tall: a phone held upright, as the page frames it (fov to 88°)
    for (const [name, dev, small] of [["", { viewport: { width: 1600, height: 900 } }, [80, 45]],
      ["-tall", { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, [36, 78]]]) {
      const ctx = await b.newContext(dev), p = await ctx.newPage();
      await p.goto(`http://127.0.0.1:${PORT}/lab/manor/?${q}${q ? "&" : ""}still=0`, { timeout: 300000 });
      await p.waitForFunction(() => window.__ok, null, { timeout: 300000 });
      await p.addStyleTag({ content: "body *{visibility:hidden!important} canvas{visibility:visible!important}" });
      await p.evaluate(() => new Promise(r => { let n = 0; const f = () => ++n < 30 ? requestAnimationFrame(f) : r(); requestAnimationFrame(f); }));
      const png = `${SCRATCH}/title-still-${key}${name}.png`; await p.screenshot({ path: png });
      const world = (await p.evaluate(() => window.__wkey)).split("/manor/world/")[1], file = `${ROOT}lab/manor/stills/${key}${name}.webp`;
      const out = execFileSync("python3", ["-c", `
import sys, base64, io; from PIL import Image
im = Image.open(sys.argv[1]).convert("RGB"); im.save(sys.argv[2], "WEBP", quality=72, method=6)
b = io.BytesIO(); im.resize((int(sys.argv[3]), int(sys.argv[4])), Image.LANCZOS).save(b, "WEBP", quality=60); print(base64.b64encode(b.getvalue()).decode())`, png, file, ...small.map(String)]).toString().trim();
      if (made[key].world && made[key].world !== world) throw new Error(`${key}: the wide and tall stills were made from different houses`);
      Object.assign(made[key], { [name ? "thumbTall" : "thumb"]: `data:image/webp;base64,${out}`, v: world.slice(-8), world });
      console.log(key + name, `${(fs.statSync(file).size / 1024).toFixed(0)} KB`, "thumb", out.length, "chars", world);
      fs.rmSync(png); await ctx.close();
    }
  }
} finally { await b.close(); srv.kill(); fs.rmSync(SCRATCH, { recursive: true, force: true }); }
const page = `${ROOT}lab/manor/index.html`, html = fs.readFileSync(page, "utf8");
const block = `<!-- stills:begin (written by tools/title-stills.mjs) -->\n<script>window.__stillsMade = ${JSON.stringify(made)};</script>\n<!-- stills:end -->`;
fs.writeFileSync(page, html.replace(/<!-- stills:begin[\s\S]*?<!-- stills:end -->/, block));
