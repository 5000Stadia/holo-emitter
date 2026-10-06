# The production system: the approach (2026-10-05, after both review rounds)

The facts are in `digest-2026-10-05.md`; the person's inputs are in `lab/PRODUCTION-NOTES.md`. The
person accepted round one's four points, with two conditions:
- **P4:** checks belong to kinds, and each check comes to him for vetting first;
- **P3:** the scheme must be context-agnostic and fit pattern-buffer's way of organising objects and their relationships.

## 1. Where AI is spent, and where it never is

- **Authoring a recipe:** once ever. A new part, or a new kind where data can't express it. Then at most two review rounds, run by a fresh reviewer against the recipe's steps (§6).
- **Ingesting a place's text:** once. It produces the place's influences and hero items, in catalogue terms, schema-checked. It can also write new kinds as data (P1). A place already ingested costs nothing more.
- **Deployment and play:** no AI calls, ever. Placing, filling and building known kinds is code, seed and context, in milliseconds.

## 2. The catalogue: parts, kinds, looks (P1)

- **Parts** are the only code: lathe, profile run, panel, glazing, relief band, packed row, text slot, carcass, and so on. Each part is authored once, is vetted, and carries its own checks.
- **Kinds** are data: a composition of parts, with typed settings and ranges. Each kind declares:
  - its materials by role, not by name (the look decides what each role is);
  - its slots (what it can hold);
  - its affordances (open, contain, take, lit/cold);
  - its animation by state;
  - its habit rules (how things sit in its slots);
  - its checks.

  A kind is pinned by content hash.
- **Takeable** is worked out from a kind's size and whether it's fixed. It's never listed per object.
- **Everything that obviously works, works (the person, 2026-10-05).** Their words: "It makes me want every obvious functional thing to do something. Toilet: 2 hinge lids, 1 flush handle, water is removed and slowly refills kind of thing."
  - Measured first: a table whose drawer opens costs 0.4 ms more to build than one with a fixed front (4.3 against 3.95 ms), and 3.3 µs a frame while it moves. A fake one saves nothing worth having.
  - So a door, lid, drawer, shutter, lamp, tap or handle works by default. A kind that has the part but doesn't work must say why (nailed shut, locked, broken), and that reason is itself a state the story can change.
  - **Motion lives in the parts:** slide, hinge, lever (springs back), switch (a light group on or off, a flame lit or cold), turn, lift-off, take.
  - **Processes are states that run over time:** a flush empties the bowl and it refills slowly; a candle burns down; a fire dies to embers. A process is data on the kind: a level or amount, the rate it moves at, and what starts and stops it. It runs while you watch and is worked out from elapsed time when you return, never simulated off-screen.
  - Affordances can chain: the flush handle starts the process, and the cistern refilling is what lets it be used again.
  - At authoring, the review asks "what would a person expect to work here?", and a missing one is a fault in the recipe. The kind's check drives every state and process through and back home (vetted by the person first).
- **Looks** are per period and place: materials by role, proportions, palettes. They're made once per look, cached on the device, with GPU texture synthesis as the goal.
- **The library** is shared and grows, and it holds data. Before a new kind is authored, it's matched against the existing families. The measure of the library is its gap rate.

## 3. Identity, address and change (P3, context-agnostic)

