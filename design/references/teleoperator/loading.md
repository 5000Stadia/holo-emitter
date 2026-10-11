# Teleoperator: how it loads (study for holo-emitter)

Sources: `app.pretty.js` (line numbers below), and the site's `boot.js`, `workers/*.js` and `style.css` (fetched to `assets/web/`). The city binaries are in `assets/real/`. `timeline.json` is one headless run. We take ideas only; no code is copied.

## The run in brief (ms since navigation)
- 554: HTML. 985: title image, preloaded at high priority. 1398: `boot.js`, a 13 KB classic script. 1838: `app.js`, 2.8 MB, brotli.
- 1947: eight image workers and one sky worker are already up; boot.js spawned them before app.js ran.
- 2210 to 11556: the city's data arrives (about 30 MB gzipped). boot.js had asked for it at about 1.4 s.
- 3 s, 8 s, 15 s: **the "live city" behind the title is not a live render.** It is a still the game rendered of itself offline (`teleop_title.webp`, 1920x1080, 272 KB). It sits under a 40 s CSS zoom (`style.css` lines 14-22). The city build itself takes 26.6 s on the main thread.
- 37.8 s: "ready". Its log breaks down the time after the city: scene 1.5 s, compile wait 47 ms, then a 5.4 s first frame plus 2.6 s of GPU work.
- After ready, timers fire at +0.4 s (billboard and mural art), +0.7 s (understory), +0.75 to 0.9 s (landmark walks), +1.2 s (far-tree impostors), +1.5 s (yards, and the 2K car textures one every 700 ms) and +2.6 s (regions west and marin, one after the other). Lines 100074-100145 and 100380-100430.
- The data is rebuilt on every visit. All assets carry `max-age=30, must-revalidate` with ETags. The service worker exists but no page registers it, and it is network-first anyway (offline fallback only). There is no IndexedDB. **Real load speed is poor (38 s, 84 MB). Perceived speed is excellent.** Take the perception and pacing tricks, not the data volume.

## Techniques, ranked by value to us

### 1. The first screen is a still of the game itself, and it moves without the main thread
- **What:** an 80x45 WebP (about 550 bytes) inlined in the CSS paints first, over a gradient in its colours. The full still (preloaded, `fetchpriority=high`) sharpens it, and a slow CSS `transform` drift keeps it alive. The still fades out when the game is ready. The progress bar is a CSS `scaleX` whose `transitionDuration` is set to each stage's expected length (`vh`, line 98841), so it glides between coarse updates.
- **Evidence:** `style.css` lines 14-22 and 321; the `_mb_game` HTML preload; the t3/t8/t15 shots are near-identical frames of the still.
- **Why it works:** the compositor runs transform and opacity animations even while JavaScript blocks for seconds. The player sees "the city" at about 1 s. No 3D is drawn during the load, so the CPU and GPU are free for the build.
- **Fit: adopt (R65).** The audit records a still loading screen, frozen for 5 s. We already make lit stills. Render the start room at authoring, ship it as a WebP of about 150 KB plus an inline thumbnail, give it a CSS drift and a gliding bar, and fade it on "walkable". This meets the audit's "something to look at within ~3 s", even on 4G, before any build work changes.

### 2. The build runs to a deadline in resumable steps, nearest first
- **What:** each chunk's build is a list of closures with a cursor. A runner executes steps until a time limit; a step can return "more" to be resumed (line 82852). Regions are generator functions that yield every 250 buildings (`Hi`, line 83535), driven at 5 ms a frame (`fN`, line 100101). Between slices it waits for `requestAnimationFrame` and then `setTimeout(0)` (line 100100), so a frame paints between slices. During the load the slices are about 100 ms, with a progress update each (line 99580). In play the city gets 2.5 ms a frame (line 99273; 0.5 ms on frames that also did prop culling). Chunks are chosen nearest first, and ones ahead of the car's travel count as closer (line 83376). The worst ms per kind of step is recorded (`v.maxMs`, line 83340) to catch hitches.
- **Evidence:** "region west: 3802 ms (its steps 796 ms of work)". 0.8 s of CPU was spread over 3.8 s with no frame over budget. Spawn-near chunks are built at load ("near 3540 ms"); the rest stream in play.
- **Fit: adapt (R65; held idea "build the start room first").** Make `buildManor` yield per room and per thing, behind a budget-driven runner. Build the start room and its neighbours first, show the walkable frame, then stream the other rooms nearest first at about 4 ms a frame, with a direction-of-view bias. One risk: determinism. Each room's build must depend only on its seed, not on how many rooms were built before it. Check this with the existing determinism spec (no shared counters or streams across rooms).

### 3. A tiny first script starts everything slow before the main code arrives
- **What:** `boot.js` is a classic script, so it runs before the 2.8 MB module loads. It requests the WebGPU adapter and device (its comment says this saves about 0.7 s) and spawns the worker pool (`hardwareConcurrency − 2`, capped at 8; 2 on phones). It also fetches every city file with `priority:'high'` into a map of in-flight promises. The main code's byte fetcher takes from that map first (`UE`, line 22835).
- **Fit: adapt (R65).** On 4G our roughly 100 modules cost 3.4 s of round trips before building starts. Bundling is already in R65. A boot script should add three things: start `requestAdapter`/`requestDevice` and the texture-painting workers at t=0, and fetch any stored built house (technique 4). Our `makeRender` would then take the ready device.

