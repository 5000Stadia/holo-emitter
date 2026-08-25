#!/usr/bin/env node
/* [row 42 part 3] The demo captures, reproducibly.
 *
 *   node design/batches/row42-leaves/demo/capture.mjs
 *
 * The DOOR half runs against the committed tree: `op22` joins the solar to the
 * muniment room and BOTH walls measure it off their own paintings, so the leaf
 * is placed there today, in two different painted frames.
 *
 * The WINDOW half cannot run against the committed tree and says so rather than
 * faking it: no wall in the store carries `meta.windows` yet, and the seat that
 * built this row does not write to `backdrops/`. So it stages a throwaway copy
 * and runs the REAL instruments on it — `window_measure.py` over kitchen/E's own
 * painting, then `promote-backdrop.mjs`, then the fixture bake — and captures
 * the page from there. Every number in the picture is measured; only the
 * promotion is somewhere else.
 *
 * Requires playwright (the repo's devDependency) and python3 with Pillow/numpy,
 * which is what the measurement harness already needs.
 */
import { cpSync, mkdirSync, rmSync, readFileSync, writeFileSync, existsSync, mkdtempSync }
  from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL, fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..", "..", "..");
const OUT = HERE;
/* `playwright` resolves from wherever `npm install` put it — the repository
 * root in a normal checkout, and the MAIN checkout when this runs inside a git
 * worktree, which has no `node_modules` of its own. */
const { chromium } = createRequire(join(ROOT, "package.json"))("playwright");

const STAGE = mkdtempSync(join(tmpdir(), "holo-row42-demo-"));
/* [row 42, ingested] `library/` joins the stage: `library/baked.js` is a script
 * the page loads, and `library/<id>/record.json` is what a `require` of
 * src/placeholders.js resolves a promoted id to — so a stage without it would
 * capture the procedural leaf and the procedural casement while claiming to
 * show the returns. */
for (const d of ["tools", "src", "fixtures", "library"]) {
  cpSync(join(ROOT, d), join(STAGE, d), { recursive: true });
}
cpSync(join(ROOT, "index.html"), join(STAGE, "index.html"));
cpSync(join(ROOT, "backdrops"), join(STAGE, "backdrops"), {
  recursive: true,
  filter: (src) => !src.split("/").some(
    (p) => p === "source" || p.startsWith("source-") || p === "textures")
});
mkdirSync(join(STAGE, "replicator"), { recursive: true });
cpSync(join(ROOT, "replicator", "contract.json"), join(STAGE, "replicator", "contract.json"));
mkdirSync(join(STAGE, "design", "plan-draft"), { recursive: true });
cpSync(join(ROOT, "design", "plan-draft", "measured"),
  join(STAGE, "design", "plan-draft", "measured"), { recursive: true });

const KEY = "kitchen/E";
const [LOC, FAC] = KEY.split("/");
const meta0 = JSON.parse(readFileSync(join(ROOT, "backdrops", LOC, `${FAC}.meta.json`), "utf8"));
const cand = String(meta0.camera_id).replace(/^measured:/, "");
mkdirSync(dirname(join(STAGE, cand)), { recursive: true });
cpSync(join(ROOT, cand), join(STAGE, cand));
const ask = cand.replace(/\.png$/i, ".prompt.txt");
if (existsSync(join(ROOT, ask))) cpSync(join(ROOT, ask), join(STAGE, ask));

const env = { ...process.env, HOLO_TIMINGS: "off" };
const log = [];
log.push(execFileSync("python3",
  [join(STAGE, "design/plan-draft/measured/window_measure.py"),
    "--facing", KEY, "--round", meta0.measured_round, "--candidate", cand],
  { cwd: STAGE, encoding: "utf8", env }).trim());
log.push(execFileSync("node", [join(STAGE, "tools/promote-backdrop.mjs"),
  "--facing", KEY, "--candidate", cand, "--round", meta0.measured_round,
  ...(meta0.camera_reference ? ["--reference", meta0.camera_reference] : []),
  ...(meta0.camera_source ? ["--camera-source", meta0.camera_source] : [])],
  { cwd: STAGE, encoding: "utf8", env }).trim());
execFileSync("node", [join(STAGE, "tools/bake-fixtures.mjs"),
  "--fixture-dir", join(STAGE, "fixtures/nav-manor")], { cwd: STAGE, encoding: "utf8", env });
const meta1 = JSON.parse(readFileSync(join(STAGE, "backdrops", LOC, `${FAC}.meta.json`), "utf8"));
log.push("meta.windows = " + JSON.stringify(meta1.windows));

const TO_KITCHEN = ["door_study_hall", "door_hall_kitchen"];
const TO_SOLAR = ["door_study_hall", "door_hall_buttery_pantry",
  "door_buttery_pantry_servants_hall", "door_servants_hall_back_stair",
  "stair_back_stair_back_stair_head", "door_back_stair_head_solar"];
const TO_MUNIMENT = [...TO_SOLAR, "door_solar_muniment_room"];

async function shoot(root, route, facing, name, toggleId) {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1536, height: 1200 } });
  const errs = [];
  p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  await p.goto(pathToFileURL(join(root, "index.html")).href);
  await p.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
  const at = await p.evaluate(([route, facing]) => {
    const A = window.HOLO_APP;
    for (const id of route) {
      const vs = A.harness.viewstate;
      const ex = A.harness.world.locations.find((l) => l.id === vs.location)
        .exits.find((e) => e.id === id);
      let g = 0;
      while (A.harness.viewstate.facing !== ex.facing && g++ < 4) A.dispatch({ type: "turn", dir: "right" });
      A.dispatch({ type: "go", exit: id });
    }
    let g = 0;
    while (A.harness.viewstate.facing !== facing && g++ < 4) A.dispatch({ type: "turn", dir: "right" });
    return A.harness.viewstate;
  }, [route, facing]);
  const grab = async (tag) => {
    writeFileSync(join(OUT, `${name}-${tag}.png`), Buffer.from(await p.evaluate(async () => {
      const c = document.getElementById("scene");
      const b = await new Promise((r) => c.toBlob(r, "image/png"));
      return [...new Uint8Array(await b.arrayBuffer())];
    })));
    await p.screenshot({ path: join(OUT, `${name}-${tag}-page.png`) });
  };
  const first = await p.evaluate((id) =>
    window.HOLO_APP.harness.world.entities.find((e) => e.id === id).state, toggleId);
  await grab(first);
  const second = await p.evaluate((id) => {
    window.HOLO_APP.dispatch({ type: "toggle", entity: id });
    return window.HOLO_APP.harness.world.entities.find((e) => e.id === id).state;
  }, toggleId);
  await grab(second);
  const narration = await p.evaluate(() =>
    [...document.querySelectorAll("#narration p")].map((x) => x.textContent));
  await b.close();
  return { at, first, second, narration, errs };
}

const solar = await shoot(ROOT, TO_SOLAR, "E", "door-solar-E", "leaf_op22");
const muniment = await shoot(ROOT, TO_MUNIMENT, "W", "door-muniment_room-W", "leaf_op22");
const win = await shoot(STAGE, TO_KITCHEN, "E", "casement-kitchen-E", "casement_win10");
rmSync(STAGE, { recursive: true, force: true });

console.log(JSON.stringify({ solar, muniment, win, log }, null, 1));
