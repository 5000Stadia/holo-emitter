// The London street c.1660 (R46's street package, src/make/street.js, lab/scale/street.html): screenshots from the
// street, frame rate over 5 s on WebGPU, draws and triangles, build timings, and the same street from blocks built in
// another order. node tests/.street.mjs OUTDIR [QS]   (NOVSYNC=1 measures past the display's rate; WEBGL=1 the fallback)
import { chromium } from "playwright";
import fs from "node:fs";
const out = process.argv[2] || "/tmp/street", qs = process.argv[3] || "";
fs.mkdirSync(out, { recursive: true });
const args = ["--use-angle=vulkan", "--enable-features=Vulkan", "--enable-unsafe-webgpu", "--ignore-gpu-blocklist", ...(process.env.NOVSYNC ? ["--disable-gpu-vsync", "--disable-frame-rate-limit"] : [])];
const b = await chromium.launch({ args, headless: true });
const base = `http://localhost:8794/lab/scale/street.html?dpr=1&${process.env.WEBGL ? "webgl=1" : "webgpu=1"}${qs ? "&" + qs : ""}`;
async function open(extra = "") {
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } }), errs = [];
  p.on("pageerror", e => errs.push(e.message)); p.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
  await p.goto(base + extra, { timeout: 180000 }); try { await p.waitForFunction(() => window.__ok, null, { timeout: 180000 }); } catch (e) { console.log("never ready", JSON.stringify(errs.slice(0, 5))); throw e; }
  await p.evaluate(() => document.getElementById("hud").hidden = true);
  return { p, errs };
}
const { p, errs } = await open();
const S = await p.evaluate(() => window.__stats());
console.log("backend", S.backend, "marks", JSON.stringify(S.marks));
console.log("street", JSON.stringify({ ...S.street, ms: undefined }));
console.log("build ms", JSON.stringify(S.street.ms));
// the views, from the street's own lots: eye level down the street both ways; up at a jettied front; raised; a lane's
// mouth; an inn; a sign seen along the street
const views = await p.evaluate(() => {
  const st = window.__street, L = st.plan.spine.length, F = st.frame, V = {}, eye = (s, t, dz = 1.6) => { const f = F(s, t); return [f.x, f.y, f.z + dz]; };
  const look = (from, to) => [from[0], from[1], from[2], Math.atan2(-(to[0] - from[0]), to[1] - from[1]) * 180 / Math.PI, Math.atan2(to[2] - from[2], Math.hypot(to[0] - from[0], to[1] - from[1])) * 180 / Math.PI];
  const mid = (l, d = 0, z = 0) => { const { A, B, mA, mB } = l.frame, m = [(mA[0] + mB[0]) / 2, (mA[1] + mB[1]) / 2]; return [(A[0] + B[0]) / 2 + m[0] * d, (A[1] + B[1]) / 2 + m[1] * d, l.floor + z]; };
  { const f = F(14, -1.0); V.eye = [f.x, f.y, f.z + 1.6, f.yaw, 2]; }
  { const f = F(L - 12, 1.0); V.back = [f.x, f.y, f.z + 1.6, f.yaw + 180, 2]; }
  const tall = st.lots.filter(l => l.side === "L" && (l.jetty === "double" || l.jetty === "every") && l.storeys.length >= 3 && l.s0 > 35 && l.s1 < L - 35).sort((a, b) => b.storeys.length - a.storeys.length)[0];
  if (tall) { const s = (tall.s0 + tall.s1) / 2, from = eye(s - 3.2, st.plan.half - 2.6), to = mid(tall, -0.6, tall.storeys[1].z + 3.2); V.jetty = look(from, to); V.jetty_lot = tall.id; }
  { const f = F(6, 0); V.raised = [f.x, f.y, f.z + 24, f.yaw, -24]; }
  { const f = F(L * 0.38, -30), g = F(L * 0.52, 3); V.over = look([f.x, f.y, f.z + 22], [g.x, g.y, g.z + 2]); }
  const lane = st.lots.find(l => l.kind === "lane" && l.s0 > 20 && l.s1 < L - 20);
  if (lane) { const s = (lane.s0 + lane.s1) / 2, sg = lane.side === "L" ? 1 : -1, from = eye(s, -sg * 3.2), to = mid(lane, 6, 1.4); V.lane = look(from, to); V.lane_lot = lane.id; }
  const inn = st.lots.find(l => l.kind === "inn" && l.s0 > 8 && l.s1 < L - 8);
  if (inn) { const s = (inn.s0 + inn.s1) / 2, sg = inn.side === "L" ? 1 : -1, from = eye(s - 4, -sg * 3.6), to = mid(inn, 0, 4.2); V.inn = look(from, to); V.inn_lot = inn.id; }
  const signed = st.lots.filter(l => l.sign && l.side === "R" && l.s0 > 30 && l.s1 < L - 30)[0];
  if (signed) { const s = (signed.s0 + signed.s1) / 2, from = eye(s - 9, -2.4, 1.6), to = mid(signed, -1.4, signed.storeys[1].z + 0.2); V.sign = look(from, to); V.sign_lot = signed.id; }
  return V;
});
console.log("views", JSON.stringify(Object.fromEntries(Object.entries(views).filter(([k]) => k.endsWith("_lot")))));
for (const [name, cam] of Object.entries(views)) { if (name.endsWith("_lot")) continue;
  await p.evaluate((c) => { window.__freeCam = c; }, cam); await p.waitForTimeout(900); await p.screenshot({ path: `${out}/street-${name}.png` }); }
