# Contemporary libraries: fit for holo-emitter

Research checked 2026-10-14 (UTC). Requested by Kabe: “look into the more contemporary libraries that will work well in our system if it's a smart direction”. My reading: find useful, maintained components without changing the phone-first, procedural, single-truth architecture. This is a recommendation, not approval to install or migrate anything.

## Conclusion

There is no good reason to replace our engine with a library stack. The best immediate gains are using the renderer diagnostics we already have and applying one shared, priority-based frame budget. The strongest additional dependency to trial is **three-mesh-bvh's CPU path**, but only if the current aiming profile still shows expensive triangle intersections. **Recast** becomes valuable for irregular, larger-scale people routing; **Rapier** for moving physical objects, platforms or collision that our plan cannot describe. Those are different needs, not three competing replacements for walking.

For rendering, stay with **three's native TSL nodes**. A package accepting `three@0.186.1` does not establish compatibility with `WebGPURenderer`. This excludes the examined versions of pmndrs `postprocessing`, Troika, uikit and three-mesh-ui from the current client. The WebGL2 backend of the same renderer does not rescue them.

No candidate was installed or run in the client; no new phone benchmarks were performed. Compatibility below is based on published artifacts, source and official documentation. Phone-cost statements are engineering estimates, not measured savings. No outside implementation code was copied.

## The system a library must join

Local source inspected at `4064e664530348ed4cffa355e50074bded9fc05e`, with the unrelated working-tree changes left alone. The phone floor is **30 fps**, about **33.3 ms per delivered frame**; PC quality can scale above that baseline.

| Existing responsibility | Its actual job; what an addition must preserve |
| --- | --- |
| [lab/manor/index.html](../../lab/manor/index.html) import map | One three **0.186.1** instance, `three/webgpu`, `three/tsl`, native ES modules; no React or runtime bundler. |
| [src/make/render.js](../../src/make/render.js) | WebGPU-first `WebGPURenderer`, its WebGL2 backend, measured backend choice, dynamic resolution, render-on-change and a phone direct-render path. |
| [src/make/walk.js](../../src/make/walk.js), [claims.js](../../src/make/claims.js) | Body-sized standing/collision checks from plan, doors, furniture and stairs. These rules also serve checks. |
| [src/people/route.js](../../src/people/route.js) | Sliced A* on the walker's rules, with height and path straightening. This is the spatial routing seam. |
| [src/make/reach.js](../../src/make/reach.js), [case.js](../../src/make/case.js) | Semantic reachability: doors, keys, body fit, knowledge and puzzle gates. A navmesh cannot replace these proofs. |
| Manor page's `nearAim`, `aimOne`, `goTo` | Candidate filtering, mesh ray intersections, visibility and action selection. Accelerating triangles must not bypass interaction/access rules. |
| [src/make/lightpool.js](../../src/make/lightpool.js) | Fixed-count lights selected and faded from world state. Post effects do not replace real illumination or remove per-light shader cost. |
| [src/make/perfcard.js](../../src/make/perfcard.js) | Delivered-frame cadence, CPU/GPU timing when available, startup, memory and per-layer measurements. |
| [src/make/works.js](../../src/make/works.js), [facts-out.js](../../src/make/facts-out.js) | Accepted actions change the store and emit facts; meshes, animation, audio and any physics world are projections, not a second authority. |

