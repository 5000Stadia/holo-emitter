/* Batch capture — §12.6's capture spec: the scene canvas element alone at
 * native 1536×1024, cold file:// load, Chromium, no chrome, no hover, focus
 * blurred (architecture.md's row-10 note: a focus halo paints into #overlay,
 * which never carried class="chrome"). Every frame is reached by real intents
 * through the harness, never by writing viewstate.
 *
 * usage: node capture.mjs <outDir> [appRoot]
 *
 * `appRoot` defaults to this repository. It exists so the BEFORE frames can be
 * re-drawn from the build that drew them — extract the superseded commit's tree
 * somewhere and point this at it — which is what lets those eight pictures
 * answer for themselves instead of being eight files bound to nothing.
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
const OPEN_DOOR = { type: "toggle", entity: "door1" };
const GO_HALL = { type: "go", exit: "door_study_hall" };

/* Boot is study/N. Turning right cycles N -> E -> S -> W. Crossing east lands
 * in the hall facing E (passage maintains orientation), and turning right from
 * there cycles E -> S -> W -> N. */
const toStudy = (f) => Array(["N", "E", "S", "W"].indexOf(f)).fill(R);
const toHall = (f) => [R, OPEN_DOOR, GO_HALL]
  .concat(Array(["E", "S", "W", "N"].indexOf(f)).fill(R));

const FRAMES = [
  ["01-study-N", toStudy("N")],
  ["02-study-E", toStudy("E")],
  ["03-study-S", toStudy("S")],
  ["04-study-W", toStudy("W")],
  ["05-hall-N", toHall("N")],
  ["06-hall-E", toHall("E")],
  ["07-hall-S", toHall("S")],
  ["08-hall-W", toHall("W")],
  ["09-study-N-drawer-open-key", [{ type: "toggle", entity: "desk1" }]],
  ["10-study-E-door-open", [R, OPEN_DOOR]],
  /* Every hall frame arrives THROUGH door1, so 08-hall-W already shows the
     leaf open — frame 11 as written was a byte-identical duplicate under a
     name that promised a different state. Toggling once on arrival shuts it,
     which is the state the batch was actually missing. */
  ["11-hall-W-door-shut", toHall("W").concat([OPEN_DOOR])]
];

const b = await chromium.launch();

for (const [name, intents] of FRAMES) {
  const page = await b.newPage({ viewport: { width: 1536, height: 1200 } });
  /* [Row 21] `?world=demo-study`, because this batch is of the FURNISHED
     world and row 21 made the bare URL boot the painted navigation world
     instead. The script's meaning has not changed — it asks for the world it
     always captured, by name — and the frames it re-renders are byte-identical
     to the ones it produced, which is what `plan.spec` asserts. Nothing here
     was re-captured: the pictures Kabe has not yet ruled on are untouched. */
  await page.goto(pathToFileURL(join(ROOT, "index.html")).href + "?world=demo-study");
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
console.log("captured to", outDir);
