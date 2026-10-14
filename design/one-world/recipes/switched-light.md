# Recipe: switched-light (v1)

**The story** (Kabe, 2026-10-13): "the world is empty, except for a room with no exits. The room is completely dark. There is a light switch in the room, that if flipped turns on a light, the brightly illuminate the room and shows that there is a friendly dog."

**The mechanism:** a switch works a light across the room. In holo-emitter that is a link of type `switch`, from a port giving power (`out:power`) to one taking it (`in:power`). It latches. `src/make/links.js`.

| stage | reads | hands on | its check | status |
|---|---|---|---|---|
| pattern-buffer | the story's text | facts, each tied to its sentence: `room A: exits none`; `A: dark` at the start; `switch S in A`; `light L in A`; `link S → L (switch, latching)`; `L: off`; `dog D in A, friendly` ("shows" the dog is the engine's consequence, not a fact) | the golden facts below | asked |
| construct | the facts | the beat "the light comes on: the dog is seen", and its proof that the room needs no exit to be finished | the beat is solvable | asked |
| holo-emitter | facts and beats | the room built: kinds chosen by port (a tumbler switch, a pendant bulb), the switch by the room's door on its latch side, dark at the start, the link compiled to works' rules, reachability proved | checks 33–35; the end-to-end test | built in parts (the switch and the bulb: lab/brief/object.html?o=switch; dark rooms: R77) |
| photonic | the dog's facts | a friendly dog, a body in the room. If a beat asks, it can work the switch through the same port the player uses | the dog is in the room, unseen until the light | asked |

**The hand-offs** are golden JSON between each pair, agreed by both sides and checked both ways.

**End to end:** the story's text goes in. You arrive in the dark and see nothing; the switch is found by touch, or by the eye's own faint light (R77). Flip it, and the room lights and the dog is there.
