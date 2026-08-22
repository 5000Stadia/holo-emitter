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
 * THE WORLD THIS BATCH IS OF is the painted navigation world — the whole
 * manor, which is what the bare link now serves. Two frames are of the
 * furnished demo world (`?world=demo-study`) and say so in their names,
 * because "no existing facing moved" is a claim that has to be a picture.
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

/* From the study, out through the service range to the manor's front — `op14`
 * is the one opening no standpoint can see, so the kitchen is entered from the
 * court and not from the passage. */
const TO_FRONT = ["door_study_hall", "door_hall_buttery_pantry",
  "door_buttery_pantry_servants_hall", "door_servants_hall_back_stair",
  "door_back_stair_great_hall", "door_great_hall_entrance_court",
  "way_entrance_court_entrance_approach"];

const at = (route, facing) => ({ route, facing });

const FRAMES = [
  /* THE GREAT HALL, the room the manor is built round. */
  ["01-great_hall-N", "nav-manor", at(TO_FRONT.slice(0, 5), "N")],
  /* A TYPICAL CHAMBER — the ordinary case, eleven of which the manor holds. */
  ["02-master_bedchamber-N", "nav-manor",
    at([...TO_FRONT.slice(0, 4), "stair_back_stair_back_stair_head",
      "door_back_stair_head_long_gallery", "door_long_gallery_muniment_room",
      "door_muniment_room_solar", "door_solar_stair_landing",
      "door_stair_landing_master_bedchamber"], "N")],
  /* A CORRIDOR-TYPED ROOM at manor length: the long gallery. */
  ["03-long_gallery-N", "nav-manor",
    at([...TO_FRONT.slice(0, 4), "stair_back_stair_back_stair_head",
      "door_back_stair_head_long_gallery"], "N")],
  /* AN ASCENDING FLIGHT, drawn tread by tread and clicked to climb. */
  ["04-back_stair-E-flight-up", "nav-manor", at(TO_FRONT.slice(0, 4), "E")],
  /* AND THE SAME ROOM'S OTHER FACING — what turning inside a stair room looks
     like, which is the omission census's largest member as a picture. */
  ["05-back_stair-N-turned-from-the-flight", "nav-manor", at(TO_FRONT.slice(0, 4), "N")],
  /* A DESCENDING FLIGHT, where the steps drop below the frame and the well
     they open in the floor is all there is of the stair. */
  ["06-back_stair_head-W-flight-down", "nav-manor",
    at([...TO_FRONT.slice(0, 4), "stair_back_stair_back_stair_head"], "W")],
  /* AN OPEN COURTYARD FACING: ground to the far line, no wall, no invented
     sky — and the court mouth's own line on the ground. */
  ["07-entrance_court-S-open", "nav-manor", at(TO_FRONT.slice(0, 6), "S")],
  /* THE THRESHOLD FROM THE OTHER SIDE: 20.4 m of gap between two wing fronts,
     with the manor's front standing beyond it. */
  ["08-entrance_approach-N-threshold", "nav-manor", at(TO_FRONT, "N")],
  /* A WALLED OUTDOOR ROOM — the privy garden. Its garden wall draws from the
     floor line to the top of frame, because the plan holds no outdoor wall
     height. That is the row's own open question. */
  ["09-privy_garden-N-garden-wall", "nav-manor",
    at([...TO_FRONT.slice(0, 3), "door_servants_hall_privy_garden"], "N")],
  /* A FACING WITH NO FLOOR LINE AND A NEW DOORWAY: the cross passage's north
     wall, 8.00 m of it seen from 2.15 m. */
  ["10-hall-N-no-floor-line", "nav-manor", at(["door_study_hall"], "N")],
  /* THROUGH A DOORWAY INTO AN OPEN SPACE — the great hall's south door onto
     the entrance court, a destination with no wall plane at all. */
  ["11-great_hall-S-through-to-the-court", "nav-manor", at(TO_FRONT.slice(0, 5), "S")],
  /* THE PAINTED WALL, unchanged: the frame the whole project is anchored to. */
  ["12-study-N-painted", "nav-manor", at([], "N")],
  /* AND THE FURNISHED WORLD, on the two facings this row could have moved and
     did not — the painted room with its placeholder sprites, and the doorway
     with the passage showing through it. */
  ["13-demo-study-N-painted-with-placeholders", "demo-study", at([], "N")],
  ["14-demo-study-E-door-open-through", "demo-study", at([], "E")]
];

const RING = ["N", "E", "S", "W"];

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
      /* The furnished world's door has a leaf, and a leaf must be opened. */
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
  /* The demo world's one interactable frame: the door open, so the passage
     shows through it. Reached by an intent, like everything else. */
  if (name.endsWith("door-open-through")) {
    await page.evaluate(() => window.HOLO_APP.harness.dispatch({ type: "toggle", entity: "door1" }));
  }
  await page.evaluate(() => {
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    document.body.classList.add("capture");
  });
  await page.waitForTimeout(600);   // the go veil, out of the way
  await page.locator("#scene").screenshot({ path: join(outDir, `${name}.png`) });
  await page.evaluate(() => document.body.classList.remove("capture"));
  console.log(`${name} -> ${reached}`);
}

await browser.close();
