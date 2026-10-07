// The case in the manor (M7): question the household through the real page, by topics and in your own words, and see
// what is said and learned; screenshots of the panel and of each person present. node tests/.case-play.mjs [OUTDIR]
import { chromium } from "playwright";
const OUT = process.argv[2] || "/tmp/claude-1000/-home-k-Projects-holo-emitter/97770d23-8695-4407-9f5e-30bf8e241f72/scratchpad/case";
import { mkdirSync } from "node:fs"; mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ args: ["--use-angle=vulkan", "--enable-features=Vulkan", "--enable-unsafe-webgpu", "--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }); const errs = []; p.on("pageerror", e => errs.push(e.message + " @ " + (e.stack || "").split("\n").slice(1, 3).join(" / ")));
await p.goto("http://localhost:8794/lab/manor/index.html?case=case-1660&fresh&webgpu=1", { timeout: 300000 }); await p.waitForFunction(() => window.__ok, null, { timeout: 300000 });
const log = () => p.evaluate(() => [...document.querySelectorAll("[class*=log] > *, [class*=line]")].slice(-3).map(e => e.textContent.trim()).filter(Boolean));
const st = () => p.evaluate(() => ({ learned: [...window.__cp.frame.learned], said: window.__cp.frame.said.length }));
// stand before Dame Anne and face her
const face = async (id) => p.evaluate((id) => { const q = window.__presences.get(id), g = q.p.group.position; const R = window.__plan.rooms.find(r => r.id === q.room), cx = (R.rect.x0 + R.rect.x1) / 2, cy = (R.rect.y0 + R.rect.y1) / 2; const dx = cx - g.x, dy = cy - (-g.z), L = Math.hypot(dx, dy) || 1, x = g.x + dx / L * 1.6, y = -g.z + dy / L * 1.6; const yaw = Math.atan2(-(g.x - x), (-g.z) - y) * 180 / Math.PI; window.__place(x, y, yaw, -4, R.floor); }, id);
for (const [who, steps] of [["anne", [["ask", "death"], ["ask", "morning"], ["words", "Where were you last night after supper?"], ["ask", "keys"]]],
                            ["daniel", [["ask", "morning"], ["words", "Who had the key to that room?"], ["ask", "whereabouts"]]],
                            ["francis", [["ask", "hand"], ["words", "You quarrelled with the steward at supper. Why?"]]],
                            ["cressy", [["ask", "sale"], ["ask", "cards"]]]]) {
  await face(who); await p.waitForTimeout(800); await p.evaluate((w) => window.__cp.talkTo(w), who); await p.waitForTimeout(600);
  for (const [kind, arg] of steps) { if (kind === "ask") await p.evaluate(([w, t]) => window.__cp.reply(w, t, "ask"), [who, arg]); else await p.evaluate((t) => window.__cp.words(t), arg); await p.waitForTimeout(400);
    console.log(who.padEnd(8), kind, String(arg).padEnd(46), JSON.stringify(await p.evaluate(() => window.__cp.frame.said.at(-1)?.act)), "|", (await log()).at(-1)?.slice(0, 150)); }
  await p.screenshot({ path: `${OUT}/talk-${who}.png` }); }
console.log("state", JSON.stringify(await st()), "notebook", JSON.stringify(await p.evaluate(() => window.__cp.notebookView().clues.length)), "errors", errs.slice(0, 3));
await b.close();
