# Serving and startup research: fastest first walkable frame, smooth play

Researched 2026-10-06. Research only; nothing in the repo was changed except this file. Every number marked **[measured]** I measured today (headless Chromium 145 via Playwright 1.58.2, a 16-thread Linux desktop, real network to jsDelivr and GitHub Pages; scratch scripts were kept outside the repo). Numbers marked **[sourced]** carry a URL. Anything marked **(uncertain)** is memory or inference and needs a check before it drives a decision.

## Top recommendations (read this first)

1. **Network is not the bottleneck; CPU is.** On the live house page the network is finished at about 0.76 s (26 requests, 419 KB), while the same page's own timing note says load to first frame is 8.0 s (kit 2.0 s, geometry 3.3 s, shader compiles; SwiftShader). Spend effort on the build, not on bundling.
2. **One-line fix, saves 162 KB (34%) of three.js transfer today.** jsDelivr's auto-minified `three.webgpu.min.js` / `three.module.min.js` import `./three.core.js`, the UNminified 1.46 MB (266 KB br) core, not `three.core.min.js` (104 KB br). Remap it in the import map. **[measured]** 470,653 B to 308,636 B (WebGPU), 358,259 B to 196,245 B (WebGL).
3. **Cache the generated textures and move generation off the main thread.** The 18 kit textures (40.4 MB raw RGBA) take 2.08 s to generate and 82-122 ms to read back from Cache Storage or IndexedDB **[measured]**. The recipes are pure typed-array math, so they also run in a worker pool (transfer, zero copy) with no canvas. GPU synthesis is the highest ceiling and the highest rewrite cost; do it last.
4. **Do not rely on GitHub Pages for caching.** It sends fixed `Cache-Control: max-age=600`, gzip only (no Brotli, no HTTP/3, no custom headers) **[measured]**. Long-cache the immutable bits via jsDelivr pinned to a commit SHA (`max-age=31536000, immutable`, Brotli, h3 **[measured]**), or a service worker, or move to Cloudflare Pages (`_headers`). Keep the HTML on GitHub Pages; it is tiny.
5. **Warm shaders behind the loader, but know what `compileAsync` really does in r186**: it compiles objects one at a time, only those inside the camera frustum, yielding with `scheduler.yield()` or else `requestAnimationFrame` (Safari has no `scheduler.yield`), and has an open r186 bug with textured materials while the render loop runs. Build room 0 first, compile it with the loop held, stream the rest.
6. **Define "first walkable" as a mark and measure it every publish.** The plan compiles in 1.5 ms, so collision and walkability can exist long before the pretty frame. Log marks, cold and warm, on a throttled run and on one real phone.

## 0. Our case today (baseline, all [measured] unless noted)

| fact | value |
|---|---|
| three versions in use | 0.160.0 (house, room3d, painted, brief, office, bench) and 0.186.1 (fps lab, scale/forest), both from cdn.jsdelivr.net via import map |
| own runtime JS (26 modules: `src/`, `src/make/*`, `lab/painted/procedural.js`, `lab/house/*`) | 282 KB raw; 102 KB gzip -9; 89 KB brotli-11; minified 142 KB raw, 62 KB gzip, 56 KB brotli |
| live house page cold load | TTFB 163 ms, DOMContentLoaded/load 760 ms, FCP 488 ms, 26 requests (7 github.io, 15 jsDelivr, 4 Google Fonts), 419 KB on the wire, module waterfall 3 levels deep (HTML, then entry modules, then their imports) |
| same page repeated immediately | 0 bytes, all 26 from the disk cache (inside the 10-minute window; after 10 minutes each file revalidates with a conditional request) |
| kit build (`makeKit`, 18 canvas textures, 1024-class) | 2,078 ms on this 16-thread desktop; the oak field alone is ~750 ms; 40,370,176 B raw RGBA (+ mips on the GPU) |
| manor build per `lab/house/TIMING.md` (SwiftShader) | materials 2.0 s, geometry 3.3 s (about 150 ms a room), merge 0.4 s, plan compile 1.5 ms for all 22 rooms, page load to first frame 8.0 s |
| `index.html` | 119 KB with the app inline |

Consequences: the cold start is a CPU pipeline (kit, geometry, pipelines), mostly on the main thread; transfer is under a second; own code is small beside three.js. A phone is probably several times slower than this desktop on the CPU part (uncertain; measure on a device).

## 1. What to serve and how

### 1.1 GitHub Pages: what it actually does [measured, curl 2026-10-06]

