// The hillside (R46): src/make/hillside.js on its harness, lab/scale/hillside.html, on the real GPU (WebGPU through ANGLE
// on Vulkan). Builds every tile in reach, then: screenshots from eye level and raised (looking across the fields south
// of the house, at a wall gateway and along a hedge), the frame rate over 5 s, draws and triangles (renderer.info, the
// shadow pass included), ms a tile; and the walker against a wall, a hedge and a shut gate, blocked's cost a call.
//   node tests/.hillside.mjs OUTDIR [QS]          (GPU=0 for SwiftShader, which is slow and gives no frame rate)
import { chromium } from "playwright";
const [out = ".", qs = ""] = process.argv.slice(2), gpu = process.env.GPU !== "0";
const b = await chromium.launch({ args: gpu ? ["--use-angle=vulkan", "--enable-features=Vulkan", "--enable-unsafe-webgpu", "--ignore-gpu-blocklist", "--disable-gpu-vsync", "--disable-frame-rate-limit"] : ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); const errs = [];
p.on("pageerror", e => errs.push(e.message)); p.on("console", m => { if (m.type() === "error" || m.type() === "warning") errs.push(m.text().slice(0, 300)); });
const t0 = Date.now();
await p.goto(`http://localhost:8794/lab/scale/hillside.html?dpr=1${gpu ? "" : "&webgl=1"}${qs ? "&" + qs : ""}`, { timeout: 300000 });
await p.waitForFunction(() => window.__ok, null, { timeout: 300000 });
console.log("loaded", Date.now() - t0, "ms;", JSON.stringify(await p.evaluate(() => window.__stats())));
await p.evaluate(() => document.getElementById("hud").hidden = true);

// the poses: a few fixed, and two found from the layout (a wall's gateway, a hedge) near x 30, y -100 … -300
const found = await p.evaluate(() => { const lay = window.__hill.layout, site = window.__site, lines = [];
  for (let i = -2; i <= 2; i++) for (let j = -4; j <= -1; j++) lines.push(...lay.tileItems(i, j).lines);
  const d = (L, x, y) => Math.hypot((L.a[0] + L.b[0]) / 2 - x, (L.a[1] + L.b[1]) / 2 - y);
  const gate = lines.filter(L => L.gate && L.kind === "wall").sort((a, b) => d(a, 30, -200) - d(b, 30, -200))[0];
  const hedge = lines.filter(L => L.kind === "hedge").sort((a, b) => d(a, 30, -150) - d(b, 30, -150))[0];
  const hedgeGate = lines.filter(L => L.gate && L.kind === "hedge").sort((a, b) => d(a, 30, -200) - d(b, 30, -200))[0];
  // stand 7 m off a gateway's middle, square to it, looking at it
  const facing = (L) => { const [A, B] = L.gate.open, mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2, nx = -L.uy, ny = L.ux, x = mx + nx * 7, y = my + ny * 7;
    return { x, y, yaw: Math.atan2(nx, -ny) * 180 / Math.PI, mid: [mx, my], n: [nx, ny] }; };   // forward (-sin yaw, cos yaw) = -n
  // along a hedge: from 4 m off one end's side, looking down its length
  const R = hedge.runs[0], hx = R.x[0] - hedge.ux * 3 - hedge.uy * 4, hy = R.y[0] - hedge.uy * 3 + hedge.ux * 4, f = [hedge.ux, hedge.uy];
  return { gate: gate && { key: gate.key, ...facing(gate) }, hedgeGate: hedgeGate && { key: hedgeGate.key, ...facing(hedgeGate) }, hedge: { key: hedge.key, x: hx, y: hy, yaw: Math.atan2(-f[0], f[1]) * 180 / Math.PI } };
});
console.log("found", JSON.stringify(found));
const poses = [
  ["eye-south", "eye", 30, -100, 180, -2],
  ["eye-southeast", "eye", 30, -200, 215, -1],
  ["eye-southwest", "eye", 30, -300, 150, -1],
  ["gate", "eye", found.gate.x, found.gate.y, found.gate.yaw, -6],
  ["hedge-gate", "eye", found.hedgeGate.x, found.hedgeGate.y, found.hedgeGate.yaw, -6],
  ["hedge", "eye", found.hedge.x, found.hedge.y, found.hedge.yaw, -3],
  ["raised-south", "cam", 30, -100, 40, 180, -14],
  ["raised-north", "cam", 30, -300, 70, 0, -12],
];
for (const [name, kind, ...v] of poses) {
  await p.evaluate(([kind, v]) => kind === "eye" ? window.__eye(...v) : window.__cam(...v), [kind, v]);
  const ms = await p.evaluate(() => window.__settle()); await p.waitForTimeout(600);
  await p.screenshot({ path: `${out}/hill-${name}.png` });
  const s = await p.evaluate(() => window.__stats());
  console.log(name.padEnd(14), `settle ${ms} ms ·`, `${s.calls} draws · ${(s.tris / 1e6).toFixed(2)}M tris ·`, JSON.stringify(s.hill));
}

// the frame rate: 5 s at two poses, every frame drawn
const fpsAt = async (name, kind, v) => { await p.evaluate(([kind, v]) => kind === "eye" ? window.__eye(...v) : window.__cam(...v), [kind, v]); await p.evaluate(() => window.__settle()); await p.waitForTimeout(1500);
  const r = await p.evaluate(() => new Promise(done => { const t = []; let last = performance.now(); const end = last + 5000; const f = () => { const n = performance.now(); t.push(n - last); last = n; if (n < end) requestAnimationFrame(f); else { t.sort((a, b) => a - b);
    done({ fps: Math.round(1000 / (t.reduce((a, b) => a + b, 0) / t.length)), p50_ms: +t[t.length >> 1].toFixed(2), p99_ms: +t[Math.floor(t.length * 0.99)].toFixed(2), frames: t.length }); } }; requestAnimationFrame(f); }));
  const s = await p.evaluate(() => window.__stats());
  console.log(`fps ${name}`.padEnd(22), JSON.stringify({ ...r, backend: s.backend, draws: s.calls, tris: s.tris, ratio: s.ratio }));
};
await fpsAt("eye-south", "eye", [30, -100, 180, -2]);
await fpsAt("raised-north", "cam", [30, -300, 70, 0, -12]);
// the same view without the hillside (ground, sky and sun only): what the hillside itself costs
await p.evaluate(() => { window.__hill.group.visible = false; });
await fpsAt("raised-north, bare", "cam", [30, -300, 70, 0, -12]);
await p.evaluate(() => { window.__hill.group.visible = true; });

// walking: square at a wall from 5 m off (stops short of it), at a hedge, through a shut gate; then blocked's cost
const walks = await p.evaluate((F) => { const lay = window.__hill.layout, out = {};
  const into = (L, s, dist) => { const p = L.at(s), nx = -L.uy, ny = L.ux; return window.__walk(p[0] + nx * dist, p[1] + ny * dist, p[0] - nx * dist, p[1] - ny * dist); };
  const lines = []; for (let i = -2; i <= 2; i++) for (let j = -4; j <= -1; j++) lines.push(...lay.tileItems(i, j).lines);
  const wall = lines.find(L => L.kind === "wall" && L.len > 40), hedge = lines.find(L => L.kind === "hedge" && L.len > 40), gate = lines.find(L => L.key === F.gate.key);
  const offOf = (L, r) => { const p = L.at(L.len * 0.37), nx = -L.uy, ny = L.ux; return +Math.abs((r.x - p[0]) * nx + (r.y - p[1]) * ny).toFixed(2); };
  const w = into(wall, wall.len * 0.37, 5), h = into(hedge, hedge.len * 0.37, 5), g = into(gate, gate.gate.s, 5);
  out.wall = { key: wall.key, ...w, stoppedOff: offOf(wall, w) }; out.hedge = { key: hedge.key, ...h, stoppedOff: offOf(hedge, h) }; out.gate = { key: gate.key, ...g };
  // and along a field, clear of everything: should walk the whole way
  out.field = window.__walk(F.gate.x, F.gate.y, F.gate.x + F.gate.n[0] * 6, F.gate.y + F.gate.n[1] * 6);
  // blocked: a million calls on a walk's worth of points (warm cells), and the first call in a fresh cell
  const B = lay.blocked; let t = performance.now(), hits = 0; for (let k = 0; k < 1e6; k++) { if (B(F.gate.x + (k % 1000) * 0.01, F.gate.y + ((k / 1000) | 0) * 0.005, 0.22)) hits++; }
  out.blocked_us = +((performance.now() - t) / 1e3).toFixed(3); out.hits = hits;
  t = performance.now(); for (let k = 0; k < 200; k++) B(5000 + k * 8, 5000, 0.22); out.cold_cell_us = +((performance.now() - t) / 200 * 1000).toFixed(1);
  return out; }, found);
console.log("walks", JSON.stringify(walks));

// a frame's update when nothing is to build (standing, then a step each call); then streaming: jumps of 2-3 km, each
// a fresh reach of tiles built at the page's per-frame budget (4 ms), counting frames, and the cache trimmed behind
const idle = await p.evaluate(() => { const h = window.__hill; let t = performance.now(); for (let k = 0; k < 2000; k++) h.update(30, -100, 4); const still = (performance.now() - t) / 2000 * 1000;
  t = performance.now(); for (let k = 0; k < 2000; k++) h.update(30 + k * 0.02, -100, 4); const walking = (performance.now() - t) / 2000 * 1000;
  return { still_us: +still.toFixed(1), walking_us: +walking.toFixed(1) }; });
console.log("update", JSON.stringify(idle));
// (the camera goes too: the page's own loop updates the hillside where the camera is, at 4 ms a frame; the slowest
// frame while it builds is counted, as is the slowest single update)
for (const [x, y] of [[2500, 1500], [-2000, -2500], [30, -100]]) {
  const r = await p.evaluate(([x, y]) => new Promise(done => { const h = window.__hill, upd = h.update; let worst = 0, frames = 0, gap = 0, last = performance.now();
    h.update = (...a) => { const t = performance.now(), r = upd(...a); worst = Math.max(worst, performance.now() - t); return r; };
    const b0 = h.stats().built, t0 = performance.now(); window.__cam(x, y, window.__site.z(x, y) + 2, 0, 0);
    const f = () => { const n = performance.now(); gap = Math.max(gap, n - last); last = n; frames++; const s = h.stats();
      if ((frames < 5 || s.queued) && frames < 3000) requestAnimationFrame(f);
      else { h.update = upd; done({ frames, s: +((n - t0) / 1000).toFixed(2), worstUpdateMs: +worst.toFixed(1), worstFrameMs: +gap.toFixed(1), newTiles: s.built.near + s.built.far - b0.near - b0.far, ...s }); } };
    requestAnimationFrame(f); }), [x, y]);
  console.log(`stream to ${x},${y}`.padEnd(22), JSON.stringify(r));
}
console.log("errors", JSON.stringify(errs.slice(0, 8)));
await b.close();
