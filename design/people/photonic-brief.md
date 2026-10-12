# Photonic: the founding brief from holo-emitter (2026-10-11)

**Kabe, 2026-10-11:** "Biggest gap for us is an npc system compatible. Since theres so much depth in that alone and by the nature of the build Process to here I might make the npc effective relationship to pattern buffer and construct a separate project like I have you. And have them develop tests like your investigation test but also npc model generation and all that in an empty room and when its polished you can ingest it into holo emitter surgically." He named it photonic (in the holodeck fiction, its people are photonic).

**What follows is holo-emitter's side:**
- what we hand over;
- what we need back, so the ingest is surgical;
- what we've already learned.

**Two things stay Kabe's call:**
- your vision;
- whether our M8 (R60–R64) moves to you. Our proposal is that it does, and our M8 becomes "take in the people".

## 1. What photonic owns, and where it ends

**Photonic owns the people of the holodeck:**
- **Bodies:** every age, from baby to elderly; builds; heads and faces as reusable parts (Kabe: "a digital mr potato man").
- **Wardrobe:** kits per setting and rank, with era and genre kept separate from the body.
- **Movement:** made in code from age, build and load, at three tiers (full rig near, GPU-animated middle, cheap far).
- **Behaviour:** walking a route, sitting, carrying, opening a door, following you, keeping a schedule; perception (what they see and hear of you); presence (gaze, expression, nearness).
- **People from place:** who can be in a place at an hour, from its influences, era and events. Households and errands, not singles. Rank sets rarity; named people exist once.
- **Their relationship to pattern-buffer and construct:**
  - each person's knowledge (`knows:`) and claims (`says:`) held natively in pattern-buffer;
  - relationship and affinity state, which construct's Bond shape reads as relational facts;
  - how a person carries out construct's beats.

**Photonic does not own:**
- places, rooms, the floor grid, things that work, light, sky, sound or weather. Those are holo-emitter's.
- the story. That is construct's, over pattern-buffer.

**Where photonic ends:** modules that drop into `holo-emitter/src/people/` behind the interface in §3, with their own tests. We take them in.

## 2. The ground you build on (use it from day one)

**The empty room:**
- `lab/manor/?plan=alice-hall` is one room (69k vertices, built in about 0.2 s) with walking, working things, light and the hour.
- `lab/manor/?plan=banqueting` is one octagonal room with furniture.
- Serve the holo-emitter checkout and load either. We'll add a dedicated harness page that loads your modules into that room, under `lab/people/`.

**The modules a person will touch** (read the headers; each says what it is):

| Module | What it is | What a person needs from it |
|---|---|---|
| `src/make/walk.js` | `makeWalk({ plan, levelOf, blocks, isOpen, body, claims })`, `BODY = { half 0.22, step 0.45, head 1.95 }` | walking on our floors, stairs and doors |
| `src/make/claims.js` | the floor grid, 0.1 m cells, in layers `floor stand wall over`: FREE, RESERVED, BODY, SOLID | where a body may stand; where a chair is sat on |
| `src/make/place.js` | `walkable()`: the reachable floor of a room | routes |
| `src/make/works.js` | `makeWorks(...)`: every thing that works (affordances, gates, locks and keys, `@holding`, rules, processes); state as an overlay in one store | a person opening a door, taking a key, lighting a candle, through the same calls the player uses |
| `src/make/presence.js` | `makePresence(THREE, { picture, name, at, height })` → `{ group, tick(t, camera), hit }`: today's painted bust | **the interface your person replaces** (§3) |
| `src/make/narrator.js` | `EFFECTS`: the closed list `spawn_person {id, at}`, `move_person {id, to}`, `set_var`, `reveal_thing` | how the story moves people today |
| `src/make/talk.js`, `src/make/case.js` | questioning: topics, stances, each person's knowledge frame, lies broken by their own evidence | what a person knows and says |
| `src/make/sitter.js` | the painted portrait from a "look" (`normaliseLook`) | the look data we already have for the four suspects |

**The engine and its rules** (non-negotiable for a surgical ingest):
- three.js **r186**, the WebGPU renderer with its WebGL2 fallback chosen per device, and TSL node materials. Use our `src/make/render.js` settings: reversed depth, MSAA, no TAA, ACES.
- No bundler and no new installs without Kabe.
- [`design/engine-principles.md`](../engine-principles.md):
  - **rank once, threshold everywhere:** a per-person rank decides who exists on a phone;
  - **derive from the address,** never from build order: a person is a seed and a recipe, the same however many were made before;
  - **one field, many readers;**
  - **per-frame work only for those seen;**
  - **time in seconds,** gaits advancing a phase.
