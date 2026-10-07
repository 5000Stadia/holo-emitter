// Check 25 (PROTOTYPE, not in the test list: Kabe vets a check before it joins): the outdoor procedural textures against the
// two rules (Kabe, 2026-10-07, after the ashlar's rain streaks ran through every course and its tile repeated every 2 m):
//   1. a material is drawn from its construction: units first (blocks, boards, slates, bricks, pebbles, stones), every mark
//      inside a unit or tied to the building, never a long straight mark running unbroken across many joints;
//   2. a texture repeats no oftener than its viewing distance allows (walls 4 m, roofs 4 m, ground 8 m), or its variation
//      is per unit / by slow tone fields that never repeat in that distance.
// (a) the numbers, in milliseconds a texture, read from the pixels of the canvases lab/scale/materials.html builds:
//     streaks   the longest unbroken run of dark (or light) pixels, against its surroundings, down a column (across courses)
//               or along a row (across the units of a course, bed joints at a declared course height excepted), in courses
//               (a flag from 3 courses or, where there are none, a quarter of the tile)
//     repeat    the metres one tile covers (uv unit / repeat, from the page's declaration of where the texture is used)
//               against the role's minimum; a tile that covers less passes only with declared slow tone fields (macro) whose
//               own periods, taken together, reach the minimum
//     seam      the step across the wrap (first column against the last) over the typical step between neighbours
// (b) the material panels: every material on a 10 m flat square (wall upright, roof pitched, ground flat) at 2, 10 and 40 m,
//     saved as PNGs for the eye (--panels; the page's `__panel(id, metres)`).
//   node tools/check-textures.mjs [--out DIR] [--base URL] [--panels] [--selftest] [--json]
//   --selftest also runs the detector on a synthetic streaky wall (must flag) and a clean one (must pass).
//   exit 1 if anything is flagged. Needs the static server (http://localhost:8794) and playwright; GPU for the panels.
import { chromium } from "playwright";
import fs from "node:fs";

const argv = process.argv.slice(2), has = (f) => argv.includes(f), val = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const out = val("--out", "/tmp/check-textures"), base = val("--base", "http://localhost:8794"), MIN = { wall: 4, roof: 4, ground: 8, timber: 0, glass: 0 };
fs.mkdirSync(out, { recursive: true });

