// The engine's renderer, one place for the performance plan's rules (design/perf/plan.md):
//   - the backend chosen per device by measurement: WebGPU on a first visit, WebGL 2 on the next,
//     then whichever drew its frames faster, remembered per device and build (?webgl=1 / ?webgpu=1
//     override); a lost GPU device reloads the page;
//   - a tier from the device: phones draw at 1x density with smaller shadow maps, laptops at up to 1.5x;
//   - a resolution controller on frame time: it steps the pixel ratio down after 12 frames over budget,
//     back up only after 30 under and a 12 s cooldown (after the game Kabe sent, design/perf/links-review.md);
//   - render on change: a still view of a still world is not redrawn;
//   - depth: on a phone reversed (a float buffer, near at 1: the 4 km view holds and early-Z stays on, GPU -45% a frame
//     headless; design/perf/phone-2026.md change 2), elsewhere logarithmic outdoors, ordinary indoors (?depth= overrides);
//   - performance marks (first frame, walkable) and, with ?perf (or ?fps, ?bench=1), the perf card (src/make/perfcard.js).
import * as THREE from "three/webgpu";
import { makeCard, CARD } from "./perfcard.js";

const Q = new URLSearchParams(location.search);
const PHONE = matchMedia("(pointer: coarse)").matches && Math.min(screen.width, screen.height) < 900;
const STEPS = PHONE ? [1, 0.85, 0.7, 0.6, 0.5] : [1.5, 1.25, 1, 0.85, 0.7];
const BUILD = "r186";

