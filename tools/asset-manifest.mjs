#!/usr/bin/env node
/* asset-manifest.mjs — which heavy files of a publish can be served by jsDelivr.
 *
 * Usage: node tools/asset-manifest.mjs SITE_DIR [--min-kb 128] [--no-verify] > assets.json
 *
 * [Kabe, gate g8dfd99, 2026-10-07] GitHub Pages stays for the pages; the heavy
 * files (paintings, meshes, big images/data) come from
 *   https://cdn.jsdelivr.net/gh/5000Stadia/holo-emitter@<sha>/<path>
 * Pages caps its cache at 10 minutes and has no Brotli; jsDelivr serves GitHub
 * files for a year, immutable, Brotli, HTTP/3.
 *
 * WHICH SHA. Not HEAD: the last commit that TOUCHED the file. A file nobody
 * changed keeps one URL across every publish, so a visitor's cache survives
 * publishes instead of being invalidated by each new HEAD.
 *
 * WHICH FILES. A file is listed only when jsDelivr can really serve exactly the
 * bytes this publish ships:
 *   - it is in SITE_DIR with an extension a page fetches as data (not .js/.html:
 *     those are named by script tags and import statements, the loader cannot
 *     remap them),
 *   - it is >= --min-kb and under jsDelivr's 20 MB per-file limit,
 *   - the working-tree bytes equal the blob committed at that sha (an edited,
 *     untracked or ignored file stays on Pages),
 *   - the sha is an ancestor of origin/main (jsDelivr reads GitHub),
 *   - and, unless --no-verify, one HEAD per distinct sha answers 200 (the
 *     rest of that group is dropped otherwise). A dropped file is not an error:
 *     the page falls back to the Pages URL it always had.
 *
 * Output (stdout): {"v":1,"cdn":"https://cdn.jsdelivr.net/gh/5000Stadia/holo-emitter@",
 *   "groups":{"<sha>":["path",...]},"count":N,"bytes":N}   — paths are repo-relative,
 * which is also the path under the site root. Notes go to stderr. */
import { readdirSync, statSync, readFileSync } from "node:fs";
import { join, relative, extname } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const site = args.find(a => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--min-kb");
const mi = args.indexOf("--min-kb");
const minKB = mi >= 0 ? +args[mi + 1] : 128;
const verify = !args.includes("--no-verify");
if (!site) { console.error("usage: asset-manifest.mjs SITE_DIR [--min-kb N] [--no-verify]"); process.exit(2); }
const CDN = "https://cdn.jsdelivr.net/gh/5000Stadia/holo-emitter@";
const EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".glb", ".gltf", ".bin", ".wasm", ".ktx2", ".json", ".mp3", ".ogg", ".wav", ".pck"]);
const MAX = 19.5 * 1024 * 1024;
const git = (a, input) => execFileSync("git", a, { encoding: "utf8", input, maxBuffer: 1 << 28 });

const cands = [];
(function walk(d) {
  for (const n of readdirSync(d)) {
    if (n === ".git") continue;
    const p = join(d, n), s = statSync(p);
    if (s.isDirectory()) walk(p);
    else if (EXT.has(extname(n).toLowerCase()) && s.size >= minKB * 1024 && s.size <= MAX) cands.push({ path: relative(site, p), abs: p, size: s.size });
  }
})(site);

// tracked? (ignored/untracked files have no commit to point at)
const tracked = new Set(git(["ls-files", "-z"]).split("\0").filter(Boolean));
let list = cands.filter(c => tracked.has(c.path));

// bytes shipped == bytes committed at HEAD? (an edited file stays on Pages)
const head = !list.length ? [] : git(["hash-object", "--stdin-paths"], list.map(c => c.abs).join("\n") + "\n").trim().split("\n");
list.forEach((c, i) => { c.blob = head[i]; });
const inHead = new Map(!list.length ? [] : git(["ls-tree", "-r", "HEAD", "--", ...list.map(c => c.path)]).split("\n").filter(Boolean)
  .map(l => { const m = l.match(/^\d+ blob (\w+)\t(.*)$/); return [m[2], m[1]]; }));
list = list.filter(c => inHead.get(c.path) === c.blob);

// last commit that touched each path, on a history that origin/main contains
spawnSync("git", ["fetch", "-q", "origin", "main"], { stdio: "ignore" });
let base = "origin/main";
try { git(["rev-parse", "--verify", "-q", base]); } catch { console.error("asset-manifest: no origin/main; nothing listed"); list = []; }
const want = new Set(list.map(c => c.path)), last = new Map();
if (list.length) {
  let cur = null;
  for (const line of git(["-c", "core.quotepath=off", "log", "--format=%x00%H", "--name-only", "--diff-filter=AM", base, "--", ...list.map(c => c.path)]).split("\n")) {
    if (line.startsWith("\0")) cur = line.slice(1);
    else if (line && want.has(line) && !last.has(line)) last.set(line, cur);
  }
}
// the commit must hold exactly this blob (a later revert-and-restore could differ)
const chk = list.filter(c => last.has(c.path));
const got = git(["cat-file", "--batch-check=%(objectname)"], chk.map(c => `${last.get(c.path)}:${c.path}`).join("\n") + "\n").trim().split("\n");
const groups = {};
let bytes = 0, count = 0;
chk.forEach((c, i) => { if (got[i] === c.blob) { (groups[last.get(c.path)] ||= []).push(c.path); bytes += c.size; count++; } });

// does jsDelivr serve each group? (also warms its cache)
if (verify) {
  for (const [sha, paths] of Object.entries(groups)) {
    const url = CDN + sha + "/" + paths[0];
    let ok = false;
    for (let t = 0; t < 2 && !ok; t++) {
      const r = spawnSync("curl", ["-s", "-o", "/dev/null", "-m", "30", "-w", "%{http_code}", "-I", url], { encoding: "utf8" });
      ok = r.stdout.trim() === "200";
    }
    if (!ok) { console.error(`asset-manifest: ${sha.slice(0, 8)} not served by jsDelivr (${paths.length} files stay on Pages)`); count -= paths.length; delete groups[sha]; }
  }
  bytes = Object.values(groups).flat().reduce((a, p) => a + statSync(join(site, p)).size, 0);
}
for (const k of Object.keys(groups)) groups[k].sort();
console.error(`asset-manifest: ${count} of ${cands.length} candidate files (${(bytes / 1e6).toFixed(1)} MB) on jsDelivr, ${Object.keys(groups).length} commit(s)`);
process.stdout.write(JSON.stringify({ v: 1, cdn: CDN, groups, count, bytes }) + "\n");