// ---- the analysis, run in the page (passed as source): everything below `analyse` is plain JS over the canvas's pixels
function analyse(t, MINM) {
  const c = t.canvas, W0 = c.width, H0 = c.height, t0 = performance.now();
  const px = c.getContext("2d").getImageData(0, 0, W0, H0).data;
  // luminance, boxed down to about 512 px (a streak across three courses is long at any size)
  const f = Math.max(1, Math.floor(Math.min(W0, H0) / 512)), W = (W0 / f) | 0, H = (H0 / f) | 0, L = new Float32Array(W * H), ff = f * f;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let s = 0; for (let j = 0; j < f; j++) for (let i = 0; i < f; i++) { const o = ((y * f + j) * W0 + x * f + i) * 4; s += 0.299 * px[o] + 0.587 * px[o + 1] + 0.114 * px[o + 2]; } L[y * W + x] = s / ff; }
  // high-pass: each pixel against the mean of its (2r + 1) square, wrapping; two running-sum passes
  const r = 3, tmp = new Float32Array(W * H), D = new Float32Array(W * H), q = 1 / (2 * r + 1);
  for (let y = 0; y < H; y++) { let s = 0; for (let k = -r; k <= r; k++) s += L[y * W + ((k + W) % W)];
    for (let x = 0; x < W; x++) { tmp[y * W + x] = s * q; s += L[y * W + ((x + r + 1) % W)] - L[y * W + ((x - r + W) % W)]; } }
  for (let x = 0; x < W; x++) { let s = 0; for (let k = -r; k <= r; k++) s += tmp[((k + H) % H) * W + x];
    for (let y = 0; y < H; y++) { D[y * W + x] = L[y * W + x] - s * q; s += tmp[((y + r + 1) % H) * W + x] - tmp[((y - r + H) % H) * W + x]; } }
  let sd = 0; for (let i = 0; i < W * H; i++) sd += D[i] * D[i]; sd = Math.sqrt(sd / (W * H)) || 1;
  const thr = 0.5 * sd, gap = 2;
  // the longest run of same-sign pixels beyond thr (a gap of up to `gap` quiet pixels forgiven; a pixel of the opposite sign, a joint, always breaks it), down every column and along every row, wrapping once
  const courseH = t.course ? H / t.course : 0, colLen = courseH ? 4 * courseH : H / 4, rowLen = W / 4;     // a flag from more than 3 courses; with none, a quarter of the tile
  const colBest = new Int32Array(W), rowBest = new Int32Array(H);
  if (t.grain !== "y") { const cur = new Int32Array(W), miss = new Int8Array(W), sg = new Int8Array(W);
    for (let yy = 0; yy < 2 * H; yy++) { const o = (yy >= H ? yy - H : yy) * W;
      for (let x = 0; x < W; x++) { const v = D[o + x], s = v > thr ? 1 : v < -thr ? -1 : 0;
        if (s !== 0 && (sg[x] === 0 || s === sg[x])) { sg[x] = s; cur[x] += 1 + miss[x]; miss[x] = 0; if (cur[x] > colBest[x]) colBest[x] = cur[x]; }
        else if (sg[x] !== 0 && (s !== 0 || ++miss[x] > gap)) { sg[x] = s; cur[x] = s ? 1 : 0; miss[x] = 0; } } } }
  // rows only where there are no courses (in a coursed texture a row's long mark is a bed joint, the construction itself)
  if (t.grain !== "x" && !courseH) for (let y = 0; y < H; y++) { let cur = 0, miss = 0, sg = 0, best = 0; const o = y * W;
    for (let xx = 0; xx < 2 * W; xx++) { const v = D[o + (xx >= W ? xx - W : xx)], s = v > thr ? 1 : v < -thr ? -1 : 0;
      if (s !== 0 && (sg === 0 || s === sg)) { sg = s; cur += 1 + miss; miss = 0; if (cur > best) best = cur; } else if (sg !== 0 && (s !== 0 || ++miss > gap)) { sg = s; cur = s ? 1 : 0; miss = 0; } }
    rowBest[y] = best; }
  const marks = (best, len) => { const m = []; for (let i = 0; i < best.length; i++) if (Math.min(best[i], i < 0 ? 0 : len * 100) >= len && best[i] >= len) { const l = m[m.length - 1]; if (l && i - l.last <= 2) { l.last = i; l.n = Math.max(l.n, best[i]); } else m.push({ first: i, last: i, n: best[i] }); } return m; };
  const cm = marks(colBest, colLen), rm = marks(rowBest, rowLen);
  // the seam: the step across the wrap against the biggest step anywhere inside (a joint's step is the construction; a seam's must not exceed it)
  const stepX = new Float32Array(W), stepY = new Float32Array(H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.abs(L[y * W + x] - L[y * W + (x + 1) % W]); stepX[x] += d / H; stepY[y] += Math.abs(L[y * W + x] - L[((y + 1) % H) * W + x]) / W; }
  let mx = 1e-3, my = 1e-3; for (let i = 0; i < W - 1; i++) mx = Math.max(mx, stepX[i]); for (let i = 0; i < H - 1; i++) my = Math.max(my, stepY[i]);
  const seamX = stepX[W - 1] / mx, seamY = stepY[H - 1] / my, seam = Math.max(seamX, seamY), seamBad = seam > 1.75 && Math.max(stepX[W - 1], stepY[H - 1]) > 3;
  // repeat: the metres one tile covers against the role's minimum; slow tone fields of declared periods together (their lcm) may make up the rest
  const tileM = t.uv / t.repeat, gcd = (x, y) => y ? gcd(y, x % y) : x, macroM = t.macro && t.macro.length ? t.macro.reduce((a, b) => a * b / gcd(a, b)) : 0, min = MINM[t.role] ?? 0, repeatOk = tileM >= min || macroM >= min;
  const flags = [];
  if (cm.length) flags.push(`${cm.length} column mark(s) unbroken for ${(Math.max(...cm.map((m) => m.n)) / (courseH || H / 4)).toFixed(1)} ${courseH ? "courses" : "quarter-tiles"} at most`);
  if (rm.length) flags.push(`${rm.length} row mark(s) unbroken for ${(Math.max(...rm.map((m) => m.n)) / (W / 4)).toFixed(1)} quarter-tiles at most`);
  if (!repeatOk) flags.push(`repeats every ${tileM.toFixed(2)} m, a ${t.role} wants ${min} m`);
  if (seamBad) flags.push(`seam ${seam.toFixed(1)}x the biggest inner step`);
  return { id: t.id, role: t.role, px: `${W0}x${H0}`, tileM: +tileM.toFixed(2), macroM: macroM || null, min, colMarks: cm.length, rowMarks: rm.length, where: { cols: cm.slice(0, 4).map((m) => [Math.round(m.first * f), Math.round(m.n * f)]), rows: rm.slice(0, 4).map((m) => [Math.round(m.first * f), Math.round(m.n * f)]) }, seam: +seam.toFixed(2), flags, ms: +(performance.now() - t0).toFixed(1) };
}

