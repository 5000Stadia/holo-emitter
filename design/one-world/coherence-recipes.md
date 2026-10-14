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

**construct** (m1b5d34, main dde0aaa) agrees.
- **What it has:** beats with a solvability proof (R35's producer fixed point). The told secret is its clue delivery: InFrame(knows:player, keypad·code), by ASK from a reachable holder, with concealment by protected keys. Take and drop are deterministic canon writes.
- **Missing:**
  - a deterministic link consequence (read `controls`, write `obj:light · state · on` itself rather than through prose extraction);
  - light-gated perception ("seen only when lit");
  - a deterministic keypad check;
  - a structured `say` payload for Photonic (with its held live bridge, R25);
  - hosting placements (also R25).
- **The hand-off:** `construct.recipe-beats/1` = `{recipe, beats:[{id, weight, condition}], clues:[{holder, fact, reveal_condition}], proof:{findings}, says:[{beat, speaker, to, text}]}`.
- **Its inventory:**
  - the play horizon (reads bound to the player's moment);
  - ids never taken from the future;
  - frame concealment;
  - beat proofs;
  - clue delivery;
  - the diegetic clock;
  - chapter bridging;
  - player intent (speech is never fact);
  - places grown in play;
  - narrator facts quarantined;
  - reshape.
- **Recipes it proposes:** the told secret leaks nowhere; chapter 2 opens where chapter 1 ended; a lie told to a character stays a belief; a place grown in play survives a reload.
- **Its lane in the demo:** a pytest per recipe that loads the golden facts, authors the beats, runs the R35 proof, checks concealment and plays a scripted 3 to 5 turn walkthrough on stubs (seconds, no model, on every change). A live narrator runs on demand.
- **Held, one spelling:** construct writes `in · person:player`; pattern-buffer proposed `held_by`; pattern-buffer folds both as one key. Settled (pattern-buffer, m342c1a): the golden uses `held_by`, which its library writes from text and classes as state with no model call. Its grader compares the folded location, so construct's `in · person:player` rows match unchanged.

**pattern-buffer, later:** CONTAINMENT-DURABILITY-V1 has landed (42d0c23), so take-and-drop's pattern-buffer stage is built. Fixtures are written by a host (author session or build manifest), never by prose extraction, and a model's guess below 0.95 never makes containment permanent.

**Kabe's next point, the same evening:** "We also need to consider the placement of our items and locations in pattern buffer on placement and status changes in pattern buffer as well. When an item is taken for example." This is R75. The first recipe for it is take-and-drop; its write path and facts shape are asked of pattern-buffer (m2c1f42).

**Recipes queued:**
- take-and-drop;
- a person crosses a furnished room and goes through a door;
- the told secret leaks nowhere; chapter 2 opens where chapter 1 ended; a lie told to a character stays a belief; a place grown in play survives a reload (construct's);
- the hooded stranger;
- two Rexes;
- a prisoner who becomes a hero.

## The main demo, built (2026-10-13, the night)

- **The page:** `lab/manor/?plan=recipe&recipe=<name>`, the manor's own engine on a place built from a recipe's facts.
- **The golden lane:** `lab/recipes/<name>.facts.json`, pattern-buffer's shape.
- **The plan:** `src/make/recipe.js` reads and checks the facts and refuses what it can't build, with the reason. It chooses kinds by what they carry (a switch gives power, a light takes it) and lists every choice the facts leave open.
- **Play:** `src/make/recipe-play.js` builds and links the things, stands in the people, and runs the place's proof at load.
- **The first recipe:** switched-light, dark room and all. Its test is `tests/playwright/recipe-demo.spec.mjs`.
- **Fixed on the way:** the fire pool lit everything in a hearth's orange. Each slot now takes its own light's colour, so the bulb is warm white and candles their own.
- **Next:**
  - code-lock: the keypad by a door, a door made from facts, and the person telling the code;
  - ~~take-and-drop~~ built 2026-10-14 (below);
  - ~~the per-layer cost line Photonic asked for~~ built 2026-10-14 (below);
  - the story lane when pattern-buffer's library gives these facts.

**Code-lock, built the same night.**
- `lab/manor/?plan=recipe&recipe=code-lock`: the dark room with one way out.
- **The door:** a door from the facts, its opening in the wall behind you, its kind (the bolted one) chosen by its port, an open court beyond. The plan names a doorway's door kind, and the house builder hangs it.
- **The keypad:** beside the doorway on the latch side, with the facts' code.
- **The person:** what they know in their own frame (the code), they tell when talked to. The line is a plain stand-in until construct's line and Photonic's voice; the code is then known, and the keypad offers it.
- **The proof:** it now lives in the planner (`proveRecipe`, no build needed). It reaches outside only through the told code, and fails when no one tells it.
- **The day outside:** a recipe's dark room no longer puts out the world. The room's dark is its own, and the court is in daylight.

**The per-layer cost line, 2026-10-14** (Photonic's ask: "people ms, place ms, loading", for Kabe's iPhone).
- `?perf` on any manor page, the demo included, shows it on the perf card a phone's screenshot carries (`src/make/perfcard.js`; `window.__layers()`).
- **Each layer's ms a tick, p50/p95 over the last 3 s:** you (walking, aiming), place (things, rooms, building the rest), people, land (ground and hill tiles), lights (the pools), render. The page laps each after its work (`lap(name)`), so the layers sum to the whole tick. People over 14 ms at p95 is marked OVER (their share of the phone's 33 ms frame).
- **Loading by stage:** each startup mark's seconds after the one before (renderer, built, textures, far-textures, tiles, first-frame=walkable, tiles-all).
- Off (no `?perf`), nothing is counted.
- First reading, the dark room, swiftshader at load 21: people 0.0/0.1, place 0.1/0.7, land 0.2/33 (the tiles' catch-up), lights 0.2/0.4, render 6.7/17.6 ms; walkable 8.7 s, of it textures 4.3 s.
- Its check is in `recipe-demo.spec.mjs` (the dark room, with `?perf`).

**K3, 2026-10-14:** the codes you learn in a case's play reach the page's keypads. `codesKnown` (`src/make/case-play.js`) counts them as the proof does: a clue that carries one, once learned (a person tells it); a thing that shows one (a note with its digits), once opened, taken or read. A keypad's own code tells no one. A resumed case knows again what it knew. A kind's `@knows` need is answered from the same set. Check: `keypad.spec.mjs` (K3).

**take-and-drop, 2026-10-14:** `lab/manor/?plan=recipe&recipe=take-and-drop`, from `lab/recipes/take-and-drop.facts.json` (drafted in pattern-buffer's shape; its wording and `in` for lying on, m524bb7).
- **The planner** (`src/make/recipe.js`) now lays more than one room: a door into another room lays it beyond the door's wall, the first room's size; a door the facts call open stands open. A thing in another (a page in a book on a table) is placed in its host's slot, and its place is its host's.
- **Kinds by what they carry:** a table is one that stands free with nothing to work (the smallest, for a small room: `table/carpeted`); a book a carriable thing with a slot inside under a hinge (`book/bound`, new); a page a leaf thinner than a card (`paper/leaf`, new).
- **In play:** the page is shut in until the book is opened (works' slot inside under a hinge); taken, the outbox writes `obj:page · held_by · person:player`; put on the hall's table, `obj:page · in · obj:hall_table`.
- **Check:** `recipe-demo.spec.mjs`, take-and-drop.
- **Reload, and it is in the hall (2026-10-14):** a thing put down is kept in the world as `on` (what it was put on, its slot, where in it), and seated there again on load, once both it and its host are built (a late room brings either). This holds for the whole house, not only the demo. Checked in the take-and-drop test by reloading.

