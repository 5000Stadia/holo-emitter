# R48, the production system, in steps

R48 builds what `plan.md` describes. Each step is finished and checked before the next one starts. The code lives in `src/make/`: it's the engine every place builds on, not a lab piece. Any check a step proposes goes into `checks-proposed.md` for Kabe to vet. It doesn't join the tests until he has.

1. **The core.** *Done 2026-10-05:* `src/make/id.js`, `catalogue.js`, `build.js`, `looks.js`.
   - **Identity:** an id and a seed from a thing's birth address, by integer hashing only.
   - **Registries:** one for parts (code) and one for kinds (data). A kind is checked against its schema and pinned by a content hash.
   - **Building:** `build(kind, address, settings, context)` returns the thing and its record. Every choice reads the seed through integer maths.
   - **Looks:** a look maps material roles (body, bands, paper) to materials.
2. **Things that work.** *Done 2026-10-05:* `src/make/works.js`.
   - **Mechanisms:** slide, hinge, lever (springs back), switch, and process (a level over time, driven by elapsed time).
   - **One interaction layer:** aim at a thing, find its affordance, change its state, play the motion.
   - **State is kept as an overlay of assertions.** Generated things become entities only when they're changed.
   - Kabe, 2026-10-05: "every obvious functional thing to do something."
   - **Gates, variables and rules**, also Kabe 2026-10-05 (plan §2): actions and taking gated by engine conditions or the inventory; actions set variables; rules count things in an area and set variables or act on things. Taking things into the inventory. Locks open on the way when you hold the key.
3. **The strongroom from kinds.** *Done 2026-10-05:* `src/make/kinds/strongroom-1660.js`. Parts: `joinery`, `ironwork`, `press`, `lights`. The chest opens with the desk's key, and the candle burns down. The press, the chest, the table, the door and the shutters become kinds over parts, and the room page builds from them.
   - Every movable works: drawers, lid, padlocks, doors, shutters.
   - The pigeonhole contents become a habit rule.
   - The old hand-wired drawers, both the table's and the presses', go.
4. **Books and shelves from kinds.** *Done 2026-10-05:* `src/make/parts/books.js`, `bookcases.js` (the Pepys press, whose four glazed doors now open), `shelving.js` (the shelf habit) and `shapes.js`. The 14 household things are pure data in `kinds/household-1660.js`. Owners and room purposes are influences in `influences/england-1660.js`, blended by `influence.js`. `book.js`, `bookpress.js`, `trinkets.js` and `owners.js` become kinds. The owners become influences: by space or by possession, blended down the containment chain, with provenance travelling with the item.
5. **The world document.** *Done 2026-10-05:* `src/make/world.js` and `layout.js`. The strongroom keeps its state as assertions and is sealed by its inputs when first seen. Checked in the browser: the locality case, the sealing case, and identical layout and raw hashes in Chromium and Firefox. WebKit needs a system library first.
   - It holds entities and assertions (attribute, value, provenance, as-of), in pattern-buffer's shape.
   - Relations come with their mechanics.
   - A room is sealed by its inputs the first time it's seen.
   - **The locality case:** a named book repacks its own shelf and changes nothing outside it.
6. **Light by state.** Light groups summed by state, so a candle, rushlight or fire can be lit or cold without a new bake.
7. **Play never waits.** A thing whose part is missing stands as holodeck grid at its true size. The four levels of commitment (exists, planned, built, committed) apply as you move between rooms.
8. **The bench.**
   - `?bench` prints two hashes per room: the layout hash and the raw-float hash.
   - It reports the world document's size after walking every room.
   - Kabe runs it on the laptop and the phone, and the layout hashes must match.

Steps 1 to 3 prove the shape on things Kabe has already seen. Step 4 proves influences. Steps 5 to 8 make it last.
