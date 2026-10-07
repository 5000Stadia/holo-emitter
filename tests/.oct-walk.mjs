import { chromium } from "playwright";
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
await p.goto("http://localhost:8794/lab/manor/index.html?webgl=1&plan=banqueting", { timeout: 300000 }); await p.waitForFunction(() => window.__ok, null, { timeout: 300000 });
const r = await p.evaluate(() => { const W = window.__works, out = {}; const d = [...W.things.values()].find(b => b.node.userData.opening === "d1");
  const set = (open) => { if ((W.stateOf(d, "leaf") === "open") !== open) W.act({ b: d, aff: "leaf" }); W.finish?.(); };
  set(false); out.shutStops = window.__walk(10, 4.5, 10, 9, "ground").done === false;
  set(true); out.openPasses = window.__walk(10, 4.5, 10, 9, "ground").done === true;
  // into a diagonal wall: you stop a body's width off it
  const w = window.__walk(10, 10, 14, 14, "ground"); out.diagonalStops = !w.done && Math.hypot(w.x - 10, w.y - 10) < 4.25 * Math.SQRT2 && Math.hypot(w.x - 10, w.y - 10) > 3.5; out.at = w;
  out.hearthStops = window.__walk(10, 10, 10, 15, "ground").done === false;
  return out; });
console.log(JSON.stringify(r), "errors", errs.slice(0, 3)); await b.close();
