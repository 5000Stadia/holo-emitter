// The bench's reference layouts (lab/bench/reference.json): run the bench headless and keep each
// case's layout hash. Every other device must build the same. Re-run when a kind or part changes,
// and commit what moves. Usage: node tools/bench-reference.mjs [base-url]
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
const base = process.argv[2] || "http://192.168.68.58:8793";
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage();
const errs = []; p.on("pageerror", e => errs.push(e.message));
await p.goto(`${base}/lab/bench/?reference`, { timeout: 120000 });
await p.waitForFunction(() => window.__bench, null, { timeout: 900000 });
const r = await p.evaluate(() => window.__bench);
await b.close();
if (errs.length) { console.error(errs); process.exit(1); }
const out = { made: r.at, by: r.device.agent, cases: Object.fromEntries(r.results.map(c => [c.name, c.layout])) };
writeFileSync(new URL("../lab/bench/reference.json", import.meta.url), JSON.stringify(out, null, 1) + "\n");
console.log(JSON.stringify(out, null, 1));
