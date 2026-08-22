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
 * WHAT THIS BATCH IS OF. The standing-eye wave: [HUMAN 2026-08-22] "B" put
 * every wall of the manor through one regeneration at a new camera, and three
 * of the study's four walls came back on it. The frames are ordered FOR SEAM
 * INSPECTION rather than by compass — each of the study's four corners is two
 * facings that have to look like the same room where they meet, and the
 * README pairs them. The fourth wall is here too, unadmitted and drawing the
 * grid, because a room in two materials is a LOOK and the look is Kabe's.
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

/* The navigation world boots at study/N; turning right cycles N -> E -> S -> W. */
const toStudy = (f) => Array(["N", "E", "S", "W"].indexOf(f)).fill(R);

const FRAMES = [
  /* The three painted walls, in the order the README reads them: north first,
     because it is the camera reference itself, then the two that were admitted
     against it. */
  ["01-study-N", "nav-manor", toStudy("N")],
  ["02-study-E", "nav-manor", toStudy("E")],
  ["03-study-W", "nav-manor", toStudy("W")],
  /* The wall the gate withheld — the window wall paints no chair-rail, so no
     scale could be issued from it and it still draws the grid. It is in the
     batch because the seam between an oil-painted wall and a holodeck grid is
     the thing a human has to look at rather than be told about. */
  ["04-study-S", "nav-manor", toStudy("S")],
  /* THROUGH THE DOORWAY, in the furnished world with the leaf opened: the
     painted east wall's opening with the cross passage drawn through it and
     the V1 placeholder sprites still standing on the painted floor. Two seams
     in one frame — painting to painting through the hole, and painting to
     sprite on the ground. */
  ["05-demo-study-E-door-open-through", "demo-study", [R, OPEN_DOOR]]
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
