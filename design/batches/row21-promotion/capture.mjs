/* Batch capture — §12.6's capture spec: the scene canvas element alone at
 * native 1536×1024, cold file:// load, Chromium, no chrome, no hover, focus
 * blurred. Every frame is reached by real intents through the harness, never
 * by writing viewstate.
 *
 * usage: node capture.mjs <outDir> [appRoot]
 *
 * `appRoot` defaults to this repository. It exists so a picture can be
 * re-drawn from the build that drew it, which is what lets a frame answer for
 * itself instead of being a file bound to nothing.
 *
 * THE WORLD THIS BATCH IS OF is the painted navigation world — the one the
 * bare URL boots, which is what a visitor opens. Two frames are of the
 * furnished demo world (`?world=demo-study`) and say so in their names,
 * because the seam between a painted wall and the placeholder sprites still
 * standing on it is a thing Kabe has to see rather than be told about.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = process.argv[3]
  ? resolve(process.argv[3])
  : resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const outDir = resolve(process.argv[2]);
mkdirSync(outDir, { recursive: true });

const R = { type: "turn", dir: "right" };
const GO_HALL = { type: "go", exit: "door_study_hall" };
const GO_STUDY = { type: "go", exit: "door_hall_study" };
const OPEN_DOOR = { type: "toggle", entity: "door1" };

/* The navigation world boots at study/N. Turning right cycles N -> E -> S -> W.
 * Crossing east lands in the hall facing E (passage maintains orientation);
 * turning right from there cycles E -> S -> W -> N. Nothing has to be opened
 * first: the doorway is a fact about the building and no leaf stands in it. */
const toStudy = (f) => Array(["N", "E", "S", "W"].indexOf(f)).fill(R);
const toHall = (f) => [R, GO_HALL].concat(Array(["E", "S", "W", "N"].indexOf(f)).fill(R));

const FRAMES = [
  ["01-study-N", "nav-manor", toStudy("N")],
  ["02-study-E", "nav-manor", toStudy("E")],
  ["03-study-S", "nav-manor", toStudy("S")],
  ["04-study-W", "nav-manor", toStudy("W")],
  ["05-hall-E", "nav-manor", toHall("E")],
  ["06-hall-S", "nav-manor", toHall("S")],
  ["07-hall-W", "nav-manor", toHall("W")],
  ["08-hall-N", "nav-manor", toHall("N")],
  /* Back through the doorway and looking at it from the study side again —
     the same view as 02, reached the long way, so a passage that quietly
     changed the world would show up as a different picture. */
  ["09-study-E-returned", "nav-manor", toHall("W").concat([GO_STUDY, R, R])],
  /* The furnished world, on the two facings where this row's seams are: the
     painted north wall with V1 placeholder sprites still standing on it, and
     the open door with the passage showing through it. */
  ["10-demo-study-N-painted-with-placeholders", "demo-study", toStudy("N")],
  ["11-demo-study-E-door-open-through", "demo-study", [R, OPEN_DOOR]]
];

const b = await chromium.launch();

for (const [name, world, intents] of FRAMES) {
  const page = await b.newPage({ viewport: { width: 1536, height: 1200 } });
  await page.goto(pathToFileURL(join(ROOT, "index.html")).href + "?world=" + world);
  await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
  const vs = await page.evaluate((list) => {
    const A = window.HOLO_APP;
    for (const it of list) A.dispatch(it);
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    document.body.classList.add("capture");
    return A.harness.viewstate;
  }, intents);
  await page.waitForTimeout(150);
  await page.locator("#scene").screenshot({ path: join(outDir, name + ".png") });
  console.log(name, "->", vs.location + "/" + vs.facing);
  await page.close();
}

await b.close();
