# The production system: the approach (round 2, 2026-10-05)

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
- **Looks** are per period and place: materials by role, proportions, palettes. They're made once per look, cached on the device, with GPU texture synthesis as the goal.
- **The library** is shared and grows, and it holds data. Before a new kind is authored, it's matched against the existing families. The measure of the library is its gap rate.

## 3. Identity, address and change (P3, context-agnostic)

- **Every thing has an opaque, stable id, born once.** It's derived from its birth address: the path of what generated it. For example, `estate/house/room:library/press:2/row:3/slot:12`, or `story:alice/ch1/bottle`. Its seed is a hash of that birth address, so it's set for life.
- **Where a thing is now is a relation, not identity:** `in`, `on`, `held_by`, `under`, each with mechanics. A container carries contents only if its opening faces up or it's closed, so a cup turned over leaves the ball on the table. Moving changes the relation; the id, seed and provenance stay.
- **This is pattern-buffer's shape.** The world document holds entities with opaque ids, and assertions about them: attribute, value, provenance, as-of. Generated dressing is not stored. It's a pure function of (world, birth address), and becomes a stored entity only when it's committed: taken, changed, or named by the story. Edits are overlays.
- **A test proves locality:** adding or changing one entity leaves every other thing bit-identical.
- **Light** is baked per light group and summed by state, so a fire lit or cold, or a door opened, relights the room without a new bake.
- **Determinism and versions:** the bench prints a hash per room. Worlds pin the kind and part versions they were made with.

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
  - **committed:** in the world document, once seen or changed.
- Repeated things are instanced, with per-copy variation: one book shape drawn 581 times in 3 meshes.
- Far things are cheap stand-ins. Terrain is a height function of world position, shared by the walker and the picture, built in tiles with levels of detail.
- **Play never waits (P2).** A thing whose part is missing stands as holodeck grid, at its true size and place, takeable if small. It turns real when the part arrives. What players touch decides what gets authored first.

## 6. Quality

- **When authoring a recipe:** a fresh reviewer is given concrete samples across contexts and seeds, written out as layouts. It answers: "is this a correct depiction of X for this context? If not, which recipe step is missing or wrong?" The answer changes the recipe, then the recipe runs again. At most two rounds. This was tried once, on the shelf recipe: the reviewer found that shelf height was choosing book format, and the widow's shelf went from partly right to right.
- **Checks** belong to kinds and parts, plus a tiny universal core: it rests on something, passes through nothing, and stays within its budget. A check is added only when the person has vetted it. Checks grow out of reviews (a fault seen twice, or a shared part that could silently break).
- **The person's eye** stays last, through a gallery for batch approval of new kinds.

## 7. First proof

Ingest one *Alice* chapter, the hall of doors. Count what's an existing kind, a new composition and a new part. Time description → playable, with the AI calls counted.
