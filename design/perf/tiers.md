# Phone, desktop and a quality dial (2026-10-12)

**Kabe, 2026-10-12** (on ektogamat/threejs-conference, "the best looking 3js thing out there", which doesn't load on his phone):
> "is there anything in here we should adopt for improving the quality and efficiency of our engine in general and 2 should we have a desktop w/gpu for enhanced mode and a phone mode? And further if we have details like anti aliasing and such would we have options for minor adjustments between higher fps and quality. We dont have to work too hard at this and frankly the constraint of phone first is a huge efficient design constraint. Id at the very least like to document what elements we would bake in if it were desktop to improve performance / polish."

**My reading:**
- A record, not a build.
- Phone first stays the design. A desktop tier only adds on top: the same places, data and look, more polish.
- A small dial lets the player trade frame rate for quality.

**The sources:**
- The conference scene, read in full: [../references/threejs-conference/study.md](../references/threejs-conference/study.md).
- Our read of three's 607 examples: [../references/threejs-examples.md](../references/threejs-examples.md).

## What the conference scene is, and what it teaches

- **What it is:** a rainy night street you walk through. Vanilla three.js 0.185 with WebGPU and TSL, by Anderson Mancini and Sunag, the author of TSL. The code is MIT; its models, textures, audio and video are not.
- **Why it looks so good:**
  - mostly the art: a dense, hand-made night city, with fog where the lighting runs out;
  - then three's own stock effects:
    - bloom on emissive surfaces only;
    - a half-resolution mirror for the wet street;
    - a colour grade with vignette, grain and colour fringing;
    - rain that lands on roofs;
    - half-resolution ambient occlusion (GTAO).
  - There is no secret technique. Everything it does, three r186 ships.
- **Why it fails on a phone:**
  - it draws the city three times a frame (the scene, the mirror, a height map for the rain);
  - five or six full-screen passes;
  - every mesh casts into a 4096² shadow map;
  - about 35 MB to download;
  - rain that needs compute, so nothing on a WebGL2 phone;
  - shader compiles that, by the authors' own comment, freeze Safari.
- **The lesson:** its polish is a stack of screen passes. Our phone-first rule (one pass, everything static drawn once, effects baked at generation) is the opposite, and the right base. The passes are what a desktop adds.

## The tiers: one profile object, chosen per device

- **Today** `src/make/render.js` already sorts devices:
  - **phones:** 1× pixel density, 30 fps, smaller shadow maps, half-density textures, reversed depth, vertex arrays dropped after upload;
  - **desktops:** up to 1.5×, 60 fps;
  - **both:** a resolution controller steps density down when frames run long, and back up after a cooldown.
- **To build** (adopted from the conference scene's `performanceProfile`): make that one explicit profile. A plain object holds every switch and scale, set by the device and then by the dial, read by every system. No system tests "is this a phone" itself.

| Profile entry | Phone | Laptop | Desktop with a GPU |
|---|---|---|---|
| Pixel density cap | 1.0 | 1.5 | 1.5–2.0 |
| Frame target | 30 | 60 | 60 |
| Antialiasing | MSAA 4× (cheap on tiled GPUs) | MSAA 4× | MSAA 4× + supersampling when the view is still |
| Shadows | static maps, PCF, small | static, PCF | static, larger, soft (PCSS filter) |
| Ground cover: grass, plants, clutter (one rank threshold, engine principle 1) | 0.25–0.5 | 0.75 | 1.0 |
| People drawn (the same rank) | ~100 | ~200 | 300+ |
| Real lights near you | ~4 | ~32 | 192 clustered |
| Textures | half density | full | full |
| The post chain | none | none | on (below) |

**Why the rank matters:** a phone's plants, people and clutter are a strict subset of a desktop's. A higher tier adds things where nothing stood; it never moves anything that was there.

## What a desktop would add (the polish)

**Wanted on every device, but too costly on phones:**
1. **Ambient occlusion** (three's `GTAONode`, half resolution): contact darkness in corners, under furniture, along panelling. Phones get occlusion baked into vertex colour at generation, at no cost per frame.
2. **Bloom on what glows** (`BloomNode` on an emissive output, half resolution): candle flames, fires, lit windows at night. Phones get additive halo sprites on those sources.
3. **Soft, contact-hardening shadows** (a PCSS filter through `shadow.filterNode`): window sun and hearth shadows sharp at the foot and soft further off. Phones keep plain PCF.
4. **Mirrors on the wet and the polished:** a half-resolution planar reflection of the nearest wet street or polished floor, redrawn only when the view moves. Phones keep a static box-projected cube per room.
5. **Volumetric light:** shafts through windows and haze round lamps (`VolumeNodeMaterial`, a quarter-resolution march).
6. **Supersampling when still:** once the camera stops, average jittered frames into a clean picture. Moving frames pay nothing, so it suits render-on-change.

**The grade, on every tier:**
- Tint and contrast are baked into the hour's light and fog colours, already one flat set of values (engine principle 5).
- Vignette and grain go on as a CSS overlay at no GPU cost.
- A colour-grade pass, with colour fringing, only in the desktop chain.

**Not adopted on any tier:**
- depth of field, lens flare, SMAA (we have MSAA), a fog pass (ours is in the materials);
- the one-way resolution drop (ours steps both ways);
- Draco (we generate our geometry).

## A quality dial for the player

- **Presets:** Auto, Low, Medium, High. Auto is today's behaviour: device defaults, then the frame-time controller.
- **Advanced:** a few switches, each a profile entry, remembered per device:
  - antialiasing: off, 2× or 4×;
  - resolution scale;
  - shadow softness;
  - ground-cover and crowd density (the one rank threshold);
  - the effects of the desktop chain, each on or off;
  - a frame cap (30 or 60).
- **Where it lives:** a small panel from the menu, a few rows.
- **What it costs us:** little. The profile object is a tidy-up of render.js. Each desktop effect is a node in three's pipeline, built when its item comes:
  - ambient occlusion, bloom and the grade with R69's look;
  - soft shadows and reflections with R68;
  - volumetric light after both.

## What it doesn't change

- Phones stay the design constraint. The places, the case, the people and every check are the same on every tier.
- A desktop adds polish; it never adds a different world.
- What must be the same everywhere stays one pass: the place's geometry, light baked at generation, the hour's look values and the static shadows.

## Code we could borrow (MIT, Mancini and Sunag; credit kept; a safety pass first)

- The mirror camera's oblique clip plane.
- The puddle-ripple TSL.
- The wiring for rain that lands on a height map (we'd build the map once at generation, not every frame).
- Its window raindrops are adapted from rocksdanister/rain, whose licence is unchecked: ideas only until it is.
