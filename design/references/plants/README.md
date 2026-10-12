# Plants where they grow: the design for R70 (2026-10-12)

**Kabe, 2026-10-12:** "We need random outdoor areas to have appropriate natural distributions of bushes, flowers, etc in addition to the grass"

**My reading:**
- Wild and half-wild growth by habitat, in every outdoor place: bushes, scrub, flowers, verge plants, wall plants, damp-ground plants.
- Designed gardens (knot, kitchen, orchard planting) are a planting of their own, for later.
- A bush is something you walk round; a flower is something you walk through.
- The plants show the case's date: Michaelmas, late September.
- **The sources:**
  - [prior-art.md](prior-art.md): how games, papers and open tools spread plants naturally and draw them on a phone;
  - [flora-1660.md](flora-1660.md): what grew where around a 1660 Midlands limestone manor, with 40 plants as data.

## What natural looks like here (from flora-1660.md)

- **Most of a grazed 1660 hillside is short turf:**
  - rosettes (daisy, plantain, dandelion, cowslip leaves) and white clover;
  - thyme and rock-rose mats on the thin limestone;
  - a few thistles and some ragwort where it is over-grazed.
- **The colour gathers at edges:**
  - in the metre or so at the foot of hedges and walls;
  - along field headlands and fenced closes;
  - on wall tops: stonecrop, thyme, harebell;
  - in damp furrows and hollows: meadowsweet, cuckooflower, rush.
- **Bushes stand in hedge lines, corners and scrub patches:** hawthorn, blackthorn, bramble, dog rose, elder, with gorse and bracken only on acid ground. A single bush in open pasture is rare, an old hawthorn.
- **Where people go:** trodden ground carries plantain, knotgrass, docks and nettles, at gateways, along trackways, round middens and by the house. Elder grows by houses and middens.
- **At Michaelmas:**
  - In flower: harebell, knapweed, thistle, bird's-foot trefoil, red campion, herb Robert, ivy.
  - In fruit: haws, sloes, hips, blackberries, elderberries, the red berries of lords-and-ladies.
  - Seed heads elsewhere. The hay was cut in July, so meadows are aftermath, not flowers.
- **What would look wrong:**
  - plants not yet here in 1660: rhododendron, buddleia, Himalayan balsam, Japanese knotweed, giant hogweed, Oxford ragwort;
  - rosebay willowherb as a mass plant;
  - garden plants that hadn't escaped yet;
  - cornflowers and corncockle outside a crop;
  - a sown rye-grass ley.

## The design (extends the grass design, `../grassworks/README.md`)

**1. One ground map, more layers** (engine principle 3).
- The generator already draws the ground map at 0.25 m for grass: density, kind, height, wear.
- It gains habitat layers at 1 m, worked out once when the place is made, on the CPU:

| Layer | Worked out from |
|---|---|
| Light | Shade cast by trees, hedges, walls and the house |
| Wetness | Slope, hollows, furrows, springs |
| Soil | Limestone or an acid patch |
| Fertility | Nearness to gates, middens, the house and paths |
| Trampling | Paths, gateways, the yard |
| Grazing | Each field's use (fields.js) |
| Distance to the nearest edge | Hedge, wall, tree |

- Grass, plants, footstep sounds and people's paths all read this one map.

**2. A plant list as data, per region and era.**
- Each plant states:
  - its preferred range on each layer;
  - how well it takes grazing and trampling;
  - how much it hugs edges;
  - its habitats;
  - how it grows: singles, clumps, drifts, mats, runners, thickets or hedge lines;
  - its clump size and height;
  - its flowering and fruiting months and colours;
  - whether it blocks, slows or lets you through.
- **Suitability** is the product of how well each layer fits the plant's range, worked out at generation, never per frame.
- **The 1660 Midlands list** is the 40 rows in flora-1660.md §5, with values from the Ellenberg indicators (CC-BY, Tichý et al. 2023).
- **Another setting** is another list, not new code.

**3. Placed by rank, as the grass is** (engine principles 1 and 2).
- Fixed blue-noise points, each with a rank hashed from its position. A plant grows where its rank falls under suitability × clump × tier.
- **Species that share ground take separate bands of the rank** (Horizon Zero Dawn's layered dithering), so two never stand in one place, with nothing read back.
- **Clumps and drifts come from the address:**
  - hashed parent points on a lattice give a smooth clump field, which multiplies the density, so the same gate grows the same nettle patch every time;
  - drifts stretch along walls, hedges and contours;
  - runners (bramble, ivy, nettle) spread as short random walks from their parents.
- **Layers from the top down:** trees (already placed by hillside.js) shade the bushes; bushes shade the low plants; the low plants take ground from the grass.

**4. Season.**
- Flowers and fruit show on a bell curve over each plant's months.
- Today that is the case's date. When the conditions contract (gate g67623c) gives a date, the plants follow it.

**5. Drawing, on a phone** (prior-art.md §C; our grass measurements).
- **Flowers ride the grass draw:** opaque heads on a hashed share of the taller blades. Beyond about 12 m they become speckles painted by the ground shader. Alpha-tested cards cost as much as blades on a phone, so they aren't used.
- **Bushes:** a model near you, then a camera-facing impostor, all in one draw, as hillside.js does for trees; then a tint in the ground far off.
- **Low clumps:** instanced cards near you only.
- **One wind function** shared with grass and trees.

**6. Walking and checks** (standing approval: cheap coherence checks).
- Bushes and thickets go into the claim grid when tiles are built, so you and people walk round them.
- Checks:
  - nothing grows inside a footprint, a path's hard surface or a wall;
  - no blocking bush seals a gateway;
  - nothing from after the era appears.

**7. Budget to verify.** About 2.5 ms of a phone's 33 ms frame for grass and plants together, an estimate from prior-art.md. It is measured at walking height when R69 and R70 are built.

## What we borrow and from where
- **Ideas only:**
  - Horizon Zero Dawn (placement by rank, layered dithering);
  - Lane & Prusinkiewicz 2002 (shade tolerance; clusters around parents);
  - EcoBrush and Kapp et al. (suitability from a few terrain factors; canopy-first layering);
  - Unreal's species fields (spread, shade radius) as the shape of our plant data.
- **Data:** Tichý et al. 2023's indicator values (CC-BY 4.0, credited); Culpeper 1653 for 17th-century places and times.
- **Code:** none yet. `agargaro/octahedral-impostor` (MIT) is a candidate for far bushes if it runs on WebGPU/TSL, after a safety pass.
