# Beats: one structure for puzzles and plot, nested (2026-10-13)

**Kabe, 2026-10-13**, after R79 (characteristics, and links between things such as a switch, a lock or a keypad):
- "I actually wonder if the relationship that construct has with whatever type of cause-and-effect concepts, it is conjuring would benefit as directly with a successful structure like what you're talking about with Lucas arts system … which is as established as featured truth as the pattern buffer. It makes me wonder if pattern buffer should handle something like that or if we should expand upon this concept to also encompass plot path beats with optional puzzle like gating."
- "I just wonder if tracing the beginning to the end of a puzzle driven narrative could look the same as the beginning to the end of a non-puzzled driven fictional narrative. But we would want to make sure that we're not building harnessing that is forced into genres and fiction styles that are completely open-ended improvisations which is another thing that I want this system to be able to handle in the future"
- "You can make a system that is intelligently nested too that allows for different styles … an umbrella theme and story of open and improv set in a genre of romantic comedy, and we could have a loose intentionally unconnected floating story beats that the narrator can pull from when one of them seems appropriate … one of them literally is going on a date and doing an escape room and nested within that mechanism is a fully puzzle based beginning to end locked room structure and if you don't get to the end within the hour after starting, you lose the escape room, but whether you win or loses only consequential to the thematic anyways as you and your date exit and continue on the improvised romance"
- "Otherwise, you can have a Deep and Rich choose your own adventure style causes, and effects … I think it is fun to consider building the foundational framework for it. I mean, we are shooting for the Star Trek Hollodeck after all."

## My reading

**One unit at every scale: a beat.** A beat is something that can happen. It has:
- **conditions:** facts that must hold before it can happen (the code is known, the date has been agreed, the drawer is open);
- **effects:** facts it makes true (the door is unlocked, the escape room is lost, they laughed about it);
- **contents (optional):** a nested set of beats.

A pressed keypad, a scene and a whole story are all beats. LucasArts' puzzle dependency charts and a plot outline differ only in how tightly their beats are tied together, which is Kabe's "could look the same".

**Each set of beats declares its mode.** The mode says how the set is played, and which proof applies to it:
- **Floating:** an unordered pool. The narrator picks whichever beat fits now. There is no required order and no ending to reach. The only proof is that each beat's conditions can be met somewhere. This is the open improv romcom.
- **Branching:** choices lead to different beats, as in choose-your-own-adventure. The proof is that every branch reaches an ending, or is declared open.
- **Locked chain:** the conditions form a dependency chart, as in an escape room or the case. The proof is solvability: nothing can lock you out, every clue comes before it's needed, and nothing is skipped by accident.
- **Timed:** any mode can carry a clock ("within the hour"). Running out is an ordinary effect: "the escape room is lost".

**Nesting is how styles mix without forcing one on another.** The romcom is floating. One of its beats, the date at the escape room, contains a locked chain with a one-hour clock. Its outcome comes back to the parent as a fact (won, lost, how it went). The parent may use that fact or ignore it ("only consequential to the thematic"). A locked chain's proofs never reach into a floating parent, so improvisation stays free.

