// Look through a doorway, its door open: what the far room shows (Kabe: "Great stair first floor looking through
// door to great chamber first floor is a black nothing until enter"). Usage: node tests/.see-through.mjs out.png x y yawDeg floor
import { chromium } from "playwright";
const [out, x, y, yaw, floor] = process.argv.slice(2);
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 800, height: 500 } });
await p.goto("http://localhost:8794/lab/manor/index.html?webgl=1" + (process.env.QS || ""), { timeout: 300000 }); await p.waitForFunction(() => window.__ok, null, { timeout: 300000 });
await p.evaluate(() => document.querySelectorAll("#keys,#gate,#where").forEach(e => e.style.display = "none"));
const info = await p.evaluate(([x, y, yaw, floor]) => { const W = window.__works; for (const b of W.things.values()) if (b.node.userData.opening && W.stateOf(b, "leaf") !== "open") W.act({ b, aff: "leaf" }); W.finish?.();
  window.__place(+x, +y, +yaw, 0, floor); return null; }, [x, y, yaw, floor]);
if (process.env.AMB) await p.evaluate(() => { const T = window.__THREE; window.__scene.add(new T.AmbientLight(0xffffff, 2.5)); });
await p.waitForTimeout(2500);
const vis = await p.evaluate(([x, y, floor]) => { const T = window.__THREE, M = window.__manor, rc = new T.Raycaster(), P = new T.Vector3(+x, M.levelOf(floor) + 1.6, -(+y)), meshes = [];
  window.__scene.traverse(o => { if (o.isMesh && o.visible && !o.material?.transparent) { let v = true, q = o; while (q) { if (!q.visible) v = false; q = q.parent; } if (v) meshes.push(o); } });
  rc.set(P, new T.Vector3(1, 0, 0)); const h = rc.intersectObjects(meshes, false).slice(0, 4).map(i => `${i.distance.toFixed(2)} ${i.object.userData?.instance || i.object.material?.userData?.cls || i.object.name || "?"} room:${(() => { let q = i.object; while (q && !q.userData.room) q = q.parent; return q?.userData.room; })()}`);
  return { visible: window.__visible(), hits: h }; }, [x, y, floor]);
await p.screenshot({ path: out, timeout: 120000 }); console.log(JSON.stringify(vis)); await b.close();
