# Prior art: integrating sibling modules into a no-bundler ES-module host

Method note: web searches only. Sources are docs/READMEs. Links marked (unverified) come from my own knowledge and were not fetched. Nothing in the repo was touched.

## 1. Plugin/host architectures with capability injection
- **Bevy plugins.** A plugin is just a function (or a trait with build/ready/finish) taking `&mut App`; it registers its own systems/resources, and groups (`DefaultPlugins`, `MinimalPlugins`) order plugins by the resources they produce/need. https://dev-docs.bevyengine.org/bevy/app/struct.PluginGroupBuilder.html . FITS: `install(host)` function, no trait machinery needed.
- **WASM component model / WIT worlds.** A module declares a *world*: the interfaces it imports (what host must supply) and exports (what it offers); nothing else is reachable. https://component-model.bytecodealliance.org/design/component-model-concepts.html , https://github.com/WebAssembly/component-model/blob/main/design/mvp/WIT.md . FITS as a *discipline*: each module ships a machine-checkable `world` (imports = ctx capabilities such as walk.route, walk.stand, place.roomAt, claims; exports = hooks). Do not adopt the toolchain itself.
- **VS Code extension host.** Manifest-declared contribution points plus lazy activation events; extensions get only the `vscode` API object. https://code.visualstudio.com/api/references/activation-events , https://code.visualstudio.com/api/references/contribution-points (unverified; mirror: https://www.mintlify.com/Microsoft/vscode/api/extension-anatomy). FITS: a static `manifest.json` per module (version, imports needed, exports, activation = "on room entered / on person spawned") lets the host check compatibility and lazy-load without running code.
- **Godot GDExtension.** Engine ships a versioned API description (`extension_api.json`) and a C interface header; extensions load against it, with a `.gdextension` file naming entry points; API is flagged experimental. https://docs.godotengine.org/en/4.4/tutorials/scripting/gdextension/what_is_gdextension.html . FITS: the host publishes a generated, versioned `host-api.json` (ctx shape) that modules develop against.
- **Figma / Obsidian plugins** (unverified, from memory). Figma runs plugin logic in a sandbox with a narrow API object and a separate UI iframe; Obsidian passes one `app` object into `Plugin.onload()`. Same shape as ctx injection; confirms "one object in, nothing global".

## 2. No-bundler composition
- **Import maps + overrides.** `import-map-overrides` (single-spa) stores per-developer overrides in localStorage so one module URL points at localhost while everything else loads from the deployed site. https://www.npmjs.com/package/import-map-overrides , https://single-spa.js.org/docs/devtools . It warns that it is a dev-experience tool, not the page's only import map. FITS strongly: this is exactly "run live inside the host without copying". Caveat: it needs a native import map set before any module loads, and the sibling's dev server must send CORS headers.
- **es-module-shims.** Polyfills/shims import maps, allows dynamic import-map injection and resolve/fetch hooks in shim mode. https://www.npmjs.com/package/es-module-shims . Mostly unnecessary now (native import maps widely shipped); only needed if a map must be changed after load. Reject unless needed.
- **jsDelivr `gh/`.** `cdn.jsdelivr.net/gh/user/repo@<tag|commit|branch>/path` serves a repo at an exact ref with no build. https://www.jsdelivr.com/?docs=gh . FITS for *release* pinning: the import map says `photonic -> .../gh/5000Stadia/photonic@<sha>/src/index.js`. Caveats: branch refs are cached (use full SHA or tag), and it adds a third-party runtime dependency for a static site. GitHub Pages of each sibling repo (own origin, CORS open) is the no-CDN equivalent.

