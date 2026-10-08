// The manor's case played through the real page at a phone's viewport, by taps, after the vertex arrays are let go
// (src/make/geodrop.js), to compare with ?geodrop=0: Dame Anne talked to, the muniment table's key and candlestick,
// Daniel's chest opened and reached into, the body looked at, the great chamber's door opened and walked through, a
// double tap's teleport onto a floor and at a wall, the forecourt's gates, out onto the ground and the hillside; which
// rooms show at each stop; a screenshot of each. Prints one JSON line per step.
//   node tests/.geodrop-play.mjs [baseurl] [extra query] [outdir]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const BASE = process.argv[2] || "http://localhost:8794", EXTRA = process.argv[3] || "", OUT = process.argv[4] || "/tmp/geodrop-play";
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ args: ["--use-angle=vulkan", "--enable-features=Vulkan", "--enable-unsafe-webgpu", "--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 }), p = await ctx.newPage();
const errs = []; p.on("pageerror", e => errs.push(e.message)); p.on("console", m => { if (m.type() === "error" || /geodrop/.test(m.text())) errs.push(m.text()); });
await p.goto(`${BASE}/lab/manor/index.html?case=case-1660&fresh&voice=0${EXTRA}`, { timeout: 300000 });
await p.waitForFunction(() => window.__ok && window.__cp, null, { timeout: 300000 });
await p.waitForFunction(() => { const w = window.__warm?.(); return !w || w.left === 0; }, null, { timeout: 90000 }).catch(() => {});
await p.waitForTimeout(3500);
const raf = (n = 3) => p.evaluate((n) => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
await p.evaluate(() => {
  const THREE = window.__THREE, M = window.__manor;
  window.__T = {
    thing: (story) => M.things.find(b => b.story === story),
    center(b) { const bb = new THREE.Box3().setFromObject(b.node), c = bb.getCenter(new THREE.Vector3()); return [c.x, -c.z, c.y, bb.max.y]; },
    standable: (x, y, floor) => window.__walkPath([[x, y], [x + 0.002, y]], floor).done,
    // places round a point to stand at, nearest first, each facing the point
    around(x, y, z, floor, rs = [0.8, 1.0, 1.25, 1.5, 1.8]) { const out = [], lv = M.levelOf(floor);
      for (const r of rs) for (let k = 0; k < 24; k++) { const a = k * Math.PI / 12, sx = x + Math.cos(a) * r, sy = y + Math.sin(a) * r; if (!this.standable(sx, sy, floor)) continue;
        const yaw = Math.atan2(-(x - sx), y - sy) * 180 / Math.PI, pitch = Math.atan2(z - (lv + 1.6), r) * 180 / Math.PI; out.push([+sx.toFixed(3), +sy.toFixed(3), +yaw.toFixed(2), +pitch.toFixed(2)]); }
      return out; },
    // a mesh's arrays: let go or not (normals), for the record
    state(b) { let n = 0, d = 0; b.node.traverse(o => { if (o.isMesh && o.geometry.attributes.normal) { n++; if (o.geometry.attributes.normal.array.length === 0) d++; } }); return `${d}/${n} let go`; },
    room: () => document.querySelector("#where .n")?.textContent,
    cam: () => { const c = window.__camera.position; return [+c.x.toFixed(2), +(-c.z).toFixed(2), +c.y.toFixed(2)]; },
  };
});
const log = (step, o) => console.log(JSON.stringify({ step, ...o }));
const said = () => p.evaluate(() => window.__said.length);
const saidSince = (n) => p.evaluate((n) => window.__said.slice(n), n);
const shot = (name) => p.screenshot({ path: `${OUT}/${name}.png` });
const tap = async (x = 195, y = 422) => { await p.touchscreen.tap(x, y); await p.waitForTimeout(800); await raf(); };
const dtap = async (x = 195, y = 422) => { await p.touchscreen.tap(x, y); await p.waitForTimeout(90); await p.touchscreen.tap(x, y); await p.waitForTimeout(600); await raf(); };
const place = async (x, y, yaw, pitch, floor) => { await p.evaluate(([x, y, yaw, pitch, floor]) => window.__place(x, y, yaw, pitch, floor), [x, y, yaw, pitch, floor]); await raf(4); await p.waitForTimeout(250); };
const visible = () => p.evaluate(() => window.__visible().sort().join(","));
// stand in sight of a thing (the aim at the screen's middle finds it), then tap it
async function tapThing(story, floor, want, name, taps = 1) {
  const [x, y, z] = await p.evaluate((s) => window.__T.center(window.__T.thing(s)), story);
  const spots = await p.evaluate(([x, y, z, f]) => window.__T.around(x, y, z, f), [x, y, z, floor]);
  let at = null;
  for (const s of spots) { await place(s[0], s[1], s[2], s[3], floor); const a = await p.evaluate(() => window.__aim(0, 0)); if (a && want(a)) { at = s; break; } }
  const state = await p.evaluate((s) => window.__T.state(window.__T.thing(s)), story);
  if (!at) { log(name, { story, found: false, state, tried: spots.length }); return false; }
  const aim = await p.evaluate(() => window.__aim(0, 0)), n0 = await said(), res = [];
  for (let k = 0; k < taps; k++) { await tap(); res.push(await saidSince(n0)); }
  await shot(name);
  log(name, { story, at, aim, state, said: res.at(-1), room: await p.evaluate(() => window.__T.room()), visible: await visible(),
    cp: await p.evaluate(() => ({ talking: window.__cp.talking(), clues: window.__cp.notebookView().clues.length })) });
  for (let k = 0; k < 3 && await p.evaluate(() => !!document.querySelector(".tp-sheet.on")); k++) { await p.keyboard.press("Escape"); await p.waitForTimeout(400); }   // a paper read, closed
  return true;
}
const st = await p.evaluate(() => ({ drop: window.__geodrop?.() || null, flags: window.__eng.flags }));
log("start", { ...st, room: await p.evaluate(() => window.__T.room()), visible: await visible(), cam: await p.evaluate(() => window.__T.cam()) });

// 1. Dame Anne, in the hall, faced at the start: a tap on her opens the talk panel
await shot("01-anne");
{ const a = await p.evaluate(() => window.__aim(0, 0)); await tap(); await p.waitForTimeout(500);
  log("anne", { aim: a, talking: await p.evaluate(() => window.__cp.talking()), panel: await p.evaluate(() => !!document.querySelector(".tp-sheet.on")) }); await shot("01-anne-talk");
  await p.keyboard.press("Escape"); await p.waitForTimeout(400); await p.keyboard.press("Escape"); await p.waitForTimeout(400); }

// 2. the muniment table: its door unlocked and opened (the case's own way to it is a key; set here), the key, the candlestick
await p.evaluate(() => { const W = window.__works, d = [...W.things.values()].find(b => b.node.userData.opening === "d21");
  for (const aff of Object.keys(d.kind.affordances)) if (aff !== "leaf") W.set(d, aff, null, "unlocked"); W.set(d, "leaf", null, "open"); W.finish?.(); });
await tapThing("key_steward", "first", (a) => a.kind === "key/iron", "02-key", 2);
await tapThing("desk1_candle", "first", (a) => /candle/.test(a.kind || "") || a.look === "desk1_candle", "03-candlestick", 1);

// 3. Daniel's chest: opened, and reached into
await tapThing("chest_daniel", "garret", (a) => a.kind === "chest/boarded", "04-chest", 3);

// 4. the body in the steward's chamber
await tapThing("body_hollins", "first", (a) => a.look === "body_hollins", "05-body", 1);

// 5. the great chamber's door to the withdrawing chamber: tapped open, walked through
{ const o = await p.evaluate(() => { const P = window.__plan, o = P.openings.find(q => q.id === "d18"), g = P.rooms.find(r => r.id === "great_chamber"), w = P.rooms.find(r => r.id === "withdrawing_chamber");
    return { o: o.rect, gc: g.rect, wd: w.rect, wname: w.name }; });
  const cx = (o.o.x0 + o.o.x1) / 2, cy = (o.o.y0 + o.o.y1) / 2, north = o.wd.y0 >= o.gc.y1 - 0.01;     // the withdrawing chamber north of the great chamber?
  const sy = north ? cy - 1.4 : cy + 1.4, yaw = north ? 0 : 180;
  await place(cx, sy, yaw, -8, "first"); await shot("06-door-shut");
  const a = await p.evaluate(() => window.__aim(0, 0)), n0 = await said(); await tap(); await p.waitForTimeout(1500);
  const leaf = await p.evaluate(() => { const W = window.__works, d = [...W.things.values()].find(b => b.node.userData.opening === "d18"); return W.stateOf(d, "leaf"); });
  await shot("06-door-open");
  await p.keyboard.down("KeyW"); await p.waitForTimeout(2600); await p.keyboard.up("KeyW"); await raf(4); await p.waitForTimeout(300);
  await shot("07-through");
  log("door", { aim: a, said: await saidSince(n0), leaf, room: await p.evaluate(() => window.__T.room()), want: o.wname, cam: await p.evaluate(() => window.__T.cam()), visible: await visible() }); }

// 6. a double tap: onto the floor ahead, then at a wall
{ await place(53.5, 3.55, 0, -30, "first"); await raf(); const c0 = await p.evaluate(() => window.__T.cam()); await dtap();
  const c1 = await p.evaluate(() => window.__T.cam()); await shot("08-teleport-floor");
  await place(53.5, 3.55, 90, 0, "first"); await dtap(); const c2 = await p.evaluate(() => window.__T.cam()); await shot("09-teleport-wall");
  log("teleport", { from: c0, floor: c1, wall: c2, room: await p.evaluate(() => window.__T.room()), visible: await visible() }); }

// 7. outside: the forecourt's gates tapped open, a double tap out through them onto the ground, the hillside
{ const L = await p.evaluate(() => window.__fc.line);
  const gx = (L.gate0 + L.gate1) / 2;
  await place(gx, L.yF + 2.2, 180, -6, "ground"); await shot("10-gates-shut");
  const a = await p.evaluate(() => window.__aim(0, 0)), n0 = await said(); await tap(); await p.waitForTimeout(2500);
  const gate = await p.evaluate(() => { const W = window.__works, g = [...W.things.values()].find(b => b.kind.kind === "gate/iron-pair"); return Object.keys(g.kind.affordances).map(k => `${k}:${W.stateOf(g, k)}`).join(" "); });
  await shot("10-gates-open");
  await place(gx, L.yF + 2.2, 180, -12, "ground"); await dtap(); const out = await p.evaluate(() => window.__T.cam()); await shot("11-outside");
  log("gates", { aim: a, said: await saidSince(n0), gate, teleported: out, room: await p.evaluate(() => window.__T.room()), visible: await visible() });
  await p.keyboard.down("KeyW"); await p.waitForTimeout(2500); await p.keyboard.up("KeyW"); await raf(4);
  const walked = await p.evaluate(() => window.__T.cam());
  // on down the hill by double taps on the ground ahead (the ground's own height: a __place keeps the floor's)
  const hillTp = [];
  for (let k = 0; k < 4; k++) { await p.evaluate(() => { const c = window.__T.cam(); window.__place(c[0], c[1], 180, -4, null); }); await raf(4); await dtap(); hillTp.push(await p.evaluate(() => window.__T.cam())); }
  await p.evaluate(() => { const c = window.__T.cam(); window.__place(c[0], c[1], 0, 2, null); }); await p.waitForTimeout(3000); await raf(); await shot("12-hillside");
  const hill = await p.evaluate(() => ({ hill: window.__hill?.stats?.(), ground: window.__ground?.stats?.() }));
  log("outside", { walked, hillTp, hill, visible: await visible() }); }

// 8. back in: the hall, the rooms it shows
await place(34, 4.5, -90, -3, "ground"); await shot("13-hall");
log("end", { room: await p.evaluate(() => window.__T.room()), visible: await visible(), drop: await p.evaluate(() => window.__geodrop?.() || null), errors: errs.filter(e => !/toNonIndexed/.test(e)).slice(0, 8) });
await b.close();