### 4. A small typed-array container, pre-gzipped and quantised
- **What:** every `.bin` is a u32 header length, then a JSON header naming each array (type, byte offset, count), then raw arrays. Parsing creates typed-array views straight over the buffer, with no copies (`Mo`, line 34852). The files are gzipped at build time and served as plain octet-stream. The client inflates them with `DecompressionStream`, inside a worker when one is free (`workers/img.js`).
- **Quantisation:**
  - Building outlines: int16 centimetres from a float origin per building (line 55019).
  - Terrain: uint16 heights at 5 cm steps on a 4 m grid, plus an offset (`sR`, line 54778).
  - Baked sky visibility: uint8 on a 2 m grid, delta-coded per row so gzip finds runs (`yk`, line 34874; raw 23 MB to 10.4 MB gzipped).
  - Props: one uint8 kind, a uint16 index and five floats each.
- **Sizes:** roads 12.4 MB raw (8.4 MB gzipped), terrain 11.4 (4.3), sky 23 (10.4), buildings 5.3 (3.1), props 4.8 (3.4). The files hold source data (footprints, centre lines, instances), not meshes. Meshes are built on the client, as ours are.
- **Fit: adopt the container for "keep the built house between visits" (R65).** After the first build, write each bundle's attributes and index (the merged per-material geometry) into this layout. Key it by generator hash plus seed, compress it with `CompressionStream`, and keep it in the Cache API or IndexedDB. On the next visit, views go straight into `BufferAttribute`s and the build is skipped. The audit estimates about 2.5 s to walkable warm. Quantise positions to int16 millimetres per room origin, and normals to int8 octahedral, only after a pixel-diff check shows no change (the target says "look unchanged").

### 5. Shaders compile during the build, with a fallback so draws never stall
- **What:** each material carries a small WGSL snippet. Starting the async pipeline compile for it (`prewarm`, line 31955; `createRenderPipelineAsync`, line 30150) happens as each build stage introduces new materials (line 99580). At draw time, if a material's pipeline is not ready, the mesh is drawn with the generic pipeline instead of waiting (line 34016).
- **Evidence:** "compile's wait 47 ms" at ready.
- **Fit: adapt the timing; reject the fallback (R65, R50).** three.js has no hook for a fallback pipeline. Our whole-scene `compileAsync` measured worse (13 s). The cheap analogue: as the build creates each unique material and attribute layout, compile a one-mesh scene of it in the background. That costs dozens of pipelines rather than every room's meshes, and they overlap with CPU work.

### 6. Textures: decoded in workers, uploaded on arrival, with a cap per frame
- **What:** a worker pool fetches each image and decodes it to an `ImageBitmap`. On phones it downsizes in the worker (`SF_TEXMAX`; normal maps and masks at half), and it reads the WebP header to tell opaque images from transparent ones. The bitmap is transferred back and uploaded to the GPU the moment it arrives (`Kx.arrived`, line 99392), not at the first frame. Mipmaps are made on the GPU (line 31684). Uploads left over after ready are capped at 3 ms a frame (line 99191). On phones the bitmap and the CPU copies of geometry are released after upload (lines 22619, 100148).
- **Fit: adopt the per-frame cap and upload-on-arrival (R65).** The workers, the cache and geodrop are already ours.

### 7. Non-essentials wait for a ladder of timers after ready
- **What:** understory, yards, far trees (61,640 trees as impostors in 140 chunks, 182 ms), regions, 2K car textures and billboard art each start on their own timer, 0.4 to 2.6 s after ready. Each lands as a slice. On phones, regions load only when the car comes within 2,500 m.
- **Fit: adopt (R65).** The candidates are clutter in rooms not in view, the far hillside, portrait faces (R65 already defers the suspects' panels), and the high-detail texture tier. The first frame then carries only what the start room shows.

### 8. Quality tunes itself and remembers crashes
- **What:**
  - A 3.5 s benchmark starts after 90 frames on the first visit. It picks a level and saves it for 30 days per user agent. Sustained frames under 24 fps step the level down.
  - A "loading" flag in localStorage is cleared on success. If the flag is still set at the next start, the last load was killed (out of memory on iOS), so the game runs one level lighter.
  - GPU errors in the first 60 s switch on a compact material path for 7 days (line 99367).
- **Fit: adapt the crash flag (R50).** Our `render.js` already remembers the backend and has a resolution controller. The crash memory is cheap insurance for phones.

### 9. Lower-value items
- **LODs for reflections:** made lazily in a worker with meshoptimizer (`_buildLods`, line 31522; MIT licence). **Reject for now**: we have no reflection pass.
- **Base64 fallback** for hosts that refuse binaries (line 22840). **Reject.**
- **Its weak points, to avoid:** the 5.4 s first frame (geometry uploads deferred to the first draw); the 10 MB baked sky file; and no stored build, so every visit pays 26 s.

## Summary for us
Order for R65: the still title (1), then the boot script and bundling (3), then the stored built house (4), then the per-room budgeted build, start room first (2). Items 5 to 7 follow. Each is measured against the audit's 7.5 s cold and 12.6-15 s on 4G.
