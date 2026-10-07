# Render depth per region (Kabe, 2026-10-07; considering, not rules)

## His words

> We may want to create a render depth per region. For example, if theoretically we were to start to render
> fictional city. Yes the starting point is within a building, like our manor, it makes sense to focus the full
> room, blueprint object, and object layout within that building that we started in.
> Locations that that starting position have any line of sight of [are] generated with their simple low poly model,
> for when we step outside and look around.
> Object/areas with a short distance around the starting player, including buildings, get built at their full
> resolution. Any of those locations they can see the location the player is in get built out internally starting
> from the entrances.
> … not hard rules at all in fact, they are haphazardly scoped and stated, but I am considering that as a general
> approach. Also, if you're gonna have an endless horizon and map, kind of concept where I could walk endlessly in the
> world is generated, that should be considered as well.

## My reading: depth by what you can reach and what you can see

| Depth | What is built | When |
|---|---|---|
| **Full, inside** | rooms, their blueprint, every object placed | the building you are in, the room first, then outward through its doorways |
| **Full, outside** | full-resolution exteriors and the ground's things | within a short distance of you |
| **Interior from the entrances** | rooms, inward from each door, in doorway order | a nearby building that can see where you are (you could look in through its door or window) |
| **Shell** | a simple low-poly model: footprint, walls, roofs, its silhouette | anything with a line of sight to you |
| **Exists** | coarse facts only (what stands where, how big, what kind); nothing drawn | everything else, including the endless beyond |

This refines `design/production/plan.md` §5, which already names four levels:
- *exists*: coarse facts;
- *planned*: a blueprint, two rings out, in workers;
- *built*: geometry, for your room and every connected one;
- *committed*: sealed when first seen.

What his version adds:
- **Line of sight decides the shell level.** It is more than distance.
- **Interiors build in doorway order from the entrances.** The manor's `visibleFrom` already does this inside one house, two doorways deep.
- **The starting building comes first.** "Play never waits" starts from where you stand.

## What exists that it builds on

| Piece | Where |
|---|---|
| A shell from any plan, pure data then geometry (4.7 ms) | `src/make/exterior.js` (`shellOf` / `buildShell`); it can be the low-poly model |
| Doorway order inside a house | `manor.visibleFrom` |
| Deterministic world coordinates, so any piece builds alone, in any order | `src/make/noise.js` and `terrain.js` |
| Tiles by distance within a budget each frame | `terrain-mesh.js` and `hillside.js` |
| Textures in workers, cached | `lab/painted/texjobs.js` |
| Sealing a place's inputs when first seen | the world document |
| Holodeck grid while a part is missing | play never waits |

## What it needs

- **A per-place depth scheduler.** Each frame, or each few metres walked, every place within range gets a target depth. Line of sight is cheap arithmetic against the height function and the shells' boxes, never a raycast against the picture. Upgrades are built in workers within a budget, nearest and most visible first. Downgrades unload, and the document keeps any state that changed.
- **Interiors built in doorway order**, from an entrance inward. A room is built before you can see into it.
- **Fewer distinct materials.** Today the first frame spends about 3 s compiling pipelines, and every new building would pay that again.

## The endless world

- **Coordinates.** The world document keeps true world coordinates (tile index plus local position). Only the drawing frame moves with you (a floating origin), so detail holds anywhere.
- **What stands where is decided lazily, for any spot, from a seed.**
  - At the coarsest scale this is a generated region field: what kind of land, how settled, what period and look.
  - Under it come places and their plans, then rooms and kinds.
  - Each level is a pure function of position and seed, so nothing needs a map authored ahead. The Middle-earth study's "one weight field every consumer reads" is the coarse level, generated rather than drawn.
- **The document stays sparse.** It keeps only the places seen and what changed in them.
- **Memory has a ceiling.** What falls behind beyond the shell range is let go.
- **The horizon.** Haze and the far shells give it a horizon; past that there are only facts, and the holodeck grid where a fact has no form yet.

## A proof inside the isolated demo (proposed)

1. **The manor built interior-first from where you start.** Your room and its doorway neighbours are full. The rest of the house is only its shell until you walk toward it, then it fills in doorway order.
2. **A few neighbouring buildings on the hillside**, for example a farmstead, a church and cottages.
   - Shells where the forecourt can see them.
   - Full exteriors as you near them.
   - Interiors from their doors when they can see you.
3. **Timed:**
   - first frame;
   - the worst frame at each upgrade;
   - seconds of holodeck grid.
