# holo-emitter: player-facing mechanics and world systems (2026-10-11)

Read-only inventory. Generality key: **AS IS** = another genre could use it unchanged; **DATA** = reusable by writing new data (kinds, case JSON, looks, rules); **NO** = written for this case, period or bench.

The playable host is `lab/manor/index.html` (898 lines). It wires everything below through `?case=case-1660`, `?plan=alice-hall` and `?plan=banqueting`. The engine lives in `src/make/` (pure modules plus three.js builders).

## 1. Body and movement

| Mechanic | What it does | General? | Where |
|---|---|---|---|
| Walking and collision | You stand on a floor, tread or landing within a 0.45 m step. You are kept a body's half-width off walls and furniture, and pass a doorway only while its door is open. A flight overhead stops you where headroom runs out. The same walker drives the reach and soundness checks. | AS IS (body size is a parameter, so Alice shrinks) | `src/make/walk.js`, claim grid `src/make/claims.js` |
| Stairs | Walk into a flight and you climb it: the surface height comes from the stair's geometry. | AS IS | `src/make/plans/stairs.js` |
| Stride | Shift on desktop. On a phone, pushing the stick to its edge strides, and a "stride lock" keeps you moving. | AS IS | `lab/manor/index.html` ~847, `lab/touch.js` |
| Crouch | C, Ctrl or a thumb button. It only lowers the eye to 55% and halves your pace: collision and headroom do not change, so you cannot crawl under anything. | AS IS, but shallow | manor page 472-475 |
| Tap- or double-click-to-go | Walks you to a thing, a person, a stair or an open doorway, and on through it. | AS IS | manor page (`goNear`, `tapAt`) |
| Door assist (touch) | Steers you onto a doorway's middle, and a shut door opens when you walk into it. | AS IS | `lab/touch.js` `doorAssist` |
| Outdoor walker | Walking on a terrain height function, stopped by the hillside's walls, hedges, gates and trunks, and by the forecourt's railings. | AS IS | `src/make/terrain.js` (`makeOutdoorWalk`), `hillside.js`, `forecourt.js` (`blocked`) |
| Street walker | Walking on the street's height, kept out of houses, posts and stall boards. | AS IS | `lab/scale/street.html` with `street.js` `blocked()` |
| Body by size | Your height, eye, reach and pace follow `$size`. A doorway refuses you if you are too tall for it. | DATA | `src/make/story-play.js`, `reach.js` |
| Missing | Jump, climb or ledge, ladders, swimming, falling or damage, physics pushing, sitting or lying, vehicles or mounts. | | |

## 2. Use and interact (`src/make/works.js`, 320 lines: the core verb layer)

- **One affordance model.** Every thing has affordances: `slide`, `hinge`, `lever` (springs back), `switch` (lit/out), or `state` (no visible motion). Each has two states, verbs and an eased motion, and drawers can come in banks with labels. A thing's start state comes from place data (`settings.start`) and is checked when the thing is added. **DATA:** genre-neutral.
- **Gates.** An affordance can require another affordance's state, a variable (`$x`), or something held (`@holding`: matched by id, story id, kind, family or `fits`). A list means any of them; `@holding_all` means all of them. An `auto` lock is done on the way, so trying a locked door while holding its key unlocks and opens it. There are also `release` gates (a gate-leg won't fold while it bears weight) and one-way deeds (a letter read stays read). **DATA.**
- **Rules.** `when` takes count, var, thing state or holding, combined by all/any; `then` sets variables or puts a thing in a state, and rules chain. Example: light three candles and a door unlocks (`lab/brief/object.html?o=puzzle`). **DATA:** a general puzzle and trigger language.
- **Processes over time.** Levels are worked out from the start time on the real clock (`Date.now`), with phases and rates, and drive movers (a candle burns down, a bottle drains). **DATA.**
- **Containment.** A thing inside a drawer or under a lid can't be aimed at or taken while that is shut, and nesting is followed (a box in a chest). **AS IS.**
- **Aiming and cues.** A forgiving ring raycast, with a cursor that says act, take, locked, talk or look. `lab/ui/cues.js`, manor page ~606-704. **AS IS.**
- **Kinds that work today** (55+, in `src/make/kinds/*.js`; parts in `src/make/parts/`):
  - doors: panelled, and boarded iron-bound with a lock and key
  - forecourt iron gates, and field five-bar gates (hillside)
  - drawers: the muniment table, evidence press, drawing table, japanned cabinet
  - lids: chests, the powdering tub, oak box, tankard, glass box
  - cupboard, press and bed-curtain leaves
  - shutters (splay pair)
  - lights: candle stub, candle in candlestick, sconce, branched candlestick, rushlight, stair lantern, hanging lamp (Alice)
  - hogshead tap (lever)
  - kitchen jack or spit (turning)
  - spinning wheel (turning)
  - cradle (rocks)
  - bread oven door, kneading trough
  - globe (turns)
  - letters bundle and engrossed deed (read)
  - Alice's DRINK ME bottle (drains) and EAT ME cake (eaten)
  - low curtain (draws)
  - Inert: the lantern clock (no hands driven), bodies laid out or abed, books and shelving.
