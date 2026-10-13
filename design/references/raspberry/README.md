# Raspberry: techniques banked (2026-10-12)

**Kabe, 2026-10-12:** "Why is this so beautiful https://raspberry.luruke.com/", then: "Whatever seems elegant and efficient, maybe share deets with photonic".

**My reading:**
- This is a bank of ideas, not a port. The page carries no licence, so we take ideas and write our own code.
- The study is from its shipped bundle (`/assets/index-*.js`, three.js WebGLRenderer, with the shaders' comments kept). I did not watch it run.
- Nothing new goes on the roadmap. Each technique names the item it serves; Photonic gets the skin and hair ones.

**What it is:**
- One raspberry, a few centimetres across, on a black stage, turning slowly.
- A studio rig: key, fill and rim lights sized like softboxes, strip lights, HDRI options. A "reel" mode cuts between camera moves on a beat.
- Four quality presets (Ultra, High, Medium, Mobile), each trading the same few things: pixel ratio, MSAA or FXAA, depth-of-field taps, bloom levels, how many baked transfer textures, the fuzz's density, the model's LOD.

**Why it is beautiful:**
- It draws light going **through** the fruit as well as off it.
- Everything else is held back: the whole budget goes on one small thing against darkness, framed as a photograph.

## The techniques, ranked for us

1. **Light through a thin wet body, worked out along a chord.** Each drupelet is treated as a sphere of juice.
   - Light entering it is dimmed by `exp(-sigma * chord)`, with `sigma` set so that light is a given red after a given depth of flesh (`transColor` after `transDepth` cm).
   - The view ray is refracted (index 1.33, water), so a sac shows what is behind it, darkened.
   - A pale blur sits inside for the seed. Light from the hollow core shines out through the wall, attenuated by how thick it is there.
   - It is a few lines of shader per light, with no extra pass.
   - **For us:** this is Photonic's ears, nostrils and fingers against a window or candle. For holo-emitter it serves lit thin things: R66's linen and candle wax, R67's glass, R70's leaves against the sun. **Adapt:** the absorption law and the "colour after depth" handle are the ideas worth taking. The per-bead geometry is particular to the fruit.
2. **Subsurface light baked ahead into textures.** How light spreads under the skin is precomputed per texel as spherical-harmonic transfer: 9 textures, or 4 on phones, with an analytic fallback that needs none.
   - Values are stored with signed square-root companding (`sign(v)*v*v*scale` to read), so 8 bits hold the range.
   - At runtime it is a dot product of the light against a few texture reads.
   - **For us:** this is the same choice as our fixed shadows and R68's probe grid: pay once at authoring. For a rigid thing (a bust, a loaf, a candle) it is exact. For Photonic's moving people it holds only per body part. **Adapt**, with the 4-texture or analytic tier first on phones.
3. **Hairs as Bézier ribbons never thinner than a pixel.**
   - Each strand is a cubic curve (four control points) drawn as a camera-facing strip.
   - The strip is widened in screen space to at least `minPixels` (about 0.9–1.1 px), so it never shimmers or vanishes. Alpha-to-coverage is used instead of sorting.
   - A strand is lit with a back-light halo and picks up red bounced off the skin beneath, read from the skin's own transfer texture.
   - **For us:** this is Photonic's peach fuzz, stubble, eyebrows, wool and fur trim. For holo-emitter it serves R69's grass tufts and R70's nettles and brambles. **Adopt** the minimum pixel width and alpha-to-coverage outright; they are cheap and they kill shimmer.
4. **A rim from behind makes the silhouette.** Most of the presets put a strong light behind the subject and a weak fill in front. The fuzz's halo is what reads first.
   - **For us:** in a dark house the window, the hearth or the light you carry (R77) set behind a person is what makes them read. This is a lighting habit for scenes, not code. **Adopt** as a rule for title stills and story-staged moments.
5. **Shot as a photograph.**
   - A 20° field of view (a long lens) and shallow depth of field, with bokeh scaled to screen height.
   - Bloom with a threshold, Neutral or ACES tone mapping, a vignette, and film grain (one hash per pixel per frame after sRGB).
   - **For us:**
     - **Adopt** grain and the vignette for the title still and the paintings: almost free.
     - **Adapt** the long lens and depth of field for the title still only. A first-person game wants a wide field of view and everything in focus.
     - **Reject** bloom and depth of field in play: each is a full-screen pass per frame, against our 20 ms phone budget.
6. **Quality as one table of named levers.** Each tier is a short record over the same levers. Switching flips shader `#define`s and recompiles once.
   - **For us:** this matches `design/perf/tiers.md`. **Already ours.**

**Not taken:**
- Per-preset studio rigs: we light by the place's hour and its sources, not by a studio.
- The reel camera.
- MSAA 4x on phones.
