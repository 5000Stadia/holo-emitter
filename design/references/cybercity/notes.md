# cybercity ("NEON KAIDO"), studied 2026-10-13

**Kabe, 2026-10-13:** "This looks real nice: https://github.com/xikhar/cybercity. Anything we can use/monopolize on?"

**What it is:** a rainy, neon, Tokyo-style open city.
- It has one commit ("Generated with Devin", 2026-10-13).
- It runs on three 0.186.1 with the WebGPURenderer and TSL, the same three.js as ours, plus Rapier and Vite.
- It weighs about 262 MB, nearly all of it uncompressed PNG atlases and GLB crowd figures.
- It has no phone support (no touch input), and its WebGL2 fallback only logs a warning.

**Licence:** GitHub detects none, there is no LICENSE file, and package.json says "ISC" beside `"private": true` (npm's default). The assets have no stated source. **We take ideas only, and no code or assets.** Read-only study by a helper through `gh api`; nothing was run. Safety: no install scripts, no network calls beyond its own textures, no obfuscation.

## Worth banking (ideas; ours to write)

1. **Flicker shared by the shader and the light it casts:** a deterministic hash of time and seed in TSL (`flickerNode`), with a JavaScript twin (`flickerJS`), so a sign's glow and its pooled light flicker together. Its kinds are steady, stutter, broken segment, chase and breathe. *For us:* our pooled candle and hearth lights already flicker in JavaScript, and their flames in the shader, but independently. A shared hash would make them one.
2. **Interior mapping for lit windows from outside:** each window cell fakes a room (back wall, curtains, a hash per cell) from one atlas, with a far blend so it doesn't alias. *For us:* R67's windows draw the real room within 14 m (10 on a phone). Beyond that, a faked room behind the glass would carry the house from the forecourt. Its cost is per fragment, so gate it by distance.
3. **A procedural environment bake (PMREM):** a dark dome, a ring of coloured emissive boxes and horizon silhouettes, rendered once. Every PBR surface gets coloured ambient and specular light for one bake. *For us:* a cheap stand-in for, or seed of, R68's probe grid (light that bounces).
4. **A wet-surface layer:** porous surfaces darken, roughness drops, puddles come from noise on up-facing faces, ripples from four layers of rings, and walls get streaks. *For us:* rain and wet flagstones in the forecourt at night. Without its SSR it is phone-safe if we use two ripple layers.
5. **One material for every sign, its mode chosen per vertex:** custom attributes pick neon, light box, LED or poster, all in one draw call, and a tube mask lets one segment fail. *For us:* a model for merging many small emissive things by attribute (a street of shop signs, R39's town).
6. **The grade:** AgX blended with a hue-preserving AgX so saturated lights keep their colour, then an S-curve and split toning, in one pass. *For us:* lamplight that stays warm instead of washing to yellow-white.
7. **The light pool's facing bias:** a light behind the camera ranks at 0.35. Ours ranks by what a light gives and whether it is in frame, which already covers most of this.

## Not for us

- **The post chain:** SSR, TRAA, wide-blur scatter, anamorphic bloom and its G-buffer (about 8 passes) kill a phone.
- **Clustered lighting:** it suits hundreds of lights, and we hold 3 pooled lights on a phone.
- **Compute rain** (about 327k drops), the 250 MB of uncompressed PNG atlases and the 7.5 MB crowd GLBs.
- **Its quality presets:** "low" changes almost nothing.