- **Missing.** Breaking or forcing, picking locks, combining items, tools used on things, fluids or containers as quantities (beyond Alice's drain), placing anywhere (put-down only onto a `top` slot), throwing, pushing or moving furniture, and any NPC using affordances.

## 3. Take, carry, inventory

- **Take and put.** `works.take` and `works.put`. What you hold is stored as `@held` and kept in the world document as `held_by: player` relations. Put-down only works onto a surface with a `top` slot. **AS IS.**
- **No inventory UI in the 3D manor.** Held things appear only as "thing" cards in the talk panel's evidence drawer. `src/inventory.js` is the M1 strip for the painted placeholder demo (`index.html`), not used in the manor. There is no weight, slots, equip, use-from-inventory, inspect-in-hand or give-to-NPC.

## 4. Case layer (M7)

| Mechanic | What it does | General? | Where |
|---|---|---|---|
| Case as data | Premise, cast, things, clues, papers, pillars, leads, beats, clocks, accusation and endings, all in JSON. Checked by `checkCase` and `fairPlay`: every pillar reachable, no key only behind its own door. | DATA (investigation-shaped) | `src/make/case.js`, `lab/case/case-1660.json`, `src/make/reach.js` |
| Clues from things | Opening, taking, reading or looking at a case thing learns its clue. It says what an opened thing holds. A thing of the same kind that isn't the case's says "Not X". | DATA | `src/make/case-play.js` `afterAct`, `look` |
| Reading documents | A paper opens in the reader overlay (title, hand, sheets), marking the clues it noted. A paper read before reopens as it was. | DATA | `case-play.js` `openPaper`, `lab/ui/talk-panel.js` `openReader` |
| Case book or notebook | Leads (open questions in the Justice's words, with whom to ask and where they are now, and a hint ladder). People as a court record: where each is, claims heard, claims broken and by what. Clues, contradictions and papers. A brass dot marks something new. | DATA | `src/make/leads.js`, `case-play.js` `notebookView`, `talk-panel.js` `openNotebook` |
| Evidence | The clues learned and things held, shown on a topic. A lie breaks only on its own breakers. The wrong evidence makes the suspect guarded for a few turns. | DATA | `src/make/talk.js`, talk panel drawer |
| Talking to suspects | Topic chips (six at a time, the rest under More…, with dry and retired marks) and the stances Ask, Press, Show and Accuse. The answer acts (tell, deflect, refuse, lie, dontknow, guarded, again) are decided in code from each person's knowledge frame. Each person keeps their own "threads" between questions. | DATA (topic/frame Q&A for any genre) | `src/make/talk.js`, `lab/ui/talk-panel.js` |
| Your own words | Free text is read to a topic, stance and evidence with no model (Façade-style templates, about 0.1 ms). The relay's read call is used only when the reading is unsure, and topic chips are the fallback. | DATA | `src/make/intent.js`, `src/make/voice.js`, `tools/model-relay.mjs` |
| Suspect voice | Optional model voicing, with a truth check (no entity or fact it wasn't handed). Otherwise the case's own lines. Text only: no audio. | AS IS | `src/make/voice.js` |
| Accusation | Groups of blanks (who, means, motive…) confirmed one group at a time. Options appear only once their clue is learned. Rebuttals for wrong picks. The verdict carries the play's receipts. | DATA (any "solve" ending) | `case-play.js` `openAccusation`, `accuse` |
| Narrator | Pure and deterministic, ported in idea from construct: five phases advanced by pillar coverage, beats as world conditions with weights, clocks, and pacing rungs. Its effects are a closed list: `spawn_person`, `move_person`, `set_var`, `reveal_thing`. An optional model picks and words a beat. A minute idle counts as a quiet turn. | DATA (genre-neutral structure, small effect list) | `src/make/narrator.js` |
| Bridge to construct | Dev-only live bridge: events go out, re-authored decks are merged in. | AS IS | `src/make/bridge.js` |
| Persistence | The world document (pattern-buffer-shaped assertions; rooms sealed when first seen) and the case snapshot (notebook, frame, narrator, your position) in localStorage, saved on pagehide. | AS IS | `src/make/world.js`, manor page |

## 5. People

- **Presences.** A painted bust on a holodeck disc and beam that turns to face you and shimmers. You aim at it to talk. People are placed on open floor, clear of hearths and of each other. Narrator effects re-place them instantly: they teleport, never walk. **DATA.** `src/make/presence.js`, manor page ~386-409.
- **Portraits.** Procedural Lely-style busts from a `look` (sex, age, build, face, hair, dress, expression), painted in a worker. **DATA,** but 1660-styled. `src/make/sitter.js`, `sitter-worker.js`.
- **Missing.** 3D bodies, animation, walking, schedules, NPCs reacting to you or to the world (seeing, hearing, following), crowds, and an NPC acting on things. This is M8 (R60-R64).

## 6. Light, fire, time, sound

- **Light by state.** A lamp lit or put out changes the room's light. Fixed pools of lights are handed round what is in view, ranked by what each gives where you stand, with fades, so nothing recompiles. **AS IS.** `src/make/lightpool.js`, `works.js` `apply` (`lights` group), manor page ~219-266.
- **Fires.** A hearth is lit or not by its room type, fixed at build: there is no affordance to light or quench one. Flames flicker. `src/make/manor.js` ~271, ~407.
- **Bounce light.** A probe grid per light group exists (`src/make/light.js`) but the manor doesn't use it yet (R68).
- **Time of day.** The manor's sun is fixed, with its shadow drawn once. The night bench (`lab/fps/night.html`) has an hour slider and `[ ]`: sun or moon as the one key light, a sky with sun disc, moon and stars, fog, exposure, and lamps lit from dusk to dawn. It also has light tiers (far points, then grid, then real lights). The bench is not wired into any place. The case's "hour" is a text variable set by narrator clocks (ten, eleven, half past eleven, noon), driven by learned/turn counts, not by a running clock. Processes use real seconds.
- **Sound.** None. There is no Web Audio anywhere outside the Godot bench (`src/make/sound.js` is geometric soundness, not audio). Voice is text, and a voice slot is reserved in R61.

## 7. Places and outdoors

- **Manor from plan.** The program of a c.1660 house becomes a hybrid E-plan, and each room is built by its type. Visibility runs through open doorways. **DATA** per period. `src/make/manor.js`, `plans/hybrid-e.js`, `rooms/england-1660.js`, `programs/`.
- **Other plans.** An octagonal banqueting house (`plans/banqueting.js`). Alice's hall from book text (`plans/story-hall.js`, `story.js`, `story-play.js`): size changes, things that appear later, softlock rescue by story magic.
- **Placement.** Kinds declare anchor, musts and prefers. The story's required things are placed first, inside what holds them. Passage checks keep exits connected. **DATA.** `src/make/place.js`, `passage.js`, `claims.js`, `plan-checks.js`.
- **Influences.** Owner, purpose or household bend what a place holds, and provenance travels with items. **DATA.** `src/make/influence.js`, `influences/england-1660.js`.
- **Outside.** Roofs, gables, stacks and glazing (`exterior.js`). Deterministic terrain on a levelled pad (`terrain.js`, `terrain-mesh.js`). Fields with ridge and furrow, dry-stone walls, hedges, five-bar gates and trees with impostors (`fields.js`, `hillside.js`; `lab/scale/hillside.html`). The forecourt wall, piers and working gates (`forecourt.js`).
- **London street c.1660.** Shape-grammar lots (jettied shops, inns, entries, lanes), backs, and a city beyond. Walkable, but with no interiors and no people. **DATA** (rules per period). `src/make/street.js`, `lab/scale/street.html`.
- **Packs.** The M1-M3 painted, facing-based places (manor, office, cyberpunk, hospital, underground, liner, probe) are data folders read by the old painted engine. They are a different engine from `src/make`. `packs/`, `index.html`, `src/harness.js` (turn/toggle/take/go intents, narration envelopes).
- **Holodeck grid.** A part not yet made stands as grid at its size (`catalogue.js`). Places stay isolated demos with no streaming between them (R46, held).
- **Benches.** fps lab (three.js WebGPU/WebGL 2 against Godot) in `lab/fps/`. Night lights in `lab/fps/night.html`. Perf card and `?bench` walk in `src/make/perfcard.js`. Forest scale in `lab/scale/forest.html`. Device bench in `lab/bench/`. Title stills in `tools/title-stills.mjs`.

## 8. What's planned (ROADMAP.md)

- **Still open in M6–M7:**
  - R46: the remaining work on looks, seams and streaming. Joining places is held for Kabe's framework.
  - R50: the fps lab.
  - R58: the narrator via construct.
  - R59: the case played for 30–60 minutes on a phone.
  - R65: load time.
- **M8 People from place:**
  - R60: a side-by-side trial (3D Daniel against his bust, a child, a far-future soldier, 300 walkers on a phone).
  - R61: the builder (genes, age curve, build, wardrobe, inheritance, movement from age and build, an empty voice slot).
  - R62: who is in a place at an hour (households, errands, rank, uniqueness).
  - R63: 1660 wardrobe, plus one other setting.
  - R64: the suspects and the street peopled.
- **M9 The look filled:**
  - R66: lived-in rooms.
  - R67: windows seen from outside.
  - R68: bounce light, and the three light tiers.
  - R69: grass and ground cover, fire and sky.
- **Later:**
  - R52: the warehouse benchmark.
  - R53: textures.
  - R36–R38: the catalogue project, a GPU mesh model, the wants solver.
  - R39: light as a layer.
  - R40: the speaker layer and iOS fullscreen.
  - R42: the coaching inn.
  - R4–R6, R14, R16–R18, R22, R30, R32–R34, R41: painted-era and acceptance leftovers.
- **Nothing planned:** no item covers sound or audio (beyond R40's "speaker layer"), combat, a player character, a world clock in places, or any genre other than the case.

## 9. Gaps a range of fiction would need from a physical world

- **All genres:**
  - Sound: ambience, footsteps by surface, doors, fire, spatial cues, and voice audio.
  - A running world clock with day and night in places: the night bench's hour, wired to the manor and street, and to light, NPC schedules and events.
  - NPCs as bodies that move, path and act on affordances (open doors, carry, sit). Perception: what they see and hear of you.
  - A visible inventory, with inspect, use-on, give and combine.
  - Put-down anywhere, and move or carry furniture.
  - Saved games beyond one slot.
  - More body verbs: jump, climb, ladders, sit and lie, a real crouch with a low body.
  - Places joined: streaming, travel between packages, exteriors to interiors on the street.
- **Investigation:**
  - Forensic looks (inspect up close, compare two items).
  - Following or watching people, and timelines of who was where.
  - Eavesdropping, which needs sound and NPC talk to each other.
- **Romance and dating:**
  - Relationship state per person (affinity, trust, memory of what you did) that persists beyond topic frames.
  - Gifts given to people.
  - Shared activities using affordances (dining, dancing, walking together).
  - Presence animation: gaze, expression, proximity.
  - NPC schedules, to "find them at the garden at six".
- **Dungeon crawl:**
  - Health, damage and combat.
  - Enemies with AI.
  - Traps (pressure plates: the rules can't watch the player's position yet, only counts, vars, states and holding).
  - Loot and equipment, darkness that carried light defeats (a held lantern lighting the way), and procedural level graphs at scale.
- **Horror:**
  - Darkness as a resource: carried light, fuel as a process.
  - Sound design and positional audio.
  - Things that move when unseen (the narrator can only teleport people and reveal things), scripted scares, pursuit, hiding spots (in a wardrobe or under a bed), and doors held shut.
- **Heist:**
  - Guards with patrols and sight cones, noise and detection.
  - Lockpicking or forcing as skill, not a key gate.
  - Disguises, alarms, timed plans, a world clock, and carried loot with weight.
  - Multiple entry routes: reach.js handles keys and barricades but not detection.
- **Survival:**
  - Needs (hunger, cold, fatigue) as processes on the player.
  - Crafting and combining.
  - Fire you can light and fuel.
  - Weather, and the day/night cycle.
  - Gathering from terrain (trees and fields are layout only), building or placing, and spoilage (processes exist).
- **Social drama:**
  - Many NPCs with their own goals and opinions of each other.
  - Gatherings (the narrator can only move people to a room).
  - Group conversation, reputation, and gossip spreading knowledge between frames (frames are static per person).
- **Adventure and exploration:**
  - Seamless travel across hillside, street and house, with vehicles or mounts.
  - Maps, and a "where am I" beyond room names.
  - Vertical traversal (climb, swim).
  - Puzzle props beyond the gate and rule set: mechanisms with more than two states, combination dials, weights and counterweights.
  - Tools used on the world.
- **Engine-level gaps behind these:**
  - Affordances are two-state only.
  - Rules can't watch the player's own position, sight or time on a clock, only things, variables and holding.
  - The narrator's effect list is four verbs.
  - There is no event bus for sound or NPC perception.
  - Processes use the real clock, not a world clock that could be scaled or paused.