The important renderer constraint is explicit in [three's migration guide](https://threejs.org/manual/pages/webgpurenderer): custom GLSL `ShaderMaterial`/`RawShaderMaterial`, `onBeforeCompile` modifications and the classic EffectComposer stack need node/TSL ports. This applies to `WebGPURenderer`, including `forceWebGL`, not just to the GPU API used underneath it.

## Release, licence and maintenance snapshot

“npm” links are registry records: versions are `dist-tags.latest`, dates are their publication dates, not repository package.json versions. GitHub release and default-branch activity are recorded separately; a pushed repository is not necessarily recently changed code. Dates are UTC. This is a licence screening, not a complete transitive-dependency audit.

| Package/tool | Latest npm release / publication | Licence | GitHub release and public activity observed |
| --- | --- | --- | --- |
| [three](https://registry.npmjs.org/three) — native nodes, Inspector, audio, loaders | **0.186.1**, 2026-09-24 | MIT | [r186 release](https://github.com/mrdoob/three.js/releases/tag/r186), Sep 24; [default-branch commit](https://github.com/mrdoob/three.js/commit/313f1f582b61af64f76ffaa4f23b3abb3ff298a1), Oct 14. Matches our pin. |
| [three-mesh-bvh](https://registry.npmjs.org/three-mesh-bvh) | **0.9.16**, 2026-10-08 | MIT | [v0.9.16](https://github.com/gkjohnson/three-mesh-bvh/releases/tag/v0.9.16), Oct 8; [commit](https://github.com/gkjohnson/three-mesh-bvh/commit/b0935a7ec5904d2c009880be8da843b2637f185d), Oct 12. |
| [@dimforge/rapier3d-compat](https://registry.npmjs.org/@dimforge%2Frapier3d-compat) | **0.21.0**, 2026-09-25 | Apache-2.0 | [JS changelog](https://github.com/dimforge/rapier/blob/master/bindings/typescript/CHANGELOG.md) dates 0.21.0 Sep 24; [current main-repo commit](https://github.com/dimforge/rapier/commit/475caa3ff4646fd9a796b67d14116256f4962bc7), Oct 10. Old rapier.js repo merged, not abandoned. |
| [recast-navigation](https://registry.npmjs.org/recast-navigation) | **0.43.1**, 2026-02-04 | MIT; retain upstream notices | [0.43.1 commit](https://github.com/isaac-mason/recast-navigation-js/commit/8769e8b9995f127033af9f6e6eeac3fad7d66201), Feb 4; latest formal [GitHub release 0.43.0](https://github.com/isaac-mason/recast-navigation-js/releases/tag/recast-navigation%400.43.0), 2025-09-24. |
| @recast-navigation/[core](https://registry.npmjs.org/@recast-navigation%2Fcore), [generators](https://registry.npmjs.org/@recast-navigation%2Fgenerators), [three](https://registry.npmjs.org/@recast-navigation%2Fthree), [wasm](https://registry.npmjs.org/@recast-navigation%2Fwasm) | All **0.43.1**, 2026-04-07 | MIT; retain upstream notices | Same repository. Scoped packages were published later than the umbrella; keep versions aligned. |
| [@pmndrs/scheduler](https://registry.npmjs.org/@pmndrs%2Fscheduler) | **0.3.0**, 2026-10-05 | MIT | [release commit](https://github.com/pmndrs/scheduler/commit/092c0be5a78739c7d1af266d371db89c86cf6875), Oct 5; [changelog](https://github.com/pmndrs/scheduler/blob/main/CHANGELOG.md). Pre-1.0, standalone port still settling. |
| [postprocessing](https://registry.npmjs.org/postprocessing) (pmndrs) | **6.39.5**, 2026-09-09 | Zlib, permissive | [v6.39.5](https://github.com/pmndrs/postprocessing/releases/tag/v6.39.5), Sep 9; [commit](https://github.com/pmndrs/postprocessing/commit/9cf03cff26615636a564d8bfddf765edb8917441), Sep 9. |
| [detect-gpu](https://registry.npmjs.org/detect-gpu) | **5.0.70**, 2025-02-23 | MIT | Superseded package name; maintained project publishes scoped version below. |
| [@pmndrs/detect-gpu](https://registry.npmjs.org/@pmndrs%2Fdetect-gpu) | **6.0.26**, 2026-10-11 | MIT | [commit](https://github.com/pmndrs/detect-gpu/commit/77701b88942d9939c76da49d67eb0b3d4edee4ac), Oct 11; no formal GitHub release found. |
| [stats-gl](https://registry.npmjs.org/stats-gl) | **4.2.3**, 2026-07-10 | MIT | [commit](https://github.com/RenaudRohlinger/stats-gl/commit/dae82f5a4a14d19a3ec21bc47b28a491a668a036), Jul 10; no formal GitHub release found. |
| [troika-three-text](https://registry.npmjs.org/troika-three-text) | **0.52.5**, 2026-07-24 | MIT | [monorepo commit](https://github.com/protectwise/troika/commit/a24a35964de2d8187e0808a3f0c06a8d85e7f4a9), Jul 24; no formal latest release found. Monorepo's 0.53.0 is not this package's npm version. |
| [@pmndrs/uikit](https://registry.npmjs.org/@pmndrs%2Fuikit) | **1.0.77**, 2026-10-13 | MIT terms in [published LICENSE](https://unpkg.com/@pmndrs/uikit@1.0.77/LICENSE); metadata says SEE LICENSE | [commit](https://github.com/pmndrs/uikit/commit/3ee63a8741b6e71b41ee581d3adb449089d1b840), Oct 14; formal [v1.0.46 release](https://github.com/pmndrs/uikit/releases/tag/v1.0.46), 2025-10-16, is behind npm. |
| [three-mesh-ui](https://registry.npmjs.org/three-mesh-ui) | **6.5.4**, 2023-03-24 | MIT | [v6.5.4 release](https://github.com/felixmariotto/three-mesh-ui/releases/tag/v6.5.4) and default-branch latest commit, 2023-03-24. |
| [meshoptimizer](https://registry.npmjs.org/meshoptimizer) | **1.3.0**, 2026-09-25 | MIT | [v1.3 release](https://github.com/zeux/meshoptimizer/releases/tag/v1.3), Sep 25; [commit](https://github.com/zeux/meshoptimizer/commit/f0a684f11ead064e176775c9b796f82a55910e92), Oct 14. |
| [@gltf-transform/core](https://registry.npmjs.org/@gltf-transform%2Fcore) | **4.5.1**, 2026-09-28 | MIT | [commit](https://github.com/donmccurdy/glTF-Transform/commit/3797aad585021e68cf5fbf3f2fba37783596ffac), Oct 6; no formal GitHub release found. |
| KTX2 / Basis Universal | KTX2 is a format; three's loader is in 0.186.1. No npm wrapper selected for Basis. | Loader MIT; Basis Apache-2.0 | Basis [v2_50 release](https://github.com/BinomialLLC/basis_universal/releases/tag/v2_50), 2026-08-03; [commit](https://github.com/BinomialLLC/basis_universal/commit/99f52d63aa6799cbdaecfe977111dc5ec3b31d47), Sep 1. |
| [howler](https://registry.npmjs.org/howler) | **2.2.4**, 2023-09-19 | MIT | [v2.2.4 release](https://github.com/goldfire/howler.js/releases/tag/v2.2.4), same day; [latest commit](https://github.com/goldfire/howler.js/commit/1d3053576a860e9854645493ad6c4a72c6cc6e45), 2025-11-23, README change. |
| [bitecs](https://registry.npmjs.org/bitecs) | **0.4.0**, 2025-12-06 | **MPL-2.0: non-permissive, file-level copyleft** | [default-branch commit](https://github.com/NateTheGreatt/bitECS/commit/1585cdb4ae9a6586aef5e4d9d30d7039e22cd543), Dec 6; no formal GitHub release found. Later repository push metadata is not a newer main commit. |
| [koota](https://registry.npmjs.org/koota) | **0.6.6**, 2026-04-09 | ISC | [v0.6.6 GitHub release](https://github.com/pmndrs/koota/releases/tag/v0.6.6), Aug 25; [main commit](https://github.com/pmndrs/koota/commit/cb1d015e3bbd25c935d921323f25942f71cfebd6), Aug 25. GitHub release date differs from npm publication. |
| [@theatre/core](https://registry.npmjs.org/@theatre%2Fcore), [@theatre/studio](https://registry.npmjs.org/@theatre%2Fstudio) | Both **0.7.2**, 2024-05-19 | Core Apache-2.0; **Studio AGPL-3.0-only: non-permissive copyleft** | [public main commit](https://github.com/theatre-js/theatre/commit/6ea82b938ea49609489f6377ded693ccc6ee8f5b), 2024-04-11; no formal latest release found. README says 1.0 development moved temporarily to a private repo; that is not evidence of a released 1.0. |

The two non-permissive cases are deliberate flags, not claims that their licences prohibit this project. A decision to distribute modified MPL-covered files or use/distribute the AGPL editor needs a licence review; the repository-level Theatre Apache label does not cover its Studio package.

## Spatial work: acceleration, physics and navigation

### three-mesh-bvh

It accelerates triangle raycasts, proximity and shape queries, with CPU BVHs, refitting, serialization and worker construction. Its declared peer range `three >=0.159.0` includes r186; CPU queries operate on geometry/math independently of either renderer. The strongest seam is the manor page's `aimOne`/`goTo`, after existing nearby-object filtering, not a rewrite of `walk.js`. A per-mesh BVH alone does not eliminate visiting thousands of objects. [Pinned API and package](https://github.com/gkjohnson/three-mesh-bvh/blob/v0.9.16/API.md), [manifest](https://github.com/gkjohnson/three-mesh-bvh/blob/v0.9.16/package.json).

There is now a **real `three-mesh-bvh/webgpu` entry**: `BVHComputeData`, TSL/WGSL traversal and storage-buffer acceleration require r185+, so r186 qualifies. The API is explicitly unstable. This is separate from both CPU raycasts and older GLSL helpers. Do not select the compute path for fallback-safe phone aiming: WebGPU support does not demonstrate the same compute path on WebGL2. [Pinned WebGPU API](https://github.com/gkjohnson/three-mesh-bvh/blob/v0.9.16/WEBGPU_API.md).

Native ESM, no WASM; resolve its module graph to our single three instance. Avoid an unowned global prototype patch. Construction adds startup time and memory; ordinary index reordering can affect triangle identity, for which the API offers indirect construction. Changed geometry needs refit/rebuild. Workers add import/transfer lifecycle requirements; document import maps are not a ready-made worker dependency solution, and parallel SharedArrayBuffer workers need cross-origin isolation. [Worker implementation](https://github.com/gkjohnson/three-mesh-bvh/blob/v0.9.16/src/workers/GenerateMeshBVHWorker.js).

**Verdict: adopt when a profile confirms residual triangle-query cost.** First trial only dense, frequently aimed-at geometry; measure build, retained memory and steady aiming on phones. Preserve room filters, shut containers, doors, visibility and affordance selection. No promised speedup before that trial.

### Rapier: @dimforge/rapier3d-compat

Rapier supplies CPU/WASM rigid bodies, collision and scene queries, joints and a kinematic controller with sliding, slopes, autostep and ground snapping. Core has no three dependency: r186/TSL is not a constraint on computing movement alongside either renderer. The controller returns corrected movement; the application remains responsible for applying it and enforcing world rules. [Official character controller](https://www.rapier.rs/docs/user_guides/javascript/character_controller/), [scene queries](https://www.rapier.rs/docs/user_guides/javascript/scene_queries/).

Current compat ships native ESM at `dist/rapier.mjs`, embeds WASM, and requires asynchronous initialization, not a runtime bundler or separate WASM URL. Older root-level import paths are obsolete. The old rapier.js repository was [merged into rapier](https://github.com/dimforge/rapier.js/commit/9f638c5384c282a8abd22515973ac7c82ccfbc43), not simply left dead. [Current bindings/changelog](https://github.com/dimforge/rapier/tree/master/bindings/typescript), [published artifact](https://unpkg.com/@dimforge/rapier3d-compat@0.21.0/dist/rapier.mjs).

The inspected artifact contains no `new Function`/`eval(`; do not repeat the older blanket claim that compat needs JavaScript `unsafe-eval`. WASM compilation still needs appropriate CSP permission. Embedded WASM avoids a separate fetch, not download, decoding or compilation cost. [Resolved CSP issue](https://github.com/dimforge/rapier.js/issues/366).

Phone costs include initialization, collider memory and any stepping/query load. Keep colliders simple and fixed scenery static. **Adopt when** falling/pushable things, moving platforms or arbitrary collision become a requirement. Then put an adapter beside `walk.js`, with body/door/stair equivalence tests and a bounded fixed step. Today replacing the concise plan walker would create a second collision model without a demonstrated need. Physics output must enter the world's accepted mutation path; it must not silently become authoritative persisted state.

### recast-navigation-js

Recast builds navmeshes; Detour supplies paths, crowds and links, with TileCache for obstacles. CPU/WASM `core` and `generators` consume geometry/data independently of rendering. That fits beside r186 on both backends. The optional `@recast-navigation/three` adapter's broad `three: 0.x.x` peer range is not r186 proof: its published debug integration imports traditional `LineMaterial`/`LineSegments2`. Use core arrays and our own node-compatible visualization rather than assuming that debug drawer works. [Official docs](https://docs.recast-navigation-js.isaacmason.com/), [published adapter](https://unpkg.com/@recast-navigation/three@0.43.1/dist/index.mjs).

ESM/import-map use is documented, though the sample pins older dependencies. Current default WASM compat is embedded-base64; a separate-WASM variant also exists. Await initialization and align all scoped versions. Generating navmeshes is real startup work; worker use needs an application wrapper. Tile rebuilds, crowd updates and the navmesh's retained memory require budgets. Upstream config specifies 64 MiB initial WASM memory with growth, not a measured phone total. [Vanilla example](https://github.com/isaac-mason/recast-navigation-js/blob/main/examples/three-vanilla-example/index.html), [WASM configuration](https://github.com/isaac-mason/recast-navigation-js/blob/main/packages/recast-navigation-wasm/CMakeLists.txt).

**Adopt when** `src/people/route.js` cannot meet route quality or the phone budget in larger irregular places. Recast could replace its spatial search, not `reach.js`'s semantic solvability or `case.js`'s knowledge proof. Derive geometry from plan/claims, represent changing doors and body sizes explicitly, and retain `walk.js` as a final movement validator until equivalence is proved. A path over a navmesh is not proof that the character can unlock its destination.

## Frames and performance

### A shared priority budget; a fixed step only where needed

The useful immediate direction is a **pattern**, not another loop package: one frame driver, mandatory input/action handling first, visible/near simulation next, and background generation/warming only from a shared remaining budget. The manor currently calls terrain tile updates, room-building and other work with separate budgets; [warm.js](../../src/make/warm.js) has its own quiet/idle scheme. Consolidated accounting would improve these seams without changing scene or truth APIs. Do not defer a truth-changing action because it is off screen; reduce only the cost of its projection or genuinely optional work.

For actual physics, accumulate elapsed time into fixed-size steps, bound catch-up, and interpolate presentation between states. This avoids an unbounded catch-up spiral; it does not by itself make every system deterministic. Adopt the idea, not copied implementation. A fixed step is unnecessary for a candle level already derived analytically from its start time in `works.js`. Keep visual eases in elapsed seconds. [Original fixed-timestep explanation](https://gafferongames.com/post/fix_your_timestep/).

No npm release/licence applies to our own implementation of these ideas. Browser `scheduler.postTask`/`yield` can help optional background work but are not universal frame deadlines; feature-detect and retain a fallback. Idle callbacks may arrive late and need bounded tasks. Neither API belongs in the critical input/render path as a browser-support requirement. [postTask documentation](https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/postTask), [yield documentation](https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/yield).

A contemporary packaged alternative is **@pmndrs/scheduler 0.3.0**: vanilla dependency-free ESM, optional React entry, ordered phases/DAG dependencies, demand/manual modes, per-job rates and bounded fixed-step phases. It has no three/renderer dependency and can be driven manually from the existing `setAnimationLoop`; do not let it start a competing RAF. Its very recent standalone port/API adds migration risk. **Adopt when** independent modules genuinely need job registration/order/lifecycle, not just to tidy the current loop. Retain `render.js`'s invalidation and `perfcard.js`'s accounting. [Official overview](https://github.com/pmndrs/scheduler), [0.3 fixed-step behavior](https://github.com/pmndrs/scheduler/blob/main/CHANGELOG.md), [published ESM](https://unpkg.com/@pmndrs/scheduler@0.3.0/dist/index.mjs).

### pmndrs/postprocessing versus native TSL

pmndrs `postprocessing` fuses effects efficiently in a classic WebGL pipeline. Its current peer range, `>=0.168.0 <0.187.0`, accepts r186 numerically; vanilla ESM does not require React. But its composer uses `WebGLRenderTarget`, WebGL context attributes and classic renderer state/properties. This is not the API of our renderer's WebGL backend. **Skip with our architecture**, rather than pinning three or adding a parallel classic renderer/material path. [Composer source](https://github.com/pmndrs/postprocessing/blob/v6.39.5/src/core/EffectComposer.js).

Use r186's **RenderPipeline** with TSL scene passes and nodes such as BloomNode for a named effect. `PostProcessing` is the old class name, deprecated since r183. These ship with the pinned three; `render.js` already accepts a `post.render()` seam. Nodes are the right shared-backend architecture, but test each chosen effect on both backends; compute-only techniques are not magically WebGL2-compatible. [RenderPipeline docs](https://threejs.org/docs/pages/RenderPipeline.html), [r186 BloomNode](https://github.com/mrdoob/three.js/blob/r186/examples/jsm/tsl/display/BloomNode.js), [deprecated class](https://github.com/mrdoob/three.js/blob/r186/src/renderers/common/PostProcessing.js).

**Adopt native nodes when** R68 or another approved visual goal needs a specific effect. Extra scene targets, fullscreen work, depth buffers and blur pyramids consume phone memory/bandwidth. Preserve the current phone [DirectRenderPipeline](https://github.com/mrdoob/three.js/blob/r186/src/renderers/common/DirectRenderPipeline.js) unless measurements justify replacing it. Bloom does not make a switched lamp illuminate its room; that remains `lightpool.js` and the light/probe system's job.

### detect-gpu

The maintained name is now **@pmndrs/detect-gpu**, not unscoped `detect-gpu`. It classifies hardware using stored graphics benchmarks and WebGL identification, not a live benchmark of this scene's WebGPU path. The official README warns that its gfxbench source stopped updating in December 2025. Native ESM is available; benchmark data adds a fetch unless hosted/preloaded, and a WebGPU page may need an extra WebGL context for identification. [Official project/migration](https://github.com/pmndrs/detect-gpu).

The possible seam is `render.js`'s initial tier or initial light defaults. Phone overhead is startup identification/data, not continuous GPU work; the larger risk is a misleading tier. It cannot see present thermal throttling or which of our two backends is faster. **Skip now**: our measured frame controller/backend memory is a better authority. If first-frame presets later require a classifier, use it only as a fallible hint, tolerate unknown/fetch failure, and never let it override delivered-frame evidence.

### stats-gl and the already-installed alternative

stats-gl is a vanilla ESM profiler with WebGL2/WebGPU, renderer/compute, worker and texture/TSL inspection support. It has a wildcard three peer. Its native renderer integration enables timestamp tracking and instruments renderer info/reset; this is a real integration, not proof for every future three version. Verify our **WebGPURenderer-with-WebGL-backend** combination separately from its general WebGL support. [Official API](https://github.com/RenaudRohlinger/stats-gl), [profiler source](https://github.com/RenaudRohlinger/stats-gl/blob/main/lib/core.ts).

The lower-cost choice here is what we already have: `perfcard.js` resolves optional renderer GPU timestamps; `render.js` exposes three's own **Inspector through `?inspector`**. Use those now. WebGPU timestamps require `timestamp-query`; WebGL needs disjoint-timer-query support and valid samples. Unsupported timing is unavailable, not zero. CPU submission time, GPU duration and delivered-frame gaps answer different questions. [r186 Inspector](https://github.com/mrdoob/three.js/blob/r186/examples/jsm/inspector/Inspector.js), [backend timestamp handling](https://github.com/mrdoob/three.js/blob/r186/src/renderers/common/Backend.js).

**Adopt stats-gl when** its texture/TSL capture UI or portable profiler display solves a diagnostic gap. It should not replace our startup, layer, phone-bench and truth-specific counters. Profiling, readbacks and previews have costs: keep them debug-only and measure with them disabled too.

## Text and UI

All three candidates offer useful world-space UI, but the **published versions inspected do not fit our node renderer**. This conclusion is from their material paths, not an assumption that pmndrs means React or that older software is always bad.

### troika-three-text

Troika supplies scalable SDF text, typesetting and shaping. Its `three >=0.125.0` peer range accepts r186, but published 0.52.5 derives GLSL through `onBeforeCompile`; this needs a node-material port for our renderer, on either backend. [Published text material](https://unpkg.com/troika-three-text@0.52.5/src/TextDerivedMaterial.js), [derivation utility](https://unpkg.com/troika-three-utils@0.52.5/src/DerivedMaterial.js).

It ships ESM, with bare dependencies, fonts, workers, glyph-atlas generation and possible Unicode fallback-font requests to resolve/cache. These bring first-use work, atlas memory and text overdraw on phones. The prospective seam is dynamic 3D signs or readable world documents, not the screen talk/keypad UI. **Skip on the current renderer**; reconsider only after a supported node path and an actual dynamic-world-text need. [Text builder](https://unpkg.com/troika-three-text@0.52.5/src/TextBuilder.js).

### @pmndrs/uikit

uikit's core really is vanilla; `@react-three/uikit` is separate. It provides layout and batched panels/glyphs. Nevertheless, published 1.0.77 still customizes `MeshBasicMaterial.onBeforeCompile` for glyphs, and its panel materials also inject GLSL. No native node path was found in the examined implementation. Active maintenance does not change that limitation. [Vanilla documentation](https://pmndrs.github.io/uikit/docs/getting-started/vanilla), [published glyph material](https://unpkg.com/@pmndrs/uikit@1.0.77/dist/text/render/instanced-glyph-material.js), [panel material](https://github.com/pmndrs/uikit/blob/main/packages/uikit/src/panel/material/create.ts).

ESM integration also brings Yoga layout, signals, font assets and asynchronous layout/font setup. Batching helps, but updating layout, glyph/panel resources and transparency still cost time and memory. It would improve a future in-world or headset interface, not today's DOM overlays. **Skip on this renderer**; revisit after explicit node support and a world-space UI requirement, not as a route to replacing the phone panels.

### three-mesh-ui; the better fit today

three-mesh-ui supplies layout, text and mesh backgrounds, but its text and panels construct GLSL `ShaderMaterial`. Its module distribution/font atlases do not solve that incompatibility. The 2023 release/default-branch activity also merits caution before new dependence. **Skip**; no reason to port a second UI framework for this client. [Material source](https://github.com/felixmariotto/three-mesh-ui/blob/master/src/components/core/MaterialManager.js).

Keep [lab/codepad.js](../../lab/codepad.js)'s phone-sized, keyboard-usable keys and [lab/ui/talk-panel.js](../../lab/ui/talk-panel.js)'s dialogs, input, transcript, notebook and accessibility. Sparse static world labels already use CanvasTextures in [parts/press.js](../../src/make/parts/press.js), [story.js](../../src/make/parts/story.js) and [books.js](../../src/make/parts/books.js). Cache these by content/style, rebuild only on change, and use our existing material path. This is already compatible with both backends and has no new package release to manage. Large dynamic text populations would need a separate benchmark; “CanvasTexture works” is not a claim that unlimited labels are cheap.

## Asset tooling — only if assets arrive

### meshoptimizer

meshoptimizer offers vertex/cache optimization, simplification and compression, with separate JS/WASM ESM tools/decoders. It is renderer-independent; r186's loader can consume the relevant compressed glTF extension. **Adopt when** imported or baked geometry becomes an actual input. Prefer optimization at author/build time; runtime decoding adds WASM startup/memory but can save transfer. Simplification changes geometric workload; compression alone does not reduce draw calls or current procedural construction. The future seam is an asset/bake stage upstream of the manor's builders, not replacing the kind catalogue or `lightpool.js`. [Official JS API](https://github.com/zeux/meshoptimizer/tree/master/js), [r186 GLTFLoader](https://github.com/mrdoob/three.js/blob/r186/examples/jsm/loaders/GLTFLoader.js).

### glTF Transform

`@gltf-transform/core` is a glTF document and I/O SDK, not the entire optimizer. Companion functions/extensions/CLI provide transformations. It is not tied to three or the graphics backend; an optimized asset still needs validation in r186's loader/material path. **Adopt when** there is a glTF ingest/bake pipeline to operate, normally in Node/build tooling. Adding core and its graph dependency to the public runtime would provide no current consumer. Phone savings would come from smaller/leaner resulting assets, offset by any decoder cost, not from the SDK itself. [Official project](https://github.com/donmccurdy/glTF-Transform).

### KTX2 / Basis Universal

KTX2 is the container; Basis is encoding/transcoding tooling; three's matching KTX2Loader is the runtime component. Its r186 implementation explicitly recognizes `WebGPURenderer` when selecting supported compressed formats after renderer initialization. Thus it is a viable WebGPU/WebGL2 route without pinning old three. Host matching decoder/worker/WASM resources, resolve their URLs and test the actual target format. [r186 KTX2Loader](https://github.com/mrdoob/three.js/blob/r186/examples/jsm/loaders/KTX2Loader.js), [Basis project/licence](https://github.com/BinomialLLC/basis_universal).

**Adopt when** baked image textures enter the pipeline and their transfer/residency is a demonstrated cost. Transcoding adds startup CPU/memory but GPU-compressed textures may reduce bandwidth/residency afterward. Adding a loader does not compress our live CanvasTextures or procedural shaders. Validate alpha, normal maps, colour space and readable label quality on both backends. This belongs upstream of texture loading, not as a replacement for the renderer's measured resolution tiers.

## Audio

### Howler versus native Web Audio / three audio

Howler adds playback pools/caching, sound sprites, format selection, fades and mobile unlock handling. Its spatial plugin uses Web Audio, independent of three/TSL, so core playback can accompany r186 on either renderer. HTML-audio fallback does not provide equivalent spatialization. Published 2.2.4 is AMD/CommonJS/browser-global rather than a native named-ESM distribution; direct no-bundler use means a pinned browser script/global or an explicitly prepared module, not assuming its npm import example works raw. [Official documentation](https://github.com/goldfire/howler.js#documentation), [published distribution](https://unpkg.com/howler@2.2.4/dist/howler.js).

**Adopt when** R72's audio design identifies a concrete asset-playback-management need beyond native APIs. On phones, decoded buffers, simultaneous audible sources and spatial panners matter more than the wrapper's convenience. Neither Howler nor three synthesizes sounds from a thing's material automatically or solves propagation through rooms/doors.

The better first choice for R72 is **three's already-exported Audio, AudioListener and PositionalAudio**, with Web Audio filters/custom sources as needed. These are renderer-independent and follow camera/scene transforms. Preserve the person's pending choice about sound ownership when R72 starts; this report does not settle it. [Native Audio](https://threejs.org/docs/pages/Audio.html), [PositionalAudio](https://threejs.org/docs/pages/PositionalAudio.html).

Accepted events from `works.js`/`facts-out.js`, the manor page's `onChange`, and movement/ground material form cue seams; room/door state drives any later acoustic graph. Playback handles stay outside the world truth. Start after a user gesture, cap voices, release buffers, and benchmark the chosen panning model. Add no sound dependency today merely to prepare for R72.

## ECS and sequencing

### bitECS and Koota

These optimize entity/component storage, queries and repeated simulation updates; they are not renderers and do not require a particular three version or GPU backend. Both have native ESM. Koota's React peers are optional and its React entry is separate, so “requires React” would be the wrong reason to reject it. Its core supports traits and relations. bitECS 0.4 supports data-oriented storage/queries, but its **current MPL-2.0 licence is not permissive**. [bitECS package/API](https://github.com/NateTheGreatt/bitECS), [licence](https://github.com/NateTheGreatt/bitECS/blob/main/LICENSE), [Koota core/API](https://github.com/pmndrs/koota), [published package](https://unpkg.com/koota@0.6.6/package.json).

Neither should replace the world store, `works.js`'s gates or the kind characteristics catalogue. Their credible seam would be a **derived, transient simulation cache** behind the people adapter or a measured hot loop, fed from authoritative events and disposable on reload. They do not create instancing, culling or fewer lights automatically. Phone costs include query bookkeeping, duplicate cached state and synchronization; gains require a measured repeated-update workload, not an entity-count slogan.

**Koota: adopt when** profiling a dense active population shows storage/query/update overhead and a plain typed-array view is insufficient. Compare the small vanilla core against a local data layout before adding ownership machinery. **bitECS: skip for the present architecture**: no demonstrated gain justifies a core-state migration or the additional licence obligations. This is not a claim MPL disallows use, nor a recommendation to pin an older release to evade it.

### Theatre.js

Theatre is a visual/programmatic timeline for authored motion, including arbitrary JS properties, so core can drive presentation values beside r186/TSL with either backend. It is not a physics, story-truth or procedural behavior engine. Its API supports an externally driven RAF, allowing it to share our renderer loop if ever used. [Official advanced/RAF documentation](https://www.theatrejs.com/docs/latest/manual/advanced).

The published core package is CommonJS rather than direct browser ESM, and depends on dataverse; direct import-map use would need a prepared browser/module artifact. Core is Apache-2.0, **Studio is AGPL-3.0-only**. Upstream documents separating the authoring editor from a core-only production bundle. Its public source is quiet and its “1.0 around the corner” private-development notice is not a released capability. [Official status and licence split](https://github.com/theatre-js/theatre), [published core manifest](https://unpkg.com/@theatre/core@0.7.2/package.json), [Studio manifest](https://unpkg.com/@theatre/studio@0.7.2/package.json).

Potential seam: authored camera/environment presentation, not `works.js`'s accepted state or object affordance rules. Timeline evaluation, subscriptions and another clock have phone cost; never ship Studio in public play by accident. **Skip now**: simple parameterized eases already meet the mechanisms' need. Revisit only for an explicit authored cinematic workflow, with licence/distribution review and one shared frame driver.

## Adoption safety and a useful next experiment

This research performed a source/licence fit check, not an installed-package vulnerability audit. Before an adoption: pin exact versions, review transitive licences and install hooks, host/cache required fonts, workers, WASM and benchmark data explicitly, and allow no surprise runtime CDN/code fetches. Keep one three instance. Package examples using bundlers, React, classic WebGLRenderer or older three pins are examples, not architecture instructions.

A bounded **CPU BVH aiming trial** is the best next dependency experiment if current `?perf`/Inspector attributes meaningful time to triangle raycasts. Compare the current path with a few selected geometry BVHs, preserving action results, at the same scene/camera on both backends. Record cold-start/build time, memory, aim CPU p50/p95 and delivered-frame p95 on a real phone as well as PC. Acceptance must preserve the 30 fps phone floor on the representative walk and account for startup/memory regressions, not just improve the aiming microbenchmark. Reject it if total cost outweighs steady benefit. Separately, shared frame-budget accounting can be improved without any package trial. Neither recommendation authorizes implementation in this research job.

## Ranked verdict

“Adopt now” means a recommended use of existing facilities/patterns, not a change made by this report. Conditional entries need their named trigger and a measured trial. Order is expected value to this engine, not package popularity.

| Rank | Candidate | Verdict | Why / trigger |
| --- | --- | --- | --- |
| 1 | Shared priority frame budget pattern | **Adopt now** | Coordinate current terrain, building, warming and visible work under one phone budget; no dependency. Fixed stepping waits for a system that needs it. |
| 2 | Native three Inspector + existing timestamp/perf card | **Adopt now** | Already wired; use it to find real costs before selecting packages. |
| 3 | three-mesh-bvh — CPU queries | **Adopt when measured aiming/mesh-query cost warrants it** | Best bounded new-dependency trial; keep filters and semantics, include build/memory cost. |
| 4 | Native RenderPipeline / TSL post nodes | **Adopt when a named visual effect is required** | Correct r186 renderer path; preserve phone direct rendering unless both-backend measurements justify it. |
| 5 | Recast core/generators | **Adopt when irregular/larger routes exceed grid quality or budget** | Spatial navigation for people; not semantic reachability, and optional debug adapter is not presumed node-safe. |
| 6 | Native three Audio / Web Audio | **Adopt when R72 begins** | Existing renderer-independent sound seam; respect the sound-ownership decision and source budget. |
| 7 | Rapier compat | **Adopt when physical motion/platforms/arbitrary collision are required** | Good CPU/WASM tool, unnecessary for today's plan walker; reconcile one truth and bounded stepping. |
| 8 | @pmndrs/scheduler | **Adopt when modules need independent ordered/rate-limited jobs** | Vanilla modern option, but pre-1.0; preserve a single driver and measured budgets. |
| 9 | stats-gl | **Adopt when its texture/TSL profiler UI fills a diagnostic gap** | Compatible path to investigate, but redundant for current cadence/startup/layer accounting. |
| 10 | KTX2Loader + Basis tooling | **Adopt when baked textures arrive and residency/transfer matters** | Both-backend compressed-texture route; no benefit for live procedural textures by itself. |
| 11 | meshoptimizer | **Adopt when imported/baked meshes arrive** | Build-time geometry optimization and optional runtime decode, not a procedural-engine replacement. |
| 12 | glTF Transform | **Adopt when a glTF ingest/bake pipeline exists** | Author-side tooling; do not ship its SDK just to prepare for absent assets. |
| 13 | Howler | **Adopt when R72 needs playback pooling/sprites beyond native audio** | Useful convenience, not dynamic acoustics; browser-global/module packaging choice needed. |
| 14 | Koota | **Adopt when a profiled dense-simulation storage/query bottleneck remains** | Optional derived cache only, never a second world truth; React is not required. |
| 15 | @pmndrs/detect-gpu / old detect-gpu | **Skip now** | Stored GPU classifications are weaker than our live scene/backend measurements. |
| 16 | pmndrs/postprocessing | **Skip with current renderer** | Classic WebGLRenderer composer; accepting r186 as peer does not provide node-renderer support. |
| 17 | troika-three-text | **Skip with current renderer** | Published GLSL/onBeforeCompile path; keep current canvas labels and DOM. |
| 18 | @pmndrs/uikit | **Skip with current renderer** | Vanilla and active, but examined glyph/panel shaders still need a node port. |
| 19 | three-mesh-ui | **Skip** | GLSL ShaderMaterial path and old activity; no current need justifies porting it. |
| 20 | bitECS | **Skip now** | No proven simulation gain to justify state migration plus MPL-2.0 obligations. |
| 21 | Theatre.js | **Skip now** | No authored-timeline requirement; old public release, CommonJS packaging, AGPL Studio distinction. |
| 22 | three-mesh-bvh WebGPU compute helpers | **Skip for fallback-safe aiming** | Genuine new TSL/WGSL support, but unstable and not the CPU/shared-backend use case we need. |
