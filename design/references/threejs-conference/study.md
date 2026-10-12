# ektogamat/threejs-conference (a.k.a. "Threejs-Punk"), read against holo-emitter

Source: GitHub README, package.json, tree with byte sizes, and these files read in full: bootstrap/createRenderer, post/postprocessing, post/look/cyberpunkLook, platform/*, world/{features,scene,envMap,createWorld,city/loadCity,ground/createGround,weather/*}, loaders, runtime/{createRenderLoop,warmup}, vite.config, AGENTS.md, LICENSE. Not read: the GLB contents (triangle counts unknown), car/droplet shaders, audio. Nothing was run.

## 1. What it is and how it is built
- A rainy cyberpunk alley you walk through (first person, BVH collision, mobile joystick). Authors Anderson Mancini and Sunag (the TSL author); made for the TSL Workshop 2026. 142 stars. Live demo threejspunk.vercel.app.
- Vanilla JS, Vite 6, no R3F. three ^0.185 (we are on r186), three-mesh-bvh, gsap. All shaders are TSL; no GLSL. Needs WebGPU per the README. The code uses `WebGPURenderer`, which can fall back to WebGL2, but nothing in the repo claims or tests that, and the rain uses compute.
- Renderer: `antialias:false`, PCFSoft shadows, ACES, DPR capped at 1.5 (1.25 on Apple). One 4096² directional sun shadow map, `autoUpdate=false` (static, updated on request). Everything `castShadow` and `receiveShadow`. Matrices frozen on static models.
- Post: three's own `RenderPipeline` with the stock addons nodes: GTAO (half-res, 6 samples, own normal pre-pass), scene pass with MRT (colour plus emissive) feeding half-res `bloom`, `lensflare` plus `gaussianBlur`, optional DOF (hand-written box blur, off by default), `smaa`, `film` grain, plus a custom grade (tint, offset, contrast, saturation, green suppress), edge chromatic aberration, vignette, and depth-based fog applied in post. Six "look" presets are only uniform sets. No LUT, no pmndrs, no N8AO, no SSR (removed, commit ea84fd7).
- Lighting: one sun, one fill (no shadow), a 1k HDRI through PMREM as `scene.environment`. No baked lightmaps and no probes visible in the code (the GLB's own baking is unknown). The sky is an inward-facing noise sphere.
- Materials: `MeshStandardNodeMaterial` with node overrides. Wet ground is tiled albedo/normal/roughness (three ~1 MB JPEGs) plus procedural ripples plus a half-res planar reflection fed into `emissiveNode` as reflection x (1-roughness). Car droplets are a procedural TSL graph.
- Assets (sizes from the tree): city GLB 4.7 MB (Draco), plane 2.5, car 2.7, collider 2.7 KB; 6 mp4 billboards ~3.8 MB; a 1.5 MB .hdr; audio ~15 MB (night-ambience 7.4 MB); three 1 MB puddle JPEGs; Draco and Basis transcoders ~1.3 MB (the loader fetches the Basis one; the 950 KB draco_encoder.js is shipped but not used). Roughly 35 MB in `public/`. KTX2Loader is wired with `detectSupport`, but the textures I could see are JPEG; whether the GLB textures are KTX2 is unknown.
- Performance devices: a single mutable `performanceProfile` object plus `applyDevicePerformanceDefaults()` (device gates) plus an inspector to A/B flags live; one-way adaptive DPR (drops to 0.85 once after two slow windows, never recovers); half-res passes; distance fade on car droplets; frame-skip knobs; video play/pause by distance; split shader compile (critical first, rain/smoke/planes after the loop starts). No instancing beyond particles, no LOD, no PerformanceMonitor.

## 2. Why it looks good (what carries it)
1. Art and scene: a dense, authored night city model. Night plus fog hides what lighting lacks. Most of the look is the asset.
2. Emissive-driven bloom: neon is written to a separate emissive MRT, bloomed at half res, so only the lights glow.
3. Wet-ground reflection: a mirrored second render at half res, roughness-masked, warped by the normal map and ripples, added as emissive. It gives the neon-on-asphalt look cheaply (no SSR).
4. The grade: tint, offset, contrast, desaturated greens, vignette, edge chromatic aberration and grain, as cheap uniforms in one final shader.
5. GPU rain that lands on roofs: a top-down position render target, compute particles that respawn at the sampled height, animated splashes.
6. Cost control: half-res everything, static shadows, frozen matrices.

## 3. Why it fails on a phone (evidence)
- Per frame the scene is drawn several times: scene pass (MRT), a planar-reflection render of the whole city (every frame, `groundReflectionFrameSkip:1`), and an ortho "collision height" render of the whole scene with an override material (every frame). On phones GTAO is off, but these remain. Then bloom, lens flare, SMAA, grade: five or six full-screen passes at up to 1.25-1.5 DPR.
- MRT at 8 bits plus a 64-byte colour-attachment limit request (falls back if unsupported); phones' tilers pay for every extra target and every post pass (bandwidth).
- Everything casts and receives shadow, with a 4096² map (64 MB at 32 bits) and PCFSoft.
- Memory: Draco expands to full vertex buffers; three 1 MB JPEGs decode to uncompressed RGBA with mips; two HDR/PMREM; six H.264 videos (billboards are disabled on phones). ~35 MB download before the first frame, plus seconds of shader compile ("can take seconds").
- Authors' own comments: Safari WebGPU "freezes" on resize plus concurrent compile plus extra passes; "RGBA32 was the walk-mode FPS collapse from texture bandwidth". Phones get lens flare, billboards and AO off, and still do not load for Kabe. I did not find a context-loss handler.
- Rain compute (storage buffers) is WebGPU-only in practice; a WebGL2 phone has no rain path.

## 4. Techniques, judged for us
| Technique | Verdict | r186 equivalent / note |
|---|---|---|
| Single `performanceProfile` object, device defaults function, live A/B in an inspector, settings panel | ADOPT (everyone) | Answers Kabe's third question: see below. We have the pieces in render.js; add an explicit tier object and a Settings panel |
| Half-res, frame-skip, distance fade for any added effect | ADOPT principle | Matches our rules already |
| Vignette and grain | ADOPT, free: a CSS radial-gradient/tiled-noise overlay on the canvas (compositor, no GPU pass), or fold into the final material | `FilmNode` only on the desktop chain |
| Colour grade (tint/offset/contrast) | ADOPT at generation: bake into the hour's light/fog colours; DESKTOP-ONLY as a pass | custom `Fn` as theirs; no LUT node needed |
| Bloom on emissive MRT | DESKTOP-ONLY | `BloomNode` + `mrt({output, emissive})`. Phones: additive halo sprites on flames/lamps from our instanced sprites |
| GTAO | DESKTOP-ONLY (already our verdict) | `GTAONode`. Phones: AO baked into vertices at generation |
| SMAA | REJECT | we run MSAA 4x. `SMAANode` only if a desktop post chain forces MSAA off |
| Lens flare, DOF, chromatic aberration | REJECT (DOF off even for them) / CA desktop-only | `LensflareNode`, box blur |
| Post-pass depth fog | REJECT | ours is a material-level fog (height fog item) |
| Planar reflection for wet floors | DESKTOP-ONLY; and re-rendered only when the view moves (render-on-change) | `reflector()` or manual mirror camera (they avoid it inside PassNode; we have no PassNode). Phones keep the static box-projected cube already in the table. The "reflection x (1-roughness) into emissive" mix is a good trick |
| Top-down height map for rain | ADOPT the pattern when weather opens; bake once at generation, not every frame | their per-frame whole-scene render is the wrong part for a static world |
| GPU compute rain, splash atlas | pattern ADOPT, compute REJECT | our stateless instanced sprites (list item 5) work on WebGL2 |
| Procedural droplets on glass / car (material-level, distance-faded) | ADOPT for windows near the camera | adapted from rocksdanister/rain: licence unchecked, verify before porting |
| Procedural cloud dome (noise sphere following the camera) | ADOPT-ish, low cost | alternative to `SkyMesh`; trivial |
| One-way adaptive DPR | REJECT | ours steps both ways with cooldown |
| Draco / KTX2 / Basis | REJECT Draco (we generate geometry); KTX2 stays "measure first" | their lesson: never fall back to RGBA32 |
| BVH collision, video billboards, inspector | REJECT / REJECT / try (already queued) | we have the claim grid |
| `requiredLimits` MRT trick | REJECT | we have no MRT |

Kabe's question 2 and 3: yes to tiers, and they are cheap if built as above: one codebase, one `performanceProfile`, three tiers (phone, laptop, desktop GPU) picked by `PHONE` plus a measured frame time, same places and same data. The phone tier is what we have. The enhanced tier adds a post chain (bloom, GTAO, grade, soft shadows, planar reflection, still-view supersampling). Each effect is a boolean or scale in the profile. User-facing options: Auto / Low / Medium / High, with a few advanced toggles (anti-aliasing off/2x/4x, resolution scale, shadow softness, effects), remembered per device, with Auto driven by the frame-time controller we already have. Their settings panel only exposes look presets and a dev toggle, so it is a pattern to copy, not a feature to copy.

## 5. Licence
- Code: MIT, copyright 2026 Anderson Mancini and Sunag. Borrowable with the notice kept.
- Assets under `public/` (models, textures, audio, video, HDRIs) are explicitly NOT covered by the MIT licence; check each before use. We borrow none.
- `src/tsl/surfaceRain.js` is adapted from rocksdanister/rain; the README asks to keep the credit; the upstream licence is unchecked.
- Bottom line: borrow ideas freely; borrowable code is small (mirror-camera oblique clip, ripple TSL, height-map rain wiring). Most of the value is the pattern, not the code. The look is the art asset, which we cannot take.
