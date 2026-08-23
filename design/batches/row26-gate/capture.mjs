/* Batch capture — §12.6's capture spec: the scene canvas element alone at
 * native 1536×1024, cold file:// load, Chromium, no chrome, no hover, focus
 * blurred. Every frame is reached by real intents through the harness, never
 * by writing viewstate.
 *
 * usage: node capture.mjs <outDir> [afterRoot] [beforeRoot]
 *
 * TWO BUILDS, WHICH IS WHAT THIS BATCH IS OF. Row 26 moved where the body
 * stands on two of the manor's facings, and the only way to show a human what
 * that bought is the same facing drawn twice. `afterRoot` defaults to this
 * repository; `beforeRoot` is a checkout of the build the row started from, and
 * without it the BEFORE frames are skipped rather than faked from today's code.
 */
import { chromium } from "playwright";
import { mkdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(process.argv[2]);
const AFTER = process.argv[3] ? resolve(process.argv[3]) : resolve(HERE, "..", "..", "..");
const BEFORE = process.argv[4] ? resolve(process.argv[4]) : null;
mkdirSync(outDir, { recursive: true });

/* The two facings the row moved, and one it did not. The passage is entered the
 * way a player enters it — out of the study, which is the whole of the manor a
 * player could reach before this row. */
const FRAMES = [
  ["hall-N", ["door_study_hall"], "N"],
  ["hall-S", ["door_study_hall"], "S"],
  /* AND A FACING THE ROW DID NOT TOUCH, in the same room, so a reader can see
   * that "the passage moved" means two of its four walls and not the room. */
  ["hall-E", ["door_study_hall"], "E"]
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1536, height: 1200 } });

async function shoot(root, prefix) {
  const url = pathToFileURL(join(root, "index.html")).href;
  for (const [name, route, facing] of FRAMES) {
    await page.goto(url);
    await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
    const reached = await page.evaluate(({ route, facing }) => {
      const A = window.HOLO_APP;
      for (const id of route) {
        const vs = A.harness.viewstate;
        const ex = (A.harness.world.locations.find((l) => l.id === vs.location).exits || [])
          .find((e) => e.id === id);
        if (!ex) return `MISSING ${id} in ${vs.location}`;
        let g = 0;
        while (A.harness.viewstate.facing !== ex.facing && g++ < 4) {
          A.harness.dispatch({ type: "turn", dir: "right" });
        }
        A.harness.dispatch({ type: "go", exit: id });
      }
      let g = 0;
      while (A.harness.viewstate.facing !== facing && g++ < 4) {
        A.harness.dispatch({ type: "turn", dir: "right" });
      }
      const vs = A.harness.viewstate;
      return `${vs.location}/${vs.facing}`;
    }, { route, facing });
    await page.evaluate(() => {
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      document.body.classList.add("capture");
    });
    await page.waitForTimeout(600);   // the go veil, out of the way
    const file = `${prefix}${name}`;
    await page.locator("#scene").screenshot({ path: join(outDir, `${file}.png`) });
    await page.evaluate(() => document.body.classList.remove("capture"));
    console.log(`${file} -> ${reached}`);
  }
}

/* Numbered so the pairs sit beside each other in a directory listing. */
if (BEFORE && existsSync(join(BEFORE, "index.html"))) await shoot(BEFORE, "01-BEFORE-");
await shoot(AFTER, "02-");

await browser.close();