## 3. Repo topology
- **Submodule / subtree / monorepo.** Submodule = pinned pointer to an independent repo (empty until init); subtree = copy merged into history (that is vendoring with an update command); monorepo suits one team with atomic changes. https://slicker.me/git/submodules-vs-subtrees-vs-monorepos.html (secondary). Submodules are fine on GitHub Pages builds, but both lose "live" editing unless the working copy is symlinked.
- **Vendoring critique.** Go's vendor experience: two sources of truth (`modules.txt` vs `go.mod`) and "inconsistent vendoring" errors are the drift mode; the mitigation is a CI check that re-vendors and fails on any diff. https://github.com/golang/go/issues/27227 , https://github.com/golang/go/issues/45612 , https://victoriametrics.com/blog/vendoring-go-mod-vendor/ . Counter-arguments: self-contained, offline, reviewable. If vendoring remains, adopt the CI re-sync check plus a recorded source SHA.
- **npm workspaces**: link siblings in one tree. Only helps if the host has a node install step; the host is plain static files, so it adds nothing over import-map overrides. Reject.

## 4. Contract testing
- **Pact (consumer-driven).** The consumer's tests emit a contract file; the provider replays it. https://docs.pact.io/implementation_guides/javascript/docs/consumer . FITS: the host writes `ctx` fakes + expectations (walk.route returns...), modules replay them in their own CI, and the host replays module exports against its real ctx.
- **WPT / test262.** One shared conformance suite run by every implementation, living in its own repo. https://github.com/web-platform-tests/wpt , https://github.com/tc39/test262 . FITS: a small `holo-conformance` fixture set (spec tables + golden outputs) executed by both sides in plain Node, no browser.

## 5. Shared conventions
- **ROS REP-103/105.** One short document fixes units (SI, radians), handedness, axis meaning (x fwd, y left, z up) and named frames (base_link, odom, map). https://www.ros.org/reps/rep-0103.html , https://www.ros.org/reps/rep-0105.html (unverified for 105; 103/120 confirmed via search). Deviations allowed only if justified and documented. FITS: a one-page `conventions.md` plus tiny frozen `conventions.js` constants (up axis, metres, yaw zero, room-local vs world frame). glTF and OpenUSD do the same through spec-level units/up-axis metadata (unverified).

## 6. Game-middleware boundaries
- **Wwise / Recast-Detour.** Middleware takes allocator/IO hooks from the host, routes all calls through one integration layer (UE's AkAudioDevice), and requires per-thread init/teardown. https://www.audiokinetic.com/en/blog/ak-memory-arenas . Recast/Detour separates build-time navmesh generation, runtime queries and crowd update; a single batched `crowd.update(dt)` per frame, measured about 2 ms for 250 agents in one Babylon forum report (anecdote). I found no official budget/time-slicing contract. FITS: ctx gets `clock`, `budget` (ms per frame, host-decided), and `alloc`-like pooling; module exposes `update(dt, budgetMs)` and one adapter file on the host side owns all calls.

## Ranked: adopt
1. **Import-map dev override** (module served from sibling's own dev server, host reads a `?dev=photonic@http://localhost:PORT` or localStorage key). Zero copies, zero drift live.
2. **Release pinning by tag/SHA via import map** pointing at sibling's Pages or jsDelivr `gh/`. Replaces vendoring; the pin is one line.
3. **Module `world` manifest** (WIT-inspired JSON): imports (ctx capabilities with versions), exports, activation. Host validates at load and fails loud on missing capability.
4. **Shared conformance/contract fixtures** (Pact + WPT style) run in both repos' CI; ctx fakes come from the host's own repo.
5. **conventions.md + frozen constants** (REP-103 style) in a tiny shared repo or file imported by both.
6. **Frame-budget contract**: `update(dt, budgetMs)`, host-owned adapter, single integration layer.
7. If vendoring must remain meanwhile: CI re-sync check (Go lesson) with recorded SHA.

## Reject
- npm workspaces / bundler-based linking (no build step on host).
- es-module-shims (native maps suffice).
- Bevy-style trait/plugin-group framework and full WIT/component-model tooling (disproportionate; take the ideas only).
- Monorepo merge (siblings have separate agents and lines; defeats clean-line goal).
- Git subtree long-term (it is vendoring by another name).
