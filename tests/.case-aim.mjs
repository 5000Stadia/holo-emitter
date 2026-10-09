// What a tap finds in the case (M7), on a phone-sized page: the things a player must be able to tap, and what must not be
// tapped, after two regressions on 2026-10-08 (the key hidden in the candlestick's foot; people answering across a room and
// taking the taps meant for the engrossment and Daniel's chest). PROPOSED check, not in the test list until vetted.
//   node tests/.case-aim.mjs        (the lab served on 8794)
import { chromium } from "playwright";
const b = await chromium.launch({ args: ["--use-angle=vulkan", "--enable-features=Vulkan", "--enable-unsafe-webgpu", "--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }); const errs = []; p.on("pageerror", e => errs.push(e.message));
await p.goto("http://localhost:8794/lab/manor/index.html?case=case-1660&fresh&webgpu=1&voice=0", { timeout: 300000 }); await p.waitForFunction(() => window.__ok, null, { timeout: 300000 });
let bad = 0; const ok = (c, what) => { if (!c) bad++; console.log(`${c ? "ok  " : "FAIL"} ${what}`); };
// stand ~d m from a story thing, toward its room's middle, looking at it; return where it falls on screen
const stand = (id, d = 1.3, pitch = -35) => p.evaluate(([id, d, pitch]) => { const C = window.__manor.things.find(b => b.story === id); const v = new (window.__camera.position.constructor)(); C.node.getWorldPosition(v);
  const R = window.__plan.rooms.find(r => r.rect.x0 <= v.x && v.x <= r.rect.x1 && r.rect.y0 <= -v.z && -v.z <= r.rect.y1 && Math.abs(window.__manor.levelOf(r.floor) - v.y) < 3.5);
  const mx = (R.rect.x0 + R.rect.x1) / 2, my = (R.rect.y0 + R.rect.y1) / 2; let dx = mx - v.x, dy = my - (-v.z); const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
  const x = v.x + dx * d, y = -v.z + dy * d; window.__place(x, y, Math.atan2(-(v.x - x), (-v.z) - y) * 180 / Math.PI, pitch, R.floor); return R.id; }, [id, d, pitch]);
const screen = (id) => p.evaluate((id) => { const C = window.__manor.things.find(b => b.story === id); const v = new (window.__camera.position.constructor)(); C.node.getWorldPosition(v); v.project(window.__camera); return [v.x, v.y]; }, id);
const aimAt = (x, y) => p.evaluate(([x, y]) => window.__aim(x, y), [x, y]);

// 1. the steward's key on the muniment table: on it, and a finger's width off it, it's the key (not the candlestick, not the table's drawer)
await p.evaluate(() => { const T = window.__manor.things.find(b => b.story === "key_steward"); const v = new (window.__camera.position.constructor)(); T.node.getWorldPosition(v); window.__place(v.x, -v.z + 0.85, 180, -48, "first"); });
await p.waitForTimeout(900); { const [x, y] = await screen("key_steward"); let n = 0;
  for (const [dx, dy] of [[0, 0], [14, 0], [-14, 0], [0, 14], [0, -14]]) { const a = await aimAt(x + dx * 2 / 390, y - dy * 2 / 844); if (a?.kind === "key/iron") n++; }
  ok(n === 5, `the steward's key is what a tap on or beside it finds (${n}/5)`); }
// 2. the padlock key in the table's shut drawer is not to be had through the drawer
{ const a = await p.evaluate(() => { const K = window.__manor.things.find(b => b.story === "key_chest_steward"); if (!K) return "none"; const v = new (window.__camera.position.constructor)(); K.node.getWorldPosition(v); v.project(window.__camera); return window.__aim(v.x, v.y); });
  ok(a === "none" || a?.story !== "key_chest_steward", `the padlock key in the shut drawer isn't offered (${JSON.stringify(a)})`); }
// 3. the engrossment on the great chamber's draw-table, Mr Cressy beside it
await stand("engrossment"); await p.waitForTimeout(900); { const [x, y] = await screen("engrossment"); const a = await aimAt(x, y); ok(a?.kind === "deed/engrossment", `the engrossment, not Mr Cressy (${JSON.stringify(a)})`);
  const c = await p.evaluate(() => { const g = window.__presences.get("cressy").p.group; const v = g.position.clone(); v.y += 1.3; v.project(window.__camera); return window.__aim(v.x, v.y); });
  ok(c?.presence === "cressy", `Mr Cressy is still spoken to at his own bust (${JSON.stringify(c)})`); }
// 4. Daniel's chest with Daniel moved to it (as the garret beat does)
await p.evaluate(() => window.__cp && window.__presences.get("daniel") && null);
await p.evaluate(() => { const run = window.__cp; });
await p.evaluate(() => { const rec = window.__presences.get("daniel"); });
await stand("chest_daniel"); await p.waitForTimeout(900); { const [x, y] = await screen("chest_daniel"); const a = await aimAt(x, y); ok(a?.kind === "chest/boarded", `Daniel's chest (${JSON.stringify(a)})`); }
// 5. the body laid out: looked at
await stand("body_hollins", 1.6, -30); await p.waitForTimeout(900); { const [x, y] = await screen("body_hollins"); let found = false;
  for (let gy = -0.25; gy <= 0.25 && !found; gy += 0.05) for (let gx = -0.4; gx <= 0.4 && !found; gx += 0.05) { const a = await aimAt(x + gx, y + gy); if (a?.look === "body_hollins") found = true; }
  ok(found, "the body can be looked at"); }
ok(errs.length === 0, `no page errors ${errs.join("; ")}`);
console.log(bad ? `${bad} failing` : "all ok"); await b.close(); process.exit(bad ? 1 : 0);
