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

## The Inspector and the smaller-vertex trial (2026-10-12; the monitor: "measure only, nothing merged; bring matched stills and timings")

**The Inspector:**
- It comes with three itself (`three/addons/inspector/Inspector.js`); no package needed.
- `?inspector` attaches it, with no errors. `?backendlog` times every call into the renderer's backend, as its Timeline wraps them, but with durations.

**What it showed about the first frame,** the 1.5–1.6 s from "ready" to the first frame (a second visit):

| Where the main thread goes | Time |
|---|---|
| Our ground and hillside tiles, filled before the first frame (a 500 ms budget, though the start view is indoors) | 0.59 s |
| three building shader code in JavaScript (its node builder, for the 51 programs) | 0.41 s |
| Other three work (bindings, attribute and texture uploads; all backend calls together about 0.25 s) | 0.33 s |
| Other code of ours | 0.22 s |
| Waiting on the GPU | 0.035 s |

- **So it is not the GPU compiling.** I said so before; that was wrong. The GPU's own pipeline creation is 4 ms on the main thread.
- **The cheapest next lever:** a smaller tile budget before the first frame when you start indoors. The outside is seen only through windows, and the tiles fill in during the next frames anyway.

**The smaller-vertex trial** (`?vfmt=small`, room shells: 4.0 M of 5.2 M vertices). Normals become 8-bit signed (4 B, not 12). Colours become half floats (8 B, not 12), since tones run past 1 and 8-bit would clip them.

**The look:** within run-to-run noise in six rooms.

| Room | Mean | Max (of 255) | Pixels over 8 |
|---|---|---|---|
| Great hall | 0.05 | 4 | 0% |
| Great parlour | 0.22 | 4 | 0% |
| Great stair | 0.01 | 2 | 0% |
| Long gallery | 0.02 | 6 | 0% |
| Study | 0.01 | 1 | 0% |
| Kitchen | 1.17 | 17 | 0.06% |

- The kitchen's own run-to-run control is 0.69 mean, max 10: its fire flickers.
- Stills, today left and small right: `design/perf/vfmt/today-vs-small.jpg`.

**Size:** vertex data uploaded 181 → 148 MB (−18%).

**Time** (three alternating pairs, second visits):
- build 2.68 → 2.79 s, from the conversion;
- walkable 4.70 → 4.92 s.

**On the way:** three's own `Float16BufferAttribute` came out as a `Uint32Array` of half floats after a later copy in the build and was read wrongly, and everything turned magenta. The browser's own `Float16Array` works. Phones without it (Safari before 18.2) would keep float colours.

**Verdict:**
- Not a load-time gain on desktop: less upload doesn't shorten a load that hardly waits on the GPU.
- What it buys is 33 MB less GPU memory. That's worth measuring on a phone, where memory, not upload, is the limit.
- Welding each quad's corners (indexing) would cost several times this conversion at load, so on desktop it would lose more. Not tried.

## Indoor starts: fewer ground tiles before the first frame (2026-10-12; the monitor: "check the first second through windows for visible pop-in and include those stills")

**What changed:**
- Started indoors, the outside's tiles get 120 ms before the first frame, not 500. The nearest are built first, and those are what the windows show.
- Then a catch-up budget runs every frame until all the tiles are built: 12 ms on desktop, 6 on a phone.
- Then the usual 4 ms (2 on a phone).
- A start outdoors keeps 500 ms. `?tilefirst=` and `?tilecatch=` override, and a mark `tiles-all` says when they're all done.

**Through the windows** (`design/perf/tiles/window-first-seconds.jpg`):
- Two views, one out of a north window and one out of a south window of the great hall.
- Each moment (the first frame, +0.25, 0.5, 1, 2 s) is compared with the settled picture at +4 s. Old budget in the first and third rows, new in the second and fourth.

| | At the first frame | Afterwards |
|---|---|---|
| New budget | mean difference 0.37 (north) and 0.18 (south), 0.04–0.14% of pixels off by over 16 | ≤ 0.21 |
| Old budget | 0.07–0.08 | up to 0.42 at +0.25 s |

- That is no visible pop-in. Every tile was built within 0.4 s of walkable.

**Time:** not measured cleanly yet. Another project held the machine at load average 52, and runs went from 4.5 s to 82 s. The change caps 0.5 s of tile work before the first frame at 0.12 s, where the profile measured 0.59 s. The timing is to be redone when the machine is quiet.

**The smaller vertices** are parked, off by default (`?vfmt=small` only), as a phone-memory option for when there are phone numbers.

## Shader building, looked into (2026-10-12)

- **What the start view compiles:** 20 vertex and 21 fragment programs, all genuinely different. None differs from another only by a constant.
- **Materials against programs:** the start view has 59 material objects, and the node builder ran 61 times for those 41 programs. 26 of the materials are unnamed `MeshBasicNodeMaterial`s, likely one per window's leaded glass.
- **The possible saving:** sharing one glass material, with the window's texture chosen per object, would save about 20 node builds, roughly 0.1 s.
- **Not built:** it is small, and it needs a per-object texture switch. Noted for when the glass is next touched.

## The start view first, landed (2026-10-12)

- **Returning visit:** walkable 4.5 → 2.7 s. The build before the first frame went from 2.7 to 1.0 s: 10 of 34 rooms from the great hall, the rest after.
- **The same house:** identical in all four places. The first frame matches (mean 0.08 of 255).
- **The one long frame left:** the study, 0.6 s, built while the view is still. Building rooms in workers (point 2) removes it.

## Next lead: a first visit waits on the floor texture (measured 2026-10-12)

**On a first visit** (no texture cache):
- the house is built at 1.25-1.35 s, but the kit's textures settle only at 4.1-4.3 s, and the page waits for them (`K.ready`);
- the last job is the 2880² floor, in four bands.

**The workers' timeline:**

| Worker | What it did |
|---|---|
| 1, 3, 4 | Drew the plaster, stone, brick and flags from 0.56 s. Their floor bands started at 1.35-1.38 s, after 0.79-0.81 s spent getting the oak field. The two oak textures then showed 1.5-1.6 s of oak time of their own. |
| 2 | Started its first job, floor rows 0-720, only at 3.18 s (asked at 0.55 s), and finished at 3.94 s. |

**The suspect:** how the shared oak field is handed between workers (texjobs.js `oakKeeper`, texworker.js `oakFor`). Worker 2 waits about 2.6 s, longer than the field takes to draw, and the field may be drawn more than once.

**The bound:** with the field drawn once and handed on, the floor's four bands would finish about 0.8 s after it, around 2.2-2.5 s. That would bring a first visit's textures under the build.
