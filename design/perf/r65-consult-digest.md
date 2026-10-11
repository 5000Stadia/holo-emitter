# R65 remainder: facts for the consult (2026-10-11)

## The decision

How to cut the manor page's time to walkable further, in a way that holds for both a first visit (cold) and a returning one (warm), without changing the picture.

## The item and its target

- **R65 (ROADMAP.md, M7):** "The manor loads fast … about 7.5 s to walkable on desktop, 12–15 s on a phone network … Target: half the time, the look unchanged."
- **Held until Kabe's R59 walk-through:** "building the start room first" and "keeping the built house between visits". The walk-through was done on 2026-10-11.

## Measured now (headless Chromium, desktop GPU, the case page)

**Marks since the page started** (lab/manor/index.html, ENG.mark):
- renderer: 0.05 s
- built: 4.7–5.2 s
- textures: +0.1 s
- far-textures: +0.65 s
- tiles: +0.46 s
- first frame / walkable: 7.2–8.0 s (the first frame is 1.3–1.5 s of GPU upload and pipeline compile)

**Of the build** (window.__manor.ms 4.5–4.9 s), a CPU profile at 0.2 ms sampling, inclusive by file:

| File | Time | Note |
|---|---|---|
| src/make/build.js (furniture kinds) | 1.8 s | |
| src/make/place.js (placement) | 1.16 s | |
| lab/painted/procedural.js (walls) | 1.04 s | carveHeight 0.21 s self |
| src/make/coplanar.js | 0.66 s | |
| src/make/sitter.js (suspects' busts painted) | 0.47 s | |
| terrain, terrain-mesh, hillside | 0.9 s | |
| GC | 0.3 s | |

**Other facts:**
- Time not in JavaScript: three.webgpu texture and buffer copies, about 0.45 s.
- Modulepreload hints for all 90 modules: no gain (11.27 s vs 11.32 s on simulated 4G, spread ±0.4 s). The module chain overlaps the start.
- A still of the start view now shows at about 0.15 s and fades at walkable (done today).

## Properties of the build

**Determinism and keys:**
- `build()` (src/make/build.js) is a pure function of kind data, parts, look and an address seed.
- Placement (`placeRoom`, src/make/place.js) is pure per room, given the plan, the room's spec and the sizes of the kinds.
- The plan is sealed into a world document in localStorage, keyed by hashOf(kinds) and hashOf(plan).
- GENERATOR (src/make/index.js) names the generator.
- Determinism spec: the same route gives identical frames.

**What the build returns:**
- buildManor returns geometry merged per material per room (BundleGroup when on WebGPU).
- It also returns gameplay data: things (doors, drawers, takeable objects, case items), blocks, colliders, hearths, flames, lights, windows, rails, the carve solid and the exterior shell.

**Existing caching precedent:**
- Textures are drawn in workers and kept in IndexedDB ("holo-textures") by recipe and the generators' source hash (TEX_VERSION), so a second visit draws none.
- The renderer choice is remembered in localStorage.

## Constraints

- **Hosting:** GitHub Pages: no custom headers, no SharedArrayBuffer.
- **Phones first:** iOS kills tabs short of memory, and IndexedDB quotas differ by browser.
- **The look must not change.** Vertex digests of the four houses (manor, case, banqueting, Alice's hall) are compared before and after every change.
- **No install:** a bundler is Kabe's call.
- **Code first, minimal AI;** no money.

## Prior art

Teleoperator (design/references/teleoperator/loading.md):
- builds in resumable steps to a time budget, about 100 ms slices at load and 2.5–5 ms a frame in play, nearest first;
- has a compact binary container (a JSON header plus typed arrays), gzip, unpacked in a worker;
- stores no build between visits: it rebuilds 26 s every time.
