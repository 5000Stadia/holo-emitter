# The production system: inputs so far (2026-10-05)

These are the working notes behind the design write-up for the kind catalogue and pipeline (R48 and R47). They record what Kabe asked for, in his words, and my reading of each point.

## The goal

"Describe a world, live render the world."

The far test is now in the Vision: "throw the Alice in Wonderland story at pattern buffer and have holo emitter ingest it in such a way, that I can play a 3-D interactive world based on the book."

The approach he wants is "a rigorous rule set and separation of object types, and behaviors". Non-deterministic intelligence should be piped in only where it's needed, "so we don't have to dwell too much in the nondeterministic intelligence".

## His inputs

1. **Map the process step by step, and make every step hyper-efficient.** He also asked whether work can move upstream, into pattern-buffer's descriptions.
2. **Ambient animation.** Some objects animate according to their state: a fireplace with a live fire against a cold one; a street sign against a stoplight. My reading: animation is part of what a kind declares it can do. It's driven by world state plus time, runs on the GPU and is seeded, so it comes out the same each time.
3. **Beings stay a placeholder.** In his words: "for the purposes of a correct POC … detailed and intricate but barren worlds without any living creatures rendered". Characters, if any, may come as a 2D overlay with dialogue and a button to talk to them again, even when they're present in the room. This isn't settled ("I don't really wanna nail those specifics right now"). The speaker layer, row 9, already points this way.
4. **Sub-components are objects of their own,** catalogued and reused. For example, each book on the bookshelf.
   - **The risk he named:** reusing one catalogued book could fill a whole library with one title.
   - **His own direction:** don't catalogue books by title. Keep a range of period book looks, and render a title as live text in a text slot on the object.
   - **My reading:** catalogue the *recipe*, a kind with its settings and a seed, not the *result*. Variety then comes from the seed. A cache keyed by kind, settings and seed gives reuse only when two things really are the same.
5. **"Very novel ways of minimizing render."**
6. **When is something on the other side of the world determined, and when is it rendered?** His sketch: "fully rendered before load being your room and each connected space from that location, and 2 locations away in every direction being the live work to render it into existence based on the previous work."
7. **Takeable by size.** In his words: "anything you could pickup which is just decided on creation/deployment based on size of thing you could put in your backpack/pocket should be able to be picked up."
   - **My reading:** "takeable" is worked out from the kind's size, and whether it's fixed down, not declared per object.
   - Dressing becomes an entity at the moment it's picked up. Its kind, settings and seed are written into the world document, so any one of a library's 5,000 books can be taken and remembered.
8. **Stand-ins for unbuilt and distant space.** He asked how we handle them. Today we don't: the house simply hides rooms it hasn't built. This needs designing.
9. **The shared, growing library: his most advanced form.** In his words: "a web hosted engine, like what we are building with an endlessly curating library of objects from any situation than any user engages with such that a whole world could potentially be made with only one or two assets, not having already been rendered, and those one or two assets upon render immediately join the library server side."
   - **My reading:** what joins the library is the recipe (a kind), not a rendered result.
   - **Consequence for now:** kinds should be declarative recipes over a vetted parts library, not free code, so they can be checked, versioned, shared and served safely later.
   - The measure that matters is the **gap rate**: the share of a new world's needs the library can't yet fill.
10. **Ground that isn't flat; outdoors.** In his words: "we may in the future not want an endless flat walking plane … Majestic Hills. How do we even start to work with that?"
    - **My reading:** terrain is a height function of world position, and both the picture and the walker use it.
    - It comes in chunks with levels of detail, and seams agree because everything is evaluated in world coordinates.
    - A landform kind takes settings plus authored constraints (ridges, rivers, terraces for buildings), as in Worldspring's sketch.
    - Ground cover follows slope, height and wetness. Vegetation is instanced recipes.
    - Sky and haze carry the sense of distance. Far hills are cheap stand-ins.
