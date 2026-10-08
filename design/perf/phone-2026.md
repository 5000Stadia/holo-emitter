# Phones, October 2026: what the manor meets, and what to change

Researched 2026-10-08, read-only. Builds on `plan.md`, `rendering-research.md`, `serving-research.md` and `links-review.md`. It doesn't repeat them.

How each claim is marked:
- **[src]** carries its link.
- **[ours]** was measured here today: headless Chromium on the RX 460, at a 390×844 phone viewport with DPR 3, on the local manor page at `?fresh`.
- **[inference]** is my reasoning.

Nothing here was measured on a phone.

## 0. What changes plans (read first)

1. **We hold about 0.8 GB, close to an iPhone's limit. [ours]**
   - **Our footprint after the first frame:**
     - JS heap 391 MB.
     - `renderer.info.memory` 395 MB on WebGPU (textures 291 MB, vertex data 100 MB), 462 MB on WebGL 2.
   - **The iPhone's limit:** most iPhones kill a WebContent process at about 1.5 GB [src: a WebKit engineer, https://bugs.webkit.org/show_bug.cgi?id=268816]. An iPhone 17 Pro was killed at "ActiveHard 2048 MB" [src: https://developer.apple.com/forums/thread/823061].
   - **What the kill looks like:** a silent reload, then "A problem repeatedly occurred", with no `contextlost` first [src: https://bugs.webkit.org/show_bug.cgi?id=300782, https://bugs.webkit.org/show_bug.cgi?id=279637].
2. **Two textures make up 45% of texture memory. [ours]** The room floor is drawn at 360 px/m over 8×8 m, so its colour map and its normal map are each 2880×2880. With mips that is 88 MB of the 196 MB of sampled textures (66 textures; `lab/painted/procedural.js:340`). A phone at DPR 1 can't show 360 px/m.
3. **Every pixel of every lit material pays for 8 RectAreaLights. [src]**
   - **What one costs:** about 8 edge integrals and 2 LTC texture fetches per pixel. A pooled light at intensity 0 still costs the same. Every light is inlined into every lit shader. [src: three r186 `LTC.js`, `PhysicalLightingModel.js`, `LightsNode.js`; https://github.com/mrdoob/three.js/blob/r186/src/nodes/lighting/LightsNode.js]
   - **Maintainer advice:** "I would not suggest using four of them" [src: https://github.com/mrdoob/three.js/issues/15232].
   - **We have 8 rect lights, 3 point lights, 1 sun with shadow, and the hemisphere light. [ours]**
4. **The manor is drawn with logarithmic depth, rooms included.** It is the default whenever the outside is on (`OUTDOOR`).
   - **What it does in r186:** every material writes `frag_depth` (`NodeMaterial.setupDepth`) [src: r186 source, read today].
   - **Why that costs:** writing depth disables early-Z for the whole draw [src: Dawn, https://dawn.googlesource.com/dawn/+/main/docs/tint/extensions/fragment_depth.md], along with the hidden-surface culling that depends on it on Mali [src: https://developer.arm.com/community/arm-community-blogs/b/mobile-graphics-and-gaming-blog/posts/killing-pixels---a-new-optimization-for-shading-on-arm-mali-gpus].
   - **The maintainers' alternative:** reversed depth. It "does not prevent GPU optimizations like early-z testing", and log depth is to be deprecated [src: https://github.com/mrdoob/three.js/issues/29841]. r186 has `new WebGPURenderer({ reversedDepthBuffer: true })` (depth32float). On WebGL 2 it falls back to ordinary depth without `EXT_clip_control` [src: r186 source].
   - **Our earlier check missed this:** the fps lab's "no measurable cost" was measured on the RX 460, a desktop GPU without tiles.
5. **Every frame goes through a 4× MSAA half-float target, then a second full-screen pass. [src: r186 source]**
   - **Why:** with ACES and an sRGB output, `needsFrameBufferTarget` is true. The scene then draws into an internal RGBA **HalfFloat** target with `samples: 4`.
   - **The store flags:** for the canvas path they are hard-set to `true` (`Renderer.js`, `_getFrameBufferTarget`), so the multisampled colour and depth are written out of tile memory every frame. This is the cost PR #33974 warns about on tiled GPUs. An output pass then draws a quad to the canvas.
   - **The way around it in r186:** `DirectRenderPipeline` (PR #34166) tone-maps inside each material and draws straight to the canvas [src: https://github.com/mrdoob/three.js/pull/34166, https://threejs.org/docs/pages/DirectRenderPipeline.html]. Its catch is blending: it happens after tone mapping, which matters for our leaded glass.
   - **The phone record:**
     - Mugen87: 4× MSAA on FP16 targets "can be extreme"; FXAA is "a good choice" on mobile [src: https://github.com/mrdoob/three.js/pull/33935, https://github.com/mrdoob/three.js/issues/34599].
     - On a Pixel 9, MSAA plus the output pass stuttered at a reported 80+ fps [src: #34599].
6. **Our thermal figures were wrong (`rendering-research.md` §7). [src]**
   - iPhone 15 Pro holds about 61–63% of its peak under Wild Life Extreme, not 95.9% [src: https://www.notebookcheck.net/iPhone-15-Pro-v-Galaxy-S24-Ultra-v-Vivo-X100-Pro-smartphone-titans-in-benchmark-head-to-head.798888.0.html, https://benchmarks.ul.com/hardware/phone/Apple+iPhone+15+Pro+review].
   - The Pixel 8's 52.5% is plain Wild Life, not Extreme.
   - The rule stands: a flagship keeps 50–70% of its first minute.

## 1. WebGPU on phones, late 2026

- **iOS and iPadOS.**
  - WebGPU has been on by default since Safari 26.0 [src: https://webkit.org/blog/17333/webkit-features-in-safari-26-0/]. It depends on the OS (iOS 26), and iOS 26 runs on A13 and later [src: https://bugs.webkit.org/show_bug.cgi?id=299237]. caniuse lists 26.0–27.2 [src: https://caniuse.com/webgpu].
  - iOS 26 was on 79% of all iPhones in June 2026, and 86% of those from the last four years [src: https://9to5mac.com/?p=1056178].
  - Fixed WebKit bugs that mattered: the GPU process leaking command encoders until the system killed it (303203), and a crash at about 70 s with instanced vertex buffers whose order changed per frame (302711) [src: https://bugs.webkit.org/show_bug.cgi?id=303203, https://bugs.webkit.org/show_bug.cgi?id=302711]. Which iOS point release carries each fix: unknown.
  - Limits in practice: `maxTextureDimension2D` ≥ 8192 on 100% of iOS reports, `maxBufferSize` ≥ 256 MiB [src: https://web3dsurvey.com/webgpu/limits/maxTextureDimension2D/platform/iOS].
  - **DPR is 3 on iPhone 12–17.** rAF stays near 60 Hz even on ProMotion screens unless a feature flag is changed [src: https://firt.dev/notes/viewports, https://bugs.webkit.org/show_bug.cgi?id=294338].
  - **Low Power Mode caps rAF at 30 fps on purpose,** and a page can't detect it [src: https://bugs.webkit.org/show_bug.cgi?id=215745].
- **Android Chrome.**
  - On since Chrome 121, on Android 12+ with Qualcomm or ARM GPUs. Imagination needs Android 16+ (Chrome 139). Samsung Xclipse is marked limited [src: https://github.com/gpuweb/gpuweb/wiki/Implementation-Status, https://chromium.googlesource.com/chromium/src.git/+/main/gpu/config/webgpu_blocklist_impl.cc].
  - Compatibility mode (WebGPU over GLES 3.1) shipped in Chrome 146, opt-in [src: https://developer.chrome.com/blog/new-in-webgpu-146]. 23% of Android Chrome users lack Vulkan 1.1 [src: https://groups.google.com/a/chromium.org/g/blink-dev/c/N3RlLGCOTJ4/m/loneRTlPBwAJ].
  - Detect WebGPU by awaiting `requestAdapter()`, not just `navigator.gpu`. Devices in compatibility mode otherwise take the WebGPU path and fail shadow shaders [src: https://github.com/mrdoob/three.js/issues/33980].
- **Firefox Android:** WebGPU is off by default (157) [src: caniuse]. Samsung Internet has it from version 24.
- **Share with WebGPU, per web3dsurvey:** iOS 85%, Android 74%, overall 82.7% [src: https://web3dsurvey.com/]. Roughly **one phone in five takes the WebGL 2 path.** On r186 that path never deletes GL programs, shaders or VAOs; the fix is in r187 [src: https://github.com/mrdoob/three.js/issues/34597].

## 2. three.js `WebGPURenderer` on phones: the pitfalls that apply to us

- **Shader size and compile time.**
  - In r186 the lighting is analysed twice, which inflates every lit shader. The r187 fix cut fragment WGSL by 38% [src: https://github.com/mrdoob/three.js/issues/34386, https://github.com/mrdoob/three.js/pull/34531].
  - Many lights can push a MeshStandard pipeline past Safari's "private address space exceeds 8192 bytes", and it then fails to compile [src: https://github.com/mrdoob/three.js/issues/34672].
  - Our 13 lights, with the sun casting a shadow, are the configuration to check first on an iPhone. **[inference]**
- **Material setup** is about 16× slower than `WebGLRenderer` at first render (#33821, open) [src: https://github.com/mrdoob/three.js/issues/33821]. That is the CPU part of our 7.7 s to first frame [ours] (14.3 s on WebGL 2).
- **Lights:** each one is compiled into every lit shader. Adding or removing one recompiles everything; the pool already respects this.
- **Shadows:** r183 uses hardware compare for shadow sampling (#32705). We draw a still 2048² sun map once on phones, which is cheap after the first frame. It holds 16 MB of depth32. **[inference]**
- **Settings guides for mobile:**
  - Cap the pixel ratio, adapt resolution with hysteresis, and render on demand.
  - Keep about 3 or fewer dynamic lights, and shadow maps of 512–1024.
  - Prefer reversed depth.
  - Source: https://www.utsubo.com/blog/threejs-best-practices-100-tips (a secondary source, but it agrees with the maintainers above).

## 3. Heat and battery

- **How far flagships fall** (3DMark Wild Life Extreme, worst loop over best across 20 minutes) [src]:

  | phone | keeps | source |
  |---|---|---|
  | iPhone 15 Pro | 61% | Notebookcheck, above |
  | iPhone 16 Pro Max | 55% on a first run | https://www.tomsguide.com/phones/iphones/iphone-17-pro-max-endurance-tested-does-the-new-design-actually-improve-performance |
  | iPhone 17 Pro | 64% | https://m.gsmarena.com/apple_iphone_17_pro-review-2887p4.php |
  | Galaxy S25 | 51% | https://benchmarks.ul.com/hardware/phone/Samsung+Galaxy+S25+review |
  | Pixel 10 Pro XL | 60–95% (sources disagree) | |
  | Galaxy A55 / A56 | 98–99% | |

  - The iPhone 17 Pro's vapour chamber raises the sustained floor rather than the ratio.
  - The fall is gradual: the 15 Pro Max settled near 50% after 40 minutes [src: https://m.gsmarena.com/apple_iphone_15_pro_max-review-2618p5.php].
  - Mid-range phones barely throttle, but their peak is below a flagship's floor.
- **What engines do:** they scale resolution, then frame rate, with separate thresholds for heating and cooling.
  - Unity Adaptive Performance scales resolution 0.5–1 and frame rate 15–60 [src: https://docs.unity3d.com/Manual/adaptive-performance/scalers-reference.html].
  - Android's ADPF thermal headroom is native-only [src: https://developer.android.com/games/optimize/adpf/thermal].
  - Arm found instant switching flickered and used separate up and down thresholds [src: Arm ADPF post].
  - drei's `PerformanceMonitor` is the web equivalent.
  - A page gets no thermal signal: `PressureObserver` is desktop Chrome only and reports CPU only [src: https://developer.chrome.com/docs/web-platform/compute-pressure]. **Frame time is the only signal.**
- **Power:** GameBench saw 60 fps take close to twice the GPU of 30 fps [src: https://blog.gamebench.net/mobile-game-performance-pitfalls]. Energy per clock scales with voltage squared [src: Arm energy-efficiency post]. No modern measurement for the web was found.
- **For us [inference]:** budget the first minute at about 60% of the 33 ms phone frame (about 20 ms), so a phone that falls to 55–65% still holds 30 fps. Above all, don't render at all when still; `render.js` already does this.

## 4. Memory

- **The per-tab limits on iPhone:**
  - WebContent's limit is about 1.5 GB on most iPhones. 2 GB was seen on the 17 Pro, and about 3 GB on a 15 Pro when memory was free.
  - The kill is a "highwater jetsam": past a soft limit the process is killed only when the system is short of memory, so it comes and goes [src: the bugs in §0].
  - WebGPU allocations live in the separate GPU process (bug 303203). How they count against WebContent: unknown.
  - Total memory for 2D canvases is about 384 MB, and one canvas is at most 16.7 Mpx [src: https://www.pqina.nl/blog/total-canvas-memory-use-exceeds-the-maximum-limit/]. We draw kit textures into typed arrays in workers, so only a few CanvasTextures count.
- **How to estimate our footprint:**
  - A texture costs width × height × 4 B × 4/3 for mips, and HalfFloat doubles it.
  - Our sampled set is 196 MB [ours]:
    - the floor pair: 2880², 88 MB;
    - 12 textures at 1024², 67 MB;
    - 16 at 512²;
    - the outdoor DataTextures.
  - The JS heap holds a second copy of every DataTexture's pixels and every vertex array.
  - All rooms are built: 5.06 M vertices in the scene. [ours]
- **Practical caps for phones [inference]:**
  - Sampled textures ≤ 80 MB.
  - GPU total ≤ 250 MB.
  - JS heap ≤ 250 MB.
  - Together that is about 0.5 GB, a third of the iPhone limit, leaving room for Safari's compositor and the GPU process.

## 5. Measuring on a phone with no server of ours

**What a page can read**

- **`adapter.info`** (requestAdapterInfo was removed):
  - Android: a usable vendor/architecture pair, such as `qualcomm`/`adreno-7xx` or `arm`/`valhall`.
  - iOS: only `apple` [src: https://bugs.webkit.org/show_bug.cgi?id=278542].
  - WebGL 2's `UNMASKED_RENDERER` on iOS reads "Apple GPU".
  - So **on an iPhone the model must come from Kabe**. Screen size, DPR and the iOS version in the UA narrow it down.
- **`timestamp-query`** (GPU time) [src: web3dsurvey, https://web3dsurvey.com/webgpu/features/timestamp-query/platform/iOS]:
  - Present on 99.99% of iOS reports with WebGPU and 97.7% of Android ones.
  - iOS has none inside passes.
  - Chrome rounds to 100 µs.
  - In three: `new WebGPURenderer({ trackTimestamp: true })`, then `await renderer.resolveTimestampsAsync('render')`, which gives `renderer.info.render.timestamp`.
  - On WebGL 2 the timer extension is on about 0.2% of phones (from `rendering-research.md`), so there we have frame time only.
- **Memory APIs:**
  - `navigator.deviceMemory`: Chromium only, bucketed (2/4/8 on Android).
  - `performance.memory`: Chromium only, JS heap only.
  - `measureUserAgentSpecificMemory`: needs cross-origin isolation, so not on GitHub Pages.
  - Safari offers none of them [src: MDN].
  - **`renderer.info.memory` works everywhere** and is our best gauge [ours].
- **Not to rely on:** `hardwareConcurrency` on iOS is clamped (sources disagree on the value). Long Animation Frames is Chrome only.

**What our `?fps` box gets wrong**

It times the gaps of `setAnimationLoop`, which ticks even when render-on-change skips the frame. So a still view reads 16.7 ms whatever the cost. **[inference from `lab/manor/index.html:546`]**

**A one-screen perf card, for one screenshot** (my design; `?perf=card`)

1. **What ran:** build sha · backend · adapter vendor/architecture · OS and browser version from the UA · `screen` × DPR · the canvas's pixels and the controller's step.
2. **Frames, drawn frames only:**
   - p50, p95 and worst ms over the last 2 s, and since walkable;
   - the count over 50 ms;
   - the shortest gap seen (reads 33 ms in Low Power Mode or with a 30 Hz cap).
3. **CPU ms against GPU ms:** CPU is the time spent in `render()`; GPU comes from timestamps, or "n/a" on WebGL. GPU near the frame time means fill-bound: lower the resolution. CPU near it means draws and nodes.
4. **The scene:** draws, triangles, programs, lights, and the flags in force (`msaa`, `depth`, `direct`, `rect`, `tex`).
5. **Memory:** textures MB and vertex data MB from `renderer.info.memory`, JS heap where Chrome gives it, `deviceMemory`.
6. **Heat:** the p50 of each minute for the last 10 minutes (`1:18 2:19 5:24 10:31`), which shows throttling in one line.
7. **Startup:** the marks for first frame and walkable, cold or warm.
8. **The last session:** a heartbeat in localStorage every 5 s holds the minutes run and MB held. If the page loads without the previous session's clean `pagehide`, the card says "last session ended unexpectedly after 6 min at 610 MB". iOS reloads after a jetsam kill, so this catches the kills Kabe can't see.

A "copy" tap puts the same text on the clipboard as JSON, so it can be pasted to us rather than screenshotted.

## 6. Changes for the manor on phones, ranked

Gains are **[inference]** unless linked. Cost: S under a day, M 1–3 days, L more.

| # | change | expected gain | cost |
|---|---|---|---|
| 0 | **Measure first:** the perf card (§5); `?bench=1`, a fixed 60 s walk through the hall, the great chamber and the stair with the controller frozen; `?soak=10`, the same walk looped for 10 minutes | Turns every guess below into a number from Kabe's phone | S |
| 1 | **Phone textures:** floor 360 to 180 px/m (2880² to 1440²); 1024 kit textures at 512 on phones; drop each DataTexture's CPU copy after upload (`onUpdate`, to verify in `WebGPURenderer`) | Sampled textures 196 to about 60 MB; JS heap down about 190 MB; the main guard against iOS reloads; faster first frame on a phone's CPU | S |
| 2 | **Reversed depth instead of log depth** (`reversedDepthBuffer: true`; on WebGL 2 without `EXT_clip_control`, log depth only while outside) | Early-Z and hidden-surface removal come back for every draw; panelled rooms seen through doors are full of overdraw. Likely the largest GPU gain for its cost on Mali/Adreno; unknown on Apple. Check that the 4 km view still holds (fps lab) | S |
| 3 | **Rect lights on phones: 8 slots to 3** (a phone constant, so the count stays fixed and nothing recompiles; the pool already ranks by contribution) | Rect-light shading cut by about 60%; per-pixel lighting is likely the largest fragment cost [src: #15232]. Smaller shaders too, away from Safari's 8192-byte failure (#34672) | S (M for a cheaper window-light model, or the baked bounce of R48 step 6) |
| 4 | **`DirectRenderPipeline` on phones** (no half-float 4× MSAA intermediate, no output pass); check the glass and people projections. Fallback: `outputBufferType: UnsignedByteType` (watch banding in candle-dark rooms) | Removes a full-screen pass and the write-out of an FP16 MSAA target each frame; bandwidth is what heats a phone [src: #33935, #33974] | S–M |
| 5 | **A 30 fps cap on phones** (skip rAF callbacks by timestamp; the budget is already 33 ms) | Steadier pacing than a jittery 40–50; about half the GPU energy [src: GameBench]; later throttling | S |
| 6 | **The controller on GPU ms** where timestamps exist; remember the step per device; drop MSAA before going below 0.7 | Reacts to heat without the false readings of rAF gaps | S |
| 7 | **r187 when it ships** | 38% smaller shaders and faster compiles (#34531); the WebGL 2 leak fixed (#34597); part of Safari's 8192-byte fix | S–M |
| 8 | **Phone shadow map 2048 to 1024** | 12 MB less; a cheaper sample per pixel; small | S |
| 9 | **Hold by distance** (plan rule 2): free the geometry and textures of rooms far behind | Vertex data 100–139 MB down to a few rooms' worth; needed before the house grows | L |
| 10 | **Normal maps packed in two channels** (r186 has `NormalRGPacking`) or real-time GPU compression to ASTC | Another 2–4× on texture memory | M–L |

**What to measure first, in one sitting on Kabe's phone:**

1. The card at spawn and in the hall.
2. The same with each switch alone, as URLs:
   - existing: `?msaa=0`, `?shadows=0`, `?dpr=0.7`, `?webgl=1`;
   - new: `?rect=3`, `?depth=reversed`, `?direct=1`, `?tex=half`.
3. A `?soak=10` card.

That is about ten screenshots, and they rank items 1–6 on his own GPU.

**One A/B not used:** I ran the rect-light and resolution comparisons headless on the RX 460. The results were noise (compile hitches, run-to-run swings of 2×), so they are not used as evidence.

**Still unknown:**
- How WebGPU's GPU-process memory counts against iOS's limit.
- Whether Apple's GPUs lose hidden-surface removal when a shader writes depth.
- Whether Chrome's battery saver caps rAF.
- Which phone Kabe has.
