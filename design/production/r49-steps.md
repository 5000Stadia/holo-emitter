# R49 steps: the hall of doors, from the book to a room you can play

The first Alice proof (plan §7; Kabe, 2026-10-05: "Sounds good lets cook"). The source is Chapter I of the
1865 text, from the hall paragraph to the cake (`lab/alice/ch1.txt`, Project Gutenberg #11). There are three
budgets. AI is used once to ingest the chapter, and once per new kind's recipe (at most two review rounds each),
and never while building or playing. Every AI call is counted. The time is kept end to end.

## Steps

1. **The scene document** (`lab/alice/hall.json`, schema `holo-emitter-scene/0.1`). One AI call reads the
   chapter and writes down only what the text establishes:
   - the place, its rooms and their size from the text ("a long, low hall"; "head struck against the roof" at
     nine feet);
   - the openings: doors all round, all locked; the low curtain; the little door about fifteen inches high;
   - the things, each with its quote, where it stands (on the table, under it) and when it comes to exist ("which
     certainly was not here before");
   - the player's sizes;
   - each action and its effect;
   - the goal.

   Every fact carries its quote. Whatever the text leaves open is marked `open`, never invented.
2. **Kinds from the catalogue.** Each thing is matched to an existing kind by noun and role, without AI. A thing
   with no match gets a recipe composed over existing parts (one AI call, counted). Only a shape no part can
   make becomes a new part. The tally goes in RECEIPTS as existing, composed, or new part.
3. **The plan.** A story-hall plan type turns the scene's room into a plan:
   - a long low hall with doors all round, each locked for good, so nothing need lie behind them;
   - the low curtain, the little door and the passage, not much larger than a rat-hole;
   - the garden beyond.

   The hall is built by the same carve, linings, claims and placer as the manor, so checks 17, 19 and 20 hold
   here too. Required things go first (plan §6): the glass table, the key on it, the glass box under it.
4. **Size.** The player's body comes from their size:
   - eye height, the body's half-width, the step, walking speed, and reach (what you can take is below your
     reach);
   - the camera's near plane;
   - the claim grid fine enough for a ten-inch body.

   The bottle sets you small; the cake sets you large, with the roof as a ceiling you stoop under. The little
   door lets you through only at the size that fits it (`reach.js`'s fits, already written for Alice).
5. **Rules and softlocks.** The works layer's gates and rules carry the story:
   - the key opens only the little door;
   - the bottle appears on the table once the little door has been tried;
   - drinking shrinks you; eating the cake makes you grow;
   - going through the little door at the right size is the goal.

   Check 10 runs over sizes as well as keys, so a sequence that strands you is named. Read literally, the chapter
   has one: drink before taking the key and the key is out of reach. The cake makes you large enough to take it,
   but the bottle is finished, so nothing shrinks you again; the book's own way out is the fan in Chapter II. The
   build resolves this with the story's own magic, declared as a rule rather than assumed: the table offers a new
   bottle when you stand at full size or larger, without one, and the little door is unopened by you. The same
   text already says it once: "which certainly was not here before". This is my decision and it can be changed.
6. **The page and the receipts.** `lab/alice/` opens the hall to play on a desktop or a phone. It is timed end to
   end: the AI calls with their time and tokens, then the build from the scene document to walkable. The kinds
   tally goes in `lab/RECEIPTS.md`, and the public site gets a card.

## Decisions taken here (reversible)

- **The rescue bottle.** I chose the story's magic over importing Chapter II's fan (step 5).
- **The ending.** The garden beyond the little door is seen, as Alice sees it, but not entered. Ch. I never
  reaches it, and the outdoors is R46. Going through at ten inches ends the proof with the passage's light.
- **Alice's size.** At full size she stands 1.2 m: a child of about seven (Carroll's Alice Liddell was ten, the
  Alice of the text "seven and a half" in *Through the Looking-Glass*). Small is 10 in (0.254 m), as the text
  says. Large is "more than nine feet" (2.8 m, Ch. II's opening, which the cake causes).
- **The look.** The hall's look is open in the text ("long, low", lamps). Until a Wonderland look is authored,
  the hall wears the c.1660 look's panelling and flags. Tenniel's plates show a panelled hall with a curtain.

## Prior art (a read-only pass, 2026-10-06)

- **Holodeck** (Yang et al. 2024, [arXiv 2312.09067](https://arxiv.org/abs/2312.09067), Apache-2.0). The LLM writes
  only constraints (about ten relations: edge, near, on top of, face to…) and a solver places the things. Asking
  the LLM for coordinates gave collisions and things placed outside the room. Its catalogue is retrieved from
  Objaverse, so it fails when an asset is missing.
  - Adopted: a closed vocabulary of relations, anchors placed first, no coordinates from the AI (our placer
    already works this way).
  - Rejected: its retrieved catalogue (ours is parametric kinds) and its fixed door styles (Alice's door takes
    its size from the text).
- **WordsEye** (Coyne and Sproat). Keeps the senses of "on" and "in" apart: resting on top of, fixed to, hanging
  from, behind.
  - Adopted: the scene's `at.rel`.
- **Inform 7** (Artistic 2.0). Rooms, things, containers, supporters and doors; one parent per thing; actions
  with needs and effects.
  - Adopted: one parent per thing, and actions shaped as needs and effects.
- **LangExtract** (Google, Apache-2.0). Each extraction keeps where it stands in the source; one taken from the
  examples rather than the input is marked ungrounded.
  - Adopted: every `quote` is checked in code to be an exact substring of the text, and a fact whose quote isn't
    is refused. A grounded-or-not flag from the model itself is not trusted.
- **LayoutGPT and SceneCraft.** The LLM writes layouts or Blender code and critiques renders.
  - Rejected: AI at generation.
- **Shrinking the player** (the Unity CharacterController manual; Unreal forum threads, weak sources). Walking
  speed, step height, eye height and reach scale with the body. Keep the near plane inside the body and scale it
  with size. A path grid tuned for a full-size body is too coarse for a small one. Engines with fixed collision
  tolerances fail below about 0.4 scale, hence their advice to scale the world instead.
  - Adopted: the body scaled from one size (eye, half-width, step, head, speed, reach, near plane); the claim
    grid fine enough for the smallest body; checks run at every size.
  - Rejected: scaling the world. Our walker is grid arithmetic with no tolerances to break.
