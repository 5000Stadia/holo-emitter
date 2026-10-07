// every piece placed back to a wall stands at the wall (its back within 3 cm, plus what swings behind it)
import { chromium } from "playwright";
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage(); await p.goto("http://localhost:8794/lab/manor/index.html?webgl=1" + (process.env.QS || ""), { timeout: 300000 }); await p.waitForFunction(() => window.__ok, null, { timeout: 300000 });
const r = await p.evaluate(() => { const bad = [], counts = {}; for (const [id, g] of window.__manor.placements) for (const q of g.placed) { counts[q.tier] = (counts[q.tier] || 0) + 1;
  if (q.wall && !q.inHearth && q.d > 0.03 && !q.sweep) bad.push(`${id} ${q.kind} d=${q.d}`); } return { bad, counts,
  study: window.__manor.placements.get("study")?.placed.map(q => `${q.kind}${q.wall ? "@" + q.wall : q.at ? "@" + q.at.map(v => v.toFixed(1)) : ""}`),
  servants: window.__manor.placements.get("servants_hall")?.placed.map(q => `${q.kind}${q.wall ? "@" + q.wall + ":" + q.r.toFixed(1) : ""}`) }; });
console.log(JSON.stringify(r, null, 1)); await b.close();
