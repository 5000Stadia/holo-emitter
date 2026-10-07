import { chromium } from "playwright";
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 800, height: 500 } });
const errs = []; p.on("pageerror", e => errs.push(e.message)); p.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
await p.goto("http://localhost:8794/lab/manor/index.html?webgl=1&nofurn=1" + (process.env.QS || ""), { timeout: 300000 });
await p.waitForFunction(() => window.__ok, null, { timeout: 300000 });
const r = await p.evaluate(() => { const m = window.__manor, T = window.__THREE; let solid; m.scene.traverse(o => { if (o.userData.carve) solid = o; });
  const g = solid.geometry, P = g.attributes.position, n = P.count / 3;
  // every face looks out of the solid: a point just off its middle, along its normal, is not inside the carve
  const at = (x, y, z) => { const Z = Math.round(z * 1000), band = m.carved.bands.find(q => q.z0 <= Z && q.z1 > Z); if (!band) return false; let w = 0;
    for (const ring of band.paths) { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const a = ring[i], bb = ring[j]; if ((a.y > y * 1000) !== (bb.y > y * 1000) && x * 1000 < (bb.x - a.x) * (y * 1000 - a.y) / (bb.y - a.y) + a.x) c = !c; }
      if (c) { let A = 0; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) A += (ring[j].x - ring[i].x) * (ring[j].y + ring[i].y); w += A > 0 ? 1 : -1; } } return w > 0; };
  let wrong = 0, tested = 0; const v = [0, 1, 2].map(() => new T.Vector3()), e1 = new T.Vector3(), e2 = new T.Vector3(), N = new T.Vector3(), c = new T.Vector3();
  for (let t = 0; t < n; t += Math.max(1, Math.floor(n / 4000))) { for (let k = 0; k < 3; k++) v[k].fromBufferAttribute(P, t * 3 + k);
    N.crossVectors(e1.subVectors(v[1], v[0]), e2.subVectors(v[2], v[0])); if (N.lengthSq() < 1e-12) continue; N.normalize();
    c.copy(v[0]).add(v[1]).add(v[2]).multiplyScalar(1 / 3); const out = c.clone().addScaledVector(N, 0.005), inn = c.clone().addScaledVector(N, -0.005);
    tested++; if (at(out.x, -out.z, out.y) || !at(inn.x, -inn.z, inn.y)) wrong++; }
  return { tris: n, tested, wrong, carve_ms: m.carved.ms, build_ms: m.ms }; });
console.log(JSON.stringify(r));
if (process.argv[2] === "seal") { const s = await p.evaluate(() => window.__seal()); console.log(JSON.stringify(s, null, 1)); }
console.log("errors", errs.slice(0, 6)); await b.close();
