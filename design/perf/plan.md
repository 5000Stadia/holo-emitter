# Performance: the plan (2026-10-06)

Kabe asked for this: "truly maximize performance without sacrificing quality"; "intelligently render and hold what's in frame and visible while minimizing/removing compute on what's not"; "consider what we would serve to get the best gains"; "after all tests and configuration certainly implement our best solutions intelligently and consider other approaches".

The facts behind it:
- **The fps lab** (`lab/fps/`, measured on an RX 460).
- **`rendering-research.md`**, ranked techniques.
- **`serving-research.md`**, delivery, with live measurements.

The engine is three.js r186+ `WebGPURenderer` with its WebGL 2 fallback. Kabe agreed on 2026-10-06.

## What the numbers say

- **On a first visit the cost is the device's work, not the network.** The house page downloads in 0.76 s, then needs 8 s to its first frame:
  - textures 2.0 s;
  - geometry 3.3 s;
  - the rest is shader compiles.
- **Draw calls and per-object work dominate a frame.** Each fix below was measured; the Godot numbers on the same scenes are the comparison:
  - batching: 10× in every engine;
  - render bundles: 9–21× for still separate meshes, WebGPU only;
  - a shared material: 2.7×.
- **Shadows:**
  - a still sun's shadow map drawn once: 86 to 136 fps;
  - only big casters: 86 to 106 fps.
- **Effects:** GTAO at 2× density with 16 samples cost 90% of a frame. r186 has a cheaper SSAO pass at half resolution.
- **Distance:** logarithmic depth holds detail at 4 km at no measurable cost in a draw-bound scene. Where fill counts it costs 37–55% (below), and reversed depth holds the same view for nothing.

## The phone measures, in the lab (2026-10-08)

