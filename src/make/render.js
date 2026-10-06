// The engine's renderer, one place for the performance plan's rules (design/perf/plan.md):
//   - the backend chosen per device by measurement: WebGPU on a first visit, WebGL 2 on the next,
//     then whichever drew its frames faster, remembered per device and build (?webgl=1 / ?webgpu=1
//     override); a lost GPU device reloads the page;
//   - a tier from the device: phones draw at 1x density with smaller shadow maps, laptops at up to 1.5x;
//   - a resolution controller on frame time: it steps the pixel ratio down after 12 frames over budget,
//     back up only after 30 under and a 12 s cooldown (after the game Kabe sent, design/perf/links-review.md);
//   - render on change: a still view of a still world is not redrawn;
//   - logarithmic depth outdoors (it held 4 km at no measurable cost in the fps lab), ordinary indoors;
//   - performance marks (first frame, walkable) and, with ?perf=1, an overlay of fps, draws and marks.
import * as THREE from "three/webgpu";

const Q = new URLSearchParams(location.search);
const PHONE = matchMedia("(pointer: coarse)").matches && Math.min(screen.width, screen.height) < 900;
const STEPS = PHONE ? [1, 0.85, 0.7, 0.6, 0.5] : [1.5, 1.25, 1, 0.85, 0.7];
const BUILD = "r186";

export async function makeRender({ outdoor = false, parent = document.body, msaa = !PHONE } = {}) {
  const T0 = performance.now(), marks = {};
  const mark = (k) => { marks[k] = Math.round(performance.now() - T0); performance.mark?.(`holo:${k}`); };
  // the backend: measured per device, unless the address says
  const memoryKey = `holo/backend/${BUILD}/${navigator.userAgent.length}-${screen.width}x${screen.height}`;
  let memory = {}; try { memory = JSON.parse(localStorage.getItem(memoryKey) || "{}"); } catch (_) {}
  const want = Q.get("webgl") === "1" ? "webgl" : Q.get("webgpu") === "1" ? "webgpu"
    : memory.choice || (memory.webgpu == null ? "webgpu" : memory.webgl == null ? "webgl" : (memory.webgpu <= memory.webgl ? "webgpu" : "webgl"));
  const renderer = new THREE.WebGPURenderer({ antialias: msaa, forceWebGL: want === "webgl", logarithmicDepthBuffer: outdoor, powerPreference: "high-performance" });
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
  const budget = PHONE ? 1000 / 30 : 1000 / 60;
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
  let dirty = true, frames = 0, drawn = 0;
  const overlay = Q.get("perf") === "1" ? Object.assign(document.createElement("div"), { id: "perf-overlay", style: "position:fixed;right:8px;top:8px;z-index:9;font:11px ui-monospace,monospace;color:#ddd;background:rgba(0,0,0,.6);padding:6px 8px;white-space:pre;pointer-events:none" }) : null;
  if (overlay) document.body.append(overlay);
  let fpsAt = T0, fpsFrames = 0, fps = 0;
  function frame(scene, camera, { changed = false, post = null } = {}) {
    const now = performance.now(); frames++;
    if (changed) dirty = true;
    if (!dirty) { last = 0; return false; }                    // nothing moved: no frame, and no gap counted
    measure(now);
    post ? post.render() : renderer.render(scene, camera);
    if (!drawn++) mark("first-frame");
    dirty = false; fpsFrames++;
    if (overlay && now - fpsAt > 500) { fps = Math.round(fpsFrames * 1000 / (now - fpsAt)); fpsFrames = 0; fpsAt = now;   // frames drawn per second while drawing
      overlay.textContent = `${backend} · ${fps} fps drawn · ${frames} ticks\n${renderer.info.render.drawCalls} draws · ${(renderer.info.render.triangles / 1000).toFixed(0)}k tris · ratio ${renderer.getPixelRatio().toFixed(2)}\n${Object.entries(marks).map(([k, v]) => `${k} ${v} ms`).join(" · ")}`; }
    return true;
  }
  return { renderer, backend, phone: PHONE, mark, marks, frame, drawn: () => drawn, ticks: () => frames, invalidate: () => { dirty = true; }, ratio: () => renderer.getPixelRatio(), memory };
}
