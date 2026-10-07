import { chromium } from "playwright";
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage(); await p.goto("http://localhost:8794/lab/manor/index.html?webgl=1&nofurn=1" + (process.env.QS || ""), { timeout: 300000 }); await p.waitForFunction(() => window.__ok, null, { timeout: 300000 });
console.log(JSON.stringify(await p.evaluate(() => window.__sight()), null, 1)); await b.close();
