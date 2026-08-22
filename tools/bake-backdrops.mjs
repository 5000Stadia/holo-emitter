#!/usr/bin/env node
/* bake-backdrops.mjs — embed the promoted paintings into a classic script.
 *
 *   node tools/bake-backdrops.mjs        # backdrops/** -> backdrops/baked.js
 *
 * WHY A BAKE AND NOT AN <img src="backdrops/study/N.png">. A `file://` page
 * drawing a `file://` image taints the canvas in Chromium, and every hash test
 * in this project reads the canvas back — so the picture would be there and
 * nothing could measure it. A `data:` URI does not taint. This is the same
 * reason the fixtures are baked (§12.7 requires `file://`), and the shape is
 * deliberately the same one: the PNGs stay the sole truth, this file is
 * GENERATED, and a staleness test re-bakes to scratch and byte-compares.
 *
 * WHY THE PAGE IS NOT SERVED THE PNG, and what the alternative cost —
 * measured, because the production law asks an improvement to clock as one.
 * Embedded raw, a 2.6 MB PNG is 3.4 MB of base64, and `index.html` holds its
 * first frame until every painting has decoded. An artifact critic measured
 * that on a rate-limited link at 200 KB/s: 17.6-19.0 seconds of blank page
 * with nothing on the surface to explain it, and eight walls would be ~27 MB.
 * At q92 the same painting is 550 kB — 6.3x less, first paint under 4 seconds
 * on that same link — and the encode moves a channel by 1.7 of 255 on average.
 * Those numbers are printed into the generated file per painting, so the one
 * place where the page's picture is not byte-identical to the artifact this
 * repository holds carries its own difference as a number.
 *
 * The PNG remains the promoted artifact and the flip test's own subject; what
 * ships to a browser is this encode of it.
 *
 * The bake reads `backdrops/<loc>/<facing>.png` and NOTHING under
 * `backdrops/source/`: a candidate is not a backdrop until it is promoted, and
 * the promotion is where the gate is.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, mkdtempSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const argOf = (flag, dflt) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : dflt;
};
const backdropsDir = argOf("--backdrops-dir", join(root, "backdrops"));
const outFile = argOf("--out", join(backdropsDir, "baked.js"));

const FACING = /^([NESW])\.png$/;
/* q92: the knee of the curve on these paintings — 550 kB against 628 kB at 94
 * and 467 kB at 90, with a mean channel delta of 1.7 of 255. Changing it
 * changes what every visitor sees, so it is a number with a home rather than a
 * literal in a call. */
const QUALITY = 92;
const entries = [];
for (const loc of readdirSync(backdropsDir).sort()) {
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
    const scratch = mkdtempSync(join(tmpdir(), "holo-encode-"));
    try {
      const jpg = join(scratch, "b.jpg");
      const report = JSON.parse(execFileSync("python3",
        [join(root, "tools", "encode-backdrop.py"), join(dir, f), jpg, String(QUALITY)],
        { encoding: "utf8" }).trim());
      const bytes = readFileSync(jpg);
      entries.push({
        key: `${loc}/${mm[1]}`, b64: bytes.toString("base64"),
        bytes: bytes.length, png_bytes: report.png_bytes,
        max_delta: report.max_channel_delta, mean_delta: report.mean_channel_delta
      });
    } finally {
      rmSync(scratch, { recursive: true, force: true });
    }
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
  `  ${JSON.stringify(e.key)}: { src: "data:image/jpeg;base64,${e.b64}" }`).join(",\n");
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
// This file exists only because a file:// page drawing a file:// image taints
// the canvas in Chromium, and every hash test reads the canvas back. A stale
// bake fails the test suite.
//
// ${entries.length} painting(s), ${entries.map((e) => e.key).join(", ") || "none"}.
//
// WHAT THE ENCODE COST, measured by tools/encode-backdrop.py at bake time:
${cost || "//   (none)"}
window.HOLO_BACKDROPS = {
  fp: "${fp}",
  images: {
${body}
  }
};
`;

writeFileSync(outFile, out);
console.log(`baked ${outFile} (fp ${fp}, ${entries.length} painting(s), ${(out.length / 1e6).toFixed(2)} MB)`);
