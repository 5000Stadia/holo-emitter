# Every fiction's physical world: an audit (2026-10-11)

## Kabe's words

- **On construct's range:** "go all the way back to construct, it's dynamic intentions and possibilities both through its example story setups and within the code the consideration for range of fiction types along with their individual story mechanisms and how that may translate into world building and engaging with the world mechanics. From this framing do an audit on elements that we need to build naturally to accommodate physical engagement with the expected narrative of those stories and even by extension what dynamically appropriate mechanics we may able to bake in likely chosen by the narrative engine when those thematic elements would kick in (think investigation vs dating sim vs dungeon crawl). Its too ambitious to say this project is building to be literally all game mechanics in one! But if we assume investigation story = investigation mechanics we should consider how we handle all fiction as we have predicted on construct."
- **On weather and time:** "the next addition would be elements of weather, and whether it would be worthwhile to consider the elements of the grass report that support whether objects and mass particle concepts like that. All these elements involving time, Moon phase and weather should have dynamic control programmatically that would extend back into pattern, buffer and construct. Such that the time and weather is established in the story is ingested by pattern buffer as an object within the chronological period."

## My reading

- **Not every game in one.** The aim is a small set of physical **kits**, one for each kind of story construct already runs, plus the shared systems under them. When construct's story engine has a kind of story running, its kit is live in the world.
- **Story conditions belong to the story.** The hour, the date, the moon and the weather are written by the story and kept in pattern-buffer's timeline; holo-emitter only draws them.
- **Placing this on the roadmap is Kabe's call.** The proposal is at the end.

**Sources:**
- Three read-only reports, kept beside this file:
  - [construct.md](construct.md): construct's 155 game types, 9 story shapes, verbs, and what it expects of a world, with file references;
  - [pattern-buffer.md](pattern-buffer.md): time, conditions and a proposed contract;
  - [holo-emitter-mechanics.md](holo-emitter-mechanics.md): what we have, and how far it carries.
- The Grassworks report (§5.1, §5.8, §5.20).
- The engine principles: `design/engine-principles.md`.

## 1. What construct already decided, which this audit builds on

construct already treats every fiction type as its own mechanism, in three layers:
- **155 game-type cards** in 19 families. These are the flavour: what to dwell on, what to skip, the tension shape, win and loss. Each card's "world requires" field is a gate, not flavour text.
- **Nine story shapes,** the engines. Each card maps to one:

  | Shape | Covers | What the player commits to |
  |---|---|---|
  | **Deduction** | investigation, puzzle, decoding | an accusation |
  | **Bond** | romance, dating sim, social drama, negotiation | a declaration; one made too early "rings hollow and is rebuffed" |
  | **Endurance** | survival, horror, disaster | a world event ends it |
  | **Contest** | combat, duel, sport, racing | — |
  | **Gambit** | heist, infiltration, con, politics | — |
  | **Discovery** | exploration, ruins, **dungeon delve** | — |
  | **Mastery** | craft, stewardship, profession | — |
  | **Farce** | mistaken identity, cover-up | going wrong is the engine running |
  | **Transformation** | redemption, quest, tragedy | — |

- **Shapes stack:** "a story is NOT one shape. It is a STACK of shape-layers." Horror is Endurance plus Discovery; a cosy mystery with a romance is Deduction plus Bond.
- **Under all of them, one grammar:**
  - beats;
  - pillars that are genuine, false or unfilled;
  - clocks;
  - pins (salient objects);
  - gauges (numeric quantities such as air).

So holo-emitter's axis should be construct's **nine shapes**, not its 155 cards, and kits should stack as shapes do.

**What construct rules out, which this audit keeps:**
- a numeric HUD ("never a HUD");
- win/loss verdicts;
- turn-count deadlines;
- respawn;
- changing genre because the player struggled;
- open-ended effects.

Its deferred items include a combat and stats layer and NPC schedules. Gauges must therefore show in the world, not on screen: oil in the lamp, frost on your breath, the candle's length.

## 2. What we have (holo-emitter, today)

- **Works with any genre unchanged:**
  - `src/make/works.js`: two-state affordances with gates, locks and keys, one-way deeds, when/then rules, real-time processes, things shut away inside others. It drives 55+ kinds from data.
  - Walking, stairs, places from plans, the light pool.
