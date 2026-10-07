# Vision revision, draft for Kabe (2026-10-07)

Kabe's words:
- "the final product that I could imagine would be live narrative engine … construct … combined with … pattern buffer … combined with this project. The user and the narrator crafted a world that maintains the narrators connection and vision to the core plot elements which serve as a thematic backbone and seed to the unfolding data that is produced in pattern buffer [and] any engaging visual render that is produced by holoemitter, all this happens auto magically elegantly, and in a way that produces a unique procedural generation experience"
- "maintain as much of our development structure and the programmatic without an AI call as possible as you have been … it will only make the structure optimally efficient"
- "who makes the LLM calls is a question that we need answered"
- "if you play as Sherlock Holmes, you can literally interrogate NPC in a conversation. I like that"

## Proposed changes to `## Vision` (additions in bold; the rest unchanged)

**holo-emitter: walk into any place, and it's there.**

(The first two paragraphs stay as they are.)

**Where it is going: a live narrative engine.** Three projects make it:
- **construct** is the narrator. With the player it crafts the story, and it keeps hold of the core plot elements: the thematic backbone and the seed of everything that unfolds.
- **pattern-buffer** holds the world's truth as it unfolds from that seed.
- **holo-emitter** makes that truth a place you stand in.

It happens by itself, and every telling is a world of its own. Play Sherlock Holmes and you can question a suspect in your own words. What they know and what they hide is held in the world's truth. A language model only gives it a voice.

Fundamentals every milestone keeps:
- **It must feel like standing somewhere.** Nothing reads as a sticker, a kit or a diagram.
- **The document is the truth.** The picture never lies about it, and changes only through the world's own rules.
- **Places come from descriptions.** No hand-made assets per place. Each look is authored once for its period and place. After that, building a place costs seconds and no AI calls.
- **Code first; language models only where only language will do.**
  - Everything that can be rules, data or arithmetic is: building, placing, checking, the world's rules.
  - A model may read a text into data, write a new kind's recipe ahead of need, choose a story's next beat, or voice a character. It never holds a fact the world doesn't.
  - Each of these calls is as narrow, rare and checkable as it can be made, so a small, cheap or local model can carry it.
  - The world still plays with no model at all.
- **It's ready for the family.** pattern-buffer supplies the truth and construct the drama; holo-emitter projects them.

## What it changes in practice (for Kabe's eye, not part of the Vision text)

- **The rule "no AI during play" becomes "no AI in the world's truth or its picture".**
  - A narrator and character voices may run live, at the pace of the story, never the frame.
  - Building and rendering stay free of any model.
- **"Who makes the calls" becomes a design target, not a blocker.** The aim is a narrator and voices narrow enough for a small local model. Then a player needs no subscription and the publisher pays nothing per player. A stronger model stays optional, with the player's own key.
- **Measured, not hoped:**
  - an ingestion bench (Alice);
  - later, a narrator bench and a voice bench, run on cheap and local models and scored by our own checks.
