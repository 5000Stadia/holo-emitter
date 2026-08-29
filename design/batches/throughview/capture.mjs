#!/usr/bin/env node
/* [row 43] THE GREY DIVIDER AT THE THRESHOLD, before and after.
 *
 *   node design/batches/throughview/capture.mjs
 *
 * The Captain's frame: `?world=cyberpunk-2`, `noodle_bar` facing E, the doorway
 * into `back_office`. The far room's frame ends at row 736 and the doorway's
 * foot is at row 774, so 38 rows of the aperture are floor the far camera never
 * saw — and row 25 filled them with the mean of the far frame's bottom band.
 * That flat slab is the divider.
 *
 * BOTH halves run the real page. "after" is this working tree; "before" is a
 * throwaway copy of it with `src/renderer.js` taken from HEAD, so the two
 * pictures differ by this row's diff and nothing else.
 *
 * Requires playwright (the repo's devDependency).
 */
import { cpSync, mkdirSync, rmSync, writeFileSync, mkdtempSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL, fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..", "..");
const OUT = HERE;
/* `playwright` resolves from wherever `npm install` put it — the repository
 * root in a normal checkout, and the MAIN checkout when this runs inside a git
 * worktree, which has no `node_modules` of its own. */
const { chromium } = createRequire(join(ROOT, "package.json"))("playwright");

/* THE BEFORE TREE: this one, with the renderer as HEAD left it. */
const STAGE = mkdtempSync(join(tmpdir(), "holo-row43-before-"));
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
writeFileSync(join(STAGE, "src", "renderer.js"),
  execFileSync("git", ["show", "HEAD:src/renderer.js"], { cwd: ROOT, encoding: "utf8" }));

async function shoot(root, tag) {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1536, height: 1200 } });
  const errs = [];
  p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  await p.goto(pathToFileURL(join(root, "index.html")).href + "?world=cyberpunk-2");
  await p.waitForFunction(() => window.HOLO_APP && window.HOLO_APP.paints > 0);
  const at = await p.evaluate(() => {
    const A = window.HOLO_APP;
    let g = 0;
    while (A.harness.viewstate.facing !== "E" && g++ < 4) A.dispatch({ type: "turn", dir: "right" });
    return A.harness.viewstate;
  });
  /* The numbers behind the picture: where the far frame ends, where the
     doorway's foot is, and what the rows between them actually hold. A band
     mean holds ONE colour across the whole strip; the far room's own floor
     holds one per column. */
  const read = await p.evaluate(() => {
    const A = window.HOLO_APP, gp = window.HOLO.groundplane;
    const vs = { location: "noodle_bar", facing: "E" };
    const meta = A.metaFor(vs);
    const ap = meta.openings[0];
    const dest = A.metaFor({ location: "back_office", facing: "E" });
    const k = gp.cameraDistance(dest) / (gp.cameraDistance(meta) + ap.beyond_m);
    const H = meta.image_h_px;
    const dy = meta.horizon_y * H - k * dest.horizon_y * dest.image_h_px;
    const frameBottom = dy + H * k, threshold = ap.y + ap.h;
    const c = document.getElementById("scene");
    const g = c.getContext("2d");
    const x0 = Math.ceil(ap.x + ap.w * 0.16), x1 = Math.floor(ap.x + ap.w * 0.90);
    const rows = [];
    for (let y = Math.ceil(frameBottom) + 1; y < Math.floor(threshold); y++) {
      const d = g.getImageData(x0, y, x1 - x0, 1).data;
      const seen = new Set();
      let lo = 255, hi = 0;
      for (let i = 0; i < d.length; i += 4) {
        seen.add(d[i] + "," + d[i + 1] + "," + d[i + 2]);
        const l = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
        if (l < lo) lo = l;
        if (l > hi) hi = l;
      }
      rows.push({ y, colours: seen.size, spread: +(hi - lo).toFixed(1) });
    }
    return { k: +k.toFixed(5), frame_bottom: +frameBottom.toFixed(2), threshold,
      aperture: { x: ap.x, y: ap.y, w: ap.w, h: ap.h, beyond_m: ap.beyond_m },
      strip_rows: rows.length,
      colours_min: Math.min(...rows.map((r) => r.colours)),
      colours_max: Math.max(...rows.map((r) => r.colours)),
      spread_min: Math.min(...rows.map((r) => r.spread)),
      rows: rows.slice(0, 4).concat(rows.slice(-2)) };
  });
  const png = async (name, crop) => {
    writeFileSync(join(OUT, name), Buffer.from(await p.evaluate(async (crop) => {
      const src = document.getElementById("scene");
      let c = src;
      if (crop) {
        c = document.createElement("canvas");
        c.width = crop.w * crop.z; c.height = crop.h * crop.z;
        const g = c.getContext("2d");
        g.imageSmoothingEnabled = false;
        g.drawImage(src, crop.x, crop.y, crop.w, crop.h, 0, 0, c.width, c.height);
      }
      const b = await new Promise((r) => c.toBlob(r, "image/png"));
      return [...new Uint8Array(await b.arrayBuffer())];
    }, crop)));
  };
  await png(`noodle_bar-E-${tag}.png`);
  /* The doorway and the ground on both sides of its foot, at 3x. */
  await png(`noodle_bar-E-${tag}-threshold.png`,
    { x: 620, y: 640, w: 300, h: 200, z: 3 });
  await p.screenshot({ path: join(OUT, `noodle_bar-E-${tag}-page.png`) });
  await b.close();
  return { at, read, errs };
}

const before = await shoot(STAGE, "before");
const after = await shoot(ROOT, "after");
rmSync(STAGE, { recursive: true, force: true });
console.log(JSON.stringify({ before, after }, null, 1));