- **Every thing has an opaque, stable id, born once.** It's derived from its birth address: the path of what generated it. For example, `estate/house/room:library/press:2/row:3/slot:12`, or `story:alice/ch1/bottle`. Its seed is a hash of that birth address, so it's set for life.
- **Where a thing is now is a relation, not identity:** `in`, `on`, `held_by`, `under`, each with mechanics. A container carries contents only if its opening faces up or it's closed, so a cup turned over leaves the ball on the table. Moving changes the relation; the id, seed and provenance stay.
- **This is pattern-buffer's shape.** The world document holds entities with opaque ids, and assertions about them: attribute, value, provenance, as-of. Generated dressing is not stored. It's a pure function of (world, birth address), and becomes a stored entity only when it's committed: taken, changed, or named by the story. Edits are overlays.
- **Locality, stated exactly (round 2):** adding or changing one entity leaves everything outside its container bit-identical. Inside the container, the habit rule repacks around it: a named book of a different height moves the books and trinkets after it, as a real shelf would. A test proves both halves, with that case in it.
- **A room is sealed the first time it's seen (round 2):** the world document stores the room's *inputs* (the context blend that reached it, and the kind and part versions), not its items. If the story later ruins the owner, the room the player saw comes back as they saw it. A new room, or one the story explicitly changes, takes the new context. A check: see a room, switch its owner from great to poor, go back, and compare the room hash. Measure the world document's size after walking all 111 rooms.
- **Light** is baked per light group and summed by state, so a fire lit or cold, or a door opened, relights the room without a new bake.
- **Determinism across browsers (round 2):** the generator version pins our code, not the browser's maths. `Math.sin`, `cos` and `pow` may differ between V8 and an iPhone's JavaScriptCore. So:
  - every **choice** reads only integer hashes or rounded inputs, never a raw transcendental result compared against a threshold;
  - geometry may differ in the last bits.

  The bench prints two hashes per room: one over the raw floats, and one over the rounded layout (ids, kinds, slots, positions to 0.1 mm). The layout hash must match on the laptop and the phone. Worlds pin the kind and part versions they were made with.

## 4. Context: influences

- **An influence has the same shape everywhere:** who or what (an owner, faction, parish, trade, traffic, weather, time, an event); its reach; its weight; its traits (means, care, wear, purpose, signs of use, the history that bends the statistics); a few hero items.
- **Two reaches:**
  - **by space:** a street, a room, the weather;
  - **by possession:** an owner's things, wherever they are. Each container or surface has a keeper.
- **Context at a point** is the weighted blend of the influences that reach it, inherited down: place → region → building → room → container → item.
- **An item's identity** (kind, quality, style, owner) comes from its provenance and travels with it. A place's influences touch only the dressing generated there, plus patina, which builds with time spent there.
- **The same blend by world position makes seams between looks soft** (the estate fading into the commons).

## 5. Building and streaming

- **Four levels of commitment:**
  - **exists:** coarse facts, computed when something needs them;
  - **planned:** a blueprint, two rings out, in workers;
  - **built:** geometry, for your room and every connected one;
  - **committed:** a room's inputs sealed when first seen; an item's own record when it's taken, changed or named by the story.
- Repeated things are instanced, with per-copy variation: one book shape drawn 581 times in 3 meshes.
- Far things are cheap stand-ins. Terrain is a height function of world position, shared by the walker and the picture, built in tiles with levels of detail.
- **Play never waits (P2).** A thing whose part is missing stands as holodeck grid, at its true size and place, takeable if small. It turns real when the part arrives. What players touch decides what gets authored first.

## 6. Quality

- **When authoring a recipe:** a fresh reviewer is given concrete samples across contexts and seeds, written out as layouts. It answers: "is this a correct depiction of X for this context? If not, which recipe step is missing or wrong?" The answer changes the recipe, then the recipe runs again. The layout writes out everything the eye reads, the words on labels included: the strongroom's disordered drawer labels were caught only once they were written out. At most two rounds. This was tried once, on the shelf recipe: the reviewer found that shelf height was choosing book format, and the widow's shelf went from partly right to right.
- **Checks** belong to kinds and parts, plus a tiny universal core: it rests on something, passes through nothing, and stays within its budget. A check is added only when the person has vetted it. Checks grow out of reviews (a fault seen twice, or a shared part that could silently break).
- **The person's eye** stays last, through a gallery for batch approval of new kinds.

## 7. First proof

Ingest one *Alice* chapter, the hall of doors. Count what's an existing kind, a new composition and a new part. Time description → playable, with the AI calls counted.

## Review record

- **Round 1** (c20437a, Claude Opus 5.5 at max). Four points, all accepted by the person:
  - P4 on condition that checks belong to kinds and each is vetted by him first;
  - P3 on condition that it's context-agnostic and pattern-buffer-compatible.
- **Round 2** (c9a7b80). Three faults, all fixed above: the locality claim narrowed to the container, rooms sealed by their inputs when first seen, and choices that never read raw transcendental floats.
- **The second consultant** (GPT-6.1) returned no answer in either round.
