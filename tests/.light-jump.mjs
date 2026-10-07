// the light rig a step either side of a doorway (every door open, as a walk leaves them): what changes as you cross
import { chromium } from "playwright";
const OUT = process.env.OUT || "/tmp/claude-1000/-home-k-Projects-holo-emitter/97770d23-8695-4407-9f5e-30bf8e241f72/scratchpad";
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 640, height: 400 } });
await p.goto("http://localhost:8794/lab/manor/index.html?webgl=1" + (process.env.QS || ""), { timeout: 300000 });
await p.waitForFunction(() => window.__ok, null, { timeout: 300000 });
await p.evaluate(() => document.querySelectorAll("#keys,#gate,#where,#line").forEach(e => e.style.display = "none"));
const [A, B] = (process.argv[2] || "kitchen_passage,kitchen").split(",");
const g = await p.evaluate(([A, B, all]) => { const P = window.__plan, W = window.__works;
  const o = P.openings.find(o => o.joins.includes(A) && o.joins.includes(B));
  for (const b of W.things.values()) if ((all || b.node.userData.opening === o.id) && b.node.userData.opening && W.stateOf(b, "leaf") !== "open") W.act({ b, aff: "leaf" });
  W.finish?.(); const R = o.rect, ew = o.axis === "EW", ra = P.rooms.find(q => q.id === A).rect;
  // from A's side into B: the step direction
  const cx = (R.x0 + R.x1) / 2, cy = (R.y0 + R.y1) / 2, s = ew ? Math.sign(((ra.x0 + ra.x1) / 2) - cx) : Math.sign(((ra.y0 + ra.y1) / 2) - cy);
  return { id: o.id, cx, cy, ew, s, floor: o.floor, T: ew ? R.x1 - R.x0 : R.y1 - R.y0 }; }, [A, B, !process.env.ONE]);
const yaw = g.ew ? (g.s > 0 ? -90 : 90) : (g.s > 0 ? 180 : 0);   // facing from A into B
const at = (d) => [g.ew ? g.cx + g.s * d : g.cx, g.ew ? g.cy : g.cy + g.s * d];
await p.evaluate(([[x, y], yaw, f]) => window.__place(x, y, yaw, -8, f), [at(g.T / 2 + 0.6), yaw, g.floor]);
await p.waitForTimeout(1500);
const show = async (n) => { const L = await p.evaluate(() => ({ room: document.querySelector("#where .n").textContent, ...window.__lights() }));
  console.log(n, L.room, "windows", JSON.stringify(L.windows.map(w => w && `${w.room}#${w.key}@${w.level}`)), "fires", JSON.stringify(L.fires.map(f => f && `${f.room}@${f.level}`))); return L; };
const a = await show("before");
await p.screenshot({ timeout: 120000, path: `${OUT}/jump-a.png` });
// walk through the doorway, as a player does, sampling as you go
for (let k = 1; k <= 12; k++) { await p.evaluate(([[x, y], yaw, f]) => window.__place(x, y, yaw, -8, f, true), [at(g.T / 2 + 0.6 - k * (g.T + 1.2) / 12), yaw, g.floor]); await p.waitForTimeout(120); if (k % 2 === 0) await show("  step " + k); }
await p.waitForTimeout(1500);
const b2 = await show("after");
await p.screenshot({ timeout: 120000, path: `${OUT}/jump-b.png` });
const ka = new Set(a.windows.filter(Boolean).map(w => w.key)), kb = new Set(b2.windows.filter(Boolean).map(w => w.key));
console.log("windows kept", [...ka].filter(k => kb.has(k)).length, "of", ka.size, "; changed", [...kb].filter(k => !ka.has(k)).length);
await b.close();
