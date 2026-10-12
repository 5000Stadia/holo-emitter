# R65: where the load stands (2026-10-11, late)

**The mark:** half of about 7.5 s to walkable on desktop (about 3.75 s), with the look unchanged.
**The monitor, for Kabe:** "Nothing waits on others for R65: its open pieces are yours to build … Measure on desktop."

## Now (this desktop, headless Chromium, WebGPU; branch `r65/load`)

| | First visit | Second visit |
|---|---|---|
| The manor, before tonight | 5.9 s | 5.0 s |
| The manor, with the tables | **5.35 s** | **4.7 s** |
| The case, before tonight | 6.1 s | 5.8 s |
| The case, with the tables | **5.7 s** | **5.3 s** |

- These are three alternating pairs each. Runs spread ±0.3 s, with the odd outlier of several seconds on a first visit.
- **Of a second visit's 4.7 s:**
  - building the house, 2.8 s;
  - textures, 0.15 s;
  - far textures, 0.2 s;
  - ground tiles, 0.4 s;
  - the first frame, 1.0–1.4 s, which is compiling the GPU's pipelines.

## What changed

**1. The kinds' sizes and swings are worked out once** (`src/make/keep.js`).
- **Before:** 31 measuring builds and 19 swings at every load, 0.56–0.73 s.
- **Now:** they come from a table:
  - for our places, worked out at authoring (`lab/manor/kept/sizes.json`, 7 KB);
  - for any other place, kept in the browser after its first visit.
- **When the table is used:** only when it was made by this code. Every module the builder imports is followed and hashed at load; these are cache hits, and the page waits 0 ms for them. A stale table costs the old time, never a wrong house.
- **The authoring tool:** `node tools/keep-tables.mjs` writes the tables.
- **The check:** `keep.spec.mjs` fails when a table is stale.

**2. Each room's placement is worked out once,** the same way (`lab/manor/kept/place-<plan>.json`, 78 KB for the manor).
- Placement was cheaper than expected once the measuring builds left it: 0.2–0.4 s.

**What stays the same:**
- The same house in all four places, every attribute, compared against `?keep=0` (measure and place everything).
- Chromium matches to the bit. Firefox's own trigonometry places a few things 4e-15 m differently; the table gives every browser one house.

**3. Grain keyed by address** (gate g3b7af2, point 1) underlies both changes. Skipping a measuring build or a placement would otherwise redraw the grain of every board after it.

## What I measured and didn't build

**The built house kept between visits.**
- The room shells are 4.0 M of the house's 5.2 M vertices, about 177 MB as built (position, normal, uv, colour).
- That is too much for a phone's storage quota and memory. The tables above are the part of "kept" that pays.
- Compressing the vertices would change their values. That falls under "look unchanged", so it's your call.

**The anti-flicker pass at authoring.** Its lifts belong to geometry that is built at every load, so there is nothing to keep without keeping the geometry. Instead the pass itself was made faster with identical output: 410 → 225 ms.

**Bundling the code.**
- Preloading all 90 modules gave no gain on simulated 4G: the module chain loads while the page starts.
- Bundling would need a new tool installed. I haven't added one for a gain I can't show.

**The canvas uploads, a false lead.**
- Each canvas texture upload took 330–510 ms, about 1.9 s in all on a manor load.
- Sending them as pixel data changed nothing: the canvas copy was just the moment the CPU waited for the GPU's queue.

**Compiling the pipelines ahead.**
- Compiling only the start view, in the background, still took 1–3 s and competed with the load.
- It was measured worse before (2026-10-07) when compiling everything.

## What would close the last ~1 s

The rest of the outside reviews' order (consult cbc0003, gate g3b7af2):
- **Point 2:** build rooms in workers, returning plain data. The room shells, 1 s of walls and their merging, would build in parallel.
- **Point 3:** build and draw the start view first, then the rest by what can be seen and reached. The first frame would compile only what the start view shows.

Both set R65's architecture, and both need point 1, which is ready.
