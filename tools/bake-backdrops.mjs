#!/usr/bin/env node
/* bake-backdrops.mjs — encode the promoted paintings for the wire and write
 * the manifest the page boots from.
 *
 *   node tools/bake-backdrops.mjs
 *     backdrops/<loc>/<F>.png  ->  backdrops/served/<loc>/<F>.jpg   (the pixels)
 *                              ->  backdrops/baked.js               (the manifest)
 *
 * [Row 45] WHY THE PIXELS ARE NO LONGER IN THE SCRIPT. Until this row every
 * painting rode in `baked.js` as a `data:` URI — 71 walls, 44 MB, a blocking
 * <script> after the UI's own scripts. First paint of ONE wall waited for the
 * download, parse and decode of EVERY wall in the building, in every world,
 * and Kabe reported the result from the live site: "Sometimes loading hangs on
 * first launch. UI is present but then hangs without images loading." It was
 * not a hang. It was 44 MB.
 *
 * So the bundle is unbundled. The same q92 encode, written one file per wall,
 * fetched BY URL and only the wall you are looking at; `baked.js` keeps the
 * names and the byte counts and nothing else, and is ~6 kB.
 *
 * WHY AN ENCODE AT ALL, and not the promoted PNG served directly — the number
 * that decided it, unchanged from row 21: a promoted painting is 2.6 MB of PNG
 * and 550 kB at q92, and the encode moves a channel by 1.7 of 255 on average.
 * Six times the bytes on the one request that stands between a visitor and the
 * first wall is worth more than a difference no eye has found; the published
 * tree is 39 MB of walls rather than 176 MB. Those numbers are printed into
 * the manifest per painting, so the one place where the page's picture is not
 * byte-identical to the artifact this repository holds carries its own
 * difference as a number.
 *
 * The PNG remains the promoted artifact and the flip test's own subject; what
 * ships to a browser is this encode of it. `backdrops/served/` is GENERATED —
 * every byte of it is re-derivable from the store by re-running this, and
 * fixtures.spec's staleness case re-encodes to scratch and byte-compares the
 * whole tree.
 *
 * WHAT A `file://` PAGE DOES NOW. Row 21 baked `data:` URIs because a file://
 * page drawing a file:// image taints the canvas in Chromium and every hash
 * test reads the canvas back. That is a browser flag, not a fact about the
 * product — the live site serves same-origin over https and taints nothing —
 * so the suite passes `--allow-file-access-from-files` (see
 * tests/playwright/playwright.config.mjs) and the page keeps its URLs.
 *
 * The bake reads `backdrops/<loc>/<facing>.png` and NOTHING under
 * `backdrops/source/`: a candidate is not a backdrop until it is promoted, and
 * the promotion is where the gate is.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, rmSync, renameSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import * as timings from "./timings.mjs";                 // [row 33] the stopwatch

/* [row 33] The bake clocks itself. Until row 33 the only evidence a bake left
 * was a commit timestamp, which knows when it landed and never how long it
 * took, so the ledger's first reading of this step is eight markers. */
const T0 = Date.now() / 1000;

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const argOf = (flag, dflt) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : dflt;
};
const backdropsDir = argOf("--backdrops-dir", join(root, "backdrops"));
const outFile = argOf("--out", join(backdropsDir, "baked.js"));
/* The encoded walls land beside the manifest, not beside the PNGs: one
 * generated tree, one thing to delete, and a scratch bake (the staleness case,
 * the timings case) writes its pixels into its own scratch rather than into the
 * store it is measuring. */
const servedDir = argOf("--served-dir", join(dirname(outFile), "served"));
/* What the PAGE asks for, resolved against index.html — a constant of the site
 * layout rather than of wherever this bake happened to write. */
const urlPrefix = argOf("--url-prefix", "backdrops/served/");

const FACING = /^([NESW])\.png$/;
/* q92: the knee of the curve on these paintings — 550 kB against 628 kB at 94
 * and 467 kB at 90, with a mean channel delta of 1.7 of 255. Changing it
 * changes what every visitor sees, so it is a number with a home rather than a
 * literal in a call. */
const QUALITY = 92;
/* REBUILT, not updated. A demoted wall has to leave the served tree the same
 * bake that takes it out of the manifest — a stale .jpg nobody names is a
 * painting the site would still serve to anyone who guessed its URL. */
/* [Kabe, 2026-08-30] "Only first rooms images load for me." BUILT BESIDE, SWAPPED
 * IN. This bake used to empty `served/` and re-encode it wall by wall, and the
 * hospital publish copied the tree while the loop's bake was half-way through
 * the alphabet: reception shipped, treatment_room and ward did not. A derived
 * tree is never partial on disk now — it is encoded into a side directory and
 * renamed into place in one step. */
/* UNIQUE PER PROCESS. Three pack loops share one served tree; two bakes at
 * once with a fixed build-dir name deleted each other's half-encoded work
 * (FileNotFoundError in served.building/, 2026-08-30). Each bake builds in
 * its own directory and the swap still lands whole trees — last writer wins,
 * both complete. Stale build dirs from crashed bakes are swept when old. */