**Who holds what** (Kabe's rule: each element is used from its home project):
- **pattern-buffer holds the facts that beats read and write:** which beats happened, what is unlocked, when the hour started, how it ended. These are ordinary facts with no story logic. This keeps pattern-buffer what it is: the truth that never computes the story.
- **The narrator (construct) owns beats, modes and nesting.** It is "built on the basic roots of storytelling structure" and "fits over any genre" (Vision), so the structure of a story is its own.
- **holo-emitter supplies the mechanisms beats can use in a place** (R79: switches, locks, keypads, breakers, each with its contract) and the reachability proof over them. A locked chain's solvability builds on that proof.
- **Where puzzle composition lives** is gate gae5acb. This reading moves my recommendation: composing locked chains belongs with the narrator's beats, not in a puzzle-only sibling project. holo-emitter keeps the links and their proofs.

**What this asks of R79 now:** links are facts in the world, with a reachability proof (point 4 of gate g39da38). With that, a beat's conditions and effects can name things in the place ("the keypad by the vault door is unlocked"), and the narrator's proofs can lean on ours.

## Should pattern-buffer ingest and track beats? (Kabe, 2026-10-13)

**Kabe, on gate g39da38:** "Agree on one and two although mechanistically, it makes sense that the system of ingesting the plot/story beat/puzzle chains or whatever you want to call them is assimilated and ingested functionally at the same time that pattern buffer ingest its objects and it may be efficient to consider where those two mechanisms overlap, and if this should actually exist as a tracking mechanism in pattern buffer itself"

P1 and P2 accepted. P3 not addressed. P4 (links as world facts) reframed by this question. The gate stays open until every point is answered (colony requires it).

**My reading:**
- **The overlap is real.** A beat's conditions and effects name the same things pattern-buffer ingests: the keypad, the vault door, the date. If beats come in during the same pass, they share one identity resolution and one log. A beat that names a door that doesn't exist fails at ingest, which is R79's "sound at creation" applied to stories.
- **pattern-buffer already does this for doors.** Traversability (RFC-003, shipped in its R6) derives "can I pass A to B, and if not, why" from ordinary facts (the door is shut, a guard is present) plus a policy the host declares. "Can this beat happen now, and if not, which fact is missing" is the same shape: declared conditions read over facts. Tracking what is available is not deciding what happens, so it keeps pattern-buffer's rule ("never decides what happens next").
- **The split this suggests:**
  - pattern-buffer ingests beats with the world and tracks them: which are declared, which have happened, which are available and why not, and the clocks.
  - construct still writes beats and chooses which one happens.
  - holo-emitter supplies the mechanisms in the place (switch, lock, keypad) and plays them.
- **Open tension (for pattern-buffer):** on the phone, pressing enter on a keypad must open the door at once, but the browser only applies pattern-buffer's answers and never computes them. Possible answers: availability precomputed into the export as a lookup table; or the device runs the mechanism, records the fact, and pattern-buffer confirms.
- **Where the solvability proof runs** (nothing can lock you out, every clue before its lock) follows from where the beat graph lives.

Asked pattern-buffer (2026-10-13); P4 waits on its answer.

**construct's view (m02e31c, 2026-10-13):** it agrees with the split, and its existing condition grammar (`construct/arc/conditions.py`) is the seed. Its hard constraint is concealment: beat availability must never reach a player's frame or the phone export, because a lookup table would give away how the story is built. The export carries mechanism answers ("this keypad opens this door"), not beats.
**My reading:** this resolves the phone tension above. The phone only needs the mechanisms, which are in plain sight in the place anyway. R79's links are what goes to the phone. Beats stay with pattern-buffer and the narrator.

**pattern-buffer's view (m16212a, 2026-10-13):** it fits its grain, and it's logged as pattern-buffer R53 under Later, waiting for Kabe to place it.
- A beat is an ordinary entity. Its conditions and effects are declared facts, written through the ingest gate.
- "Available, or what's missing" is a derived read, like traversability.
- "Happened" is the event row the host writes. The engine never fires an effect: construct writes the effect rows.
- Clocks are deadline facts.
- The condition language stays small: exists, equals and not over (entity, attribute, value), with and/or. It is never host code.
- **The phone:** a per-state trigger table in the export ("trigger fact -> expected effect ops"). The device applies the effect at once as a pending overlay and queues the trigger. The feed confirms it, and canon wins.
- **The solvability proof** is construct's, an authoring-time search. pattern-buffer serves the graph as a read, and it moves into the engine only if a second host needs it.

**Where the two views disagree, and my reading:**
- construct wants nothing beat-shaped on the phone. pattern-buffer's trigger table is per state and per player act.
- Both views still leak a secret: an entry like "4471 on this keypad opens the vault" gives the code away to anyone who reads the export.
- Proposed merge:
  - the table carries mechanism triggers only, as the act and its world effect (the door unlocks), with no beat ids and no narrative effects;
  - secret trigger values are hashed, so the device hashes what is typed and compares;
  - narrative consequences arrive afterwards through the feed.

**Converged (pattern-buffer m43a84d, 2026-10-13):** pattern-buffer adopted construct's concealment rule.
- Beats live in an author-side frame that the mirror never reads.
- The phone gets mechanism answers only, applied as a pending overlay that the feed confirms.
- Still open from my reply m8c5b1f: a mechanism answer like "this keypad, this code" still carries the code in plain text. The code should be hashed.
