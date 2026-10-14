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

## After round two (consult ca953d5): what changes

Both reviewers found the direction sound. Every finding holds up against the code, so each one is taken.

1. **Defaults and the pin.**
   - defineKind fills only structure (which characteristics, ports and states) and pins the resolved manifest, not the author's raw input. Change a characteristic's default and every kind using it gets a new pin, so saved worlds can't load different candles under an old key.
   - Colour and strength come from the look when the place is built, the way material roles already work, because kinds belong to no period.
   - The candlestick part stops setting its own light strength and colour. The look does that, so there is one source.
   - Checks: change a default and the pins change; one candle built under two looks gives two manifests.
2. **The registry is closed by parts.** A part declares the characteristics it implies (a flame implies `emits`). A kind made of a candlestick with no `emits` is filled and flagged, never passed quietly.
   - Check: register a candlestick kind without `emits`.
3. **The proofs move to authoring time.** The per-kind state proof runs where `audit.js` runs (at authoring, in the kept tables and tests), never on page load: catalogue.js stays pure, and a kind may arrive before its parts. defineKind only resolves.
4. **The browser contract is generated:** every emitting manifest, on each renderer path, and the 40-emitter phone tier, each measured against its declared tier promise (in a pool slot, or a glow plus a share). With the dirty-update fix reverted, they must fail.
5. **The phone budget is counted, not timed:** lights in the pool, no new `renderer.info.programs`, and the draw-call count. Milliseconds on a test machine say nothing about a phone.
6. **Links: what breaks the fixpoint is a held state, not reversibility.**
   - A breaker may feed other rooms ("power back on downstairs opens a door upstairs").
   - Each link declares whether its effect latches (a lever, a breaker: it stays until changed) or is held (a plate: only while something presses it).
   - Latching links join the monotone fixpoint as one-way facts within one search over the breaker's states, bounded per place.
   - A held link opens its target only for something that stays there. For one player that means a weight they can leave, never themselves.
   - Checks: a plate-held doorway is unreachable alone; a latching lever on the same doorway is reachable.
7. **Which codes R79 proves:** codes found in the place (a note in a drawer, digits on a portrait) are items with a room and are proved here. Codes a person knows are beats, and construct proves those.

## Closure criteria (codex's independent review, 2026-10-13: `~/.config/colony/agents/holo-emitter-codex/r79-review-2026-10-13.md`)

No reset; four points to meet before S2 and S5 are called landed. Codex re-checks each once it lands.
1. **Parts declare their own implications.** `gives-light` still names candlestick, flame and bulb in its own table, and `definePart` carries no characteristic contract, so a new emitting part could slip past. Move the implication onto the part (item 2 above). **Met 2026-10-13:** each part's contract (`src/make/parts/contracts.js`) is pure data, so kinds still resolve before any part's code (which needs THREE) loads, the same way in node and on the page. The characteristic reads the property (`fromPart: "emits"`), and check 33 proves every built kind's lights match what its parts say. Pins are unchanged.
   - **Codex's recheck, F1:** the proof compared the whole kind's groups, so a second, undeclared light in the flame's group hid behind the candlestick, and a light with no group went unchecked.
   - **The fix:** `build.js` marks each object a part adds with the part that made it (`madeBy`). Each light is then held to its own part's contract: no part, no group, or a group its part doesn't emit is a fault.
   - **Also required:** each declaring part makes something in its group, and each group the kind emits gives at least one actual light. A branched candlestick's outer flames are drawn and share one light.
   - Codex's planted faults are now in check 33 itself.
2. **Typed ports, run in ordinary place planning.** The link predicates accept any affordance (a lever or plate drives anything; a switch is any non-light), and `checkLinks`/`linkKeys` are called only from the object page and tests. Land the port contract and the planner's call together. **Met 2026-10-13, for the place's proof:**
   - An affordance says what it carries, `port: "out:power"` or `"in:bolt"`, from a closed family of signals (power, bolt, press). The catalogue refuses anything else.
   - Each link type names the signal at each of its ends, and a door's lock can be a link's far end. The kind-level `controls` is gone: an unwired out port (a switch that works nothing) and an unwired in port (a light nothing can work) are both faults.
   - A case's links are checked in `checkCase` against its kinds' ports, and played in `fairPlay`'s rounds. So a place's links are proved where its doors and keys are, by `tools/check-case.mjs` and on the page.
   - No place has links yet: the first is S6's witness room.
3. **A held plate proved with a real weight:** a named, movable, reachable weight passes, and a missing, unreachable or player-only weight is refused (today any truthy `weight` passes). **Met 2026-10-13:**
   - The weight must be a thing of the place that can be carried (a fixed anvil can't) and that the player can get to. `player`, or no weight, is refused.
   - `linkReach` runs to a fixpoint, so a strongbox got from a cellar that a lever opens can hold a plate down. In a case, the weight counts once it is in hand.
   - Check 35 covers both the cases that pass and those that are refused.
   - **Codex's recheck of points 2 and 3 found five more holes, all fixed:**
     - **F2:** with no links, the port audit was skipped. It now always runs.
     - **F3:** a case's weight was judged by the case's own carry flag. It now has to pass the engine's own takeability rule, as play does: a gateleg table can't be a weight, and fairPlay doesn't take it.
     - **F4:** a control's own gate was dropped. A link now takes effect only once its control can be worked: its `@holding` is met by what is in hand, matched the way works.js matches. A gate the proof can't follow grants nothing and is reported. A control whose kind the proof can't see grants nothing.
     - **F5:** one weight was counted on two plates. A weight now lies on one plate, and naming it for two is a fault. A weight that is also wanted in hand (a key, or something a gate asks to be held) is a fault too.
     - **F6:** links into one input were counted by spelling. They are now counted by the thing they resolve to.
   - Codex's fixtures are check 37.
   - **Codex's second recheck closed F2 and F6.** Three narrower variants of F3–F5 remained, all of the same kind: the proof read a thing differently from how play does. All three are fixed:
     - **F3:** takeability is judged from the thing's own case settings (`caseSettings`, now in case.js, which play also uses). Every setting the case leaves to the seed is tried at each end of its range or choice, so no birth can make it too big.
     - **F4:** a key's fitted name (`key: "study_key"` → `fits`) is read the way the engine reads it.
     - **F5:** a weight laid on a plate whose room is reached is out of your hands: no gate counts it as held, and it is not a key. A latching control, once worked, stays worked. A weight that any thing's affordance or taking asks to be held (`@holding`) is a fault.
   - All three are in check 37, alongside the valid single-plate and fitted-key routes.
   - **Codex's third recheck closed F4 and F5, and point 2's slice.** One F3 hole remained: testing a range at its ends bounds nothing, because a size like `=0.2+2*u*(1-u)` is widest in the middle.
     - **The fix:** when a size reads a setting the case leaves to the seed, only the actual birth can answer.
     - A thing kept inside another case thing is born at `case/<id>`, so its birth is known and is used.
     - A thing placed in a room is born where the placer puts it, which the proof can't know, so it is not certified. checkCase says which setting to pin.
     - **Codex's fourth recheck:** being kept inside another case thing doesn't fix a thing's birth either. The placer builds what a case requires at its own address, and the `case/<id>` fallback comes only after that. So any size that reads an unpinned setting is not certified, wherever the thing is, until the case pins the setting.
4. **S2 stays "begun"** until categories and the look's per-period manifest exist, so that kinds made meanwhile don't set into the temporary shape.