const buildDir = servedDir + ".building-" + process.pid;
for (const d of readdirSync(dirname(servedDir))) {
  if (!d.startsWith("served.building")) continue;
  const full = join(dirname(servedDir), d);
  try {
    if (Date.now() - statSync(full).mtimeMs > 15 * 60 * 1000) rmSync(full, { recursive: true, force: true });
  } catch { /* another bake owns or already removed it */ }
}
rmSync(buildDir, { recursive: true, force: true });
mkdirSync(buildDir, { recursive: true });
const entries = [];
for (const loc of readdirSync(backdropsDir).sort()) {
  if (loc === "served") continue;                     // the bake's own output
  if (loc === "source") continue;                     // the asset seat's lane
  const dir = join(backdropsDir, loc);
  let st;
  try { st = statSync(dir); } catch { continue; }
  if (!st.isDirectory()) continue;
  for (const f of readdirSync(dir).sort()) {
    const mm = FACING.exec(f);
    if (!mm) continue;
    /* ENCODED, not embedded raw. See the header: 3.4 MB of base64 per wall is
     * 19 seconds of blank page on a slow phone link, and a painting is what
     * JPEG is for. The encoder prints what the encode cost and those numbers
     * ride in this file's own header, so the one place where the page's
     * picture is not byte-identical to the repository's artifact says so in
     * the artifact it produces. */
    mkdirSync(join(buildDir, loc), { recursive: true });
    const jpg = join(buildDir, loc, `${mm[1]}.jpg`);
    const report = JSON.parse(execFileSync("python3",
      [join(root, "tools", "encode-backdrop.py"), join(dir, f), jpg, String(QUALITY)],
      { encoding: "utf8" }).trim());
    const bytes = readFileSync(jpg);
    entries.push({
      key: `${loc}/${mm[1]}`, file: `${loc}/${mm[1]}.jpg`,
      bytes: bytes.length, png_bytes: report.png_bytes,
      max_delta: report.max_channel_delta, mean_delta: report.mean_channel_delta
    });
  }
}

function fnv1a32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}
/* The fingerprint is over the KEYS and the byte counts, not over the base64
 * itself: hashing 3.4 MB of text per bake buys nothing the file's own bytes do
 * not already prove, and the staleness test byte-compares the whole file. */
const fp = fnv1a32(entries.map((e) => `${e.key}:${e.bytes}`).join("\n"));

const body = entries.map((e) =>
  `  ${JSON.stringify(e.key)}: { file: ${JSON.stringify(e.file)}, bytes: ${e.bytes} }`).join(",\n");
const cost = entries.map((e) =>
  `//   ${e.key}: ${(e.png_bytes / 1e6).toFixed(2)} MB of PNG -> ${(e.bytes / 1e3).toFixed(0)} kB of JPEG` +
  ` (q${QUALITY}); channels move by ${e.mean_delta} on average, ${e.max_delta} at worst, of 255.`)
  .join("\n");

const out = `// GENERATED FILE — DO NOT EDIT.
// The one truth lives in backdrops/<location>/<facing>.png, promoted there by
// tools/promote-backdrop.mjs from an ADMITTED candidate. Edit nothing here;
// re-run:
//
//     node tools/bake-backdrops.mjs
//
// [Row 45] THE PIXELS ARE NOT IN THIS FILE. They are one JPEG per wall under
// ${urlPrefix}, fetched by URL by the page, for the wall you are looking at
// and the walls one turn or one step away. This is the manifest: which facings
// have a painting, what each one is called, and what it weighs. A stale
// manifest OR a stale served tree fails the test suite.
//
// ${entries.length} painting(s), ${(entries.reduce((s2, e) => s2 + e.bytes, 0) / 1e6).toFixed(1)} MB served in total,
// heaviest ${(Math.max(0, ...entries.map((e) => e.bytes)) / 1e3).toFixed(0)} kB — and only ONE of them is ever on the
// critical path to a first painted wall.
//
// WHAT THE ENCODE COST, measured by tools/encode-backdrop.py at bake time:
${cost || "//   (none)"}
window.HOLO_BACKDROPS = {
  fp: "${fp}",
  dir: ${JSON.stringify(urlPrefix)},
  paintings: {
${body}
  }
};
`;

/* The swap: two renames, no window in which `served/` is half a tree. */
const oldDir = servedDir + ".old";
rmSync(oldDir, { recursive: true, force: true });
if (existsSync(servedDir)) renameSync(servedDir, oldDir);
renameSync(buildDir, servedDir);
rmSync(oldDir, { recursive: true, force: true });
writeFileSync(outFile, out);
/* [row 33] */
timings.record("bake.backdrops", T0, Date.now() / 1000, null,
  { paintings: entries.length, out_bytes: out.length, fp, served_dir: servedDir,
    png_bytes: entries.reduce((s, e) => s + e.png_bytes, 0),
    jpeg_bytes: entries.reduce((s, e) => s + e.bytes, 0) });
console.log(`baked ${outFile} (fp ${fp}, ${entries.length} painting(s), manifest ` +
  `${(out.length / 1e3).toFixed(1)} kB, served ${(entries.reduce((s2, e) => s2 + e.bytes, 0) / 1e6).toFixed(1)} MB` +
  ` -> ${servedDir})`);
