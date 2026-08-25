#!/usr/bin/env node
/* bake-library.mjs — embed the ingested library into a classic script.
 *
 *   node tools/bake-library.mjs        # library/<id>/** -> library/baked.js
 *
 * THE LIBRARY IS THE REPLICATOR'S OUTPUT AND THE PAGE HAS NEVER READ IT. Row 3
 * ingested the corpus desk to `library/desk-joined-oak-1660/` and stopped
 * there: `index.html` builds its whole sprite table from
 * `src/placeholders.js`, so every pixel on the page was procedural and the one
 * real record sat on disk unread. Row 42 puts two REAL sprites in the frames
 * the paintings measured, and this is the wire between the two halves.
 *
 * WHY A BAKE AND NOT `fetch("library/<id>/record.json")`. The same reason the
 * backdrops are baked (`tools/bake-backdrops.mjs`, and §12.7 requires
 * `file://`): a file:// page cannot fetch, and a file:// image drawn to a
 * canvas taints it in Chromium while every hash test in this project reads the
 * canvas back. A `data:` URI does neither.
 *
 * WHY PNG AND NOT THE BACKDROP BAKE'S JPEG. A sprite is ALPHA — the casement's
 * whole point is that its quarries are holes — and JPEG has no alpha channel.
 * The contract's stored-resolution policy is what bounds the cost instead:
 * `ingest.output.max_content_height_px` is 384 and its own basis names this
 * bake as the reason ("row 4's route is a bake embedding library PNGs as
 * data: URIs in a document that must load from file:// with zero network
 * requests, where every stored pixel is base64-inflated into the page, and
 * this cap is what bounds it").
 *
 * The PNGs and record.jsons stay the sole truth; this file is GENERATED and a
 * staleness test re-bakes to scratch and byte-compares.
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
const libDir = argOf("--library-dir", join(root, "library"));
const outFile = argOf("--out", join(libDir, "baked.js"));

const uri = (p) => `data:image/png;base64,${readFileSync(p).toString("base64")}`;
const isDir = (p) => { try { return statSync(p).isDirectory(); } catch { return false; } };
const isFile = (p) => { try { return statSync(p).isFile(); } catch { return false; } };

/* PROMOTION, and it is not the same act as passing the gates. `library/<id>/`
 * holds everything the replicator has ever certified; `library/promoted.json`
 * says which of those the product draws, and this bake carries only those. The
 * separation is `backdrops/source/`'s: an admissible artifact is not yet the
 * thing a visitor sees, and the second act is where a human's eye goes. */
const promotion = JSON.parse(readFileSync(join(libDir, "promoted.json"), "utf8"));
const promoted = promotion.promoted;

const entries = [];
for (const id of promoted) {
  const dir = join(libDir, id);
  if (!isDir(dir)) {
    console.error(`bake refused: promoted.json names ${JSON.stringify(id)} and ` +
      `${dir} does not exist`);
    process.exit(1);
  }
  const recPath = join(dir, "record.json");
  const spritePath = join(dir, "sprite.png");
  if (!isFile(recPath) || !isFile(spritePath)) {
    console.error(`bake refused: ${dir} has no record.json and sprite.png pair`);
    process.exit(1);
  }
  const record = JSON.parse(readFileSync(recPath, "utf8"));
  if (record.id !== id) {
    console.error(`bake refused: ${recPath} declares id ${JSON.stringify(record.id)} ` +
      `but sits in a directory named ${JSON.stringify(id)}`);
    process.exit(1);
  }
  const images = { body: uri(spritePath) };
  let bytes = statSync(spritePath).size;
  for (const [field, sub] of [["parts", "parts"], ["states_images", "states"]]) {
    const decl = record[field];
    if (!decl) continue;
    const list = field === "parts" ? decl.map((p) => p.id) : Object.keys(decl);
    for (const name of list) {
      const p = join(dir, sub, `${name}.png`);
      if (!isFile(p)) {
        console.error(`bake refused: ${recPath} declares ${field}.${name} and ` +
          `${p} does not exist`);
        process.exit(1);
      }
      images[sub] = images[sub] || {};
      images[sub][name] = uri(p);
      bytes += statSync(p).size;
    }
  }
  const thumbPath = join(dir, "thumb.png");
  if (record.thumb && isFile(thumbPath)) {
    images.thumb = uri(thumbPath);
    bytes += statSync(thumbPath).size;
  }
  entries.push({ id, record, images, bytes });
}

function fnv1a32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}
/* Over the ids, the record bytes and the PNG byte counts — the same shape the
 * backdrop bake's fingerprint takes, and for the same reason: the staleness
 * test byte-compares the whole file, so hashing the base64 buys nothing. */
const fp = fnv1a32(entries.map(
  (e) => `${e.id}:${e.bytes}:${JSON.stringify(e.record).length}`).join("\n"));

const records = entries.map(
  (e) => `    ${JSON.stringify(e.id)}: ${JSON.stringify(e.record, null, 6)
    .split("\n").join("\n    ")}`).join(",\n");
const images = entries.map((e) => {
  const parts = [`      body: "${e.images.body}"`];
  for (const sub of ["parts", "states"]) {
    if (!e.images[sub]) continue;
    parts.push(`      ${sub}: {\n` + Object.keys(e.images[sub]).sort().map(
      (k) => `        ${JSON.stringify(k)}: "${e.images[sub][k]}"`).join(",\n") + "\n      }");
  }
  if (e.images.thumb) parts.push(`      thumb: "${e.images.thumb}"`);
  return `    ${JSON.stringify(e.id)}: {\n${parts.join(",\n")}\n    }`;
}).join(",\n");

const manifest = entries.map(
  (e) => `//   ${e.id}: ${e.record.px.w}x${e.record.px.h} px, ${e.bytes} bytes of PNG, ` +
    `light ${JSON.stringify(e.record.light)}, archetype ${e.record.archetype}`).join("\n");

const out = `// GENERATED FILE — DO NOT EDIT.
// The one truth lives in library/<id>/record.json and library/<id>/**.png,
// written there by \`python3 -m replicator.ingest\`. Edit nothing here; re-run:
//
//     node tools/bake-library.mjs
//
// This file exists only because a file:// page cannot fetch and a file:// image
// drawn to a canvas taints it in Chromium, while every hash test reads the
// canvas back. A stale bake fails the test suite.
//
// ${entries.length} record(s):
${manifest || "//   (none)"}
(function () {
  "use strict";
  var L = {
    fp: "${fp}",
    records: {
${records}
    },
    images: {
${images}
    }
  };
  if (typeof window !== "undefined") window.HOLO_LIBRARY = L;
  if (typeof module !== "undefined" && module.exports) module.exports = L;
})();
`;

writeFileSync(outFile, out);
console.log(`baked ${outFile} (fp ${fp}, ${entries.length} record(s), ` +
  `${(out.length / 1e6).toFixed(2)} MB)`);
