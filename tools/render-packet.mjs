#!/usr/bin/env node
// Export paintover render packets from the zero-asset room (lab/painted), one per painting camera.
//   node tools/render-packet.mjs [room=muniment_room] [--scales 1,2] [--url http://host:port/lab/painted/]
// Writes lab/painted/<room>/packet/<scale>x/<F>/raw/*, then tools/render-packet.py turns raw into the
// contract's PNGs, masks and camera.json. Contract: holo-emitter-codex, 2026-09-28 (see lab/painted/NOTES.md).
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const room = args.find(a => !a.startsWith("--") && !args[args.indexOf(a) - 1]?.startsWith("--")) || "muniment_room";
const scales = opt("--scales", "1,2").split(",").map(Number);
const url = opt("--url", "http://192.168.68.58:8793/lab/painted/");

const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 1536, height: 1024 } });
p.on("pageerror", e => console.error("page:", e.message));
await p.goto(`${url}?room=${room}&mode=code`, { waitUntil: "networkidle" });
await p.waitForFunction(() => window.__ok, null, { timeout: 180000 });
p.setDefaultTimeout(600000);
for (const scale of scales) for (const F of ["N", "E", "S", "W"]) {
  const t0 = Date.now();
  const out = await p.evaluate(([F, s]) => window.__packet(F, s), [F, scale]);
  const dir = join(root, "lab/painted", room, "packet", `${scale}x`, F, "raw");
  mkdirSync(dir, { recursive: true });
  for (const [k, v] of Object.entries(out.passes)) writeFileSync(join(dir, `${k}.png`), Buffer.from(v.split(",")[1], "base64"));
  for (const k of ["depth_f32", "normal_f32", "world_f32", "hit_f32", "instance_u8", "material_u8"]) writeFileSync(join(dir, `${k}.bin`), Buffer.from(out[k], "base64"));
  writeFileSync(join(dir, "meta.json"), JSON.stringify({ camera: out.camera, ids: out.ids }, null, 1));
  console.log(`${scale}x ${F}: ${Date.now() - t0} ms`);
}
await b.close();
execFileSync(join(root, ".venv-shell/bin/python"), [join(root, "tools/render-packet.py"), join(root, "lab/painted", room, "packet")], { stdio: "inherit" });
