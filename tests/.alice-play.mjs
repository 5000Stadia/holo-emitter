// The hall of doors played through (R49), the book's way: take the key, find the little door behind the curtain,
// unlock it, look (too big), shut it (it latches), go back to the table (the bottle comes to be), leave the key there,
// drink (ten inches: the key out of reach), open the glass box, a bite (nothing), the rest (nine feet, stooping),
// take the key (the bottle comes back: the story's magic), drink, unlock, and through.
import { chromium } from "playwright";
const OUT = process.env.OUT || "/tmp/claude-1000/-home-k-Projects-holo-emitter/97770d23-8695-4407-9f5e-30bf8e241f72/scratchpad";
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 640, height: 400 } }); const errs = []; p.on("pageerror", e => errs.push(e.message)); p.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
const t0 = Date.now();
await p.goto("http://localhost:8794/lab/manor/index.html?webgl=1&plan=alice-hall&fresh", { timeout: 300000 });
await p.waitForFunction(() => window.__ok, null, { timeout: 300000 });
const walkable = Date.now() - t0;
await p.evaluate(() => document.querySelectorAll("#keys,#gate,#line").forEach(e => e.style.display = "none"));
console.log("story", JSON.stringify(await p.evaluate(() => window.__story())));
const thing = (id) => `[...window.__sp.thingOf].find(([k]) => k === "${id}")[1]`;
const step = async (what, fn, wait = 600) => { const n0 = await p.evaluate(() => window.__said.length); await p.evaluate(fn); await p.waitForTimeout(wait);
  const r = await p.evaluate((n0) => ({ said: window.__said.slice(n0), size: window.__sp.size(), held: window.__works.held().map(b => b.kind.kind), eye: +window.__camera.position.y.toFixed(2) }), n0);
  console.log(what.padEnd(34), JSON.stringify(r)); return r; };
const at = (x, y, yaw = 90) => `window.__place(${x}, ${y}, ${yaw}, -20, "ground")`;
const T = await p.evaluate(() => { const b = [...window.__sp.thingOf].find(([k]) => k === "glass_table")[1], v = new window.__THREE.Vector3(); b.node.getWorldPosition(v); return [v.x, -v.z]; });
const door = await p.evaluate(() => window.__plan.openings.find(o => o.id === "little_door").rect);
const D = [door.x1 + 0.5, (door.y0 + door.y1) / 2];
await step("at the table, take the key", `${at(T[0] + 0.6, T[1])}; window.__actOn(${thing("golden_key")})`);
await step("at the curtain, draw it aside", `${at(D[0] + 0.4, D[1])}; window.__actOn(${thing("curtain")}, "left"); window.__actOn(${thing("curtain")}, "right")`);
await step("unlock and open the little door", `window.__actOn([...window.__works.things.values()].find(b => b.node.userData.opening === "little_door"), "leaf")`, 2500);
await p.screenshot({ path: `${OUT}/alice-1-door.png`, timeout: 120000 });
await step("shut it again", `window.__actOn([...window.__works.things.values()].find(b => b.node.userData.opening === "little_door"), "leaf")`, 2500);
await step("back to the table", `${at(T[0] + 0.6, T[1])}`, 2500);
await p.screenshot({ path: `${OUT}/alice-2-bottle.png`, timeout: 120000 });
await step("leave the key on the table", `window.__actOn(${thing("glass_table")})`);
await step("drink", `window.__actOn(${thing("bottle")}, "drink")`, 4000);
await p.screenshot({ path: `${OUT}/alice-3-small.png`, timeout: 120000 });
await step("reach for the key", `window.__actOn(${thing("golden_key")})`);
await step("open the glass box", `window.__actOn(${thing("glass_box")}, Object.keys(${thing("glass_box")}.kind.affordances)[0])`, 1500);
await step("a bite of the cake", `window.__actOn(${thing("cake")}, "eat")`);
await step("the rest of the cake", `window.__actOn(${thing("cake")}, "eat")`, 4000);
await p.screenshot({ path: `${OUT}/alice-4-large.png`, timeout: 120000 });
await step("take the key, nine feet high", `window.__actOn(${thing("golden_key")})`, 1000);
await step("drink again", `window.__actOn(${thing("bottle")}, "drink")`, 4000);
await step("unlock and open the little door", `${at(D[0], D[1])}; window.__actOn([...window.__works.things.values()].find(b => b.node.userData.opening === "little_door"), "leaf")`, 2500);
await p.screenshot({ path: `${OUT}/alice-5-small-door.png`, timeout: 120000 });
const through = await p.evaluate(([x, y]) => window.__walkPath([[x, y], [x - 1.2, y], [x - 2.2, y]], "ground"), D);
console.log("walk through the little door", JSON.stringify(through));
await step("in the passage", `window.__place(${through.x}, ${through.y}, 90, -5, "ground", true)`, 3000);
await p.screenshot({ path: `${OUT}/alice-6-passage.png`, timeout: 120000 });
console.log("ended", await p.evaluate(() => !!document.getElementById("end")), "walkable ms", walkable, "errors", errs.slice(0, 5));
await b.close();
