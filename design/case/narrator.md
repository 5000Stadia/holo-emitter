# The narrator (M7, R58)

`src/make/narrator.js`, pure and deterministic, no model. Test: `node --no-warnings tests/.narrator.mjs` (a stub case, a scripted play, a printed trace). 0.02 ms a turn.

It holds the case's story structure and, from what the player has learned, held, opened and said, works out three things: the **phase** of the story, the **menu** of beats the world can truly offer now, and which one to **stage**. It never invents a fact: a beat is on the menu only if its `when` expression holds in the player's frame, and `apply` refuses a beat that is not true now. The optional model call only picks among the menu and words the pick.

## The model of a story

Taken from construct (`arc/grammar.py`, `conditions.py`, `executor.py`, `cohorts.py`; MIT; read, not run; the clone is at `/home/k/Newproject/construct`):

| Idea | In construct | Here |
| --- | --- | --- |
| Beat | a world-state condition with a weight, never a scripted scene | `beats[]`: `when` expression, `kind`, `weight`, `rung`, `hook`, `effects` |
| Pillar | a cause of the ending; coverage genuine / false / unfilled from the player's frame; a genuine one wins a tie | same; from the clues learned (`effect`, `debunked_by`), or the pillar's own `genuine_via` / `false_via` expression |
| Phase | `setup rising crisis climax falling`, derived from state | `setup rising turn pressure resolution`, derived from pillar coverage, never stored backwards |
| Clock | pre-authored world move that fires on a condition | `clocks[]`: `when`, `effects`, fires once (or `rearm: "repeat"` with a cooldown) |
| Pacing | `navigate()`: turns quiet 3/5/7/9 give rung surface/draw/converge/confront; hold just after a beat | same thresholds (case may set `pacing.thresholds`, `pacing.hold`); plus a `now` rung for beats that react at once |
| Cheap pick | `weave_pick` among prebuilt hook cards, sparingly | `pick()` in code; the model, if present, does the same job |
| Conclusion | the ending as the effect of pillar coverage, not a win/loss | `conclusion()`: solved / right-but-unproven / wrong-case-built / wrong |

