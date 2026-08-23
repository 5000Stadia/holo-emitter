/* Row 27 — the aperture on the painted door, before and after.
 *
 *   node design/batches/row27-doors/capture.mjs <outDir> [appRoot]
 *
 * §12.6's capture spec: the scene canvas element alone at native 1536×1024,
 * cold `file://` load, Chromium, no chrome, no hover, focus blurred. Every
 * frame is reached by real intents through the harness — the route is walked
 * out of `world.json`'s own exits, so it is the building's route and not a
 * typed one.
 *
 * WHAT THE PICTURE SHOWS. On a painted facing the renderer composites the
 * DESTINATION ROOM into the meta's opening rectangle (`drawThroughOpening`),
 * so where that rectangle sits is not an invisible click target — it is paint.
 * With the plan-projected rectangle, `library/E` pastes the great hall onto
 * solid panelling half a metre to the left of the door the picture draws; with
 * the measured one it lands in the door. The overlay frame beside each capture
 * draws the aperture the page would accept a `go` click inside, taken from the
 * page's own `apertureList`, so the two facts — where the hole is drawn and
 * where the click is taken — are visible as one.
 */
import { chromium } from "playwright";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = process.argv[3]
  ? resolve(process.argv[3])
  : resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const outDir = resolve(process.argv[2]);
mkdirSync(outDir, { recursive: true });

const WORLD = JSON.parse(readFileSync(join(ROOT, "fixtures", "nav-manor", "world.json"), "utf8"));
const START = JSON.parse(readFileSync(join(ROOT, "fixtures", "nav-manor", "viewstate.json"), "utf8"));
const ORDER = ["N", "E", "S", "W"];

/** The shortest walk from the boot location to `to`, as `go` exit ids. */
function route(to) {
  const seen = new Map([[START.location, []]]);
  const q = [START.location];
  while (q.length) {
    const at = q.shift();
    if (at === to) return seen.get(at);
    const loc = WORLD.locations.find((l) => l.id === at);
    for (const ex of (loc && loc.exits) || []) {
      if (seen.has(ex.to)) continue;
      seen.set(ex.to, seen.get(at).concat([ex]));
      q.push(ex.to);
    }
  }
  throw new Error(`no route to ${to} — the world does not join up`);
}

/** Intents that stand the player in `loc` facing `facing`. */
function intentsTo(loc, facing) {
  const walk = route(loc);
  const out = [];
  let f = START.facing;
  for (const ex of walk) {
    while (f !== ex.facing) { out.push({ type: "turn", dir: "right" }); f = ORDER[(ORDER.indexOf(f) + 1) % 4]; }
    out.push({ type: "go", exit: ex.id });
    f = ex.arrive_facing;
  }
  while (f !== facing) { out.push({ type: "turn", dir: "right" }); f = ORDER[(ORDER.indexOf(f) + 1) % 4]; }
  return out;
}

/* The walls the Captain named, and the two the re-check demoted, so the batch
 * shows what was kept AND what went back to grid rather than only the win. */
const FRAMES = process.argv[4] ? process.argv[4].split(",").map((s) => s.split("/"))
  : [["library", "E"], ["library", "S"], ["muniment_room", "W"], ["solar", "W"],
     ["dining_parlour", "E"], ["great_hall", "W"]];

const b = await chromium.launch();
for (const [loc, facing] of FRAMES) {
  const page = await b.newPage({ viewport: { width: 1536, height: 1200 } });
  await page.goto(pathToFileURL(join(ROOT, "index.html")).href);
  await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
  const info = await page.evaluate((list) => {
    const A = window.HOLO_APP;
    for (const it of list) A.dispatch(it);
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    document.body.classList.add("capture");
    return { vs: A.harness.viewstate, apertures: A.apertureList() };
  }, intentsTo(loc, facing));
  await page.waitForTimeout(150);
  const name = `${loc}-${facing}`;
  await page.locator("#scene").screenshot({ path: join(outDir, name + ".png") });
  /* The same frame with the `go` rectangles outlined, drawn ONTO a copy of the
     scene inside the page so the outline is in scene pixels exactly. */
  await page.evaluate((aps) => {
    const c = document.querySelector("#scene");
    const ctx = c.getContext("2d");
    ctx.save();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#ff3b30";
    for (const a of aps) ctx.strokeRect(a.x, a.y, a.w, a.h);
    ctx.restore();
  }, info.apertures);
  await page.locator("#scene").screenshot({ path: join(outDir, name + "-aperture.png") });
  console.log(name, "->", info.vs.location + "/" + info.vs.facing,
    info.apertures.map((a) => `${a.via} ${Math.round(a.x)},${Math.round(a.y)} ${Math.round(a.w)}×${Math.round(a.h)}`).join(" | ") || "(no way through)");
  await page.close();
}
await b.close();