Measured in the fps lab (`lab/fps/`, the ledger's "Phones" section), on the RX 460, 5 runs each, medians. The ms are GPU time per frame, timed serially. Each case is one change from the manor's desktop set: 8 window lights, full textures, 4× MSAA, ACES, a half-float target and ordinary depth.

| Change | GPU ms at 1× (1280×720) | GPU ms at the phone's 1170×2532 | What it does to the picture |
|---|---|---|---|
| The reference | 9.36 | 18.27 | At 4 km, facade panels vanish into their walls |
| Log depth | 12.86 (+37%) | 28.24 (+55%) | Every far panel holds |
| Reversed depth | 9.36 (0) | 18.59 (+2%) | Every far panel holds, the same pixels as log, on WebGPU and WebGL 2 |
| 3 window lights, not 8 | 4.13 (−56%) | 8.37 (−54%) | The pools of 5 windows go |
| No window lights | 1.15 | 2.40 | No pools |
| Half textures | 9.40 (0) | 18.33 (0) | Not told apart. GPU textures 100 → 25 MB; JS heap 84 → 27 MB |
| Pixels let go after upload | 9.40 (0) | 18.38 (0) | Identical. JS heap → 8.5 MB |
| No MSAA | 6.70 (−28%) | 15.51 (−15%) | Every edge jagged |
| An 8-bit target | 9.47 (0) | 18.38 (0) | Unchanged in daylight; the manor bands in candle-dark rooms |
| DirectRenderPipeline | 9.54 (0) | 18.54 (0) | Edges jagged: the multisampling is lost in r186 |
| The phone's set together | 4.26 (−54%) | 8.63 (−53%) | Far view cleaner, fewer pools; heap 84 → 8 MB |

**Standing still with a flame in view** (60 Hz):

| Drawing | GPU busy at 1× | GPU busy at the phone's size |
|---|---|---|
| Every frame | 600 ms a second | 1,270 ms a second (more than the GPU has) |
| On change only | 0 | 0 |
| The flame capped at ~14 a second | 170 ms a second (−72%) | 270 ms a second (−78%) |

**What we choose:**

- **Reversed depth everywhere `reversedDepthBuffer` takes.** It holds the far view as log depth does, at the price of ordinary depth.
  - **Log depth** only where WebGL 2 lacks `EXT_clip_control`.
  - **This changes rule 7 below.** The manor's desktop still uses log depth outdoors, a one-line change in `src/make/render.js` for whoever holds it.
- **Window lights are the biggest lever,** about 1 ms per slot at 1× and 2 ms at the phone's size, lit or not.
  - Phones keep 3.
  - A laptop tier of 5, or baked bounce (R48 step 6) for windows out of view, would take back a quarter to half of a desktop frame.
- **Half textures and letting pixels go buy memory, not speed.** Keep both on phones. Letting pixels go is free on the desktop too.
- **MSAA stays.** The resolution controller drops the pixel ratio first.
- **The 8-bit target and DirectRenderPipeline stay flags.** Neither gains anything on WebGPU, and direct loses the anti-aliasing. Its WebGL 2 speed-up at the phone's size (27 → 60 fps) is mostly that. A phone's tiled GPU may still differ: Kabe's perf card answers that.
- **Draw on change and the flame's cap stay.**
- **The WebGL 2 fallback has no render bundles.** About 1 in 5 iPhones, and some Android phones, run it, so the fallback needs its own path: merged still rooms and per-room culling.

## The engine's standing rules (to build)

**1. Visible only.** Nothing invisible is drawn or computed.
- **Interiors:** room-and-portal culling. A room is drawn only if it's seen through an open doorway, so a closed door hides what's behind it.
- **One render bundle per room,** shown or hidden whole. Bundles don't cull inside themselves.
  - **Measured in the manor (2026-10-06): on hold.** With each room merged by material, a room is already a few draws.
    - **Frame time:** bundles take the hall from 7.9 to 6.1 ms and leave the great chamber unchanged (6.9 against 7.0).
    - **What goes wrong with them on (three r186, WebGPU):** the chimneypiece's stone and the leaded glass are not drawn, even with the glass kept outside the bundle. This looks like render-pass state that three doesn't restore after a bundle replays.
    - **Fixed already:** glass placed wrongly. Only opaque merged meshes now go into a bundle nested in the room's group.
    - **For now:** `?bundles=1` only. Revisit with a newer three, or where draws are many (streets, a forest).
- **Exteriors:** spatial clusters with frustum culling, then GPU culling where WebGPU allows.
- **Animations and flames** update only while visible. Processes are already worked out from elapsed time.
- **Physics** bodies out of view sleep.

**2. Hold by distance and visibility** (the production plan's four levels):
- **built:** your room and the rooms you can see into;
- **planned:** the next ring, as layout only;
- **exists:** everything else, as facts only;
- GPU memory is freed behind you.

**3. Render on change.** A still view of a still world isn't redrawn: no frames, no heat.

**4. Batch by kind.**
- One instanced mesh per kind.
- Materials shared by role, with colours and tones as instance data.
- Still rooms merged per material, inside their room's bundle.

**5. Light:**
- **Baked bounce light per room,** mixed by state (step 6 of R48).
- **A still sun's shadow map is drawn once,** and again only on change.
- **Only big things cast.**
- **Candle lights are pooled,** since removed lights leak (three.js #34705). The way to light many candles is decided by a bench.

**6. Resolution follows frame time.**
- Pixel density capped (1.5 on laptops, 1 on phones).
- A render-scale controller with hysteresis.
- Built-in upscaling (FSR1) where it looks right.
- MSAA store flags off on phones.

**7. Depth:** reversed wherever the backend gives it (the fps lab, 2026-10-08: the 4 km view held as log depth holds it, at the cost of ordinary depth; log costs 37–55% of a fill-bound frame). Logarithmic only outdoors on a WebGL 2 without `EXT_clip_control`. Distant things become stand-ins (impostors, merged chunks).

**8. Effects are tiered:**
- **phones:** none;
- **laptops:** SSAO at half resolution only if the eye can tell.

**9. Startup:**
- Textures from data in a worker pool, cached by the hash of their recipe. Expected: from 2 s to about 0.1 s on a repeat visit.
- Room geometry built in workers.
- Room 0 compiled first, then the rest streamed nearest first.
- Performance marks on every page (`?perf=1`): time to first frame and first walkable.

**10. The backend chosen per device.** A short measurement at first launch picks WebGPU or WebGL 2, and the choice is remembered. Kabe's phone ran a WebGL demo slightly faster than WebGPU, so neither is assumed.

**11. Delivery:**
- three.js's minified core remapped. Done: 162 KB saved.
- Versions pinned, `preconnect`, `modulepreload` for the final URLs.
- A service worker for instant repeat visits.
- Long caching needs a host that allows it (see below).

## What still needs the bench

- **Candlelight:** `DynamicLighting` against `ClusteredLighting` (WebGPU only) against per-room light lists, at 8, 32 and 64 candles.
- **Resolution:** the render-scale controller and FSR1, judged on quality and fps.
- **Ambient occlusion:** `SSAONode` at half resolution against our GTAO.
- **Startup:** `compileAsync` pre-warm on room entry.
- **The fallback:** room toggling with merged rooms against bundles.
- **Phones:** every rule measured on a phone, through the bench page.

## Kabe's call: hosting

GitHub Pages sends a fixed 10-minute cache, gzip only, no HTTP/3 and no custom headers. Long caching, Brotli and the headers for threads (COOP/COEP, for physics or generation across threads) need one of these:
- **Cloudflare Pages** (free; `_headers` file). Recommended.
- **Netlify.**
- **The heavy files from jsDelivr by commit** (`gh@<sha>`), keeping Pages for the HTML.

Moving hosts means making an account and is visible from outside, so it's his decision.

## Order of work

1. **Bench the rest** (above), in the fps lab, on both renderers.
2. **The shared engine renderer module** (`src/make/render.js`): rules 3, 6, 7, 8 and 10, with the marks.
3. **The four GLSL hooks rewritten in TSL:**
   - the bounce-light grid;
   - wood patina and soot;
   - book spines and titles;
   - drawer labels.

   Then the strongroom and the house move to `WebGPURenderer`.
4. **Visible only and hold by distance** (rules 1 and 2) in the house builder, with room bundles. This lands with R47's rooms.
5. **Startup** (rule 9): texture workers and caching, geometry workers, streaming.
6. **Delivery** (rule 10): the service worker. Long caching follows the hosting decision.
