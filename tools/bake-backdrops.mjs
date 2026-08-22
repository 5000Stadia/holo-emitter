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
 * WHAT IT COSTS, measured rather than asserted, because the production law
 * asks an improvement to clock as one: a 2.6 MB PNG becomes 3.4 MB of base64,
 * and eight facings would be ~27 MB of JavaScript the page parses before it
 * paints. One facing is what row 21 promotes and 3.4 MB is what it costs. The
 * lever, when the eighth wall lands, is a lossy encode — a q92 JPEG of a
 * painting is about a seventh of the bytes — and taking it means deciding
 * whether the flip test may judge a picture the repository does not hold. That
 * is a fork for the row that promotes the rest, and it is named here rather
 * than sprung on it.
 *
 * The bake reads `backdrops/<loc>/<facing>.png` and NOTHING under
 * `backdrops/source/`: a candidate is not a backdrop until it is promoted, and
 * the promotion is where the gate is.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const argOf = (flag, dflt) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : dflt;
};
const backdropsDir = argOf("--backdrops-dir", join(root, "backdrops"));
const outFile = argOf("--out", join(backdropsDir, "baked.js"));

const FACING = /^([NESW])\.png$/;
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
    const png = readFileSync(join(dir, f));
    entries.push({ key: `${loc}/${mm[1]}`, b64: png.toString("base64"), bytes: png.length });
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
  `  ${JSON.stringify(e.key)}: { src: "data:image/png;base64,${e.b64}" }`).join(",\n");

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
window.HOLO_BACKDROPS = {
  fp: "${fp}",
  images: {
${body}
  }
};
`;

writeFileSync(outFile, out);
console.log(`baked ${outFile} (fp ${fp}, ${entries.length} painting(s), ${(out.length / 1e6).toFixed(2)} MB)`);
