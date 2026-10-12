// The tables a load need not work out (src/make/keep.js), worked out at authoring for our own places and shipped beside
// the page: the kinds' sizes and swings (lab/manor/kept/sizes.json), measured by loading each place in one browser and
// taking the union it kept, and each place's placement (lab/manor/kept/place-<plan>.json). Run after changing a kind, a part or the builder; the suite says when a table is stale
// (tests/playwright/keep.spec.mjs), and a stale one only costs the old load time.
//   node tools/keep-tables.mjs [port]
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), ".."), PORT = process.argv[2] || "8786";
const PLACES = ["", "case=case-1660", "plan=banqueting", "plan=alice-hall"];
const srv = spawn("python3", ["-m", "http.server", PORT, "--bind", "127.0.0.1"], { cwd: ROOT, stdio: "ignore" });
await new Promise(r => setTimeout(r, 800));
const dir = mkdtempSync(join(tmpdir(), "keep-")), ctx = await chromium.launchPersistentContext(dir, { args: ["--use-angle=vulkan", "--enable-unsafe-webgpu", "--ignore-gpu-blocklist"] });
try {
  let sig = null, table = null;
  for (const q of PLACES) { const p = await ctx.newPage();
    await p.goto(`http://127.0.0.1:${PORT}/lab/manor/?${q}&still=0&fresh&keep=fresh`, { timeout: 300000 }); await p.waitForFunction(() => window.__ok && window.__whole !== false, null, { timeout: 300000 });
    const r = await p.evaluate(() => { const k = window.__sizesKept; return { sig: k.sig, t: JSON.parse(localStorage.getItem("holo/keep/sizes") || "null"), plan: k.plan, placeSig: k.placeSig, place: JSON.parse(localStorage.getItem(`holo/keep/place/${k.plan}`) || "null") }; });
    if (r.place?.sig === r.placeSig) { writeFileSync(join(ROOT, `lab/manor/kept/place-${r.plan}.json`), JSON.stringify({ sig: r.placeSig, made: new Date().toISOString().slice(0, 10), place: q || "manor", data: r.place.data }) + "\n"); console.log(`  wrote lab/manor/kept/place-${r.plan}.json`); }
    if (sig && r.sig !== sig) throw new Error(`places disagree on the signature: ${sig} vs ${r.sig} (${q})`);
    // (each place measured afresh keeps only its own: the union is taken here)
    sig = r.sig; table = { sizes: { ...table?.sizes, ...r.t?.data?.sizes }, sweeps: { ...table?.sweeps, ...r.t?.data?.sweeps } };
    console.log(`${q || "manor"}: ${Object.keys(table.sizes).length} sizes, ${Object.keys(table.sweeps).length} swings so far`); await p.close(); }
  writeFileSync(join(ROOT, "lab/manor/kept/sizes.json"), JSON.stringify({ sig, made: new Date().toISOString().slice(0, 10), data: table }) + "\n");
  console.log(`wrote lab/manor/kept/sizes.json (${sig})`);
} finally { await ctx.close(); srv.kill(); rmSync(dir, { recursive: true, force: true }); }
