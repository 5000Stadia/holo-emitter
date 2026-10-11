# Engine principles (2026-10-11)

**Kabe, 2026-10-11**, asked whether any of Grassworks' architectural strengths should be abstracted into other structural design elements: "Nice is any of the architecture strengths something to consider and abstract into other structural design elements". Then, on the five below: "Full agree with your recommendations here".

**My reading:** these are rules for the whole engine, not just grass. Each item that builds a system picks up the rules that govern it when it starts, and says in its done note how it kept them.

**Sources:**
- the colony's Grassworks report, §6 (U1–U14): `/home/k/Projects/colony/projects/Grassworks report/reports/grassworks-quality-performance-report.md`;
- the Teleoperator bank, `design/references/teleoperator/`;
- the R65 consult, `design/perf/r65-consult-digest.md`.

## 1. Rank once, threshold everywhere

- **The rule:** every generated population gives each member one fixed rank (a hash of its address) when it is made. Every "how much to show" decision is then one comparison against that rank:
  - detail by distance;
  - phone versus desktop;
  - crowd size;
  - fading in or out;
  - the holodeck grid giving way to established ground.
- **What it gives:** a phone's set is a strict subset of a desktop's, a change of setting reshuffles nothing, and the reveal from the grid needs no mechanism of its own.
- **Governs:**
  - grass, weeds and debris (R69);
  - clutter on shelves and tables, and books;
  - background people (M8: R60, R61, a per-person rank apart from social rank).

## 2. Derive from the address, don't store, and never draw from build order

- **The rule:** a thing's look comes from what it is and where it is: a hash of its address, never a shared random stream advanced in build order. Store only what can't be computed.
- **What it gives:** rooms can be built in any order, in workers, room by room, or from a cache, and come out the same. That is what live generation from descriptions needs.
- **Governs:** every builder.
  - The one known break is the timber boards' shared `rng(1660)` stream (`lab/painted/procedural.js`). Fixing it is gate g3b7af2, point 1, and the rest of R65 depends on it.
  - A test, once that lands: build the rooms in shuffled order and check the vertex digests still match.

## 3. One field, many readers

- **The rule:** turn irregular facts into one regular field once, at generation, on the CPU. Every system then reads that same field, so no two can disagree, and nothing is read back from the GPU.
- **Governs:**
  - **the ground map (R69):** grass placement and height, worn paths (lasting wear lives in the world document), footstep sounds, and where people prefer to walk;
  - **placement's floor grid (`src/make/place.js`):** later, rug wear and creaking boards.

## 4. Per-frame work only for what is seen

- **The rule:** each frame's CPU work grows with what is drawn or near, at a rate that falls with distance, never with what exists.
  - Things that never move are made once, outside automatic matrix updates.
  - The light pool (`src/make/lightpool.js`) already works this way.
- **Governs:** people (M8: gait, matrices, foot contacts), working mechanisms, flickering lights, grass chunks (R69), and anything animated.

## 5. Time in seconds; a look as one flat set of values

- **Time:**
  - Every decay, recovery and animation runs on elapsed seconds, never on frames.
  - A changing speed advances a phase (`phase += rate·dt`), so motion never jumps when its speed changes.
  - **Governs:** fire, candles, clocks, wind, gaits and the trail map.
- **Look:**
  - The hour of the case, weather, fog, exposure and grade are one typed list of values, so any change of mood is one smooth, interruptible blend.
  - **Governs:** the lighting presets (R68, R69), and the sky and fog (R69).

## A check that comes with them (standing approval: cheap coherence checks)

When anything is read back from the GPU, it is compared on both renderers (WebGPU and WebGL2), since we choose the renderer per device. Grassworks' WebGL2 fallback reads its height map back mirrored. This joins the check list when the first readback is built; there is none yet.

## Not abstracted

Grassworks' quality tiers and its tile ring are sound, but they belong to grass alone.
