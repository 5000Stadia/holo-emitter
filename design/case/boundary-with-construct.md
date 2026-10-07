# holo-emitter and construct: where the line falls (2026-10-07)

Kabe, 2026-10-07: "a lot of the legwork for narrative that is open-ended has been done by construct itself … there is a clean focus for you too. Perfect the programmatic space while the dynamic narrative from an LLM call probably should be improved and shaped by that project."

construct (Construct Projector, codename Holodeck; `~/Newproject`, mirrored at 5000Stadia/construct) is a text holodeck. It hosts over pattern-buffer's engine (porcelain: ingest, snapshot, ask, materialize, resolve) and has its own arc layer, pacing, voices, model provider, and its own team of agents (c, Kernos CC, PB, the reviewer). It is design-first.

## What each owns

| | holo-emitter (the projector of space) | construct, over pattern-buffer (the narrative) |
|---|---|---|
| **Truth** | its world document: what was built, what you changed; things' states; sealed places | the story's truth: entities and assertions, knowledge frames, as-of time |
| **Making** | places from descriptions (plans, kinds, looks), placed by rules; everything that works; checked at generation (sound, reachable, fair, no faces that fight) | the world read from a book or an interview, the arc and its destinations, the cast and its secrets |
| **Play** | walking, reaching, sizes, doors, locks, keys, light; clues as things; presences; the panel as a surface to speak through | each turn's narration, character lines and beats; pacing; what happens next |
| **Models** | none in the world or its picture | its own provider, prompts, budgets and checks |
| **Without a model** | plays fully: topics, the case's own lines, a code narrator as a stand-in | (its own story) |

## The contract (proposed, to shape with construct's agent)

All of it is JSON, with closed vocabularies in both directions:

- **World in (construct → holo-emitter), once per place, then as it changes:**
  - places, kinds of things, people;
  - the things the story needs placed, with their clue or role;
  - knowledge frames per person, so what a projection may show is never more than they know.
- **Events out (holo-emitter → construct), each turn:**
  - where you are;
  - who is present;
  - what you opened, took, read, put down;
  - what you said (a topic and stance, or your words), what you showed, whom you accused.
- **Beats in (construct → holo-emitter):**
  - narration;
  - a character's line, with the facts it used;
  - world changes as effects from a closed list (`spawn_person`, `move_person`, `set_var`, `reveal_thing`, open or lock something, give or take something). holo-emitter runs them by its own rules and refuses anything else.

## What this changes in holo-emitter's M7

- **Fully holo-emitter's, to perfect:**
  - the house;
  - clues as things that work;
  - presences;
  - the panel;
  - the fair-play check (`src/make/case.js`);
  - the code's own reading of your words (`intent.js`);
  - truth checks on any line put on screen (`talk.js` `truthCheck`);
  - the accusation's group confirmation;
  - performance on a phone.
- **Stand-ins, not rivals:**
  - `src/make/narrator.js` and `talk.js`'s answers, plus the dev relay (`tools/model-relay.mjs`), are the no-model path and the test harness.
  - The live narrator and voices are construct's, over the contract.
  - holo-emitter stops growing its own narrative logic beyond what the no-model play needs.
- **R58 becomes:** construct's narrator over the contract, holo-emitter's code narrator kept as the offline stand-in.