// edges smoothed everywhere, phones too (Kabe, 2026-10-06: "the slightest anti aliasing for the jagged edges"): 4x MSAA is
// cheap on a phone's tiled GPU, and the resolution controller steps the pixel ratio down if frames run long; ?msaa=0 turns it off
export async function makeRender({ outdoor = false, parent = document.body, msaa = Q.get("msaa") !== "0" } = {}) {
  const T0 = performance.now(), marks = {};
  const mark = (k) => { marks[k] = Math.round(performance.now() - T0); performance.mark?.(`holo:${k}`); };
  // the backend: measured per device, unless the address says
  const memoryKey = `holo/backend/${BUILD}/${navigator.userAgent.length}-${screen.width}x${screen.height}`;
  let memory = {}; try { memory = JSON.parse(localStorage.getItem(memoryKey) || "{}"); } catch (_) {}
  // WebGL 2 is tried only when WebGPU missed the frame budget here: a device that holds it at the screen's refresh can't
  // show WebGL doing better (both gaps read the refresh), and the trial cost a returning player 2-8 s of first frame
  // (fresh-eyes audit, 2026-10-10)
  const budget = PHONE ? 1000 / 30 : 1000 / 60;
  const want = Q.get("webgl") === "1" ? "webgl" : Q.get("webgpu") === "1" ? "webgpu"
    : memory.choice || (memory.webgpu == null || memory.webgpu <= budget * 1.15 ? "webgpu"
      : memory.webgl == null ? "webgl" : (memory.webgpu <= memory.webgl ? "webgpu" : "webgl"));
  // depth (?depth=reversed|log|std): log depth outdoors writes depth from every fragment shader, which turns off early-Z and
  // hidden-surface removal for every draw; reversed depth (a float buffer, near at 1) holds the same 0.05 m to 3 km without
  // it (phones by default: headless, GPU 7.4 -> 4.1 ms a frame at 1x, 68 -> 25 ms at DPR 3; near and far views alike).
  // WebGL 2 without EXT_clip_control falls back to ordinary depth, so there the renderer is made again with log depth.
  // flags only, measured no gain on the desktop GPU here (a phone's tiled GPU may differ; Kabe's card will say):
  // ?direct=1: DirectRenderPipeline, tone mapping in each material and straight to the canvas (no half-float MSAA target,
  // no output pass; the leaded glass blends after tone mapping, the view through it a little deeper in colour);
  // ?out=8: the intermediate target at 8 bits a channel instead of half floats (bands in the candle-dark vaults);
  // ?msaa=0 (above): GPU -10% here, and the edges Kabe asked for gone
  // (desktop too since 2026-10-08: the fps lab measured reversed depth drawing the 4 km view with log depth's exact pixels
  // at no cost, where log depth cost 37-55% of the GPU frame; lab/fps, the Phones section)
  const depthWant = Q.get("depth") || "reversed";
  const make = (depth) => new THREE.WebGPURenderer({ antialias: msaa, forceWebGL: want === "webgl", powerPreference: "high-performance",
    logarithmicDepthBuffer: depth === "log", reversedDepthBuffer: depth === "reversed",
    outputBufferType: Q.get("out") === "8" ? THREE.UnsignedByteType : THREE.HalfFloatType,
    trackTimestamp: CARD && Q.get("gpu") !== "0" });   // the card's GPU ms (WebGPU timestamps; WebGL's timer query where there is one)
  let renderer = make(depthWant), depth = depthWant;
  if (depth === "reversed") { await renderer.init(); if (!renderer.reversedDepthBuffer) { renderer.dispose(); depth = outdoor ? "log" : "std"; renderer = make(depth); } }
  let step = 0;
  const ratio = () => Math.min(devicePixelRatio, STEPS[step]);
  renderer.setPixelRatio(Q.get("dpr") ? +Q.get("dpr") : ratio());
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = Q.get("shadows") !== "0"; renderer.shadowMap.type = THREE.PCFShadowMap;
  parent.prepend(renderer.domElement);
  await renderer.init();
  const backend = renderer.backend.isWebGPUBackend ? "webgpu" : "webgl";
  renderer.backend.device?.lost?.then((info) => { if (info.reason !== "destroyed") location.reload(); });
  mark("renderer");
  addEventListener("resize", () => { renderer.setSize(innerWidth, innerHeight); });

  // frame time: a rolling record of the gaps between frames; the controller and the backend memory read it
  const gaps = []; let last = 0, over = 0, under = 0, cooldownUntil = 0, sampled = 0;
  function measure(now) {
    if (last) { const g = now - last; gaps.push(g); if (gaps.length > 120) gaps.shift();
      if (!Q.get("dpr") && now > cooldownUntil) {
        if (g > budget * 1.15) { over++; under = 0; } else if (g < budget * 0.8) { under++; over = 0; } else { over = Math.max(0, over - 1); under = Math.max(0, under - 1); }
        if (over >= 12 && step < STEPS.length - 1) { step++; over = 0; cooldownUntil = now + 2000; renderer.setPixelRatio(ratio()); }
        else if (under >= 30 && step > 0) { step--; under = 0; cooldownUntil = now + 12000; renderer.setPixelRatio(ratio()); }
      } }
    last = now;
    // after ten seconds of play, remember how this backend did on this device
    if (!sampled && now - T0 > 10000 && gaps.length >= 60) { sampled = 1; const s = [...gaps].sort((a, b) => a - b), p50 = s[s.length >> 1];
      memory[backend] = Math.round(p50 * 100) / 100; if (memory.webgpu != null && memory.webgl != null) memory.choice = memory.webgpu <= memory.webgl * 1.05 ? "webgpu" : "webgl";
      try { localStorage.setItem(memoryKey, JSON.stringify(memory)); } catch (_) {} }
  }

  // render on change: the page says when the view or the world moved; otherwise the frame is skipped
  let dirty = true, frames = 0, drawn = 0, ticked = false;
  const flags = { msaa: msaa ? 4 : 0, depth, out: Q.get("out") === "8" ? 8 : 16 };
  // the direct pipeline: what the warm-up compiles ahead (src/make/warm.js) is compiled as the pipeline draws, tone mapping inside
  const pipe = Q.get("direct") === "1" ? new THREE.DirectRenderPipeline(renderer) : null;
  if (pipe) { flags.direct = 1; const compile = renderer.compileAsync.bind(renderer);
    renderer.compileAsync = (...a) => { pipe._update(); const was = [renderer.contextNode, renderer.toneMapping, renderer.outputColorSpace];
      renderer.contextNode = pipe._contextNode; renderer.toneMapping = THREE.NoToneMapping; renderer.outputColorSpace = THREE.ColorManagement.workingColorSpace;
      try { return compile(...a); } finally { [renderer.contextNode, renderer.toneMapping, renderer.outputColorSpace] = was; } }; }
  const E = { renderer, backend, marks, flags };
  const card = makeCard(E);
  function frame(scene, camera, { changed = false, post = null } = {}) {
    const now = performance.now(); frames++;
    if (changed) dirty = true;
    if (!dirty) { last = 0; ticked = false; return false; }    // nothing moved: no frame, and no gap counted
    measure(now);
    const c0 = performance.now();
    post ? post.render() : pipe ? pipe.render(scene, camera) : renderer.render(scene, camera);
    card.drawn(now, performance.now() - c0, scene, ticked); ticked = true;
    if (!drawn++) mark("first-frame");
    dirty = false;
    return true;
  }
  const markOuter = mark;
  const markAll = (k) => { markOuter(k); if (k === "walkable") card.walkable(); };
  return { renderer, backend, phone: PHONE, mark: markAll, marks, flags, card, frame, drawn: () => drawn, ticks: () => frames, invalidate: () => { dirty = true; }, ratio: () => renderer.getPixelRatio(), memory };
}
