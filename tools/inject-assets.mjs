#!/usr/bin/env node
/* inject-assets.mjs SITE_DIR MANIFEST.json VERSION — PUBLISHED COPY ONLY.
 * Prepends the manifest to SITE_DIR/src/make/assets.js (src/make/assets.js in the repo
 * is untouched) and adds <script src=".../src/make/assets.js?v=VERSION"> to every
 * published page, as early as possible (after <meta charset>, else after <head>)
 * so it is in place before any module script fetches. See tools/asset-manifest.mjs. */
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, relative, sep, dirname } from "node:path";
const [site, manifestFile, ver = "0"] = process.argv.slice(2);
if (!site || !manifestFile) { console.error("usage: inject-assets.mjs SITE_DIR MANIFEST.json [VERSION]"); process.exit(2); }
const manifest = readFileSync(manifestFile, "utf8").trim();
JSON.parse(manifest);
const target = join(site, "src", "make", "assets.js");
writeFileSync(target, "globalThis.HOLO_ASSET_MANIFEST = " + manifest + ";\n" + readFileSync(target, "utf8"));
let n = 0, skipped = 0;
(function walk(d) {
  for (const name of readdirSync(d)) {
    const p = join(d, name);
    if (name === ".git" || name === "godot-web") continue;
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!/\.html?$/i.test(name)) continue;
    const html = readFileSync(p, "utf8");
    const up = relative(dirname(p), site).split(sep).filter(Boolean).map(() => "..").join("/");
    const tag = `<script src="${up ? up + "/" : ""}src/make/assets.js?v=${ver}"></script>`;
    let out = null;
    const meta = html.match(/<meta[^>]+charset[^>]*>/i), head = html.match(/<head(\s[^>]*)?>/i);
    if (meta && (!head || meta.index > head.index)) out = html.slice(0, meta.index + meta[0].length) + tag + html.slice(meta.index + meta[0].length);
    else if (head) out = html.slice(0, head.index + head[0].length) + tag + html.slice(head.index + head[0].length);
    if (out === null) { skipped++; continue; }
    writeFileSync(p, out); n++;
  }
})(site);
console.error(`inject-assets: manifest prepended; script tag added to ${n} page(s), ${skipped} without a <head> left alone`);
