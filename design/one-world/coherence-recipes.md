# Coherence recipes

**Kabe, 2026-10-13:**

> "I think to help support the final integration of all of the projects we are going to need what I am currently calling coherence recipes. Consider this. A story so simple it is literally this: 'the world is empty, except for a room with no exits. The room is completely dark. There is a light switch in the room, that if flipped turns on a light, the brightly illuminate the room and shows that there is a friendly dog.' … if that were the story, it needs to be ingested properly by pattern buffer and from there you would need to use that shape to produce the room as described. So, for a function that you have such as mechanistic connections between items like a light switch and a light you also need a way to integrate that into the future whole. So the idea of my recipe is that basically once you identify the new mechanism, it needs to be shared and validated with each item along the way. Further photonic may have an NPC that can flip a light switch for example or any other new nuanced detail that we need to consider. Further, the story could've involved the dog only saying a four digit code to the main player and the only way to exit the room is a keypad with a four digit number. If that were described in the story, the system needs to be in place for you to take that and build it well."

## My reading

- **A mechanism isn't finished when one project can do it.** It's finished when a story that uses it goes the whole way through:
  - pattern-buffer ingests it;
  - construct makes it a beat and proves it can be solved;
  - holo-emitter builds and draws it;
  - Photonic's people can take part in it, as an actor (a dog that can flip the switch) or as a source (a dog that knows the code).
- **A recipe is the record of that,** one per mechanism. It holds:
  - the smallest story that needs the mechanism;
  - what each project makes of the story;
  - the hand-off between each pair of projects, as data that can be checked;
  - one test per stage, and one that runs end to end.
- **"Shared and validated with each item along the way":** whoever adds a mechanism writes its recipe, and each other project answers for its own stage: done, not yet, or not needed. A recipe with a stage unanswered is an open seam, and it shows as one.
- **What it changes for holo-emitter:**
  - R79's link types (switch, lever, plate) and each characteristic (gives light, seat) are mechanisms, so each gets a recipe.
  - R79's S6, the modern witness room (a wall switch across from its light, and a keypad door), is Kabe's example almost word for word. It can be the first recipe instead of a test room of our own.
- **Not new machinery.** It is the integration rules (`integration.md`, "conformance both ways") and the seam tickets (`seams.md`) applied to story mechanisms. Recipes are what those rules run on.
- **Prior art to check before building it:**
  - consumer-driven contract tests (Pact): each consumer states what it needs from a provider, and the provider runs those needs as tests;
  - Inform 7's "test me" scripts: a story carries its own walkthrough.
  A helper will do a short pass on these before the first recipe is built.

## The shape of a recipe

```
recipe: switched-light (v1)
mechanism: a switch works a light across a room (holo-emitter: link type "switch", ports out:power → in:power, latching)
stories:
  - dark-room:   "the world is empty, except for a room with no exits. The room is completely dark. There is a light switch
                  in the room, that if flipped turns on a light, the brightly illuminate the room and shows that there is a
                  friendly dog."
stages:            (each: what it reads, what it hands on, its check, its status)
  pattern-buffer:  the story → facts (below), each with its source sentence
  construct:       facts → beats and proof: the dog is seen only once the light is on; the room has no exit, and none is needed
  holo-emitter:    facts + beats → the room: kinds chosen by ports, the switch by the door's latch side, starting dark;
                   the link compiled to works rules; reachability proved
  photonic:        the dog: a body in the room; it can act through the same port (flip the switch) if a beat asks
hand-offs:         golden JSON between each pair of stages, checked both ways
end to end:        story text in → walk in, see nothing → flip the switch → the room lights → the dog is there
```

**The facts pattern-buffer hands on, for the dark room** (a sketch, in its terms: entities, relations, states, each tied to its sentence):
- **The place:** `world: empty`; `room A: exits none`; `room A: light level dark` at the start.
- **The things:** `switch S in A`; `light L in A`; `link S → L (switch, latching)`; `L: off` at the start.
- **The dog:** `dog D in A`, `friendly`. The story says the light "shows" the dog. That is a consequence the engine already gives (lit, it is seen), not a fact to store: the dog is in the room whether or not anyone sees it.

**The keypad variant** adds a second mechanism, `code-lock`, with its own recipe:
- **pattern-buffer:**
  - `door E from A, locked by keypad K`;
  - `K's code: 4 digits`;
  - `D knows K's code`. This goes in the dog's frame only; the player's frame doesn't have it.
- **construct:** a beat: the dog tells the player the code. Its proof: the code reaches the player only through the dog, and the door is the room's only way out.
- **holo-emitter:**
  - the keypad: a `code` input that takes four digits, and an `out:bolt` port;
  - its link to the door's lock;
  - in the reachability proof, the code works like a key (`@knows`, beside `@holding`);
  - the place proves the room can be left once the code is known.