- **Shaped for investigation, but reusable with new data:**
  - the case layer: papers, a notebook, evidence that breaks lies, questioning by topic or own words, the accusation, the deterministic narrator;
  - presences.
- **Missing:**
  - sound;
  - a world clock in places (only the night bench has hours);
  - people who walk, perceive or work things;
  - relationship state;
  - danger, health or detection;
  - an inventory with use-on, give and combine;
  - affordances with more than two states;
  - rules that watch where you are or what you see;
  - carried light, and fire you light or fuel;
  - weather.
- **The narrator's effects are four:** spawn person, move person, set variable, reveal thing.

## 3. Shared systems first: what nearly every shape needs

Listed in order of how many shapes need each.

| System | Needed by | What it is, physically | Have |
|---|---|---|---|
| **Conditions: hour, date, moon, weather** (§5) | all; pressure in Endurance, Gambit and horror; texture everywhere | sky, sun and moon, lamps lit, fog, rain and snow, wet surfaces, cold breath; NPC availability by hour | the night bench's hour only |
| **People with bodies** (M8) | all but solo Discovery | walk a route, sit, carry, open a door, follow you, keep a schedule ("in the garden at six") | busts that teleport |
| **Perception** | Gambit, Endurance/horror, Farce, Deduction (witnesses, eavesdropping), Bond (privacy) | who can see and hear whom: line of sight, light level, distance, noise; one event bus for "seen" and "heard" | none |
| **Sound** | all; it is the substance of horror, stealth and eavesdropping | ambience by place and hour, footsteps by surface, doors, fire, positional voices | none |
| **Things in hand** | Deduction (show), Bond (give), Gambit (plant), Endurance (carry), Discovery (loot) | an inventory you look into; use-on, give to a person, combine, put down anywhere | take and put on top slots; evidence cards |
| **World-borne gauges** (construct's gauges, no HUD) | Endurance, Discovery (light, supplies), Contest | a quantity a process drains and an action moves, shown on a thing: oil, candle, warmth, air, rope | processes on real time, no world clock |
| **Rules that watch the body** | Gambit (sight, patrol), Discovery (pressure plate), Farce (an entrance), Bond (proximity) | when/then on your position, sight line, distance to a person, or the hour | things, variables and holding only |
| **Staged peril** | Endurance, Discovery, Contest | danger shown before it can harm (construct: "Death is an EFFECT, never a draw"): a cracking floor, a guttering lamp, a step heard | none |

## 4. The shape kits: what each needs physically, and what the story engine would switch on

Each kit is a small set of mechanics that a world carries **when that shape is in the stack**. A kit is made of shared systems plus a little of its own. "Switch on" means what a beat could start when the theme takes over: a beat effect, not a mode change.

| Shape (examples) | Its kit, physically | What a beat could switch on | Have |
|---|---|---|---|
| **Deduction** (investigation, puzzle) | examine closely and compare two things; papers; people where testimony puts them; who-was-where timelines; eavesdropping (perception and sound); an accusation scene with an audience | reveal a thing; move a person; a witness available at an hour; a door now locked | **most of it**: the case layer |
| **Bond** (dating sim, romance, social) | **room-scale interiors** (construct insists: never street scale); the other person beside you, turning, near or far; shared activities on things that work (pour, sit together, walk the gallery); gifts; privacy (who else is in the room); evening light; their memory of what you did | they seek you out at an hour; a third party enters and privacy ends; a shared task begins | interiors and works; no bodies, gifts, privacy or memory |
| **Endurance** (survival, horror) | world-borne gauges (warmth near fire, oil, air); fire you light and feed; darkness that carried light pushes back; refuges and doors held shut; hiding (wardrobe, under the bed); weather as pressure; staged peril; something that moves when unseen | the storm rises; the lamp gutters; a refuge fails; a sound on the stair | hearths lit at build only; no gauges or sound |
| **Discovery** (exploration, **dungeon crawl**) | places in layers that open only once an earlier layer is known; carried light against dark; supplies as gauges; traps (rules on position); loot carried; a way back; inscriptions; maps | a passage opens; a stratum reveals; a trap is staged | places, works, reach.js; no strata or carried light |
| **Gambit** (heist, infiltration, con) | guards with routes and sight; noise and light as cover; locks forced as an attempt, not only a key; disguise as access; alarms; a plan's timing on the world clock; a getaway | a guard's route changes; the alarm; the twist (a reveal) | locks and keys, reach.js; no perception |
| **Contest** (duel, sport, combat) | a rival you can watch for tells; rounds; an attempt drawn from construct's resolution deck and shown as motion, not numbers; a win or loss as a world event | the round begins; the rival's tell shows | none (construct defers combat too) |
| **Mastery** (craft, stewardship) | materials with states beyond two (dough to bread, field to harvest); visible change over days and seasons; being judged by a person | a buyer arrives; a season turns | processes and works (bread oven, spinning wheel) |
| **Farce** (cover-up, mistaken identity) | doors and rooms for near-misses; people with timed entrances; things to hide; a deadline event | someone arrives early; the hidden thing is found | doors and works; no schedules |
| **Transformation** (redemption, quest) | the costly deed as a physical act (give up the relic, burn the letter); places that show before and after; one to be saved, whose fate you can see | the temptation is offered; the place changes | works (burn and give need adding) |

**Investigation vs dating sim vs dungeon crawl, side by side:**
- **Investigation** is nearly built. It is the case.
- **Dating sim** is the cheapest second shape for the manor: one room, one person, things that already work. It needs bodies (M8) and, of its own, only three things: proximity and gaze, gifts, and privacy. construct calls Bond its falsifier, the one shape that must resolve with no clue trail, which makes it the right test of whether our kits are real.
- **Dungeon crawl** sits under Discovery. Its own needs are carried light against dark, gauges, traps watched by position, and loot. construct itself has no health or loot engine, so we would be building ahead of the story engine there.

## 5. Conditions: the hour, the moon and the weather as the story's

**pattern-buffer can hold all of it today, with no engine change** ([pattern-buffer.md](pattern-buffer.md)). Every fact already carries a span of story time and a learned-at position, and every read can be asked "as of" a moment.

**The contract proposed by the pattern-buffer reader:**
- **Stored, written by the story through construct:**
  - the calendar, anchored to a real date and place (start date, Julian or Gregorian, latitude and longitude);
  - the minutes clock, each advance dated to its turn;
  - weather, one record per region: sky, cloud, rain or snow, visibility, wind, temperature;
  - any condition a clue rests on ("the moon was bright; I saw his face"), stated as a fact, so a lie about it can be caught.
- **Never stored, by pattern-buffer's rule that nothing derivable is kept:** hour, sun and moon direction, moon phase, season, light level. holo-emitter works them out to draw them; construct works out "dusk" for its prose.
- **Who writes:**
  - holo-emitter writes nothing. It **proposes** time passing ("rest till dawn", a long walk) in its report of what the player did.
  - construct commits each proposal to pattern-buffer in one step, dated to the turn.
  - construct ships a conditions block beside its deck of beats, on the same `?since=v` poll.
  - One new effect, `set_conditions`, joins the closed list a beat may trigger.
- **One finding you should hear:** pattern-buffer's prose reader drops atmosphere by design (`ingest.py:223-224, 272`). Weather written only in story prose is lost; construct must state it as a fact.
- **For 1660:** England kept the Julian calendar, 10 days behind, so the sun and moon must be computed from the Gregorian date.

**How holo-emitter would draw it:**
- **Sky and light:** already working on the night bench, as one set of values for the whole look. The bench's moon has no phase yet; it needs a real ephemeris from date and place.
- **Rain, snow, mist, embers, dust:** the Grassworks report's stateless particles (§5.20). Each drop's position comes from its number and the time, in the vertex shader. There is no per-particle work on the processor, it's one draw, and it works on both renderers.
- **Wind:** the same function moves the rain, the grass (R69), the trees and the smoke, so they all lean together.
- **Density by tier:** the rank-once rule (§5.1 and engine principle 1), so a phone shows a strict subset of the desktop's drops.
- **Wet and snowy ground:**
  - roughness and darkening by wetness on the ground map;
  - lying snow and puddles in the map's wear channels;
  - footprints in snow or mud with the trail stamp (§5.8). They fade only if the story says it snowed again: lasting marks belong to the document (engine principle 3).
- **Indoors:** rain on the glass, a draught that moves the candle, the sound of it (sound again).
- **The Grassworks pattern to avoid:** particles run on the processor (its leaves cost 2.4 ms a frame).

**pattern-buffer's own answer (mail macfc8d, 2026-10-11): "yes, it fits"**, with no new primitive and no engine change. Its five refinements:
1. **One clock per world, never two.**
   - If the world's time axis is story minutes (as its 1660 trial was, which takes the 21:00–01:00 timeline natively), that axis *is* the clock, and a stored minutes counter would drift from it.
   - If it stays turns, as construct does, the dated minute advances are the clock, and construct's clock reader must take "as of".
   - The choice is construct's. pattern-buffer leans to story minutes for an authored case and turns for open play.
2. **Weather hangs over its region by its own relation** (`weather:x · over · place:y`), not "in" it. Containment is the tree of things, and weather would show up as an object in the room. We find a room's weather by walking up to the first region that has some.
3. **Unknown weather is invented once and kept,** marked `generated`. What beats write is marked `stated`, so invented skies show as invented.
4. **Conditions a clue rests on are stated facts.** pattern-buffer has no sky arithmetic, so the check that a stated "no moon that night" agrees with the computed one belongs to construct or to us.
5. **Keep the prose rule that drops atmosphere.** It stops "the gloom pressed in" becoming invented state rows. If you later want weather read from prose ("it was raining hard when we reached the vault"), the safe form is narrow and opt-in: only into weather attributes declared in advance. That would come to you as a proposal.
- **On (b): yes.** With latitude and longitude, construct should take dusk from the sun.

**Open questions, as they now stand:**
- **(a)** Story minutes or turns: construct's call. pattern-buffer leans to story minutes for an authored case.
- **(b)** Settled by pattern-buffer's yes, pending construct: real sunrise and sunset where a place has latitude and longitude.
- **(c)** Who hosts the link for phones? That's already your call.

## 6. How the story engine would pick mechanics, without "all mechanics in one"

- **Kits ride construct's shapes:**
  - construct already sends a world's type list (`meta.game_type`, a list, so blends work) and its shape stack;
  - holo-emitter loads the kits for those shapes when a place is built;
  - a mid-chapter shift (construct's tangent adoption) or a reshape between chapters adds a kit.
  - Shared systems stay on throughout; a kit adds only what its shape owns.
- **The effect list stays closed, but grows by kit:**
  - **Today:** spawn person, move person, set variable, reveal thing.
  - **Shared additions:** `set_conditions`, and a gauge effect.
  - **Each kit adds its own few,** for example:
    - Bond: someone seeks you out;
    - Endurance: stage a peril;
    - Gambit: set a guard's route.
  - All stay closed and bounded, as construct requires ("no open-ended effects or rooms").
- **Building ahead of the story engine:** construct has no relationship meter, no health, loot or combat, no NPC schedules and no switching shape between chapters yet. Where a kit needs one, we build the physical half and propose the story half to construct; we don't invent it alone.

## 7. Proposal for the roadmap (your call; nothing is placed)

1. **Conditions, small.** Hour, date and moon from the story's calendar, drawn in the manor and on the street; weather records drawn as sky, fog, rain and snow (stateless particles) and wet ground; `set_conditions`; the contract settled with construct and pattern-buffer.
   - **Default:** a new item in M9 beside R69 (ground and sky), since R69 already owns sky and fire.
   - **Alternative:** right after M7, because the case already has a timeline from 21:00 to 01:00 on Michaelmas night 1660, which the house could show.
2. **Sound and perception,** one item each: shared systems almost every shape leans on. **Default:** a new milestone after M9, "The world answers".
3. **Shape kits, one at a time, each with a probe world built from construct's own:**
   - **Bond first,** in the manor: one room and one person. It needs M8's bodies.
   - **Then Endurance** (horror in the manor at night), **then Discovery** (a dungeon or a ruin, with carried light).
   - The others follow as construct's shapes mature.
   - **Default:** under Later until M8 lands.
4. **Not building:** combat or stats beyond what construct's resolution deck shows; a HUD; any genre construct doesn't run.

**Before any of this,** two fresh views from other model families on the kit split. Changing what places are built from is costly to undo.