- Determinism: same seed, same person, on every device.
- Plan coordinates: x east, y north, z up. three's are (x, z, −y).
- **Licences:**
  - nothing you can't publish in a public repo;
  - MakeHuman's CC0 base is the agreed start;
  - Mixamo and Quaternius files are out (licence traps).
- **Budgets,** from R60:
  - **300 people walking on a phone,** frame time measured. Measure by `lab/fps/`'s method and `tools/capture.mjs` (Grassworks report §3: GPU time per pass, one system removed, CPU by owner).
  - The manor holds 30 fps on a phone today: your people share that frame.
- Code first, minimal AI: people must work with no model call. A model may only voice, never decide.

## 3. What we need back: the person interface (to be agreed, then tested on both sides)

A proposal to shape together. Nothing in it is fixed until both sides test it.

```js
// one person, built from data; nothing per frame unless seen
makePerson(THREE, { recipe, seed, tier })          // recipe: what the person is, as data (genes, age, build, wardrobe slots and dyes, props)
  -> { group, hit,                                   // as makePresence: what draws, what the player aims at
       tick(t, camera, ctx),                          // ctx: { walk, claims, works, lights, hour }
       goTo(target, { pace }), face(target), sit(thing), stand(),
       use(thing, affordance),                        // through works.js, as the player does
       say(line, { to }),                             // shown and, later, voiced
       perceives() -> { seen: [...], heard: [...] },  // what they noticed since the last ask
       state() -> {...} }                             // to persist: a document, not a scene
```

- **The narrator's effects keep working.** `spawn_person` and `move_person` become a walk, not a teleport, where a route exists.
- **New effects** each kit needs, such as someone seeking you out or someone keeping an hour, are proposed together and stay in a closed list.
- **What we persist:** where each person is and what they're doing, as data, never as a scene.

## 4. The tests to carry over and grow

- **The investigation playtest:**
  - holo-emitter's naive-play bot plays the 1660 case end to end with no model (`tests/.naive-play.mjs`).
  - Its A/B against construct's beat deck found that stall beats keyed to rooms go unheard; key them to the person you're talking to.
  - Make photonic's version a person-focused playtest in the empty room: a suspect walks to you, sits, answers, gets up and leaves by the door.
- **Our geometry and checks** (`tests/playwright/checks.spec.mjs`): they run on every person we take in.
  - Nothing floats; nothing passes through walls or furniture.
  - Faces never fight (`src/make/coplanar.js`).
  - The interface is stable across a load.
- **The phone budget:** 300 walking, the frame measured.
- **Coherence checks at generation:** cheap arithmetic, standing-approved by Kabe ("All checks that likely support coherence without taxing cost is fine by me").
  - No lone baby, no second princess (R62).
  - A household holds together.
  - A body fits the door it uses.

## 5. What holo-emitter already learned (read before starting)

- [`design/people/prior-art.md`](prior-art.md):
  - MakeHuman CC0 bodies with morph targets;
  - UMA's "a person is data" recipe;
  - gait in code;
  - tiers;
  - crowds varied by place;
  - the age and setting ranges;
  - the Grassworks report's §4.15 notes: rigid kit parented to bones; foot probes on the full-rig tier only; instanced crowds with dyes per instance; never one deep clone and one mixer per person.
- [`design/references/teleoperator/runtime.md`](../references/teleoperator/runtime.md) §1: walkers animated in the vertex shader, with a joint per vertex and phase in the instance matrix.
- [`design/audit/fiction-range/README.md`](../audit/fiction-range/README.md):
  - what every story shape asks of people;
  - what construct expects: presence tiers `at_scene / nearby / offscene`, NPC turns, an off-screen world tick (`moved met_with sent_word finished_task closed_up`);
  - the Bond kit (room-scale, nearness and gaze, gifts, privacy, memory);
  - perception, which Gambit, horror and Farce lean on.
- [`design/case/boundary-with-construct.md`](../case/boundary-with-construct.md): the narrow contract; world in, events out, beats in.
- **Kabe's judgements so far:**
  - the painted busts are "kinda 2d weird right now and the faces are pretty jank";
  - our characters "come off as cinchy, and not great looking" (R59, 2026-10-11);
  - bodies are "bonus points";
  - sense matters: "they aren't multiple random princess babies walking London streets".

## 6. How we work together

- **Talk at hand-offs** (`colony send holo-emitter`):
  - first, to agree the interface in §3;
  - then each time a module is ready to try in our room.
- **We will:**
  - build the harness page;
  - answer questions about our modules;
  - review each drop before it lands;
  - port nothing we haven't tested.
- **Placement and vision** are Kabe's.