- **Photonic:** the dog says the code when the beat fires, from its own frame (Watson's rule: no one knows what isn't in their frame).

## What exists today, for these two recipes

| stage | switched-light | code-lock |
|---|---|---|
| pattern-buffer | entities and frames, yes; a link as a fact: to agree (R79 S5's link is shaped to be one) | `knows` in a frame: yes (frames are its own) |
| construct | beats over pattern-buffer's graph: designed (`beats.md`) | told-secret beat: designed, not built |
| holo-emitter | built: link type `switch`, ports, rules, proof (checks 33–35); the dark room from R77 | keypad kind, `@knows`: R79's next slices |
| photonic | a person can stand in a room; acting on a thing through works: to agree | speaking from its frame: its own |
| end to end | not yet: no story enters by text today | not yet |

## Decided (Kabe, 2026-10-13)

> "Yes to all but also ask around for an inventory of unique elements in each project that warrant other checks. There should be a main demo with all layers that should be tested across shapes to be able to test into - and mew features across projects can be tested there…. Unless thats more bulk for a test then warranted"

**My reading:**
- **First recipe:** the dark-room story, then its keypad-and-dog variant, built end to end in place of R79's own witness room (S6).
- **Where recipes live:** `recipes/` here, one file per mechanism, each project answering for its own stage.
- **The other projects:** pattern-buffer, Photonic and construct (the colony's "Newproject") are written to now.
- **The inventory:** each project lists what is unique to it and could break where it meets the others (pattern-buffer's frames and their concealment, construct's beat proofs, Photonic's actors and voices, our links and characteristics). Each item becomes a recipe or a check.
- **The main demo:** one demo with every layer, grown recipe by recipe: the dark room first, then the keypad and the dog, then the next mechanism. Each project's new feature lands there and is tested end to end. "Across shapes" I read as across story shapes (each recipe's own shape) and across devices (laptop and phone).
- **Its limit:** it is only as big as its recipes, a room or a chain per mechanism and not a world, so its test stays a few minutes (Kabe: "unless that's more bulk for a test than warranted").

## The recipes

- `recipes/switched-light.md`: the dark room, a switch, a light, a friendly dog.
- `recipes/code-lock.md`: the dog tells the code; a keypad by the only door.

## Answers so far (2026-10-13)

**Photonic** (m2df033) agrees.
- **A dog:** it has only the upright two-legged body plan, and "body plans beyond the upright two-legged" waits on Kabe in Photonic's Later. Until then a person stands in for the dog, so nothing else blocks.
- **To build:** an act verb, "work port P" (about a day). Hand-offs: we send `{act, port, approach, facing, reach}`; it reports `{act, by, port, contact_t}`; we fire the link.
- **Speech:** the code-lock words come through the agreed `say()` seam. Photonic never holds or sources digits.
- **Its inventory:**
  - the same seed gives the same person on every device;
  - a description it can't express is reported, never dropped;
  - person facts are written only at rest;
  - people walk where our rooms say (an untested seam, so a recipe: "a person crosses a furnished room and goes through a door");
  - `sits_on` meets our seat characteristic;
  - wardrobe by era and rank;
  - the base layer of clothing always stays;
  - people take about 14 ms of the 33 ms phone frame;
  - the renderer settings are shared;
  - people answer to our light levels.
- **The demo:** one page, grown room by room, with a per-layer cost line on Kabe's iPhone.

**pattern-buffer** (m42bf0e) agrees.
- **What it has:** places, containment, states with valid time, frames and provenance.
- **Missing:** a canonical link attribute (`controls`, with mode `latching` or `momentary`, agreed), and `A · exits · none` as an explicit fact. Story text to facts comes from its build library, with sentence citations.
- **The hand-off shape:** `patternbuffer.recipe-facts/1` (entities and facts, each with frame, valid_from and source sentence), golden and checked both ways.
- **Its inventory:**
  - frames and concealment;
  - two time axes;
  - identity (merges, reveals, namesakes);
  - durability and folds;
  - resolve on demand;
  - the offline mirror and its JS module;
  - writers' rights;
  - attribute canonicalisation;
  - roles and eras;
  - beats.
- **Recipes it proposes:** take and drop, the hooded stranger, two Rexes, a prisoner who becomes a hero.
- **The demo, two lanes per recipe:** a golden lane, the facts JSON loaded straight in, on every change; and a story lane, the text through its build library graded against the golden, on demand and on a schedule.

**construct** (m1cc403): awaited.

**Kabe's next point, the same evening:** "We also need to consider the placement of our items and locations in pattern buffer on placement and status changes in pattern buffer as well. When an item is taken for example." This is R75. The first recipe for it is take-and-drop; its write path and facts shape are asked of pattern-buffer (m2c1f42).

**Recipes queued:**
- take-and-drop;
- a person crosses a furnished room and goes through a door;
- the hooded stranger;
- two Rexes;
- a prisoner who becomes a hero.
