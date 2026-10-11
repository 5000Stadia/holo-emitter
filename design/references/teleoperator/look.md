# Teleoperator: how it looks good cheaply (study for holo-emitter)

Source: `app.pretty.js` (`L…` = line), the fetched `assets/`, and the screenshots. Ideas only; no code copied (it has no licence).

**Overall cost.** The game is not cheap as a whole. At street level it runs at 28 fps / 48.8 ms (street1) and 40 fps / 31.7 ms (street2), and it downloads about 84 MB (`sky.bin.gz` alone is 10 MB). Most of that frame goes on things we should skip: TAA, SSR, half-res GTAO, clustered lights, PCSS with a near cascade, and volumetric clouds. The wins worth taking are the shader-side tricks below.

**Architecture.** Every material can carry one albedo hook. It returns colour and alpha, and may also set roughness/metal, emission, a normal offset, transmission and AO (L27265–27291, L27717). The renderer's own lighting then shades the result. For us: TSL nodes, one function per look, with uniforms for hour and weather.

## Ranked by visual gain per ms

### 1. Box-filtered procedural patterns
- **What:** Windows, mortar, sash bars, stripes and joints are periodic bands. Each band is integrated exactly over the pixel's footprint (from `fwidth`), so lines thinner than a pixel settle to their average coverage instead of flickering.
  - Fine noise fades to its mean below about 2 px.
  - Per-window random choices (lit, curtains) collapse to their mean when a window is only a few pixels wide, so nothing twinkles far away.
- **Evidence:** `sfB`/`sfR`/`sfPer`/`sfNf`/`sfFoot` (L42698–42716); `sfWin` (L43176–43196); the mean at a distance (L43303–43305).
- **Why cheap:** A few ALU per band. No textures, no mips, and no TAA needed.
- **Fit: adopt (TSL).** Our generated leaded cames, panel mouldings, window bars, brick and flagstones are exactly the audit's aliasing complaints. With MSAA and no TAA, sub-pixel lines have to be right on their own.
- **Serves:** R67, R66, R69.

### 2. A room behind the glass, a recess, and a fake reflection
- **What:**
  - Each glass pixel casts one ray into an imaginary box room (about 4.2 × 3.1 × 4.5 m). Floor, ceiling and walls are seeded by a hash: a picture, a bookcase, a doorway, a sofa, and a lamp pool that dims with depth.
  - First, a parallax step sets the glass 0.16–0.27 m back, so the reveal's head and jamb show in shade.
  - Fresnel blends the sky in, and the room fades out at grazing angles.
  - Canyon windows reflect a hash-generated row of facades by azimuth, not a texture.
  - At night a hashed subset of rooms lights up, at 2700–5000 K.
- **Evidence:** `sfRoomL` (L43427–43497), `sfFrame` (L43413), the blend (L43608–43660), `sfCityRefl` (L43714–43736), night lights (L43311–43334).
- **Why cheap:** One ray-box hit plus hashes per glass pixel. The room's detail drops with the pixel's area.
- **Fit: adapt for R67.** Seed the box from each window's real room (its size, wall colour, candle or fire), not a hash. Lay diamond quarries over it (technique 1) and take the sky from technique 6. That removes the black holes without drawing the interior.

### 3. Baked sky visibility
- **What:** The share of open sky each surface sees, baked offline.
  - Walls store byte samples about every 10 m along each edge, at heights 0, 0.6, 1.5, 3, 5, 8 … 310 m. These are interpolated into each vertex's `uv1.x`.
  - Street ground uses a 2D byte field, looked up by world xz.
  - Ambient light is multiplied by `floor + (1−floor)·vis^contrast`, with the floor at 0.2–0.42 depending on the preset.
  - A multi-bounce AO fit (Jimenez 2016) and specular occlusion are derived from the same term. GTAO only adds contact detail.
