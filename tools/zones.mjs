#!/usr/bin/env node
// Zone-by-zone light: the painted shell against the code room, from each painting's camera.
//   node tools/zones.mjs [room=muniment_room] [--code v1|v2] [--url ...]
// Renders the packet passes (tools/render-packet.mjs's page hook) at 1x, then tools/zones.py splits
// each view into zones by the code room's own instance ids (ceiling, target wall, left/right returns,
// floor near/far, windows, doors, fireplace) and compares low-pass luminance per zone.
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const room = args.find(a => !a.startsWith("--") && !args[args.indexOf(a) - 1]?.startsWith("--")) || "muniment_room";
const code = opt("--code", "v2"), url = opt("--url", "http://192.168.68.58:8793/lab/painted/");
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 1536, height: 1024 } });
await p.goto(`${url}?room=${room}&mode=${code}&code=${code}&fresh`, { waitUntil: "networkidle" });
await p.waitForFunction(() => window.__ok, null, { timeout: 180000 });
p.setDefaultTimeout(600000);
const outDir = join(root, "lab/painted", room, "zones", code);
for (const F of ["N", "E", "S", "W"]) {
  const out = await p.evaluate(f => window.__packet(f, 1), F);
  const dir = join(outDir, F); mkdirSync(dir, { recursive: true });
  for (const k of ["beauty_lit", "painted"]) writeFileSync(join(dir, `${k}.png`), Buffer.from(out.passes[k].split(",")[1], "base64"));
  for (const k of ["depth_f32", "instance_u8", "hit_f32"]) writeFileSync(join(dir, `${k}.bin`), Buffer.from(out[k], "base64"));
  writeFileSync(join(dir, "meta.json"), JSON.stringify({ camera: out.camera, ids: out.ids }));
}
await b.close();
execFileSync(join(root, ".venv-shell/bin/python"), [join(root, "tools/zones.py"), outDir], { stdio: "inherit" });
