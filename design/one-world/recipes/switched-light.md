# Recipe: switched-light (v1)

**The story** (Kabe, 2026-10-13): "the world is empty, except for a room with no exits. The room is completely dark. There is a light switch in the room, that if flipped turns on a light, the brightly illuminate the room and shows that there is a friendly dog."

**The dog** (Kabe, 2026-10-13, to Photonic: "Lets stick with people for now since were still perfecting", then "Lets make it a person who thinks its a dog"): a person who believes they're a dog. By default they stay on all fours, sit up and pant, and follow the player; they are clothed, as every person is. That is Photonic's new `all_fours` posture, beside standing, sitting and lying, and a crawl walk. Animals stay in Photonic's Later.

**The mechanism:** a switch works a light across the room. In holo-emitter that is a link of type `switch`, from a port giving power (`out:power`) to one taking it (`in:power`). It latches. `src/make/links.js`.

| stage | reads | hands on | its check | status |
|---|---|---|---|---|
| pattern-buffer | the story's text, through `patternbuffer.build` (BUILD-LIBRARY-V1): a manifest from category passes, then facts per chunk, each citing its sentence | `place:room · exits · none`; `place:room · lit · dark` (valid_from 0); `obj:switch · in · place:room`; `obj:light · in · place:room`; `obj:switch · controls · obj:light` with `link_type · switch` and `mode · latching`; `obj:light · state · off` (valid_from 0); `person:dog · in · place:room` (a person, the dog the story names, `disposition · friendly`, posture `all_fours`). Perception is derived: "shows the dog" isn't stored | the golden facts equal the library's output on the text (story lane); the golden loads unchanged (golden lane) | built: entities, frames, containment, states, provenance, the library. Next: declaring `controls` |
| construct | the facts | the beat "the light comes on: the dog is seen", and its proof that the room needs no exit to be finished | the beat is solvable | asked |
| holo-emitter | facts (golden lane: `lab/recipes/switched-light.facts.json`) and beats | the room built: kinds chosen by port (a tumbler switch, a pendant bulb), the switch by the room's door on its latch side, dark at the start, the link compiled to works' rules, reachability proved | checks 33–35; `tests/playwright/recipe-demo.spec.mjs` (facts refused with reasons; one room, no door or window, dark; the switch lights the bulb across the room; the person on all fours) | **built, golden lane**: `lab/manor/?plan=recipe&recipe=switched-light` (`src/make/recipe.js` plans from the facts, `src/make/recipe-play.js` plays them; the person a stand-in body until Photonic's). Next: the story lane, once pattern-buffer's library gives the facts |
| photonic | the dog's facts: `{entity, kind, recipe, seed, place, rest_pos, facing}` | a person who thinks they're a dog: on all fours, sitting up and panting, following the player. If a beat asks, they work the switch through the same port the player uses: we send `{act: "press", port, approach, facing, reach}`, they report `{act, by, port, contact_t}`, we fire the link | the body is in the room from the start, drawn only when lit, with no pop at the switch | not yet: the `all_fours` posture, the crawl walk and the act verb (about a day) |

**The hand-offs** are golden JSON between each pair, agreed by both sides and checked both ways.

**End to end:** the story's text goes in. You arrive in the dark and see nothing; the switch is found by touch, or by the eye's own faint light (R77). Flip it, and the room lights and the dog is there.
