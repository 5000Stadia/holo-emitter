// The perf card (design/perf/phone-2026.md §5): one screen a phone's screenshot carries, for measuring on Kabe's
// phone with no server of ours. ?perf (or ?fps, or ?bench) shows it; off, nothing is drawn or counted but the heartbeat.
//   - what ran: backend, the GPU adapter's vendor/architecture, the browser, screen x DPR, the drawing buffer;
//   - frames, drawn ones only (a still view skips its frames, so the gaps of the rAF loop read 16.7 ms whatever the
//     cost): p50 / p95 / worst over the last 3 s and since walkable, the count over 50 ms, the shortest gap (33 ms in
//     Low Power Mode); CPU ms spent in render(); GPU ms from timestamps where the device has them;
//   - each minute's p50 (throttling shows as a rising line), the scene (draws, triangles, programs, lights lit/held),
//     the flags in force, memory (renderer.info's textures and vertex data, our count of what the page still holds
//     on the CPU, Chrome's JS heap), the startup marks;
//   - the heartbeat, always on (a localStorage write every 5 s): a page reloaded after an iOS tab kill (no pagehide)
//     says "last session ended unexpectedly after N min at X MB".
// ?bench=1: a fixed 60 s walk (hall, great stair, great chamber, through to the muniment room) once walkable, then
// the card's summary, kept as window.__bench. A tap on the card copies its text.
const Q = new URLSearchParams(location.search);
export const CARD = Q.has("perf") || Q.has("fps") || Q.has("bench");
const HB = "holo/perf/heartbeat", HIST = "holo/perf/sessions", MB = (b) => Math.round(b / 1048576);
const pct = (s, q) => s.length ? s[Math.min(s.length - 1, Math.floor(s.length * q))] : 0;
const stats = (a) => { const s = [...a].sort((x, y) => x - y); return { n: s.length, p50: pct(s, 0.5), p95: pct(s, 0.95), worst: s.at(-1) || 0, min: s[0] || 0, over50: s.filter(g => g > 50).length }; };
const f1 = (v) => v >= 100 ? Math.round(v) : v.toFixed(1);

// the last session, read before this one overwrites it
function lastSession() {
  let prev = null, hist = [];
  try { prev = JSON.parse(localStorage.getItem(HB) || "null"); hist = JSON.parse(localStorage.getItem(HIST) || "[]"); } catch (_) {}
  if (prev) { hist.unshift(prev); hist = hist.slice(0, 6); try { localStorage.setItem(HIST, JSON.stringify(hist)); } catch (_) {} }
  return prev;
}
function describe(s) {
  if (!s) return "last session: none recorded";
  const at = new Date(s.t).toTimeString().slice(0, 5), min = Math.round((s.t - s.start) / 60000);
  const how = s.clean ? "closed" : s.hidden ? "ended while hidden" : "ENDED UNEXPECTEDLY";
  return `last session: ${how} ${at} after ${min} min at ${s.mb} MB${s.tex != null ? ` (tex ${s.tex}, heap ${s.heap || "?"})` : ""}`;
}