const walks = await p.evaluate(() => { const st = window.__street, L = st.plan.spine.length, half = st.plan.half, F = st.frame, out = {};
  const house = st.lots.find(l => l.kind === "house" && l.side === "L" && !l.ground.shop && l.s0 > 20) || st.lots.find(l => l.kind === "house" && l.side === "L" && l.s0 > 20), sm = (house.s0 + house.s1) / 2;
  { const a = F(sm, 0), b = F(sm, half + 3); out.front = { ...window.__walk(a.x, a.y, b.x, b.y), expect: `stops ${house.ground.shop ? "at the stall board" : "at the front"} (~${(half - (house.ground.shop ? 0.82 : 0) - 0.22).toFixed(2)} m)` }; }
  { const i = st.posts.findIndex(p => p.side === "L" && p.s > 30), p0 = st.posts[i], prev = st.posts[i - 1], s0 = prev && prev.side === "L" ? (prev.s + p0.s) / 2 : p0.s - 1.6, a = F(s0, half - 1.75), b = F(p0.s + 3, half - 1.75);
    out.post = { ...window.__walk(a.x, a.y, b.x, b.y), expect: `stops at the post (~${(p0.s - s0 - p0.r - 0.22).toFixed(2)} m)` }; }
  const lane = st.lots.find(l => l.kind === "lane"); if (lane) { const sm2 = (lane.s0 + lane.s1) / 2, sg = lane.side === "L" ? 1 : -1, a = F(sm2, 0), b = F(sm2, sg * (half + lane.depth - 1)); out.lane = { ...window.__walk(a.x, a.y, b.x, b.y), expect: `walks ${(half + lane.depth - 1).toFixed(1)} m in` }; }
  const inn = st.lots.find(l => l.kind === "inn"); if (inn) { const sg = inn.side === "L" ? 1 : -1, u = (inn.ground.arch[0] + inn.ground.arch[1]) / 2, f = u / inn.width, sm3 = inn.side === "L" ? inn.s0 + (inn.s1 - inn.s0) * f : inn.s1 - (inn.s1 - inn.s0) * f, a = F(sm3, 0), b = F(sm3, sg * (half + inn.depth + 6));
    out.arch = { ...window.__walk(a.x, a.y, b.x, b.y), expect: `through the arch into the yard (${(half + inn.depth + 6).toFixed(1)} m)` }; }
  return out; });
for (const [k, v] of Object.entries(walks)) console.log(`walk ${k}`, JSON.stringify(v));
// faces that fight: the project's own check (src/make/coplanar.js) over every merged mesh, a diagnostic here
const fights = await p.evaluate(async () => { const { coplanar } = await import("/src/make/coplanar.js"), meshes = [];
  window.__street.group.traverse(o => { if (!o.isMesh || o.isInstancedMesh) return; const g = o.geometry, pos = g.attributes.position.array, idx = g.index.array, tris = new Float32Array(idx.length * 3);
    for (let i = 0; i < idx.length; i++) { const j = idx[i] * 3; tris[i * 3] = pos[j]; tris[i * 3 + 1] = pos[j + 1]; tris[i * 3 + 2] = pos[j + 2]; } meshes.push({ key: o.name, tris }); });
  const t0 = performance.now(), pairs = coplanar(meshes), ms = Math.round(performance.now() - t0), by = new Map();
  for (const q of pairs) { const k = `${q.a.split("/").pop()}~${q.b.split("/").pop()}`, e = by.get(k) || { pair: k, n: 0, area: 0, at: q.at.map(v => +v.toFixed(2)) }; e.n++; e.area += q.area; by.set(k, e); }
  return { meshes: meshes.length, pairs: pairs.length, ms, groups: [...by.values()].sort((a, b) => b.area - a.area).slice(0, 8).map(e => ({ ...e, area: +e.area.toFixed(3) })) }; });
console.log("coplanar", JSON.stringify(fights));
// frame rate: 5 s drawing every frame at eye level, then the raised view
for (const name of ["eye", "raised"]) { await p.evaluate((c) => { window.__freeCam = c; window.__spin = true; }, views[name]); await p.waitForTimeout(1200);
  const r = await p.evaluate(() => new Promise(done => { const t = []; let last = performance.now(); const end = last + 5000;
    const f = () => { const n = performance.now(); t.push(n - last); last = n; if (n < end) requestAnimationFrame(f); else { t.sort((a, b) => a - b); const s = window.__stats();
      done({ fps: Math.round(1000 / (t.reduce((a, b) => a + b, 0) / t.length)), p50_ms: +t[t.length >> 1].toFixed(2), p99_ms: +t[Math.floor(t.length * 0.99)].toFixed(2), draws: s.calls, tris: s.tris }); } };
    requestAnimationFrame(f); }));
  console.log(`fps ${name}`, JSON.stringify(r)); }
{ const sky = [...views.eye]; sky[4] = 80; await p.evaluate((c) => { window.__freeCam = c; }, sky); await p.waitForTimeout(500); const s2 = await p.evaluate(() => window.__stats()); console.log("looking up", JSON.stringify({ draws: s2.calls, tris: s2.tris })); }
await p.close();
// the same street from its blocks built in other orders (one page at a time)
const d0 = S.digest, all = [...errs], other = [];
for (const order of ["reverse", "shuffle"]) { const o = await open(`&order=${order}`); other.push((await o.p.evaluate(() => window.__stats())).digest); all.push(...o.errs); await o.p.close(); }
console.log("same in any order", other.every(d => d === d0), d0.slice(0, 40));
console.log("errors", JSON.stringify(all.slice(0, 8)));
await b.close();