- `cache-control: max-age=600`, weak `etag`, `last-modified`, `expires` = now + 10 min. Fixed. Confirmed also by the community thread (https://github.com/orgs/community/discussions/11884).
- `content-encoding: gzip` for HTML, JS, JSON and wasm even when the request says `Accept-Encoding: br, gzip, zstd`. **No Brotli.** (`.wasm` is served as `application/wasm`, gzipped; the Godot lab's 10.2 MB wasm goes out as 10,248,949 B gzip.)
- HTTP/2 only; no `alt-svc`, so no HTTP/3. Fastly in front (`x-served-by: cache-sjc...`, `x-cache`, about 83 ms edge time-to-first-byte from here).
- `access-control-allow-origin: *` on everything (good: cross-origin module use works). No `timing-allow-origin`, no `cross-origin-resource-policy`.
- Limits: site 1 GB, soft 100 GB/month bandwidth, soft 10 builds/hour (Actions bypass), not for commercial use (https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits). The repo already deploys an orphan `gh-pages` branch with a ~35 MB runtime subset via `tools/publish-site.sh`.
- Brotli gain is small for our own code anyway: 102 KB gzip vs 89 KB br (13%); minified 62 vs 56 KB. Even jsDelivr's three build is barely smaller in br than gzip (`three.webgpu.min.js` 201,968 B br vs 205,062 B gzip, 1.5%) **[measured]**.

### 1.2 three.js delivery: jsDelivr vs self-host

**Measured at r186.1 (br sizes from jsDelivr):**

| file | raw | br |
|---|---|---|
| `three.module.min.js` (WebGL build) | 392,831 | 90,124 |
| `three.webgpu.min.js` (WebGPU + WebGL 2 backend) | 820,877 | 202,390 |
| `three.core.min.js` | 415,816 | 104,314 |
| `three.core.js` (unminified, what the "min" files actually import) | 1,458,113 | 266,288 |
| `three.tsl.min.js` | 30,360 | 7,061 |

- **The trap.** `three.webgpu.min.js` ends with `... from"./three.core.js"` (verified in the file text). jsDelivr generates `.min.js` per file with Terser and does not rewrite the relative import, so the browser fetches the 1.46 MB unminified core. Same for `three.module.min.js` (and `three.tsl.min.js` imports `three/webgpu`, which resolves through our map).
- **The fix.** Import maps can remap by resolved URL:

  ```html
  <script type="importmap">{"imports":{
    "three": "https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.webgpu.min.js",
    "https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.core.js": "https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.core.min.js",
    "three/tsl": "...three.tsl.min.js", "three/addons/": "...examples/jsm/" }}</script>
  ```
  Measured effect (module evaluation only, fast desktop): WebGPU 470,653 to 308,636 B on the wire, 306 to 282 ms; WebGL 358,259 to 196,245 B, 232 to 188 ms. On a phone with a slow link the byte saving matters more than my numbers show (uncertain). The same module instance is used everywhere because every importer resolves to one URL.
- **Pin an exact version** (`@0.186.1`): immutable, `cache-control: public, max-age=31536000, s-maxage=31536000, immutable`, `timing-allow-origin: *`, `cross-origin-resource-policy: cross-origin`, `alt-svc: h3` **[measured]**. A moving tag (`@0.186`, or no version) gets only `max-age=604800` **[measured]**; never use it.
- **Self-hosting vs jsDelivr.** Cross-site HTTP cache sharing no longer exists (caches are partitioned by top-level site in current browsers; from memory, not re-fetched: https://developer.chrome.com/blog/http-cache-partitioning), so "visitors already have three from another site" is not a reason to prefer a CDN. Reasons that remain: jsDelivr gives immutable caching, Brotli and h3 that GitHub Pages cannot; self-hosting gives one connection and no third-party dependency but only `max-age=600` and gzip (about the same bytes). Recommendation: keep jsDelivr for three, pin, remap core, add `<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>` (module fetches are CORS requests, so `crossorigin` is required for the connection to be reused; standard practice, uncertain on the exact reuse behaviour per browser). Resilience option: a service worker (see 1.5) that precaches the three files makes a jsDelivr outage a first-visit-only risk.
- cdnjs (`three.module.min.js` 0.160 appears in `lab/room3d`) has no `three.core` split at 0.160, fine, but at r186 use jsDelivr; the addons come only from there anyway.

### 1.3 Own code: bundling vs native modules, minification, preload

- Evidence: modern guidance finds no noticeable difference below roughly 50-100 modules over HTTP/2, and that deep import chains create network waterfalls, one round trip per depth level, mitigated by `modulepreload` (https://blacksheepcode.com/posts/loading_optimisations_part_4, https://rolldown.rs/in-depth/why-bundlers; secondary sources). Ours: 26 modules, depth 3, one origin plus jsDelivr; the cost on the live page was two staggered request waves about 165 ms apart (432 ms, 598 ms, 627 ms, 759 ms after start) **[measured]**. That is the waterfall tax: each level is one RTT.
- **Do not bundle yet.** Flatten the waterfall with `modulepreload` for the entry graph instead (generated list in `publish-site.sh`, which already enumerates files). Pitfall **[measured, Chromium 145]**: `modulepreload`'s `href` is NOT remapped by the import map. Preloading `three.core.js` while the map sends it to `three.core.min.js` fetched BOTH (`three.module.min.js three.core.js three.core.min.js`); preloading the mapped URL fetched each once. So preload only final URLs. (Firefox/Safari behaviour unchecked.)
- Bundle later (esbuild, as a publish step, `--external:three`) when the graph exceeds about 50 modules or depth 4. A good split: one stable "kit + engine" chunk (changes rarely, caches well, V8 can code-cache it) and per-place data. V8's own advice is to avoid one giant file but to keep stable libraries apart from churny code and to update rarely (https://v8.dev/blog/code-caching-for-devs).
- **Minify own code**: 282 KB to 142 KB raw, 102 to 56 KB br **[measured, esbuild]**; saves about 40-46 KB on the wire and proportionally on parse. Small next to the three.core fix, so low priority; free once there is a bundle step.
- **Inline scripts are never code-cached** (V8 article above). The house page and `index.html` (119 KB) put the app inline in `<script type="module">`; moving it to a file gets it the cold, warm, hot code-cache path (Chrome caches compiled bytecode on the second load and serves it on the third; in a service-worker cache populated at install time it does a "full" cache immediately, 0 parse/compile on repeat: https://v8.dev/blog/code-caching-for-devs).
- Fonts: the house page pulls Google Fonts (1 CSS + 3 font files), which is render-blocking and a second third-party origin; self-host the one or two faces or use `font-display: swap`/system fonts for the loader.

### 1.4 Cache headers and versioning on GitHub Pages

- With a fixed 10-minute `max-age`, a visit after 10 minutes sends one conditional request per file (304, small, parallel; 26 round trips is fine, a deep waterfall of them is not). Query strings (`?v=hash`) change the URL and force a fresh fetch but do not lengthen freshness. Worse, in native modules `foo.js?v=1` and `foo.js` are different module instances, so `?v=` must be applied to the whole graph consistently: use an import map to do the versioning in one place (the blacksheepcode article's "cache invalidation cascade" point: with hashed filenames in imports, changing a leaf rewrites all its parents; the map decouples that).
- Options that actually give long caching, best first for us:
  1. **jsDelivr `gh` pinned to the commit SHA.** Tested against our repo: `https://cdn.jsdelivr.net/gh/5000Stadia/holo-emitter@<sha>/src/renderer.js` returns `cache-control: public, max-age=31536000, s-maxage=31536000, immutable`, `content-encoding: br`, `alt-svc: h3` (50,768 B br vs 152,949 B raw); `@gh-pages` (a branch) returns only `max-age=604800, s-maxage=43200` **[measured]**. `publish-site.sh` could write the import map and HTML with the new SHA so only the tiny HTML is on the 10-minute clock. Relative fetches (`fetch(new URL("./plan.json", import.meta.url))`) then resolve against jsDelivr automatically and jsDelivr sends CORS. Limits: 20 MB per file and 150 MB per package from GitHub by default (https://github.com/jsdelivr/jsdelivr/issues/18268); the first request for a brand-new SHA is a cold origin fetch (warm it with a curl loop in the publish script); it adds a hard third-party dependency for our own code (decision for Kabe; the fallback is to keep both URLs and a bootstrap that falls back to github.io on error). I did not find jsDelivr's acceptable-use text for gh content (their docs page did not render); read it before committing (uncertain).
  2. **Service worker** cache-first for versioned files (1.5). Works on any host. First visit gets no benefit.
  3. **Move to a host with headers** (1.6).
- Not worth it: a Cloudflare proxy in front of github.io (needs a custom domain; the thread above mentions it).

### 1.5 Service worker for instant repeat visits and offline

What it buys: repeat visit with zero network for code and data, offline play, jsDelivr outage insurance, and the full V8 code cache for scripts cached at install time (above). What it costs and where it bites:

- **Pitfalls (sourced: https://developer.chrome.com/docs/workbox/handling-service-worker-updates, https://developer.chrome.com/docs/workbox/remove-buggy-service-workers):** the deploy-update dance (new worker waits until all tabs close; do not blindly `skipWaiting()` on every release because open pages may expect the old module set; prefer an "update ready, reload" prompt), stale HTML pinning users to an old build (serve navigations network-first with a short timeout, and only immutable hashed/versioned URLs cache-first), a bad worker locking out users (ship a kill switch: a `sw.js` that unregisters itself and clears caches, and keep `sw.js` itself uncached), and the 10-minute GitHub cache on `sw.js` (the browser's update check bypasses the HTTP cache for the worker script by default; (uncertain) verify, since `updateViaCache` defaults to `imports`).
- **Scope:** a project page lives at `/holo-emitter/`; the worker must be served from there and controls only that path. It is origin-wide for `5000stadia.github.io`, so another project page on the same origin would not conflict as long as scopes differ (uncertain if you ever add sibling projects).
- **The first visit gets nothing** and the page is not controlled until after a reload unless you `clients.claim()`.
- **Safari/WebKit** deletes script-writable storage, including service-worker registrations and caches and IndexedDB, after 7 days without user interaction in Safari proper; installed Home Screen apps are exempt (https://webkit.org/tracking-prevention/, and secondary summaries). So on iOS the repeat visit speed-up lapses for people who come back weekly or less; expect it to repopulate, not to break. Request `navigator.storage.persist()` (uncertain how often granted).
- **Quota:** 40 MB of raw textures would be a visible chunk; cache the compact form (see 2.3).
- **Workbox or hand-rolled?** For our shape (a handful of versioned URLs plus a few JSON files) a hand-rolled worker is about 40-60 lines: `install` precaches the list the publish script emits (one URL list, versioned by commit SHA in the cache name), `activate` deletes old caches, `fetch` does cache-first for listed URLs and network-first for navigations. Use Workbox (`workbox-build` `injectManifest`, `precacheAndRoute`, `cleanupOutdatedCaches`) only if the manifest generation or strategies grow; it adds a dependency and a build step. Both options are fine; the hand-rolled one is easier to read and has no tooling (opinion).
- Cross-origin cache of jsDelivr files works because jsDelivr sends CORS (`access-control-allow-origin: *`), so responses are not opaque and count honestly against quota. Google Fonts files do the same (uncertain).

### 1.6 Hosts that allow headers; which headers matter

- **Cloudflare Pages:** `_headers` file in the build output; up to 100 rules, 2,000 chars/line; applies to static assets only, with the standard long-cache example `Cache-Control: public, max-age=31556952, immutable` (https://developers.cloudflare.com/pages/configuration/headers/). Brotli is automatic and HTTP/3 is on (https://developers.cloudflare.com/speed/optimization/content/compression/; the Pages-specific h3 claim is from secondary sources). Free plan: unlimited static bandwidth and requests, 20,000 files, 25 MiB per file (secondary sources: https://dev.to/nayankyada/cloudflare-pages-pricing-2026-free-tier-limits-workers-costs-when-to-upgrade-2ono; re-check the current limits page before relying on it).
- **Netlify:** `_headers` or `netlify.toml [[headers]]`; Netlify controls `Content-Encoding` itself (https://docs.netlify.com/manage/routing/headers/). Free tier has bandwidth caps and a credit model in 2026 (secondary sources, uncertain).
- Moving costs: the public link `5000stadia.github.io/holo-emitter/lab/` changes (leave a redirect page on GitHub Pages) and the publish script changes. Cloudflare Pages also lifts the GitHub "no commercial use" wording. It is Kabe's call.
- **Headers that would matter if we could set them:**
  - `Cache-Control: public, max-age=31536000, immutable` on content-versioned files (`/v/<hash>/...`); `no-cache` (revalidate) on the HTML and `sw.js`.
  - `Content-Type: application/wasm` for streaming compile (GitHub Pages already does this).
  - `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy: require-corp` only if we want `SharedArrayBuffer` (wasm threads, a threaded physics build, `performance.measureUserAgentSpecificMemory()`). three.js, WebGPU, OffscreenCanvas, workers and transferables do not need cross-origin isolation, so we need none of it today. If ever needed: GitHub Pages cannot set it, but `coi-serviceworker` re-serves the page through a worker with the headers (reload on first visit; https://github.com/gzuidhof/coi-serviceworker). With `require-corp`, cross-origin subresources must opt in; jsDelivr already sends `cross-origin-resource-policy: cross-origin` **[measured]**, GitHub Pages' own files do not send CORP (same-origin needs none).
  - `Timing-Allow-Origin: *` so Resource Timing exposes sizes for our own cross-origin assets (jsDelivr already sends it).
  - `Link: <...>; rel=modulepreload` / 103 Early Hints on hosts that support them (Cloudflare does; untested here).
  - `Accept-CH`/`Permissions-Policy`: not relevant.

## 2. Assets we might add later, and generating textures at runtime

### 2.1 Compression formats and loaders

Sizes below are the decoder payloads, **[measured]** from jsDelivr `three@0.186.1/examples/jsm`, br:

| piece | br size | note |
|---|---|---|
| `libs/basis/basis_transcoder.wasm` + `.js` | 245,398 + 15,826 B (527 KB + 58 KB raw) | one-time, immutable cache; `KTX2Loader.js` 9,410 |
| `libs/draco/gltf/draco_decoder.wasm` + wrapper | 59,333 + 11,684 B | `DRACOLoader.js` 6,069 |
| `libs/meshopt_decoder.module.js` | 7,868 B | no wasm file; wasm is inlined |
| `GLTFLoader.js` | 26,587 B | |

- **Meshopt over Draco** for us: an eighth of the decoder bytes, decodes "considerably faster" (https://www.utsubo.com/blog/threejs-best-practices-100-tips; secondary), meshoptimizer quotes 3-6 GB/s vertex/index decoding on desktop, about 1-1.2 B per triangle for indices, 2-4x on vertex data (https://github.com/zeux/meshoptimizer), and it also does morph targets and animation. Draco compresses geometry harder (87-95% in sourced examples) but costs decode time and larger decoder. Our geometry is generated in code, so neither matters until we import meshes (the catalogue/Objaverse path), where `gltfpack -cc -tc` or glTF-Transform (`optimize`, `meshopt`, `etc1s/uastc`) is the pipeline: https://gltf-transform.dev and the gltfpack options in the meshoptimizer README.
- **KTX2 / Basis Universal** (https://www.donmccurdy.com/2024/02/11/web-texture-formats/, https://github.com/BinomialLLC/basis_universal): ETC1S is the small mode, file size comparable to JPEG, low/medium quality, good for colour textures, poor for normal maps. UASTC is BC7-class quality (needed for normal maps and data textures), roughly 8 bpp raw, 1-2x the size of JPEG/ETC1S once Zstd-supercompressed. Both transcode on the device to whatever the GPU supports (BC7/ASTC/ETC2), so they stay compressed in VRAM: 4-8x less VRAM and 4-8x faster uploads than PNG/JPEG/WebP that must be decoded to RGBA on the CPU (a 4096 px texture with mips is about 90 MB uncompressed). Don's guidance: use KTX2 when users stay long and load many textures interactively; for tiny or one-off images, ordinary formats are simpler. Common mix: ETC1S for the bulk, UASTC for normals and a few hero textures. Texture arrays (`DataArrayTexture`, `CompressedArrayTexture`, KTX2 arrays) and atlases reduce binds and pipeline permutations; our label atlases already do the atlas version.
- **Where it fits us:** VRAM and upload more than download. Our 18 kit textures are 40.4 MB raw (about 54 MB with mips). Roughly 7-14 MB in a KTX2 equivalent (4-8x, sourced ratio). Only worth a pipeline if we bake the kit (below).
- **Download size reality check** for noise-type textures **[measured]**: the 18 kit textures encode to 11.3 MB as PNG, but only 0.80 MB as WebP at quality 0.9 (1,780 ms of encode time). A downloaded lossy WebP kit would be smaller than a typical phone network second, but it is lossy (do not use for normal or height data without eyeballing; uncertain), has to be decoded to RGBA on the CPU and uploaded uncompressed, and breaks the "everything generated live" principle (though the kit is per style, not per place).

### 2.2 When runtime generation beats downloading (decision rule)

- Generate when the texture depends on the place (seed, plan, palette, text, wear): downloading is impossible without per-place files.
- For the shared per-style kit (oak, floor, plaster, stone, brick, flags: about 2 s here, "once per style" in `TIMING.md`), downloading a baked pack and caching generated pixels are both cheaper than regenerating on every visit. Ladder, cheapest first: (a) cache the generated pixels locally (2.3), (b) parallelise generation (2.4), (c) bake at publish time with the very same recipe run in Node (it is pure array math, needs no canvas) into KTX2, shipped as a handful of files (adds assets but removes about 2 s of main-thread CPU and cuts VRAM), (d) GPU synthesis (2.5).

### 2.3 Cache generated textures (IndexedDB / Cache Storage keyed by a recipe hash) [measured]

Same 40.4 MB, 18 textures, one session, Chromium on this desktop: generation 2,078 ms; `getImageData` of all 45 ms; IndexedDB write 185 ms, read 122 ms; Cache Storage write 202 ms, read 82 ms; building `DataTexture`s from the bytes about 0 ms (upload cost is separate). So a warm start is roughly 25 times faster than generating, and the write can be deferred to idle time.
- **Key**: hash of the recipe version (a constant bumped, or a hash of the recipe source), parameters, seed and resolution. A stale key must never serve stale pixels, so include the code build id.
- **Store small**: 40 MB raw is heavy for quota (Safari eviction above) and read time on a phone's flash. Cheaper: store 8-bit height (1 channel) and derive the normal map on the GPU or CPU after load (normals are computed from heights anyway in `normalFrom`); store lossless PNG/WebP via `OffscreenCanvas.convertToBlob` and decode with `createImageBitmap` in a worker (11.3 MB as PNG per above); drop to 512 px on phones.
- Storage persistence: `navigator.storage.persist()`; test-private windows and ITP behaviour (1.5). Cache Storage has the extra advantage that a service worker can serve it with no page code.
- Cache Storage vs IndexedDB: in this test Cache Storage read was faster (82 vs 122 ms), but I did not test a cold disk, concurrent access, or a phone; no public head-to-head benchmark found (uncertain).

### 2.4 Workers: generate pixels without the canvas, in parallel

- The expensive recipes in `lab/painted/procedural.js` (`oakField`, `fbm`, `vnoise`, `normalFrom`, floor, stone, plaster, brick) are deterministic integer-hash and float loops over typed arrays that only use `document.createElement("canvas")` as an output buffer. Replace `canvasTex` (canvas, `createImageData`, `putImageData`, `CanvasTexture`) with a function returning `{w,h,data:Uint8Array}` and build a `THREE.DataTexture` (set `colorSpace`, `wrapS/T`, `anisotropy`, `generateMipmaps`) on the main thread. This also removes a canvas copy and the premultiply round trip.
- A worker pool (`navigator.hardwareConcurrency`, cap 4-6 on phones) takes one task per texture; result `ArrayBuffer`s go back in the transfer list (zero copy). Per-pixel work is independent, so the 750 ms oak field can be split into row bands. Expected wall time is about max(longest chunk) rather than the sum; on this desktop 2.08 s should fall to a few hundred ms (estimate, not measured), and the main thread is free so the loader animates and input works.
- Drawing recipes that need Canvas 2D text/gradients (book spines, press labels in `parts/books.js` and `parts/press.js`) can use `OffscreenCanvas` in a worker (supported in current browsers; font availability inside workers needs `FontFace` loaded in the worker, uncertain per browser) and transfer an `ImageBitmap` (`transferToImageBitmap()`), which `THREE.CanvasTexture`/`Texture` accepts. Caveats: `flipY` is ignored for `ImageBitmap` sources, so use `createImageBitmap(..., {imageOrientation: "flipY"})` or flip in the recipe (three.js behaviour; uncertain how r186 WebGPU treats it; test). Prefer raw `DataTexture` where possible.
- **Import maps do not apply in workers** **[measured]**: a module worker doing `import * as T from "three"` fails to load in Chromium 145; the same worker importing the absolute jsDelivr URL works (BoxGeometry built, 24 vertices). So workers must import absolute URLs or a bundled worker file, and the cache-busting/versioning scheme must also cover the worker script.
- Mobile resolution tiers: cost scales with pixel count, so 512 px on phones is 4x cheaper; compare by eye (design call).

### 2.5 GPU texture synthesis

- three.js can fill a texture on the GPU two ways: a compute pass into `StorageTexture` (WebGPU backend only; https://threejs.org/docs/pages/StorageTexture.html, https://github.com/mrdoob/three.js/issues/27508) or a full-screen TSL node material rendered into a `RenderTarget` (works on both the WebGPU and WebGL 2 backends). TSL ships MaterialX noise (`mx_fractal_noise_float`, `mx_noise_*`, octave/lacunarity/diminish parameters) so fbm-style recipes have a start (https://www.balazsfarago.dev/blog/procedural-materials). Mipmaps: `generateMipmaps` works on render targets; storage textures need `mipmapsAutoUpdate` handling (seen in the r186 source).
- A 1024x1024 8-octave fbm is a few million noise evaluations, trivially sub-millisecond-to-milliseconds on any GPU versus about 750 ms of JavaScript (estimate; not measured because the local headless run has no real GPU). The real costs are: rewriting each recipe in TSL (a second implementation; keep the JS version as the reference and for the Node bake and tests), one more pipeline compile per recipe (combine several into one MRT pass; uncertain per-compile cost), the heightmap to normal-map pass needing a second pass, float differences between GPUs (textures will not be bit-identical across devices, so golden-image tests and recipe-hash cache sharing need a tolerance), and the WebGL 2 fallback, where compute is unavailable (use render-to-texture there). Verdict: highest ceiling, highest effort; do after 2.3 and 2.4, and only if a phone still misses the budget.
- Related pre-upload: after `await renderer.init()`, `renderer.initTexture(tex)` uploads a texture ahead of first use "rather than waiting until first render (which can cause noticeable lags due to decode and GPU upload overhead)" (doc comment in r186 source, verified). Spread the calls across frames; a 1024 RGBA texture with mips is about 5.6 MB of upload each (arithmetic; real cost per device is uncertain, measure).

## 3. Startup

### 3.1 Shader and pipeline compile

What r186 `WebGPURenderer.compileAsync(scene, camera, targetScene?)` does, from the shipped `three.webgpu.js` source [verified by reading it]:
- It projects the scene with the camera's frustum, so **only visible objects that intersect the camera frustum (or have `frustumCulled=false`) are compiled**; objects outside, or `visible=false`, are skipped and will compile on first draw. To warm a whole house set `frustumCulled=false` on the meshes temporarily or compile from several camera positions; "lighting and environment must be configured before calling" and the third parameter lets you compile a new room's objects against the live scene.
- It processes render objects **sequentially**: per object, build the node program, create the pipeline with `device.createRenderPipelineAsync` (thread pool, not blocking), `await` it, then `await yieldToMain()`. Cost is the sum of per-pipeline latencies plus one yield each; there is no parallel batch.
- `yieldToMain()` uses `scheduler.yield()` when present, else `requestAnimationFrame`. `scheduler.yield()` ships in Chrome 129+ and Firefox 142+ but not Safari (https://developer.chrome.com/blog/use-scheduler-yield). So on Safari every object costs at least one frame (about 17 ms at 60 Hz, about 8 ms at 120 Hz), so 60 distinct objects is about 1 s, and in a background tab `rAF` is paused so the promise does not resolve (uncertain: verify on an iPhone).
- r186 has a reported bug: when compiling large sets of textured materials while the animation loop is running, a frame can change a texture filter between binding registration and index assignment, giving "Binding doesn't exist in BindGroupLayout"; present in r186, not fully fixed in r187 per the reporter (https://github.com/mrdoob/three.js/issues/34632). Mitigation: hold the render loop while `compileAsync` runs (we have a loading overlay anyway), or apply the reporter's no-yield-during-generate patch.
- Since r184 it no longer blocks rendering the way the old sync path did (secondary: https://www.utsubo.com/blog/webgpu-threejs-migration-guide, https://bugnet.io/blog/fix-webgpu-pipeline-creation-async-blocked-first-frame). Without precompiling, the first frame that draws new shaders can stall 200-500 ms or more as pipelines are created (secondary, other engines; our SwiftShader note shows "about 2.7 s when new shaders compile" after editing a room).
- WebGL fallback: `WebGLRenderer.compileAsync` polls `KHR_parallel_shader_compile` (confirmed in r186 source) so programs link in parallel; the three.js path is already doing the right thing there.
- **Fewer pipelines is the cheapest compile fix**: three caches pipelines by material program, geometry layout and render state, so identical materials share one. Merging by material already gives 397 draw calls from 3,044 parts; also count distinct permutations (`vertexColors` on/off, `side`, normal map present, shadow and depth variants, light count). Keep the light count constant per scene (move lights, do not add) so programs are not rebuilt; keep the same material instance across rooms.
- **Persistent pipeline cache.** The WebGPU spec expects user agents to cache shader/pipeline compilation to speed second visits, but there is no API for the page to save or load a pipeline cache (native wgpu has one; https://www.w3.org/TR/webgpu/, https://docs.rs/wgpu/latest/wgpu/struct.PipelineCache.html). Chrome's Dawn has an on-disk cache (uncertain on persistence and key rules); ANGLE caches program binaries for WebGL in Chrome (uncertain). So: warm start gets faster for free, not controllably. Test cold vs warm with a persistent browser context and report both; do not promise it on Safari or Firefox.
- WebGPU availability (Jan 2026 baseline per https://web.dev/blog/webgpu-supported-major-browsers, https://www.webgpu.com/news/webgpu-hits-critical-mass-all-major-browsers/): Chrome/Edge 113+ desktop, Android 121+ (Android 12+, Qualcomm/ARM), Firefox 141+ Windows, 145+ macOS arm64, Safari 26 (macOS/iOS/iPadOS). Linux and Firefox Android lag, so the WebGL 2 fallback is real traffic, and its first-frame cost profile differs (parallel compile, no pipeline objects).

### 3.2 Splitting work across frames

- During a loading overlay, do not throttle to a frame budget; run chunks as fast as possible and yield only to keep the overlay animating and input alive. A `rAF` yield costs up to 16 ms each (60 chunks is 1 s). Use `scheduler.yield()` when present else `MessageChannel`/`setTimeout(0)` (the repo's `await new Promise(r=>setTimeout(r))` in `makeKit` is a fine fallback; `setTimeout` is clamped to about 4 ms after nested calls (uncertain on exact browser clamps)). `scheduler.postTask` with `background` priority is available in Chrome/Firefox (not Safari) for post-walkable streaming.
- After first walkable, switch to a per-frame budget (about 4-6 ms) so building later rooms never produces a frame over 33 ms.
- Run the render loop only when it has something to show; for compile and room build keep it off to avoid the r186 race above.

### 3.3 Geometry in Web Workers

- Our geometry builds (walls, panelling, windows, stairs; about 150 ms a room, 3.3 s for the 22-room manor, plus 0.4 s merge) are pure functions of kind, look and seed (`build(kind, address)` in `src/make/build.js`). Move the pure part to a module worker pool: input is the room's compiled plan; output is a pack of typed arrays per material role (positions, normals, uvs, vertex colours, indices, groups) in the transfer list; the main thread wraps them in `BufferGeometry` and attaches shared materials (materials stay on the main thread, keyed by role id). 22 rooms at about 150 ms across 4 workers is roughly 0.8 s (estimate). Rooms arrive as they finish, which is also the streaming mechanism.
- Constraints: the worker must import three by absolute URL (import maps do not apply; **[measured]** above) and cannot touch `document`; `K.board`, `mergeGeometries` and the geometry classes work without a DOM (`three.core` has no DOM dependency); anything using canvas moves to `OffscreenCanvas` or becomes `DataTexture` (2.4). Duplicate memory (each worker loads the kit code, a few hundred KB) is acceptable; keep the worker count at 3-4 on phones.
- `OffscreenCanvas` rendering (render loop in a worker) is a different, bigger step (input/pointer plumbing, physics split); three.js has an official worker example and the Evil Martians write-up (https://evilmartians.com/chronicles/faster-webgl-three-js-3d-graphics-with-offscreencanvas-and-web-workers), and WebGPU works in workers, but it is not needed for startup. Skip until the main thread is the proven frame-time limit.

### 3.4 Stream the nearest rooms first

- The plan compile is 1.5 ms for all 22 rooms, so topology, collision and walkable floor exist immediately. Order the build by door-graph distance from the spawn: room 0 (floor, walls, openings, lighting), then rooms visible through its doors, then neighbours, then the rest in background. Far rooms can be absent behind closed or occluding doors until built; where a door is open to a not-yet-built room, show a dark or fog placeholder volume to avoid popping, with a short fade as the room appears (design call).
- Plan for **two first frames**: first walkable (collision, room 0 shell, kit textures at the low tier or from cache, compiled pipelines for room 0) and "full quality" (higher-resolution textures and other rooms). Swap textures in place, no pipeline change since the materials are the same instances.
- `renderer.compileAsync(roomGroup, camera, scene)` for each new room before it is added, with the loop held for that one call.
- Memory/GPU: textures uploaded when first used; call `initTexture` ahead of use for the next room's textures a few per frame.

## 4. Measuring it

Define everything relative to `performance.timeOrigin` with `performance.mark()` and read them out as `performance.measure()` entries so they also appear in the Chrome DevTools Performance panel's Timings track.

**Marks to add (names are a proposal):**
`html-start` (navigation `responseStart` = TTFB), `modules-ready` (first line of the entry module), `three-ready` (after `await import("three")`), `renderer-init` (after `await renderer.init()`; record `renderer.backend` type, WebGPU or WebGL 2, and the adapter/renderer string), `plan-compiled`, `kit-start/kit-end` (and from cache, `kit-cache-hit`), `room0-geometry`, `room0-compiled` (after `compileAsync`), `first-frame` (second `requestAnimationFrame` after the first `render()`, followed by `await device.queue.onSubmittedWorkDone()` on WebGPU so the frame really finished; on WebGL a 1-pixel `readPixels` forces completion), `first-walkable` (input enabled, collision ready, room 0 compiled, and 3 consecutive frames under 20 ms), `rooms-ready-N`, `fully-built`.

**Also log:**
- Network per resource from `PerformanceResourceTiming`: `transferSize`, `encodedBodySize`, `decodedBodySize`, `nextHopProtocol`, `deliveryType` (cache), and `responseStart` for TTFB; jsDelivr sends `timing-allow-origin: *` so cross-origin detail is visible; GitHub Pages does not but our same-origin files are fine.
- Script parse/compile/eval: `PerformanceObserver` for `longtask` and **`long-animation-frame`** (Long Animation Frames API, Chromium; attributes script time and gives frames over 50 ms; https://developer.chrome.com/docs/web-platform/long-animation-frames). Count and sum LoAF during load and again after first-walkable (target zero in the second window except during streaming).
- Frame stats after first-walkable: mean, p95, p99 frame time, count over 33 ms (the repo's fps lab, `tools/fps-lab.mjs`, already reports mean and p99 ms, draw calls, triangles).
- three.js: `renderer.info` (calls, triangles, geometries, textures) and, on WebGPU with the timestamp-query feature, GPU pass times (`trackTimestamp`; API names in r186 uncertain, check the docs) to separate CPU from GPU cost.
- Context for each record: git SHA/build id, UA, GPU (`WEBGL_debug_renderer_info` or `adapter.info`), `devicePixelRatio`, `hardwareConcurrency`, `navigator.deviceMemory` (Chromium), `navigator.connection.effectiveType` (Chromium), service-worker controlled or not, and cold / repeat / warm-cache state.
- Memory: `performance.measureUserAgentSpecificMemory()` needs cross-origin isolation (so not available on GitHub Pages without the coi hack); use `performance.memory` (coarse, Chromium) and `renderer.info.memory` instead.

**Tools:**
- A Playwright script (the repo has `tests/.perf.mjs`, `tools/fps-lab.mjs`) with a CDP session: `Network.emulateNetworkConditions` (Fast 3G / 4G profiles), `Emulation.setCPUThrottlingRate` (4x-6x as a phone proxy, a rough stand-in only), a fresh context for cold and a kept context for repeat (this is how I got the numbers above). Report cold, repeat-within-10-min, repeat-after-10-min (force conditional requests by clearing nothing and advancing the clock, or by serving through a header-controlled local server), and with the service worker.
- Real devices: Android Chrome via `chrome://inspect` remote debugging (Performance panel with the marks); iOS Safari via Web Inspector on a Mac; a real phone number is the one that counts, because the SwiftShader and desktop numbers misrank costs (SwiftShader shader compile and rasterization are slower than a GPU, JS is faster than a phone).
- Lighthouse (timespan or navigation mode) for the network side and LCP/TBT; it does not know about "first walkable", so it supplements, not replaces, the marks. WebPageTest for real-device repeat-view and filmstrip (service status uncertain after the Catchpoint changes; check availability).
- `chrome://gpu`, `chrome://tracing` or the DevTools Performance panel's GPU lane for compile stalls; `--enable-unsafe-webgpu` is not needed in current stable.
- Keep a **scorecard** (this project's receipts habit, `lab/RECEIPTS.md`): one row per publish with build SHA, device, cold and repeat first-walkable, p95 frame time, bytes transferred.
- Proposed budgets (mine, not sourced; for Kabe to set): cold first walkable under about 3 s on a mid-range phone over 4G, repeat under 1 s; after first walkable no frame over 50 ms, p95 under 20 ms; total cold transfer under about 1 MB of JS+data before the first walkable.

## Suggested order of work (effort, gain)

1. Import-map remap of `three.core.js` to `three.core.min.js`; pin versions; `preconnect`; move inline module scripts to files; add `modulepreload` for final URLs. (minutes; about 160 KB and a code-cache win)
2. Add the performance marks and a `?perf=1` logger; capture a baseline on a real phone and the RX 460 laptop, cold and warm. (hours; makes every later step measurable)
3. Replace `canvasTex` with a data-returning recipe plus `DataTexture`; cache pixels (Cache Storage, recipe-hash key) and fall back to generation. (hours; 2 s to about 0.1 s warm)
4. Worker pool for kit textures and room geometry with absolute imports; stream rooms by door distance; `compileAsync` room 0 with the loop held. (a day or two; the largest first-visit win)
5. Service worker with a publish-generated precache list; decide jsDelivr-by-SHA or Cloudflare Pages for long caching. (a day; Kabe's decision on hosting)
6. Optional later: bake the kit to KTX2 in Node; TSL render-to-texture synthesis; meshopt/KTX2 loaders when the catalogue imports meshes.

## Sources

- GitHub Pages limits: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits ; cache discussion: https://github.com/orgs/community/discussions/11884
- coi-serviceworker (COOP/COEP on static hosts): https://github.com/gzuidhof/coi-serviceworker
- Cloudflare Pages headers: https://developers.cloudflare.com/pages/configuration/headers/ ; compression: https://developers.cloudflare.com/speed/optimization/content/compression/
- Netlify headers: https://docs.netlify.com/manage/routing/headers/
- jsDelivr limits discussion: https://github.com/jsdelivr/jsdelivr/issues/18268
- V8 code caching: https://v8.dev/blog/code-caching-for-devs
- Module waterfalls, modulepreload, import-map versioning: https://blacksheepcode.com/posts/loading_optimisations_part_4 ; https://rolldown.rs/in-depth/why-bundlers
- Service worker updates and kill switch: https://developer.chrome.com/docs/workbox/handling-service-worker-updates ; https://developer.chrome.com/docs/workbox/remove-buggy-service-workers
- Safari storage policy: https://webkit.org/tracking-prevention/
- Texture formats: https://www.donmccurdy.com/2024/02/11/web-texture-formats/ ; Basis Universal: https://github.com/BinomialLLC/basis_universal ; meshoptimizer: https://github.com/zeux/meshoptimizer ; glTF-Transform: https://gltf-transform.dev
- three.js perf tips (secondary): https://www.utsubo.com/blog/threejs-best-practices-100-tips ; WebGPU migration (secondary): https://www.utsubo.com/blog/webgpu-threejs-migration-guide
- three.js compileAsync r186 bug: https://github.com/mrdoob/three.js/issues/34632 ; StorageTexture: https://threejs.org/docs/pages/StorageTexture.html ; compute texture: https://github.com/mrdoob/three.js/issues/27508
- WebGPU spec (compilation caches): https://www.w3.org/TR/webgpu/ ; support: https://web.dev/blog/webgpu-supported-major-browsers
- `scheduler.yield()`: https://developer.chrome.com/blog/use-scheduler-yield
- Workers + OffscreenCanvas: https://evilmartians.com/chronicles/faster-webgl-three-js-3d-graphics-with-offscreencanvas-and-web-workers
- Long Animation Frames: https://developer.chrome.com/docs/web-platform/long-animation-frames
- three r186 source read directly: https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.webgpu.js (compileAsync, yieldToMain, initTexture) and `three.module.js` (`KHR_parallel_shader_compile`)