export function makeCard(E) {
  const { renderer } = E, T0 = performance.now(), start = Date.now(), prev = lastSession();
  const gaps = [], cpu = [], gpu = [], all = [], minutes = [];         // drawn-frame gaps, last 3 s; since walkable; per-minute p50
  let lastDrawn = 0, minuteGaps = [], minuteAt = 0, walkAt = 0, scene = null, held = { tex: 0, geo: 0 }, heldAt = 0, adapter = "", bench = null, gpuBusy = false;
  const heap = () => performance.memory?.usedJSHeapSize || 0;
  const info = () => renderer.info.memory;
  // the heartbeat (always): what this session held, every 5 s; pagehide marks it clean
  const beat = (extra = {}) => { const m = info(); try { localStorage.setItem(HB, JSON.stringify({ start, t: Date.now(), mb: MB(m.total + heap()), tex: MB(m.texturesSize), heap: MB(heap()) || null,
    backend: E.backend, url: location.search, hidden: document.hidden, clean: false, ...extra })); } catch (_) {} };
  setInterval(beat, 5000); beat();
  addEventListener("pagehide", () => beat({ clean: true }));
  document.addEventListener("visibilitychange", () => beat());
  if (!CARD) return { drawn() {}, walkable() {}, el: null };

  // the adapter: WebGPU's device says (iOS: only "apple"); WebGL's unmasked renderer
  (async () => { try {
    const d = renderer.backend.device; let ai = d?.adapterInfo;
    if (!ai && navigator.gpu) ai = (await navigator.gpu.requestAdapter())?.info;
    if (ai) adapter = [ai.vendor, ai.architecture, ai.device, ai.description].filter(Boolean).join(" / ") || "(adapter says nothing)";
    else { const gl = renderer.backend.gl, x = gl?.getExtension("WEBGL_debug_renderer_info"); adapter = x ? gl.getParameter(x.UNMASKED_RENDERER_WEBGL) : gl ? gl.getParameter(gl.RENDERER) : "?"; }
  } catch (e) { adapter = "? " + e.message; } })();

  const el = document.createElement("div"); el.id = "perf-card";
  el.style.cssText = "position:fixed;left:8px;right:8px;top:max(64px,env(safe-area-inset-top));z-index:9;font:10.5px/1.35 ui-monospace,Menlo,monospace;color:#e8e2d2;background:rgba(0,0,0,.72);padding:6px 8px;white-space:pre-wrap;word-break:break-word;border:1px solid rgba(236,228,210,.2);max-width:560px";
  el.addEventListener("pointerdown", (e) => { e.stopPropagation(); navigator.clipboard?.writeText(el.textContent + "\n" + JSON.stringify(summary())).then(() => { el.style.borderColor = "#c9a35c"; setTimeout(() => { el.style.borderColor = ""; }, 600); }, () => {}); });
  document.body.append(el);

  const ua = navigator.userAgent, os = (ua.match(/(iPhone OS|CPU OS|Android) [\d_.]+/) || [""])[0].replace(/_/g, "."), br = (ua.match(/(CriOS|FxiOS|EdgA|SamsungBrowser|Chrome|Version)\/[\d.]+/) || [""])[0].replace("Version", "Safari");
  function scan() {           // what the page still holds on the CPU: texture pixels and vertex arrays in the scene (every 10 s)
    if (!scene) return; const seen = new Set(); let tex = 0, geo = 0, lights = { rect: 0, rectLit: 0, point: 0, pointLit: 0, other: 0 };
    scene.traverse(o => {
      if (o.isLight) { if (o.isRectAreaLight) { lights.rect++; if (o.intensity > 0) lights.rectLit++; } else if (o.isPointLight) { lights.point++; if (o.intensity > 0) lights.pointLit++; } else lights.other++; }
      const g = o.geometry; if (g && !seen.has(g)) { seen.add(g); for (const a of Object.values(g.attributes)) { const arr = a.array || a.data?.array; if (arr && !seen.has(arr)) { seen.add(arr); geo += arr.byteLength; } } if (g.index && !seen.has(g.index.array)) { seen.add(g.index.array); geo += g.index.array.byteLength; } }
      const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      for (const m of ms) for (const k in m) { const v = m[k]; if (v && v.isTexture && !seen.has(v)) { seen.add(v); const d = v.image?.data; if (d && !seen.has(d)) { seen.add(d); tex += d.byteLength; } } }
    });
    held = { tex, geo, lights };
  }
  function summary() {
    const m = info(), r = stats(gaps.map(g => g[1])), w = stats(all), c = stats(cpu), g = stats(gpu);
    return { backend: E.backend, adapter, os, br, dpr: devicePixelRatio, screen: `${screen.width}x${screen.height}`, buf: `${renderer.domElement.width}x${renderer.domElement.height}`, ratio: +renderer.getPixelRatio().toFixed(2),
      last3s: r, sinceWalkable: w, cpu: c.p50, gpu: g.n ? g.p50 : null, minutes: minutes.slice(-10), flags: E.flags,
      draws: renderer.info.render.drawCalls, tris: renderer.info.render.triangles, programs: m.programs, lights: held.lights,
      mem: { tex: MB(m.texturesSize), geo: MB(m.attributesSize + m.indexAttributesSize), total: MB(m.total), heap: MB(heap()) || null, cpuTex: MB(held.tex), cpuGeo: MB(held.geo), device: navigator.deviceMemory || null },
      marks: E.marks, bench, prev };
  }
  function show() {
    const s = summary(), r = s.last3s, w = s.sinceWalkable, L = s.lights || {}, mk = s.marks, fl = s.flags || {};
    const lines = [
      `${s.backend} · ${adapter || "…"}`,
      `${os || "?"} ${br} · ${s.screen} @${s.dpr} · buf ${s.buf} (×${s.ratio})`,
      // (standing still the page draws only on change, so a few frames' gaps read as a crawl: said so instead)
      r.n < 10 ? `frames 3s: still (drawn only when something changes: walk or look to measure) · n ${r.n}` : `frames 3s: p50 ${f1(r.p50)} p95 ${f1(r.p95)} worst ${f1(r.worst)} ms · n ${r.n}`,
      `since walkable: p50 ${f1(w.p50)} p95 ${f1(w.p95)} worst ${f1(w.worst)} · >50ms ${w.over50}/${w.n} · min ${f1(w.min)}`,
      `cpu render ${f1(s.cpu)} ms · gpu ${s.gpu == null ? (renderer.backend.trackTimestamp ? "…" : "n/a") : f1(s.gpu) + " ms"}`,
      `minutes p50: ${s.minutes.map((v, i) => `${minutes.length - s.minutes.length + i + 1}:${Math.round(v)}`).join(" ") || "…"}`,
      `scene: ${s.draws} draws · ${Math.round(s.tris / 1000)}k tris · ${s.programs} progs · rect ${L.rectLit ?? "?"}/${L.rect ?? "?"} point ${L.pointLit ?? "?"}/${L.point ?? "?"}`,
      `flags: ${Object.entries(fl).map(([k, v]) => `${k} ${v}`).join(" · ")}`,
      `mem: tex ${s.mem.tex} · geo ${s.mem.geo} · gpu ${s.mem.total} MB · held tex ${s.mem.cpuTex} geo ${s.mem.cpuGeo} · js heap ${s.mem.heap ?? "n/a"} (Chrome, coarse)${s.mem.device ? ` · dev ${s.mem.device} GB` : ""}`,
      `start: first frame ${((mk["first-frame"] || 0) / 1000).toFixed(1)} s · walkable ${((mk.walkable || 0) / 1000).toFixed(1)} s`,
      describe(prev),
    ];
    if (bench) lines.push(bench.done ? `BENCH 60s (after ${bench.warmS} s warm-up): p50 ${f1(bench.all.p50)} p95 ${f1(bench.all.p95)} worst ${f1(bench.all.worst)} · >50ms ${bench.all.over50}/${bench.all.n} · ${Object.entries(bench.legs).map(([k, v]) => `${k} ${f1(v.p50)}/${f1(v.p95)}`).join(" ")}`
      : `BENCH running: ${bench.leg} ${Math.round(bench.t)} s`);
    el.textContent = lines.join("\n");
  }
  setInterval(() => { if (performance.now() - heldAt > 10000) { heldAt = performance.now(); scan(); } show(); }, 1000);

  return {
    el,
    // each drawn frame: its gap from the last drawn frame (only when that one was the tick before), its CPU ms
    drawn(now, cpuMs, sc, ticked) {
      scene = sc;
      if (ticked && lastDrawn) { const g = now - lastDrawn; gaps.push([now, g]); while (gaps.length && now - gaps[0][0] > 3000) gaps.shift();
        if (walkAt) { all.push(g); if (all.length > 20000) all.splice(0, 10000); minuteGaps.push(g); if (now - minuteAt > 60000) { minutes.push(stats(minuteGaps).p50); minuteGaps = []; minuteAt = now; } }
        if (bench && !bench.done) { (bench.gaps[bench.leg] ||= []).push(g); if (g > 250 && bench.hitches) bench.hitches.push([+bench.t.toFixed(1), bench.leg, Math.round(g)]); } }
      lastDrawn = now; cpu.push(cpuMs); if (cpu.length > 180) cpu.shift();
      if (renderer.backend.trackTimestamp && !gpuBusy) { gpuBusy = true; renderer.resolveTimestampsAsync("render").then(v => { if (v > 0) { gpu.push(v); if (gpu.length > 180) gpu.shift(); } }).catch(() => {}).finally(() => { gpuBusy = false; }); }
    },
    walkable() { walkAt = minuteAt = performance.now(); scan();
      // the bench starts once the rooms are compiled ahead (src/make/warm.js; at most 45 s), so it times walking, not first sight
      if (Q.get("bench")) { const t0 = performance.now(); bench = { leg: "waiting for the warm-up", t: 0, gaps: {}, done: false };
        const wait = () => { const w = window.__warm?.(); if (w && w.left > 0 && performance.now() - t0 < 45000) { bench.t = (performance.now() - t0) / 1000; setTimeout(wait, 500); } else setTimeout(() => runBench((performance.now() - t0) / 1000), 1000); };
        setTimeout(wait, 1000); } },
    get gaps() { return gaps.map(g => g[1]); }, summary,
  };

  // ---- ?bench=1: the fixed walk. Glides through the page's __place (a step, as walking: the light pools fade as they do)
  // plan metres x east, y north; yaw 0 faces north, -90 east. Legs are timed and reported apart.
  function runBench(warmS = 0) {
    const place = window.__place; if (!place) return;
    const W = (x, y) => ({ x, y }), look = (deg, s) => ({ look: deg, s });
    const legs = [
      ["hall", "ground", [W(34, 4.5), look(360, 8), W(44.5, 1.9), W(46.6, 1.9)]],
      ["stair", null, [W(48.65, 2.3), W(48.65, 6.3), W(48.65, 7.3), W(46.75, 7.3), W(46.75, 3.0), W(46.75, 1.8), W(50.4, 1.8), W(50.4, 3.55)]],
      ["chamber", null, [W(51.4, 3.55), W(53.5, 3.55), W(54.5, 5.2), look(360, 8), W(55.56, 4), W(55.56, 2.45)]],
      ["muniment", null, [W(55.56, 0), W(55.56, -2.85), W(55.56, -5.5), W(53.4, -7.2), W(53.4, -8.6), W(53.4, -10.3), W(55.18, -10.3), W(57.3, -10.3), look(360, 8)]],
    ];
    // one timeline: walking at a pace that, with the turns, makes 60 s
    const steps = []; let px = 34, py = 4.5, len = 0, lookS = 0;
    for (const [leg, , pts] of legs) for (const p of pts) { if (p.look) { steps.push({ leg, ...p }); lookS += p.s; } else { const d = Math.hypot(p.x - px, p.y - py); if (d > 0) steps.push({ leg, x0: px, y0: py, x: p.x, y: p.y, d }); len += d; px = p.x; py = p.y; } }
    const speed = len / (60 - lookS);
    let t = 0, i = 0, yaw = -90, sx = steps[0].x0 ?? 34, sy = steps[0].y0 ?? 4.5, last = performance.now();
    bench = { leg: steps[0].leg, t: 0, gaps: {}, done: false, warmS: +warmS.toFixed(1), hitches: [], warm: window.__warm?.() };
    place(34, 4.5, yaw, -3, "ground");
    const tick = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000); last = now; t += dt; bench.t = t;
      let st = steps[i], used = dt;
      while (st && used > 0) {
        st.p = st.p || 0; bench.leg = st.leg;
        const need = st.look ? st.s : st.d / speed, take = Math.min(used, need * (1 - st.p)); st.p += take / need; used -= take;
        if (st.look) { place(sx, sy, yaw + st.look * st.p, -3, null, true); if (st.p >= 1 - 1e-9) { yaw += st.look; i++; st = steps[i]; } }
        else { const want = Math.atan2(-(st.x - st.x0), st.y - st.y0) * 180 / Math.PI; let dy = ((want - yaw + 540) % 360) - 180; yaw += dy * Math.min(1, dt * 6);
          sx = st.x0 + (st.x - st.x0) * st.p; sy = st.y0 + (st.y - st.y0) * st.p; place(sx, sy, yaw, -3, null, true); if (st.p >= 1 - 1e-9) { i++; st = steps[i]; } }
      }
      if (st) requestAnimationFrame(tick);
      else { const legsOut = {}, every = []; for (const [k, a] of Object.entries(bench.gaps)) { legsOut[k] = stats(a); every.push(...a); }
        bench = { ...bench, done: true, all: stats(every), legs: legsOut, secs: +t.toFixed(1) }; window.__bench = { ...bench, gaps: undefined, summary: summary() }; show(); }
    };
    requestAnimationFrame(tick);
  }
}