// ---- the self-test's textures: a coursed wall with full-height rain streaks through every course (the ashlar's first drawing)
// and the same without; each 1024 px, 13 courses, a unit of 0.4-0.9 m at 256 px a metre
function synth(streaks) {
  let s = 12345; const r = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  const N = 1024, cv = document.createElement("canvas"); cv.width = cv.height = N; const g = cv.getContext("2d"); g.fillStyle = "#d2c8b2"; g.fillRect(0, 0, N, N); const h = N / 13;
  for (let i = 0; i < 13; i++) { const ws = []; let tot = 0; while (tot < N - 100) { const w = (0.4 + r() * 0.5) * 256; ws.push(w); tot += w; } let x = r() * N;    // fitted to the width, started anywhere, so the course wraps
    for (const w0 of ws) { const w = w0 * N / tot, t = 168 + r() * 22; g.fillStyle = `rgb(${t | 0},${(t - 6) | 0},${(t - 26) | 0})`; for (const ox of [0, -N]) g.fillRect((x % N) + ox + 1.5, i * h + 1.5, w - 3, h - 3); x += w; } }
  if (streaks) for (let k = 0; k < 30; k++) { g.fillStyle = `rgba(60,55,45,${0.1 + r() * 0.2})`; g.fillRect(r() * N, 0, 2 + r() * 4, N); }
  return { id: streaks ? "synthetic streaky wall" : "synthetic clean wall", role: "wall", canvas: cv, repeat: 0.5, uv: 2, grain: null, course: 13, macro: null };
}

const hasGPU = process.env.GPU !== "0";
const b = await chromium.launch({ args: hasGPU ? ["--use-angle=vulkan", "--enable-features=Vulkan", "--enable-unsafe-webgpu", "--ignore-gpu-blocklist"] : ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 1280, height: 720 } }), errs = [];
p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 200)); });
await p.goto(`${base}/lab/scale/materials.html?dpr=1${hasGPU ? "" : "&webgl=1"}`, { timeout: 300000 });
await p.waitForFunction(() => window.__ok, null, { timeout: 300000 });
const fnSrc = analyse.toString(), synthSrc = synth.toString();
const results = await p.evaluate(([src, MINM]) => { const f = new Function("return " + src)(); return window.__textures.map((t) => f(t, MINM)); }, [fnSrc, MIN]);
const built = await p.evaluate(() => window.__buildMs);
let self = null;
if (has("--selftest")) self = await p.evaluate(([src, ssrc, MINM]) => { const f = new Function("return " + src)(), s = new Function("return " + ssrc)(); return [s(true), s(false)].map((t) => f(t, MINM)); }, [fnSrc, synthSrc, MIN]);

const pad = (v, n) => String(v).padEnd(n);
console.log(pad("texture", 10), pad("role", 7), pad("tile px", 10), pad("tile m", 7), pad("macro m", 8), pad("min m", 6), pad("cols", 5), pad("rows", 5), pad("seam", 6), pad("ms", 6), "flags");
for (const r of results) console.log(pad(r.id, 10), pad(r.role, 7), pad(r.px, 10), pad(r.tileM, 7), pad(r.macroM ?? "-", 8), pad(r.min, 6), pad(r.colMarks, 5), pad(r.rowMarks, 5), pad(r.seam, 6), pad(r.ms, 6), r.flags.length ? "FLAG: " + r.flags.join("; ") : "ok");
console.log(`analysis ${results.reduce((a, r) => a + r.ms, 0).toFixed(0)} ms for ${results.length} textures (${(results.reduce((a, r) => a + r.ms, 0) / results.length).toFixed(1)} ms each); build ms ${JSON.stringify(built)}`);
if (self) { console.log("self-test:"); for (const r of self) console.log("  ", r.id, r.flags.length ? "FLAG: " + r.flags.join("; ") : "ok", `(${r.ms} ms)`);
  if (!(self[0].colMarks > 0 && self[1].colMarks === 0)) { console.log("SELF-TEST FAILED: the detector must flag the streaky wall and pass the clean one"); process.exitCode = 1; } }

// (b) the panels
if (has("--panels")) { await p.evaluate(() => { document.getElementById("label").style.display = "none"; });
  const t0 = Date.now();
  for (const id of await p.evaluate(() => window.__ids)) for (const d of [2, 10, 40]) { await p.evaluate(([i, m]) => window.__panel(i, m), [id, d]); await p.waitForTimeout(250); await p.screenshot({ path: `${out}/materials-${id}-${d}m.png` }); }
  console.log(`panels: ${(await p.evaluate(() => window.__ids)).length * 3} PNGs in ${out} (${((Date.now() - t0) / 1000).toFixed(1)} s)`); }
if (errs.length) console.log("page errors", errs.slice(0, 4));
fs.writeFileSync(`${out}/check-textures.json`, JSON.stringify({ results, built, self }, null, 1));
await b.close();
if (results.some((r) => r.flags.length)) process.exitCode = 1;
