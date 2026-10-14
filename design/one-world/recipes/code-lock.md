# Recipe: code-lock (v1)

**The story** (Kabe, 2026-10-13): "the story could've involved the dog only saying a four digit code to the main player and the only way to exit the room is a keypad with a four digit number."

**The mechanism:** a four-digit keypad by the room's only door. Its code is knowledge the player must be given. In holo-emitter that is a link of type `keypad`, from `out:bolt` to the door's lock (`in:bolt`), and `knows` names the code. In play any digits may be tried; the proof never counts a guess. `src/make/kinds/modern.js`, `lab/codepad.js`, checks 38–39.

| stage | reads | hands on | its check | status |
|---|---|---|---|---|
| pattern-buffer | the story's text | `door E from A, bolted by keypad K`; `K's code: 4 digits` (the digits generated, or set by the story); `D knows K's code`, in the dog's frame only, never the player's until told | the code is in no frame but the dog's at the start | asked |
| construct | the facts | the beat "the dog tells the player the code". Its proof: the code reaches the player only through the dog, and the door is the room's only way out | the beat is solvable, and the code leaks nowhere else | asked |
| holo-emitter | facts and beats | the keypad and the bolted door; the link; the place's proof with the code as knowledge (`@knows`); the keys as a thumb-sized panel, with the code you know keyed in by one tap | check 38 (the code counts only once told; a note in a locked box isn't read until its key is held); keypad.spec | keypad built; the manor's knowledge must come from case play (K3, open) |
| photonic | the dog's frame | the dog says the code when the beat fires, from its own frame (Watson's rule) | the dog can't say it before it knows it; no one else can say it | asked |

**End to end:** in the lit room the dog tells you four digits. You key them in, the bolt draws back, and you leave.
