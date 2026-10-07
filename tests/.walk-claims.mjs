// The walker on the claim grid (R54 5c): the stairs still climb, the well and the space under a flight still stop
// you, every hearth stops you short of its mouth, a shut door stops you and an open one lets you through (the
// strongroom's iron door included: Kabe walked through it locked, 2026-10-06)
import { chromium } from "playwright";
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
await p.goto("http://localhost:8794/lab/manor/index.html?webgl=1", { timeout: 300000 }); await p.waitForFunction(() => window.__ok, null, { timeout: 300000 });
const r = await p.evaluate(() => { const W = window.__works, plan = window.__plan, out = {}, ok = (name, v) => { out[name] = v; };
  const doors = [...W.things.values()].filter(b => b.node.userData.opening), set = (b, open) => { if ((W.stateOf(b, "leaf") === "open") !== open) W.act({ b, aff: "leaf" }); W.finish?.(); };
  for (const d of doors) set(d, true);
  ok("hallToFirst", window.__walkPath([[40, 1.8], [46.6, 1.8], [48.65, 2.2], [48.65, 7.1], [46.75, 7.1], [46.75, 2.2], [49.6, 2.0]], "ground").done === true);
  ok("firstToGarret", window.__walkPath([[49.6, 2.0], [48.65, 2.2], [48.65, 7.3], [46.75, 7.3], [46.75, 2.2], [45.0, 1.7]], "first").done === true);
  ok("underStairStops", window.__walkPath([[46.6, 1.8], [46.75, 6.0]], "ground").done === false);
  ok("intoWellStops", window.__walkPath([[47.7, 2.2], [47.7, 5.0]], "first").done === false);
  ok("backStair", window.__walkPath([[7.5, 4.0], [7.5, 7.6], [1.4, 7.6], [1.4, 5.75], [2.3, 5.75], [4.9, 5.75], [4.9, 6.65], [2.3, 6.65], [1.4, 6.65], [1.4, 7.6], [7.5, 7.6], [7.5, 4.0]], "ground").done === true);
  ok("chamberDoor", window.__walkPath([[46.75, 2.2], [50.2, 2.2], [50.2, 3.5], [53, 3.5]], "first").done === true);
  // every hearth: walk straight at its fire from 2 m out; you stop at least a body's half-width short of its block
  const M = window.__manor, hb = M.blocks.filter(q => q.kind === "hearth");
  out.hearths = M.hearths.map(h => { const fx = h.at.x, fy = -h.at.z, ix = h.into.x, iy = -h.into.z, d = Math.hypot(ix - fx, iy - fy), ux = (ix - fx) / d, uy = (iy - fy) / d;
    const floor = plan.rooms.find(q => q.id === h.room).floor, w = window.__walk(fx + ux * 2, fy + uy * 2, fx, fy, floor), blk = hb.find(q => q.room === h.room);
    const gap = blk ? Math.max(blk.x0 - w.x, w.x - blk.x1, blk.y0 - w.y, w.y - blk.y1) : null;
    return { room: h.room, stopped: !w.done, gap: gap == null ? null : +gap.toFixed(2) }; });
  ok("everyHearthStops", out.hearths.every(h => h.stopped && h.gap >= 0.15));
  // each door: shut, you can't pass; open, you can (a hand either side of its middle, through it)
  // (doors onto the forecourt lead out of the house, where there is no floor yet: not walked)
  const outdoors = new Set(plan.rooms.filter(q => q.type === "open").map(q => q.id));
  out.doors = plan.openings.filter(o => o.rect && o.kind === "door" && !o.joins.some(j => outdoors.has(j))).map(o => { const R = o.rect, ew = o.axis === "EW", cx = (R.x0 + R.x1) / 2, cy = (R.y0 + R.y1) / 2;
    const [a, c] = ew ? [[R.x0 - 0.6, cy], [R.x1 + 0.6, cy]] : [[cx, R.y0 - 0.6], [cx, R.y1 + 0.6]], d = doors.find(q => q.node.userData.opening === o.id);
    if (!d) return { id: o.id, door: false, open: window.__walk(...a, ...c, o.floor).done };
    set(d, false); const shut = window.__walk(...a, ...c, o.floor).done; set(d, true); const open = window.__walk(...a, ...c, o.floor).done;
    return { id: o.id, joins: o.joins.join("|"), shut, open }; });
  ok("shutDoorsStop", out.doors.filter(d => d.door !== false).every(d => d.shut === false));
  ok("openDoorsPass", out.doors.every(d => d.open === true));
  return out; });
const fails = Object.entries(r).filter(([k, v]) => v === false).map(([k]) => k);
console.log(fails.length ? `FAIL ${fails.join(", ")}` : "all pass");
console.log("hearths", JSON.stringify(r.hearths.filter(h => !h.stopped || h.gap < 0.15)));
console.log("doors", JSON.stringify(r.doors.filter(d => d.shut !== false && d.door !== false || d.open !== true)));
console.log("errors", errs.slice(0, 4)); await b.close();