- **Evidence:** L27543–27550; decode and vertex write (L34866–35084); the field (L26796–26817); `aoMB` (L27335).
- **Why cheap:** One multiply per pixel. They do pay 10 MB of download for it.
- **Fit: adapt, computed at generation time** (rays per vertex over our merged bundles, so nothing to download). We have no GTAO, so this would be our occlusion: eaves, wall bases, stair wells and courtyard corners dimmed. The floor keeps panelling dim, not black.
- **Serves:** R68 (alongside `light.js`'s probe grid) and R69.

### 4. Soft alpha and LOD fades
- **What:**
  - Leaf, grass and impostor alpha is tested against per-pixel noise that changes every TAA frame, which gives soft edges after TAA.
  - Cards seen edge-on fade out, and leaves within 2.5 m of the camera dissolve.
  - LODs cross-fade by dither at 48–64, 132–162 and 340–420 m.
  - Coverage is boosted down the mip chain so distant cards don't thin out.
- **Evidence:** L76708–76745, `sfLodKeep` (L76815–76823).
- **Why cheap:** Alpha-tested: opaque passes, early-Z, no sorting.
- **Fit: adapt.** Without TAA, dither reads as noise, so use `alphaToCoverage` under our MSAA instead. Keep the edge-on fade, the near dissolve and the mip coverage boost.
- **Serves:** R69.

### 5. Grass clumps near the camera
- **What:** Up to 8000 instances of one clump card from the shrub atlas, on a jittered 1.6 m grid within 46 m.
  - The grid is rebuilt only after the camera moves 10 m.
  - A cover mask and noise choose lawn, clover or wild grass; steep ground gets extra clumps, and roads stay clear.
  - Clumps fade by dither between 28 and 44 m, cast no shadows, receive shadows, and move in the wind.
  - Beyond that range, the ground shader paints dry patches and tufts that blend by height over path edges.
- **Evidence:** L79157–79235; ground (L47700–47760); `assets/shrubs.webp`.
- **Why cheap:** One instanced draw and no shadow pass. The CPU only works after the camera moves 10 m.
- **Fit: adopt.** It answers the audit's "no grass" directly. Add weeds at wall bases and wear along paths, both placed at generation.
- **Serves:** R69.

### 6. A sky painted once in a worker
- **What:** A half-float equirect sky (1024 × 512) painted on the CPU: a gradient with a haze exponent, sun lobes and a disc, twilight, cirrus streaks, and cumulus fBm self-shadowed by a sample offset toward the sun. The GPU then prefilters it into the environment.
- **Evidence:** `assets/web/workers_sky.js`; prefilter (L28274–28300); call (L99348).
- **Why cheap:** It is regenerated only when the hour changes. Per frame it costs a texture lookup.
- **Fit: adopt.** It replaces our flat gradient (audit item 8), and through PMREM it gives the windows their reflection.
- **Serves:** R69, R67.

### 7. Fog with aerial perspective
- **What:** Exp2 fog plus a linear veil. The colour runs warm toward the sun and cool away from it, and the fog thins with height using the closed-form integral along the ray.
- **Evidence:** `fogged` (L26508–26545).
- **Why cheap:** About 20 ALU per pixel, with no pass of its own.
- **Fit: adopt** as a TSL fog node, for the grounds and the London street.
- **Serves:** R69.

### 8. Wind in the vertex stage
- **What:** Three layers:
  - the trunk sways in proportion to height squared, with gusts;
  - a branch layer follows a smooth phase field in model space, in clumps of about 2 m;
  - the leaves flutter.

  All of it comes from position alone, so the depth, shadow and colour passes agree.
- **Evidence:** `sfWind` (L26548–26570).
- **Why cheap:** A few sines per vertex.
- **Fit: adopt** as a TSL `positionNode` for trees, hedges and grass. With our static shadows, a crown's shadow won't sway with it, which is acceptable.
- **Serves:** R69.

### 9. Foliage lighting
- **What:**
  - Double-sided cards keep a bent normal pointing out of the crown and up.
  - Sun passes through the leaves, with a broad rim lobe when the sun is behind.
  - The crown has a sun side and a shade side (×0.66 to ×1.08).
  - Vertex colour carries the crown's AO, which also cuts its sheen.
- **Evidence:** L27485–27487, L27617–27621, L27638, L76736–76745.
- **Why cheap:** ALU only, plus one attribute baked at generation.
- **Fit: adapt** for our trees and hedges.
- **Serves:** R69 ("real canopies").

### 10. Far-tree impostors
- **What:** One 2048 × 1280 atlas (280 KB) holds 11 species in 3 views each (front, side, top).
  - Each tree is drawn as crossed quads, plus a top quad that takes over as the view steepens.
  - Normals are faked as a hemisphere over the quad, so there is no normal atlas.
  - Trees are grouped in 630 m chunks; those inside 325 m are hidden by zeroing their matrices.
- **Evidence:** L76779–76805, L79005–79100, `assets/impostors.*`.
- **Why cheap:** Two or three quads per tree, and one draw per chunk.
- **Fit: adapt** for the estate's woods (audit item 10). The fake normal is the bit to take.

### 11. Time-of-day presets (the LIGHT button)
- **What:** Five fixed presets: Golden hour, Sunny afternoon, Fog, Blue hour and Rain. Each sets the sun, sky colours, fog, exposure, bloom, sky-visibility floor, night fill, and a night factor that drives window light and the colour grade.
- **Evidence:** `Xa` (L98527–98720).
- **Why cheap:** Parameters only. A change repaints the sky and the cached shadow map.
- **Fit: adopt** as "the hour of the case".
- **Serves:** R69.

### 12. Colour grade and bloom with a soft threshold
- **What:** After AA, one grade pass handles saturation and vibrance, contrast with an S-curve, split toning, warmth, a midtone gamma and a film shoulder above 0.8. Bloom picks up only what is brighter than white, using a 13-tap downsample and a tent upsample. Their WGSL copies three's ACES and Neutral exactly, so both of their back ends draw the same pixels.
- **Evidence:** L28381–28470, L28233–28270, L26456–26482.
- **Why cheap:** The grade is a single pass; bloom is a small mip chain.
- **Fit: adapt.** Fold the grade into our output pass. Keep bloom for night candles and fire on desktop only, not on phones.
- **Serves:** R69.

### 13. Facades from generated photos
- **What:** A 5-across photo atlas; a mask (opening; window centre) drives the reveal, the room and streaks under sills (L43561–43665).
- **Fit: reject for the manor** (real geometry); keep the streaks-under-sills idea.

### Skipped: what costs real milliseconds
- **Not for us:** TAA with sharpening, SSR (including the wet-road streaks), GTAO with colour bounce, clustered lights, 16-tap PCSS, glass in the shadow maps, motion and radial blur, lens flare, cloud volumes and the FFT ocean.
- **Also rejected:** their log-encoded HDR light maps that carry sun visibility in alpha (L27566–27572, L31880). (UV unwraps; R68's probe grid covers it).

## Their flaws at street level

1. **Stretched, flat fronts (left of street1 and street2).**
   - **Cause:** One generated photo is fitted to each lot, so its texels stretch with the lot's width and storey height. Stoops, stairs and garages painted into the photo shear flat at street level. Parapets and side walls fall back to flat colour or to a low mip of the wall average (L43617), which gives the bare grey slabs.
   - **For us:** Keep texel density in world metres, as their procedural facades do. Never paint into a texture any relief that will be seen from under 10 m; build it instead.
2. **The see-through red-and-teal smear (right of street2, in front of the glass tower).**
   - **Where it comes from:** Red and green is Chinatown's palette: balconies (L43236–43239), signs and lanterns (L43971–44000).
   - **Likely cause** (inferred from the code, not confirmed in play): dithered coverage that TAA averages into a veil, by design ("the TAA averages a veil", L64655, plus the LOD dither bands). It ghosts when the history moves or is rejected. A camera motion blur that applies only toward the frame's edges (L28381–28395), plus a radial edge blur, then smears it.
   - **For us:** No dither for transparency, since we have no TAA; use alpha-to-coverage. No blurs at the frame's edges.
3. **Frame cost.** Their look rests on a 30–50 ms frame. Copy techniques 1–11, not the passes.
