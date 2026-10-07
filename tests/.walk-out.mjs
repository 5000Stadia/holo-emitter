// Walking out of the house (R46): from the great hall through the screens passage and the porch, onto the
// forecourt and down the drive; then back in. Each leg through a doorway's middle, on the page's own walker.
import { chromium } from "playwright";
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 400, height: 250 } }); const errs = []; p.on("pageerror", e => errs.push(e.message));
await p.goto("http://localhost:8794/lab/manor/index.html?webgl=1&nofurn=1", { timeout: 300000 }); await p.waitForFunction(() => window.__ok, null, { timeout: 300000 });
const r = await p.evaluate(() => { const P = window.__plan, W = window.__works;
  for (const b of W.things.values()) if (b.node.userData.opening && W.stateOf(b, "leaf") !== "open") W.act({ b, aff: "leaf" }); W.finish?.();
  const mid = (R) => [(R.x0 + R.x1) / 2, (R.y0 + R.y1) / 2], room = (id) => P.rooms.find(q => q.id === id), door = (a, c) => P.openings.find(o => o.joins.includes(a) && o.joins.includes(c));
  const through = (o) => { const [x, y] = mid(o.rect); return o.axis === "EW" ? [[x - 0.8, y], [x + 0.8, y]] : [[x, y + 0.8], [x, y - 0.8]]; };
  const d1 = door("great_hall", "screens_passage"), d2 = door("screens_passage", "porch"), d3 = door("porch", "forecourt"), court = room("forecourt");
  const h = mid(room("great_hall").rect), sp = mid(room("screens_passage").rect), po = mid(room("porch").rect), fc = mid(court.rect);
  const a = (o, rev) => { const t = through(o); return rev ? t.reverse() : t; };
  const out = [h, ...a(d1, true), [sp[0], d2.rect.y1 + 0.8], ...[[ (d2.rect.x0 + d2.rect.x1) / 2, d2.rect.y1 + 0.5], [(d2.rect.x0 + d2.rect.x1) / 2, d2.rect.y0 - 0.5]], po, [(d3.rect.x0 + d3.rect.x1) / 2, d3.rect.y1 + 0.3], [(d3.rect.x0 + d3.rect.x1) / 2, d3.rect.y0 - 0.6], fc, [fc[0], court.rect.y0 - 2], [fc[0], court.rect.y0 - 60]];
  const go = window.__walkPath(out, "ground");
  const back = window.__walkPath([...out].reverse(), "ground");
  return { go, back, legs: out.map(p => p.map(v => +v.toFixed(2))), d1: d1?.id, d2: d2?.id, d3: d3?.id, site: { z0: window.__site.z(fc[0], court.rect.y0 - 60) } }; });
console.log(JSON.stringify(r)); console.log("errors", errs.slice(0, 3)); await b.close();
