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
