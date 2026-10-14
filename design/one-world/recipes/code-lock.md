# Recipe: code-lock (v1)

**The story** (Kabe, 2026-10-13): "the story could've involved the dog only saying a four digit code to the main player and the only way to exit the room is a keypad with a four digit number."

**The mechanism:** a four-digit keypad by the room's only door. Its code is knowledge the player must be given. In holo-emitter that is a link of type `keypad`, from `out:bolt` to the door's lock (`in:bolt`), and `knows` names the code. In play any digits may be tried; the proof never counts a guess. `src/make/kinds/modern.js`, `lab/codepad.js`, checks 38–39.

| stage | reads | hands on | its check | status |
|---|---|---|---|---|
| pattern-buffer | the story's text | `obj:door · fixture · true`; `obj:door · in · place:room`; `obj:door · connects_to · <outside>`; `obj:keypad · controls · obj:door` with `link_type · keypad`; `obj:keypad · code · <4 digits>` in canon (the story's, or resolved on demand and remembered); the same `code` row in `knows:person:dog` only. The telling, a play event, writes `code` into `knows:person:player` | before the telling, no frame but canon and the dog's holds the code, and the player's export and feed never carry it; after it, the player's frame does | built: frames, resolve, the mirror's concealment. Next: the beat (R53, in M4) |
| construct | the facts | the beat "the dog tells the player the code". Its proof: the code reaches the player only through the dog, and the door is the room's only way out | the beat is solvable, and the code leaks nowhere else | asked |
| holo-emitter | facts and beats | the keypad and the bolted door; the link; the place's proof with the code as knowledge (`@knows`); the keys as a thumb-sized panel, with the code you know keyed in by one tap | check 38 (the code counts only once told; a note in a locked box isn't read until its key is held); keypad.spec | keypad built; the manor's knowledge must come from case play (K3, open) |
| photonic | the line from the beat: `{say, speaker, to, beat, duration}` | the person who thinks they're a dog says the code in words when the beat fires (perhaps with a bark: the line is construct's), performing face, gaze and mouth through the agreed `say()` seam. Photonic never holds or sources the digits | a golden test of `say()` payloads: Photonic sources no digits itself | words: built (the say seam); the all-fours body: as in switched-light |

**End to end:** in the lit room the dog tells you four digits. You key them in, the bolt draws back, and you leave.
