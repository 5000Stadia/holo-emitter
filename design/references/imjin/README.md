# Imjin 1592: techniques banked (2026-10-13)

**Kabe, 2026-10-13:** "Heres another threejs project. Anything juicy in here we dont have?". He pasted its author's post:
- 166 Joseon ships against 470 at anchor at Busan, in one scene;
- ships instanced at three levels of detail;
- an FFT ocean on WebGPU compute, with a Gerstner fallback;
- smoke, fire and spray as TSL sprites shaded from one noise texture;
- one deterministic simulation in the browser and on the multiplayer server;
- iPhones on WebGL 2 with a lighter tier.

**My reading:**
- This is a bank of ideas, not a port. The site carries no licence, so we take ideas and write our own code.
- The study is from its shipped bundles (`imjin1592.com/assets/quality-*.js`, `BattleView-*.js`; three.js WebGPURenderer). I did not play it.
- One idea was adopted the same day, because it guards the switch to WebGPU on Kabe's iPhone (iOS 26). Nothing new goes on the roadmap.

## The techniques, ranked for us

1. **A page that died comes back safer.** Adopted 2026-10-13 in `src/make/render.js`.
   - **What they do:**
     - Set a marker in sessionStorage when a battle launches, and take it off on `pagehide`.
     - If the next load finds it (within 30 min), the last visit was killed. iOS drops a tab that runs out of memory, then reloads it.
     - After one death the game loads on the low tier and WebGL. After two it also caps the pixel ratio at 0.6, drops the clouds and allows 4 full-detail ships.
   - **Ours:**
     - After one death the page draws on WebGL 2, and the device's backend memory keeps WebGL 2 for this three.js build.
     - After a second death in a row it also starts at the lowest density.
     - A lost GPU device reloads without its clean exit, so it counts as a death too.
     - Checked by forcing two deaths in one tab: WebGPU, then WebGL 2, then WebGL 2 at 0.5 density; a later clean visit stays on WebGL 2.
2. **iPhones pinned to WebGL 2 unless the player opts in to WebGPU.** Any death also forces WebGL. They decided this up front; ours measures each device instead.
   - It is a data point for Photonic's sixth run (WebGPU against WebGL 2 on Kabe's iPhone).
   - With (1) in place, a WebGPU failure on a phone costs one visit, not every visit.
3. **Every particle in one instanced draw, from a fixed pool.**
   - Smoke, spray, muzzle flash and dust share one InstancedMesh. Each instance carries its kind, tint and age.
   - The pool size is set by tier (288 / 168 / 80). Each frame only the used part of the buffer is uploaded (`addUpdateRange(0, count*16)`).
   - Smoke drifts with the wind as it ages. Size eases out (`1-(1-a)^2`), and a flash grows linearly.
   - **For us:** R69 ("fires … that read as fire": our hearths are additive cones today), chimney smoke over the manor, and R71's rain and snow. It is the same shape as our light pool: fixed size, ranked, one cost.
4. **Quality levels that step more than the pixel ratio.** Five levels switch at runtime, each a short record:
   - the pixel ratio cap;
   - how many ray steps the volumetric clouds take, and how often they are redrawn (every 1–3 frames);
   - the fraction of particles kept (0.4–1.25);
   - how often the shadow map is redrawn (every 1–8 frames);
   - lite vegetation, refraction on or off, and the bloom's resolution and strength.

   **For us:** our resolution controller steps only the pixel ratio. When R69–R71 bring grass, particles and weather, each should take a lever in the same table (`design/perf/tiers.md`). Redrawing shadows every few frames suits moving lights; ours are fixed.
5. **Three ship LODs, with a limit on full-detail ships** (`maxLod0` 28 / 22 / 16, near and mid distances by tier). On the low tier they skip LOD 0 and use base colour only.
   - This is Photonic's crowd question. Its 300/1000/3000 runs already have tiers. Passed on as a pattern.

**Not taken:**
- **The FFT ocean.** No open water yet: the manor, the hillside and the street. It is worth a look when a story puts us on a river or the sea.
- **The deterministic shared simulation.** Our single truth is pattern-buffer's world document, and multiplayer is not in the vision.
- **AI-generated textures and models.** Our approach is catalogue-first and code-first.
