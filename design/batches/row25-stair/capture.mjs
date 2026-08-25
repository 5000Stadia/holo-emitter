/* Batch capture — §12.6's capture spec: the scene canvas element alone at
 * native 1536×1024, cold file:// load, Chromium, no chrome, no hover, focus
 * blurred. Every frame is reached by real intents through the harness, never
 * by writing viewstate.
 *
 * usage: node capture.mjs <outDir> [appRoot]
 *
 * `appRoot` defaults to this repository, and it exists so the SAME script can
 * draw both sides of this row's question: `before/` is captured from a
 * `git archive` of `6f578b1` (the commit row 25 opened against) and `after/`
 * from the row's own closing commit. A pair of frames drawn by two different
 * scripts would be two pictures of two things.
 *
 * The world is the painted navigation world — the whole manor, which is what
 * the bare link serves — except the last frame, which is the furnished demo
 * world and says so in its name.
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

const TO_FRONT = ["door_study_hall", "door_hall_buttery_pantry",
  "door_buttery_pantry_servants_hall", "door_servants_hall_back_stair",
  "door_back_stair_great_hall", "door_great_hall_entrance_court",
  "way_entrance_court_entrance_approach"];
const TO_BACK_STAIR = TO_FRONT.slice(0, 4);

const at = (route, facing) => ({ route, facing });

const FRAMES = [
  /* (b) THE FLIGHT, LIT. An ascending flight seen end-on: goings, risers and
     the two stringers were one flat #4a5870 over every face. */
  ["01-back_stair-E-flight-lit", "nav-manor", at(TO_BACK_STAIR, "E")],
  /* The same stair seen ACROSS its run — the facing the row measured 22.2 %
     of a frame in a single value on. */
  ["02-great_stair_hall-W-across-the-run", "nav-manor",
    at([...TO_FRONT.slice(0, 5), "door_great_hall_great_stair_hall"], "W")],
  /* (a) THE DESCENDING FACINGS, which is where the click did not travel:
     0 % of stair_landing/S's drawn staircase, 71.8 % of back_stair_head/W's. */
  ["03-stair_landing-S-descending", "nav-manor",
    at([...TO_BACK_STAIR, "stair_back_stair_back_stair_head",
      "door_back_stair_head_solar", "door_solar_stair_landing"], "S")],
  ["04-back_stair_head-W-descending", "nav-manor",
    at([...TO_BACK_STAIR, "stair_back_stair_back_stair_head"], "W")],
  /* A FLIGHT SEEN FROM BESIDE IT, drawn on a facing its exit is not stated on
     — eight of the twelve, and none of them answered a click before. */
  ["05-great_stair_hall-S-flight-from-beside", "nav-manor",
    at([...TO_FRONT.slice(0, 5), "door_great_hall_great_stair_hall"], "S")],
  /* (d) THE SMEARED DOORWAY: 476 × 953 px of opening, 9.6 % of it the room
     beyond and the rest one column of it stretched sideways. */
  ["06-hall-N-doorway-through", "nav-manor", at(["door_study_hall"], "N")],
  /* A DOOR WHOSE DESTINATION FRAME DOES NOT REACH IT AT ALL — 0 % coverage,
     the whole opening manufactured. */
  ["07-great_hall-N-zero-coverage-door", "nav-manor", at(TO_FRONT.slice(0, 5), "N")],
  /* (c)+(d) THE COURT'S MOUTH: 3095 × 706 px of `go` region, both chevrons
     inside it, and 37.7 % of it real. This frame is the row's one open look
     question — the flat fill against the smear on a mouth this size. */
  ["08-entrance_court-S-mouth", "nav-manor", at(TO_FRONT.slice(0, 6), "S")],
  /* AND FROM THE OTHER SIDE, the manor's own front way in. */
  ["09-entrance_approach-N-mouth", "nav-manor", at(TO_FRONT, "N")],
  /* THE FURNISHED WORLD, unmoved except by the composite: the study's own
     doorway with the passage showing through it. */
  ["10-demo-study-E-door-open-through", "demo-study", at([], "E")]
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1536, height: 1200 } });

for (const [name, world, plan] of FRAMES) {
  const url = pathToFileURL(join(ROOT, "index.html")).href +
    (world === "nav-manor" ? "" : `?world=${world}`);
  await page.goto(url);
  await page.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
  const reached = await page.evaluate(({ route, facing, isDemo }) => {
    const A = window.HOLO_APP;
    for (const id of route) {
      const vs = A.harness.viewstate;
      const ex = (A.harness.world.locations.find((l) => l.id === vs.location).exits || [])
        .find((e) => e.id === id);
      if (!ex) return `MISSING ${id} in ${vs.location}`;
      let guard = 0;
      while (A.harness.viewstate.facing !== ex.facing && guard++ < 4) {
        A.harness.dispatch({ type: "turn", dir: "right" });
      }
      if (isDemo && ex.via === "door1") A.harness.dispatch({ type: "toggle", entity: "door1" });
      A.harness.dispatch({ type: "go", exit: id });
    }
    let guard = 0;
    while (A.harness.viewstate.facing !== facing && guard++ < 4) {
      A.harness.dispatch({ type: "turn", dir: "right" });
    }
    const vs = A.harness.viewstate;
    return `${vs.location}/${vs.facing}`;
  }, { route: plan.route, facing: plan.facing, isDemo: world === "demo-study" });
  if (name.endsWith("door-open-through")) {
    await page.evaluate(() => window.HOLO_APP.harness.dispatch({ type: "toggle", entity: "door1" }));
  }
  await page.evaluate(() => {
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    document.body.classList.add("capture");
  });
  await page.waitForTimeout(600);
  await page.locator("#scene").screenshot({ path: join(outDir, `${name}.png`) });
  await page.evaluate(() => document.body.classList.remove("capture"));
  console.log(`${name} -> ${reached}`);
}

await browser.close();