Changed: conditions are two-valued (the page's frame is definite; construct's three-valued unknown is not needed); no events spine (the state is the player's frame plus counters, plain JSON, saved with the world); effects are a closed list the world's own rules run.

### Phases
Advance by coverage of the required pillars (covered = genuine or misled, a red herring held as true):
- `setup`: nothing learned. `rising`: a clue learned. `turn`: at least half the required pillars covered. `pressure`: every required pillar covered (the case can land, soundly or not). `resolution`: accused.
- A phase never goes back. A case may override any with an expression under `phases` (`{"turn": "genuine>=2 or turns>=40"}`).
- A beat belongs to its `phase` and every later one.

### Pacing, the rung
`quiet` counts turns since the player last touched the case (learned, took, put, opened, said, accused) or a beat landed. Walking (`enter`) and `idle` do not touch. Quiet 0-2 calm, 3 surface, 5 draw, 7 converge, 9 confront. A beat just landed holds the next `hold` (2) turns.
`pick(menu, quietTurns)`: a `now` beat first (a lie caught is answered at once, never held); otherwise nothing while held; else the beats whose rung the quiet allows, the highest rung first, then weight (required 3, optional 2, flavor 1), then a tie-break from `hash(seed, turn, beat id)`. So the same seed and the same play give the same story; the seed only decides ties. A beat's default rung by kind: arrival surface, discovery draw, lie_exposed converge, pressure confront.
Quiet is how a stalled player is handed pressure: an authored `pressure` beat, `when: "quiet>=9"`, only becomes eligible at the confront rung.

## The condition language (closed)
Text (`and`, `or`, `not`, parentheses; `and` binds tighter than `or`) or JSON (`{"all":[…]}`, `{"any":[…]}`, `{"not":…}`, an array = all). Anything else is refused at parse time, and `checkNarrator` also checks every reference is real.

| Atom | True when |
| --- | --- |
| `learned:CLUE` | the player has learned the clue |
| `holding:THING` | the player holds the thing |
| `opened:ID` | the thing or place has been opened |
| `said:TOPIC`, `said:WHO/TOPIC` | the topic (with that person) has been raised |
| `at:ROOM`, `here:PERSON` | the player is in the room; the person is in the player's room |
| `var:NAME`, `var:NAME=VALUE` | a works variable is truthy / equals (true, false, number, text) |
| `genuine:P`, `misled:P`, `covered:P` | pillar coverage is genuine / false / either |
| `fired:CLOCK`, `done:BEAT`, `revealed:THING` | the clock fired, the beat landed, the thing was revealed |
| `phase:NAME` | the current phase is exactly this |
| `turns>=N`, `quiet>=N`, `learned>=N`, `genuine>=N`, `covered>=N`, `beats>=N` | counters (also `>` `<=` `<` `==`) |

## Effects (closed)
`{type, …}`, validated against the case (people, things, rooms real; no stray keys):
- `spawn_person {id, at}`: a person comes into the house at a room.
- `move_person {id, to}`
- `set_var {name, value}`: boolean, number or text of at most 40 chars.
- `reveal_thing {id}`: a hidden thing becomes findable.
An effect outside the list throws in `apply`. The narrator mirrors each into its own picture so later conditions see it; the page runs it.

## API
```
const n = makeNarrator(kase, { seed, rooms, from })   // from: a saved state(); throws if checkNarrator finds a fault
n.observe(event | [events])  -> { turn, quiet, phase, phaseChanged, fired, rung, due }
n.menu(worldState?)          -> [{ id, kind, seed, effects, rung, weight, phase }]   (≤5; best first)
n.pick(menu, quietTurns?)    -> beat {…, line} | null     (null: let it breathe)
n.apply(beat | id)           -> effects[]                 (commit: done, quiet reset; refuses a beat not true now)
n.step(worldState?)          -> { beat: {id, line, effects}, effects, kind, rung } | null     (menu + pick + apply)
n.phase()  n.coverage()  n.conclusion()  n.state()  n.rung()
n.callInput(menu) / n.accept(reply, menu, { lexicon, allowed })     // the optional model call, below
parseExpr(src) evalExpr(ast, frame) atomsOf(ast) checkNarrator(kase, { rooms }) EFFECTS PHASES
```
`observe` events (an array is one turn: a question gives `say` and `learn` together). One turn per call, except `var` and `sync`:
`{type:"enter", room}`, `{type:"learn", clue}`, `{type:"take"|"put", thing}`, `{type:"open", id}`, `{type:"say", who, topic, act}`, `{type:"accuse", who}`, `{type:"idle"}` (a page tick when the player does nothing, say every 20 s), `{type:"var", name, value}`, `{type:"sync", learned, held, opened, said, vars, at, people}`.
`fired` lists clocks that fired this turn, each `{id:"clock:x", kind:"clock", line, effects}`; their effects are already committed in the narrator and the page must run them like a beat's. `due` says a menu beat is eligible this turn.

### The optional model call (the "beat" job, `voice.beat`)
`callInput(menu)` is `{backbone:{theme, shape, phase, covered, of}, menu:[{id, kind, seed}] (≤5), quiet_turns}`. The reply `{pick, line}` goes through `accept(reply, menu, {lexicon, allowed})`: the pick must be on the menu, the line 1-40 words with no braces, and (with a lexicon) name no one outside the seed and `allowed` (talk.js `truthCheck`). `accept` returns a beat with the model's line, or `null`: then the page uses `pick()` and the beat's own `hook`. The model never sees effects and cannot add one.

## How it plugs into the manor page
1. Build once: `const narr = makeNarrator(kase, { seed, rooms: plan.rooms.map(r => r.id), from: saved?.narrator })`. Save `narr.state()` beside the world's store (it is plain JSON).
2. Observe, from the places that already know:
   - `works.js` `act`/`take`/`put` (their result and the thing's `clue`/id): `take`, `put`, `open`, and a `learn` for a thing's `clue`; the page's `say`/`setVar` hooks give `var` events.
   - `talk.js` `answer(...)`: `{type:"say", who, topic, act}` plus a `learn` per id in `learned`. Send both in one array.
   - room changes (the walk): `enter`. A 20 s interval with no input: `idle`.
   - the accusation: `accuse`.
3. After each `observe`: run `r.fired` effects, then `if (r.due) { const m = narr.menu(); const b = (await voiceBeat(narr.callInput(m)).then(x => narr.accept(x, m, …))) ?? narr.pick(m); if (b) run(narr.apply(b)); say(b.line) }`. With no model it is `narr.step()`.
4. Run an effect as the world's own rules: `set_var` is `store["$"+name] = value` then `works.settle()`; a case rule can then fire on it. `reveal_thing` sets `store["$revealed."+id] = true`; a hidden thing carries `take.requires: {"$revealed.ID": true}` and is shown (node visible) only when set, so it is found by the world's rules, not placed by the narrator. `spawn_person` / `move_person` create or move a `presence.js` bust at the room's stand point.
5. Fair play stays case.js's job (`fairPlay`): a `reveal_thing` must only reveal what the case already lists; a beat cannot make an unreachable clue reachable. Run `fairPlay` with the beats' reveals treated as keys if a clue depends on one.

## What the case JSON must provide
Everything case.js has, and:
- `pillars[]` with `id`, `required` (default true); clues with `pillar`, `effect` (genuine default / false / context), `debunked_by`. Optional `genuine_via`, `false_via` on a pillar.
- `cast[].home`, and `arrives: true` (or `presence: "offscene"`) for anyone not in the house at the start.
- `things[]` with `id` (hidden ones reachable only via a beat's `reveal_thing`).
- `topics[]` (so `said:` is checked).
- `beats[]`: `{id, kind: arrival|discovery|lie_exposed|pressure, phase, weight, rung?, when, unless?, hook (≤40 words, the no-model line), seed?, effects[]}`. `unless` closes a beat for good once it holds (construct's `unreachable_if`).
- `clocks[]`: `{id, when, effects[], line?, rearm?, cooldown?}`.
- optional `theme`, `shape` (go to the model call), `phases`, `pacing`.
`checkNarrator(kase, {rooms})` returns `{ok, findings, warnings}`: unknown keys, missing clues/pillars/topics/people/rooms/things, effects outside the list, hooks over 40 words, beats that contradict themselves.

## Not done here
The page wiring (steps 2-4), the relay call, the case's real beats (R56/R59). Two numbers are guesses to tune in play: the rung thresholds (construct's own provisional values) and `hold` = 2.
