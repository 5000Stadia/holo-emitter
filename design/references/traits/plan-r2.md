# R79 revised plan (round two), 2026-10-13

Kabe accepted all four first-round points (gate g39da38). He also placed beats with pattern-buffer and construct (gae5acb, design/one-world/beats.md):
- **No sibling project.** holo-emitter builds the mechanisms and a place's reachability proof.
- **construct** writes and composes beats and puzzle chains, and proves them solvable.
- **pattern-buffer** ingests beats and tracks them in an author-side frame (its R53). A character's or narrator's reads go through that character's frame, which never reaches beats or events they did not witness ("We don't want watson to just 'know' who did it").
- **The phone** gets mechanism answers only, in plain text. Kabe: "if were encrypting things and stuff thats silly".

## Slices, in order

**S1. The world decides, the picture follows (P1).**
- A thing's state comes from works' store (later pattern-buffer's view document). An `emits` characteristic turns that state into an emitter descriptor: room, position, colour, strength by state.
- lightpool.js consumes descriptors, never reads `light.intensity` back, and `alight` reads the descriptor.
- An animation only eases the picture towards the descriptor.
- Proof: with the 2026-10-13 candle fix reverted, every light-giving kind's proof fails.

**S2. A closed characteristic registry, compiled at defineKind (P2).**
- `defineCharacteristic({ name, needs, provides, defaults(period), conflicts, states, compile })`.
- A kind lists characteristics and categories. A category is just a named set ("flame-lit" = emits + burns-down + flicker).
- defineKind resolves them once into a manifest:
  - each value records its provenance ("light: from flame-lit, period 1660 default");
  - missing needs that have period defaults are filled and flagged;
  - only contradictions and needs that have no default are refused, with the reason.
- It compiles to the existing affordances/processes/rules (works.js). There is no second runtime, and existing `traits` move into the registry.
- For a model-made kind, the model supplies only what code can't: which characteristics, anchor points and a few numbers.

**S3. Proofs at three levels.**
- **Per characteristic, once per build:** pure and simulated-clock. Within N frames, a lit source raises the light at a stated point by a stated amount (lightpool.js is pure).
- **Per kind, at defineKind:** step through its states and check that each characteristic's promise holds in each state. This takes milliseconds.
- **One browser contract scene per renderer path:** candle-lights.spec stays as that scene.

**S4. Promises within the phone's budget, tested in a crowd (P3).**
- Each emitting characteristic declares what it gives outside the fire pool's 3 slots (4 in story): a glow on its own surface plus a share of a grouped light, as the window pool already does.
- The crowd proof: 40 emitters in one room on the phone tier. Every one shows its state, and the frame stays within budget (13 ms manor, 20 ms total).

**S5. Links as typed facts with a reachability proof (P4).**
- Kinds expose ports: a switch has an output, a lamp an enable input, a lock an authorise input, a keypad a code input and an output.
- A link is an edge in the place document (later a pattern-buffer fact): `{ type, from: port, to: port }`. Link types form a closed family: switch→light, key→lock, code→keypad→lock, breaker→circuit, lever, plate. Each declares:
  - valid endpoints;
  - multiplicity;
  - reversibility (one-way: taken, unlocked, learned; reversible: lever, breaker, plate);
  - its placement rule (a switch by the door, latch side).
- Knowing a code works like holding an item (`@knows`, alongside `@holding`).
- **The graph half,** checked when the place is planned: every light has a reachable control, no control drives nothing, and every key and code can be reached without passing its own lock. It extends `reach.js` `reachability()` (doors and keys already) to a monotone fixpoint over one-way links. Reversible links are confined to one room, with a bound on their states.
- **The placement half,** checked per room when the room is built.
- **The phone** receives each link as a mechanism answer (act → world effect), applied at once and confirmed by the feed.
- Puzzle solvability over beats is not R79's; it belongs to construct, over pattern-buffer's graph read.

**S6. A modern-era witness:** a room with a wall switch across from its ceiling light, and a keypad door. It proves S1–S5 end to end, before R66's kinds are made under the registry.

## Not in R79
- Beats and their solvability: construct and pattern-buffer.
- Encryption or hashing.
- Vendoring pattern-buffer's js module: links stay in the place document until the manor's state comes from pattern-buffer, so they are written in the shape pattern-buffer will take.
